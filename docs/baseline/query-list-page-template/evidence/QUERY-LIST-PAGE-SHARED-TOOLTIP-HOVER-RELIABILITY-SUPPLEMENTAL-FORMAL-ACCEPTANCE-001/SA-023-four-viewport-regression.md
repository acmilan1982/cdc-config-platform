# SA-023 四视口浏览器回归（原 AC-014）

```bash
CDP_PORT=9731 node capture.mjs http://127.0.0.1:5173 <out.json> sfa
# wrote ... label=sfa   CAPTURE_EXIT=0
```

视口：`1280x800` / `1700x920` / `1920x1080` / `2560x1440`（`Emulation.setDeviceMetricsOverride`，
`Network.setCacheDisabled`，真实后端）。

## 1. 逐视口采集结果

| 采集项 | 1280x800 | 1700x920 | 1920x1080 | 2560x1440 |
|---|---|---|---|---|
| 页面壳直接元素子节点 | 3 | 3 | 3 | 3 |
| 子节点标签 | `HEADER.ql-page__header` / `DIV.ql-q-panel` / `DIV.ql-result-panel` | 同左 | 同左 | 同左 |
| 查询按钮 | 62×30 | 62×30 | 62×30 | 62×30 |
| 重置按钮 | 62×30 | 62×30 | 62×30 | 62×30 |
| 立即刷新按钮 | 110×32 | 110×32 | 110×32 | 110×32 |
| `body` overflow-x / overflow-y | auto / auto | auto / auto | auto / auto | auto / auto |
| `contentArea` `scrollbar-gutter` | stable | stable | stable | stable |
| `contentArea` class | `content-area is-stable-gutter` | 同左 | 同左 | 同左 |
| 横向滚动宿主 | `ql-result-panel__body`（overflow-x auto） | 同左 | 同左 | 同左 |
| 表头列数 | 7 | 7 | 7 | 7 |

## 2. 首载失败态（主动注入 500）

```json
{"childElCount":2,"hasTable":false,"hasQueryBar":false,"errorTexts":true,
 "alertRole":1,"retry":{"x":1018.5,"y":305.890625,"w":88,"h":32}}
```

- 直接元素子节点恰为 2（HEADER + 错误卡片）；
- 无表格、无查询栏；
- 出现"数据加载失败"文案，`role=alert` 唯一；
- "重新加载"按钮几何 88×32；
- **该 500 由本验收主动注入**，属验收注入而非产品错误，注入后已恢复。

## 3. 稳定滚动条槽范围

```json
gutterDeclared   = {"cls":"content-area is-stable-gutter","scrollbarGutter":"stable","clientWidth":1685}
gutterUndeclared = {"cls":"content-area","scrollbarGutter":"auto","clientWidth":1685}
```

声明路由（`/monitor/data-source-state`）获得 `is-stable-gutter` 且 `scrollbar-gutter: stable`；
未声明路由（`/monitor/topic-offset`）保持 `auto` 且无泄漏类。两路由 `content-area` clientWidth 前后一致。

## 4. Tooltip

```json
tooltipTableProbe   = {"count":1,"host":{"position":"fixed","pointerEvents":"none",
                       "textLen":152,"overflowRight":false,"overflowBottom":false,
                       "overflowLeft":false,"overflowTop":false,"w":1831.953125}}
tooltipTableSource  = {"count":1}
tooltipAfterLeave   = {"count":0}
```

同屏宿主唯一、`position: fixed`、不可交互、四向不越界；离开触发源后关闭。

查询候选下拉：

```json
{"open":true,"rect":{"x":341,"y":221,"w":478,"h":274,"right":819,"bottom":495},
 "itemCount":9,"overflowRight":false,"clipped":0,
 "optWrapStyle":{"whiteSpace":"nowrap","textOverflow":"ellipsis","overflow":"hidden","width":478}}
```

候选 Tooltip 最大实测宽度 480（上限内），宿主唯一，无越界。

## 5. 网络与控制台

```json
network.methods = ["GET"]
network.apiRequests = [
  "GET .../src/api/dataSourceSnapshot.ts",
  "GET .../api/monitor/data-source-run-state/list",
  "GET .../src/api/topicOffset.ts",
  "GET .../api/monitor/topic-offset/offsets?pageNum=1",
  "GET .../api/monitor/topic-offset/candidates"
]
consoleErrors = [{"kind":"log.error","text":"Failed to load resource: the server responded with a status of 500 (Internal Server Error)"}]
```

本任务产生的业务请求**全部为 GET**；控制台唯一一条错误即上述主动注入的 500。

## 6. 结论字段

```text
browser_verification_status=PASS
browser_viewport_status=PASS（1280x800 / 1700x920 / 1920x1080 / 2560x1440）
browser_console_status=PASS（仅 1 条验收主动注入的 500）
browser_non_get_request_status=NONE
```
