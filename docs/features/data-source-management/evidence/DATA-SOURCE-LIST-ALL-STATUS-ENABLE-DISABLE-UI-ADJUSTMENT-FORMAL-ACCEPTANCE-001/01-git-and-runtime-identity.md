# 正式验收 001 —— Git 与运行源身份（阶段 A 只读准备）

> 任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> 阶段：A（只读准备，尚未执行任何写操作）
> 采集时间：2026-09-20

## 1. Git 门禁（§4）

| 检查项 | 实测值 |
|---|---|
| 工作目录 | `/agent/cdc-config-platform` |
| 分支 | `develop` |
| 本地 `HEAD` | `583e9dfa88fffe0de6dce42d2071d00f38e04b0c` |
| `origin/develop` | `583e9dfa88fffe0de6dce42d2071d00f38e04b0c` |
| `git ls-remote origin refs/heads/develop` | `583e9dfa88fffe0de6dce42d2071d00f38e04b0c` |
| ahead/behind | `0 0` |
| 任务前既有修改 | `M .claude/settings.local.json`；`?? docs/prompts/`（保持原样，未修改/未暂存/未提交） |
| 唯一授权基点 | `583e9dfa88fffe0de6dce42d2071d00f38e04b0c`（与本任务基線一致） |

### 1.1 前后端零差异证明

| 比较 | 命令 | 退出码 |
|---|---|---|
| 已复审业务代码 → 本任务基点 | `git diff --quiet 399cb2249f60411b52235a859a8ce95d9f6e4579..583e9dfa88fffe0de6dce42d2071d00f38e04b0c -- backend frontend` | `0`（零差异） |
| 已复审业务代码 → 临时运行源 | `git diff --quiet 399cb224...e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb -- backend frontend` | `0`（零差异） |
| 临时运行源 → 本任务基点 | `git diff --quiet e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb..583e9dfa88fffe0de6dce42d2071d00f38e04b0c -- backend frontend` | `0`（零差异） |

## 2. 工作树

| 工作树 | 提交 | 状态 |
|---|---|---|
| `/agent/cdc-config-platform` | `583e9df` | `[develop]` |
| `/agent/cdc-temp-acceptance-001` | `e6965dd` | detached HEAD（临时验收运行工作树） |

## 3. 运行服务身份复核（§5.1，实时核对，非凭 PID 猜测）

| 项 | 后端 | 前端 |
|---|---|---|
| PID | `14440` | `14579` |
| 命令行 | `java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=127.0.0.1` | `node /agent/cdc-temp-acceptance-001/frontend/node_modules/.bin/vite` |
| cwd | `/agent/cdc-temp-acceptance-001/backend` | `/agent/cdc-temp-acceptance-001/frontend` |
| 启动时间 | 2026-09-20 10:32:47 | 2026-09-20 10:35:13 |
| 监听 | `[::ffff:127.0.0.1]:8080` | `0.0.0.0:5173` |
| 日志 | `runtime-logs/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-TEMP-ACCEPTANCE-RUN-001/backend-8080.log` | `.../frontend-5173.log` |

结论：PID、命令行、cwd、监听端口、工作树提交与临时验收运行报告一致，**判定为可复用**（运行源 `e6965dd` 与本任务基点 `583e9df` 前后端零差异）。

## 4. 只读可达性复核

| 目标 | 结果 |
|---|---|
| `http://127.0.0.1:5173/config/data-source` | `http=200`，`text/html` |
| `http://192.168.174.70:5173/config/data-source` | `http=200`，`text/html` |
| `http://127.0.0.1:5173/monitor/data-source-state`（`DS-AC-146~148` 参考页） | `http=200`，`text/html` |
| `http://127.0.0.1:8080/api/data-sources` | `http=200`，`code=200`，`rows=34` |
| `http://127.0.0.1:8080/api/data-sources/target-options` | `http=200`，候选 3 条（启用目标库基线） |

## 5. 环境预检

JDK 8（`/usr/java/latest`，1.8.0_202）、Maven（`/usr/local/maven/bin/mvn`）、Node v24.17.0 / npm 11.13.0（`/opt/node`）、SQL*Plus（`/opt/oracle/instantclient`，19.0.0.0.0）、ZooKeeper 客户端（`/opt/zookeeper/zookeeper-3.4.14`）、Google Chrome 148.0.7778.167（无头验收驱动）均可用。

## 6. 阶段 A 期间的外部系统访问审计

- Agent 侧：仅执行**只读** `SELECT` 与只读 `GET`；`ZK/Kafka/源库/目标库` 无访问；未调用任何写接口；未启动/停止任何进程。
- 应用侧：标准启动过程按既有 `dev` profile 建立 Oracle 连接池与只读 ZK 会话（与临时验收运行报告一致，非本任务主动扩大）。
