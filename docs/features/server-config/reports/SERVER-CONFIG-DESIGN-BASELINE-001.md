# 执行报告：SERVER-CONFIG-DESIGN-BASELINE-001

> 报告状态：`DRAFT_PENDING_USER_REVIEW`
> 任务编号：`SERVER-CONFIG-DESIGN-BASELINE-001`
> Feature 中文名称：中心端配置
> Feature 标识：`server-config`
> 报告日期：2026-08-27
> 任务类型：阶段 4 设计与契约（纯文档候选设计基线建立）
> 数据库访问：不需要，也不允许连接数据库（本任务未连接数据库，未执行任何 SQL）
> 授权基线提交：`c1a6d7dc38de261093383d7abf719f0834dd9bb3`

## 1. 任务状态与结论

本任务按提示词 `SERVER-CONFIG-DESIGN-BASELINE-001-AGENT-PROMPT.md` 为“中心端配置”Feature 建立阶段 4 设计与契约，新建 4 份候选设计文档（`DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`）与 1 份本执行报告，全部保持 `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED`。

任务结论：**完成（待复审）**。5 个授权文件已建立并完成跨文档一致性与 65 条验收覆盖检查，验证通过后已 Commit 并 Push（见 §11）。本任务为纯文档任务，未连接数据库，未执行任何 SQL/DDL，未修改任何既有文件、代码、菜单、路由、配置、数据库或 ZooKeeper。

本任务**没有**批准设计基线：四份设计文档仍为 `DRAFT_PENDING_USER_REVIEW`，待 ChatGPT 复审与项目负责人批准；批准前不得进入实现。设计完成不代表代码已实现，也不代表 65 条验收已执行（全部仍为 `NOT_RUN`）。

## 2. Git 开始状态、授权基线与工作区分类

| 项 | 值 |
|---|---|
| 当前分支 | `develop` |
| 授权基线提交 | `c1a6d7dc38de261093383d7abf719f0834dd9bb3` |
| 本地 HEAD | `c1a6d7dc38de261093383d7abf719f0834dd9bb3`（== 授权基线） |
| origin/develop | `c1a6d7dc38de261093383d7abf719f0834dd9bb3`（== 授权基线） |
| ahead/behind | `0 0` |
| 环境预检 | git 2.47.3、claude 2.1.143、locale en_US.UTF-8，均通过 |

工作区分类（任务开始前记录）：

- 本任务 5 个目标文件在任务开始前均**不存在**，无未提交修改、无重叠冲突，未触发 `BLOCKED_TARGET_FILE_CONFLICT`。
- 工作区存在大量与本任务无关的既有未提交内容（未跟踪提示词/过程材料、已修改菜单与布局等前端文件、已删除历史报告等），全部保持原样，未修改、未覆盖、未暂存、未提交。
- 已批准 `REQUIREMENTS.md`、`ACCEPTANCE.md`、两份既有 Feature 报告、`docs/features/README.md`、项目级与数据库基线、`CLAUDE.md` 均未修改（§10 验证）。

## 3. 读取的权威资料和当前代码事实

本任务按提示词 §3 完整读取：

- 项目级基线：`docs/baseline/PROJECT.md`、`ENVIRONMENT.md`、`ARCHITECTURE.md`、`DEVELOPMENT_RULES.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md`、`FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`（重点：阶段 4 设计与契约、Feature 级 `DATABASE.md` 职责边界）。
- 已批准 Feature 基线：`docs/features/server-config/REQUIREMENTS.md`（`APPROVED`）、`ACCEPTANCE.md`（`APPROVED`，`SC-AC-001~065` 全部 `NOT_RUN`）、`reports/SERVER-CONFIG-FEATURE-BASELINE-001.md`、`reports/SERVER-CONFIG-FEATURE-BASELINE-APPROVAL-001.md`。
- 已批准数据库基线：`docs/database/README.md`、`SCHEMA.md`、`RELATIONS.md`、`DATA_PROFILE.md`、`tables/CDC_SERVER.md`、`tables/CDC_SERVER_CONFIG.md`。
- 当前代码（只读）：后端公共响应 `ApiResponse`、`BusinessException`、`GlobalExceptionHandler`、`PageResult`；`datasource` 模块（Controller/Service/ServiceImpl/Entity/Mapper/Converter/ErrorCode 分层、`@Transactional(rollbackFor=Exception.class)`、MyBatis-Plus `BaseMapper`/`LambdaQueryWrapper`/`LambdaUpdateWrapper` 用法）；`logquery` 模块（Controller 白名单校验、`LogQueryErrorCode` 静态工厂风格）；前端 `services/http.ts`（axios 封装，全局 10 秒超时）、`api/logQuery.ts`、`types/logQuery.ts`、`router/index.ts`（`/config/server` → `ServerConfigPage.vue`）、`views/server-config/ServerConfigPage.vue`（占位页）、`config/menu.ts`（`/config/server` title“服务端配置”）。
- 同类设计参考：`docs/features/log-query/DESIGN.md`、`API.md`、`UI.md`（仅格式与项目惯例参考，未复制日志查询复杂度/状态/过时规则）。

