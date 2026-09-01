# 数据订阅 Feature 需求基线（REQUIREMENTS）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据订阅 |
| Feature 标识 | `data-subscription` |
| 正式菜单 | 数据订阅（配置管理组，路由 `/config/subscribe`，菜单项与路由均保持既有值不变） |
| 既有路由 | `/config/subscribe` |
| 目标文档 | `docs/features/data-subscription/REQUIREMENTS.md` |
| 文档状态 | `APPROVED`（正式验收前 UI 交互基线对齐草案及 R1 状态文字修订已经获得 ChatGPT 对结果提交 `26094c6b6d8f9b8d5971ef38648851611799adee` 的正式复审 `APPROVED`，批准收口完成；当前版本把已确认、已实现、已复审通过的最终交互事实（`DSUB-REQ-053/054/057/065/066/073`：最终弹窗尺寸与视口约束、空间优先级与顶部布局、描述单行输入、紧凑目标库卡片、白色主体四态、Shift 连选）作为正式批准需求基线；上一正式批准需求版本为“取消并发保护”需求调整版本，批准依据提交 `43a909773aec63fe8c4de2957074f113910f4686`，该批准历史保留；再前“含逗号数据源 ID 查询兼容”批准版本批准依据提交 `5d5b5f4606da14f160e9db43068f114d35501db8`、更早“英文句点 `.` 保留分隔符”批准版本批准依据提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a`，均作为历史事实保留，见 §19 变更记录；需求数量仍为 107；需求批准不代表设计批准、功能实现或验收通过） |
| 实现状态 | `IMPLEMENTED_REVIEW_APPROVED_PENDING_FORMAL_ACCEPTANCE`（后端实现及真实数据库集成验证、前端 R3 代码与视觉、R3-R1 报告元数据收口均已获 ChatGPT 正式批准；126 条正式验收尚未执行；本任务为纯文档 UI 基线对齐草案，不涉及任何业务代码实现） |
| 任务编号 | `DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001` |
| 任务类型 | Feature 需求与验收基线草案落盘、数据库物理事实定向核验、提交与推送（纯文档任务） |
| 授权基线提交 | `a98811c5c7aab1df7685231982c06ed339253008`（执行时实际 `origin/develop` 最新提交） |
| 创建日期 | 2026-08-30 |
| 需求来源 | 已确认的产品决策（本任务提示词 §6～§15 记录的产品需求）+ 已批准数据库基线（`docs/database/`）+ 真实代码只读核验 + 真实数据库只读核验 |
| 主键核验状态 | `DATABASE_VERIFIED`（`CDC_DATA_SUBSCRIBE.DATA_SUB_ID` 真实主键经只读核验确认，见 §4） |

说明：本文件把已经确认的产品决策落成 Feature 需求基线。上一正式批准版本（提交 `d7560445be1504e6ed9957fa7b31be1fd393ea19`）已获得项目负责人正式批准；其后“英文句点 `.` 为 `DATA_SOURCE_ID.Schema.表名` 三段结构保留分隔符”的定向调整版本已获得 ChatGPT 正式复审 `APPROVED`（批准依据提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a`），该批准历史保留不变；再后“含英文逗号数据源 ID 的查询兼容语义”定向调整已获得 ChatGPT 正式复审 `APPROVED`（批准依据提交 `5d5b5f4606da14f160e9db43068f114d35501db8`）。由于 `DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID` 为无引号、无转义符、无长度前缀的英文逗号分隔协议，原始 CSV 无法精确区分“单个含逗号 ID”与“多个相邻普通 ID”，含逗号候选采用“历史兼容可能匹配”语义，并保留普通 ID 与仅含句点 ID 的去除首尾空白后完整 token 精确匹配。项目负责人随后明确“数据订阅页面的新增、编辑、删除完全不处理并发操作，不考虑其他页面用户或人工直接修改数据库造成的并发冲突”，本文件据此定向调整 `DSUB-REQ-097/098/099/103` 与 §14，形成“取消并发保护”需求调整草案：不再要求版本令牌、内容指纹、行锁、并发字段比较或 `40910` 拒绝覆盖，编辑保存与删除改为普通主键更新/物理删除、最后一次成功写入生效；该“取消并发保护”需求调整草案已获得 ChatGPT 对结果提交 `43a909773aec63fe8c4de2957074f113910f4686` 的正式复审 `APPROVED`（前序 R1 定向修订解决了 `DSUB-AC-048` 并发保护残留与报告查询语义错误），取消并发保护规则正式成为当前需求基线。需求批准不代表设计批准、功能实现或验收通过。本调整只取消并发保护，不改变必填校验、数据源与源表有效性校验、多源库异常限制、物理删除、二次确认、受影响行数检查及重启 `sync-client` 后生效等其他规则。本次调整不表示功能实现、部署或验收通过。随后正式验收前 UI 基线对齐草案（`DATA-SUBSCRIPTION-PRE-ACCEPTANCE-UI-BASELINE-ALIGNMENT-001`）在既有后端与前端实现均已获 ChatGPT 正式批准的前提下，把实现状态更新为 `IMPLEMENTED_REVIEW_APPROVED_PENDING_FORMAL_ACCEPTANCE`，126 条验收用例仍全部为 `NOT_RUN`；本草案把已确认、已实现、已复审通过的最终交互事实同步为待正式复审的文档基线。该 UI 交互基线对齐草案及 R1 状态文字修订（`DATA-SUBSCRIPTION-PRE-ACCEPTANCE-UI-BASELINE-ALIGNMENT-001-R1`）已获得 ChatGPT 对结果提交 `26094c6b6d8f9b8d5971ef38648851611799adee` 的正式复审 `APPROVED`，本文件文档状态已收口为 `APPROVED`；需求批准不代表正式验收通过，126 条正式验收仍未执行。

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
- 订阅记录删除（按主键物理删除、二次确认，不做并发保护）。
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
| DSUB-REQ-016 | 单张表格式为 `DATA_SOURCE_ID.Schema.表名`；其中两个英文句点 `.` 是三段结构的保留分隔符；存储协议没有引号、转义符或长度前缀机制；Schema 和表名区分大小写，必须保持从源 Oracle 中读取到的原始大小写。 |
| DSUB-REQ-017 | 数据源 ID、Schema 名和表名不得包含英文逗号 `,`，也不得包含英文句点 `.`。英文逗号用于多值项分隔，英文句点用于 `DATA_SOURCE_ID.Schema.表名` 三段结构分隔；第一版不设计转义或编码协议。数据源 ID、Schema 名或表名含英文逗号或句点时，不得用于新增或编辑订阅：页面不得允许选择，后端保存也必须拒绝；页面必须向用户说明具体名称和保留字符原因，不得只提示“格式错误”。 |
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
| DSUB-REQ-033 | 查询候选项来自 `CDC_DATA_SOURCE`：`FG_ACTIVE=1`；源库和目标库分别按实际类别字段匹配，类别值的大小写和真实代码规则需只读核验；查询候选不包含停用或不存在的数据源。查询候选不得因为 ID 含英文逗号或英文句点而被静默隐藏（本调整只涉及列表查询候选，新增/编辑维护候选的禁用规则不变）。查询候选按下述三类区分语义：① ID 不含英文逗号：普通查询候选；② ID 含英文句点但不含英文逗号：仍为普通查询候选，英文句点不是 `DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID` 这两个 CSV 字段的分隔符，可按完整 token 精确匹配；③ ID 含英文逗号：仍返回并允许选择，但候选项必须显示警告标记（如“含逗号，历史兼容查询可能存在歧义”），不得冒充普通精确候选。 |
| DSUB-REQ-034 | 查询逻辑：多个源库之间为 `OR`；多个目标库之间为 `OR`；源库条件组与目标库条件组之间为 `AND`；点击“查询”后才执行过滤；“重置”只清空表单条件，不自动重新查询；无结果时显示“暂无符合条件的订阅记录”。查询匹配语义按下述规则：**A. 不含英文逗号的查询 ID**：按 CSV 拆分后的完整 token 匹配；存量字段 token 比较前去除首尾空白；不得使用简单 `%ID%` 子串匹配；`%`、`_`、反斜杠或正则元字符不得改变字面匹配语义；`S01` 不得误匹配 `S012`；含句点但不含逗号的 ID 适用本精确规则。**B. 含英文逗号的查询 ID**：定义为“历史兼容可能匹配”，不得称为精确 token 匹配——由于物理字段使用英文逗号分隔且无转义协议，系统无法判断原始逗号属于 ID 内容还是 token 分隔符；查询只能在原始 CSV 字段中查找与该候选字面值相同的连续、分隔边界完整的片段；返回结果是“可能匹配记录集合”，可能同时包含由多个相邻普通 ID 形成相同文本的歧义记录；页面在选中该条件及展示查询结果时必须提供明确警告，不得让用户误认为结果精确；不得为了消除假阳性而静默不返回可能相关的历史记录；本需求调整不设计引号、转义符、长度前缀、新关联表或数据迁移。**C. 多条件组合**：多个源库条件之间仍为 `OR`；多个目标库条件之间仍为 `OR`；源库条件组与目标库条件组之间仍为 `AND`；普通精确条件与含逗号的可能匹配条件可存在于同一组，组内仍按 `OR`；如果一次查询包含任意含逗号候选，页面必须显示查询歧义警告。 |

