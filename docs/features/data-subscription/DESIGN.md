# 数据订阅 Feature 设计基线（DESIGN）

## 1. 元数据与状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据订阅 |
| Feature 标识 | `data-subscription` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（设计基线草案，尚未获得项目负责人或 ChatGPT 正式复审批准） |
| 设计正式复审状态 | `PENDING_R4_REVIEW`（R1 正式复审结论 `CHANGES_REQUIRED`；R2 定向修订已完成且四项修订目标通过正式复核；R3 已按已批准“取消并发保护”需求完成定向修订，ChatGPT 对 R3 结果提交 `ac4954401b79e04c56a8bbf9daec871fd194f19c` 正式复审结论 `CHANGES_REQUIRED`；本 R4 按正式复审发现定向修正三个确定问题（DELETE 影响多行错误码统一为 `50041`；DELETE 接口删除前多源库异常后端防护统一为强制普通读取→存在性与异常判定→普通 DELETE；修正“NULL 被 split 成 `['']`”的 Java 语义错误为“对 null 调用 split 抛 `NullPointerException`”），尚未获得 ChatGPT 正式设计复审批准） |
| 实现状态 | `NOT_STARTED`（本任务为纯文档设计基线 R4 定向修订，不涉及任何业务代码实现） |
| 验收执行状态 | 126 条全部 `NOT_RUN` |
| 任务编号 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R4`（R4 定向修订；前序 R3 任务 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R3` 结果提交 `ac4954401b79e04c56a8bbf9daec871fd194f19c`，ChatGPT 对 R3 正式复审结论 `CHANGES_REQUIRED`；R2 任务 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R2` 结果提交 `026417e7e907b0fd23e8812024a260f119c993cc`；R1 任务 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1` 结果提交 `3609548238c9fede745f5291e258469ab7b78167`；首版任务 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001` 结果提交 `610401575938ba32f13fa635493f991bdfae81b6`） |
| 任务类型 | 纯文档设计基线 R4 定向修订（按 ChatGPT 对 R3 正式复审 `CHANGES_REQUIRED` 的三个确定发现项定向修正：DELETE 影响多行错误码统一为 `50041 DELETE_FAILED` 且不映射 `50040`；DELETE 接口删除前多源库异常后端防护统一为强制普通读取→存在性与异常判定→普通 DELETE，删除预览不替代 DELETE 自身防护；修正“NULL 被 split 成 `['']`”的 Java 语义错误为“对 null 调用 split 抛 `NullPointerException`”；保留 R3 已正确删除的并发机制与 R2 已通过设计不回退） |
| 依据的已批准需求基线 | `docs/features/data-subscription/REQUIREMENTS.md`（`APPROVED`，107 条 `DSUB-REQ-001` ~ `DSUB-REQ-107`，当前正式批准版本为“取消并发保护”需求调整版本，“取消并发保护”正式复审依据提交 `43a909773aec63fe8c4de2957074f113910f4686`，当前 Git 基线提交 `8331fbb6e17b8e2165b788d972f651aa980bf227`；前序含逗号数据源 ID 查询兼容批准版本批准依据提交 `afc5765956cac3c8f66d8857ff17565472d0c746`、英文句点保留分隔符批准版本批准依据提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a` 作为历史事实保留） |
| 依据的已批准验收基线 | `docs/features/data-subscription/ACCEPTANCE.md`（`APPROVED`，126 条 `DSUB-AC-001` ~ `DSUB-AC-126`，全部 `NOT_RUN`；当前版本为“取消并发保护”验收标准调整版本，Git 基线提交 `8331fbb6e17b8e2165b788d972f651aa980bf227`） |
| 创建日期 | 2026-08-30 |
| R1 修订日期 | 2026-08-30 |
| R2 修订日期 | 2026-08-31 |
| R3 修订日期 | 2026-08-31 |
| R4 修订日期 | 2026-08-31 |
| 设计依据 | 已批准需求/验收基线（“取消并发保护”批准版本，前序含逗号/点号批准版本作为历史事实保留）+ 已批准数据库物理基线（`docs/database/`）+ 真实代码只读核验 + 项目既有实现模式 + ChatGPT 正式设计复审发现项 |

说明：本文件是设计草案，**不是正式批准的设计基线**。R1 已修正 ChatGPT 正式复审（`CHANGES_REQUIRED`）发现的主要问题并同步已批准点号规则；R2 统一修正剩余四项（三类查询语义、元数据 API query 参数、物化视图显式排除、`DSUB-FP-V1` 字节级指纹）并同步含逗号查询批准基线；R3 按已正式批准并收口的“取消并发保护”需求（`DSUB-REQ-097/098/099/103`）统一删除版本令牌、内容指纹（`DSUB-FP-V1`）、黄金向量、行锁、并发字段比较、`40910 CONCURRENT_MODIFIED` 及相关前端流程，把编辑保存、删除预览和物理删除改为普通读写流程，修正多源库异常判定中的空 token 问题，并为可空 CSV 字段建立统一 null-safe 解析与查询匹配契约。删除 `DSUB-FP-V1` 不是否定 R2 的技术正确性，而是同步新的正式需求。R3 定向修订已完成，ChatGPT 对 R3 结果提交 `ac4954401b79e04c56a8bbf9daec871fd194f19c` 正式复审结论 `CHANGES_REQUIRED`；本 R4 按复审发现定向修正三个确定问题（DELETE 影响多行错误码统一为 `50041`；DELETE 接口删除前多源库异常后端防护统一为强制普通读取→存在性与异常判定→普通 DELETE，删除预览不替代 DELETE 自身防护；修正“NULL 被 split 成 `['']`”的 Java 语义错误为“对 null 调用 split 抛 `NullPointerException`”），并保持 R3 已正确内容不回退。R4 定向修订已完成，但本文件尚未获得 ChatGPT 正式设计复审批准，不表示设计已批准、功能已实现、部署或验收完成。

## 2. 当前事实与目标架构

### 2.1 当前实现事实（OBSERVED_CODE / OBSERVED_DATABASE）

- 前端：`frontend/src/config/menu.ts` 已有菜单项“数据订阅”（配置管理组，path `/config/subscribe`）；`frontend/src/router/index.ts` 已有路由 `/config/subscribe`（name `DataSubscribe`），指向 `@/views/data-subscribe/DataSubscribePage.vue`；页面为 `PlaceholderPage` 占位页，无任何订阅管理业务能力。
- 后端：当前仓库未发现 `cdc-config` 写入 `CDC_DATA_SUBSCRIBE` 的 Controller/Service/Mapper 实现；本表当前由人工维护。仅存在大屏统计模块对 `CDC_DATA_SUBSCRIBE` 的只读消费（`largescreen/stats`：`DataSubscribeEntity`、`DataSubscribeMapper`、`LargeScreenServiceImpl` 按 `FG_ACTIVE='1'` 读取并解析订阅配置）。
- 数据库：`CDC_DATA_SUBSCRIBE` 主键 `PK_CDC_DATA_SUBSCRIBE`（`DATA_SUB_ID`，VARCHAR2(32)，NOT NULL，只读核验 `DATABASE_VERIFIED`）；当前行数 12（开发库瞬时快照，不代表生产常态）；无触发器、无序列。
- 可复用能力：后端已具备动态 JDBC 连接能力（`datasource/connection` 包：`ConnectionFactory` / `ConnectionTester`，Oracle/MySQL/Doris 驱动与 URL 构建、连接/读取超时属性、脱敏错误信息），可供设计阶段复用。

### 2.2 目标架构

- 目标实现为“配置管理 > 数据订阅”页面完整 CRUD，维护 `CDC_DATA_SUBSCRIBE`，配置“一个源库 × 一组源表 × 一个或多个目标库”。
- 前后端分层沿用项目既有模式：后端 `Controller → Service → Mapper（MyBatis-Plus）→ Oracle`，统一响应 `ApiResponse<T>` 与 `BusinessException` 错误语义；前端 `Page → 组件（Dialog/Table/Select/Tooltip）→ api 封装（axios）`。
- 后端包结构：

