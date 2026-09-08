# 源库快照状态 Feature 设计草案（DESIGN）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态 |
| Feature 标识 | `data-source-snapshot-status`（Feature 文档目录标识；任务代码前缀 `DATA-SOURCE-SNAPSHOT-STATUS`） |
| 所属模块 | 运行监控 |
| 既有路由 | `/monitor/data-source-state`（保持既有值不变；本设计不新增、不重命名、不改挂） |
| 前端源码目录 | `frontend/src/views/data-source-run-state/`（保留既有目录名，不做无业务价值目录重命名；命名映射见 UI §10） |
| 目标文档 | `docs/features/data-source-snapshot-status/DESIGN.md`（总设计入口） |
| 配套设计文档 | `API.md`（接口设计草案）、`UI.md`（界面设计草案）、`DATABASE.md`（数据库查询设计草案） |
| 文档状态 | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前版为 2026-09-08 第二轮验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`、其 R1 极小定向修订 `...-002-R1` 与 R2 极小纠正 `...-002-R2` 后的当前第二轮 UI 调整 R2 纠正复审版：第二轮版本曾由 ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审 `APPROVED`、项目负责人随后明确回复“批准”，正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`（批准日期 2026-09-08，批准内容基准提交 `5da9b17...`），本第二轮调整版本状态由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 收口为 `APPROVED`，该批准作为历史批准事实保留；批准收口后发现批准内容把“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”误记为现行规则，与项目负责人真实需求冲突（ChatGPT 在准备第二轮实现任务时发现该冲突并暂停、项目负责人再次确认源库列悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`），故本 R2 纯文档纠正该唯一业务语义并重新进入复审，当前版本状态为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`。驱动：项目负责人对第一轮 UI 调整实现 R1（提交 `5933ec2...`）对应预览页人工检查结论 `CHANGES_REQUIRED`（human_visual_review_status=CHANGES_REQUIRED，第一轮页面人工检查历史）。第一轮 UI 调整批准版本（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07；实现 R1 提交 `5933ec2...` 经 ChatGPT 独立代码与证据复审 `APPROVED`、实现状态收口为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`）保留为历史。本轮只围绕四类已确认调整范围（表格铺满结果卡片、探针端列展示简化、源库列展示简化、探针端查询下拉框长度与文本截断，见本文件 §22 与 REQUIREMENTS §21.2/§21.3）定向修订既有设计落点并新增 `DSS-REQ-072~075` 对应设计落点；本轮不改接口、SQL、表结构、数据库访问与产品只读边界（API.md/DATABASE.md 整文件零差异）。R2 只纠正本轮 UI 调整设计中“正常源库行 Tooltip 显示完整 ORG”为“悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（正常行与回退行同源）”这一唯一业务语义；当前 R2 纠正版本未批准，不代表本轮调整已实现、正式验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`；`pending_user_review=YES`、`pending_user_confirmation_count=0`，见本表“本轮（第二轮 UI 调整草案）任务编号/授权基线”“本版（第二轮 R2 极小纠正）任务编号/授权基线”、任务边界声明与本文件 §22/§23/§24） |
| requirements_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前第二轮 UI 调整版本经 R2 极小纠正后重新进入复审：曾于 2026-09-08 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`，作为历史批准事实保留），因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`、与负责人真实需求（悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`）冲突，R2 纠正后当前版本待 ChatGPT 独立正式复审与项目负责人重新批准；`DSS-REQ-001~075` 共 75 条，见 `REQUIREMENTS.md`；第一轮 UI 调整批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`（批准内容基准提交 `5757237...`，2026-09-07）保留为历史） |
| acceptance_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前第二轮 UI 调整版本经 R2 极小纠正后重新进入复审，同本表 requirements_status；`DSS-AC-001~086` 共 86 条全部 `NOT_RUN`，见 `ACCEPTANCE.md`；第一轮批准版本保留为历史） |
| design_status | `DESIGN.md`/`UI.md` 当前第二轮调整版本经 R2 极小纠正后为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（曾随批准收口为 `APPROVED`：正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，2026-09-08，作为历史批准事实；R2 纠正源库 Tooltip 内容后重新进入复审，见本文件 §22/§23/§24 与 UI 对应章节）；`API.md`/`DATABASE.md` 保持已批准（`APPROVED`）且本轮**整文件零差异**（本轮不改接口、SQL、表结构、数据库访问与产品只读边界） |
| implementation_status | `IMPLEMENTED_ADJUSTMENT_PENDING`（implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING：第二轮 UI 调整尚未实现；R2 极小纠正版当前重新进入复审、未批准，将在 ChatGPT 对本 R2 结果独立正式复审与项目负责人重新批准后另立第二轮 UI 调整实现任务落地。第一轮 UI 调整已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`（2026-09-07）按批准内容基准提交 `5757237...` 落地、实现 R1 提交 `5933ec2...` 经 ChatGPT 独立代码与证据复审 `APPROVED`、实现状态收口为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（见本文件 §21），作为历史保留；不代表代码复审通过、不代表正式验收或人工验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`） |
| acceptance_execution_status | `NOT_RUN`（acceptance_execution_status=NOT_RUN；`DSS-AC-001~086` 共 86 条全部 `NOT_RUN`、acceptance_not_run_count=86，正式验收未执行，见 `ACCEPTANCE.md`） |
| pending_user_confirmation_count | `0`（本轮第二轮调整无必须由项目负责人补充决策的待确认项） |
| pending_user_review | `YES`（当前第二轮 UI 调整版本经 R2 极小纠正后重新进入复审，pending_user_review=YES；本轮无待人工决策项、`pending_user_confirmation_count=0`。第二轮版本曾收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，2026-09-08，作为历史批准事实），R2 因批准内容误记源库 Tooltip 内容而纠正并恢复 pending_user_review=YES；第一轮 UI 调整版本的 `pending_user_review=NO` 已收口，作为历史） |
| 设计任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001`（纯文档设计草案建立；历史） |
| 设计 R1 修订任务 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001-R1`（ChatGPT 正式设计复审 `CHANGES_REQUIRED` 驱动的极小定向修订，见 §16；历史） |
| 设计批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`（设计批准收口任务；批准日期 2026-09-06，见 §17；历史批准版本，本轮 UI 调整草案在其之上建立，批准不自动延伸到本轮调整） |
| 设计批准内容基准 | `61117a62f44d39f7c548ebcb650891abf91b9b8c`（R1 结果提交；ChatGPT 对 R1 正式复审 `APPROVED` 并获项目负责人批准的内容基准，见 §17；历史基准） |
| 第一轮（UI 调整版本）正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`（第一轮 UI 调整需求/验收/设计批准收口；项目负责人明确“批准”驱动，见 §20） |
| 第一轮（UI 调整版本）批准链 | R0 验收前 UI 调整草案提交 `dc1d5285a541dd799521a778e5d00996ea0b4222` → ChatGPT 正式复审 `CHANGES_REQUIRED`（唯一问题：`auto`/`restore` 刷新在途时“立即刷新”按钮 loading 语义不明确）→ 项目负责人确认 `initial/retry/query/manual/auto/restore` 六类请求唯一视觉映射 → R1 极小定向修订提交 `575723711ca39d7761df308c1c99b1e6e957cf70` → ChatGPT 对 R1 结果独立正式复审 `APPROVED` → 项目负责人明确回复“批准” |
| 第一轮（UI 调整版本）批准依据提交 | `575723711ca39d7761df308c1c99b1e6e957cf70`（ChatGPT 对 UI 调整 R1 结果独立正式复审 `APPROVED` 的 R1 结果提交；该批准收口以该提交为批准内容基准） |
| 第一轮（UI 调整版本）批准日期 | 2026-09-07 |
| 第一轮（UI 调整草案）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`（验收前 UI 调整草案建立；ChatGPT 对实现 R1 提交 `37825272c25c8a2d8a595ff0d5c25c6349186663` 代码复审 `CHANGES_REQUIRED` 后，项目负责人提出更完整的 UI 调整，该轮在已批准设计基线之上建立**纯文档调整草案**，设计落点见 §19；该草案后于 2026-09-07 经批准收口，见 §20；历史） |
| 第一轮（UI 调整草案）授权基线提交 | `37825272c25c8a2d8a595ff0d5c25c6349186663`（该轮开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；历史） |
| 本轮（第二轮 UI 调整草案）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`（第二轮验收前 UI 调整草案建立；项目负责人对第一轮 UI 调整实现 R1 对应预览页人工检查结论 `CHANGES_REQUIRED` 驱动；**纯文档草案**，未批准、第二轮调整未实现、正式验收未执行，设计落点见 §22）；该草案及其 R1 极小定向修订（`...-002-R1`）后经批准收口，正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，见 §23，作为历史批准事实保留；因批准内容误记源库 Tooltip 内容，R2 极小纠正 `...-002-R2` 后重新进入复审（见 §24） |
| 本轮（第二轮 UI 调整草案）授权基线提交 | `5933ec29dce5f20b3d34aa101de4c8f9a884b93a`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；第一轮 UI 调整实现 R1 结果提交同为此提交） |
| 本轮（第二轮 UI 调整草案）驱动来源 | 项目负责人人工页面检查结论（任务提示词 §4，无待人工决策项）：① 表格必须铺满结果卡片（去除固定 `1145px`，五固定列＋探针端/源库两弹性列）；② 探针端列展示简化（仅原始 `CLIENT_ID`、Tooltip 仅完整 `CLIENT_DESC`、删除黄色图标、非启用红字“停用”、缺失静默）；③ 源库列展示简化（删除黄色图标；表格主内容显示 `DATA_SOURCE_ORG`、ORG 为空/配置缺失时回退原始 `DATA_SOURCE_ID`；悬停 Tooltip 均只显示完整原始 `DATA_SOURCE_ID`，R2 纠正）；④ 探针端查询下拉框长度与文本截断（ID/描述各 20 Unicode 字符＋`...`、控件/面板宽度上限、完整 value 不变） |
| 本轮（第二轮 UI 调整版本）正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`（本轮第二轮 UI 调整需求/验收/设计批准收口；项目负责人明确“批准”驱动，见 §23）；该批准版本作为历史批准事实保留——批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`，与负责人真实需求冲突，已由 R2 `...-002-R2` 纯文档纠正并重新进入复审（见 §24） |
| 本轮（第二轮 UI 调整版本）批准链 | 项目负责人对第一轮 UI 调整实现 R1（提交 `5933ec2...`）对应预览页人工检查结论 `CHANGES_REQUIRED`（表格铺满、探针端列简化、源库列简化、查询下拉截断四类）→ 第二轮验收前 UI 调整草案初版提交 `0889cec1a67b6e0be654f6cb1f771b71df19677d` → ChatGPT 对初版独立复审 `CHANGES_REQUIRED`（四项核心调整通过，残留冲突见 `DSS-REQ-067`、DESIGN §5.6、UI §8.2/§16.1 与实现职责）→ R1 极小定向修订提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` → ChatGPT 对 R1 结果独立正式复审 `APPROVED` → 项目负责人明确回复“批准” |
| 本轮（第二轮 UI 调整版本）批准依据提交 | `5da9b17c1a720f89482eeda1436ad633145fe9fa`（ChatGPT 对第二轮 UI 调整 R1 结果独立正式复审 `APPROVED` 的 R1 结果提交；本批准收口以该提交为批准内容基准） |
| 本轮（第二轮 UI 调整版本）批准日期 | 2026-09-08 |
| 本版（第二轮 R2 极小纠正）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2`（ChatGPT 在准备第二轮实现任务时发现批准内容把正常源库行 Tooltip 误记为完整 `DATA_SOURCE_ORG`、与负责人真实需求冲突并暂停、项目负责人再次确认“显示源库ID”驱动的纯文档极小纠正；当前版本重新进入复审、第二轮调整未实现、正式验收未执行） |
| 本版（第二轮 R2 极小纠正）授权基线提交 | `ae8756a2f80b0c418a7afd1da4d51c04d7b85e21`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；第二轮批准收口结果提交同为此提交） |
| 调整草案关系 | 历史基线：已批准需求/验收基线（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准 `4234af73db2190098f3dcd219319a4281fdabafd`）、已批准设计基线（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`，批准内容基准 `61117a62f44d39f7c548ebcb650891abf91b9b8c`，见 §17）与第一轮 UI 调整批准版本（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07，见 §20；已由实现任务 `...-UI-ADJUSTMENT-IMPLEMENTATION-001` 落地、实现 R1 提交 `5933ec2...` 经 ChatGPT 独立代码与证据复审 `APPROVED`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`，实现记录见本文件 §21）全部保留为历史。当前（第二轮）UI 调整版本（第二轮验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002` 及 R1 极小定向修订 `...-002-R1`）经 ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审 `APPROVED` 且项目负责人明确回复“批准”，曾由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准日期 2026-09-08，见 §23，作为历史批准事实保留）。因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`、与负责人真实需求冲突，本 R2 `...-002-R2` 纯文档纠正为“悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（正常行与回退行同源）”并重新进入复审，当前第二轮调整版本 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`。本轮只围绕四类已确认调整范围（表格铺满结果卡片、探针端列展示简化、源库列展示简化、探针端查询下拉框长度与文本截断，见本文件 §22 与 REQUIREMENTS §21.2/§21.3）定向修订既有展示规则设计落点并新增 `DSS-REQ-072~075` 对应设计落点，不改接口、SQL、表结构、数据库访问与产品只读边界（API.md/DATABASE.md 整文件零差异）。下一入口为 ChatGPT 对本 R2 结果提交独立正式复审，重新批准后再另立第二轮 UI 调整实现任务（不是在本任务直接实现） |
| 设计任务授权基线提交 | `38da355f16438ad0d9156acdd667e9258fe89141`（本任务开始时 `origin/develop` 最新提交；本地 HEAD 与其一致；历史基线） |
| R1 修订基准提交 | `31aa9f5beec7ded3cd798b3af617fd79a1606ed0`（R1 修订开始时 `origin/develop` 最新提交，即上一结果提交；历史基线） |
| 批准内容基准 | `4234af73db2190098f3dcd219319a4281fdabafd`（已批准需求/验收的批准内容基准） |
| 创建日期 | 2026-09-05；2026-09-06 设计批准收口；2026-09-07 建立第一轮验收前 UI 调整草案并批准/实现；2026-09-08 建立第二轮 UI 调整草案（R0/R1）并批准收口为 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，同日以 `...-002-R2` 纯文档纠正源库 Tooltip 内容并重新进入复审 |
| 依据需求 | `REQUIREMENTS.md`（`DSS-REQ-001~075` 共 75 条：`DSS-REQ-001~071` 承接已批准/第一轮 UI 调整历史基线 + 本轮第二轮新增 `DSS-REQ-072~075`；当前第二轮 UI 调整版本文档状态 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（经 R2 极小纠正后重新进入复审；曾收口为 `APPROVED`：正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17...`，2026-09-08，作为历史批准事实保留），既有批准版本保留为历史） |
| 依据验收 | `ACCEPTANCE.md`（`DSS-AC-001~086` 共 86 条全部 `NOT_RUN`；当前第二轮 UI 调整版本文档状态 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（经 R2 极小纠正后重新进入复审；曾收口为 `APPROVED`：正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17...`，2026-09-08，作为历史批准事实保留），既有批准版本保留为历史） |
| 数据库事实依据 | `docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`（已提交数据库只读复核报告；本设计任务未连接数据库，见 DATABASE §2） |

任务边界声明：

- 本文件只把已批准需求与验收转换为**可复审、可实现、可测试的四份设计草案**，不改变任何已批准业务规则，不编码，不执行测试或验收，不访问或操作数据库/ZooKeeper/Kafka/sync-client，不启停服务。
- 本文件已作为正式设计基线批准（批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`，批准日期 2026-09-06，见 §17）；草案阶段“设计状态保持 `DRAFT_PENDING_USER_REVIEW`、不得写成 `APPROVED`”的限制已由批准收口解除（该阶段历史见 §16 R1-04）。设计批准不代表功能已实现：功能仍不得写成 `IMPLEMENTED`、`IMPLEMENTED_PENDING_REVIEW` 或 `IMPLEMENTED_ACCEPTED`；验收用例仍全部保持 `NOT_RUN`，不得改为 `PASS/FAIL/BLOCKED`。
- 本文件第一轮 UI 调整记录（2026-09-07 验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001` 及其 R1 定向修订 `...-001-R1` 收口并实现的版本；其中设计落点凡被第二轮草案取代处，现行以 §22 为准）：只在展示内容/Tooltip/刷新布局/busy 视觉状态相关设计（§19）上补充设计落点，不改变 API/DATABASE 契约；该版本已经 ChatGPT 对 R1 结果提交 `5757237...` 独立正式复审 `APPROVED` 与项目负责人明确“批准”，`DESIGN.md`/`UI.md` 调整版本收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07，见 §20）、第一轮 UI 调整已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`（2026-09-07）按批准内容基准提交 `5757237...` 落地、实现状态收口为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（见本文件 §21）、`pending_user_review=NO`、`pending_user_confirmation_count=0`；需求 `DSS-REQ-001~071`、验收 `DSS-AC-001~080` 全部 `NOT_RUN`。批准并实现完成不代表代码复审通过、不代表正式验收或人工验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`；既有批准基线保留为历史。本轮不改接口、SQL、表结构、数据库访问与产品只读边界（API.md/DATABASE.md 整文件零差异）。
- 本版（2026-09-08）为第二轮验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`）、其 R1 极小定向修订（`...-002-R1`）与 R2 极小纠正（`...-002-R2`）后的当前第二轮 UI 调整 R2 纠正复审版：项目负责人对第一轮 UI 调整实现 R1（提交 `5933ec2...`）对应预览页人工检查结论 `CHANGES_REQUIRED`（human_visual_review_status=CHANGES_REQUIRED，第一轮页面人工检查历史），故在第一轮批准版本之上，只围绕四类已确认调整范围（表格铺满结果卡片、探针端列展示简化、源库列展示简化、探针端查询下拉框长度与文本截断）定向修订既有展示规则设计落点并新增 `DSS-REQ-072~075` 对应设计落点（见 §22；对应 REQUIREMENTS §21.2/§21.3 的 `DSS-REQ-072~075` 与 ACCEPTANCE 新增 `DSS-AC-081~086`）。该版本曾由 ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审 `APPROVED`、项目负责人明确“批准”，当前第二轮调整版本由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17...`，2026-09-08，见 §23，作为历史批准事实保留）。批准收口后发现批准内容把“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”误记为现行规则、与负责人真实需求（悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`）冲突（ChatGPT 在准备第二轮实现任务时发现并暂停、项目负责人再次确认），故本 R2 `...-002-R2` 纯文档纠正该唯一业务语义并重新进入复审：当前 `requirements_status`/`acceptance_status`/`design_status(DESIGN/UI)`=`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`（本轮调整尚未实现）、正式验收执行 `NOT_RUN`（`DSS-AC-001~086` 全部 `NOT_RUN`、`acceptance_not_run_count=86`）、人工页面验收 `NOT_RUN`、`pending_user_review=YES`、`pending_user_confirmation_count=0`。第一轮批准并实现完成的版本保留为历史；不得把本 R2 纠正版本写成已批准、功能已实现、页面已通过人工检查或正式验收已通过（`APPROVED`/`IMPLEMENTED_ACCEPTED`/`PASS`/`ACCEPTED`）。本轮不改接口、SQL、表结构、数据库访问与产品只读边界（API.md/DATABASE.md 整文件零差异）。
- “设计文档已建立/已批准”不等于“功能已实现、验收已执行或通过”，也不等于 `IMPLEMENTED_ACCEPTED`；下一入口为**另立实现任务**（见 README §10）。
- 本文件建议的类名/包名/文件路径用于后续实现阶段，**不代表当前仓库已存在这些实现**（现状盘点见 §3）。

