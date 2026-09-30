# 新增／编辑业务弹窗公共视觉模板 · UI（已批准基线；公共 CSS 已实现、代码复审通过，Vue 未创建）

```text
create_edit_dialog_visual_template_document_status=APPROVED
baseline_status=APPROVED
approval_status=APPROVED_BY_PROJECT_OWNER
approval_date=2026-09-30
approved_reviewed_commit=45ce16dffbf2747abeb75d4d6c43bc57165043c8
implementation_status=PUBLIC_CSS_IMPLEMENTED_VUE_NOT_CREATED
public_css_status=IMPLEMENTED_FIRST_PAGE_ADOPTED_PENDING_REMOTE_REVIEW
public_css_code_review_status=APPROVED
public_css_code_review_date=2026-09-30
public_css_code_review_objects=c8785e18dc3014396cf45534315ab0f10dbbe94d,8434b884904a34bed51a2d8364e217efb605f06c
public_css_code_review_scope=PURE_CSS_PRESET_ROOT_CLASS_OPT_IN_17_TOKENS_REAL_EP_STATE_FIX_ZERO_PAGE_ADOPTION
public_css_status_before_review=IMPLEMENTED_PENDING_CHATGPT_REMOTE_CODE_REVIEW
public_vue_component_status=NOT_CREATED
formal_acceptance_execution_status=NOT_EXECUTED
page_adoption_authorization_status=PAGE_ADOPTION_AUTHORIZED_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY
page_adoption_decision_status=DECIDED_AND_GRANTED_FOR_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY
page_adoption_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REMOTE_REVIEW_AND_OWNER_VISUAL_CHECK
migrated_page_count=1
migrated_page_count_scope=REAL_BUSINESS_PAGES_WITH_CED_DIALOG_ROOT_CLASS_OPT_IN
```

> **现行事实**部分引自两页源码；标注「**拟议**」的候选规格自 `2026-09-30` 批准后即为
> **已批准的设计契约**——「未获批」仅适用于批准前的历史时点。
> **实现分层**：所约定的公共 CSS 视觉规格已由独立实现任务落地并**已通过远程代码复审**
> （`public_css_code_review_status=APPROVED`）；
> **Vue 组件仍未创建**；**首个页面已接入**（**仅** `/config/client` 新增／编辑主弹窗，
> **已实现、待远程代码复审与负责人目测**；`migrated_page_count=1`），**其余页面仍未授权**。
> 本文件**不**给出像素级的「全局定值」——凡两页取值不同者，一律记为 **Feature 级可配置值**。

---

## 1. 视觉规格（已批准设计；公共 CSS 已实现）

### 1.1 配置项标签（已批准设计；已实现）

| 属性 | 拟议缺省 | 两页现行事实 | 归属 |
|---|---|---|---|
| 字号 | `14px` | cc `.cc-form-label` 14px；ds `.el-form-item__label` 14px | 模板缺省（可比对一致） |
| 字重 | `500` | cc 500；ds 500 | 模板缺省 |
| 颜色 | `#3f3f46` | cc；ds | 模板缺省 |
| 字体族 | 页面**默认无衬线** | 两页均为默认无衬线（**不**套用等宽粗体） | 模板缺省 |
| 对齐 | **右对齐**（右边缘整齐、左边缘允许参差） | cc `text-align: right`；ds `label-position="right"` | 模板缺省 |
| 标签列宽 | **Feature 级可配置**（模板给变量，不给数值默认约束） | cc `84px`；ds `120px` | **Feature** |
| 标签－控件间距 | **Feature 级可配置**（公共 CSS 已提供消费点：接入时挂 `.ced-label-row`，间距由 `--ced-label-gap` 提供；**无默认值**，未提供时退回初始值、不改动布局） | cc `12px`（flex gap）；ds 由 `label-width` 隐含 | **Feature** |
| 必填星号位置 | 名称**前** | 两页一致 | 模板缺省 |
| 必填星号颜色 | 红色（拟议用 `var(--el-color-danger)` 或等价危险色） | cc `#f56c6c`；ds `var(--el-color-danger)` | 模板缺省 |

> **硬边界（拟议）**：星号是**纯视觉**；**不得**因星号自动产生校验规则或隐式 `required`（`DS-REQ-186` 口径）。
> 是否需要星号由 Feature 决定（cc 现行**无条件**；ds 现行**仅新增模式密码**）——模板**不**规定条件。

### 1.2 主提交按钮状态矩阵（已批准设计；已实现）

主提交按钮为弹窗页脚右侧、“创建／保存”按钮。**仅**该按钮采用黑底预设；
“取消”与派生按钮（“自动生成”“修改探针 ID”“测试连接”等）**不**跟随。

| 状态 | 拟议规格 | 两页现行事实 |
|---|---|---|
| 正常 | 底／边框 `#09090b`，文字 `#ffffff`，圆角 `6px`，字重 `500` | cc 与 ds **一致** |
| hover | 底／边框 `#27272a`，文字 `#ffffff` | cc 与 ds **一致** |
| focus | 底／边框 `#27272a`（与 hover 同），文字 `#ffffff` | cc 与 ds **一致** |
| active（按下） | 底／边框 `#18181b`，文字 `#ffffff` | cc 与 ds **一致** |
| loading | **Feature 可选**是否显式指定配色；**未提供时不跳色**——公共 CSS（已实现）以 `.ced-submit.is-loading:not(.is-disabled)` 取 `var(--ced-submit-bg-loading, var(--ced-submit-bg, #09090b))` 回退到按钮自身底色，**公共缺省不含** cc 的 `#3f3f46`（探针端专用值） | cc 显式 `#3f3f46` 并置 EP 遮罩透明；ds **无**该规则 |
| disabled | **沿用 Element Plus 既有禁用视觉**，正常态规则**不得**覆盖（`:not(.is-disabled)` 限定）；不得呈现为可点的黑色实心 | cc 与 ds **一致** |

