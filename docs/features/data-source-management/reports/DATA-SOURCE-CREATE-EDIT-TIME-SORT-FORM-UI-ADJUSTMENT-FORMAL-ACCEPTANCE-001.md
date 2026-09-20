# 正式验收报告 —— 新增/修改时间字段维护、列表默认排序与主弹窗表单视觉调整

> 任务：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> 分支：`develop`　|　`RUN_TAG`：`FACC002`　|　执行日期：2026-09-20
> 运行源：独立工作树 `/agent/cdc-temp-ds-formui-formal-001` @ `db1cfda7c8e10ddd5faa2a119e7550059a687d05`
> 验收范围：`DS-REQ-178~188`（11 条）对应的 `DS-AC-183~199`（**17 条**）

## 1. 结论摘要

| 项 | 结果 |
|---|---|
| 用例执行 | **17/17 = PASS**（`PASS=17 FAIL=0 BLOCKED=0 NOT_RUN=0`） |
| 验收前自动化门禁 | 6/6 **PASS**（后端 161/1033 + `clean package`；前端 109/1044 + `build`） |
| 数据库受控写入 | 13 个 `FACC002-*` 主键 + 1 个延伸组合键，全部为**本 Agent 创建** |
| 数据库清理 | 精确白名单单事务删除 13/13，显式 `COMMIT`，两表残留 **0** |
| 存量数据保护 | 36 条主表 + 10 条延伸表记录规范化快照 **逐字节一致**（4 个 SHA-256 全部 `IDENTICAL`） |
| 浏览器证据层级 | 表单/按钮视觉为**真实浏览器计算样式**；禁用态为**定向自动化 + 构建 CSS 佐证**（如实标注） |
| 实现状态（本轮） | `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE` |
| 正式验收执行状态 | `EXECUTED_PASSED_LOCAL` |
| 本轮新增验收统计 | `PASS_17_OF_17` |
| 最终验收 | **未**给出（`final_acceptance_status` 保持非 `ACCEPTED`，留待项目负责人） |

> **边界声明**：本报告**不**构成最终验收。本轮**不**得写为 `ACCEPTED`、`IMPLEMENTED_ACCEPTED`、`final_acceptance_status=ACCEPTED` 或"生产可用"。`EXECUTED_PASSED_LOCAL` 仅表示 17 条用例已在真实前后端 + 真实 Oracle 开发库 + 真实浏览器下端到端执行并通过；最终验收决定权属项目负责人，前置为 ChatGPT 从远程 Git 的正式验收复审。

## 2. 运行源身份

| 项 | 值 |
|---|---|
| 分支 / `HEAD` / `origin/develop` / `refs/heads/develop` | `develop` / `db1cfda7c8e10ddd5faa2a119e7550059a687d05`（四者一致，ahead/behind `0 0`） |
| 相关提交 | `implementation_commit=807a5a58…`、`password_fix_commit=55e6273b…`、`r2_docs_commit=f42aad01…`、`r3_docs_commit=db1cfda7…` |
| 后端 | PID `51273`，`java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=127.0.0.1`，cwd 工作树 `backend`，监听 `127.0.0.1:8080`，jar SHA-256 `1150fb5777f482fdc813b1b169c73a6135e4bc6dd3ee98ac50332e3fb62d5d78` |
| 前端 | npm PID `51288` → vite PID `51302`，`npm run dev -- --host 0.0.0.0 --port 5173`，监听 `0.0.0.0:5173` |
| 浏览器 | Chrome 148.0.7778.167 headless，CDP `127.0.0.1:9222`，视口 1440×900 |
| 被测地址 | `http://192.168.174.70:5173/config/data-source` |

**与任务书的口径偏差（如实记录）**：任务 §5 要求核验 `/actuator/health`。本工程**未启用** Spring Boot Actuator，实际健康端点为既有 `HealthController` 的 **`/api/health`**（`HealthController.java:16,23`）；`/actuator/health` 会被 SPA 静态资源兜底路由接管并返回 `index.html`，**不能**作为健康证据。本任务按真实端点 `/api/health` 核验（`{"code":200,…"status":"UP"}`），**未**为迎合提示词新增 Actuator 依赖（属越权的业务/依赖变更）。

## 3. 自动化门禁结果（写入之前）

| # | 门禁 | 预期 | 实测 | 结果 |
|---|---|---|---|---|
| 1 | 后端定向 `mvn -o test -Dtest='…5 个数据源测试类'` | 161 / 0 | 161 / 0 | **PASS** |
| 2 | 后端同范围安全回归（排除 4 个真实外部系统测试类） | 1033 / 0 | 1033 / 0 | **PASS** |
| 3 | 后端 `mvn -o clean package -DskipTests` | BUILD SUCCESS | BUILD SUCCESS（19.254 s） | **PASS** |
| 4 | 前端定向 `npm test -- src/views/data-source/dataSource.spec.ts` | 109 | 109 | **PASS** |
| 5 | 前端全量 `npm test` | 1044 / 56 文件 | 1044 / 56 文件 | **PASS** |
| 6 | 前端 `npm run build` | BUILD SUCCESS | `✓ built in 27.84s` | **PASS** |

