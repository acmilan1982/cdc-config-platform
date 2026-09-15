# Git 基准、冻结区与范围

## 基准

```text
branch=develop
worktree=/agent/dss-query-button-table-layout-formal-acceptance-001 (detached HEAD)
base_commit_id=682650058b85b99b13a343373d6887bf0784ec1f
origin/develop=682650058b85b99b13a343373d6887bf0784ec1f
git ls-remote origin refs/heads/develop=682650058b85b99b13a343373d6887bf0784ec1f
ahead/behind=0/0 (开始前)
```

## 冻结区（相对基准，变更后核验）

```text
git diff 6826500 -- frontend backend        -> (empty)
git diff 6826500 -- '**/*.spec.ts' '**/*.test.ts' -> (empty)
git diff 6826500 -- package.json package-lock.json pom.xml -> (empty)
git diff 6826500 -- '**/*.sql' -> (empty)
```

## 变更范围（唯一允许的路径）

```text
docs/features/README.md
docs/features/data-source-snapshot-status/ACCEPTANCE.md
docs/features/data-source-snapshot-status/API.md
docs/features/data-source-snapshot-status/DATABASE.md
docs/features/data-source-snapshot-status/DESIGN.md
docs/features/data-source-snapshot-status/README.md
docs/features/data-source-snapshot-status/REQUIREMENTS.md
docs/features/data-source-snapshot-status/UI.md
```

## diff-check

```text
git diff --check          -> exit 0 (无行尾空白/冲突标记)
```

## worktree 保全

```text
git worktree list | wc -l  -> 59 (与任务开始前首次快照一致)
```
任务开始前的主工作区与全部既有 worktree 快照见 `services/port-provenance.md` 与任务日志目录中的 `snapshot-start.txt`；本任务未创建、未删除、未清理任何 worktree。

## Git hooks

```text
core.hooksPath=<unset>
非 .sample 的 hook 文件=0
未使用 --no-verify / -c core.hooksPath=/dev/null 等绕过手段
```
