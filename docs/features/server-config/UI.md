# 中心端配置 UI 详细设计（UI）

## 1. 文档元数据与状态

| 项目 | 值 |
|---|---|
| 正式功能标识 | `server-config` |
| 目标文档 | `docs/features/server-config/UI.md` |
| 文档状态 | `APPROVED` |
| 需求基线状态 | `APPROVED`（原已批准，本次调整已批准） |
| 验收基线状态 | `APPROVED`（原已批准，本次调整已批准） |
| 实现状态 | `IMPLEMENTED_ACCEPTED`（旧批准设计与本次两项已批准调整均已实现并验收接受，见 §20 变更记录） |
| 验收用例状态/正式验收状态 | `66 PASSED / 0 FAILED（ACCEPTED）` |
| 收口任务 | `SERVER-CONFIG-FORMAL-ACCEPTANCE-CLOSEOUT-001` |
| 收口日期 | 2026-08-29 |
| 验收证据提交 | `b5aeec28eaf29e20a56dd7012e4077dee8b891a4` |
| 项目负责人最终人工测试 | 保存、刷新、恢复均正常 |
| PENDING_USER_CONFIRMATION | 0 |
| 设计任务 | `SERVER-CONFIG-DESIGN-BASELINE-001` |
| 授权基线提交 | `c1a6d7dc38de261093383d7abf719f0834dd9bb3` |
| R1 修订任务 | `SERVER-CONFIG-DESIGN-BASELINE-001-R1` |
| R1 授权基线提交 | `53d74c19e31c4068963e7b3c50c12073e9ebad8f` |
| 批准任务 | `SERVER-CONFIG-DESIGN-BASELINE-APPROVAL-001` |
| 批准日期 | 2026-08-27 |
| 批准人 | 项目负责人 |
| ChatGPT 复审通过提交 | `77a8c639911bee78a17f62d2ce8af2db53c44d29` |
| 依据需求 | `docs/features/server-config/REQUIREMENTS.md`（已批准） |
| 关联契约 | `docs/features/server-config/DESIGN.md`、`API.md`、`DATABASE.md`（同一状态模型、控件规则与错误码） |
| 创建日期 | 2026-08-27 |
| 候选调整任务 | `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001` |
| 候选调整授权基线提交 | `c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba` |
| 候选调整批准任务 | `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001` |
| 候选调整批准日期 | 2026-08-28 |
| 候选调整批准人 | 项目负责人 |
| ChatGPT 最终复审通过提交 | `b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee` |

声明：本文档原为**已批准 UI 详细设计**，由项目负责人于 2026-08-27 正式批准（`SERVER-CONFIG-DESIGN-BASELINE-APPROVAL-001`），ChatGPT 复审通过提交为 `77a8c639911bee78a17f62d2ce8af2db53c44d29`。旧批准设计已实现并经过 R1/R2 复审。本次为负责人在正式验收前提出的两项候选调整（`CONFIG_DESC` 人工换行显示、保持后端 `ID_SERVER_CONFIG ASC` 顺序且不二次排序），已获项目负责人批准（批准任务 `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001`，批准日期 2026-08-28，ChatGPT 最终复审通过提交 `b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee`）。当前有效状态：文档状态为 `APPROVED`，实现状态为 `IMPLEMENTED_ACCEPTED`（旧批准设计、两项已批准调整及后续显示缺陷修复均已实现并验收接受），正式验收 `66 PASSED / 0 FAILED / 0 BLOCKED / 0 NOT_RUN`，正式验收状态 `ACCEPTED`（2026-08-29 收口，收口任务 `SERVER-CONFIG-FORMAL-ACCEPTANCE-CLOSEOUT-001`）。设计批准不代表代码已实现，不代表验收已执行，但本 Feature 已完成正式验收收口。本文只描述本 Feature 页面；不引入搜索、分页、卡片大屏风格、Tab、抽屉、中心端选择器或独立详情页（`SC-NONGOAL-01~10`）。

## 2. 设计依据

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-001 | 页面全部交互规则以已批准 `REQUIREMENTS.md`（`SC-MENU-*`、`SC-UI-*`、`SC-SERVER-*`、`SC-DISPLAY-*`、`SC-EDIT-*`、`SC-CFG-*`、`SC-READONLY-*`、`SC-DIRTY-*`、`SC-CONFIRM-*`、`SC-STATE-*`）为唯一来源。 |
| SC-UI-DESIGN-002 | 页面状态机与查询/保存流程见 `DESIGN.md` `SC-DESIGN-040~046`、`SC-DESIGN-050~067`；接口契约见 `API.md`。 |

