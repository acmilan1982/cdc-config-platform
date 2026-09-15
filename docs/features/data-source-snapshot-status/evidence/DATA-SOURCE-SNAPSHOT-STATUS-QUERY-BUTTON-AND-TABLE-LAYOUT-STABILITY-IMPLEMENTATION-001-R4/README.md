# R4 结果事实纠正 — 证据目录

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4`
- 基准提交：`64004ca062a92ab40e07350e231d97befe6f496c`（`develop`）
- 隔离 worktree：`/agent/dss-query-button-table-layout-implementation-001-r4`（detached）
- 报告：`docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4.md`
- 性质：**纯文档的极小定向结果事实纠正**。本目录不产生任何业务结论，不构成验收。

## 1. 本目录要证明什么

ChatGPT 对 R3 的复审结论为 `CHANGES_REQUIRED_TWO_RESULT_FACT_CORRECTIONS_ONLY`，仅剩两处结果事实：

1. **纠正一**：三个按钮的 `62/62/110px` 是**固定宽度**，不是高度。正确字段口径为
   `query_button_fixed_width_px=62`、`reset_button_fixed_width_px=62`、
   `refresh_button_fixed_width_px=110`。R4 不建立、不测量、不修改任何按钮高度基线。
2. **纠正二**：机器判定 R2 证据 README 在 R2 结果提交
   `09e268f905d083d6237b4dfc446198b4c5157661` 中「不存在」还是「存在但 0 字节」，
   并据此清除 R3 侧「基准 0 字节即 append-only PASS」的模糊口径。

R3 对 `run-checks.py --staged` 的修复与可复现性证明已获接受，本轮**不修改**该脚本。

本目录**不**声称 R4 运行了业务测试、浏览器复核或正式验收。

## 2. 目录结构

| 路径 | 内容 |
|---|---|
| `checks/r4-verify.py` | §14 强制校验（46 项，真实非零退出码，不吞异常） |
| `scripts/r4-docs-correction.py` | 八份入口文档 + 三份历史文件的声明式编辑表（幂等、基准派生） |
| `scripts/r4-generate-records.sh` | 本目录 `records/*.txt` 的生成脚本 |
| `records/01-declared-edit-table-and-idempotent-rerun.txt` | 编辑表与幂等复跑（再次运行 `changed_files=0`） |
| `records/02-r2-readme-git-object-judgement.txt` | §5.1 Git 对象存在性与 blob 大小判定原始记录 |
| `records/03-height-width-field-scan.txt` | 宽度/高度字段口径扫描 |
| `records/04-append-only-and-reverse-apply.txt` | 历史文件 append-only 前缀 + 八份入口文档反向应用证明 |
| `records/05-freeze-zones.txt` | 冻结区零差异证明 |
| `records/06-rows-and-status-counts.txt` | 需求/验收业务行与状态计数 |
| `records/07-diff-check.txt` | `git diff --check`、`git diff --cached --check` 与行尾空白 |
| `records/08-whitelist.txt` | 变更路径白名单判定 |
| `records/09-credential-scan.txt` | 凭据扫描结果 |
| `records/10-git-scope.txt` | Git 现场、远程基准与 hooks 状态 |
| `records/11-r4-verify-full-output.txt` | §14 校验脚本完整输出与退出码 |
| `records/worktrees-at-start.txt` / `records/worktrees-at-end.txt` | 任务开始/结束时全部既有 worktree 快照 |
| `records/services-at-start.txt` | 任务开始/结束时 `5173`/`8080` 监听进程快照（只证明未被触碰） |

## 3. 纠正一的判定方式

两个互补证据：

- **否定证据**：全仓库被跟踪文本中不存在 `*_height_px` 形式的按钮高度字段名；
  未限定的 `query_button_height_px=62`、`reset_button_height_px=62`、
  `refresh_button_height_px=110` 当前事实计数均为 `0`。
- **肯定证据**：三个正确宽度字段名在当前事实中全部存在；
  「高度」邻近 62/110 的命中全部为 R4 自身的显式否定表述或既有的「查询栏整体高度」表述。

结论：`current_wrong_height_field_conflict_count=0`，
`button_height_baseline_status=NOT_DEFINED_NOT_CHANGED`。
本轮为使口径唯一，明确写下正确字段名；未删改任何既有原始记录。

## 4. 纠正二的判定方式（三个互补信号）

```text
git cat-file -e 09e268f9:<path>                => 退出码 128（该提交树中无此路径）
git ls-tree -r --name-only 09e268f9 -- <path>  => 0 行
git diff-tree --name-status -r 64004ca -- <path> => A<tab><path>（在 R3 提交中新增）
```

`cat-file -e` 非 0 排除「存在但为空」；`ls-tree` 为空确认树中无条目；
`diff-tree=A` 确认该文件由 R3 新增。故采用 **§5.2 分支 A**：

```text
r2_evidence_readme_git_object_status=NOT_PRESENT
r2_evidence_readme_cat_file_exit_code=128
r2_evidence_readme_base_blob_size_bytes=NOT_APPLICABLE
r2_evidence_readme_base_status=NOT_PRESENT_AT_R2_RESULT_COMMIT
r2_evidence_readme_creation_status=CREATED_RETROSPECTIVELY_BY_R3
r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE
```

§5.3 分支 B（0 字节跟踪文件）不成立。该 README 无需删除或移动，仅纠正来源与性质描述。

## 5. 反向应用证明

`checks/r4-verify.py` 对八份入口文档逐一**逆向撤销** R4 声明的全部编辑
（去掉文末 R4 记录块、删除 R3 历史链插入、把 B1 新块还原为基准原块、把 R4 令牌换回 R3 令牌、
恢复基准的行尾换行），要求结果与基准 blob **逐字节完全相等**。

这同时证明两件事：

- **只改了声明过的东西**（任何未声明的改动都会导致还原后与基准不等）；
- **声明的都改了**（任何漏掉的声明编辑都会导致计数校验失败）。

## 6. 复跑方式

```bash
cd /agent/dss-query-button-table-layout-implementation-001-r4
R4E=docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4

# 声明式文档纠正（幂等；再次运行须 changed_files=0）
python3 $R4E/scripts/r4-docs-correction.py

# §14 强制校验（46 项；退出码=总判定结果）
python3 $R4E/checks/r4-verify.py

# 重新生成 records/*.txt
bash $R4E/scripts/r4-generate-records.sh
```

## 7. 未执行的验证（显式声明）

本任务**未**执行：前端/后端构建、前端单元测试或类型检查、浏览器严格几何验收、
`DSS-AC-114~118` 新增验收、正式验收、数据库读写、ZooKeeper 读写、Kafka 访问、
`5173`/`8080` 服务的启停或替换、任何 worktree 的清理。

文档事实纠正**不等于**业务验收通过，也**不等于**代码复审通过。
