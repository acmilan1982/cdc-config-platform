# 探针端管理 Feature 逻辑设计（DESIGN）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 探针端管理（页面与菜单最终统一使用的用户可见名称；本 Feature 内部目录标识仍为 `client-config`，既有路由 `/config/client` 保持不变） |
| Feature 标识 | `client-config` |
| 既有路由 | `/config/client`（保持不变） |
| 目标文档 | `docs/features/client-config/DESIGN.md` |
| 文档状态 | `APPROVED`（设计基线正式批准：ChatGPT 对提交 `ba7c5e9...` 的设计并发口径调整结果正式复审 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`，可用于后续实现；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过） |
| 实现状态 | 分层口径：`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（既有 Feature 实现已完成、尚待项目负责人验收）；`adjustment_baseline_status=APPROVED`（本轮页面级调整基线已于 2026-09-22 经项目负责人批准收口，批准前为 `DRAFT_PENDING_USER_REVIEW`）；`adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（仅指本轮页面级调整实现已于 2026-09-23 由 `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001` 完成、并经 ChatGPT 从远程 Git 独立代码复审通过，当前等待项目负责人页面目测/接受；其 2026-09-23 代码提交时点状态 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 属历史记录；**不**代表已目测、已验收或已接受）；`formal_acceptance_execution_status=NOT_RUN`。另有第三轮（本轮）`+N` 清单与新增／编辑弹窗视觉调整分层（2026-09-23 草案建立 → R1 纠错 → 批准收口，见 §15）：`adjustment3_baseline_status=APPROVED`（`adjustment3_approval_status=APPROVED_BY_PROJECT_OWNER`，`adjustment3_approval_date=2026-09-23`，`adjustment3_approved_reviewed_commit=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244`）、`adjustment3_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`（第三轮已批准基线的前端实现已于 2026-09-23 由 `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001` 完成，定向测试与前端构建通过、并已做真实浏览器只读核对，**当前停在 ChatGPT 远程代码复审入口**；批准收口时点的 `NOT_STARTED` 属历史状态）、`adjustment3_formal_acceptance_execution_status=NOT_RUN`（草案曾为 `DRAFT_PENDING_USER_REVIEW`，经 ChatGPT 远程复审、结论 `CHANGES_REQUIRED`，由 R1 纠错任务 `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001-R1` 定向修订后，ChatGPT 对 R1 结果提交 `1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244` 复审、结论 `APPROVED`，项目负责人于 2026-09-23 批准收口；**批准的是第三轮设计调整基线，其实现已完成但尚未经过远程代码复审、尚未验收**）；另有第二轮主列表视觉调整实现状态（见 §14）：`adjustment2_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（第二轮前端实现已于 2026-09-23 完成并经 ChatGPT 远程代码复审通过、当前等待项目负责人页面目测/接受）。另有第四轮（本轮）新增／编辑弹窗**校验与交互**调整分层（2026-09-24 草案建立 → R1 纠错 → 2026-09-24 批准收口为 `APPROVED`，见 §16）：`adjustment4_baseline_status=APPROVED`（`adjustment4_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment4_approval_date=2026-09-24`、`adjustment4_approved_reviewed_commit=9daf03848d53008d3ac73e6a43c1368fa5d72750`）、`adjustment4_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`（第四轮已批准基线的前端实现已于 2026-09-24 由 `CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-IMPLEMENTATION-001` 完成，定向测试、全量前端测试与前端构建通过、并已做真实无头浏览器只读核对，**当前停在 ChatGPT 远程代码复审入口**，见 README §1.10；批准收口时点的 `NOT_STARTED` 属历史时点，照实保留）、`adjustment4_formal_acceptance_execution_status=NOT_RUN`；草案曾为 `DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`（R0 提交 `51be9aa66f0555da331b20b2ae5d4cc2f370f880` 经 ChatGPT 从远程 Git 复审、结论 `CHANGES_REQUIRED`，由定向纠错任务 `CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001-R1` 承接），R1 结果提交 `9daf03848d53008d3ac73e6a43c1368fa5d72750` 经 ChatGPT 从远程 Git **基线文档复审**、结论 `APPROVED`，项目负责人于 2026-09-24 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-APPROVAL-CLOSEOUT-001` 收口为 `APPROVED`；批准收口当时仅完成**文档基线批准收口**（未修改代码、未运行测试／构建／浏览器、未执行正式验收），该批准收口入口 `CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_APPROVAL_CLOSEOUT_REVIEW` 属**历史入口**；第四轮前端实现其后已于 2026-09-24 完成，**现行下一入口**为 `CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_IMPLEMENTATION_REVIEW`（见 README §1.10；均为时序说明，**不**宣布本轮已目测、已验收或已接受）。旧单层 `NOT_STARTED`（本设计只落盘目标逻辑方案）属历史事实，不代表当前既有实现状态 |
| 初版任务 | `CLIENT-CONFIG-DESIGN-BASELINE-001`（阶段 4 设计基线，纯文档） |
| 初版基线提交 | `cecfdd5478df8b82ba39c083553ea8dd7ead48e8`（初版设计任务开始前 `origin/develop` 与本地 HEAD 一致的实际起点） |
| 初版设计提交 | `21f4729c43d146426e8d4f1b2d6b667cfcf160ff`（初版四文档设计草案提交，ChatGPT 正式复审对象） |
| R1 任务 | `CLIENT-CONFIG-DESIGN-BASELINE-001-R1`（正式设计复审驱动的定向修订，纯文档） |
| R1 复审结论 | ChatGPT 正式复审：`CHANGES_REQUIRED`（R1-01~R1-09；本文件落实 R1-02~R1-08 的业务/数据流修订，R1-01/09 的编号与过程核验见本文件元数据、§12 与 R1 执行报告） |
| R1 基线提交 | `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` |
| 依据需求 | `REQUIREMENTS.md`：`CCFG-REQ-001~136`（其中 `001~090` 为 `APPROVED`，`091~103` 为第一轮页面级调整新增需求，已随该轮基线于 2026-09-22 批准，批准前为 `DRAFT_PENDING_USER_REVIEW`；`104~112` 为第二轮 V2 新增需求，当前 `adjustment2_baseline_status=APPROVED`（2026-09-23 批准收口，批准前为 `DRAFT_PENDING_USER_REVIEW`），见 §14；`113~122` 为第三轮 `+N` 清单与新增／编辑弹窗视觉调整新增需求，当前 `adjustment3_baseline_status=APPROVED`（2026-09-23 批准收口），见 §15；`123~136` 为**第四轮**新增／编辑弹窗校验与交互调整新增需求，当前 `adjustment4_baseline_status=APPROVED`（2026-09-24 批准收口，批准前为 `DRAFT_PENDING_USER_REVIEW`），见 §16） |
| 依据验收 | `ACCEPTANCE.md`：`CCFG-AC-001~135`（既有 76 + 第一轮新增 13 + 第二轮新增 15 + 第三轮新增 13 + 第四轮新增 18），全部 `NOT_RUN`（批准的是验收标准，不是验收执行结果） |
| 创建日期 | 2026-09-03 |
| R1 日期 | 2026-09-04 |
| 并发调整任务 | `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`（依据重新批准的需求/验收并发口径，定向清除过时显式表锁设计的纯文档任务） |
| 并发调整日期 | 2026-09-04 |
| 批准日期 | 2026-09-04 |
| 批准人角色 | 项目负责人 |
| ChatGPT 复审入口 | `CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW` |
| ChatGPT 复审结论 | `APPROVED`（对提交 `ba7c5e917b1b9d08208c3e1ceb31285407f5fd5e` 下的设计并发口径调整结果） |
| 项目负责人回复 | 明确回复“批准”（2026-09-04） |
| 批准对象 | 提交 `ba7c5e917b1b9d08208c3e1ceb31285407f5fd5e` 下的本文件及其全部设计定义 |
| 批准收口任务 | `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` |
| 批准边界 | 设计获批不代表代码已实现、已测试或验收已执行通过 |
| 设计编号 | `CCFG-DESIGN-001 ~ CCFG-DESIGN-071`，连续、唯一、不可复用；每个设计编号恰有一个定义行，其余同编号出现一律视为引用而非定义。其中 `001~037` 为已批准设计基线，`038~046` 为第一轮页面级调整新增设计项，已随该轮基线于 2026-09-22 批准（见 §13）；`047~053` 为第二轮 V2 新增设计项，当前 `APPROVED`（2026-09-23 批准收口，批准前为 `DRAFT_PENDING_USER_REVIEW`；见 §14）；`054~060` 为第三轮 `+N` 清单与新增／编辑弹窗视觉调整新增设计项，当前 `APPROVED`（2026-09-23 批准收口；见 §15）；`061~071` 为**第四轮**新增／编辑弹窗校验与交互调整新增设计项，当前 `adjustment4_baseline_status=APPROVED`（2026-09-24 批准收口，批准前为 `DRAFT_PENDING_USER_REVIEW`；见 §16） |
| PENDING_USER_CONFIRMATION | `0`（**已批准部分** `CCFG-DESIGN-001~037` 不存在由已批准需求无法推导、必须由项目负责人另行决定的业务或用户可见语义；R1 确定性修订全部落实且未发现新的业务歧义；2026-09-04 并发口径定向调整亦未引入需另行决定的新语义。**本轮新增部分**见 §13：本轮设计项本身无新增待确认设计空档；需求侧 R0 曾转记的 1 项 `PENDING_USER_CONFIRMATION`（行单选/选中视觉与“已选择：{探针ID}”的去留）已由项目负责人于 R1 **明确决定全部取消**，该事项关闭，本设计与需求侧均不再保留待确认项） |
| 本轮调整任务 | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`（页面级模板选择性接入与列表调整草案，纯文档，2026-09-22，见 §13）；`...-BASELINE-001-R1`（该草案的定向纠错与项目负责人决定回填，纯文档，2026-09-22，冻结“取消全部选择能力”与 `FG_ACTIVE` 三态红色异常标识）；`...-BASELINE-001-R2`（R1 报告证据纠错，2026-09-22）；`...-BASELINE-001-R3`（R2 报告摘要最小证据纠错，2026-09-22）；`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001`（页面级调整基线批准收口，纯文档，2026-09-22，见 §13 前言） |
| `existing_feature_implementation_status` | `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（既有 Feature 实现已完成、尚待项目负责人验收；**不得**写成 `NOT_STARTED`） |
| `adjustment_baseline_status` | `APPROVED`（2026-09-22 草案建立时的 `DRAFT_PENDING_USER_REVIEW` 属历史状态；经 R1 修订与 R2/R3 证据纠错后由项目负责人于 2026-09-22 批准） |
| `adjustment_approval_status` | `APPROVED_BY_PROJECT_OWNER`（`adjustment_approval_date=2026-09-22`，`adjustment_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0`；批准对象与本 Design 的 §13 设计项见 §13 前言） |
| `adjustment_implementation_status` | `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（本轮页面级调整实现已于 2026-09-23 完成、并经 ChatGPT 从远程 Git 独立代码复审通过，当前等待项目负责人页面目测/接受；其 2026-09-23 代码提交时点状态 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 属历史记录；**不**等于已目测、已验收或已接受） |
| `formal_acceptance_execution_status` | `NOT_RUN` |
| 页面级授权 | `/config/client` 的页面级选择性接入授权**已获得**（查询列表页模板：仅该单页且明确不启用刷新能力；列表表格视觉模板：仅该单页主列表）；两套模板的模板级全局迁移授权仍未授予（`page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED` 保持不变）；该页面级授权与本次页面级调整基线批准均**不**代表本轮实现已获授权、已完成或已验收；本轮实现已于 2026-09-23 完成、并经 ChatGPT 从远程 Git 独立代码复审通过（当前 `adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`，等待项目负责人页面目测/接受；**不**代表已目测、已验收或已接受），`formal_acceptance_execution_status=NOT_RUN` |
| 第二轮 V2 视觉调整基线状态 | `adjustment2_baseline_status=APPROVED`（第二轮主列表视觉调整，依据项目负责人已确认的五项视觉调整决定建立草案，经 ChatGPT 远程 V2 复审 `CHANGES_REQUIRED`、R1 纠错后再经 ChatGPT 远程复审 `APPROVED`，由项目负责人于 2026-09-23 批准收口，见 §14；批准前为 `DRAFT_PENDING_USER_REVIEW`） |
| 第二轮 V2 视觉调整批准状态 | `adjustment2_approval_status=APPROVED_BY_PROJECT_OWNER`（`adjustment2_approval_date=2026-09-23`，`adjustment2_approved_reviewed_commit=3830cba16142b4e2ad88f1fa96682ea8397a1203`；项目负责人 2026-09-23 明确回复原话 `批准本轮五项视觉调整基线`） |
| 第二轮 V2 视觉调整实现状态 | `adjustment2_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（本轮已批准基线的前端实现已于 2026-09-23 由 `CLIENT-CONFIG-VISUAL-FOLLOWUP-IMPLEMENTATION-001` 完成，并经 ChatGPT 从远程 Git 对实现提交 `fecf5a06d90c690b5ee984a9e487f05322e1dd70` 独立代码复审通过，当前等待项目负责人页面目测/接受；其完成时点状态 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 与基线批准收口时点的 `NOT_STARTED` 属历史状态。**复审通过不等于已目测、已验收或已接受**） |
| 第二轮 V2 正式验收执行状态 | `formal_acceptance_execution_status=NOT_RUN`（`CCFG-AC-001~135` 共 135 条全部 `NOT_RUN`） |
| 配套文档 | `API.md`（`CCFG-API-*`）、`UI.md`（`CCFG-UI-*`）、`DATABASE.md`（`CCFG-DB-*`），与本文件状态相同，接口路径、字段名、状态值、错误码、事务边界与本文件一致 |

R1 修订目标（不改已批准 90 条需求与 76 条验收、不进入代码实现、不做设计批准收口）：在 §12 追踪矩阵改为全称编号并修正初版 API 重复定义统计口径（`R1-01`）；固定“E1 `dataSources` 恒按原存储顺序返回、前端仅计算非持久化前三项投影”的单一顺序契约（`R1-02`，见 CCFG-DESIGN-014）；固定 `CLIENT_DESC` 原文保存、Trim 仅判空、按实际保存原文计 UTF-8 字节（`R1-03`，见 CCFG-DESIGN-028/030）；补齐关键词字面量 LIKE 转义（`R1-04`，见 CCFG-DESIGN-007 与 DATABASE.md）；删除未批准的数据源 ID“其他非法字符”限制（`R1-05`）；补齐 `CATEGORY_MISMATCH`/`TYPE_MISMATCH` 历史候选资格变化异常（`R1-06`，见 CCFG-DESIGN-035）；补齐含逗号历史配置的不可逆歧义处理（`R1-07`，见 CCFG-DESIGN-036）；补齐历史 `CLIENT_DESC` 为 NULL/空白的契约（`R1-08`，见 CCFG-DESIGN-037）。

并发口径定向调整（2026-09-04，`CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`，纯文档）：依据 2026-09-04 重新批准的需求/验收并发口径（`CCFG-REQ-038/068/071/072/074/077`、`CCFG-AC-030/056/058/059/061/064` 相关，`REQUIREMENTS.md`/`ACCEPTANCE.md` 为 `APPROVED`），清除本设计把 `LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5` 作为唯一性保证手段的现行设计：新增/编辑/启用改为“普通短事务 + 目标 DML 前全量重读 + 当次尽力写前检查 + 立即 DML”，明确不采用显式表锁、`SELECT ... FOR UPDATE`、JVM 锁、分布式锁或 DDL 串行化，接受极端并发下两笔都成功的已接受边界；删除 `ORA-30006 → 50050 LOCK_WAIT_TIMEOUT` 专用错误路径与前端锁等待超时文案。受影响的现行设计定义：`CCFG-DESIGN-001/016/017/020/022/023/024/025/026/027/033`（见 §6/§7/§10 与 §13 变更记录）。原表锁/锁等待方案为设计草案内容，未获项目负责人批准，已整体标记为过时。本调整后设计经 ChatGPT 对提交 `ba7c5e9...`（`ba7c5e917b1b9d08208c3e1ceb31285407f5fd5e`）下的设计并发口径调整结果正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`（批准的是设计基线，不代表代码已实现、已测试或验收已执行通过）。

## 2. 范围与状态边界

- 本设计只建立逻辑设计方案，不实现代码，不执行测试，不连接数据库，不修改任何数据库基线（`docs/database/` 零改动），不执行 DDL/DML。
- 已批准需求 `CCFG-REQ-001~090` 与本轮已批准新增需求 `CCFG-REQ-091~103`（已随本轮页面调整基线于 2026-09-22 批准，批准前为 `DRAFT_PENDING_USER_REVIEW`）是业务语义来源；本设计对应新增项 `CCFG-DESIGN-038~046` 同随该基线批准，但实现仍为 `NOT_STARTED`、验收仍为 `NOT_RUN`。本设计不增加、弱化、替换或重新解释任何需求；对本 Feature 无法从需求推导的技术空档给出唯一确定方案，不保留“方案 A/B 待定”。
- 本 Feature 只维护 `CDC_CLIENT_MULTIPLE` 配置，不直接启停、重启或通知 `sync-client`；不操作 ZooKeeper、Kafka、Topic 或运行进程；不连接源 Oracle 数据源、不读取 Schema/表结构。
- 接口、页面反馈不得承诺配置对运行中进程“实时生效”“已启停”“已重启”。
- 所有候选代码类名、文件名均为实现阶段建议（标注“待建”），本任务不创建、不宣称已存在。

## 3. 分层结构与代码组织（候选方案）

### 3.1 总体分层

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-001 | 后端使用独立垂直包 `com.bsoft.cdcconfig.clientconfig`，与故障监控、数据源、订阅等其他模块隔离。Controller 只做协议接入与基础绑定；Service 承担业务校验、历史异常判定、普通短事务与 DML 前全量重读/写前检查编排；Mapper 只负责参数化 SQL；DTO/Query/VO/Converter/ErrorCode/Helper 各司其职。前端建立独立 `api`、`types`、正式页面与必要的局部组件/工具。 | CCFG-REQ-085、CCFG-REQ-087、CCFG-REQ-090 | CCFG-AC-071、CCFG-AC-073、CCFG-AC-076 |
| CCFG-DESIGN-002 | 后端候选类（实现阶段待建，不创建）：`com.bsoft.cdcconfig.clientconfig.controller.ClientConfigController`；`service.ClientConfigService`（接口）与 `service.impl.ClientConfigServiceImpl`；`mapper.CdcClientConfigMapper`（`extends BaseMapper<CdcClientConfig>`，映射 `CDC_CLIENT_MULTIPLE`）；`entity.CdcClientConfig`（本 Feature 自己的写实体）；`model/dto` 请求与 `model/vo` 响应、`model/query` 查询条件、`converter` 转换器；`enums.ClientConfigErrorCode`（错误码，见 API.md）；`helper` 数据源 CSV 与 UTF-8 字节工具。命名避开既有 `monitor/topicoffset/mapper/ClientConfigMapper` 与 `monitor/jobfailure` 的 `CdcClientMultiple`/`CdcClientMultipleMapper`（均为故障监控只读模型），避免 `@MapperScan` 下 Spring Bean 名冲突与跨 Feature 复用。 | CCFG-REQ-090 | CCFG-AC-076 |
| CCFG-DESIGN-003 | 前端候选：路由 `/config/client` 指向正式页面 `frontend/src/views/client-config/ClientConfigPage.vue`（替换现占位页，占位页仅作既有实现保留），`meta.title` 与菜单 `frontend/src/config/menu.ts` 中该项标题、面包屑统一为“探针端管理”（实现阶段一并收口 BI-CFG-001）；`frontend/src/api/clientConfig.ts`、`frontend/src/types/clientConfig.ts`、局部组件（如编辑弹窗、数据源紧凑标签组件）与局部工具（CSV/UTF-8 字节），均待实现阶段建立。 | CCFG-REQ-001 | CCFG-AC-001 |
| CCFG-DESIGN-004 | 本 Feature 新建自己的 `CdcClientConfig`/`CdcClientConfigMapper` 读写模型，不复用、不修改故障监控模块 `monitor/jobfailure` 中对 `CDC_CLIENT_MULTIPLE` 的只读消费模型（`CdcClientMultiple`/`CdcClientMultipleMapper`），避免跨 Feature 耦合；既有只读消费模块保持原样。 | CCFG-REQ-090 | CCFG-AC-076 |

### 3.2 约束

- 不修改任何既有 Entity、Mapper、Service、Controller、错误码；不在本 Feature 之外新增公共类。
- 若发现既有可复用 CSV/字节工具与批准需求口径一致则复用，否则在本 Feature 内新建独立 Helper（见 §5、§8），不在本设计阶段创建。

## 4. 查询与展示数据流

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-005 | 固定“小表全量读取 + 内存装配”：一次读取符合查询条件的 `CDC_CLIENT_MULTIPLE` 全部行（仅查询过滤为关键词/状态时先过滤，否则为全表），默认按 `CLIENT_ID` 字符串降序；一次读取 `CDC_DATA_SOURCE` 安全字段子集用于名称映射与异常判定；在内存完成解析、去重、占用映射与异常装配，不做逐行 N+1 查询；数据源行视图随列表一次返回。无分页、无缓存。 | CCFG-REQ-002、CCFG-REQ-003、CCFG-REQ-004、CCFG-REQ-005、CCFG-REQ-078 | CCFG-AC-002、CCFG-AC-003、CCFG-AC-004、CCFG-AC-065 |
| CCFG-DESIGN-006 | 状态分类固定为：`fgActive='1'` → `ENABLED`；`fgActive='0'` → `DISABLED`；其余原始值 → `ABNORMAL`（必须携带原始 `fgActive` 字符串）。状态筛选语义：`ALL` 含任意原始值；`ENABLED` 只匹配 `FG_ACTIVE='1'`；`DISABLED` 只匹配 `FG_ACTIVE='0'`；非 `0/1` 历史异常值只出现在“全部”结果中，不被单独筛出。 | CCFG-REQ-002、CCFG-REQ-006、CCFG-REQ-033 | CCFG-AC-002、CCFG-AC-005、CCFG-AC-025 |
| CCFG-DESIGN-007 | 关键词为空时不作关键词过滤；关键词非空时对探针 ID 与探针描述执行不区分大小写的字面量包含匹配（不区分大小写差异，但通配符不作为特殊语法）。关键词 Trim 后以 `\` 作为 SQL LIKE 转义字符：应用层依次把关键词中的 `\`、`%`、`_` 转义为字面量（`\` → `\\`、`%` → `\%`、`_` → `\_`），使 `%`/`_`/`\` 均按普通字符匹配；Mapper 使用绑定参数形成 `%{escapedKeyword}%`，SQL 显式带 `ESCAPE '\'`（逻辑形态见 DATABASE.md），禁止 `${}` 或字符串拼接用户输入（R1-04）。探针 ID 与探针描述匹配不比较大小写敏感性差异。 | CCFG-REQ-006 | CCFG-AC-005 |
| CCFG-DESIGN-008 | 数据源映射与候选项只读取安全字段：`DATA_SOURCE_ID`、`DATA_SOURCE_ORG`、`DATA_SOURCE_NAME`、`DATA_SOURCE_TYPE`、`DATA_SOURCE_CATEGORY`、`FG_ACTIVE`。任何层不得读取、传输或返回 `DATA_SOURCE_PASSWORD` 及本页面不需要的连接串、主机、用户名、服务名等字段。 | CCFG-REQ-087 | CCFG-AC-073 |
| CCFG-DESIGN-009 | 列表与候选接口不提供分页参数、不分页、不提供“加载更多”、不做自动刷新；页面不为探针数或数据源数设业务上限（物理字段容量边界仍按 §5/§8 校验）。 | CCFG-REQ-003、CCFG-REQ-004 | CCFG-AC-003 |
| CCFG-DESIGN-037 | 历史 `CLIENT_DESC` 为 NULL/空白的契约（R1-08）：已批准数据库基线中 `CLIENT_DESC` 可空，E1 响应 `clientDesc` 使用 `string\|null`，不得假定历史值永非 NULL。列表中 NULL 或去除首尾空白为空的描述以确定占位符展示（如 `—`），Tooltip 说明“未填写探针描述”；打开编辑时 NULL 映射为空输入框、非 NULL 值（含首尾空白）原样回显。该历史状态不阻止打开编辑、删除、停用或按既有规则启用。编辑保存时仍必须补齐为“去除首尾空白后非空且原文 UTF-8 `<=1024 BYTE`”的描述。本 Feature 不自动写回、不自动生成、不把 NULL 自动持久化为空串。 | CCFG-REQ-011、CCFG-REQ-039、CCFG-REQ-058、CCFG-REQ-059 | CCFG-AC-009、CCFG-AC-028、CCFG-AC-033、CCFG-AC-047 |

