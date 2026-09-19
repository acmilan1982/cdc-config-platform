# DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001-R1 执行报告

- 任务编号：`DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001-R1`
- 日期：2026-09-19
- 分支：`develop`
- 任务性质：`FEATURE_ADJUSTMENT_BASELINE_DRAFT_R1`（**纯文档任务**，仅修订需求/设计/验收/API/UI 文档）
- 实现授权：`NOT_GRANTED_IN_THIS_TASK`
- 授权读取：当前远程 Git、当前基线、相关代码与测试（只读）
- 实际基线提交（base）：`01680ee527b8e35cd4afd84c4789b862d34f7a77`
- 结果提交 / Push：见任务控制台结果块 `result_commit_id` / `remote_commit_id` / `ahead_behind`
- 测试与构建：`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`

> 本任务为“数据源管理列表页选择性接入查询列表页公共组件”草案基线的 **R1 修订**，解决 ChatGPT 从远程 Git
> 独立复审发现的四项问题。**未**修改任何 `.vue`/`.ts`/`.java`/测试/依赖/锁文件/配置/SQL；
> **未**访问数据库 / ZooKeeper / Kafka；**未**启动服务；**未**修改公共组件实现；**未**迁移其他页面。
> 任务停在“ChatGPT 远程复审 R1 + 项目负责人批准调整基线”入口。

---

## 1. 任务开始前 Git 现场（只读预检）

```text
branch=develop
git status --short --branch = "## develop...origin/develop" + " M .claude/settings.local.json" + "?? docs/prompts/"
HEAD=01680ee527b8e35cd4afd84c4789b862d34f7a77
origin/develop=01680ee527b8e35cd4afd84c4789b862d34f7a77
rev-list --left-right --count HEAD...origin/develop = 0	0
```

- 预检执行了 `git fetch origin develop`、`git status --short --branch`、`git rev-parse HEAD`、`git rev-parse origin/develop`。
- `HEAD` 与 `origin/develop` 均为提示词预期基线 `01680ee5...`，**无远程新提交**、**无分叉**，可安全地在最新 `origin/develop` 上完成本次纯文档修订。
- 任务外未提交内容：`.claude/settings.local.json`（Agent 运行环境自动追加的 `Bash(...)` 权限条目）与未跟踪目录 `docs/prompts/`。二者**均未**被暂存、提交、回滚或覆盖；本任务**未**对其执行 `git checkout`/`restore`（项目 Git 规则禁止）。
- 未执行任何强推、变基或历史改写。

## 2. 强制全文阅读清单与逐项阅读状态

> 按提示词第三节要求，逐个**全文阅读**（非 `grep`、非局部片段）。路径与文件名与提示词不一致时，已用 `rg --files` 定位同义正式文档。

### 2.1 项目级基线与流程（§3.1）

| 提示词路径 | 实际路径 | 阅读状态 |
|---|---|---|
| `AGENTS.md` | 不存在（仓库根目录无该文件） | `NOT_FOUND`（如实记录，未虚构） |
| `docs/README.md` | 不存在（仓库 `docs/` 下无 `README.md`） | `NOT_FOUND` |
| `docs/PROJECT_STATUS.md` | `docs/baseline/PROJECT_STATUS.md` | `READ_FULL`（重定位） |
| `docs/PROJECT_HISTORY.md` | 不存在（无同名/同义正式文档） | `NOT_FOUND` |
| `docs/TESTING.md` | 不存在（无同名/同义正式文档） | `NOT_FOUND` |
| `docs/DEVELOPMENT.md` | `docs/baseline/DEVELOPMENT_RULES.md` | `READ_FULL`（重定位） |
| `docs/SECURITY.md` | 不存在（无同名/同义正式文档） | `NOT_FOUND` |
| `docs/process/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md` | `docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md` | `READ_FULL`（重定位） |
| `docs/features/README.md` | 同路径（存在） | `READ_FULL` |

补充：为满足 `CLAUDE.md` §3.1 的强制项目级基线读取要求，另全文阅读了 `docs/baseline/` 下六份正式基线（`PROJECT.md`、`ENVIRONMENT.md`、`ARCHITECTURE.md`、`DEVELOPMENT_RULES.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md`）与仓库根 `README.md`。

