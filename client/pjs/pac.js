((
  pac = JSON.decode(pipy.load('pac.json')),

  rules = (pac || []).map(
    r => (
      (
        matchs = [],
        subarray,
      ) => (
        !r.return ? (
          console.log('pac rule is missing return', r),
          null
        ) : (
          r.isPlainHostName && (
            matchs.push(
              {
                match: host => (host.indexOf('.') === -1),
                dnsResolv: false,
              }
            )
          ),
          subarray = (r.domains || []).map(
            d => (
              d.startsWith('.') ? (
                {
                  match: host => host.toLowerCase().endsWith(d),
                  dnsResolv: false,
                }
              ) : (
                {
                  match: host => (host.toLowerCase() === d),
                  dnsResolv: false,
                }
              )
            )
          ),
          subarray.length > 0 && matchs.push(subarray),
          subarray = (r.ipRanges || []).map(
            r => (
              (
                mask = new Netmask(r)
              ) => (
                {
                  match: ip => mask.contains(ip),
                  dnsResolv: true,
                }
              )
            )()
          ),
          subarray.length > 0 && matchs.push(subarray),
          (matchs.length === 0) && (
            matchs.push(
              {
                match: () => true,
                dnsResolv: false,
              }
            )
          ),
          {
            matchs: matchs.flat(),
            proxy: r.return === 'DIRECT' ? false : r.return
          }
        )
      )
    )()
  ).filter(e => e),

  find = (domain, ip) => (
    (
      proxy = undefined,
      dnsResolv = false,
    ) => (
      rules.find(
        r => r.matchs.find(
          m => (
            m.dnsResolv ? (
              ip ? (
                m.match(ip) && (
                  proxy = r.proxy,
                  true
                )
              ) : (
                dnsResolv = true,
                true
              )
            ) : (
              m.match(domain) && (
                proxy = r.proxy,
                true
              )
            )
          )
        )
      ),
      !dnsResolv && (proxy === undefined) && (
        proxy = false
      ),
      {
        proxy,
        dnsResolv,
      }
    )
  )(),

  dnsCache = new algo.Cache(
    null,
    null,
    { ttl: 300 }
  ),

  isIP = domain => (
    domain.replaceAll('.', '') > 0
  ),

) => pipy({
  _domain: '',
  _promises: null,
  _ip: undefined,
  _result: undefined,
})

.export('pac', {
  __pacDomain: null,
  __pacProxy: null,
  __pacIP: null,
})

.pipeline()
.onStart(new Data)
.handleMessageStart(
  () => (
    _domain = __pacDomain,
    isIP(_domain) ? (
      _ip = _domain
    ) : (
      _ip = dnsCache.get(_domain)
    ),
    _result = find(_domain, _ip)
  )
)
.branch(
  () => _result && _result.proxy !== undefined, (
    $=>$.handleMessageStart(
      () => (
        __pacProxy = _result.proxy,
        __pacIP = _ip
      )
    )
  ),
  () => _result && _result.dnsResolv, (
    $=>$
    .handleMessageStart(
      () => (
        _promises = [
          DNS.resolve(_domain).then(
            r => (
              r?.[0] ? (
                _ip = r[0],
                dnsCache.set(_domain, _ip)
              ) : (
                _ip = '0.0.0.0'
              )
            )
          )
        ]
      )
    )
    .branch(
      () => _promises, $=>$.wait(() => Promise.all(_promises))
    )
    .handleMessageStart(
      () => (
        _result = find(_domain, _ip),
        __pacProxy = _result.proxy,
        __pacIP = _ip
      )
    )
  )
)

)()