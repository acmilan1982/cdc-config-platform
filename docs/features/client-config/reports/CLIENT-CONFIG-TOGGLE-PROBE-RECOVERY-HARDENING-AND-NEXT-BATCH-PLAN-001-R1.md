# 探针端恢复分支 R1：未知状态停止与真实适配验证

- 任务编号：`CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001-R1`
- 分支：`develop`
- base：`236c50a3fcc55fd2f9460ef897c7fb7ce6676ba5`
- result：见最终 `AGENT_TASK_RESULT`（本报告不预填自身提交 SHA）
- 性质：验收辅助脚本定向修正 + 纯离线故障模拟 + 下一批计划纠正；**未执行真实启停、未做真实故障注入、未访问业务接口/真实页面/数据库/ZK/Kafka/sync-client、未运行真实探针、未改产品代码、未改任何 AC 状态**。

## 0. 覆盖声明（纠正 R0）

本 R1 报告**明确取代** R0 报告中关于“恢复分支已安全”和“下一批计划”的表述：

- R0 的 `getPageState` 在 `page.evaluate` 失败时把 `pendingConfirm` 置 `false`，且 `writeAllowed` 固定为 `false`，把“未知”当成“安全”，可能错误允许 API 备用写。R1 已修正为显式未知 + 停止。
- R0 的下一批计划把“再次 T02 有序启停往返”当作补齐异常行三态与 AC-022 样本的手段；R1 纠正为**优先只读两视口核对现有菜单与列表、复用既有证据、先核查当前样本，不预设再次启停**。

已确认 R0 中共享预算、历史证据保护、状态保持符合要求，独立离线 17/17 通过；前序正常启停与 AC-023/151/152 的 PASS 不撤回；现行统计 `PASS 83 / FAIL 0 / BLOCKED 60 / NOT_RUN 14 = 157`，剩余 74。

## 1. 旧 → 新修复点

| # | 旧（R0） | 新（R1） |
|---|---|---|
| 1 | 页面状态读取失败时 `pendingConfirm=false`，`writeAllowed` 固定 `false` → 未知当作安全 | `readPageState()` 返回显式 `{known}` 信封；读取抛错、页面/上下文不可用、字段缺失、非布尔 → `{known:false,reason}`，永不转成安全 `false` |
| 2 | `getPageState` 有“默认安全”实现 | `getPageState` 为必需适配器；缺失或非函数时 `createRecoveryCoordinator` 构造即抛错，恢复不会以默认安全状态运行 |
| 3 | `identityOk = !!(raw && raw.identityOk !== false && raw.exact !== false)`：未提供的标志被当作 `true` | 仅当 `identityOk===true` 且 `exact===true` 才认为身份可证；缺失/非 `true` → `IDENTITY_UNKNOWN` |
| 4 | `businessDrift` 缺失或非数组时被当作“无漂移” | `businessDrift` 必须是显式数组；缺失/字符串/`null` → `BUSINESS_DRIFT_UNKNOWN` 并停止 |
| 5 | 入口与切换前用 `if (ps.writeAllowed \|\| ps.inFlight \|\| ps.pendingConfirm)`，`undefined` 为假 → 放行 | 仅当状态 `known` 且三字段**全部===false**时才允许页面→API 切换；未知或任一为真均停止 |
| 6 | `pageAttempt` 抛错被吞成 `sent:false` → 走 API 备用 | 抛错或 `sent` 非布尔视为“未知是否已发”，停止（`PAGE_ATTEMPT_FAILED` / `PAGE_SEND_UNKNOWN`），不再 API 补发 |
| 7 | 页面已放行写后仍可能经其他路径补发 | 页面一旦放行写（`sent===true` 或账本已占用），只重读并报告，绝不 API 补发 |
| 8 | `apiWrite` 在 fetch 成功并解析后才写入 `write_attempts`，超时/断连/解析失败会漏记 | 在请求**放行前**先记录一次 attempt，超时/断连/解析失败记为对应结果；摘要不再因异常显示 0 写 |
| 9 | 已为 `'0'` 直接报恢复成功，不交代在途可能 | 已 `'0'` 且身份/前像已核实可不写结束，但若无法确认页面空闲则记录 `limitation`；未知页状态但终读为 `'0'` 时用 `RESTORED_BY_READ` + `limitation`，不宣称在途请求已安全结束 |

共享预算语义未变：`enable 1 / disable 1 / recovery-disable 1 / total 3`，同步 `tryReserve`、事后 `settle`、不退款、不重试；API 与浏览器门禁共用同一账本。未改变正常 B0–B7 业务步骤。

## 2. 真实适配器的集成位置

新增最小模块 `page-state-adapter.mjs`（无导入副作用），由真实探针与离线测试**共同调用**：

- `page-state-adapter.mjs`：`readPageState({ evaluate, lifecycle })` 及 `knownPageState` / `unknownPageState` / `isPageStateKnown` / `pageStateAllowsApiSwitch`。
- `recovery-coordinator.mjs`：导入同模块；构造要求 `getPageState`；`verifyOnce` 采用显式身份/漂移契约；入口、切换前两处均以 `pageStateAllowsApiSwitch` 判定。
- `probe-ui-toggle.hardened.mjs`：
  - `getPageState: () => readPageState({ evaluate, lifecycle })`；
  - `evaluate` 仅从 `page.evaluate` 读取确认框状态（页面/上下文不可用即抛错 → 未知）；
  - `lifecycle` 从共享账本与真实请求生命周期派生：`writeAllowed = 账本存在 recovery-disable 放行`，`inFlight = run.disable_outstanding || 存在未结算 recovery 预留`；
  - `apiWrite` 在请求放行前记录 attempt。

