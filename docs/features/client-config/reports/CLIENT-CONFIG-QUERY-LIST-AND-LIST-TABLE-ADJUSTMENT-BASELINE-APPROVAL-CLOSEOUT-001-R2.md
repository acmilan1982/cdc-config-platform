# 探针端管理页面级调整基线 · 批准收口 R2 当前入口与统计证据最小纠错执行报告

任务编号：`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001-R2`

本报告为**纯文档**任务，只做“当前下一入口”与“历史命中统计证据”两项最小纠错，不实现任何页面、不执行任何验收，不宣称页面调整已实现、验收已通过或功能已最终接受。

---

## 1. 任务信息与开始前门禁

| 项目 | 值 |
|---|---|
| 任务编号 | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001-R2` |
| 任务性质 | 纯文档；ChatGPT 对 R1 远程复审 `CHANGES_REQUIRED` 驱动的当前入口与统计证据最小纠错 |
| 分支 | `develop` |
| 期望起始提交 | `26134a02aea60e76971b579fabd8422f6c917d29` |
| 实际起始提交 | `26134a02aea60e76971b579fabd8422f6c917d29`（与期望一致） |
| 起始提交时本地 / `origin/develop` / 远程 `refs/heads/develop` | 三者一致；ahead/behind = `0 0` |
| 门禁结果 | `PASS` |
| 目标 R2 报告路径（开始前） | **不存在**（未覆盖既有报告） |
| 任务开始前既有脏文件 | ` M .claude/settings.local.json`（任务前既有、与本次任务无关，未修改、未暂存、未提交）；`?? docs/prompts/`（未跟踪目录，未修改） |
| 白名单外文件 | 未改动 |

门禁检查项：当前目录 `/agent/cdc-config-platform`、有效 Git 仓库、分支 `develop`、起始提交 ID 已记录、环境预检通过（本任务为纯文档任务，不涉及构建、数据库、ZooKeeper、Kafka）。

---

## 2. 被复审提交与 ChatGPT 结论

| 项目 | 值 |
|---|---|
| 被复审任务 | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001-R1` |
| 被复审提交 | `26134a02aea60e76971b579fabd8422f6c917d29` |
| 复审方式 | ChatGPT 从远程 Git 独立复审 |
| 复审结论 | `CHANGES_REQUIRED` |
| 驱动产生的任务 | 本任务（`...-APPROVAL-CLOSEOUT-001-R2`） |

R1 **已通过**的内容（本次复核仍然成立）：父提交正确、远程提交存在、6 个变更文件均在 R1 白名单内；`git diff --check` 通过；103/89/46/35 条业务定义行相对 R1 起点逐字节相同；89 条验收全部 `NOT_RUN`；页面调整基线的当前“草案 / 未批准”表述已修正且历史记录保留。

本任务只处理两项阻断：

1. **当前下一入口残留**：五份 Feature 文档的**当前下一入口**仍指向已执行的 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（R1 报告 §6.3 已承认该字段仍在）。R2 后当前下一入口应为 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`；历史批准收口记录与 R1 报告中的当时入口必须保留历史语义。
2. **历史命中统计证据不一致**：R1 Agent 回传 `historical_occurrence_preserved=332`，与 R1 报告 §6.2 / §6.3 写明的 `312` 不符（分项 `96+73+63+37+43=312`），相差 20。须复算/审计统计口径，并在本 R2 报告中追加纠正**回传与报告的差异**。

---

## 3. 当前下一入口最小纠错

### 3.1 判定规则

- 文档顶部/状态表的**当前**状态块、当前导航、当前“下一入口”等操作性指引：改为 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`，并注明对象为**本次 R2 纠错的结果提交**（提交 SHA 由 ChatGPT 从远程 Git 取得，文档**不预造**）。
- 2026-09-22 原批准收口**证据表**中的“下一入口”行：保留旧入口原文，增加“历史入口 / 已完成 / 已被取代”限定，并新增明确的当前入口。
- **变更记录**行（`| 2026-09-22 | …`）中的旧入口：属当时真实的下一入口，**原文保留不改写**（该行本身即带日期，可识别为历史）。
- **不**把当前入口改成 `...APPROVAL_CLOSEOUT_R1_REVIEW`（那正是本次 `CHANGES_REQUIRED` 的复审）。

### 3.2 五份文档旧入口出现位置清单（共 13 处）