当前代码事实（`OBSERVED_CODE`）：无任何 Java 代码访问 `CDC_SERVER`/`CDC_SERVER_CONFIG`，仓库无中心端配置查询或批量保存接口；`/config/server` 为占位页。

## 4. 5 个目标文件的实际变更清单

| # | 文件 | 操作 | 状态 |
|---|---|---|---|
| 1 | `docs/features/server-config/DESIGN.md` | 新建 | `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED` |
| 2 | `docs/features/server-config/API.md` | 新建 | `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED` |
| 3 | `docs/features/server-config/UI.md` | 新建 | `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED` |
| 4 | `docs/features/server-config/DATABASE.md` | 新建 | `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED` |
| 5 | `docs/features/server-config/reports/SERVER-CONFIG-DESIGN-BASELINE-001.md` | 新建 | `DRAFT_PENDING_USER_REVIEW` |

## 5. 四份设计文档的核心设计摘要

### 5.1 DESIGN.md（`SC-DESIGN-001`～`SC-DESIGN-152`）

- 后端建议包根 `com.bsoft.cdcconfig.serverconfig`（Controller/Service/ServiceImpl/Mapper/Entity/DTO/VO/Converter/Validator/Enum/ErrorCode），沿用 `datasource`、`logquery` 垂直分层风格。
- 前端建议拆分：`ServerConfigPage.vue`、`configRules.ts`（六类 Key 控件元数据 + 规范化/校验单一事实源）、`ConfigValueEditor.vue`、`SaveConfirmDialog.vue`、`api/serverConfig.ts`、`types/serverConfig.ts`。
- 唯一中心端状态模型与页面状态机（`INITIAL/LOADING/SUCCESS_WITH_DATA/SUCCESS_EMPTY/SERVER_NOT_REGISTERED/SERVER_MULTIPLE/LOAD_FAILED/EDITING/HAS_INVALID/CONFIRMING/SAVING/SAVE_SUCCESS_RELOADING/SAVE_FAILED`）。
- 原始值/编辑值/规范化值/脏值定义与转换；批量保存完整处理流；事务/回滚/防重复提交/并发不保护/最后成功保存语义；安全与防绕过；性能判断；未来新增 Key 扩展点；自动化测试设计；非目标与禁止事项。

### 5.2 API.md（`SC-API-001`～`SC-API-101`）

- 统一响应体 `ApiResponse<T>`、`BusinessException` + `GlobalExceptionHandler` 约定；业务错误 HTTP 200 + 业务码。
- 接口清单（最少化，单一方案）：
  - `GET /api/server-config`：查询页面数据，响应 `ServerConfigPageVO{serverId, configCount, items[]}`；`ServerConfigItemVO{idServerConfig, configKey, configDesc, configValue, editable}`；`editable` 为计算布尔，仅控件形态，后端保存时重新校验；不返回原始 `IS_EDITABLE`。
  - `POST /api/server-config/save`：批量保存，请求仅 `[{idServerConfig, configValue}]`；空数组/重复主键/条数上限 200/未知主键/错误归属/不可编辑/未知 Key/非法值全部整批拒绝；成功返回 `code=200`，前端重查。
- 专用错误码表 14 个（`40210/40211` 页面可识别中心端状态；`40220~40226` 参数/值校验；`40420~40423` 记录级业务拒绝；`50030` 服务器错误），与仓库既有码不冲突。
- 请求/响应 JSON 示例（正常有数据、正常空配置、0 中心端、多中心端、合法批量保存、典型失败）；请求级超时（查询 15000ms、保存 30000ms）覆盖全局默认值；前端不自动重试保存；接口无业务幂等键。

### 5.3 UI.md（`SC-UI-DESIGN-001`～`SC-UI-DESIGN-158`）

