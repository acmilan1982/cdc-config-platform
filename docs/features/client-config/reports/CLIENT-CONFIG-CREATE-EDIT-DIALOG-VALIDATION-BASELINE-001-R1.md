# 探针端管理新增／编辑弹窗校验与交互调整 · 第四轮基线 R1 定向纠错执行报告

> 任务代码：`CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001-R1`
> 任务类型：纯文档（仅纠正第四轮草案的三处文档一致性问题；**不修改页面代码、不进行实现、不做正式验收、不运行测试／构建／浏览器／服务操作、不访问数据库、ZooKeeper 或 Kafka**）
> 分支：`develop`
> 起始提交：`51be9aa66f0555da331b20b2ae5d4cc2f370f880`
> 上一时点远程复审：ChatGPT 已从远程 Git 对本轮草案提交 `51be9aa66f0555da331b20b2ae5d4cc2f370f880` 复审，结论 **`CHANGES_REQUIRED`**（三项文档一致性问题）
> 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_R1_REVIEW`
> 本任务不改写既有批准与实现事实，不推定项目负责人批准；第四轮仍为 `DRAFT_PENDING_USER_REVIEW` / `NOT_APPROVED` / `NOT_STARTED` / `NOT_RUN`。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=51be9aa66f0555da331b20b2ae5d4cc2f370f880
actual_base_commit=51be9aa66f0555da331b20b2ae5d4cc2f370f880
origin_develop=51be9aa66f0555da331b20b2ae5d4cc2f370f880
ahead_behind(origin/develop...HEAD)=0/0
r0_remote_review_result=CHANGES_REQUIRED
adjustment4_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment4_approval_status=NOT_APPROVED
adjustment4_implementation_status=NOT_STARTED
adjustment4_formal_acceptance_execution_status=NOT_RUN
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`51be9aa`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发任务提示词中的停线条件。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存、未提交**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`。
- R0 报告 `reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001.md` **未被回写**（`git status` 无其条目，`git diff` 无其差异，见 §7）。

## 2. 三处纠错的旧／新精确位置

### 2.1 R1-01：按钮旧规则与第四轮新规则冲突

| 文档 | 定义行 | 旧（`51be9aa`） | 新（本次） | 承接条目 |
|---|---|---|---|---|
| `REQUIREMENTS.md` §7.12 | `CCFG-REQ-120` | 仅“禁用态不得呈现为可点的黑色实心”，无与 `CCFG-REQ-124` 的关系说明 | 原文保留，就地追加 `**【本轮（第四轮）定向修订 · 待批准】**`：禁用态适用范围**收窄**，因“表单未完成／校验未通过（含未选数据源）而预先禁用”的场景**由 `CCFG-REQ-124` 取代**；现行口径仅为“提交请求处理中暂不可重复提交 + 清楚加载反馈 + 正常态配色不得覆盖加载态”；“仅此主按钮改色”与文案边界不变 | `CCFG-REQ-124`、`CCFG-DESIGN-062`、`CCFG-UI-051` |
| `REQUIREMENTS.md` §7.13 | `CCFG-REQ-124` | “按钮必须**始终呈现**…黑色可点击样式” | 最小措辞同步为“在**非提交处理中**的常态下必须**始终呈现**…（‘始终’仅指该常态、**不**包含提交请求处理中的防重复态）” | 同上 |
| `ACCEPTANCE.md` §4 | `CCFG-AC-115` | 步骤直接要求“构造禁用态（校验未通过或 submitting）”，期望“禁用按钮不得呈现为可点击的黑色” | 原文保留，就地追加 `**【本轮（第四轮）定向修订 · 待批准】**`：其“**校验未通过预先禁用**”场景**由 `CCFG-AC-120` 取代**，并给出**现行可执行验收步骤**（打开弹窗读正常态配色 → 表单不完整时确认按钮可点击且呈黑色、点击一次确认出现字段级错误 → 开始保存后**在请求处理中**再点击确认不重复提交并确认加载态无蓝黑跳色）；现行口径仅为 submitting 态 | `CCFG-AC-120` |
| `ACCEPTANCE.md` §4 | `CCFG-AC-120` | “**始终**呈现…黑色可点击样式” | 最小措辞同步为“在**非提交处理中**的常态下**始终**呈现…”并追加 `**与 `CCFG-AC-115` 的并存关系**` 说明——被取代的仅为“校验未通过／表单不完整而预先禁用”，其“提交请求处理中暂不可重复提交”口径**与本条一致、两条同时成立、无冲突** | 同上 |
| `DESIGN.md` §15 | `CCFG-DESIGN-059` | 已有本轮 `**【本轮（第四轮）定向修订 · 待批准】**` 标注（禁用表达式由 `CCFG-DESIGN-062` 修订） | 原文与已有标注保留，就地追加 `**【R1 定向核对（2026-09-24）· 待复审】**`：与 `CCFG-REQ-120`／`CCFG-AC-115`／`CCFG-UI-047`／`CCFG-DESIGN-062` 状态矩阵**精确一致、无冲突** | 同上 |
| `DESIGN.md` §16 | `CCFG-DESIGN-062` | “新增的‘创建’与编辑的‘保存’**始终呈现**…” | 最小同步为“在**非提交处理中**的常态下**始终呈现**…”并追加 `**【R1 定向修订（2026-09-24）· 待复审】**`：两种状态**同时成立、无冲突**（① 表单未完成／校验未通过 → 可点且黑色；② 提交请求处理中 → 暂不可重复提交、加载反馈清楚可辨、不蓝黑跳色） | 同上 |
| `UI.md` §17 | `CCFG-UI-047` | 无与 `CCFG-UI-051` 的关系标注 | 原文保留，就地追加 `**【本轮（第四轮）定向修订 · 待批准】**`：禁用态适用范围收窄，“因表单未完成／校验未通过（含未选数据源）而预先禁用”**由 `CCFG-UI-051` 取代**；现行口径仅为提交请求处理中暂不可重复提交 + 清楚加载反馈 + 不蓝黑跳色；“仅此主按钮改色”“文案保持‘创建’／‘保存’”与原 `:not(.is-disabled)` 原文保留不改写 | `CCFG-UI-051` |
| `UI.md` §18 | `CCFG-UI-051` | “**始终呈现**…黑色可点击样式” | 最小同步为“在**非提交处理中**的常态下**始终呈现**…”并追加 `**【R1 定向修订（2026-09-24）· 待复审】**` 并存关系说明 | 同上 |

