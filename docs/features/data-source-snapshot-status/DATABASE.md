# 源库快照状态 Feature 数据库查询设计草案（DATABASE）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态 |
| Feature 标识 | `data-source-snapshot-status` |
| 所属模块 | 运行监控 |
| 目标文档 | `docs/features/data-source-snapshot-status/DATABASE.md`（数据库查询设计草案） |
| 配套设计文档 | `DESIGN.md`（总设计入口）、`API.md`（接口设计草案）、`UI.md`（界面设计草案） |
| 文档状态 | `APPROVED`（数据库查询设计基线已批准，批准日期 2026-09-06；批准版本与批准内容基准见 DESIGN §1/§17 与 Feature README §5） |
| requirements_status | `APPROVED`（`docs/features/data-source-snapshot-status/REQUIREMENTS.md`：当前共 `DSS-REQ-001~087` **87 条全部纳入当前批准需求基线**；R2～R7 prototype 设计固化新增的 `DSS-REQ-076~083` 已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a`，批准日期 2026-09-10），不再为 `DRAFT_PENDING_USER_REVIEW`；本轮查询控件交互调整新增的 `DSS-REQ-084~086` 已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`，批准日期 2026-09-10）；该 3 条为纯前端查询控件展示与交互规则，**不改变三表投影、SQL、字段、主键、索引、约束、关联、排序或只读边界**；本轮查询下拉固定宽度基线（2026-09-11）另新增需求 `DSS-REQ-087`（见 REQUIREMENTS §21.8），该条同为纯前端 popper 几何规则，**不改变三表投影、SQL、字段、主键、索引、约束、关联、排序或只读边界**，已由 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `f74dd725682b745f1b8ac6a1b9358eff10aaddc2`，批准日期 2026-09-11）） |
| acceptance_status | `APPROVED`（`docs/features/data-source-snapshot-status/ACCEPTANCE.md`：当前共 `DSS-AC-001~107` **107 条全部纳入当前批准验收基线**、当前（2026-09-12 正式验收执行后）`PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`（`acceptance_execution_status=PASS`、`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`、`formal_acceptance_pass_count=107`、`formal_acceptance_fail_count=0`、`formal_acceptance_blocked_count=0`、`formal_acceptance_not_run_count=0`、`human_visual_acceptance_status=NOT_RUN`）；2026-09-12 执行前历史值：**全部保持 `NOT_RUN`**；R2～R7 设计固化新增的 `DSS-AC-087~095` 已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a`，批准日期 2026-09-10）（该时点（2026-09-12 前历史）正式验收执行仍为 `NOT_RUN`；当前已执行 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`（`acceptance_execution_status=PASS`、`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`、`formal_acceptance_pass_count=107`、`formal_acceptance_fail_count=0`、`formal_acceptance_blocked_count=0`、`formal_acceptance_not_run_count=0`、`human_visual_acceptance_status=NOT_RUN`））；本轮查询控件交互调整新增的 `DSS-AC-096~103` 已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4`，批准日期 2026-09-10）（该时点（2026-09-12 前历史）**103 条当时仍全部 `NOT_RUN`**；当前 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`（`acceptance_execution_status=PASS`、`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`、`formal_acceptance_pass_count=107`、`formal_acceptance_fail_count=0`、`formal_acceptance_blocked_count=0`、`formal_acceptance_not_run_count=0`、`human_visual_acceptance_status=NOT_RUN`））；本轮查询下拉固定宽度基线（2026-09-11）另新增验收 `DSS-AC-104~107`（见 ACCEPTANCE §4.22），已由 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `f74dd725682b745f1b8ac6a1b9358eff10aaddc2`，批准日期 2026-09-11）） |
| design_status | `APPROVED`（本文件数据库查询设计基线已批准；四份设计文档 DESIGN.md / API.md / UI.md / DATABASE.md 设计基线均已批准，见 DESIGN §1/§17；R2～R7 新增的 UI/DESIGN 固化内容已由 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001` 收口为 `APPROVED`（批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a`，批准日期 2026-09-10），不再为 `DRAFT_PENDING_USER_REVIEW`） |
| implementation_status | 分层记录：① 初始只读全栈实现已存在（`DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001`，已实现基于本设计的只读查询）；② 第二轮 UI 调整 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-002` 已进入 `5173`，实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`（与 Feature README §9 一致；2026-09-12 前历史状态为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`）；③ R2～R7 新视觉方案已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001`（2026-09-10）应用到 `5173`，`formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`（`formal_5173_code_review_status=APPROVED`；项目负责人 `5173` 人工页面检查结论 `project_owner_visual_review_status=CHANGES_REQUIRED`（查询控件交互问题，历史；已由本轮查询控件交互调整基线承接并解决），该基线已于 2026-09-10 批准收口为 `APPROVED`；本轮调整已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001` 于 2026-09-11 落地（结果提交 `a47988820c797ff60bd7244b2d0f899bd8fc3be5`），2026-09-11 时点为 ChatGPT 对该提交代码复审 `CHANGES_REQUIRED`、R1 修正任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1` 已完成修正、独立代码复审 `PENDING_CHATGPT_REVIEW`（历史）；2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 收口后，当前 `query_control_interaction_adjustment_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`、`query_control_interaction_adjustment_code_review_status=APPROVED`（ChatGPT 从远程 Git 复审 R1 修正实现提交 `edba7c891884d0f000a7c9edc196b2bffb95e0b0`；`2a9a271690bfdc68b16772268e84928a33abdeda` 仅为测试计数文档纠正）、`query_control_human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`、`project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER`；**数据库查询设计业务正文零变化**）；本轮查询下拉固定宽度基线（2026-09-11）为纯前端 popper 几何规则，已由 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001` 批准收口为 `popper_width_document_status=APPROVED`（批准内容基准提交 `f74dd725682b745f1b8ac6a1b9358eff10aaddc2`，批准日期 2026-09-11）（2026-09-11 时点历史分层状态：`popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、`popper_width_formal_code_review_status=CHANGES_REQUIRED`、`human_formal_5173_review_status=NOT_PASSED`、`pending_user_review=YES`）；2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 复审收口后，当前分层状态为 `popper_width_formal_code_review_status=APPROVED`、`human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`、`popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`、`pending_user_review=NO`、`pending_user_confirmation_count=0`，数据库查询设计业务正文继续零变化。**本基线固定宽度规则已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001`（2026-09-11）在 `5173` 正式前端落地**：仅改 Feature 私有 `DataSourceSnapshotQueryBar.vue` 与其 `.spec.ts`，为纯前端 popper 几何调整；**本文件三表投影、SQL、字段、主键、索引、约束、关联、排序与只读契约逐字节不变**，实现任务未连接数据库、未执行任何 SQL（无 DML/DDL/DCL）。该实现任务在 2026-09-11 的复审出口（历史）为 ChatGPT 从远程 Git 复审 `CHANGES_REQUIRED`，并触发 R2 支持边界修正（其文档已于 2026-09-12 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-R2-APPROVAL-001` 批准收口为 `popper_width_r2_document_status=APPROVED`，`chatgpt_r2_final_review_status=APPROVED`、`project_owner_r2_approval_status=APPROVED`、`supported_viewport_min_width_px=1280`、`sub_1280_formal_support_status=NOT_FORMALLY_SUPPORTED_DEFENSIVE_ONLY`、`ultra_narrow_formal_acceptance_requirement_status=WITHDRAWN_BY_APPROVED_R2`、`pending_user_review=NO`）；2026-09-12 前历史入口为 `CHATGPT_POPPER_WIDTH_IMPLEMENTATION_REREVIEW_AGAINST_APPROVED_R2_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`，2026-09-12 复审收口后统一下一入口更新为 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`（另立独立任务按已批准需求/设计/API/UI/DATABASE 与 `DSS-AC-001~107` 执行正式验收；本次复审收口不执行正式验收，该时点（2026-09-12 前历史）正式验收与人工正式 `5173` 验收当时仍 `NOT_RUN`、107 条验收当时全部保持 `NOT_RUN`））；当前统一下一入口为 `CHATGPT_FORMAL_ACCEPTANCE_R2_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_ACCEPTANCE_DECISION`（R1 执行与证据已由 ChatGPT 从远程 Git 复审 `APPROVED`；整体 Git 提交临时 `CHANGES_REQUIRED` 仅因 8 份入口文档残留旧状态，已由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R2` 修正）（正式验收已于 2026-09-12 执行，当前 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`（`acceptance_execution_status=PASS`、`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`、`formal_acceptance_pass_count=107`、`formal_acceptance_fail_count=0`、`formal_acceptance_blocked_count=0`、`formal_acceptance_not_run_count=0`、`human_visual_acceptance_status=NOT_RUN`）） |
| acceptance_execution_status | `PASS`（acceptance_execution_status=`PASS`、formal_acceptance_status=`EXECUTED_PENDING_CHATGPT_REVIEW`；正式验收已于 2026-09-12 由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` 对 `DSS-AC-001~107` 共 107 条执行（R0 对三张业务表零写入），并由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1`（2026-09-12）经项目负责人明确批准阶段 A `INSERT`/`DELETE` 完成 `DSS-AC-065` 定向补验（仅在 `CDC_DATA_SOURCE_RUN_STATE` 插入 7 条独立前缀临时行并全部按完整复合主键删除，三表逐字节恢复），最终结果 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`（R0 初始结果 `PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0`，唯一 `BLOCKED` 为 `DSS-AC-065`，已由 R1 补验通过）；`formal_acceptance_pass_count=107`、`formal_acceptance_blocked_count=0`、`formal_acceptance_not_run_count=0`。2026-09-12 执行前历史值：`NOT_RUN`、107 条全部 `NOT_RUN`、`acceptance_not_run_count=107`。本设计文件自身不执行验收；`5174` prototype 的测试/构建/浏览器验证不得写成正式验收 `PASS`；正式验收已执行不等于最终接受，须由 ChatGPT 从 Git 复核后由项目负责人作正式人工验收决定） |
| pending_user_confirmation_count | `0`（与 DESIGN.md §15.2 一致） |
| 设计任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001` |
| 创建日期 | 2026-09-05 |

> 状态同步说明（2026-09-10，`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001-R1`）：上表当前元数据已由设计固化/实现阶段更新为需求 83 条（`DSS-REQ-001~083`）、验收 95 条（`DSS-AC-001~095`）且全部 `NOT_RUN`，并按分层记录实现状态。**R2～R7 为纯前端视觉/交互呈现调整，本次元数据同步不改变 API/DATABASE 业务契约**——三表投影、只读边界、字段/主键/索引/约束、SQL 与查询语义、既有批准日期/批准内容基准均不变。

> 元数据同步说明（2026-09-11，`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001`）：本轮为**纯前端查询下拉弹层（popper）固定宽度规则**，属前端展示层。同步仅为组合计数（需求 87、验收 107，全部 `NOT_RUN`）与分层状态/下一入口；**数据库查询设计业务正文逐字节不变**——三表投影（`CDC_DATA_SOURCE_RUN_STATE` 保行驱动，`CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 仅补充展示）、SQL、字段、主键、索引、约束、关联、排序、查询语义与只读边界均不因本轮变化。该草案在建立时点为 `DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`（未批准、未在 `5173` 实现；**本条为草案建立时的历史记录**，该草案随后已于 2026-09-11 经 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001` 批准收口为 `APPROVED`，见下条批准同步记录）。

> 元数据同步说明（2026-09-12，`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001-R2`）：本轮为**纯文档事实一致性修订**——基于 ChatGPT 独立代码复审 `CHANGES_REQUIRED` 与 `240px` 视口证据，修正固定宽度基线的**正式支持视口下限为 `viewport width >= 1280px`**（`<1280px` 仅保留防御性收缩、不计入正式验收），并明确外层 `.el-popper` 与 Element Plus 内层 `.el-select-dropdown` 内联 `min-width` 的分层事实。同步仅为组合计数（需求 87、验收 107，全部 `NOT_RUN`）与分层状态（R2 文档 `DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`、实现代码复审 `CHANGES_REQUIRED`、人工视觉/交互复审 `NOT_PASSED`、`pending_user_review=YES`）/统一下一入口；**数据库查询设计业务正文逐字节不变**——三表投影、SQL、字段、主键、索引、约束、关联、排序、查询语义与只读边界均不因本轮变化。

> 元数据同步说明（2026-09-12，`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-R2-APPROVAL-001`，批准收口）：本 R2 支持边界修正文档已收口为 `popper_width_r2_document_status=APPROVED`（`chatgpt_r2_final_review_status=APPROVED`、`project_owner_r2_approval_status=APPROVED`，批准内容基准提交 `0666cd96f1f27784f6d77404bd8d4820dbd96013`，批准日期 2026-09-12；`supported_viewport_min_width_px=1280`、`sub_1280_formal_support_status=NOT_FORMALLY_SUPPORTED_DEFENSIVE_ONLY`、`ultra_narrow_formal_acceptance_requirement_status=WITHDRAWN_BY_APPROVED_R2`、`pending_user_review=NO`、`pending_user_confirmation_count=0`）；上一条 2026-09-12 R2 记录中的 `DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL` 为批准前历史状态、现已被本收口取代；统一下一入口为 `CHATGPT_POPPER_WIDTH_IMPLEMENTATION_REREVIEW_AGAINST_APPROVED_R2_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`；实现仍 `popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、代码复审仍 `popper_width_formal_code_review_status=CHANGES_REQUIRED`、正式验收仍 `NOT_RUN`（107 条全部 `NOT_RUN`）、人工视觉/交互复审 `NOT_PASSED`；**三表投影、SQL、字段、主键、索引、约束、关联、排序、查询语义与只读边界逐字节不变**。

