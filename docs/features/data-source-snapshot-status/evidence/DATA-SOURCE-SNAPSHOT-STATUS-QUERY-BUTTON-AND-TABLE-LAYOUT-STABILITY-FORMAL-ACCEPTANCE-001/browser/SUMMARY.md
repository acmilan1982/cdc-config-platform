# Browser acceptance summary (DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001)

All values are RAW, un-rounded `getBoundingClientRect()` / computed-style readings taken from the real
page `http://127.0.0.1:5173/monitor/data-source-state` through the real Vite dev server and the real
Spring Boot backend. No value in this file is rounded, averaged or reconstructed.

## Run-level

| item | value |
|---|---|
| chromium | Chrome/148.0.7778.167 |
| official_judge_exit_code | 0 |
| official_judge_checks | 398 |
| official_judge_failures | 0 |
| negative_control_exit_code | 1 (non-zero = can fail) |
| negative_control_injection_px | 0.001 |
| negative_control_failures_caught | 20 |
| console_errors_genuine | 0 |
| console_errors_attributed_to_own_injection | 4 |
| failure_injections_served | 4 (>=1 per viewport) |
| real_list_responses_all_200 | True |
| non_get_requests | 0 |
| api_non_get_requests | 0 |
| duplicate_in_flight_click_extra_gets | 1 |

## Per-viewport states

| viewport | state | rows | 共 N 条 | content-area clientWidth | scrollbar-gutter | overflow-y |
|---|---|---|---|---|---|---|
| 1280x800 | LONG_IDLE | 30 | 共 30 条 | 1045 | stable | auto |
| 1280x800 | QUERY_LOADING | 30 | 共 30 条 | 1045 | stable | auto |
| 1280x800 | QUERY_SUCCESS | 30 | 共 30 条 | 1045 | stable | auto |
| 1280x800 | SHORT_IDLE | 1 | 共 1 条 | 1045 | stable | auto |
| 1280x800 | RESTORE_LONG_IDLE | 30 | 共 30 条 | 1045 | stable | auto |
| 1280x800 | QUERY_FAILURE | 30 | 共 30 条 | 1045 | stable | auto |
| 1700x920 | LONG_IDLE | 30 | 共 30 条 | 1465 | stable | auto |
| 1700x920 | QUERY_LOADING | 30 | 共 30 条 | 1465 | stable | auto |
| 1700x920 | QUERY_SUCCESS | 30 | 共 30 条 | 1465 | stable | auto |
| 1700x920 | SHORT_IDLE | 1 | 共 1 条 | 1465 | stable | auto |
| 1700x920 | RESTORE_LONG_IDLE | 30 | 共 30 条 | 1465 | stable | auto |
| 1700x920 | QUERY_FAILURE | 30 | 共 30 条 | 1465 | stable | auto |
| 1920x1080 | LONG_IDLE | 30 | 共 30 条 | 1685 | stable | auto |
| 1920x1080 | QUERY_LOADING | 30 | 共 30 条 | 1685 | stable | auto |
| 1920x1080 | QUERY_SUCCESS | 30 | 共 30 条 | 1685 | stable | auto |
| 1920x1080 | SHORT_IDLE | 1 | 共 1 条 | 1685 | stable | auto |
| 1920x1080 | RESTORE_LONG_IDLE | 30 | 共 30 条 | 1685 | stable | auto |
| 1920x1080 | QUERY_FAILURE | 30 | 共 30 条 | 1685 | stable | auto |
| 2560x1440 | LONG_IDLE | 30 | 共 30 条 | 2325 | stable | auto |
| 2560x1440 | QUERY_LOADING | 30 | 共 30 条 | 2325 | stable | auto |
| 2560x1440 | QUERY_SUCCESS | 30 | 共 30 条 | 2325 | stable | auto |
| 2560x1440 | SHORT_IDLE | 1 | 共 1 条 | 2325 | stable | auto |
| 2560x1440 | RESTORE_LONG_IDLE | 30 | 共 30 条 | 2325 | stable | auto |
| 2560x1440 | QUERY_FAILURE | 30 | 共 30 条 | 2325 | stable | auto |

## Column geometry (LONG_IDLE only; SHORT/RESTORE are byte-identical by assertion)

### 1280x800

