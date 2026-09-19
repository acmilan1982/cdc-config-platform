# DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2 执行报告

- 任务编号：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2`
- 日期：2026-09-19
- 分支：`develop`
- 任务性质：`DOCUMENT_ONLY_MINIMAL_R2_CORRECTION`（**纯文档极小修订**）
- 复审依据：ChatGPT 对远程 R1 提交 `c4e10486465fbb406dbc068ff0998c49edd4e53b` 的独立复审
  （`review_status=CHANGES_REQUIRED`、`blocking_finding_count=1`、`implementation_may_start=NO`）
- 实现授权：`NOT_GRANTED_IN_THIS_TASK`
- 测试与构建：`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`

> 本 R2 只修复 ChatGPT 对 R1 复审发现的**唯一阻塞**：`DATABASE.md §9.2` 的两处关联表述错误——「停用」的
> `NULL`/非 `0`/`1` 被统一写成 `FG_ACTIVE IS NULL`（无法匹配非空异常值），以及 `40250` 的适用范围误含 `disable`。
> **未**实现任何功能、**未**批准基线、**未**执行正式验收；**未**修改任何 `.java`/`.vue`/`.ts`/测试/依赖/锁定文件/配置/SQL/
> 数据库对象；**未**访问数据库 / ZooKeeper / Kafka；**未**启动/停止服务。

---

## 1. Git 现场

```text
branch=develop
reviewed_base_commit_id=c4e10486465fbb406dbc068ff0998c49edd4e53b
HEAD(before)=c4e10486465fbb406dbc068ff0998c49edd4e53b
origin/develop(before)=c4e10486465fbb406dbc068ff0998c49edd4e53b
rev-list --left-right --count HEAD...origin/develop (before) = 0	0
git status --short --branch (before) =
    ## develop...origin/develop
     M .claude/settings.local.json
    ?? docs/prompts/
result_commit_id / remote_commit_id / ahead_behind（after）：见任务控制台结果块
```

- 开始前执行 `git fetch origin develop`，确认 `origin/develop` **仍为** `c4e1048...`，与 `reviewed_base_commit_id` 一致，未出现新远程提交，无需换基准。
- 任务开始前工作区已有的 `.claude/settings.local.json`（修改）与 `docs/prompts/`（未跟踪）属用户现场，本任务**未**修改、**未**暂存、**未**提交、**未**回滚。

## 2. ChatGPT 对 R1 的唯一阻塞发现

```text
reviewed_commit=c4e10486465fbb406dbc068ff0998c49edd4e53b
review_status=CHANGES_REQUIRED
blocking_finding_count=1
implementation_may_start=NO
```

R1 的其余修订均已通过：不存在的需求编号引用已清除；两接口先读取、幂等不写、条件 `UPDATE`、并发冲突返回 `50002`
的总方案已冻结；所有启停失败均不自动刷新、只有成功后刷新；编号、数量、状态和修改范围正确。

唯一阻塞在 `DATABASE.md §9.2`，含两处关联表述错误：

1. 「停用」操作矩阵把 `NULL`/非 `0`/`1` 统一写成条件 `FG_ACTIVE IS NULL`。该条件只能匹配 `NULL`，**无法匹配 `'X'` 等非空异常值**，会使非空异常记录停用归一化失败。
2. 矩阵后的说明仍写成“`NULL`/非 `0`/`1` 一律视为非法……对启停接口返回 `40250`”，**错误地把 `disable` 也包含在内**；正确状态机是 `enable` 遇异常返回 `40250`，`disable` 遇异常允许按原状态条件写为 `'0'`。

## 3. `DATABASE.md §9.2`「停用」原状态匹配矩阵（修订前 / 修订后）

### 3.1 修订前（错误）

| 读到的原始 `FG_ACTIVE` | 修订前行为 |
|---|---|
| `'1'` | 条件 `UPDATE ... AND FG_ACTIVE='1'` 写 `'0'` |
| `'0'` | 幂等成功不写 |
| `NULL` / 非 `0`/`1`（**整体**） | 条件 `UPDATE ... AND FG_ACTIVE IS NULL` 写 `'0'` 归一化 ← **非空异常值（如 `'X'`）无法被 `IS NULL` 匹配，归一化遗漏** |
| 记录不存在 | `40400` 不写 |

### 3.2 修订后（正确）

| 读到的原始 `FG_ACTIVE` | 修订后行为 |
|---|---|
| `'1'` | 条件 `UPDATE ... AND FG_ACTIVE='1'` 写 `'0'` |
| `'0'` | 幂等成功，不执行 DML |
| `NULL` | 使用 §9.3 的 NULL-safe 原状态匹配条件，以 `FG_ACTIVE IS NULL` 匹配，写 `'0'` |
| 非空且非 `'0'`/`'1'`（例如 `'X'`） | 使用 §9.3 的 NULL-safe 原状态匹配条件，以 `FG_ACTIVE = :observedStatus`（`observedStatus='X'`）**精确匹配**，写 `'0'` |
| 记录不存在 | `40400`，不执行 DML |

保持现有“先读 + 幂等判断 + 原状态条件 `UPDATE`”总体方案不变，只精确修正异常状态的匹配方式。

## 4. `40400` / `40250` / 异常停用归一化的准确适用范围

| 接口 | `'1'`/`'0'` | `NULL` / 非 `0`/`1` |
|---|---|---|
| 非启停维护接口（详情、编辑、删除、业务属性读/保存、源库命名策略列表/新增/编辑/删除、编辑态连接测试） | 接受 | **拒绝并返回 `40400`** |
| `enable` | `'0'` → 条件 `UPDATE` 写 `'1'`；`'1'` → 幂等成功不写 | **返回 `40250`，不写库** |
| `disable` | `'1'` → 条件 `UPDATE` 写 `'0'`；`'0'` → 幂等成功不写 | **不返回 `40250`**，按 NULL-safe 原状态条件 `UPDATE` 显式归一化为 `'0'` |

- `40250` **只**适用于异常状态的 `enable`；异常状态的 `disable` 归一化为 `'0'`，不返回 `40250`。
- 未新增错误码；未改变 `DESIGN.md`/`API.md`/`ACCEPTANCE.md` 已冻结的状态机。

## 5. `DATABASE.md §9.3`（保持为权威通用条件）

§9.3 伪 SQL 语义保持正确、仅补一条极小交叉引用说明：

```sql
UPDATE CDC_DATA_SOURCE
SET FG_ACTIVE = :targetStatus
WHERE DATA_SOURCE_ID = :dataSourceId
  AND (
        FG_ACTIVE = :observedStatus
        OR (FG_ACTIVE IS NULL AND :observedStatus IS NULL)
      )
