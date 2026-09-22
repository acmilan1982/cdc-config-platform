# 探针端管理页面级调整基线 · R1 报告证据纠错执行报告（R2）

> 任务编号：`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R2`
> 任务性质：**R1 执行报告的追加式证据纠错**（**纯文档**，未实现、未测试、未构建、未目测、未启动服务、未执行正式验收）
> 目标分支：`develop`
> 预期起始提交：`2c2b2a71fcd049a68f86339d225f659af69e81c3`
> 本任务授权：新增本 R2 报告、Commit、普通 Push
> 本任务不授权：修改任何既有文件、业务代码、测试、需求、验收、设计、UI、模板、API、数据库文档或历史报告；不授权测试、构建、lint、浏览器、服务、数据库、ZooKeeper、Kafka 或正式验收操作

本报告按规范**不**在正文中自引用“包含本报告的最终提交 ID”；最终提交 ID 只在 Push 后的控制台结果块中输出。

> **追加式纠错声明**：本报告是对 R1 执行报告的**追加式证据纠错**。
> R1 报告原文与 R0/R1 的 Git 历史**保持原样、未被回写、未被伪装**。
> 本报告**不**改变任何业务规则、编号、覆盖或状态，**只**更正三处**追踪证据表述**。

---

## 1. 任务信息与开始前门禁

```text
task_code=CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R2
branch=develop
expected_base_commit=2c2b2a71fcd049a68f86339d225f659af69e81c3
```

开始前门禁记录：

```text
git status --short:
 M .claude/settings.local.json
?? docs/prompts/

git branch --show-current = develop
git rev-parse HEAD = 2c2b2a71fcd049a68f86339d225f659af69e81c3
git ls-remote origin refs/heads/develop = 2c2b2a71fcd049a68f86339d225f659af69e81c3
git rev-list --left-right --count HEAD...origin/develop = 0	0
```

| 门禁项 | 结果 |
|---|---|
| 当前分支为 `develop` | 通过 |
| 本地 `HEAD` / `origin/develop` / `git ls-remote` 三者一致且等于预期起始提交 | 通过（均为 `2c2b2a71fcd049a68f86339d225f659af69e81c3`） |
| ahead/behind | `0 0` |
| 目标新增路径是否已存在 | **不存在**（`...-BASELINE-001-R2.md` 未出现在仓库中） |
| 未触发 `BLOCKED_BASELINE_MOVED` | 是 |

工作区分类：

| 项 | 归属 | 处理 |
|---|---|---|
| `.claude/settings.local.json`（已修改） | 任务开始前已存在，Claude Code 会话瞬时变化，非本任务范围 | 不修改、不覆盖、不暂存、不提交 |
| `docs/prompts/`（未跟踪，41 个文件） | **用户输入**，非本任务范围 | 不修改、不暂存、不提交、不删除；任务前后完整性已核验（见 §10） |
| 目标新增路径 `...-BASELINE-001-R2.md` | 本任务**唯一**允许新增 | 本任务创建 |

---

## 2. ChatGPT 对 R1 的复审结论

```text
r1_review_status=CHANGES_REQUIRED
r1_core_baseline_semantics_status=PASS
```

ChatGPT 已从远程 Git 对 R1 结果提交
`2c2b2a71fcd049a68f86339d225f659af69e81c3` 完成独立复审，结论为 `CHANGES_REQUIRED`。

复审确认：

- R1 的**核心基线内容已经正确**——两项项目负责人决定（取消全部行选择能力、
  历史异常 `FG_ACTIVE` 红色 `异常：{原始值}`）已经完整冻结，编号、覆盖与四层状态均正确；
- **阻塞范围仅为 R1 执行报告中的 3 处追踪证据表述不一致**，不涉及任何业务规则。

因此本任务**不**修改任何基线正文，只新增本 R2 纠错报告。

---

## 3. 三项证据错误的纠正

### 3.1 错误一：R0 验收修订清单的“记录数量”与“实际数量”