**保留原文原则**：以上各行均**就地追加**标注，未删除、未覆盖、未重写原句，**不**声称原规则从未存在。

### 2.2 R1-02：`CCFG-AC-131` 的不可能验收输入

- **旧（`51be9aa`）**：`CCFG-AC-131` 步骤②“保存 256 个字符但按 UTF-8 字节数**接近或超过** 1024（如含较多 4 字节字符）”。
- **不可能性**：一个有效 Unicode 码点的 UTF-8 编码**最多 4 字节**，故 256 个字符的 UTF-8 字节数**最多恰好 1024，不能超过 1024**；“超过”分支无法构造。
- **新（本次）**：仅改写该条步骤与期望为**三类互不重叠**边界——
  1. 界面提交 **256 个汉字**（常见 UTF-8 为 **768 字节**）→ 允许保存、原文一致；
  2. 界面提交**恰好 256 个四字节 Unicode 码点** → **恰好 1024 字节**，上限可接受（**不得**把“恰好等于 1024 字节”写成“超过 1024 字节”）；
  3. 前端输入／粘贴第 **257** 个字符被限制；**绕过前端直接调用后端**提交按 UTF-8 计算 **> 1024 字节**的描述 → 后端仍拒绝；
  4. 保持 **Trim 仅用于判空**、最终描述**原文保存**、数据库与 API 的 `VARCHAR2(1024 BYTE)` 契约**不变**。
- 前置条件列补充：步骤③需“可绕过前端直连后端的调用能力（真实 REST 或等价后端调用）”，**若本轮不具备则该步骤属未来验收前提**（**本 R1 文档任务不执行该步骤**）。
- 追加 `**【R1 定向修订（2026-09-24）· 待复审】**` 说明不可能分支、三类边界互不重叠、验收仍为 `NOT_RUN`。
- **同类措辞审查结论**：本轮范围内**仅** `CCFG-AC-131` 存在该错误；`CCFG-DESIGN-070` 已正确表述“256 个字符按 Unicode 完整字符计数、必然 ≤1024 字节、库表／API／服务端上限不改为 256 字节”，`CCFG-UI-059` **无**该错误（其 1024 仅指原文含首尾空白 `<=1024 BYTE` 的 `TextEncoder` 预校验与后端防线），R0 报告中的 1024 均指**截断前的完整生成结果字节检查**，**无误**；`CCFG-AC-033`／`CCFG-AC-048` 为既有用例且表述正确。故本项**不**修改任何设计／界面定义行，未引入“256 汉字＝256 字节”的新误解。

