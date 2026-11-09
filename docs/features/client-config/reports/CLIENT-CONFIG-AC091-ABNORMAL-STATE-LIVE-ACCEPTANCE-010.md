# CLIENT-CONFIG-AC091-ABNORMAL-STATE-LIVE-ACCEPTANCE-010 验收报告

- 任务编号：`CLIENT-CONFIG-AC091-ABNORMAL-STATE-LIVE-ACCEPTANCE-010`
- 分支：`develop`
- 原执行基线：`9371e932ecd2fb2eab9861a6c1e383c0dd9ecec1`（009 结果提交）
- R1 勘误基线：`77f4e623e76dc117215061a5e04944c8d14b0e8d`（010 结果提交）
- 依据：`docs/prompts/client-config/CLIENT-CONFIG-AC091-ABNORMAL-STATE-LIVE-ACCEPTANCE-010-Agent-Prompt.md`（010 原任务）；`docs/prompts/client-config/CLIENT-CONFIG-AC091-ABNORMAL-STATE-LIVE-ACCEPTANCE-010-R1-Agent-Prompt.md`（R1 勘误）
- 证据目录：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC091-ABNORMAL-STATE-LIVE-ACCEPTANCE-010/`
- 现行判定：**`CCFG-AC-091 = FAIL`**（R1 勘误，2026-11-09）
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_AC091_ABNORMAL_STATE_LIVE_ACCEPTANCE_010_R1_REVIEW`

## 1. 结论（R1 勘误后）

`CCFG-AC-091` 现行判定为 **`FAIL`**。R1 将 010 原判 `PASS` 勘误为 `FAIL`；010 原 `PASS` 结论与 `157 PASS` 统计作为已被取代的历史结果保留于 §1.1。

判据：AC-091 要求历史异常标识按 `CCFG-AC-088` 保持原值可辨认。010 首个合成样本 `CCFG010-ABN1`（12 字符 ID）在 176px 列内使标识被省略为「异常…」，状态原值 `X` 不可见——这是实际观察到的反例；随后缩短为 `CCFG010X` 的短样本通过，并不能消除该反例。因此 AC-091 整体判 `FAIL`。`CCFG-AC-088` 本轮不改判，两条关联留待同一修复任务回归。

现行统计 **156 PASS / 1 FAIL / 0 BLOCKED / 0 NOT_RUN = 157**；唯一 FAIL 为 `CCFG-AC-091`。本报告不自行标记 Feature 正式接受。

### 1.1 010 原结论（已被 R1 取代）

`CCFG-AC-091` 由 `BLOCKED` 更新为 `PASS`。原条款在短样本范围内成立：三种 `FG_ACTIVE` 状态 ID 正文的颜色与字重在 1440×900、1920×1080 下均与参考页「数据源 ID」正文一致；停用与异常标识保持各自现行语义与视觉；单行省略、完整 Tooltip、鼠标与键盘编辑入口均保持。原验收统计为 **157 PASS / 0 FAIL / 0 BLOCKED / 0 NOT_RUN = 157**。

### 1.2 R1 勘误说明

- **长样本反例**：首个合成样本 `CCFG010-ABN1` 在 176px 列内使异常标识显示为「异常…」，原始值 `X` 被截断、不可辨认。该观察记录于 `sql-fixture-ledger.txt` §3 DML #2、§4 更新动因及原报告 §4，**没有**对应的逐视口截图或原始几何 JSON 入仓，不得将其写成已入仓的长样本证据。
- **短样本通过范围**：缩短 ID 后的 `CCFG010X` 在 1440×900、1920×1080 均完整显示红色「异常：X」，`client.measurements.ac091.abnormal` 提供该短样本证据。三态 ID 正文字重/颜色、参考页对照、长 ID（普通 ID）Tooltip 与鼠标/键盘入口的通过观察继续有效，但各自样本范围不变。
- **条款依据**：AC-091 明确「红色 `异常：{原始值}` 仍按 `CCFG-AC-088` 呈现」，而 AC-088 要求标识的超长处理「使界面上的原始值可辨认、可核对」。长样本原值被截断与该要求直接冲突，故 AC-091 判 `FAIL`；短样本通过不消除反例。
- **边界**：本轮只做文档勘误，未改代码、未启停服务、未运行浏览器或测试、未访问业务 API、未读写数据库、未改样本；010 原始证据目录（含 SQL 台账、探针、截图、JSON 与 `SHA256SUMS`）逐字节保留。产品布局修复及复测另立任务。

## 2. 授权与边界

