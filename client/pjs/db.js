((
  db = sqlite('xeye.db')
) => (
  db.exec(
    `SELECT * FROM sqlite_schema WHERE type = 'table' AND name = 'message'`
  ).length === 0 && (
    db.exec(`
      CREATE TABLE capture (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name VARCHAR(100),
        create_time TIMESTAMP,
        update_time TIMESTAMP
      )
    `),
    db.exec(`
      CREATE TABLE connection (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        capture_id INTEGER NOT NULL, -- Must map to an capture.id
        protocol TEXT NOT NULL, -- 'tcp, udp, tls, etc.'
        client_ip VARCHAR(40),
        client_port INTEGER,
        server_ip VARCHAR(40),
        server_port INTEGER,
        establish_time TIMESTAMP,
        close_time TIMESTAMP
      )
    `),
    db.exec(`
      CREATE TABLE session (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        connection_id INTEGER NOT NULL, -- Must map to an connection.id
        protocol TEXT NOT NULL, -- 'http, smtp, ftp, etc.'
        request_begin_time TIMESTAMP,
        request_end_time TIMESTAMP,
        request_size INTEGER,
        response_begin_time TIMESTAMP,
        response_end_time TIMESTAMP,
        response_size INTEGER,
        response_time INTEGER,
        result INTEGER -- 0: pending, 1: success, -1: failure
      )
    `),
    db.exec(`
      CREATE TABLE http (
        id INTEGER PRIMARY KEY NOT NULL, -- Map to a session.id
        scheme TEXT NOT NULL, -- 'http or https'
        method TEXT NOT NULL, -- 'GET, POST, etc.'
        status INTEGER,
        host TEXT NOT NULL,
        url TEXT NOT NULL,
        content_type TEXT
      )
    `),
    db.exec(`
      CREATE TABLE message (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        connection_id INTEGER NOT NULL, -- Must map to an connection.id
        session_id INTEGER, -- Map to a session.id
        protocol TEXT NOT NULL, -- 'http, http2, http3, etc.'
        direction INTEGER NOT NULL DEFAULT 0, -- '0: request, 1: response'
        head TEXT, -- 'json string'
        body BLOB,
        tail TEXT, -- 'json string'
        begin_time TIMESTAMP,
        end_time TIMESTAMP
      )
    `),
    db.exec(`
      CREATE TABLE log (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        create_time TIMESTAMP DEFAULT (datetime('now','localtime')),
        name VARCHAR(100),
        action TEXT NOT NULL,
        remark TEXT NOT NULL,
        infos TEXT DEFAULT '' NOT NULL
      )
    `)
  ),

  {
    db,

    localTimeString: ms => (
      (
        now = ms && new Date(ms) || new Date(),
        format2 = d => ('0' + d).slice(-2),
        format3 = d => ('00' + d).slice(-3),
      ) => (
        now.getFullYear() + '-' + format2(now.getMonth() + 1) + '-' + format2(now.getDate()) + ' ' + format2(now.getHours()) + ':' + format2(now.getMinutes()) + ':' + format2(now.getSeconds()) + '.' + format3(now.getMilliseconds())
      )
    )(),

    insert_capture: (name, create_time) => (
      db.sql(
        `INSERT INTO capture (name, create_time) VALUES (?, ?)`
      )
      .bind(1, name)
      .bind(2, create_time)
      .exec(),
      db.sql(
        `SELECT * FROM capture WHERE id = last_insert_rowid()`
      )
      .exec()[0]
    ),

    update_capture: (id, name, update_time) => (
      db.sql(
        `UPDATE capture SET name = ?, update_time = ? WHERE id = ?`
      )
      .bind(1, name)
      .bind(2, update_time)
      .bind(3, id)
      .exec(),
      db.sql(
        `SELECT * FROM capture WHERE id = ${id}`
      )
      .exec()[0]
    ),

    insert_connection: (capture_id, protocol, client_ip, client_port, establish_time) => (
      db.sql(
        `INSERT INTO connection (capture_id, protocol, client_ip, client_port, establish_time) VALUES (?, ?, ?, ?, ?)`
      )
      .bind(1, capture_id)
      .bind(2, protocol)
      .bind(3, client_ip)
      .bind(4, client_port)
      .bind(5, establish_time)
      .exec(),
      db.sql(
        `SELECT * FROM connection WHERE id = last_insert_rowid()`
      )
      .exec()[0]
    ),

    update_connection: (id, protocol, server_ip, server_port) => (
      db.sql(
        `UPDATE connection SET protocol = ?, server_ip = ?, server_port = ? WHERE id = ?`
      )
      .bind(1, protocol)
      .bind(2, server_ip)
      .bind(3, server_port)
      .bind(4, id)
      .exec()
    ),

    close_connection: (id, close_time) => (
      db.sql(
        `UPDATE connection SET close_time = ? WHERE id = ?`
      )
      .bind(1, close_time)
      .bind(2, id)
      .exec()
    ),

    insert_session: (connection_id, protocol, request_begin_time, result) => (
      db.sql(
        `INSERT INTO session (connection_id, protocol, request_begin_time, result) VALUES (?, ?, ?, ?)`
      )
      .bind(1, connection_id)
      .bind(2, protocol)
      .bind(3, request_begin_time)
      .bind(4, result)
      .exec(),
      db.sql(
        `SELECT * FROM session WHERE id = last_insert_rowid()`
      )
      .exec()[0]
    ),

    update_session: (id, protocol, request_end_time, request_size, response_begin_time, response_end_time, response_size, response_time, result) => (
      db.sql(
        `UPDATE session SET protocol = ?, request_end_time = ?, request_size = ?, response_begin_time = ?, response_end_time = ?, response_size = ?, response_time = ?, result = ? WHERE id = ?`
      )
      .bind(1, protocol)
      .bind(2, request_end_time)
      .bind(3, request_size)
      .bind(4, response_begin_time)
      .bind(5, response_end_time)
      .bind(6, response_size)
      .bind(7, response_time)
      .bind(8, result)
      .bind(9, id)
      .exec()
    ),

    insert_http: (id, scheme, method, status, host, url) => (
      db.sql(
        `INSERT INTO http (id, scheme, method, status, host, url) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(1, id)
      .bind(2, scheme)
      .bind(3, method)
      .bind(4, status)
      .bind(5, host)
      .bind(6, url)
      .exec(),
      db.sql(
        `SELECT * FROM http WHERE id = last_insert_rowid()`
      )
      .exec()[0]
    ),

    update_http: (id, status, content_type) => (
      db.sql(
        `UPDATE http SET status = ?, content_type = ? WHERE id = ?`
      )
      .bind(1, status)
      .bind(2, content_type)
      .bind(3, id)
      .exec()
    ),

    insert_message: (connection_id, session_id, protocol, direction, begin_time) => (
      db.sql(
        `INSERT INTO message (connection_id, session_id, protocol, direction, begin_time) VALUES (?, ?, ?, ?, ?)`
      )
      .bind(1, connection_id)
      .bind(2, session_id)
      .bind(3, protocol)
      .bind(4, direction)
      .bind(5, begin_time)
      .exec(),
      db.sql(
        `SELECT * FROM message WHERE id = last_insert_rowid()`
      )
      .exec()[0]
    ),

    update_message: (id, head, body, tail, end_time) => (
      db.sql(
        `UPDATE message SET head = ?, body = ?, tail = ?, end_time = ? WHERE id = ?`
      )
      .bind(1, head)
      .bind(2, body)
      .bind(3, tail)
      .bind(4, end_time)
      .bind(5, id)
      .exec()
    ),

    insert_log_db: (name, action, remark) => (
      db.sql(
        `INSERT INTO log (name, action, remark) VALUES (?, ?, ?)`
      )
      .bind(1, name)
      .bind(2, action)
      .bind(3, remark)
      .exec(),
      db.sql(
        `SELECT * FROM log WHERE id = last_insert_rowid()`
      )
      .exec()[0]
    ),

    select_log_proxy: () => (
      db.sql(
        `select * from log where id = (select max(id) from log where action='proxy')`
      )
      .exec()[0]
    ),

  }

))()