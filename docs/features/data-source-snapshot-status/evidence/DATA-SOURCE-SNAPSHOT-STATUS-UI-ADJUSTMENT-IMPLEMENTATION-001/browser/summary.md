# Browser Evidence — 源库快照状态 UI 调整视觉验证

- 任务：`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`（前端只读 UI 调整实现，DESIGN §19 / UI §13）
- 证据目录：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001/browser`
- 取证方式：Headless Chrome（`google-chrome` 148，`--headless=new --no-sandbox --disable-gpu --no-proxy-server --remote-debugging-port=9222`）经 CDP `Emulation.setDeviceMetricsOverride` + `Page.captureScreenshot` + `Runtime.evaluate` 驱动；应用页经 Vite dev server 访问（`0.0.0.0:5173`，`/api/*` 代理到 `127.0.0.1:8080` 后端只读接口 `GET /api/monitor/data-source-run-state/list`）。
- 取证脚本（不入仓）：`/tmp/cdc_uiadj_capture.mjs`
- 页面地址（保持运行供验收）：`http://192.168.174.70:5173/monitor/data-source-state`（dev server PID 4615，后端 PID 4592）

## 截图清单

| 文件 | 内容 |
|---|---|
| `01-load-1440.png` | 1440×900 首次自动查询后整页：页头 + 独立查询卡片 + 独立结果卡片（30 行） |
| `02-load-1920.png` | 1920×1080 首次自动查询后整页（30 行） |
| `03-tooltip-client-desc.png` | 悬停探针端（CLIENT_ID 省略）单元格，页面级单实例 Tooltip 展示完整长 CLIENT_DESC |
| `04-tooltip-status-raw.png` | 悬停快照状态单元格，Tooltip 展示原始 `SNAPSHOT_RUNNING` 等原始状态值 |
| `05-tooltip-single-instance.png` | 快速横向扫过 状态→探针端 两个触发点后，body 中 Tooltip Host 恒为 1 |

## DOM 测量（Headless Chrome 实测）

### 1440×900 与 1920×1080 首次加载（01/02）
- `.dss-page-header` 存在：`<h2>源库快照状态</h2>` + `.dss-desc`“展示各探针端与源库组合的初始快照阶段状态；页面只读。”
- `.dss-query-card` 与 `.dss-result-card` 均存在（三块清晰分区）。
- 结果卡片头部 `.dss-result-card__header` 直接子元素恰好 2 组：左 `.dss-result-summary`（`共 30 条` + `其中 6 条未知状态`），右 `.dss-refresh-group`（`60 秒自动刷新`＋`最近成功刷新：HH:mm:ss`＋`立即刷新`）。
- 表头 7 列按序：`序号 / 探针端 / 源库 / 快照状态 / 快照启动时间 / 快照完成时间 / 记录更新时间`。
- `rowCount=30`；`.dss-time-dash=32`；`nativeTitleInTable=0`（无原生 title）；`.dss-hint-icon=67`（缺失/停用/类别异常提示图标）；`.el-loading-mask` 未出现；`.dss-result-error` 无。
- 两个分辨率下结构/数值一致（宽屏不挤压时间列、表格容器横向可滚动由固定总宽 1145px 承载）。

### Tooltip（页面级单实例，DSS-REQ-070 / AC-076/077）
- 悬停探针端 `client-desc-` 触发点约 420ms：`dss-single-tooltip[data-tt-host="1"]` 出现且 `count=1`，内容为完整长 `CLIENT_DESC` 全文，`inViewport=true`（宽 420 达 max-width，贴近单元格并边界避让）。
- 悬停快照状态 `status-` 触发点：Tooltip 显示 `原始状态：SNAPSHOT_RUNNING`，`inViewport=true`。
- 快速扫 状态→探针端：结束后 Host `count=1`（先关后开、不残留）。
- 说明：Tooltip 锚点几何在 `show`（鼠标进入提交）时刻取样；滚动/resize/records 替换等位置失效事件由页面级全局关闭覆盖，延迟窗内不再依赖触发元素存活（本实现同时规避宿主表格在 jsdom 中于 hover 重建单元格导致旧节点失连的测试环境问题）。

## 备注
- 视觉验证为非正式人工验收的一部分材料；正式人工页面验收状态保持 `NOT_RUN`，由项目负责人在 Windows IDEA/浏览器对 `http://192.168.174.70:5173/monitor/data-source-state` 复核。
- 数据为开发库内既有快照状态只读样例（30 行，含 6 条未知、32 个 `--` 空时间与长描述行），服务与页面保持运行。
