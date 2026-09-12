# 源库快照状态 Feature 界面设计草案（UI）

## 1. 元数据、文档状态与界面基调

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态 |
| Feature 标识 | `data-source-snapshot-status` |
| 所属模块 | 运行监控 |
| 既有路由 | `/monitor/data-source-state`（保持既有值不变，UI §10） |
| 前端源码目录 | `frontend/src/views/data-source-run-state/`（保留既有目录名，UI §10） |
| 目标文档 | `docs/features/data-source-snapshot-status/UI.md`（界面设计草案） |
| 配套设计文档 | `DESIGN.md`（总设计入口）、`API.md`（接口设计草案）、`DATABASE.md`（数据库查询设计草案） |
| 文档状态 | `APPROVED`（当前版为 2026-09-08 第二轮 UI 调整 R2/R3 纠正后重新批准收口版，重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，重新批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`，重新批准日期 2026-09-08，见本文件 §17/§18；R2 极小纠正 `...-002-R2` 把批准内容误记的“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”纠正为“悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（正常行与回退行同源）”并重新进入复审，R3 记录纠正 `...-002-R3`（提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`）只修正 R2 变更记录的审计描述与未来实现锚点、不改变业务行，ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED`、项目负责人明确回复“批准”，当前第二轮版本重新批准收口为 `APPROVED`。历史批准过程：第二轮版本曾由 ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审 `APPROVED`、项目负责人随后明确回复“批准”，正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`（批准日期 2026-09-08，批准内容基准提交 `5da9b17...`），本第二轮调整版本状态由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 收口为 `APPROVED`，该批准作为历史批准事实保留；批准收口后发现批准内容把“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”误记为现行规则，与项目负责人真实需求冲突（ChatGPT 在准备第二轮实现任务时发现该冲突并暂停、项目负责人再次确认源库列悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`），故本 R2 纯文档纠正该唯一业务语义并重新进入复审，经 R3 记录纠正（`...-002-R3`，提交 `cf40b5d...`）后 ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED`、项目负责人明确回复“批准”，于 2026-09-08 重新批准收口为 `APPROVED`（当前重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`）。驱动：项目负责人对第一轮 UI 调整实现 R1（提交 `5933ec2...`）对应预览页人工检查结论 `CHANGES_REQUIRED`（human_visual_review_status=CHANGES_REQUIRED，第一轮页面人工检查历史）。第一轮 UI 调整批准版本（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07；实现 R1 提交 `5933ec2...` 经 ChatGPT 独立代码与证据复审 `APPROVED`、实现状态收口为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`）保留为历史。本轮只围绕四类已确认调整范围（表格铺满结果卡片、探针端列展示简化、源库列展示简化、探针端查询下拉框长度与文本截断，见本文件 §16 与 DESIGN §22）定向修订既有界面规则；本轮不改接口、SQL、表结构、数据库访问与产品只读边界（API.md/DATABASE.md 整文件零差异）。R2 只纠正本轮 UI 调整界面设计中“正常源库行 Tooltip 显示完整 ORG”为“悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（正常行与回退行同源）”这一唯一业务语义；本轮重新批准收口只代表本轮 UI 调整需求/验收/设计基线获批，不代表本轮调整已实现、正式验收或人工视觉验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`；`pending_user_review=NO`、`pending_user_confirmation_count=0`（本轮无待人工决策项），见本表“本轮（第二轮 UI 调整版本）重新正式批准版本”“本轮（第二轮 UI 调整版本）重新批准内容基准”“本轮（第二轮 UI 调整版本）重新批准链”“本轮（第二轮 UI 调整版本）重新批准日期”“本版（第二轮 R3 记录纠正）任务编号/授权基线”、§1 版本说明与本文件 §16/§17/§18） |
| requirements_status | `APPROVED`（当前第二轮 UI 调整版本经 R2 极小纠正、R3 记录纠正后重新批准收口为 `APPROVED`：曾于 2026-09-08 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`，作为历史批准事实保留），因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`、与负责人真实需求（悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`）冲突，R2 纠正后重新进入复审、R3 记录纠正（`...-002-R3`，提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`）后 ChatGPT 独立正式复审 `APPROVED`、项目负责人明确回复“批准”，重新批准收口为 `APPROVED`（当前重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d...`，2026-09-08）；`DSS-REQ-001~075` 共 75 条，见 `REQUIREMENTS.md`；隔离视觉原型 R2～R7 设计固化新增 `DSS-REQ-076~083`（累计 `DSS-REQ-001~083` 共 83 条，见 REQUIREMENTS §21.4/§24 与本文件 §19）——设计固化内容已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001`（2026-09-10，批准内容基准提交 `e67b2ecc...`）批准收口为 `APPROVED`；第一轮 UI 调整批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`（批准内容基准提交 `5757237...`，2026-09-07）保留为历史） |
| acceptance_status | `APPROVED`（当前第二轮 UI 调整版本经 R2 极小纠正、R3 记录纠正后重新批准收口为 `APPROVED`，同本表 requirements_status（重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d...`，2026-09-08）；`DSS-AC-001~086` 共 86 条全部 `NOT_RUN`，见 `ACCEPTANCE.md`；隔离视觉原型 R2～R7 设计固化新增 `DSS-AC-087~095`（累计 `DSS-AC-001~095` 共 95 条、全部 `NOT_RUN`，见 ACCEPTANCE §4.20/§6 与本文件 §19）——设计固化内容已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001`（2026-09-10，批准内容基准提交 `e67b2ecc...`）批准收口为 `APPROVED`；第一轮批准版本保留为历史；上述 `DSS-AC-001~095` 全部 `NOT_RUN` 为 2026-09-12 正式验收执行前的历史值，当前 `DSS-AC-001~107` 共 107 条已由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` 执行，结果 `PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0`，唯一 `BLOCKED` 为 `DSS-AC-065`，见 `ACCEPTANCE.md` 与本文件 §21 末条同步记录） |
| design_status | `DESIGN.md`/`UI.md` 当前第二轮调整版本经 R2 极小纠正、R3 记录纠正后重新批准收口为 `APPROVED`（重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d...`，2026-09-08；曾随批准收口为 `APPROVED`：正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，2026-09-08，作为历史批准事实；R2 纠正源库 Tooltip 内容、R3 记录纠正后重新进入复审并重新批准收口，见本文件 §16/§17/§18 与 DESIGN §22/§23/§24）；`API.md`/`DATABASE.md` 保持已批准（`APPROVED`）且本轮**整文件零差异**（本轮不改接口、SQL、表结构、数据库访问与产品只读边界） |
| implementation_status | 分层记录（当前事实，与 Feature README/`API.md`/`DATABASE.md` 一致）：① 初始只读全栈实现已存在（`DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001`/`-R1`，已实现本界面设计，提交 `37825272c25c8a2d8a595ff0d5c25c6349186663`）；② 第二轮 UI 调整 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-002` 已进入 `5173`，实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`；③ R2～R7 新视觉方案已经由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001`（2026-09-10）应用到 `5173` 正式前端并完成开发自测（`browser_verification_status=DEV_SELF_TEST_DONE`），原正式实现结果提交为 `3ec9cbf6487eacff004212fb3aca3064c3bd18cc`，当前实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`；ChatGPT 已从 Git 独立完成本次正式实现代码复审且代码结论为 `APPROVED`（`formal_5173_code_review_status=APPROVED`），项目负责人已完成人工页面检查，历史结论为 `CHANGES_REQUIRED`（`project_owner_visual_review_status=CHANGES_REQUIRED`，历史驱动事实，已由查询控件交互调整与查询下拉固定宽度调整解决，2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 收口，当前 `project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER`）；正式验收已于 2026-09-12 由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` 执行、并由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1` 完成 `DSS-AC-065` 定向补验后收口（`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`、`acceptance_execution_status=PASS`，`DSS-AC-001~107` 共 107 条 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`；R0 初始为 `PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0`，唯一 `BLOCKED` 为 `DSS-AC-065`，已由 R1 补验通过；2026-09-12 前历史值为 `formal_acceptance_status=NOT_RUN`、107 条全部 `NOT_RUN`），正式人工视觉验收仍为 `NOT_RUN`（`human_visual_acceptance_status=NOT_RUN`），不得表述为 `IMPLEMENTED_ACCEPTED`、`FORMALLY_ACCEPTED` 或正式验收通过。本行过期当前事实（此前把第二轮 UI 调整记为未实现状态）已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001-R1`（2026-09-10）按现行分层口径修正；该过期状态属批准内容基准 `e67b2ecc3897c3e83597126e259ee4c19349a66a` 中已存在的旧状态（非批准收口提交新引入的业务变化）；第二轮重新批准链与第一轮实现历史见本文件 §14/§15/§17/§18 与 §1 版本说明。该修正只对齐文档状态口径，不改变任何业务内容。历史：第二轮版本经 R2 极小纠正/R3 记录纠正后于 2026-09-08 经 ChatGPT 独立正式复审 `APPROVED`、项目负责人明确回复“批准”重新批准收口（重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d...`），其后由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-002`（2026-09-08）落地进入 `5173`。第一轮 UI 调整已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`（2026-09-07）按批准内容基准提交 `5757237...` 落地、实现 R1 提交 `5933ec2...` 经 ChatGPT 独立代码与证据复审 `APPROVED`、实现状态收口为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（见本文件 §15），作为历史保留；不代表代码复审通过、不代表正式验收或人工验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`） |
| acceptance_execution_status | `PASS`（acceptance_execution_status=`PASS`、formal_acceptance_status=`EXECUTED_PENDING_CHATGPT_REVIEW`；正式验收已于 2026-09-12 由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` 对 `DSS-AC-001~107` 共 107 条执行、并由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1`（2026-09-12）经项目负责人明确批准阶段 A `INSERT`/`DELETE` 完成 `DSS-AC-065` 定向补验，最终结果 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`（R0 初始结果 `PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0`，唯一 `BLOCKED` 为 `DSS-AC-065`（受控测试数据 DML 授权在本 R0 任务 §6.2 未获批准、无充分替代证据），已由 R1 补验通过），见 `ACCEPTANCE.md`；`formal_acceptance_pass_count=107`、`formal_acceptance_blocked_count=0`、`formal_acceptance_not_run_count=0`。2026-09-12 执行前历史值：acceptance_execution_status=NOT_RUN、`DSS-AC-001~086` 共 86 条全部 `NOT_RUN`（acceptance_not_run_count=86）、扩项后累计 95 条全部 `NOT_RUN`（acceptance_not_run_count=95），`5173` 正式验收当时仍 `NOT_RUN`。正式验收已执行不等于最终接受，须由 ChatGPT 从 Git 复核后由项目负责人作正式人工验收决定） |
| pending_user_confirmation_count | `0`（本轮第二轮调整无必须由项目负责人补充决策的待确认项） |
| pending_user_review | `NO`（当前第二轮 UI 调整版本经 R2 极小纠正、R3 记录纠正后已重新批准收口，pending_user_review=NO；本轮无待人工决策项、`pending_user_confirmation_count=0`。第二轮版本曾收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，2026-09-08，作为历史批准事实），R2 因批准内容误记源库 Tooltip 内容而纠正并恢复 pending_user_review=YES，R3 记录纠正后经 ChatGPT 独立正式复审 `APPROVED` 与项目负责人明确回复“批准”重新批准收口为 `NO`（重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d...`，2026-09-08）；`pending_user_review=NO` 不等于本轮调整已实现、代码复审已通过、正式验收已执行或通过，更不等于 `IMPLEMENTED_ACCEPTED`；第一轮 UI 调整版本的 `pending_user_review=NO` 已收口，作为历史） |
| 设计任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001`（纯文档设计草案建立；历史） |
| 第一轮（UI 调整版本）正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`（第一轮 UI 调整需求/验收/设计批准收口；项目负责人明确“批准”驱动，见 §14） |
| 第一轮（UI 调整版本）批准链 | R0 验收前 UI 调整草案提交 `dc1d5285a541dd799521a778e5d00996ea0b4222` → ChatGPT 正式复审 `CHANGES_REQUIRED`（唯一问题：`auto`/`restore` 刷新在途时“立即刷新”按钮 loading 语义不明确）→ 项目负责人确认 `initial/retry/query/manual/auto/restore` 六类请求唯一视觉映射 → R1 极小定向修订提交 `575723711ca39d7761df308c1c99b1e6e957cf70` → ChatGPT 对 R1 结果独立正式复审 `APPROVED` → 项目负责人明确回复“批准” |
| 第一轮（UI 调整版本）批准依据提交 | `575723711ca39d7761df308c1c99b1e6e957cf70`（ChatGPT 对 UI 调整 R1 结果独立正式复审 `APPROVED` 的 R1 结果提交；该批准收口以该提交为批准内容基准） |
| 第一轮（UI 调整版本）批准日期 | 2026-09-07 |
| 第一轮（UI 调整草案）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`（验收前 UI 调整草案建立；ChatGPT 对实现 R1 提交 `37825272c25c8a2d8a595ff0d5c25c6349186663` 代码复审 `CHANGES_REQUIRED` 后，项目负责人提出更完整的 UI 调整，该轮在已批准界面设计基线之上建立**纯文档调整草案**，本文件规则落点见 §13；该草案后于 2026-09-07 经批准收口并实现，见 §14/§15；历史） |
| 第一轮（UI 调整草案）授权基线提交 | `37825272c25c8a2d8a595ff0d5c25c6349186663`（该轮开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；历史） |
| 本轮（第二轮 UI 调整草案）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`（第二轮验收前 UI 调整草案建立；项目负责人对第一轮 UI 调整实现 R1 对应预览页人工检查结论 `CHANGES_REQUIRED` 驱动；**纯文档草案**，未批准、第二轮调整未实现、正式验收未执行，本文件规则落点见 §16；该草案及其 R1 极小定向修订（`...-002-R1`）批准收口为 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`（见 §17，作为历史批准事实保留），因批准内容误记源库 Tooltip 内容，R2 极小纠正 `...-002-R2` 后重新进入复审，R3 记录纠正 `...-002-R3` 后重新批准收口为 `...-APPROVAL-002-R1`（见 §18、§1）） |
| 本轮（第二轮 UI 调整草案）授权基线提交 | `5933ec29dce5f20b3d34aa101de4c8f9a884b93a`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；第一轮 UI 调整实现 R1 结果提交同为此提交） |
| 本轮（第二轮 UI 调整草案）驱动来源 | 项目负责人人工页面检查结论（任务提示词 §4，无待人工决策项）：① 表格必须铺满结果卡片（去除固定 `1145px`，五固定列＋探针端/源库两弹性列）；② 探针端列展示简化（仅原始 `CLIENT_ID`、Tooltip 仅完整 `CLIENT_DESC`、删除黄色图标、非启用红字“停用”、缺失静默）；③ 源库列展示简化（删除黄色图标；表格主内容显示 `DATA_SOURCE_ORG`、ORG 为空/配置缺失时回退原始 `DATA_SOURCE_ID`；悬停 Tooltip 均只显示完整原始 `DATA_SOURCE_ID`，R2 纠正）；④ 探针端查询下拉框长度与文本截断（ID/描述各 20 Unicode 字符＋`...`、控件/面板宽度上限、完整 value 不变） |
| 本轮（第二轮 UI 调整版本）正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`（本轮第二轮 UI 调整需求/验收/设计批准收口；项目负责人明确“批准”驱动，见 §17）；该批准版本作为历史批准事实保留——批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`，与负责人真实需求冲突，已由 R2 `...-002-R2` 纯文档纠正、R3 `...-002-R3` 记录纠正并经 ChatGPT 独立正式复审 `APPROVED`、项目负责人明确回复“批准”后重新批准收口为 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`（批准内容基准提交 `cf40b5d...`，见 §18、§1） |
| 本轮（第二轮 UI 调整版本）批准链 | 项目负责人对第一轮 UI 调整实现 R1（提交 `5933ec2...`）对应预览页人工检查结论 `CHANGES_REQUIRED`（表格铺满、探针端列简化、源库列简化、查询下拉截断四类）→ 第二轮验收前 UI 调整草案初版提交 `0889cec1a67b6e0be654f6cb1f771b71df19677d` → ChatGPT 对初版独立复审 `CHANGES_REQUIRED`（四项核心调整通过，残留冲突见 `DSS-REQ-067`、DESIGN §5.6、UI §8.2/§16.1 与实现职责）→ R1 极小定向修订提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` → ChatGPT 对 R1 结果独立正式复审 `APPROVED` → 项目负责人明确回复“批准” |
| 本轮（第二轮 UI 调整版本）批准依据提交 | `5da9b17c1a720f89482eeda1436ad633145fe9fa`（ChatGPT 对第二轮 UI 调整 R1 结果独立正式复审 `APPROVED` 的 R1 结果提交；本批准收口以该提交为批准内容基准） |
| 本轮（第二轮 UI 调整版本）批准日期 | 2026-09-08 |
| 本版（第二轮 R2 极小纠正）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2`（ChatGPT 在准备第二轮实现任务时发现批准内容把正常源库行 Tooltip 误记为完整 `DATA_SOURCE_ORG`、与负责人真实需求冲突并暂停、项目负责人再次确认“显示源库ID”驱动的纯文档极小纠正；当前版本重新进入复审、第二轮调整未实现、正式验收未执行） |
| 本版（第二轮 R2 极小纠正）授权基线提交 | `ae8756a2f80b0c418a7afd1da4d51c04d7b85e21`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；第二轮批准收口结果提交同为此提交） |
| 本版（第二轮 R3 记录纠正）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R3`（ChatGPT 对 R2 结果提交独立正式复审 `CHANGES_REQUIRED` 驱动的纯文档记录纠正；只修正 R2 变更记录的审计描述与未来实现锚点，不改任何业务行；R3 结果提交 `cf40b5d1e5ef03712011edb5e10c20070b582273` 为当前重新批准内容基准） |
| 本版（第二轮 R3 记录纠正）授权基线提交 | `e38cfaa4c4aed7b8e6a2a27b6df2774a8e8ef167`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；第二轮 R2 纠正结果提交同为此提交） |
| 本轮（第二轮 UI 调整版本）重新正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`（当前正式重新批准版本：第二轮 R2/R3 纠正版需求/验收/设计基线经 ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED` 与项目负责人明确回复“批准”后重新批准收口；原批准版本 `...-APPROVAL-002` 与批准内容提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 仅作为 R2 纠正前的历史批准事实保留，不作为当前批准内容或未来实现业务基准） |
| 本轮（第二轮 UI 调整版本）重新批准内容基准 | `cf40b5d1e5ef03712011edb5e10c20070b582273`（ChatGPT 对 R3 结果独立正式复审 `APPROVED` 并获项目负责人批准的重新批准内容基准；当前第二轮 R2/R3 纠正版即以此提交为业务零变化基准，未来第二轮 UI 调整实现任务也须严格以此提交为业务依据） |
| 本轮（第二轮 UI 调整版本）重新批准链 | R2 极小纠正提交 `e38cfaa4c4aed7b8e6a2a27b6df2774a8e8ef167` → ChatGPT 独立正式复审 `CHANGES_REQUIRED`（两类审计记录错误）→ R3 记录纠正提交 `cf40b5d1e5ef03712011edb5e10c20070b582273` → ChatGPT 对 R3 结果提交独立正式复审 `APPROVED` → 项目负责人明确回复“批准” |
| 本轮（第二轮 UI 调整版本）重新批准日期 | 2026-09-08 |
| 隔离视觉原型设计固化任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001`（2026-09-10 纯文档设计固化任务：把项目负责人认可的隔离视觉原型 R2～R7 最终视觉方案固化为正式界面规则；不实现、不执行验收，见本文件 §19） |
| 隔离视觉原型设计固化授权基线提交 | `4222b0a24b927aca6f62ff348fd8549b73d4156c`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；`5174` 隔离视觉 prototype worktree 亦基于该提交） |
| 隔离视觉原型工作区（5174） | 独立隔离视觉 prototype worktree（如 `/agent/dss-linear-style-prototype-001.*`，detached HEAD，**非正式前端工程**）；R2～R7 视觉方向经项目负责人认可（“视觉原型已经相当 OK”），但**不是** `5173` 正式前端，也不能替代 `5173` 正式实现与正式验收，见本文件 §19、`DESIGN.md` §25 |
| 设计固化文档状态（隔离视觉原型 R2～R7） | `APPROVED`（本任务更新后的 `UI.md` 等固化内容原为 `DRAFT_PENDING_USER_REVIEW`，经 ChatGPT 对批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a` 最终复审 `APPROVED`、项目负责人 2026-09-10 明确回复“批准”，已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001` 收口为 `APPROVED`） |
| 隔离视觉原型 R2～R7 视觉方向状态 | `APPROVED_BY_PROJECT_OWNER`（项目负责人明确认可 R2～R7 最终视觉方向） |
| `5173` 正式实现状态（隔离视觉原型 R2～R7 视觉方案） | `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`（`formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`：R2～R7 视觉方案已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001`（2026-09-10）应用到 `5173` 正式前端并完成开发自测（`browser_verification_status=DEV_SELF_TEST_DONE`）；ChatGPT 已从 Git 完成本次正式实现代码复审，代码结论 `formal_5173_code_review_status=APPROVED`；项目负责人已在 `5173` 人工检查本页并判定 `project_owner_visual_review_status=CHANGES_REQUIRED`（仅针对已确认的查询控件交互问题，不否定页面整体视觉与该代码复审结论；该历史结论已由查询控件交互调整与查询下拉固定宽度调整解决，2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 收口，当前 `project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER`）；正式验收 `NOT_RUN`（`formal_acceptance_status=NOT_RUN`、`formal_acceptance_not_run_count=107`，`DSS-AC-001~107` 共 107 条全部 `NOT_RUN`）；本节界面规则未变） |
| `5173` 正式验收状态（隔离视觉原型 R2～R7 视觉方案） | `NOT_RUN`（`5173` 未做正式验收；`5174` 原型浏览器/测试/构建结果仅作设计验证证据，不得写成正式验收 `PASS`） |
| 文档总体状态（隔离视觉原型 R2～R7 视觉固化） | `PROTOTYPE_DESIGN_APPROVED_AND_IMPLEMENTED_ON_5173_PENDING_FORMAL_ACCEPTANCE`（说明：设计固化已经批准（`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001`，2026-09-10）；R2～R7 视觉方案已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001` 应用到 `5173` 并完成开发自测；ChatGPT 已完成本次正式实现代码复审且代码结论为 `APPROVED`；项目负责人已在 `5173` 人工检查并提出查询控件交互调整（`project_owner_visual_review_status=CHANGES_REQUIRED`），查询控件交互调整基线已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 批准收口为 `APPROVED`（`query_control_interaction_adjustment_status=APPROVED`）；本轮调整已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001` 于 2026-09-11 落地，并经 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 于 2026-09-12 复审收口为 `query_control_interaction_adjustment_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`、`query_control_interaction_adjustment_code_review_status=APPROVED`、`query_control_human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`、`project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER`；正式验收与人工视觉验收仍为 `NOT_RUN`（`formal_acceptance_status=NOT_RUN`、`formal_acceptance_not_run_count=107`）。禁止写为 `FORMALLY_ACCEPTED`/`IMPLEMENTATION_APPROVED`/`ACCEPTANCE_PASSED`/`COMPLETED`） |
| 本轮（查询控件交互调整基线）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001`（纯文档查询控件交互调整草案：把项目负责人确认的三类查询控件交互问题固化为界面规则，见本文件 §20；该草案已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001`（2026-09-10）批准收口为 `APPROVED`；草案建立任务不实现、不执行正式验收、不代替项目负责人批准草案） |
| 本轮（查询控件交互调整草案）授权基线提交 | `ba309ea8b469e3796ab08ed87c6ccb8c6d5bb253`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0） |
| 本轮（查询控件交互调整草案）原正式实现提交 | `3ec9cbf6487eacff004212fb3aca3064c3bd18cc`（R2～R7 视觉方案应用到 `5173` 的原正式实现结果提交，作为既有实现事实保留，不回退为“未实现”） |
| 本轮（查询控件交互调整草案）已批准视觉内容基准 | `e67b2ecc3897c3e83597126e259ee4c19349a66a`（R2～R7 隔离视觉原型设计固化批准内容基准提交，本轮只在其上做草案增量） |
| 本轮（查询控件交互调整草案）`5173` 正式实现代码复审状态 | `APPROVED`（`formal_5173_code_review_status=APPROVED`；ChatGPT 已从 Git 对 R2～R7 正式实现代码独立复审通过） |
| 本轮（查询控件交互调整草案）项目负责人人工页面检查状态（历史） | `CHANGES_REQUIRED`（`project_owner_visual_review_status=CHANGES_REQUIRED`；项目负责人确认查询区下拉宽度随内容变化、四个展示字段缺少统一字段级截断、`CLIENT_DESC` 截断后需 Tooltip 三类问题；**该历史结论已解决**，2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 收口，当前 `project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER`） |
| 本轮（查询控件交互调整基线）状态 | `APPROVED`（`query_control_interaction_adjustment_status=APPROVED`；已经 ChatGPT 从 Git 独立复审 `APPROVED`、项目负责人于 2026-09-10 明确回复“批准”，由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 批准收口，批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`；批准不代表已实现） |
| 本轮（查询控件交互调整基线）实现状态 | `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`（`query_control_interaction_adjustment_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`；本轮调整已由独立正式实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001` 于 2026-09-11 落地（结果提交 `a47988820c797ff60bd7244b2d0f899bd8fc3be5`），2026-09-12 经纯文档收口任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 收口：`query_control_interaction_adjustment_code_review_status=APPROVED`（ChatGPT 从远程 Git 复审 R1 修正实现提交 `edba7c891884d0f000a7c9edc196b2bffb95e0b0`；`2a9a271690bfdc68b16772268e84928a33abdeda` 仅为测试计数文档纠正、无代码变化）、`query_control_human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`、`project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER`；收口前历史状态为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`＋`PENDING_CHATGPT_REVIEW`；`formal_acceptance_status=NOT_RUN`，**不得**写成 `IMPLEMENTED`/`IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/`PASS`/`COMPLETED`） |
| 本轮（查询控件交互调整草案）需求/验收计数 | 本轮新增需求 `DSS-REQ-084~086` 共 3 条、验收 `DSS-AC-096~103` 共 8 条（全部 `NOT_RUN`）；当前全量累计需求 `DSS-REQ-001~087` 共 87 条、验收 `DSS-AC-001~107` 共 107 条全部 `NOT_RUN`（`formal_acceptance_not_run_count=107`），追踪矩阵 87/87 与 107/107，见本文件 §20、`REQUIREMENTS.md` §21.6/§21.7、`ACCEPTANCE.md` §4.21/§5 |
| 本轮（查询控件交互调整基线）下一入口 | `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`（2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 收口：本轮调整已由独立正式实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001` 在 `5173` 正式前端按批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4` 落地（结果提交 `a47988820c797ff60bd7244b2d0f899bd8fc3be5`），ChatGPT 对该提交代码复审历史结论为 `CHANGES_REQUIRED`；R1 修正任务 `…-IMPLEMENTATION-001-R1`（结果提交 `edba7c891884d0f000a7c9edc196b2bffb95e0b0`）已按复审意见完成 Tooltip 稳定身份、四字段 trim＋Unicode 截断、Git 可复核证据补交与本文档冲突消解，ChatGPT 从远程 Git 复审该 R1 修正实现提交结论 `APPROVED`、项目负责人人工视觉/交互检查 `APPROVED_BY_PROJECT_OWNER`；2026-09-12 前历史入口为 `CHATGPT_R1_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`，已处理完毕；统一下一入口曾为 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`（另立独立任务，按已批准需求/设计/API/UI/DATABASE 与 `DSS-AC-001~107` 执行正式验收；该任务已于 2026-09-12 执行、并经 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1` 完成 `DSS-AC-065` 定向补验，当前 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`、`acceptance_execution_status=PASS`、`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`，未获最终接受）；当前下一入口为 `CHATGPT_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_ACCEPTANCE_DECISION`（历史：当时正式验收仍 `NOT_RUN`；`human_visual_acceptance_status` 仍为 `NOT_RUN`） |
| 本轮（查询下拉固定宽度基线）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001`（把项目负责人已在 `5174` 隔离固定宽度 prototype 中人工确认“没有问题”并明确批准执行的三个查询下拉弹层固定宽度方案固化为 Feature 界面规则，见本文件 §21；原基线任务为纯文档草案建立任务，当时只建立草案、不修改代码、不批准草案、不执行正式验收；该草案现已由 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001` 批准收口为 `popper_width_document_status=APPROVED`。本行描述原任务的历史性质，不代表当前仍为草案或待批准；本轮 popper 固定宽度调整已由 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001` 在 `5173` 正式前端落地（2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 复审收口为 `popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`；2026-09-12 前历史状态为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`），正式验收仍未执行） |
| 本轮（查询下拉固定宽度基线）授权基线提交 | `2a9a271690bfdc68b16772268e84928a33abdeda`（本任务开始时 `origin/develop` 最新提交，且等于 `git ls-remote origin refs/heads/develop`；本任务在独立文档 worktree 的该提交上工作） |
| 本轮（查询下拉固定宽度基线）驱动来源 | 项目负责人对“查询下拉框固定宽度”隔离视觉 prototype（独立 worktree，探针端 `480px`、源库 `400px`、快照状态 `240px`）进行真实浏览器多视口/多状态人工查看后明确回复“我检查过了，没有问题”“批准，按照你的方案执行吧”（`prototype_width_decision_status=APPROVED_BY_PROJECT_OWNER`） |
| 本轮（查询下拉固定宽度基线）界面规则状态 | `APPROVED`（`popper_width_document_status=APPROVED`：本文件 §21 新增界面规则与 `REQUIREMENTS.md` §21.8 `DSS-REQ-087`、`ACCEPTANCE.md` §4.22 `DSS-AC-104~107` 已由 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001` 收口为 `APPROVED`——ChatGPT 已从远程 Git 对批准内容基准提交 `f74dd725682b745f1b8ac6a1b9358eff10aaddc2` 完成最终复审 `APPROVED`、项目负责人于 2026-09-11 明确回复“批准”；已纳入当前批准需求/验收/设计基线，`pending_user_review=NO`、`pending_user_confirmation_count=0`、`human_formal_5173_review_status=NOT_RUN_FOR_THIS_ADJUSTMENT`；**不得**写成 `IMPLEMENTED`/`PASS`/`ACCEPTED`/`COMPLETED`；其后 R2 任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001-R2` 基于实现证据提出支持视口边界修正（正式支持下限 `viewport width >= 1280px`、`<1280px` 仅防御性观察），其文档已于 2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-R2-APPROVAL-001` 批准收口为 `popper_width_r2_document_status=APPROVED`（`chatgpt_r2_final_review_status=APPROVED`、`project_owner_r2_approval_status=APPROVED`）） |
| 本轮（查询下拉固定宽度基线）popper 固定宽度数值 | 探针端 `480px`、源库 `400px`、快照状态 `240px`；小视口安全上界统一为 `min(目标宽度, calc(100vw - 16px))`（`client_popper_width_px=480`、`source_popper_width_px=400`、`status_popper_width_px=240`、`viewport_safe_width_rule=MIN_TARGET_OR_100VW_MINUS_16PX`） |
| 本轮（查询下拉固定宽度基线）原型决策状态 | `APPROVED_BY_PROJECT_OWNER`（`prototype_width_decision_status=APPROVED_BY_PROJECT_OWNER`：项目负责人已在隔离固定宽度 prototype 上人工确认三档宽度无问题并批准按该方案执行；该认可只针对 prototype 宽度方案本身，**不代表** `5173` 正式实现已完成、**不代表**正式验收已执行或通过） |
| 本轮（查询下拉固定宽度基线）正式实现状态 | `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`（`popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`、`popper_width_formal_code_review_status=APPROVED`、`human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`，2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 复审收口；2026-09-12 前历史状态为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW` + `popper_width_formal_code_review_status=CHANGES_REQUIRED`（ChatGPT 从远程 Git 对该实现提交的代码复审结论为 `CHANGES_REQUIRED`）+ 人工视觉/交互复审 `NOT_PASSED`）；已由独立实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001` 在 `5173` 正式前端按批准内容基准 `f74dd725682b745f1b8ac6a1b9358eff10aaddc2` 落地 `DSS-REQ-087` 固定宽度规则——只改 Feature 私有 `DataSourceSnapshotQueryBar.vue` 与其 `.spec.ts`，`frontend_code_diff` 仅限该 Feature 私有文件、`backend_code_diff=ZERO`，开发验证状态 `DEV_SELF_TEST_DONE`；ChatGPT 已按已批准 R2 支持边界从远程 Git 重新复审现有实现并给出 `APPROVED`，项目负责人已明确回复“人工检查了，没有问题”`human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`；`formal_acceptance_status=NOT_RUN`、`human_formal_5173_review_status=NOT_RUN_FOR_THIS_ADJUSTMENT`、`pending_user_review=NO`、`pending_user_confirmation_count=0`；复审通过**只表示**实现可以进入独立正式验收阶段，**不得**写成 `IMPLEMENTED`/`IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/`PASS`/`COMPLETED`） |
| 本轮（查询下拉固定宽度基线）需求/验收计数 | 需求 `DSS-REQ-087` 共 1 条（累计 `DSS-REQ-001~087` 共 87 条，已收口为 `APPROVED`）、验收 `DSS-AC-104~107` 共 4 条（累计 `DSS-AC-001~107` 共 107 条全部 `NOT_RUN`、`acceptance_not_run_count=107`，已收口为 `APPROVED`），追踪矩阵 87/87 与 107/107，见本文件 §21、`REQUIREMENTS.md` §21.8、`ACCEPTANCE.md` §4.22/§5 |
| 本轮（查询下拉固定宽度基线）下一入口 | `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`（本轮界面规则已批准收口（`popper_width_document_status=APPROVED`）；批准收口任务 `...-BASELINE-APPROVAL-001`、R1 修正任务 `...-BASELINE-APPROVAL-001-R1` 与独立实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001` 均已完成，实现已在 `5173` 正式前端按批准内容基准 `f74dd725682b745f1b8ac6a1b9358eff10aaddc2` 落地 `DSS-REQ-087` 固定宽度规则（2026-09-12 前历史状态为 `popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`，其时代码复审结论为 `CHANGES_REQUIRED`，界面落点见 §21）；本 R2 任务提出支持视口边界修正（正式支持下限 `1280px`、`<1280px` 仅防御性观察、不计入正式验收），其文档已于 2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-R2-APPROVAL-001` 批准收口为 `popper_width_r2_document_status=APPROVED`（`chatgpt_r2_final_review_status=APPROVED`、`project_owner_r2_approval_status=APPROVED`，批准内容基准提交 `0666cd96f1f27784f6d77404bd8d4820dbd96013`）；2026-09-12 前历史入口为 `CHATGPT_POPPER_WIDTH_IMPLEMENTATION_REREVIEW_AGAINST_APPROVED_R2_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`，该入口已由 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 处理完毕（实现复审 `APPROVED`、人工视觉/交互复审 `APPROVED_BY_PROJECT_OWNER`），统一下一入口曾更新为 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`（另立独立任务，按当前已批准需求、设计、API、UI、DATABASE 与 `DSS-AC-001~107` 执行正式验收；该任务已于 2026-09-12 执行、并经 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1` 完成 `DSS-AC-065` 定向补验，当前 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`、`acceptance_execution_status=PASS`、`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`，未获最终接受）；当前下一入口为 `CHATGPT_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_ACCEPTANCE_DECISION`（历史：当时**不得**在本任务执行正式验收、107 条验收保持 `NOT_RUN`）） |
| 本轮（查询下拉固定宽度基线）支持视口边界修正（R2）状态 | `APPROVED`（`popper_width_r2_document_status=APPROVED`：正式支持视口下限修正为 `viewport width >= 1280px`，`<1280px` 仅保留防御性收缩、其窄视口观察不计入正式验收；修正本文件 §21 与 `DSS-REQ-087`/`DSS-AC-104~107`，删除“`<496/<416/<256px` 必须正式通过”的要求；该修正基于 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001` 实现证据提出，属项目负责人支持边界修正；已于 2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-R2-APPROVAL-001` 批准收口——ChatGPT 已从远程 Git 对批准内容基准提交 `0666cd96f1f27784f6d77404bd8d4820dbd96013` 完成 R2 复审 `chatgpt_r2_final_review_status=APPROVED`、项目负责人明确回复“批准”`project_owner_r2_approval_status=APPROVED`，`supported_viewport_min_width_px=1280`、`sub_1280_formal_support_status=NOT_FORMALLY_SUPPORTED_DEFENSIVE_ONLY`、`ultra_narrow_formal_acceptance_requirement_status=WITHDRAWN_BY_APPROVED_R2`、`pending_user_review=NO`、`pending_user_confirmation_count=0`；批准 R2 文档**不等于**实现复审通过或正式验收执行；原 `480/400/240px` 数值、外层公式与触发控件尺寸均不变） |
| 通用查询列表页 UI 基线状态 | `NOT_CREATED_BY_DESIGN`（通用 `QUERY-LIST-PAGE-UI-PATTERN` 须待本页正式实现并验收通过后再独立评估建立，本任务**不创建、不批准**） |
| 创建日期 | 2026-09-05；2026-09-06 设计批准收口；2026-09-07 建立第一轮验收前 UI 调整草案并批准/实现；2026-09-08 建立第二轮 UI 调整草案（R0/R1）并批准收口为 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，同日以 `...-002-R2` 纯文档纠正源库 Tooltip 内容并重新进入复审，再以 `...-002-R3` 记录纠正，ChatGPT 对 R3 结果提交独立正式复审 `APPROVED`、项目负责人明确“批准”，同日重新批准收口为 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`（批准内容基准提交 `cf40b5d...`）；2026-09-10 隔离视觉原型 R2～R7 设计固化（`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001`，见 §19）；2026-09-10 查询控件交互调整基线经 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 批准收口为 `APPROVED`（批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`，见 §20） |

**界面基调（整体）**：本页面采用与现有 app-shell 及 Element Plus 体系一致的企业管理后台**浅色**风格，不引入新视觉体系、不硬编码无依据的色彩（DSS-REQ-062/AC-060）。颜色一律沿用项目/Element Plus 既有语义令牌（见 §5.3），并保证**颜色不是唯一信息载体**（DSS-REQ-063/AC-061）。

本任务只产出可实现的文字设计，不生成截图、不创建视觉资产。原“页面当前为占位页、下述为待实现页面设计”是设计草案阶段事实：实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001`/`-R1` 已替换占位页为正式“源库快照状态”实现页（见 §12 与 Feature README §8/§9）。本节与 §2~§8 的展示布局描述为已批准界面设计基线；**2026-09-07 第一轮验收前 UI 调整草案（§13）对其中页面整体结构、结果卡片头部与刷新组、固定列宽与单元格内容、单实例 Tooltip、busy 视觉隔离作出定向调整**（已批准并实现，历史）；**2026-09-08 第二轮验收前 UI 调整草案（§16）在第一轮基础上对表格铺满结果卡片、探针端列/源库列展示简化、探针端查询下拉框长度与文本截断作出定向调整（当前第二轮现行规则）**。实现阶段以当前版本为准：§2 结合 §13（未被第二轮取代处）与 §16（第二轮现行规则及“取代/修订”清单）。

