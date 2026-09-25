# 探针端管理弹窗间距、启停确认文案与列表单行选中调整实现报告

- 任务编号：`CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001`
- 任务类型：前端实现（非纯文档；仅改 `/config/client` 页面代码与测试，并同步五份 Feature 文档现行状态、新建本报告）
- 分支：`develop`
- 起始提交（base）：`c179f712c9de4865dd81d02ee8a6a996083b2f96`（第五轮基线批准收口提交）
- 依据：`docs/prompts/client-config/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001-Agent-Prompt.md`
- 实现对象：第五轮已批准基线 `CCFG-REQ-137~147`／`CCFG-AC-136~146`／`CCFG-DESIGN-072~082`／`CCFG-UI-060~070`
- 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_IMPLEMENTATION_REVIEW`
- 边界声明：本任务**只**按已批准基线实现 `/config/client` 页面级调整；**不**执行正式验收、**不**做项目负责人页面目测、**不**创建或推广通用弹窗模板、**不**修改任何定义行。

---

## 1. 授权与批准依据

```text
task_code=CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001
approval_object_adjustment=第五轮（/config/client 弹窗间距、启停确认文案、列表单行固定选中）文档基线
approved_reviewed_commit=26647a5d4706e5bc408447a261ac99c48818ad93   # R4 提交，ChatGPT 远程基线文档复审 APPROVED
approval_closeout_commit=c179f712c9de4865dd81d02ee8a6a996083b2f96   # 批准收口提交，本任务 base 与其远程复审 APPROVED
project_owner_reply=批准（2026-09-26）
adjustment5_baseline_status=APPROVED
adjustment5_implementation_status_before=NOT_STARTED
adjustment5_implementation_status_after=IMPLEMENTED_PENDING_CHATGPT_REVIEW
adjustment5_formal_acceptance_execution_status=NOT_RUN
```

- 依据 ChatGPT 从远程 Git 对 R4 提交 `26647a5` 的**基线文档复审**结论 `APPROVED` + 项目负责人 2026-09-26 明确回复“批准”，第五轮基线已批准；批准收口提交 `c179f71` 本身亦经 ChatGPT 远程复审 `APPROVED`。
- 本次实现的对象是**已批准基线文档**所指的页面行为，**不**修改批准对象本身；实现完成**不**等于已目测、已验收或已接受。

## 2. 门禁与基线

```text
branch=develop
expected_base_commit=c179f712c9de4865dd81d02ee8a6a996083b2f96
actual_base_commit=c179f712c9de4865dd81d02ee8a6a996083b2f96
origin_develop=c179f712c9de4865dd81d02ee8a6a996083b2f96
remote_refs_heads_develop=c179f712c9de4865dd81d02ee8a6a996083b2f96
ahead_behind(origin/develop...HEAD)=0/0
definition_rows=REQ 147 / AC 146 / DESIGN 82 / UI 70（开工时核对连续唯一无缺号）
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`c179f71`），ahead/behind `0/0`，无分叉、无冲突。
- 任务开始前已存在的**无关**工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`。

## 3. 允许修改范围与实际变更

实际变更（预期范围内，未新增功能私有辅助文件）：
- `frontend/src/views/client-config/ClientConfigPage.vue`（+177 行）
- `frontend/src/views/client-config/ClientConfigPage.spec.ts`（+454 行）
- 五份 Feature 文档现行状态、导航与追加执行记录：`README.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`UI.md`
- 新增本报告。

未修改：`/config/data-source` 参考页、后端、`API.md`、`DATABASE.md`、`docs/baseline/**`、两套模板全局状态、历史报告、`docs/prompts/**`、`docs/features/README.md`、`.claude/**`、`CLAUDE.md`、`agent-env.sh`。未访问或写入数据库／ZooKeeper／Kafka。

## 4. 关键实现方式

### 4.1 新增／编辑弹窗间距与节奏（Scope 1）

- 保留约 900px 桌面目标宽度、窄视口安全边距与**视口居中**；不放大弹窗、不写死高度、不做依赖侧栏宽度的偏移。
- 页面**作用域内**统一表单布局（`.cc-form` / `.cc-form-item` / `.cc-form-label`）：三个标签“探针 ID／探针描述／采集数据源”与各自控件之间统一约 **12px** 水平间距（`gap: 12px`），右对齐、字号字重颜色与必填星号保持；三个控件**左缘对齐**、右缘保持既有布局位置。**未**缩短单个输入框、**未**改共享组件、**未**用全局 CSS 或 `!important`。
- 纵向节奏与参考页“新增数据源”对齐口径核对（本页 `.cc-form` 与 `.cc-field-feedback` `min-height: 20px`）；反馈区**稳定占位**（红边框/红文案、长错误可换行），同视口提示态切换**不**引起弹窗边框与底部按钮跳动（浏览器实测 `stableOnErrorState` 全为 `true`）。
- 保留双列搜索、候选列表、已选区域、受控滚动与既有资格/禁用规则；**新建与编辑双模式一致**。
- 保留第四轮行为：ID 32 字符、描述 256 Unicode 字符、提交按钮常态黑色／加载态深灰、字段级校验、防重复写入。

