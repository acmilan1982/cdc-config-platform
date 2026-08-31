# 数据订阅 Feature 设计基线（DESIGN）

## 1. 元数据与状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据订阅 |
| Feature 标识 | `data-subscription` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（设计基线草案，尚未获得项目负责人或 ChatGPT 正式复审批准） |
| 设计正式复审状态 | `PENDING_R2_REVIEW`（R1 正式复审结论 `CHANGES_REQUIRED`；本 R2 定向修订已完成，尚未获得 ChatGPT 正式设计复审批准） |
| 实现状态 | `NOT_STARTED`（本任务为纯文档设计基线 R2 定向修订，不涉及任何业务代码实现） |
| 验收执行状态 | 126 条全部 `NOT_RUN` |
| 任务编号 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R2`（R2 定向修订；前序 R1 任务 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1` 结果提交 `3609548238c9fede745f5291e258469ab7b78167`；首版任务 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001` 结果提交 `610401575938ba32f13fa635493f991bdfae81b6`） |
| 任务类型 | 纯文档设计基线 R2 定向修订（统一修正 R1 正式复审 `CHANGES_REQUIRED` 剩余四项：三类查询语义、元数据 API query 参数、物化视图显式排除、`DSUB-FP-V1` 字节级指纹） |
| 依据的已批准需求基线 | `docs/features/data-subscription/REQUIREMENTS.md`（`APPROVED`，107 条 `DSUB-REQ-001` ~ `DSUB-REQ-107`，当前版本为含逗号数据源 ID 查询兼容调整批准版本，批准依据提交 `afc5765956cac3c8f66d8857ff17565472d0c746`） |
| 依据的已批准验收基线 | `docs/features/data-subscription/ACCEPTANCE.md`（`APPROVED`，126 条 `DSUB-AC-001` ~ `DSUB-AC-126`，全部 `NOT_RUN`） |
| 创建日期 | 2026-08-30 |
| R1 修订日期 | 2026-08-30 |
| R2 修订日期 | 2026-08-31 |
| 设计依据 | 已批准需求/验收基线（含逗号查询批准版本，前序点号批准版本作为历史事实保留）+ 已批准数据库物理基线（`docs/database/`）+ 真实代码只读核验 + 项目既有实现模式 + ChatGPT 正式设计复审发现项 |

说明：本文件是设计草案，**不是正式批准的设计基线**。R1 已修正 ChatGPT 正式复审（`CHANGES_REQUIRED`）发现的主要问题并同步已批准点号规则；R2 统一修正剩余四项（三类查询语义、元数据 API query 参数、物化视图显式排除、`DSUB-FP-V1` 字节级指纹）并同步含逗号查询批准基线。R2 定向修订已完成，但本文件尚未获得 ChatGPT 正式设计复审批准，不表示设计已批准、功能已实现、部署或验收完成。

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
├── service/impl/SubscriptionServiceImpl.java     # 业务实现（校验/事务/行锁并发/持久化）
├── service/SourceMetadataService.java            # 源库 Oracle 元数据只读访问接口
├── service/impl/SourceMetadataServiceImpl.java   # 元数据只读访问实现（复用 ConnectionFactory）
├── mapper/DataSubscribeMapper.java               # extends BaseMapper<DataSubscribe> + 专用锁行/投影查询
├── entity/DataSubscribe.java                     # 订阅记录实体（订阅模块专用，@TableId IdType.INPUT）
├── dto/SubscriptionSaveDTO.java                  # 新增/编辑保存请求（含 SourceTableInput[] 与 sourceSelectionMode）
├── dto/SourceTableInput.java                     # 结构化源表输入项（schemaName + tableName）
├── dto/SubscriptionQuery.java                    # 列表查询参数
├── vo/SubscriptionRowVO.java                     # 列表行
├── vo/SubscriptionDetailVO.java                  # 详情
├── vo/SubscriptionEditOpenVO.java                # 编辑打开回显 + 版本令牌
├── vo/SubscriptionDeletePreviewVO.java           # 删除预览（删除确认信息 + 版本令牌）
├── vo/SourceOptionVO.java                        # 源库候选
├── vo/TargetOptionVO.java                        # 目标库候选
├── vo/SchemaVO.java                              # Schema 元数据
├── vo/TableVO.java                               # 表元数据
├── converter/SubscriptionConverter.java          # Entity <-> VO/DTO 转换
└── exception/SubscriptionErrorCode.java          # 专用错误码（见 API.md §7）
```

