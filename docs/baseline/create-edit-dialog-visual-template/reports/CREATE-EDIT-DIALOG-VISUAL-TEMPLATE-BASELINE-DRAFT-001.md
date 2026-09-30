# 新增／编辑业务弹窗公共视觉模板 · 设计基线草案报告

```text
task_code=CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001
task_type=DOCS_ONLY_TEMPLATE_BASELINE_DRAFT
branch=develop
base_commit_id=d5c12f376a50fe7602edec146bdc8d4ebb8d9507
create_edit_dialog_visual_template_document_status=DRAFT_PENDING_USER_REVIEW
baseline_status=NOT_APPROVED
approval_status=NOT_APPROVED
implementation_status=IMPLEMENTATION_NOT_STARTED
public_css_status=NOT_CREATED
public_vue_component_status=NOT_CREATED
page_adoption_authorization_status=PAGE_ADOPTION_NOT_AUTHORIZED
migrated_page_count=0
current_next_entry=CHATGPT_REMOTE_CREATE_EDIT_DIALOG_VISUAL_TEMPLATE_BASELINE_DRAFT_REVIEW
```

> 本报告只记录**纯文档草案任务**的事实与产物。**不**创建任何公共 CSS／Vue 组件／测试，
> **不**修改任何业务页面，**不**代表任何基线已批准、任何页面已接入或任何正式验收已通过。

---

## 1. 任务边界（本任务做了什么、没做什么）

**做了**：新建 `docs/baseline/create-edit-dialog-visual-template/`，为**新增／编辑业务主弹窗**建立
**可复审的设计契约草案**（六份文档），并在 `docs/baseline/README.md` 增加**一条**标注为草案的导航补充。

**没做**：

- 未创建任何 CSS、Vue 组件、Composable、TypeScript 类型、静态断言或测试文件；
- 未修改 `frontend/**`、`backend/**`、测试代码、依赖、锁文件或任何配置；
- 未修改任何业务页面；
- 未运行测试、构建、浏览器、正式验收，未启停任何服务；
- 未访问数据库 / ZooKeeper / Kafka / 业务源库 / 目标库，未发业务写请求；
- 未修改六份项目级基线、`docs/features/**` 正式定义或验收状态格、`list-table-visual-template/**`；
- 未回写任何历史报告。

## 2. 事实与推断分层

本目录严格分两层，**不得混同**：

| 层 | 内容 | 依据 |
|---|---|---|
| **现行事实** | 两页弹窗的代码事实与已批准条款 | 两页源码行号（见 §3 来源映射）与 Feature 条款编号 |
| **拟议（设计推断）** | 公共契约、类名、令牌、静态断言、Vue 组件 | 本草案提出，全部 `NOT_CREATED` |

- 所有**拟议值**（`ced-dialog`、`ced-form-label`、`ced-submit`、`ced-field-feedback`、`--ced-*` 令牌、
  §7 静态断言 #1–#5、拟议文件路径）在文中一律显式标注「拟议」并给出 `NOT_CREATED`。
- **未**引入 `LIST_TABLE_*` 标记通道；本目录使用 `create_edit_dialog_visual_template_*` 前缀状态键，
  与表格模板命名空间隔离。

## 3. 来源映射（现行事实逐条对应）

| 候选能力 | 探针端管理来源 | 数据源管理来源 | 条款 |
|---|---|---|---|
| 弹窗根类／宽度 | `ClientConfigPage.vue` 约 257–264 行（`class="cc-dialog" width="900px"`）；安全边距约 1899–1901 行 | `DataSourcePage.vue` 约 190–199 行（`class="editor-dialog" width="620px"`，无 `max-width`） | `CCFG-REQ-116/128`；`DS-REQ-185/187` |
| 配置项标签 | `.cc-form-label` 约 1985–1992 行（`14px / 500 / #3f3f46 / text-align:right`，列宽 `flex: 0 0 84px`） | `.editor-dialog .el-form-item__label` 约 1861–1865 行（`14px / 500 / #3f3f46`，`label-width="120px"`） | `CCFG-UI-045/046/047`；`DS-REQ-185` |
| 必填星号 | `.cc-form-label::before` 约 1994–1998 行（`#f56c6c`，**无条件**三处） | `.editor-password-required-mark …::before` 约 1871–1875 行（`var(--el-color-danger)`，**条件**，源码注释明确不用 EP `required`） | `DS-REQ-186` |
| 主提交按钮 | `.cc-dialog-submit` 约 1907–1926 行（`#09090b` / hover+focus `#27272a` / active `#18181b` / `#ffffff` / `6px` / `500`）；loading 约 1934–1951 行（`#3f3f46` + 遮罩透明） | `.editor-dialog .editor-submit-button` 约 1724–1743 行（同一令牌序列）；**无** loading 配色规则 | `CCFG-DESIGN-056/059/061/062/066/068/072/073`；`DS-REQ-187` |
| 字段错误反馈 | `.cc-field--error` 约 2043–2048 行、`.cc-field-feedback` 约 2053–2056 行、`.cc-field-error` 约 2065–2071 行（`role="alert"`）；**无**全局错误区 | `el-form` `rules` 原生字段错误；全局 `.form-error` 约 1884–1892 行（模板约 272 行，`role="alert"`） | `CCFG-REQ-123/124/130/137/138`；`DS-REQ-185` |
| 字段提示（中性） | `.cc-field-hint` 约 2073–2079 行（`#909399`，`role="note"`） | `.field-tip` 约 1877–1882 行（`12px`，secondary 色） | — |
| 弹窗容器与响应式 | `.cc-dialog` `max-width: calc(100vw - 48px)` 约 1900 行；`.cc-form` `max-height: calc(100vh - 240px)` + `overflow-y: auto` 约 1962 行 | 无 `max-width`；由 EP 与 `destroy-on-close` 承担；`:before-close` 未保存确认（业务） | `CCFG-UI-050/051/055/057` |
| 可访问性 | 字段错误 `role="alert"`／提示 `role="note"` | 全局错误 `role="alert"` + EP 原生；两页字段错误与字段**均未见**显式 `aria-describedby` 关联 | — |