## 2. 页面整体结构与定位声明

页面为正式“源库快照状态”实现页 `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（DESIGN §4.2）。已批准设计把页面自上而下按“标题行/查询区/刷新工具栏/列表区”平铺；**本轮 UI 调整草案（§13）改为三块有清晰视觉分隔的分区**：①页头语义区（标题＋功能说明）、②独立查询卡片、③独立结果卡片（头部＝结果摘要＋右侧刷新逻辑组；主体＝七列表格）。目标结构（本轮调整草案，见 §13.2）：

```
DataSourceRunStatePage.vue
└─ 页面容器（浅色企业后台卡片分层，沿用项目现有设计令牌）
   ├─ ① 页头语义区：标题“源库快照状态”（§10）＋ 一行简短只读定位功能说明（示例：“展示各探针端与源库组合的初始快照阶段状态；页面只读。”）
   ├─ ② 查询卡片 DataSourceSnapshotQueryBar（独立白色容器，§3/§13.2）
   └─ ③ 结果卡片（独立白色容器）
       ├─ 头部 .dss-result-card__header：左侧结果摘要（共 N 条＋未知状态提示）＋右侧不可拆散刷新逻辑组（§13.2/§13.3）
       └─ 主体 DataSourceSnapshotTable（§4/§5/§13.4；加载/空/失败/错误覆盖见 §7）