- 负责人原话授权：「允许agent对CDC_CLIENT_MULTIPLE表做任何操作，缺少样本让agent自己加」。
- 已核实目标为项目 CLAUDE.md §11 指定的 **Oracle 开发库 CDC schema**（连接前核对库身份与开发地址一致），随后自行补齐样本，未再次申请。
- 仅操作 `CDC_CLIENT_MULTIPLE`：1 条可识别的合成异常样本（单行 INSERT，随后按精确主键缩短合成 ID）。未修改业务旧行、`CDC_DATA_SOURCE`、其他表、表结构、配置、ZooKeeper、Kafka 或同步进程。
- 未在数据源管理页写入；产品代码、正式项目级基线、`.claude/settings.json`、`.claude/skills/**` 均未改动。
- 两表测试数据按既有授权无需清理；本轮合成记录保留，实际留存见第 4 节与 `sql-fixture-ledger.txt`。

## 3. 开工前现场与基线核对

| 项 | 实际值 |
|---|---|
| 分支 | `develop` |
| 任务开始前 Commit | `9371e932ecd2fb2eab9861a6c1e383c0dd9ecec1` |
| `origin/develop`（开工时） | `9371e932ecd2fb2eab9861a6c1e383c0dd9ecec1` |
| 工作区既有改动 | `.claude/settings.local.json`、`docs/prompts/`、`runtime-logs/`（未纳入本轮） |

未执行 reset / clean / stash / checkout，未覆盖无关改动。开工时分支、基线、远端一致，无历史分叉、无任务文件冲突。

## 4. 数据库夹具与写操作分账

细节见 `sql-fixture-ledger.txt`。

| 项目 | 数量 |
|---|---|
| 直接 DML 操作 | 2（INSERT 1 + UPDATE 1） |
| 事务控制语句 | 2（COMMIT ×2） |
| 累计影响行数 | 1 行（同一合成行） |
| 业务 API 写入（POST/PUT/DELETE） | 0 |
| 回归后留存合成记录 | 1 条 |

执行前只读核对：`CDC_CLIENT_MULTIPLE` 列为 `CLIENT_ID`/`CLIENT_DESC`/`DATA_SOURCE_ID`/`FG_ACTIVE`；主键 `PK_CDC_CLIENT_MULTIPLE`，`CLIENT_ID`、`FG_ACTIVE` NOT NULL；无 `FG_ACTIVE` 取值 CHECK 约束；运行前分布 `'0'` 70 行、`'1'` 22 行，无非 `'0'/'1'` 行。

- DML #1：`INSERT` 合成行 `CCFG010-ABN1`，`FG_ACTIVE='X'`，其余可空字段最小化，影响 1 行；`COMMIT`。
- DML #2：`UPDATE ... SET CLIENT_ID='CCFG010X' WHERE CLIENT_ID='CCFG010-ABN1'`（仅精确主键；其余字段不变），影响 1 行；`COMMIT`。动因：首版 12 字符 ID 在 176px 列内使标识被省略为「异常...」，原始值不可见；缩短后 ID 与「异常：X」均完整可见。旧值/新值已逐条记录。
- 回读：`FG_ACTIVE` 原样为 `'X'`，未被归一化。
- 最终留存：`CLIENT_ID='CCFG010X'`、`CLIENT_DESC='AC091 synthetic abnormal fgActive sample'`、`DATA_SOURCE_ID=NULL`、`FG_ACTIVE='X'`；执行后分布 `'0'` 70、`'1'` 22、`'X'` 1，合计 93 行。
- 备查回滚语句（未执行）：`DELETE FROM CDC_CLIENT_MULTIPLE WHERE CLIENT_ID='CCFG010X'; COMMIT;`

## 5. 环境与采集条件

细节见 `environment-and-version.txt`。

- Git HEAD：`9371e932ecd2fb2eab9861a6c1e383c0dd9ecec1`；前端由 Vite 开发服务器直接服务当前工作区源码（未构建、未改代码）。
- 后端：本任务自行启动的既有产物 jar，`--spring.profiles.active=dev`，监听 `*:8080`，健康检查 200；启动后未重新构建。
- 前端：本任务自行启动，监听 `0.0.0.0:5173`。
- 本任务自行启动的进程：后端实际监听 PID 15727（包装 PID 15725），前端实际监听 PID 15772（包装 PID 15770）；任务结束时停止（未停止他人进程）。
- 浏览器：Chrome for Testing `147.0.7727.15`（headless），DPR 1，页面缩放 100%，侧栏展开（`.sidebar` 实测 220px，无 collapsed），两页一致；`document.fonts.status=loaded`。
- 网络门禁：首次导航前安装 context 级 `route`，`serviceWorkers='block'`；仅放行同源静态资源 GET 与 `/api/clients`、`/api/clients/data-source-options`、`/api/data-sources` 三条只读 GET；其余全部 abort。
- 采集时间（UTC）：`2026-11-09T05:51:03.743Z` ～ `2026-11-09T05:51:36.233Z`。

