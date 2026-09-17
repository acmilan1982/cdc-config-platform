# AC-007 / AC-011 / AC-012 / AC-013 契约、作用域与测试证据

## AC-007 加载态几何稳定（浏览器）

常驻指示器契约探针（`probe-spinner-contract.mjs`，在每个正式视口各跑一次）：

| 视口 | 断言总数 | 通过 | 失败 | 退出码 |
|---|---|---|---|---|
| 1280×800 | 58 | 58 | 0 | 0 |
| 1700×920 | 58 | 58 | 0 | 0 |
| 1920×1080 | 58 | 58 | 0 | 0 |
| 2560×1440 | 58 | 58 | 0 | 0 |

覆盖内容：

- 查询 / 重置 / 立即刷新三个按钮的常驻指示器计数恒为 `1 / 0 / 1`（不随状态增删节点）；
- idle 态计算样式：`position:absolute`、盒 `12×12`、`margin-top:-6px`、`border-radius:50%`、`border:2px solid`、`opacity:0`、`visibility:hidden`、`animation-name != none`、`border-left-color == 按钮 currentColor`、`border-top-color` 透明、`aria-hidden="true"`；
- 显示态只切换 `opacity=1` + `visibility=visible`（以 `MutationObserver` 在单次 evaluate 内确定性捕获 `is-visible` 出现的瞬间），显示态仍绝对定位、几何不变，且按钮外框与 idle 态严格逐值相同；
- 两枚 Spinner 边框色互不相同（未写死颜色）；查询为白色、刷新为深色；
- 加载态按钮矩形与文本行矩形（`document.createRange()`）在四态下零位移，动画相位不产生假阴性；
- `prefers-reduced-motion: reduce` 下：动画名 `none`、非 `display:none`、偏移/尺寸/透明可见性声明不变；显示态仍静态可见；Spinner 盒与按钮外框与 idle 严格一致；三个按钮的几何在正常动画与 reduced-motion 之间严格零位移。

辅助事实：`spin-visible` 探针（点击后约 900ms 轮询透明度/可见性切换）与 `indicators` 探针（idle / loading / querying 三态按钮矩形、指示器数量与样式、文本行矩形）在与被验提交同版本的两侧仅 `label` / `baseUrl` 不同，其余事实逐值相同。

## AC-011 稳定滚动条槽作用域

- 机制为 `route.meta.stableScrollbarGutter`；目标是 `MainLayout` 内容区，声明路由为 `/monitor/data-source-state`（`DataSourceRunState`，`frontend/src/router/index.ts:43`：`meta: { title: '源库快照状态', group: '运行监控', stableScrollbarGutter: true }`）；
- `MainLayout.vue` 以 `route.meta.stableScrollbarGutter === true` 计算 `is-stable-gutter`，样式 `.content-area.is-stable-gutter { scrollbar-gutter: stable; }`；
- 未声明路由保持 `scrollbar-gutter: auto`；不存在按路由名硬编码的判断（`code.match(/is-stable-gutter/g)` 与样式各 1 处，断言 `route.meta.stableScrollbarGutter === true` 严格等值）；
- `MainLayout.spec.ts`（11 条）既覆盖启用，也覆盖反泄漏：同一实例在 `OTHER_ROUTE_NAMES`（`DataSource`、`ClientConfig`、`CdcNodeStatus`、`TopicOffset`、`LogQuery`、`JobFailure`、`LargeScreen`）间切换必须移除 class 并能切回；`false`、`'true'`（非布尔）与 `undefined` 一律保持浏览器默认；不存在「非目标即启用」的反向逻辑；`.content-area` 只有一处 `scrollbar-gutter` 声明，无 JS 补偿位移。

浏览器实测：声明路由 `scrollbar-gutter: stable` 且带 `is-stable-gutter`；未声明路由 `scrollbar-gutter: auto` 且不带 class；两条路由的 `content-area clientWidth` 前后严格一致。

## AC-012 参考页等价性

- 「源库快照状态」参考页在 R1 提交 `d1cd3b1` 中零改动，页面自身不在 R1 的 7 个变更文件内；
- 严格零容差比对（见 AC-015）在四个正式视口上对结构、文案、计算样式、几何逐值确认与已批准基线一致，`263 checks / 0 failures`；
- 生命周期行为探针（真实前后端）：首载发起一次 GET 且全部为 GET；点击「查询」新增 1 次请求、30 行；点击「立即刷新」新增 1 次请求、30 行；注入 500 时保留既有 30 行数据；隐藏期间请求增量为 0（倒计时保持 `58` 不变，即暂停）；恢复可见后立即补发 1 次请求并回填 30 行 —— 与实现阶段记录的同一版本结果仅 `label` / `baseUrl` 不同；
- 响应式与错误态：四视口下正常首载、查询/重置/刷新交互、首载失败态（2 个直接元素子节点 + `role="alert"` + 重新加载按钮几何一致）均按既有契约工作。

## AC-013 测试 / 类型检查 / 构建

| 步骤 | 命令 | 结果 | 退出码 |
|---|---|---|---|
| 定向测试 | `npx vitest run src/components/query-list src/composables/query-list` | 8 files / **145 passed** | 0 |
| 定向测试 | `npx vitest run src/views/data-source-run-state` | 9 files / **222 passed** | 0 |
| 定向合计 | 同上两项 | **367 passed / 0 failed** | 0 |
| 全量前端测试 | `npm test`（`vitest run`） | 55 files / **967 passed** | 0 |
| 类型检查 | `npx vue-tsc --noEmit` | 无输出 | 0 |
| 生产构建 | `npm run build` | 构建成功 | 0 |

定向测试合计 367、全量前端测试 967，与实现阶段 R1 记录完全一致，无测试发现范围变化、无仓库事实变化。

相关测试文件用例数（全量运行记录）：`QueryListRefreshToolbar.spec.ts` 26、`useQueryListTooltip.spec.ts` 26、`shared-layer.spec.ts` 16、`QueryListTooltipHost.spec.ts` 21、`QueryListActions.spec.ts` 18、`QueryListResultPanel.spec.ts` 16、`QueryListPageShell.spec.ts` 12、`QueryListQueryPanel.spec.ts` 10（合计 145）；`DataSourceSnapshotQueryBar.spec.ts` 103、`useDataSourceSnapshot.spec.ts` 26、`DataSourceSnapshotTable.spec.ts` 30、`DataSourceRunStatePage.spec.ts` 18、`useDataSourceSnapshot.errorChain.spec.ts` 6、`format.spec.ts` 21、`DataSourceSnapshotStatusTag.spec.ts` 8、`selection.spec.ts` 7、`rowKey.spec.ts` 3（合计 222）。