## 5. 多值协议与异常模型

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-010 | 统一 CSV 协议（与批准需求 §6 一致）：读取时按单个英文逗号（`,`）拆分、每项去除首尾空白、忽略空项；空/仅空白/仅空项序列 → 无数据源。写入时对最终选定的数据源 ID 去除首尾空白、忽略空项、按规范化结果去重（同一行内）、保持用户选择顺序，用单个英文逗号连接且逗号前后不加空格。数据源 ID 不做大小写折叠（其为 `CDC_DATA_SOURCE` 物理主键的精确引用，仅 Trim），跨记录占用比较也使用精确规范化 token；探针 ID 的大小写不敏感唯一性另见 §6/§7，两者口径不同、不得混用。对 `CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 历史原始字符串，普通 CSV 解析仅用于“能够确定”的 token 展示；若原始字符串中存在可与“数据库已知含英文逗号的数据源 ID”完整连续文本匹配的可能，则 CSV 协议本身不可逆、不得宣称已无损还原实际分配关系，按 R1 歧义契约（CCFG-DESIGN-036）处理。 | CCFG-REQ-010、CCFG-REQ-040 | CCFG-AC-014、CCFG-AC-034 |
| CCFG-DESIGN-011 | 定义跨前后端一致的数据源异常原因枚举（稳定字符串）。数据源项级至少含：`INACTIVE`（数据源存在但 `FG_ACTIVE!='1'`）、`NOT_FOUND`（不在 `CDC_DATA_SOURCE`）、`CATEGORY_MISMATCH`（数据源存在但 `UPPER(DATA_SOURCE_CATEGORY)!='SOURCE'`，见 CCFG-DESIGN-035）、`TYPE_MISMATCH`（数据源存在但 `UPPER(DATA_SOURCE_TYPE)!='ORACLE'`）、`COMMA_IN_ID`（原始存储值整体等于某含逗号的数据源 ID，无法按 CSV 拆分）、`DUPLICATE_IN_ROW`（同一行内存在 Trim 后重复的 token）、`ASSIGNED_TO_MULTIPLE_CLIENTS`（与另一条探针记录重复分配）。行级另有稳定枚举 `COMMA_PROTOCOL_AMBIGUOUS`（原始字符串存在含逗号歧义、普通 CSV 解析无法无损还原，见 CCFG-DESIGN-036）。前端的展示文案由 UI.md 映射；VO 传稳定枚举串，不在接口层做本地化拼接。 | CCFG-REQ-017、CCFG-REQ-019、CCFG-REQ-079、CCFG-REQ-080 | CCFG-AC-013、CCFG-AC-015、CCFG-AC-066、CCFG-AC-067 |
| CCFG-DESIGN-012 | 同一行历史重复 ID 的展示与计数统一为“按 Trim 后不同 ID 去重”，并把“原配置含重复 token”记录为 `DUPLICATE_IN_ROW` 异常事实。计数列 = 去重后的非空 token 数；标签/清单按去重后的项展示。展示去重与计数使用同一口径（满足 `CCFG-REQ-019`），不另造第二口径。 | CCFG-REQ-018、CCFG-REQ-019 | CCFG-AC-015 |
| CCFG-DESIGN-013 | 跨记录占用映射：对所有读取的行（含 `FG_ACTIVE=0` 与非 `0/1` 异常状态行）按规范化 token 建立“token → 占用该 token 的探针 ID 列表”，供唯一分配判定、候选占用标注与列表冲突提示使用；同一数据源被多条探针占用时保留全部冲突探针 ID，不隐藏任何一个。停用/异常状态行同样参与占用映射（停用不释放数据源）。 | CCFG-REQ-068、CCFG-REQ-069、CCFG-REQ-070、CCFG-REQ-075、CCFG-REQ-076 | CCFG-AC-056、CCFG-AC-057、CCFG-AC-062、CCFG-AC-063 |
| CCFG-DESIGN-014 | 数据源顺序单一契约（R1-02）：E1 接口 `dataSources` 恒按“规范化去重后的原存储顺序”返回，后端绝不为了列表前三项而改变该数组顺序，也不得原地改动接口数组供前端复用。前端仅为列表“直接显示的前三项”计算一个非持久化投影：稳定地把异常项排在正常项前面、组内保持接口原顺序，再取前三项；`+N` 的 N 等于完整数组数量减去直接显示数量；完整 Tooltip/Popover 清单与编辑回显一律使用接口原顺序数组。该投影不得原地修改接口数组，不改变表单选择顺序、自动生成顺序或保存顺序。列表查询仅做“展示投影”，绝不修改数据库中的原始 `DATA_SOURCE_ID` 内容（展示去重 ≠ 写回修复），本 Feature 不自动清理或修复历史异常数据。 | CCFG-REQ-017、CCFG-REQ-019、CCFG-REQ-078、CCFG-REQ-084 | CCFG-AC-013、CCFG-AC-015、CCFG-AC-065、CCFG-AC-070 |
| CCFG-DESIGN-015 | 机构映射缺省策略：数据源 ID 能在安全字段集中命中时，视图携带 `org`、`dataSourceName`；无法命中（如 `NOT_FOUND`）时 `org`/`dataSourceName` 允许为 `null`，前端仍须显示原始数据源 ID 与异常原因，不得因缺名而丢弃该异常项。`DATA_SOURCE_ORG` 为空的历史记录同样按“无法取得机构名称”处理。 | CCFG-REQ-080、CCFG-REQ-012 | CCFG-AC-067、CCFG-AC-009 |
| CCFG-DESIGN-035 | 历史候选资格变化异常（R1-06）：E1 读取 `CDC_DATA_SOURCE` 安全字段后，对每个可解析 token 判定候选资格——数据源存在但 `UPPER(DATA_SOURCE_CATEGORY)!='SOURCE'` → 项级异常 `CATEGORY_MISMATCH`；存在但 `UPPER(DATA_SOURCE_TYPE)!='ORACLE'` → 项级异常 `TYPE_MISMATCH`。二者作为红色历史异常项回显（显示原始数据源 ID、当前类别/类型与不合格原因），使“列表/编辑看似正常、保存时突然失败”的落差消失。编辑弹窗存在任一此类异常时与其它历史异常一致禁止保存（直至用户移除并重新选择合法候选）；启用只被跨探针重复分配冲突阻断，类别/类型不符等历史异常本身不阻断启用。新增/编辑后端权威候选仍为 `FG_ACTIVE='1'` + 类别 SOURCE + 类型 ORACLE。本项只补全既有候选范围与历史异常展示的一致性，不新增数据源资格业务规则。 | CCFG-REQ-017、CCFG-REQ-078、CCFG-REQ-079、CCFG-REQ-080、CCFG-REQ-081、CCFG-REQ-083 | CCFG-AC-013、CCFG-AC-027、CCFG-AC-065、CCFG-AC-066、CCFG-AC-067、CCFG-AC-068 |
| CCFG-DESIGN-036 | 含逗号历史配置的不可逆歧义（R1-07）：候选列表继续用 `COMMA_IN_ID` 展示但禁选“ID 本身含英文逗号”的数据源（E2 侧）。对 `DATA_SOURCE_ID` 历史原始字符串：读取时仍执行批准的普通 CSV 解析，仅用于“能够确定”的 token 展示；同时用只读取得的“数据库中所有含英文逗号的数据源 ID 集合”，在原始字符串中按完整连续文本与 CSV 边界做可能匹配。只要存在一个或多个可能的含逗号 ID 匹配，就不得宣称已无损恢复实际分配关系，行级返回：原始完整 `rawDataSourceIds`、行级稳定异常 `COMMA_PROTOCOL_AMBIGUOUS`、`possibleCommaDataSourceIds`（全部可能匹配的已知含逗号数据源 ID，保持确定顺序）；数量/标签/可能匹配一律标注为“普通 CSV 解析的展示结果”，不计为已确定的分配。编辑弹窗可打开，但用户在清除原始歧义配置并重新选择合法候选前禁止保存，不得静默拆分后直接覆盖；原始数据库内容继续保留、不自动修复。若含逗号数据源已从 `CDC_DATA_SOURCE` 删除而无法识别，只能按普通 CSV 解析为缺失 token 并标 `NOT_FOUND`，不得无依据猜测一个不存在的含逗号 ID。跨探针唯一分配校验仍以规范化 token 为权威。 | CCFG-REQ-010、CCFG-REQ-064、CCFG-REQ-078、CCFG-REQ-080、CCFG-REQ-081、CCFG-REQ-084 | CCFG-AC-052、CCFG-AC-065、CCFG-AC-067、CCFG-AC-068、CCFG-AC-070 |

## 6. 新增、编辑、删除与启停流程

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-016 | 新增流程（E3）：校验请求（探针 ID 格式/唯一性前置、描述、数据源格式）→ 开启单个普通短事务 → 在目标 `INSERT` 前重新读取 `CDC_CLIENT_MULTIPLE` 全部行（见 §7）→ 执行当次尽力写前检查：探针 ID ASCII 大小写不敏感唯一、全部拟保存数据源唯一分配且均为可用候选 → 发现冲突则不执行 DML 并返回业务冲突（`40940`/`40941` 等既有契约）→ 未发现冲突则立即 `INSERT`，`FG_ACTIVE` 固定写 `1`；行数必须为 1，任一步失败整笔回滚。该当次检查不消除检查与写入之间的并发竞态。新增表单不含状态字段。 | CCFG-REQ-041、CCFG-REQ-043 | CCFG-AC-031、CCFG-AC-030 |
| CCFG-DESIGN-017 | 编辑流程（E4）：请求同时携带 `originalClientId` 与最终 `clientId`；以 `originalClientId` 精确定位原记录（定位不到 → 探针不存在）；允许 `clientId` 修改；在同一个普通短事务内、目标 `UPDATE` 前重新读取 `CDC_CLIENT_MULTIPLE` 全部行并执行当次尽力写前检查：按最终 `clientId` 做格式与 ASCII 大小写不敏感唯一校验（按 `originalClientId` 排除自身，允许自身仅大小写调整且无其他冲突时保存并保留新大小写），按全部拟保存数据源做唯一分配校验（自排除同样按 `originalClientId`，杜绝把改后的新 ID 误当排除键）→ 发现冲突则不执行 DML 并返回业务冲突 → 未发现冲突则立即一次性原子 `UPDATE` 探针 ID、描述与数据源；更新行数必须为 1，任一步失败整笔回滚。该当次检查不消除检查与写入之间的并发竞态。编辑不级联处理其他表、进程、ZooKeeper/Kafka。 | CCFG-REQ-044~CCFG-REQ-048、CCFG-REQ-049、CCFG-REQ-066、CCFG-REQ-073 | CCFG-AC-038、CCFG-AC-039、CCFG-AC-040、CCFG-AC-054、CCFG-AC-060 |
| CCFG-DESIGN-018 | 删除流程（E5）：以探针 ID 定位，在短事务内直接物理 `DELETE` 该记录；不检查、不修改、不级联该探针与其他表/进程/ZooKeeper/Kafka 的关系；删除行数必须为 1，否则回滚并报“探针不存在或已删除”。删除成功后前端刷新（重新加载）列表（**【本轮定向修订 · 待批准】** 原“并清空选中”因本轮取消全部选择能力已不适用，由 §13 `CCFG-DESIGN-043` 与 `REQUIREMENTS.md` `CCFG-REQ-020/094` 取代；页面本无选中状态可清空）。 | CCFG-REQ-026、CCFG-REQ-027、CCFG-REQ-028 | CCFG-AC-020、CCFG-AC-021 |
| CCFG-DESIGN-019 | 停用流程（E7）：二次确认由前端负责；后端在短事务内仅把目标记录 `FG_ACTIVE` 更新为 `0`，行数必须为 1；历史数据源异常（停用/不存在/含逗号）不阻断停用。 | CCFG-REQ-030、CCFG-REQ-032、CCFG-REQ-035 | CCFG-AC-023、CCFG-AC-024、CCFG-AC-027 |
| CCFG-DESIGN-020 | 启用流程（E6）：一般不弹确认；后端在单个普通短事务内、目标 `UPDATE` 前重新读取 `CDC_CLIENT_MULTIPLE` 全部记录：读取目标记录并校验状态（非 `0/1` 直接拒绝，见 CCFG-DESIGN-021），执行与新增/编辑相同的当次数据源唯一分配检查（自排除目标记录自身）；仅重复分配冲突阻断启用（`40941`），其他数据源异常不阻断 → 未发现阻断则仅把 `FG_ACTIVE` 更新为 `1`，行数必须为 1，任一步失败整笔回滚。该当次检查不消除检查与写入之间的并发竞态。防止历史异常记录绕过新增/编辑规则。 | CCFG-REQ-031、CCFG-REQ-032、CCFG-REQ-035、CCFG-REQ-072 | CCFG-AC-022、CCFG-AC-024、CCFG-AC-027、CCFG-AC-059 |
| CCFG-DESIGN-021 | 非 `0/1` 状态边界：`fgActive` 非 `0/1` 的记录列表可见并显示原始状态值（`ABNORMAL`）；允许的操作仅限删除与停用（停用需二次确认并把 `FG_ACTIVE` 置 `0`）；接口层对这类记录的“启用”直接拒绝（错误码 `40240`）；状态列不提供“启用”操作（**【本轮定向修订 · 待批准】** 该项的**入口位置**已由 §13 `CCFG-DESIGN-041` 改为“操作”列“更多”下拉中不出现“启用”项，语义不变）；如需回到启用须先停用归 `0` 再启用（后者才触发唯一分配校验）。 | CCFG-REQ-033、CCFG-REQ-034 | CCFG-AC-025、CCFG-AC-026 |
| CCFG-DESIGN-022 | 写操作原子性与行数校验：新增/编辑/删除/启停均校验受影响行数必须等于 1；请求内校验失败、业务冲突（`40940`/`40941`/`40942` 等）、更新行数异常或任意校验失败时整笔回滚，不存在部分写入；编辑保存整体成功或整体失败。本 Feature 无“锁等待超时”失败分支（该专用路径已随并发口径调整删除，见 §7）；写前检查与 DML 之间的竞态非本项失败分支。 | CCFG-REQ-049、CCFG-REQ-074 | CCFG-AC-040、CCFG-AC-061 |

## 7. 并发边界与写前检查：确定方案

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-023 | 权威写前检查流程：对新增、编辑与启用，在同一个普通短事务内、在执行目标 DML 之前，重新读取 `CDC_CLIENT_MULTIPLE` 全部记录完成当次尽力写前检查——探针 ID ASCII 大小写不敏感唯一校验、数据源跨探针唯一分配校验（编辑按 `originalClientId`、启用按目标记录自身排除）、全部拟保存数据源须为可用候选（启用仅重复分配冲突阻断）；发现冲突则不执行 DML 并返回既有业务冲突（`40940`/`40941`）；未发现冲突则立即执行目标 DML。该检查是后端最终应用层校验，但不是并发强一致保证；检查与 DML 之间存在竞态窗口，本 Feature 不通过显式锁、行锁或任何串行化机制消除它。逻辑 SQL 形态见 `DATABASE.md` §4 与事务矩阵 §5。 | CCFG-REQ-038、CCFG-REQ-043、CCFG-REQ-048、CCFG-REQ-071 | CCFG-AC-030、CCFG-AC-039、CCFG-AC-058 |
| CCFG-DESIGN-024 | 明确不执行显式表锁、不提供专用锁等待错误：本 Feature 不执行 `LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5`，不存在由表锁等待产生的 `ORA-30006 → 50050 LOCK_WAIT_TIMEOUT` 专用路径，错误码表不含 `50050`（该路径及其表锁方案已过时且未获批准，随本设计并发口径调整清除，见 §13 变更记录）。应用层唯一性以 DML 前全量重读 + 当次尽力写前检查为准；Oracle 普通 DML 可能产生的其他数据库固有异常（如主键冲突）按既有全局未捕获异常边界处理，本 Feature 不另造本轮业务码。 | CCFG-REQ-085、CCFG-REQ-086 | CCFG-AC-071、CCFG-AC-072 |
| CCFG-DESIGN-025 | 技术取舍：前端禁选与后端当次写前检查都是尽力校验，能拦住普通顺序冲突，但不构成并发强一致唯一，也不为此引入跨请求串行化。为唯一性不强加以下任何手段：Java 进程内 `synchronized`/`ConcurrentHashMap`（只在本 JVM 内有效、多实例/重启失效）、Redis/分布式锁、独立锁表、`SELECT ... FOR UPDATE` 行锁（无法阻止检查后并发插入新行）、`LOCK TABLE` 显式表锁或 DDL 唯一约束。普通“先查后写”在检查与写入之间存在竞态窗口、极端并发下可能两笔都成功，这是为换取无显式锁、无 DDL、无额外基础设施的简单性而接受并明示的设计权衡；运行侧 `sync-client`/`sync-server` 使用配置时的重复分配检查为最终防线，不在本 Feature 范围。 | CCFG-REQ-038、CCFG-REQ-068、CCFG-REQ-071、CCFG-REQ-077 | CCFG-AC-030、CCFG-AC-056、CCFG-AC-058、CCFG-AC-064 |
| CCFG-DESIGN-026 | 无主动并发锁/无 DDL 的适用边界：本 Feature 不主动执行任何显式表锁或行锁，不引入 `DBMS_LOCK`、分布式锁、Redis、独立锁表、唯一函数索引、规范化关联表或任何 DDL；列表、数据源候选与写前检查重读均为普通一致性读、不加写锁。唯一分配与探针 ID 唯一均为应用层业务规则。Oracle 执行普通 `INSERT`/`UPDATE`/`DELETE` 时可能产生的行锁、TM 锁、主键冲突等固有数据库行为属正常数据库行为，不被包装成本 Feature 的业务唯一性保证。 | CCFG-REQ-090 | CCFG-AC-076 |
| CCFG-DESIGN-027 | 已接受的并发结果：每个写请求都在其事务内执行 DML 前全量重读 + 当次尽力写前检查。普通顺序冲突（两请求先后提交、后提交者的当次检查看到先提交者的结果）会被拒绝并返回既有业务冲突（`40940`/`40941`）；极端并发下两个请求可能都先通过各自检查再先后写入成功（如仅大小写不同的探针 ID、或争抢同一数据源），允许一笔成功、也允许两笔在竞态窗口中都成功，本 Feature 不承诺“并发最多一个成功”。若极端竞态产生近似重复 ID 或重复分配，列表按历史异常/冲突展示规则呈现，不作为 Feature 验收失败。 | CCFG-REQ-077 | CCFG-AC-064 |

## 8. UTF-8 BYTE 校验

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-028 | `CLIENT_DESC`（R1-03 固定保存/Trim/字节口径）：必填判定为“去除首尾空白后必须非空”，Trim 结果只用于判空、不覆盖不替换请求中的原始最终文本；数据库存储用户最终提交的原始文本（含首尾空白），不自动删除首尾空白、不改写内部字符。UTF-8 字节数 `<= 1024`（物理容量 `VARCHAR2(1024 BYTE)`）针对**实际准备保存的原始最终文本**计算，首尾空白也计入字节数。后端用 `StandardCharsets.UTF_8`（`getBytes(UTF_8).length`）计真实字节作为最终防线；前端用等价 UTF-8 编码（`TextEncoder`）对同一原文预校验，禁止用 JavaScript `.length`/字符数判断。纯 ASCII 原文恰 1024 字节可过、1025 必须拒；中文按常见 3 字节/字、Emoji 等补充字符按 4 字节计。 | CCFG-REQ-039 | CCFG-AC-033 |
| CCFG-DESIGN-029 | `DATA_SOURCE_ID`：序列化结果（去重、顺序、单逗号连接的完整字符串）按数据库 BYTE 语义校验不超过物理 `VARCHAR2(1000)`；字节计算与 CCFG-DESIGN-028 同一工具。超限拒绝保存（错误码 `40105`），并保持“至少 1 个”约束独立成立。 | CCFG-REQ-040 | CCFG-AC-034 |
| CCFG-DESIGN-030 | “自动生成”描述必须在临时变量中完整生成并按必填（去除首尾空白后非空）与“按原文 UTF-8 `<=1024 BYTE`”校验，校验通过后才原子替换输入框内容；任一已选数据源无法取得非空 `DATA_SOURCE_ORG`（此时明确指出该数据源 ID）、或结果去空白为空、或原文按 UTF-8 字节超限，则自动生成失败并给明确提示，保持原描述不变；不得静默截断。自动生成只对每个 `DATA_SOURCE_ORG` 片段 Trim，生成后用户的进一步编辑原样保存。提交阶段后端仍按**最终提交文本**做必填（Trim 仅判空）与原文 UTF-8 `<=1024 BYTE` 校验（R1-03，口径同 CCFG-REQ-059），不重新生成、不自动删除首尾空白、不比较其是否等于机构组合。 | CCFG-REQ-039、CCFG-REQ-059、CCFG-REQ-060 | CCFG-AC-033、CCFG-AC-048 |

## 9. 状态机与失败状态（页面级）

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-031 | 页面与操作状态机：页面加载（`LOADING` → `SUCCESS`/`EMPTY`/`FAILED`）；查询触发后回到加载；提交/删除/启停在按钮层进入 `SUBMITTING` 并禁用对应控件防重复提交，成功后刷新列表并复位；候选加载 `LOADING` → `SUCCESS`/`EMPTY`/`FAILED`。所有写操作都有加载、防重复提交与成功/失败反馈；无自动刷新。 | CCFG-REQ-007、CCFG-REQ-085 | CCFG-AC-006、CCFG-AC-071 |
| CCFG-DESIGN-032 | 生效边界与反馈约束：成功提示只表达“保存/删除/启用/停用成功”，不得声称“进程已停止/已启动/已重启”或“配置已实时生效”。后端不在写路径连接源库、不操作进程/ZK/Kafka。 | CCFG-REQ-090、CCFG-REQ-088、CCFG-REQ-089 | CCFG-AC-076、CCFG-AC-074、CCFG-AC-075 |

## 10. 测试设计（未来测试方案，本任务不执行）

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-033 | 未来后端/前端测试方案至少覆盖：CSV 解析/去重/序列化与异常判定；ASCII 大小写不敏感 ID 唯一性（含仅大小写修改自身）；UTF-8 1024 BYTE 边界（ASCII/中文/Emoji）；自动生成无选择严格无动作、失败不覆盖旧描述；CRUD、启停、异常历史回显、按原 ID 排除自身；普通顺序冲突（两请求先后提交、后提交者的当次检查看到先提交者结果而被拒，返回 `40940`/`40941`）；绕过前端直接调用接口时后端当次写前检查仍拒绝；单请求内写前检查 + DML 失败整笔回滚；并发测试验证每个请求都执行 DML 前全量重读与当次写前检查、系统不主动执行 `LOCK TABLE`、不存在专用 `50050` 错误路径——结果允许一笔成功也允许两笔都成功，不以“并发最多一个成功”为通过标准，若两笔均成功形成重复则验证列表按历史异常/冲突规则展示，不调用或模拟 sync-client/sync-server；Controller 契约与错误码。R1 增补测试场景：① `clientDesc` 原文保存口径——仅空白文本拒绝、带首尾空白但 Trim 后非空时允许并原样保存、原文恰 1024 BYTE 允许、Trim 后不超限但含首尾空白的原文超过 1024 BYTE 时拒绝（R1-03）；② 关键词自身含 `%`/`_`/`\` 时按普通字符参与不区分大小写字面量包含匹配（R1-04）；③ 数据源 ID 含非逗号字符（如空格、`@`）但精确存在于允许候选时不因“其他非法字符”被拒（R1-05）；④ `CATEGORY_MISMATCH`/`TYPE_MISMATCH` 在 E1 中被识别并回显、编辑保存被阻断、启用不被其阻断（R1-06）；⑤ 含逗号歧义行：普通 CSV 解析仅展示可确定 token、返回 `COMMA_PROTOCOL_AMBIGUOUS` 且不宣称无损还原、编辑阻断直至清除、含逗号数据源已删除时按 `NOT_FOUND` 而非猜测（R1-07）；⑥ 历史 `clientDesc` 为 NULL 时列表占位、编辑打开为空输入框、保存仍须 Trim 非空且原文 ≤1024 BYTE（R1-08）。 | CCFG-REQ-085、CCFG-REQ-086 | CCFG-AC-071、CCFG-AC-072 |
| CCFG-DESIGN-034 | 契约与范围边界测试：断言接口与页面不返回密码等敏感字段；断言不存在分页、自动刷新、进程/ZK/Kafka 调用、源库连接、Schema/表读取与任何 DDL；断言页面反馈无“实时生效/已启停”措辞。 | CCFG-REQ-087、CCFG-REQ-088、CCFG-REQ-089、CCFG-REQ-090 | CCFG-AC-073、CCFG-AC-074、CCFG-AC-075、CCFG-AC-076 |

## 11. PENDING_USER_CONFIRMATION 记录

- **已批准设计部分（`CCFG-DESIGN-001~037`）数量：`0`。** 本设计全部用户可见语义与业务规则均可由已批准需求 `CCFG-REQ-001~090` 推导，未发现必须由项目负责人另行决定、且需求无法推导的业务或用户可见空档。
- **本轮新增设计部分（`CCFG-DESIGN-038~046`）新增设计空档：`0`。** 本轮设计项均可由 `CCFG-REQ-091~103` 推导；不新增需要项目负责人另行决定的设计方案选择。
- **R0 转记项已关闭（`0` 项）**：R0 曾转记 1 项需求侧 `PENDING_USER_CONFIRMATION`——取消“删除所选”后，行单选与选中行视觉、以及“已选择：{探针ID}”提示文字是否保留。项目负责人已于本轮 R1 **明确决定全部取消**，该事项关闭并冻结为当前有效规则（见 `CCFG-DESIGN-040`、`REQUIREMENTS.md` `CCFG-REQ-020/022/094`）；不再作为待确认项、开放问题、风险待定或实现自由度保留。本设计与需求侧当前 `PENDING_USER_CONFIRMATION` 均为 **0**。
- **第二轮 V2 新增设计部分（`CCFG-DESIGN-047~053`）新增设计空档：`0`。** 本轮设计项均可由 `CCFG-REQ-104~112` 推导；五项视觉调整的具体数值均以参考页与公共预设的**真实样式**为确定来源（不保留“方案 A/B 待定”），标签尺寸变更后的测量盒模型核准作为实现阶段确定性动作记入 `CCFG-DESIGN-053`，不构成待确认项。
- **第三轮（本轮）新增设计部分（`CCFG-DESIGN-054~060`）新增设计空档：`0`。** 本轮设计项均可由 `CCFG-REQ-113~122` 推导；四项调整的具体目标数值（`+N` 弹层自然增高、弹窗约 900px、候选区可见高度与横向比例、标签/按钮视觉令牌）均以参考页实际样式、真实源码现状与已确认决定为**确定来源**，不保留“方案 A/B 待定”，不构成待确认项。`PENDING_USER_CONFIRMATION` 保持 **0**。
- **第四轮（本轮）新增设计部分（`CCFG-DESIGN-061~071`）新增设计空档：`0`。** 本轮设计项均可由 `CCFG-REQ-123~136` 推导；字段反馈区的稳定空间实现方式（固定最小高度或等价布局手段）、弹窗居中定位的具体测量与修正值、`errorCode` 到字段的归属映射均以**参考页实际样式、真实源码现状与真实视口测量**为**确定来源**，留待实现阶段以测量结果确定，**不**保留“方案 A/B 待定”，**不**构成待确认项。**后续“新增／编辑表单弹窗模板”入口（`CCFG-DESIGN-071`）仅是已确认的后续动作登记**，须在本轮实现完成并经项目负责人实际目测认可后另开独立任务，不是“无法从现行已批准基线唯一推导”的待确认项，故**不**计入本节；`PENDING_USER_CONFIRMATION` 保持 **0**。**R1 定向纠错（2026-09-24）**仅消除按钮旧规则与新规则的冲突、`CCFG-AC-131` 的不可能验收输入、以及 `CCFG-REQ-136` 到 `CCFG-UI-059` 的虚假追踪映射，**未**引入需项目负责人另行决定的业务或用户可见语义，本节 `PENDING_USER_CONFIRMATION` 仍为 **0**。

## 12. 追踪矩阵（设计项 → 需求/验收）

> 下列矩阵汇总四份设计文档（`DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`）对 136 条需求与 135 条验收的覆盖。逐文档的“设计项→需求/验收”列已在各文档对应表内给出；本表用于一次性核对 **136/136** 与 **135/135** 覆盖。
>
> 说明：第一轮页面级调整（`CCFG-REQ-091~103`、`CCFG-AC-077~089`）**只**涉及 `DESIGN.md`（新增 `CCFG-DESIGN-038~046`）与 `UI.md`（新增 `CCFG-UI-027~035`）；第二轮 V2 主列表视觉调整草案（`CCFG-REQ-104~112`、`CCFG-AC-090~104`）**只**涉及 `DESIGN.md`（新增 `CCFG-DESIGN-047~053`）与 `UI.md`（新增 `CCFG-UI-036~042`）；第三轮 `+N` 清单与新增／编辑弹窗视觉调整草案（`CCFG-REQ-113~122`、`CCFG-AC-105~117`）**只**涉及 `DESIGN.md`（新增 `CCFG-DESIGN-054~060`）与 `UI.md`（新增 `CCFG-UI-043~049`，并定向标注 `CCFG-UI-009`/`CCFG-UI-024`）；第四轮新增／编辑弹窗校验与交互调整（2026-09-24 批准收口为 `APPROVED`；`CCFG-REQ-123~136`、`CCFG-AC-118~135`）**只**涉及 `DESIGN.md`（新增 `CCFG-DESIGN-061~071`）与 `UI.md`（新增 `CCFG-UI-050~059`，并定向标注 `CCFG-UI-013`/`CCFG-UI-015`/`CCFG-UI-017`）。四轮均**不**修改 `API.md` 与 `DATABASE.md`（判定为无需变更，见执行报告）。因此这些新增需求/验收的覆盖项**只**出现 `CCFG-DESIGN-*` 与 `CCFG-UI-*` 编号，属预期而非缺项。
>
> **R1 说明（2026-09-24）**：`CCFG-REQ-136`／`CCFG-AC-135` 仅**登记**“未来另开任务提炼新增／编辑表单弹窗模板”这一后续入口，属**文档治理／范围声明**，本轮**无新增 UI 元素**，故其在 §12.1／§12.2 的覆盖项**仅**为 `CCFG-DESIGN-071`，**不**映射到 `CCFG-UI-059`（`CCFG-UI-059` 实际只承载探针描述长度、自动生成截断与历史回显，与该模板入口**无真实覆盖关系**，原映射属虚假覆盖，已移除）。该行为“无 UI 映射”**不是缺项**，也**不**以描述长度 UI 规则凑数；本轮**不**提前创建模板、**不**批准模板、**不**声称任何其他页面已接入。

### 12.1 需求覆盖矩阵（REQ → 覆盖设计项）

| 需求编号 | 覆盖设计项 |
|---|---|
| CCFG-REQ-001 | CCFG-DESIGN-003、CCFG-UI-001 |
| CCFG-REQ-002 | CCFG-DESIGN-005、CCFG-DESIGN-006、CCFG-API-004、CCFG-UI-002、CCFG-DB-008 |
| CCFG-REQ-003 | CCFG-DESIGN-005、CCFG-DESIGN-009、CCFG-API-003、CCFG-API-004、CCFG-UI-005 |
| CCFG-REQ-004 | CCFG-DESIGN-005、CCFG-DESIGN-009、CCFG-DB-018 |
| CCFG-REQ-005 | CCFG-DESIGN-005、CCFG-API-004、CCFG-DB-008 |
| CCFG-REQ-006 | CCFG-DESIGN-006、CCFG-DESIGN-007、CCFG-API-004、CCFG-UI-003、CCFG-DB-008、CCFG-DB-021 |
| CCFG-REQ-007 | CCFG-DESIGN-031、CCFG-API-004、CCFG-UI-003 |
| CCFG-REQ-008 | CCFG-UI-003 |
| CCFG-REQ-009 | CCFG-API-004、CCFG-UI-002、CCFG-UI-012 |
| CCFG-REQ-010 | CCFG-DESIGN-010、CCFG-DESIGN-036、CCFG-UI-026、CCFG-DB-004、CCFG-DB-008、CCFG-DB-022 |
| CCFG-REQ-011 | CCFG-DESIGN-037、CCFG-API-005、CCFG-UI-005、CCFG-UI-022、CCFG-UI-025 |
| CCFG-REQ-012 | CCFG-DESIGN-015、CCFG-UI-007、CCFG-UI-008 |
| CCFG-REQ-013 | CCFG-UI-007、CCFG-UI-022 |
| CCFG-REQ-014 | CCFG-API-005、CCFG-UI-007 |
| CCFG-REQ-015 | CCFG-UI-008、CCFG-UI-024 |
| CCFG-REQ-016 | CCFG-API-005、CCFG-UI-009、CCFG-UI-024 |
| CCFG-REQ-017 | CCFG-DESIGN-011、CCFG-DESIGN-014、CCFG-DESIGN-035、CCFG-API-005、CCFG-UI-010、CCFG-UI-022、CCFG-UI-024 |
| CCFG-REQ-018 | CCFG-DESIGN-012、CCFG-UI-011 |
| CCFG-REQ-019 | CCFG-DESIGN-011、CCFG-DESIGN-012、CCFG-DESIGN-014、CCFG-API-005、CCFG-UI-011 |
| CCFG-REQ-020 | CCFG-DESIGN-040、CCFG-UI-005、CCFG-UI-024 |
| CCFG-REQ-021 | CCFG-UI-004 |
| CCFG-REQ-022 | CCFG-UI-004 |
| CCFG-REQ-023 | CCFG-UI-004、CCFG-UI-005 |
| CCFG-REQ-024 | CCFG-UI-005 |
| CCFG-REQ-025 | CCFG-UI-004、CCFG-UI-019 |
| CCFG-REQ-026 | CCFG-DESIGN-018、CCFG-API-010、CCFG-DB-013 |
| CCFG-REQ-027 | CCFG-DESIGN-018、CCFG-API-010、CCFG-DB-013 |
| CCFG-REQ-028 | CCFG-DESIGN-018、CCFG-API-010、CCFG-UI-019 |
| CCFG-REQ-029 | CCFG-API-005、CCFG-UI-006 |
| CCFG-REQ-030 | CCFG-DESIGN-019、CCFG-API-012、CCFG-UI-018、CCFG-DB-005、CCFG-DB-014 |
| CCFG-REQ-031 | CCFG-DESIGN-020、CCFG-API-011、CCFG-UI-018、CCFG-DB-005、CCFG-DB-014 |
| CCFG-REQ-032 | CCFG-DESIGN-019、CCFG-DESIGN-020、CCFG-API-011、CCFG-API-012、CCFG-UI-018 |
| CCFG-REQ-033 | CCFG-DESIGN-006、CCFG-DESIGN-021、CCFG-API-005、CCFG-UI-006、CCFG-DB-005 |
| CCFG-REQ-034 | CCFG-DESIGN-021、CCFG-API-011、CCFG-UI-006、CCFG-DB-005 |
| CCFG-REQ-035 | CCFG-DESIGN-019、CCFG-DESIGN-020、CCFG-API-011、CCFG-API-012、CCFG-UI-018 |
| CCFG-REQ-036 | CCFG-API-013、CCFG-UI-013 |
| CCFG-REQ-037 | CCFG-API-008、CCFG-API-014、CCFG-UI-013、CCFG-DB-002 |
| CCFG-REQ-038 | CCFG-DESIGN-023、CCFG-DESIGN-025、CCFG-API-008、CCFG-API-014、CCFG-DB-002、CCFG-DB-010 |
| CCFG-REQ-039 | CCFG-DESIGN-028、CCFG-DESIGN-030、CCFG-DESIGN-037、CCFG-API-008、CCFG-API-015、CCFG-UI-013、CCFG-UI-025、CCFG-DB-001、CCFG-DB-003 |
| CCFG-REQ-040 | CCFG-DESIGN-010、CCFG-DESIGN-029、CCFG-API-008、CCFG-API-016、CCFG-UI-013、CCFG-DB-004 |
| CCFG-REQ-041 | CCFG-DESIGN-016、CCFG-API-008、CCFG-API-013、CCFG-UI-013、CCFG-DB-005、CCFG-DB-011 |
| CCFG-REQ-042 | CCFG-API-013、CCFG-UI-014 |
| CCFG-REQ-043 | CCFG-DESIGN-016、CCFG-DESIGN-023、CCFG-API-008 |
| CCFG-REQ-044 | CCFG-DESIGN-017、CCFG-API-009、CCFG-UI-014 |
| CCFG-REQ-045 | CCFG-DESIGN-017、CCFG-API-009、CCFG-UI-014 |
| CCFG-REQ-046 | CCFG-DESIGN-017、CCFG-API-009、CCFG-UI-014 |
| CCFG-REQ-047 | CCFG-DESIGN-017、CCFG-API-009 |
| CCFG-REQ-048 | CCFG-DESIGN-017、CCFG-DESIGN-023、CCFG-API-009、CCFG-DB-002、CCFG-DB-012 |
| CCFG-REQ-049 | CCFG-DESIGN-017、CCFG-DESIGN-022、CCFG-API-009、CCFG-DB-012、CCFG-DB-015、CCFG-DB-016 |
| CCFG-REQ-050 | CCFG-UI-015 |
| CCFG-REQ-051 | CCFG-API-013、CCFG-UI-015 |
| CCFG-REQ-052 | CCFG-UI-013、CCFG-UI-015 |
| CCFG-REQ-053 | CCFG-UI-015 |
| CCFG-REQ-054 | CCFG-UI-015 |
| CCFG-REQ-055 | CCFG-UI-015 |
| CCFG-REQ-056 | CCFG-UI-015 |
| CCFG-REQ-057 | CCFG-UI-015 |
| CCFG-REQ-058 | CCFG-DESIGN-037、CCFG-UI-014、CCFG-UI-015、CCFG-UI-025 |
| CCFG-REQ-059 | CCFG-DESIGN-030、CCFG-DESIGN-037、CCFG-API-009、CCFG-API-015、CCFG-UI-025、CCFG-DB-003 |
| CCFG-REQ-060 | CCFG-DESIGN-030、CCFG-UI-015 |
| CCFG-REQ-061 | CCFG-API-006、CCFG-UI-016、CCFG-DB-006、CCFG-DB-008、CCFG-DB-022 |
| CCFG-REQ-062 | CCFG-API-005、CCFG-API-006、CCFG-UI-016 |
| CCFG-REQ-063 | CCFG-API-006、CCFG-UI-016 |
| CCFG-REQ-064 | CCFG-DESIGN-036、CCFG-API-006、CCFG-UI-016、CCFG-UI-026、CCFG-DB-022 |
| CCFG-REQ-065 | CCFG-API-006、CCFG-UI-016 |
| CCFG-REQ-066 | CCFG-DESIGN-017、CCFG-API-006、CCFG-API-009、CCFG-UI-014、CCFG-UI-016 |
| CCFG-REQ-067 | CCFG-API-006、CCFG-API-007、CCFG-UI-012、CCFG-UI-016 |
| CCFG-REQ-068 | CCFG-DESIGN-013、CCFG-DESIGN-025、CCFG-API-016、CCFG-DB-007、CCFG-DB-010 |
| CCFG-REQ-069 | CCFG-DESIGN-013、CCFG-DB-010 |
| CCFG-REQ-070 | CCFG-DESIGN-013、CCFG-DB-010 |
| CCFG-REQ-071 | CCFG-DESIGN-023、CCFG-DESIGN-025、CCFG-API-008、CCFG-API-016 |
| CCFG-REQ-072 | CCFG-DESIGN-020、CCFG-API-011、CCFG-DB-016 |
| CCFG-REQ-073 | CCFG-DESIGN-017、CCFG-API-009、CCFG-DB-012 |
| CCFG-REQ-074 | CCFG-DESIGN-022、CCFG-API-016、CCFG-DB-015、CCFG-DB-016 |
| CCFG-REQ-075 | CCFG-DESIGN-013、CCFG-API-017 |
| CCFG-REQ-076 | CCFG-DESIGN-013、CCFG-API-017 |
| CCFG-REQ-077 | CCFG-DESIGN-025、CCFG-DESIGN-027、CCFG-DB-009、CCFG-DB-016、CCFG-DB-017 |
| CCFG-REQ-078 | CCFG-DESIGN-005、CCFG-DESIGN-014、CCFG-DESIGN-035、CCFG-DESIGN-036、CCFG-API-004、CCFG-UI-010、CCFG-UI-026、CCFG-DB-022 |
| CCFG-REQ-079 | CCFG-DESIGN-011、CCFG-DESIGN-035、CCFG-API-005、CCFG-UI-014、CCFG-UI-016 |
| CCFG-REQ-080 | CCFG-DESIGN-011、CCFG-DESIGN-015、CCFG-DESIGN-035、CCFG-DESIGN-036、CCFG-API-005、CCFG-API-018、CCFG-UI-014、CCFG-UI-016、CCFG-UI-026、CCFG-DB-022 |
| CCFG-REQ-081 | CCFG-DESIGN-035、CCFG-DESIGN-036、CCFG-API-017、CCFG-API-018、CCFG-UI-017、CCFG-UI-026 |
| CCFG-REQ-082 | CCFG-API-017、CCFG-API-018、CCFG-UI-017 |
| CCFG-REQ-083 | CCFG-DESIGN-035、CCFG-API-011、CCFG-API-012 |
| CCFG-REQ-084 | CCFG-DESIGN-014、CCFG-DESIGN-036、CCFG-API-005、CCFG-UI-026、CCFG-DB-010、CCFG-DB-022 |
| CCFG-REQ-085 | CCFG-DESIGN-001、CCFG-DESIGN-024、CCFG-DESIGN-031、CCFG-DESIGN-033、CCFG-API-001、CCFG-API-008、CCFG-API-019、CCFG-UI-017、CCFG-UI-023、CCFG-DB-009 |
| CCFG-REQ-086 | CCFG-DESIGN-024、CCFG-DESIGN-033、CCFG-API-001、CCFG-API-017、CCFG-UI-020 |
| CCFG-REQ-087 | CCFG-DESIGN-001、CCFG-DESIGN-008、CCFG-DESIGN-034、CCFG-API-002、CCFG-API-003、CCFG-API-005、CCFG-API-020、CCFG-DB-006 |
| CCFG-REQ-088 | CCFG-DESIGN-032、CCFG-DESIGN-034、CCFG-API-003、CCFG-API-020、CCFG-DB-019 |
| CCFG-REQ-089 | CCFG-DESIGN-032、CCFG-DESIGN-034、CCFG-API-003、CCFG-API-020、CCFG-DB-019 |
| CCFG-REQ-090 | CCFG-DESIGN-001、CCFG-DESIGN-002、CCFG-DESIGN-004、CCFG-DESIGN-026、CCFG-DESIGN-032、CCFG-DESIGN-034、CCFG-API-002、CCFG-API-003、CCFG-API-020、CCFG-UI-021、CCFG-DB-007、CCFG-DB-017、CCFG-DB-018、CCFG-DB-020 |
| CCFG-REQ-091 | CCFG-DESIGN-038、CCFG-UI-027 |
| CCFG-REQ-092 | CCFG-DESIGN-039、CCFG-UI-033 |
| CCFG-REQ-093 | CCFG-DESIGN-040、CCFG-UI-029 |
| CCFG-REQ-094 | CCFG-DESIGN-040、CCFG-DESIGN-043、CCFG-UI-029 |
| CCFG-REQ-095 | CCFG-DESIGN-041、CCFG-UI-028、CCFG-UI-032 |
| CCFG-REQ-096 | CCFG-DESIGN-041、CCFG-DESIGN-043、CCFG-UI-028、CCFG-UI-032 |
| CCFG-REQ-097 | CCFG-DESIGN-041、CCFG-DESIGN-045、CCFG-UI-032 |
| CCFG-REQ-098 | CCFG-DESIGN-041、CCFG-DESIGN-042、CCFG-DESIGN-043、CCFG-UI-032 |
| CCFG-REQ-099 | CCFG-DESIGN-046、CCFG-UI-028 |
| CCFG-REQ-100 | CCFG-DESIGN-044、CCFG-UI-028、CCFG-UI-030 |
| CCFG-REQ-101 | CCFG-DESIGN-045、CCFG-UI-028、CCFG-UI-031 |
| CCFG-REQ-102 | CCFG-DESIGN-045、CCFG-UI-035 |
| CCFG-REQ-103 | CCFG-DESIGN-038、CCFG-DESIGN-042、CCFG-DESIGN-043、CCFG-UI-034 |
| CCFG-REQ-104 | CCFG-DESIGN-047、CCFG-UI-036 |
| CCFG-REQ-105 | CCFG-DESIGN-048、CCFG-UI-037 |
| CCFG-REQ-106 | CCFG-DESIGN-049、CCFG-UI-038 |
| CCFG-REQ-107 | CCFG-DESIGN-050、CCFG-UI-039 |
| CCFG-REQ-108 | CCFG-DESIGN-050、CCFG-UI-039 |
| CCFG-REQ-109 | CCFG-DESIGN-050、CCFG-UI-039 |
| CCFG-REQ-110 | CCFG-DESIGN-051、CCFG-UI-040 |
| CCFG-REQ-111 | CCFG-DESIGN-052、CCFG-UI-041 |
| CCFG-REQ-112 | CCFG-DESIGN-053、CCFG-UI-042 |
| CCFG-REQ-113 | CCFG-DESIGN-054、CCFG-UI-043 |
| CCFG-REQ-114 | CCFG-DESIGN-054、CCFG-DESIGN-055、CCFG-UI-043、CCFG-UI-044 |
| CCFG-REQ-115 | CCFG-DESIGN-055、CCFG-UI-044 |
| CCFG-REQ-116 | CCFG-DESIGN-056、CCFG-UI-045 |
| CCFG-REQ-117 | CCFG-DESIGN-057、CCFG-UI-045 |
| CCFG-REQ-118 | CCFG-DESIGN-060、CCFG-UI-013、CCFG-UI-014、CCFG-UI-015、CCFG-UI-016、CCFG-UI-017 |
| CCFG-REQ-119 | CCFG-DESIGN-058、CCFG-UI-046 |
| CCFG-REQ-120 | CCFG-DESIGN-059、CCFG-UI-047 |
| CCFG-REQ-121 | CCFG-DESIGN-060、CCFG-UI-048 |
| CCFG-REQ-122 | CCFG-DESIGN-060、CCFG-UI-049 |
| CCFG-REQ-123 | CCFG-DESIGN-061、CCFG-UI-050 |
| CCFG-REQ-124 | CCFG-DESIGN-062、CCFG-UI-051 |
| CCFG-REQ-125 | CCFG-DESIGN-063、CCFG-UI-052 |
| CCFG-REQ-126 | CCFG-DESIGN-064、CCFG-UI-053 |
| CCFG-REQ-127 | CCFG-DESIGN-065、CCFG-UI-054 |
| CCFG-REQ-128 | CCFG-DESIGN-066、CCFG-UI-055 |
| CCFG-REQ-129 | CCFG-DESIGN-067、CCFG-UI-056 |
| CCFG-REQ-130 | CCFG-DESIGN-068、CCFG-UI-057 |
| CCFG-REQ-131 | CCFG-DESIGN-069、CCFG-UI-058 |
| CCFG-REQ-132 | CCFG-DESIGN-070、CCFG-UI-013、CCFG-UI-059 |
| CCFG-REQ-133 | CCFG-DESIGN-070、CCFG-UI-015、CCFG-UI-059 |
| CCFG-REQ-134 | CCFG-DESIGN-071、CCFG-UI-059 |
| CCFG-REQ-135 | CCFG-DESIGN-071 |
| CCFG-REQ-136 | CCFG-DESIGN-071 |

### 12.2 验收覆盖矩阵（AC → 覆盖设计项）

| 验收编号 | 覆盖设计项 |
|---|---|
| CCFG-AC-001 | CCFG-DESIGN-003、CCFG-UI-001 |
| CCFG-AC-002 | CCFG-DESIGN-005、CCFG-DESIGN-006、CCFG-API-004、CCFG-UI-002、CCFG-DB-008 |
| CCFG-AC-003 | CCFG-DESIGN-005、CCFG-DESIGN-009、CCFG-API-003、CCFG-API-004、CCFG-UI-005、CCFG-DB-018 |
| CCFG-AC-004 | CCFG-DESIGN-005、CCFG-API-004、CCFG-DB-008 |
| CCFG-AC-005 | CCFG-DESIGN-006、CCFG-DESIGN-007、CCFG-API-004、CCFG-UI-003、CCFG-DB-008、CCFG-DB-021 |
| CCFG-AC-006 | CCFG-DESIGN-031、CCFG-API-004、CCFG-UI-003 |
| CCFG-AC-007 | CCFG-UI-003 |
| CCFG-AC-008 | CCFG-API-004、CCFG-UI-002、CCFG-UI-012 |
| CCFG-AC-009 | CCFG-DESIGN-015、CCFG-DESIGN-037、CCFG-API-005、CCFG-UI-005、CCFG-UI-007、CCFG-UI-008、CCFG-UI-022、CCFG-UI-025 |
| CCFG-AC-010 | CCFG-UI-007、CCFG-UI-022 |
| CCFG-AC-011 | CCFG-UI-007、CCFG-UI-009、CCFG-UI-024 |
| CCFG-AC-012 | CCFG-UI-008、CCFG-UI-024 |
| CCFG-AC-013 | CCFG-DESIGN-011、CCFG-DESIGN-014、CCFG-DESIGN-035、CCFG-API-005、CCFG-UI-010、CCFG-UI-022、CCFG-UI-024 |
| CCFG-AC-014 | CCFG-DESIGN-010、CCFG-DB-004、CCFG-DB-008 |
| CCFG-AC-015 | CCFG-DESIGN-011、CCFG-DESIGN-012、CCFG-DESIGN-014、CCFG-API-005、CCFG-UI-011 |
| CCFG-AC-016 | CCFG-DESIGN-040、CCFG-UI-005、CCFG-UI-024 |
| CCFG-AC-017 | CCFG-UI-004 |
| CCFG-AC-018 | CCFG-UI-004、CCFG-UI-005 |
| CCFG-AC-019 | CCFG-UI-004、CCFG-UI-019 |
| CCFG-AC-020 | CCFG-DESIGN-018、CCFG-API-010、CCFG-UI-019、CCFG-DB-013 |
| CCFG-AC-021 | CCFG-DESIGN-018、CCFG-API-010、CCFG-UI-019、CCFG-DB-013 |
| CCFG-AC-022 | CCFG-DESIGN-020、CCFG-API-005、CCFG-API-011、CCFG-UI-006 |
| CCFG-AC-023 | CCFG-DESIGN-019、CCFG-API-012、CCFG-UI-018、CCFG-DB-005、CCFG-DB-014 |
| CCFG-AC-024 | CCFG-DESIGN-019、CCFG-DESIGN-020、CCFG-API-011、CCFG-API-012、CCFG-UI-018、CCFG-DB-005、CCFG-DB-014 |
| CCFG-AC-025 | CCFG-DESIGN-006、CCFG-DESIGN-021、CCFG-API-005、CCFG-UI-006、CCFG-DB-005 |
| CCFG-AC-026 | CCFG-DESIGN-021、CCFG-API-011、CCFG-UI-006、CCFG-DB-005 |
| CCFG-AC-027 | CCFG-DESIGN-019、CCFG-DESIGN-020、CCFG-DESIGN-035、CCFG-API-011、CCFG-API-012、CCFG-UI-018 |
| CCFG-AC-028 | CCFG-DESIGN-037、CCFG-API-008、CCFG-API-013、CCFG-UI-013、CCFG-UI-025 |
| CCFG-AC-029 | CCFG-API-008、CCFG-API-014、CCFG-UI-013、CCFG-DB-002 |
| CCFG-AC-030 | CCFG-DESIGN-016、CCFG-DESIGN-023、CCFG-DESIGN-025、CCFG-API-008、CCFG-API-014、CCFG-DB-002、CCFG-DB-010 |
| CCFG-AC-031 | CCFG-DESIGN-016、CCFG-API-008、CCFG-API-013、CCFG-UI-013、CCFG-DB-005、CCFG-DB-011 |
| CCFG-AC-032 | CCFG-API-013、CCFG-UI-014 |
| CCFG-AC-033 | CCFG-DESIGN-028、CCFG-DESIGN-030、CCFG-DESIGN-037、CCFG-API-008、CCFG-API-009、CCFG-API-015、CCFG-UI-013、CCFG-UI-025、CCFG-DB-001、CCFG-DB-003 |
| CCFG-AC-034 | CCFG-DESIGN-010、CCFG-DESIGN-029、CCFG-API-008、CCFG-API-016、CCFG-UI-013、CCFG-DB-004 |
| CCFG-AC-035 | CCFG-API-009、CCFG-UI-014 |
| CCFG-AC-036 | CCFG-API-009、CCFG-UI-014 |
| CCFG-AC-037 | CCFG-API-009、CCFG-UI-014 |
| CCFG-AC-038 | CCFG-DESIGN-017、CCFG-API-009 |
| CCFG-AC-039 | CCFG-DESIGN-017、CCFG-DESIGN-023、CCFG-API-009、CCFG-DB-002、CCFG-DB-012 |
| CCFG-AC-040 | CCFG-DESIGN-017、CCFG-DESIGN-022、CCFG-API-009、CCFG-DB-012、CCFG-DB-015、CCFG-DB-016 |
| CCFG-AC-041 | CCFG-UI-015 |
| CCFG-AC-042 | CCFG-API-013、CCFG-UI-015 |
| CCFG-AC-043 | CCFG-UI-015 |
| CCFG-AC-044 | CCFG-UI-015 |
| CCFG-AC-045 | CCFG-UI-015 |
| CCFG-AC-046 | CCFG-UI-015 |
| CCFG-AC-047 | CCFG-DESIGN-037、CCFG-UI-014、CCFG-UI-015、CCFG-UI-025 |
| CCFG-AC-048 | CCFG-DESIGN-030、CCFG-UI-015 |
| CCFG-AC-049 | CCFG-API-006、CCFG-UI-016、CCFG-DB-006、CCFG-DB-008、CCFG-DB-022 |
| CCFG-AC-050 | CCFG-API-005、CCFG-API-006、CCFG-UI-016 |
| CCFG-AC-051 | CCFG-API-006、CCFG-UI-016 |
| CCFG-AC-052 | CCFG-DESIGN-036、CCFG-API-006、CCFG-UI-016、CCFG-UI-026、CCFG-DB-022 |
| CCFG-AC-053 | CCFG-API-006、CCFG-UI-016 |
| CCFG-AC-054 | CCFG-DESIGN-017、CCFG-API-006、CCFG-API-009、CCFG-UI-014、CCFG-UI-016 |
| CCFG-AC-055 | CCFG-API-006、CCFG-API-007、CCFG-UI-012、CCFG-UI-016 |
| CCFG-AC-056 | CCFG-DESIGN-013、CCFG-DESIGN-025、CCFG-API-016、CCFG-DB-007、CCFG-DB-010 |
| CCFG-AC-057 | CCFG-DESIGN-013、CCFG-DB-010 |
| CCFG-AC-058 | CCFG-DESIGN-023、CCFG-DESIGN-025、CCFG-API-008、CCFG-API-016 |
| CCFG-AC-059 | CCFG-DESIGN-020、CCFG-API-011、CCFG-DB-016 |
| CCFG-AC-060 | CCFG-DESIGN-017、CCFG-API-009、CCFG-DB-012 |
| CCFG-AC-061 | CCFG-DESIGN-022、CCFG-API-016、CCFG-DB-015、CCFG-DB-016 |
| CCFG-AC-062 | CCFG-DESIGN-013、CCFG-API-017 |
| CCFG-AC-063 | CCFG-DESIGN-013、CCFG-API-017 |
| CCFG-AC-064 | CCFG-DESIGN-025、CCFG-DESIGN-027、CCFG-DB-009、CCFG-DB-016、CCFG-DB-017 |
| CCFG-AC-065 | CCFG-DESIGN-005、CCFG-DESIGN-014、CCFG-DESIGN-035、CCFG-DESIGN-036、CCFG-API-004、CCFG-UI-010、CCFG-UI-026、CCFG-DB-022 |
| CCFG-AC-066 | CCFG-DESIGN-011、CCFG-DESIGN-035、CCFG-API-005、CCFG-UI-014、CCFG-UI-016 |
| CCFG-AC-067 | CCFG-DESIGN-011、CCFG-DESIGN-015、CCFG-DESIGN-035、CCFG-DESIGN-036、CCFG-API-005、CCFG-API-018、CCFG-UI-014、CCFG-UI-016、CCFG-UI-026、CCFG-DB-022 |
| CCFG-AC-068 | CCFG-DESIGN-035、CCFG-DESIGN-036、CCFG-API-017、CCFG-API-018、CCFG-UI-017、CCFG-UI-026 |
| CCFG-AC-069 | CCFG-API-017、CCFG-API-018、CCFG-UI-017 |
| CCFG-AC-070 | CCFG-DESIGN-014、CCFG-DESIGN-036、CCFG-API-005、CCFG-UI-026、CCFG-DB-010、CCFG-DB-022 |
| CCFG-AC-071 | CCFG-DESIGN-001、CCFG-DESIGN-024、CCFG-DESIGN-031、CCFG-DESIGN-033、CCFG-API-001、CCFG-API-008、CCFG-API-019、CCFG-UI-017、CCFG-UI-023、CCFG-DB-009 |
| CCFG-AC-072 | CCFG-DESIGN-024、CCFG-DESIGN-033、CCFG-API-001、CCFG-API-017、CCFG-UI-020 |
| CCFG-AC-073 | CCFG-DESIGN-001、CCFG-DESIGN-008、CCFG-DESIGN-034、CCFG-API-002、CCFG-API-003、CCFG-API-005、CCFG-API-020、CCFG-DB-006 |
| CCFG-AC-074 | CCFG-DESIGN-032、CCFG-DESIGN-034、CCFG-API-003、CCFG-API-020、CCFG-DB-019 |
| CCFG-AC-075 | CCFG-DESIGN-032、CCFG-DESIGN-034、CCFG-API-003、CCFG-API-020、CCFG-DB-019 |
| CCFG-AC-076 | CCFG-DESIGN-001、CCFG-DESIGN-002、CCFG-DESIGN-004、CCFG-DESIGN-026、CCFG-DESIGN-032、CCFG-DESIGN-034、CCFG-API-003、CCFG-API-020、CCFG-UI-021、CCFG-DB-007、CCFG-DB-017、CCFG-DB-018、CCFG-DB-020 |
| CCFG-AC-077 | CCFG-DESIGN-038、CCFG-UI-027 |
| CCFG-AC-078 | CCFG-DESIGN-039、CCFG-UI-033 |
| CCFG-AC-079 | CCFG-DESIGN-040、CCFG-UI-029 |
| CCFG-AC-080 | CCFG-DESIGN-040、CCFG-DESIGN-043、CCFG-UI-029 |
| CCFG-AC-081 | CCFG-DESIGN-041、CCFG-UI-028 |
| CCFG-AC-082 | CCFG-DESIGN-041、CCFG-DESIGN-043、CCFG-UI-028、CCFG-UI-032 |
| CCFG-AC-083 | CCFG-DESIGN-041、CCFG-DESIGN-045、CCFG-UI-032 |
| CCFG-AC-084 | CCFG-DESIGN-041、CCFG-DESIGN-042、CCFG-DESIGN-043、CCFG-UI-032 |
| CCFG-AC-085 | CCFG-DESIGN-046、CCFG-UI-028 |
| CCFG-AC-086 | CCFG-DESIGN-044、CCFG-UI-028、CCFG-UI-030 |
| CCFG-AC-087 | CCFG-DESIGN-045、CCFG-UI-028、CCFG-UI-031 |
| CCFG-AC-088 | CCFG-DESIGN-045、CCFG-UI-035 |
| CCFG-AC-089 | CCFG-DESIGN-038、CCFG-DESIGN-042、CCFG-UI-034 |
| CCFG-AC-090 | CCFG-DESIGN-047、CCFG-UI-036 |
| CCFG-AC-091 | CCFG-DESIGN-048、CCFG-UI-037 |
| CCFG-AC-092 | CCFG-DESIGN-049、CCFG-UI-038 |
| CCFG-AC-093 | CCFG-DESIGN-049、CCFG-UI-038、CCFG-UI-042 |
| CCFG-AC-094 | CCFG-DESIGN-050、CCFG-UI-039 |
| CCFG-AC-095 | CCFG-DESIGN-050、CCFG-UI-039 |
| CCFG-AC-096 | CCFG-DESIGN-050、CCFG-UI-039 |
| CCFG-AC-097 | CCFG-DESIGN-050、CCFG-UI-039 |
| CCFG-AC-098 | CCFG-DESIGN-050、CCFG-UI-039 |
| CCFG-AC-099 | CCFG-DESIGN-050、CCFG-UI-039 |
| CCFG-AC-100 | CCFG-DESIGN-051、CCFG-UI-040 |
| CCFG-AC-101 | CCFG-DESIGN-052、CCFG-UI-041 |
| CCFG-AC-102 | CCFG-DESIGN-052、CCFG-UI-041 |
| CCFG-AC-103 | CCFG-DESIGN-052、CCFG-UI-041 |
| CCFG-AC-104 | CCFG-DESIGN-053、CCFG-UI-042 |
| CCFG-AC-105 | CCFG-DESIGN-054、CCFG-UI-043 |
| CCFG-AC-106 | CCFG-DESIGN-054、CCFG-UI-043 |
| CCFG-AC-107 | CCFG-DESIGN-054、CCFG-UI-043 |
| CCFG-AC-108 | CCFG-DESIGN-055、CCFG-UI-044 |
| CCFG-AC-109 | CCFG-DESIGN-055、CCFG-UI-044 |
| CCFG-AC-110 | CCFG-DESIGN-055、CCFG-UI-044 |
| CCFG-AC-111 | CCFG-DESIGN-056、CCFG-UI-045 |
| CCFG-AC-112 | CCFG-DESIGN-057、CCFG-UI-045 |
| CCFG-AC-113 | CCFG-DESIGN-060、CCFG-UI-013、CCFG-UI-014、CCFG-UI-015、CCFG-UI-016、CCFG-UI-017 |
| CCFG-AC-114 | CCFG-DESIGN-058、CCFG-UI-046 |
| CCFG-AC-115 | CCFG-DESIGN-059、CCFG-UI-047 |
| CCFG-AC-116 | CCFG-DESIGN-060、CCFG-UI-048 |
| CCFG-AC-117 | CCFG-DESIGN-060、CCFG-UI-049 |
| CCFG-AC-118 | CCFG-DESIGN-061、CCFG-UI-050 |
| CCFG-AC-119 | CCFG-DESIGN-061、CCFG-UI-050 |
| CCFG-AC-120 | CCFG-DESIGN-062、CCFG-UI-051 |
| CCFG-AC-121 | CCFG-DESIGN-063、CCFG-UI-052 |
| CCFG-AC-122 | CCFG-DESIGN-064、CCFG-UI-053 |
| CCFG-AC-123 | CCFG-DESIGN-065、CCFG-UI-054 |
| CCFG-AC-124 | CCFG-DESIGN-066、CCFG-UI-055 |
| CCFG-AC-125 | CCFG-DESIGN-066、CCFG-UI-055 |
| CCFG-AC-126 | CCFG-DESIGN-067、CCFG-UI-056 |
| CCFG-AC-127 | CCFG-DESIGN-068、CCFG-UI-057 |
| CCFG-AC-128 | CCFG-DESIGN-061、CCFG-DESIGN-069、CCFG-UI-058 |
| CCFG-AC-129 | CCFG-DESIGN-069、CCFG-UI-058 |
| CCFG-AC-130 | CCFG-DESIGN-070、CCFG-UI-013、CCFG-UI-059 |
| CCFG-AC-131 | CCFG-DESIGN-070、CCFG-UI-059 |
| CCFG-AC-132 | CCFG-DESIGN-070、CCFG-UI-015、CCFG-UI-059 |
| CCFG-AC-133 | CCFG-DESIGN-071、CCFG-UI-059 |
| CCFG-AC-134 | CCFG-DESIGN-071 |
| CCFG-AC-135 | CCFG-DESIGN-071 |

## 13. 页面级模板选择性接入与列表调整（本轮新增 · 2026-09-22 批准收口为 `APPROVED`）

> 本节为本轮页面级调整新增设计项（`CCFG-DESIGN-038~046`），**已于 2026-09-22 经项目负责人批准**（`adjustment_baseline_status=APPROVED`，`adjustment_approval_status=APPROVED_BY_PROJECT_OWNER`，批准依据：ChatGPT 对 R3 结果提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0` 的远程复审结论 `APPROVED`，项目负责人原话 `批准本轮探针端管理页面调整基线`；此前草案状态 `DRAFT_PENDING_USER_REVIEW` 属历史状态）、**尚未实现**（`NOT_STARTED`）、**尚未执行验收**（`NOT_RUN`）。设计编号在本文件既有最大编号 `CCFG-DESIGN-037` 之后连续新增，**不**复用旧编号、**不**重排历史编号。本节只覆盖 `/config/client` 单页；既有 Feature 实现事实为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，本轮不改写、不抹除。**页面级授权已经获得**：项目负责人已就 `/config/client` 单页授予“查询列表页模板”选择性接入授权（该页明确不启用刷新能力）与“列表表格视觉模板”主列表接入授权，记录见 `docs/baseline/query-list-page-template/MIGRATION.md` 与 `docs/baseline/list-table-visual-template/MIGRATION.md` 的页面级追加记录；该授权是页面级授权事实，**不**修改模板级全局迁移状态（保持 `NOT_STARTED` / `NOT_GRANTED` / `NOT_DECIDED`），**不**构成对其他任何页面的授权，本次批准收口**不新增、不扩大**该授权范围；**批准基线 ≠ 已实现 ≠ 已目测 ≠ 已验收**。本节所属本轮批准收口的下一入口为 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`（ChatGPT 远程独立复审本次 R2 状态/入口纠错的结果提交；历史入口 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW` 已完成并返回 `CHANGES_REQUIRED`；该 R2 复审亦早已完成，仅作历史记录；**现行下一入口**见 §15 与 `README.md` §5：`CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_APPROVAL_CLOSEOUT_REVIEW`）。

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-038 | 页面层选择性接入边界：页面的页面壳、标题与描述、查询区、查询/重置动作、结果区、错误槽与 Loading 稳定性复用已批准“查询列表页模板”的公共组件（页面壳 / 查询面板 / 查询与重置动作 / 结果面板）；**不**接入刷新工具栏组件；模板只提供页面层结构与交互，本 Feature 的 CRUD 写操作、新增/编辑弹窗、业务校验、行级操作与并发语义仍由本 Feature 自身承担，不被模板接管或改写。 | CCFG-REQ-091 | CCFG-AC-077 |
| CCFG-DESIGN-039 | 无刷新能力（确定性方案）：页面**不**注册任何轮询定时器、**不**渲染刷新按钮 / 刷新倒计时 / “最近刷新时间”；删除成功后与查询成功后的列表重载一律走既有的普通查询数据流（同 CCFG-DESIGN-005），**不**新增独立“刷新”动作、**不**新增刷新专用接口或组件。既有查询 / 重置 / 首入自动查询 / 失败可重试语义不变。 | CCFG-REQ-028、CCFG-REQ-092 | CCFG-AC-021、CCFG-AC-078 |
| CCFG-DESIGN-040 | 结果区头部组合与**取消全部选择能力**：结果区头部采用“左侧摘要 / 右侧操作”布局，“新增探针”按钮置于头部**最右侧**（与数据源管理参考页的右侧新增按钮位置一致）；移除原左侧工具栏写操作按钮；**取消**“删除所选”按钮及与之绑定的禁用判定与选中计数显示逻辑。同时按项目负责人本轮决定**取消全部选择能力**：主列表不提供任何行单选机制，不保留选择状态/选择事件/选择键/已选行集合/当前选中行概念，不渲染选中行背景、高亮、左侧强调线或其他“当前选中”视觉，也不显示“已选择：{探针ID}”或等价已选提示（原 `CCFG-REQ-020/022` 与 `PENDING_USER_CONFIRMATION` 处理一并取代）；删除、启用、停用一律从该行“更多”下拉进入，不以行选中为前提（`CCFG-DESIGN-041`）；查询/重置/重新加载/删除成功后不存在“清空选中项”动作，取消删除/停用确认后也不存在“保留选中项”语义。保留双击行编辑与探针 ID 键盘编辑，二者与取消单选互不冲突。 | CCFG-REQ-021、CCFG-REQ-022、CCFG-REQ-093、CCFG-REQ-094、CCFG-REQ-020 | CCFG-AC-016、CCFG-AC-017、CCFG-AC-079、CCFG-AC-080 |
| CCFG-DESIGN-041 | 操作列与事件边界：主列表最右侧新增**固定**“操作”列，唯一文字入口为“更多”下拉；该入口及其下拉项的 `click` 与 `dblclick` 必须**阻止冒泡**到行，避免误触发 `@row-dblclick`（打开编辑弹窗）；因本轮已取消全部选择能力（`CCFG-DESIGN-040`），不存在 `@row-click` 改变选中的语义，也不得再描述为“点击更多后保持/切换选中行”。下拉命令按 `fgActive` 决定条目——`'1'` → {停用, 删除}，`'0'` → {启用, 删除}，非 `0/1`（`ABNORMAL`，见 CCFG-DESIGN-006/021）→ 仅 {停用, 删除}，不提供“启用”。删除 / 停用 / 启用命令沿用既有 E5 / E7 / E6 与二次确认语义，仅入口位置变化。 | CCFG-REQ-095、CCFG-REQ-096、CCFG-REQ-097、CCFG-REQ-098 | CCFG-AC-018、CCFG-AC-019、CCFG-AC-082、CCFG-AC-083 |
| CCFG-DESIGN-042 | 行级忙碌与防重复：下拉命令执行期间对该行进入**行级**忙碌状态（禁用该行的“更多”入口或对应命令项），禁止同一下拉项重复提交；沿用既有写操作防重复与失败复位契约（CCFG-DESIGN-022、CCFG-DESIGN-031），不引入全局锁、不阻塞其他行的独立操作。 | CCFG-REQ-085、CCFG-REQ-098 | CCFG-AC-071、CCFG-AC-084 |
| CCFG-DESIGN-043 | 写接口复用（确定性方案）：删除复用既有 E5 删除接口、停用复用 E7、启用复用 E6；**不**新增批量删除接口，**不**新增任何批量删除的前端调用路径；删除成功后重新加载列表（**【本轮定向修订 · 待批准】** 原“并清空选中”因本轮取消全部选择能力已不适用，见 `CCFG-DESIGN-018/040`）；后端契约、错误码与写前校验（CCFG-DESIGN-023）零改动。 | CCFG-REQ-094、CCFG-REQ-096、CCFG-REQ-098 | CCFG-AC-080、CCFG-AC-082、CCFG-AC-084 |
| CCFG-DESIGN-044 | 序号列计算：第一列“序号”为**纯前端展示列**，按当前列表数据数组顺序以 `index + 1` 计算并渲染；不参与接口契约、不写入数据库、不参与排序与过滤；因页面不分页故连续；查询 / 重置后重新加载 / 数据集替换后按新数组顺序重新连续编号。 | CCFG-REQ-100 | CCFG-AC-086 |
| CCFG-DESIGN-045 | 探针 ID 三态状态标识（**已冻结，不再留待实现阶段决定**）：探针 ID 单元格内、探针 ID 之后的状态标识严格按三态渲染：`fgActive === '1'` 不渲染任何状态标识；`fgActive === '0'` 渲染“停用”标识，其几何（内联布局、上下留白、高度、圆角）与配色沿用数据源管理参考页“数据源 ID”标记的等价实现（不复制其业务语义）；其他历史异常值（按 CCFG-DESIGN-006 判定为 `ABNORMAL`）渲染**红色**标识，固定文案 `异常：{原始值}`，`{原始值}` 取接口返回的原始 `fgActive` 字符串原样展示（`FG_ACTIVE` 为 `VARCHAR2(1) NOT NULL`，Oracle 空串等价 NULL，故 `null`/空串在数据契约下不可能出现；对单个空白字符等不可直接肉眼分辨的值，以可见定界方式如半角引号包裹原样呈现），不得静默转成启用/停用、不得只显示“异常”而隐藏值、不得自行创造后端语义；红色标识必须具备可读对比度且不只靠颜色表达异常（完整文案本身即语义载体）。标识的位置（紧跟探针 ID）、间距、超长处理与 Tooltip 规则不得挤压或覆盖“操作”列；操作下拉按 CCFG-DESIGN-041 对该类记录只提供 {停用, 删除}。 | CCFG-REQ-033、CCFG-REQ-034、CCFG-REQ-097、CCFG-REQ-101、CCFG-REQ-102 | CCFG-AC-083、CCFG-AC-087、CCFG-AC-088 |
| CCFG-DESIGN-046 | 列表表格视觉模板接入与技术隔离：主列表 `el-table` 根元素**追加**模板显式根类并**保留**原有业务类，样式通过 scoped 方式引入模板 CSS 预设；模板公共层只声明“令牌默认回退值”、**不**声明具体令牌值，**不**新增全局样式块（不得定义在 `:root`/`body`），**不**使用 `!important`，**不**新增 Vue 包装组件、**不**新增额外 DOM 层；模板只作用于页面主列表（`el-table` 根元素），新增/编辑弹窗及其内部控件（含弹窗内表格）**不**接入该模板。 | CCFG-REQ-099 | CCFG-AC-085 |

