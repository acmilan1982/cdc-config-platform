# 列表表格视觉模板参照修正草案 R2 标记口径纠错 · 执行报告

## 1. 任务身份与停点

```text
task_code=LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R2
task_type=DOCS_ONLY_TARGETED_MARKER_SEMANTICS_CORRECTION
branch=develop
base_commit_id=e4c16df7459440b5a9390830c06f0525a934f9b4
```

- 类型：**纯文档定向纠错**。本轮**只**修正 `LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R1`
  远程文档复审（`CHANGES_REQUIRED`）指出的「**已落地实现事实仍被标为候选未实现**」冲突。
- **不**实施新样式、**不**批准 `SHARED_COMPONENT_DESIGN.md` §13 新可选契约、**不**改任何代码 / 测试 / 共享 CSS。
- 纠错完成后停在 `CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R2_REVIEW`；
  **不**自行宣布 R2 复审通过、草案已批准或模板级迁移获授权。

## 2. 门禁与基准（开工前）

- 当前分支 `develop`；本地 HEAD 与 `origin/develop`、远程 `refs/heads/develop` 三方均为
  `e4c16df7459440b5a9390830c06f0525a934f9b4`；`git rev-list --left-right --count origin/develop...HEAD` = `0 0`（无分叉）。
- 开工前已存在的无关工作区更改（**未**暂存、**未**提交、**未**覆盖）：`.claude/settings.local.json`（`M`）、
  `docs/prompts/`（`??`）、`runtime-logs/`（`??`）。
- 只读核对的真实代码（**未修改**）：
  - `frontend/src/styles/list-table/list-table-visual.css` —— 仅含受 `.lt-main-table` 限定的
    `td.el-table__cell.lt-row-action__cell` 与 `.lt-row-action__ellipsis`（含 `:hover`、`:focus-visible`）两条 opt-in 规则；
    **无**任何禁用态视觉规则；
  - `frontend/src/styles/list-table/list-table-visual.spec.ts` —— 断言 #2（令牌恰好 `9` 个）、
    #3（默认值逐一对齐）、#6（每条 `:deep(` 由 `.lt-main-table` 限定）、#11（先剔除根类再断言辅助类集合，两元素 /
    三元素允许集）；
  - `frontend/src/views/client-config/ClientConfigPage.vue` —— 唯一显式挂载 `lt-row-action__cell`／
    `lt-row-action__ellipsis` 的页面（#13 成立）。

## 3. R2 只修正的冲突：标记语义

`README.md` §7.3 明定「**已采纳并已落地**的实现事实**必须**使用**参考事实标记**，**不得**再被笼统归入候选未实现」，
且阅读约定写明「凡描述当前**真实源码、已批准选择结果与已落地实现事实**的内容必须标注参考事实标记」。
但同一 README §8 与 `SHARED_COMPONENT_DESIGN.md` §12 因**代码尚待远程复审**，继续给**已落地的实现事实**
使用 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`——**内部矛盾**。
`IMPLEMENTED_PENDING_CHATGPT_REVIEW` 只描述**复审进度**，**不**等于 `NOT_IMPLEMENTED`。

R2 **只**做以下最小且完整的标记语义纠正：

1. **已落地／已批准事实 → 参考事实标记**：`SHARED_COMPONENT_DESIGN.md` §12 中描述**现行源码事实与已批准设计取值**
   的内容（已落地 CSS 规则、显式 opt-in 挂载、现行测试断言 #11、令牌数 `9`、辅助类数 `2`）统一改标
   `LIST_TABLE_REFERENCE_FACT`；`README.md` §7.1 的定义与 §7.3 的阅读约定**对齐**（已批准选择结果 /
   已落地实现事实同属参考事实标记）；`README.md` §8 的已落地事实说明一并改标。
2. **未实现／待批准内容拆为独立句段并保留候选标记**：`SHARED_COMPONENT_DESIGN.md` §12.1 的**禁用态视觉规则**
   （现行 CSS 尚无该规则）与 §13 的**待批准**分层契约保留 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`；§12.1 明记该禁用态
   视觉属**设计契约、尚未实现、尚未验收**，`CCFG-AC-157` 仍 `BLOCKED`；**是否 / 何时禁用由 Feature 决定**，
   公共层仅在可观察且显式 opt-in 时负责通用视觉呈现。
3. **删除错误推导**：删除 `README.md` §8 与 `SHARED_COMPONENT_DESIGN.md` 中
   「因为待复审所以仍按候选未实现标记引用」的推导，改为「复审状态 ≠ 尚未实现」的准确口径。

