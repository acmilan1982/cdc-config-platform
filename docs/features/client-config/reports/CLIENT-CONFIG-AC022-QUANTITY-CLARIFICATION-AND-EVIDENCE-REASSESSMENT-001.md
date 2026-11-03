# 探针端管理：AC-022 数量口径确认与既有证据重判

- 任务编号：`CLIENT-CONFIG-AC022-QUANTITY-CLARIFICATION-AND-EVIDENCE-REASSESSMENT-001`
- 分支：`develop`
- base：`c63e675347a3a55a3edd31b7bd8f105eb3189841`
- result：见最终 `AGENT_TASK_RESULT`（本报告不预填自身提交 SHA）
- 性质：**纯文档静态证据重判**。真实采集与业务写入均发生在前序任务
  `CLIENT-CONFIG-AC022-CONTROLLED-MULTIROW-ACCEPTANCE-001`；本轮不重新运行业务
  验收、不启停服务、不做任何业务写入、不访问其他功能页面。

## 0. 结论摘要

**`CCFG-AC-022`：`BLOCKED` → `PASS`。**

依据是两点合并，而非照抄任务提示词或借用其他 AC 状态：

1. 负责人于 **2026-11-03** 对 AC-022 前置数量口径的明确解释——
   **“AC-022 的‘启用与停用各若干条’按各至少 2 条理解，本轮样本满足前置。”**
2. 前序任务已入仓的真实多行样本与完整成功态变化腿证据（本文 §3 逐原子引用）。

| 项目 | 结果 |
|---|---|
| `changed_ids` | `[CCFG-AC-022]` |
| 本轮统计（独立复算） | `PASS` **84** / `FAIL` **0** / `BLOCKED` **59** / `NOT_RUN` **14** = **157** |
| 定义保护 | 除 AC-022 状态 token 外，157 条定义行逐字节不变；其余 156 个状态格不变 |
| 四族定义数量 | `REQ154 / AC157 / DESIGN89 / UI77`（按定义行唯一编号复算） |
| 业务写尝试 | **0**（本轮为静态重判，未调用任何业务接口） |
| 数据库直写 / ZooKeeper 写 | `NOT_REQUESTED` / `NOT_REQUESTED` |
| `CCFG-AC-082` | 维持 `BLOCKED`（当前缺异常状态样本；未制造异常值） |

## 1. 负责人授权与采信范围

负责人于 2026-11-03 明确回复，逐字记录：

> AC-022 的“启用与停用各若干条”按各至少 2 条理解，本轮样本满足前置。

采信范围**仅**为：

- AC-022 的前置数量解释（“各若干条”按“各至少 2 条”理解）；
- 前序任务该轮样本是否满足该前置。

**不**推断：157 条整体接受、其他 AC 通过、其他页面授权、新的写入授权。
AC-022 定义行中的“各若干条”原文**保留不改写**。

## 2. 前序复审对象与范围

- 前序任务：`CLIENT-CONFIG-AC022-CONTROLLED-MULTIROW-ACCEPTANCE-001`。
- 固定区间：`1e72e4e39c01ea136cd7e0f3dcf6504a4de6939b..c63e675347a3a55a3edd31b7bd8f105eb3189841`。
- ChatGPT 远程独立复审：`APPROVED`。
- 复审范围：**已执行**的正常启停、证据与文档。
- **未执行的真实故障恢复不算验证通过**；本轮亦未新增任何故障恢复证据。

前序任务关键事实（见前序报告与证据）：

- 两个真实视口 1440×900、1920×1080；临时窗口同一时点 **2 启用 / 14 停用**。
- T02 原授权完整 ID 绑定；业务写尝试 enable 1、disable 1、recovery 0。
- 最终 GET `fgActive='0'`、`status=DISABLED`，6 个业务字段零差异。
- 提交时 AC-022 仍 `BLOCKED`，是该时点数量口径未确认的真实历史，不回写为当时已 `PASS`。

## 3. AC-022 逐原子证据重判表

只静态读取前序证据目录（未运行探针、未调用业务接口）：

```text
docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC022-CONTROLLED-MULTIROW-ACCEPTANCE-001/
```

`SHA256SUMS` 逐项校验通过。下表引用 `AC022-multirow-results.json` 真实键：