## 3. 页面入口、菜单和路由事实

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-003 | 菜单显示名称当前已是“中心端配置”，已直接替换既有“服务端配置”占位菜单，不新增第二套菜单（`SC-MENU-01/02`）；`frontend/src/config/menu.ts` 菜单项 `/config/server` title 为“中心端配置”，`frontend/src/router/index.ts` 路由 meta title 亦为“中心端配置”（`IMPLEMENTED_REVIEWED`）。 |
| SC-UI-DESIGN-004 | 路由复用 `/config/server`（name `ServerConfig`，group“配置管理”），不新建重复路由（`SC-MENU-03`）。 |
| SC-UI-DESIGN-005 | `views/server-config/ServerConfigPage.vue` 当前已为正式“中心端配置”页面（非占位页 `PlaceholderPage`），已实现两列表格、编辑控件、保存确认与状态处理（`IMPLEMENTED_REVIEWED`）；页面路由已指向该正式组件。 |
| SC-UI-DESIGN-006 | 当前 UI 已实现旧批准设计与本次两项已批准调整并验收接受：两列表格（配置项说明 + 配置值）、编辑控件、保存确认与状态处理；页面对普通长说明按列宽自动折行，并已显式保留 `CONFIG_DESC` 真实 LF/CRLF 换行（`white-space: pre-line` 语义已实现，见 `SC-UI-DESIGN-035~038`）；列表展示顺序保持后端 `ORDER BY ID_SERVER_CONFIG ASC` 返回结果，前端不二次排序（`SC-UI-DESIGN-045`）；超宽只读值单行省略并悬停展示完整原文；信息图标悬停显示 `配置Key：{CONFIG_KEY}` Tooltip。以上均经正式验收 `66/0` 通过。 |

## 4. 页面整体布局与 Element Plus 组件建议

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-010 | 页面使用 Element Plus（项目既有 UI 库）构建，采用**单一确定布局**：外层一个 `el-card`，内部顶部信息区 + 主体两列 `el-table` + 表格下方操作区。 |
| SC-UI-DESIGN-011 | 顶部信息区：`SERVER_ID` 与“配置项总数”并列展示；无中心端选择器（`SC-UI-01/02`）。 |
| SC-UI-DESIGN-012 | 主体使用单一 `el-table`，**恰好两列**：列 1“配置项说明”（弹性主内容列）、列 2“配置值”（操作列）；每行 = 配置项说明 + 配置值。 |
| SC-UI-DESIGN-013 | 底部操作区：位于表格下方、**右对齐、非 sticky**，放置“保存全部”“撤销修改”按钮；按状态启禁（§11）。 |
| SC-UI-DESIGN-014 | 保存确认弹窗使用 `el-dialog`；Key Tooltip 与超宽值 Tooltip 使用 `el-tooltip`；异常当前值提示使用 `el-form-item` 错误文案/`el-alert` 行内提示。 |

## 5. 顶部信息区、两列表格、操作区、确认弹窗的结构

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-015 | 顶部信息区：显示“中心端 ID：{SERVER_ID}”与“配置项总数：{configCount}”；异常状态（0/多中心端、查询失败）时该区域按状态矩阵替换为对应文案与操作。 |
| SC-UI-DESIGN-016 | 两列表格：列 1“配置项说明”（主宽列）、列 2“配置值”（操作列）；不出现 `CONFIG_KEY` 独立表头或独立列（`SC-UI-05`、`SC-DISPLAY-03`）。 |
| SC-UI-DESIGN-017 | 操作区：仅“保存全部”“撤销修改”两个按钮，位于表格下方**右对齐、非 sticky**；不提供新增、复制、删除、搜索、筛选、分页控件（`SC-UI-11`）。 |
| SC-UI-DESIGN-018 | 确认弹窗：只列实际变更项；每项为“显示名称（+Key 信息图标）+ 原值 + 新值”；底部“确认”“取消”。 |

## 6. 配置项说明主宽列与配置值操作列宽度优先级和响应式规则

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-020 | 配置项说明为弹性主内容列，占据剩余可用宽度；配置值列在常规桌面宽度下约 `360px`，较窄桌面收缩时**下限不低于约 `300px`**，控件宽度占满该列（`SC-UI-10`、`SC-UI-14`）。 |
| SC-UI-DESIGN-021 | 两列宽度优先级：优先保证配置项说明可读性；配置值列在约 `300px` 下限内收缩，不无限压缩、不出现控件不可操作（`SC-UI-14`）。 |
| SC-UI-DESIGN-022 | 响应式：常规桌面宽度（≥1280px）配置值列约 `360px`；较窄桌面（约 1024px）仍保持两列，配置值列收缩但不低于约 `300px`，控件宽度 `100%` 自适应，不允许出现横向溢出或控件不可操作（`SC-UI-13`）。具体像素在实现阶段按现有布局微调，本设计给出目标区间（`SC-UI-14`）。 |
| SC-UI-DESIGN-023 | 配置值列编辑控件宽度占满该列（`width: 100%`）；下拉/多选/数字控件需保证选项与输入可完整阅读与操作；枚举下拉展开后选项说明完整显示（`SC-UI-13`、`SC-AC-010`）。 |