- 排除范围与实现 R1 / 上一轮验收**完全一致，未扩大**；4 个真实外部系统测试类**未运行**。
- 未出现偶发失败，未进入"保留首次证据 + 隔离复现"流程；**未**修改任何业务代码、测试代码或断言以通过门禁。
- 独立工作树 `node_modules` 初始不存在，按 `CLAUDE.md §10.2` 执行 `npm ci`（exit 0，未改 `package.json`/锁文件）。
- 详见 `evidence/…/00-pregate-automation-gates.md`。

## 4. 逐用例结果（17/17 PASS）

| 用例 | 主题 | 结论 | 关键实测 |
|---|---|---|---|
| `DS-AC-183` | 新增两时间字段同源且相等 | PASS | `IT=UT=2026-09-20 17:18:53`，同一条 `@Insert … SYSDATE, SYSDATE`；应用机 17:17:54 vs 库 17:18:53 证明取库时间 |
| `DS-AC-184` | 修改保留 `INSERT_TIME` | PASS | `IT` 逐字节 `17:18:53` 不变；`UT→17:19:18` |
| `DS-AC-185` | 启用非幂等/幂等 | PASS | `EN0` 非幂等 `UT→17:19:25`；`EN1` 幂等两列完全未变 |
| `DS-AC-186` | 停用非幂等/异常归一化/幂等 | PASS | `DIS1→17:19:31`；`BAD`（`NULL`）→归一化 `'0'` + 时间更新；`DIS0` 幂等两列未变 |
| `DS-AC-187` | 业务属性成功/失败回滚 | PASS | 成功 `UT→17:19:39`；2100 字符触发 `ORA-12899`，HTTP 500，`UT` 未变、值未变 → 整条回滚 |
| `DS-AC-188` | 命名策略只写延伸表 | PASS | 延伸表 10→11→11→10，主表两记录时间全程未变；零触发器、零新增索引 |
| `DS-AC-189` | 三键排序后端生成 | PASS | 接口 48 行顺序与库内三键排序结果**完全一致**；前端无 `.sort(` |
| `DS-AC-190` | 空时间记录最后且未回填 | PASS | `SORT-NULL` 第 48/48 位，两列始终 `NULL` |
| `DS-AC-191` | 同时刻按 ID 稳定排序 | PASS | `SORT-A`(11) → `SORT-B`(12)；`SRC-DIS0`(13) 佐证第二键 |
| `DS-AC-192` | 标签 120px 右对齐 | PASS | `width=120px`、`text-align=right`、`el-form--label-right` |
| `DS-AC-193` | 测试连接按钮对齐、其他弹窗不变 | PASS | 输入框/按钮左边界均 `546px`；`naming-dialog` 仍 `110px/left` |
| `DS-AC-194` | 标签字体与非泄漏 | PASS | `14px/500/#3f3f46`、系统无衬线；星号 `rgb(245,108,108)`；规则均带 `[data-v-…]` 作用域 |
| `DS-AC-195` | 新增态红星 + 空密码中文拦截 | PASS | `::before content="*"`；错误 `请输入密码`；`POST` 计数 **0** |
| `DS-AC-196` | 编辑态无星号、沿用原密码、无回显 | PASS | 无星号；显示常量掩码 `*********`；`PUT` 体不含 `password`；库中密码不变 |
| `DS-AC-197` | 按钮文案与常态视觉 | PASS | 新增 `创建` / 编辑 `保存`；`#09090b`/`#ffffff`/`6px`/`500` |
| `DS-AC-198` | 悬停/聚焦/按下/加载/禁用 | PASS | `#27272a` / `#27272a` / `#18181b`；真实加载态含转圈且白字可读；禁用为 EP 视觉 |
| `DS-AC-199` | 取消/测试连接/其他弹窗/其他路由无外溢 | PASS | 两按钮为 EP 默认视觉；`naming-dialog` 与 6 个抽样路由均无 editor 样式 |

逐用例详细证据见 `evidence/…/05-ds-ac-183-199-case-evidence.md`。

## 5. 数据库写入与清理

### 5.1 写入（仅本 Agent 创建的数据）

| 阶段 | 通道 | 预期 | 实际 |
|---|---|---|---|
| 预置 6 条（`EN0/DIS0/BAD`、`SORT-NULL/A/B`） | 受控单事务（`SET EXITCOMMIT OFF` + PL/SQL 校验后 `COMMIT`） | 6 | `TOTAL_INSERTED=6` → `DECISION=COMMIT`；主表 36→42 |
| 新增 6 条（`SRC-NEW/EN1/DIS1`、`TGT-BIZ`、`SRC-NAME/TGT-NAME`） | 真实 `POST /api/data-sources` | 6 | 6× HTTP 200；主表 42→48 |
| 新增 1 条（`UI-NEW`） | **真实浏览器**新增弹窗 | 1 | 主表 48→49，界面「新增成功」 |
| 命名策略组合键 1 个 | 真实命名策略 POST（`DS-AC-188`） | 1 | 延伸表 10→11，同用例内 DELETE 回 10 |

