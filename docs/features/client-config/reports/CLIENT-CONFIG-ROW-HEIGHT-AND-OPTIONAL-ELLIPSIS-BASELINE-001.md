# 探针端管理主列表行高与三点入口可选样式 · 基线草案建立执行报告

> 任务代码：`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001`
> 任务类型：纯文档草案建立（为 `/config/client` 主列表**行高**与**行内三点入口可选样式**建立需求／验收／设计／UI 草案，并在公共列表表格视觉模板中建立**待复审的可选扩展草案**；**不**改前端代码或共享 CSS、**不**实施页面调整、**不**执行正式验收）
> 分支：`develop`
> 起始提交（= 本地 HEAD = `origin/develop` = 远程 `refs/heads/develop`）：`576123db2562ee8ec83748a37297ceb01542fe3b`
> 上一时点事实：探针端管理正式验收只读补测 R1（`CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001-R1`）结果提交 `576123d` 已推送；其远程文档/证据复审结论**以远程 Git 事实为准**（本轮未获知），**不**等于项目负责人已正式验收或已接受
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_BASELINE_REVIEW`
> 本任务**不**改代码、**不**执行正式验收、**不**宣称本轮草案已复审／已批准／已实现／已验收，**不**作出项目负责人目测通过或最终接受结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=576123db2562ee8ec83748a37297ceb01542fe3b
actual_base_commit=576123db2562ee8ec83748a37297ceb01542fe3b
origin_develop=576123db2562ee8ec83748a37297ceb01542fe3b
remote_refs_heads_develop=576123db2562ee8ec83748a37297ceb01542fe3b
ahead_behind(origin/develop...HEAD)=0/0
latest_reported_commit_in_prompt=576123db2562ee8ec83748a37297ceb01542fe3b
baseline_approval_status=APPROVED(第一轮~第六轮)
adjustment6_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
adjustment7_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment7_approval_status=NOT_APPROVED
adjustment7_implementation_status=NOT_STARTED
adjustment7_formal_acceptance_execution_status=NOT_RUN
formal_acceptance_execution_status=NOT_RUN
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop（禁止强推）
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`576123d`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发停线条件；任务提示词给出的“最近已报告提交”`576123d` 与现场真实 Git 对象一致。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`（另有本 Agent 自身产生的未跟踪 `runtime-logs/`）。
- 开工时从 Git 核实的四类定义计数为 需求 `CCFG-REQ-152`／验收 `CCFG-AC-154`／设计 `CCFG-DESIGN-087`／界面 `CCFG-UI-075`；本轮新增编号据此从 `153`／`155`／`088`／`076` 连续接续。
- 已读取第六轮已批准基线与第五轮已批准交互（`CCFG-REQ-148~152`、`CCFG-AC-147~154`、`CCFG-DESIGN-083~087`、`CCFG-UI-071~075`），以及公共列表表格视觉模板的五份文档与三份公共源代码，确认本轮两项方向不与该基线冲突、但公共侧落地需**受控修订**已批准详细设计契约（见 §6）。
- 环境：本任务为**纯文档**任务，按 `CLAUDE.md` §15 验证矩阵不适用构建；**未**运行测试／构建／lint／浏览器；**未**启停任何服务（上轮 START-ONLY 启动的后端 `:8080` 与前端 Vite `:5173` **未被本任务触碰**）；**未**访问或写入数据库／ZooKeeper／Kafka。

