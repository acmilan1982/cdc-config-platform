# DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001 实现报告

## 1. 任务、分支、基准

- 任务：`DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001`
- 分支：`develop`
- 授权基准：`c93f562ba0c3bd9a525382e8c93fbe4e4d956f88`
- 结果提交：`b5145a7cf466f9f4da872986caec6e0725b50cf4`（fix(data-source-management): remediate acceptance findings and UI adjustments [DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001]）
- Push：SUCCESS（`c93f562..b5145a7  develop -> develop`，无 force）
- 推送后核验：`HEAD == origin/develop == ls-remote develop == b5145a7cf466f9f4da872986caec6e0725b50cf4`，ahead/behind = `0 0`
- 状态口径：仅记录实现状态 `IMPLEMENTED_PENDING_REVIEW`，不更新正式验收状态，不进入正式复验

## 2. 实际修改文件清单（无通配符）

后端：

1. `backend/src/main/resources/application-dev.yml`（修改）
2. `backend/src/main/java/com/bsoft/cdcconfig/datasource/controller/DataSourceController.java`（修改）
3. `backend/src/test/java/com/bsoft/cdcconfig/datasource/controller/DataSourceControllerTest.java`（修改）
4. `backend/src/test/java/com/bsoft/cdcconfig/datasource/DataSourcePasswordLogSecurityTest.java`（新增）

前端：

5. `frontend/src/views/data-source/DataSourcePage.vue`（修改）
6. `frontend/src/views/data-source/dataSource.spec.ts`（修改）
7. `frontend/src/views/data-source/draggableDialog.ts`（新增）

报告：

8. `docs/features/data-source-management/reports/DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001.md`（新增，本文件）

## 3. DS-AC-052 密码日志修复

### 根因

dev 配置 `logging.level` 中 `com.bsoft.cdcconfig: DEBUG` 与 `com.bsoft.cdcconfig.**.mapper: DEBUG` 对数据源 Mapper 生效；MyBatis 使用 `Slf4jImpl`，`PreparedStatementHandler` 在 DEBUG 级以 Mapper 全限定类名为 logger 输出“==> Parameters”绑定参数日志，数据源 INSERT/UPDATE 的绑定参数含 password 列值，导致真实密码进入 dev 运行日志。

### 修复

在 `application-dev.yml` 的 `logging.level` 下新增精确覆盖：

```yaml
com.bsoft.cdcconfig.datasource.mapper: INFO
```

精确名称覆盖优先于包级/通配符继承规则，将数据源 Mapper 日志级别从 DEBUG 提升为 INFO，从根源阻止 MyBatis 绑定参数（含密码）进入日志。未改变其他 Feature 的日志行为，未删除测试、未关闭日志、未吞异常。

### 自动测试证据（DataSourcePasswordLogSecurityTest，5 例全部通过）

1. `devConfig_declaresDatasourceMapperLevelInfo`：配置级验证，加载 `application-dev.yml`，断言 `logging.level.com.bsoft.cdcconfig.datasource.mapper` 为 `INFO`。
2. `devConfig_effectiveLevel_suppressesDebugBindingLogs`：按 dev 目标级别设置数据源 Mapper 为 INFO，断言 DEBUG 不启用，DEBUG 绑定参数日志不被输出（Sentinel 不进入捕获日志）。
3. `createAndUpdatePaths_doNotLeakRandomSentinelPassword`：以随机唯一哨兵密码走真实新增/编辑服务路径，捕获日志断言不含哨兵值、不含“Parameters”绑定日志。
4. `unknownExceptionResponse_doesNotLeakSentinel`：未知异常底层文本含哨兵时，响应仍按契约返回“服务器内部错误”，不含哨兵。
5. `serviceBusinessAndUnknownErrors_doNotLeakSentinelIntoResponse`：业务异常与未知异常路径响应均不含哨兵。

证据边界：单元测试使用 mock 的 DataSourceMapper，无法真实触发 MyBatis 绑定参数日志；测试同时提供配置级验证与最接近真实路径的日志捕获。正式复验仍会使用真实保存检查运行日志。

## 4. DS-AC-105 请求体类型错误修复

### 根因

