# 探针端管理主列表行高与三点入口可选样式 · 基线草案 R2 定向纠错执行报告

> 任务代码：`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001-R2`
> 任务类型：**纯文档 R2 定向纠错**（按 ChatGPT 对 R1 草案的远程 `CHANGES_REQUIRED` 结论，**只**作两处定向纠错；**不**改前端代码／测试／共享 CSS、**不**实施页面调整、**不**运行浏览器实测／测试／构建、**不**执行正式验收）
> 分支：`develop`
> 起始提交（= 本地 HEAD = `origin/develop` = 远程 `refs/heads/develop`）：`938e7202980cf898fe5c6d1194715e3a004f994a`
> 触发事实：ChatGPT 从远程 Git 对 R1 提交 `938e720` 的复审结论为 `CHANGES_REQUIRED`，两处：① `CCFG-AC-010` 的 R1 追注**错误借用** `CCFG-AC-155` 未执行与 `CCFG-AC-098` 缺「恰好 6 源」样本作为本条**自身**继续 `BLOCKED` 的证据缺口；② `SHARED_COMPONENT_DESIGN.md` §12.7 拟议断言 #11 的示例判定表达式 `new Set(css().match(/\.lt-[\w-]+/g))` **本身会命中根类 `.lt-main-table`**，与「辅助类恰好两个」不符。
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_BASELINE_R2_REVIEW`
> 本 R2 **只做纯文档定向纠错**，**不**对 `CCFG-AC-010` 作新的验收判定，**不**宣布草案获批或页面调整已实现，**不**作出项目负责人目测通过或最终接受结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=938e7202980cf898fe5c6d1194715e3a004f994a
actual_base_commit=938e7202980cf898fe5c6d1194715e3a004f994a
origin_develop=938e7202980cf898fe5c6d1194715e3a004f994a
remote_refs_heads_develop=938e7202980cf898fe5c6d1194715e3a004f994a
ahead_behind(origin/develop...HEAD)=0/0
r1_draft_remote_review_verdict=CHANGES_REQUIRED
adjustment7_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment7_approval_status=NOT_APPROVED
adjustment7_implementation_status=NOT_STARTED
adjustment7_formal_acceptance_execution_status=NOT_RUN
formal_acceptance_execution_status=NOT_RUN
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop（禁止强推）
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`938e720`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发停线条件；任务提示词给出的预期起始提交 `938e720` 与现场真实 Git 对象一致。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`（另有本 Agent 自身产生的未跟踪 `runtime-logs/`）。
- 开工时四类定义计数为 需求 `CCFG-REQ-154`／验收 `CCFG-AC-157`／设计 `CCFG-DESIGN-089`／界面 `CCFG-UI-077`；本 R2 **不**新增、**不**删除、**不**复用任何编号。
- 环境：本任务为**纯文档**任务，按 `CLAUDE.md` §15 验证矩阵不适用构建；**未**运行测试／构建／lint／浏览器；**未**启停任何服务（上轮 START-ONLY 启动的后端 `:8080` 与前端 Vite `:5173` **未被本任务触碰**）；**未**访问或写入数据库／ZooKeeper／Kafka。

## 2. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | `CCFG-AC-010` **追注就地改写**（删除错误归因、如实列明本条自身已执行证据、`BLOCKED` 改为待独立重新判定；状态格**保持 `BLOCKED`**）；新增 §1.21 **R2 状态块**；§6 变更记录追加 R2 行 |
| `docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md` | 修改 | §12 标题与 R1 段落更新（追加 R2 段、状态值改为 `R2_CORRECTED_PENDING_REVIEW`）；§12.7 **拟议断言 #11 修正为可实现的根类剔除口径**；§12.8 追加 R2 后复测说明 |
| `docs/features/client-config/README.md` | 修改 | §1.13 追加 R2 纠错段（R1 段标注其后复审 `CHANGES_REQUIRED`）；§2 导航新增 R2 报告行；§4 追加 R2 条目；§5 将 R1 入口降为**历史下一入口**并新增 **R2 当前下一入口** |
| `docs/baseline/list-table-visual-template/README.md` | 修改 | §8 待复审可选扩展草案段落追加 R2 修正说明；§11 变更记录追加 `2026-09-29` R2 行 |
| `docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001-R2.md` | 新增 | 本报告 |