## 2. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/REQUIREMENTS.md` | 修改 | 新增 §7.16 与 `CCFG-REQ-153~154`（2 条）、`CCFG-REQ-013` 就地定向标注、§8 编号核验与合计、§10 变更记录 |
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | 新增 §1.19 分层状态块与 `CCFG-AC-155~157`（3 条，全部 `NOT_RUN`）、`CCFG-AC-010` 就地定向标注（状态**保持 `BLOCKED`**）、§3 编号与分类计数、§4 表前说明、§5 覆盖矩阵、§6 变更记录 |
| `docs/features/client-config/DESIGN.md` | 修改 | 新增 §19 与 `CCFG-DESIGN-088~089`（2 条）、§12.1／§12.2 映射行、§1 metadata 编号与条款、`## 19 变更记录`顺延为 `## 20` |
| `docs/features/client-config/UI.md` | 修改 | 新增 §21 与 `CCFG-UI-076~077`（2 条）、`CCFG-UI-005`／`CCFG-UI-007` 就地定向标注、§16 追注、§1 metadata 编号与条款、§14 矩阵、`## 21 变更记录`顺延为 `## 22` |
| `docs/features/client-config/README.md` | 修改 | 新增 §1.13 第七轮分层状态块与两项方向映射表、§2 导航（新增报告行）、§4 当前状态条目（含现行正式验收统计）、§5 将只读补测 R1 入口降为历史并新增当前入口 |
| `docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md` | 修改 | 新增 §12「待复审的可选扩展草案：行内三点入口 opt-in」（§12.1~§12.8），并在 §0.1／§11.1／§11.3 追加**标记例外与计数**说明 |
| `docs/baseline/list-table-visual-template/README.md` | 修改 | §8 文档导航追加“待复审可选扩展草案”指引段、§11 变更记录追加 `2026-09-29` 行 |
| `docs/baseline/list-table-visual-template/UI.md` | 修改 | §3.7 追加 `2026-09-29` 追注（时序核对“探针端管理显式固定 `height: 60px`”已过期） |
| `docs/baseline/list-table-visual-template/MIGRATION.md` | 修改 | 追加「探针端管理主列表行高事实的时序核对（追加记录，`2026-09-29`）」 |
| `docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001.md` | 新增 | 本报告 |

`docs/baseline/list-table-visual-template/DESIGN.md` **未修改**：其中的行高策略（“默认不固定行高、由内容驱动”）与本轮方向**一致**，无冲突条款需定向修订，也无过期“现行示例”需勘误（该文件不含 60px 表述）。

**未修改**：`docs/features/client-config/API.md`、`DATABASE.md`、`docs/baseline/` 六份**项目级**基线、`docs/baseline/query-list-page-template/**`、`docs/features/README.md`、R0~R5 与只读补测（含 R1）全部历史报告与证据索引、`docs/prompts/**`、前后端代码与测试（含共享模板**代码** `list-table-visual.css`／`index.ts`／`list-table-visual.spec.ts`）、参考页 `/config/data-source`、`CLAUDE.md`、`agent-env.sh`、`.claude/**` 与 `.claude/settings.local.json`。

`git diff --stat`（任务开始前未跟踪内容不计）：9 个已跟踪文件，`380 insertions(+), 15 deletions(-)`。

## 3. 新旧定义编号与逐项覆盖

| 层 | 本轮新增编号 | 条数 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|---|
| 需求 | `CCFG-REQ-153~154` | 2 | —— | —— |
| 验收 | `CCFG-AC-155~157` | 3 | `CCFG-REQ-153~154` | —— |
| 设计 | `CCFG-DESIGN-088~089` | 2 | `CCFG-REQ-153~154` | `CCFG-AC-155~157` |
| 界面 | `CCFG-UI-076~077` | 2 | `CCFG-REQ-153~154` | `CCFG-AC-155~157` |

- 编号连续、唯一、无跳号、无重号；现有定义行总数为 `CCFG-REQ-001~154`（154 条）、`CCFG-AC-001~157`（157 条）、`CCFG-DESIGN-001~089`（89 条）、`CCFG-UI-001~077`（77 条）。
- 逐项映射：`CCFG-REQ-153`（行高协调）↔ `CCFG-AC-155`／`CCFG-AC-156`／`CCFG-DESIGN-088`／`CCFG-UI-077`；`CCFG-REQ-154`（三点入口可选样式）↔ `CCFG-AC-157`／`CCFG-DESIGN-089`／`CCFG-UI-076`。覆盖核验更新为 `154/154` 与 `157/157`。