## 6. CCFG-AC-091 逐视口证据

条款要点：ID 正文文本的颜色与字重与参考页「数据源 ID」一致（可辨识、与单元格背景有足够对比度）；「停用」与异常原值标识保持各自现行语义与视觉；整列未笼统加粗或改色；单行省略、完整值 Tooltip、鼠标与键盘编辑入口保持不变。

两视口实测值完全一致。**本节结论仅覆盖短样本 `CCFG010X`**（§6.3 的长 ID 用例为普通 ID，只验证 ID 单行省略与完整 Tooltip，不等于异常标识长样本）；长样本 `CCFG010-ABN1` 的反例见 §1.2。证据键见 `evidence-index.md` 第 2 节；原始值见 `raw/client-091-1440x900.json`、`raw/client-091-1920x1080.json`。

### 6.1 ID 正文与参考页比对

| 项目 | 1440×900 | 1920×1080 | 证据键 |
|---|---|---|---|
| 启用（probe-001）正文 color / 字重 / 字号 | `rgb(9, 9, 11)` / `600` / `14px` | 同左 | `client.measurements.ac091.enabled.bodyStyle` |
| 停用（hosp-008）正文 | `rgb(9, 9, 11)` / `600` / `14px` | 同左 | `...disabled.bodyStyle` |
| 异常（CCFG010X）正文 | `rgb(9, 9, 11)` / `600` / `14px` | 同左 | `...abnormal.bodyStyle` |
| 实际单元格背景（三态） | `rgb(255, 255, 255)` | 同左 | `...effectiveCellBackground.value` |
| 对比度（三态） | `19.9` | 同左 | `...contrast` |
| 参考页启用 `77711` 正文 | `rgb(9, 9, 11)` / `600` / `19.9` | 同左 | `dataSource.measurements.enabled` |
| 参考页停用 `s-dssr1-0906-1` 正文 | `rgb(9, 9, 11)` / `600` / `19.9` | 同左 | `dataSource.measurements.inactive` |

结论：三态 ID 正文与参考页正文颜色、字重一致，未整体加粗或改色；与白色单元格背景对比度 19.9:1。

### 6.2 三态标识

| 项目 | 1440×900 | 1920×1080 | 证据键 |
|---|---|---|---|
| 启用无标识 | `hasInactiveMark=false`、`hasAbnormalMark=false` | 同左 | `...enabled.markers` |
| 停用仅「停用」 | `inactiveText='停用'`、无异常标识 | 同左 | `...disabled.markers` |
| 异常完整文本 | `abnormalText='异常：X'` | 同左 | `...abnormal.markers.abnormalText`、`client.abnormalMarkTooltip.text` |
| 停用标识视觉 | `rgb(153,27,27)` on `rgb(254,226,226)`，20px，11px/700，34/34 无裁切 | 同左 | `...disabled.mark.style`、`...clipped` |
| 异常标识视觉 | `rgb(185,28,28)` on `rgb(254,226,226)`，20px/20px，radius 4px，0 6px，11px/700，52/52 无裁切，对比度 5.3 | 同左 | `...abnormal.mark.style`、`...contrast` |
| 异常标识独立于正文 | `separateElementFromIdBody=true`、`idBodyContainsMarkText=false`、`markColorEqualsBodyColor=false`、`markWeightEqualsBodyWeight=false` | 同左 | `...abnormal.mark.*` |
| 标识间距 / 垂直居中 | `offsetFromIdRight=6`、`centerYDeltaFromId=0` | 同左 | `...disabled.mark.*`、`...abnormal.mark.*` |

结论（短样本 `CCFG010X`）：启用状态无任何标识；停用状态仅有「停用」；异常状态完整显示红色「异常：X」，原始值 `X` 未被归一化，标识为独立元素且未复用正文颜色/字重。该通过不覆盖长样本反例（见 §1.2）。

### 6.3 长 ID 省略与 Tooltip

| 项目 | 1440×900 | 1920×1080 | 证据键 |
|---|---|---|---|
| 长 ID 单行省略 | `152/274`，`truncated=true` | 同左 | `...longId.{clientWidth,scrollWidth,truncated}` |
| 完整值 Tooltip | 完整 `CCFG004-LONGID-0123456789ABCDEFG`，`role=tooltip`，可见 | 同左 | `client.longIdTooltip` |

### 6.4 异常行编辑入口