#### 3.1.1 R1 报告的原表述问题

R1 报告 §2.3 与 §5 存在**自相矛盾**的表述：

- §2.3 称“**R0 清单为 12 条**（`CCFG-AC-002/009/016/017/018/019/021/022/023/025/026/032`）”，
  同一句又接着说“其中 `CCFG-AC-016`、`CCFG-AC-023` …… 清单曾漏列”；
  该 12 条集合**本身已包含** `016` 与 `023`，故“12 条但漏列两条”在逻辑上不成立。
- §5 的差异表同样写入“修订用例清单 | 12 条，漏列 `CCFG-AC-016`/`CCFG-AC-023`”。

#### 3.1.2 远程 Git 核验事实

| 事实 | 核验值 |
|---|---|
| R0 提交 | `fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1` |
| R0 **实际修改**的既有验收用例数量（R0 提交中带 `**【本轮定向修订 · 待批准】**` 的既有定义行） | **12** |
| R0 **元数据中当时显式列出的**修订清单（`ACCEPTANCE.md` 元数据行“本轮修订的既有用例”） | **10** |
| R0 元数据清单漏列 | `CCFG-AC-016`、`CCFG-AC-023` |

R0 **实际修改**的 12 条为：

```text
CCFG-AC-002
CCFG-AC-009
CCFG-AC-016
CCFG-AC-017
CCFG-AC-018
CCFG-AC-019
CCFG-AC-021
CCFG-AC-022
CCFG-AC-023
CCFG-AC-025
CCFG-AC-026
CCFG-AC-032
```

R0 **元数据当时列出**的 10 条，即上述 12 条集合**扣除** `CCFG-AC-016` 与 `CCFG-AC-023`：

```text
CCFG-AC-002/009/017/018/019/021/022/025/026/032
```

#### 3.1.3 R2 权威纠正口径

```text
R0 实际修改的既有验收用例数量 = 12
R0 元数据中当时显式列出的修订清单数量 = 10
R0 元数据清单漏列 = CCFG-AC-016、CCFG-AC-023
R1 已把 R0 实际修改集合修正为完整 12 条
```

**不得**再使用“R0 清单为 12 条但漏列两条”的矛盾说法。
“漏列”的正确主语是 **R0 元数据清单（10 条）**，而不是 R0 的实际修改集合（12 条）。

### 3.2 错误二：17 条合计集合与标记类型

#### 3.2.1 R1 报告的原表述问题

R1 报告 §9.5 称：`ACCEPTANCE.md` §1.4 的 17 条合计清单与 §4 中带
`**【本轮定向修订 · 待批准】**` 标记的各行**逐一对应**。
该表述把 17 条**去重集合**与**同一种标记类型**混为一谈。

#### 3.2.2 远程 Git 核验事实

| 事实 | 核验值 |
|---|---|
| 当前 `ACCEPTANCE.md` 中带 `**【本轮定向修订 · 待批准】**` 的定义行 | **16** |
| 其中 `CCFG-AC-089` 的标记类型 | 仍为 `**【本轮新增 · 待批准】**`（R0 新增用例，R1 再次补充内容） |
| R0/R1 合计涉及的**去重**验收集合 | **17** |

当前带 `**【本轮定向修订 · 待批准】**` 标记的 **16** 条为：

```text
CCFG-AC-002/009/016/017/018/019/020/021/022/023/025/026/032/082/087/088
```

`CCFG-AC-089`：R0 中为**新增**用例（带 `**【本轮新增 · 待批准】**`），
R1 对其**内容再次补充**，但其标记**仍为** `**【本轮新增 · 待批准】**`，
未改为“定向修订”。

17 条去重集合 = 上述 16 条 + `CCFG-AC-089`：

```text
CCFG-AC-002/009/016/017/018/019/020/021/022/023/025/026/032/082/087/088/089
```

#### 3.2.3 R2 权威纠正口径

