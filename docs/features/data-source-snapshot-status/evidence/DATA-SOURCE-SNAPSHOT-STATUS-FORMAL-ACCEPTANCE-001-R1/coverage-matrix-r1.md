# R1 补验覆盖矩阵 — DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1`
- 起点提交：`3190b3d2450478bef34b24578312c76c3973cb08`
- 执行日期：2026-09-12
- 本文件只覆盖 **R1 职责范围**：`DSS-AC-065` 定向补验 + 提示词 §9.1 必要回归。
- **未重跑**的其余 R0 `PASS` 用例沿用 R0 结论（任务 §13：本任务不改代码，无需机械重跑全部 107 条）。

## 0. 图例

| 证据类型 | 含义 |
|---|---|
| `DB` | 真实 Oracle 开发库只读查询或阶段 A 获批 DML |
| `HTTP` | 真实后端 `8080` 的 `GET /api/monitor/data-source-run-state/list` |
| `BR` | 真实 Chromium 加载正式 `5173` 页面（真实后端 + 真实库） |
| `SC` | 静态/日志审阅（含运行期 SQL 审计） |
| `BT` / `FT` / `BUILD` | 后端定向测试 / 前端定向测试 / 前端构建 |
| `SVC` | 服务存在性与代码来源 |
| `SQL-APPROVAL` | 阶段 A 审批包与人工批准记录 |

> 本目录**不含** `BI`（响应拦截替换）证据。全部判定基于真实数据库行、真实后端响应与真实页面渲染。

## 1. `DSS-AC-065`（R0 唯一 `BLOCKED` → R1 补验）

| 项 | 内容 |
|---|---|
| R0 状态 | `BLOCKED`（R0 任务 §6.2 明确不授权 DML，且无充分替代证据） |
| R1 状态 | **`PASS`** |
| 用例要求 | 备份 → 构造 → 执行相关验收 → 恢复 → 逐行一致核验；只操作 `CDC_DATA_SOURCE_RUN_STATE`，禁 DDL / 禁其它表 / 禁生产库 |
| 前置授权 | 项目负责人 2026-09-12 明确“同意”总体授权（`sql-approval/approval-record.md` §1）；阶段 A 完整 SQL 展示后明确回复“**批准执行上述 SQL**”（同文件 §2） |

### 1.1 备份（DML 前）

| 用例要求 | 证据 |
|---|---|
| 六字段全表有序导出 | `database/run_state_before.txt` |
| 总行数 | `database/run_state_before.txt`（30 行）；`sql-approval/phaseA-identity.txt` |
| 完整复合主键集合 | `database/precondition-verify.txt`、`sql-approval/phaseA-digests.txt` |
| 状态分布 | `database/before-digests.txt` |
| NULL 计数 | `database/before-digests.txt`（`LAST_SEEN` 13 / `COMPLETED` 19） |
| 全行内容摘要 | `before-digests.txt`：`content_digest=3928100845`、`pk_set_digest=524003855` |
| 任务前缀命中数（必须 0） | `database/precondition-verify.txt`（`dss-fa065-r1-` 三表均 0） |
| 三张业务表任务前快照 | `database/run_state_before.txt`、`client_multiple_before.txt`、`data_source_before.txt` |

### 1.2 构造（阶段 A 已批准精确 `INSERT`）

| 用例要求 | 证据 |
|---|---|
| 实际新增行数 = 批准数量 | `database/insert-run.txt`（7 × `1 row created` + `COMMIT`）、`database/insert-verify.txt`（37 行） |
| 每个精确复合主键存在且六字段等于计划值 | `database/run_state_after_insert.txt`、`http/01..12-*.json`（真实后端回读） |
| 非本任务行未变化 | `database/insert-verify.txt`（30 → 37 = 仅 +7） |
| `CDC_CLIENT_MULTIPLE` / `CDC_DATA_SOURCE` 零变化 | `database/insert-verify.txt`（配置表零变化）、`database/client_multiple_restored.txt`、`data_source_restored.txt` |

7 条临时行覆盖场景（提示词 §7.2）：

| # | 场景 | 主键 | 证据 |
|---|---|---|---|
| S1 | 正常关联 → `SNAPSHOT_COMPLETED` | `hosp-007` / `112-source-19c` | `browser/fa065-cases.json` `S1_completedRow` |
| S2 | 正常关联 → 未知状态 | `hosp-002` / `112-source-19c` | `S2_unknownRow` |
| S3 | 孤立探针端 | `dss-fa065-r1-client-orphan` / `112-source-19c` | `S3_orphanProbeFallback` |
| S4 | 孤立源库 | `hosp-0061` / `dss-fa065-r1-source-orphan` | `S4_orphanSourceFallback` |
| S5 | 既有停用探针配置 | `CCFG-AC-R1-OFF` / `112-source-19c` | `S5_disabledProbeMark` |
| S6 | 既有停用源库配置 | `CCFG-AC-R1-ON` / `199-source` | `S6_disabledSourceConfig` |
| S7 | 既有非 SOURCE 类别数据源 | `hosp-012` / `company-target-doris-v4` | `S7_nonSourceCategory` |

