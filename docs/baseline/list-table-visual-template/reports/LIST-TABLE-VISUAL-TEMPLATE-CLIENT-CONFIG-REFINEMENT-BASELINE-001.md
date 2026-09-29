# 列表表格视觉模板 · 探针端管理参照修正草案 · 执行报告

```text
task_code=LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001
task_type=DOCS_ONLY_DRAFT
branch=develop
base_commit_id=30142e2c21db96d426f86f334859554ceee2d1f8
draft_status=DRAFT_PENDING_USER_REVIEW
template_level_status_change=NONE
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
pilot_page_selection_status=NOT_DECIDED
current_next_entry=CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_REVIEW
```

本报告为**纯文档草案**任务的执行记录：以**已实现、经项目负责人目测认可**的 `/config/client` 主列表为参照，
整理 `docs/baseline/list-table-visual-template/` 的现行规则与可选能力，**删除规范正文中面向现行规则的过期示例**。
**产品方向确认不是本模板修订的正式批准**；本报告新增的任何可选契约**尚待**远程复审与项目负责人批准。
本任务**未**修改任何代码 / 测试 / 共享 CSS / 页面，**未**运行前后端测试、构建或浏览器验收，
**未**启停服务，**未**访问数据库 / ZooKeeper / Kafka，**未**改写任何历史报告或证据目录。

---

## 1. 开工门禁

| 项 | 实测 |
| --- | --- |
| 工作目录 | `/agent/cdc-config-platform`（有效 Git 仓库） |
| 分支 | `develop` |
| 本地 HEAD | `30142e2c21db96d426f86f334859554ceee2d1f8` |
| `origin/develop` | `30142e2c21db96d426f86f334859554ceee2d1f8` |
| 远程 `refs/heads/develop` | `30142e2c21db96d426f86f334859554ceee2d1f8` |
| ahead / behind | `0 / 0`（无分叉） |
| 预期起始 SHA | `30142e2c21db96d426f86f334859554ceee2d1f8`（**一致**） |
| 任务前既有无关改动 | ` M .claude/settings.local.json`、`?? docs/prompts/`、`?? runtime-logs/`（**保持原样，不暂存**） |

结论：**门禁通过**。本地 / 远程三方 SHA 一致、无分叉；未执行 reset / clean / stash / rebase / checkout / 强推。

## 2. 现值与证据来源

所有“现值”均取自**真实 Git 对象 / 源码 / 静态断言**，**不**采信旧示例或本报告撰写时的口头描述。

| 现值 | 实测 | 来源（只读） |
| --- | --- | --- |
| `--lt-*` 令牌数 | **9** | `frontend/src/styles/list-table/index.ts`（`LT_TABLE_VISUAL_TOKENS` 9 项）；`grep -c "'--lt-"` = 9 |
| opt-in 辅助类数 | **2** | `frontend/src/styles/list-table/list-table-visual.css` 去重后 `{lt-row-action__cell, lt-row-action__ellipsis}` |
| 三点命中区 / 圆角 / 主色 | `28×28px` / `6px` / 主色（`var(--el-color-primary)`） | 同上 CSS；`:focus-visible` 内嵌 `outline-offset:-2px` |
| 操作单元格纵向内边距补偿 | `padding: 9.5px 0` | 同上 CSS；行高 `48 = 1(底边框) + 28(盒) + 19(内边距)`，**不**固定 `tr` 高度 |
| 行高（内容驱动） | 两页可比常规行约 **`48 CSS px`**，歧义提示行 `52px` | `docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001/`（无头 Chromium 只读量测） |
| 静态断言 | #11 先剔除根类再断言辅助类集合；#13 仅 `ClientConfigPage.vue` 挂载 | `frontend/src/styles/list-table/list-table-visual.spec.ts` |
| 探针页接入 | `/config/client` 主列表：`td` 挂 `lt-row-action__cell`、触发器挂 `lt-row-action__ellipsis` | `frontend/src/views/client-config/ClientConfigPage.vue` |
| 数据源页现状 | `:class="['data-table', LT_MAIN_TABLE_CLASS]"`；末列仍为「更多」**文字**入口；`lt-row-action__*` 计数 `0` | `frontend/src/views/data-source/DataSourcePage.vue` |

