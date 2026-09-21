# LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001 执行报告

- 任务编号：`LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001`
- 任务性质：`DOCS_ONLY_PROJECT_BASELINE_DRAFT`（**纯文档项目级基线草案**）
- 日期：2026-09-21
- 分支：`develop`
- 基准提交：`10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e`
- 输出目录：`docs/baseline/list-table-visual-template/`
- 状态：`DRAFT_PENDING_USER_REVIEW` / `BASELINE_DRAFT_ONLY`

> 本任务**只**建立“列表表格视觉模板”草案基线、盘点候选页面、建立文档导航。
> **未**实现任何公共代码，**未**迁移任何页面，**未**修改参考页。

---

## 1. 基准提交与真实读取范围

```text
base_commit_id=10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e
branch=develop
remote_commit_id(before)=10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e
ahead_behind(before)=0	0
```

`LIST_TABLE_REFERENCE_FACT` —— 本轮实际**读取**（只读）的范围：

| 范围 | 文件 |
| --- | --- |
| 项目级基线 | `docs/baseline/{PROJECT,ENVIRONMENT,ARCHITECTURE,DEVELOPMENT_RULES,PROJECT_STATUS,DOMAIN_GLOSSARY}.md`、`docs/baseline/README.md` |
| 查询列表页模板 | `docs/baseline/query-list-page-template/{README,DESIGN,UI,MIGRATION,SHARED_COMPONENT_DESIGN}.md` |
| 参考页源码 | `frontend/src/views/data-source/DataSourcePage.vue`（模板 / 样式 / 列定义） |
| 参考页测试 | `frontend/src/views/data-source/dataSource.spec.ts` |
| 全量表格扫描 | `frontend/src/**/*.vue` 全部 `el-table` 使用点（见 §4） |
| 路由 | `frontend/src/router/index.ts` |
| Feature 文档 | `docs/features/data-source-management/{README,UI}.md`（相关章节） |

未读取 `docs/baseline-work/`（过程材料，本任务无需追溯）。

## 2. 为什么独立建目录，而不并入 `query-list-page-template`

`LIST_TABLE_TEMPLATE_DRAFT` —— 理由：

1. **职责正交**：qlpt 覆盖**页面级**能力（标题 / 查询区 / 结果区 / 刷新工具栏 / 请求交互），
   本模板覆盖**表格级**视觉与结构纪律（表头 / 正文 / 间距 / 边框 / 行高 / 长文本 / 扩展边界）；
2. **适用范围不同**：qlpt 已明确把自己的范围限定为**只读查询列表页**；
   若把表格视觉规范并入 qlpt，会**扩大**其已接受的适用范围，
   而列表表格的使用面**远大于**只读查询列表页（含配置管理页等带写操作的页面）；
3. **不重开已接受基线**：并入意味着改动 qlpt 的已批准规范与冻结计数，
   违反“不重新设计、不重开验收、不改变已接受状态”的约束；
4. **可组合**：两层正交且可组合，页面按**独立评估结果**决定是否组合使用。

`LIST_TABLE_REFERENCE_FACT` —— 该决定还有一处来自 qlpt 自身设计的支撑：
qlpt 的 `SHARED_COMPONENT_DESIGN.md` §7.9.5 明确禁止公共层覆盖
`el-table` 的内部结构类（`el-table__cell` 内边距、表头 `.cell` 排版），
把该部分**留在 Feature**。本模板正是**新开一层**来承载这部分纪律，
**不**推翻该约定，也不与之重叠。

## 3. 数据源管理参考事实摘要

`LIST_TABLE_REFERENCE_FACT` —— 参考实现（`/config/data-source`，
`DataSourcePage.vue` 主表 `class="data-table"`）要点：

- 表格**未**声明 `border` / `stripe` / `size` / `height` / `row-key` / 多选 / 排序 / 分页；
  Loading 由外层结果区承担；绑定 `@row-dblclick`；
- 局部覆盖 EP 令牌：`--el-table-border-color:#f4f4f5`、
  `--el-table-header-text-color:#71717a`、`--el-table-header-bg-color:#ffffff`；
