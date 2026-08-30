# 数据源管理 Feature 需求基线（REQUIREMENTS）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据源管理 |
| Feature 标识 | `data-source-management` |
| 正式菜单 | 数据源管理（配置管理组，路由 `/config/data-source`，菜单项与路由均保持既有值不变） |
| 既有路由 | `/config/data-source` |
| 目标文档 | `docs/features/data-source-management/REQUIREMENTS.md` |
| 文档状态 | `APPROVED`（已正式批准） |
| 实现状态 | `IMPLEMENTED_PENDING_REVIEW`（目标功能已实现并完成正式验收执行；正式验收结果 `FAIL`（PASS=103/FAIL=2/BLOCKED=1/NOT_RUN=0）；尚未置为 `IMPLEMENTED_ACCEPTED`；两个失败用例 `DS-AC-052`/`DS-AC-105` 尚待修复并复验，阻塞用例 `DS-AC-104` 尚待环境具备后补验） |
| 验收用例状态 | 原正式验收 106 例已全部执行（`PASS=103/FAIL=2/BLOCKED=1/NOT_RUN=0`）；验收后调整草案用例 `DS-AC-107~115`（9 例）全部 `NOT_RUN`，尚未批准、尚未执行（见 `docs/features/data-source-management/ACCEPTANCE.md`） |
| 基础基线状态 | `APPROVED`（原需求 `DS-REQ-001~109`、原验收标准 `DS-AC-001~106`、已批准 UI 设计基线保持已批准） |
| 验收后调整草案状态 | `DRAFT_PENDING_USER_REVIEW`（新增 `DS-REQ-110~115` 与 `DS-AC-107~115` 尚未获得用户正式批准、尚未实现、尚未执行） |
| 当前实现状态 | `IMPLEMENTED_PENDING_REVIEW`（与上表“实现状态”一致） |
| 原正式验收状态 | `FAIL`（PASS=103/FAIL=2/BLOCKED=1/NOT_RUN=0） |
| 任务编号 | `DATA-SOURCE-REQUIREMENTS-BASELINE-001` |
| 任务类型 | Feature 需求基线草案落盘、提交与推送（纯文档任务） |
| 授权基线提交 | `eca58e669c8ebad3cf73a1732870d1cfb8388517`（执行时实际 `origin/develop` 最新提交） |
| 初始任务结果提交 | `07a17921c025165d846e1ea238bc8c078db3d573`（初始需求与验收基线草案建立） |
| R1 修订提交 | `ca4d87be367cf69382bb55ab7800c17e0549c924`（验收文档逐例状态与需求追踪缺口修复） |
| ChatGPT 复审结论 | `REVIEW_PASS`（对 R1 修订提交的复审通过） |
| 批准任务 | `DATA-SOURCE-REQUIREMENTS-APPROVAL-CLOSEOUT-001` |
| 批准日期 | 2026-08-29 |
| 批准人 | 项目负责人（用户） |
| 批准依据 | 用户于 2026-08-29 明确回复“认可，继续”，正式批准当前 `REQUIREMENTS.md` 与 `ACCEPTANCE.md` |
| 创建日期 | 2026-08-29 |
| 需求来源 | 已确认的产品决策（本提示词 §5～§12 记录的产品需求）+ 已批准数据库基线（`docs/database/`） |

说明：本文件把已经确认的产品决策落成 Feature 需求基线，并已经正式批准（`APPROVED`）。批准链：初始任务建立草案（提交 `07a1792...`）→ R1 修订验收文档（提交 `ca4d87b...`）→ ChatGPT 复审 `REVIEW_PASS` → 项目负责人于 2026-08-29 明确回复“认可，继续”批准。批准只代表需求基线正式成立，不代表现有前后端实现符合基线，不代表功能已经实现、测试或验收通过。

本说明同时区分历史事实与当前事实：

- **历史事实（2026-08-29 需求建立与批准时）**：现有后端属于“已存在但不完整、且与新目标需求存在冲突的候选实现”，现有前端仅有菜单/路由和占位页。
- **当前事实**：目标功能已由 `DATA-SOURCE-IMPLEMENTATION-001`、R1、R2 完成实现；实现状态 `IMPLEMENTED_PENDING_REVIEW`；正式验收结论 `FAIL`（`PASS=103/FAIL=2/BLOCKED=1/NOT_RUN=0`）；尚未置为 `IMPLEMENTED_ACCEPTED`。功能未验收通过、未视为生产可用。

## 2. Feature 定位与术语

### 2.1 Feature 定位

“数据源管理”面向 CDC 配置管理平台，对源库（SOURCE）与目标库（TARGET）的连接配置进行增、删、改、查维护。页面以 `CDC_DATA_SOURCE` 作为独立主表展示；`CDC_DATA_SOURCE_EXTEND` 在本 Feature 中表示“源库到目标库的命名策略”，不是每个数据源一条且必填的通用扩展配置。

### 2.2 术语

| 术语 | 说明 |
|---|---|
| 数据源 | 源库或目标库的连接配置，对应 `CDC_DATA_SOURCE` 表，业务主键为 `DATA_SOURCE_ID`。 |
| 源库 / 目标库 | 数据源的两类角色，由 `DATA_SOURCE_CATEGORY` 区分：`SOURCE` 为源库，`TARGET` 为目标库。 |
| 数据源角色 | `DATA_SOURCE_CATEGORY` 的页面语义，取值 `SOURCE`（源库）/ `TARGET`（目标库）。 |
| 数据库类型 | `DATA_SOURCE_TYPE`，取值 `ORACLE` / `MYSQL` / `DORIS`。源库只允许 `ORACLE`；目标库允许 `ORACLE`、`MYSQL`、`DORIS`。 |
| Service Name/数据库名 | `DATA_SOURCE_SERVICE_NAME`。Oracle 的页面标签为“Service Name”，MySQL/Doris 的页面标签为“数据库名”。 |
| 有效记录 | `FG_ACTIVE = '1'` 的记录。当前功能仅查询和操作有效记录；其他值（包括 `'0'`）全部视为不存在。 |
| 目标库命名策略（命名策略） | `CDC_DATA_SOURCE_EXTEND` 在本 Feature 中的业务含义：源库到目标库的命名策略，一个源库可有 0 条或多条记录。页面与文档统一使用“目标库命名策略”或“命名策略”。 |
| 业务属性 | `DATA_SOURCE_BIZ_ATTR`，仅对目标库使用，通过独立“业务属性”弹窗以普通 JSON 文本方式展示和编辑。 |

