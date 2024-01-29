((
  { id, platform } = pipy.solve('utils.js'),

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
        _verb === 'renew-ca' ? (
          _obj.target = JSON.decode(new Data(_obj.target)),
          _obj.target?.organization && _obj.target?.commonName ? (
            platform === 0 ? (
              _cmd = [ 'crt\\openssl.exe', 'req', '-subj', '/CN=' + _obj.target.commonName + '/OU=IT/C=CN/O=' + _obj.target.organization, '-new', '-newkey', 'rsa:2048', '-sha256', '-days', '365', '-nodes', '-config', 'crt\\openssl.cnf', '-x509', '-keyout', 'crt\\CA.key', '-out', 'crt\\CA.crt' ]
            ) : (
              _cmd = [ 'openssl', 'req', '-subj', '/CN=' + _obj.target.commonName + '/OU=IT/C=CN/O=' + _obj.target.organization, '-new', '-newkey', 'rsa:2048', '-sha256', '-days', '365', '-nodes', '-x509', '-keyout', 'crt/CA.key', '-out', 'crt/CA.crt' ]
            )
          ) : (
            _message = new Message({status: 200}, "Bad organization or commonName")
          )
        ) : _verb === 'enable-proxy' ? (
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
          ) : (
            _cmd = ['tools/osqueryi', '--json', _obj.target]
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
.exec(() => _cmd, { stdout: true, stderr: true })
.replaceData(
  dat => (
    dat.size > 0 && (
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
          _verb === 'renew-ca' ? (
            _data.toString().includes('++++++++++++++++++++') ? (
              _obj = { message: 'Succeeded' },
              timestamp = Date.now(),
              restart = true,
              console.log('=== renew-ca restart ===', restart)
            ) : (
              _obj = { message: 'Failed' }
            )
          ) : _verb === 'enable-proxy' || _verb === 'disable-proxy' ? (
            _obj = { output: _data.toString() },
            insert_log_db(id, 'proxy', _verb),
            console.log('system-proxy:', _verb)
          ) : _verb === 'ping' ? (
            _obj = ping(new Data(_data.toArray().filter(c => c < 0x80)).toString())
          ) : _verb === 'download' ? (
            _obj = { status: 'OK', time: Date.now() - _startTime, "size": _data.size }
          ) : _verb === 'osquery' ? (
            _obj = _data
          ) : (
            _obj = {}
          ),
          _data = null,
          [
            new MessageStart({ status: 200 }),
            _verb === 'osquery' ? (
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
      restart && (
        restart = false,
        pipy.restart(),
        console.log('=== pipy.restart() ===')
      )
    ),
    new StreamEnd
  )
)

)()
