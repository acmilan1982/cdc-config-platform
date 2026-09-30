# 新增／编辑业务弹窗公共视觉模板 · 设计基线草案 R1 报告（两处定向纠错）

```text
task_code=CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001-R1
task_type=DOCS_ONLY_TARGETED_CORRECTION
branch=develop
base_commit_id=ad7a4b741714a229a8a8a250f8ee960447e33355
r0_remote_review_status=CHANGES_REQUIRED
r0_remote_review_scope=CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001
create_edit_dialog_visual_template_document_status=DRAFT_PENDING_USER_REVIEW
baseline_status=NOT_APPROVED
approval_status=NOT_APPROVED
implementation_status=IMPLEMENTATION_NOT_STARTED
public_css_status=NOT_CREATED
public_vue_component_status=NOT_CREATED
page_adoption_authorization_status=PAGE_ADOPTION_NOT_AUTHORIZED
migrated_page_count=0
current_next_entry=CHATGPT_REMOTE_CREATE_EDIT_DIALOG_VISUAL_TEMPLATE_BASELINE_DRAFT_R1_REVIEW
```

> 本报告只记录**纯文档定向纠错**。**不**批准草案、**不**实现 CSS／Vue、**不**接入任何页面。
> **R0 的 `CHANGES_REQUIRED` 不等于 R1 已获 `APPROVED`。**
> R0 报告 `...-BASELINE-DRAFT-001.md` 保留为**历史快照**，本报告对其不准确结论作**勘误**，**不回写** R0。

---

## 1. 任务边界（R1 做了什么、没做什么）

**做了**：针对 ChatGPT 从远程 Git 复审 R0（`ad7a4b7`）返回的两处阻塞
（R1-01 差异值的缺省口径、R1-02 真实可执行的回退路径）作**定向文档纠错**，
并同步 README 复审时序／报告导航／下一入口。

**没做**：

- 未创建任何 CSS、Vue 组件、类型、断言或测试；未修改 `frontend/**`、`backend/**`、配置、依赖；
- 未迁移任何页面；未运行测试／构建／lint／浏览器／正式验收；未启停服务；
- 未访问数据库 / ZooKeeper / Kafka，未发业务写请求；
- 未批准基线、未授权任何页面接入、未作任何正式验收结论；
- 未修改六份项目级基线、`docs/features/**` 定义行与验收状态格、`list-table-visual-template/**`、
  `docs/baseline/README.md` 草案导航（R0 已足够，不为 R1 增加重复入口）；未回写历史报告。

## 2. R1-01：差异值的缺省口径

**阻塞（R0 现状）**：`DESIGN.md` §3 的「Feature 可配置值」条目写「…由 Feature 覆盖，**模板提供缺省值**」，
把标签列宽、间距、弹窗宽度／安全边距、loading 配色等**两页不一致**的差异值混入模板缺省，
与 `SHARED_COMPONENT_DESIGN.md` §4 令牌表、`UI.md` §1 明确「这些差异值**不设全局缺省值**」相矛盾。

**旧文本（`DESIGN.md` §3，R0）**：

```text
- **Feature 可配置值**（拟议，通过 CSS 自定义属性由 Feature 覆盖，模板提供缺省值）：
  - 标签列宽（cc `84px` / ds `120px` 为**两页现行值，不是全局定值**）；
  - 标签与控件间距（cc `12px`；ds 由 `label-width` 隐含）；
  - 弹窗宽度与视口安全边距（cc `900px` / `calc(100vw - 48px)`；ds `620px`）；
  - 字段错误反馈**是否**采用页面私有字段级呈现，或沿用 EP `el-form` 校验；
  - 是否保留**全局错误区域**。
```

**新文本（`DESIGN.md` §3，R1）**：改为「**缺省口径与 Feature 决定值**」：

- **拟议缺省视觉**（仅将来获批后适用）：**两页可比对一致**的标签字号／字重／颜色
  （`14px / 500 / #3f3f46`）与**黑色主提交按钮色阶**（正常／hover／focus／active 令牌序列）可作模板拟议缺省。
- **两页不一致的值由 Feature 显式决定**，模板**不**提供缺省值：标签列宽、标签与控件间距、
  弹窗宽度与视口安全边距；如将来用 CSS 自定义属性承载，**值由接入页面提供**；
  而弹窗宽度、EP `label-width` 这类**可能仍由组件属性或页面布局承载**，**不强制**都变为 CSS 变量；
  **没有 Feature 值时，不得通过臆造模板默认值改变现有页面**。
- **属页面选择、不写成模板默认行为**：字段错误的**实现模型**、**是否**保留全局错误区域、
  **是否**显式设置 loading 配色。

## 3. R1-02：真实可执行的回退路径

