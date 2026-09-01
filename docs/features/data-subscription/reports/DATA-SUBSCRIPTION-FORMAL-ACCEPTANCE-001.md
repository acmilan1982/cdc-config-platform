# 数据订阅正式验收报告（DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001）

## 1. 任务元数据与基准提交

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001` |
| Feature | 数据订阅（`data-subscription`） |
| 任务目标 | 对 126 条正式验收用例（`DSUB-AC-001 ~ DSUB-AC-126`）逐条执行并取得客观证据，更新验收状态，归档证据，形成正式验收报告 |
| 开发分支 | `develop` |
| 基准提交 | `1f24cbbf94b828a28a2e1b7ee966992e83350bcc` |
| 验收状态 | 126 条全部 `PASS`，0 `FAIL`，0 `BLOCKED`，0 `NOT_RUN` |
| 证据目录 | `docs/features/data-subscription/evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001/` |
| 验收后实现状态 | `IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_REVIEW`（正式验收已执行，待 ChatGPT 正式复审；**不是** `IMPLEMENTED_ACCEPTED`） |

本任务结果提交号由后续提交产生，本报告不预填、不虚构结果提交号。

## 2. 执行环境和时间

- 执行环境：CDC 配置管理平台内网开发服务器，Linux；JDK 8（`/usr/java/latest`）；Maven（`/usr/local/maven`）；Node.js（`/opt/node`）；Oracle Instant Client（`/opt/oracle/instantclient`）；ZooKeeper 客户端（`/opt/zookeeper/zookeeper-3.4.14`）。
- 执行时间：2026-09-01 至 2026-09-02。
- 环境预检：`git`、`claude`、`java`、`javac`、`mvn`、`node`、`npm`、`sqlplus` 均通过（后端/前端/数据库任务必检项）。`locale` 正常。
- 数据库：内网开发库 Oracle 19c（`CDC` schema，`192.168.174.65:1521`）。
- 真实源库：`112-source-19c`（孝感市第一人民医院，category=source，fg_active=1）。

## 3. Git 初始状态与无关现场保护

任务开始前执行 `git status --short`、`git branch --show-current`、`git rev-parse HEAD`，确认：

- 当前分支为 `develop`；
- 基准提交为 `1f24cbbf94b828a28a2e1b7ee966992e83350bcc`；
- 工作区存在任务开始前已有的无关修改，本任务**全程未触碰**，保持原样、不暂存、不提交：
  - `.claude/settings.local.json`、`agent-env.sh`
  - `docs/database/TASK3_FINAL_REVISION_REPORT_20260806.md`、`TASK4_EXECUTION_REPORT_20260807.md`、`TASK4_WARN_TEST_FINAL_REPORT_20260807.md`（已删除状态）
  - `frontend/index.html`、`frontend/src/config/menu.ts`、`frontend/src/layouts/HeaderBar.vue`、`MainLayout.vue`、`Sidebar.vue`、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`
  - 未跟踪目录：`docs/agent-prompts/**`、`docs/baseline-work/**`、`docs/code/**`、`docs/database/**`、`docs/features/app-shell/**`、`docs/features/large-screen/**`、`docs/large-screen/**`、`docs/pages/**`、`docs/prompts/**`、`docs/screenshots/**`、`docs/task-reports/**`、`docs/zookeeper/**`、`frontend/src/api/subscription.spec.ts`（本任务测试代码）、`frontend/src/styles/theme.css`、`frontend/src/views/large-screen/mock-data.ts`、`package-lock.json`
- 本任务仅新增/修改 §17 授权范围内文件。

## 4. 已批准基线状态

| 基线 | 状态 | 说明 |
|---|---|---|
| 需求基线 `REQUIREMENTS.md` | `APPROVED` | 未修改 |
| 验收基线 `ACCEPTANCE.md` | `APPROVED` | 本任务仅更新状态列与执行汇总，业务列零变化 |
| 设计基线 `DESIGN.md` | `APPROVED` | 未修改 |
| API 基线 `API.md` | `APPROVED` | 未修改 |
| UI 基线 `UI.md` | `APPROVED` | 未修改 |
| 数据库设计基线 `DATABASE.md` | `APPROVED` | 未修改 |

