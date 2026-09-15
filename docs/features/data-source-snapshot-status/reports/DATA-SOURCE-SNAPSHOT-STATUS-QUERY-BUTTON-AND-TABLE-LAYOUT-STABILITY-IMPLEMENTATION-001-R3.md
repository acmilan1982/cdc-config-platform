# 查询按钮与表格布局稳定性实现 R3 证据脚本纠正报告

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3`
- 任务性质：**纯文档与证据工具的极小定向纠正**（修复 R2 已提交证据脚本的可复现性缺陷）
- 分支：`develop`
- 基准提交：`09e268f905d083d6237b4dfc446198b4c5157661`
- 隔离 worktree：`/agent/dss-query-button-table-layout-implementation-001-r3`（detached，从基准创建）
- 证据目录：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3/`
- 本报告提及的提交结果 Commit ID 记录在任务结果块中，不写入本报告自身（避免自引用）。

## 1. 任务边界

R3 只做四件事：

1. 修复 R2 已提交证据脚本 `...-R2/scripts/run-checks.py` 在 `--staged` 模式下的路径截取缺陷；
2. 建立调用**同一套共享判定逻辑**的负向自测，证明合法路径被保留、越界路径被真实拒绝；
3. 对 R2 报告与 R2 证据 README 做 **append-only** 历史性纠正，并限定其中过强的可复现性声明；
4. 同步八份入口文档的本轮当前状态与下一入口，追加一条 R3 记录。

R3 **不**修改业务代码、测试、CSS、契约或验收结论，**不**执行任何新增验收。

## 2. ChatGPT R2 复审结论

```text
chatgpt_r2_review_status=CHANGES_REQUIRED_EVIDENCE_SCRIPT_REPRODUCIBILITY_ONLY
r2_document_fact_separation_review_status=APPROVED
r2_business_implementation_status=PRESERVED_APPROVED
r2_evidence_script_reproducibility_status=CHANGES_REQUIRED
```

即：R2 的**文档事实分层纠正**与**业务实现结论**均被认可且不予推翻；
唯一待处理项是 R2 已提交证据脚本在 `--staged` 模式下无法真实复跑。

## 3. 缺陷的真实根因

`git status --porcelain` 每行是 `XY <path>`：2 个状态字符 + 1 个空格 + 路径，
因此 `ln[3:]` 对 porcelain 是正确的（脚本中第 152 行的 porcelain 用法是对的）。
但 `git diff --cached --name-only` 每行**就是裸路径**，没有前缀。R2 已提交脚本
把 porcelain 的解析方式复用到了裸路径输出上：

```python
# ...-R2/scripts/run-checks.py 第 434 行（修复前，R2 已提交字节）
stg = [ln[3:].strip() for ln in git('diff', '--cached', '--name-only').stdout.splitlines() if ln.strip()]
#      ^^^^^^^^ 对裸路径输出无条件砍掉前 3 个字符
```

后果：每个已暂存路径都被截成 `s/features/...`，白名单比对必然失败，
于是**所有合法路径都被误报为越界**。这是**解析对象错配**，
不是白名单规则错误，也不是"R2 提交范围不合规"。

## 4. 修复前的真实复现结果

### 4.1 抛弃式仓库复现（不触碰真实 index）

为满足"不得污染真实 index"的约束，复现使用 `/tmp` 下的抛弃式仓库：
内容 = 基准 `docs/` 目录副本 + 一个额外暂存的合法白名单路径探针。

- 真实 git 输出（裸路径、未截断）：
  `docs/features/...-R2/NEGATIVE-CONTROL-probe-DO-NOT-USE-AS-BUSINESS-EVIDENCE.txt`
- 修复前解析结果：`s/features/...-R2/NEGATIVE-CONTROL-probe-...txt`（丢失前 3 字符）
- 修复后解析结果：完整路径
- 修复前脚本真实退出码：`1`（§10-27 `staged=1 outside_whitelist=1`，把合法路径判为越界）

记录见 `records/01-prefix-defect-replay-throwaway-repo.txt`，
驱动脚本见 `records/01b-repro-driver-NEGATIVE-CONTROL-DO-NOT-USE-AS-BUSINESS-EVIDENCE.sh`。
该记录与其中探针文件标记 `NEGATIVE-CONTROL` / `DO-NOT-USE-AS-BUSINESS-EVIDENCE`，
**不构成任何业务失败证据**。

### 4.2 真实已暂存候选上的 A/B

在同一份**真实** Git index（R3 隔离 worktree，已暂存 29 条合法路径）上：

| 脚本 | §10-27 / §14-30 结果 | 真实退出码 |
|---|---|---|
| 修复前（R2 已提交字节 `cc02ff85…`） | `staged=29 outside_whitelist=29`，全部显示为 `s/features/...` | `1` |
| 修复后（R3，`d2601323…`） | `staged=29 outside_whitelist=0`，示例为完整路径 | `0` |

