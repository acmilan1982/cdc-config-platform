# 列表表格视觉模板 · 探针端管理参照修正草案 · R1 定向纠错执行报告

```text
task_code=LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R1
task_type=DOCS_ONLY_DRAFT
branch=develop
base_commit_id=0b43a444ab002ea21c1fe7ad4884b241c950b317
draft_status=DRAFT_PENDING_USER_REVIEW
template_level_status_change=NONE
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
pilot_page_selection_status=NOT_DECIDED
current_next_entry=CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R1_REVIEW
historical_r0_entry=CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_REVIEW(CHANGES_REQUIRED)
```

本报告为**纯文档草案** R1 的执行记录。ChatGPT 从远程 Git 对 R0 提交
`0b43a444ab002ea21c1fe7ad4884b241c950b317` 的文档复审结论为 **`CHANGES_REQUIRED`**；
本 R1 **只**就地修正下列**三处**文档问题，保持第七轮已实现页面与原模板已批准基线的其他决定**不变**。
本报告对 R0 报告
`reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001.md` 作 **errata / override**（见 §6）。
本任务**未**修改任何代码 / 测试 / 共享 CSS / 页面 / Feature 文档 / 数据源管理页 / 共享模板，
**未**运行前后端测试、构建或浏览器验收，**未**启停服务，**未**访问数据库 / ZooKeeper / Kafka，
**未**改写 R0 或任何历史报告、证据目录、验收状态格。

---

## 1. 开工门禁与范围

| 项 | 实测 |
| --- | --- |
| 工作目录 | `/agent/cdc-config-platform`（有效 Git 仓库） |
| 分支 | `develop` |
| 本地 HEAD | `0b43a444ab002ea21c1fe7ad4884b241c950b317` |
| `origin/develop` | `0b43a444ab002ea21c1fe7ad4884b241c950b317` |
| 远程 `refs/heads/develop` | `0b43a444ab002ea21c1fe7ad4884b241c950b317`（`git ls-remote` 复核） |
| ahead / behind | `0 / 0`（无分叉） |
| 预期起始 SHA | `0b43a444ab002ea21c1fe7ad4884b241c950b317`（**一致**） |
| 任务前既有无关改动 | ` M .claude/settings.local.json`、`?? docs/prompts/`、`?? runtime-logs/`（**保持原样，不暂存**） |

结论：**门禁通过**。三方 SHA 一致、无分叉；未执行 reset / clean / stash / rebase / checkout / 强推。

**只读核对的代码现值**（不修改）：

```text
frontend/src/styles/list-table/list-table-visual.css      # 两条 opt-in 规则，仅受 .lt-main-table 限定
frontend/src/styles/list-table/list-table-visual.spec.ts  # 断言 #2/#3/#6/#11/#12/#13
frontend/src/styles/list-table/index.ts                   # LT_MAIN_TABLE_CLASS / LT_TABLE_VISUAL_TOKENS
frontend/src/views/client-config/ClientConfigPage.vue     # 显式 opt-in 接入
```

实测：`lt_token_count=9`（`LT_TABLE_VISUAL_TOKENS` 长度 `9`，`toHaveLength(9)`）；
`lt_internal_helper_class_count=2`（`.lt-row-action__cell`、`.lt-row-action__ellipsis`）。
现行 CSS **无**禁用态视觉规则（与 R1-02 的“实现/验收缺口”记载一致）。

允许修改范围：`README.md` / `DESIGN.md` / `UI.md` / `MIGRATION.md` / `SHARED_COMPONENT_DESIGN.md`
中与三处纠错**直接有关**的文本，以及本报告。**实际变更文件**见 §7。`UI.md` 本轮**未**改动
（三处纠错均不涉其现行规则文本）。

## 2. R1-01：移除现行规范中的实施前示例

### 2.1 核心改写：`SHARED_COMPONENT_DESIGN.md` §12.7

**旧**（正文标题与首段，实现前时点框架）：

```text
### 12.7 拟修订契约（R1 收敛、R2 修正 #11 根类计数，逐项可复审）
……本节把原「待复审问题清单」收敛为具体、可复审的拟修订契约……
下列「拟值」在扩展实现之前均非现值……本 R1／R2 及批准收口均不修改其值。
（末尾另加 > 2026-09-29 生效后现状（不重写上文 R1／R2 与批准收口历史） 更正注）
```

**新**：`### 12.7 现行可执行契约（已落地，逐项可复审）`，正文直接写**已落地后**的现行值：

