# 探针端管理：验收探针恢复分支修正与下一批计划

- 任务编号：`CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001`
- 分支：`develop`
- base：`1af1cdf1bfdc6e74f9e2266539749aba4987d353`
- result：见最终 `AGENT_TASK_RESULT`（本报告不预填自身提交 SHA）
- 性质：纯文档 + 验收辅助脚本修正 + 纯离线故障模拟；**未重跑真实启停、未访问业务接口/真实页面/数据库/ZK/Kafka/sync-client、未运行真实探针、未改产品代码、未改任何 AC 状态**。

## 1. 原风险与修正要点

原 `CLIENT-CONFIG-T02-CONTROLLED-UI-TOGGLE-ACCEPTANCE-001` 探针的恢复分支存在未执行时的代码风险：页面“停用”点击抛错后直接改用 `fetch` 发 API 停用，而未重新 GET 确认状态、身份、业务前像与剩余预算，且无法排除页面请求已经放行甚至已提交；API 备用路径也绕过浏览器门禁，写尝试在响应后才计数。

修正版保持 B0–B7 正常业务步骤不变，仅在写入与恢复层加固：

1. **统一同步写预算**（`recovery-coordinator.mjs` 的 `createWriteLedger`）：
   - 正常启用 ≤1、正常停用 ≤1、额外恢复停用 ≤1，所有渠道总写尝试 ≤3；
   - 浏览器门禁与 API 恢复共用同一账本；`tryReserve()` 同步完成“检查 + 占用”，不存在检查与占用分离的超额窗口；
   - 请求**放行前**即计一次尝试，而不是等 HTTP 响应或 JSON 解析后；放行后无论成功、超时、断连或解析失败都算一次，`settle()` 只记录结果、不退款、不自动重试；
   - 普通 GET/HEAD/OPTIONS 不占写预算；日志区分“已占预算/结果未知（`reserved`）/已结算结果”，不把未获响应当作未写入。
2. **页面→API 切换与状态核对**（`createRecoveryCoordinator`）：
   - 仅在页面恢复操作根本没有放行写请求、且无待确认/在途请求时，才允许 API 作为同一次恢复的备用渠道；
   - 页面已放行写后即使 UI 抛错，也不再补发 API，只重读并报告；
   - 切换前重读精确 T02 身份、当前 `FG_ACTIVE`、业务字段与前像、在途状态与剩余预算；未知/目标缺失/前像漂移/在途结果未明/预算耗尽一律停止，不猜测；
   - 页面点击完成不能直接置 `recovered=true`；**只有最终 GET 满足原业务前像且 `FG_ACTIVE='0'`** 才宣称恢复成功。
3. **可离线验证结构**：恢复协调与预算被提取为共享模块，以依赖注入接收读取、页面尝试与 API 写入适配器；真实脚本与本离线测试使用同一模块，避免“测试只验证一份与实际脚本脱节的复制逻辑”。模块导入无副作用（不启动浏览器、不读真实映射、不连网络）。

## 2. 修正版交付物与真实集成点

目录：`reports/evidence/CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001/`

| 文件 | 作用 |
|---|---|
| `recovery-coordinator.mjs` | 共享写账本 + 恢复协调状态机；无导入副作用 |
| `probe-ui-toggle.hardened.mjs` | 原探针的加固副本；B0–B7 业务步骤不变 |
| `offline-recovery.test.mjs` | 纯离线故障模拟（仅 Node 内置 + 内存桩） |
| `offline-recovery-results.md` | 离线命令、退出码、用例结果与边界 |
| `README.md` | “供未来使用”说明、适用条件、账本语义、集成点 |

`probe-ui-toggle.hardened.mjs` 与共享模块的集成点恰为三处：

1. 上下文门禁在 `route.continue()` 前调用 `ledger.tryReserve(kind, ...)`；占用失败按门禁阻断处理，请求不发出。门禁转发请求但不读取响应，因此浏览器门禁写入在账本中保留为“已放行/结果未知”。
2. 顶层 `catch` 中用 `createRecoveryCoordinator(...).recover()` 取代原手写恢复；适配器分别为 `captureCurrent()`+`compareRows()`（读取）、页面菜单/确认点击（页面尝试）、`AbortController` 限时 `fetch`（API 写入）。
3. 运行摘要新增 `gate.write_ledger = ledger.snapshot()`。