旧入口字符串 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW` 在五份文档共出现 **13 处**，逐处分类与处理如下：

| # | 位置 | 所在结构 | 分类 | 处理方式 |
|---|---|---|---|---|
| 1 | `README.md` §1.1 分层状态代码块 | 当前状态块 `next_entry=` | **当前** | 值改为 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW` |
| 2 | `README.md` §1.2 批准收口证据表“下一入口”行 | 批准收口证据表 | **历史（证据表）** | 保留旧入口原文，前置“2026-09-22 批准收口时的**历史入口**”、注明“已完成并返回 `CHANGES_REQUIRED`，由 R1/R2 纠错任务承接”，并新增“**当前下一入口**为 `…_R2_REVIEW`” |
| 3 | `README.md` §5 当前下一入口段落 | 当前操作指引 | **当前** | 段首改为 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`；把旧入口改写为“已执行并返回 `CHANGES_REQUIRED`、属**历史入口**、已被本入口取代”；保留更早的 `…_R1_REVIEW` 历史提及 |
| 4 | `REQUIREMENTS.md` §1.3 概要表“下一入口”行 | 当前分层状态概要表 | **当前** | 值改为 `…_R2_REVIEW`；把旧入口降为“历史入口（2026-09-22 批准收口设定，已完成并返回 `CHANGES_REQUIRED`）” |
| 5 | `REQUIREMENTS.md` §1.4 批准收口证据表“下一入口”行 | 批准收口证据表 | **历史（证据表）** | 同 #2 处理（保留原文 + 历史限定 + 当前入口） |
| 6 | `REQUIREMENTS.md` §10 变更记录行 | 变更记录（`| 2026-09-22 |`） | **历史（变更记录）** | **原文保留不改写** |
| 7 | `ACCEPTANCE.md` §1.3 状态表“下一入口”行 | 当前状态表 | **当前** | 值改为 `…_R2_REVIEW`；旧入口降为“历史入口（已完成）” |
| 8 | `ACCEPTANCE.md` §1.5 批准收口证据表“下一入口”行 | 批准收口证据表 | **历史（证据表）** | 同 #2 处理 |
| 9 | `ACCEPTANCE.md` §10 变更记录行 | 变更记录 | **历史（变更记录）** | **原文保留不改写** |
| 10 | `DESIGN.md` §14 变更记录行 | 变更记录 | **历史（变更记录）** | **原文保留不改写**（DESIGN 原先无独立当前入口字段） |
| 11 | `UI.md` §1 状态表“本轮下一入口”行 | 当前状态表 | **当前** | 值改为 `…_R2_REVIEW`；旧入口降为“历史入口（已完成并返回 `CHANGES_REQUIRED`）” |
| 12 | `UI.md` §15.1 批准收口证据表“下一入口”行 | 批准收口证据表 | **历史（证据表）** | 同 #2 处理 |
| 13 | `UI.md` §16 变更记录行 | 变更记录 | **历史（变更记录）** | **原文保留不改写** |

### 3.3 新增的当前入口说明（`DESIGN.md`）

`DESIGN.md` 原先**没有**独立当前入口字段（旧入口仅出现于其变更记录）。按任务提示词 §4“没有独立当前入口字段的文件增加一处简短、明确的当前入口说明”，在 `DESIGN.md` §13 前言末尾**追加**一句当前入口说明：当前下一入口为 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`（历史入口 `…_CLOSEOUT_REVIEW` 已完成并返回 `CHANGES_REQUIRED`）。

### 3.4 R2 后当前统一入口与复扫结论

```text
current_next_entry=CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW
current_old_entry_count=5
historical_old_entry_count=8
unresolved_current_old_entry_count=0
```

复核（可复现）：`grep -n "CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW" <5 docs>` 得 13 行，逐行核查后**全部**为“带明确历史限定（历史入口 / 已完成 / 已被取代）”或“位于带日期的变更记录行”；不存在任何**无历史限定、以“当前下一入口”指向**已完成 `…_CLOSEOUT_REVIEW` 或 `…_CLOSEOUT_R1_REVIEW` 的位置。`…_R2_REVIEW` 出现 10 处，均为当前入口表述。文档内“只有该复审通过后才进入独立实现任务”的指向已同步为 R2 复审；本任务**不**执行实现。

---

## 4. 历史命中统计证据纠错（312 与 332 的复核）

### 4.1 原样对照

| 来源 | 记录的 `historical_occurrence_preserved` |
|---|---|
| R1 报告 §6.2 分项（`96/73/63/37/43`）与 §6.3 | **312** |
| R1 Agent 回传 | **332** |
| 差值 | **20** |