> 复审收口同步说明（2026-09-12，`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-REVIEW-CLOSEOUT-001`）：本实现复审收口把当前分层状态更新为 `popper_width_formal_code_review_status=APPROVED`（ChatGPT 按已批准 R2 支持边界从远程 Git 重新复审 `e3c239230bbe854f0280a05f8151d30174fea110`）、`human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`（项目负责人 `5173` 人工检查“没有问题”）、`popper_width_formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`、`popper_width_r2_document_status=APPROVED`、`pending_user_review=NO`、`pending_user_confirmation_count=0`；上一条 2026-09-12 `...R2-APPROVAL-001` 记录中的实现代码复审 `CHANGES_REQUIRED`、人工视觉/交互复审 `NOT_PASSED` 及其 `CHATGPT_POPPER_WIDTH_IMPLEMENTATION_REREVIEW_AGAINST_APPROVED_R2_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW` 入口为**收口前历史状态**、现已被本记录取代。统一下一入口更新为 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`；正式验收仍 `NOT_RUN`（`DSS-AC-001~107` 共 107 条全部 `NOT_RUN`，`formal_acceptance_not_run_count=107`），本次复审收口**不执行正式验收**，未连接数据库、未执行任何 SQL。**三表投影、SQL、字段、主键、索引、约束、关联、排序、查询语义与只读边界逐字节不变**。

> 复审收口同步说明（2026-09-12，`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-IMPLEMENTATION-REVIEW-CLOSEOUT-001`）：把查询控件交互调整的当前分层状态收口为 `query_control_interaction_adjustment_status=APPROVED`、`query_control_interaction_adjustment_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE`、`query_control_interaction_adjustment_code_review_status=APPROVED`（ChatGPT 从远程 Git 独立复审 R1 修正实现提交 `edba7c891884d0f000a7c9edc196b2bffb95e0b0`；`2a9a271690bfdc68b16772268e84928a33abdeda` 仅为测试计数 `100→102` 文档纠正）、`query_control_human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`、`project_owner_visual_review_status=APPROVED_BY_PROJECT_OWNER`、`pending_user_review=NO`、`pending_user_confirmation_count=0`；上表中 2026-09-11 时点的查询控件独立代码复审 `PENDING_CHATGPT_REVIEW` 与 `CHANGES_REQUIRED` 为**收口前历史状态**、现已被本记录取代。统一下一入口保持为 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`；正式验收仍 `NOT_RUN`（`DSS-AC-001~107` 共 107 条全部 `NOT_RUN`，`formal_acceptance_not_run_count=107`），本次复审收口**不执行正式验收**，未连接数据库、未执行任何 SQL。**三表投影、SQL、字段、主键、索引、约束、关联、排序、查询语义与只读边界逐字节不变**。

