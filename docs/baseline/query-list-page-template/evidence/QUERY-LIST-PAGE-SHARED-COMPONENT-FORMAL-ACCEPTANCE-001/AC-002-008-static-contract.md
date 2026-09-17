# AC-002 / AC-003 / AC-004 / AC-005 / AC-006 / AC-008 静态契约证据

全部事实取自被验提交 `d1cd3b1` 的源码与生产构建产物，未做任何修改。

## AC-002 公共实现边界

`frontend/src/components/query-list/index.ts` 为公共层唯一出口，导出恰好 6 个组件 + 1 个 composable，无额外导出：

```
QueryListPageShell  QueryListQueryPanel  QueryListActions
QueryListResultPanel  QueryListRefreshToolbar  QueryListTooltipHost
export { useQueryListTooltip, QUERY_LIST_TOOLTIP_DELAY_MS } from '@/composables/query-list/useQueryListTooltip'
```

- 不导出 `query-list-spinner.css`（内部样式源不是公共 API）；
- 组件目录仅含 6 个 `.vue` + `index.ts` + `types.ts` + `query-list-spinner.css`；
- composable 目录仅含 `useQueryListTooltip.ts`（+ 其专测）。

自动化断言：`shared-layer.spec.ts` → 「公共层只暴露批准的 6 个组件与 1 个 composable 入口；Spinner 样式源不成为公共导出」「组件目录仅含获批组件、声明文件与公共层内部唯一 Spinner 样式源（无散件）」「composable 目录仅含 Tooltip 控制器」。

## AC-003 页面壳

- 正常内容态：`.ql-page` 直接元素子节点严格 = 3（页头 / 查询区 / 结果区）；
- 首载失败态：`.ql-page` 直接元素子节点严格 = 2（页头 / 错误卡片）；
- 两种状态下均无默认插槽包装层；模板与样式中都不存在 `.ql-page__body`；
- 根 `gap` 只作用于当前状态的直接子节点。

静态断言：`QueryListPageShell.spec.ts` → 「正常状态…根恰好 3 个直接元素子节点，且槽内容逐一直接挂在根下」「首载失败状态…根恰好 2 个直接元素子节点，无额外占位」「默认槽项数与直接元素子节点数严格线性（1:1 透传）」「源码不声明 body 包装层」。

浏览器断言（四视口，见 AC-014）：`pageRoot.childElCount === 3` 正常态、`firstLoadError.childElCount === 2` 失败态，均由严格比对脚本逐值确认。

`.ql-page` / 标题 / 描述的计算样式事实值与已批准设计一致（`QueryListPageShell.spec.ts` → 「`.ql-page` 为纵向 flex + 12px 间距 + 14px 16px 内边距 + 10px 圆角 + 透明底」「标题与描述排版令牌与参考事实值逐值一致」）。

## AC-004 查询面板与操作组

- `QueryListQueryPanel`：字段组为换行流（`flex` + `wrap` + `8px 14px`），操作组为整体 flex item（`inline-flex` + `flex: 0 0 auto`），查询/重置内层组不拆散、作为单个 flex item 整体换行；
- `QueryListActions`：默认 `queryWidthPx=62`、`resetWidthPx=62`，四值同锁（`width/min-width/max-width/flex-basis` + `flex-grow:0` + `flex-shrink:0` + `box-sizing:border-box`）；
- 公共层不提供通用高度默认值：未传 `heightPx` 时源码不输出任何 `height` 声明；参考页显式传 `:height-px="30"`（`DataSourceSnapshotQueryBar.vue`）；
- 默认 / hover / `:focus` 三态只使用 `--ql-*` 契约令牌，不借用 Element Plus 主题色（无 `type=` / `plain`）。

静态断言：`QueryListQueryPanel.spec.ts`（10 条）、`QueryListActions.spec.ts` → 「默认两按钮均为 62px 四值同锁」「未传 heightPx 时不输出任何 height 声明（无公共默认高度）」「显式 heightPx=30 时两按钮都输出 height:30px 且宽度锁不变」「查询按钮为深色主按钮、重置为浅灰次按钮，颜色全部来自 --ql-* 令牌」。

## AC-005 结果面板

DOM 段固定为 header → error-slot → divider → body，仅此四段：

- divider：`1px` / `#f0f0f1` / `margin: 0 16px` / `flex: 0 0 auto`；
- body：`padding: 10px 16px 14px` / `min-width: 0` / `box-sizing: border-box` / `width: 100%` / `overflow-x: auto`；
- 稳定表格容器职责并入 body，不单独成组件，无额外公共包裹层；
- 横向溢出由 body 承担并正常工作。