### 2.2 查询列表页公共组件基线（§3.2）

| 提示词路径 | 实际路径 | 阅读状态 |
|---|---|---|
| `README.md` | `docs/baseline/query-list-page-template/README.md` | `READ_FULL` |
| `REQUIREMENTS.md` | 模板目录**无**该文件 | `NOT_FOUND` |
| `ACCEPTANCE.md` | 模板目录**无**该文件 | `NOT_FOUND` |
| `DESIGN.md` | `docs/baseline/query-list-page-template/DESIGN.md` | `READ_FULL` |
| `API.md` | 模板目录**无**该文件 | `NOT_FOUND` |
| `UI.md` | `docs/baseline/query-list-page-template/UI.md` | `READ_FULL` |
| `MIGRATION.md` | `docs/baseline/query-list-page-template/MIGRATION.md` | `READ_FULL` |

说明：模板目录实际内容为 `README.md`、`DESIGN.md`、`UI.md`、`SHARED_COMPONENT_DESIGN.md`、`MIGRATION.md` 及 `reports/`、`evidence/` 子目录，不含 `REQUIREMENTS.md`/`ACCEPTANCE.md`/`API.md`（模板以 `SHARED_COMPONENT_DESIGN.md` 承载组件契约）。

另因 `CLAUDE.md` §3.4 与本次修正 §5.2/§5.3 的组件契约核对需要，另行只读核对了 `SHARED_COMPONENT_DESIGN.md` 的组件契约章节（§7.4.2 `QueryListQueryPanel.vue`、§7.4.3 `QueryListActions.vue`、§7.4.4 `QueryListResultPanel.vue`、§7.4.5 `QueryListRefreshToolbar.vue`（仅核对未接入范围），以及 `UI.md` §2.2 控件宽度适配边界），并只读核对了公共组件源码。核对结论与 R1 一致：`QueryListResultPanel` 固定 DOM 顺序为 `header → __error-slot → __divider → __body > slot[body]`（错误槽 `min-height: 22px`，**组件始终渲染**，且 `#error` 槽与 `errorText` 契约并存）；`QueryListQueryPanel.__flow` 为 `flex-wrap: wrap`、字段组**整体换行**、控件宽度属 Feature（公共层不设默认宽度）；模板 §2.2 对“单选下拉”的建议为**固定宽度**，故角色下拉冻结 `140px` 与模板规则不冲突。

> 补充说明（避免歧义）：模板 `UI.md` §1.3 关于“错误槽为**可选能力**、模板不强制所有页面保留该槽位”的表述，与 R1“保留固定错误槽”**不冲突**——该槽位由 `QueryListResultPanel` 组件自身**始终渲染并预留高度**；模板所述“可选”指的是“页面是否向槽内放入错误内容”，而本页明确选择把 `loadError` 映射进去，因此既保留槽位也保留错误提示能力。

### 2.3 数据源管理功能文档与相关代码（§3.3，只读）

| 文件 | 阅读状态 |
|---|---|
| `docs/features/data-source-management/README.md` | `READ_FULL` |
| `docs/features/data-source-management/REQUIREMENTS.md` | `READ_FULL` |
| `docs/features/data-source-management/ACCEPTANCE.md` | `READ_FULL` |
| `docs/features/data-source-management/DESIGN.md` | `READ_FULL` |
| `docs/features/data-source-management/API.md` | `READ_FULL` |
| `docs/features/data-source-management/UI.md` | `READ_FULL` |
| `docs/features/data-source-management/DATABASE.md` | `READ_FULL` |
| `docs/features/data-source-management/reports/DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001.md` | `READ_FULL` |

只读核对的当前实现（未修改）：