```

- `observedStatus = NULL` 时**只**匹配数据库 `NULL`；`observedStatus = 'X'` 等**非空异常值**时通过 `FG_ACTIVE = :observedStatus` 精确匹配；**不得**把所有异常状态统一写成 `FG_ACTIVE IS NULL`。
- **不得**退化为无状态条件 `UPDATE`；条件 `UPDATE` 影响行数不为 1 仍返回 `50002` 并回滚。

## 6. 实际修改文件

| 文件 | 操作 | 变更范围 |
|---|---|---|
| `docs/features/data-source-management/DATABASE.md` | 修改 | §9.2「停用」行按 NULL-safe 原状态匹配重写；§9.2 错误码说明改为分场景（非启停接口 `40400` / `enable` `40250` / `disable` 归一化）；§9.3 增补 `observedStatus` 原状态匹配说明；新增 §10.3 R2 变更记录 |
| `docs/features/data-source-management/README.md` | 修改 | §2.3 追加 R2 修订链并指向本 R2 报告；§5 新增 R2 变更记录行；状态分层与导航未改 |
| `docs/features/data-source-management/reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001.md` | 修改 | 在 R1 勘误声明之后新增 R2 勘误声明；§12 新增 R2 勘误记录行；历史内容保留未删 |
| `docs/features/data-source-management/reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R1.md` | 修改 | 标题后新增醒目 R2 勘误声明（定向修正 §5“跨文档一致性 / 无残留冲突”的不完整结论）；§8 新增 R2 勘误记录行；历史内容保留未删 |
| `docs/features/data-source-management/reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2.md` | **新增** | 本报告 |

**未修改**：`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`API.md`、`UI.md`（相对基准提交零 diff）；任何 `.java`/`.vue`/`.ts`/测试/依赖/锁定文件/配置/SQL/数据库对象；`docs/baseline/**`；其他 Feature；公共组件；未授权历史报告；任务前已有的 `.claude/settings.local.json`、`docs/prompts/`。

## 7. 编号、数量、状态与正文保护检查

