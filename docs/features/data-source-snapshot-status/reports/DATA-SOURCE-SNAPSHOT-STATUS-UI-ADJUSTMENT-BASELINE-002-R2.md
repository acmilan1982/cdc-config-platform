# 第二轮验收前 UI 调整基线 R2 极小纠正执行报告 DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2` |
| 任务类型 | `DOCUMENT_MINIMAL_CORRECTION_R2`（纯文档 R2 极小纠正：批准后发现批准内容把源库列 Tooltip 内容误记为现行规则，原位纠正该唯一业务语义并把当前版本重新置回草案复审；不实现代码、不执行验收） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 分支 | `develop` |
| 本任务开始提交（base） | `ae8756a2f80b0c418a7afd1da4d51c04d7b85e21`（本任务开始时本地 HEAD、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致，ahead/behind=`0/0`，无分叉） |
| 第二轮批准内容基准提交 | `5da9b17c1a720f89482eeda1436ad633145fe9fa` |
| 第二轮批准收口提交 | `ae8756a2f80b0c418a7afd1da4d51c04d7b85e21` |
| 第二轮正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`（历史批准事实，保留） |
| 纠正日期 | `2026-09-08` |
| 任务状态 | `COMPLETED`（已完成纯文档 R2 极小纠正、四文档与 README/总索引同步并推送；当前 R2 版本未批准、第二轮调整未实现、验收未执行） |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交与推送结果见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`） |

## 2. 冲突发现过程与项目负责人再次确认

完整时间线（历史事实，按时间顺序保留）：

1. 第二轮验收前 UI 调整草案初版提交 `0889cec1a67b6e0be654f6cb1f771b71df19677d`（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`）。
2. ChatGPT 对初版独立正式复审 `CHANGES_REQUIRED`，R1 极小定向修订提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R1`）。
3. ChatGPT 对 R1 结果独立正式复审 `APPROVED`，项目负责人随后明确回复“批准”，第二轮版本收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`，批准日期 2026-09-08）。
4. 批准收口后，ChatGPT 在准备第二轮 UI 调整实现任务时发现：批准内容把“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”记成了现行规则，与项目负责人此前明确并再次确认的真实需求冲突，遂暂停实现、不再基于错误批准内容实现。
5. ChatGPT 再次向项目负责人确认最终口径，项目负责人明确选择：**“显示源库ID”**，即源库列悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`。

因此本 R2 只纠正以下唯一业务语义：

> 源库列主内容正常显示 `DATA_SOURCE_ORG`；不论主内容显示 ORG 还是因 ORG 为空/配置缺失而回退显示原始 ID，鼠标悬停 Tooltip 均只显示完整原始 `DATA_SOURCE_ID`。

## 3. 为什么批准收口后仍必须回到草案复审

- R2 不是纯文字润色，而是对已批准内容做了一项**业务纠正**：源库列正常行 Tooltip 的真实内容源从“完整 `DATA_SOURCE_ORG`”改为“完整原始 `DATA_SOURCE_ID`（正常行与回退行同源，取 `row.sourceId`）”。
- 批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002` 载明的是错误的 ORG Tooltip 规则，其批准内容与负责人真实需求不一致，不能作为第二轮实现依据；若继续把当前版本标为 `APPROVED`，将诱导实现者按错误 ORG Tooltip 落地。
- 正式批准只能作为**历史批准事实**保留，不能覆盖负责人更明确的真实需求；已发生业务纠正的版本必须重新经过 ChatGPT 独立正式复审与项目负责人重新批准后才能收口，因此四份核心文档当前第二轮版本由 `APPROVED` 重新置为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`。
- 重新复审不是重复批准整个 R0/R1：R2 只纠正“正常源库行 Tooltip 内容源”这唯一业务语义及其直接追踪描述，其余 75 条需求、86 条验收业务语义与第二轮其余三类展示调整零变化。

## 4. 唯一业务纠正：修订前 ORG Tooltip → 修订后 ID Tooltip

| 场景 | 表格主内容（不变量） | 修订前 Tooltip（R0/R1/批准收口误记） | 修订后 Tooltip（R2 现行） |
|---|---|---|---|
| 正常关联且 ORG 非空 | 只显示 `DATA_SOURCE_ORG`（单行，超列宽 ellipsis） | 完整 `DATA_SOURCE_ORG` | 完整原始 `DATA_SOURCE_ID`（正常行与回退行同源，不取 `sourceRef.org`） |
| ORG 为空 / 配置不存在 / 无法关联 | 回退显示完整原始 `DATA_SOURCE_ID`（单行，不空白） | 完整原始 `DATA_SOURCE_ID` | 完整原始 `DATA_SOURCE_ID`（不变） |
| 停用、类别非 SOURCE、配置异常等 RUN_STATE 行 | 仍按 ORG 非空显示 ORG、否则回退原始 ID | 沿用异常说明 Tooltip | 仍只显示完整原始 `DATA_SOURCE_ID`，不追加“配置缺失/配置停用/类别非 SOURCE”等异常文字或异常 Tooltip；无黄色图标、无新增红色“停用” |