```text
com.bsoft.cdcconfig.subscription
├── controller/SubscriptionController.java        # 10 个 API 能力接入，见 API.md
├── service/SubscriptionService.java              # 业务接口
├── service/impl/SubscriptionServiceImpl.java     # 业务实现（校验/事务/持久化）
├── service/SourceMetadataService.java            # 源库 Oracle 元数据只读访问接口
├── service/impl/SourceMetadataServiceImpl.java   # 元数据只读访问实现（复用 ConnectionFactory）
├── mapper/DataSubscribeMapper.java               # extends BaseMapper<DataSubscribe> + 专用投影查询
├── entity/DataSubscribe.java                     # 订阅记录实体（订阅模块专用，@TableId IdType.INPUT）
├── dto/SubscriptionSaveDTO.java                  # 新增/编辑保存请求（含 SourceTableInput[] 与 sourceSelectionMode）
├── dto/SourceTableInput.java                     # 结构化源表输入项（schemaName + tableName）
├── dto/SubscriptionQuery.java                    # 列表查询参数
├── vo/SubscriptionRowVO.java                     # 列表行
├── vo/SubscriptionDetailVO.java                  # 详情
├── vo/SubscriptionEditOpenVO.java                # 编辑打开回显
├── vo/SubscriptionDeletePreviewVO.java           # 删除预览（删除确认信息）
├── vo/SourceOptionVO.java                        # 源库候选
├── vo/TargetOptionVO.java                        # 目标库候选
├── vo/SchemaVO.java                              # Schema 元数据
├── vo/TableVO.java                               # 表元数据
├── converter/SubscriptionConverter.java          # Entity <-> VO/DTO 转换
└── exception/SubscriptionErrorCode.java          # 专用错误码（见 API.md §7）
```

> 实体决策（R1 已定，不再悬而未决）：`largescreen/stats/entity/DataSubscribeEntity.java` 已存在且映射 12 个字段，但它是大屏统计模块的只读投影。订阅模块若反向引用 `largescreen.stats` 会产生模块倒置耦合；两个模块生命周期不同。因此 R1 明确：在 `subscription` 模块建立专用 `DataSubscribe` 实体，复用同一张表 `CDC_DATA_SUBSCRIBE`，字段映射与大屏实体一致，且主键采用 `@TableId(value = "DATA_SUB_ID", type = IdType.INPUT)`（依据见 API §8.1）。两种实体都指向同一张表，不改变表结构与字段映射；**不修改现有大屏实体**。

- 前端目录结构（沿用 `views/data-subscribe/`）：

```text
frontend/src/views/data-subscribe/
├── DataSubscribePage.vue               # 列表页（替换现有占位页）
├── components/SubscribeFormDialog.vue  # 新增/编辑共用近全屏弹窗
├── components/SubscribeDetailDialog.vue# 查看详情只读弹窗
├── components/SubscribeDeleteDialog.vue# 删除确认弹窗（基于删除预览数据）
├── components/SourceTableSelector.vue  # Schema 列表 + 表选择组件
└── composables/useSubscribeForm.ts     # 弹窗表单状态与交互逻辑
frontend/src/api/subscription.ts        # API 封装
frontend/src/types/subscription.ts      # 类型定义
```

- 依赖关系：
  - 订阅模块读取 `CDC_DATA_SOURCE` 构造候选（源库/目标库启用候选）与连接信息；仅在后端使用连接信息。
  - 订阅模块读取源库 Oracle 元数据（Schema/表）时，通过 `SourceMetadataService` 使用 `ConnectionFactory` 动态连接，密码只在后端使用。
  - 订阅模块读写 `CDC_DATA_SUBSCRIBE`；不修改 `CDC_DATA_SOURCE`、`CDC_DATA_SOURCE_EXTEND`、大屏表。
