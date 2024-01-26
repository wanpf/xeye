((

  directory = "..",

) => pipy({
  _pos: -1,
  _size: 0,
  _data: undefined,
  _filename: undefined,
})

.pipeline()
.handleMessageStart(
  msg => (
    _size = msg.head.headers['content-length'],
    (_pos = msg.head.path.lastIndexOf('/')) >= 0 && (
      _filename = directory + msg.head.path.substring(_pos)
    ),
    (_size > 0 && _filename && msg.head.method === 'PUT') ? (
      _data = new Data
    ) : (
      _data = null
    )
  )
)
.branch(
  () => _data, (
    $=>$
    .replaceData(
      dat => (
        _data.push(dat),
        new Data
      )
    )
    .replaceMessageEnd(
      () => _data && (
        os.writeFile(_filename, _data),
        _data = null,
        (os.stat(_filename)?.size == _size) ? (
          new Message({ status: 200 }, 'OK')
        ) : (
          new Message({ status: 200 }, 'FAIL')
        )
      )
    )
  ),
  () => _data === null, (
    $=>$.replaceMessageStart(new StreamEnd)
  )
)

)()