### 2.3 R1-03：后续模板规则的追踪映射不实

| 位置 | 旧（`51be9aa`） | 新（本次） |
|---|---|---|
| `DESIGN.md` §12.1 | `\| CCFG-REQ-136 \| CCFG-DESIGN-071、CCFG-UI-059 \|` | `\| CCFG-REQ-136 \| CCFG-DESIGN-071 \|` |
| `DESIGN.md` §12.2 | `\| CCFG-AC-135 \| CCFG-DESIGN-071、CCFG-UI-059 \|` | `\| CCFG-AC-135 \| CCFG-DESIGN-071 \|` |
| `UI.md` §18 `CCFG-UI-059` 定义行 | 覆盖需求含 `CCFG-REQ-136`、覆盖验收含 `CCFG-AC-135` | 覆盖需求保留 `CCFG-REQ-132、CCFG-REQ-133、CCFG-REQ-134`；覆盖验收保留 `CCFG-AC-130、CCFG-AC-131、CCFG-AC-132、CCFG-AC-133`（定义**正文规则零变化**） |

- `CCFG-REQ-136`／`CCFG-AC-135` 仅**登记**“未来另开独立任务提炼新增／编辑表单弹窗模板”，属**文档治理／范围声明**，本轮**无新增 UI 元素**；其真实承载为 `CCFG-DESIGN-071` 与需求／验收文档。
- `DESIGN.md` §12 与 `UI.md` §18 均在**非定义说明**中新增 R1 说明：该入口属文档治理／范围声明、本轮无新增 UI 元素、此“无 UI 映射”**不是缺项**，**不**以描述长度 UI 规则凑数、**不**提前创建模板。
- 除 `CCFG-REQ-136`／`CCFG-AC-135` 外，其余项的需求→验收／设计／UI 覆盖**逐项核对为真实**（`CCFG-REQ-135`／`CCFG-AC-134` 本就仅由 `CCFG-DESIGN-071` 承载，属预期而非缺项）。

## 3. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/REQUIREMENTS.md` | 修改 | `CCFG-REQ-120` 追加目标标注、`CCFG-REQ-124` 最小措辞同步、§7.13 前言 3→4 条、§8 编号计数 3→4 条 + R1 说明 + 逐字节边界、§10 R1 变更记录、metadata（实现状态、任务编号） |
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | `CCFG-AC-115` 目标标注 + 现行可执行步骤、`CCFG-AC-120` 最小措辞同步 + 并存关系、`CCFG-AC-131` 步骤重写 + 前置条件 + R1 说明、§1.8 R1 说明、§6 R1 变更记录、metadata（实现状态、验收用例状态、任务编号） |
| `docs/features/client-config/DESIGN.md` | 修改 | `CCFG-DESIGN-059` R1 核对标注、`CCFG-DESIGN-062` 最小措辞同步 + R1 说明、§12.1／§12.2 移除 `CCFG-REQ-136`／`CCFG-AC-135` 的 `CCFG-UI-059` 映射 + §12 R1 说明、§11 R1 结论、§16 前言 R1 说明与后续入口说明、§17 R1 变更记录、metadata（实现状态） |
| `docs/features/client-config/UI.md` | 修改 | `CCFG-UI-047` 目标标注、`CCFG-UI-051` 最小措辞同步 + R1 说明、`CCFG-UI-059` 移除无依据映射单元格、§14 R1 说明、§18 R1 说明、§19 R1 变更记录、metadata（第四轮分层） |
| `docs/features/client-config/README.md` | 修改 | §1 metadata（第四轮任务编号新增 R1、第四轮基线状态补复审结论）、§1.9 分层状态块 `next_entry` 与 R1 条目、§1.9 下一入口、§2 导航同步（README／REQUIREMENTS／ACCEPTANCE／DESIGN／UI 五格）、§4 前一条目降为历史 + 新增当前下一入口、§5（见下） |
| `docs/features/client-config/reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001-R1.md` | 新增 | 本报告 |

**未修改**：`docs/features/client-config/API.md`、`DATABASE.md`、`reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001.md`（R0 报告，**未回写**）、其余历史报告、`docs/baseline/**`（含两套模板 README／SHARED_COMPONENT_DESIGN／MIGRATION）、`docs/features/README.md`、`docs/prompts/**`、参考页 `frontend/src/views/data-source/DataSourcePage.vue`、前后端代码与测试、`CLAUDE.md`、`agent-env.sh`、` .claude/settings.local.json`（任务前既有改动，未暂存）、数据库对象与构建依赖。

