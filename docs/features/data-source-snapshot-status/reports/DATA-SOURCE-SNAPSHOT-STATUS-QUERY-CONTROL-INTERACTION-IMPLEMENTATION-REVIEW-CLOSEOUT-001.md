# 源库快照状态查询控件交互实现复审收口报告

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001`
- 任务类型：纯文档复审结论与人工检查结论收口（不实现、不验收、不改代码、不改业务规则、不改接口/数据库契约、不改验收结论）
- 目标分支：`develop`
- 任务起点提交：`758253cb842e7c2eceade93744e4c51e93cbe58f`
- 查询控件交互调整批准内容基准：`cf9f9eb0240f275cd50eb37546e6d6256892a9f4`
- 初次实现提交：`a47988820c797ff60bd7244b2d0f899bd8fc3be5`
- R1 修正实现提交：`edba7c891884d0f000a7c9edc196b2bffb95e0b0`
- R2 测试计数文档纠正提交：`2a9a271690bfdc68b16772268e84928a33abdeda`
- 收口日期：2026-09-12
- 隔离 worktree：`/agent/dss-qc-review-closeout-001`（detached HEAD，`758253cb842e7c2eceade93744e4c51e93cbe58f`）

> 本报告为**纯文档复审结论收口**记录。`DSS-AC-001~107` 共 107 条全部保持 `NOT_RUN`；本次收口不执行正式验收、不把任何验收项改为 `PASS`、不把 Feature 写成 `IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/`formal_acceptance_status=PASS`/`COMPLETED`。

---

## 1. 任务性质与复审对象提交链

本收口针对的是一条完整的**查询控件交互调整**实现-复审提交链，而不是新的实现或新的业务内容：

| 环节 | 任务 | 提交 |
|---|---|---|
| 批准内容基准 | `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` | `cf9f9eb0240f275cd50eb37546e6d6256892a9f4` |
| 初次实现 | `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001` | `a47988820c797ff60bd7244b2d0f899bd8fc3be5` |
| R1 修正实现 | `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1` | `edba7c891884d0f000a7c9edc196b2bffb95e0b0` |
| R2 测试计数文档纠正 | — | `2a9a271690bfdc68b16772268e84928a33abdeda` |
| 任务起点 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-TRACEABILITY-CURRENT-STATUS-CORRECTION-001-R1`（结果） | `758253cb842e7c2eceade93744e4c51e93cbe58f` |

- R1 修正实现提交 `edba7c8...` 承载查询控件四字段展示管线的 trim＋20 Unicode 码点截断、`CLIENT_DESC` Tooltip、稳定身份定位与完整原始查询值语义。
- R2 提交 `2a9a271...` **仅修正测试计数 `100→102`，无任何代码变化**（已在 §2 复审结论中被 ChatGPT 明确确认）。
- 当前固定宽度实现（已在后续提交中落地的 popper 外层固定宽度）只在查询栏相关 CSS 上叠加固定外层 `.el-popper` 宽度，**没有回退 R1 的 trim、截断、稳定身份、Tooltip 或完整原始查询值语义**。
- 本任务**不新增**任何业务规则、实现代码、接口契约或验收结论，只在既有文档上完成复审结论的状态收口。

---

## 2. ChatGPT 独立代码复审结论及核心依据

ChatGPT 已从远程 Git 对 R1 修正实现提交 `edba7c891884d0f000a7c9edc196b2bffb95e0b0` 独立完成代码复审。

```text
query_control_interaction_adjustment_code_review_status=APPROVED
formal_5173_code_review_status=APPROVED
```

复审核心依据：

1. 四字段 `CLIENT_ID`、`CLIENT_DESC`、`DATA_SOURCE_ORG`、`DATA_SOURCE_ID` 共用单一展示管线：先 `trim()`，再按 20 个 Unicode 码点判断和截断；
2. `CLIENT_DESC` 仅在 trim 后超过 20 个码点时显示 Tooltip，内容为完整 trim 后描述；
3. Tooltip 通过原始完整 `CLIENT_ID` 的 Feature 私有稳定身份定位，不以截断后的可见文字反查；截断标签碰撞不会串号；
4. 展示截断不回写选项 value、查询草稿、已应用条件或 GET 参数；
5. Tooltip 单实例、移出销毁、组件卸载清理监听器，不污染表格 Tooltip；
6. Git 中原始证据显示：定向 `102/102`、Feature `241/241`、前端全量 `830/830`、构建成功；四档浏览器验证中控件几何 delta 为 0、碰撞映射正确、Console 0 error、页面无写请求。

该 `APPROVED` **只针对实现代码复审**，不改变正式验收状态，也不把实现写成 `IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/`PASS`/`COMPLETED`。

