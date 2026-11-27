# CDC 平台公共布局（app-shell）——UI 设计（UI.md）

> 文档状态：`DRAFT_PENDING_OWNER_REVIEW`
> 建立任务：`CDC-APP-SHELL-FEATURE-BASELINE-DRAFT-001`
> 建立日期：2026-11-27
> 实现取材版本：`fe53383e81151718c9cff2e741ff2a8fbf2db352`
> 取值来源：以下 CSS 均以 `fe53383` 的 Vue 单文件组件 `<style scoped>` 为准，文中标注源文件与选择器。

## 1. 侧栏（深色 A 版，固定 220px）

源文件：[`frontend/src/layouts/Sidebar.vue`](../../../frontend/src/layouts/Sidebar.vue)

侧栏以局部主题变量统一配色（`.sidebar` 作用域）：

| 元素 / 状态 | 取值 | 来源 |
|---|---|---|
| 侧栏容器 | `position: fixed`；`left/top: 0`；`bottom: 0`；`width: 220px`；`display:flex; flex-direction:column`；`z-index:100`；`overflow:hidden` | `.sidebar` |
| 侧栏背景 `--sidebar-bg` | `#232c38`（深石板灰） | `.sidebar` |
| 品牌区 | 高 `56px`；居中；底部 `1px solid rgba(255,255,255,0.08)` | `.brand` |
| 平台标题文字 | “CDC 配置管理平台”；`font-size:16px`；`font-weight:600`；`letter-spacing:1px`；色 `#f4f7fb` | `.brand-text` / `--sidebar-brand-text` |
| 菜单容器 | 宽 `220px`；`overflow-y:auto`；`overflow-x:hidden`；去右边框 | `.sidebar-menu` |
| 菜单项 | `margin:2px 8px`；`border-radius:6px`；`font-size:15px`；文字色 `#d5dde7`；不换行 | `.sidebar-menu .el-menu-item` / `--sidebar-item-text` |
| 菜单项悬停 | 背景 `rgba(255,255,255,0.06)`；文字 `#fff` | `.el-menu-item:hover` / `--sidebar-item-hover-bg` |
| 选中项 | 背景 `#364a61`；文字 `#b5d7ff`；`font-weight:500` | `.el-menu-item.is-active` / `--sidebar-item-active-*` |
| 选中项悬停 | 背景 `#3d5571`；文字 `#b5d7ff` | `.el-menu-item.is-active:hover` |
| 键盘焦点 | `outline:2px solid #b5d7ff; outline-offset:-2px` | `.el-menu-item:focus-visible` |
| 分组标题 | 色 `#a4b0c0`；`font-size:12px`；`padding:12px 20px 4px`；不换行 | `.el-menu-item-group__title` / `--sidebar-group-text` |

Element Plus 菜单的 `background-color`/`text-color`/`active-text-color` 绑定为 `#232C38`/`#D5DDE7`/`#B5D7FF`，与上述 CSS 变量一致。

## 2. 顶部面包屑栏

源文件：[`frontend/src/layouts/HeaderBar.vue`](../../../frontend/src/layouts/HeaderBar.vue)

| 元素 | 取值 |
|---|---|
| 顶栏 | 高 `48px`；背景 `#fff`；底部 `1px solid #e4e7ed`；内边距 `0 16px`；`flex-shrink:0` |
| 面包屑 | `el-breadcrumb`，分隔符“/”；`font-size:14px` |
| 内容 | 由路由 `meta.group` → `meta.title` 渲染；分组成员渲染为可点击项，末项为当前页标题；两者皆空时不渲染（空工作区） |

## 3. 页面标签条

源文件：[`frontend/src/layouts/PageTabs.vue`](../../../frontend/src/layouts/PageTabs.vue)

