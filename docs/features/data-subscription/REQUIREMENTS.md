# 数据订阅 Feature 需求基线（REQUIREMENTS）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据订阅 |
| Feature 标识 | `data-subscription` |
| 正式菜单 | 数据订阅（配置管理组，路由 `/config/subscribe`，菜单项与路由均保持既有值不变） |
| 既有路由 | `/config/subscribe` |
| 目标文档 | `docs/features/data-subscription/REQUIREMENTS.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（需求基线草案，尚未获得项目负责人正式批准） |
| 实现状态 | `NOT_STARTED`（本任务为纯文档需求基线任务，不涉及任何业务代码实现） |
| 任务编号 | `DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001` |
| 任务类型 | Feature 需求与验收基线草案落盘、数据库物理事实定向核验、提交与推送（纯文档任务） |
| 授权基线提交 | `a98811c5c7aab1df7685231982c06ed339253008`（执行时实际 `origin/develop` 最新提交） |
| 创建日期 | 2026-08-30 |
| 需求来源 | 已确认的产品决策（本任务提示词 §6～§15 记录的产品需求）+ 已批准数据库基线（`docs/database/`）+ 真实代码只读核验 + 真实数据库只读核验 |
| 主键核验状态 | `DATABASE_VERIFIED`（`CDC_DATA_SUBSCRIBE.DATA_SUB_ID` 真实主键经只读核验确认，见 §4） |

说明：本文件把已经确认的产品决策落成 Feature 需求基线草案。文档状态为 `DRAFT_PENDING_USER_REVIEW`，实现状态为 `NOT_STARTED`，全部验收用例初始状态为 `NOT_RUN`。本文件不代表业务功能已经实现或验收通过，也不得把“待实现目标”描述为“当前已经实现”。

本文件同时区分历史事实与当前事实：

- **当前事实（OBSERVED_CODE / OBSERVED_DATABASE）**：代码和数据库当前实际状态，只读核验所得。
- **目标需求（TARGET_REQUIREMENT）**：已确认的目标业务规则（本文件后续章节 DSUB-REQ 系列）。
- **当前差距（GAP）**：当前事实与目标需求不一致、需要后续设计/实现修正的部分。

## 2. Feature 定位与术语

### 2.1 Feature 定位

“数据订阅”用于通过 `cdc-config` 页面维护 `CDC_DATA_SUBSCRIBE`，配置：

```text
一个源库 × 一组源表 × 一个或多个目标库
```

`sync-client` 启动时读取订阅配置，并据此建立同步任务。

### 2.2 术语

| 术语 | 说明 |
|---|---|
| 订阅记录 | `CDC_DATA_SUBSCRIBE` 的一行记录，表示一组“源库 → 源表 → 目标库”订阅关系。 |
| 源库 | 订阅的数据来源库，对应 `DATA_FROM_SOURCE_ID`，弱引用 `CDC_DATA_SOURCE` 中类别为源库（SOURCE）的记录主键。 |
| 目标库 | 订阅的数据去向库，对应 `DATA_TO_SOURCE_ID`，弱引用 `CDC_DATA_SOURCE` 中类别为目标库（TARGET）的记录主键。 |
| 源表 | 订阅中需要同步的表，对应 `DATA_SOURCE_TABLE`，单张表格式为 `DATA_SOURCE_ID.Schema.表名`。 |
| 有效记录 | `FG_ACTIVE = '1'` 的订阅记录。列表只查询和展示有效记录。 |
| 多源库异常记录 | `DATA_FROM_SOURCE_ID` 含多个源库（含英文逗号）的启用记录，属异常记录。 |
| 遗留字段 | `DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT`，旧配置程序遗留字段，`sync-client` 不读取。 |
| 生效边界 | 本 Feature 只维护数据库订阅记录，不负责通知/重启 `sync-client`、操作 ZooKeeper、Kafka、进程或判断运行态生效。 |

## 3. 当前状态与目标差距分层

> 快照说明：本节（§3）记录的是本需求基线建立时（2026-08-30）对现有代码与数据库的“实施前差距”历史快照，作为当时的需求决策依据保留，**不代表后续实现后的代码事实**。本 Feature 目标功能尚未实现，实现状态 `NOT_STARTED`。

### 3.1 当前前端实现（占位）

- 菜单项“数据订阅”已存在：`frontend/src/config/menu.ts` 中 `{ path: '/config/subscribe', title: '数据订阅', icon: 'Connection' }`（配置管理组）。
- 路由已存在：`frontend/src/router/index.ts` 中 `/config/subscribe`（name `DataSubscribe`），指向 `@/views/data-subscribe/DataSubscribePage.vue`。
- 页面为 `PlaceholderPage` 占位页：`frontend/src/views/data-subscribe/DataSubscribePage.vue` 仅展示占位文案，**无任何订阅管理业务能力**。

### 3.2 当前后端实现

- 当前仓库未发现 `cdc-config` 写入 `CDC_DATA_SUBSCRIBE` 的 Controller/Service/Mapper 实现；本表当前由人工维护。
- 当前仅存在大屏统计模块对 `CDC_DATA_SUBSCRIBE` 的只读消费（`largescreen/stats`）：`DataSubscribeEntity`（`@TableName("CDC_DATA_SUBSCRIBE")`、`@TableId("DATA_SUB_ID")`）、`DataSubscribeMapper`（`extends BaseMapper<DataSubscribeEntity>`）、`LargeScreenServiceImpl` 中按 `FG_ACTIVE='1'` 读取并解析订阅配置用于维度映射。
- 后端已具备可复用的动态连接能力（`datasource/connection` 包，Oracle/MySQL/Doris 动态 JDBC 连接、密码安全、脱敏错误信息），可供后续设计阶段评估复用。

### 3.3 当前数据库事实（只读核验）

- `CDC_DATA_SUBSCRIBE` 主键 `PK_CDC_DATA_SUBSCRIBE`（`DATA_SUB_ID`，VARCHAR2(32)，NOT NULL）已真实存在：约束类型 PRIMARY KEY（P）、ENABLED、NOT DEFERRABLE IMMEDIATE；对应唯一索引 NORMAL/UNIQUE/VALID（USERS 表空间）；表与索引 `LAST_DDL_TIME` 均为 2026-08-28 17:36:20。**本任务只读核验通过（DATABASE_VERIFIED）**，当前物理基线中的“无主键”描述为过期描述，已按任务 §5.2 定向修正。
- 当前行数 12；`DATA_SUB_ID` 12 行 0 空值 0 重复；`FG_ACTIVE` 分布 0=11、1=1（开发库多为停用记录）。以上为开发库瞬时观测，不代表生产常态。
- `DATA_FROM_SOURCE_ID`、`DATA_TO_SOURCE_ID` 为英文逗号分隔的多值弱逻辑引用；`DATA_SOURCE_TABLE` 等 4 个 CLOB 字段存储订阅表清单与注释（逗号分隔结构）。

### 3.4 当前差距（GAP）

| 当前事实 | 与目标的差距 |
|---|---|
| 前端为占位页，无订阅管理能力 | 目标：完整的新增/编辑/删除/查看/查询列表页面 |
| 后端无 `cdc-config` 写入 `CDC_DATA_SUBSCRIBE` 的实现 | 目标：后端提供订阅记录的查询、新增、编辑、删除接口，按本文件业务规则写入 |
| 大屏解析 `DATA_SOURCE_TABLE` 存在按换行符拆分的实现 | 目标协议为英文逗号分隔；大屏差异记录为 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`，本 Feature 阶段不修改大屏（见 §17） |

