# 源库快照状态 Feature 需求草案（REQUIREMENTS）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态（页面、菜单、路由元数据标题、面包屑最终统一使用的用户可见名称；实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001` 已将 `menu.ts` 本页标题行与 `router/index.ts` 本页标题元数据更新为“源库快照状态”并替换占位页，见 Feature README §6） |
| Feature 标识 | `data-source-snapshot-status`（Feature 文档目录标识；任务代码前缀 `DATA-SOURCE-SNAPSHOT-STATUS`） |
| 所属模块 | 运行监控 |
| 既有路由 | `/monitor/data-source-state`（保持既有值不变） |
| 前端源码目录 | `frontend/src/views/data-source-run-state/`（保留既有目录名；命名映射见 README §6） |
| 前端现状 | `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue` 已由占位页替换为正式“源库快照状态”实现页（实现任务后事实，见 Feature README §6） |
| 后端现状 | 已新增针对 `CDC_DATA_SOURCE_RUN_STATE` 的只读访问链路 `GET /api/monitor/data-source-run-state/list`（实现任务后事实，见 Feature README §6） |
| 目标文档 | `docs/features/data-source-snapshot-status/REQUIREMENTS.md` |
| 文档状态 | `APPROVED`（当前版为 2026-09-08 第二轮验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002` 及其 R1 极小定向修订 `...-002-R1`、R2 极小纠正 `...-002-R2` 与 R3 记录纠正 `...-002-R3` 后的重新批准收口版。驱动：项目负责人对第一轮 UI 调整实现 R1（提交 `5933ec2...`）对应的当前预览页面进行人工检查，结论为需要继续调整（human_visual_review_status=CHANGES_REQUIRED，作为第一轮页面人工检查历史）。第一轮 UI 调整批准版本（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07；实现 R1 提交 `5933ec2...` 经 ChatGPT 独立代码与证据复审 `APPROVED`、实现状态收口为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`）保留为历史。本轮（第二轮）在第一轮批准版本之上只围绕四类已确认调整范围定向修订展示规则相关既有需求行并新增 `DSS-REQ-072~075`（见 §21.2/§21.3），不改接口、SQL、表结构、数据库访问与产品只读边界（API.md/DATABASE.md 整文件零差异）。第二轮版本曾于 2026-09-08 收口为 `APPROVED`（ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审 `APPROVED`、项目负责人随后明确“批准”，正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`），该批准作为历史批准事实保留；但批准收口后发现批准内容把“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”误记为现行规则，与项目负责人真实需求冲突（ChatGPT 在准备第二轮实现任务时发现该冲突并暂停，项目负责人再次确认源库列悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`），故本 R2 纯文档纠正该唯一业务语义并重新进入复审，经 R3 记录纠正（`...-002-R3`）后 ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED`、项目负责人明确回复“批准”，本轮已重新批准收口为 `APPROVED`（当前正式重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`，批准日期 2026-09-08）。第二轮调整尚未实现、正式验收与人工视觉验收均 `NOT_RUN`（`DSS-AC-001~086` 全部 `NOT_RUN`）、`human_visual_review_status=CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=NO`、`pending_user_confirmation_count=0`，不等于 `IMPLEMENTED_ACCEPTED`；批准内容与下一入口见本表“本轮（第二轮 UI 调整版本）重新正式批准版本”、§1 文档事实边界声明与 §24） |
| 设计固化文档状态（隔离视觉原型 R2～R7） | `APPROVED`（2026-09-10 任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001` 新增的“隔离视觉原型 R2～R7 最终视觉方案固化”内容（§21.4/§21.5 及 `ACCEPTANCE.md` §4.20/`DESIGN.md` §25/`UI.md` §19 对应落点）原为 `DRAFT_PENDING_USER_REVIEW`，经 ChatGPT 对批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a` 最终复审 `APPROVED`、项目负责人 2026-09-10 明确回复“批准”，已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001` 收口为 `APPROVED`；见 §21.4/§21.5/§24/§25） |
| 本轮（隔离视觉原型 R2～R7 设计固化）正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001` |
| 本轮（隔离视觉原型 R2～R7 设计固化）批准内容基准 | `e67b2ecc3897c3e83597126e259ee4c19349a66a`（ChatGPT 最终复审 `APPROVED` 的批准内容基准；`DSS-REQ-076~083` 业务文字以此提交为业务零变化基准） |
| 本轮（隔离视觉原型 R2～R7 设计固化）批准日期 | 2026-09-10 |
| 隔离视觉原型 R2～R7 视觉方向状态 | `APPROVED_BY_PROJECT_OWNER`（`5174` 隔离视觉 prototype 的 R2～R7 最终视觉效果已由项目负责人人工查看并明确认可（“视觉原型已经相当 OK”）；`5174` 是隔离视觉 prototype、**不是正式前端**；该认可只针对 prototype 视觉方向本身，不代表 `5173` 正式实现已完成、不代表正式验收已执行或通过） |
| 5173 正式实现状态（隔离视觉原型 R2～R7 视觉方案） | `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（`formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`：R2～R7 视觉方案已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001`（2026-09-10）应用到 `frontend/`（`5173`）正式“源库快照状态”页面，任务基准提交 `c568df1f7b0be14b7decdf59f2ef9116ff0bf403`＝批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a` 的后继站点；已通过定向/Feature/前端全量测试、类型检查、生产构建及真实后端四档视口浏览器**开发自测**（`browser_verification_status=DEV_SELF_TEST_DONE`）；ChatGPT 已从 Git 完成本次正式实现代码复审，代码结论 `formal_5173_code_review_status=APPROVED`；项目负责人已在 `5173` 人工检查本页并判定 `project_owner_visual_review_status=CHANGES_REQUIRED`（仅针对已确认的查询控件交互问题，不否定页面整体视觉与本代码复审结论，当前由查询控件交互调整基线承接：`query_control_interaction_adjustment_status=APPROVED`、`query_control_interaction_adjustment_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`（已于 2026-09-10 批准收口，尚未应用到 `5173`））；正式验收与人工视觉验收仍 `NOT_RUN`（`formal_acceptance_status=NOT_RUN`、`acceptance_not_run_count=103`）；**不代表**正式验收或人工视觉验收已执行或通过、**不代表** `IMPLEMENTED_ACCEPTED`；prototype 的浏览器验证、测试与构建结果仍属**设计验证证据**；见 §21.4/§24） |
| 文档总体状态（隔离视觉原型 R2～R7 视觉固化） | `PROTOTYPE_DESIGN_APPROVED_AND_IMPLEMENTED_ON_5173_PENDING_REVIEW`（prototype 视觉方向已获项目负责人认可、R2～R7 设计固化文档已批准收口为 `APPROVED`，并已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001` 应用到 `5173` 正式前端、完成开发自测；原正式实现代码复审已通过（`formal_5173_code_review_status=APPROVED`），项目负责人已在 `5173` 人工检查并提出查询控件交互调整（`project_owner_visual_review_status=CHANGES_REQUIRED`），当前查询控件交互调整基线已批准、尚未应用到 `5173`（`query_control_interaction_adjustment_status=APPROVED`、`query_control_interaction_adjustment_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`），正式验收仍 `NOT_RUN`（`formal_acceptance_status=NOT_RUN`、`acceptance_not_run_count=103`）；不得写成 `FORMALLY_ACCEPTED`/`IMPLEMENTATION_APPROVED`/`ACCEPTANCE_PASSED`/`COMPLETED`，正式验收与人工视觉验收仍 `NOT_RUN`） |
| 本轮（查询控件交互调整草案）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001`（正式实现人工检查后发现问题的纯文档调整基线建立；**只建立文档草案，不修改代码、不批准草案、不执行正式验收**） |
| 本轮（查询控件交互调整草案）授权基线提交 | `ba309ea8b469e3796ab08ed87c6ccb8c6d5bb253`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；原正式实现 R1 文档纠正提交同为此提交） |
| 本轮（查询控件交互调整草案）原正式实现提交 | `3ec9cbf6487eacff004212fb3aca3064c3bd18cc`（R2～R7 视觉方案应用到 `5173` 正式前端的原正式实现提交） |
| 本轮（查询控件交互调整草案）已批准视觉内容基准 | `e67b2ecc3897c3e83597126e259ee4c19349a66a`（已获批准收口的 R2～R7 视觉内容基准；本轮草案只在其之上做查询控件交互与字段截断的定向调整，不改其整体视觉方案） |
| 5173 正式实现代码复审状态 | `APPROVED`（`formal_5173_code_review_status=APPROVED`：ChatGPT 已从远程 Git 对 `5173` 正式实现完成代码复审并判定 `APPROVED`；**不代表**正式验收或人工视觉验收已执行或通过、不代表 `IMPLEMENTED_ACCEPTED`） |
| 项目负责人人工页面检查状态 | `CHANGES_REQUIRED`（`project_owner_visual_review_status=CHANGES_REQUIRED`：项目负责人对 `5173` 正式实现进行人工页面检查，认为整体视觉基本可接受，但实际操作查询控件后发现一组互相关联的交互问题，故当前不能进入正式验收；这是本轮查询控件交互调整草案的直接驱动） |
| 本轮（查询控件交互调整）状态 | `APPROVED`（`query_control_interaction_adjustment_status=APPROVED`：§21.6 新增 `DSS-REQ-084~086` 与 `ACCEPTANCE.md` §4.21 新增 `DSS-AC-096~103` 已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`，批准日期 2026-09-10），已纳入当前批准需求/验收基线；**不得**写成 `IMPLEMENTED`/`PASS`/`ACCEPTED`/`COMPLETED`） |
| 本轮（查询控件交互调整）实现状态 | `PENDING_FORMAL_IMPLEMENTATION_ON_5173`（`query_control_interaction_adjustment_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`：本轮调整已批准但尚未实现、尚未应用到 `5173`；须另立实现任务，不得在本任务或批准收口任务中实现） |
| 本轮（查询控件交互调整）取代关系 | 本轮调整只取代与查询控件外部几何固定、四字段 20 Unicode code point 截断、`CLIENT_DESC` 完整 Tooltip 直接相关的现行规则（对 `DSS-REQ-022/024` 候选截断与控件/面板宽度口径、`DSS-REQ-075` 探针下拉按字段截断口径做定向取代或扩展，落点 `DSS-REQ-084/085/086`，取代说明见 §21.7）；既有 R2～R7 设计批准事实、`5173` 正式实现事实与 ChatGPT 代码复审 `APPROVED` 全部保留，**不得**把既有正式实现整体倒退为“未实现” |
| 需求编号计数（本轮调整批准后） | `DSS-REQ-001`～`DSS-REQ-086` 共 **86** 条（既有已批准 83 条维持不变；本轮调整新增 `DSS-REQ-084~086` 共 3 条，见 §21.6；既有编号连续唯一、业务行未被修改） |
| 验收编号计数（本轮调整批准后） | `DSS-AC-001`～`DSS-AC-103` 共 **103** 条，**全部 `NOT_RUN`**（既有 95 条维持 `NOT_RUN`；本轮调整新增 `DSS-AC-096~103` 共 8 条，见 `ACCEPTANCE.md` §4.21；`acceptance_not_run_count=103`） |
| 下一入口（本轮调整） | `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001`（本轮调整基线已于 2026-09-10 批准收口，下一入口只能是独立正式实现任务；**不得**在本任务直接进入实现、不得执行正式验收） |
| 通用查询列表页 UI 基线状态 | `NOT_CREATED_BY_DESIGN`（通用 `QUERY-LIST-PAGE-UI-PATTERN` 项目基线须待本页 `5173` 正式实现并验收后再提炼；本固化任务**不得**提前创建或批准该通用基线） |
| requirements_status | `APPROVED`（当前第二轮 UI 调整版本经 R2 极小纠正与 R3 记录纠正后重新批准收口：第二轮版本曾于 2026-09-08 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`，作为历史批准事实保留），因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`、与负责人真实需求（悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`）冲突，R2 极小纠正后重新进入复审，经 R3 记录纠正后 ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED`、项目负责人明确回复“批准”，于 2026-09-08 重新批准收口为 `APPROVED`（当前正式重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`）；`DSS-REQ-001~075` 共 75 条；原批准版本 `...-APPROVAL-002`/批准内容基准 `5da9b17...` 仅作为 R2 纠正前的历史批准事实保留、不得作为当前批准内容或未来实现业务基准；第一轮 UI 调整批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`（批准内容基准提交 `5757237...`，2026-09-07）保留为历史）。**本轮（2026-09-10 查询控件交互调整）在已批准 83 条之上新增 `DSS-REQ-084~086`，调整后当前编号合计 `DSS-REQ-001~086` 共 86 条，其中 `DSS-REQ-084~086` 已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`，批准日期 2026-09-10），已纳入当前批准需求基线（见 §21.6 与本表“本轮（查询控件交互调整）状态”行）**） |
| acceptance_status | `APPROVED`（当前第二轮 UI 调整版本经 R2 极小纠正与 R3 记录纠正后重新批准收口，同本表 requirements_status；`DSS-AC-001~086` 共 86 条全部 `NOT_RUN`、正式验收未执行，见 `ACCEPTANCE.md`；第一轮批准版本保留为历史）。**本轮（2026-09-10 查询控件交互调整）新增 `DSS-AC-096~103`，调整后当前编号合计 `DSS-AC-001~103` 共 103 条、全部 `NOT_RUN`，已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`，批准日期 2026-09-10）（见 `ACCEPTANCE.md` §4.21 与本表“验收编号计数（本轮调整批准后）”行）**） |
| 实现状态 | `IMPLEMENTED_ADJUSTMENT_PENDING`（implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING：第二轮 UI 调整尚未实现；本轮重新批准收口（`...-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`）不代表本轮调整已实现，将在另立的第二轮 UI 调整实现任务中严格按该重新批准内容基准落地。第一轮 UI 调整已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`（2026-09-07）落地、实现 R1 提交 `5933ec2...` 经 ChatGPT 独立代码与证据复审 `APPROVED`、实现状态收口为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`，作为历史保留；不代表代码复审通过、不代表正式验收或人工验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`。R2～R7 视觉方案已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001` 应用到 `5173` 正式前端并经 ChatGPT 代码复审 `APPROVED`；本轮查询控件交互调整的实现状态另见本表“本轮（查询控件交互调整）实现状态”行，为 `PENDING_FORMAL_IMPLEMENTATION_ON_5173`） |
| 验收执行状态 | `NOT_RUN`（acceptance_execution_status=NOT_RUN；`DSS-AC-001~086` 共 86 条全部 `NOT_RUN`、acceptance_not_run_count=86，正式验收未执行。**本轮查询控件交互调整批准后：`DSS-AC-001~103` 共 103 条全部 `NOT_RUN`、`acceptance_not_run_count=103`（含本轮 8 条验收），正式验收仍未执行**） |
| 设计状态 | `DESIGN.md`/`UI.md` 当前第二轮调整版本经 R2 极小纠正与 R3 记录纠正后为 `APPROVED`（当前正式重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`，2026-09-08；曾收口为 `APPROVED` 的正式批准版本 `...-APPROVAL-002` 作为历史批准事实保留，R2 纠正源库 Tooltip 内容后重新进入复审、R3 记录纠正后经 ChatGPT 复审 `APPROVED` 与项目负责人批准重新收口，见对应文档）；`API.md`/`DATABASE.md` 保持已批准（`APPROVED`）且本轮**整文件零差异**（本轮不改接口、SQL、表结构、数据库访问与产品只读边界）；本轮查询控件交互调整在 `DESIGN.md` §26 与 `UI.md` §20 的查询控件设计已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`，2026-09-10），尚未应用到 `5173` |
| pending_user_review | `NO`（本轮查询控件交互调整范围：`pending_user_review=NO`、`pending_user_confirmation_count=0`，该基线已于 2026-09-10 批准收口为 `APPROVED`，下一入口为独立实现任务，见本表“本轮（查询控件交互调整）状态”与“下一入口（本轮调整）”行；第二轮 UI 调整版本历史为 `NO`）／历史（第二轮 UI 调整版本经 R2 极小纠正与 R3 记录纠正、ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED` 与项目负责人明确回复“批准”后已重新批准收口，pending_user_review=NO、`pending_user_confirmation_count=0`，当时下一入口为另立第二轮 UI 调整实现任务（该实现任务已于 2026-09-08 完成，当前事实见本表“5173 正式实现代码复审状态”“项目负责人人工页面检查状态”与“本轮（查询控件交互调整草案）状态”行）。历史：第二轮版本曾于 2026-09-08 收口为 `APPROVED`（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，作为历史批准事实），R2 因批准内容误记源库 Tooltip 内容而纠正并恢复 `pending_user_review=YES`，经 R3 记录纠正后重新批准为 `NO`（当前重新批准版本 `...-APPROVAL-002-R1`）。第一轮 UI 调整版本的 `pending_user_review=NO` 已收口，作为历史） |
| 正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`（项目负责人明确“批准”驱动的需求与验收基线批准收口） |
| 批准链 | R0 需求与验收草案建立 → R1 定向修订 → R2 最小定向修订 → R3 极小定向修订 → ChatGPT 对 R3 结果正式复审 `APPROVED`（R3 结果提交 `4234af73db2190098f3dcd219319a4281fdabafd`）→ 项目负责人随后明确回复“批准” |
| 批准依据提交 | `4234af73db2190098f3dcd219319a4281fdabafd`（ChatGPT 对 R3 结果正式复审 `APPROVED` 的 R3 结果提交；本批准收口以该提交为批准内容基准） |
| 批准日期 | 2026-09-05 |
| 第一轮（UI 调整版本）正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`（本轮 UI 调整需求/验收/设计批准收口；项目负责人明确“批准”驱动） |
| 第一轮（UI 调整版本）批准链 | R0 验收前 UI 调整草案提交 `dc1d5285a541dd799521a778e5d00996ea0b4222` → ChatGPT 正式复审 `CHANGES_REQUIRED`（唯一问题：`auto`/`restore` 刷新在途时“立即刷新”按钮 loading 语义不明确）→ 项目负责人确认 `initial/retry/query/manual/auto/restore` 六类请求唯一视觉映射 → R1 极小定向修订提交 `575723711ca39d7761df308c1c99b1e6e957cf70` → ChatGPT 对 R1 结果独立正式复审 `APPROVED` → 项目负责人明确回复“批准” |
| 第一轮（UI 调整版本）批准依据提交 | `575723711ca39d7761df308c1c99b1e6e957cf70`（ChatGPT 对 UI 调整 R1 结果独立正式复审 `APPROVED` 的 R1 结果提交；本批准收口以该提交为批准内容基准） |
| 第一轮（UI 调整版本）批准日期 | 2026-09-07 |
| 本轮（第二轮 UI 调整草案）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`（第二轮验收前 UI 调整草案建立；项目负责人对第一轮 UI 调整实现 R1 对应预览页人工检查结论 `CHANGES_REQUIRED` 驱动；**纯文档草案**，未批准、第二轮调整未实现、正式验收未执行） |
| 本轮（第二轮 UI 调整草案）授权基线提交 | `5933ec29dce5f20b3d34aa101de4c8f9a884b93a`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；第一轮 UI 调整实现 R1 结果提交同为此提交） |
| 本轮（第二轮 UI 调整草案）驱动来源 | 项目负责人人工页面检查结论（任务提示词 §4，无待人工决策项）：① 表格必须铺满结果卡片（去除固定 `1145px`，五固定列＋探针/源库两弹性列）；② 探针端列展示简化（仅原始 `CLIENT_ID`、Tooltip 仅完整 `CLIENT_DESC`、删除黄色图标、非启用红字“停用”、缺失静默）；③ 源库列展示简化（删除黄色图标；表格主内容显示 ORG、ORG 为空/配置缺失时回退原始 ID；悬停 Tooltip 均只显示完整原始 `DATA_SOURCE_ID`）；④ 探针端查询下拉框长度与文本截断（ID/描述各 20 Unicode 字符＋`...`、控件/面板宽度上限、完整 value 不变） |
| 本轮（第二轮 UI 调整版本）正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`（本轮第二轮 UI 调整需求/验收/设计批准收口；项目负责人明确“批准”驱动；该批准版本作为历史批准事实保留——批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`，与负责人真实需求冲突，已由 R2 `...-002-R2` 纯文档纠正并重新进入复审） |
| 本轮（第二轮 UI 调整版本）批准链 | 项目负责人对第一轮 UI 调整实现 R1（提交 `5933ec2...`）对应预览页人工检查结论 `CHANGES_REQUIRED`（表格铺满、探针端列简化、源库列简化、查询下拉截断四类）→ 第二轮验收前 UI 调整草案初版提交 `0889cec1a67b6e0be654f6cb1f771b71df19677d` → ChatGPT 对初版独立复审 `CHANGES_REQUIRED`（四项核心调整通过，残留冲突见 `DSS-REQ-067`、DESIGN §5.6、UI §8.2/§16.1 与实现职责）→ R1 极小定向修订提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` → ChatGPT 对 R1 结果独立正式复审 `APPROVED` → 项目负责人明确回复“批准” |
| 本轮（第二轮 UI 调整版本）批准依据提交 | `5da9b17c1a720f89482eeda1436ad633145fe9fa`（ChatGPT 对第二轮 R1 结果独立正式复审 `APPROVED` 的 R1 结果提交；本批准收口以该提交为批准内容基准） |
| 本轮（第二轮 UI 调整版本）批准日期 | 2026-09-08 |
| 本版（第二轮 R2 极小纠正）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2`（ChatGPT 在准备第二轮实现任务时发现批准内容与负责人真实源库 Tooltip 需求冲突并暂停、项目负责人再次确认“显示源库ID”驱动的纯文档极小纠正；当前版本重新进入复审、第二轮调整未实现、正式验收未执行） |
| 本版（第二轮 R2 极小纠正）授权基线提交 | `ae8756a2f80b0c418a7afd1da4d51c04d7b85e21`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；第二轮批准收口结果提交同为此提交） |
| 本版（第二轮 R3 记录纠正）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R3`（ChatGPT 对 R2 结果提交独立正式复审 `CHANGES_REQUIRED` 驱动的纯文档记录纠正；只纠正 R2 变更记录的审计描述与未来实现锚点，不改任何业务行；R3 结果提交 `cf40b5d1e5ef03712011edb5e10c20070b582273` 为当前重新批准内容基准） |
| 本版（第二轮 R3 记录纠正）授权基线提交 | `e38cfaa4c4aed7b8e6a2a27b6df2774a8e8ef167`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；第二轮 R2 纠正结果提交同为此提交） |
| 本轮（第二轮 UI 调整版本）重新正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`（当前正式重新批准版本：第二轮 R2/R3 纠正版需求/验收/设计基线经 ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED` 与项目负责人明确回复“批准”后重新批准收口；原批准版本 `...-APPROVAL-002` 与批准内容提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 仅作为 R2 纠正前的历史批准事实保留，不作为当前批准内容或未来实现业务基准） |
| 本轮（第二轮 UI 调整版本）重新批准内容基准 | `cf40b5d1e5ef03712011edb5e10c20070b582273`（ChatGPT 对 R3 结果独立正式复审 `APPROVED` 并获项目负责人批准的重新批准内容基准；当前第二轮 R2/R3 纠正版即以此提交为业务零变化基准，未来第二轮 UI 调整实现任务也须严格以此提交为业务依据） |
| 本轮（第二轮 UI 调整版本）重新批准链 | R2 极小纠正提交 `e38cfaa4c4aed7b8e6a2a27b6df2774a8e8ef167` → ChatGPT 独立正式复审 `CHANGES_REQUIRED`（两类审计记录错误）→ R3 记录纠正提交 `cf40b5d1e5ef03712011edb5e10c20070b582273` → ChatGPT 对 R3 结果提交独立正式复审 `APPROVED` → 项目负责人明确回复“批准” |
| 本轮（第二轮 UI 调整版本）重新批准日期 | 2026-09-08 |
| 初版任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001`（初版需求与验收草案建立） |
| 本版（R1）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1`（ChatGPT 正式复审 `CHANGES_REQUIRED` 后的纯文档定向修订；历史版本） |
| 本版（R2）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2`（ChatGPT 对 R1 结果正式复审 `CHANGES_REQUIRED` 后的纯文档最小定向修订；历史版本） |
| 本版（R3）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3`（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED` 后的纯文档极小定向修订：只修正验收草案 `DSS-AC-024` 文字、不改任何需求业务语义；历史版本，其后经批准收口为 `APPROVED`） |
| 任务类型 | 纯文档——需求与验收草案及 R1/R2/R3 定向修订（只修订功能级文档并提交、推送；严禁进入设计、编码、数据库访问或运行服务阶段） |
| 初版授权基线提交 | `72b305a8e4134d10f514920c215b9647fb7d9e3b`（初版任务开始时 `origin/develop` 最新提交） |
| 本版（R1）授权基线提交 | `91eb2209a99a65ef1d433c2fb1c815a1abcd5bd5`（R1 任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；历史基线） |
| 本版（R2）授权基线提交 | `0476c40a49f1a7aa6d48fe58194c92982276fd60`（R2 任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；历史基线） |
| 本版（R3）授权基线提交 | `5c58af6b0a378c8534ebc0b76eaa7bc75b6a847a`（R3 任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；历史基线） |
| 本版（UI 调整草案）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`（验收前 UI 调整草案建立；ChatGPT 对实现 R1 提交 `37825272c25c8a2d8a595ff0d5c25c6349186663` 代码复审 `CHANGES_REQUIRED` 后，项目负责人提出更完整的 UI 调整，本轮在已批准基线之上建立**纯文档调整草案**；未实现、未执行正式验收、未批准） |
| 本版（UI 调整草案）授权基线提交 | `37825272c25c8a2d8a595ff0d5c25c6349186663`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0） |
| 调整草案关系 | 既有已批准需求/验收基线（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`）、已批准设计基线（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`）与第一轮 UI 调整批准版本（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07，已由实现任务 `...-UI-ADJUSTMENT-IMPLEMENTATION-001` 落地、实现 R1 提交 `5933ec2...` 经 ChatGPT 独立代码与证据复审 `APPROVED`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`）全部保留为历史。本轮第二轮 UI 调整草案（R0 `...-002`）及 R1 极小定向修订（`...-002-R1`）曾经 ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审 `APPROVED` 且项目负责人明确回复“批准”，收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准日期 2026-09-08），作为历史批准事实保留。因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`，本 R2 `...-002-R2` 纯文档纠正为“悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（不论主内容 ORG 或回退原始 ID）”并重新进入复审。本轮只定向修订展示规则并新增 `DSS-REQ-072~075`（见 §21.2/§21.3），不改接口、SQL、表结构、数据库访问与产品只读边界（API.md/DATABASE.md 整文件零差异）。当前第二轮 R2/R3 纠正版已重新批准收口（正式重新批准版本 `...-APPROVAL-002-R1`，重新批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`，2026-09-08）。当时下一入口为另立第二轮 UI 调整实现任务（严格以当时重新批准内容提交 `cf40b5d1e5ef03712011edb5e10c20070b582273` 为业务基准；本轮重新批准收口任务不直接实现；该实现任务已于 2026-09-08 完成，当前下一入口见本表“下一入口（本轮调整草案）”行） |
| 文档版本 | 第二轮 UI 调整 R2/R3 纠正重新批准收口版（2026-09-08）：在第一轮 UI 调整批准版本（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07）之上建立第二轮验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002` 及其 R1 极小定向修订 `...-002-R1`，曾经 ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审 `APPROVED` 与项目负责人明确“批准”，收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，2026-09-08，作为历史批准事实保留）；R2 极小纠正 `...-002-R2` 因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG` 而纠正为只显示完整原始 `DATA_SOURCE_ID`，R3 记录纠正 `...-002-R3` 修正审计描述与未来实现锚点后经 ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED` 与项目负责人明确“批准”，当前版本已重新批准收口：`requirements_status`/`acceptance_status` 与 `design_status(DESIGN/UI)` 当前第二轮调整版本均 `APPROVED`（当前正式重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`，批准日期 2026-09-08）、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`pending_user_review=NO`。历史版本：需求与验收批准收口版（2026-09-05，正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准 `4234af73db2190098f3dcd219319a4281fdabafd`）、第一轮 UI 调整批准版本与第二轮批准收口版保留为历史；批准的是各轮需求/验收/设计基线，不代表本轮调整已实现、正式验收已执行或通过。计数：需求 `DSS-REQ-001~075` 共 75 条、验收 `DSS-AC-001~086` 共 86 条全部 `NOT_RUN`（详见 §24/§25） |
| 创建日期 | 2026-09-05（初版）；本版 R1、R2、R3 修订及批准收口同日；2026-09-07 建立第一轮 UI 调整草案并批准/实现；2026-09-08 建立第二轮 UI 调整草案（R0/R1）并批准收口为 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，同日以 `...-002-R2` 纯文档纠正源库 Tooltip 内容并重新进入复审、以 `...-002-R3` 记录纠正，并经 ChatGPT 复审 `APPROVED` 与项目负责人批准，于同日重新批准收口为 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`（批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`） |
| 需求来源 | 项目负责人已确认的产品决策（任务提示词 §6）+ 已核验数据库只读复核报告（`docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`）+ 既有 Feature 文档结构/术语约定（`topic-offset`、`client-config` 等仅作结构参考，不复制其业务规则）；本版 R1 依据 ChatGPT 正式复审意见（`CHANGES_REQUIRED`，R1-01~R1-03）与项目负责人已确认的 8 项交互方案、刷新工具栏稳定性要求、最新“重置不查询”决定（任务提示词 §5~§7）定向修订；本版 R2 依据 ChatGPT 对 R1 结果正式复审意见（`CHANGES_REQUIRED`，R2-01/R2-02）定向消除两个剩余歧义（任务提示词 §5~§6）；本版 R3 依据 ChatGPT 对 R2 结果正式复审意见（`CHANGES_REQUIRED`）极小定向修订验收草案 `DSS-AC-024` 文字（只指向“成功刷新却不更新最近成功刷新时间”的验收矛盾，任务提示词 §4~§6），不改变任何需求业务语义。本版（第二轮 UI 调整草案 `...-002`）依据项目负责人对第一轮实现 R1 对应预览页人工检查结论（`CHANGES_REQUIRED`）定向修订（四类已确认调整范围见任务提示词 §4 与本表“本轮（第二轮 UI 调整草案）驱动来源”），不作为首轮批准基线的业务变更；本版（第二轮 R2 极小纠正 `...-002-R2`）依据 ChatGPT 在准备第二轮实现任务时发现批准版本把正常源库行 Tooltip 误记为完整 `DATA_SOURCE_ORG`、与负责人真实需求冲突并暂停、项目负责人再次确认“显示源库ID”，而做纯文档极小纠正（只改源库 Tooltip 内容语义与状态，不改其他业务语义） |