### 4.2 启用／停用确认文案与流程（Scope 2）

- **停用**：保留既有二次确认；正文精确为 `确定停用探针 {探针ID} 吗？`，标题“停用探针”，按钮“取消／停用”；**不再**展示“停用后该探针不再按启用状态命中”，**不**宣称立即停止进程或采集。
- **启用**：在既有 `enableClient` 调用前**新增**一次二次确认；正文 `确定启用探针 {探针ID} 吗？`，标题“启用探针”，按钮“取消／启用”。**取消／关闭不发出启用写请求**（浏览器实测 `apiLogAfterEnableCancel=[]`），一次点击只发一次请求（确认后 `apiLogAfterEnableConfirm=[PUT /api/clients/probe-b/enable, GET /api/clients?status=ALL]`）。
- 保留 E6/E7 接口、后端校验与错误文案、行级 busy 态与成功文案；异常原始状态行仍只提供停用+删除、无启用入口；删除确认与成功文案不变。

### 4.3 主列表单行固定选中（Scope 3）

- 仅在页面实例内使用**可空单个探针 ID**（`selectedClientId`）作**视觉固定高亮**，**不**写 URL／`localStorage`／`sessionStorage`／接口／数据库。
- 交互：悬浮为临时高亮、移出消失；普通内容**左键单击**未选中行即固定，同点再次单击取消，点他行转移，最多一行固定；固定高亮与悬浮可辨，悬浮他行不压过固定高亮。
- **行双击编辑**与两次 `click` 按 `CCFG-AC-142` 协同：`onRowDblClick` 取消待定计时器并固定该行再开编辑；`onRowClick` 以 `event.detail > 1` 忽略双击产生的第二次 `click`，单击取消采用 260ms 延迟计时器以避免与双击竞争、且不产生迟到的反向取消或对旧行的异步迟写回。
- 探针 ID 文本与所在单元格遵循同一**普通单击**规则；键盘 Enter/Space 仍编辑且不产生鼠标选中切换。
- **行内交互控件事件隔离**：三点触发／弹层菜单／确认窗、`+N` 完整清单、数据源标签 Tooltip 不因事件冒泡切换固定选中、也不误触发行双击编辑；探针 ID 文本普通左键单击**不**作为需隔离的控件处理。
- 重载语义：首次加载、查询、失败重试等常规列表重载**清空**旧固定高亮；独立“重置”只复位查询控件、不请求也不清空选择；无刷新按钮／自动刷新／轮询。**启用／停用成功自刷新为唯一例外**：目标 ID 仍在当前筛选结果内则固定该行（即使原先固定的是别的行），被状态筛选滤除则清空。确认取消与操作失败保留既有固定选择；删除成功清空，删除取消／失败保留。异步响应竞态下旧列表或迟到定时器不会复活不可见选中行。
- **未**恢复复选框／多选／已选行集合／选择计数／“删除所选”／“已选择：{探针ID}”；启停与删除仍经行操作菜单、且**不**以固定选中为前置条件；未改列表排序、查询语义、API 或后端。

## 5. 测试与构建证据

- 定向回归（`npx vitest run src/views/client-config/ClientConfigPage.spec.ts`）：**163/163 通过**。覆盖新建/编辑双模式间距与反馈区、启停确认 是/否/失败与单次写请求、悬浮/单击/双击/键盘/行内控件事件、查询与重载清空、启停成功“可见重选 vs 被筛除清空”两分支，以及多行与快速连续操作的事件协同。
- 全量前端测试（`npm test`）：**57 文件 / 1143 用例通过**（一次完整通过运行）。
- 前端构建（`npm run build` = `vue-tsc --noEmit && vite build`）：**成功**（约 58s）。
- 说明（如实记录验证边界）：全量套件在本机高负载下出现**负载抖动型超时**——另一次运行报 `src/views/data-source/dataSource.spec.ts` 4 例 “Test timed out in 5000ms”，该文件属**未修改**的 `/config/data-source` 参考页；单文件独跑为 **116/116 通过**，证明为本机并发负载下的超时抖动、与本任务改动无关，按规则**未**擅自扩范围修复。本任务文件的定向用例在单独与全量运行中均通过。

### 5.1 真实浏览器核对（只读数据／接口桩）

