# 探针端管理主列表行高与三点入口可选样式 · 基线草案 R1 定向纠错执行报告

> 任务代码：`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001-R1`
> 任务类型：**纯文档 R1 定向纠错**（按 ChatGPT 对 R0 草案的远程 `CHANGES_REQUIRED` 结论，对四处问题作定向纠错；**不**改前端代码／测试／共享 CSS、**不**实施页面调整、**不**运行浏览器实测／测试／构建、**不**执行正式验收）
> 分支：`develop`
> 起始提交（= 本地 HEAD = `origin/develop` = 远程 `refs/heads/develop`）：`9381703cf63d0e91ce5ee39cee28f907e21972ca`
> 上一时点事实：R0 纯文档草案任务 `CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001` 的结果提交 `9381703` 的**远程文档草案复审结论为 `CHANGES_REQUIRED`**（四处：① 行高验收容差未给出；② `CCFG-AC-010` 同时说旧像素区间已被取代、又以该旧区间作为 `BLOCKED` 理由；③ `CCFG-AC-155` 把允许自适应增高的异常行混入必须等高的常规行样本；④ 公共模板的 helper 类、令牌、静态断言与草案标记计数仍列为未决问题）。
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_BASELINE_R1_REVIEW`
> 本 R1 **只做纯文档定向纠错**，**不**改代码、**不**执行正式验收、**不**宣称 R1 已复审／已批准／已实现／已验收，**不**作出项目负责人目测通过或最终接受结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=9381703cf63d0e91ce5ee39cee28f907e21972ca
actual_base_commit=9381703cf63d0e91ce5ee39cee28f907e21972ca
origin_develop=9381703cf63d0e91ce5ee39cee28f907e21972ca
remote_refs_heads_develop=9381703cf63d0e91ce5ee39cee28f907e21972ca
ahead_behind(origin/develop...HEAD)=0/0
latest_reported_commit_in_prompt=9381703cf63d0e91ce5ee39cee28f907e21972ca
r0_draft_remote_review_verdict=CHANGES_REQUIRED
adjustment7_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment7_approval_status=NOT_APPROVED
adjustment7_implementation_status=NOT_STARTED
adjustment7_formal_acceptance_execution_status=NOT_RUN
formal_acceptance_execution_status=NOT_RUN
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop（禁止强推）
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`9381703`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发停线条件；任务提示词给出的预期基准提交 `9381703` 与现场真实 Git 对象一致。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`（另有本 Agent 自身产生的未跟踪 `runtime-logs/`）。
- 开工时从 Git 核实的四类定义计数为 需求 `CCFG-REQ-154`／验收 `CCFG-AC-157`／设计 `CCFG-DESIGN-089`／界面 `CCFG-UI-077`；本 R1 **不**新增、**不**删除、**不**复用任何编号，四族总数**保持**不变。
- 已读取 R0 草案与既有已批准基线（第六轮已批准 `CCFG-REQ-148~152`、`CCFG-AC-147~154`、`CCFG-DESIGN-083~087`、`CCFG-UI-071~075` 等），并只读对照公共列表表格视觉模板五份文档与三份公共源代码（`list-table-visual.css`／`index.ts`／`list-table-visual.spec.ts`）以及最近 R5 与只读补测报告，确认本 R1 只收敛口径、不改变任何既有状态格与公共代码现行事实。
- 环境：本任务为**纯文档**任务，按 `CLAUDE.md` §15 验证矩阵不适用构建；**未**运行测试／构建／lint／浏览器；**未**启停任何服务（上轮 START-ONLY 启动的后端 `:8080` 与前端 Vite `:5173` **未被本任务触碰**）；**未**访问或写入数据库／ZooKeeper／Kafka。

