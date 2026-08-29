# DATA-SOURCE-DESIGN-BASELINE-001-R2 — 设计契约残留矛盾定向修订执行报告

> 任务类型：纯文档设计与契约草案定向修订（阶段4——设计与契约，R2 修订轮）
> 目标分支：`develop`
> 授权基准提交：`3b6496b6a2312450fd69be2edbbd287ceb756810`
> 前置复审结论：`CHANGES_REQUIRED`
> 需求状态：`APPROVED`
> 验收标准状态：`APPROVED`
> 实现状态：`NOT_STARTED`
> 报告日期：2026-08-29
> 最终提交 ID：见控制台结果块 `result_commit_id`（本报告不伪造尚未产生的 Commit ID）

---

## 1. 任务结论与授权基准

- 本任务为**纯文档定向修订**：只修复 R1 后残留的三处明确设计/契约矛盾，不改变任何已批准产品需求（`DS-REQ`）、不进入实现。
- 授权基准提交 `3b6496b6a2312450fd69be2edbbd287ceb756810`；任务开始前已核验 `HEAD == origin/develop == git ls-remote origin refs/heads/develop == 3b6496b6...`，远端未前进、未分叉，无 `BLOCKED_REMOTE_BASE_CHANGED`。
- 本轮只修改 3 份设计文档（`DESIGN.md`/`API.md`/`DATABASE.md`）并新增本报告；`UI.md` 本轮无需修改；**未修改** `REQUIREMENTS.md`、`ACCEPTANCE.md`、首轮报告、R1 报告、Feature README、项目/数据库基线、历史候选、任何代码/测试/构建文件/配置/菜单/路由。
- 四份设计文档状态保持 `DRAFT_PENDING_USER_REVIEW`，需求/验收保持 `APPROVED`，实现保持 `NOT_STARTED`；106 条验收用例全部 `NOT_RUN`。
- 本任务**不批准设计**：修订后的草案仍等待 ChatGPT 复审与用户最终批准；不代表代码已实现、构建通过、验收执行或生产可用。

---

## 2. 开始前 Git 状态

任务开始前记录：

| 项 | 值 |
|---|---|
| 当前分支 | `develop` |
| `git rev-parse HEAD` | `3b6496b6a2312450fd69be2edbbd287ceb756810` |
| `git rev-parse origin/develop` | `3b6496b6a2312450fd69be2edbbd287ceb756810` |
| `git ls-remote origin refs/heads/develop` | `3b6496b6a2312450fd69be2edbbd287ceb756810` |
| ahead/behind | 0 / 0 |
| 远端校验 | 精确等于授权基准，未前进/分叉 |

目标文件（`DESIGN.md`/`API.md`/`DATABASE.md`）在任务开始前均无既有修改（`git status --short` 授权区域内为空）；工作区既有无关内容（`frontend/**` 修改、`docs/database/TASK*.md` 删除、`docs/agent-prompts/**` 等未跟踪文件、`.claude/settings.local.json`、`agent-env.sh` 等）**原样保留**，未清理、未还原、未暂存、未提交。

---

## 3. 三项残留问题逐项修复说明

### 3.1 问题一：严格拆分命名策略"新增"与"编辑/删除"的计数语义

**缺口**：R1 后 `DESIGN.md` 与 `DATABASE.md` 出现"命名策略新增/编辑/删除均先按**原逻辑键**计数；0 行返回 `40401`；只有恰好 1 行才允许 DML"的合并描述。这对新增是错误：新增时不存在"原逻辑键"，新逻辑键计数为 0 正是允许插入的正常条件；按原文字实现，所有正常新增都会被拒绝。

