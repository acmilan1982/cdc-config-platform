# CLIENT-CONFIG-AC091-ABNORMAL-MARK-LAYOUT-FIX-AND-RETEST-011 验收报告

- 任务编号：`CLIENT-CONFIG-AC091-ABNORMAL-MARK-LAYOUT-FIX-AND-RETEST-011`
- 分支：`develop`
- 固定基线：`545e915b034e117e9c0b899ac9a16c7bd0aba1ad`（010-R1 文档复审通过）
- 依据：`docs/prompts/client-config/CLIENT-CONFIG-AC091-ABNORMAL-MARK-LAYOUT-FIX-AND-RETEST-011-Agent-Prompt.md`
- 证据目录：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC091-ABNORMAL-MARK-LAYOUT-FIX-AND-RETEST-011/`
- 结论：**`CCFG-AC-091 = PASS`；`CCFG-AC-088` 回归通过**。统计 **157 PASS / 0 FAIL / 0 BLOCKED / 0 NOT_RUN = 157**，`changed_ids=[CCFG-AC-091]`。
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_AC091_ABNORMAL_MARK_LAYOUT_FIX_AND_RETEST_011_REVIEW`

## 1. 结论

在固定基线真实页面复现 010 反例：12 字符异常 ID `CCFG010-ABN1` 的标识只显示「异常…」、原始值 `X` 不可见；32 字符上限样本显示「异」。根因是异常标识自身参与 Flex 收缩并被省略。

本轮只修改 `ClientConfigPage.vue` 的异常标识规则：标识改为不收缩、不省略，列宽不足时由**ID 正文**单行省略（既有 Tooltip 返回完整 ID）。改后两视口均实测 `异常：X` 逐字符完整、`clipped=false`，不越过单元格、不覆盖最右固定“操作”列；ID 正文按预期省略且完整值 Tooltip 可用；鼠标/键盘编辑入口、三态语义、菜单与相邻行行为均无回归。

因此 `CCFG-AC-091` 由 `FAIL` 改判 `PASS`；`CCFG-AC-088` 维持 `PASS` 并完成回归。统计为 **157/0/0/0**。本报告不自行标记 Feature 正式接受。

## 2. 授权与边界

- 负责人已授权本任务操作开发库 `CDC_CLIENT_MULTIPLE` 并自行补齐样本。
- 执行前只读核对目标为项目 CLAUDE.md §11 指定的 Oracle 开发库 CDC schema（`USER=CDC`、`DB_NAME=prod`、`SERVER_HOST=snoopy-linux`）。
- 仅操作 `CDC_CLIENT_MULTIPLE`：新增 3 条精确主键、可识别、不关联实际运行对象的合成异常行；未修改业务旧行、其他表、表结构、配置、ZooKeeper、Kafka 或同步进程。
- 产品代码仅改 `/config/client` 页面内 ID 单元格局部样式（`ClientConfigPage.vue`）与对应静态测试；未改公共 CSS、其他页面、后端逻辑、列宽或验收门槛。
- 前后对比使用同一组 ID 与同一原始状态（`FG_ACTIVE='X'`），未缩短 ID、未改状态、未改列宽。

## 3. 开工现场与基线

| 项 | 实际值 |
|---|---|
| 分支 | `develop` |
| 任务开始前 Commit | `545e915b034e117e9c0b899ac9a16c7bd0aba1ad` |
| `origin/develop`（开工/推送前） | 同上 |
| 工作区既有改动 | `.claude/settings.local.json`、`docs/prompts/`、`runtime-logs/`（未纳入本轮） |

未执行 reset/clean/stash/checkout，未覆盖无关改动；分支、基线、远端一致，无分叉。

## 4. 根因与修复

### 4.1 根因（改前实测）

