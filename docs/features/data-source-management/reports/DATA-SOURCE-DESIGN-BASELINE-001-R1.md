# DATA-SOURCE-DESIGN-BASELINE-001-R1 — 设计契约复审定向修订执行报告

> 任务类型：纯文档设计与契约草案定向修订（阶段4——设计与契约，R1 修订轮）
> 目标分支：`develop`
> 授权基准提交：`f7ea3eb2a1343a0600deb86404ce6775a810dce9`
> 前置复审结论：`CHANGES_REQUIRED`
> 需求状态：`APPROVED`
> 验收标准状态：`APPROVED`
> 实现状态：`NOT_STARTED`
> 报告日期：2026-08-29
> 最终提交 ID：见控制台结果块 `result_commit_id`（本报告不伪造尚未产生的 Commit ID）

---

## 1. 任务结论与授权基准

- 本任务为**纯文档定向修订**：只修复 ChatGPT 复审指出的四类设计/契约歧义，不改变任何已批准产品需求（`DS-REQ`）、不进入实现。
- 授权基准提交 `f7ea3eb2a1343a0600deb86404ce6775a810dce9`；任务开始前已核验 `HEAD == origin/develop == git ls-remote origin refs/heads/develop == f7ea3eb2...`，远端未前进、未分叉，无 `BLOCKED_REMOTE_BASE_CHANGED`。
- 本轮只修改 4 份设计文档（`DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`）并新增本报告；**未修改** `REQUIREMENTS.md`、`ACCEPTANCE.md`、首轮报告、Feature README、项目/数据库基线、历史候选、任何代码/测试/构建文件/配置/菜单/路由。
- 四份设计文档状态保持 `DRAFT_PENDING_USER_REVIEW`，需求/验收保持 `APPROVED`，实现保持 `NOT_STARTED`；106 条验收用例全部 `NOT_RUN`。
- 本任务**不批准设计**：修订后的草案仍等待 ChatGPT 复审与用户最终批准；不代表代码已实现、构建通过、验收执行或生产可用。

---

## 2. 开始前 Git 状态

任务开始前记录：

| 项 | 值 |
|---|---|
| 当前分支 | `develop` |
| `git rev-parse HEAD` | `f7ea3eb2a1343a0600deb86404ce6775a810dce9` |
| `git ls-remote origin refs/heads/develop` | `f7ea3eb2a1343a0600deb86404ce6775a810dce9` |
| ahead/behind | 0 / 0 |
| 远端校验 | 精确等于授权基准，未前进/分叉 |

工作区既有无关内容（`frontend/**` 修改、`docs/database/TASK*.md` 删除、`docs/agent-prompts/**` 等未跟踪文件、`.claude/settings.local.json`、`agent-env.sh` 等）**原样保留**，未清理、未还原、未暂存、未提交。

---

## 3. 四项复审问题逐项修复说明

### 3.1 R1 问题一：编辑时测试连接必须使用"原数据源 ID"读取旧密码

**缺口**：首轮 `API.md` 测试连接用 `dataSourceId` 读取持久化密码，但编辑表单允许修改 ID，导致定位键错误。

**修订**（四文档统一状态模型）：
- 前端打开编辑弹窗时单独保存不可编辑的 `originalDataSourceId`（值为打开弹窗时的原始主键）；表单中的 `dataSourceId` 仍是用户可自由修改的新值，**不得用作"读取持久化旧密码"的定位键**。
- 新增场景：`originalDataSourceId` 缺席，`password` 必填。
- 编辑且密码未修改：`originalDataSourceId` 必填，`password` 字段缺席；后端只按 `originalDataSourceId` 定位当前 `FG_ACTIVE='1'` 记录并读取持久化密码。
- 编辑且密码已修改：使用请求中的新密码；可携带 `originalDataSourceId` 表明编辑上下文，但不得读取或混用旧密码。
- 修改表单中当前 `dataSourceId` 后测试连接、未修改密码时仍必须使用原记录密码。
- 不向前端返回真实密码，不以掩码字符串当哨兵，不把原密码/连接串/堆栈写入日志/响应。