## 2. 事实依据与本任务数据库边界

- **本文件是 Feature 查询设计，不是重新执行数据库复核。** 本任务**未连接数据库、未执行任何 SELECT/DML/DDL**；所有 `CDC_DATA_SOURCE_RUN_STATE` 物理事实一律以已提交只读复核报告为权威依据：

  ```text
  docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md
  ```

- 复核报告为 `PASS_WITH_FINDINGS`（2026-09-05）：对象/6 字段/约束/索引/数据特征均只读核验；F1~F5 为事实性观察。下文 §3/§11 引用其结论，**不复制数据库凭据、不输出连接串、不声称本任务重新验证了实时数据**。
- 数据对象归属：`CDC_DATA_SOURCE_RUN_STATE` 当前不在已批准 16 张单表物理基线内（复核报告 §5 归属口径），本 Feature 仅将其作为**只读监控查询对象**引入；本设计不提出任何 DDL、不加字段、不加索引、不改表。
- 本 Feature 只允许以下只读数据访问（DSS-REQ-015，DESIGN §11）：主表 `CDC_DATA_SOURCE_RUN_STATE`（驱动），只读关联 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`（仅补充展示与关联异常判断）。**不访问任何其他业务表。**

## 3. 涉及三张表的字段、类型、可空性、主键/关联键与用途

### 3.1 `CDC_DATA_SOURCE_RUN_STATE`（驱动主表，六字段，全量读取）

复核报告 §6 六字段（Oracle CDC Schema，普通表 VALID；`VARCHAR2` 为 BYTE 语义；复合主键 `PK_CDC_DS_RUN_STATE(CLIENT_ID, DATA_SOURCE_ID)`；非空 4 字段；无外键/触发器/状态封闭 Check）：

| 字段 | 类型 | 长度/CHAR | 可空 | 本设计用途 |
|---|---|---|---|---|
| `CLIENT_ID` | VARCHAR2 | 64 BYTE | N | 探针端原始 ID；展示、过滤、候选去重键、行键之一 |
| `DATA_SOURCE_ID` | VARCHAR2 | 64 BYTE | N | 源库原始 ID；展示、过滤、候选去重键、行键之一 |
| `SNAPSHOT_STATUS` | VARCHAR2 | 32 BYTE | N | 原始状态值；`classify` 输入；过滤/展示/候选共用（§5） |
| `SNAPSHOT_LAST_SEEN_AT` | DATE | 7 | Y | “快照启动时间”；可空→TO_CHAR 后可能为 null（§9） |
| `SNAPSHOT_COMPLETED_AT` | DATE | 7 | Y | “快照完成时间”；可空→null（§9） |
| `UPDATED_AT` | DATE | 7 | N | “记录更新时间”；排序键（§8）；**不作健康判据** |

- 语义：每行 = 一个“探针端（`CLIENT_ID`）＋源库（`DATA_SOURCE_ID`）”组合的初始快照状态记录（复合主键约束每组合最多一条）（DSS-REQ-006，AC-006/064；复核报告 §13）。
- 状态取值：已确认两个已知值 `SNAPSHOT_RUNNING`/`SNAPSHOT_COMPLETED`；但**数据库层只有 4 条 NOT NULL Check（SYS_C0041433~1436），无对状态取值的封闭 Check**（复核报告 F2、§7.1）——必须宽容未知值（DSS-REQ-037，AC-034）。

### 3.2 `CDC_CLIENT_MULTIPLE`（只读关联，仅以下必要安全投影）

| 字段 | 用途 |
|---|---|
| `CLIENT_ID` | 关联键（= RUN_STATE.CLIENT_ID） |
| `CLIENT_DESC` | 探针端描述（展示补充，可为 null） |
| `FG_ACTIVE` | 启用标志（`'1'`=启用；非 `'1'` 视为停用，见 §12） |

### 3.3 `CDC_DATA_SOURCE`（只读关联，仅以下必要安全投影，**绝不读 `DATA_SOURCE_PASSWORD`**）

| 字段 | 用途 |
|---|---|
| `DATA_SOURCE_ID` | 关联键（= RUN_STATE.DATA_SOURCE_ID） |
| `DATA_SOURCE_ORG` | 源库 ORG（展示，可为 null） |
| `DATA_SOURCE_CATEGORY` | 类别（`SOURCE`/其它；trim+upper 归一，见 §12；当前存小写 `source`，复核报告 F3） |
| `FG_ACTIVE` | 启用标志（`'1'`=启用） |

- 本设计**不读取任何密码/凭据/连接串类字段**；`CDC_DATA_SOURCE` 列清单中不存在、也绝不出现 `DATA_SOURCE_PASSWORD`（DSS-REQ-015、DESIGN §11、API §2，AC-010）。`DATA_SOURCE_CATEGORY` 归一在服务层做（DESIGN §5.6），数据库层不判断。

## 4. 主表驱动只读关联设计与保行证明

### 4.1 结论：三条独立全量只读 SELECT ＋ 服务层内存关联（等价保行 LEFT JOIN）

不写多表 `LEFT JOIN` SQL，而是**三次全量只读 + 服务层建索引关联**（DESIGN §5.1“全量读取→服务层处理”，topic-offset 同骨架），在结果上等价于以 RUN_STATE 为驱动的 LEFT JOIN，且保行性可显式证明：

- `DataSourceRunStateMapper.selectAll()`：固定只读 `@Select`，读取 RUN_STATE **全部行（无 WHERE）**——这是驱动数据集；
- `RunStateClientMapper.selectAll()`：读取 `CDC_CLIENT_MULTIPLE` 投影，服务层建 `CLIENT_ID → 行` 索引（`putIfAbsent`）；
- `RunStateDataSourceMapper.selectAll()`：读取 `CDC_DATA_SOURCE` 投影（无 PASSWORD），建 `DATA_SOURCE_ID → 行` 索引。

服务层对**每一条 RUN_STATE 行**做关联查找：命中则补充展示信息，未命中则该行的 `clientRef/sourceRef.state=NOT_FOUND`（DESIGN §5.6），**行必然保留**。

### 4.2 保行证明（为何不用 INNER JOIN/WHERE 过滤 RUN_STATE）

- 展示行集合恒 = `selectAll()` 的 RUN_STATE **全量行**；关联表查找结果**只补充字段、从不裁剪行**（DESIGN §6/§10）。
- 等价 LEFT JOIN 形式：`RUN_STATE LEFT JOIN CLIENT_MULTIPLE … LEFT JOIN DATA_SOURCE …`（无 WHERE 条件削行）；任一侧关联缺失时另一侧为 NULL，行保留。
- **禁止**：以 `INNER JOIN`、或在 SQL `WHERE` 中对关联表列加条件的方式书写（会把孤立 RUN_STATE 行滤掉，违反 DSS-REQ-015/019，AC-013/017）。本设计用“驱动全量读 + 内存关联”从结构上杜绝该风险。
- 不补行：无 RUN_STATE 记录的“探针端＋源库”组合不进入结果，绝不用两张配置表补出缺失行（DSS-REQ-016/017，AC-014/015）。

## 5. 状态分类逻辑（RUNNING / COMPLETED / UNKNOWN）

- 分类在**服务层 `classify(String raw)`**（DESIGN §5.5），统一用于展示/过滤/候选，三处共享同一函数保证语义一致：

| `SNAPSHOT_STATUS` 原始值 | `statusCategory` |
|---|---|
| `SNAPSHOT_RUNNING` | `RUNNING` |
| `SNAPSHOT_COMPLETED` | `COMPLETED` |
| 其它任意值 | `UNKNOWN` |

- 数据库层**不存在对状态取值的封闭 Check**（复核报告 F2/§7.1）；`SNAPSHOT_STATUS` 为 NOT NULL，因此无 NULL 分支（若出现 NULL——非约束事实外的不可能情形——宽容按 `UNKNOWN` 处理亦可，但正常不触发）。
- 分类是**只读推导**：不改写原值、不写库、不对任何状态判失败；未知值行保留并展示原始值（DSS-REQ-037/038/039，AC-034/035/037）。开发库当前仅 1 条 RUNNING 样例（复核报告 F1、§12），COMPLETED/未知场景需按 §13 受控构造（REQ-040，AC-036/065）。

## 6. 查询候选的全量来源、去重键、排序与当前筛选无关

- 候选由当次请求读取的 **RUN_STATE 全量行**（过滤之前）派生（DESIGN §6.1），**与当前筛选条件无关**：因为候选在过滤前计算，不会出现“筛到某状态后其它探针/源库候选消失”的收窄（DSS-REQ-024，AC-022）。
- 去重键与排序（服务层）：

| 候选 | 去重键 | 排序 |
|---|---|---|
| 探针端候选 | `CLIENT_ID`（一个探针可对应多源库） | `clientId` 升序 |
| 源库候选 | `DATA_SOURCE_ID`（一个源库可被多探针引用） | `org`（空值后置）→ `dataSourceId` 升序 |
| 状态候选 | —（枚举） | 恒 `[RUNNING, COMPLETED]`，仅在全量行存在未知状态时追加 `UNKNOWN` 在后 |

- 每项补充展示：探针端=配置 `CLIENT_DESC`/启停；源库=ORG/启停；均为展示补充、不改变候选集合（候选集合只看 RUN_STATE 是否出现该 ID）。

## 7. 多选过滤语义、参数安全与“全部”规则

- **过滤在服务层 Java 完成，无动态 SQL、无字符串拼接 SQL**：Mapper 恒为参数无关的固定只读 `SELECT`（§4.1），注入面从结构上为零（DESIGN §5.1、API §4，AC-023）。
- 语义（DESIGN §5.3）：每一维（`clientId`/`sourceId`/`status`）多值集合，命中任一为 OR、跨维为 AND；集合为空（=“全部”）不过滤；`status` token 命中判据复用 §5 `classify`（`UNKNOWN` 命中=非两已知原值）。
- 绑定参数方案：由于全量读取，无需把集合绑定进 SQL WHERE；若未来（规模变更时，见 §11）需要在 SQL 层下推，**必须使用 `#{}`/`<foreach>` 绑定参数**，禁止任何字符串拼接（本项目既有 MyBatis 动态 SQL 亦遵循该安全约束；本设计当前不采用）。
- 空集合/“全部”规则：参数缺失或归一为空 ⇒ 该维不筛选；“全部”不以哨兵值落库/落网（API §4.1）。
- 过滤只作用于 RUN_STATE 原始行；关联缺失/停用/类别异常的行**不会被过滤掉**（DSS-REQ-025，AC-023）。