## 14. 探针端管理主列表视觉调整（第二轮 V2 · 2026-09-23 草案建立 → V2 复审 `CHANGES_REQUIRED` → R1 纠错 → 2026-09-23 批准收口为 `APPROVED`）

> 本节为**第二轮**主列表视觉调整草案新增设计项（`CCFG-DESIGN-047~053`，共 7 条），依据项目负责人查看 `/config/client` 与 `/config/data-source` 页面后**已明确确认的五项调整决定**建立**草案**。**状态分层**：本轮草案基线 `adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`、本轮实现 `adjustment2_implementation_status=NOT_STARTED`、本轮正式验收 `formal_acceptance_execution_status=NOT_RUN`（`CCFG-AC-090~104`，15 条全部 `NOT_RUN`）；§13（`CCFG-DESIGN-038~046`）此前已批准基线保持 `APPROVED`、既有页面实现事实保持 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，本节**不改写、不抹除**。**项目负责人对五项产品决策的口头/聊天确认不等于本节草案已经复审和正式批准，更不等于调整已实现或验收通过。** 设计编号在本文件既有最大编号 `CCFG-DESIGN-046` 之后连续新增，**不**复用旧编号、**不**重排历史编号。
>
> **参考来源效力边界**：参考页 `/config/data-source` **仅作视觉对照**，本节规则**只**作用于 `/config/client` 主列表；**不**修改数据源管理的代码、文档、状态、行为，**不**修改模板级全局配置（`docs/baseline/**` 的模板状态保持 `NOT_STARTED` / `NOT_GRANTED` / `NOT_DECIDED`）。本节所列 `#hex`/像素数值均为**参考页实现事实**（供实现阶段核对），**不是**测试通过证据；实现必须**以真实参考页样式与实际视口为准**，用户提供的截图是**期望视觉来源**而非验收证据。本节**不**触碰 `API.md` 与 `DATABASE.md`（判定为无需变更）。
>
> **时序说明**：§13 历史结尾所述“本轮当前下一入口 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`”以及 `README.md` 历史实现记录中的 `CHATGPT_REMOTE_CLIENT_CONFIG_PAGE_ADJUSTMENT_IMPLEMENTATION_REVIEW` 入口，**均为该时点的历史表述**；截至 2026-09-23，页面级调整实现 `de23b68d1999425d14c2753515b237711147b826` **已**经 ChatGPT 从远程 Git 独立代码复审通过。此处仅追加时序说明，**不**擦除历史记录、**不**改写 `CCFG-DESIGN-038~046` 定义行、**不**自行宣布页面最终接受。其后的 V2 草案下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_R1_REVIEW`（V2 草案已经 ChatGPT 从远程 Git 独立复审、结论 `CHANGES_REQUIRED`，由 R1 纠错任务 `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1` 承接；历史入口 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_REVIEW` 照实保留）**其后亦已完成、结论 `APPROVED`**，属该时点的历史入口。其后的第三轮 R1 结果远程复审入口 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_R1_REVIEW`（R0 草案经 ChatGPT 远程复审 `CHANGES_REQUIRED`、R1 定向纠错承接）**其后亦已完成、结论 `APPROVED`**，属该时点的历史入口。**现行下一入口**为第三轮批准收口的远程复审 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（见 §15）。
>
> **现行状态（2026-09-23 批准收口后追加，不改写上述历史表述）**：本节 2026-09-23 草案建立时的分层状态为 `adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment2_implementation_status=NOT_STARTED`、本轮正式验收 `NOT_RUN`，该“草案／待复审”措辞属**草案阶段**的真实状态。其后 V2 草案 R1 纠错提交 `3830cba16142b4e2ad88f1fa96682ea8397a1203` 经 ChatGPT 从远程 Git 独立复审、结论 `APPROVED`（R1 纠错通过），项目负责人于 2026-09-23 明确回复原话 `批准本轮五项视觉调整基线`。**当前分层状态**：`adjustment2_baseline_status=APPROVED`、`adjustment2_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment2_approval_date=2026-09-23`、`adjustment2_approved_reviewed_commit=3830cba16142b4e2ad88f1fa96682ea8397a1203`；`adjustment2_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（本条为 R1 更新后的**现行状态**：前端实现已由 `CLIENT-CONFIG-VISUAL-FOLLOWUP-IMPLEMENTATION-001` 于 2026-09-23 完成，并经 ChatGPT 从远程 Git 对实现提交 `fecf5a06d90c690b5ee984a9e487f05322e1dd70` 独立代码复审通过，当前等待项目负责人页面目测/接受；其完成时点状态 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 与批准收口时点的 `NOT_STARTED` 属历史事实，批准**不**等于已实现、复审通过**不**等于已目测或已验收）；本轮正式验收 `NOT_RUN`。§13（`CCFG-DESIGN-038~046`）此前已批准基线保持 `APPROVED`，既有实现事实保持 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，均不改写。批准范围**仅**为 `/config/client` 主列表五项（黑色新增按钮、ID 正文对齐、行高跟随参考页、采集数据源标签绿/红/中性三态且独立行级歧义警示保持红色、操作列水平三点图标及改进菜单），**不**扩大到本轮不改项、其他页面或模板级全局迁移；`API.md`/`DATABASE.md` 未修改。

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-047 | 新增按钮黑色实心化：结果区头部最右侧“新增探针”按钮改为与参考页“新增数据源”同款**黑色实心主按钮**，保留加号图标、按钮文案、位置与既有新增行为；**不**顺带改变“查询”“重置”等按钮（`CCFG-UI-008`/`CCFG-UI-009` 不变）。视觉以参考页实际样式为准（参考实现事实：`:not(.is-disabled)` 限定 `#09090b` 底与边框、`#ffffff` 文字、圆角 6px、字重 500，Hover/聚焦 `#27272a`，按下 `#18181b`；禁用态沿用 Element Plus 既有禁用视觉），**不**自行发明配色。 | CCFG-REQ-104 | CCFG-AC-090 |
| CCFG-DESIGN-048 | 探针 ID 正文视觉对齐：探针 ID 单元格的 **ID 正文文本**采用参考页“数据源 ID”同款**字重与颜色**（参考实现事实：字重 600、颜色 `#09090b`，可沿用等宽字体族与表格数字对齐）。ID 之后的“停用”标识与历史异常原值标识**保持各自现行语义与视觉**（`CCFG-DESIGN-045` / `CCFG-UI-031` / `CCFG-UI-035` 不变），**不**对整列文本或标识笼统加粗改色；ID 的单行省略、完整值 Tooltip 与点击/键盘编辑入口行为**保持**不变。 | CCFG-REQ-105 | CCFG-AC-091 |
| CCFG-DESIGN-049 | 行高跟随参考页实际规则（确定性方案）：**移除**本页对主列表行的固定像素行高（现状 `.cc-table :deep(.el-table__row) { height: 60px }` 类固定值不再适用），改为由**公共表格视觉预设**的单元格上下内边距（`var(--lt-body-cell-padding, 12px 0)` 等）与内容共同决定行高；**不**凭截图写死像素值；**不**改动全局模板或公共预设本身（公共层**不**新增行高令牌、**不**声明 `line-height`/`height`/`max-height`，保持既有公共层边界）。缩行后探针 ID 三态标识、采集数据源标签、行级提示、`+N` 与“操作”列入口仍必须可读、可点；行双击编辑、探针 ID 键盘编辑、表头与最右固定列行为保持正常；新增/编辑弹窗内的表格**不**受影响。 | CCFG-REQ-106 | CCFG-AC-092、CCFG-AC-093 |
| CCFG-DESIGN-050 | 采集数据源标签三态视觉模型：标签借用参考页“角色”标签视觉语言（参考实现事实：高度 20px、字号 12px、字重 600、圆角 4px、**无边框**、柔和底色），并采用**绿色／红色／中性色**三态，优先级自高至低为：① 该数据源存在既有 `anomalies` → **红色**并保留异常原因与冲突探针 Tooltip；② 否则若**整行**存在 `COMMA_PROTOCOL_AMBIGUOUS`（现有 `isRowAmbiguous(row)` 判定）→ **中性色**，**不**暗示该关联已确认为正常；③ 否则 → **绿色**，语义为“**当前未检测到异常**”，**不是**参考页“角色”意义上的“目标库”角色。红色异常**不**因整行歧义降级为中性色；**独立的行级歧义警示标识保持原有红色警示样式及原有 Tooltip/文案不变（`CCFG-UI-013` 定义行不改写、语义不变）**——中性色**仅**适用于 `COMMA_PROTOCOL_AMBIGUOUS` 行中**没有项级 `anomalies`** 的采集数据源标签，该标签若存在项级异常则仍为红色。采集数据源列既有语义**保持**不变：数据源 ORG／ID 回退、异常项优先、单行最多直接显示 6 个、窄列溢出时 `+N` 与展开完整清单（去重后按原存储顺序，异常项不隐藏）——`CCFG-DESIGN-028`/`CCFG-DESIGN-030` 语义零改动，仅观感随标签尺寸/配色变化。标签尺寸/字号/内边距变更后，实现阶段必须同步核准单行可见数量与 `+N` 的**测量盒模型**（重算宽度测量基准），避免标签遮挡或 `+N` 误计数。 | CCFG-REQ-107、CCFG-REQ-108、CCFG-REQ-109 | CCFG-AC-094、CCFG-AC-095、CCFG-AC-096、CCFG-AC-097、CCFG-AC-098、CCFG-AC-099 |
| CCFG-DESIGN-051 | 操作列入口统一为三点图标：主列表“操作”列**全部行**的唯一入口由“更多”文字统一改为**水平三点图标（Ellipsis）**；**不**保留“部分行文字、部分行图标”的过渡状态。图标须具有足够命中区域、明确键盘焦点与可访问名称（如“更多操作：{探针ID}”）。下拉条目与业务语义**保持** `CCFG-DESIGN-041` 不变：按 `FG_ACTIVE` 三态渲染——`'1'` → {停用, 删除}，`'0'` → {启用, 删除}，非 `0/1`（`ABNORMAL`）→ 仅 {停用, 删除}（**不**出现“启用”）。 | CCFG-REQ-110 | CCFG-AC-100 |
| CCFG-DESIGN-052 | 三点菜单视觉与事件边界：三点图标单击展开的菜单采用柔和圆角、弥散阴影、适当内边距与清晰 Hover／焦点反馈，并以**分隔线**将红色警示“删除”单独隔开（条目顺序仍为先“停用/启用”后“删除”）；菜单可键盘操作、禁用态可辨识；点击/双击三点触发器、以及菜单内任意交互，均**不**冒泡触发行双击编辑（延续 `CCFG-DESIGN-041` 事件边界要求）；接近右边缘或列表滚动时菜单**不**被裁切。二次确认、接口、行级忙碌与失败行为**保持** `CCFG-DESIGN-041`/`CCFG-DESIGN-042`/`CCFG-DESIGN-043` 不变。 | CCFG-REQ-111 | CCFG-AC-101、CCFG-AC-102、CCFG-AC-103 |
| CCFG-DESIGN-053 | 技术隔离、不改项与回归边界：本轮变更**只**作用于 `/config/client` 主列表的页面级 scoped 样式与入口图标，**不**修改公共模板（`docs/baseline/list-table-visual-template/**`、`docs/baseline/query-list-page-template/**` 状态零改动）、**不**新增全局样式块、**不**使用 `!important`、**不**新增 Vue 包装组件或额外 DOM 层；新增/编辑弹窗及其内部控件（含弹窗内表格）**不**受影响。**不改项**：“探针描述”列宽维持现状、长文本单行省略；现有查询条件、**刷新能力缺席**（`CCFG-DESIGN-039` 不变）、表格六列顺序（`CCFG-DESIGN-031` 不变）、CRUD 合同、Tooltip 业务信息与弹窗功能不因本轮视觉调整改变。**回归边界**：行高与标签尺寸变更必须覆盖**正常视口与窄视口**下完整单行的可读性以及 `+N` 的可见性、可点击性。 | CCFG-REQ-112 | CCFG-AC-093、CCFG-AC-104 |