## 4. 数据来源与已批准数据库基线引用

本 Feature 涉及的 `CDC_DATA_SUBSCRIBE` 表物理结构、字段类型、长度、可空性、约束与当前行数引用已批准数据库基线，并结合本任务真实数据库只读核验。

| 引用项 | 权威文档 |
|---|---|
| 数据库文档总入口与批准基线说明 | `docs/database/README.md` |
| 表总体清单 | `docs/database/SCHEMA.md` |
| 数据规模画像 | `docs/database/DATA_PROFILE.md` |
| 数据库结构历史 | `docs/database/CHANGELOG.md` |
| `CDC_DATA_SUBSCRIBE` 单表物理基线 | `docs/database/tables/CDC_DATA_SUBSCRIBE.md` |

引用事实摘要（本任务只读核验，`DATABASE_VERIFIED`）：

- `CDC_DATA_SUBSCRIBE`：主键 `PK_CDC_DATA_SUBSCRIBE`（`DATA_SUB_ID`，VARCHAR2(32)，NOT NULL，ENABLED，NOT DEFERRABLE IMMEDIATE，对应唯一索引 VALID）。其余字段：`DATA_SUB_DESC`（VARCHAR2(255)）、`DATA_FROM_SOURCE_ID`（VARCHAR2(1024)）、`DATA_TO_SOURCE_ID`（VARCHAR2(1024)）、`DATA_SOURCE_TABLE`（CLOB，约 4000）、`DATA_SOURCE_COMMENT`（CLOB，约 4000）、`DATA_TARGET_TABLE`（CLOB，约 4000）、`DATA_TARGET_COMMENT`（CLOB，约 4000）、`INSERT_TIME`/`UPDATE_TIME`/`DELETE_TIME`（DATE）、`FG_ACTIVE`（VARCHAR2(1)）。除 `DATA_SUB_ID` 外其余字段可空（当前物理事实）。
- `DATA_FROM_SOURCE_ID`、`DATA_TO_SOURCE_ID`、`DATA_SOURCE_TABLE` 等逗号分隔字段为应用层协议，不得写成数据库约束。