文档事实边界声明：

- 用户已确认的业务规则在本文件中作为需求事实记录（`DSS-REQ-*`）。
- 仓库现状（路由、菜单标题、占位页、无后端访问链路）作为 AS-IS 事实记录，并标注来源。
- `CDC_DATA_SOURCE_RUN_STATE` 数据库物理事实全部引用已提交数据库只读复核报告（见 §3），本文件不重新查询数据库。
- 本文件 R1 版已取消全部 `DRAFT_PROPOSAL_PENDING_USER_REVIEW` 草案建议（原 `DSS-PROP-001~008`）：8 项交互方案已由项目负责人确认并吸收到相应 `DSS-REQ-*` / `DSS-AC-*`，`pending_user_confirmation_count=0`；已批准版本为历史（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`），批准的是需求与验收标准基线，不代表设计已完成、功能已实现、验收已执行或通过（`pending_user_confirmation_count=0` 不等于 `IMPLEMENTED_ACCEPTED`）。
- 本文件第一轮历史记录（2026-09-07 验收前 UI 调整草案 `...-001` 及其 R1 `...-001-R1` 收口并实现的版本；其中展示规则凡被第二轮草案取代处，现行以第二轮 §21.2/§21.3 与 §11/§13 原位文字为准）：在已批准基线之上定向修订展示内容/Tooltip/刷新布局/busy 视觉状态相关既有需求行（`DSS-REQ-028/029/050`，修订说明见 §21.1）并新增独立需求行（`DSS-REQ-066~071`，见 §21）；该版本已经 ChatGPT 对 R1 结果提交 `5757237...` 独立正式复审 `APPROVED` 与项目负责人明确“批准”，`requirements_status`/`acceptance_status` 与 `design_status(DESIGN/UI)` 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07）；本轮 UI 调整已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`（2026-09-07）按批准内容基准提交 `5757237...` 落地，实现状态收口为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（已实现、待复审）、`pending_user_review=NO`、`pending_user_confirmation_count=0`。批准并实现完成不代表代码复审通过、不代表正式验收或人工验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`；既有批准基线保留为历史。本轮不改接口、SQL、表结构、数据库访问与产品只读边界（`API.md`/`DATABASE.md` 整文件零差异）。
- 本版（2026-09-08）为第二轮验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`）及其 R1 极小定向修订（`...-002-R1`）与 R2 极小纠正（`...-002-R2`）后的当前第二轮 UI 调整版本：项目负责人对第一轮 UI 调整实现 R1（提交 `5933ec2...`）对应预览页人工检查结论 `CHANGES_REQUIRED`，故在第一轮批准版本之上定向修订展示规则相关既有需求行（`DSS-REQ-022/024/028/029/041/042/043/044/045/069/070`，修订说明见 §21.3）并连续新增 `DSS-REQ-072~075`（见 §21.2）；该版本曾由 ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审 `APPROVED` 且项目负责人明确“批准”（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`，2026-09-08，作为历史批准事实）；批准收口后发现批准内容把“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”误记为现行规则，ChatGPT 在准备第二轮实现任务时发现该冲突并暂停，项目负责人再次确认源库列悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`，故本 R2 纯文档纠正该唯一业务语义并重新进入复审，R3 记录纠正 `...-002-R3` 修正审计描述与未来实现锚点后经 ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED`、项目负责人明确回复“批准”，本轮重新批准收口为 `APPROVED`（当前正式重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`，批准日期 2026-09-08）。当前第二轮调整版本：`requirements_status`/`acceptance_status`=`APPROVED`、`design_status(DESIGN/UI)`=`APPROVED`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`（本轮调整尚未实现）、正式验收执行 `NOT_RUN`（`DSS-AC-001~086` 全部 `NOT_RUN`、`acceptance_not_run_count=86`）、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`（第一轮页面人工检查历史，非本轮批准状态）、`pending_user_review=NO`、`pending_user_confirmation_count=0`。第一轮批准并实现完成的版本与原批准版本 `...-APPROVAL-002`/内容提交 `5da9b17...` 保留为历史（不得作为当前批准内容或未来实现业务基准）；重新批准的是本轮第二轮 UI 调整需求/验收/设计基线，不代表本轮调整已实现、正式验收或人工验收已执行或通过（不得写成 `IMPLEMENTED`/`PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`）。本轮不改接口、SQL、表结构、数据库访问与产品只读边界（`API.md`/`DATABASE.md` 整文件零差异）。
- 本文件不得自行增加 sync-client 控制、写能力、时间区间分析、Kafka/ZooKeeper 接入等超出已确认范围的实现；不得把“后续可扩展”写成第一版必须实现。

## 2. Feature 定位与术语

### 2.1 Feature 定位

“源库快照状态”属于 CDC 配置管理平台“运行监控”模块，是一个**绝对只读**的初始快照状态监控页面。页面读取数据库表 `CDC_DATA_SOURCE_RUN_STATE`，展示“探针端＋源库”组合处于源库初始快照的哪个阶段（快照进行中 `SNAPSHOT_RUNNING` / 快照已完成 `SNAPSHOT_COMPLETED`）与三个时间字段。页面只展示 RUN_STATE 中真实存在的记录，不补行、不推断虚拟状态，对表数据严格只读。

### 2.2 术语

| 术语 | 说明 |
|---|---|
| 源库快照状态 | 页面与菜单的正式名称；内部 Feature 目录标识继续使用 `data-source-snapshot-status`，路由保持 `/monitor/data-source-state`。 |
| 探针端 | `CDC_CLIENT_MULTIPLE.CLIENT_ID` 标识的同步探针进程（`sync-client` 用自身 `client_id` 命中记录）。本列表“探针端”列展示 RUN_STATE 记录的 `CLIENT_ID` 原始值。 |
| 源库 | `CDC_DATA_SOURCE` 中类别为源库（SOURCE）的数据源，以 `DATA_SOURCE_ID` 标识。本列表“源库”列优先展示关联源库 ORG，并保证可查看原始 `DATA_SOURCE_ID`。 |
| CDC_DATA_SOURCE_RUN_STATE | 记录“探针端＋源库”组合初始快照状态的表；由 sync-client 维护，`cdc-config` 对其绝对只读。 |
| 快照进行中 | 原始状态值 `SNAPSHOT_RUNNING` 的中文展示。 |
| 快照已完成 | 原始状态值 `SNAPSHOT_COMPLETED` 的中文展示。 |
| 未知状态 | 数据库 `SNAPSHOT_STATUS` 取值不在已确认集合内的状态；宽容展示、不报错、不丢弃。 |
| sync-client | 同步探针进程，从源库读取数据并写入 Kafka 业务 Topic；按 `CDC_DATA_SOURCE_RUN_STATE` 决定是否执行初始快照。本仓库不含其源码。 |
| 虚拟状态 | “未开始”“待快照”“尚无快照记录”等由本页面推断生成的状态；本 Feature 不生成。 |
| 界面选择条件 | 查询区控件当前显示的值；用户修改或重置时可变化，不代表已生效的查询。 |
| 已应用查询条件 | 当前表格、自动刷新与“立即刷新”实际使用的查询条件组。页面初始化时初始化为三项默认“全部”并立即以此发起首次自动查询；此后仅当用户点击“查询”且该次查询成功返回（包括成功返回 0 条空结果）时，点击瞬间形成的“请求快照”才升级为新的“已应用查询条件”。按新条件查询失败时，“已应用查询条件”保持最近一次成功查询确立的条件不变，不使用尚未提交的界面选择条件。 |
| 请求快照 | 用户点击“查询”的瞬间对其界面选择条件复制得到的一组条件值；本次查询使用该快照发起。即使该请求进行期间界面控件再被修改，成功时升级为“已应用查询条件”的仍是请求开始时的快照，不是请求结束时控件的值。 |

## 3. 数据来源与已核验数据库事实

本 Feature 引用的 `CDC_DATA_SOURCE_RUN_STATE` 数据库事实，全部以已提交数据库只读复核报告为权威依据，本任务不重新查询数据库：

```text
docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md
```

已核验数据库事实摘要（来自上述报告；`OBSERVED_DATABASE`，非本 Feature 目标、非数据库强约束）：

- `CDC_DATA_SOURCE_RUN_STATE` 是 Oracle CDC Schema 下 `VALID` 状态普通表。
- 六字段：`CLIENT_ID`、`DATA_SOURCE_ID`、`SNAPSHOT_STATUS`、`SNAPSHOT_LAST_SEEN_AT`、`SNAPSHOT_COMPLETED_AT`、`UPDATED_AT`。
- `VARCHAR2` 字段均为 BYTE 语义（`CHAR_USED=B`）。
- 主键 `PK_CDC_DS_RUN_STATE(CLIENT_ID, DATA_SOURCE_ID)`。
- 四个非空字段：`CLIENT_ID`、`DATA_SOURCE_ID`、`SNAPSHOT_STATUS`、`UPDATED_AT`；`SNAPSHOT_LAST_SEEN_AT`、`SNAPSHOT_COMPLETED_AT` 可空。
- 无外键、无触发器、无状态封闭 Check 约束。
- 当前开发库只有 1 条 `SNAPSHOT_RUNNING` 样例（无 `SNAPSHOT_COMPLETED` 样例）；样例数据不是生产数量上限，状态分布不是数据库强约束。
- 当前代码无后端访问链路，前端仍为占位页。

## 4. 功能范围（范围内 / 范围外）

### 4.1 范围内

- 只读查询 `CDC_DATA_SOURCE_RUN_STATE`，按“探针端｜源库｜快照状态”条件筛选，一次加载全部结果、不分页；
- 展示七列列表信息（序号、探针端、源库、快照状态、快照启动时间、快照完成时间、记录更新时间）；
- 快照状态中文映射与未知状态宽容展示；
- 关联（探针端描述、源库 ORG）异常时的轻量兼容提示；
- 固定默认排序；60 秒自动刷新＋立即刷新；页面不可见暂停、恢复后继续；
- 空数据、加载、失败与恢复提示；
- 关联展示只读 LEFT JOIN（仅补充展示信息）。

