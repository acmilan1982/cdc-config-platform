# 列表表格视觉模板 · 迁移盘点（已批准基线）

```text
list_table_visual_template_document_status=APPROVED
list_table_visual_template_design_status=BASELINE_APPROVED
chatgpt_remote_r1_review_status=REVIEW_PASS
blocking_finding_count=0
project_owner_approval_status=APPROVED
project_owner_approval_date=2026-09-21
approval_scope=BASELINE_CONTENT_ONLY
approved_baseline_source_commit=575379895c4c57fd3df7e0d0ce27c1f6841d2f17
shared_implementation_design_status=APPROVED
shared_implementation_design_approval_status=APPROVED
shared_implementation_status=IMPLEMENTED_ACCEPTED
reference_page_integration_status=IMPLEMENTED_ACCEPTED
project_owner_visual_review_status=PASS
project_owner_visual_review_date=2026-09-22
formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL
formal_acceptance_pass_count=14
formal_acceptance_fail_count=0
formal_acceptance_blocked_count=0
formal_acceptance_not_run_count=0
chatgpt_remote_formal_acceptance_review_status=REVIEW_PASS
chatgpt_remote_formal_acceptance_review_blocking_finding_count=0
chatgpt_remote_formal_acceptance_reviewed_commit=8501416e750c7eb8547c7f922b1bed3545c7cb17
shared_implementation_project_owner_acceptance_status=APPROVED
final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER
shared_implementation_completion_status=COMPLETED
project_owner_final_acceptance_decision=APPROVED
project_owner_final_acceptance_date=2026-09-22
pending_project_owner_acceptance=NO
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
candidate_inventory_status=COMPLETED_APPROVED_AS_BASELINE_INVENTORY
final_acceptance_scope=SHARED_IMPLEMENTATION_AND_DATA_SOURCE_REFERENCE_PAGE_INTEGRATION_ONLY
current_next_entry=NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED
```

批准证据链（详细设计）：

```text
R0 设计提交=d7ae5af54e62bba20373681f9f55fc7fb67f39a7
R1 定向修订提交=f8d84657e939a4b02316457b543976a847b0775b
R2 定向修订提交=e72264de14a9483aae5593435f818ea65c5116e0
ChatGPT 远程 R2 复审=REVIEW_PASS
blocking_finding_count=0
项目负责人详细设计批准日期=2026-09-21
详细设计批准范围=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY
```

> 本文档产出**候选盘点与评估结果**，该盘点已作为**基线盘点结果**随基线内容一并批准；
> 但批准的是**盘点事实与边界规则**，**不**授权、**不**实施任何迁移。
> 公共实现与数据源管理参考页接入随后已由独立实施任务落地，
> 经项目负责人于 2026-09-22 目测通过，并通过本地正式验收
> （`project_owner_visual_review_status=PASS`，
> `formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`），
> 再由项目负责人于 2026-09-22 **最终接受并关闭**
> （`shared_implementation_status=IMPLEMENTED_ACCEPTED`、
> `reference_page_integration_status=IMPLEMENTED_ACCEPTED`，
> `final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`）；
> 本次最终接受范围**仅限**公共实现与数据源管理参考页等价接入，
> **不**代表批准探针端管理、数据订阅或其他任何业务页面迁移；
> `page_migration_status=NOT_STARTED`、
> `page_migration_authorization_status=NOT_GRANTED`
> 在本轮**未改变**。

基准提交：`10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e`

## 1. 盘点方法（可复现）

`LIST_TABLE_REFERENCE_FACT` —— 盘点命令与口径：

```bash
grep -rnP '<el-table(?![-_])' frontend/src --include=*.vue
```

- 使用**负向先行断言** `(?![-_])` 排除 `el-table-column` 与 `el-table__*`，
  从而不会把列/内部结构类误计为表格；
- 该正则同样匹配**行尾的 `<el-table`**（多行开标签，
  例如 `<el-table` 换行后接 `:data=...`），因此**不遗漏**多行写法。

实测结果：**15 个 `el-table` 使用点，分布在 14 个 `.vue` 文件**。
（`DataSourcePage.vue` 一个文件含 2 个使用点：主表 + 命名策略弹窗表。）

## 2. 全量盘点矩阵

