# 探针端管理页面级调整基线 · 证据一致性最小修订执行报告（R3）

> 任务编号：`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R3`
> 任务性质：**验收基线说明文字与 R2 报告摘要的最小证据纠错**（**纯文档**，未实现、未测试、未构建、未目测、未启动服务、未执行正式验收）
> 目标分支：`develop`
> 预期起始提交：`5e0731aef0e36c1be9b87eba660e9b8c4a052555`
> 本任务授权：定向修改 `ACCEPTANCE.md` §1.4 的一处说明文字、新增本 R3 报告、Commit、普通 Push
> 本任务不授权：修改任何验收定义行、需求、设计、UI、模板、API、数据库文档、历史报告、代码或测试；不授权测试、构建、浏览器、服务、数据库、ZooKeeper、Kafka 或正式验收操作

本报告按规范**不**在正文中自引用“包含本报告的最终提交 ID”；最终提交 ID 只在 Push 后的控制台结果块中输出。

> **追加式纠错声明**：R3 报告对 R2 报告的**唯一取代范围**是“历史异常 `FG_ACTIVE` 的‘更多’下拉菜单摘要”一句。
> R2 报告的三项统计纠错**继续有效**；R0/R1/R2 历史报告原文与 Git 历史**保持原样、未被回写、未被伪装**。
> 本任务**不**改变任何业务规则、编号、覆盖或状态，**只**消除证据文本与既有业务规则之间的矛盾。

---

## 1. 任务信息与开始前门禁

```text
task_code=CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R3
branch=develop
expected_base_commit=5e0731aef0e36c1be9b87eba660e9b8c4a052555
```

开始前门禁记录：

```text
git status --short:
 M .claude/settings.local.json
?? docs/prompts/

git branch --show-current = develop
git rev-parse HEAD = 5e0731aef0e36c1be9b87eba660e9b8c4a052555
git ls-remote origin refs/heads/develop = 5e0731aef0e36c1be9b87eba660e9b8c4a052555
git rev-list --left-right --count HEAD...origin/develop = 0	0
```

| 门禁项 | 结果 |
|---|---|
| 当前分支为 `develop` | 通过 |
| 本地 `HEAD` / `origin/develop` / `git ls-remote` 三者一致且等于预期起始提交 | 通过（均为 `5e0731aef0e36c1be9b87eba660e9b8c4a052555`） |
| ahead/behind | `0 0` |
| 目标新增路径 `...-BASELINE-001-R3.md` 是否已存在 | **不存在** |
| 未触发 `BLOCKED_BASELINE_MOVED` | 是 |
| 未触发 `BLOCKED_TARGET_ALREADY_EXISTS` | 是 |
| 未触发 `BLOCKED_OVERLAPPING_LOCAL_CHANGES` | 是 |

工作区分类：

| 项 | 归属 | 处理 |
|---|---|---|
| `.claude/settings.local.json`（已修改） | 任务开始前已存在，Claude Code 会话瞬时变化，非本任务范围 | 不修改、不覆盖、不暂存、不提交 |
| `docs/prompts/`（未跟踪，42 个文件） | **用户输入**，非本任务范围 | 不修改、不暂存、不提交、不删除；任务前后完整性已核验（见 §13） |
| `docs/features/client-config/ACCEPTANCE.md` | 本任务**唯一**允许定向修改的既有文件（仅 §1.4 说明文字） | 本任务修改 |
| `...-BASELINE-001-R3.md` | 本任务**唯一**允许新增 | 本任务创建 |

---

## 2. ChatGPT 对 R2 的复审结论

```text
r2_review_status=CHANGES_REQUIRED
r2_three_evidence_corrections_status=PASS
```

ChatGPT 已从远程 Git 对 R2 结果提交
`5e0731aef0e36c1be9b87eba660e9b8c4a052555` 完成独立复审，结论为 `CHANGES_REQUIRED`。

复审确认（R2 已正确完成的部分）：