| 组件 | 实际路径 | 阅读状态 |
|---|---|---|
| `DataSourceController` | `backend/src/main/java/com/bsoft/cdcconfig/datasource/DataSourceController.java` | `READ_FULL` |
| `DataSourceQuery` | `backend/src/main/java/com/bsoft/cdcconfig/datasource/query/DataSourceQuery.java` | `READ_FULL` |
| `GlobalExceptionHandler` | `backend/src/main/java/com/bsoft/cdcconfig/common/exception/GlobalExceptionHandler.java` | `READ_FULL` |
| `DataSourcePage.vue` | `frontend/src/views/data-source/DataSourcePage.vue` | `READ_FULL` |
| `QueryListResultPanel` | `frontend/src/components/query-list/QueryListResultPanel.vue` | `READ_FULL` |
| 本页拟接入的其他公共组件 | `frontend/src/components/query-list/{index.ts,types.ts,QueryListPageShell.vue,QueryListQueryPanel.vue,QueryListActions.vue}` | `READ_FULL` |

### 2.4 全文阅读结论：未发现四项之外的新增影响

完成上述全文阅读后，除本 R1 需修正的四项问题外，**未发现除本 R1 四项之外的新增影响**；未发现会改变已确认产品决定或实现边界的重大冲突，故本任务未触发“停止并报告”路径。

全文阅读过程中确认的**既有过期状态**（**不在**本任务授权修改范围，仅如实记录，与本 R1 四项无直接因果）：

- `docs/features/data-source-management/DATABASE.md` 头部元数据仍为“实现状态 `NOT_STARTED`、106 条验收全部 `NOT_RUN`”，与当前正式复验事实（`IMPLEMENTED_PENDING_REVIEW`、`PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`）不一致。
- `docs/features/README.md` 中“数据源管理”条目仍为“部分实现（后端 CRUD 完整，前端占位）… `BASELINE_NOT_ESTABLISHED`”。
- `docs/baseline/PROJECT_STATUS.md` §1.1 仍将数据源管理列为占位页。

以上三项均**未被**本 R1 修改（`DATABASE.md` 与 `docs/features/README.md`、项目级基线均不在 §7 允许修改范围内），建议由**独立文档维护任务**评估修正。

## 3. 四项复审问题的逐项修正说明

### 3.1 `category` 参数归一化、校验与异常映射（复审问题一）

- 将 `GET + @ModelAttribute` 绑定/字段校验错误由“`MethodArgumentNotValidException`”更正为 **`BindException`**，并把归一化、校验、异常映射冻结为唯一方案：
  1. `DataSourceQuery.category` 为可选字符串查询参数；
  2. 绑定后、Bean Validation 前归一化：`trim()` → `null`/trim 后空串统一转 `null`（表示“全部”）→ 非空值**不自动转大写**，只接受精确大写 `SOURCE`/`TARGET`；
  3. 以**允许 `null`** 的字段约束校验非空值：`@Pattern(regexp = "SOURCE|TARGET", message = "角色仅支持 SOURCE 或 TARGET")`（Bean Validation 对 `null` 不判失败，故“全部”合法）；
  4. 在 `DataSourceController` 增加**功能局部** `@ExceptionHandler(BindException.class)`（与既有局部 `@ExceptionHandler(HttpMessageNotReadableException.class)` 同构），返回 HTTP `400` / 业务 `code=400` / 优先取 `category` 字段校验消息（无法提取时使用明确的通用参数错误消息），不泄露堆栈或内部细节；**不**扩大为全局异常处理器改造；
  5. **显式记录回归风险**：`MethodArgumentNotValidException extends BindException`，控制器局部 `@ExceptionHandler` 优先级高于 `@RestControllerAdvice`，故该局部处理器必须保持既有请求体校验错误的字段级消息语义；
  6. 明确本 R1 **只冻结方案、不实际修改** `DataSourceQuery`/`DataSourceController`/异常处理代码。
- 依据：当前仓库 `GlobalExceptionHandler` **无** `BindException` 处理器，未处理时 `GET + @ModelAttribute` 校验失败会落到 `Exception.class` → HTTP 500；本次冻结的局部处理器是真实修复，方向与 `DS-AC-105`“非法参数返回 HTTP 400 而非 500”一致。

### 3.2 `QueryListResultPanel` 固定结构与错误槽映射（复审问题二）

