# 新增／编辑业务弹窗公共视觉模板 · 公共实现详细设计（**草案**，未实现）

```text
create_edit_dialog_visual_template_document_status=DRAFT_PENDING_USER_REVIEW
shared_component_design_status=DRAFT_PENDING_USER_REVIEW
baseline_status=NOT_APPROVED
approval_status=NOT_APPROVED
implementation_status=IMPLEMENTATION_NOT_STARTED
public_css_status=NOT_CREATED
public_vue_component_status=NOT_CREATED
page_adoption_authorization_status=PAGE_ADOPTION_NOT_AUTHORIZED
```

> **本文件全部内容为拟议，尚未实现、尚未获批。**
> 文中出现的**文件路径、类名、CSS 令牌、静态断言、测试**均为**未来拟实施目标**，
> 其存在性一律为 `NOT_CREATED`。**不得**把本文件读作「公共 CSS 已存在」或「已批准设计」。

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

### 0.2 本设计**不**做的事

- 不创建任何 CSS／Vue 组件／类型／断言；
- 不修改任何页面或测试；
- 不批准基线、不授权页面接入、不给出验收结论。

### 0.3 与既有模板的关系

- 与 `list-table-visual-template`、`query-list-page-template` **正交**（弹窗层 vs 表格层／页面层），
  **不**互相并入、**不**复用其标记、类名或令牌命名空间。

---

## 1. 未来文件布局（拟议）

> 以下路径**均为拟议**，当前**不存在**。

```text
frontend/src/styles/dialog/create-edit-dialog-visual.css        # 拟议：公共视觉预设（纯 CSS）
frontend/src/styles/dialog/index.ts                              # 拟议：导出根类常量等（可选）
frontend/src/styles/dialog/create-edit-dialog-visual.spec.ts     # 拟议：静态契约测试（vitest）
```

- 拟**不**新增任何 `.vue` 组件；方案见 `DESIGN.md` §4（最小可行：纯 CSS 预设）。
- 若未来评估后确需局部组件，须**另立**设计修订，不在本草案承诺。

---

## 2. 显式 opt-in 方式（拟议）

- 页面在**新增／编辑主弹窗**根元素挂**单一根类**（拟议 `ced-dialog`）；可选携带**数据属性**
  （拟议 `data-ced`）用于语义标注，但**类名**为唯一 opt-in 契约。
- 公共样式**一律**以根类为前缀，例如（拟议）：

```css
/* 拟议（未创建） */
.ced-dialog .ced-form-label { /* 标签排版 */ }
.ced-dialog .ced-submit { /* 主提交按钮视觉 */ }
```

- **未挂根类**：以上选择器**零命中**。

---

## 3. 类名与命名空间（拟议）

| 名称 | 用途 | 状态 |
|---|---|---|
| `ced-dialog` | 显式 opt-in **根类** | 拟议 · `NOT_CREATED` |
| `ced-form-label` | 标签（供**非 EP 表单**页面挂载，如 cc） | 拟议 · `NOT_CREATED` |
| `ced-submit` | 主提交按钮 | 拟议 · `NOT_CREATED` |
| `ced-field-feedback` | 字段反馈稳定占位容器（供页面私有字段级反馈） | 拟议 · `NOT_CREATED` |
| `--ced-*` | CSS 令牌命名空间 | 拟议 · `NOT_CREATED` |

- **兼容 EP 表单页面**（如 ds）：拟议公共选择器**同时**支持 EP 原生标签
  `.el-form-item__label`，在根类作用域内命中（拟议，不新增全局覆盖）。
- 命名空间独立于 `--lt-*`（列表表格模板）与 `--qlpt-*`（查询列表页模板，若存在）等既有命名空间。

---

## 4. 公共视觉令牌表（拟议，全部 `NOT_CREATED`）