五份正式基线（REQUIREMENTS/DESIGN/API/UI/DATABASE）相对基准提交零 diff（`git diff` 核验通过），本任务未做任何基线修改。

## 5. 服务启动/复用/恢复情况

- 后端：Spring Boot 2.7.18，`spring.profiles.active=dev`，启动方式 `mvn spring-boot:run`，监听 `0.0.0.0:8080`，PID 2725。
- 前端：Vite dev server，监听 `0.0.0.0:5173`，代理 `/api` → `http://127.0.0.1:8080`，PID 2675；页面入口 `http://127.0.0.1:5173/config/subscribe`。
- 服务用于真实 HTTP API 验收与真实浏览器验收；验收数据写入后已按 §18 完成数据库恢复；本任务启动的服务与进程在收尾阶段停止，任务前已有服务保持原状态。

## 6. 数据库授权、备份表前置核验

- 数据库写操作（临时目标库 `DSUB-FA-001-TARGET-*` / `DSUB-FA-001-TGT.DOT`、`CDC_DATA_SUBSCRIBE` 测试种子、HTTP 流程写入、备份恢复、临时目标清理）**均已获得人工明确审批**，审批状态 `APPROVED_AND_EXECUTED`（含句点 ID 临时目标库 `DSUB-FA-001-TGT.DOT` 补充授权）。
- 前置核验（只读）：
  - `CDC_DATA_SUBSCRIBE` 当前行数 12；备份表 `CDC_DATA_SUBSCRIBE_2026_08_31` 行数 12；
  - 两表物理列清单一致（12 列，按 column_id 顺序）；
  - `CDC_DATA_SUBSCRIBE` 主键 = `DATA_SUB_ID`（与 `DATABASE.md` `DATA_SUB_ID` 主键基线 `DATABASE_VERIFIED` 一致，对应 `DSUB-AC-123`）；
  - 源库 `112-source-19c` 存在：category=source、fg_active=1、org=孝感市第一人民医院；
  - 启用且类别匹配 SOURCE 候选：`112-source-19c`（孝感市第一人民医院）、`5905f1ce…`（杭州市第一人民医院）、`my-19c`（本机的oracle）；停用源 `199-source` 不出现；
  - 启用且类别匹配 TARGET 候选：`target-doris-v4`、`my-target-doris-v4`、`company-target-doris-v4`。

## 7. 后端定向测试和跳过测试打包结果

- 定向测试命令：
  `mvn test -Dtest='SubscriptionServiceImplTest,SubscriptionControllerTest,SourceMetadataServiceImplTest,SubscriptionCsvHelperTest,DataSourceTableParserTest,SubscriptionConverterTest,SubscriptionErrorCodeTest' -Dsurefire.failIfNoSpecifiedTests=false`
- 结果：`BUILD SUCCESS`；`Tests run: 138, Failures: 0, Errors: 0, Skipped: 0`（7 个测试类）：
  - `SubscriptionServiceImplTest` 53、`SubscriptionControllerTest` 16、`SourceMetadataServiceImplTest` 17、`SubscriptionCsvHelperTest` 25、`DataSourceTableParserTest` 11、`SubscriptionConverterTest` 12、`SubscriptionErrorCodeTest` 4。
- 打包：`mvn clean package -DskipTests`（后端目录 `backend`），`BUILD SUCCESS`，产物 `target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`（47644987 字节）；校验 jar 内含 `SubscriptionController.class`，数据订阅后端代码已编入。

## 8. 未运行后端全量测试的原因

按任务 Prompt §8 要求，本任务**不运行完整 `mvn test`**，只运行数据订阅定向测试。完整测试中的 `JobFailureServiceTest` / `OracleDateMappingTest` 为依赖开发库实时数据/运行态的既有环境性失败，与数据订阅功能无关。因此后端全量测试状态为 `NOT_RUN_OUT_OF_SCOPE`（范围外未运行），定向测试全绿。