## 4. 逐文件改动与旧 → 新位置

实际改动 **3** 个既有文件 + **1** 个新建报告；`DESIGN.md`、`UI.md` **未**改动（在允许范围内、非必需）。

### 4.1 `README.md`

| 位置 | 旧表述性质 | 新表述 | 证据 |
| --- | --- | --- | --- |
| §7.1 | 定义窄化为「参考实现事实（基准提交源码）」 | 定义扩展为**当前真实源码可验证事实**（参考实现事实 + 已批准选择结果 + 已落地实现事实），与 §7.3 阅读约定对齐 | §7.3 阅读约定原文 |
| §7.3 | 仅列 `DESIGN.md` §8 的已落地事实 | 补列 `SHARED_COMPONENT_DESIGN.md` §12 已落地 opt-in 事实；加「**代码复审状态 ≠ 尚未实现**」句 | §12 现行代码核对 |
| §7.4 计数表 / 口径段 | 末列为整理后 `27 / 0 / 42 / 8` | 新增「**R2 纠正后**」列 `28 / 0 / 42 / 8`，并写明来源（§8 已落地事实改标，参考事实 `+1`） | 逐文件复算 |
| §7.4 计数通道段 | 「§12 按 §7.3 携带候选未实现标记（通道 3）」 | 改为「§12 **已落地／已批准事实**标注参考事实标记、**未实现／待批准**标注候选未实现标记」，并给出两条独立通道核验命令 | §12／§13 现文 |
| §8 导航表 `SHARED_COMPONENT_DESIGN.md` 行 | 「因尚未复审通过仍以候选未实现标记引用」 | 改为「**代码复审状态** `IMPLEMENTED_PENDING_CHATGPT_REVIEW`；其**已落地的现行事实**按 §7.3 标注**参考事实标记**（**不**因待复审而标为候选未实现）」 | §7.3 |
| §8 第七轮可选扩展段 | 「故它仍按 §7.3 候选未实现标记引用」 | 已落地事实加 `LIST_TABLE_REFERENCE_FACT` 标注；复审状态单列，删除候选标记引用推导 | §7.3 |
| §11 变更记录 | 第七轮可选扩展**设计基线批准收口**条目以「仍以候选未实现标记引用」结论收尾 | 该条**标明为当时时点记录**并注明其推导已由本 R2 推翻；新增 2026-09-29 **R2 标记口径纠正**条目 | 本报告 |

### 4.2 `SHARED_COMPONENT_DESIGN.md`

| 位置 | 旧表述性质 | 新表述 | 证据 |
| --- | --- | --- | --- |
| §0.1「标记例外」段 | 「§12 按 §7.3 携带候选未实现标记」 | 改为「§12 **已落地／已批准事实**统一标注参考事实标记；**未实现**禁用态视觉与**待批准** §13 契约标注候选未实现标记」；加「复审状态 ≠ `NOT_IMPLEMENTED`」 | `README.md` §7.3 |
| §0.1 opt-in 实现段 | 无标记 | 加 `LIST_TABLE_REFERENCE_FACT` 前缀（令牌 `9`、辅助类 `2` 等现行事实） | 源码核对 |
| §0.1 新增 R2 段 | —（新增） | 记录 R2 只做标记语义纠正及边界 | 本报告 |
| §11.1 例外 / §12·§13 整理段 | 「§12 按 §7.3 携带候选未实现标记」 | 改为参考事实标记 + 候选未实现标记分工；批准态计数仍 `79` 不变 | §12／§13 现文 |
| §12 节导语 | 「故本节规则仍按候选未实现标记引用」 | 改为参考事实标记；设计基线批准与**代码复审状态**分列，删除候选标记引用推导 | `list-table-visual.css`／`.spec.ts` |
| §12.1 | 整段以候选未实现标记覆盖（含已实现的提炼内容与未实现的禁用态视觉） | **拆分**：已实现提炼内容 → 参考事实标记；**禁用态视觉单列独立段**并保留候选未实现标记（设计契约、尚未实现、尚未验收；`CCFG-AC-157` 仍 `BLOCKED`） | CSS 无禁用态规则 |
| §12.2（4 段）、§12.3（4 段）、§12.4（2 段）、§12.5（1 段）、§12.7（1 段） | 均标候选未实现标记 | 改标参考事实标记（已落地／已批准事实） | 源码与断言核对 |
| §12.8「为何仍用候选未实现标记」段 | 「因待远程复审故暂不改判为参考事实标记」 | 标题改为「R2 标记纠正后收敛」；通道由三条扩为**四条**；明确标注 R1 及更早该结论**由 R2 依据 §7.3 纠正** | §7.3 |
| §12.8 两条历史复测段 | 复述过期现值 `23` 的「暂不改判」推导 | 段落**标注为历史时点口径**、注明其结论已由 R2 纠正；新增 R2 复测段 | 逐文件复算 |
| §13 | 保持候选未实现标记（草案） | **不变**（仍 `DRAFT_PENDING_USER_REVIEW`） | — |