写入前 `FACC002%` 占用 **0/0**、`FACC001%` 残留 **0**，13 个计划主键全部不存在 → 未触发 `BLOCKED`。

### 5.2 清理（`finally`，精确主键白名单）

```text
EXT_BEFORE=0     MAIN_BEFORE=13
EXT_DELETED=0    MAIN_DELETED=13
DECISION=COMMIT
```

- 单事务内先统计白名单实际数量，先删延伸表、再删主表，影响行数与删除前实际数量**一致**才显式 `COMMIT`。
- **未使用** `LIKE 'FACC002%'` 前缀删除。
- 清理后：主表/延伸表 `FACC002%` 残留均 **0**；主表回 **36**、延伸表回 **10**。

### 5.3 存量数据保护复算

| 文件 | 行数 | 重算 SHA-256 | 比对 |
|---|---|---|---|
| `main-norm.tsv` | 36 | `4d03107b1ec39a0ea7c4ee2d4e2fb8710670c2309610c417ce4b0e767ad6be0e` | **IDENTICAL** |
| `ext-norm.tsv` | 10 | `a377a6bf22c14458137c79527c4de88f86e4ceb802b3c7c9fd8cdc66c66fd78d` | **IDENTICAL** |
| `main-rowhashes.txt` | 36 | `915a1073dd3b26376477dd4702486152d726e88bef24c8041f2950056c2b09b0` | **IDENTICAL** |
| `ext-rowhashes.txt` | 10 | `a53fe567732ebb9f7c16e1629e0d72ed55be98bfba7658d549430b7d18da6386` | **IDENTICAL** |

分布复核一致：`FG_ACTIVE` `'0'=19`/`'1'=17`；类别 `18/4/2/11/1`；`INSERT_TIME IS NULL=0`、`UPDATE_TIME IS NULL=10`。只读关联表 `16/12/30/0/1/7` 一致。**未**发生白名单外写入、DDL、触发器、存量清洗或批量回填。

### 5.4 与上一轮基线数字的差异（如实记录，不修改历史）

上一轮验收（`RUN_TAG=FACC001`，见 `README.md §2.3`）记录的存量基线为 **34** 条主表记录；本任务写入前实测为 **36** 条，且本任务全程以 **36** 为基线并在清理后逐字节复现 **36**。该差异**未**在本任务中追溯成因，**未**修改上一轮的历史记录，也**未**据此调整任何统计；仅作为观察如实记录，供项目负责人判断是否需要单独核查。

## 6. 变更范围

仅新增/修改**文档、报告与证据**；**未**改动任何业务代码、测试代码、配置、依赖或锁文件。

| 类型 | 路径 |
|---|---|
| 新增证据目录 | `docs/features/data-source-management/evidence/DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001/`（`00`~`07` 共 8 份） |
| 新增报告 | `docs/features/data-source-management/reports/DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001.md` |
| 回写核心文档 | `README.md`、`REQUIREMENTS.md`、`DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`、`ACCEPTANCE.md`（仅本轮「当前状态」最小回写） |

**冻结不变**：`DS-REQ-178~188` / `DS-AC-183~199` 的编号、正文、前置条件、步骤与预期结果逐字未改；其他需求/用例状态未改；上一轮 `DS-AC-116~140` 与 Feature 级状态未顺手升级；`REQUIREMENTS.md §21` 变更记录表中任务前已有的多余空行**保持原样、未修复**。

**未提交**：运行日志、数据库原始存量快照（含密码列）、构建产物、任务前无关文件。

## 7. 遗留与边界

1. **最终验收未给出**：`final_acceptance_status` 保持非 `ACCEPTED`；下一步为 ChatGPT 从远程 Git 做正式验收复审，再由项目负责人作最终验收决定。
2. **服务状态**：本任务启动的后端 / 前端服务在证据冻结后按精确 PID 停止，`8080`/`5173` 无监听；临时工作树 `/agent/cdc-temp-ds-formui-formal-001` **保留**（未获授权删除）。
3. **证据层级**：`DS-AC-198` 的**禁用态**采用 `is-disabled` 类定向自动化 + 计算样式 + 构建产物 CSS 佐证，**不声称**为完整端到端运行态证据；其余表单项与按钮态均为真实浏览器计算样式，加载态为真实请求进行中捕获。
4. **口径偏差**：`/actuator/health` → 实际 `/api/health`（见 §2）。
5. **观察项**：上一轮基线 34 条 vs 本轮 36 条（见 §5.4），**未**由本任务追溯。
6. **既有非阻断问题**：`REQUIREMENTS.md §21` 变更记录表多余空行，**本任务未修复**，继续如实记录。

## 8. 机器可读结果

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001
branch=develop
base_commit_id=db1cfda7c8e10ddd5faa2a119e7550059a687d05
result_commit_id=见提交后补记
env_check_status=SUCCESS
backend_build_status=SUCCESS
frontend_build_status=SUCCESS
database_write_status=APPROVED_AND_EXECUTED
zookeeper_write_status=NOT_REQUESTED
push_status=SUCCESS
changed_files=见 §6
error=
AGENT_TASK_RESULT_END
```