## 4. 分层状态（草案建立时点）

```text
adjustment7_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment7_approval_status=NOT_APPROVED
adjustment7_implementation_status=NOT_STARTED
adjustment7_formal_acceptance_execution_status=NOT_RUN
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
```

- 目标：① 使 `/config/client` 主列表**常规单行记录**的视觉高度与参考页 `/config/data-source` **当前普通行**在**同一浏览器／缩放／视口**下一致或处于经实测可解释的极小误差内，且**不**以固定像素掩盖、**不**破坏公共层“内容驱动行高”的默认纪律；② 把行内三点入口的**外观与通用可访问性**提炼为公共列表表格视觉模板的**显式启用（opt-in）**可选能力，未启用页面计算样式零变化。
- 非目标：本任务**不**改代码／共享 CSS、**不**实施页面调整、**不**执行正式验收、**不**把 `28px` 变成所有主列表的强制最小行高、**不**把未来数据源页“更多”→三点迁移写成已完成或已授权、**不**修改数据源管理参考页的任何代码／交互／验收状态。
- **项目负责人 2026-09-29 的产品方向确认 ≠ 本轮草案已获远程复审或基线批准。**

## 5. 被定向修订的条款（原文保留、可追溯）

| 定义行 | 处置 | 现行状态 |
|---|---|---|
| `CCFG-REQ-013` | 就地追加 `**【2026-09-29 第七轮定向修订 · 待复审】**`，说明“约 58～64px”为 2026-09-04 建基线时的**历史口径**，已被时序上后续的 `CCFG-REQ-106` 取代；**原文保留不改写** | 需求已批准，标注为待复审 |
| `CCFG-UI-005`、`CCFG-UI-007` | 同法就地标注（两处“58~64px”表述） | 界面已批准，标注为待复审 |
| `CCFG-AC-010` | 同法就地标注；**状态保持 `BLOCKED`** | `BLOCKED`（**不**改判为 `PASS`） |

未修改任何历史报告、历史证据或已批准的时点性计数表述（如 `REQUIREMENTS.md` §1／§1.2／§7 前言与 `ACCEPTANCE.md` §2／§5 中点时数量表述）；这些属**历史时点记录**，按零改写原则保留，本报告仅如实说明。

## 6. 公共模板可选扩展草案边界（`SHARED_COMPONENT_DESIGN.md` §12）

- **只提炼外观与通用可访问性**：图标容器与实际命中区域、行内对齐、圆角、文字／图标色、hover、`focus-visible`、disabled、光标及行高协同。
- **公共层不固化**：菜单项集合与顺序、业务权限、删除／启停语义与文案、请求时序与幂等、行点击选中／双击编辑规则、Popover/Dropdown 定位与关闭时机、异常／歧义数据语义（继续由 Feature 控制）。
- **落地形态（草案，待评审）**：`lt-<block>__<element>`（BEM 双下划线）形态的显式 opt-in 辅助类 + 有限令牌（`--lt-row-action-size`／`--lt-row-action-radius`／`--lt-row-action-color`，草案默认值分别来自探针页既有 `28px`／`6px`／`--el-color-primary`）。
- **可能需受控修订的已批准契约（已在 §12.2／§12.7 逐项列出，**未**修改）**：§7.1 静态契约断言 #2（令牌恰好 9 个）、#3（默认值一致）、#6（`:deep(...)` 头部须含 `.lt-main-table`）、#11（无其他 `lt-` 类选择器），以及 §4.3／§4.4 的可断言计数；§4.4「行高**不由公共层定义**」纪律**不变**。
- **与“内容驱动行高”共存的技术依据**：把**命中区域**与**行高贡献**分开（外层随行内容节奏、内层保留约 `28×28px` 命中区），可选内边距补偿；**不**采用把命中区缩到 `23px`、**不**用固定行高掩盖、**不**使用该页规格禁止的位移手段。已知阻力：Element Plus `.cell{overflow:hidden}` 会裁切溢出式命中区与外描边（`2px + 1px offset`），故“溢出扩张”默认不可行，须改用盒内布局或以 `:has()` 限定的 `overflow: visible`／`outline-offset: -2px` 等**待浏览器验证**方案。
- **示例 ≠ 迁移**：§12.6 给出探针页接入示例与将来数据源页**可接入**示例；数据源页“更多”→三点属**另一会话、另一任务**，本任务**未**迁移、**未**授权任何页面。
- **标记与计数完整性**：§12 按 `README.md` §7.3 的阅读约定携带**候选未实现标记**；为不破坏已批准计数，§0.1／§11.1／§11.3 追加了**标记例外与计数**说明。实测（2026-09-29）：四份规范文档计数**保持 `26 / 0 / 42 / 7` 不变**（草案态规则标记仍为 `0`），`SHARED_COMPONENT_DESIGN.md` 批准态设计标记计数**保持 `79` 不变**；§12 内候选未实现标记实例 `15`，含 §0.1 说明为 `16`，本文件该标记全部出现 `18`（另含 §11.3 计数块内 `2` 处引用）。
- **待复审问题（§12.7）**：辅助类／令牌最终命名与默认值；#2/#3/#6/#11 的受控修订文本与新增断言；§4.3／§4.4 计数修订；内边距补偿的具体数值与容差；§12 候选标记实例是否并入 `README.md` §7.4 口径。