### 4.2 范围外

- 对 `CDC_DATA_SOURCE_RUN_STATE` 的任何写动作（新增、修改、删除、重置、重新快照、重试、批量），以及任何写接口、写按钮或隐式写行为；
- 判断或展示 sync-client 在线、健康、失联、增量采集状态或同步进度；
- 从配置表补出 RUN_STATE 缺失的组合行；推断“未开始/待快照/尚无快照记录”等虚拟状态；
- 分页、每页条数、翻页控件；
- 时间范围、在线状态、健康状态、关键字等未批准查询条件；
- 操作列、详情、编辑、删除、跳转或任何写操作入口；
- 依据任何时间字段计算“超时/异常/离线/长期运行”；
- 连接或调用 sync-client、Kafka、ZooKeeper/TongZK；
- 除本 Feature 明确允许的只读访问（`CDC_DATA_SOURCE_RUN_STATE`）与只读关联（`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 补充展示与关联异常判断）之外的任何数据访问，以及任何 DDL/DML 或其他表写行为；
- 修改现有菜单、路由、占位页或前后端代码（本任务不改动任何前后端文件）；
- 创建 DESIGN.md / API.md / UI.md / DATABASE.md；
- 访问或操作数据库（本任务不连接数据库）。

## 5. Feature 定位、命名与边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-001 | 用户可见名称统一为“源库快照状态”，覆盖页面标题、菜单、路由元数据标题、面包屑与 Feature 文档命名。 |
| DSS-REQ-002 | Feature 内部标识为 `data-source-snapshot-status`，任务代码前缀为 `DATA-SOURCE-SNAPSHOT-STATUS`；需求编号前缀 `DSS-REQ-`、验收编号前缀 `DSS-AC-`；本功能属于“运行监控”模块。 |
| DSS-REQ-003 | 既有路由 `/monitor/data-source-state` 保持不变；不因 Feature 更名新增、删除、重命名或改挂该路由。 |
| DSS-REQ-004 | 前端既有源码目录 `frontend/src/views/data-source-run-state/` 暂时保留，不做无业务价值的目录重命名；命名映射见 README §6。 |
| DSS-REQ-005 | 后续实现阶段应将菜单、路由元数据、页面标题与面包屑中的“数据源运行状态”更新为“源库快照状态”；本需求草案任务不改动任何前后端文件。 |

## 6. 业务语义与跨程序边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-006 | `CDC_DATA_SOURCE_RUN_STATE` 记录“探针端（`CLIENT_ID`）＋源库（`DATA_SOURCE_ID`）”组合的初始快照状态；`SNAPSHOT_STATUS` 两个已知取值为 `SNAPSHOT_RUNNING`（源库初始快照执行中）与 `SNAPSHOT_COMPLETED`（源库初始快照已完成）。 |
| DSS-REQ-007 | 该记录只表示源库初始快照阶段；不表示 sync-client 当前是否在线、健康、失联，也不表示增量采集是否正常或当前同步进度；页面不得呈现进程健康或同步进度语义。 |
| DSS-REQ-008 | sync-client 启动时读取该表并据此决策（跨程序业务事实，本仓库不实现）：对应记录为 `SNAPSHOT_COMPLETED` 时只对源库做增量采集；没有对应记录时插入 `SNAPSHOT_RUNNING` 并执行快照，完成后更新为 `SNAPSHOT_COMPLETED`；对应记录为 `SNAPSHOT_RUNNING` 时重新执行快照。 |
| DSS-REQ-009 | 当前仓库只包含 `cdc-config`，不包含 sync-client 源码；本 Feature 不修改、不重复实现、不调用 sync-client 逻辑。 |
| DSS-REQ-010 | `SNAPSHOT_COMPLETED` 后该记录通常不再更新；不得使用 `UPDATED_AT` 或其他时间字段推断 sync-client 在线、健康、离线或异常。 |

## 7. 产品读写边界（严格只读）

| 编号 | 需求 |
|---|---|
| DSS-REQ-011 | `CDC_DATA_SOURCE_RUN_STATE` 由 sync-client 进程维护；最终交付的 `cdc-config` 对该表严格只读。 |
| DSS-REQ-012 | 页面和后端只提供查询；不提供新增、修改、删除、重置、重新快照、重试或批量操作。 |
| DSS-REQ-013 | 不增加任何写接口、写按钮或隐式写行为；后端不得提供任何针对该表的写能力。 |
| DSS-REQ-014 | 页面刷新（自动或手工）只重新查询数据库，不改变任何数据。 |
| DSS-REQ-015 | 允许使用 LEFT JOIN 补充探针端描述和源库 ORG 等展示信息；JOIN 只补充展示信息，绝不能改变 RUN_STATE 驱动的数据行集合，也不产生任何写副作用。本功能不访问与本功能无关的数据；允许只读访问 `CDC_DATA_SOURCE_RUN_STATE`，并允许只读关联 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 补充展示与关联异常判断。关联表绝对只读，且不得改变以 RUN_STATE 为驱动的行集合；不得扩大到任何其他表。 |

## 8. 页面数据集边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-016 | 列表只展示 `CDC_DATA_SOURCE_RUN_STATE` 中实际存在的记录。 |
| DSS-REQ-017 | 表中没有记录的“探针端＋源库”组合不展示；不得根据 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 或其他配置表补出缺失行。 |
| DSS-REQ-018 | 不推断或生成“未开始”“待快照”“尚无快照记录”等虚拟状态。 |
| DSS-REQ-019 | 即使关联的探针端或源库配置缺失、停用或异常，RUN_STATE 原始记录仍必须保留展示；不得因 INNER JOIN 或 WHERE 条件被过滤。 |

## 9. 数据规模与不分页

| 编号 | 需求 |
|---|---|
| DSS-REQ-020 | 生产规模预期最多约 100 条记录（规模假设）；页面与接口必须能一次完整加载该规模的数据，不引入分页。 |
| DSS-REQ-021 | 页面一次加载全部符合条件的记录；不分页，不提供每页条数和翻页控件。 |

## 10. 查询条件

| 编号 | 需求 |
|---|---|
| DSS-REQ-022 | 查询区只保留三个条件：探针端、源库、快照状态；不提供时间范围、在线状态、健康状态、关键字或其他未批准条件。三个控件均为多选控件，每项默认选中显式“全部”；每个条件都提供显式“全部”选项，“全部”与该条件的任一具体候选互斥（由“全部”切换为任一具体候选即自动清除“全部”；改选“全部”即清除该条件已选具体候选）。同一条件内选择多个具体候选时为“或”；不同条件之间为“且”。探针端候选 option 的展示层标签与控件/下拉面板宽度边界见 `DSS-REQ-075`（第二轮）：仅影响展示截断与宽度上限，不改变 option `value`、候选集合来源、点击提交值与过滤语义。 |
| DSS-REQ-023 | 页面初始化时将三项默认“全部”初始化为首组“已应用查询条件”，并立即以该条件发起首次自动查询。此后用户修改任一界面选择条件时不自动发起查询，当前表格与“已应用查询条件”均保持不变。用户点击“查询”时，必须对点击瞬间的界面选择条件形成“请求快照”，并使用该快照发起查询；仅当该次查询成功返回（包括成功返回 0 条空结果）时，该请求快照才升级为新的“已应用查询条件”，同时以成功结果替换当前表格并更新最近成功刷新时间。按新条件查询失败时：新条件不得升级为“已应用查询条件”，保留上一次成功结果与上一次“已应用查询条件”，界面控件仍保留用户当前选择的新条件以便再次点击“查询”，后续自动刷新与“立即刷新”继续使用旧的“已应用查询条件”。若用户在请求进行期间又修改界面控件，成功后升级的是该次请求开始时捕获的条件快照，不是请求结束时控件可能已变成的值。 |
| DSS-REQ-024 | 三个查询条件的候选仅来源于当前 RUN_STATE 实际记录及其可选展示信息；探针端、源库候选只取 RUN_STATE 中真实出现者，未在 RUN_STATE 中出现的探针端或源库不得加入候选。快照状态候选为“快照进行中”“快照已完成”；只有当前候选数据中真实存在未知 `SNAPSHOT_STATUS` 时，状态条件才出现“未知状态”。选择“未知状态”筛选所有不属于 `SNAPSHOT_RUNNING`、`SNAPSHOT_COMPLETED` 的原始状态；未知状态记录仍保留并可查看数据库原始值。候选集合来源保持不变；探针端候选 option 标签的展示截断与控件/下拉面板宽度边界见 `DSS-REQ-075`（第二轮），不改变候选集合与过滤语义。 |
| DSS-REQ-025 | 查询不得因为关联配置缺失或停用而排除 RUN_STATE 行；条件命中只作用于 RUN_STATE 原始记录及其可解析/可展示的补充信息。查询区的“重置”按钮与对 RUN_STATE 数据执行“重置状态/重新快照”是两种不同操作：前者是允许的纯前端条件复位（把三个界面选择条件恢复为“全部”，不发起查询、不清空或替换当前表格、不改变已应用查询条件）；后者仍是明确禁止的产品写操作（见 §7）。按新条件查询失败后“重置”规则不变：仍只把界面选择条件复位为三项“全部”，不发起查询、不清空表格、不把失败的新条件或“全部”升级为“已应用查询条件”；“已应用查询条件”只会在后续一次成功点击“查询”（或首次查询成功）后按 `DSS-REQ-023` 被替换。 |

> 三个查询控件采用多选＋显式“全部”、“全部”互斥、同条件内“或”与条件间“且”、未知状态候选动态出现、以及“界面选择条件 / 已应用查询条件”双状态与“重置不查询”规则，均属项目负责人已确认方案，已并入上表 `DSS-REQ-022~025`（R1 决策落地），不再作为待复审草案建议保留。

## 11. 列表字段

| 编号 | 需求 |
|---|---|
| DSS-REQ-026 | 序号为当前完整结果集内的稳定显示序号，不是业务主键；行的唯一标识为 `CLIENT_ID + DATA_SOURCE_ID`。 |
| DSS-REQ-027 | 列表固定七列，顺序为：序号、探针端、源库、快照状态、快照启动时间、快照完成时间、记录更新时间。 |
| DSS-REQ-028 | “探针端”列主内容始终显示原始 `CLIENT_ID`，单行、超出实际弹性列宽时省略号，不再把 `CLIENT_DESC` 同行或次行展示。Tooltip **只能显示完整 `CLIENT_DESC`**：描述为空、配置不存在或无法取得描述时不弹空 Tooltip，Tooltip 中不得出现“配置已经停用”“探针端配置缺失”或任何其他异常说明（Tooltip 内容与单实例边界见 `DSS-REQ-070`）。探针端列不出现黄色异常图标（活动、停用、缺失等行均不得出现黄色符号）。展示层只额外判断关联探针的 `FG_ACTIVE`：`FG_ACTIVE='1'` 只显示 `CLIENT_ID`；`FG_ACTIVE='0'` 及数据库现有宽容规则归一后判为非启用的非 `'1'` 值，显示 `CLIENT_ID`＋一个空格＋红色普通文字“停用”（红字、非图标、不新增列、非按钮/链接/可操作标签）；找不到探针配置时只显示原始 `CLIENT_ID`（缺失静默，无“缺失”、无黄色图标、无其它异常说明）。此调整只改变前端展示，不改变接口已有 `clientRef.state` 字段、后端映射或数据库读取规则（第二轮展示规则修订见 §21.3；列宽与文本规则见 `DSS-REQ-069/073`）。 |
| DSS-REQ-029 | “源库”列单行展示：正常有关联且 `DATA_SOURCE_ORG`（ORG）非空时，主内容只显示源库 ORG（单行、超出实际弹性列宽时省略号），悬停 Tooltip **只显示完整原始 `DATA_SOURCE_ID`**（正常行与回退行 Tooltip 同源，不取 `DATA_SOURCE_ORG`、不拼接 ORG＋ID）；配置不存在或 ORG 为空时，主内容回退显示完整原始 `DATA_SOURCE_ID` 的单行省略号（不得显示空白），悬停 Tooltip 显示完整原始 `DATA_SOURCE_ID`。源库列不出现黄色异常图标；Tooltip 不得追加“配置缺失”“配置停用”“类别非 SOURCE”等异常说明；不采用两行 ORG＋ID 布局。源库停用、类别异常或配置缺失时仍保留 RUN_STATE 行，仍按 ORG/原始 ID 回退展示，但不再增加黄色图标或额外异常文字。不新增红色“停用”文字（红色“停用”只用于探针端列 `FG_ACTIVE` 非启用状态，见 `DSS-REQ-073`）。此调整只改变前端展示，不改变 `sourceRef.state`、`sourceRole`、后端映射、候选来源或数据库读取规则（第二轮展示规则修订见 §21.3；列宽与文本规则见 `DSS-REQ-069/074`）。 |
| DSS-REQ-030 | “快照状态”列以中文状态标签展示，同时必须保证用户能够查看数据库原始状态值（如 `SNAPSHOT_RUNNING`）。 |
| DSS-REQ-031 | “快照启动时间”展示 `SNAPSHOT_LAST_SEEN_AT`；值为 NULL 时显示 `--`。 |
| DSS-REQ-032 | “快照完成时间”展示 `SNAPSHOT_COMPLETED_AT`；值为 NULL 时显示 `--`。 |
| DSS-REQ-033 | “记录更新时间”展示 `UPDATED_AT`。 |
| DSS-REQ-034 | 列表不设置操作列；不提供详情、编辑、删除、跳转或任何写操作入口。 |

## 12. 状态映射与未知状态

| 编号 | 需求 |
|---|---|
| DSS-REQ-035 | `SNAPSHOT_RUNNING` 状态展示为“快照进行中”，蓝色状态标签。 |
| DSS-REQ-036 | `SNAPSHOT_COMPLETED` 状态展示为“快照已完成”，绿色状态标签。 |
| DSS-REQ-037 | 数据库对 `SNAPSHOT_STATUS` 没有建立封闭取值 Check 约束（已核验数据库事实）；实现必须宽容处理未知状态。 |
| DSS-REQ-038 | 未知状态的记录仍然展示；以橙色“未知状态”标签呈现，并展示数据库原始状态值；颜色必须与两种已知状态清晰区分。状态与未知信息不能只靠颜色表达，必须同时有文字（中文标签或数据库原始值，见 §18 `DSS-REQ-063`）。 |
| DSS-REQ-039 | 未知状态不得造成整个接口或页面报错，也不得被丢弃或改写为已知状态。 |
| DSS-REQ-040 | 当前开发库没有 `SNAPSHOT_COMPLETED` 真实样例；需求与验收不依赖开发库天然存在该样例，`SNAPSHOT_COMPLETED` 场景通过受控测试数据构造（构造授权见 §20）。 |

## 13. 关联异常兼容

| 编号 | 需求 |
|---|---|
| DSS-REQ-041 | `CLIENT_ID` 找不到对应探针端时，RUN_STATE 行仍展示，探针端列主内容仍为原始 `CLIENT_ID`；前端不再提示“探针配置缺失”（缺失静默），无黄色图标、无异常说明，描述不可得时不弹空 Tooltip（展示规则见 `DSS-REQ-028/073`）。记录保留边界不变。 |
| DSS-REQ-042 | `DATA_SOURCE_ID` 找不到对应数据源时，RUN_STATE 行仍展示，源库列主内容回退显示完整原始 `DATA_SOURCE_ID` 的单行省略号（不得显示空白），悬停 Tooltip 显示完整原始 `DATA_SOURCE_ID`；前端不再显示黄色缺失提示，Tooltip 不追加“配置缺失”等异常说明（展示规则见 `DSS-REQ-029/074`）。记录保留和 ID 回退不变。 |
| DSS-REQ-043 | 关联的探针端停用时，RUN_STATE 行仍展示，探针端列主内容为原始 `CLIENT_ID`；`FG_ACTIVE` 非启用（`'0'` 及宽容归一后判为停用的非 `'1'` 值）时，在 `CLIENT_ID` 后接一个空格和红色普通文字“停用”（红字、非图标、不新增列、非按钮/链接）。关联的源库停用时，RUN_STATE 行仍展示，源库列不再显示异常标识，仍按 ORG/原始 ID 回退展示。红色“停用”只用于探针端列，不用于源库列（展示规则见 `DSS-REQ-028/029/073/074`）。 |
| DSS-REQ-044 | 关联源库类别不是 SOURCE、类别大小写异常或其他配置异常时，RUN_STATE 行仍展示，源库列仍按 ORG/原始 ID 回退展示；前端不再显示源库类别异常提示（无黄色图标、无“类别非 SOURCE”等异常文字，静默展示，规则见 `DSS-REQ-029/074`）。记录保留/宽容读取不变。 |
| DSS-REQ-045 | 第二轮现行规则下，关联“异常”不再以黄色单元格小图标或 Tooltip 异常说明呈现，改为按状态静默/降级展示：探针端列仅可能在 `FG_ACTIVE` 非启用时出现红色普通文字“停用”（见 `DSS-REQ-028/043/073`）；源库列按 ORG/原始 ID 回退展示且无异常图标或异常文字（见 `DSS-REQ-029/042/044/074`）；配置缺失均静默处理。不新增专门的异常列；展示不把快照状态改判成失败，也不触发任何数据库修复或写行为。未知快照状态标签及其数据库原始值 Tooltip（`DSS-REQ-030/038/070`）不受本行取消异常图标说明的影响。 |

## 14. 排序

| 编号 | 需求 |
|---|---|
| DSS-REQ-046 | 默认排序固定：先 `SNAPSHOT_RUNNING`，再未知状态，后 `SNAPSHOT_COMPLETED`。 |
| DSS-REQ-047 | 同一状态组内按 `UPDATED_AT` 倒序。 |
| DSS-REQ-048 | `UPDATED_AT` 并列时，使用 `CLIENT_ID`、`DATA_SOURCE_ID` 作为确定性排序键。 |
| DSS-REQ-049 | 页面不提供用户自定义表头排序。 |

## 15. 刷新

| 编号 | 需求 |
|---|---|
| DSS-REQ-050 | 页面提供“60 秒自动刷新＋立即刷新”。自动刷新与“立即刷新”始终沿用最近一次成功查询确立的“已应用查询条件”，不使用尚未点击“查询”的界面选择条件；即使用户已经修改或重置界面条件、或按新条件点击“查询”后失败都一样——失败的新条件不会成为刷新依据，刷新继续沿用上一次成功查询的条件（见 `DSS-REQ-023/061`）。刷新工具栏“立即刷新”按钮采用稳定宽度：刷新在途时可显示加载图标，但图标出现/消失不得改变按钮宽度，不得造成按钮前“60 秒自动刷新｜最近成功刷新：…”等文字位置移动，工具栏整体不得因刷新在途状态发生明显水平位移。（验收前 UI 调整草案在既有稳定宽度基础上扩展：刷新工具栏归入结果卡片头部右侧不可拆散“刷新逻辑组”整体靠右展示、窄宽度下整体换行不得只把“立即刷新”挤到下一行；只有真正发起当前请求的操作呈现加载反馈；刷新在途时“查询”不闪动；详见新增 `DSS-REQ-068/071` 与 §21.1。） |
| DSS-REQ-051 | 页面不可见时停止/取消自动刷新计时，不保留可恢复的“剩余秒数”，该期间不发起自动刷新、不启动新的 60 秒计时；页面重新可见后立即按“已应用查询条件”发起一次刷新，并在该次请求结束后（无论成功或失败）重新开始一个完整 60 秒周期（见 `DSS-REQ-054`）。若某请求在页面变为不可见前已在途，该请求允许正常结束并按成功/失败规则处理，但页面不可见期间不启动新的计时。 |
| DSS-REQ-052 | 自动刷新和手工刷新只重新读取数据库；不写数据库，不改变任何数据。 |
| DSS-REQ-053 | 前一次刷新请求未结束时不得发起下一次重叠请求。因已有请求在途而被抑制的自动或手工触发不视为一次实际请求，不单独重置计时（见 `DSS-REQ-054`）。 |
| DSS-REQ-054 | 页面可见时，每一次实际发出的查询或刷新请求结束后，无论成功还是失败，都从请求结束时重新开始一个完整的 60 秒自动刷新周期。刷新失败后不停止自动刷新、也不立即无间隔重试；60 秒后按“已应用查询条件”正常自动重试一次。查询成功返回 0 条空结果属于成功：同样允许更新“已应用查询条件”、展示空态、更新最近成功刷新时间，并从请求结束后重新计时 60 秒。请求在途时不发起重叠请求；因已有请求在途而被抑制的自动或手工触发不视为一次实际请求，不单独重置计时。页面不可见时停止/取消自动刷新计时，不保留可恢复的剩余秒数；若请求在页面变为不可见前已在途，该请求允许正常结束并按成功/失败规则处理，但页面不可见期间不启动新的 60 秒计时。页面恢复可见后立即按“已应用查询条件”发起一次刷新；该请求结束后（无论成功或失败）重新开始完整 60 秒周期。最近成功刷新时间只在查询/刷新成功后更新，任何失败或被抑制的触发都不得更新时间（见 `DSS-REQ-061`）。 |

## 16. 时间字段边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-055 | 三个时间字段（`SNAPSHOT_LAST_SEEN_AT`、`SNAPSHOT_COMPLETED_AT`、`UPDATED_AT`）统一展示为 `YYYY-MM-DD HH:mm:ss`；空值显示 `--`（NULL 展示另见 `DSS-REQ-031/032`）；展示格式化不得改变其业务时间值。 |
| DSS-REQ-056 | 不根据任何时间字段计算或呈现“超时”“异常”“离线”“长期运行”等状态。 |
| DSS-REQ-057 | 不因为 `SNAPSHOT_RUNNING` 持续时间长而自动显示为错误或警告。 |

## 17. 加载、空数据、失败与恢复

| 编号 | 需求 |
|---|---|
| DSS-REQ-058 | 首次加载在途时提供加载反馈，进行中不造成表格明显闪烁。 |
| DSS-REQ-059 | 首次自动查询失败（当前无历史成功结果）时展示首次加载失败状态和“重新加载”入口；“已应用查询条件”仍为默认三项“全部”，重新加载或自动重试仍使用三项“全部”；不得把失败展示成空数据或成功状态（见 `DSS-REQ-023`）。 |
| DSS-REQ-060 | 查询结果为零时展示空数据提示，不得展示成接口错误。成功返回 0 条空结果属于成功：允许把本次请求快照升级为新的“已应用查询条件”、展示空态并更新最近成功刷新时间，并从请求结束后重新计时 60 秒（见 `DSS-REQ-023/054`）。 |
| DSS-REQ-061 | 页面必须区分“加载成功、加载失败、空结果、进行中”等状态，失败与空结果不得互相伪装。已有成功结果时，查询（含按新条件点击“查询”）或刷新失败均保留最近一次成功数据、不清空表格，且“已应用查询条件”保持最近一次成功查询确立的条件不变；失败提示必须收敛，不得连续堆叠相同失败消息；失败不更新最近成功刷新时间（该时间只在查询/刷新成功后更新）；失败信息必须脱敏（见 §19 `DSS-REQ-064`）；刷新在途不得造成表格明显闪烁。自动刷新在失败后按 `DSS-REQ-054` 在 60 秒后按“已应用查询条件”正常自动重试，不停止、不立即无间隔重试；被在途抑制的触发不更新时间。 |

## 18. 可访问性与基础视觉

| 编号 | 需求 |
|---|---|
| DSS-REQ-062 | 页面采用与现有 app-shell 和 Element Plus 体系一致的企业管理后台浅色风格。 |
| DSS-REQ-063 | 快照状态、未知状态与关联异常提示不以颜色作为唯一信息载体；必须同时有文字表达（中文标签或数据库原始值）。 |

## 19. 安全、日志与敏感数据边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-064 | 后端返回与页面展示的失败信息必须脱敏：不暴露内部堆栈、无关数据或敏感信息；日志不记录本表之外或与查询无关的敏感内容；任何查询路径都不产生对本表或其他表的写操作。 |

## 20. 测试数据 DML 授权与恢复

项目负责人已明确授权：后续开发、测试和验收任务可以操作 `CDC_DATA_SOURCE_RUN_STATE` 的开发库测试数据，用于构造真实场景。该授权精确记录为下列边界，本草案任务不访问数据库、不执行任何 DML。

| 编号 | 需求 |
|---|---|
| DSS-REQ-065 | 未来对 `CDC_DATA_SOURCE_RUN_STATE` 执行测试数据 `INSERT/UPDATE/DELETE` 的边界：①仅限项目配置的 Oracle 开发库；②仅在后续任务提示词显式纳入该授权时，Agent 方可对 `CDC_DATA_SOURCE_RUN_STATE` 执行 `INSERT/UPDATE/DELETE`，无需逐条再次确认；③操作前必须完整备份原始数据；④操作后必须恢复到任务开始前状态并验证逐行一致；⑤报告必须记录操作目的、执行范围、备份与恢复证据；⑥不授权 `TRUNCATE`、`ALTER`、`DROP` 或其他 DDL；⑦不授权操作其他数据库表；⑧不授权生产数据库；⑨这只是 Agent 测试数据权限，不是 `cdc-config` 产品写能力。 |

### 20.1 R1 本次测试数据授权例外（任务级，2026-09-06）

在实现修复任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1` 的本会话中，项目负责人明确授权：对负责人所指数据库（经只读证据核验为本项目内网库：`DB_NAME=prod`、数据库主机 `snoopy-linux`、Schema=`CDC`，仅此一个含 `CDC_DATA_SOURCE_RUN_STATE` 的连接）执行测试 `INSERT` 并 `COMMIT`，测试后**保留不还原**；不再逐条申请。授权只覆盖以下三表：