## 2. 设计目标与边界

### 2.1 设计目标

把已批准的“源库快照状态”只读监控需求落地为一份可直接实现的前后端设计：确定接口数量与职责、候选数据返回方式、筛选所在层、时间传输方式、异常标志模型、前端状态存放方式、计时器与请求令牌策略等关键技术方案（§4~§13），使实现阶段无需再做方案级决策。

### 2.2 范围内（设计对象）

- 后端只读查询链路：Controller → Query → Service → 只读 Mapper → VO。
- 前端页面：查询区（三项多选）、七列表格、刷新工具栏、状态与异常展示、60 秒自动刷新。
- “界面选择条件 / 已应用查询条件”两阶段状态、请求快照、失败保留与恢复可见刷新。
- 只读 LEFT JOIN（等价保行）补充探针端描述与源库 ORG 等展示信息。
- 待实现阶段的测试设计（后端单测 / Mapper SQL 审计 / JSON 契约 / 前端组件与 composable 测试 / 浏览器人工验证）。

### 2.3 范围外（设计明确不引入）

- 任何写接口、写按钮、隐式写行为；对 `CDC_DATA_SOURCE_RUN_STATE` 的任何 DML/DDL。
- 分页、每页条数、翻页控件、`PageResult` 语义（本 Feature 不分页）。
- sync-client 在线/健康/失联、增量采集状态、同步进度、时间推断（超时/异常/离线/长期运行）。
- 从配置表补 RUN_STATE 缺失行、虚拟状态（未开始/待快照/尚无快照记录）。
- 依据 `UPDATED_AT` 推断任何健康状态。
- Kafka / ZooKeeper / TongZK / sync-client 接入。
- 表头自定义排序、操作列、详情/编辑/删除/跳转入口。

### 2.4 不得改变的业务规则（约束清单）

详见 §5.1~§13，逐条落实 `DSS-REQ-001~065`。四份设计必须整体保持一致（prompt §10.1）：接口路径、参数名、JSON 字段名、状态枚举、时间格式、错误码、候选方案与刷新状态机完全一致。

## 3. 现状盘点与可复用模式

以下为仓库**当前真实代码/文档**盘点（只读；本任务不改动任何源码）。后续实现应复用下列成熟模式，但不得照搬与本 Feature 冲突的分页、候选范围、状态语义或路由（prompt §2.7）。

### 3.1 前端现状