## 5. 功能范围（范围内/范围外）

### 5.1 范围内

- 通过 `cdc-config` 页面维护 `CDC_DATA_SUBSCRIBE`，配置“一个源库 × 一组源表 × 一个或多个目标库”。
- 订阅记录列表（只显示 `FG_ACTIVE=1`、不分页、按更新时间倒序、源库/目标库多选查询）。
- 订阅记录查看详情（居中只读弹窗，不连接源 Oracle）。
- 订阅记录新增、编辑（近全屏大弹窗 + Schema 懒加载 + 表批量选择 + 后端批量有效性校验）。
- 订阅记录删除（按主键物理删除、二次确认、并发保护）。
- 多源库异常记录的整行警示与“无任何操作”展示。
- 停用/不存在数据源的标记展示与编辑约束。
- 通用交互：防重复提交、未保存关闭确认、可拖动弹窗、重启 `sync-client` 后生效提示。

### 5.2 范围外

- 通知、重启 `sync-client`；
- 操作 ZooKeeper（创建/修改/删除节点）；
- 创建、删除或检查 Kafka Topic；判断 Topic 是否应删除；
- 判断配置是否已经在运行态生效；启停同步任务；
- 展示页面无法可靠判断的“已生效”或“待生效”状态；
- 停用、恢复、回收站；
- 多源库异常记录的自动拆分或修复；
- 修改大屏解析 `DATA_SOURCE_TABLE` 的代码或大屏基线；
- 数据库 DDL、数据清洗、存量异常数据处理、生产数据写入；
- 用户认证/权限管理。

## 6. 角色与主要使用场景

| 角色 | 说明 |
|---|---|
| CDC 运维/开发人员 | 通过“数据订阅”页面维护订阅配置：查看订阅列表、查询、查看详情、新增、编辑、删除订阅记录。 |

主要使用场景：

1. 进入“配置管理 > 数据订阅”，首次进入自动展示全部启用订阅记录；
2. 按源库/目标库多选查询；重置只清空查询表单，不自动重新查询，列表保持上一次已生效的查询结果；
3. 查看订阅详情（只读弹窗，按 Schema 分组的源表清单）；
4. 新增订阅：选择源库 → 加载并选择 Schema 与源表 → 选择目标库 → 保存；
5. 编辑订阅：回显原配置并修改，源库断连时进行有限编辑；
6. 删除订阅（物理删除、二次确认）。

## 7. 生效边界与 sync-client 读取字段

| 编号 | 需求 |
|---|---|
| DSUB-REQ-001 | 本 Feature 目标：通过 `cdc-config` 页面维护 `CDC_DATA_SUBSCRIBE`，配置“一个源库 × 一组源表 × 一个或多个目标库”；`sync-client` 启动时读取订阅配置并据此建立同步任务。 |
| DSUB-REQ-002 | `sync-client` 实际读取字段仅限：`DATA_FROM_SOURCE_ID`、`DATA_TO_SOURCE_ID`、`DATA_SOURCE_TABLE`、`FG_ACTIVE`。 |
| DSUB-REQ-003 | `DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT` 属于旧配置程序遗留字段，不被 `sync-client` 使用。 |
| DSUB-REQ-004 | 首期运行边界：本 Feature 只维护数据库订阅记录，不负责通知或重启 `sync-client`、不操作 ZooKeeper、不创建/删除/检查 Kafka Topic、不判断 Topic 是否应删除、不判断配置是否已在运行态生效、不启停同步任务。 |
| DSUB-REQ-005 | 新增、编辑、删除均需重启相关 `sync-client` 后生效；页面不得显示无法可靠判断的“已生效”或“待生效”状态。 |
| DSUB-REQ-006 | 所有增删改成功后统一提示：“操作成功。配置将在相关 sync-client 重启后生效。” |

## 8. 数据模型与存储规则

### 8.1 主键与源库