- R2 的 **Git 范围正确**：只新增一份 R2 报告，未修改任何既有文件；
- R2 的 **三项统计纠错均准确**：R0 实际修改 12 / 元数据 10 / 漏列 `016`、`023`；17 条去重集合与 16 条定向修订标记；R1 提交完整 7 文件与 numstat；
- **业务基线未变**，编号、覆盖、四层状态均正确。

阻塞范围仅为 **2 处文字证据**：

1. 正式验收基线 `ACCEPTANCE.md` §1.4 仍保留“17 条均与‘本轮定向修订’标记逐一对应”的错误说明——R2 报告不能替代**正式基线**中的当前错误陈述；
2. R2 报告 §8 把历史异常 `FG_ACTIVE` 的“更多”下拉摘要写成**只含“停用”**，遗漏了所有三态行均有的“删除”，与 `REQUIREMENTS.md` `CCFG-REQ-097`、`ACCEPTANCE.md` `CCFG-AC-082/083`、`DESIGN.md` `CCFG-DESIGN-041/045`、`UI.md` `CCFG-UI-032/035` 冲突。

因此本任务只做上述两处最小纠错。

---

## 3. R2 复审发现的两个问题及 R3 处理

| # | 问题 | R3 处理 |
|---|---|---|
| 1 | `ACCEPTANCE.md` §1.4 说明文字把 17 条去重集合与“本轮定向修订”标记混为一谈 | **直接修正正式基线说明文字**（唯一允许的 `ACCEPTANCE.md` 正文修订，见 §4） |
| 2 | R2 报告 §8 的历史异常下拉摘要只含“停用”，遗漏“删除” | **通过 R3 追加报告纠正**；R2 历史文件**不回写**（见 §5） |

---

## 4. `ACCEPTANCE.md` §1.4 说明文字修正（修改前 → 修改后）

### 4.1 修改前（起始提交时的错误说明）

```text
说明：上表与 §4 表格中带 `**【本轮定向修订 · 待批准】**` 标记的各行逐一对应；`CCFG-AC-016`/`CCFG-AC-023` 为 R0 实际已修改、但 R0 清单曾漏列的既有用例，本 R1 已补齐。R1 不新增、不删除、不重排任何验收编号，总数保持 89 条。
```

问题：该句声称 17 条合计集合与 `【本轮定向修订 · 待批准】` 标记“逐一对应”，
但实际带该标记的定义行为 **16** 条，`CCFG-AC-089` 仍带 `【本轮新增 · 待批准】`。

### 4.2 修改后（当前生效说明）

```text
说明：上表 R0/R1 合计涉及 17 条去重验收用例（`CCFG-AC-002/009/016/017/018/019/020/021/022/023/025/026/032/082/087/088/089`）。当前 §4 中有 16 条定义行带 `**【本轮定向修订 · 待批准】**` 标记（`CCFG-AC-002/009/016/017/018/019/020/021/022/023/025/026/032/082/087/088`）；`CCFG-AC-089` 为 R0 新增、R1 再次补充内容的用例，仍保留 `**【本轮新增 · 待批准】**` 标记，因此不得把 17 条全部表述为同一种标记。R0 实际修改 12 条既有用例，但 R0 元数据清单当时只列 10 条，漏列 `CCFG-AC-016`、`CCFG-AC-023`，R1 已补齐。R1 不新增、不删除、不重排任何验收编号，总数保持 89 条且全部 `NOT_RUN`。
```

### 4.3 事实依据（远程 Git 与当前文档核验）

| 事实 | 核验值 |
|---|---|
| R0/R1 合计涉及的**去重**验收集合 | **17** 条 |
| 当前 `ACCEPTANCE.md` 中带 `**【本轮定向修订 · 待批准】**` 的定义行 | **16** 条 |
| `CCFG-AC-089` 的标记类型 | 仍为 `**【本轮新增 · 待批准】**`（R0 新增，R1 再次补充内容） |
| R0 **实际修改**的既有用例数量 | **12** |
| R0 **元数据中当时显式列出**的修订清单数量 | **10** |
| R0 元数据清单漏列 | `CCFG-AC-016`、`CCFG-AC-023` |
| 当前 89 条验收全部状态 | `NOT_RUN` |