- 删除“结果区头部下方**直接进入表格**”等与公共组件契约冲突的表述，统一为已验收固定结构：**头部 → 固定错误槽 → 固定分隔线 → `body` 主体槽**。
- `DataSourcePage.vue` 现有 `loadError` 的 `el-alert` 映射到**固定错误槽**，保留现有错误消息展示与关闭行为（不删除错误提示能力）；数据源表格放入 `body` 主体槽；结果区**不增加**“双击数据行可编辑”提示行或其他辅助说明行。
- 明确口径：“无分页”**仅**表示 `body` 中不放分页组件，**不**意味着删除固定错误槽或固定分隔线。
- REQUIREMENTS、DESIGN、UI、ACCEPTANCE 的结构描述与验收口径已一致（`DS-REQ-123`/`136` ↔ `DESIGN §11.2/§11.3/§11.6` ↔ `UI §10.1/§10.5` ↔ `DS-AC-119`/`127`/`130`/`138`）。

### 3.3 角色控件明确为 `el-select` 单选下拉框（复审问题三）

- UI 线框与文字由“角色 (●)全部 ( )源库 ( )目标库”改为 `el-select` **单选下拉框**（`角色 [全部 ▾]`）；文字规范同步为 `el-select`、**不得**画成 Radio / 单选按钮组。
- 冻结：占位与默认“全部”；选项顺序与显示文本固定 全部 / 源库 / 目标库；绑定值依次 空值 / `SOURCE` / `TARGET`；控件宽度 `140px`（同一文档中角色下拉只出现该宽度）；宽屏顺序 数据源 ID → 名称 → 角色 → 主机 → 查询 → 重置；窄屏遵循 `QueryListQueryPanel` 已验收的整组换行规则，不单独发明本页断点或布局算法；查询提交当前角色值，重置后角色回到“全部”。

### 3.4 补齐强制全文阅读与 R1 报告（复审问题四）

- 已按 §3 完成全部全文阅读（见本报告 §2 逐项状态），未沿用上一报告的“仅 grep”结果；对不存在的文件如实记为 `NOT_FOUND`，未虚构已阅读。
- 全文阅读后结论：除本 R1 四项外未发现新增影响（见 §2.4）。

## 4. 修正落入各文档的具体位置

| 文档 | 章节/条目 | 落入的修正 |
|---|---|---|
| `REQUIREMENTS.md` | `DS-REQ-123`（问题二）、`DS-REQ-125`（问题三）、`DS-REQ-128` + 其后新增“R1 修订说明”引用块（问题一）、`DS-REQ-136`（问题二口径）；§21 变更记录新增 R1 行 | 一、二、三 |
| `ACCEPTANCE.md` | `DS-AC-119`、`DS-AC-130`（问题二）、`DS-AC-120`（问题三）、`DS-AC-124`（问题一，含大小写敏感/不静默转大写/空白归一化/通用兜底消息）、`DS-AC-127`（问题二口径）、`DS-AC-138`（错误槽承载范围）；§7 变更记录新增 R1 行 | 一、二、三 |
| `DESIGN.md` | §11.2（组件映射/槽位，问题二、三）、§11.3（结果区结构，问题二）、§11.4（角色条件 + `category` 异常链路七点，问题一、三）、§11.6（无分页口径，问题二）、§11.9 追踪表相应行；§12.2 新增 R1 变更记录 | 一、二、三 |
| `API.md` | §9.1（参数定义与归一化，问题一）、§9.2（非法值行为与异常链路，问题一）、§9.3（差异摘要校验失败口径，问题一）、§9.4（追踪）、新增 §9.5 R1 变更记录；§10 追加 R1 指针 | 一 |
| `UI.md` | §10.1（线框与结构文字，问题二、三）、§10.2（`el-select`/`140px`/排列顺序/不静默纠正非法值，问题一、三）、§10.5（无分页口径，问题二）、§10.6 追踪表相应行；§10.7 新增 R1 变更记录行 | 一、二、三 |
| `README.md` | §4 边界速览（结果卡片固定结构 + 错误槽承载；角色查询改为 `el-select`/`140px`）；§5 变更记录新增 R1 行 | 二、三 |
| `docs/baseline/query-list-page-template/MIGRATION.md` | 既有授权记录末尾**追加**“R1 修订记录（2026-09-19）”子节（R1 任务、修订范围、R1 状态块、边界不变）；**未**改写 §1.1/§5 通用排除原则与既有历史/状态块 | 四（记录），并保持模板通用原则不变 |
| `reports/DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001-R1.md` | 本报告（新建） | 四 |