- `CDC_DATA_SOURCE_RUN_STATE`（新增 29 条合成运行态）
- `CDC_CLIENT_MULTIPLE`（新增 5 条停用探针配置）
- `CDC_DATA_SOURCE`（新增 5 条停用源配置）

数据使用本任务独立前缀 `dssr1-0906-`，全部独立合成主键；只新增、不 `UPDATE/DELETE` 已有记录，不 `TRUNCATE`、不 DDL、不授权其它表、无触发器写入；新增配置均 `FG_ACTIVE='0'`、描述含“快照页测试，请勿启用”、连接字段为不可用合成值且绝不连接。此为**本任务 Agent 测试数据权限记录，不是产品写能力**；本页后端/前端仍严格只读。该例外不扩散到其它任务或其它表；§20 其它历史约束仍适用。执行证据见实现报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1.md` 与 `evidence/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1/db/`。

## 21. 第一轮 UI 调整草案新增需求（DSS-REQ-066 ~ DSS-REQ-071）

> 本节为第一轮验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001` 在**已批准需求/验收/设计基线之上**新增的独立需求行（编号自 `DSS-REQ-066` 起连续），已随第一轮批准收口（正式批准版本 `...-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07）。已批准基线（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`；设计批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`）保留为历史；**批准旧版本不自动批准第二轮调整草案**。本节只围绕“页面三块结构 / 结果卡片头部 / 固定列宽与文本 / 页面级单实例 Tooltip / busy 视觉隔离”建立规则，不改动 `API.md`/`DATABASE.md` 契约与本表之外任何业务行。其中 `DSS-REQ-069/070` 的展示规则已由第二轮草案原位修订（现行以 §21.2/§21.3 与 §11/§13 原位文字为准），第一轮批准原文保留于批准历史与 git。第二轮新增独立需求行见 §21.2。

| 编号 | 需求 |
|---|---|
| DSS-REQ-066 | 页面自上而下形成三个有明显视觉分隔的区域：① **页面标题与功能说明区**——标题仍为“源库快照状态”，功能说明表达“展示探针端与源库组合的初始快照阶段状态、页面只读”，不得增加在线、健康、同步进度等推断；标题与功能说明同属页面顶层语义区，功能说明以清楚但不过度抢眼的信息提示形态呈现；② **独立查询卡片**——含探针端、源库、快照状态三个多选条件与查询、重置按钮，有独立白色容器（边框/圆角/合理内边距）与上下区域的间距；③ **独立结果卡片**——卡片头部为结果摘要/提示与刷新工具栏，卡片主体为七列表格；结果卡片头部与表格主体之间以清晰但轻量的分隔。页面不再把标题、查询、刷新、表格挤在一个无层级的连续平面中；页面背景、卡片边框、圆角、阴影、间距与现有 app-shell 和 Element Plus 浅色企业后台风格协调（`DSS-REQ-062` 不变）。本表数据规模与不分页边界不变：最多约 100 行、继续不分页（`DSS-REQ-020/021` 不变），不得因为视觉参考图含分页而增加分页。 |
| DSS-REQ-067 | 结果卡片头部左侧展示当前成功结果总数：`共 {records.length} 条`；如当前结果含未知状态，可在左侧以轻量橙色提示 `其中 {unknownCount} 条未知状态`，计数为 0 时不显示；该提示只统计接口返回记录的 `statusCategory=UNKNOWN`，不推断健康或错误。行内展示统一遵循 `DSS-REQ-028/029/045/073/074` 的第二轮现行规则：除探针端关联配置 `FG_ACTIVE!='1'` 时在 `CLIENT_ID` 后显示红色普通文字“停用”外，本页不显示关联异常图标、异常文字或异常 Tooltip；源库缺失、停用或类别非 `SOURCE` 不产生行内异常提示；未知快照状态标签及原始状态值 Tooltip 不受影响；不改变头部 `unknownCount` 的统计语义。 |
| DSS-REQ-068 | 结果卡片头部右侧把“灰色状态圆点（正在刷新时蓝色动态，但文字仍是主要信息载体）／`60 秒自动刷新`／分隔符／`最近成功刷新：HH:mm:ss`（从未成功为 `--`）／‘立即刷新’按钮”作为一个**不可拆散的整体**靠右展示，组成“刷新逻辑组”；刷新逻辑组在宽度不足时整体换行，不得只把“立即刷新”按钮挤到下一行；“立即刷新”按钮保持稳定宽度，加载图标出现/消失不得移动按钮本身、按钮前方文案或最近成功刷新时间；刷新失败提示放在不推动刷新逻辑组关键元素的稳定槽位，出现/消失不得造成工具栏明显水平跳动（`DSS-REQ-050` 既有稳定宽度要求继续成立）。 |
| DSS-REQ-069 | 七列及顺序保持不变（`DSS-REQ-027`），第二轮现行布局为**五列固定＋两列弹性＋表格铺满**：固定列——序号 `70px`（居中）、快照状态 `130px`（居中）、快照启动时间/快照完成时间/记录更新时间各 `165px`（固定格式 `YYYY-MM-DD HH:mm:ss`、空值 `--`）；弹性列——“探针端”最小宽度 `170px`（左对齐、单行）、“源库”最小宽度 `280px`（左对齐、单行，**必须明显宽于探针端列**）。规则：① 表格整体宽度至少填满结果卡片正文可用宽度，不得再以固定 `width:1145px` 限制宽屏表格；② 当结果卡片正文宽度大于七列最小总宽度 `1145px` 时，探针端/源库两弹性列吸收全部剩余宽度（建议按 `170:280` 相对权重分配，等价 Element Plus `min-width`/table layout 机制），固定列不得参与宽屏剩余空间分配；③ 表格最小总宽度仍为 `1145px`，当卡片正文小于该宽度时允许表格容器横向滚动，不压缩固定时间列、不换行挤压主要文本；④ 三个时间字段长度固定、使用固定列宽承载，避免把多余空间平均分配给时间列；⑤ 弹性列内文本单行 ellipsis；探针端列展示规则见 `DSS-REQ-028/073`（主内容原始 `CLIENT_ID`、Tooltip 仅完整 `CLIENT_DESC`、无黄色图标、非启用红字“停用”、缺失静默），源库列展示规则见 `DSS-REQ-029/074`（ORG/原始 ID 回退、无黄色图标、无异常文字）；⑥ 在约 1440×900、1920×1080 及负责人截图对应宽度下表格右边缘贴合结果卡片正文右侧可用边界、不留大块空白、不引起结果卡片头部刷新组位移；⑦ 不改变状态排序、时间排序、状态映射、序号规则、行键、空值规则和“不补行”边界（`DSS-REQ-016~018/026/031~033/035~049` 等不变）。 |
| DSS-REQ-070 | 页面任意时刻最多只能显示 **1 个 Tooltip**，范围覆盖本页面所有仍存在真实触发项的表格 Tooltip（探针端列完整 `CLIENT_DESC`、源库列完整原始 `DATA_SOURCE_ID`（正常与回退同源，不取 `DATA_SOURCE_ORG`）、未知快照状态数据库原始值）。第一轮曾纳入范围的关联异常图标说明（探针/源库缺失/停用/类别异常等图标 Tooltip）已随黄色异常图标删除而取消，不再属于本行覆盖范围（第二轮现行规则，见 `DSS-REQ-028/029/073/074`）。行为：① 快速横向或纵向扫过多行时，新触发项出现前必须立即关闭旧 Tooltip，不允许同时残留多个；② 离开触发区域、表格数据替换、滚动、窗口缩放、页面隐藏或卸载时关闭 Tooltip；③ Tooltip 不可交互（non-enterable / `pointer-events:none`），避免鼠标进入 Tooltip 后遗留；④ 统一短暂显示延迟（约 300~350ms）并即时关闭，不得仅依赖多个独立 Tooltip 各自的延迟；⑤ 采用页面级受控“当前 Tooltip”标识或单一 Tooltip Host，不得让多实例各自持有可并存的显示状态；⑥ 表格中不得混用可能与受控 Tooltip 同时出现的原生 `title` 浏览器提示；⑦ Tooltip 优先单行展示，如完整内容物理宽度超过安全视口，才允许在该极端情况下换行以保证全文可读与不越界；⑧ 对视口四边做边界避让，不超出可视区、不被表格容器裁切。 |
| DSS-REQ-071 | 保持单飞行、忙碌抑制、不并发、不排队、不补发等既有业务规则不变（`DSS-REQ-053/054`）。本行为请求类型与页面视觉反馈的**唯一现行映射规则**，六类请求 `initial/retry/query/manual/auto/restore` 的页面视觉反馈必须按下表逐项实现：① `initial`（页面首次进入自动加载）：表格区域显示 loading，“查询”与“立即刷新”按钮外观稳定、不显示 loading；② `retry`（首次加载失败后点击“重新加载”）：只有错误区“重新加载”按钮显示 loading，“查询”与“立即刷新”不显示 loading；③ `query`（用户点击“查询”）：只有“查询”按钮显示 loading，“立即刷新”外观稳定且不显示 loading；④ `manual`（用户点击“立即刷新”）：只有“立即刷新”按钮显示 loading，刷新状态圆点变蓝并呈刷新动态，“查询”外观稳定且不显示 loading；⑤ `auto`（60 秒自动刷新）：只有刷新状态圆点变蓝并呈刷新动态，“查询”与“立即刷新”按钮外观稳定、均不显示 loading；⑥ `restore`（页面恢复可见后立即或延后单次刷新）：只有刷新状态圆点变蓝并呈刷新动态，“查询”与“立即刷新”按钮外观稳定、均不显示 loading。对所有六类请求统一适用：a) `busy` 功能语义不变——任一实际请求在途期间，新查询和新刷新都不可发起，鼠标与键盘均不能产生第二个请求；b) 单飞行、不并发、不排队、不补发不变；恢复可见既有的一次性延后补发规则不变；c) 非本次请求发起控件不得显示 loading、变灰闪动、按压动画或其他“好像被点击”的反馈；d) 被功能性抑制但视觉保持稳定的按钮必须具正确 `aria-disabled` 语义，并同时阻止鼠标和键盘激活；e) 刷新状态圆点表示所有刷新类请求（`manual/auto/restore`）在途，颜色不是唯一信息载体；f) `initial/retry/query` 不得错误点亮刷新状态圆点；g) 不得通过允许并发、取消当前请求后切换操作、排队、静默补发来实现视觉隔离。后续实现应证明：点击“立即刷新”时网络层只有一次按当前“已应用查询条件”发出的刷新请求，没有额外的查询请求。本行六类映射与 `ACCEPTANCE.md` §4.18 `DSS-AC-072/078/079`、`DESIGN.md` §19.3/§19.6、`UI.md` §13.3/§13.6 逐项一致，本 Feature 全部文档不得再出现“自动/恢复可见刷新会让‘立即刷新’按钮显示 loading”的歧义表述。 |

### 21.1 第一轮对已批准需求行的定向修订说明

第一轮在已批准基线之上对下列既有需求行做**展示/交互层面的定向修订**（原批准文字保留于批准历史基线、批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd` 与 git 历史；第一轮修订文字已在正式批准版本 `...-APPROVAL-001` 中成为基线）：

| 既有需求行 | 修订点 | 新增/配套规则落点 |
|---|---|---|
| `DSS-REQ-028`（探针端列） | 表格内只显示原始 `CLIENT_ID`，不再把 `CLIENT_DESC` 同行或次行展示；完整描述经悬停 Tooltip 展示（为空不弹空） | `DSS-REQ-069③/070`；UI 调整草案 §13 |
| `DSS-REQ-029`（源库列） | 正常关联且 ORG 非空只显示 `ORG`，悬停展示完整 `ORG`（不以原始 ID 作正常行 Tooltip）；配置缺失或 ORG 为空回退原始 `DATA_SOURCE_ID`（不空白）并带异常说明。**【历史（2026-09-07 第一轮）：“正常行 Tooltip 展示完整 ORG”已由第二轮 R2 极小纠正取代，现行正常源库行 Tooltip 只显示完整原始 `DATA_SOURCE_ID`，不得作为当前实现依据】** | `DSS-REQ-069⑤⑥/070`；UI 调整草案 §13 |
| `DSS-REQ-050`（刷新工具栏） | 在既有“立即刷新稳定宽度”基础上扩展为结果卡片头部右侧不可拆散“刷新逻辑组”（整体右对齐、窄宽度整体换行、失败提示稳定槽位），并落实“仅发起操作呈现加载反馈 / 刷新在途查询不闪动” | `DSS-REQ-068/071`；UI 调整草案 §13 |

> 既有 `DSS-REQ-001~065` 中除上述三行外，其余业务行相对批准内容基准**整文件不变**；第一轮不改动任何与第一轮无关的业务行。

### 21.2 第二轮 UI 调整草案新增需求（DSS-REQ-072 ~ DSS-REQ-075）

