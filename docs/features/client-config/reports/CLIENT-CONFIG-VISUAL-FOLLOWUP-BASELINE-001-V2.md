# 探针端管理主列表视觉调整（第二轮 V2）基线草案 · 执行报告

- 任务编号：`CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2`
- 任务性质：**纯文档草案任务**（只做文档，不修改业务代码，不做测试/构建/浏览器操作/正式验收）
- 目标 Feature：`client-config`（探针端管理，路由 `/config/client`）
- 任务提示词：`docs/prompts/client-config/CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-Agent-Prompt.md`（**取代**此前被项目负责人取消的 `...BASELINE-001-Agent-Prompt.md`；V1 不作为现行任务执行、提交或引用）
- 本报告时点：2026-09-23

---

## 1. 起始 Git 现场与工作区分类

| 项目 | 值 |
|---|---|
| 仓库 | `/agent/cdc-config-platform` |
| 当前分支 | `develop` |
| 任务开始前 HEAD（base commit） | `de23b68d1999425d14c2753515b237711147b826` |
| 起始时远程 `origin/develop` | `de23b68d1999425d14c2753515b237711147b826`（与本地 HEAD 一致，**未**分叉） |
| 起始 `git status --short` | ` M .claude/settings.local.json`；`?? docs/prompts/`（`docs/prompts/` 为未跟踪目录） |

工作区分类：

- **本任务授权范围内的待改文件**（任务开始前均为 `git` 跟踪的未修改文件）：`docs/features/client-config/README.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`UI.md`，以及本任务新建的 `docs/features/client-config/reports/CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2.md`。
- **任务开始前已存在的无关修改（保持原样，不修改、不暂存、不提交）**：`.claude/settings.local.json`（`M`）与未跟踪目录 `docs/prompts/`。二者均不在本任务白名单内，本任务**未**触碰。
- 未执行任何 `reset`/`clean`/`stash`/`merge`/`rebase`/`checkout`/`pull`/`fetch`。

> 说明：提示词将 `de23b68d...` 作为 2026-09-23 页面级调整实现提交引用，并要求“不把该 SHA 当成永不变化的 HEAD”。经核对本地与远程 HEAD 均等于该 SHA，起点真实、无需重定位。

---

## 2. 资料读取与当前实现事实

按 `CLAUDE.md` §3 完整读取并核对：

- `docs/baseline/` 六份项目级基线（`PROJECT.md`/`ENVIRONMENT.md`/`ARCHITECTURE.md`/`DEVELOPMENT_RULES.md`/`PROJECT_STATUS.md`/`DOMAIN_GLOSSARY.md`）。
- `docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`（Feature 开发与调整流程）。
- `docs/features/client-config/` 现行批准基线（`README.md`/`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md`/`API.md`/`DATABASE.md`）。
- 两套模板基线：`docs/baseline/query-list-page-template/`（`README.md`/`SHARED_COMPONENT_DESIGN.md`/`MIGRATION.md`）与 `docs/baseline/list-table-visual-template/`（含 `MIGRATION.md`）。

**只读核对参考实现**（代码文件不是本任务改动对象）：

- `frontend/src/views/data-source/DataSourcePage.vue`（视觉对照来源）：
  - `.ds-add-button:not(.is-disabled)`：背景/边框 `#09090b`、文字 `#ffffff`、圆角 6px、字重 500，Hover/聚焦 `#27272a`、按下 `#18181b`，禁用态沿用 Element Plus 既有禁用视觉。
  - `.ds-id-text`：`font-size: 14px`、`font-weight: 600`、`color: #09090b`、等宽字体族、`tabular-nums`。
  - `.ds-inactive-mark`：20px 高、圆角 4px、`#fee2e2` 底 / `#991b1b` 字、11px、字重 700。
  - `.data-table :deep(.el-tag)`：高度 20px、`line-height: 20px`、`padding: 0 9px`、无边框、圆角 4px、字号 12px、字重 600；`--warning` `#fef3c7`/`#b45309`，`--success` `#ecfdf5`/`#047857`。
  - 该页**未**为 `.el-table__row` 声明固定行高。
- `frontend/src/styles/list-table/list-table-visual.css`（公共表格视觉预设）：**未**声明行高；`td.el-table__cell` 内边距 `var(--lt-body-cell-padding, 12px 0)`、表头 `11px 0`；公共层**不**声明 `line-height`/`height`/`max-height`，**不**提供固定行高令牌。
- `frontend/src/views/client-config/ClientConfigPage.vue`（被调整对象，只读核对现状锚点）：存在 `.cc-table :deep(.el-table__row) { height: 60px }` 固定行高；标签/行级提示/操作入口/`+N` 等现状锚点已核对。