`.cc-id-cell` 为 Flex 行；`.cc-id` 与 `.cc-abnormal-mark` 都设置 `flex: 0 1 auto; min-width: 0`，异常标识还带 `max-width: 100%`、`overflow: hidden`、`text-overflow: ellipsis`。ID 较长时两者按基础宽度分摊收缩量，标识被压缩并省略：

- `CCFG010-ABN1`（12 字符）：标识 `clientWidth/scrollWidth = 49/52`，可见文本仅 `异常：`，`X` 不可见。
- `CCFG011-ABNORMAL-LENGTH-MAX-6789`（32 字符）：标识 `29/52`，可见文本仅 `异`。

这正是 010 记录但未入仓原始几何的长样本反例；本轮已在基线真实页面取得改前截图与逐视口几何。

### 4.2 修复（最小范围）

`frontend/src/views/client-config/ClientConfigPage.vue`：

```css
.cc-abnormal-mark {
  display: inline-block;
  flex: 0 0 auto;      /* 不再参与收缩 */
  box-sizing: border-box;
  padding: 0 6px;
  height: 20px;
  border-radius: 4px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  white-space: nowrap;
}
```

移除 `min-width: 0`、`max-width: 100%`、`overflow: hidden`、`text-overflow: ellipsis`。`.cc-id` 仍为可收缩并省略的一侧（`flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`）。同步更新 `ClientConfigPage.spec.ts` 中对应的静态断言（标识完整、不省略；ID 承担省略）。

## 5. 数据库夹具与写操作分账

细节见证据目录 `sql-fixture-ledger.txt`。

| 项目 | 数量 |
|---|---|
| 直接 DML 操作 | 3（3 条 INSERT） |
| 事务控制语句 | 1（COMMIT） |
| 累计影响行数 | 3（三条独立合成行） |
| 业务 API 写入（POST/PUT/DELETE） | 0 |
| 留存合成记录 | 3 条 |

新增样本（`FG_ACTIVE='X'`，`DATA_SOURCE_ID=NULL`）：

- `CCFG012X`（8 字符，短异常）
- `CCFG010-ABN1`（12 字符，010 原反例）
- `CCFG011-ABNORMAL-LENGTH-MAX-6789`（32 字符，`CLIENT_ID VARCHAR2(32)` 上限）

写后分布：`'0'` 92 / `'1'` 1 / `'X'` 3 = 96 行。API 与 SQL*Plus 回读 `FG_ACTIVE` 原样为 `X`。开工时既有 010 样本 `CCFG010X` 已被外部改为 `'0'`；本任务未覆盖既有行。回滚语句备查未执行。

## 6. 环境与采集条件

细节见 `environment-and-version.txt`。

- 后端：既有产物 jar，`--spring.profiles.active=dev`，实际 PID `3667`（包装 `3665`），`*:8080`，健康检查 200；启动后未重建。
- 前端：Vite dev server，实际 PID `3717`（包装 `3716`），`0.0.0.0:5173`，直接服务当前工作区源码；改后采集在同一实例重新导航加载修复后源码。
- 浏览器：Chrome for Testing `147.0.7727.15`（headless），DPR 1，100% 缩放，侧栏展开 `220px`，`document.fonts.status=loaded`。
- 网络门禁：首次导航前安装 context 级 route，`serviceWorkers='block'`；仅放行同源静态 GET 与 `/api/clients`、`/api/clients/data-source-options`、`/api/data-sources` 只读 GET。
- 采集时间（UTC）：before `05:17:53Z~05:18:46Z`；after `05:19:05Z~05:19:54Z`。
- 服务仅停止本轮自行启动的进程。

## 7. 改前（基线真实页面）证据

原始值：`before/raw/client-011-1440x900.json`、`before/raw/client-011-1920x1080.json`；截图 `before/screenshots/`。两视口一致。