| 编号 | 需求 |
|---|---|
| DSUB-REQ-007 | `DATA_SUB_ID` 是数据库真实主键（`PK_CDC_DATA_SUBSCRIBE`，只读核验 `DATABASE_VERIFIED`）；生产库部署由用户自行负责，不属于本任务 DDL 范围。新增时由后端生成唯一 ID，具体格式依据现有代码、字段长度和项目 ID 规范在后续设计阶段确定；本需求阶段不得虚构格式。 |
| DSUB-REQ-008 | 新增和正常编辑时，`DATA_FROM_SOURCE_ID` 只能保存一个源库 ID，不包含英文逗号。 |
| DSUB-REQ-009 | 同一个源库允许出现在多条订阅记录中，不做跨行唯一限制。 |
| DSUB-REQ-010 | 如果现有启用记录的 `DATA_FROM_SOURCE_ID` 包含多个源库，该记录属于异常记录。 |
| DSUB-REQ-011 | 多源库异常记录仍显示在列表中，但整行警示，提示：“配置异常：该记录包含多个源库，请直接维护数据库”。 |
| DSUB-REQ-012 | 多源库异常记录不提供查看、编辑、删除等任何操作，不提供自动拆分。 |

### 8.2 目标库与源表

| 编号 | 需求 |
|---|---|
| DSUB-REQ-013 | `DATA_TO_SOURCE_ID` 可以保存一个或多个目标库 ID；多个目标库 ID 使用英文逗号 `,` 分隔。 |
| DSUB-REQ-014 | 一条记录中的全部源表同步到该记录中的全部目标库。 |
| DSUB-REQ-015 | `DATA_SOURCE_TABLE` 可以保存多张源表；多张表之间使用英文逗号 `,` 分隔，不能使用换行符。 |
| DSUB-REQ-016 | 单张表格式为 `DATA_SOURCE_ID.Schema.表名`；Schema 和表名区分大小写，必须保持从源 Oracle 中读取到的原始大小写。 |
| DSUB-REQ-017 | 数据源 ID、Schema 名和表名不得包含英文逗号；发现这种对象时页面不得允许选择，并明确说明协议限制。 |
| DSUB-REQ-018 | 同一行内不得重复保存同一个完整表标识。 |

### 8.3 重复订阅、启用与删除

| 编号 | 需求 |
|---|---|
| DSUB-REQ-019 | 允许不同记录之间出现相同的“源库 + Schema + 表 + 目标库”同步关系；管理平台不得因跨行重复而拒绝保存；`sync-client` 会自行去重。 |
| DSUB-REQ-020 | 列表只查询和展示 `FG_ACTIVE=1` 的订阅记录；`FG_ACTIVE=0` 的记录完全不显示；新增固定写入 `FG_ACTIVE=1`，页面不提供启用状态选择。 |
| DSUB-REQ-021 | 不提供停用、恢复或回收站；删除采用按主键物理删除，不得把 `FG_ACTIVE` 更新为 `0`。 |

### 8.4 描述与遗留字段

| 编号 | 需求 |
|---|---|
| DSUB-REQ-022 | `DATA_SUB_DESC` 由用户填写，必填；按数据库字段长度进行前后端一致校验。 |
| DSUB-REQ-023 | `DATA_SOURCE_COMMENT`：新增写 `NULL`，页面不展示、不解析、不维护；编辑历史记录时保持原值，不主动清空。 |
| DSUB-REQ-024 | `DATA_TARGET_TABLE`：新增写 `NULL`；编辑历史记录时保持原值。 |
| DSUB-REQ-025 | `DATA_TARGET_COMMENT`：新增写 `NULL`；编辑历史记录时保持原值。 |

### 8.5 时间字段

| 编号 | 需求 |
|---|---|
| DSUB-REQ-026 | 新增时设置 `INSERT_TIME` 为数据库当前时间；新增时 `UPDATE_TIME` 为空，除非现有表约束或统一项目规则要求其他行为；如有冲突必须在报告中提出，不能静默改变需求。 |
| DSUB-REQ-027 | 编辑时保持 `INSERT_TIME` 不变，将 `UPDATE_TIME` 更新为数据库当前时间。 |
| DSUB-REQ-028 | 列表有效排序时间为 `NVL(UPDATE_TIME, INSERT_TIME)`，默认倒序。 |

## 9. 列表页面

### 9.1 首次进入与数据范围

| 编号 | 需求 |
|---|---|
| DSUB-REQ-029 | 点击左侧菜单“数据订阅”进入页面；首次进入自动查询并展示全部 `FG_ACTIVE=1` 记录。 |
| DSUB-REQ-030 | 列表不分页，一次显示全部启用记录。 |
| DSUB-REQ-031 | 默认按 `NVL(UPDATE_TIME, INSERT_TIME) DESC` 排序。 |