### 4.3 `MIGRATION.md`

- 追加「模板整理任务 **R2 标记口径纠正**追加记录」：记录三项纠错、四通道计数、errata／override 口径、
  R0／R1 入口已成历史入口、以及「提交与推送成功 ≠ 远程复审通过」边界。

### 4.4 新建报告

- 本文件 `reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R2.md`。

## 5. 标记计数（逐文件复算，非硬编码）

**通道 1：四份规范文档**（`README.md`／`DESIGN.md`／`UI.md`／`MIGRATION.md`，**不**扫描本文件）

| 文件 | `REFERENCE_FACT` | `TEMPLATE_APPROVED` | `PROPOSED_NOT_IMPLEMENTED` |
| --- | --- | --- | --- |
| `README.md` | 7 | 16 | 5 |
| `DESIGN.md` | 5 | 14 | 1 |
| `UI.md` | 12 | 8 | 0 |
| `MIGRATION.md` | 4 | 4 | 2 |
| **合计** | **28** | **42** | **8** |

- R1 时点为 `27 / 0 / 42 / 8`（顺序：参考事实 / 草案态 / 已批准规则 / 候选未实现）；
  **R2 后为 `28 / 0 / 42 / 8`**——参考事实 `+1`（`README.md` §8 已落地事实由候选未实现标记改标参考事实标记），
  已批准规则 `42`、候选未实现 `8`、草案态 `0` **均不变**。

**通道 2：本文件批准态设计标记**（`LIST_TABLE_SHARED_DESIGN_APPROVED`）
—— **`79`**（**不变**；R2 未新增／删除任何批准态设计标记实例）。

**通道 3：本文件参考事实标记**（`LIST_TABLE_REFERENCE_FACT`，R2 新增独立通道）—— **`24`**。
分布：§12 节内 `16` 处（节导语 + §12.1×2 + §12.2×4 + §12.3×4 + §12.4×2 + §12.5×1 + §12.7×1），
其余 `8` 处为 §0.1／§11.2／§11.3／§12.8 的说明文字与核验命令。

**通道 4：本文件候选未实现标记**（`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`）—— **`10`**
（R1 时点 `23`，下降 `13`）。分布：§12.1 **禁用态视觉** `1`、§13 内 `2`、
其余 `7` 处为 §0.1／§11.2／§11.3／§12.8 的说明文字与核验命令
（其中含 R2 纠正段对旧标记的**引用**）。

各通道**严格不混算**。候选盘点不变量 `el_table_usage_count=15` / `el_table_file_count=14` **不变**。

**可复现核验命令**（在仓库根执行）：

```bash
docs=docs/baseline/list-table-visual-template

# 通道 1：四份规范文档（不扫描本文件）
for m in LIST_TABLE_REFERENCE_FACT LIST_TABLE_TEMPLATE_APPROVED LIST_TABLE_PROPOSED_NOT_IMPLEMENTED; do
  printf "%-38s %s\n" "$m" "$(grep -ohF "$m" "$docs"/{README,DESIGN,UI,MIGRATION}.md | wc -l)"
done
# 期望 28 / 42 / 8

# 通道 2：本文件批准态设计标记（拼接构字避免自计）
approved_marker="LIST_TABLE_SHARED_DESIGN_""APPROVED"
grep -ohF "$approved_marker" "$docs/SHARED_COMPONENT_DESIGN.md" | wc -l   # 期望 79

# 通道 3：本文件参考事实标记
ref_marker="LIST_TABLE_REFERENCE_""FACT"
grep -ohF "$ref_marker" "$docs/SHARED_COMPONENT_DESIGN.md" | wc -l      # 期望 24

# 通道 4：本文件候选未实现标记
cand_marker="LIST_TABLE_PROPOSED_""NOT_IMPLEMENTED"
grep -ohF "$cand_marker" "$docs/SHARED_COMPONENT_DESIGN.md" | wc -l     # 期望 10

# 草案态规则标记在四份规范正文中应清零
draft_marker="LIST_TABLE_TEMPLATE_""DRAFT"
grep -ohF "$draft_marker" "$docs"/{README,DESIGN,UI,MIGRATION}.md | wc -l   # 期望 0
```