## 3. 当前状态与目标差距分层

> 快照说明：本节（§3）记录的是本需求基线建立时（2026-08-29）对现有代码与数据库的“实施前差距”历史快照，作为当时的需求决策依据保留，**不代表当前代码事实**。本 Feature 目标功能已经实现并完成正式验收执行（原正式验收结果 `PASS=103/FAIL=2/BLOCKED=1/NOT_RUN=0`，正式验收状态 `FAIL`，详见 `ACCEPTANCE.md`），当前实现状态为 `IMPLEMENTED_PENDING_REVIEW`；本节内容不再用于描述当前实现现状。

本文件区分“当前事实”与“目标需求”，不得混淆：

- **当前事实（OBSERVED_CODE / OBSERVED_DATABASE）**：代码和数据库当前实际状态。
- **目标需求（TARGET_REQUIREMENT）**：已确认的目标业务规则（本文件后续章节）。
- **当前差距（GAP）**：当前事实与目标需求不一致、需要后续设计/实现修正的部分。

### 3.1 当前后端实现（候选实现，已存在但不完整、且与新目标需求存在冲突）

后端 `com.bsoft.cdcconfig.datasource` 包已存在一套 CRUD + 启停的候选实现（`DataSourceController` 提供 7 个 API 端点：分页查询、详情、新增、修改、删除、启用、停用）。该实现属于“已存在但不完整、且与新目标需求存在冲突的候选实现”，**不得描述为已经满足本基线**。与新目标需求冲突的现状差距包括（仅记录，不写进目标需求，待后续设计/实现修正）：

| 当前实现事实 | 与新目标的冲突 |
|---|---|
| 列表使用分页（`pageNum`/`pageSize`，MyBatis-Plus `Page`） | 目标：主列表不分页（记录总数 ≤ 100，前后端均不使用分页参数或分页交互） |
| 提供启用/停用端点（`/enable`、`/disable`） | 目标：页面不提供启用/停用操作；只保留物理删除；编辑不改 `FG_ACTIVE` |
| 查询仅数据源 ID（精确 `eq`）、名称（模糊 `like`）两个条件 | 目标：数据源 ID、名称、主机地址三个条件均为不区分大小写的模糊/包含查询 |
| `create`/`update` 强校验 `extend` 非空（一对一必填扩展配置） | 目标：`CDC_DATA_SOURCE_EXTEND` 表示源库到目标库命名策略，每个源库可有 0..N 条 |
| `update` 修改 ID 时同步更新扩展表 `DATA_SOURCE_ID` | 目标：修改 `DATA_SOURCE_ID` 只修改主表当前记录的 ID，不同步其他表 |
| `delete` 同时删除主表与扩展表（联写/级联） | 目标：删除数据源只删除主表记录，不检查、不删除、不级联 `CDC_DATA_SOURCE_EXTEND` 或其他表 |
| `findExtend` 使用 `selectOne` + `ROWNUM=1` 假定一对一 | 目标：同一源库到同一目标库只有一条命名策略；第一版由后端保存前查重校验，不新增数据库约束 |
| 列表 VO 返回 `dataSourceOrg`、`fgActive`、`extendConfigured` 等字段 | 目标：主列表不得展示 `DATA_SOURCE_ORG`、`FG_ACTIVE` 等隐藏字段 |
| 无连接测试、无业务属性独立弹窗、无命名策略多记录维护 | 目标：提供测试连接、业务属性弹窗、目标库命名策略弹窗 |
| 查询未按 `FG_ACTIVE='1'` 过滤（分页查询直接 `selectPage`） | 目标：仅查询和操作 `FG_ACTIVE='1'` 的记录；其他值视为不存在 |

### 3.2 当前前端实现（占位）

前端 `/config/data-source` 路由已存在，指向 `frontend/src/views/data-source/DataSourcePage.vue`，该页面为 `PlaceholderPage` 占位页，仅展示占位文案。**现有前端仅有菜单/路由和占位页，不得描述为功能已经完成。**

### 3.3 分层约定

- 本文件已正式批准（`APPROVED`）；现有实现的一切差距均待后续设计/实现修正，不写进目标需求。
- 当前开发库数据快照（`CDC_DATA_SOURCE` 当前行数、`CDC_DATA_SOURCE_EXTEND` 当前行数与人工构造的容错测试数据等）属于 `OBSERVED_DATABASE`，不得写成生产常态，也不得写成数据库强制约束。

## 4. 数据来源与已批准数据库基线引用

本 Feature 涉及的两张表的物理结构、字段类型、长度、可空性、约束、当前行数与数据分布均引用已批准数据库基线，本任务不重新查询数据库，也不执行任何 DDL。