> 查询候选边界：列表查询区的源库/目标库候选仍按 `FG_ACTIVE=1` 且类别匹配返回；即使某个存量数据源 ID 含英文逗号或英文句点（协议保留字符），也应允许用于查询历史订阅（查询条件多选下拉），不得因保留字符导致无法定位历史记录。ID 仅含英文句点（不含英文逗号）的候选仍是普通候选，可精确匹配；ID 含英文逗号的候选仍可选择，但标记为“含逗号，历史兼容查询可能存在歧义”，查询时按“历史兼容可能匹配”语义返回可能匹配记录集合（见 `DSUB-REQ-034`），不得要求后端把无转义 CSV 中的含逗号 ID 精确识别为单个 token。

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

> 历史记录兼容：历史启用记录仍按原始内容展示，不因保留字符直接从列表隐藏；详情能够展示的内容继续展示，无法可靠解析的内容放入原始异常内容区并警告，不得静默丢弃；正常单源库记录仍允许查看和删除；编辑打开时回显异常项，保存前必须替换或修复含保留字符的无效配置。不得把所有含点号的完整表标识误判为异常——结构分隔用的两个句点是正常格式，只有组件内部额外句点才属于协议不兼容。多源库异常记录仍遵守既有“整行警示、无任何操作”规则，优先级不变。

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
| DSUB-REQ-053 | 最终弹窗尺寸（已批准实现事实）：桌面默认宽度 `1280px`，宽度上限为 `calc(100vw - 64px)`，小屏宽度退化为 `calc(100vw - 32px)`；高度为 `82vh`，受 `calc(100vh - 48px)` 约束；弹窗不得超出浏览器可视区域；标题栏与底部操作区固定，中间区域使用剩余空间并滚动。 |
| DSUB-REQ-054 | 标题栏和底部按钮固定，中间内容区使用剩余高度。空间优先级与顶部布局：订阅描述使用单行输入框，必填且最大 255 字符；桌面下源库和目标库处于同一行，源库区域约 34%、目标库区域占剩余空间，小屏空间不足时允许整组换行；源库标签、源库下拉框、目标库标签和目标库卡片按同一水平中轴垂直居中；源表选择区获得弹窗中间区域的主要空间，Schema 区约 `240~260px`、普通表区使用剩余宽度；不恢复最右侧“已选源表”面板。 |
| DSUB-REQ-055 | 弹窗必须可以移动：每次打开默认居中；仅标题栏可拖动；表单和表格区域不能触发拖动；不得拖出浏览器可视区域；关闭后不记忆位置；首期不支持手动缩放。 |
| DSUB-REQ-056 | 表单有未保存修改时关闭或取消，必须二次确认。 |

