# 查询列表页模板基线 · UI 规范（批准版）

> 文档状态：`APPROVED`
> 批准任务：`QUERY-LIST-PAGE-TEMPLATE-BASELINE-APPROVAL-001`
> 批准日期：2026-09-16
> 建立任务：`QUERY-LIST-PAGE-TEMPLATE-BASELINE-001`
> 基准提交：`83ff5c1ff80190459a4849eb74617cd4760db26e`

事实分层标记含义见 `README.md` §5：

- `REFERENCE_IMPLEMENTATION_FACT`：可在基准提交中直接验证的参考实现事实；
- `TEMPLATE_RULE_APPROVED`：已经 ChatGPT 复审与项目负责人批准的项目级规范；
- `PROPOSED_NOT_IMPLEMENTED`：后续实现建议，当前代码**不具备**该能力。

> 本文件中的一切数值与结构，只在被标注为 `REFERENCE_IMPLEMENTATION_FACT` 时，
> 才是“源库快照状态”当前代码的真实属性；其余为已批准模板规范或未实现建议。

---

## 1. 页面结构

### 1.1 推荐三段式结构

`TEMPLATE_RULE_APPROVED` —— 标准查询列表页推荐自上而下分为三段：

1. **页面标题与说明区**：页面标题 + 一句话功能说明；
2. **查询条件卡片**：查询字段与“查询 / 重置”操作；
3. **结果卡片**：结果摘要 + 刷新工具栏 + 表格。

三段之间应有明确的视觉分隔（间距或底色差异），使“标题 / 查询 / 结果”层级可辨。

`REFERENCE_IMPLEMENTATION_FACT` —— “源库快照状态”当前实现即该结构：

- 根容器 `.dss-page` 为纵向 flex，`gap: 12px`；
- 头部 `<header class="dss-page-header">` 包含 `<h2 class="dss-title">源库快照状态</h2>`
  （`20px` / `font-weight: 650`）与 `<p class="dss-desc">`（`13px`，次级灰）；
- 查询卡片 `<section class="dss-card dss-query-card">`；
- 结果卡片 `<section class="dss-card dss-result-card">`。

### 1.2 卡片视觉

`REFERENCE_IMPLEMENTATION_FACT`：

- 卡片底座 `.dss-card`：白色底、无硬边框、圆角 `10px`、极弱阴影
  （`0 1px 2px rgba(9,9,11,.04), 0 1px 3px rgba(9,9,11,.03)`）；
- 查询卡片 `.dss-query-card` 使用嵌入色底 `#f4f4f5`、圆角 `8px`、无阴影、`padding: 10px 16px`；
- 结果卡片头 `.dss-result-card__header` 为横向 flex、
  `align-items: center; justify-content: space-between; flex-wrap: wrap; padding: 12px 16px 2px`。

### 1.3 模板默认结构≠必备能力

`TEMPLATE_RULE_APPROVED` —— 三段式是模板的**默认**结构，不代表每个页面
都必须拥有自动刷新、倒计时、刷新失败提示或结果摘要胶囊。不具备相应业务的页面，
应省略对应区块，而不是保留空壳。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现在结果卡片头部下方保留了固定高度
刷新失败提示槽位 `.dss-result-error-slot { min-height: 22px }`，使提示出现/消失
不推动上方刷新组与下方表格的几何。**这是可选能力**，模板不强制所有页面保留该槽位。

---

## 2. 查询区

### 2.1 查询字段的栅格与间距原则

`TEMPLATE_RULE_APPROVED`：

- 查询区采用**单行流式排列**：每个条件为「标签 + 控件」一组，组间以间距分隔；
- 操作区（“查询 / 重置”）跟随在条件组之后，同属一行；
- 宽度不足时允许**整组换行**，但换行必须由容器宽度触发，**不得**由控件内容长度触发；
- 每个控件的宽度必须**预先锁定**，不得随选中内容长度变化而伸缩。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现的查询区 `.dss-query-bar` 内包含三个
`.dss-q-group` 条件组；每个条件组均将标签和控件组合为一个不可拆分的行内单元，
并分别把控件的「宽 / 最小宽 / 最大宽 / `flex-basis`」四值同锁：