| 令牌 | 拟议缺省 | 归属 | 备注 |
|---|---|---|---|
| `--ced-label-font-size` | `14px` | 模板 | 两页一致 |
| `--ced-label-font-weight` | `500` | 模板 | 两页一致 |
| `--ced-label-color` | `#3f3f46` | 模板 | 两页一致 |
| `--ced-label-column-width` | *（不设全局缺省）* | **Feature** | cc `84px`／ds `120px` 为现行值，**非全局定值** |
| `--ced-label-gap` | *（不设全局缺省）* | **Feature** | cc `12px`；ds 由 `label-width` 隐含 |
| `--ced-required-mark-color` | `var(--el-color-danger)` | 模板 | 拟议统一取危险色；cc 现为 `#f56c6c` |
| `--ced-submit-bg` | `#09090b` | 模板 | 两页一致 |
| `--ced-submit-bg-hover` | `#27272a` | 模板 | 两页一致 |
| `--ced-submit-bg-active` | `#18181b` | 模板 | 两页一致 |
| `--ced-submit-bg-loading` | *（不设全局缺省）* | **Feature 可选** | cc 现为 `#3f3f46`；ds 无 |
| `--ced-submit-text` | `#ffffff` | 模板 | 两页一致 |
| `--ced-submit-radius` | `6px` | 模板 | 两页一致 |
| `--ced-submit-font-weight` | `500` | 模板 | 两页一致 |
| `--ced-error-color` | `var(--el-color-danger)` | 模板 | 两页一致的**方向** |
| `--ced-error-font-size` | `13px` | 模板 | cc 现为 `13px` |
| `--ced-feedback-min-height` | `20px` | 模板（可选） | cc 现为 `20px`；用最小高度 |
| `--ced-dialog-safety-inset` | *（不设全局缺省）* | **Feature** | cc 现为 `48px`；ds 无 |

> **口径**：**可比对一致**者（标签排版、主提交按钮令牌序列、错误红色方向）拟作模板缺省；
> **两页取值不同者**（标签列宽、间距、弹窗宽度、安全边距、loading 配色）**一律**记为
> **Feature 级可配置值**，模板**不**设全局缺省、**不**把探针端专用值当作全局默认。

---

## 5. Feature 覆盖契约（拟议）

- Feature 通过**在根类作用域内覆盖 `--ced-*` 变量**或**追加页面级 scoped 规则**表达差异；
  **不**复制模板的标签排版与按钮视觉规则。
- Feature **拥有**：表单结构、字段集合与顺序、字段级错误**实现模型**、
  是否使用全局错误区、校验与提交时序、全部业务语义。
- 接入时须**移除**页面私有同义视觉（见 `MIGRATION.md` §3），保证**单一视觉来源**。

---

## 6. 作用域与零泄漏规则（拟议）

- 所有模板选择器以根类为前缀；禁止裸全局 EP 覆盖；禁止 `!important`。
- 拟**不**新增任何全局 CSS 变量到 `:root`（令牌仅在根类作用域内定义）。
- 拟提供**静态契约测试**（见 §7）验证未接入页面零命中、令牌计数稳定、无 `!important`。

---

## 7. 测试与验收设计（拟议；本设计只设计，不执行）

| 编号（拟议） | 类型 | 断言（拟议） |
|---|---|---|
| #1 | 静态契约 | 公共样式不含 `!important` |
| #2 | 静态契约 | 所有 `ced-` 选择器均以 `ced-dialog` 根类为前缀（未接入零命中） |
| #3 | 静态契约 | `--ced-*` 令牌集合与登记表一致 |
| #4 | 组件／静态 | 仅接入页面主弹窗挂根类；未接入页面零挂载 |
| #5 | 静态契约 | 接入页面已移除私有同义标签／按钮视觉规则（无重复来源） |

- **真实浏览器验收**（拟议，将来由独立任务执行）：标签对齐、按钮状态矩阵、错误呈现、
  窄视口安全边距与页脚可见性。**本草案不执行任何测试。**
- 以上编号、断言均为**拟议**，**尚未**进入任何测试文件。

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