```text
R0/R1 合计涉及的去重验收集合 = 17 条
其中带“本轮定向修订”标记 = 16 条
其中仍带“本轮新增”标记但在 R1 再次修改 = CCFG-AC-089（1 条）
```

另外，相对 R0 提交 `fba09d17...`，**R1 实际修改的验收定义行为 11 条**：

```text
CCFG-AC-002/016/017/018/020/021/025/082/087/088/089
```

即：17 条去重集合中，R1 相对 R0 实际修改的 11 条可分解为三部分：

- **R0 已实际修改、R1 再次修改 = 6 条**：
  `CCFG-AC-002/016/017/018/021/025`
  （即 R0 实际修改的 12 条与 R1 实际修改的 11 条的交集）；
- **R0 新增、R1 再次修改 = 3 条**：`CCFG-AC-082/087/088`
  （标记由“本轮新增”转为“本轮定向修订”）；
- **R1 首次成为修改对象 = 2 条**：`CCFG-AC-020/089`
  （`089` 标记仍为“本轮新增”）。

`6 + 3 + 2 = 11` 条，与上方 R1 实际修改集合一致。

### 3.3 错误三：R1 提交的完整文件统计

#### 3.3.1 R1 报告的原表述问题

R1 报告 §8 的“实际变更”统计**只列了 6 个既有文件**，
并以“（`git diff --numstat`，新增报告另行提交）”的措辞带过，
未把**同一结果提交中新增的 R1 报告本身**纳入完整清单。

#### 3.3.2 远程 Git 核验事实

经远程 Git 核验，R1 提交
`2c2b2a71fcd049a68f86339d225f659af69e81c3` 的完整 `git diff --numstat` 为：

```text
50	0	docs/baseline/list-table-visual-template/MIGRATION.md
40	27	docs/features/client-config/ACCEPTANCE.md
19	16	docs/features/client-config/DESIGN.md
24	21	docs/features/client-config/README.md
23	26	docs/features/client-config/REQUIREMENTS.md
43	25	docs/features/client-config/UI.md
336	0	docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1.md
```

`git show --name-status` 同为 7 项：6 个 `M`（修改）+ 1 个 `A`（新增 R1 报告）。

```text
r1_actual_changed_file_count=7
```

#### 3.3.3 R2 权威纠正口径

R1 实际变更文件总数为 **7**。
**不得**把“报告另行提交”或类似说法用于遗漏**同一结果提交中**的新增报告。

---

## 4. 取代关系与历史保护

| 项 | 说明 |
|---|---|
| R2 报告取代范围 | 本报告 §3.1 / §3.2 / §3.3 在**上述三项证据口径**上**取代** R1 报告 §2.3、§5、§8、§9.5 的对应表述 |
| R1 报告是否被修改 | **未修改**（R1 报告文件保持提交时原文；其 Git 历史未被改写） |
| R1 报告是否仍可用 | 仍为 R1 阶段的真实执行记录；其中已正确的核心结论（§3 四层状态、§4 两项决定、§6 授权分层、§7 模板修正记录）继续有效，**不**被本报告取代 |
| R0 报告是否被修改 | **未修改**（R0 报告保持原样） |
| 业务规则是否变化 | **无**（`business_baseline_change_status=NONE`） |
| 需求、验收、设计、UI、模板正文 | **均未修改** |
| 同一口径的旁证说明 | `ACCEPTANCE.md` §1.4 的说明文字使用“与 §4 中带 `【本轮定向修订 · 待批准】` 标记的各行逐一对应”的措辞，应按本报告 §3.2 的口径理解为“**去重集合一致**”而非“**标记类型一致**”；本报告为该证据口径的权威更正，**未**修改 `ACCEPTANCE.md` 正文 |

---

## 5. R1 提交的完整文件清单与 numstat（远程 Git 核验）

```text
r1_result_commit=2c2b2a71fcd049a68f86339d225f659af69e81c3
r1_base_commit=fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1
r1_changed_file_count=7
```

