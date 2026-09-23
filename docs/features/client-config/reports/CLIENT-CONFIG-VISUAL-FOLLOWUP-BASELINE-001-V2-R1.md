# 探针端管理主列表视觉调整（第二轮 V2）草案 · R1 纠错执行报告

- 任务编号：`CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1`
- 任务性质：**纯文档 R1 纠错任务**（只改文档，不修改业务代码，不做测试/构建/浏览器操作/正式验收，未启停任何服务）
- 目标 Feature：`client-config`（探针端管理，路由 `/config/client`）
- 任务提示词：`docs/prompts/client-config/CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1-Agent-Prompt.md`（**未**写入 `docs/prompts/**`，**未**提交）
- 被复审对象：`CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2` 草案提交 `328a7ac56fabb3f3ef5ff5f087537a8d828df84b`
- ChatGPT 远程复审结论：`CHANGES_REQUIRED`（仅须修正三处文档问题；五项已确定产品决策**不**重新设计）
- 本报告时点：2026-09-23

---

## 1. 起始 Git 现场与工作区分类

| 项目 | 值 |
|---|---|
| 仓库 | `/agent/cdc-config-platform` |
| 当前分支 | `develop` |
| 任务开始前 HEAD（base commit） | `328a7ac56fabb3f3ef5ff5f087537a8d828df84b` |
| 起始时远程 `origin/develop` | `328a7ac56fabb3f3ef5ff5f087537a8d828df84b`（与本地 HEAD 一致，**未**分叉） |
| 起始 `git status --short` | ` M .claude/settings.local.json`；`?? docs/prompts/`（`docs/prompts/` 为未跟踪目录） |

工作区分类：