## 2. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/REQUIREMENTS.md` | 修改 | `CCFG-REQ-153` 追加 **R1 测量口径与容差冻结**、`CCFG-REQ-154` 追加 **R1 扩展契约收敛指针**；§7.16 标题更新为「R0 草案建立 → R1 定向纠错」、追加 R1 定向纠错引言段；§10 变更记录追加 R1 行 |
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | `CCFG-AC-010` **就地改写状态理由**（`BLOCKED` 理由改限于现行仍有效步骤中尚缺实际证据的部分；**状态仍 `BLOCKED`**）、`CCFG-AC-155` **样本拆为等高对照组与自适应观察组**并计入 ≤1 CSS px 预置容差；新增 §1.20 R1 状态块；§6 变更记录追加 R1 行 |
| `docs/features/client-config/DESIGN.md` | 修改 | `CCFG-DESIGN-088` 追加 **R1 测量口径与容差冻结**、`CCFG-DESIGN-089` 追加 **R1 扩展契约收敛要点**；§19 标题更新、追加 R1 定向纠错引言段；§20 变更记录追加 R1 行 |
| `docs/features/client-config/UI.md` | 修改 | `CCFG-UI-077` 追加 **R1 测量口径与样本边界冻结**、`CCFG-UI-076` 追加 **R1 扩展契约收敛标注**；§21 标题更新、追加 R1 定向纠错引言段；§22 变更记录追加 R1 行 |
| `docs/features/client-config/README.md` | 修改 | §1.13 标题更新为「R0 草案建立 → R1 定向纠错」、追加 R1 纠错覆盖段；§2 导航新增 R1 报告行；§4 追加 R1 条目；§5 将 R0 入口降为**历史下一入口**并新增 **R1 当前下一入口** |
| `docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md` | 修改 | §12 标题更新、新增 R1 引言与状态块；§12.2 **收敛为确定 opt-in 落地方案**；§12.3／§12.4 追加 R1 边界强调与新验证覆盖；§12.7 **替换为逐项可复审的拟修订契约**；§12.8 **重写为三通道计数口径与核验命令**；§0.1／§11.1／§11.3 追加 R1 标记口径说明 |
| `docs/baseline/list-table-visual-template/README.md` | 修改 | §7.4 追加计数通道说明与通道 3 核验命令；§8 文档导航标注 §12 为待复审可选扩展草案例外；§11 变更记录追加 `2026-09-29` R1 行 |
| `docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001-R1.md` | 新增 | 本报告 |

**未修改**：R0 报告 `reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001.md`、全部历史验收／只读补测报告与证据索引（R0~R5、`...-READONLY-SUPPLEMENT-001`（含 R1））、`docs/features/client-config/API.md`、`DATABASE.md`、`docs/baseline/` 六份**项目级**基线、`docs/baseline/query-list-page-template/**`、公共模板 `DESIGN.md`／`UI.md`／`MIGRATION.md`（R0 已改，本轮不再改）、`docs/features/README.md`、`docs/prompts/**`、前后端代码与测试（含共享模板**代码** `list-table-visual.css`／`index.ts`／`list-table-visual.spec.ts`）、参考页 `/config/data-source`、`CLAUDE.md`、`agent-env.sh`、`.claude/**` 与 `.claude/settings.local.json`。

`git diff --stat`（任务开始前未跟踪内容不计）：7 个已跟踪文件；另新增本报告。

## 3. 新旧定义编号与逐项覆盖

- 本 R1 **不**新增／删除／复用任何编号，四族编号总数**保持** `CCFG-REQ-001~154`（154 条）、`CCFG-AC-001~157`（157 条）、`CCFG-DESIGN-001~089`（89 条）、`CCFG-UI-001~077`（77 条），连续、唯一、无跳号、无重号。
- 本轮**只在草案既有定义行上就地改写／追加**，被改动的定义行为下表所列；其余既有已批准定义行相对 `9381703` **逐字节零变化**。

| 层 | 被改动的定义行 | 处置 |
|---|---|---|
| 需求 | `CCFG-REQ-153`、`CCFG-REQ-154` | 均为 R0 新增的**草案行**；追加 R1 测量口径冻结（153）与 R1 契约收敛指针（154），**不**触碰已批准 `CCFG-REQ-001~152` |
| 验收 | `CCFG-AC-010`、`CCFG-AC-155` | `CCFG-AC-155` 为 R0 新增**草案行**（拆分样本组 + 容差）；`CCFG-AC-010` 为**既有行**，仅**就地改写状态理由**，状态格**保持 `BLOCKED`**；**零**状态格改动 |
| 设计 | `CCFG-DESIGN-088`、`CCFG-DESIGN-089` | 均为 R0 新增**草案行**；追加 R1 冻结与收敛要点，**不**触碰已批准 `CCFG-DESIGN-001~087` |
| 界面 | `CCFG-UI-076`、`CCFG-UI-077` | 均为 R0 新增**草案行**；追加 R1 冻结与收敛标注，**不**触碰已批准 `CCFG-UI-001~075` |