> S5/S6/S7 引用的是**开发库既有只读关联配置**，未写入任何配置表；构造只发生在 `CDC_DATA_SOURCE_RUN_STATE`。

### 1.3 真实 DB / API / 浏览器补验（§9.1~§9.8）

| §9 要求 | 状态 | 证据 |
|---|---|---|
| ① 真实 DB 只读核对临时行 | PASS | `database/run_state_after_insert.txt` |
| ② 真实 `GET .../list` 无参 + 精确 `clientId`/`sourceId`/`status` | PASS | `http/01..12-*.json` + `http/SUMMARY.txt`（12 条；37 行；含 `code=41002` 非法状态） |
| ③ 真实浏览器进入正式页面 | PASS | `browser/scripts/fa065-r1.cjs`、`browser/rows.json`、`browser/screenshots/01-full-page.png` |
| ④ COMPLETED / 未知 / 孤立探针 / 孤立源库 / 既有关联异常 | PASS | `browser/fa065-cases.json` 的 `S1..S7`（7/7） |
| ⑤ RUN_STATE 行全部保留、不被过滤 | PASS | `runStateRowsAllRetained`（37 行）、`sevenTempRowsAllPresent` |
| ⑥ 展示 / 回退 / 状态标签 / Tooltip / 排序符合当前批准规则 | PASS | `S1..S7` + `sortRunningGroupHead`、`sortGroupBoundaries`、`sortUnknownGroupHead`、`sortCompletedGroupHead` |
| ⑦ 查询/刷新只产生 GET，页面无写请求 | PASS | `noWriteRequestFromPage`（非 GET = 0）、`onlyListApiUsed` |
| ⑧ 运行 SQL 对 Feature 三表只有 `SELECT` | PASS | `readonly/runtime-audit.txt`（三表各 25 `SELECT` / 0 `WRITE`） |
| ⑨ 完成后执行 §8.3 恢复 | PASS | `database/delete-run.txt`、`database/restore-verify.txt` |

浏览器侧 26 条断言全部 `PASS`（`browser/SUMMARY.txt`、`browser/fa065-cases.json`），含分布 `快照进行中 17 / 未知状态 7 / 快照已完成 13`、真实查询控件 7 条过滤/重置、Console/Page 错误 0。

### 1.4 恢复（§8.3 无条件优先）

| 用例要求 | 证据 | 结果 |
|---|---|---|
| 7 条精确复合主键 `DELETE` + `COMMIT` | `database/delete-run.txt` | 各 1 行 × 7 |
| 任务前缀剩余 0 | `database/restore-verify.txt` | 0 |
| 与任务前导出**逐字节比较** | `restore-verify.sh` + `restore-verify.txt` | `run_state` 一致（`03f4044c…`） |
| 行数 | 同 | 30（任务前 30） |
| 主键集合 | 同 | 7 个主键全部消失 |
| 状态分布 | 同 | 与任务前一致 |
| NULL 计数 | 同 | `LAST_SEEN` 13 / `COMPLETED` 19 |
| 内容摘要 | 同 | `content_digest=3928100845`、`pk_set_digest=524003855` |
| `CDC_CLIENT_MULTIPLE` 零变化 | `client_multiple_before.txt` vs `_restored.txt` | 逐字节一致（`a9f7d2fa…`） |
| `CDC_DATA_SOURCE` 零变化 | `data_source_before.txt` vs `_restored.txt` | 逐字节一致（`34e9a709…`） |
| API 层恢复证明 | `http/99-post-restore-no-params.json` + `http/post-restore-check.txt` | 与 R0 `01-no-params.json` payload 逐字段一致（仅 `timestamp` 不同） |

**判定：`DSS-AC-065 = PASS`。**

## 2. §9.1 必要回归（受构造数据影响）

