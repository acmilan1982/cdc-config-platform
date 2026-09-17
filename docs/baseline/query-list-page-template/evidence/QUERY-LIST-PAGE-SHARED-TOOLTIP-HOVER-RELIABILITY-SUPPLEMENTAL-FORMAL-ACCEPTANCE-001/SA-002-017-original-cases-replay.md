# SA-002 原 17 项在当前提交重放（AC-001～AC-017）

所有数值均为**本轮在 `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73` 上重新采集**，未复制旧 PASS。

| 项 | 本轮命令 / 采集 | 本轮实际结果 |
|---|---|---|
| AC-001 | 见 `SA-001-baseline-isolation-services.md` | PASS |
| AC-002 | `grep -n export src/components/query-list/index.ts`；`grep -n 'delayMs\|hide' src/components/query-list/types.ts` | PASS |
| AC-003 | `capture.mjs` 四视口 `pageRoot.childElCount` | 3 / 3 / 3 / 3；首载失败态 2 |
| AC-004 | `grep -n -B3 -A3 '<slot' QueryListPageShell.vue` | PASS |
| AC-005 | `capture.mjs` 四视口按钮几何；`grep -n 'widthLock\|WidthPx' QueryListActions.vue` | 62×30 / 62×30 / 110×32 |
| AC-006 | `grep -n 'ql-result-panel__' QueryListResultPanel.vue` | PASS |
| AC-007 | `probe-spinner-contract.mjs` × 四视口 | 58/58 四视口均通过 |
| AC-008 | `grep -n 'aria-disabled\|disabled' QueryListRefreshToolbar.vue` | `:aria-disabled`，无原生 `disabled` |
| AC-009 | `probe-candidate.mjs` | 与 FA 采集逐字节一致 |
| AC-010 | `probe-aria.mjs` | `{"total":7,"passed":7,"failed":0}` |
| AC-011 | `capture.mjs` `extras.gutterDeclared` / `gutterUndeclared` | `stable` / `auto` |
| AC-012 | `probe-lifecycle.mjs` | 与 FA 输出逐字节一致 |
| AC-013 | 见 `SA-022-tests-typecheck-build.md` | 390 / 990 / tsc 0 / build 0 |
| AC-014 | 见 `SA-023-four-viewport-regression.md` | PASS |
| AC-015 | 见 `SA-024-strict-geometry.md` | 263/0 × 2 口径 |
| AC-016 | 见 `SA-025-negative-controls.md` | NC1～NC4b 全部复现 |
| AC-017 | 见 `SA-021-scope-freeze-owner-decision.md` | PASS |

## 静态契约原始输出

```bash
cd ...-correction-001/frontend/src
grep -n "export" components/query-list/index.ts
```

```text
2:export { default as QueryListPageShell } from './QueryListPageShell.vue'
3:export { default as QueryListQueryPanel } from './QueryListQueryPanel.vue'
4:export { default as QueryListActions } from './QueryListActions.vue'
5:export { default as QueryListResultPanel } from './QueryListResultPanel.vue'
6:export { default as QueryListRefreshToolbar } from './QueryListRefreshToolbar.vue'
7:export { default as QueryListTooltipHost } from './QueryListTooltipHost.vue'
9:export type {
18:export { useQueryListTooltip, QUERY_LIST_TOOLTIP_DELAY_MS } from '@/composables/query-list/useQueryListTooltip'
```

```bash
grep -n "delayMs\|hide" components/query-list/types.ts
```

```text
49:  delayMs?: number
77:   * - `hide()`：无条件取消当前等待并关闭当前 Tooltip（滚动、resize、页面隐藏、记录整体替换、路由卸载等全局关闭）；
78:   * - `hide(key)`：仅当 `key` 等于当前等待目标或当前显示目标时才取消/关闭；key 已过期时 no-op，
81:  hide: (key?: string) => void
```

```bash
grep -n -A3 -B3 "<slot" components/query-list/QueryListPageShell.vue
```