参考页当前状态：`/config/data-source` 主列表 36 行常规行高 `48px`、无 `lt-row-action__*`、仍「更多」文字入口（第七轮只读对照）。

## 3. 过期示例逐项清单（候选 → 证据 → 处置 → 位置）

**处置含义**：`删除` = 从**现行规范正文**移除该示例；`改写` = 以**带日期的现行事实 + 代码位置**就地替换；
`更正注` = 正文数值保留，追加带日期的现行值注（用于阶段一契约，遵循本目录“历史逐字保留、现状追加”惯例）；
`保留历史` = 属**产生时点**的真实盘点记录，明确标注为非现行示例。

| # | 候选（过期示例） | 证据 | 处置 | 删除前 → 删除后位置 |
| --- | --- | --- | --- | --- |
| 1 | UI.md §1 导语“源码未显式定义…一律标注为‘继承现状、待详细设计 / 浏览器量测确认’” | 行高 / 内边距 / 横向溢出已由只读量测与静态断言确认 | 改写 | UI.md 54–56 → 54–57（改为“当时未确认者…已就地转为现行事实”） |
| 2 | UI.md §1.2 注“表格的**行高**、**hover 行颜色**、**边框线宽**、**单元格横向内边距**等**未**在本文件显式定义，属‘继承现状、待详细设计 / 浏览器量测确认’” | `UI.md` §1.3/§1.4 已定义内边距；公共 CSS 已定义边框 / 行高 | 删除并改写 | UI.md 104–106 → 104–115（改为现行事实分项 + 证据） |
| 3 | UI.md §1.9“表格**未**声明横向滚动的自定义策略 → ‘继承现状、待详细设计 / 浏览器量测确认’” | 已确认沿用 Element Plus 内建行为 | 删除并改写 | UI.md 214 → 214–215 |
| 4 | UI.md §3.5“其他页面（如探针端管理）的多选与选中态（`#ecf5ff` 底色 + 左侧条）” | 探针多选 / 批量工具栏**已于 2026-09-22 取消**，改单行固定高亮 | 删除并改写 | UI.md 313–318 → 313–322 |
| 5 | UI.md §3.7“其他页面（如探针端管理）**显式固定** `height: 60px`”（含就地追注） | 探针主列表 **2026-09-23** 移除固定像素行高，改内容驱动 | 删除并改写（历史事实降为带日期注） | UI.md 326–339 → 326–341 |
| 6 | UI.md §3.9 仅述 ID 强调与「更多」为 Feature，未反映现行三点 opt-in | 探针已 opt-in 三点；数据源仍「更多」文字 | 改写（补现行事实，非删除） | UI.md 347–350 → 347–353 |
| 7 | DESIGN.md §7“**选中态**（如某页面 `#ecf5ff` 底色 + `inset 3px 0 0` 左侧条）” | 该具体示例已取消 | 删除（泛化为业务选择语义） | DESIGN.md 181 → 187 |
| 8 | README.md §8“**现行** 9 个 `--lt-*` 令牌、内部 helper 类 `0`” | 收口时点值；**现行** helper 类 `2` | 改写（“现行”→“该批准收口时点”，指向下方更新） | README.md 402 → 402–403 |
| 9 | README.md §10“本模板**未**定义、**未**测量…；凡参考源码未显式定义的值，均标注为‘继承现状、待详细设计/浏览器量测确认’” | 已完成两页常规行只读量测 | 删除并改写 | README.md 470–471 → 470–473 |
| 10 | README.md §8 标题“已批准设计基线、**尚未实现**的可选扩展” | opt-in 已实现、待远程复审 | 改写 | README.md 394；§7 注 339 |
| 11 | SHARED_COMPONENT_DESIGN.md §5 第 10 项“…hover 业务语义（含 #ecf5ff 底 + inset 3px 0 0）” | 同 #4/#7 | 删除（泛化） | SCD 915 → 915 |
| 12 | SCD §12.6“接入示例（**示例 ≠ 已迁移**）”两段草案示例（探针 / 数据源） | 探针侧已落地；数据源侧未授权非现行示例 | 删除并改写为「现行接入事实 + 代码位置」 | SCD §12.6 → 标题与两段整体替换 |
| 13 | SCD §4.3 表“**阶段一内部辅助类数量 = 0**”、§4.3 正文“阶段一内部辅助类为 `0` 是一条可断言的事实” | 现行 `2` | 更正注（阶段一值保留） | SCD 695 / 699 |
| 14 | SCD §4.4 代码块 `lt_internal_helper_class_count=0` | 现行 `2` | 更正注 | SCD 783 |
| 15 | SCD §7.1 断言表 #11“内部辅助类数量为 0” | 现行断言为 2 元素集合 | 更正注 | SCD §7.1 表后 |
| 16 | SCD §12.7“拟修订契约”通篇“拟值 / 现行仍 `0` / 生效时改为 `2`” | 已由实现任务落地 | 加“生效后现状”注（R1/R2 历史保留） | SCD §12.7 末 |
| 17 | MIGRATION.md `2026-09-29` 时序核对记录末尾“现行统计 `PASS 69 / FAIL 0 / BLOCKED 70 / NOT_RUN 15 = 154`”及其“§12 草案未获复审 / 未批准 / 未实现” | 第七轮定向验收已把统计推进至 `70 / 0 / 72 / 15 = 157`；§12 设计基线已批准、实现已落地 | 追加记录更正（**不**回写原记录） | MIGRATION.md 新增“模板整理任务追加记录（2026-09-29）” |