- 生效边界：本 Feature 只维护数据库订阅记录，**不设计**通知/重启 `sync-client` 的机制、不操作 ZooKeeper、不创建/删除/检查 Kafka Topic、不判断运行态生效、不启停同步任务（`DSUB-REQ-004`）。新增、编辑、删除后配置需相关 `sync-client` 重启后生效（`DSUB-REQ-005`）；所有增删改成功后统一提示“操作成功。配置将在相关 sync-client 重启后生效。”（`DSUB-REQ-006`）。
- 大屏延期边界：`DATA_SOURCE_TABLE` 已确认使用英文逗号分隔，而当前大屏可能存在按换行符拆分的实现；本任务及“数据订阅”Feature 实现阶段均**不得修改大屏代码或大屏基线**，大屏调整状态保持 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`，作为独立任务在数据订阅 Feature 完成并正式验收后处理，不作为本 Feature 验收阻断项（`DSUB-REQ-107`）。

## 3. 核心流程

### 3.1 首次进入与查询

1. 点击菜单“数据订阅”进入列表页（路由 `/config/subscribe`）。
2. 首次进入自动调用列表查询（无条件）展示全部 `FG_ACTIVE=1` 记录，按 `NVL(UPDATE_TIME, INSERT_TIME) DESC` 排序（`DSUB-REQ-029/030/031`）。
3. 用户在查询区选择源库（多选）与/或目标库（多选），点击“查询”触发过滤。数据库只执行单一查询读取全部启用订阅（SQL 见 DATABASE.md §4.1）；源库组、目标库组的过滤在服务层（Java）完成：源库条件之间 `OR`、目标库条件之间 `OR`、源库组与目标库组之间 `AND`，过滤后保持数据库排序的相对顺序（`DSUB-REQ-034`；算法见 §7.1）。
4. “重置”只清空查询表单，不自动重新查询，列表保持上一次已生效的查询结果（`DSUB-REQ-034`）。
5. 无结果时显示“暂无符合条件的订阅记录”（`DSUB-REQ-034`）。
6. 查询候选三类语义（`DSUB-REQ-033`，已批准）：查询区源库/目标库候选仍按 `FG_ACTIVE=1` 且类别匹配返回，不因 ID 含保留字符（英文逗号或英文句点）静默隐藏：
   - **不含英文逗号**：普通候选，可选；
   - **含英文句点但不含英文逗号**：仍为普通候选，英文句点不是 `DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID` 这两个 CSV 字段的分隔符，可按完整 token 精确匹配；
   - **含英文逗号**：仍返回并允许选择，但候选项必须显示警告标记（“含逗号，历史兼容查询可能存在歧义”），不得冒充普通精确候选。
7. 查询结果歧义警告：一次查询包含任意含逗号候选时，页面在查询条件和结果区域持续显示歧义警告；列表 API 以 `items + queryWarnings` 返回（API.md §4.2）；警告不是错误，不阻断查询。

### 3.2 查看详情

1. 点击正常单源库记录的“查看”，打开居中只读详情弹窗。
2. 详情读取已保存配置与数据源映射（`CDC_DATA_SUBSCRIBE` + `CDC_DATA_SOURCE`），**不连接源 Oracle**（`DSUB-REQ-045`）。
3. 展示描述、订阅 ID、源库/目标库机构与 ID、按 Schema 分组的源表清单、创建/更新时间、异常数据源警告；源表区域限高滚动（`DSUB-REQ-047/048/049`）。
4. `DATA_SOURCE_TABLE` 若有无法解析的内容，展示可解析项，并单独分区展示原始异常内容与警告，不得静默丢弃（`DSUB-REQ-050`）。正常三段格式（含两个结构句点）不被误判为异常；只有组件内部额外英文句点造成无法可靠解析时才进入原始异常区。
5. 不展示 `DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT`（`DSUB-REQ-051`）。

### 3.3 新增

1. 点击“新增”，打开近全屏弹窗（默认居中，标题栏可拖动）。
2. 后端加载候选：`GET /api/subscriptions/options` 一次返回源库/目标库启用候选（`FG_ACTIVE=1` 且类别匹配）（`DSUB-REQ-033/058/064`）。维护候选边界：新增/编辑候选中 ID 含保留字符（英文逗号或英文句点）的数据源显示为禁用项并标注“名称含协议保留字符，不能用于订阅配置”，不得静默隐藏（`DSUB-REQ-017`；目标库 ID 虽不参与三段拼接，同样禁止句点）。
3. 选择源库（可搜索单选下拉，候选显示 ORG 为主、ID 为辅）。
4. 自动加载源库 Schema 列表（`GET /api/subscriptions/metadata/schemas?dataSourceId=<原始字符串>`，API §4.4）；`dataSourceId` 以 query 参数承载，按原始字符串传输、保持大小写，不做 URL 路径段拆分。
5. 点击某 Schema 时首次加载该 Schema 的普通表（`GET /api/subscriptions/metadata/tables?dataSourceId=<原始字符串>&schema=<原始字符串>`，API §4.5），并在本次弹窗会话内缓存；切换不重复查询（`DSUB-REQ-070`）。`schema` 同样以 query 参数承载，避免 `encodeURIComponent` 后 `%2F` 等被 Servlet 容器或反向代理拒绝或提前解码的路径变量问题（API §2 合并说明）。
6. 用户选择源表（左侧 Schema 列表 + 中间表格，无右侧“已选源表”面板）。Schema 或表名含保留字符（英文逗号或组件内部英文句点）的对象显示为不可选择并明确说明原因（协议保留字符），不得静默隐藏（`DSUB-REQ-017`）。
7. 选择目标库（1～5 个紧凑复选卡片）。
8. 点击“保存”：前端做基础必填/格式校验并组装结构化 `sourceTables`（`SourceTableInput[]`，每项仅 `schemaName` + `tableName`）；后端做最终校验（源库/目标库存在、启用、类别正确；Schema/表存在且可访问；格式正确；名称不含保留字符；不重复），保存校验使用一次源库连接按 Schema 批量复核（`DSUB-REQ-081~085`）。后端以 `dataFromSourceId` 为唯一源库，校验后拼成数据库格式 `DATA_SOURCE_ID.Schema.表名` 持久化（`sourceTables` 契约见 §4.2 与 API.md §4.6）。
9. 保存成功：关闭弹窗、刷新列表、提示“操作成功。配置将在相关 sync-client 重启后生效。”（`DSUB-REQ-087`）。保存期间按钮进入加载状态，防止重复提交（`DSUB-REQ-086`）。

### 3.4 编辑正常路径

1. 点击正常单源库记录“编辑”，打开同一近全屏弹窗。
2. 调 `GET /api/subscriptions/{dataSubId}/edit` 回显描述、源库、目标库、全部 Schema 与源表选择（`DSUB-REQ-088/097`）。
3. 自动加载原记录涉及的全部 Schema 及其表，恢复勾选与浅蓝背景（`DSUB-REQ-088/089`）。
4. 用户修改后保存：后端重新校验（同新增）；通过后写入（`DATA_SUB_ID`、`INSERT_TIME` 保持不变，`UPDATE_TIME` 更新为数据库当前时间，遗留字段保持原值）（`DSUB-REQ-096`）。
5. 原选择中的表已删除或不可访问时，显示“异常已选表”警告，不得静默取消（`DSUB-REQ-091`）。
6. 编辑保存使用 `sourceSelectionMode = PRESERVE | REPLACE`（契约见 §4.2 与 API.md §4.8）：
   - `REPLACE`（源表变更或缺省于 REPLACE 语义的新增）：必须提交结构化 `sourceTables`，必须成功连接源 Oracle 并批量校验，UPDATE 写入重新构造的完整表清单；
   - `PRESERVE`（有限编辑）：不提交 `sourceTables`，后端要求请求 `dataFromSourceId` 与当前记录完全一致，UPDATE 不设置 `DATA_SOURCE_TABLE`，原始 CLOB 逐字保留。
   - 后端不能只相信前端模式：必须结合当前记录和请求字段验证模式合法性（见 §5.2）。

### 3.5 源 Oracle 断连时仅修改描述和目标库

1. 编辑打开时若源库校验或元数据加载失败（源 Oracle 暂时无法连接），进入“有限编辑”模式（`DSUB-REQ-093`）。
2. 只要源库与 `DATA_SOURCE_TABLE` 完全未变（即请求采用 `sourceSelectionMode=PRESERVE` 且 `dataFromSourceId` 与当前记录一致）：允许修改订阅描述和目标库；不允许新增、删除或更换源表；不允许更换源库后绕过源表重新选择。
3. 页面明确说明当前使用已保存源表配置，未完成源库实时校验。
4. 若用户修改了源库或源表，则必须成功连接源 Oracle 并完成保存前有效性校验，保存模式为 `REPLACE`（`DSUB-REQ-092`）。
5. 断连且 `PRESERVE` 时仅允许描述和目标库变化；`DATA_SOURCE_TABLE` 原始内容不因解析/排序被意外重写。

### 3.6 已停用/不存在数据源的修复

1. 原订阅引用的源库或目标库已停用或不存在时，回显原值并标记异常（`DSUB-REQ-094`）。
2. 编辑保存前必须替换或修复异常数据源；不得原样保存或强制保存（`DSUB-REQ-094`）。
3. 若同时存在源表无法访问等失效项，一次性列出具体失效项，用户修正后重试（`DSUB-REQ-085`）。
4. 如果原源库已停用/不存在或原配置含保留字符无效项，仍必须按已批准需求修复后才能保存，不能借 `PRESERVE` 模式绕过。

### 3.7 删除

1. 正常单源库记录提供“删除”入口；多源库异常记录无删除入口（`DSUB-REQ-100`）。
2. 点击列表“删除”：先调用 `GET /api/subscriptions/{dataSubId}/delete-preview` 获取删除确认所需的普通只读确认信息；成功后再展示确认弹窗（订阅描述、源库、Schema 数、源表数量、目标库、“数据库记录物理删除且无法恢复”、“当前运行中的同步任务不会立即停止，需要重启相关 sync-client 后生效”）（`DSUB-REQ-102`）。
3. 用户确认后 `DELETE /api/subscriptions/{dataSubId}`：DELETE 接口在事务内自行按 `DATA_SUB_ID` 普通读取当前记录并完成后端业务防护（记录存在、非多源库异常），防护通过后按 `DATA_SUB_ID` 主键直接物理删除；**删除预览不替代 DELETE 接口自身的后端防护**（接口可被直接调用，且预览结果不是一致性快照），不返回、不校验版本令牌，不比较预览后记录是否发生变化（`DSUB-REQ-103`；见 §5.3）。
4. 记录不存在时提示“记录不存在或已被删除”（`DSUB-REQ-104`）。
5. 删除成功刷新列表并提示重启后生效（`DSUB-REQ-105`）。
6. 删除预览只读取配置库，不连接源 Oracle；不复用会连接源 Oracle 的“编辑打开”接口。

### 3.8 多源库异常记录

- 启用记录 `DATA_FROM_SOURCE_ID` 含多个源库（含英文逗号）视为异常记录（`DSUB-REQ-010`）。
- 仍显示在列表中，整行警示色并提示“配置异常：该记录包含多个源库，请直接维护数据库”（`DSUB-REQ-011`）。
- 不提供查看、编辑、删除、删除预览等任何操作，不提供自动拆分（`DSUB-REQ-012/046/095/100`）。

## 4. 领域解析和规范化

### 4.1 多值英文逗号字段

- `DATA_TO_SOURCE_ID`、`DATA_SOURCE_TABLE`、`DATA_FROM_SOURCE_ID` 为英文逗号 `,` 分隔的多值字段。
- 保存前解析规则（后端统一实现，供保存校验与持久化复用）：
  1. 按英文逗号拆分；拆分后对每个 token 去除首尾空白；
  2. 空 token（连续逗号产生）丢弃；
  3. 去重：同一记录内不允许重复表标识、不允许重复目标库 ID（`DSUB-REQ-018`；目标库重复见 `DSUB-REQ-083`）；结构化 `SourceTableInput` 按 `(schemaName, tableName)` 精确组合去重；
  4. 保存时按稳定顺序拼回英文逗号分隔（保留用户顺序的稳定版本，去重后保持首次出现顺序）。
- 查询匹配（列表过滤）采用三类语义（`DSUB-REQ-034`）：普通 ID（不含英文逗号）按 CSV 拆分 token 去除首尾空白后完整字面精确匹配（Java `String.equals`，`%`、`_`、反斜杠、句点、正则字符按字面处理，禁止 `%ID%` 子串匹配，`S01` 不匹配 `S012`）；仅含句点 ID 适用同一精确规则；含逗号 ID 定义为“历史兼容可能匹配”（连续分隔边界完整片段匹配，返回可能匹配集合并给出歧义警告）。查询过滤在服务层 Java 完成，算法见 §7.1，SQL 见 DATABASE.md §4.1。
- 存量记录解析容错：解析失败或异常内容不得静默丢弃，在详情/编辑中按 §4.4 处理。

### 4.2 `DATA_SOURCE_TABLE` 单表格式与点号保留分隔符

- 单张表格式：`DATA_SOURCE_ID.Schema.表名`；其中两个英文句点 `.` 是三段结构的保留分隔符（`DSUB-REQ-016`）。存储协议没有引号、转义符或长度前缀机制；第一版不设计转义或编码协议。
- 解析规则：从第一个 `.` 和最后一个 `.` 分割，分别得到 `DATA_SOURCE_ID`、`Schema`、`表名`；Schema 与表名区分大小写，保持源 Oracle 原始大小写（`DSUB-REQ-016`）。
- 保留字符规则（`DSUB-REQ-017`，已批准）：
  - 数据源 ID、Schema 名和表名不得包含英文逗号 `,`，也不得包含组件内部英文句点 `.`；英文逗号用于多值项分隔，英文句点用于三段结构分隔；
  - 数据源 ID、Schema 名或表名含英文逗号或句点时，不得用于新增或编辑订阅：页面不得允许选择，后端保存也必须拒绝；页面必须向用户说明具体名称和保留字符原因，不得只提示“格式错误”；
  - 两个结构句点是正常格式，不得把所有含点号的完整表标识误判为异常；只有组件内部额外句点才属于协议不兼容；
  - 目标库 ID 虽不参与 `DATA_SOURCE_ID.Schema.表名` 拼接，但项目负责人已选择统一的数据源 ID 保留字符规则，新增/编辑中同样禁止句点。
- 校验：
  - 表标识必须属于所选源库（结构化 `sourceTables` 的 `schemaName/tableName` 由后端以 `dataFromSourceId` 为唯一源库拼装，避免前端携带不一致的 `DATA_SOURCE_ID`）；
  - 数据源 ID、Schema 名、表名不得包含英文逗号或组件内部英文句点，发现时页面不得允许选择并明确说明协议限制，后端同样拒绝保存；
  - 单表完整标识在记录内不重复（`DSUB-REQ-018`），结构化输入按 `(schemaName, tableName)` 精确组合去重。
- 大小写歧义处理：同一 Schema 下 Oracle 默认对象名大写存储，`ALL_TABLES.TABLE_NAME` 返回存储大小写；设计按“表标识中的大小写即源 Oracle 返回的原始大小写”保存与回显，不做统一大小写转换；如真实数据存在组件内部点号歧义（表名或 Schema 名本身含 `.`），本 Feature 协议不支持，发现此类对象时页面不得允许选择并明确说明协议限制（`DSUB-REQ-017`）。

### 4.3 Schema/表名大小写保持

- 读取源 Oracle 元数据时按 `ALL_TABLES.OWNER`、`ALL_TABLES.TABLE_NAME` 返回的原始大小写保存与展示，不转换。

### 4.4 历史不可解析内容

- 详情：`DATA_SOURCE_TABLE` 可解析项正常分组展示；无法解析的 token（如组件内部额外英文句点造成无法可靠解析）单独分区展示原始内容并带警告，不得静默丢弃（`DSUB-REQ-050`）。
- 编辑：原选择中的表已删除或不可访问时显示“异常已选表”警告，不得静默取消（`DSUB-REQ-091`）；含保留字符的异常项回显并标记异常，保存前必须替换或修复，不得原样保存或强制保存（`DSUB-REQ-094`）；不可解析 token 是否可编辑取决于源库/源表是否变化（断连有限编辑场景见 §3.5）。

### 4.5 列表表数量计算

- 列表“共 N 张”只依赖 `DATA_SOURCE_TABLE` 的逗号 token 计数（按英文逗号拆分、trim、丢弃空 token 后统计**所有非空 token**，包括当前无法解析的历史 token），不访问源 Oracle（`DSUB-REQ-038`）。这样可避免“详情存在原始异常项但列表数量少算”。
- 详情把可解析项与原始异常项分区展示（§4.4）；正常保存只允许全部可解析的结构化对象。

### 4.6 遗留字段

- `DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT` 为旧配置程序遗留字段，`sync-client` 不读取（`DSUB-REQ-003`）。
- 新增写 `NULL`，页面不展示、不解析、不维护；编辑历史记录时保持原值，不主动清空（`DSUB-REQ-023/024/025`）。

### 4.7 多源库异常识别

- `DATA_FROM_SOURCE_ID` 经统一 null-safe CSV 解析（§4.9 `splitTrimDropEmpty`）后非空 token 数量 ≥ 2 且记录 `FG_ACTIVE=1` → 多源库异常记录（`DSUB-REQ-010`）。
- 识别由后端完成，前端仅展示；异常记录整行警示，无任何操作（`DSUB-REQ-011/012`）。
- 判定必须统一走 §4.9 的 null-safe 解析：`NULL`/空白解析为空 token 集合（大小 0 → 非异常）；带逗号前缀/后缀/连续逗号但最终仅 1 个非空 token → 非异常；非空 token 数量 ≥ 2 → 异常。禁止使用原始 `split(",", -1)` 直接按 `.length >= 2` 判定：对 `null` 直接调用实例方法 `split` 会抛 `NullPointerException`；对空字符串、仅空白、连续分隔符等输入，原始 `split` 得到的数组长度与有效非空 token 数不一致，判定失真。
- 列表、详情、编辑打开、删除预览、删除各环节的多源库异常判定复用同一解析方法，不得出现多处不一致的分割逻辑。

### 4.8 已停用/不存在数据源映射

- 订阅引用的数据源即使已停用或不存在，记录仍然显示（`DSUB-REQ-042`）：
  - 已停用：显示 `DATA_SOURCE_ORG` 并标记“已停用”；
  - 不存在：显示原始 `DATA_SOURCE_ID` 并标记“不存在”。
- 详情同样展示上述警告（`DSUB-REQ-048`）。
- 列表/详情映射数据源时使用专用 Mapper/投影只查询 `DATA_SOURCE_ID`、`DATA_SOURCE_ORG`、`FG_ACTIVE` 及必要类别字段，不得通过 `selectBatchIds` 加载含密码的完整 Entity 用于展示映射（密码仅在 SourceMetadataService 建立源 Oracle 连接时按需单条读取，见 §7.4 与 DATABASE.md §4.6）。

### 4.9 统一 null-safe CSV 解析与查询匹配契约

对 `DATA_TO_SOURCE_ID`、`DATA_SOURCE_TABLE`、`DATA_FROM_SOURCE_ID` 及查询候选 ID 的 CSV 处理，全部统一走以下 null-safe 契约（R3 权威定义；API.md、DATABASE.md 引用并重复必要契约，四份文档不得出现矛盾版本）。核心动机：三个 CSV 字段均可为 `NULL`/空白，若直接用 `split(",", -1)` 处理，对 `null` 调用实例方法 `split` 会抛 `NullPointerException`；对空字符串、仅空白、连续分隔符等输入，原始 `split` 得到的数组长度与有效非空 token 数不一致，无法与“空 token 集合”正确区分，多源库异常判定会失真。

**解析函数（保存、展示、统计、异常判定的统一入口）：**

```text
splitTrimDropEmpty(csv)：
  若 csv 为 NULL 或仅空白 → 返回空列表 []
  否则按英文逗号拆分（保留末尾空 token，等价 Java split(",", -1)），
  对每个 token trim 首尾空白，
  丢弃空字符串 token，
  大小写保持不变，
  返回按原顺序排列的非空 token 列表