| 引用项 | 权威文档 |
|---|---|
| 数据库文档总入口与批准基线说明 | `docs/database/README.md` |
| 表总体清单 | `docs/database/SCHEMA.md` |
| 跨表逻辑关系（R01、R15 等） | `docs/database/RELATIONS.md` |
| 公共码值（`FG_ACTIVE`、`DATA_SOURCE_TYPE`、`DATA_SOURCE_CATEGORY`、`TABLE_NAMING_STRATEGY`） | `docs/database/CODE_VALUES.md` |
| `CDC_DATA_SOURCE` 单表物理基线 | `docs/database/tables/CDC_DATA_SOURCE.md` |
| `CDC_DATA_SOURCE_EXTEND` 单表物理基线 | `docs/database/tables/CDC_DATA_SOURCE_EXTEND.md` |

引用事实摘要（均来自已批准数据库基线，`OBSERVED_DATABASE`）：

- `CDC_DATA_SOURCE`：主键 `PK_CDC_DATA_SOURCE`（`DATA_SOURCE_ID`，VARCHAR2(32)）；`DATA_SOURCE_ORG`（VARCHAR2(64)，非空）；`DATA_SOURCE_HOST`（VARCHAR2(64)，非空）；`DATA_SOURCE_PORT`（VARCHAR2(64)，非空）；`DATA_SOURCE_USER_NAME`（VARCHAR2(64)，非空）；`DATA_SOURCE_PASSWORD`（VARCHAR2(64)，非空，明文存储，项目负责人确认不加密）；`DATA_SOURCE_TYPE`（VARCHAR2(32)，非空）；`DATA_SOURCE_SERVICE_NAME`（VARCHAR2(64)，非空）；`DATA_SOURCE_CATEGORY`（VARCHAR2(30)，可空）；`SOURCE_APP`（VARCHAR2(20)，可空）；`DATA_SOURCE_NAME`（VARCHAR2(30)，可空）；`DATA_SOURCE_DOMAIN`（VARCHAR2(32)，可空，项目负责人确认暂时不用）；`DATA_SOURCE_BIZ_ATTR`（VARCHAR2(2000)，可空）；`FG_ACTIVE`（VARCHAR2(1)，可空）；`INSERT_TIME`/`UPDATE_TIME`/`DELETE_TIME`（DATE，可空）。无 UNIQUE、无 FOREIGN KEY 约束。
- `CDC_DATA_SOURCE_EXTEND`：`DATA_SOURCE_ID`（VARCHAR2(32)，可空）；`TABLE_NAMING_STRATEGY`（VARCHAR2(32)，可空）；`TABLE_NAME_PREFIX`（VARCHAR2(128)，可空）；`TABLE_NAME_SUFFIX`（VARCHAR2(128)，可空）；`TARGET_DATA_SOURCE_ID`（VARCHAR2(128)，可空）。无主键、无唯一约束、无索引（当前物理事实；目标规则由本 Feature 定义，见 §11，第一版不新增 DDL）。
- `TARGET_DATA_SOURCE_ID` 业务语义为目标库（`DATA_SOURCE_CATEGORY='TARGET'`），为无物理外键、无类别约束的单值弱逻辑引用（RELATIONS.md R15）。

本 Feature 的所有业务规则（`FG_ACTIVE` 过滤、唯一性校验、命名策略查重、密码不回传等）均属应用层规则，不得写成数据库已有约束。

## 5. 功能范围（范围内/范围外）

### 5.1 范围内

- 以 `CDC_DATA_SOURCE` 为独立主表展示，仅查询和操作 `FG_ACTIVE='1'` 的有效记录；
- 主列表三条件（数据源 ID / 名称 / 主机地址）不区分大小写模糊查询、重置、默认按数据源 ID 升序、不分页；
- 新增、编辑数据源（居中大弹窗）及其字段校验、唯一性校验、密码处理、测试连接；
- 目标库业务属性独立弹窗（普通 JSON 文本展示与编辑，不做校验，原样保存）；
- 源库目标库命名策略独立弹窗（0..N 记录，新增/编辑/删除，逻辑联合键查重）；
- 删除数据源（物理删除主表记录，二次确认，不级联）；
- 通用加载/空数据/失败脱敏提示、防重复提交、未保存关闭确认。

### 5.2 范围外

- 启用/停用操作（页面不提供；删除不通过修改 `FG_ACTIVE` 实现）；
- 分页参数或分页交互（前后端均不使用）；
- 主列表或主表单维护 `DATA_SOURCE_ORG`、`DATA_SOURCE_DOMAIN`、`SOURCE_APP`、`FG_ACTIVE`、创建/更新时间；
- 修改 `DATA_SOURCE_ID` 时同步修改 `CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID`、`TARGET_DATA_SOURCE_ID` 或其他表引用；
- 删除数据源时检查、删除、更新或级联处理 `CDC_DATA_SOURCE_EXTEND` 或其他表关联数据；
- `DATA_SOURCE_BIZ_ATTR` 的 JSON 合法性、结构、格式或业务字段校验；
- 命名策略的数据库唯一约束、主键或其他 DDL；
- 数据库 DDL、数据清洗、存量异常数据处理、生产数据写入；
- 用户认证/权限管理。

## 6. 角色与主要使用场景

| 角色 | 说明 |
|---|---|
| CDC 运维/开发人员 | 通过“数据源管理”页面维护源库与目标库连接配置，查看主列表，新增/编辑/删除数据源，维护目标库业务属性与源库命名策略，测试连接可用性。 |

主要使用场景：

1. 进入“配置管理 > 数据源管理”，查看全部有效数据源主列表；
2. 按数据源 ID / 名称 / 主机地址模糊查询，或重置恢复全部有效记录；
3. 新增数据源：填写连接字段并保存（后端自动写入 `FG_ACTIVE='1'`、`DATA_SOURCE_ORG=DATA_SOURCE_NAME`）；
4. 编辑数据源：修改连接字段、可修改 ID，密码未改不覆盖；
5. 对目标库维护业务属性（JSON 文本原样保存）；
6. 对源库维护到各目标库的命名策略（0..N 条，逻辑联合键唯一）；
7. 删除数据源（仅删主表记录，不级联，二次确认）；
8. 新增/编辑弹窗内测试连接，确认连接字段可用。