### 9.2 查询条件

| 编号 | 需求 |
|---|---|
| DSUB-REQ-032 | 列表上方只有两个查询条件：源库（多选下拉）、目标库（多选下拉）。 |
| DSUB-REQ-033 | 查询候选项来自 `CDC_DATA_SOURCE`：`FG_ACTIVE=1`；源库和目标库分别按实际类别字段匹配，类别值的大小写和真实代码规则需只读核验；查询候选不包含停用或不存在的数据源。 |
| DSUB-REQ-034 | 查询逻辑：多个源库之间为 `OR`；多个目标库之间为 `OR`；源库条件组与目标库条件组之间为 `AND`；点击“查询”后才执行过滤；“重置”只清空表单条件，不自动重新查询；无结果时显示“暂无符合条件的订阅记录”。 |

### 9.3 列表列与展示

| 编号 | 需求 |
|---|---|
| DSUB-REQ-035 | 列顺序为：订阅描述、源库、源表、目标库、更新时间、操作。 |
| DSUB-REQ-036 | `DATA_SUB_ID` 不在第一层列表单独占列。 |
| DSUB-REQ-037 | 源库和目标库主要显示 `DATA_SOURCE_ORG`，悬停显示 `DATA_SOURCE_ID`。 |
| DSUB-REQ-038 | 源表列只显示“共 N 张”；悬停逐行显示全部 `Schema.表名`，悬停层限高并内部滚动。 |
| DSUB-REQ-039 | 目标库以独立标签显示；空间不足时显示前几个标签和 `+N`，悬停查看全部。 |
| DSUB-REQ-040 | 只显示更新时间；`UPDATE_TIME` 为空时回退显示 `INSERT_TIME` 并明确标记为创建时间。 |
| DSUB-REQ-041 | 正常单源库记录操作为：查看、编辑、删除。 |

### 9.4 异常数据源展示

| 编号 | 需求 |
|---|---|
| DSUB-REQ-042 | 订阅引用的数据源即使已停用或不存在，记录仍然显示：已停用显示 `DATA_SOURCE_ORG` 并标记“已停用”；不存在显示原始 `DATA_SOURCE_ID` 并标记“不存在”。 |
| DSUB-REQ-043 | 多源库异常记录整行使用警示色并显示明确异常提示。 |

## 10. 查看详情

| 编号 | 需求 |
|---|---|
| DSUB-REQ-044 | 详情使用居中只读弹窗。 |
| DSUB-REQ-045 | 查看详情不连接源 Oracle，只读取已保存配置和数据源映射。 |
| DSUB-REQ-046 | 多源库异常记录不提供查看入口。 |
| DSUB-REQ-047 | 详情显示：订阅描述；订阅 ID；源库机构名称和数据源 ID；源表总数；按 Schema 分组的表清单；各目标库机构名称和数据源 ID；创建时间；更新时间。 |
| DSUB-REQ-048 | 详情显示数据源已停用、不存在、字段格式异常等警告。 |
| DSUB-REQ-049 | 源表清单区域限高并内部滚动。 |
| DSUB-REQ-050 | 如果 `DATA_SOURCE_TABLE` 有无法解析的内容，展示可解析项，并单独展示原始异常内容和警告，不得静默丢弃。 |
| DSUB-REQ-051 | 不展示 `DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT`。 |

## 11. 新增与编辑弹窗

### 11.1 总体形态

| 编号 | 需求 |
|---|---|
| DSUB-REQ-052 | 新增和编辑复用同一个近全屏大尺寸居中弹窗与选表组件。 |
| DSUB-REQ-053 | 建议尺寸约为 `94vw × 92vh`，最大宽度由 UI 设计结合现有项目约束确定。 |
| DSUB-REQ-054 | 标题栏和底部按钮固定，中间内容区使用剩余高度。 |
| DSUB-REQ-055 | 弹窗必须可以移动：每次打开默认居中；仅标题栏可拖动；表单和表格区域不能触发拖动；不得拖出浏览器可视区域；关闭后不记忆位置；首期不支持手动缩放。 |
| DSUB-REQ-056 | 表单有未保存修改时关闭或取消，必须二次确认。 |

### 11.2 必填项

| 编号 | 需求 |
|---|---|
| DSUB-REQ-057 | 保存前必须满足：订阅描述非空；恰好一个源库；至少一张源表；至少一个目标库。 |