| # | 路由 | 页面 / 组件文件 | 表格类型 | 只读/写 | 固定行高 | 复杂标签 | 选中态 | 异常态 | 分页 | 固定列 | Tooltip | 候选分类 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `/config/data-source` | `views/data-source/DataSourcePage.vue` `class="data-table"` | **页面主列表** | 写（新增/编辑/删除/双击编辑） | 无（内容驱动） | 有：`el-tag` 角色、停用/异常胶囊、等宽加粗 ID | 无 | 有：停用 `#fee2e2` / 异常 `#fef3c7` 胶囊 | 无 | 有：操作列 `fixed="right"` | 有：列级 `show-overflow-tooltip` | `REFERENCE_PAGE` |
| 2 | `/config/data-source`（弹窗内） | `views/data-source/DataSourcePage.vue` `class="naming-table"` | **弹窗表格** | 写（编辑/删除命名策略） | 无（`max-height:300`） | 有：`el-tag` 策略 | 无 | 无 | 无 | 有：操作列 `fixed="right"` | 有：列级 `show-overflow-tooltip` | `EXCLUDED_NON_MAIN_TABLE` |
| 3 | `/config/client` | `views/client-config/ClientConfigPage.vue` `class="cc-table"` | **页面主列表** | 写（新增/批量删除/双击） | **有：`height:60px`** | 有：状态列 | **有**：选中 `#ecf5ff` + `inset 3px 0 0`；批量工具栏 | 无 | 无 | 无 | 无（`@row-click`/`@row-dblclick`） | `CANDIDATE_HIGH` |
| 4 | `/config/subscribe` | `views/data-subscribe/DataSubscribePage.vue` | **页面主列表** | 写（查看/编辑/删除） | 无 | 无 | 无 | 无 | 无 | 有：操作列 `fixed="right"` | 有：单元格 `el-tooltip` | `CANDIDATE_HIGH` |
| 5 | `/config/server` | `views/server-config/ServerConfigPage.vue` `class="config-table"`（在 `el-card` 内） | **页面主列表** | 写（行内编辑 + 卡片保存） | 无 | 无 | 无 | 无 | 无 | 无 | 无（列内嵌 `ConfigValueEditor`） | `CANDIDATE_MEDIUM` |
| 6 | `/config/server`（对话框内） | `views/server-config/SaveConfirmDialog.vue` `class="confirm-table"` | **确认表格** | 写前确认（无写 API） | 无（`size="small" border`） | 无 | 无 | 无 | 无 | 无 | 无 | `EXCLUDED_NON_MAIN_TABLE` |
| 7 | `/monitor/cdc-node` | `components/monitor/ClientCard.vue`（玻璃拟态卡片内嵌表） | **大屏/复合视图内嵌表** | 只读 | 无（`.scrollable` `max-height:360px`） | 有：卡片状态 | 无 | 无 | 无 | 无 | 有 | `EXCLUDED_NON_MAIN_TABLE` |
| 8 | `/monitor/data-source-state` | `views/data-source-run-state/components/DataSourceSnapshotTable.vue` `class="dss-table"` | **页面主列表** | 只读 | 无 | 有：状态标签、等宽 ID、序号 | 无 | 有：`UNKNOWN` 行琥珀底 | 无 | 无 | 有：单实例 Tooltip（`useSnapshotTooltip`） | `CANDIDATE_HIGH` |
| 9 | `/monitor/topic-offset` | `views/topic-offset/components/OffsetTable.vue` `class="toff-table"` | **页面主列表** | 只读 | 无 | 有：序号、同步对象 | 无 | 无 | 有 | **有：左 `fixed` 序号/同步对象；右 fixed 数值列** | 有：自定义单实例 `.toff-tip` | `CANDIDATE_HIGH` |
| 10 | `/monitor/log-query` | `views/log-query/components/LogQueryTable.vue` | **页面主列表** | 只读 | 无（`size="small" border height="100%"`） | 无 | 无 | 无 | 有 | **有：左 `fixed` 源库/源表名；右 fixed 操作列** | 有：单元格 `el-tooltip` | `CANDIDATE_MEDIUM` |
| 11 | `/monitor/job-failure` | `views/monitor/job-failure/index.vue`（`v-for` 卡片内嵌表） | **大屏/复合视图内嵌表** | 只读 | 无（`size="small" border`） | 有：卡片内表 | 无 | 无 | 无 | 无 | 无 | `EXCLUDED_NON_MAIN_TABLE` |
| 12 | `/monitor/job-failure/history` | `views/monitor/job-failure/history.vue`（`v-for` 卡片内嵌表） | **大屏/复合视图内嵌表** | 只读 | 无（`size="small" border`） | 有 | 无 | 无 | 无 | 无 | 无 | `EXCLUDED_NON_MAIN_TABLE` |
| 13 | `/monitor/job-failure/history/list` | `views/monitor/job-failure/history-list.vue` | **页面主列表**（下钻列表） | 只读 | 无（`size="small" border`） | 无 | 无 | 无 | 有 | 无 | 无 | `CANDIDATE_MEDIUM` |
| 14 | `/monitor/job-failure/detail`（使用两次） | `views/monitor/job-failure/components/FailureEventList.vue` | **详情子表** | 只读 | 无（`size="small" border`） | 有：`.cell-code` 等宽代码 | 无 | 无 | 无 | 无 | 有：单元格 `el-tooltip` | `EXCLUDED_NON_MAIN_TABLE` |
| 15 | 无（**未被任何页面引用**） | `views/monitor/job-failure/components/JobFailureSummaryTable.vue` | **未使用组件** | 只读 | 无（`size="small" border`） | 无 | 无 | 无 | 无 | 有：操作列 `fixed="right"` | 无 | `NEEDS_SEPARATE_EVALUATION` |