| # | header | x | width | centerX |
|---|---|---|---|---|
| 1 | 序号 | 292 | 70 | 327 |
| 2 | 探针端 | 362 | 170 | 447 |
| 3 | 源库 | 532 | 285 | 674.5 |
| 4 | 快照状态 | 817 | 140 | 887 |
| 5 | 快照启动时间 | 957 | 170 | 1042 |
| 6 | 快照完成时间 | 1127 | 170 | 1212 |
| 7 | 记录更新时间 | 1297 | 170 | 1382 |

### 1700x920

| # | header | x | width | centerX |
|---|---|---|---|---|
| 1 | 序号 | 292 | 70 | 327 |
| 2 | 探针端 | 362 | 198 | 461 |
| 3 | 源库 | 560 | 328 | 724 |
| 4 | 快照状态 | 888 | 140 | 958 |
| 5 | 快照启动时间 | 1028 | 195 | 1125.5 |
| 6 | 快照完成时间 | 1223 | 195 | 1320.5 |
| 7 | 记录更新时间 | 1418 | 195 | 1515.5 |

### 1920x1080

| # | header | x | width | centerX |
|---|---|---|---|---|
| 1 | 序号 | 292 | 70 | 327 |
| 2 | 探针端 | 362 | 236 | 480 |
| 3 | 源库 | 598 | 393 | 794.5 |
| 4 | 快照状态 | 991 | 140 | 1061 |
| 5 | 快照启动时间 | 1131 | 234 | 1248 |
| 6 | 快照完成时间 | 1365 | 234 | 1482 |
| 7 | 记录更新时间 | 1599 | 234 | 1716 |

### 2560x1440

| # | header | x | width | centerX |
|---|---|---|---|---|
| 1 | 序号 | 292 | 70 | 327 |
| 2 | 探针端 | 362 | 348 | 536 |
| 3 | 源库 | 710 | 582 | 1001 |
| 4 | 快照状态 | 1292 | 140 | 1362 |
| 5 | 快照启动时间 | 1432 | 347 | 1605.5 |
| 6 | 快照完成时间 | 1779 | 347 | 1952.5 |
| 7 | 记录更新时间 | 2126 | 347 | 2299.5 |

## Button geometry (idle baseline; every other state asserted identical to it)

### 1280x800

- 查询: rect x=568 y=216.5 w=62 h=30; computed width=62px min-width=62px max-width=62px flex-basis=62px
- 重置: rect x=650 y=216.5 w=62 h=30; computed width=62px min-width=62px max-width=62px flex-basis=62px
- 立即刷新: rect x=1083 y=281.5 w=110 h=32; computed width=110px min-width=110px max-width=110px flex-basis=110px

### 1700x920

- 查询: rect x=1218 y=176.5 w=62 h=30; computed width=62px min-width=62px max-width=62px flex-basis=62px
- 重置: rect x=1300 y=176.5 w=62 h=30; computed width=62px min-width=62px max-width=62px flex-basis=62px
- 立即刷新: rect x=1503 y=241.5 w=110 h=32; computed width=110px min-width=110px max-width=110px flex-basis=110px

### 1920x1080

- 查询: rect x=1218 y=176.5 w=62 h=30; computed width=62px min-width=62px max-width=62px flex-basis=62px
- 重置: rect x=1300 y=176.5 w=62 h=30; computed width=62px min-width=62px max-width=62px flex-basis=62px
- 立即刷新: rect x=1723 y=241.5 w=110 h=32; computed width=110px min-width=110px max-width=110px flex-basis=110px

### 2560x1440

- 查询: rect x=1218 y=176.5 w=62 h=30; computed width=62px min-width=62px max-width=62px flex-basis=62px
- 重置: rect x=1300 y=176.5 w=62 h=30; computed width=62px min-width=62px max-width=62px flex-basis=62px
- 立即刷新: rect x=2363 y=241.5 w=110 h=32; computed width=110px min-width=110px max-width=110px flex-basis=110px

## Other-route leak

- routes_checked=3 gutter_class_present=0 stable_gutter_computed=0 dss_feature_nodes=0
- /config/data-source: gutterClass=False computed=auto dssNodes=0
- /config/client: gutterClass=False computed=auto dssNodes=0
- /monitor/cdc-node: gutterClass=False computed=auto dssNodes=0