## 8. 固定排序设计及 NULL 处理

- 排序在**服务层**完成（DESIGN §5.4）；`UPDATED_AT` 由 SQL `TO_CHAR` 输出固定宽度字符串 `YYYY-MM-DD HH24:MI:SS`，其字典序即时间序（无需解析日期）。
- 规则（DSS-REQ-046/047/048，AC-043/044/045）：
  1. 状态组排序键：`RUNNING=0`、`UNKNOWN=1`、`COMPLETED=2`（先运行中，再未知，后已完成）；
  2. 组内 `updatedAt` **倒序**；
  3. `updatedAt` 并列时 `clientId` 升序、再 `dataSourceId` 升序 → 全序确定可复现。
- NULL 处理：`UPDATED_AT` 非空，组内排序无 NULL 分支；为稳妥，Java 比较器对 null `updatedAt` 一律按“最小”处理并置于组内末尾（防御，正常不触发，DSS-REQ-033）。源库候选按 `org` 排序时空值（null）后置（§6）。

## 9. 三个 DATE 字段的读取与 API 格式化边界

- Mapper 用 Oracle `TO_CHAR(col,'YYYY-MM-DD HH24:MI:SS')` 把三个 DATE 字段**在 SQL 层确定性字符串化**（topic-offset 已验证做法，DESIGN §3.2/§5.7）；Java 层以 `String` 承载并**只透传、不重排**，避免 JVM 时区二次转换（DSS-REQ-055，AC-052）。
- `DATE` 本身无时区；显式格式串固定输出格式，展示文本即 `YYYY-MM-DD HH:mm:ss`。前端展示即为该文本，不再格式化成别的时区（API §2/§6，UI §4.5）。
- 可空两列：`SNAPSHOT_LAST_SEEN_AT`/`SNAPSHOT_COMPLETED_AT` 数据库 NULL ⇒ `TO_CHAR` 结果 NULL ⇒ Java `null` ⇒ JSON **显式 null**（`@JsonInclude(ALWAYS)`）⇒ UI `--`（DSS-REQ-031/032/055，AC-029/052）。
- **健康推断禁令**：任何一层不得依据 `UPDATED_AT` 或其它时间字段推断 sync-client 在线/健康/超时/离线；`SNAPSHOT_COMPLETED` 后记录通常不再更新，`UPDATED_AT` 停更是正常（DSS-REQ-010/056/057，AC-009/053/054；复核报告 F5）。长时间 RUNNING 行不因时长判错（AC-054）。