**修订位置**：
- `DESIGN.md` §2.3 步骤 2/4（编辑状态模型与 `originalId`= `originalDataSourceId`）、§2.5 编辑弹窗 1/2/3（按 `originalDataSourceId` 读取持久化密码）、§5 密码安全（定位键与日志边界）。
- `API.md` §3 密码契约表（测试连接编辑未改密码行）、§3 新增 `originalDataSourceId` 语义分离说明、§4.4 PUT（`originalId`= `originalDataSourceId`）、§4.6 测试连接请求（字段规则与示例）、§5.2 `40400` 触发（`{id}`/`originalDataSourceId` 定位）。
- `UI.md` §2 编辑状态模型、§3 编辑未改密码测试、§7 一致性。
- `DATABASE.md` §2 连接测试行、§5 数据安全测试读取、§6 一致性。

### 3.2 R1 问题二：端口的 API 类型必须唯一、明确、跨文档一致

**冲突**：首轮 JSON 示例把 `port` 写成字符串 `"1521"`，字段规则写 `int`，数据库物理列又是 `VARCHAR2(64)`。

**修订**（统一契约）：
- API 请求/响应中 `port` 类型为 JSON number / Java `Integer`，示例写 `1521`，不加引号。
- 前端表单模型使用数值端口，只接受整数 `1..65535`。
- 后端 DTO 独立重新校验整数与范围。
- Entity/数据库列仍保持当前物理事实 `VARCHAR2(64)`；持久化边界显式执行 `Integer ↔ 十进制字符串` 转换，不修改数据库字段、不执行 DDL。
- 列表、详情、新增、编辑、测试连接的 `port` 类型与示例全部一致。
- 存量非法端口只陈述兼容/错误边界，不擅自清洗存量数据。

**修订位置**：
- `DESIGN.md` §7 新增"端口类型契约"。
- `API.md` §4.1/4.2/4.3/4.6 全部 JSON 示例改为 `1521` 无引号；§4.3/§6.3 说明持久化转换与数据库物理列事实。
- `UI.md` §2 端口控件说明（数值型 `input-number`）。
- `DATABASE.md` §1.1 `DATA_SOURCE_PORT` 行、§1.3 新增"端口转换"约束。

### 3.3 R1 问题三：目标设计不得用 `ROWNUM=1` 掩盖命名策略多行异常

**冲突**：首轮目标 Mapper 设计保留"显式 `ROWNUM=1`/多行防护"，会把多条匹配截断为一条，无法检测"同一逻辑键多条"异常。

**修订**（目标设计彻底删除 `ROWNUM=1`）：
- `ROWNUM=1` 只保留在"当前旧候选实现事实/差距"语境（`DESIGN.md` §1.2 左列）；目标 Mapper/SQL/流程全部删除该做法。
- 命名策略列表按源库 ID 返回全部行，不截断。
- 新增查重：对新逻辑键执行明确的计数/存在性检查，能区分 0、1、≥2。
- 编辑/删除：先按原逻辑组合键执行 `COUNT(*)` 或等价的全量计数，只有计数恰好为 1 才允许 DML；0 行返回不存在，≥2 行返回存量多条异常。
- DML 使用完整原逻辑键 WHERE；执行后必须校验受影响行数恰好为 1，否则抛出业务异常并依赖事务回滚，避免误更新/误删多行。
- 明确无数据库唯一约束、无锁、无 DDL 时仍存在并发窗口；不虚假宣称数据库级唯一保证。
- 不清洗、不合并、不自动删除存量重复数据。

