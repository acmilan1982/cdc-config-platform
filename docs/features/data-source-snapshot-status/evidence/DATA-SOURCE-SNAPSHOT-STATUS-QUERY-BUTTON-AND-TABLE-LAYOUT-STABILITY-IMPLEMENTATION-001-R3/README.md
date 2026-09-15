# R3 证据脚本可复现性纠正 — 证据目录

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3`
- 基准提交：`09e268f905d083d6237b4dfc446198b4c5157661`（`develop`）
- 隔离 worktree：`/agent/dss-query-button-table-layout-implementation-001-r3`（detached）
- 报告：`docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3.md`
- 性质：**纯文档与证据工具的极小定向纠正**。本目录不产生任何业务结论，不构成验收。

## 1. 本目录要证明什么

R2 已提交的证据脚本 `...-R2/scripts/run-checks.py` 在 `--staged` 模式下存在一个**路径截取缺陷**：
它用 `git status --porcelain` 的解析方式（丢弃前 3 个字符的行前缀）去解析
`git diff --cached --name-only` 的**裸路径**输出，导致每个合法路径都被砍掉前 3 个字符，
白名单判定随之把所有已暂存路径误报为越界。R3 只做两件事：

1. 修复该脚本，使其在普通模式与 `--staged` 模式下都能真实复跑；
2. 用**共享判定逻辑**的负向自测证明：合法路径被保留、越界路径被真实拒绝。

本目录**不**声称 R3 重跑了业务测试、浏览器复核或正式验收。

## 2. 目录结构

| 路径 | 内容 |
|---|---|
| `checks/r3-negative-control-self-test.py` | 共享判定负向自测（真实子进程非零退出码） |
| `scripts/r3-docs-correction.py` | 八份入口文档 + R2 报告/README 的声明式编辑表（幂等、基准派生） |
| `records/01-prefix-defect-replay-throwaway-repo.txt` | 缺陷复现（抛弃式仓库，未触碰真实 index） |
| `records/01b-repro-driver-NEGATIVE-CONTROL-DO-NOT-USE-AS-BUSINESS-EVIDENCE.sh` | 上述复现的驱动脚本 |
| `records/02-post-fix-normal-mode.txt` | 修复后普通模式真实输出与退出码 |
| `records/03-post-fix-staged-mode.txt` | 修复后 `--staged` 模式真实输出与退出码 |
| `records/03b-prefix-defect-on-real-index.txt` | 同一已暂存候选上，修复前 vs 修复后脚本的真实 A/B |
| `records/04-negative-control-shared-judgement.txt` | 负向自测真实输出与退出码 |
| `records/05-append-only-proofs.txt` | R2 报告 / R2 证据 README 的 append-only 证明 |
| `records/06-freeze-zones.txt` | 冻结区（前端/后端/测试/依赖/契约）零差异证明 |
| `records/07-diff-check.txt` | `git diff --check`、`git diff --cached --check` 结果 |
| `records/08-credential-scan.txt` | 凭据扫描结果 |
| `records/09-git-scope.txt` | Git 现场、变更范围与远程基准 |
| `records/worktrees-at-start.txt` | 任务开始时全部既有 worktree 快照（55 条） |
| `records/services-at-start.txt` | 任务开始时 5173 / 8080 监听进程快照（只证明未被触碰） |

## 3. 缺陷根因

`git status --porcelain` 每行是 `XY <path>`（含 2 字符状态 + 1 空格前缀），
所以 `ln[3:].strip()` 对 porcelain 是正确的；而 `git diff --cached --name-only`
每行**就是裸路径**，没有前缀。R2 已提交脚本把两者混用：

```python
# ...-R2/scripts/run-checks.py 第 434 行（修复前）
stg = [ln[3:].strip() for ln in git('diff', '--cached', '--name-only').stdout.splitlines() if ln.strip()]
```

于是 `docs/features/.../README.md` 被解析成 `s/features/.../README.md`，
不再匹配白名单，被误判为越界。**这是解析对象错配，不是白名单规则错误。**

## 4. R3 修复

修复后的脚本把判定拆成无副作用模块 + 三个共享纯函数：

- `parse_path_lines(text)`：解析裸路径逐行输出（`git diff --cached --name-only`）；
- `parse_porcelain(text)`：解析 `git status --porcelain`；
- `judge_paths(paths, whitelist=None, prefixes=None)`：**唯一**的白名单判定入口。

普通模式、`--staged` 模式与负向自测的 `--verify-paths` 入口**共用**同一套函数；
判定失败返回真实非零退出码，成功返回真实 0；异常不会被吞掉后返回 0；
输出显式打印模式、判定路径数、失败数、失败路径与最终结果。

## 5. 复跑方式

```bash
cd /agent/dss-query-button-table-layout-implementation-001-r3

# 普通模式（对当前 worktree 的变更集判定）
python3 docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/run-checks.py

# 暂存模式（对 index 中实际暂存内容判定；无位置参数，脚本自解析路径）
python3 docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/run-checks.py --staged

# 负向自测（共享判定 + 真实子进程非零退出码）
python3 docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3/checks/r3-negative-control-self-test.py

# 路径判定入口（供无头复现，退出码=判定结果）
python3 .../-R2/scripts/run-checks.py --verify-paths <路径清单文件>
```

普通模式与 `--staged` 模式**判定对象不同**：普通模式判定工作区相对基准的变更集，
`--staged` 模式判定 index 中实际暂存的内容。二者共用同一判定函数，但输入来源不同。

## 6. 未执行的验证（显式声明）

本任务**未**执行：前端/后端构建、前端单元测试、浏览器严格几何验收、
`DSS-AC-114~118` 新增验收、正式验收、数据库读写、ZooKeeper 读写、Kafka 访问、
5173/8080 服务的启停或替换、任何 worktree 的清理。
证据脚本复跑**不等于**业务验收通过。

## 7. 负向自测的样例性质

`checks/r3-negative-control-self-test.py` 使用的越界路径
`frontend/src/unauthorized-negative-control.vue` 是**合成样例**，
仅写入 `/tmp` 下的临时清单文件，**不会**在真实项目内创建、修改或暂存任何
`frontend/**` 文件；自测前后会比对索引与工作区指纹并在文件中标记
`NEGATIVE-CONTROL` 与 `DO-NOT-USE-AS-BUSINESS-EVIDENCE`。
相关输出**不构成任何业务失败证据**。