### 2.1 候选分类定义

```text
REFERENCE_PAGE             本模板的主要参考实现（数据源管理主列表）
CANDIDATE_HIGH             形态与参考实现最接近、视觉收敛收益高的页面主列表
CANDIDATE_MEDIUM           形态相近但存在明显结构差异、需额外评估的页面主列表
CANDIDATE_LOW              与参考形态差异较大、收敛收益有限的页面主列表（本轮无）
EXCLUDED_NON_MAIN_TABLE    弹窗表 / 详情子表 / 确认表 / 大屏·复合视图内嵌表
NEEDS_SEPARATE_EVALUATION  归属不明或当前未被使用的表格，需单独评估
```

### 2.2 分类计数

```text
el_table_usage_count=15
el_table_file_count=14
REFERENCE_PAGE=1
CANDIDATE_HIGH=4
CANDIDATE_MEDIUM=3
CANDIDATE_LOW=0
EXCLUDED_NON_MAIN_TABLE=6
NEEDS_SEPARATE_EVALUATION=1
```

`LIST_TABLE_REFERENCE_FACT` —— 页面主列表合计 `1 + 4 + 3 + 0 = 8` 个；
非主列表（被排除）合计 `6 + 1 = 7` 个；`8 + 7 = 15`，与使用点总数一致，**无遗漏、无重复**。

`LIST_TABLE_TEMPLATE_APPROVED` —— 上述盘点与分类已作为**基线盘点结果**批准
（`candidate_inventory_status=COMPLETED_APPROVED_AS_BASELINE_INVENTORY`）；
但**任何候选分类都不等于迁移授权**，也**不**代表已选择首个迁移页面。

## 3. 判断依据

`LIST_TABLE_REFERENCE_FACT`：

- **主列表**：承载该页面主要业务记录集、直接位于页面结果区的 `el-table`；
- **弹窗表格**：位于 `el-dialog` 内、仅在用户打开弹窗时出现的表格
  （#2 命名策略表、#6 保存确认表）；
- **详情子表**：随主记录展开、从属于某条记录的表格（#14 故障事件列表，在 `detail.vue` 出现两次）；
- **大屏/复合视图内嵌表**：位于卡片 / 玻璃拟态卡片内、
  作为更大视觉组合一部分的表格（#7、#11、#12）；
- **未使用组件**：#15 `JobFailureSummaryTable.vue` 在全仓**无任何 import / 引用**，
  属死代码；其是否删除、是否纳入模板，**不属本任务范围**，
  本轮只记录事实并归入 `NEEDS_SEPARATE_EVALUATION`。

## 4. 未来迁移需保护的 Feature 专属行为

`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` —— 若未来某页面决定迁移，**必须保护**：