> 实体决策（R1 已定，不再悬而未决）：`largescreen/stats/entity/DataSubscribeEntity.java` 已存在且映射 12 个字段，但它是大屏统计模块的只读投影。订阅模块若反向引用 `largescreen.stats` 会产生模块倒置耦合；两个模块生命周期不同。因此 R1 明确：在 `subscription` 模块建立专用 `DataSubscribe` 实体，复用同一张表 `CDC_DATA_SUBSCRIBE`，字段映射与大屏实体一致，且主键采用 `@TableId(value = "DATA_SUB_ID", type = IdType.INPUT)`（依据见 §5.1）。两种实体都指向同一张表，不改变表结构与字段映射；**不修改现有大屏实体**。

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
2. 调 `GET /api/subscriptions/{dataSubId}/edit` 回显描述、源库、目标库、全部 Schema 与源表选择，并返回版本令牌（`DSUB-REQ-088/097`）。
3. 自动加载原记录涉及的全部 Schema 及其表，恢复勾选与浅蓝背景（`DSUB-REQ-088/089`）。
4. 用户修改后保存：后端重新校验（同新增）并按版本令牌做并发检测；通过后写入（`DATA_SUB_ID`、`INSERT_TIME` 保持不变，`UPDATE_TIME` 更新为数据库当前时间，遗留字段保持原值）（`DSUB-REQ-096`）。
5. 原选择中的表已删除或不可访问时，显示“异常已选表”警告，不得静默取消（`DSUB-REQ-091`）。
6. 编辑保存使用 `sourceSelectionMode = PRESERVE | REPLACE`（契约见 §4.2 与 API.md §4.8）：
   - `REPLACE`（源表变更或缺省于 REPLACE 语义的新增）：必须提交结构化 `sourceTables`，必须成功连接源 Oracle 并批量校验，UPDATE 写入重新构造的完整表清单；
   - `PRESERVE`（有限编辑）：不提交 `sourceTables`，后端要求请求 `dataFromSourceId` 与锁定后的当前记录完全一致，UPDATE 不设置 `DATA_SOURCE_TABLE`，原始 CLOB 逐字保留。
   - 后端不能只相信前端模式：锁行后必须结合当前记录、版本令牌和请求字段验证模式合法性（见 §5.2）。

### 3.5 源 Oracle 断连时仅修改描述和目标库

1. 编辑打开时若源库校验或元数据加载失败（源 Oracle 暂时无法连接），进入“有限编辑”模式（`DSUB-REQ-093`）。
2. 只要源库与 `DATA_SOURCE_TABLE` 完全未变（即请求采用 `sourceSelectionMode=PRESERVE` 且 `dataFromSourceId` 与锁定后的当前记录一致）：允许修改订阅描述和目标库；不允许新增、删除或更换源表；不允许更换源库后绕过源表重新选择。
3. 页面明确说明当前使用已保存源表配置，未完成源库实时校验。
4. 若用户修改了源库或源表，则必须成功连接源 Oracle 并完成保存前有效性校验，保存模式为 `REPLACE`（`DSUB-REQ-092`）。
5. 断连且 `PRESERVE` 时仅允许描述和目标库变化；`DATA_SOURCE_TABLE` 原始内容不因解析/排序被意外重写。

### 3.6 已停用/不存在数据源的修复

1. 原订阅引用的源库或目标库已停用或不存在时，回显原值并标记异常（`DSUB-REQ-094`）。
2. 编辑保存前必须替换或修复异常数据源；不得原样保存或强制保存（`DSUB-REQ-094`）。
3. 若同时存在源表无法访问等失效项，一次性列出具体失效项，用户修正后重试（`DSUB-REQ-085`）。
4. 如果原源库已停用/不存在或原配置含保留字符无效项，仍必须按已批准需求修复后才能保存，不能借 `PRESERVE` 模式绕过。

### 3.7 删除与并发保护