### 11.3 源库选择与搜索

| 编号 | 需求 |
|---|---|
| DSUB-REQ-058 | 源库使用可搜索单选下拉框，不得把约 50～100 个候选平铺成卡片。 |
| DSUB-REQ-059 | 候选仅限 `FG_ACTIVE=1` 且类别匹配的源库；候选显示以 `DATA_SOURCE_ORG` 为主要文字，`DATA_SOURCE_ID` 为辅助文字。 |
| DSUB-REQ-060 | 搜索同时匹配 `DATA_SOURCE_ID` 与 `DATA_SOURCE_ORG`，并按以下优先级排序：① `DATA_SOURCE_ID` 完全匹配；② `DATA_SOURCE_ID` 前缀匹配；③ `DATA_SOURCE_ID` 模糊包含；④ `DATA_SOURCE_ORG` 模糊包含。 |
| DSUB-REQ-061 | ID 搜索不区分大小写；机构名称模糊匹配；输入自动去除首尾空格；高亮命中文字；输入为空时显示全部启用源库；无结果时显示“未找到匹配的源库”。 |
| DSUB-REQ-062 | 选择结果使用明显的蓝色选中状态、勾选标记和“已选择”提示。 |
| DSUB-REQ-063 | 已选择源表后更换源库，必须二次确认；确认后清空 Schema 缓存和全部已选表。 |

### 11.4 目标库选择

| 编号 | 需求 |
|---|---|
| DSUB-REQ-064 | 目标库候选仅限 `FG_ACTIVE=1` 且类别匹配的目标库；目标库多选，至少选择一个。 |
| DSUB-REQ-065 | 目标库通常不超过 5 个，全部以紧凑复选卡片平铺展示，不需要“查看更多”或独立搜索。 |
| DSUB-REQ-066 | 选中卡片使用蓝色边框、浅蓝背景和勾选图标；同时显示机构名称和 ID。 |

### 11.5 Schema 与表的读取范围

| 编号 | 需求 |
|---|---|
| DSUB-REQ-067 | Schema 和表清单由 `cdc-config` 后端直接连接所选源库读取；连接信息来自 `CDC_DATA_SOURCE`，密码处理必须复用现有安全机制，不得在日志或响应中泄露。 |
| DSUB-REQ-068 | 目标库只选择，不在此流程中连接。 |
| DSUB-REQ-069 | Schema 范围：当前账号可访问、包含普通表的非系统 Schema；不展示空 Schema、系统 Schema、视图、物化视图或同义词。 |
| DSUB-REQ-070 | 选择源库后自动加载 Schema；点击 Schema 时首次加载该 Schema 的普通表，并在本次弹窗会话内缓存；不得每次切换都重复查询；加载失败时显示明确错误并提供“重试加载”。 |

### 11.6 表选择交互

| 编号 | 需求 |
|---|---|
| DSUB-REQ-071 | 左侧为 Schema 列表，右侧为当前 Schema 的普通表表格；不保留独立的“已选源表”右侧面板；用户只在中间表格中选表和取消选表。 |
| DSUB-REQ-072 | 当前 Schema 表名支持不区分大小写的模糊搜索。 |
| DSUB-REQ-073 | 支持：全选当前 Schema 当前搜索结果；取消当前搜索结果的选择；“只看已选”开关；清空当前 Schema（二次确认）。 |
| DSUB-REQ-074 | 切换 Schema 或改变搜索条件时，全部已选表必须保留。 |
| DSUB-REQ-075 | 已选表通过复选框勾选和整行浅蓝背景突出，不再设置重复的“选择状态”列。 |
| DSUB-REQ-076 | 表格表头固定，内容区内部滚动；建议使用虚拟滚动以兼容更大规模。 |

### 11.7 选择数量与典型规模

| 编号 | 需求 |
|---|---|
| DSUB-REQ-077 | 典型场景：一个源库；选择 1～2 个 Schema；每个 Schema 约选择 120 张表；总选择量约 120～240 张表。 |
| DSUB-REQ-078 | 界面必须显示“已选择：X 个源库 · X 个 Schema · X 个表 · X 个目标库”；其中 Schema 数只统计至少选中一张表的 Schema。 |
| DSUB-REQ-079 | 左侧每个 Schema 显示“已选 N 张”；中间当前 Schema 显示“共 N 张，已选 N 张”。 |
| DSUB-REQ-080 | 不得因为 240 张已选表而产生大量标签、弹窗无限增高或明显卡顿。 |

## 12. 新增保存规则

