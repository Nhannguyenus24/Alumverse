# AlumVerse GET load test

The runner logs in once through `POST /api/auth/mobile/login`, shares the JWT
between five goroutines by default, and continuously cycles through the GET
endpoint inventory. It uses only Go's standard library.

Production fixture IDs in `defaultFixtures()` were read from the production
database on 2026-08-04. Re-check them if production data changes.

## Safety

The default target is production, but the default duration is limited to one
minute. Use `-duration=0` only when you intend to run until `Ctrl+C`.

`/api/sse/connect` is inventoried but excluded by default because SSE is a
long-lived connection and is not comparable to ordinary request/response GETs.

## Run

```bash
cd loadtest
LOADTEST_PASSWORD='your-password' go run . -workers=5 -duration=1m
```

Run continuously:

```bash
LOADTEST_PASSWORD='your-password' go run . -workers=5 -duration=0
```

Smoke test all resolved URLs without sending traffic:

```bash
go run . -dry-run
```

Send exactly one request to each ordinary GET endpoint:

```bash
LOADTEST_PASSWORD='your-password' go run . -workers=5 -max-requests=204
```

Useful flags:

```text
-base-url       API origin (default production)
-email          login email
-workers        concurrent goroutines
-max-requests   stop after this many requests; 0 means unlimited
-duration       test duration; 0 means until interrupted
-timeout        timeout per HTTP request
-report         output CSV path
-include-sse    include the long-lived SSE endpoint
-dry-run        print resolved endpoints without login or traffic
```

The CSV contains per-endpoint request count, success rate, RPS, average latency,
p50, p95, p99, maximum latency, HTTP status counts, and transport errors.
