# 新增／编辑业务弹窗公共视觉模板 · 设计（草案）

```text
create_edit_dialog_visual_template_document_status=DRAFT_PENDING_USER_REVIEW
baseline_status=NOT_APPROVED
implementation_status=IMPLEMENTATION_NOT_STARTED
public_css_status=NOT_CREATED
public_vue_component_status=NOT_CREATED
```

> 本文件是**设计草案**。文中「**现行事实**」可由两页源码／已批准条款核验；
> 标注「**拟议**」的内容是本草案提出的契约，**尚未获批、尚未实现**。

---

## 1. 现状代码事实与条款核验（两页）

### 1.1 探针端管理主弹窗（`/config/client`）

**现行事实**（`frontend/src/views/client-config/ClientConfigPage.vue`）：

| 项 | 事实 | 位置 |
|---|---|---|
| 弹窗 | `<el-dialog class="cc-dialog" :title="mode === 'edit' ? '编辑探针' : '新增探针'" width="900px" :close-on-click-modal="false" @closed="onDialogClosed">` | 约 257–264 行 |
| 视口安全边距 | `:deep(.cc-dialog) { max-width: calc(100vw - 48px); }` | 约 1899–1901 行 |
| 表单结构 | **页面私有 flex 表单**（非 `el-form`）：`.cc-form` 为 flex column，`max-height: calc(100vh - 240px)` + `overflow-y: auto`；`.cc-form-item` 为 flex、`gap: 12px`、`align-items: flex-start` | 约 1962–1978 行 |
| 标签 | `.cc-form-label`：`flex: 0 0 84px; padding-top: 6px; font-size: 14px; font-weight: 500; color: #3f3f46; text-align: right` | 约 1985–1992 行 |
| 必填星号 | `.cc-form-label::before { content: '*'; color: #f56c6c; margin-right: 2px; }` —— **对三个标签无条件渲染**（不依赖校验语义） | 约 1994–1998 行 |
| 字段级错误（控件） | `.cc-field--error` 对 `el-input__wrapper` / `el-textarea__inner` 施加 `box-shadow: 0 0 0 1px var(--el-color-danger) inset` | 约 2043–2048 行 |
| 字段反馈稳定占位 | `.cc-field-feedback { min-height: 20px; margin-top: 2px; }`（**用最小高度，不用固定高度**） | 约 2053–2056 行 |
| 字段错误文字 | `.cc-field-error`：`font-size: 13px; line-height: 1.4; color: var(--el-color-danger); overflow-wrap: anywhere`；模板中 `role="alert"` | 约 2065–2071 行；模板 295/320/399 行 |
| 字段提示（中性） | `.cc-field-hint`：`color: #909399`，模板 `role="note"` | 约 2073–2079 行；模板 398–399 行 |
| 主提交按钮 | `.cc-dialog-submit`：`:not(.is-disabled)` 为 `#09090b` 底／边框 + `#ffffff` 字 + `border-radius: 6px` + `font-weight: 500`；hover/focus `#27272a`；active `#18181b` | 约 1907–1926 行 |
| 加载态 | `.cc-dialog-submit.is-loading`：`#3f3f46` 底 + `::before` 遮罩置透明（**为避免正常态黑与 EP 蓝跳色**而显式指定） | 约 1934–1951 行 |
| 否决项 | 本弹窗**无**全局错误区域（页面顶端临时消息已被 `CCFG-REQ-123` 取消） | — |

**条款**：`CCFG-REQ-116/119/120/123/124/128/130/137/138`、`CCFG-UI-045/046/047/050/051/055/057`、`CCFG-DESIGN-056/059/061/062/066/068/072/073`。

### 1.2 数据源管理主弹窗（`/config/data-source`）

**现行事实**（`frontend/src/views/data-source/DataSourcePage.vue`）：