```

- 组件划分（DESIGN §4.2）：`components/DataSourceSnapshotQueryBar.vue`、`components/DataSourceSnapshotTable.vue`、`components/DataSourceSnapshotToolbar.vue`（本轮调整草案中其刷新内容归入结果卡片头部右侧“刷新逻辑组”，见 §13.3）、`components/DataSourceSnapshotStatusTag.vue`；编排由 `composables/useDataSourceSnapshot.ts` 承担（页面/composable 实例内状态；**不新增 Pinia store**，DESIGN §7，R1-01）。
- **整页只呈现初始快照状态信息**：不得出现 sync-client 在线/健康/失联判定、增量采集是否正常、同步进度等语义，不得加“心跳/最后在线”等健康文案；对长时间 `SNAPSHOT_RUNNING` 行不得按运行时长给错误/警告色（DSS-REQ-007/056/057/010，AC-007/009/053/054）。
- 不出现“未开始/待快照/尚无快照记录”等推断虚拟状态（DSS-REQ-018，AC-016，见 §4.2）；不提供任何写按钮、操作入口（DSS-REQ-012/034，AC-011/031，见 §4.6）。
- 页面不显示分页条/每页条数/翻页控件（DSS-REQ-021，见 §4.7）。

## 3. 查询区设计（DataSourceSnapshotQueryBar）

查询区放页面内容顶部，含“探针端、源库、快照状态”三个多选条件控件及“查询”“重置”两个按钮（DSS-REQ-022，AC-020）。只允许这三个条件，不出现时间范围/在线状态/健康状态/关键字等未批准条件（DESIGN §2.3）。

### 3.1 控件形态与默认“全部”

- 三个控件均用可多选、可清空的选择控件（Element Plus `el-select multiple` 或等价组件），每一项候选选项里**显式提供“全部”**，置于选项最前。
- **每次路由进入/页面实例创建**三项均默认选中“全部”（探针端/源库/快照状态各为“全部”），随即自动按三项“全部”发起一次查询（DSS-REQ-023，AC-021 场景 A）。
- **离开路由后重新进入**创建新的页面实例：同样重置为三项“全部”并自动查询，**不恢复上次路由会话/上次页面实例的旧已应用条件、旧草稿、旧结果或旧最近成功刷新时间现场**；路由离开即销毁页面实例（R1-01，与“同页面实例切到后台再切回”的隐藏/恢复是两种生命周期，见 §7.4）。
- “全部”选项与其它具体候选在控件内为**互斥单选语义**：选中任一具体候选即自动取消“全部”；改选“全部”即清空该条件所有具体候选并回到“全部”（DSS-REQ-022，AC-020）。

### 3.2 候选来源与显示（含状态候选动态出现）

- **探针端候选**：显示格式“原始 `CLIENT_ID`（+ 配置 `CLIENT_DESC`，若存在）”；候选项携带 `id` 与 `desc`（API §5.2）。
- **源库候选**：显示格式“源库 `ORG`（若存在，否则原始 `DATA_SOURCE_ID`）”；候选项携带 `id` 与 `org`。
- 候选**只来自当前 RUN_STATE 实际记录及其展示信息**：未在 RUN_STATE 中出现的探针端/源库不出现（DSS-REQ-024/AC-022 ①）。
- **快照状态候选**：固定先给“快照进行中（RUNNING）”“快照已完成（COMPLETED）”两项；**仅当**当前候选数据真实存在未知原始状态行时，才追加“未知状态（UNKNOWN）”（DSS-REQ-024，AC-022 ②③）。顺序固定为 [进行中, 已完成, （如出现）未知状态]。

### 3.3 条件组合与控件操作

- 同一条件内选中多个具体候选为“或”；三个条件之间为“且”（DSS-REQ-022，AC-023）。
- 在具体候选与“全部”间来回切换按 §3.1 互斥规则即时生效于**界面草稿**（不触发查询）。
- 修改任意界面条件都**不自动发起查询**、不改当前表格与“已应用查询条件”（DSS-REQ-023，AC-024 ①）。

### 3.4 “重置”按钮（纯前端复位，不查询）

- 点击“重置”仅把三个界面选择条件恢复为“全部”，**本身不发起查询、不清空/不替换当前表格、不改变“已应用查询条件”**（DSS-REQ-025，AC-024 ⑦）。
- 复位后表格仍展示上一次成功结果；用户必须再点击“查询”才会按“全部”重新查询（DSS-REQ-023/025）。
- “重置”与“对 RUN_STATE 数据执行重置状态/重新快照”是两类不同操作——后者是明确禁止的产品写操作，页面上无此入口（DSS-REQ-025 语义边界）。

### 3.5 界面选择条件 vs “已应用查询条件”的可理解呈现

页面**不要求暴露“已应用查询条件”这一技术术语**，但用户行为必须无歧义：

- 控件当前显示的是“界面选择条件”（草稿），可被修改/重置而暂不生效；生效的是最近一次成功“查询”确立的“已应用查询条件”（决定表格、自动/立即刷新）。
- 未点击“查询”的界面变化只影响控件外观，刷新仍按已应用条件取数（AC-024 ②⑤⑧），用户无需理解术语即可观察到：改完条件不点“查询”时，自动/立即刷新拿到的还是旧条件结果。
- **已选 token 在候选消失时的 ghost 保留**：当候选随数据变化不再提供某个已选具体值（如未知状态候选消失），界面草稿对该已选值做“幽灵保留/降级显示”——不清空用户选择、不发请求，仅以弱化样式提示该值当前不在候选内；点击“查询”时该值仍随请求快照传输（服务端未知/无命中按空结果成功处理），避免无提示地清空用户意图（DSS-REQ-024，AC-022 ③ 与空结果语义衔接；由 `selection.ts` 互斥/归一纯函数支撑，DESIGN §7.2）。

### 3.6 用户可理解的“生效/未生效”交互序列

| 用户行为 | 可观察结果（无需术语） |
|---|---|
| 首次进入 / 离开路由后重新进入 | 新页面实例重置为三项“全部”并自动按“全部”查询展示，**不恢复上次现场**（R1-01；首次加载反馈见 §7.1） |
| 改任一条件 | 表格不变、无新请求（AC-024 ①） |
| 改完条件再点“查询”（成功） | 表格更新为“点击瞬间条件”的结果；此后自动/立即刷新都用该组条件（AC-024 ③⑥⑨⑩） |
| 请求在途（busy）时再点“查询”/“立即刷新” | “查询”与“立即刷新”按钮均**禁用**：点击不接受、不排队、不补发；自动刷新触发被抑制、不排队；被禁用/被抑制触发不视为实际请求、不重置计时、不提示（R1-02，AC-050/051） |
| 点“查询”请求在途（busy）时改控件 | 控件仍可修改，但改动只停留在界面草稿；成功后用的是**点击开始时**的条件，不是结束时/补点前的控件值（AC-024 ③） |
| 按新条件点“查询”失败 | 表格与生效条件保持上一次成功结果；控件保留失败的新条件以便再点“查询”；刷新仍按旧生效条件（AC-024 ④⑤） |
| 点“重置” | 三个控件回“全部”，表格与生效条件不变，无请求（AC-024 ⑦） |
| 不点“查询”直接等自动/立即刷新 | 永远按生效条件取数，界面上的草稿（无论改了什么/重置到什么）不参与（AC-024 ②⑤⑧） |

首次进入自动查询成功/失败的呈现见 §7.1/§7.2（AC-021）。

## 4. 七列列表表格（DataSourceSnapshotTable）

表头固定七列，顺序为：**序号、探针端、源库、快照状态、快照启动时间、快照完成时间、记录更新时间**；无第八列“操作”或其它业务列（DSS-REQ-027，AC-025）。

整体表现规则：表格一次渲染全部返回行，**不分页**（§4.7）；本轮 UI 调整草案把列宽改为**目标固定列宽**（下表，取代原“建议最小宽度”，见 §13.4），对齐与内容规则如下；内容单行 ellipsis，过长用**页面级单实例 Tooltip** 展示全文（Tooltip 规则见 §8.1 与 §13.5）；单元格内不放编辑/跳转等可操作元素。

| 列 | 目标固定列宽（本轮调整草案） | 对齐 | 说明 |
|---|---|---|---|
| 序号 | `70px` | 居中 | §4.1/§13.4 |
| 探针端 | `170px` | 左 | §4.3/§13.4 |
| 源库 | `280px`（明显宽于探针端列） | 左 | §4.4/§13.4 |
| 快照状态 | `130px` | 居中 | §5.1/§5.2/§13.4 |
| 快照启动时间 | `165px` | 左 | §4.5/§13.4 |
| 快照完成时间 | `165px` | 左 | §4.5/§13.4 |
| 记录更新时间 | `165px` | 左 | §4.5/§13.4 |

窄屏/响应式：三个时间列使用固定列宽、长度固定，不把多余空间平均摊给时间列；表格内容过宽时允许表格容器横向滚动，不通过换行挤压时间或主要文本（§13.4）。

### 4.1 序号列与行键

- 序号由前端按 `records` 数组顺序从 `1` 递增生成（稳定显示序号，非业务主键），刷新后随新结果重新编号（DSS-REQ-026，AC-019）。
- 表格 `row-key` 用行键 `clientId + '\x00' + dataSourceId`（NUL 分隔，`String.fromCharCode(0)`）保证 `CLIENT_ID+DATA_SOURCE_ID` 复合组合唯一、key 无拼接歧义（DSS-REQ-026/AC-019，DESIGN §15.1-11、API §6.1）。出现相同复合组合的重复行计为异常（由复合主键保证接口不会返回，见 DATABASE §3）。

### 4.2 “只展示实际行、不推断虚拟状态”的呈现表达

- 页面只渲染 `CDC_DATA_SOURCE_RUN_STATE` 实际存在的行；不出现任何由页面生成的组合行或“未开始/待快照/尚无快照记录”状态（DSS-REQ-016/017/018，AC-014/015/016）。
- 快照状态列只有三种视觉（运行中/已完成/未知，§5），没有“未开始”等第 4 种状态；即便某探针/源库从未产生快照记录，也不在表格里体现（那属于“未出现”，不是“待快照”）。

### 4.3 探针端列

> **第二轮现行规则（取代第一轮 §13.4 与本小节历史中“探针端配置缺失/配置已停用”黄色异常图标与异常弱提示语义，见 §16.3/§16.6）**：本列现行展示按下面各条；红色“停用”仅作为**普通红字文本**附于非启用 `FG_ACTIVE` 探针行后，不是图标、按钮、链接或可操作标签；缺失一律静默，不出现黄色符号或“探针端配置缺失”等异常说明。

- 主内容：始终为原始 `CLIENT_ID`，单行、超出弹性列宽（最小 `170px`）省略号；不把 `CLIENT_DESC` 同行或次行内联展示（DSS-REQ-028 修订、DSS-REQ-073，AC-026/074/082）。
- Tooltip：仅当完整 `CLIENT_DESC` 非空时经**悬停页面级单实例 Tooltip**（§16.7）展示完整 `CLIENT_DESC`；描述为空/探针配置不存在/无法取得描述时不弹空 Tooltip；Tooltip 内不得出现“配置已经停用”“探针端配置缺失”或其它异常说明。
- 删除探针端列全部黄色异常图标：启用/非启用/`NOT_FOUND`/描述为空等任意行均不得出现黄色符号。
- 展示层只额外判断关联探针 `FG_ACTIVE`（不改变接口既有 `clientRef.state`、后端映射与数据库读取规则）：`FG_ACTIVE='1'`（启用）→仅显示 `CLIENT_ID`；非 `'1'`（含 `'0'` 及数据库宽容归一后判为非启用的值）→显示 `CLIENT_ID`＋一个空格＋红色普通文字“停用”；找不到探针配置（`NOT_FOUND`）→仅显示原始 `CLIENT_ID`（缺失静默，无“缺失”文字、无黄色图标、无异常说明）。
- 探针端不做类别判断，只判存在/停用（DESIGN §5.6）。

### 4.4 源库列

> **第二轮现行规则（取代第一轮 §13.4 与本小节历史中“源库配置缺失/配置已停用/类别非 SOURCE”黄色异常图标与 Tooltip 异常说明语义，见 §16.4/§16.6）**：本列现行展示按下面各条；本列不出现红色“停用”（红色“停用”仅用于探针端非启用 `FG_ACTIVE`，见 §4.3/§16.3）；停用/类别异常/配置缺失仍保留 RUN_STATE 行并按 ORG 或回退原始 ID 正常展示，不追加任何异常文字。

- **单行展示，不采用两行 ORG＋ID 布局**（DSS-REQ-029，AC-027）。
- **第二轮（§16.4，取代 §13.4 相应规则）**：正常关联（`sourceRef.state=ACTIVE`）且 ORG（`DATA_SOURCE_ORG`）非空时，主文本只显示**源库 ORG**，单行、超出弹性列宽（最小 `280px`）省略号；悬停以页面级单实例 Tooltip（§16.7）展示**完整原始 `DATA_SOURCE_ID`**（正常行与回退行同源；R2 纠正 R0/R1/批准收口版误记的“完整 ORG”规则，不取 `DATA_SOURCE_ORG`、不拼接 ORG＋ID）（DSS-REQ-029 修订、DSS-REQ-074，AC-027/075/083）。
- 源库配置缺失（`NOT_FOUND`）**或 ORG 为空**：主文本回退显示原始 `DATA_SOURCE_ID`（不得显示空白），单行 ellipsis，悬停 Tooltip 显示完整原始 `DATA_SOURCE_ID`（回退 Tooltip 仅此内容，不追加“配置缺失”等异常说明）。
- 停用（`INACTIVE`）/类别非 SOURCE（含类别大小写不敏感归一）：行保留，主文本仍按 ORG 或回退 ID 展示，**无黄色图标、无红字“停用”、无“类别非 SOURCE/配置已停用”等异常文字**（DSS-REQ-043/044/074，AC-040/041/083）。
- 只改变前端展示；不改 `sourceRef.state`、`sourceRole`、后端映射、候选来源或数据库读取规则。

### 4.5 三个时间列

- 三个时间字段（快照启动时间=`SNAPSHOT_LAST_SEEN_AT`、快照完成时间=`SNAPSHOT_COMPLETED_AT`、记录更新时间=`UPDATED_AT`）统一展示为 `YYYY-MM-DD HH:mm:ss`；值为 `null`/空一律显示 `--`（弱化样式）；（DSS-REQ-031/032/033/055，AC-029/030/052）。
- 展示格式化不得改变业务时间值；时间只作展示，不据其显示“超时/异常/离线/长期运行”等（DSS-REQ-010/056/057，AC-009/053/054）。长时间 RUNNING 行不得加错误/警告样式（AC-054）。

### 4.6 无操作列与列外行为

- 列表无操作列，无详情/编辑/删除/跳转/重试/批量入口（DSS-REQ-034/012，AC-031/011）。
- 行不可选中、不可删除、不可排序拖动；无行内按钮；无右键菜单。
- 序号列也不承载“勾选/批量”等任何交互。

### 4.7 默认排序、不分页、无表头排序

- **默认排序（固定，用户不可改）**：先 `SNAPSHOT_RUNNING`（快照进行中），再未知状态，后 `SNAPSHOT_COMPLETED`（快照已完成）；同一状态组内按记录更新时间（`UPDATED_AT`）**倒序**；`UPDATED_AT` 并列时以 `CLIENT_ID`、`DATA_SOURCE_ID` 升序作确定性次序（DSS-REQ-046/047/048，AC-043/044/045）。排序在服务层完成（DESIGN §5.4、API §6.2），表格按返回顺序直接渲染。
- **不分页**：页面一次渲染全部返回行，无分页条、无每页条数与翻页控件（DSS-REQ-020/021，AC-018）。
- **无表头排序**：表头不显示排序箭头，点击表头不排序、无排序图标（DSS-REQ-049，AC-046）。

## 5. 快照状态与关联异常视觉（DataSourceSnapshotStatusTag）

“快照状态”列用统一状态标签组件渲染；状态与异常信息**必须文字与颜色并存，颜色不是唯一信息载体**（DSS-REQ-063，AC-061）。

### 5.1 已知状态标签（RUNNING / COMPLETED）

| statusCategory | 标签文字 | 颜色（沿用语义令牌） |
|---|---|---|
| `RUNNING` | 快照进行中 | 蓝（状态主色） |
| `COMPLETED` | 快照已完成 | 绿（成功色） |

- 标签以文字为主、颜色为辅，二者并存（DSS-REQ-035/036，AC-032/033）。

### 5.2 未知状态标签（UNKNOWN）与原始状态值

- `statusCategory=UNKNOWN`：显示橙色“未知状态”标签，颜色与两种已知状态清晰区分（橙-警告/中性语义），且文字同时为“未知状态”，颜色非唯一（DSS-REQ-038，AC-035/037）。
- 未知行的**数据库原始状态值必须可见**（如 `SNAPSHOT_READY`）：以标签 Tooltip 或标签旁弱化原始值文本方式展示，保证用户能查看原始值（DSS-REQ-038/030，AC-028/035/037）。
- 未知状态行不被丢弃、不改写为已知状态、不报错（DSS-REQ-039，AC-034）。

### 5.3 颜色语义与“颜色非唯一”保证

- 三种状态颜色取自项目/Element Plus 既有语义色（成功绿 / 主蓝 / 警告橙等）的标签体系（DSS-REQ-062，DESIGN §3.2 现有标签惯例），不硬编码新的无依据色板。
- 任意状态/异常都必须有文字（中文标签或数据库原始值）；灰阶/色弱/黑白环境下仍可区分（DSS-REQ-063，AC-061）。
- 每行（含已知状态）都可查看数据库原始 `SNAPSHOT_STATUS`（Tooltip），即原始值入口对任意行开放（DSS-REQ-030，AC-028）。

### 5.4 关联异常轻量提示（第二轮现行：黄色异常图标与“缺失/停用/类别非 SOURCE”弱提示已取消，仅探针端非启用保留红字“停用”）

> 第一轮及更早“单元格内黄色小图标（如感叹号）＋弱提示‘探针端配置缺失/配置已停用/源库配置缺失/类别非 SOURCE’＋Tooltip 解释”的关联异常提示机制已被第二轮取消（`DSS-REQ-045` 修订，见 DESIGN §22.6/§22.7 与 UI §16.3/§16.4/§16.6）。本小节为第二轮现行剩余异常表达；本页不新增专门异常列（AC-042）。

- 黄色小图标一律删除：探针端/源库列表格不再以黄色感叹号或其它黄色符号表达关联异常；探针/源库缺失、源库停用与类别非 SOURCE 一律静默（不显示提示文字、不弹异常说明 Tooltip）。
- 探针端列唯一保留的关联状态标记为**红字“停用”普通文本**：仅当关联探针 `FG_ACTIVE` 非 `'1'`（含数据库宽容归一后判为非启用的值）时，在 `CLIENT_ID` 后以一个空格＋红色“停用”普通文字表达（非图标、非按钮/链接/可操作标签，见 §4.3/§16.3）；源库列不出现红色“停用”。
- `NOT_FOUND`（探针/源库配置不存在）与源库 `DATA_SOURCE_ORG` 为空：主文本按 §4.3/§4.4 静默回退展示原始 `CLIENT_ID`/原始 `DATA_SOURCE_ID`，不显示“配置缺失”等弱提示。
- 本页 Tooltip 只承载真实内容（`CLIENT_DESC`/完整原始 `DATA_SOURCE_ID`（正常行与回退行同源）/未知快照状态原始值；`DATA_SOURCE_ORG` 只作为源库列主内容，不进入 Tooltip），不再为关联异常提供解释性 Tooltip。

### 5.5 不新增异常列、不改判、不写

- 关联异常绝不单独成列；第二轮起黄色小图标与“缺失/停用/类别非 SOURCE”弱提示文字已取消，仅探针端非启用行在单元格内以红字“停用”普通文本表达（DSS-REQ-045 修订，AC-042）。
- 异常/停用只表达“配置关联事实”，**不把快照状态改判成失败**（状态标签仍按 §5.1/§5.2 渲染），不触发任何修复/写行为（DESIGN §5.6/§10，AC-042）。

## 6. 刷新工具栏（DataSourceSnapshotToolbar）

### 6.1 工具栏构成与只读说明

已批准设计把刷新工具栏置于查询区与表格之间；**本轮 UI 调整草案（§13.3）把刷新控件收敛为结果卡片头部右侧的不可拆散“刷新逻辑组”**：灰色状态圆点＋`60 秒自动刷新`＋分隔符＋`最近成功刷新：HH:mm:ss`＋“立即刷新”按钮，整组靠右（AC-047/071）。

```
结果卡片头部 .dss-result-card__header
├─ 左：共 {records.length} 条〔其中 {unknownCount} 条未知状态，为 0 不显示〕（§13.2/§13.3）
└─ 右：刷新逻辑组（整体靠右、窄宽度整体换行）
     [● 60 秒自动刷新｜最近成功刷新：14:20:33]   [ 立即刷新 ]