## 7. 长说明换行、只读长值省略与 Tooltip、Key 信息图标 Tooltip

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-030 | 配置项说明列允许普通过长文本按列宽自动折行、多行完整展示；不因固定窄列造成大段省略（`SC-UI-11`、`SC-AC-007`）。数据库真实换行显示见 `SC-UI-DESIGN-035~038`。 |
| SC-UI-DESIGN-031 | 只读配置值超宽时使用省略号显示，`el-tooltip` 悬停展示完整原文，原文与数据库值完全一致、不截断、不脱敏（`SC-UI-12`、`SC-AC-009`）。 |
| SC-UI-DESIGN-032 | 每行配置项说明旁放置轻量信息图标（`el-icon`），悬停显示 `配置Key：{CONFIG_KEY}`；Key 完整显示、不截断、不脱敏（`SC-UI-15/16`）。 |
| SC-UI-DESIGN-033 | `CONFIG_KEY` 为 NULL/空时，信息图标 Tooltip 显示“未定义配置项”（与该行显示名称兜底一致），避免展示无意义空值；该行按 `SC-UI-DESIGN-042` 只读（`SC-UI-20`）。 |
| SC-UI-DESIGN-034 | 未知或异常 Key 同样通过信息图标提供技术追溯（`SC-UI-17`）；信息图标不挤占配置项说明主要空间（`SC-UI-16`）。 |
| SC-UI-DESIGN-035 | 配置项说明列样式语义：`white-space: pre-line`（保留数据库真实 LF/CRLF 换行按换行位置显示，同时允许普通过长文本自动折行）、`line-height: 1.6`（换行后行高易读）、`overflow-wrap: anywhere`（极长且无空格的连续内容可断行）（`SC-UI-23/26`、`SC-AC-066`）。 |
| SC-UI-DESIGN-036 | 真实换行来源是数据库 `CONFIG_DESC` 中的实际换行字符（如 Oracle `CHR(10)`），不是两个字符组成的字面量 `\n`；`<br>` 不作为换行协议（数据中出现 `<br>` 作为普通文本显示）；不把字面量 `\n` 自动转换为换行（`SC-UI-24`）。 |
| SC-UI-DESIGN-037 | 前端使用 Vue 文本插值/文本渲染保持 HTML 转义，严禁 `v-html`；`CONFIG_DESC` 为只读字段，页面不提供编辑入口（`SC-UI-25`）。 |
| SC-UI-DESIGN-038 | 多行说明下信息图标/Key Tooltip 合理对齐、不破坏布局；多行说明不造成横向溢出（`SC-UI-26`、`SC-AC-066`）。 |

## 8. 显示名称兜底规则和两者均缺失时的只读行为

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-040 | 显示名称计算（前端从 `configDesc`/`configKey` 计算，后端不重复计算，`API.md` `SC-API-028`）：`CONFIG_DESC` 非 NULL 且去除首尾空格后非空 → 显示 `CONFIG_DESC` 原文（`SC-UI-18`）。 |
| SC-UI-DESIGN-041 | `CONFIG_DESC` 为 NULL/空/纯空格 → 回退显示 `CONFIG_KEY`（`SC-UI-19`）。 |
| SC-UI-DESIGN-042 | `CONFIG_DESC` 与 `CONFIG_KEY` 均为空/NULL → 显示“未定义配置项”，该行只读、不允许保存（`SC-UI-20`、`SC-AC-008`）。 |
| SC-UI-DESIGN-043 | 兜底只影响显示，不修改数据库 `CONFIG_DESC`/`CONFIG_KEY`（`SC-UI-21`）。 |
| SC-UI-DESIGN-044 | 说明正常存在时，页面不把英文 Key 作为主内容持续展示（`SC-UI-22`）。 |
| SC-UI-DESIGN-045 | 页面展示顺序保持后端 `GET /api/server-config` 返回的 `ID_SERVER_CONFIG ASC` 顺序，前端不按 `CONFIG_KEY` 或其他字段二次排序（`SC-DISPLAY-02`、`API.md` `SC-API-034`）。 |

