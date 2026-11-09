# CLIENT-CONFIG-AC091-ABNORMAL-STATE-LIVE-ACCEPTANCE-010 证据索引

- 任务：`CLIENT-CONFIG-AC091-ABNORMAL-STATE-LIVE-ACCEPTANCE-010`
- 固定基线：`9371e932ecd2fb2eab9861a6c1e383c0dd9ecec1`（`develop`，009 结果提交）
- 采集对象：`/config/client` 三态 ID 正文 + 异常标识 + 编辑入口；`/config/data-source` ID 正文只读对照；1440×900 / 1920×1080
- 浏览器：Chrome for Testing 147.0.7727.15（headless），DPR 1，100% 缩放，侧栏展开 220px
- 采集时间：2026-11-09T05:51:03.743Z ～ 2026-11-09T05:51:36.233Z（UTC）；本地 13:51

## 1. 文件与证据键

| 文件 | 内容 | 主要证据键 |
|---|---|---|
| `probes/ac091-abnormal-live-probe.js` | 门禁探针；三态正文/标识/编辑入口两视口配对采集 | `pageCollectClient091`、`pageCollectDataSource091` |
| `environment-and-version.txt` | Git、主机、前后端进程、浏览器与采集条件、门禁计数 | 环境与版本 |
| `sql-fixture-ledger.txt` | 夹具授权、只读核对、INSERT/UPDATE/COMMIT 逐条台账、影响行数、留存与回滚 | 直接 DML 与事务控制 |
| `raw/client-091-1440x900.json` | 1440×900 环境、三态正文、异常标识、Tooltip、焦点、编辑入口、参考页正文 | `client.measurements.ac091.*`、`client.abnormalMarkTooltip`、`client.abnormalKeyboardFocus`、`client.abnormalMouseEditEntry`、`client.abnormalKeyboardEditEntry`、`client.longIdTooltip`、`dataSource.measurements.*` |
| `raw/client-091-1920x1080.json` | 1920×1080 同结构原始测量 | 同上 |
| `network/ledger-1440x900.json` | 1440×900 完整请求台账 | `entries[]`、`backendNonGetForwarded`、`blockedCount`、`allowedCount` |
| `network/ledger-1920x1080.json` | 1920×1080 完整请求台账 | 同上 |
| `network/run-meta.json` | 运行身份、允许清单、视口、样本、夹具说明 | `browserVersion`、`serviceWorkers`、`allowlistedReadOnlyApis`、`fixture` |
| `network/run-summary.json` | 运行起止时间与运行身份 | `startedAt`、`finishedAt` |
| `samples/sample-basis.json` | 脱敏样本依据（直接只读 GET；仅保留判定字段） | `endpoints.clients.fgActiveDistribution`、`samples.enabled/disabled/abnormal/long`、`endpoints.dataSources.samples` |
| `screenshots/client-091-enabled-id-*.png` | 启用行 ID 单元格（probe-001，无标识） | AC-091 |
| `screenshots/client-091-disabled-id-*.png` | 停用行 ID + “停用”标识（hosp-008） | AC-091 |
| `screenshots/client-091-abnormal-id-*.png` | 异常行 ID + “异常：X”标识（CCFG010X，合成样本） | AC-091 |
| `screenshots/ds-091-enabled-id-*.png` | 参考页启用 ID 正文（77711） | AC-091 |
| `screenshots/ds-091-inactive-id-*.png` | 参考页停用 ID 正文（s-dssr1-0906-1） | AC-091 |
| `SHA256SUMS` | 本目录除自身外全部文件的 SHA256 | 完整性校验 |

## 2. CCFG-AC-091 逐视口证据定位

