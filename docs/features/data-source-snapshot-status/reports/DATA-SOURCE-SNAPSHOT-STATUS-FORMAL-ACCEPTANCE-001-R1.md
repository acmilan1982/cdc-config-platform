# 源库快照状态正式验收 R1 补验报告

## 1. 任务、基准与 R0 复审结论

| 项 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1` |
| 目标分支 | `develop` |
| 起点提交 | `3190b3d2450478bef34b24578312c76c3973cb08`（= `origin/develop` = `git ls-remote origin refs/heads/develop`） |
| 隔离 worktree | `/agent/dss-formal-acceptance-001-r1`（detached HEAD；未在主工作区执行） |
| 执行日期 | 2026-09-12 |
| R0 任务 | `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001` |
| R0 结果 | `PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0`，唯一 `BLOCKED` 为 `DSS-AC-065` |
| ChatGPT R0 复审 | `CHANGES_REQUIRED`（未发现业务代码缺陷） |

ChatGPT 的 R0 复审提出三项：

1. `DSS-AC-065` 因 R0 任务 §6.2 明确不授权 DML 而记 `BLOCKED`，判定正确；其要求的“备份→构造→真实验收→恢复→逐行一致核验”不能被已有实现自测或浏览器拦截替代。
2. R0 报告 §11.2 把全提交 `git diff --check` 写成 `CLEAN` 不准确。
3. R0 报告 §3.2 笼统写“未访问 ZooKeeper”与运行日志不符。

本任务职责：定向补验 `DSS-AC-065` + 追加纠正第 2、3 项事实。

### 1.1 任务边界（本任务全部遵守）

- 不修改前后端代码、测试代码、需求/设计/UI/API/数据库业务规则；
- 不是最终接受收口，不写 `IMPLEMENTED_ACCEPTED` / `FORMALLY_ACCEPTED` / Feature 完成；
- 数据库写入仅限 `CDC_DATA_SOURCE_RUN_STATE` 的阶段 A 获批 7 行 `INSERT` 与 7 条精确复合主键 `DELETE`；
- ZooKeeper 只读，未主动访问或操作任何节点。

## 2. 项目负责人 DML 授权与 ZooKeeper 环境补充

### 2.1 DML 授权（2026-09-12 会话）

项目负责人明确回复“同意”，授权边界：

- 仅操作 `CLAUDE.md` §11 指定的 Oracle 19c 开发库；
- 唯一允许写入的业务表为 `CDC_DATA_SOURCE_RUN_STATE`；
- 只允许插入带本任务独立前缀的少量临时行，并在验证后删除这些精确临时行；
- 不修改 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 或其他表；
- 不执行 `UPDATE`、`MERGE`、DDL、`TRUNCATE`、匿名 PL/SQL、存储过程；
- 必须先完成全表备份证据，后执行真实 API/浏览器验收，最后恢复并做逐行一致核验；
- 无法保证安全恢复时立即停止。

### 2.2 ZooKeeper 环境补充

当前环境没有可用 ZooKeeper，本 Feature 页面/API 也不依赖 ZooKeeper。ZooKeeper 不可用不得作为本 Feature 补验失败；本任务不得主动访问、写入、创建、修改或删除任何 ZooKeeper 节点。

### 2.3 阶段 A 完整 SQL 展示后的最终检查点

`CLAUDE.md` §12.2 要求在真正执行前展示完整 SQL。阶段 A 已原样展示目标库/Schema/表、7 条 `INSERT` 完整六字段值 + `COMMIT`、7 条精确复合主键 `DELETE` + 清理 `COMMIT`、预计行数、风险、失败恢复顺序、前后逐行比对方法。项目负责人明确回复：

> **批准执行上述 SQL**

该回复仅作用于阶段 A 所展示的那一份精确 SQL；执行中未对 SQL 做任何变更。

## 3. 阶段 A 完整 SQL 与批准记录

- 完整审批包：`evidence/…-R1/sql-approval/sql-package.md`
- 人工批准记录：`evidence/…-R1/sql-approval/approval-record.md`
- 可执行脚本：`sql-approval/insert.sql`、`sql-approval/delete.sql`
- 阶段 A 只读预检：`sql-approval/phaseA-identity.txt`（`CURRENT_USER=CDC`、`DB_NAME=prod`）、`phaseA-columns.txt`、`phaseA-config.txt`、`phaseA-values.txt`、`phaseA-digests.txt`

阶段 A 结束时返回 `status=PENDING_APPROVAL`、`phase=SQL_APPROVAL_CHECKPOINT`、`repository_change_status=ZERO`、`database_write_status=NOT_EXECUTED`，未执行任何 DML、未修改仓库文件。

## 4. 临时主键与预计/实际影响行数

| 项 | 值 |
|---|---|
| 独立任务前缀 | `dss-fa065-r1-`（执行前三张相关表命中 0） |
| 目标表 | `CDC_DATA_SOURCE_RUN_STATE` |
| Schema / 连接用户 | `CDC` |
| 复合主键 | `PK_CDC_DS_RUN_STATE(CLIENT_ID, DATA_SOURCE_ID)` |
| 计划 `INSERT` | 7 |
| 实际 `INSERT` | 7（各 `1 row created` + 一次 `COMMIT`） |
| 计划 `DELETE` | 7 |
| 实际 `DELETE` | 7（各 `1 row` + 一次 `COMMIT`） |
| 配置表写入 | 0 |
| DDL / TRUNCATE / UPDATE / MERGE / 匿名 PL/SQL / 存储过程 | 0 |

7 条临时复合主键：

| # | CLIENT_ID | DATA_SOURCE_ID | SNAPSHOT_STATUS | 场景 |
|---|---|---|---|---|
| S1 | `hosp-007` | `112-source-19c` | `SNAPSHOT_COMPLETED` | 正常关联 → 已完成 |
| S2 | `hosp-002` | `112-source-19c` | `SNAPSHOT_FA065_UNKNOWN` | 正常关联 → 未知状态 |
| S3 | `dss-fa065-r1-client-orphan` | `112-source-19c` | `SNAPSHOT_RUNNING` | 孤立探针端 |
| S4 | `hosp-0061` | `dss-fa065-r1-source-orphan` | `SNAPSHOT_COMPLETED` | 孤立源库 |
| S5 | `CCFG-AC-R1-OFF` | `112-source-19c` | `SNAPSHOT_RUNNING` | 既有停用探针配置 |
| S6 | `CCFG-AC-R1-ON` | `199-source` | `SNAPSHOT_RUNNING` | 既有停用源库配置 |
| S7 | `hosp-012` | `company-target-doris-v4` | `SNAPSHOT_RUNNING` | 既有非 SOURCE 类别数据源 |

E1～E4 全部由 `INSERT` 完成；第 5～7 项引用的都是开发库**既有只读关联配置**，未写配置表。

## 5. before / inserted / after 证据

| 阶段 | 证据 | 关键数值 |
|---|---|---|
| before | `database/run_state_before.txt`、`before-digests.txt`、`precondition-verify.txt` | 30 行；`content_digest=3928100845`；`pk_set_digest=524003855`；前缀 0；7 主键均不存在 |
| before（配置表） | `client_multiple_before.txt`（`a9f7d2fa…`）、`data_source_before.txt`（`34e9a709…`） | 16 / 34 行 |
| inserted | `database/insert-run.txt`、`insert-verify.txt`、`run_state_after_insert.txt` | 30 → 37（仅 +7）；配置表零变化 |
| after（恢复） | `database/delete-run.txt`、`run_state_restored.txt`、`restore-verify.txt` | 37 → 30；前缀 0；7 主键消失；逐字节一致 |

## 6. 真实 DB / API / 浏览器补验

### 6.1 真实数据库只读核对

`database/run_state_after_insert.txt` 导出 37 行，7 条临时行六字段与批准值逐条一致。

### 6.2 真实后端接口（`HTTP`）

`http/fetch.sh` 对正式 `8080` 执行 12 条真实只读 `GET`：

| 用例 | 结果 |
|---|---|
| 01 无参 | 37 行；`candidates.clients=14 sources=12 statuses=['RUNNING','COMPLETED','UNKNOWN']` |
| 02 `status=COMPLETED` | 13 行 |
| 03 `status=UNKNOWN` | 7 行 |
| 04 `status=RUNNING` | 17 行 |
| 05 `clientId=hosp-007` | 1 行（S1，COMPLETED） |
| 06 `clientId=dss-fa065-r1-client-orphan` | 1 行（S3，`clientRef.state=NOT_FOUND`） |
| 07 `sourceId=dss-fa065-r1-source-orphan` | 1 行（S4，`sourceRef.state=NOT_FOUND`） |
| 08 `clientId=CCFG-AC-R1-OFF` | 1 行（S5，`clientRef.state=INACTIVE`） |
| 09～11 | 既有停用源库 / 非 SOURCE 类别 / 组合过滤 |
| 12 非法状态 | `code=41002`（HTTP 200 业务体，脱敏，无堆栈） |

> `candidates` 由**全量 RUN_STATE 行**派生（DESIGN §6.2/§6.3、API.md §5.2），因此临时孤立 ID 合法地出现在候选中（无配置时按 `active:false` 处理），不是回归。

### 6.3 真实浏览器（`BR`）

`browser/scripts/fa065-r1.cjs`：Chromium（Playwright-core，CDP，`--no-sandbox`，headless，`deviceScaleFactor 1`），视口 `1920×1080`，加载正式 `5173` 页面 + 真实后端 8080 + 真实库。

- 26 条断言**全部 `PASS`**（`browser/SUMMARY.txt`、`browser/fa065-cases.json`）；
- 首次加载渲染 **37** 行，分布 `快照进行中 17 / 未知状态 7 / 快照已完成 13`，未知行 7；
- 7 条临时行全部保留，未被关联缺失/停用/类别异常过滤；
- S1 `✓ 快照已完成`（`el-tag--success`）；S2 `? 未知状态`（`el-tag--warning`）+ 未知行高亮；
- S3 探针列回退原始 ID（非空、无停用标记）；S4 源库列回退原始 ID；S5 探针带“停用”标记；S6 源库显示 `业务库`；S7 显示 `doirs库` 且快照启动时间 `--`；
- 排序：组序 `RUNNING < UNKNOWN < COMPLETED`（边界 17 / 24），组内 `UPDATED_AT` 降序；
- 真实查询控件 7 条过滤 + 重置（重置恢复 37 行）；
- 网络：非 `GET` 请求 0，仅使用 `/api/monitor/data-source-run-state/list`；Console/Page 错误 0。

产物：`browser/rows.json`、`browser/fa065-cases.json`、`browser/SUMMARY.txt`、`browser/screenshots/01..09-*.png`。截图仅作旁证，判定以同次运行的结构化 DOM 测量为准。

### 6.4 运行期 SQL 审计（`SC`）

`readonly/runtime-window.txt`（后端日志 `N0=3555`～`N1=3785`）+ `readonly/audit-backend-sql.sh` → `readonly/runtime-audit.txt`：

- `75 Preparing: SELECT`；`write_statement_count=0`；
- `CDC_DATA_SOURCE_RUN_STATE` / `CDC_CLIENT_MULTIPLE` / `CDC_DATA_SOURCE` 各 **25 `SELECT` / 0 `WRITE`**；
- 0 `CREATE` / `ALTER` / `DROP` / `TRUNCATE` / `BEGIN` / `COMMIT` / `callable`。

## 7. `DSS-AC-065` 判定

**`PASS`** —— 由真实 DML 治理流程（阶段 A 审批 → 7 行 `INSERT` + `COMMIT` → 真实 DB/API/浏览器补验 → 7 条精确复合主键 `DELETE` + `COMMIT` → 逐字节恢复核验）完整闭环，且引用开发库既有只读关联配置覆盖了停用/类别异常子场景。

## 8. 必要回归判定

提示词 §9.1 回归集全部维持 `PASS`，未发现回归：`DSS-AC-006`、`014~019`、`022~023`、`033~042`、`043~045`、`052~054`、`062~065`。逐条映射与证据见 `evidence/…-R1/coverage-matrix-r1.md` §2。

其余 R0 `PASS` 用例未重跑（任务 §13：不改代码，无需机械重跑全部 107 条），沿用 R0 结论。

## 9. 数据恢复逐行一致证明

`restore-verify.sh` + `restore-verify.txt`：

| 项 | 结果 |
|---|---|
| `run_state` 逐字节比较 | `before=03f4044c…` / `restored=03f4044c…` → **IDENTICAL** |
| `client_multiple` 逐字节比较 | `a9f7d2fa…` = `a9f7d2fa…` → IDENTICAL |
| `data_source` 逐字节比较 | `34e9a709…` = `34e9a709…` → IDENTICAL |
| 任务前缀剩余行 | **0** |
| 7 个临时主键仍存在数 | **0** |
| 行数 | `run_state=30` / `client_multiple=16` / `data_source=34`（与任务前一致） |
| `content_digest` | `3928100845`（与任务前一致） |
| `pk_set_digest` | `524003855`（与任务前一致） |
| 状态分布 | 与任务前一致（合计 30） |
| NULL 计数 | `last_seen_null=13` / `completed_null=19`（与任务前一致） |
| 配置表前缀 | `cm_prefix=0`、`ds_prefix=0` |

API 层旁证：`http/99-post-restore-no-params.json` 与 R0 基线 `01-no-params.json` **payload 逐字段一致**（仅 `timestamp` 不同），见 `http/post-restore-check.txt`。

## 10. R0 报告 diff-check 与 ZooKeeper 表述纠正（append-only）

### 10.1 `git diff --check` 事实纠正

`git/diff-check.txt` 分层结论：

- **业务文档 / 作者生成文件**：`git diff --check` **`rc=0`（干净）**；
- **完整提交** `af88aa84…3190b3d…`：`rc=2`，90 处 trailing-whitespace，**全部集中于 4 个逐字节转录的 `.txt` 原始日志证据文件**：
  - `…-001/services/backend-runtime.txt`（第 24~27、82~261、1462、1465、1468 行）
  - `…-001/services/liveness.txt`（第 10、11 行）
  - `…-001/tests/backend-package.txt`（第 5、10、13、19、25、28、33、39、42、45 行）
  - `…-001/tests/backend-targeted.txt`（第 6、11、17、23、26、31、37、39、49、51、53 行）
- 分类：**`NONZERO_ONLY_PRESERVED_R0_RAW_TRANSCRIPT_WHITESPACE`**。

这些行尾空格是**原始证据内容**（转录用源输出本身带行尾空格），任务 §14.2/§15 要求这些文件保持逐字节不变，故**保留不清洗**。R0 报告 §11.2 的笼统 `CLEAN` 已由 R0 报告文末 §16.1 追加纠正取代其当前解释；原 R0 历史正文未删除、未重写。

### 10.2 ZooKeeper 事实纠正

分层口径（R0 报告文末 §16.2，取代 §3.2 的笼统表述）：

| 项 | 值 |
|---|---|
| Feature 主动 ZooKeeper 访问 | `NONE` |
| Feature ZooKeeper 依赖 | `NONE` |
| 应用后台 ZooKeeper 连接尝试 | `OBSERVED` |
| 当前环境 ZooKeeper 可用性 | `UNAVAILABLE_NOT_REQUIRED_FOR_FEATURE` |
| ZooKeeper 节点读写 | `ZERO` / `NOT_OBSERVED` |

`readonly/runtime-audit.txt` §6：窗口内 4 行 ZooKeeper 日志为后台应用无关连接尝试（2× `Opening socket connection to 10.19.16.111:2181`、2× `Socket error … Connection refused`）；节点 API 标记（`getData`/`setData`/`setACL`/`reconfig`/`getChildren`/`zkCli`/`bsoft-cdc`）**全部为 0**。该环境噪声不影响本 Feature 结论。

R0 证据 `README.md` 已追加 §6 指向上述两项纠正；本目录其他 R0 证据文件逐字节不变。

## 11. 测试、构建、服务与调度器

| 项 | 结果 | 证据 |
|---|---|---|
| 后端定向测试 | `Tests run: 27, Failures: 0, Errors: 0, Skipped: 0`；`BUILD SUCCESS`；exit 0 | `tests/backend-targeted.txt` |
| 前端定向测试 | 14 files / 250 tests passed；exit 0 | `tests/frontend-targeted.txt` |
| 前端构建 | `vue-tsc --noEmit && vite build` ✓ 21.68s；exit 0 | `tests/frontend-build.txt` |
| 汇总 | 见 | `tests/SUMMARY.txt` |

说明：本 worktree 的 `frontend/node_modules` 不存在，按 `CLAUDE.md` §10.2 执行了 `npm ci`；未修改任何代码或测试文件，以上均为同一提交上的重跑。**未预填历史数量**：以上计数为本次实际运行输出。

服务：复用 R0 保留的正式服务（后端 pid `10371`、前端 pid `10530`），其代码来源 `/agent/dss-formal-acceptance-001` 的 HEAD = `3190b3d…` = R1 起点提交，**代码同一**，可安全复用。未误停任何任务前未知进程。

调度器：大屏统计调度器按项目负责人既有决定随真实后端正常运行；运行期 SQL 审计（§6.4）证明其对 Feature 三张业务表**零写入**，与本任务 DML 分别审计。

## 12. 107 条最终计数

| 计数 | 值 |
|---|---|
| `PASS` | **107** |
| `FAIL` | 0 |
| `BLOCKED` | 0 |
| `NOT_RUN` | 0 |
| 合计 | 107 |

由 `PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0` 更新为 **`PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`**（`DSS-AC-065`: `BLOCKED` → `PASS`）。

## 13. 业务规则、代码、契约与 R0 原始证据零变化

- 需求 87 条连续唯一，业务行相对 `3190b3d…` 零变化；
- 验收 107 条连续唯一，除 `DSS-AC-065` 状态列外业务列逐字节不变；
- 需求—验收追踪仍 87/87、107/107；
- 未修改 DESIGN §14.2/§14.3、§25～§27 业务规则；未修改 UI §19～§21 业务规则；
- `API.md` / `DATABASE.md` 契约零变化；
- `frontend` / `backend` / test code diff **为零**；
- R0 报告与 R0 evidence `README.md` **仅文末 append-only 追加**；
- R0 其他 **134** 个 evidence 文件逐字节不变；
- R0 原始 trailing-whitespace 证据**未改写**。

## 14. Git 范围与校验

- 起点：`3190b3d2450478bef34b24578312c76c3973cb08`（分支名空 = detached HEAD；`head_matches_expected=yes`）；
- 远程：`git ls-remote origin refs/heads/develop` = `3190b3d…`；
- 见 `git/startpoint.txt`、`git/diff-check.txt`；
- 提交前校验项与 §13 一致；新增 R1 文件自身无行尾空格；
- 提交前对 R1 提交范围（`3190b3d…` + 本 R1 变更集）执行 `git diff --check` 结果为 `rc=0`（干净），无常量行尾空白、无 EOF 空行告警；R0 交付提交范围内的 `rc=2` 仍仅来自被逐字节保留的 R0 原始逐字日志（分类见 `git/diff-check.txt`，本次未改动这些 R0 文件）；
- 为使 R1 自身证据满足 §16 的行尾空白要求，对 R1 **新建**文件做了仅限**行尾**的规范化：`readonly/runtime-window.txt`（原 `.log`）、`tests/backend-targeted.txt`、`services/README.txt`、若干 SQL*Plus 输出 `.txt` 的 EOF 空行、`git/diff-check.txt`；规范化只删除行尾空白/末尾空行，不删除或改写任何被测内容，`runtime-audit.txt` 的 `log` 路径与 `bytes` 计数已同步；R0 原始证据文件**未**规范化、未改名、未改写；
- 完整提交 `git diff --check` 如仍因 R0 原始逐字日志非零，按 §10.1 精确列出文件/行并记录分类，不伪称全局 `CLEAN`；
- 证据无凭据类敏感数据：无密码、无 Token、无 Cookie、无 `Authorization`、无含账号口令的完整连接串、无 SSH/操作系统私钥；
  数据库脚本不在证据中内联口令（`database/restore-verify.sh` 改由运行前导出 `DSS_DEV_CONN`，来源为 `CLAUDE.md` §11 授权的内网开发库），
  证据中仅出现 `CLAUDE.md` §11 明确授权的内网开发库**地址**（`192.168.174.65:1521/prod.enmotech.com`，无账号口令）；
  `CDC_DATA_SOURCE` 导出已排除用户/密码/主机/端口/服务名。

## 15. Commit / Push / 远程一致性

- 按 §14 白名单路径逐个暂存（未使用 `git add .` / `-A`）；
- 单次普通提交，信息：`test(source-snapshot): complete blocked formal acceptance case [DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1]`；
- Push 前执行 `git fetch origin develop`；若远程前移或分叉则停止；
- 安全快进后普通推送 `HEAD:develop`；
- 推送后确认 local HEAD = `origin/develop` = `git ls-remote origin refs/heads/develop`，ahead/behind `0/0`；
- 实际结果 commit ID、push 状态见文末结果块。

## 16. 服务 PID、URL 和停止命令

| 项 | 值 |
|---|---|
| 前端 PID | `10530` |
| 后端 PID | `10371` |
| 页面 URL | `http://192.168.174.70:5173/monitor/data-source-state` |
| 接口 URL | `http://192.168.174.70:8080/api/monitor/data-source-run-state/list` |
| 健康检查 | `127.0.0.1:5173` / `192.168.174.70:5173` → HTTP 200；两个接口 URL → HTTP 200 |
| 停止命令 | `kill 10530 10371` |