**修订位置**：
- `DESIGN.md` §1.1 Mapper 行、§1.3 `DataSourceExtendMapper` 行（目标设计删除 `ROWNUM=1`，改用全量计数 + DML 受影响行数校验）、§3 事务表与说明（计数 + 受影响行数校验）、§4 逻辑唯一性（计数区分 0/1/≥2 + 并发窗口表述）。
- `API.md` §4.11/4.12/4.13（保存前计数检查、`COUNT(*)` 恰好 1 才 DML、DML 后受影响行数=1）。
- `DATABASE.md` §3（明确"目标设计不使用 `ROWNUM=1`"，计数 0/1/≥2 + DML 受影响行数校验）、§4 计数检查。

### 3.4 R1 问题四：角色大小写兼容与角色限定接口必须形成闭环

**缺口**：`DATA_SOURCE_CATEGORY` 存量大小写混用未说明读取兼容；业务属性仅目标库、命名策略仅源库，但对绕过前端直接调用时的角色校验/错误契约不完整。

**修订**（不改变已批准产品规则）：
- 新增/编辑请求只接受 `SOURCE`/`TARGET`，保存为统一大写。
- 读取历史记录时，后端对 `DATA_SOURCE_CATEGORY` 忽略大小写识别并向前端返回规范化 `SOURCE`/`TARGET`。
- 角色条件查询使用与权威基线一致的大小写兼容比较（如 `UPPER(DATA_SOURCE_CATEGORY)='TARGET'`）；仅为兼容既有存量大小写，不放宽到其他非法值。
- 业务属性 GET/PUT：必须校验被操作记录 `FG_ACTIVE='1'` 且当前角色为 `TARGET`；绕过前端调用源库业务属性接口时拒绝操作。
- 命名策略列表/新增/编辑/删除：必须校验 `sourceId` 对应记录 `FG_ACTIVE='1'` 且当前角色为 `SOURCE`。
- 命名策略新增/编辑的新目标库仍必须校验 `FG_ACTIVE='1'` 且当前角色为 `TARGET`。
- 所有主详情、编辑、删除、业务属性、命名策略操作均继续遵守 `DS-REQ-002`：不得触及 `FG_ACTIVE!='1'` 的主记录。
- `API.md` 定义清晰且一致的角色不适用业务码 `40006`（消息"数据源角色不适用于当前操作"），不复用语义错误或可能泄露信息的消息。
- 类别修改仍只更新主表当前记录的 `DATA_SOURCE_CATEGORY`，不得清理、迁移或更新其他表数据；角色校验不反向引入级联处理。

**修订位置**：
- `DESIGN.md` §2.1（列表返回规范化角色）、§2.2（类别保存统一大写）、§2.6（业务属性角色限定）、§2.7（命名策略源库/新目标库角色限定）、§7（角色大小写兼容契约）。
- `API.md` §4.1（规范化角色 + port number）、§4.3/4.4（类别只接受 SOURCE/TARGET 保存大写）、§4.7（大小写兼容查询）、§4.8/4.9（业务属性 TARGET 校验）、§4.10~4.13（源库/新目标库角色校验）、§5.2 新增 `40006`、§5.3 场景、§6.3 兼容说明。
- `UI.md` §1（角色展示与按钮按规范化角色判定）、§4/§5（弹窗角色限定）、§7 一致性。
- `DATABASE.md` §1.1/§1.3（角色大小写兼容）、§2 操作矩阵（业务属性 TARGET、策略 SOURCE/目标 TARGET 谓词与 `40006`）、§4（角色大小写兼容比较与角色限定查询）。

---

## 4. 各文档具体修订位置汇总

| 文档 | 修订位置 |
|---|---|
| `DESIGN.md` | §1.1 Mapper 行、§1.3 `DataSourceExtendMapper` 行、§2.1 步骤 2、§2.2 步骤 4、§2.3 步骤 2/4、§2.5 编辑弹窗 1~4、§2.6 步骤 6、§2.7 步骤 8、§3 事务表+说明、§4 逻辑唯一性、§5 密码安全、§7 端口/角色/引用 ID 契约 |
| `API.md` | §3 密码契约表+语义说明、§4.1~4.6 端口与 `originalDataSourceId`、§4.7 大小写兼容、§4.8/4.9 业务属性角色校验、§4.10~4.13 命名策略角色/计数/业务长度、§5.2 `40400`/新增 `40006`、§5.3 场景、§6.3 契约调整说明 |
| `UI.md` | §1 角色展示与按钮判定、§2 编辑状态模型与端口控件、§3 编辑未改密码测试、§4/§5 弹窗角色限定、§7 一致性 |
| `DATABASE.md` | §1.1 端口/类别列、§1.3 端口转换/角色大小写约束、§2 操作矩阵、§3 确定性 WHERE 与多行异常防护、§4 角色兼容/限定/计数、§5 数据安全、§6 一致性 |

