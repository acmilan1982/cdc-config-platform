# 10 — 服务清理、只读边界与授权边界（LTVT-FA-014 支撑证据）

> 原始记录：`/tmp/ltvt-fa-001/baseline.pid`、`/tmp/ltvt-fa-001/chrome.pid`、`/tmp/ltvt-fa-001/status-lines-before.txt`

## 1. 服务清理（按精确 PID，无 `pkill` / `killall`）

### 停止前核验

对每个候选 PID 先核验**命令行 + cwd + 监听端口**三项：

| PID | 命令行（截断） | cwd | 监听 | 归属确认 |
| --- | --- | --- | --- | --- |
| 3915 | `java -jar backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=127.0.0.1` | `/agent/cdc-config-platform` | `127.0.0.1:8080` | 本项目后端（前序任务遗留） |
| 4018 | `bash -c … cd …` | `/agent/cdc-config-platform/frontend` | — | 本项目前端 wrapper（前序任务遗留） |
| 4019 | `npm run dev --host 0.0.0.0 --port 5173` | `/agent/cdc-config-platform/frontend` | — | 本项目前端 npm（前序任务遗留） |
| 4030 | `node …/node_modules/.bin/vite --host 0.0.0.0 --port 5173` | `/agent/cdc-config-platform/frontend` | `0.0.0.0:5173` | 本项目前端 vite（前序任务遗留） |
| 4038 | `…/@esbuild/linux-x64/bin/esbuild --service=0.21.5 --ping` | `/agent/cdc-config-platform/frontend` | — | 本项目前端 esbuild（前序任务遗留） |
| 8667 / 8653 | 基准副本 vite / 其 bash wrapper | `/tmp/ltvt-baseline/frontend` | `0.0.0.0:5174` | **本任务**创建的基准服务 |
| 8978 | `/opt/google/chrome/chrome --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/ltvt-fa-001/chrome-profile` | `/agent/cdc-config-platform` | `127.0.0.1:9222` | **本任务**创建的浏览器 |

停止前监听现场：

```text
LISTEN 0.0.0.0:5174  pid=8667
LISTEN 0.0.0.0:5173  pid=4030
LISTEN 127.0.0.1:9222 pid=8978
LISTEN 127.0.0.1:8080 pid=3915
```

### 停止动作

```text
SIGTERM -> 4030
SIGTERM -> 4038
SIGTERM -> 4019
SIGTERM -> 4018
SIGTERM -> 8667
SIGTERM -> 8653
SIGTERM -> 8978
SIGTERM -> 3915
```

### 停止后核验

```text
3915 stopped, 4018 stopped, 4019 stopped, 4030 stopped,
4038 stopped, 8653 stopped, 8667 stopped, 8978 stopped
NO_LISTENER_ON_8080_5173_5174_9222
```

`8080`、`5173`、`5174`、`9222` 均无监听；`pgrep` 复核无 chrome 子进程、无 vite/vitest 残留；未停止任何范围外服务。

## 2. 临时位置处理

| 路径 | 来源 | 处理 |
| --- | --- | --- |
| `/tmp/ltvt-fa-001/`（日志、原始 JSON、PID 文件、隔离回滚克隆 `rollback/`） | 本任务创建 | 保留并报告路径（§十：目标精确但仅在证据完成后才可删；此处选择保留以便复核） |
| `/tmp/ltvt-baseline/` | 本任务创建的 `ae6439b` 隔离副本（基准服务根） | 保留并报告路径；**未**触碰正式工作树 |
| `/tmp/ltvt-controls/` | 反向控制副本 | 保留并报告路径 |
| `/tmp/ltvt-fa-001/chrome-profile/` | 浏览器临时 profile | 保留；未提交任何截图缓存 |

以上路径**均未**进入 Git；本次提交只包含报告与证据 Markdown/JSON。

## 3. 只读边界

| 边界项 | 状态 | 依据 |
| --- | --- | --- |
| 写 API 调用 | **NONE** | 全程只使用 GET 列表接口取页面展示数据（`GET` 返回 `code=200`、`data` 为 36 条数组，见 `/tmp/ltvt-fa-001/fa-backend-list.json`）；未调用 POST / PUT / PATCH / DELETE |
| 数据库写入 | **NONE** | 未执行任何 SQL/DDL/DML；未直连数据库 |
| 数据库访问 | **APP_INTERNAL_READONLY_ONLY** | 仅由应用启动与 GET 列表接口内部产生只读 `SELECT` |
| ZooKeeper | **APPLICATION_STARTUP_READONLY_AUTO_CONNECT_IF_OBSERVED；AGENT_ACTIVE_ACCESS_NONE** | Agent 未主动访问或写入任何节点（含 `create` / `set` / `delete`） |
| Kafka | **NONE** | 未访问 |
| 业务源库 / 目标库 | **NONE** | 未访问 |
| 浏览器动作 | 只读 | 仅页面打开、查询、弹窗打开后取消；**未**点击创建、保存、删除、启用/停用 |
| 防火墙 / 代理 / 系统服务 | 未修改 | 未改动任何永久部署配置 |
| 验收数据 | 未创建 | 未构造、未写入任何业务数据 |

## 4. 授权与状态边界（`LTVT-FA-014`）

| 边界项 | 状态 | 依据 |
| --- | --- | --- |
| 项目负责人目测 PASS | **PASS** | `project_owner_visual_review_status=PASS`（2026-09-22），由前序目测收口任务记录 |
| 其他页面迁移 | **0 个** | 相对接入前提交 `ae6439b`，`frontend/**` 只变更授权 5 文件；未迁移探针端管理、数据订阅或任何其他页面 |
| 页面迁移状态 | `NOT_STARTED` / `NOT_GRANTED` | 本任务未写入任何迁移授权 |
| `ACCEPTED` / `IMPLEMENTED_ACCEPTED` / 生产可用 | **未写入** | 本任务只推进到「正式验收执行通过、待项目负责人最终接受」 |
| 业务代码 / 测试 / 配置 / 依赖 / 锁文件变化 | **NONE** | `git status --short` 中仅有本次新增报告与证据，以及通过后的权威状态回写文档 |
| 范围外工作区内容 | 未触碰 | `.claude/settings.local.json`、`docs/prompts/` 保持任务前原状，未暂存、未提交 |
| 正式验收是否冒充最终接受 | **未冒充** | `final_acceptance_status=NOT_ACCEPTED_PENDING_PROJECT_OWNER`；报告明确「本地正式验收通过 ≠ 项目负责人最终接受」 |

## 5. 未提交内容声明

以下内容**未**进入本次提交：运行日志、`dist/`、`node_modules/`、临时克隆、浏览器截图缓存、PID 文件、JAR，以及数据库返回的任何原始数据（`fa-backend-list.json` 仅作为本机临时证据保留于 `/tmp`，不含敏感凭据）。