1. 正常单源库记录提供“删除”入口；多源库异常记录无删除入口（`DSUB-REQ-100`）。
2. 点击列表“删除”：先调用 `GET /api/subscriptions/{dataSubId}/delete-preview` 获取删除确认所需最新信息与版本令牌；成功后再展示确认弹窗（订阅描述、源库、Schema 数、源表数量、目标库、“数据库记录物理删除且无法恢复”、“当前运行中的同步任务不会立即停止，需要重启相关 sync-client 后生效”）（`DSUB-REQ-102`）。
3. 用户确认后 `DELETE /api/subscriptions/{dataSubId}` 回传删除预览得到的版本令牌；后端在行锁内重新读取当前记录比较内容指纹，记录已被修改则拒绝删除并刷新列表（`DSUB-REQ-103`；见 §5.2）。
4. 记录不存在时提示“记录不存在或已被删除”（`DSUB-REQ-104`）。
5. 删除成功刷新列表并提示重启后生效（`DSUB-REQ-105`）。
6. 删除预览只读取配置库，不连接源 Oracle；不复用会连接源 Oracle 的“编辑打开”接口获取删除令牌。

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

- `DATA_FROM_SOURCE_ID` 拆分 token 数 ≥ 2 且记录 `FG_ACTIVE=1` → 多源库异常记录（`DSUB-REQ-010`）。
- 识别由后端完成，前端仅展示；异常记录整行警示，无任何操作（`DSUB-REQ-011/012`）。

### 4.8 已停用/不存在数据源映射

- 订阅引用的数据源即使已停用或不存在，记录仍然显示（`DSUB-REQ-042`）：
  - 已停用：显示 `DATA_SOURCE_ORG` 并标记“已停用”；
  - 不存在：显示原始 `DATA_SOURCE_ID` 并标记“不存在”。
- 详情同样展示上述警告（`DSUB-REQ-048`）。
- 列表/详情映射数据源时使用专用 Mapper/投影只查询 `DATA_SOURCE_ID`、`DATA_SOURCE_ORG`、`FG_ACTIVE` 及必要类别字段，不得通过 `selectBatchIds` 加载含密码的完整 Entity 用于展示映射（密码仅在 SourceMetadataService 建立源 Oracle 连接时按需单条读取，见 §7.4 与 DATABASE.md §4.6）。

## 5. 并发与幂等

### 5.1 版本令牌（`DSUB-FP-V1` 内容指纹，无需新增数据库列）

- 采用**内容指纹版本令牌**：编辑打开或删除预览时，后端基于记录当前完整业务内容计算一个指纹，作为并发标识返回前端；保存/删除时前端回传该令牌，后端在行锁内重新读取当前完整记录计算指纹并比较。
- 指纹规范统一为字节级确定、可复现的 **`DSUB-FP-V1`** 算法（本文件为权威定义；API.md §4.7/§4.9、DATABASE.md §5.2 准确引用并重复必要契约，四份文档不得出现矛盾版本）。

**指纹字段顺序（固定且不可改变，10 个字段，均取自当前完整记录）：**

| # | 字段 | 类型 |
|---|---|---|
| 1 | `DATA_SUB_ID` | VARCHAR2 |
| 2 | `DATA_SUB_DESC` | VARCHAR2 |
| 3 | `DATA_FROM_SOURCE_ID` | VARCHAR2 |
| 4 | `DATA_TO_SOURCE_ID` | VARCHAR2 |
| 5 | `DATA_SOURCE_TABLE` | CLOB |
| 6 | `DATA_SOURCE_COMMENT` | CLOB |
| 7 | `DATA_TARGET_TABLE` | CLOB |
| 8 | `DATA_TARGET_COMMENT` | CLOB |
| 9 | `INSERT_TIME` | DATE |
| 10 | `UPDATE_TIME` | DATE |

- `DELETE_TIME`、`FG_ACTIVE` 不参与指纹（现有决定，四份文档一致）：`DELETE_TIME` 未维护（物理删除，无删除时间可参与）；`FG_ACTIVE` 本 Feature 恒为 `'1'`，不参与编辑/删除并发判断。不得将其悄悄加入或遗漏上述十个字段。

**输入值规范：**

