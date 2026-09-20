# 01 — Git 与运行源身份

> 任务：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> `RUN_TAG`：`FACC002`
> 记录时间：2026-09-20

## 1. Git 身份

| 项 | 值 |
|---|---|
| 分支 | `develop` |
| 任务前 `HEAD` | `db1cfda7c8e10ddd5faa2a119e7550059a687d05` |
| `origin/develop`（`git ls-remote`） | `db1cfda7c8e10ddd5faa2a119e7550059a687d05` |
| ahead/behind（`origin/develop...HEAD`） | `0	0` |
| 独立工作树 | `/agent/cdc-temp-ds-formui-formal-001`（`git worktree add --detach`，`HEAD=db1cfda7…`，工作区干净） |
| `required_remote_commit` | `db1cfda7c8e10ddd5faa2a119e7550059a687d05`（与实测一致） |

相关历史提交（均在本工作树可达）：

| 用途 | 提交 |
|---|---|
| `implementation_commit` | `807a5a58e373e522fe8b591569e22728a6662ed6` |
| `password_fix_commit` | `55e6273b74182c408e36b75e09ad21819f33d3e2` |
| `r2_docs_commit` | `f42aad01b4115f85b00ad67d541b8cd2e8decf51` |
| `r3_docs_commit` | `db1cfda7c8e10ddd5faa2a119e7550059a687d05` |

## 2. 运行源（正式验收运行）

前后端**均从独立工作树 `db1cfda7…` 构建并启动**，未沿用任务前旧进程。

### 2.1 后端

| 项 | 值 |
|---|---|
| 启动命令 | `java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=127.0.0.1` |
| 进程 PID | `51273` |
| cwd | `/agent/cdc-temp-ds-formui-formal-001/backend` |
| 监听 | `127.0.0.1:8080`（`[::ffff:127.0.0.1]:8080`） |
| profile | `dev`（`spring.profiles.active=dev`，指向 `192.168.174.65:1521/prod.enmotech.com` Schema `CDC`） |
| 启动时间 | 2026-09-20（本机 17:13:21） |
| 运行日志 | `/agent/cdc-temp-ds-formui-001/logs/FACC002/backend-run.log`（**未入库**） |
| jar SHA-256 | `1150fb5777f482fdc813b1b169c73a6135e4bc6dd3ee98ac50332e3fb62d5d78` |

### 2.2 前端

| 项 | 值 |
|---|---|
| 启动命令 | `npm run dev -- --host 0.0.0.0 --port 5173` |
| 进程 PID | npm `51288` → vite `51302` |
| cwd | `/agent/cdc-temp-ds-formui-formal-001/frontend` |
| 监听 | `0.0.0.0:5173` |
| 启动时间 | 2026-09-20（本机 17:13:24） |
| 运行日志 | `/agent/cdc-temp-ds-formui-001/logs/FACC002/frontend-run.log`（**未入库**） |

### 2.3 连通性核验

| 检查 | 结果 |
|---|---|
| `GET /api/health`（后端直连 `127.0.0.1:8080`） | `{"code":200,"message":"success","data":{"status":"UP",…}}` |
| `GET /api/health`（经 Vite 代理） | `{"code":200,…,{"status":"UP",…}}` |
| `GET /api/data-sources`（经 Vite 代理） | HTTP 200，返回列表 JSON |
| `GET http://127.0.0.1:5173/config/data-source` | HTTP 200（SPA 页面） |

> **口径偏差（如实记录）**：任务 §5 写的是核验 `/actuator/health`。本工程**未启用** Spring Boot Actuator，实际健康检查端点为既有 `HealthController` 的 **`/api/health`**（`HealthController.java:16,23`）。`/actuator/health` 会被 SPA 静态资源兜底路由接管并返回 `index.html`，**不能**作为健康检查证据。本任务按真实端点 `/api/health` 核验并如实说明该偏差，**未**为迎合提示词新增 Actuator 依赖（属业务代码/依赖变更，越权）。

## 3. 任务前旧临时服务的精确停止记录

任务开始时（§5）存在上一任务的临时服务。停止前逐个核验 PID 命令行、cwd 与监听端口，确认属本项目后按精确 PID 停止，**未使用** `pkill` / `killall` / 模糊匹配。

| PID | 核验到的命令行 | 核验到的 cwd | 监听 | 处理 |
|---|---|---|---|---|
| `41661` | `java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=127.0.0.1` | `/agent/cdc-config-platform/backend` | `127.0.0.1:8080` | `kill 41661` → 已停止 |
| `45619` | `npm run dev --host 0.0.0.0 --port 5173` | `/agent/cdc-config-platform/frontend` | （父进程） | `kill 45619` → 已停止 |
| `45630` | `node /agent/cdc-config-platform/frontend/node_modules/.bin/vite --host 0.0.0.0 --port 5173` | `/agent/cdc-config-platform/frontend` | `0.0.0.0:5173` | `kill 45630` → 已停止 |

停止后核验：`8080` / `5173` **无监听**，随后才由本任务从独立工作树启动新服务。
