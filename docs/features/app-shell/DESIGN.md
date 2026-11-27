# CDC 平台公共布局（app-shell）——设计（DESIGN.md）

> 文档状态：`APPROVED`（2026-11-27 项目负责人批准，已审提交 `979180e`）
> 建立任务：`CDC-APP-SHELL-FEATURE-BASELINE-DRAFT-001`
> 建立日期：2026-11-27
> 实现取材版本：`fe53383e81151718c9cff2e741ff2a8fbf2db352`

## 1. 分层职责

| 文件 | 职责 |
|---|---|
| [`frontend/src/App.vue`](../../../frontend/src/App.vue) | 顶层分流：`route.meta.standalone === true` → 直接渲染 `<router-view/>`（独立大屏）；否则渲染 `MainLayout` |
| [`frontend/src/layouts/MainLayout.vue`](../../../frontend/src/layouts/MainLayout.vue) | 组合侧栏/顶栏/标签/内容区；空工作区判定；RouterView 与文档内承载宿主的二选一；滚动保存与还原 |
| [`frontend/src/layouts/Sidebar.vue`](../../../frontend/src/layouts/Sidebar.vue) | 固定侧栏、品牌、分组菜单、当前路径命中；日志查询重复点击重新初始化 |
| [`frontend/src/layouts/HeaderBar.vue`](../../../frontend/src/layouts/HeaderBar.vue) | 面包屑（`route.meta.group` → `route.meta.title`） |
| [`frontend/src/layouts/PageTabs.vue`](../../../frontend/src/layouts/PageTabs.vue) | 标签渲染、激活/关闭、键盘导航、激活项滚动到可视范围 |
| [`frontend/src/layouts/InDocumentPageHost.vue`](../../../frontend/src/layouts/InDocumentPageHost.vue) | 两个管理页的文档内常驻承载；活动/非活动可见性与交互性切换 |
| [`frontend/src/router/index.ts`](../../../frontend/src/router/index.ts) | 路由表、`meta`（title/group/standalone/emptyWorkspace/stableScrollbarGutter）；导航前置守卫同步标签 |
| [`frontend/src/stores/tabs.ts`](../../../frontend/src/stores/tabs.ts) | 标签数组与激活路径、可缓存视图/路径、滚动位置；开/关/清空逻辑 |
| [`frontend/src/config/menu.ts`](../../../frontend/src/config/menu.ts) | 侧栏菜单分组与菜单项（路径、标题、图标） |

职责边界：公共布局只做**外层导航与容器**。业务接口、表结构与页面内部查询/表格/弹窗模板由对应业务 Feature 与 `docs/baseline/` 模板维护，本 Feature 不承载业务数据语义。

## 2. 组件与状态职责

- **路由守卫（`beforeEach`）**：在导航**确认前**执行，先于目标页渲染写入标签状态，使宿主路径在页面出现前就绪。规则：
  - `meta.standalone` → 跳过（不参与标签）；
  - `meta.emptyWorkspace` → `clearActive()`；
  - 有 `meta.title` → `open(to.path, title)`。
- **tabs store**：
  - `tabs[]`（`{path,title}`）与 `activePath` 仅存**本次页面会话内存**；
  - `CACHEABLE_VIEWS` 映射“需保留实例”的路由路径 → SFC 组件名（当前仅 `/config/data-source`→`DataSourcePage`、`/config/client`→`ClientConfigPage`）；
  - `cachedViews` / `cachedPaths` 由已打开标签按 `CACHEABLE_VIEWS` 过滤得出（同源）；
  - `scrollPositions: Map<path, number>` 记录 `.content-area` 滚动位置（不参与响应式渲染）；
  - `open()` 按路径去重；`close()` 优先返回右邻、否则左邻、最后 `null`，并删除该路径滚动记录（仅删除 store 记录；随后路由切换的滚动保存可能再次写回离开页位置，见 §6）。
- **MainLayout**：
  - `emptyWorkspace = route.meta.emptyWorkspace === true`；
  - `hostOwnsRoute = inDocumentPaths.includes(route.path)`；
  - RouterView `v-if="!emptyWorkspace && !hostOwnsRoute"`，避免与宿主重复挂载同一页；
  - `inDocumentPaths` 见 §4 的保留窗口；
  - 路由 `path` 变化时保存 `from`、在 `nextTick` 还原 `to` 的滚动位置。