- 占位页：`frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（`PlaceholderPage`，标题“数据源运行状态”，AS-IS）。
- 路由：`frontend/src/router/index.ts` 存在 `/monitor/data-source-state`（name `DataSourceRunState`，title“数据源运行状态”，group“运行监控”）；另有 `/monitor/topic-offset`（name `TopicOffset`）等同组监控路由。
- 菜单：`frontend/src/config/menu.ts`“运行监控”组含 `/monitor/data-source-state`（title“数据源运行状态”）。
- HTTP：`frontend/src/services/http.ts`——axios 实例，`baseURL=import.meta.env.VITE_API_BASE_URL || ''`，默认超时 10000ms，响应拦截器直接返回 response，错误拦截器统一 `ElMessage.error` 后 reject。**查询类长耗时请求按需在 api 封装层覆盖更长超时**（topic-offset 用 30000ms）。
- API 类型基座：`frontend/src/types/monitor.ts`（`ApiResponse<T>`）、`frontend/src/types/topicOffset.ts`。
- API 封装惯例：`frontend/src/api/topicOffset.ts` 手工实现重复参数序列化（axios 默认会把数组序列化为 `clientId[]=`，必须用 `paramsSerializer` 生成 `clientId=A&clientId=B`）。
- 可复用组件：`frontend/src/components/PlaceholderPage.vue`、`frontend/src/components/ClientCard.vue` 等。
- 状态管理：Pinia（`frontend/src/stores/topicOffset.ts` 为“路由级会话 store”，保存“上一次成功”的生效条件、结果与最近成功刷新时间 `lastSuccessAt`（前端 epoch），`hasSuccess` 计算属性；不用 localStorage）。
- composable 惯例：`frontend/src/views/topic-offset/composables/useTopicOffset.ts`——**单飞行＋最新意图槽位**并发模型：`busy`/`running`/`slot`/`acceptedSeq`（意图序号）、`disposed`（页面卸载）、`hidden`（页面隐藏）、定时器；仅当响应 `op.seq===acceptedSeq` 才允许提交；`ESTABLISHING`（initial/retry/query）与 `LIGHT`（page/manual/restore/auto）分级决定整表 loading 还是工具栏轻量状态。
- 选择工具惯例：`frontend/src/views/topic-offset/utils/selection.ts`——`ALL_OPTION='__ALL__'` 哨兵只存在于草稿层、绝不作为真实值请求；`normalizeDimension` 实现“全部”与具体候选互斥、清空回到“全部”；`rowKey.ts` 用 NUL 分隔复合键避免字符串拼接歧义。
- 测试：`frontend/src/views/topic-offset/*.spec.ts`（vitest，含组件与 composable 测试）。

> 上述 topic-offset 的“路由级会话 store（跨路由恢复现场）”与“最新用户意图槽位/覆盖补发”并发语义**仅为 AS-IS 只读盘点，不复用于本 Feature**：本 Feature 采用页面/composable 实例内状态（不新增 Pinia store、不跨路由恢复现场，R1-01）＋统一忙碌抑制（不排队，R1-02）＋一次性恢复可见延后刷新标志（R1-03），见 §7/§9。

### 3.2 后端现状

- 分层：`Controller(@RestController) → Service → Mapper`，公共组件 `common/api/ApiResponse`、`common/page/PageResult`、`common/exception/BusinessException`、`common/exception/GlobalExceptionHandler`。
- `ApiResponse<T>`：`{ code, message, data, timestamp }`；成功 `code=200,message="success"`。
- 异常：`BusinessException(code,message)` 由 `GlobalExceptionHandler` 以 **HTTP 200** 返回业务错误体；参数校验 400、类型不匹配 400、兜底 500 `"服务器内部错误"`（脱敏）。监控模块各 Feature 使用独立错误码枚举，数字互不重叠：zookeeper `5001~5003`、topicoffset `40001~40003`、jobfailure/datasource/logquery/serverconfig/subscription 等各自段位；**`41xxx` 段当前未被任何模块占用**（本 Feature 选用，见 API §8）。
- 已实现的只读监控参考 Feature **topic-offset**（前后端均已提交）：
  - `backend/.../monitor/topicoffset/controller/TopicOffsetController.java`——只暴露 `GET`，`@RequestParam(required=false) List<String> ...`，用 Query 对象承载。
  - `TopicOffsetQueryServiceImpl`——全量只读 `selectAll()` 后在服务层做过滤/映射/切片（本 Feature 复用其“**全量加载→服务层过滤**”骨架，但因 DSS 不分页且候选必须来自 RUN_STATE 全量，做 DSS 特有调整，见 §5/§6）。
  - `TopicOffsetMapper`——**纯注解 `@Select`、显式列别名、不继承 BaseMapper、无写方法**；`DATE` 字段用 Oracle `TO_CHAR(..., 'YYYY-MM-DD HH24:MI:SS')` 确定性字符串化后 Java 只透传（本 Feature 的 3 个 DATE 列沿用同一方案）。
  - `ClientConfigMapper` / `DataSourceConfigMapper`——显式列投影；`DataSourceConfigMapper` 列清单**绝不包含 `DATA_SOURCE_PASSWORD`**。
  - 映射模型 `TopicEndpointMappingVO(state=ACTIVE/INACTIVE/NOT_FOUND, id, org/desc)` 表达“配置存在/停用/不存在”，本 Feature 的关联引用状态模型（§5.6）沿用同风格但按 DSS-REQ-043/044 扩展 source 维度。
  - 错误码枚举风格：`enum XxxErrorCode { NAME(code, message) }`；常量类 `XxxConstants` 承载 `FG_ACTIVE_ENABLED="1"`、`MAX_FILTER_IDS`、映射状态词等。
- Jackson（`backend/src/main/resources/application.yml`）：`date-format: yyyy-MM-dd HH:mm:ss`、`time-zone: GMT+8`、`default-property-inclusion: non_null`。因此**需要 JSON 显式 null 的字段必须在 VO 上用字段级 `@JsonInclude(Include.ALWAYS)`**（topic-offset 的 `TopicOffsetItemVO` 即如此，不改全局配置）。
- MyBatis-Plus：`@MapperScan("com.bsoft.cdcconfig.**.mapper")`。**注意 bean 名冲突**：simple class name 默认去重，因此本 Feature 新增 Mapper/Service 的类名不得与既有类撞名（尤其不得再建 `ClientConfigMapper`/`DataSourceConfigMapper`/`DataSourceMapper`，本设计选用唯一名，见 §4.2）。

### 3.3 数据库只读复核事实（摘要）

权威依据为已提交复核报告（本设计不重新查库；物理事实详见 DATABASE §3）。关键结论：`CDC_DATA_SOURCE_RUN_STATE` 六字段、主键 `PK_CDC_DS_RUN_STATE(CLIENT_ID, DATA_SOURCE_ID)`、无外键/触发器/状态封闭 Check、4 个非空字段、2 个可空 DATE；`VARCHAR2` 为 BYTE 语义；当前开发库仅 1 条 `SNAPSHOT_RUNNING` 样例。

## 4. 总体架构与职责划分

### 4.1 总体分层

```
浏览器（Vue 3 SPA）
  页 DataSourceRunStatePage.vue（替换占位页；UI §2）
   ├─ components/ DataSourceSnapshotQueryBar.vue / DataSourceSnapshotTable.vue / DataSourceSnapshotToolbar.vue / DataSourceSnapshotStatusTag.vue
   ├─ composables/ useDataSourceSnapshot.ts（编排：页面实例内状态 + 两阶段条件 + 单飞行 + 60s 计时 + 失败保留 + 恢复可见延后刷新；无 Pinia store）
   ├─ api/ dataSourceSnapshot.ts（GET /api/monitor/data-source-run-state/list，重复参数序列化 + 查询级超时）
   ├─ types/ dataSourceSnapshot.ts（ApiResponse 派生 + 查询/候选/行/映射 VO 类型）
   └─ utils/ selection.ts（ALL_OPTION/互斥/两阶段换算）、rowKey.ts、format.ts、format.spec.ts...
         │  GET（唯一接口；response 内嵌 records + candidates）
         ▼
Spring Boot（Tomcat :8080）
   DataSourceRunStateController（仅 GET，无任何写端点）          [controller]
     └→ DataSourceRunStateQueryService(+Impl)                  [service: 参数归一→全量只读→候选→过滤→排序→映射]
          ├→ DataSourceRunStateMapper（CDC_DATA_SOURCE_RUN_STATE 全量只读 @Select）       [mapper]
          ├→ RunStateClientMapper（CDC_CLIENT_MULTIPLE 显式投影只读 @Select）
          └→ RunStateDataSourceMapper（CDC_DATA_SOURCE 显式投影只读 @Select，不含 PASSWORD）
          ├→ 常量/错误码/枚举（分类与映射状态）
          └→ VO：SnapshotStatusListVO / SnapshotStatusItemVO / CandidateGroupVO / ClientCandidateVO / SourceCandidateVO / ClientRefVO / SourceRefVO
   Oracle 19c（CDC schema）
```

### 4.2 建议的后续实现文件（仅设计建议，当前不创建）

| 层 | 建议路径/类（`backend/src/main/java/com/bsoft/cdcconfig/` 前缀省略） |
|---|---|
| Controller | `monitor/datasourcerunstate/controller/DataSourceRunStateController.java` |
| Query | `monitor/datasourcerunstate/query/DataSourceRunStateQuery.java` |
| Service | `monitor/datasourcerunstate/service/DataSourceRunStateQueryService.java`、`service/impl/DataSourceRunStateQueryServiceImpl.java` |
| Mapper | `monitor/datasourcerunstate/mapper/DataSourceRunStateMapper.java`、`RunStateClientMapper.java`、`RunStateDataSourceMapper.java` |
| Row（Mapper 投影） | `monitor/datasourcerunstate/model/DataSourceRunStateRow.java`、`RunStateClientRow.java`、`RunStateDataSourceRow.java` |
| VO | `monitor/datasourcerunstate/vo/SnapshotStatusListVO.java`、`SnapshotStatusItemVO.java`、`CandidateGroupVO.java`、`ClientCandidateVO.java`、`SourceCandidateVO.java`、`ClientRefVO.java`、`SourceRefVO.java` |
| 枚举/常量/异常 | `monitor/datasourcerunstate/enums/SnapshotStatusCategory.java`（RUNNING/COMPLETED/UNKNOWN）、`constant/DataSourceRunStateConstants.java`、`exception/DataSourceRunStateErrorCode.java` |

前端建议新增/替换（均在既有 `frontend/src/views/data-source-run-state/` 目录内）：

| 项 | 建议路径/文件 |
|---|---|
| 页面 | `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（由占位页替换为正式页） |
| 子组件 | `.../components/DataSourceSnapshotQueryBar.vue`、`DataSourceSnapshotTable.vue`、`DataSourceSnapshotToolbar.vue`、`DataSourceSnapshotStatusTag.vue` |
| composable | `.../composables/useDataSourceSnapshot.ts`（承载页面实例内全部查询现场状态；**不新增 Pinia store**） |
| api | `frontend/src/api/dataSourceSnapshot.ts` |
| types | `frontend/src/types/dataSourceSnapshot.ts` |
| utils | `.../utils/selection.ts`、`rowKey.ts`、`format.ts`（可含 `*.spec.ts`） |

> 类名/包名选择避开既有类撞名（`monitor/topicoffset/mapper/ClientConfigMapper`、`DataSourceConfigMapper` 已存在，故本 Feature 采用 `RunStateClientMapper`/`RunStateDataSourceMapper`/`DataSourceRunStateMapper` 等唯一名），与 MyBatis `@MapperScan` 默认 bean 名兼容。

### 4.3 职责划分

| 组件 | 职责 | 关键约束 |
|---|---|---|
| Controller | 只暴露 `GET /api/monitor/data-source-run-state/list`；把多值请求参数绑定到 Query；不出现任何 POST/PUT/PATCH/DELETE。 | 无写能力；不直接访问 Mapper/DB。 |
| Query/参数归一 | `clientId`/`sourceId`/`status` 多值；trim、去空、去重、数量与取值校验。 | “全部”=参数缺失/空，不传哨兵；status 只允许 `RUNNING/COMPLETED/UNKNOWN`。 |
| Service | ① 归一校验；② 三次全量只读（RUN_STATE + 两张配置投影）；③ 计算候选（RUN_STATE 全量，与筛选无关）；④ 按条件过滤；⑤ 固定排序；⑥ 映射 VO（含关联引用状态、状态分类、NULL 时间）。 | 服务层不调用任何写方法；不拼字符串 SQL；不改任何行。 |
| 只读 Mapper | 纯 `@Select` 注解、显式列别名；无 `BaseMapper`；无写方法。 | 不 `SELECT *`；配置投影不含 `DATA_SOURCE_PASSWORD`。 |
| VO/枚举/常量 | 承载接口契约、映射状态词、常量。 | JSON null 语义字段用 `@JsonInclude(ALWAYS)`。 |
| 页面/composable 实例状态 | 每次路由进入新建页面实例：界面草稿与已应用条件初始为三项“全部”、无最近成功现场，随即自动首次查询；实例内保存“上一次成功”的已应用条件、records/candidates、最近成功刷新时间（前端成功时刻 epoch）、`hasSuccess` 与错误态。 | 失败不写入；不新增 Pinia store；不用 localStorage/sessionStorage；路由离开即销毁、现场不跨路由保留（R1-01）。 |
| 前端 composable | 请求编排：初始/查询/重试/手工/自动/恢复可见、单飞行统一忙碌抑制、60s 计时、失败保留、恢复可见延后单次刷新（`pendingVisibilityRefresh`）。 | 见 §7~§9 状态机；不设通用用户意图槽位（R1-02）；恢复可见延后是唯一例外（R1-03）。 |
| 前端组件 | 查询区草稿、表格展示、工具栏稳定宽度、状态/异常视觉。 | 颜色非唯一通道；稳定宽度；busy 时“查询/立即刷新”按钮禁用。 |

## 5. 后端读取流程设计

### 5.1 单次请求处理流程（结论）

**采用“一次请求内先全量读取、再内存过滤”**（沿用 topic-offset 骨架并做 DSS 化），而不是“动态拼 WHERE 下推 SQL”：

1. Controller 收到 `GET .../list`，把参数归一进 `DataSourceRunStateQuery`（`List<String> clientId/sourceId/status`）。
2. Service 归一校验（§5.2）。
3. 三次**全量只读**：
   - `DataSourceRunStateMapper.selectAll()`：单条固定 `@Select`，读取 RUN_STATE **全部行**（无 WHERE），6 个显式列；3 个 DATE 以 `TO_CHAR` 字符串化（见 DATABASE §9）。这是驱动数据集，绝不因任何配置 JOIN 或过滤丢失行（DSS-REQ-015/019）。
   - `RunStateClientMapper.selectAll()`：`CDC_CLIENT_MULTIPLE` 投影（`CLIENT_ID/CLIENT_DESC/FG_ACTIVE`），建 `CLIENT_ID→行` 索引（`putIfAbsent`）。
   - `RunStateDataSourceMapper.selectAll()`：`CDC_DATA_SOURCE` 投影（`DATA_SOURCE_ID/DATA_SOURCE_ORG/DATA_SOURCE_CATEGORY/FG_ACTIVE`，**无 PASSWORD**），建 `DATA_SOURCE_ID→行` 索引。
4. 基于 **RUN_STATE 全量行**计算候选（§6）——候选与当前筛选无关。
5. 基于同一全量行按“同条件 OR、跨条件 AND”过滤出展示集合（§5.3）。
6. 对展示集合做固定确定性排序（§5.4）。
7. 逐行映射 `SnapshotStatusItemVO`（状态分类 §5.5；关联引用状态 §5.6；时间透传 §5.7）。
8. 返回 `SnapshotStatusListVO{records, candidates}`（§5.8）。

**决策理由**：全量集 ≤ ~100 行，一次全读开销极小；候选与列表来自**同一份读取快照**，天然满足“候选不被当前筛选收窄”（DSS-REQ-024 与 prompt §6）且消除多请求间的候选/列表时序不一致；筛选逻辑集中在服务层，可单元测试、可审计；Mapper SQL 恒为固定只读 `SELECT`，杜绝任何字符串拼接注入面。**否决**“动态 WHERE 下推 SQL + 独立候选查询”：会引入两份结果集的快照不一致风险，且候选需第二份未过滤查询或额外的 WHERE 复杂度。

### 5.2 参数归一与校验（结论）

- 每一维多值参数若缺失或归一后为空 ⇒ 该维不设过滤（等价“全部”）；前端草稿层哨兵 `__ALL__` 永不传输（UI §3 / utils selection）。
- 每一具体值：`trim` 后空串丢弃；去重（去重后顺序不影响语义）。
- 上限：任一维具体值数量 ≤ `MAX_FILTER_IDS=200`（覆盖 ~100 行规模下单维全部可选项的余量；超限抛 `41001`，DSS-REQ-020 规模假设下不会自然触发，纯防御）。
- status 取值白名单：`RUNNING/COMPLETED/UNKNOWN`；出现白名单外 token（含原始状态字符串如 `SNAPSHOT_RUNNING`）→ 抛 `41002`（前端只会发这三类 token，防御非法输入）。
- 校验失败经 `BusinessException` 以 HTTP 200 业务错误体返回，消息脱敏（见 API §8）。

### 5.3 过滤语义（服务层）

设三组具体值 `C=clientId 已选、S=sourceId 已选、K=status 已选`（均为集合）：

- `clientId`：空集合不过滤；否则 `row.clientId ∈ C`。
- `sourceId`：空集合不过滤；否则 `row.dataSourceId ∈ S`。
- `status`：空集合不过滤；否则按 token 判据：
  - `RUNNING` → `raw=='SNAPSHOT_RUNNING'`
  - `COMPLETED` → `raw=='SNAPSHOT_COMPLETED'`
  - `UNKNOWN` → `raw != 'SNAPSHOT_RUNNING' && raw != 'SNAPSHOT_COMPLETED'`（列非空；NN 约束下无 NULL 分支，见 DATABASE §5）
  - 满足任一 token 即命中（OR）。
- 跨条件为 AND；命中仅作用于 RUN_STATE 原始行（及其可解析补充信息），**与关联配置缺失/停用/类别异常无关**，因此异常行不会被过滤掉（DSS-REQ-025/041~044）。

> 注：`UNKNOWN` 的判定基于**原始状态值**而非归一类别，与候选/展示的分类共用同一个 `classify(raw)` 函数（§5.5），保证“选中未知状态筛出的行”与“展示为未知状态的行”严格一致（DSS-REQ-024）。

### 5.4 固定确定性排序（服务层，结论）

展示集合按以下比较器排序（全在服务层 Java 完成，DSS-REQ-046~049）：

1. 状态组排序键 `statusRank`：`RUNNING=0`、`UNKNOWN=1`、`COMPLETED=2`（升序）——对应“先 RUNNING、再未知、后 COMPLETED”。
2. 组内 `updatedAt`（`YYYY-MM-DD HH:mm:ss` 字符串，**倒序**；UPDATED_AT 非空，字符串格式固定宽度，字典序=时间序）。
3. 并列时 `clientId`（升序）、再 `dataSourceId`（升序），保证确定可复现。

不依赖数据库 `ORDER BY`（Mapper 全量无序返回亦可，但允许加一条无害 `ORDER BY` 便于人工取证；最终顺序以服务层为准）。实现用 `List.sort` 稳定比较器。

### 5.5 状态分类与原始值保留（结论）

服务层 `classify(String raw)`：

| raw 值 | 分类（statusCategory） | 说明 |
|---|---|---|
| `SNAPSHOT_RUNNING` | `RUNNING` | 展示“快照进行中”（蓝） |
| `SNAPSHOT_COMPLETED` | `COMPLETED` | 展示“快照已完成”（绿） |
| 其他任意值（列 NN） | `UNKNOWN` | 展示“未知状态”（橙），原始值保留可见 |

- 行同时携带原始 `snapshotStatus`（数据库原值）与 `statusCategory`（归一类别）；原始值绝不被改写或丢弃（DSS-REQ-030/038/039）。
- 分类是**只读推导**，不是数据库写操作；数据库无封闭 Check（DSS-REQ-037），必须宽容未知值。
- 该函数同时用于过滤、展示、候选三处，保证语义一致。

### 5.6 关联引用状态模型（结论）

探针端与源库的配置关联各自产出一个小映射对象（风格同 topic-offset `TopicEndpointMappingVO`，但按 DSS 需要扩展），**不新增专门异常列**（DSS-REQ-045）。关联结果作为**只读引用状态**保留在响应中，前端不渲染单元格内异常图标/弱提示或异常 Tooltip，只按下述第二轮现行展示语义使用（展示落点见 UI §16.3/§16.4、DESIGN §22.6）：`clientRef.state` 为 `ACTIVE` 时只显示 `CLIENT_ID`；为 `INACTIVE` 时显示 `CLIENT_ID`＋空格＋红色普通文字“停用”；为 `NOT_FOUND` 时只显示原始 `CLIENT_ID`（静默）；Tooltip 只取非空完整 `clientRef.desc`，不得拼接状态或异常说明。`sourceRef.state/category/sourceRole` 仅用于源库 ORG/原始 ID 的展示回退，不产生黄色图标、红字、异常文字或异常 Tooltip；源库列悬停 Tooltip 内容直接取完整原始 `DATA_SOURCE_ID`（正常行与回退行同源，不从 `sourceRef.org` 取值、不拼接 ORG＋ID 或任何异常说明）。

`clientRef: ClientRefVO { state, desc }`

| state | 语义（触发条件） | desc |
|---|---|---|
| `ACTIVE` | `CDC_CLIENT_MULTIPLE.CLIENT_ID` 命中且 `FG_ACTIVE=='1'` | 配置的 `CLIENT_DESC`（不 trim/改写；可为 null） |
| `INACTIVE` | 命中但 `FG_ACTIVE!='1'` | 同上 |
| `NOT_FOUND` | 未命中配置 | `null` |

`sourceRef: SourceRefVO { state, org, category, sourceRole }`

| state | 语义 | org | category（trim+upper 归一） | sourceRole |
|---|---|---|---|---|
| `ACTIVE` | 命中且 `FG_ACTIVE=='1'` | `DATA_SOURCE_ORG`（可为 null） | 归一类别 | `category=='SOURCE'` |
| `INACTIVE` | 命中但 `FG_ACTIVE!='1'` | 同上 | 同上 | 同上 |
| `NOT_FOUND` | 未命中 | `null` | `null` | `false` |

- 类别归一：对 `DATA_SOURCE_CATEGORY` 做 `trim().toUpperCase()`（当前开发库存储小写 `source`，必须大小写不敏感判定；DSS-REQ-044 的“类别大小写异常”指**无法归一为有效类别**的情形，即归一后不等于 `SOURCE`/`TARGET` 之外的畸形值或空——本 Feature 只关心归一类别是否为 `SOURCE` 以得出 `sourceRole`，非 SOURCE 且非 TARGET 的空/畸形值统一归为 `sourceRole=false`）。**决策**：任何大小写写法只要 `upper=='SOURCE'` 即视为正常源库关联；`upper!='SOURCE'`（含 `TARGET`、空、畸形）归一为 `sourceRole=false`，这是**只读数据语义、不是页面告警条件**——前端不产生“类别非 SOURCE”提示、无黄色图标、无异常文字（DSS-REQ-044/074）。
- 源库**展示/候选并不要求 `sourceRole=true`**：RUN_STATE 行始终展示（可能是一个 `sourceRole=false` 的源库），`sourceRole=false` 只是只读数据语义、不是页面告警条件；不得因任何关联状态（源库缺失/停用/类别非 `SOURCE`）过滤或丢弃行，仍按 ORG/原始 ID 回退展示（DSS-REQ-042/044/045/074）。
- 客户端“探针端”同样只判断存在/停用（`ACTIVE/INACTIVE/NOT_FOUND`），不做类别判断。

### 5.7 时间透传（结论）

- 三个 DATE 在 Mapper SQL 用 `TO_CHAR(col,'YYYY-MM-DD HH24:MI:SS')` 字符串化，Java 层作 `String` **只透传不重排**（topic-offset 同方案；避免服务端时区二次转换，展示格式即 `YYYY-MM-DD HH:mm:ss`，满足 DSS-REQ-055）。
- `snapshotLastSeenAt`/`snapshotCompletedAt` 可能为 SQL `NULL` → Java `null` → JSON **显式 null**（`@JsonInclude(ALWAYS)`），前端渲染 `--`（DSS-REQ-031/032）。
- `updatedAt` 列非空 → 恒为字符串，但前端格式函数对 null 同样兜底 `--`。
- 时间仅作展示，**任何一层都不得由时间推断健康/超时/离线**（DSS-REQ-056/057/010）。

### 5.8 响应模型（结论，与 API §5 一致）

`SnapshotStatusListVO { List<SnapshotStatusItemVO> records; CandidateGroupVO candidates; }`

每条 records 由前端按数组顺序生成稳定“序号”（UI §4/API §6）；候选与列表同请求同快照。

## 6. 查询候选与列表一致性方案

### 6.1 候选生成（结论）

候选**始终**由当次请求读到的 **RUN_STATE 全量行**派生（在过滤之前、与筛选条件无关）并补充配置展示信息（org/desc/停用/类别）：

- **探针端候选**：遍历 RUN_STATE 全量行，按 `CLIENT_ID` 去重（一个探针可对应多源库），得到集合；每项按 `clientRef` 信息输出 `{id=clientId, desc=配置CLIENT_DESC或null, active=FG_ACTIVE=='1'}`；排序按 `clientId` 升序。
- **源库候选**：遍历全量行按 `DATA_SOURCE_ID` 去重（一个源库可被多探针引用）；输出 `{id, org, active}`；排序按 `org`（空值后置）→ `dataSourceId` 升序。
- **状态候选**：恒为 `RUNNING`、`COMPLETED` 两项（“快照进行中/快照已完成”，DSS-REQ-024 明确这两项为候选）；**仅当**全量行中存在 `classify(raw)=='UNKNOWN'` 的行时，追加 `UNKNOWN`（“未知状态”动态出现，DSS-REQ-024/AC-022）。顺序固定 `[RUNNING, COMPLETED]`，`UNKNOWN` 追加在后。

**与 topic-offset 的关键差异**：topic-offset 的客户端/源库候选来自**配置表全量**；DSS 候选来自 **RUN_STATE 全量实际记录**（未在 RUN_STATE 出现的探针/源库不进入候选），这是 DSS-REQ-024 强制规则，属有意偏离参考实现。

### 6.2 更新时机

- **首次进入/条件查询/自动刷新/手工刷新/恢复可见**：每次成功的 `list` 请求都携带与列表同一快照的 `candidates`；成功后前端把 records 与 candidates **一并**提交到页面实例（`commitSuccess`，§7.3），因此候选随每次成功刷新更新。
- **未知状态出现/消失**：因候选与列表同快照，一旦新数据出现未知行，下一次成功刷新返回的 `statuses` 即含 `UNKNOWN`；若未知行消失，下一次成功刷新返回的 `statuses` 不再含 `UNKNOWN`（UI 对已选但不再提供的 token 按“ghost 保留”处理，UI §3.5）。
- **过滤不得收窄候选**：因为候选在过滤前从全量行计算，即便当前只筛到“运行中”，探针/源库候选仍含全量出现的其他行；不会出现“选了某条件后其它候选消失”的收窄。
- **查询失败**：候选不更新（页面实例保留上一次成功候选与列表，§7.4）。空结果成功：records=[] 但 candidates 仍是全量派生（candidates 为全量真实出现项；若全量本身为空则 candidates 亦为空）；空 records 属合法空态（AC-057），不是错误。

### 6.3 一致性证明

同一响应内：records = f(全量行, 过滤条件)；candidates = g(全量行)。两者由同一次 `selectAll()` 的全量行派生，共享同一 classify/排序常量，因此：候选不漏 RUN_STATE 真实出现项、不被过滤收窄、未知候选与未知行分类一致、无跨请求时序偏差。

## 7. 前端状态机设计

### 7.1 状态存放与页面实例生命周期（结论，R1-01）

前端状态一律用**页面/composable 实例内 `reactive/ref`**：**不新增 Pinia store，不使用 localStorage/sessionStorage，不跨路由保留现场**。

- **界面选择条件（草稿）**：页面实例内 `reactive` 草稿（三个控件数组，含 `__ALL__` 哨兵）。**每次路由进入/页面实例创建**初始为三项“全部”（探针端=全部、源库=全部、快照状态=全部）；用户修改控件只改草稿、不发请求（E2）；点击“重置”只把草稿复位为三项“全部”（E7）。仅“点击查询且成功”才可能把该次请求快照升级为已应用条件（DSS-REQ-022/023/025）。
- **已应用查询条件**：页面实例内保存的“上一次成功现场”（`appliedCriteria`）。**每次路由进入/页面实例创建**初始为三项“全部”；随即**自动按三项“全部”发起首次查询**（DSS-REQ-023/AC-021）。仅“用户点击查询且成功（含成功空结果）”时由该次**请求快照**替换（DSS-REQ-023/AC-024）；自动/手工刷新、失败、重置、恢复可见刷新都不改它。
- **请求快照**：composable 在点击“查询”瞬间复制草稿去哨兵得到不可变 `AppliedCriteria`，随该次请求携带；在途修改控件不影响本次成功升级用的是哪组条件（DSS-REQ-023/AC-024 ③）。请求结束后该次快照使命即完成，下一次查询重新取当时草稿。
- **最近成功数据**：页面实例 `records`（上一次成功结果）。查询成功以本次结果替换；刷新成功以本次结果替换；失败保留上一次成功结果、不清表（§7.4）。
- **最近成功刷新时间**：页面实例 `lastSuccessAt`（**前端成功收到响应并判为成功的时刻**，epoch ms），仅成功后更新；初始为无（无现场），格式化为 `HH:mm:ss` 展示（UI §6）。
- **hasSuccess 与错误态**：页面实例内 `hasSuccess`（是否已有过一次成功）与 `firstLoadError/refreshError`。**每次路由进入/页面实例创建**均取实例初始值（`hasSuccess=false`、无错误），不继承上一次会话/上一次实例的任何现场。
- **页面可见性**：浏览器标签页**隐藏→再恢复**属**同一个仍挂载的页面实例**：期间保留已应用条件与最近成功现场，恢复时按 §7.7 执行恢复刷新；这与“路由离开→重新进入需初始化三项‘全部’并自动查询”是两种严格区分的生命周期（见 §7.7 起、UI §7.4）。
- **60 秒计时器**：composable 内部 `setTimeout`（非任何 store），仅页面实例可见才运行。
- **页面实例销毁（路由离开/组件卸载）**：清除计时器、可见性监听与 `pendingVisibilityRefresh` 待执行恢复标志；置 `disposed=true` 杜绝迟到响应写入；当前实例的查询现场**不跨路由保留**。再次进入路由创建全新页面实例，重新初始化三项“全部”并自动查询。
- **请求在途与防旧覆盖**：单飞行统一忙碌抑制（busy 时“查询/立即刷新”按钮禁用、自动触发被抑制，见 §7.6/§9）＋一个仅用于**防卸载迟写与防旧响应覆盖**的简单请求实例令牌（单调递增 seq，无任何用户意图排队/补发语义，见 §9）。

### 7.2 条件模型

`AppliedCriteria { clientIds: string[]; sourceIds: string[]; statuses: StatusToken[] }`；数组为空即“该维全部”（与请求“不传该维参数”对应，API §4）。类型 `StatusToken = 'RUNNING'|'COMPLETED'|'UNKNOWN'`。

草稿层 `{ clients: string[]; sources: string[]; statuses: string[] }` 用 `__ALL__` 哨兵表示“全部”；`selection.ts` 提供 `ALL_OPTION`、`normalizeDimension`、`concreteIds`、`draftFromCriteria`、`buildCriteriaFromDraft`、`criteriaEqual`（复用 topic-offset 已验证的纯函数模式，逻辑不变）。

### 7.3 成功提交（两阶段提交，结论，R1-02）

页面/composable 实例持有“上一次成功现场”权威；每次实际请求携带一个单调递增的**请求实例令牌 `seq`**，仅用于防止组件卸载后的迟到响应写入与防御异常情况下的旧响应覆盖，**不承担任何用户意图排队/补发语义**（见 §9）。成功路径为：

```
请求结束且 !disposed 且 op.seq===latestSeq（该次为当前实例最新一次实际请求，未被更新的实际请求取代）且 code===200：
    instance.commitSuccess(op.criteria, res.data.records, res.data.candidates, nowEpoch)
    说明：
      - op.kind ∈ {initial,retry,query}（建立性）：op.criteria 即本次点击快照 → 该次快照升级为已应用条件（仅在“点击查询且成功”才替换，含成功空结果）。
      - op.kind ∈ {manual,restore,auto}（刷新性）：op.criteria 恒等于实例当前已应用条件（发起该次实际请求前取自 instance.appliedCriteria），提交后条件不变，只更新 records/candidates/lastSuccessAt。
    lastSuccessAt 更新为本次成功刷新完成时刻。
    清除刷新错误；关闭首次加载错误态。
```

> 边界（与 DSS-REQ-023/AC-024 完全一致）：自动/手工/恢复刷新**无论成功失败都不得改变已应用条件**；只有成功点击“查询”才替换。单飞行下同一时刻至多一个实际请求在途，`latestSeq` 只在**本次实际请求自身结束后用户再次发起新的实际请求**时才推进——不存在“被排队但尚未发出的意图提前作废响应”的语义（R1-02）。

### 7.4 失败/空态处理（结论）

- `!hasSuccess` 时的失败（首次尚无任何成功，`firstLoadError` 分支，请求种类不定为 initial/retry/query/restore 之一）：进入**首次加载失败态**（整区错误 + “重新加载”入口），`firstLoadError=true`；已应用条件仍为初始三项“全部”；重试仍按“全部”发起（DSS-REQ-059/AC-056）。
- `hasSuccess` 时的失败（查询新条件失败或刷新失败）：**保留**上一次成功 records/appliedCriteria/candidates/lastSuccessAt；`refreshError` 显示**收敛的脱敏**短提示（不堆叠相同消息）；不清表、不伪装空态（DSS-REQ-061/AC-058）。
- 成功返回 0 条：**成功**；records=[]；按 kind 规则处理条件（刷新性则条件不变；查询性则快照升级）；空态提示“暂无数据”，非错误（DSS-REQ-060/AC-057）。

### 7.5 计时器规则（结论，严格对照 DSS-REQ-051/054，R1-02）

- 页面实例可见时：**每一次实际发出并结束的请求（无论成功失败）**，在请求结束时**重新开始完整 60 秒**（`scheduleNext()`：先清再设 60s 后触发自动刷新）。唯一例外是 §7.7 的恢复可见延后补发：补发前的那次在途请求结束**不**直接启动 60s，而是先补发 restore，待 restore 结束（无论成败）才重启完整 60 秒。
- 请求在途时（`busy`）：**“查询”按钮禁用、“立即刷新”按钮禁用**——再次点击不接受、不排队、不补发（R1-02 §5.2）；自动刷新触发被抑制、不排队。被抑制/禁用的触发**不视为实际请求、不更新最近成功时间、不单独重置计时、不产生错误提示**——只有真正结束一次实际请求才重启周期（DSS-REQ-053/054、AC-050/051）。
- 请求在途时用户仍可修改三个查询控件：当前请求继续使用其请求开始时捕获的不可变条件快照；在途修改只停留在界面草稿，须待请求结束后用户再次点击“查询”才可能生效（DSS-REQ-023/AC-024 ③）。
- 页面隐藏：`stopTimer()` 取消计时、不保留剩余秒数复用；隐藏前已在途请求允许正常结束并按成败规则处理，但**隐藏期间不启动新计时**（`onRequestFinally` 检查 hidden，见 §7.7）。
- 页面恢复可见：**统一见 §7.7**（空闲：立即 restore/initial 并发起；在途：设一次性 `pendingVisibilityRefresh`，请求结束后按届时最新已应用条件补发一次；再次隐藏/卸载清除标志）。
- 最近成功刷新时间**仅成功更新**；失败、被抑制触发或被禁用按钮的点击绝不更新。

### 7.6 视觉状态（结论）

- `loading`（整表）：kind=initial/retry/query 在途。
- `refreshing`（工具栏轻量，表格不遮罩、不闪烁）：kind=manual/restore/auto 在途。
- **busy（任意实际请求在途）**：“查询”与“立即刷新”按钮均**禁用**，点击不接受、不排队、不补发（R1-02）；仅“重新加载”入口与自动触发相应走各自的忙碌抑制/禁用路径。
- 首次加载失败：整区错误态 + 重新加载（`firstLoadError`）。
- 有数据时的刷新失败：工具栏内联收敛提示 `refreshError`（不清表）。
- 空态：`records.length===0 && hasSuccess` 显示空数据占位。
- 工具栏：固定宽度“立即刷新” + 左侧“60 秒自动刷新｜最近成功刷新：…”（UI §6）。

### 7.7 页面恢复可见刷新规则（结论，R1-03，对照 DSS-REQ-051/054、AC-048/051）

浏览器标签页**隐藏→再恢复**属于**同一个仍挂载的页面实例**。恢复可见的统一规则如下；它是“在途时不发起重叠请求”的**唯一例外**，不是 query/manual/auto 的通用排队机制（R1-03）。

**情形 A：恢复可见且当前空闲（无实际请求在途）**

- 立即按**当时最新已应用查询条件**发起一次 `restore` 刷新（`hasSuccess=true` 时 kind=restore；若从未成功——已应用条件仍为三项“全部”——则等价于按“全部”的首次重试，成功前失败仍按 §7.4 `!hasSuccess` 走首次加载失败处理）。
- 该次实际请求结束后，无论成功失败，**重新开始完整 60 秒周期**。

**情形 B：恢复可见但当前已有请求在途（busy=true，任意 kind：initial/retry/query/manual/auto/restore）**

1. 不发起并发的 restore 请求。
2. 设**一次性布尔标志 `pendingVisibilityRefresh=true`**；多次可见事件**合并**为一次待执行恢复刷新，不累积队列。
3. 当在途请求结束后（`onRequestFinally`）：
   - 若页面仍可见、组件未卸载且标志仍为 `true`：先清除标志；
   - **不为刚结束的该次请求启动 60 秒计时器**；
   - 立即读取**届时最新的已应用查询条件**并发起一次 `restore` 刷新；**不得**使用恢复可见事件发生时捕获的旧条件。若刚结束的是成功查询，其成功提交已先于 `finally` 完成，故此处读到的是升级后的新已应用条件（R1-03 §6.2 第 6 点）；若刚结束的请求失败，已应用条件保持旧值，restore 用旧值。
4. 该次补发 restore 结束后，无论成功失败，才**重新开始完整 60 秒周期**。
5. 待执行期间页面再次隐藏或组件卸载：**清除 `pendingVisibilityRefresh`，不补发**；隐藏期间不启动计时器。
6. 本次补发的 restore 是恢复可见规则要求的**实际请求**，走与其它实际请求一致的提交/错误/计时语义（成功更新最近成功刷新时间；`!hasSuccess` 失败走首次加载失败分支）。

**计时器统一收口伪代码（composable `onRequestFinally`）：**

```
onRequestFinally:
  busy = false
  if disposed or hidden:
    return
  if pendingVisibilityRefresh:
    pendingVisibilityRefresh = false
    startRestoreWithCurrentAppliedCriteria()   // 读取届时最新已应用条件，立即发起一次 restore
    return
  scheduleNextAfter60Seconds()                  // 重新开始完整 60 秒
```

- 页面隐藏/组件卸载时：`stopTimer()` 并清除 `pendingVisibilityRefresh`（隐藏/卸载处理）；隐藏期间在途请求结束的 `finally` 因 `hidden||disposed` 直接返回，不调度计时、不补发。
- 补发 restore 自身结束后再次进入 `onRequestFinally`：此时 `pendingVisibilityRefresh` 已为 `false` → 走 `scheduleNextAfter60Seconds()` 重启完整 60 秒。

**R1-03 场景覆盖清单（§12 前端 composable 测试 / §14 落点复用）：**

- 恢复可见时空闲（有现场）→ 立即 restore，结束重启 60s（E12）。
- 恢复可见时空闲（无现场/从未成功）→ 立即按“全部”重试，成功前失败走首次加载失败（E13）。
- 恢复可见时 query/manual/auto/initial/retry/restore 任一种在途 → 只设一次 `pendingVisibilityRefresh`，不并发（E12/E13 忙碌分支）。
- 在途查询成功改变已应用条件后补发 → restore 用升级后的新条件。
- 在途查询/请求失败后补发 → restore 用保持的旧已应用条件。
- 多次可见事件 → 合并为一次待执行恢复刷新。
- 补发前再次隐藏/卸载 → 清除 `pendingVisibilityRefresh`，不补发。
- 补发请求成功/失败后 → 均从请求结束重启完整 60 秒。

## 8. 事件—状态转移表

约定：`A=已应用条件`、`D=界面草稿(含哨兵)`、`S=请求快照`、`R=最近成功数据/候选`、`T=最近成功刷新时间`、`Tm=60s 计时器`。`·`表示该项不变。kind：`initial`首次、`query`点击查询、`manual`立即刷新、`auto`自动刷新、`retry`重新加载、`restore`恢复可见。**busy=有任一实际请求在途**：busy 时“查询/立即刷新”按钮禁用（点击不接受、不排队、不补发）、自动触发被抑制（不排队）；被禁用/被抑制的触发不视为实际请求、不更新 T、不单独重置计时、不产生错误提示（R1-02）。恢复可见的延后补发（§7.7）是**唯一例外**，不属于通用排队。

| # | 事件 | 前置状态 | 请求参数 | 成功结果 | 失败结果 | 计时器结果 |
|---|---|---|---|---|---|---|
| E1 | 首次进入（mount，无现场） | A=全部(初始)、D=全部、无 R | kind=initial，按“全部” | A=全部(保持)；R=本次结果；T=本次成功时刻；候选更新 | `firstLoadError=true`；A 仍全部；R 无 | 请求结束起重启完整 60s |
| E2 | 修改任一控件 | A 任意、D 变 | 不发起请求 | —（不发） | — | 不变 |
| E3 | 点击“查询”（空闲） | A0、D0 | kind=query，S=点击瞬间去哨兵快照 | A=S；R=本次；T=更新；候选更新 | A 保持 A0；R 保持；D 保留新选择 | 请求结束重启完整 60s |
| E4 | 查询在途再次改控件 | S 已锁定、busy | （同一次请求；改动只入 D 草稿） | 升级的是 S（非结束时控件值）；控件保留新草稿 | 同 E3 失败 | 同 E3 |
| E5 | 点击“查询”（busy，上一请求未结束） | busy | 按钮禁用：点击不接受、不排队、不补发 | —（未发起） | —（未发起） | 被禁用触发不重置计时 |
| E6 | 查询失败（已有成功现场） | A0、R0、hasSuccess | kind=query 新条件 | — | A 保持 A0；R 保持 R0；D 保留新条件；收敛脱敏提示；T 不更新 | 请求结束重启完整 60s（失败后 60s 按 A 自动重试，不立即重试） |
| E7 | 重置（不点击查询） | D 任意、A0 | 不发请求 | D=三项“全部”；A/R/T/表格不变 | — | 不变 |
| E8 | 立即刷新（空闲） | A0、R0 | kind=manual，参数=A0（恒非 D） | R=本次成功结果；候选更新；**A 保持 A0**；T=本次成功时刻 | R/A/T 保持；收敛脱敏提示 | 请求结束重启完整 60s |
| E9 | 自动刷新触发（空闲且可见） | A0、R0 | kind=auto，参数=A0 | 同 E8 成功 | 同 E8 失败（约 60s 后按 A0 自动重试） | 请求结束重启完整 60s |
| E10 | “立即刷新”点击/自动触发（busy） | busy | “立即刷新”按钮禁用（不接受/不排队/不补发）；自动触发被抑制（不排队） | —（未发起） | —（未发起） | 被禁用/被抑制触发不重置计时 |
| E11 | 页面隐藏 | Tm 运行中或 busy | — | — | — | stopTimer、清除 `pendingVisibilityRefresh`，不保留剩余秒数；在途请求允许结束但不启动新计时、不补发（结束回调检查 hidden） |
| E12 | 恢复可见（有现场，hasSuccess） | A0、R0 | 空闲→立即 kind=restore，参数=A0；busy→不并发，仅设一次性 `pendingVisibilityRefresh`（§7.7） | R=本次；T=更新；A 保持 A0 | R/A/T 保持；收敛提示 | 空闲 restore 结束重启完整 60s；busy 时当前请求结束先补发一次 restore（按届时最新 A），补发结束才重启完整 60s |
| E13 | 恢复可见（无现场/从未成功，!hasSuccess） | A=全部、无 R | 空闲→立即按“全部”重试（首次加载语义）；busy→不并发，仅设一次性 `pendingVisibilityRefresh`（§7.7） | 同 E1 成功 | 同 E1 失败（走 `firstLoadError` 分支） | 同 E12：空闲请求结束或补发结束才重启完整 60s |
| E14 | 点击“重新加载”（首次失败态，空闲） | A=全部 | kind=retry 按“全部” | 同 E1 成功 | `firstLoadError` 保持 | 请求结束重启完整 60s |
| E15 | 成功返回 0 条（空态） | A0 | 按 kind 规则 | 属成功：records=[]（空态）；查询性则 A=S；T=更新；候选=全量派生 | — | 请求结束重启完整 60s |
| E16 | 卸载（路由离开） | 任意（含 busy） | — | — | — | 清计时器、置 disposed、清 `pendingVisibilityRefresh`，杜绝迟到响应写入 |

> E8/E9/E12（含 §7.7 补发的 restore）：无论 kind，刷新成功的请求参数都取 **A（已应用条件）**，永不取 D；这正是 AC-024 第②/⑤/⑧步“未点击查询的界面变化不影响刷新”的机制保证。

## 9. 并发与竞态设计（结论，R1-02/R1-03）

结论：本 Feature 采用**“单飞行（single-flight）＋统一忙碌抑制（不排队、不补发）＋仅防迟写/防旧响应覆盖的请求实例令牌 `seq`”**模型；不复用 topic-offset 的“最新用户意图槽位/覆盖补发/`preserveValidFor`/被排队意图提前作废的 `acceptedSeq`”语义（§3.1 盘点块已声明不复用于本 Feature）。恢复可见的延后补发（§7.7）是唯一例外，不是通用排队。

1. **单飞行（single-flight）**：任意时刻至多一个实际请求在途；`busy` 为真时不得再发起任何并发请求（DSS-REQ-053、AC-050/051）。
2. **统一忙碌抑制（busy 抑制）**：`busy` 期间——
   - “查询”按钮禁用：点击不接受、不排队、不补发（R1-02 §5.2）；
   - “立即刷新”按钮禁用：点击不接受、不排队、不补发；
   - 自动刷新触发被抑制：不排队、不发起新请求；
   - 被禁用/被抑制的触发**不产生实际请求、不更新最近成功刷新时间、不单独重置 60 秒计时、不产生错误提示**（DSS-REQ-053/054、AC-050）。
   - 不存在“最新用户意图槽位”“latest intent”“覆盖补发”“`preserveValidFor`”等概念，也不存在“一个尚未真正发出的排队意图提前使当前响应失效”的语义（R1-02 §5.1）。
3. **请求实例令牌 `seq`**：每次**实际发起**请求时自增并赋给该 op（单调递增，仅用于**防止组件卸载后的迟到响应写入**与**防御异常情况下的旧响应覆盖**）；成功提交前校验 `op.seq===latestSeq && !disposed`。因单飞行下同一时刻至多一个实际请求在途，`latestSeq` 只在该请求自身结束后用户再次发起新的实际请求时推进；该令牌**不承担任何用户意图排队/补发语义**（R1-02）。
4. **在途允许编辑控件**：`busy` 时用户仍可修改三个查询控件，但改动只停留在界面草稿 D；当前在途请求继续使用其请求开始时的不可变条件快照 S（E4）。当前请求结束后，须用户再次点击“查询”才可能把新的草稿快照升级为已应用条件（DSS-REQ-023/AC-024 ③）。
5. **恢复可见延后补发（唯一例外，R1-03）**：恢复可见且 `busy` → 不并发，仅置一次性 `pendingVisibilityRefresh=true`（多次可见事件合并为一次）；当前请求结束后在 `onRequestFinally` 中按**届时最新已应用条件**补发一次 `restore`，补发结束（无论成败）才重启完整 60s；期间再次隐藏/卸载则清除标志、不补发。这不是 query/manual/auto 的通用排队机制（见 §7.7）。
6. **计时统一收口**：`onRequestFinally`（§7.7 伪代码）——`busy=false`；`disposed||hidden` 直接返回；`pendingVisibilityRefresh` 为真则清标志→按届时最新 A 补发 restore→return；否则 `scheduleNextAfter60Seconds()` 重启完整 60 秒。`stopTimer` 于隐藏/卸载；隐藏期间 finally 不重启、不补发。
7. **页面实例销毁**：`destroy()` 置 `disposed=true`、清计时器、清 `pendingVisibilityRefresh`、清可见性监听（E16）；所有提交/回调先判 `disposed`。组件 onMounted/onUnmounted/onActivated/onDeactivated + `visibilitychange` 对接页面实例可见性；生命周期仅存在于**单页面实例**内，路由离开即销毁、现场不跨路由保留（R1-01）。

## 10. 未知状态、关联缺失/停用/类别异常、NULL 兼容设计

1. **未知状态**：`classify()` 对任何非两已知原值返回 `UNKNOWN`，行保留、原始值展示、标签橙＋文字（DSS-REQ-037~039）；过滤器 UNKNOWN 语义与分类共用函数（§5.3/5.5）；候选仅在确有未知行时出现（§6.1）。接口/页面绝不因未知值抛错。
2. **关联缺失/停用/类别异常**：行恒保留（映射 state 驱动前端提示，不新增列、不改判快照状态、不触发修复，DSS-REQ-041~045）；展示见 UI §5。
3. **NULL**：两快照时间为 NULL → JSON 显式 null → UI `--`；`UPDATED_AT` 非空但格式化函数对 null 兜底 `--`（DSS-REQ-031/032/055）。
4. **空表**：RUN_STATE 无行 → records=[] 空态、candidates 中 client/source 为空、statuses=[RUNNING,COMPLETED]（仍两项，未知不出现）；属成功空态。
5. **配置表自身异常**（如 FG_ACTIVE 非 '1' 亦非 '0'、类别空/畸形）：一律按“停用=非'1'”“非 SOURCE”宽容处理为对应提示，不抛错、不丢行（DATABASE §12）。

## 11. 安全与只读保证

| 层 | 保证 |
|---|---|
| Controller | 仅 `GET` 端点；无 POST/PUT/PATCH/DELETE；无写方法可调用路径。 |
| Service | 只注入 3 个只读 Mapper；不调用 `save/update/remove/delete/insert`；不持有 `Connection/JdbcTemplate`；无 `@Transactional` 写；不拼字符串 SQL。 |
| Mapper | 均为纯注解 `@Select`、显式列、无 `BaseMapper`（天然无内置 CRUD）；不 `SELECT *`；不读 `DATA_SOURCE_PASSWORD`。 |
| VO | 不包含任何密码/敏感字段；错误消息脱敏（API §8）。 |
| UI | 无写按钮、无操作列、无跳转入口；刷新仅重读。 |
| 测试契约 | Mapper SQL 审计（扫描禁止关键字）、Controller 反射/端点清单断言无写端点、查询期间 SQL 日志无 DML（见 §12/AC-010）。 |
| 文档 | 本设计不新增任何 RUN_STATE 或其它表的写能力；`DSS-REQ-065` 的测试 DML 授权只服务于**后续**测试/验收任务且以提示词显式纳入为前提，本设计任务不使用（DATABASE §13）。 |

## 12. 测试设计（本任务只设计、不执行）与需求/验收覆盖

| 测试类别 | 目标 | 覆盖映射（代表性） |
|---|---|---|
| 后端单测：`classify` | 已知/未知映射 | DSS-REQ-035~039 → AC-032~035/037 |
| 后端单测：过滤 | OR/AND、UNKNOWN 语义、空=全部、与关联异常无关 | DSS-REQ-022~025 → AC-020/022/023 |
| 后端单测：排序 | 状态组序、updatedAt 倒序、并列 key | DSS-REQ-046~049 → AC-043~045 |
| 后端单测：候选 | 全量派生、去重、未知条件出现、不被筛选收窄 | DSS-REQ-024 → AC-022 |
| 后端单测：映射 | 探针/源库 ACTIVE/INACTIVE/NOT_FOUND、sourceRole、类别归一 | DSS-REQ-028/029/041~045 → AC-026/027/038~042 |
| Mapper SQL 审计 | 仅 SELECT、显式列、无 PASSWORD、无 DML 关键字 | DSS-REQ-011~015 → AC-010/013 |
| JSON/时间契约 | 时间串格式、显式 null、无分页字段 | DSS-REQ-026~034/055 → AC-025/029/030/052 |
| 前端 composable 测试 | 页面实例生命周期（每次进入初始化三项“全部”并自动查询、路由离开销毁不跨路由保留现场）、两阶段条件与请求快照、失败保留、busy 禁用/抑制不排队不补发、计时器（隐藏/恢复/重启）、恢复可见延后单次刷新（§7.7 R1-03 场景清单）、请求实例令牌仅防迟写/防旧覆盖 | DSS-REQ-023/050~054/058~061 → AC-021/024/047~051/055~058/068 |
| 前端组件测试 | 多选互斥、空值 `--`、颜色非唯一、稳定宽度工具栏 | DSS-REQ-022/029/055/062/063 → AC-020/027/052/060/061/068 |
| 浏览器人工只读目测 | 页面标题、七列、只读、无 console 错误 | DSS-REQ-001/027/050/062 → AC-001/005/067 |

（完整 65/65 与 68/68 机械矩阵见 §14。）

## 13. 风险、取舍与回滚边界

| 风险/取舍 | 评估 | 缓解 |
|---|---|---|
| 全量读取 + 内存过滤（不 SQL 下推） | ~100 行规模完全可接受；换来候选/列表同快照与零注入 | 规模假设超限时（如千行级）仍需先改设计（非本版）；用 DATABASE §11 说明无需索引 |
| 候选与列表放同一响应 | 每次刷新多传候选（小） | 减少一次往返与跨请求不一致；空/小表开销可忽略 |
| 单接口 list（无独立 candidates 端点） | 与 topic-offset 两接口不同 | 本 Feature 候选=全量派生且需与列表同快照，属有意偏离；已在 §6.1 说明 |
| 时间以字符串透传 | 失去服务端 Date 语义 | 已由 topic-offset 验证；展示/格式需求即字符串，排序在服务层用同格式字符串即可 |
| 前端哨兵只存草稿、已应用条件永不含哨兵 | 若误把哨兵当真实值发请求会 41002 | 类型区分（`AppliedCriteria` 无哨兵）+ 序列化器只发白名单 token + 单测 |
| 计时器“每次真实请求结束重启” | 与 topic-offset“仅成功重启”不同 | 以 DSS-REQ-054 为准（更强约束），composable finally 统一调度，抑制/隐藏不触发 |
| 若未来发现需求真实矛盾 | — | 本设计不静默改语义：停止并报告（prompt §10.4） |
| 回滚边界 | 纯文档草案 | 删除/回退 4 份设计文件即回到“已批准需求+未设计”状态；不影响任何代码/数据 |

## 14. 跨文档一致性与设计—需求—验收追踪

### 14.1 一致性清单

四份设计文档（DESIGN/API/UI/DATABASE）在本设计中统一使用：接口 `GET /api/monitor/data-source-run-state/list`；查询参数 `clientId`/`sourceId`/`status`；状态 token `RUNNING`/`COMPLETED`/`UNKNOWN`；原始状态值 `SNAPSHOT_RUNNING`/`SNAPSHOT_COMPLETED`；中文标签 快照进行中/快照已完成/未知状态；时间格式 `YYYY-MM-DD HH:mm:ss`、JSON null、UI `--`；映射状态 `ACTIVE`/`INACTIVE`/`NOT_FOUND`；错误码 `41001/41002`；行键 `clientId+'\x00'+dataSourceId`；排序常量；候选不随筛选收窄。任何偏差视为设计不一致。

### 14.2 需求 → 设计落点矩阵（75/75）

落点记号：D=DESIGN §、A=API §、U=UI §、DB=DATABASE §。

| 需求 | 设计落点 | 需求 | 设计落点 |
|---|---|---|---|
| DSS-REQ-001 | D§1/§4、U§10 | DSS-REQ-034 | A§5/§6、U§4.6 |
| DSS-REQ-002 | D§1 | DSS-REQ-035 | D§5.5、U§5.1、DB§5 |
| DSS-REQ-003 | U§10、D§1 | DSS-REQ-036 | D§5.5、U§5.1、DB§5 |
| DSS-REQ-004 | D§4.2、U§10 | DSS-REQ-037 | D§10、DB§5、A§5 |
| DSS-REQ-005 | U§10 | DSS-REQ-038 | D§5.5/§10、U§5.2 |
| DSS-REQ-006 | DB§3/§5、U§5 | DSS-REQ-039 | D§10、A§5/§7、U§5.2 |
| DSS-REQ-007 | D§2.3/§10、U§2 | DSS-REQ-040 | DB§12、D§13 |
| DSS-REQ-008 | D§2.4、DB§3（跨程序事实） | DSS-REQ-041 | D§5.6/§22.3、U§5.4/§16.3 |
| DSS-REQ-009 | D§2.3 | DSS-REQ-042 | D§5.6/§22.4、U§5.4/§16.4 |
| DSS-REQ-010 | D§5.7、U§4.5、DB§9 | DSS-REQ-043 | D§5.6/§22.3/§22.4、U§5.4/§16.3/§16.4 |
| DSS-REQ-011 | D§11、DB§13 | DSS-REQ-044 | D§5.6/§22.4、U§5.4/§16.4、DB§3 |
| DSS-REQ-012 | A§3、U§4.6 | DSS-REQ-045 | D§5.6/§22.3/§22.4、U§5.5/§16.3/§16.4 |
| DSS-REQ-013 | D§11、A§3 | DSS-REQ-046 | D§5.4、U§4.7、DB§8 |
| DSS-REQ-014 | D§5.1、DB§4 | DSS-REQ-047 | D§5.4、U§4.7、DB§8 |
| DSS-REQ-015 | D§5.1/§5.6、DB§4 | DSS-REQ-048 | D§5.4、U§4.7、DB§8 |
| DSS-REQ-016 | D§6.1、DB§4/§6、A§5 | DSS-REQ-049 | U§4.7、A§6 |
| DSS-REQ-017 | DB§4、D§6.1 | DSS-REQ-050 | D§7.6/§8/§19.3/§19.6、U§6/§13.3/§13.6、A§4 |
| DSS-REQ-018 | U§4.2、D§2.3 | DSS-REQ-051 | D§7.5/§9、U§7.4 |
| DSS-REQ-019 | DB§4、D§5.6 | DSS-REQ-052 | D§11、A§3 |
| DSS-REQ-020 | A§5、DB§11、D§5.1 | DSS-REQ-053 | D§8/§9、U§7.3 |
| DSS-REQ-021 | A§6、U§4.7、D§2.3 | DSS-REQ-054 | D§7.5/§9、U§6.4/§7.3 |
| DSS-REQ-022 | D§5.3/§7.2/§22.5、U§3/§16.5、A§4 | DSS-REQ-055 | D§5.7、A§5、U§4.5、DB§9 |
| DSS-REQ-023 | D§7/§8、U§3.6、A§4 | DSS-REQ-056 | D§5.7/§10、DB§9 |
| DSS-REQ-024 | D§6/§22.5、U§3.2/§3.5/§16.5、A§5 | DSS-REQ-057 | U§4.5、D§10 |
| DSS-REQ-025 | D§5.3/§8(E7)、U§3.4/§3.6 | DSS-REQ-058 | D§7.6、U§7.1 |
| DSS-REQ-026 | A§6、U§4.1 | DSS-REQ-059 | D§7.4、U§7.2 |
| DSS-REQ-027 | A§5/§6、U§4 | DSS-REQ-060 | D§7.4、U§7.2 |
| DSS-REQ-028 | D§5.6/§19.4/§22.3、U§4.3/§13.4/§16.3 | DSS-REQ-061 | D§7.4/§7.6、U§6.4/§7.3 |
| DSS-REQ-029 | D§5.6/§19.4/§22.4、U§4.4/§13.4/§16.4 | DSS-REQ-062 | U§1/§2、D§3.1 |
| DSS-REQ-030 | D§5.5、U§5.2/§5.3 | DSS-REQ-063 | U§5/§8、D§10 |
| DSS-REQ-031 | D§5.7、U§4.5 | DSS-REQ-064 | A§8、U§7.3、D§11 |
| DSS-REQ-032 | D§5.7、U§4.5 | DSS-REQ-065 | DB§13、D§11 |
| DSS-REQ-033 | D§5.7、U§4.5 | DSS-REQ-066 | D§19.2、U§13.2 |
| DSS-REQ-067 | D§19.2、U§13.2/§13.3 | | |
| DSS-REQ-068 | D§19.3、U§13.3 | | |
| DSS-REQ-069 | D§19.4/§22.2、U§13.4/§16.2 | | |
| DSS-REQ-070 | D§19.5/§22.6/§22.7、U§13.5/§16.6/§16.7 | | |
| DSS-REQ-071 | D§19.6、U§13.6 | | |
| DSS-REQ-072 | D§22.2、U§16.2 | | |
| DSS-REQ-073 | D§22.3、U§16.3 | | |
| DSS-REQ-074 | D§22.4、U§16.4 | | |
| DSS-REQ-075 | D§22.5、U§16.5 | | |

覆盖：75/75；无悬空需求。第二轮（§22）在已批准基线之上定向修订的既有需求行 `DSS-REQ-022/024/028/029/041/042/043/044/045/069/070` 其现行设计落点亦以 §22 对应小节为准（`022/024`→§22.5、`028/041/043(探针端停用)`→§22.3、`029/042/044/043(源库停用)`→§22.4、`045`→§22.3/§22.4、`069`→§22.2、`070`→§22.6/§22.7）。

### 14.3 验收 → 设计落点矩阵（86/86）

| 验收 | 设计落点 | 验收 | 设计落点 |
|---|---|---|---|
| DSS-AC-001 | U§10、A§2 | DSS-AC-035 | U§5.2/§5.3、DB§5 |
| DSS-AC-002 | D§1、U§10 | DSS-AC-036 | DB§12、D§13 |
| DSS-AC-003 | U§10、A§2 | DSS-AC-037 | D§5.5/§6、U§5.2、DB§5 |
| DSS-AC-004 | U§10、D§4.2 | DSS-AC-038 | D§5.6/§22.3、U§5.4/§16.3 |
| DSS-AC-005 | U§10 | DSS-AC-039 | D§5.6/§22.4、U§5.4/§16.4 |
| DSS-AC-006 | DB§3/§5、U§5.1 | DSS-AC-040 | D§5.6/§22.3/§22.4、U§5.4/§16.3/§16.4 |
| DSS-AC-007 | D§2.3/§10、U§2 | DSS-AC-041 | D§5.6/§22.4、U§5.4/§16.4、DB§3 |
| DSS-AC-008 | D§2.4、U§10 | DSS-AC-042 | D§5.6/§22.3/§22.4、U§5.5/§16.3/§16.4 |
| DSS-AC-009 | D§5.7、DB§9 | DSS-AC-043 | D§5.4、U§4.7 |
| DSS-AC-010 | D§11、A§3、DB§10/§13 | DSS-AC-044 | D§5.4、U§4.7 |
| DSS-AC-011 | A§3、U§4.6 | DSS-AC-045 | D§5.4、U§4.7 |
| DSS-AC-012 | D§11、DB§13 | DSS-AC-046 | U§4.7、A§6 |
| DSS-AC-013 | D§5.1/§5.6、DB§4 | DSS-AC-047 | D§7.6、U§6 |
| DSS-AC-014 | DB§4、D§6.1 | DSS-AC-048 | D§7.5/§9、U§7.4 |
| DSS-AC-015 | DB§4 | DSS-AC-049 | D§11、A§3 |
| DSS-AC-016 | U§4.2、D§2.3 | DSS-AC-050 | D§8/§9、U§7.3 |
| DSS-AC-017 | DB§4、D§5.6 | DSS-AC-051 | D§7.5/§8/§9、U§6.4/§7.3 |
| DSS-AC-018 | A§6、DB§11 | DSS-AC-052 | D§5.7、U§4.5、DB§9 |
| DSS-AC-019 | A§6、U§4.1 | DSS-AC-053 | D§10、DB§9 |
| DSS-AC-020 | D§5.3/§7.2/§22.5、U§3/§16.5 | DSS-AC-054 | U§4.5、D§10 |
| DSS-AC-021 | D§7.4/§8、U§3.6 | DSS-AC-055 | D§7.6、U§7.1 |
| DSS-AC-022 | D§6/§22.5、U§3.2/§3.5/§16.5、DB§6 | DSS-AC-056 | D§7.4、U§7.2 |
| DSS-AC-023 | D§5.3、A§4、DB§7 | DSS-AC-057 | D§7.4、U§7.2 |
| DSS-AC-024 | D§7.3/§7.5/§8、U§3.6/§6 | DSS-AC-058 | D§7.4/§7.6、U§6.4/§7.3 |
| DSS-AC-025 | A§5/§6、U§4 | DSS-AC-059 | D§7.3、U§6.3 |
| DSS-AC-026 | D§5.6/§19.4/§22.3、U§4.3/§13.4/§16.3 | DSS-AC-060 | U§1/§2 |
| DSS-AC-027 | D§5.6/§19.4/§22.4、U§4.4/§13.4/§16.4 | DSS-AC-061 | U§5/§8 |
| DSS-AC-028 | D§5.5、U§5.3 | DSS-AC-062 | A§8、U§7.3、D§11 |
| DSS-AC-029 | D§5.7、U§4.5 | DSS-AC-063 | DB§13、D§11 |
| DSS-AC-030 | D§5.7、U§4.5、DB§9 | DSS-AC-064 | DB§3、U§5.1 |
| DSS-AC-031 | U§4.6、A§6 | DSS-AC-065 | DB§13、D§11 |
| DSS-AC-032 | U§5.1、DB§5 | DSS-AC-066 | D§12、A§7 |
| DSS-AC-033 | U§5.1、DB§5 | DSS-AC-067 | U§2/§10、D§3.1 |
| DSS-AC-034 | D§10、A§7、DB§5 | DSS-AC-068 | D§7.6/§8/§19.3/§19.6、U§6.2/§13.3/§13.6 |

覆盖：86/86；无悬空验收；反向引用均在 `DSS-REQ-001~075` 内。以下为第一轮验收前 UI 调整草案新增（历史批准内容，对应 REQUIREMENTS §21 第一轮、ACCEPTANCE §4.18）：
| DSS-AC-069 | D§19.2、U§13.2 | | |
| DSS-AC-070 | D§19.2/§19.3、U§13.2/§13.3 | | |
| DSS-AC-071 | D§19.3、U§13.3 | | |
| DSS-AC-072 | D§19.3、U§13.3 | | |
| DSS-AC-073 | D§19.4/§22.2、U§13.4/§16.2 | | |
| DSS-AC-074 | D§19.4/§19.5/§22.3、U§13.4/§13.5/§16.3 | | |
| DSS-AC-075 | D§19.4/§19.5/§22.4、U§13.4/§13.5/§16.4 | | |
| DSS-AC-076 | D§19.5/§22.7、U§13.5/§16.7 | | |
| DSS-AC-077 | D§19.5/§22.7、U§13.5/§16.7 | | |
| DSS-AC-078 | D§19.6、U§13.6 | | |
| DSS-AC-079 | D§19.6、U§13.6 | | |
| DSS-AC-080 | D§19.2/§19.3/§19.4/§19.5/§22.2/§22.3/§22.4/§22.7、U§13.2~§13.5/§16.2~§16.4/§16.7 | | |

以下为第二轮验收前 UI 调整草案新增（对应 REQUIREMENTS §21.2、ACCEPTANCE §4.19；全部 `NOT_RUN`）：
| DSS-AC-081 | D§22.2、U§16.2 | | |
| DSS-AC-082 | D§22.3、U§16.3 | | |
| DSS-AC-083 | D§22.4、U§16.4 | | |
| DSS-AC-084 | D§22.5、U§16.5 | | |
| DSS-AC-085 | D§22.5、U§16.5 | | |
| DSS-AC-086 | D§22.7、U§16.7 | | |

## 15. 设计决策与待确认设计项

### 15.1 本草案已定关键决策（依批准需求 + 代码惯例 + 数据库事实解决，不再推给项目负责人）

1. **唯一接口** `GET /api/monitor/data-source-run-state/list`，响应内嵌 `records+candidates`（§5.8/§6）。
2. **全量读取 + 服务层过滤**（非动态 SQL WHERE），保证候选不被筛选收窄与同快照（§5.1/§6）。
3. **时间以 SQL `TO_CHAR` 字符串透传**，JSON 显式 null，UI `--`（§5.7/API §5）。
4. **状态分类 `classify`**（RUNNING/COMPLETED/UNKNOWN）统一用于过滤/展示/候选（§5.5）。
5. **关联引用状态**：clientRef 3 态（`ACTIVE/INACTIVE/NOT_FOUND`）、sourceRef 4 态（state＋`sourceRole`），源库类别**大小写不敏感归一**；非 `SOURCE` 归 `sourceRole=false` 是只读数据语义、不产生页面告警，RUN_STATE 行始终保留、不因关联状态过滤或丢行（§5.6）。
6. **状态候选**恒含 RUNNING/COMPLETED，未知仅在确有未知行时追加（§6.1，符合 AC-022 语义）。
7. **前端状态存放**：页面/composable 实例内保存“上次成功现场”（已应用条件/records/candidates/lastSuccessAt/hasSuccess/错误态）＋ composable 持“单飞行统一忙碌抑制＋仅防迟写/防旧响应的请求实例令牌 seq＋计时器瞬态＋一次性 `pendingVisibilityRefresh`”；两阶段条件用哨兵草稿模型；**不新增 Pinia store、不使用 localStorage/sessionStorage、不跨路由恢复现场**（§7，R1-01/R1-02/R1-03）。
8. **计时器在每次真实请求结束后重启完整 60s（成败皆然）**；被禁用/被抑制触发不重置、隐藏不重置；唯一例外是恢复可见延后补发（§7.7）：补发结束才重启 60s（§7.5/§8/§9）。
9. **包/类名**避开既有类撞名，置于 `monitor/datasourcerunstate`（§4.2）。
10. **错误码** `41xxx` 段（`41001/41002`），当前无模块占用（§4.1/API §8）。
11. **行键** = `clientId + '\x00' + dataSourceId`（NUL 分隔，同 topic-offset rowKey 方案）；序号前端按排序结果生成（API §6）。
12. **不分页**：不出现 pageNum/pageSize/pages/total 字段（API §6）。
13. **统一忙碌抑制（busy 单飞行、不排队不补发）**：请求在途时“查询/立即刷新”按钮禁用（点击不接受/不排队/不补发）、自动刷新触发被抑制；被禁用/被抑制触发不视为实际请求、不更新最近成功刷新时间、不重置计时、不报错；在途仍可改控件但只停留在草稿（§7.5/§8/§9，R1-02）。
14. **恢复可见延后单次刷新（唯一例外，非通用排队）**：恢复可见且空闲→立即按当时最新已应用条件发起 restore，结束（无论成败）重启完整 60s；恢复可见但在途→不并发，仅置一次性 `pendingVisibilityRefresh`，当前请求结束后在 `onRequestFinally` 按届时最新已应用条件补发一次 restore（不得用可见事件发生时的旧条件），补发结束才重启 60s；再次隐藏/卸载清标志不补发（§7.7/§8/§9，R1-03）。

### 15.2 待确认设计项

**0 项**（`pending_user_confirmation_count=0`）。本草案已把可依据批准需求、既有代码惯例与已核验数据库事实解决的方案全部落定（§15.1）；未发现必须在项目负责人层决策的设计分叉。R1 极小定向修订（R1-01 页面实例生命周期、R1-02 统一忙碌抑制、R1-03 恢复可见延后单次刷新、R1-04 状态元数据，见 §16）未引入新的待确认设计项。设计草案已由 ChatGPT 对 R1 结果提交（`61117a62f44d39f7c548ebcb650891abf91b9b8c`）正式复审 `APPROVED` 并经项目负责人批准（见 §17）；批准不改变本节“0 项”结论。设计批准不代表功能已实现：验收用例保持 `NOT_RUN`（既有 68 条 `DSS-AC-001~068` 与第一轮 UI 调整草案新增 `DSS-AC-069~080`、第二轮 UI 调整草案新增 `DSS-AC-081~086` 全部 `NOT_RUN`）。2026-09-07 第一轮验收前 UI 调整草案（§19）在已批准设计之上仅调整展示层设计，同样无待负责人补充决策项（`pending_user_confirmation_count=0`）。2026-09-08 第二轮验收前 UI 调整草案（§22）由项目负责人对第一轮实现 R1 对应预览页人工检查结论（`CHANGES_REQUIRED`）驱动，四类调整范围均为已确认输入，同样无待负责人补充决策项（`pending_user_confirmation_count=0`）。

## 16. R1 极小定向修订记录（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001-R1`）

ChatGPT 对上一结果提交（`31aa9f5beec7ded3cd798b3af617fd79a1606ed0`）进行独立正式复审，结论 `CHANGES_REQUIRED`。本 R1 仅修正以下四项，未改动已通过复审的 API/数据库/展示字段/状态映射/排序/候选范围等业务设计（R1 任务 §2/§8）：

- **R1-01 页面生命周期统一为每次进入默认“全部”**：本设计从“Pinia 路由级会话 store（跨路由恢复现场）”改为**页面/composable 实例内 `reactive/ref`**；每次路由进入/页面实例创建初始化界面条件=三项“全部”、已应用条件=三项“全部”、records/candidates/lastSuccessAt/hasSuccess/错误态=实例初始值，并随即自动按三项“全部”发起首次查询；路由离开即销毁实例（清计时器/可见性监听/`pendingVisibilityRefresh`、置 disposed），现场不跨路由保留；不使用 localStorage/sessionStorage；架构与建议文件清单已移除 `frontend/src/stores/dataSourceSnapshot.ts`（§1/§4/§7.1/§9）。
- **R1-02 统一请求在途规则**：删除“最新用户意图槽位 / slot / latest intent / `preserveValidFor` / 覆盖补发 / acceptedSeq 被排队意图提前作废”语义；改为统一忙碌抑制——`busy` 时“查询/立即刷新”按钮禁用（点击不接受、不排队、不补发）、自动刷新触发被抑制；被禁用/被抑制触发不视为实际请求、不更新最近成功刷新时间、不单独重置计时、不报错；在途仍可编辑三个控件但只停留在草稿，须请求结束后再次点击“查询”才生效；`seq` 仅作防卸载迟写/防旧响应覆盖的请求实例令牌（§7.3/§7.5/§8/§9/§15.1 第 13 项）。
- **R1-03 恢复可见的单次延后刷新（唯一例外）**：新增 §7.7——空闲恢复可见立即按当时最新已应用条件发起 restore，结束（无论成败）重启完整 60s；在途恢复可见不并发、仅置一次性 `pendingVisibilityRefresh`（多次可见事件合并为一次），当前请求结束后按**届时最新**已应用条件补发一次 restore（不得用可见事件发生时旧条件），补发结束才重启完整 60s；再次隐藏/卸载清标志不补发；含 `onRequestFinally` 伪代码与场景覆盖清单（§7.7/§8/§9/§15.1 第 14 项）。
- **R1-04 纠正当前复审状态元数据**：`pending_user_review` 统一为 `YES`、`pending_user_confirmation_count=0`；四份设计文档保持 `design_status=DRAFT_PENDING_USER_REVIEW`，本 R1 不批准设计（§1/README/原设计报告）。
- 已同步 UI.md、Feature README、原设计报告元数据纠错与 docs/features/README（详见对应文件 §变更记录）。完整修订前后与自检见执行报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001-R1.md`。

## 17. 设计基线批准收口记录（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`）

批准链：初版设计提交 `31aa9f5beec7ded3cd798b3af617fd79a1606ed0` → ChatGPT 正式复审 `CHANGES_REQUIRED` → R1 修订提交 `61117a62f44d39f7c548ebcb650891abf91b9b8c` → ChatGPT 对 R1 正式复审 `APPROVED` → 项目负责人随后明确回复“批准”。

- 批准版本：`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`（纯文档批准收口）。
- 批准内容基准：完整提交 SHA `61117a62f44d39f7c548ebcb650891abf91b9b8c`（R1 结果提交）。
- 批准日期：2026-09-06。
- 本次仅做纯文档批准收口：四份设计“文档状态”/`design_status` 由 `DRAFT_PENDING_USER_REVIEW` 更新为 `APPROVED`、`pending_user_review` 由 `YES` 更新为 `NO`，并记录批准链与批准日期；相对批准内容基准，四份设计的接口/参数/响应字段/SQL/状态映射/排序/候选范围/时间与 null/行键/错误码/组件职责/生命周期/请求快照/忙碌抑制/可见性补发/计时器/测试设计与追踪矩阵**业务内容零差异**。
- 设计批准不代表功能已实现：`implementation_status=NOT_STARTED`、`acceptance_execution_status=NOT_RUN`（68 条 `DSS-AC-*` 全部 `NOT_RUN`）。完整自检见批准收口报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001.md`；下一入口为另立实现任务（README §10）。

## 18. 实现任务完成记录（`DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001`）

- 2026-09-06，实现任务（基准提交 `98fe66e4f406f7d58531b76a5534d04130e5aab5`）已按本四份设计基线完成并提交：占位页替换为正式“源库快照状态”实现页；后端新增只读链路 `GET /api/monitor/data-source-run-state/list`（`monitor/datasourcerunstate` 包）；三多选/两阶段条件/请求快照/忙碌单飞行/60 秒自动刷新与恢复可见延后刷新/七列/状态与异常弱提示/稳定宽度工具栏等均按 §5~§13 落地。
- 本节仅作文档级实现记录：相对设计批准内容基准 `61117a62f44d39f7c548ebcb650891abf91b9b8c`，本设计的接口/参数/响应字段/SQL/状态映射/排序/候选范围/时间与 null/行键/错误码/组件职责/生命周期/请求快照/忙碌抑制/可见性补发/计时器/测试设计与追踪矩阵**业务内容零差异**（§1/§16/§17 中“功能仍 NOT_STARTED”等表述是设计批准阶段事实，已被本实现任务推进为 `implementation_status=IMPLEMENTED_PENDING_REVIEW`，见 Feature README §8/§9）。
- 实现状态当前 `IMPLEMENTED_PENDING_REVIEW`、正式验收 `NOT_RUN`、68 条 `DSS-AC-*` 保持 `NOT_RUN`、人工页面验收 `NOT_RUN`。完整实现落点/开发测试/构建/浏览器证据见实现报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001.md` 与 Feature README；下一入口为 ChatGPT 代码复审与项目负责人人工页面验收，正式验收另立任务执行。

## 19. 第一轮 UI 调整草案设计记录（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`）

> 本节为**第一轮**验收前 UI 调整草案设计记录（2026-09-07 已批准并实现，历史）。其中凡与第二轮草案冲突处，本轮现行规则以 §22 为准：表格固定总宽 `1145px`、七列全固定、宽屏右侧留白等 §19.4 内容已被 §22.2 表格铺满＋五固定列＋探针端/源库两弹性列取代；探针端/源库黄色异常图标与 Tooltip 异常说明等 §19.4/§19.5 内容已被 §22.3/§22.4/§22.6 删除图标、Tooltip 仅展示真实内容取代；页面级单实例 Tooltip 状态模型不变部分（§19.5）保留，覆盖范围按 §22.7 复核。不冲突的其余第一轮规则继续有效。

### 19.1 范围与不变契约

本版为**验收前 UI 调整草案**（2026-09-07，纯文档；未实现、未执行正式验收；草案阶段未批准，已于 2026-09-07 经 ChatGPT 对 R1 结果独立正式复审 `APPROVED` 与项目负责人明确批准，收口为 `APPROVED`，见 §20）。ChatGPT 对实现 R1 提交 `37825272c25c8a2d8a595ff0d5c25c6349186663` 代码复审 `CHANGES_REQUIRED`（表格长文本可读性、浏览器证据不足），项目负责人随后提出更完整的 UI 调整。本轮只调整前端**展示层**设计（§19.2~§19.6），在已批准设计 §5~§13 与 UI §1~§12 之上补充展示规则（界面细则见 UI §13）：

- **不改**：接口 `GET /api/monitor/data-source-run-state/list` 与请求/响应字段、`statusCategory`/原始状态值映射、排序、候选、时间格式与 null、行键、错误码；单飞行忙碌业务抑制、请求快照/两阶段条件、计时器、恢复可见补发、读取边界；`API.md`/`DATABASE.md` 整文件零差异；后端代码不改。
- **对应需求**：新增 `DSS-REQ-066~071`（REQUIREMENTS §21），定向修订 `DSS-REQ-028/029/050`。
- **对应验收**：新增 `DSS-AC-069~080`（ACCEPTANCE §4.18，全部 `NOT_RUN`），定向修订 `DSS-AC-026/027/068`。
- 状态：本轮 UI 调整草案（§19）已经 ChatGPT 对 R1 结果提交 `5757237...` 独立正式复审 `APPROVED` 且项目负责人明确批准，`design_status(DESIGN/UI)` 当前调整版本由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`，2026-09-07，见 §20）、本轮 UI 调整已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`（2026-09-07）按批准内容基准提交 `5757237...` 落地（实现记录见 §21）、实现 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`pending_user_review=NO`、`pending_user_confirmation_count=0`。既有批准基线保留为历史。本轮 UI 调整已实现完成待复审，不代表代码复审通过、不代表正式验收或人工验收已执行或通过；下一入口为 ChatGPT 独立代码与证据复审，然后由项目负责人人工查看页面。

### 19.2 页面三块分区与结果卡片结构（UI §13.2）

- 页面根容器划分为三个有清晰视觉分隔的顶层语义区：页头语义区（标题＋功能说明）、独立查询卡片、独立结果卡片；各自沿用 app-shell / Element Plus 浅色设计令牌（卡片边框/圆角/阴影/间距），不引入新视觉体系（DSS-REQ-066）。
- 结果卡片内部 = 头部 + 主体表格，头部与主体之间清晰轻量分隔。头部左侧为结果摘要（`共 N 条`，含未知时追加轻量橙色 `其中 N 条未知状态`，仅统计 `statusCategory=UNKNOWN`，>0 才显示，不推断健康/错误），右侧为不可拆散刷新逻辑组（DSS-REQ-066/067）。
- 建议容器/类名沿用 `.dss-` 前缀在实现阶段扩展（如 `.dss-page-header`、`.dss-query-card`、`.dss-result-card`、`.dss-result-card__header`、`.dss-result-card__table`）；最终随实现落定。
- 本 Feature 最多约 100 行，继续不分页（参考图含分页不构成加分页依据）。

### 19.3 刷新逻辑组设计与几何稳定（DSS-REQ-068，UI §13.3）

- 刷新控件收敛为结果卡片头部右侧**不可拆散刷新逻辑组**：灰色状态圆点（在途变蓝动态；文字仍是主要信息载体）＋`60 秒自动刷新`＋分隔符＋`最近成功刷新：HH:mm:ss`（从未成功 `--`）＋“立即刷新”。整组作为单一 flex/flow 项靠右；窄宽度下**整组换行**，禁止只把“立即刷新”按钮拆到下一行。
- 几何稳定策略：为“立即刷新”固定宽度（含 loading 图标固定尺寸槽位），加载图标显隐不改变按钮宽度、不移动按钮/前方文案/最近成功时间；刷新失败提示置于固定高度或替换性文本稳定槽位，出现/消失不引起工具栏明显水平跳动（三态 idle/loading/failure 几何稳定）。
- 语义与已批准一致：自动/立即刷新按已应用条件取数；最近成功刷新时间仅成功后更新；失败约 60 秒自动重试；在途禁用/抑制不提示不补发（§7.5/§8）。
- 刷新状态圆点表示**所有刷新类请求**（`manual/auto/restore`）在途，变蓝动态只是伴随状态、颜色不是唯一信息载体；刷新类请求的按钮 loading 映射（完整六类请求视觉映射见 §19.6）：`manual`（点击“立即刷新”）→ 仅“立即刷新”按钮显示 loading，且刷新状态圆点变蓝并呈刷新动态；`auto`（60 秒自动刷新）与 `restore`（恢复可见刷新）→ **只让刷新状态圆点变蓝并呈刷新动态**，“立即刷新”与“查询”按钮外观稳定、均不显示 loading。

### 19.4 第一轮：七列固定列宽与单元格展示设计（DSS-REQ-069，修订 REQ-028/029；UI §13.4）

> **第二轮取代声明（历史章节内已批准事实，非现行规则）**：本小节“表头目标固定列宽：序号 `70`/探针端 `170`/源库 `280`/快照状态 `130`/三个时间列各 `165`”曾作为固定列宽与“表格铺满可用宽度后右侧留白由 `1145px` 固定总宽造成”的描述；第二轮现行规则见 §22.2（表格必须铺满结果卡片正文、探针端/源库改弹性列吸收剩余宽度、取消固定总宽）。探针端“图标/文字可表达‘探针端配置缺失’”（本小节第二项）与源库“回退 Tooltip 显示完整原始 ID＋异常说明、INACTIVE/类别异常轻量异常语义保留”（本小节第三项）等黄色图标/异常语义已被第二轮 §22.3/§22.4 删除（缺失/停用/类别异常不再以黄色图标或异常文字提示）。另：正常源库行 Tooltip 在第一轮显示完整 `DATA_SOURCE_ORG`，第二轮 R0/R1/批准收口版误记延续该 ORG 规则；现由 R2 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2` 纠正为悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（正常行与回退行同源，见 §22.4/§22.6/§22.7）。本节其余内容为第一轮已批准并实现的历史事实，保留备查；与 R2 现行规则不冲突处继续有效。

- 表头目标固定列宽：序号 `70` 中、探针端 `170` 左、源库 `280`（明显宽于探针端）、快照状态 `130` 中、三个时间列各 `165` 左（固定格式）。时间列长度固定、不摊平均；表格容器允许横向滚动，不换行挤压时间/文本。
- 探针端单元格：只渲染原始 `CLIENT_ID`（单行 ellipsis）；`CLIENT_DESC` 仅作为悬停 Tooltip 内容（描述为空不触发）；关联异常（NOT_FOUND/INACTIVE）沿用 §5.6 标志，图标/文字可表达“探针端配置缺失”（修订 REQ-028）。
- 源库单元格：正常关联且 ORG 非空 → 渲染 `DATA_SOURCE_ORG`（单行 ellipsis），Tooltip 内容为完整 ORG（不以原始 `DATA_SOURCE_ID` 作默认 Tooltip）；ORG 空或 NOT_FOUND → 回退渲染原始 `DATA_SOURCE_ID`（不空白），Tooltip 显示完整原始 ID＋异常说明；INACTIVE/类别非 SOURCE（含大小写不敏感归一）轻量异常语义保留（修订 REQ-029）。
- 状态列/时间列/排序/序号/行键/空值/不补行规则不变；表格不使用原生 `title`（混用禁止）。

### 19.5 第一轮：页面级单实例受控 Tooltip 状态模型（DSS-REQ-070，UI §13.5）

> **第二轮取代声明（历史章节内已批准事实，非现行规则）**：本小节“覆盖范围”（本小节末尾）所列“缺失/停用/类别异常图标说明”等异常说明项已被第二轮 §22.6/§22.7 删除——第二轮现行规则下本页表格 Tooltip 只展示真实内容：探针端列完整 `CLIENT_DESC`（非空才弹）、源库列完整原始 `DATA_SOURCE_ID`（正常行与回退行同源；本句“源库列完整 ORG 或完整回退原始 ID”系 R2 前误记，已由 R2 `...-002-R2` 纠正）、未知快照状态列完整原始值；不存在异常图标，也无异常说明 Tooltip。单实例受控 Tooltip 状态模型（key/统一延迟/关闭事件/不可交互/边界定位/生命周期）本身不受影响，保留为现行设计（§22.7 复核不变）。

- **问题**：多个独立 Element Plus Tooltip 各自持有显示状态与各自延迟，可同时残留多个；快速扫行重叠；Tooltip 可交互时鼠标进入后遗留；无统一关闭/边界机制。
- **状态模型**：页面/composable 持受控“当前 Tooltip 内容槽”：`currentTooltip = { key, content, anchor, placement } | null`；单一 Tooltip Host（单一 popper/Teleport 实例）渲染，任意时刻最多 1 个。
  - **触发键 `key`**：稳定唯一标识触发点（cell 定位如 `tooltip-${rowKey}-${field}` 或异常图标定位）；key 未变不重复弹出；key 变化先置空旧项再渲染新项（先关后开，即时）。
  - **显示延迟**：统一约 300~350ms；延迟窗内离开触发区取消；不依赖多个独立 Tooltip 各自 delay 并存。
  - **关闭事件（统一置空 + 清 timer）**：离开触发元素/触发 key 变化、页面或表格容器滚动、窗口 resize、表格数据替换（records 变化）、页面隐藏（visibilitychange）、组件卸载（unmount/dispose）。hidden/unmount 须清除显示/定位定时器，防止卸载后 setState。
  - **不可交互**：pointer-events none / non-enterable，避免进入 Tooltip 本体遗留。
  - **边界定位**：对四边避让，不超出可视区、不被表格容器 overflow 裁切（Teleport 到 body/合适层）；内容优先单行，仅当完整内容物理宽度超安全视口（极端长内容）允许换行保全文不越界。
  - **生命周期**：滚动/resize/visibilitychange/卸载监听随页面实例（§7.1 composable）创建与销毁；不与原生 `title` 混用。
- 覆盖范围（第一轮已批准内容，异常图标相关部分已被 §22.6/§22.7 取代）：探针端描述、完整源库 ORG、回退原始 ID＋异常、未知状态原始值、缺失/停用/类别异常图标说明等本页全部表格 Tooltip（第一轮历史范围）；其中“完整源库 ORG”正常行 Tooltip 与“回退原始 ID＋异常”为第一轮历史内容——回退异常说明已被 §22.6/§22.7 删除，正常源库行 ORG Tooltip 已由 R2 `...-002-R2` 纠正为悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（见 §22.4/§22.7），不作为现行依据。

### 19.6 busy 视觉隔离与请求类型视觉映射设计（DSS-REQ-071，UI §13.6）

- **已确认根因**：当前“查询”绑定公共 `busy` 的默认 disabled 外观；点击“立即刷新”后 `busy=true`，“查询”短暂变灰再恢复，像被“立即刷新”联动点击；实际无第二个查询请求。初版草案未明确 `auto`/`restore` 在途时“立即刷新”按钮是否显示 loading（既有实现把 `manual/auto/restore` 共用 `refreshing`），R1 只消除这一歧义并把 §4 六类映射收口为本节唯一现行规则。
- **状态模型（语义示例，不强制具体变量名）**：状态至少能区分——
  - `requestKind` 或等价的**当前请求来源**（取值 `initial/retry/query/manual/auto/restore`）；
  - `queryLoading = kind === 'query'`（“查询”按钮 loading）；
  - `manualLoading = kind === 'manual'`（“立即刷新”按钮 loading）；
  - `refreshIndicatorActive = kind in {manual, auto, restore}`（刷新状态圆点变蓝并呈刷新动态）。
  - **设计不得再用一个笼统 `refreshing` 直接控制“立即刷新”按钮 loading**；初次加载的表格 loading（`initial`）与错误区“重新加载”按钮 loading（`retry`）继续各自独立。
- **六类请求视觉映射（唯一现行规则，保持 §7.5/§9 功能抑制不变）**：
  1. `initial`（页面首次进入自动加载）：表格区域显示 loading；“查询”与“立即刷新”按钮外观稳定、不显示 loading。
  2. `retry`（首次加载失败后点击“重新加载”）：只有错误区“重新加载”按钮显示 loading；“查询”与“立即刷新”不显示 loading。
  3. `query`（用户点击“查询”）：只有“查询”按钮显示 loading；“立即刷新”外观稳定且不显示 loading。
  4. `manual`（用户点击“立即刷新”）：只有“立即刷新”按钮显示 loading，刷新状态圆点变蓝并呈刷新动态；“查询”外观稳定且不显示 loading。
  5. `auto`（60 秒自动刷新）：只有刷新状态圆点变蓝并呈刷新动态；“查询”与“立即刷新”按钮外观稳定、均不显示 loading。
  6. `restore`（页面恢复可见后立即或延后单次刷新）：只有刷新状态圆点变蓝并呈刷新动态；“查询”与“立即刷新”按钮外观稳定、均不显示 loading。
- **统一约束**（对所有六类请求）：① `busy` 功能语义不变——任一实际请求在途期间，新查询和新刷新都不可发起，鼠标与键盘均不能产生第二个请求；② 单飞行、不并发、不排队、不补发不变，恢复可见既有的一次性延后补发规则不变；③ 非本次请求发起控件不得显示 loading、变灰闪动、按压动画或其他“好像被点击”的反馈；④ 被功能性抑制但视觉保持稳定的按钮必须具正确 `aria-disabled` 语义，并同时阻止鼠标和键盘激活；⑤ 刷新状态圆点表示所有刷新类请求（`manual/auto/restore`）在途，颜色不是唯一信息载体；⑥ `initial/retry/query` 不得错误点亮刷新状态圆点；⑦ 不得通过允许并发、取消当前请求后切换操作、排队、静默补发来实现视觉隔离。
- **网络层证明目标**：点击“立即刷新”时只有一次按当前已应用条件发出的刷新请求、无额外查询请求（AC-078）；busy 期间鼠标/键盘都不能制造第二个并发请求（AC-079）。
- **实施建议（不锁定代码）**：按当前 `requestKind` 派生 `queryLoading`/`manualLoading`/`refreshIndicatorActive`，加载反馈与圆点指示只绑定相应派生标志；禁用态以不改变布局的方式呈现（维持尺寸/文案）；并断言网络层单请求。

### 19.7 预计受影响实现文件（仅列示，本任务为纯文档一律零修改）

前端（预计，最终以实现任务为准）：`frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（三块分区/结果卡片容器与头部布局）；`components/DataSourceSnapshotToolbar.vue`（刷新逻辑组、三态几何稳定、失败提示稳定槽位、busy 视觉隔离配合）；`components/DataSourceSnapshotTable.vue`（固定列宽、单行 ellipsis、CLIENT_ID/ORG 与回退展示、受控 Tooltip 触发、去原生 title）；`components/DataSourceSnapshotQueryBar.vue`（如需配合“查询”不闪动）；`composables/useDataSourceSnapshot.ts`（受控 Tooltip 当前槽、独立 querying/refreshing 标志等）。不改：后端代码、`API.md`/`DATABASE.md`、既有证据、`topic-offset` 或其它页面（本 Feature 经实现/复审/目测通过后才提炼项目级列表页标准并另立任务）。

### 19.8 追踪与自检

- §14.2 需求 → 设计落点 71/71、§14.3 验收 → 设计落点 80/80 为第一轮批准/实现时点数值（历史）；当前第二轮草案下 §14.2 为 75/75、§14.3 为 86/86（见 §22.9）。
- `pending_user_confirmation_count=0`；本轮草案无待负责人补充决策项。
- 状态迁移见 §1；`API.md`/`DATABASE.md` 整文件零差异；源码/测试/配置/既有证据零差异；本任务不执行数据库/构建/测试/浏览器/正式验收。完整调整落点与自检见执行报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001.md`。

## 20. 第一轮 UI 调整版本批准收口记录（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`）

- 本轮验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`，§19）及其 R1 定向修订（`...-001-R1`）已批准收口：ChatGPT 对 R1 结果提交 `575723711ca39d7761df308c1c99b1e6e957cf70` 独立正式复审 `APPROVED`，项目负责人随后明确回复“批准”（批准日期 2026-09-07）。本批准只更新 `DESIGN.md`/`UI.md`/`REQUIREMENTS.md`/`ACCEPTANCE.md` 当前 UI 调整版本状态为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `5757237...`）并作文档级收口记录；相对批准内容基准，本设计 §19 全部设计内容与 §14.2/§14.3 追踪矩阵（需求 71/71、验收 80/80）业务内容零差异，UI §13 全部界面细则零差异；`API.md`/`DATABASE.md` 整文件零差异。实现状态保持 `IMPLEMENTED_ADJUSTMENT_PENDING`（本轮调整未实现）、验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`pending_user_review=NO`、`pending_user_confirmation_count=0`。批准的是本轮 UI 调整设计基线，不代表本轮调整已实现、正式验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`。下一入口为另立 UI 调整实现任务（按 §19/UI §13 落地）。完整批准收口自检见报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001.md`。（本记录为第一轮批准收口时点描述，其中需求 71/71、验收 80/80 与实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING` 均为当时状态；当前为第二轮草案，§14 数值与各状态见 §1/§22.9。）

## 21. 第一轮 UI 调整版本实现任务完成记录（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`）

- 2026-09-07，本轮 UI 调整实现任务（前端只读 UI 调整，授权基线提交 `19e405bc2c88b091abe1c04229daa37a7d4175d1`）已按批准内容基准提交 `5757237...`（§19/UI §13）完成落地并提交：查询卡片与结果卡片拆分为两个独立卡片、结果卡片头部左侧“共 N 条/其中 N 条未知状态”摘要与右侧不可拆散刷新逻辑组（三态几何稳定）、七列固定列宽、探针端单行省略＋悬停 Tooltip、源库 ORG/回退原始 ID 展示、页面级单实例受控 Tooltip（探针端描述/完整 ORG/回退原始 ID＋异常/未知状态原始值等，统一显示/关闭与生命周期）、六类请求（`initial/retry/query/manual/auto/restore`）唯一视觉映射与 busy 视觉隔离（按 §19.5/§19.6 落地）。
- 本节仅作文档级实现记录（需求 71/71、验收 80/80 为第一轮实现时点数值，历史）：相对本轮批准内容基准 `5757237...`，本设计 §19 全部设计内容与 §14.2/§14.3 追踪矩阵（需求 71/71、验收 80/80）业务内容零差异，UI §13 全部界面细则零差异，`API.md`/`DATABASE.md` 整文件零差异；改动源码限定在实现任务白名单（`frontend/src/views/data-source-run-state/**` 等，见实现报告）。
- 验证：专项前端测试 120 通过、前端全量 726/726、`vue-tsc`＋Vite 构建成功、1440×900 与 1920×1080 真实浏览器视觉验证（截图见实现任务证据目录）；未执行正式验收、未把开发自测写成 PASS。完整实现落点/测试/构建/浏览器证据见实现报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001.md`。
- 实现状态当前 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（第一轮 UI 调整已实现、待 ChatGPT 独立代码与证据复审与人工页面验收）、正式验收执行 `NOT_RUN`、当时 80 条 `DSS-AC-*` 保持 `NOT_RUN`、人工页面验收 `NOT_RUN`（第一轮时点状态，历史；当前为第二轮草案，验收 `DSS-AC-001~086` 共 86 条全部 `NOT_RUN`，见 §1/§22.9）；下一入口为 ChatGPT 独立代码与证据复审，然后由项目负责人人工查看页面，正式验收另立任务执行。

## 22. 第二轮 UI 调整草案设计记录（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`）

### 22.1 范围与不变契约

本版为**第二轮验收前 UI 调整草案**（2026-09-08，纯文档；第二轮调整未实现、正式验收未执行；草案曾于 2026-09-08 经 ChatGPT 对 R1 结果独立正式复审 `APPROVED` 与项目负责人明确“批准”，收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，见 §23，作为历史批准事实保留））；因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`、与负责人真实需求冲突，R2 极小纠正 `...-002-R2` 后本版重新进入复审，当前状态见 §1/§22.9、纠正记录见 §24

- **不改**：接口 `GET /api/monitor/data-source-run-state/list` 请求/响应、`clientRef.state`、`sourceRef.state`、`sourceRole`、`statusCategory`/原始状态值映射、候选生成与去重（含 ghost 保留）、排序、时间格式与 null、行键、错误码、计时器/恢复可见/单飞行 busy 业务抑制与读取边界；后端与数据库零改动；`API.md`/`DATABASE.md` 整文件零差异。
- **对应需求**：新增 `DSS-REQ-072~075`（REQUIREMENTS §21.2），定向修订 `DSS-REQ-022/024/028/029/041/042/043/044/045/069/070`（REQUIREMENTS §21.3）。
- **对应验收**：新增 `DSS-AC-081~086`（ACCEPTANCE §4.19，全部 `NOT_RUN`），定向修订 `DSS-AC-020/022/026/027/038/039/040/041/042/073/074/075/076/077/080`。
- 状态：本轮（第二轮）UI 调整草案（§22）及其 R1 极小定向修订（`...-002-R1`）曾于 2026-09-08 批准收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17...`，2026-09-08，见 §23；详见 §1 与 REQUIREMENTS/ACCEPTANCE），该批准作为历史批准事实保留；因批准内容误记正常源库行 Tooltip 为完整 `DATA_SOURCE_ORG`、与负责人真实需求（悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`）冲突，R2 极小纠正 `...-002-R2` 后当前第二轮调整版本重新进入复审：`design_status(DESIGN/UI)`=`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、`requirements_status`/`acceptance_status`=`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`（本轮调整尚未实现）、正式验收执行 `NOT_RUN`（`DSS-AC-001~086` 全部 `NOT_RUN`）、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=YES`、`pending_user_confirmation_count=0`。第一轮批准并实现的版本保留为历史（§19/§20/§21）。不得把 R2 纠正版本写成已批准、已实现、已通过人工页面检查或正式验收（`APPROVED`/`IMPLEMENTED`/`IMPLEMENTED_ACCEPTED`/`PASS`/`ACCEPTED`）。

### 22.2 表格铺满结果卡片与列弹性设计（DSS-REQ-072）

- 现行规则取消第一轮实现残留的表格容器固定 `width:1145px`（不得保留），表格必须在结果卡片正文可用宽度上**铺满**，右边缘贴合卡片正文右侧边界，不留截图所示大块空白，且不引起结果卡片头部（左摘要/右刷新逻辑组）位移（DSS-REQ-072；验收 `DSS-AC-073/080/081`）。
- 七列顺序保持不变（`DSS-REQ-027`）。列宽模型从“七列全固定”改为**五列固定＋探针端/源库两列弹性**：
  - 固定列（不参与宽屏剩余空间分配）：序号 `70px` 居中；快照状态 `130px` 居中；快照启动时间/快照完成时间/记录更新时间各 `165px` 左对齐（固定格式与空值规则不变，见 `DSS-REQ-055`；长度固定、不把多余空间平均摊给时间列）。
  - 弹性列（当结果卡片正文宽度大于最小总宽时吸收全部剩余宽度）：探针端最小宽度 `170px`；源库最小宽度 `280px`（源库明显宽于探针端，延续“源库列宽于探针端”约束）；单行。
  - 五固定列合计 `70+130+165+165+165=695px`，加两弹性列最小宽度 `170+280=450px`，表格**最小总宽度 `1145px`** 不变。
- 宽屏分配：卡片正文宽度 > `1145px` 时，剩余宽度 `extra = 卡片正文宽 − 1145px` 全部在探针端/源库两弹性列之间按 `170:280` 相对权重分配（等价实现可按 Element Plus 弹性列 `min-width`＋table layout：固定列给确定宽度、探针端/源库 `min-width` 取 `170px`/`280px` 并允许增长）；固定列不得参与剩余空间分配。
- 窄屏：卡片正文宽度 < `1145px` 时允许表格容器横向滚动（h-scroll），不压缩固定时间列、不换行挤压主要文本；单元格仍为单行 ellipsis。
- 目标视口：约 `1440×900`、`1920×1080` 及项目负责人当前截图对应宽度下，表格右边缘贴合结果卡片正文右侧可用边界、无右侧大块空白，头部布局不位移。
- 只改变前端布局；不改排序、序号生成、行键、空值、状态标签与时间格式。

### 22.3 探针端列展示简化设计（DSS-REQ-073）

- 主内容：始终渲染原始 `CLIENT_ID`，单行、超出弹性列宽省略号。
- Tooltip：仅当关联探针存在完整 `CLIENT_DESC` 且非空时悬停显示完整 `CLIENT_DESC`；描述为空/探针配置不存在/无法取得描述时不弹 Tooltip（不弹空 Tooltip）；Tooltip 内不得出现“配置已经停用”“探针端配置缺失”或任何异常说明文字。
- 删除探针端列全部黄色异常图标：启用/非启用/`NOT_FOUND`/描述为空等任意行均不得出现黄色符号（原 `DSS-REQ-045` 黄色图标语义在本列删除）。
- 展示层只额外判断关联探针 `FG_ACTIVE`（不改变接口已有 `clientRef.state`、后端映射与数据库读取规则）：
  - `FG_ACTIVE='1'`（启用）：仅显示 `CLIENT_ID`；
  - 非 `'1'`（含 `'0'` 及数据库宽容归一后判为非启用的值）：显示 `CLIENT_ID`＋一个空格＋红色普通文字“停用”（红字普通文本，非图标、非按钮/链接/可操作标签、不新增列）；
  - 找不到探针配置（`NOT_FOUND`）：仅显示原始 `CLIENT_ID`（缺失静默，无“缺失”文字、无黄色图标、无异常说明）。
- 验收 `DSS-AC-026/038/040/074/082`。

### 22.4 源库列展示简化设计（DSS-REQ-074）

- 正常有关联且 `DATA_SOURCE_ORG` 非空：主内容只显示 `DATA_SOURCE_ORG`（单行 ellipsis），悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（正常行与回退行同源；R2 纠正 R0/R1/批准收口版误记的“完整 `DATA_SOURCE_ORG`”规则，不取 `DATA_SOURCE_ORG`、不拼接 ORG＋ID）。
- 配置不存在或 `DATA_SOURCE_ORG` 为空：主内容回退显示完整原始 `DATA_SOURCE_ID` 的单行 ellipsis（不显示空白），悬停 Tooltip 显示完整原始 `DATA_SOURCE_ID`。
- 删除源库列全部黄色异常图标。
- Tooltip 不得追加“配置缺失”“配置停用”“类别非 SOURCE”等异常说明文字。
- 源库停用/类别异常/配置缺失时仍保留 RUN_STATE 行并按 ORG/回退原始 ID 展示；源库列不出现红色“停用”（红色“停用”仅用于探针端非启用 `FG_ACTIVE`，见 §22.3）。
- 只改变前端展示；不改 `sourceRef.state`、`sourceRole`、后端映射、候选来源或数据库读取规则。
- 验收 `DSS-AC-027/039/040/041/075/083`。

### 22.5 探针端查询下拉框长度与文本截断设计（DSS-REQ-075）

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

### 22.6 展示矩阵与 Tooltip 内容来源汇总（第二轮现行）

| 行/控件 | 主内容 | 追加文字/标记 | Tooltip（完整内容） |
|---|---|---|---|
| 探针端·启用 | 原始 `CLIENT_ID`（单行 ellipsis） | 无 | 完整 `CLIENT_DESC`（非空才弹） |
| 探针端·非启用（`FG_ACTIVE`≠`'1'`） | 原始 `CLIENT_ID`＋一个空格＋红字“停用” | 红字“停用”（普通文本，非图标/按钮） | 完整 `CLIENT_DESC`（非空才弹） |
| 探针端·`NOT_FOUND` | 原始 `CLIENT_ID` | 无（缺失静默） | 无（描述不可得时不弹） |
| 源库·正常且 ORG 非空 | `DATA_SOURCE_ORG`（单行 ellipsis） | 无 | 完整原始 `DATA_SOURCE_ID` |
| 源库·`ORG` 空/`NOT_FOUND` | 完整原始 `DATA_SOURCE_ID`（单行 ellipsis，回退） | 无 | 完整原始 `DATA_SOURCE_ID` |
| 源库·`INACTIVE`/类别非 SOURCE | 按上两行规则（ORG 或原始 ID 回退）正常展示，保留行 | 无黄色图标、无红字“停用”、无异常文字 | 同上（无异常说明追加） |
| 快照状态（已知/未知） | 标签（不变） | 未知标签样式不变 | 未知快照状态完整原始状态值（不变） |

- 本页任何表格 Tooltip 均不承载“配置缺失/配置停用/类别非 SOURCE/配置已经停用/探针端配置缺失”等异常说明。
- 黄色异常图标在探针端/源库列表格中全部取消（本 Feature 全部表格不再以黄色图标表达关联异常）。

### 22.7 页面级单实例 Tooltip 不变契约复核（第二轮现行）

- §19.5 的页面级单实例受控 Tooltip 状态模型（当前 Tooltip 内容槽 `{key,content,anchor,placement}`、单 Host、key 变化先关后开、统一延迟约 300~350ms、延迟窗内离开取消、统一关闭事件集、不可交互 pointer-events:none、边界定位、随页面实例生命周期）继续为现行规则，第二轮不改变该状态模型。
- 覆盖范围按 §22.6 收窄：探针端列完整 `CLIENT_DESC`、源库列完整原始 `DATA_SOURCE_ID`（正常行与回退行同源）、未知快照状态完整原始值；删除异常图标与异常说明类触发项后，页面 Tooltip 仍满足“任意采样时刻至多 1 个”，未知原始值 Tooltip 不回退（`DSS-AC-086`）。
- Tooltip 内容源只取真实数据（`CLIENT_DESC`、原始 `DATA_SOURCE_ID`、未知原始状态值），不拼接任何异常语义文本；`DATA_SOURCE_ORG` 只作为源库列主内容，不进入 Tooltip。

### 22.8 预计受影响实现文件（仅列示，本任务为纯文档一律零修改）

前端（预计，最终以实现任务为准）：`frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（结果卡片/表格容器铺满与页面组合）；`components/DataSourceSnapshotTable.vue`（列宽模型改五固定＋两弹性、探针端/源库单元格内容与 Tooltip 触发内容、删除黄色图标）；`components/DataSourceSnapshotQueryBar.vue`（探针端下拉 option label 的 Unicode 安全截断、selected tag 视觉约束、控件与 popper 宽度）；`tooltip/useSnapshotTooltip.ts`（仅在实现确有必要时调整页面级单实例 Tooltip 状态或内容切换；若现有通用状态逻辑已满足则保持不变）；`composables/useDataSourceSnapshot.ts`（**不属于本轮预计修改文件**；查询、已应用条件、刷新、单飞行与计时器状态机必须保持不变）。不改：后端代码、`API.md`/`DATABASE.md`、既有证据、候选来源与去重逻辑、其它页面。

### 22.9 追踪与自检

- §14.2 需求 → 设计落点 75/75；§14.3 验收 → 设计落点 86/86；无悬空。
- `pending_user_confirmation_count=0`；本轮无待负责人补充决策项；`pending_user_review=YES`（当前第二轮 UI 调整版本经 R2 极小纠正 `...-002-R2` 后重新进入复审；R0/R1 曾批准收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，见 §23），该批准作为历史批准事实保留，R2 因批准内容误记源库 Tooltip 内容而纠正并恢复 `pending_user_review=YES`，见 §24）。
- 状态迁移见 §1；`API.md`/`DATABASE.md` 整文件零差异；源码/测试/配置/既有证据零差异；本任务不执行数据库/构建/测试/浏览器/正式验收。完整调整落点与自检见执行报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002.md`。

## 23. 第二轮（本轮）UI 调整版本批准收口记录（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`）

- 本轮（第二轮）验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`，§22）及其 R1 极小定向修订（`...-002-R1`）已批准收口：ChatGPT 对 R1 结果提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 独立正式复审 `APPROVED`，项目负责人随后明确回复“批准”（批准日期 2026-09-08）。本批准只更新 `DESIGN.md`/`UI.md`/`REQUIREMENTS.md`/`ACCEPTANCE.md` 当前第二轮调整版本状态为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17...`）并作文档级收口记录；相对批准内容基准，本设计 §22 全部设计内容与 §14.2/§14.3 追踪矩阵（需求 75/75、验收 86/86）业务内容零差异，UI §16 全部界面细则零差异；`API.md`/`DATABASE.md` 整文件零差异。实现状态保持 `IMPLEMENTED_ADJUSTMENT_PENDING`（本轮调整未实现）、验收执行 `NOT_RUN`（`DSS-AC-001~086` 全部 `NOT_RUN`）、人工页面验收 `NOT_RUN`、human_visual_review_status=`CHANGES_REQUIRED`（第一轮页面人工检查历史，非本轮草案未批准）、`pending_user_review=NO`、`pending_user_confirmation_count=0`。批准的是本轮 UI 调整设计基线，不代表本轮调整已实现、正式验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`。下一入口为另立第二轮 UI 调整实现任务（按批准内容基准提交 `5da9b17...` 实现）。完整批准收口自检见报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002.md`。（本记录为第二轮批准收口时点描述，其中需求 75/75、验收 86/86、`pending_user_review=NO` 与实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING` 均为当时状态；当前因 R2 极小纠正 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2` 把批准内容误记的“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”纠正为“悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`”，本文件当前第二轮调整版本重新进入复审（`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`），现行状态以 §1/§22.1/§22.4/§22.6/§22.7/§22.9 与 §24 为准，下一入口为 ChatGPT 对本 R2 结果提交独立正式复审（不是直接实现）。）

## 24. 文档级变更记录（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2`）

- 2026-09-08，第二轮 R2 极小纠正（纯文档纠正，未批准/未实现/未验收）：批准收口（`...-APPROVAL-002`，2026-09-08，批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`）后，ChatGPT 在准备第二轮实现任务时发现批准版本把“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”记录为现行规则，与项目负责人真实需求（源库列主内容正常显示 `DATA_SOURCE_ORG`、ORG 为空/配置缺失回退原始 `DATA_SOURCE_ID`，悬停 Tooltip 均只显示完整原始 `DATA_SOURCE_ID`）冲突并暂停；项目负责人再次确认“显示源库ID”。本文件仅原位纠正源库 Tooltip 内容与来源设计（§5.6、§19.4 取代声明、§19.5 覆盖/取代声明、§22.4、§22.6、§22.7）与当前状态（§1、§22.1、§22.9、§23 记录）：`sourceMainText(row)` 仍决定主内容显示 ORG 或回退原始 ID；源库 Tooltip 内容直接取完整 `row.sourceId`、不从 `sourceRef.org` 取值、不拼接 ORG＋ID 或异常说明。DESIGN §14 追踪矩阵落点不变（无悬空、覆盖 75/75、86/86）；`API.md`/`DATABASE.md`/第二轮初版报告 `...-002.md`/R1 报告 `...-002-R1.md`/批准收口报告 `...-APPROVAL-002.md`/第一轮全部报告证据整文件零差异。状态翻转：本文件当前第二轮调整版本由 `APPROVED` 重新置为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`human_visual_review_status=CHANGES_REQUIRED`（第一轮页面人工检查历史）、`pending_user_review=YES`、`pending_user_confirmation_count=0`。下一入口为 ChatGPT 对本 R2 结果提交独立正式复审（不是直接实现）。
