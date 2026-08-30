# DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001-R1 实现报告

## 1. 任务、分支、基准

- 任务：`DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001-R1`
- 分支：`develop`
- 授权基准：`3c05c16e7a6f76ebe0e1075de3a6e74c656ac61f`
- 复审结论：`CHANGES_REQUIRED`
- 任务性质：前端行为边界修复、测试、构建、报告、Commit、Push
- 状态口径：仅记录实现状态 `IMPLEMENTED_PENDING_REVIEW`，不更新正式验收状态，不进入正式复验
- 结果提交：本报告所在提交（精确 SHA 见控制台 `AGENT_TASK_RESULT` 结果块）
- Push：SUCCESS（普通 push，无 force）
- 推送后核验：`HEAD == origin/develop == ls-remote develop`，ahead/behind = `0 0`

## 2. ChatGPT 两项复审发现

| 编号 | 发现 | 位置 |
|---|---|---|
| 复审发现 1 | 自动刷新错误使用尚未点击“查询”的草稿查询条件：代码虽维护 `effectiveQuery`，但 `loadList()` 内仍调用 `normalizeQuery()` 读取查询表单草稿。用户输入未提交条件后执行新增/编辑/删除，操作成功后的自动刷新会悄悄使用草稿过滤，列表实际按未提交草稿过滤而空状态仍按旧 `effectiveQuery` 判断，违反 `DS-REQ-110`“最后一次实际执行并生效的查询条件”规则。 | `DataSourcePage.vue` |
| 复审发现 2 | 弹窗在拖动尚未结束时关闭或组件卸载，窗口级拖动监听未完整清理：`draggableDialog.ts` 在开始拖动时向 `window` 注册 `mousemove`、`mouseup`，但当前 `destroy()` 只移除标题栏 `mousedown` 和 `window.resize`，未清理尚未结束的拖动监听，残留监听仍引用旧 DOM。 | `draggableDialog.ts` |

## 3. 修复一：生效查询快照与自动刷新一致

### 设计

采用清晰、单一的数据流：

- 查询表单 `query` 只表示用户正在编辑的草稿；
- `effectiveQuery` 表示最近一次通过“查询”或“重置”明确生效的条件快照；
- 新增 `effectiveSnapshot()`：返回 `effectiveQuery` 的独立副本（无条件时返回 `{}`），列表请求永远使用该快照，`loadList()` 不再读取草稿表单；
- `loadList(querySnapshot)` 改为接收显式快照参数，并在请求前 `{ ...querySnapshot }` 拷贝，确保快照不与表单对象共享可变引用；
- 点击“查询”：`normalizeQuery()` 对草稿 trim/规范化并形成独立快照 → 更新 `effectiveQuery` → 用 `effectiveSnapshot()` 发请求；
- 点击“重置”：清空表单、`effectiveQuery` 置空 → 按无条件快照加载；
- 初次进入：按无条件快照加载；
- 数据源新增、编辑、删除成功后的自动刷新：一律使用 `effectiveSnapshot()`，不得使用当前草稿；
- 保留 `listToken` 请求代次隔离：迟到响应不得覆盖最终请求的列表或空状态；
- 请求失败仍只显示错误状态，不误显示普通空状态；未改动批准文案与视觉样式。

### 修改文件

`frontend/src/views/data-source/DataSourcePage.vue`

- `loadList()` → `loadList(querySnapshot: DataSourceListQuery = {})`，请求参数改为 `fetchDataSourceList({ ...querySnapshot })`；
- 新增 `effectiveSnapshot()`；
- `onQuery` / `onReset`、新增/编辑/删除成功自动刷新、`onMounted` 初始加载全部改为 `loadList(effectiveSnapshot())`；
- `normalizeQuery()` 仅保留在 `onQuery` 内用于形成快照。

## 4. 修复二：拖动期间的窗口监听完整清理

### 设计

`frontend/src/views/data-source/draggableDialog.ts`：