### 4.2 复算方法与可复现结果

复算严格按 R1 报告 §6.1 记载的规则执行：7 个扫描词（`DRAFT_PENDING_USER_REVIEW` / `尚未批准` / `待批准` / `待复审` / `草案` / `APPROVED` / `adjustment_baseline_status`），计数单位为**命中项（occurrence）**；分类优先级为：① 定义行/矩阵行 → `defrow_occurrence`（零变化保护，不参与当前/历史判定）；② 命中项前 60 字符或后 40 字符内出现历史限定词（历史/当时/批准前/曾/已由/已被/被取代/取代/建立时/收口为/转为/原为/属历史/草案阶段/初版/最初/已建立/已于/旧口径/未获项目负责人批准/过时/后经/R0/R1/R2/R3）→ `historical_occurrence_preserved`；③ 整行历史记录（变更记录行 `| 2026-MM-DD |`、报告导航行 `| \`reports/`、状态变化行、含 `【历史记录`/“不代表当前状态”/“任务编号 |”的行）→ 该行命中项全部计为历史保留；④ `本轮定向修订 · X` / `本轮新增 · X` 引用 → `marker_quotation`；⑤ 其余 `DRAFT_PENDING_USER_REVIEW`/`尚未批准`/`待批准`/`待复审`/`草案` → `current_stale_occurrence`；⑥ 其余 `APPROVED`/`adjustment_baseline_status` → `current_state_approved`。

复算脚本：`/tmp/r1_occurrence_scan.py`（运行于仓库根目录，`base` 模式读 `git show f86d4e8d…`，`work` 模式读工作区文件）。

**结论：两个数字都可复现，但分属不同的内容状态。**

| 内容状态 | `historical_occurrence_preserved` | `current_stale_occurrence` | 与报告/回传对应 |
|---|---:|---:|---|
| R1 **起点**内容（`f86d4e8d…`，`base` 模式） | **312** | 48 | 与 **R1 报告 §6.2** 的历史保留列一致 |
| R1 **结果**内容（`26134a02…`，`work` 模式） | **332** | 3 | 与 **R1 Agent 回传**一致 |

即：R1 报告 §6.2 的“历史保留”列（`96/73/63/37/43`）取自 **R1 起点内容**，而 §6.3 以 `historical_occurrence_preserved=312` 表述，读起来像是**修正后**数字；R1 Agent 回传的 332 实为 **R1 结果内容**的数字。两者不是笔误关系，而是**报告把起点口径的 312 当成了结果口径**；报告的表格 `当前状态残留（修正后）` 列（`1/1/0/1/0=3`）又是结果口径，故该表混用了两种内容状态，这是本报告要纠正的证据问题。

逐文件复算（`work` 模式，即 R1 结果 `26134a02…`）：

| 文件 | 起点历史保留 | 结果历史保留 | 增量 |
|---|---:|---:|---:|
| `README.md` | 96 | 98 | +2 |
| `REQUIREMENTS.md` | 73 | 78 | +5 |
| `ACCEPTANCE.md` | 63 | 69 | +6 |
| `DESIGN.md` | 37 | 41 | +4 |
| `UI.md` | 43 | 46 | +3 |
| **合计** | **312** | **332** | **+20** |

增量 +20 的来源：R1 对 45 处当前状态残留的修正中，有 20 处在改写时**新增了历史限定语**（如“批准前为 `DRAFT_PENDING_USER_REVIEW`”“已于 2026-09-22 经项目负责人批准收口”），使原本计为 `current_stale` / `current_approved` 的命中项在结果内容中改计入“历史保留”；同时部分关键词被改写为“基线”等表述而从命中集消失（关键字命中总数起点 456 → 结果 429）。两者共同解释 312→332 的 +20。

### 4.3 本次以 R2 起始提交复算的结果

按任务提示词 §5.2 在 **R2 起始提交 `26134a02…`** 的五份 Feature 文档上复算：

```text
r1_report_historical_occurrence_preserved=312
r1_agent_return_historical_occurrence_preserved=332
r2_recalculated_historical_occurrence_preserved=332
historical_count_difference_explained=YES
```

```text
defrow_or_matrix_occurrence=53
marker_quotation=3
historical_occurrence_preserved=332
current_state_approved_occurrence=38
current_stale_occurrence_remaining=3（经复核均为历史，见 §4.4）
```

