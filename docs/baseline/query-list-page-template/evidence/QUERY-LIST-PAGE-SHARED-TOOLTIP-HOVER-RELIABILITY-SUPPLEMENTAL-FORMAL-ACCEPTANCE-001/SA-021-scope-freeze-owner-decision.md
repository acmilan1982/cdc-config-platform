# SA-021 修正范围、文档冻结与项目负责人决策

## 1. 修正提交范围

```bash
git -C ...-correction-001 diff --name-status \
  b453635ba7ac2183b260a3b31ee79e44cd11cf57 0a1cd99640a5cfa08280a95c23ca3c7231ea6a73
```

```text
M	docs/baseline/query-list-page-template/MIGRATION.md
M	docs/baseline/query-list-page-template/README.md
M	docs/baseline/query-list-page-template/SHARED_COMPONENT_DESIGN.md
M	frontend/src/components/query-list/types.ts
M	frontend/src/composables/query-list/useQueryListTooltip.spec.ts
M	frontend/src/composables/query-list/useQueryListTooltip.ts
M	frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts
M	frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue
M	frontend/src/views/data-source-run-state/components/DataSourceSnapshotTable.spec.ts
M	frontend/src/views/data-source-run-state/components/DataSourceSnapshotTable.vue

10 files changed, 602 insertions(+), 46 deletions(-)
```

| 类别 | 允许 | 实际 | 结果 |
|---|---|---|---|
| 生产源码 | 4 文件（`types.ts`、`useQueryListTooltip.ts`、`DataSourceSnapshotTable.vue`、`DataSourceSnapshotQueryBar.vue`） | 4 | PASS |
| 测试 | 3 文件（两个 `.spec.ts` + `useQueryListTooltip.spec.ts`） | 3 | PASS |
| 基线文档 | 3 文件（`README.md`、`MIGRATION.md`、`SHARED_COMPONENT_DESIGN.md`） | 3 | PASS |
| 后端 / 依赖 / 锁文件 / SQL / 配置 / 其他页面 | 0 | 0 | PASS |

原验收报告 `reports/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001.md`
与原证据目录 `evidence/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001/`
**均不在 diff 列表内**，未被修正提交改写。

## 2. 冻结标记

冻结判据的统计口径为**基线正文**：模板与设计决策正文及其同目录的两份既有设计文档，
即排除 `reports/` 与 `evidence/` 两个验收记录目录。

口径说明：`reports/` 与 `evidence/` 承载历次与本次的验收记录，**天然会复述标记名**；
把记录目录计入"冻结计数"会使判据随每次验收记录的书写方式而漂移，失去可比性。
上一轮修正任务所记录的 `48 / 0 / 43 / 9` 与 `66 / 0`，在此口径下于本轮**逐值复现**。

```bash
cd ...-correction-001/docs/baseline/query-list-page-template
for m in TEMPLATE_RULE_APPROVED TEMPLATE_RULE_DRAFT REFERENCE_IMPLEMENTATION_FACT \
         PROPOSED_NOT_IMPLEMENTED SHARED_COMPONENT_DESIGN_DECISION_APPROVED \
         SHARED_COMPONENT_DESIGN_DECISION_DRAFT; do
  printf '%-45s %s\n' "$m" \
    "$(grep -roh "$m" README.md MIGRATION.md SHARED_COMPONENT_DESIGN.md DESIGN.md UI.md | wc -l)"
done
```

```text
TEMPLATE_RULE_APPROVED                    = 48
TEMPLATE_RULE_DRAFT                       = 0
REFERENCE_IMPLEMENTATION_FACT             = 43
PROPOSED_NOT_IMPLEMENTED                  = 9
SHARED_COMPONENT_DESIGN_DECISION_APPROVED = 66
SHARED_COMPONENT_DESIGN_DECISION_DRAFT    = 0
```

等价的整树写法（显式排除记录目录）：

```bash
grep -roh --exclude-dir=reports --exclude-dir=evidence \
  -E 'TEMPLATE_RULE_APPROVED|TEMPLATE_RULE_DRAFT|REFERENCE_IMPLEMENTATION_FACT|PROPOSED_NOT_IMPLEMENTED|SHARED_COMPONENT_DESIGN_DECISION_APPROVED|SHARED_COMPONENT_DESIGN_DECISION_DRAFT' . \
  | sort | uniq -c
```

```text
      9 PROPOSED_NOT_IMPLEMENTED
     43 REFERENCE_IMPLEMENTATION_FACT
     66 SHARED_COMPONENT_DESIGN_DECISION_APPROVED
     48 TEMPLATE_RULE_APPROVED
```

（两份 DRAFT 标记在基线正文中出现 0 次，故不出现在 `uniq -c` 输出中。）

```text
template_marker_freeze_status=PASS（48/0/43/9）
design_decision_freeze_status=PASS（66/0）
```

## 3. 禁止写入的结论串

```bash
grep -rn -E "FINAL_ACCEPTED|FINAL_ACCEPTED_AND_CLOSED|PROJECT_OWNER_APPROVED|PAGE_MIGRATION_STARTED" \
  README.md MIGRATION.md SHARED_COMPONENT_DESIGN.md
```

命中项全部为：(a) 参考页（"数据同步进度"）自身的 `reference_feature_status=FINAL_ACCEPTED_AND_CLOSED`；
(b) 明令禁止本 Feature 写入这些串的说明文字。**无任何一处**把本 Feature 或本页面写成
`FINAL_ACCEPTED` / `FINAL_ACCEPTED_AND_CLOSED` / `PROJECT_OWNER_APPROVED` / `PAGE_MIGRATION_STARTED`。

模板与设计决策正文段落未被改写，本轮只在其后追加状态与历史。

## 4. 项目负责人决策记录

```text
project_owner_manual_tooltip_recheck_status=PASS
project_owner_statement=启动好了，我检查了，“快照状态”的Tooltip已经没有问题了
project_owner_final_acceptance_status=PENDING
page_migration_status=NOT_STARTED
```

该陈述仅证明项目负责人对 Tooltip 快速划入现象的人工复查结论为 PASS；
**未**扩大解释为最终接受、功能收口或页面迁移授权。
