# 数据订阅后端实现 R1 定向修订报告

- 任务编号：`DATA-SUBSCRIPTION-BACKEND-IMPLEMENTATION-001-R1`
- 任务类型：ChatGPT 对后端实现提交 `c15b68a370263877822516603356634647e41e4b` 正式代码复审结论 `CHANGES_REQUIRED` 驱动的后端定向修订
- 分支：`develop`
- 基准提交：`c15b68a370263877822516603356634647e41e4b`
- 报告时间：2026-08-31

---

## 1. 任务结论

依据已批准的数据订阅功能基线（`docs/features/data-subscription/` 下 REQUIREMENTS、ACCEPTANCE、DESIGN、API、UI、DATABASE）、`docs/prompts/data-subscription/DATA-SUBSCRIPTION-BACKEND-IMPLEMENTATION-001-R1-AGENT-PROMPT.md` 及 ChatGPT 正式复审结论，本次 R1 定向修订按提示词 §3 精确修正三项复审问题：

- **§3.1 新增成功响应契约**：新增 `SubscriptionCreateVO`（仅 `dataSubId`），`POST /api/subscriptions` 返回 `ApiResponse<SubscriptionCreateVO>`，`data` 为对象而非裸字符串。
- **§3.2 源库 ID 保留字符分类**：`SubscriptionServiceImpl#validatePayload` 先对 trim 后原始 `dataFromSourceId` 做英文逗号/英文句点校验，命中即结构化 `40316`（`field=dataFromSourceId`、`name` 为完整 trim 后 ID）；空值仍按 `40312`；历史多源库异常规则（`splitTrimDropEmpty(...).size() >= 2`）不变。
- **§3.3 Schema 批量复核按 Schema 去重**：`SourceMetadataServiceImpl#validateAgainstSource` 使用保持首次出现顺序的 `LinkedHashSet<String>` 真正去重，普通表与物化视图两个批量 SQL 共用同一份去重 Schema 列表，同一 Schema 选 120 张表不再生成 120 个重复占位符/绑定参数。

- **定向测试**：3 个目标测试类 **86/86 通过**（Controller 16、SubscriptionServiceImpl 53、SourceMetadataServiceImpl 17）。
- **模块测试**：`com.bsoft.cdcconfig.subscription.**` 全包 **138/138 通过**（7 个测试类）。
- **编译/打包**：编译通过；`mvn package -DskipTests` **BUILD SUCCESS**，生成 `cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`。
- **完整测试**：`mvn clean package` 共 **860 个**，**3 个失败 + 1 个错误**，与基准提交 `c15b68a` worktree 复跑结果逐项一致（`JobFailureServiceTest` ×3、`OracleDateMappingTest` ×1，均为依赖开发库实时数据/运行态的既有环境性失败），**新增失败 = 0**（详见 §6）。
- `git diff --check` 通过；未新增任何并发令牌、指纹、行锁设计；未引入新第三方依赖；未访问真实数据库、未执行真实 DDL/DML、未操作 ZooKeeper/Kafka/sync-client、未启动任何服务。
- 实现状态：**IMPLEMENTED_PENDING_REVIEW**；前端尚未实现，126 条正式验收全部 **NOT_RUN**。

本任务只代表三项复审问题修正与自动化测试完成，不代表整个 Feature 完成，未进行任何验收。

## 2. Git 开始状态与基线

任务开始前记录并核验：

| 项目 | 值 |
|---|---|
| 当前分支 | `develop` |
| 本地 HEAD | `c15b68a370263877822516603356634647e41e4b` |
| 远程 `origin/develop` | `c15b68a370263877822516603356634647e41e4b`（与基准一致，ahead/behind=`0 0`，未触发 `BLOCKED_BASE_CHANGED`） |
| `git status --short` | 保存完整开始快照；存在大量任务前既有已修改与未跟踪内容（`frontend/**`、`.claude/settings.local.json`、`agent-env.sh`、`docs/database/TASK*` 删除、`docs/agent-prompts/**` 未跟踪等），全部原样保留，未清理、未覆盖、未暂存、未提交 |

核验命令：

```bash
git branch --show-current
git rev-parse HEAD
git status --short
```