| 页面 / 表格 | 必须保护 |
| --- | --- |
| 数据源管理主表（参考） | 列顺序与列宽；角色标签两类配色；停用/异常标记的语义与“显示真实原值”；等宽加粗 ID；行双击行为；操作列 `fixed="right"` |
| 探针端管理主表 | **固定行高 `60px`**；多选与选中态（`#ecf5ff` + `inset 3px 0 0`）；批量工具栏；`@row-click`/`@row-dblclick` |
| 数据订阅主表 | `row-key="dataSubId"`；`:row-class-name`；单元格 Tooltip；操作列 `fixed="right"` |
| 服务配置主表 | 行内 `ConfigValueEditor`；卡片级保存动作；`empty-text="暂无配置项"` |
| 源库快照状态主表 | 单实例 Tooltip 机制与其触发延迟（状态列 `delayMs:0`）；`UNKNOWN` 行琥珀底；`min-width:1175px` |
| 数据同步进度主表 | `border`；左右 `fixed` 列；自定义单实例 `.toff-tip`（350ms）；表头 `14px/600/#303133` 覆盖 |
| 日志查询主表 | `size="small" border height="100%"`；左右 `fixed` 列；单元格 Tooltip（`:show-after="200"`）；`row-key="cdcLogId"` |
| 故障历史下钻列表 | `size="small" border`；`empty-text="当前时间范围内没有故障历史记录"` |

## 5. 与 `query-list-page-template` 的关系

`LIST_TABLE_TEMPLATE_APPROVED` —— 两层**正交、可组合**（见 `README.md` §5）：

- qlpt 的 `MIGRATION.md` 在评估查询列表页模板迁移时，
  **不会**自动覆盖表格内部视觉；
- 未来迁移一个**查询列表页**时，应**同时**评估是否适用本表格视觉模板；
- 但两层各自**独立评估、独立授权**，任一层的授权**不**自动扩展到另一层；
- qlpt 已批准的 `SHARED_COMPONENT_DESIGN.md` 明确把
  `el-table` 内部结构类（`el-table__cell` 内边距、表头 `.cell` 排版）**留在 Feature**；
  本模板**新开一层**承载该部分纪律，**不**改写该约定。

`LIST_TABLE_REFERENCE_FACT` —— 本轮对 qlpt 目录只做了**最小、追加式**交叉引用，
**未**改变其冻结标记计数与已批准规范（核验见
`reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md` §6）。

## 6. 迁移授权与边界（严格）

`LIST_TABLE_TEMPLATE_APPROVED` —— 本基线**只**形成候选盘点与评估结果，**明确不**：

- 把任何页面写成已迁移；
- 授权任何页面迁移；
- 为探针端管理、数据订阅或任何页面预先生成实施任务；
- 把候选优先级等同于项目负责人批准的迁移顺序。

`LIST_TABLE_TEMPLATE_APPROVED` —— **未来每个页面需要独立评估、独立授权、独立实现、
独立目测和独立验收**；实际迁移页面**可能多于两个**。

`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` —— 未来迁移任务的**前置条件**及当前状态：

1. 本基线经 ChatGPT 远程 Git 复审 —— **已完成**（R1 `REVIEW_PASS`）；
2. 项目负责人批准基线内容 —— **已完成**（2026-09-21，`BASELINE_CONTENT_ONLY`）；
3. 公共实现详细设计与批准 —— **已完成**（ChatGPT 远程 R2 复审 `REVIEW_PASS`、
   `blocking_finding_count=0`；项目负责人于 2026-09-21 批准，
   `approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`）；
4. 公共实现与数据源管理参考页等价接入及项目负责人目测 —— **已实现且目测通过（2026-09-22）**
   （`project_owner_visual_review_status=PASS`）；
5. 公共实现正式验收与最终接受 —— **已完成**（本地正式验收 14/14 PASS，
   `formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`；ChatGPT 远程复审 `REVIEW_PASS`、
   `blocking_finding_count=0`；项目负责人于 2026-09-22 最终接受并关闭，
   `final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`）；
6. 之后才逐页选择并单独授权 —— **未授权**（`page_migration_status=NOT_STARTED`、
   `page_migration_authorization_status=NOT_GRANTED`）。