```

- 刷新逻辑组内容与语义沿用已批准设计（自动刷新与“立即刷新”**始终按“已应用查询条件”取数**，即使用户修改/重置界面条件或按新条件查询失败也一样；DSS-REQ-050/023，AC-047/024）。
- 工具栏不含任何写入口；点击刷新只触发只读重查（DSS-REQ-014/052，AC-012/049）。
- “最近成功刷新：”后无成功值时（从未成功）显示 `--`，首次成功后显示首次成功时刻（DESIGN §7.1 `lastSuccessAt`）。
- 宽度不足时刷新逻辑组**整体换行**，不得只把“立即刷新”按钮单独挤到下一行（§13.3，AC-071）。

### 6.2 “立即刷新”按钮稳定宽度与三态几何稳定（AC-068/072 核心）

- 按钮**宽度恒定**：给定固定最小宽度且按钮内文字恒定（“立即刷新”），不随状态改变。
- **刷新在途加载图标出现/消失不改变按钮宽度、不改变按钮文字内容**：加载态图标使用与按钮内固定占位同尺寸的方案（固定尺寸 loading 图标，出现时替换占位、消失时复原占位，或使用固定宽高 loading 使其不改变内容盒 intrinsic 宽度），避免图标显隐造成按钮水平跳动（DSS-REQ-050/068，AC-068/072）。
- 刷新逻辑组 idle/loading(在途)/failure 三态**几何稳定**：加载图标出现/消失不得移动“立即刷新”按钮本身、前方文案与“最近成功刷新”时间；整组在结果卡片头部右侧，其相对位置恒定；刷新失败提示置于不会推动刷新组关键元素的稳定槽位，出现/消失不造成工具栏明显水平跳动（DSS-REQ-068，AC-072）。
- 说明文案本身不因刷新/失败改变宽度或换行。
- **任一实际请求在途（busy）时“立即刷新”按钮禁用**：点击不接受、不排队、不补发（R1-02；DSS-REQ-053，AC-050）；禁用态变化同样不改变按钮宽度与文案（保持上述稳定宽度约束，AC-068）。
- **busy 视觉隔离（§13.6）**：只有真正发起当前请求的操作呈现对应加载反馈；手工立即刷新在途时仅“立即刷新”显示 loading，条件查询不得让“立即刷新”出现虚假 loading；“查询”在刷新在途保持 disabled＋`aria-disabled` 且文字/颜色/尺寸/位置不闪动（DSS-REQ-071，AC-078/079）。

### 6.3 “最近成功刷新时间”与自动刷新说明

- “最近成功刷新时间”只读显示页面实例的 `lastSuccessAt`（前端成功时刻，epoch）格式化 `HH:mm:ss`；**仅查询/刷新成功才更新**，失败或被禁用/被抑制的触发都不更新（保持上一次成功值）（DESIGN §7.1；DSS-REQ-061，AC-058/068）。
- 成功刷新（含成功空结果）会更新该时间并更新表格，但永不替换“已应用查询条件”；只有用户点击“查询”且成功才替换（DSS-REQ-023/054，AC-024 ②⑤⑧）。
- 刷新是纯读取：工具栏不显示任何“写入/保存”提示（DSS-REQ-052，AC-049/059）。

### 6.4 刷新在途轻量反馈与失败收敛

- 刷新（自动/立即/恢复可见）在途时：表格**不遮罩、不闪烁**，整表不重复 loading 遮罩（DESIGN §7.6 的 `loading`/`refreshing` 分级），避免列表抖动（DSS-REQ-058/061，AC-055/058）。在途视觉反馈按 §13.6 请求类型映射呈现：`manual`（点击“立即刷新”）仅“立即刷新”按钮显示 loading 且刷新状态圆点变蓝动态；`auto`（60 秒自动刷新）与 `restore`（恢复可见刷新）**只让刷新状态圆点变蓝并呈刷新动态，不让“立即刷新”按钮显示 loading**、按钮外观稳定。
- 有数据时的刷新失败：保留最近一次成功数据，不清空表格；在工具栏内显示**收敛的脱敏**短提示（如“刷新失败，将在约 60 秒后自动重试”），连续失败不堆叠相同消息；失败不更新“最近成功刷新时间”（DSS-REQ-061/064，AC-058/051/068）。
- 失败后自动刷新不停止、不立即无间隔重试，约 60 秒后按已应用条件正常自动重试（DSS-REQ-054，AC-051）。
- 任一请求在途时被抑制的自动/手工触发**不产生新请求、不重置计时、不给用户重复提示**（DSS-REQ-053，AC-050）。

## 7. 加载、空态、失败与可见性视觉

页面需区分“加载成功、加载失败、空结果、进行中”，失败与空结果不得互相伪装（DSS-REQ-061，AC-058）。

### 7.1 首次加载（首屏 loading，不闪烁）

- 首次进入无现场时的在途（kind=initial/retry/query）：表格区显示加载反馈（骨架或轻量 loading），不展示空态或错误态（DSS-REQ-058，AC-055）。
- 加载不造成表格明显闪烁：首次加载用整区加载占位，不反复重建表格行。

### 7.2 空态与首次加载失败态

- **成功空结果**：`records=[]` 且已有成功现场时，表格区显示空数据占位（如“暂无数据”），**非错误、非失败**（DSS-REQ-060，AC-057）。
- **首次加载失败**（无历史成功结果）：展示首次加载失败状态 + “重新加载”入口（整区错误提示 + 按钮），不伪装成空数据或成功；“已应用查询条件”仍为初始三项“全部”，点击“重新加载”或后续自动重试仍按三项“全部”发起（DSS-REQ-059，AC-056/021 场景 B）。

### 7.3 有数据时查询/刷新失败（保留旧数据 + 收敛提示）

- 已有成功结果时，任何查询（含按新条件点击“查询”）或刷新失败：**保留最近一次成功数据与已应用条件**，不清空表格、不改换生效条件；失败提示收敛、脱敏（§6.4，DSS-REQ-061/064，AC-058/062）。
- 界面控件保留用户失败前的新选择，便于再次点击“查询”（DSS-REQ-023，AC-024 ④）。
- 失败消息不暴露内部堆栈、无关数据或敏感信息（DSS-REQ-064，AC-062）；页面统一只展示后端脱敏 message（API §8）。
- 在途抑制的触发不显示额外错误（§6.4）。

### 7.4 页面隐藏与恢复可见（R1-03）

**范围区分**：本节的“隐藏/恢复”指浏览器标签页切后台再切回（**同一个仍挂载的页面实例**）；**路由离开**是页面实例销毁、下次进入全新初始化的另一类生命周期（R1-01，见 §3.1/§3.6，不归本节）。

**页面不可见**：
- 停止/取消自动刷新计时，不显示倒计时残留、**不保留剩余秒数复用**；不可见期间不发自动刷新请求、不启动新计时（DSS-REQ-051，AC-048）。
- 若请求在变为不可见前已在途，允许正常结束并按成功/失败规则处理，但不可见期间不启动新计时、不补发恢复刷新（其结束回调因隐藏直接返回，DESIGN §7.7）。
- 若存在待执行恢复刷新标志，一并清除（DESIGN §7.7 情形 B 第 5 点）。

**恢复可见（统一按 DESIGN §7.7）**：
- **空闲（无实际请求在途）**：立即按**当前已应用查询条件**发起一次刷新（有成功现场即恢复刷新；从未成功则等价按三项“全部”重试，走首次加载语义）。该次请求无论成功/失败，结束后**重新开始完整 60 秒周期**（DSS-REQ-051/054，AC-048）。
- **在途（busy）**：不发起并发恢复请求；仅置**一次性 `pendingVisibilityRefresh`**（多次可见事件合并为一次，不累积队列）。当前请求结束后：
  - 若仍可见、未卸载且标志仍为真：先清除标志，**不为刚结束的请求启动 60 秒计时**，立即读取**届时最新已应用查询条件**补发一次恢复刷新（若刚结束的是成功查询，则用其升级后的新条件；若失败则用保持的旧条件，DESIGN §7.7 情形 B）；不得用恢复可见事件发生时捕获的旧条件。
  - 补发请求结束（无论成功/失败）后，才**重新开始完整 60 秒周期**（R1-03；AC-048“恢复可见的刷新不与其他请求重叠”）。
- **待补发期间再次隐藏或路由离开**：清除待补发标志，**不补发**；隐藏期间不启动计时器。
- 恢复可见的延后补发是唯一例外，**不是通用排队**：busy 时其它“查询/立即刷新/自动”触发仍统一禁用/抑制（R1-02，见 §3.6/§6.2/§6.4）。

**可测试场景（供 §9 矩阵与后续浏览器人工验收定位，AC-048/051）**：
- 空闲恢复可见 → 立即按已应用条件刷新一次，结束后重启完整 60s，不与其他请求重叠。
- query/manual/auto/initial/retry/restore 任一在途时恢复可见 → 不并发，只置一次 `pendingVisibilityRefresh`。
- 在途查询成功（升级已应用条件）后补发 → 补发用升级后的新条件。
- 在途请求失败后补发 → 补发用保持的旧已应用条件。
- 多次可见事件 → 合并为一次补发，不累积。
- 补发前再次隐藏/卸载 → 清除标志、不补发、隐藏期间不启动计时。
- 补发请求成功/失败后 → 均从补发请求结束重启完整 60s。

## 8. Tooltip 与可访问性

### 8.1 Tooltip 规则

**第一轮 UI 调整草案（§13.5）把 Tooltip 收敛为页面级单实例受控模型**：任意时刻整页最多 1 个 Tooltip，用单一 Tooltip Host 渲染“当前 Tooltip 内容槽”（受控触发键/内容/锚点/定位），不再由多个独立 Element Plus Tooltip 各自持有可并存的显示状态。**第二轮（§16.7）复核该单实例受控模型继续为现行规则，仅覆盖范围按 §16.6 收窄：删除异常图标与异常说明类触发项，Tooltip 只展示真实内容。**

- 用途限定（第二轮现行，覆盖本页全部表格 Tooltip）：完整 `CLIENT_DESC`（探针端列，§4.3/§16.3）、完整原始 `DATA_SOURCE_ID`（源库列正常行与回退行同源，§4.4/§16.4）、任意行原始 `SNAPSHOT_STATUS`（§5.2）、单元格超长全文（§4）。Tooltip 不承载“配置缺失/配置停用/类别非 SOURCE/配置已经停用/探针端配置缺失”等异常说明（第二轮起无异常图标与异常说明 Tooltip，见 §5.4/§16.6）（源库列 Tooltip 均只显示完整原始 `DATA_SOURCE_ID`，R2 纠正 R0/R1/批准收口版误记的“完整 ORG”内容）。
- 单实例与关闭（§13.5）：触发新项前先即时关闭旧项；离开触发区域、滚动、窗口缩放、表格数据替换、页面隐藏或卸载即关闭；快速横向/纵向扫过多行始终最多一个。
- 展示（§13.5）：统一短暂显示延迟约 300~350ms 并即时关闭；不可交互（pointer-events none / 非 enterable）；文字简洁、单行为主，仅在完整内容物理宽度超过安全视口时于该极端情况换行保证全文可读与不越界；出现位置贴近目标单元格并对视口四边做**边界避让**（不超出可视区/不被表格容器裁切）；本页表格不混用原生 `title` 浏览器提示；可沿用 Element Plus Tooltip 底层实现，但显示/关闭由页面级受控层统一调度（§13.5）。

### 8.2 可访问性基础

- 快照状态标签具有明确文字（§5.1/§5.2），未知状态保留数据库原始值（§5.2）；探针端非启用红字“停用”是有明确含义的可读文字（§16.3）；状态与页面请求错误信息均有文字表达，颜色不作唯一信息载体（§5.3）。
- 控件可键盘操作、可 Tab 聚焦，有可读标签（“探针端”“源库”“快照状态”“查询”“重置”“立即刷新”“重新加载”）；按钮有 `aria`/title 说明。
- 快照状态标签对辅助技术可读（文本优先）；探针端红字“停用”具有可读文字语义；不只依赖颜色传达状态。本页探针端与源库列**不存在关联异常图标**，因而没有需向辅助技术传达的关联异常图标或异常说明（第二轮现行规则，§5.4/§16.6）。
- 表格区域只读：无可聚焦的操作列元素（§4.6），符合“监控只读”语义。

## 9. UI 状态/事件可测试矩阵与需求/验收映射

下表为可机械/可人工验证的 UI 表现状态，供后续组件测试与浏览器人工验收定位（完整落点矩阵见 DESIGN §14；本表只列 UI 承担项）。全部用例当前 `NOT_RUN`，本设计不执行。

| UI 表现（可测试状态/事件） | 主要承担需求 | 主要承担验收 |
|---|---|---|
| 页面标题/菜单/面包屑为“源库快照状态”（§10） | REQ-001/005 | AC-001/005 |
| 整页只呈现快照状态、无在线/健康/进度语义（§2） | REQ-007/010 | AC-007/009 |
| 无写按钮/操作列/分页（§2/§4.6/§4.7） | REQ-012/021/034 | AC-011/018/031 |
| 查询区三多选＋显式全部＋互斥（§3.1~3.3） | REQ-022 | AC-020/023 |
| 候选来自 RUN_STATE 全量、未知候选动态出现、ghost 保留（§3.2/§3.5） | REQ-024 | AC-022 |
| 重置不查询、改不自动查、点击查询才生效（§3.4/§3.6） | REQ-023/025 | AC-021/024 |
| 七列顺序/序号/行键/时间列 `--`（§4.1/§4.5） | REQ-026/027/031/032/033 | AC-025/029/030/052 |
| 探针端/源库列展示：探针端仅 CLIENT_ID＋非启用红字“停用”＋CLIENT_DESC Tooltip；源库 ORG/回退原始 ID 展示、Tooltip 完整原始 `DATA_SOURCE_ID`；无黄色图标、无异常弱提示（§4.3/§4.4/§5.4/§16.3/§16.4/§16.6） | REQ-028/029/041~044/073/074 | AC-026/027/038~041/074/075/082/083 |
| 状态标签蓝/绿/橙＋文字＋原始值可见（§5.1/§5.2） | REQ-035/036/038/039 | AC-032/033/034/035/037 |
| 默认排序、无表头排序、不分页（§4.7） | REQ-046~049/021 | AC-043~046/018 |
| 工具栏稳定宽度、最近成功刷新时间仅成功更新、失败收敛（§6） | REQ-050/054/061 | AC-047/051/058/068 |
| 每次路由进入三项“全部”自动查询、离开后重新进入不恢复上次现场（§3.1/§3.6） | REQ-023/025 | AC-021/024 |
| 任一请求在途时“查询/立即刷新”禁用、自动抑制、不排队不补发（§3.6/§6.2/§6.4） | REQ-053/054 | AC-050/051/068 |
| 恢复可见空闲立即刷新 / 在途延后单次补发（按届时最新已应用条件）/ 多次可见合并 / 再次隐藏清除（§7.4） | REQ-051/054 | AC-048/051 |
| 加载/空/首次失败/有数据失败/页面隐藏与恢复（§7） | REQ-058/059/060/061/051 | AC-055/056/057/048 |
| 浅色企业后台风格（§1/§2） | REQ-062 | AC-060 |
| 文字非颜色唯一、色弱可读（§5.3/§8） | REQ-063 | AC-061 |
| 浏览器只读目测：标题/七列/查询/刷新/无写/浅色/无 console 错误（§2~§7） | REQ-001/027/050/062 | AC-067 |
| 页面三块清晰分区、结果卡片头部左侧摘要＋右侧刷新组（§2/§13.2） | REQ-066 | AC-069/080 |
| 结果头部左侧 `共 N 条`＋`其中 N 条未知状态`（>0 才显示）（§13.2/§13.3） | REQ-067 | AC-070 |
| 刷新逻辑组整体右对齐、窄宽度整体换行、idle/loading/failure 三态几何稳定（§6.1/§6.2/§13.3） | REQ-068 | AC-071/072 |
| 表格铺满结果卡片、五固定列（序号/快照状态/三时间）＋探针/源库两弹性列（最小 170/280、~170:280 吸收剩余）、最小总宽 1145px、窄屏横向滚动、单行省略（§4/§16.2） | REQ-069/072 | AC-073/080/081 |
| 探针端只显 CLIENT_ID＋Tooltip 仅完整 CLIENT_DESC（非空才弹）＋非启用红字“停用”、缺失静默、无黄色图标（§4.3/§16.3） | REQ-028/073 | AC-026/038/040/074/082 |
| 源库 ORG 单行省略主内容＋Tooltip 完整原始 `DATA_SOURCE_ID`（正常与回退同源）＋缺失/ORG 空回退原始 ID（无异常说明、无黄色图标、无红字“停用”）（§4.4/§16.4） | REQ-029/074 | AC-027/039/040/041/075/083 |
| 页面级单实例受控 Tooltip：最多一个/即时关闭/不越界/无原生 title；第二轮删除异常图标与异常说明触发项后仍最多一个、未知原始值 Tooltip 不回退（§8.1/§13.5/§16.7） | REQ-070 | AC-076/077/086 |
| busy 视觉隔离：仅发起操作 loading、“查询”在刷新在途不闪动且 aria-disabled、无第二请求（§6.2/§13.6） | REQ-071 | AC-078/079 |
| 1440×900、1920×1080 及项目负责人截图宽度下三块/表格铺满/刷新组/单实例 Tooltip 正常（§2~§16） | REQ-066/069/072 | AC-080/081 |
| 探针端下拉 option 展示截断 `CLIENT_ID（CLIENT_DESC）`：ID/描述各 20 Unicode 字符＋`...`、空描述不显示空括号、value 仍完整 CLIENT_ID、单行、不新增 filterable/远程搜索（§3.1/§3.2/§16.5） | REQ-022/024/075 | AC-020/022/084 |
| 下拉控件/面板宽度上限（探针端 240/480、源库 300/560、状态约 200，不超安全视口）、已选标签宽度约束 ellipsis、“全部”完整、ghost 应用同截断且保留“不在候选内”语义（§3.1/§16.5） | REQ-075 | AC-020/022/085 |

## 10. 页面名称、菜单、路由元数据标题与面包屑统一更新

路由 `path` 与前端源码目录**不改**；仅在“用户可见名”四处统一更新为“源库快照状态”（DSS-REQ-001/005，AC-001/005；命名映射见 DESIGN §1/README §6）：

| 位置 | 现状（AS-IS） | 目标（后续实现阶段） |
|---|---|---|
| 路由记录 `frontend/src/router/index.ts`（path `/monitor/data-source-state`，name `DataSourceRunState`） | meta.title“数据源运行状态” | meta.title“源库快照状态”；path/name 不变 |
| 菜单 `frontend/src/config/menu.ts`（“运行监控”组） | “数据源运行状态” | “源库快照状态” |
| 页面标题（替换占位页后 `DataSourceRunStatePage.vue`） | “数据源运行状态”（占位） | “源库快照状态” |
| 面包屑（若展示） | “数据源运行状态” | “源库快照状态” |

- 路由 `path` 保持 `/monitor/data-source-state` 不变，不新增/重命名/改挂（DSS-REQ-003，AC-003）；源码目录保持 `data-source-run-state/` 不变（DSS-REQ-004，AC-004）。
- 本设计**不改动任何现有文件**；上述是待实现阶段的变更清单（DESIGN §3.1 现状、§4.2 建议文件）。命名映射恒等式：路由 `/monitor/data-source-state` ↔ 代码目录 `data-source-run-state/` ↔ Feature slug `data-source-snapshot-status` ↔ 用户可见名“源库快照状态”。

> 一致性：本文件与 DESIGN.md/API.md/DATABASE.md 统一使用接口 `GET /api/monitor/data-source-run-state/list`、参数/字段名、状态 token 与原始值、映射状态、时间格式 `YYYY-MM-DD HH:mm:ss` 与 `--` 空值、错误码与刷新状态机（DESIGN §14.1）。本文件不生成截图/视觉资产；待确认设计项为 0。

## 11. R1 极小定向修订记录（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001-R1`）

ChatGPT 对上一结果提交（`31aa9f5beec7ded3cd798b3af617fd79a1606ed0`）正式复审 `CHANGES_REQUIRED` 后，本界面设计随 DESIGN §16 同步极小定向修订（详情见 DESIGN §16 与执行报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001-R1.md`）：

- **R1-01 每次进入默认“全部”**：明确“每次路由进入/页面实例创建”三项均为“全部”并自动查询；离开路由后重新进入不恢复上次会话/上次实例现场；页面隐藏/恢复与路由离开/重新进入为两类生命周期（§3.1/§3.6/§7.4）。编排去掉 `stores/dataSourceSnapshot.ts`，改由页面/composable 实例内状态承担（§2）。
- **R1-02 请求在途统一禁用/抑制**：任一实际请求在途时“查询”与“立即刷新”按钮禁用（点击不接受、不排队、不补发），自动触发被抑制；被禁用/被抑制触发不视为实际请求、不重置计时、不提示；在途仍可修改三个条件（§3.6/§6.2/§6.4）。
- **R1-03 恢复可见延后单次刷新**：§7.4 重写——空闲恢复可见立即按当前已应用条件刷新并结束后重启 60s；在途仅置一次性 `pendingVisibilityRefresh`，当前请求结束后按届时最新已应用条件补发一次，补发结束才重启 60s；再次隐藏/卸载清除标志不补发；补充可测试场景清单（§7.4/§9）。
- **R1-04 状态元数据**：本文件与四份设计文档保持 `design_status=DRAFT_PENDING_USER_REVIEW`，未批准设计；`pending_user_review=YES`（见 DESIGN §1 与 Feature README）。未改动 API/DATABASE 契约与任何展示字段/映射/排序等业务设计。

## 12. 实现任务完成记录（`DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001`）

2026-09-06 实现任务已按本界面设计完成（§1 元数据 `implementation_status` 同步为 `IMPLEMENTED_PENDING_REVIEW`）：`DataSourceRunStatePage.vue` 已替换占位页为正式“源库快照状态”页；`DataSourceSnapshotQueryBar/Table/Toolbar/StatusTag.vue`、`composables/useDataSourceSnapshot.ts`、`utils/` 与 `api/dataSourceSnapshot.ts`/`types/dataSourceSnapshot.ts` 落地；§10 变更清单中“路由元数据标题/菜单标题/页面标题/面包屑”四处用户可见名已统一为“源库快照状态”（`menu.ts` 本页标题行与 `router/index.ts` 本页标题元数据随实现提交，path 与目录名不变）。界面展示字段/颜色语义/状态与异常弱提示/空态/失败保留/稳定宽度等**业务设计零变化**（相对设计批准内容基准 `61117a62...`）；完整实现与真实浏览器证据见实现报告与 `evidence/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001/`；正式验收 68 条保持 `NOT_RUN`、人工页面验收 `NOT_RUN`。

## 13. 第一轮 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`）

> 本节为**第一轮**验收前 UI 调整草案界面规则（2026-09-07 已批准并实现，历史）。其中凡与第二轮草案冲突处，本轮现行规则以 §16 为准：§13.4 表格固定总宽 `1145px`/七列全固定/宽屏右侧留白已被 §16.2 取代；§13.4/§13.5 中探针端“配置缺失”表达、源库“回退 Tooltip＋异常说明”、黄色异常图标与异常说明 Tooltip 已被 §16.3/§16.4/§16.6/§16.7 删除并收窄为真实内容 Tooltip。不冲突的其余第一轮界面规则继续有效。

### 13.1 范围声明与取代/修订清单

本版为**验收前 UI 调整草案**（2026-09-07，纯文档；未实现、未执行正式验收；草案阶段未批准，已于 2026-09-07 经 ChatGPT 对 R1 结果独立正式复审 `APPROVED` 与项目负责人明确批准，收口为 `APPROVED`，见 §14）。ChatGPT 对实现 R1 提交 `37825272c25c8a2d8a595ff0d5c25c6349186663` 代码复审 `CHANGES_REQUIRED`（表格长文本可读性、浏览器证据不足），项目负责人随后提出更完整的 UI 调整（页面分区、结果卡片头部、刷新组、固定列宽、单实例 Tooltip、busy 视觉隔离）。本轮只调整**展示层**：不改接口、SQL、表结构、数据库访问与产品只读边界（API.md/DATABASE.md 整文件零差异）；不改业务语义（排序/状态映射/序号/行键/空值/不补行/单飞行 busy 抑制/计时器/可见性补发等）。已批准界面设计基线保留为历史；批准的是本轮 UI 调整界面设计，不代表本轮调整已实现、正式验收已执行或通过。

对本文件既定小节的取代/修订清单（实现阶段以本节 + 被修订小节为准）：

| 影响小节 | 本轮调整 | 对应新增需求/验收 |
|---|---|---|
| §2 页面整体结构 | 三块清晰分区；标题与功能说明同一页头语义区；查询/结果各为独立卡片 | DSS-REQ-066，AC-069 |
| §6 刷新工具栏 | 刷新控件收敛为结果卡片头部右侧不可拆散“刷新逻辑组”，整组靠右、窄宽度整体换行 | DSS-REQ-068，AC-071/072 |
| §4 列宽与 §4.3/§4.4 单元格 | 目标固定列宽（源库宽于探针端、三时间固定宽）；探针端只显 CLIENT_ID、源库正常只显 ORG；Tooltip 全文；缺失/ORG 空回退原始 ID | DSS-REQ-069 + REQ-028/029 修订，AC-073/074/075 |
| §8.1 Tooltip | 页面级单实例受控模型 | DSS-REQ-070，AC-076/077 |
| §6.2 与刷新 busy | busy 视觉隔离（仅发起操作 loading、“查询”不闪动且 aria-disabled、无第二请求） | DSS-REQ-071，AC-078/079 |
| 头部左侧 | 结果摘要 `共 N 条`＋`其中 N 条未知状态`（>0 才显示） | DSS-REQ-067，AC-070 |

### 13.2 页面三块结构与结果卡片头部（DSS-REQ-066/067）

- **三块分区**：页面自上而下为 ① 页头语义区（标题“源库快照状态”＋功能说明；功能说明表达“探针端与源库组合的初始快照阶段状态、页面只读”，不得加在线/健康/同步进度等推断；清楚但不过度抢眼的信息提示表现）、② 查询卡片（独立白色容器、边框/圆角、合理内边距与上下间距；含探针端/源库/快照状态三多选与查询、重置）、③ 结果卡片（独立白色容器；头部与主体之间清晰轻量分隔）。背景/边框/圆角/阴影/间距与 app-shell 及 Element Plus 浅色企业后台一致，不引入另一套视觉体系。
- **结果卡片头部**：左侧放结果摘要，右侧放刷新逻辑组（§13.3）。
- **头部左侧结果摘要**：展示当前成功结果总数 `共 {records.length} 条`；当 `records` 中含 `statusCategory=UNKNOWN`（计数 `unknownCount`>0）时其后追加轻量橙色提示 `其中 {unknownCount} 条未知状态`（只统计接口返回 `statusCategory=UNKNOWN`，不推断健康/错误）；为 0 时不显示。既有行内关联异常提示保留，头部不做复杂多类别汇总。
- 本 Feature 最多约 100 行继续不分页；参考图若含分页，本页不因此增加分页。

### 13.3 结果卡片头部右侧不可拆散刷新逻辑组（DSS-REQ-068）

- 刷新逻辑组为**不可拆散单一逻辑组**，靠右排列，按序含：灰色状态圆点（刷新在途变蓝色动态；圆点只是伴随状态，文字是主要信息载体）→ `60 秒自动刷新` → 分隔符 → `最近成功刷新：HH:mm:ss`（从未成功为 `--`）→ “立即刷新”按钮。
- 不以“说明文案靠左、按钮单独靠右”的方式拆散；宽度不足时**整组换行**，禁止只把“立即刷新”按钮单独挤到下一行。
- **三态几何稳定**：刷新组在 idle / loading(在途) / failure 三态下，“立即刷新”按钮宽度恒定，加载图标出现/消失不改变按钮宽度、不移动按钮本身、前方文案与“最近成功刷新”时间；刷新失败提示置于不会推动刷新组关键元素的稳定槽位（固定高度/替换性文本槽），出现/消失不造成工具栏明显水平跳动。
- 语义沿用已批准设计（§6）：自动/立即刷新均按“已应用查询条件”取数；最近成功刷新时间仅成功刷新后更新；失败约 60 秒自动重试；在途抑制/禁用不提示不补发。
- 刷新状态圆点表示**所有刷新类请求**（`manual/auto/restore`）在途，变蓝动态只是伴随状态、颜色不是唯一信息载体；刷新类请求的按钮 loading 映射（完整六类请求视觉映射见 §13.6）：`manual`（点击“立即刷新”）→ 仅“立即刷新”按钮显示 loading，且刷新状态圆点变蓝并呈刷新动态；`auto`（60 秒自动刷新）与 `restore`（恢复可见刷新）→ **只让刷新状态圆点变蓝并呈刷新动态，不让“立即刷新”按钮显示 loading**，“立即刷新”与“查询”按钮外观稳定、均不显示 loading。

### 13.4 第一轮：七列固定列宽与单元格展示（DSS-REQ-069，修订 REQ-028/029）