**强制修订**（三文档统一区分）：
- **新增**：按**新逻辑键** `(sourceId, targetDataSourceId)` 全量计数——0 行允许执行 `INSERT`；1 行返回 `40902` 逻辑键重复；≥2 行返回 `40903` 存量多条异常；插入后校验受影响行数恰好为 1，否则抛保存异常并回滚；新增流程**不返回 `40401`**，不要求"原逻辑键恰好一行"。
- **编辑**：按**原逻辑键** `(sourceId, originalTargetId)` 全量计数——0 行 `40401`、≥2 行 `40903`、恰好 1 行继续；若新目标 ID 与原目标 ID 忽略大小写相同，不把当前行误判为重复；若逻辑键变化，按**新逻辑键**查重并排除原记录（0 行允许更新、1 行 `40902`、≥2 行 `40903`）；使用完整原逻辑键执行 UPDATE，影响行数必须为 1，否则抛异常并回滚。
- **删除**：按**原逻辑键**全量计数——0 行 `40401`、≥2 行 `40903`、恰好 1 行才允许删除；使用完整原逻辑键 DELETE，影响行数必须为 1，否则抛异常并回滚。
- 共同边界：目标设计不使用 `ROWNUM=1` 截断；不清洗、不合并、不自动删除重复存量；无锁、无数据库唯一约束、无 DDL，并发窗口限制继续明确保留。
- 删除所有把"新增"错误归入"原逻辑键必须恰好一行"的句子；三文档同时修正，未只改 API 而保留 DESIGN/DATABASE 的错误总括。

### 3.2 问题二：所有主记录操作落实 `FG_ACTIVE='1'`

**缺口**：`DS-REQ-002` 与 `DS-AC-010` 明确当前功能只查询和操作 `FG_ACTIVE='1'` 记录，其他值全部视为不存在。但 R1 后 `DATABASE.md` 详情/编辑/删除操作矩阵仍只写 `DATA_SOURCE_ID=?`；删除边界 SQL 仍写 `DELETE ... WHERE DATA_SOURCE_ID=?`；API 详情/编辑/删除没有逐接口明确 inactive 处理；操作矩阵甚至保留"删除不经 `FG_ACTIVE`"的矛盾描述。

**强制修订**：
- 主详情：按 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 定位；不存在或非 `'1'` 均返回 `40400`。
- 主编辑：先按原 ID 且 `FG_ACTIVE='1'` 定位；非 `'1'` 视为不存在，不更新；UPDATE 的 WHERE/受影响行数校验保证只操作该有效记录。
- 主删除：只允许物理删除 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 的当前记录；非 `'1'` 视为不存在并返回 `40400`。这仍是物理删除，不是修改 `FG_ACTIVE`。
- 业务属性、测试连接、命名策略源库角色校验继续要求有效记录；列表与目标候选继续固定有效过滤。
- "不检查关联、不级联、被引用不阻止"规则保持不变；增加有效条件不等于关联检查。
- DATABASE 操作矩阵/更新/删除边界/查询说明、DESIGN 核心流程/事务边界、API 逐接口与错误契约保持一致；删除所有"删除不经 `FG_ACTIVE`"或可能允许直接操作 inactive 主记录的表述。

### 3.3 问题三：明确 `40005` 与 `40006` 的唯一适用边界

**缺口**：R1 的 API 同时写了 `40005`（新 `targetDataSourceId` 不存在、未启用或不是 TARGET）与 `40006`（数据源角色不适用于当前操作），命名策略新增/编辑段又写新目标库角色不符返回 `40006`；同一"新目标不是 TARGET"场景因此可能返回两个业务码。

**强制修订**（统一互斥规则）：
- `40400 数据源不存在`：主详情/编辑/删除/业务属性/测试连接/命名策略的 `sourceId` 对应记录不存在，或该主记录 `FG_ACTIVE!='1'`（按批准规则视为不存在）。
- `40006 数据源角色不适用于当前操作`：业务属性接口中的主记录存在且有效但角色不是 TARGET；命名策略接口中的 `sourceId` 主记录存在且有效但角色不是 SOURCE。
- `40005 目标库无效`：命名策略新增/编辑请求中的 `targetDataSourceId` 不存在、`FG_ACTIVE!='1'` 或角色不是 TARGET；新目标库校验失败一律使用 `40005`，不得使用 `40006`。
- 目标候选列表只是过滤并返回有效 TARGET，不存在"某条目标候选角色不符返回 `40006`"的场景；从 `40006` 触发说明中删除"目标候选"。
- `40001` 仍只用于新增/编辑主表请求中的 `dataSourceCategory` 值非法。
- 上述优先级与适用接口写入 API 业务码表、场景表和逐接口说明；DESIGN/DATABASE 引用保持一致。

