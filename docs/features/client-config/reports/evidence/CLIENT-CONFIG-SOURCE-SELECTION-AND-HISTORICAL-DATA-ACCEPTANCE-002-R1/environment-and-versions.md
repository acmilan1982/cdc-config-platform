# 环境、版本、服务与产物（R1）

- 任务：`CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1`
- 执行日期：2026-11-05
- 分支：`develop`
- 基线提交：`6c72727b4e77efc15034af0dc44242e15ced094f`（开工时本地 / `origin/develop` / 远端 `refs/heads/develop` 一致）

## 1. 环境预检

| 项目 | 结果 |
|---|---|
| 工作目录 | `/agent/cdc-config-platform`（有效 Git 仓库） |
| 分支 / HEAD | `develop` / `6c72727b4e77efc15034af0dc44242e15ced094f` |
| JDK | 1.8.0_202（`JAVA_HOME=/usr/java/latest`） |
| Node / npm | v24.17.0 / 11.13.0 |
| Oracle 客户端 | SQL*Plus（`/opt/oracle/instantclient`） |
| Playwright Core | 1.59.1（服务器既有 `node_modules`） |
| Chromium | `/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome` |
| locale | `en_US.UTF-8` |

数据库连接信息取自既有 `agent-env.sh` / 项目配置，**未在本目录输出凭据或连接串**。

## 2. 服务与产物

开工时 8080 / 5173 均无监听、HTTP 不可达，按提示词执行 START-ONLY：复用既有后端 jar 与既有 Vite 环境，未重建、未改配置。

| 项目 | 值 |
|---|---|
| 后端命令 | `java -jar backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --spring.profiles.active=dev` |
| 后端 PID | 3327（`*:8080`） |
| 后端日志 | `runtime-logs/CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1/backend-8080.log` |
| 后端产物 SHA256 | `efdbea827b6ab84dd47105d2cc130f0bc3c5b70dc78cc626b6421e1f9750a459` |
| 后端产物 mtime | 2026-09-22 12:21 |
| 前端命令 | `npm run dev -- --host 0.0.0.0 --port 5173` |
| 前端 npm PID | 3373 |
| 前端 Vite PID | 3385（`0.0.0.0:5173`） |
| 前端日志 | `runtime-logs/CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1/frontend-5173.log` |
| 前端源码基线 | 工作区 `HEAD=6c72727b4e77efc15034af0dc44242e15ced094f`，未修改产品源码/CSS |

探活（`curl --noproxy '*'`）：`http://127.0.0.1:5173/` 与 `/config/client` HTTP 200；`GET /api/clients?status=ALL` HTTP 200。

交付 URL：`http://192.168.174.70:5173/config/client`。

停止命令：`kill 3327 3373 3385`。

## 3. 验证边界

- 后端 jar mtime 早于本任务，只能证明启动的是该既有产物，**不能证明**其与当前工作区源码逐字节一致；本任务按提示词未重建。
- 服务绑定 `0.0.0.0`，本机 HTTP 200；用户侧经 `192.168.174.70` 的网络可达性未由本任务独立证明。
- 未运行 npm test、Vitest、产品 E2E 全套、mvn test、lint、类型检查或产品构建；仅做 `node --check`、证据 JSON 解析、哈希与 Git 静态核验。
- 未访问其他功能页面；未操作 ZK/Kafka、sync-client/sync-server；未做 DDL。
