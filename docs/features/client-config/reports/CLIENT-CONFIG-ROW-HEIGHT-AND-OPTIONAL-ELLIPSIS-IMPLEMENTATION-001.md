# 探针端管理主列表行高与三点入口可选样式实现报告

- 任务编号：`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001`
- 任务类型：前端实现（非纯文档；改公共列表表格视觉层与 `/config/client` 页面代码及测试，并同步五份 Feature 文档与公共模板现行状态、新建本报告）
- 分支：`develop`
- 起始提交（base）：`a042df08f1b29ba580ccd9b17f081352a089a995`（第七轮基线批准收口提交）
- 依据：`docs/prompts/client-config/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-Agent-Prompt.md`
- 实现对象：第七轮已批准基线（**R2 修订后口径**）`CCFG-REQ-153~154`／`CCFG-AC-155~157`／`CCFG-DESIGN-088~089`／`CCFG-UI-076~077`，及 `list-table-visual-template` §12 已批准的「行内三点入口 opt-in」扩展设计
- 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_IMPLEMENTATION_REVIEW`
- 边界声明：本任务**只**按已批准基线实现公共层显式 opt-in 三点入口与 `/config/client` 主列表行高协同；**不**执行正式验收、**不**做项目负责人页面目测、**不**修改 `/config/data-source` 参考页、**不**创建共享新增／编辑弹窗模板、**不**修改任何定义行。

---

## 1. 授权与批准依据

```text
task_code=CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001
approval_object_adjustment=第七轮（/config/client 主列表内容驱动行高与行内三点入口公共 opt-in 外观/可访问性）
approved_reviewed_commit=59617b4cee03fe1642417cb85005b339ab0015ab   # R2 提交，ChatGPT 远程基线文档复审 APPROVED
approval_closeout_commit=a042df08f1b29ba580ccd9b17f081352a089a995   # 批准收口提交，本任务 base 与其远程复审 APPROVED
project_owner_reply=批准（2026-09-29）
adjustment7_baseline_status=APPROVED
adjustment7_implementation_status_before=NOT_STARTED
adjustment7_implementation_status_after=IMPLEMENTED_PENDING_CHATGPT_REVIEW
adjustment7_formal_acceptance_execution_status=NOT_RUN
```

- 依据 ChatGPT 从远程 Git 对 R2 提交 `59617b4` 的**基线文档复审**结论 `APPROVED` + 项目负责人 2026-09-29 明确回复“批准”，第七轮基线已批准；批准收口提交 `a042df0` 本身亦经 ChatGPT 远程复审 `APPROVED`。
- 本次实现的对象是**已批准基线文档**（R2 定向修订口径）所指的公共 opt-in 外观／可访问性与页面行高协同，**不**修改批准对象本身；实现完成**不**等于已目测、已验收或已接受。

## 2. 门禁与基线

```text
branch=develop
expected_base_commit=a042df08f1b29ba580ccd9b17f081352a089a995
actual_base_commit=a042df08f1b29ba580ccd9b17f081352a089a995
origin_develop=a042df08f1b29ba580ccd9b17f081352a089a995
remote_refs_heads_develop=a042df08f1b29ba580ccd9b17f081352a089a995
ahead_behind(origin/develop...HEAD)=0/0
definition_rows=REQ 154 / AC 157 / DESIGN 89 / UI 77（开工时核对连续唯一无缺号）
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`a042df0`），ahead/behind `0/0`，无分叉、无冲突。
- 任务开始前已存在的**无关**工作区内容**保持原样、未修改、未暂存、未提交**：` M .claude/settings.local.json`、未跟踪的 `docs/prompts/**` 与 `runtime-logs/**`。
- 未停止项目负责人正在运行的前端／后端服务；浏览器核对复用既有开发服务（`127.0.0.1:5173`），核对完成后只清理本任务启动的无头浏览器进程。

## 3. 允许修改范围与实际变更

实际变更（预期范围内）：

