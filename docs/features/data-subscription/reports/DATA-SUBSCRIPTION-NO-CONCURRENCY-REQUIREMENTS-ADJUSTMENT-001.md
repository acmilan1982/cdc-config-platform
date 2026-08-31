# 数据订阅「取消并发保护」需求调整草案执行报告

| 项目 | 内容 |
|---|---|
| 任务编号 | DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001 |
| 任务类型 | 纯文档（需求/验收定向调整草案） |
| 任务基准提交 | `026417e7e907b0fd23e8812024a260f119c993cc` |
| 执行日期 | 2026-08-31 |
| 执行分支 | `develop` |
| 执行方式 | Agent（Claude Code）按任务提示词逐项执行 |

> 本报告为「取消并发保护」需求/验收调整草案的执行记录与证据汇总。本任务仅调整需求与验收标准为草案状态，不批准设计、不实现功能、不执行验收、不做任何数据库或代码操作。

---

## 1. 任务目的与产品负责人决策

本任务依据产品负责人的明确决策，正式移除数据订阅页面新增、编辑、删除流程中的并发保护，将需求与验收标准定向调整为「取消并发保护」草案。

产品负责人决策原文：

> 数据订阅页面的新增、编辑、删除完全不处理并发操作，不考虑其他页面用户或人工直接修改数据库造成的并发冲突。

本任务处理边界：

- 仅定向调整需求 `DSUB-REQ-097/098/099/103` 与验收 `DSUB-AC-107/108/109/110/114/117`，并把 §14/§4.11 标题改为「无并发保护边界」。
- 该简化是**主动选择的产品边界**，不属于待解决缺口；不得重新解释成乐观锁、悲观锁、更新时间校验、ETag、幂等键、数据库触发器或其他替代并发方案。
- 只取消并发保护，不改变必填校验、数据源与源表有效性校验、多源库异常限制、物理删除、二次确认、受影响行数检查及重启 `sync-client` 后生效等其他既有规则。
- 本任务为纯文档调整草案，不表示功能实现、部署或验收通过。

---

## 2. 基准提交与开始前 Git 状态

- 基准提交：`026417e7e907b0fd23e8812024a260f119c993cc`
- 当前分支：`develop`
- 任务开始前 `git status --short`：工作区存在任务开始前已存在的无关修改，包括：

  - 已修改：`.claude/settings.local.json`、`agent-env.sh`、`frontend/index.html`、`frontend/src/config/menu.ts`、`frontend/src/layouts/HeaderBar.vue`、`frontend/src/layouts/MainLayout.vue`、`frontend/src/layouts/Sidebar.vue`、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`；
  - 已删除：`docs/database/TASK3_FINAL_REVISION_REPORT_20260806.md`、`docs/database/TASK4_EXECUTION_REPORT_20260807.md`、`docs/database/TASK4_WARN_TEST_FINAL_REPORT_20260807.md`；
  - 大量未跟踪目录与文件：`docs/agent-prompts/`、`docs/baseline-work/`、`docs/database/`、`docs/features/app-shell/`、`docs/features/large-screen/`、`docs/large-screen/`、`docs/screenshots/`、`docs/task-reports/` 等。

本任务不修改、不覆盖、不暂存、不提交上述任务开始前已存在的无关文件，也不清理、回滚或丢弃它们。

---

## 3. 授权范围与实际修改文件

### 3.1 授权修改范围

| 文件 | 操作 |
|---|---|
| `docs/features/data-subscription/REQUIREMENTS.md` | 修改 |
| `docs/features/data-subscription/ACCEPTANCE.md` | 修改 |
| `docs/features/README.md` | 修改 |
| `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md` | 新增（本报告） |

### 3.2 实际修改文件

1. `docs/features/data-subscription/REQUIREMENTS.md`
2. `docs/features/data-subscription/ACCEPTANCE.md`
3. `docs/features/README.md`
4. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md`（本报告）

### 3.3 禁止修改且保持零 diff 的范围

- `docs/features/data-subscription/DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`：相对基准 `026417e...` 必须零 diff，保持 `DRAFT_PENDING_USER_REVIEW` + `CHANGES_REQUIRED`。
- 业务代码、测试代码、数据库基线、项目级基线、大屏文档、其他 Feature 文件、本提示词文件。

验证结果：`git diff 026417e... -- DESIGN.md API.md UI.md DATABASE.md` 为空，四份设计文档相对基准零 diff（见 §12）。