---

## 4. 各文档具体修订位置汇总

### DESIGN.md
- §2.3 编辑步骤 4：按原 ID 且 `FG_ACTIVE='1'` 定位，非 `'1'` 视为不存在返回 `40400`、不更新。
- §2.4 删除步骤 3：只物理删除 `FG_ACTIVE='1'` 当前记录，非 `'1'` 返回 `40400`，仍是物理删除非修改 `FG_ACTIVE`。
- §2.6 业务属性角色限定步骤 6：先 `FG_ACTIVE='1'` 定位（非 `'1'`→`40400`），存在且有效但角色非 TARGET→`40006`。
- §2.7 命名策略新增步骤 4：按新逻辑键全量计数 0/1/≥2（允许 INSERT / `40902` / `40903`）。
- §2.7 命名策略角色限定步骤 8：`sourceId` 非 `'1'`→`40400`、非 SOURCE→`40006`；新目标库无效一律 `40005`。
- §3 事务边界表（编辑/删除数据源行）：`FG_ACTIVE='1'` 定位与受影响行数校验。
- §3 命名策略计数总括：拆分为新增 / 编辑 / 删除三组，并保留共同边界（无 ROWNUM=1、不清洗存量、无锁/唯一/DDL）。
- §4 命名策略逻辑键唯一性：拆分为新增 / 编辑 / 删除的计数语义。

### API.md
- §2 组合逻辑键：原"多行异常防护"改为"计数语义（严格区分新增与编辑/删除）"。
- §4.2 详情 / §4.4 编辑 / §4.5 删除：逐接口明确 `FG_ACTIVE='1'` 定位，非 `'1'` 视为不存在返回 `40400`。
- §4.8 / §4.9 业务属性读/保存：`40400`（不存在或非 `'1'`）与 `40006`（存在且有效但非 TARGET）优先级互斥。
- §4.10 命名策略列表：`sourceId` 非 `'1'`→`40400`、非 SOURCE→`40006`。
- §4.11 命名策略新增：`sourceId` 校验（`40400`/`40006`）；新目标库无效一律 `40005`；新逻辑键计数 0 允许 INSERT、1→`40902`、≥2→`40903`；插入受影响行数=1；不返回 `40401`。
- §4.12 命名策略编辑：`sourceId` 校验（`40400`/`40006`）；新目标库无效一律 `40005`；原逻辑键计数 0→`40401`、≥2→`40903`、恰好 1 才 DML；新目标与原目标忽略大小写相同不误判重复；逻辑键变化按新逻辑键查重排除原记录。
- §4.13 命名策略删除：`sourceId` 非 `'1'`→`40400`、非 SOURCE→`40006`；原逻辑键计数 0→`40401`、≥2→`40903`、恰好 1 才 DML。
- §5.2 业务码清单：`40400`（含 `FG_ACTIVE!='1'` 视为不存在）、`40001`（仅主表新增/编辑类别）、`40005`（新目标库无效，一律 `40005`）、`40006`（移除"目标候选"，限定业务属性须 TARGET、命名策略入口须 SOURCE）；新增"业务码优先级（互斥）"说明。
- §5.3 场景表：`40400`/`40005`/`40006` 场景按互斥边界更新。