**代码与测试：**
- `frontend/src/styles/list-table/list-table-visual.css`（+32 行）：新增公共层两条显式 opt-in 规则。
- `frontend/src/styles/list-table/list-table-visual.spec.ts`（+24 / -2 行）：静态断言 #11 收敛为「先剔除根类再断言辅助类集合」，新增 #13 未启用页零泄漏扫描。
- `frontend/src/views/client-config/ClientConfigPage.vue`（+22 / -17 行）：操作列 `class-name` 显式 opt-in、触发器挂公共 opt-in 类、原 `.cc-more-link` 公共视觉规则迁出。
- `frontend/src/views/client-config/ClientConfigPage.spec.ts`（+24 / -8 行）：新增 opt-in 挂载与零泄漏用例，调整「更多」入口样式来源断言。

**文档（现行状态、导航、追加执行记录）：**
- `docs/features/client-config/README.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`UI.md`
- `docs/baseline/list-table-visual-template/README.md`、`SHARED_COMPONENT_DESIGN.md`
- 新增本报告与脱敏证据包 `reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/`

未修改：`/config/data-source` 参考页、后端、`API.md`／`DATABASE.md`、两套共享模板的整体状态与页面迁移状态、历史报告、`docs/prompts/**`、`docs/features/README.md`、`.claude/**`、`CLAUDE.md`、`agent-env.sh`。未访问或写入数据库／ZooKeeper／Kafka。

## 4. 关键实现方式

### 4.1 公共层显式 opt-in 规则（`list-table-visual.css`）

- 新增两条**仅受 `.lt-main-table` 根类限定**的规则，命名与挂载位置与 `SHARED_COMPONENT_DESIGN.md` §12 已批准契约一致：
  - `.lt-main-table :deep(td.el-table__cell.lt-row-action__cell)`：只补偿**本单元格**的纵向内边距；
  - `.lt-main-table :deep(.lt-row-action__ellipsis)`（含 `:hover`／`:focus-visible`）：命中区盒模型与交互态。
- **命中区**：`display: inline-flex` + `align-items/justify-content: center` + `box-sizing: border-box` + `width/height: 28px`，圆角 `6px`，`color: var(--el-color-primary)`（实测 `rgb(64, 158, 255)`），`cursor: pointer`；hover 浅底 `#ecf5ff`（实测 `rgb(236, 245, 255)`）。
- **焦点可见**：`:focus-visible` 用 `outline: 2px solid var(--el-color-primary)` + `outline-offset: -2px`（**内嵌**），以规避 Element Plus `.cell{overflow: hidden}` 对外描边的裁切；真实键盘 Tab 与像素级探针见 §5.2。
- **令牌纪律**：视觉值一律为**固定字面量**，**默认不新增** `--lt-*` 令牌，现行令牌数仍为 **9**；内部 helper 类由 `0` 变为 **2**（仅 `{lt-row-action__cell, lt-row-action__ellipsis}`）。
- **零全局覆盖**：不做全局 Element Plus 覆盖、不硬编码页面名、不使用 `!important`（静态断言 #5/#7/#10 仍通过）。
- 公共层**不**承载菜单项、权限、启停／删除、请求、行选中、Popover 定位或异常数据逻辑——这些仍由 Feature 提供。

### 4.2 `/config/client` 主列表接线（`ClientConfigPage.vue`）

- 操作列以 `class-name="lt-row-action__cell"` 显式声明 opt-in 单元格；Element Plus 会把该 `class-name` **同时**渲染到表头 `th`，故公共规则以 `td.el-table__cell` 限定，实测表头 `th` 内边距仍为 `11px`、**不受影响**。
- 三点触发器由 `class="cc-more-link"` 改为 `class="cc-more-link lt-row-action__ellipsis"`：保留 `cc-more-link` 作为**业务选择器钩子**（本页事件隔离与可访问名称 `aria-label` 不变），视觉统一下沉至公共层。
- 原地删除 `.cc-more-link`／`.cc-more-link:hover`／`.cc-more-link:focus-visible` 三条规则（迁出为公共规则），仅保留 `.cc-more-icon { font-size: 18px; }`。
- **弹窗内表格不接入**；`/config/data-source` 保持「更多」文字入口，**只读对照、文件未修改**。

### 4.3 内容驱动行高协同

- 差异**假设**（实现前实测验证）：探针端常规行 `53px`、参考页常规行 `48px`，差值来自 `28px` 三点入口布局盒 + 公共预设 `--lt-body-cell-padding: 12px 0`（上下和 `24px`）。
- 实现前真实浏览器计算样式确认：探针端操作单元格 `.cell` 盒高 `28px`、纵向内边距 `12px 0`；参考页 `.cell` 盒高 `23px`、纵向内边距 `12px 0`。
- 结论：`53 = 1(行底边框) + 28(入口盒) + 24`，参考页 `48 = 1 + 23 + 24`。故**只**对显式 opt-in 的操作单元格做**纵向内边距补偿** `padding: 9.5px 0`，使 `48 = 1 + 28 + 19` 与参考页一致。
- **未**写死 `tr` 高度（不声明固定 `height`／`max-height`／`line-height`）；**未**缩小命中区到 `23px`；**未**使用 `margin-top`／`transform`／`translate`／`top` 等位移手段；补偿**只**作用于 opt-in 操作单元格，未启用页面／表格不受影响。
- 表头 `th` 与其余单元格内边距**未**被该规则触及（选择器限定 `td.el-table__cell.lt-row-action__cell`）。

### 4.4 已批准行为完整保留（不改行为）

- **完整保留**既有主列表交互：行双击编辑、行内交互控件事件隔离、每页面会话至多一行固定选中与再次点击取消、点击他行转移、普通重载发起时清选、启用／停用成功按可见性重选、以及 `loadList(reselectTarget)` 请求私有重选参数与过期响应隔离。
- **未**改查询／排序语义与 API 契约；**未**恢复复选框／多选／已选行集合；**未**引入持久化状态。

## 5. 测试与构建证据

### 5.1 单元测试与构建

- 定向：`npx vitest run src/styles/list-table/list-table-visual.spec.ts src/views/client-config/ClientConfigPage.spec.ts` —— **2 文件 / 196 用例全部通过**（`list-table-visual.spec.ts` **13/13**、`ClientConfigPage.spec.ts` **183/183**；42.36s，退出码 0）。
- 全量：`npm test` —— **57 文件 / 1164 用例全部通过**（91.50s，退出码 0，无失败、无超时）。
- 构建：`npm run build`（`vue-tsc --noEmit && vite build`）—— **成功**（17.53s，退出码 0；仅有与本任务无关的既有 chunk 体积提示）。
- 测试新增覆盖：公共 helper 类集合口径（先剔除根类）、未启用页零泄漏扫描（`views/**` 中只有 `ClientConfigPage.vue` 含 opt-in 类）、主列表 opt-in 挂载、弹窗与参考页零泄漏、`cc-more-link` 不再就地声明视觉规则。
- **说明（验证边界）**：测试 `PASS` **不**等于正式验收 `PASS`；本机此前偶发**负载抖动型超时**（未修改的最重套件在 5000ms 阈值下超时），本次全量一次性通过。

### 5.2 真实浏览器核对（只读，网络层拦截写请求）

- 环境：本机 **Chromium（Playwright，deviceScaleFactor 1，缩放 100%）**，基址 `http://127.0.0.1:5173`；**打开页面前**在网络层安装拦截：`/api/**` 的 `GET/HEAD/OPTIONS` 放行，`POST/PUT/PATCH/DELETE` 一律 `abort` 并计数。
- **零写证明**：`before`／`after`/焦点探针三次运行实测**非 GET 拦截计数均为 `0`**，`requestsIssuedAreAllGet=true`；未连接数据库／ZooKeeper／Kafka。

**（1）行高逐样本实测（`tr.getBoundingClientRect().height` 原始小数）**

| 视口 | 组 | 可比常规行数 | 实现前 | 实现后 | 逐样本 \|diff vs 参考页 48px\| | 最大值 |
|---|---|---|---|---|---|---|
| 1440×900 | `/config/client` 主列表 | 15 | `53` | `48` | 全部 `0` | `0` |
| 1920×1080 | `/config/client` 主列表 | 15 | — | `48` | 全部 `0` | `0` |

- 每视口取 **15 条**可比常规行（单行不折行、无额外高度内容），含绿标签 `tag-ok`、红标签 `tag-bad`、无标签 `no-tag` 三类；逐条 `|diff| = 0 CSS px`（预置容差 ≤ 1 CSS px），**未**取平均、**未**事后放宽容差。
- **异常／歧义观察组（不强制等高）**：探针端存在一行带行级提示的歧义行（`S15`），实测 `52px`，`ambiguous=true`，**未**计入可比集合、**未**混入差值统计，仅自适应记录。
- **参考页 `/config/data-source` 零变化**：实现前后常规行高均 `48px`；操作单元格纵向内边距均 `12px`、`.cell` 盒高均 `23px`；其「更多」文字入口与单元格计算样式（颜色、光标）**零变化**。

**（2）三点入口可用性与可访问性**

- 命中区实测 `28×28px`、圆角 `6px`、主色 `rgb(64, 158, 255)`、hover `rgb(236, 245, 255)`、光标 `pointer`、行内垂直居中；盒体落在 `.cell` 与 `td` 内（`boxWithinCell=true`／`boxWithinTd=true`）。
- **真实键盘** Tab 经 7 步到达三点入口（`focus.reached=true`），读到 `:focus-visible` 计算样式 `outline: solid 2px rgb(64, 158, 255)`、`outline-offset: -2px`；**像素级探针**（仅截 `28×28` 命中区）确认描边四边中点与四角**均为 `rgb(64,158,255)`**、`ringVisibleOnAllFourSides=true`，外扩 `34×34` 区域**无**描边像素（证明描边内嵌、未被 `.cell{overflow:hidden}` 裁掉）。
- **缩放／窄视口复检**：`1152×720`（≈125% 缩放等效）与 `1024×768`（窄视口）两组各 16 行逐行核对：常规行高均 `48px`、操作单元格纵向内边距均 `9.5px`、入口盒均 `28×28`、`linkBoxInsideRow=true`、`linkOverlapsNextRow=false`（无跨行误触、无相邻遮挡），歧义行仍单列观察。
- **表头不受影响**：`th`（操作列）`hasOptInClass=true` 但内边距仍 `11px`、高度 `46px`，与实现前一致。

**（3）证据产物与脱敏**

- 仓库内（脱敏）证据包：`reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/`，含 `measure-before.mjs`／`measure-after.mjs`／`focus-ring-pixel-probe.mjs`／`row-height-results.json`／`focus-ring-pixels.json`／`SHA256SUMS.txt`。
- 脱敏：探针业务 ID 一律按行序替换为 `S01..Sn`，`el-table_<n>_column_<m>` 归一为 `el-table_N_column_N`；**不**含数据库连接信息、内网主机／端口、账号口令或令牌、真实业务数据、原始截图。
- 仓库外（未入仓）原始结果 JSON 与截图位于执行机器临时目录，其 SHA-256 见 `SHA256SUMS.txt`。
- **边界**：以上为**本机真实无头 Chromium 核对**，**不**等于真实后端集成、**不**等于项目负责人对实际页面的目测，也**不**等于正式验收；未声称外网可访问性。

## 6. 定义行完整性与状态边界

- **定义行完整性**：`CCFG-REQ-001~154`（154）、`CCFG-AC-001~157`（157）、`CCFG-DESIGN-001~089`（89）、`CCFG-UI-001~077`（77）四类定义行相对批准收口提交 `a042df0` **逐字节零变化**（抽取定义表行做集合并比对，四类均 `identical=True`）。
- **验收状态**：157 条验收统计仍为 `PASS` **69** / `FAIL` **0** / `BLOCKED` **70** / `NOT_RUN` **18**，**状态格零变化**；`CCFG-AC-010` **保持 `BLOCKED`**（待按现行有效定义与既有证据独立重新判定）；`CCFG-AC-155~157`（第七轮新增）**保持 `NOT_RUN`**。本次**未**执行正式验收，`NOT_RUN` **未**因单元测试或无头浏览器核对而翻转。
- **状态分层**：`adjustment7_baseline_status=APPROVED` 与三条批准元数据不变；`adjustment7_implementation_status` 由 `NOT_STARTED` 变为 **`IMPLEMENTED_PENDING_CHATGPT_REVIEW`**；`adjustment7_formal_acceptance_execution_status=NOT_RUN`。
- **模板侧**：`SHARED_COMPONENT_DESIGN.md` §12 由 `DESIGN_BASELINE_APPROVED_IMPLEMENTATION_NOT_STARTED` 更新为 **`DESIGN_BASELINE_APPROVED_IMPLEMENTATION_IMPLEMENTED_PENDING_CHATGPT_REVIEW`**（`list_table_row_action_opt_in_extension_implemented=NO → YES`）；模板整体 `shared_implementation_status`／`reference_page_integration_status` 仍 `IMPLEMENTED_ACCEPTED`、`final_acceptance_status` 仍 `ACCEPTED_BY_PROJECT_OWNER`；`page_migration_status` 仍 `NOT_STARTED`、`page_migration_authorization_status` 仍 `NOT_GRANTED`、`pilot_page_selection_status` 仍 `NOT_DECIDED`，`current_next_entry` **不变**。三条计数通道复测：四份规范文档 `26 / 0 / 42 / 7`、模板批准态设计标记 `79`、候选未实现标记 `23`（**均不变**，本任务未新增／删除标记实例）。
- **范围边界**：**未**修改 `/config/data-source` 参考页、后端、`API.md`／`DATABASE.md`、`docs/baseline/` 六份项目级基线、两套共享模板整体状态与页面迁移状态、历史报告、`docs/prompts/**`、`docs/features/README.md`、`.claude/**`；**未**访问或写入数据库／ZooKeeper／Kafka；**未**创建共享新增／编辑弹窗模板。`git diff --check` 干净。
- **未执行／未验证事项**：正式验收（157 条）、项目负责人页面目测、ChatGPT 远程代码复审。

## 7. 结果与下一步

- 起始提交 `a042df08f1b29ba580ccd9b17f081352a089a995`；本次结果提交见任务结果输出。
- **下一入口**：`CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_IMPLEMENTATION_REVIEW`（由 ChatGPT **从远程 Git** 对本实现结果做独立**代码**复审）。
- **远程代码复审通过仍不等于项目负责人目测或正式验收通过**；项目负责人**后续仍须对实际页面做目测**，正式验收须另行执行。

---

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001
branch=develop
base_commit_id=a042df08f1b29ba580ccd9b17f081352a089a995
result_commit_id=见任务会话提交结果
env_check_status=SUCCESS
backend_build_status=NOT_APPLICABLE
frontend_build_status=SUCCESS
database_write_status=NOT_REQUESTED
zookeeper_write_status=NOT_REQUESTED
push_status=见任务会话推送结果
changed_files=frontend/src/styles/list-table/list-table-visual.css,frontend/src/styles/list-table/list-table-visual.spec.ts,frontend/src/views/client-config/ClientConfigPage.vue,frontend/src/views/client-config/ClientConfigPage.spec.ts,docs/features/client-config/README.md,docs/features/client-config/REQUIREMENTS.md,docs/features/client-config/ACCEPTANCE.md,docs/features/client-config/DESIGN.md,docs/features/client-config/UI.md,docs/baseline/list-table-visual-template/README.md,docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md,docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001.md,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/README.md,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/measure-before.mjs,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/measure-after.mjs,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/focus-ring-pixel-probe.mjs,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/row-height-results.json,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/focus-ring-pixels.json,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/SHA256SUMS.txt
error=
AGENT_TASK_RESULT_END
```
