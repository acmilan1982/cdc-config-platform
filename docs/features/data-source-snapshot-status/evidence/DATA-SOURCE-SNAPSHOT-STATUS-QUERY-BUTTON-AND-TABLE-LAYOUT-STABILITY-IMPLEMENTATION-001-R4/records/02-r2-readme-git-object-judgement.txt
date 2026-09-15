# §5.1 R2 证据 README 在 R2 结果提交中是否存在 — Git 对象判定
# 判定对象=docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/README.md
# R2 结果提交=09e268f905d083d6237b4dfc446198b4c5157661
# 基准提交=64004ca062a92ab40e07350e231d97befe6f496c

## A. git cat-file -e（非 0 = 该提交树中无此路径）
fatal: path 'docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/README.md' exists on disk, but not in '09e268f905d083d6237b4dfc446198b4c5157661'
cat_file_e_exit_code=128

## B. git ls-tree -r --name-only（空 = 该提交树中无此路径）
$ git ls-tree -r --name-only 09e268f9... -- docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/README.md | wc -l
0

## C. git diff-tree 相对基准（A = 在基准提交中新增）
A	docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/README.md

## D. git log --diff-filter=A（该路径的全部新增提交）
64004ca062a92ab40e07350e231d97befe6f496c docs(source-snapshot): make R2 scope evidence replayable [DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3]

## E. R2 结果提交中该证据目录的实际树内容（无 README.md）
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/checks/01-section10-checks.txt
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/checks/02-current-status-conflicts.txt
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/records/git-state.txt
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/records/r1-report-append-only-proof.txt
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/records/worktrees-at-start.txt
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/conflicts-scan.py
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/r2-docs-correction.py
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/r2-r1-report-append.py
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/run-all-evidence.sh
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/run-checks.py
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/scripts/verify-r1-report-append-only.py

## F. 基准提交中该文件的大小（R3 创建后）
  base_blob_size_bytes=3205

## 判定（Branch A：R2 结果提交中不存在）
r2_evidence_readme_git_object_status=NOT_PRESENT
r2_evidence_readme_cat_file_exit_code=128
r2_evidence_readme_base_blob_size_bytes=NOT_APPLICABLE
r2_evidence_readme_base_status=NOT_PRESENT_AT_R2_RESULT_COMMIT
r2_evidence_readme_creation_status=CREATED_RETROSPECTIVELY_BY_R3
r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE

# 三个信号互补：cat-file -e 非 0 排除了『存在但为空』；ls-tree 空确认树中无条目；
# diff-tree=A 确认该文件是在基准提交（R3）中新增，而非 R2 结果提交中存在的 0 字节文件。
