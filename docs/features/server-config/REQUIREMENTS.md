# 中心端配置 Feature 需求基线（REQUIREMENTS）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 中心端配置 |
| Feature 标识 | `server-config` |
| 正式菜单 | 中心端配置（直接演进自既有“服务端配置”占位菜单，不新增第二套菜单） |
| 既有路由 | `/config/server`（保持不变，不另建重复路由） |
| 目标文档 | `docs/features/server-config/REQUIREMENTS.md` |
| 文档状态 | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（原批准需求基线仍有效；本次为负责人在正式验收前提出的两项候选调整——`CONFIG_DESC` 人工换行与按 `ID_SERVER_CONFIG ASC` 排序，待用户复审，见 §20 变更记录） |
| 实现状态 | `IMPLEMENTED_ADJUSTMENT_PENDING`（旧批准需求版本已实现并经过 R1/R2 复审；本次两项候选调整尚未实现） |
| 任务编号 | `SERVER-CONFIG-FEATURE-BASELINE-001` |
| 授权基线提交 | `7ea9d702e831245fbe8f0e84691bf0aea093dbdf` |
| 候选基线初始任务 | `SERVER-CONFIG-FEATURE-BASELINE-001` |
| 候选基线 R1 任务 | `SERVER-CONFIG-FEATURE-BASELINE-001-R1` |
| 批准任务 | `SERVER-CONFIG-FEATURE-BASELINE-APPROVAL-001` |
| 批准日期 | 2026-08-27 |
| 批准人 | 项目负责人 |
| ChatGPT 复审通过候选提交 | `4e55493a0292b462885e4dde0d789e5e1ca48df2` |
| 任务类型 | 纯文档 Feature 需求基线建立（后续经批准收口为正式需求基线） |
| 候选调整任务 | `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001` |
| 候选调整授权基线提交 | `c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba` |
| 创建日期 | 2026-08-27 |
| 需求来源 | 项目负责人逐项确认的业务需求（本提示词 §6 记录的 12 项负责人确认事实）+ 已批准数据库基线（`docs/database/`） |

