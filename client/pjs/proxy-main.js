((
  config = JSON.decode(pipy.load('config.json')),

  {
    localTimeString,
    update_connection,
    insert_session,
    update_session,
    insert_http,
    update_http,
    insert_message,
    update_message,
  } = pipy.solve('db.js'),

) => (

pipy({
  _pos: -1,
  _type: null,
  _domain: null,
  _target: null,
  _requestHeadText: null,
  _requestBodyBlob: null,
  _responseHeadText: null,
  _responseBodyBlob: null,
  _origPath: undefined,
  _requestBeginTime: null,
  _requestEndTime: null,
  _requestSize: 0,
  _responseBeginTime: null,
  _responseEndTime: null,
  _responseSize: 0,
})

.import({
  __infos: 'main',
  __recordConnection: 'main',
  __recordSession: 'main',
  __recordHTTP: 'main',
  __recordRequest: 'main',
  __recordResponse: 'main',
  __target: 'ssl',
})

.pipeline('proxy')
.demuxHTTP().to(
  $=>$
  .handleMessageStart(
    msg => (
      _requestBeginTime = Date.now(),
      (msg?.head?.method === 'CONNECT') ? (
        _type = 'https'
      ) : msg?.head?.path?.startsWith('http://') ? (
        _type = 'http'
      ) : (
        _type = 'unsurport'
      ),
      config?.configs?.enableDebug && (
        console.log('proxy type, message:', _type, msg)
      ),
      ((_type !== 'https') || !config?.configs?.sslInterception) && (
        __recordSession = insert_session(__recordConnection.id, _type, localTimeString(_requestBeginTime), 0)
      )
    )
  )
  .branch(
    () => _type === 'http', (
      $=>$.link('http')
    ),
    () => _type === 'https', (
      $=>$.link('https')
    ),
    (
      $=>$.replaceMessage(
        () => (
          new Message({ status: 403 })
        )
      )
    )
  )
)

.pipeline('http')
.handleMessageStart(
  msg => (
    __infos.gotRequestHeadersTS = Date.now(),
    (_pos = msg.head.path.indexOf('/', 7)) > 7 && (
      _target = msg.head.path.substring(7, _pos),
      _origPath = msg.head.path,
      msg.head.path = msg.head.path.substring(_pos),
      (_pos = _target.indexOf(':')) > 0 ? (
        _domain = _target.substring(0, _pos)
      ) : (
        _domain = _target,
        _target = _target + ':80'
      ),
      msg.head.headers['x-b3-traceid'] = msg.head.headers['x-b3-spanid'] = algo.uuid().substring(0, 18).replaceAll('-', '')
    ),
    config?.configs?.saveHeadAndBody && (
      _requestBodyBlob = new Data,
      _requestHeadText = JSON.stringify(msg.head, null, 2)
    ),
    __recordHTTP = insert_http(__recordSession.id, _type, msg.head.method, 0, _domain, msg.head.path),
    __recordRequest = insert_message(__recordConnection.id, __recordSession.id, _type, 0, localTimeString())
  )
)
.branch(
  config?.configs?.saveHeadAndBody, (
    $=>$.handleData(
      dat => _requestBodyBlob.push(dat)
    )
  )
)
.handleMessageEnd(
  msg => (
    __infos.doneRequestTS = Date.now(),
    _requestSize = (msg?.tail?.headSize || 0) + (msg?.tail?.bodySize || 0),
    update_message(__recordRequest.id, _requestHeadText, _requestBodyBlob, JSON.stringify(msg.tail), localTimeString(_requestEndTime = Date.now()))
  )
)
.branch(
  () => _target, (
    $=>$.muxHTTP().to(
      $=>$.link('connect')
    )
  ), (
    $=>$.replaceMessage(
      () => new Message({ status: 400 })
    )
  )
)
.handleMessageStart(
  msg => (
    config?.configs?.saveHeadAndBody && (
      _responseBodyBlob = new Data,
      _responseHeadText = JSON.stringify(msg.head, null, 2)
    ),
    update_http(__recordHTTP.id, msg.head?.status || 0, msg.head?.headers['content-type'] || ''),
    __recordResponse = insert_message(__recordConnection.id, __recordSession.id, _type, 1, localTimeString(_responseBeginTime = Date.now()))
  )
)
.branch(
  config?.configs?.saveHeadAndBody, (
    $=>$.handleData(
      dat => _responseBodyBlob.push(dat)
    )
  )
)
.handleMessageEnd(
  msg => (
    __infos.target = _target,
    __infos.doneProxyTS = Date.now(),
    _responseEndTime = Date.now(),
    _responseSize = (msg?.tail?.headSize || 0) + (msg?.tail?.bodySize || 0),
    update_message(__recordResponse.id, _responseHeadText, _responseBodyBlob, JSON.stringify(msg.tail), localTimeString()),
    update_session(__recordSession.id, 'http', localTimeString(_requestEndTime), _requestSize, localTimeString(_responseBeginTime), localTimeString(_responseEndTime), _responseSize, _responseEndTime - _requestBeginTime, 1),
    update_connection(__recordConnection.id, 'tcp', __recordConnection.server_ip, __recordConnection.server_port)
  )
)

.pipeline('https')
.acceptHTTPTunnel(
  msg => (
    _target = msg.head.path,
    (_pos = _target.indexOf(':')) > 0 ? (
      _domain = _target.substring(0, _pos)
    ) : (
      _domain = _target,
      _target = _target + ':443'
    ),
    new Message({ status: 200 })
  )
).to(
  $=>$
  .branch(
    () => config?.configs?.sslInterception, (
      $=>$
      .onStart(() => void (__target = _target))
      .use('ssl.js', 'ssl-intercept')
    ),
    (
      $=>$.link('connect')
    )
  )
)
.handleStreamEnd(
  () => (
    _responseEndTime = Date.now(),
    __recordSession && update_session(__recordSession.id, 'https', null, null, null, localTimeString(_responseEndTime), null, _responseEndTime - _requestBeginTime, 1),
    __recordConnection && update_connection(__recordConnection.id, 'tls', __recordConnection.server_ip, __recordConnection.server_port)
  )
)

.pipeline('connect')
.onStart(new Data)
.connect(() => _target, {
  ...config?.policies,
  onState: ob => (
    (ob.state === 'connecting') && (__recordConnection.server_ip = ob.remoteAddress, __recordConnection.server_port = ob.remotePort), __infos[ob.state + 'TS'] = Date.now()
  )
})

))()
