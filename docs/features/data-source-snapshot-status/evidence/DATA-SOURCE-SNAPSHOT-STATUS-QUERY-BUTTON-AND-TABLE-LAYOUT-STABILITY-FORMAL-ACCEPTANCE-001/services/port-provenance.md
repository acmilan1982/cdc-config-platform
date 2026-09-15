# 端口来源证明（既有 5173/8080 实例）

task_code=DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001
provenance_capture_local=2026-09-16 00:00:06 CST

## 1. 既有实例现场（任务开始快照）
```text
frontend_pid=20567
frontend_user=root
frontend_cmd=node /agent/dss-query-button-table-layout-implementation-001/frontend/node_modules/.bin/vite --host 0.0.0.0 --port 5173 --strictPort
frontend_cwd=/agent/dss-query-button-table-layout-implementation-001/frontend
frontend_listen=0.0.0.0:5173
frontend_lstart=Tue Sep 15 14:09:15 2026
frontend_parent_20555=npm exec vite --host 0.0.0.0 --port 5173 --strictPort (cwd 同上)
backend_pid=20509
backend_user=root
backend_cmd=java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.port=8080
backend_cwd=/agent/dss-query-button-table-layout-implementation-001/backend
backend_listen=*:8080
backend_lstart=Tue Sep 15 14:09:11 2026
backend_wrapper_pid=20508
port_5174_listener=NONE
```

## 2. 与已提交记录的逐字段比对

比对来源：基准提交 682650058b85b99b13a343373d6887bf0784ec1f 中的
`docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-REVIEW-CLOSEOUT-001.md` §11b。

```text
record_frontend_pid_match=TRUE
record_frontend_cmd_match=TRUE
record_frontend_cwd_match=TRUE
record_frontend_lstart_match=TRUE
record_backend_pid_match=TRUE
record_backend_cmd_match=TRUE
record_backend_cwd_match=TRUE
record_backend_lstart_match=TRUE
```

两个实例的 PID、用户、完整命令行、cwd、监听地址和启动时间与基准提交中已提交的收口报告 §11b 记录逐字段一致，
且 cwd 均指向本 Feature 的 R0 实现 worktree `/agent/dss-query-button-table-layout-implementation-001`。
据此判定 `port_provenance_status=PROVEN_FEATURE_PRESERVED_INSTANCE`，`BLOCKED_PORT_PROVENANCE_UNKNOWN` 不成立。

## 3. 既有实例源码版本（证明为何必须重启）

既有 5173 前端进程的 cwd 为 R0 实现 worktree，其 HEAD 为 `d77e174a912daf852837c9658f13672918fc766e`，
早于 R1～R4 修正提交，因此其前端文件**并非**本次基准版本：

```text
DIFFERS impl_worktree_blob=f09efdcf8253 base_blob=2537c3079363 frontend/src/layouts/MainLayout.vue
DIFFERS impl_worktree_blob=67fb61b5ff63 base_blob=71c66bd0dbd2 frontend/src/layouts/MainLayout.spec.ts
DIFFERS impl_worktree_blob=6a55ae3d0b57 base_blob=3ab218f92dc8 frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue
DIFFERS impl_worktree_blob=58d2023324dc base_blob=8fb79ffeba1b frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts
IDENTICAL impl_worktree_blob=d2cbd868cff9 base_blob=d2cbd868cff9 frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue
IDENTICAL impl_worktree_blob=5781ed454dce base_blob=5781ed454dce frontend/src/views/data-source-run-state/composables/useDataSourceSnapshot.ts
```

因此在正式验收前必须按精确 PID 停止既有实例，并从基准提交 `6826500...` 重新启动。
停止方式：仅对 20567 与 20509 两个精确 PID 发送 SIGTERM；不使用 pkill、killall、模糊匹配或按端口批量杀进程；不改用 5174。