| 控件 | 锁定宽度 | 说明 |
| --- | --- | --- |
| 探针端多选 | `240px` | `width = min-width = max-width = flex-basis = 240px` |
| 源库多选 | `300px` | 同上四值同锁 |
| 快照状态多选 | `200px` | 同上四值同锁 |

三个条件组均为 `display: inline-flex; align-items: center`，标签在前、控件在后。

### 2.2 不同控件的适配边界

`TEMPLATE_RULE_APPROVED`：

| 控件类型 | 宽度策略 | 备注 |
| --- | --- | --- |
| 多选（`el-select multiple`） | **必须**固定宽度 | 内容长度不可预测，不锁定必然漂移 |
| 单选下拉 | 建议固定宽度 | 可按最长候选项估宽后锁定 |
| 文本框 | 固定宽度 + `maxlength` | 宽度不随输入长度变化 |
| 日期范围 | 固定宽度 | 使用组件默认宽度并四值同锁 |
| 复杂组合控件 | 固定宽度或占整行 | 由业务决定，但必须稳定 |

`TEMPLATE_RULE_APPROVED` —— 多选控件建议启用 `collapse-tags`，
使已选项折叠为标签，避免选中项增多时把控件“撑高”并推动整行高度。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现三个多选均使用 `multiple` +
`collapse-tags`；下拉弹层通过 Feature 私有类（`dss-client-popper` / `dss-source-popper` /
`dss-status-popper`）锁定外层可见边界为 `min(480px, calc(100vw - 16px))` /
`min(400px, calc(100vw - 16px))` / `min(240px, calc(100vw - 16px))`。
该 popper 宽度属于本 Feature 专属规则，模板只吸收「弹层宽度必须显式约束、不随内容膨胀」这一原则。

### 2.3 “查询”和“重置”操作的位置

`TEMPLATE_RULE_APPROVED`：

- 操作区位于查询条件组的**末尾**，与条件组同一行流；
- “查询”在前，“重置”在后；
- 操作区自身为不可拆散的单一逻辑组（`display: inline-flex; flex: 0 0 auto`），
  不允许只把其中一个按钮换行到下一行。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现中操作区为 `.dss-q-actions`，
包含“查询”与“重置”两个按钮。

### 2.4 标准中文按钮的默认固定宽度

`TEMPLATE_RULE_APPROVED` —— 当按钮文案是标准中文时，模板推荐：

| 按钮文案 | 默认固定宽度 | 依据 |
| --- | --- | --- |
| 查询 | `62px` | 与“重置”成对，两字文案 |
| 重置 | `62px` | 同上 |

`REFERENCE_IMPLEMENTATION_FACT` —— “源库快照状态”当前的“查询”和“重置”按钮均把
`width = min-width = max-width = flex-basis` 四值锁为 `62px`，并设
`flex-grow: 0; flex-shrink: 0; box-sizing: border-box`。

> `REFERENCE_IMPLEMENTATION_FACT`：`62px`/`62px` 是**按钮固定宽度**，不是按钮高度。
> 本模板不定义、不测量、不修改任何按钮高度基线。

### 2.5 Loading 时按钮几何稳定

`TEMPLATE_RULE_APPROVED` —— Loading 状态**必须**满足：
指示器出现和消失时，按钮外框（`x` / `y` / `width` / `height`）以及按钮左右两侧相邻
元素的坐标**不得**移动。实现方式推荐「常驻指示器 + 绝对定位」：
指示器节点始终存在于 DOM 中（仅切换可见性），以按钮为包含块绝对定位，
**不进入**按钮内容流，因此显隐不重排。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现的“查询”按钮：

- 按钮 `position: relative`，内部含一个**常驻** `.dss-btn-spinner`：
  `position: absolute; left: 2px; top: 50%; width: 12px; height: 12px; margin-top: -6px;
  border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%`，
  空闲态 `opacity: 0; visibility: hidden`，仅切换 `.is-visible` 显示；
- 文字标签为独立节点 `.dss-action-label`，由按钮内容流固定居中；
- 按钮上以 `:aria-busy` 与 `:aria-disabled` 表达语义，不改变外观；
- `@media (prefers-reduced-motion: reduce)` 下停止旋转，指示器仍静态可见、几何完全稳定。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现的“立即刷新”按钮采用同一模式，
指示器 `.dss-btn-spinner` 位于 `left: 3px`、尺寸同为 `12px`。