## 15. `+N` 清单与新增／编辑弹窗视觉调整（第三轮 · 2026-09-23 草案建立 → ChatGPT 复审 `CHANGES_REQUIRED` → R1 定向纠错 → 2026-09-23 批准收口为 `APPROVED` · `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001`）

> 本节为**第三轮**（本轮）`+N` 清单与新增／编辑弹窗视觉调整新增设计项（`CCFG-DESIGN-054~060`，共 7 条），依据项目负责人查看 `/config/client`（探针端管理）与 `/config/data-source`（数据源管理，**仅作视觉参考**）页面后**已明确确认的四项调整决定**建立。**状态分层**：本轮基线 `adjustment3_baseline_status=APPROVED`（`adjustment3_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment3_approval_date=2026-09-23`、`adjustment3_approved_reviewed_commit=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244`）、本轮实现 `adjustment3_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`（第三轮已批准基线的前端实现已于 2026-09-23 由 `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001` 完成，定向测试与前端构建通过、并已做真实浏览器只读核对，**当前停在 ChatGPT 远程代码复审入口**；批准收口时点的 `NOT_STARTED` 属历史状态）、本轮正式验收 `adjustment3_formal_acceptance_execution_status=NOT_RUN`（`CCFG-AC-105~117`，13 条全部 `NOT_RUN`）；§13（`CCFG-DESIGN-038~046`）与 §14（`CCFG-DESIGN-047~053`）此前已批准基线分别保持 `APPROVED`，其实现事实保持真实（第二轮实现已完成并经 ChatGPT 远程代码复审通过、当前等待项目负责人页面目测/接受），本节**不改写、不抹除**。本节草案经 ChatGPT 从远程 Git 独立复审、结论 `CHANGES_REQUIRED`，由 R1 纠错任务 `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001-R1` 定向修订后，ChatGPT 对 R1 结果提交 `1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244` 复审、结论 `APPROVED`，项目负责人于 2026-09-23 明确回复“批准”，由批准收口任务 `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-APPROVAL-CLOSEOUT-001` 收口为 `APPROVED`。**批准的是第三轮设计调整基线；本轮实现为 `NOT_STARTED`、本轮正式验收为 `NOT_RUN`，尚未实现第三轮调整、尚未执行验收。** 设计编号在本文件既有最大编号 `CCFG-DESIGN-053` 之后连续新增，**不**复用旧编号、**不**重排历史编号。本节所列 `#hex`/像素数值均为**参考页实现事实**（供实现阶段核对），**不是**测试通过证据；实现必须**以真实参考页样式与实际视口为准**。
>
> **参考来源效力边界**：参考页 `/config/data-source` **仅作视觉对照**，本节规则**只**作用于 `/config/client` 页面；**不**修改数据源管理的代码、文档、状态、行为，**不**修改模板级全局配置（`docs/baseline/**` 的模板状态保持 `NOT_STARTED` / `NOT_GRANTED` / `NOT_DECIDED`）。本节**不**触碰 `API.md` 与 `DATABASE.md`（判定为无需变更：本轮全部为页面级样式、版式与文案保持，不涉及接口契约、字段与数据库对象）。
>
> **与既有设计项的关系（定向修订并保留原文）**：`CCFG-UI-009`（`+N` 完整清单设最大高度并内部滚动）与 `CCFG-UI-024`（`+N` Popover 清单设最大高度内滚）的部分口径被 `CCFG-DESIGN-055` 与 §17 `CCFG-UI-044` **定向修订**；两项既有定义行原文**保留不改写**（仅在其项内标注被修订范围），不伪装为原规则从未存在。`CCFG-UI-024` 的其余内容（**弹窗**内部滚动、悬停 Tooltip 页面级单实例与可视区域内、两类交互区分）继续有效——`CCFG-DESIGN-055` 的“不内部滚动”**仅**作用于 `+N` 点击弹层，**不**适用于新增／编辑弹窗及其候选列表（`CCFG-DESIGN-057`）。
>
> **时序说明（2026-09-23 追加，不改写以上历史表述）**：本节前言中“本轮实现 `adjustment3_implementation_status=NOT_STARTED`”与“**批准的是第三轮设计调整基线；本轮实现为 `NOT_STARTED`…尚未实现第三轮调整、尚未执行验收**”均为批准收口时点的真实历史状态，照实保留。第三轮已批准设计项 `CCFG-DESIGN-054~060` 的前端实现已于 2026-09-23 由独立实现任务 `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001` 完成（现行 `adjustment3_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`），本条**不**改变本节任何设计定义行、编号或顺序：`CCFG-DESIGN-054~060` 共 7 条定义行相对起始提交 `cf0817f23c77190275b7f58c755c4e2c4619adc9` **逐字节零变化**，`CCFG-AC-105~117` 共 13 条仍全部 `NOT_RUN`；实现完成**不**等于已目测、已验收、已接受。现行下一入口为 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_IMPLEMENTATION_REVIEW`。

> **R1 时序说明（2026-09-23 追加，不改写以上表述）**：`CCFG-DESIGN-055` 所述“弹层沿用既有 `placement` 与自适应避让/翻转行为，靠近视口边缘时不被无意裁切；普通视口内容完整可读”在初次实现时点**未满足**——真实浏览器实测 1440×900 首行 9 项弹层保持 `top`、被视口上缘裁掉约 166px、6/9 完整可见（根因：Element Plus 2.14.2 未开启 `preventOverflow.altAxis`，`top`/`bottom` 定位下竖直方向从不避让）。该裁切已由定向修复任务 `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001-R1` 于 2026-09-23 消除：`+N` 弹层采用 `preventOverflow { boundary: 'viewport', rootBoundary: 'viewport', mainAxis: true, altAxis: true, tether: false, padding: 8 }`（`placement="top"` 仍为首选方向，未引入内部滚动或固定最大高度），真实无头浏览器复验该场景 9/9 完整可见、上溢 0。本条**不**改变本节任何设计定义行、编号或顺序：`CCFG-DESIGN-054~060` 共 7 条定义行相对起始提交 `cf0817f23c77190275b7f58c755c4e2c4619adc9` **逐字节零变化**，`CCFG-AC-105~117` 共 13 条仍全部 `NOT_RUN`。实现**尚未提交、尚未推送**，现行入口为工作区差异审阅 `WORKTREE_DIFF_REVIEW_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_IMPLEMENTATION_R1`。

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-054 | `+N` 点击弹层清单项的**内容模型**：每项渲染**两级信息**——① 主信息为完整机构名称 `DATA_SOURCE_ORG`（沿用现有 `.cc-full-org` 的主信息视觉）；② 次信息以**较弱视觉**显示**明确前缀文案** `数据源 ID：` 与完整 `DATA_SOURCE_ID`（现有 `.cc-full-id` 承载，前缀可见且与值之间有明确分隔）。主信息与次信息**分行**渲染（现有实现把 `ds.org` 与 `ds.dataSourceId` 渲染于同一行且无前缀，属本轮要修正的现状），**不得**贴在同一行连读成一个字符串。`hasOrg(ds)` 为假（机构名称不存在）时，以原始 `DATA_SOURCE_ID` 作为**主信息**渲染且**不再**输出同一 ID 的次信息行（不重复两遍）；任何情况下**不得**把 `DATA_SOURCE_ID` 与 `DATA_SOURCE_ORG` 混淆或互为替代。项级异常原因（`anomalies`）与冲突探针信息沿用现有 `.cc-full-bad` 渲染于**该项内部**易辨认位置，**保持既有红色警示样式与既有 Tooltip 语义**；含逗号歧义行的现有 `.cc-full-note` 提示文案与其**事实边界**（只陈述歧义事实、不推断结论）**逐字保留**。 | CCFG-REQ-113、CCFG-REQ-114 | CCFG-AC-105、CCFG-AC-106、CCFG-AC-107 |
| CCFG-DESIGN-055 | `+N` 弹层**高度模型**（确定性方案）：**移除** `.cc-full-list` 当前的 `max-height: 320px` 与 `overflow-y: auto`，弹层改由内容**自然增高**，**不**设清单内部滚动、**不**设固定最大高度；清单项之间以**清晰间距或浅分隔线**区分（现有 `.cc-full-item { line-height: 1.6 }` 基础上增加项间分隔表现）。生产常见每探针约 5～6 个数据源，**不得**因假想的超大数据量保留或新增内部滚动。弹层仍以 `trigger="click"` 触发（`CCFG-UI-009`/`CCFG-REQ-016` 的点击语义不变）、仍展示**全部**数据源（规范化去重后的原存储顺序、异常项不隐藏）、`+N` 数量不变；主表**行高**（`CCFG-DESIGN-049` 的公共预设内边距规则不变）与单个标签悬停（页面级单实例）Tooltip（`CCFG-UI-008` 不变）**不**受本轮影响。弹层沿用既有 `placement` 与自适应避让/翻转行为，靠近视口边缘时**不被无意裁切**；普通视口（如 1440×900、1920×1080）下内容完整可读。 | CCFG-REQ-114、CCFG-REQ-115 | CCFG-AC-108、CCFG-AC-109、CCFG-AC-110 |
| CCFG-DESIGN-056 | 新增／编辑探针弹窗**尺寸模型**：两种模式**复用同一弹窗实例**（现为单一 `<el-dialog class="cc-dialog">`，`:title` 按 `mode` 切换），宽度由现状 `width="680px"` 调整为桌面目标约 **900px**，并以 `max-width`／`calc(100vw - 安全边距)` 类方式**受视口限制**保留左右安全间距；窄视口按可用空间收缩、**不横向溢出**。弹窗标题、右上角关闭按钮与底部“取消”与“创建／保存”在**任何视口**下可见可操作；表单区沿用既有受控滚动（`.cc-form` 的 `max-height` + `overflow-y: auto` 允许保留并按新高度调整），标题/页脚不因表单滚动而不可达。 | CCFG-REQ-116 | CCFG-AC-111 |
| CCFG-DESIGN-057 | 弹窗**数据源区域布局模型**：数据源选择区**可见高度适度增加**（提高 `.cc-opt-list` 与 `.cc-pane--chosen .cc-chosen-list` 的 `max-height`），使候选项一次能显示更多；`.cc-split` 横向比例由现状两区 `flex: 1` 等宽调整为“**可选数据源**”（`.cc-pane--options`）**略宽于**“已选”（`.cc-pane--chosen`），以改善机构名称、`DATA_SOURCE_ID` 与**不可选择原因**（`.cc-opt-reason`）的可读性。空间不足时，**弹窗表单或候选区**允许使用既有受控滚动；`CCFG-DESIGN-055` 的“不内部滚动”**仅**作用于 `+N` 点击弹层，**不**适用于本弹窗及其候选列表，不得误施加。候选来源、可搜索字段、`COMMA_IN_ID`／`OCCUPIED` 置灰与提示、编辑自排除等**语义**（`CCFG-UI-016`、`CCFG-REQ-061~067`）保持零改动，仅观感与版式随尺寸变化。 | CCFG-REQ-117 | CCFG-AC-112 |
| CCFG-DESIGN-058 | 弹窗配置项名称**排版令牌**：`.cc-form-label`（“探针 ID”“探针描述”“采集数据源”）对齐参考页 `/config/data-source` 新增／编辑主弹窗标签（参考实现事实：`.editor-dialog .el-form-item__label` 为 `font-size: 14px; font-weight: 500; color: #3f3f46`），沿用页面**默认无衬线字体族**；**不得**把主表探针 ID 的等宽粗体（`monospace`／字重 600，见 `CCFG-DESIGN-048`）样式套进表单标签。必填项红色星号（`.cc-form-label::before`）与原有校验语义（`CCFG-DESIGN-029`~`CCFG-DESIGN-037` 的字段校验、`CCFG-UI-013` 的新增校验）保留。改动**限定在探针弹窗内**的页面级 scoped 样式，**不**改参考页、**不**改其他弹窗、**不**新增全局样式块。 | CCFG-REQ-119 | CCFG-AC-114 |
| CCFG-DESIGN-059 | 弹窗主提交按钮**视觉令牌与状态矩阵**：右下角主提交按钮以独立类名（如 `.cc-dialog-submit`）限定作用域，采用数据源管理 `.editor-submit-button` 的黑色实心视觉——正常态 `#09090b` 实心底与边框、`#ffffff` 文字、圆角 6px、字重 500；Hover／聚焦 `#27272a`，按下 `#18181b`；**禁用态与 loading 态**沿用 Element Plus 既有视觉，并以 `:not(.is-disabled)` 一类限定把正常态配色**仅**作用于非禁用态，保证禁用按钮**不**呈现为可点的黑色实心（现有 `:disabled="saveBlockReason !== null || submitting"` 与 `:loading="submitting"` 逻辑不变）。 **【本轮（第四轮）定向修订 · 待批准】** 上述 `:disabled="saveBlockReason !== null || submitting"` 中**由 `saveBlockReason` 引起的禁用**被本轮 `CCFG-DESIGN-062` **定向修订**：本轮“创建／保存”**不得**仅因未选择数据源而预先禁用，表单不完整仍须可点击并在点击后显示字段级错误；`:loading="submitting"` 的**处理中防重复提交**语义与禁用／加载态可辨性**保留不变**。本条原文（含该禁用表达式）作为历史决定**保留不改写**，仅在此标注被修订范围，不伪装为原规则从未存在；定向修订与新增编号见 §16 `CCFG-DESIGN-062`。**仅**该主提交按钮改色，“取消”“自动生成”“修改探针 ID”等按钮**不**跟随变黑；不新增全局样式、不使用 `!important`。 **【R1 定向核对（2026-09-24）· 待复审】** 本条与 `CCFG-REQ-120`、`CCFG-AC-115`、`CCFG-UI-047` 及 §16 `CCFG-DESIGN-062` 的状态矩阵**精确一致、无冲突**：本条被收窄的**仅**为“因表单未完成／校验未通过（含未选数据源）而**预先禁用**”的口径（由 `CCFG-DESIGN-062`／`CCFG-REQ-124`／`CCFG-AC-120`／`CCFG-UI-051` 取代），本条**现行适用口径**保留为“**提交请求处理中**（`submitting`／`:loading`）暂不可重复提交并保持清楚可辨的加载反馈、底色不发生蓝黑跳色”，以及“**仅**该主提交按钮改色”“按钮文案保持‘创建’／‘保存’”的边界；原文（含禁用表达式）作为历史决定保留不改写。 | CCFG-REQ-120 | CCFG-AC-115 |
| CCFG-DESIGN-060 | **不改项、文案保持与回归边界**：① 弹窗既有功能与语义**不**变——探针 ID 锁定／经“修改探针 ID”解锁修改（`CCFG-UI-014`、`CCFG-DESIGN-034` 区段）、探针描述自动生成（`CCFG-UI-015`）、候选搜索与已选项展示/移除（`CCFG-UI-016`）、异常项红色回显（`CCFG-UI-014`/`CCFG-UI-016`）、保存前校验阻断（`CCFG-UI-017`）、未保存关闭确认，一律保持现有行为；② 按钮**文案保持**——新增主按钮“创建”、编辑主按钮“保存”（现状 `{{ mode === 'edit' ? '保存' : '创建' }}` 不变），本轮不得改任何按钮文案（“保存按钮”只指主提交按钮的视觉样式）；③ 操作菜单“**删除**”条目**不加粗**，保持菜单条目一致字重，继续以红色文字、上方分隔线、Hover／焦点反馈区分危险操作，启用／停用／删除的业务语义、二次确认弹窗与三点入口（`CCFG-DESIGN-041`/`CCFG-DESIGN-051`/`CCFG-DESIGN-052`）不变。 | CCFG-REQ-118、CCFG-REQ-121、CCFG-REQ-122 | CCFG-AC-113、CCFG-AC-116、CCFG-AC-117 |