> 本节为第二轮验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002` 新增的独立需求行（编号自 `DSS-REQ-072` 起连续）。本轮规则完全由项目负责人对第一轮 UI 调整实现 R1（提交 `5933ec2...`）对应预览页的人工检查结论（`CHANGES_REQUIRED`）驱动，四类调整范围均为已确认输入（任务提示词 §4），无待人工决策项（`pending_user_confirmation_count=0`）。本轮不改动 `API.md`/`DATABASE.md` 契约与本表之外任何业务行；以下四行在 REQUIREMENTS/ACCEPTANCE/DESIGN/UI 中作为对应展示规则的**第二轮现行表述**，对第一轮在相应点位的规则构成取代（不冲突的其余部分继续有效）。

| 编号 | 需求 |
|---|---|
| DSS-REQ-072 | 结果卡片内的七列表格在第二轮现行规则下必须**铺满结果卡片正文可用宽度**，不再受第一轮固定 `width:1145px` 限制（当前实现残留该固定值，见任务提示词 §4.1，不得保留）。① 七列顺序保持不变（`DSS-REQ-027`）；② 固定列宽度：序号 `70px`（居中）、快照状态 `130px`（居中）、快照启动时间/快照完成时间/记录更新时间各 `165px`（固定格式与空值规则见 `DSS-REQ-055`，长度固定、不把多余空间平均摊给时间列）；③ “探针端”“源库”为弹性列：探针端最小宽度 `170px`、源库最小宽度 `280px`（左对齐、单行，源库必须明显宽于探针端）；④ 当结果卡片正文宽度大于七列最小总宽度 `1145px` 时，探针端/源库两弹性列吸收全部剩余宽度，建议按 `170:280` 相对权重分配（等价 Element Plus `min-width`/table layout 机制），固定列不得参与宽屏剩余空间分配；⑤ 表格最小总宽度仍为 `1145px`，当卡片正文小于该宽度时允许表格容器横向滚动，不压缩固定时间列、不换行挤压主要文本；⑥ 在约 1440×900、1920×1080 及项目负责人当前截图对应宽度下，表格右边缘应贴合结果卡片正文右侧可用边界、不留当前截图所示大块空白，且不引起结果卡片头部（左摘要/右刷新逻辑组）位移；表格内容仍为单行 ellipsis。列内探针/源库展示见 `DSS-REQ-028/029/073/074`；验收 `DSS-AC-073/080/081`。 |
| DSS-REQ-073 | 探针端列表格单元格第二轮现行展示规则：① 主内容始终为原始 `CLIENT_ID`，单行、超出弹性列宽省略号；Tooltip 只能显示完整 `CLIENT_DESC`，描述为空/配置不存在/无法取得描述时不弹空 Tooltip，Tooltip 中不得出现“配置已经停用”“探针端配置缺失”或任何其他异常说明；② 删除探针端列全部黄色异常图标，活动/停用/缺失等行均不得出现黄色符号；③ 展示层只额外判断关联探针 `FG_ACTIVE`：`FG_ACTIVE='1'` 仅显示 `CLIENT_ID`；`'0'` 及数据库宽容规则归一后判为非启用的非 `'1'` 值显示 `CLIENT_ID`＋一个空格＋红色普通文字“停用”（红字、非图标、不新增列、非按钮/链接/可操作标签）；找不到探针配置时仅显示原始 `CLIENT_ID`（缺失静默，无“缺失”、无黄色图标、无其它异常说明）；④ 只改变前端展示，不改变接口已有 `clientRef.state` 字段、后端映射或数据库读取规则。验收 `DSS-AC-026/038/040/074/082`。 |
| DSS-REQ-074 | 源库列表格单元格第二轮现行展示规则：① 正常有关联且 `DATA_SOURCE_ORG` 非空：主内容只显示 `DATA_SOURCE_ORG`（单行 ellipsis），悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（不取 `DATA_SOURCE_ORG`、不拼接 ORG＋ID）；② 配置不存在或 `DATA_SOURCE_ORG` 为空：主内容回退显示完整原始 `DATA_SOURCE_ID` 的单行 ellipsis（不得显示空白），悬停 Tooltip 显示完整原始 `DATA_SOURCE_ID`；③ 删除源库列全部黄色异常图标；④ Tooltip 不得追加“配置缺失”“配置停用”“类别非 SOURCE”等异常说明；⑤ 源库停用/类别异常/配置缺失时仍保留 RUN_STATE 行并按 ORG/原始 ID 回退展示，不新增红色“停用”（红色“停用”仅用于探针端 `FG_ACTIVE` 非启用状态，见 `DSS-REQ-073`）；⑥ 只改变前端展示，不改变 `sourceRef.state`、`sourceRole`、后端映射、候选来源或数据库读取规则。验收 `DSS-AC-027/039/040/041/075/083`。 |
| DSS-REQ-075 | 探针端候选 option 展示为截断后的 `CLIENT_ID（CLIENT_DESC）`，两段均确定性截断且**只影响展示**：① `CLIENT_ID` 最多展示前 **20 个 Unicode 字符**，超出追加三个英文句点 `...`；`CLIENT_DESC` 最多展示前 **20 个 Unicode 字符**，超出追加 `...`；按 Unicode code point（或等价安全方式）处理，禁止按 JavaScript UTF-16 code unit 粗暴截断拆开代理对；描述为空时只显示截断后的 ID、不显示空括号；② option 的 `value` 仍为完整原始 `CLIENT_ID`，点击查询提交完整 `CLIENT_ID`；API、响应对象、候选去重、已应用条件与 ghost 保留均使用完整值；不修改或截断后端数据；当前控件未开启可输入过滤，本轮不得新增 `filterable`、远程搜索或其他查询能力；③ 选择框闭合后的已选标签做宽度约束与 ellipsis，不得因超长 ID/描述撑大选择框或推动后续条件与按钮，底层选中值仍为完整 ID；④ 下拉项保持单行，先执行 ID/描述各 20 字符逻辑截断，再以 CSS `text-overflow:ellipsis` 作为面板极窄或字体差异下的最终保护；⑤ 下拉面板宽度上限：探针端选择控件建议宽度 `240px`、下拉面板目标最大宽度 `480px`、同时不超过安全视口宽度 `calc(100vw - 16px)`；需专属 `popper-class` 时使用本 Feature 命名空间、禁止污染全局选择器；⑥ 延续项目负责人确认的“探针端列表长度短于源库列表”：源库选择控件建议宽度 `300px`、下拉面板目标最大宽度 `560px`、也不得超过安全视口宽度，快照状态选择控件维持约 `200px`；⑦ “全部”选项必须完整显示；ghost 候选应用相同 ID 截断规则，但“不在候选内”的既有语义不得丢失。验收 `DSS-AC-020/022/084/085`。 |

### 21.3 第二轮对已批准需求行的定向修订说明

第二轮在已批准基线之上对下列既有需求行做**展示层面的定向修订**，使全文现行表述与第二轮草案一致（各行的原位文字已按本节修订；原批准文字保留于第一轮批准版本、批准内容基准提交 `5757237...` 与 git 历史；修订文字仅在 ChatGPT 对本第二轮草案正式复审 `APPROVED` 且项目负责人明确批准后才成为新基线）：

| 既有需求行 | 修订点 | 新增/配套规则落点 |
|---|---|---|
| `DSS-REQ-022/024`（查询条件/候选） | 候选展示层新增探针端 option 展示截断与控件/面板宽度边界，但候选来源和过滤语义不变 | `DSS-REQ-075` |
| `DSS-REQ-028`（探针端列） | 删除探针缺失异常提示与黄色图标语义；Tooltip 仅 `CLIENT_DESC`（空不弹）；新增非启用红字“停用”；缺失静默 | `DSS-REQ-073/070` |
| `DSS-REQ-029`（源库列） | 删除源库 Tooltip 异常说明与黄色图标语义；正常 Tooltip 与回退 Tooltip 均为完整原始 `DATA_SOURCE_ID`（R2 纠正：R0/R1/批准收口版曾误记“正常 Tooltip 仅完整 ORG”，已由 `...-002-R2` 取代） | `DSS-REQ-074/070` |
| `DSS-REQ-041`（探针缺失） | 记录保留边界不变，前端不再提示“探针配置缺失”（缺失静默） | `DSS-REQ-073` |
| `DSS-REQ-042`（源库缺失） | 记录保留和 ID 回退不变，前端不再显示黄色缺失提示 | `DSS-REQ-074` |
| `DSS-REQ-043`（停用标识） | 探针停用改为红字“停用”（非启用 `FG_ACTIVE`）；源库停用不再显示异常标识 | `DSS-REQ-073/074` |
| `DSS-REQ-044`（源库类别异常） | 记录保留/宽容读取不变，前端不再显示源库类别异常提示 | `DSS-REQ-074` |
| `DSS-REQ-045`（异常提示形式） | 异常提示形式重写：不得继续声称探针端/源库列使用黄色小图标；缺失/类别异常等改为静默，仅探针非启用保留红字“停用”；未知快照状态标签及其原始值 Tooltip 不受影响 | `DSS-REQ-073/074/070` |
| `DSS-REQ-069`（列宽） | 从七列全部固定宽度改为五列固定＋探针/源库两弹性列＋表格铺满（取消固定 `width:1145px`） | `DSS-REQ-072` |
| `DSS-REQ-070`（Tooltip 覆盖范围） | 覆盖范围删除已取消的关联异常图标说明，保留探针 `CLIENT_DESC`、源库完整原始 `DATA_SOURCE_ID`（正常与回退同源）、未知快照原始值等真实触发项 | `DSS-REQ-073/074` |

> 既有 `DSS-REQ-001~071` 中除上述行外，其余业务行相对第一轮批准内容基准**整文件不变**；第二轮不改动任何与第二轮无关的业务行。

### 21.4 隔离视觉原型 R2～R7 最终视觉方案固化新增需求（DSS-REQ-076 ~ DSS-REQ-083）

> 本节为 2026-09-10 任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001` 在**已批准基线之上**新增的独立需求行（编号自 `DSS-REQ-076` 起连续），用于把 `5174` 隔离视觉 prototype 中 R2～R7 已完成人工目测的**最终视觉方案**固化为下一阶段 `5173` 正式实现的唯一、可追踪依据。事实边界（必须与状态表一致）：① `5174` 是**隔离视觉 prototype**，不是正式前端；② R2～R7 最终视觉效果已由项目负责人人工查看并认可（`APPROVED_BY_PROJECT_OWNER`）；③ `5173` 正式页面**尚未应用** R2～R7、**尚未**正式实现验收；④ prototype 的浏览器/测试/构建结果只属**设计验证证据**，不改变正式验收状态；⑤ 本节内容本身已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001` 收口为 `APPROVED`（ChatGPT 对批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a` 最终复审 `APPROVED`、项目负责人 2026-09-10 明确回复“批准”）；需求 `DSS-REQ-076~083` 业务文字逐字节不变。本节与 §21.2/§21.3 的关系：本轮是**继第二轮 UI 调整之后的再一次纯前端视觉/交互呈现调整固化**，凡与 §21.2/§21.3（第二轮现行）在列宽模型、查询卡片容器底色等处冲突者，以本节 §21.4 与 §21.5 的**新口径**为准（详细取代说明见 §21.5）。本轮无 API、数据库变更（`API.md`/`DATABASE.md` 整文件零差异）。

| 编号 | 需求 |
|---|---|
| DSS-REQ-076 | 页面结构与背景层级按 R2～R7 最终 prototype 固化为“标题/说明 → 查询区 → 结果区”三段式，且背景层级如下：① 全局与公共容器背景**不由本功能修改**——`body` `rgb(245,247,250)`、`.content-area` `rgb(240,242,245)`、`.content-card` `rgb(255,255,255)`；② 本页根容器**最终为透明**（`background: transparent`，无自身近白中间层），直接承接外层白色 `.content-card`；③ `.dss-page` 保留 `border-radius:10px`、`padding:14px 16px`、`gap:12px`；④ 查询区卡片**最终为浅灰分组底**（`background: rgb(244,244,245)`，圆角 `8px`、`padding:10px 16px`、无阴影），**取代** `DSS-REQ-066②` 与 `DSS-AC-069` 中“独立白色容器”的表述（超出列宽/结构之外的表意不变）；⑤ 结果区卡片**最终为白底**（`rgb(255,255,255)`、圆角 `10px`、`box-shadow: 0 1px 2px rgba(9,9,11,.04), 0 1px 3px rgba(9,9,11,.03)`，computed `border: 0px`，**不得**写成“有 `1px` 边框”）；⑥ 不再把标题/查询/刷新/表格挤在无层级的连续平面中。验收 `DSS-AC-087`。 |
| DSS-REQ-077 | 查询区最终视觉固化：① 三个查询标签“探针端 / 源库 / 快照状态”统一 `font-size:14px`、`font-weight:600`、颜色 `#3F3F46`（或对应局部变量及 fallback），**无背景、无边框**、单行（`white-space:nowrap`），与各自下拉框垂直居中，标签与下拉框间距 `6px`；② 三个选择框最终尺寸为 `240×32`（探针端）/`300×32`（源库）/`200×32`（快照状态）；③ “全部”及具体选中值保持透明背景、无额外标签边框，清除按钮 `×` 保持可见；④ 查询按钮保持黑色主按钮（`background: rgb(9,9,11)`、白字、`font-weight:500`、圆角 `6px`、高 `30px`），重置按钮保持次级按钮（`background: rgb(228,228,231)`、文字 `rgb(63,63,70)`、圆角 `6px`、高 `30px`）；⑤ 选择条件本身不立即发请求，仍由“查询”提交（与 `DSS-REQ-023/025` 一致）。验收 `DSS-AC-088`。 |
| DSS-REQ-078 | 结果头部与刷新区最终视觉固化：① 主汇总 `共 {n} 条` 采用 `font-size:16px`/`font-weight:700`/颜色 `rgb(9,9,11)`；② 未知状态提示采用 `font-size:12px`/`font-weight:700` 的浅黄胶囊（实际 computed `color: rgb(180,83,9)`、`background: rgb(254,243,199)`、圆角 `999px`、高 `22px`、`padding:0 8px`），仅在未知计数非 0 时显示，语义仍为 `statusCategory=UNKNOWN` 计数（`DSS-REQ-067` 不变）；③ 结果头部为左侧汇总、右侧刷新组布局；④ 刷新组包含自动刷新状态、最近成功刷新时间与“立即刷新”；⑤ “立即刷新”为白底次级按钮——白底、`1px solid #E4E4E7`、文字 `#3F3F46`、圆角 `6px`、`box-sizing:border-box`，且 **idle/loading 均固定 `110px`**、不因加载图标出现而跳变（延续 `DSS-REQ-050/068`）；⑥ “查询”仍是页面主操作，视觉权重高于“立即刷新”。验收 `DSS-AC-089`。 |
| DSS-REQ-079 | 表格最小列宽模型按 R2～R7 最终 prototype 固化为 `70 / 170 / 285 / 140 / 170 / 170 / 170`，合计最小总宽 **`1175px`**（顺序：序号 / 探针端 / 源库 / 快照状态 / 快照启动时间 / 快照完成时间 / 记录更新时间）：① 序号 `70px` 居中、快照状态 `140px` 居中；② 探针端最小 `170px`、源库最小 `285px`（源库必须**明显宽于**探针端）；③ 三个时间列各自最小 `170px` 且**始终等宽**，宽屏下弹性列按最终算法吸收富余空间，时间列不无限吞掉空间；④ 表格整体铺满结果卡片正文可用宽度（`width:100%`），正文小于 `1175px` 时保留横向滚动、不通过压缩时间列破坏可读性；⑤ 本行**取代** `DSS-REQ-069`/`DSS-REQ-072` 的第二轮列宽模型（后者为五固定列 序号 `70`/快照状态 `130`/三时间各 `165` ＋两弹性列 探针端 `170`/源库 `280`、最小总宽 `1145px`、建议按 `170:280` 吸收）；⑦ 不改变状态排序、时间排序、状态映射、序号规则、行键、空值规则与“不补行”边界（`DSS-REQ-016~018/026/031~033/035~049` 等不变）。验收 `DSS-AC-090`。 |
| DSS-REQ-080 | 表格时间列最终内边距与行高固化：三个时间列**只**把单元格水平 `padding` 由 `12px` 调整为 `8px`，**上下 `padding` 与行高不变**（最终普通行高固定 `49px`）；`19` 字符时间戳 `YYYY-MM-DD HH:mm:ss` 完整展示、**不出现省略号**（R7 证据：`overflowCells=0`）；时间列等宽不因内边距调整而改变最小宽度（与 `DSS-REQ-079` 一致）。验收 `DSS-AC-091`。 |
| DSS-REQ-081 | 自动刷新倒计时展示为**只读可视化投影**固化：刷新组在既有自动刷新状态基础上，展示一个 `16px` 倒计时圆环（轨道 `#E4E4E7`、进度 `#2563EB`）与“{n} 秒后自动刷新”文案（秒数 `min-width:2ch`、右对齐、`tabular-nums`）。约束：① 该投影**只影响展示层**，真实的 `setTimeout` 仍是自动刷新的**唯一触发源**；② 倒计时逐秒刷新**本身不产生任何 GET**（不得因走秒发起请求）；③ 页面不可见时倒计时**冻结**并暂停自动刷新（与 `DSS-REQ-051/054` 一致），恢复可见后按既有逻辑继续；④ 不改动单飞行、不并发、不排队、不补发（`DSS-REQ-053/054`）与六类请求视觉映射（`DSS-REQ-071`）。验收 `DSS-AC-092`。 |
| DSS-REQ-082 | 行内展示与状态视觉按 R2～R7 最终 prototype 固化：① 探针端列主内容为 `CLIENT_ID`、字重 `600`，完整值经页面级单实例 Tooltip 展示 `CLIENT_DESC`；② 源库列主内容为 `ORG`，`ORG` 为空、空白或配置缺失时按既有规则回退原始 `DATA_SOURCE_ID`（判定逻辑与 `DSS-REQ-074` 一致）；**无论主内容当前显示 `ORG` 还是回退 ID，源库 Tooltip 始终只显示完整原始 `DATA_SOURCE_ID`**——不显示 `ORG`、不拼接 `ORG + DATA_SOURCE_ID`、不追加“配置缺失/配置停用/类别非 SOURCE”等异常说明；Tooltip 内容源直接取自行记录的原始 `sourceId`/`DATA_SOURCE_ID`，**不得**从 `sourceRef.org` 或展示文本反推（与 `DSS-REQ-074`/`DSS-REQ-070` 口径一致）；③ 非启用行“停用”标记保持最终**浅红**微型 Badge（`background:#fee2e2`、`color:#991b1b`、`font-size:11px`、`font-weight:700`、圆角 `4px`、高 `20px`、`padding:0 6px`），**不得裁切**；④ 快照运行中 / 已完成 / 未知状态采用最终 prototype 的符号（`●`/`✓`/`?`）、颜色（`#e0f2fe`/`#0369a1`、`#ecfdf5`/`#047857`、`#fef3c7`/`#b45309`）与字重（`600`），标签高 `20px`、圆角 `4px`；⑤ 未知状态行保留浅黄背景（最终 `rgba(254,243,199,.42)`，hover `.66`）；⑥ 内容超长统一使用省略号，并通过页面级单实例 Tooltip 展示完整内容（`DSS-REQ-070` 不变）。验收 `DSS-AC-093`。 |
| DSS-REQ-083 | 响应式描述口径与既有交互状态机保持固化：① 响应式描述必须使用**准确视口**，禁止只写“1K/2K”（截图像素宽度、浏览器 viewport 与显示器分辨率不是同一概念）；② 真实 `1280×800` viewport 下三个字段标签与字段控件保持第一行、查询/重置操作组按既有 `flex-wrap` 行为换到第二行，这是 prototype **既有**响应式设计，**不是**回退或缺陷；③ 约 `1700px` 宽截图与 `1920×1080`、`2560×1440` 下三个查询条件及查询/重置保持同一行、布局紧凑；④ **明确撤回**曾误写的“`1280` 下所有查询条件和查询/重置必须同处一行”要求——该要求从未写入本 Feature 正式文档、只存在于 R7 任务提示词，不得继续作为缺陷、阻塞项或正式验收条件（见 §21.5）；⑤ 既有已验证交互状态机保持：首次进入自动查询；查询成功（含 0 条）才替换已应用条件与表格结果；查询失败保留旧结果与旧的已应用条件、界面保留新选择；“重置”只恢复条件默认值、不立即发查询；手动/自动刷新使用已应用条件；`60` 秒自动刷新、页面不可见时暂停、恢复后按既有逻辑继续；请求单飞行、忙碌期间抑制/禁用重复请求；页面级错误收敛、不出现重复全局错误弹窗；倒计时走秒不产生额外 GET；所有操作只读、不产生写请求；Tooltip 页面级单实例、快速移动不堆叠。验收 `DSS-AC-094`/`DSS-AC-095`。 |

### 21.5 隔离视觉原型对已批准需求行的定向取代与口径纠正说明

本轮在已批准基线之上对下列既有需求行做**展示/交互呈现层面的定向取代**，使全文现行口径与 R2～R7 最终 prototype 一致（各行原有批准文字保留于第一/二轮批准版本与 git 历史；本轮新口径已随本固化文档收口为 `APPROVED`）：

| 既有需求行 | 取代/纠正点 | 新口径落点 |
|---|---|---|
| `DSS-REQ-066②`（页面结构·查询卡片容器） | 查询卡片由“独立**白色**容器（边框/圆角/内边距）”改为**浅灰分组底**（`rgb(244,244,245)`、无阴影、圆角 `8px`）；页根容器改为**透明**直接承接外层白卡 | `DSS-REQ-076` |
| `DSS-REQ-069` / `DSS-REQ-072`（列宽模型） | 由五固定列（序号 `70`/快照状态 `130`/三时间各 `165`）＋两弹性列（探针端 `170`/源库 `280`）、最小总宽 `1145px`、建议 `170:280`，改为 `70/170/285/140/170/170/170`、最小总宽 `1175px`、三时间列始终等宽 | `DSS-REQ-079` |
| `DSS-REQ-050/068`（刷新组 / 立即刷新稳定宽度） | 在既有“稳定宽度”基础上固化最终值：白底次级按钮 `1px solid #E4E4E7`、`110px` 固定宽、`border-box`；刷新组增加倒计时只读投影 | `DSS-REQ-078/081` |
| `DSS-REQ-045`（异常提示形式） | 与第二轮一致，本页不显示关联异常图标/异常文字；非启用仅保留探针端浅红“停用”Badge；状态标签符号/颜色/字重按 R2～R7 最终 prototype 固化 | `DSS-REQ-082` |
| 时间列内边距（第二轮未单列） | 新增固化：三时间列单元格水平 `padding` `12px`→`8px`，上下 `padding` 与 `49px` 行高不变、`19` 字符时间戳完整不省略 | `DSS-REQ-080` |
| 响应式描述口径（第一/二轮未单列） | 新增固化并**撤回**误写的“`1280` 下所有查询条件和查询/重置必须同处一行”；改为准确视口口径（`1280×800` 下查询/重置按既有 `flex-wrap` 换第二行属既有设计） | `DSS-REQ-083` |