静态断言：`QueryListResultPanel.spec.ts` → 「无任何槽与文本时仍渲染四段，DOM 顺序固定为 header → error-slot → divider → body」「分隔线为 1px / #f0f0f1 / 0 16px 外边距 / 不参与伸缩」「正文区承担横向溢出：width:100% + min-width:0 + border-box + 10px 16px 14px 内边距 + overflow-x:auto」「不内建表格/业务命名空间」。

浏览器断言：严格比对脚本逐视口确认 body 几何、`overflow-x=auto` 与表格几何前后严格一致（AC-015）。

## AC-006 刷新工具组

- 立即刷新按钮默认 110px，四值同锁经 `--ql-refresh-btn-width` 驱动；`flex-grow:0` / `flex-shrink:0` / `box-sizing:border-box`；公共层不设置高度；
- `manualLoading` 驱动常驻 Spinner 的 `is-visible`，`busy` 以 `aria-disabled` + 事件入口阻断（不使用原生 `disabled`、不加 `is-disabled`）；
- `aria-busy` 只随 `manualLoading` 出现，倒计时在途不等于按钮 Loading；
- 刷新环的 reduced-motion 规则仍定义在组件自身内联样式中，未并入 Spinner 公共来源；
- 查询按钮改为 `:focus` 未影响刷新工具组的 `:focus-visible`：两者为相互独立的组件级规则。

静态断言：`QueryListRefreshToolbar.spec.ts`（26 条，含「默认按钮宽度 110px，四值同锁经 --ql-refresh-btn-width 驱动」「按钮高度不由公共层设置」「busy=true：按钮带 aria-disabled=true，但不使用原生 disabled」「aria-busy 只随 manualLoading 出现」「保留 :focus-visible 外环」「QueryListRefreshToolbar 的环进度 reduced-motion 规则仍留在组件内，未并入 Spinner 公共来源」）。

浏览器断言：常驻 Spinner 契约探针 58 项 × 4 视口全部通过（AC-007）。

## AC-008 Spinner 单来源契约

| 契约字段 | 实测值 |
|---|---|
| `spinner_class_name` | `.ql-btn-spinner` |
| `spinner_css_source_path` | `frontend/src/components/query-list/query-list-spinner.css` |
| `spinner_core_css_source_count` | `1` |
| `spinner_keyframes_source_count` | `1` |
| `spinner_token` | `--ql-btn-spinner-inset` |
| `query_spinner_inset_px` | `2` |
| `refresh_spinner_inset_px` | `3` |

- 仓库源码中 Spinner 核心选择器、`.is-visible` 与 `@keyframes ql-action-spin` 的定义源码只有该文件一处（`shared-layer.spec.ts` → 「全部 frontend/src 中 Spinner 核心选择器与动画的 CSS 定义源码只有该文件一处」）;
- 两个消费者 `QueryListActions.vue` / `QueryListRefreshToolbar.vue` 各以 `<style scoped src="./query-list-spinner.css">` 引用一次，解析到同一文件（`shared-layer.spec.ts` → 「两个消费者以外部 scoped stylesheet 引用同一份来源，且各自只引用一次」）；
- 两个组件的内联样式中不再定义 Spinner 选择器 / 动画 / reduced-motion（同文件 → 「两个组件的内联样式中不再定义 Spinner 选择器、Spinner 动画或 Spinner reduced-motion」）；
- 颜色只取 `currentColor`：查询 Spinner 为白色（来自白字按钮），刷新 Spinner 为深色（来自深色文字按钮）；CSS 中不写死任何颜色（无十六进制 / `rgb()` / `hsl()`）；
- 公共默认偏移 `2px` 由唯一令牌承担；公共来源自身不含页面局部值 `3px`；参考页以页面局部令牌覆写为 `3px`。

### 8.1 生产构建产物等价性

`npm run build` 产物中（两个消费者各自编译出一份带作用域哈希的变体）：

| 事实 | 实测 |
|---|---|
| Spinner 规则条数 | 6 条（2 个作用域变体 × 基础 / `.is-visible` / reduced-motion） |
| 作用域哈希 | `[data-v-84672f64]`、`[data-v-27dd65a1]` |
| 基础规则体 | 两侧逐字符相同：`position:absolute;left:var(--ql-btn-spinner-inset, 2px);top:50%;width:12px;height:12px;margin-top:-6px;box-sizing:border-box;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;…` |
| `.is-visible` 规则体 | 两侧逐字符相同：`opacity:1;visibility:visible` |
| reduced-motion 规则体 | 两侧逐字符相同：`animation:none` |
| keyframes | `ql-action-spin-84672f64`、`ql-action-spin-27dd65a1`，规则体均为 `to{transform:rotate(360deg)}` |
| 字面量 `ql-btn-spinner` 出现次数 | 8（每变体 3 个选择器 + 令牌名 `--ql-btn-spinner-inset` 2 次） |

两份作用域变体是 SFC scoping 的编译产物，规则体等价，不构成来源重复。