记录见 `records/03b-prefix-defect-on-real-index.txt` 与 `records/03-post-fix-staged-mode.txt`。

## 5. 修复内容与共享判定逻辑

修复后的脚本把判定整理为**无副作用模块**：导入时不执行任何检查，
所有逻辑位于 `main(argv)`；因此负向自测可以安全地 import 并直接调用真实函数。

三个共享纯函数：

- `parse_path_lines(text)` — 解析裸路径逐行输出（`git diff --cached --name-only`）；
- `parse_porcelain(text)` — 解析 `git status --porcelain`；
- `judge_paths(paths, whitelist=None, prefixes=None)` — **唯一**白名单判定入口。

普通模式、`--staged` 模式、负向自测的 `--verify-paths` 入口**共用**上述函数，
不存在第二套实现。失败产生真实非零退出码，成功返回真实 `0`；
异常不会被吞掉后返回 `0`；输出显式打印模式、判定路径数、失败数、失败路径与最终结果。

同时修正两处与本次修复同源的证据脚本自身的判定精度问题（不改判定强度，
均把实际命中一并打印，不做隐藏）：

- 项目测试文件零差异判定：`*test*` 通配会命中 `docs/**` 下的文档与证据工具文件名，
  R3 负向自测脚本 `r3-negative-control-self-test.py` 因此被误判。
  现仅在项目源码树内判零差异，并同时打印被排除的 `docs/**` 路径。
  前端全部测试文件已由 `git diff BASE -- frontend` 零差异覆盖（另见 `records/06-freeze-zones.txt`）。
- 项目测试文件之外，`run-checks.py` 的 `SECRET` 正则与负向自测样例均按原样保留。

## 6. 修复后的真实执行结果

| 模式 | 命令 | 判定对象 | 真实退出码 |
|---|---|---|---|
| 普通模式 | `python3 <R2脚本>` | 工作区相对基准的变更集 | `0` |
| `--staged` | `python3 <R2脚本> --staged` | index 中实际暂存内容 | `0` |
| `--verify-paths` | `python3 <R2脚本> --verify-paths <清单>` | 给定路径清单 | 越界时为 `1` |

两种模式的**判定对象不同**（工作区变更集 vs 暂存内容），但共用同一套 `parse`/`judge` 函数。
记录见 `records/02-post-fix-normal-mode.txt`、`records/03-post-fix-staged-mode.txt`。

## 7. 共享判定负向自测

`checks/r3-negative-control-self-test.py`（标记 `NEGATIVE-CONTROL` /
`DO-NOT-USE-AS-BUSINESS-EVIDENCE`，页面无关、服务无关）：

1. **正向**：`parse_path_lines('docs/features/data-source-snapshot-status/README.md')`
   必须等于自身（完整、未截断）——通过；
2. **正向**：白名单内路径与 R3 证据前缀路径必须**不**被 `judge_paths` 拒绝——通过；
3. **负向**：合成越界路径 `frontend/src/unauthorized-negative-control.vue`
   必须被 `judge_paths` 拒绝——通过；
4. **负向（真实子进程）**：`run-checks.py --verify-paths <临时清单>`
   真实退出码 `1`，stdout 明确包含 `OUTSIDE_WHITELIST` 与 `final_result=FAIL`——通过；
5. **不污染**：自测前后 Git 索引与工作区指纹一致，
   真实项目内**未**创建/修改/暂存任何 `frontend/**` 文件——通过。

合成样例仅写入 `/tmp` 下临时清单文件，自测结束即清理；
该自测及其输出**不构成任何业务失败证据**。
记录见 `records/04-negative-control-shared-judgement.txt`。

## 8. append-only 纠正

### 8.1 R2 报告

`reports/...-R2.md` 严格 append-only：基准字节为当前内容的完整前缀，
新增 46 行、删除 0 行、基准字节 18023 → 当前 22729。
追加章节“ChatGPT R2 复审与 R3 证据脚本纠正记录”如实写明：

- R2 **已提交脚本副本无法通过 `--staged` 复跑**（真实退出码 `1`）；
- **区分两件不同事实**：
  `r2_changed_path_whitelist_independent_recheck_status=PASS`
  （R2 实际提交范围经独立检查合规）与
  `r2_committed_evidence_script_staged_replay_status=FAIL_KNOWN_PARSER_DEFECT`
  （R2 已提交脚本自身的可复现性失败）；
- **不得**将前者写成“R2 已提交脚本自身可复跑成功”；
- R3 修复后的普通模式 / `--staged` / 负向控制的真实退出码；
- R2 的事实分层结论与业务实现结论**不被撤销**；
- R3 **未**重跑业务测试、浏览器复核或正式验收。