### 11.2 必填项

| 编号 | 需求 |
|---|---|
| DSUB-REQ-057 | 保存前必须满足：订阅描述非空；恰好一个源库；至少一张源表；至少一个目标库。订阅描述由用户维护（`DATA_SUB_DESC`），使用单行输入框、必填、最大 255 字符、不使用 textarea；其他源库/源表/目标库必填规则不变。 |

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
| DSUB-REQ-065 | 目标库通常不超过 5 个，全部以紧凑复选卡片平铺展示，不需要“查看更多”或独立搜索。卡片约 `200×48px`，允许在不破坏布局的合理范围微调；第一行显示机构名称，第二行显示数据源 ID；两行紧凑排列，长 ID 单行省略并可悬停查看完整值；左侧复选框是唯一勾选控件；常见 3 个目标库在 1K、2K 下保持同一行；最多 5 个，空间确实不足时才换行；不增加重复右侧对勾、搜索、“查看更多”或折叠。 |
| DSUB-REQ-066 | 目标库卡片最终视觉状态：未选中为白色主体、浅灰边框、极轻阴影；悬停为白色主体、浅主题蓝边框与轻阴影；选中为白色主体、主题蓝边框、左侧蓝色复选框、克制的淡蓝灰阴影；选中态不得使用大面积浅蓝或蓝色渐变背景；禁用为浅灰背景、灰色文字、不可选择并展示原因；不使用绿色、红色、黄色等健康/告警语义色；同时显示机构名称和数据源 ID。 |