| # | 状态 | numstat(+/-) | 文件 |
|---|---|---|---|
| 1 | M | 50 / 0 | `docs/baseline/list-table-visual-template/MIGRATION.md` |
| 2 | M | 40 / 27 | `docs/features/client-config/ACCEPTANCE.md` |
| 3 | M | 19 / 16 | `docs/features/client-config/DESIGN.md` |
| 4 | M | 24 / 21 | `docs/features/client-config/README.md` |
| 5 | M | 23 / 26 | `docs/features/client-config/REQUIREMENTS.md` |
| 6 | M | 43 / 25 | `docs/features/client-config/UI.md` |
| 7 | A | 336 / 0 | `docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1.md` |

合计：`+535 / -115`，7 个文件。

---

## 6. R2 自身唯一新增文件的白名单核验

**本任务唯一允许新增**：

```text
docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R2.md
```

核验结果（`git status --short`）：

```text
 M .claude/settings.local.json
?? docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R2.md
?? docs/prompts/
```

```text
本任务新增项 = 仅上述 R2 报告 1 个文件（?? 未跟踪）
git diff --name-only / --numstat = 仅 .claude/settings.local.json（148 / 1）
  —— 任务开始前已存在的既有修改，非本任务范围，不修改、不覆盖、不暂存、不提交
本任务对**已跟踪文件**的修改 = 无
git diff --cached --name-only = （空，提交前未暂存任何文件）
```

未触发 `BLOCKED_SCOPE_EXPANSION_REQUIRED`（无需修改任何其他文件即可完成任务）。

---

## 7. 当前基线统计与状态（保持不变）

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

独立复核结论：

- `CCFG-REQ-001~103`（103 条）、`CCFG-AC-001~089`（89 条）、
  `CCFG-DESIGN-001~046`（46 条）、`CCFG-UI-001~035`（35 条）均连续、唯一；
- 当前 `ACCEPTANCE.md` 的 89 条定义行状态列**全部**为 `NOT_RUN`；
- 需求→验收覆盖仍为 `103/103`；
- 本 R2 任务**未**新增、删除或重排任何编号。

---

## 8. 两项项目负责人决定（保持不变）

1. **行选择能力整体取消**：取消“删除所选”后，
   行单选、选中行高亮与“已选择：{探针ID}”**全部取消**
   （无选中态、无选中事件、无已选行集合、无“当前选中行”概念、无选中视觉、无等价已选文本）；
   删除/启停一律由该行“更多”下拉发起，**不**依赖行选中；
   行双击编辑与探针 ID 键盘编辑**保留**。
2. **历史异常 `FG_ACTIVE` 展示冻结**：紧跟探针 ID 显示**红色 `异常：{原始值}`**
   （`{原始值}` 按既有数据契约原样展示）；
   `FG_ACTIVE='1'` 无状态标记、下拉 `停用`；
   `FG_ACTIVE='0'` 显示与数据源管理一致的“停用”标记、下拉 `启用`；
   历史异常值下拉**仅** `停用`。

本报告**未**重新解释、扩展或弱化上述两项决定。

---

## 9. 未执行事项（明确记录）

本任务**未执行**且**不得**据本报告推断已完成：

- 未修改任何基线正文、模板、API、数据库文档或历史报告；
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

## 10. `docs/prompts/**` 完整性

任务开始前对 `docs/prompts` 下全部 **41** 个文件做 `sha256sum` 记录；
任务完成后重新计算并比对：

```text
docs_prompts_integrity=UNCHANGED
```

`docs/prompts/**` 全程不修改、不暂存、不提交、不删除。

---

## 11. 下一入口

```text
next_entry=CHATGPT_REMOTE_BASELINE_R2_REVIEW
```

三项证据纠错完成后，仍只进入 **ChatGPT 从远程 Git 对 R2 结果提交的独立复审**，
**不是**直接进入实现，也**不**代表本轮基线已批准、页面已实现或验收已通过。
在复审与项目负责人批准完成前，不得实施页面、不得执行正式验收、不得迁移任何页面。