---

## 4. 需求调整前后对照

### 4.1 业务行对照（仅 DSUB-REQ-097/098/099/103）

| 编号 | 调整前 | 调整后 |
|---|---|---|
| DSUB-REQ-097 | 编辑打开时获取后端生成的版本令牌或等效原始快照标识。 | 编辑打开接口不生成、不返回版本令牌、内容指纹或等效快照标识；页面编辑保存请求也不携带此类字段。 |
| DSUB-REQ-098 | 保存前后端重新读取当前记录并比较业务字段；记录已被他人或人工数据库操作修改时，拒绝覆盖并提示刷新后重新编辑。 | 编辑保存不加行锁，不比较打开时与保存时的记录内容；完成现有业务校验后按 `DATA_SUB_ID` 普通更新；多个页面用户或人工数据库操作交叉发生时不提供并发冲突检测，最后一次成功写入的内容生效。 |
| DSUB-REQ-099 | 不得仅依赖 `UPDATE_TIME`，因为人工直接维护数据库时不一定同步更新时间；具体版本令牌实现属于后续设计，但验收必须覆盖并发修改拒绝覆盖。 | 不使用 `UPDATE_TIME` 或其他字段进行并发判断；不提供“记录已被他人或人工数据库操作修改”的识别、拒绝覆盖或刷新重试机制；页面打开期间的数据与最终写入之间不提供快照一致性保证。 |
| DSUB-REQ-103 | 删除请求携带版本令牌或等效并发标识；确认后发现记录已被修改，拒绝删除并刷新列表，避免误删新配置。 | 删除确认信息可通过普通只读读取获得，但不锁行、不返回或回传版本令牌；用户确认后直接按 `DATA_SUB_ID` 主键物理删除，不检查预览后记录是否发生变化；记录不存在仍按 `DSUB-REQ-104` 处理。 |

其余 103 条 `DSUB-REQ` 业务行相对基准逐行保持不变。

### 4.2 非业务行调整

