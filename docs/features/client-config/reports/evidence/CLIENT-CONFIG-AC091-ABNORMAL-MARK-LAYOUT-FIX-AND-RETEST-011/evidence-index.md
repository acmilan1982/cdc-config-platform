# 011 证据索引

任务：`CLIENT-CONFIG-AC091-ABNORMAL-MARK-LAYOUT-FIX-AND-RETEST-011`
基线：`545e915b034e117e9c0b899ac9a16c7bd0aba1ad`
证据根：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC091-ABNORMAL-MARK-LAYOUT-FIX-AND-RETEST-011/`

所有 JSON 为实测原始值（脱敏，仅判定字段）；截图仅辅助，判定以原始几何/计算样式为准。
改前（before/）与改后（after/）使用同一探针、同一组样本、同一原始状态。

## 1. 探针与环境

| 证据 | 路径 | 说明 |
|---|---|---|
| 探针脚本 | `probes/ac091-layout-probe.js` | 网络门禁 + 两视口采集；逐字符可见性、DOMRect、计算样式、操作列命中测试、Tooltip、编辑入口、菜单 |
| 环境与版本 | `environment-and-version.txt` | 分支/基线、JDK/Maven/Node/npm、服务 PID/端口、DB 身份、浏览器/DPR/视口、采集 UTC 时间 |
| 数据库夹具台账 | `sql-fixture-ledger.txt` | 3 条 INSERT + 1 COMMIT、影响 3 行、回读、留存与回滚语句 |

## 2. 改前（基线未修改源码）

原始 JSON（1440x900 / 1920x1080）：
- `before/raw/client-011-1440x900.json`
- `before/raw/client-011-1920x1080.json`

关键实测（两视口一致）：
- `rows.abnormal12.mark.textMetrics`：text=`异常：X`，visibleText=`异常：`，clipped=true，
  clientWidth/scrollWidth=49/52 → 原始值 `X` 不可见（010 反例在基线真实页面复现）。
- `rows.abnormalMax.mark.textMetrics`：visibleText=`异`，clipped=true，29/52 →
  长度上限异常样本标识被裁切至单字。
- `rows.abnormal12.idMetrics`：visibleText=`CCFG010-AB`，clipped=true。
- `rows.abnormal12.mark.overlapsOperationColumn=false`；`rows.*.operation.hit.insideOperationCell=true`。
- 启用 `hosp-012` 无标识；停用 `hosp-008` 显示 `停用`；短异常 `CCFG012X` 完整 `异常：X`。

截图：`before/screenshots/client-011-{enabled,disabled,abnormal-short,abnormal-12,abnormal-max,normal-long}-{1440x900,1920x1080}.png`
数据源参考页：`before/screenshots/ds-011-{enabled,inactive}-id-{1440x900,1920x1080}.png`

## 3. 改后（应用 CSS 修复）

原始 JSON：
- `after/raw/client-011-1440x900.json`
- `after/raw/client-011-1920x1080.json`

关键实测（两视口一致）：
- `rows.abnormal12.mark.textMetrics`：text=`异常：X`，visibleText=`异常：X`，clipped=false，
  clientWidth/scrollWidth=52/52；`mark.rect.right == idCellRect.right`（526），
  `extendsBeyondTdRight=-12`（仍在 td 内），`overlapsOperationColumn=false`。
- `rows.abnormalMax.mark.textMetrics`：visibleText=`异常：X`，clipped=false，52/52。
- `rows.abnormal12.idMetrics`：visibleText=`CCFG010-AB`，clipped=true，94/106 → ID 正文单行省略。
- `rows.abnormalMax.idMetrics`：clipped=true，94/282 → ID 正文单行省略。
- `interactions.abnormal12.idTip` / `abnormalMax.idTip`：visible=true，
  text 为原始完整 ID；`idTipCoversMark=false`（Tooltip 不遮住异常原值）。
- `interactions.*.markTip`：text=`异常：X`，visible=true。
- `interactions.*.mouseEntry` / `keyboardEntry`：标题`编辑探针`，`closedWithoutSave=true`；
  `focus`：tabIndex=0、role=button、aria-label=`编辑探针 {ID}`、Enter 打开弹窗。
- `abnormalMenu` / `abnormalMaxMenu`：`[停用, 删除]`（无`启用`）。
- 启用无标识；停用 `停用`；`normalLongTooltip` 完整 ID + `normalLongEditEntry` 正常。
- 数据源参考正文 `color=rgb(9,9,11)`、`font-weight=600`，与探针 ID 正文一致；
  `dataSource.measurements.*.contrast` 见原始 JSON。
- `env`：DPR=1、页缩放 100%、`.sidebar` 220px 展开、fonts=loaded、无 SW 控制。
- `backendNonGetForwarded=0`、`blockedBusinessNonGet=0`、`errors=[]`。

截图：`after/screenshots/client-011-*-{1440x900,1920x1080}.png`
数据源参考页：`after/screenshots/ds-011-*-{1440x900,1920x1080}.png`

## 4. 网络台账

- `network/ledger-1440x900.json`、`network/ledger-1920x1080.json`：逐请求 method/url/resourceType/allowed/reason。
- `network/run-meta.json`、`network/run-summary.json`：门禁白名单、浏览器版本、样本、起止时间。
- before/after 各 124 条请求；blocked=0；business non-GET forwarded=0；browser errors=0。

## 5. 样本依据

- `before/samples/sample-basis.json`、`after/samples/sample-basis.json`：只读 API 回读的
  `clientId`、`status`、`fgActive`、长度、`dataSourceCount` 等判定字段，不含凭据/连接串/完整业务记录。
- 三态：`hosp-012`('1')、`hosp-008`('0')、`CCFG012X`('X', 8)、`CCFG010-ABN1`('X', 12)、
  `CCFG011-ABNORMAL-LENGTH-MAX-6789`('X', 32)；普通长 ID `CCFG004-LONGID-0123456789ABCDEFG`。
- 参考数据源：`77711`('1')、`s-dssr1-0906-1`('0')。

## 6. 测试与构建（本地命令，非证据文件）

- `npx vitest run src/views/client-config/ClientConfigPage.spec.ts`：186 passed。
- `npm run build`：`vue-tsc --noEmit && vite build` 成功（20.98s）。

## 7. 完整性

- `SHA256SUMS`：本目录所有证据文件的 SHA-256（不含 `SHA256SUMS` 自身）。
- 010/R1 原始报告与证据目录未修改；本轮改前/改后 ID 与状态相同，未缩短 ID、未改状态、未改列宽。
