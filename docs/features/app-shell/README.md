# 全局应用外壳（app-shell）

功能目录：`app-shell`

> 本文件记录**当前已实现并经人工验收**的应用外壳与公共视觉主题实现事实。

---

## 1. 功能定位

`app-shell` 是普通管理页面共享的全局应用外壳，负责：

- 左侧 Logo 与菜单区域；
- 顶部栏与面包屑；
- 主内容区公共布局；
- 公共视觉主题；
- 普通管理页面的菜单选中态。

standalone 大屏 `/large-screen` 不渲染普通应用外壳（不显示侧栏、顶部栏和 `MainLayout`）。

---

## 2. 当前实现状态

| 项目 | 状态 |
|---|---|
| 视觉主题 | 已实现并人工验收通过 |
| 菜单图标 | 已实现并人工验收通过 |
| 界面显示名称 | 已实现并人工验收通过 |
| 固定侧栏 | 已实现并人工验收通过 |
| 菜单分组折叠 | 不在当前范围 |
| 大屏新标签页打开 | 延期，尚未实现 |

---

## 3. 布局结构

`App.vue` 根据路由 `meta.standalone` 判断渲染方式：

- `standalone === true`（仅 `/large-screen`）：直接渲染 `<router-view>`，全屏；
- 否则：渲染 `MainLayout`。

`MainLayout.vue` 结构：

```text
Sidebar（固定 220px 左侧菜单）
└── layout-right
    ├── HeaderBar（顶部栏 + 面包屑）
    └── content-area（页面容器）
        └── content-card（内容卡片）
            └── router-view
```

---

## 4. 左侧侧栏与菜单

- 侧栏固定宽度 `220px`，固定保持展开，不提供 `64px` 折叠态，不保存或切换折叠状态；
- Logo 区固定显示“CDC 数据同步平台”；
- “配置管理”“运行监控”为静态分组标题，不可点击、不显示展开/收起控件、不支持手风琴式折叠，下级菜单始终展示；
- 每个菜单项显示线性图标，图标与文字始终同时显示；
- 当前菜单显示蓝色选中块、白色文字和左侧强调线。

### 4.1 主题令牌（实际生效值）

颜色通过 `styles/theme.css` 中的 CSS 变量（`--app-*`）实现，与 `REQUIREMENTS.md` 第 10 节设计令牌一致：

| 语义对象 | 实际色值 |
|---|---|
| 侧栏主背景 | `#0F172A` |
| Logo 区背景 | `#111C30` |
| 菜单分组文字 | `#94A3B8` |
| 普通菜单文字 | `#CBD5E1` |
| 菜单悬停背景 | `#1E293B` |
| 当前菜单背景 | `#1D4ED8` |
| 当前菜单文字 | `#FFFFFF` |
| 当前菜单左侧强调线 | `#60A5FA` |

### 4.2 菜单图标

- 图标通过 `Sidebar.vue` 中 `@element-plus/icons-vue` 的显式按需导入与 `iconMap` / `resolveIcon` 映射解析；
- 未知图标采用安全降级，不导致页面崩溃；不全量注册图标库。

---

## 5. 顶部栏与面包屑

- 顶部栏采用浅色背景，左侧直接显示当前模块与面包屑；
- 不存在侧栏折叠/展开按钮，不保留折叠按钮的空白占位或不可见点击区域；
- 顶部栏与主内容区始终按固定 `220px` 侧栏对齐。

---

## 6. 页面背景与公共视觉

- 普通管理页面使用浅灰蓝页面背景（`#F1F5F9`）、白色内容卡片（`#FFFFFF`）与克制边框（`#E2E8F0`）；
- 主文字 `#0F172A`、次要文字 `#64748B`、主操作按钮 `#2563EB`；
- 内容卡片圆角 `8px`；
- 保留卡片、查询区、表格、按钮、状态标签、空状态、加载状态和错误状态的公共视觉风格；
- 页面业务内容中的折叠面板（如故障监控卡片展开/收起）与侧栏折叠无关，正常保留。

---

## 7. 界面显示名称

当前界面显示名称为：

```text
CDC 数据同步平台
```

生效位置：

- 左侧 Logo 区（`Sidebar.vue`）；
- 浏览器页签标题（`index.html`），所有前端路由统一使用同一静态标题，包括 `/large-screen`。

说明：

- 仅为界面显示名称调整，不是项目正式更名；
- 仓库名、目录名、包名、路由和接口未更名；
- 不存在动态路由标题拼接；
- favicon 未因本轮调整而修改。

---

## 8. standalone 大屏边界

- `/large-screen` 继续为 standalone 独立全屏页面；
- 大屏页面不显示左侧侧栏、顶部栏和普通 `MainLayout`；
- 当前菜单入口仍保持任务前的打开行为；
- “点击菜单后在新浏览器标签页打开大屏”是已确认但延期的独立需求，尚未实现。

---

## 9. 关键代码入口

| 层次 | 文件 | 说明 |
|---|---|---|
| 根组件 | `frontend/src/App.vue` | `meta.standalone` 判断，决定全屏或包裹 `MainLayout` |
| 主布局 | `frontend/src/layouts/MainLayout.vue` | 固定 `220px` 侧栏 + 顶部栏 + 页面容器 |
| 左侧菜单 | `frontend/src/layouts/Sidebar.vue` | 基于 `menu.ts` 渲染两组菜单，固定展开，含图标映射 |
| 顶部栏 | `frontend/src/layouts/HeaderBar.vue` | 面包屑（无折叠按钮） |
| 菜单配置 | `frontend/src/config/menu.ts` | 两个分组、10 个菜单项（含图标名） |
| 路由 | `frontend/src/router/index.ts` | 12 条路由；`/large-screen` standalone |
| 全局样式 | `frontend/src/styles/global.css` | 全局 CSS（含页面背景） |
| 主题令牌 | `frontend/src/styles/theme.css` | `--app-*` / Element Plus 变量覆盖 |
| 页签标题 | `frontend/index.html` | `<title>CDC 数据同步平台</title>` |
| 应用状态 | `frontend/src/stores/app.ts` | `appName`/`version`/`env`（无折叠状态） |

---

## 10. 当前验证与已知延期项

- 前端 `npm run build` 已通过（`vue-tsc --noEmit` + `vite build`）；
- 用户已在真实普通管理页面完成人工视觉验收，结论 `ACCEPTED`；
- 浏览器页签标题由源码事实确认（最终截图未包含浏览器页签区域）。

**延期项**：

```text
点击“数据同步统计大屏”菜单后，在新浏览器标签页打开 /large-screen
状态：DEFERRED / PENDING
```

该延期项为后续独立任务，本轮验收不包含，`/large-screen` 当前保持 standalone 定位与原打开行为。

---

## 11. 文档导航

| 文档 | 说明 |
|---|---|
| `README.md`（本文件） | 当前实现事实 |
| [REQUIREMENTS.md](REQUIREMENTS.md) | 已确认需求与实现、验收状态 |
| [PROJECT.md](../../baseline/PROJECT.md) | 项目总览 |
| [ARCHITECTURE.md](../../baseline/ARCHITECTURE.md) | 系统架构 |
| [DEVELOPMENT_RULES.md](../../baseline/DEVELOPMENT_RULES.md) | 开发规则 |
| [CLAUDE.md](../../../CLAUDE.md) | Agent 开发规范 |
