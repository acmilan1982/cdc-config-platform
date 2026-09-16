# 源库快照状态——查询按钮与表格布局稳定性正式验收 ZooKeeper 边界与结果事实 R1 纠正报告

## 1. 任务与基准

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1` |
| 分支 | `develop` |
| 基准提交 | `71368a0a338209af564103291f5a51bc03e60bb4`（`origin/develop` 与 `git ls-remote` 均严格等于该提交） |
| R0 正式验收基准提交 | `682650058b85b99b13a343373d6887bf0784ec1f` |
| R0 正式验收结果提交 | `71368a0a338209af564103291f5a51bc03e60bb4` |
| 隔离工作区 | `/agent/dss-query-button-table-layout-formal-acceptance-001-r1`（detached HEAD） |
| 复审日期 | 2026-09-16 |

本任务为**纯文档与证据事实定向纠正**，不是重新验收、不是代码修改、不是问题修复、
不是服务操作、不是 ZooKeeper 检查、不是最终接受收口。

## 2. ChatGPT 对 R0 的复审结论

```text
chatgpt_r0_formal_acceptance_review_status=CHANGES_REQUIRED_ZOOKEEPER_BOUNDARY_AND_RESULT_FACT_ONLY
r0_formal_acceptance_execution_result_status=PRESERVED_PASS_5_OF_5_TOTAL_118_OF_118
r0_business_acceptance_evidence_review_status=APPROVED
```

复审确认 R0 的业务验收与机器证据有效，且明确**只**要求纠正 ZooKeeper 边界及其结果字段：

- 四档视口、长短结果切换、398 项严格断言、0 失败、正式判定 `exit 0`；
- 页面无关负向控制在官方结果上注入 `+0.001px` 后由同一判定器判出 20 项失败并真实 `exit 1`；
- 查询、重置、立即刷新按钮固定宽度分别为 `62px`、`62px`、`110px`；
- route-scoped stable scrollbar gutter 有效，其他路由零泄漏；
- 前端、后端、项目测试、依赖、锁文件、SQL、配置零变化。

上述业务结论**不被**本次纠正推翻，也**未被**本轮重跑。

## 3. 唯一需要纠正的问题

### 3.1 实际执行事实

R0 证据文件明确记录执行了：

```text
$ZOOKEEPER_HOME/bin/zkCli.sh -server $CDC_ZK_CONNECT ls /bsoft-cdc/clients
```

返回：

```text
[hosp-012]
```

因此该行为是：由正式验收任务**主动**发起、使用 ZooKeeper CLI、对 `/bsoft-cdc/clients` 执行**一次**只读节点读取；
没有创建、修改、删除节点，没有修改 ACL，没有 ZooKeeper 写操作；与本页面的业务依赖无关。

### 3.2 边界冲突

R0 提示词要求正式验收任务**不得主动执行 ZooKeeper CLI、不得读取节点**。
`ls /bsoft-cdc/clients` 是一次主动的 CLI 节点读取，因此**违反**该任务边界。
该边界违反与"环境是否只读"无关：即便只读，主动读取本身也是被禁止的。

### 3.3 结果事实错误

R0 证据文件中该状态字段（`formal_acceptance_task_initiated_zookeeper_node_operation_status`）
当时被记为 `NONE`，即"本任务未发起任何 ZooKeeper 节点操作"。这与事实不符，是**错误结果字段**。
R0 记录以"ZooKeeper 只读"、"read-only availability probe only"等笼统写法描述该行为，
掩盖了"任务主动读取 + 违反边界"这一事实。

### 3.4 正确结果字段

```text
zookeeper_environment_status=AVAILABLE
formal_acceptance_task_initiated_zookeeper_node_operation_status=READ_ONLY_LS_ONE
formal_acceptance_task_initiated_zookeeper_cli_status=EXECUTED_ONCE
formal_acceptance_task_initiated_zookeeper_read_status=READ_ONE_PATH
formal_acceptance_task_initiated_zookeeper_read_path=/bsoft-cdc/clients
zookeeper_boundary_compliance_status=VIOLATED_READ_PROHIBITION
zookeeper_write_status=ZERO
zookeeper_acl_change_status=ZERO
feature_zookeeper_dependency=NONE
```

## 4. R0 业务验收结论保留依据

保留 `DSS-AC-114~118` 全部 `PASS` 与合计 `118` 条 `PASS`，依据如下：

1. ChatGPT 复审已认定 `r0_business_acceptance_evidence_review_status=APPROVED`，
   且判定该偏差为任务边界与结果事实问题，不是业务实现或判定失败；
2. ZooKeeper 读取与本 Feature 无依赖关系：后端包
   `com.bsoft.cdcconfig.monitor.datasourcerunstate` 内零 ZooKeeper / Curator / sync-client 引用，
   `DESIGN.md` §2.3 将 Kafka/ZooKeeper/sync-client 接入明确列为非范围；
3. `DSS-AC-114~118` 的判定依据是真实页面、真实后端、真实 Chromium 的原始几何与严格断言，
   与该 ZooKeeper 读取无关；
4. 本轮未修改任何业务实现、测试、断言、R0 浏览器证据或判定结果。

保留字段：

```text
dss_ac_114_status=PASS
dss_ac_115_status=PASS
dss_ac_116_status=PASS
dss_ac_117_status=PASS
dss_ac_118_status=PASS
adjustment_acceptance_pass_count=5
adjustment_acceptance_fail_count=0
adjustment_acceptance_blocked_count=0
adjustment_acceptance_not_run_count=0
formal_acceptance_pass_count=118
formal_acceptance_fail_count=0
formal_acceptance_blocked_count=0
formal_acceptance_not_run_count=0
r0_formal_acceptance_execution_result_status=PRESERVED_PASS_5_OF_5_TOTAL_118_OF_118
```

## 5. 本轮未执行的活动

```text
test_status=NOT_RUN_NOT_REQUIRED_DOC_AND_EVIDENCE_FACT_CORRECTION_ONLY
build_status=NOT_RUN_NOT_REQUIRED_DOC_AND_EVIDENCE_FACT_CORRECTION_ONLY
browser_verification_status=NOT_RUN_R0_APPROVED_BUSINESS_EVIDENCE_PRESERVED
formal_acceptance_execution_status=NOT_RERUN_R0_PASS_PRESERVED
service_lifecycle_status=NOT_RUN_EXISTING_SERVICES_UNTOUCHED
```

具体地，本轮**未**：

- 运行任何项目测试、`npm run build`、`vue-tsc` 或 Maven 构建；
- 启动 Chromium、执行几何采集或任何浏览器验收；
- 重新执行 `DSS-AC-114~118`；
- 修改前端、后端、项目测试、CSS、断言、依赖、锁文件、SQL 或配置；
- 修改 R0 浏览器证据、截图、`rects/*.json`、判定 JSON、测试记录或数据库证据。

允许运行的只有本任务专用的文档一致性与 Git 范围检查脚本（`checks/`），
这些脚本**不是**业务测试，也**不是**正式验收。

## 6. 数据库 / ZooKeeper / Kafka 边界

```text
r1_task_zookeeper_access_status=NONE
r1_task_database_access_status=NONE
r1_task_kafka_access_status=NONE
```

- 本轮**未**执行任何 ZooKeeper 命令（无 `zkCli.sh`、无 `ls`/`get`/`stat`/`getAcl`、无写操作、无 ACL 修改），
  也没有做任何"只读可用性确认"；
- 本轮**未**连接数据库，**未**执行任何 SQL（含 `SELECT`）；
- 本轮**未**访问 Kafka；
- R0 的数据库只读结论只作为**历史证据引用**，未被本轮重新验证。

`zookeeper_environment_status=AVAILABLE` 是既有环境事实，本轮只从 Git 中读取历史证据并纠正文档。

## 7. 服务与 worktree 保留

```text
frontend_launcher_pid=112421
frontend_actual_listen_pid=112435
backend_launcher_pid=112346
service_url=http://192.168.174.70:5173/monitor/data-source-state
```

本任务开始时这三个 PID 已不在 `/proc` 中（任务开始前服务已退出），监听端口无 5173/8080 记录。
按 R0 提示词 §9，服务在任务开始前退出不构成文档纠正阻塞；
本轮**未**启动、停止、重启或替换任何服务，**未**访问页面或后端接口，**未**执行服务停止命令。
存在性记录见 `../evidence/...-R1/services/01-service-presence.txt`。

worktree 方面：本任务从 `71368a0` 新建 detached 隔离工作区
`/agent/dss-query-button-table-layout-formal-acceptance-001-r1`；
主工作区 `/agent/cdc-config-platform` 未被修改；其余既有 worktree 未被进入、清理、reset、stash、删除或移动。

## 8. 两个 append-only 文件的证明

### 8.1 R0 正式验收报告

```text
path=docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001.md
before_bytes=12929
before_sha256=e1fcb3657b28ce50b0ef911caafede535e62b26e29d35edb54de9f43b28270dd
after_bytes=17204
after_sha256=bdc270cc1c6946f3c0d58408fcaa49ec673cfd631b501948b211dbe773c8f1cd
original_bytes_are_exact_prefix_of_new_file=true
deleted_bytes=0
deleted_lines=0
appended_bytes=4275
```

追加内容为文末新章节「§17 ChatGPT R0 复审与 R1 ZooKeeper 边界事实纠正记录」，
同时说明**业务验收结论保留**与**任务边界不合规**两件事。
该章节**未**内嵌本报告修改后的 SHA-256（`after_sha256` 只记录于 R1 证据目录），避免自引用。
本报告 §1～§16 全文逐字节保持原样。

### 8.2 R0 ZooKeeper / Kafka 证据文件

```text
path=docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001/database/zookeeper-kafka-boundary.md
before_bytes=1632
before_sha256=108c9f8308c3725709b25afe1cc3c191c21f69098e2c495090e5cae1d9beea4a
after_bytes=5806
after_sha256=0d482b1d459628115d9a313fbd1436bdce262aee8ed5e6ee47df7310fe4f10eb
original_bytes_are_exact_prefix_of_new_file=true
deleted_bytes=0
deleted_lines=0
appended_bytes=4174
```

原始命令、返回值和原错误字段行全部保留为 R0 当时记录，未被删除、覆盖或伪造；
文末新增醒目的 R1 纠正段，写明 `NONE` 是错误结果字段并给出 §3.4 的全部正确字段。

**关于该错误字段字面量的分布（如实计数，共 14 处，逐一列出归属）**：
以下字面量 `formal_acceptance_task_initiated_zookeeper_node_operation_status=NONE`（**错误结果字段**，正确值为 `READ_ONLY_LS_ONE`）
在整个仓库中共出现 **14** 处，全部属于以下六类，**没有**任何一处是本 Feature 的当前直接事实：

| 类别 | 处数 | 位置 | 是否本轮改动 | 性质 |
|---|---|---|---|---|
| 「操作按钮 Loading 视觉稳定性」（ABLV）轮次历史记录 | 8 | 八份入口文档各 1 处（`docs/features/README.md`、`data-source-snapshot-status/` 下 `README.md`/`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md`/`API.md`/`DATABASE.md`） | 未改动 | 另一个功能轮次的历史事实，该轮任务确实未主动连接 ZooKeeper，`NONE` 对其成立 |
| ABLV 轮次报告 | 2 | `reports/...ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001.md`、`...-001-R1.md` | 未改动 | 同上 |
| ABLV 轮次证据 | 1 | `evidence/...ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001-R1/git/07-doc-consistency-check.txt` | 未改动 | 同上 |
| 本 Feature 的 R0 证据文件（§6.3 指定 append-only 对象） | 1 | `evidence/...QUERY-BUTTON...-001/database/zookeeper-kafka-boundary.md` | 以 append-only 追加纠正段，原行逐字节保留 | R0 当时的原始记录，由 §6.3 明确要求保留 |
| 本 R1 证据目录内的纠正记录（§6.4） | 1 | `evidence/...QUERY-BUTTON...-001-R1/database/01-zk-boundary-correction.txt` 第 4 节「被纠正的错误结果字段」 | 新增 | 为说明「被纠正的是什么」而引用该错误值，紧邻上一行明确标注其为**错误结果字段**，属纠正性引用，不是当前事实 |
| 本 R1 报告自身 | 1 | 本节本段的说明文字 | 新增 | 以「错误结果字段」明确标注该值错误，属纠正性引用，不是当前事实 |

因此，**本 Feature 的当前直接事实中该错误字段计数为 0**：
八份入口文档的 R1 记录段与历史限定语内均为 0 处，R1 证据目录内该字面量仅 1 处且只作为
「被纠正的错误值」被引用（见上表第五行）；
检查脚本自身也以字符串相邻拼接（`"…node_operation_status=""NONE"`）构造该字面量，
以免脚本成为额外的一处。
上表 ABLV 类的 11 处是**另一个功能轮次**的历史事实，不属于本次纠正范围，本轮未改动；
`zookeeper-kafka-boundary.md` 内那 1 处是 §6.3 要求保留的 R0 原始记录；
R1 纠正记录与本报告中各 1 处都是对被纠正错误的显式标注。

## 9. 八份入口文档的纠正

`docs/features/README.md` 与 `docs/features/data-source-snapshot-status/` 下
`README.md`/`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md`/`API.md`/`DATABASE.md`
共八份，按 R0 提示词 §6.1 做**最小同步**，每份两处元数据更新 + 一处历史限定语 + 一段追加记录：

1. 下一入口当前直接值改为
   `CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION`；
   R0 入口降级为「历史（2026-09-15 正式验收执行任务提交并推送后曾为本轮当前直接值）」；
2. R0 记录行中笼统表述「ZooKeeper 仅只读」后补一条历史限定语，写明它未反映
   R0 主动执行只读 `ls` 并违反 R0 提示词 ZooKeeper CLI/读取禁令，
   以及 `READ_ONLY_LS_ONE`、`VIOLATED_READ_PROHIBITION` 等正确口径；
   原文一字未删，只作**历史限定语**补充，未改写任何业务规则；
3. 文末追加 R1 记录段，写明 ChatGPT R0 复审结论、边界违反、正确字段、
   ZooKeeper 写入与 ACL 均为 `ZERO`、`feature_zookeeper_dependency=NONE`、
   `DSS-AC-114~118` 与 118 PASS 保留、仍待 ChatGPT 复审 R1 且未最终接受。

八份文档**不是** append-only 对象（R0 提示词 §6.2/§6.3 的 append-only 约束只针对 R0 报告与 R0 ZooKeeper 证据文件），
因此其当前事实与下一入口为**原位**更新；业务行、业务规则、契约正文与验收统计均未改动。
逐文档核对结果见 `../evidence/...-R1/docs/01-entry-doc-corrections.txt`。

## 10. 冻结区与白名单

零差异（`git diff 71368a0 -- ...` 为空）：

```text
frontend/**
backend/**
**/*.spec.ts **/*.test.ts（项目测试代码）
package.json package-lock.json pom.xml（依赖与锁文件）
**/*.sql 与数据库契约正文
```

未改动的既有内容：

- `DSS-REQ-001~091` 全部业务行逐字节不变；
- `DSS-AC-001~118` 完整验收业务行与状态列逐字节不变（本轮**未**把 `DSS-AC-114~118` 改回 `NOT_RUN`，
  也**未**改动其非状态列）；
- `DESIGN.md` §38、`UI.md` §32 业务规则正文逐字节不变；
- API 接口契约、DATABASE 表结构与只读契约正文逐字节不变；
- R0 浏览器证据、截图、`rects/*.json`、判定 JSON、测试记录、数据库证据零差异；
- 除 §6.2/§6.3 两份指定文件外的全部既有报告与证据零差异。

变更路径全部落在 R0 提示词 §12 白名单内（8 份入口文档 + R0 报告 + R0 ZooKeeper 证据文件 + 新增 R1 报告 + 新增 R1 证据目录）。

## 11. 强制校验

R1 提示词 §13 的 30 项检查由 `../evidence/...-R1/checks/check-r1.sh` 真实执行
（精确文本比较原语见同目录 `check-r1-lib.py`），失败即非零退出；
每项均同时校验期望数量或目标集合，不以空匹配伪造 PASS。
输出见 `../evidence/...-R1/checks/check-r1-output.txt`，本次真实结果为：

```text
checks_passed=86
checks_failed=0
failed_check_ids=
RESULT=PASS
shell_exit_code=0
```

30 项检查编号 `01`–`30` 全部出现（部分检查含 a/b/c 子项，共 86 条断言）。
脚本的失败能力另以负向控制证明：把某一条期望值改动后重跑，判出 `FAIL` 并非零退出
（`negative_control_exit_code=1`），故正式运行的 `RESULT=PASS` 不是恒真。

本任务自身的证据目录索引见 `../evidence/...-R1/README.md`。

## 12. Git

- 唯一提交，普通提交（非 amend / 非 rebase / 非 force），未绕过 Git hooks；
- push 前重新 fetch 并确认远程仍为 `71368a0a338209af564103291f5a51bc03e60bb4`；
- 仅普通 fast-forward push 到 `develop`；
- 推送后本地 HEAD == `origin/develop` == `git ls-remote`，ahead/behind `0/0`。

## 13. 当前状态与下一入口

```text
query_button_and_table_layout_stability_document_status=APPROVED
query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FINAL_ACCEPTANCE
query_button_and_table_layout_stability_code_review_status=APPROVED
query_button_and_table_layout_stability_human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER
query_button_and_table_layout_stability_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW
query_button_and_table_layout_stability_acceptance_execution_status=PASS
final_acceptance_status=NOT_EXECUTED
pending_user_review=NO
pending_user_confirmation_count=0
next_step=CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION
```

## 14. 本报告的边界

本报告**不**构成 `ACCEPTED`、`IMPLEMENTED_ACCEPTED` 或 `COMPLETED`；
**不**声称 ChatGPT 已批准 R1；**不**声称项目负责人已作出最终接受决定；
**不**构成最终接受收口。本轮只如实纠正 ZooKeeper 边界与结果事实，保留 R0 的业务验收结论。

下一入口：

```text
CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION
```