- 将当前活动拖动的 `mousemove`、`mouseup` 处理器引用保存到控制器生命周期范围（`activeMoveHandler` / `activeUpHandler`）；
- 新增统一 `stopActiveDrag()`：成对移除活动监听并置空，无活动拖动时为 no-op；
- 正常 `mouseup`（`onUp`）调用统一清理；
- 新一轮拖动开始前（`beginDrag`）先调用 `stopActiveDrag()` 清理任何残留活动拖动；
- `destroy()` 完整清理：标题栏 `mousedown`、`window.resize`、尚未结束的 `window.mousemove`、尚未结束的 `window.mouseup`；
- 只响应鼠标主键：`beginDrag` 开头校验 `e.button !== 0` 则返回，右键等不发起拖动；
- 保持原有行为不变：仅标题栏非关闭按钮区域可拖动、viewport 边界限制、resize 回正、关闭重开居中、确认框不可拖动。

## 5. 新增/修订测试及结果

### 修复一测试（`dataSource.spec.ts`，新增 describe `生效查询快照与自动刷新（R1）`，6 例全部通过）

1. 初始为无条件列表，查询框输入 `NOPE` 不点击查询；新增成功自动刷新请求仍为无条件 `{}`，空结果显示系统空状态而非查询零结果状态。
2. 已生效条件 A，查询框改为 B 不点击查询；编辑成功自动刷新仍使用 A（断言 `mockedList` 末次实参 `{ id: 'SRC' }`）。
3. 已生效条件 A，查询框改为 B 不点击查询；删除成功自动刷新仍使用 A（断言末次实参）。
4. 点击“查询”使用 trim 后独立快照（`' NOPE '` → `{ id: 'NOPE' }`）；继续编辑表单不新增请求、不反向修改快照。
5. 点击“重置”后生效条件为无条件，后续自动刷新（删除成功）使用无条件快照 `{}`。
6. 自动刷新并发：删除自动刷新请求挂起（旧代次），随后重置无条件请求立即返回；迟到旧代次响应不得覆盖最终生效请求的空状态。

以上测试均断言传给 `fetchDataSourceList` 的实际参数（`mockedList.mock.calls` / `toHaveBeenLastCalledWith`），而不只是检查提示文字。

### 修复二测试（`dataSource.spec.ts`，新增 describe `拖动监听生命周期清理（R1）`，5 例全部通过）

1. `mousedown` 开始拖动但不发送 `mouseup`，随后卸载组件；卸载后向 `window` 发送 `mousemove`，旧弹窗位置不再变化且不抛异常。
2. 活动拖动未结束即关闭弹窗；重新打开后默认居中，重新拖动位移精确等于拖动差值（无重复绑定）。
3. 正常 `mouseup` 后继续 `mousemove` 不再改变位置。
4. 非主键 `mousedown`（`button: 2`）不发起拖动，位置保持默认居中。
5. 命名策略弹窗标题栏同样可拖动（三个业务弹窗全覆盖）；既有弹窗拖动、关闭按钮排除、边界限制、resize 回正、关闭重开居中和确认框不可拖动测试继续通过。

### 结果

- 数据源页面定向测试：`dataSource.spec.ts` 73 例全部通过（原 62 例 + 新增 11 例）。
- 前端全量单元测试：15 个测试文件共 235 例全部通过（原 224 例 + 新增 11 例），无失败。
- `npm run build`（`vue-tsc --noEmit && vite build`）：BUILD SUCCESS，仅项目既有 chunk 体积告警，与本任务无关。
- `git diff --check`：无空白错误。

## 6. 授权范围核验

- 相对授权基准 `3c05c16e...`，本任务仅涉及 4 个授权文件：
  1. `frontend/src/views/data-source/DataSourcePage.vue`（修改）
  2. `frontend/src/views/data-source/dataSource.spec.ts`（修改）
  3. `frontend/src/views/data-source/draggableDialog.ts`（修改）
  4. `docs/features/data-source-management/reports/DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001-R1.md`（新增，本文件）