说明：本文件把已经完成沟通并由项目负责人确认的业务需求落成 Feature 需求基线，已经 ChatGPT 复审通过，并由项目负责人正式批准（批准任务 `SERVER-CONFIG-FEATURE-BASELINE-APPROVAL-001`）。批准只代表“系统应该做什么、怎样验收”正式生效；不代表设计已完成、代码已实现或 65 条验收已经执行通过。本 Feature 旧批准版本已实现并经过 R1/R2 复审（实现审查基线 `24d8b80340cc691895bed8bc45a4cb2dc2c6b9b6`），只读联调交接完成（授权基线 `c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba`）。本次为负责人在正式验收前提出的两项候选调整（`CONFIG_DESC` 人工换行、按 `ID_SERVER_CONFIG ASC` 排序），文档状态为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`，两项调整尚未实现；正式验收（现 66 条）仍未执行。

## 2. Feature 定位与术语

### 2.1 Feature 定位

“中心端配置”面向 CDC 同步链路中的中心端（`sync-server`）提供配置项的查询与受控修改能力。管理平台只查询唯一中心端登记信息与全部配置项，并只允许修改既有配置记录中可编辑行的 `CONFIG_VALUE`；不提供中心端登记维护、配置项增删、历史版本或生效控制。

### 2.2 术语

| 术语 | 说明 |
|---|---|
| 中心端 | 实际描述独立进程 `sync-server`（负责人确认，`CONFIRMED_BY_OWNER`）。每个中心端在 `CDC_SERVER` 中对应唯一一条记录。 |
| `CDC_SERVER` | 中心端登记表。当前以及可见的将来只有一个中心端；当前开发库 1 行。由 `sync-server` 启动时插入，记录已存在时不重复插入；管理平台不新增、修改或删除其记录。 |
| `CDC_SERVER_CONFIG` | 中心端配置项表。当前开发库 8 行，全部归属唯一中心端。本 Feature 只查询并修改既有记录的 `CONFIG_VALUE`，禁止新增和删除。 |
| `CONFIG_KEY` | 配置项 key，技术标识：供 `sync-server`、前端控件匹配、后端白名单及专门校验使用的稳定标识。不可修改；不作为独立列表列，也不作为面向用户的主要名称；页面通过信息图标 Tooltip 提供按需技术追溯。 |
| `CONFIG_VALUE` | 配置项 value，本 Feature 唯一允许修改的字段。 |
| `IS_EDITABLE` | 数据库记录的“当前配置项是否可编辑”标记，规范值为字符 `'1'`（可编辑）或 `'0'`（只读）。本 Feature 展示中不单独显示该值。 |
| 配置项说明 | 对应 `CONFIG_DESC`，是页面主内容列的优先显示来源；`CONFIG_DESC` 缺失时按“配置项显示名称”兜底规则处理。 |
| 配置项显示名称 | 页面主内容列实际展示的名称：`CONFIG_DESC` 去除首尾空格后非空时显示说明内容，否则回退为 `CONFIG_KEY`；两者均为空或 NULL 时显示“未定义配置项”，该记录只读。 |
| 可编辑白名单 | 管理平台明确支持编辑、且已内置专门校验规则的 `CONFIG_KEY` 集合（见 §11）。 |
| 最近一次成功加载 | 页面保存的原始值来源；进入页面或保存成功后重新查询得到的值即“最近一次成功加载”。 |

## 3. 当前已实现事实与候选调整目标分层

本文档严格区分“当前已实现事实”“本次候选调整目标”与“已批准数据库基线”，不得混淆。

### 3.1 当前已实现事实（`IMPLEMENTED_REVIEWED`）

旧批准需求版本已实现并经过 R1/R2 复审（实现审查基线 `24d8b80340cc691895bed8bc45a4cb2dc2c6b9b6`，初始实现提交 `96aba1e93dd7f8d73d3882c2f757229bdb8fa6d0`），只读联调与视觉交接完成（授权基线 `c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba`）。当前仓库已存在正式的中心端配置实现：

- 前端路由 `frontend/src/router/index.ts`：路由 `/config/server`（name `ServerConfig`，title“中心端配置”，group“配置管理”）指向正式页面 `ServerConfigPage.vue`。
- 前端菜单 `frontend/src/config/menu.ts`：“配置管理”组下菜单项 `/config/server`，title“中心端配置”（已直接替换既有“服务端配置”占位菜单，不新增第二套菜单）。
- 前端页面 `frontend/src/views/server-config/ServerConfigPage.vue`：正式“中心端配置”页面（非占位页），实现两列表格、受控编辑、保存确认与状态处理。
- 后端 `com.bsoft.cdcconfig.serverconfig` 包：已存在 Entity（`CdcServer`、`CdcServerConfig`）、Mapper（`CdcServerMapper`、`CdcServerConfigMapper`）、Service、Controller、DTO/VO、Validator、Exception 等正式组件。
- 后端接口：`GET /api/server-config`（查询页面数据）与 `POST /api/server-config/save`（批量保存配置值）均已实现。
- 数据库访问：旧批准实现已查询 `CDC_SERVER` 识别唯一中心端、查询 `CDC_SERVER_CONFIG` 全部配置并批量更新既有记录的 `CONFIG_VALUE`。已批准数据库基线分层为：14 张当前生产代码实际访问表 + 2 张本 Feature 实现访问表 = 16 张已批准单表物理基线。
- 当前已实现版本仍采用旧排序 `CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC`；页面对普通长说明已能自动折行，但尚未显式保留 `CONFIG_DESC` 中的真实 LF/CRLF 换行。

### 3.2 本次候选调整目标（`ADJUSTMENT_TARGET`）

本次仅有两项候选调整尚未实现，均为本文档中标注为候选的规则：

- 配置项说明按 `CONFIG_DESC` 中的真实 LF/CRLF 换行按换行位置显示（`SC-UI-23~26`，目标样式语义 `white-space: pre-line` 等）；
- 配置列表查询排序由旧顺序改为 `ORDER BY ID_SERVER_CONFIG ASC`（`SC-UI-04`、`SC-DISPLAY-02`）。

除上述两项外，旧批准版本的其他页面与交互规则均已实现；不得把候选调整目标写成已实现。

### 3.3 分层约定

- 旧批准版本（正式页面、两个接口、两表访问及全部已批准规则）属于 `IMPLEMENTED_REVIEWED`（已实现并复审）；
- 本次两项候选调整属于 `ADJUSTMENT_TARGET`（已写入候选基线、尚未实现）；
- 开发库当前数据快照（1 行中心端、8 行配置、`IS_EDITABLE` 分布等）属于 `OBSERVED_DATABASE`，不得写成生产常态，也不得写成数据库强制约束。

## 4. 数据来源与已批准数据库基线引用

本 Feature 涉及的两张表的物理结构、字段类型、长度、可空性、约束、当前行数与数据分布均引用已批准数据库基线，本任务不重新查询数据库。

| 引用项 | 权威文档 |
|---|---|
| 数据库文档总入口与 16 张已批准单表物理基线分层（14 当前访问 + 2 已批准待实现） | `docs/database/README.md` |
| Schema 整体概览、表总清单、物理外键总体情况 | `docs/database/SCHEMA.md` |
| 跨表关系（`CDC_SERVER_CONFIG.SERVER_ID` → `CDC_SERVER.SERVER_ID` 逻辑一对多 R16，无物理外键） | `docs/database/RELATIONS.md` |
| `CDC_SERVER` 单表物理基线 | `docs/database/tables/CDC_SERVER.md` |
| `CDC_SERVER_CONFIG` 单表物理基线 | `docs/database/tables/CDC_SERVER_CONFIG.md` |
| 两表基线批准收口报告 | `docs/database/reports/DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001.md` |

引用事实摘要（均来自已批准数据库基线，`OBSERVED_DATABASE`）：

- `CDC_SERVER`：主键 `SERVER_ID`（VARCHAR2(32)）；当前开发库 1 行；数据库无“单中心端”约束。
- `CDC_SERVER_CONFIG`：主键 `ID_SERVER_CONFIG`（VARCHAR2(32)）；`SERVER_ID`（VARCHAR2(32)，可空）；`CONFIG_DESC`（VARCHAR2(1024)，可空）；`CONFIG_KEY`（VARCHAR2(64)，可空）；`CONFIG_VALUE`（VARCHAR2(64)，可空）；`IS_EDITABLE`（CHAR(1)，可空，默认值 `1`）。
- `IS_EDITABLE` 无数据库 Check 约束；当前数据分布为 `1` 六条、`0` 两条。
- `(SERVER_ID, CONFIG_KEY)` 无数据库唯一约束；当前数据无重复。
- 当前 8 条配置全部归属唯一中心端，无空 `SERVER_ID`、无孤立引用、无重复 key。
- 两表间为逻辑一对多关系，无物理外键；16 张已批准表范围内均不设置物理外键（项目确认的架构决策）。

本 Feature 的校验规则（`IS_EDITABLE` 规范值、可编辑白名单、值域校验、非空与物理长度）均属应用层规则（旧批准版本已实现，属 `IMPLEMENTED_REVIEWED`），仍不得写成数据库已有约束。

## 5. 功能范围（范围内/范围外）

### 5.1 范围内

- 唯一中心端识别与异常判断；
- 查询唯一中心端的全部 `CDC_SERVER_CONFIG` 记录；
- 页面展示全部配置，包括不可编辑、未知或异常配置项；
- 对支持编辑且数据库标记允许编辑的配置项提供专用编辑控件；
- 多项修改后统一确认并批量保存；
- 前后端专门校验；
- 事务性批量更新；
- 保存成功重新加载；
- 保存失败整批回滚并保留页面编辑值。

### 5.2 范围外

- `CDC_SERVER` 独立页面或任何维护操作；
- 新增、复制、删除 `CDC_SERVER_CONFIG`；
- 修改 `CONFIG_KEY`、`CONFIG_DESC`、`SERVER_ID`、`ID_SERVER_CONFIG`、`IS_EDITABLE`；
- 数据库 DDL、索引、外键、唯一约束、Check 约束或数据清理；
- `sync-server` 启停、重启、生效通知、生效检测；
- 配置历史版本、审计日志、回滚历史；
- 权限系统新增；
- 并发控制、乐观锁、版本号或旧值条件更新；
- 搜索、筛选、分页、导入、导出、自动刷新；
- 对未知配置项提供通用文本编辑能力。

## 6. 角色与主要使用场景

| 角色 | 说明 |
|---|---|
| CDC 运维/开发人员 | 通过“中心端配置”页面查看唯一中心端全部配置项，修改受支持且数据库允许编辑的配置值，并批量保存。 |

主要使用场景：

1. 进入页面查看唯一中心端标识与全部配置项；
2. 对支持编辑的配置项修改一个或多个值；
3. 校验通过后确认变更并批量保存；
4. 保存成功后查看最新配置；保存失败时保留编辑内容重试；
5. 配置修改后，`sync-server` 必须由外部方式重启才会生效（重启与生效控制不属于本 Feature）。

## 7. 菜单、路由、页面结构与字段显示规则

### 7.1 菜单和路由

| 编号 | 需求 |
|---|---|
| SC-MENU-01 | 菜单显示名称改为“中心端配置”。 |
| SC-MENU-02 | 直接替换现有“服务端配置”占位功能，不新增第二套菜单。 |
| SC-MENU-03 | 路由保持 `/config/server`；不得另建重复路由。 |
| SC-MENU-04 | 旧批准版本已实现并复审（`IMPLEMENTED_REVIEWED`），本次候选调整目标（`ADJUSTMENT_TARGET`）尚未实现；文档与实现不得把候选目标写成已实现。 |

### 7.2 页面结构

| 编号 | 需求 |
|---|---|
| SC-UI-01 | 页面顶部展示唯一中心端的 `SERVER_ID` 和配置项总数。 |
| SC-UI-02 | 不提供中心端下拉框或切换器。 |
| SC-UI-03 | 一次加载并展示该中心端全部配置，不分页、不搜索、不筛选。 |
| SC-UI-04 | 配置列表按数据库 `ID_SERVER_CONFIG` 升序展示（字符串排序语义，不做数值转换）；不再按 `CONFIG_KEY` 排序，`CONFIG_KEY` 仍是 Key Tooltip、白名单与编辑控件匹配所需的技术标识。 |
| SC-UI-05 | 列表主体只展示两列：配置项说明、配置值。不得出现 `CONFIG_KEY` 独立表头或独立列。 |
| SC-UI-06 | 不展示 `ID_SERVER_CONFIG`、`SERVER_ID` 列。 |
| SC-UI-07 | 不展示“是否可编辑”字段或状态列，也不单独展示 `IS_EDITABLE` 值。 |
| SC-UI-08 | 可编辑性只通过控件体现：满足编辑条件时显示对应编辑控件，否则显示只读配置值。 |
| SC-UI-09 | 所有值完整展示，不脱敏。 |

### 7.3 页面主体列布局（配置项说明 + 配置值）

| 编号 | 需求 |
|---|---|
| SC-UI-10 | 页面主体为两列：配置项说明、配置值。配置项说明为主内容列，占据最大可用宽度，允许自然换行和多行完整展示；配置值列相对紧凑，但必须满足只读值查看和专用编辑控件操作。 |
| SC-UI-11 | 配置项说明允许多行完整展示：普通过长文本根据列宽自动折行，不应因固定窄列造成大段内容省略；数据库真实换行的显示见 §7.6。 |
| SC-UI-12 | 只读配置值偶尔超出列宽时可以使用省略显示，但悬停必须展示完整原文；这不属于脱敏。 |
| SC-UI-13 | 配置值处于编辑状态时，编辑控件应充分使用配置值列的可用宽度，不得因列宽过窄导致枚举说明、多选值或数字难以操作。 |
| SC-UI-14 | 页面在项目支持的常规桌面宽度下应优先保证配置项说明的可读性；具体像素值由后续 UI/实现阶段依据现有布局确定，本需求不锁死像素。 |

### 7.4 配置Key的按需查看（信息图标 Tooltip）

| 编号 | 需求 |
|---|---|
| SC-UI-15 | 每个配置项说明旁提供轻量信息图标；悬停信息图标显示 `配置Key：{CONFIG_KEY}`。 |
| SC-UI-16 | Key Tooltip 完整显示、不截断、不脱敏；信息图标不得制造独立 Key 列，也不得挤占配置项说明的主要空间。 |
| SC-UI-17 | 未知或异常 Key 同样通过该信息图标提供技术追溯。 |

### 7.5 配置项显示名称兜底

| 编号 | 需求 |
|---|---|
| SC-UI-18 | `CONFIG_DESC` 非 NULL 且去除首尾空格后非空：显示原有说明内容。 |
| SC-UI-19 | `CONFIG_DESC` 为 NULL、空字符串或纯空格：使用 `CONFIG_KEY` 作为显示名称。 |
| SC-UI-20 | `CONFIG_DESC` 和 `CONFIG_KEY` 均为空或 NULL：显示“未定义配置项”；该记录只读，不允许保存。 |
| SC-UI-21 | 兜底只影响显示，不修改数据库的 `CONFIG_DESC` 或 `CONFIG_KEY`。 |
| SC-UI-22 | 配置说明正常存在时，页面不应把英文 Key 直接作为主内容持续展示。 |

### 7.6 配置项说明的人工换行与安全文本渲染

| 编号 | 需求 |
|---|---|
| SC-UI-23 | “配置项说明”必须同时支持两种多行行为：普通过长文本按列宽自动折行；`CONFIG_DESC` 中真实的 LF 或 CRLF 换行按换行位置显示（目标 CSS 语义 `white-space: pre-line`）。 |
| SC-UI-24 | 真实换行来自数据库 `CONFIG_DESC` 中的实际换行字符（如 Oracle `CHR(10)`），不是两个字符组成的字面量 `\n`；不把 `<br>` 当作换行协议（若数据中存在 `<br>` 则作为普通文本显示）；不把字面量 `\n` 自动转换为换行。 |
| SC-UI-25 | 前端继续使用 Vue 文本插值/文本渲染，保持 HTML 转义；严禁为换行使用 `v-html`。`CONFIG_DESC` 为只读字段，本 Feature 不允许页面修改它。 |
| SC-UI-26 | 换行后的行高应易读（建议 `line-height: 1.6`）；极长且没有空格的连续内容仍可断行（建议 `overflow-wrap: anywhere`）；信息图标/Key Tooltip 在多行说明下合理对齐，不得破坏布局。 |

## 8. 唯一中心端识别与异常行为

| 编号 | 需求 |
|---|---|
| SC-SERVER-01 | 本 Feature 基于“唯一中心端”模型：当前以及可见的将来只有一个中心端（`CONFIRMED_BY_OWNER`）。页面与后端均以此为准，不提供中心端选择能力。 |
| SC-SERVER-02 | `CDC_SERVER` 恰好一条：正常加载该中心端配置。 |
| SC-SERVER-03 | `CDC_SERVER` 为零条：显示“中心端尚未注册，请先启动 sync-server”，不加载配置，不允许编辑或保存。 |
| SC-SERVER-04 | `CDC_SERVER` 超过一条：视为数据异常，提示“检测到多个中心端，当前功能仅支持唯一中心端”，不允许编辑或保存；不得自行选择第一条。 |
| SC-SERVER-05 | 唯一中心端存在但没有配置记录：显示空状态，不提供新增入口，“保存全部”不可用。 |
| SC-SERVER-06 | 中心端数量或归属异常时，后端不得提供任何写入口；页面不得发起任何批量保存请求。 |

## 9. 全部配置展示规则

| 编号 | 需求 |
|---|---|
| SC-DISPLAY-01 | 页面展示唯一中心端的全部 `CDC_SERVER_CONFIG` 记录，包括不可编辑、未知或异常配置项。 |
| SC-DISPLAY-02 | 展示顺序为 `ID_SERVER_CONFIG` 升序（字符串排序语义，不做数值转换），属稳定排序；不再按 `CONFIG_KEY` 排序。对于 NULL 或重复 Key，只需保持确定性稳定次序并展示全部记录，不发明数据库唯一约束，不执行数据清理；不得把当前无重复快照写成永久保证。 |
| SC-DISPLAY-03 | 每条记录主体展示两列：配置项说明、配置值；不出现 `CONFIG_KEY` 独立列。 |
| SC-DISPLAY-04 | 可编辑性只由两个条件决定：数据库记录 `IS_EDITABLE` 的规范值为字符 `'1'` 且 `CONFIG_KEY` 属于已支持可编辑白名单。当前值为空、空白、大小写错误、枚举非法、超范围或其他不符合专门规则的情况，不自动取消该记录的编辑能力。 |
| SC-DISPLAY-05 | 展示全部值不脱敏、不掩码；`CONFIG_VALUE` 当前不包含敏感内容（`CONFIRMED_BY_OWNER`），但展示规则不依赖“当前无敏感内容”作为唯一依据。 |
| SC-DISPLAY-06 | 当前值异常时，页面仍显示对应专用控件，并以明确的异常/校验状态提示当前值无效；用户可以把异常当前值修改为合法值。 |
| SC-DISPLAY-07 | 异常当前值修正前，前端校验不通过，“保存全部”不得提交包含非法值的批次；后端收到非法新值仍整批拒绝。 |
| SC-DISPLAY-08 | `IS_EDITABLE` 不为 `'1'` 或 Key 不受支持时仍保持只读，即使当前值异常也不能编辑。 |

## 10. 可编辑性双重判定与未知Key兼容策略

| 编号 | 需求 |
|---|---|
| SC-EDIT-01 | 配置项必须同时满足以下两个条件才能编辑：① 数据库记录 `IS_EDITABLE` 的规范值为字符 `'1'`；② `CONFIG_KEY` 位于管理平台明确支持的可编辑白名单，且已内置专门校验规则。 |
| SC-EDIT-02 | 以下情况一律只读：`IS_EDITABLE` 为 `'0'`；`IS_EDITABLE` 为 NULL、空白或任何非 `'1'` 异常值；未知 `CONFIG_KEY`；已知但尚未内置编辑控件和校验规则的 `CONFIG_KEY`。 |
| SC-EDIT-03 | 未来很可能新增 `CONFIG_KEY`。未知配置项必须继续展示，但即使 `IS_EDITABLE='1'` 也禁止编辑；只有前后端同步增加白名单、控件和专门校验规则后才能开放修改。 |
| SC-EDIT-04 | 可编辑白名单与校验规则必须前后端一致维护；仅前端有控件而缺少后端规则不构成可编辑。 |
| SC-EDIT-05 | 前端限制不是安全边界。后端收到批量更新请求后，必须重新读取目标记录并重新校验记录存在性、中心端归属、`IS_EDITABLE='1'`、配置Key白名单及对应值规则。任何一项失败，整批拒绝。 |

## 11. 六类已支持可编辑配置：控件与校验规则

以下六个 `CONFIG_KEY` 为当前可编辑白名单，均满足 `IS_EDITABLE='1'`（已批准数据库基线数据分布），并已内置专门校验规则。专门规则与通用规则（§11.7）必须同时满足。

### 11.1 布尔配置（`auto-create-table`、`auto-expand-column-length`）

| 编号 | 需求 |
|---|---|
| SC-CFG-BOOL-01 | 使用下拉框，只允许精确的小写字符串 `true`、`false`。 |
| SC-CFG-BOOL-02 | 禁止 `TRUE`、`False`、`1`、`0`、空值和其他变体。 |
| SC-CFG-BOOL-03 | 保存值规范化为小写 `true` 或 `false`。 |
| SC-CFG-BOOL-04 | 上述两条均适用 `auto-create-table` 与 `auto-expand-column-length`。 |

### 11.2 原始消息存储策略（`raw-message-storage-strategy`）

| 编号 | 需求 |
|---|---|
| SC-CFG-RMSS-01 | 使用单选下拉框，只允许以下大写枚举：`NONE`（不存储原始消息）、`PLAIN`（不压缩，直接插入原始文本）、`COMPRESS`（压缩后插入，推荐，节省存储空间）。 |
| SC-CFG-RMSS-02 | 保存值必须为以上精确大写字符串；小写、混合大小写、空值或其他值一律拒绝。 |

### 11.3 实时批量插入数据库类型（`realtime-insert-batch-enabled-database-types`）

| 编号 | 需求 |
|---|---|
| SC-CFG-DBTYPE-01 | 使用多选控件，可选值固定为 `doris`、`oracle`、`mysql`。 |
| SC-CFG-DBTYPE-02 | 至少选择一种。 |
| SC-CFG-DBTYPE-03 | 允许多选。 |
| SC-CFG-DBTYPE-04 | 输入Token去除首尾空格。 |
| SC-CFG-DBTYPE-05 | 统一转为小写。 |
| SC-CFG-DBTYPE-06 | 自动去重。 |
| SC-CFG-DBTYPE-07 | 拒绝白名单外数据库类型。 |
| SC-CFG-DBTYPE-08 | 保存时使用英文逗号连接，不包含空格。 |
| SC-CFG-DBTYPE-09 | 保存顺序固定为 `doris,oracle,mysql` 的子序列，避免仅因选择顺序不同产生伪修改。示例：选择 MySQL 和 Doris，最终保存为 `doris,mysql`。 |

### 11.4 快照批次大小（`snapshotBatchSize`）

| 编号 | 需求 |
|---|---|
| SC-CFG-SNAPSHOT-01 | 使用整数输入控件，只允许十进制整数。 |
| SC-CFG-SNAPSHOT-02 | 最小值 `100`、最大值 `10000`（含端点）。 |
| SC-CFG-SNAPSHOT-03 | 禁止小数、科学计数法、正负号、空值和非数字字符。 |
| SC-CFG-SNAPSHOT-04 | 保存为无多余空格、无前导零的标准十进制字符串。 |

### 11.5 源表删除策略（`tableRowDeleteStrategy`）

| 编号 | 需求 |
|---|---|
| SC-CFG-DELSTRAT-01 | 使用单选下拉框，只允许以下大写枚举：`DELETE`（源表删除数据，目标表也删除数据）、`DELETE_FLAG`（源表删除数据，目标表不删除数据，只更新删除标志位）。 |
| SC-CFG-DELSTRAT-02 | 保存值必须为以上精确大写字符串；小写、混合大小写、空值或其他值一律拒绝。 |

### 11.6 当前只读配置

当前以下配置项没有获得编辑规则，保持只读：`monitor-metric-topic-name`、`server-log-topic-name`（详见 §12）。

### 11.7 通用非空与物理长度

| 编号 | 需求 |
|---|---|
| SC-CFG-GEN-01 | 所有提交的 `CONFIG_VALUE` 均不能为空、NULL 或仅包含空白字符；校验应基于去除首尾空格后的值。 |
| SC-CFG-GEN-02 | 保存值必须满足数据库物理长度 `VARCHAR2(64)`；不得依赖数据库截断或异常作为正常校验方式。物理长度是所有当前及未来可编辑配置的通用上限，但不是放宽专门值域的理由；不存在“只要长度不超过 64 就一定合法”的规则。 |
| SC-CFG-GEN-03 | 专门规则与通用规则必须同时满足；任一不满足即整条记录校验失败。 |
| SC-CFG-GEN-04 | 当前六个可编辑配置均有布尔、枚举、多选或整数专门值域；专门规则可能在达到 64 字符前已经拒绝输入，物理长度规则不得替代专门规则。 |

## 12. 当前只读配置

| 编号 | 需求 |
|---|---|
| SC-READONLY-01 | 以下当前配置项没有获得编辑规则，保持只读：`monitor-metric-topic-name`、`server-log-topic-name`。 |
| SC-READONLY-02 | 即使未来数据库把它们的 `IS_EDITABLE` 改为 `'1'`，在前后端正式增加专门规则前仍应只读。 |
| SC-READONLY-03 | 只读配置同样完整展示 `CONFIG_VALUE`，不脱敏；超出列宽时按 §7.3 省略展示并支持悬停查看原文。 |

## 13. 编辑、撤销与脏值判断

| 编号 | 需求 |
|---|---|
| SC-DIRTY-01 | 用户可以连续编辑多条支持配置。 |
| SC-DIRTY-02 | 页面保存一份“最近一次成功加载”的原始值，用于判断哪些配置发生实际变化及用于确认弹窗展示。 |
| SC-DIRTY-03 | 多选值先规范化，再与原值按相同规范化规则比较；仅选择顺序不同不得产生修改。 |
| SC-DIRTY-04 | 没有实际修改时，“保存全部”和“撤销修改”不可用。 |
| SC-DIRTY-05 | “撤销修改”将所有编辑控件恢复到最近一次成功加载的值，不发请求、不修改数据库。 |
| SC-DIRTY-06 | 不自动刷新，避免覆盖用户尚未保存的页面编辑。 |

## 14. 保存确认框

| 编号 | 需求 |
|---|---|
| SC-CONFIRM-01 | 点击“保存全部”后，先完成前端全部校验。校验通过才弹出确认框。 |
| SC-CONFIRM-02 | 确认框只列实际发生变化的配置，逐项主要展示：配置项显示名称、原值、新值。不把 `CONFIG_KEY` 作为醒目字段或独立列；为技术追溯，可在配置项显示名称旁使用同样的轻量信息图标，悬停显示完整 Key。配置项显示名称因 `CONFIG_DESC` 缺失而回退为 Key 时，不必重复显示第二份 Key。 |
| SC-CONFIRM-03 | 用户取消确认时不发请求并保留编辑内容。 |
| SC-CONFIRM-04 | 用户确认后提交一次批量保存请求。 |

## 15. 后端防绕过、事务与无并发保护的更新语义

| 编号 | 需求 |
|---|---|
| SC-BATCH-01 | 批量保存请求只接受既有记录主键和新 `CONFIG_VALUE`；不得接受客户端修改其他字段。 |
| SC-BATCH-02 | 后端依据主键重新读取真实记录，不信任客户端提交的 `CONFIG_KEY`、`SERVER_ID` 或 `IS_EDITABLE`。 |
| SC-BATCH-03 | 后端重新执行 §10 与 §11 的全部校验。 |
| SC-BATCH-04 | 只允许更新唯一中心端所属的目标记录。 |
| SC-BATCH-05 | 所有更新置于一个数据库事务中。 |
| SC-BATCH-06 | 任一记录不存在、归属错误、不可编辑、Key不受支持、值校验失败或更新失败，整批回滚；禁止部分成功。 |
| SC-BATCH-07 | 本 Feature 不做并发保护，不使用旧值、版本号或更新时间作为更新条件。确认框原值仅用于用户确认，不参与数据库并发比较。 |
| SC-BATCH-08 | 因不做并发保护，保存时以本次合法提交值覆盖数据库当时值，即“最后一次成功保存生效”。 |

## 16. 成功、失败与空状态

| 编号 | 需求 |
|---|---|
| SC-STATE-01 | 保存成功：给出成功反馈，并重新查询唯一中心端及全部配置；重新加载结果成为新的原始值。 |
| SC-STATE-02 | 保存失败：给出明确但不泄露底层敏感堆栈的错误信息；数据库整批回滚；页面保留用户编辑内容，便于修改或重试。 |
| SC-STATE-03 | 加载中、保存中应有清晰的进行中反馈；保存成功后不再保留确认框。 |
| SC-STATE-04 | 不在保存成功后触发、调用或提示执行 `sync-server` 重启，也不判断配置是否已被 `sync-server` 加载。 |

## 17. 非功能边界与安全约束

| 编号 | 需求 |
|---|---|
| SC-NFR-01 | 前端校验不是安全边界；后端必须独立重新校验（见 §10、§15）。 |
| SC-NFR-02 | 保存失败的错误信息不得向用户泄露底层敏感堆栈。 |
| SC-NFR-03 | `CONFIG_VALUE` 完整展示、不脱敏、不掩码；当前无敏感内容（`CONFIRMED_BY_OWNER`）。 |
| SC-NFR-04 | 本 Feature 不做并发控制、不做乐观锁、不做版本号或旧值条件更新（见 §15）。 |
| SC-NFR-05 | 本 Feature 不执行任何数据库 DDL，不新增索引、约束或物理外键。 |
| SC-NFR-06 | 本 Feature 不提供 `sync-server` 启停、重启、生效通知或生效检测能力。 |
| SC-NFR-07 | 本 Feature 不改动 `CDC_SERVER` 记录，不新增、删除 `CDC_SERVER_CONFIG` 记录，不改动 `CONFIG_KEY`、`CONFIG_DESC`、`SERVER_ID`、`ID_SERVER_CONFIG`、`IS_EDITABLE`。 |
| SC-NFR-08 | 数据量规模：当前配置项为小表（当前开发库 8 行），页面一次加载全部配置，不设分页、筛选与搜索；性能按全量展示设计。 |

## 18. 明确的非目标

| 编号 | 非目标 |
|---|---|
| SC-NONGOAL-01 | `CDC_SERVER` 独立页面或任何维护操作。 |
| SC-NONGOAL-02 | 新增、复制、删除 `CDC_SERVER_CONFIG`。 |
| SC-NONGOAL-03 | 修改 `CONFIG_KEY`、`CONFIG_DESC`、`SERVER_ID`、`ID_SERVER_CONFIG`、`IS_EDITABLE`。 |
| SC-NONGOAL-04 | 数据库 DDL、索引、外键、唯一约束、Check 约束或数据清理。 |
| SC-NONGOAL-05 | `sync-server` 启停、重启、生效通知、生效检测。 |
| SC-NONGOAL-06 | 配置历史版本、审计日志、回滚历史。 |
| SC-NONGOAL-07 | 权限系统新增。 |
| SC-NONGOAL-08 | 并发控制、乐观锁、版本号或旧值条件更新。 |
| SC-NONGOAL-09 | 搜索、筛选、分页、导入、导出、自动刷新。 |
| SC-NONGOAL-10 | 对未知配置项提供通用文本编辑能力。 |

## 19. 当前待确认项（应为 0）

| 编号 | 当前待确认项 |
|---|---|
| SC-PENDING-01 | 无。当前 `PENDING_USER_CONFIRMATION` 数量为 0。 |

说明：已批准数据库基线中属于未来边界的前瞻说明（如未来出现多中心端、未来新增配置 key、`IS_EDITABLE` 合法值全集等，见 `docs/database/tables/CDC_SERVER.md` §10 与 `CDC_SERVER_CONFIG.md` §11）不构成本基线的当前待确认项；本 Feature 在当前唯一中心端前提下按本文档规则运行，未来边界变化时需经独立需求确认。

## 20. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-27 | 建立“中心端配置”Feature 需求基线（DRAFT_PENDING_USER_REVIEW） | SERVER-CONFIG-FEATURE-BASELINE-001（纯文档任务；负责人确认业务需求 + 已批准数据库基线） |
| 2026-08-27 | R1 修订：隐藏 Key 独立列并改为信息图标 Tooltip；页面主体改为“配置项说明 + 配置值”两列；配置项显示名称兜底；异常当前值允许纠正；物理长度验收口径修正 | SERVER-CONFIG-FEATURE-BASELINE-001-R1（ChatGPT 复审“有条件通过” + 项目负责人确认；纯文档修订，状态保持 DRAFT_PENDING_USER_REVIEW） |
| 2026-08-27 | 批准：文档状态由 `DRAFT_PENDING_USER_REVIEW` 改为 `APPROVED`；记录批准任务、批准日期、批准人（项目负责人）与 ChatGPT 复审通过的候选提交 `4e55493a...`；移除“不得自行批准”“候选基线待批准”等失效警示（初始草案状态保留于本变更记录）；实现状态保持 `NOT_STARTED`，当前待确认项保持 0，所有现行业务规则不变 | SERVER-CONFIG-FEATURE-BASELINE-APPROVAL-001（项目负责人批准驱动的 Feature 需求与验收基线收口；纯文档任务，不连接数据库，不修改代码） |
| 2026-08-28 | 候选调整（预验收）：将配置列表排序由 `CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC` 改为仅 `ID_SERVER_CONFIG ASC`（SC-UI-04、SC-DISPLAY-02）；新增 `CONFIG_DESC` 人工换行与安全文本渲染规则 SC-UI-23~26；文档状态由 `APPROVED` 迁移为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`，实现状态由 `NOT_STARTED` 迁移为 `IMPLEMENTED_ADJUSTMENT_PENDING`（旧批准版本已实现并复审，两项调整尚未实现）；正式验收仍未执行 | SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001（纯文档候选基线任务；负责人在正式验收前提出的调整，待用户复审） |
| 2026-08-28 | R1 实现事实修正：§3 由“当前代码事实与未来目标分层”改写为“当前已实现事实与候选调整目标分层”，删除“菜单仍为服务端配置”“页面仍为 PlaceholderPage”“无后端接口/数据库访问”“全部读写路径未实现”等实现前旧事实；明确旧批准版本已实现（`IMPLEMENTED_REVIEWED`），本次仅两项候选调整未实现（`ADJUSTMENT_TARGET`）；SC-MENU-04 分层约定同步更新；业务规则、配置校验、接口路径与 66 条验收口径不变 | SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001-R1（ChatGPT 远程复审发现跨文档实现前旧事实；纯文档 R1 精确修正，待用户复审） |

> 关联文档：验收基线 `docs/features/server-config/ACCEPTANCE.md`；执行报告 `docs/features/server-config/reports/SERVER-CONFIG-FEATURE-BASELINE-001.md`。
