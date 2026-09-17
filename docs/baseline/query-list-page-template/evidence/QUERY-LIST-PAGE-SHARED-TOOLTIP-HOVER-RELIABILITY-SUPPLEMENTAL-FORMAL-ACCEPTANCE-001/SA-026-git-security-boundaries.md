# SA-026 Git、安全与外部系统边界

## 1. Git 三态一致性（验收开始时与提交前各测一次）

```bash
git ls-remote origin refs/heads/develop
# 0a1cd99640a5cfa08280a95c23ca3c7231ea6a73	refs/heads/develop

git -C /agent/...-correction-001 rev-parse HEAD
# 0a1cd99640a5cfa08280a95c23ca3c7231ea6a73   （detached，非分支）
```

| 口径 | 值 |
|---|---|
| 任务基线 `expected_base_commit_id` | `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73` |
| 验收工作树 HEAD | `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73` |
| `origin/develop` | `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73` |
| `git ls-remote` 实测 | `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73` |

三者相同 ⇒ **未触发 §3 的 `BLOCKED` 条件**（不存在"远程已前移到更新提交"的局面）。
验收工作树以 detached HEAD 检出该提交，**未创建、未切换、未重命名任何分支**。

## 2. 工作树与隔离

```text
git worktree list --porcelain | grep -c '^worktree '   => 71
```

主工作树与既有工作树在验收前后保持一致，本轮**未** reset / stash / clean / 删除 / 修改任何工作树：

| 工作树 | HEAD | 分支 | 验收前 | 验收后 |
|---|---|---|---|---|
| `/agent/cdc-config-platform` | `4222b0a24b927aca6f62ff348fd8549b73d4156c` | `develop` | 116 项既有未提交改动 | 未改动，仍为 116 项 / 同一 HEAD |
| 验收工作树 `...-correction-001` | `0a1cd996…` | detached | 干净（仅本轮新增的 report/evidence 路径） | 仅新增本轮产物 |
| 其余 69 个既有工作树 | 各自既有 | detached | — | 未触碰 |

**未在** `/agent/cdc-config-platform` 中执行任何验收测量或写操作（§3 明令禁止）；
所有命令均在 detached 验收工作树或 `/tmp` 隔离副本中执行。

## 3. 零 diff 类别

本轮为**纯验收加记录**任务，不修改任何生产/测试/依赖/配置内容：

| 类别 | 期望 | 实测 |
|---|---|---|
| 前端生产源码 | ZERO | ZERO |
| 后端源码 | ZERO | ZERO |
| 项目测试代码 | ZERO | ZERO |
| 依赖清单 / 锁文件（`package.json` / `package-lock.json` / `pom.xml`） | ZERO | ZERO |
| SQL / 数据库脚本 | ZERO | ZERO |
| 应用配置 | ZERO | ZERO |
| 其他页面 | ZERO | ZERO |
| 原验收报告与原证据目录 | 不得改写 | 不在改动列表内 |

`git status --short` 在提交前**只**列出：

```text
?? docs/baseline/query-list-page-template/reports/QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001.md
?? docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001/
```

修正提交 `b453635…0a1cd99` 的 10 文件范围仍为原样（4 生产 / 3 测试 / 3 基线文档，`602 insertions(+), 46 deletions(-)`），
本轮未改动其中任何一个文件。

## 4. 文档冻结

冻结计数与口径见 SA-021。结论：

```text
template_marker_freeze_status=PASS（48/0/43/9，基线正文口径）
design_decision_freeze_status=PASS（66/0，基线正文口径）
```

本轮对 `README.md` / `MIGRATION.md` / `SHARED_COMPONENT_DESIGN.md` 只做**尾部状态追加**，
模板规则正文与设计决策正文段落未被改写。

## 5. 凭据扫描

对本轮新增的报告与证据全文扫描：

```bash
grep -rniE 'ghp_|github_pat_|Bearer [A-Za-z0-9]{20,}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|ANTHROPIC_API_KEY|sk-ant-' \
  reports/QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001.md \
  evidence/QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001/
# 唯一命中为本文件上一行扫描模式自身的文本（自匹配），非凭据
```

扫描结果：除本文件内**扫描模式自身**的那一行外，**零命中**；该自匹配不含任何凭据值。

未写入、未打印：GitHub 访问令牌、Claude Code 认证信息、SSH 私钥、操作系统私钥、生产环境账号口令。
内网开发库连接信息未在本轮新增内容中出现（本轮未访问数据库客户端）。
证据中的 `/tmp` 路径只含日志文件名，不含任何凭据。

## 6. 外部系统边界

```text
database_access_status=NONE_EXCEPT_APPLICATION_GET_READS
database_write_status=ZERO
zookeeper_task_initiated_access_status=NONE
zookeeper_write_status=NOT_REQUESTED
kafka_access_status=NONE
```

- 未启动 SQL\*Plus，未使用任何数据库客户端执行 `SELECT`/`INSERT`/`UPDATE`/`DELETE`；
- 页面的业务数据**全部**经应用后端 GET 接口获得，属"应用 GET 读取"；
- 未以任何形式访问 ZooKeeper（无 `ls`/`get`/`stat`，无任何写操作）；
- 未访问 Kafka；
- 后端启动时的既有后台连接不计为本页依赖，未作为验收证据；
- 为观察错误态所注入的 HTTP 500 由**验收侧**在浏览器层面注入，未对数据库或后端写入任何数据。

## 7. 进程与端口收尾

### 7.1 项目负责人手工复查环境（保持运行）

| PID | 进程 | 处理 |
|---|---|---|
| 47411 | `npm run dev --host 0.0.0.0 --port 5173 --strictPort` | **保持运行** |
| 47425 | `node .../correction-001/frontend/node_modules/.bin/vite --host 0.0.0.0 --port 5173 --strictPort` | **保持运行** |
| 47301 | `java -jar .../correction-001/backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar` | **保持运行** |

验收结束时复核：

```text
LAN   http://192.168.174.70:5173/                                  => 200
API   http://127.0.0.1:8080/api/monitor/data-source-run-state/list => 200
ss -ltnp | grep ':5173'  => LISTEN 0.0.0.0:5173 pid=47425
```

```text
project_owner_service_preservation_status=PASS
```

### 7.2 本任务自建的隔离服务（已停止）

负向控制所需的隔离实例，绑定 `127.0.0.1:5273 --strictPort`，启动器 PID 59848 / vite PID 59862，
两个 PID **均由本任务自行记录并逐一停止**（未使用 `pkill` / `killall` / 模糊 PID / 按端口批量停止）：

```text
kill -0 59862 => GONE
kill -0 59848 => GONE
ss -ltnp | grep -c ':5273' => 0
```

```text
task_service_lifecycle_status=ALL_OWN_PIDS_STOPPED  port_5273_status=RELEASED
```

### 7.3 工作树清理

```text
worktree_cleanup_status=NONE_PERFORMED
```

## 8. 结论字段

```text
git_three_way_sync_status=PASS
main_worktree_preservation_status=PASS
existing_worktrees_preservation_status=PASS
frontend_source_diff=ZERO
backend_diff=ZERO
project_test_code_diff=ZERO
dependency_lockfile_diff=ZERO
sql_config_diff=ZERO
credential_scan_status=PASS
project_owner_service_preservation_status=PASS
task_service_lifecycle_status=PASS
worktree_cleanup_status=NONE_PERFORMED
```