> **`1280` 响应式冲突的纠正记录（必读）**：本 Feature **正式文档**从未包含“`1280` 下所有查询条件和查询/重置必须同处一行”这一要求；该错误前提仅存在于隔离 prototype 的 R7 任务提示词中。§21.4 `DSS-REQ-083` 与 `DSS-AC-094` 明确**撤回**该前提，并确认：真实 `1280×800` viewport 下三个字段标签与字段控件保持第一行、查询/重置操作组按既有 `flex-wrap` 换行到第二行；约 `1700px`/`1920×1080`/`2560×1440` 下保持同一行。该前提**不得**继续作为缺陷、阻塞项或正式验收条件。

> 本轮为**纯前端视觉/交互呈现调整固化**，无 API、无数据库变更（`API.md`/`DATABASE.md` 整文件零差异）；凡与 §21.2/§21.3（第二轮现行）在列宽模型、查询卡片容器底色等处冲突者，以本节 §21.4/§21.5 为准；与本轮无关的其余业务行相对上一版基线**整文件不变**。

### 21.6 查询控件交互调整草案新增需求（DSS-REQ-084 ~ DSS-REQ-086）

> 本节为 2026-09-10 任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001` 在**已批准基线之上**新增的独立需求行（编号自 `DSS-REQ-084` 起连续），用于把项目负责人对 `5173` 正式实现进行人工页面检查（结论 `CHANGES_REQUIRED`）后确认的**一组互相关联的查询控件交互问题及目标规则**固化为查询控件交互调整基线（已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 收口为 `APPROVED`）。事实边界（必须与状态表一致）：① R2～R7 视觉方案已应用到 `5173` 正式前端（原正式实现提交 `3ec9cbf6487eacff004212fb3aca3064c3bd18cc`），ChatGPT 已从远程 Git 完成代码复审并判定 `APPROVED`（`formal_5173_code_review_status=APPROVED`）；② 项目负责人人工页面检查结论为 `CHANGES_REQUIRED`（`project_owner_visual_review_status=CHANGES_REQUIRED`），原因是查询控件存在互相关联的三类交互问题，故当前不能进入正式验收；③ 正式验收 `NOT_RUN`（`acceptance_not_run_count=103`）；④ 本节内容已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 批准收口为 `APPROVED`（`query_control_interaction_adjustment_status=APPROVED`、`query_control_interaction_adjustment_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`、`pending_user_review=NO`、`pending_user_confirmation_count=0`；批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`，批准日期 2026-09-10），本轮调整尚未应用到 `5173`，**不得**写成 `IMPLEMENTED`/`PASS`/`ACCEPTED`/`COMPLETED`；⑤ 本轮调整只取代与查询控件固定宽度、四字段字段级截断、`CLIENT_DESC` 完整 Tooltip 直接相关的现行规则（取代说明见 §21.7），既有 R2～R7 设计批准事实、`5173` 正式实现事实与 ChatGPT 代码复审 `APPROVED` 全部保留，**不得**把既有正式实现整体倒退为“未实现”；⑥ 本轮无 API、数据库、SQL 或只读边界变更（`API.md`/`DATABASE.md` 整文件零差异），请求与状态机保持不变。三个问题必须统一处理：字段级截断与控件外部几何固定共同保证查询紧凑且稳定，`CLIENT_DESC` 完整 Tooltip 在截断后保留完整描述读取能力，三者属同一套方案、不可拆分。

| 编号 | 需求 |
|---|---|
| DSS-REQ-084 | 三个查询下拉框（探针端 / 源库 / 快照状态）的外部几何**固定**固化，继续使用已批准数值 `240px` / `300px` / `200px`；该“固定”必须覆盖下列全部状态且宽度不得变化：① 初始“全部”；② 选中最短候选；③ 选中最长候选；④ 从短值切换到长值；⑤ 从长值切换到短值；⑥ 多选与 `collapse-tags`；⑦ 取消最长候选；⑧ 清空后回到“全部”；⑨ 点击重置；⑩ 打开和关闭下拉面板；⑪ Tooltip 显示和隐藏。约束：① 上述过程中三个下拉框**根节点与可视 wrapper 的宽度均不得变化**；② 查询栏中后续字段组与“查询 / 重置”按钮的横坐标不得因选中内容长度变化而移动；③ 若在批准的响应式断点发生整组换行，只允许遵循既有响应式规则，**不得**由候选文本长度额外触发换行；④ 控件内部仍保留 CSS `text-overflow` 作为组合文本超出实际可用像素宽度时的最后保护。实现落点建议（本任务不编码，供未来实现遵循）：先用真实浏览器分别测量 `.dss-select`、`.el-select__wrapper`、`.el-select__selection`、`.el-select__selected-item`、`.dss-q-group` 与操作按钮的 before/after 几何，定位是根节点、wrapper 还是内部 flex intrinsic/min-content 约束导致宽度变化；不得只凭猜测添加全局 CSS；修复必须限定在本 Feature 命名空间，并通常需要同时锁定外框 `width/min-width/max-width/flex-basis` 与内部可收缩区域 `min-width: 0`。验收 `DSS-AC-096`/`DSS-AC-097`/`DSS-AC-103`。 |
| DSS-REQ-085 | 四个展示字段 `CLIENT_ID`、`CLIENT_DESC`、`DATA_SOURCE_ORG`、`DATA_SOURCE_ID` 分别执行**统一的字段级截断**，统一按 Unicode code point 计数：`codePointLength <= 20` 显示原文；`codePointLength > 20` 显示前 20 个 code point 并追加英文三个点 `...`。候选显示规则：探针端为 `truncate(CLIENT_ID, 20)（truncate(CLIENT_DESC, 20)）`，源库为 `truncate(DATA_SOURCE_ORG, 20)（truncate(DATA_SOURCE_ID, 20)）`。空值规则：`CLIENT_DESC` 为 `null`、空串或 trim 后为空时只显示截断后的 `CLIENT_ID`、不显示空括号；`DATA_SOURCE_ORG` 为 `null`、空串或 trim 后为空时只显示截断后的 `DATA_SOURCE_ID`、不显示空括号。边界：恰好 20 个 code point 完整显示、**不**追加 `...`；21 个或更多只显示前 20 个并追加 `...`；中文字符按一个 code point 计，实现**不得**按 UTF-16 code unit 粗暴截断而破坏代理对（surrogate pair）字符。适用范围与不变性：① 下拉面板候选项与控件中可见选中项必须采用**同一套**字段级显示结果；② 截断**只影响显示**，不得修改完整 `CLIENT_ID`/`DATA_SOURCE_ID` 对应的选项 `value`，已选值、查询参数、已应用条件及请求语义继续使用**完整原始 ID**；③ 不改后端数据、不改查询参数、不改请求/响应结构与状态机。验收 `DSS-AC-098`/`DSS-AC-099`/`DSS-AC-103`。 |
| DSS-REQ-086 | 当且仅当原始 `CLIENT_DESC` 的 Unicode code point 长度大于 20 时，`CLIENT_DESC` 完整内容通过 Tooltip 展示：① 探针端下拉面板对应候选项悬停可显示；② 探针端控件中当前**可见的选中项**悬停可显示。内容与排除：Tooltip 内容只显示完整、未经截断的原始 `CLIENT_DESC`，**不**重复显示 `CLIENT_ID`、**不**显示 `CLIENT_ID（CLIENT_DESC）`组合文本、**不**显示截断后的 `CLIENT_DESC`、**不**追加“不在候选内”/停用/缺失或其他说明。不应出现 Tooltip 的情形：`CLIENT_DESC` 为 `null`、空串或 trim 后为空；原始 `CLIENT_DESC` 长度小于或等于 20 个 Unicode code point；源库候选的 `DATA_SOURCE_ORG` 或 `DATA_SOURCE_ID` 超过 20 个字符（本轮**不**为源库新增 Tooltip）；`CLIENT_ID` 自身超过 20 个字符（本轮**不**为 ID 新增 Tooltip）。行为约束：内容必须完整、不得再次截断；可设置安全最大宽度（建议 `480px` 或 `min(480px, calc(100vw - 16px))`）并允许自然换行、防止长描述越出视口；任意时刻**最多一个**可见实例；从一个候选快速移动到另一个候选时**不得叠加**多个；鼠标离开后及时隐藏/销毁；**不得**改变下拉框宽度、高度、查询栏高度或其他控件位置；**不得**污染表格既有 Tooltip，也**不得**改变源库表格 Tooltip 只显示完整原始 `DATA_SOURCE_ID` 的批准规则。对于多选折叠后的 `+N`，继续使用 Element Plus 既有折叠语义，**不得**把 `+N` 改造成所有 `CLIENT_DESC` 的聚合 Tooltip；仅对实际可见、可明确对应单个探针候选的选中项提供上述完整描述 Tooltip。验收 `DSS-AC-100`/`DSS-AC-101`/`DSS-AC-102`/`DSS-AC-103`。 |

> 本轮请求与状态机**保持不变**（与 `DSS-REQ-023/025/050~054/071` 一致）：选择、取消、清空和重置仍只修改查询草稿、不发送请求；只有点击“查询”才按草稿发起查询；自动刷新、立即刷新继续使用已应用条件；单飞行、busy、失败保留旧结果、页面不可见冻结与恢复规则不变；本轮不改 API、请求参数、响应结构或后端逻辑。

### 21.7 本轮草案对既有需求行的定向取代与扩展说明

本轮在已批准基线之上对下列既有需求行做**展示/交互呈现层面的定向取代或扩展**，使查询控件宽度、四字段字段级截断与 `CLIENT_DESC` Tooltip 的现行口径与本轮调整一致（各行原有批准文字保留于既往批准版本与 git 历史，本轮新口径以 §21.6 为准；本轮调整已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 批准收口为 `APPROVED`，尚未应用到 `5173`）：

| 既有需求行 | 取代/纠正点 | 新口径落点 |
|---|---|---|
| `DSS-REQ-075`（探针下拉按字段截断与控件/面板宽度） | 由“探针端 `CLIENT_ID`/`CLIENT_DESC` 各 20 字符截断＋控件宽度上限”扩展为**四字段统一** 20 Unicode code point 字段级截断（新增 `DATA_SOURCE_ORG`/`DATA_SOURCE_ID`），并把控件宽度由“上限”固化为外部几何在三状态全过程中**恒定**（`240/300/200px`） | `DSS-REQ-084` / `DSS-REQ-085` |
| `DSS-REQ-022/024`（候选展示截断与控件/面板宽度边界） | 候选展示截断口径统一到 `DSS-REQ-085` 的 `truncate(value, 20)`（含源库两侧字段）；控件外部几何固定口径统一到 `DSS-REQ-084`；候选**来源与过滤语义不变** | `DSS-REQ-084` / `DSS-REQ-085` |
| `DSS-REQ-028`（探针端列 Tooltip 仅完整 `CLIENT_DESC`） | 表格列 Tooltip 规则**不变**；本轮只新增“查询控件候选项与可见选中项”的 `CLIENT_DESC` 完整 Tooltip（仅当 >20 code point），二者互不替代、不互相污染 | `DSS-REQ-086` |
| `DSS-REQ-070`（页面级单实例 Tooltip） | 单实例 Tooltip 机制**不变**；本轮为查询控件 `CLIENT_DESC` 新增一个触发场景，仍遵循页面级单实例、快速移动不堆叠、离开隐藏 | `DSS-REQ-086` |

> 本轮为**纯前端交互/呈现调整**，无 API、无数据库变更（`API.md`/`DATABASE.md` 整文件零差异）；凡与既往 §21.2/§21.3/§21.4/§21.5 在查询控件宽度、四字段截断与 `CLIENT_DESC` Tooltip 处以本节 §21.6/§21.7 为准；与本轮无关的其余业务行相对上一版基线**整文件不变**。本轮调整**不修改** `DSS-REQ-001~083` 的任何业务行，仅在其上以新增行方式扩展/取代对应部分。

## 22. 明确非目标

下列内容属于本 Feature 明确不实现或不推断的范围（作为范围边界记录；凡可判定的“禁止”行为已编码进 §5~§20 相应 `DSS-REQ-*`）：

- 对 RUN_STATE 的任何产品写能力，或对运行侧（sync-client）的启停、通知、重新快照控制；
- 展示或推断 sync-client 在线/健康/离线、增量采集是否正常、当前同步进度；
- 从配置表补行、生成“未开始/待快照”等虚拟状态；
- 分页、时间范围、在线/健康/关键字等未批准查询；
- 依据时间字段计算超时/异常/离线/长期运行；
- 除明确允许的只读访问（`CDC_DATA_SOURCE_RUN_STATE`）与只读关联（`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`）之外的其他数据访问；执行任何 DDL/DML 或其他表写行为（本任务不访问数据库）；
- 本草案任务不进入设计、不实现代码、不执行验收。

## 23. 草案建议处置（R1：原 DSS-PROP-001~008 已全部决策并吸收）