---

## 5. 追踪数量与状态

- 需求：`DS-REQ-001`~`109`（109 条，`APPROVED`）。
- 验收：`DS-AC-001`~`106`（106 条，全部 `NOT_RUN`）。
- 目标接口：13 个，每个均关联 ≥1 个 `DS-REQ` 与 ≥1 个 `DS-AC`。
- 设计文档状态：四份均 `DRAFT_PENDING_USER_REVIEW`；实现 `NOT_STARTED`。

---

## 6. 机械检查结果

| # | 检查项（任务提示词 §10） | 结果 |
|---|---|---|
| 1 | `DESIGN.md` DS-REQ-001~109 连续、唯一、无缺失、无重复 | 通过（109 行，`unique=True`、`continuous_001_109=True`、missing=[]、dups=[]） |
| 2 | `API.md` 13 个目标接口，每个关联 ≥1 DS-REQ 与 ≥1 DS-AC | 通过（13/13，逐行校验无缺失） |
| 3 | 四文档契约一致：`originalDataSourceId` 与可编辑 `dataSourceId` 区分、密码缺席/提供语义、`port` API number/DB VARCHAR2、目标设计无 `ROWNUM=1`（计数+DML 校验）、CATEGORY 大写写/忽略大小写读、业务属性仅 TARGET/命名策略仅 SOURCE/目标候选仅 TARGET、全操作 `FG_ACTIVE='1'`、错误码/HTTP/超时/事务/并发 | 通过（逐项 grep 核对，见 §7） |
| 4 | 目标设计章节 `ROWNUM=1`：仅出现在"当前旧实现事实/差距"语境或显式"目标设计不使用 `ROWNUM=1`"否定表述，不出现在目标 Mapper/SQL/流程 | 通过（目标实现描述仅以否定形式出现；`DESIGN.md` §1.2 左列保留为现状差距） |
| 5 | JSON 示例 `port` 全部为无引号数字；字段表类型一致 | 通过（§4.1/4.2/4.3/4.6 共 4 处 `"port": 1521`） |
| 6 | `targetDataSourceId` API 业务长度按主数据源 ID 上限 32 校验；数据库物理列 128 事实保留 | 通过（`API.md` §4.11 `string ≤32（业务）`，物理列 `VARCHAR2(128)` 事实见 `DATABASE.md` §1.2） |
| 7 | `REQUIREMENTS.md`、`ACCEPTANCE.md`、首轮报告相对 `f7ea3eb2` 零 diff | 通过（`git diff f7ea3eb2 -- <3 文件>` 输出 0 行） |
| 8 | 106/106 验收用例仍为 `NOT_RUN` | 通过（`ACCEPTANCE.md` 未修改，保持批准基线状态） |
| 9 | 四份设计文档状态仍为 `DRAFT_PENDING_USER_REVIEW` | 通过（四文档元数据逐项一致） |
| 10 | `git diff --check` 通过 | 通过（EXIT=0） |
| 11 | 提交只能包含 5 个授权文件 | 见 §9 提交核验 |

---

## 7. 关键契约四文档一致性核对