> 维护候选边界：新增/编辑弹窗中的源库、目标库候选若 ID 含英文逗号或句点，应显示为禁用项并明确标注“名称含协议保留字符，不能用于订阅配置”，不得静默隐藏。目标库 ID 虽不参与 `DATA_SOURCE_ID.Schema.表名` 拼接，但项目负责人已选择统一的数据源 ID 保留字符规则，新增/编辑中同样禁止句点。

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
| DSUB-REQ-073 | 支持：全选当前 Schema 当前搜索结果；取消当前搜索结果的选择；“只看已选”开关；清空当前 Schema（二次确认）。追加 Shift 连续范围选择的权威规则：① 普通点击一张可选表：切换状态，并记录该表为起点及点击后的目标状态；② 按住 Shift 点击另一张当前可见可选表：按当前页面可见顺序，将起点与终点之间（含首尾）的可选表统一设为起点记录的目标状态；③ 起点普通点击后为选中，则范围全部选中；起点普通点击后为取消，则范围全部取消；④ 连续 Shift 点击不同终点时起点不移动；下一次普通点击才更新起点；⑤ 仅作用于当前 Schema 当前可见结果；搜索后只作用于当前搜索结果；“只看已选”后按当前可见结果计算；⑥ 保留字符禁选表和 disabled 表跳过；⑦ 无有效起点或起点已不可见时，Shift 点击退化为普通单表点击并建立新起点；⑧ 切换 Schema、切换源库、改变搜索、切换只看已选、表清单重载/重试、执行全选/取消筛选/清空 Schema 后清除起点；⑨ 一次范围操作只生成一次选中集合并只触发一次状态提交，不逐表发请求；⑩ 提示文字为低干扰说明，不得挤占源表主体空间。 |
| DSUB-REQ-074 | 切换 Schema 或改变搜索条件时，全部已选表必须保留。 |
| DSUB-REQ-075 | 已选表通过复选框勾选和整行浅蓝背景突出，不再设置重复的“选择状态”列。 |
| DSUB-REQ-076 | 表格表头固定，内容区内部滚动；建议使用虚拟滚动以兼容更大规模。 |