**保留为历史（不删、不改写正文）**：MIGRATION.md §2 全量盘点矩阵第 3 行与 §4 保护清单中的
“固定行高 `60px`”“多选与选中态（`#ecf5ff` + `inset 3px 0 0`）”“批量工具栏”，以及 §4 之下 R1 修正记录、
两节 `2026-09-29` 追加记录——均为**其产生时点**的真实记录；本任务在追加记录中声明其**非现行**语义，
**不**改写历史报告、**不**改写 §2/§4/§5/§6 正文。

**未凑数删除**：仍准确的代码片段与映射（如 `UI.md` §1.3/§1.4 的 `:deep` 片段、§1.10 列宽表、
`DESIGN.md` §8 候选对比、`SCD` §4.4 令牌表）**一律保留**。

### 3.1 删除后的检索核验（脚本见 §7）

- `grep -rn '待详细设计\|浏览器量测确认' docs/baseline/list-table-visual-template/*.md`：现行规范**正文**中不再有以该短语作**未决占位**的表述；剩余命中仅为（a）历史/日期注（UI.md §1 导语与 §1.2/§1.9 的“**不再**是…”表述）、（b）本报告与 changelog 的记录性提及。
- `grep -rn '#ecf5ff\|inset 3px\|60px'`：现行正文中 `#ecf5ff`/`inset 3px` 仅出现在**带日期的历史注**（UI.md §3.5“原…已取消”、§3.7“历史（产生时点事实，非现行示例）”）与 MIGRATION 历史盘点/追加记录；`60px` 仅出现在历史注与历史盘点行。

## 4. 分层契约（基础 / 三点 / 单行固定高亮）

新增于 `SHARED_COMPONENT_DESIGN.md` §13（**本节新增契约状态 = `DRAFT_PENDING_USER_REVIEW`**）。

### 4.1 能力契约表（能力 · 启用条件 · 公共层 · Feature · 未启用页结果 · 证据）