- 页面结构：顶部信息区（SERVER_ID + 配置项总数，无选择器）+ 两列表格（配置项说明主宽列 + 配置值操作列）+ 底部“保存全部/撤销修改”操作区 + 确认弹窗。
- 显示名称兜底（`SC-UI-18~22`）、Key 信息图标 Tooltip、只读超宽值省略 + 完整 Tooltip、不显示 Key 独立列/可编辑状态/主键/中心端列。
- 六类 Key 具体控件（布尔/枚举下拉、多选、数字输入）与非法当前值降级方案；选用 `el-input` + 数字过滤而非 `el-input-number`（理由见 `SC-UI-DESIGN-053`）。
- 13 态页面状态矩阵、按钮启禁与防重复提交、确认弹窗结构、不自动刷新/不自动重试保存、查询失败主动重试、中文文案、无障碍、人工视觉验收清单，以及与 65 条验收的映射。

### 5.4 DATABASE.md（`SC-DB-001`～`SC-DB-123`）

- 只引用已批准数据库基线（未连接数据库）；`CDC_SERVER` 只用于识别唯一中心端，`CDC_SERVER_CONFIG` 查询全部、只写 `CONFIG_VALUE`。
- 唯一中心端 0/1/多处理、按 `SERVER_ID` 查询全部并按 `CONFIG_KEY ASC` 排序、逻辑 1:N 无物理外键及应用层归属校验、`IS_EDITABLE` 可空无 Check 且应用层精确 `'1'` 判定、`(SERVER_ID,CONFIG_KEY)` 无唯一约束与空/重复 Key 只读保护、`CONFIG_VALUE` 业务非空 + 长度 64 应用层校验。
- 批量保存单事务、按主键重查、逐条校验、更新行数核验、整批回滚；并发不保护与最后成功覆盖；参数化 SQL 逻辑形态；性能判断（不新增索引、不分页、不缓存）；`DDL_STATUS=NONE`。

## 6. 主要技术选择及选择理由

| 选择 | 方案 | 理由 |
|---|---|---|
| 接口数量与形态 | 仅 `GET /api/server-config` + `POST /api/server-config/save` | 接口最少化；查询无参数用 GET；批量保存为动作型批量更新，沿用仓库 POST 承载请求体做法，PUT 语义不适用于批量局部字段更新（`SC-API-021/022`） |
| 可编辑布尔由后端计算返回 | `editable` 布尔 = `IS_EDITABLE='1'` && Key ∈ 白名单 | 单一权威判定，前端直接驱动控件形态；明确只用于控件形态，后端保存仍按主键重查防绕过（`SC-API-032`） |
| 显示名称由前端计算 | 返回 `configDesc`+`configKey`，前端按 `SC-UI-18~22` 兜底 | 显示规则属于 UI 层，避免前后端重复维护兜底逻辑（`SC-UI-DESIGN-040~044`） |
| 批量条数上限 | 200（`MAX_BATCH_SIZE`） | 防御性上限防超长载荷；当前 8 行远小于上限（`SC-API-041`） |
| 数字控件 | `el-input` + 数字过滤，非 `el-input-number` | `el-input-number` 自带 ±/步进/精度格式化，与“禁正负号/科学计数法/小数/前导零”的规范保存值冲突（`SC-UI-DESIGN-053`） |
| 多选规范化 | trim→小写→去重→固定顺序 `doris,oracle,mysql` 子序列→逗号连接 | 满足 `SC-CFG-DBTYPE-04~09`；规范化后仅顺序不同不产生脏值（`SC-AC-032/046`） |
| 中心端状态表达 | 独立业务码 `40210`/`40211`，空配置用 `code=200`+空 `items` | 前端不依赖中文 message 区分状态（`SC-API-016`、`SC-AC-014~016`） |
| 请求级超时 | 查询 15000ms、保存 30000ms，覆盖全局 10 秒默认值 | 同 log-query 做法，不改全局默认值；批量事务更新不被过早截断（`SC-API-090`） |
| 不新增数据库结构 | `DDL_STATUS=NONE`，不新增索引/约束/外键 | `SC-NFR-05`、`SC-NONGOAL-04`；小表一次全量加载，性能可接受（`SC-DB-100~104`） |

## 7. 跨文档一致性和 65 条验收覆盖检查

### 7.1 跨文档一致性检查

