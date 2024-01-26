# Data Sync Job

Application consists of Jobs to peform:

* Syncrhronizes the clients data both access and activity logs into a central Postgres database.
* Periodically invokes ping to target from each desktop client and store logs into central Postgres database

## Compile

```sh
    mvn package
```

## Configurations

Before running this job ensure you have setup below listed environment variables

* `schedule.cron`: Schedule of job in CRON format e.g `0 */1 * * * ?`
* `gateway.address`: Address of Gateway application with port. e.q `192.168.12.84:8001`
* `gateway.auth.user`: Gateway authentication user
* `gateway.auth.password`: Gateway authentication user password
* `batch.size`: Batch size of rows to retrieve in one request when synchronizing e.g. `500`
* `db.host`: Database Servier address where PostGres is running
* `db.port`: Postgres Database port defaults to `5432`
* `db.name`: Postgres Database which should be connected to
* `db.user`: Postgres Database User which should be used while connecting to database
* `db.password`: Postgres Database user password
* `ping.interval`: Repeat Interval for Pinger Job e.g `10s` or `5m` or `1h` etc
* `ping.target`: Target host which will be pinged from desktop clients

### PostgreSQL database schema

```sql

CREATE TABLE IF NOT EXISTS "access_logs" (
    id SERIAL PRIMARY KEY,
    machine TEXT NOT NULL,
    cid INTEGER NOT NULL,
    scheme TEXT NOT NULL,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_time INTEGER NOT NULL DEFAULT 0,
    response_code INTEGER NOT NULL DEFAULT 0,
    client_ip TEXT,
    host TEXT NOT NULL,
    url TEXT NOT NULL,
    user_agent TEXT,
    request_head TEXT,
    request_body BYTEA,
    response_head TEXT,
    response_body BYTEA,
    request_size INTEGER NOT NULL DEFAULT 0,
    response_size INTEGER NOT NULL DEFAULT 0,
    infos JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS "activity_logs" (
    id SERIAL PRIMARY KEY,
    machine TEXT NOT NULL,
    cid INTEGER NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    action TEXT NOT NULL,
    remark TEXT NOT NULL,
    infos JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS "ping_logs" (
    id SERIAL PRIMARY KEY,
    machine TEXT NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL,
    loss INTEGER NOT NULL DEFAULT 0,
    min DECIMAL DEFAULT 0.0,
    max DECIMAL DEFAULT 0.0,
    avg DECIMAL DEFAULT 0.0
);
```