| 能力 | 启用条件 | 公共层负责 | Feature 负责 | 未启用页结果 | 验证证据 |
| --- | --- | --- | --- | --- | --- |
| 表头 / 正文排版、边框、纵向内边距 | 显式挂根类 `lt-main-table` | 表头 `12px/600/#71717a/0.01em`；`td 12px 0`、`th 11px 0`；边框 `#f4f4f5` | 列定义、字段语义、覆盖 | 零匹配，计算样式逐值不变 | `list-table-visual.spec.ts` #1–#10；正式验收逐值等价 |
| 行高（内容驱动） | 默认 | 不固定 `tr` 高度；不裁切 / 不压平 | 确有差异时可自行固定（自担风险） | 各页按内容自然撑开 | 两页量测：常规行约 `48px`、歧义行 `52px` |
| 行内三点入口（opt-in） | 显式挂 `lt-row-action__cell` + `lt-row-action__ellipsis` | **仅**命中区盒模型与交互态（`28×28`、圆角 `6px`、主色、hover、`:focus-visible` 内嵌环、cursor、单元格内边距补偿 `9.5px 0`） | 菜单内容、启停/删除、权限、禁用态、异常状态、Popover 定位、请求顺序 | 零匹配、零泄漏；可续用文字「更多」或无操作列 | spec #11（辅助类集合）、#13（仅 `ClientConfigPage.vue`）；第七轮只读证据 |
| 单行固定高亮（**本节新增可选契约**） | 页面**自行选择**（非默认） | 仅**可选视觉预设**（见 4.3） | 选择语义、选中 ID 存放、与启停/删除联动、请求时序 | 不改该页现行 hover；无固定高亮 | 第七轮只读回归 |

### 4.2 行高基础规则

- **基础 = 内容驱动**：约 `48px` 是**两页现有可比常规样本的实测结果**，**不**是全表固定 `height:48px`、
  **不**是所有内容行的硬上限、**不**是所有页面统一绝对值；
- 异常 / 歧义提示行、长内容行**允许自适应**；**不得**为等高隐藏或裁切内容；
- 三点触发器自身 `28×28px` 与操作单元格的**可选**内边距补偿**不**强制其他表格行高。

### 4.3 单行固定高亮（可选契约，非默认）

**外观预设（可选）**：普通行 `hover` `#f4f4f5`、固定行底 `#e1e4e8`、固定行左缘强调 `#18181b`
（取自探针现行实现，**不**为未启用页强加、**不**改变其现行 hover）。

**行为边界**：最多一行固定；单击固定 / 再点取消 / 点他行转移；普通查询与实际列表重载发起时**清空**；
有行级状态变更且页面**自行选择**该选项时，成功后**只**对**仍在最新结果中且可见**的该 ID 重选；
失败 / 取消不凭空改变；**不**在跨请求共享变量中保留重选意图（防过期响应复活）；
选中 ID 存放、事件隔离与请求时序属 **Feature 页面会话状态**，**不**写 URL / 浏览器存储 / 接口 / 数据库；
行选择**不**作为启停 / 删除前置条件。**字段边界**：**不**预设所有表有 `FG_ACTIVE`，
更**不**把“含 `FG_ACTIVE`”当作自动启用的充分条件。

### 4.4 其余探针页特征

ID 字重、状态标签、`+N`、固定操作列、异常提示、双击编辑**继续归 Feature**（无“无需业务语义 + 跨页证据”支撑），
**未**提升为公共基础或可选预设；**不**新建共享 Vue 组件，**不**把弹窗字段布局写入表格模板。

## 5. 旧新规则冲突的解除

`DESIGN.md` §7 原有“**选中态**（`#ecf5ff` + `inset 3px 0 0`）”“**hover 态配色**”等**绝对**禁令。
本任务**不**与其并列互斥，而是就地追加**最小定向修订草案**（`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`）：

- **业务选择语义**（哪一行被选、与启停/删除/批量联动、选中 ID 存放与请求时序）**始终属 Feature、不公共化**——与禁令一致；
- **与语义解耦的视觉外观**（如单行固定高亮的底色 / 左缘强调）**可**作为**显式 opt-in 可选视觉预设**，由 Feature 选用；
- 故两行禁令**范围收窄**为“业务语义不公共化”，**不**排除可选视觉预设。该收窄**尚待**复审与负责人批准。

历史时序保留：`DESIGN.md` §7 原决定、`MIGRATION.md` R1 修正、`UI.md` §3.5/§3.7 历史注均**不改写**；
新旧口径以“**时间 + 层**”区分，而非互斥并列。

## 6. 文件逐项差异