## 9. 前端定向、全量测试和构建结果

- 定向测试命令：`npx vitest run src/views/data-subscribe src/api/subscription.spec.ts`。
  结果：`Test Files 8 passed (8)；Tests 141 passed (141)`：
  - `SubscribeFormDialog.spec.ts` 33、`SourceTableSelector.spec.ts` 34、`DataSubscribePage.spec.ts` 13、`api/subscription.spec.ts` 17、`utils/subscriptionFormat.spec.ts` 23、`SubscribeDeleteDialog.spec.ts` 7、`composables/useSubscribeForm.spec.ts` 9、`SubscribeDetailDialog.spec.ts` 5。
- 全量测试：`npx vitest run`。结果：`Test Files 23 passed (23)；Tests 376 passed (376)`（数据订阅相关 141 + 其余非数据订阅 spec 235，全绿，无回归）。
- 构建：`npm run build`。结果：`✓ built in 23.34s`（BUILD SUCCESS），产物 `frontend/dist/`。仅提示部分 chunk > 500 kB 的体积警告，不影响构建成功。

## 10. 10 项真实 HTTP API 结果

后端 `http://127.0.0.1:8080`，全部 10 项能力通过（成功 + 关键失败场景），响应已脱敏归档于 `evidence/.../http/*.json`：

1. **查询候选 `GET /api/subscriptions/options`**：源库候选仅启用且类别匹配（`112-source-19c`、`5905f1ce…`、`my-19c`，停用源 `199-source` 不出现）；目标库候选启用且类别匹配（`DSUB-FA-001-TARGET-01/02`、`company-target-doris-v4`、`my-target-doris-v4`、`target-doris-v4`，停用目标 `DSUB-FA-001-TARGET-03` 不出现）；句点 ID 目标 `DSUB-FA-001-TGT.DOT` 正常出现在候选。
2. **订阅列表 `GET /api/subscriptions`**：空条件返回启用记录按 `NVL(UPDATE_TIME, INSERT_TIME) DESC`；`FG_ACTIVE=0` 记录不出现；响应为 `items + queryWarnings`；源库/目标库过滤、组内 OR、组间 AND、句点 ID 精确匹配（前缀不误匹配）、逗号候选 `AMBIGUOUS_COMMA_ID` 歧义警告均符合预期；列表 VO 无遗留字段、无并发令牌。
3. **订阅详情 `GET /api/subscriptions/{id}`**：正常记录 `AC008A` source NORMAL、3 目标 NORMAL、`tablesBySchema=[His/his/VSM]` 大小写保持；`AC044` 源停用 → `INACTIVE` + 警告；`AC045` 源不存在 → `NOT_FOUND` + 警告；`AC046` 目标停用 → 目标 `INACTIVE` + 警告；多源异常 `ANOM` 详情 → code=40352“多源库异常记录不支持查看”；详情 VO 无遗留字段。
4. **Schema 元数据 `GET /api/subscriptions/metadata/schemas?dataSourceId=112-source-19c`**：返回 `filterMode=ORACLE_MAINTAINED`、`schemas=[CDC_USER, SPT_HIS_2023]`（真实源库，过滤系统 Schema）。
5. **表清单元数据 `GET /api/subscriptions/metadata/tables?dataSourceId=112-source-19c&schema=…`**：`CDC_USER` → 1 表（LOG_MINING_FLUSH）；`SPT_HIS_2023` → 9 表（OPT_FEE 等），仅普通表。
6. **新增 `POST /api/subscriptions`**：成功返回 32 位无连字符十六进制 UUID；DB 核对 `DATA_TO_SOURCE_ID` 双目标逗号连接、`DATA_SOURCE_TABLE` 多表逗号连接无换行、`FG_ACTIVE=1`、`INSERT_TIME=SYSDATE` 且 `UPDATE_TIME` 空、遗留字段 `NULL`；跨行完全重复新增成功；失败批次（HTTP 200 + code=40300 + 结构化 `validationErrors`；请求契约错误 HTTP 400）覆盖：空源、逗号源、逗号表名、句点表名、记录内重复表、重复目标库、源不存在/停用、目标不存在/停用、类别不匹配、表/Schema 不存在、空描述、超长描述、无表、空 Schema、POST 携带非法 mode。
7. **编辑打开 `GET /api/subscriptions/{id}/edit`**：回显 desc、source NORMAL、targets、`tablesBySchema`、`sourceReachable=True`、`sourceTableCheck=CHECKED`、`invalidTables=[]`。
8. **编辑保存 `PUT /api/subscriptions/{id}`**：REPLACE 重写 `DATA_SOURCE_TABLE`、`INSERT_TIME` 不变、`UPDATE_TIME=SYSDATE`；PRESERVE 不重写源表；遗留字段保持原值（`UPDATE SET` 不含遗留字段，SC）；有限编辑（PRESERVE）改源被拒（40312）；多源异常编辑 → 40350。
9. **删除预览 `GET /api/subscriptions/{id}/delete-preview`**：返回 `dataSubId/desc/source/schemaCount/tableCount/targets/warnings`，无并发令牌；多源异常预览 → 40353；不存在 → 40430。
10. **物理删除 `DELETE /api/subscriptions/{id}`**：成功无 body，删除后 GET → 40430；多源异常删除 → 40351；不存在 → 40430。