另设 `disable_outstanding`：正常停用放行时置真、其响应返回后置假；恢复若见其在途，按“无法排除在途”停止，不自动补发。

## 3. 三层结论必须分开

| 层次 | 结论 | 依据 |
|---|---|---|
| 历史正常执行 | **已通过**（前序远程复审 `APPROVED`） | `63bbbde..1af1cdf`：成功路径 2 写（enable/disable 各 1）、恢复 0 写、终态 `'0'`；`CCFG-AC-023/151/152` 判 `PASS` |
| 修正版离线验证 | **通过**（本任务） | `node --test offline-recovery.test.mjs`：17/17 通过、退出码 0 |
| 真实故障恢复 | **未执行** | 本任务未运行真实探针、未注入真实故障、未产生业务写 |

**历史正常执行通过不等于未执行过的恢复分支已被真实环境验证；离线通过也不证明真实故障恢复已验证。**

## 4. 离线故障模拟结果

命令：

```bash
cd docs/features/client-config/reports/evidence/CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001
node --test offline-recovery.test.mjs
```

结果：**tests 17 / pass 17 / fail 0，退出码 0**（Node `v24.17.0`）。对照任务要求的 9 类场景：

| 要求场景 | 用例 | 结果 |
|---|---|---|
| 已 `'0'` 无需恢复、写 0 次 | S1 | PASS |
| 页面未发写即失败，重读仍 `'1'` 且前像不变、无在途，API 备用仅 1 次 | S2 | PASS |
| 页面已放行写但 UI 抛错、GET 为 `'0'`、不补发 API | S3 | PASS |
| 页面已放行、结果未知/GET 仍 `'1'`、停止不盲重发 | S4 | PASS |
| API 超时/断连/解析失败仍占预算、不自动重试 | S5a/S5b/S5c | PASS |
| 身份不明/业务漂移/状态未知/预算耗尽均不写 | S6a–S6d | PASS |
| 页面与备用竞争、额外恢复 ≤1、总写 ≤3 | S7a/S7b/S7c | PASS |
| 页面动作完成但 GET 未证实还原、不报成功 | S8 | PASS |
| 正常成功路径保持 enable1+disable1、恢复不执行 | S9 | PASS |

断言针对实际发送尝试次数、账本计数（`counts`/`total`/`attempts`）、结算结果、最终动作/停止理由与 `recovered` 标志，不对源码做字符串匹配。另含“结算不退款且拒绝重复结算”一条（L1）。

边界：仅 Node 内置与内存桩，无网络、浏览器、真实业务调用或 SQL 写；**离线通过不等于真实故障恢复已验证**。

## 5. 下一批验收计划（仅建议，不执行、不改判）

现行状态：`PASS 83 / FAIL 0 / BLOCKED 60 / NOT_RUN 14 = 157`，剩余 74。以下只给出一个优先小批次，不重新盘点全部 74 条；不以“本轮未执行”当作“历史无证据”，也不借其他 AC 的 `PASS` 代替本 AC 的客观观察。

优先批次：**两视口三点菜单观察 + 一次 T02 有序启停往返（形成真实 `'1'` 行）**。理由：可一次复用 002/round7 既有证据并补齐“`'1'`/`'0'`/异常三态菜单共存”与“无状态列/最右固定操作列”的现行观察；写量最小（成功 2 写），且与既有专用测试对象授权一致；多次重载交错竞态需要响应时序控制，单独留作后续任务。