### DATABASE.md
- §2 操作矩阵：详情/编辑/删除行补 `FG_ACTIVE='1'` 定位与非 `'1'`→`40400`；删除删除行"不经 `FG_ACTIVE`"矛盾表述；策略新增/编辑/删除行拆分为新逻辑键计数（允许 INSERT / `40902` / `40903`）与原逻辑键计数（`40401` / `40903` / 恰好 1 才 DML），并按 `40400`/`40006`/`40005` 拆分角色与目标库校验。
- §3 更新和删除边界：修改主表 ID、删除数据源边界 SQL 补 `AND FG_ACTIVE='1'`；"确定性 WHERE 与多行异常防护"拆分为新增与编辑/删除两组计数语义。
- §4 查询与唯一校验：`FG_ACTIVE='1'` 固定过滤补"编辑、删除"并明确非 `'1'` 视为不存在返回 `40400`；角色限定查询补 `40400`/`40006`/`40005` 边界；命名策略逻辑键计数检查拆分为新增 / 编辑 / 删除。

---

## 5. 追踪数量与状态

| 项 | 值 |
|---|---|
| 需求追踪（DESIGN.md §9） | 109 条 `DS-REQ-001`~`109` 连续唯一、109/109 覆盖，无缺口 |
| 目标接口总数 | 13（每个均有关联 `DS-REQ` 与 `DS-AC`，见 API.md §1 总表） |
| 验收用例 | 106/106 全部 `NOT_RUN`（ACCEPTANCE.md 未改动） |
| 需求 / 验收状态 | `APPROVED`（未改动） |
| 四份设计文档状态 | `DRAFT_PENDING_USER_REVIEW` |
| 实现状态 | `NOT_STARTED` |

---

## 6. 机械检查结果

1. 109 条需求追踪连续唯一且 109/109 覆盖——通过（§5 与扫描核对）。
2. 13 个 API 均有关联 `DS-REQ` 与 `DS-AC`——通过（§1 总表 13 行均含两类编号）。
3. 106/106 用例仍为 `NOT_RUN`——通过。
4. 新增策略流程扫描：新键计数 0 明确允许 INSERT，且新增流程不出现 `40401`（三文档均有"0 行允许执行 `INSERT`"与"新增流程不返回 `40401`"表述）——通过。
5. 编辑/删除扫描：原键 0/1/≥2 与 DML 受影响行数校验明确（0→`40401`、≥2→`40903`、恰好 1 才 DML、受影响行数=1）——通过。
6. 所有主详情/编辑/删除的 API/DESIGN/DATABASE 描述均明确只操作 `FG_ACTIVE='1'`，inactive 返回 `40400`；删除"删除不经 `FG_ACTIVE`"表述——通过。
7. `40005` 与 `40006` 触发场景互斥；新目标库无效只返回 `40005`（API §5.2、§5.3 与逐接口一致）——通过。
8. `ROWNUM=1` 只出现在旧实现事实（DESIGN §1.2 当前实现事实列）或否定目标做法的语境——通过。
9. `REQUIREMENTS.md`、`ACCEPTANCE.md`、`UI.md`、首轮报告、R1 报告相对授权基准 `3b6496b` 零 diff（`git diff 3b6496b -- <file>` 均 0 行）——通过。
10. 四份设计文档状态仍为 `DRAFT_PENDING_USER_REVIEW`；`git diff --check` 通过（退出码 0）——通过。
11. 最终提交严格只包含 4 个授权文件（见 §9 精确暂存核验）——执行时核验。

---

## 7. 关键契约四文档一致性核对

- 命名策略新增/编辑/删除计数语义、`FG_ACTIVE='1'` 定位与 `40400`、`40005`/`40006`/`40400` 互斥边界在 `DESIGN.md`、`API.md`、`DATABASE.md` 中一致；`UI.md` 本轮无需修改且未改动。
- 以下 R1 正确结果保持不变：`originalDataSourceId` 与可编辑 `dataSourceId` 分离、未改密码测试只按原 ID 读取旧密码；`port` 为 JSON number / Java `Integer` 且持久化转换十进制字符串；目标设计不使用 `ROWNUM=1`；CATEGORY 写入统一大写、读取忽略大小写兼容；业务属性只限有效 TARGET、命名策略入口只限有效 SOURCE、新目标只限有效 TARGET；`targetDataSourceId` API 业务长度 ≤32 而物理列 128 不变；13 个接口路径、密码安全、测试连接、无分页、无 DDL、无关联维护规则不变。