R0 初版 §22“待用户复审的草案建议”所列 8 项 `DSS-PROP-*` 已在 R1 中全部由项目负责人确认并吸收为正式需求/验收行，本版不再保留任何待用户复审草案建议（`pending_user_confirmation_count=0`）。`pending_user_confirmation_count=0` 不等于 `IMPLEMENTED_ACCEPTED`：本版需求与验收基线已批准（ChatGPT 对 R3 结果正式复审 `APPROVED`，项目负责人随后明确“批准”，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`）；批准的是需求与验收标准基线，不代表设计已完成、功能已实现、验收已执行或通过。下一入口为设计基线建立。

| 原草案建议 | 决策结果与去向（需求 / 验收） |
|---|---|
| DSS-PROP-001（三查询控件单选或全部） | 已确认改为“三项多选＋显式全部＋全部与具体候选互斥＋同条件内或/条件间且”，并入 `DSS-REQ-022`；验收 `DSS-AC-020`、`DSS-AC-023` |
| DSS-PROP-002（未知状态候选） | 已确认“未知状态”候选仅在真实存在未知记录时出现，选中后筛出非已确认状态；并入 `DSS-REQ-024`；验收 `DSS-AC-022` |
| DSS-PROP-003（源库列展示原始 ID） | 已确认改为“单行：关联成功优先显示 ORG、Tooltip 展示原始 `DATA_SOURCE_ID`；关联不到直接显示原始 ID 并弱提示”，不采用两行 ORG＋ID 布局；并入 `DSS-REQ-029`；验收 `DSS-AC-027` |
| DSS-PROP-004（状态标签颜色） | 已确认颜色映射：RUNNING 蓝“快照进行中”、COMPLETED 绿“快照已完成”、未知橙“未知状态”并可查看原始值，且不能只靠颜色；并入 `DSS-REQ-035/036/038`；验收 `DSS-AC-032/033/035/037` |
| DSS-PROP-005（时间展示格式） | 已确认统一 `YYYY-MM-DD HH:mm:ss`、空值 `--`、不改变业务时间值；并入 `DSS-REQ-055`；验收 `DSS-AC-052` |
| DSS-PROP-006（加载态与刷新失败） | 已确认刷新失败保留最近一次成功数据、提示收敛、最近成功刷新时间、失败脱敏、刷新在途不闪烁；并入 `DSS-REQ-061`（并 `DSS-REQ-064`）；验收 `DSS-AC-058` |
| DSS-PROP-007（轻量异常提示形式） | 已确认单元格内小图标或弱提示文字＋Tooltip、不新增专门异常列、只描述配置关联事实；并入 `DSS-REQ-045`；验收 `DSS-AC-038~042` |
| DSS-PROP-008（恢复可见立即刷新） | 已确认恢复可见后立即按“已应用查询条件”刷新一次并重启 60 秒计时；并入 `DSS-REQ-051/054`；验收 `DSS-AC-048/051` |

另：刷新工具栏稳定宽度（“立即刷新”稳定宽度、加载图标出现/消失不改变按钮宽度、按钮前文字不位移、工具栏不因刷新在途水平移动）为本 Feature 已确认交互要求，并入 `DSS-REQ-050`，验收 `DSS-AC-068`；不再作为草案建议表述。

## 24. 需求数量与编号核验

- 需求编号：`DSS-REQ-001`～`DSS-REQ-083` 为**已批准**的既有 **83** 条，编号连续唯一（`DSS-REQ-001~065` 为已批准基线既有行；`DSS-REQ-066~071` 为第一轮 UI 调整草案新增行，见 §21，已随第一轮批准收口为基线；`DSS-REQ-072~075` 为第二轮 UI 调整草案新增行，见 §21.2，已随第二轮重新批准收口为基线；`DSS-REQ-076~083` 为 2026-09-10 隔离视觉原型 R2～R7 设计固化新增行，见 §21.4，已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001` 收口为 `APPROVED`）。**本轮（2026-09-10 查询控件交互调整）新增 `DSS-REQ-084~086` 共 3 条（见 §21.6），调整后当前编号合计 `DSS-REQ-001`～`DSS-REQ-086` 共 86 条，其中 `DSS-REQ-084~086` 已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 收口为 `APPROVED`、全部纳入当前批准需求基线（批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`，批准日期 2026-09-10）；既有 83 条业务行逐字节零差异。**
- 验收编号：`DSS-AC-001`～`DSS-AC-095` 为**已批准**的既有 **95** 条，全部 `NOT_RUN`（见 `ACCEPTANCE.md`；既有 `DSS-AC-001~068` 为已批准基线既有用例，其中 `DSS-AC-068` 覆盖刷新工具栏稳定宽度；第一轮调整草案新增 `DSS-AC-069~080`，见 `ACCEPTANCE.md` §4.18，已随第一轮批准收口为基线；第二轮调整草案新增 `DSS-AC-081~086`，见 `ACCEPTANCE.md` §4.19；隔离视觉原型 R2～R7 设计固化新增 `DSS-AC-087~095`，见 `ACCEPTANCE.md` §4.20，全部 `NOT_RUN`）。**本轮查询控件交互调整新增 `DSS-AC-096~103` 共 8 条（见 `ACCEPTANCE.md` §4.21），已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 收口为 `APPROVED`、纳入当前批准验收基线，调整后当前编号合计 `DSS-AC-001`～`DSS-AC-103` 共 103 条、全部 `NOT_RUN`（`acceptance_not_run_count=103`）；既有 95 条业务行逐字节零差异。**
- 本轮查询控件交互调整状态（分层）：既有 83 条需求 / 95 条验收与 R2～R7 设计固化批准、`5173` 正式实现事实、ChatGPT 代码复审 `APPROVED` **全部保留**；本轮新增 `DSS-REQ-084~086` / `DSS-AC-096~103` 已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`，批准日期 2026-09-10）、全部纳入当前批准需求/验收基线，并覆盖分层状态（`query_control_interaction_adjustment_status=APPROVED`、`query_control_interaction_adjustment_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`、`project_owner_visual_review_status=CHANGES_REQUIRED`、`formal_5173_code_review_status=APPROVED`、`formal_acceptance_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`、`acceptance_not_run_count=103`、`pending_user_review=NO`、`pending_user_confirmation_count=0`）；下一入口只能是独立正式实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001`，**不得**在本批准收口任务中直接进入实现、**不得**执行正式验收。
- 每条需求至少被一个验收用例覆盖，每条验收用例引用已存在需求编号（见 `ACCEPTANCE.md` 验收表格“关联需求”列与 §5 追踪矩阵；各轮新增需求/验收行均已纳入追踪矩阵，正反向引用均无悬空）。
- 既有已批准基线（需求/验收正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准 `4234af73db2190098f3dcd219319a4281fdabafd`；设计批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`；第一轮 UI 调整批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准 `5757237...`，2026-09-07）保留为历史。第一轮 UI 调整已由实现任务 `...-UI-ADJUSTMENT-IMPLEMENTATION-001`（2026-09-07）落地、实现 R1 提交 `5933ec2...` 经 ChatGPT 独立复审 `APPROVED`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`。本轮第二轮 UI 调整版本曾于 2026-09-08 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`），作为历史批准事实保留；因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`、与项目负责人真实需求冲突，R2 极小纠正 `...-002-R2` 后 `REQUIREMENTS.md`/`ACCEPTANCE.md` 与 `DESIGN.md`/`UI.md` 当前第二轮调整版本重新进入复审，经 R3 记录纠正 `...-002-R3` 后 ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED`、项目负责人明确回复“批准”，于 2026-09-08 重新批准收口为 `APPROVED`（当前正式重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`）、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`（第二轮调整尚未实现）、正式验收执行 `NOT_RUN`（`DSS-AC-001~086` 全部 `NOT_RUN`）、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=NO`。批准的是各轮批准版本的基线，不代表本轮调整已实现、正式验收已执行或通过（不得写成功能已实现、验收已执行或通过：`IMPLEMENTED_ACCEPTED`/`PASS`/`ACCEPTED`）。
- 待用户复审草案建议：**0** 项（`pending_user_confirmation_count=0`；原 `DSS-PROP-001~008` 已全部决策并吸收，见 §23；本轮四类调整范围均为已确认输入、无待人工决策项）。当前第二轮 UI 调整版本经 R2 极小纠正与 R3 记录纠正、ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED` 与项目负责人明确“批准”后已重新批准收口，`pending_user_review=NO`（第二轮版本曾于 2026-09-08 收口为 `APPROVED`：`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，作为历史批准事实；R2 因批准内容误记源库 Tooltip 内容而纠正并恢复 `pending_user_review=YES`，R3 记录纠正后重新批准为 `NO`，当前重新批准版本 `...-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d...`）；`pending_user_review=NO` 与 `pending_user_confirmation_count=0` 均不等同于第二轮调整已实现或代码复审已通过、正式验收已执行/通过，更不等于 `IMPLEMENTED_ACCEPTED`。

## 25. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-05 | 建立“源库快照状态”Feature 需求草案（`DRAFT_PENDING_USER_REVIEW`；requirements_status/acceptance_status=`DRAFT_PENDING_USER_REVIEW`；实现状态 `NOT_STARTED`；验收执行状态 `NOT_RUN`；设计状态 `NOT_STARTED`；`DSS-REQ-001~065` 共 65 条；草案建议 `DSS-PROP-001~008`；全部数据库事实引用已提交数据库只读复核报告 `docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`） | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001（纯文档任务；基于项目负责人已确认产品决策 + 已核验数据库只读复核报告；待用户审阅与 ChatGPT 正式复审） |
| 2026-09-05 | R1 定向修订需求草案：修正 R1-01（统一“只读访问 RUN_STATE＋只读关联两张配置表”边界，消除“访问本表之外”自相矛盾）与 R1-03 相关需求（建立“界面选择条件/已应用查询条件”双状态与“重置不查询”，并入 `DSS-REQ-022~025`、`DSS-REQ-050~054`）；吸收项目负责人已确认的 8 项交互方案（并入 `DSS-REQ-022/023/024/029/035/036/038/045/051/054/055/061` 等）与刷新工具栏稳定宽度（`DSS-REQ-050`）；删除 `DSS-PROP-001~008` 待复审草案建议（`pending_user_confirmation_count=0`）；验收计数随 `ACCEPTANCE.md` 更新为 68 条；仍为 `DRAFT_PENDING_USER_REVIEW` 未批准草案，待 ChatGPT 对 R1 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1（ChatGPT 正式复审 `CHANGES_REQUIRED` 驱动的纯文档定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | R2 最小定向修订需求草案（ChatGPT 对 R1 结果正式复审 `CHANGES_REQUIRED`）：R2-01 明确“点击查询用请求快照、仅成功（含成功返回 0 条空结果）才升级已应用查询条件；按新条件查询失败保留旧结果/旧已应用条件/界面保留新条件/后续自动与立即刷新用旧条件/不更新最近成功刷新时间；请求在途再改控件成功升级的是请求开始时的快照”（并入术语与 `DSS-REQ-023/025/050/059/060/061`）；R2-02 明确“页面可见时每次实际请求结束（无论成功/失败）都从请求结束重启完整 60 秒周期；失败后 60 秒按已应用条件自动重试、不停止不立即无间隔；成功空结果同样属成功并重启计时；在途被抑制触发不视为实际请求、不单独重置计时；页面不可见停止计时且不保留剩余秒数、不可见期间不启动新计时；恢复可见立即刷新后无论成败重启完整 60 秒；最近成功刷新时间仅成功后更新”（并入 `DSS-REQ-050/051/053/054/061`）；编号与计数不变（需求 65、验收 68、全部 `NOT_RUN`）；仍为 `DRAFT_PENDING_USER_REVIEW` 未批准草案，待 ChatGPT 对 R2 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2（ChatGPT 对 R1 正式复审 `CHANGES_REQUIRED` 驱动的纯文档最小定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | R3 极小定向修订需求草案（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED`）：本版不改变任何需求业务规则，只把修订范围限定到验收草案 `DSS-AC-024`——修正该用例“成功刷新却不更新最近成功刷新时间”的验收矛盾，统一为“成功刷新更新‘最近成功刷新时间’但不替换‘已应用查询条件’，只有用户点击‘查询’且查询成功才允许替换”；因此 65 条 `DSS-REQ-*` 业务行相对本版授权基线 `5c58af6` 逐字节不变；编号与计数不变（需求 65、验收 68、全部 `NOT_RUN`）；仍为 `DRAFT_PENDING_USER_REVIEW` 未批准草案，待 ChatGPT 对 R3 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED` 驱动的纯文档极小定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | 需求与验收基线批准收口：ChatGPT 对 R3 结果（提交 `4234af73db2190098f3dcd219319a4281fdabafd`）正式复审结论 `APPROVED`，项目负责人随后明确回复“批准”；`REQUIREMENTS.md`/`ACCEPTANCE.md` 基线状态由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`）；业务零变化——需求仍 65 条 `DSS-REQ-001~065`、验收仍 68 条 `DSS-AC-001~068` 全部 `NOT_RUN`、需求—验收追踪矩阵零差异；实现状态保持 `NOT_STARTED`、设计状态保持 `NOT_STARTED`、验收执行状态保持 `NOT_RUN`；批准的是需求与验收标准基线，不代表设计已完成、功能已实现、验收已执行或通过、也不代表 `IMPLEMENTED_ACCEPTED`；下一入口更新为设计基线建立 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001（项目负责人明确批准驱动的需求与验收基线批准收口；纯文档任务，未设计、未实现、未执行验收） |
| 2026-09-06 | 本文件仅同步实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001` 完成后的**当前实现状态与文档级实现记录**（文档级状态同步，不新增/删除/修改任何 `DSS-REQ-*` 需求业务行，相对批准内容基准 `4234af7...` 业务零变化，追踪矩阵零差异）：元数据“前端现状/后端现状/实现状态/设计状态”行更新为已实现（`IMPLEMENTED_PENDING_REVIEW`）与设计已批准事实；实现任务完成占位页替换为正式页、后端新增只读 GET 链路、三多选/七列/60 秒自动刷新等全部按批准需求与设计落地（开发测试 27+62、前端全量 663、构建、真实浏览器联调见实现报告与证据）；需求/验收批准状态不变（`APPROVED`）、68 条验收保持 `NOT_RUN`、正式验收未执行 | DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001（前后端实现；纯文档记录，不改需求业务行、不执行正式验收） |
| 2026-09-06 | 实现修复任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1` 完成：本文件仅新增 §20.1 任务级测试数据授权例外说明（本行不含任何 `DSS-REQ-*` 业务行变更，65 条 `DSS-REQ-*`/68 条 `DSS-AC-*` 业务行与追踪矩阵相对基准 `d125397` 零差异）；R1-01 在公共 `http.ts` 增加请求级 `skipGlobalErrorPopup` 开关（默认未开启的其它页面错误弹窗行为不变、未删公共拦截器），本页 `fetchSnapshotStatusList` 开启该开关由页面统一脱敏/收敛失败反馈，真实拦截链测试（HTTP500/超时断网/业务码非 200/默认行为不变/60 秒恢复）6 用例通过，前端全量 669/669、构建成功；R1-02 按负责人授权对所指生产库三表执行测试 INSERT＋COMMIT 并保留（RUN_STATE +29、CLIENT_MULTIPLE +5、DATA_SOURCE +5，前缀 `dssr1-0906-`，FG_ACTIVE='0'、连接值不可用绝不连接、不 UPDATE/DELETE 已有行、无 TRUNCATE/DDL/其它表/触发器写入，运行中只读接口读回 30 条），授权例外仅限本任务不扩散；R1-03 补齐 1440×900/1920×1080 浏览器证据（七列/状态标签/三时间/三多选/成功 0 条/重置不请求/真实 HTTP500 保留与恢复/60 秒自动刷新/隐藏暂停/恢复可见/工具栏稳定宽度/边缘 Tooltip，错误仅在 CDP Fetch 层注入）与后端全量测试澄清（`cd backend && mvn clean test`，默认 profile、无筛选/排除/跳过，退出码 1，Tests 1022、Failures 3、Errors 17、Skipped 0，非通过全部集中在既存 `monitor.jobfailure` 模块的 ZooKeeper 不可达与日期映射环境性失败，详见报告与 `evidence/...R1/`）；实现状态保持 `IMPLEMENTED_PENDING_REVIEW`、需求/验收/设计批准状态不变、68 条验收保持 `NOT_RUN`、正式验收未执行 | DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1（复审问题修复与证据补齐；纯文档记录，不改需求业务行、不执行正式验收） |
| 2026-09-07 | 验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`（纯文档草案，**不自动批准、不实现、不执行验收**）：在既有批准需求之上定向修订展示相关行并在批准编号后连续新增。本文件定向修订 `DSS-REQ-028`（探针端列只显示原始 `CLIENT_ID`、完整 `CLIENT_DESC` 经悬停 Tooltip、不再同行/次行内联展示）、`DSS-REQ-029`（源库列正常关联且 ORG 非空只显示 `DATA_SOURCE_ORG`、悬停显示完整 ORG 而非原始 ID 默认内容、缺失/ORG 空回退显示原始 `DATA_SOURCE_ID` 不空白）、`DSS-REQ-050`（刷新工具栏归入结果卡片头部右侧不可拆散刷新逻辑组、窄宽度整体换行、仅发起操作呈现加载反馈、刷新在途“查询”不闪动，落点并入新增 `DSS-REQ-068/071` 与 §21.1）；新增 `DSS-REQ-066~071` 共 6 条（页面三块清晰分区 `DSS-REQ-066`、结果卡片头部左侧总数＋未知状态轻量提示 `DSS-REQ-067`、右侧不可拆散刷新逻辑组 `DSS-REQ-068`、七列固定列宽 `DSS-REQ-069`、页面级单实例 Tooltip `DSS-REQ-070`、busy 视觉隔离与单请求语义 `DSS-REQ-071`）于新 §21；既有批准业务行其余不变。计数：需求 `DSS-REQ-001~071` 共 71（066-071 为草案新增）、验收随 `ACCEPTANCE.md` 更新为 `DSS-AC-001~080` 共 80 条全部 `NOT_RUN`（草案新增 `DSS-AC-069~080` 见 `ACCEPTANCE.md` §4.18）。状态迁移（草案范围）：`REQUIREMENTS.md`/`ACCEPTANCE.md` 与 `DESIGN.md`/`UI.md` 当前调整版本为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`（既有实现存在、本轮调整尚未实现）、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`pending_user_review=YES`、`pending_user_confirmation_count=0`；旧批准版本（需求/验收批准 `4234af73...`、设计批准 `61117a62...`）保留为历史，批准旧基线**不自动批准**本轮调整草案。`API.md`/`DATABASE.md` 本轮不改接口/编号/业务内容，整文件零差异。下一入口为 ChatGPT 对本 UI 调整基线草案的正式复审（不是直接实现）；本轮草案经复审与负责人批准后再另立任务实现 | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001（ChatGPT 对实现 R1 复审 `CHANGES_REQUIRED` 与负责人 UI 调整要求驱动的验收前纯文档调整草案；已批准旧基线作为历史保留，草案未批准、本轮调整未实现、验收未执行） |
| 2026-09-07 | R1 极小定向修订需求草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001-R1`）：仅定向澄清 `DSS-REQ-071`，写入项目负责人已确认的六类请求完整视觉映射（`initial/retry/query/manual/auto/restore` 六类触发来源与对应页面视觉反馈），消除初版唯一歧义——`auto`（60 秒自动刷新）与 `restore`（页面恢复可见后立即或延后单次刷新）在途时只激活刷新状态圆点变蓝动态，“查询”与“立即刷新”按钮外观稳定、均不显示 loading；“立即刷新”按钮 loading 只由 `manual`（用户点击“立即刷新”）触发。`DSS-REQ-001~070` 业务行逐字节零差异、需求数量保持 71、不新增 `DSS-REQ-072`；其余各节、§21.1 与批准历史不变。本行六类映射与 `ACCEPTANCE.md` §4.18 `DSS-AC-072/078/079`、`DESIGN.md` §19.3/§19.6、`UI.md` §13.3/§13.6 逐项一致。状态保持（草案范围）：`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收 `NOT_RUN`、人工页面验收 `NOT_RUN`、`pending_user_review=YES`、`pending_user_confirmation_count=0`；`API.md`/`DATABASE.md` 整文件零差异。下一入口为 ChatGPT 对 R1 结果提交正式复审（不是直接实现） | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001-R1（ChatGPT 对 UI 调整草案正式复审 `CHANGES_REQUIRED` 驱动的纯文档极小定向修订；草案未批准、本轮调整未实现、验收未执行） |
| 2026-09-07 | 本轮 UI 调整版本批准收口：ChatGPT 对 R1 结果提交 `575723711ca39d7761df308c1c99b1e6e957cf70` 独立正式复审结论 `APPROVED`，项目负责人随后明确回复“批准”；`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md` 当前 UI 调整版本由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07）；业务零变化——需求 `DSS-REQ-001~071` 仍 71 条、验收 `DSS-AC-001~080` 仍 80 条全部 `NOT_RUN`、§5 追踪矩阵零差异、DESIGN/UI 业务内容与追踪矩阵零差异、`API.md`/`DATABASE.md`/初版 UI 调整报告/R1 报告整文件零差异；实现状态保持 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`pending_user_review=NO`、`pending_user_confirmation_count=0`；批准的是本轮 UI 调整需求/验收/设计基线，不代表本轮调整已实现、正式验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`；下一入口为另立 UI 调整实现任务 | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001（项目负责人明确批准＋ChatGPT 对 R1 结果独立正式复审 `APPROVED` 驱动的纯文档批准收口；未实现、未执行验收） |
| 2026-09-07 | 本文件仅同步本轮 UI 调整实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001` 完成后的**当前实现状态与文档级实现记录**（文档级状态同步，不新增/删除/修改任何 `DSS-REQ-*` 需求业务行，相对批准内容基准 `5757237...` 业务零变化，追踪矩阵零差异）：元数据“实现状态”行、§1 文档事实边界、§24 当前状态叙述更新为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（本轮 UI 调整已由本实现任务按批准内容基准 `5757237...` 落地——查询/结果两卡片分离、七列固定列宽、结果卡头部左侧总数＋未知状态轻量提示与右侧不可拆散刷新逻辑组、六类请求唯一视觉映射、页面级单实例 Tooltip 等，专项前端测试 120、前端全量 726/726、`vue-tsc`＋Vite 构建成功、1440×900/1920×1080 真实浏览器视觉验证，见实现报告与证据）；需求/验收/设计批准状态不变（`APPROVED`）、80 条验收保持 `NOT_RUN`、正式验收未执行 | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001（前端只读 UI 调整实现；纯文档记录，不改需求业务行、不执行正式验收） |
| 2026-09-08 | 第二轮验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`（纯文档草案，**不自动批准、不实现、不执行验收**）：项目负责人对第一轮实现 R1（提交 `5933ec2...`）对应预览页人工检查结论 `CHANGES_REQUIRED`，四类已确认调整范围（表格铺满结果卡片、探针端列展示简化、源库列展示简化、探针端查询下拉长度与截断）。本文件定向修订 `DSS-REQ-022/024`（候选展示截断与控件/面板宽度边界，候选来源与过滤语义不变）、`DSS-REQ-028`（探针端列 Tooltip 仅 `CLIENT_DESC`、无黄色图标、非启用红字“停用”、缺失静默）、`DSS-REQ-029`（源库列 ORG/原始 ID 回退、无黄色图标、Tooltip 无异常说明）、`DSS-REQ-041~045`（关联异常改为缺失静默＋仅探针非启用红字“停用”，不再使用黄色图标或 Tooltip 异常说明）、`DSS-REQ-069`（七列固定→五固定＋两弹性＋表格铺满，取消固定 `width:1145px`）、`DSS-REQ-070`（Tooltip 覆盖范围删除已取消的关联异常图标说明）；新增 `DSS-REQ-072~075` 共 4 条（表格铺满/五固定两弹性/窄屏滚动 `DSS-REQ-072`、探针端列 `DSS-REQ-073`、源库列 `DSS-REQ-074`、探针下拉 ID/描述各 20 字符截断与控件/面板宽度 `DSS-REQ-075`）于新 §21.2；修订说明见 §21.3。计数：需求 `DSS-REQ-001~075` 共 75（072-075 为第二轮草案新增）、验收随 `ACCEPTANCE.md` 更新为 `DSS-AC-001~086` 共 86 条全部 `NOT_RUN`（草案新增 `DSS-AC-081~086` 见 `ACCEPTANCE.md` §4.19）。状态迁移（草案范围）：`REQUIREMENTS.md`/`ACCEPTANCE.md` 与 `DESIGN.md`/`UI.md` 当前第二轮调整版本为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`、`pending_user_review=YES`、`pending_user_confirmation_count=0`；第一轮批准并实现完成版本保留为历史，批准旧版本**不自动批准**第二轮草案。`API.md`/`DATABASE.md` 本轮不改接口/编号/业务内容，整文件零差异。下一入口为 ChatGPT 对本第二轮 UI 调整草案的独立正式复审（不是直接实现） | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002（项目负责人人工页面检查 `CHANGES_REQUIRED` 驱动的第二轮验收前纯文档调整草案；已批准/已实现的第一轮版本作为历史保留，本轮草案未批准、第二轮调整未实现、验收未执行） |
| 2026-09-08 | 本轮第二轮 UI 调整 R2/R3 纠正版重新批准收口（纯文档重新批准收口任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`；本任务只更新批准状态、批准记录、文档导航和下一入口，不修改任何需求/验收/设计/UI 业务内容、不实现代码、不执行验收）：批准收口后 ChatGPT 在准备第二轮实现任务时发现旧批准内容误记“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”、与项目负责人真实要求冲突，遂暂停实现并再次确认——源库列主内容正常显示 `DATA_SOURCE_ORG`、ORG 为空或配置缺失时回退原始 `DATA_SOURCE_ID`，正常行和回退行 Tooltip 均只显示完整原始 `DATA_SOURCE_ID`；R2 极小纠正提交 `e38cfaa...`（`...-002-R2`）原位纠正该唯一业务语义并把当前版本重新置回草案复审；R3 纯文档记录纠正提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`（`...-002-R3`）修正 R2 验收差异声明与未来实现基准锚点、不改变任何业务行；ChatGPT 对本 R3 结果提交独立正式复审结论 `APPROVED`，项目负责人随后明确回复“批准”；`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md` 当前第二轮 R2/R3 纠正版由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 收口为 `APPROVED`（当前正式重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，重新批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`，重新批准日期 2026-09-08）；业务零变化——需求 `DSS-REQ-001~075` 仍 75 条、验收 `DSS-AC-001~086` 仍 86 条全部 `NOT_RUN`、§5 需求—验收追踪矩阵零差异、DESIGN/UI 业务内容与追踪矩阵零差异、`API.md`/`DATABASE.md`/第二轮初版报告/R1 报告/历史批准收口报告/R2 报告/R3 报告整文件零差异；原批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002` 与内容提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 仅作为 R2 纠正前历史批准事实保留，不得继续作为当前批准内容或未来实现业务基准；实现状态保持 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=NO`、`pending_user_confirmation_count=0`；批准的是本轮第二轮 UI 调整需求/验收/设计/UI 基线，不代表第二轮调整已实现、现有页面已通过第二轮人工视觉检查、正式验收或人工视觉验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`；下一入口为另立第二轮 UI 调整实现任务，严格以重新批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273` 为业务基准 | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1（ChatGPT 对 R3 结果提交独立正式复审 `APPROVED` 与项目负责人明确回复“批准”驱动的第二轮 R2/R3 纠正版纯文档重新批准收口；未实现第二轮调整、未执行验收、未把页面标记为人工接受） |
| 2026-09-08 | R1 极小定向修订（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R1`，纯文档、未批准/未实现/未验收）：ChatGPT 对第二轮草案初版提交 `0889cec1a67b6e0be654f6cb1f771b71df19677d` 独立正式复审结论 `CHANGES_REQUIRED`（初版提交范围、75 条需求、86 条验收与第二轮四项核心调整均通过，仅残留冲突与实现落点描述需定向修订）。本文件仅原位修订 `DSS-REQ-067`——删除初版末句中已与第二轮规则冲突的旧句，明确行内展示统一遵循 `DSS-REQ-028/029/045/073/074` 的第二轮现行规则（除探针端关联配置 `FG_ACTIVE!='1'` 时在 `CLIENT_ID` 后显示红色普通文字“停用”外，不显示关联异常图标/异常文字/异常 Tooltip；源库缺失、停用或类别非 `SOURCE` 不产生行内异常提示；未知快照状态标签及原始状态值 Tooltip 不受影响；头部 `unknownCount` 统计语义不变）；该行是 R1 唯一允许改变的需求业务行，`DSS-REQ-001~066`、`DSS-REQ-068~075` 共 74 条业务行逐字节零差异，不新增任何新需求编号，需求保持 75 条；`ACCEPTANCE.md`（86 条全部 `NOT_RUN`）与追踪矩阵整文件零差异；`API.md`/`DATABASE.md` 整文件零差异。状态不变：`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`human_visual_review_status=CHANGES_REQUIRED`、`pending_user_review=YES`、`pending_user_confirmation_count=0`。下一入口为 ChatGPT 对 R1 结果提交独立正式复审（不是直接实现） | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R1（ChatGPT 对第二轮草案初版独立正式复审 `CHANGES_REQUIRED` 驱动的纯文档极小定向修订；草案未批准、第二轮调整未实现、验收未执行） |
| 2026-09-08 | 本轮（第二轮）UI 调整版本批准收口：ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审结论 `APPROVED`，项目负责人随后明确回复“批准”；`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md` 当前第二轮调整版本由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`，2026-09-08）；业务零变化——需求 `DSS-REQ-001~075` 仍 75 条（含 R1 修订后的 `DSS-REQ-067`）、验收 `DSS-AC-001~086` 仍 86 条全部 `NOT_RUN`、需求—验收追踪矩阵零差异、DESIGN/UI 业务内容与追踪矩阵零差异、`API.md`/`DATABASE.md`/第二轮初版报告 `...-002.md`/R1 报告 `...-002-R1.md` 整文件零差异；实现状态保持 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=NO`、`pending_user_confirmation_count=0`；批准的是本轮第二轮 UI 调整需求/验收/设计基线，不代表本轮调整已实现、正式验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`；下一入口为另立第二轮 UI 调整实现任务（严格基于批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 实现） | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002（项目负责人明确批准＋ChatGPT 对 R1 结果独立正式复审 `APPROVED` 驱动的纯文档批准收口；未实现、未执行验收） |
| 2026-09-08 | 第二轮 R2 极小纠正（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2`，纯文档纠正，未批准/未实现/未验收）：批准收口（`...-APPROVAL-002`，2026-09-08，批准内容基准 `5da9b17c1a720f89482eeda1436ad633145fe9fa`）后，ChatGPT 在准备第二轮实现任务时发现批准版本把“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”记录为现行规则，与项目负责人此前及再次确认的真实需求冲突并暂停；项目负责人再次确认源库列主内容正常显示 `DATA_SOURCE_ORG`（ORG 为空/配置缺失回退原始 `DATA_SOURCE_ID`），悬停 Tooltip 均只显示完整原始 `DATA_SOURCE_ID`。本文件仅原位修订该唯一业务语义（`DSS-REQ-029/070/074` 及 §21.1/§21.3 相关记录）；其余 `DSS-REQ-*` 业务行逐字节零差异，需求保持 75 条，不新增任何需求编号；`ACCEPTANCE.md` 仅原位纠正 `DSS-AC-027/075/076/077/083/086` 六条验收业务行中的源库 Tooltip 内容，其余 80 条验收业务行逐字节零差异、86 条验收仍全部 `NOT_RUN`、需求—验收追踪矩阵零差异；`API.md`/`DATABASE.md`/第二轮初版报告/R1 报告/批准收口报告/第一轮全部报告证据整文件零差异。状态翻转：四文档当前第二轮版本由 `APPROVED` 重新置为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`human_visual_review_status=CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=YES`、`pending_user_confirmation_count=0`。下一入口为 ChatGPT 对本 R2 结果提交独立正式复审（不是直接实现） | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2（ChatGPT 发现批准内容与负责人真实 Tooltip 需求冲突并暂停、项目负责人再次确认“显示源库ID”驱动的纯文档极小纠正；当前版本重新进入复审、第二轮调整未实现、验收未执行） |
| 2026-09-08 | 本文件追加 R3 文档级记录纠正（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R3`，2026-09-08，纯文档、未批准/第二轮调整未实现/未验收）：ChatGPT 对 R2 结果提交独立正式复审结论 `CHANGES_REQUIRED`（确认 R2 核心业务纠正正确，仅两类文档审计记录错误需纠正）。本 R3 只原位纠正本 §25 上一条 R2 变更记录对 `ACCEPTANCE.md` 的错误零差异声明——R2 实际原位纠正 `DSS-AC-027/075/076/077/083/086` 六条验收业务行中的源库 Tooltip 内容，其余 80 条验收业务行逐字节零差异、86 条验收仍全部 `NOT_RUN`、需求—验收追踪矩阵零差异；并把 Feature README 与 R2 报告现行未来第二轮实现依据由 R2 纠正前的历史批准内容基准 `5da9b17c...` 改为“重新批准并完成批准收口后记录的、包含 R2 Tooltip 纠正的最新批准内容基准提交”。本 R3 不修改任何 `DSS-REQ-001~075` 需求业务行、不修改追踪矩阵，需求 75 条、验收 86 条全部 `NOT_RUN`；状态不变（见 §1/§24）：四文档当前第二轮版本 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行与人工页面验收 `NOT_RUN`、`human_visual_review_status=CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=YES`、`pending_user_confirmation_count=0`。下一入口为 ChatGPT 对本 R3 结果提交独立正式复审（不是直接实现） | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R3（ChatGPT 对 R2 结果提交独立正式复审 `CHANGES_REQUIRED` 驱动的纯文档记录纠正；只纠正审计描述与未来实现锚点，不修改任何业务行，草案未批准、第二轮调整未实现、验收未执行） |
| 2026-09-10 | 隔离视觉原型 R2～R7 最终视觉方案**设计固化**（`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001`，纯文档固化任务，**不修改任何业务代码、不把 prototype 代码应用到 5173、不创建通用查询列表页基线**）：把 `5174` 隔离视觉 prototype 中 R2～R7 已完成项目负责人人工目测（评价“视觉原型已经相当 OK”）的最终视觉方案固化进本 Feature 文档体系，为下一阶段 `5173` 正式实现提供唯一、可追踪依据。本文件新增 §21.4 独立需求 `DSS-REQ-076~083` 共 8 条（§21.4：页面结构与背景层级 `076`、查询区视觉 `077`、结果头部与刷新区视觉 `078`、最小列宽模型 `70/170/285/140/170/170/170=1175` `079`、三时间列水平内边距 `12→8` 与 `49px` 行高 `080`、自动刷新倒计时只读可视化投影 `081`、行内展示与状态视觉 `082`、响应式视口口径与既有交互状态机 `083`）与 §21.5 定向取代/纠正说明（对 `DSS-REQ-066②`/`069`/`072`/`050`/`068`/`045` 等既有行做展示/呈现层面的新口径取代，并**明确撤回**曾误写的“`1280` 下所有查询条件和查询/重置必须同处一行”——该错误前提只存在于 R7 任务提示词、从未写入本 Feature 正式文档，不得继续作为缺陷/阻塞项/验收条件）。计数：需求 `DSS-REQ-001~083` 共 **83** 条（076~083 为本次固化新增）；验收随 `ACCEPTANCE.md` 更新为 `DSS-AC-001~095` 共 **95** 条、全部 `NOT_RUN`（新增 `DSS-AC-087~095` 见 `ACCEPTANCE.md` §4.20）。状态（三态分离）：R2～R7 prototype 视觉方向 `APPROVED_BY_PROJECT_OWNER`；本次更新后的固化文档内容 `DRAFT_PENDING_USER_REVIEW`；`5173` 正式实现 `PENDING_FORMAL_IMPLEMENTATION`、正式验收 `NOT_RUN`；文档总体状态 `PROTOTYPE_VISUALLY_APPROVED_PENDING_DOCUMENT_REVIEW_AND_FORMAL_IMPLEMENTATION`；通用 `QUERY-LIST-PAGE-UI-PATTERN` 基线 `NOT_CREATED_BY_DESIGN`（须待本页 5173 正式实现并验收后再提炼）。`API.md`/`DATABASE.md` 本轮**整文件零差异**（R2～R7 为纯前端视觉/交互呈现调整，本轮无 API、数据库变更）；`frontend/`/`backend/`/SQL 业务代码零改动。下一入口为项目负责人从 Git 读取并复审本固化文档，复审通过后再另立 `5173` 正式实现任务（`PENDING_FORMAL_IMPLEMENTATION_ON_5173`） | DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001（把已获项目负责人人工认可的 R2～R7 隔离视觉 prototype 最终视觉方案固化进需求/验收/设计/UI 文档，并区分 prototype 认可、固化文档待复审与 5173 正式实现未执行三种状态；纯文档固化，未批准为正式实现依据、未实现 5173、未执行正式验收） |