第 1、2、3 条完成**只**意味着**基线内容**与**详细设计文档**已批准；
第 4 条已实现且目测通过，第 5 条的**正式验收**已在本地执行并通过、**最终接受已由项目负责人作出**，
第 6 条**仍未授权**，**不得**把上述不同层级合并成模糊的“已完成”。
**批准详细设计 ≠ 批准实现 ≠ 目测通过 ≠ 通过正式验收（本地） ≠ 项目负责人最终接受 ≠ 批准页面迁移。**
本次最终接受范围**仅限**公共实现与数据源管理参考页等价接入，
**不**代表批准探针端管理、数据订阅或其他任何业务页面迁移；
本轮**未**选择首个迁移页面，
**未**为探针端管理、数据订阅或任何页面生成实施任务。

## 探针端管理主列表接入授权记录（`2026-09-22` 授权 / `2026-09-22` 记录）

本节为**追加**记录，不改写上方任何历史结论、状态块、候选矩阵与 §4 保护清单。
上方 §1~§6 及既有各时点记录的正文保持原样。

### 授权事实

- 授权日期：`2026-09-22`；授权人：项目负责人（在当前会话中明确指定）。
- 授权内容：`探针端管理`（`/config/client`）**页面主列表**接入列表表格视觉模板。
- 授权对象：`探针端管理`（`/config/client`）**单页的主列表**，且**仅限**该页。
- 授权性质：**页面范围化**的接入授权，与 §6“未来每个页面需要独立评估、独立授权、
  独立实现、独立目测和独立验收”一致；**不是**模板级“页面迁移”授权。

### 覆盖范围（只覆盖主列表）

- 本授权**只**覆盖该页**主列表**（页面结果区承载主要业务记录集的 `el-table`）。
- **不得**把该页新增 / 编辑弹窗或其**内部控件**纳入本模板范围；弹窗与弹窗内控件
  仍由该 Feature 自己承担视觉与交互纪律。
- 接入方式沿用已批准的公共实现契约（追加显式根类 + `scoped` 引入该模板 CSS），
  不新增 Vue 包装组件、不新增额外 DOM 层、不引入全局泄漏。

### 与 §4 保护清单的关系（必须显式记录，不得静默覆盖）

- §4 中“探针端管理主表”一行列举的**必须保护**项包含
  “多选与选中态（`#ecf5ff` + `inset 3px 0 0`）**批量工具栏**”。
- 项目负责人本轮已明确**取消**该页的“删除所选”按钮，因此 §4 中
  “批量工具栏必须保护”这一项被本轮业务决定**部分替代**：
  该页此后**不再有批量工具栏**，后续以本 Feature **获批后的**调整基线为准。
- **不得反向改写历史盘点记录**：§4 原文保持原样，本轮不改写它，
  本节只追加说明“该保护项已被业务决定部分替代”这一事实与其生效条件
  （须待本 Feature 调整基线获批）。
- §4 中其余同页保护项（固定行高、`@row-click` / `@row-dblclick` 行为等）
  **不由本轮替代**，仍须在实现时逐项评估并保护。

### 当前状态（本次记录时点的权威事实）

```text
client_config_main_list_integration_task=CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001
client_config_main_list_integration_authorization_date=2026-09-22
client_config_main_list_integration_authorization_status=GRANTED_BY_PROJECT_OWNER_FOR_THIS_PAGE_MAIN_LIST_ONLY
client_config_main_list_integration_document_status=DRAFT_PENDING_USER_REVIEW
client_config_main_list_integration_implementation_status=NOT_STARTED
client_config_main_list_integration_visual_review_status=NOT_PERFORMED
client_config_main_list_integration_acceptance_status=ALL_NOT_RUN
client_config_main_list_integration_scope=MAIN_LIST_ONLY_MODALS_EXCLUDED
```

### 边界（明确不得）

- **不得**把本页主列表接入写成模板已迁移：模板级 `page_migration_status` 保持
  `NOT_STARTED`，`page_migration_authorization_status` 保持 `NOT_GRANTED`，
  `pilot_page_selection_status` 保持 `NOT_DECIDED`（§6 第 6 条仍为“未授权”）。
- **不得**写成“所有页面已授权”：本授权**只**覆盖 `探针端管理`（`/config/client`）单页主列表；
  本轮**没有**授权任何其他页面，也**没有**选定任何试点页面。
- **不得**把本轮草案写成已批准、已实现、已测试、已目测或已正式验收：当前仅为
  `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED` / `NOT_RUN`，下一入口是
  ChatGPT 从远程 Git 的独立复审，**不是**直接实现。