```text
requirements_before=DS-REQ-001..177 (177 条)
requirements_after =DS-REQ-001..177 (177 条)
requirements_change_status=NONE                              # 编号与正文零变化
new_requirement_range=DS-REQ-139_TO_177
new_requirement_count=39                                     # 仍为 39 条

acceptance_before=DS-AC-001..182 (182 条)
acceptance_after =DS-AC-001..182 (182 条)
acceptance_change_status=NONE                                # 编号、状态、关联需求、前置条件、步骤、预期结果全部零变化
new_acceptance_range=DS-AC-141_TO_182
new_acceptance_count=42                                      # 仍为 42 条，全部 NOT_RUN
previous_adjustment_acceptance_status=DS-AC-116_TO_140_ALL_NOT_RUN   # 仍为 25 条全部 NOT_RUN
existing_acceptance_status=PASS_113_FAIL_0_BLOCKED_2_NOT_RUN_0       # 逐字保留
blocked_cases=DS-AC-104,DS-AC-108                            # 两个既有 BLOCKED 及证据不变

design_change_status/API_change_status/UI_change_status=NONE
business_code_change_status/test_code_change_status=NONE
traceability_status=COMPLETE_AFTER_R2
```

- 本轮草案状态仍为 `DRAFT_PENDING_USER_REVIEW`、`implementation_status=NOT_STARTED`、`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK`、`new_adjustment_acceptance_status=ALL_NOT_RUN`；未获批准、未授权实现、未执行验收。
- 启停仍只修改 `CDC_DATA_SOURCE.FG_ACTIVE`；无级联、无 DDL、无存量清洗、不访问源库/ZooKeeper/Kafka、不操作服务或进程。

## 8. 静态检查结果

| 检查 | 结果 |
|---|---|
| `git diff --check` | 无空白/冲突标记问题 |
| 变更文件范围 | 仅 §6 的 5 个文件（4 修改 + 1 新增），无范围外文件 |
| `REQUIREMENTS`/`ACCEPTANCE`/`DESIGN`/`API`/`UI` 相对基准零 diff | 是（`git diff --stat <base> -- <files>` 为空） |
| `DS-REQ-139~177` 数量与正文 | 39 条，正文零变化 |
| `DS-AC-141~182` 数量与状态 | 42 条，全部 `NOT_RUN`，正文零变化 |
| 上一轮 `DS-AC-116~140` 与既有统计 | 25 条全部 `NOT_RUN`；`PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 未变 |
| 定向搜索：异常状态统一写成 `FG_ACTIVE IS NULL` | 当前有效文档为 **0** |
| 定向搜索：`disable` 异常状态写成返回 `40250` | 当前有效文档为 **0** |
| 定向搜索：非空异常值停用归一化遗漏 | 当前有效文档为 **0** |
| 定向搜索：无状态条件 `UPDATE` | 当前有效文档为 **0**（仅保留“禁止无状态条件 `UPDATE`”的否定式表述） |
| 定向搜索：失败后自动刷新 | 当前有效文档为 **0** |
| 跨文档一致性 | `DATABASE §9.2`/§9.3 与 `DESIGN §13.5`、`API §11.3`、`ACCEPTANCE DS-AC-165/166/170/171` 的异常状态语义一致 |

## 9. 明确未执行事项

- 未实现任何功能；未新增/修改接口实现、未新增错误码实现；
- 未修改任何业务代码、测试代码、依赖、锁定文件、配置、SQL 或数据库对象；
- 未访问数据库 / ZooKeeper / Kafka；未执行任何 DDL/DML；未启动/停止/重启服务；
- 未运行 Maven / npm 测试或构建（`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`）；
- 未批准基线；未执行任何正式验收；本轮 42 条验收仍全部 `NOT_RUN`；
- 未把草案状态写成 `APPROVED`/`IMPLEMENTED`/`IMPLEMENTED_ACCEPTED`/已测试/已验收/生产可用。

## 10. 下一步入口

```text
next_step=CHATGPT_REMOTE_GIT_R2_REVIEW_THEN_PROJECT_OWNER_BASELINE_APPROVAL_DECISION
```

1. ChatGPT 必须**先从远程 Git 独立复审 R2**（`origin/develop` 上的 R2 提交），核对唯一阻塞问题（`DATABASE.md §9.2` 两处关联表述错误）是否已按本报告修正。
2. 复审通过后，由**项目负责人**决定是否批准本轮调整基线；批准后**另行**生成实现任务提示词。
3. 本任务**不得**继续实现。

---

## 11. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-19 | 创建本报告：记录 Git 现场、ChatGPT 对 R1 的唯一阻塞发现、`DATABASE.md §9.2` 修订前/后原状态匹配矩阵、`40400`/`40250`/异常停用归一化的适用范围、§9.3 权威通用条件、实际修改文件、编号/数量/状态/正文保护检查、静态检查结果、未执行事项与下一步入口 | DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2（ChatGPT 远程 R2 复审 `CHANGES_REQUIRED` 定向修订；纯文档任务） |
