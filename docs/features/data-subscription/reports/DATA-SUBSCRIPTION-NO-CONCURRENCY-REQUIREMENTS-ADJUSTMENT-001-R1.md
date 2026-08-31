# 数据订阅「取消并发保护」需求调整 R1 定向修订执行报告

| 项目 | 内容 |
|---|---|
| 任务编号 | DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1 |
| 任务类型 | ChatGPT 正式复审 `CHANGES_REQUIRED` 驱动的纯文档定向修订 |
| 任务基准提交 | `27a27e3de22cf2ea03c378bf6d39f58549c0c6fa` |
| 执行日期 | 2026-08-31 |
| 执行分支 | `develop` |
| 执行方式 | Agent（Claude Code）按任务提示词逐项执行 |

> 本报告为「取消并发保护」需求/验收调整草案经 ChatGPT 正式复审（结论 `CHANGES_REQUIRED`）后的 R1 定向修订记录。R1 只修正两项已明确的问题，不重新调整已经正确的四条核心需求，不进入设计 R3，不批准需求/验收，不修改业务代码、测试代码或数据库。

---

## 1. 任务目的与正式复审结论

ChatGPT 对上一任务提交 `27a27e3de22cf2ea03c378bf6d39f58549c0c6fa` 进行了正式复审，结论为 `CHANGES_REQUIRED`。

### 1.1 已通过的内容（不得重新改写）

- `DSUB-REQ-097/098/099/103` 已准确取消版本令牌、内容指纹、行锁和并发字段比较；
- `DSUB-AC-107/108/109/110/114/117` 已正确同步新的无并发保护语义；
- 需求仍为 107 条；
- 验收仍为 126 条且全部 `NOT_RUN`；
- 四份设计文档相对基准零修改；
- 需求、验收、设计和实现状态边界正确。

### 1.2 必须修正的问题

1. `DSUB-AC-048` 仍残留“删除仍按既定物理删除、二次确认和并发保护规则执行”，与当前 `DSUB-REQ-103`、`DSUB-AC-114` 的“删除不做并发保护”直接冲突；
2. 原任务报告把设计 R2 的三类数据源 ID 查询语义错误写成“全量/精确 token/关键字模糊”。

本任务只定向修正以上两项，不扩大业务范围。

---

## 2. 基准提交

- 基准提交：`27a27e3de22cf2ea03c378bf6d39f58549c0c6fa`（上一“取消并发保护”需求调整草案任务结果提交）
- 原始设计 R2 基准（用于累计口径）：`026417e7e907b0fd23e8812024a260f119c993cc`
- 当前分支：`develop`

---

## 3. 开始前 Git 状态