## 10. 只读 Mapper 的显式列清单（禁 `SELECT *`、禁读密码）

- 三个 Mapper 均为**纯注解 `@Select`、不继承 `BaseMapper`、无任何写方法**（天然无内置 CRUD），只暴露只读方法（DESIGN §4.2/§11，AC-010/049）。
- 显式列清单（设计建议 SQL，**待实现阶段**；本任务不创建代码）：

```sql
-- DataSourceRunStateMapper.selectAll()（无 WHERE，全量，驱动集）
SELECT CLIENT_ID                       AS clientId,
       DATA_SOURCE_ID                  AS dataSourceId,
       SNAPSHOT_STATUS                 AS snapshotStatus,
       TO_CHAR(SNAPSHOT_LAST_SEEN_AT, 'YYYY-MM-DD HH24:MI:SS')    AS snapshotLastSeenAt,
       TO_CHAR(SNAPSHOT_COMPLETED_AT, 'YYYY-MM-DD HH24:MI:SS')    AS snapshotCompletedAt,
       TO_CHAR(UPDATED_AT, 'YYYY-MM-DD HH24:MI:SS')               AS updatedAt
FROM CDC_DATA_SOURCE_RUN_STATE

-- RunStateClientMapper.selectAll()（仅必要投影）
SELECT CLIENT_ID     AS clientId,
       CLIENT_DESC   AS clientDesc,
       FG_ACTIVE     AS fgActive
FROM CDC_CLIENT_MULTIPLE

-- RunStateDataSourceMapper.selectAll()（仅必要安全投影；不含任何密码列）
SELECT DATA_SOURCE_ID        AS dataSourceId,
       DATA_SOURCE_ORG       AS dataSourceOrg,
       DATA_SOURCE_CATEGORY  AS dataSourceCategory,
       FG_ACTIVE             AS fgActive
FROM CDC_DATA_SOURCE
```

- 禁止 `SELECT *`；`RunStateDataSourceMapper` 列清单**绝不包含** `DATA_SOURCE_PASSWORD`（DSS-REQ-015，AC-010，DESIGN §11）。Row 映射模型（`DataSourceRunStateRow`/`RunStateClientRow`/`RunStateDataSourceRow`）仅含上述列（DESIGN §4.2）。

## 11. 性能判断：约 100 行、不分页，无需新增索引

- 规模假设：生产最多约 100 条记录，一次全量加载、不分页（DSS-REQ-020/021，AC-018；复核报告当前开发库仅 1 行）。
- 全表扫描成本对 ≤ ~100 行可忽略：一次 `selectAll()` 全量读 + 内存过滤/排序即为最优简单方案（DESIGN §5.1/§13）。
- **结论：无需新增索引，本设计不提出任何 DDL**（包括 `CREATE/ALTER/DROP/COMMENT`）。现有唯一索引 `PK_CDC_DS_RUN_STATE(CLIENT_ID, DATA_SOURCE_ID)` 已满足唯一与全量读场景（复核报告 §7.2）。
- 若未来规模假设被突破（千行级以上），应先重新评审设计（DESIGN §13），**未经授权不得自行改表或加索引**（DSS-REQ-065 ⑥ 禁 DDL 精神同样适用于产品只读侧）。

## 12. 数据现状、异常兼容与脱敏日志边界

- 当前数据样本（复核报告 F1/F3/§8）：仅 1 条 `SNAPSHOT_RUNNING`（`hosp-012`+`112-source-19c`），`SNAPSHOT_COMPLETED_AT` 为 NULL，无 COMPLETED 天然样例，无未知值样例；关联均启用、无孤立记录；源库类别当前存小写 `source`。**这些是观察事实，不是数据库强约束**（REQ-040，AC-036）。
- 宽容处理（不改行、不抛错、不丢行，DESIGN §10/§5.6）：
  - 未知 `SNAPSHOT_STATUS` → `UNKNOWN`，行保留；
  - 关联 `FG_ACTIVE` 非 `'1'`（含 `'0'` 或异常值）→ 视为停用（`state=INACTIVE`）；对“非 `'1'` 亦非 `'0'`”的畸形值同样宽容为停用；
  - `DATA_SOURCE_CATEGORY`：服务层 `trim().toUpperCase()` 后等于 `SOURCE` 视为正常源库；等于 `TARGET`、空/畸形或其它值 ⇒ `sourceRole=false` 并加“类别非 SOURCE”轻提示，**行保留**（DSS-REQ-044，AC-041）；当前小写 `source` 经归一后正常（F3）。
  - `CLIENT_ID`/`DATA_SOURCE_ID` 按原始值精确匹配（去空白不做、大小写不改），与数据库 BYTE 语义一致；候选去重同键。