| 原子前置 / 步骤 / 预期 | 真实键与事实 | 结论 |
|---|---|---|
| 前置：目标功能已实现并部署 | 前序开工时后端/前端可访问，列表 16 行 | 满足 |
| 前置：列表含启用与停用探针各若干条 | `steps.B3_post_enable_1440` / `steps.B5_readonly_1920`：同一时点 `ui_enabled_rows=2`、`ui_disabled_rows=14`；负责人解释“各至少 2 条” | 满足（数量口径已确认） |
| 步骤：两种视口观察是否仍有“状态”列 | `steps.B3_post_enable_1440.table.has_status_column=false`；`steps.B5_readonly_1920.table.has_status_column=false` | 满足 |
| 步骤：停用记录“更多”下拉点击“启用” | `steps.B3_post_enable_1440.menus_disabled` 含 `["启用","删除"]`（多行）；`steps.B2_enable` 为真实菜单→确认后执行 | 满足 |
| 预期：无状态列、无列内启停文字操作 | `steps.B3_post_enable_1440.table.has_status_column=false`、`steps.B5_readonly_1920.table.has_status_column=false`、`steps.B3_post_enable_1440.table.inline_toggle_count=0`、`steps.B5_readonly_1920.table.inline_toggle_count=0` | 满足 |
| 预期：启用二次确认（标题/正文/按钮） | `steps.B2_enable`：title “启用探针”、`message_contains_exact_id=true`（目标 ID）、buttons `["取消","启用"]` | 满足 |
| 预期：取消确认不调用启用接口 | `steps.B3_post_enable_1440` / `steps.B5_readonly_1920` 各取消周期 `writes_delta=0`；`blocked_non_get=0` | 满足（浏览器门禁计数，非库级零写审计） |
| 预期：启用成功后状态变启用、“停用”标记消失 | `steps.B2_enable`：`put_status=200`、`reload_status=200`、`marker_after=false`；`steps.B4_post_enable_diff.fg_active="1"` | 满足 |
| 预期：仅 `FG_ACTIVE` 等状态派生字段变化 | `steps.B4_post_enable_diff`：`diff_fields=["fgActive","status"]`、`forbidden=[]`、`business_identical=true` | 满足 |
| 预期：停用后恢复 | `steps.B6_disable`：title “停用探针”、目标 ID 匹配、`put_status=200`、`reload_status=200`、`marker_after=true`；`steps.B7_final`：`fg_active="0"`、`status=DISABLED`、`business_identical=true`、`restored=true` | 满足 |
| 写入账本 | `write_attempts` 共 **2**（enable 1 / disable 1 / recovery 0）；`write_ledger.unsettled=2` 表示浏览器门禁预留的“已放行/结果未知”，**不**伪写为全部已结算；恢复分支未执行 | 如实记录 |

### 3.1 证据引用限制

前序脚本的 `dialogInfo` 使用**固定授权目标 ID** 比较，因此非目标行的
`dialog.message_contains_exact_id=false` **不**能证明该行自身正文缺失 ID；目标
`steps.B2_enable` / `steps.B6_disable` 的该字段为 `true`。需要证明其他行自身 ID 时，
只能引用真实已有对应证据；本任务**不**把 `false` 改写为 `true`，也不伪造新观察。

## 4. 旧 → 新状态

| AC | 旧状态 | 新状态 | 依据 |
|---|---|---|---|
| `CCFG-AC-022` | `BLOCKED` | `PASS` | 负责人 2026-11-03 数量解释 + 前序真实多行样本与成功态变化腿证据 |

其余 156 条状态不变；`CCFG-AC-082` 维持 `BLOCKED`。

## 5. 静态核验

| 校验项 | 结果 |
|---|---|
| 四族定义行计数 | `REQ154 / AC157 / DESIGN89 / UI77` |
| AC 编号 | `CCFG-AC-001~157` 完整、唯一、连续 |
| 改动前状态格复算 | `PASS 83 / FAIL 0 / BLOCKED 60 / NOT_RUN 14 = 157` |
| 改动后状态格复算 | `PASS 84 / FAIL 0 / BLOCKED 59 / NOT_RUN 14 = 157` |
| 定义行保护 | 除 `CCFG-AC-022` 状态 token `BLOCKED`→`PASS` 外，全部定义行逐字节不变 |
| 状态格保护 | 其余 156 个状态格不变 |
| 证据哈希 | `SHA256SUMS` 逐项通过 |
| 证据目录 | 未新增、未修改 |
| 敏感扫描 | 本轮新增文档未引入真实 ID/描述/机构/连接信息/原始 API 响应 |

## 6. 未执行项

- 未重新运行业务验收；未运行测试、构建、lint、类型检查、浏览器、探针；
- 未启停任何服务；未访问业务接口、数据库、ZooKeeper、Kafka、sync-client；
- 未做真实故障注入；恢复分支在本链中仍未执行验证；
- 未修改 REQUIREMENTS/DESIGN/UI/API/DATABASE、产品源码、CSS、测试、配置、模板、
  其他 Feature；未修改历史报告/脚本/JSON/哈希。

## 7. 状态边界

- 整体正式验收 / Feature 接受状态**不**翻转；本次**不**等于 157 条整体通过。
- 数量口径确认 ≠ 其他 AC 通过 ≠ 其他页面授权 ≠ 新的写入授权。
- 静态证据重判 ≠ 本轮重新运行真实采集。
- 本报告不预填自身提交 SHA，也不宣布本次远程文档复审已通过。

## 8. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_AC022_QUANTITY_CLARIFICATION_AND_EVIDENCE_REASSESSMENT_REVIEW`
