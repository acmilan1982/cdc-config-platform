# 探针端管理 列表页面视觉与交互调整报告（CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001）

> 状态：`IMPLEMENTED_PENDING_USER_ACCEPTANCE`（列表页定向调整已实现并通过自动化与真实页面复验，前后端保持运行，等待项目负责人亲自目测复验；76 条正式验收仍为 `NOT_RUN`）。本报告按规范不写入“包含本报告的最终 Commit ID”，最终提交 ID 仅在 Push 后于控制台结果块输出。

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务代码 | `CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001` |
| 功能 | 探针端管理（client-config）列表页面视觉与交互定向调整 |
| 任务类型 | 已批准需求的定向文档修订 + 前端列表页面调整 + 自动化与真实页面复验 |
| 分支 | `develop` |
| 任务基线提交 | `28bd09ee268b5cf44c3cc04bc3b1f678ca8590b4` |
| 报告路径 | `docs/features/client-config/reports/CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001.md` |
| 目标/当前状态 | `IMPLEMENTED_PENDING_USER_ACCEPTANCE` |
| 正式验收执行状态 | 76 条 `CCFG-AC-001~076` 全部 `NOT_RUN`（本任务未执行任何验收项） |
| 下一入口 | `PROJECT_OWNER_LIST_UI_REVIEW`（项目负责人列表页面目测复验） |

范围边界（来自任务提示词，全程保持）：只调整探针端管理列表页面；不动新增/编辑弹窗、后端、数据库结构与设计、`log-query` 或其他模块、全局布局与全局主题；数据库只读、DML/DDL 禁止；不访问/操作 ZooKeeper、Kafka；不启动/停止/重启无关服务；不修改生产数据、不连接生产环境；76 条正式验收保持 `NOT_RUN`。

## 2. Git 现场与基线门禁

开始前记录：

- 分支：`develop`；本地 `HEAD = 28bd09ee268b5cf44c3cc04bc3b1f678ca8590b4`。
- 远程：`git ls-remote origin refs/heads/develop = 28bd09ee268b5cf44c3cc04bc3b1f678ca8590b4`；与任务基线一致。
- `git rev-list --left-right --count HEAD...origin/develop = 0  0`（ahead/behind `0 0`）。
- 全程未执行 `git fetch`/`pull`/`merge`/`rebase`/`reset`/`clean`/`checkout`/`stash`/force push。

### 2.1 工作区初始分类（用户资产保护）

任务开始前工作区已存在大量与本任务无关的改动与未跟踪文件，均判定为用户资产，全程不修改、不覆盖、不暂存、不提交。不使用 `git add .` / `git add -A`。

