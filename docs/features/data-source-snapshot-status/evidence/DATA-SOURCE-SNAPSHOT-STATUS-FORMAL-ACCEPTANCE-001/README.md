# 正式验收证据索引 — DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001

本目录承载 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` 的全部验收证据。
逐条判定与充分性说明见 `coverage-matrix.md`；本文件只做索引、环境与真实性边界说明。

## 1. 任务与环境

| 项 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` |
| 分支 | `develop`（隔离 worktree `/agent/dss-formal-acceptance-001`，detached HEAD） |
| 起点提交 | `af88aa847c7cf6a197237a46f59130744d13f082` |
| 验收对象（前端） | 正式 `5173` 页面 `http://127.0.0.1:5173/monitor/data-source-state` |
| 验收对象（后端） | 正式后端 `8080`，`GET /api/monitor/data-source-run-state/list` |
| 验收对象（数据库） | 项目配置 Oracle 开发库（只读查询，无任何写操作） |
| 执行日期 | 2026-09-12 |
| 工具链 | JDK 8 `1.8.0_202`、Maven `3.8.8`、Node `v24.17.0` / npm `11.13.0`、Chromium（Playwright-core，CDP，`--no-sandbox`，deviceScaleFactor 1） |
| 用例来源 | `ACCEPTANCE.md` §4.1～§4.22 的 107 条 `DSS-AC-001~107` 业务行（原文与预期结果逐字节未改） |

## 2. 目录与证据文件

| 路径 | 内容 | 证据类型 |
|---|---|---|
| `coverage-matrix.md` | 107 条验收 ID → 状态 → 具体证据 → 充分性说明；§0 图例、§1 口径、§5 观察项、§6 计数 | 汇总 |
| `readonly/static-checks.txt` | 命名/菜单/路由（S1）、跨程序边界（S2）、后端只读边界（S3）、只读 UI 面（S4）、表格填充与 min-width（S5）、类别异常展示（S6）、Popper 隔离（S7） | `SC` |
| `readonly/runtime-audit.txt` | 后端运行日志 SQL 分类统计（`write_statement_count=0`，三表 `SELECT=23 WRITE=0`） | `SC` |
| `readonly/audit-backend-sql.sh` | 生成 `runtime-audit.txt` 的只读脚本 | 复现脚本 |
| `tests/backend-targeted.txt` | 后端定向测试报告 | `BT` |
| `tests/backend-package.txt` | 后端 `mvn clean package` 报告 | `BUILD` |
| `tests/frontend-targeted.txt` | 前端 Feature 定向测试（vitest） | `FT` |
| `tests/frontend-full.txt` | 前端全量测试 | `FT` |
| `tests/frontend-build.txt` | 前端 `npm run build` 报告 | `BUILD` |
| `database/baseline-before.txt` / `baseline-after.txt` | 验收前后两时点只读库快照（分 A/B/C/D/H/K 段，含行数、哈希、可空计数） | `DB` |
| `database/baseline.sql` / `baseline-after.sql` | 生成上述快照的只读 SQL（仅 `SELECT`/`WITH ... SELECT`） | 复现脚本 |
| `database/zero-write-proof.txt` | 前后对照与"零写入"结论 | `DB` |
| `database/columns.txt` | 三张业务表相关列元数据 | `DB` |
| `http/01..22-*.json` / `.txt` | 22 条真实后端 GET 用例的请求/响应与判定 | `HTTP` |
| `http/SUMMARY.txt` | 22 条 HTTP 用例汇总 | `HTTP` |
| `http/run-http-cases.sh` / `summarize.cjs` | 生成 HTTP 证据的只读脚本 | 复现脚本 |
| `browser/*.json` / `*.txt` | 真实 Chromium 场景（结构、数据、表格几何、Popper 矩阵、请求、隔离、变更数据） | `BR`（`bi.json`/`changed-data.json` 为 `BI`） |
| `browser/screenshots/` | 五视口截图（1280×800 / 1440×900 / 1700×920 / 1920×1080 / 2560×1440） | `BR` |
| `browser/screenshots-manifest.json` | 截图清单（含每张 sha256、宽高、目标宽度） | `BR` |
| `browser/scripts/` | 全部浏览器证据脚本（`lib.cjs`/`harness.cjs` + `fa-*.cjs`），场景索引见 `browser/README.md` | 复现脚本 |
| `services/*.txt` / `README.md` | 后端/前端进程、监听地址、本机可达性与停止命令 | `SVC` |
| `git/startpoint.txt` | 起点提交、远程 `develop`、worktree 现场 | — |

## 3. 证据类型与真实性边界（§8）

- `SC` 静态审阅、`BT` 后端定向测试、`FT` 前端测试、`DB` 真实库只读、`HTTP` 真实后端接口、
  `BR` 真实 Chromium 页面、`BUILD` 构建、`SVC` 服务存在性、`BI` 响应拦截替换。
- **`BI` 非真实后端数据**：`browser/bi.json` 与 `browser/changed-data.json` 仅替换列表接口的响应字节，
  文件内以 `biLabel` / `label` 显式标注 "NOT real backend data"，逐场景可用。
- `PRIOR-HUMAN`（项目负责人实现阶段的人工检查）**未被用作任何用例的判定依据**。
- 隔离视觉原型 `5174` 的证据**未被使用**。
- `database/*` 全部为只读 `SELECT`；本任务 §6.2 不授权任何人工 DML/DDL，未见任何写操作
  （见 `database/zero-write-proof.txt` 与 `readonly/runtime-audit.txt`）。
- 证据中不含密码、Token、Cookie、`Authorization`、完整连接串或无关敏感数据。

## 4. 结论摘要

- 四态计数：**`PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0 = 107`**。
- 唯一 `BLOCKED`：`DSS-AC-065`（受控测试数据 DML 授权——本任务 §6.2 明确不授权，且无充分替代证据）。
- 天花板：**正式验收已执行，待 ChatGPT Git 复核**；不构成 `IMPLEMENTED_ACCEPTED` / `FORMALLY_ACCEPTED` / Feature 完成。

## 5. 复现命令（只读）

```bash
# 后端
cd /agent/dss-formal-acceptance-001/backend && mvn clean test && mvn clean package
# 前端
cd /agent/dss-formal-acceptance-001/frontend && npm run type-check && npm run build && npm test
# 静态只读审计
bash docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001/readonly/audit-backend-sql.sh
# HTTP 用例
bash docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001/http/run-http-cases.sh
# 浏览器用例（需前端 5173 + 后端 8080 在运行）
node docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001/browser/scripts/fa-closeout.cjs
```
