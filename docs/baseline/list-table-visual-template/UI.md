# 列表表格视觉模板 · UI（已批准基线）

```text
list_table_visual_template_document_status=APPROVED
list_table_visual_template_design_status=BASELINE_APPROVED
chatgpt_remote_r1_review_status=REVIEW_PASS
blocking_finding_count=0
project_owner_approval_status=APPROVED
project_owner_approval_date=2026-09-21
approval_scope=BASELINE_CONTENT_ONLY
approved_baseline_source_commit=575379895c4c57fd3df7e0d0ce27c1f6841d2f17
shared_implementation_design_status=APPROVED
shared_implementation_design_approval_status=APPROVED
shared_implementation_status=NOT_STARTED
reference_page_integration_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
```

批准证据链（详细设计）：

```text
R0 设计提交=d7ae5af54e62bba20373681f9f55fc7fb67f39a7
R1 定向修订提交=f8d84657e939a4b02316457b543976a847b0775b
R2 定向修订提交=e72264de14a9483aae5593435f818ea65c5116e0
ChatGPT 远程 R2 复审=REVIEW_PASS
blocking_finding_count=0
项目负责人详细设计批准日期=2026-09-21
详细设计批准范围=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY
```

> 本文档以参考实现**真实源码**为依据，分三层记录：
> §1 参考实现（数据源管理主表）**当前事实**（`LIST_TABLE_REFERENCE_FACT`）；
> §2 可提升为**已批准模板规则**的视觉内容（`LIST_TABLE_TEMPLATE_APPROVED`）；
> §3 必须**保留为 Feature 专属**的内容（`LIST_TABLE_TEMPLATE_APPROVED`）。
>
> 本文档**不**凭 Element Plus 默认印象填写“真实计算值”。
> 源码未显式定义、又无法在纯文档任务中可靠确认的值，一律标注为
> **“继承现状、待详细设计 / 浏览器量测确认”**，**不**编造精确像素或颜色。

基准提交：`10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e`
参考文件：`frontend/src/views/data-source/DataSourcePage.vue`（主列表 `class="data-table"`）

---

## 1. 参考实现：数据源管理主表当前事实

### 1.1 表格元素与属性

`LIST_TABLE_REFERENCE_FACT` —— 主表元素（`DataSourcePage.vue` 第 81–85 行）：

```html
<el-table :data="rows" class="data-table" @row-dblclick="onRowDoubleClick">
```

- 类名：`data-table`；
- **未**声明 `border`；
- **未**声明 `stripe`；
- **未**声明 `size`；
- **未**声明 `height` / `max-height`；
- **未**在表格上声明 `v-loading`（Loading 由外层结果区 `QueryListResultPanel` 承担）；
- **未**声明 `row-key`；
- **未**声明多选列（`el-table-column type="selection"`）；
- **未**声明排序（`sortable`）；
- **未**声明分页（页面内无 `.el-pagination`）；
- 绑定行双击 `@row-dblclick`。

### 1.2 表格级视觉令牌

`LIST_TABLE_REFERENCE_FACT` ——（第 1761–1766 行）：

```css
.data-table {
  width: 100%;
  --el-table-border-color: #f4f4f5;
  --el-table-header-text-color: #71717a;
  --el-table-header-bg-color: #ffffff;
}
```

- 表格宽度：`100%`；
- 边框色 `--el-table-border-color`：`#f4f4f5`；
- 表头文字色 `--el-table-header-text-color`：`#71717a`；
- 表头背景 `--el-table-header-bg-color`：`#ffffff`；
- 注释声明这些覆盖**“作用仅限本表”**（局部收紧 EP 表令牌，对齐“源库快照状态”页）。

> 注意：源码**只**覆盖了上述三个 EP 令牌；表格的**行高**、**hover 行颜色**、
> **边框线宽**、**单元格横向内边距**等**未**在本文件显式定义，属
> **“继承现状、待详细设计 / 浏览器量测确认”**。

### 1.3 表头单元格排版

`LIST_TABLE_REFERENCE_FACT` ——（第 1768–1773 行）：

```css
.data-table :deep(.el-table__header th .cell) {
  font-size: 12px;
  font-weight: 600;
  color: #71717a;
  letter-spacing: 0.01em;
}
```