- 表头单元格：`12px / 600 / #71717a / letter-spacing:0.01em`；
- 正文 td `padding:12px 0`；表头 th `padding:11px 0`；
- 序号列 `.ds-seq`：`width:70 / center / 13px / #71717a / tabular-nums`；
- 数据源 ID `.ds-id-text`：`14px / 600 / #09090b / 等宽字体族 / tabular-nums /` 单行省略；
- 停用胶囊 `.ds-inactive-mark`：`20px` 高 / `radius 4px` / `#fee2e2` / `#991b1b` / `11px / 700`；
- 异常标记 `.ds-abnormal-mark`：同几何 / `#fef3c7` / `#b45309`；
- 角色 `el-tag`：`20px` 高 / 无边框 / `radius 4px` / `12px / 600`；warning 琥珀、success 绿；
- 空态：两级文案（`.empty-main` + `.empty-sub`），随 `effectiveQuery` 变化；
- 列：序号 `70(center)` / ID `min-140` / 名称 `min-140` / 角色 `90` / 类型 `90` /
  主机 `min-110` / 端口 `80` / Service Name `min-150` / 用户名 `min-110` / 操作 `110(fixed=right)`。

完整清单见 `../UI.md` §1。

## 4. 全量 `el-table` 盘点：方法、数量与分类摘要

`LIST_TABLE_REFERENCE_FACT` —— 盘点命令：

```bash
grep -rnP '<el-table(?![-_])' frontend/src --include=*.vue
```

采用负向先行断言 `(?![-_])` 排除 `el-table-column` / `el-table__*`，
并匹配行尾 `<el-table`（多行开标签），**不遗漏**。

```text
el_table_usage_count=15
el_table_file_count=14
```

分类摘要：

```text
REFERENCE_PAGE=1              （数据源管理主列表）
CANDIDATE_HIGH=4              （探针端管理 / 数据订阅 / 源库快照状态 / 数据同步进度）
CANDIDATE_MEDIUM=3            （服务配置 / 日志查询 / 故障历史下钻列表）
CANDIDATE_LOW=0
EXCLUDED_NON_MAIN_TABLE=6     （2 弹窗表 + 1 详情子表 + 3 大屏·复合内嵌表）
NEEDS_SEPARATE_EVALUATION=1   （未被引用的 JobFailureSummaryTable.vue）
```

`8（主列表） + 7（非主列表） = 15`，与使用点总数一致，**无遗漏、无重复**。
逐项矩阵与判断依据见 `../MIGRATION.md` §2–§3。

## 5. 新模板与现有模板关系

`LIST_TABLE_TEMPLATE_DRAFT` —— 见 `../README.md` §5 与 `../MIGRATION.md` §5：
两层正交、可组合；本模板**不**并入 qlpt、**不**扩大其范围、**不**改写其已批准规范。
本轮对 qlpt 目录只做**最小、追加式**交叉引用（见 §6 与 §7）。

## 6. `query-list-page-template` 冻结不变量核验

`LIST_TABLE_REFERENCE_FACT` —— 核验命令与结果：

```bash
grep -oF TEMPLATE_RULE_APPROVED            docs/baseline/query-list-page-template/{README,DESIGN,UI,MIGRATION,SHARED_COMPONENT_DESIGN}.md | wc -l   # 48
grep -oF REFERENCE_IMPLEMENTATION_FACT     docs/baseline/query-list-page-template/{README,DESIGN,UI,MIGRATION,SHARED_COMPONENT_DESIGN}.md | wc -l   # 43
grep -oF PROPOSED_NOT_IMPLEMENTED          docs/baseline/query-list-page-template/{README,DESIGN,UI,MIGRATION,SHARED_COMPONENT_DESIGN}.md | wc -l   # 9
grep -oF SHARED_COMPONENT_DESIGN_DECISION_APPROVED docs/baseline/query-list-page-template/SHARED_COMPONENT_DESIGN.md | wc -l                          # 66
```

```text
query_list_template_marker_freeze=48/0/43/9   （模板标记，未改变）
query_list_design_decision_freeze=66/0        （设计决策，未改变）
```

本轮对 qlpt 目录的改动**只**为**追加式交叉引用**，**未**改变：

- 已批准规范正文与结论；
- `SHARED_COMPONENT_DESIGN.md` 公共组件 Props / Slots / Emits / CSS 契约（该文件**零改动**）；
- 已接受状态、验收结果、迁移授权状态；
- 上述四项冻结计数。

## 7. 修改文件清单

```text
changed_files=docs/baseline/list-table-visual-template/{README,DESIGN,UI,MIGRATION}.md,docs/baseline/list-table-visual-template/reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md,docs/baseline/README.md,docs/baseline/ARCHITECTURE.md,docs/baseline/PROJECT_STATUS.md,docs/baseline/DOMAIN_GLOSSARY.md,docs/baseline/DEVELOPMENT_RULES.md,docs/baseline/query-list-page-template/README.md,docs/baseline/query-list-page-template/MIGRATION.md
```

新增（5 个）：