### 4.4 严格不变项（行级保护结果）

- `CCFG-AC-001~089` 的 **89 条定义行相对起始提交逐字节未变**（见 §9）；
- 除 §1.4 上述**一段说明文字**外，`ACCEPTANCE.md` 其他内容未变（`git diff --numstat` 为 `1 1`，即单行增、单行删）；
- **未**增加变更记录行，**未**更新任务编号、下一入口或当前状态块。

---

## 5. R2 报告 §8 异常菜单摘要的追加纠正

### 5.1 R2 报告 §8 的原表述问题（保留在 R2 历史文件中，不回写）

R2 报告 §8 第 2 项在描述历史异常 `FG_ACTIVE` 时，把下拉摘要写成**只含“停用”一项**，
遗漏了“删除”——而“删除”是所有三态行在“更多”下拉中**都存在**的操作。

### 5.2 权威菜单口径（R3 权威，取代 R2 报告 §8 对应句）

```text
FG_ACTIVE='1'：更多下拉包含“停用”和“删除”
FG_ACTIVE='0'：更多下拉包含“启用”和“删除”
FG_ACTIVE 为非 '0'/'1' 历史异常值：更多下拉只包含“停用”和“删除”，不得包含“启用”
```

- **“删除”是三态均存在的操作**；
- 历史异常值的下拉**不包含“启用”**；
- 该口径与 `REQUIREMENTS.md` `CCFG-REQ-097`、`ACCEPTANCE.md` `CCFG-AC-082`/`CCFG-AC-083`、
  `DESIGN.md` `CCFG-DESIGN-041`/`CCFG-DESIGN-045`、`UI.md` `CCFG-UI-032`/`CCFG-UI-035` 完全一致：
  `'1'` → {停用, 删除}，`'0'` → {启用, 删除}，非 `0/1` → 仅 {停用, 删除}、不提供“启用”。

### 5.3 取代关系

- R3 报告**仅**在“异常历史状态的下拉菜单摘要”上取代 R2 报告 §8 的对应句；
- R2 报告的**三项统计纠错继续有效**；
- R0/R1/R2 历史报告**均保持原样**，其 Git 历史未被改写；
- R3 **不改变业务规则**，只消除证据文本与既有业务规则之间的矛盾。

---

## 6. 异常标识与行选择规则（保持不变）

### 6.1 异常 `FG_ACTIVE` 标识规则（不变）

- `FG_ACTIVE` 为非 `'0'/'1'` 历史异常值：**紧跟探针 ID** 显示**红色**标识 `异常：{原始值}`，
  `{原始值}` 按既有数据契约原样展示，不得静默转成启用/停用、不得只显示“异常”而隐藏值；
  红色标识具备可读对比度，不只靠颜色表达异常。
- `FG_ACTIVE='1'`：探针 ID 后**不显示**任何状态标识。
- `FG_ACTIVE='0'`：探针 ID 后显示与数据源管理“数据源 ID”一致的“停用”标识。

### 6.2 行选择取消规则（不变）

取消“删除所选”后，**行单选、选中行高亮与“已选择：{探针ID}”全部取消**
（无选中态、无选中事件、无已选行集合、无“当前选中行”概念、无选中视觉、无等价已选文本）；
删除/启停一律由该行“更多”下拉发起，**不**依赖行选中；
行双击编辑与探针 ID 键盘编辑**保留**。

---

## 7. 本任务实际变更范围（白名单核验）

**本任务唯一允许修改的既有文件**：

```text
docs/features/client-config/ACCEPTANCE.md   （仅 §1.4 一段说明文字）
```

**本任务唯一允许新增**：

```text
docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R3.md
```

核验结果：