**限制说明**：本次复算的规则取自 R1 报告 §6.1 的文字描述，属**重新实现**（`/tmp/r1_occurrence_scan.py`），并非 R1 当时的原始脚本；R1 原始脚本未入库、无法逐字节比对。分类中的“历史限定词窗口（前 60 / 后 40 字符）”“整行历史记录”判定含机械阈值，边界样本可能因窗口大小而变化；本次已按报告记载的窗口与词表执行，且起点口径结果（312 与分项 `96/73/63/37/43`）与报告**完全一致**，可作为该方法忠实复现报告口径的证据。R1 回传的 332 亦被复现（结果口径），故 **332 并非无依据**。

### 4.4 复算中的 3 处残留命中（经复核均为历史）

| 位置 | 命中 | 复核结论 |
|---|---|---|
| `README.md:88` | `草案` | 2026-09-04 变更记录“并发口径调整**草案**……”——历史条目，保留 |
| `REQUIREMENTS.md:32` | `草案` | 2026-09-04 收口范围声明“也不修改既有设计**草案**”——历史，保留 |
| `DESIGN.md:35` | `草案` | “本轮调整任务”元数据行中的历史任务名称记录——历史，保留 |

此 3 处与 R1 报告 §6.2 脚注的复核结论一致。

### 4.5 历史报告回写状态

```text
r1_report_change_status=NONE
original_closeout_report_change_status=NONE
```

R1 报告与 2026-09-22 原批准收口报告**均未回写**（相对起始提交逐字节零变化）；历史 Agent 回传属已发出的外部记录，**无法回写**。本 R2 报告以**追加型**方式纠正 R1 报告的统计口径问题（起点 312 被当作结果口径），**不**删除、不修改 R1 报告原文中的 312。

---

## 5. 业务定义与状态保护

### 5.1 定义行逐字节比较（相对起始提交 `26134a02…`）

```bash
BASE=26134a02aea60e76971b579fabd8422f6c917d29
git show $BASE:docs/features/client-config/<DOC>.md | grep -E '^\| CCFG-<PAT>-[0-9]{3} \|' | md5sum
grep -E '^\| CCFG-<PAT>-[0-9]{3} \|' docs/features/client-config/<DOC>.md | md5sum
```

| 文件 | 定义行模式 | 条数 | 起始提交 md5 | 工作区 md5 | 结论 |
|---|---|---:|---|---|---|
| `REQUIREMENTS.md` | `| CCFG-REQ-NNN |` | 103 | `0cc66c9955284693810ae0171ceec762` | 同左 | 逐字节零变化 |
| `ACCEPTANCE.md` | `| CCFG-AC-NNN |` | 89 | `3b6fe581976c0f3e94d9ab7c0df1141d` | 同左 | 逐字节零变化 |
| `DESIGN.md` | `| CCFG-DESIGN-NNN |` | 46 | `eacae3127936dfdbad0cfd7fa7411da7` | 同左 | 逐字节零变化 |
| `UI.md` | `| CCFG-UI-NNN |` | 35 | `55ef47db69613f73f706d6c6469d1beb` | 同左 | 逐字节零变化 |

```text
requirement_definition_rows_changed=0
acceptance_definition_rows_changed=0
design_definition_rows_changed=0
ui_definition_rows_changed=0
```

含 `**【本轮定向修订 · 待批准】**` / `**【本轮新增 · 待批准】**` 标记的既有定义行**均未改写**。

### 5.2 编号、计数与验收执行状态

```text
requirement_count=103
acceptance_count=89
design_count=46
ui_count=35
acceptance_not_run_count=89
requirements_acceptance_coverage=103/103
pending_user_confirmation_count=0
```

依据：`ACCEPTANCE.md` 中 89 条 `CCFG-AC-NNN` 定义行**第 2 列（执行状态）全部为 `NOT_RUN`**（`awk -F'|' '{print $3}'` 唯一值为 `NOT_RUN`），无任何用例被改写为执行结果；覆盖 103/103 声明未变；`PENDING_USER_CONFIRMATION` 在各文档中的当前值均为 0。已批准状态、页面级模板授权边界、模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）均保持不变。

---

## 6. 白名单、实际变更与零变化核验

### 6.1 实际变更文件（相对起始提交）

| 文件 | 变更行（+/-） | 类型 |
|---|---:|---|
| `docs/features/client-config/README.md` | 3 / 3 | 当前入口修正 |
| `docs/features/client-config/REQUIREMENTS.md` | 2 / 2 | 当前入口修正 |
| `docs/features/client-config/ACCEPTANCE.md` | 2 / 2 | 当前入口修正 |
| `docs/features/client-config/DESIGN.md` | 1 / 1 | 追加当前入口说明 |
| `docs/features/client-config/UI.md` | 2 / 2 | 当前入口修正 |
| `docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001-R2.md` | 新增 | 本报告 |