### 2.6 “重置”是否立即查询

`TEMPLATE_RULE_APPROVED` —— “重置”的语义**默认建议为“不立即查询”**：
点击后只把查询区草稿恢复为默认条件，不清空当前结果、不发起请求。
若某业务确实需要“重置即查询”，**必须**由该 Feature 的需求明确写出，不得默认沿用。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现的“重置”只恢复草稿为三项“全部”，
**不查询、不清表格**（对应 `DSS-REQ-025`）。

### 2.7 非标准按钮文案的稳定宽度规则

`TEMPLATE_RULE_APPROVED` —— 当按钮文案不是标准“查询 / 重置”（例如
“搜索”“筛选”“应用条件”“刷新列表”）时，**不得**机械套用 `62px`。此时应遵守：

1. 先按文案与字号确定一个**整数像素**的目标宽度；
2. 将 `width / min-width / max-width / flex-basis` **四值同锁**为该宽度；
3. 设置 `flex-grow: 0; flex-shrink: 0; box-sizing: border-box`；
4. 在按钮进入 `Loading`、禁用、成功、失败各状态时验证外框与相邻元素坐标不变。

即：**稳定宽度是规则，`62px` 只是标准两字文案的默认取值。**

---

## 3. 结果工具栏

### 3.1 左侧：结果摘要或已应用条件

`TEMPLATE_RULE_APPROVED` —— 结果区头部左侧可放置：

- 结果总数摘要（例如“共 N 条”）；
- 附加提示（例如“其中 N 条未知状态”）；
- 当前已应用条件的摘要（可选）。

左侧内容应为主要层级信息，使用较大字号/字重；附加提示使用较小胶囊或次级文字，
形成清晰的“主 → 次”层级。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现左侧 `.dss-result-summary` 含
`.dss-summary-count`（`16px` / `font-weight: 700` / 等宽数字）与条件显示的
`.dss-summary-unknown`（`12px` / `700` / 暖黄胶囊 `#fef3c7` 底、`#b45309` 字、
`line-height: 22px`、`border-radius: 999px`）。

### 3.2 右侧：刷新信息整体靠右

`TEMPLATE_RULE_APPROVED` —— 若页面具备刷新能力，则
**自动刷新提示 + 最近成功刷新时间 + “立即刷新”按钮**必须组成一个**整体靠右**的
不可拆散逻辑组，顺序固定，窄宽度下整体换行，**不得**只把按钮拆到下一行。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现的刷新组顺序为：

```text
16px 倒计时环 → N 秒后自动刷新 → 分隔符 → 最近成功刷新：HH:mm:ss（从未成功 --）→ 立即刷新
```

该组 `.dss-refresh-group` 为 `display: inline-flex; align-items: center; gap: 8px;
flex: 0 0 auto; white-space: nowrap; font-size: 13px`；结果卡片头部整体 `flex-wrap: wrap`，
因此窄宽度下整组换行（对应 `DSS-REQ-068`）。

`REFERENCE_IMPLEMENTATION_FACT` —— 组内两个可变文本都做了**定宽槽位**处理：

- 秒数 `.dss-countdown-seconds`：`width / min-width / max-width / flex-basis = 2ch`，
  `box-sizing: border-box; text-align: right; font-variant-numeric: tabular-nums`，
  使 `60 / 59 / 10 / 9 / 0 / --` 盒宽恒定；
- 时间值 `.dss-refresh-time-value`：包含**常驻不可见**的占位常量
  `.dss-refresh-time-reserve`（`88:88:88`，`visibility: hidden` 而非 `display: none`）
  与绝对定位的 `.dss-refresh-time-actual`，使槽位宽度只由常量决定、与真实时间字符串无关。

`TEMPLATE_RULE_APPROVED` —— 上述“定宽槽位 + 常量占位”是做可变文本
几何稳定的推荐手法：**先锁盒宽，再让内容脱流定位**。

### 3.3 “立即刷新”标准按钮固定宽度

