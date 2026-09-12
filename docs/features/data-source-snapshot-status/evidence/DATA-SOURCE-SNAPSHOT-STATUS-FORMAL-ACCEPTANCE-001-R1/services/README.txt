# R1 services — DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1
# captured: 2026-09-12T20:53:37+08:00

## 1. processes
    PID    PPID     ELAPSED CMD
  10371       1    04:43:16 java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=0.0.0.0
  10530   10517    04:41:44 node /agent/dss-formal-acceptance-001/frontend/node_modules/.bin/vite --host 0.0.0.0 --port 5173

## 2. code provenance of the reused services
  backend pid 10371 cwd=/agent/dss-formal-acceptance-001/backend
  backend jar=/agent/dss-formal-acceptance-001/backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar
  frontend pid 10530 cwd=/agent/dss-formal-acceptance-001/frontend
  R0 worktree HEAD=3190b3d2450478bef34b24578312c76c3973cb08
  R1 base HEAD    =3190b3d2450478bef34b24578312c76c3973cb08
  => same commit: yes

## 3. listening sockets
LISTEN 0      511          0.0.0.0:5173       0.0.0.0:*    users:(("MainThread",pid=10530,fd=22))
LISTEN 0      100                *:8080             *:*    users:(("java",pid=10371,fd=22))

## 4. local health checks (proxy bypassed: server sets http_proxy/https_proxy)
  http://127.0.0.1:5173/                                                 -> HTTP 200  (429 bytes)
  http://192.168.174.70:5173/                                            -> HTTP 200  (429 bytes)
  http://127.0.0.1:8080/api/monitor/data-source-run-state/list           -> HTTP 200  (16974 bytes)
  http://192.168.174.70:8080/api/monitor/data-source-run-state/list      -> HTTP 200  (16974 bytes)

## 5. URLs and stop command
  page   : http://192.168.174.70:5173/monitor/data-source-state
  api    : http://192.168.174.70:8080/api/monitor/data-source-run-state/list
  stop   : kill 10530 10371
