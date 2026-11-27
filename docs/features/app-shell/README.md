# CDC 平台公共布局（app-shell）Feature 入口（README）

> 本文件是“平台公共布局”（`app-shell`）Feature 的**状态与导航入口**，不承载新的正式结论；正式结论以本目录各专门文档为准。
>
> 文档状态：`DRAFT_PENDING_OWNER_REVIEW`（本目录五份主文档为**本地草案**，待项目负责人审阅，尚未批准）
> 建立任务：`CDC-APP-SHELL-FEATURE-BASELINE-DRAFT-001`
> 建立日期：2026-11-27
> 实现版本（已合入 `origin/develop`）：`fe53383e81151718c9cff2e741ff2a8fbf2db352`
> 固定侧栏基线提交：`bab094969ce07123d4094bc8c496a3c71da66bd9`
>
> ```text
> implementation_status=IMPLEMENTED_MERGED          # fe53383 已快进合入 origin/develop
> fixed_sidebar_acceptance_status=PASSED_OWNER_MANUAL
> warm_tab_switch_acceptance_status=PASSED_OWNER_MANUAL
> docs_approval_status=PENDING_OWNER_REVIEW
> ```

## 1. 功能定位

`app-shell` 是**平台公共布局**：为所有业务页面提供统一的外层导航与容器，包括

- 左侧深色固定侧栏（品牌标题 + 分组菜单）；
- 顶部面包屑栏；
- 页面标签条（已打开页面之间切换、关闭、键盘操作）；
- 主内容区（唯一的纵向滚动容器、空工作区）；
- 已打开管理页的“文档内常驻承载”机制；
- 独立大屏页的布局分流。

它**不**负责业务页面内部的查询条件、结果表格、行操作和弹窗，这些由各业务 Feature 与其引用的公共模板维护（见 §5）。

## 2. 当前布局

```text
┌───────────────┬──────────────────────────────────────────────┐
│ CDC 配置管理平台 │ HeaderBar（面包屑，高 48px）                     │
│ （220px 固定）  ├──────────────────────────────────────────────┤
│               │ PageTabs（已打开页面标签，可横向滚动）             │
│ 配置管理        ├──────────────────────────────────────────────┤
│  数据源管理      │ .content-area（唯一纵向滚动容器，#f0f2f5）       │
│  探针端管理      │   .content-card（白色卡片，padding 20px）        │
│  数据订阅       │     RouterView 或 InDocumentPageHost            │
│  中心端配置      │                                                │
│ 运行监控        │                                                │
│  …            │                                                │
└───────────────┴──────────────────────────────────────────────┘
```

侧栏 `position: fixed`、宽 220px、始终展开、无折叠入口；右侧 `.layout-right` 以 `margin-left: 220px` 让位。顶部结构与纵向滚动归属见 [UI.md](./UI.md)、[DESIGN.md](./DESIGN.md)。

## 3. 适用路由

| 路由 | 名称 / 分组 | 布局归属 |
|---|---|---|
| `/config/data-source` | 数据源管理 / 配置管理 | 公共布局；**常驻承载**（保留实例） |
| `/config/client` | 探针端管理 / 配置管理 | 公共布局；**常驻承载**（保留实例） |
| `/config/subscribe`、`/config/server` | 数据订阅、中心端配置 / 配置管理 | 公共布局；普通页（切换即卸载重建） |
| `/monitor/*`（含 `cdc-node`、`data-source-state`、`topic-offset`、`log-query`、`job-failure` 系列） | 运行监控 | 公共布局；普通页（含轮询页，离开即停止） |
| `/workspace` | 空工作区（无标题/分组） | 公共布局；关闭最后一个标签后进入 |
| `/large-screen` | 独立大屏（`meta.standalone`） | **不进入公共布局**，由 `App.vue` 直接渲染 |

根路径 `/` 重定向到 `/config/data-source`。

## 4. 实现提交与验收范围

- 实现由 7 笔提交组成（`b837d17 → ad6f5be → 572ba1a → 060aec1 → 6661eab → c2ee0c4 → bab0949 → fe53383`），最终以普通快进合入 `origin/develop`（`b837d17..fe53383`）。
- **固定侧栏**：`bab0949` 之前已在 Windows Chrome 由项目负责人人工验收，原话“固定侧栏验收通过”。
- **两个管理页标签切换体感**：`fe53383`（5202 候选）于 2026-11-27 由项目负责人人工验收，反馈“数据源管理与探针端管理的 tab 切换，感觉不到明显的停顿”；服务器侧另有 72/72 有效 A/B 样本、343 项定向测试与生产构建证据（见 [reports/APP-SHELL-ACCEPTANCE-5202.md](./reports/APP-SHELL-ACCEPTANCE-5202.md)）。
- **文档状态**：本目录文档为草案，`docs_approval_status=PENDING_OWNER_REVIEW`，未获批准。

## 5. 与其他模板层的边界

公共布局只负责**页面外层导航与容器**。业务页面内部的查询面板、结果表格、新增/编辑弹窗等模板，分别由项目级模板维护：

- 查询列表页模板：[docs/baseline/query-list-page-template/README.md](../../baseline/query-list-page-template/README.md)
- 列表表格视觉模板：[docs/baseline/list-table-visual-template/README.md](../../baseline/list-table-visual-template/README.md)
- 新增/编辑弹窗视觉模板：[docs/baseline/create-edit-dialog-visual-template/README.md](../../baseline/create-edit-dialog-visual-template/README.md)

业务接口、数据库表结构与校验规则由对应业务 Feature 维护，本 Feature 不重复定义。

## 6. 文档导航

| 文档 | 面向读者 | 内容 |
|---|---|---|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | 负责人 / 开发者 | 可观察行为编号（`AS-REQ-*`），覆盖侧栏、菜单与面包屑、标签、恢复、关闭/空工作区/历史、刷新与重开、大屏与窄窗 |
| [UI.md](./UI.md) | 负责人 / 开发者 | 当前深色 A 版外观、220px 固定侧栏、标签与面包屑视觉、空工作区、窄窗与大屏边界，附已核对 CSS 取值 |
| [DESIGN.md](./DESIGN.md) | 开发者 | 组件/菜单/路由/标签职责、页面行为矩阵、文档内承载机制、隐藏隔离、滚动归属、新页面接入清单 |
| [ACCEPTANCE.md](./ACCEPTANCE.md) | 负责人 / 开发者 | 可重复验收用例（`AS-AC-*`）与需求映射、已有证据覆盖、待验证项 |
| [reports/APP-SHELL-ACCEPTANCE-5202.md](./reports/APP-SHELL-ACCEPTANCE-5202.md) | 负责人 | 5201/5202/合入版本对应关系、人工与服务器验收事实、代表性耗时 |

相关业务页面文档：[数据源管理](../data-source-management/README.md)、[探针端管理](../client-config/README.md)。

## 7. 变更记录

| 日期 | 任务 | 说明 |
|---|---|---|
| 2026-11-27 | `CDC-APP-SHELL-FEATURE-BASELINE-DRAFT-001` | 建立本 Feature 五份主文档与验收报告草案，实现取材版本 `fe53383` |