- 表头字号 `12px`；字重 `600`；颜色 `#71717a`；字距 `0.01em`。

### 1.4 单元格上下内边距

`LIST_TABLE_REFERENCE_FACT` ——（第 1775–1781 行）：

```css
.data-table :deep(td.el-table__cell) { padding: 12px 0; }
.data-table :deep(th.el-table__cell) { padding: 11px 0; }
```

- 正文单元格上下内边距 `12px`（左右为 `0`）；
- 表头单元格上下内边距 `11px`（左右为 `0`）。

### 1.5 序号列

`LIST_TABLE_REFERENCE_FACT` ——（列定义第 100–104 行；样式第 1784–1788 行）：

```html
<el-table-column label="序号" width="70" align="center">
  <template #default="{ $index }"><span class="ds-seq">{{ $index + 1 }}</span></template>
</el-table-column>
```

```css
.ds-seq { font-size: 13px; color: #71717a; font-variant-numeric: tabular-nums; }
```

- 列宽 `70`、居中；序号为 `$index + 1`；
- 排版：`13px`、`#71717a`、等宽数字（`tabular-nums`）。

### 1.6 数据源 ID 单元格（主值 + 状态标记）

`LIST_TABLE_REFERENCE_FACT` ——（列定义第 105–113 行；样式第 1790–1846 行）：

```html
<el-table-column prop="dataSourceId" label="数据源ID" min-width="140" show-overflow-tooltip>
  <template #default="{ row }">
    <span class="ds-id-cell">
      <span class="ds-id-text">{{ row.dataSourceId }}</span>
      <span v-if="isInactive(row)" class="ds-inactive-mark">停用</span>
      <span v-else-if="isAbnormal(row)" class="ds-abnormal-mark">{{ abnormalMark(row) }}</span>
    </span>
  </template>
</el-table-column>
```

- `.ds-id-cell`：`display:flex; align-items:center; gap:6px; max-width:100%; line-height:1.5`；
- `.ds-id-text`：`14px` / `600` / `#09090b` /
  `"SF Mono","JetBrains Mono",Menlo,Consolas,"Liberation Mono",monospace` /
  `tabular-nums` / 单行省略（`overflow:hidden; text-overflow:ellipsis; white-space:nowrap`）；
- `.ds-inactive-mark`（“停用”胶囊）：`inline-flex; padding:0 6px; height:20px;
  border-radius:4px; background:#fee2e2; color:#991b1b; font-size:11px;
  font-weight:700; line-height:1; white-space:nowrap`；
- `.ds-abnormal-mark`（异常标记）：几何同上，配色 `background:#fef3c7; color:#b45309`；
  注释明确要求“**显示真实原值，不得静默显示为‘停用’**”。

### 1.7 角色标签

`LIST_TABLE_REFERENCE_FACT` ——（列定义第 115–121 行；样式第 1849–1867 行）：

```html
<el-tag :type="row.dataSourceCategory === 'SOURCE' ? 'warning' : 'success'" size="small">
```

```css
.data-table :deep(.el-tag) {
  height: 20px; line-height: 20px; padding: 0 9px;
  border: none; border-radius: 4px; font-size: 12px; font-weight: 600;
}
.data-table :deep(.el-tag--warning) { background: #fef3c7; color: #b45309; }
.data-table :deep(.el-tag--success) { background: #ecfdf5; color: #047857; }
```

- 角色标签：固定高 `20px`、无边框、圆角 `4px`、`12px` / `600`、水平内边距 `0 9px`；
- 两类角色配色：`warning` = 琥珀（`#fef3c7` / `#b45309`），`success` = 绿（`#ecfdf5` / `#047857`）。

### 1.8 空态

`LIST_TABLE_REFERENCE_FACT` ——（第 86–99 行）：

- 使用 `#empty` 插槽，**两级文案**：`.empty-main` + `.empty-sub`；
- 文案随 `effectiveQuery` 变化：
  - 有查询条件时：主文“未找到符合当前查询条件的数据源” + 副文提示调整条件或重置；
  - 无查询条件时：主文“暂无数据源” + 副文提示点击右上角“新增数据源”。