## 6. errata / override（对 R0／R1 关于现行候选标记结论的纠正）

- R1 报告与 `SHARED_COMPONENT_DESIGN.md` §12.8、`README.md` §11 中**「因远程实现复审未完成，故已落地的
  opt-in 事实仍以候选未实现标记引用」**的结论**失效**。自 R2 起，现行事实以 `README.md` §7.3 为准：
  **已落地实现事实 → 参考事实标记**；**代码复审状态（`IMPLEMENTED_PENDING_CHATGPT_REVIEW`）≠ 尚未实现**。
- R0／R1 报告**原样保留、不回写**；本报告以 **errata／override** 方式承接，并说明历史时点值（四份文档
  `27 / 0 / 42 / 8`、本文件候选未实现 `23`）为**当时实测**，与 R2 现行值（`28 / 0 / 42 / 8` / `10`）**区分**。
- 本轮**只**修正该「标记冲突」一类问题；R1 已修正的另外两类（禁用态两级职责、§13.5／`DESIGN.md` §7 拟议时序）
  **维持 R1 结论**，本轮不重复改动。

## 7. 状态分层（草拟 / 已批准 / 已实现 / 待验收）

| 事项 | 状态 | 本轮是否改变 |
| --- | --- | --- |
| 本模板基线内容 | `APPROVED` / `BASELINE_APPROVED` | 否 |
| 公共实现详细设计 | `APPROVED` | 否 |
| 公共实现 + 数据源参考页接入 | `IMPLEMENTED_ACCEPTED` / `ACCEPTED_BY_PROJECT_OWNER` | 否 |
| 第七轮 §12 opt-in 设计基线 | 项目负责人 2026-09-29 批准 | 否 |
| 第七轮 §12 opt-in **代码实现** | `IMPLEMENTED_PENDING_CHATGPT_REVIEW`（待远程复审） | 否（仅改标记口径） |
| §12.1 **禁用态视觉规则** | 设计契约、**尚未实现、尚未验收**（`CCFG-AC-157` 仍 `BLOCKED`） | 否 |
| §13 分层契约 / 单行固定高亮可选契约 | `DRAFT_PENDING_USER_REVIEW`（**未**批准） | 否 |
| 模板级 `page_migration_status` / `page_migration_authorization_status` / `pilot_page_selection_status` | `NOT_STARTED` / `NOT_GRANTED` / `NOT_DECIDED` | 否 |

## 8. 未执行项与边界

- **未**运行测试 / 构建 / 浏览器验收，**未**启停服务，**未**访问 DB / ZooKeeper / Kafka（纯文档任务，验证矩阵 `NOT_APPLICABLE`）。
- **未**修改 `frontend/**`、`backend/**`、共享 CSS / 测试、`docs/features/**`、历史报告或证据、
  `docs/prompts/**`、项目级基线、配置；**未**实施数据源管理页「更多」→三点迁移；**未**改弹窗模板。
- 探针端第七轮 157 条验收统计（`PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15`）与 `CCFG-AC-155~157`
  状态（仍 `BLOCKED`）**未**改变。
- 提交与推送成功 **≠** 远程复审通过 **≠** 草案获批 **≠** 模板级迁移获授权。

## 9. 下一入口

```text
next_step=CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R2_REVIEW
```

- 模板级 `current_next_entry` 仍为
  `NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`（不变）。
- R1 入口 `..._R1_REVIEW`、R0 入口 `..._BASELINE_REVIEW` 均已因 `CHANGES_REQUIRED` 成为**历史**入口。

## 10. 机器可读摘要

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R2
branch=develop
base_commit_id=e4c16df7459440b5a9390830c06f0525a934f9b4
result_commit_id=(见提交记录)
env_check_status=SUCCESS
backend_build_status=NOT_APPLICABLE
frontend_build_status=NOT_APPLICABLE
database_write_status=NOT_REQUESTED
zookeeper_write_status=NOT_REQUESTED
push_status=(见最终结果)
changed_files=docs/baseline/list-table-visual-template/README.md,docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md,docs/baseline/list-table-visual-template/MIGRATION.md,docs/baseline/list-table-visual-template/reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R2.md
error=
AGENT_TASK_RESULT_END
```