- **不得**把本记录解释为公共实现或数据源管理参考页最终接受事实的改变：
  公共实现与参考页接入仍为 `IMPLEMENTED_ACCEPTED`、
  `final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`，均不变。

## 与 `query-list-page-template` 的页面级交叉引用（追加记录，`2026-09-22`）

本节为**追加式交叉引用**，**不**改变本文件的候选矩阵、分类计数、
§4 保护清单、§6 授权边界或任何迁移状态。

- 同一个页面级调整草案（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`）
  同时为 `探针端管理`（`/config/client`）**单页**评估了查询列表页模板层的接入；
  对应的页面层授权记录见
  `docs/baseline/query-list-page-template/MIGRATION.md` 的 `2026-09-22` 追加记录。
- **授权独立**：二层**正交、可组合**（见 §5），但两层的页面级授权**各自独立记录**；
  本记录**不**自动构成页面层的授权，反之亦然。
- 本轮两层的适用范围均**只**覆盖 `/config/client` 单页；
  两层各自的模板级全局迁移状态**均不变**。

## R1 修正记录：`/config/client` 主列表“行选中/高亮”保护项亦被替代（追加记录，`2026-09-22`）

> 本节为**追加式**修正记录（对应任务 `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1`），
> **不**改写上文任何历史记录、不改写 §4 保护清单、不改动 §5 分类计数、
> **不**修改本文件任何模板级全局迁移状态，**不**授权任何其他页面。

### 被修正之处

- 上节“与 §4 保护清单的关系”仅把 §4 “探针端管理主表”一行中的
  **“批量工具栏”**记为被项目负责人业务决定**部分替代**，
  并保留“多选与选中态（`#ecf5ff` + `inset 3px 0 0`）”与
  “`@row-click` / `@row-dblclick`”须逐项保护。
- R1 明确：项目负责人本轮**同时取消**该页的**行选中能力整体**，
  故 §4 该行中的**“多选与选中态（`#ecf5ff` + `inset 3px 0 0`）”**——
  即**行单选、选中行浅蓝底、左侧 3px 强调线、`@row-click` 改变选中**——
  与被替代的“批量工具栏”一样，**同样被本页业务决定替代**，
  后续以本 Feature **获批后的**调整基线为准。

### 修正后的保护口径（仅限 `/config/client` 主列表）

- 目标页主列表**不再有**：删除所选按钮、批量工具栏、行单选机制、
  选中行集合 / 当前选中行概念、选中行视觉（浅蓝底 / 高亮 / 左侧强调线）、
  `@row-click` 改变选中、以及“已选择：{探针ID}”或等效选中文本。
  普通单元格点击**不产生**任何选中视觉。
- 目标页主列表**仍然保留**（与取消选择并不冲突，须在实现时保护）：
  行**双击编辑**（`@row-dblclick`）、探针 ID 键盘聚焦后 Enter/空格编辑、
  固定行高、数据源标签与 Tooltip、`+N` 点击清单等既有交互。
  删除 / 启停入口改由该行“更多”下拉发起，**不**依赖任何行选中态。

### 边界（明确不得）

- **不得**把本修正写成模板通用规则变化：本修正**只**适用于
  `探针端管理`（`/config/client`）**主列表**，**不**修改本模板任何通用规则、
  也**不**改变 §4 保护清单对其余页面（含数据源管理参考页）的效力。
- **不得**把本修正写成模板级全局迁移状态变化：模板级
  `page_migration_status` 保持 `NOT_STARTED`、
  `page_migration_authorization_status` 保持 `NOT_GRANTED`、
  `pilot_page_selection_status` 保持 `NOT_DECIDED`——**均不变**。
- **不得**把本修正写成新的页面授权：R0 记录的 `/config/client`
  页面级授权仍然有效且范围不变（**仅**该页**主列表**），
  本修正**不**新增授权、**不**授权任何其他页面、**不**选定任何试点页面。
- **不得**把本修正解释为数据源管理参考页最终接受事实的改变：
  公共实现与参考页接入仍为 `IMPLEMENTED_ACCEPTED`、
  `final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`，均不变。