```

**查询匹配函数（列表过滤，§7.1 使用）：**

```text
matchCsvNormal(storedCsv, queryId)：
  查询 ID 不含英文逗号时使用
  return splitTrimDropEmpty(storedCsv).any(seg -> seg.equals(queryId))
  // Java String.equals，大小写敏感；% _ \ . 正则字符按字面处理；S01 不匹配 S012

matchCsvComma(storedCsv, queryId)：
  查询 ID 含英文逗号时使用（历史兼容可能匹配）
  storedAtomic = splitTrimDropEmpty(storedCsv)
  queryAtomic  = splitTrimDropEmpty(queryId)
  return queryAtomic 是 storedAtomic 的连续子序列（contiguous subsequence）
  // 结果不能断言逗号归属；A,B 可能是相邻的 A 和 B
```

**多源库异常判定函数（§4.7 使用）：**

```text
isMultiSourceAnomaly(csv) = (splitTrimDropEmpty(csv).size >= 2)
```

**可空边界示例表（权威）：**

| `DATA_FROM_SOURCE_ID` 原始值 | `splitTrimDropEmpty` 结果 | 非空 token 数 | 多源库异常 |
|---|---|---|---|
| `NULL` | `[]` | 0 | 否 |
| `''`（空字符串） | `[]` | 0 | 否 |
| `'   '`（仅空白） | `[]` | 0 | 否 |
| `'S01'` | `['S01']` | 1 | 否 |
| `',S01'` | `['S01']` | 1 | 否 |
| `'S01,,'` | `['S01']` | 1 | 否 |
| `'S01, , '` | `['S01']` | 1 | 否 |
| `' S01 , S02 '` | `['S01','S02']` | 2 | 是 |
| `'S01,S02'` | `['S01','S02']` | 2 | 是 |

- 该契约覆盖所有读写与查询入口；任何实现不得绕过本契约自行 `split`/`trim`。
- `matchCsvNormal`/`matchCsvComma` 的存储值均先经 `splitTrimDropEmpty` 归一化，保证 `NULL`/空白存储值解析为空集合，与任意查询 ID 都不匹配。

## 5. 无并发保护边界、事务与重复提交

### 5.1 无并发保护边界（已批准的取消并发保护产品边界）

- 编辑打开接口**不生成、不返回**版本令牌、内容指纹（`DSUB-FP-V1`）或等效快照标识；页面编辑保存请求也不携带此类字段（`DSUB-REQ-097`）。
- 编辑保存**不加行锁**，不比较打开时与保存时的记录内容；完成现有业务校验后按 `DATA_SUB_ID` 普通 `UPDATE`；多个页面用户或人工数据库操作交叉发生时不提供并发冲突检测，**最后一次成功写入的内容生效**（`DSUB-REQ-098`）。
- 不使用 `UPDATE_TIME` 或其他字段进行并发判断；不提供“记录已被他人或人工数据库操作修改”的识别、拒绝覆盖或刷新重试机制；页面打开期间的数据与最终写入之间不提供快照一致性保证（`DSUB-REQ-099`）。
- 删除预览只做普通只读读取，不锁行、不返回或回传版本令牌；删除确认后直接按 `DATA_SUB_ID` 主键物理删除，不检查预览后记录是否发生变化（`DSUB-REQ-103`）。
- 本边界是明确批准的产品决定，不得在实现阶段重新解读为乐观锁、悲观锁、ETag、幂等键或数据库触发器。设计、API、UI、DATABASE 四份文档均不得残留 `versionToken`、`DSUB-FP-V1`、黄金向量、`SELECT ... FOR UPDATE`、并发字段比较或 `40910 CONCURRENT_MODIFIED` 的并发流程描述。

### 5.2 编辑保存的普通流程

1. 如需源 Oracle 实时校验（`REPLACE` 模式），先在配置库事务外完成；
2. 进入配置库 `@Transactional` 方法；
3. 按 `DATA_SUB_ID` 普通读取当前记录（**不锁行**）：查不到记录返回 `40430` 不存在错误；读取用于验证 `PRESERVE` 模式请求 `dataFromSourceId` 与当前记录一致（§3.4/§3.5）；
4. 完成现有业务校验后按 `DATA_SUB_ID` 执行普通 `UPDATE`；
5. `UPDATE` 受影响行数必须为 1（0 行 → `40430`，多行异常 → `50040`）；
6. 提交事务。

外部源库校验与最终写入之间不做版本比对：校验结果可能应用到已发生变化的最新记录，这是“最后一次成功写入生效”边界下的预期行为，不构成缺陷。

### 5.3 删除预览与普通删除流程

1. 删除预览：按 `DATA_SUB_ID` 普通只读查询当前记录，返回删除确认所需信息（订阅描述、源库、Schema 数、源表数量、目标库），**不锁行、不返回版本令牌**（`DSUB-REQ-102`）；记录不存在返回 `40430`（`DSUB-REQ-104`）。
2. 用户确认后 `DELETE /api/subscriptions/{dataSubId}`：进入 `@Transactional`，**DELETE 接口自身重复执行删除前防护，删除预览不能替代**（接口可被直接调用，且预览结果不是一致性快照）：
   1. 按 `DATA_SUB_ID` 普通 `SELECT` 当前记录，**不使用 `FOR UPDATE`、不加锁、不比较预览结果、不检查并发变化**；查询不到返回 `40430`；
   2. 复用统一 `isMultiSourceAnomaly`/`splitTrimDropEmpty` 判定（§4.7/§4.9）；当前读取结果为多源库异常时返回 `40351 ANOMALY_NOT_DELETABLE`，**不得执行 DELETE**；
   3. 校验通过后按 `DATA_SUB_ID` 执行普通物理 `DELETE`；普通 `SELECT` 与 `DELETE` 之间若被其他页面或人工数据库操作修改，不检测、不拒绝，仍符合已批准“无并发保护、最后一次成功写入生效”边界；
   4. `DELETE` 影响 0 行返回 `40430`，影响多行返回 `50041 DELETE_FAILED`；
3. 提交事务；删除成功刷新列表并提示重启后生效（`DSUB-REQ-105`）。

### 5.4 事务边界与受影响行数检查

- 新增：`@Transactional`；`INSERT` 后校验受影响行数 = 1，否则 `50040 SAVE_FAILED`。
- 编辑：`@Transactional`；事务内普通读取当前记录完成业务校验（§5.2）→ 按 `DATA_SUB_ID` 普通 `UPDATE`（受影响行数必须 = 1；0 行表示记录不存在 → `40430`，多行异常 → `50040`）。
- 删除：`@Transactional`；事务内按 `DATA_SUB_ID` 普通读取当前记录并完成后端业务防护（查不到 → `40430`；多源库异常 → `40351`，不得执行 DELETE），防护通过后按 `DATA_SUB_ID` 普通 `DELETE`（受影响行数必须 = 1；0 行 → `40430`，多行 → `50041`）。
- 数据源/表校验（源库连接）与配置库写入不在同一数据库事务（源库为外部 Oracle，配置库为 CDC）；校验通过后才进入 CDC 配置库事务写入，二者之间不构成跨库事务。

### 5.5 重复提交边界

- 前端按钮 loading 是首期主要防重复机制（`DSUB-REQ-086/106`），仅防止用户界面重复点击，不属于并发控制，也不提供“最后一次成功写入生效”之外的额外保证。
- 新增使用随机 UUID 作为 `DATA_SUB_ID`，主键约束不能阻止同一业务请求被重复提交后形成两条逻辑重复记录。
- 已批准需求允许跨行重复订阅（`DSUB-REQ-009/019`），因此后端不得虚假声明新增天然幂等。
- 文档准确表述为：“防止用户界面重复点击，但网络重试可能形成允许的重复记录；首期未设计请求幂等键”。
- 编辑/删除不提供并发冲突检测：编辑的网络重试若在首次写入已成功后再次执行，按普通主键更新再次覆盖（最后一次成功写入生效）；删除重复执行时第二次按 `DATA_SUB_ID` 物理删除会因记录不存在返回 `40430`，不会产生重复数据。

## 6. 源 Oracle 元数据访问

### 6.1 连接信息使用

- 从 `CDC_DATA_SOURCE` 读取源库记录（`DATA_SOURCE_HOST/PORT/SERVICE_NAME/USER_NAME/PASSWORD/TYPE`，`FG_ACTIVE=1` 且类别为源库）。
- 仅后端读取连接信息；密码复用现有安全机制（`datasource/connection`），不得写入日志、异常响应或返回前端（`DSUB-REQ-067`）。
- 密码仅在 `SourceMetadataService` 建立源 Oracle 连接时按需单条读取（见 §7.4）。
- 目标库只选择、不连接（`DSUB-REQ-068`）。

### 6.2 连接管理

- 复用 `ConnectionFactory.open(url, driver, connectionProperties, userName, password)`。
- URL/驱动构建复用 `ConnectionTester` 的规则：Oracle → `jdbc:oracle:thin:@//host:port/serviceName` + `oracle.jdbc.OracleDriver`；超时属性 `oracle.net.CONNECT_TIMEOUT` / `oracle.jdbc.ReadTimeout`。
- 连接只读使用：元数据访问仅执行 `SELECT` 类只读查询；`try-with-resources` 保证关闭；设置连接/读取超时防止长挂。
- 失败处理：连接失败/Schema/表加载失败转换为脱敏业务错误（`40340 SOURCE_CONNECTION_FAILED` / `40341 SCHEMA_LOAD_FAILED`，用户可见消息不含密码、连接串、堆栈），前端提供“重试加载”（`DSUB-REQ-070`）。
- 并发控制：交互式元数据加载限制单源库并发连接数（复用 `ConnectionTester` 有界执行器模式或等效约束），避免无界连接。

