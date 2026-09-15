# HTTP evidence

## Real page and real API (live services started by this task)

```text
GET http://127.0.0.1:5173/monitor/data-source-state                -> 200
GET http://192.168.174.70:5173/monitor/data-source-state          -> 200
GET http://127.0.0.1:8080/api/monitor/data-source-run-state/list   -> 200 (22.9 ms, 16974 bytes)
```

## List payload shape (real data, no fixture)

```text
code=200 records=30
fields=clientId,clientRef,sourceId,sourceRef,snapshotStatus,statusCategory,snapshotLastSeenAt,snapshotCompletedAt,updatedAt
distinct clients=8  distinct sources=9
snapshotStatus distribution: SNAPSHOT_RUNNING=13 SNAPSHOT_COMPLETED=11 UNKNOWN=2 SNAPSHOT_STALE=1 STARTING=1 SNAPSHOT_UNKNOWN=1 UNKNOWN_MODE=1
clientId=hosp-012 rows=1
```

The LONG result scenario is the page's own default query (所有维度=全部) against this response: 30 rows,
which overflow the main scroll container vertically. The SHORT scenario is the same page with only
探针端=hosp-012 selected: 1 row, which does not overflow. Both are produced through the page's own
selects — no fixture, no API stub, no DB write.

## Request method statistics (from the acceptance run, browser Network domain)

```text
non_GET_requests=0
api_non_GET_requests=0
list_GETs>=1 per state transition
duplicate in-flight click (second click while a query is held) -> extra GETs=1 (i.e. the click was genuinely suppressed)
```