- 逐项映射（未变）：`CCFG-REQ-153`（行高协调）↔ `CCFG-AC-155`／`CCFG-AC-156`／`CCFG-DESIGN-088`／`CCFG-UI-077`；`CCFG-REQ-154`（三点入口可选样式）↔ `CCFG-AC-157`／`CCFG-DESIGN-089`／`CCFG-UI-076`。覆盖核验**保持** `154/154` 与 `157/157`。

## 4. 分层状态（R1 纠错时点）

```text
r0_draft_remote_review_verdict=CHANGES_REQUIRED
adjustment7_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment7_approval_status=NOT_APPROVED
adjustment7_implementation_status=NOT_STARTED
adjustment7_formal_acceptance_execution_status=NOT_RUN
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
```

- 本 R1 只收敛 R0 草案口径，**不**改变 `adjustment7_*` 四项状态、**不**把草案改为已批准、**不**启动实现、**不**执行验收。
- **ChatGPT 对 R0 草案的 `CHANGES_REQUIRED` ≠ R1 已获批**：R1 结果提交仍须由 ChatGPT **从远程 Git** 做独立**文档**复审；复审通过后仍**不等于**项目负责人已批准最终草案或已进入代码实现。

## 5. 四处定向纠错的旧／新关系

| # | 问题（R0 复审指出） | 旧（R0） | 新（R1 收敛） | 落点定义行 |
|---|---|---|---|---|
| ① | 行高验收容差未给出 | 只写“一致或处于经实测可解释的极小误差内”，容差未预置，易被实现结果反向放宽 | **冻结测量口径与预置容差**：常规样本＝内容不换行且无额外撑高内容；同一浏览器／缩放 100%／同一视口下至少 1440×900 与 1920×1080 两组；对正文 `tr` 取 `getBoundingClientRect().height` 保留原始测值（不四舍五入）；每页每组 ≥3 条可比常规行；**差值绝对值 ≤ 1 CSS px、验收前预置、不得事后放宽**，逐条判断、不以取平均掩盖单行超差；样本不足按未覆盖记录、不得凭推导判 `PASS` | `CCFG-REQ-153`、`CCFG-DESIGN-088`、`CCFG-UI-077`、`CCFG-AC-155` |
| ② | `CCFG-AC-010` 时序／状态理由自相矛盾（既说旧 58～64px 已被取代，又用它作 `BLOCKED` 理由） | 以**已被取代**的“约 58～64px”区间未满足作为 `BLOCKED` 理由 | 保留 `CCFG-REQ-013`／`CCFG-AC-010` 旧原文为**历史基线**；现行判定由 `CCFG-REQ-106`／`CCFG-DESIGN-049` 与 `CCFG-REQ-153`／`CCFG-AC-155` 承接；`CCFG-AC-010` **保持 `BLOCKED`**，理由**仅限现行仍有效步骤中尚缺实际证据的部分**（见 §7）；**不**把负责人目测写成其前置或步骤 | `CCFG-AC-010` |
| ③ | `CCFG-AC-155` 把允许自适应增高的异常行混入必须等高的常规行样本 | 常规样本定义未明确排除异常／歧义／超长行 | 样本**拆为两组**：**等高对照组**（普通单行，含红／绿标签且仍是普通单行者）逐条判 **≤1 CSS px**；**自适应观察组**（异常／歧义提示如 27px 行级标记、超长内容）只判内容适应、标签／提示／入口完整与无裁切／重叠／意外换行，记录行高但**不**强制与参考页普通行相等 | `CCFG-AC-155`、`CCFG-REQ-153`、`CCFG-DESIGN-088`、`CCFG-UI-077` |
| ④ | 公共模板 helper 类、令牌、静态断言与草案标记计数仍为未决问题 | §12.7 只列未决清单（helper 类／令牌最终命名与默认值、#2/#3/#6/#11 修订文本、§4.3／§4.4 计数、容差数值、§12 候选标记是否并入 §7.4 口径） | §12.7 **替换为逐项可复审的确定拟修订契约**（见 §6），**不再**以二选一或未决清单代替口径 | `SHARED_COMPONENT_DESIGN.md` §12、`CCFG-REQ-154`、`CCFG-DESIGN-089`、`CCFG-UI-076` |

