# R1 补验证据索引 — DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1

本目录承载 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1`（`DSS-AC-065` 定向补验 + R0 报告两项事实纠正）的全部证据。
逐条映射见 `coverage-matrix-r1.md`；本文件只做索引、环境与真实性边界说明。

## 1. 任务与环境

| 项 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1` |
| 分支 | `develop` |
| 起点提交 | `3190b3d2450478bef34b24578312c76c3973cb08`（= R0 交付提交，`origin/develop` 一致） |
| 隔离 worktree | `/agent/dss-formal-acceptance-001-r1`（detached HEAD） |
| 补验对象（前端） | 正式 `5173` 页面 `http://192.168.174.70:5173/monitor/data-source-state` |
| 补验对象（后端） | 正式 `8080`，`GET /api/monitor/data-source-run-state/list` |
| 补验对象（数据库） | 项目配置 Oracle 19c **开发库**，`CDC` schema，**唯一写入表** `CDC_DATA_SOURCE_RUN_STATE` |
| 执行日期 | 2026-09-12 |
| 用例来源 | `ACCEPTANCE.md` `DSS-AC-065` 与提示词 §9.1 回归集 |

## 2. 目录与证据文件

| 路径 | 内容 | 证据类型 |
|---|---|---|
| `coverage-matrix-r1.md` | `DSS-AC-065` 与 §9.1 回归用例 → 状态 → 证据映射 | 汇总 |
| `sql-approval/sql-package.md` | 阶段 A 完整 SQL 审批包（目标/字段值/COMMIT/DELETE/行数/风险/恢复顺序/比对方法） | `SQL-APPROVAL` |
| `sql-approval/approval-record.md` | 总体授权 + 完整 SQL 展示后的人工批准记录 | `SQL-APPROVAL` |
| `sql-approval/insert.sql` / `delete.sql` | 获批的可执行 `INSERT` / `DELETE` 脚本 | `SQL-APPROVAL` |
| `sql-approval/phaseA-*.txt` | 阶段 A 只读预检（身份、列、可复用配置、值域、摘要） | `DB` |
| `database/insert.sql` / `delete.sql` / `snapshot.sql` | 执行与只读导出脚本 | 复现脚本 |
| `database/insert-run.txt` / `insert-verify.txt` | 7 行插入执行输出与插入后核验（37 行 / 配置表零变化） | `DB` |
| `database/delete-run.txt` | 7 条精确复合主键 `DELETE` 执行输出（各 1 行 + `COMMIT`） | `DB` |
| `database/*_before.txt` / `*_restored.txt` | 任务前 / 恢复后三表只读导出（`run_state` / `client_multiple` / `data_source`） | `DB` |
| `database/run_state_after_insert.txt` | 插入后 `RUN_STATE` 全表导出 | `DB` |
| `database/restore-verify.sh` / `restore-verify.txt` | §8.3 恢复核验：逐字节比较、行数、主键集合、状态分布、NULL 计数、内容摘要 | `DB` |
| `database/precondition-verify.txt` | 插入前 7 个主键空闲、前缀为 0（由任务前导出派生） | `DB` |
| `database/before-digests.txt` / `phaseA-digests.txt` | 任务前/阶段 A 摘要 | `DB` |
| `http/fetch.sh` / `01..12-*.json` / `SUMMARY.txt` | 12 条真实后端 `GET` 用例（无参 / 精确过滤 / 非法状态） | `HTTP` |
| `http/99-post-restore-no-params.json` / `post-restore-check.txt` | 恢复后无参响应与 R0 基线**payload 逐字段一致**（仅 `timestamp` 不同） | `HTTP` |
| `browser/scripts/` / `rows.json` / `fa065-cases.json` / `SUMMARY.txt` / `screenshots/` | 真实 Chromium 场景（7 临时行、排序、真实查询控件、网络/Console）；索引见 `browser/README.md` | `BR` |
| `readonly/runtime-window.txt` | 覆盖本次 R1 扫描窗口的后端日志切片（`N0..N1` 行） | `SC` |
| `readonly/audit-backend-sql.sh` / `runtime-audit.txt` | 运行期 SQL 审计：三表 **只读 SELECT**、`write_statement_count=0`、ZK 分层 | `SC` |
| `readonly/.window.begin` | 日志窗口起止行号（`N0` / `N1`） | `SC` |
| `tests/backend-targeted.txt` / `frontend-targeted.txt` / `frontend-build.txt` / `SUMMARY.txt` | 本 R1 实际重跑的定向测试与前端构建 | `BT`/`FT`/`BUILD` |
| `git/startpoint.txt` / `dir-check`→`diff-check.txt` | 起点、范围、`git diff --check` 分层结论 | `SC` |
| `services/README.txt` | 进程 PID、监听、代码来源、健康检查、URL、停止命令 | `SVC` |

