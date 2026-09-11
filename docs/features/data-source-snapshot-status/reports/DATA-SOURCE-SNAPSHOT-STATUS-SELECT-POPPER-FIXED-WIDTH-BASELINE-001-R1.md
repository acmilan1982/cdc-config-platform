# 查询下拉固定宽度基线草案 R1 定向修正执行报告（`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001-R1`）

## 1. 任务与授权来源

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001-R1`
- 任务类型：**纯文档草案定向修正（R1）**（不实现、不执行正式验收、不代替项目负责人批准文档、不新增/删除需求或验收编号、不改变宽度数值）
- 分支：`develop`
- 任务业务基准提交：`6cd197d23a75cd9e0686c473ab27c45a6661e517`（＝任务开始时 `origin/develop`，且等于 `git ls-remote origin refs/heads/develop`）
- R0 草案任务：`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001`（结果提交 `6cd197d23a75cd9e0686c473ab27c45a6661e517`）
- 驱动来源：ChatGPT 对远程 Git 提交 `6cd197d23a75cd9e0686c473ab27c45a6661e517` 的独立复审结论 `CHANGES_REQUIRED`（四类复审问题）
- 授权来源：本任务提示词 `docs/prompts/data-source-snapshot-status/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001-R1.md`（该提示词不属于允许提交范围，不提交）
- 工作方式：全新隔离 docs worktree `/agent/dss-popper-width-baseline-001-r1`（detached HEAD，基准 `6cd197d23a75cd9e0686c473ab27c45a6661e517`）

## 2. 本轮结论边界（已冻结，R1 未改变）

| 冻结项 | 值 |
|---|---|
| 探针端 / client popper 外层可见宽度 | `480px` |
| 源库 / source popper 外层可见宽度 | `400px` |
| 快照状态 / status popper 外层可见宽度 | `240px` |
| 小视口安全上界 | `min(目标宽度, calc(100vw - 16px))` |
| 固定对象 | 携带 Feature 私有 `popper-class` 的**外层 `.el-popper`**（非 trigger、非内部 `.el-select-dropdown`） |
| 触发控件尺寸 | `240` / `300` / `200` × `32px`（不变） |
| 四字段截断 / Tooltip | trim ＋ 20 Unicode code point 截断、`CLIENT_DESC` 完整 Tooltip、完整原始 `value`/查询语义（不变） |
| 选中项字重 | Element Plus 既有选中强调样式（实测 `font-weight: 700`）**保留**，但不得改变外层 popper 宽度 |
| 实现约束 | Feature 私有命名空间、最小特异性、无 `!important`、无全局 Element Plus 覆盖（不变） |
| 编号 | 需求仍 `DSS-REQ-001~087` 共 **87** 条；验收仍 `DSS-AC-001~107` 共 **107** 条全部 `NOT_RUN` |

## 3. 四类复审问题逐项的修改前后对照

### 3.1 删除对 `DSS-REQ-036` 的错误引用

现行口径统一为：“Element Plus 下拉候选 `.el-select-dropdown__item.is-selected` 的既有选中强调样式（实测 `font-weight:700`）**保留**，但该样式**不得**影响外层 popper 宽度。” `DSS-REQ-036` 原业务行（`SNAPSHOT_COMPLETED` 状态展示为“快照已完成”，绿色状态标签）**逐字节未改**。

| 文件 / 位置 | 修改前（错误） | 修改后（正确） |
|---|---|---|
| `REQUIREMENTS.md` §21.8 `DSS-REQ-087` 不变性约束 ③ | 已选项中 `DSS-REQ-036` 相关的选中项 `font-weight: 700`（Element Plus `is-selected` 默认强调）**保留**，但**不得**因此改变弹层宽度 | Element Plus 下拉候选 `.el-select-dropdown__item.is-selected` 的既有选中强调样式（实测 `font-weight: 700`）**保留**，但该样式**不得**影响外层 popper 宽度、也**不得**因此改变弹层宽度 |
| `REQUIREMENTS.md` §21.8 取代/扩展说明 | …不改变 `DSS-REQ-036` 的状态视觉映射（仅补充“选中项 `700` 字重不得改变弹层宽度”这一几何不变性） | …不改变 `DSS-REQ-023/025` 的草稿/请求状态机；Element Plus 下拉候选 `.el-select-dropdown__item.is-selected` 的既有选中强调样式（实测 `font-weight: 700`）**保留**，但该样式**不得**影响外层 popper 宽度（仅补充这一几何不变性） |
| `ACCEPTANCE.md` §4.22 `DSS-AC-106` 预期结果 | 选中项 `font-weight: 700`（`DSS-REQ-036` 选中强调）**保留**，但弹层宽度不因此变化（与未选中时差为 `0`） | Element Plus 下拉候选 `.el-select-dropdown__item.is-selected` 的既有选中强调样式（实测 `font-weight: 700`）**保留**，但该样式**不得**影响外层 popper 宽度、弹层宽度不因此变化（与未选中时差为 `0`） |
| `DESIGN.md` §27.5 不得作为宽度输入的因素 | 已选项的 `font-weight`——`DSS-REQ-036` 相关选中项 `is-selected` 默认 `font-weight: 700` **保留**，但因固定了外层 `width/min-width/max-width`，不得再改变弹层宽度（此为 `DSS-REQ-087` 相对既有选中强调规则的几何不变性补充） | 已选项的 `font-weight`——Element Plus 下拉候选 `.el-select-dropdown__item.is-selected` 的既有选中强调样式（实测 `font-weight: 700`）**保留**，但该样式**不得**影响外层 popper 宽度；因固定了外层 `width/min-width/max-width`，不得再改变弹层宽度（此为 `DSS-REQ-087` 的几何不变性补充） |
| `UI.md` §21.4 宽度不变性说明 | 宽度不得依赖候选项文本长度或内容；**选中项 `font-weight: 700`**（`DSS-REQ-036`/§20 选中强调）**保留**，但不得因固定外层宽度而改变弹层宽度；… | 宽度不得依赖候选项文本长度或内容；**Element Plus 下拉候选 `.el-select-dropdown__item.is-selected` 的既有选中强调样式（实测 `font-weight: 700`）保留**，但该样式不得影响外层 popper 宽度、不得因固定外层宽度而改变弹层宽度；… |

R1 未在本轮新增内容中继续引用 `DSS-REQ-036`，也未为规避而反向新增“与 `DSS-REQ-036` 无关”之类的补丁式免责声明。

### 3.2 修正当前草案的待用户复审状态（`NO` → `YES`）

当前 popper 固定宽度草案状态为 `DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`，下一入口为 `CHATGPT_POPPER_WIDTH_BASELINE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL`，故本轮文档尚待项目负责人批准，相关状态不得写成 `pending_user_review=NO`。统一修正为 `pending_user_review=YES`、`pending_user_confirmation_count=0`。

| 文件 / 位置 | 修改前 | 修改后 |
|---|---|---|
| `docs/features/README.md` 汇总行 | …`human_formal_5173_review_status=NOT_RUN_FOR_THIS_ADJUSTMENT`、`pending_user_review=NO`、`pending_user_confirmation_count=0` | …`pending_user_review=YES`、`pending_user_confirmation_count=0` |
| `docs/features/README.md` 2026-09-11 变更记录行 | `pending_user_review=NO` | `pending_user_review=YES` |
| Feature `README.md` 2026-09-11 草案段落 | `pending_user_review=NO` | `pending_user_review=YES` |
| `REQUIREMENTS.md` §1“内容状态”行、§24 状态小结 | 未声明（无 `pending_user_review`） | 新增“本草案当前 `pending_user_review=YES`、`pending_user_confirmation_count=0`、`human_formal_5173_review_status=NOT_RUN_FOR_THIS_ADJUSTMENT`” |
| `ACCEPTANCE.md` §1“内容状态”行、§6 小结 | 未声明 | 同上新增 |
| `DESIGN.md` §1“设计内容状态”行、§27.9 分层状态 | 未声明 | 同上新增 |
| `UI.md` §1“界面规则状态”行、§21.7 分层状态 | 未声明 | 同上新增 |
| R0 报告“未代替项目负责人批准文档”与结果状态块 | `pending_user_review=NO` | `pending_user_review=YES` |

历史语境（第一轮/第二轮 UI 调整批准收口、R2～R7 设计固化批准、查询控件交互调整基线批准/实现等）中当时确实成立的 `pending_user_review=NO` **未被机械替换**（详见 §5）。

### 3.3 纠正 `API.md` / `DATABASE.md`“整文件零差异”的错误声明

R0 提交实际修改了 `API.md` 与 `DATABASE.md`（同步 §1 组合计数、分层状态、下一入口，并新增一条元数据同步说明），故 R0 本任务语境下任何“`API.md`/`DATABASE.md` 整文件零差异”表述均不属实。统一纠正为准确口径：

> `API.md` 与 `DATABASE.md` 在 R0 中仅同步 §1 组合计数、分层状态、下一入口及简短说明；API 业务契约与 §9 映射表逐字节不变，DATABASE 查询设计业务正文逐字节不变。

| 文件 / 位置 | 修改前（不实） | 修改后（准确） |
|---|---|---|
| `REQUIREMENTS.md` §21.8 事实边界 ⑥ | ⑥ 本轮无 API、数据库、SQL 或只读边界变更（`API.md`/`DATABASE.md` 整文件零差异），请求与状态机保持不变 | ⑥ 本轮无 API、数据库、SQL 或只读边界变更——`API.md` 与 `DATABASE.md` 在本 baseline 草案任务中仅同步 §1 组合计数、分层状态、下一入口及简短说明，API 业务契约与 §9 映射表逐字节不变、DATABASE 查询设计业务正文逐字节不变，请求与状态机保持不变 |
| `REQUIREMENTS.md` §21.8 取代/扩展说明 | …无 API、无数据库变更（`API.md`/`DATABASE.md` 整文件零差异） | …无 API、无数据库变更——仅同步 §1 组合计数、分层状态、下一入口及简短说明（业务契约/业务正文逐字节不变） |
| `REQUIREMENTS.md` §25 2026-09-11 变更记录 | `API.md`/`DATABASE.md` **整文件零差异**（接口/数据库业务契约零变化） | …在本 baseline 草案任务中仅同步 §1 组合计数、分层状态、下一入口及简短说明（API 业务契约与 §9 映射表逐字节不变、DATABASE 查询设计业务正文逐字节不变） |
| `ACCEPTANCE.md` §4.22 前言 | …数据库访问规则（`API.md`/`DATABASE.md` 整文件零差异），不改请求与状态机 | …数据库访问规则——`API.md` 与 `DATABASE.md` 在 R0 中仅同步 §1…，业务契约/业务正文逐字节不变；不改请求与状态机 |
| `ACCEPTANCE.md` §4.22 `DSS-AC-107` | 不改 SQL/表结构/索引/约束/只读边界（`API.md`/`DATABASE.md` 整文件零差异） | 不改 SQL/表结构/索引/约束/只读边界——`API.md` 与 `DATABASE.md` …仅同步 §1…，业务契约/业务正文逐字节不变 |
| `ACCEPTANCE.md` §7 2026-09-11 变更记录 | …（`API.md`/`DATABASE.md` 整文件零差异） | …仅同步 §1 组合计数、分层状态、下一入口及简短说明（业务契约/业务正文逐字节不变） |
| `DESIGN.md` §27.8 接口/数据库不变 | 不改 SQL/表结构/索引/约束/只读边界（`API.md`/`DATABASE.md` 整文件零差异） | 不改 …只读边界——`API.md` 与 `DATABASE.md` …仅同步 §1…，业务契约/业务正文逐字节不变 |
| `DESIGN.md` §27.9 代码零差异 | `API.md`/`DATABASE.md` 与既有历史报告整文件逐字节不变 | `API.md` 与 `DATABASE.md` …仅同步 §1…（业务契约/业务正文逐字节不变），既有历史报告不变 |
| `UI.md` §21.7 代码零差异 | `API.md`/`DATABASE.md` 与既有历史报告整文件逐字节不变 | `API.md` 与 `DATABASE.md` …仅同步 §1…（业务契约/业务正文逐字节不变），既有历史报告不变 |
| Feature `README.md` 2026-09-11 草案段落 | `API.md`/`DATABASE.md` 整文件零差异 | …仅同步 §1 组合计数、分层状态、下一入口及简短说明（业务契约/业务正文逐字节不变） |
| R0 报告 §7 零差异约束表述 | 已在 R0 报告使用准确口径（无“整文件零差异”不实声明） | 保持不变 |

历史任务中当时确实成立的“整文件零差异”记录（如 2026-09-08 第二轮 UI 调整草案、R2～R7 设计固化、2026-09-08 查询控件交互调整实现等）**未被改写**。

### 3.4 修正关闭状态的验收可测量性

`DSS-REQ-087` / `DSS-AC-104` 原把“关闭下拉面板后直接测量 popper 宽度”写成可执行步骤；因 Element Plus 关闭后可能隐藏或销毁 Teleport popper、不存在可测量的外层可见边界，统一改为四步口径：① 面板打开且可见时测量外层 `.el-popper`；② 关闭面板并确认其已隐藏或销毁（**不要求**在关闭态测量宽度）；③ 再次打开面板并重新测量；④ 重新打开后的宽度必须与关闭前相同、宽度差为 `0`。业务目标“反复开合不得导致下一次打开时宽度变化”保持不变。

| 文件 / 位置 | 修改前 | 修改后 |
|---|---|---|
| `REQUIREMENTS.md` `DSS-REQ-087` 宽度不变性 ⑨ | ⑨ 打开和关闭下拉面板（仅列状态） | ⑨ 打开和关闭下拉面板 + 新增“**关闭态测量口径（必须明确）**”四步（打开测量 → 关闭确认隐藏/销毁、不要求在关闭态测量 → 重新打开测量 → 宽度差为 `0`） |
| `ACCEPTANCE.md` `DSS-AC-104` 操作步骤 | …清空/重置 → 打开/关闭下拉面板 → 触发/隐藏 Tooltip…；每一步…测量三个下拉弹层外层 `.el-popper` 的宽度 | …清空/重置 → 面板开合稳定性验证（打开测量 → 关闭确认隐藏/销毁，**不要求**在关闭态测量 → 重新打开测量）→ 触发/隐藏 Tooltip…；除“关闭面板后”的隐藏/销毁确认外，每一步测量 |
| `ACCEPTANCE.md` `DSS-AC-104` 预期结果 | …不随…面板开合…而变化 | 追加“**关闭面板后重新打开时，外层宽度必须与关闭前相同（差为 `0`）**（关闭态不要求测量宽度，只需确认面板已隐藏或销毁）” |
| `DESIGN.md` §27.5 | 仅列状态“打开/关闭面板” | 新增“**关闭态测量口径**”四步说明 |
| `UI.md` §21.4 | 仅列状态“打开/关闭面板” | 新增“**关闭态测量口径**”四步说明 |

### 3.5 精确写明小视口阈值

`DSS-AC-105` 原使用统一示例“如 `<496px`”，该阈值只足以触发探针端 `480px` 的安全上界，不能证明源库 `400px` 与快照状态 `240px` 的 `min()` 分支。改为分别验证三阈值（也允许单个 `<256px` 可控 viewport 一次覆盖三者）。

| 文件 / 位置 | 修改前 | 修改后 |
|---|---|---|
| `ACCEPTANCE.md` `DSS-AC-105` 操作 | 再把视口收窄至小于目标宽度（如 `<496px`）… | 再把视口分别收窄至探针端 `<496px`、源库 `<416px`、快照状态 `<256px` 三个安全阈值以内（也可用单个 `<256px` 可控 viewport 一次覆盖三者），逐一测量是否等于 `min(目标宽度, viewportWidth − 16px)` |
| `ACCEPTANCE.md` `DSS-AC-105` 预期 | …不产生水平滚动、不产生内容溢出 | 追加“**三个安全阈值均有正确数学验证**——`100vw - 16px` 分别小于 `480px`/`400px`/`240px`，实际外层宽度必须等于 `viewportWidth − 16px`” |
| `DESIGN.md` §27.7 窄视口行 | 窄视口（`< 目标宽度 + 16px`） | 窄视口（探针端 `<496px`、源库 `<416px`、快照状态 `<256px`；也可用单个 `<256px` 可控 viewport 一次覆盖三者）＋ 阈值数学说明 |
| `UI.md` §21.6 | …并在窄视口核对 `min(目标宽度, calc(100vw - 16px))` 生效… | …再把视口分别收窄至 `<496px`/`<416px`/`<256px` 三个安全阈值以内（也可用单个 `<256px` 可控 viewport 一次覆盖三者），核对实际外层宽度 = `min(目标宽度, viewportWidth − 16px)` |

### 3.6 下一入口统一（§6）

全部 13 处当前主题入口统一为 `CHATGPT_POPPER_WIDTH_BASELINE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL`（原为不带 `R1` 的 `CHATGPT_POPPER_WIDTH_BASELINE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL`）；分布：`docs/features/README.md` 2、Feature `README.md` 1、`REQUIREMENTS.md` 3、`ACCEPTANCE.md` 3、`DESIGN.md` 2、`UI.md` 2、R0 报告 1。

## 4. `DSS-REQ-036` 错误引用清理证明

在 R1 在用的 7 个文件（`docs/features/README.md`、Feature `README.md`/`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md`、R0 报告）中，按“行内含 `popper` 或 `查询下拉固定宽度`”界定 **popper 草案语境**后统计：

| 文件 | popper 语境中 `DSS-REQ-036` 计数 |
|---|---|
| `docs/features/README.md` | 0 |
| Feature `README.md` | 0 |
| `REQUIREMENTS.md` | 0 |
| `ACCEPTANCE.md` | 0 |
| `DESIGN.md` | 0 |
| `UI.md` | 0 |
| R0 报告 | 0 |

仓库其余 `DSS-REQ-036` 出现位置全部为历史/业务行或既有证据，均**未改**：

- `REQUIREMENTS.md:246` `DSS-REQ-036` 原业务行（`SNAPSHOT_COMPLETED` 状态展示为“快照已完成”，绿色状态标签）——逐字节不变（属 §8 的 86 条 `DSS-REQ-001~086` 逐字节一致集合）；
- `ACCEPTANCE.md:195`（`DSS-AC-033` 关联需求列）、`:279`（`DSS-AC-066` 关联需求列）、`:364`（§5 追踪矩阵行）——历史业务行，未改；
- `DESIGN.md:570`（§14 追踪矩阵 `DSS-REQ-003` 行）——历史矩阵行，未改；
- `docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001/docs/*.txt`——既有证据快照，未改。

R1 亦未在本轮新增内容中写入任何以 `DSS-REQ-036` 指代下拉选中字重的表述（不含反向免责补丁）。

## 5. 当前草案 `pending_user_review=YES` 与历史 `NO` 未被误改的证明

- **当前 popper 草案语境**：`docs/features/README.md` 汇总行、`docs/features/README.md` 2026-09-11 变更记录行、Feature `README.md` 2026-09-11 草案段落，以及 `REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md` 的本草案状态段，均显式含 `pending_user_review=YES`、`pending_user_confirmation_count=0`（`YES` 表示文档批准动作仍待项目负责人完成、`0` 表示无待澄清业务选项，二者不冲突）。
- **popper 语境中 `pending_user_review=NO` 计数为 0**（同为上述 7 文件，按“行内含 `popper` 或 `查询下拉固定宽度`”界定）：`docs/features/README.md` 0、Feature `README.md` 0、`REQUIREMENTS.md` 0、`ACCEPTANCE.md` 0、`DESIGN.md` 0、`UI.md` 0、R0 报告 0。
- **历史语境 `NO` 未被机械替换**：`docs/features/README.md` 汇总行内 5 处 `pending_user_review=NO`、Feature `README.md` L19/L44、`REQUIREMENTS.md` L51、`ACCEPTANCE.md` L41、`DESIGN.md` L21、`UI.md` L21 等，均属第一轮/第二轮 UI 调整批准收口、R2～R7 设计固化批准、2026-09-10 查询控件交互调整基线批准收口等**历史时点结论**，保持原样。
- R1 未把项目负责人对 `5174` 隔离 prototype 宽度方案的认可（`prototype_width_decision_status=APPROVED_BY_PROJECT_OWNER`）误写成已批准本次正式文档草案（本草案仍 `DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`）。

## 6. API / DATABASE 准确零变化口径及两文件本轮 R1 字节级不变证明

- 准确口径（已写入 `REQUIREMENTS.md` §21.8/§25、`ACCEPTANCE.md` §4.22/§7、`DESIGN.md` §27.8/§27.9、`UI.md` §21.7、Feature `README.md`）：`API.md` 与 `DATABASE.md` 在 R0 中仅同步 §1 组合计数、分层状态、下一入口及简短说明；API 业务契约与 §9 映射表逐字节不变，DATABASE 查询设计业务正文逐字节不变。
- **R1 未修改 `API.md` 与 `DATABASE.md`**：

```text
git diff --stat HEAD -- docs/features/data-source-snapshot-status/API.md \
  docs/features/data-source-snapshot-status/DATABASE.md
（输出为空 → 相对基准 6cd197d 零差异）
```

- 核验结论：两文件自身在本轮当前事实层面**未发现错误**（其 R0 新增说明已使用“业务契约/业务正文逐字节不变”的准确口径，未出现“整文件零差异”不实声明，亦未出现 `DSS-REQ-036` 误引用或 `pending_user_review=NO`），故 R1 无需且**未**修改冻结文件，未发生“需修改冻结文件”的停线情形。

## 7. 关闭后重新打开的可执行验收步骤

`DSS-AC-104` / `DSS-REQ-087` / `DESIGN.md` §27.5 / `UI.md` §21.4 现统一为下列可执行四步（可复现）：

1. 打开下拉面板，待其可见，用开发者工具测量外层 `.el-popper`（携带 Feature 私有 `popper-class` 的`.el-popper`）宽度，记为 `W_open_1`；
2. 关闭面板，确认该 popper 已 `display:none`／已从 DOM 销毁（**不要求**在关闭态测量宽度）；
3. 再次打开面板，待其可见，测量外层 `.el-popper` 宽度，记为 `W_open_2`；
4. 断言 `W_open_2 == W_open_1`（宽度差为 `0`），并断言 `W_open_1`/`W_open_2` 恒为该下拉目标宽度（`480px`/`400px`/`240px`，受小视口上界约束时的收敛值不变）。

业务目标“反复开合不得导致下一次打开时宽度变化”不变。

## 8. 三个小视口阈值的数学验证

对每个目标宽度 `T`，`min(T, 100vw − 16px)` 切换到“`100vw − 16px` 分支”的条件是 `100vw − 16px < T`，即 `viewportWidth < T + 16`：

| 下拉 | 目标宽度 `T` | 触发上界分支的视口条件 | 文档阈值 | 该阈值下 `100vw − 16px` 的上限 | 期望实际外层宽度 |
|---|---|---|---|---|---|
| 探针端 / client | `480px` | `viewportWidth < 496px` | `<496px` | `< 480px` | `viewportWidth − 16px`（< 480，非常量） |
| 源库 / source | `400px` | `viewportWidth < 416px` | `<416px` | `< 400px` | `viewportWidth − 16px`（< 400，非常量） |
| 快照状态 / status | `240px` | `viewportWidth < 256px` | `<256px` | `< 240px` | `viewportWidth − 16px`（< 240，非常量） |

即：探针端视口 `<496px` 时 `100vw - 16px < 480px`；源库视口 `<416px` 时 `< 400px`；快照状态视口 `<256px` 时 `< 240px`。故上述三个阈值均能在数学上证明对应 `min()` 的“视口分支”生效——实际外层宽度必须等于 `viewportWidth − 16px`（小于目标常量）而非常量目标宽度。因 `<256px` 同时满足三者（`256 < 416 < 496`），文档同时允许用**单个 `<256px` 可控 CDP viewport 一次覆盖三者**，但三个阈值已逐一明确写出。

对每个弹层验证：`实际外层宽度 = min(目标宽度, viewportWidth − 16px)`，并确认不越出视口、无水平滚动、无内容溢出。

## 9. 87/107 计数、全部 `NOT_RUN`、追踪无悬空证明

| 项目 | 结果 |
|---|---|
| `DSS-REQ` 编号 | `DSS-REQ-001`～`DSS-REQ-087` 连续唯一，计数 **87**，重复 `0` |
| `DSS-AC` 编号 | `DSS-AC-001`～`DSS-AC-107` 连续唯一，计数 **107**，重复 `0` |
| 验收状态 | 非 `NOT_RUN` 的验收行计数 **0** → 107 条全部 `NOT_RUN`（`acceptance_not_run_count=107`） |
| `DSS-REQ-001~086` 业务行 | 相对基准 `6cd197d` **逐字节一致**（86 行 `diff` 无差异，`existing_requirements_business_row_change_status=ZERO`） |
| `DSS-AC-001~103` 业务行 | 相对基准 `6cd197d` **逐字节一致**（103 行 `diff` 无差异，`existing_acceptance_business_row_change_status=ZERO`） |
| 需求 → 设计落点 | `DESIGN.md` §14.2 **87/87**（`DSS-REQ-087` → D§27、U§21） |
| 验收 → 设计落点 | `DESIGN.md` §14.3 **107/107** |
| 需求 ↔ 验收双向映射 | `ACCEPTANCE.md` §5：`DSS-REQ-087` → `DSS-AC-104`/`DSS-AC-105`/`DSS-AC-106`/`DSS-AC-107`；四条验收行“关联需求”列均为 `DSS-REQ-087`；正反向引用无悬空 |

R1 未新增、未删除、未重号、未复用任何需求或验收编号；未改变 480/400/240px 与视口安全公式；未改变既有 `5173` 实现、代码复审、人工页面检查等历史事实。

## 10. 实际修改文件列表与白名单证明

实际修改文件（`git status --short`）：

| # | 文件 | 变更性质 | 白名单依据（提示词 §4） |
|---|---|---|---|
| 1 | `docs/features/README.md` | 修改 | 第 1 项 |
| 2 | `docs/features/data-source-snapshot-status/README.md` | 修改 | 第 2 项 |
| 3 | `docs/features/data-source-snapshot-status/REQUIREMENTS.md` | 修改 | 第 3 项 |
| 4 | `docs/features/data-source-snapshot-status/ACCEPTANCE.md` | 修改 | 第 4 项 |
| 5 | `docs/features/data-source-snapshot-status/DESIGN.md` | 修改 | 第 5 项 |
| 6 | `docs/features/data-source-snapshot-status/UI.md` | 修改 | 第 6 项 |
| 7 | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001.md` | 修改 | 第 7 项 |
| 8 | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001-R1.md` | 新增（本报告） | 第 8 项 |

冻结文件相对基准零差异：

```text
git diff --stat HEAD -- docs/features/data-source-snapshot-status/API.md \
  docs/features/data-source-snapshot-status/DATABASE.md frontend backend
（输出为空）
```

零差异约束（已遵守）：`frontend/**`、`backend/**`、SQL、config、测试、证据、截图、运行日志、既有历史报告 **零差异**；未提交本任务提示词、runtime logs、截图、构建产物、依赖目录或临时文件；`git diff --check` 通过（无空白错误）。

文档校验工具：仓库未配置 Markdown lint / 文档校验工具（`frontend/package.json` 无相关脚本，仓库内无 markdownlint 配置），故 `documentation_validation_status=NOT_AVAILABLE`（不虚构成功）。

## 11. 主工作区及所有既有 worktree 保留情况

- **主工作区** `/agent/cdc-config-platform`：本任务**未进入、未触碰**；其既有未提交修改（`M .claude/settings.local.json`、`M agent-env.sh`、`M frontend/index.html`、`M frontend/src/config/menu.ts`、`M frontend/src/layouts/*`、`M frontend/src/stores/app.ts`、`M frontend/src/styles/global.css`、若干新增 `docs/agent-prompts/*`、删除的 `docs/database/*` 等）**原样保留**，未清理、未覆盖、未暂存、未提交、未 reset/checkout/stash。
- **R0 docs worktree** `/agent/dss-popper-width-baseline-001`：**未触碰、未提交、未清理**。
- **隔离固定宽度 prototype worktree** `/agent/dss-select-popper-fixed-width-proto-001`：**未触碰**（其未提交修改与 `runtime-logs/…-PROTOTYPE-001/` 证据保留）。
- **既有 5173 正式实现 worktree（含 `DSS-POPPER-WIDTH-BASELINE-001` 引用目录）**：**未触碰**，其中任何未提交修改保留。
- R1 全部编辑仅发生在全新隔离 worktree `/agent/dss-popper-width-baseline-001-r1`（基准 `6cd197d`，detached HEAD），并使用目录内独立 `docs/…` 副本。

## 12. Git 结果

- 提交与推送按外层 `AGENT_TASK_RESULT` 记录为准（本报告不预先编造最终提交哈希）。
- 使用全新隔离 docs worktree `/agent/dss-popper-width-baseline-001-r1`（detached HEAD，基准 `6cd197d23a75cd9e0686c473ab27c45a6661e517`）。
- 只暂存本任务允许范围内的上述 8 个文件；单次普通提交（无 amend、无 force）；推送 `origin/develop`；推送前重新 `git fetch origin develop` 校验基线仍可安全快进，推送后校验本地 HEAD、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致、ahead/behind `0/0`。

## 13. 未执行事项

- **未在 `5173` 实现**：`popper_width_formal_5173_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`；未把 prototype 代码拷入 `5173`，未修改 `frontend/**`/`backend/**`。
- **未执行正式验收**：`formal_acceptance_status=NOT_RUN`，107 条 `DSS-AC-001~107` 全部 `NOT_RUN`、`acceptance_not_run_count=107`；未把任何原型/开发自测写成 `PASS`。
- **未代替项目负责人批准文档**：`popper_width_document_status=DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`、`pending_user_review=YES`、`pending_user_confirmation_count=0`；未把草案写成 `APPROVED`/`IMPLEMENTED`/`PASS`/`ACCEPTED`/`COMPLETED`。
- **未做代码复审**：`popper_width_formal_code_review_status=NOT_RUN`。
- 未运行前端/后端测试、构建或浏览器验证；未启动或停止 `5173`/`5174`/`8080`；未访问数据库、ZooKeeper、Kafka；未创建通用 `QUERY-LIST-PAGE-UI-PATTERN`。

## 14. 分层状态与下一入口（R1 完成后）

- `prototype_width_decision_status=APPROVED_BY_PROJECT_OWNER`
- `popper_width_document_status=DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`
- `popper_width_formal_5173_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`
- `popper_width_formal_code_review_status=NOT_RUN`
- `formal_acceptance_status=NOT_RUN`、`acceptance_not_run_count=107`
- `human_formal_5173_review_status=NOT_RUN_FOR_THIS_ADJUSTMENT`
- `pending_user_review=YES`、`pending_user_confirmation_count=0`
- `existing_requirements_business_row_change_status=ZERO`、`existing_acceptance_business_row_change_status=ZERO`
- `api_contract_change_status=NONE`、`database_contract_change_status=NONE`
- 下一入口：`CHATGPT_POPPER_WIDTH_BASELINE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL`（ChatGPT 从远程 Git 对 R1 结果独立复审，复审通过后由项目负责人决定是否批准；批准前不得开始 `5173` 正式实现）。