## 11. 真实源库 `112-source-19c` 元数据验证结果

- 真实源库 `112-source-19c`（孝感市第一人民医院）存在且启用（category=source、fg_active=1）。
- Schema 元数据真实读取：仅返回当前账号可访问、含普通表的非系统 Schema（`CDC_USER`、`SPT_HIS_2023`），过滤系统 Schema（`DSUB-AC-075/077`）。
- 表清单元数据真实读取：仅普通表，不含视图/物化视图/同义词（`DSUB-AC-077/092`）。
- 响应与后端日志不泄露数据库口令或完整连接串（`DSUB-AC-075/119`）。

## 12. 真实浏览器 1K/2K 验证结果

headless Google Chrome（CDP 自动化，真实渲染），前端 `http://127.0.0.1:5173/config/subscribe`（Vite dev，代理 `/api` → `127.0.0.1:8080`），视口 1440×900 与 2048×768，证据归档于 `evidence/.../browser/*.png / *.json`：

- **列表页（两个视口）**：首次加载渲染 12 条启用记录，控制台零 error；列顺序（订阅描述、源库、源表、目标库、更新时间、操作）；源库机构主显示 + ID 悬停；源表“共 N 张”（同源第一条/跨行完全重复 → 共 3 张）；目标库标签折叠（1440×900 下 +2 折叠，2048×768 下 3 目标同排平铺）；更新时间空值回退 `INSERT_TIME` 并标记“创建时间”；异常数据源展示（`AC044` 源停用、`AC045` 源不存在、`AC046` 目标停用）；多源异常行整行警示、无查看/编辑/删除按钮。
- **查询区**：严格两个多选下拉（源库/目标库，组内 OR）；源库候选项不含停用源 `199-source`；选择 `112-source-19c` 点击“查询”过滤为 10 条；点击“重置”表单清空、列表保持上一次已生效查询结果（符合 `DSUB-AC-037`）。
- **详情弹窗（1K/2K）**：展示源库、3 目标库、按 Schema 分组的表清单（大小写保持）、无遗留字段；多源异常行不提供查看入口（详情接口 40352）。
- **新增弹窗（1K/2K）**：表单项为订阅描述/源库/目标库/源表；目标库卡片两行紧凑排布，`DSUB-FA-001-TGT.DOT` 卡片禁用并显示“保留字符”原因；Schema/表选择器区域存在。
- **控制台**：全部交互步骤后 `error=0`（`console-*.json` 为空数组）。
- 精细交互（Shift 连选、全选/取消/只看已选/清空、120~240 表容量、表名模糊搜索、弹窗拖动边界、脏关闭二次确认、保存失败逐条展示）由前端定向/全量自动化测试覆盖，浏览器层对弹窗结构与关键流程做真实渲染抽查。

## 13. 126 条逐条状态与证据映射表