**未修改**：`docs/features/client-config/REQUIREMENTS.md`、`DESIGN.md`、`UI.md`（R1 已定的行高容差／样本分组／模板边界不在本次两处纠错范围内，**逐字节零变化**）；`CCFG-REQ-013`／`CCFG-REQ-153`／`CCFG-AC-155` 的业务定义；R0／R1 报告 `reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001*.md`；`frontend/src/styles/list-table/list-table-visual.spec.ts`（**现行断言代码只读未改**）；R0~R5 与只读补测（含 R1）全部历史报告与证据索引；`docs/features/client-config/API.md`、`DATABASE.md`；`docs/baseline/` 六份**项目级**基线、`docs/baseline/query-list-page-template/**`、模板 `DESIGN.md`／`UI.md`／`MIGRATION.md`；`docs/features/README.md`、`docs/prompts/**`；前端代码与测试、共享模板代码；参考页 `/config/data-source`；`CLAUDE.md`、`agent-env.sh`、`.claude/**` 与 `.claude/settings.local.json`。

## 3. 定义行与状态保护

- 本 R2 **不**新增／删除／复用任何编号，四族编号总数保持 `CCFG-REQ-001~154`（154 条）、`CCFG-AC-001~157`（157 条）、`CCFG-DESIGN-001~089`（89 条）、`CCFG-UI-001~077`（77 条），连续、唯一。
- 逐 ID 比对基准 `938e720`：**除 `CCFG-AC-010` 的追注外，四族既有定义行逐字节不变**。`CCFG-AC-010` 的改写**只限**「本条阻塞理由的归属」这一段追注文字，其**定义、前置、操作、预期原文与历史时序追注保留**。
- `CCFG-AC-010` **状态格保持 `BLOCKED`**，**不**翻为 `PASS`；`CCFG-AC-155` 业务定义**不改**。
- 覆盖核验**保持** `154/154` 与 `157/157`。

## 4. 分层状态（R2 纠错时点）

```text
r1_draft_remote_review_verdict=CHANGES_REQUIRED
adjustment7_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment7_approval_status=NOT_APPROVED
adjustment7_implementation_status=NOT_STARTED
adjustment7_formal_acceptance_execution_status=NOT_RUN
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
```

- 本 R2 只修两处，**不**改变 `adjustment7_*` 四项状态、**不**把草案改为已批准、**不**启动实现、**不**执行验收。
- **R1 的 `CHANGES_REQUIRED` ≠ R2 已获批**：R2 结果提交仍须由 ChatGPT **从远程 Git** 做独立**文档**复审。

## 5. R2-01：`CCFG-AC-010` 的旧错误归因与新说明

**R1（错误，本轮覆盖）**：R1 追注以「承接本条现行口径的 `CCFG-AC-155` 属新增且 `NOT_RUN`」与「前置『含 6～7 个数据源』中『恰好 6 源』样本不可构造（与 `CCFG-AC-098` 同源）」作为本条继续 `BLOCKED` 的证据缺口。

**R2（现行）**：**删除**上述两项归因——二者均不成立：

| R1 错误归因 | R2 覆盖理由 |
|---|---|
| `CCFG-AC-155` 新增且 `NOT_RUN` ⇒ 本条依据缺口 | `CCFG-AC-155` 是**独立的行高对照用例**，其 `NOT_RUN` **不能**证明本条自身某一步未执行 |
| 前置「含 6～7 个数据源」中的「恰好 6 源」不可构造（与 `CCFG-AC-098` 同源） | 本条**前置**为「存在含 **6～7** 个数据源的探针」，已记录的 **7 源样本已满足该区间前置**；「**恰好 6 源**」与「**≥7 源**」两组要求属 `CCFG-AC-098` **独有**、**不得**移植到本条 |

**本条自身已执行步骤（据 R5 原证据与只读补测，如实列明）**：