- 上述数值为 R1 草案的**预设验收标准**，**不是**本次浏览器实测结果；本任务**未**运行浏览器、**未**重新实测。
- 未发现已批准规范明确排斥 ≤1 CSS px 容差的条款；已批准旧断言（#2/#3/#6/#11 现值、§4.3／§4.4 现值计数）在草案获批与实现前**仍是现行事实**，R1 仅给出**拟修订文本**，**拟修订值 ≠ 现值**。

## 6. 公共模板 opt-in 扩展拟修订契约（`SHARED_COMPONENT_DESIGN.md` §12，仍候选、未获批、未实现）

| # | 拟修订项 | R1 收敛结论 |
|---|---|---|
| 1 | **显式类名与挂载位置** | 操作列 `td` 上的 `lt-row-action__cell`、三点触发器上的 `lt-row-action__ellipsis`；两者均受 `.lt-main-table` 根类限定（若因现有 BEM 规则或 Element Plus 实际 DOM 必须更名，须说明依据并在所有文档统一） |
| 2 | **令牌** | **默认不新增 `--lt-*` 令牌**，保留现行 9 令牌与静态断言 #2（恰 9 个）／#3（默认值一致）；28px 命中区、6px 圆角、本页既有主色作为该 opt-in 视觉变体的**提议默认值**记录；若评审确需可调令牌，须写出准确令牌名、默认值、令牌总数与 #2/#3 拟修订文本，**不**留二选一 |
| 3 | **静态断言 #6／#11 拟修订** | 所有新增 `:deep(...)` 规则仍以 `.lt-main-table` 起头（#6 拟文本不变地覆盖复合选择器）；内部 helper 类由「`0` 个」改为「只允许明确列出的 opt-in 类集合 `{lt-row-action__cell, lt-row-action__ellipsis}`」，其他 `lt-` 类仍禁止（#11） |
| 4 | **§4.3／§4.4 拟生效计数** | 拟生效时 `lt_internal_helper_class_count` `0 → 2`、`lt_token_count` **保持 9**；§4.3 阶段一取值相应由 `0 → 2`；生效条件＝草案获批 + 独立实现任务落地（**拟值 ≠ 现值**） |
| 5 | **高度口径区分** | 公共层**不得强制表格行**的固定 `height`／`max-height`／`line-height`；但**可**声明三点触发器**自身**约 `28×28px` 命中区尺寸；行高补偿**只**作用于显式 opt-in 的操作单元格，不触及未启用页 |
| 6 | **计数口径确定** | 三通道分别核算（见下），**不**再把「§12 候选标记是否并入选 §7.4」留为待审 |
| 7 | **将来批准路径** | 基线复审 → 项目负责人批准 → 由**独立实现任务**改公共样式／对应静态断言并让 `/config/client` 显式接入；**不得**借本 R1 直接修改已批准公共代码，也**不得**提前翻转 `/config/data-source` 迁移状态 |

**标记计数口径（三通道，互不混淆）**：

- 通道 1 — 四份规范文档（`README`／`DESIGN`／`UI`／`MIGRATION`）计数**保持** `LIST_TABLE_REFERENCE_FACT=26` / 草案态规则标记 `0` / `LIST_TABLE_TEMPLATE_APPROVED=42` / `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED=7` **不变**（README §7.4 口径只扫描这四份）。
- 通道 2 — `SHARED_COMPONENT_DESIGN.md` 批准态设计标记计数**保持 `79` 不变**（按原口径，以拆字串命令核验）。
- 通道 3 — §12 候选未实现标记**独立统计**（本文件内）：实测 **23**（其中 §12 节内 **20** 处，§0.1／§11.2／§11.3 说明文字共 **3** 处）。R0 时点值为 §12 内 `15`／含 §0.1 为 `16`／文件总计 `18`，作为**历史时点证据保留**，R1 标记数变动后**重新核算**、不硬编码旧值。