- **不得**把本轮草案写成已批准 / 已实现 / 已测试 / 已目测 / 已正式验收：
  仍为 `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED` / `NOT_RUN`。
- **授权独立**：本修正**不**自动构成 `query-list-page-template` 页面层的授权，
  反之亦然；本次**不**修改
  `docs/baseline/query-list-page-template/MIGRATION.md`。

## 探针端管理主列表页面级调整基线批准记录（追加记录，`2026-09-22`）

本节为**追加**记录，**不**改写上文任何历史结论、状态块、候选矩阵、§4 保护清单、
§5 分类计数、§6 授权边界与授权/修正记录。上文 `2026-09-22` 的
“探针端管理主列表接入授权记录”“与 `query-list-page-template` 的页面级交叉引用”
与“R1 修正记录”正文保持原样；其中 `client_config_main_list_integration_document_status=DRAFT_PENDING_USER_REVIEW`
属**该等记录时点的历史状态**，已由本条批准记录取代，历史记录本身**不**被删除、
**不**被改写、**不**被伪装为从未存在。

### 授权与批准对象

- 批准日期：`2026-09-22`；批准人：项目负责人（原话 `批准本轮探针端管理页面调整基线`）。
- 批准任务：`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001`（纯文档）。
- 批准依据：ChatGPT 从远程 Git 对 R3 结果提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0`
  的独立复审结论 `APPROVED`。
- 批准对象：`探针端管理`（`/config/client`）**主列表**的列表表格视觉模板接入
  及其本轮**页面调整基线**（`CCFG-REQ-091~103`、`CCFG-AC-077~089`、
  `CCFG-DESIGN-038~046`、`CCFG-UI-027~035`）。
- **范围只覆盖该页主列表**，**不含**新增/编辑弹窗与其内部控件；
  该页的页面级授权**先于**本次收口存在，本次收口**不新增、不扩大**该授权；
  **没有**授权任何其他页面。

### 本轮批准记录（权威事实）

```text
client_config_main_list_visual_integration_page_adjustment_baseline_status=APPROVED
client_config_main_list_visual_integration_authorization_status=UNCHANGED_GRANTED_BY_PROJECT_OWNER_FOR_THIS_PAGE_MAIN_LIST_ONLY
client_config_main_list_visual_integration_implementation_status=NOT_STARTED
client_config_main_list_visual_integration_acceptance_status=ALL_NOT_RUN
client_config_main_list_visual_integration_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0
```

### “取消批量工具栏 / 行单选 / 选中行高亮”的性质

- 取消该页**批量工具栏**（含“删除所选”）、**行单选**与**选中行高亮**
  （浅蓝底、左侧 3px 强调线、`@row-click` 改变选中、选中行集合与
  “已选择：{探针ID}”文本）是**项目负责人针对该页批准的业务规则**，
  随本轮页面调整基线一并获批。
- 该取消**只**适用于 `探针端管理`（`/config/client`）**主列表**，
  **不是**模板通用规则变化：本模板的通用规则、§4 保护清单对其余页面
  （含数据源管理参考页）的效力**均不改变**。

### 边界（明确不得）

- 批准的**只是该页主列表的页面调整基线**，**不**代表该页已实现、已测试、
  已目测、已验收或可上线：该页主列表实现状态仍 `NOT_STARTED`、
  目测状态仍 `NOT_PERFORMED`、`CCFG-AC-001~089`（含 `077~089`）仍全部 `NOT_RUN`。
- **不得**把本页主列表接入写成模板已迁移：模板级全局状态保持不变——
  `page_migration_status` 保持 `NOT_STARTED`、
  `page_migration_authorization_status` 保持 `NOT_GRANTED`、
  `pilot_page_selection_status` 保持 `NOT_DECIDED`。
- **不得**写成“所有页面已授权”或“试点页面已选定”。
- **不得**把本条解释为**数据源管理参考页最终接受事实**的改变：
  公共实现与参考页接入仍为 `IMPLEMENTED_ACCEPTED`、
  `final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`，**均不变**。
- **不得**改写上文 `2026-09-21` 基线批准收口、`2026-09-22` 草案授权与交叉引用、
  R1 修正各历史记录，也**不得**改写 §4 保护清单、§5 分类计数与 §6 授权边界。
- **授权独立**：本条**不**自动构成 `query-list-page-template` 页面层的授权，
  反之亦然。