| 2026-09-10 | R1 极小定向修订（`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001-R1`，纯文档修订，**未批准/未实现 5173/未执行验收**）：ChatGPT 对固化任务结果提交 `899803491427a6a7e6b6295f43ef49a11ed56037` 正式复审结论 `CHANGES_REQUIRED` 驱动的两处极小定向修订。**R1-01**：把 `DSS-REQ-082②` 中歧义的“源库 Tooltip 展示完整值”改写为明确、无歧义、独立可读的口径——源库列主内容优先 `ORG`、`ORG` 为空/空白/配置缺失时回退原始 `DATA_SOURCE_ID`（判定逻辑与 `DSS-REQ-074` 一致、不变），**无论主内容当前显示 ORG 还是回退 ID，源库 Tooltip 始终只显示完整原始 `DATA_SOURCE_ID`**，**不显示 ORG、不拼接 `ORG＋DATA_SOURCE_ID`、不追加“配置缺失/配置停用/类别非 SOURCE”等异常说明**，内容源直接取自行记录的原始 `sourceId`/`DATA_SOURCE_ID`、**不得**从 `sourceRef.org` 或展示文本反推（与 `DSS-REQ-074`/`DSS-REQ-070` 口径一致）；探针端 `CLIENT_ID` 主内容与完整非空 `CLIENT_DESC` Tooltip 规则、源库判定逻辑、页面级单实例 Tooltip、以及所有状态/颜色/列宽/刷新/倒计时/响应式/交互规则**均不变**。**R1-02**：同步 `API.md`/`DATABASE.md` §1 当前状态元数据（65/68 → 83/95、95 条全部 `NOT_RUN`、分层实现状态、R2～R7 待 `5173` 正式实现），接口/数据库业务契约**零变化**（详见各文件相应记录）。编号与计数**零变化**：需求 `DSS-REQ-001~083` 仍 83 条、验收 `DSS-AC-001~095` 仍 95 条全部 `NOT_RUN`；本 §24 与追踪矩阵不变（DESIGN §14.2 83/83、§14.3 95/95）。状态不变：R2～R7 prototype 视觉方向 `APPROVED_BY_PROJECT_OWNER`、本轮文档 `DRAFT_PENDING_USER_REVIEW`（**不得**标记 `APPROVED`）、`5173` 正式实现 `PENDING_FORMAL_IMPLEMENTATION`、正式验收 `NOT_RUN`。下一入口为 ChatGPT 从 Git 重新复审（`CHATGPT_REVIEW_FROM_GIT_THEN_USER_APPROVAL`）后由项目负责人批准 | DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001-R1（ChatGPT 正式复审 `CHANGES_REQUIRED` 驱动的纯文档极小定向修订：消除源库 Tooltip“完整值”歧义并同步 API/DATABASE 当前元数据；未批准、未实现 5173、未执行验收） |
| 2026-09-10 | 隔离视觉原型 R2～R7 设计固化批准收口（`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001`，纯文档批准收口任务；只更新批准状态、批准记录、导航和下一入口，不修改任何需求/验收/设计/UI 业务内容、不实现代码、不执行验收）：ChatGPT 已从 Git 对批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a` 完成最终复审 `APPROVED`，项目负责人于 2026-09-10 明确回复“批准”。据此 `REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md`/`API.md`/`DATABASE.md` 及 Feature README 中 R2～R7 固化内容**当前状态**由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`（批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001`，批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a`，批准日期 2026-09-10）；`DSS-REQ-001~083` 共 **83 条**全部纳入当前批准需求基线、`DSS-AC-001~095` 共 **95 条**全部纳入当前批准验收基线且全部保持 `NOT_RUN`。**业务零变化**：`DSS-REQ-076~083` 需求文字与 `DSS-AC-087~095` 验收业务行逐字节不变、需求—验收追踪矩阵（83/83、95/95）零差异、`API.md`/`DATABASE.md` 契约与映射表零差异。状态（三态分离且更新为收口后）：R2～R7 prototype 视觉方向 `APPROVED_BY_PROJECT_OWNER`；R2～R7 固化文档 `APPROVED`；`5173` 对 R2～R7 的正式实现 `PENDING_FORMAL_IMPLEMENTATION_ON_5173`；正式验收执行与 `5173` 人工视觉验收 `NOT_RUN`；`pending_user_review=NO`、`pending_user_confirmation_count=0`。**批准不代表 R2～R7 已应用到 `5173`、正式实现已完成或正式验收已执行/通过，不等于 `IMPLEMENTED_ACCEPTED`**；下一入口为独立正式实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001` | DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001（ChatGPT 从 Git 对批准内容基准 `e67b2ec...` 最终复审 `APPROVED` ＋项目负责人 2026-09-10 明确回复“批准”驱动的纯文档批准收口；未实现 5173、未执行正式验收） |

| 2026-09-10 | 查询控件交互调整**纯文档草案**建立（`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001`，**只建立文档草案，不修改代码、不批准草案、不执行正式验收**）：项目负责人对已应用到 `5173` 正式前端的 R2～R7 视觉方案（原正式实现提交 `3ec9cbf6487eacff004212fb3aca3064c3bd18cc`，ChatGPT 已从远程 Git 完成代码复审判定 `APPROVED`）进行人工页面检查，认为整体视觉基本可接受，但实际操作查询控件后发现**一组互相关联的交互问题**，故当前不能进入正式验收（`project_owner_visual_review_status=CHANGES_REQUIRED`）。本文件新增 §21.6 独立草案需求 `DSS-REQ-084~086` 共 3 条（查询下拉框在各种选中/取消/重置状态下保持固定外部几何 `084`；`CLIENT_ID`/`CLIENT_DESC`/`DATA_SOURCE_ORG`/`DATA_SOURCE_ID` 四字段分别按 20 Unicode code point 字段级截断、完整 ID/value 与查询语义不变 `085`；超过 20 code point 的 `CLIENT_DESC` 通过单实例安全 Tooltip 显示完整原始描述 `086`）与 §21.7 定向取代/扩展说明（对 `DSS-REQ-075` 探针下拉按字段截断口径做四字段扩展、对 `DSS-REQ-022/024` 候选截断与控件宽度口径做定向取代，`DSS-REQ-028`/`070` 表格 Tooltip 与单实例机制保持不变）。计数：既有已批准需求 `DSS-REQ-001~083` 共 **83** 条业务行逐字节零差异；本轮草案新增 3 条后当前编号合计 `DSS-REQ-001~086` 共 **86** 条；验收随 `ACCEPTANCE.md` 新增 `DSS-AC-096~103` 共 8 条后合计 `DSS-AC-001~103` 共 **103** 条、全部 `NOT_RUN`（`acceptance_not_run_count=103`）。状态（分层且不倒退）：既有 R2～R7 设计固化批准（`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001`，批准内容基准 `e67b2ecc3897c3e83597126e259ee4c19349a66a`）、`5173` 正式实现事实（`formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`）与 ChatGPT 代码复审 `APPROVED`（`formal_5173_code_review_status=APPROVED`）**全部保留**；本轮草案 `query_control_interaction_adjustment_status=DRAFT_PENDING_USER_REVIEW`、`query_control_interaction_adjustment_implementation_status=PENDING_APPROVAL_AND_IMPLEMENTATION`、`formal_acceptance_status=NOT_RUN`、`pending_user_review=YES`、`pending_user_confirmation_count=0`。三层统一方案：字段级截断保证查询紧凑、控件外部几何固定保证几何稳定、`CLIENT_DESC` 完整 Tooltip 保留完整描述读取能力，三者属同一套方案、不可拆分。`API.md`/`DATABASE.md` **整文件零差异**（本轮无 API、数据库、SQL 或只读边界变更），请求与状态机保持不变；`frontend/`/`backend/` 零改动。下一入口只能是 `CHATGPT_BASELINE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_APPROVAL` | DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001（项目负责人 `5173` 人工页面检查 `CHANGES_REQUIRED` ＋已批准 R2～R7 基线驱动的纯文档调整草案；既有设计批准与正式实现事实保留，本轮草案未批准、未实现、验收未执行） |
| 2026-09-10 | 查询控件交互调整**基线批准收口**（`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001`，纯文档批准收口任务；只更新批准状态、批准记录、导航和下一入口，不修改任何需求/验收/设计/UI 业务内容、不实现代码、不执行验收）：ChatGPT 已从远程 Git 对批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4` 完成最终复审 `APPROVED`（R0→R1→R2→R3 纠正链之后的最终批准内容基准），项目负责人于 2026-09-10 明确回复“批准”。据此把 §21.6 新增 `DSS-REQ-084~086` 从草案状态纳入当前批准需求基线、`ACCEPTANCE.md` §4.21 新增 `DSS-AC-096~103` 纳入当前批准验收基线并保持全部 `NOT_RUN`；批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001`、批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`、批准日期 2026-09-10。**业务零变化**：`DSS-REQ-001~086` 共 86 条业务行、`DSS-AC-001~103` 共 103 条业务行逐字节不变，追踪 86/86、103/103，`API.md`/`DATABASE.md` 契约与映射表零差异。状态（分层且不倒退）：既有 R2～R7 设计固化批准与 `5173` 正式实现事实保留；本轮调整 `query_control_interaction_adjustment_status=APPROVED`、`query_control_interaction_adjustment_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`（尚未应用到 `5173`）、`formal_5173_code_review_status=APPROVED`、`project_owner_visual_review_status=CHANGES_REQUIRED`、`formal_acceptance_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`、`acceptance_not_run_count=103`、`pending_user_review=NO`、`pending_user_confirmation_count=0`。**批准不代表本轮调整已实现、正式验收或正式人工视觉验收已执行/通过，不等于 `IMPLEMENTED_ACCEPTED`**；下一入口为独立正式实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001` | DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001（ChatGPT 对批准内容基准 `cf9f9eb...` 最终复审 `APPROVED` ＋项目负责人 2026-09-10 明确回复“批准”驱动的纯文档批准收口；未实现本轮调整、未执行正式验收） |

> 关联文档：验收草案 `docs/features/data-source-snapshot-status/ACCEPTANCE.md`；功能入口与状态 `docs/features/data-source-snapshot-status/README.md`；Feature 总索引 `docs/features/README.md`。