请求体字段类型不匹配（如 `port:"abc"`）时，Jackson 反序列化抛 `HttpMessageNotReadableException`，未被局部处理，落入全局未知异常分支返回 HTTP 500，违反批准契约（应为 HTTP 400、code=400、消息“参数类型错误: port”）。

### 修复

在 `DataSourceController` 内新增控制器范围专用异常映射：

- `@ExceptionHandler(HttpMessageNotReadableException.class)` + `@ResponseStatus(HttpStatus.BAD_REQUEST)`。
- 从 `MismatchedInputException.getPath().get(0).getFieldName()` 提取实际字段名，返回 `code=400`、消息“参数类型错误: 字段名”。
- 无法定位字段名的畸形 JSON 返回“请求体格式错误”（HTTP 400）。
- 响应只含脱敏消息，不输出输入值、请求体全文、异常堆栈或敏感内容；`MethodArgumentTypeMismatchException`、Bean Validation、业务异常与未知异常边界保持不变。

### 自动测试证据（DataSourceControllerTest 新增，DS-AC-105，全部通过）

1. `create_portAsString_shouldReturn400TypeError`：POST，port 为字符串 `abc`，断言 HTTP 400、code 400、消息“参数类型错误: port”。
2. `update_portAsString_shouldReturn400TypeError`：更新接口同类错误。
3. `saveBizAttr_objectValue_shouldReturnActualFieldName`：其他可定位字段返回实际字段名 `bizAttr`，不写死 port。
4. `malformedJson_shouldReturn400GenericMessage`：畸形 JSON 返回 HTTP 400 与脱敏通用消息。
5. `typeErrorResponse_shouldNotLeakPasswordOrRawContent`：响应不包含输入密码、原始输入、`Cannot deserialize` 或异常堆栈。
6. `create_validNumericPort_shouldRemainOk`：合法 JSON 与数值型 port 不受影响（返回 200）。

说明：曾尝试以 `port: 1.5` 触发类型错误，但 Jackson 默认 `ACCEPT_FLOAT_AS_INT` 会无异常把 1.5 强转为 1，不构成类型错误，故未将该场景作为类型错误断言（批准契约仅要求字符串等类型不匹配场景）。

## 5. DS-REQ-110～115 实现映射

| 需求 | 实现要点 |
|---|---|
| DS-REQ-110/111 两类空状态 | 新增 `effectiveQuery` 生效条件快照：点“查询”发出请求时保存本次条件，点“重置”清空表单与生效条件并加载全部；`listToken` 代次守卫，只有最终生效请求更新列表与快照，旧响应不覆盖。有生效条件且零结果显示“未找到符合当前查询条件的数据源”+“请调整查询条件后重试，或点击上方“重置”查看全部数据源”；无生效条件且零结果显示“暂无数据源”+“点击右上角“新增数据源”创建第一条数据源”。使用表格 `#empty` 插槽，中性灰样式，无第二重置按钮/链接，加载中/失败不误显。 |
| DS-REQ-112 三个可拖动弹窗 | 新增最小辅助模块 `draggableDialog.ts`：仅标题栏非控件区域（`.el-dialog__header`，排除 `.el-dialog__headerbtn`）发起拖动；拖动范围按标题栏完整留在 viewport 约束 clamp；`resize` 后自动修正回可操作范围；每次重新打开调用 `enableDialogDrag` 复位 transform 到默认居中；组件卸载与关闭时 `destroy()` 清理监听。新增/编辑、业务属性、命名策略三个弹窗均绑定。ElMessageBox（删除确认、未保存确认）保持固定居中，不绑定拖动。 |
| DS-REQ-113 表单标签左对齐 | 三个业务弹窗 `el-form` 设置 `label-position="left"` 并保留固定 `label-width`（编辑弹窗 120px、命名弹窗 110px），必填星号在标签列内位置稳定，输入控件左边界一致；动态标签（Service Name/数据库名）遵守同一标签列。 |
| DS-REQ-114 命名策略弹窗与表格 | 弹窗 `width="1050px"`，scoped 样式 `:deep(.naming-dialog){max-width: calc(100vw - 48px)}` 保证 viewport 约束与左右安全间距，与拖动边界协同。表格固定七列（目标库ID/目标库名称/数据库类型/命名策略/前缀/后缀/操作），`show-overflow-tooltip` 长内容悬停展示完整值，操作按钮不被遮挡；`max-height` 约束默认约 5 行空间，无分页。 |
| DS-REQ-115 命名策略单选卡片 | 自绘横向卡片替换 el-radio-group：两张卡片固定文案（表合并/TABLE_MERGE“按表合并规则生成目标表名，无需填写前缀和后缀。”；自定义前后缀/CUSTOM_PREFIX_SUFFIX“在源表名基础上添加指定前缀和后缀，生成目标表名。”）。整卡点击选中（`role=radio`、`aria-checked`、`tabindex`、Enter/Space 键盘操作），选中态蓝色边框与浅蓝背景；`namingSaving` 时 `aria-disabled` 且点击/键盘被忽略；TABLE_MERGE 立即清空并禁用前后缀，CUSTOM_PREFIX_SUFFIX 启用前后缀并保持必填/trim 规则；API 枚举值与请求结构不变。 |

