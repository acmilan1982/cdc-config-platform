# DSS-AC-065 R1 真实浏览器证据索引

- 任务：`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1`
- 目标页面：正式 `5173` 页面 `http://127.0.0.1:5173/monitor/data-source-state`（外部访问主机 `192.168.174.70`）
- 后端：正式 `8080`，`GET /api/monitor/data-source-run-state/list`
- 浏览器：Chromium（Playwright-core，CDP，`--no-sandbox`，headless，`deviceScaleFactor 1`），视口 `1920×1080`
- 真实性：**真实后端 + 真实页面 + 真实数据库**（补验期间 7 条已批准临时行已 `COMMIT` 在库），**不是**响应拦截 `BI`
- 只读性：脚本只导航、驱动只读查询控件、读取 DOM/计算样式，断言页面零写请求

## 运行方式

```bash
# 需真实后端 8080 与前端 5173 在运行
node docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1/browser/scripts/fa065-r1.cjs
```

## 脚本与产物

| 路径 | 内容 |
|---|---|
| `scripts/lib.cjs`、`scripts/harness.cjs` | 与 R0 逐字节一致的只读浏览器基座（`sha256` 见 `scripts/SHASUMS.txt`） |
| `scripts/fa065-r1.cjs` | 本次补验脚本：7 条临时行 + 排序 + 真实查询控件过滤 + 网络/Console 观测 |
| `rows.json` | 首次加载的 37 行完整 DOM 提取（序号/探针/停用标记/源库/状态标签/三时间列） |
| `fa065-cases.json` | 26 条断言与逐场景上下文（含各过滤阶段的 DOM 快照） |
| `SUMMARY.txt` | 断言汇总（PASS/FAIL）、行数与网络/Console 计数 |
| `screenshots/*.png` | 全表 + 各过滤态截图 |

## 断言清单（26 条，全部 PASS）

| 组 | 断言 | 说明 |
|---|---|---|
| 页面/全量 | `pageLoadsFormalRoute`、`runStateRowsAllRetained` | 正式路由加载，渲染 **37** 行（30 基线 + 7 临时） |
| 分布 | `statusDistribution17_7_13`、`warningRows7` | `快照进行中 17 / 未知状态 7 / 快照已完成 13`；未知行 **7** |
| 临时行 | `sevenTempRowsAllPresent`、`S1_completedRow`、`S2_unknownRow`、`S3_orphanProbeFallback`、`S4_orphanSourceFallback`、`S5_disabledProbeMark`、`S6_disabledSourceConfig`、`S7_nonSourceCategory` | 见下表 |
| 排序 | `sortRunningGroupHead`、`sortGroupBoundaries`、`sortUnknownGroupHead`、`sortCompletedGroupHead` | 组序 `RUNNING < UNKNOWN < COMPLETED`，组内 `UPDATED_AT` 降序 |
| 真实查询控件 | `uiFilter_client_hosp007`、`uiFilter_client_orphanProbe`、`uiFilter_client_hosp002_unknown`、`uiFilter_status_unknown`、`uiFilter_status_completed`、`uiFilter_source_orphanSource`、`resetRestoresAllRows` | 通过真实下拉 + 查询按钮过滤，重置恢复 37 行 |
| 网络/Console | `noWriteRequestFromPage`、`onlyListApiUsed`、`noConsoleOrPageErrors` | 非 `GET` 请求 0；仅使用 `/api/monitor/data-source-run-state/list`；Console/Page 错误 0 |

## 7 条已批准临时行的渲染核对

| 场景 | CLIENT_ID / DATA_SOURCE_ID | 页面表现 |
|---|---|---|
| S1 已完成 | `hosp-007` / `112-source-19c` | 探针 `hosp-007`（无停用标记）、源库 `孝感市第一人民医院`、`✓ 快照已完成`（`el-tag--success`）、`20:58:00 / 20:58:30 / 20:58:30` |
| S2 未知状态 | `hosp-002` / `112-source-19c` | 未知行（`dss-warning-row`）、`? 未知状态`（`el-tag--warning`）、`20:57:00 / -- / 20:57:00` |
| S3 孤立探针 | `dss-fa065-r1-client-orphan` / `112-source-19c` | 探针列回退为**原始 ID**（非空、无“停用”）、源库正常显示、`● 快照进行中` |
| S4 孤立源库 | `hosp-0061` / `dss-fa065-r1-source-orphan` | 源库列回退为**原始 ID**（无“停用”）、`✓ 快照已完成`、`20:55:00 / 20:55:30` |
| S5 停用探针 | `CCFG-AC-R1-OFF` / `112-source-19c` | 探针 `CCFG-AC-R1-OFF` **带“停用”标记**、`● 快照进行中` |
| S6 停用源库 | `CCFG-AC-R1-ON` / `199-source` | 源库显示 `业务库`、探针无停用标记、`● 快照进行中` |
| S7 非 SOURCE 类别 | `hosp-012` / `company-target-doris-v4` | 源库显示 `doirs库`、`快照启动时间 --`（NULL）、`● 快照进行中` |

**结论**：7 条临时行**全部保留**、未被关联缺失/停用/类别异常过滤；回退、停用标记、状态标签、三时间列与排序均符合当前批准规则；页面零写、Console 干净。

> 截图仅作旁证；判定以同次运行的 `fa065-cases.json` / `rows.json` 结构化 DOM 测量为准。