| AC | 已有真实证据（文件 + 键） | 仍缺原子步骤 | 推荐下一动作 | 新增真实写 | 所需样本与恢复 |
|---|---|---|---|---|---|
| `CCFG-AC-022` | `002/s2-list-results.json → viewports.*.structure.hasStatusColumn=false`、六列表头；`menu.itemTexts=["启用","删除"]`（停用行）；`idMarkers` 第 1–15 行“停用”；`002/s2-confirm-results.json → enableBox/enablePrimary`；T02 `B3`/`B7` | 1920×1080 下系统打开菜单；多行 `'1'`/`'0'` 共存时“停用”标记缺失/出现的对照 | 先只读两视口观察，再用 T02 往返形成 `'1'` 行复核 | 是（往返 enable1+disable1） | T02 专用对象；1440×900/1920×1080；恢复：最终 GET `'0'` + 业务前像一致 |
| `CCFG-AC-082` | `002/s2-list-results.json → structure.headersRightmost="操作"`、六列表头；`menu.itemTexts=["启用","删除"]`（`'0'` 行）；`abnormalRowMenu.itemTexts=["停用","删除"]`；`rowEventIsolation.editDialogOpened=false`；三视口 1440×900/1920×1080/900×800 | 三类（`'1'`/`'0'`/异常）菜单**当场共存**观察；点“更多”无选中视觉、不触发编辑 | 往返启用后读取真实 `'1'` 行菜单应为“停用/删除”，确认三态共存与事件隔离 | 是（同一次往返） | 真实 `'1'` 行 + `'0'` 行 + 异常行（异常行须自然存在，复用 002 观察，不制造） |
| `CCFG-AC-103` | `002/s2-list-results.json → rowEventIsolation.singleClickTrigger/doubleClickTrigger/doubleClickMenuItem` 三者 `editDialog.visible=false`；`rowClick` 固定选中；`keyboardMenu`；`cancelBox` + `nonGetAttempts=0` | 慢请求下行级忙碌禁用与不重复提交；失败复位；E5 删除（本批不做） | 复用 002 做单击/双击/菜单双击隔离；往返若出现真实行级忙碌则如实记录，不人为注入慢请求 | 是（仅往返） | T02；不注入慢请求/失败；删除腿另行授权 |
| `CCFG-AC-156` | `round7 → AC155_156_client_1440x900.rows[]`（`rowH=48`、`entryW/H=28`、`vCentered=true`）；`AC156_focus`（`outline=2px`、`ariaLabel`）；`zoom → zoomLegs.100/125.hitBoxCssPx` 均 `28×28`；T02 `B7` 写后按稳定 ID 重选 | 多次重载响应交错竞态（顺序单请求无法制造/证明）；写触发的多次重载交错 | 盒模型/命中区/焦点/缩放直接复用 round7/zoom（不重跑）；往返只提供**单次**重载重选观察；交错竞态单列后续任务 | 往返为是；交错任务可能需受控延迟响应（另行授权） | T02 往返；交错任务需可延迟/交错的响应样本，不纳入本批 |

所需样本与恢复的统一前置：仅 T02 专用对象；两视口 1440×900 与 1920×1080；同一 `/api/**` 门禁与同步账本（enable1+disable1，恢复 ≤1）；恢复以最终 GET `'0'` 与原业务前像一致为准。异常行只在自然存在时复用既有 002 观察，**不制造模拟样本**。

后续执行条件：T01/T02“专用测试对象、可以任意操作”的授权已存在，但**本任务不消费该业务写授权**；真实写方案须由独立提示词明确具体步骤、门禁、预算与恢复边界后再执行。

## 6. 校验与 Git

- 四份权威定义（`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md`）相对 base 逐字节未变；`changed_ids=[]`。
- 独立复算状态格：`PASS 83 / FAIL 0 / BLOCKED 60 / NOT_RUN 14 = 157`（`awk` 直接统计 §4 定义行，不凑数）。
- 原 T02 证据目录与原报告逐字节保留，未被修改或移除。
- `git diff --check`、白名单、脱敏扫描、`SHA256SUMS` 核验见任务执行记录。
- 单次提交逐路径暂存；推送前复核远端与快进条件，普通推送、禁止强推；核对 local/origin/远端三方 SHA。

## 7. 未执行项与剩余条件

- 未运行真实 `probe-ui-toggle.mjs` / `probe-ui-toggle.hardened.mjs`；未访问业务接口、真实页面、数据库、ZooKeeper、Kafka 或 `sync-client`；未启停服务；未重跑产品测试/构建/lint/类型检查。
- 未执行任何真实故障注入，**真实故障恢复仍待未来授权任务验证**。
- 未修改产品代码、测试、配置、依赖、公共模板；未新建模拟业务样本。
- 未改任何 AC 状态；本报告不宣判复审通过。

## 8. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_TOGGLE_PROBE_RECOVERY_HARDENING_AND_NEXT_BATCH_PLAN_REVIEW`