| 元素 / 状态 | 取值 |
|---|---|
| 标签条容器 | 背景 `#fff`；底部 `1px solid #e4e7ed`；内边距 `0 8px`；`flex-shrink:0` |
| 标签列表 | `display:flex`；`align-items:stretch`；`gap:4px`；`overflow-x:auto`；`overflow-y:hidden`；`scrollbar-width:thin` |
| 单项 | `display:inline-flex`；`align-items:center`；`flex:0 0 auto`；底部 `2px solid transparent` |
| 激活项 | 底边色 `#409eff`（`border-bottom-color`） |
| 标签文字 | `padding:8px 10px`；`font-size:14px`；`line-height:20px`；色 `#606266`；不换行 |
| 文字悬停 | 色 `#409eff` |
| 激活文字 | 色 `#409eff`；`font-weight:500` |
| 文字键盘焦点 | `outline:2px solid #409eff; outline-offset:-2px; border-radius:2px` |
| 关闭按钮 | `margin-right:4px`；`padding:4px`；`border-radius:3px`；色 `#909399` |
| 关闭悬停 | 背景 `#f0f2f5`；色 `#606266` |
| 关闭焦点 | `outline:2px solid #409eff; outline-offset:-2px` |

语义：容器为 `role="tablist"`，激活标签 `aria-selected="true"` 且 `tabindex=0`，其余 `tabindex=-1`；关闭按钮 `aria-label="关闭 {标题}"`。标签条仅在存在标签时渲染。

## 4. 内容区与空工作区

源文件：[`frontend/src/layouts/MainLayout.vue`](../../../frontend/src/layouts/MainLayout.vue)

| 元素 | 取值 |
|---|---|
| 整体 | `.main-layout`：`display:flex; height:100vh; overflow:hidden` |
| 右侧列 | `.layout-right`：`flex:1; display:flex; flex-direction:column; min-width:0; margin-left:220px` |
| 主内容区 | `.content-area`：`flex:1; padding:16px 20px; overflow-y:auto; background:#f0f2f5`（**唯一纵向滚动容器**） |
| 稳定槽位 | `.content-area.is-stable-gutter { scrollbar-gutter: stable; }`（仅路由声明 `meta.stableScrollbarGutter === true` 时生效） |
| 内容卡片 | `.content-card`：`background:#fff; border-radius:4px; min-height:100%; padding:20px` |
| 空工作区容器 | 居中列，`gap:8px`，色 `#909399` |
| 空工作区标题 | “暂无打开的页面”，`font-size:15px`，色 `#606266` |
| 空工作区提示 | “请从左侧菜单打开页面”，`font-size:13px` |

## 5. 文档内承载（隐藏页视觉隔离）

源文件：[`frontend/src/layouts/InDocumentPageHost.vue`](../../../frontend/src/layouts/InDocumentPageHost.vue)

| 元素 / 状态 | 取值 / 行为 |
|---|---|
| 宿主 | `.in-doc-host { position:relative; overflow:hidden; }` |
| 承载页 | `.in-doc-page { min-width:0; }` |
| 活动页 | 静态流内正常可见、可交互 |
| 非活动页 | `position:absolute; top:0; left:0; right:0; visibility:hidden; pointer-events:none`；同时带 `inert` 与 `aria-hidden="true"` |

隐藏页保持与宿主相同的包含块宽度（绝对定位贴齐 `left/right:0`），高度随内容自然展开；宿主 `overflow:hidden` 裁剪隐藏页纵向溢出，因此纵向滚动范围只由活动页决定。视觉效果上，活动页占据正常文档流，非活动页不可见且不占位。

## 6. 独立大屏与窄窗边界

- **独立大屏**：源文件 [`frontend/src/App.vue`](../../../frontend/src/App.vue)——当 `route.meta.standalone === true` 时直接渲染 `<router-view/>`，不加载 `MainLayout`；因此无侧栏、面包屑、标签条，页面自身全屏布局。
- **窄窗**：侧栏固定 220px 不折叠；右侧 `.layout-right` 的 `min-width:0` 允许内容区收缩，避免撑破横向布局；管理页隐藏期间宽度与激活态一致。

## 7. 历史背景（非当前形态）

早期版本曾有侧栏折叠按钮与宽度过渡动画，后经 R2/R3 演进为“折叠即时、宽度无过渡”“菜单短滑入/淡入”，最终在 `bab0949`（固定侧栏）移除了折叠入口，侧栏固定为展开的 220px。这些折叠控件与动画**不属于当前形态**，仅作历史背景记录，不应据旧草稿还原。

## 8. 变更记录

| 日期 | 任务 | 说明 |
|---|---|---|
| 2026-11-27 | `CDC-APP-SHELL-FEATURE-BASELINE-DRAFT-001` | 初版草案，CSS 取值以 `fe53383` 源码核对 |