- 脱敏日志边界：查询日志不得输出行明细、密码或无关敏感字段；失败信息与日志只含收敛、脱敏内容（DSS-REQ-064，AC-062）；错误响应经 API §8 脱敏。

## 13. 产品只读契约与未来测试 DML 授权严格分离

1. **产品代码永远只读**：最终交付的 `cdc-config` 对 `CDC_DATA_SOURCE_RUN_STATE` 只执行 `SELECT`；本设计/实现不含、也不得含对该表或两张关联表的 `INSERT/UPDATE/DELETE/MERGE`，以及任何 DDL（DSS-REQ-011/012/013，AC-010/012；DESIGN §11）。
2. **未来测试 DML 授权的边界（`DSS-REQ-065`，AC-063/065）**：仅当**后续**测试/验收任务的提示词显式纳入该授权时，Agent 才可对**开发库** `CDC_DATA_SOURCE_RUN_STATE` 执行受控 `INSERT/UPDATE/DELETE` 用于构造场景（如 COMPLETED、未知状态、孤立探针/源库），并满足：操作前完整备份原始数据、操作后恢复到任务开始前状态且逐行一致核验、报告记录目的/范围/备份/恢复证据；**不授权** `TRUNCATE/ALTER/DROP` 或其它 DDL、**不授权**操作 `CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 或其它表、**不授权**生产库。
3. **本设计任务没有该 DML 授权**：本任务未连接数据库、未执行任何 SELECT/DML/DDL；§13.2 只是为后续测试任务预置的授权边界记录，不是本任务的执行授权。
4. 复核报告中“测试数据构造不改变两张关联表、引用既有只读关联配置”的约束同步适用（复核报告 §13/ACCEPTANCE §4.16，AC-065）。

## 14. 数据库设计与需求/验收映射

| 本文件设计要素 | 主要承担需求 | 主要承担验收 |
|---|---|---|
| §3 三表字段/键/可空性/安全投影（含禁读密码） | REQ-006/015/044 | AC-006/010/041/064 |
| §4 主表驱动只读关联与保行、不补行 | REQ-014/015/016/017/019 | AC-013/014/015/017 |
| §5 状态分类（宽容未知、无封闭 Check） | REQ-035/036/037 | AC-032/033/034/035/037 |
| §6 候选全量来源/去重/与筛选无关 | REQ-016/024 | AC-022 |
| §7 过滤语义与“全部”、无动态 SQL 拼接 | REQ-025 | AC-023 |
| §8 固定确定性排序与 NULL 规则 | REQ-046/047/048 | AC-043/044/045 |
| §9 DATE 读取 TO_CHAR 透传、时区边界、不推断健康 | REQ-010/055/056/057 | AC-009/030/052/053/054 |
| §10 只读 Mapper 显式列、禁 SELECT */禁读密码 | REQ-011/013 | AC-010/049 |
| §11 约 100 行不分页、无需索引、禁 DDL | REQ-020/021 | AC-018 |
| §12 数据现状与异常宽容、脱敏日志 | REQ-040/044/064 | AC-036/041/062 |
| §13 产品只读 vs 测试 DML 授权分离 | REQ-011/065 | AC-010/012/063/065 |

> 一致性：本文件与 DESIGN.md/API.md/UI.md 统一使用接口 `GET /api/monitor/data-source-run-state/list`、字段/枚举/原始值、时间格式与显式 null、映射状态、错误码与刷新状态机（DESIGN §14.1）。本文件不输出数据库凭据、不声称重新验证实时数据；待确认设计项为 0。

> 实现记录（2026-09-06）：本文件仅同步实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001` 完成后的元数据 `implementation_status` 为 `IMPLEMENTED_PENDING_REVIEW`；本查询设计（三表投影/保行/分类/排序/只读契约）相对设计批准内容基准 `61117a62...` **业务内容零差异**。本实现任务仅以批准只读方式访问 `CDC_DATA_SOURCE_RUN_STATE`/`CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE`（开发验证用只读 SELECT/浏览器联调），未执行任何 DML/DDL；完整实现与数据库只读证据见实现报告与 `evidence/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001/`。

> 元数据同步记录（2026-09-10，`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-001-R1`）：本文件仅把 §1 顶部**当前**状态元数据由旧时点的“需求 65 条 / 验收 68 条 / `IMPLEMENTED_PENDING_REVIEW`”同步为当前口径——需求 `DSS-REQ-001~083` 共 **83 条**（`DSS-REQ-001~075` 已批准基线、`DSS-REQ-076~083` R2～R7 设计固化新增且 `DRAFT_PENDING_USER_REVIEW`）、验收 `DSS-AC-001~095` 共 **95 条全部 `NOT_RUN`**（`acceptance_not_run_count=95`）、实现状态分层记录（初始只读实现已存在、第二轮 UI 调整已进 `5173` 为 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、R2～R7 为 `PENDING_FORMAL_IMPLEMENTATION_ON_5173`）、正式验收 `NOT_RUN`。**SQL、表结构、字段、主键、索引、约束、查询语义、关联逻辑、只读边界、脱敏日志规则与 §14 映射表全部零变化**；本文件设计基线自身仍为 `APPROVED`（批准日期 2026-09-06）不变；历史记录中的时点计数（如 65/68）保留为历史。**R2～R7 为纯前端视觉/交互呈现调整，本次元数据同步不改变 DATABASE 业务契约。** 下一入口为 ChatGPT 从 Git 重新复审。

> 批准收口记录（2026-09-10，`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-DESIGN-FREEZE-APPROVAL-001`）：ChatGPT 已从 Git 对批准内容基准提交 `e67b2ecc3897c3e83597126e259ee4c19349a66a` 完成最终复审 `APPROVED`，项目负责人于 2026-09-10 明确回复“批准”。据此把 §1 当前状态元数据由 `APPROVED_BASELINE_WITH_DRAFT_PROTOTYPE_EXTENSION_PENDING_USER_REVIEW` 收口为 `APPROVED`——`DSS-REQ-001~083` 共 **83 条**全部纳入当前批准需求基线、`DSS-AC-001~095` 共 **95 条**全部纳入当前批准验收基线且全部保持 `NOT_RUN`；本文件数据库查询设计基线自身继续为 `APPROVED`。**本记录取代此前“等待 ChatGPT 复审与项目负责人批准”的当前入口**；R1 历史记录中当时的 draft/待批准语境保留为历史，不回写。SQL、表结构、字段、主键、索引、约束、查询语义、关联逻辑、只读边界、脱敏日志规则与 §14 映射表**全部零变化**；分层实现状态不变（既有只读实现已存在、第二轮 UI 调整已进 `5173`、R2～R7 仍 `PENDING_FORMAL_IMPLEMENTATION_ON_5173`）；正式验收继续 `NOT_RUN`。下一入口为独立正式实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001`。

> 实现状态元数据同步记录（2026-09-10，`DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001`）：本文件仅同步 §1 顶部**当前**实现状态元数据第 ③ 项——R2～R7 视觉方案已由该实现任务应用到 `5173` 正式前端，`formal_5173_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、`browser_verification_status=DEV_SELF_TEST_DONE`、`formal_acceptance_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`、`acceptance_not_run_count=95`。**SQL、表结构、字段、主键、索引、约束、查询语义、关联逻辑、只读边界、脱敏日志规则与 §14 映射表全部零变化**；后端源码、数据库契约零变化（`database_contract_change_status=NONE`）；本文件设计基线自身继续为 `APPROVED`（批准日期 2026-09-06）。本实现任务对数据库为**只读**：后端链路全程仅 `SELECT`，未手工执行任何 DML/DDL，本 Feature 业务表未被写入（`feature_business_table_write_status=ZERO`、`manual_database_write_status=ZERO`）。