- `(1)` §7.1 断言 #6 **现行口径**：全部 `:deep(...)` 均由 `.lt-main-table` 限定；
- `(2)` §7.1 断言 #11 **现行口径**：内部辅助类数量 **2**，`lt-` 类选择器只允许
  `{.lt-row-action__cell, .lt-row-action__ellipsis}`；**现行判定**为“先剔除根类再断言辅助类集合”；
- `(3)` §7.2 零泄漏覆盖；`(4)` §4.3 现行取值 `2`；`(5)` §4.4 现行计数 `9` / `2`；
- `(6)` 批准与生效（**历史摘要**，指向既有报告）；`(7)` 逐项闭合；`(8)` 文档/代码边界（现行）。

**#2 / #3 / #6 现行断言以代码核对（不臆造）**：

| 断言 | `list-table-visual.spec.ts` 现行实现 | 结论 |
| --- | --- | --- |
| #2 | `expect(LT_TABLE_VISUAL_TOKENS).toHaveLength(9)` 且与期望令牌名逐一相符 | 令牌恰好 `9` |
| #3 | 每个令牌以 `var(--lt-…, <默认值>)` 消费，回退值与 `EXPECTED_DEFAULTS` 逐一相等 | 默认值一一相符 |
| #6 | 每条 `:deep(` 规则选择器 `startsWith('.lt-main-table ')` | 由根类限定，无新增例外 |
| #11 | `allClasses.filter((n) => n !== ROOT_CLASS_SELECTOR).sort()` 等于两 helper 集合，并另断言含根类的三元素允许集合 | 先剔除根类，辅助类恰好 `2` |

### 2.2 旧 `0` / 未来值就地收敛（消除“正文旧例 + 尾部更正注”路径）

| # | 位置 | 旧 | 新 |
| --- | --- | --- | --- |
| a | SCD §4.3 表「内部辅助类命名规则」行 | 阶段一取值 = `0`（另附“2026-09-29 现行：opt-in 后为 2”尾部注） | **现行取值 = `2`**（`lt-row-action__cell`、`lt-row-action__ellipsis`；实现前阶段一为 `0`） |
| b | SCD §4.3 正文段 | “阶段一内部辅助类为 `0` 是一条可断言的事实 …”；另附“> 2026-09-29 现行值更正”注 | 直接述“基础纪律只需根类 + 令牌 + 3 条 `:deep`”；**现行** `lt_internal_helper_class_count = 2` |
| c | SCD §4.4 汇总计数块 | `lt_internal_helper_class_count=0`（另附现行值注） | `lt_internal_helper_class_count=2`（注释标明来自 §12 opt-in） |
| d | SCD §7.1 断言表 #11 | “内部辅助类数量为 0”（表后另附现行口径注） | **“内部辅助类数量为 2”** + 现行判定说明 |
| e | README §8 项目符号 | “**扩展代码尚未实现、尚未生效** … 拟实施时辅助类 `2` 为**未来值**” | “**扩展代码已实现、待远程复审**” + 现行 helper 类 `2` |
| f | README §8 尾部注 + “更新（opt-in 代码实现后）”段 | “R2 修正 … 未实现 …” + “上述‘尚未实现’为收口时点事实，逐字保留不改” | 合并为一条**历史与批准链摘要**（R0/R1 `CHANGES_REQUIRED` → R2 `APPROVED` → 负责人批准设计基线 → 实现落地） |

### 2.3 历史压缩为摘要 + 报告链接

- `SHARED_COMPONENT_DESIGN.md` §0.1：把“标记例外 / opt-in 代码实现后更新 / R1 定向纠错后标记范围 /
  设计基线批准收口”四段**压缩为两段**（① 标记例外范围；② R0／R1／R2 与批准链**一条摘要**）；
  保留“opt-in 代码实现”与“模板定向整理 / R1 定向纠错”的**现状**记录；
- `SHARED_COMPONENT_DESIGN.md` §12 导语：删除 R1／R2 两整段定向纠错叙述，改为**一条历史摘要**，
  细节指向本报告与既有历史报告；
- README §11 变更记录：保留全部历史条目（含 R0／R1／R2／批准收口／实现），新增 R1 条目；
  R0 条目的“下一入口”就地标注为**历史入口**（`CHANGES_REQUIRED`）。

