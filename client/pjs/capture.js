((
  { localTimeString, insert_capture } = pipy.solve('db.js'),

  startTime = new Date(),

  capture = {},

) => (

  capture.record = insert_capture(startTime.toISOString(), localTimeString(startTime)),

  {
    capture,
  }

))()