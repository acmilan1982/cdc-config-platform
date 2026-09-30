# 探针端管理新增／编辑弹窗公共预设首个接入 R1 · 文档口径定向纠错报告

```text
task_code=CREATE-EDIT-DIALOG-CLIENT-CONFIG-FIRST-ADOPTION-001-R1
task_type=PURE_DOCUMENTATION_TARGETED_CORRECTION
base_commit_id=d878c3d7c95b482ee47b2d08571531cbad3b06fd
r0_review_scope=ab4d49766d089c741159c2c86861f6af7e74b29b..d878c3d7c95b482ee47b2d08571531cbad3b06fd
r0_review_conclusion=CHANGES_REQUIRED
r0_review_finding_scope=DOCUMENTATION_ONLY_NO_CODE_BLOCKER
code_verification_rerun=NOT_EXECUTED_IN_THIS_TASK
owner_visual_check=NOT_EXECUTED_IN_THIS_TASK
formal_acceptance_execution_status=NOT_EXECUTED
migrated_page_count=1
migrated_page_count_scope=REAL_BUSINESS_PAGES_WITH_CED_DIALOG_ROOT_CLASS_OPT_IN
public_vue_component_status=NOT_CREATED
next_entry=CHATGPT_REMOTE_CREATE_EDIT_DIALOG_CLIENT_CONFIG_FIRST_ADOPTION_R1_REVIEW
```

## 1. 本任务的性质与边界

本任务是对首个页面接入提交 `d878c3d7c95b482ee47b2d08571531cbad3b06fd` 的**纯文档定向纠错**。

ChatGPT 从远程 Git 对区间
`ab4d49766d089c741159c2c86861f6af7e74b29b..d878c3d7c95b482ee47b2d08571531cbad3b06fd`
复审的结论为 `CHANGES_REQUIRED`：**产品代码接入、测试与只读浏览器证据未发现需改代码的阻塞项**，
但模板设计契约仍留有「页面接入未授权」等与「仅探针端主弹窗已获授权并接入」冲突的过时**现行**表述。

- 本任务**只改文档**口径；**不**重跑代码验收、**不**做项目负责人目测、**不**执行正式验收。
- **提交/推送成功不等于 R1 复审通过。**

## 2. 开工门禁与基准

| 项 | 值 |
|---|---|
| 基准 SHA | `d878c3d7c95b482ee47b2d08571531cbad3b06fd` |
| 分支 | `develop` |
| `origin/develop`／远程 `refs/heads/develop` | `d878c3d7c95b482ee47b2d08571531cbad3b06fd`（与基准一致，未前进） |
| ahead/behind | `0 0` |
| 工作区既有无关内容 | `.claude/settings.local.json`（既有修改）、`docs/prompts/`、`runtime-logs/`——**原样保留**，未 `reset/clean/stash`，未 `git add -A` |

## 3. R0 复审定位的现行矛盾

| 文件 | 位置 | 错误口径 |
|---|---|---|
| `docs/baseline/create-edit-dialog-visual-template/DESIGN.md` | §3「单一视觉来源」 | 写「已批准设计；页面接入未授权」 |
| 同文件 | §5（历史时点段） | 句中「页面接入仍未发生」无时点限制 |
| `docs/baseline/create-edit-dialog-visual-template/SHARED_COMPONENT_DESIGN.md` | §5 标题 | 写「已批准设计；页面接入未授权」 |
| 同文件 | §7 断言 #4／#5 | 括注「页面接入未授权」 |

同时对两份文档的**现行**正文定向搜索，找出其他无历史时点限定、仍宣称「页面均未授权／零页接入」的句子，
逐处按事实最小纠正。**另发现** `SHARED_COMPONENT_DESIGN.md` §0.2（历史时点段）与 DESIGN.md §5 同类问题，一并最小纠正。

## 4. 逐位置 旧 → 新 表