## 9. 六类支持 Key 的具体控件、选项顺序、显示文案和非法当前值降级方案

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-050 | `auto-create-table`、`auto-expand-column-length`：`el-select` 下拉，选项 `true`、`false`（选项显示即保存值小写字符串），无空选项（`SC-CFG-BOOL-01~04`）。 |
| SC-UI-DESIGN-051 | `raw-message-storage-strategy`：`el-select` 单选，选项顺序 `NONE`（不存储原始消息）、`PLAIN`（不压缩，直接插入原始文本）、`COMPRESS`（压缩后插入，推荐，节省存储空间）；保存值精确大写（`SC-CFG-RMSS-01/02`）。 |
| SC-UI-DESIGN-052 | `realtime-insert-batch-enabled-database-types`：`el-select` 多选，可选值 `doris`、`oracle`、`mysql`（小写，显示即保存 token）；至少选一种；交互顺序不改变规范化固定顺序（`SC-CFG-DBTYPE-01~09`）。 |
| SC-UI-DESIGN-053 | `snapshotBatchSize`：`el-input` 整数输入（输入过滤仅数字，禁小数/科学计数法/正负号/空格）；范围校验 100～10000 含端点；保存值去除首尾空格与前导零（`SC-CFG-SNAPSHOT-01~04`）。选用 `el-input` + 数字过滤而非 `el-input-number`，理由：`el-input-number` 自带 ±/步进/精度格式化，与“禁止正负号、科学计数法、小数、前导零”的规范保存值要求冲突，文本过滤更可控。 |
| SC-UI-DESIGN-054 | `tableRowDeleteStrategy`：`el-select` 单选，选项顺序 `DELETE`（源表删除数据，目标表也删除数据）、`DELETE_FLAG`（源表删除数据，目标表不删除数据，只更新删除标志位）；保存值精确大写（`SC-CFG-DELSTRAT-01/02`）。 |
| SC-UI-DESIGN-055 | 非法当前值降级（`SC-DISPLAY-06`、`SC-AC-065`）：该行仍显示对应专用控件；控件初始化带入当前值；值不符合专门规则时以行内校验错误提示“当前值无效：{原因}”，不因值异常变只读（`SC-DISPLAY-04`）。 |
| SC-UI-DESIGN-056 | 未修正为合法值前，前端整页校验不通过，“保存全部”不提交包含非法值的批次（`SC-DISPLAY-07`、`SC-CONFIRM-01`）。 |
| SC-UI-DESIGN-057 | `IS_EDITABLE` 不为 `'1'` 或 Key 不受支持的行（含未来新 Key）只读展示配置值，不渲染编辑控件（`SC-EDIT-02/03`、`SC-AC-019~023`）。 |
| SC-UI-DESIGN-058 | 当前两个只读 Key（`monitor-metric-topic-name`、`server-log-topic-name`）只读展示，不渲染编辑控件；即使未来 `IS_EDITABLE` 变为 `'1'`，在前后端增加专门规则前仍只读（`SC-READONLY-01/02`）。 |
| SC-UI-DESIGN-059 | 当前值异常/非法时**不得静默规范化**：控件按数据库原样值初始化（不自动 trim、不自动补全、不自动改写为规范形式），标注“当前值无效：{原因}”；如 `snapshotBatchSize` 前导零的当前值不自动修复为无前导零形式；只有用户显式修改为合法值后才按规范形式保存（`SC-DISPLAY-06`、`SC-AC-065`、`DESIGN.md` `SC-DESIGN-095`）。 |

## 10. 不显示 Key 独立列、不显示可编辑状态、不显示主键和中心端列

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-060 | 不出现 `CONFIG_KEY` 独立表头或独立列；Key 仅通过信息图标 Tooltip 按需查看（`SC-UI-05/15`）。 |
| SC-UI-DESIGN-061 | 不展示“是否可编辑”字段、状态列或原始 `IS_EDITABLE` 值；可编辑性只通过控件形态体现（`SC-UI-07/08`）。 |
| SC-UI-DESIGN-062 | 不展示 `ID_SERVER_CONFIG` 列、`SERVER_ID` 列（`SC-UI-06`）。 |
| SC-UI-DESIGN-063 | 所有值完整展示，不脱敏、不掩码（`SC-UI-09`、`SC-NFR-03`）。 |

## 11. 页面状态矩阵