### 6.3 Schema 范围（能力分层过滤 + 物化视图显式排除）

- Schema 范围：当前账号可访问、包含普通表的非系统 Schema；不展示空 Schema、系统 Schema、视图、物化视图或同义词（`DSUB-REQ-069`）。
- **统一“可订阅普通表集合”谓词（R2）**：`ALL_TABLES` 并不会天然排除物化视图，必须显式排除。统一核心谓词（用于 Schema 列表、指定 Schema 表清单、保存前批量复核三处，DATABASE.md §4.8 给出完整参数化示例）：

  ```sql
  FROM ALL_TABLES t
  WHERE NOT EXISTS (
      SELECT 1
      FROM ALL_MVIEWS mv
      WHERE mv.OWNER = t.OWNER
        AND (
             mv.MVIEW_NAME = t.TABLE_NAME
          OR mv.CONTAINER_NAME = t.TABLE_NAME
        )
  )
  ```

  - `ALL_MVIEWS.MVIEW_NAME` 是物化视图名；
  - `ALL_MVIEWS.CONTAINER_NAME` 是保存物化视图数据的容器名，通常与物化视图名相同，但不能假设永远相同；
  - 因此同时按 `MVIEW_NAME` 与 `CONTAINER_NAME` 排除；
  - `ALL_MVIEWS` 与 `ALL_TABLES` 都以当前连接账号可访问对象为边界；
  - 视图、同义词本来不来自 `ALL_TABLES`，但物化视图必须通过上述谓词显式排除；
  - 不得写成“`ALL_TABLES` 天然排除物化视图”。