## 5. `category` 唯一校验与异常链路摘要

```text
DataSourceQuery.category : optional String (query param, GET)
  ↓ binding (@ModelAttribute)
  归一化: trim() → (null | blank → null = "全部") → 非空值不自动转大写
  ↓ Bean Validation (在归一化之后)
  @Pattern(regexp = "SOURCE|TARGET", message = "角色仅支持 SOURCE 或 TARGET")   # null 不判失败
  ↓ 校验失败
  BindException  （NOT MethodArgumentNotValidException）
  ↓
  DataSourceController 功能局部 @ExceptionHandler(BindException.class)
  → 既有统一错误结构: HTTP 400 / code=400 / 优先 category 字段消息（无字段消息时通用参数错误消息）
  → 不泄露堆栈或内部实现细节
  边界: 不改 GlobalExceptionHandler（不做全局异常体系改造）
  风险: MethodArgumentNotValidException extends BindException + 局部处理器优先级 > @RestControllerAdvice
        → 实现阶段必须验证既有请求体校验消息（"field: msg; field: msg"）不回归
  本轮: 仅冻结方案，未修改 DataSourceQuery / DataSourceController / 异常处理代码
  数据库: 无 DDL、无新列/索引/约束（仅复用既有 DATA_SOURCE_CATEGORY 过滤）
```

## 6. `QueryListResultPanel` 插槽映射摘要

```text
QueryListResultPanel（已验收固定结构）
  ├─ 结果区标题/头部            ← Feature 文案：“数据源列表” + 当前结果数量
  ├─ 固定错误槽 (#error)        ← Feature loadError 的 el-alert（保留展示与关闭行为）
  ├─ 固定分隔线 (1px)           ← 保留（“无分页”不删除）
  └─ body 主体槽 (#body)        ← Feature 主表格、空状态、行操作
       toolbar 槽               ← Feature “新增数据源”按钮
  结果区不增加“双击数据行可编辑”提示行或其他辅助说明行
  分页：不在 body 放分页组件（无分页 ≠ 删除固定错误槽或分隔线）

DOM 依据（只读核对 SHARED_COMPONENT_DESIGN.md §7.4.4 + 组件源码）：
  header.ql-result-panel__header > (__summary + __toolbar)
  + div.ql-result-panel__error-slot      # min-height 22px，组件始终渲染（几何稳定设施）
  + div.ql-result-panel__divider         # height 1px，DOM 顺序不可调整
  + div.ql-result-panel__body > slot[body]
```

## 7. 角色 `el-select` 规范摘要

```text
控件      : Element Plus el-select，单选（禁止 Radio / 单选按钮组）
宽度      : 140px（同一文档中角色下拉只出现该宽度）
占位/默认 : “全部”
选项顺序  : 全部 → 源库 → 目标库
绑定值    : 空值 → SOURCE → TARGET
宽屏顺序  : 数据源 ID → 名称 → 角色 → 主机 → 查询 → 重置
窄屏      : 遵循 QueryListQueryPanel 已验收的整组换行规则（不自造断点）
查询/重置 : 查询提交当前角色值；重置后角色回到“全部”并立即恢复全部有效记录（DS-REQ-009）
非法值    : 前端不静默纠正；服务端 category 走 BindException 契约（HTTP 400 / code=400 / 字段级消息）
```

## 8. 编号、数量与既有验收历史核验

```text
requirements_after=DS-REQ-001..138
requirements_added_in_R1=0          （DS-REQ-116~138 编号、数量、连续性未变，23 条）
requirement_count_delta=0

acceptance_after=DS-AC-001..140
acceptance_added_in_R1=0            （DS-AC-116~140 编号、数量、连续性未变，25 条）
acceptance_count_delta=0
new_adjustment_acceptance_status=ALL_NOT_RUN   （25/25 实测均为 NOT_RUN）

existing_acceptance_statistics=PASS_113_FAIL_0_BLOCKED_2_NOT_RUN_0   # 逐字保留
blocked_cases=DS-AC-104,DS-AC-108                                    # 两个 BLOCKED 与原始证据未改写
implementation_status=NOT_STARTED                                    # 本轮为草案 R1，未置 IMPLEMENTED_*
traceability_status=COMPLETE                                         # 23 条需求全部有设计/UI/验收落点
```