- `originalDataSourceId`：四文档均出现（DESIGN 6 处、API 10 处、UI 3 处、DATABASE 2 处），语义统一为"编辑前原主键，只用于定位记录与读取持久化密码"。
- `port`：API 全部 JSON 示例为无引号数字；`Integer ↔ 十进制字符串` 转换与 `VARCHAR2(64)` 物理事实在 DESIGN/API/DATABASE 一致声明；UI 端口控件为数值型 1..65535。
- 角色大小写兼容：`UPPER(DATA_SOURCE_CATEGORY)`/`UPPER(CATEGORY)` 谓词在 DESIGN/API/DATABASE 一致；UI 按规范化 `SOURCE`/`TARGET` 判定。
- 角色限定：业务属性仅 `TARGET`、命名策略仅 `SOURCE`、新目标库 `TARGET`，均带 `FG_ACTIVE='1'` 校验；角色不适用统一返回 `40006`（四文档提及）。
- 计数 + DML 受影响行数校验（`COUNT(*)`/受影响行数=1）：DESIGN/API/DATABASE 一致；目标设计无 `ROWNUM=1` 截断。
- 错误码、HTTP 状态、10 秒超时、事务边界、并发窗口（无唯一约束/锁/DDL）表述保持一致。

---

## 8. 未修改需求、验收、代码、数据库和其他基线的证明

- `git diff f7ea3eb2 -- docs/features/data-source-management/REQUIREMENTS.md docs/features/data-source-management/ACCEPTANCE.md docs/features/data-source-management/reports/DATA-SOURCE-DESIGN-BASELINE-001.md` 输出为 0 行。
- 未修改 Feature README、项目级/数据库级权威基线、历史候选文档、任何业务代码、测试代码、构建文件、配置、菜单或路由。
- 本任务未连接数据库、未执行 SQL/DDL、未启动服务、未构建、未测试（验证矩阵按文档任务标记 `NOT_APPLICABLE`）。
- 未访问 ZooKeeper、未执行任何 ZooKeeper 写操作。
- 工作区既有无关内容原样保留，未清理、未还原、未暂存、未提交。

---

## 9. Commit/Push/远端同步结果

- 精确暂存 5 个授权文件（不使用 `git add .` / `git add -A`）。
- Commit Message（按任务建议）：`docs(data-source-management): resolve design contract review findings [DATA-SOURCE-DESIGN-BASELINE-001-R1]`。
- 普通非强制推送 `git push origin develop`。
- 推送后核验：`HEAD == origin/develop == git ls-remote origin refs/heads/develop`；ahead/behind 为 `0 0`；结果提交仅含 5 个授权文件；无关工作区内容原样保留。
- 最终 `result_commit_id`、`remote_commit_id`、`push_status`、`ahead_behind` 见控制台结果块。

---

## 10. 下一步

下一步仅为 `CHATGPT_REVIEW_DESIGN_BASELINE_R1`。任务成功提交并核验后立即停止，等待 ChatGPT 从远端 Git 复审修订后的四份设计草案后再决定后续。

本任务未宣布 Feature 已设计批准、已实现、已构建、已验收或已生产可用。

---

## 11. 控制台结果块

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=DATA-SOURCE-DESIGN-BASELINE-001-R1
branch=develop
base_commit_id=f7ea3eb2a1343a0600deb86404ce6775a810dce9
result_commit_id=
remote_commit_id=
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
original_id_password_lookup_status=FIXED
port_contract_status=ALIGNED
target_rownum_status=REMOVED
category_compatibility_status=ALIGNED
role_scope_validation_status=ALIGNED
business_code_change_status=NONE
test_code_change_status=NONE
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_access_status=NONE
service_operation_status=NONE
backend_build_status=NOT_APPLICABLE
frontend_build_status=NOT_APPLICABLE
push_status=
ahead_behind=
changed_files=docs/features/data-source-management/DESIGN.md,docs/features/data-source-management/API.md,docs/features/data-source-management/UI.md,docs/features/data-source-management/DATABASE.md,docs/features/data-source-management/reports/DATA-SOURCE-DESIGN-BASELINE-001-R1.md
next=CHATGPT_REVIEW_DESIGN_BASELINE_R1
error=
AGENT_TASK_RESULT_END
```