- 静态黑名单无法保证完整排除 Oracle 系统 Schema。R1/R2 采用**能力分层方案**：
  1. **Oracle 支持 `ORACLE_MAINTAINED` 时（优先）**：

  ```sql
  SELECT DISTINCT t.OWNER
  FROM ALL_TABLES t
  JOIN ALL_USERS u ON u.USERNAME = t.OWNER
  WHERE u.ORACLE_MAINTAINED = 'N'
    AND NOT EXISTS (
        SELECT 1
        FROM ALL_MVIEWS mv
        WHERE mv.OWNER = t.OWNER
          AND (mv.MVIEW_NAME = t.TABLE_NAME OR mv.CONTAINER_NAME = t.TABLE_NAME)
    )
  ORDER BY t.OWNER
  ```

  - 实现前必须结合实际权限验证 `ALL_USERS.ORACLE_MAINTAINED` 是否可查询（该列仅 12c+ 可用，且需要字典访问权限）。
  2. **不支持该列或无权限时（兼容回退）**：
  - 使用集中维护、可测试的 Oracle 系统 Schema 排除清单作为兼容回退（含 `SYS`、`SYSTEM`、`OUTLN`、`DBSNMP`、`XDB`、`MDSYS` 等）；
  - 回退不是“保证完整”的事实，文档必须说明限制；
  - 不允许 SQL 失败后静默返回全部 Schema；
  - 后端记录不含敏感信息的兼容回退日志；
  - 回退模式同样叠加同一个物化视图排除谓词：

  ```sql
  SELECT DISTINCT t.OWNER
  FROM ALL_TABLES t
  WHERE t.OWNER NOT IN (/* 系统 Schema 排除清单 */)
    AND NOT EXISTS (
        SELECT 1
        FROM ALL_MVIEWS mv
        WHERE mv.OWNER = t.OWNER
          AND (mv.MVIEW_NAME = t.TABLE_NAME OR mv.CONTAINER_NAME = t.TABLE_NAME)
    )
  ORDER BY t.OWNER
  ```

  - Schema 仍必须来自 `ALL_TABLES`，并显式排除物化视图；因此只保留至少含一张可订阅普通表的可访问 Schema。
- 过滤方式选择：后端在响应中返回 `filterMode=ORACLE_MAINTAINED|FALLBACK_EXCLUSION_LIST`（见 API.md §4.4），不把无意义技术信息展示给普通用户，但保留可核验标识。
- 不得仅保留静态黑名单并宣称完全满足“非系统 Schema”。

### 6.4 表范围与批量加载

- 点击 Schema 后按该 Schema 批量加载普通表（显式排除物化视图，统一谓词见 §6.3）：

```sql
SELECT TABLE_NAME
FROM ALL_TABLES t
WHERE t.OWNER = :schema
  AND NOT EXISTS (
      SELECT 1
      FROM ALL_MVIEWS mv
      WHERE mv.OWNER = t.OWNER
        AND (mv.MVIEW_NAME = t.TABLE_NAME OR mv.CONTAINER_NAME = t.TABLE_NAME)
  )
ORDER BY TABLE_NAME
```

- 一次 Schema 加载使用一次查询（同一连接内），结果在弹窗会话内缓存（前端缓存或后端按会话缓存均可，设计建议前端缓存 + 后端每次加载单次查询，避免跨会话陈旧数据）。
- 保存前有效性校验：**一次源库连接、按 Schema 批量复核**，禁止逐表建立连接或约 240 次查询（`DSUB-REQ-084`）。设计：打开 1 个源库连接，执行一次批量查询（`SELECT OWNER, TABLE_NAME FROM ALL_TABLES t WHERE t.OWNER IN (:schemas…) AND NOT EXISTS (…统一物化视图排除谓词…)`，完整示例见 DATABASE.md §4.8），将提交的表标识集合与返回集合比对，标记失效项。
- 表范围：普通表；不含视图、物化视图、同义词；物化视图必须按 §6.3 统一谓词显式排除（`ALL_TABLES` 不会天然排除物化视图）；若需排除 IOT 溢出段可补充过滤条件（设计草案不强制）。

### 6.5 目标库

- 目标库只选择、不连接（`DSUB-REQ-068`）；候选仅 `FG_ACTIVE=1` 且类别为 TARGET 的数据源（`DSUB-REQ-064`）。

## 7. 安全、性能和可观测性

### 7.1 SQL 与查询过滤安全

- 所有查询使用 MyBatis-Plus `LambdaQueryWrapper` / `LambdaUpdateWrapper` 或参数化 SQL（`?`/`#{}`/`{0}` 绑定），禁止字符串拼接生成 SQL。
- **列表查询过滤在服务层 Java 完成**（订阅规模小、列表不分页、需读取全部 `FG_ACTIVE='1'` 记录并解析 `DATA_SOURCE_TABLE`/数据源映射）。数据库只执行单一查询读取全部启用订阅并按 `NVL(UPDATE_TIME, INSERT_TIME) DESC` 排序（SQL 见 DATABASE.md §4.1）；服务层对源库组、目标库组分别做 OR 过滤，两组之间 AND，过滤后保持数据库排序的相对顺序。

**普通候选（查询 ID 不含英文逗号）——完整 token 字面精确匹配（统一契约 `matchCsvNormal`，见 §4.9）：**

```text
matched = matchCsvNormal(storedCsv, queryId)
// 等价于 splitTrimDropEmpty(storedCsv).any(segment -> segment.equals(queryId))
```

- Java `String.equals`，大小写敏感；
- `%`、`_`、反斜杠、句点、正则字符全部按普通字面字符处理；
- 不使用 `LIKE`、正则或 `%ID%`；`S01` 不匹配 `S012`；
- 查询 ID 的候选值来自数据库，不擅自 trim 或改变其内部字符；前端回传原始 ID 字符串；
- 存储值先经 §4.9 `splitTrimDropEmpty` 归一化：`NULL`/空白存储值解析为空集合，与任意查询 ID 都不匹配；
- 仅含英文句点（不含英文逗号）的 ID 适用本精确规则（句点不是这两个 CSV 字段的分隔符）。