- R1 只修订**既有**编号条目的文字、预期结果与追踪映射，**未**重排、删除或新增任何编号。
- `DS-REQ-116~138`（23 条）与 `DS-AC-116~140`（25 条）编号连续、数量不变；新增验收仍全部 `NOT_RUN`，未出现 `PASS`/`ACCEPTED`/`IMPLEMENTED`/`APPROVED`。
- `DS-AC-104`、`DS-AC-108` 的 `BLOCKED` 状态与原始证据逐字保留；既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 未改动。
- 文档状态仍为待项目负责人评审的草案（`DRAFT_PENDING_USER_REVIEW`），本任务未代替项目负责人批准基线。

## 9. 修改文件清单

| 文件 | 操作 |
|---|---|
| `docs/features/data-source-management/REQUIREMENTS.md` | 修改（`DS-REQ-123`/`125`/`128`/`136`；新增 `DS-REQ-128` R1 修订说明；§21 追加 R1 记录） |
| `docs/features/data-source-management/ACCEPTANCE.md` | 修改（`DS-AC-119`/`120`/`124`/`127`/`130`/`138`；§7 追加 R1 记录） |
| `docs/features/data-source-management/DESIGN.md` | 修改（§11.2/§11.3/§11.4/§11.6/§11.9；新增 §12.2 R1 记录） |
| `docs/features/data-source-management/API.md` | 修改（§9.1/§9.2/§9.3/§9.4；新增 §9.5；§10 追加指针） |
| `docs/features/data-source-management/UI.md` | 修改（§10.1/§10.2/§10.5/§10.6；§10.7 追加 R1 记录） |
| `docs/features/data-source-management/README.md` | 修改（§4 边界速览两条；§5 追加 R1 记录） |
| `docs/baseline/query-list-page-template/MIGRATION.md` | 修改（仅**追加** R1 修订记录子节；未改通用排除原则与历史） |
| `docs/features/data-source-management/reports/DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001-R1.md` | 新增（本报告） |

**未修改**：

- 任何 `.vue` / `.ts` / `.java` 业务代码；任何测试代码；依赖；锁文件；配置；SQL；数据库结构；菜单；路由。
- `docs/features/data-source-management/DATABASE.md`（全文阅读未发现本 R1 直接造成其内容错误，故按 §7 **不修改**；其头部过期元数据仅记录于本报告 §2.4）。
- `docs/features/README.md`、`docs/baseline/` 下六份项目级基线、`docs/baseline/query-list-page-template/{README,DESIGN,UI,SHARED_COMPONENT_DESIGN}.md`。
- 公共组件实现（`frontend/src/components/query-list/**`）；任何弹窗或二级页面；任何其他列表页。
- 任务外未提交内容 `.claude/settings.local.json` 与 `docs/prompts/`（未暂存、未提交、未回滚、未覆盖）。

## 10. 明确未执行事项

- 未访问数据库 / ZooKeeper / Kafka；未执行任何 DDL/DML；未运行 SQL*Plus。
- 未启动、重启或停止任何前端/后端服务。
- 未运行 Maven / npm 测试或构建、未运行单元/集成/端到端测试（`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`）。
- 未实现分页、刷新、Tooltip 迁移或稳定滚动条槽位；未删除既有 Tooltip。
- 未修改任何弹窗或二级页面；未修改公共组件实现；未迁移其他列表页；未扩写为通用异常体系改造。
- 未把草案标记为已批准、已实现或已验收；未生成本轮实现提交或正式验收结果。

## 11. Git 提交 / 推送 / 同步结果

```text
branch=develop
base_commit_id=01680ee527b8e35cd4afd84c4789b862d34f7a77
commit_message=docs(data-source): correct list page adjustment draft R1
result_commit_id / remote_commit_id / ahead_behind : 见任务控制台结果块
```

