# SA-018 快照状态即时显示可靠性

## 1. 方法

`/tmp/query-list-page-shared-tooltip-hover-reliability-supplemental-fa-001/sa018.mjs`

```bash
node sa018.mjs http://127.0.0.1:5173 <out.json> 1920 1080 <cdpPort>
node sa018.mjs http://127.0.0.1:5173 <out.json> 1280  800 <cdpPort>
```

- 全部悬停使用 CDP `Input.dispatchMouseEvent` 真实指针事件，**未**在页面上下文调用 Tooltip 控制器；
- 每次进入前先把鼠标移到表格外安全位置（`elementFromPoint` 校验命中且不落在 `.el-table` 内），
  再快速直入该行状态背景框中心，**不人为等待 320ms**；
- 期望内容按后端 `records[rowIndex].snapshotStatus` 计算为 `原始状态：<SNAPSHOT_*>`；
  表格无排序列，DOM 行序与后端记录序一致；
- 全程逐帧采样 `.ql-tooltip` 宿主数；
- 阶段：首载 → 真实点击"查询"并等待结果替换 → 查询后重复全部动作。

## 2. 结果

### 1920x1080 — PASS 10/10

```text
首载：快速直入 20 次全部成功（20/20）                     PASS
查询后：快速直入 20 次全部成功（20/20）                   PASS
首载：快速扫行全部成为当前目标（扫过 12 行 / 可见 20 行，成功 12）  PASS
查询后：快速扫行全部成为当前目标（扫过 12 行，成功 12）      PASS
首载：相邻两行往返 40 次（80 次进入）全部成功              PASS
查询后：相邻两行往返 40 次（80 次进入）全部成功            PASS
全程同屏 .ql-tooltip 宿主数始终 ≤ 1（含逐帧采样）          PASS  maxHosts=1 violations=0
首载/查询后扫行结束离开后宿主与 ARIA 关联均清零            PASS
往返结束离开后无残留                                      PASS
无阻塞性控制台错误                                        PASS
```

### 1280x800 — PASS 10/10

```text
首载：快速直入 20 次全部成功（20/20）                     PASS
查询后：快速直入 20 次全部成功（20/20）                   PASS
首载：快速扫行全部成为当前目标（扫过 12 行 / 可见 14 行，成功 12）  PASS
查询后：快速扫行全部成为当前目标（扫过 12 行，成功 12）      PASS
首载：相邻两行往返 40 次（80 次进入）全部成功              PASS
查询后：相邻两行往返 40 次（80 次进入）全部成功            PASS
全程同屏 .ql-tooltip 宿主数始终 ≤ 1（含逐帧采样）          PASS  maxHosts=1 violations=0
首载/查询后扫行结束离开后宿主与 ARIA 关联均清零            PASS
往返结束离开后无残留                                      PASS
无阻塞性控制台错误                                        PASS
```

## 3. 计数汇总（本任务结果字段）

```text
status_fast_direct_entry_1280_attempt_count=20
status_fast_direct_entry_1280_success_count=20
status_fast_direct_entry_1920_attempt_count=20
status_fast_direct_entry_1920_success_count=20
status_rapid_row_sweep_status=PASS（1280: 12 行；1920: 12 行；两阶段均全成功）
status_two_row_round_trip_status=PASS（每视口每阶段 40 次往返 / 80 次进入，全成功）
stale_mouseleave_protection_status=PASS（旧行延迟 mouseleave 未关闭新行目标）
single_tooltip_status=PASS
tooltip_host_max_count=1
status_tooltip_delay_ms=0
```

合计快速直入尝试 80 次（两视口 × 两阶段 × 20），成功 80 次，失败 0 次；
扫行 4 段共 48 行次全部成为当前目标；两行往返 160 次进入全部成功。

> 阶段计数按任务字段口径记录为每阶段 20 次；`sa018.mjs` 输出的 `fastEntries=40/40`
> 为首载 + 查询后两阶段合计。

## 4. 数据条件

`原始状态` 存在互异可辨识的值（如 `SNAPSHOT_RUNNING` 与 `SNAPSHOT_STALE`）；
两行往返固定选取状态互异的相邻两行。不存在因数据不足产生的不可观测项。
未修改数据库制造数据。