## 4. 实际被修改的定义行清单

按**实际定义行**（行首 `| CCFG-*-NNN |`）逐文档核对：

| 文档 | 被修改的定义行 | 条数 |
|---|---|---|
| `REQUIREMENTS.md` | `CCFG-REQ-120`（追加目标标注）、`CCFG-REQ-124`（最小措辞同步） | 2 |
| `ACCEPTANCE.md` | `CCFG-AC-115`、`CCFG-AC-120`、`CCFG-AC-131` | 3 |
| `DESIGN.md` | `CCFG-DESIGN-059`、`CCFG-DESIGN-062` | 2 |
| `UI.md` | `CCFG-UI-047`、`CCFG-UI-051`、`CCFG-UI-059`（**仅**尾部映射单元格，正文规则零变化） | 3 |

另有 `DESIGN.md` §12 的 **2 行追踪矩阵行**（`CCFG-REQ-136` 行、`CCFG-AC-135` 行）被修改——它们**不是**设计定义行，属映射表行。

## 5. 与 `51be9aa` 的逐行对比

核验方法：分别从 `git show 51be9aa:<file>` 与工作区提取所有定义行，按行首编号比对。

| 检查 | 结果 |
|---|---|
| 定义行**编号集合**是否变化 | **四份文档均完全一致**（无新增、无删除、无重排、无重号） |
| 定义行**内容**变化 | 仅 §4 所列 10 行（REQ 2 / AC 3 / DESIGN 2 / UI 3） |
| 其余定义行 | 相对 `51be9aa` **逐字节零变化** |
| `DESIGN.md` §12 矩阵行 | 仅 `CCFG-REQ-136`／`CCFG-AC-135` 两行；其余矩阵行未变 |
| `CCFG-AC-001~117`（既有 117 条验收） | **逐字节零变化**（R1 **未**修改任何既有验收定义行） |
| `CCFG-REQ-001~122`（既有 122 条需求） | **逐字节零变化** |
| `CCFG-DESIGN-001~060`（既有 60 条设计） | **逐字节零变化**（含 R0 已定向标注的 `CCFG-DESIGN-059` 原有标注不回退，仅追加 R1 核对句） |
| `CCFG-UI-001~049`（既有 49 条界面） | **逐字节零变化** |

## 6. 连续编号与计数（全部取自实际定义行）

| 文档 | 编号系列 | 起始提交 `51be9aa` | 本次结果 | 连续性 |
|---|---|---|---|---|
| `REQUIREMENTS.md` | `CCFG-REQ` | max=`136`，distinct=**136** | max=`136`，distinct=**136** | `001~136` 连续唯一 |
| `ACCEPTANCE.md` | `CCFG-AC` | max=`135`，distinct=**135** | max=`135`，distinct=**135** | `001~135` 连续唯一 |
| `DESIGN.md` | `CCFG-DESIGN` | max=`071`，distinct=**71** | max=`071`，distinct=**71** | `001~071` 连续唯一 |
| `UI.md` | `CCFG-UI` | max=`059`，distinct=**59** | max=`059`，distinct=**59** | `001~059` 连续唯一 |

- 覆盖关系：需求→设计→UI→验收 **136/136**，需求→验收 **136/136**（`DESIGN.md` §12.1／§12.2 与 `ACCEPTANCE.md` §5 一致）。
- `PENDING_USER_CONFIRMATION=0`；两套模板的模板级全局状态（`NOT_STARTED`／`NOT_GRANTED`／`NOT_DECIDED`）未变。
- **验收执行状态**：`CCFG-AC-001~135` 共 **135 条全部 `NOT_RUN`**（脚本核验：`NOT_RUN` 行数 = 135 = 定义行总数，非 `NOT_RUN` 行数 = 0）。本轮**未**把任何用例标记为已执行或通过。

## 7. 任务要求的专项证明