| 编号 | 需求 |
|---|---|
| DSUB-REQ-081 | 保存前后端都进行基础必填和格式校验，最终以后端为准。 |
| DSUB-REQ-082 | 保存时后端重新校验：源库、目标库仍存在、启用且类别正确。 |
| DSUB-REQ-083 | 保存时后端重新校验：所选 Schema 和表仍存在且账号可访问；表标识格式正确并属于所选源库；名称不包含英文逗号；单条记录内部不存在重复表标识或重复目标库 ID。 |
| DSUB-REQ-084 | 约 240 张表的有效性校验必须使用一次源库连接并按 Schema 批量查询，禁止逐表建立连接或产生约 240 次查询。 |
| DSUB-REQ-085 | 发现失效项时拒绝保存，并一次性列出具体失效的数据源或表，用户修正后重试。 |
| DSUB-REQ-086 | 防止重复提交；保存期间按钮进入加载状态。 |
| DSUB-REQ-087 | 保存成功后关闭弹窗、刷新列表、提示成功和重启生效说明。 |

## 13. 编辑规则

### 13.1 回显

| 编号 | 需求 |
|---|---|
| DSUB-REQ-088 | 编辑与新增使用同一界面；自动回显描述、源库、目标库、全部 Schema 和源表选择。 |
| DSUB-REQ-089 | 自动加载原记录涉及的全部已选 Schema，并恢复表格勾选和浅蓝背景；左侧 Schema 数量、当前 Schema 数量和总汇总必须准确。 |

### 13.2 源库与源表修改

| 编号 | 需求 |
|---|---|
| DSUB-REQ-090 | 更换源库必须二次确认，确认后清空原 Schema 和全部源表选择。 |
| DSUB-REQ-091 | 原选择中的表已删除或不可访问时，不得静默取消；必须显示“异常已选表”警告。 |
| DSUB-REQ-092 | 修改源库或源表后，必须成功连接源 Oracle 并完成保存前有效性校验。 |

### 13.3 源库无法连接时的有限编辑

| 编号 | 需求 |
|---|---|
| DSUB-REQ-093 | 如果源 Oracle 暂时无法连接：只要源库和 `DATA_SOURCE_TABLE` 完全未变，允许修改订阅描述和目标库；不允许新增、删除或更换源表；不允许更换源库后绕过源表重新选择；页面必须明确说明当前使用的是已保存源表配置，未完成源库实时校验。 |

### 13.4 异常数据源与字段保持

| 编号 | 需求 |
|---|---|
| DSUB-REQ-094 | 原订阅引用的源库或目标库已停用或不存在时，仍需回显原值并标记异常；编辑保存前必须替换或修复异常数据源；不得原样保存或强制保存。 |
| DSUB-REQ-095 | 多源库异常记录不提供编辑入口。 |
| DSUB-REQ-096 | `DATA_SUB_ID`、`INSERT_TIME` 保持不变；`UPDATE_TIME` 更新为数据库当前时间；遗留字段保持原值，不得主动清空。 |

## 14. 并发保护

| 编号 | 需求 |
|---|---|
| DSUB-REQ-097 | 编辑打开时获取后端生成的版本令牌或等效原始快照标识。 |
| DSUB-REQ-098 | 保存前后端重新读取当前记录并比较业务字段；记录已被他人或人工数据库操作修改时，拒绝覆盖并提示刷新后重新编辑。 |
| DSUB-REQ-099 | 不得仅依赖 `UPDATE_TIME`，因为人工直接维护数据库时不一定同步更新时间；具体版本令牌实现属于后续设计，但验收必须覆盖并发修改拒绝覆盖。 |

## 15. 删除规则

| 编号 | 需求 |
|---|---|
| DSUB-REQ-100 | 只允许正常单源库记录删除；多源库异常记录无删除入口。 |
| DSUB-REQ-101 | 删除为按 `DATA_SUB_ID` 主键执行物理删除。 |
| DSUB-REQ-102 | 删除前二次确认，展示：订阅描述；源库；Schema 数；源表数量；目标库；“数据库记录物理删除且无法恢复”的明确提示；“当前运行中的同步任务不会立即停止，需要重启相关 sync-client 后生效”的说明。 |
| DSUB-REQ-103 | 删除请求携带版本令牌或等效并发标识；确认后发现记录已被修改，拒绝删除并刷新列表，避免误删新配置。 |
| DSUB-REQ-104 | 记录已不存在时提示“记录不存在或已被删除”。 |
| DSUB-REQ-105 | 删除成功后刷新列表，并提示重启后生效。 |