`TEMPLATE_RULE_APPROVED` —— 标准中文文案的“立即刷新”按钮，默认固定宽度 `110px`。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现 `.dss-refresh-btn` 四值同锁 `110px`
（`width / min-width / max-width / flex-basis`，含 `box-sizing: border-box`、
`flex-grow: 0; flex-shrink: 0`），白底、`1px #e4e4e7` 细边框、`#3f3f46` 文字、
圆角 `6px`，属于**次级按钮**（不抢黑色“查询”主按钮）。

### 3.4 Loading 出现时按钮与前置文字位置不变

`TEMPLATE_RULE_APPROVED` —— “立即刷新”进入 Loading 时，
按钮自身外框以及按钮**之前**的倒计时文字、分隔符、时间文本的坐标**不得**移动。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现同样用常驻绝对定位指示器
（`.dss-btn-spinner` + `.dss-action-label`）满足该要求；仅当在途请求为手工刷新时
点亮指示器，`auto` / `restore` 类刷新不点亮按钮指示器。

### 3.5 不支持自动刷新的页面

`TEMPLATE_RULE_APPROVED` —— 不支持自动刷新的页面**可以**不显示倒计时环与
“N 秒后自动刷新”，但：

- 若保留“立即刷新”，则其固定宽度与 Loading 几何稳定要求不变；
- 建议保留“最近成功刷新时间”或等价的“数据获取时间”表达，便于用户判断数据新旧。

---

## 4. 表格

### 4.1 容器、空状态与 Loading 状态

`TEMPLATE_RULE_APPROVED`：

- 表格外层应有一个容器负责横向溢出（推荐 `overflow-x: auto`），
  使表格可设最小宽度并在窄容器下横向滚动；
- 空状态与 Loading 状态必须由业务页面显式提供文案，**不得**把“空结果”与“接口失败”
  显示成同一种状态；
- 整表 Loading 只应用于“首次/条件查询”这类大态请求；轻量刷新（自动刷新、立即刷新）
  不清表、不整表遮罩。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现外层 `.dss-table-wrap { width: 100%; overflow-x: auto }`，
表格是 `el-table`（`v-loading` 只接 `initialLoading`），空文案为“暂无数据”。

### 4.2 列宽由业务页面定义

`TEMPLATE_RULE_APPROVED` —— **列宽必须由业务页面定义，模板不得统一
所有业务列宽。** 模板只建议“固定列 + `min-width` 弹性列混合”的**结构原则**，
不规定任何具体像素。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现的列宽模型是 Feature 专属：

| 列 | 宽度策略 |
| --- | --- |
| 序号 | 固定 `70` |
| 探针端 | `min-width: 170` |
| 源库 | `min-width: 285` |
| 快照状态 | 固定 `140` |
| 快照启动时间 / 快照完成时间 / 记录更新时间 | 各 `min-width: 170` |

表格 `min-width: 1175px`（`70 + 170 + 285 + 140 + 170×3`）。该模型只作为
“固定列 + 弹性列”原则的**示例**，**不是**模板的通用列宽规则。

### 4.3 长文本单行省略与 Tooltip

`TEMPLATE_RULE_APPROVED`：

- 长文本默认**单行省略**（`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`），
  单元格不得因文本过长而换行、撑高行；
- 是否启用 Tooltip **由字段语义决定**，不是所有单元格都需要 Tooltip；
- Tooltip 内容若与主文本不同（例如主文本显示简称、Tooltip 显示完整原始值），
  必须在需求中写明。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现的主文本单元格 `.dss-cell-main` 满足上述省略规则；
“源库”列主文本可能显示 ORG，而其 Tooltip **恒为完整原始 `DATA_SOURCE_ID`**（`DSS-REQ-074`）。

### 4.4 Tooltip 页面级单实例

`TEMPLATE_RULE_APPROVED` —— Tooltip **必须**支持“页面级单实例”或等价机制，
使快速扫过多行时**任意时刻最多只显示一个 Tooltip**。推荐实现要点：

- 单一受控 Host，`Teleport` 到 `body`，避免被表格 `overflow` 裁切；
- `pointer-events: none`，不拦截鼠标；
- 内容优先单行（`width: max-content`），仅在超过安全视口
  （`max-width: calc(100vw - 16px)`）时才换行；