| # | 文件 | 位置 | 旧 | 新 |
|---|---|---|---|---|
| 1 | `DESIGN.md` | §3「单一视觉来源」（约 L114） | 「（已批准设计；**页面接入未授权**）：**一旦页面接入**，模板负责…」 | 「（已批准设计；**现行仅探针端新增／编辑主弹窗已接入**，其余页面仍未授权）：**接入后**模板负责…」 |
| 2 | `DESIGN.md` | §5（历史时点，约 L170-172） | 「…**Vue 公共组件仍未创建**，**页面接入仍未发生**（`PAGE_ADOPTION_NOT_AUTHORIZED`，采用决定 `NOT_DECIDED_NOT_GRANTED`）。」 | 「…**R0 设计任务当时页面接入尚未发生**（当时 `PAGE_ADOPTION_NOT_AUTHORIZED`…）；其后**仅**探针端管理（`/config/client`）新增／编辑主弹窗已获授权并接入（`migrated_page_count=1`，待远程复审与负责人目测），其余页面**仍未授权**。**Vue 公共组件仍未创建**（现行事实）。」 |
| 3 | `SHARED_COMPONENT_DESIGN.md` | §0.2（历史时点，L58） | 「…但**设计任务当时未做**；**Vue 公共组件仍未创建**、**页面接入仍未发生**。」 | 「…但**设计任务当时未做**。**R0 设计任务当时页面接入尚未发生**；其后**仅**探针端管理（`/config/client`）新增／编辑主弹窗已获授权并接入（`migrated_page_count=1`），其余页面仍未授权。**Vue 公共组件仍未创建**（现行事实）。」 |
| 4 | `SHARED_COMPONENT_DESIGN.md` | §5 标题（L158） | 「## 5. Feature 覆盖契约（已批准设计；**页面接入未授权**）」 | 「## 5. Feature 覆盖契约（已批准设计；**页面级已接入 1 个、其余页面未授权**）」 |
| 5 | `SHARED_COMPONENT_DESIGN.md` | §7 #4（L183） | 「仅接入页面主弹窗挂根类；未接入页面零挂载（**页面接入未授权**，见 `MIGRATION.md`）」 | 「仅授权接入页面主弹窗挂根类；其余页面零挂载（**现行**：`/config/client` 新增／编辑主弹窗已挂载，其余页面零挂载；由静态契约测试 #19 白名单断言与只读浏览器证据核对）」 |
| 6 | `SHARED_COMPONENT_DESIGN.md` | §7 #5（L184） | 「接入页面已移除私有同义标签／按钮视觉规则（无重复来源）（**页面接入未授权**）」 | 「接入页面已移除私有同义标签／按钮视觉规则（无重复来源）（**现行**：`/config/client` 接入页已移除，由页面静态断言与只读浏览器证据核对）」 |
| 7 | `README.md`（模板） | 文首状态块（L24） | `current_next_entry=…_FIRST_ADOPTION_REVIEW` | `current_next_entry=…_FIRST_ADOPTION_R1_REVIEW` |
| 8 | `README.md`（模板） | blockquote 下一入口（L99-103） | 下一入口为 `…_FIRST_ADOPTION_REVIEW` | 新增「页面接入复审时序」段（R0 `CHANGES_REQUIRED` 记为**历史**）；下一入口改为 `…_R1_REVIEW` |
| 9 | `README.md`（模板） | §6 导航 `MIGRATION.md` 行 | 「两页各自现状、未来选择性接入步骤与**未授权状态**」 | 「两页各自现状、选择性接入步骤，以及**首个页面接入与其他页面未授权**的分层时序」 |
| 10 | `README.md`（模板） | §6 导航（新增行） | — | 新增 R1 报告交叉引用行 |
| 11 | `docs/baseline/README.md` | 状态块（L101） | `current_next_entry=…_FIRST_ADOPTION_REVIEW` | `current_next_entry=…_FIRST_ADOPTION_R1_REVIEW` |
| 12 | `docs/baseline/README.md` | CEDVT 入口「下一入口」（L116-119） | 下一入口为 `…_FIRST_ADOPTION_REVIEW` | 新增「页面接入代码复审时序」（R0 `CHANGES_REQUIRED` 历史）；下一入口改为 `…_R1_REVIEW` |
| 13 | `docs/features/client-config/README.md` | §1.15「下一入口」（L570） | 下一入口为 `…_FIRST_ADOPTION_REVIEW` | 新增「页面接入代码复审时序」（R0 `CHANGES_REQUIRED` 历史）；下一入口改为 `…_R1_REVIEW`，并交叉引用 R1 报告 |
| 14 | `docs/features/client-config/README.md` | §5（L789） | 「现行下一入口…：`…_FIRST_ADOPTION_REVIEW`（对象为任务 `…-001`…）」 | 改为 `…_R1_REVIEW`（对象为 R1 纠错任务）；附 R0 `CHANGES_REQUIRED` 为**历史**的说明 |
| 15 | `docs/features/client-config/README.md` | §2 导航（新增行） | — | 新增 R1 报告行 |

