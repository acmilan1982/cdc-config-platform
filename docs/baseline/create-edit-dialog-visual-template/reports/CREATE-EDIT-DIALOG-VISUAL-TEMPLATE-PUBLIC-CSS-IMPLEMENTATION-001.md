# 新增／编辑业务弹窗公共视觉模板 · 公共 CSS 实现报告

```text
task_code=CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001
task_type=PUBLIC_CSS_IMPLEMENTATION
branch=develop
base_commit_id=500ac3cd2c58df05927d3aa17add46b4123a3e9a
scope=CREATE_EDIT_BUSINESS_MAIN_DIALOG_VISUAL_ONLY_PURE_CSS
create_edit_dialog_visual_template_document_status=APPROVED
create_edit_dialog_visual_template_approval_status=APPROVED_BY_PROJECT_OWNER
implementation_status=PUBLIC_CSS_IMPLEMENTED_VUE_NOT_CREATED
public_css_status=IMPLEMENTED_PENDING_CHATGPT_REMOTE_CODE_REVIEW
public_vue_component_status=NOT_CREATED
page_adoption_authorization_status=PAGE_ADOPTION_NOT_AUTHORIZED
migrated_page_count=0
formal_acceptance_execution_status=NOT_EXECUTED
current_next_entry=CHATGPT_REMOTE_CREATE_EDIT_DIALOG_VISUAL_TEMPLATE_PUBLIC_CSS_IMPLEMENTATION_REVIEW
```

> **本报告记录纯 CSS 公共预设的实现。**
> **公共 CSS 已实现 ≠ 已通过远程代码复审 ≠ Vue 组件已存在 ≠ 页面已接入 ≠ 正式验收通过。**
> 本任务**未修改任何业务页面**、**未授权也不会授权任何页面接入**。

---

## 1. 开工门禁

- 仓库 `/agent/cdc-config-platform`，分支 `develop`；
- 本地 `HEAD`、`origin/develop`、远程 `refs/heads/develop` 三方均为预期批准收口提交
  `500ac3cd2c58df05927d3aa17add46b4123a3e9a`（无前进、无分叉，可安全快进）；
- 任务前既有无关内容 `.claude/settings.local.json`、`docs/prompts/**`、`runtime-logs/**`
  全程原样保留、未暂存、未修改；
- 批准依据：R2 修订基线 `45ce16dffbf2747abeb75d4d6c43bc57165043c8` 的远程文档复审 `APPROVED`
  + 项目负责人 `2026-09-30` 明确批准；本任务提示词**单独授权公共 CSS 实现**，**不授权**任何页面接入；
- 前端预检：Node v24.17.0、npm 11.13.0；`node_modules` 存在，未重复执行 `npm install`。

## 2. 实现范围与文件

**实际变更文件（4 个）**

| 文件 | 变更 |
|---|---|
| `frontend/src/styles/dialog/create-edit-dialog-visual.css` | **新建**：纯 CSS 公共视觉预设（全仓唯一来源） |
| `frontend/src/styles/dialog/index.ts` | **新建**：导出根类常量与 `--ced-*` 令牌登记（无 import、无副作用） |
| `frontend/src/styles/dialog/create-edit-dialog-visual.spec.ts` | **新建**：静态契约测试（vitest，18 条断言） |
| `frontend/src/main.ts` | **修改**：全局入口**一行**最小引入 `import './styles/dialog/create-edit-dialog-visual.css'` |

**范围边界（严格保持）**：`frontend/src/views/**` 下**未修改任何页面或弹窗组件**
（尤其 `/config/client`、`/config/data-source`、数据订阅弹窗）；未移除任何页面私有规则；
未挂载 `.ced-dialog`；未变更 API／数据库／ZooKeeper／Kafka；**未新增**依赖、锁文件变更、
`.vue` 组件、JS 运行时或 DOM 层。

## 3. 类名与令牌清单

### 3.1 显式 opt-in 与辅助类

| 名称 | 用途 |
|---|---|
| `ced-dialog` | 显式 opt-in **根类**（唯一挂载契约；未挂者零命中） |
| `ced-form-label` | 页面私有表单的标签（如探针端管理 `.cc-form-label` 形态） |
| `ced-submit` | 主提交（创建／保存）按钮 |
| `ced-field-feedback` | 字段反馈稳定占位容器 |
| `ced-field-error` | 字段错误文字 |
| `ced-field--error` | 控件错误态（红色内描边） |
| `ced-required-mark` | 必填星号的**显式 opt-in** 标记（挂于私有标签或 EP 表单项） |

### 3.2 `--ced-*` 令牌（已实现 15）