## 3. 三项复审问题：根因、修正与证据

### 3.1 新增成功响应不符合已批准 API 契约（复审 §3.1）

**根因**：`SubscriptionController#create` 直接 `ApiResponse.success(subscriptionService.create(dto))`，Service 返回裸字符串，故 `data` 为字符串；前端按 `API.md §4.6` 的 `data.dataSubId` 契约读取会失败。

**修正**：

- 新增 `vo/SubscriptionCreateVO.java`（仅 `dataSubId` 字段，类名唯一、语义清晰）。
- `SubscriptionController#create` 返回类型改为 `ApiResponse<SubscriptionCreateVO>`，并包裹 `new SubscriptionCreateVO(subscriptionService.create(dto))`。
- Service 继续返回 `String` 不变。

**证据**：

- `SubscriptionControllerTest#create_shouldReturnDataSubIdAsObject` 断言 `$.code=200`、`$.data` 为 JSON 对象（`isMap()`，即不是字符串）、`$.data.dataSubId="uuid32..."`。

### 3.2 源库 ID 含英文逗号时错误分类不符合保留字符规则（复审 §3.2）

**根因**：`SubscriptionServiceImpl#validatePayload` 先对 `dataFromSourceId` 调 `splitTrimDropEmpty`，原始值 `A,B` 先得到两个 token 命中 `tokens.size() != 1` 返回 `40312`，永远无法进入 `40316` 保留字符分支；`name` 也不会是完整 ID。

**修正**：

- 对非空 trim 后的 `dataFromSourceId` 先做英文逗号/英文句点保留字符校验：`containsComma(trimmed) || trimmed.indexOf('.') >= 0` 命中即 `errorItem("40316", "dataFromSourceId", trimmed, "名称含协议保留字符（英文逗号或英文句点），不能用于订阅配置")`，`name` 为完整 trim 后 ID。
- 空值（null / trim 后为空）仍按 `40312`。
- 不再先拆分，因此含逗号 ID 不再错报 `40312`。
- 历史订阅记录多源库异常识别规则（针对数据库中已保存 CSV 字段的 `splitTrimDropEmpty(...).size() >= 2`）未改动：列表整行警示、详情 `40352`、编辑打开 `40350`、编辑保存 `40350`、删除预览 `40353`、物理删除 `40351`、PRESERVE 源库变更 `40312` 等既有测试全部保留并继续通过。

**证据**：

- `create_sourceContainsComma_returns40316Not40312`：源库 `A,B` → `40316`，字段 `dataFromSourceId`，`name="A,B"`，message 含「协议保留字符」，且断言无 `40312`。
- `create_sourceContainsDot_returns40316`（强化）：源库 `S.01` → `40316`，`name="S.01"`。
- `update_sourceContainsComma_returns40316` / `update_sourceContainsDot_returns40316`：编辑保存同样覆盖 `A,B` 与 `A.B`。
- `create_emptySourceId_returns40312` / `create_structuralErrors_collectItems`：空源库仍按 `40312`，字段 `dataFromSourceId`。

### 3.3 保存前批量复核没有真正按 Schema 去重（复审 §3.3）

**根因**：`SourceMetadataServiceImpl#validateAgainstSource` 中 `new ArrayList<>(new LinkedHashSet<>())` 先构造空 Set 再转空 List，随后仍把每张表的 Schema 逐项加入 List；同一 Schema 选 120 张表会生成 120 个重复占位符和绑定参数，不符合「一次连接、按 Schema 批量复核」口径并放大 Oracle `IN` 参数。

**修正**：

- 使用保持首次出现顺序的 `LinkedHashSet<String>` 收集唯一 Schema，再转 `List<String>` 作为批量 SQL 参数。
- 普通表批量 SQL（`buildBatchNormalSql`）与物化视图批量 SQL（`buildBatchMviewSql`）使用同一份去重后列表（占位符数量、`bindSchemas` 绑定均基于唯一 Schema 数）。
- 不改变 Schema/表名大小写，不改为逐表连接或逐表查询。

**证据**：