- 目标切换时**先回到不可见定位态**，完成新内容测量后再一次性显示，
  杜绝新内容短暂沿用旧锚点坐标闪现；
- 表格数据替换时必须关闭当前 Tooltip。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现存在**两个独立的单实例实现**：

1. 页面级表格 Tooltip Host `SnapshotTooltipHost`（`Teleport to="body"`、
   `.dss-single-tooltip`、`position: fixed; z-index: 3000; width: max-content;
   max-width: calc(100vw - 16px); pointer-events: none`、
   `white-space: pre-line; overflow-wrap: anywhere`，`role="tooltip"`）；
   由 `useSnapshotTooltip` 管理“当前唯一目标”，表格在 `records` 变化时 `hide()`。
2. 查询栏内的 CLIENT_DESC Tooltip（`.dss-q-tt`，同样是 `Teleport to="body"` 的
   单实例实现，仅当 `CLIENT_DESC` 的 Unicode code point 长度 **大于 20** 时显示，
   通过 `document` 级捕获阶段 `mouseover` / `mouseout` 委派、以
   `data-dss-client-id` 锚定）。

> `REFERENCE_IMPLEMENTATION_FACT`：上述两个实现是**参考实现的现状**，不是模板要求的
> “必须有两个 Tooltip”。模板只要求“同屏最多 1 个 Tooltip”，并建议在组件化时收敛为
> 单一可复用的单实例机制（见 `DESIGN.md` §2 的 `SingleTooltip.vue` 候选及 §2.3 的
> 组件化难点说明；二者均属于 `PROPOSED_NOT_IMPLEMENTED`）。

### 4.5 分页、页大小、最大返回条数、固定表头、横向滚动

`TEMPLATE_RULE_APPROVED` —— 以下全部**必须由业务 Feature 决定**，
模板**不得**给出通用默认：

- 是否分页；
- 每页条数与页大小选择器；
- 最大返回条数；
- 是否固定表头；
- 是否纵向滚动表格体。

> **明确禁止**：模板**不得**把“源库快照状态”的**不分页**与“最多约 100 条”推广为通用规则。
> 该页面的“一次加载全部、不分页、无每页条数与翻页控件”来自其自身规模假设
> （`DSS-REQ-020` / `DSS-REQ-021`），是 Feature 专属结论。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现**没有**分页控件、不固定表头，
由外层 `.dss-table-wrap` 承担横向滚动；
对照页面“数据同步进度”则**有**固定 `150` 条/页的分页与页码控件（`el-pagination`，
`layout="prev, pager, next"`），“日志查询”使用**游标分页**（`CursorPagination`）。
三种形态并存，进一步说明分页策略不可由模板统一。

---

## 5. 稳定滚动条槽

### 5.1 准确术语

`TEMPLATE_RULE_APPROVED` —— 本能力使用准确术语：

```css
scrollbar-gutter: stable;
```

**必须**如此书写，**不得**用“隐藏滚动条”“固定表头”“表格宽度锁定”等近似说法替代。

### 5.2 它做什么

`TEMPLATE_RULE_APPROVED`：

- 它用于在**纵向滚动条出现或消失时预留稳定空间**；
- 它稳定的是**页面或指定滚动容器的可用宽度**（即该容器的 `clientWidth` 不因滚动条
  出现/消失而增减）；
- 它只在**真实承载纵向滚动的容器**上生效。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现的真实主内容纵向滚动容器是
`frontend/src/layouts/MainLayout.vue` 中的 `.content-area`
（`flex: 1; overflow-y: auto`）；稳定滚动条槽声明在该容器上：

```css
.content-area.dss-stable-gutter {
  scrollbar-gutter: stable;
}
```

该私有类**只在** `route.name === 'DataSourceRunState'` 时被加到 `.content-area` 上。

### 5.3 它不是什么（必须显式写明）

`TEMPLATE_RULE_APPROVED` —— 以下三条**必须**在任何介绍该能力的地方写明，
避免误用：

1. **它不是表格的横向滚动条。** 表格横向滚动由表格外层容器的 `overflow-x: auto`
   负责；`scrollbar-gutter: stable` 与横向滚动条无关。