- **本任务授权范围内的待改文件**（任务开始前均为 `git` 跟踪的未修改文件）：`docs/features/client-config/README.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`UI.md`，以及本任务新建的 `docs/features/client-config/reports/CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1.md`。
- **任务开始前已存在的无关修改（保持原样，不修改、不暂存、不提交）**：`.claude/settings.local.json`（`M`）与未跟踪目录 `docs/prompts/`。二者均不在本任务白名单内，本任务**未**触碰。
- **按仓库惯例予以保留、不回溯改写的既有报告**：`docs/features/client-config/reports/CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2.md`（V2 报告）**未修改**；其两处越界结论按 R1-01 在**本报告 §4 追加明确勘误**并标明原结论已失效，原报告错误**不**被隐匿。
- 未执行任何 `reset`/`clean`/`stash`/`merge`/`rebase`/`checkout`/`pull`/`fetch`。

---

## 2. 资料读取

按 `CLAUDE.md` §3 完整读取并核对：

- `docs/baseline/` 六份项目级基线（`PROJECT.md`/`ENVIRONMENT.md`/`ARCHITECTURE.md`/`DEVELOPMENT_RULES.md`/`PROJECT_STATUS.md`/`DOMAIN_GLOSSARY.md`）与 `FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`。
- `docs/features/client-config/` 现行文档（`README.md`/`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md`/`API.md`/`DATABASE.md`）与 V2 报告。
- 两套模板基线 `docs/baseline/query-list-page-template/**` 与 `docs/baseline/list-table-visual-template/**`（只读，模板级全局状态保持 `NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）。

---

## 3. 三处问题：原位置、纠正后当前口径、真实修改

### 3.1 R1-01 行级歧义警示不得改为中性色

**问题原位置（越界结论）**

1. V2 报告 `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2.md` §3 五项调整锚点表第 4 行（第 60 行末句）：`现状红色行级提示标识需改为中性色（行级提示语义不变）`。
2. V2 报告 §4 冲突与定向修订处理表 `CCFG-UI-013` 行（第 75 行）：`现状红色标识需改中性色，语义不变`。
3. 当前 Feature 定义行同义越界表述：`DESIGN.md` `CCFG-DESIGN-050` 定义行末句原文 `红色异常**不**因整行歧义降级为中性色；整行级歧义提示必须保留（现状红色行级提示标识需改为中性色，\`CCFG-UI-013\` 行级提示语义不变）。`

**纠正后当前口径**

- 已确认的中性色**只用于** `COMMA_PROTOCOL_AMBIGUOUS` 行中**没有项级 `anomalies` 的采集数据源标签**；某标签若有项级异常，仍为**红色**。
- **独立的行级歧义警示标识继续保持原来的红色警示样式及原有 Tooltip/文案**，`CCFG-UI-013` 历史定义行**不改写**、语义不变。

**真实修改**

| 文件 / 位置 | 处理 |
|---|---|
| `DESIGN.md` `CCFG-DESIGN-050` 定义行末句 | **精准修正**为：`红色异常**不**因整行歧义降级为中性色；**独立的行级歧义警示标识保持原有红色警示样式及原有 Tooltip/文案不变（\`CCFG-UI-013\` 定义行不改写、语义不变）**——中性色**仅**适用于 \`COMMA_PROTOCOL_AMBIGUOUS\` 行中**没有项级 \`anomalies\`** 的采集数据源标签，该标签若存在项级异常则仍为红色。` |
| `CCFG-UI-013` 历史定义行 | **未触碰**（不改写） |
| V2 报告 §3 第 60 行、§4 第 75 行 | **不回溯改写**（保留原报告）；由**本报告 §4**追加勘误并声明原结论**已失效** |
| 五项新定义与当前 Feature 摘要逐处核对 | 越界表述**仅**出现在 `DESIGN.md` `CCFG-DESIGN-050`；`REQUIREMENTS` §7.11、`README` §1.4、`UI` §16、`ACCEPTANCE` §1.6 与 `DESIGN` §14 其余条款**无**同义越界，未做额外改动 |

### 3.2 R1-02 收窄 `CCFG-AC-093` 的窄视口预期

**问题原位置**：`ACCEPTANCE.md` `CCFG-AC-093` 定义行（R1 后为第 232 行）原预期 `正常视口与窄视口下整行内容均在单行内完整呈现，无换行撑高、无标签裁切、无越界、无横向滚动条；…`——把正常的**表格横向滚动**、长文本**原有省略**一并禁止，超出已确认目标，也可能与固定列宽表格矛盾。

**纠正后当前口径（仅定向修订该用例的步骤/预期）**

- 正常视口与窄视口下整行**保持单行布局**（不因换行撑高）。
- 窄视口容器足够窄时，**允许**固定宽度主表发生**必要的表格横向滚动**（现行正常行为，不作为失败判据）；**允许**长标签、描述按现行规则**单行省略**。
- **仅**下列情形判为失败：页面级**异常**横向溢出（超出主表滚动范围、导致整页出现横向滚动条）、标签或 `+N` 被**意外截断/遮挡**、最右固定“操作”列入口**不可见或不可点**、`+N` 的数量与实际隐藏条数**不符**。
- 最右固定“操作”列按现行行为保持可用（`CCFG-DESIGN-053` 最右固定操作列不变）；**未**改动“探针描述”列宽，**未**改动主表列顺序。

**真实修改**：`ACCEPTANCE.md` `CCFG-AC-093` 定义行的**步骤**与**预期**两段被定向修订；预期段标记改为 `**【本轮新增 · V2 草案 · 待复审 · R1 收窄】**`。其余 103 条验收定义行、全部 112 条需求定义行、`CCFG-UI-001~042` 共 42 条界面定义行**逐字节相同**；设计定义行除 R1-01 的 `CCFG-DESIGN-050` 外**逐字节相同**（`CCFG-DESIGN-047~053` 共 7 条中 6 条、加上 `CCFG-DESIGN-001~046` 共 52 条零变化）。

### 3.3 R1-03 当前状态与历史时点一致

**问题原位置**：V2 文档多处**当前**状态字段仍写第一轮 `adjustment_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`，与其新增的“代码复审已通过”时序说明冲突。涉及 `README.md`（元数据第 11/16 行、§1.4 状态块）、`REQUIREMENTS.md`（元数据第 12 行、§1.3 第 58 行）、`ACCEPTANCE.md`（元数据第 12 行、§1.3 第 27 行、§2 分层陈述）、`DESIGN.md`（元数据第 12/39/41 行）、`UI.md`（元数据第 12/39 行、§15 第 159 行）。

**纠正后当前口径（逐文件区分“当前直接状态字段/当前摘要”与“历史日期记录/旧报告”）**

- 第一轮实现阶段的**当前**状态写为 **“代码复审已通过，等待项目负责人页面目测/接受”**，统一采用文档既有语义一致的 **`IMPLEMENTED_PENDING_USER_ACCEPTANCE`**（已核对仓库既有状态词表；`IMPLEMENTED_AND_CHATGPT_REVIEW_APPROVED` 不能表达“待接受”，故未采用）。
- **保留** 2026-09-23 代码刚提交时点的 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` **历史记载**（`README` §1.3 完成时点块与 §4 历史条目、`REQUIREMENTS` 第 422 行、`ACCEPTANCE` 第 388 行、`DESIGN` 第 427 行、`UI` 第 281 行及其 §15 历史叙述），**不伪造其从未存在**。
- 第一轮基线仍 `APPROVED`；第二轮五项草案仍 `adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`；第二轮实现仍 `adjustment2_implementation_status=NOT_STARTED`；全部 **104** 条验收仍 `NOT_RUN`；**未**写为用户已接受、正式验收完成或第二轮已批准。
- **当前下一入口**统一为 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_R1_REVIEW`；`CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_REVIEW` 与 `CHATGPT_REMOTE_CLIENT_CONFIG_PAGE_ADJUSTMENT_IMPLEMENTATION_REVIEW` 作为历史入口**照实保留**，不再被当作下一步。
- V2 报告 §7“本报告时点权威事实”与 §10 下一入口按仓库惯例**不回溯改写**，由**本报告 §4**声明覆盖关系。

**真实修改（R1-03）**

| 文件 | 修改位置 |
|---|---|
| `README.md` | 元数据第 11 行（`实现状态`）、第 16 行（`本轮调整实现状态`）、第 19 行（第二轮基线状态“未经复审”→ 已复审 `CHANGES_REQUIRED`、R1 承接）；§1.2 第 55 行当前指向 `§1.3`→`§1.4`；§1.3 第 59 行标题改为“**完成时点**分层状态”并指向 §1.4；§1.4 状态块 `adjustment_implementation_status` 与 `next_entry`；§2 导航新增 R1 报告行并补记同步；§5 当前下一入口改 R1 复审 |
| `REQUIREMENTS.md` | 元数据第 12 行、§1.3 第 58 行当前值；§8 第 390 行“尚未复审”更正；§10 追加 R1 变更行 |
| `ACCEPTANCE.md` | 元数据第 12 行、第 13 行（“尚未提交复审”更正）、§1.3 第 27 行、§1.6 第 66/74 行、§2 第 104/109 行；§6 追加 R1 变更行（含 `CCFG-AC-093` 收窄） |
| `DESIGN.md` | 元数据第 12/39/41 行；§14 时序说明补记当前下一入口；§15 追加 R1 变更行（含 `CCFG-DESIGN-050` 修正） |
| `UI.md` | 元数据第 12/39 行；§15 历史叙述改为“完成时点为历史值、其后复审已通过”；§16 时序说明补记当前下一入口；§17 追加 R1 变更行 |

---

## 4. 与 V2 报告的勘误与覆盖关系（原错误不被隐匿）

| V2 报告位置 | 原结论 | 关系 |
|---|---|---|
| V2 报告 §3 五项调整锚点表第 4 行（第 60 行） | `现状红色行级提示标识需改为中性色（行级提示语义不变）` | **R1-01 勘误：原结论已失效。** 正确口径见本报告 §3.1：中性色**仅**用于 `COMMA_PROTOCOL_AMBIGUOUS` 行中无项级 `anomalies` 的采集数据源标签；独立的行级歧义警示标识**保持原有红色警示样式与 Tooltip/文案**。 |
| V2 报告 §4 冲突与定向修订处理表 `CCFG-UI-013` 行（第 75 行） | `现状红色标识需改中性色，语义不变` | **R1-01 勘误：原结论已失效。** `CCFG-UI-013` 行级提示**保持原有红色警示**，定义行不改写；生效口径以 `DESIGN.md` `CCFG-DESIGN-050`（R1 修正后）为准。 |
| V2 报告 §7 分层状态块（第 128–144 行，含第 134 行 `adjustment_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`） | “本报告时点权威事实” | **R1-03 覆写关系：** 其 `adjustment_implementation_status` 为 2026-09-23 提交时点的**历史值**；**当前**权威事实为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（代码复审已通过、等待项目负责人页面目测/接受），且 `next_entry` 已由 `...V2_REVIEW` 推进为 `...V2_R1_REVIEW`。报告其余分层（`existing_feature_implementation_status`、`adjustment_baseline_status`、`adjustment2_*`、`formal_acceptance_execution_status`、`PENDING_USER_CONFIRMATION`）不变。 |
| V2 报告 §10 下一入口（第 178 行） | `next_entry=...V2_REVIEW` | **R1-03 覆写关系：** 该 V2 复审已发生并返回 `CHANGES_REQUIRED`，当前下一入口为 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_R1_REVIEW`。 |

> 依据仓库既有惯例（R0/R1/R2/R3 轮次均**不**回溯改写上游报告），上述 V2 报告原文**保持原样**；勘误与覆盖关系以本节为准，**不**删除、**不**隐匿原错误结论。

---

## 5. `CCFG-AC-093` 与 `CCFG-DESIGN-050` 的旧/新文本、字节与哈希

逐字节提取**定义行整行**（`grep -E '^\| <编号> \|'`，含行尾换行 `\n`），对 base 提交 `328a7ac...` 与工作树比对：

| 定义行 | 旧（base `328a7ac`）SHA-256 | 新（工作树）SHA-256 | 旧字节 | 新字节 |
|---|---|---|---|---|
| `CCFG-AC-093` | `594209e4ff855ef409ca486052475d2bb4ec26766602941884cbf4c1688acf82` | `1e09ce1acde550bb3a365b6d489cb3fccf81d6dad5a72201ecba02e1fa9562a3` | 940 | 1599 |
| `CCFG-DESIGN-050` | `b7cfc60792749e0c8e15ac46e05d7104f6598664052250f2a6834e64fbfc2f73` | `f43ad80609883e8d5ff01b424bb20a6ec891e20c0567510b653af1d8e14ccabf` | 1538 | 1726 |

**旧文本（`CCFG-AC-093`，预期段）**：`**【本轮新增 · V2 草案 · 待复审】** 正常视口与窄视口下整行内容均在单行内完整呈现，无换行撑高、无标签裁切、无越界、无横向滚动条；窄视口下 \`+N\` 可见、可点击、\`N\` 与实际未直接展示数量一致，点击后完整清单正确展示；任意视口下“操作”列入口均可见可点，未被标签或 \`+N\` 挤压覆盖`

**新文本（`CCFG-AC-093`，预期段）**：`**【本轮新增 · V2 草案 · 待复审 · R1 收窄】** 正常视口与窄视口下整行内容均保持**单行布局**（不因换行撑高）；窄视口容器足够窄时，**允许**固定宽度的主表发生必要的**表格横向滚动**（属现行正常行为，不作为失败判据），也**允许**长标签、描述按现行规则单行省略；**仅**下列情形判为失败：页面级**异常**横向溢出（超出主表滚动范围、导致整页出现横向滚动条）、标签或 \`+N\` 被**意外截断/遮挡**、最右固定“操作”列入口不可见或不可点、\`+N\` 的数量与实际隐藏条数不符。窄视口下 \`+N\` 可见、可点击，点击后完整清单正确展示；横向滚动到最右时最右固定“操作”列入口按现行行为保持可用（\`CCFG-DESIGN-053\` 最右固定操作列不变）`

（`CCFG-DESIGN-050` 的旧/新文本见本报告 §3.1 与 `DESIGN.md` 现行定义行；`CCFG-AC-093` 的步骤段同步收窄为“在窄视口确认发生的是主表正常**表格横向滚动**（而非页面级异常横向溢出），并横向滚动到最右后确认‘操作’列入口仍可见可点”。）

---

## 6. 静态文档核验（未运行 Vitest / Maven / `npm run build` / 浏览器 / HTTP 测试）

| 核验项 | 结果 |
|---|---|
| 起点与分叉 | base = `328a7ac...`，本地 HEAD 与 `origin/develop` 一致，未分叉 |
| Git 变更白名单 | 仅 5 个 Feature 文档变更 + 1 个新建 R1 报告；`.claude/settings.local.json`（任务前已有 `M`）与 `docs/prompts/` 未触碰、未暂存 |
| 定义行逐字节比对（base vs 工作树） | **仅** `ACCEPTANCE.md` `CCFG-AC-093` 与 `DESIGN.md` `CCFG-DESIGN-050` 两行有差异；`REQUIREMENTS.md`、`UI.md` 定义行**零差异** |
| 定义行计数 | 需求 `CCFG-REQ-001~112` = **112**；验收 `CCFG-AC-001~104` = **104**；设计 `CCFG-DESIGN-001~053` = **53**；界面 `CCFG-UI-001~042` = **42**；均连续、唯一、无跳号/重号 |
| 验收 `NOT_RUN` 计数 | `NOT_RUN` 定义行 = **104**（全量） |
| 需求→验收覆盖 | **112/112（100%）** |
| 五项范围 | 仅修正三处文档问题；五项已确定产品决策**未**重新设计，需求/设计/界面/验收的四层覆盖与 `CCFG-DESIGN-047~053`、`CCFG-UI-036~042`、`CCFG-REQ-104~112`、`CCFG-AC-090~104` 编号范围不变 |
| `git diff --check` | 通过（无空白/冲突标记问题） |
| 保护文件 | `docs/baseline/**`（含两套模板 `MIGRATION.md`）、`API.md`、`DATABASE.md`、`docs/features/README.md`、`docs/features/client-config/reports/` 既有报告、V2 报告、`CLAUDE.md`、`agent-env.sh`、`frontend/**`、`backend/**` 均**无改动** |
| `docs/prompts/**` | 未写入、未提交；目录仍为未跟踪 `?? docs/prompts/`，文件清单 49 个、清单 SHA-256 `1d90a84ca00b1ebb80fb3b003305f65cbebb955c2cc421d2476abfb568606360`，前后一致 |

**未执行**：Vitest、Maven、`npm run build`、浏览器操作、HTTP 接口测试、正式验收、服务启停。`tests_build_browser_status=NOT_RUN_DOCS_ONLY`。

---

## 7. 未执行事项、禁止范围与阻塞

- 未修改任何业务代码/测试文件/前端或后端源文件；未启动或停止任何服务。
- 未访问或写入数据库、ZooKeeper、Kafka（`database_write_status=NOT_REQUESTED`、`zookeeper_write_status=NOT_REQUESTED`）。
- 未执行正式验收；未把第二轮草案写为已批准、已实现、已目测或已验收；未宣布页面最终接受。
- 未强推、未清理、未合并/变基；未处理 `docs/prompts/` 与 `.claude/settings.local.json` 这两项任务前已存在的无关变更。
- **阻塞**：无。

---

## 8. 下一入口

`next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_R1_REVIEW`

本 R1 纠错提交并**普通推送**至 `origin/develop` 后，停在上述 ChatGPT 远程独立复审入口，等待其从远程 Git 对本 R1 结果做复审。**不得**在复审通过前继续进入代码实现，**不得**宣布第二轮文档已批准；批准与实现分别另行处理。
