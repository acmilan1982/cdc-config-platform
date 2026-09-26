# 探针端管理弹窗间距、启停确认文案与列表单行选中调整实现 R1 列表重载竞态纠错报告

- 任务编号：`CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001-R1`
- 任务类型：前端纠错（非纯文档；仅改 `/config/client` 页面代码与测试，并同步五份 Feature 文档现行状态、新建本报告）
- 分支：`develop`
- 起始提交（base）：`c082b344edb70e5428a9186a782eceb8495dee2e`（第五轮实现提交，ChatGPT 远程代码复审结论 `CHANGES_REQUIRED`）
- 依据：`docs/prompts/client-config/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001-R1-Agent-Prompt.md`
- 实现对象：第五轮已批准基线 `CCFG-REQ-145/146`／`CCFG-AC-144/145`／`CCFG-DESIGN-080/081`／`CCFG-UI-068/069` 的**竞态边界**
- 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_IMPLEMENTATION_R1_REVIEW`
- 边界声明：本任务**只**修复“启停成功重载与普通查询／普通重载交错时跨请求共享重选意图”这一处缺陷；**不**执行正式验收、**不**做项目负责人页面目测、**不**创建或推广通用弹窗模板、**不**修改任何定义行。

---

## 1. 复审发现与授权依据

```text
task_code=CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001-R1
review_object=c082b344edb70e5428a9186a782eceb8495dee2e   # 第五轮实现提交
review_conclusion=CHANGES_REQUIRED
approved_baseline=第五轮基线（adjustment5_baseline_status=APPROVED，不变）
adjustment5_implementation_status_before=IMPLEMENTED_PENDING_CHATGPT_REVIEW
adjustment5_implementation_status_after=IMPLEMENTED_PENDING_CHATGPT_REVIEW
adjustment5_formal_acceptance_execution_status=NOT_RUN
```

- 已批准业务基线保持不变；本任务只修复**启停成功所触发的列表重载**与**普通查询／其他普通重载**交错时，跨请求共享变量导致普通重载错误保留／恢复固定高亮的问题。
- 此问题属页面会话内状态竞态，**不**改 API、后端或数据库。

## 2. 门禁与基线

```text
branch=develop
expected_base_commit=c082b344edb70e5428a9186a782eceb8495dee2e
actual_base_commit=c082b344edb70e5428a9186a782eceb8495dee2e
origin_develop=c082b344edb70e5428a9186a782eceb8495dee2e
remote_refs_heads_develop=c082b344edb70e5428a9186a782eceb8495dee2e
ahead_behind(origin/develop...HEAD)=0/0
definition_rows=REQ 147 / AC 146 / DESIGN 82 / UI 70（开工时核对连续唯一无缺号）
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`c082b344`），ahead/behind `0/0`，无分叉、无冲突。
- 任务开始前已存在的**无关**工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`。

## 3. 根因分析

第五轮实现（提交 `c082b344`）把“启停成功后按 ID 重选”实现为一个**模块级、跨请求共享**的可变变量：

```ts
let reselectAfterLoad: string | null = null
// 启停成功：
reselectAfterLoad = row.clientId
await loadList()            // 无参数，所有调用都读同一个共享变量
// loadList 读取该共享变量判断是否清选，成功响应再由 applySelectionAfterReload() 读取之
```

由于普通查询与其他普通重载调用同一个无参数 `loadList()`，它们会**读到、保留或消费**启停请求遗留的重选意图：

1. 行 A 启停成功，发起其列表重载，请求尚未返回，`reselectAfterLoad=A`。
2. 用户点击“查询”，新请求成为最新请求；按 `CCFG-REQ-145` 这属**普通重载**，应立即清除旧固定选中并在成功后保持清空。
3. 当前实现仍见共享值 A：查询发起时未清选；查询结果若仍含 A，`applySelectionAfterReload()` 还会把 A 固定选中。

`listSeq` 序号机制只会忽略**过期响应**，**不能**阻止新请求误用旧请求的重选意图——这是根因的关键。

## 4. 请求交错时序（复现路径）

```text
时间轴（序号 = listSeq 分配顺序）
t1  启用/停用写请求成功 → 触发列表重载 #1（携带“重选 A”意图）……挂起
t2  用户点“查询” → 列表请求 #2 成为最新请求（listSeq=2；#1 变为过期）
      ·期望（CCFG-REQ-145）：#2 发起时立即清除旧固定选中
      ·旧实现：从共享 reselectAfterLoad 见到 A，未清选
