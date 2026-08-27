# 中心端配置逻辑设计（DESIGN）

## 1. 文档元数据与状态

| 项目 | 值 |
|---|---|
| 正式功能标识 | `server-config` |
| 目标文档 | `docs/features/server-config/DESIGN.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW` |
| 需求基线状态 | `APPROVED` |
| 验收基线状态 | `APPROVED` |
| 实现状态 | `NOT_STARTED` |
| 设计任务 | `SERVER-CONFIG-DESIGN-BASELINE-001` |
| 授权基线提交 | `c1a6d7dc38de261093383d7abf719f0834dd9bb3` |
| 依据需求 | `docs/features/server-config/REQUIREMENTS.md`（已批准） |
| 关联契约 | `docs/features/server-config/API.md`、`UI.md`、`DATABASE.md`（四文档使用同一接口、字段、错误码与状态模型） |
| 创建日期 | 2026-08-27 |

声明：本文档为**候选设计基线**，待 ChatGPT 与项目负责人复审，不能自行批准。设计完成不代表代码已实现，也不代表 65 条验收用例已执行（全部仍为 `NOT_RUN`）。若实现前发现必须改变已批准业务语义，不得在本设计中静默处理，应记录为 `PENDING_USER_CONFIRMATION` 并停止提交设计结论；纯技术实现选择在不改变业务语义的前提下，本文档给出单一推荐方案并说明理由。

## 2. 设计边界与输入

| 编号 | 规则 |
|---|---|
| SC-DESIGN-001 | 本文只确定应用结构、请求/处理/数据流、状态模型、事务与并发边界、安全与防绕过、性能与测试设计，以及用于追溯的设计编号。最终数据库物理结构不做任何变更（`SC-DB-001`、`SC-NFR-05`）。 |
| SC-DESIGN-002 | 本文全部业务语义以已批准的 `REQUIREMENTS.md`（`SC-MENU-*`、`SC-UI-*`、`SC-SERVER-*`、`SC-DISPLAY-*`、`SC-EDIT-*`、`SC-CFG-*`、`SC-READONLY-*`、`SC-DIRTY-*`、`SC-CONFIRM-*`、`SC-BATCH-*`、`SC-STATE-*`、`SC-NFR-*`、`SC-NONGOAL-*`）为唯一来源，通过需求编号引用建立追踪关系，不复制整份需求。 |
| SC-DESIGN-003 | 当前仓库不存在中心端配置的任何后端接口、前端正式页面或数据库访问（`OBSERVED_CODE`，已批准数据库基线 `CDC_SERVER.md` §8、`CDC_SERVER_CONFIG.md` §8 核验）；本文全部组件、流程、接口均为未来目标（`FUTURE_FEATURE_TARGET`），不得写成已实现。 |
| SC-DESIGN-004 | 设计遵循“接口最少化”原则：只提供“查询页面数据”与“批量保存配置值”两个业务接口（见 `API.md` `SC-API-011/012`），不引入额外的中心端选择、配置项增删、历史、搜索、分页或生效控制接口（`SC-NONGOAL-01~10`）。 |

## 3. 当前占位实现与目标实现事实分层

| 编号 | 事实层 | 内容 |
|---|---|---|
| SC-DESIGN-010 | `OBSERVED_CODE` | 前端路由 `/config/server`（name `ServerConfig`，title“服务端配置”，group“配置管理”）指向占位页；菜单项 `/config/server` title“服务端配置”；页面 `views/server-config/ServerConfigPage.vue` 为 `PlaceholderPage`，无数据访问；无任何 Java 代码访问 `CDC_SERVER`/`CDC_SERVER_CONFIG`，无相关接口。 |
| SC-DESIGN-011 | `FUTURE_FEATURE_TARGET` | 菜单显示名称改为“中心端配置”（`SC-MENU-01/02`），路由保持 `/config/server`（`SC-MENU-03`）；页面正式实现查询唯一中心端、展示全部配置、受控编辑并批量保存；只查询 `CDC_SERVER`、查询并修改 `CDC_SERVER_CONFIG` 既有记录的 `CONFIG_VALUE`。 |
| SC-DESIGN-012 | `OBSERVED_DATABASE` | 开发库 `CDC_SERVER` 1 行（`Server001`）、`CDC_SERVER_CONFIG` 8 行；`IS_EDITABLE` 分布 6 个 `'1'`、2 个 `'0'`；当前数据无空 Key、无重复 Key、无孤立引用。以上为数据快照，不得写成数据库约束或生产常态。 |
| SC-DESIGN-013 | 分层约定 | 文档与实现不得把未来目标写成已实现；不得把“当前开发库恰好一条中心端/八个配置”写成数据库强制唯一或强制非空；所有校验（`IS_EDITABLE='1'`、白名单、值域、非空与长度）均为应用层规则（`FUTURE_FEATURE_TARGET`）。 |

