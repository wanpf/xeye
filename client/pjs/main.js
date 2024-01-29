((
  { platform, pipyExec, sysinfo } = pipy.solve('utils.js'),

  config = JSON.decode(pipy.load('config.json')),

  { db, localTimeString, insert_connection, close_connection, select_log_proxy } = pipy.solve('db.js'),

  { capture } = pipy.solve('capture.js'),

) => pipy({
  _records: undefined,
  _forward: undefined,
  _message: undefined,
})

.export('main', {
  __infos: null,
  __server: null,
  __recordConnection: null,
  __recordSession: null,
  __recordHTTP: null,
  __recordRequest: null,
  __recordResponse: null,
})

.import({
  __token: 'internal',
})

.repeat(
  Object.entries(config.servers),
  ($, [addr, v]) => $
  .listen(addr, { protocol: 'tcp', ...v, ...(v.maxConnections > 0 && { maxConnections: Math.ceil(v.maxConnections / __thread.concurrency) }) })
  .onStart(
    () => (
      __infos = { connectiedTS: Date.now() },
      __server = v,
      __recordConnection = insert_connection(capture.record.id, 'tcp', __inbound.remoteAddress, __inbound.remotePort, localTimeString()),
      new Data
    )
  )
  .onEnd(
    () => close_connection(__recordConnection.id, localTimeString())
  )
  .use('proxy-main.js', 'proxy'),
)

.branch(
  config?.configs?.dbQueryPort > 0, (
    $=>$
    .listen(config?.configs?.dbQueryPort)
    .demuxHTTP().to(
      $=>$
      .handleMessageStart(
        msg => (
          msg.head.path.startsWith('/api/message-body/') ? (
            (
              record,
              id = +msg.head.path.substring(18)
            ) => (
              (id > 0) && (record = db.sql(`select h.content_type, m.body from message m join http h on m.session_id == h.id where m.id = ${id}`).exec()?.[0]) ? (
                _message = new Message({ status: 200, headers: { 'content-type': record.content_type || 'application/octet-stream' } }, record.body)
              ) : (
                _message = new Message({ status: 404 })
              )
            )
          )() : msg.head.path.startsWith('/upload/') ? (
            _forward = 'upload'
          ) : msg.head.path.startsWith('/upgrade?') ? (
            _forward = 'upgrade'
          ) : msg.head.path === '/rollback' && (
            _forward = 'rollback'
          ),
          _forward && !(msg.head.headers?.trust === 'flomesh') && (
            _message = new Message({ status: 403 }, 'Forbidden')
          )
        )
      )
      .branch(
        () => _message, (
          $=>$.replaceMessage(() => _message)
        ),
        () => _forward === 'upload', (
          $=>$.use('upload.js')
        ),
        () => _forward === 'upgrade' || _forward === 'rollback', (
          $=>$
          .replaceMessage(
            msg => new Message({}, JSON.encode({ verb: _forward, target: msg.head.path }))
          )
          .use('invoke.js')
        ),
        (
          $=>$
          .replaceMessage((
            (
              headers = { 'content-type': 'application/json' },
              web = new http.Directory('/admin', {
                fs: false,
                index: ['index.html', 'index.htm'],
              }),
            ) => (
              req => (
                _message =
                req.head.path.startsWith('/api/login') ? invoke(
                  (json) => (
                    json = JSON.decode(req.body),
                    json?.user === config.configs.username && json?.password === config.configs.password ? (
                      new Message(
                        { status: 200 },
                        JSON.encode({ token: new Data(json.user + ':' + json.password).toString('base64') })
                      )
                    ) : (
                      new Message({ status: 401 })
                    )
                  ),
                  (error) => new Message(
                    { status: 500, headers },
                    JSON.encode({ error })
                  ),
                ) : req.head.path === '/api/version' ? invoke(
                  () => new Message(
                    { status: 200, headers },
                    JSON.stringify({
                      'pipy': platform === 0 ? pipyExec('pipy.exe -v') : pipyExec('pipy -v'),
                      'proxy-script': config?.configs?.version,
                    }, null, 2)
                  ),
                  (error) => new Message(
                    { status: 500, headers },
                    JSON.encode({ error })
                  ),
                ) : req.head.path === '/api/info' ? (
                  (
                    rec = select_log_proxy()
                  ) => (
                    rec?.remark === 'disable-proxy' ? (
                      new Message({ status: 200 }, JSON.stringify({ ...sysinfo, 'systemProxy': 'off' }, null, 2))
                    ) : (
                      new Message({ status: 200 }, JSON.stringify({ ...sysinfo, 'systemProxy': 'on' }, null, 2))
                    )
                  )
                )() : req.head.path.startsWith('/api/invoke') ? (
                  _forward = 'invoke',
                  _message = req
                ) : req.head.path.startsWith('/api/replay') ? (
                  _forward = 'replay',
                  _message = req
                ) : req.head.path.startsWith('/os') ? (
                  _forward = 'invoke',
                  _message = new Message({}, JSON.encode({ verb: "osquery", target: req.body?.toString?.() }))
                  , console.log('os message:', _message), _message
                ) : req.head.path.startsWith('/api') ? invoke(
                  () => new Message(
                    { status: 200, headers },
                    (
                      _records = db.sql(req.body.toString()).exec(),
                      JSON.encode((_records || []).map(
                        r => (
                          r.body && (r.body = r.body.toString('base64')),
                          r
                        )
                      ))
                    )
                  ),
                  (error) => new Message(
                    { status: 500, headers },
                    JSON.encode({ error })
                  ),
                ) : (
                  web.serve(req)
                )
              )
            )
          )())
          .branch(
            () => _forward === 'invoke', (
              $=>$.use('invoke.js')
            ),
            () => _forward === 'replay', (
              $=>$.use('replay.js')
            ),
            () => _message, (
              $=>$
            )
          )
        )
      )
    )
  )
)

.branch(
  Object.keys(config?.global?.enableTunnel && config?.internal || {}).length > 0, (
    $=>$.task().use('internal/main.js')
  )
)

)()