2. **它不负责固定表头。** 固定表头（sticky header）是另一个独立能力，
   本模板不覆盖，也不得用本能力替代。
3. **它不是“强制永远显示滚动条”。** 参考实现**不使用** `overflow-y: scroll`
   作为达成稳定的手段。

### 5.4 当前作用目标与路由范围

`REFERENCE_IMPLEMENTATION_FACT`：

- 作用目标：`MainLayout` 的**内容区域** `.content-area`（`MAIN_LAYOUT_CONTENT_AREA`）；
- 路由范围：**仅** `/monitor/data-source-state`（`DATA_SOURCE_RUN_STATE_ONLY`）；
- 其他路由（实测 `/config/data-source`、`/config/client`、`/monitor/cdc-node`）的
  计算值 `scrollbar-gutter` 均为 `auto`，**样式泄漏为零**；
- 作用对象**不是** Feature 页面根元素、**不是**结果卡片、**不是**表格外层框架。

### 5.5 未来必须显式选择启用

`TEMPLATE_RULE_APPROVED` —— 后续把该能力公共化时，**必须显式选择启用**，
**不能**直接扩散为全局默认样式。启用方式应满足：

- 只有明确声明需要它的页面/路由才生效；
- 未声明的页面保持浏览器默认行为；
- 生效范围可被静态检查（例如可通过计算样式断言逐路由验证）。

### 5.6 两个候选启用形式

`PROPOSED_NOT_IMPLEMENTED` —— 以下两种候选形式**均未实现**，本任务**不决定**
最终代码接口，仅记录以便后续设计任务评估。

候选一：路由元数据

```ts
meta: {
  stableScrollbarGutter: true
}
```

候选二：页面壳 Props

```vue
<QueryListPageShell stable-scrollbar-gutter>
  ...
</QueryListPageShell>
```

**选择最终方案前必须评估**：

- 浏览器支持（`scrollbar-gutter` 的基线与降级表现）；
- 布局影响（是否改变既有页面在极窄视口下的可用宽度）；
- 其他路由泄漏（是否存在任何全局选择器或副作用）；
- 与现有 `MainLayout` 架构的一致性；
- 可测试性（能否用计算样式逐路由断言）。

### 5.7 明确禁止的实现方式

`TEMPLATE_RULE_APPROVED`（沿用参考实现已冻结的禁止项）：

- **不得**伪造滚动内容：不加空白行、不加占位块、不设 `min-height` 强行维持滚动条；
- **不得**使用 JS 宽度监听、`ResizeObserver` 宽度补偿、运行时表格宽度计算，
  或按结果行数切换像素值/样式；
- **不得**把全局 `overflow-y: scroll` 作为默认手段；
- **不得**把所有表格列冻结为固定像素宽度来掩盖问题。

### 5.8 根因链（必须精确，不得错误归因）

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现记录的根因链为：

```text
查询结果行数变化
  → 真实主内容滚动容器纵向滚动条出现/消失
  → 容器可用 clientWidth 变化
  → Element Plus 重新分配弹性列宽
  → 探针端等弹性列轻微变化，其后列水平位移
```

`TEMPLATE_RULE_APPROVED` —— 任何文档、报告或实现说明**不得**把结果汇总文案
（“共 30 条”变“共 1 条”）本身写成**直接**根因；记录数变化只通过页面高度与纵向滚动条
状态**间接**相关，也**不得**以修改汇总文案作为修复手段。

### 5.9 几何判定口径

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现的判定标准为**严格 `0`**，不是“舍入后为 0”、
不是“肉眼近似无位移”。在长/短结果双向切换全过程中，下列几何量 delta 必须严格为 `0`：

1. 主内容滚动容器 `x` / `width` / `clientWidth`；
2. 页面根 `x` / `width`；
3. 结果卡片 `x` / `width`；
4. 表格外层框架 `x` / `width`；
5. 每个表头单元格 `x` / `width`；
6. 每个数据列起始 `x`；
7. 关键列表头**中心点**位置。

