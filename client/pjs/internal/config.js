(
  type,
) => (
  (
    result,
    config = JSON.decode(pipy.load('config.json')),
  ) => (
    (type === 'external') ? (
      (result = config?.external) && (
        result.global = config.global,
        result.network = config.network,
        result
      )
    ) : (
      (type === 'internal') ? (
        (result = config?.internal) && (
          result.global = config.global,
          result.network = config.network,
          result
        )
      ) : config
    )
  )
)()