---

## 3. 项目负责人人工检查原话及其作用范围

项目负责人在查询控件 R1 与后续固定宽度调整**全部进入 `5173`** 后，对最终页面进行了人工视觉和交互检查，并明确回复：

```text
人工检查了，没有问题
```

据此本任务记录：

```text
query_control_human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER
project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER
```

- 作用范围：项目负责人对**当前 `5173` 页面**进行的视觉与交互检查。
- 结论日期：2026-09-12。
- 该结论为该明确回复的原文语义，未附加新的业务口径；人工通过**只表示**实现已可进入正式验收阶段，不等于正式验收已执行或通过。

---

## 4. “人工页面检查”与“正式人工验收”的边界说明

严格区分：

- 上述是项目负责人对当前 `5173` 页面进行的**视觉与交互检查**；
- 它**不是** `DSS-AC-001～107` 的正式验收执行；
- 它**不等于**正式人工验收 `human_visual_acceptance_status` 已完成；
- `human_visual_acceptance_status` 必须继续保持 `NOT_RUN`；
- `formal_acceptance_status` 必须继续保持 `NOT_RUN`。

此前的：

```text
project_owner_visual_review_status=CHANGES_REQUIRED
```

是后续查询控件交互与 popper 固定宽度调整的**历史驱动事实**，在带明确日期/任务链的历史语境中保留，但已不作为当前未解决状态出现在当前状态表或当前导航说明中。

---

## 5. 当前状态修改前后对照

| 状态 token | 修改前（收口前历史状态） | 修改后（当前状态） |
|---|---|---|
| `query_control_interaction_adjustment_status` | `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW` | `APPROVED` |
| `query_control_interaction_adjustment_implementation_status` | `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW` | `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE` |
| `query_control_interaction_adjustment_code_review_status` | `PENDING_CHATGPT_REVIEW`（初次实现 `CHANGES_REQUIRED`） | `APPROVED` |
| `query_control_human_visual_interaction_review_status` | `NOT_PASSED` | `APPROVED_BY_PROJECT_OWNER` |
| `project_owner_visual_review_status` | `CHANGES_REQUIRED` | `APPROVED_BY_PROJECT_OWNER` |
| `formal_5173_code_review_status` | `PENDING_CHATGPT_REVIEW` | `APPROVED` |
| `formal_acceptance_status` | `NOT_RUN` | `NOT_RUN`（不变） |
| `acceptance_execution_status` | `NOT_RUN` | `NOT_RUN`（不变） |
| `human_visual_acceptance_status` | `NOT_RUN` | `NOT_RUN`（不变） |
| `formal_acceptance_not_run_count` | `107` | `107`（不变） |
| `pending_user_review` | `NO` | `NO`（不变） |
| `pending_user_confirmation_count` | `0` | `0`（不变） |

修改落点（仅 §1 组合/分层状态、当前状态段、当前下一入口、当前追踪说明与追加收口记录；业务正文不动）：

