# Tests and build evidence (prompt §8)

All commands executed in the task worktree `<worktree>/frontend` with the pre-installed Node/npm.
No test file was created, modified or skipped. Raw logs (gitignored `*.log`) are kept under
`/tmp/dss-query-button-table-layout-formal-acceptance-001/`; the bounded extracts below are what is committed.

## 1. Targeted

```text
npx vitest run src/layouts/MainLayout.spec.ts src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts
```

```text
 ✓ src/layouts/MainLayout.spec.ts  (10 tests) 378ms
 ✓ src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts  (103 tests) 18005ms
 Test Files  2 passed (2)
      Tests  113 passed (113)
   Duration  21.74s (transform 765ms, setup 94ms, collect 4.06s, tests 18.38s, environment 2.24s, prepare 376ms)
```

exit_code=0

These two files are the direct unit coverage of the two acceptance surfaces: the route-scoped
gutter class in `MainLayout.vue` and the fixed 62/62/110 button widths in the query bar.

## 2. Feature (whole data-source-run-state area)

```text
npx vitest run src/views/data-source-run-state
```

```text
 ✓ src/views/data-source-run-state/composables/useDataSourceSnapshot.spec.ts  (26 tests) 151ms
 ✓ src/views/data-source-run-state/components/DataSourceSnapshotTable.spec.ts  (29 tests) 2800ms
 ✓ src/views/data-source-run-state/components/DataSourceSnapshotToolbar.spec.ts  (27 tests) 758ms
 ✓ src/views/data-source-run-state/DataSourceRunStatePage.spec.ts  (18 tests) 6331ms
 ✓ src/views/data-source-run-state/composables/useDataSourceSnapshot.errorChain.spec.ts  (6 tests) 114ms
 ✓ src/views/data-source-run-state/tooltip/useSnapshotTooltip.spec.ts  (14 tests) 58ms
 ✓ src/views/data-source-run-state/utils/format.spec.ts  (21 tests) 34ms
 ✓ src/views/data-source-run-state/tooltip/SnapshotTooltipHost.spec.ts  (4 tests) 127ms
 ✓ src/views/data-source-run-state/tooltip/tooltipPosition.spec.ts  (10 tests) 9ms
 ✓ src/views/data-source-run-state/utils/selection.spec.ts  (7 tests) 76ms
 ✓ src/views/data-source-run-state/components/DataSourceSnapshotStatusTag.spec.ts  (8 tests) 220ms
 ✓ src/views/data-source-run-state/utils/rowKey.spec.ts  (3 tests) 9ms
 ✓ src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts  (103 tests) 23466ms
 Test Files  13 passed (13)
      Tests  276 passed (276)
   Duration  28.29s (transform 2.33s, setup 674ms, collect 16.68s, tests 34.15s, environment 12.72s, prepare 2.67s)
```

exit_code=0

## 3. Full frontend suite

```text
npx vitest run
```

```text
 Test Files  51 passed (51)
      Tests  875 passed (875)
   Start at  00:10:41
   Duration  99.90s (transform 5.44s, setup 455ms, collect 67.92s, tests 150.92s, environment 48.31s, prepare 11.12s)

```

exit_code=0  test_files=51 passed / 0 failed  tests=875 passed / 0 failed  0 skipped

## 4. Production build

```text
npm run build     # vue-tsc --noEmit && vite build
```

```text
dist/assets/DataSourceRunStatePage-DTdnPJMk.css     13.68 kB │ gzip:   2.92 kB
dist/assets/DataSourceRunStatePage-LqeDiH39.js      20.20 kB │ gzip:   7.44 kB
✓ built in 22.23s
```

exit_code=0. The `vue-tsc --noEmit` type check runs as part of this script and passed.
The 'chunks larger than 500 kB' line is a pre-existing informational Rollup notice, not a failure.

```text
targeted_frontend_test_status=PASS
feature_frontend_test_status=PASS
frontend_full_test_status=PASS
frontend_build_status=SUCCESS
test_files_modified=0
```