## 4. 两页最关键的事实差异（材料性）

**可比对一致**（可作公共视觉契约的事实基础）：配置项标签**排版**（字号／字重／颜色 `14px / 500 / #3f3f46`，
均右对齐，必填红星均在名称前且为红色）与**主提交按钮令牌序列**（正常 `#09090b`／hover+focus `#27272a`／
active `#18181b`／文字 `#ffffff`／圆角 `6px`／字重 `500`，`:not(.is-disabled)` 限定正常态）。

**实质差异**（**必须**作 Feature 级配置或页面私有保留，**不得**由模板静默统一）：

| 差异项 | 探针端管理 | 数据源管理 |
|---|---|---|
| 表单载体 | 页面私有 flex 表单 | EP `el-form`（`rules` / `label-width`） |
| 标签列宽 | `84px` | `120px` |
| 弹窗宽度 | `900px`（+`calc(100vw - 48px)`） | `620px`（无 `max-width`） |
| 字段错误实现模型 | 页面私有字段级（inset 红框 + 稳定占位 + `role="alert"`） | EP `el-form` 校验原生 |
| 全局错误区 | **无** | **有**（`.form-error`，`role="alert"`） |
| loading 配色 | 显式 `#3f3f46` + 遮罩透明 | 无专门规则 |

> **不得**声称两页已共用字段错误组件；**不得**要求所有业务错误都变字段错误；
> **不得**把探针端 `84px` / `900px` 或数据源管理 `120px` / `620px` 写成所有弹窗的全局定值。

## 5. 冲突与待审点

- **能力边界（需复审确认）**：草案主张最小可行**只**提炼标签排版与主提交按钮两组**可比对一致**的视觉；
  字段错误反馈与弹窗容器**只**提炼视觉规格与原则，**不**强制统一两页实现模型。
- **命名空间（拟议，待批）**：根类 `ced-dialog`、令牌 `--ced-*` 均为拟议，与 `--lt-*`（表格模板）
  及查询列表页模板命名空间独立；**未创建**。
- **数据订阅新增／编辑弹窗**：`SubscribeFormDialog.vue` 为**候选（未评估）**——
  本草案未读取其样式与条款，**候选不等于已判定适用**。
- **无冲突发现**：`docs/baseline/` 下**不存在**既有弹窗模板或与本草案相冲突的现行基线；本草案与
  `list-table-visual-template`（表格层）、`query-list-page-template`（页面层）**正交**（弹窗层）。

## 6. 产出与变更清单

新增目录 `docs/baseline/create-edit-dialog-visual-template/`：

| 文件 | 职责 |
|---|---|
| `README.md` | 任务边界、证据来源、文档导航、状态分层与下一入口 |
| `DESIGN.md` | 两页现状代码事实、一致与差异、显式 opt-in 契约、公共／Feature 归属、实现方案选择 |
| `UI.md` | 候选视觉规格、主提交按钮状态矩阵、响应式与可访问性、零泄漏约束 |
| `SHARED_COMPONENT_DESIGN.md` | 未来实现边界、作用域／零泄漏约束、可选能力与不变量、测试验收设计（拟议） |
| `MIGRATION.md` | 全量盘点矩阵、两页各自现状、未来选择性接入步骤与未授权状态 |
| `reports/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001.md` | 本报告 |

修改：`docs/baseline/README.md` —— 新增**一条**「新增／编辑弹窗公共视觉模板基线入口（**草案**）」
导航补充，明确标注 `DRAFT_PENDING_USER_REVIEW` / `NOT_APPROVED` / `PAGE_ADOPTION_NOT_AUTHORIZED`。

## 7. 保护核验（未改动的正式内容）

- 六份项目级基线（`PROJECT/ENVIRONMENT/ARCHITECTURE/DEVELOPMENT_RULES/PROJECT_STATUS/DOMAIN_GLOSSARY`）：**未改**。
- `docs/features/**` 正式定义行与验收状态格：**未改**；未因本任务增加或上调任何正式验收结果。
- `docs/baseline/list-table-visual-template/**` 与 `query-list-page-template/**`：**未改**。
- 表格模板标记通道（`LIST_TABLE_*` / `list_table_visual_template_*` 状态键、公共 `--lt-*` 令牌、
  内部辅助类、`!important` 计数）：**未触碰**。
- 历史报告：**未回写**。

## 8. 未执行项

- 未创建公共 CSS／Vue 组件／类型／断言／测试（`public_css_status=NOT_CREATED`、`public_vue_component_status=NOT_CREATED`）；
- 未迁移任何页面（`migrated_page_count=0`、`PAGE_ADOPTION_NOT_AUTHORIZED`）；
- 未运行测试／构建／浏览器／正式验收；未启停服务；未访问数据库／ZooKeeper／Kafka；
- 未作基线批准、未作任何正式验收结论。

## 9. 下一入口

```text
current_next_entry=CHATGPT_REMOTE_CREATE_EDIT_DIALOG_VISUAL_TEMPLATE_BASELINE_DRAFT_REVIEW
```

先由 ChatGPT **从远程 Git** 对草案做独立复审；通过后再由**项目负责人批准**；
然后**另立**公共实现任务与各页选择性接入任务。

> **草案通过远程复审 ≠ 获批 ≠ 公共实现已存在 ≠ 任何页面已接入 ≠ 正式验收通过。**