**保留不改（非过期示例）**：§12.3 的**技术依据与推导**（`48 = 23 + 24 + 1`、`53 = 28 + 24 + 1`）、
§12.4 的**零泄漏论证**、§12.5 的**真实浏览器验证风险清单**、§12.6 的**现行接入事实 + 代码位置**、
§12.8 的**逐次实测记录**（含 `23` 的分位分解）、以及各仍准确的代码片段与 `/config/data-source`
「更多」**文字入口事实**——均按 R1 提示词要求**保留**。

### 2.4 检索核验（区分“历史记录”与“当前指导”）

```bash
grep -n "现行仍 *\`*0\|尚未生效\|拟修订\|已收窄\|未来值" \
  docs/baseline/list-table-visual-template/{README,DESIGN,UI,MIGRATION,SHARED_COMPONENT_DESIGN}.md
```

逐处判明时点/对象后，命中分为三类，**当前指导无自相矛盾**：

- **现行指导**：无残留“拟值 / 现行仍 0 / 未来值”表述；§12.7 与 §4.3/§4.4/§7.1 均为现行值；
- **历史/日期记录**（允许保留，标注时点）：README §11 变更记录（R0/R1/R2/收口/实现各条）、
  SCD §12.8 各“实测（2026-09-29，…）”、MIGRATION 追加记录、R0/R1/R2 历史报告；
- **术语定义**：README §7.2/§7.3 对“候选未实现标记”覆盖含义的定义（“尚未实现的候选”），非当前指导。

## 3. R1-02：禁用态职责分界

**问题**：SCD §12.1 把三点入口 `disabled` 的通用视觉列为公共层职责，而 R0 新增的 §13.2 契约表
却把“禁用态”整体交给 Feature，读者无法判断谁负责样式。

**修正**（写入一致的**两层规则**，SCD §12.1 与 §13.2 两处口径一致）：

- **是否禁用、何时禁用、权限与业务条件由 Feature 决定**；
- **当入口存在可观察的禁用状态、且页面显式启用这一可选样式时**，其在**通用视觉与可访问性**上
  如何呈现**由公共层负责**。

| 位置 | 旧 | 新 |
| --- | --- | --- |
| SCD §12.1（公共层提炼清单） | 清单含无条件的 `disabled` | 移除无条件项，改为上述**两层规则**；Feature 段补“是否/何时禁用属 Feature 决定的业务条件” |
| SCD §13.2（能力契约表·三点入口行） | “公共层负责…交互态外观” / “Feature 负责…**禁用态**…” | 公共层列补“可观察禁用态通用视觉呈现（现行 CSS 尚未提供）”；Feature 列“禁用态”→“**是否 / 何时禁用**” |
| SCD §13.2 表后新增段 | （无） | 明确两级规则不冲突，并据实记录现行 CSS **无**禁用视觉规则 |

**据实记录的缺口（不声称已实现、不声称已验收）**：

- 现行 `frontend/src/styles/list-table/list-table-visual.css` **尚未**提供禁用态视觉规则，
  故该禁用态视觉属**设计契约，尚未实现、尚未验收**；
- 现行探针端管理的被禁用者是**菜单项**（非三点触发器自身）；`CCFG-AC-157` 该子项仍缺实际观察，
  状态仍 **`BLOCKED`**，本 R1 **不**为其强造禁用情形、**不**改 CSS。

**跨文档一致性核对**：`DESIGN.md` §7 与 `UI.md` §5 将“权限与禁用规则”“权限、禁用与 Loading”
列为 **Feature 保留职责**——与两层规则**一致**（Feature 决定“禁用与否”），无需改动。

**未启用页零泄漏**：三点入口仍是**可选能力**；未启用页面 `lt-row-action__*` 计数 `0`、
零样式泄漏、无需三点入口（沿用 §3 作用域隔离，未变）。

## 4. R1-03：草案不得写成已生效

**问题**：SCD §13.5 称 `DESIGN.md` §7 的禁令“**已按**最小定向修订草案收窄”，
但 §13 与 `DESIGN.md` §7 的新可选单行固定高亮契约仍为 `DRAFT_PENDING_USER_REVIEW`。

| 位置 | 旧 | 新 |
| --- | --- | --- |
| SCD §13.5 第 1 项 | “该禁令范围**已按** … 最小定向修订草案**收窄**” | 拆为两条：**现行已批准规则**（业务语义与 hover/选中态不得未经评估就公共化的纪律仍有效）＋**拟议变更（待批准后生效）**（解耦的固定高亮视觉拟列为显式 opt-in；获批前现行禁令范围不变） |
| DESIGN.md §7 blockquote 结论行 | “故上列两行的禁令**范围收窄**为…” | “故**拟**将上列两行的禁令**范围收窄**为…；**批准后方才生效**，获批前**现行**禁令范围不变” |