| 项目 | 1440×900 | 1920×1080 | 证据键 |
|---|---|---|---|
| 键盘聚焦 | `tabIndex=0`、`role=button`、`aria-label=编辑探针 CCFG010X`、焦点描边 `solid 1px rgb(64,158,255)` | 同左 | `client.abnormalKeyboardFocus` |
| 鼠标入口 | ID 双击打开「编辑探针」弹窗，取消关闭未保存，无 POST 表单 | 同左 | `client.abnormalMouseEditEntry` |
| 键盘入口 | ID 聚焦 + Enter 打开「编辑探针」弹窗，取消关闭未保存，无 POST 表单 | 同左 | `client.abnormalKeyboardEditEntry` |

## 7. 网络门禁与写操作分账

| 视口 | 请求总数 | 静态 GET | 只读 API GET | 阻断 | 业务非 GET 转发 | 浏览器错误 |
|---|---|---|---|---|---|---|
| 1440×900 | 121 | 117 | 4 | 0 | 0 | 0 |
| 1920×1080 | 121 | 117 | 4 | 0 | 0 | 0 |

- 只读 API GET：`/api/clients?status=ALL` 1 次；`/api/clients/data-source-options` 2 次（两次打开异常行编辑弹窗）；`/api/data-sources` 1 次（参考页）。详见 `network/ledger-*.json`。
- 编辑弹窗均通过「取消」关闭，未保存；无 POST/PUT/DELETE 到达后端。
- 浏览器采集期间后端业务 SQL 仅 SELECT（`Preparing: SELECT` 37 次），INSERT/UPDATE/DELETE/MERGE = 0，ERROR/Exception = 0。夹具 DML 由 SQL*Plus 直连执行，与浏览器请求分账，见第 4 节。
- 未访问其他业务页面；未操作 ZooKeeper/Kafka；未修改 `CDC_DATA_SOURCE`。

## 8. 样本与脱敏

- 探针端三态：`probe-001`（`'1'`）、`hosp-008`（`'0'`）、`CCFG010X`（`'X'`，本任务合成）。
- 长 ID：`CCFG004-LONGID-0123456789ABCDEFG`。
- 参考页：`77711`（启用）、`s-dssr1-0906-1`（停用）。
- `samples/sample-basis.json` 仅保留判定字段（状态、`FG_ACTIVE`、标识与异常标记），不含凭据、连接串或完整原始业务记录。本报告与证据不记录数据库连接串与凭据。

## 9. 157 条定义与状态保护

- R1 状态变化集合：仅 `CCFG-AC-091` 由 `PASS` → `FAIL`；其余 156 个状态格未变；`changed_ids=[CCFG-AC-091]`。
- 157 条验收定义（含 `CCFG-AC-091`、`CCFG-AC-088` 条款文本）未修改。
- 010 原始证据目录（`reports/evidence/CLIENT-CONFIG-AC091-ABNORMAL-STATE-LIVE-ACCEPTANCE-010/`）相对固定基线无差异；007/009 原始证据目录未改动。
- 现行统计：**PASS 156 / FAIL 1 / BLOCKED 0 / NOT_RUN 0 = 157**；唯一 FAIL 为 `CCFG-AC-091`；ID 连续唯一（`CCFG-AC-001`～`CCFG-AC-157`）。
- 将 `CCFG-AC-091` 状态反向替换（`FAIL`→`PASS`）后，验收表与固定基线 `77f4e62` 逐字节一致。
- 历史：010 原将 `CCFG-AC-091` 由 `BLOCKED` 改判 `PASS`、统计 `PASS 157`，该结果已被本 R1 取代。
- 本报告不自行标记 Feature 正式接受。

## 10. 交付与校验边界

- 证据文件（010 原有，R1 未改动）：`probes/`、`environment-and-version.txt`、`sql-fixture-ledger.txt`、`raw/`、`network/`、`samples/`、`screenshots/`、`evidence-index.md`、`SHA256SUMS`。
- R1 提交前校验：`sha256sum -c SHA256SUMS`；证据目录相对固定基线无差异；157 个连续唯一 ID；状态变化集合仅 `CCFG-AC-091`；反向替换后验收表与固定基线逐字节一致；`git diff --check` / `git diff --cached --check`。
- R1 仅逐路径暂存 `ACCEPTANCE.md`、本报告与 `README.md`；不纳入 `.claude/settings.local.json`、`docs/prompts/**`、`runtime-logs/**`。单次提交后普通快进推送，并核对本地/上游/远端三方 SHA 一致，不强推。
- 本轮为纯文档勘误：未启动浏览器/服务、未构建/运行测试、未调用业务 API、未读写数据库或夹具；`fixture_dml_operations=0`、`business_write_count=0`。
- 现场通过/提交推送成功 ≠ 远程复审通过 ≠ 157 条整体验收通过 ≠ Feature 正式接受。
