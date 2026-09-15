# R2 证据目录说明（R3 追加）

本 README 由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3` 创建并写入。基准 `09e268f905d083d6237b4dfc446198b4c5157661` 中本路径**不存在**，因此基准字节为 0 字节、删除字节与删除行均为 `0`，append-only 前缀性质平凡成立；R2 当时没有任何本文件内容被覆盖或篡改。

## 1. R2 证据目录用途

本目录保存 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2`（R2 定向纠正任务）的证据：§10 提交前校验输出、状态冲突扫描、R1 报告 append-only 证明、worktree 与 Git 现场快照，以及可复跑的校验脚本。

## 2. 已知缺陷（R3 记录）

- **缺陷位置**：`scripts/run-checks.py` 的 `--staged` 分支；
- **缺陷写法**：`stg = [ln[3:].strip() for ln in git('diff', '--cached', '--name-only').stdout.splitlines() if ln.strip()]`；
- **根因**：`git diff --cached --name-only` 输出**裸路径**，不含 `XY ` 状态前缀，却被无条件截断前 3 个字符，于是每个合法白名单路径都变成残缺路径并被误判为越界；
- **影响**：该副本提交后复跑 `--staged` 必然误报白名单失败并返回非零退出码；（R2 提交时的不准确可复现性声明，已由 R3 纠正）
- **不影响**：R2 的实际提交范围（21 条路径）经独立检查仍然合规。

## 3. R3 修复位置

同一路径 `scripts/run-checks.py` 已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3` 修复：路径解析与白名单判定收敛为同一套共享纯函数 `parse_path_lines()` / `judge_paths()`，普通模式与 `--staged` 模式共用；`git status --porcelain` 的 `XY ` 前缀改由独立的 `parse_porcelain()` 处理；新增 `--verify-paths <路径清单>` 负向自测入口。修复后的真实退出码见 R3 证据目录。

## 4. 复跑方式

```bash
# 普通模式（校验工作区相对基准的差异）
python3 docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/run-checks.py

# 暂存模式（追加校验暂存区路径白名单）
python3 docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/run-checks.py --staged

# 负向自测入口（白名单外路径必须导致非零退出码）
python3 docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/run-checks.py --verify-paths <路径清单文件>
```

## 5. R3 证据入口

R3 证据目录：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3/`（共享判定负向自测、修复前复跑、修复后普通/`--staged` 复跑、append-only 与冻结区记录）。

报告：`docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3.md`。

## 6. R4 对本文基准口径的纠正（append-only 追加，2026-09-15）

> 本节由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4` 在文末追加。基准 `64004ca062a92ab40e07350e231d97befe6f496c` 中本文件的全部原始字节构成修改后文件的**完整字节前缀**；未删除、未替换、未移动、未原位编辑任何既有内容。

第 1 节原文写「基准 `09e268f905d083d6237b4dfc446198b4c5157661` 中本路径**不存在**，因此基准字节为 0 字节 …… append-only 前缀性质平凡成立」。其中「不存在」与 Git 对象事实一致，但「基准 0 字节」的写法不足以区分「R2 结果提交中根本不存在该文件」与「R2 结果提交中存在一个被 Git 跟踪的 0 字节文件」。R4 按提示词 §5 以 Git 对象机器判定选取唯一分支：

```text
r2_evidence_readme_git_object_status=NOT_PRESENT
r2_evidence_readme_cat_file_exit_code=128
r2_evidence_readme_base_blob_size_bytes=NOT_APPLICABLE
r2_evidence_readme_base_status=NOT_PRESENT_AT_R2_RESULT_COMMIT
r2_evidence_readme_creation_status=CREATED_RETROSPECTIVELY_BY_R3
r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE
```

即：本文件在 R2 结果提交 `09e268f905d083d6237b4dfc446198b4c5157661` 中**不存在**，由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3` 在 R3 结果提交 `64004ca062a92ab40e07350e231d97befe6f496c` 中创建。它是位于 R2 证据目录中的 **R3 回溯说明文件**，不是对 R2 已存在 README 的追加；其 `append-only` 应为 `NOT_APPLICABLE_NO_BASE_FILE`，而非 PASS。本文件无需删除或移动，仅纠正来源与性质描述。

判定命令与真实输出（含原始标准输出、标准错误与退出码）见 `docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4/records/02-r2-readme-git-object-judgement.txt`。