- 仅逐个显式 `git add <file>` 暂存本任务授权文件；**未**使用 `git add .` 或 `git add -A`。
- 任务外改动（`.claude/settings.local.json`）与未跟踪目录（`docs/prompts/`）保持未暂存。
- 推送后核验 `git rev-parse HEAD`、`git rev-parse origin/develop`、`git status --short --branch`、`git rev-list --left-right --count HEAD...origin/develop`；未以强推解决远程分歧（本任务全程无分叉）。

## 12. 自检结果（提示词第九节）

```text
git_diff_check=exit 0
git_diff_stat=8 files changed（其中 7 个为本任务授权文档 + 1 个任务外 .claude/settings.local.json）
rg_no_GET_binding_MethodArgumentNotValidException=OK（仅保留 API.md §5.1 冻结的通用契约行与 R1 记录中的“已作废”说明）
rg_BindException_present=OK（REQUIREMENTS 4 / DESIGN 4 / API 7 / ACCEPTANCE 1 / UI 1 处）
rg_normalization_and_case_sensitive_consistent=OK（trim → 空转 null → 不自动转大写，各文档一致）
rg_no_Radio_for_role_control=OK（角色控件统一为 el-select；其余“单选按钮”仅指南北策略弹窗既有卡片）
rg_role_dropdown_width_only_140px=OK
rg_result_panel_keeps_error_slot_and_divider=OK
rg_no_直接进入表格_conflict=OK（仅存于 R1 变更记录对“已删除”的描述）
rg_req_ids_DS-REQ-116..138_continuous_23=OK
rg_ac_ids_DS-AC-116..140_continuous_25=OK
rg_new_acceptance_ALL_NOT_RUN=OK（25/25）
rg_no_scope_drift_pagination_refresh_tooltip=OK
task_external_changes_unstaged=OK
```

## 13. 仍存在的风险或阻塞项

1. **实现阶段回归风险（设计已记录，未在本次验证）**：`MethodArgumentNotValidException extends BindException`，且控制器局部 `@ExceptionHandler` 优先级高于 `@RestControllerAdvice`；新增局部 `BindException` 处理器必须在实现阶段验证既有请求体校验错误的字段级消息语义不回归。
2. **模板排除措辞与页面级例外的并行状态**：`MIGRATION.md` §1.1/§5 仍将含 CRUD 的配置管理页面列为“不适合直接套用/不纳入迁移范围”，而本页是项目负责人明确授权的页面级选择性接入例外。R1 未改写通用排除原则（提示词要求），二者并行状态仍待项目负责人决定是否另立模板维护任务。
3. **既有过期文档状态（不在本任务范围）**：`DATABASE.md` 头部元数据、`docs/features/README.md` 数据源管理条目、`docs/baseline/PROJECT_STATUS.md` §1.1 仍未反映当前实现事实，建议独立文档维护任务处理。
4. **无功能性阻塞**：本任务为纯文档修订，四项复审问题均已解决，未发现会改变产品决定或实现边界的重大冲突。

## 14. 下一步入口

```text
next_step=CHATGPT_REMOTE_GIT_R1_REVIEW_THEN_PROJECT_OWNER_BASELINE_APPROVAL_DECISION
```

1. ChatGPT 从**远程 Git**（`origin/develop`）对 R1 提交做**独立复审**，重点核对本报告 §3 的四项修正、§5 的 `category` 异常链路、§6 的插槽映射、§7 的角色控件规范，以及 §8 的编号/数量与既有验收历史是否逐字保留。
2. 之后由**项目负责人**决定是否批准调整基线；批准后**另行**生成本轮实现任务提示词。
3. 本任务**不得**继续实现。

---

## 15. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-19 | 创建本报告：记录 Git 现场、强制全文阅读逐项状态、四项复审问题的逐项修正、各修正落入文档的位置、`category` 异常链路/插槽映射/角色控件规范摘要、编号与既有验收历史核验、修改文件清单、未执行事项、Git 结果、自检结果、风险与下一步入口 | DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001-R1（纯文档修订任务） |