不变边界：探针端列 Tooltip 仍只显示完整 `CLIENT_DESC`；未知快照状态 Tooltip 仍显示数据库原始状态值；页面级单实例 Tooltip、统一延迟、即时关闭、单行优先、极端安全换行与视口避让规则不变；表格铺满、五固定列＋探针端/源库两弹性列、查询下拉截断与全部刷新/查询状态机规则不变；API 已同时提供 `sourceId` 与 `sourceRef.org`，无需改接口或后端。

## 5. 受影响文档与实际修订位置

白名单为 6 个既有文件加 1 个新增报告，共 7 个文件：

1. `docs/features/data-source-snapshot-status/REQUIREMENTS.md` — 原位修订 `DSS-REQ-029`（源库列单行展示与 Tooltip 内容）、`DSS-REQ-070`（Tooltip 真实触发项清单：源库触发项由“完整 `DATA_SOURCE_ORG`”改为“完整原始 `DATA_SOURCE_ID`（正常与回退同源）”，同步删除“不以原始 `DATA_SOURCE_ID` 作为正常行 Tooltip 默认内容”等相反表述）、`DSS-REQ-074`（源库单元格第二轮现行展示规则）；状态元数据（§1 文档状态/requirements_status、基线关系、版本说明、§7/§25 变更记录）改为 R2 复审口径并记录本轮 R2 变更行。
2. `docs/features/data-source-snapshot-status/ACCEPTANCE.md` — 原位纠正直接验证源库 Tooltip 内容的既有用例：`DSS-AC-027`、`DSS-AC-075`、`DSS-AC-076`（覆盖范围中的源库触发项）、`DSS-AC-077`、`DSS-AC-083`、`DSS-AC-086`；表格主内容 ORG/原始 ID 回退校验保留；Tooltip 校验统一为完整原始 `DATA_SOURCE_ID`；`DSS-AC-039/040/041` 经全文扫描确认只描述回退/停用/类别异常行展示、未把正常源库 Tooltip 写成 ORG，不作文本修改，仅在本报告记录；状态元数据与变更记录（§1/§7）同步为 R2 复审口径。
3. `docs/features/data-source-snapshot-status/DESIGN.md` — §5.6 关联引用状态模型源库展示/Tooltip 使用说明、§19.4/§19.5 第一轮历史章节的第二轮取代声明（明确标注“正常源库行 Tooltip 在第一轮显示完整 `DATA_SOURCE_ORG`…现由 R2 纠正为悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`”、历史内容保留备查且不得作为现行依据）、§22.1/§22.4/§22.6/§22.7 第二轮现行源库展示与 Tooltip 内容来源（`sourceMainText(row)` 仍决定主内容 ORG/回退 ID；源库 Tooltip 内容直接取完整 `row.sourceId`，不从 `sourceRef.org` 取值、不拼接 ORG＋ID 或异常说明）、§22.9 状态、§23 批准记录补注、新增 §24 变更记录；§14 需求—设计、验收—设计追踪矩阵整文件零差异（覆盖 75/75、86/86，无悬空）。
4. `docs/features/data-source-snapshot-status/UI.md` — §4.4/§8.1 源库 Tooltip 内容、§5.4、§9 测试矩阵相关行、§13.4/§13.5 第一轮历史章节取代声明、§16.1/§16.4/§16.6/§16.7 第二轮现行源库 Tooltip 内容与覆盖范围、§16.9 状态、§17 批准记录补注、新增 §18 变更记录；UI 测试矩阵中涉及源库 Tooltip 的描述同步改为完整原始 `DATA_SOURCE_ID`。
5. `docs/features/data-source-snapshot-status/README.md` — 记录批准后发现 Tooltip 内容与负责人真实要求不一致、负责人再次确认正常源库 Tooltip 显示完整原始 `DATA_SOURCE_ID`、当前 R2 纠正版待 ChatGPT 复审与项目负责人重新批准、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`、下一入口为 ChatGPT 对 R2 结果独立正式复审（不直接实现）；§1/§5/§8/§9/§10 同步为 R2 复审口径。
6. `docs/features/README.md`（总索引） — 主表“代码状态/基线状态/最新有效证据/当前缺口/下一入口”五列与本 Feature 行同步为 R2 复审口径，追加 R2 变更记录行。
7. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2.md`（新增，本报告）。

## 6. 状态口径（四文档＋Feature README＋总索引一致）

当前第二轮 UI 调整版本经 R2 极小纠正后重新进入复审：

```text
requirements_status=DRAFT_ADJUSTMENT_PENDING_USER_REVIEW
acceptance_status=DRAFT_ADJUSTMENT_PENDING_USER_REVIEW
design_status=DRAFT_ADJUSTMENT_PENDING_USER_REVIEW
ui_status=DRAFT_ADJUSTMENT_PENDING_USER_REVIEW
implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING
formal_acceptance_execution_status=NOT_RUN
human_visual_acceptance_status=NOT_RUN
human_visual_review_status=CHANGES_REQUIRED
pending_user_review=YES
pending_user_confirmation_count=0
```

- 第二轮版本曾于 2026-09-08 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002`，批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa`），该批准作为历史批准事实保留。
- `human_visual_review_status=CHANGES_REQUIRED` 仍是第一轮页面人工检查历史；本次 Tooltip 最终内容已由负责人确认，没有待用户决策项。
- R2 未经重新复审与批准，不能保持当前 `APPROVED`；不得写成第二轮调整已实现、已验收或已接受（`IMPLEMENTED`/`PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`）。

## 7. 强制一致性与残留扫描

Commit 前机械核验结果：

1. `DSS-REQ-001~075` 连续唯一，共 75 条；无 `DSS-REQ-076`。
2. `DSS-AC-001~086` 连续唯一，共 86 条，全部 `NOT_RUN`（`acceptance_not_run_count=86`）；无 `DSS-AC-087`。
3. 需求—验收覆盖 75/75，反向引用无悬空；§14 追踪矩阵相对批准内容基准零差异。
4. 只允许与源库 Tooltip 内容直接相关的业务行变化。需求业务行变化：`DSS-REQ-029/070/074`；验收业务行变化：`DSS-AC-027/075/076/077/083/086`。其余需求/验收业务行逐字节零差异。
5. DESIGN/UI 只允许 Tooltip 内容、对应追踪与当前状态/变更记录变化。
6. 6 个既有白名单文件真实 NUL 字节为 0，UTF-8 有效。
7. 现行规则残留扫描：对四文档、Feature README、总索引逐处检查，现行规则中不存在“正常源库行 Tooltip 显示 `DATA_SOURCE_ORG`”“正常源库行 Tooltip 不使用 `DATA_SOURCE_ID`”“源库 Tooltip 内容源含 ORG”“ORG＋ID 拼接”“Tooltip 追加配置缺失/停用/类别异常说明”等错误语义。扫描到含 ORG-Tooltip 文字的位置全部为：R2 纠正过程叙述（描述批准版本“误记”错误）或第一轮历史章节——DESIGN §19.4/§19.5、UI §13.4/§13.5 的取代声明块（紧邻历史内容，标注“第二轮取代声明（历史章节内已批准事实，非现行规则）”并指名 R2 纠正），以及 DESIGN §21 第一轮实现完成记录（记录第一轮实现当时确曾采用 ORG Tooltip 的历史事实）；这些均紧邻“历史、已由 R2 取代/纠正”的明确说明，不作为当前实现依据。第二轮现行规则（DESIGN §22.4/§22.6/§22.7、UI §16.4/§16.6/§16.7）全部为“悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`（正常行与回退行同源）”。
8. 历史文本保留的旧语义（第一轮 ORG Tooltip、R0/R1/批准收口误记延续 ORG Tooltip）均作为历史过程事实保留并紧邻取代/纠正说明，未篡改第一轮历史事实。

