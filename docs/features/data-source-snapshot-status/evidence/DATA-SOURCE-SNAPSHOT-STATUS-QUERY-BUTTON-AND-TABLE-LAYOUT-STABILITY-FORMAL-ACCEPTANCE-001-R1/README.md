# R1 证据目录索引

task_code=DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1
task_date=2026-09-16
base_commit_id=71368a0a338209af564103291f5a51bc03e60bb4
task_type=DOC_AND_EVIDENCE_FACT_CORRECTION_ONLY

本目录承载 R1 任务（纯文档与证据事实定向纠正）**自身产生**的证据。
本任务不重跑 `DSS-AC-114~118`，不修改实现代码、项目测试、CSS 或断言，
不复制 R0 的浏览器证据、截图、`rects/*.json`、判定 JSON、测试记录或数据库证据，
也不以任何形式制造「重新验收」的印象。

## 1. 本目录文件

| 路径 | 内容 | 关键结论 |
|---|---|---|
| `git/01-base-and-worktree.txt` | 任务开始时远程 `develop`、基准提交、隔离 detached worktree 的创建与核对 | `origin/develop` 任务开始时 = 基准提交；工作区 detached 且 HEAD = 基准提交；无分叉 |
| `git/02-scope-and-freeze.txt` | 实际变更路径、提示词 §12 白名单、冻结范围零差异、八份入口文档逐行改动位置 | 白名单外差异 = 0；frontend/backend/测试/依赖/锁文件/SQL/配置零差异 |
| `git/03-append-only-proof.txt` | R0 报告与 R0 ZooKeeper/Kafka 证据文件的 append-only 字节级证明 | 原文件字节为新文件完整前缀，删除 0 字节 0 行 |
| `git/04-credential-scan.txt` | 本轮全部变更路径的凭据扫描 | `credential_scan_status=NO_CREDENTIAL_FOUND` |
| `docs/01-entry-doc-corrections.txt` | 八份入口文档逐份的三行改动核对 | 除 2 处入口元数据与末行限定语外逐字节不变 |
| `database/01-zk-boundary-correction.txt` | 本轮对 ZooKeeper / 数据库 / Kafka 的访问声明、被纠正的事实、错误字段与正确字段、append-only 证明 | 本轮三类访问均为 `NONE`；R0 主动读取事实与被违反的边界 |
| `services/01-service-presence.txt` | R0 记录的三个服务进程与 5173/8080 端口的存在性 | 均不存在；本轮未启停任何服务 |
| `checks/check-r1.sh` | 提示词 §13 共 30 项的强制校验脚本 | 失败即非零退出码 |
| `checks/check-r1-lib.py` | 脚本使用的「基准提交 vs 当前工作区」精确文本比较原语 | 每个断言同时验证期望数量或目标集合 |
| `checks/check-r1-output.txt` | 校验脚本的**真实执行输出**（含失败能力负向控制） | `checks_passed=86 checks_failed=0 RESULT=PASS`，`exit_code=0` |
| `checks/apply-doc-corrections.py` | 生成八份入口文档三行改动的脚本（可复核改法） | 末行限定语为「前缀 + 插入 + 后缀」，原字节一字未删 |
| `checks/apply-append-only.py` | 生成两处 append-only 追加段的脚本（可复核改法） | 仅追加，不删改任何原有字节 |
| `README.md` | 本索引 | — |

## 2. 与 R0 证据的关系

R0（`...FORMAL-ACCEPTANCE-001`）的浏览器证据、截图、几何 `rects/*.json`、判定 JSON、
测试记录与数据库证据**原样保留、零差异**，未被本任务读取改写，也未复制进本目录。
本任务只做两件事：

1. 在 R0 正式验收报告与 R0 ZooKeeper/Kafka 证据文件末尾**追加**纠正段（append-only，见 `git/03-append-only-proof.txt`）；
2. 在八份入口文档中原位更新入口元数据、为末行笼统写法补充历史限定语、并追加一行 R1 记录段。

## 3. 边界声明

- 本轮**未**执行任何 ZooKeeper 命令，**未**连接数据库，**未**访问 Kafka（`database/01-zk-boundary-correction.txt`）；
- 本轮**未**启动、停止或重启任何服务（`services/01-service-presence.txt`）；
- 本轮**未**重跑浏览器验收、构建或测试；
- 本轮结论**不**构成 `ACCEPTED`、`IMPLEMENTED_ACCEPTED` 或 `COMPLETED`，
  也**不**等于 ChatGPT 已批准 R1，**不**等于项目负责人已作最终接受；
- `DSS-AC-114~118` 全部 `PASS`、`adjustment_acceptance_pass_count=5`、
  `formal_acceptance_pass_count=118`、0 FAIL / 0 BLOCKED / 0 NOT_RUN 全部保留不变。
