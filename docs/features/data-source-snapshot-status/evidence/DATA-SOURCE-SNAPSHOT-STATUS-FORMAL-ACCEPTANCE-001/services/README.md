# Services evidence

Read-only record of the two services started for this formal acceptance run.

## Processes

| Role | PID | Command | Bind | Notes |
|---|---|---|---|---|
| backend | 10371 | `java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=0.0.0.0` | `*:8080` | Spring Boot 2.7 / JDK 8, dev profile |
| frontend launcher | 10517 | `npm exec vite --host 0.0.0.0 --port 5173` | — | npm wrapper |
| frontend listener | 10530 | `node .../node_modules/.bin/vite --host 0.0.0.0 --port 5173` | `0.0.0.0:5173` | actual Vite process (child of 10517) |

## Health checks (captured in `liveness.txt`, curl with `--noproxy '*'`)

- `http://127.0.0.1:5173/` → HTTP 200
- `http://192.168.174.70:5173/` → HTTP 200
- `http://127.0.0.1:8080/api/monitor/data-source-run-state/list` → HTTP 200
- `http://192.168.174.70:8080/api/monitor/data-source-run-state/list` → HTTP 200

## Acceptance URLs (external host per CLAUDE.md §19)

- Primary page: `http://192.168.174.70:5173/monitor/data-source-state`
- Backend list API: `http://192.168.174.70:8080/api/monitor/data-source-run-state/list`

## Stop command

```bash
kill 10517 10530 10371
```

## Raw logs

`backend-runtime.txt` / `frontend-runtime.txt` are byte-identical copies of the live
process logs. The originals (`*.log`) live in `/tmp/dss-fa-001/` because `.gitignore`
ignores `*.log`; the copies are plain `.txt` and were **not** force-added.

The backend log contains the application's own ZooKeeper client reconnect chatter
(`ClientCnxn`, `10.19.16.111:2181` connection refused) emitted by an unrelated
subsystem on startup. The `data-source-snapshot-status` Feature never issues any
ZooKeeper call (see `../readonly/runtime-audit.txt`).
