# CLIENT-CONFIG-FOUR-REFERENCE-LIVE-ACCEPTANCE-009 证据索引

- 任务：`CLIENT-CONFIG-FOUR-REFERENCE-LIVE-ACCEPTANCE-009`
- 固定基线：`5539f18f71664391007cb1fae084fad9970dd9ed`（`develop`，008 远端复审通过）
- 采集对象：`/config/client` 与 `/config/data-source` 现场只读对照，1440×900 / 1920×1080
- 浏览器：Chrome for Testing 147.0.7727.15（headless），DPR 1，100% 缩放，侧栏展开 220px
- 原始采集时间：2026-11-09T05:37:12.619Z ～ 2026-11-09T05:37:46.880Z（UTC）；本地 13:37

## 1. 文件与证据键

| 文件 | 内容 | 主要证据键 |
|---|---|---|
| `probes/four-reference-live-probe.js` | 只读对照探针；context 级 service worker 禁用与网络门禁；两视口配对采集 | gate、`pageCollectClient`、`pageCollectDataSource` |
| `environment-and-version.txt` | Git、主机、前后端进程、浏览器与采集条件、门禁计数 | 环境与版本 |
| `raw/client-and-ds-1440x900.json` | 1440×900 两页环境、四 AC 原始测量、Tooltip、三种编辑入口 | `client.measurements.ac079/087/091/094`、`dataSource.measurements.*`、`client.longIdTooltip`、`client.keyboardFocus`、`client.mouseEditEntry`、`client.idDblClickEditEntry`、`client.keyboardEditEntry` |
| `raw/client-and-ds-1920x1080.json` | 1920×1080 同结构原始测量 | 同上 |
| `network/ledger-1440x900.json` | 1440×900 完整请求台账与计数 | `entries[]`、`backendNonGetForwarded`、`blockedCount`、`allowedCount` |
| `network/ledger-1920x1080.json` | 1920×1080 完整请求台账与计数 | 同上 |
| `network/run-meta.json` | 运行身份、允许清单、视口、样本键 | `browserVersion`、`serviceWorkers`、`allowlistedReadOnlyApis` |
| `network/run-summary.json` | 运行起止时间与运行身份 | `startedAt`、`finishedAt` |
| `samples/sample-basis.json` | 脱敏样本依据（直接只读 GET；仅保留判定字段） | `endpoints.clients.samples`、`endpoints.dataSources.samples`、`fgActiveValues` |
| `screenshots/client-079-header-*.png` | 探针端结果区头部（含新增按钮位置） | AC-079 |
| `screenshots/ds-079-header-*.png` | 参考页结果区头部（含新增按钮位置） | AC-079 |
| `screenshots/client-091-enabled-id-*.png` | 探针端启用行 ID 单元格（合成样本 probe-001） | AC-091 |
| `screenshots/client-087-091-disabled-id-*.png` | 探针端停用行 ID + “停用”标识（合成样本 hosp-008） | AC-087/091 |
| `screenshots/ds-087-091-inactive-id-*.png` | 参考页停用行 ID + “停用”标识（合成样本 s-dssr1-0906-1） | AC-087/091 |
| `screenshots/client-094-green-tag-*.png` | 探针端绿色数据源标签（合成样本 S3AC-ORG） | AC-094 |
| `screenshots/ds-094-source-tag-*.png` | 参考页“源库”角色标签 | AC-094 |
| `screenshots/ds-094-target-tag-*.png` | 参考页“目标库”角色标签 | AC-094 |
| `SHA256SUMS` | 本目录除自身外全部文件的 SHA256 | 完整性校验 |

## 2. 逐 AC 证据定位

| AC | 判定 | 主证据键 | 关键值 |
|---|---|---|---|
| `CCFG-AC-079` | PASS | `client.measurements.ac079`、`dataSource.measurements.ac079` | 两视口两页按钮均为工具栏最后元素、距工具栏右缘 0、距头部右缘 16px；头部左侧按钮数 0 |
| `CCFG-AC-087` | PASS | `*.measurements.ac087` | 两页列序均为“序号”后紧接 ID 列；启用行无标识；停用标识计算样式逐属性一致（20px/4px/11px/700/#991b1b/#fee2e2/0 6px）；与操作列无相交 |
| `CCFG-AC-091` | BLOCKED | `client.measurements.ac091`、`dataSource.measurements.ac091`、`client.longIdTooltip`、`client.keyboardFocus`、`client.*EditEntry` | ID 正文颜色与字重两页一致（#09090b/600，对比度 19.9:1）；长 ID 单行省略且 Tooltip 完整；鼠标双击/ID 双击/键盘 Enter 均打开编辑弹窗并取消；**异常态样本缺失**（92 条探针 fgActive 仅 `0`/`1`），三态步骤未齐 |
| `CCFG-AC-094` | PASS | `client.measurements.ac094`、`dataSource.measurements.ac094` | 样本无项级异常且无整行歧义；绿色标签与参考成功角色标签盒模型/配色一致（20px/4px/无边框/12px 600/#ecfdf5/#047857）；文字水平/垂直居中偏差 0、无裁切 |

## 3. 门禁与写入台账

| 视口 | 请求总数 | 静态 GET | 只读 API GET | 阻断 | 业务非 GET 转发 | 业务写入 |
|---|---|---|---|---|---|---|
| 1440×900 | 122 | 117 | 5 | 0 | 0 | 0 |
| 1920×1080 | 122 | 117 | 5 | 0 | 0 | 0 |

- 只读 API GET：`/api/clients` 1、`/api/clients/data-source-options` 3（三次打开编辑弹窗）、`/api/data-sources` 1。
- 编辑弹窗均通过“取消”关闭，未保存；无 POST/PUT/DELETE 到达后端。
- 未创建夹具、未直连数据库、未操作 ZooKeeper/Kafka、未访问其他业务页面。