- 字符串字段：使用数据库读取到的原始 Java 字符序列，不 trim、不大小写转换、不 CSV 规范化；
- CLOB：读取完整字符内容，不截断，再按 UTF-8 编码；
- 空字符串与 NULL 必须不同（见编码）；
- Oracle `DATE` 不含时区且精度到秒，**禁止使用依赖 JVM 默认时区的 epoch millis 规则**。编辑打开、删除预览和锁行重读的 Mapper SQL 必须使用同一表达式取得日期指纹值：

```sql
TO_CHAR(INSERT_TIME, 'YYYY-MM-DD"T"HH24:MI:SS',
        'NLS_DATE_LANGUAGE=American NLS_CALENDAR=GREGORIAN') AS INSERT_TIME_FP,
TO_CHAR(UPDATE_TIME, 'YYYY-MM-DD"T"HH24:MI:SS',
        'NLS_DATE_LANGUAGE=American NLS_CALENDAR=GREGORIAN') AS UPDATE_TIME_FP
```

- DATE 为 NULL 时规范值为 NULL；非空时为固定 19 个 ASCII 字符；指纹计算使用上述 `*_TIME_FP` 字符串，不使用 JVM 默认时区转换。

**二进制帧规范（使用 Java `DataOutputStream` 等价的大端序写入）：**

```text
固定头：ASCII 10 字节 "DSUB-FP-V1"
随后按上述固定字段顺序写入 10 个 FieldFrame
```

每个 `FieldFrame`：

```text
nameLength   : 4 字节 signed int32，大端序，值为字段名 UTF-8 字节数
nameBytes    : nameLength 字节，字段名 UTF-8（字段名均为 ASCII）
nullFlag     : 1 字节；0x00 表示 NULL，0x01 表示非 NULL
若 nullFlag=0x00：本字段结束，不写 valueLength/valueBytes
若 nullFlag=0x01：
  valueLength: 8 字节 signed int64，大端序，值为 valueBytes 长度，允许 0
  valueBytes : valueLength 字节，规范值 UTF-8
```

约束：

- 任何其他 nullFlag 值均属内部实现错误；
- 字段名、字段顺序、固定头、字节序和长度宽度不得由实现自行选择；
- 空字符串编码为 `0x01 + int64(0)`，与 NULL 的 `0x00` 明确不同；
- 对完整字节流执行 SHA-256；
- `versionToken` 输出固定 64 个小写十六进制字符；
- 使用一个后端共享工具方法（如 `SubscriptionFingerprintV1`），编辑打开、删除预览、编辑保存锁内比较、删除锁内比较必须复用同一实现；
- 令牌只用于并发检测，不是认证或安全凭证；
- 不新增版本列、触发器或 DDL。

**黄金测试向量（`DSUB-FP-V1`）：**

十个字段示例值（规范输入，不做任何 trim/转换；`NULL` 表示 NULL，`""` 表示空字符串）：

| # | 字段 | 规范值 |
|---|---|---|
| 1 | `DATA_SUB_ID` | `sub-000000000000000000000001` |
| 2 | `DATA_SUB_DESC` | `订阅：源A同步到目标B`（中文，UTF-8 29 字节） |
| 3 | `DATA_FROM_SOURCE_ID` | `SRC-001` |
| 4 | `DATA_TO_SOURCE_ID` | `TGT-001,TGT-002` |
| 5 | `DATA_SOURCE_TABLE` | `SRC-001.APP.ORDERS,SRC-001.APP.PAYMENTS`（非空 CLOB，UTF-8 39 字节） |
| 6 | `DATA_SOURCE_COMMENT` | `""`（空字符串，编码为 `0x01 + int64(0)`） |
| 7 | `DATA_TARGET_TABLE` | `NULL` |
| 8 | `DATA_TARGET_COMMENT` | `NULL` |
| 9 | `INSERT_TIME` | `2026-08-30T10:15:00`（非空 DATE，固定 19 ASCII 字符） |
| 10 | `UPDATE_TIME` | `NULL`（空 DATE） |