- 使用**零第三方依赖**的本地只读桩（`http` 托管 `dist` + `/api/clients`、`/api/clients/data-source-options` 桩数据）与 CDP（Node 内置 `WebSocket` 驱动 `--headless=new` Chrome）在 `1440×900`、`1920×1080`、`900×700` 三视口核对；**未**连接真实后端／数据库／ZooKeeper／Kafka，**未**向真实业务库写入测试数据。
- 结果（`problems: []`）：
  - 间距：三视口 `labelControlGaps=[12,12,12]`，三控件 `controlLefts` 完全一致（左缘对齐），`feedbackHeights=[20,20,20]`，弹窗 `centeredOffsetPx=0`，错误态 `stableOnErrorState` 全 `true`（弹窗与 footer 底边不跳）。
  - 确认窗：停用 `{title:停用探针, body:确定停用探针 probe-a 吗？, buttons:[取消,停用]}`；启用 `{title:启用探针, body:确定启用探针 probe-b 吗？, buttons:[取消,启用]}`；取消后写请求均为空，确认启用后仅一次 `PUT enable` + 一次列表重载。
  - 行交互：固定高亮 `background: rgb(232,240,253)` + `box-shadow: rgb(29,78,216) 3px 0 0 0 inset`，与悬浮可辨。
  - 行内控件隔离（AC-143）：三点菜单／`+N` 完整清单／数据源标签点击后固定选中恒为 `probe-a`、`count=1`、`dialog=false`，未误触编辑。
- 证据产物（**不**随本次提交，位于仓库外）：`/tmp/cc-verify/report-main.json`、`report-inline.json`（均 `problems: []`）与 8 张截图（`dialog-1440x900`、`dialog-1920x1080`、`dialog-900x700`、`row-hover-vs-fixed-1440x900`、`dblclick-edit-1440x900`、`confirm-disable-1440x900`、`confirm-enable-1440x900`、`inline-isolation-1440x900`）。核对完成后已清理临时服务与无头浏览器进程（端口 4178／9222／9223 释放）。
- 边界：以上为**自动化无头浏览器核对**，**不**等于项目负责人对实际页面的目测，也**不**等于正式验收。

## 6. 定义行完整性与状态边界

- **定义行完整性**：`CCFG-REQ-001~147`（147）、`CCFG-AC-001~146`（146）、`CCFG-DESIGN-001~082`（82）、`CCFG-UI-001~070`（70）四类定义行相对批准收口提交 `c179f71` **逐字节零变化**（已用脚本抽取定义行做集合并比对，四类均 `identical=True`）。
- **验收状态**：146 条验收**全部为 `NOT_RUN`**，无 `PASSED`／`FAILED`／`BLOCKED`；本次**未**执行正式验收。
- **状态分层**：`adjustment5_baseline_status=APPROVED` 不变；`adjustment5_implementation_status` 由 `NOT_STARTED` 变为 **`IMPLEMENTED_PENDING_CHATGPT_REVIEW`**；`adjustment5_formal_acceptance_execution_status=NOT_RUN`；`PENDING_USER_CONFIRMATION=0`。
- **范围边界**：**未**修改 `/config/data-source` 参考页、后端、`API.md`／`DATABASE.md`、`docs/baseline/**`、两套共享模板全局状态、历史报告、`docs/prompts/**`、`docs/features/README.md`、`.claude/**`；**未**访问或写入数据库／ZooKeeper／Kafka；**未**创建或推广通用弹窗模板。
- **未执行事项**：正式验收（146 条）、项目负责人页面目测、ChatGPT 远程代码复审。

## 7. 结果与下一步

- 起始提交 `c179f712c9de4865dd81d02ee8a6a996083b2f96`；本次结果提交见任务结果输出。
- **下一入口**：`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_IMPLEMENTATION_REVIEW`（由 ChatGPT **从远程 Git** 对本实现结果做独立代码复审）。
- **远程代码复审通过仍不等于项目负责人目测或正式验收通过**；项目负责人**后续仍须对实际页面做目测**，正式验收须另行执行。

---

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001
branch=develop
base_commit_id=c179f712c9de4865dd81d02ee8a6a996083b2f96
result_commit_id=见任务会话提交结果
env_check_status=SUCCESS
backend_build_status=NOT_APPLICABLE
frontend_build_status=SUCCESS
database_write_status=NOT_REQUESTED
zookeeper_write_status=NOT_REQUESTED
push_status=见任务会话推送结果
changed_files=frontend/src/views/client-config/ClientConfigPage.vue,frontend/src/views/client-config/ClientConfigPage.spec.ts,docs/features/client-config/README.md,docs/features/client-config/REQUIREMENTS.md,docs/features/client-config/ACCEPTANCE.md,docs/features/client-config/DESIGN.md,docs/features/client-config/UI.md,docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001.md
error=
AGENT_TASK_RESULT_END
```