> 未改：`MIGRATION.md`（定向搜索未发现无历史限定的「页面接入未授权／零页接入／未选定首个接入页」现行表述；
> 其 §3 标题与 §5 已按「探针端已实施、其余页面未授权、模板级批量迁移与试点未作出」分层，无需勘误）。

## 5. 现行 / 历史分层（纠错口径）

| 键 | 语义 | 值 |
|---|---|---|
| `page_adoption_authorization_status` | 现行页面级授权 | `PAGE_ADOPTION_AUTHORIZED_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY` |
| `page_adoption_decision_status` | 现行页面级采用决定 | `DECIDED_AND_GRANTED_FOR_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY` |
| `page_adoption_implementation_status` | 现行接入实现 | `IMPLEMENTED_PENDING_CHATGPT_REMOTE_REVIEW_AND_OWNER_VISUAL_CHECK` |
| `migrated_page_count` | 现行已挂 opt-in 根类的真实业务页数 | `1` |
| `PAGE_ADOPTION_NOT_AUTHORIZED`／`NOT_DECIDED_NOT_GRANTED` | **R0 设计任务当时**的时点状态 | 历史，保留于历史时点段 |
| 模板级「页面迁移/试点」键 | **模板级批量迁移**（与单页接入不同层） | `NOT_STARTED`／`NOT_GRANTED`／`NOT_DECIDED` **保持原措辞** |
| R0 接入复审结论 | 历史 | `CHANGES_REQUIRED`（仅文档口径，无代码阻塞项） |

## 6. 定义行与 157 条验收状态格保护

- `docs/features/client-config/{REQUIREMENTS,ACCEPTANCE,DESIGN,UI}.md` **本任务未修改**（逐字节原样）。
- 四类定义行编号总数仍为 `REQ 154 / AC 157 / DESIGN 89 / UI 77`。
- 157 条 AC 状态格按仓库当前 `ACCEPTANCE.md` §1.24 复算为
  **`PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15`（合计 157）**，与接入前一致，**零变化**。
- **本纯文档纠错不构成任何 AC 的 `PASS`。**
- 页面接入报告与原始证据未回写；`reports/evidence/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001/SHA256SUMS.txt`
  校验仍 `OK`。

## 7. 变更文件

- `docs/baseline/create-edit-dialog-visual-template/DESIGN.md`
- `docs/baseline/create-edit-dialog-visual-template/SHARED_COMPONENT_DESIGN.md`
- `docs/baseline/create-edit-dialog-visual-template/README.md`
- `docs/baseline/README.md`
- `docs/features/client-config/README.md`
- `docs/features/client-config/reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001-R1.md`（本报告，新建）

## 8. 未执行项

- 未改 `frontend/**`、`backend/**`、公共 CSS、Vue 组件、测试、配置、依赖、其他模板、项目级基线。
- 未运行测试、构建、lint、浏览器或正式验收；未启停服务；未访问数据库 / ZooKeeper / Kafka。
- 未改批准设计的视觉值、17 个令牌、7 个辅助类、断言契约、四个 Feature 决定值与业务行为。
- 未做项目负责人目测；未重跑代码验收。

## 9. 下一入口

`CHATGPT_REMOTE_CREATE_EDIT_DIALOG_CLIENT_CONFIG_FIRST_ADOPTION_R1_REVIEW`

> **R1 纠错提交并推送 ≠ R1 远程复审通过 ≠ 项目负责人目测通过 ≠ 157 条整体正式验收通过。**