支持视口：`1280×800`、`1700×920`、`1920×1080`、`2560×1440`；正式支持最窄宽度 `1280px`。
断言必须是**机器可执行**的，且必须具备真实失败出口（对注入 `0.001px` 的负向位移
必须返回**非零**退出码）。

`TEMPLATE_RULE_APPROVED` —— 后续任何启用该能力的页面，其等价性验证
**建议沿用**同一判定口径（严格 `0` + 负向控制）。

---

## 6. 响应式与可访问性

### 6.1 响应式

`TEMPLATE_RULE_APPROVED`：

- 标准桌面视口下布局**不应出现无意义跳动**：查询控件、操作按钮、结果头部右侧刷新组、
  表头列位置都应在数据变化时保持稳定；
- 小视口时**允许查询字段换行**，但操作区顺序必须稳定（“查询”始终在“重置”之前，
  刷新组始终整体靠右）；
- 表格在窄容器下允许横向滚动，但页面**不得**新增无意义的水平滚动条；
- 响应式描述必须使用**准确视口**（像素宽度 + 浏览器/缩放条件），
  禁止只写“1K / 2K”。

### 6.2 可访问性

`TEMPLATE_RULE_APPROVED`：

- 文本省略必须有**可访问完整内容的方式**（Tooltip、`title`、可展开详情等）；
- Loading、禁用和错误状态**不能只依赖颜色**表达，必须同时有文字或 ARIA 语义；
- 键盘焦点与按钮可操作性**不得因模板组件化而退化**：按钮必须保持可聚焦、可回车触发，
  焦点可见样式应克制且局部；
- 装饰性图形（例如倒计时环）应标记 `aria-hidden`，不进入读屏内容流；
- 状态标签必须以文字承载主信息（颜色只作辅助）。

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现中的对应处理：

- 倒计时环 `<svg class="dss-countdown-ring" aria-hidden="true">`；
- 时间值占位常量 `.dss-refresh-time-reserve` 标 `aria-hidden="true"`；
- Loading 指示器 `.dss-btn-spinner` 标 `aria-hidden="true"`，语义由 `aria-busy` 承担；
- 被功能阻断的“立即刷新”以 `aria-disabled="true"` 标记，外观不变；
- 错误卡片 `role="alert"`，刷新失败提示 `role="status"`；
- 焦点样式使用局部焦点环
  （`.dss-refresh-btn:focus-visible { outline: 2px solid rgba(37,99,235,.5); outline-offset: 1px }`）；
- `prefers-reduced-motion: reduce` 下停止旋转与过渡。

---

## 7. 与通用规则 / Feature 专属的边界

`TEMPLATE_RULE_APPROVED` —— 下表明确区分“可成为通用规范”与
“必须留在具体 Feature”的内容：

| 项目 | 归属 |
| --- | --- |
| 三段式页面结构 | 通用规范 |
| 卡片视觉层级与间距原则 | 通用规范 |
| 控件宽度必须锁定 | 通用规范 |
| “查询 / 重置”默认 `62px`、Loading 几何稳定 | 通用规范 |
| “立即刷新”默认 `110px`、刷新组整体靠右 | 通用规范 |
| “重置”默认不立即查询 | 通用规范（可被 Feature 显式覆盖） |
| Tooltip 页面级单实例 | 通用规范 |
| 长文本单行省略 | 通用规范 |
| `scrollbar-gutter: stable` 需显式选择启用 | 通用规范 |
| 具体查询字段与候选来源 | Feature 专属 |
| 接口地址与参数格式 | Feature 专属 |
| 表格业务列、列宽与最小宽度 | Feature 专属 |
| 分页策略、页大小、最大返回条数 | Feature 专属 |
| 是否固定表头、是否纵向滚动 | Feature 专属 |
| 状态标签业务语义与配色映射 | Feature 专属 |
| 自动刷新周期（参考实现为 `60` 秒） | Feature 专属 |
| 新增/编辑/删除/启停/批量保存权限 | Feature 专属（不在模板内） |
| 数据库读写边界 | Feature 专属 |
| Feature 专属错误提示文案与恢复策略 | Feature 专属 |

---

## 8. 在本文件集中查阅

- 设计与分层：`DESIGN.md`
- 迁移与保护：`MIGRATION.md`
- 目标、范围与状态：`README.md`