---

## 3. 五项调整的真实实现锚点（供实现阶段参考，本任务不实现）

| 项 | 已确认目标 | 代码侧现状锚点（只读核对，不在本任务改动） |
|---|---|---|
| 1. 新增按钮 | 结果区最右侧“新增探针” → 参考页“新增数据源”同款黑色实心按钮 | 现有蓝色主按钮样式；参考目标见 §2 的 `.ds-add-button` |
| 2. 探针 ID | ID **正文**采用参考页“数据源 ID”同款字重与颜色 | 参考目标见 §2 的 `.ds-id-text`；ID 后的“停用”标识与异常原值标识保持各自语义 |
| 3. 行高 | 跟随参考页“数据源管理”主列表**实际行高规则** | 现状为本页 `.cc-table :deep(.el-table__row) { height: 60px }` 固定像素；参考页与公共预设均不声明行高，故应**移除**该固定值，由公共预设单元格内边距 + 内容决定 |
| 4. 采集数据源标签 | 借用参考页“角色”标签视觉语言；数据状态用**绿/红/中性**三色 | 现有判定锚点：`ds.anomalies.length > 0` → 红；否则 `isRowAmbiguous(row)`（`row.rowAnomalies.includes('COMMA_PROTOCOL_AMBIGUOUS')`）→ 中性；否则 → 绿。现状红色行级提示标识需改为中性色（行级提示语义不变） |
| 5. 操作列 | 全部行“更多”文字 → **水平三点图标（Ellipsis）** 菜单 | 现状为“更多”文字入口（`.cc-more-link`）；下拉条目本身按 `FG_ACTIVE` 三态已确定，本轮只改入口形态与菜单视觉，业务语义与事件边界保持 |

---

## 4. 冲突与定向修订处理

本轮五项与既有界面项存在**局部冲突**，按“保留历史原文 + 明确‘定向修订’ + 以本轮为准”处理，**不**擦除、**不**重排既有定义行：

| 被定向修订的既有项 | 冲突点 | 处理 |
|---|---|---|
| `CCFG-UI-004`/`CCFG-UI-029`（新增按钮为蓝色主按钮） | 本轮改为黑色实心 | 原文保留；本轮以 `CCFG-UI-036` 为准 |
| `CCFG-UI-005`/`CCFG-UI-007`（常规行视觉高度约 58~64px） | 本轮改为跟随参考页实际行高规则 | 原文保留；本轮以 `CCFG-UI-038` 为准 |
| `CCFG-UI-007`/`CCFG-UI-010`（采集数据源标签尺寸与异常红色语义） | 本轮标签尺寸/配色与三态模型调整 | 原文保留；本轮以 `CCFG-UI-039` 为准 |
| `CCFG-UI-032`（操作列唯一**文字**入口“更多”） | 本轮改为三点图标入口 | 原文保留；本轮以 `CCFG-UI-040`/`CCFG-UI-041` 为准 |
| `CCFG-UI-013`（行级提示） | 现状红色标识需改中性色，语义不变 | 语义保留；仅观感随 `CCFG-UI-039` 调整 |

未受本轮影响的定义行**逐字节不变**（见 §8 静态核验）。

---

## 5. 编号、总数与追踪覆盖

本轮采用**连续、唯一**的新编号，追加在各文档既有最大编号之后，**不**复用旧编号、**不**重排历史编号：

| 文档 | 新增编号 | 条数 | 追加前最大编号 | 追加后总数 |
|---|---|---|---|---|
| `REQUIREMENTS.md` | `CCFG-REQ-104 ~ CCFG-REQ-112` | 9 | `CCFG-REQ-103` | **112** |
| `ACCEPTANCE.md` | `CCFG-AC-090 ~ CCFG-AC-104` | 15 | `CCFG-AC-089` | **104** |
| `DESIGN.md` | `CCFG-DESIGN-047 ~ CCFG-DESIGN-053` | 7 | `CCFG-DESIGN-046` | **53** |
| `UI.md` | `CCFG-UI-036 ~ CCFG-UI-042` | 7 | `CCFG-UI-035` | **42** |

五项 → 需求 → 设计/界面 → 验收 覆盖：