## 16. 通用交互、性能规模与安全

| 编号 | 需求 |
|---|---|
| DSUB-REQ-106 | 通用交互：查询、保存、删除、加载 Schema/表等请求处理中对应按钮禁用，防止重复提交；请求失败时展示清晰、可展示、脱敏的业务提示，不暴露原始堆栈、数据库口令或完整连接串。 |

## 17. 已知关联影响与明确延期项

| 编号 | 需求 |
|---|---|
| DSUB-REQ-107 | `DATA_SOURCE_TABLE` 已确认使用英文逗号分隔，而当前大屏可能存在按换行符拆分的实现（只读识别的影响位置：大屏订阅表数量统计、数据流向中的订阅表数量、其他解析 `DATA_SOURCE_TABLE` 的大屏代码）。本任务及本次“数据订阅”Feature 实现阶段均不得修改大屏代码或大屏基线；状态必须记录为 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`；执行时机：数据订阅 Feature 完成并正式验收后，作为独立任务处理；此延期项不得成为数据订阅 Feature 的验收阻断项。 |

## 18. 开放问题与待核验项

以下为当前未闭环或后续阶段待核验事项，不代表已确认需求存在尚未确认的产品决策：

| 编号 | 事项 | 类型 |
|---|---|---|
| TBD-01 | `DATA_SUB_ID` 新增时的具体生成格式（依据现有代码、字段长度和项目 ID 规范） | 后续设计阶段确定，本需求阶段不虚构 |
| TBD-02 | 源库/目标库类别匹配的真实代码规则与大小写（当前代码事实：后端查询目标库使用 `UPPER(DATA_SOURCE_CATEGORY) = 'TARGET'`，见 `DataSourceServiceImpl`；源库匹配规则与完整列表查询需设计阶段只读核验确认） | 技术待核验 |

### 18.1 已关闭事项

| 编号 | 事项 | 关闭方式 |
|---|---|---|
| TBD-03 | 数据订阅 Feature 文档标识统一 | `CLOSED_R1`：R1 已通过 `docs/features/README.md` 定向修正将 Feature 标识统一为 `data-subscription`，索引与文档链接指向 `docs/features/data-subscription/`；前端实现目录 `views/data-subscribe/`、路由 `/config/subscribe`、路由 name、菜单 path 与代码包名均保持不变（文档目录标识与前端实现目录允许不同，已在 `docs/features/README.md` 注明）。本编号不再用于其他事项。 |
| TBD-04 | 项目级主键事实同步 | `CLOSED_R1`：前序任务已只读核验 `DATA_SUB_ID` 为数据库真实主键（`PK_CDC_DATA_SUBSCRIBE`），R1 已将该当前物理事实同步到 `docs/baseline/ARCHITECTURE.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md`，清理残留的“无主键/D01 PENDING_DECISION”过期描述，并关闭原 D01。本 R1 未访问数据库、未执行 DDL、未改变数据库结构；`cdc-config` 当前仍未实现订阅 CRUD 写入，管理平台当前仍为只读/占位，订阅记录仍由人工维护（这些当前实现事实保持不变）。本编号不再用于其他事项。 |

## 19. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-30 | 建立“数据订阅”Feature 需求基线草案（`DRAFT_PENDING_USER_REVIEW`；实现状态 `NOT_STARTED`；全部验收用例 `NOT_RUN`；`DATA_SUB_ID` 主键只读核验 `DATABASE_VERIFIED`） | DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001（纯文档任务；基于已确认产品决策 + 已批准数据库基线 + 真实代码与数据库只读核验；待用户复审与批准） |
| 2026-08-30 | R1 定向修订（ChatGPT 正式复审 `CHANGES_REQUIRED`）：§6 场景 2 修正重置语义——“重置恢复全部启用记录”改为“重置只清空查询表单，不自动重新查询，列表保持上一次已生效的查询结果”；`DSUB-REQ-035` 列顺序由“建议列顺序”改为确定规则“列顺序为”；统一 Feature 文档标识为 `data-subscription` 并关闭 TBD-03；将前序任务已验证的 `DATA_SUB_ID` 主键当前物理事实同步到项目级基线并关闭 TBD-04；文档状态保持 `DRAFT_PENDING_USER_REVIEW`，实现状态保持 `NOT_STARTED`，未批准、未实现、未执行验收 | DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001-R1（纯文档定向修订；不改变任何已确认业务规则、需求/验收编号与状态） |

> 关联文档：验收基线 `docs/features/data-subscription/ACCEPTANCE.md`；任务报告 `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001.md`。