- §1 文档状态：由 `APPROVED` 转为 `DRAFT_PENDING_USER_REVIEW`（“取消并发保护”需求调整草案；上一正式批准需求版本为“含逗号数据源 ID 查询兼容”版本，批准依据提交 `5d5b5f4606da14f160e9db43068f114d35501db8`，历史批准事实保留；更早“英文句点 `.` 保留分隔符”批准版本（批准依据提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a`）同样作为历史事实保留）。
- §1 说明：改写为“取消并发保护”草案说明，明确只取消并发保护、不改变其他规则。
- §5.1 删除范围：改为“订阅记录删除（按主键物理删除、二次确认，不做并发保护）”。
- §14 标题：由“并发保护”改为“无并发保护边界”，并在标题下新增紧邻说明（主动选择的产品边界、不属于待解决缺口、不得重新解释成乐观锁/悲观锁/更新时间校验/ETag/幂等键/触发器等替代并发方案）。
- §19 变更记录：追加 2026-08-31 行，关联文档补充本报告路径。

---

## 5. 验收调整前后对照

### 5.1 业务行对照（仅 DSUB-AC-107/108/109/110/114/117）

| 编号 | 调整前 | 调整后 |
|---|---|---|
| DSUB-AC-107 | 打开编辑弹窗 / 观察请求 / 编辑打开时获取后端生成的版本令牌或等效原始快照标识 | 打开编辑弹窗 / 观察请求 / 编辑打开响应中不包含 `versionToken`、内容指纹或等效快照字段；编辑保存请求也不携带此类字段 |
| DSUB-AC-108 | 编辑弹窗打开期间记录被他人或人工修改 / 保存 / 保存前后端重新读取当前记录并比较业务字段，发现被修改则拒绝覆盖并提示刷新后重新编辑 | 编辑弹窗打开期间记录被他人或人工修改 / 由原页面保存 / 系统不执行并发比较、不返回并发冲突，按普通保存规则处理，最后一次成功写入的内容生效 |
| DSUB-AC-109 | 人工直接修改数据库但未同步 `UPDATE_TIME` / 打开编辑并保存 / 不依赖 `UPDATE_TIME` 判断并发；仍能识别记录已被修改并拒绝覆盖 | 人工直接修改数据库但未同步 `UPDATE_TIME` / 打开编辑并保存 / 系统不使用 `UPDATE_TIME` 或其他字段判断并发，正常按普通保存规则处理 |
| DSUB-AC-110 | 并发修改被拒绝 / 观察提示 / 返回清晰、可展示的业务提示，提示刷新后重新编辑 | 保存过程中记录已被他人或人工修改 / 观察保存接口与页面 / 保存接口和页面不存在 `40910 CONCURRENT_MODIFIED`、“记录已被修改”或“刷新后重新编辑”等并发处理流程 |
| DSUB-AC-114 | 删除确认前记录被修改 / 确认删除 / 删除请求携带版本令牌或等效并发标识；发现记录已被修改则拒绝删除并刷新列表，避免误删新配置 | 删除确认前记录被人工或其他页面修改 / 确认删除 / 删除预览/确认请求不返回、不携带版本令牌；预览后记录被修改时，用户确认仍按 `DATA_SUB_ID` 直接物理删除，不执行并发比较 |
| DSUB-AC-117 | 删除确认二次确认未通过 / 取消删除 / 不执行删除，记录保持不变（关联需求 `DSUB-REQ-102, DSUB-REQ-103`） | 删除确认二次确认未通过 / 取消删除 / 不执行删除，记录保持不变（关联需求修正为仅 `DSUB-REQ-102`，不再依赖旧版并发语义） |

其余 120 条 `DSUB-AC` 业务行相对基准逐行保持不变。

### 5.2 非业务行调整

- §1 文档状态：由 `APPROVED` 转为 `DRAFT_PENDING_USER_REVIEW`（“取消并发保护”验收标准调整草案）。
- §1 依据需求：同步为 `DRAFT_PENDING_USER_REVIEW`（“取消并发保护”需求调整草案）。
- §1 重要声明：改写为“取消并发保护”验收调整草案说明，明确定向调整 `DSUB-AC-107/108/109/110/114/117` 与 §4.11；强调验收标准批准不等于验收已执行，本 Feature 尚未实现，全部 126 条用例保持 `NOT_RUN`。
- §3 分类表：新增“无并发保护边界 | DSUB-AC-107 ~ DSUB-AC-110 | 4”。
- §4.11 标题：由“并发保护”改为“无并发保护边界（对应 REQUIREMENTS §14）”。
- §5 追溯性：删除“并发编辑与并发删除 → DSUB-AC-107~110、DSUB-AC-114”旧覆盖描述，改为“无并发保护边界（编辑/删除不比较、不拒绝覆盖、直接按主键更新/物理删除、最后一次成功写入生效）→ DSUB-AC-107~110、DSUB-AC-114”。
- §6 变更记录：追加 2026-08-31 行。

### 5.3 关于 DSUB-AC-048 的说明（透明记录）

`DSUB-AC-048`（订阅引用的源库或目标库已停用或不存在且为正常单源库记录）的验收描述仍保留“删除仍按既定物理删除、二次确认和并发保护规则执行”旧表述。原因：本任务强制验证项要求仅 `DSUB-AC-107/108/109/110/114/117` 六条验收业务行相对基准发生预期变化，其余 120 条验收业务行逐行保持不变，故 `DSUB-AC-048` 不在本次允许改动范围。该旧表述属于验收用例文本层面的历史残留，与本任务“删除不再做并发保护”的新语义存在表面出入；是否在后续任务中修正该条描述，应作为待确认事项记录，不在本任务范围内擅自改动。

---

## 6. 明确删除的机制：版本令牌、DSUB-FP-V1、行锁、并发字段比较、40910

| 删除的机制 | 调整后语义 |
|---|---|
| 版本令牌（`versionToken`） | 编辑打开接口不再生成、返回版本令牌；编辑保存请求不再携带；删除预览/确认请求不再返回、回传。 |
| 内容指纹（`DSUB-FP-V1`） | 不再作为并发比较依据；设计 R3 将整体删除指纹机制（见 §9）。 |
| 行锁（`SELECT ... FOR UPDATE`） | 编辑保存与删除预览不再加行锁。 |
| 并发字段比较（`UPDATE_TIME` 或其他字段） | 不使用任何字段进行并发判断；无“记录已被他人或人工数据库操作修改”的识别。 |
| `40910 CONCURRENT_MODIFIED` | 保存接口和页面不再存在该并发冲突流程。 |
| “记录已被修改”“刷新后重新编辑”提示 | 相关提示与流程全部移除。 |

---

## 7. 明确保留的机制：普通保存校验、普通只读删除预览、主键物理删除、不存在提示、二次确认

| 保留机制 | 说明 |
|---|---|
| 必填字段校验 | 编辑保存仍执行既有必填校验。 |
| 数据源与源表有效性校验 | 数据源、源库、源表有效性与多源库异常限制等既有业务校验保留。 |
| 普通只读删除预览 | 删除确认信息通过普通只读读取获得，不锁行、不携带版本令牌。 |
| 主键物理删除 | 用户确认后按 `DATA_SUB_ID` 直接物理删除。 |
| 记录不存在提示 | 记录不存在仍按 `DSUB-REQ-104`“记录不存在或已被删除”处理。 |
| 二次确认 | 删除二次确认保留。 |
| 受影响行数检查 | 保存/删除的影响行数检查保留。 |
| 重启 `sync-client` 后生效提示 | 删除后影响同步客户端重启的提示保留。 |

---

## 8. 设计 R2 四项已通过复核的事实

ChatGPT 已对设计 R2 提交 `026417e7e907b0fd23e8812024a260f119c993cc` 进行正式复审，结论为 `CHANGES_REQUIRED`，其中以下四项 R2 定向修订目标已通过复核（作为事实记录；本任务未修改设计文档，四项事实详见设计 R2 报告）：

1. 三类查询语义（全量/精确 token/关键字模糊）在服务层 Java 字面量过滤中的落地，列表 API 响应结构调整为 `items + queryWarnings`；
2. 元数据 API 由路径参数改为 query 参数；
3. Oracle 物化视图显式排除（`ALL_MVIEWS`）；
4. `DSUB-FP-V1` 字节级确定性指纹，并给出黄金测试向量（`bc1e643aa5154798030a7523d08dd7348d0e5186b508a0e67bba4e0c7de547dd`，407 字节）。

另有两项与并发无关的待办已确认转入设计 R3（见 §9）。

---

## 9. 设计 R3 后续输入：删除并发设计、修正多源库空 token 判定、补充 null-safe CSV 契约

产品负责人“取消并发保护”决策要求：先完成本需求/验收调整复审，再执行设计 R3。设计 R3 待办（作为后续输入，不构成本任务的实现）：

1. **删除并发设计**：删除设计中的版本令牌、内容指纹（`DSUB-FP-V1`）、行锁、并发字段比较、`40910` 等并发机制，改为普通主键更新/物理删除语义。
2. **修正多源库空 token 判定**：多源库异常的判定必须使用“逗号拆分 → trim → 丢弃空 token → 非空 token 数量至少 2”，而不是 `raw split().length >= 2`。
3. **补充 null-safe CSV 契约**：`DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID` 可空，CSV 查询匹配与异常判定需处理 `NULL`/空白 → 空 token 集合 → 不匹配/非多源库异常，避免 NPE。

---

## 10. 状态边界：需求/验收只是调整草案，设计未批准、实现未开始、验收未执行

| 状态项 | 值 |
|---|---|
| requirements_status | `DRAFT_PENDING_USER_REVIEW`（需求仅为“取消并发保护”调整草案，未批准） |
| acceptance_status | `DRAFT_PENDING_USER_REVIEW`（验收仅为“取消并发保护”调整草案，未批准） |
| design_status | `DRAFT_PENDING_USER_REVIEW`（设计文档未修改，仍为草案） |
| design_review_status | `CHANGES_REQUIRED`（设计复审仍为需修订，待 R3） |
| implementation_status | `NOT_STARTED`（功能尚未实现，前端仍占位） |
| acceptance_execution_status | `NOT_RUN`（126 条验收全部未执行） |
| requirements_count | 107 |
| acceptance_count | 126 |

本任务不得把草案状态写成 `APPROVED`；不得把验收标准调整写成验收已执行或通过；不得把“待实现目标”描述为“当前已经实现”。

---

## 11. 数据库、DDL/DML、代码、测试、外部系统均未操作

| 项 | 状态 |
|---|---|
| Oracle 数据库连接 | 未连接（本任务禁止全部数据库访问，含 SELECT） |
| DDL / DML | 未执行 |
| 业务代码 | 未修改 |
| 测试代码 | 未修改 |
| ZooKeeper | 未连接、未读写 |
| 前端 / 后端服务 | 未启动 |
| Maven / npm 构建 | 未运行（纯文档任务无需） |
| 大屏或其他 Feature | 未修改 |
| 项目级基线（docs/baseline/） | 未修改 |

---

## 12. 验证命令与结果

| # | 验证项 | 命令 / 证据 | 结果 |
|---|---|---|---|
| 1 | 已读取项目级六份基线 | 任务开始前读取 `docs/baseline/` 六份正式基线 | PASS |
| 2 | 当前分支为 `develop` | `git branch --show-current` → `develop` | PASS |
| 3 | 基准提交核对 | `git rev-parse HEAD` → `026417e7e907b0fd23e8812024a260f119c993cc` | PASS |
| 4 | REQUIREMENTS 仅 4 条业务行变化 | `git diff 026417e -- REQUIREMENTS.md \| grep -E '^[+-]\| DSUB-REQ-'` 仅见 DSUB-REQ-097/098/099/103 | PASS |
| 5 | 其余 103 条 DSUB-REQ 业务行不变 | 对照基准逐行核对 | PASS |
| 6 | ACCEPTANCE 仅 6 条业务行变化 | `git diff 026417e -- ACCEPTANCE.md \| grep -E '^[+-]\| DSUB-AC-'` 仅见 DSUB-AC-107/108/109/110/114/117 | PASS |
| 7 | 其余 120 条 DSUB-AC 业务行不变 | 对照基准逐行核对（DSUB-AC-048 未改动，见 §5.3 说明） | PASS |
| 8 | DESIGN/API/UI/DATABASE 相对基准零 diff | `git diff 026417e -- DESIGN.md API.md UI.md DATABASE.md` 为空 | PASS |
| 9 | 全文不再把版本令牌/内容指纹/行锁/并发冲突拒绝作为当前需求 | 全文检索：残余命中均为状态说明、历史变更记录、删除项否定表述、§14/§4.11 标题 | PASS |
| 10 | 需求数量保持 107 | `grep -cE '^\| DSUB-REQ-[0-9]+ \|' REQUIREMENTS.md` → 107 | PASS |
| 11 | 验收数量保持 126 | `grep -cE '^\| DSUB-AC-[0-9]+ \|' ACCEPTANCE.md` → 126 | PASS |
| 12 | 未涉及数据库操作 | 本任务未执行任何 sqlplus 连接 | PASS |
| 13 | 未涉及业务/测试代码修改 | `git status --short` 仅见授权文档 + 任务开始前已存在无关修改 | PASS |
| 14 | 未涉及 ZooKeeper 操作 | 未调用 zkCli 读写 | PASS |
| 15 | 任务开始前无关修改保持原样 | `git status --short` 对比任务开始前快照，无关文件未被改动 | PASS |
| 16 | 暂存范围仅 4 个授权文件 | `git add` 逐个暂存；`git diff --cached --name-status` 确认无其他文件 | PASS |
| 17 | Commit message 体现“取消并发保护需求调整草案” | 见 §13 | PASS |
| 18 | 普通推送到 `origin/develop` | `git push origin develop` | PASS |
| 19 | 推送后本地 HEAD 与远端跟踪分支一致 | `git rev-parse HEAD` 与 `git rev-parse origin/develop` 一致 | PASS |
| 20 | 远程 `develop` 一致 | `git ls-remote origin refs/heads/develop` 与本地 HEAD 一致 | PASS |
| 21 | ahead/behind 为 0 0 | `git rev-list --left-right --count HEAD...origin/develop` → `0 0` | PASS |
| 22 | 工作区无遗留本任务无关新文件被提交 | `git status --short` 提交后核对 | PASS |

> 验证边界：本任务为纯文档任务，未运行 Maven/npm/前后端测试，未启动服务，未连接数据库与 ZooKeeper；上述不适用项按 §15 验证矩阵标记，不因未运行而构成失败。

---

## 13. Git 提交与推送结果

- 提交前暂存：仅 `docs/features/data-subscription/REQUIREMENTS.md`、`docs/features/data-subscription/ACCEPTANCE.md`、`docs/features/README.md`、`docs/features/data-subscription/reports/DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md` 四个授权文件，逐个 `git add`，未使用 `git add .` / `-A`。
- 提交信息：体现“取消并发保护需求调整草案”。
- 推送目标：`origin/develop`（普通推送，非强制）。
- 推送后核验：本地 `HEAD`、远端跟踪分支 `origin/develop` 与远程 `refs/heads/develop` 一致，`HEAD...origin/develop` 为 `0 0`，`git status --short` 无本任务遗留未提交文件。

> 最终真实提交与推送证据以 Agent 控制台结果块为准；本报告在提交前不虚构尚未产生的提交 ID。