| 项 | 事实 | 位置 |
|---|---|---|
| 弹窗 | `<el-dialog :title="isEdit ? '编辑数据源' : '新增数据源'" width="620px" destroy-on-close :close-on-click-modal="false" :before-close="onEditorBeforeClose" class="editor-dialog" @closed="onEditorClosed">` | 约 190–199 行 |
| 表单结构 | **Element Plus `el-form`**：`<el-form ref="editorFormRef" :model :rules="editorRules" label-width="120px" label-position="right" class="editor-form" v-loading="editorLoading">` | 约 200–208 行 |
| 标签 | `:deep(.editor-dialog .el-form-item__label) { font-size: 14px; font-weight: 500; color: #3f3f46; }` | 约 1861–1865 行 |
| 必填星号 | `:deep(.editor-dialog .editor-password-required-mark .el-form-item__label)::before { content: "*"; color: var(--el-color-danger); margin-right: 4px; }`——**条件类**（仅新增模式的密码项）；源码注释明确**不使用 `el-form-item` 的 `required`**，避免生成隐式校验规则 | 约 1871–1875 行 |
| 字段提示 | `.field-tip { font-size: 12px; line-height: 1.4; color: var(--el-text-color-secondary); margin-top: 2px; }` | 约 1877–1882 行 |
| 字段校验反馈 | 由 `el-form` 的 `rules` 驱动，呈现为 EP 原生字段错误（模板各 `el-form-item` 带 `prop`） | 模板 209–269 行 |
| **全局错误区域** | `<div v-if="editorFormError" class="form-error" role="alert">`；`.form-error { margin: 8px 0 0; padding: 6px 10px; font-size: 13px; line-height: 1.4; color: var(--el-color-danger); background: var(--el-color-danger-light-9); border-radius: 4px; }` | 模板 272 行；样式 1884–1892 行 |
| 附加区 | `.test-bar`（“测试连接”按钮 + 结果）以 `padding-left: 120px` 与控件列对齐 | 模板 274–290 行；样式 1894–1900 行 |
| 主提交按钮 | `:deep(.editor-dialog .editor-submit-button:not(.is-disabled))` 为 `#09090b` 底／边框 + `#ffffff` 字 + `border-radius: 6px` + `font-weight: 500`；hover/focus `#27272a`；active `#18181b` | 约 1724–1743 行 |
| 加载态 | 无**配色专属**规则（依赖 EP 默认加载态） | — |

**条款**：`DS-REQ-185`（标签文字规格与作用域限制）、`DS-REQ-186`（密码必填标识与真实校验一致）、`DS-REQ-187`（提交按钮文案与视觉）。

---

## 2. 候选公共能力：一致与差异（如实记录）

**说明**：下列「可比对一致」只表示**两页现行规格在视觉上可比对一致**，
**不**表示两页已经共用同一个组件或同一份 CSS。

| 能力 | 两页现行位置 | 一致（可比对） | 差异（必须保留为页面级） |
|---|---|---|---|
| 配置项标签 | cc `.cc-form-label`（约 1985 行）；ds `.editor-dialog .el-form-item__label`（约 1861 行） | 字号／字重／颜色 `14px / 500 / #3f3f46`；均**右对齐**；必填红星均在名称**前**且为红色 | 标签列宽：cc `84px` 固定 vs ds `label-width: 120px`；实现载体：cc 页面私有 `.cc-form-label` vs ds EP `.el-form-item__label`；标签与控件间距：cc `gap: 12px` vs ds 由 `label-width` 隐含 |
| 必填星号 | cc `.cc-form-label::before`（约 1994 行，**无条件**）；ds `.editor-password-required-mark …::before`（约 1871 行，**条件**） | 均在标签**前**；均为红色（cc `#f56c6c`，ds `var(--el-color-danger)`） | cc **无条件**渲染三处星号；ds **仅新增模式密码**渲染；**星号不得自动生成表单校验规则**（ds 源码注释显式说明） |
| 主提交按钮 | cc `.cc-dialog-submit`（约 1907 行）；ds `.editor-dialog .editor-submit-button`（约 1724 行） | 完整令牌序列一致：正常 `#09090b`／hover+focus `#27272a`／active `#18181b`／文字 `#ffffff`／圆角 `6px`／字重 `500`；文案按模式 `创建`／`保存`；`:not(.is-disabled)` 限定正常态 | cc 显式指定 loading 配色 `#3f3f46` 并置 EP 遮罩透明；ds **无** loading 配色规则；作用域载体不同（`.cc-dialog-submit` vs `.editor-submit-button`）；派生按钮（“取消”“自动生成”“修改探针 ID”“测试连接”）**均不**跟随变黑（两页一致） |
| 字段错误反馈 | cc `.cc-field--error` + `.cc-field-feedback`（约 2043–2071 行）；ds `el-form` `rules` 原生字段错误 + 全局 `.form-error`（约 1884 行，模板 272 行） | 均为**红框 + 字段下方红色文字**的呈现方向；均要求错误文字可换行、不被硬裁剪 | **实现模型不同**：cc 为**页面私有字段级**组件化呈现（inset 红框 + 稳定占位 + `role="alert"`），**无全局错误区**；ds 为 **EP `el-form` 校验**驱动，**并另有**独立**全局错误区域** `.form-error`（`role="alert"`，用于网络／系统级或无法归属字段的错误）。**不得**声称两页已共用字段错误组件 |
| 中性字段提示 | cc `.cc-field-hint`（`#909399`，`role="note"`）；ds `.field-tip`（`12px`，secondary 色） | 均为**弱化色**的字段级辅助文字，位于控件附近 | 类名、字号与色值不同（cc `13px` vs ds `12px`）；cc 在反馈区（`role="note"`）、ds 在控件下方独立块 |
| 弹窗容器与响应式 | cc `max-width: calc(100vw - 48px)`（约 1900 行）；ds 无 `max-width` 规则 | 均 `:close-on-click-modal="false"`；均要求标题／关闭／页脚可见可操作 | 宽度：cc `900px` vs ds `620px`；cc 表单区自带 `max-height + overflow-y: auto`，ds 由 EP 与 `destroy-on-close` 承担；ds 另有 `:before-close` 未保存确认（业务行为） |
| 可访问性 | cc `role="alert"`（错误）／`role="note"`（提示）；ds `.form-error role="alert"` + EP 原生 | 关键错误均有 `role="alert"` 级可访问提示 | 字段错误与字段的**显式关联**（如 `aria-describedby`）两页均**未**见显式实现，属**拟议**改进项 |