---

## 8. 未修改需求、验收、代码、数据库和其他基线的证明

- `REQUIREMENTS.md`、`ACCEPTANCE.md`、首轮报告、R1 报告相对授权基准 `3b6496b` 零 diff。
- `UI.md` 本轮未修改（相对授权基准零 diff）。
- 未修改 Feature README、项目级基线（`docs/baseline/` 六份）、数据库基线（`docs/database/`）、历史候选、代码、测试、构建文件、配置、菜单、路由。
- 工作区既有无关内容保持原样，未暂存、未提交。

---

## 9. 环境未操作证明

| 环境 | 操作 | 结果 |
|---|---|---|
| 数据库访问 | 未连接、未执行任何 SELECT/SQL/DDL | 未操作 |
| 数据库写操作 | 未发生 | 未操作 |
| ZooKeeper 访问 | 未连接、未读取、未写节点 | 未操作 |
| 服务启停 | 未启动/停止任何后端或前端进程 | 未操作 |
| 后端构建 | 不适用（纯文档任务） | `NOT_APPLICABLE` |
| 前端构建 | 不适用（纯文档任务） | `NOT_APPLICABLE` |
| 测试代码 | 未修改任何测试 | 未操作 |
| 业务代码 | 未修改任何代码 | 未操作 |

---

## 10. Commit/Push/远端同步结果

- 按授权精确暂存 4 个文件：`docs/features/data-source-management/DESIGN.md`、`docs/features/data-source-management/API.md`、`docs/features/data-source-management/DATABASE.md`、`docs/features/data-source-management/reports/DATA-SOURCE-DESIGN-BASELINE-001-R2.md`；未使用 `git add .`/`git add -A`。
- Commit Message：`docs(data-source-management): close residual design contract gaps [DATA-SOURCE-DESIGN-BASELINE-001-R2]`。
- 普通推送 `git push origin develop`；推送后核验 `HEAD == origin/develop == git ls-remote origin refs/heads/develop` 且 ahead/behind 为 `0 0`。
- 实际 Commit ID 与推送结果见控制台结果块（`result_commit_id`/`remote_commit_id`/`push_status`），本报告不伪造尚未产生的 Commit ID。

---

## 11. 下一步

草案保持 `DRAFT_PENDING_USER_REVIEW`，等待 `CHATGPT_REVIEW_DESIGN_BASELINE_R2` 复审与用户最终批准；进入实现前不修改已批准需求/验收。

---

## 12. 控制台结果块

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=DATA-SOURCE-DESIGN-BASELINE-001-R2
branch=develop
base_commit_id=3b6496b6a2312450fd69be2edbbd287ceb756810
result_commit_id=见推送后实际值
remote_commit_id=见推送后实际值
requirements_status=APPROVED
acceptance_status=APPROVED
design_status=DRAFT_PENDING_USER_REVIEW
api_status=DRAFT_PENDING_USER_REVIEW
ui_status=DRAFT_PENDING_USER_REVIEW
database_design_status=DRAFT_PENDING_USER_REVIEW
implementation_status=NOT_STARTED
acceptance_case_count=106
all_cases_not_run=true
requirements_total=109
requirements_traced=109
api_endpoint_count=13
naming_strategy_insert_flow_status=FIXED
active_record_scope_status=ALIGNED
error_code_boundary_status=ALIGNED
business_code_change_status=NONE
test_code_change_status=NONE
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_access_status=NONE
service_operation_status=NONE
backend_build_status=NOT_APPLICABLE
frontend_build_status=NOT_APPLICABLE
push_status=见推送后实际值
ahead_behind=0 0
changed_files=docs/features/data-source-management/DESIGN.md,docs/features/data-source-management/API.md,docs/features/data-source-management/DATABASE.md,docs/features/data-source-management/reports/DATA-SOURCE-DESIGN-BASELINE-001-R2.md
next=CHATGPT_REVIEW_DESIGN_BASELINE_R2
error=
AGENT_TASK_RESULT_END
```