| 编号 | 状态 | 触发条件 | 页面表现 |
|---|---|---|---|
| SC-UI-DESIGN-070 | `INITIAL` | 页面刚挂载 | 无内容或骨架占位 |
| SC-UI-DESIGN-071 | `LOADING` | 发起查询 | 顶部/主体显示加载中；按钮禁用 |
| SC-UI-DESIGN-072 | `SUCCESS_WITH_DATA` | `code=200` 且 `items` 非空 | 顶部显示 SERVER_ID + 配置项总数；主体两列表格；可编辑行渲染控件；操作区按钮按脏值启禁 |
| SC-UI-DESIGN-073 | `SUCCESS_EMPTY` | `code=200` 且 `items` 为空（正常空配置） | 顶部显示 SERVER_ID + 配置项总数 0；主体空状态文案“暂无配置项”；“保存全部”“撤销修改”不可用（`SC-SERVER-05`） |
| SC-UI-DESIGN-074 | `SERVER_NOT_REGISTERED` | 响应码 `40210` | 显示“中心端尚未注册，请先启动 sync-server”；不加载配置；无编辑控件；“保存全部”“撤销修改”不可用（`SC-SERVER-03`、`SC-AC-014`） |
| SC-UI-DESIGN-075 | `SERVER_MULTIPLE` | 响应码 `40211` | 显示“检测到多个中心端，当前功能仅支持唯一中心端”；不加载配置、不编辑、不保存（`SC-SERVER-04`、`SC-AC-015`） |
| SC-UI-DESIGN-076 | `LOAD_FAILED` | 查询 HTTP 失败/超时/其他错误码 | 显示可理解错误信息 + “重试”按钮；用户点击才重新查询（`SC-AC-014~016` 之外的非中心端错误） |
| SC-UI-DESIGN-077 | `EDITING` | `SUCCESS_WITH_DATA` 且存在脏值 | 顶部提示“存在未保存的修改”；编辑控件可交互；“保存全部”“撤销修改”可用 |
| SC-UI-DESIGN-078 | `HAS_INVALID` | `EDITING` 且存在校验非法值 | 非法行显示校验错误；“保存全部”不可用（不提交包含非法值的批次） |
| SC-UI-DESIGN-079 | `CONFIRMING` | 点击“保存全部”且校验通过 | 弹出确认框，只列实际变更项 |
| SC-UI-DESIGN-080 | `SAVING` | 确认保存 | 弹窗关闭；保存按钮与全部编辑控件禁用（防重复提交）；显示“保存中…” |
| SC-UI-DESIGN-081 | `SAVE_SUCCESS_RELOADING` | 保存成功 | 提示“保存成功”；自动重新查询并回到 `SUCCESS_WITH_DATA` / `SUCCESS_EMPTY`；重载失败进入 `SAVE_SUCCEEDED_RELOAD_FAILED`（`SC-UI-DESIGN-084`）；新结果成为原始值（`SC-STATE-01`） |
| SC-UI-DESIGN-082 | `SAVE_FAILED` | 保存失败/超时 | 提示可理解错误（不泄露堆栈）；保留全部编辑内容；“保存全部”可再次点击（`SC-STATE-02`） |

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-083 | 页面以响应 `code` 区分 `SERVER_NOT_REGISTERED`/`SERVER_MULTIPLE`（`40210`/`40211`）与普通失败；`code=200` + `items` 空才是空配置，不与中心端异常混淆（`SC-AC-016`）。 |
| SC-UI-DESIGN-084 | 保存成功但重载查询失败 → 进入独立状态 `SAVE_SUCCEEDED_RELOAD_FAILED`：提示“保存成功，但最新配置加载失败，请重试加载”；禁用编辑控件与“保存全部”“撤销修改”，仅提供“重试加载”按钮（该按钮只调用 `GET /api/server-config`，不发送任何保存请求）；重试成功 → 以最新加载结果重建原始值并回到 `SUCCESS_WITH_DATA`/`SUCCESS_EMPTY`；重试仍失败 → 保持该状态（`DESIGN.md` `SC-DESIGN-067`、`API.md` `SC-API-054`）。 |

## 12. “保存全部”“撤销修改”的启禁规则和防重复提交

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-090 | “保存全部”启用条件：状态为 `SUCCESS_WITH_DATA` 且存在实际脏值且无任何非法值且不在 `SAVING`。其余情况禁用（`SC-DIRTY-04`、`SC-DISPLAY-07`）。 |
| SC-UI-DESIGN-091 | “撤销修改”启用条件：状态为 `SUCCESS_WITH_DATA` 且存在实际脏值且不在 `SAVING`。其余情况禁用（`SC-DIRTY-04`）。 |
| SC-UI-DESIGN-092 | 点击“撤销修改”：所有编辑控件恢复“最近一次成功加载”的原始值，不发请求、不修改数据库（`SC-DIRTY-05`、`SC-AC-045`）。 |
| SC-UI-DESIGN-093 | 防重复提交：`SAVING` 期间禁用“保存全部”“撤销修改”与全部编辑控件；一个保存请求结束前不允许再次点击；取消确认不发请求并保留编辑（`SC-CONFIRM-03`、`SC-DESIGN-104`）。 |
| SC-UI-DESIGN-094 | 保存成功重载后清除全部脏值与编辑状态；保存失败保留编辑内容（`SC-STATE-01/02`）。 |