> **第二轮取代声明（历史章节内已批准事实，非现行规则）**：本小节“探针端 `170px`/源库 `280px` 固定列宽与表格固定总宽 `1145px`（宽屏右侧留白由该固定总宽造成）”已被第二轮 §16.2 取代（表格铺满结果卡片、探针端/源库改为弹性列并吸收剩余宽度、取消固定总宽）；本小节探针端“探针配置缺失仍显示原始 `CLIENT_ID` 且 Tooltip/异常提示能表达‘探针端配置缺失’、停用保留轻量异常说明”与源库“Tooltip 显示完整原始 ID 及对应异常说明、停用/类别异常轻量异常语义保留”等黄色图标/异常语义已被第二轮 §16.3/§16.4/§16.6 删除（缺失/停用/类别异常不再以黄色图标或异常文字提示；仅探针端非启用保留红字“停用”，见 §16.3）。本节其余内容为第一轮已批准并实现的历史界面规则，保留备查。另：正常源库行 Tooltip 在第一轮显示完整 `DATA_SOURCE_ORG`，第二轮 R0/R1/批准收口版误记延续该 ORG 规则；现由 R2 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2` 纠正为悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（正常行与回退行同源，见 §16.4/§16.6/§16.7）。

七列顺序与状态/时间排序、状态映射、序号规则、行键、空值规则和“不补行”边界**不变**；目标固定列宽（§4 表格）：

- 序号 `70px` 居中；探针端 `170px` 左、单行；源库 `280px` 左、单行（**必须明显宽于探针端列**）；快照状态 `130px` 居中；快照启动时间/快照完成时间/记录更新时间各 `165px` 左（固定格式 `YYYY-MM-DD HH:mm:ss`，空值 `--`）。
- 三个时间列长度固定、使用固定列宽，不把多余空间平均摊给时间列；表格过宽时允许**表格容器横向滚动**，不通过换行挤压时间或主要文本。
- **探针端列**：只显示原始 `CLIENT_ID`（单行、超出列宽省略号）；完整 `CLIENT_DESC` 经悬停单实例 Tooltip（§13.5）展示；描述为空时不弹空 Tooltip；探针配置缺失仍显示原始 `CLIENT_ID` 且 Tooltip/异常提示能表达“探针端配置缺失”；停用保留轻量异常说明。
- **源库列**：正常关联且 ORG 非空时只显示 `DATA_SOURCE_ORG`（单行、超出列宽省略号），悬停 Tooltip 显示完整 ORG，**不以原始 `DATA_SOURCE_ID` 作为正常行 Tooltip 默认内容**；源库配置缺失或 ORG 为空时**回退显示原始 `DATA_SOURCE_ID`（不得空白）**，Tooltip 显示完整原始 ID 及对应异常说明；停用、类别非 SOURCE（大小写不敏感归一）等既有轻量异常语义保留。
- 表格内不使用与受控 Tooltip 并存的原生 `title`。

### 13.5 第一轮：页面级单实例受控 Tooltip（DSS-REQ-070）

> **第二轮取代声明（历史章节内已批准事实，非现行规则）**：本小节状态模型（单实例受控、key、统一延迟、关闭事件、不可交互、边界定位、生命周期）继续为现行设计（第二轮 §16.7 复核不变）；覆盖范围中“探针/源库缺失/停用/类别异常图标说明”等异常说明项已被第二轮 §16.6/§16.7 删除——第二轮现行 Tooltip 只展示真实内容：探针端列完整 `CLIENT_DESC`（非空才弹）、源库列完整原始 `DATA_SOURCE_ID`（正常行与回退行同源；本句“源库列完整 ORG 或完整回退原始 ID”系 R2 前误记，已由 R2 `...-002-R2` 纠正）、未知快照状态列完整原始值；无异常图标、无异常说明 Tooltip。

- 页面任意时刻最多显示 **1 个 Tooltip**，覆盖本页全部表格 Tooltip（第一轮历史范围含探针端描述、完整源库 ORG、未知状态原始值、探针/源库缺失/停用/类别异常图标说明等；第二轮现行范围见 §16.6）。
- **状态模型**：页面/composable 持一个受控“当前 Tooltip 内容槽” `currentTooltip = { key, content, anchor, placement } | null`，由单一 Tooltip Host 渲染；key 为稳定触发键（cell 定位或异常图标定位），key 相同不重复弹出。
- 触发新 key 前先置 `currentTooltip=null`（即时关闭旧项），不允许旧项与新项同时残留；快速横向/纵向扫过多行始终最多一个。
- **显示延迟统一约 300~350ms**，离开触发区在延迟窗内即取消，随后即时关闭；不依赖多个独立 Element Plus Tooltip 各自延迟并存。
- **关闭事件**：离开触发元素/触发 key 变化、滚动（页面或表格容器）、窗口缩放（resize）、表格数据替换（records 变化）、页面隐藏（visibilitychange）、组件卸载（unmount）均置空并清除延迟/定位定时器。
- **不可交互**：pointer-events none / 非 enterable，避免鼠标进入 Tooltip 本体遗留。
- **边界定位**：对视口四边做边界避让，不超出可视区、不被表格容器 overflow 裁切（Teleport 到合适层）；内容优先单行，仅当完整内容物理宽度超安全视口时于该极端情况换行保证全文可读与不越界。
- **混用禁止**：表格不使用原生 `title` 浏览器提示，展示来源唯一为受控 Tooltip。

### 13.6 请求类型视觉映射与 busy 视觉隔离（DSS-REQ-071）

- **业务规则不变**：单飞行、忙碌抑制、不并发、不排队、不补发（已批准 §3.6/§6.2/§6.4 与 DESIGN §7.5/§9）。
- **六类请求页面视觉反馈（唯一现行规则，与 `DSS-REQ-071`、DESIGN §19.6 一致）**：
  1. `initial`（页面首次进入自动加载）：表格区域显示 loading；“查询”与“立即刷新”按钮外观稳定、不显示 loading。
  2. `retry`（首次加载失败后点击“重新加载”）：只有错误区“重新加载”按钮显示 loading；“查询”与“立即刷新”不显示 loading。
  3. `query`（用户点击“查询”）：只有“查询”按钮显示 loading；“立即刷新”外观稳定且不显示 loading。
  4. `manual`（用户点击“立即刷新”）：只有“立即刷新”按钮显示 loading，刷新状态圆点变蓝并呈刷新动态；“查询”外观稳定且不显示 loading。
  5. `auto`（60 秒自动刷新）：**只激活刷新状态圆点**（变蓝并呈刷新动态），不让“立即刷新”按钮显示 loading；“查询”与“立即刷新”按钮外观稳定、均不显示 loading。
  6. `restore`（页面恢复可见后立即或延后单次刷新）：**只激活刷新状态圆点**（变蓝并呈刷新动态），不让“立即刷新”按钮显示 loading；“查询”与“立即刷新”按钮外观稳定、均不显示 loading。
- **统一约束**：① `busy` 功能语义不变——任一实际请求在途期间新查询与新刷新均不可发起，鼠标与键盘都不能产生第二个请求；② 非本次请求发起控件不得显示 loading、变灰闪动、按压动画或其他“好像被点击”的反馈；③ 被功能性抑制但视觉保持稳定的按钮必须具正确 `aria-disabled` 语义，并同时阻止鼠标与键盘激活；④ 刷新状态圆点表示所有刷新类请求（`manual/auto/restore`）在途，颜色不是唯一信息载体；⑤ `initial/retry/query` 不得错误点亮刷新状态圆点；⑥ 不能通过允许并发、取消当前请求后偷换为查询、排队查询或静默补发来解决视觉问题。
- 点击“立即刷新”时网络层只有一次按当前已应用条件发出的刷新请求、无额外查询请求（证明目标见 AC-078）；busy 期间鼠标/键盘都不能制造第二个并发请求（AC-079）。

### 13.7 预计受影响实现文件（仅列示，本任务为纯文档一律零修改）

预计（最终以实现任务为准）：`frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（三块分区/结果卡片容器与头部布局）；`components/DataSourceSnapshotToolbar.vue`（刷新逻辑组布局、三态几何稳定、失败提示稳定槽位、busy 视觉隔离配合）；`components/DataSourceSnapshotTable.vue`（固定列宽、单行省略、CLIENT_ID/ORG 与回退展示、受控 Tooltip 触发点、去掉原生 title）；`components/DataSourceSnapshotQueryBar.vue`（如需配合“查询”不闪动）；`composables/useDataSourceSnapshot.ts`（受控 Tooltip 当前槽与独立 querying/refreshing 标志等，最终随实现确定）。不改：后端代码、`API.md`/`DATABASE.md` 契约、既有证据、`topic-offset` 或其它页面（本 Feature 调整经实现与复审通过后才提炼项目级列表页标准，另立任务）。

### 13.8 状态与自检摘要

- 对应需求：`DSS-REQ-066~071`（新增，见 REQUIREMENTS §21）；定向修订 `DSS-REQ-028/029/050`。
- 对应验收：`DSS-AC-069~080`（新增，见 ACCEPTANCE §4.18，全部 `NOT_RUN`）；定向修订 `DSS-AC-026/027/068`。
- 状态：本轮 UI 调整草案（§13）已经 ChatGPT 对 R1 结果提交 `5757237...` 独立正式复审 `APPROVED` 且项目负责人明确批准，`design_status(DESIGN/UI)` 当前调整版本由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07，见 §14）；本轮 UI 调整已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`（2026-09-07）落地（实现记录见 §15）、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`；验收执行 `NOT_RUN`；人工页面验收 `NOT_RUN`；`pending_user_review=NO`；`pending_user_confirmation_count=0`。
- 设计补充/一致性：DESIGN §19/§20（本轮 UI 调整草案设计记录与批准收口记录，§14.2/§14.3 追踪更新）。API/DATABASE 契约零变化。本轮 UI 调整实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`（2026-09-07）已完成落地（实现记录见本文件 §15、实现报告与 Feature README §5 关联行）；下一入口为 ChatGPT 独立代码与证据复审，然后由项目负责人人工查看页面。
- 历史范围说明（第二轮现行入口以 §16 为准）：本节 §13 为**第一轮** UI 调整草案的自检摘要，其中“已批准收口为 `APPROVED`”“实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`”等均为第一轮时点结论（历史）。项目负责人对第一轮 UI 调整实现 R1（`5933ec2...`）对应预览页人工检查结论为 `CHANGES_REQUIRED`，据此建立第二轮纯文档草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`；第二轮对应界面规则以本文件 §16 为现行入口，当前各状态以 §1/§16.9 为准（`design_status(UI)`/`requirements_status`/`acceptance_status`=`APPROVED`（第二轮 UI 调整版本曾批准收口为 `APPROVED`，正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17...`，2026-09-08，见 §17，作为历史批准事实保留）；因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`、R2 `...-002-R2` 纠正并重新进入复审、R3 记录纠正 `...-002-R3` 后经 ChatGPT 独立正式复审 `APPROVED` 与项目负责人明确“批准”重新批准收口为 `...-APPROVAL-002-R1`（批准内容基准提交 `cf40b5d...`，2026-09-08，见 §18），实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`、验收 86 条全部 `NOT_RUN`、`pending_user_review=NO`、`pending_user_confirmation_count=0`），不得把 §13 第一轮自检写成第二轮结论。

## 14. 第一轮 UI 调整版本批准收口记录（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`）

- 本轮验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`，§13）及其 R1 定向修订（`...-001-R1`）已批准收口：ChatGPT 对 R1 结果提交 `575723711ca39d7761df308c1c99b1e6e957cf70` 独立正式复审 `APPROVED`，项目负责人随后明确回复“批准”（批准日期 2026-09-07）。本批准只更新 `DESIGN.md`/`UI.md`/`REQUIREMENTS.md`/`ACCEPTANCE.md` 当前 UI 调整版本状态为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`）并作文档级收口记录；相对批准内容基准，本 UI §13 全部界面细则零差异，DESIGN §19 全部设计内容与 §14.2/§14.3 追踪矩阵（需求 71/71、验收 80/80）业务内容零差异；`API.md`/`DATABASE.md` 整文件零差异。实现状态保持 `IMPLEMENTED_ADJUSTMENT_PENDING`（本轮调整未实现）、验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`pending_user_review=NO`、`pending_user_confirmation_count=0`。批准的是本轮 UI 调整界面/设计基线，不代表本轮调整已实现、正式验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`。下一入口为另立 UI 调整实现任务（按 DESIGN §19/§20 与本 §13 落地）。完整批准收口自检见报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001.md`。（本记录为第一轮批准收口时点描述，其中需求 71/71、验收 80/80 与实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING` 均为当时状态；当前为第二轮草案，§1/§16.9 各状态与 §9 落点矩阵 75/75、86/86 为准。）

## 15. 第一轮 UI 调整版本实现任务完成记录（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`）

- 2026-09-07，本轮 UI 调整实现任务（前端只读 UI 调整，授权基线提交 `19e405bc2c88b091abe1c04229daa37a7d4175d1`）已按批准内容基准提交 `5757237...`（本文件 §13/DESIGN §19）完成落地并提交：页头语义区＋独立查询卡片＋独立结果卡片三块清晰分区、结果卡片头部左侧摘要（`共 N 条`/`其中 N 条未知状态`）与右侧不可拆散刷新逻辑组三态几何稳定、七列固定列宽、探针端单行省略＋悬停 Tooltip、源库 ORG/回退原始 ID 展示、页面级单实例受控 Tooltip（统一显示/关闭与生命周期、无原生 title）、六类请求（`initial/retry/query/manual/auto/restore`）唯一视觉映射与 busy 视觉隔离（按 §13.2~§13.6 落地）。
- 本节仅作文档级实现记录（需求 71/71、验收 80/80 为第一轮实现时点数值，历史）：相对本轮批准内容基准 `5757237...`，本文件 §13 全部界面细则零差异，DESIGN §19 设计内容与 DESIGN §14.2/§14.3 追踪矩阵（需求 71/71、验收 80/80）零差异，`API.md`/`DATABASE.md` 整文件零差异；改动源码限定在实现任务白名单（`frontend/src/views/data-source-run-state/**` 等，见实现报告）。
- 验证：专项前端测试 120 通过、前端全量 726/726、`vue-tsc`＋Vite 构建成功、1440×900 与 1920×1080 真实浏览器视觉验证（截图见实现任务证据目录）；未执行正式验收、未把开发自测写成 PASS。完整实现落点/测试/构建/浏览器证据见实现报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001.md`。
- 实现状态当前 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（第一轮 UI 调整已实现、待 ChatGPT 独立代码与证据复审与人工页面验收）、正式验收执行 `NOT_RUN`、当时 80 条 `DSS-AC-*` 保持 `NOT_RUN`、人工页面验收 `NOT_RUN`（第一轮时点状态，历史；当前为第二轮草案，验收 `DSS-AC-001~086` 共 86 条全部 `NOT_RUN`，见 §1/§16.9）；下一入口为 ChatGPT 独立代码与证据复审，然后由项目负责人人工查看页面，正式验收另立任务执行。

## 16. 第二轮 UI 调整草案界面规则（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`）

### 16.1 范围声明与取代/修订清单

本版为**第二轮验收前 UI 调整草案**（2026-09-08，纯文档；第二轮调整未实现、正式验收未执行；草案阶段未批准，已于 2026-09-08 经 ChatGPT 对 R1 结果独立正式复审 `APPROVED` 与项目负责人明确“批准”，收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，见 §17，作为历史批准事实保留）；批准收口后发现批准内容把正常源库行 Tooltip 误记为完整 `DATA_SOURCE_ORG`、与负责人真实需求（悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`）冲突，故 R2 极小纠正 `...-002-R2` 后本版重新进入复审，R3 记录纠正 `...-002-R3` 后经 ChatGPT 独立正式复审 `APPROVED`、项目负责人明确“批准”，本版重新批准收口为 `APPROVED`（重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d...`，2026-09-08，当前状态见 §1/§16.9、批准与纠正记录见 §17/§18）。驱动：

- **不改**：接口 `GET /api/monitor/data-source-run-state/list` 请求/响应、`clientRef.state`、`sourceRef.state`、`sourceRole`、`statusCategory`/原始状态值映射、候选生成与去重（含 ghost 保留）、排序、时间格式与 null、行键、错误码、计时器/恢复可见/单飞行 busy 业务抑制与读取边界；后端与数据库零改动；`API.md`/`DATABASE.md` 整文件零差异。
- **本轮取代/修订清单**（第二轮现行规则对本节历史表述构成取代；未列出且与本轮不冲突的历史规则继续有效）：
  - §13.4“七列全部固定列宽”与表格容器固定 `width:1145px` → 五固定列＋探针端/源库两弹性列＋表格铺满结果卡片（§16.2）。
  - §13.4/§4.3 历史中“探针端配置缺失/配置已停用”黄色异常图标与异常弱提示 → 全部删除；探针端只判存在/`FG_ACTIVE`（§16.3）。
  - §13.4/§4.4 历史中“源库配置缺失/配置已停用/类别非 SOURCE”黄色异常图标与 Tooltip 异常说明 → 全部删除；源库按 ORG 或回退原始 ID 展示（§16.4）。
  - §13.4 源库行 Tooltip 历史与 R2 纠正说明（R0/R1/批准收口版曾表述“第二轮不制造差异、正常行仍显示完整 ORG”，该表述把正常源库行 Tooltip 误记为完整 `DATA_SOURCE_ORG`，已由 R2 纠正）：正常源库行 Tooltip 在第一轮与第二轮 R0/R1/批准收口版均记录为完整 `DATA_SOURCE_ORG`（历史）；R2 `...-002-R2` 极小纠正后现行规则为——正常源库行 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（与回退行同源，§16.4/§16.6/§16.7，对应 `DSS-REQ-029` 修订、`DSS-REQ-074`）；回退行（源库配置缺失或 ORG 为空）Tooltip 不再追加“配置缺失”等异常说明，只显示完整原始 `DATA_SOURCE_ID`（§16.4）。
  - 第一轮曾纳入单实例 Tooltip 覆盖范围的关联异常图标说明 → 随黄色图标删除取消，不再属于覆盖范围（§16.6/§16.7）。
  - §3.1/§3.2 探针端候选 option 展示边界 → 增补 ID/描述各 20 Unicode 字符截断与控件/面板宽度上限（§16.5）。
- **对应需求**：新增 `DSS-REQ-072~075`（REQUIREMENTS §21.2），定向修订 `DSS-REQ-022/024/028/029/041/042/043/044/045/069/070`（REQUIREMENTS §21.3）。
- **对应验收**：新增 `DSS-AC-081~086`（ACCEPTANCE §4.19，全部 `NOT_RUN`），定向修订 `DSS-AC-020/022/026/027/038/039/040/041/042/073/074/075/076/077/080`。全部 86 条 `DSS-AC-*` 保持 `NOT_RUN`。
- 状态：本轮（第二轮）UI 调整草案（§16）及其 R1 极小定向修订（`...-002-R1`）曾于 2026-09-08 批准收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17...`，2026-09-08，见 §17；详见 §1 与 REQUIREMENTS/ACCEPTANCE），该批准作为历史批准事实保留；因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`、与负责人真实需求（悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`）冲突，R2 极小纠正 `...-002-R2` 后重新进入复审，R3 记录纠正 `...-002-R3`（提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`）只修正 R2 审计记录与未来实现锚点，ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED`、项目负责人明确回复“批准”，当前第二轮 R2/R3 纠正版重新批准收口为 `APPROVED`（重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d...`，2026-09-08）。重新批准只代表本轮第二轮调整基线获批：`design_status(UI)`/`requirements_status`/`acceptance_status`=`APPROVED`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`（本轮调整尚未实现）、正式验收执行 `NOT_RUN`（`DSS-AC-001~086` 全部 `NOT_RUN`）、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=NO`、`pending_user_confirmation_count=0`。第一轮批准并实现的版本保留为历史（§13/§14/§15）。不得把重新批准写成第二轮调整已实现、已通过人工页面检查或正式验收（`IMPLEMENTED`/`IMPLEMENTED_ACCEPTED`/`PASS`/`ACCEPTED`）。

### 16.2 表格铺满结果卡片与列弹性界面规则（DSS-REQ-072）

- 现行规则取消第一轮实现残留的表格容器固定 `width:1145px`（不得保留），表格必须在结果卡片正文可用宽度上**铺满**，右边缘贴合卡片正文右侧边界，不留截图所示大块空白，且不引起结果卡片头部（左摘要/右刷新逻辑组）位移（DSS-REQ-072；验收 `DSS-AC-073/080/081`）。
- 七列顺序保持不变（`DSS-REQ-027`）。列宽模型从“七列全固定”改为**五列固定＋探针端/源库两列弹性**：
  - 固定列（不参与宽屏剩余空间分配）：序号 `70px` 居中；快照状态 `130px` 居中；快照启动时间/快照完成时间/记录更新时间各 `165px` 左对齐（固定格式与空值规则不变，见 §4.5；长度固定、不把多余空间平均摊给时间列）。
  - 弹性列（当结果卡片正文宽度大于最小总宽时吸收全部剩余宽度）：探针端最小宽度 `170px`；源库最小宽度 `280px`（源库明显宽于探针端，延续“源库列宽于探针端”约束）；单行 ellipsis。
  - 五固定列合计 `70+130+165+165+165=695px`，加两弹性列最小宽度 `170+280=450px`，表格**最小总宽度 `1145px`** 不变。
- 宽屏分配：卡片正文宽度 > `1145px` 时，剩余宽度 `extra = 卡片正文宽 − 1145px` 全部在探针端/源库两弹性列之间按 `170:280` 相对权重分配（等价实现可按 Element Plus 弹性列 `min-width`＋table layout：固定列给确定宽度、探针端/源库 `min-width` 取 `170px`/`280px` 并允许增长）；固定列不得参与剩余空间分配。
- 窄屏：卡片正文宽度 < `1145px` 时允许表格容器横向滚动（h-scroll），不压缩固定时间列、不换行挤压主要文本；单元格仍为单行 ellipsis。
- 目标视口：约 `1440×900`、`1920×1080` 及项目负责人当前截图对应宽度下，表格右边缘贴合结果卡片正文右侧可用边界、无右侧大块空白，头部布局不位移。
- 只改变前端布局；不改排序、序号生成、行键、空值、状态标签与时间格式（§4.1/§4.5/§4.7 不变）。

### 16.3 探针端列展示简化界面规则（DSS-REQ-073）

- 主内容：始终渲染原始 `CLIENT_ID`，单行、超出弹性列宽（最小 `170px`）省略号；不把 `CLIENT_DESC` 同行或次行内联展示（DSS-REQ-028 修订、DSS-REQ-073，AC-026/074/082）。
- Tooltip：仅当关联探针存在完整 `CLIENT_DESC` 且非空时悬停显示完整 `CLIENT_DESC`；描述为空/探针配置不存在/无法取得描述时不弹 Tooltip（不弹空 Tooltip）；Tooltip 内不得出现“配置已经停用”“探针端配置缺失”或任何异常说明文字。
- 删除探针端列全部黄色异常图标：启用/非启用/`NOT_FOUND`/描述为空等任意行均不得出现黄色符号（原 `DSS-REQ-045` 黄色图标语义在本列删除）。
- 展示层只额外判断关联探针 `FG_ACTIVE`（不改变接口已有 `clientRef.state`、后端映射与数据库读取规则）：
  - `FG_ACTIVE='1'`（启用）：仅显示 `CLIENT_ID`；
  - 非 `'1'`（含 `'0'` 及数据库宽容归一后判为非启用的值）：显示 `CLIENT_ID`＋一个空格＋红色普通文字“停用”（红字普通文本，非图标、非按钮/链接/可操作标签、不新增列）；
  - 找不到探针配置（`NOT_FOUND`）：仅显示原始 `CLIENT_ID`（缺失静默，无“缺失”文字、无黄色图标、无异常说明）。
- 探针端不做类别判断，只判存在/停用。验收 `DSS-AC-026/038/040/074/082`。

### 16.4 源库列展示简化界面规则（DSS-REQ-074）

- 正常有关联（`sourceRef.state=ACTIVE`）且 `DATA_SOURCE_ORG` 非空：主内容只显示 `DATA_SOURCE_ORG`（单行 ellipsis），悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（正常行与回退行同源；R2 纠正 R0/R1/批准收口版误记的“完整 `DATA_SOURCE_ORG`”规则，不取 `DATA_SOURCE_ORG`、不拼接 ORG＋ID）（DSS-REQ-029 修订、DSS-REQ-074，AC-027/075/083）。
- 配置不存在（`NOT_FOUND`）或 `DATA_SOURCE_ORG` 为空：主内容回退显示完整原始 `DATA_SOURCE_ID` 的单行 ellipsis（不显示空白），悬停 Tooltip 显示完整原始 `DATA_SOURCE_ID`。
- 删除源库列全部黄色异常图标；Tooltip 不得追加“配置缺失”“配置停用”“类别非 SOURCE”等异常说明文字；不采用两行 ORG＋ID 布局。
- 源库停用/类别异常（含类别大小写不敏感归一）/配置缺失时仍保留 RUN_STATE 行并按 ORG/回退原始 ID 正常展示；源库列不出现红色“停用”（红色“停用”仅用于探针端非启用 `FG_ACTIVE`，见 §16.3）。
- 只改变前端展示；不改 `sourceRef.state`、`sourceRole`、后端映射、候选来源或数据库读取规则。验收 `DSS-AC-027/039/040/041/075/083`。