## 4. 后端建议包结构与各层职责

包根：`com.bsoft.cdcconfig.serverconfig`（沿用仓库 `datasource`、`logquery`、`jobfailure` 的垂直分层风格；不新建跨功能公共模块）。

| 编号 | 层/类（草案） | 职责 | 边界 |
|---|---|---|---|
| SC-DESIGN-020 | `controller/ServerConfigController` | 协议接入、URL 绑定、HTTP 层基础参数校验、委托 Service；`@Tag` / `@Operation` / `@Parameter` Swagger 注解 | 不做业务规则判断、不拼 SQL（同 `LogQueryController` 风格） |
| SC-DESIGN-021 | `dto/ServerConfigSaveRequest`、`dto/ServerConfigSaveItem` | 批量保存 JSON 请求体绑定（`@RequestBody`） | 只承载 `idServerConfig` + `configValue`；禁止携带 Key、描述、原值、编辑标志或中心端 ID（`SC-BATCH-01`） |
| SC-DESIGN-022 | `service/ServerConfigService` + `impl/ServerConfigServiceImpl` | 唯一中心端识别、配置查询与排序、批量保存全流程校验与事务更新、DTO/VO 转换、错误码抛出 | 无状态；`@Transactional` 只落在批量保存方法 |
| SC-DESIGN-023 | `mapper/CdcServerMapper`、`mapper/CdcServerConfigMapper` | `BaseMapper<CdcServer>` / `BaseMapper<CdcServerConfig>`（MyBatis-Plus，同 `DataSourceMapper` 风格）；必要时补充按 `SERVER_ID` 查询、按主键更新的方法 | 只接收绑定参数与固定实体；不做动态表名 |
| SC-DESIGN-024 | `entity/CdcServer`、`entity/CdcServerConfig` | 对应 `CDC_SERVER` / `CDC_SERVER_CONFIG` 的 MyBatis-Plus 实体；`@TableId`/`@TableField` 映射 | 字段类型遵循数据库基线：主键/关联字段为 `String` |
| SC-DESIGN-025 | `vo/ServerConfigPageVO`、`vo/ServerConfigItemVO` | 查询响应组装；见 `API.md` `SC-API-021/022` | `idServerConfig`、`serverId` 为 `String`；`editable` 为计算布尔（仅控件形态） |
| SC-DESIGN-026 | `converter/ServerConfigConverter` | Entity → VO、DTO → 更新参数的映射（同 `DataSourceConverter` 风格） | 不含业务校验 |
| SC-DESIGN-027 | `validator/ServerConfigValueValidator` | 六类已支持 Key 的专门校验 + 通用非空与物理长度校验 + 多选规范化；提供静态方法供 Service 调用 | 单一事实源，与前端 `configRules.ts` 规则一致（`SC-EDIT-04`） |
| SC-DESIGN-028 | `enums/ServerConfigEditableKey` | 已支持可编辑白名单（6 个 Key）的封闭枚举与静态查找 | 新增 Key 必须前后端同步扩展（`SC-EDIT-03`） |
| SC-DESIGN-029 | `exception/ServerConfigErrorCode` | 错误码常量与返回 `BusinessException` 的静态工厂（风格同 `LogQueryErrorCode` / `DataSourceErrorCode` / `JobFailureErrorCode`） | 码值见 `API.md` `SC-API-060~070`，不与仓库既有码冲突 |
| SC-DESIGN-030 | `config/`（如需要） | 可编辑白名单与批量上限等常量集中放置 | 不引入与当前任务无关的配置项 |

## 5. 前端建议文件与组件拆分