## 13. 确认弹窗的内容结构、原值/新值展示和 Key Tooltip

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-100 | 点击“保存全部”先完成整页校验；校验通过才弹出确认框（`SC-CONFIRM-01`、`SC-AC-048`）。 |
| SC-UI-DESIGN-101 | 确认框只列**实际变更项**；未变更配置不出现（`SC-CONFIRM-02`、`SC-AC-049`）。 |
| SC-UI-DESIGN-102 | 每项主要展示：配置项显示名称、原值、新值；`CONFIG_KEY` 不作为醒目字段或独立列，通过信息图标 Tooltip 按需查看（`SC-CONFIRM-02`）。 |
| SC-UI-DESIGN-103 | 显示名称因 `CONFIG_DESC` 缺失而回退为 Key 时，不重复展示第二份 Key（`SC-CONFIRM-02`）。 |
| SC-UI-DESIGN-104 | 确认弹窗展示：原值 = `rawValue`（数据库原样值，不脱敏、不掩码、不做规范化；NULL/空 → 显示“（空值）”，`SC-UI-DESIGN-105`）；新值 = `canonicalValue`（规范化后的最终保存形式）；多选新值展示规范化后的固定顺序字符串，保证用户所见与最终保存一致（`SC-DESIGN-074`）。 |
| SC-UI-DESIGN-105 | 确认框原值展示与页面当前值保持一致、不对当前值做静默规范化或修复（与 `SC-UI-DESIGN-059` 一致）；原值/新值均仅作确认展示，不提供在确认框中直接修改值或编辑可编辑性的入口（`SC-CONFIRM-02`）。 |

## 14. 页面离开或刷新时未保存修改的处理

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-110 | 页面不自动刷新，不因后台初始化、路由重入或迟到响应覆盖用户未保存编辑（`SC-DIRTY-06`、`SC-AC-047`）。 |
| SC-UI-DESIGN-111 | 本设计**不新增**强制离开拦截（`beforeunload`/路由守卫确认弹窗）：是否拦截属已批准需求之外的交互取舍，不得自行增加会改变已批准需求的强制行为；若实现阶段经用户确认采用项目现有通用行为，须如实记录并走需求调整。 |
| SC-UI-DESIGN-112 | 用户主动刷新或重新进入页面时，页面重新查询并重建原始值（等同首次进入），未保存编辑自然丢弃；这是浏览器/路由既有行为，不作为本 Feature 保证。 |

## 15. 不自动刷新、不自动重试保存；查询失败允许用户主动重试的方式

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-120 | 页面不自动刷新、不轮询、不自动重试保存（`SC-DIRTY-06`、`SC-AC-047`）。 |
| SC-UI-DESIGN-121 | 查询失败（`LOAD_FAILED`）页面提供“重试”按钮；仅用户主动点击才重新调用 `GET /api/server-config`（`SC-API-094`）。 |
| SC-UI-DESIGN-122 | 保存失败不自动重试；用户修改或重新点击“保存全部”才再次提交（`SC-STATE-02`、`SC-AC-061`）。 |

## 16. 成功、错误、空状态和异常状态的中文文案

| 编号 | 场景 | 文案 |
|---|---|---|
| SC-UI-DESIGN-130 | 加载成功 | 顶部“中心端 ID：{SERVER_ID}”，旁“配置项总数：{configCount}”；主体两列表格 |
| SC-UI-DESIGN-131 | 加载中 | “加载中…”（Element Plus 加载态） |
| SC-UI-DESIGN-132 | 正常空配置 | “暂无配置项” |
| SC-UI-DESIGN-133 | 0 中心端 | “中心端尚未注册，请先启动 sync-server” |
| SC-UI-DESIGN-134 | 多中心端 | “检测到多个中心端，当前功能仅支持唯一中心端” |
| SC-UI-DESIGN-135 | 查询失败 | “配置加载失败，请稍后重试” + “重试”按钮 |
| SC-UI-DESIGN-136 | 保存成功 | “保存成功” |
| SC-UI-DESIGN-137 | 保存失败 | “保存失败，请检查后重试”（服务端堆栈不展示，`SC-NFR-02`） |
| SC-UI-DESIGN-138 | 非法当前值 | 行内“当前值无效：{具体原因}”；保存按钮不可用提示“存在非法配置值，请修正后再保存” |
| SC-UI-DESIGN-139 | 保存成功但重载失败 | “保存成功，但最新配置加载失败，请重试加载” + “重试加载”按钮 |