**模板自有 13（消费点均带内联默认值；公共层不声明其值）**

| 令牌 | 缺省 |
|---|---|
| `--ced-label-font-size` | `14px` |
| `--ced-label-font-weight` | `500` |
| `--ced-label-color` | `#3f3f46` |
| `--ced-required-mark-color` | `var(--el-color-danger)` |
| `--ced-submit-bg` | `#09090b` |
| `--ced-submit-bg-hover` | `#27272a` |
| `--ced-submit-bg-active` | `#18181b` |
| `--ced-submit-text` | `#ffffff` |
| `--ced-submit-radius` | `6px` |
| `--ced-submit-font-weight` | `500` |
| `--ced-error-color` | `var(--el-color-danger)` |
| `--ced-error-font-size` | `13px` |
| `--ced-feedback-min-height` | `20px` |

**Feature 决定值 2（无缺省，值由接入页面提供；未提供时对应声明回退为初始值、不构成约束）**

| 令牌 | 消费点 |
|---|---|
| `--ced-label-column-width` | `.ced-form-label { flex: 0 0 var(--ced-label-column-width) }`（EP 表单页仍由 `label-width` 属性承载） |
| `--ced-dialog-safety-inset` | `.ced-dialog { max-width: calc(100vw - var(--ced-dialog-safety-inset)) }` |

### 3.3 实现取舍（与已批准设计登记表的差异，不扩大契约）

已批准设计 `SHARED_COMPONENT_DESIGN.md` §4 登记 17 个令牌；本轮**实现 15 个**，**未**实现 2 个：

- `--ced-label-gap`：**未实现**。标签与控件间距在方案 A（纯 CSS、无布局组件）下无自然公共消费点——
  两页分别由页面 flex `gap` 与 EP `label-width` 承载，设计亦声明「弹窗宽度、EP `label-width`
  这类可能仍由组件属性或页面布局承载，**不强制**都变为 CSS 变量」。以 CSS 变量强加间距会引入设计
  明确**暂不采用**的「标签行／字段行布局组件」语义，故**留 Feature 承载**。
- `--ced-submit-bg-loading`：**未实现**。prompt §2 的公共缺省清单**不含** loading；
  设计将该配色列为 **Feature 可选**（探针端 `#3f3f46`、数据源管理无）。纯 CSS 无法按「令牌是否设置」
  条件生效：以无回退 `var()` 消费会使未设置页面的 `background` 在计算值阶段回退为初始值（透明），
  反而破坏 EP 既有加载视觉。故**留 Feature**（公共层不触碰 `.is-loading`）。

> 因此令牌登记改为 **15**，`index.ts` 登记与 CSS 实际**逐一相符**（静态契约测试第 3 条）。
> 该取舍**不**新增视觉值、不改变任何已批准设计契约的实质条款。

## 4. CSS 引入方式与作用域／零泄漏规则

- 因本任务禁改业务页面，无法沿用表格模板的「逐页 `<style scoped src>`」机制；
  经**现有构建机制**在前端全局入口 `main.ts` **只做一次最小引入**（1 行）。
- 全局引入后**全部**选择器均以根类 `.ced-dialog` **前置限定**，故使用**普通后代选择器**
  （**不**使用 `:deep()`、**不**使用裸全局 EP 覆盖、**不**使用 `!important`、**不**新增 `:root` 全局令牌）。
- **未挂根类的弹窗零命中、零视觉变化**：所有规则的每条选择器首段均为 `.ced-dialog`。

选择器清单（按序）：

```text
.ced-dialog
.ced-dialog .el-form-item__label, .ced-dialog .ced-form-label
.ced-dialog .ced-form-label
.ced-dialog .ced-form-label.ced-required-mark::before, .ced-dialog .ced-required-mark .el-form-item__label::before
.ced-dialog .ced-submit:not(.is-disabled)
.ced-dialog .ced-submit:not(.is-disabled):hover, .ced-dialog .ced-submit:not(.is-disabled):focus
.ced-dialog .ced-submit:not(.is-disabled):active
.ced-dialog .ced-field-feedback
.ced-dialog .ced-field-error
.ced-dialog .ced-field--error .el-input__wrapper, .ced-dialog .ced-field--error .el-textarea__inner
```

## 5. 各状态表现

### 5.1 静态契约测试（`create-edit-dialog-visual.spec.ts`，18/18 通过）