1. **除明列定向行外无意外修改**：定义行编号集合四文档均与 `51be9aa` 完全一致；内容变化仅 §4 所列 10 行 + `DESIGN.md` §12 的两行矩阵行（§5 已逐文档列出）。
2. **R0 报告未回写**：`git diff --stat -- reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001.md` 无输出，`git status --short -- reports/` 仅显示本次**新增**的 R1 报告；R0 报告全文未改一字。
3. **`CCFG-AC-115` 与 `CCFG-AC-120` 现行期望可同时成立**：`CCFG-AC-115` 现行口径被限定为“**提交请求处理中**暂不可重复提交 + 清楚加载反馈 + 不蓝黑跳色”（其“校验未通过预先禁用”场景显式标注由 `CCFG-AC-120` 取代）；`CCFG-AC-120` 明确“**表单未完成仍可点击**且点击后显示字段级错误”，并追加并存关系说明“被取代的仅为预先禁用场景，其提交中防重复口径与本条一致”。两条**无相互矛盾的通过标准**，后续 Agent 可同时执行。
4. **`CCFG-AC-131` 三类边界无越界构造**：256 汉字 = 768 字节（`< 1024`）、恰好 256 个四字节码点 = 恰好 1024 字节（`= 1024`）、绕过前端提交 `> 1024` 字节（`> 1024`）——三者互不重叠、均可构造，**不存在**“256 字符超过 1024 字节”这一不可构造分支。
5. **`CCFG-REQ-136` 不再映射到 `CCFG-UI-059`**：`DESIGN.md` §12.1 `CCFG-REQ-136` 行与 §12.2 `CCFG-AC-135` 行已移除 `CCFG-UI-059`；`UI.md` `CCFG-UI-059` 定义行的覆盖需求／验收单元格已移除 `CCFG-REQ-136`／`CCFG-AC-135`；两处均在非定义说明中登记“该入口属文档治理／范围声明、本轮无新增 UI 元素、不是缺项”。

## 8. 未执行项

- 未修改页面代码、未进入实现；未修改任何后端代码、测试、配置、数据库对象或 DDL。
- 未运行测试、Vitest、Maven 测试；未运行前后端构建、类型检查、lint。
- 未启动或停止任何服务；未做浏览器核对。
- 未执行正式验收（`NOT_RUN`）；未访问数据库、ZooKeeper、Kafka。
- 未提前创建或批准“新增／编辑表单弹窗模板”，未声称其他页面已接入。
- 未回写 R0 报告、未修改任何历史报告、未修改 `docs/baseline/**` 与两套模板全局状态、未修改参考页。

## 9. 静态检查结果

| 检查项 | 命令／方法 | 结果 |
|---|---|---|
| 分支与提交 | `git branch --show-current`、`git rev-parse HEAD`、`git ls-remote origin refs/heads/develop` | `develop`；三者均为 `51be9aa`，`0/0` |
| 空白／冲突标记 | `git diff --check` | 干净（退出码 0） |
| 定义行编号一致性 | 与 `git show 51be9aa:<file>` 逐文档比对行首编号 | 四份文档编号集合完全一致 |
| 定义行内容变化 | 同上逐行 diff | 仅 §4 的 10 行 + `DESIGN.md` §12 的两行矩阵行 |
| 定义编号连续性 | 逐文档提取 `CCFG-REQ/AC/DESIGN/UI` 编号 | `136`／`135`／`71`／`59`，连续唯一、无重号 |
| 验收状态 | 逐行核验 `NOT_RUN` | 135/135 为 `NOT_RUN`，非 `NOT_RUN` 为 0 |
| 映射纠正 | 检索 `CCFG-UI-059` 定义行与 §12.1／§12.2 | 已无 `CCFG-REQ-136`／`CCFG-AC-135` |
| 状态口径 | 全文检索 `adjustment4_*`、`NOT_RUN`、批准／实现措辞 | 统一为 `DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`／`NOT_STARTED`／`NOT_RUN`，未混用“已批准／已实现／已验收” |
| 当前入口唯一性 | 检索 `**当前下一入口（` | `README.md` 中仅 1 处，指向 R1 复审入口 |

## 10. 下一入口

- `next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_R1_REVIEW`
- 复审对象：本 R1 结果提交（从远程 Git 读取）；复审要点为 §2 三处纠错的旧／新位置、§4 定义行清单、§5 逐行对比与 §7 专项证明。
- 复审通过并经项目负责人批准后，**另开独立任务**进入本轮代码实现；本轮**不**提前实现、**不**声称模板已建立或获批准。
- 原历史入口 `CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_REVIEW` 保留历史标签（已完成、结论 `CHANGES_REQUIRED`）。
- `blocker`：无（任务范围内无阻塞；本轮停在本复审入口等待基线复审与项目负责人批准）。