- `docs/baseline/list-table-visual-template/README.md`
- `docs/baseline/list-table-visual-template/DESIGN.md`
- `docs/baseline/list-table-visual-template/UI.md`
- `docs/baseline/list-table-visual-template/MIGRATION.md`
- `docs/baseline/list-table-visual-template/reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md`

修改（追加式最小同步）：

- `docs/baseline/query-list-page-template/README.md`（追加新模板导航与关系说明）
- `docs/baseline/query-list-page-template/MIGRATION.md`（追加两层组合与独立授权说明）
- `docs/baseline/README.md`（新模板导航 + 草案/未实现/未批准/未授权迁移）
- `docs/baseline/ARCHITECTURE.md`（前端公共能力分层：页面模板层 + 表格视觉模板层）
- `docs/baseline/PROJECT_STATUS.md`（记录新模板草案状态、参考页、下一入口）
- `docs/baseline/DOMAIN_GLOSSARY.md`（定义四个术语）
- `docs/baseline/DEVELOPMENT_RULES.md`（追加页面主列表发现规则）

`LIST_TABLE_TEMPLATE_DRAFT` —— 是否修改 `DESIGN.md` / `UI.md`（qlpt）说明：
本轮**只**在 qlpt 的 `README.md` 与 `MIGRATION.md` 建立交叉引用，
**未**修改其 `DESIGN.md` / `UI.md` —— 因为在不改变冻结计数与已批准规范的前提下，
这两个文件的交叉引用没有**唯一必要**的落点，无需为凑齐文件数量而强行改动。

## 8. 本目录标记计数（草案冻结基线）

`LIST_TABLE_REFERENCE_FACT` —— 本目录建立时的标记计数：

```text
LIST_TABLE_REFERENCE_FACT=32
LIST_TABLE_TEMPLATE_DRAFT=38
LIST_TABLE_PROPOSED_NOT_IMPLEMENTED=13
```

核验命令（在仓库根执行）：

```bash
for m in LIST_TABLE_REFERENCE_FACT LIST_TABLE_TEMPLATE_DRAFT LIST_TABLE_PROPOSED_NOT_IMPLEMENTED; do
  printf "%-36s %s\n" "$m" "$(grep -roF "$m" docs/baseline/list-table-visual-template/ | wc -l)"
done
```

本目录标记与 `query-list-page-template` 的冻结计数**互不影响**。

## 9. 未修改代码 / Feature / 既有状态证明

`LIST_TABLE_REFERENCE_FACT`：

- `git status --short` 在本任务结束时只显示本任务新增/修改的 `docs/**` 文件，
  外加任务开始前已存在的 `.claude/settings.local.json`（修改）与 `docs/prompts/`（未跟踪）；
- `backend/**`、`frontend/**` **零变化**；
- `docs/features/**` **零变化**（数据源管理 Feature 七份核心文档未改）；
- 未新建 CSS / Vue / Composable / TS 类型 / 路由元数据；
- 未运行测试、构建、浏览器或服务；
- 未访问数据库 / ZooKeeper / Kafka / 业务源库 / 目标库；未执行 DDL / DML / HTTP 请求。

### 9.1 观察到的基线漂移（**未**修改，仅报告）

`LIST_TABLE_REFERENCE_FACT` —— 本任务在读取过程中观察到**任务范围外**的既有文档漂移：

- `docs/baseline/PROJECT_STATUS.md` §1.1 与 `docs/baseline/ARCHITECTURE.md` §3.2
  把 `/config/client`、`/config/subscribe`、`/config/server`、
  `/monitor/data-source-state`、`/monitor/topic-offset` 描述为“占位页”；
- 但当前 `frontend/src/router/index.ts` 与真实源码显示这些页面**已有完整实现**。

按 `CLAUDE.md` §7 与任务书 §7，**不得**顺手修复范围外的历史文档问题，
故本任务**只报告、不修改**。是否修订请由项目负责人另行决定。

## 10. 草案状态与下一入口

```text
list_table_visual_template_document_status=DRAFT_PENDING_USER_REVIEW
list_table_visual_template_design_status=BASELINE_DRAFT_ONLY
shared_implementation_design_status=NOT_STARTED
shared_implementation_status=NOT_STARTED
reference_page_integration_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
candidate_inventory_status=COMPLETED_PENDING_USER_REVIEW
```

```text
next_step=CHATGPT_REMOTE_GIT_LIST_TABLE_VISUAL_TEMPLATE_BASELINE_REVIEW_THEN_PROJECT_OWNER_APPROVAL
```

本轮**未**把任何文档写为 `APPROVED` / `IMPLEMENTED` / `ACCEPTED`；
**未**把数据源管理当前视觉上升为全部页面必须遵守的既定规范。