| # | 证据键 | 结论 |
|---|---|---|
| ① | 1440×900 `accG#010` | 单行、行高一致、单元格无溢出（`overflowProp=hidden`）、`max6Rule`／`plusAccurate`、`td` 纵向内边距 `12px/12px` |
| ② | 7 源样本 `accG#098`（`total=7`／`direct=1`／`plus=+6`）+ 只读补测 `CCFG-AC-R1-ON` | 在 **1920×1080／1440×900／1280×800／1100×900／900×800 五个宽度**下的直接展示数量与 `+N` **跨宽度对比**、行高恒 `53px`、无容器溢出、`+N` 与标签均不越界——**宽度变化腿已有真实跨宽度只读观察，不得再写成缺口** |
| ③ | 1024×900 `accH#093` | 全行单行、行高一致、无页面级横向溢出；该记录**属 `CCFG-AC-093`**，未绑定本条 6～7 源样本，**不**计为本条自身证据 |

**现行状态说明**：本条**暂保持 `BLOCKED`**，该状态为**既有验收执行记录的状态**，**尚待独立按现行有效定义（与参考页常规行一致、不含固定像素）与既有证据作正式逐步骤重新判定**。本 R2 **不**重新执行正式验收、**不**变更状态格、**不**虚构当前缺失步骤，亦**不**仅凭文档修订把状态翻为 `PASS`；若独立复核确有本条自身未覆盖的步骤，应由**未来任务**指出该**步骤及证据键**后再行判定。该条定义、前置、操作与预期**均不含**项目负责人目测项。

- **本 R2 覆盖的正是 R1 相关笼统结论**（将 `CCFG-AC-155` `NOT_RUN` 与 `CCFG-AC-098` 独有样本要求笼统归为本条缺口）；`CCFG-REQ-013`／`CCFG-REQ-153`／`CCFG-AC-155` 业务定义不改，历史报告不回写。

## 6. R2-02：模板拟议断言 #11 的根类处理（准确表达式）

`SHARED_COMPONENT_DESIGN.md` §12.7 拟议 #11 原判定示例 `new Set(css().match(/\.lt-[\w-]+/g))` **本身会命中根类** `.lt-main-table`，与「辅助类恰好两个」不符。R2 收敛为**可直接实现、可复审**的完整口径——**先剔除根类**再断言辅助类集合（或将根类计入**三元素**允许集合）：

```ts
const allClasses = [...new Set(css().match(/\.lt-[\w-]+/g) ?? [])]
const helperClasses = allClasses.filter((name) => name !== '.lt-main-table').sort()
expect(helperClasses).toEqual(['.lt-row-action__cell', '.lt-row-action__ellipsis'])
```

等价写法（含根类的三元素允许集合）：

```ts
expect(allClasses.sort()).toEqual(['.lt-main-table', '.lt-row-action__cell', '.lt-row-action__ellipsis'])
```

- 维持**拟批准后且独立实现时** helper 数 `0 → 2`、**现行仍 `0`**；`lt_token_count` **保持 `9`**，§7.1 断言 #2／#3 与 #6 的 R1 结论**不变**。
- 本 R2 **只修拟议文档文本**，**不**修改 `frontend/src/styles/list-table/list-table-visual.spec.ts` 的**现行**测试代码或已批准断言（现行 #11 仍为 `expect(classes).toEqual([ROOT_CLASS_SELECTOR])`，未动）。
- 该扩展**仍候选、未获批、未实现**；`page_migration_status=NOT_STARTED`／`page_migration_authorization_status=NOT_GRANTED`／`pilot_page_selection_status=NOT_DECIDED` **不变**。

## 7. 三通道标记计数

| 通道 | 口径 | R2 后实测 | 与 R1 比较 |
|---|---|---|---|
| 通道 1 | 四份规范文档（`README`／`DESIGN`／`UI`／`MIGRATION`） | `LIST_TABLE_REFERENCE_FACT=26` / 草案态规则标记 `0` / `LIST_TABLE_TEMPLATE_APPROVED=42` / `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED=7` | **不变** |
| 通道 2 | `SHARED_COMPONENT_DESIGN.md` 批准态设计标记 | `79` | **不变** |
| 通道 3 | `SHARED_COMPONENT_DESIGN.md` 候选未实现标记（独立统计） | `23`（§12 节内 `20` 处，其它说明 `3` 处） | **不变**（R2 未新增／删除任何候选标记实例） |

- R0 时点值「§12 内 `15`／含 §0.1 为 `16`／文件总计 `18`」与 R1 时点值 `23` **保留为时点证据**，本节按 R2 后实际内容**重新核算**、不硬编码旧值。

## 8. 验收状态

