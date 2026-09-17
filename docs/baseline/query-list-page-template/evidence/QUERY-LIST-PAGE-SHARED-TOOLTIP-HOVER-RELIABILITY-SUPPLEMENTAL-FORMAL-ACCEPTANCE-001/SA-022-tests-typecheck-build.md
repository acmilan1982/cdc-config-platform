# SA-022 测试、类型检查与构建

工作目录：`/agent/query-list-page-shared-tooltip-hover-reliability-correction-001/frontend`

## 1. 定向测试（17 文件 / 390 用例）

```bash
npx vitest run \
  src/composables/query-list/useQueryListTooltip.spec.ts \
  src/components/query-list/{QueryListPageShell,QueryListQueryPanel,QueryListActions,QueryListResultPanel,QueryListRefreshToolbar,QueryListTooltipHost,shared-layer}.spec.ts \
  src/views/data-source-run-state/DataSourceRunStatePage.spec.ts \
  src/views/data-source-run-state/components/{DataSourceSnapshotQueryBar,DataSourceSnapshotTable,DataSourceSnapshotStatusTag}.spec.ts \
  src/views/data-source-run-state/composables/{useDataSourceSnapshot,useDataSourceSnapshot.errorChain}.spec.ts \
  src/views/data-source-run-state/utils/{format,selection,rowKey}.spec.ts
```

```text
 ✓ useDataSourceSnapshot.spec.ts            (26 tests)
 ✓ useQueryListTooltip.spec.ts              (41 tests)
 ✓ DataSourceSnapshotTable.spec.ts          (36 tests)
 ✓ QueryListRefreshToolbar.spec.ts          (26 tests)
 ✓ shared-layer.spec.ts                     (16 tests)
 ✓ DataSourceRunStatePage.spec.ts           (18 tests)
 ✓ QueryListTooltipHost.spec.ts             (21 tests)
 ✓ QueryListActions.spec.ts                 (18 tests)
 ✓ useDataSourceSnapshot.errorChain.spec.ts  (6 tests)
 ✓ QueryListResultPanel.spec.ts             (16 tests)
 ✓ QueryListPageShell.spec.ts               (12 tests)
 ✓ format.spec.ts                           (21 tests)
 ✓ QueryListQueryPanel.spec.ts              (10 tests)
 ✓ selection.spec.ts                         (7 tests)
 ✓ DataSourceSnapshotStatusTag.spec.ts       (8 tests)
 ✓ rowKey.spec.ts                            (3 tests)
 ✓ DataSourceSnapshotQueryBar.spec.ts      (105 tests)

 Test Files  17 passed (17)
      Tests  390 passed (390)
   Duration  37.23s
EXIT=0
```

## 2. 全量前端测试

```bash
npx vitest run
```

```text
 Test Files  55 passed (55)
      Tests  990 passed (990)
   Duration  86.19s
```

## 3. 类型检查

```bash
npx vue-tsc --noEmit
# TSC_EXIT=0
```

## 4. 生产构建

```bash
npm run build
```

```text
(!) Some chunks are larger than 500 kB after minification. ...
✓ built in 17.21s
BUILD_EXIT=0
```

（chunk 体积提示为既有告警，与本次修正无关。）

## 5. 与基准数量对照

| 项 | 修正报告记载 | 本轮实测 | 判定 |
|---|---|---|---|
| 定向文件 | 17 | 17 | 一致 |
| 定向用例 | ≥390 | 390 | 一致 |
| 全量用例 | ≥990 | 990 | 一致 |
| `vue-tsc` | 通过 | 退出码 0 | 一致 |
| 构建 | 通过 | 退出码 0 | 一致 |

未为凑数修改任何测试；无关键用例被跳过；本轮对测试文件零改动。

```text
targeted_test_status=PASS   targeted_test_file_count=17  targeted_test_count=390  targeted_test_fail_count=0
frontend_full_test_status=PASS  frontend_full_test_file_count=55  frontend_full_test_count=990  frontend_full_test_fail_count=0
vue_tsc_status=PASS
frontend_build_status=PASS
```