**含逗号候选（查询 ID 含英文逗号）——历史兼容可能匹配（统一契约 `matchCsvComma`，见 §4.9）：**

```text
matched = matchCsvComma(storedCsv, queryId)
// queryAtomic  = splitTrimDropEmpty(queryId)
// storedAtomic = splitTrimDropEmpty(storedCsv)
// matched = queryAtomic 是 storedAtomic 的连续子序列
```

- 由于无法识别逗号归属，只能按“可能匹配”处理。例如查询候选 `A,B`：存储 `A,B` → 可能匹配；存储 `X,A,B,Y` → 可能匹配；存储 `A,X,B` → 不匹配；结果不能断言 `A,B` 是一个 ID，可能是相邻的 `A` 和 `B`；
- 比较仍使用 Java `String.equals`；
- 候选经 §4.9 `splitTrimDropEmpty` 拆分后若没有任何非空原子片段（`NULL`/空白），后端拒绝该查询参数并返回参数校验错误，不得退化为匹配全部；
- 一个条件组中任意一个候选命中即为组内 OR；两个条件组都存在时必须分别计算，再执行 AND；
- 不得为了消除假阳性而丢弃可能匹配记录；
- 一次查询包含任意含逗号候选时，API 列表响应在 `queryWarnings` 中明确返回歧义条件，页面在查询条件和结果区域持续显示歧义警告（API.md §4.2）。
- 模糊搜索（源库候选搜索、Schema 内表名搜索）使用参数化 `UPPER(...) LIKE UPPER('%'||?||'%') ESCAPE '\'`，并对 `%`、`_`、`\` 转义（复用 `DataSourceServiceImpl.escapeLike` 模式）。

### 7.2 口令、连接串与堆栈脱敏

- `CDC_DATA_SOURCE.DATA_SOURCE_PASSWORD` 明文存储（项目负责人确认不加密，见已批准数据库基线）；本 Feature 只在后端读取并使用，**不得返回前端、不得写入日志、不得进入异常响应**。
- 元数据连接失败、校验失败的错误消息必须脱敏：不含密码、完整 JDBC 连接串、内部异常文本（复用 `ConnectionTester.sanitizeMessage` 分类：驱动不支持/主机无法解析/连接超时/无法连接/认证失败/数据库连接失败）。
- 前端不缓存任何敏感连接信息；不展示数据源密码相关字段。

### 7.3 列表不分页的规模处理

- 列表不分页（`DSUB-REQ-030`），一次显示全部启用记录。设计处理边界：订阅记录规模预期小（当前开发库 12 行；`sync-client` 按订阅配置建立同步任务，量级受业务约束），一次查询返回可接受；如未来规模显著增长，需重新评估分页需求，但本 Feature 第一版按不分页设计，不得为分页预留不必要结构。

### 7.4 240 张表性能与数据源最小字段投影

- 表选择交互：表格固定表头、内容区内部滚动，建议虚拟滚动以兼容更大规模（`DSUB-REQ-076`）。
- 不因 240 张已选表产生大量标签、弹窗无限增高或明显卡顿（`DSUB-REQ-080`）：选中状态仅通过复选框 + 整行浅蓝背景表达，不渲染重复“已选表”面板或标签云。
- 保存校验：一次源库连接、按 Schema 批量查询，避免约 240 次查询（`DSUB-REQ-084`）。
- 数据源展示映射最小字段：列表/详情映射数据源时使用专用 Mapper/投影只查询 `DATA_SOURCE_ID`、`DATA_SOURCE_ORG`、`FG_ACTIVE`、必要类别字段；**不应**为展示映射通过 `selectBatchIds` 加载包含密码的完整 `DataSource` Entity；密码仅在 `SourceMetadataService` 建立源 Oracle 连接时按需单条读取。

### 7.5 请求 loading、防重复提交、超时与取消

- 查询、保存、删除、删除预览、加载 Schema/表等请求处理中对应按钮禁用，防止重复提交（`DSUB-REQ-106`）。
- 源库元数据连接请求设置请求级超时（前端 axios timeout，后端驱动超时），失败提供明确脱敏提示与重试。
- 弹窗关闭/切换源库时的进行中请求按需取消（前端 AbortController 或等效），避免过期响应回写状态。

### 7.6 可观测性与日志边界

- 允许记录的业务日志：订阅记录标识（`DATA_SUB_ID`）、操作类型（新增/编辑/删除）、目标库/源库 ID、影响行数等非敏感业务信息（沿用 `DataSourceServiceImpl` 的 `log.info` 风格）。
- 严禁记录的敏感字段：`CDC_DATA_SOURCE.DATA_SOURCE_PASSWORD`、完整 JDBC 连接串、内部堆栈中的连接细节；不得在日志中出现完整口令。
- Schema 过滤兼容回退日志只记录回退原因与过滤模式，不含敏感信息（见 §6.3）。
- 不虚构当前项目不存在的监控平台；本 Feature 不新增监控、告警或埋点设施，仅使用项目现有日志能力。

## 8. 需求追踪

> 下表保证 `DSUB-REQ-001` ~ `DSUB-REQ-107` 每条至少映射到一个 R3 修订后真实存在的设计章节（DESIGN=本文，API=API.md，UI=UI.md，DATABASE=DATABASE.md）。映射为“设计覆盖”，表示该需求已在本设计草案中得到实现层决策；是否验收通过由 126 条验收用例另行判定（当前全部 `NOT_RUN`）。所有引用章节均为 R3 修订后的真实标题编号，无未来不存在的章节号。

| 需求 | 设计覆盖 |
|---|---|
| DSUB-REQ-001 | DESIGN §2.2、API §4.6 |
| DSUB-REQ-002 | DESIGN §2.2、DATABASE §3 |
| DSUB-REQ-003 | DESIGN §4.6、DATABASE §3 |
| DSUB-REQ-004 | DESIGN §2.2 |
| DSUB-REQ-005 | DESIGN §2.2、UI §4 |
| DSUB-REQ-006 | DESIGN §2.2、UI §4 |
| DSUB-REQ-007 | DATABASE §2.1、DATABASE §4.3、API §4.6 |
| DSUB-REQ-008 | DESIGN §4.1、DATABASE §3.1 |
| DSUB-REQ-009 | DESIGN §5.5、API §4.6 |
| DSUB-REQ-010 | DESIGN §4.7、UI §2.2 |
| DSUB-REQ-011 | UI §2.2 |
| DSUB-REQ-012 | DESIGN §3.8、UI §2.2 |
| DSUB-REQ-013 | DESIGN §4.1、DATABASE §3.1 |
| DSUB-REQ-014 | DESIGN §2.2、API §4.6 |
| DSUB-REQ-015 | DESIGN §4.1、DATABASE §3.1 |
| DSUB-REQ-016 | DESIGN §4.2、UI §6 |
| DSUB-REQ-017 | DESIGN §4.2、API §4.6、UI §5 |
| DSUB-REQ-018 | DESIGN §4.1、API §4.6 |
| DSUB-REQ-019 | DESIGN §5.5、API §4.6 |
| DSUB-REQ-020 | DATABASE §2.1、DATABASE §3、UI §2.2 |
| DSUB-REQ-021 | DATABASE §4.5、UI §7.5 |
| DSUB-REQ-022 | API §4.6、UI §5 |
| DSUB-REQ-023 | DESIGN §4.6、DATABASE §3 |
| DSUB-REQ-024 | DESIGN §4.6、DATABASE §3 |
| DSUB-REQ-025 | DESIGN §4.6、DATABASE §3 |
| DSUB-REQ-026 | DATABASE §3、DATABASE §4.3 |
| DSUB-REQ-027 | DATABASE §3、DATABASE §4.4 |
| DSUB-REQ-028 | API §4.2、DATABASE §4.1 |
| DSUB-REQ-029 | UI §2.1、API §4.2 |
| DSUB-REQ-030 | API §4.2、DATABASE §4.1 |
| DSUB-REQ-031 | API §4.2、DATABASE §4.1 |
| DSUB-REQ-032 | UI §2.1、API §4.2 |
| DSUB-REQ-033 | DESIGN §3.1、API §4.1 |
| DSUB-REQ-034 | DESIGN §3.1/§7.1、API §4.2、UI §2.1 |
| DSUB-REQ-035 | UI §2.2 |
| DSUB-REQ-036 | UI §2.2 |
| DSUB-REQ-037 | UI §2.2 |
| DSUB-REQ-038 | DESIGN §4.5、UI §2.2 |
| DSUB-REQ-039 | UI §2.2 |
| DSUB-REQ-040 | UI §2.2 |
| DSUB-REQ-041 | UI §2.2 |
| DSUB-REQ-042 | DESIGN §4.8、UI §2.2 |
| DSUB-REQ-043 | UI §2.2 |
| DSUB-REQ-044 | UI §3 |
| DSUB-REQ-045 | DESIGN §3.2、API §4.3 |
| DSUB-REQ-046 | UI §3、API §4.3 |
| DSUB-REQ-047 | UI §3、API §4.3 |
| DSUB-REQ-048 | UI §3、API §4.3 |
| DSUB-REQ-049 | UI §3 |
| DSUB-REQ-050 | DESIGN §4.4、UI §3 |
| DSUB-REQ-051 | UI §3 |
| DSUB-REQ-052 | UI §4 |
| DSUB-REQ-053 | UI §4 |
| DSUB-REQ-054 | UI §4 |
| DSUB-REQ-055 | UI §4 |
| DSUB-REQ-056 | UI §4 |
| DSUB-REQ-057 | API §4.6、UI §5 |
| DSUB-REQ-058 | UI §5、API §4.1 |
| DSUB-REQ-059 | UI §5、API §4.1 |
| DSUB-REQ-060 | UI §5 |
| DSUB-REQ-061 | UI §5 |
| DSUB-REQ-062 | UI §5 |
| DSUB-REQ-063 | UI §5、UI §7.2 |
| DSUB-REQ-064 | UI §5、API §4.1 |
| DSUB-REQ-065 | UI §5 |
| DSUB-REQ-066 | UI §5 |
| DSUB-REQ-067 | DESIGN §6.1、API §4.4 |
| DSUB-REQ-068 | DESIGN §6.5、API §4.4 |
| DSUB-REQ-069 | DESIGN §6.3、API §4.4 |
| DSUB-REQ-070 | DESIGN §6.2/6.4、UI §6、API §4.5 |
| DSUB-REQ-071 | UI §6 |
| DSUB-REQ-072 | UI §6、API §4.5 |
| DSUB-REQ-073 | UI §6 |
| DSUB-REQ-074 | UI §6 |
| DSUB-REQ-075 | UI §6 |
| DSUB-REQ-076 | UI §6 |
| DSUB-REQ-077 | DESIGN §7.4、UI §6 |
| DSUB-REQ-078 | UI §6 |
| DSUB-REQ-079 | UI §6 |
| DSUB-REQ-080 | DESIGN §7.4、UI §6 |
| DSUB-REQ-081 | API §4.6 |
| DSUB-REQ-082 | API §4.6、DESIGN §6.1 |
| DSUB-REQ-083 | API §4.6、DESIGN §6.4 |
| DSUB-REQ-084 | DESIGN §6.4、DATABASE §4.8 |
| DSUB-REQ-085 | API §4.6、UI §5 |
| DSUB-REQ-086 | UI §4、DESIGN §7.5 |
| DSUB-REQ-087 | UI §4 |
| DSUB-REQ-088 | UI §7.1、API §4.7 |
| DSUB-REQ-089 | UI §7.1、API §4.7 |
| DSUB-REQ-090 | UI §7.2 |
| DSUB-REQ-091 | UI §7.2、API §4.7 |
| DSUB-REQ-092 | DESIGN §6.4、API §4.8 |
| DSUB-REQ-093 | DESIGN §3.5、UI §7.3、API §4.8 |
| DSUB-REQ-094 | DESIGN §3.6、UI §7.4、API §4.8 |
| DSUB-REQ-095 | UI §7.4 |
| DSUB-REQ-096 | DATABASE §3、DATABASE §4.4、API §4.8 |
| DSUB-REQ-097 | DESIGN §5.1/§5.2、API §4.7 |
| DSUB-REQ-098 | DESIGN §5.1/§5.2、API §4.8 |
| DSUB-REQ-099 | DESIGN §5.1、DATABASE §5.1 |
| DSUB-REQ-100 | UI §7.5、DESIGN §3.7 |
| DSUB-REQ-101 | DATABASE §4.5 |
| DSUB-REQ-102 | UI §7.5 |
| DSUB-REQ-103 | DESIGN §5.1/§5.3、API §4.10 |
| DSUB-REQ-104 | API §4.9、API §4.10、UI §7.5 |
| DSUB-REQ-105 | UI §7.5 |
| DSUB-REQ-106 | DESIGN §7.5、UI §8 |
| DSUB-REQ-107 | DESIGN §2.2（大屏延期边界） |

### 8.1 126 条验收用例的设计覆盖

`docs/features/data-subscription/ACCEPTANCE.md` 的 126 条 `DSUB-AC-001` ~ `DSUB-AC-126` 在 R2 报告（`reports/DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R2.md`）§4.1 ~ §4.13 中按 13 个领域核对设计覆盖；本 R3 不逐条重复列举，覆盖事实保持有效，仅 §4.11 并发保护领域按 R3 改为无并发保护边界：

| 领域 | 设计覆盖落点 |
|---|---|
| §4.1 生效边界与 sync-client 字段 | DESIGN §2.2、UI §4 |
| §4.2 数据模型与存储规则 | DATABASE §2、§3、DESIGN §4 |
| §4.3 列表页面与查询 | DESIGN §3.1/§7.1、API §4.2、UI §2.1 |
| §4.4 异常记录与异常数据源展示 | DESIGN §3.8/§4.7、UI §2.2 |
| §4.5 查看详情 | DESIGN §3.2/§4.4、API §4.3、UI §3 |
| §4.6 新增/编辑弹窗交互与源库搜索 | DESIGN §3.3、API §4.1、UI §5 |
| §4.7 目标库选择 | DESIGN §6.5、API §4.1、UI §5 |
| §4.8 Schema 与表选择 | DESIGN §6.3/§6.4、API §4.4/§4.5、UI §6 |
| §4.9 新增保存规则 | DESIGN §3.3、API §4.6、DATABASE §4.3 |
| §4.10 编辑规则 | DESIGN §3.4/§3.5/§3.6、API §4.7/§4.8、DATABASE §4.4 |
| §4.11 并发保护（R3 改为**无并发保护边界**） | DESIGN §5.1/§5.2/§5.3、API §4.7~§4.10、DATABASE §5 |
| §4.12 删除规则 | DESIGN §3.7/§5.3、API §4.9/§4.10、UI §7.5、DATABASE §4.5 |
| §4.13 通用交互、安全与延期项 | DESIGN §7、UI §8、DESIGN §2.2（大屏延期边界） |

- R3 取消并发保护相关验收用例（`DSUB-AC-048/107/108/109/110/114/117` 逐字保持）由 R3 的“无并发保护边界”设计（DESIGN §5.1/§5.2/§5.3、API §4.7~§4.10、DATABASE §5）覆盖。
- 映射为“设计覆盖”不代表验收执行结果；126 条验收全部 `NOT_RUN`，是否验收通过由验收执行另行判定。

---

*文档状态：`DRAFT_PENDING_USER_REVIEW`。本文件为设计基线草案（R4 定向修订版，R4-R1 完成状态元数据定向收口），未获正式复审批准，不代表设计已批准、功能已实现或验收通过；R3 已按已批准“取消并发保护”需求完成定向修订，R4 已按 ChatGPT 对 R3 正式复审 `CHANGES_REQUIRED` 定向修正 DELETE 错误码、DELETE 删除前多源库异常后端防护与 Java null/split 语义三个确定问题；ChatGPT 对 R4 结果提交正式复审为业务设计通过、状态元数据 `CHANGES_REQUIRED`，R4-R1 已统一本文件顶部/页尾复审状态，等待 ChatGPT 对 R4-R1 结果提交正式复审。*