### 8.2 R2 证据 README

`evidence/...-R2/README.md` 在基准中**不存在**（基准字节 0），
故 append-only 以“基准字节 0 为完整前缀”成立。README 中：

- 明确记载该已知缺陷；
- 记载 R3 的修复位置与复跑方式；
- 记载 R3 证据入口；
- 把此前过强的可复现性声明显式限定为
  “R2 提交时的不准确可复现性声明，已由 R3 纠正”。

### 8.3 基准/追加哈希与字节前缀证明

R2 报告与 R2 证据 README 的**基准 SHA-256、当前 SHA-256、前缀关系与追加字节数**
存放在独立证据文件 `records/05-append-only-proofs.txt`，
**不写入 R2 报告自身**。

### 8.4 其余 R2 证据

除 `README.md` 与 `scripts/run-checks.py` 外，R2 证据目录零差异；
R0/R1 报告与证据零差异（见 `records/06-freeze-zones.txt`）。

## 9. 八份入口文档同步

`docs/features/README.md` 与
`docs/features/data-source-snapshot-status/{README,REQUIREMENTS,ACCEPTANCE,DESIGN,UI,API,DATABASE}.md`：

- 仅更新本轮当前状态与下一入口；追加一条 R3 证据脚本纠正记录；
- 当前下一入口统一为
  `CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R3_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`；
- R2 入口与 R1 入口保留为带日期、带任务编号、
  注明“已由 R3 接续 / 已由 R3 纠正”的**历史**事实；
- 未修改任何需求、验收、设计、UI、API、DATABASE 业务内容。

当前状态令牌（八份文档一致，未放宽）：

```text
query_button_and_table_layout_stability_document_status=APPROVED
query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW
query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW
query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_not_run_count=5
pending_user_review=NO
pending_user_confirmation_count=0
```

## 10. 冻结区与契约零差异

相对基准 `09e268f905d083d6237b4dfc446198b4c5157661`：

- `frontend/**`、`backend/**`：零差异（0 个文件）；
- §10 点名的四个前端文件（`MainLayout.vue`、`MainLayout.spec.ts`、
  `DataSourceSnapshotQueryBar.vue`、`DataSourceSnapshotQueryBar.spec.ts`）：`diff_lines=0`；
- `package.json`、`package-lock.json`、`pnpm-lock.yaml`、`yarn.lock`、
  `*.sql`、`*config*`：零差异；
- 依赖、锁文件、SQL、配置：零差异；
- 需求行 `DSS-REQ-001~091`：91 行、集合一致、业务行逐字节不变；
- 验收行 `DSS-AC-001~118`：118 行、集合一致、业务行与状态列逐字节不变；
- 统计：`PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 5`；
  `DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`，**未**把 118 条写成全 PASS；
- DESIGN §14.2/§14.3 追溯映射：`REQ 91/91`、`AC 118/118`，映射块逐字节不变；
- DESIGN §38、UI §32、API/DATABASE 契约正文：反向应用声明式编辑后与基准逐字节一致
  （`region_restored_equals_base=True`）；
- 查询按钮 62px、重置 62px、刷新 110px、路由作用域稳定滚动条留白方案、
  “共 N 条不是直接根因”结论：均不变；
- ACCEPTANCE.md 既有的非升序排列：**未调整**。

证明见 `records/06-freeze-zones.txt`。

## 11. 未执行的验证（显式声明）

本任务**未**执行，也**不**声称执行：

- 前端构建、后端构建、前端单元测试、类型检查、lint；
- 浏览器严格几何验收、页面人工视觉交互复核；
- `DSS-AC-114~118` 共 5 条新增验收、正式验收、最终接受收口；
- 数据库访问或写入、ZooKeeper 主动访问或写入、Kafka 访问；
- 5173 / 8080 服务的启动、停止、重启或替换（既有服务未被触碰）；
- 任何 worktree 的清理、重置、切换或删除。

证据脚本复跑**不等于**业务验收通过；实现完成**不等于**代码复审通过、
**不等于**新增验收已执行、**不等于**最终接受收口。

## 12. Git 提交与推送

- 只创建**一个**普通提交，无 amend、无 force push、无历史改写；
- 推送为普通 fast-forward；使用前重新核验远程基准；
- 任务开始时既有 55 个 worktree 与主 worktree，以及 5173/8080 服务，
  在提交后再次比对，要求零漂移。

## 13. 凭据与文档卫生

- 变更文件内无凭据、口令、令牌、Cookie、私钥或完整连接串
  （`records/08-credential-scan.txt`，`secret_hits=0`）；