## 16. 新增／编辑弹窗校验与交互调整（第四轮 · 2026-09-24 草案建立 → R1 纠错 → 2026-09-24 批准收口为 `APPROVED` · `CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001`）

> 本节为**第四轮**新增／编辑探针弹窗**校验与交互**调整新增设计项（`CCFG-DESIGN-061~071`，共 11 条），依据项目负责人对 `/config/client`（探针端管理）新增／编辑探针弹窗**已明确确认的五组调整决定**建立**草案**。`/config/data-source`（数据源管理）新增／编辑弹窗在本轮**仅作字段错误与标签布局的视觉参考**，本节规则**只**作用于 `/config/client` 页面，**不**修改参考页的代码、文档、状态与行为。**状态分层**：`adjustment4_baseline_status=APPROVED`（`adjustment4_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment4_approval_date=2026-09-24`、`adjustment4_approved_reviewed_commit=9daf03848d53008d3ac73e6a43c1368fa5d72750`；草案曾为 `DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`——R0 提交 `51be9aa` 远程复审 `CHANGES_REQUIRED`、R1 纠错后由 R1 结果提交 `9daf038` 远程基线文档复审 `APPROVED`、项目负责人 2026-09-24 批准收口）、本轮实现 `adjustment4_implementation_status=NOT_STARTED`（本轮**未做任何代码实现**）、本轮正式验收 `adjustment4_formal_acceptance_execution_status=NOT_RUN`（`CCFG-AC-118~135`，18 条全部 `NOT_RUN`）；§13（`CCFG-DESIGN-038~046`）、§14（`CCFG-DESIGN-047~053`）、§15（`CCFG-DESIGN-054~060`）此前已批准基线分别保持 `APPROVED`，其实现事实保持真实，本节**不改写、不抹除**。设计编号在本文件既有最大编号 `CCFG-DESIGN-060` 之后连续新增，**不**复用旧编号、**不**重排历史编号。本节所列参考实现事实（类名、像素、`#hex`）仅供实现阶段对照，**不是**测试通过证据；实现必须**以真实参考页样式与实际视口为准**。
>
> **R1 定向纠错（2026-09-24）**：ChatGPT 已从远程 Git 对本轮草案提交 `51be9aa66f0555da331b20b2ae5d4cc2f370f880` 完成复审、结论 `CHANGES_REQUIRED`，本文件按 R1-01（按钮旧规则与新规则冲突）、R1-02（`CCFG-AC-131` 不可能验收输入）、R1-03（`CCFG-REQ-136` 虚假 UI 追踪映射）作最小定向修订；第四轮分层状态在该 R1 时点**不变**（`DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`／`NOT_STARTED`／`NOT_RUN`），该时点现行下一入口为 `CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_R1_REVIEW`（**其后已完成**，见下方批准收口说明）。
>
> **批准收口说明（2026-09-24 追加，不改写以上表述）**：R1 结果提交 `9daf03848d53008d3ac73e6a43c1368fa5d72750` 经 ChatGPT 从远程 Git **基线文档复审**、结论 `APPROVED`，项目负责人于 2026-09-24 明确回复“批准”，由批准收口任务 `CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-APPROVAL-CLOSEOUT-001`（纯文档）承接——第四轮设计调整基线**状态变化仅为** `adjustment4_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 变为 `APPROVED`（并新增 `adjustment4_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment4_approval_date=2026-09-24`、`adjustment4_approved_reviewed_commit=9daf03848d53008d3ac73e6a43c1368fa5d72750` 与本节批准依据），**不**改变任何设计业务定义。**本节不修改任何设计定义行**：`CCFG-DESIGN-001~071`（71 条）保持连续、唯一、不新增/删除/重排，相对提交 `9daf038` **逐字节零变化**（含 R0 定向标注的 `CCFG-DESIGN-059` 与 R1 的 `CCFG-DESIGN-062`、§12 映射纠正均不回退）；本轮实现保持 `adjustment4_implementation_status=NOT_STARTED`（批准**不**等于已实现）、本轮验收 `adjustment4_formal_acceptance_execution_status=NOT_RUN`；覆盖保持 136/136 需求、135/135 验收，`PENDING_USER_CONFIRMATION=0`；**不**改 `API.md`/`DATABASE.md`、**不**改任何业务代码/测试/前端或后端源文件、**不**改 `docs/baseline/**` 与模板级全局状态、**不**改数据源管理参考页、**不**回写 R0／R1 报告；现行下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（只有该复审通过后才进入第四轮实现任务）。
>
> **参考来源效力边界**：参考页 `/config/data-source` **仅作视觉对照**（字段错误呈现位置与标签排布），本节规则**只**作用于 `/config/client` 页面；**不**修改数据源管理的代码、文档、状态、行为，**不**修改模板级全局配置（`docs/baseline/**` 的模板状态保持 `NOT_STARTED` / `NOT_GRANTED` / `NOT_DECIDED`）。本节**不**触碰 `API.md` 与 `DATABASE.md`（判定为无需变更：本轮为页面级校验反馈、提示稳定性、弹窗定位与输入层上限调整，不涉及接口契约、字段与数据库对象；探针描述的界面 256 字符上限**不**改变服务端 `VARCHAR2(1024 BYTE)`／UTF-8 字节 ≤1024 的既有防线）。
>
> **与既有设计项的关系（定向修订并保留原文）**：`CCFG-DESIGN-059` 中“`:disabled="saveBlockReason !== null || submitting"` 逻辑不变”的一部分被 `CCFG-DESIGN-062` **定向修订**——本轮“创建／保存”主提交按钮**不得**仅因未选择数据源而预先禁用，表单不完整仍须可点击并在点击后显示字段级错误；该定义行**原文保留不改写**（仅在其项内标注被修订范围），**不**伪装为原规则从未存在。`CCFG-DESIGN-056` 的弹窗约 900px 目标宽度与窄视口安全边距**继续有效**，`CCFG-DESIGN-067` 仅在其上补充“相对**可见视口**水平居中、不得写死侧栏相关偏移”的定位口径，**不**取代其尺寸口径。`CCFG-DESIGN-058` 的标签排版令牌（`14px/500/#3f3f46`、默认无衬线字体族）**继续有效**，`CCFG-DESIGN-068` 仅在其上追加“统一**右对齐**（右边缘整齐、左边缘无须对齐）”的排布口径。`CCFG-DESIGN-017`/`CCFG-DESIGN-059` 的弹窗内校验阻断与禁用/加载态可辨性**继续有效**，本轮**不**放宽任何保存条件。
>
> **后续入口（仅登记，不提前创建／批准）**：项目负责人认可“新增／编辑表单弹窗模板”方向。**在本轮页面实现完成并经项目负责人实际目测认可之后**，另开独立任务提炼可复用的字段错误显示、标签对齐、提示稳定性、按钮与弹窗定位等共性规则；探针专有的 ID 32 位、描述 256 字符与数据源分配规则**不**进入全局模板。本节仅以 `CCFG-DESIGN-071` 登记该后续入口，**不**提前创建／批准模板，也**不**声称其他页面已接入。该入口属**文档治理／范围声明**，本轮**无新增 UI 元素**，故 `CCFG-REQ-136`／`CCFG-AC-135` 在 §12 追踪矩阵中**仅**由 `CCFG-DESIGN-071` 承载，**不**映射到 `CCFG-UI-059`（R1-03 已移除该无依据映射）。

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-061 | 弹窗**字段级校验反馈模型**（确定性方案）：探针 ID、探针描述、采集数据源三项的业务校验错误改为**字段级反馈**——对应控件显示**红色边框**，错误文字在**该控件正下方**以红色显示（呈现位置与参考页 `/config/data-source` 新增弹窗一致）；点击“创建”（新增）或“保存”（编辑）时**一次校验全部字段**，逐字段显示各自错误并**定位到第一个错误**；用户修正某字段后仅**清除或更新该字段**的错误，不清除其他字段的错误。**取消**以页面顶端临时消息代替字段内反馈的做法，同一错误**不得**既在字段下方又在顶端重复提示。编辑模式既有的探针 ID 锁定／经“修改探针 ID”解锁、与“取消修改”恢复锁定的流程（`CCFG-UI-014`、`CCFG-DESIGN-034` 区段）**保持不变**。本模型只改变错误的**呈现位置与呈现方式**，**不**改变任何校验判定的**内容**（`CCFG-DESIGN-029`~`CCFG-DESIGN-037` 字段校验、`CCFG-DESIGN-017` 保存前阻断、`CCFG-UI-013` 新增校验语义零改动）。实现限定在探针弹窗的页面级 scoped 样式与校验反馈逻辑，**不**新增全局样式块、**不**使用 `!important`、**不**改参考页与其他弹窗。 | CCFG-REQ-123 | CCFG-AC-118、CCFG-AC-119 |
| CCFG-DESIGN-062 | 弹窗主提交按钮**状态矩阵（本轮定向修订 `CCFG-DESIGN-059` 的禁用口径）**：新增的“创建”与编辑的“保存”在**非提交处理中**的常态下**始终呈现**与数据源管理主提交按钮一致的**黑色可点击样式**（沿用 `CCFG-DESIGN-059`/`CCFG-REQ-120` 的 `#09090b` 实心底与边框、`#ffffff` 文字、圆角 6px、字重 500，Hover／聚焦 `#27272a`、按下 `#18181b`，`:not(.is-disabled)` 限定正常态配色）；“始终”**仅**指该常态，**不**包含提交请求处理中的防重复态。表单不完整时按钮**仍可点击**，点击后再显示字段级错误（`CCFG-DESIGN-061`）；**不得**仅因“未选择数据源”而把按钮预先置为禁用态——本轮**定向修订** `CCFG-DESIGN-059` 所述 `:disabled="saveBlockReason !== null || submitting"` 中**由 `saveBlockReason` 引起的禁用**（该定义行原文保留不改写，仅在其项内标注被修订范围）；`:loading="submitting"` 的**处理中防重复提交**语义**保留**——提交请求处理中仍须防止重复提交。禁用（真实不可提交）态与加载态必须**清楚可辨**，加载态**不得**在蓝色与黑色之间跳色；正常态规则**不得**覆盖禁用／加载态。 **【R1 定向修订（2026-09-24）· 待复审】** 本行“始终呈现”的口径与 `CCFG-DESIGN-059`、`CCFG-REQ-120`、`CCFG-AC-115`、`CCFG-UI-047` 精确一致，且与 `CCFG-AC-120` 的并存关系说明一致：两种状态**同时成立、无冲突**——① **表单未完成／校验未通过**（含未选数据源）→ 按钮**可点击且呈黑色**，点击后显示字段级错误；② **提交请求处理中**（`submitting`／`:loading`）→ **暂不可重复提交**、呈现清楚可辨的加载反馈、底色**不**发生蓝黑跳色。 | CCFG-REQ-124 | CCFG-AC-120 |
| CCFG-DESIGN-063 | **可归属字段错误与全局错误边界**：当业务接口返回**能够明确对应到某个字段**的校验／冲突错误（如探针 ID 冲突、格式不合法、描述超限、数据源冲突）时，必须在该字段下方以**字段级反馈**呈现（复用 `CCFG-DESIGN-061` 的呈现模型）；网络不可用或**无法归属到具体字段**的系统错误**可以**保留全局错误提示。接口契约、错误码与后端校验（`CCFG-DESIGN-023`、`API.md`）**零改动**；现有前后端校验、防重复提交以及实际成功后的行为（刷新列表、关闭弹窗等）**保留**；**不得**借本轮调整放宽任何保存条件（`CCFG-REQ-049`/`CCFG-REQ-059` 等既有校验语义不变）。errorCode 到字段的归属映射以实现阶段对照后端实际返回为准，本设计**不**新增或更改任何错误码。 | CCFG-REQ-125 | CCFG-AC-121 |
| CCFG-DESIGN-064 | 未选数据源**中性提示三态模型**：未选择数据源**且尚未尝试提交**时，在“采集数据源”选择区域下方显示“**至少选择 1 个数据源**”的**中性灰色说明**；该提示**不得**以红色或绿色表示（“尚未选择”属正常未完成状态）。选中至少一个数据源时**隐藏**该说明；取消全部选择时**重新显示**该说明（此时若从未尝试提交，仍为中性灰色说明）。提示文案与区域与 `CCFG-DESIGN-065` 的错误态**共用同一反馈区**（见 `CCFG-DESIGN-066` 的稳定空间），**不**新增独立提示组件、**不**引入全局提示。候选资格、已分配提示、ID 含英文逗号不可选规则与选择顺序（`CCFG-REQ-061~067`）**零改动**。 | CCFG-REQ-126 | CCFG-AC-122 |
| CCFG-DESIGN-065 | 提交尝试后**数据源错误态与状态恢复**：用户点击“创建／保存”而仍未选择数据源时，**同一字段反馈区**由中性灰色说明改为**红色错误文字**，并显示该区域对应的错误状态（红色边框／错误状态与 `CCFG-DESIGN-061` 的字段级模型一致）；选中数据源后**清除**该错误；再次清空时，必须依照“**是否已经尝试提交**”正确恢复为红色错误（已尝试提交过）或中性灰色说明（从未尝试提交），**不得**出现红／灰状态错乱、状态残留或状态丢失。该恢复判定只依赖“本次弹窗会话内是否已点击过提交”，**不**写入持久化状态、**不**影响列表原记录。 | CCFG-REQ-127 | CCFG-AC-123 |
| CCFG-DESIGN-066 | **字段反馈区稳定空间与窄视口边界**：字段反馈区必须**预留稳定空间**，使选中、取消选择与普通错误状态之间的切换**不**造成弹窗底边或底部按钮的明显跳动（新增／编辑复用同一稳定布局，见 `CCFG-DESIGN-056` 的同一弹窗实例）；对少量确实需要**换行**的真实错误文案必须保留可读性，**不得**硬裁剪（禁止以 `overflow: hidden` 或固定单行高度截断）。视口较小时仍须遵守 `CCFG-DESIGN-056`（标题／关闭／页脚任意视口可见可操作、表单区沿用受控滚动）与 `CCFG-UI-022`（窄视口不异常横向溢出）的既有规则。稳定空间的实现方式（固定最小高度或等价布局手段）留待实现阶段以真实视口测量确定，本设计不写死像素值，也不构成待确认项。 | CCFG-REQ-128 | CCFG-AC-124、CCFG-AC-125 |
| CCFG-DESIGN-067 | 弹窗**相对浏览器可见视口水平居中**：新增／编辑探针弹窗必须相对**浏览器可见视口**水平居中——正常展开或收起侧栏、不同宽度视口下均**不得**产生约半个侧栏宽度的左偏。保留 `CCFG-DESIGN-056`/`CCFG-REQ-116` 的约 **900px** 桌面目标宽度与窄视口安全边距（`max-width`／`calc(100vw - 安全边距)` 类受视口限制方式不变）。**不得**通过写死与某一侧栏宽度相关的偏移量（如固定 `margin-left`、绑定具体侧栏宽度常量）修补居中问题；Element Plus 弹窗以视口居中的既有定位机制为准，实现阶段以真实视口测量核对（先测量、后修值，**不**凭截图写死像素）。本项只调整弹窗**定位**，**不**改变弹窗尺寸、内部布局与业务行为。 | CCFG-REQ-129 | CCFG-AC-126 |
| CCFG-DESIGN-068 | 弹窗配置项名称**右对齐排布**：“探针 ID”“探针描述”“采集数据源”等配置项名称参考“新增数据源”弹窗统一**右对齐**，**右边缘整齐**、**左边缘无须对齐**（各名称长度不同，左边缘允许参差）；必填红色星号（`.cc-form-label::before`）保留在名称**前**；`CCFG-DESIGN-058`/`CCFG-REQ-119` 的字体规格（`14px/500/#3f3f46`、默认无衬线字体族）与必填星号校验语义**保留**；输入控件区域保持对齐。改动**限定在探针弹窗内**的页面级 scoped 样式，**不**改参考页、**不**改其他弹窗、**不**新增全局样式块、**不**使用 `!important`。 | CCFG-REQ-130 | CCFG-AC-127 |
| CCFG-DESIGN-069 | 探针 ID **输入层 32 位上限与字段级格式报错**：探针 ID 的**输入与粘贴最多接受 32 位**（超长不再无限录入）；`CCFG-REQ-037/038/043/048` 的首位字符、允许字符集、判空、大小写不敏感唯一性（含仅大小写修改自身）与后端校验**全部不变**。非法字符**不得**被悄悄改写成另一个 ID（**禁止**静默剥离或替换字符后继续提交），必须以 `CCFG-DESIGN-061` 的**字段级错误**明确指出格式问题。新增模式输入框**可直接填写**；编辑模式**默认锁定**，并可按既有“修改探针 ID／取消修改”操作解锁（`CCFG-REQ-044~046`、`CCFG-UI-014`）。输入层上限为**前端输入限制**，**不**替代后端校验。 | CCFG-REQ-131 | CCFG-AC-128、CCFG-AC-129 |
| CCFG-DESIGN-070 | 探针描述 **256 字符输入层与自动生成截断时序**：① 探针描述**最多 256 个字符**，按 **Unicode 完整字符**计数——**256 个汉字也是 256 个字符**；截断时**不得**拆开**代理对**（surrogate pair）或破坏字符（按 `Array.from`／码点级计数而非 UTF-16 code unit 截断）。手工输入与粘贴执行**同一**限制；相应输入提示改为“**最多 256 个字符**”。`CCFG-REQ-039`/`CCFG-REQ-059` 的最终描述**原文保存**、Trim **仅用于判空**、后端 `VARCHAR2(1024 BYTE)`／UTF-8 **原文字节 `<=1024`** 校验**保留**：数据库字段、API 与服务端上限**不**改为 256 字节，仍按实际编码长度执行既有字节防线。② “自动生成”**时序**为：**先**按原有数据源选择顺序、以每个 `DATA_SOURCE_ORG` 生成原规则的**完整**描述（`CCFG-REQ-053~055`），**再直接保留前 256 个字符**写入描述输入框；超过 256 字符时**不得**失败、**不得**弹超长提示，也**不得**追加新的拒绝保存逻辑。原有“未选数据源时完全无动作”（`CCFG-REQ-052`）与“不能取得非空 `DATA_SOURCE_ORG` 时须指出对应数据源 ID 并保持原描述不变、去除首尾空白后为空则失败、覆盖自定义内容不弹确认、不加撤销或模式切换控件”等既有规则（`CCFG-REQ-060` 其余条款）**保持不变**。对最终准备写入的 256 字符文本，**继续执行实际 UTF-8 字节检查**（`CCFG-REQ-039` 口径）。末尾机构名或分隔符可能因直接截断而不完整，这是项目负责人**明确接受**的截断行为。③ 本条对 `CCFG-REQ-060` 中“完整生成结果按 UTF-8 编码字节数超过 1024 则自动生成失败”一句作**定向修订**：新旧时序对照为“**旧**：完整结果超 1024 字节 → 生成失败并提示；**新**：生成完整结果 → 直接保留前 256 字符写入 → 对最终 256 字符文本继续执行 UTF-8 字节检查（256 字符文本在 AL32UTF8 下字节数必然 ≤1024，故实际写入不再因超长失败）”。 | CCFG-REQ-132、CCFG-REQ-133 | CCFG-AC-130、CCFG-AC-131、CCFG-AC-132 |
| CCFG-DESIGN-071 | 编辑历史记录 **256 字符回显草稿**、范围边界与后续入口登记：① 编辑历史记录时，若原 `CLIENT_DESC` 超过 256 字符，打开弹窗**仅将前 256 个字符回显为本次编辑草稿**（与 `CCFG-DESIGN-070` 同一码点级截断口径）；打开时**不得**写数据库、**不得**偷偷修改列表原记录（列表展示的原始记录保持不变），**不**产生任何持久化副作用。用户若**保存**，则按该截断后的**最终草稿**走既有表单校验与保存流程（`CCFG-REQ-039/049/059`）；**关闭不保存不**改变持久化数据；空白判定（Trim 仅判空）与原文提交规则仍适用于最终草稿。② **范围边界**：本轮交互覆盖**新增与编辑两种模式**（含键盘输入、粘贴、自动生成、取消全部选择、提交失败、再次修正、关闭后重开），并保留原有数据源候选资格（`CCFG-REQ-061~067`）、已分配提示、ID 含英文逗号不可选规则（`CCFG-REQ-064`）、选择顺序、编辑锁定语义、保存接口与原有后端校验；本轮**仅**调整 `/config/client` 页面级基线，**不**改 `/config/data-source` 参考页、其他功能页面、全局组件、后端、数据库，也**不**改查询列表页模板与列表表格视觉模板的全局状态（`NOT_STARTED`／`NOT_GRANTED`／`NOT_DECIDED` 保持不变）。③ **后续入口（仅登记）**：项目负责人认可“新增／编辑表单弹窗模板”方向；**在本轮页面实现完成并经项目负责人实际目测认可之后**，另开独立任务提炼可复用的字段错误显示、标签对齐、提示稳定性、按钮与弹窗定位等共性规则。探针专有的 ID 32 位、描述 256 字符与数据源分配规则**不**进入全局模板。本项仅记录该后续入口，本轮**不**创建模板、**不**批准模板、**不**声称任何其他页面已接入。 | CCFG-REQ-134、CCFG-REQ-135、CCFG-REQ-136 | CCFG-AC-133、CCFG-AC-134、CCFG-AC-135 |

## 17. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-03 | 新建 `docs/features/client-config/DESIGN.md`：设计 `CCFG-DESIGN-001~034`（34 条），文档状态 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0`；与 `API.md`/`UI.md`/`DATABASE.md` 共用一套接口路径、字段、错误码与事务边界 | CLIENT-CONFIG-DESIGN-BASELINE-001（阶段 4 设计基线；纯文档任务，未批准、未实现、未执行验收） |
| 2026-09-04 | R1 定向修订（设计编号扩为 `CCFG-DESIGN-001~037`，共 37 条，仍连续唯一）：`CCFG-DESIGN-007` 补关键词字面量 LIKE 转义（R1-04）；`CCFG-DESIGN-010/011` 扩展 CSV 歧义与 `CATEGORY_MISMATCH`/`TYPE_MISMATCH`/行级 `COMMA_PROTOCOL_AMBIGUOUS` 异常模型；`CCFG-DESIGN-014` 统一“接口原顺序 + 前端非持久化前三项投影”单一顺序契约（R1-02）；`CCFG-DESIGN-028/030` 固定 `CLIENT_DESC` 原文保存/Trim 仅判空/按原文计字节（R1-03）；新增 `CCFG-DESIGN-035/036/037`（历史候选资格变化异常、含逗号不可逆歧义、历史 NULL 描述契约）；`CCFG-DESIGN-033` 补 R1 测试场景。文档状态保持 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0`；§12 追踪矩阵改用全称编号并按其逐行覆盖重建 | CLIENT-CONFIG-DESIGN-BASELINE-001-R1（正式复审 `CHANGES_REQUIRED` 定向修订；纯文档任务，未实现、未执行验收） |
| 2026-09-04 | 并发口径定向调整（`CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`，纯文档）：依据重新批准的需求/验收并发口径清除过时显式表锁设计。`CCFG-DESIGN-001` Service 职责去掉表级锁编排；`CCFG-DESIGN-016/017/020` 新增/编辑/启用改为“普通短事务 + DML 前全量重读 + 当次尽力写前检查 + 立即 DML”；`CCFG-DESIGN-022` 删除“锁等待超时”失败分支；§7 整体重写为“并发边界与写前检查”：`CCFG-DESIGN-023` 权威写前检查流程、`024` 明确不执行显式表锁/无专用锁等待错误、`025` 技术取舍（不用 JVM/分布式/行锁/表锁/DDL 串行化）、`026` 无主动锁无 DDL 边界、`027` 接受极端并发双成功边界；`CCFG-DESIGN-033` 删除表锁超时 `50050` 测试并改并发测试口径。原表锁/`ORA-30006→50050`/“并发最多一个成功”方案已过时且未获批准。文档状态保持 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0`；不新增/删除/重排设计编号，覆盖保持 90/90 与 76/76 | CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001（设计草案并发口径定向调整；纯文档任务，未实现、未执行验收） |
| 2026-09-04 | 批准收口（`CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001`，纯文档）：文档状态由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`，`PENDING_USER_CONFIRMATION=0`；批准对象为提交 `ba7c5e917b1b9d08208c3e1ceb31285407f5fd5e` 下的本文件及其全部设计定义。37 条 `CCFG-DESIGN-*` 业务定义行相对批准提交逐字零差异，仅状态与批准元数据变化；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过（实现状态仍 `NOT_STARTED`，76 条验收仍全部 `NOT_RUN`） | ChatGPT 正式复审 `CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW` 结论 `APPROVED`（提交 `ba7c5e9...`），项目负责人于 2026-09-04 明确回复“批准” |
| 2026-09-22 | 页面级调整草案（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`）：新增 §13 页面级模板选择性接入与列表调整设计（`CCFG-DESIGN-038~046`，9 条，追加在既有最大编号 `037` 之后，不重排历史编号）——`038` 页面层选择性接入边界（复用页面壳/查询面板/查询重置动作/结果面板，不接入刷新工具栏，Feature 写操作不被接管）、`039` 无刷新能力（不注册轮询、不渲染刷新按钮/倒计时/最近刷新时间，重载走既有查询数据流）、`040` 结果区头部组合（新增按钮右侧、取消“删除所选”及其禁用/计数逻辑、行选中按 PENDING 暂保留）、`041` 操作列与事件边界（最右固定“操作”列“更多”下拉、入口与下拉项阻止冒泡不触发行 dblclick/click、按 `fgActive` 决定条目、异常仅 {停用, 删除}、沿用 E5/E7/E6 与二次确认）、`042` 行级忙碌与防重复、`043` 写接口复用（不新增批量删除接口或调用）、`044` 序号列纯前端 `index+1` 计算、`045` 探针 ID 停用标记与异常可见性不丢失、`046` 列表表格视觉模板接入与技术隔离（追加显式根类 + scoped 引入，仅主列表，弹窗不接入，无全局泄漏/无 `!important`/无包装组件/无额外 DOM）。§12 追踪矩阵更新为 **103/103** 与 **89/89**。**状态**：新增元数据分层行（`adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment_implementation_status=NOT_STARTED`、本轮正式验收 `NOT_RUN`）；任务开始前既有实现事实仍为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，本轮不改写、不抹除；`CCFG-DESIGN-001~037` 业务定义原文保留不改写（仅 `CCFG-DESIGN-021` 追加一条“入口位置由 §13 取代”的定向修订标注，语义不变）。`PENDING_USER_CONFIRMATION`：设计空档 `0`，转记需求侧 1 项（见 §11）。下一入口 `CHATGPT_REMOTE_BASELINE_REVIEW`（**不是**直接进入实现） | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`（项目负责人已确认的页面级调整决定驱动的草案；纯文档任务，未实现代码、未执行验收，未授予模板级全局迁移授权） |
| 2026-09-22 | R1 定向纠错与决定回填（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1`，纯文档）：ChatGPT 对 R0 远程提交 `fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1` 复审结论为 `CHANGES_REQUIRED`。逐项修订：① **冻结“取消全部选择能力”**——`CCFG-DESIGN-040` 由“行选中按 `PENDING_USER_CONFIRMATION` 暂保留”改为**取消全部选择能力**（无行单选机制/无选择状态与事件/无选中背景高亮强调线/无“已选择：{探针ID}”，删除启用停用一律走“更多”下拉，无清空/保留选中项语义，保留双击行编辑与探针 ID 键盘编辑），并把 `CCFG-REQ-020` 纳入其覆盖、新增 `CCFG-AC-016` 覆盖；`CCFG-DESIGN-041` 删除 `@row-click`（改变选中）表述；`CCFG-DESIGN-018`/`CCFG-DESIGN-043` 删除“并清空选中”；② **冻结 `FG_ACTIVE` 三态红色异常标识**——`CCFG-DESIGN-045` 改为 `'1'` 不渲染、`'0'` 与数据源管理一致的“停用”标识、历史异常值红色 `异常：{原始值}`（原值按数据契约原样展示、可读对比度、不只靠颜色、位置/间距/超长/Tooltip 不覆盖操作列），删除“若实现阶段无法…作为显式待确认项上报”；③ **清零待确认项**——元数据 `PENDING_USER_CONFIRMATION` 改为 `0`，§11 记录关闭 R0 转记的 1 项；④ **修正状态分层**——元数据 `实现状态` 与新增元数据行改用四层口径（`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`／`adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW`／`adjustment_implementation_status=NOT_STARTED`／`formal_acceptance_execution_status=NOT_RUN`）；⑤ **修正页面级授权口径**——元数据与 §13 前言明确 `/config/client` 页面级选择性接入授权**已经获得**（查询列表页模板仅该单页且不启用刷新；列表表格视觉模板仅该单页主列表），模板级全局状态不变，页面级授权不等于本草案已批准。设计编号与数量 46 条保持不变、不新增/删除/重排；`CCFG-DESIGN-001~037` 业务定义除上述定向修订标注外保持原文；§12 追踪矩阵相应补 `CCFG-DESIGN-040` 覆盖；下一入口 `CHATGPT_REMOTE_BASELINE_R1_REVIEW` | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1`（ChatGPT `CHANGES_REQUIRED` 复审与项目负责人决定驱动的 R1 定向纠错；纯文档任务，未实现代码、未运行测试/构建/浏览器/服务、未执行验收，未授予模板级全局迁移授权） |
| 2026-09-22 | R2 / R3 证据纠错（`...-BASELINE-001-R2`、`...-BASELINE-001-R3`，纯文档）：ChatGPT 对 R1 提交 `2c2b2a71...` 复审 `CHANGES_REQUIRED`（仅 R1 报告三处追踪证据表述），对 R2 提交 `5e0731ae...` 复审 `CHANGES_REQUIRED`（仅 `ACCEPTANCE.md` §1.4 说明文字与 R2 报告 §8 异常菜单摘要）。两个纠错任务均**未修改本设计文件**；设计编号与数量 `CCFG-DESIGN-001~046`（46 条）、定义行与执行状态零变化；`adjustment_baseline_status` 保持 `DRAFT_PENDING_USER_REVIEW` | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R2`、`...-BASELINE-001-R3`（追加式/最小证据纠错；纯文档任务，未实现、未运行测试/构建/浏览器/服务、未执行验收） |
| 2026-09-22 | 页面级调整基线**批准收口**（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001`，纯文档）：ChatGPT 从远程 Git 对 R3 结果提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0` 的复审结论为 `APPROVED`，项目负责人于 2026-09-22 明确回复原话 `批准本轮探针端管理页面调整基线`；本轮调整基线**状态变化仅为** `adjustment_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 变为 `APPROVED`（并新增元数据 `adjustment_approval_status`/`adjustment_approval_date`/`adjustment_approved_reviewed_commit` 与 §13 前言批准依据），**不**改变任何设计业务定义。设计编号与数量 `CCFG-DESIGN-001~046`（46 条）保持连续、唯一、不新增/删除/重排，定义行相对起始提交**逐字节零变化**，§12 追踪矩阵（103/103、89/89）零改动；实现状态保持 `adjustment_implementation_status=NOT_STARTED`（批准**不**等于已实现）、既有实现事实保持 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`；89 条验收全部 `NOT_RUN`；两套模板的模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）不变，页面级授权**不新增、不扩大**；下一入口 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW` | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001`（项目负责人批准驱动的页面调整基线批准收口；纯文档任务，未修改代码/测试、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受） |
| 2026-09-23 | 页面级调整**实现**（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001`，前端实现任务）：按已批准基线实现 `/config/client` 单页调整，`adjustment_implementation_status` 由 `NOT_STARTED` 变为 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`。落地 `CCFG-DESIGN-038~046`：页面层四组件接入且不接入刷新工具栏（038/039）、结果区头部组合与取消“删除所选”（040）、最右固定“操作”列“更多”与事件边界（041）、行级忙碌防重复（042）、写接口复用（043）、序号列（044）、探针 ID 三态标识与异常可见性（045）、列表表格视觉模板接入与技术隔离（046）。**本文件不改变任何设计业务定义**：设计编号与数量 `CCFG-DESIGN-001~046`（46 条）保持连续、唯一、不新增/删除/重排，定义行相对起始提交**逐字节零变化**，§12 追踪矩阵（103/103、89/89）零改动；实现工具在授权范围内为 `ClientConfigPage.vue`/`ClientConfigPage.spec.ts` 两个前端文件（未新增定向测试文件）；89 条验收仍全部 `NOT_RUN`；两套模板的模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）与数据源管理参考页最终接受状态不变；浏览器只读实机目测记为 `BROWSER_BLOCKED_RUNTIME_UNAVAILABLE`；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_PAGE_ADJUSTMENT_IMPLEMENTATION_REVIEW` | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001`（前端实现任务；未修改公共模板实现、数据源管理参考页、路由/菜单、API 类型与接口、后端代码、数据库对象/DDL、构建依赖；未执行正式验收或最终接受） |
| 2026-09-23 | 第二轮主列表视觉调整**草案**（`CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2`，纯文档）：依据项目负责人查看页面后已明确的五项调整决定，新增 §14 与 `CCFG-DESIGN-047~053`（7 条，追加在既有最大编号 `046` 之后，不重排历史编号）——`047` 新增按钮黑色实心化（保留加号/文案/位置/行为，不改查询/重置）、`048` 探针 ID 正文字重颜色对齐数据源 ID（停用/异常标识语义保持）、`049` 行高移除固定像素、改由公共预设单元格内边距与内容决定（不改全局模板、公共层不新增行高令牌）、`050` 采集数据源标签借用角色标签视觉语言并采用绿/红/中性色三态与优先级（异常不因行级歧义降级、既有 `+N`/最多 6 个/完整清单语义零改动、尺寸变更须同步核准测量盒模型）、`051` 操作列入口全部行统一为水平三点图标（下拉条目按三态保持 `CCFG-DESIGN-041`）、`052` 三点菜单视觉与分隔线/键盘可访问/事件边界、`053` 技术隔离不改项与正常/窄视口回归边界。§12 追踪矩阵更新为 **112/112** 与 **104/104**。**状态分层**：新增元数据行 `adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment2_implementation_status=NOT_STARTED`、本轮正式验收 `NOT_RUN`（`CCFG-AC-090~104`，15 条）；§13 已批准基线 `CCFG-DESIGN-038~046` 保持 `APPROVED`、既有实现事实保持 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，本节不改写、不抹除；`CCFG-DESIGN-001~046` 业务定义行**逐字节零变化**。**不改** `API.md`/`DATABASE.md`、**不改**任何业务代码/测试/前端或后端源文件、**不**改 `docs/baseline/**` 与模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_REVIEW`（草案复审入口，**不是**直接进入实现） | `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2`（项目负责人已确认的五项视觉调整决策驱动的**草案**；纯文档任务，未实现代码、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受；用户同意五项 ≠ 文档已批准 ≠ 已实现 ≠ 已验收） |
| 2026-09-23 | 第二轮 V2 草案 **R1 纠错**（`CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1`，纯文档）：ChatGPT 对 V2 远程提交 `328a7ac56fabb3f3ef5ff5f087537a8d828df84b` 的复审结论为 `CHANGES_REQUIRED`，仅须修正三处文档问题，五项已确定产品决策不重新设计。① **R1-01 行级歧义警示颜色越界勘误**：`CCFG-DESIGN-050` 精确修正——独立的**行级歧义警示标识保持原有红色警示样式及原有 Tooltip/文案**（`CCFG-UI-013` 定义行不改写、语义不变），中性色**仅**适用于 `COMMA_PROTOCOL_AMBIGUOUS` 行中**无项级 `anomalies`** 的采集数据源标签，该标签存在项级异常时仍为红色；② **R1-02 `CCFG-AC-093` 窄视口预期收窄**（详见 `ACCEPTANCE.md`）：允许固定宽度主表在足够窄容器内进行必要的**表格横向滚动**、允许长标签/描述按现行规则单行省略，仅禁止页面级**异常**横向溢出、标签或 `+N` 被意外截断/遮挡、最右固定“操作”列入口不可见不可点、`+N` 数量与实际隐藏条数不符；③ **R1-03 当前状态与历史时点一致**：`adjustment_implementation_status` **当前值**为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（第一轮实现代码复审已通过、等待项目负责人页面目测/接受），保留 2026-09-23 提交时点 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 历史值。**编号与计数**：`CCFG-DESIGN-047~053`（7 条）保持连续、唯一、不新增/删除/重排；除 `CCFG-DESIGN-050` 外其余 52 条设计定义行与既有 `CCFG-DESIGN-001~046` **逐字节零变化**；需求 112 条、验收 104 条（全部 `NOT_RUN`）、界面 42 条不变；本轮草案仍 `adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`、本轮实现仍 `adjustment2_implementation_status=NOT_STARTED`；**不**改 `API.md`/`DATABASE.md`、**不**改任何业务代码/测试/前端或后端源文件、**不**改 `docs/baseline/**` 与模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_R1_REVIEW` | `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1`（ChatGPT 对 V2 的 `CHANGES_REQUIRED` 复审驱动的纯文档 R1 纠错；未实现代码、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受；未宣布第二轮文档已批准） |
| 2026-09-23 | 第二轮主列表视觉调整基线**批准收口**（`CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-APPROVAL-CLOSEOUT-001`，纯文档）：ChatGPT 从远程 Git 对 V2 草案 R1 纠错提交 `3830cba16142b4e2ad88f1fa96682ea8397a1203` 的复审结论为 `APPROVED`（R1 纠错通过），项目负责人于 2026-09-23 明确回复原话 `批准本轮五项视觉调整基线`；本轮**状态变化仅为** `adjustment2_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 变为 `APPROVED`（并新增元数据 `adjustment2_approval_status`/`adjustment2_approval_date`/`adjustment2_approved_reviewed_commit` 行与 §14 前言现行状态说明），**不**改变任何设计业务定义。设计编号与数量 `CCFG-DESIGN-001~053`（53 条）保持连续、唯一、不新增/删除/重排，定义行相对提交 `3830cba` **逐字节零变化**（含 R1 修正的 `CCFG-DESIGN-050`），§12 追踪矩阵（112/112、104/104）零改动；`adjustment2_implementation_status=NOT_STARTED`（批准**不**等于已实现）、§13 已批准基线（`adjustment_baseline_status=APPROVED`）与既有实现事实（`IMPLEMENTED_PENDING_USER_ACCEPTANCE`）保持真实；104 条验收全部 `NOT_RUN`；两套模板的模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）不变，页面级授权**不新增、不扩大**；批准范围**仅**为 `/config/client` 主列表五项；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（只有该复审通过后才进入第二轮实现任务） | `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-APPROVAL-CLOSEOUT-001`（项目负责人批准驱动的第二轮视觉调整基线批准收口；纯文档任务，未修改代码/测试、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受） |
| 2026-09-23 | 第二轮主列表视觉调整**实现**（`CLIENT-CONFIG-VISUAL-FOLLOWUP-IMPLEMENTATION-001`，前端实现）：按已批准基线实现 `/config/client` **主列表**五项——① 结果区“新增探针”同款黑色实心按钮；② 探针 ID 正文字重/颜色对齐参考页“数据源 ID”（未改字体族）；③ 移除本页固定像素行高（`.el-table__row{height:60px}` 与 `.cc-src{height:30px}`），行高由公共预设单元格内边距与内容决定，未改公共模板与全局预设、未新增行高令牌；④ 采集数据源标签改为“角色”标签视觉语言并新增 `cc-dstag--ok/--neutral/--bad` 三态（项级 `anomalies` → 红；否则整行 `COMMA_PROTOCOL_AMBIGUOUS` → 中性；否则 → 绿），独立行级歧义警示 `.cc-rowbad` 保持原红色与文案，`CHIP_BOX` 测量基准同步校准（新增 `fontWeight` 支持）；⑤ 操作列“更多”文字改为水平三点图标（可访问名称/可见焦点/28×28 命中区），菜单柔和圆角、弥散阴影、圆角内边距、`divided` 分隔红色“删除”、键盘可打开、右边缘不裁切、事件不冒泡触发行双击编辑。**状态变化仅为** `adjustment2_implementation_status` 由 `NOT_STARTED` 变为 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`，**不**改变任何设计业务定义。设计编号 `CCFG-DESIGN-001~053`（53 条）保持连续、唯一、不重排，定义行相对提交 `81bb8f172f612a2a6edf91181c59b4388da2c999` **逐字节零变化**（53 条逐字节 IDENTICAL）；104 条验收全部 `NOT_RUN`、覆盖 112/112、`PENDING_USER_CONFIRMATION=0`；两套模板的模板级全局状态不变，数据源管理参考页未修改；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_IMPLEMENTATION_REVIEW` | `CLIENT-CONFIG-VISUAL-FOLLOWUP-IMPLEMENTATION-001`（前端实现任务；仅改本页 SFC、其 spec 与同目录 `listLayout.ts` 及当前状态文档；实现 **不**等于已目测、已验收或已接受） |
| 2026-09-23 | 第三轮 `+N` 清单与新增／编辑弹窗视觉调整**草案**（`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001`，纯文档）：依据项目负责人查看 `/config/client` 与 `/config/data-source` 页面后已明确的**四项调整决定**，新增 §15 与 `CCFG-DESIGN-054~060`（7 条）——`054` `+N` 弹层清单项两级信息内容模型（主信息完整 `DATA_SOURCE_ORG`／次信息弱化前缀 `数据源 ID：` + 完整 `DATA_SOURCE_ID`，分行、不贴同一行；`hasOrg` 为假时以原始 ID 为主信息且不重复；项级异常/冲突探针保留在项内且保持红色语义与既有 Tooltip；逗号歧义提示文案与事实边界逐字保留）、`055` `+N` 弹层高度模型（移除 `.cc-full-list` 的 `max-height: 320px` 与 `overflow-y: auto`，按内容自然增高、无内部滚动、无固定最大高度，项间以间距或浅分隔线区分；仍 `trigger="click"`、展示全部、异常不隐藏；不改主表行高与单标签悬停 Tooltip；边缘不裁切、普通视口完整可读）、`056` 新增/编辑复用同一弹窗实例、宽度由 `680px` 调至约 `900px` 且受视口限制保留安全间距、窄视口收缩不溢出、标题/关闭/页脚任意视口可操作、表单区沿用受控滚动、`057` 候选区可见高度适度增加且 `.cc-split` 由等宽改为“可选数据源”略宽于“已选”、候选/置灰/自排除语义零改动、弹窗/候选区允许既有受控滚动（`055` 的“不内部滚动”仅作用于 `+N` 弹层）、`058` `.cc-form-label` 排版令牌对齐 `.editor-dialog .el-form-item__label`（`14px/500/#3f3f46`）、沿用默认无衬线字体族、不套用主表等宽粗体、保留必填红星与校验语义、限定在探针弹窗的 scoped 样式、`059` 主提交按钮独立类名限定作用域并对齐 `.editor-submit-button` 黑色实心（正常 `#09090b`/白字/6px/字重 500、Hover·聚焦 `#27272a`、按下 `#18181b`、`:not(.is-disabled)` 保证禁用与 loading 不被正常态覆盖、仅此按钮改色、不加全局样式与 `!important`）、`060` 不改项、文案保持与回归边界（弹窗既有功能语义不变、按钮文案“创建”／“保存”不变、菜单“删除”不加粗且继续以红色文字/分隔线/Hover 焦点区分危险）。**与既有设计项的关系**：`CCFG-UI-009`/`CCFG-UI-024` 的“`+N` 清单最大高度内滚”口径被 `CCFG-DESIGN-055` 与 `CCFG-UI-044` 定向修订，两项原文**保留不改写**（仅在其项内标注），`CCFG-UI-024` 其余分句（弹窗内部滚动、Tooltip 单实例）继续有效。**状态分层**：本轮草案 `adjustment3_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment3_approval_status=NOT_APPROVED`、本轮实现 `adjustment3_implementation_status=NOT_STARTED`、本轮验收 `adjustment3_formal_acceptance_execution_status=NOT_RUN`；§13、§14 此前已批准基线保持 `APPROVED`，其实现事实保持真实、不改写。**编号与计数**：`CCFG-DESIGN-001~060`（60 条）连续、唯一、不新增/删除/重排历史编号，`CCFG-DESIGN-001~053` 既有 53 条设计定义行**逐字节零变化**；§12 追踪矩阵更新为 **122/122** 需求、**117/117** 验收；需求 122 条、验收 117 条（`CCFG-AC-105~117` 全部 `NOT_RUN`）、界面 49 条；`PENDING_USER_CONFIRMATION=0`。**不改** `API.md`/`DATABASE.md`、**不改**任何业务代码/测试/前端或后端源文件、**不**改 `docs/baseline/**` 与模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）、**不**改数据源管理参考页；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_REVIEW`（草案复审入口，**不是**直接进入实现） | `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001`（项目负责人已确认的四项视觉调整决策驱动的**草案**；纯文档任务，未实现代码、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受；用户同意四项 ≠ 文档已批准 ≠ 已实现 ≠ 已验收） |
| 2026-09-23 | 第三轮草案 **R1 定向纠错**（`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001-R1`，纯文档）：ChatGPT 从远程 Git 对 R0 草案提交 `a585071d86eeee47dbd8d986fdb6f90b32161033` 的复审结论为 `CHANGES_REQUIRED`，三项已确认产品决策不重新设计。① **`CCFG-AC-113` 步骤不可执行勘误**（详见 `ACCEPTANCE.md`）：改为**新增模式**核对探针 ID 输入框可直接填写（该模式不出现“修改探针 ID”开关、不显示“（已锁定）”）、**编辑模式**核对默认锁定与经“修改探针 ID”解锁/“取消修改”恢复锁定，其余原验收目标（自动生成、候选搜索、已选项、异常、校验、未保存关闭确认）逐项保留；**不**以修改页面行为来迁就错误步骤；② **R0 报告 §4.2 计数口径勘误**（详见新增 R1 报告）：需求侧正确表述为**10 条新增定义行（`113~122`）加 1 条修改的既有定义行（`016`）**，R0 原文“103 行新增”属笔误，R0 历史报告**不回写**、由 R1 报告以 errata 声明覆盖关系；③ **第二轮当前状态与入口纠错**：五份 Feature 文档中作为**当前**值的 `adjustment2_implementation_status` 统一改为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（第二轮实现已完成并经 ChatGPT 从远程 Git 对实现提交 `fecf5a06d90c690b5ee984a9e487f05322e1dd70` 独立代码复审通过，**当前等待项目负责人页面目测/接受，尚未最终接受页面**），保留其完成时点历史值 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 与旧报告、历史下一入口原文，并以追加时序说明区分历史与当前；现行下一入口统一为 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_R1_REVIEW`。**本文件不改变任何设计业务定义**：设计编号与数量 `CCFG-DESIGN-001~060`（60 条）保持连续、唯一、不新增/删除/重排，**60 条设计定义行相对提交 `a585071` 逐字节零变化**，§12 追踪矩阵（122/122、117/117）零改动；需求 122 条、验收 117 条（除 `CCFG-AC-113` 外逐字节一致，全部 `NOT_RUN`）、界面 49 条不变；`PENDING_USER_CONFIRMATION=0`；第三轮仍 `adjustment3_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment3_approval_status=NOT_APPROVED`、`adjustment3_implementation_status=NOT_STARTED`；**不**改 `API.md`/`DATABASE.md`、**不**改任何业务代码/测试/前端或后端源文件、**不**改 `docs/baseline/**` 与模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）、**不**改数据源管理参考页；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_R1_REVIEW` | `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001-R1`（ChatGPT 对 R0 草案的 `CHANGES_REQUIRED` 复审驱动的纯文档 R1 纠错；未实现代码、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受；未宣布第二轮用户最终接受或第三轮已批准） |
| 2026-09-23 | 第三轮 `+N` 清单与新增／编辑弹窗视觉调整基线**批准收口**（`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-APPROVAL-CLOSEOUT-001`，纯文档）：ChatGPT 从远程 Git 对第三轮 R1 纠错提交 `1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244` 的复审结论为 `APPROVED`，项目负责人于 2026-09-23 明确回复“批准”；本轮**状态变化仅为** `adjustment3_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 变为 `APPROVED`（并记录 §15 `adjustment3_approval_status=APPROVED_BY_PROJECT_OWNER`/`adjustment3_approval_date=2026-09-23`/`adjustment3_approved_reviewed_commit=1df0ef7...`），**不**改变任何设计业务定义。设计编号与数量 `CCFG-DESIGN-001~060`（60 条）保持连续、唯一、不新增/删除/重排，**60 条设计定义行相对提交 `1df0ef7` 逐字节零变化**，§12 追踪矩阵（122/122、117/117）零改动；需求 122 条、验收 117 条（全部 `NOT_RUN`）、界面 49 条不变；`PENDING_USER_CONFIRMATION=0`；`adjustment3_implementation_status=NOT_STARTED`（批准**不**等于已实现）、`adjustment3_formal_acceptance_execution_status=NOT_RUN`（**未**执行正式验收）；§13、§14 已批准基线与两轮实现事实保持真实、不改写、不抹除；两套模板的模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）不变，页面级授权**不新增、不扩大**；批准范围**仅**为 `/config/client` 的 `+N` 清单与新增／编辑弹窗视觉调整；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（只有该复审通过后才安排第三轮实现任务） | `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-APPROVAL-CLOSEOUT-001`（项目负责人批准驱动的第三轮视觉调整基线批准收口；纯文档任务，未实现代码、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受；**批准的是设计调整基线，尚未实现第三轮调整**） |
| 2026-09-23 | 第三轮 `+N` 清单与新增／编辑弹窗视觉调整**实现**（`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001`，前端实现）：按已批准基线实现 `/config/client` 五组视觉调整，落地 `CCFG-DESIGN-054~060`——① `+N` 弹层清单项两级信息（`.cc-full-org` 主信息 / `.cc-full-id` 前缀“数据源 ID：”次信息，`hasOrg` 为假时仅原始 ID 主信息、不重复；`.cc-full-bad` 异常与冲突信息保留；`.cc-full-note` 逗号歧义文案逐字保留）、② 移除 `.cc-full-list` 的 `max-height: 320px` 与 `overflow-y: auto`（清单自然增高、`.cc-full-item + .cc-full-item` 1px 浅分隔线）、③ 新增／编辑弹窗宽度 `680px`→`900px` 且 `max-width: calc(100vw - 48px)` 受视口限制、④ `.cc-opt-list`/`.cc-chosen-list` 最大高度 `200px`→`260px`、`.cc-pane--options` `flex: 1.15` 略宽于 `.cc-pane--chosen`、⑤ `.cc-form-label` 对齐 `14px/500/#3f3f46`、`.cc-dialog-submit:not(.is-disabled)` 黑色实心（`#09090b`/白字/6px/500，Hover·聚焦 `#27272a`、按下 `#18181b`）、菜单条目 `font-weight: 400`。**状态变化仅为** `adjustment3_implementation_status` 由 `NOT_STARTED` 变为 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`，**不**改变任何设计业务定义。设计编号 `CCFG-DESIGN-001~060`（60 条）保持连续、唯一、不重排，定义行相对起始提交 `cf0817f23c77190275b7f58c755c4e2c4619adc9` **逐字节零变化**（60 条逐字节 IDENTICAL），§12 追踪矩阵（122/122、117/117）零改动；需求 122 条、验收 117 条（全部 `NOT_RUN`）、界面 49 条不变；`PENDING_USER_CONFIRMATION=0`；两套模板的模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）不变，数据源管理参考页未修改；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_IMPLEMENTATION_REVIEW` | `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001`（前端实现任务；仅改本页 SFC、其 spec 与五份 Feature 文档当前状态、并新增一份实现报告；实现 **不**等于已目测、已验收或已接受；未运行正式验收） |
| 2026-09-23 | 第三轮实现 **R1 定向修复**（`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001-R1`，前端实现任务）：初次实现任务的浏览器报告承认 `CCFG-DESIGN-055` 的“靠近视口边缘不被无意裁切/普通视口完整可读”在 1440×900 首行 9 项场景**未满足**，本 R1 定向修复。**本文件不修改任何设计定义行**：`CCFG-DESIGN-001~060`（60 条）保持连续、唯一、不新增/删除/重排，定义行相对起始提交 `cf0817f23c77190275b7f58c755c4e2c4619adc9` **逐字节零变化**；本文件仅在 §15 追加 R1 时序说明并追加本条变更记录。根因：Element Plus 2.14.2 + `@popperjs/core 2.11.8` 的 `preventOverflow` 对 `top`/`bottom` 定位只在 `altAxis`（竖直轴）做贴边避让，而默认 `altAxis=false`；修复开启 `altAxis` 并将碰撞边界显式定为视口（`padding: 8`），`placement="top"` 仍为首选方向，未引入内部滚动或固定最大高度。需求 122 条、验收 117 条（**全部 `NOT_RUN`**）、设计 60 条、界面 49 条不变；`adjustment3_implementation_status` 保持 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`，实现**尚未提交、尚未推送**；现行入口为工作区差异审阅 `WORKTREE_DIFF_REVIEW_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_IMPLEMENTATION_R1` | `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001-R1`（第三轮实现裁切的定向修复；未执行正式验收或最终接受，未改写任何设计定义行） |
| 2026-09-24 | 新增／编辑弹窗校验与交互调整**草案**（`CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001`，纯文档）：依据项目负责人对 `/config/client` 新增／编辑探针弹窗已明确确认的**五组调整决定**，新增 §16 与 `CCFG-DESIGN-061~071`（11 条，追加在既有最大编号 `060` 之后，不重排历史编号）——`061` 弹窗字段级校验反馈模型（三项业务校验错误改为控件红框 + 错误文字在该控件正下方红色显示、提交时一次校验全部字段并逐字段显示错误且定位第一个错误、修正后仅清除该字段错误、取消以页面顶端临时消息代替字段内反馈且同一错误不重复弹顶端消息、编辑模式 ID 锁定／解锁流程保留、只改错误呈现位置与方式不改校验判定内容、限定探针弹窗 scoped 样式）、`062` 主提交按钮状态矩阵（“创建／保存”始终为与数据源管理主提交一致的黑色可点击样式、表单不完整仍可点击并在点击后显示字段级错误、**定向修订** `CCFG-DESIGN-059` 中由 `saveBlockReason` 引起的预先禁用、保留 `:loading` 处理中防重复提交、禁用／加载态可辨且加载态不在蓝黑间跳色）、`063` 可归属字段错误与全局错误边界（可归属字段的业务校验／冲突错误在字段下方以字段级反馈呈现、网络或不可归属系统错误可保留全局提示、接口契约与错误码零改动、既有前后端校验与防重复提交及成功行为保留、不放宽保存条件）、`064` 未选数据源中性提示三态（未选且未尝试提交时显示中性灰“至少选择 1 个数据源”、选中隐藏、全取消重现、不用红／绿表示正常未完成态、与错误态共用同一反馈区、候选资格与逗号 ID 规则零改动）、`065` 提交尝试后数据源错误态与状态恢复（点提交而未选数据源时同一反馈区转红并显示错误状态、选中后清除、再清空按“是否已尝试提交”正确恢复红或灰、无状态残留与错乱、恢复判定只依赖会话内是否点过提交且不写持久化）、`066` 反馈区稳定空间与窄视口边界（预留稳定空间使选中／取消／错误切换不造成弹窗底边与底部按钮跳动、新增／编辑共用同一稳定布局、换行错误文案保留可读性不硬裁剪、小视口沿用既有弹窗可操作与不异常横溢规则、实现方式以真实视口测量确定不写死像素）、`067` 弹窗相对**浏览器可见视口水平居中**（展开／收起侧栏与不同宽度视口均不左偏约半个侧栏宽、保留 `056` 的约 900px 与窄视口安全边距、不得写死侧栏相关偏移、以 Element Plus 视口居中机制为准并先测量后修值、只改定位不改尺寸与业务行为）、`068` 配置项名称**右对齐**排布（三项名称右对齐、右边缘整齐、左边缘无须对齐、红星仍在名前、`058` 字体规格与星号校验语义保留、输入控件区域对齐、限定探针弹窗 scoped 样式）、`069` 探针 ID **输入层 32 位上限与字段级格式报错**（输入与粘贴最多 32 位、超长不再无限录入、既有首位／允许字符／判空／大小写不敏感唯一性与后端校验不变、非法字符不得静默改写为另一 ID 而须字段级报错、新增可直接填写、编辑默认锁定可解锁、输入层上限不替代后端校验）、`070` 探针描述 **256 字符输入层与自动生成截断时序**（最多 256 个字符按 Unicode 完整字符计数、256 汉字亦为 256 字符、不拆代理对、输入与粘贴同一限制、提示改“最多 256 个字符”，保留 `039/059` 的原文保存／Trim 仅判空／后端 `VARCHAR2(1024 BYTE)` UTF-8 原文字节 ≤1024 防线且库表／API／服务端上限不改为 256 字节；自动生成先按原规则生成完整描述再直接保留前 256 字符写入、超长不失败不弹超长提示不追加拒绝保存逻辑、未选数据源完全无动作与无有效机构名等既有规则不变、对最终 256 字符文本继续执行 UTF-8 字节检查、末尾不完整为明确接受的截断；对 `CCFG-REQ-060`“完整结果超 1024 字节则生成失败”一句作**定向修订**并给出新旧时序对照）、`071` 编辑历史记录 **256 字符回显草稿**与范围边界及后续入口登记（原 `CLIENT_DESC` 超 256 字符仅回显前 256 字符为编辑草稿、打开不写库不偷改列表原记录、保存走既有校验与流程、不保存不改持久化；交互覆盖新增与编辑两种模式并保留候选资格／已分配提示／逗号 ID 规则／选择顺序／编辑锁定／保存接口与后端校验、仅页面级调整不改参考页与其他页面／全局组件／后端／数据库与两套模板全局状态；`CCFG-REQ-136` 的“新增／编辑表单弹窗模板”**仅登记**后续入口、不提前创建／批准模板、不声称其他页面已接入）。**定向修订既有设计定义行 1 条**（保留原文并就地标注方向，不伪装为原规则不存在）：`CCFG-DESIGN-059`（其 `:disabled="saveBlockReason !== null || submitting"` 中由 `saveBlockReason` 引起的禁用被 `CCFG-DESIGN-062` 定向修订——不得仅因未选数据源预先禁用，表单不完整仍可点击并在点击后显示字段级错误；`:loading="submitting"` 防重复提交语义保留）。**状态分层**：本轮草案 `adjustment4_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment4_approval_status=NOT_APPROVED`、`adjustment4_implementation_status=NOT_STARTED`、`adjustment4_formal_acceptance_execution_status=NOT_RUN`；§13、§14、§15 此前已批准基线保持 `APPROVED`，其实现事实不改写、不抹除。**编号与计数**：`CCFG-DESIGN-001~071`（71 条）连续、唯一、不新增/删除/重排历史编号；除 `CCFG-DESIGN-059` 的定向标注外，既有 `CCFG-DESIGN-001~060` 共 60 条设计定义行相对第三轮基线提交 `cb9009a88a1fa4abb2b65a4ea850c5e881e46529` **逐字节零变化**（本轮以 `cb9009a8` 为起始提交）；§12 追踪矩阵更新为 **136/136** 需求、**135/135** 验收；需求 136 条、验收 135 条（`CCFG-AC-118~135` 全部 `NOT_RUN`）、界面 59 条；`PENDING_USER_CONFIRMATION=0`。**不改** `API.md`/`DATABASE.md`、**不改**任何业务代码/测试/前端或后端源文件、**不改** `docs/baseline/**` 与两套模板全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）、**不改**数据源管理参考页；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_REVIEW`（草案复审入口，**不是**直接进入实现） | `CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001`（项目负责人已确认的五组弹窗校验与交互调整决策驱动的**草案**；纯文档任务，未实现代码、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受；用户确认五组调整 ≠ 文档已批准 ≠ 已实现 ≠ 已验收） |
| 2026-09-24 | 第四轮弹窗校验与交互调整草案 **R1 定向纠错**（`CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001-R1`，纯文档）：ChatGPT 从远程 Git 对 R0 草案提交 `51be9aa66f0555da331b20b2ae5d4cc2f370f880` 的复审结论为 `CHANGES_REQUIRED`，仅修正三处文档一致性问题，五组产品决定不重新设计。① **R1-01 按钮旧规则与新规则冲突**——本条（`CCFG-DESIGN-059`）追加 **【R1 定向核对（2026-09-24）】** 标注，确认其与 `CCFG-REQ-120`、`CCFG-AC-115`、`CCFG-UI-047` 及 `CCFG-DESIGN-062` 状态矩阵**精确一致**：被收窄的**仅**为“因表单未完成／校验未通过（含未选数据源）而预先禁用”的口径（由 `CCFG-DESIGN-062`／`CCFG-REQ-124`／`CCFG-AC-120`／`CCFG-UI-051` 取代），现行口径保留为“提交请求处理中暂不可重复提交 + 清楚加载反馈 + 无蓝黑跳色”与“仅此主提交按钮改色”“文案保持‘创建’／‘保存’”；`CCFG-DESIGN-062` 就“始终”**限定为「非提交处理中」的常态**并追加两种状态并存关系说明，明确“表单未完成 → 可点且黑色；请求处理中 → 暂不可重复提交且不跳色”同时成立、无冲突。② **R1-02 不可能验收输入**——核对 `CCFG-DESIGN-070` 的 256 字符／1024 字节表述**无同类错误**（其已正确表述 256 字符按 Unicode 完整字符计数、必然 ≤1024 字节，且库表／API 上限不改为 256 字节），缺陷**仅**在 `CCFG-AC-131` 步骤，本文件**不**需为此修改任何设计定义行。③ **R1-03 追踪映射不实**——移除 §12.1 `CCFG-REQ-136` 行与 §12.2 `CCFG-AC-135` 行中无依据的 `CCFG-UI-059` 映射（该界面条目实际只承载描述长度、自动生成截断与历史回显），并在 §12 说明中新增 **R1 说明（2026-09-24）**，明确未来“新增／编辑表单弹窗模板”入口属**文档治理／范围声明**、本轮**无新增 UI 元素**、`CCFG-REQ-136`／`CCFG-AC-135` 仅由 `CCFG-DESIGN-071` 承载，该“无 UI 映射”**不是缺项**、也**不**以描述长度 UI 规则凑数。**编号与计数**：`CCFG-DESIGN-001~071`（71 条）连续、唯一、不新增/删除/重排；除 `CCFG-DESIGN-059`（R0 目标标注 + 本轮 R1 核对标注）与 `CCFG-DESIGN-062`（本轮最小措辞同步 + R1 说明）外，其余设计定义行相对 `51be9aa` **逐字节零变化**；§12 矩阵仍为 **136/136** 需求、**135/135** 验收（仅去除非真实 UI 映射）；第四轮仍 `adjustment4_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment4_approval_status=NOT_APPROVED`、`adjustment4_implementation_status=NOT_STARTED`、`adjustment4_formal_acceptance_execution_status=NOT_RUN`；验收 135 条**全部 `NOT_RUN`**；`PENDING_USER_CONFIRMATION=0`；**不**改 `API.md`/`DATABASE.md`、**不**改任何业务代码/测试/前端或后端源文件、**不改** `docs/baseline/**` 与两套模板全局状态、**不改**数据源管理参考页；**不**回写 R0 报告；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_R1_REVIEW` | `CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001-R1`（ChatGPT 对第四轮 R0 草案的 `CHANGES_REQUIRED` 复审驱动的纯文档 R1 纠错；未实现代码、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受；不得宣称第四轮已批准、已实现或已验收） |
| 2026-09-24 | 第四轮弹窗校验与交互调整基线**批准收口**（`CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-APPROVAL-CLOSEOUT-001`，纯文档）：R0 草案提交 `51be9aa66f0555da331b20b2ae5d4cc2f370f880` 的 ChatGPT 远程复审为 `CHANGES_REQUIRED`，R1 纠错结果提交 `9daf03848d53008d3ac73e6a43c1368fa5d72750` 的 ChatGPT 远程**基线文档复审**为 `APPROVED`，项目负责人于 2026-09-24 明确回复“批准”；第四轮设计调整基线**状态变化仅为** `adjustment4_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 变为 `APPROVED`（并新增元数据 `adjustment4_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment4_approval_date=2026-09-24`、`adjustment4_approved_reviewed_commit=9daf03848d53008d3ac73e6a43c1368fa5d72750` 与 §16 批准依据），**不**改变任何设计业务定义。**本文件不修改任何设计定义行**：`CCFG-DESIGN-001~071`（71 条）保持连续、唯一、不新增/删除/重排，相对提交 `9daf038` **逐字节零变化**（含 R0 定向标注的 `CCFG-DESIGN-059` 与 R1 的 `CCFG-DESIGN-062`、§12 映射纠正均不回退）；本轮实现保持 `adjustment4_implementation_status=NOT_STARTED`（批准**不**等于已实现）、本轮验收 `adjustment4_formal_acceptance_execution_status=NOT_RUN`；全文件 135 条验收仍全部 `NOT_RUN`；§13、§14、§15 此前已批准基线与既有实现事实均不改写；§12 追踪矩阵保持 136/136 需求与 135/135 验收，`PENDING_USER_CONFIRMATION=0`；**不**改 `API.md`/`DATABASE.md`、**不**改任何业务代码/测试/前端或后端源文件、**不**改 `docs/baseline/**` 与模板级全局状态、**不**改数据源管理参考页、**不**回写 R0／R1 报告；现行下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（只有该复审通过后才进入第四轮实现任务） | `CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-APPROVAL-CLOSEOUT-001`（项目负责人批准驱动的第四轮弹窗校验与交互调整设计基线批准收口；纯文档任务，未修改代码/测试、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受；不得宣称第四轮已实现或已验收） |