## 7. 主数据源列表

### 7.1 数据范围

| 编号 | 需求 |
|---|---|
| DS-REQ-001 | `CDC_DATA_SOURCE` 作为独立主表展示。 |
| DS-REQ-002 | 当前功能仅查询和操作 `FG_ACTIVE = '1'` 的记录；其他值（包括 `'0'`）全部视为不存在。 |
| DS-REQ-003 | 页面不提供启用/停用操作。 |
| DS-REQ-004 | 新增时后端显式写入 `FG_ACTIVE = '1'`；后续任何编辑操作都不得修改 `FG_ACTIVE`。 |
| DS-REQ-005 | 表记录总数不会超过 100 条；主列表前后端均不使用分页参数或分页交互。 |

### 7.2 查询

| 编号 | 需求 |
|---|---|
| DS-REQ-006 | 查询条件严格限定为三个普通文本输入框：数据源 ID、数据源名称、主机地址。 |
| DS-REQ-007 | 三个查询条件均为不区分大小写的包含/模糊查询。 |
| DS-REQ-008 | 多个非空条件使用 AND 组合；查询值先去除首尾空格。 |
| DS-REQ-009 | “查询”按钮执行查询；“重置”清空条件并立即恢复全部有效记录。 |
| DS-REQ-010 | 默认按数据源 ID 升序；第一版不提供其他排序操作。 |

### 7.3 列表字段与行操作

| 编号 | 需求 |
|---|---|
| DS-REQ-011 | 主列表展示：数据源 ID、数据源名称、数据源角色（源库/目标库）、数据库类型、主机地址、端口、Service Name/数据库名、用户名、操作。 |
| DS-REQ-012 | 主列表不得展示密码、`DATA_SOURCE_ORG`、`DATA_SOURCE_BIZ_ATTR`、`DATA_SOURCE_DOMAIN`、`FG_ACTIVE`、创建/更新时间或 `SOURCE_APP`。 |
| DS-REQ-013 | 行操作包括：编辑；业务属性（仅当前角色为目标库时显示）；目标库命名策略（仅当前角色为源库时显示）；删除。 |
| DS-REQ-014 | 双击行与单击“编辑”按钮都打开编辑弹窗。 |

## 8. 新增与编辑数据源

### 8.1 交互形式

| 编号 | 需求 |
|---|---|
| DS-REQ-015 | 新增、编辑使用居中的大尺寸弹窗；不得使用抽屉、新页面或新标签页。 |
| DS-REQ-016 | 弹窗有未保存修改时关闭，必须二次确认是否放弃修改。 |
| DS-REQ-017 | 请求处理中禁用保存、删除、测试等相应按钮，防止重复提交。 |
| DS-REQ-018 | 保存成功后关闭或按页面规范反馈，并刷新主列表。 |

### 8.2 表单字段

| 编号 | 需求 |
|---|---|
| DS-REQ-019 | 主弹窗只维护：数据源 ID、数据源名称、数据源角色/类别、数据库类型、主机地址、端口、用户名、密码、Service Name/数据库名。 |
| DS-REQ-020 | 不在主弹窗维护 `DATA_SOURCE_ORG`、`DATA_SOURCE_BIZ_ATTR`、`DATA_SOURCE_DOMAIN`、`FG_ACTIVE`、时间字段或 `SOURCE_APP`。 |

### 8.3 字段规则

| 编号 | 需求 |
|---|---|
| DS-REQ-021 | 数据源 ID：必填，最长 32，仅允许字母、数字、下划线和连字符；可自由修改。 |
| DS-REQ-022 | 数据源名称：必填，最长 30。 |
| DS-REQ-023 | 数据源角色：必填；`SOURCE` 表示源库，`TARGET` 表示目标库。 |
| DS-REQ-024 | 数据库类型：必填；源库只能选择 `ORACLE`，目标库可以选择 `ORACLE`、`MYSQL`、`DORIS`。 |
| DS-REQ-025 | 修改角色后，如当前数据库类型不再合法，应清空并要求重新选择。 |
| DS-REQ-026 | 主机地址：必填，最长 64；允许 IP、域名或主机名，不使用只接受 IP 的过严校验。 |
| DS-REQ-027 | 端口：必填，整数，范围 1–65535。 |
| DS-REQ-028 | 用户名：必填，最长 64。 |
| DS-REQ-029 | 密码：新增时必填，最长 64；编辑规则见 §9 密码章节。 |
| DS-REQ-030 | `DATA_SOURCE_SERVICE_NAME`：必填，最长 64；Oracle 的标签为“Service Name”，MySQL/Doris 的标签为“数据库名”。 |
| DS-REQ-031 | 除 `DATA_SOURCE_BIZ_ATTR` 外，所有用户输入的字符串保存/查询前均去除首尾空格，包括密码、命名策略前后缀等。 |

### 8.4 唯一性

| 编号 | 需求 |
|---|---|
| DS-REQ-032 | 数据源 ID 不区分大小写唯一，`DS01` 与 `ds01` 不得同时存在。 |
| DS-REQ-033 | 数据源名称不区分大小写唯一。 |
| DS-REQ-034 | 后端保存前查询校验唯一性；第一版不新增数据库唯一约束或 DDL。 |
| DS-REQ-035 | 编辑时排除当前记录自身后判断冲突。 |
| DS-REQ-036 | 冲突时阻止保存并返回清晰、可展示的业务提示。 |

### 8.5 隐藏字段与跨表处理