- 证据中被扫描脚本源码正则字面量的回显已脱敏为 `<REDACTED-...>` 占位符，
  并显式标注该脱敏动作；
- `git diff --check` 与 `git diff --cached --check` 退出码均为 `0`；
- 本任务新增行无行尾空白；
- 项目文档校验工具不存在，如实记为 `NOT_AVAILABLE`。

## 14. ChatGPT R3 复审与 R4 结果事实纠正记录（append-only 追加，2026-09-15）

> 本节由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4` 在文末追加。基准 `64004ca062a92ab40e07350e231d97befe6f496c` 中本文件的全部原始字节构成修改后文件的**完整字节前缀**；未删除、未替换、未移动、未原位编辑任何既有内容。

### 14.1 ChatGPT 从远程 Git 的 R3 复审结论

```text
chatgpt_r3_review_status=CHANGES_REQUIRED_TWO_RESULT_FACT_CORRECTIONS_ONLY
r3_evidence_script_correction_review_status=APPROVED
r3_business_implementation_status=PRESERVED_APPROVED
```

R3 对 `scripts/run-checks.py` 的 `--staged` 路径解析修复与共享判定负向自测**被认可且不被推翻**，本轮不得再次修改该脚本：`r3_evidence_script_correction_status=PASS`、`r3_evidence_script_reproducibility_status=PASS`、`r3_evidence_script_change_status=ZERO`。

### 14.2 纠正一：62/62/110px 是固定宽度，不是高度

本报告 §10 末段的「查询按钮 62px、重置 62px、刷新 110px」是**固定宽度**口径，正确字段名为 `query_button_fixed_width_px=62`、`reset_button_fixed_width_px=62`、`refresh_button_fixed_width_px=110`。上述原文属历史记录，按 append-only 规则**不改写**；本节作为其唯一定性说明。R3 结果输出中如以高度命名同一批数值，属“R3 结果输出中的错误字段名，已由 R4 纠正”，不构成当前事实，也不是本报告正文的表述。

R4 **未**建立、**未**测量、**未**修改任何按钮高度基线：`button_height_baseline_status=NOT_DEFINED_NOT_CHANGED`；基准提交中未限定高度字段的当前事实计数为 `0`；`frontend/**` 零差异，未重新测量按钮。

### 14.3 纠正二：R2 证据 README 的真实 Git 对象状态

本报告 §8.2 把 `evidence/...-R2/README.md` 记为「在基准中**不存在**（基准字节 0），故 append-only 以‘基准字节 0 为完整前缀’成立」。该表述与 Git 对象事实一致的部分是「不存在」，但其 append-only 措辞不精确，容易与「存在一个被跟踪的 0 字节文件」混淆。按 R4 提示词 §5.4，R4 以 Git 对象机器判定选取唯一分支：

```text
r2_result_commit_id=09e268f905d083d6237b4dfc446198b4c5157661
r2_evidence_readme_git_object_status=NOT_PRESENT
r2_evidence_readme_cat_file_exit_code=128
r2_evidence_readme_base_blob_size_bytes=NOT_APPLICABLE
r2_evidence_readme_base_status=NOT_PRESENT_AT_R2_RESULT_COMMIT
r2_evidence_readme_creation_status=CREATED_RETROSPECTIVELY_BY_R3
r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE
r2_evidence_readme_ambiguous_zero_byte_claim_count=0
```

判定命令与真实输出见 R4 证据目录 `records/02-r2-readme-git-object-judgement.txt`（含原始命令、标准输出、标准错误与真实退出码）。结论：R3 创建的是位于 R2 证据目录中的**R3 回溯说明文件**，不是对 R2 已存在 README 的追加；“基准 0 字节为完整前缀”只是空前缀性质，不能作为 R2 历史文件保留证明；该文件无需删除或移动，只纠正其来源与性质描述。

### 14.4 冻结与未执行范围

R4 相对 64004ca 的冻结结论与 R3 一致：需求 `DSS-REQ-001~091`（91 行）业务行、验收 `DSS-AC-001~118`（118 行）完整业务行与状态列、`DESIGN.md` §14.2/§14.3 映射行、`DESIGN.md` §38、`UI.md` §32、API/DATABASE 契约正文逐字节不变；`frontend/**`、`backend/**`、项目测试、SQL、配置、依赖与锁文件零差异；R2 `run-checks.py` 与基准逐字节不变；`DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`。

R4 **未**重跑任何业务测试、**未**执行前端或后端构建、**未**做浏览器几何验证、**未**执行 `DSS-AC-114~118`、**未**开始正式验收、**未**访问数据库/ZooKeeper/Kafka、**未**启停 `5173`/`8080` 服务、**未**清理任何 worktree。文档事实纠正**不等于**代码复审通过、**不等于**新增验收已执行、**不等于**最终接受收口。