- `validateTables_dedupsSchemasAndBindsOnceInFirstOccurrenceOrder`：输入 5 张表（Schema 首次出现顺序 `SCHEMA_B,SCHEMA_A,SCHEMA_C`，共 3 个唯一），断言两个批量 SQL 的 `?` 占位符数均为 3、`PreparedStatement#setString` 次数均为 3，且绑定索引 `1,2,3`、绑定值按首次出现顺序各一次。
- `validateTables_oneSchemaManyTables_generatesSingleSchemaPlaceholder`：同一 Schema 120 张表，断言两个批量 SQL 占位符数均为 1、`setString` 各仅 1 次、绑定 `1,"SCHEMA_A"`，证明不会生成 120 个重复 Schema 参数。

## 4. 实际修改文件清单（严格处于授权范围）

| 文件 | 类型 | 用途 |
|---|---|---|
| `backend/src/main/java/com/bsoft/cdcconfig/subscription/vo/SubscriptionCreateVO.java` | 新增 | §3.1 新增成功响应 VO（仅 `dataSubId`） |
| `backend/src/main/java/com/bsoft/cdcconfig/subscription/controller/SubscriptionController.java` | 修改 | §3.1 create 返回 `ApiResponse<SubscriptionCreateVO>` |
| `backend/src/main/java/com/bsoft/cdcconfig/subscription/service/impl/SubscriptionServiceImpl.java` | 修改 | §3.2 validatePayload 保留字符优先级修正 |
| `backend/src/main/java/com/bsoft/cdcconfig/subscription/service/impl/SourceMetadataServiceImpl.java` | 修改 | §3.3 LinkedHashSet Schema 去重 |
| `backend/src/test/java/com/bsoft/cdcconfig/subscription/controller/SubscriptionControllerTest.java` | 修改 | §3.1 断言 `$.data` 为对象 + `$.data.dataSubId` |
| `backend/src/test/java/com/bsoft/cdcconfig/subscription/service/SubscriptionServiceImplTest.java` | 修改 | §3.2 `A,B`/`A.B`/空源库/编辑保存测试 + 历史异常测试保留 |
| `backend/src/test/java/com/bsoft/cdcconfig/subscription/service/SourceMetadataServiceImplTest.java` | 修改 | §3.3 去重顺序测试 + 同一 Schema 120 表边界测试 |
| `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-BACKEND-IMPLEMENTATION-001-R1.md` | 新增 | 本任务报告 |

未修改 `docs/features/README.md`（项目既定任务治理无明确更新要求，与 `001` 任务行为一致）；未修改 REQUIREMENTS/ACCEPTANCE/DESIGN/API/UI/DATABASE 任何批准基线。

## 5. 测试与验证结果

### 5.1 定向测试

```text
SubscriptionControllerTest      Tests run: 16,  Failures: 0, Errors: 0
SubscriptionServiceImplTest     Tests run: 53,  Failures: 0, Errors: 0
SourceMetadataServiceImplTest   Tests run: 17,  Failures: 0, Errors: 0
--------------------------------------------------------------
定向测试合计                      86 个，全部通过
```

### 5.2 模块测试（`com.bsoft.cdcconfig.subscription.**`）

```text
7 个测试类合计 Tests run: 138, Failures: 0, Errors: 0, Skipped: 0
```

### 5.3 编译与打包

```text
编译：通过（完整测试阶段已编译全部主/测试源码）
mvn package -DskipTests：BUILD SUCCESS
产物：target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar
```

### 5.4 完整测试与基准对照

| 项目 | 当前（含 R1） | 基准 worktree（`c15b68a`） | 说明 |
|---|---|---|---|
| 测试总数 | 860 | 854 | 当前比基准多 6 个（R1 新增 6 个测试） |
| 失败 + 错误 | 3 + 1 | 3 + 1 | 完全相同的 4 个测试 |
| 失败测试 | `OracleDateMappingTest.oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly`、`JobFailureServiceTest.failureDetail_eventNotInFaultProcess_shouldThrow`、`JobFailureServiceTest.latestFaultShouldHaveCorrectRestartCount`、`JobFailureServiceTest.failureDetailByEvent_shouldReturnContent` | 与左侧逐项一致 | 依赖开发库实时数据/运行态的既有环境性失败 |
| **新增失败** | **0** | - | 基准 worktree 复跑同一命令并逐项证明基准等价 |