详见 `services/README.txt`。服务保留供后续检查。

## 17. 明确声明：本任务**未**最终接受

- 本任务**不是**最终接受收口；
- **不**把 Feature 改成 `IMPLEMENTED_ACCEPTED`；
- **不**代替 ChatGPT 从远程 Git 的复审；
- **不**代替项目负责人做正式人工验收或接受决定；
- `human_visual_acceptance_status=NOT_RUN`；
- 即使 107 条全部 `PASS`，天花板仍为“**正式验收执行完成，待 ChatGPT 从远程 Git 复审**”。

## 18. 下一入口

`CHATGPT_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_ACCEPTANCE_DECISION`


## 19. R2 文档当前状态一致性纠正补充说明（`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R2`，append-only）

> 本节由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R2` 于 2026-09-12 **追加**（仅追加，不改写、不删除本报告原有任何正文；本节之前的全部内容仍为 R1 当时的交付记录）。本节取代本报告正文中任何“8 份入口文档当前状态已完全同步/无残留”性质表述——该表述已被 ChatGPT 的提交级复审证明不成立。

### 19.1 ChatGPT 对 R1 执行与证据的复审结论

ChatGPT 已从远程 Git 对 R1 结果提交 `bf5f1b54a3abf54ea1d5ea1e1a9ed72cf39b7f7b` 独立复审：**R1 的验收执行与证据结论为 `APPROVED`**（`r1_acceptance_execution_evidence_status=APPROVED`）。

### 19.2 整体 Git 提交复审临时为 `CHANGES_REQUIRED`

ChatGPT 对**整体 Git 提交**的复审临时为 `CHANGES_REQUIRED`，**唯一**问题类别为：8 份入口文档仍残留非历史的旧 `NOT_RUN`、旧计数与旧下一入口，与已经写入的当前事实 `PASS 107` 相矛盾。**未发现**任何业务代码问题、测试代码问题、API 契约问题、DATABASE 契约问题、`DSS-AC-065` 判定问题或证据真实性问题。

### 19.3 主要冲突类别

1. **当前 `NOT_RUN` 残留**：把已执行后的当前状态仍写成 `全部 \`NOT_RUN\`` / `formal_acceptance_status=NOT_RUN` / `acceptance_execution_status=NOT_RUN`；
2. **旧计数残留**：`acceptance_not_run_count=107`、`formal_acceptance_not_run_count=107`，以及历史扩张计数 68 / 80 / 86 / 95 / 103 等未作历史限定；
3. **旧下一入口残留**：把已被处理的入口当作当前入口，即 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`、`CHATGPT_FORMAL_ACCEPTANCE_REVIEW_FROM_GIT_THEN_TARGETED_COMPLETION_TASK`、`CHATGPT_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_ACCEPTANCE_DECISION`。

### 19.4 纠正方式与范围

上述问题已由 `DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R2`（**纯文档**当前状态一致性纠正任务）修正：

- 统一当前验收事实为 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`（`acceptance_execution_status=PASS`、`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`、`formal_acceptance_pass_count=107`、`formal_acceptance_fail_count=0`、`formal_acceptance_blocked_count=0`、`formal_acceptance_not_run_count=0`）；
- 统一下一入口为 `CHATGPT_FORMAL_ACCEPTANCE_R2_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_ACCEPTANCE_DECISION`；
- 8 份入口文档为 `docs/features/README.md`、`docs/features/data-source-snapshot-status/README.md`、`.../REQUIREMENTS.md`、`.../ACCEPTANCE.md`、`.../DESIGN.md`、`.../UI.md`、`.../API.md`、`.../DATABASE.md`；
- 旧事实一律保留但加显式历史限定（日期＋当时/执行前/历史/R0 前/R1 前/此前），**不删除真实历史**；`human_visual_acceptance_status=NOT_RUN` 作为当前真实值保留，未改写为 `PASS`/`APPROVED`。

### 19.5 R1 既有事实与证据未被否定

本补充说明**不否定** R1 的下列事实与证据，它们继续有效：

- `DSS-AC-065` 判定为 `PASS`（经项目负责人批准阶段 A `INSERT` 7 行 + 精确复合主键 `DELETE` 7 行并逐行恢复）；
- 最终计数 `107 / 0 / 0 / 0`；
- 三张业务表逐字节恢复、任务前缀残留 `0`；
- 测试、构建与浏览器补验结论；
- 凭据脱敏处理；
- ZooKeeper 分层事实与 R0 报告 diff-check 表述纠正。

### 19.6 与原报告正文的关系

本报告**原有正文（§1～§18）保持为 R1 当时的交付记录，未作任何改写**；本节为其后由 ChatGPT 复审触发的**补充说明**，并在“8 份入口文档当前状态是否已完全同步”这一问题上**取代**原正文的解释。
