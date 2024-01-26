((
  { id, platform, pipyExec, directorySeparatorChar, global } = pipy.solve('utils.js'),

  { insert_log_db, } = pipy.solve('db.js'),

  ping = data => (
    platform === 0 ? (
      data?.split?.('\n')?.filter?.(e => e.includes('%') || e.includes(' = '))?.map?.(
        e => (
          e.includes('%') ? (
            { loss: e.split('=')?.[3]?.replace('(', '%')?.split('%')?.[1] }
          ) : e.includes('ms') ? (
            (array = e.replaceAll('ms', '=').split('=')) => array ? ({
              min: array[1].trim(),
              avg: array[5].trim(),
              max: array[3].trim(),
            }) : {}
          )() : {}
        )
      )?.reduce?.((obj, item) => Object.assign(obj, item), {})
    ) : platform === 1 ? (
      data?.split?.('\n')?.filter?.(e => e.includes('loss') || e.includes('/max/'))?.map?.(
        e => (
          e.includes('loss') ? (
            { loss: e.split(',')?.[2]?.split?.(' ')?.[1]?.replace?.('%', '') }
          ) : e.includes('/max/') ? (
            (array = e.replaceAll(' ', '/').split('/')) => array ? ({
              min: array[6],
              avg: array[7],
              max: array[8],
            }) : {}
          )() : {}
        )
      )?.reduce?.((obj, item) => Object.assign(obj, item), {})
    ) : (
      data?.split?.('\n')?.filter?.(e => e.includes('loss') || e.includes('round-trip'))?.map?.(
        e => (
          e.includes('loss') ? (
            { loss: e.split(',')?.[2]?.split?.('%')?.[0]?.trim() }
          ) : e.includes('round-trip') ? (
            (array = e.split('=')?.[1]?.trim?.()?.split('/')) => array ? ({
              min: array[0],
              avg: array[1],
              max: array[2],
            }) : {}
          )() : {}
        )
      )?.reduce?.((obj, item) => Object.assign(obj, item), {})
    )
  ),

  timestamp = Date.now(),
  restart = false,

) => pipy({
  _obj: null,
  _cmd: null,
  _err: null,
  _data: null,
  _verb: null,
  _target: null,
  _message: null,
  _startTime: null,
})

.pipeline()
.onStart(
  () => (
    _startTime = Date.now(),
    _cmd = undefined,
    _data = new Data
  )
)
.replaceMessage(
  msg => (
    invoke(
      () => (_obj = JSON.decode(msg.body)) && (
        _verb = _obj.verb,
        _verb === 'enable-proxy' ? (
          _cmd = ['.\\tools\\enable.cmd']
        ) : _verb === 'disable-proxy' ? (
          _cmd = ['.\\tools\\disable.cmd']
        ) : _verb === 'ping' ? (
          platform === 0 ? (
            _cmd = 'ping ' + _obj.target
          ) : (
            _cmd = 'ping -c 4 ' + _obj.target
          )
        ) : _verb === 'download' ? (
          _cmd = ['curl', '-vk', _obj.target]
        ) : _verb === 'osquery' ? (
          platform === 0 ? (
            _cmd = ['.\\tools\\osqueryi.exe', '--json', _obj.target]
            , console.log('osquery command:', _cmd)
          ) : (
            _cmd = ['tools/osqueryi', '--json', _obj.target]
          )
        ) : _verb === 'upgrade' ? (
          platform === 0 ? (
            pipyExec(['robocopy', '..' + directorySeparatorChar + 'pjs' + directorySeparatorChar, '..' + directorySeparatorChar + 'pjs_rollback' + directorySeparatorChar, '/s', '/e'])
          ) : (
            pipyExec(['cp', '-rf', '..' + directorySeparatorChar + 'pjs', '..' + directorySeparatorChar + 'pjs_rollback'])
          ),
          _cmd = ['tar', '-C', '..', '-xvf', '..' + directorySeparatorChar + _obj.target.split('?')?.[1]]
          , console.log('=== upgrade ===', _cmd)
        ) : _verb === 'rollback' ? (
          os.stat('..' + directorySeparatorChar + 'pjs_rollback_last' + directorySeparatorChar)?.isDirectory?.() ? (
            platform === 0 ? (
              pipyExec(['cmd.exe', '/C', 'move', '/Y', '..' + directorySeparatorChar + 'pjs_rollback_last', '..' + directorySeparatorChar + 'pjs_rollback'])
            ) : (
              pipyExec(['mv', '-f', '..' + directorySeparatorChar + 'pjs_rollback_last', '..' + directorySeparatorChar + 'pjs_rollback'])
            ),
            timestamp = Date.now(),
            restart = true,
            _message = new Message({status: 200}, "OK")
            , console.log('=== rollback ===', restart)
          ) : (
            _message = new Message({status: 200}, "No available rollback detected.")
          )
        ) : (
          _cmd = null
        )
      ),
      (error) => (
        _cmd = null,
        _err = error
      )
    ),
    new Message({ status: 200 })
  )
)
.branch(
  () => _cmd, (
    $=>$
    .link('exec')
    .link('resolve')
  ),
  () => _message, (
    $=>$.replaceMessage(
      () => _message
    )
  ),
  () => _cmd === null, (
    $=>$.replaceMessage(
      () => new Message({ status: 200 }, { status: 'FAIL', message: _err || 'ERROR: bad verb' })
    )
  )
)

.pipeline('exec')
.onStart(new Data)
.exec(() => _cmd)
.replaceData(
  dat => (
    dat.size > 0 && (
      // console.log('exec data size:', dat.size),
      _data.push(dat)
    ),
    new Data
  )
)

.pipeline('resolve')
.replaceStreamEnd(
  evt => (
    _data ? (
      invoke(
        () => (
          _verb === 'enable-proxy' || _verb === 'disable-proxy' ? (
            _obj = { output: _data.toString() },
            insert_log_db(id, 'proxy', _verb)
            , console.log('system-proxy:', _verb)
          ) : _verb === 'ping' ? (
            _obj = ping(new Data(_data.toArray().filter(c => c < 0x80)).toString())
          ) : _verb === 'download' ? (
            _obj = { status: 'OK', time: Date.now() - _startTime, "size": _data.size }
          ) : _verb === 'osquery' ? (
            // _obj = JSON.decode(new Data(_data.toArray().filter(c => c < 0x80)))
            _obj = _data
          ) : _verb === 'upgrade' ? (
            _obj = _data,
            new Data(_data.toArray().filter(c => c < 0x80)).toString().includes('pjs/internal/tunnel-main.js') && (
              timestamp = Date.now(),
              restart = true
              , console.log('=== restart ===', restart)
            )
          ) : (
            _obj = {}
          ),
          _data = null,
          [
            new MessageStart({ status: 200 }),
            _verb === 'osquery' ? (
              // new Data(JSON.encode(_obj))
              _obj
            ) : _verb === 'upgrade' ? (
              _obj
            ) : (_obj instanceof Array || Object.keys(_obj || {}).length > 0) ? (
              new Data(JSON.stringify({ status: 'OK', result: _obj }, null, 2))
            ) : (
              new Data(JSON.stringify({ status: 'FAIL', message: _err || 'ERROR: bad output' }, null, 2))
            ),
            new MessageEnd,
            evt
          ]
        ),
        (error) => (
          [
            new MessageStart({ status: 200 }),
            new Data(JSON.stringify({ status: 'FAIL', message: error || 'ERROR: bad output' }, null, 2)),
            new MessageEnd,
            evt
          ]
        )
      )
    ) : evt
  )
)

.task('1s')
.onStart(
  () => (
    (__thread.id === 0) && (Date.now() - timestamp > 3000) && (
      restart ? (
        restart = false,
        pipy.restart()
        , console.log('=== pipy.restart() ===')
      ) : global.rollbackMtime && (
        os.stat('..' + directorySeparatorChar + 'pjs_rollback_last' + directorySeparatorChar)?.isDirectory?.() && (
          platform === 0 ? (
            pipyExec(['cmd.exe', '/C', 'move', '/Y', '..' + directorySeparatorChar + 'pjs_rollback_last', '..' + directorySeparatorChar + 'pjs_rollback_' + Date.now()])
          ) : (
            pipyExec(['mv', '-f', '..' + directorySeparatorChar + 'pjs_rollback_last', '..' + directorySeparatorChar + 'pjs_rollback_' + Date.now()])
          )
        ),
        platform === 0 ? (
          pipyExec(['cmd.exe', '/C', 'move', '/Y', '..' + directorySeparatorChar + 'pjs_rollback', '..' + directorySeparatorChar + 'pjs_rollback_last'])
        ) : (
          pipyExec(['mv', '-f', '..' + directorySeparatorChar + 'pjs_rollback', '..' + directorySeparatorChar + 'pjs_rollback_last'])
        ),
        global.rollbackMtime = undefined
        , console.log('=== Archive rollback directory ===')
      )
    ),
    // console.log('task ......'),
    new StreamEnd
  )
)

)()