| 要求 | 证据键 | 1440×900 | 1920×1080 |
|---|---|---|---|
| 三态 ID 正文 color | `client.measurements.ac091.{enabled,disabled,abnormal}.bodyStyle.color` | 均 `rgb(9, 9, 11)` | 均 `rgb(9, 9, 11)` |
| 三态 ID 正文字重 | `...bodyStyle.font-weight` | 均 `600` | 均 `600` |
| 实际单元格背景 | `...effectiveCellBackground.value` | 均 `rgb(255, 255, 255)` | 均 `rgb(255, 255, 255)` |
| 对比度 | `...contrast` | 均 `19.9` | 均 `19.9` |
| 与参考页正文一致 | `dataSource.measurements.{enabled,inactive}` | `rgb(9,9,11)` / `600` / `19.9` | 同左 |
| 启用无标识 | `...enabled.markers` | 无 inactive/abnormal | 同左 |
| 停用仅“停用” | `...disabled.markers` | 有“停用”、无异常 | 同左 |
| 异常标识完整文本 | `...abnormal.markers.abnormalText`、`client.abnormalMarkTooltip.text` | `异常：X` | `异常：X` |
| 异常标识独立于正文 | `...abnormal.mark.separateElementFromIdBody`、`markColorEqualsBodyColor` | `true` / `false` | 同左 |
| 异常标识红色视觉 | `...abnormal.mark.style.{color,background-color,height,line-height,padding,border-radius,font-size,font-weight}` | `#b91c1c` on `#fee2e2`、20px/20px、0 6px、4px、11px/700 | 同左 |
| 标识间距与垂直居中 | `...abnormal.mark.{offsetFromIdRight,centerYDeltaFromId}` | `6` / `0` | `6` / `0` |
| 标识未裁切 | `...abnormal.mark.{clipped,clientWidth,scrollWidth}` | `false` / 52 / 52 | 同左 |
| 长 ID 单行省略 | `...longId.{clientWidth,scrollWidth,truncated}` | 152 / 274 / `true` | 同左 |
| 长 ID 完整 Tooltip | `client.longIdTooltip` | 完整 ID、`role=tooltip` | 同左 |
| 键盘聚焦 | `client.abnormalKeyboardFocus` | `tabIndex=0`、`role=button`、`aria-label=编辑探针 CCFG010X`、焦点描边可见 | 同左 |
| 鼠标编辑入口 | `client.abnormalMouseEditEntry` | ID 双击 → “编辑探针”弹窗，取消关闭未保存 | 同左 |
| 键盘编辑入口 | `client.abnormalKeyboardEditEntry` | ID 聚焦 + Enter → “编辑探针”弹窗，取消关闭未保存 | 同左 |

## 3. 门禁与夹具分账

| 视口 | 请求总数 | 静态 GET | 只读 API GET | 阻断 | 业务非 GET 转发 | 浏览器错误 |
|---|---|---|---|---|---|---|
| 1440×900 | 121 | 117 | 4 | 0 | 0 | 0 |
| 1920×1080 | 121 | 117 | 4 | 0 | 0 | 0 |

- 只读 API GET：`/api/clients?status=ALL` 1、`/api/clients/data-source-options` 2（两次打开异常行编辑弹窗）、`/api/data-sources` 1（参考页）。
- 夹具分账（SQL*Plus 直连，见 `sql-fixture-ledger.txt`）：直接 DML 2（INSERT 1 + UPDATE 1）、事务控制 2（COMMIT ×2）、影响 1 行；业务 API 写入 0。
- 编辑弹窗均通过“取消”关闭，未保存；无 POST/PUT/DELETE 到达后端。
- 未访问其他业务页面；未操作 ZooKeeper/Kafka；未修改 `CDC_DATA_SOURCE`。

## 4. 与 009 证据的引用关系

- 009 原始证据（`../CLIENT-CONFIG-FOUR-REFERENCE-LIVE-ACCEPTANCE-009/`）与本轮同一浏览器版本/DPR/缩放/侧栏条件；本轮该目录未改动。
- 本轮在相同条件下现场复核了 `CCFG-AC-091` 的长 ID 省略与 Tooltip、三态正文与参考正文，未仅依赖 009 静态引用。
- 009 中 `CCFG-AC-091` 因异常样本缺失维持 `BLOCKED`；本轮通过授权夹具补齐后按原条款重新判定。