> **可点击条件**归 **Feature**：表单不完整时按钮是否可点、何时禁用，
> 由 Feature 决定（cc 现行 `CCFG-REQ-124`：常态**始终可点**，点击后再显示字段级错误）。
> 模板**只**定义视觉，**不**定义可点击性。

### 1.3 字段错误反馈（视觉规格：已批准设计、已实现；实现模型：Feature）

| 项 | 拟议视觉规格 | 两页现行事实 |
|---|---|---|
| 控件错误态 | 控件呈**红色边框**（拟议复用 `var(--el-color-danger)`；不硬编码、不用 `!important`） | cc `.cc-field--error` 以 `box-shadow: 0 0 0 1px var(--el-color-danger) inset` 呈现；ds 由 EP 校验呈现 |
| 错误文字位置 | 该控件**正下方** | 两页一致的**方向** |
| 错误文字规格 | 拟议 `13px` / 行高 `1.4` / 危险色；**可换行**（`overflow-wrap: anywhere`），**不得**硬裁剪 | cc `.cc-field-error` 完全符合；ds EP 原生 + 全局区 |
| 稳定占位 | **拟议**：反馈区预留稳定空间（拟议 `min-height: 20px` + `margin-top: 2px`），状态切换时页脚／底边**不跳动**；**用最小高度而非固定高度**，真实换行文案完整可读 | cc `.cc-field-feedback` 完全符合；ds 由 EP 承担 |
| 全局错误区域 | **Feature 可选**：用于网络／系统级或无法归属字段的错误 | cc **无**；ds **有** `.form-error`（`role="alert"`） |

> **重要（不得声称共用）**：cc 为**页面私有字段级**呈现，ds 为 **EP `el-form` 校验 + 独立全局错误区**。
> 模板**不**要求两页共用字段错误组件，**不**要求所有业务错误都归为字段错误。
> 业务错误码映射、清除时机与校验时序归 Feature。

### 1.4 中性字段提示（已批准设计：可选能力；公共 CSS **未提供**该类）

- 两页均有**弱化色字段辅助文字**（cc `.cc-field-hint` `#909399` `13px`；ds `.field-tip` secondary `12px`）。
- 模板可提供**中性的辅助文字视觉**（弱化色、可换行），但**文案与语义归 Feature**；
  模板**不**规定提示内容，也**不**强制统一字号。**本轮公共 CSS 未实现该可选块**（无 `ced-*` 提示类），
  如需启用须另立实现。

---

## 2. 弹窗容器与响应式（原则，非定值）

| 原则（已批准设计；安全边距由 `--ced-dialog-safety-inset` 承载，已实现） | 两页现行事实 |
|---|---|
| 保留**左右视口安全边距**，窄视口按可用空间收缩、**不横向溢出** | cc `max-width: calc(100vw - 48px)`；ds 无该规则（宽度更小） |
| 内容区**受控纵向滚动**，标题、右上角关闭按钮与页脚按钮**任意视口可见可操作** | cc `.cc-form` `max-height: calc(100vh - 240px)` + `overflow-y: auto`；ds 由 EP 承担 |
| 弹窗宽度、字段数量、双栏选择器、附加“测试连接”区与布局**归 Feature** | cc `900px` + 双栏数据源选择器；ds `620px` + `.test-bar` |

> **Teleport 作用域提醒（技术约束，现行事实）**：Element Plus `el-dialog`／MessageBox 默认经 Teleport 挂到
> `body`，页面 `scoped` 样式需以 `:deep()` 或**弹窗根类**命中；
> 公共模板**一律**以根类为前缀，**不使用裸全局 EP 覆盖、不使用 `!important`**（已实现）。

---

## 3. 可访问性与交互边界

| 项 | 拟议 | 两页现行事实 |
|---|---|---|
| 错误的可访问提示 | 关键错误使用 `role="alert"` 或等效 | cc 字段错误 `role="alert"`（提示为 `role="note"`）；ds 全局错误 `role="alert"` |
| 字段错误与字段关联 | **拟议改进**：以 `aria-describedby` 等显式关联 | 两页均**未见**显式关联（**拟议**项） |
| 焦点可见 | 模板**不**移除焦点可见；按钮／可交互元素保留可见焦点 | 两页沿用 EP 默认 |
| 键盘可达 | 页脚按钮与表单控件键盘可达 | 两页沿用 EP 默认 |

**仍归 Feature（不形成公共模板默认业务行为）**：关闭未保存确认、
回填与脏值、密码掩码、ID 解锁、候选项冲突、权限、提交 API、
必填语义与校验规则。

---

## 4. 零泄漏约束（已批准设计；公共 CSS 已实现、代码复审通过）

- 模板选择器**一律**以显式 opt-in 根类为前缀；**未接入页面零命中**（已按真实浏览器证据核验，见 `reports/`）。
- 不新增裸全局 EP 覆盖；不使用 `!important`；不新增 `pointer-events`／`::before` 覆盖（星号除外）。
- 不新增 `--lt-*` 等既有模板命名空间的令牌；使用独立命名空间 `--ced-*`（**已实现**：17 个令牌登记，见 `SHARED_COMPONENT_DESIGN.md` §4）。
- 接入页面**移除**其私有同义视觉规则，保证**单一视觉规则来源**（见 `MIGRATION.md` §3）。
