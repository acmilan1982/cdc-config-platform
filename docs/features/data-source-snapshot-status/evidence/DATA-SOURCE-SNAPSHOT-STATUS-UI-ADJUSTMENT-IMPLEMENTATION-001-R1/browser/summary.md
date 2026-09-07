# Browser Evidence — 源库快照状态 UI 调整 R1 动态交互开发验证

- 任务：`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001-R1`
  （Tooltip 单行优先修复 R1-01 + 动态交互真实浏览器证据 R1-02；任务代码见任务 Markdown §4/§5/§6）
- 证据目录：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001-R1/browser`
- 取证方式：Headless Chrome（`/usr/bin/google-chrome`，Chrome 148）+ `puppeteer-core`（`--headless=new --no-sandbox --disable-gpu --no-proxy-server --disable-dev-shm-usage`）；`Emulation.setViewport` 换视口、真实鼠标移动/点击、`Page.captureScreenshot`、`Runtime.evaluate` 读 DOM/几何。
- 页面地址（保持运行供人工复核）：`http://192.168.174.70:5173/monitor/data-source-state`
  - 前端 dev server：vite，PID 4615，监听 `0.0.0.0:5173`（`/api/*` 代理到后端）；
  - 后端：`cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`，PID 4592，监听 `*:8080`；
  - 取证经本机 `127.0.0.1:5173` 访问同一页面；对外 `192.168.174.70:5173` HTTP 200 可达。
- 数据：开发库内既有只读样例（30 行；探针端长 `CLIENT_DESC` 最长 152 字；含 6 条未知状态、32 个 `--` 空时间），未对数据库 / ZooKeeper / Kafka / 后端做任何写操作。

## 真实后端 vs 浏览器层临时拦截

- 除下列明确标记的“浏览器层临时拦截”外，全部为**真实后端**行为（`GET /api/monitor/data-source-run-state/list`，HTTP 200）。
- 浏览器层临时拦截仅用于：对列表 GET 做**延迟放行**（观察“在途”视觉）或**注入一次 HTTP 500**（制造失败态）。注入的 500 全部归类为 `expected`，取证后随脚本退出自动撤销，**不修改生产代码、不改 Vue 内部 ref、不伪造产品行为**。
- `auto` 采用真实 ~60 秒自动周期等待；`restore` 采用第二标签页覆盖的真实浏览器 `document.visibilityState` 隐藏→恢复（触发产品 `visibilityChanged` 的 restore 分支）。

## 证据清单

| 文件 | 对应规则/要求 | 操作与实测 | 结论 |
|---|---|---|---|
| `tooltip-single-line-1920.png` | R1-01 §5.1；UI 批准基线“内容优先单行” | 1920×1080 悬停最长(152 字) `CLIENT_DESC`；Tooltip 自然宽 1832px>420、<安全视口 1920-16 | 单行(h34/lines=1)、不越界、不截断全文（详见 `tooltip-switch-position.json` 内 s1 度量） |
| `tooltip-extreme-wrap.png` | R1-01 §5.1 极端换行 | 1280 视口（安全视口=1264px）同 152 字全文；实测 w=1264 达上限 | 仅此极端场景换行(2 行 h53)，全文可读、`overflowH=false`、in-viewport（s2 度量） |
| `tooltip-switch-position.json` | R1-01 §5.2/§5.3；AC-076/077 旧坐标防闪现 | 状态↔探针端 A/B 快速扫 6 轮+收尾停 B；逐采样记录可见 Host 数量/key/rect | 任意时刻 Host ≤1；切换 B 后先隐藏再按 B 新锚点一次性定位，`staleGhostDuringSwitch=false`、`settledOnlyAtB=true` |
| `column-widths.json` | 结果卡 7 列固定列宽（验收前复核项） | 1440×900 与 1920×1080 两视口实测 7 列表头像素宽 | 均恰为 70/170/280/130/165/165/165，delta=0（deviceScaleFactor=1，无亚像素偏差） |
| `request-visual-mapping.json` | DSS-REQ-071 六类请求唯一视觉映射（AC-078） | initial/retry/query/manual/restore/auto 六类逐项在途+终态快照 | 每类恰好 1 次列表请求；表格遮罩仅 initial；重试/查询/立即刷新按钮 loading 各归其类；auto/restore 仅圆点；与批准基线完全一致 |
| `manual-refresh-single-request.json` | 点击一次“立即刷新”只发一次请求（R1-02 §6.2 #6） | 点击前后网络计数+URL+查询按钮三态外观 | 恰好新增 1 次按已应用条件(三项“全部”→URL 无参数)的列表请求；查询按钮不 loading、文字/颜色/尺寸/位置不闪动 |
| `manual-refresh-inflight.png` | 立即刷新 manual 在途 | 1440×900 点击后延迟放行在途整页 | 刷新按钮 loading+圆点激活，表格不遮罩、30 行保留 |
| `manual-refresh-success.png` | manual 成功后终态 | 同上放行完成 | 按钮/圆点复位，最近成功刷新时间更新，结果一致 |
| `restore-dot-only.png` | R1-02 §6.2 #7 restore | 第二标签页隐藏→恢复触发的真实 restore 在途整页 | 仅圆点激活；查询/立即刷新不 loading、外观稳定 |
| `auto-dot-only.png` | R1-02 §6.2 #7 auto | 空闲等满 ~60s（实测 57975ms）auto 在途整页 | 仅圆点激活；查询/立即刷新不 loading、外观稳定 |
| `auto-restore-dot-only.json` | R1-02 §6.2 #7 | auto 与 restore 各自 idle/inflight/post 外观+颜色 | 圆点灰色 #c0c4cc→激活 #409eff 且仅 inflight；两按钮 loading 全程 false、视觉字段逐项相等；数据行在途保留 |
| `reset-no-request.json` | “重置”不查询（R1-02 §6.2 #8） | 形成 快照状态=未知状态（UNKNOWN）非“全部”并查询应用后，点“重置” | 三下拉恢复“全部”；重置前后请求计数 2→2，**增量 0**；已应用条件与当前结果(共 6 条)不被重置替换；最近刷新时间保留 |
| `refresh-geometry.json` | 刷新逻辑组几何稳定（R1-02 §6.2 #9；AC-072） | idle→manual loading→success 与 idle→manual loading→failure(HTTP 500) 两条序列 | 刷新组/按钮/前方文字/最近成功时间/错误槽/正文区 rect 关键 x/y/w/h 全序列 delta=0；失败内联提示出现不推动任何关键元素 |
| `console-network-summary.json` | 浏览器 console/网络汇总（R1-02 §6.2 #10） | initial/manual/manual 注入 500/query 四段请求+console+pageerror 采集 | 列表请求状态 200/200/500/200；注入 500 后产品显示收敛内联“刷新失败，将在约 60 秒后自动重试”，无全局弹窗、无真实 console error、无未处理 Promise 错误；唯一 console error 为注入 500 的浏览器资源记录(expected) |

## 说明

- 截图文件可用于人工视觉复核；本环境中“图片内嵌读取”不可用，故**每个场景同时以 JSON 记录可审计 DOM/几何度量**，不作为截图肉眼判读的替代。
- 本证据属**开发自测**材料：不把 `ACCEPTANCE.md` 任何用例改为 `PASS`；正式验收 `NOT_RUN`、人工视觉验收 `NOT_RUN`、`IMPLEMENTED_ACCEPTED` 不设置。
- 全量测试 / `vue-tsc` / Vite 构建原始日志与浏览器无关，见 `…/R1/frontend/*.txt`（任务 §9）。