| 检查项 | 结果 |
|---|---|
| 四份文档接口路径/方法一致（`GET /api/server-config`、`POST /api/server-config/save`） | 通过 |
| 四份文档 DTO/VO 字段名一致（`serverId/configCount/items/idServerConfig/configKey/configDesc/configValue/editable`） | 通过 |
| 错误码表一致（`40210/40211/40220~40226/40420~40423/50030`），DESIGN/UI/DATABASE 引用同一套码 | 通过 |
| DESIGN 数据流与 API 请求/响应、UI 状态机、DATABASE 事务一致 | 通过 |
| 六类 Key 前后端规范化与校验规则一致（DESIGN §10 / API §6 / UI §9 / DATABASE §10） | 通过 |
| 页面不展示 `IS_EDITABLE`，后端保存依据数据库真实值防绕过 | 通过 |
| 查询异常状态（`40210/40211`）不与正常空配置（`code=200`+空 `items`）混淆 | 通过 |
| 批量保存只传主键与新值；原值仅用于确认展示，不参与并发比较 | 通过 |
| 不把数据库可空写成业务允许空，不把逻辑关系写成物理外键 | 通过 |
| 不把未来设计写成已实现；不把设计完成写成验收通过；65 条验收全部仍为 `NOT_RUN` | 通过 |
| 相对链接可解析；各文档设计编号唯一、稳定、引用可解析（`SC-DESIGN-` / `SC-API-` / `SC-UI-DESIGN-` / `SC-DB-`），章节分组预留空档符合编号策略 | 通过 |

### 7.2 需求/验收覆盖检查（65 条全覆盖，按编号范围映射）

| 验收编号范围 | 数量 | 覆盖设计（DESIGN/API/UI/DATABASE） |
|---|---|---|
| `SC-AC-001~003` 菜单与路由 | 3 | `SC-DESIGN-010/011`、`SC-UI-DESIGN-003~005` |
| `SC-AC-004~012` 页面结构与列布局 | 9 | `SC-DESIGN-031/040~046/070~075`、`SC-API-023~035`、`SC-UI-DESIGN-010~018/020~023/030~034/040~044/060~063` |
| `SC-AC-013~018` 数据加载与异常 | 6 | `SC-DESIGN-040~046/062~066`、`SC-API-016/060/061`、`SC-DB-030~034`、`SC-UI-DESIGN-070~076/083` |
| `SC-AC-019~023`、`SC-AC-065` 可编辑性判定 | 6 | `SC-DESIGN-080/090~094/130~134`、`SC-API-030/032/070/071`、`SC-DB-050~055/060~063`、`SC-UI-DESIGN-050~058` |
| `SC-AC-024~026` 布尔配置 | 3 | `SC-DESIGN-081`、`SC-API-046`、`SC-UI-DESIGN-050` |
| `SC-AC-027~028` 原始消息存储策略 | 2 | `SC-DESIGN-082`、`SC-UI-DESIGN-051` |
| `SC-AC-029~033` 数据库类型多选 | 5 | `SC-DESIGN-083`、`SC-API-046`、`SC-UI-DESIGN-052` |
| `SC-AC-034~036` 快照批次大小 | 3 | `SC-DESIGN-084`、`SC-UI-DESIGN-053` |
| `SC-AC-037~038` 源表删除策略 | 2 | `SC-DESIGN-085`、`SC-UI-DESIGN-054` |
| `SC-AC-039~040` 当前只读配置 | 2 | `SC-DESIGN-080`、`SC-UI-DESIGN-058` |
| `SC-AC-041~042` 通用非空与物理长度 | 2 | `SC-DESIGN-086/090~094`、`SC-API-066~068`、`SC-DB-060~063` |
| `SC-AC-043~047` 编辑、撤销与脏值 | 5 | `SC-DESIGN-050~056/070~075`、`SC-UI-DESIGN-090~094` |
| `SC-AC-048~051` 保存确认框 | 4 | `SC-DESIGN-053~056`、`SC-UI-DESIGN-100~104` |
| `SC-AC-052~061` 后端校验与事务 | 10 | `SC-DESIGN-057~060/100~108`、`SC-API-040~049/062~073`、`SC-DB-070~076/080~083/110/111` |
| `SC-AC-062~064` 安全与非目标 | 3 | `SC-DESIGN-110~114/150~152`、`SC-API-032/074/075`、`SC-UI-DESIGN-060~063`、`SC-DB-120~123` |

上述 15 组覆盖全部 `SC-AC-001`～`SC-AC-065`（65 条），每条至少可追溯至一项 DESIGN/API/UI/DATABASE 设计；未复制 65 条全文。65 条验收全部保持 `NOT_RUN`。

## 8. 待确认项

| 编号 | 待确认项 |
|---|---|
| SC-PENDING-001 | 无。当前 `PENDING_USER_CONFIRMATION` 数量为 0。 |