> 批准同步记录（2026-09-10，`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-APPROVAL-001`）：查询控件交互调整基线已经 ChatGPT 对批准内容基准提交 `cf9f9eb0240f275cd50eb37546e6d6256892a9f4` 最终复审 `APPROVED`、项目负责人 2026-09-10 明确回复“批准”，据此仅把 §1 顶部**当前**组合元数据同步为 `DSS-REQ-001~086` 共 **86 条**、`DSS-AC-001~103` 共 **103 条全部保持 `NOT_RUN`**（`acceptance_not_run_count=103`），并对齐分层状态（`formal_5173_code_review_status=APPROVED`、`project_owner_visual_review_status=CHANGES_REQUIRED`、查询控件交互调整基线 `query_control_interaction_adjustment_status=APPROVED`、`query_control_interaction_adjustment_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`、`formal_acceptance_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`、`pending_user_review=NO`、`pending_user_confirmation_count=0`）。新增 `DSS-REQ-084~086`／`DSS-AC-096~103` 为纯前端查询控件展示与交互规则，**不改变三表投影、SQL、字段、主键、索引、约束、关联、排序与只读边界**（`database_contract_change_status=NONE`）；本文件设计基线自身继续为 `APPROVED`（批准日期 2026-09-06）。下一入口为独立正式实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001`。

> R1 修正同步记录（2026-09-11，`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1`）：查询控件交互调整实现结果提交 `a47988820c797ff60bd7244b2d0f899bd8fc3be5` 经 ChatGPT 独立代码复审结论 `CHANGES_REQUIRED`；R1 修正任务在同一隔离 worktree（`/agent/dss-query-ctl-impl-001-r1`，基准提交 `a479888...`）完成五类复审问题修正（① `CLIENT_DESC` Tooltip 改按原始完整 `CLIENT_ID` 稳定身份定位、删除以截断/组合显示文字反查探针的实现；② 四字段统一“`null` 安全归一 → `trim()` → Unicode 码点计数 → `<= 20` 原文 / `> 20` 前 20 码点＋ASCII `...`”；③ Tooltip 内容为 trim 后完整 `CLIENT_DESC`；④ 补交 Git 可独立复核的原始测试/构建 `.txt` 日志；⑤ 消解 `1280` 响应式文档冲突）。本文件仅把 §1 顶部**当前**实现状态元数据第 ③ 项同步为“本轮调整已由实现任务于 2026-09-11 落地、ChatGPT 复审 `CHANGES_REQUIRED`、R1 已完成修正、待 ChatGPT 从 Git 复审 R1，随后由项目负责人进行视觉/交互复审”。**三表投影、SQL、字段、主键、索引、约束、关联、排序与只读边界全部零变化**（`database_contract_change_status=NONE`）；本 Feature 业务表未被写入（`manual_database_write_status=ZERO`）；本文件设计基线自身继续为 `APPROVED`（批准日期 2026-09-06）；正式验收继续 `NOT_RUN`。下一入口为 `CHATGPT_R1_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`。

> 批准同步记录（2026-09-11，`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001`）：查询下拉固定宽度基线已经 ChatGPT 从远程 Git 对批准内容基准提交 `f74dd725682b745f1b8ac6a1b9358eff10aaddc2` 最终复审 `APPROVED`、项目负责人 2026-09-11 明确回复“批准”，据此仅把 §1 顶部**当前**组合元数据同步为 `DSS-REQ-001~087` 共 **87 条**、`DSS-AC-001~107` 共 **107 条全部保持 `NOT_RUN`**（`acceptance_not_run_count=107`），并对齐分层状态（`prototype_width_decision_status=APPROVED_BY_PROJECT_OWNER`、`popper_width_document_status=APPROVED`、`popper_width_formal_5173_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`、`popper_width_formal_code_review_status=NOT_RUN`、`formal_acceptance_status=NOT_RUN`、`human_formal_5173_review_status=NOT_RUN_FOR_THIS_ADJUSTMENT`、`pending_user_review=NO`、`pending_user_confirmation_count=0`）。新增 `DSS-REQ-087`／`DSS-AC-104~107` 为纯前端 popper 几何规则，**不改变三表投影（`CDC_DATA_SOURCE_RUN_STATE` 保行驱动，`CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 仅补充展示）、SQL、字段、主键、索引、约束、关联、排序与只读边界**（`database_contract_change_status=NONE`）；本文件设计基线自身继续为 `APPROVED`（批准日期 2026-09-06）。下一入口为独立正式实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001`（本批准收口任务不直接实现，不得开始 `5173` 实现或正式验收）；本轮未在 `5173` 实现、正式验收未执行。

> R1 复审修正同步记录（2026-09-11，`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-APPROVAL-001-R1`）：批准收口结果提交 `5649a8a8040b67bec0dc23b10596281cd5706bb3` 经 ChatGPT 从远程 Git 独立复审结论 `CHANGES_REQUIRED`——批准结论、数据库查询设计业务正文与业务边界均无问题，唯一缺陷为四份核心文档 §1 当前元数据对原草案任务性质缺少历史限定。R1 极小修正任务（纯文档）仅把该行改为历史限定表述，并把“当前下一入口”统一为 `CHATGPT_POPPER_WIDTH_BASELINE_APPROVAL_R1_REVIEW_FROM_GIT_THEN_FORMAL_IMPLEMENTATION`；本文件仅同步该当前下一入口，**三表投影（`CDC_DATA_SOURCE_RUN_STATE` 保行驱动，`CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 仅补充展示）、SQL、字段、主键、索引、约束、关联、排序与只读边界全部零变化**（`database_contract_change_status=NONE`）；本 Feature 业务表未被写入（`manual_database_write_status=ZERO`）；本文件设计基线自身继续为 `APPROVED`（批准日期 2026-09-06）；正式验收仍 `NOT_RUN`（`DSS-AC-001~107` 共 107 条全部 `NOT_RUN`、`acceptance_not_run_count=107`）；本轮 popper 固定宽度规则未在 `5173` 实现；不撤销项目负责人批准、不重新批准业务内容。