保持适度，不为 8 条记录过度拆分。

| 编号 | 文件/组件（草案） | 职责 |
|---|---|---|
| SC-DESIGN-031 | `views/server-config/ServerConfigPage.vue` | 页面状态机、查询/保存流程、顶部信息区、两列主体列表、底部操作区 |
| SC-DESIGN-032 | `views/server-config/configRules.ts` | 六类已支持 Key 的控件元数据（控件类型、选项、显示文案）与规范化/校验函数；前端单一事实源（`SC-EDIT-04`） |
| SC-DESIGN-033 | `views/server-config/components/ConfigValueEditor.vue` | 按 Key 渲染对应控件（布尔/枚举/多选/整数输入），承载编辑值与校验提示 |
| SC-DESIGN-034 | `views/server-config/components/SaveConfirmDialog.vue` | 保存确认弹窗：只列实际变更项，展示显示名称/原值/新值，Key 通过信息图标 Tooltip 查看 |
| SC-DESIGN-035 | `api/serverConfig.ts`、`types/serverConfig.ts` | 两个接口的前端封装与 TS 类型（对齐 `API.md` 字段名），请求级超时覆盖全局默认值，不改全局配置 |

## 6. 页面初始化和查询数据流

| 编号 | 步骤 |
|---|---|
| SC-DESIGN-040 | 进入 `/config/server`（菜单或直接访问），页面进入 `LOADING` 状态，调用 `GET /api/server-config`（`SC-API-020`）。 |
| SC-DESIGN-041 | 响应 `code=200`：读取 `data.serverId`、`data.configCount`、`data.items`；按展示规则渲染（`SC-UI-01~22`、`SC-DISPLAY-01~08`）。`items` 非空 → `SUCCESS_WITH_DATA`；`items` 为空 → `SUCCESS_EMPTY`（`SC-SERVER-05`）。 |
| SC-DESIGN-042 | 响应业务错误码 `40210` → 页面进入 `SERVER_NOT_REGISTERED`：显示“中心端尚未注册，请先启动 sync-server”，不加载配置、无编辑控件、“保存全部”不可用（`SC-SERVER-03`）。 |
| SC-DESIGN-043 | 响应业务错误码 `40211` → 页面进入 `SERVER_MULTIPLE`：显示“检测到多个中心端，当前功能仅支持唯一中心端”，不加载配置、不编辑、不保存（`SC-SERVER-04`）。 |
| SC-DESIGN-044 | 其余错误/HTTP 失败/超时 → 页面进入 `LOAD_FAILED`：显示可理解错误与“重试”按钮；用户主动点击才重新查询（`UI.md` `SC-UI-DESIGN-110~114`）。 |
| SC-DESIGN-045 | 页面不自动刷新、不轮询；首次加载与保存成功后重载是仅有的两次查询时机（`SC-DIRTY-06`）。 |
| SC-DESIGN-046 | 列表按 `CONFIG_KEY` 升序由后端排序返回（`SC-DISPLAY-02`）；前端不再重新排序，保持与后端一致。 |

## 7. 批量保存完整处理流

