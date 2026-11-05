# CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004 证据目录

任务：探针端管理列表、三点菜单与行高验收（18 项）
基线：`968c1e57534d1fc6392ea499a0860a901fded6ab`
页面范围：仅 `/config/client`。未访问“数据源管理”或其他功能页面。

## 目录

| 文件 | 内容 |
|---|---|
| `environment-and-version.txt` | 代码基线、服务 PID/监听/探活、jar SHA256、浏览器与 Node 版本、测量口径 |
| `probes/probeA-readonly.cjs` | 两视口只读结构/视觉、行高、标签、ID 三态、滚动、高亮、命中区 |
| `probes/probeB-readonly.cjs` | 菜单结构/键盘/边缘翻转、事件隔离、长 ID/长描述、窄视口、焦点、行类型 |
| `probes/probeC-readonly.cjs` | 受控 GET 延迟与失败、Loading、错误槽、重试 |
| `probes/probeD-write.cjs` | 真实 40940/40941、创建/编辑/启停/删除、取消、异常菜单、过滤后重选、事件隔离 |
| `probes/probeE-stale.cjs` | 旧列表 GET 晚到（stale-response）与启停成功重载的交错 |
| `probes/probeF-write-timing.cjs` | 慢写忙碌态、重复点击防重、失败复位、Toast |
| `probes/probeG-toast.cjs` | Toast 出现/持续时间采样 |
| `probes/probeH-scroll.cjs` | 纵向滚动表头、横向滚动、右固定列、弹窗表格隔离 |
| `probes/probeI-edit-fail.cjs` | 编辑保存受控网络失败 |
| `results/readonly-geometry.json` | 两视口结构、列、按钮、行盒、标签、ID 三态、标记、描述、行类型几何（样本匿名键） |
| `results/readonly-menu-keyboard.json` | 菜单条目字重/颜色/分隔线/Hover/焦点、键盘遍历、边缘翻转、窄视口、Tooltip、事件隔离 |
| `results/readonly-loading-error-retry.json` | Loading 采样、失败错误槽、重试请求计数、GET 日志 |
| `results/write-flows.json` | 真实写入流程、业务码/消息、取消/删除/异常/重选/隔离；门禁计数 |
| `results/write-timing-busy-toast.json` | 慢写忙碌菜单、重复点击增量、失败 Toast、复位 |
| `results/toast-timing.json` | 停用成功 Toast 相对响应的出现/持续时序 |
| `results/stale-interleaving.json` | A/B 请求身份、触发/完成顺序、最终列表与高亮归属 |
| `results/scroll-fixed-column.json` | 表头/正文/固定列矩形、纵向/横向滚动、弹窗隔离 |
| `results/edit-failure.json` | 编辑失败按钮态、Toast、对话框与行描述保持 |
| `fixture-ledger.md` | SQL DML、业务写请求、独立回读、保留策略 |
| `reference-evidence-index.md` | 复用证据提交/路径/键、跨页参考腿缺口与最小补证条件 |
| `SHA256SUMS` | 本目录文件校验和 |

## 脱敏说明

- 证据只保留测量数值与合成样本 ID（`CCFG004-*`）；非本批样本统一替换为 `SAMPLE-nn`。
- 未提交真实机构名、连接地址、凭据或原始整屏截图。
- 探针脚本与服务地址仅使用本机测试入口 `127.0.0.1:5173`，不含外部业务地址。
- 原始未脱敏结果保留在仓库外；本目录为脱敏副本。

## 统计口径

- 请求：浏览器观测非 GET 21 次（放行 15、注入 6、前端拦截 0）+ 直接 API 1 次。
- 预期业务拒绝：2（40940、40941）。
- 注入：6 次受控中断（仅测试上下文、明确对象）。
- DML：10 条语句（9 INSERT + 1 DELETE），COMMIT 3。
- 既有 CDC_DATA_SOURCE 行修改：0。
