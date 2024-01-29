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

  { platform } = pipy.solve('utils.js'),

) => pipy({
  _sni: undefined,
  _requestHeadText: null,
  _requestBodyBlob: null,
  _responseHeadText: null,
  _responseBodyBlob: null,
  _infos: null,
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
})

.export('ssl', {
  __target: null,
})

.pipeline('ssl-intercept')
.acceptTLS({
  certificate: (
    (
      key = new crypto.PrivateKey(pipy.load('crt/pkey.pem')),
      cache = new algo.Cache(
        cn => (
          console.log('Generate cert for', cn),
          platform === 0 ? (
            new crypto.Certificate(pipy.exec(`.\\crt\\mkcrt.cmd ${cn}`))
          ) : (
            new crypto.Certificate(pipy.exec(`crt/mkcrt.sh ${cn}`))
          )
        ),
        null,
        { ttl: 2500000 }
      ),
    ) => (
      sni => !sni ? undefined : { key, cert: cache.get(_sni = sni) }
    )
  )(),
  alpn: ['http/1.1'],
}).to($=>$
  .demuxHTTP().to($=>$
    .handleMessageStart(
      msg => (
        __infos.gotRequestHeadersTS = _requestBeginTime = Date.now(),
        msg.head.headers['x-b3-traceid'] = msg.head.headers['x-b3-spanid'] = algo.uuid().substring(0, 18).replaceAll('-', ''),
        config?.configs?.saveHeadAndBody && (
          _requestBodyBlob = new Data,
          _requestHeadText = JSON.stringify(msg.head, null, 2)
        ),
        __recordSession = insert_session(__recordConnection.id, 'https', localTimeString(_requestBeginTime), 0),
        __recordHTTP = insert_http(__recordSession.id, 'https', msg.head.method, 0, _sni, msg.head.path),
        __recordRequest = insert_message(__recordConnection.id, __recordSession.id, 'https', 0, localTimeString(_requestBeginTime))
      )
    )
    .branch(
      config?.configs?.saveHeadAndBody, (
        $=>$
        .handleData(
          dat => _requestBodyBlob.push(dat)
        )
      )
    )
    .handleMessageEnd(
      msg => (
        __infos.doneRequestTS = _requestEndTime = Date.now(),
        _requestSize = (msg?.tail?.headSize || 0) + (msg?.tail?.bodySize || 0),
        update_message(__recordRequest.id, _requestHeadText, _requestBodyBlob, JSON.stringify(msg.tail), localTimeString(_requestEndTime))
      )
    )
    .muxHTTP().to($=>$
      .connectTLS({ sni: () => _sni }).to($=>$
        .connect(() => __target, {
          ...config?.policies,
          onState: ob => (
            (ob.state === 'connecting') && (__recordConnection.server_ip = ob.remoteAddress, __recordConnection.server_port = ob.remotePort), __infos[ob.state + 'TS'] = Date.now()
          )
        })
      )
    )
    .handleMessageStart(
      msg => (
        config?.configs?.saveHeadAndBody && (
          _responseBodyBlob = new Data,
          _responseHeadText = JSON.stringify(msg.head, null, 2)
        ),
        update_http(__recordHTTP.id, msg.head?.status || 0, msg.head?.headers['content-type'] || ''),
        __recordResponse = insert_message(__recordConnection.id, __recordSession.id, 'https', 1, localTimeString(_responseBeginTime = Date.now()))
      )
    )
    .branch(
      config?.configs?.saveHeadAndBody, (
        $=>$
        .handleData(
          dat => _responseBodyBlob.push(dat)
        )
      )
    )
    .handleMessageEnd(
      msg => (
        __infos.sni = _sni,
        __infos.target = __target,
        __infos.doneProxyTS = _responseEndTime = Date.now(),
        _responseSize = (msg?.tail?.headSize || 0) + (msg?.tail?.bodySize || 0),
        update_message(__recordResponse.id, _responseHeadText, _responseBodyBlob, JSON.stringify(msg.tail), localTimeString()),
        update_session(__recordSession.id, 'https', localTimeString(_requestEndTime), _requestSize, localTimeString(_responseBeginTime), localTimeString(_responseEndTime), _responseSize, _responseEndTime - _requestBeginTime, 1),
        update_connection(__recordConnection.id, 'tls', __recordConnection.server_ip, __recordConnection.server_port)
      )
    )
  )
)

)()
