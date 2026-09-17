# SA-020 公共默认 320ms 冻结

## 1. 控制器声明

```bash
grep -n "QUERY_LIST_TOOLTIP_DELAY_MS" src/composables/query-list/useQueryListTooltip.ts
# 11:export const QUERY_LIST_TOOLTIP_DELAY_MS = 320
```

```ts
function normalizeDelayMs(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : QUERY_LIST_TOOLTIP_DELAY_MS
}
```

```text
default_tooltip_delay_ms=320
status_tooltip_delay_ms=0
```

## 2. 单元证据（`useQueryListTooltip.spec.ts` 41/41）

```text
✓ 省略 delayMs 仍走公共默认 320ms：319ms 不显示、320ms 才显示
✓ delayMs=0 同步成为当前目标，且不创建任何等待定时器
✓ delayMs=0 的即时目标与延迟目标共享同一单实例语义（新目标先即时关闭旧项）
✓ delayMs 为有限正数时按该毫秒数显示
✓ 负数 / NaN / Infinity / 非 number 一律不隐式转换，统一退回公共默认 320ms
✓ delayMs=0 时空内容仍然立即关闭，不产生 Tooltip
✓ delayMs 只改显示时机：内容、锚点、maxWidthPx 与 ARIA 行为完全一致
```

非法值清单由测试逐项覆盖：`-1`、`NaN`、`Infinity`、`-Infinity`、`'320'`（字符串）等一律回落 320，无隐式转换。

## 3. 组件层证据（`DataSourceSnapshotTable.spec.ts` / `DataSourceSnapshotQueryBar.spec.ts`）

```text
✓ 快照状态显式传 delayMs:0（小命中区同步成为当前目标，不依赖 320ms 连续停留）
✓ 探针端与源库不传 delayMs：保持公共默认 320ms，不得成为即时
✓ 查询候选延用公共默认 320ms：不传 delayMs（不得被本任务顺手改为即时）
```

## 4. 真实浏览器对照

`browser-verify.mjs`（真实指针）：

```text
PASS  慢速进入状态背景框：立即进入显示流程（揭示耗时 < 320ms）
PASS  探针端仍为公共默认 320ms：快速穿过不显示、停留后显示
PASS  源库仍为公共默认 320ms：快速穿过不显示、停留后显示
PASS  查询候选仍为公共默认 320ms：快速悬停不显示、停留后显示完整描述
```

```text
probe_tooltip_default_delay_status=PASS
source_tooltip_default_delay_status=PASS
query_candidate_tooltip_default_delay_status=PASS
```

`probe-candidate.mjs` 另测：查询候选 Tooltip 最大实测宽度 480（上限未被 delay 改动影响），
判定阈值仍为原始 `CLIENT_DESC` code point 长度 > 20。

## 5. 数据条件

三个对照类别（探针端 / 源库 / 查询候选）在现有数据下**均可观测**并通过，
未出现 `NOT_OBSERVABLE_DATA_CONDITION`；未修改数据库制造数据。