覆盖：根类限定（每条选择器首段）、令牌登记与 CSS 实际一致、无 `!important`／裸全局 EP 覆盖／
`:root|html|body|*` 规则、无禁止业务前缀与业务文案、无 `@import`／`.vue`／路由元数据、
无硬编码差异字面量（`84px`／`120px`／`900px`／`620px`／`calc(100vw - 48px)`）、
主提交按钮 `:not(.is-disabled)` 边界与**不触碰 loading**、星号仅显式 opt-in 且**不产生校验规则／隐式 `required`**、
**未接入页面零挂载**、公共规则**全仓唯一来源**、全局入口**仅一次**引入。

### 5.2 隔离合成夹具 · 真实浏览器（无头 Chrome 148.0.7778.167，经 CDP 读真实计算样式）

夹具为**合成结构**（私有 flex 表单标签 + EP `el-form-item__label`），标签文案为中性占位文本；
**不加载任何业务页面、不使用业务数据、不发任何写请求**。
证据与复算脚本见 `reports/evidence/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001/`。

| 验证项 | 计算样式实测 | 结论 |
|---|---|---|
| 私有表单标签 `.ced-form-label` | `14px / 500 / rgb(63,63,70) / text-align:right`，`flex-basis:84px`（由 Feature 值传入） | 与设计一致 |
| EP 标签 `.el-form-item__label` | `14px / 500 / rgb(63,63,70) / text-align:right` | 与设计一致 |
| 星号（`ced-required-mark`） | 私有标签与 EP 表单标签 `::before` 均为 `content:"*"`、`rgb(245,108,108)`；**未挂标记**的标签 `content:normal`（无星号） | 仅显式 opt-in 渲染 |
| 主按钮正常态 | `background/border rgb(9,9,11)`、`color rgb(255,255,255)`、`border-radius 6px`、`font-weight 500` | 与设计一致 |
| 主按钮 hover | `rgb(39,39,42)` + 白字（CDP 强制 `:hover`） | 与设计一致 |
| 主按钮 focus | `rgb(39,39,42)` + 白字（CDP 强制 `:focus`） | 与设计一致 |
| 主按钮 active | `rgb(24,24,27)` + 白字（CDP 强制 `:active`） | 与设计一致 |
| 主按钮 disabled | `rgba(239,239,239,0.3)`、`font-weight 400`（EP／UA 既有禁用视觉，**非黑**） | `:not(.is-disabled)` 保护生效 |
| 主按钮 loading | `rgb(9,9,11)`（**仅**正常态规则命中） | 公共层**无** loading 专属规则，不覆盖 EP 加载视觉 |
| 派生／取消按钮 `.el-button`（无 `.ced-submit`） | `rgb(239,239,239)` 默认底（**未**被染黑） | 仅显式 `.ced-submit` 变黑 |
| 焦点可见 | CDP 强制 `:focus-visible` 下 `outline-style:auto`、`outline-width:1px`（焦点环**保留**） | 未被消除 |
| 反馈稳定占位 `.ced-field-feedback` | `min-height:20px`、`margin-top:2px` | 与设计一致 |
| 错误文字 `.ced-field-error` | `13px / line-height 18.2px(1.4) / rgb(245,108,108) / overflow-wrap:anywhere`；长文案 `scrollWidth==clientWidth` | 可换行、**未**硬裁剪 |
| 控件错误态 `.ced-field--error .el-input__wrapper` | `box-shadow: rgb(245,108,108) 0 0 0 1px inset` | 与设计一致 |
| **未接入对照弹窗**（无根类） | 标签 `16px/400/rgb(0,0,0)/start`、按钮默认底 | **公共层零命中、零视觉变化** |
| 窄视口（400px，安全边距 48px） | 已接入弹窗宽 `352px`、自身 `scrollWidth==clientWidth`（不横向溢出）；未接入对照弹窗保持 `900px`（公共层不施加约束） | 安全边距原则生效、零泄漏 |

**`NOT_APPLICABLE` 项（诚实标注，非伪造通过）**：

- **中性字段提示（`.ced-field-hint` 类）**：`NOT_APPLICABLE` ——两页提示字号（`13px` vs `12px`）与色值
  （`#909399` vs secondary）**均不同**，设计明确「不强制统一字号」，公共层无共同缺省可提炼，留 Feature。
- **弹窗内容区纵向滚动规则**：`NOT_APPLICABLE`（本轮以**原则**承接）——两页滚动载体不同
  （探针端页面私有 `max-height + overflow-y`，数据源管理由 EP 承担），设计将其列为**原则**而非定值，
  故本轮只落实安全边距变量接口，未写死滚动数值。
- **CCFG／DS 业务行为**（校验规则、清除时机、可点击条件、未保存确认、密码掩码、ID 解锁、
  候选项冲突、权限、提交 API）：`NOT_APPLICABLE` ——属 Feature，本任务**不实现**任何业务逻辑。