全部 126 条验收用例状态更新为 `PASS`。逐条证据映射见：

- `docs/features/data-subscription/ACCEPTANCE.md`（§4 各用例状态列与 §5 覆盖说明）；
- `docs/features/data-subscription/evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001/coverage-matrix.md`（验收 ID → 证据来源完整映射）。

证据来源缩写：`BT`（后端定向测试 138/138）、`FT`（前端定向 141/141 与全量 376/376）、`HTTP`（真实 HTTP API 10 项能力）、`BR`（真实浏览器 1K/2K）、`DB`（真实数据库授权 DML + 备份恢复）、`SC`（静态契约核对：代码只读核对、API/DATABASE 基线逐项核对、前后端零 diff）、`REP`（已批准历史报告补充证据）。

## 14. PASS / FAIL / BLOCKED 汇总

| 状态 | 数量 |
|---|---|
| PASS | 126 |
| FAIL | 0 |
| BLOCKED | 0 |
| NOT_RUN | 0 |
| **合计** | **126** |

## 15. 失败或阻塞项

无。126 条全部 PASS，无 FAIL、无 BLOCKED。

## 16. 临时目标库清理结果

- 本任务创建临时目标库 `DSUB-FA-001-TARGET-01`、`-02`、`-03`、`DSUB-FA-001-TGT.DOT`（FG_ACTIVE=1/0，密码为占位符，不真实连接）。
- 备份恢复后清理核验：`DSUB-FA-001-TARGET-*` / `DSUB-FA-001-TGT.DOT` 临时目标库残留 = **0**（`temporary_target_remaining_count=0`）。

## 17. `CDC_DATA_SUBSCRIBE` 从备份恢复结果及双向差异核验

单事务恢复：`DELETE ALL` → `INSERT SELECT`（显式 12 列清单）→ 核验 12 行 → `COMMIT`。

恢复后只读核验：

- 当前表行数 12 = 备份表行数 12；
- 标量列双向 `MINUS` 均 0（`subscription_minus_backup_count=0`、`backup_minus_subscription_count=0`）；
- 主键集合双向差异均 0；
- 4 个 CLOB 列 `DBMS_LOB.COMPARE` + 长度不一致数 0；
- 本任务测试 ID 残留（`DATA_SUB_ID` / `DATA_SUB_DESC` 含 `DSUB-FA-001-`）为 0；
- 临时目标库剩余 0。

## 18. 数据库、服务和进程最终状态

- `CDC_DATA_SUBSCRIBE`：已完整恢复至备份表 `CDC_DATA_SUBSCRIBE_2026_08_31` 状态（12 行），无测试残留。
- 临时目标库：已清理，剩余 0。
- 本任务启动的服务与进程：收尾阶段已停止（后端 PID 2725、前端 PID 2675）；任务前已有服务保持原状态。
- 未执行 DDL；`ddl_status=NONE`。

## 19. 未操作 sync-client/Kafka/ZooKeeper/大屏

- 全程未操作 sync-client、未操作 Kafka Topic、未操作 ZooKeeper（`zookeeper_access_status=NONE`、`kafka_operation_status=NONE`、`sync_client_operation_status=NONE`）。
- 未修改大屏相关代码或大屏基线；大屏修正仍按 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` 延期（`DSUB-AC-121/122`）。

## 20. 当前实现状态与下一入口

- 当前实现状态：`IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_REVIEW`（正式验收已执行，126 条全部 PASS；待 ChatGPT 对正式验收结果提交进行正式复审；**不是** `IMPLEMENTED_ACCEPTED`）。
- 下一入口：**ChatGPT 对正式验收结果提交进行正式复审**。
  - 正式复审通过后，才允许执行最终验收接受收口并更新为 `IMPLEMENTED_ACCEPTED`；
  - 若存在 FAIL：先生成独立缺陷修复任务，修复并复审后只重验受影响用例及必要回归；
  - 若存在 BLOCKED：先解除阻塞，再执行定向补验；
  - 大屏逻辑修正仍等待数据订阅 Feature 正式验收接受后另行执行。