说明：四份设计中的技术实现选择（接口路径与方法、批量上限 200、请求级超时、数字控件选择、`editable` 计算布尔、显示名称前端计算等）均不改变已批准业务语义，已按项目惯例给出单一推荐方案并记录理由，不制造无必要的待确认项。设计未发现需要改变已批准 `REQUIREMENTS.md`/`ACCEPTANCE.md` 语义的冲突点。

## 9. 数据库、DDL、ZooKeeper、代码、构建副作用声明

```text
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_access_status=NONE
business_code_change_status=NONE
build_status=NOT_RUN_NOT_REQUIRED
```

本任务未连接数据库，未执行任何查询或写操作（SELECT/INSERT/UPDATE/DELETE/MERGE/CREATE/ALTER/DROP/TRUNCATE/COMMENT/GRANT/REVOKE/PL-SQL）；未连接 ZooKeeper，未执行任何节点操作；未修改任何业务代码、测试、配置、菜单、路由或占位页；未修改 `docs/baseline/**`、`docs/database/**`、`docs/features/README.md`、已批准 `REQUIREMENTS.md`/`ACCEPTANCE.md`、既有 Feature 报告或 `CLAUDE.md`。纯 Markdown 文档任务，未执行 Maven/npm 构建（`NOT_RUN_NOT_REQUIRED`）。

## 10. 验证命令和实际结果

| 验证项 | 命令/方式 | 结果 |
|---|---|---|
| 仅新增 5 个授权文件 | `git status --short` + `git diff --name-only` + `git diff --cached --name-only` | 通过：工作区除既有无关改动外，仅 5 个新建目标文件 |
| 空白错误 | `git diff --check` | 通过：无空白错误 |
| 四份设计文档状态 `DRAFT_PENDING_USER_REVIEW` | 逐份检查元数据表 | 通过 |
| 四份文档实现状态 `NOT_STARTED` | 逐份检查元数据表 | 通过 |
| 已批准 `REQUIREMENTS.md`、`ACCEPTANCE.md` blob/内容未改变 | `git status --short`（无这两文件修改） | 通过 |
| `SC-AC-001~065` 连续、唯一、未执行 | 读取 `ACCEPTANCE.md` 分类表与用例编号 | 通过：65 条，全部 `NOT_RUN` |
| 设计编号唯一、稳定、引用可解析（章节分组预留空档符合编号策略） | 逐份检查 `SC-DESIGN-`/`SC-API-`/`SC-UI-DESIGN-`/`SC-DB-` 编号定义唯一、引用可解析 | 通过 |
| 跨文档一致性（路径/字段/错误码） | 四份文档交叉核对 | 通过（见 §7.1） |
| Markdown 相对链接可解析 | 检查文档内相对链接目标存在 | 通过 |
| 无尖括号伪结果占位符 | 全文检索 `<COMMIT_ID>` 等模式 | 通过 |
| 未创建 Feature README、未修改 `docs/features/README.md` | `git status --short` | 通过 |
| 未修改业务代码/测试/配置/数据库文档/项目基线 | `git status --short` | 通过 |

## 11. Commit/Push 执行情况

- 授权范围：仅 §4 的 5 个文件；逐文件精确暂存，未使用 `git add .` / `git add -A`。
- 提交信息：`docs(server-config): establish feature design baseline`。
- 推送：普通 `git push origin develop`，未使用 force push。
- 推送后核验：`HEAD == origin/develop`，`git rev-list --left-right --count HEAD...origin/develop` 为 `0 0`；本提交只包含 5 个授权文件；工作区所有范围外既有修改仍原样保留，未被暂存或提交。

说明：本报告自身的最终 Commit ID 无法在同一 Commit 内自洽生成，故本报告记录授权基线与候选设计状态；本任务最终 `result_commit_id`、`remote_commit_id`、`ahead_behind` 在控制台 `AGENT_TASK_RESULT` 中输出。本报告不保留任何伪装成实际结果的尖括号占位符。

## 12. 下一步

本任务在 5 个候选文档建立、验证、Commit 并 Push 后立即停止。

下一步仅允许：ChatGPT 直接读取远程报告与四份候选设计文档进行复审；复审通过后由项目负责人决定是否批准设计基线（阶段 5 设计批准）。批准前不得：

- 将四份设计文档改为 `APPROVED`；
- 修改已批准需求或验收基线；
- 创建 Feature `README.md`；
- 编写任何前后端或测试代码；
- 连接或修改数据库、ZooKeeper；
- 启动服务或进入联调、验收；
- 生成下一阶段实现提示词。