- 上述拟修订契约**仍候选、未获批、未实现**；本 R1 **未**修改任何公共代码、**未**改静态断言源代码、**未**改 `frontend/src/styles/list-table/**`；`/config/data-source` 迁移状态**未**翻转，`page_migration_status=NOT_STARTED`／`page_migration_authorization_status=NOT_GRANTED`／`pilot_page_selection_status=NOT_DECIDED` **均不变**。

## 7. `CCFG-AC-010` 的历史／现行关系与已覆盖／仍缺子步骤

- **历史口径**：`CCFG-AC-010`（与 `CCFG-REQ-013`／`CCFG-UI-005`／`CCFG-UI-007`）在 2026-09-04 建立基线时记录“调整浏览器宽度后…常规行视觉高度约 **58～64px**（以实际盒模型为准）”。
- **时序取代**：随后的 `CCFG-REQ-106`（2026-09-23 第二轮主列表视觉调整“行高跟随数据源管理实际规则、**移除固定像素**”）与 `CCFG-DESIGN-049` 在时序上取代该绝对像素区间；本轮 `CCFG-REQ-153`／`CCFG-AC-155` 进一步把“与参考页当前实际行高协调一致、不以固定像素掩盖”列为**现行目标**。
- **状态处置**：`CCFG-AC-010` **保持 `BLOCKED`**，R1 **不**改判为 `PASS`；历史原文、R0~R5 执行记录与只读补测报告**保留可追溯、不回写**。
- **R1 改写后的 `BLOCKED` 理由**仅限**现行仍有效步骤中尚缺实际证据**的部分，对照最近 R5 与只读补测报告列明如下：

| 分类 | 子步骤 | 证据来源／状态 |
|---|---|---|
| 已覆盖 | 1440×900 下 `accG#010`／`accG#098` 单行、行高一致、无溢出、直接展示数 ≤6、`+N` 准确、`td` 既存内边距 12px、7 源样本 total=7／direct=1／plus=+6 | 只读补测报告 §3.2 现场证据 |
| 已覆盖 | 跨宽度 **5 个视口**下 `probeA` 直接展示数、`+N`、行高恒定、无溢出、`+N` 与标签均在界内 | 只读补测报告 §3.2 现场证据 |
| 已覆盖 | 1024×900 下 `accH#093` 全部单行 | 只读补测报告 §3.2 现场证据 |
| **仍缺** | 现行期望（与参考页实际行高协调一致、≤1 CSS px 容差）的实际取样与逐条判定 | 由**现行 `NOT_RUN` 的 `CCFG-AC-155`** 承接；本 R1 **不**执行 |
| **仍缺** | “**恰好 6 源**”边界样本 | **不可构造**（当前环境无该数据，属未来验收前提） |
| 声明 | 本条定义**不含**负责人目测项；R1 **不**把负责人目测写成其前置或步骤 | —— |

- **本 R1 不重跑验收**、**不**把 `BLOCKED` 改为 `PASS`、**不**回写 R0／R1 历史证据。

## 8. 验收状态

| 指标 | 变更前（R0 后） | 变更后（R1） |
|---|---|---|
| `PASS` | 69 | 69 |
| `FAIL` | 0 | 0 |
| `BLOCKED` | 70 | 70 |
| `NOT_RUN` | 18 | 18 |
| 合计 | 157 | **157** |

- 本 R1 **不新增用例**；`CCFG-AC-001~157` 的**执行状态格零变化**（`CCFG-AC-010` 仅就地改写**理由文字**，状态格仍 `BLOCKED`；`CCFG-AC-155` 仅改写**样本分组与容差文字**，状态格仍 `NOT_RUN`）。
- 汇总经 `ACCEPTANCE.md` §4 逐行机读核验：`PASS` **69** / `FAIL` **0** / `BLOCKED` **70** / `NOT_RUN` **18** = **157**。
- **`FAIL` 为 0 与新增 3 条 `NOT_RUN` 均不等于功能整体验收通过**；`formal_acceptance_execution_status` 仍为 `NOT_RUN`，**项目负责人尚未作出整体验收接受决定**。

## 9. 风险