### 16.5 探针端查询下拉框长度与文本截断、宽度约束界面规则（DSS-REQ-075）

- 候选 option 展示为 `CLIENT_ID（CLIENT_DESC）` 组合，两段均确定性截断且**只影响展示**：
  - `CLIENT_ID` 最多展示前 20 个 Unicode 字符，超出追加英文 `...`；`CLIENT_DESC` 最多展示前 20 个 Unicode 字符，超出追加 `...`；
  - 截断按 Unicode code point（或等价 code-point 安全方式）处理，禁止按 JavaScript UTF-16 code unit 切分拆开代理对；
  - 描述为空时只显示截断后的 ID，不显示空括号。
- option 的 `value` 仍是完整原始 `CLIENT_ID`；点击查询提交完整 `CLIENT_ID`；API、响应对象、候选去重、已应用条件与 ghost 保留均使用完整值；不修改、不截断后端数据。当前控件未开启可输入过滤，本轮**不得新增** `filterable`、远程搜索或其他查询能力。
- 闭合后已选标签做宽度约束与 ellipsis，不得因超长 ID/描述撑大选择框或推动其后条件与按钮；底层选中值仍为完整 ID。
- 下拉项保持单行：先执行 ID/描述各 20 字符逻辑截断，再以 CSS `text-overflow:ellipsis` 作为面板极窄或字体差异下的最终保护。
- 宽度约束（延续“探针端列表/控件短于源库”的既有约束）：
  - 探针端选择控件建议宽度 `240px`、下拉面板目标最大宽度 `480px`，且不超过 `calc(100vw - 16px)` 安全视口宽度；需专属 `popper-class` 时使用本 Feature 命名空间，禁止污染全局选择器。
  - 源库选择控件建议宽度 `300px`、下拉面板目标最大宽度 `560px`，也不得超过安全视口宽度。
  - 快照状态选择控件维持约 `200px`。
- “全部”选项完整显示；ghost（不在候选内）候选应用相同 ID 截断规则，但“不在候选内”的既有语义不得丢失。
- 验收 `DSS-AC-020/022/084/085`。

### 16.6 展示矩阵与 Tooltip 内容来源汇总（第二轮现行）

| 行/控件 | 主内容 | 追加文字/标记 | Tooltip（完整内容） |
|---|---|---|---|
| 探针端·启用 | 原始 `CLIENT_ID`（单行 ellipsis） | 无 | 完整 `CLIENT_DESC`（非空才弹） |
| 探针端·非启用（`FG_ACTIVE`≠`'1'`） | 原始 `CLIENT_ID`＋一个空格＋红字“停用” | 红字“停用”（普通文本，非图标/按钮） | 完整 `CLIENT_DESC`（非空才弹） |
| 探针端·`NOT_FOUND` | 原始 `CLIENT_ID` | 无（缺失静默） | 无（描述不可得时不弹） |
| 源库·正常且 ORG 非空 | `DATA_SOURCE_ORG`（单行 ellipsis） | 无 | 完整原始 `DATA_SOURCE_ID` |
| 源库·`ORG` 空/`NOT_FOUND` | 完整原始 `DATA_SOURCE_ID`（单行 ellipsis，回退） | 无 | 完整原始 `DATA_SOURCE_ID` |
| 源库·`INACTIVE`/类别非 SOURCE | 按上两行规则（ORG 或原始 ID 回退）正常展示，保留行 | 无黄色图标、无红字“停用”、无异常文字 | 同上（无异常说明追加） |
| 快照状态（已知/未知） | 标签（不变，§5） | 未知标签样式不变 | 未知快照状态完整原始状态值（不变） |

- 本页任何表格 Tooltip 均不承载“配置缺失/配置停用/类别非 SOURCE/配置已经停用/探针端配置缺失”等异常说明。
- 黄色异常图标在探针端/源库列表格中全部取消（本 Feature 全部表格不再以黄色图标表达关联异常）。
- 各 Tooltip 内容源只取真实数据（`CLIENT_DESC`、原始 `DATA_SOURCE_ID`、未知原始状态值），不拼接任何异常语义文本；`DATA_SOURCE_ORG` 只作为源库列主内容，不进入 Tooltip。

### 16.7 页面级单实例 Tooltip 不变契约复核（第二轮现行）

- §13.5 的页面级单实例受控 Tooltip 状态模型（当前 Tooltip 内容槽 `{key,content,anchor,placement}`、单 Host、key 变化先关后开、统一延迟约 300~350ms、延迟窗内离开取消、统一关闭事件集、不可交互 pointer-events:none、边界定位、随页面实例生命周期）继续为现行规则，第二轮不改变该状态模型。
- 覆盖范围按 §16.6 收窄：探针端列完整 `CLIENT_DESC`、源库列完整原始 `DATA_SOURCE_ID`（正常行与回退行同源）、未知快照状态完整原始值；删除异常图标与异常说明类触发项后，页面 Tooltip 仍满足“任意采样时刻至多 1 个”，未知原始值 Tooltip 不回退（`DSS-AC-086`）。
- 表格中不得混用可能与受控 Tooltip 同时出现的原生 `title` 浏览器提示；Tooltip 优先单行展示，完整内容物理宽度超安全视口才在极端情况换行；对视口四边做边界避让，不超出可视区、不被表格容器裁切。

### 16.8 预计受影响实现文件（仅列示，本任务为纯文档一律零修改）

前端（预计，最终以实现任务为准）：`frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（结果卡片/表格容器铺满与页面组合）；`components/DataSourceSnapshotTable.vue`（列宽模型改五固定＋两弹性、探针端/源库单元格内容与 Tooltip 触发内容、删除黄色图标）；`components/DataSourceSnapshotQueryBar.vue`（探针端下拉 option label 的 Unicode 安全截断、selected tag 视觉约束、控件与 popper 宽度）；`tooltip/useSnapshotTooltip.ts`（仅在实现确有必要时调整页面级单实例 Tooltip 状态或内容切换；若现有通用状态逻辑已满足则保持不变）；`composables/useDataSourceSnapshot.ts`（**不属于本轮预计修改文件**；查询、已应用条件、刷新、单飞行与计时器状态机必须保持不变）。不改：后端代码、`API.md`/`DATABASE.md`、既有证据、候选来源与去重逻辑、其它页面。

### 16.9 状态与自检摘要

- §1 元数据各状态与落点：本轮（第二轮）UI 调整草案（§16）及其 R1 极小定向修订（`...-002-R1`）曾于 2026-09-08 批准收口：`design_status(UI)`/`requirements_status`/`acceptance_status`=`APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17...`，2026-09-08，见 §17，作为历史批准事实保留）；因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`、与负责人真实需求冲突，R2 极小纠正 `...-002-R2` 后重新进入复审、R3 记录纠正 `...-002-R3` 后经 ChatGPT 独立正式复审 `APPROVED`、项目负责人明确“批准”，当前第二轮 R2/R3 纠正版重新批准收口为 `APPROVED`（重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d...`，2026-09-08，见 §17/§18）：`design_status(UI)`/`requirements_status`/`acceptance_status`=`APPROVED`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`（`DSS-AC-001~086` 共 86 条全部 `NOT_RUN`、acceptance_not_run_count=86）、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=NO`、`pending_user_confirmation_count=0`；重新批准只代表本轮第二轮调整界面/设计基线获批，不得写成第二轮调整已实现、已通过人工页面检查或正式验收（`IMPLEMENTED`/`IMPLEMENTED_ACCEPTED`/`PASS`/`ACCEPTED`）。
- §9 UI 可测试矩阵已覆盖第二轮新增 `DSS-REQ-072~075` 与 `DSS-AC-081~086` 落点（表格铺满、探针/源库简化展示、下拉截断与宽度、单实例 Tooltip 复核）。
- `API.md`/`DATABASE.md` 整文件零差异；源码/测试/配置/既有证据零差异；本任务不执行数据库/构建/测试/浏览器/正式验收。完整调整落点与自检见执行报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002.md`。

## 17. 第二轮（本轮）UI 调整版本批准收口记录（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`）

- 本轮（第二轮）验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`，§16）及其 R1 极小定向修订（`...-002-R1`）已批准收口：ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审 `APPROVED`，项目负责人随后明确回复“批准”（批准日期 2026-09-08）。本批准只更新 `DESIGN.md`/`UI.md`/`REQUIREMENTS.md`/`ACCEPTANCE.md` 当前第二轮调整版本状态为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17...`）并作文档级收口记录；相对批准内容基准，本 UI §16 全部界面细则零差异，DESIGN §22 全部设计内容与 DESIGN §14.2/§14.3 追踪矩阵（需求 75/75、验收 86/86）业务内容零差异；`API.md`/`DATABASE.md` 整文件零差异。实现状态保持 `IMPLEMENTED_ADJUSTMENT_PENDING`（本轮调整未实现）、验收执行 `NOT_RUN`（`DSS-AC-001~086` 全部 `NOT_RUN`）、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=NO`、`pending_user_confirmation_count=0`。批准的是本轮 UI 调整界面/设计基线，不代表本轮调整已实现、正式验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`。下一入口为另立第二轮 UI 调整实现任务（按 DESIGN §22/§23 与本 §16 落地）。完整批准收口自检见报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002.md`。（本记录为第二轮批准收口时点描述，其中需求 75/75、验收 86/86、`pending_user_review=NO` 与实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING` 均为当时状态；该批准版本作为历史批准事实保留——批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`，已由 R2 极小纠正 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2` 把其纠正为“悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`”并重新进入复审，R3 记录纠正 `...-002-R3` 只修正 R2 审计记录与未来实现锚点、不改变业务行，ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED`、项目负责人明确回复“批准”，本文件当前第二轮 R2/R3 纠正版重新批准收口为 `APPROVED`（重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`，2026-09-08），现行状态以 §1/§16.1/§16.4/§16.6/§16.7/§16.9 与 §18 及本文件重新批准记录为准，下一入口为另立第二轮 UI 调整实现任务、严格以重新批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273` 为业务依据（不是直接实现）。）

## 18. 文档级变更记录（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2`、重新批准收口 `...-APPROVAL-002-R1`）

- 2026-09-08，第二轮 R2 极小纠正（纯文档纠正，未批准/未实现/未验收）：批准收口（`...-APPROVAL-002`，2026-09-08，批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`）后，ChatGPT 在准备第二轮实现任务时发现批准版本把“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”记录为现行规则，与项目负责人真实需求（源库列主内容正常显示 `DATA_SOURCE_ORG`、ORG 为空/配置缺失回退原始 `DATA_SOURCE_ID`，悬停 Tooltip 均只显示完整原始 `DATA_SOURCE_ID`）冲突并暂停；项目负责人再次确认“显示源库ID”。本文件仅原位纠正源库 Tooltip 内容与来源界面规则（§4.4、§5.4、§8.1、§9 测试矩阵相关行、§13.4/§13.5 取代声明、§16.1、§16.4、§16.6、§16.7）与当前状态（§1、§13.8 历史范围括号指针、§16.9、§17 记录）：源库列主文本仍显示 ORG 或回退原始 `DATA_SOURCE_ID`（`sourceMainText(row)` 决定，见 DESIGN §22.4）；源库 Tooltip 内容直接取完整 `row.sourceId`、不从 `sourceRef.org` 取值、不拼接 ORG＋ID 或异常说明。DESIGN §14 追踪矩阵落点不变（无悬空、覆盖 75/75、86/86）；`API.md`/`DATABASE.md`/第二轮初版报告 `...-002.md`/R1 报告 `...-002-R1.md`/批准收口报告 `...-APPROVAL-002.md`/第一轮全部报告证据整文件零差异。状态翻转：本文件当前第二轮调整版本由 `APPROVED` 重新置为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`human_visual_review_status=CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=YES`、`pending_user_confirmation_count=0`。下一入口为 ChatGPT 对本 R2 结果提交独立正式复审（不是直接实现）。（R3 纠正注记：ChatGPT 对 R2 结果提交独立正式复审结论 `CHANGES_REQUIRED`，本行历史记录中的“下一入口”与验收差异声明等审计描述由 R3 `...-002-R3` 记录纠正；R2 核心业务纠正保持。）
- 2026-09-08，本轮第二轮 UI 调整 R2/R3 纠正版重新批准收口（纯文档重新批准收口任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`；本任务只更新批准状态、批准记录、文档导航与下一入口，不修改任何需求/验收/设计/UI 业务内容、不实现代码、不执行验收）：R3 记录纠正 `...-002-R3`（提交 `cf40b5d...`）只修正 R2 变更记录的审计描述与未来实现锚点、不改变业务行；ChatGPT 对本 R3 结果提交独立正式复审 `APPROVED`，项目负责人随后明确回复“批准”（重新批准日期 2026-09-08）；本文件当前第二轮 R2/R3 纠正版由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 收口为 `APPROVED`（当前正式重新批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002-R1`，批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273`）。UI §16 全部界面细则零差异；DESIGN §22 全部设计内容与 DESIGN §14.2/§14.3 追踪矩阵（需求 75/75、验收 86/86）业务内容零差异、无悬空；`API.md`/`DATABASE.md`/第二轮初版报告 `...-002.md`/R1 报告 `...-002-R1.md`/批准收口报告 `...-APPROVAL-002.md`/R2 报告 `...-002-R2.md`/R3 报告 `...-002-R3.md`/第一轮全部报告证据整文件零差异。原批准版本 `...-APPROVAL-002` 与批准内容提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 仅作为 R2 纠正前历史批准事实保留，不得作为当前批准内容或未来实现业务基准。状态：design_status(UI)/requirements_status/acceptance_status=`APPROVED`、实现 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`（`DSS-AC-001~086` 全部 `NOT_RUN`）、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=NO`、`pending_user_confirmation_count=0`。重新批准只代表本轮第二轮 UI 调整界面/设计基线获批，不代表第二轮调整已实现、页面已通过第二轮人工视觉检查、正式验收或人工视觉验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`。下一入口为另立第二轮 UI 调整实现任务，严格以重新批准内容基准提交 `cf40b5d1e5ef03712011edb5e10c20070b582273` 为业务依据（不是在本任务直接实现）。
- 2026-09-10，查询控件交互调整基线批准收口（纯文档批准收口任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001`；只更新批准状态、批准记录、文档导航与下一入口，不修改任何需求/验收/设计/UI 业务内容、不实现代码、不执行验收、不启动/停止服务、不访问数据库/ZooKeeper/Kafka）：ChatGPT 已从 Git 对批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4` 完成最终复审 `APPROVED`，项目负责人于 2026-09-10 明确回复“批准”；本文件 §20 查询控件交互调整界面规则（`DSS-REQ-084~086` 对应落点）由草案状态收口为 `APPROVED`。§20.2～§20.6 界面业务规则逐字节不变；`DESIGN.md` §14.2/§14.3 追踪矩阵逐字节不变（需求 86/86、验收 103/103，无悬空）；`API.md`/`DATABASE.md` 业务契约/正文逐字节不变（纯前端查询控件展示与交互规则，不新增 API 路径/参数/响应字段/DTO/VO/错误码，不改变三表投影/SQL/字段/主键/索引/约束/关联/排序/只读边界）。允许变化仅为 §1 元数据、§20.1/§20.7 状态与自检、本变更记录与下一入口。状态：`query_control_interaction_adjustment_status=APPROVED`、`query_control_interaction_adjustment_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`、`formal_5173_code_review_status=APPROVED`（保留）、`project_owner_visual_review_status=CHANGES_REQUIRED`（保留）、`formal_acceptance_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`、`DSS-AC-001~103` 共 103 条全部 `NOT_RUN`（`acceptance_not_run_count=103`）、`pending_user_review=NO`、`pending_user_confirmation_count=0`。批准只代表本轮查询控件交互调整界面基线获批，不代表本轮调整已实现（尚未应用到 `5173`）、正式验收或人工视觉验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`。下一入口为独立正式实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001`，严格以批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4` 为业务依据（不是在本任务直接实现）。完整批准收口自检见报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001.md`。

## 19. 隔离视觉原型 R2～R7 界面规则固化（`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001`）

### 19.1 任务与边界

- 任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001`（2026-09-10，纯文档设计固化）：把项目负责人已认可（`APPROVED_BY_PROJECT_OWNER`，“视觉原型已经相当 OK”）的**隔离视觉原型 R2～R7 最终视觉方案**固化为正式界面规则，作为 `5173` 后续正式实现的唯一可追溯依据。
- 范围：只更新 `docs/features/data-source-snapshot-status/` 正式文档；不改 `API.md`/`DATABASE.md` 正文（整文件零差异）。
- 不做：不改 `frontend/`/`backend/`/SQL 或任何业务代码；不复制 prototype worktree 的 Vue/测试文件到正式工作区；不访问数据库/ZooKeeper/Kafka；不启动正式实现；不创建/批准通用 `QUERY-LIST-PAGE-UI-PATTERN`；不把本轮文档标记为已批准（本轮文档本身 `DRAFT_PENDING_USER_REVIEW`）。
- 关键事实（与 DESIGN §25.1 一致）：`5174` 是隔离视觉 prototype、非正式前端；R2～R7 视觉方向已获项目负责人认可；`5173` 尚未应用 R2～R7 且未做正式验收；prototype 浏览器/测试/构建结果仅为设计验证证据；下一阶段是应用到 `5173` 的独立任务（`PENDING_FORMAL_IMPLEMENTATION_ON_5173`）；通用查询列表页基线须待本页正式实现并验收通过后再评估。

### 19.2 证据来源与取证优先级

按优先级取证：① R7 最终代码；② R7 浏览器计算样式证据 `runtime-logs/DATA-SOURCE-SNAPSHOT-STATUS-LINEAR-STYLE-PROTOTYPE-001-R7/after-r7-facts.json`（`1280x800`/`1920x1080`/`2560x1440`）；③ R7/R6/R5 的 after 证据与轮次报告；④ 更早中间提示词仅作背景。凡提示词表述与 R7 最终代码/证据冲突，一律以证据为准。本节只固化呈现层事实，不改交互/接口/数据库设计。

### 19.3 页面结构与背景分层、查询区（`DSS-REQ-076`/`DSS-REQ-077`，`DSS-AC-087`/`DSS-AC-088`）

- 背景层级：`body` `rgb(245,247,250)` → `.content-area` `rgb(240,242,245)` → `.content-card` `rgb(255,255,255)`（公共容器不改）；本页根容器 `.dss-page` 为 `transparent`（**去除页面级近白中间层**）、`border-radius:10px`、`padding:14px 16px`、区块间距 `gap:12px`。
- 查询区容器 `.dss-query-card` 为浅灰分组底 `rgb(244,244,245)`、圆角 `8px`、无阴影（**取代** §2/§13.2 与 DESIGN §19.2 中“独立白色容器”表述，取代关系见 19.9）。
- 结果区容器 `.dss-result-card` 为白底 `rgb(255,255,255)`、圆角 `10px`、以 `box-shadow` 表达层次、computed `border: 0px`（**不得**写成或实现为“有 `1px` 边框”）。
- 查询标签“探针端/源库/快照状态”统一 `14px`/`font-weight:600`/`#3F3F46`、无背景无边框、单行不换行、与下拉框垂直居中、间距 `6px`；下拉框尺寸探针端 `240×32`、源库 `300×32`、快照状态 `200×32`；选中值（含“全部”）透明背景、无额外标签边框、清除 `×` 可见。
- 查询按钮黑底白字 `rgb(9,9,11)`、`font-weight:500`、圆角 `6px`、高 `30px`（主操作）；重置按钮 `rgb(228,228,231)` 底、`rgb(63,63,70)` 文字、圆角 `6px`、高 `30px`（次级）；仅改变选择不发请求，由“查询”提交。

### 19.4 结果头部、刷新组与倒计时呈现（`DSS-REQ-078`/`DSS-REQ-081`，`DSS-AC-089`/`DSS-AC-092`）

- 左侧汇总“共 {n} 条”为 `16px`/`font-weight:700`/`rgb(9,9,11)`；未知状态胶囊（未知计数为 0 时不显示）为 `12px`/`font-weight:700`、`rgb(180,83,9)` on `rgb(254,243,199)`、圆角 `999px`、高 `22px`、`padding:0 8px`。
- 右侧刷新组含自动刷新状态、最近成功刷新时间与“立即刷新”，整体右对齐、不可拆散；“立即刷新”为白底次级按钮（白底、`1px solid #E4E4E7`、文字 `#3F3F46`、圆角 `6px`、`box-sizing:border-box`），idle/loading 宽度**均固定 `110px`**、加载图标出现不跳变；“查询”视觉权重高于“立即刷新”。
- 倒计时圆环 `16px`（轨道 `#E4E4E7`、进度 `#2563EB`）与文案“{n} 秒后自动刷新”（秒数 `min-width:2ch`、右对齐、`tabular-nums`）；呈现细节见 19.6。

### 19.5 表格列宽模型、时间列与单元格展示（`DSS-REQ-079`/`DSS-REQ-080`/`DSS-REQ-082`，`DSS-AC-090`/`DSS-AC-091`/`DSS-AC-093`）

- 最小列宽模型：序号 `70` / 探针端 `170` / 源库 `285` / 快照状态 `140` / 快照启动时间 `170` / 快照完成时间 `170` / 记录更新时间 `170`，最小总宽 `1175px`；表格 `width:100%`、`min-width:1175px` 铺满结果卡片正文（**取代** §16.2 与 DESIGN §22.2 的 `1145px` 模型，取代关系见 19.9）。
- 序号 `70` 居中、快照状态 `140` 居中；探针端最小 `170`、源库最小 `285`（源库明显宽于探针端）；三个时间列各自最小 `170` 且**始终等宽**，宽屏按最终算法吸收富余；正文小于 `1175px` 时保留横向滚动、不压缩时间列。
- 三个时间列单元格水平 `padding` 为 `8px`（由 `12px` 收窄），上下 `padding` 与行高不变（普通行高 `49px`）；19 字符时间戳完整展示、不省略、不截断。
- 探针端主内容 `CLIENT_ID`、`font-weight:600`，Tooltip 展示完整非空 `CLIENT_DESC`（不变）；源库主内容 `ORG`、ORG 为空/空白/配置缺失回退原始 `DATA_SOURCE_ID`（判定逻辑与 §16.4 一致）；**无论主内容当前显示 `ORG` 还是回退 ID，源库 Tooltip 始终只显示完整原始 `DATA_SOURCE_ID`**——不显示 `ORG`、不拼接 `ORG + DATA_SOURCE_ID`、不追加“配置缺失/配置停用/类别非 SOURCE”等异常说明，内容源直接取自行记录的原始 `sourceId`/`DATA_SOURCE_ID`（不得从 `sourceRef.org` 或展示文本反推；正常行与回退行同源，与 §16.4 一致）。
- 非启用“停用”标记为浅红 badge（`background:#fee2e2`、`color:#991b1b`、`11px`/`font-weight:700`、圆角 `4px`、高 `20px`、`padding:0 6px`）且**不被裁切**；快照状态符号 `●`/`✓`/`?` 与颜色/字重：快照进行中 `#e0f2fe`/`#0369a1`、快照已完成 `#ecfdf5`/`#047857`、未知 `#fef3c7`/`#b45309`，`font-weight:600`、高 `20px`、圆角 `4px`；未知状态行浅黄底 `rgba(254,243,199,.42)`、hover `rgba(254,243,199,.66)`；内容超长统一省略号并经页面级单实例 Tooltip 展示完整内容（单实例契约见 §16.7 不变）。