## 6. 后端构建与测试

- 定向测试：`DataSourceControllerTest`（25）+ `DataSourcePasswordLogSecurityTest`（5）= 30 例全部通过，BUILD SUCCESS。
- `mvn clean package -DskipTests`：BUILD SUCCESS，产出 `cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`。
- 全量测试（当前工作区）：`Tests run: 722, Failures: 3, Errors: 17`。失败全部位于与数据源管理无关的既有失败：`JobFailureServiceTest`（2 Failures + 17 Errors）、`OracleDateMappingTest`（1 Failure）。
- 基准比较（授权基准 `c93f562` 临时 detached worktree、同一环境、同一命令）：`Tests run: 711, Failures: 3, Errors: 17`，失败方法集合、Failures/Errors 与根因和当前完全一致。当前相对基准仅新增本任务 11 个数据源测试（全部通过），未增加任何失败。
- 说明：全量运行中曾观察到 `ZooKeeperMonitorServiceTest#shouldNotSetScnStaleWhenExactlyAtThreshold` 一次间歇失败（该测试用“当前时间减 24 小时整秒”作为边界，受秒级截断与执行耗时影响），单独重跑及整类重跑均通过（67/67），与基准集合无关、与本任务修改无关。未删除测试、未降低断言、未加排除、未改无关代码。
- 临时 worktree 已安全移除，不影响主工作区。

## 7. 前端测试与构建

- 完整单元测试：15 个测试文件共 224 例全部通过（`dataSource.spec.ts` 62 例，含 DS-REQ-110~115 行为测试）。
- `npm run build`（`vue-tsc --noEmit && vite build`）：BUILD SUCCESS（dist 产出正常；仅存在项目既有的 chunk 体积告警，与本任务无关）。
- 行为测试覆盖（prompt §11）：两类空状态两级文案、只编辑不查询仍依据最后生效条件、重置回退系统空状态、无额外重置按钮/链接、加载/错误/空状态不混淆、三弹窗标题栏拖动、关闭按钮/输入控件/操作按钮不触发拖动、拖动边界/resize 修正/关闭重开居中/卸载清理、确认框无拖动能力、标签左对齐与固定列宽与必填星号、命名弹窗 1050px/七列/无分页/五行空间/Tooltip、两张卡片文案/整卡点击/选中态/键盘与禁用态、策略切换前后缀联动、既有密码掩码/倒计时/详情代次/未保存确认/防重复提交测试继续通过。

## 8. 用户视觉检查结论

用户于 2026-08-30 确认视觉检查通过：空状态及生效查询条件快照、三弹窗拖动/边界/重开居中、标签左对齐与输入边界、命名弹窗宽度/七列/无分页/Tooltip、策略卡片文案/整卡选择/选中态/前后缀联动、未保存确认框固定居中不可拖动，均符合要求。本次未执行任何保存、创建或删除操作；数据库存在数据，“无查询条件且系统完全无数据”的状态未人工构造，由自动测试覆盖。

## 9. 数据库 / ZooKeeper / 服务访问