## 17. 无障碍和可操作性

| 编号 | 规则 |
|---|---|
| SC-UI-DESIGN-140 | 键盘焦点可达：编辑控件、按钮、信息图标均可 Tab 聚焦与键盘操作；`el-select`/`el-dialog` 使用 Element Plus 内置键盘支持。 |
| SC-UI-DESIGN-141 | Tooltip 触发：信息图标与超宽值 Tooltip 悬停显示，同时支持焦点触发，便于键盘用户查看完整 Key 与完整只读值。 |
| SC-UI-DESIGN-142 | 禁用原因可理解：按钮禁用时提供 Tooltip/提示说明（如“无修改可保存”“存在非法配置值”），而非无解释灰置。 |
| SC-UI-DESIGN-143 | 颜色不作为唯一状态表达：成功/失败/非法值同时以文案与图标表达，不单靠颜色（红色/绿色）。 |

## 18. 人工视觉验收清单

| 编号 | 检查点 |
|---|---|
| SC-UI-DESIGN-150 | 菜单显示“中心端配置”、地址 `/config/server`、无重复菜单/重复路由（`SC-AC-001~003`）。 |
| SC-UI-DESIGN-151 | 顶部显示唯一中心端 `SERVER_ID` 与配置项总数；无中心端选择器（`SC-AC-004/012`）。 |
| SC-UI-DESIGN-152 | 页面主体仅两列：配置项说明（主宽列）+ 配置值；无 `CONFIG_KEY` 独立列；普通过长说明自动折行完整展示，`CONFIG_DESC` 真实换行按换行位置显示（`SC-AC-007/008/018`、`SC-AC-066`）。 |
| SC-UI-DESIGN-153 | 较窄桌面宽度（约 1024px）下仍保持两列、配置值列不低于约 `300px`、控件可操作、无横向溢出；操作区位于表格下方右对齐且非 sticky（`SC-AC-010`、`SC-UI-DESIGN-022/013`）。 |
| SC-UI-DESIGN-154 | 枚举下拉可完整阅读选项说明；多选与数字控件可正常操作（`SC-AC-010`）。 |
| SC-UI-DESIGN-155 | 确认弹窗只列实际变更项，主展示显示名称/原值/新值，Key 走 Tooltip；取消不发请求并保留编辑（`SC-AC-049/050`）。 |
| SC-UI-DESIGN-156 | 只读超宽值省略 + 悬停完整原文；信息图标 Tooltip 完整 Key；均不脱敏（`SC-AC-009/062`）。 |
| SC-UI-DESIGN-157 | 0/多中心端、空配置、查询失败、保存失败状态文案与按钮禁用符合状态矩阵（`SC-AC-014~016`）。 |
| SC-UI-DESIGN-158 | 不自动刷新；用户未保存编辑不被后台覆盖（`SC-AC-047`）。 |

## 19. UI 规则与验收用例映射

| UI 设计编号 | 对应验收用例 |
|---|---|
| `SC-UI-DESIGN-003~005` | `SC-AC-001~003` |
| `SC-UI-DESIGN-010~018`、`SC-UI-DESIGN-020~023`、`SC-UI-DESIGN-030~034`、`SC-UI-DESIGN-040~044`、`SC-UI-DESIGN-060~063` | `SC-AC-004~012`、`SC-AC-018` |
| `SC-UI-DESIGN-070~076`、`SC-UI-DESIGN-083`、`SC-UI-DESIGN-084` | `SC-AC-013~016` |
| `SC-UI-DESIGN-050~059`、`SC-UI-DESIGN-077~078` | `SC-AC-019~026`、`SC-AC-027~038`、`SC-AC-041/042`、`SC-AC-065` |
| `SC-UI-DESIGN-058` | `SC-AC-039/040` |
| `SC-UI-DESIGN-077`、`SC-UI-DESIGN-090~094` | `SC-AC-043~047` |
| `SC-UI-DESIGN-079`、`SC-UI-DESIGN-100~105` | `SC-AC-048~051` |
| `SC-UI-DESIGN-080~084`、`SC-UI-DESIGN-093~094` | `SC-AC-060/061` |
| `SC-UI-DESIGN-060~063`、`SC-UI-DESIGN-150~158` | `SC-AC-062~064` |

编号策略：本文档编号按章节分组、预留区间编号（章节内递增），不要求全文连续；每条编号唯一、引用可解析，章节内相邻编号保持递增，全局不保证无空隙。