| 编号 | 步骤（前端 → 后端 → 前端） |
|---|---|
| SC-DESIGN-050 | 用户编辑一条或多条可编辑配置；页面维护“最近一次成功加载”的原始值与当前编辑值（`SC-DIRTY-02`）。 |
| SC-DESIGN-051 | 编辑值先经规范化（多选 trim/小写/去重/固定顺序；布尔/枚举/数字按控件产生规范形式），得到“规范化值”（`SC-DESIGN-070~075`）。 |
| SC-DESIGN-052 | 脏值判断：规范化值 ≠ 规范化后的原始值 → 该行实际变化（`SC-DIRTY-03`）；无任何实际变化时“保存全部”“撤销修改”不可用（`SC-DIRTY-04`）。 |
| SC-DESIGN-053 | 点击“保存全部”：先执行整页前端校验（每个已变化/已编辑行的非空、长度、专门规则）。存在非法值 → 不弹确认框、不提交，显示校验错误（`SC-CONFIRM-01`、`SC-DISPLAY-07`）。 |
| SC-DESIGN-054 | 校验通过 → 弹出确认框，只列实际变更项，展示显示名称/原值/新值，Key 走信息图标 Tooltip（`SC-CONFIRM-02`）。 |
| SC-DESIGN-055 | 取消 → 不发请求，保留全部编辑内容（`SC-CONFIRM-03`）。 |
| SC-DESIGN-056 | 确认 → 页面进入 `SAVING`，禁用保存/撤销/编辑控件，发送一次 `POST /api/server-config/save`，请求只携带 `[{idServerConfig, configValue}]`（`SC-CONFIRM-04`、`SC-BATCH-01`）。 |
| SC-DESIGN-057 | 后端收到请求：HTTP 层基础校验（非空、条数上限、重复主键、主键格式）→ 重新识别唯一中心端（0/1/多）→ 逐条按主键重读真实记录 → 归属/`IS_EDITABLE`/Key 白名单/值校验（`SC-BATCH-02/03/04`、`SC-EDIT-05`）。 |
| SC-DESIGN-058 | 全部通过 → 同一数据库事务内按主键更新 `CONFIG_VALUE`，逐条核验更新行数（`SC-BATCH-05`、`SC-DB-070~076`）；任一失败 → 抛异常整批回滚（`SC-BATCH-06`）。 |
| SC-DESIGN-059 | 保存成功 → 返回 `ApiResponse.success()`；前端提示成功 → 重新调用查询接口，重新加载结果成为新的原始值（`SC-STATE-01`、`SC-AC-060`）。 |
| SC-DESIGN-060 | 保存失败 → 前端提示可理解错误（不泄露底层堆栈），数据库已整批回滚，页面保留用户编辑内容（`SC-STATE-02`、`SC-NFR-02`）。 |
| SC-DESIGN-061 | 保存成功后不触发、不提示、不调用 `sync-server` 重启，不判断配置是否已生效（`SC-STATE-04`、`SC-NONGOAL-05`）。 |

## 8. 唯一中心端状态模型和页面状态机

| 编号 | 规则 |
|---|---|
| SC-DESIGN-062 | 唯一中心端状态由后端在查询与保存两个入口分别独立识别（`SC-SERVER-01~06`）：`CDC_SERVER` 0 条 → `SERVER_NOT_REGISTERED`（`40210`）；恰 1 条 → 正常；>1 条 → `SERVER_MULTIPLE`（`40211`）。不得自动选择第一条。 |
| SC-DESIGN-063 | 页面状态机：`INITIAL` → `LOADING` → `SUCCESS_WITH_DATA` / `SUCCESS_EMPTY` / `SERVER_NOT_REGISTERED` / `SERVER_MULTIPLE` / `LOAD_FAILED`；编辑后进入 `EDITING`（存在非法值时叠加 `HAS_INVALID`）；保存流程为 `CONFIRMING` → `SAVING` → `SAVE_SUCCESS`（短暂提示后重载）或 `SAVE_FAILED`（保留编辑）。 |
| SC-DESIGN-064 | 状态不得仅依赖中文 message 判断：前端以响应 `code` 区分 `40210`/`40211`（页面可识别状态）与普通参数/业务错误；`code=200` + `items.length===0` 才是“正常空配置”，不得与中心端异常混淆（`SC-AC-016`）。 |
| SC-DESIGN-065 | `SERVER_NOT_REGISTERED` / `SERVER_MULTIPLE` / `SUCCESS_EMPTY` 状态下，“保存全部”与“撤销修改”均不可用，且不发起任何保存请求（`SC-SERVER-06`）。 |
| SC-DESIGN-066 | 保存成功重载后清除全部脏值与编辑状态；保存失败保留脏值与编辑内容，用户可修改后重试（`SC-STATE-02`）。 |

## 9. 前端原始值、编辑值、规范化值、脏值的定义与转换