| 五项 | 需求 | 设计/界面 | 验收 |
|---|---|---|---|
| 1. 新增按钮黑色实心 | `CCFG-REQ-104` | `CCFG-DESIGN-047`、`CCFG-UI-036` | `CCFG-AC-090` |
| 2. 探针 ID 正文对齐 | `CCFG-REQ-105` | `CCFG-DESIGN-048`、`CCFG-UI-037` | `CCFG-AC-091` |
| 3. 行高跟随参考页 | `CCFG-REQ-106` | `CCFG-DESIGN-049`、`CCFG-UI-038` | `CCFG-AC-092`、`CCFG-AC-093` |
| 4. 标签视觉语言 + 三色 | `CCFG-REQ-107`、`CCFG-REQ-108`、`CCFG-REQ-109` | `CCFG-DESIGN-050`、`CCFG-UI-039` | `CCFG-AC-094 ~ CCFG-AC-099` |
| 5. 三点图标与菜单 | `CCFG-REQ-110`、`CCFG-REQ-111` | `CCFG-DESIGN-051`、`CCFG-DESIGN-052`、`CCFG-UI-040`、`CCFG-UI-041` | `CCFG-AC-100 ~ CCFG-AC-103` |
| 不改项与回归边界 | `CCFG-REQ-112` | `CCFG-DESIGN-053`、`CCFG-UI-042` | `CCFG-AC-093`、`CCFG-AC-104` |

需求→验收覆盖：**112/112（100%）**。五项**无遗漏**：每项均有需求、设计/界面与验收三层覆盖。

验收条款覆盖的五项必查点（均已在 §4 用例逐条可检查）：

- **标签四态**：正常（绿，`AC-094`）、异常（红，`AC-095`）、行级歧义（中性，`AC-096`）、歧义行仍含明确异常（保持红不降级，`AC-097`）。
- **菜单三种 `FG_ACTIVE` 状态**：`'1'` 停用+删除、`'0'` 启用+删除、异常原值 停用+删除（`AC-100`）；删除视觉分隔（`AC-101`）、右边缘定位（`AC-102`）、Hover/键盘焦点（`AC-101`/`AC-102`）、禁止误触发行编辑（`AC-103`）。
- **行高/标签尺寸**：正常视口与窄视口的完整单行 + `+N`（`AC-093`）。

---

## 6. 逐文件修改说明

| 文件 | 变更摘要 |
|---|---|
| `docs/features/client-config/REQUIREMENTS.md` | 新增 §7.11（`CCFG-REQ-104~112`，9 条，含参考页 `#hex`/像素的“参考实现事实”标注与效力边界）；§7.10 前言追加**时序说明**（历史 `NOT_STARTED`/`NOT_RUN` 属该时点事实，定义行未改写）；§8 计数表新增一行并将合计更新为 `CCFG-REQ-001~112` = **112**、重写编号核验段；§10 追加 2026-09-23 V2 草案变更行 |
| `docs/features/client-config/ACCEPTANCE.md` | 新增 §1.6 V2 分层状态块；元数据（实现状态、验收用例状态、任务编号、依据需求）更新；§2 编号范围与分层更新；§3 分类表新增一行、合计 **104**、重写编号核验；§4 追加 `CCFG-AC-090~104`（15 条，全 `NOT_RUN`，标记 `【本轮新增 · V2 草案 · 待复审】`）；§5 覆盖更新为 **112/112**，新增 `CCFG-REQ-104~112` 行；§6 追加 2026-09-23 V2 草案变更行 |
| `docs/features/client-config/DESIGN.md` | 依据需求/验收更新为 112/104；设计编号更新为 `CCFG-DESIGN-001~053`；新增 3 行 `adjustment2_*` 元数据；§11 追加第二轮设计空档 = 0；§12 前言更新为 112/112 与 104/104 并说明两轮范围；§12.1 追加 `CCFG-REQ-104~112` 行、§12.2 追加 `CCFG-AC-090~104` 行；**新增 §14**（`CCFG-DESIGN-047~053`，含时序说明与效力边界）；原 §14 变更记录顺延为 §15 并追加 2026-09-23 V2 草案变更行 |
| `docs/features/client-config/UI.md` | 依据需求更新为 `CCFG-REQ-001~112`、依据验收更新为 `CCFG-AC-001~104`；设计编号更新为 `CCFG-UI-001~042`；新增 3 行 `adjustment2_*` 元数据；§14 关联矩阵更新为 112/112 与 104/104；**新增 §16**（`CCFG-UI-036~042`，含时序说明、效力边界、与既有界面项关系）；原 §16 变更记录顺延为 §17 并追加 2026-09-23 V2 草案变更行；`CCFG-UI-039` 补记 `CCFG-REQ-109` 与 `CCFG-AC-099` 覆盖 |
| `docs/features/client-config/README.md` | 元数据新增 `adjustment2_*` 三行、正式验收执行更新为 104 条；**新增 §1.4**（V2 草案状态块，含五项摘要与状态分层）；§1.3 追加**时序说明**（第一轮实现已获 ChatGPT 远程代码复审通过）；§2 导航更新 6 处文档状态与新增 V2 报告行；§4 追加 V2 草案条目；§5 更新当前下一入口 |
| `docs/features/client-config/reports/CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2.md` | 本报告（新建） |