| 类别 | 文件 | 处理 |
|---|---|---|
| 本任务范围内已跟踪修改 | `docs/features/client-config/{REQUIREMENTS,ACCEPTANCE,UI}.md`、`frontend/src/views/client-config/ClientConfigPage.vue`、`ClientConfigPage.spec.ts` | 仅这些作为文档/代码改动提交 |
| 本任务新增（实现/测试/报告） | `frontend/src/views/client-config/listLayout.ts`、`listLayout.spec.ts`、本报告 | 新增提交 |
| 无关用户资产（不改动） | `.claude/settings.local.json`、`agent-env.sh`、`docs/database/*`（三份被删文档）、`frontend/index.html`、`frontend/src/config/menu.ts`、`frontend/src/layouts/*`、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`、`docs/agent-prompts/*`、`docs/prompts/*`、`docs/features/{app-shell,large-screen}/*`、`frontend/src/views/large-screen/*`、`package-lock.json` 等百余项 | 保持原样，不暂存不提交 |

## 3. 文档定向修订清单与追踪映射

仅修订列表展示口径相关条款，未新增/删除/重排需求与验收编号，未改动新增/编辑弹窗与后端/接口/全局体系相关文字。文档状态维持各自既有状态（需求与验收为 `APPROVED`，UI 为 `APPROVED`）。

| 文档 | 修订条目 | 受影响业务行 | 变更性质 |
|---|---|---|---|
| `REQUIREMENTS.md` | 正文需求编号不变 | `CCFG-REQ-013/014/015/016/017/024` | 仅改写列表展示/交互口径文字（两行预留与自适应、动态 `+N`、标签省略与单实例 Tooltip、异常优先、取消“双击可编辑”弱提示但保留交互） |
| `REQUIREMENTS.md` | 元数据/变更记录 | 无 | 追加 2026-09-05 变更记录行 |
| `ACCEPTANCE.md` | 元数据“任务编号” | 无 | 追加本任务编号 |
| `ACCEPTANCE.md` | 验收场景/预期文字 | `CCFG-AC-010/011/012/013/018` | 仅改写场景与预期文字；编号、顺序、追踪关系、执行状态不变 |
| `ACCEPTANCE.md` | 变更记录 | 无 | 追加 2026-09-05 变更记录行 |
| `UI.md` | 界面设计定义行 | `CCFG-UI-002/003/004/005/006/007/008/009/010/022/024` | 仅改写列表页视觉/交互决定；界面编号与数量（26 条）不变 |
| `UI.md` | 变更记录 | 无 | 追加 2026-09-05 变更记录行 |

核验：`ACCEPTANCE.md` 执行表 76 条（`CCFG-AC-001~076`）状态列全部仍为 `NOT_RUN`；`REQUIREMENTS.md` 需求 90 条连续唯一；三份文档未改弹窗相关条款（如 UI 的 `CCFG-UI-013/014/015/016/017` 设计行本轮零改动）。

## 4. 实现文件与关键算法

| 文件 | 说明 |
|---|---|
| `frontend/src/views/client-config/listLayout.ts`（新增） | 两行打包纯函数 `packTwoLines`、单行省略判定 `descNeedsTip`、与列表标签同盒模型的离屏测量 `measureChipWidth`。jsdom 无布局时不臆测宽度，按“全部直接展示”兜底 |
| `frontend/src/views/client-config/listLayout.spec.ts`（新增） | 上述纯函数单元测试（注入数值测量） |
| `frontend/src/views/client-config/ClientConfigPage.vue` | 列表页面展示/交互调整（见下） |
| `frontend/src/views/client-config/ClientConfigPage.spec.ts` | 相应前端测试扩充（62 例，原 49 例） |

### 4.1 两行自适应打包（核心交互）

- `orderedSources`：异常优先、组内保持接口原顺序，仅用于可见两行的展示顺序，不原地修改持久化数组。
- `packTwoLines(widths, containerWidth, gap, moreWidth, maxLines=2)`：
  1. 先按“整行尽量放满”检查能否把全部标签放入 `maxLines` 行 → 能则 `shown=全部、无 +N`；
  2. 放不下时，前 `maxLines-1` 行按整行容量放满，最后一行以 `容量 = 容器宽 − (moreWidth + gap)` 放满，为 `+N` 在第二行末尾预留槽位，保证 `+N` 不被裁切、不换到第三行、不越界；
  3. `N = 总数 − shown`。
- 每行内部按“从当前起点顺次尝试，超出行容量则换行/停止”，是真实的换行打包，而非“固定前三个/固定字符数”。

### 4.2 行高预留与渲染

- `.cc-src`（采集数据源单元格）：`display:flex; flex-wrap:wrap; align-content:flex-start; gap:6px; min-width:0; height:50px; overflow:hidden`，固定预留两行标签高度，行不随数据源数量撑成第三行。
- 标签宽度上限：CSS `max-width:10em` + `text-overflow:ellipsis`（CSS 省略，不用字符串截取破坏中英文混排）。
- 计算来源全部来自真实 DOM 几何：
  - `recomputeRow(clientId, containerWidth, srcEl?)`：按容器宽与各标签实测宽（`measureChipWidth` 同盒模型）决策；行级歧义标签优先占位扣除。
  - `recomputeAllRows()`：直接查询当前 DOM `.cc-src[data-client-id]` 逐行重算。
  - 修复点：el-table 数据变化时会复用行 `<tr>` DOM 且不重建 ref，按渲染期捕获的 `clientId` 维护的 `srcEls` 映射会过期，ResizeObserver 也不会对复用且宽度不变的元素重新回调，导致自然宽度下整行不重算、出现第三行裁切且无 `+N`。现改为以 `data-client-id` 实时读当前渲染结果，而非信任 ref 映射。
  - 触发链：每次列表加载成功（带请求序号守卫防竞态）→ `settleTwoLineLayout()`（双层 `requestAnimationFrame` 等待渲染落定）→ `recomputeAllRows()`；另挂 ResizeObserver（回调把被观察元素一并传入 `recomputeRow`）与窗口 resize。
  - 资源安全：RO 仅观察当前单元格元素，卸载时 `disconnect()` 并清空 `srcEls`/`shownMap`，无循环监听。

### 4.3 页面级单实例悬停 Tooltip

- 描述与数据源标签共用单份 Teleport 的 `.cc-single-tip`，以 `v-show` 控制，DOM 全页恒为一份（“最多一个”由单一实例 + 定时器归并保证，非缩短动画掩盖）。
- 交互时序：进入新可提示元素立即 `clearTip()` 关旧；稳定悬停约 240ms 后显示；鼠标离开立即隐藏（无隐藏延迟）；`pointer-events:none`，Tooltip 不可进入/保持。
- 清理时机：查询/重置/重新加载/打开弹窗/关闭页面/组件卸载均清除当前 Tooltip 与定时器；打开点击式 `+N` 清单前清除旧 Tooltip，避免遮挡。
- 内容规则：标签 Tooltip 只含完整机构名称 + `数据源 ID：xxx`（+异常原因/冲突探针），不含 `DATA_SOURCE_NAME`；描述仅截断时显示完整描述，空描述显示占位 `—` 并提示“未填写探针描述”。

### 4.4 状态与操作、查询区、工具栏、列宽

- 状态为不可点击胶囊标签：启用浅绿/绿字、停用浅灰/灰字、异常浅红/红字；启停为文字按钮（启用=蓝、停用=红），与标签间有明显间距；既有启停业务事件不变。
- 查询区改为卡片外独立区，外部标签“探针信息/探针状态”，占位“请输入探针 ID 或探针描述”，输入框无搜索图标，状态默认“全部”。
- 独立表格卡片内含工具栏：新增探针（主按钮+加号图标）、删除所选（删除图标；未选中灰禁用，选中红描边危险按钮不红填充；右侧显示 `已选择：{探针ID}`，未选中不显示伪 ID）；不再显示“双击记录可编辑”提示，双击行与探针 ID 键盘编辑保留。
- 行高与列宽见 §7；页面只放大列表内部尺度，不改全局缩放/布局/主题。

## 5. 自动化测试与构建

| 项目 | 命令 | 结果 |
|---|---|---|
| 定向测试 | `npx vitest run src/views/client-config/listLayout.spec.ts src/views/client-config/ClientConfigPage.spec.ts`（含于全量） | listLayout `11/11`、ClientConfigPage `62/62` 通过（含新增/编辑弹窗相关既有测试，证明弹窗未变） |
| 前端全量测试 | `npm test`（vitest run） | `Test Files 37 passed (37), Tests 577 passed (577)` → `577/577` |
| 前端生产构建 | `npm run build`（vue-tsc --noEmit && vite build） | `✓ built in 18.46s`，exit 0（仅既有 chunk>500kB 提示，非错误） |

后端代码零差异（本任务未触碰 `backend/`；`git status --short backend/` 为空）。未执行与前端无关的额外后端测试。

## 6. 弹窗与其它模块零差异证明

- 新增/编辑弹窗模板块：以 `awk` 抽取 HEAD 版本与当前版本 `<el-dialog>…</el-dialog>` 全文比对 → **逐字节一致**。
- 弹窗脚本处理：`openCreate/openEdit/resetDialog/submitDialog/mode` 等在当前与 HEAD 均存在、逻辑未改（仅随模板整体行号后移）。
- diff 逐行审查：当前文件 `git diff` 的变更行中无任何 `el-dialog`、`dialogVisible`、`dialogForm`、表单校验、`submitDialog` 内部、`.cc-dialog`/`.el-dialog__*` 样式等弹窗标识；命中“新增探针”字样的行仅工具栏按钮图标化，属本任务范围。
- 其它模块：`log-query`、数据订阅、大屏、布局/主题文件均未改动（用户资产文件未 touch）。
- 运行验证：真实页面双击行与探针 ID Enter 均打开“编辑探针”弹窗（§8 F1/F2）。

## 7. 两行动态 `+N` 不同宽度验证（真实浏览器）

夹具 `CCFG-AC-R1-ON`（7 个数据源，org 名 `CCFG-AC-R1-人工验收机构01~07`）在 6 档窗口宽度下的实测（chromium headless，`CCFG-AC-R1` 查询命中 4 条夹具，观察 ON 行）：

| 窗口宽 | 采集源单元格可用宽 srcW | 直接展示 shown | `+N` | 行高 rowH | 标签区 srcH | 第三行 | 页面横向溢出 |
|---|---|---|---|---|---|---|---|
| 1600 | 526px | 7 | 无（两行放得下） | 67px | 50px | 无 | 0 |
| 1500 | 426px | 6 | `+1` | 67px | 50px | 无 | 0 |
| 1440 | 366px | 4 | `+3` | 67px | 50px | 无 | 0 |
| 1366 | 292px | 4 | `+3` | 67px | 50px | 无 | 0 |
| 1280 | 236px | 2 | `+5` | 67px | 50px | 无 | 0 |
| 1100 | 236px | 2 | `+5` | 67px | 50px | 无 | 0 |

- 不变量成立：`直接展示 + N = 7` 且 `N = 未直接展示数量`（如 1280 下 `2 + 5 = 7`）。
- 各档均无第三行、无标签越界、`+N` 不被裁切/消失、无页面异常横向溢出；同一布局在自然宽度（不经窗口 resize 触发）下即正确，修复 el-table 行 DOM 复用导致的 stale 重算问题后成立。
- 点击 `+N` 打开完整清单：7 项全部、按原保存顺序（机构01→07），异常项不隐藏，清单不改变行高（非第三行展开）。窗口/列宽变化自动重算，不依赖刷新。

行高几何说明：目标常规行视觉高度约 68~76px。实测 el-table 行总高 `rowH=67px`（含行自身 padding/边框），其中标签区固定 50px 恰好容纳两行 20px 行高标签 + 6px 间距；已与既有组件盒模型贴合，未见裁切或巨大留白，最终以项目负责人目测为准。

## 8. 真实页面验证（浏览器自动化）

夹具覆盖与结论（chromium headless + 真实服务，`http://127.0.0.1:5173/config/client`）：

- 四条夹具均正常渲染：`CCFG-AC-R1-ON`（启用，7 源）、`CCFG-AC-R1-OFF`（停用，空描述占位 `—`）、`CCFG-AC-R1-HIST-COM`（历史逗号歧义，2 个 NOT_FOUND 异常标签）、`CCFG-AC-R1-ABN`（异常原始值 `X`，1 个 INACTIVE 异常标签）；无 page error。
- 页面标题“探针端管理”、说明文字、查询标签/占位、状态默认“全部”、输入无搜索图标、新增/删除图标、删除未选禁用、无“双击记录可编辑”提示、无伪“已选择” —— 全部通过。
- 点击选择 ON 行后“删除所选”由禁用变可用（`cc-btn-delete--armed`，红描边/白底/红字，非红填充），右侧显示真实 `已选择：CCFG-AC-R1-ON`。
- 状态胶囊与启停按钮计算样式分离（启用绿 `rgb(103,194,58)`、停用灰 `rgb(144,147,153)`、异常红 `rgb(245,108,108)`；停用操作红 `rgb(245,108,108)`、启用操作蓝 `rgb(37,99,235)`；胶囊非按钮、操作为按钮，间距明显）。
- Tooltip 单实例时序（悬停测量）：110ms 未显示→约 370ms 显示 1 个；chip1→chip2 切换 70ms 时旧已关闭且全程最多 1；离开 80ms 立即隐藏；快速扫过多行全程最多 0/1；空描述悬停提示“未填写探针描述”；截断描述悬停显示完整描述；异常标签悬停含机构/ID/异常原因（如 `mock7-业务库 … 数据源 ID：mock7 … 异常原因：已停用`）；计数说明类提示正常；Tooltip 与 `+N` 清单不越出可视区、无叠留。
- 状态列“异常”显示原始值（`异常（原始值=X）`），非 `0/1` 行无“启用”操作。
- 交互保留：双击行打开“编辑探针”；探针 ID 单元格键盘聚焦 Enter 打开编辑。

证据截图（服务器本地，未提交 Git）：`/tmp/ccfg-list-ui-adj-001-evidence/final_fixtures_{1600,1280,1100}.png`、`final_chipTooltip_1280.png`、`final_abnormalTooltip_1280.png`、`final_blankDescTooltip_1100.png`、`final_plusN_popover_1280.png`（Read 工具在此环境无法内嵌渲染图片，几何/计算样式/时序证据以数值方式记录于 §7/§8，截图供项目负责人目测复核）。

## 9. 数据库零写入与夹具保留证明

- 本任务数据库访问为只读：仅通过 `GET /api/clients?...`（后端只读 SQL）与 SELECT 类查询观察；未执行任何 INSERT/UPDATE/DELETE/MERGE/DDL/匿名块。
- 未创建、修改、删除任何验收夹具与业务记录。真实数据仍为 11 条探针（含 4 条人工验收夹具），夹具关联的机构名/数据源名/状态均未改动；本任务不清理、不修复、不重建夹具。
- 未访问/操作 ZooKeeper、Kafka（后端自身对 ZK 的常规连接与任务无关，本任务不触碰）。
- 后端代码零差异：`backend/` 无任何改动；接口契约（API/DTO/VO）零差异。

## 10. 服务、访问地址与外部访问

- 前端（Vite dev，HMR）：PID `2415`，监听 `0.0.0.0:5173`；日志 `/tmp/ccfg-ac-prep-001/frontend-dev-2.log`。
- 后端（Spring Boot，既有服务，本任务未重启）：PID `2393`（java），监听 `*:8080`；日志 `/tmp/ccfg-ac-prep-001/backend-start-2.log`。
- 访问地址：
  - 本机：`http://127.0.0.1:5173/config/client`
  - 外部（供项目负责人）：`http://192.168.174.70:5173/config/client`
- 外部访问已验证：`curl --noproxy '*'` 对 `http://192.168.174.70:5173/config/client` 与经 Vite 代理的 `…/api/clients?keyword=CCFG-AC-R1&status=ALL` 均返回 HTTP 200。服务保持运行直至项目负责人完成目测或明确要求停止。

## 11. 未解决问题与人工目测检查清单

自动化与真实页面数值复验已通过，但“视觉是否舒展/行高留白是否合适”最终以项目负责人目测为准。建议目测重点：

1. 常用窗口（如 1500~1600）与较小桌面窗口（如 1280、1100）下两行标签、动态 `+N`、整体留白是否舒适，行高约 67px 是否符合预期（如觉得偏低可仅调行高，不改布局算法）。
2. 查询区/工具栏/表格卡的层级与间距、按钮图标观感。
3. 快速扫过描述与数据源标签时是否始终最多一个 Tooltip、是否无残留。
4. 状态胶囊与“启用/停用”文字操作是否一眼可区分。
5. 点击 `+N` 完整清单、双击/Enter 编辑、选择“已选择”提示、删除按钮红描边观感。
6. 探针 ID 悬停完整值、超长标签省略与悬停详情（不含数据源名称）。

未发现需要在列表页范围内继续修正的阻塞问题。若目测发现视觉偏差属列表页展示口径，可作为本任务后续小修；凡涉及新增/编辑弹窗、后端、全局体系或正式验收执行的，均超出本任务范围，需另立任务。