| 编号 | 规则 |
|---|---|
| SC-DESIGN-070 | **原始值（rawValue）**：最近一次成功加载时数据库返回的 `configValue` 原样；进入页面或保存成功后重载即更新（`SC-DIRTY-02`）。 |
| SC-DESIGN-071 | **编辑值（editValue）**：用户在当前控件中输入/选择的原始内容；未编辑时等于控件按原始值初始化的展示值。 |
| SC-DESIGN-072 | **规范化值（canonicalValue）**：按该 Key 专门规则对编辑值（或原始值）规范化后的最终可保存形式：布尔为精确小写 `true/false`；枚举为精确大写值；多选为 trim→小写→去重→固定顺序 `doris,oracle,mysql` 子序列→逗号连接；数字为标准十进制字符串（去除首尾空格与前导零）；长度校验与值域校验基于规范化值。 |
| SC-DESIGN-073 | **脏值判断**：一行是否实际变化 = 该行规范化后的编辑值 ≠ 规范化后的原始值（`SC-DIRTY-03`）。仅选择顺序不同的多选集合规范化后相等，不产生修改（`SC-CFG-DBTYPE-09`、`SC-AC-032/046`）。 |
| SC-DESIGN-074 | 确认框展示的原值/新值使用规范化值（多选展示规范化后的固定顺序字符串），保证用户所见与最终保存一致。 |
| SC-DESIGN-075 | 规范化不修改数据库原值；只有保存提交的 `configValue` 使用规范化值。撤销恢复原始值（`SC-DIRTY-05`）。 |

## 10. 六类 Key 的控件选择、前后端规则映射及未知 Key 默认只读策略

| 编号 | 规则 |
|---|---|
| SC-DESIGN-080 | 可编辑判定 = 数据库 `IS_EDITABLE` 规范值精确等于 `'1'` **且** `CONFIG_KEY` ∈ 白名单（六类已支持 Key）（`SC-EDIT-01`）。其余全部只读：`'0'`、NULL、空白、异常值、未知 Key、已知但未内置规则的未来 Key（`SC-EDIT-02`）。 |
| SC-DESIGN-081 | `auto-create-table`、`auto-expand-column-length`：下拉选择，选项 `true`/`false`（小写）；保存值精确小写 `true|false`（`SC-CFG-BOOL-01~04`）。 |
| SC-DESIGN-082 | `raw-message-storage-strategy`：单选下拉，选项 `NONE`（不存储原始消息）/ `PLAIN`（不压缩，直接插入原始文本）/ `COMPRESS`（压缩后插入，推荐）；保存值精确大写（`SC-CFG-RMSS-01/02`）。 |
| SC-DESIGN-083 | `realtime-insert-batch-enabled-database-types`：多选，可选 `doris`/`oracle`/`mysql`；至少一种；trim→小写→去重→固定顺序子序列→逗号连接（`SC-CFG-DBTYPE-01~09`）。 |
| SC-DESIGN-084 | `snapshotBatchSize`：整数输入（数字过滤，禁小数/科学计数法/正负号/空）；数值范围 100～10000 含端点；保存为标准十进制字符串（去除首尾空格与前导零）（`SC-CFG-SNAPSHOT-01~04`）。 |
| SC-DESIGN-085 | `tableRowDeleteStrategy`：单选下拉，选项 `DELETE`（源表删除数据，目标表也删除）/ `DELETE_FLAG`（源表删除数据，目标表只更新删除标志位）；保存值精确大写（`SC-CFG-DELSTRAT-01/02`）。 |
| SC-DESIGN-086 | 后端 `ServerConfigValueValidator` 与前端 `configRules.ts` 对六类 Key 维护完全一致的校验与规范化规则（`SC-EDIT-04`）；后端保存时独立重新执行，前端校验不是安全边界（`SC-NFR-01`）。 |

## 11. 当前非法值的纠正流程

| 编号 | 规则 |
|---|---|
| SC-DESIGN-090 | 已支持且 `IS_EDITABLE='1'` 的记录，即使数据库当前 `CONFIG_VALUE` 为空、空白或不符合专门规则，仍保持可编辑（`SC-DISPLAY-04/06`）。 |
| SC-DESIGN-091 | 页面仍显示对应专用控件；控件初始化用当前值，值非法时以明确异常/校验提示标注“当前值无效”，并允许用户修改为合法值（`SC-AC-065`）。 |
| SC-DESIGN-092 | 未修正为合法值前，前端整页校验不通过，“保存全部”不提交包含非法值的批次；后端收到非法新值仍整批拒绝（`SC-DISPLAY-07`）。 |
| SC-DESIGN-093 | 修正为合法值后按正常确认→批量保存流程提交；保存成功后重载显示合法值（`SC-AC-065`）。 |
| SC-DESIGN-094 | `IS_EDITABLE` 不为 `'1'` 或 Key 不受支持时，即使当前值异常也保持只读，不开放编辑（`SC-DISPLAY-08`）。 |