| 文件 | 落点 |
|---|---|
| `docs/features/README.md` | Feature 索引行：当前状态、下一入口、需求/验收计数同步；追加一条变更记录 |
| `docs/features/data-source-snapshot-status/README.md` | §1 组合/分层状态与当前下一入口；追加收口记录 |
| `docs/features/data-source-snapshot-status/REQUIREMENTS.md` | §1 组合/分层状态与当前下一入口；追加变更记录行 |
| `docs/features/data-source-snapshot-status/ACCEPTANCE.md` | §1 组合/分层状态与当前下一入口；追加变更记录行 |
| `docs/features/data-source-snapshot-status/DESIGN.md` | §1 组合/分层状态与当前下一入口；§14.2/§14.3 当前状态说明；§26.6 分层状态与下一入口；追加收口记录 |
| `docs/features/data-source-snapshot-status/UI.md` | §1 组合/分层状态与当前下一入口；§20.7 分层状态与下一入口；追加收口记录 |
| `docs/features/data-source-snapshot-status/API.md` | §1 组合状态、当前下一入口同步；一条简短收口记录（业务契约不动） |
| `docs/features/data-source-snapshot-status/DATABASE.md` | §1 组合状态、当前下一入口同步；一条简短收口记录（业务正文不动） |
| `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001.md` | 本复审收口报告（新增） |

方向性纠正说明：查询控件实现任务发布时其自述状态为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、代码复审 `PENDING_CHATGPT_REVIEW`；初次实现一度给出 `CHANGES_REQUIRED`，R1 修正后独立代码复审一度为 `PENDING_CHATGPT_REVIEW`。R1 修正实现经 ChatGPT 从远程 Git 独立复审给出 `APPROVED`，项目负责人对含后续 popper 固定宽度修正的最终 `5173` 页面人工检查通过，故本次把上述状态收口。改写后的旧 token 一律标注为“2026-09-12 前历史状态”或“收口前历史状态”，并保留日期、旧任务编号与“历史/此前/当时”上下文，未被静默抹去，也未做无差别全局替换。

---

## 6. DESIGN §14.2 / §14.3 当前状态修正说明

定向更新当前状态说明（不修改任何追踪映射表行）：

- `DSS-REQ-084～086`：独立代码复审由 `PENDING_CHATGPT_REVIEW` 收口为 `APPROVED`，实现状态更新为 `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`；
- `DSS-AC-096～103`：由“仍待独立代码复审”改为代码复审 `APPROVED`，同时明确这 **8 条仍全部为 `NOT_RUN`**；
- **未修改**任何追踪映射表行（§14.2 需求映射 87/87、§14.3 验收映射 107/107 逐字节不变）；
- **未修改** `DSS-REQ-087 / DSS-AC-104～107` 已正确记录的固定宽度 R2、代码复审与人工检查状态；
- **未回退** `DSS-REQ-076～083 / DSS-AC-087～095` 已由 `758253c...` 纠正的实现事实。

---

## 7. 87 条需求、107 条验收、107 条 `NOT_RUN` 证明

- 需求：`DSS-REQ-001~087` 共 **87 条**，连续唯一。
- 验收：`DSS-AC-001~107` 共 **107 条**，连续唯一，且**全部 `NOT_RUN`**（`formal_acceptance_not_run_count=107`）。
- 计数：`requirements_count=87`、`acceptance_count=107`、`acceptance_not_run_count=107`、`acceptance_pass_count=0`、`acceptance_fail_count=0`、`acceptance_blocked_count=0`。
- 本次收口**未新增、未删除、未重排、未复用**任何需求/验收编号；未把任何 `DSS-AC-*` 改为 `PASS`。
- `desktop/` 与原型自检均未用于本次收口，`5174` prototype 的测试/构建/浏览器验证不得写成正式验收 `PASS`。

---

## 8. 业务行、追踪映射表及 DESIGN/UI 业务规则零变化证明

相对起点 `758253cb...`：

- `REQUIREMENTS.md` 全部 `DSS-REQ-001~087` 业务表行**逐字节不变**（`requirements_business_row_change_status=ZERO`）；
- `ACCEPTANCE.md` 全部 `DSS-AC-001~107` 业务表行及每条 `NOT_RUN` 状态**逐字节不变**（`acceptance_business_row_change_status=ZERO`）；
- `DESIGN.md` §14.2、§14.3 全部追踪映射表行**逐字节不变**（`traceability_mapping_row_change_status=ZERO`），覆盖仍为 87/87 与 107/107；
- `DESIGN.md` §25、§26、§27 业务规则 与 `UI.md` §19、§20、§21 业务规则**逐字节不变**（`design_ui_business_rule_change_status=ZERO`）；
- popper 固定宽度：外层 480/400/240px、正式支持视口下限 `1280px`、`<1280px` 防御性观察边界，及 trigger `240/300/200×32px`、四字段 trim＋20 Unicode 码点截断、`CLIENT_DESC` Tooltip、完整原始查询值语义，均未改写。