离线测试的 `getPageState` 全部经同一 `readPageState()` 构造，未在测试中另写一份“同名安全适配器”。

## 3. 离线覆盖与结果

命令：

```bash
cd docs/features/client-config/reports/evidence/CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001
node --test offline-recovery.test.mjs
```

结果：**tests 40 / pass 40 / fail 0，退出码 0**（Node `v24.17.0`，`2026-11-03T11:13:07Z`）。用例数来自实际运行，未预填。详见 `offline-recovery-results-r1.md`。

新增/覆盖要点：

- `evaluate` 抛错（页面/上下文不可用）→ `PAGE_STATE_UNKNOWN`，API 写 0；终读为 `'0'` 时 `RESTORED_BY_READ` + `limitation`，仍无写。
- `evaluate` 非布尔、`writeAllowed`/`inFlight` 缺失/null/非布尔、lifecycle 非对象 → 未知，API 写 0。
- 缺失 `getPageState`（含 `null`）→ 构造抛错。
- `identityOk`/`exact` 缺失或非 `true` → `IDENTITY_UNKNOWN`；`businessDrift` 缺失/字符串/null → `BUSINESS_DRIFT_UNKNOWN`；均 API 写 0。
- `pageAttempt` 抛错或 `sent` 非布尔 → 停止，不 API 补发；页面已放行写后再抛错也不补发。
- 在途 / 待确认 / 账本已放行（未结算）→ `PAGE_IN_FLIGHT_OR_PENDING`，API 写 0。
- 明确安全且页面未发写 → API 备用恰 1 次。
- 原有成功路径、预算、竞争、超时/断连/解析失败、结算不退款用例继续通过。

**这些用例会使 R0 的 fail-open 行为失败**：A1/A2/A3/A5/A6/A7 断言 `apiCalls===0`，而在 R0 适配器下这些场景会得到“看似安全”的状态并进入 `apiWrite()`；A4/A16 也覆盖了 R0 的“缺失即安全/无漂移”处理。断言基于实际发送次数、账本计数、停止理由与终态，不做源码字符串匹配。

边界：仅 Node 内置与内存桩，无网络、浏览器、真实业务调用或 SQL。**离线通过不等于真实故障恢复已验证。**

## 4. 下一批计划纠正

本轮**不执行计划**，仅将其改为：

> 优先只读两视口核对现有菜单与列表，复用既有证据；先核查当前样本，不预设再次启停。

依据：前序就绪核查已观察一条真实 `FG_ACTIVE='1'` 行；T02 轮次已有 `'0'→'1'→'0'` 及菜单、重载证据；`002` 已有异常行菜单观察；最新核查当时非 0/1 异常行数量为 0，不能保证再次启停会自然生成异常行。

由此：

- **AC-022**：按自身完整前置（如启停各若干条）评估；当前样本是否满足未知，不能用一次往返保证。
- **AC-082**：当前三态共存前置与历史观察分开；异常行缺席时保留具体缺口，不把再次启停当补齐手段。
- **AC-103**：历史单击/双击/菜单双击隔离已存在，不能重列为“从未覆盖”。
- **AC-156**：已有写后稳定 ID 重选；顺序往返仍不能证明多次重载响应交错，交错竞态单列后续任务。

不访问其他功能页面，不提出其他页面授权。负责人对 T01/T02“专用且可任意操作”的授权继续有效，无需重问；**本任务不消费真实写授权**。未来确需新增写时，再在具体执行提示词中列步骤、预算与恢复边界，不把当前计划当作已执行。

## 5. 历史保护

- `offline-recovery-results.md`（R0，17/17）**逐字节保持原样**，作为当时快照；R1 结果写入新文件 `offline-recovery-results-r1.md`。
- R0 报告 `CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001.md` **保持历史原样**。
- 最初 T02 正常执行任务的整个报告/证据目录**未修改、未回写 SHA**，业务历史结果未改。
- R0 旧版脚本保存在 Git 历史（`236c50a`）；不伪称 R0 结果由 R1 脚本产生。
- `SHA256SUMS` 依当前文件重算，索引明确 R0 结果是历史快照。

## 6. 校验与 Git

- 独立运行纯离线测试，记录命令/退出码/用例数（见 §3）。
- 四份权威定义（`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md`）相对 base 逐字节未变；状态格复算 `PASS 83 / FAIL 0 / BLOCKED 60 / NOT_RUN 14 = 157`；`changed_ids=[]`。
- `git diff --check`、白名单、脱敏扫描；`SHA256SUMS` 与当前文件一致。
- 无真实 ID/凭据/业务数据/原始截图入仓。
- 单次提交，逐路径暂存；推送前核对远端与普通快进条件，禁止强推；推送后核对 local/origin/远端三方 SHA。

## 7. 未执行项

- 未运行真实 `probe-ui-toggle.mjs` / `probe-ui-toggle.hardened.mjs`；未启停服务；未访问业务接口、真实页面、数据库、ZooKeeper、Kafka 或 `sync-client`；未运行产品测试/构建/lint/类型检查。
- 未做任何真实故障注入，**真实故障恢复仍待未来授权任务验证**。
- 未修改产品代码、测试、配置、依赖、公共模板；未新建模拟业务样本。
- 未改任何 AC 状态；本报告不宣判复审通过。

## 8. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_TOGGLE_PROBE_RECOVERY_HARDENING_AND_NEXT_BATCH_PLAN_R1_REVIEW`