- 六份批准文档（REQUIREMENTS / ACCEPTANCE / DESIGN / API / UI / DATABASE）相对基准零 diff。
- 原实现报告 `DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001.md` 相对基准零 diff。
- 全部后端文件相对基准零 diff（`backend_change_status=NONE`）。
- 未使用 `git add .` / `git add -A` / 通配符暂存，按路径精确暂存授权文件。

## 7. 未执行项（明确不做）

- 未连接数据库、未执行 SQL / DDL / 任何数据写入（`database_access_status=NONE`，`database_write_status=NONE`，`ddl_status=NONE`）；
- 未访问 ZooKeeper（`zookeeper_access_status=NONE`）；
- 未启动前后端服务（`service_operation_status=NONE`）；
- 未要求用户再次视觉检查；
- 未执行正式验收复验；
- 未更新 `DS-AC-052/105/104/107~115` 状态，未将实现状态改为 `IMPLEMENTED_ACCEPTED`；
- 未修改后端代码、六份批准文档、原实现报告、项目级/数据库级基线、菜单/路由/公共布局及其他 Feature、依赖/锁文件/构建配置。

## 8. 正式验收状态保持不变

- `formal_acceptance_status=FAIL`；
- `ds_ac_052_document_status=FAIL`、`ds_ac_105_document_status=FAIL`、`ds_ac_104_document_status=BLOCKED`、`new_adjustment_cases_status=NOT_RUN` 均未改动。

## 9. 工作区无关内容保持原样

- 任务开始前已存在的无关修改（`.claude/settings.local.json`、`agent-env.sh`、`docs/database/` 删除文件、`frontend/index.html`、布局/菜单/样式文件、大量未跟踪的 `docs/agent-prompts/`、`docs/features/large-screen/` 等）未修改、未覆盖、未暂存、未提交。

## 10. 敏感内容扫描

- 对本次 diff 与报告执行机械扫描，未发现真实密码、数据库连接凭据或未脱敏日志。测试中出现的 `secret` 为 mock 表单输入值，`10.2.2.2` 为测试构造 IP，均非真实凭据。

## 11. Commit 与 Push

- 精确暂存 4 个授权文件，核验 staged diff 仅含授权范围；
- 创建单个提交：`fix(data-source-management): close remediation review gaps [DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001-R1]`；
- 普通执行 `git push origin develop`，禁止 force；
- 推送后核验：`HEAD == origin/develop == ls-remote develop`，ahead/behind = `0 0`；
- 为避免“报告回填提交 SHA 导致 SHA 再变化”的循环，本报告未回填自身提交 SHA（以“本报告所在提交（精确 SHA 见控制台结果块）”表示），未因此创建第二个提交。

## 12. 结果块

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001-R1
branch=develop
base_commit_id=3c05c16e7a6f76ebe0e1075de3a6e74c656ac61f
result_commit_id=本报告所在提交（精确 SHA 见控制台结果块）
remote_commit_id=本报告所在提交（精确 SHA 见控制台结果块）
requirements_status=APPROVED
acceptance_status=APPROVED
ui_status=APPROVED
current_implementation_status=IMPLEMENTED_PENDING_REVIEW
adjustment_implementation_status=IMPLEMENTED_PENDING_REVIEW
formal_acceptance_status=FAIL
ds_ac_052_document_status=FAIL
ds_ac_105_document_status=FAIL
ds_ac_104_document_status=BLOCKED
new_adjustment_cases_status=NOT_RUN
effective_query_refresh_status=FIXED
active_drag_listener_cleanup_status=FIXED
frontend_targeted_test_status=PASS
frontend_full_test_status=PASS
frontend_build_status=PASS
backend_change_status=NONE
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_access_status=NONE
service_operation_status=NONE
push_status=SUCCESS
ahead_behind=0 0
changed_files=frontend/src/views/data-source/DataSourcePage.vue,frontend/src/views/data-source/dataSource.spec.ts,frontend/src/views/data-source/draggableDialog.ts,docs/features/data-source-management/reports/DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001-R1.md
next=CHATGPT_CODE_REVIEW_POST_ACCEPTANCE_REMEDIATION_R1
error=
AGENT_TASK_RESULT_END
```