| 样本 | ID 正文可见/省略 | 异常标识可见 | 标识 client/scroll | 裁切 | 操作列命中 |
|---|---|---|---|---|---|
| `CCFG010-ABN1` | `CCFG010-AB`，clipped | `异常：`（`X` 不可见） | 49/52 | true | true |
| `CCFG011-...-6789` | `CCFG011-ABNO`，clipped | `异` | 29/52 | true | true |

改前截图直观显示「CCFG010-A… 异常…」与「CCFG011-A… 异…」。启用 `hosp-012` 无标识；停用 `hosp-008` 显示 `停用`；短异常 `CCFG012X` 完整 `异常：X`。

## 8. 改后逐视口证据

原始值：`after/raw/client-011-1440x900.json`、`after/raw/client-011-1920x1080.json`；截图 `after/screenshots/`。两视口一致。

### 8.1 AC-091 ID 正文与布局

| 项目 | 1440×900 | 1920×1080 | 证据键 |
|---|---|---|---|
| 启用/停用/异常 ID 正文 | `rgb(9,9,11)` / `600` / `14px` | 同左 | `rows.*.bodyStyle` |
| 三态实际背景 | `rgb(255,255,255)` | 同左 | `rows.*.effectiveCellBackground.value` |
| 对比度 | `19.9` | 同左 | `rows.*.contrast` |
| 参考页数据源 ID 正文 | `rgb(9,9,11)` / `600` / 对比度 `19.9` | 同左 | `dataSource.measurements.*` |
| `CCFG010-ABN1` ID 正文 | 可见 `CCFG010-AB`，`clipped=true`，`94/106` | 同左 | `rows.abnormal12.idMetrics` |
| 上限 ID 正文 | 可见 `CCFG011-AB`，`clipped=true`，`94/282` | 同左 | `rows.abnormalMax.idMetrics` |
| ID 单行 | `noWrap=true` | 同左 | `rows.*.noWrap` |
| 完整值 Tooltip | 完整 `CCFG010-ABN1` / `CCFG011-...-6789`，可见 `role=tooltip` | 同左 | `client.interactions.*.idTip` |

结论：ID 正文颜色/字重与参考页一致；空间不足时 ID 正文单行省略，完整值经既有 Tooltip 返回。

### 8.2 AC-091 异常标识完整性与操作列

| 项目 | 1440×900 | 1920×1080 | 证据键 |
|---|---|---|---|
| `CCFG010-ABN1` 标识文本 | `异常：X`，逐字符完整 | 同左 | `rows.abnormal12.mark.textMetrics.chars` |
| 标识 `client/scroll` / `clipped` | `52/52` / `false` | 同左 | `rows.abnormal12.mark.textMetrics` |
| 上限样本标识 | `异常：X`，`52/52`，`clipped=false` | 同左 | `rows.abnormalMax.mark.textMetrics` |
| 标识右界 vs 单元格/td | 等于单元格右界，td 内余 `12px` | 同左 | `mark.rect.right`、`extendsBeyondCellRight=0`、`extendsBeyondTdRight=-12` |
| 是否覆盖操作列 | `false` | 同左 | `mark.overlapsOperationColumn` |
| 操作列宽/命中 | `110px`，`insideOperationCell=true` | 同左 | `rows.*.operation` |
| 标识视觉 | `#b91c1c` on `#fee2e2`，11px/700，20px，radius 4，对比度 5.3，距 ID `6px`，垂直中心差 `0` | 同左 | `mark.style`、`mark.contrast` |

### 8.3 AC-091 编辑入口

| 项目 | 1440×900 | 1920×1080 | 证据键 |
|---|---|---|---|
| 聚焦 | `tabIndex=0`、`role=button`、`aria-label=编辑探针 {ID}` | 同左 | `interactions.*.focus` |
| 鼠标入口 | 双击 ID 打开「编辑探针」，取消关闭、不保存、无 POST 表单 | 同左 | `interactions.*.mouseEntry` |
| 键盘入口 | 聚焦 + Enter 打开「编辑探针」，取消关闭、不保存 | 同左 | `interactions.*.keyboardEntry` |
| Tooltip 不遮住异常原值 | `idTipCoversMark=false` | 同左 | `interactions.*.idTipCoversMark` |

