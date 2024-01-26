((
  config = pipy.solve('internal/config.js')?.('internal'),

  { id, global } = pipy.solve('utils.js'),

  { insert_log_db, } = pipy.solve('db.js'),

) => (

!config?.global?.id && (config.global.id = id),
console.log('=> Client id#', config.global.id),

pipy({
  _startTime: undefined,
})

.export('internal', {
  __token: {},
})

.pipeline()

.branch(
  Boolean(config?.reverseServer?.target), ($=>$
    .task()
    .onStart(
      () => (
        __token.basic = 'Basic ' + new Data(id).toString('base64'),
        new Data
      )
    )
    .replay().to($=>$
      .loop($=>$
        .onStart(
          () => (
            _startTime = Date.now(),
            global.alive = true,
            insert_log_db(id, 'login', ''),
            new Data
          )
        )
        .branch(
          () => config?.reverseServer?.viaHttpTunnel, (
            $=>$.link('via-http-tunnel')
          ),
          () => config?.reverseServer?.tlsCert && config?.reverseServer?.tlsKey, ($=>$
            .connectTLS({
              certificate: () => ({
                cert: new crypto.Certificate(pipy.load(config?.reverseServer?.tlsCert)),
                key: new crypto.PrivateKey(pipy.load(config?.reverseServer?.tlsKey)),
              }),
              trusted: config?.reverseServer?.tlsCA ? [new crypto.Certificate(pipy.load(config?.reverseServer?.tlsCA))] : [],
            }).to($=>$
              .connect(() => config?.reverseServer?.target, { protocol: 'tcp', retryCount: 1, retryDelay: 1, ...config?.reverseServer })
            )
          ), ($=>$
            .connect(() => config?.reverseServer?.target, { protocol: 'tcp', retryCount: 1, retryDelay: 1, ...config?.reverseServer })
          )
        )
        .use('internal/tunnel-main.js', 'tunneling')
        .handleStreamEnd(
          () => global.alive && (
            global.alive = false,
            insert_log_db(id, 'logout', '' + (Date.now() - _startTime) + ' ms')
          )
        )
      )
      .replaceStreamEnd(
        () => (
          new StreamEnd('Replay')
        )
      )
    )
  )
)

.pipeline('via-http-tunnel')
.connectHTTPTunnel(
  () => new Message({
    method: 'CONNECT',
    path: config?.global?.id || '',
  })
).to(
  $=>$.muxHTTP(() => config?.reverseServer?.target, { version: 2 }).to(
    $=>$.branch(
      () => config?.reverseServer?.tlsCert && config?.reverseServer?.tlsKey, (
        $=>$.connectTLS({
          certificate: () => ({
            cert: new crypto.Certificate(pipy.load(config?.reverseServer?.tlsCert)),
            key: new crypto.PrivateKey(pipy.load(config?.reverseServer?.tlsKey)),
          }),
          trusted: config?.reverseServer?.tlsCA ? [new crypto.Certificate(pipy.load(config?.reverseServer?.tlsCA))] : [],
        }).to(
          $=>$.connect(() => config?.reverseServer?.target, { protocol: 'tcp', retryCount: 1, retryDelay: 60, ...config?.reverseServer })
        )
      ), (
        $=>$.connect(() => config?.reverseServer?.target, { protocol: 'tcp', retryCount: 1, retryDelay: 1, ...config?.reverseServer })
      )
    )
  )
)

.repeat(
  Object.entries(config.servers || {}),
  ($, [addr, v])=>$
    .listen(addr, { protocol: 'tcp', ...v, ...(v.maxConnections > 0 && { maxConnections: Math.ceil(v.maxConnections / __thread.concurrency) }) })
    .onStart(new Data)
    .use('internal/tunnel-main.js', 'startup')
)

))()