```text
 1-<template>
 2-  <div class="ql-page">
 3-    <header v-if="showHeader" class="ql-page__header">
 4:      <slot name="header">
 5-        <h2 class="ql-page__title">{{ title }}</h2>
 7-        <p v-if="showDescription" class="ql-page__description">
 8-          <slot name="description">{{ description }}</slot>
 9-        </p>
10-      </slot>
11-      <slot name="header-extra" />
12-    </header>
13:    <slot />
14-  </div>
15-</template>
```

`<slot />` 直接位于 `.ql-page` 下，无默认插槽包装层。

```bash
grep -n "widthLock\|queryWidthPx\|resetWidthPx\|heightPx" components/query-list/QueryListActions.vue
```

```text
42:    queryWidthPx?: number
44:    resetWidthPx?: number
50:    heightPx?: number
55:    queryWidthPx: 62,
56:    resetWidthPx: 62,
59:    heightPx: undefined,
71:function widthLock(px: number): string {
76:  props.heightPx === undefined ? widthLock(props.queryWidthPx) : `${widthLock(props.queryWidthPx)};height:${props.heightPx}px`,
79:  props.heightPx === undefined ? widthLock(props.resetWidthPx) : `${widthLock(props.resetWidthPx)};height:${props.heightPx}px`,
```

四值同锁：`width` / `min-width` / `max-width` / `flex-basis` 由 `widthLock()` 单点产生，4 处引用。

```bash
grep -n "ql-result-panel__" components/query-list/QueryListResultPanel.vue
```

```text
 3:    <header class="ql-result-panel__header">
 4:      <div v-if="showSummary" class="ql-result-panel__summary">
 7:      <div class="ql-result-panel__toolbar">
11:    <div class="ql-result-panel__error-slot">
16:    <div class="ql-result-panel__divider"></div>
17:    <div class="ql-result-panel__body">
```

```bash
grep -n "aria-disabled\|:disabled\|disabled" components/query-list/QueryListRefreshToolbar.vue
# 34:      :aria-disabled="busy ? 'true' : undefined"
```

```bash
grep -rn "query-list-spinner.css" components/query-list/
```

```text
components/query-list/QueryListActions.vue:149:<style scoped src="./query-list-spinner.css"></style>
components/query-list/QueryListRefreshToolbar.vue:236:<style scoped src="./query-list-spinner.css"></style>
```

Spinner 规则源码只有 `query-list-spinner.css` 一份，两个消费者以外部 scoped stylesheet 引用同一来源。

## AC-007 全量结果

```text
1280x800 : {"total":58,"passed":58,"failed":0}  exit=0
1700x920 : {"total":58,"passed":58,"failed":0}  exit=0
1920x1080: {"total":58,"passed":58,"failed":0}  exit=0
2560x1440: {"total":58,"passed":58,"failed":0}  exit=0
```

## AC-009 / AC-010 / AC-012

```text
probe-candidate.mjs   -> 与正式验收采集 cand-fa.json 深度比较 realDiffs=0（label 除外）
                          候选 4 项出现 Tooltip，最大宽度 480，宿主唯一，无越界
probe-aria.mjs        -> {"total":7,"passed":7,"failed":0}
probe-lifecycle.mjs   -> life-fa.json 与本轮 sa012-lifecycle.json 除 label 外逐字节相同
                          firstLoad/query/refresh/failureRetain/afterFailureRecover/hiddenPause/restoreCatchUp 全一致
```

## 采样相位说明

`probe-indicators.mjs` 的 `states.querying` 快照存在相位抖动（本地请求常在取样点之间完成）：
同一构建连续三次运行分别得到 `["ql-btn-spinner is-visible"]/1/visible`、`hidden`、`hidden`。
其余结构字段与正式验收完全一致；确定性"切换契约"由 `probe-spinner-contract.mjs` 的
MutationObserver 路径覆盖且四视口全绿。该抖动属测试装置伪影，不计入产品差异。