t3  #2 查询响应到达（结果仍含 A）
      ·期望：普通重载清选，保持无固定选中
      ·旧实现：经 applySelectionAfterReload 读到共享值 A → 误固定 A
t4  #1 的迟到响应到达 → 旧实现由 listSeq 守卫忽略其回写（不足以避免 t3 的误固定）
```

同一根因亦适用于：普通查询**失败**／重试、删除成功触发的普通重载、新增／编辑成功触发的普通重载；以及多个不同行启停操作交错时，意图归属错误。

## 5. 修复方式

把“成功后按 ID 重选”由**跨请求共享变量**改为**启停成功所触发的单次列表请求的私有参数**，使普通重载从结构上无法继承该意图：

- `loadList(reselectTarget: string | null = null)`：新增可选参数，**默认 `null` 表示普通重载**。
  - `reselectTarget === null` 时，在请求**发起时同步**清除此前固定选中（`CCFG-REQ-145`）。
  - `reselectTarget` 非空时，发起时不清旧选中，**仅**本次请求自身的最新成功响应按**其自己的**目标 ID 决定重选或清空。
- `applySelectionAfterReload(reselectTarget)`：改为消费**本次请求的参数**，不再读取任何跨请求共享状态。
- 启停成功改为 `await loadList(row.clientId)`；其余所有调用点（首次加载、查询、重试、删除成功、新增／编辑成功）一律走 `loadList()`（`null`）。
- 过期响应仍由 `listSeq` 守卫（`seq !== listSeq` 时直接 `return`，**不回写选中**）；本请求失败也不把意图留给后续任何请求（意图只存在于本次调用的局部参数中）。
- 顺带修正重试按钮的潜在隐患：`@click="loadList"` → `@click="loadList()"`，避免把点击事件对象当作 `reselectTarget` 传入。

**保留不变**：`listSeq` 迟到响应保护、`cancelPendingRowClick` 计时器清理、成功后按稳定探针 ID 重选且被状态筛选过滤时清空、取消确认／启停失败保留原选中、删除成功清空、重置不发请求也不清选、启停确认文案与次数、单击／双击判定、行内事件隔离与视觉样式。

## 6. 测试与构建证据

### 6.1 确定性延迟响应测试（新增 5 条）

在 `ClientConfigPage.spec.ts` 的第五轮 describe 内新增可精确控制“请求启动／响应完成”顺序的 `deferred<T>()` 助手，并新增 5 条用例：

1. **启停重载在途时发起普通查询**：查询发起即清选、查询成功后无固定选中，迟到的启停列表响应不恢复（`CCFG-REQ-145/146`）。
2. **启停重载在途时另一普通重载（删除成功）不继承启停重选目标**（`CCFG-REQ-145`）。
3. **启停重载在途时普通查询失败**：发起即清选、失败保留上次结果且不重选，迟到启停响应不恢复（`CCFG-REQ-145`）。
4. **多个启停重载交错**：最终固定行由**最新有效请求自身的目标**决定，过期请求不回写（`CCFG-REQ-146`）。
5. **启停写请求失败不把重选意图留给后续普通重载**：之后“查询”不固定任何行（`CCFG-REQ-146`）。

### 6.2 用例有效性验证（竞态复现证据）

为确认新用例确实能捕获该缺陷，在**保证可还原**的前提下临时把 `ClientConfigPage.vue` 改回旧共享变量实现（`trap` 保证退出即还原），运行同一定向用例集：

```text
Test Files  1 failed (1)
     Tests  3 failed | 165 passed (168)