- 数据库：视觉检查期间后端服务以只读方式连接既有 Oracle 开发库，未执行写入、删除或 DDL（`database_access_status=READ_ONLY_BY_EXISTING_TESTS_OR_SERVICE`，`database_write_status=NONE`，`ddl_status=NONE`）。
- ZooKeeper：本任务未访问、未写入（`zookeeper_access_status=NONE`，`zookeeper_write_status=NONE`）；ZK 关闭造成的既有测试失败按基准比较处理，未绕过。
- 服务：视觉检查启动后端（:8080）与前端（:5173，`http://192.168.174.70:5173/config/data-source`），用户确认通过后已停止，端口已释放（`service_operation_status=STARTED_FOR_VISUAL_CHECK_THEN_STOPPED`）。
- 临时日志已清理，未发现密码残留。

## 10. 批准基线完整性

- 六份批准文档（REQUIREMENTS / ACCEPTANCE / DESIGN / API / UI / DATABASE）零修改。
- 正式验收状态未回写，未把 FAIL / BLOCKED / NOT_RUN 提前改为 PASS。
- 工作区既有无关内容保持原样，未修改、未覆盖、未暂存、未提交。

## 11. 遗留

- `DS-AC-104`（环境阻塞）仍为 BLOCKED，正式验收复验前保持 FAIL 状态不改变。
- 正式验收用例 `DS-AC-107～115` 仍为 NOT_RUN；`DS-AC-052/105` 文档状态仍为 FAIL（本任务仅完成实现与自动测试，未执行正式复验回写）。

## 12. 结果块

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001
branch=develop
base_commit_id=c93f562ba0c3bd9a525382e8c93fbe4e4d956f88
result_commit_id=b5145a7cf466f9f4da872986caec6e0725b50cf4
requirements_status=APPROVED
acceptance_status=APPROVED
ui_status=APPROVED
current_implementation_status=IMPLEMENTED_PENDING_REVIEW
adjustment_implementation_status=IMPLEMENTED_PENDING_REVIEW
remediation_implementation_status=IMPLEMENTED_PENDING_REVIEW
formal_acceptance_status=FAIL
ds_ac_052_document_status=FAIL
ds_ac_105_document_status=FAIL
ds_ac_104_document_status=BLOCKED
new_adjustment_cases_status=NOT_RUN
password_log_remediation_status=IMPLEMENTED_PENDING_REVIEW
request_type_error_remediation_status=IMPLEMENTED_PENDING_REVIEW
empty_state_adjustment_status=IMPLEMENTED_PENDING_REVIEW
dialog_drag_adjustment_status=IMPLEMENTED_PENDING_REVIEW
form_label_alignment_status=IMPLEMENTED_PENDING_REVIEW
naming_dialog_layout_status=IMPLEMENTED_PENDING_REVIEW
naming_strategy_card_status=IMPLEMENTED_PENDING_REVIEW
backend_targeted_test_status=SUCCESS
backend_full_test_status=SUCCESS_PREEXISTING_FAILURES_ONLY
backend_baseline_comparison_status=SUCCESS
backend_package_status=SUCCESS
frontend_test_status=SUCCESS
frontend_build_status=SUCCESS
user_visual_check_status=PASS
database_access_status=READ_ONLY_BY_EXISTING_TESTS_OR_SERVICE
database_write_status=NONE
ddl_status=NONE
zookeeper_access_status=NONE
zookeeper_write_status=NONE
service_operation_status=STARTED_FOR_VISUAL_CHECK_THEN_STOPPED
business_code_change_status=CHANGED
test_code_change_status=CHANGED
push_status=SUCCESS
ahead_behind=0 0
changed_files=backend/src/main/resources/application-dev.yml,backend/src/main/java/com/bsoft/cdcconfig/datasource/controller/DataSourceController.java,backend/src/test/java/com/bsoft/cdcconfig/datasource/controller/DataSourceControllerTest.java,backend/src/test/java/com/bsoft/cdcconfig/datasource/DataSourcePasswordLogSecurityTest.java,frontend/src/views/data-source/DataSourcePage.vue,frontend/src/views/data-source/dataSource.spec.ts,frontend/src/views/data-source/draggableDialog.ts,docs/features/data-source-management/reports/DATA-SOURCE-POST-ACCEPTANCE-REMEDIATION-001.md
next=CHATGPT_CODE_REVIEW_POST_ACCEPTANCE_REMEDIATION
error=
AGENT_TASK_RESULT_END
```