新增 R1 测试共 6 个：Controller 0（仅改断言）、SubscriptionServiceImpl +4、SourceMetadataServiceImpl +2（`854 + 6 = 860`）。

### 5.5 其余必检项

- POST 成功 JSON 精确为对象结构：`$.data` 断言 `isMap()` 且 `$.data.dataSubId` 存在（§5.1 Controller 测试）。
- 源库 `A,B` 与 `A.B` 均返回结构化 `40316`，`name` 保留完整原值：§5.1 Service 测试（新增与编辑保存共 4 个用例）。
- 同 Schema 120 表仅生成 1 个 Schema 占位符/绑定；多个 Schema 按首次出现顺序各绑定一次：§5.1 SourceMetadata 测试。
- 历史 `DATA_FROM_SOURCE_ID='S01,S02'` 列表/详情/编辑/删除异常防护不回退：既有测试全部继续通过（`list_*anomalyRetention`、`detail 40352`、`editOpen 40350`、`update 40350`、`deletePreview 40353`、`delete 40351`、`update PRESERVE 源库变更 40312`）。
- 未新增任何并发令牌、指纹、行锁设计：`noConcurrencyVersionTokenOrRowLockFields`、`errorCodes_haveNoConcurrentModified40910` 继续通过；对本次新增代码行扫描 `version/token/fingerprint/for update/rowlock/40910` 结果 NONE。
- `git diff --check`：通过（无空白错误）。

## 6. 数据库/基础设施与服务操作状态

| 项目 | 状态 |
|---|---|
| 真实数据库访问 | NONE（未连接开发 Oracle，未访问真实源库/备份恢复） |
| DDL / DML | NONE |
| ZooKeeper | NONE（未连接、未读写） |
| Kafka | NONE |
| sync-client | NONE（未通知、未重启、未操作） |
| 业务服务启动 | NONE（未启动任何前后端服务） |
| 前端改动 | NONE |

## 7. 无关工作区修改保护

任务开始前已存在的全部无关修改与未跟踪内容均原样保留，未清理、未覆盖、未暂存、未提交、未回滚，包括：

- `frontend/**`（`index.html`、`menu.ts`、`HeaderBar.vue`、`MainLayout.vue`、`Sidebar.vue`、`stores/app.ts`、`styles/global.css` 等）
- `.claude/settings.local.json`、`agent-env.sh`
- `docs/database/TASK3_FINAL_REVISION_REPORT_20260806.md`、`TASK4_EXECUTION_REPORT_20260807.md`、`TASK4_WARN_TEST_FINAL_REPORT_20260807.md` 删除
- `docs/agent-prompts/**` 未跟踪文件

提示词文件 `docs/prompts/data-subscription/DATA-SUBSCRIPTION-BACKEND-IMPLEMENTATION-001-R1-AGENT-PROMPT.md` 与一切任务前既有内容一律不纳入本次提交。

## 8. Git 提交与推送

按提示词 §7 执行：

- 仅逐文件暂存 §5 授权范围内文件，禁止 `git add .` / `git add -A`；不 force push。
- Commit message 体现「后端实现 R1 定向修订」，不写成 Feature 已完成或验收通过。
- 普通推送至 `origin/develop`；推送后核验本地 HEAD、远端跟踪分支、远程 develop 一致且 ahead/behind=`0 0`。
- 本报告不含结果提交/远程 SHA（报告本身为提交产物，无法自引用），由 Agent 最终会话输出块在推送完成后给出。

## 9. 状态边界

- 后端实现状态：**IMPLEMENTED_PENDING_REVIEW**（本 R1 仅为代码与自动化测试定向修订）。
- 前端实现状态：**IN_PROGRESS_FRONTEND_NOT_STARTED**（仍未实现）。
- 正式验收执行状态：**NOT_RUN**（126 条全部未执行）。
- 大屏适配：**DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE**（未修改大屏逻辑）。
- 本任务不宣称 Feature 完成，未进行任何验收。

成功完成后唯一下一入口：ChatGPT 对 R1 结果提交进行正式代码复审，不得直接进入前端实现或真实数据库集成测试。