**保留用户确认的方向（未改写）**：单行最多固定一行、再点取消、点他行转移、普通重载清选；
启停成功后按可见性重选仅为**页面选择后的可选行为**；**不**假设所有表有 `FG_ACTIVE`；
**不**把业务选择 ID 存到 URL / 存储 / 接口 / 数据库；视觉候选色 `#f4f4f5 / #e1e4e8 / #18181b`
仍为**待批准的可选预设建议**。探针页实现与既有负责人目测事实**未**改写。

**其他“已收窄 / 现行已新增”措辞审视**：`grep` 后同类命中仅上述两处；SCD §12.8 历史实测段内
“已按本节 (1)(2)(4)(5) 的拟修订文本”改为“**既定文本**”（该段为历史记录，仅最小用词修正）。

## 5. 状态分层（草案 / 已批准 / 已实现 / 待验收）

| 对象 | 状态 | 依据 |
| --- | --- | --- |
| 模板基线内容（四份规范文档） | `document_status=APPROVED` / `design_status=BASELINE_APPROVED` | 2026-09-21 批准 |
| 公共实现详细设计（SCD） | `shared_implementation_design_status=APPROVED` | 2026-09-21 批准 |
| 第七轮三点 opt-in 扩展·**设计基线** | `APPROVED_BY_PROJECT_OWNER`（2026-09-29） | R2 `59617b4…` 远程 `APPROVED` 后负责人批准 |
| 第七轮三点 opt-in 扩展·**代码实现** | `IMPLEMENTED_PENDING_CHATGPT_REVIEW` | `...-IMPLEMENTATION-001` 已落地，**待远程复审** |
| 第七轮三点 opt-in 扩展·**禁用态视觉** | **设计契约，尚未实现、尚未验收**（实现/验收缺口） | 现行 CSS 无禁用视觉规则；`CCFG-AC-157` 仍 `BLOCKED` |
| 本 R1 新增/修订的 §13 分层契约（单行固定高亮可选契约等） | **`DRAFT_PENDING_USER_REVIEW`** | 尚待远程复审 + 负责人批准 |
| 模板级页面迁移 | `page_migration_status=NOT_STARTED` / `authorization=NOT_GRANTED` / `pilot=NOT_DECIDED` | **未**翻转 |
| 第七轮 Feature 正式验收统计 | `PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15 = 157`；`CCFG-AC-155~157 BLOCKED` | **未**变更 |

**不得**把 R1 结果写成“已批准 / 已实现 / 整体已验收”：三处纠错**只**改文档表述与现状记载；
`§13` 新增可选契约仍 `DRAFT_PENDING_USER_REVIEW`，第七轮扩展实现仍待远程复审。

## 6. 对 R0 报告的 errata / override

R0 报告**原样保留、不回写**。本 R1 对其结论作如下**更正/覆盖**：

| 项 | R0 结论 | R1 errata / override |
| --- | --- | --- |
| R0 §3 表 #13/#14/#15 | 用“**更正注**”（保留阶段一 `0`，尾部追加现行值注）处理 §4.3/§4.4/§7.1 | R1 **改判为就地收敛**：正文直接写现行值 `2`，消除“旧例 + 尾注”双路径（§2.2 表 a–d） |
| R0 §3 表 #16 | §12.7「拟修订契约」**加“生效后现状”注**（保留 R1/R2 历史） | R1 **改判为就地改写**：正文标题与内容改为**现行可执行契约**，R1/R2 历史压缩为摘要、指向既有报告（§2.1） |
| R0 §3 表 #12 | §12.6 两段草案示例改写为「现行接入事实 + 代码位置」 | R1 **承接**：§12.6 保留现状；§12.7 的**遗留**“拟修订契约”示例由 R1 补齐处理 |
| R0 报告总述“17 项过期示例已清理” | 全局性结论 | **过宽**：R0 对 §12.7 及 §4.3/§4.4/§7.1 采用“更正注”而非就地清理；R1 就此**override**，明确 §12.7 等遗留示例由 **R1 承接**（不回写 R0） |

## 7. 文件逐项差异与 Git 边界