该黄金向量包含：至少一个 NULL（`DATA_TARGET_TABLE`/`DATA_TARGET_COMMENT`/`UPDATE_TIME`）、一个空字符串（`DATA_SOURCE_COMMENT`）、一个中文字符串（`DATA_SUB_DESC`）、一个非空 CLOB（`DATA_SOURCE_TABLE`）、一个非空 DATE 与一个空 DATE（`INSERT_TIME`/`UPDATE_TIME`）。按上述算法生成的完整字节流长度 **407 字节**，SHA-256 小写十六进制 64 字符：

```text
bc1e643aa5154798030a7523d08dd7348d0e5186b508a0e67bba4e0c7de547dd
```

该黄金向量在纯文档任务中用临时本地脚本按规范编码计算，并用独立临时脚本第二次计算复核一致（复核方式见 R2 报告 §10）。四份设计文档对算法、字段顺序和黄金值必须完全一致。

- 该方案**不新增版本列、不依赖 `UPDATE_TIME` 单独判断**（人工直接维护数据库时不一定同步更新时间，`DSUB-REQ-099`）。
- 人工只改时间字段（`INSERT_TIME`/`UPDATE_TIME`）导致指纹变化并触发一次保守冲突，属于可接受的保守误报（提示刷新后重新编辑），不是漏报。

### 5.2 原子行锁并发（SELECT ... FOR UPDATE）

普通 `SELECT` 和 MyBatis-Plus `selectById()` 不会锁行，仅靠 `@Transactional` 不能避免 TOCTOU 竞态。R1 统一采用：

```text
SELECT 当前记录 FOR UPDATE
→ 在行锁内计算并比较 versionToken
→ 匹配后 UPDATE 或 DELETE
→ 提交事务释放行锁
```

**编辑保存流程：**

1. 如需源 Oracle 实时校验（`REPLACE` 模式），先在配置库事务外完成；
2. 进入配置库 `@Transactional` 方法；
3. 使用专用 Mapper 执行：

```sql
SELECT ...
FROM CDC_DATA_SUBSCRIBE
WHERE DATA_SUB_ID = #{dataSubId}
FOR UPDATE
```

4. 查不到记录返回 `40430` 不存在错误；
5. 对锁定后的当前完整记录计算内容指纹（§5.1），与请求 `versionToken` 比较；
6. 不匹配返回 `40910` 并发冲突并回滚；
7. 匹配后执行 UPDATE，受影响行数必须为 1（0 行 → `40430`，多行异常 → `50040`）；
8. 提交后释放锁。

外部源库校验与锁定记录之间的正确性：进入事务锁定后必须再次比较打开编辑时的版本令牌；若记录在外部校验期间发生变化，令牌不匹配并拒绝写入，因此外部校验结果不会应用到不同版本的配置记录。

**删除流程：**

- 删除同样必须使用 `SELECT ... FOR UPDATE`，在锁内比较删除预览返回的令牌，再物理删除（`DELETE` 受影响行数必须为 1）。

### 5.3 事务边界与受影响行数检查

- 新增：`@Transactional`；`INSERT` 后校验受影响行数 = 1，否则 `50040 SAVE_FAILED`。
- 编辑：`@Transactional`；事务内先 `SELECT ... FOR UPDATE` 锁当前行 → 指纹比较 → `UPDATE`（受影响行数必须 = 1，0 行表示记录不存在 → `40430`）。
- 删除：`@Transactional`；事务内 `SELECT ... FOR UPDATE` 锁当前行 → 指纹比较 → `DELETE`（受影响行数必须 = 1，0 行 → `40430`）。
- 数据源/表校验（源库连接）与配置库写入不在同一数据库事务（源库为外部 Oracle，配置库为 CDC）；校验通过后才进入 CDC 配置库事务写入，二者之间不构成跨库事务。

### 5.4 重复提交边界

- 前端按钮 loading 是首期主要防重复机制（`DSUB-REQ-086/106`）。
- 新增使用随机 UUID 作为 `DATA_SUB_ID`，主键约束不能阻止同一业务请求被重复提交后形成两条逻辑重复记录。
- 已批准需求允许跨行重复订阅（`DSUB-REQ-009/019`），因此后端不得虚假声明新增天然幂等。
- 文档准确表述为：“防止用户界面重复点击，但网络重试可能形成允许的重复记录；首期未设计请求幂等键”。
- 编辑/删除的重复提交在指纹匹配后若记录已变更/已删除，会因指纹不匹配或 0 行而返回错误，不会产生重复数据。

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