| 编号 | 需求 |
|---|---|
| DS-REQ-037 | 新增时后端自动设置 `DATA_SOURCE_ORG = DATA_SOURCE_NAME`，因为数据库字段非空。 |
| DS-REQ-038 | 编辑时无论名称是否改变，都保留原 `DATA_SOURCE_ORG`。 |
| DS-REQ-039 | `SOURCE_APP` 和 `DATA_SOURCE_DOMAIN` 不展示、不新增/编辑；编辑时保留原值。 |
| DS-REQ-040 | 修改 `DATA_SOURCE_CATEGORY` 只修改主表当前记录的类别字段，不清理、迁移或更新其他表数据。 |
| DS-REQ-041 | 修改 `DATA_SOURCE_ID` 只修改 `CDC_DATA_SOURCE.DATA_SOURCE_ID`；不得同步修改 `CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID`、`TARGET_DATA_SOURCE_ID` 或其他表引用。 |

## 9. 密码展示与保存

| 编号 | 需求 |
|---|---|
| DS-REQ-042 | 主列表不得显示密码。 |
| DS-REQ-043 | 查询详情或编辑接口不得向前端返回真实密码。 |
| DS-REQ-044 | 编辑弹窗显示固定掩码（例如 `*********`），它不是密码值。 |
| DS-REQ-045 | 前端使用“密码是否被用户修改”的状态判断：未修改时保存请求不发送密码字段，后端保留数据库原密码；已修改时发送去除首尾空格后的新密码，后端覆盖。 |
| DS-REQ-046 | 后端不得把某个字符串（包括 `*********`）当作“保留旧密码”的魔法哨兵。 |
| DS-REQ-047 | 日志、异常、响应中不得泄露密码。 |

## 10. 测试连接

| 编号 | 需求 |
|---|---|
| DS-REQ-048 | 新增和编辑弹窗均提供“测试连接”按钮。 |
| DS-REQ-049 | 测试连接不是保存前置条件；未测试或测试失败均可保存。 |
| DS-REQ-050 | 使用弹窗内当前尚未保存的连接字段。 |
| DS-REQ-051 | 编辑时若密码未修改，后端使用数据库中保存的密码；若已修改，使用新密码。 |
| DS-REQ-052 | 后端建立一次性临时 JDBC 连接，不使用应用连接池，不保存表单内容；测试完成立即关闭。 |
| DS-REQ-053 | Oracle 执行最小查询 `SELECT 1 FROM DUAL`；MySQL/Doris 执行 `SELECT 1`。 |
| DS-REQ-054 | 单次超时 10 秒，不重试。 |
| DS-REQ-055 | 测试期间按钮禁用；前端显示剩余时间 `10, 9, 8, ... , 0`。 |
| DS-REQ-056 | 后端提前返回时立即停止倒计时。 |
| DS-REQ-057 | 到 0 仍无结果时前端显示超时，并忽略之后到达的迟返回结果，防止覆盖超时状态。 |
| DS-REQ-058 | 成功仅需明确显示“连接成功”。 |
| DS-REQ-059 | 失败返回经过脱敏的简短原因（例如认证失败、超时、不可达）；不得返回原始堆栈、密码或敏感连接信息。 |
| DS-REQ-060 | 任意连接字段发生修改后，之前的测试成功状态立即失效。 |
| DS-REQ-061 | 连接测试不得修改数据库中的业务数据。 |

> 依赖约束：MySQL JDBC 驱动已在实现任务中加入，Doris 按已批准设计使用兼容连接方式；这不是服务器环境安装事项。本基线只把该约束写入需求/验收，不修改构建文件。

## 11. 目标库命名策略弹窗

### 11.1 业务语义