```text
git status --short 中本任务涉及项 = 上述 1 改（ACCEPTANCE.md）+ 1 增（R3 报告）
git diff --name-only = .claude/settings.local.json（既有）、docs/features/client-config/ACCEPTANCE.md（本任务）
git diff --numstat = 148 / 1（settings.local.json，既有）、1 / 1（ACCEPTANCE.md，单行增删）
ACCEPTANCE.md 相对起始提交的差异 = 仅 §1.4 说明文字 1 行增、1 行删
```

未触发 `BLOCKED_SCOPE_EXPANSION_REQUIRED`（无需修改白名单外任何文件即可完成任务）。

---

## 8. 当前基线统计与状态（保持不变）

```text
requirement_count=103
acceptance_count=89
design_count=46
ui_count=35
acceptance_not_run_count=89
requirements_acceptance_coverage=103/103
pending_user_confirmation_count=0
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment_implementation_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
```

---

## 9. 验收定义行逐字节保护验证

从起始提交 `5e0731ae...` 提取 `ACCEPTANCE.md` 全部验收定义行（格式 `| CCFG-AC-NNN | ...`），
与工作区版本逐字节比较（比较完整文本，非仅比较编号）：

```text
acceptance_definition_rows_changed=0
acceptance_definition_row_count=89
acceptance_not_run_count=89
```

补充证据：89 条定义行拼接块的 SHA-256 在起始提交与工作区**完全相同**
（`2b23dee93c0f72cd512da91d5748ae64132d7ed830be064c2104b6b00776b2f1`）。

---

## 10. 标记、编号与覆盖核验

```text
acceptance_directional_revision_marker_count=16
acceptance_new_marker_but_r1_modified=CCFG-AC-089    （标记仍为“本轮新增”）
r0_r1_union_acceptance_count=17
requirement_count=103
acceptance_count=89
design_count=46
ui_count=35
requirements_acceptance_coverage=103/103
pending_user_confirmation_count=0
```

- `CCFG-REQ-001~103`（103）、`CCFG-AC-001~089`（89）、`CCFG-DESIGN-001~046`（46）、
  `CCFG-UI-001~035`（35）均连续、唯一；
- 本 R3 任务**未**新增、删除或重排任何编号。

---

## 11. 未执行事项（明确记录）

本任务**未执行**且**不得**据本报告推断已完成：

- 未修改任何验收定义行、需求、设计、UI、模板、API、数据库文档或历史报告（R0/R1/R2 报告未动）；
- 未修改任何前端或后端代码与测试；
- 未运行单元测试、集成测试、构建、lint；
- 未访问浏览器、未做页面目测或截图；
- 未启动或停止任何服务；
- 未连接或查询数据库；`database_access_status=NONE`、`database_write_status=NONE`、`ddl_status=NONE`；
- 未访问 ZooKeeper；`zookeeper_access_status=NONE`；
- 未访问 Kafka；`kafka_access_status=NONE`；
- 未执行正式验收、最终接受或任何状态收口。

本任务仅运行只读的 `git status/diff/show/numstat/rev-parse/ls-remote/rev-list`、
`grep`/`python3` 统计与 `sha256sum` 校验；**未**提交任何脚本。

---

## 12. `docs/prompts/**` 完整性

任务开始前对 `docs/prompts` 下全部 **42** 个文件做 `sha256sum` 记录；
任务完成后重新计算并比对：

```text
docs_prompts_integrity=UNCHANGED
```

`docs/prompts/**` 全程不修改、不暂存、不提交、不删除。

---

## 13. 下一入口

```text
next_entry=CHATGPT_REMOTE_BASELINE_R3_REVIEW
```

两处最小纠错完成后，仍只进入 **ChatGPT 从远程 Git 对 R3 结果提交的独立复审**，
**不是**直接进入实现，也**不**代表本轮基线已批准、页面已实现或验收已通过。
在复审与项目负责人批准完成前，不得实施页面、不得执行正式验收、不得迁移任何页面。