## 12. 事务、回滚、防重复提交、并发不保护和最后成功保存语义

| 编号 | 规则 |
|---|---|
| SC-DESIGN-100 | 批量保存方法标注 `@Transactional(rollbackFor = Exception.class)`（同 `DataSourceServiceImpl` 风格）；唯一中心端识别、重查、校验、逐条更新全部在同一事务内（`SC-BATCH-05`）。 |
| SC-DESIGN-101 | 任一记录不存在、归属错误、不可编辑、Key 不受支持、值校验失败或更新行数不符 → 抛出业务异常 → 整批回滚，禁止部分成功（`SC-BATCH-06`、`SC-AC-058`）。 |
| SC-DESIGN-102 | 不做并发保护：不使用旧值、版本号、时间戳或原值作为更新条件（`SC-BATCH-07`）。 |
| SC-DESIGN-103 | 更新以本次合法提交值覆盖数据库当时值，即“最后一次成功保存生效”（`SC-BATCH-08`、`SC-AC-059`）。 |
| SC-DESIGN-104 | 防重复提交（前端）：`SAVING` 状态禁用“保存全部”与全部编辑控件；一个保存请求未结束前不允许再次点击；取消确认不发请求（`SC-CONFIRM-03/04`、`UI.md` `SC-UI-DESIGN-082`）。 |
| SC-DESIGN-105 | 防重复提交（请求层）：接口不提供业务幂等键；重复合法请求按“最后成功保存生效”语义自然收敛，不额外加锁或去重（`API.md` `SC-API-092`）。 |
| SC-DESIGN-106 | 前端不自动重试保存；保存失败后用户修改或重新点击“保存全部”才再次提交（`SC-STATE-02`、`SC-AC-061`）。 |
| SC-DESIGN-107 | 更新按主键 `ID_SERVER_CONFIG` 作为 `WHERE` 条件执行（`SC-DB-092`）；逐条校验更新行数恰为 1，不符即回滚（`SC-AC-058`）。 |
| SC-DESIGN-108 | 不引入缓存、定时任务、异步刷新或消息推送（`SC-NONGOAL-09`）；页面与后端均无自动刷新路径。 |

## 13. 安全、防绕过、日志和可诊断性

| 编号 | 规则 |
|---|---|
| SC-DESIGN-110 | 后端不得信任前端传入的 Key、可编辑状态、原值或中心端归属；保存时按主键重新查询数据库真实记录并独立重新校验（`SC-BATCH-02`、`SC-EDIT-05`、`SC-NFR-01`）。 |
| SC-DESIGN-111 | 批量请求只接受 `idServerConfig` + `configValue`；请求中若携带其他字段（Key、描述、原值、编辑标志、中心端 ID）一律忽略或按格式校验拒绝（`SC-BATCH-01`、`SC-AC-056`）。 |
| SC-DESIGN-112 | 错误信息面向用户可理解、不泄露底层堆栈；内部异常记入服务端日志，堆栈不返回前端（`SC-NFR-02`）。 |
| SC-DESIGN-113 | 日志与可诊断性：Service 记录“保存成功/失败”与受影响主键数量级，不记录不必要的完整 `CONFIG_VALUE`；查询不记录完整配置值。日志不包含数据库连接凭据。 |
| SC-DESIGN-114 | 沿用项目现有访问边界，不做认证授权体系调整（`SC-NONGOAL-07`）。 |

## 14. 性能判断

| 编号 | 规则 |
|---|---|
| SC-DESIGN-120 | 当前配置为小表（开发库 8 行），一次全量加载全部配置；不分页、不筛选、不搜索（`SC-NFR-08`、`SC-NONGOAL-09`）。 |
| SC-DESIGN-121 | 查询：先按唯一 `SERVER_ID` 读 `CDC_SERVER`（1 行），再按 `SERVER_ID` 读 `CDC_SERVER_CONFIG` 全量并按 `CONFIG_KEY` 升序排序；无 N+1、无大表 JOIN、无缓存（`SC-DB-100~104`）。 |
| SC-DESIGN-122 | 保存：单事务内对批量项逐个 `UPDATE` 按主键更新；批量上限 200，事务短小；不新增索引（`SC-DB-100~104`、`SC-API-041`）。 |
| SC-DESIGN-123 | 不做服务端分页、游标、缓存或预加载；后端不引入额外组件。 |