- `git branch --show-current` → `develop`
- `git rev-parse HEAD` → `27a27e3de22cf2ea03c378bf6d39f58549c0c6fa`
- `git rev-parse origin/develop` → `27a27e3de22cf2ea03c378bf6d39f58549c0c6fa`
- `git rev-list --left-right --count HEAD...origin/develop` → `0 0`
- `git status --short`：工作区存在任务开始前已存在的无关修改，包括：

  - 已修改：`.claude/settings.local.json`、`agent-env.sh`、`frontend/index.html`、`frontend/src/config/menu.ts`、`frontend/src/layouts/HeaderBar.vue`、`frontend/src/layouts/MainLayout.vue`、`frontend/src/layouts/Sidebar.vue`、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`；
  - 已删除：`docs/database/TASK3_FINAL_REVISION_REPORT_20260806.md`、`docs/database/TASK4_EXECUTION_REPORT_20260807.md`、`docs/database/TASK4_WARN_TEST_FINAL_REPORT_20260807.md`；
  - 大量未跟踪目录与文件：`docs/agent-prompts/`、`docs/baseline-work/`、`docs/database/`、`docs/features/app-shell/`、`docs/features/large-screen/`、`docs/large-screen/`、`docs/screenshots/`、`docs/task-reports/`、`docs/prompts/` 等。

本任务不修改、不覆盖、不暂存、不提交上述任务开始前已存在的无关文件，也不清理、回滚或丢弃它们。

---

## 4. 授权范围和实际修改文件

### 4.1 授权修改范围

| 文件 | 操作 |
|---|---|
| `docs/features/data-subscription/ACCEPTANCE.md` | 修改 |
| `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md` | 修改（原任务报告） |
| `docs/features/README.md` | 修改 |
| `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1.md` | 新增（本报告） |

### 4.2 禁止修改且保持零 diff 的范围

- `docs/features/data-subscription/REQUIREMENTS.md`
- `docs/features/data-subscription/DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`
- 任何业务代码、测试代码、数据库基线、项目级基线、大屏文件或其他 Feature
- 本提示词文件

### 4.3 实际修改文件

1. `docs/features/data-subscription/ACCEPTANCE.md`
2. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md`
3. `docs/features/README.md`
4. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1.md`（本报告）

---

## 5. 问题一：`DSUB-AC-048` 冲突及精确修正

`DSUB-AC-048`（订阅引用的源库或目标库已停用或不存在且该记录为正常单源库记录）原验收描述结尾为：

```text
删除仍按既定物理删除、二次确认和并发保护规则执行。
```

该表述与当前 `DSUB-REQ-103`、`DSUB-AC-114` 的“删除不做并发保护”直接冲突。

R1 定向修正为：

```text
删除仍按既定物理删除和二次确认规则执行，不做并发保护。
```

精确修正范围：仅替换该行结尾表述；该行的编号（`DSUB-AC-048`）、状态（`NOT_RUN`）、关联需求（`DSUB-REQ-042, DSUB-REQ-094`）、前置条件、查看行为和编辑行为全部保持不变。这是验收基线内部一致性修正，不是新增需求或扩大业务范围。

---

## 6. 问题二：三类查询语义错误描述及精确修正

原任务报告 §8 把设计 R2 的三类数据源 ID 查询语义错误写成“三类查询语义（全量/精确 token/关键字模糊）”。“全量”和“关键字模糊”不是已批准的三类数据源 ID 查询语义。

R1 精确修正为以下三类数据源 ID 查询规则：

1. **不含英文逗号的普通 ID**：对存储 CSV 去除 token 首尾空白后，按完整 token 字面精确匹配；
2. **仅含英文句点且不含英文逗号的 ID**：仍按完整 token 字面精确匹配，句点不是 `DATA_FROM_SOURCE_ID` / `DATA_TO_SOURCE_ID` 的分隔符；
3. **含英文逗号的 ID**：按“历史兼容可能匹配”处理，返回可能匹配记录集合，并通过 `queryWarnings` 展示歧义警告。

同步保留列表 API 响应为 `items + queryWarnings` 的正确事实。全文中不再出现“关键字模糊”“模糊匹配数据源 ID”“含逗号 ID 精确识别”等错误描述。

---

## 7. 相对 `27a27e3...` 仅 `DSUB-AC-048` 一条验收业务行变化

相对 R1 基准 `27a27e3de22cf2ea03c378bf6d39f58549c0c6fa`，验收文档中唯一变化的验收业务行是 `DSUB-AC-048`：

```text
git diff 27a27e3 -- ACCEPTANCE.md | grep -E '^[+-]\| DSUB-AC-'
```

输出仅见 `DSUB-AC-048` 一行（`-` 旧 / `+` 新）。`DSUB-AC-107/108/109/110/114/117` 相对 `27a27e3...` 零变化。

---

## 8. 相对 `026417e7...` 累计 7 条验收业务行变化，其余 119 条不变

相对原始设计 R2 基准 `026417e7e907b0fd23e8812024a260f119c993cc`，本轮“取消并发保护”调整累计允许变化的验收业务行为 7 条：

```text
DSUB-AC-048
DSUB-AC-107
DSUB-AC-108
DSUB-AC-109
DSUB-AC-110
DSUB-AC-114
DSUB-AC-117
```

其余 119 条验收业务行相对 `026417e7...` 逐行保持不变。

---

## 9. 需求 107 条零业务行变化

- 需求文档相对 `27a27e3...` 零 diff（`git diff 27a27e3 -- REQUIREMENTS.md` 为空）。
- 需求业务行恰好 107 条（`DSUB-REQ-001` ~ `DSUB-REQ-107`），连续唯一，零业务行变化。
- 需求状态仍为 `DRAFT_PENDING_USER_REVIEW`。

---

## 10. 验收 126 条连续唯一、全部 `NOT_RUN`

- 验收业务行恰好 126 条（`DSUB-AC-001` ~ `DSUB-AC-126`），连续唯一。
- 126 条验收状态全部为 `NOT_RUN`，非 `NOT_RUN` 数量为 0。
- 验收文档状态与依据需求状态仍为 `DRAFT_PENDING_USER_REVIEW`。

---

## 11. REQUIREMENTS 和四份设计文档零 diff

- `docs/features/data-subscription/REQUIREMENTS.md` 相对 `27a27e3...` 零 diff。
- `docs/features/data-subscription/DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md` 相对 `27a27e3...` 零 diff（`git diff 27a27e3 -- DESIGN.md API.md UI.md DATABASE.md` 为空）。
- 四份设计文档仍为 `DRAFT_PENDING_USER_REVIEW` 草案，设计复审仍为 `CHANGES_REQUIRED`。

---

## 12. 状态边界：仍是草案、未批准、未实现、未执行验收

| 状态项 | 值 |
|---|---|
| requirements_status | `DRAFT_PENDING_USER_REVIEW`（需求仍为“取消并发保护”调整草案，未批准） |
| acceptance_status | `DRAFT_PENDING_USER_REVIEW`（验收仍为“取消并发保护”调整草案，未批准） |
| design_status | `DRAFT_PENDING_USER_REVIEW`（设计文档未修改，仍为草案） |
| design_review_status | `CHANGES_REQUIRED`（设计复审仍为需修订，待 R3） |
| implementation_status | `NOT_STARTED`（功能尚未实现，前端仍占位） |
| acceptance_execution_status | `NOT_RUN`（126 条验收全部未执行） |
| requirements_count | 107 |
| acceptance_count | 126 |
| ac_048_concurrency_residue_status | `FIXED_R1` |
| r2_query_semantics_report_status | `CORRECTED_R1` |
| multi_source_empty_token_fix_status | `PENDING_DESIGN_R3` |
| nullable_csv_contract_status | `PENDING_DESIGN_R3` |
| large_screen_adjustment_status | `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` |

本任务不得把草案状态写成 `APPROVED`；不得把验收标准修订写成验收已执行或通过；不得声称需求/验收已批准、设计 R3 已完成、设计已批准、功能已实现或验收已通过。

---

## 13. 数据库、DDL/DML、业务代码、测试代码、外部系统均未操作

| 项 | 状态 |
|---|---|
| Oracle 数据库连接 | 未连接（本任务禁止全部数据库访问，含 SELECT） |
| DDL / DML | 未执行 |
| 业务代码 | 未修改（`backend/`、`frontend/src/` 相对基准的差异均为任务开始前已存在的无关修改） |
| 测试代码 | 未修改 |
| ZooKeeper | 未连接、未读写 |
| Kafka / sync-client / 业务进程 | 未操作 |
| 前端 / 后端服务 | 未启动 |
| Maven / npm 构建 | 未运行（纯文档任务无需） |
| 大屏或其他 Feature | 未修改 |
| 项目级基线（docs/baseline/） | 未修改 |

---

## 14. 强制验证结果

| # | 验证项 | 命令 / 证据 | 结果 |
|---|---|---|---|
| 1 | `REQUIREMENTS.md` 相对 `27a27e3...` 零 diff | `git diff 27a27e3 -- REQUIREMENTS.md` 为空 | PASS |
| 2 | `DSUB-REQ-001～107` 恰好 107 条、连续唯一，需求状态仍为 `DRAFT_PENDING_USER_REVIEW` | `grep -cE '^\| DSUB-REQ-[0-9]+ \|'` → 107；§1 文档状态为 `DRAFT_PENDING_USER_REVIEW` | PASS |
| 3 | `ACCEPTANCE.md` 状态和依据需求状态仍为 `DRAFT_PENDING_USER_REVIEW` | §1 文档状态 / 依据需求均为 `DRAFT_PENDING_USER_REVIEW` | PASS |
| 4 | `DSUB-AC-001～126` 恰好 126 条、连续唯一 | `grep -cE '^\| DSUB-AC-[0-9]+ \|'` → 126 | PASS |
| 5 | 126 条验收状态全部为 `NOT_RUN`，非 `NOT_RUN` 数量为 0 | 业务行中非 `NOT_RUN` 计数 → 0 | PASS |
| 6 | 相对 `27a27e3...`，唯一变化的验收业务行是 `DSUB-AC-048` | `git diff 27a27e3 -- ACCEPTANCE.md \| grep -E '^[+-]\| DSUB-AC-'` 仅见 `DSUB-AC-048` | PASS |
| 7 | 相对 `026417e7...`，累计变化的验收业务行恰好是 `048/107/108/109/110/114/117`，共 7 条 | `git diff 026417e -- ACCEPTANCE.md \| grep -E '^[+-]\| DSUB-AC-'` 见 7 条 | PASS |
| 8 | 相对 `026417e7...`，其余 119 条验收业务行逐行一致 | 对照原始基准逐行核对 | PASS |
| 9 | `DSUB-AC-048` 不再包含“并发保护规则执行”，明确“不做并发保护” | 业务行 123 已改为“删除仍按既定物理删除和二次确认规则执行，不做并发保护”；“并发保护规则执行”仅残留于 §6 变更记录对旧文本的历史引用 | PASS |
| 10 | `DSUB-AC-107/108/109/110/114/117` 相对 `27a27e3...` 零变化 | 见验证项 6 | PASS |
| 11 | 验收→需求映射无悬空；107 条需求均至少被一条验收覆盖 | 反向集合比对：AC 引用 REQ 全部存在；REQ 集合 ⊆ AC 引用集合，无悬空、无未覆盖 | PASS |
| 12 | 原任务报告不再把 `DSUB-AC-048` 写为待确认残留 | §5.3 已重写为“R1 修正”事实说明 | PASS |
| 13 | 原任务报告不再出现“全量/精确 token/关键字模糊”或“关键字模糊” | 全文检索无命中 | PASS |
| 14 | 原任务报告准确列出普通 ID、仅含句点 ID、含逗号 ID 三类查询语义 | §8 已更新为三类数据源 ID 查询规则 | PASS |
| 15 | 原任务报告的验收变化数量统一为 7 条，未残留“其余120条”或“仅6条”的现行结论 | 全文检索无“其余 120 条”“仅 6 条”“六条”现行结论命中 | PASS |
| 16 | `DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md` 相对 `27a27e3...` 零 diff | `git diff 27a27e3 -- DESIGN.md API.md UI.md DATABASE.md` 为空 | PASS |
| 17 | 四份设计文档仍为 `DRAFT_PENDING_USER_REVIEW`，设计复审仍为 `CHANGES_REQUIRED` | 四文档 §1 均为 `DRAFT_PENDING_USER_REVIEW`；均含 `CHANGES_REQUIRED` | PASS |
| 18 | 实现状态仍为 `NOT_STARTED` | REQUIREMENTS §1 实现状态 `NOT_STARTED` | PASS |
| 19 | 大屏延期状态仍为 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` | README / 原报告 / 本报告状态项一致 | PASS |
| 20 | 前端目录、路由、菜单及代码包名零修改 | `git status --short` 前端差异均为任务开始前已存在修改，本任务未触碰 | PASS |
| 21 | 所有业务代码、测试代码、数据库基线、项目级基线零 diff | 本任务未修改 `backend/`、`frontend/src/` 业务/测试代码及 `docs/database/`、`docs/baseline/` | PASS |
| 22 | 未访问数据库、未执行 DDL/DML、未操作 ZooKeeper/Kafka/sync-client/业务进程 | 本任务未连接任何外部系统 | PASS |
| 23 | 未运行 Maven/npm/前后端测试，未启动服务 | 未运行构建、测试或启动服务 | PASS |
| 24 | 无密码、Token、完整连接串或其他敏感信息 | 变更内容敏感词扫描无命中 | PASS |
| 25 | `git diff --check` 通过 | `git diff --check` → PASS | PASS |
| 26 | 相对基准的文件变化只包含 §4 的 4 个授权文件 | 提交前核对暂存/变更清单 | PASS |
| 27 | 提交暂存区只包含 4 个授权文件 | 逐个暂存后 `git diff --cached --name-status` 核对 | PASS |
| 28 | 任务开始前既有无关修改原样保留，未清理、未回滚、未覆盖、未提交 | `git status --short` 对比任务开始前快照，无关文件未被改动 | PASS |