| 编号 | 需求 |
|---|---|
| DS-REQ-062 | `CDC_DATA_SOURCE_EXTEND` 在本 Feature 中表示“源库到目标库的命名策略”，不是每个数据源一条且必填的通用扩展配置。 |
| DS-REQ-063 | 每个源库可以有 0 条或多条记录。 |
| DS-REQ-064 | `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 为逻辑联合键/逻辑唯一组合；同一个源库到同一个目标库只能有一种命名策略。 |
| DS-REQ-065 | 第一版只由后端保存前查询校验，不新增主键、唯一约束或任何 DDL。 |
| DS-REQ-066 | 不处理或清洗存量异常数据。 |
| DS-REQ-067 | 如保存时发现同一组合已存在多条或会产生重复，必须阻止保存并明确提示数据异常/重复。 |
| DS-REQ-068 | 页面和文档统一使用“目标库命名策略”或“命名策略”，避免使用含义模糊的“扩展配置”。 |

### 11.2 入口与列表

| 编号 | 需求 |
|---|---|
| DS-REQ-069 | 仅源库显示“命名策略”按钮。 |
| DS-REQ-070 | 点击后打开独立的大弹窗。 |
| DS-REQ-071 | 弹窗显示该源库所有命名策略，不分页。 |
| DS-REQ-072 | 建议列：目标库 ID、目标库名称、数据库类型、命名策略、前缀、后缀、操作。 |
| DS-REQ-073 | 支持新增、编辑、删除策略。 |
| DS-REQ-074 | 新增/编辑表单在同一个大弹窗内部切换或展开，不再嵌套第二个弹窗。 |
| DS-REQ-075 | 有未保存修改时关闭或切换，必须确认放弃修改。 |

### 11.3 目标库选择与策略规则

| 编号 | 需求 |
|---|---|
| DS-REQ-076 | 目标库下拉框只包含 `FG_ACTIVE = '1'` 且 `DATA_SOURCE_CATEGORY = 'TARGET'` 的记录。 |
| DS-REQ-077 | 新增时默认不选择任何目标库，用户必须主动选择。 |
| DS-REQ-078 | `TARGET_DATA_SOURCE_ID` 在每条命名策略中必填。 |
| DS-REQ-079 | `TABLE_MERGE`：前缀和后缀不要求填写；切换为或保存为该策略时清空前缀、后缀。 |
| DS-REQ-080 | `CUSTOM_PREFIX_SUFFIX`：显示前缀和后缀，二者均必填，并按统一规则去除首尾空格。 |
| DS-REQ-081 | 删除策略只物理删除对应的 `CDC_DATA_SOURCE_EXTEND` 行，并要求二次确认。 |

## 12. 业务属性弹窗

| 编号 | 需求 |
|---|---|
| DS-REQ-082 | `DATA_SOURCE_BIZ_ATTR` 仅对当前角色为 `TARGET` 的数据源使用。 |
| DS-REQ-083 | 不在主列表和主数据源表单中展示或编辑。 |
| DS-REQ-084 | 通过独立“业务属性”按钮打开单独弹窗。 |
| DS-REQ-085 | 第一版使用普通 JSON 文本编辑器/多行文本框，仅作为文本展示和编辑。 |
| DS-REQ-086 | 内容可以为空。 |
| DS-REQ-087 | 第一版绝对不做 JSON 合法性、结构、格式或业务字段校验。 |
| DS-REQ-088 | 内容原样保存；唯一不做首尾空格处理的用户输入字段就是 `DATA_SOURCE_BIZ_ATTR`。 |
| DS-REQ-089 | 保存成功后给出明确反馈，并按页面状态需要刷新主列表。 |
| DS-REQ-090 | 有未保存修改时关闭弹窗，必须确认放弃修改。 |

## 13. 删除数据源

| 编号 | 需求 |
|---|---|
| DS-REQ-091 | 页面只保留“删除”，不保留停用。 |
| DS-REQ-092 | 删除是对 `CDC_DATA_SOURCE` 当前记录的物理删除。 |
| DS-REQ-093 | 删除源库或目标库时，只删除该主表记录。 |
| DS-REQ-094 | 不检查、不删除、不更新、不级联处理 `CDC_DATA_SOURCE_EXTEND` 或其他表的关联数据。 |
| DS-REQ-095 | 即使目标库被命名策略引用，也不阻止删除。 |
| DS-REQ-096 | 删除前必须二次确认；请求处理中防止重复提交；成功后刷新列表。 |
| DS-REQ-097 | 删除操作不得通过修改 `FG_ACTIVE` 实现。 |

## 14. 通用交互与错误处理

| 编号 | 需求 |
|---|---|
| DS-REQ-098 | 主列表、弹窗提供加载态。 |
| DS-REQ-099 | 提供空数据状态。 |
| DS-REQ-100 | 查询、加载、保存、删除、连接测试失败后提供脱敏提示和合理重试入口。 |
| DS-REQ-101 | 请求进行中防止重复提交。 |
| DS-REQ-102 | 成功保存主数据、业务属性或命名策略后提供明确反馈。 |
| DS-REQ-103 | 双击编辑与按钮编辑行为一致。 |
| DS-REQ-104 | 所有编辑容器未保存关闭均需确认。 |
| DS-REQ-105 | 不使用旧方案中的新标签页及页面重新聚焦刷新行为。 |

## 15. 权限/安全边界与错误处理补充

| 编号 | 需求 |
|---|---|
| DS-REQ-106 | 前端校验不是安全边界；后端必须独立重新校验唯一性、必填、长度、值域、角色-类型联动与命名策略查重。 |
| DS-REQ-107 | 密码与敏感连接信息不得出现在日志、异常、响应或页面中；连接测试失败只返回脱敏原因。 |
| DS-REQ-108 | 第一版不新增任何数据库唯一约束、主键、索引或 DDL；所有唯一性与命名策略查重均由后端保存前查询校验。 |
| DS-REQ-109 | 连接测试、业务属性与命名策略维护不得改变无关表数据；连接测试不得写入数据库业务数据。 |

## 16. 历史候选差异/废止规则

以下旧候选假设被新目标规则取代，必须明确声明：

| 旧候选假设 | 当前目标规则 |
| --- | --- |
| 每个数据源恰好一条、且必须有 EXTEND | 每个源库可有 0..N 条源到目标命名策略 |
| 主列表分页 | 不分页，最多 100 条 |
| ID 精确、名称模糊查询 | ID、名称、主机均为不区分大小写的模糊查询 |
| 修改 ID 同步 EXTEND | 只修改主表 ID，不同步其他表 |
| 删除主表级联 EXTEND | 只删除主表记录，不检查、不级联 |
| 提供启用/停用 | 只保留物理删除；编辑不改 `FG_ACTIVE` |
| 主列表/表单维护机构 | `DATA_SOURCE_ORG` 完全隐藏；新增后端自动赋名称，编辑保留 |
| 主表单维护 BIZ_ATTR | 目标库通过独立业务属性弹窗维护 |
| 新标签页编辑 | 居中大弹窗 |
| BIZ_ATTR 做 JSON 校验 | 第一版不做任何校验，原样保存 |
| 目标库仅 MYSQL/DORIS | 目标库允许 ORACLE/MYSQL/DORIS |

上述分页、启停、一对一 EXTEND、ID 同步等冲突逻辑，是需求建立时（2026-08-29）观察到的历史候选差异；这些差异已经由实现任务（`DATA-SOURCE-IMPLEMENTATION-001`、R1、R2）完成改造，不再是“待后续设计/实现修正”的当前事项。本节差异表作为历史决策依据保留，不用于描述当前实现现状。当前是否接受实现，以正式验收与后续复验结果为准：原正式验收结果 `PASS=103/FAIL=2/BLOCKED=1/NOT_RUN=0`，`DS-AC-052`、`DS-AC-105` 两个失败用例不得隐去。

## 17. 基线影响

- 已批准项目/数据库基线中“EXTEND 一对一且必填”的旧目标规则已由 `DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001` 完成同步：`docs/database/**` 与项目级基线中的相关旧规则描述已更新为本 Feature 的批准规则（`CDC_DATA_SOURCE_EXTEND` 为源库到目标库的命名策略、源库 0..N、逻辑联合唯一由后端校验、第一版无 DDL、删除/改 ID 不级联不同步）。
- 本次同步为纯文档调整：数据库物理结构和当前代码没有因此变化；物理表当前没有阻止 0..N 关系的约束，本任务不要求 DDL。

## 18. 依赖与后续工作

| 项 | 说明 |
|---|---|
| MySQL/Doris JDBC 驱动 | MySQL JDBC 驱动已在实现任务中加入，Doris 按已批准设计使用兼容连接方式。当前未完成项不是“加入驱动”，而是 MySQL 远程授权未放行、Doris 无可用验收环境，导致 `DS-AC-104` 保持 `BLOCKED`，待环境具备后补验。 |
| 后端目标实现 | 已由 `DATA-SOURCE-IMPLEMENTATION-001`、R1、R2 完成目标实现。当前仍有 `DS-AC-052`（密码进入 MyBatis DEBUG 参数日志）、`DS-AC-105`（`port:"abc"` 返回 HTTP 500 而非批准 API 契约要求的 HTTP 400/code=400）两个正式验收失败点待修复及复验，因此实现状态为 `IMPLEMENTED_PENDING_REVIEW`、尚未置为 `IMPLEMENTED_ACCEPTED`。 |
| 前端数据源管理页面 | 已由实现任务替换为正式数据源管理页面，用户对原批准基线内七项视觉功能检查通过。新 `DS-REQ-110~115`（验收后五项页面调整）为待用户审批、待实现、待验收的调整草案（`DRAFT_PENDING_USER_REVIEW`），不得混同为已经实现。 |
| 受影响的已批准基线 | 已通过基线影响同步任务（`DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001`）完成同步，见 §17。 |

## 19. 开放问题

以下为当前未闭环事项。这些属于实现/环境/调整审批层面的未闭环事项，不代表原 `DS-REQ-001~109` 存在尚未确认的产品决策：

- `DS-AC-052`：密码进入 MyBatis DEBUG 参数日志，违反既有 `DS-REQ-047/107`，正式验收 `FAIL`，待修复及复验。
- `DS-AC-105`：`port:"abc"` 返回 HTTP 500，而非批准 API 契约要求的 HTTP 400/code=400，正式验收 `FAIL`，待修复及复验。
- `DS-AC-104`：MySQL 远程授权和 Doris 环境限制，状态 `BLOCKED`，待环境具备后补验。
- `DS-REQ-110~115` / `DS-AC-107~115`：状态 `DRAFT_PENDING_USER_REVIEW` / `NOT_RUN`，待 ChatGPT 复审、用户批准、实现与验收。

## 20. 验收后页面调整需求草案（DRAFT_PENDING_USER_REVIEW）

> 状态：`DRAFT_PENDING_USER_REVIEW`。以下 `DS-REQ-110~115` 为数据源管理正式验收后确认的五项页面调整（主列表空状态、可拖动业务弹窗、标签对齐、命名策略弹窗宽度、命名策略单选卡片）对应的需求草案。本组需求尚未获得用户正式批准，未进入实现、测试或验收；不得写成已批准、已实现、已测试或已验收。原 `DS-REQ-001~109` 保持 `APPROVED`，编号与正文逐字冻结，不受本组草案影响。
>
> 既有缺陷边界：`DS-AC-052`（密码进入 MyBatis DEBUG 参数日志，违反既有 `DS-REQ-047/107`）与 `DS-AC-105`（`port:"abc"` 返回 HTTP 500 而非批准 API 契约要求的 HTTP 400/code=400）为既有需求/契约实现缺陷；本组调整草案不新增需求、不改判定、不修复。`DS-AC-104` 保持环境阻塞，待 MySQL 授权与 Doris 环境具备后补验。修复方案不得写成已实现事实。

| 编号 | 需求 |
|---|---|
| DS-REQ-110 | 主列表空状态根据“最后一次实际执行并生效的查询条件”区分，而不是根据尚未点击查询的表单内容判断。有生效查询条件且结果为零时，主提示为“未找到符合当前查询条件的数据源”，辅助提示为“请调整查询条件后重试，或点击上方‘重置’查看全部数据源”；无生效查询条件且列表为零时，主提示为“暂无数据源”，辅助提示引导使用右上角“新增数据源”创建第一条数据源。 |
| DS-REQ-111 | 空状态不增加重复的“重置查询”按钮或链接；查询区现有“重置”按钮是唯一重置入口。空状态使用中性灰色信息样式，不使用红色/橙色错误或警告色；主提示字号和字重高于辅助提示，并提供足够的垂直留白。 |
| DS-REQ-112 | 新增/编辑数据源、业务属性、目标库命名策略三个业务弹窗支持拖动。仅标题栏非控件区域可发起拖动；关闭按钮、输入控件和操作按钮不得触发拖动；弹窗不得被完全拖出可视区域，至少保留可操作标题栏；浏览器尺寸变化后修正位置；每次重新打开恢复默认居中。删除确认、未保存确认等小型确认框保持固定居中且不可拖动。 |
| DS-REQ-113 | 三个业务弹窗内的表单标签采用统一固定宽度并左对齐；输入控件左边界保持一致；必填星号位置固定，不得造成有无必填标记的标签文字错位；动态标签 `Service Name/数据库名` 同样遵守。 |
| DS-REQ-114 | “目标库命名策略”弹窗桌面端默认宽度约 `1050px`，同时受浏览器可视宽度约束并保留左右安全间距；列表不分页，默认空间可完整展示约 5 行记录；列固定为目标库 ID、目标库名称、数据库类型、命名策略、前缀、后缀、操作，并合理分配列宽；长内容省略显示且悬停展示完整值。 |
| DS-REQ-115 | `TABLE_MERGE` 与 `CUSTOM_PREFIX_SUFFIX` 使用横向排列的单选卡片。卡片第一行显示单选按钮和策略名称，第二行显示说明；点击整张卡片可选中；选中态使用蓝色边框和浅蓝背景。说明固定为：表合并——“按表合并规则生成目标表名，无需填写前缀和后缀。”；自定义前后缀——“在源表名基础上添加指定前缀和后缀，生成目标表名。”。原有前后缀联动规则保持不变：选择表合并时清空并禁用前后缀，选择自定义前后缀时启用并按既有规则校验。 |

## 21. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-29 | 建立“数据源管理”Feature 需求基线草案（DRAFT_PENDING_USER_REVIEW；实现状态 NOT_STARTED；全部验收用例 NOT_RUN） | DATA-SOURCE-REQUIREMENTS-BASELINE-001（纯文档任务；基于已确认产品决策 + 已批准数据库基线；待 ChatGPT 复审与用户批准） |
| 2026-08-29 | 需求与验收基线批准收口：文档状态由 `DRAFT_PENDING_USER_REVIEW` 更新为 `APPROVED`；实现状态保持 `NOT_STARTED`；补充批准任务 `DATA-SOURCE-REQUIREMENTS-APPROVAL-CLOSEOUT-001`、批准日期 2026-08-29、批准依据（用户明确回复“认可，继续”）与批准链（初始提交 `07a1792...`、R1 提交 `ca4d87b...`、ChatGPT 复审 `REVIEW_PASS`）；§17 受影响基线说明更新为本 Feature 需求已批准、受影响的已批准基线仍须独立维护任务修订；不改变任何 DS-REQ 编号、文本或语义 | DATA-SOURCE-REQUIREMENTS-APPROVAL-CLOSEOUT-001（项目负责人批准驱动的需求与验收基线批准收口；纯文档任务） |
| 2026-08-29 | 项目/数据库权威基线一致性调整：将已批准“数据源管理”规则（`CDC_DATA_SOURCE_EXTEND` 为源库到目标库的命名策略、源库 0..N、`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 逻辑联合唯一由后端保存前校验、第一版无 DDL、删除/改 ID 不级联不同步）同步至 `docs/database/**` 与项目级基线；本 Feature 需求、验收状态保持 `APPROVED`，实现状态保持 `NOT_STARTED`；§17/§18 更新为本次同步完成；不改变任何 DS-REQ 编号、文本或语义 | DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001（已批准业务规则向权威项目/数据库基线的纯文档同步；纯文档任务） |
| 2026-08-29 | R1 修订：§19 更新为“项目/数据库权威基线影响同步已完成（`DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001`），不再作为后续独立维护事项或开放问题”；MySQL/Doris JDBC 驱动、现有后端候选实现改造与前端占位页替换仍为后续阶段工作；§17/§18 保持正确、未无必要重写；不改变任何 DS-REQ 编号、文本或语义；文档状态保持 `APPROVED`、实现状态保持 `NOT_STARTED` | DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001-R1（ChatGPT 复审 CHANGES_REQUIRED 定向修订；纯文档任务） |
| 2026-08-30 | 验收后调整需求草案落盘：新增 `DS-REQ-110~115` 共 6 条（`DRAFT_PENDING_USER_REVIEW`，尚未获得用户正式批准、尚未实现、尚未执行）；§1 元数据对齐已执行正式验收事实（实现状态 `IMPLEMENTED_PENDING_REVIEW`、原正式验收状态 `FAIL`、原验收用例 `PASS=103/FAIL=2/BLOCKED=1/NOT_RUN=0`，实现未置 `IMPLEMENTED_ACCEPTED`）并增加基础基线/调整草案/当前实现/原正式验收分层状态；§3 明确为需求建立时的历史实施前差距快照；原 `DS-REQ-001~109` 编号与正文逐字保持、追踪行不变；文档状态保持 `APPROVED` | DATA-SOURCE-POST-ACCEPTANCE-ADJUSTMENT-BASELINE-001（正式验收后五项页面调整的需求草案；纯文档任务，未进入实现/测试/验收） |
| 2026-08-30 | R1 定向修订：ChatGPT 复审为 `CHANGES_REQUIRED`；只修订 §1 说明、§16 末尾、§18、§19 中把已完成的实现工作描述为未来工作、并错误声明“无开放问题”的过期当前状态叙述；`DS-REQ-001~115` 全部需求行未修改；`ACCEPTANCE.md`、`UI.md` 和原任务报告未修改；调整草案（`DS-REQ-110~115`/`DS-AC-107~115`）仍未批准 | DATA-SOURCE-POST-ACCEPTANCE-ADJUSTMENT-BASELINE-001-R1（ChatGPT 复审 CHANGES_REQUIRED 定向修订；纯文档任务） |

> 关联文档：验收基线 `docs/features/data-source-management/ACCEPTANCE.md`；执行报告 `docs/features/data-source-management/reports/DATA-SOURCE-REQUIREMENTS-BASELINE-001.md`；验收后调整草案执行报告 `docs/features/data-source-management/reports/DATA-SOURCE-POST-ACCEPTANCE-ADJUSTMENT-BASELINE-001.md`；验收后调整草案 R1 修订报告 `docs/features/data-source-management/reports/DATA-SOURCE-POST-ACCEPTANCE-ADJUSTMENT-BASELINE-001-R1.md`。