- **未实测**：≤1 CSS px 容差与具体测量值须由**后续实现任务**在真实浏览器（同一浏览器／缩放／视口，两页对照）中实测并最终判定；R1 只冻结**预设**标准，**不**替代实测。
- **契约修订面**：公共 opt-in 能力若落地，必须同步修订 §7.1 断言 #2/#3/#6/#11 与 §4.3／§4.4 可断言计数，并回收“§4.4 行高不由公共层定义”的对偶约束——**须经独立评审**方可动；R1 只给**拟**文本，不改代码。
- **裁切与命中**：`.cell{overflow:hidden}` 与 `:focus-visible` 外描边存在真实裁切风险；命中区跨行误触、遮挡相邻内容、缩放／窄视口稳定性均**未**验证。
- **计数面**：§12 候选标记增长使通道 3 值由 R0 的 `18` 变为 `23`；已按三通道口径**独立核算**并保留 R0 时点值，避免与四份规范文档计数（`26 / 0 / 42 / 7`）混淆。
- **范围面**：本轮**不**触碰数据源管理参考页，**不**改任何代码／共享 CSS；若后续会话实施数据源页迁移，须另行授权。

## 10. 未修改文件与未执行项

- **未修改**：见 §2 末尾“未修改”清单（含 R0 报告、全部历史验收／补测报告与证据、`docs/baseline/` 六份项目级基线、`query-list-page-template/**`、模板 `DESIGN.md`／`UI.md`／`MIGRATION.md`、`API.md`／`DATABASE.md`、`docs/prompts/**`、前后端代码与测试、共享模板代码、参考页 `/config/data-source`、`CLAUDE.md`、`agent-env.sh`、`.claude/**`）。
- **未执行**：浏览器实测／截图、前端构建（`npm run build`／`type-check`／`lint`／`test`）、后端构建（`mvn test`／`package`）、服务启动／停止、数据库（含 SQL*Plus 与任何写操作）、ZooKeeper／Kafka 访问、正式验收、代码或共享 CSS 修改、任何页面动作。
- 数据库写操作：`NOT_REQUESTED`；ZooKeeper 写操作：`NOT_REQUESTED`。

## 11. 静态检查结果

```text
git diff --check                = 通过（无空白错误）
定义行计数                      = REQ 154 / AC 157 / DESIGN 089 / UI 077（连续、唯一、无新增/删除/复用）
覆盖核验                        = 154/154 与 157/157
验收四态（ACCEPTANCE §4 机读）  = PASS 69 / FAIL 0 / BLOCKED 70 / NOT_RUN 18 = 157
模板四份规范文档标记计数        = 26 / 0 / 42 / 7（不变）
SHARED 批准态设计标记计数       = 79（不变）
§12 候选未实现标记（通道 3）    = 23（§12 节内 20，其它说明 3；R0 时点 18 保留为历史证据）
格式与白名单                    = 仅本次 7 个已跟踪文档 + 本报告；未跟踪内容保持原位
```

## 12. 下一入口

```text
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_BASELINE_R1_REVIEW
```

由 ChatGPT **从远程 Git** 对本 R1 结果做独立**文档**复审。**该复审不是代码实现入口**，也**不**代表页面已目测、已实现或已正式验收。远程**文档**复审**通过后**，方可另行立项进入第七轮代码实现，并须在实现前完成公共模板侧已批准契约的受控修订评审。

---

## 边界声明（必须显式）

- 本任务**只做纯文档 R1 定向纠错**：**未**修改前端代码／测试或共享 CSS、**未**实施页面调整、**未**运行浏览器实测／测试／构建、**未**执行正式验收、**未**修改数据源管理参考页。
- **「R1 文档已推送」不等于**已批准、已实现、项目负责人已目测通过或已正式验收通过；**项目负责人对最终草案的批准与代码实现均尚未发生**。
- 本 R1 **不**宣布整体 `PASS`、**不**宣布正式接受、**不**授权创建通用模板、**不**授权任何页面迁移。
- 历史原文、历史执行记录（R0~R5）与只读补测报告**保留可追溯，不回写**；`CCFG-AC-010` **保持 `BLOCKED`**，`CCFG-AC-155` 状态格保持 `NOT_RUN`。
- 已批准公共模板旧断言与计数在草案获批与实现前**仍是现行事实**；§12 拟修订契约**仍候选、未获批、未实现**。
- 模板级 `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED` **均不变**；已批准模板旧基线的历史事实与审批链**不回写**。