## 7. `CCFG-AC-010` 的历史／现行关系

- **历史口径**：`CCFG-AC-010`（与 `CCFG-REQ-013`／`CCFG-UI-005`／`CCFG-UI-007`）在 2026-09-04 建立基线时记录“调整浏览器宽度后…常规行视觉高度约 **58～64px**（以实际盒模型为准）”。
- **时序取代**：随后的 `CCFG-REQ-106`（2026-09-23 第二轮主列表视觉调整“行高跟随数据源管理实际规则、**移除固定像素**”）与 `CCFG-DESIGN-049` 在时序上取代该绝对像素区间；本轮 `CCFG-REQ-153`／`CCFG-AC-155` 进一步把“与参考页当前实际行高协调一致、不以固定像素掩盖”列为**现行目标**。
- **既有现场证据（非本任务重新实测）**：只读补测报告记录**探针端管理约 `53px`、数据源管理约 `48px`**；本任务**未**运行浏览器、**未**重新实测。技术推导：`48 = 23 + 24 + 1`、`53 = 28 + 24 + 1`（`24` 为已批准预设 `--lt-body-cell-padding: 12px 0` 的上下和，差异由 `28×28px` 三点入口的**布局盒**撑开）。
- **状态处置**：`CCFG-AC-010` **保持 `BLOCKED`**，本轮**不**改判为 `PASS`；历史原文、历史执行记录（R0~R5）与只读补测报告**保留可追溯、不回写**。

## 8. 验收状态

| 指标 | 变更前 | 变更后 |
|---|---|---|
| `PASS` | 69 | 69 |
| `FAIL` | 0 | 0 |
| `BLOCKED` | 70 | 70 |
| `NOT_RUN` | 15 | 18 |
| 合计 | 154 | **157** |

- 本轮**新增 3 条**用例（`CCFG-AC-155~157`）**全部为 `NOT_RUN`**；既有 `CCFG-AC-001~154` 的**执行状态格零变化**（`CCFG-AC-010` 仅就地追加时序标注，状态仍 `BLOCKED`）。
- 汇总经 `ACCEPTANCE.md` §4 逐行机读核验：`PASS` **69** / `FAIL` **0** / `BLOCKED` **70** / `NOT_RUN` **18** = **157**。
- **`FAIL` 为 0 与 3 条新增均不等于功能整体验收通过**；`formal_acceptance_execution_status` 仍为 `NOT_RUN`，**项目负责人尚未作出整体验收接受决定**。