## 3. 页面行为矩阵

| 页面类型 | 首次进入 | 切走（离开路由） | 切回 | 关闭标签后 |
|---|---|---|---|---|
| **数据源管理 / 探针端管理**（常驻承载） | 首次实际打开时挂载进 `InDocumentPageHost`，发起一次列表请求 | 实例保留在 document 内：改为隐藏（`absolute` + `visibility:hidden` + `pointer-events:none` + `inert` + `aria-hidden`）；DOM、有效宽度、筛选/选中/滚动状态保留；不卸载 | 恢复可见与交互；还原 `.content-area` 滚动位置；**不发新列表请求**；因宽度未变，无需按新宽度整表重算 | 从宿主移除该路径实例、释放组件、清除滚动记录；若关闭的是激活标签则切换到右邻/左邻或空工作区；重开为全新实例 + 一次请求，用户可见滚动位置为顶部（本轮实测见 §6） |
| **普通业务页**（如数据订阅、中心端配置） | RouterView 渲染，发起自身请求 | 卸载，DOM 移除；不在 `CACHEABLE_VIEWS`，不进入 keep-alive 缓存 | 重建组件，按原有数量重新请求 | 无保留实例；重开重建 |
| **带轮询的监控页**（如 CDC 节点状态） | 挂载并启动自身定时器/轮询 | 卸载 → 定时器停止，不再后台轮询 | 重建 → 按既有节奏重新启动 | 同上；离开即停止轮询 |
| **独立大屏 `/large-screen`** | 由 `App.vue` 直接渲染，不加载公共布局与标签 | 不参与标签/宿主；进入时 `App.vue` 卸载 `MainLayout`，已打开的常驻页实例与标签随之销毁 | 返回公共布局后按当前 URL 重建，管理页重新挂载并请求列表 | 不适用（不入标签） |

## 4. 两个管理页的承载机制（防重复挂载与重复请求）

1. **按需挂载**：宿主只为 `inDocumentPaths` 中的路径渲染 `defineAsyncComponent`，仅在首次打开对应标签后挂载，未打开不预挂载。
2. **单实例**：宿主以 `path` 为 `v-for` 的 `:key`，同一路径只有一份实例；`open()` 按路径去重保证 `cachedPaths` 不重复。
3. **抑制重复渲染**：当 `hostOwnsRoute` 为真时，RouterView 不再渲染该页，避免“宿主 + RouterView”两份实例。
4. **保留窗口（关闭激活标签的瞬时帧）**：关闭激活标签时，store 先移除路径、随后才导航。为避免“路径已移除但路由尚未跳转”这一帧内 RouterView 临时重挂载并发起多余请求，`inDocumentPaths` 计算为：

   ```text
   open = tabsStore.cachedPaths
   inDocumentPaths = (isPersistentViewPath(route.path) && !open.includes(route.path))
                     ? [...open, route.path]
                     : open
   ```

   即当前路由仍指向刚关闭的管理页时，本帧继续由宿主承载它；路由跳转完成后路径自然退出。
5. **无重复列表请求**：实例在切换间保持不变，故两管理页互切不触发列表 GET；关闭激活标签也不因瞬时重挂载而多发请求（生命周期证据见验收报告）。
6. **挂载期边界**：原位保留只在 `MainLayout` 持续挂载期间成立。同一浏览器标签内进入 `/large-screen`（`meta.standalone`）时，`App.vue` 改为直接渲染 `<router-view/>`，`MainLayout` 与 `InDocumentPageHost` 卸载，宿主内实例、标签与滚动记录一并销毁；返回公共布局后按当前 URL 重建。同路径仅查询字符串变化则既不改变标签集合，也不重建宿主实例。

## 5. 隐藏页的点击 / 焦点 / 浮层隔离

- 非活动页 `visibility:hidden` + `pointer-events:none`，命中测试不会落在其任何子节点。
- `inert` 使整棵子树不可聚焦、不可被辅助技术交互；`aria-hidden="true"` 使其不进入可访问性树。
- 宿主 `position:relative; overflow:hidden` 裁剪隐藏页纵向溢出，隐藏页不扩大滚动范围。
- 隐藏页的 `el-dropdown`/popper 等浮层通常传送至 `body`，路由切换时会自动关闭，不残留可见态；活动页与隐藏页的浮层归属互不串扰。

## 6. 滚动归属