## 20. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-27 | 建立“中心端配置”Feature 候选 UI 详细设计（DRAFT_PENDING_USER_REVIEW / NOT_STARTED） | SERVER-CONFIG-DESIGN-BASELINE-001（阶段 4 设计与契约；纯文档任务） |
| 2026-08-27 | R1 修订：布局改为**单一确定方案**（一个 `el-card` + 恰好两列 `el-table`，配置值列约 `360px`/收缩下限约 `300px`、控件宽度 `100%`、操作区表格下方右对齐非 sticky）；确认框原值 = rawValue 原样展示（NULL/空 → “（空值）”）与新值 = canonicalValue；当前非法值不得静默规范化；新增 `SAVE_SUCCEEDED_RELOAD_FAILED` 状态（重试加载仅 GET）与对应文案；保持 DRAFT_PENDING_USER_REVIEW / NOT_STARTED | SERVER-CONFIG-DESIGN-BASELINE-001-R1（REQUIRES_CHANGES 修订；纯文档任务） |
| 2026-08-27 | 批准收口：文档状态由 `DRAFT_PENDING_USER_REVIEW` 迁移为 `APPROVED`（实现仍 `NOT_STARTED`、65 条验收仍全部 `NOT_RUN`）；补充批准元数据；声明由“候选设计、待复审”更新为“已批准设计”；本设计不含需修正的“否则→则”文字问题（该修正仅在 `API.md` `SC-API-052` 与 `DESIGN.md` `SC-DESIGN-076`） | SERVER-CONFIG-DESIGN-BASELINE-APPROVAL-001（阶段 4 设计批准收口；纯文档任务） |
| 2026-08-28 | 候选调整（预验收）：新增 SC-UI-DESIGN-035~038（`white-space: pre-line` 人工换行、真实 LF/CRLF 语义、`<br>`/字面量 `\n` 不作为协议、禁止 `v-html`、多行下 Key Tooltip 对齐）；新增 SC-UI-DESIGN-045（页面不二次排序，保持后端 `ID_SERVER_CONFIG ASC` 顺序）；修订 SC-UI-DESIGN-030/152；文档状态迁移为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态迁移为 `IMPLEMENTED_ADJUSTMENT_PENDING`，66 条验收保持 NOT_RUN | SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001（纯文档候选基线任务；待用户复审） |
| 2026-08-28 | R1 实现事实修正：SC-UI-DESIGN-003 删除“当前菜单 title 仍为服务端配置”的旧事实，改为菜单/路由 title 当前已是“中心端配置”；SC-UI-DESIGN-005 删除“页面仍为 PlaceholderPage 待替换”的旧事实，改为正式页面已实现；新增 SC-UI-DESIGN-006 记录当前已实现 UI 状态（两列表格/编辑控件/保存确认/状态处理、普通长说明可自动折行、真实 LF/CRLF 换行尚待实现、列表当前保持旧排序）；候选规则 SC-UI-DESIGN-035~038、SC-UI-DESIGN-045 目标语义不变 | SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001-R1（ChatGPT 远程复审发现跨文档实现前旧事实；纯文档 R1 精确修正，待用户复审） |
| 2026-08-28 | 批准收口（预验收调整基线）：文档状态由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 迁移为 `APPROVED`；记录候选调整批准任务、批准日期、批准人（项目负责人）与 ChatGPT 最终复审通过提交 `b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee`；两项调整内容不变（`CONFIG_DESC` 人工换行安全显示、页面不二次排序保持后端 `ID_SERVER_CONFIG ASC` 顺序）；实现状态保持 `IMPLEMENTED_ADJUSTMENT_PENDING`（两项已批准调整代码尚未实现），66 条验收保持 `NOT_RUN`；`PENDING_USER_CONFIRMATION=0`；保留初始候选、R1、R2 全部历史 | SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001（项目负责人批准驱动的验收前调整基线收口；纯文档任务） |
| 2026-08-29 | 最终收口：实现状态由 `IMPLEMENTED_ADJUSTMENT_PENDING` 迁移为 `IMPLEMENTED_ACCEPTED`；SC-UI-DESIGN-006 当前有效正文同步更新为两项调整已实现并验收接受；新增元数据行（验收用例状态/正式验收状态 = `66 PASSED / 0 FAILED（ACCEPTED）`、收口任务、收口日期、验收证据提交 `b5aeec2...`、项目负责人最终人工测试、`PENDING_USER_CONFIRMATION=0`）。本行仅收口状态，不改动任何 UI 规则、控件语义或编号；历史变更记录中的 `NOT_STARTED`/`DRAFT_*`/`IMPLEMENTED_ADJUSTMENT_PENDING` 等历史状态原样保留 | SERVER-CONFIG-FORMAL-ACCEPTANCE-CLOSEOUT-001（纯文档正式验收收口；不修改代码/测试，不连接数据库，不重新执行验收） |
