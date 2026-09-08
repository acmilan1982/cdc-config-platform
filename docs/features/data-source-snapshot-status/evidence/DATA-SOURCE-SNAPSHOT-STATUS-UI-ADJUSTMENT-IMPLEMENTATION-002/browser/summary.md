# Browser Evidence — 源库快照状态 第 2 轮 UI 调整（表格铺满/两列简化/下拉截断）开发自测

- 任务：`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-002`
- 证据目录：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-002/browser`
- 取证方式：Headless Chrome（`/usr/bin/google-chrome`，Chrome 148）+ Node 24 原生 CDP（`--headless=new --no-sandbox --disable-gpu --no-proxy-server --disable-dev-shm-usage`）；`Emulation.setDeviceMetricsOverride` 换视口、`Input.dispatchMouseEvent` 真实鼠标移动/点击、`Page.captureScreenshot`、`Runtime.evaluate` 读 DOM/几何。图片内嵌读取在本环境不可用，故每份截图同时配套 JSON 可审计度量。
- 页面地址（保持运行供人工查看）：`http://192.168.174.70:5173/monitor/data-source-state`
  - 前端 dev server：vite，PID 2807，监听 `0.0.0.0:5173`（`/api/*` 代理到后端）；
  - 后端：`cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`，PID 2725，监听 `*:8080`；
  - 本机经 `127.0.0.1:5173` 取证访问同一页面；对外 `192.168.174.70:5173` 与本机 `curl` 均 HTTP 200 可达。
- 数据：真实后端只读样例 30 行；超长 `CLIENT_DESC` 最长 152 字、6 条未知状态、32 个 `--` 空时间。取证未对数据库 / ZooKeeper / Kafka / 后端做任何写操作。

## 真实后端 vs 浏览器层临时 Mock

- 除明确标记“浏览器层临时拦截”外，全部为**真实后端**（`GET /api/monitor/data-source-run-state/list`，HTTP 200）。
- 临时拦截仅用于构造真实开发数据无法覆盖的边界场景（ACTIVE/INACTIVE/NOT_FOUND、ORG 空、25 个 Unicode 码点超长 ID/描述、emoji 代理对、候选消失 ghost），只对本页列表 GET 做临时 `Fetch.fulfillRequest`（code=200），随取证进程退出自动撤销；不修改生产代码、不改 Vue 内部 ref、不访问数据库。
- 拦截会话内对列表请求计数 = 页面实际列表请求计数，用于证明“只新增一次查询请求、发送完整值、重置零请求”。

## 结论性核对项（与批准基线对照）

- **表格铺满（DSS-REQ-069/AC-073）**：7 列弹性表格，固定列在 1440/1600/1920 下均恒为 `70/130/165/165/165`（delta=0）；探针端 `min-width:170`、源库 `min-width:280` 弹性吸收全部剩余且源库恒比探针宽。
- **无固定总宽 1145px、窄屏滚动保留**：源码无 `width:1145px`，仅 `width:100%`＋`min-width:1145px`。
- **探针端列简化（DSS-REQ-073/AC-082）**：仅 INACTIVE 显示红色普通文字“停用”（SPAN，非图标），其余行不显示；无黄色图标/异常说明；Tooltip 唯一内容源为非空完整 `CLIENT_DESC`。
- **源库列简化（DSS-REQ-074/AC-075）**：ORG 非空显示 ORG、ORG 空/未找到回退原始 `DATA_SOURCE_ID`；两类行 Tooltip 恒为完整原始 `DATA_SOURCE_ID`，绝不含 ORG；源库列无黄色图标、无“停用”。
- **客户端下拉截断与宽度（DSS-REQ-075/AC-084/085）**：ID/描述各逻辑截断至 20 code point＋`...`（emoji 代理对安全）；完整 value 与请求参数严格分离；控件宽 240/300/200px、popper 上限 `min(480px, vw-16)`/`min(560px, vw-16)`；闭合长标签 ellipsis 不撑坏布局。
- **Tooltip 单实例（DSS-REQ-070/AC-076/077）**：任意采样时刻可见 Tooltip 数 ≤1；不越界、不被表格裁切、无原生 `title`。
- **六类请求唯一视觉（DSS-REQ-071，AC-078/050）**：manual 刷新恰好 +1 次列表请求，查询按钮文字/loading/几何稳定；query 仅查询按钮 loading；reset 零请求。
- 本轮**未修改后端 / API / 类型 / 查询刷新状态机**：请求次数、URL、重置行为与既有批准行为一致。

## 证据清单