> Schema/表选择边界：Schema 或表名含英文逗号或组件内部英文句点的对象显示为不可选择，并明确说明原因（协议保留字符），不得静默隐藏。

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

## 14. 无并发保护边界

| 编号 | 需求 |
|---|---|
| DSUB-REQ-097 | 编辑打开接口不生成、不返回版本令牌、内容指纹或等效快照标识；页面编辑保存请求也不携带此类字段。 |
| DSUB-REQ-098 | 编辑保存不加行锁，不比较打开时与保存时的记录内容；完成现有业务校验后按 `DATA_SUB_ID` 普通更新；多个页面用户或人工数据库操作交叉发生时不提供并发冲突检测，最后一次成功写入的内容生效。 |
| DSUB-REQ-099 | 不使用 `UPDATE_TIME` 或其他字段进行并发判断；不提供“记录已被他人或人工数据库操作修改”的识别、拒绝覆盖或刷新重试机制；页面打开期间的数据与最终写入之间不提供快照一致性保证。 |

> 无并发保护边界说明：项目负责人已明确选择“数据订阅页面的新增、编辑、删除完全不处理并发操作，不考虑其他页面用户或人工直接修改数据库造成的并发冲突”。该简化为主动选择的产品边界，**不属于待解决缺口**，不得重新解释成乐观锁、悲观锁、更新时间校验、ETag、幂等键、数据库触发器或其他替代并发方案。本简化只取消并发保护，不改变必填校验、数据源与源表有效性校验、多源库异常限制、物理删除、二次确认、受影响行数检查及重启 `sync-client` 后生效等其他规则。

## 15. 删除规则