| 文件 | 变更要点 |
| --- | --- |
| `UI.md` | §1 导语、§1.2、§1.9、§3.5、§3.7、§3.9：删过期占位/示例、补现行事实与代码位置、`#ecf5ff`/`60px` 降为带日期历史注 |
| `DESIGN.md` | §5 新增实测参考事实（`LIST_TABLE_REFERENCE_FACT`，`48px` 内容驱动）；§7 删除过期选中态示例 + 新增最小定向修订草案（`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`） |
| `MIGRATION.md` | 追加“模板整理任务追加记录（2026-09-29）”：更正过期统计为 `70/0/72/15=157`、分层说明 §12 状态、声明 §2/§4 为历史盘点（**不**回写正文） |
| `README.md` | §7.4 计数表增列“本任务整理后”与口径说明；§8 状态措辞更正（“尚未实现”→“已实现待远程复审”、helper 数时点化）；§10 删除过期占位政策；§11 追加本任务 changelog |
| `SHARED_COMPONENT_DESIGN.md` | §13 新增分层契约（§0.1/§11 加复测注）；§0.1/§4.3/§4.4/§7.1/§11.3/§12.6/§12.8 加带日期现行值注；§12.6 草案示例改写为现行接入事实；§12.7 加“生效后现状”注 |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001.md` | 本报告（新增） |

**允许修改范围核对**：仅上述 5 份模板文档 + 本报告；**未**触碰 `docs/features/client-config/**`、
`docs/features/data-source-management/**`、任何历史报告 / 证据目录、`docs/prompts/**`、代码 / 测试 / 共享 CSS、
`CLAUDE.md`、配置。

## 7. 标记三通道计数与令牌 / helper 实测计数

**核验脚本（仓库根执行；本任务后实测）**

```bash
core_docs=(docs/baseline/list-table-visual-template/README.md \
           docs/baseline/list-table-visual-template/DESIGN.md \
           docs/baseline/list-table-visual-template/UI.md \
           docs/baseline/list-table-visual-template/MIGRATION.md)
for m in LIST_TABLE_REFERENCE_FACT LIST_TABLE_TEMPLATE_APPROVED LIST_TABLE_PROPOSED_NOT_IMPLEMENTED; do
  printf "%-40s %s\n" "$m" "$(grep -ohF "$m" "${core_docs[@]}" | wc -l)"
done
draft_marker="LIST_TABLE_TEMPLATE_""DRAFT"; grep -ohF "$draft_marker" "${core_docs[@]}" | wc -l   # 期望 0
D=docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md
printf "CH2 %s\n" "$(grep -ohF 'LIST_TABLE_SHARED_DESIGN_''APPROVED' $D | wc -l)"
printf "CH3 %s\n" "$(grep -cF 'LIST_TABLE_PROPOSED_''NOT_IMPLEMENTED' $D)"
# 代码现值
grep -c "'--lt-" frontend/src/styles/list-table/index.ts                       # 9
grep -oE '\.lt-[a-z-]+__[a-z-]+' frontend/src/styles/list-table/list-table-visual.css | sort -u  # 2 类
```

**实测结果**

| 通道 | 说明 | 本任务前 | 本任务后 | 变化 |
| --- | --- | --- | --- | --- |
| 通道 1 `LIST_TABLE_REFERENCE_FACT`（四份文档） | 参考事实 | 26 | **27** | `+1`：`DESIGN.md` §5 新增两页常规行 `~48px` 实测事实 |
| 通道 1 `LIST_TABLE_TEMPLATE_APPROVED`（四份文档） | 已批准模板规则 | 42 | **42** | 不变 |
| 通道 1 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`（四份文档） | 候选未实现 | 7 | **8** | `+1`：`DESIGN.md` §7 最小定向修订草案 |
| 通道 1 草案态标记（四份文档） | `…_DRAFT` | 0 | **0** | 不变 |
| 通道 2 `LIST_TABLE_SHARED_DESIGN_APPROVED`（`SCD`） | 批准态设计标记 | 79 | **79** | 不变（未新增/删除其实例） |
| 通道 3 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`（`SCD`） | 候选未实现 | 23（§12 内 20 + 其它 3） | **23**（§12 内 18 + **§13 内 2** + 其它 3） | **净 0**：§12.6 两段草案示例改写为现行事实 → `-2`；§13 新增 → `+2` |

**代码现值实测**：`lt_token_count = 9`（**不变**，opt-in 未新增令牌）；`lt_internal_helper_class_count = 2`
（`{lt-row-action__cell, lt-row-action__ellipsis}`，均受 `.lt-main-table` 限定）。

说明：`SCD` §11.3、§12.8 与本文件/README 各处计数**均由文件复算**，未硬编码旧值；时点值
（`26 / 0 / 42 / 7`、通道 3 `23`、helper `0`）**保留为历史实测，不回写**，现行值以本报告与各文件追加注为准。

## 8. 状态分层

| 对象 | 状态 | 说明 |
| --- | --- | --- |
| 共享基础实现 + 数据源参考页接入 | `IMPLEMENTED_ACCEPTED` / `ACCEPTED_BY_PROJECT_OWNER`（2026-09-22 最终接受） | **不变** |
| 第七轮三点 opt-in **设计基线** | 已批准（R2 口径，2026-09-29） | **不变** |
| 第七轮三点 opt-in **实现事实** | 已落地于共享 CSS 且 `/config/client` **显式接入**；`IMPLEMENTED_PENDING_CHATGPT_REVIEW` | **不变**（本任务**未**改代码） |
| 本任务新增模板整理 + 单行固定高亮**可选契约** | **`DRAFT_PENDING_USER_REVIEW`** | **本任务新增，尚待远程复审与负责人批准**；**不**预置为 `APPROVED` / `IMPLEMENTED_ACCEPTED` |
| 模板级迁移 | `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED` | 按原定义解释；**未**因 `/config/client` 单页 opt-in 静默翻转 |
| 第七轮 `CCFG-AC-155~157` | 仍 `BLOCKED`；整体验收**未**完成 | 现行统计 `PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15 = 157`；不因本任务改变 |

项目负责人目测事实（“表格高度与‘数据源管理’一致”“人工测试过，没有问题”）按**其实际检查范围**记录，
**不**等于 157 条整体验收通过。数据源页「更多」→三点改造仍属**未来独立任务**。

## 9. 不影响数据源页的证明

- 本任务**仅**改 `docs/baseline/list-table-visual-template/**` 文档；`git status` 白名单内**无**
  `frontend/**`、`docs/features/data-source-management/**`；
- `DataSourcePage.vue` 仍 `:class="['data-table', LT_MAIN_TABLE_CLASS]"`，末列为「更多」**文字**入口，
  `lt-row-action__*` 计数 `0`（第七轮只读对照实测）；
- 公共 CSS 与测试**未**改动（`git diff --stat` 不含 `frontend/**`）；
- `SHARED_COMPONENT_DESIGN.md` §13 契约表把三点入口与单行固定高亮均列为**显式 opt-in**，
  **不**对未启用页产生任何默认行为；文本中**未**把数据源页未来改造写成现行示例或授权。

## 10. 未执行项与风险

**未执行（按任务边界）**：前后端测试 / 构建、浏览器验收、服务启停、数据库 / ZooKeeper / Kafka 访问、
正式验收、任何代码 / 测试 / 共享 CSS / 页面修改、新增弹窗模板。

**风险与待澄清**：

1. `SCD` §7.1 #11 与 §12.7 “拟修订”文本里的“阶段一 / 拟值”框架属于**历史题面**；本任务以追加注澄清，
   未改写历史，读者需按“时间 + 层”阅读（已在 §3.1 与本报告说明）。
2. 单行固定高亮的**外观预设值**（`#f4f4f5` / `#e1e4e8` / `#18181b`）取自探针现行实现，
   **尚待**远程复审判断是否适合作为模板可选预设；
3. `SCD` §12.6 由“接入示例”改为“现行接入事实”后，其候选未实现标记 `-2`（通道 3 净 0），
   已在 §12.8 追加复测段与 README changelog 记录；
4. 本任务新增契约**未**经远程复审与负责人批准前，**不得**据其改变任何页面或迁移状态。

## 11. 下一入口

```text
CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_REVIEW
```

远程复审 `APPROVED` 后，**仍须项目负责人批准本草案**，新增可选契约方生效；本任务**不**触发弹窗模板创建。