### 19.6 倒计时纯呈现语义（`DSS-REQ-081`，`DSS-AC-092`）

- 倒计时为**纯呈现**：走秒**本身不产生任何 GET**；真实计时仍以既有 `setTimeout` 为唯一触发源；不改动单飞行/不并发/不排队/不补发与六类请求视觉映射；页面不可见时冻结并暂停自动刷新，恢复可见后按既有逻辑继续。

### 19.7 响应式视口与 `1280` 口径纠正（`DSS-REQ-083`，`DSS-AC-094`）

- 真实 `1280×800` viewport：三个字段标签与字段控件保持第一行，查询/重置操作组按既有 `flex-wrap` 换行到第二行——**该换行为既有响应式设计，不是缺陷/回退/阻塞项**。
- 约 `1700px`、`1920×1080`、`2560×1440`：三个查询条件与查询/重置保持同一行、布局紧凑。
- **明确撤回**：任何“`1280` 下所有查询条件和查询/重置必须同处一行”的要求/缺陷/阻塞/验收条件一律作废；该前提仅出现在 R7 任务提示词中，从未写入正式文档，现予撤回。文档与验收**不再**以该前提为条件。

### 19.8 交互状态机（保持既有，`DSS-AC-095`）

- R2～R7 呈现调整**未改动**既有已验证交互状态机：首次进入自动查询；仅查询成功（含成功返回 0 条）才替换已应用条件与结果；查询失败保留旧结果与旧已应用条件；重置只恢复默认值、不发查询；手动/自动刷新使用已应用条件；`60` 秒自动刷新、不可见暂停、恢复后继续；请求单飞行与忙碌抑制；页面级错误收敛、无重复全局错误弹窗；倒计时走秒不产生额外 GET；所有操作只读；Tooltip 页面级单实例。既有设计落点（§7/§8/§9/§13/§16）不变。

### 19.9 取代清单、状态分离与变更记录

- 取代清单（现行界面规则以 §19 为准）：§2/§13.2 与 DESIGN §19.2“查询区独立白容器”→ §19.3（`DSS-REQ-076`）；§16.2 与 DESIGN §22.2 `1145px` 列宽模型 → §19.5（`DSS-REQ-079`）；刷新组呈现（`DSS-REQ-050`/`DSS-REQ-068`）→ §19.4/§19.6（`DSS-REQ-078`/`DSS-REQ-081`）；探针/源库展示（`DSS-REQ-045`）→ §19.5（`DSS-REQ-082`）；时间单元格水平 padding → §19.5（`DSS-REQ-080`）；响应式口径 → §19.7（`DSS-REQ-083`）。完整取代说明见 REQUIREMENTS §21.5 与 DESIGN §25.6。
- 状态分离（批准收口后）：R2～R7 原型视觉方向＝`APPROVED_BY_PROJECT_OWNER`；R2～R7 固化文档＝`APPROVED`（2026-09-10 经 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001` 收口，批准内容基准提交 `e67b2ecc...`；固化时点为 `DRAFT_PENDING_USER_REVIEW`）；`5173` 对 R2～R7 的正式实现＝`PENDING_FORMAL_IMPLEMENTATION_ON_5173`、正式验收＝`NOT_RUN`。文档总体状态＝`PROTOTYPE_DESIGN_APPROVED_READY_FOR_FORMAL_5173_IMPLEMENTATION`；禁止写为 `FORMALLY_ACCEPTED`/`IMPLEMENTATION_APPROVED`/`ACCEPTANCE_PASSED`/`COMPLETED`（R2～R7 尚未应用到 `5173`、正式验收与人工视觉验收仍 `NOT_RUN`）。`DSS-AC-087~095` 全部 `NOT_RUN`；`5174` 原型的 762 个前端测试与浏览器证据仅为设计验证证据，不得批量写成这些用例的 `PASS`。
- 变更记录：2026-09-10，隔离视觉原型 R2～R7 设计固化（`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001`，纯文档）：本文件新增 §19 并更新 §1 元数据（新增隔离视觉原型设计固化相关状态行、把 `DSS-REQ-076~083`/`DSS-AC-087~095` 计入计数）；`DESIGN.md` 新增 §25 并更新 §1/§14.2（83/83）/§14.3（95/95）；`REQUIREMENTS.md` 新增 §21.4/§21.5 并更新 §24/§25；`ACCEPTANCE.md` 新增 §4.20、更新 §3/§5/§6/§7；`README.md` 更新导航与状态并追加下一入口；`API.md`/`DATABASE.md` 整文件零差异（R2～R7 为纯前端视觉/交互呈现调整，本轮无 API、数据库变更）。下一入口：项目负责人复审本轮文档后另立 `5173` 正式实现任务（`PENDING_FORMAL_IMPLEMENTATION_ON_5173`）。
- 自检：`DSS-REQ-076~083`、`DSS-AC-087~095` 编号连续、无重号、无复用；DESIGN §14.2 覆盖 83/83、§14.3 覆盖 95/95、无悬空；`DSS-AC-087~095` 全部 `NOT_RUN`；本轮不产生 `frontend/`/`backend/`/SQL/配置差异，不提交 runtime logs/截图/构建产物/依赖目录/临时文件。
- R1 极小定向修订变更记录（`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001-R1`，2026-09-10，纯文档，未批准/未实现 5173/未执行验收）：ChatGPT 对固化任务结果提交 `899803491427a6a7e6b6295f43ef49a11ed56037` 正式复审结论 `CHANGES_REQUIRED` 驱动的定向修订。本文件只把 §19.5 中歧义的“源库 Tooltip 展示完整值”改写为明确口径——源库主内容 `ORG`（`ORG` 为空/空白/配置缺失回退原始 `DATA_SOURCE_ID`，判定逻辑与 §16.4 一致）、**无论显示 ORG 还是回退 ID，源库 Tooltip 始终只显示完整原始 `DATA_SOURCE_ID`**，不显示 `ORG`、不拼接 `ORG＋DATA_SOURCE_ID`、不追加“配置缺失/配置停用/类别非 SOURCE”等异常说明，内容源直接取自行记录的原始 `sourceId`/`DATA_SOURCE_ID`、不得从 `sourceRef.org` 或展示文本反推；同时明确探针端为完整**非空** `CLIENT_DESC`（未误改）。§19 其余视觉数值、§19.6 倒计时、§19.7 响应式口径、§19.8 交互状态机与取代清单均零变化；§16.4/§16.7 既有单实例 Tooltip 契约不变。状态不变：R2～R7 原型视觉方向 `APPROVED_BY_PROJECT_OWNER`、本轮文档 `DRAFT_PENDING_USER_REVIEW`、`5173` 正式实现 `PENDING_FORMAL_IMPLEMENTATION`、正式验收 `NOT_RUN`。下一入口为 ChatGPT 从 Git 重新复审（`CHATGPT_REVIEW_FROM_GIT_THEN_USER_APPROVAL`）。
- 批准收口记录（2026-09-10，`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001`，纯文档）：ChatGPT 已从 Git 对批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a` 完成最终复审 `APPROVED`，项目负责人于 2026-09-10 明确回复“批准”。据此把 §1 中 R2～R7 设计固化内容当前状态由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`，`5173` 对 R2～R7 的正式实现仍为 `PENDING_FORMAL_IMPLEMENTATION_ON_5173`、正式验收与 `5173` 人工视觉验收仍 `NOT_RUN`；`pending_user_review=NO`、`pending_user_confirmation_count=0`。**业务零变化**：§19 界面数值/布局/Tooltip/响应式/交互规则、AI 计数（83/95）、`DSS-REQ-076~083` 与 `DSS-AC-087~095` 业务行、源库 Tooltip 口径（完整原始 `DATA_SOURCE_ID` only）均逐字节不变；`API.md`/`DATABASE.md` 契约零差异。**批准不代表 R2～R7 已应用到 `5173`、正式实现已完成或验收已通过，不等于 `IMPLEMENTED_ACCEPTED`**；下一入口为独立正式实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001`。

## 20. 查询控件交互调整草案界面规则（`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001`）

### 20.1 任务与范围

- 任务编号 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001`，授权基线提交 `ba309ea8b469e3796ab08ed87c6ccb8c6d5bb253`，原正式实现提交 `3ec9cbf6487eacff004212fb3aca3064c3bd18cc`，已批准视觉内容基准 `e67b2ecc3897c3e83597126e259ee4c19349a66a`。
- 本轮为**纯文档界面规则**：先建立草案界面规则对应 `DSS-REQ-084~086`、`DSS-AC-096~103`（全部 `NOT_RUN`），随后由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001`（2026-09-10，批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`）批准收口为 `APPROVED`（当前实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`）；不实现、不执行正式验收、不代替项目负责人批准（草案建立任务边界，历史保留）。
- 本轮不改变已批准的整体视觉方案、页面结构、背景分层、结果卡片、表格列宽模型、刷新工具栏、状态标签与页面级单实例 Tooltip 业务设计；请求/状态机零变化（见 §20.7）。

### 20.2 三个问题为何统一处理

项目负责人确认三类问题（下拉宽度随内容变化、四个展示字段缺少统一字段级截断、`CLIENT_DESC` 截断后需 Tooltip）同属查询区几何与文本呈现的耦合问题：只锁宽不截断则内部 `flex` 子项仍被撑开，只截断不锁外部几何则控件仍可能抖动，Tooltip 的显隐又依赖截断判定。故以一个统一口径（“按码点判定超限 + 固定像素锁定外部几何”）一次落地，落点为 §20.3～§20.5。

### 20.3 下拉固定宽度与内部收缩界面规则（`DSS-REQ-084`；取代/扩展 §16.5 宽度约束）

- 固定宽度：探针端 `240px`、源库端 `300px`、快照状态 `200px`。下列各状态下宽度均不变，且其后字段组与 `查询`/`重置` 按钮的 `x` 坐标不得移动：初始“全部”、选中项最短、选中项最长、短↔长切换、多选并 `collapse-tags`、取消最长选项、清空回“全部”、重置、面板开/关、Tooltip 显示/隐藏。
- 候选文本变长不得引入额外换行或撑开外层容器。
- 实现前**必须先在真实浏览器定位测量**（禁止猜测式全局 CSS）：测量 `.dss-select`、`.el-select__wrapper`、`.el-select__selection`、`.el-select__selected-item`、`.dss-q-group` 以及动作按钮的几何前后差异。
- 修复范围限定在 Feature 命名空间（`.dss-*` + `<style scoped>`），不改通用查询列表页基线、不改全局 `Element Plus` 主题；典型做法为外层锁定 `width`/`min-width`/`max-width`/`flex-basis`、内层 `min-width: 0`，不靠换行或加长文案掩盖。
- 面板最大宽度与安全视口约束仍沿用 §16.5（探针端面板 `480px`、源库端面板 `560px`，均不得超过安全视口宽度；专属 `popper-class` 须用本 Feature 命名空间）。
- 验收 `DSS-AC-096`/`097`/`103`。

### 20.4 四个展示字段统一字段级截断界面规则（`DSS-REQ-085`；扩展 §16.3/§16.4/§16.5）

- 统一 `displayField(value, 20)`：先做 `null`/`undefined` 安全归一为 `''` 并执行 `trim()`（`normalizeFieldText`），再对 trim 后结果按 **Unicode 码点**计数（`CJK`/emoji 各计 1 个码点，禁止拆开代理对）；trim 后 `≤20` 返回该值；trim 后 `>20` 返回前 `20` 个码点 + ASCII 英文 `...`。
- 组合显示按**每个组成字段分别** trim＋20 码点截断，不得把整个组合串统一截成 20 码点：探针端 `displayField(CLIENT_ID, 20)（displayField(CLIENT_DESC, 20)）`；源库端 `displayField(DATA_SOURCE_ORG, 20)（displayField(DATA_SOURCE_ID, 20)）`。
- 空值规则：`CLIENT_DESC` trim 后为空（`null`/空/纯空白）时不产生空括号，探针端退化为 `displayField(CLIENT_ID, 20)`；源库端 `ORG` trim 后为空/配置缺失时按 §16.4 先用原始 `DATA_SOURCE_ID` 回退、再套 `displayField(...,20)`，同样不产生空括号。
- 边界（按 **trim 后**码点数）：恰好 `20` 码点显示完整、不追加 `...`；`≥21` 码点显示前 `20` 码点 + `...`；trim 前超 20 但 trim 后 `≤20` 显示 trim 后完整值。
- 候选下拉项与可见选中项使用同一 `displayField` 结果，同一原始值两处显示完全一致。
- **仅显示态**：选项 `value`、查询参数、已应用查询条件、请求语义一律保留完整原始 ID；trim 与截断均不回流数据层；`CSS text-overflow` 仅作最后兜底。
- 验收 `DSS-AC-098`/`099`/`103`。

### 20.5 `CLIENT_DESC` Tooltip 界面规则（`DSS-REQ-086`）

- 设 `normalizedDesc = String(CLIENT_DESC ?? '').trim()`；仅当 `normalizedDesc` 码点长度 `> 20` 时出现；作用于候选悬停与可见选中项悬停两处。
- 内容仅显示 **trim 后完整未截断的 `normalizedDesc`**（不再次截断、不保留首尾无意义空白）；不显示 `CLIENT_ID`、不显示拼接串、不为源库端字段提供该 Tooltip；表格 Tooltip 与既有已批准源库表格 Tooltip（完整原始 `DATA_SOURCE_ID` only，§16.6/§16.7、§19.5）不变。
- `normalizedDesc` 为空（`null`/空/纯空白）或 `≤20` 码点时不出现。
- Tooltip 定位锚点必须使用**稳定身份**——原始完整 `CLIENT_ID`、Element Plus slot 提供的一一对应的原始 option/value，或 Feature 私有 `data-*` 标识；**不得**以 trim＋20 码点截断后的可见文字反查探针（不同探针截断后可能得到逐字相同的标签）；不得引入全局 Element Plus DOM 猜测或跨 Feature 全局覆盖。
- 安全最大宽度 `480px` 或 `min(480px, calc(100vw - 16px))`，自然换行；同一时刻至多一个可见实例、不堆叠、离开即隐藏；`+N` 沿用 `Element Plus` 既有语义。
- 显示/隐藏不得改变下拉宽度、查询区高度或其他控件位置。
- 验收 `DSS-AC-100`/`101`/`102`/`103`。

### 20.6 四档视口与几何验证要求

- 实现任务须在四档视口 `1280`/`1700`/`1920`/`2560` 下验证上述规则（宽度稳定、内容长度变化不引入额外换行、后续字段与按钮不位移、Tooltip 单实例且安全宽度生效）。
- `1280` 为最窄口径，须重点核验查询区不溢出、不推动动作按钮，并且**允许查询/重置动作组按既有响应式规则进入第二行**——该换行为既有响应式设计，不是缺陷、回退或阻塞项；选择、取消、清空任意长短选项时，不得额外改变三个下拉框宽度、查询栏高度、既有换行状态或下游控件位置（与 `DSS-AC-094` 口径一致；已撤回“`1280` 下所有查询条件和查询/重置必须同处一行”这一前提）。

### 20.7 不变契约、取代关系与自检

- 取代/扩展关系：§20.3 取代/扩展 §16.5 的宽度与截断口径；§20.4 扩展 §16.3/§16.4/§16.5 的字段级截断口径；§20.5 扩展 §16.6 探针端 Tooltip 触发口径。完整取代说明见 `REQUIREMENTS.md` §21.7 与 `DESIGN.md` §26.2。
- 请求/状态机零变化：接口 `GET /api/monitor/data-source-run-state/list`、参数 `clientId`/`sourceId`/`status`、单飞行请求状态机、`60` 秒自动刷新、隐藏冻结/恢复补发、行键与排序常量、只读边界均不变（对应 `DSS-REQ-023/025/050~054/071`）；不改表格、背景、状态标签与源库表格 Tooltip 业务设计。
- 编号与追踪：`DSS-REQ-084~086`（累计 86 条）、`DSS-AC-096~103`（累计 103 条全部 `NOT_RUN`、`acceptance_not_run_count=103`）；矩阵 86/86 与 103/103 双向无悬空；本轮界面规则已批准为 `APPROVED`，但禁止把已批准调整写成 `IMPLEMENTED`/`ACCEPTED`/`COMPLETED`，也不得把任何验收写成 `PASS`。
- 代码零差异：本轮不产生 `frontend/`/`backend/`/SQL/配置差异；`API.md`/`DATABASE.md` 与既有历史报告整文件逐字节不变。
- 分层状态：`query_control_interaction_adjustment_status=APPROVED`、`query_control_interaction_adjustment_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`（2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 收口；2026-09-12 前历史状态为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`）、`query_control_interaction_adjustment_code_review_status=APPROVED`（历史为 `PENDING_CHATGPT_REVIEW`）、`query_control_human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`、`project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER`（历史为 `CHANGES_REQUIRED`）、`formal_5173_code_review_status=APPROVED`、`formal_acceptance_status=NOT_RUN`、`acceptance_execution_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`、`formal_acceptance_not_run_count=107`、`pending_user_review=NO`、`pending_user_confirmation_count=0`。
- 变更记录：2026-09-10，新增 §20 并更新 §1 元数据（新增本轮草案相关状态行）；R1 只定向纠正了其当时的当前状态残留与下一入口（不修改 §20 界面业务规则，作为历史保留）；随后由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 批准收口为 `APPROVED`（§20.2～§20.6 界面业务规则逐字节不变）。
- R1 修正变更记录（`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1`，2026-09-11，代码修正驱动的文档同步）：实现结果提交 `a47988820c797ff60bd7244b2d0f899bd8fc3be5` 经 ChatGPT 复审 `CHANGES_REQUIRED`，R1 据此把 §20.4 的字段级截断口径由“直接按码点截断”明确为“先 `null` 安全归一 + `trim()`，再按 Unicode 码点计数”（单一纯函数 `displayField`；组合串按组成字段分别处理；边界以 trim 后码点数为准；trim 与截断均只影响显示），并在 §20.5 明确 Tooltip 内容为 `normalizedDesc = String(CLIENT_DESC ?? '').trim()` 且判定基于 trim 后码点 `> 20`，新增**锚点稳定身份**约束（按原始完整 `CLIENT_ID` / Element Plus slot 原始 option value / Feature 私有 `data-*` 定位，禁止以截断或组合显示文字反查探针、禁止全局 Element Plus DOM 猜测或跨 Feature 覆盖）。§20.6 的 `1280` 口径与 §20.2/§20.3/§20.5 已批准视觉数值零变化；业务行、编号与 `API.md`/`DATABASE.md` 契约均不变。下一入口：`CHATGPT_R1_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`（本轮调整已由实现任务于 2026-09-11 落地，并经 R1 修正任务按 ChatGPT 复审 `CHANGES_REQUIRED` 完成修正、待 ChatGPT 从 Git 复审 R1 后由项目负责人进行视觉/交互复审；该历史入口已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001`（2026-09-12）处理完毕——实现复审 `APPROVED`、人工视觉/交互检查 `APPROVED_BY_PROJECT_OWNER`；统一下一入口 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`）。
- 2026-09-12，查询控件交互调整实现复审收口（纯文档复审结论收口任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001`，不修改代码、业务规则、需求/验收业务行、API/DATABASE 契约或验收结果、不执行正式验收）：ChatGPT 已从远程 Git 复审 R1 修正实现提交 `edba7c891884d0f000a7c9edc196b2bffb95e0b0` 结论 `query_control_interaction_adjustment_code_review_status=APPROVED`（R2 提交 `2a9a271690bfdc68b16772268e84928a33abdeda` 仅为测试计数文档纠正 `100→102`、无代码变化）；项目负责人对含后续 popper 固定宽度修正的最终 `5173` 页面人工检查明确回复“人工检查了，没有问题”，收口 `query_control_human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`、`project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER`；实现状态由 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW` 更新为 `query_control_interaction_adjustment_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`。仅修改本文件 §1 当前元数据状态行、§20.7 当前追踪说明与本节变更记录；**§20.2～§20.6 界面业务规则逐字节不变**，需求 87、验收 107（全部 `NOT_RUN`、`formal_acceptance_not_run_count=107`）；§21 业务规则、`API.md`/`DATABASE.md` 契约与业务正文、`frontend/`/`backend/`/SQL/配置/测试/证据/既有报告零改动。代码复审与人工页面检查通过**只表示**实现可以进入独立正式验收阶段，**不得**写成 107 条正式验收已执行/通过、`IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/`formal_acceptance_status=PASS`/`COMPLETED`。统一下一入口 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`（报告见 `reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001.md`）。

## 21. 查询下拉弹层（popper）固定宽度基线界面规则（`DSS-REQ-087`）

> 本节为 2026-09-11 任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001` 新增的独立界面规则小节，对应 `REQUIREMENTS.md` §21.8 新增需求 `DSS-REQ-087` 与 `ACCEPTANCE.md` §4.22 新增验收 `DSS-AC-104~107`，已由 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001` 收口为 `APPROVED`（`popper_width_document_status=APPROVED`：ChatGPT 已从远程 Git 对批准内容基准提交 `f74dd725682b745f1b8ac6a1b9358eff10aaddc2` 完成最终复审 `APPROVED`、项目负责人于 2026-09-11 明确回复“批准”）。设计落点为 `D§27、U§21`。本规则已由 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001` 在 `5173` 正式前端落地（2026-09-12 前历史状态为 `popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`，其时代码复审结论 `CHANGES_REQUIRED`），并已于 2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 复审收口（`popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`、`popper_width_formal_code_review_status=APPROVED`、`human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`）；R2 任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001-R2` 据此提出支持视口边界修正（正式支持下限 `viewport width >= 1280px`、`<1280px` 仅防御性观察、不计入正式验收），其文档已于 2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-R2-APPROVAL-001` 批准收口为 `popper_width_r2_document_status=APPROVED`（`chatgpt_r2_final_review_status=APPROVED`、`project_owner_r2_approval_status=APPROVED`）。

### 21.1 任务与范围

- 本轮只把项目负责人已在隔离固定宽度 prototype 中人工确认并批准执行的“三个查询下拉弹层固定宽度”方案固化为界面规则；prototype 为独立 worktree、只改 `DataSourceSnapshotQueryBar.vue` 与 Feature 私有 CSS、**未进入 `5173`**；`prototype_width_decision_status=APPROVED_BY_PROJECT_OWNER`。
- 本节为**纯文档批准收口**（`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001`）：不生成截图、不修改任何代码、不执行正式验收（`formal_acceptance_status=NOT_RUN`、`acceptance_not_run_count=107`）；prototype 的多视口/多状态自测与截图仅为**设计验证证据**，不得写成任何 `DSS-AC-*` 的 `PASS`。