---

## 9. API / DATABASE 契约零变化证明

| 范围 | 状态 |
|---|---|
| `API.md` 接口路径/方法/参数/响应字段/DTO/VO/错误码与 §9 映射表 | `api_contract_change_status=NONE`（逐字节不变，仅 §1 组合状态与下一入口同步 + 一条简短收口记录） |
| `DATABASE.md` 三表投影/SQL/字段/主键/索引/约束/关联/排序/只读边界 | `database_contract_change_status=NONE`（逐字节不变，仅 §1 组合状态与下一入口同步 + 一条简短收口记录） |

---

## 10. frontend/backend/测试/证据/既有报告零变化证明

| 范围 | 状态 |
|---|---|
| `frontend/**` | `frontend_code_diff=ZERO` |
| `backend/**` | `backend_code_diff=ZERO` |
| 测试代码 | `test_code_diff=ZERO` |
| SQL / YAML / XML / 配置 / 提示词 / 其他 Feature 文档 | 零改动 |
| `evidence/**`（截图、日志、浏览器矩阵） | `evidence_change_status=ZERO` |
| 既有报告（查询控件 R1/R2、popper 实现/复审、DESIGN 追踪纠正 R0/R1 报告等） | `existing_report_change_status=ZERO` |

- 本次为纯文档收口，未运行测试、构建或浏览器验证，未启停服务：`test_status=NOT_RUN_NOT_REQUIRED_DOC_ONLY`、`build_status=NOT_RUN_NOT_REQUIRED_DOC_ONLY`、`browser_verification_status=NOT_RUN_NOT_REQUIRED_DOC_ONLY`、`service_lifecycle_status=NOT_RUN_NOT_REQUIRED_DOC_ONLY`。
- 未连接数据库：`database_access_status=NONE`；未访问 ZooKeeper：`zookeeper_access_status=NONE`；未访问 Kafka：`kafka_access_status=NONE`。
- 未新增/未修改任何业务规则。

---

## 11. 修改文件白名单证明

本次变更文件严格等于任务白名单 **8 份既有文档 + 1 份新增收口报告**：

```text
docs/features/README.md
docs/features/data-source-snapshot-status/README.md
docs/features/data-source-snapshot-status/REQUIREMENTS.md
docs/features/data-source-snapshot-status/ACCEPTANCE.md
docs/features/data-source-snapshot-status/DESIGN.md
docs/features/data-source-snapshot-status/UI.md
docs/features/data-source-snapshot-status/API.md
docs/features/data-source-snapshot-status/DATABASE.md
docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001.md
```

未修改 `frontend/**`、`backend/**`、测试、SQL、配置、证据目录、既有报告及任务提示词（`git diff --name-only` 与 §9 校验一致性见任务结果块）。

---

## 12. Git diff-check、Commit、Push 与远程一致性

- 提交范围：白名单 8 份既有文档 + 1 份新增收口报告，按明确路径逐个暂存（不使用 `git add .`/`git add -A`）。
- 提交方式：一次普通提交，不 amend、不 rebase、不 force push。
- 提交信息：`docs(source-snapshot): close query-control implementation review [DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001]`。
- 推送：推送前再次 `git fetch origin develop`；若远程仍为起点 `758253cb...` 且可安全快进，则执行 `git push origin HEAD:develop`；远程若已前进则停止，不合并、不变基、不强推。
- 远程一致性：推送后核对 local HEAD、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致，ahead/behind 为 `0/0`。
- 提交前 `git diff --check` 结果见任务结果块 `git_diff_check_status`。

（任务完成后回填的最终提交/推送/一致性结果见本次任务结果块 `result_commit_id`/`remote_commit_id`/`remote_sync_status`；本报告不预先伪造尚未产生的结果。）

---

## 13. 主工作区与全部既有 worktree 保全证明