| 文件 | 变更性质 |
| --- | --- |
| `SHARED_COMPONENT_DESIGN.md` | §0.1（历史压缩）、§4.3、§4.4、§7.1、§11.1、§12 导语、§12.1、§12.2、§12.3、§12.4、§12.5、§12.7（核心改写）、§12.8（补 R1 复测段）、§13.2（禁用态行 + 新增段）、§13.5 |
| `README.md` | §7.4（一处陈旧计数引用更正）、§8（现行事实改写 + 历史摘要）、§11（新增 R1 条目；R0 条目下一入口标注为历史） |
| `DESIGN.md` | §7 blockquote 结论行（改为拟议、待批准后生效） |
| `MIGRATION.md` | 追加“R1 定向纠错追加记录”章节；边界段入口更新为 R1 复审入口 |
| `UI.md` | **未改动** |
| `reports/...-BASELINE-001-R1.md` | **新建**（本报告） |

**Git 边界**：`git diff --check` 通过（无空白/冲突标记错误）；`git status --short` 仅含
` M .claude/settings.local.json`、`?? docs/prompts/`、`?? runtime-logs/`（任务前既有，**保持原样**）
与本任务白名单文件。**未**改动：R0/历史报告、历史证据、Feature 文档、验收状态格、
`frontend/**`（含 CSS/测试/页面）、数据源管理页、共享弹窗模板、`CLAUDE.md`、`.claude/**`、配置。

## 8. 标记三通道计数与令牌 / helper 实测

命令拼接构造字面量，避免核验命令自身被计入。

```bash
core_docs=(docs/baseline/list-table-visual-template/README.md \
           docs/baseline/list-table-visual-template/DESIGN.md \
           docs/baseline/list-table-visual-template/UI.md \
           docs/baseline/list-table-visual-template/MIGRATION.md)
for m in LIST_TABLE_REFERENCE_FACT LIST_TABLE_TEMPLATE_APPROVED LIST_TABLE_PROPOSED_NOT_IMPLEMENTED; do
  printf "%-38s %s\n" "$m" "$(grep -ohF "$m" "${core_docs[@]}" | wc -l)"
done
draft_marker="LIST_TABLE_TEMPLATE_""DRAFT"
grep -ohF "$draft_marker" "${core_docs[@]}" | wc -l
approved_marker="LIST_TABLE_SHARED_DESIGN_""APPROVED"
grep -ohF "$approved_marker" docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md | wc -l
cand_marker="LIST_TABLE_PROPOSED_""NOT_IMPLEMENTED"
grep -ohF "$cand_marker" docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md | wc -l
```

| 通道 | 定义域 | R0 后 | R1 后 | 变化 |
| --- | --- | --- | --- | --- |
| 通道 1（`REFERENCE_FACT / DRAFT / APPROVED / PROPOSED`） | 四份规范文档 | `27 / 0 / 42 / 8` | `27 / 0 / 42 / 8` | **不变** |
| 通道 2（`SHARED_DESIGN_APPROVED`） | `SHARED_COMPONENT_DESIGN.md` | `79` | `79` | **不变** |
| 通道 3（候选未实现标记） | `SHARED_COMPONENT_DESIGN.md` | `23` | `23` | **不变** |

通道 3 分位分解（R1 后）：**§12 节内 `18` 处、§13 节内 `2` 处、其它说明（§0.1 ×1、§11.3 ×2）`3` 处**。
R1 **未**新增／删除／搬移任何标记实例，**未**为维持旧数字在无关处补标记。

**令牌 / helper 实测**（代码现值，只读）：

```text
lt_token_count=9
lt_internal_helper_class_count=2            # .lt-row-action__cell, .lt-row-action__ellipsis
```

**模板级状态**：`page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、
`pilot_page_selection_status=NOT_DECIDED` **均未**静默翻转；`/config/data-source` 未来三点改造
仍属**独立任务**。第七轮总统计维持 `PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15 = 157`。

## 9. 未执行项与风险

- **未**运行前后端测试 / 构建、**未**做浏览器验收、**未**启停服务、**未**访问数据库 / ZooKeeper / Kafka、
  **未**执行任何正式验收（本任务纯文档）；
- R1 结果仍为**待远程复审、待项目负责人批准的草案**；远程 R1 文档复审通过**后仍须**负责人批准草案；
- 本任务**不**启动弹窗模板任务；**不**改探针页实现与既有负责人目测事实。

## 10. 下一入口

```text
current_next_entry=CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R1_REVIEW
historical_r0_entry=CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_REVIEW(CHANGES_REQUIRED)
template_level_current_next_entry=NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED
```
