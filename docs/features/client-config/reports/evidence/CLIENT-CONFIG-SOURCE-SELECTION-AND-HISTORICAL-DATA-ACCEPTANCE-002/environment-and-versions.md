# 环境、版本、服务与产物

- 任务：`CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002`
- 执行日期：2026-11-04
- 分支：`develop`
- 起始提交：`242cc5cf878216ef6e020effc539ee742c87a35c`

## 1. 环境预检

| 项目 | 结果 |
|---|---|
| 工作目录 | `/agent/cdc-config-platform`（有效 Git 仓库） |
| 分支 / HEAD | `develop` / `242cc5cf878216ef6e020effc539ee742c87a35c`（本地 = `origin/develop` = `refs/remotes/origin/develop`） |
| JDK | 1.8.0_202（`JAVA_HOME=/usr/java/latest`） |
| Maven | `/usr/local/maven/bin/mvn`，Apache Maven 3.8.8 |
| Node / npm | v24.17.0 / 11.13.0 |
| Oracle 客户端 | SQL*Plus 19.31.0.0.0（`/opt/oracle/instantclient`） |
| Git / Claude Code | 2.47.3 / 2.1.143 |
| Playwright Core | 1.59.1（取自服务器既有 `node_modules`） |
| Chromium | `/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome` |
| locale | `en_US.UTF-8` |

数据库连接信息取自既有 `agent-env.sh` / 项目配置，**未在本报告或任何证据文件中输出凭据**。

## 2. 服务与产物

| 项目 | 值 |
|---|---|
| 后端命令 | `java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar` |
| 后端实际监听 | PID 3670，`*:8080` |
| 后端启动包装 shell | PID 3668 |
| 后端产物 SHA256 | `efdbea827b6ab84dd47105d2cc130f0bc3c5b70dc78cc626b6421e1f9750a459` |
| 后端产物 mtime | 2026-09-22 12:21 |
| 前端命令 | `npm run dev -- --host 0.0.0.0 --port 5173` |
| 前端实际监听 | Vite PID 3756，`0.0.0.0:5173` |
| 前端启动包装 shell | PID 3743 |
| 既有日志 | `runtime-logs/CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001/backend-8080.log`（前端日志同前序任务目录） |

服务处置：`START-ONLY`（复用前序批次已启动的既有产物与已安装依赖）；未重建、未改配置、未重启健康服务。服务在任务结束后保持运行，供项目负责人验收。

## 3. 探活与访问入口

| 检查 | 结果 |
|---|---|
| 前端根路径 `http://127.0.0.1:5173/` | HTTP 200 |
| `GET /api/clients?status=ALL` | HTTP 200 |
| 列表页 `http://127.0.0.1:5173/config/client` | 正常渲染并加载行 |
| 交付 URL | `http://192.168.174.70:5173/config/client` |

## 4. 验证边界

- 后端 jar 的 mtime 早于本任务，只能证明启动的是该既有产物，**不能证明**其与当前工作区源码逐字节一致；本任务按授权未重新构建。
- 服务绑定 `0.0.0.0`，本机请求 HTTP 200；`192.168.174.70` 侧用户网络可达性未由本任务独立证明。
- 未运行全量产品测试、构建、lint、类型检查（任务明确不要求）。
- 本任务只做 `/config/client` 页面与 `CDC_CLIENT_MULTIPLE` / `CDC_DATA_SOURCE` 两表的定向验收；未访问其他功能页面，未操作 ZK/Kafka，未做 DDL。