**未修改**：`API.md`、`DATABASE.md`、`docs/features/README.md`、`docs/baseline/**`（含两套模板 `MIGRATION.md`）、`docs/features/client-config/reports/` 下全部既有报告、`docs/prompts/**`、`.claude/settings.local.json`、`CLAUDE.md`、`agent-env.sh`、`frontend/**`、`backend/**`。

---

## 7. 分层状态（本报告时点权威事实）

```text
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment_baseline_status=APPROVED
adjustment_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment2_implementation_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_REVIEW
```

- 本轮五项调整基线 `DRAFT_PENDING_USER_REVIEW`、本轮代码实现 `NOT_STARTED`、本轮验收 `NOT_RUN`（`CCFG-AC-090~104`，15 条）。
- 第一轮已批准基线（`adjustment_baseline_status=APPROVED`）、既有 Feature 实现事实（`IMPLEMENTED_PENDING_USER_ACCEPTANCE`）与第一轮页面级调整实现事实（`IMPLEMENTED_PENDING_CHATGPT_REVIEW`）**照实保留**，未改写、未抹除。
- **用户同意五项 ≠ 文档已批准 ≠ 已实现 ≠ 已验收**；本轮草案**不**自动继承上一轮批准。

---

## 8. 验证结果（静态文档核验，未运行 Vitest/Maven/npm 构建/浏览器/HTTP 测试）

| 核验项 | 结果 |
|---|---|
| Git 变更白名单 | 仅本任务 6 个文件变更（5 个 Feature 文档 + 1 个新建报告），与白名单一致；`.claude/settings.local.json`、`docs/prompts/` 未触碰 |
| 历史定义行逐字节比对 | `CCFG-REQ-001~103`（103 行）**逐字节零变化**；`CCFG-AC-001~089`、`CCFG-DESIGN-001~046`、`CCFG-UI-001~035` 相对 HEAD **零删除**（diff 仅 `>` 新增行，无 `<` 删除行） |
| 编号唯一连续 | `CCFG-REQ-001~112`（112）、`CCFG-AC-001~104`（104）、`CCFG-DESIGN-001~053`（53）、`CCFG-UI-001~042`（42），连续、唯一、无跳号、无重号 |
| 需求→验收覆盖 | **112/112（100%）**，无孤立需求、无未追踪用例 |
| 五项无遗漏 | 五项均有 需求/设计/界面/验收 四层覆盖（见 §5） |
| 验收 `NOT_RUN` 计数 | 文件内 `CCFG-AC-*` 定义行 104 行，其中状态 `NOT_RUN` = **104**（全量） |
| 保护文件 | `API.md`、`DATABASE.md`、`docs/features/README.md` 无改动（`git status` 干净）；`docs/baseline/**` 无改动；既有报告 26 份无改动 |
| `docs/prompts/**` | 未写入、未提交；目录仍为未跟踪 `?? docs/prompts/`，文件清单与 SHA-256 前后一致（47 个文件，含本任务提示词 `bd2654c481d67247...`） |
| `git diff --check` | 通过（无空白/冲突标记问题） |

**未执行**：Vitest、Maven、`npm run build`、浏览器操作、HTTP 接口测试、正式验收、服务启停。`tests_build_browser_status=NOT_RUN_DOCS_ONLY`。

---

## 9. 未执行事项、禁止范围与阻塞

- 未修改任何业务代码/测试文件/前端或后端源文件；未启动或停止任何服务。
- 未访问或写入数据库、ZooKeeper、Kafka（`database_write_status=NOT_REQUESTED`、`zookeeper_write_status=NOT_REQUESTED`）。
- 未执行正式验收，未把用户同意五项写成文档批准或验收通过。
- 未强推、未清理、未合并/变基；未处理 `docs/prompts/` 与 `.claude/settings.local.json` 这两项任务前已存在的无关变更。
- **阻塞**：无。

---

## 10. 下一入口

`next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_REVIEW`

本轮草案提交并**普通推送**至 `origin/develop` 后，停在上述 ChatGPT 远程独立复审入口，等待其从远程 Git 对本草案做复审。**不得**在复审通过前继续进入代码实现；批准与实现分别另行处理。