## 6. 定向／全量测试与构建

| 项目 | 命令 | 结果 |
|---|---|---|
| 定向契约测试 | `npx vitest run src/styles/dialog/create-edit-dialog-visual.spec.ts` | **18/18 通过** |
| 全量前端测试 | `npm run test`（vitest run） | **58 文件 / 1184 用例全部通过** |
| 前端构建 | `npm run build`（`vue-tsc --noEmit && vite build`） | **成功**（`✓ built in 17.24s`；仅既有 chunk >500kB 体积告警，非本任务引入） |

未出现任务引入的失败；无既有失败需要单列；后端未改，按验证矩阵**无需**后端构建或启动服务。

## 7. 未接入页面零影响核验

- 源码搜索：生产 `frontend/src/views/**` 挂载 `.ced-dialog` 数 **0**（静态契约测试第 16 条断言为空数组）；
- 两目标页（`ClientConfigPage.vue`、`DataSourcePage.vue`）**文件未改**，其现有私有视觉规则
  （`.cc-form-label`、`.cc-dialog-submit`、`.editor-dialog .el-form-item__label`、
  `.editor-submit-button` 等）**逐段保持**；
- 全局引入的 CSS 全部规则均需根类命中，未接入页面零匹配（夹具对照弹窗实测零视觉变化）。

## 8. 文档状态分层（最小同步）

| 键 | 旧（批准收口态） | 新（本任务后） |
|---|---|---|
| `public_css_status` | `NOT_CREATED` | `IMPLEMENTED_PENDING_CHATGPT_REMOTE_CODE_REVIEW` |
| `implementation_status` | `IMPLEMENTATION_NOT_STARTED` | `PUBLIC_CSS_IMPLEMENTED_VUE_NOT_CREATED` |
| `public_vue_component_status` | `NOT_CREATED` | `NOT_CREATED`（不变） |
| `page_adoption_authorization_status` | `PAGE_ADOPTION_NOT_AUTHORIZED` | `PAGE_ADOPTION_NOT_AUTHORIZED`（不变） |
| `migrated_page_count` | `0` | `0`（不变） |
| `formal_acceptance_execution_status` | *（未单列）* | `NOT_EXECUTED`（显式分层） |
| `create_edit_dialog_visual_template_approval_status` | `APPROVED_BY_PROJECT_OWNER` | `APPROVED_BY_PROJECT_OWNER`（**不变**，设计基线仍批准） |
| `current_next_entry` | `..._BASELINE_APPROVAL_CLOSEOUT_REVIEW` | `..._PUBLIC_CSS_IMPLEMENTATION_REVIEW` |

同步文件：模板目录 `README.md`、`DESIGN.md`、`UI.md`、`SHARED_COMPONENT_DESIGN.md`、`MIGRATION.md`，
及根 `docs/baseline/README.md` 的导航节。
**历史报告（R0／R1／批准收口）作为历史快照保留、未回写**，其「当时尚未实现」的记录保持原样。

## 9. 未执行项

- 未接入、未评估接入任何业务页面；未移除任何页面私有规则；`migrated_page_count=0` 保持；
- 未创建公共 Vue 组件、类型或路由元数据；
- 未执行**正式验收**（`formal_acceptance_execution_status=NOT_EXECUTED`）；
- 未启停任何服务，未访问数据库／ZooKeeper／Kafka，未发任何业务写请求；
- 未提交原始业务截图、内网地址、口令、连接串或生产数据。

## 10. 遗留风险

- **差异值承载未实测**：`--ced-label-column-width`／`--ced-dialog-safety-inset` 的 Feature 传值、
  以及回退流程，均**未经真实页面接入验证**（本任务不授权接入，无法实测）；
- **两处未实现令牌**（`--ced-label-gap`／`--ced-submit-bg-loading`）为**文档化取舍**，
  远程复审若认为应提供无回退接口，需另立修订；
- 静态契约测试只断言**源码文本关系**（jsdom 不实现层叠／布局）；层叠与几何事实由**合成夹具**承接，
  **未**覆盖真实业务页面的层叠环境与新页面接入情形。

## 11. 下一入口

```text
current_next_entry=CHATGPT_REMOTE_CREATE_EDIT_DIALOG_VISUAL_TEMPLATE_PUBLIC_CSS_IMPLEMENTATION_REVIEW
```

由 ChatGPT **从远程 Git** 对本次**公共 CSS 实现**（代码 + 契约测试 + 证据）独立复审。
**代码提交／推送成功不等于远程复审通过，更不等于页面接入授权或正式验收。**
