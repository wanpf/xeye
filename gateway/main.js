((
  config = JSON.decode(pipy.load('config.json')),

  backend = { lists: {}, services: {} },

  swapStructs = {},

  listenIpPort = [],

  listenerArray = new ListenerArray,

  loadBackend = () => (
    backend.lists = JSON.decode(pipy.load('backend.json')),
    backend.services = {},
    listenIpPort = [],
    Object.keys(backend.lists || {}).forEach(
      id => (
        backend.lists[id].id = id,
        Object.keys(backend.lists[id].services || {}).forEach(
          addr => (
            backend.services[addr] ? (
              console.log('The service address conflicts:', addr)
            ) : (
              backend.services[addr] = backend.lists[id],
              listenIpPort.push(addr)
            )
          )
        )
      )
    ),
    listenerArray.set(listenIpPort)
  ),

  web = new http.Directory('/admin', {
    fs: false,
    index: ['index.html', 'index.htm'],
  }),

  printTimeString = (now = new Date()) => (
    '[' + now.getFullYear()
    + '/' + ('0' + (now.getMonth() + 1)).slice(-2)
    + '/' + ('0' + now.getDate()).slice(-2)
    + ' ' + ('0' + now.getHours()).slice(-2)
    + ':' + ('0' + now.getMinutes()).slice(-2)
    + ':' + ('0' + now.getSeconds()).slice(-2)
    + ']'
  ),

  clientRegisterTime = {},

  token = 'Basic ' + new Data((config.username || '') + ':' + (config.password || '')).toString('base64'),

  tokenStructs = {},

) => (

loadBackend(),

pipy({
  _id: '',
  _pos: -1,
  _isTunnel: false,
  _member: undefined,
  _target: undefined,
  _service: undefined,
  _swap: undefined,
  _session: undefined,
  _message: undefined,
  _html: undefined,
  _token: undefined,
})

.watch('backend.json')
.onStart(
  () => (
    loadBackend(),
    new StreamEnd
  )
)

.listen(listenerArray)
.onStart(new Data)
.handleStreamStart(
  () => (
    (_service = backend.services?.[_target = __inbound.localAddress + ':' + __inbound.localPort]) || (
      _service = backend.services?.[_target = '0.0.0.0:' + __inbound.localPort]
    ),
    (_target = _service?.services?.[_target]) && (
      _swap = swapStructs[_id = _service.id]
    )
    , console.log('Port-forwarding', _id, _target, _service, _swap)
  )
)
.link('forward')

.pipeline('forward')
.branch(
  () => _swap, (
    $=>$
    .connectHTTPTunnel(
      () => new Message({
        method: 'CONNECT',
        path: _target,
      })
    ).to(
      $=>$
      .muxHTTP(() => swapStructs[_id], { version: 2 }).to(
        $=>$
        .link(() => swapStructs[_id])
      )
    )
  ),
  (
    $=>$.replaceStreamStart(
      () => new StreamEnd
    )
  )
)

.listen(config?.listen, { idleTimeout: 600 })
.acceptTLS({
  certificate: () => ({
    cert: new crypto.Certificate(pipy.load(config?.tlsCert)),
    key: new crypto.PrivateKey(pipy.load(config?.tlsKey)),
  }),
  trusted: config?.tlsCA ? [new crypto.Certificate(pipy.load(config?.tlsCA))] : [],
}).to(
  $=>$.demuxHTTP().to(
    $=>$.handleMessageStart(
      msg => (msg.head.method === 'CONNECT') && (_isTunnel = true)
    )
    .branch(
      () => _isTunnel, (
        $=>$
        .acceptHTTPTunnel(
          msg => (
            _target = msg?.head?.path || '',
            _member = backend.lists?.[_target.toUpperCase()],
            !_member && (
              _member = backend.lists[_target.toUpperCase()] = { id: _target, services: {} },
              console.log('New client:', _member)
            ),
            config?.enableDebug && (
              console.log("client member:", _target, _member)
            ),
            _member ? (
              new Message({ status: 200 })
            ) : (
              new Message({ status: 404 })
            )
          )
        ).to(
          $=>$
          .onStart(
            () => (
              clientRegisterTime[_target] = printTimeString(),
              new Data
            )
          )
          .handleStreamEnd(
            () => (
              console.log('session - client closed, target:', _target),
              _session = swapStructs[_target] = null,
              delete swapStructs[_target]
            )
          )
          // .connect(() => _target)
          .link(() => (
            swapStructs[_target] = new Swap,
            !_session && (_session = swapStructs[_target])
          ))
          .handleStreamEnd(
            () => (
              _session && (
                _session === swapStructs[_target] ? (
                  console.log('session - server closed, target:', _target),
                  _session = swapStructs[_target] = null,
                  delete swapStructs[_target]
                ) : (
                  console.log('session - client renew, target:', _target)
                )
              )
            )
          )
        )
      ),
      (
        $=>$.replaceMessage(
          new Message({ status: 403 }, 'Forbidden')
        )
      )
    )
  )
)

.listen(config?.guiListen, { idleTimeout: 600 })
.demuxHTTP().to(
  $=>$
  .handleMessage(
    msg => (
      /*
      msg?.head?.headers?.['authorization'] !== token ? (
        _message = new Message({ status: 401, headers: { 'WWW-Authenticate': 'Basic realm=gateway' } })
      ) :
      */
      msg.head.path.startsWith('/api/login') ? (_message = invoke(
        (json) => (
          json = JSON.decode(msg.body),
          json?.user === config.username && json?.password === config.password ? (
            new Message(
              { status: 200 },
              JSON.encode({ token: new Data(json.user + ':' + json.password).toString('base64') })
            )
          ) : (
            new Message({ status: 401 })
          )
        ),
        (error) => new Message(
          { status: 500, headers: { 'content-type': 'application/json' } },
          JSON.encode({ error })
        ),
      )) :
      /*
      msg?.head?.path === '/' ? (
        _html = '<html><meta http-equiv="content-type" content="text/html; charset=utf-8"><title>辽宁移动桌面加速器</title>User list:<br>',
        Object.keys(swapStructs || {}).forEach(
          c => (
            _html += `<a target="_blank" href="/${c}/">${clientRegisterTime[c]} ${c}</a><br>`
          )
        ),
        _html += '<html>',
        _message = new Message({ status: 200 }, _html)
      ) :*/ msg?.head?.path === '/users' ? (
        _message = new Message({ status: 200 }, JSON.encode(Object.keys(swapStructs || {})))
      ) : (
        (
          items = msg?.head?.path?.split('/'),
        ) => (
          (_id = items?.[1]) && (_swap = swapStructs[_id]) ? (
            !tokenStructs[_id] && (
              // tokenStructs[_id] = 'Basic ' + new Data(_id).toString('base64')
              tokenStructs[_id] = 'Basic ZmxvbWVzaDpmbG9tZXNo'
            ),
            msg.head.headers['authorization'] = tokenStructs[_id],
            _target = '127.0.0.1:6060',
            items.length > 2 ? (
              msg.head.path = msg.head.path.replace(_id + '/', '')
            ) : (
              msg.head.path = msg.head.path.replace(_id, '')
            )            
          ) : (
            _message = web.serve(new Message({ ...msg.head }))
          )
        )
      )(),
      !_message && (_message = null)
    )
  )
  .branch(
    () => _message, (
      $=>$.replaceMessage(
        () => _message
      )
    ),
    () => _message === null, (
      $=>$.muxHTTP(() => swapStructs[_id], { version: 1 }).to(
        $=>$.link('forward')
      )
    )
  )
)

))()