## 8. 零差异证明

- `API.md`、`DATABASE.md`：整文件零差异（相对本任务开始提交，`git status`/`git diff` 无任何改动）。
- 第二轮初版报告 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002.md`、R1 报告 `...-002-R1.md`、批准收口报告 `...-APPROVAL-002.md`：整文件零差异。
- 第一轮全部报告与证据：零差异。
- 全部前后端源码、测试、配置、菜单、路由、图片与证据：零差异（本任务为纯文档）。
- 其他 Feature 文档：零差异（总索引本 Feature 行与本次变更记录除外）。
- 修改文件为有效 UTF-8，真实 NUL 字节为 0。

## 9. 构建/测试/服务/数据访问

本任务为纯文档任务，未构建、未测试、未启动任何服务、未访问数据库/ZooKeeper/Kafka：

```text
test_build_status=NOT_RUN_NOT_APPLICABLE_DOCS_ONLY
browser_verification_status=NOT_RUN_NOT_APPLICABLE_DOCS_ONLY
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_access_status=NONE
kafka_access_status=NONE
service_operation_status=NONE
code_change_status=NONE
```

## 10. Git 提交记录

- 本任务开始提交：`ae8756a2f80b0c418a7afd1da4d51c04d7b85e21`（本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 三者一致，ahead/behind=`0/0`）。
- 本任务按完整路径逐个暂存白名单内 7 个文件（6 个既有文件＋本新增报告），未使用 `git add .`/`git add -A`；工作区其余用户既有未提交内容保持原样。
- 结果提交、远程提交与推送状态见任务机器可读输出 `AGENT_TASK_RESULT`（本报告不预填尚未产生的 result_commit_id）。
- 本任务完成普通 Commit 与普通 Push 后即停止；未批准 R2、未实现第二轮 UI 调整、未执行正式验收、未把页面标记为人工接受。

## 11. 下一入口

下一入口为 **ChatGPT 对本 R2 结果提交独立正式复审**（不是直接实现、不是直接批准收口）。复审通过并由项目负责人重新批准后，再另立第二轮 UI 调整实现任务，基于批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 按 DESIGN §22/§23 与 UI §16/§17 落地本轮四类展示调整并补齐证据与验收；正式验收（`DSS-AC-001~086` 共 86 条）另立独立正式验收任务执行。