### 1.9 长文本与横向溢出

`LIST_TABLE_REFERENCE_FACT`：

- 多个列使用 `show-overflow-tooltip`（数据源ID / 数据源名称 / 主机 /
  Service Name/数据库名 / 用户名）→ 由 **Element Plus 内建**机制提供单行省略与悬停提示；
- 表格本身**未**声明 `min-width`，宽度为 `100%`；
- 表格**未**声明横向滚动的自定义策略 → **“继承现状、待详细设计 / 浏览器量测确认”**。

### 1.10 列宽与固定列

`LIST_TABLE_REFERENCE_FACT` ——主表列定义：

| 顺序 | 列 | 宽 / 最小宽 | 对齐 | Tooltip |
| --- | --- | --- | --- | --- |
| 1 | 序号 | `width 70` | center | — |
| 2 | 数据源ID | `min-width 140` | 默认 | `show-overflow-tooltip` |
| 3 | 数据源名称 | `min-width 140` | 默认 | `show-overflow-tooltip` |
| 4 | 角色 | `width 90` | 默认 | — |
| 5 | 类型 | `width 90` | 默认 | — |
| 6 | 主机 | `min-width 110` | 默认 | `show-overflow-tooltip` |
| 7 | 端口 | `width 80` | 默认 | — |
| 8 | Service Name/数据库名 | `min-width 150` | 默认 | `show-overflow-tooltip` |
| 9 | 用户名 | `min-width 110` | 默认 | `show-overflow-tooltip` |
| 10 | 操作 | `width 110` | 默认 | — |

- 唯一固定列：操作列 `fixed="right"`；
- **未**声明列排序、**未**声明列级 `align` 以外的特殊格式。

### 1.11 Loading

`LIST_TABLE_REFERENCE_FACT` ——`v-loading="loading"` 挂在**外层结果区**
`QueryListResultPanel`（第 61 行），**不在** `el-table` 上。

---

## 2. 可提升为已批准模板规则的内容

`LIST_TABLE_TEMPLATE_APPROVED` —— 从 §1 参考事实中，**可以**提取为“列表主表视觉纪律”的部分：

1. **表头排版纪律**：表头文字**次级灰 + 加粗 + 小字号 + 微字距**
   （参考事实 `12px / 600 / #71717a / 0.01em`）；
2. **表头背景纪律**：表头背景为**纯白**（参考事实 `#ffffff`）；
3. **边框纪律**：表格内线为**极浅灰**（参考事实 `#f4f4f5`），
   视觉上呈现“轻分隔、无重边框”；
4. **上下留白纪律**：表头与正文单元格采用
   **`11px`（表头） / `12px`（正文）的上下内边距**，横向由列定义决定；
5. **表格宽度纪律**：主表宽度占满结果区（参考事实 `width:100%`）；
6. **行高纪律**：默认**不固定行高**，由内容与上下内边距共同决定
   （参考实现确实未声明行高，见 §3.7）；
7. **长文本纪律**：需要保持单行的长文本字段采用
   **单行省略 + 悬停 Tooltip**（参考实现经 `show-overflow-tooltip`）；
8. **状态标记纪律**：行内容允许**内联小型标记**（如胶囊 / 标签），
   且**不得**改变所在行的行高（参考实现以固定 `20px` 高度实现）。

`LIST_TABLE_TEMPLATE_APPROVED` —— 以下两项**明确不**纳入本基线的公共规则，
其职责**默认属 Feature**（与 `DESIGN.md` §2、§7 一致）：

- **序号列**：是否存在序号列，以及序号列的列宽、编号算法、是否居中、字号、颜色、
  等宽数字（`tabular-nums`）等具体排版，**默认属 Feature**。
  本模板**不**要求所有主列表必须具有序号列，也**不**默认注入数据源管理现有的
  `width=70` / `align=center` / `13px` / `#71717a` / `tabular-nums`
  （该组数值仅是**参考实现事实**，见 §1.5）。
  后续详细设计如认为序号列样式具有复用价值，只能把它作为**可选扩展能力**另行评估，
  **不得**在本基线中提前定案。
