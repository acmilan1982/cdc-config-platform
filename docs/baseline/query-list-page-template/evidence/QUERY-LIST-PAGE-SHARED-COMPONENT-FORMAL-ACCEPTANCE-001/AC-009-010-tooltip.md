# AC-009 / AC-010 Tooltip 单实例、数据流与 aria-describedby 证据

## AC-009 单实例与数据流

### 9.1 每页至多 1 个 Host、1 个控制器

- 控制器 `useQueryListTooltip` 每个实例生成唯一 `hostId`，格式 `ql-tooltip-host-N`（`useQueryListTooltip.spec.ts` → 「每个控制器拥有唯一 hostId，格式为 ql-tooltip-host-N」）；
- 参考页只调用一次 `useQueryListTooltip()`，模板中只有一个 `<QueryListTooltipHost :id="tooltip.hostId" :target="tooltipCurrent" />`；
- Host 以 `id` 直接取传入值，自身不生成第二个 ID；`Teleport` 到 `body`，任意时刻 body 内至多 1 个 Host，清空后无残留（`QueryListTooltipHost.spec.ts` → 「id 直接取传入值（Host 不生成第二个 ID）」「目标切换与清空：任意时刻 body 内至多 1 个 Host；清空后无残留」）。

### 9.2 宽度上限链路

`show → 校验 → target.maxWidthPx → Host 最终 max-width → 测量`：

- 控制器 `normalizeMaxWidthPx` 只接受有限正数，`0` / 负数 / `NaN` / `Infinity` / 缺失一律视为省略（`useQueryListTooltip.spec.ts` → 「有限正数被原样投影到 target.maxWidthPx」「0 / 负数 / NaN / Infinity / 缺失一律视为省略」）；
- Host 最终宽度：省略时 `var(--ql-tooltip-max-width, calc(100vw - 16px))`，显式时 `min(<px>px, var(--ql-tooltip-max-width, calc(100vw - 16px)))`（`QueryListTooltipHost.spec.ts` → 「省略 maxWidthPx：只使用视口安全上限」「显式 maxWidthPx：收窄为 min(给定 px, 视口安全上限)」）；
- 查询候选显式传 `480`：`DataSourceSnapshotQueryBar.vue` 调用 `showTooltip({ …, maxWidthPx: 480 })`，浏览器实测最大宽度 = `480`（严格比对脚本 notes：`after 查询候选 Tooltip 最大实测宽度=480`），且逐项断言 `rect.w <= 480`；
- 表格调用不传 `maxWidthPx`：`DataSourceSnapshotTable.vue` 三处 `showTooltip({ key, content, el })` 均无该字段，实际取 `calc(100vw - 16px)` 视口安全上限。

### 9.3 定位与关闭

- 以锚点矩形定位（非指针坐标）：上游空间充足且不小于下方时置上（`top = anchor.top - height - 8`），否则置下（`top = anchor.bottom + 8`），水平居中并按 `8px` 边距夹取；极小视口收敛到 `(8, 8)` 且不出现负坐标；无 `420px` 硬上限（`QueryListTooltipHost.spec.ts` 共 13 条定位断言）；
- 单实例切换：新 key 先即时关闭旧项，旧项待揭示定时器作废（`useQueryListTooltip.spec.ts` → 「单实例：新 key 先即时关闭旧项，旧项的待揭示定时器作废」）；
- 关闭正确：`scroll`（捕获）/ `resize` / `visibilitychange` 均关闭当前目标，含表格容器内部滚动（同文件 → 「scroll（捕获）/ resize / visibilitychange 均关闭当前目标」「表格容器内部滚动（捕获阶段）同样关闭目标」）。

### 9.4 参考页未新增键盘触发与 Escape 关闭

控制器默认不启用 Escape 关闭，仅当显式 `escape: true` 才启用；参考页 `bindGlobalClose()` 未传该选项（`useQueryListTooltip.spec.ts` → 「默认不启用 Escape 关闭（参考页面阶段一不得静默新增该交互）」「显式 escape=true 时才启用 Escape 关闭」）。

### 9.5 浏览器实测

四视口严格比对：表格探针 Tooltip 出现且唯一、四向均不越出视口、`position: fixed`、`pointer-events: none`、文案长度与基准一致、离开触发源后关闭；候选下拉逐项悬停 Tooltip 宿主唯一、四向不越界、宽度不超 480；候选下拉项无横向裁切。

## AC-010 aria-describedby 生命周期

静态断言（`useQueryListTooltip.spec.ts` →「useQueryListTooltip aria-describedby 关联」共 8 条）：目标成为 current 时追加自身 hostId token；追加不改写既有 token，顺序为「原有 token + hostId」；按 ASCII 空白拆分并去重，自身 token 不重复追加；切换目标先清除旧元素自身 token 再关联新元素；只移除自身 token，清空后删除属性（不遗留空 `aria-describedby`）；延迟窗内取消不建立关联；`destroy` 清除延迟、移除自身关联并进入终止态。

浏览器实测（1920×1080，真实前后端与真实浏览器）：

| 阶段 | `hostCount` | `hostIds` | 携带 `aria-describedby` 的元素 |
|---|---|---|---|
| idle | 0 | — | 0 |
| 悬停表格探针单元格 `.dss-probe-main` | 1 | `["ql-tooltip-host-1"]` | 1：`SPAN.dss-cell-main.dss-probe-main.dss-tt.dss-mono`，值 `ql-tooltip-host-1` |
| 指针离开 | 0 | — | 0 |

7 项断言全部通过（关联值等于宿主 id、关联落在被悬停的单元格上、离开后属性被移除而非留空）。