| 指标 | 变更前（R1 后） | 变更后（R2） |
|---|---|---|
| `PASS` | 69 | 69 |
| `FAIL` | 0 | 0 |
| `BLOCKED` | 70 | 70 |
| `NOT_RUN` | 18 | 18 |
| 合计 | 157 | **157** |

- 本 R2 **不新增用例**；`CCFG-AC-001~157` 的执行状态格**零变化**（`CCFG-AC-010` 仅就地改写**理由归属**文字，状态格仍 `BLOCKED`）。
- 汇总经 `ACCEPTANCE.md` §4 逐行机读核验：`PASS` **69** / `FAIL` **0** / `BLOCKED` **70** / `NOT_RUN` **18** = **157**。
- **本 R2 不对 `CCFG-AC-010` 作任何新的验收判定**；`formal_acceptance_execution_status` 仍为 `NOT_RUN`，**项目负责人尚未作出整体验收接受决定**。

## 9. 风险

- **`CCFG-AC-010` 待独立重判**：本条现行状态属既有验收执行记录，需由**未来独立任务**按现行有效定义与既有证据作正式逐步骤重新判定；本 R2 **不**预设结论。
- **未实测**：R1 冻结的 ≤1 CSS px 容差与具体测量值仍须由后续实现任务在真实浏览器实测判定。
- **契约修订面**：公共 opt-in 扩展若落地，仍须同步修订 §7.1 断言 #2/#3/#6/#11 与 §4.3／§4.4 计数，**须经独立评审**；R2 只修**拟**文本。
- **范围面**：本轮**不**触碰数据源管理参考页，**不**改任何代码／共享 CSS。

## 10. 未修改文件与未执行项

- **未修改**：见 §2 末尾“未修改”清单。
- **未执行**：浏览器实测／截图、前端构建（`npm run build`／`type-check`／`lint`／`test`）、后端构建（`mvn test`／`package`）、服务启动／停止、数据库（含 SQL*Plus 与任何写操作）、ZooKeeper／Kafka 访问、正式验收、代码或共享 CSS 修改、任何页面动作。
- 数据库写操作：`NOT_REQUESTED`；ZooKeeper 写操作：`NOT_REQUESTED`。

## 11. 静态检查结果

```text
git diff --check                = 通过（无空白错误）
定义行计数                      = REQ 154 / AC 157 / DESIGN 089 / UI 077（连续、唯一、无新增/删除/复用）
除 AC-010 追注外既有定义行      = 相对 938e720 逐字节不变
覆盖核验                        = 154/154 与 157/157
验收四态（ACCEPTANCE §4 机读）  = PASS 69 / FAIL 0 / BLOCKED 70 / NOT_RUN 18 = 157
模板四份规范文档标记计数        = 26 / 0 / 42 / 7（不变）
SHARED 批准态设计标记计数       = 79（不变）
SHARED 候选未实现标记（通道3）  = 23（§12 节内 20，其它说明 3；R1 时点 23 保留）
格式与白名单                    = 仅本次 4 个已跟踪文档 + 本报告；未跟踪内容保持原位
```

## 12. 下一入口

```text
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_BASELINE_R2_REVIEW
```

由 ChatGPT **从远程 Git** 对本 R2 结果做独立**文档**复审。**该复审不是代码实现入口**，也**不**代表页面已目测、已实现或已正式验收。

---

## 边界声明（必须显式）

- 本任务**只做纯文档 R2 定向纠错**：**未**修改前端代码／测试或共享 CSS、**未**实施页面调整、**未**运行浏览器实测／测试／构建、**未**执行正式验收、**未**修改数据源管理参考页。
- **「R2 文档已推送」不等于**已批准、已实现、项目负责人已目测通过或已正式验收通过；**项目负责人对最终草案的批准与代码实现均尚未发生**。
- 本 R2 **不**宣布整体 `PASS`、**不**宣布正式接受、**不**授权创建通用模板、**不**授权任何页面迁移。
- `CCFG-AC-010` 状态格**保持 `BLOCKED`** 且**未作新的验收判定**，其现行状态属既有验收执行记录、尚待独立重新判定；历史原文、时序追注与历史证据**保留可追溯、不回写**。
- 已批准公共模板旧断言与计数在草案获批与实现前**仍是现行事实**；§12 拟修订契约**仍候选、未获批、未实现**。
- 模板级 `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED` **均不变**。