说明：`:focus-visible` 焦点环取决于输入模态；程序化聚焦并非每次匹配，故上表以“Enter 打开编辑弹窗”作为键盘入口判定。`CCFG010-ABN1` 实测焦点环 `solid 1px rgb(64,158,255)`。该行为改前改后一致，无回归。

### 8.4 AC-088 异常状态回归

| 项目 | 结果 | 证据键 |
|---|---|---|
| API `fgActive` 与行内逐字一致 | `X` ↔ `异常：X` | `after/samples/sample-basis.json`、`rows.abnormal*.mark.text` |
| 红色、完整、可辨认 | `#b91c1c` on `#fee2e2`，对比度 5.3，逐字符完整、无溢出/祖先裁切 | `mark.textMetrics`、`mark.contrast` |
| “状态”列未恢复 | 表头无“状态” | `measurements.headers` |
| 异常行菜单 | 仅「停用、删除」，无「启用」；打开后 Escape 关闭，未点最终确认 | `abnormalMenu`、`abnormalMaxMenu` |
| 操作列不被覆盖、仍可命中 | `overlapsOperationColumn=false`、`insideOperationCell=true` | `rows.*.operation` |

### 8.5 相邻回归

- 启用 `hosp-012`：无任何标识。
- 停用 `hosp-008`：仅「停用」，样式/位置与改前一致。
- 普通长 ID `CCFG004-LONGID-0123456789ABCDEFG`：单行省略、完整 Tooltip、双击编辑入口正常。
- 短异常 `CCFG012X`：`异常：X` 完整显示，与改前一致。

## 9. 网络门禁与写入分账

| 视口 | 请求总数 | 阻断 | 业务非 GET 转发 | 浏览器错误 |
|---|---|---|---|---|
| 1440×900（before/after） | 124 / 124 | 0 | 0 | 0 |
| 1920×1080（before/after） | 124 / 124 | 0 | 0 | 0 |

- 只读 API：`/api/clients`、`/api/clients/data-source-options`、`/api/data-sources`。
- 编辑弹窗均取消关闭、未保存；无 POST/PUT/DELETE 到达后端；未访问其他业务页面、未操作 ZK/Kafka。
- 夹具 DML 由 SQL*Plus 直连执行，与浏览器请求分账。

## 10. 测试与构建

- `npx vitest run src/views/client-config/ClientConfigPage.spec.ts`：**186 passed**（1 file）。
- `npm run build`（`vue-tsc --noEmit && vite build`）：**成功**，20.98s。
- 真实浏览器复测为判定依据；不以单测或源码代替。

## 11. 验收状态与保护

- `ACCEPTANCE.md`：仅 `CCFG-AC-091` 状态格 `FAIL`→`PASS`；其余 156 个状态格与 157 条定义不变。
- `CCFG-AC-088` 维持 `PASS`，本轮完成回归。
- 现行统计：**PASS 157 / FAIL 0 / BLOCKED 0 / NOT_RUN 0 = 157**；`CCFG-AC-001~157` 连续唯一。
- 010 与 R1 的原始报告、证据目录未修改；010 原始证据逐字节保留。
- 本报告不自行标记 Feature 正式接受；提交推送成功 ≠ 远程复审通过 ≠ 157 条整体验收通过。

## 12. 证据归档

- `probes/ac091-layout-probe.js`：网络门禁 + 两视口采集脚本。
- `before/`、`after/`：`raw/*.json`、`network/*.json`、`screenshots/*.png`、`samples/sample-basis.json`。
- `environment-and-version.txt`、`sql-fixture-ledger.txt`、`evidence-index.md`、`SHA256SUMS`。
- 证据已脱敏：不含连接串、凭据或完整真实业务记录。