- 本次复审收口在全新隔离 worktree `/agent/dss-qc-review-closeout-001`（detached HEAD，起点提交 `758253cb842e7c2eceade93744e4c51e93cbe58f`）中完成。
- 未进入、未清理、未 stash、未 reset、未 checkout、未暂存、未覆盖、未提交主工作区 `/agent/cdc-config-platform` 及任何既有 worktree 的修改。
- 任务开始时 `git worktree list` 共 33 条（含主工作区）；主工作区仍在 `develop`，任务开始前既有 `12` 项 tracked 修改/删除与 `104` 项未跟踪文件全部保持原样。任务完成后对照一致。
- `main_worktree_preservation_status` 与 `existing_worktrees_preservation_status` 见任务结果块。

---

## 14. 未运行测试、构建、浏览器验证，未启停服务，未访问数据库/ZooKeeper/Kafka

本任务为纯文档收口：

- 未重新运行测试、构建或浏览器验证（`test_status`/`build_status`/`browser_verification_status` = `NOT_RUN_NOT_REQUIRED_DOC_ONLY`）；
- 未启动或停止任何服务（`service_lifecycle_status=NOT_RUN_NOT_REQUIRED_DOC_ONLY`）；
- 未访问数据库（`database_access_status=NONE`）、ZooKeeper（`zookeeper_access_status=NONE`）、Kafka（`kafka_access_status=NONE`）。

相关状态一律写为 `NOT_RUN_NOT_REQUIRED_DOC_ONLY`、`NOT_APPLICABLE` 或 `NONE`，**未写 `PASS`**。

---

## 15. 正式验收仍未执行及下一入口

- `formal_acceptance_status=NOT_RUN`；`acceptance_execution_status=NOT_RUN`；`human_visual_acceptance_status=NOT_RUN`；`formal_acceptance_not_run_count=107`。
- `DSS-AC-001~107` 共 107 条全部保持 `NOT_RUN`，本次收口未把任何验收项改为 `PASS`。
- 复审通过**只表示**实现可以进入独立正式验收阶段；正式验收须由后续独立任务 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` 按已批准需求/设计/接口/UI/数据库与 `DSS-AC-001~107` 执行，本任务不启动、不执行正式验收。
- `pending_user_review=NO`；`pending_user_confirmation_count=0`。

本轮复审收口后的统一下一入口：

```text
DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001
```

---

## 附：本报告自证清单

| 项 | 值 |
|---|---|
| 任务起点提交 | `758253cb842e7c2eceade93744e4c51e93cbe58f` |
| 查询控件交互调整批准内容基准 | `cf9f9eb0240f275cd50eb37546e6d6256892a9f4` |
| 初次实现提交 | `a47988820c797ff60bd7244b2d0f899bd8fc3be5` |
| R1 修正实现提交 | `edba7c891884d0f000a7c9edc196b2bffb95e0b0` |
| R2 测试计数文档纠正提交 | `2a9a271690bfdc68b16772268e84928a33abdeda` |
| ChatGPT 独立代码复审 | `APPROVED` |
| 项目负责人人工视觉/交互检查 | `APPROVED_BY_PROJECT_OWNER`（2026-09-12，“人工检查了，没有问题”） |
| `query_control_interaction_adjustment_status` | `APPROVED` |
| `query_control_interaction_adjustment_implementation_status` | `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE` |
| `query_control_interaction_adjustment_code_review_status` | `APPROVED` |
| `query_control_human_visual_interaction_review_status` | `APPROVED_BY_PROJECT_OWNER` |
| `project_owner_visual_review_status` | `APPROVED_BY_PROJECT_OWNER` |
| `formal_5173_code_review_status` | `APPROVED` |
| 需求/验收 | 87 / 107（全部 `NOT_RUN`） |
| 追踪 | 87/87、107/107 |
| 正式验收 | `NOT_RUN`（不变） |
| `pending_user_review` | `NO` |
| `pending_user_confirmation_count` | `0` |
| 下一入口 | `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` |

---

## R1 追加纠正记录（2026-09-12）

> 本记录由任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001-R1` **追加**于原报告末尾。
> 原报告 §1～§15 及其自证清单内容**保持不变**，未删除、未改写、未伪造任何原始历史结论；本节仅在其后补充事实澄清与纠正说明。

