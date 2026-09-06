# Browser Verification Evidence — DataSourceRunStatePage (源库快照状态)

- Feature task: DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1 (browser verification)
- Evidence directory: `/agent/cdc-config-platform/docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1/browser`
- Generated (UTC): 2026-09-06T15:36:46.550Z
- Browser: HeadlessChrome/148.0.7778.167 via CDP ws://127.0.0.1:9222 (launched with --no-sandbox --disable-gpu --no-proxy-server)
- App page: http://127.0.0.1:5173/monitor/data-source-state (Vite dev on 0.0.0.0:5173, proxies /api/* to 127.0.0.1:8080)
- Backend read-only API: GET /api/monitor/data-source-run-state/list

## 1. Screenshots produced (all under `/agent/cdc-config-platform/docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1/browser`)

- 01-load-1440.png — fresh 1440x900 auto-query: rows=30 dashes=32 tags={"快照进行中":13,"未知状态":6,"快照已完成":11}
- 02-load-1920.png — fresh 1920x1080 auto-query: rows=30
- 03-status-and-dash-times.png — filter 探针端=c-dssr1-0906-a: rows=5 tags={"快照进行中":2,"未知状态":1,"快照已完成":2} dashes=4
- 04-multiselect-zero-result.png — 探针端=c-dssr1-0906-e AND 快照状态=UNKNOWN: rows=0 emptyText=暂无数据
- 05-reset-no-network.png — reset from empty-filter state: new list requests in 900ms = 0; selects=["全部","全部","全部"]
- 06-real-http500-recovery.png — real HTTP500 via CDP Fetch: kept rows=30, error=刷新失败，将在约 60 秒后自动重试, el-message--error=0; recovered rows=30 error=none
- 07-toolbar-rect-no-shift.png — captured while a manual refresh request was IN FLIGHT (held open via CDP Fetch): button loading=true disabled=true, rect x=1274 y=196.5 w=110 h=32 (identical to idle/failed states per section below)
- 08-tooltip-overflow.png — el-tooltip 原始状态：SNAPSHOT_STALE rect=[769,421,193.81,32] inViewport=true
- 09 auto-refresh: fired ~60s note 60 秒自动刷新｜最近成功刷新：23:35:46 -> 60 秒自动刷新｜最近成功刷新：23:36:46

## 2. DOM / behavior measurements (verified in browser)

### Fresh load at 1440x900
- Header columns (exactly 7, in order): ["序号","探针端","源库","快照状态","快照启动时间","快照完成时间","记录更新时间"]
- Status tag counts: {"快照进行中":13,"未知状态":6,"快照已完成":11}
- `.dss-time-dash` cells: 32
- Table rows rendered: 30
- Toolbar note: `60 秒自动刷新｜最近成功刷新：23:35:22`
- Error line: none
- First list request URL: /api/monitor/data-source-run-state/list

### Filter 探针端=`c-dssr1-0906-a` (shot 03)
- Rows: 5; tags present: {"快照进行中":2,"未知状态":1,"快照已完成":2}
- `.dss-time-dash` cells: 4

### Zero-result filter 探针端=`c-dssr1-0906-e` AND 快照状态=`未知状态(UNKNOWN)` (shot 04)
- Rows: 0; empty text: `暂无数据`
- Applied request URL: /api/monitor/data-source-run-state/list?clientId=c-dssr1-0906-e&status=UNKNOWN
- Pre-check with curl (HTTP 200): `clientId=c-dssr1-0906-e&status=UNKNOWN` -> `data.records=[]`

### Reset (重置) does NOT fire a request (shot 05)
- New list requests during 900 ms after clicking 重置: 0
- Selects after reset: ["全部","全部","全部"] (three selects cleared back to 全部)
- Note: reset only restores the three multi-selects to 全部 (draft layer); it neither queries nor clears the table. The 查询 button was NOT clicked after reset.

### Real HTTP 500 at network layer + recovery (shot 06)
- Method: CDP `Fetch` interception fulfilled the single next list request with HTTP 500 body `{"code":500,"message":"injected 500"}`. Backend was NOT stopped; no product code mocked.
- During failure table rows kept (old data preserved): 30
- `.dss-error[role=status]` shown: `刷新失败，将在约 60 秒后自动重试`
- Element-plus error toast (`.el-message--error`) present: 0
- Toolbar note during failure (last success time not advanced by failure): `60 秒自动刷新｜最近成功刷新：23:35:34`
- After Fetch disabled and 立即刷新: `.dss-error` cleared = yes; rows=30; note=`60 秒自动刷新｜最近成功刷新：23:35:36`

### Refresh button rect stability (AC-068 / DSS-REQ-050; no horizontal shift)
- (i) idle after a success:    x=1274 y=196.5 width=110 height=32 loading=false disabled=false relLeft(toolbar)=1013 relRight(toolbar)=0
- (ii) refresh IN FLIGHT (request held open via CDP Fetch): x=1274 y=196.5 width=110 height=32 loading=true disabled=true relLeft(toolbar)=1013 relRight(toolbar)=0
- (iii) right after a failed refresh (.dss-error shown): x=1274 y=196.5 width=110 height=32 loading=false disabled=false relLeft(toolbar)=1013 relRight(toolbar)=0
- absolute viewport left/x identical across all three states: true
- button width identical across all three states: true
- button left relative to `.dss-toolbar` left identical across states: true
- button right gap to `.dss-toolbar` right identical across states: true
- Note (if absolute x varies but toolbar-relative position is stable): the whole toolbar can shift inside the layout gutter (e.g. scrollbar) without the button moving relative to the toolbar/text.

### Tooltip inside viewport (shot 08)
- Triggered el-tooltip on an 未知状态 status tag.
- Tooltip text: `原始状态：SNAPSHOT_STALE`
- Popper bounding rect (x,y,w,h): [769,421,193.81,32]
- Fully inside 1440x900 viewport (left/top >=0, right<=innerWidth, bottom<=innerHeight): true
- Note: the tooltip we could reliably trigger is the status-tag 原始状态 tooltip (short text). The very-long client-desc `.dss-cell-sub` cells do not have their own tooltip in this build (they are truncated by ellipsis); long-text-overflow is verified by unit tests only, see caveats.

### 60-second auto-refresh tick (best effort)
- Second list request fired on its own ~60s after a successful load (no interaction): true
- Toolbar note before: `60 秒自动刷新｜最近成功刷新：23:35:46`; after: `60 秒自动刷新｜最近成功刷新：23:36:46`; auto request URL: /api/monitor/data-source-run-state/list

## 4. Truthfulness notes

- All counts, texts and rects were read from the live DOM via CDP `Runtime.evaluate` on the real page; screenshots are actual headless-Chrome captures (`Page.captureScreenshot`; captureBeyondViewport=true for shots 01-06, viewport capture for 08).
- The HTTP 500 was injected only at the network layer (CDP `Fetch.fulfillRequest`) for the next single list request, then `Fetch` was disabled; the backend stayed up and no repo product file was modified.
- Reset network check used the injected `window.__netlog__` XHR/fetch logger installed via `Page.addScriptToEvaluateOnNewDocument` before app code, so app requests could not bypass it.
- Viewports: 1440x900 for shots 01,03,04,05,06,08,09; 1920x1080 for shot 02. deviceScaleFactor=1.
