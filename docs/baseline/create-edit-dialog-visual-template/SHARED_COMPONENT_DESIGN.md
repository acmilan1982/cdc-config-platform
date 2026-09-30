# 新增／编辑业务弹窗公共视觉模板 · 公共实现详细设计（**已批准设计；公共 CSS 已实现、代码复审通过，Vue 未创建**）

```text
create_edit_dialog_visual_template_document_status=APPROVED
shared_component_design_status=APPROVED
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

> **本文件所载为已批准的设计契约。**（项目负责人 `2026-09-30` 批准设计基线）
> **实现分层**：文中约定的**公共 CSS 文件与静态契约测试**已由独立实现任务
> `CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001` 落地
> （`public_css_status=IMPLEMENTED_FIRST_PAGE_ADOPTED_PENDING_REMOTE_REVIEW`、
> `public_css_code_review_status=APPROVED`，复审日期 `2026-09-30`）。
> R0 实现提交 `c8785e1` 远程复审 `CHANGES_REQUIRED`（**17 vs 15 令牌口径**、现行文档时态自相矛盾、
> 真实 EP 状态证据不足）；已由 `...-R1` 任务**定向纠错**：§3 的 `ced-label-row` 与 §4 的
> `--ced-label-gap`、`--ced-submit-bg-loading` 两个 Feature 令牌补齐**真实消费点**，
> 令牌登记**回归到本文批准的 17 个**（13 模板 + 4 Feature），不再有「已登记但未被消费」的虚令牌；
> R1 提交 `8434b88` 远程代码复审 **`APPROVED`**。
> **公共 Vue 组件仍未创建**（`NOT_CREATED`）；项目负责人**仅**批准 `/config/client`（探针端管理）
> **新增／编辑业务主弹窗**首个接入（`page_adoption_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REMOTE_REVIEW_AND_OWNER_VISUAL_CHECK`，
> **已实现、待远程代码复审与负责人目测**；`migrated_page_count=1`）；**其余任何页面仍未获授权接入**。

---

## 0. 本文件的边界

### 0.1 不变量（必须始终成立）

- **单一视觉来源**：同一弹窗内，标签排版与主提交按钮视觉**只**由公共模板承担；
  接入页面**移除**其私有同义规则，不留两份副本。
- **显式 opt-in**：未挂根类的弹窗**零命中、零影响**。
- **零全局泄漏**：不新增裸全局 EP 覆盖；不使用 `!important`；不污染既有模板命名空间。
- **星号是纯视觉**：不得自动生成表单校验规则或隐式 `required`。
- **业务行为留 Feature**：校验规则、请求与防重、错误码映射、清除／校验时序、
  未保存确认、脏值回填、密码掩码、ID 解锁、候选项冲突、权限、提交 API 均归页面。
- **不得静默统一差异**：cc 的页面私有字段级错误与 ds 的 EP 校验 + 全局错误区**并存**，
  模板**只**提炼可共用的**视觉**，**不**强制统一实现模型。

### 0.2 设计任务当时**不**做的事（历史时点）

> 设计基线其后已由**独立批准收口任务**于 `2026-09-30` 批准；**公共 CSS 实现**已由独立实现任务落地（**并已通过远程代码复审**，`APPROVED`），但**设计任务当时未做**；**Vue 公共组件仍未创建**、**页面接入仍未发生**。

- 不创建任何 CSS／Vue 组件／类型／断言；
- 不修改任何页面或测试；
- 设计任务当时不批准基线、不授权页面接入、不给出验收结论。

### 0.3 与既有模板的关系

- 与 `list-table-visual-template`、`query-list-page-template` **正交**（弹窗层 vs 表格层／页面层），
  **不**互相并入、**不**复用其标记、类名或令牌命名空间。

---

## 1. 文件布局（已由实现任务落地，代码复审通过）

```text
frontend/src/styles/dialog/create-edit-dialog-visual.css        # 已实现：公共视觉预设（纯 CSS）
frontend/src/styles/dialog/index.ts                              # 已实现：导出根类常量与令牌清单
frontend/src/styles/dialog/create-edit-dialog-visual.spec.ts     # 已实现：静态契约测试（vitest）
frontend/src/main.ts                                             # 已修改：全局入口最小引入一次（1 行 import）
```

- 已按方案落地（`DESIGN.md` §4：最小可行纯 CSS），**未**新增任何 `.vue` 组件、**未**新增依赖或 DOM 层。
- 若未来评估后确需局部组件，须**另立**设计修订，不在本设计承诺。

---

## 2. 显式 opt-in 方式（已实现）

- 页面在**新增／编辑主弹窗**根元素挂**单一根类**（`ced-dialog`）；可选携带**数据属性**
  （`data-ced`）用于语义标注，但**类名**为唯一 opt-in 契约。
- 公共样式**一律**以根类为前缀，例如（**已实现**）：

```css
/* 已实现（frontend/src/styles/dialog/create-edit-dialog-visual.css） */
.ced-dialog .ced-form-label { /* 标签排版 */ }
.ced-dialog .ced-label-row { /* 标签行（间距由 --ced-label-gap 提供） */ }
.ced-dialog .ced-submit { /* 主提交按钮视觉 */ }
```

- **未挂根类**：以上选择器**零命中**。

---

## 3. 类名与命名空间（已实现）

| 名称 | 用途 | 状态 |
|---|---|---|
| `ced-dialog` | 显式 opt-in **根类** | **已实现** |
| `ced-form-label` | 标签（供**非 EP 表单**页面挂载，如 cc） | **已实现** |
| `ced-label-row` | 标签行容器：`display:flex; align-items:flex-start; gap: var(--ced-label-gap)`（供**非 EP 表单**页面的标签＋控件行） | **已实现** |
| `ced-submit` | 主提交按钮 | **已实现** |
| `ced-field-feedback` | 字段反馈稳定占位容器（供页面私有字段级反馈） | **已实现** |
| `ced-field-error` | 字段错误文字（红字、可换行） | **已实现** |
| `ced-field--error` | 控件错误态（红框 inset） | **已实现** |
| `ced-required-mark` | 必填星号视觉（挂在 `el-form-item` 上；**纯视觉**） | **已实现** |
| `--ced-*` | CSS 令牌命名空间 | **已实现**（17 个令牌登记，见 §4） |

- **兼容 EP 表单页面**（如 ds）：公共选择器**同时**支持 EP 原生标签
  `.el-form-item__label`，在根类作用域内命中（不新增全局覆盖）。
- 命名空间独立于 `--lt-*`（列表表格模板）与 `--qlpt-*`（查询列表页模板，若存在）等既有命名空间。
- **均已通过远程代码复审**（`public_css_code_review_status=APPROVED`，`2026-09-30`）；**未接入页面零命中**。

---

## 4. 公共视觉令牌表（已实现；共 17 个 = 13 模板 + 4 Feature）

> **登记口径**：17 个令牌均在 `frontend/src/styles/dialog/index.ts` 登记，且均在公共 CSS 中有**真实消费点**
> （已由静态契约测试断言，无「已登记但未被消费」的虚令牌）。模板令牌以行内 `var(--ced-x, 缺省)` 声明缺省；
> **4 个 Feature 令牌不声明缺省**（由接入页面提供），其中 `--ced-label-column-width`、`--ced-label-gap`、
> `--ced-dialog-safety-inset` 以**裸 `var()`** 消费，`--ced-submit-bg-loading` 以
> `var(--ced-submit-bg-loading, var(--ced-submit-bg, #09090b))` 消费（提供即按值呈现，未提供回退到按钮自身底色）。

| 令牌 | 缺省 | 归属 | 消费点（公共 CSS 选择器 → 声明） |
|---|---|---|---|
| `--ced-label-font-size` | `14px` | 模板 | `.ced-dialog .el-form-item__label, .ced-dialog .ced-form-label` → `font-size` |
| `--ced-label-font-weight` | `500` | 模板 | 同上 → `font-weight` |
| `--ced-label-color` | `#3f3f46` | 模板 | 同上 → `color` |
| `--ced-label-column-width` | *（不设缺省）* | **Feature** | `.ced-dialog .ced-form-label` → `flex: 0 0 var(--ced-label-column-width)` |
| `--ced-label-gap` | *（不设缺省）* | **Feature** | `.ced-dialog .ced-label-row` → `gap` |
| `--ced-required-mark-color` | `var(--el-color-danger)` | 模板 | `.ced-dialog .ced-form-label.ced-required-mark::before, .ced-dialog .ced-required-mark .el-form-item__label::before` → `color` |
| `--ced-submit-bg` | `#09090b` | 模板 | `.ced-dialog .ced-submit:not(.is-disabled)` → `background`/`border-color` |
| `--ced-submit-bg-hover` | `#27272a` | 模板 | `…:not(.is-disabled):hover, …:focus` → `background`/`border-color` |
| `--ced-submit-bg-active` | `#18181b` | 模板 | `…:not(.is-disabled):active` → `background`/`border-color` |
| `--ced-submit-bg-loading` | *（不设缺省；回退 `--ced-submit-bg`）* | **Feature 可选** | `.ced-dialog .ced-submit.is-loading:not(.is-disabled)` → `background`/`border-color` |
| `--ced-submit-text` | `#ffffff` | 模板 | 正常／hover／focus／active 三组 → `color` |
| `--ced-submit-radius` | `6px` | 模板 | `.ced-dialog .ced-submit:not(.is-disabled)` → `border-radius` |
| `--ced-submit-font-weight` | `500` | 模板 | 同上 → `font-weight` |
| `--ced-error-color` | `var(--el-color-danger)` | 模板 | `.ced-dialog .ced-field-error` → `color`；`.ced-dialog .ced-field--error .el-input__wrapper/.el-textarea__inner` → `box-shadow` |
| `--ced-error-font-size` | `13px` | 模板 | `.ced-dialog .ced-field-error` → `font-size` |
| `--ced-feedback-min-height` | `20px` | 模板（可选） | `.ced-dialog .ced-field-feedback` → `min-height` |
| `--ced-dialog-safety-inset` | *（不设缺省）* | **Feature** | `.ced-dialog` → `max-width: calc(100vw - var(--ced-dialog-safety-inset))` |

> **口径**：**可比对一致**者（标签排版、主提交按钮令牌序列、错误红色方向）作模板缺省（13 个模板令牌）；
> **两页取值不同者**（标签列宽、间距、弹窗宽度／安全边距、loading 配色）**一律**记为
> **Feature 级可配置值**（4 个 Feature 令牌，**不设缺省**），模板**不**把探针端专用值当作全局默认。
> 令牌计数与「无虚令牌（已登记即有消费点）」由静态契约测试断言。

---

## 5. Feature 覆盖契约（已批准设计；页面接入未授权）

- Feature 通过**在根类作用域内覆盖 `--ced-*` 变量**或**追加页面级 scoped 规则**表达差异；
  **不**复制模板的标签排版与按钮视觉规则。
- Feature **拥有**：表单结构、字段集合与顺序、字段级错误**实现模型**、
  是否使用全局错误区、校验与提交时序、全部业务语义。
- 接入时须**移除**页面私有同义视觉（见 `MIGRATION.md` §3），保证**单一视觉来源**。

---

## 6. 作用域与零泄漏规则（已实现）

- 所有模板选择器以根类为前缀；无裸全局 EP 覆盖；无 `!important`。
- **不**新增任何全局 CSS 变量到 `:root`（令牌仅在根类作用域内定义）。
- 已提供**静态契约测试**（见 §7）验证未接入页面零命中、令牌计数稳定、无 `!important`。

---

## 7. 测试与验收设计（静态契约已实现；正式验收未执行）

| 编号 | 类型 | 断言 |
|---|---|---|
| #1 | 静态契约 | 公共样式不含 `!important`（**已实现**） |
| #2 | 静态契约 | 所有 `ced-` 选择器均以 `ced-dialog` 根类为前缀（未接入零命中）（**已实现**） |
| #3 | 静态契约 | `--ced-*` 令牌集合与登记表一致（17 = 13 模板 + 4 Feature）（**已实现**） |
| #4 | 组件／静态 | 仅接入页面主弹窗挂根类；未接入页面零挂载（**页面接入未授权**，见 `MIGRATION.md`） |
| #5 | 静态契约 | 接入页面已移除私有同义标签／按钮视觉规则（无重复来源）（**页面接入未授权**） |

- **真实浏览器验收**（将来由独立任务执行）：标签对齐、按钮状态矩阵、错误呈现、
  窄视口安全边距与页脚可见性。**本设计不执行任何测试。**
- 静态契约部分已由实现任务落地为 `frontend/src/styles/dialog/create-edit-dialog-visual.spec.ts`
  （**21 条断言**）。真实浏览器部分已由 **R1 隔离合成夹具**在无头 Chrome 中，加载
  **项目当前依赖的真实 Element Plus 样式**并用**真实 Vue／EP 组件 DOM** 核对
  （`reports/evidence/...-R1/`）；上述实现与证据**均已通过远程代码复审**（`APPROVED`，`2026-09-30`）。
  **正式验收仍是独立且未执行的一步**（`formal_acceptance_execution_status=NOT_EXECUTED`）；
  **隔离夹具核对不等于探针端或数据源管理页面的目测与验收**。

---

## 8. 必须保护的 Feature 专属内容（现行事实，不得被模板覆盖）

- cc：双栏“采集数据源”选择器、候选池搜索／已分配禁选／逗号禁选、已选区红色异常回显、
  “自动生成”“修改探针 ID”与锁定提示、探针 ID 编辑校验与解锁流程、
  页面私有字段级错误与 `role="alert"`/`role="note"` 呈现、`submitAttempted` 会话内语义。
- ds：`el-form` `editorRules` 校验、全局错误区 `.form-error`、
  密码掩码与聚焦／失焦／未修改沿用、新增模式密码必填星号（条件）、
  “测试连接”区、`:before-close` 未保存确认、角色／类型联动。
- 两页共同的业务行为：可点击条件、请求与防重、错误码映射与文案、清除时机、校验时序、
  权限与提交 API。