| 文件 | 对应批准规则 | 操作与实测 | 结论 |
|---|---|---|---|
| `table-fill-1440.png/.json` | DSS-REQ-069/AC-073 | 1440×900 真实后端；card 内容区 1089px **<1145 下限**（本 shell 在 1440 已属窄屏档） | 固定列 70/130/165/165/165 精确保持；表格取 min 1145、wrap 出现横向滚动、右空白 0；表头单行 h40 |
| `table-fill-1600.png/.json`（补充） | 同上（阈值上方演示吸收） | 1600×900 真实后端；card 内容 1249px >1145 | 表格宽=wrap=1249 铺满、右缘贴合；探针 210/源库 344 吸收剩余且源库更宽；固定列不变；无 h-scroll |
| `table-fill-1920.png/.json` | 同上 | 1920×1080 真实后端；card 内容 1569px | 表格宽=1569 铺满、右空白 0、无 h-scroll；探针 331/源库 543；刷新组/结果头部位置不随表格铺满变化 |
| `table-narrow-scroll.png/.json` | 窄屏 min-width+滚动规则 | 真实 1280 视口（内容 929px<1145）+ 在 1600 视口临时把卡片正文压到 1040px（内容 ~1008px<1145）复核不变量 | 表格 min 1145 保持、wrap 横向滚动；固定时间列 165 不压缩不换行；`forcedInvariant` 复证 |
| `client-column-states.png/.json` | DSS-REQ-073/AC-082、CLIENT_DESC tooltip | 临时 Mock 5 行：ACTIVE/INACTIVE/INACTIVE空描述/NOT_FOUND/ACTIVE空描述 | 仅 INACTIVE 两行红色普通文字“停用”（SPAN 非 icon）；ACTIVE/NOT_FOUND 无；黄色图标 0；tooltip 只出现在非空 desc 行（值=完整 desc），空 desc 行无 tooltip |
| `source-column-tooltip.png/.json`、`source-column-tooltip-fallback.png` | DSS-REQ-074/AC-075 | 临时 Mock：正常 ORG 行 + ORG 空/NOT_FOUND 回退行 | 正常行主文=ORG、回退行主文=原始 ID；两行 tooltip 内容分别=`SRC-MYSQL-BIZ-8801`/`SRC-ORA-LGD-7766`（原始 ID，非 ORG）；源库列无黄标无“停用” |
| `client-dropdown-truncation.png/.json`、`client-dropdown-width-compare.png` | DSS-REQ-075/AC-084/085 | 临时 Mock 超长候选：25×X+25×Y、25 emoji、25×N 空描述、短名 | 下拉项分别显示 `X20...(Y20...)`、`(😀)20...（表情探针）`、`N20...`（无空括号）、完整短名；单行 h34；客户端面板 478px（≤480）窄于源库面板 558px（≤560）；源库长 ORG 不截断；闭合长标签控制宽 240/高 32/ellipsis 生效 |
| `client-full-value-query.json`、`client-dropdown-ghost.png` | DSS-REQ-075（展示/发送分离）、DSS-REQ-071④/AC-078 | 选中被截断显示的超长候选点“查询” | 显示文本为 `X20...(Y20...)`，但请求参数 `clientId`=完整 25×X（`fullIdSent=true`）；新增请求数恰 1（initial→query，1→2）；候选消失后重开下拉显示 ghost `X20...（不在候选内）`（含 dss-ghost 弱化类、单行） |
| `tooltip-single-instance.json` | DSS-REQ-070/AC-076/077 | 真实 30 行 30 触发点（探针 desc/源库 ID/状态原始值）正反两遍 dwell 扫掠，采 300 样本 | 任意采样时刻可见 Tooltip ≤1（max=1，可见样本 115）；内容 11 种不同（desc/sourceId/`原始状态：`）；0 越界；表格内原生 title=0；移开后 host 消失 |
| `refresh-regression.json` | DSS-REQ-071/AC-050/078 | 真实后端点一次“立即刷新”；再按 UNKNOWN 查询后点“重置” | manual 恰好 +1 次列表请求；刷新组/按钮/结果头部几何 delta=0；查询按钮 loading/文字稳定；最近成功刷新时间更新（23:07:40→44）；重置零请求（query→reset 增量 0），下拉恢复三项“全部” |
| `console-network-summary.json` | §8.2#10 | 全程 console/网络汇总 | 真实阶段 8 次列表 GET 全 200、拦截阶段 2 次（initial+query 完整 clientId）；写请求 0；console 仅 vite HMR debug；无 exception/pageerror |

## 说明

- 每份截图配套 JSON 记录可审计的 DOM/几何/请求度量；列宽等像素测量允许浏览器亚像素误差，均以实测值记录并给出 delta/容差判定（deviceScaleFactor=1，delta=0）。
- 1440/1280 视口下本页面实际可用内容宽度（card 内 1089/929px）小于弹性表下限 1145px，故表格进入 min-width+横向滚动档；吸收铺满档由 1600/1920 及 `forcedInvariant` 明确验证——该差异源于应用外壳自身内容区宽度，非本轮实现缺陷。
- 本证据属**开发自测**材料：不把 `ACCEPTANCE.md` 任何用例改为 `PASS`；正式验收 `NOT_RUN`、人工视觉验收 `NOT_RUN`、`IMPLEMENTED_ACCEPTED` 不设置；全部结果以 `DEV_SELF_TEST_DONE` 口径表述。
- 全量测试 / `vue-tsc` / Vite 构建原始日志见同目录上级 `…/IMPLEMENTATION-002/frontend/*.txt`。