---

## 13. R1 复审修订记录（SERVER-CONFIG-DESIGN-BASELINE-001-R1）

> R1 任务编号：`SERVER-CONFIG-DESIGN-BASELINE-001-R1`
> R1 授权基线提交：`53d74c19e31c4068963e7b3c50c12073e9ebad8f`
> R1 报告日期：2026-08-27
> R1 复审结论：ChatGPT 复审为 `REQUIRES_CHANGES`（本 R1 按提示词 §5 十类问题定向修订）
> R1 任务类型：阶段 4 候选设计基线复审修订（纯文档）
> R1 数据库访问：不需要，也不允许连接数据库（未连接数据库，未执行任何 SQL）
> R1 变更文件：仅本报告 + `DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md` 共 5 个授权文件

### 13.1 R1 修订范围与状态

R1 只修订 4 份候选设计文档与本执行报告，不修改已批准 `REQUIREMENTS.md` / `ACCEPTANCE.md`，不进入代码实现。四份设计文档继续保持 `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED`；`REQUIREMENTS.md`/`ACCEPTANCE.md` 保持 `APPROVED`；65 条验收用例继续全部保持 `NOT_RUN`。初始报告 §5.2 的“错误码 14 个”与 §5.3 的“13 态页面状态矩阵”为初始任务历史记录；R1 后专用错误码为 **15 个**、页面状态为 **14 个**（见 §13.3），以 R1 为准。

### 13.2 §5 十类问题的修正结论与落点