> 上表 `dir-check` 为笔误，实际文件名为 `git/diff-check.txt`。
>
> 上表 `readonly/runtime-window.log` 已更名为 `readonly/runtime-window.txt`：仓库 `.gitignore` 第 30 行 `*.log` 会排除切片的 `.log` 文件名，改名后本 R1 证据才能进入提交；文件内容除按 §16 规范化行尾空格外未作任何改动（`runtime-audit.txt` 已同步 `log` 路径与 `bytes` 计数，审计主体不受影响）。R0 原始证据文件未改名、未改写。

## 3. 证据类型与真实性边界

- `DB` 真实库只读/获批 DML、`HTTP` 真实后端接口、`BR` 真实 Chromium 页面、
  `SC` 静态/日志审阅、`BT`/`FT` 测试、`BUILD` 构建、`SVC` 服务存在性、`SQL-APPROVAL` 审批记录。
- 本目录**不含** `BI`（响应拦截替换）证据；`DSS-AC-065` 全部结论基于**真实**数据库行与真实页面渲染。
- 本轮唯一对数据库的写入是**阶段 A 获批**、带独立前缀的 7 行临时数据；已按 §8.3 全部删除并逐字节恢复。
- 证据中不含凭据类敏感数据：无密码、无 Token、无 Cookie、无 `Authorization`、无含账号口令的完整连接串、无 SSH/操作系统私钥；
  数据库脚本（如 `database/restore-verify.sh`）不在证据中内联口令，改由运行前导出 `DSS_DEV_CONN`（来源为项目 `CLAUDE.md` §11 授权的内网开发库）；
  证据中出现的仅为 `CLAUDE.md` §11 明确授权的内网开发库**地址**（`192.168.174.65:1521/prod.enmotech.com`），不含账号口令；
  `CDC_DATA_SOURCE` 导出已排除 `DATA_SOURCE_USER_NAME`/`DATA_SOURCE_PASSWORD`/`DATA_SOURCE_HOST`/`DATA_SOURCE_PORT`/`DATA_SERVICE_NAME`。

## 4. 结论摘要

- `DSS-AC-065`：**PASS**（真实 DML 治理流程 + 真实 DB/API/浏览器补验 + 恢复逐行一致）。
- 四态计数：**`PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0 = 107`**。
- 数据恢复：三表与任务前**逐字节一致**，任务前缀残留 **0**。
- 天花板：**正式验收已执行完成，待 ChatGPT 从远程 Git 复审**；**不构成** `IMPLEMENTED_ACCEPTED` / `FORMALLY_ACCEPTED` / Feature 完成。

## 5. 复现命令

```bash
# 只读 HTTP 用例（需后端 8080 在运行）
bash docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1/http/fetch.sh

# 真实浏览器用例（需前端 5173 + 后端 8080 在运行）
node docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1/browser/scripts/fa065-r1.cjs

# 运行期 SQL 审计（针对已保存的日志切片）
bash docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1/readonly/audit-backend-sql.sh

# 恢复核验（只读；凭证不内联于证据，需先按 CLAUDE.md §11 导出连接串）
export DSS_DEV_CONN='<user>/<password>@//<host>:<port>/<service>'   # 见 CLAUDE.md §11 内网开发库
bash docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1/database/restore-verify.sh

# 定向测试与构建
cd backend   && mvn -Dtest='com.bsoft.cdcconfig.monitor.datasourcerunstate.**' test
cd frontend  && npx vitest run src/views/data-source-run-state src/api/dataSourceSnapshot.spec.ts && npm run build
```