## 15. 兼容性和未来新增 Key 的扩展点

| 编号 | 规则 |
|---|---|
| SC-DESIGN-130 | 未知或已知但未内置规则的新 Key 默认完整展示但只读；即使 `IS_EDITABLE='1'` 也禁止编辑（`SC-EDIT-03`、`SC-AC-022/023`）。 |
| SC-DESIGN-131 | 新增可编辑 Key 的正式路径：需求确认 → 前后端同步扩展白名单（`ServerConfigEditableKey` / `configRules.ts`）、控件与校验规则 → 按 Feature 调整流程走正式需求调整（`SC-EDIT-03/04`）。 |
| SC-DESIGN-132 | 展示兜底规则（`SC-UI-18~22`）与只读值超宽省略/完整 Tooltip（`SC-UI-12`）对未知 Key 同样适用，不实现通用文本编辑（`SC-NONGOAL-10`）。 |
| SC-DESIGN-133 | 接口契约保持最小字段集；新增 Key 时查询/保存契约不变，仅扩展白名单与校验规则，避免破坏既有前端。 |
| SC-DESIGN-134 | 不做兼容性历史字段、不保留旧接口变体；接口唯一（`API.md` `SC-API-012`）。 |

## 16. 自动化测试设计

| 编号 | 规则 |
|---|---|
| SC-DESIGN-140 | 后端单元/Service 测试：唯一中心端 0/1/多分支（`SC-AC-014/015`）；可编辑性双重判定（`SC-AC-019~023`）；六类 Key 校验与规范化（`SC-AC-024~038`、`SC-AC-041/042`）；批量保存空/超限/重复主键/未知主键/错误归属/不可编辑/未知 Key/非法值（`SC-AC-052~056`）。 |
| SC-DESIGN-141 | 后端事务测试：`@Transactional` 下构造中途失败，断言整批回滚、无部分成功（`SC-AC-058`）；成功批次逐条行数核验（`SC-AC-057`）。 |
| SC-DESIGN-142 | 后端 Controller 测试：路径、方法、请求/响应 JSON、错误码映射（HTTP 200 + 业务码；参数错误 HTTP 400；未知异常 HTTP 500）（`SC-AC-052~056`）。 |
| SC-DESIGN-143 | 前端组件测试：`configRules.ts` 规范化/校验（`SC-AC-030/032/034~036`）；`ConfigValueEditor` 控件渲染与非法当前值降级（`SC-AC-065`）；`SaveConfirmDialog` 变更项/原值/新值/取消（`SC-AC-049/050`）。 |
| SC-DESIGN-144 | 前端页面/交互测试：状态机分支（`SC-AC-013~018`）；脏值判定与按钮启禁（`SC-AC-044~046`）；保存防重复提交与失败保留编辑（`SC-AC-060/061`）；不自动刷新（`SC-AC-047`）。 |
| SC-DESIGN-145 | API 层测试：前端 `api/serverConfig.ts` 请求体仅含主键+新值（`SC-AC-051`）；请求级超时覆盖全局默认值（`SC-API-090`）。 |
| SC-DESIGN-146 | 数据库异常数据验收场景（0 中心端/多中心端/空配置/异常 `IS_EDITABLE`/空或非法当前值）只定义期望行为，不授权测试数据写入；写库须另行获得数据库审批（`ACCEPTANCE.md` 重要声明）。 |

## 17. 明确非目标和实现阶段禁止事项