**阻塞（R0 现状）**：`DESIGN.md` §3 的「回退路径」写「页面**移除根类**即回到接入前视觉」，
但 `MIGRATION.md` §3 要求接入时**移除**页面私有的同义标签／按钮视觉规则——
故**仅移除 opt-in 根类**会失去原有样式，**无法**还原原观感。

**旧文本（`DESIGN.md` §3，R0）**：

```text
- **回退路径**（拟议）：页面**移除根类**即回到接入前视觉，
  模板**不**依赖 JS 运行时，卸载后无残留选择器命中。
```

**新文本（`DESIGN.md` §3，R1）**：明确「仅移除根类不足」，正确回退须**同时**：

1. **移除**页面的 opt-in 根类及接入时新增的模板辅助类／引用；
2. **恢复**迁移前已移除的页面私有同义视觉规则，以及页面差异值的**原承载方式**；
3. 按**接入前基线**核对标签排版、主提交按钮**各状态**、错误呈现、窄视口行为与**未接入页面零影响**。

并注明：描述与**将来 CSS 引入机制**匹配，模板**不**依赖 JS 运行时，**本轮仅文档拟议，未实测回退**。

**`MIGRATION.md` 新增 §3.1「拟议回退流程（可逆闭环，未实测）」**：在正向接入步骤后补入对应回退步骤，
与「第 4 步先删除私有同义规则、保持单一视觉来源」形成**可逆闭环**；
并明确 **不得**在接入后的正常运行中**同时**保留公共与私有**两套**同义样式（否则构成双视觉来源），
回退是「移除公共 + 恢复私有」的一次性切换；将来回退同样须**单独授权**。

## 4. 变更清单

| 文件 | 变更 |
|---|---|
| `docs/baseline/create-edit-dialog-visual-template/DESIGN.md` | §3「Feature 可配置值」→「缺省口径与 Feature 决定值」（R1-01）；§3「回退路径」改写为可执行回退三步（R1-02） |
| `docs/baseline/create-edit-dialog-visual-template/MIGRATION.md` | 未来接入步骤后新增 §3.1 拟议回退流程（R1-02） |
| `docs/baseline/create-edit-dialog-visual-template/README.md` | 状态块 `current_next_entry` 改为 R1 复审入口；边界块补「复审时序」（R0 复审 `CHANGES_REQUIRED` 两处阻塞 + R1 未获批）；§6 文档导航补 R1 报告行 |
| `docs/baseline/create-edit-dialog-visual-template/reports/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001-R1.md` | 新建（本报告） |

**未改**：`SHARED_COMPONENT_DESIGN.md`、`UI.md` —— 经复核，二者对差异值的表述
（令牌表「不设全局缺省」／归属 Feature；UI §1.1 标签列宽「Feature 级可配置」、
§1.2 loading「Feature 可选」、§1.3 全局错误区「Feature 可选」）**已与 R1-01 口径一致、清晰准确**，
按提示词「如已有清晰准确文本则不改它们」，作**最小化**处理，**不**改。
`docs/baseline/README.md` 草案导航**已足够**，**未**为 R1 增加重复入口。

## 5. 保护核验（未改动的正式内容）

- 六份项目级基线：**未改**。
- `docs/features/**` **定义行与验收状态格**：**未改**；未因本任务增加或上调任何正式验收结果。
- `docs/baseline/list-table-visual-template/**` 与 `query-list-page-template/**`：**未改**；
  表格模板标记通道、`--lt-*` 令牌、`!important` 计数**未触碰**。
- R0 报告：**未回写**（保留为历史快照）。
- 范围边界：新增／编辑**主弹窗**与确认框／子弹窗的边界**保持**；
  探针端与数据源管理**现行实现事实**（差异表）**保持**。

## 6. 状态与未执行项

- 草案状态维持：`DRAFT_PENDING_USER_REVIEW` / `NOT_APPROVED` / `IMPLEMENTATION_NOT_STARTED` /
  `PAGE_ADOPTION_NOT_AUTHORIZED`；`public_css_status=NOT_CREATED`、
  `public_vue_component_status=NOT_CREATED`、`migrated_page_count=0`。
- 未创建 CSS／Vue／类型／断言／测试；未迁移页面；未运行测试／构建／lint／浏览器／正式验收；
  未启停服务；未访问数据库／ZooKeeper／Kafka；未发业务写请求。
- **R0 `CHANGES_REQUIRED` ≠ R1 已获 `APPROVED`**；R1 仍待远程独立复审与项目负责人批准。

## 7. 下一入口

```text
current_next_entry=CHATGPT_REMOTE_CREATE_EDIT_DIALOG_VISUAL_TEMPLATE_BASELINE_DRAFT_R1_REVIEW
```

先由 ChatGPT **从远程 Git** 对 R1 做独立复审；通过后再由**项目负责人批准**；
然后**另立**公共实现任务与各页选择性接入任务。