| 编号 | 关注点 | 状态 | 证据 |
|---|---|---|---|
| `DSS-AC-006` | RUNNING/COMPLETED 语义与行—组合对应 | PASS（维持） | `http/01-no-params.json`（真实 `clientId/sourceId` 逐行）、`browser/rows.json` |
| `DSS-AC-014` | 行集合与 RUN_STATE 一一对应、无凭空行 | PASS（维持） | 构造后 `37` = 30 + 7（`database/insert-verify.txt`、`runStateRowsAllRetained`） |
| `DSS-AC-015` | 配置表有、RUN_STATE 无的组合不展示 | PASS（维持） | 30 → 37 只增构造行；`candidates` 与 records 分离（`http/01-no-params.json`） |
| `DSS-AC-016` | 不出现推断/虚拟状态 | PASS（维持） | `rows.json` 状态集合仅 `快照进行中/未知状态/快照已完成` |
| `DSS-AC-017` | 关联缺失/停用/异常行仍展示 | PASS（维持） | S3 `orphanProbeFallback`、S4 `orphanSourceFallback`、S5 `disabledProbeMark`、S6 `disabledSourceConfig`、S7 `nonSourceCategory` |
| `DSS-AC-018` | 一次请求返回全部、无分页 | PASS（维持） | `http/01-no-params.json` 一次返回 37 行；页面无分页控件（`rows.json`） |
| `DSS-AC-019` | 序号稳定连续唯一 | PASS（维持） | `rows.json` 序号 1..37；7 个主键唯一（`precondition-verify.txt`） |
| `DSS-AC-022` | 候选来源/未知状态筛选 | PASS（维持） | `http/06-filter-status-unknown.json`（7 行）、`uiFilter_status_unknown`；`candidates` 含 `UNKNOWN` |
| `DSS-AC-023` | 条件内“或”、跨条件“且”、异常行不影响命中 | PASS（维持） | `uiFilter_client_hosp007`、`uiFilter_client_hosp002_unknown`、`uiFilter_source_orphanSource`、`uiFilter_client_orphanProbe` |
| `DSS-AC-033` | `SNAPSHOT_COMPLETED` → 绿色“快照已完成” | PASS（维持） | S1 `S1_completedRow`（`el-tag--success`） |
| `DSS-AC-034` | 未知状态行正常展示、接口不报错、不丢弃不改写 | PASS（维持） | S2 `S2_unknownRow`；`http/07-filter-status-completed.json` 等无报错 |
| `DSS-AC-035` | 橙色“未知状态”标签 + 原始值可查 | PASS（维持） | `S2_unknownRow`（`el-tag--warning`）、`statusTt` 原始值 Tooltip |
| `DSS-AC-036` | 不依赖开发库天然 COMPLETED | PASS（维持） | COMPLETED 行由受控构造提供（S1/S4） |
| `DSS-AC-037` | 三类状态行均完整返回、无丢弃 | PASS（维持） | `statusDistribution17_7_13`（17+7+13=37） |
| `DSS-AC-038` | 孤立探针端静默回退原始 ID、无黄色图标 | PASS（维持） | `S3_orphanProbeFallback`（`probeDash` 假、无 `dss-inactive-mark`） |
| `DSS-AC-039` | 孤立源库回退完整原始 ID、无异常提示 | PASS（维持） | `S4_orphanSourceFallback`（`src` = 原始 ID、`srcInactive=false`） |
| `DSS-AC-040` | 停用探针红字“停用”、停用源库不显示异常 | PASS（维持） | `S5_disabledProbeMark`（`dss-inactive-mark`）、`S6_disabledSourceConfig` |
| `DSS-AC-041` | 非 SOURCE 类别静默降级、无异常文字 | PASS（维持） | `S7_nonSourceCategory`（`doirs库`、无异常标记） |
| `DSS-AC-042` | 异常不再以黄色图标/Tooltip 说明呈现、无写行为 | PASS（维持） | `S1..S7` 全部 `probeInactive/srcInactive` 符合；`noWriteRequestFromPage` |
| `DSS-AC-043` | 状态分组序 `RUNNING < 未知 < COMPLETED` | PASS（维持） | `sortRunningGroupHead`、`sortGroupBoundaries`（17/24） |
| `DSS-AC-044` | 组内 `UPDATED_AT` 倒序 | PASS（维持） | `sortUnknownGroupHead`、`sortCompletedGroupHead`、`rows.json` 时间列 |
| `DSS-AC-045` | 并列时 `CLIENT_ID`/`DATA_SOURCE_ID` 确定性排序 | PASS（维持） | `browser/rows.json` 稳定次序（两次加载一致） |
| `DSS-AC-052` | 时间列 `YYYY-MM-DD HH:mm:ss`、NULL 显示 `--` | PASS（维持） | S2 `--`（`completed`）、S7 快照启动 `--`；其余行为完整时间戳 |
| `DSS-AC-053` | 不出现基于时间的推断状态 | PASS（维持） | `rows.json`（无“超时/异常/离线”文案） |
| `DSS-AC-054` | 长时间 RUNNING 不自动判错 | PASS（维持） | S3/S5/S7 `● 快照进行中` 正常展示 |
| `DSS-AC-062` | 失败脱敏、查询路径无写操作 | PASS（维持） | `http/12-invalid-status.json`（`code=41002` 无堆栈）、`readonly/runtime-audit.txt`（`write_statement_count=0`） |
| `DSS-AC-063` | DML 授权边界、备份、恢复、逐行一致、禁 DDL | PASS（维持） | 本目录 `sql-approval/**`、`database/**`（阶段 A 审批包 + 恢复核验） |
| `DSS-AC-064` | 真实 RUNNING 样例真实来源于 RUN_STATE | PASS（维持） | `http/01-no-params.json` 基线 30 行 + `rows.json` |
| `DSS-AC-065` | 受控构造 DML 治理全流程 | **PASS（R1 由 BLOCKED 转）** | 见 §1 |

**回归结论：§9.1 全部用例维持 `PASS`，未发现任何回归。**

## 3. 计数与结论

- `DSS-AC-065`：`BLOCKED` → **`PASS`**。
- 正式验收四态计数：**`PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0 = 107`**。
- 数据恢复：三表与任务前**逐字节一致**，任务前缀残留 **0**。
- 天花板：**正式验收已执行完成，待 ChatGPT 从远程 Git 复审**；**不构成** `IMPLEMENTED_ACCEPTED` / `FORMALLY_ACCEPTED` / Feature 完成。