**结论（材料性差异）**：两页在**标签排版**与**主提交按钮视觉**上**规格一致**，
可作为公共视觉契约的事实基础；但在**字段错误反馈的实现模型**、
**标签列宽**、**弹窗宽度**、**是否含全局错误区**与**loading 配色**上**存在实质差异**，
这些差异**必须**作为 Feature 级可配置项或页面私有保留，**不得**由模板静默统一。

---

## 3. 拟议的显式 opt-in 契约

> 以下全部为**拟议**，`NOT_CREATED`。

- **显式 opt-in 根类**（拟议）：仅在页面的**新增／编辑主弹窗**根元素上挂一个**模板命名空间的根类**
  （拟议 `ced-dialog`，`ced` = create/edit dialog）。**未挂该根类的弹窗零影响**：
  模板选择器**一律**以该根类为前缀，不做裸全局 EP 覆盖、不使用 `!important`。
- **单一视觉来源**（拟议）：一旦页面接入，模板负责标签排版与主提交按钮**视觉**；
  页面**移除**其对应的私有同义视觉规则（见 `MIGRATION.md` §3 的消除步骤），
  避免「模板 + 页面私有」两份同义规则并存。
- **Feature 可配置值**（拟议，通过 CSS 自定义属性由 Feature 覆盖，模板提供缺省值）：
  - 标签列宽（cc `84px` / ds `120px` 为**两页现行值，不是全局定值**）；
  - 标签与控件间距（cc `12px`；ds 由 `label-width` 隐含）；
  - 弹窗宽度与视口安全边距（cc `900px` / `calc(100vw - 48px)`；ds `620px`）；
  - 字段错误反馈**是否**采用页面私有字段级呈现，或沿用 EP `el-form` 校验；
  - 是否保留**全局错误区域**。
- **责任归属**：
  - **模板**：标签排版（字号／字重／颜色／右对齐／星号位置与颜色）、
    主提交按钮的**视觉状态矩阵**（正常／hover／focus／active／loading／disabled）、
    错误呈现的**视觉规格**、弹窗**安全边距与内容滚动原则**、基础可访问性**视觉**要求。
  - **Feature（页面）**：表单结构与字段集合、可点击条件、请求与防重、
    错误码映射与文案、错误清除时机、校验时序、未保存确认、脏值与回填、
    密码掩码、ID 解锁、候选项冲突、权限与提交 API。
- **星号语义边界**（拟议，硬约束）：模板仅提供星号的**视觉**；
  **星号视觉不得自动产生表单校验规则**，必填语义仍由 Feature 的真实校验决定
  （沿用 `DS-REQ-186` 的口径：不得用纯文本伪造星号、不得因星号生成隐式 `required`）。
- **回退路径**（拟议）：页面**移除根类**即回到接入前视觉，
  模板**不**依赖 JS 运行时，卸载后无残留选择器命中。

---

## 4. 实现方案选择（拟议：最小可行）

| 方案 | 代价 | 结论 |
|---|---|---|
| **A. 纯 CSS 预设（根类 + CSS 自定义属性）** | 最低：单文件 CSS、显式 opt-in、零运行时、无新 DOM 层、易回退 | **拟议采用（最小可行）** |
| B. 局部布局组件（标签行／字段行小组件） | 中：需定义 props/slots 与 EP 透传，cc 与 ds 表单结构差异大 | 拟议**暂不**采用；仅在 A 不足以覆盖时再评估 |
| C. 完整业务弹窗 wrapper（Vue 弹窗组件） | 最高：会把 Feature 业务行为（校验／请求／时序）吸进公共组件，风险大 | 拟议**不**采用 |

**最小可行建议（拟议）**：先以**方案 A** 落地标签排版与主提交按钮两组**可比对一致**的视觉；
字段错误反馈与弹窗容器**只提炼视觉规格与原则**，
**不**强制统一两页的实现模型（cc 页面私有字段级 vs ds EP 校验 + 全局错误区）。
**本草案不预先承诺通用 Vue 弹窗组件。**

---

## 5. 本轮明确不做的事

- **不**创建任何 CSS／Vue 组件／类型／断言；
- **不**修改任何页面、测试、配置、依赖；
- **不**批准任何基线、**不**授权任何页面接入、**不**给出任何正式验收结论；
- **不**把两页差异静默统一，**不**把探针端专用布局当作所有弹窗默认值。