### R1-1 纠正事项

ChatGPT 对原报告的独立复审结论为 `CHANGES_REQUIRED`，指出原报告在把「当前值」字段收口为收口后统一取值时**存在未收口的遗留当前字段**，其中包含原报告在范围判断上把 `DESIGN.md` §1 中与 popper 固定宽度相关的「当前状态/下一入口」等行判断为「授权范围外」从而未予同步的倾向。

需要澄清的事实是：

1. 原报告 §5「状态令牌表」实际枚举的收口令牌为：`query_control_interaction_adjustment_status`、`query_control_interaction_adjustment_implementation_status`、`query_control_interaction_adjustment_code_review_status`、`query_control_human_visual_interaction_review_status`、`project_owner_visual_review_status`、`formal_5173_code_review_status` 六项，以及保持不变的 `NOT_RUN`/`NO`/`0` 类令牌。
2. 该枚举**未覆盖**以下同样属于「当前值」语义、且其残留值仍带 `PENDING_REVIEW` 或指向历史入口的字段：
   - `DESIGN.md` §1 的 `implementation_status` 叙述；
   - `DESIGN.md` §1 的 `formal_5173_implementation_status`；
   - `DESIGN.md` §1 第 73 行 popper 任务编号行的 `popper_width_formal_5173_implementation_status`；
   - 文档总体状态 `overall_document_status`；
   - popper 固定宽度基线的「本轮下一入口」直接取值。
3. 因此，原报告所隐含的「上述残留当前字段属于授权范围外、无需同步」判断**不成立**：这些字段的语义是当前状态/当前导航，属于本轮统一收口的应覆盖对象。该判断被纠正，而非认可。
4. 上述遗留字段已由 R1 任务按任务提示词 §4/§5 的事实要求在 `DESIGN.md`、`UI.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`API.md`、`DATABASE.md`、Feature `README.md`、`docs/features/README.md` 中收口为：
   - 当前实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`；
   - 当前文档总体状态 `PROTOTYPE_DESIGN_APPROVED_AND_IMPLEMENTED_ON_5173_PENDING_FORMAL_ACCEPTANCE`；
   - 当前统一下一入口 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`。
   历史值一律以日期/「此前/当时/历史/收口前」等限定词保留，未被全局替换。

### R1-2 关于 `DESIGN.md` §1 第 73 行

`DESIGN.md` §1 第 73 行（popper 固定宽度任务编号行）在 R0 提交 `1ddb84e9dec5a0aa2fc3b4aedc0d301855861f3a` 时，其「当前」字段末尾为：

```text
popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW
```

该值正是任务提示词 §5.1 第 4 项所指的待收口残留。R1 已将其当前值纠正为 `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`，并保留该行的历史说明（原历史实现状态与当时代码复审结论 `CHANGES_REQUIRED`，设计落点见 `DESIGN.md` §27）。

### R1-3 纠正后的口径

- 查询控件交互调整：基线 `APPROVED`；实现 `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`；代码复审 `APPROVED`；人工检查 `APPROVED_BY_PROJECT_OWNER`。
- popper 固定宽度（R2）：文档 `APPROVED`；实现 `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`；代码复审 `APPROVED`；人工检查 `APPROVED_BY_PROJECT_OWNER`。
- R2～R7 正式 5173 视觉实现：已实现并经代码复审通过，其后调整亦经代码复审与人工检查，整体等待正式验收。
- 正式验收 `NOT_RUN`；验收执行 `NOT_RUN`；人工正式验收 `NOT_RUN`；`DSS-AC-001~107` 仍全部 `NOT_RUN`。
- 当前统一下一入口：`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`。

### R1-4 边界声明

- 本追加记录**未**修改原报告正文任何字节，仅在文末新增本节；
- 本追加记录**未**执行正式验收、**未**改动任何 `DSS-AC-*` 结果、**未**改动前端/后端/测试/SQL/配置/图片/运行证据；
- 本追加记录**未**访问数据库、ZooKeeper、Kafka，**未**启停任何服务。
