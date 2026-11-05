# 环境与版本（AC CRUD 边界与并发验收 003）

- 任务：`CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003`
- 执行日期：2026-11-05
- 分支：`develop`
- 开工基线：`e0b0048ce530c46c397917dd8bbce8b6b59fabe7`（= 开工时 `origin/develop`）
- 验收入口：`http://192.168.174.70:5173/config/client`

## 1. 运行服务（START-ONLY，未构建、未改配置）

| 组件 | PID | 监听 | 产物 |
|---|---|---|---|
| 后端（既有 jar） | 3327 | `*:8080` | `backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`；SHA256 `efdbea827b6ab84dd47105d2cc130f0bc3c5b70dc78cc626b6421e1f9750a459`；mtime 2026-09-22 12:21 |
| 前端 npm | 3373 | 0.0.0.0:5173 | `npm run dev --host 0.0.0.0 --port 5173` |
| Vite | 3385 | 0.0.0.0:5173 | `frontend/node_modules/.bin/vite` |

停止：`kill 3327 3373 3385`

后端日志：`runtime-logs/CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1/backend-8080.log`。
本目录只保存并发窗口的脱敏摘录（`results/backend-log-concurrency-window.txt`，2026-11-05 13:39:04–13:39:08）。

## 2. 工具与版本

| 项 | 值 |
|---|---|
| JDK | 1.8.0_202 |
| Maven | 3.8.8 |
| Node / npm | v24.17.0 / 11.13.0 |
| Playwright Core | 1.59.1（服务器既有 `node_modules`） |
| Chromium | Google Chrome for Testing 147.0.7727.15（headless） |
| 数据库 | Oracle 开发库 19c，Schema `CDC`（复用项目既有连接；本目录不写入凭据） |
| ZooKeeper | `ZK_HOST:2181`（主机已在证据中匿名化），客户端 3.4.14，只读 `ls /bsoft-cdc/clients` |

## 3. 验证边界

- 本批为定向浏览器/API 验收 + 必要静态检查；按提示词**未**运行全量产品测试或构建，`backend_build_status=NOT_APPLICABLE`、`frontend_build_status=NOT_APPLICABLE`。
- 页面为无头 Chromium 真实浏览器，真实前端 `:5173` 代理到真实后端 `:8080`；未使用 mock、未安装请求拦截、未注入延迟。
- 并发场景由两个独立 `http.request` socket 在同一个 `setImmediate` 门闩后同时放行；无服务端同步、无人工锁、无重试刷取。
- 运行侧（`sync-client`/`sync-server` 进程、Kafka、真实 ZK 节点写入）**未**调用、**未**模拟；只能观察 DB/ZK 可读状态并核对产品代码无对应调用路径。
- 未采集截图；页面侧结论由探针 JSON 中的真实交互、字段错误文本、请求/响应与列表回读共同支持。