```

失败的正是第 1、2、3 条用例，断言点均为“**普通请求发起时应清除旧固定高亮**”：

```text
AssertionError: expected [ DOMWrapper{ …(3) } ] to have a length of +0 but got 1
❯ ClientConfigPage.spec.ts:3209  expect(w.findAll('.cc-row--selected')).toHaveLength(0)   # 查询竞态
❯ ClientConfigPage.spec.ts:3242  expect(w.findAll('.cc-row--selected')).toHaveLength(0)   # 删除成功重载竞态
❯ ClientConfigPage.spec.ts:3269  expect(w.findAll('.cc-row--selected')).toHaveLength(0)   # 查询失败竞态
```

即：旧实现下普通重载未按基线清选（残留 1 行固定选中），与复审发现一致；改回修复版后用例全绿。验证完成后源码已还原（`git diff` 确认 `loadList(reselectTarget: string | null = null)` 仍在、无 `reselectAfterLoad`／共享变量残留）。

### 6.3 正式验证结果（修复后）

- 定向回归（`npx vitest run src/views/client-config/ClientConfigPage.spec.ts`）：**168/168 通过**（含新增 5 条）。
- 全量前端测试（`npm test`）：**57 文件 / 1148 用例通过**（较第五轮实现的 1143 增加 5 条新用例）。
- 前端构建（`npm run build` = `vue-tsc --noEmit && vite build`）：**成功**（`✓ built in 16.05s`）。

### 6.4 验证边界（如实记录）

- 本任务的交错竞态已用**确定性延迟响应**（可控 Promise）在单元测试层覆盖；请求启动与响应完成的先后顺序由测试精确控制。
- 本任务**未**另行启动浏览器做该交错情形的实机核对（该竞态属请求时序，已在测试层确定性复现与验证）；第五轮实现报告中的真实浏览器只读核对结论不因本修复而失效，但也**不**构成本修复的实机证据。
- 测试通过**不**得写成正式验收通过。

## 7. 定义行完整性与状态边界

- **定义行完整性**：`CCFG-REQ-001~147`（147）、`CCFG-AC-001~146`（146）、`CCFG-DESIGN-001~082`（82）、`CCFG-UI-001~070`（70）四类定义行相对起始提交 `c082b344` **逐字节零变化**（脚本抽取定义行做集合并比对，四类均 `identical=True`）。
- **验收状态**：146 条验收**全部为 `NOT_RUN`**，无 `PASSED`／`FAILED`／`BLOCKED`（`ACCEPTANCE.md` 内唯一的 `BLOCKED` 属历史行的 `BROWSER_BLOCKED_RUNTIME_UNAVAILABLE` 表述，非验收状态）；本次**未**执行正式验收。
- **状态分层**：`adjustment5_baseline_status=APPROVED` 不变；`adjustment5_implementation_status` 保持 **`IMPLEMENTED_PENDING_CHATGPT_REVIEW`**；`adjustment5_formal_acceptance_execution_status=NOT_RUN`；`PENDING_USER_CONFIRMATION=0`。
- **范围边界**：**未**修改 `/config/data-source` 参考页、后端、`API.md`／`DATABASE.md`、`docs/baseline/**`、两套共享模板全局状态、历史报告、`docs/prompts/**`、`docs/features/README.md`、`.claude/**`；**未**访问或写入数据库／ZooKeeper／Kafka；**未**创建或推广通用弹窗模板。
- **未执行事项**：正式验收（146 条）、项目负责人页面目测、ChatGPT 远程代码复审。

## 8. 与历史实现报告的保留关系

- 原第五轮实现报告 `reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001.md` **不回写、不修改**，作为该实现提交 `c082b344` 时点的事实记录**原样保留**；其中“163/163”“1143 用例”“共享实现方式”等表述属**该时点历史事实**，与本 R1 修复后的现行实现（168/168、1148 用例、私有参数方式）**分层并存**，不构成矛盾。
- 本报告是**追加**记录：只说明根因、交错时序、修复与验证，不覆盖、不改写既有报告与既有定义行。

## 9. 结果与下一步

- 起始提交 `c082b344edb70e5428a9186a782eceb8495dee2e`；本次结果提交见任务结果输出。
- **下一入口**：`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_IMPLEMENTATION_R1_REVIEW`（由 ChatGPT **从远程 Git** 对本纠错结果做独立代码复审）。
- **远程代码复审通过仍不等于项目负责人目测或正式验收通过**；项目负责人**后续仍须对实际页面做目测**，正式验收须另行执行。

---

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001-R1
branch=develop
base_commit_id=c082b344edb70e5428a9186a782eceb8495dee2e
result_commit_id=见任务会话提交结果
env_check_status=SUCCESS
backend_build_status=NOT_APPLICABLE
frontend_build_status=SUCCESS
database_write_status=NOT_REQUESTED
zookeeper_write_status=NOT_REQUESTED
push_status=见任务会话推送结果
changed_files=frontend/src/views/client-config/ClientConfigPage.vue,frontend/src/views/client-config/ClientConfigPage.spec.ts,docs/features/client-config/README.md,docs/features/client-config/REQUIREMENTS.md,docs/features/client-config/ACCEPTANCE.md,docs/features/client-config/DESIGN.md,docs/features/client-config/UI.md,docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-IMPLEMENTATION-001-R1.md
error=
AGENT_TASK_RESULT_END
```