**普通候选（查询 ID 不含英文逗号）——完整 token 字面精确匹配：**

```text
storedSegments = storedCsv.split(",", -1)
                 .map(trim)
                 .filter(nonEmpty)
matched = storedSegments.any(segment -> segment.equals(queryId))
```

- Java `String.equals`，大小写敏感；
- `%`、`_`、反斜杠、句点、正则字符全部按普通字面字符处理；
- 不使用 `LIKE`、正则或 `%ID%`；`S01` 不匹配 `S012`；
- 查询 ID 的候选值来自数据库，不擅自 trim 或改变其内部字符；前端回传原始 ID 字符串；
- 仅含英文句点（不含英文逗号）的 ID 适用本精确规则（句点不是这两个 CSV 字段的分隔符）。

**含逗号候选（查询 ID 含英文逗号）——历史兼容可能匹配：**

```text
storedAtomic = split storedCsv by comma, trim each atomic segment, drop empty
queryAtomic  = split queryId   by comma, trim each atomic segment, drop empty
matched = queryAtomic is a contiguous subsequence of storedAtomic
```

- 由于无法识别逗号归属，只能按“可能匹配”处理。例如查询候选 `A,B`：存储 `A,B` → 可能匹配；存储 `X,A,B,Y` → 可能匹配；存储 `A,X,B` → 不匹配；结果不能断言 `A,B` 是一个 ID，可能是相邻的 `A` 和 `B`；
- 比较仍使用 Java `String.equals`；
- 候选按逗号拆分后若没有任何非空原子片段，后端拒绝该查询参数并返回参数校验错误，不得退化为匹配全部；
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

> 下表保证 `DSUB-REQ-001` ~ `DSUB-REQ-107` 每条至少映射到一个 R2 修订后真实存在的设计章节（DESIGN=本文，API=API.md，UI=UI.md，DATABASE=DATABASE.md）。映射为“设计覆盖”，表示该需求已在本设计草案中得到实现层决策；是否验收通过由 126 条验收用例另行判定（当前全部 `NOT_RUN`）。所有引用章节均为 R2 修订后的真实标题编号，无未来不存在的章节号。

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
| DSUB-REQ-009 | DESIGN §5.4、API §4.6 |
| DSUB-REQ-010 | DESIGN §4.7、UI §2.2 |
| DSUB-REQ-011 | UI §2.2 |
| DSUB-REQ-012 | DESIGN §3.8、UI §2.2 |
| DSUB-REQ-013 | DESIGN §4.1、DATABASE §3.1 |
| DSUB-REQ-014 | DESIGN §2.2、API §4.6 |
| DSUB-REQ-015 | DESIGN §4.1、DATABASE §3.1 |
| DSUB-REQ-016 | DESIGN §4.2、UI §6 |
| DSUB-REQ-017 | DESIGN §4.2、API §4.6、UI §5 |
| DSUB-REQ-018 | DESIGN §4.1、API §4.6 |
| DSUB-REQ-019 | DESIGN §5.4、API §4.6 |
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
| DSUB-REQ-097 | DESIGN §5.1、API §4.7 |
| DSUB-REQ-098 | DESIGN §5.2、API §4.8 |
| DSUB-REQ-099 | DESIGN §5.1、DATABASE §5.2 |
| DSUB-REQ-100 | UI §7.5、DESIGN §3.7 |
| DSUB-REQ-101 | DATABASE §4.5 |
| DSUB-REQ-102 | UI §7.5 |
| DSUB-REQ-103 | DESIGN §5.2、API §4.10 |
| DSUB-REQ-104 | API §4.9、API §4.10、UI §7.5 |
| DSUB-REQ-105 | UI §7.5 |
| DSUB-REQ-106 | DESIGN §7.5、UI §8 |
| DSUB-REQ-107 | DESIGN §2.2（大屏延期边界） |

---

*文档状态：`DRAFT_PENDING_USER_REVIEW`。本文件为设计基线草案（R2 定向修订版），未获正式复审批准，不代表设计已批准、功能已实现或验收通过；R2 定向修订已完成，等待 ChatGPT 正式设计 R2 复审。*