| # | R1 问题 | 原问题 | 修正结论 | 落点 |
|---|---|---|---|---|
| 5.1 | 额外请求字段唯一确定为“整批拒绝” | DESIGN `SC-DESIGN-111` 与 API `SC-API-042` 写“忽略或拒绝”两种行为，可能忽略额外字段仍更新 `CONFIG_VALUE`，不符合 `SC-AC-056` | 顶层与每个 `ServerConfigSaveItem` 仅允许契约字段；出现任何未允许字段，后端在进入数据库写入前**整批拒绝**，不得忽略后继续保存；新增错误码 `40227 REQUEST_FIELD_NOT_ALLOWED`（message=“批量保存请求包含不允许的字段”，HTTP 200）；给出 Feature 局部严格反序列化方向（`@JsonAnySetter` 收集额外字段统一判空，不改全局 Jackson 行为）；`idServerConfig`/`configValue` 必须为 JSON 字符串，类型不符按请求格式/参数错误拒绝 | API `SC-API-042/050/051/052/074/076`、§6.2 步骤 1；DESIGN `SC-DESIGN-111`；DATABASE `SC-DB-072`①；报告 §13.3 |
| 5.2 | NULL/重复 Key 稳定排序与可编辑性 | 仅 `ORDER BY CONFIG_KEY ASC` 无法保证重复 Key 稳定次序；DATABASE `SC-DB-054` 把“重复 Key 或空 Key”整体写成只读，违反双重可编辑判定 | 排序唯一确定为 `ORDER BY CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC`（`ID_SERVER_CONFIG` 仅作稳定 Tie-breaker）；NULL/空 Key 不在白名单故只读；重复 Key 全部完整展示，每条记录仍独立按 `IS_EDITABLE='1'` 且 Key ∈ 白名单判定可编辑，**重复本身不导致只读**；不新增唯一约束、不做数据清理 | API `SC-API-034`；DESIGN `SC-DESIGN-046/121`；DATABASE `SC-DB-034/054/091` |
| 5.3 | API 示例主键必须满足 VARCHAR2(32) | JSON 示例 `SC0000000000000000000000000000001` 长度 33，违反 `ID_SERVER_CONFIG VARCHAR2(32)` | 全部示例主键替换为 32 字符字符串（`00000000000000000000000000000001/02/04`）；“主键全程按字符串处理”规则不变；验证自动检查示例 ID 长度 ≤32 | API §8 全部 JSON 示例 |
| 5.4 | CONFIG_VALUE 长度校验与规范化顺序唯一一致 | API 先校验长度再做 Key 规范化；DESIGN `SC-DESIGN-072` 又写“长度校验基于规范化值”，超过 64 字符原始请求是否可经去重/trim 后继续保存无唯一答案 | 校验顺序唯一确定：① JSON 字符串类型 → ② NULL → ③ trim 后非空 → ④ **原样提交长度** ≤64 → ⑤ 按 Key 解析/规范化/值域校验 → ⑥ 规范化后最终值非空且 ≤64；任一步失败整批拒绝；不得把数据库异常或截断当长度校验 | API `SC-API-052`、§6.2 步骤 4；DESIGN `SC-DESIGN-072/076`；DATABASE `SC-DB-061/072` |
| 5.5 | 保存确认框“原值”必须展示最近成功加载的真实原值 | DESIGN `SC-DESIGN-074` 与 UI `SC-UI-DESIGN-104` 规定原值/新值都展示规范化值，掩盖数据库实际原值 | 原值 = 最近成功加载的 `rawValue` 原文，不脱敏，NULL/空 → “（空值）”；新值 = `canonicalValue`；多选新值按固定顺序；Key 仅 Tooltip；确认框只列实际变更项；补充脏值判定与当前非法值纠正规则（非法当前值不得因前端自动规范化被静默视为合法；已支持且可编辑的非法当前值仍可纠正，修正前不能保存；多选仅顺序/大小写/首尾空格/重复等已批准差异按 canonical 集合比较避免伪脏值；`snapshotBatchSize` 非法原始格式如前导零不得在用户未操作时被静默修复） | DESIGN `SC-DESIGN-074/095`；UI `SC-UI-DESIGN-059/104/105` |
| 5.6 | UI 必须选择单一、可实现的布局方案 | UI 存在 `el-card 或 el-container`、`el-table 或自定义行布局`、`固定或页脚`等多套备选 | 采用单一确定方案：外层单个 `el-card`；主体 `el-table` 恰好两列（“配置项说明”“配置值”）；说明列 `min-width` 占剩余空间自然换行；配置值列常规桌面约 360px、较窄桌面收缩下限约 300px、控件宽度 100%；操作区表格下方右对齐、非 sticky/non-fixed；较窄桌面保持两列无横向溢出；确认弹窗仍用 `el-dialog`；同步更新人工视觉验收要点 | UI `SC-UI-DESIGN-010/012/013/017/020~023/153` |
| 5.7 | 增加“保存已成功、重新加载失败”独立状态 | 原设计把“保存成功→重查”作为连续成功路径，未定义 POST 成功但 GET 重载失败的状态 | 新增独立状态 `SAVE_SUCCEEDED_RELOAD_FAILED`：POST 明确成功即数据库已提交，后续 GET 失败不提示“保存失败”；文案“保存成功，但最新配置加载失败，请重试加载”；“重试加载”按钮仅重调 GET，不自动重发保存；重载成功前禁用编辑与再次保存；GET 重试成功后以最新结果重建原始值并恢复正常状态；保存请求自身失败/超时仍按原设计（不自动重试、保留编辑、由用户决定再次提交） | DESIGN `SC-DESIGN-063/067`；UI `SC-UI-DESIGN-081/084/139`；API `SC-API-054` |
| 5.8 | 数据库异常映射唯一，不引用未定义错误码 | DATABASE `SC-DB-111` 写 `SAVE_FAILED 50030`“或 `DATABASE_ACCESS_FAILED` 风格”，API 未定义 `DATABASE_ACCESS_FAILED` | 保存过程数据库异常：确保事务回滚，映射为已定义 `SAVE_FAILED=50030`，不返回堆栈/SQL，不新增 `DATABASE_ACCESS_FAILED`，不保留“或”方案；查询过程未捕获数据库异常：沿用 `GlobalExceptionHandler` HTTP 500 + `code=500` +“服务器内部错误”，前端进入 `LOAD_FAILED`；设计说明实现时须保证捕获保存异常后仍抛运行时 `BusinessException`（或等价异常）使 `@Transactional` 回滚，不得吞异常返回成功 | DATABASE `SC-DB-111/112`；DESIGN `SC-DESIGN-109`；API `SC-API-053` |
| 5.9 | 修正未来阶段授权边界 | DESIGN `SC-DESIGN-151` 把“启动服务进行联调/验收”写成整个实现阶段永久禁止，范围过宽 | 本 R1 纯文档任务不启动服务、不构建、不联调、不验收；后续实现/构建/启动/联调/验收是否允许以各阶段独立 Agent 提示词与人工授权为准；数据库写入无论哪个阶段都遵守项目审批规则，不得把本任务无写授权扩大为未来永远禁止验证，也不提前授权未来写库；DDL/结构变更仍明确不属于本 Feature | DESIGN `SC-DESIGN-151`；报告 §13.7 |
| 5.10 | 修正编号验证报告与语义错引 | 编号按章节预留区间分组、全局存在空档，报告却声称“编号连续、唯一”；`SC-DESIGN-004/025/029` 语义错引 | 不重编号现有规则；四份文档明确编号策略（按章节分组预留区间、定义唯一、引用可解析、同一小节内部递增，不要求全局无空档）；报告与验证项把“连续、唯一”修正为“唯一、稳定、引用可解析；章节分组预留空档符合编号策略”；自动验证无重复定义、无引用不存在的编号；修正语义错引（`SC-DESIGN-004` → API 接口清单 `SC-API-020/040`；`SC-DESIGN-025` → API 响应字段 `SC-API-023~030`；`SC-DESIGN-029` → 完整现行错误码表含 `40227`） | API §10、DESIGN §18、UI §19、DATABASE §17 编号策略段落；DESIGN `SC-DESIGN-004/025/029`；报告 §7.1/§10/§13.6 |