| 编号 | 需求 |
|---|---|
| DSUB-REQ-100 | 只允许正常单源库记录删除；多源库异常记录无删除入口。 |
| DSUB-REQ-101 | 删除为按 `DATA_SUB_ID` 主键执行物理删除。 |
| DSUB-REQ-102 | 删除前二次确认，展示：订阅描述；源库；Schema 数；源表数量；目标库；“数据库记录物理删除且无法恢复”的明确提示；“当前运行中的同步任务不会立即停止，需要重启相关 sync-client 后生效”的说明。 |
| DSUB-REQ-103 | 删除确认信息可通过普通只读读取获得，但不锁行、不返回或回传版本令牌；用户确认后直接按 `DATA_SUB_ID` 主键物理删除，不检查预览后记录是否发生变化；记录不存在仍按 `DSUB-REQ-104` 处理。 |
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
| 2026-08-30 | 需求基线正式批准收口：文档状态由 `DRAFT_PENDING_USER_REVIEW` 转为 `APPROVED`；批准依据为提交 `b9fb1e955492bef905b3c33acbf9d617bb5a0857` 的 ChatGPT 正式复审结论 `APPROVED`；107 条需求（`DSUB-REQ-001` ~ `DSUB-REQ-107`）编号、数量与业务语义不变；实现状态仍为 `NOT_STARTED`；126 条验收用例仍未执行（`NOT_RUN`）；下一阶段为设计基线建立，不表示功能已实现或验收已通过 | DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-APPROVAL-001（项目负责人批准驱动的需求与验收基线正式收口；纯文档任务） |
| 2026-08-30 | 点号保留分隔符需求调整草案：项目负责人明确选择第一版把英文句点 `.` 定义为三段结构保留分隔符（数据源 ID、Schema 名或表名含英文逗号或句点时，禁止用于新增或编辑订阅）；定向澄清 `DSUB-REQ-016`（两个英文句点为三段结构保留分隔符，无引号/转义符/长度前缀机制，大小写保持源 Oracle 原始大小写）与 `DSUB-REQ-017`（禁止英文逗号与英文句点，第一版无转义协议，新增/编辑不得选择且后端保存必须拒绝，必须说明具体名称与保留字符原因）；明确查询候选、维护候选与历史数据兼容边界；需求数量仍为 107；文档状态由 `APPROVED` 转为 `DRAFT_PENDING_USER_REVIEW`（上一正式批准版本提交 `d7560445be1504e6ed9957fa7b31be1fd393ea19`，历史批准事实保留）；实现状态仍为 `NOT_STARTED`；126 条验收仍全部 `NOT_RUN`；设计草案仍待后续 R1 修订和复审；本调整草案待正式复审 | DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-001（项目负责人决策驱动的纯文档需求/验收定向调整草案） |
| 2026-08-30 | 点号保留分隔符需求调整批准收口：ChatGPT 对提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a` 正式复审结论 `APPROVED`；当前需求版本由调整草案收口为 `APPROVED`；107 条需求（`DSUB-REQ-001` ~ `DSUB-REQ-107`）编号、数量与业务内容不变，`DSUB-REQ-016/017` 点号规则逐字保持并正式进入批准基线；实现状态仍为 `NOT_STARTED`；126 条验收仍全部 `NOT_RUN`；设计（DESIGN/API/UI/DATABASE）仍为 `DRAFT_PENDING_USER_REVIEW` 草案且设计复审仍为 `CHANGES_REQUIRED`，待后续设计 R1 修订和重新复审；本次批准只批准点号需求及对应验收标准，不表示设计批准、功能完成或验收通过 | DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-APPROVAL-001（项目负责人批准驱动的纯文档需求/验收调整批准收口） |
| 2026-08-30 | 含逗号数据源 ID 查询兼容需求调整草案：ChatGPT 正式复审发现无转义英文逗号分隔协议（`DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID`）无法精确识别含逗号 ID——原始字符串 `A,B` 无法区分“单个 ID `A,B`”与“两个 ID `A`、`B`”，设计 R1 中 `INSTR(','\|\|col\|\|',', ','\|\|#{token}\|\|',') > 0` 对含逗号 ID 存在不可消除的假阳性；定向调整 `DSUB-REQ-033`（三类候选语义：不含逗号 ID 为普通候选、仅含句点 ID 仍为普通候选可精确匹配、含逗号 ID 仍返回可选但显示“含逗号，历史兼容查询可能存在歧义”警告标记）与 `DSUB-REQ-034`（A 不含逗号 ID 去除首尾空白后完整 token 字面精确匹配、B 含逗号 ID 诚实定义为“历史兼容可能匹配”并返回可能匹配记录集合、C 多条件组合 OR/OR/AND 不变且任一组含逗号候选时页面显示查询歧义警告）；查询候选仍不因保留字符静默隐藏；新增/编辑维护候选禁用规则不变；多源库异常规则不变；不引入引号、转义符、长度前缀、关联表或 DDL；需求数量仍为 107；文档状态由 `APPROVED` 转为 `DRAFT_PENDING_USER_REVIEW`（上一正式批准版本为点号保留分隔符批准版本，批准依据提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a`，历史批准事实保留）；实现状态仍为 `NOT_STARTED`；126 条验收仍全部 `NOT_RUN`；本调整草案待正式复审 | DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-001（正式复审发现驱动的纯文档需求/验收定向调整草案） |
| 2026-08-30 | 含逗号数据源 ID 查询需求调整批准收口：ChatGPT 对提交 `5d5b5f4606da14f160e9db43068f114d35501db8` 正式复审结论 `APPROVED`；当前需求版本由调整草案收口为 `APPROVED`；107 条需求（`DSUB-REQ-001` ~ `DSUB-REQ-107`）编号、数量与业务内容不变，`DSUB-REQ-033/034` 三类查询语义逐字保持——普通 ID 与仅含句点 ID 按去除首尾空白后完整 token 精确匹配、含逗号 ID 为带“含逗号，历史兼容查询可能存在歧义”警告的“历史兼容可能匹配”并正式成为当前需求基线；查询 OR/OR/AND 分组、新增/编辑禁用规则、多源库异常规则均未改变；本次未批准设计、未实现功能、未执行验收；设计（DESIGN/API/UI/DATABASE）仍为 `DRAFT_PENDING_USER_REVIEW` 草案且设计复审仍为 `CHANGES_REQUIRED`，下一阶段为设计 R2 定向修订 | DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001（项目负责人批准驱动的纯文档需求/验收调整批准收口） |
| 2026-08-31 | 取消并发保护需求调整草案：项目负责人明确“数据订阅页面的新增、编辑、删除完全不处理并发操作，不考虑其他页面用户或人工直接修改数据库造成的并发冲突”；定向调整 `DSUB-REQ-097`（编辑打开不生成、不返回版本令牌、内容指纹或等效快照标识，页面保存请求不携带此类字段）、`DSUB-REQ-098`（编辑保存不加行锁、不比较打开时与保存时记录内容、完成现有业务校验后按 `DATA_SUB_ID` 普通更新、多个页面用户或人工操作交叉时不提供并发冲突检测、最后一次成功写入生效）、`DSUB-REQ-099`（不使用 `UPDATE_TIME` 或其他字段判断并发、不提供“记录已被他人或人工修改”的识别/拒绝覆盖/刷新重试机制、无快照一致性保证）、`DSUB-REQ-103`（删除确认信息普通只读获得但不锁行、不返回或回传版本令牌、确认后直接按 `DATA_SUB_ID` 主键物理删除、不检查预览后记录变化、记录不存在仍按 `DSUB-REQ-104` 处理）；§14 标题由“并发保护”改为“无并发保护边界”，§5.1 删除范围同步为“不做并发保护”，新增 §14 紧邻说明（主动选择的产品边界、不属于待解决缺口、不得重新解释成乐观锁/悲观锁/更新时间校验/ETag/幂等键/触发器等替代并发方案、只取消并发保护不改其他规则）；需求数量仍为 107；文档状态由 `APPROVED` 转为 `DRAFT_PENDING_USER_REVIEW`（上一正式批准版本为含逗号查询批准版本，批准依据提交 `5d5b5f4606da14f160e9db43068f114d35501db8`，历史批准事实保留）；实现状态仍为 `NOT_STARTED`；126 条验收仍全部 `NOT_RUN`；设计（DESIGN/API/UI/DATABASE）仍为 `DRAFT_PENDING_USER_REVIEW` 草案且设计复审仍为 `CHANGES_REQUIRED`——R2 四项修正目标已复核成立，但因本需求决策，设计 R3 将整体删除指纹/令牌/行锁方案，本调整草案待正式复审 | DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001（项目负责人决策驱动的纯文档需求/验收定向调整草案） |
| 2026-08-31 | 取消并发保护需求调整批准收口：ChatGPT 对 R1 结果提交 `43a909773aec63fe8c4de2957074f113910f4686` 正式复审结论 `APPROVED`；当前需求版本由“取消并发保护”需求调整草案收口为 `APPROVED`；107 条需求（`DSUB-REQ-001` ~ `DSUB-REQ-107`）编号、数量与业务语义相对复审提交零变化，`DSUB-REQ-097/098/099/103` 逐字保持；实现状态仍为 `NOT_STARTED`；126 条验收仍全部 `NOT_RUN`；设计（DESIGN/API/UI/DATABASE）仍为 `DRAFT_PENDING_USER_REVIEW` 草案且设计复审仍为 `CHANGES_REQUIRED`，下一阶段为设计 R3（删除版本令牌/内容指纹/黄金向量/行锁/并发字段比较/`40910`，编辑与删除改为普通主键更新/物理删除，删除预览只读不返回令牌，修正多源库异常空 token 归一化，补充 nullable CSV 的 null-safe 契约）；本次批准只批准取消并发保护需求及对应验收标准，不表示设计批准、功能完成或验收通过 | DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001（项目负责人批准驱动的纯文档需求/验收调整批准收口） |
| 2026-09-01 | 正式验收前 UI 交互基线对齐草案：ChatGPT 已正式批准后端实现及真实数据库集成验证、前端 R3 代码和视觉、R3-R1 报告元数据收口；产品负责人明确当前页面效果无需继续调整；正式验收基线仍存在少量已过期 UI 文字且 R2 已批准实现的 Shift 连选尚未同步到需求/验收/设计正文，因此在正式验收前定向调整 `DSUB-REQ-053`（最终弹窗尺寸：桌面默认宽 `1280px`、上限 `calc(100vw - 64px)`、小屏退化 `calc(100vw - 32px)`、高 `82vh` 受 `calc(100vh - 48px)` 约束、不得超出可视区域、固定头尾内容滚动）、`DSUB-REQ-054`（空间优先级与顶部布局：描述单行必填最大 255 字符、桌面源库/目标库同行约 34%/剩余、小屏整组换行、统一水平中轴、源表区占主要空间、Schema 区约 240~260px）、`DSUB-REQ-057`（订阅描述单行输入框、必填、最大 255 字符、不用 textarea）、`DSUB-REQ-065`（紧凑两行目标库卡片约 200×48、唯一左侧复选框、3 卡 1K/2K 同排、最多 5 个按空间换行）、`DSUB-REQ-066`（目标库卡片白色主体四态：未选中白底浅灰边框极轻阴影、悬停白底浅主题蓝边框轻阴影、选中白底主题蓝边框+左侧蓝色复选框+克制淡蓝灰阴影、禁止大面积浅蓝/蓝色渐变背景、禁用浅灰背景灰字不可选择、不使用健康/告警语义色）、`DSUB-REQ-073`（追加 Shift 连续范围选择完整规则）；需求数量仍为 107 条连续唯一；文档状态由 `APPROVED` 转为 `DRAFT_PENDING_USER_REVIEW`（上一正式批准版本为“取消并发保护”需求调整批准版本，批准依据提交 `43a909773aec63fe8c4de2957074f113910f4686`，历史批准事实保留）；实现状态由 `NOT_STARTED` 更新为 `IMPLEMENTED_REVIEW_APPROVED_PENDING_FORMAL_ACCEPTANCE`（后端与前端实现均已完成并经 ChatGPT 正式批准，正式验收尚未执行）；126 条验收仍全部 `NOT_RUN`；本调整草案待 ChatGPT 正式复审 | DATA-SUBSCRIPTION-PRE-ACCEPTANCE-UI-BASELINE-ALIGNMENT-001（正式验收前纯文档 UI 交互基线定向对齐草案） |
| 2026-09-01 | 正式验收前 UI 交互基线对齐草案批准收口：ChatGPT 对 R1 结果提交 `26094c6b6d8f9b8d5971ef38648851611799adee` 正式复审结论 `APPROVED`；当前需求版本由“正式验收前 UI 交互基线对齐草案”收口为 `APPROVED`；107 条需求（`DSUB-REQ-001` ~ `DSUB-REQ-107`）编号、数量与业务语义相对复审提交零变化，`DSUB-REQ-053/054/057/065/066/073` 逐字保持；实现状态保持 `IMPLEMENTED_REVIEW_APPROVED_PENDING_FORMAL_ACCEPTANCE`；126 条验收仍全部 `NOT_RUN`；本次批准的是 UI 交互基线对齐需求标准，不代表正式验收通过，也不代表 `IMPLEMENTED_ACCEPTED` | DATA-SUBSCRIPTION-PRE-ACCEPTANCE-UI-BASELINE-ALIGNMENT-APPROVAL-001（ChatGPT 复审 APPROVED 驱动的纯文档批准收口） |

> 关联文档：验收基线 `docs/features/data-subscription/ACCEPTANCE.md`；任务报告 `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001.md`、`...-001-R1.md`、`...-APPROVAL-001.md`、`.../DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-001.md`、`.../DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-APPROVAL-001.md`、`.../DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-001.md`、`.../DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001.md`、`.../DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md`、`.../DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1.md`、`.../DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001.md`。