- **空态**：空态文案、文案层级、以及是否区分“无数据”与“查询无结果”，
  均由 Feature 决定。本模板**不**规定所有主列表必须使用两级空态，
  **不**内置任何业务空态文案，也**不**强制单行 / 两级结构。
  数据源管理现有的两级空态（见 §1.8）仅是**参考实现事实**，
  不作为公共默认规则。后续详细设计如需提供空态视觉扩展点，应另行设计。

`LIST_TABLE_TEMPLATE_APPROVED` —— 以上是**已批准模板规则**，作为后续公共实现
详细设计必须遵守的基线；但**规则批准 ≠ 实现批准**。
其中“可提取”不代表数值可直接成为公共默认值；具体数值是否上收为公共令牌，
仍由后续详细设计决定（见 `DESIGN.md` §4、§8）。

---

## 3. 必须保留为 Feature 专属的内容

`LIST_TABLE_TEMPLATE_APPROVED` —— 以下内容**不得**被本模板抽成公共规则：

### 3.1 业务列与列宽

- 数据源ID / 名称 / 角色 / 类型 / 主机 / 端口 / Service Name / 用户名等**业务列**
  的名称、数量、顺序、`prop` 与 `min-width`；
- 表格整体 `min-width`（为各列宽之和）——由各 Feature 自行决定，模板**不**给默认值。

### 3.2 固定列

- 操作列 `fixed="right"` 的取舍——属 Feature 决定，模板**不**规定“必须有固定列”
  或“必须固定在右侧”。

### 3.3 排序

- 列排序能力与默认排序——属 Feature（数据源管理主表**未**声明列排序）。

### 3.4 行双击与写操作

- `@row-dblclick` 的具体行为（数据源管理主表双击行进入编辑）；
- 操作列内的按钮（编辑 / 删除 / 更多）、权限、禁用与 Loading；
- 这些属**交互与写操作**，**不**属视觉模板。

### 3.5 选择

- 是否多选、选中态样式、批量操作——属 Feature；
- 数据源管理主表**未**声明多选，但其 Feature 文档中“更多”操作存在；
- 其他页面（如探针端管理）的多选与选中态（`#ecf5ff` 底色 + 左侧条）
  是**该 Feature 的业务语义**，**不得**上升为公共规则（见 `DESIGN.md` §7）。

### 3.6 状态语义

- 角色标签的**两类含义与配色**（`SOURCE` → warning 琥珀 / 其他 → success 绿）；
- “停用”红色胶囊、“异常”琥珀标记的**判定规则与文案**；
- 这些是**数据源管理特有的业务语义**，其配色**不得**被模板固化为公共色板。

### 3.7 行高策略中的 Feature 例外

- 数据源管理主表**未**固定行高；
- 其他页面（如探针端管理）**显式固定** `height: 60px`——那是**该页面**的选择；
- 模板**不**规定统一行高，**不**禁止 Feature 固定行高（见 `DESIGN.md` §5）。

### 3.8 分页、Loading、错误处理

- 数据源管理主表**未**分页；其他页面各有分页策略；
- Loading 挂载位置（表格 vs 外层容器）属 Feature；
- 错误提示文案与重试策略属 Feature。

### 3.9 ID 强调与“更多”操作

- 数据源 ID 的**等宽加粗强调**（`14px/600/#09090b/mono`）属该页面的业务呈现；
- “更多”操作的展开行为与呈现属 Feature。

### 3.10 响应式、可访问性与无全局泄漏

`LIST_TABLE_TEMPLATE_APPROVED` —— 本模板**必须**满足：

- **响应式**：模板不得破坏页面的响应式布局；表格宽度策略由 Feature 决定，
  模板只保证其自身规则不引入固定像素宽度；
- **可访问性**：模板不得移除或覆盖 Element Plus 的可访问性语义
  （表头 `scope`、`aria-*`）；不得以视觉手段隐藏仍应可被辅助技术读取的内容；
- **无全局泄漏**：模板类与令牌**不得**定义在 `:root` / `body`，
  **不得**新增全局样式块（见 `DESIGN.md` §3）。

`LIST_TABLE_TEMPLATE_APPROVED` —— 上述三项在**详细设计**阶段必须给出
可验证的检查方式（静态检查 + 计算样式逐路由断言 + 负向控制）。