## 9. 风险

- **未实测**：行高目标的具体数值与容差须由**后续实现任务**在真实浏览器（同一浏览器／缩放／视口，两页对照）中实测并最终判定；本草案只给出推导与既定证据，**不**替代实测。
- **契约修订面**：公共 opt-in 能力若落地，必须同步修订 §7.1 断言 #2/#3/#6/#11 与 §4.3／§4.4 可断言计数，并回收“§4.4 行高不由公共层定义”的对偶约束——**须经独立评审**方可动。
- **裁切与命中**：`.cell{overflow:hidden}` 与 `:focus-visible` 外描边存在真实裁切风险；命中区跨行误触、遮挡相邻内容、缩放／窄视口稳定性均**未**验证。
- **计数面**：本节新增内容位于 `SHARED_COMPONENT_DESIGN.md`，不属 `README.md` §7.4 的四份规范文档口径；若评审认为该草案的候选标记应并入该口径，则需一次受控的计数更新（已在 §12.7 列为待复审问题）。
- **范围面**：本轮**不**触碰数据源管理参考页，**不**改任何代码／共享 CSS；若后续会话实施数据源页迁移，须另行授权。

## 10. 未修改文件与未执行项

- **未修改**：见 §2 末尾“未修改”清单（含 `docs/baseline/` 六份项目级基线、两套模板中的 `query-list-page-template/**` 与模板 `DESIGN.md`、`API.md`／`DATABASE.md`、全部历史报告与证据、`docs/prompts/**`、前后端代码与测试、共享模板代码、参考页、`CLAUDE.md`、`agent-env.sh`、`.claude/**`）。
- **未执行**：浏览器实测／截图、前端构建（`npm run build`／`type-check`／`lint`／`test`）、后端构建（`mvn test`／`package`）、服务启动／停止、数据库（含 SQL*Plus 与任何写操作）、ZooKeeper／Kafka 访问、正式验收、代码或共享 CSS 修改、页面迁移评估以外的任何页面动作。
- 数据库写操作：`NOT_REQUESTED`；ZooKeeper 写操作：`NOT_REQUESTED`。

## 11. 静态检查结果

```text
git diff --check                = 通过（无空白错误）
定义行计数                      = REQ 154 / AC 157 / DESIGN 089 / UI 077（连续、唯一）
覆盖核验                        = 154/154 与 157/157
验收四态（ACCEPTANCE §4 机读）  = PASS 69 / FAIL 0 / BLOCKED 70 / NOT_RUN 18 = 157
模板四份规范文档标记计数        = 26 / 0 / 42 / 7（不变）
SHARED 批准态设计标记计数       = 79（不变）
格式与白名单                    = 仅本次 9 个已跟踪文档 + 本报告；未跟踪内容保持原位
```

## 12. 下一入口

```text
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_BASELINE_REVIEW
```

由 ChatGPT **从远程 Git** 对本草案结果做独立**文档**复审。**该复审不是代码实现入口**，也**不**代表页面已目测、已实现或已正式验收。远程**文档**复审**通过后**，方可另行立项进入第七轮代码实现，并须在实现前完成公共模板侧已批准契约的受控修订评审。

---

## 边界声明（必须显式）

- 本任务**只建立纯文档草案**：**未**修改前端代码或共享 CSS、**未**实施页面调整、**未**执行正式验收、**未**修改数据源管理参考页。
- **「文档草案已推送」不等于**已批准、已实现、项目负责人已目测通过或已正式验收通过。
- 本轮**不**宣布整体 `PASS`、**不**宣布正式接受、**不**授权创建通用模板、**不**授权任何页面迁移。
- 历史原文、历史执行记录（R0~R5）与只读补测报告（含 `探针 53px`／`数据源 48px` 现场证据）**保留可追溯，不回写**；`CCFG-AC-010` **保持 `BLOCKED`**。
- 模板级 `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED` **均不变**；已批准模板旧基线的历史事实与审批链**不回写**。