### 13.3 错误码与契约变化汇总

- 专用错误码总数由 **14** 更新为 **15**：新增 `40227 REQUEST_FIELD_NOT_ALLOWED`（“批量保存请求包含不允许的字段”，HTTP 200）；完整错误码表见 `API.md` §7（`40210`、`40211`、`40220~40227`、`40420~40423`、`50030`），`SC-API-074` 已同步。
- 排序唯一确定为 `ORDER BY CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC`；重复 Key 与空 Key 均完整展示，重复不导致只读，空 Key 不在白名单故只读。
- 批量保存请求出现任何未允许字段即整批拒绝（`40227`），不忽略、不部分保存。
- 长度校验顺序唯一化：原样提交长度 ≤64 → 按 Key 规范化/值域校验 → 规范化后非空且 ≤64；确认框原值 = rawValue 原文（NULL/空 →“（空值）”）、新值 = canonicalValue；UI 采用单一可实现的 `el-card` + 两列 `el-table` 布局。
- 新增独立状态 `SAVE_SUCCEEDED_RELOAD_FAILED`（保存成功但重载失败，仅“重试加载” GET）。
- 数据库异常映射唯一：保存异常 → 回滚 → `SAVE_FAILED 50030`；查询异常 → HTTP 500/`code=500` → `LOAD_FAILED`；不新增 `DATABASE_ACCESS_FAILED`。
- 未来阶段授权边界：本 R1 纯文档任务不启动/不构建/不联调/不验收；后续阶段以各自独立提示词与人工授权为准；DDL 仍排除。

### 13.4 当前待确认项

| 编号 | 待确认项 |
|---|---|
| SC-PENDING-001 | 无。当前 `PENDING_USER_CONFIRMATION` 数量为 0（R1 修订未新增待确认项，未改变已批准需求/验收语义）。 |

### 13.5 数据库、DDL、ZooKeeper、代码、构建副作用声明（R1）

```text
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_access_status=NONE
business_code_change_status=NONE
build_status=NOT_RUN_NOT_REQUIRED
```

R1 未连接数据库，未执行任何 SQL/写操作/DDL；未连接 ZooKeeper；未修改任何业务代码、测试、配置、菜单、路由或占位页；未修改 `docs/baseline/**`、`docs/database/**`、`docs/features/README.md`、已批准 `REQUIREMENTS.md`/`ACCEPTANCE.md` 或 `CLAUDE.md`；纯 Markdown 文档任务，未执行 Maven/npm 构建（`NOT_RUN_NOT_REQUIRED`）。

### 13.6 编号策略与验证声明修正

R1 明确编号策略为：四份文档编号按章节分组、预留区间编号，要求“定义唯一、引用可解析、同一小节内部递增”，不要求从最小值到最大值全局无空档。本报告原 §7.1 与 §10 中的“设计编号连续、唯一”表述已修正为“唯一、稳定、引用可解析；章节分组预留空档符合编号策略”。R1 自动验证：无重复定义编号、无引用不存在的编号、示例主键长度 ≤32、无尖括号伪结果占位符。

### 13.7 下一步（R1）

R1 修改、验证、Commit、Push 后立即停止。

下一步仍只能由 ChatGPT 直接核对远程 R1 提交并复审；R1 复审通过后，再由项目负责人决定是否批准四份设计基线。R1 通过并由项目负责人批准前不得：

- 将四份设计文档改为 `APPROVED`；
- 修改已批准需求或验收基线；
- 创建 Feature `README.md`；
- 编写任何前后端或测试代码；
- 连接或修改数据库、ZooKeeper；
- 启动服务或进入联调、验收；
- 生成下一阶段实现提示词。