### 21.2 popper 固定对象与双层落点

- 固定的是查询下拉**弹层（popper）外层 `div.el-popper` 可见边界**（携带 1px 边框），**不是**其内部 `.el-select-dropdown` 内容盒、**也不是**触发控件（trigger）。
- 弹层由 Element Plus `el-select` Teleport 到 `body`，脱离查询栏文档流；它是与 trigger（§20.3）**不同的几何对象**，故 `DSS-REQ-087` 不重写 §20.3 的 trigger 固定口径，而是把“固定外部几何”扩展到 popper（取代/扩展关系见 §21.7）。
- **实现易错点**：`popper-class` 会同时落到**外层 `.el-popper` 与内部 `.el-select-dropdown` 两层**元素上；实现必须精确约束外层 `.el-popper.<Feature 私有 class>`，**不得**只按裸 class 名匹配，以免命中内层或误伤同页其它未带 Feature 私有 class 的 `.el-popper`。

### 21.3 三档宽度与视口安全上界

- 弹层外层宽度固定为：探针端 `480px`、源库 `400px`、快照状态 `240px`。
- **正式支持视口（R2 支持边界修正）**：正式支持视口下限为 `viewport width >= 1280px`（正式验证至少覆盖 `1280×800`、`1700×920`、`1920×1080`、`2560×1440`）；在该范围内三个弹层外层宽度恒为目标宽度、不越出视口、不产生水平滚动或内容溢出。
- 小视口安全上界统一取 `min(目标宽度, calc(100vw - 16px))`；该表达式在 `<1280px` 时作为**非正式支持范围内的防御性收缩**保留（**不承诺**完整自适应）。须如实区分两个对象：外层 `.el-popper` 在防御性收缩下按公式收窄、不越出视口；而 Element Plus 内层 `.el-select-dropdown` 的内联 `min-width`（触发控件宽度 − 2px，探针端 `238`、源库 `298`）在极窄视口（如 `240px` 视口外层 `224px`）下可能超出外层——这是**框架内联约束**，**不得**把“外层不越界”与“内层不溢出”混为一谈，也**不再要求** `<496px`/`<416px`/`<256px` 必须正式通过；相关窄视口观察一律标注为「非正式支持范围内的防御性观察」，**不得**写成正式 `PASS`。

### 21.4 宽度不变性（不随内容、选中字重、滚动条变化）

- 弹层宽度必须在下列全部状态中保持不变（相邻状态宽度差为 `0`）：初始“全部”、选中最短候选、选中最长候选、短↔长切换、多选并 `collapse-tags`、取消最长候选、清空/重置、打开/关闭面板、Tooltip 显示/隐藏、纵向滚动条出现/消失。**关闭态测量口径**：关闭后 Element Plus 可能隐藏或销毁 Teleport popper、关闭态无可测量的外层可见边界，故“打开/关闭面板”的验证为——面板打开且可见时测量外层 `.el-popper`、关闭面板并确认其已隐藏或销毁（**不要求**在关闭态测量宽度）、再次打开面板后重新测量，且重新打开后的宽度必须与关闭前相同（差为 `0`）。
- 宽度不得依赖候选项文本长度或内容；**Element Plus 下拉候选 `.el-select-dropdown__item.is-selected` 的既有选中强调样式（实测 `font-weight: 700`）保留**，但该样式不得影响外层 popper 宽度、不得因固定外层宽度而改变弹层宽度；纵向滚动条出现/消失不得挤占或改变弹层外侧宽度。
- 选择/取消/清空/重置/面板开合等操作仍只修改查询草稿、不发送请求。

### 21.5 触发控件与截断/Tooltip 不变

- 触发控件（trigger）既有尺寸 `240px`/`300px`/`200px`（宽）× `32px`（高）**保持不变**；本节只固定 popper。
- 四字段 20 Unicode code point 字段级截断（§20.4，`DSS-REQ-085`）与 `CLIENT_DESC` 完整 Tooltip（§20.5，`DSS-REQ-086`）规则、内容、单实例语义**不变**；完整原始 ID/`value`、查询参数与查询语义**不变**。
- **弹层宽度的变化不得引起选中后右边缘跳动**：从短值到长值、从长值到短值时，弹层外层几何与左对齐位置稳定，不出现水平滚动或溢出。

### 21.6 四档视口与几何验证要求

- 实现任务须在四档**正式支持视口** `1280×800`/`1700×920`/`1920×1080`/`2560×1440` 下用真实浏览器几何测量（`getBoundingClientRect()`）核对三个弹层外层宽度分别为 `480px`/`400px`/`240px`，且不越出视口、无水平滚动/溢出。
- 如需进一步检查，可把视口**防御性**收窄至 `<1280px`（含探针端/源库/快照状态各自窄档，也可用单个 `<256px` 可控 viewport 一次覆盖三者），核对实际外层宽度 = `min(目标宽度, viewportWidth − 16px)`、不越出视口；该区间属**非正式支持范围内的防御性观察**，**不计入**正式验收结论，**不再要求** `<496/<416/<256px` 必须正式通过；Element Plus 内层 `.el-select-dropdown` 内联 `min-width` 在极窄视口下超出外层属**框架内联约束**，不得据此判定正式失败。
- `1280` 为**正式支持范围的最窄口径**，须重点核验弹层不越出视口；查询/重置动作组按既有 `flex-wrap` 进入第二行属既有响应式设计，弹层宽度变化**不得**额外触发或改变该换行（与 `DSS-AC-094` 口径一致）。
- 既有表格列宽、`49px` 行高、时间无省略、`110px` 刷新按钮、倒计时、未知状态、源库表格 Tooltip 等回归项均不得回退。

### 21.7 不变契约、取代关系与自检

- 取代/扩展关系：`DSS-REQ-087` 把 `DSS-REQ-084`（§20.3）的“固定外部几何”口径从 trigger 扩展到 Teleport 到 `body` 的 popper 外层 `.el-popper`，**不重写** `DSS-REQ-084` 业务行；不改变 `DSS-REQ-085`/`DSS-REQ-086` 的截断与 Tooltip 口径（仅补充“选中项 `700` 字重不得改变弹层宽度”的几何不变性）。完整取代/扩展说明见 `REQUIREMENTS.md` §21.8 与 `DESIGN.md` §27。
- 请求/状态机零变化：接口 `GET /api/monitor/data-source-run-state/list`、参数 `clientId`/`sourceId`/`status`、单飞行请求状态机、`60` 秒自动刷新、隐藏冻结/恢复补发、行键与排序常量、只读边界均不变（对应 `DSS-REQ-023/025/050~054`）；不改表格、背景、状态标签与源库表格 Tooltip 业务设计。
- 实现边界：限定 Feature 命名空间（Feature 私有 popper class + `<style scoped>`）最小特异性；**不得**使用 `!important`、**不得**新增全局 Element Plus 样式覆盖；内部 `.el-select-dropdown` 自适应填充外层，**不得**内外两层同宽写死（边框/内边距叠加会导致溢出或水平滚动）。
- 编号与追踪：`DSS-REQ-087`（累计 87 条，已收口为 `APPROVED`）、`DSS-AC-104~107`（累计 107 条，已收口为 `APPROVED`）；`DSS-AC-001~107` 共 107 条已于 2026-09-12 由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` 执行正式验收、并经 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1` 完成 `DSS-AC-065` 定向补验，最终结果 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`（R0 初始结果 `PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0`，唯一 `BLOCKED` 为 `DSS-AC-065`，已由 R1 补验通过）；2026-09-12 执行前历史值为全部 `NOT_RUN`、`acceptance_not_run_count=107`。矩阵 87/87 与 107/107 双向无悬空；**批准与该轮定向验收执行不等于最终接受**，禁止把本 Feature 写成 `IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/`COMPLETED`，`PASS` 仅表示该条验收已执行且通过、须待 ChatGPT 从 Git 复核后由项目负责人作正式人工验收决定。
- 代码零差异：本轮不产生 `frontend/`/`backend/`/SQL/配置差异（`frontend_code_diff=ZERO`、`backend_code_diff=ZERO`）；`API.md` 与 `DATABASE.md` 在本 baseline 批准收口任务中仅同步 §1 组合计数、分层状态、下一入口及简短说明（API 业务契约与 §9 映射表逐字节不变、DATABASE 查询设计业务正文逐字节不变），既有历史报告不变。
- 分层状态：`prototype_width_decision_status=APPROVED_BY_PROJECT_OWNER`、`popper_width_document_status=APPROVED`、`popper_width_r2_document_status=APPROVED`（R2 支持视口边界修正文档，已于 2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-R2-APPROVAL-001` 批准收口；`chatgpt_r2_final_review_status=APPROVED`、`project_owner_r2_approval_status=APPROVED`、`supported_viewport_min_width_px=1280`、`sub_1280_formal_support_status=NOT_FORMALLY_SUPPORTED_DEFENSIVE_ONLY`、`ultra_narrow_formal_acceptance_requirement_status=WITHDRAWN_BY_APPROVED_R2`）、`popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`（2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 复审收口；2026-09-12 前历史状态为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`）、`popper_width_formal_code_review_status=APPROVED`（历史为 `CHANGES_REQUIRED`）、`human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`（历史为 `NOT_PASSED`）、`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`（2026-09-12 由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` 执行、并经 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1` 完成 `DSS-AC-065` 定向补验；2026-09-12 前历史值为 `NOT_RUN`）、`acceptance_execution_status=PASS`（历史为 `NOT_RUN`）、`human_formal_5173_review_status=NOT_RUN_FOR_THIS_ADJUSTMENT`、`pending_user_review=NO`、`pending_user_confirmation_count=0`。
- 变更记录：2026-09-11，新增 §21 并更新 §1 元数据（新增本轮相关状态行）；同日由 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001` 批准收口（`popper_width_document_status=APPROVED`，批准内容基准提交 `f74dd725682b745f1b8ac6a1b9358eff10aaddc2`）；同日由独立实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001` 在 `5173` 正式前端落地 `§21` 固定宽度规则（仅改 Feature 私有 `DataSourceSnapshotQueryBar.vue` 与其 `.spec.ts`：外层选择器由裸 class 收敛为 `.el-popper.dss-*-popper` 并同时锁定 `width`/`min-width`/`max-width`；不使用 `!important`、不新增全局 Element Plus 覆写、不引入脚本尺寸监听），`popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、开发验证 `DEV_SELF_TEST_DONE`；其实现代码复审结论当时为 `CHANGES_REQUIRED`（2026-09-12 前历史状态）；该任务当时的下一入口为 `CHATGPT_POPPER_WIDTH_IMPLEMENTATION_REREVIEW_AGAINST_APPROVED_R2_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`（历史；该入口已由随后完成的实现复审收口任务处理，当前入口见本节末条）。
- 2026-09-11，查询下拉固定宽度正式实现（前端实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001`，不执行验收、不做批准收口、不启动服务）：在全新隔离 worktree `/agent/dss-popper-width-impl-001`（基准提交 `485be09db758e4ba6f543fcc88a399cc5a46d384`＝`origin/develop`）中，按批准内容基准提交 `f74dd725682b745f1b8ac6a1b9358eff10aaddc2` 把 §21 已批准的 `DSS-REQ-087` 三档查询下拉弹层固定宽度规则（探针端 480 / 源库 400 / 快照状态 240，受 `min(目标宽度, calc(100vw - 16px))` 视口安全上界约束）落到 `5173` 正式前端，仅改 Feature 私有 `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` 与其 `.spec.ts`：外层选择器由裸 class 收敛为 `.el-popper.dss-client-popper`/`.el-popper.dss-source-popper`/`.el-popper.dss-status-popper` 并同时锁定 `width`/`min-width`/`max-width`；内层 `.el-select-dropdown` 继续自适应填充外层；**不新增全局 Element Plus 覆写、不引入脚本尺寸监听**；触发控件 `240/300/200×32`、四字段 trim＋20 码点截断、`CLIENT_DESC` 完整 Tooltip、`ALL`/Ghost/`+N` 语义、表格与页面其余视觉均不变。开发验证：定向 85、Feature 245、前端全量 834 用例全部通过（exit 0），`vue-tsc --noEmit`＋`vite build` 成功（exit 0），`git diff --check` 干净（exit 0）；真实浏览器四档视口与状态下外层宽度恒定（相邻状态 delta 0px）、窄视口按公式收缩且无横向滚动、交互与请求状态机回归通过、console error 0、页面写请求 0、其他路由无 `dss-*` 泄漏。状态：`popper_width_document_status=APPROVED`（不变）、`prototype_width_decision_status=APPROVED_BY_PROJECT_OWNER`（不变）、`popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（开发验证 `DEV_SELF_TEST_DONE`）、`popper_width_formal_code_review_status=CHANGES_REQUIRED`、`formal_acceptance_status=NOT_RUN`、`human_formal_5173_review_status=NOT_RUN_FOR_THIS_ADJUSTMENT`、`DSS-AC-001~107` 共 107 条全部 `NOT_RUN`（`acceptance_not_run_count=107`）、`pending_user_review=NO`、`pending_user_confirmation_count=0`；实现完成不等于代码复审通过、不等于正式验收或人工正式 `5173` 验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`。下一入口 `CHATGPT_POPPER_WIDTH_BASELINE_R2_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL`（完整界面自检见报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001.md`）。
- 2026-09-11，查询下拉固定宽度基线 R2 支持视口边界修正草案（纯文档 + 证据文本空白纠正任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001-R2`，不修改任何 `frontend/`/`backend/`/SQL 业务实现、不执行正式验收、不把任何 `DSS-AC-*` 改为 `PASS`）：正式实现任务落地后，ChatGPT 从远程 Git 复审其提交结论为 `CHANGES_REQUIRED`，并确认：桌面档正式支持视口内三档外层宽度稳定成立（`480/400/240px`）；`240px` 极窄视口下探针端/源库内层 `.el-select-dropdown`（EP 内联 `min-width` `238/298`）超出外层 `224`（分别约 `+15/+75`）；原基线“`<496/<416/<256px` 必须正式通过”与“禁用 `!important`/禁用 JS 尺寸监听/不侵入 Element Plus 内部”自相矛盾。项目负责人据此把正式支持视口下限设为 `1280px`。本文件**只定向修订** §21.3（写入正式支持下限与内外层对象区分）、§21.6（窄视口改为非正式支持范围内的防御性观察）与本节状态/下一入口，**不重写** §21.1/§21.2/§21.4/§21.5 的业务规则；编号与计数**零变化**（需求 87/87、验收 107/107，无悬空），`DSS-REQ-001~086` 与 `DSS-AC-001~103` 业务行逐字节零差异；`API.md`/`DATABASE.md` 契约与业务正文零变化、后端零差异。状态：原 `480/400/240px` 视觉方向 `APPROVED_BY_PROJECT_OWNER`（不变）；R2 修正文档 `popper_width_r2_document_status=DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`（**未批准**）；正式实现 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`；代码复审 `CHANGES_REQUIRED`；正式验收 `NOT_RUN`；人工视觉/交互复审 `NOT_PASSED`；`pending_user_review=YES`、`pending_user_confirmation_count=0`。**不得**把本 R2 草案写成 `APPROVED`/`IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/`PASS`/`COMPLETED`，也**不是**把已发生的窄视口溢出伪装成原基线已经通过。下一入口 `CHATGPT_POPPER_WIDTH_BASELINE_R2_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL`（R2 报告见 `reports/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001-R2.md`）。
- 2026-09-12，查询下拉固定宽度基线 R2 支持视口边界修正批准收口（纯文档批准收口任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-R2-APPROVAL-001`，不实现/不验收/不重审实现）：ChatGPT 已从远程 Git 对 R2 草案的批准内容基准提交 `0666cd96f1f27784f6d77404bd8d4820dbd96013` 完成独立复审 `chatgpt_r2_final_review_status=APPROVED`，项目负责人随后明确回复“批准”（`project_owner_r2_approval_status=APPROVED`），据此把 R2 支持边界修正文档由 `DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL` 收口为 `popper_width_r2_document_status=APPROVED`（`supported_viewport_min_width_px=1280`、`sub_1280_formal_support_status=NOT_FORMALLY_SUPPORTED_DEFENSIVE_ONLY`、`ultra_narrow_formal_acceptance_requirement_status=WITHDRAWN_BY_APPROVED_R2`、`pending_user_review=NO`、`pending_user_confirmation_count=0`）。仅修改本文件 §1 当前元数据状态行、§21 批准前言/当前状态/下一入口与本节变更记录；**§21.2～§21.6 业务规则逐字节不变**，需求 87、验收 107（全部 `NOT_RUN`）；实现 `popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、代码复审 `CHANGES_REQUIRED`、正式验收 `NOT_RUN`、人工视觉/交互复审 `NOT_PASSED` 均保持不变（批准 R2 文档不代替实现重新复审与正式验收，`DSS-AC-104~107` 业务行冻结、不改为 `PASS`）。下一入口 `CHATGPT_POPPER_WIDTH_IMPLEMENTATION_REREVIEW_AGAINST_APPROVED_R2_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`（报告见 `reports/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-R2-APPROVAL-001.md`）。
- 2026-09-12，查询下拉固定宽度实现复审收口（纯文档复审结论收口任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-REVIEW-CLOSEOUT-001`，不修改代码、业务规则、API/数据库契约或验收结果、不执行正式验收）：ChatGPT 已按已批准 R2 支持边界从远程 Git 重新复审正式实现提交 `e3c239230bbe854f0280a05f8151d30174fea110`，给出 `popper_width_formal_code_review_status=APPROVED`（复审确认四个正式支持视口 `1280×800/1700×920/1920×1080/2560×1440` 下探针端/源库/快照状态外层 popper 宽度恒为 `480/400/240px`，跨初始、长短选项切换、选择、取消、清空、重置、多选折叠、面板关闭重开、Tooltip 显隐及滚动条状态宽度 spread 与相邻 delta 均为 0，trigger 为 `240/300/200×32px`，四字段 `trim + 20 Unicode 码点截断`、`CLIENT_DESC` Tooltip 与完整原始值查询语义未回退，Feature 私有样式精确作用于 `.el-popper.dss-*-popper`，未使用 `!important`/JS 尺寸监听/全局 Element Plus 覆盖）；项目负责人已在 `5173` 正式页面人工检查查询下拉弹层交互并明确回复“人工检查了，没有问题”，据此收口 `human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`；实现状态由 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW` 更新为 `popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`。原先的超窄视口冲突已通过获批 R2 支持边界合法解除，而不是通过隐瞒证据或增加侵入式代码解除。仅修改本文件 §1 当前元数据状态行、§21 批准前言/当前状态/下一入口与本节变更记录；**§21.2～§21.6 业务规则逐字节不变**（`480/400/240px`、`min(target, calc(100vw - 16px))`、1280px 正式支持下限、trigger `240/300/200×32px`、trim/20 码点/Tooltip/原始查询值语义均不变），需求 87、验收 107（全部 `NOT_RUN`）；`frontend/`/`backend/`/SQL/配置/测试代码零改动，接口/数据库契约零变化，既有 evidence、截图、日志、浏览器矩阵与既有 reports 零改动。代码复审与人工视觉检查通过**只表示**实现可以进入独立正式验收阶段，**不得**写成 107 条正式验收已执行/通过、Feature 已正式验收通过、`IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/`formal_acceptance_status=PASS`/`COMPLETED`。遗留：`DESIGN.md` §14.2/§14.3 中 `DSS-REQ-084~086`/`DSS-AC-096~103` 的旧 `DRAFT_PENDING_USER_REVIEW` 表述属既有查询控件交互调整文档缺陷，本任务不顺带修正，后续另立独立文档一致性任务处理。统一下一入口更新为 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`（报告见 `reports/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-REVIEW-CLOSEOUT-001.md`）。
- 2026-09-12，**正式验收执行同步记录**（`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`，正式验收执行任务，非代码修复、非最终收口，不修改任何界面业务规则）：本 Feature 已由该独立任务按已批准需求/设计/UI/API/DATABASE 与 `DSS-AC-001~107` 全部 107 条执行正式验收，结果 `PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0 = 107`，唯一 `BLOCKED` 为 `DSS-AC-065`（受控测试数据需人工 `INSERT/UPDATE/DELETE/MERGE`，本任务 `§6.2` 明确不授权且无充分替代证据）。**界面业务零变化**：§21.2～§21.6 业务规则、`DSS-REQ-001~087` 需求业务行、`DSS-AC-001~107` 验收业务行（除“状态”列）、§14.2/§14.3 追踪矩阵（87/87、107/107）均逐字节不变；`frontend/`/`backend/`/SQL/配置/测试代码零改动；本文件仅同步 §1 当前正式验收执行状态、结果计数与下一入口，并追加本条变更记录。§1/§21 中早先“107 条全部 `NOT_RUN`”表述均为 2026-09-12 执行前的历史值，已加时间限定。状态同步：`formal_acceptance_status=PARTIALLY_EXECUTED_BLOCKED`、`acceptance_execution_status=BLOCKED`、`formal_acceptance_executed_count=106`、`formal_acceptance_blocked_count=1`、`formal_acceptance_not_run_count=0`；`popper_width_r2_document_status=APPROVED`、`popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`、`popper_width_formal_code_review_status=APPROVED`、`human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`、`project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER` 均保持不变；`human_visual_acceptance_status` 仍为 `NOT_RUN`。**正式验收已执行不等于最终接受**：不构成 `IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/Feature 完成；下一入口统一为 `CHATGPT_FORMAL_ACCEPTANCE_REVIEW_FROM_GIT_THEN_TARGETED_COMPLETION_TASK`（报告见 `reports/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001.md`）。
- 2026-09-12，**R1 定向补验同步记录**（`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1`，定向补验任务，非代码修复、非最终收口，不修改任何界面业务规则）：本 Feature 已由该独立任务完成 R0 唯一 `BLOCKED` 用例 `DSS-AC-065` 的定向补验，并纠正 R0 报告两项事实（`git diff --check` 非零仅来自保留的 R0 原始逐字日志行尾空白；ZooKeeper 分层事实）。项目负责人 2026-09-12 明确总体授权、并在完整展示阶段 A SQL 后明确回复“批准执行上述 SQL”；补验仅在开发库 `CDC` 唯一业务表 `CDC_DATA_SOURCE_RUN_STATE` 插入 7 条带独立前缀 `dss-fa065-r1-` 的临时行（`COMMIT`），随后按 §8.3 以完整复合主键 `DELETE` 全部 7 条并 `COMMIT`，三表与任务前**逐字节一致**、任务前缀残留 `0`。最终正式验收结果 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`。**界面业务零变化**：§20.1～§20.6 与 §21.2～§21.6 业务规则、`DSS-REQ-001~087` 需求业务行、`DSS-AC-001~107` 验收业务行（除“状态”列）、§14.2/§14.3 追踪矩阵（87/87、107/107）均逐字节不变；`frontend/`/`backend/`/SQL/配置/测试代码零改动；本文件仅同步 §1 与 §21 的当前正式验收状态、结果计数与下一入口并追加本条变更记录。**正式验收已执行不等于最终接受**：不构成 `IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/Feature 完成；下一入口统一为 `CHATGPT_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_ACCEPTANCE_DECISION`（报告见 `reports/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1.md`）。
