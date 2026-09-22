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
shared_implementation_status=IMPLEMENTED_PENDING_FORMAL_ACCEPTANCE
reference_page_integration_status=IMPLEMENTED_PENDING_FORMAL_ACCEPTANCE
project_owner_visual_review_status=PASS
project_owner_visual_review_date=2026-09-22
formal_acceptance_execution_status=NOT_RUN
final_acceptance_status=NOT_ACCEPTED_PENDING_FORMAL_ACCEPTANCE
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
candidate_inventory_status=COMPLETED_APPROVED_AS_BASELINE_INVENTORY
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
> 并经项目负责人于 2026-09-22 目测通过
> （`shared_implementation_status=IMPLEMENTED_PENDING_FORMAL_ACCEPTANCE`、
> `reference_page_integration_status=IMPLEMENTED_PENDING_FORMAL_ACCEPTANCE`，
> `project_owner_visual_review_status=PASS`），
> 但**尚未**通过正式验收；`page_migration_status=NOT_STARTED`、
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
4. 公共实现与数据源管理参考页等价接入及项目负责人目测 —— **已实现且目测通过（2026-09-22），待正式验收**
   （`IMPLEMENTED_PENDING_FORMAL_ACCEPTANCE`；`project_owner_visual_review_status=PASS`）；
5. 公共实现正式验收与最终接受 —— **未运行**（`formal_acceptance_execution_status=NOT_RUN`，
   `final_acceptance_status=NOT_ACCEPTED_PENDING_FORMAL_ACCEPTANCE`，最终接受**尚未决定**）；
6. 之后才逐页选择并单独授权 —— **未授权**（`page_migration_status=NOT_STARTED`、
   `page_migration_authorization_status=NOT_GRANTED`）。

第 1、2、3 条完成**只**意味着**基线内容**与**详细设计文档**已批准；
第 4 条已实现且目测通过但**未**通过正式验收，第 5、6 条**仍未运行/未授权**，
**不得**把上述不同层级合并成模糊的“已完成”。
**批准详细设计 ≠ 批准实现 ≠ 目测通过 ≠ 通过正式验收 ≠ 批准页面迁移。**
本轮**未**选择首个迁移页面，
**未**为探针端管理、数据订阅或任何页面生成实施任务。