| 编号 | 规则 |
|---|---|
| SC-DESIGN-150 | 不实现 `CDC_SERVER` 维护（`SC-NONGOAL-01`）、配置项增删（`SC-NONGOAL-02`）、非 `CONFIG_VALUE` 字段修改（`SC-NONGOAL-03`）、DDL/索引/外键/约束（`SC-NONGOAL-04`）、`sync-server` 启停/生效控制（`SC-NONGOAL-05`）、历史/审计/回滚（`SC-NONGOAL-06`）、权限体系（`SC-NONGOAL-07`）、并发控制（`SC-NONGOAL-08`）、搜索/筛选/分页/导入/导出/自动刷新（`SC-NONGOAL-09`）、未知 Key 通用文本编辑（`SC-NONGOAL-10`）。 |
| SC-DESIGN-151 | 实现阶段禁止：新增数据库表/列/约束/索引/外键/触发器/序列；对开发库执行任何写操作或 DDL；写 ZooKeeper；启动服务进行联调/验收；生成下一阶段实现提示词。 |
| SC-DESIGN-152 | 实现阶段必须保持：页面不显示 `IS_EDITABLE`、不显示主键与中心端列、不显示 Key 独立列（`SC-UI-05~07`）；后端保存时独立防绕过校验（`SC-NFR-01`）。 |

## 18. 需求、设计、契约与验收可追溯矩阵

| 需求范围 | 对应需求编号 | 设计编号（本文） | 契约文档 | 验收编号范围 |
|---|---|---|---|---|
| 菜单与路由 | `SC-MENU-01~04` | `SC-DESIGN-010/011` | `UI.md` | `SC-AC-001~003` |
| 页面结构/两列/Key Tooltip/显示名称兜底 | `SC-UI-01~22` | `SC-DESIGN-031/040~046`、`SC-DESIGN-070~075` | `UI.md`、`API.md` | `SC-AC-004~012` |
| 唯一中心端与异常 | `SC-SERVER-01~06` | `SC-DESIGN-062~066` | `API.md`、`DATABASE.md` | `SC-AC-013~018` |
| 可编辑性判定/未知 Key | `SC-EDIT-01~05` | `SC-DESIGN-080`、`SC-DESIGN-130~134` | `API.md`、`DATABASE.md` | `SC-AC-019~023`、`SC-AC-065` |
| 六类 Key 校验 | `SC-CFG-BOOL/RMSS/DBTYPE/SNAPSHOT/DELSTRAT-*`、`SC-CFG-GEN-*` | `SC-DESIGN-081~086`、`SC-DESIGN-090~094` | `API.md`、`UI.md`、`DATABASE.md` | `SC-AC-024~038`、`SC-AC-041/042` |
| 当前只读配置 | `SC-READONLY-01~03` | `SC-DESIGN-080` | `UI.md`、`API.md` | `SC-AC-039/040` |
| 编辑/撤销/脏值 | `SC-DIRTY-01~06` | `SC-DESIGN-050~056`、`SC-DESIGN-070~075` | `UI.md` | `SC-AC-043~047` |
| 保存确认框 | `SC-CONFIRM-01~04` | `SC-DESIGN-053~056` | `UI.md` | `SC-AC-048~051` |
| 后端校验/事务/并发 | `SC-BATCH-01~08` | `SC-DESIGN-057~060`、`SC-DESIGN-100~108` | `API.md`、`DATABASE.md` | `SC-AC-052~061` |
| 成功/失败/空状态 | `SC-STATE-01~04` | `SC-DESIGN-059~066` | `UI.md`、`API.md` | `SC-AC-060/061` |
| 非功能/安全/非目标 | `SC-NFR-01~08`、`SC-NONGOAL-01~10` | `SC-DESIGN-110~114`、`SC-DESIGN-120~123`、`SC-DESIGN-150~152` | `API.md`、`UI.md`、`DATABASE.md` | `SC-AC-062~064` |

设计编号说明：本文档编号前缀 `SC-DESIGN-`，连续、唯一；`API.md` 使用 `SC-API-`，`UI.md` 使用 `SC-UI-DESIGN-`（与 REQUIREMENTS 既有 `SC-UI-*` 需求编号明确区分），`DATABASE.md` 使用 `SC-DB-`。

## 19. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-27 | 建立“中心端配置”Feature 候选设计基线（DRAFT_PENDING_USER_REVIEW / NOT_STARTED） | SERVER-CONFIG-DESIGN-BASELINE-001（阶段 4 设计与契约；纯文档任务；依据已批准 REQUIREMENTS.md 与 ACCEPTANCE.md、已批准数据库基线、当前代码结构与 log-query 设计文档惯例） |