- **唯一纵向滚动容器**：`.content-area`（`overflow-y:auto`）。页面自身不应再建立与之竞争的全高滚动根。
- 切换标签时由 MainLayout 的 `route.path` watch 保存离开页 `scrollTop`、`nextTick` 还原目标页；滚动记录由 store 统一持有。watch 以 `route.path` 为键，仅查询字符串变化不触发保存/恢复（本轮实测：变为 `?probe=1` 后标签数、宿主实例数与 `scrollTop` 均不变）。
- 因两个管理页实例常驻且宽度保留，切回时其表格不需要按“新宽度”重放 ResizeObserver / Element Plus 列布局；隐藏期间其自身滚动位置也保留。实例保留场景下恢复有效（本轮实测 4800 → 切走 → 切回 4800）。
- **关闭与重开的三层语义**：`close()` 删除该路径滚动记录；随后路由切换仍会执行一次“保存离开页 `scrollTop`”，可能把该路径记录再次写回；重开时新实例在列表返回前尚不具备完整滚动高度，恢复写入会被夹到 0。本轮 5202 实测：关前 `scrollTop=4873` → 关闭激活的数据源标签（跳到右邻“探针端管理”，0 次列表 GET）→ 从侧栏重开新增 1 次列表 GET、273 行，两帧及 0.5/1.5s 后 `scrollTop` 均为 0。该“重开在顶部”的结论绑定当次挂载/请求时序，不作为跨实现保证；若调整恢复时机需重新验证。

## 7. 新页面接入检查清单

新增或改造页面时，请逐项核对：

1. **路由元数据**：提供 `meta.title`、`meta.group`（驱动面包屑与标签标题）；仅在确需独立布局时设 `meta.standalone`；仅在需要稳定滚动条槽位时设 `meta.stableScrollbarGutter: true`（严格布尔）。
2. **是否需要保留实例**：只有确需跨标签保留筛选/结果/滚动/选中态的页面才应常驻。加入常驻需**同时**：
   - 在 `stores/tabs.ts` 的 `CACHEABLE_VIEWS` 增加“路径 → SFC 组件名”（路径键须与宿主 `PAGE_COMPONENTS` 的映射一致）；
   - 在 `InDocumentPageHost.vue` 的 `PAGE_COMPONENTS` 注册同路径的 `defineAsyncComponent`。
   两处缺一会导致该路径被判定为可缓存却没有承载组件，或反之。
3. **生命周期**：普通页与监控页必须在卸载时清理定时器/订阅/监听（`onUnmounted`），否则离开后仍在后台运行；常驻页应假定组件不会被反复重建，状态跨切换持续存在。
4. **滚动归属**：页面内部的滚动应落在 `.content-area`（或页面自身受控区域），不要另建与布局竞争的整页滚动容器，也不要自行覆盖公共滚动恢复。
5. **重挂载依赖**：若某页面依赖“每次进入都重置状态”，则**不要**设为常驻；常驻页重开（关闭后重新打开）才会得到全新实例。
6. **隐藏期行为**：常驻页在隐藏期间应无后台请求；对 `ResizeObserver` 驱动的昂贵测量应保证“宽度未变不重放”（参考 `c2ee0c4` 对探针端 chip 测宽按批次缓存的优化）。
7. **独立大屏**：若为独立路由，设 `meta.standalone: true`，不依赖 `MainLayout` 提供的任何容器或标签能力。

## 8. 边界

- 本 Feature **不**定义业务后端接口、数据库表结构、校验规则或业务行语义；这些由对应业务模块与 `docs/baseline/` 模板维护（见 README §5）。
- 公共布局的布局、滚动与生命周期结论以本目录文档与源码为准；业务页内部的模板结论以对应模板文档为准。

## 9. 变更记录

| 日期 | 任务 | 说明 |
|---|---|---|
| 2026-11-27 | `CDC-APP-SHELL-FEATURE-BASELINE-DRAFT-001` | 初版草案，基于 `fe53383` 源码 |
| 2026-11-27 | `CDC-APP-SHELL-BASELINE-REVIEW-R1` | 补充滚动重开实测与三层语义、公共布局卸载边界、查询字符串不触发滚动保存/恢复 |
| 2026-11-27 | `CDC-APP-SHELL-BASELINE-CLOSEOUT-001` | 文档状态批准为 `APPROVED`（项目负责人批准，已审提交 `979180e`）；内容零业务语义变化 |