> 正式验收执行同步记录（2026-09-12，`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`）：本 Feature 已由该独立任务按已批准需求/设计/UI/API/DATABASE 与 `DSS-AC-001~107` 全部 107 条执行正式验收，结果 `PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0 = 107`，唯一 `BLOCKED` 为 `DSS-AC-065`（受控测试数据需人工 `INSERT/UPDATE/DELETE/MERGE`，本任务 `§6.2` 明确不授权且无充分替代证据）。本文件仅同步 §1 顶部**当前**正式验收执行状态、结果计数与下一入口，并追加本条变更记录：`formal_acceptance_status=PARTIALLY_EXECUTED_BLOCKED`、`acceptance_execution_status=BLOCKED`、`formal_acceptance_executed_count=106`、`formal_acceptance_blocked_count=1`、`formal_acceptance_not_run_count=0`（2026-09-12 前历史值为 `NOT_RUN`/107）；`human_visual_acceptance_status` 仍为 `NOT_RUN`。**数据库查询设计业务零变化**：三表投影（`CDC_DATA_SOURCE_RUN_STATE` 保行驱动，`CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 仅补充展示）、SQL、字段、主键、索引、约束、关联、排序与只读边界**全部逐字节不变**（`database_contract_change_status=NONE`）；本次正式验收对三张业务表**零写入**（执行前后只读快照对照 + 运行时 SQL 分类审计 `write_statement_count=0`，三表 `SELECT=23 WRITE=0`），未执行任何人工 DML/DDL/DCL；`REQUIREMENTS.md` 需求 87、`ACCEPTANCE.md` 验收 107 业务行（除“状态”列）与追踪 87/87、107/107 均逐字节不变；`frontend/`/`backend/`/SQL/配置/测试代码零改动。**正式验收已执行不等于最终接受**：本文件设计基线自身继续为 `APPROVED`（批准日期 2026-09-06），不构成 `IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/Feature 完成；下一入口统一为 `CHATGPT_FORMAL_ACCEPTANCE_REVIEW_FROM_GIT_THEN_TARGETED_COMPLETION_TASK`（报告见 `reports/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001.md`）。

> R1 定向补验同步记录（2026-09-12，`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1`）：本 Feature 已由该独立任务完成 R0 唯一 `BLOCKED` 用例 `DSS-AC-065` 的定向补验，并纠正 R0 报告两项事实（`git diff --check` 非零仅来自保留的 R0 原始逐字日志行尾空白；ZooKeeper 分层事实）。项目负责人 2026-09-12 明确总体授权、并在完整展示阶段 A SQL 后明确回复“批准执行上述 SQL”；补验按已批准 SQL 仅在开发库 `CDC` 唯一业务表 `CDC_DATA_SOURCE_RUN_STATE` 插入 7 条带独立前缀 `dss-fa065-r1-` 的临时行（`COMMIT`），未对 `CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 或其它表写入、未执行 `UPDATE`/`MERGE`/DDL/`TRUNCATE`/匿名 PL/SQL/存储过程、未创建备份表；随后按 §8.3 以完整复合主键 `DELETE` 全部 7 条并 `COMMIT`，三表与任务前**逐字节一致**、任务前缀残留 `0`、内容摘要与主键集合摘要一致（`restore-verify`）。最终正式验收结果 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`。本文件仅同步 §1 顶部**当前**正式验收执行状态、结果计数与下一入口，并追加本条变更记录：`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`、`acceptance_execution_status=PASS`、`formal_acceptance_pass_count=107`、`formal_acceptance_blocked_count=0`、`formal_acceptance_not_run_count=0`（2026-09-12 前历史值为 `NOT_RUN`/107）；`human_visual_acceptance_status` 仍为 `NOT_RUN`。**数据库查询设计业务零变化**：三表投影（`CDC_DATA_SOURCE_RUN_STATE` 保行驱动，`CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 仅补充展示）、SQL、字段、主键、索引、约束、关联、排序与只读边界**全部逐字节不变**（`database_contract_change_status=NONE`）；R1 对 `CDC_DATA_SOURCE_RUN_STATE` 的临时 DML 全部经人工批准并逐行恢复、对另两张业务表**零写入**（运行期 SQL 分类审计 `write_statement_count=0`）；`REQUIREMENTS.md` 需求 87、`ACCEPTANCE.md` 验收 107 业务行（除“状态”列）与追踪 87/87、107/107 均逐字节不变；`frontend/`/`backend/`/SQL/配置/测试代码零改动。**正式验收已执行不等于最终接受**：本文件设计基线自身继续为 `APPROVED`（批准日期 2026-09-06），不构成 `IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/Feature 完成；下一入口统一为 `CHATGPT_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_ACCEPTANCE_DECISION`（报告见 `reports/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1.md`）。

> R2 文档当前状态一致性纠正记录（2026-09-12，`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R2`）：本任务为**纯文档当前状态一致性纠正**。ChatGPT 从远程 Git 复审 R1 结果提交 `bf5f1b54a3abf54ea1d5ea1e1a9ed72cf39b7f7b`：R1 的验收执行与证据结论 `APPROVED`；整体 Git 提交复审临时为 `CHANGES_REQUIRED`，唯一问题类别为 8 份入口文档仍残留非历史的旧 `NOT_RUN`、旧计数与旧下一入口，与已写入的当前事实 `PASS 107` 相矛盾。统一当前验收事实：`PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`、`acceptance_execution_status=PASS`、`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`、`formal_acceptance_not_run_count=0`；验收基线批准状态仍 `acceptance_status=APPROVED`；`human_visual_acceptance_status=NOT_RUN` 予以保留。统一下一入口：`CHATGPT_FORMAL_ACCEPTANCE_R2_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_ACCEPTANCE_DECISION`（历史入口 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`、`CHATGPT_FORMAL_ACCEPTANCE_REVIEW_FROM_GIT_THEN_TARGETED_COMPLETION_TASK`、`CHATGPT_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_ACCEPTANCE_DECISION` 均已处理完毕，仅作历史保留；本文件上一条 R1 记录末尾所载的 R1 复审入口即为该已处理完毕的历史入口）。本文件仅修改 §1 `acceptance_status`、`implementation_status` 的当前状态/当前下一入口表述并追加本条记录。**数据库查询设计业务逐字节不变**——三表投影（`CDC_DATA_SOURCE_RUN_STATE` 保行驱动，`CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 仅补充展示）、SQL、字段、主键、索引、约束、关联、排序、查询语义与只读边界均零变化（`database_contract_change_status=NONE`）；`frontend/`/`backend/`/SQL/配置/测试代码/验收证据零改动。**不作最终接受收口**：不构成 `IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/Feature 完成，不修改 `human_visual_acceptance_status=NOT_RUN`，不重跑正式验收。