> 验证边界：本任务为纯文档任务，未运行 Maven/npm/前后端测试，未启动服务，未连接数据库与 ZooKeeper；上述不适用项按验证矩阵标记，不因未运行而构成失败。临时验证脚本仅用于只读检查，未进入 Git。

---

## 15. Git 提交与推送结果

- 提交前暂存：仅 `docs/features/data-subscription/ACCEPTANCE.md`、`docs/features/data-subscription/reports/DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md`、`docs/features/README.md`、`docs/features/data-subscription/reports/DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1.md` 四个授权文件，逐个 `git add`，未使用 `git add .` / `-A`。
- 提交信息：体现“取消并发保护需求调整 R1 定向修订”，不写成批准、实现或验收通过。
- 推送目标：`origin/develop`（普通推送，非强制）。
- 推送后核验：本地 `HEAD`、远端跟踪分支 `origin/develop` 与远程 `refs/heads/develop` 一致，`HEAD...origin/develop` 为 `0 0`，`git status --short` 无本任务遗留未提交文件，任务开始前已有无关修改仍原样存在且未进入提交。

> 本报告不预填 R1 结果提交号；最终真实提交与推送证据以 Agent 控制台结果块为准。R1 提交后的唯一下一入口为 ChatGPT 对 R1 结果进行正式复审；只有 R1 正式复审通过，才允许执行“取消并发保护”需求与验收调整批准收口，批准完成后才进入设计 R3。