`git status --short` 中的 ` M .claude/settings.local.json` 与 `?? docs/prompts/` 为任务开始前既有、与本任务无关，**未修改、未暂存、未提交**。

### 6.2 零变化核验（相对起始提交）

```text
docs/features/client-config/API.md                                                        -> 零变化
docs/features/client-config/DATABASE.md                                                   -> 零变化
docs/baseline/query-list-page-template/MIGRATION.md                                       -> 零变化
docs/baseline/list-table-visual-template/MIGRATION.md                                     -> 零变化
docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001.md       -> 零变化
docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1.md    -> 零变化
docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R2.md    -> 零变化
docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R3.md    -> 零变化
docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001.md    -> 零变化
docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001-R1.md -> 零变化
docs/features/README.md                                                                   -> 零变化（见 §6.4）
CLAUDE.md / docs/baseline/ 六份正式项目级基线 / agent-env.sh / frontend/** / backend/**    -> 零变化
```

```text
template_file_change_status=NONE
api_database_file_change_status=NONE
frontend_backend_code_change_status=NONE
```

### 6.3 模板记录

两套模板目录下的全部文件（含 `README.md`/`DESIGN.md`/`UI.md`/`SHARED_COMPONENT_DESIGN.md`/`MIGRATION.md`）均**零变化**；模板级全局迁移状态保持不变；本任务**未**授予、未扩大任何页面迁移授权。

### 6.4 `docs/features/README.md` 陈旧描述登记（任务前既有、越范围、非阻断）

`docs/features/README.md` 的 Feature 总索引中仍把 `client-config` 描述为占位 / `NOT_STARTED`。经核验：该描述在起始提交 `26134a02…` 时已存在、非本任务引入；该文件**不在**白名单内；其与真实状态的差异不影响本轮结论，属**非阻断**遗留项；本任务**未修改**该文件。

---

## 7. 未修改项、未执行事项与下一入口

### 7.1 未修改代码与工程资产

```text
frontend_code_change_status=NONE
backend_code_change_status=NONE
tests_change_status=NONE
build_config_or_dependency_change_status=NONE
sql_or_ddl_change_status=NONE
```

### 7.2 未执行事项

```text
tests_build_browser_status=NOT_RUN_NOT_AUTHORIZED_DOCS_ONLY
database_zookeeper_kafka_access_status=NONE
service_operation_status=NONE
formal_acceptance_execution_status=NOT_RUN
```

未运行测试、构建、lint、浏览器、截图或前后端服务；未访问数据库、ZooKeeper、Kafka；未执行正式验收，未做页面目测，未作出最终接受。

### 7.3 `docs/prompts/**` 完整性

任务前后对 `docs/prompts/**` 全部文件生成 SHA-256 清单并比对：`UNCHANGED`（45 个文件，逐一一致）。本任务**未**新增、未修改、未删除任务提示词。

### 7.4 下一入口

```text
next_entry=CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW
```

本次 R2 纠错完成后，须由 ChatGPT 从远程 Git 对本 R2 结果提交做独立复审；**只有该复审通过后**，才进入独立页面调整实现任务。**不得**跳过该复审直接进入实现，**不得**把基线批准或本次纠错写成页面已实现、已测试、已目测或验收已通过。

---

## 8. 状态结论（本报告不作出下列声明）

```text
current_next_entry=CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW
current_old_entry_count=5
historical_old_entry_count=8
unresolved_current_old_entry_count=0
r1_report_historical_occurrence_preserved=312
r1_agent_return_historical_occurrence_preserved=332
r2_recalculated_historical_occurrence_preserved=332
historical_count_difference_explained=YES
adjustment_baseline_status=APPROVED
adjustment_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment_implementation_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
pending_user_confirmation_count=0
```

本报告**不**声明：页面级调整已实现、已目测、已测试；验收已执行或已通过；功能已最终接受；本轮实现已获授权；模板级全局迁移已获授权；其他页面已获授权。

历史记录保持当时事实（R0/R1/R2/R3 当时的草案状态、2026-09-22 批准收口设定的历史入口、R1 报告原文中的 312）未被删除、未被改写、未被伪装成从未存在。
