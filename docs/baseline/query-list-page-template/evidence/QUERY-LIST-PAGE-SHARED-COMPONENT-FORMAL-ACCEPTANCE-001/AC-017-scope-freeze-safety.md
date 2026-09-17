# AC-017 范围、冻结标记与安全

验收基准 `d1cd3b1fffb56b50793e576a369325e94063cabc`，隔离工作区
`/agent/query-list-page-shared-component-implementation-001-r1`（`detached HEAD`）。

## 1. 冻结构件计数

| 冻结项 | 要求 | 实测 |
|---|---|---|
| 候选组件数 | 10 | 10 |
| 已实现公共组件数 | 6 | 6 |
| 并入组件数 | 1 | 1（`StableTableContainer` 并入 `QueryListResultPanel` 正文区） |
| 推迟 composable 数 | 3 | 3（`src` 下无同名文件、全仓无任何引用） |
| 拒绝组件数 | 0 | 0 |

阶段一集合 = `QueryListPageShell`、`QueryListQueryPanel`、`QueryListActions`、
`QueryListResultPanel`、`QueryListRefreshToolbar`、`QueryListTooltipHost`、
`useQueryListTooltip`。`StableTableContainer` 未单独成组件；三个行为 composable
（`useQueryListAppliedQuery`、`useQueryListSingleFlightRequest`、`useQueryListVisibleAutoRefresh`）
仍为推迟状态，`frontend/src` 下不存在同名文件，源码中无任何导入或引用
（含占位、别名、空文件）。公共出口仍为 6 组件 + 1 composable，样式源不导出。

## 2. 事实分层标记冻结

计数范围：`README.md`、`DESIGN.md`、`UI.md`、`MIGRATION.md` 四份模板文档
（标记名称定义见 `README.md` §5.1–§5.3），设计决策标记计数范围：
`SHARED_COMPONENT_DESIGN.md` §0.1。

| 标记（按 `README.md` §5.1–§5.3 与 `SHARED_COMPONENT_DESIGN.md` §0.1 的定义名） | 验收前 | 验收后 | 漂移 |
|---|---|---|---|
| 模板规则·批准态 | 48 | 48 | 0 |
| 模板规则·草案态 | 0 | 0 | 0 |
| 参考实现事实 | 43 | 43 | 0 |
| 未实现建议 | 9 | 9 | 0 |
| 设计决策·批准态 | 66 | 66 | 0 |
| 设计决策·草案态 | 0 | 0 | 0 |

本轮**未**修改任何规范设计内容、候选决策、数值契约或事实分层标记。
`reports/` 与 `evidence/` 目录中**不存在**任何上述标记的字面实例
（已用 `grep -rn` 全目录核验，返回空），因此本轮新增文档**不会**抬高任何冻结计数。
报告与状态更新中的计数以「计数字段」形式表达（如 `template_rule_approved_count=48`），
不构成新的标记实例。

## 3. 允许修改范围核对

`git diff --name-status d1cd3b1fffb56b50793e576a369325e94063cabc`：

```text
M	docs/baseline/query-list-page-template/MIGRATION.md
M	docs/baseline/query-list-page-template/README.md
M	docs/baseline/query-list-page-template/SHARED_COMPONENT_DESIGN.md
```

新增（未跟踪 → 本次提交）：

```text
docs/baseline/query-list-page-template/reports/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001.md
docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001/AC-001-base-isolation-and-services.md
docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001/AC-002-008-static-contract.md
docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001/AC-003-011-012-013-tests-and-contracts.md
docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001/AC-009-010-tooltip.md
docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001/AC-014-browser-four-viewports.md
docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001/AC-015-strict-geometry.md
docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001/AC-016-negative-controls.md
docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001/AC-017-scope-freeze-safety.md
```

三份被修改文档仅做**最小状态、下一步入口与审计更新**：`README.md` 的状态区与 §7
入口、新增 2026-09-17 变更记录；`MIGRATION.md` 的状态引用、§6.1 边界条目与 §7 入口；
`SHARED_COMPONENT_DESIGN.md` 的文件标题、文件头状态区、文件头边界引用与新增 §12
审计记录。**未**改写任何已批准设计语义、候选决策、数值契约或保留标记。

零修改证明：

```text
frontend_source_diff=ZERO
backend_diff=ZERO
project_test_code_diff=ZERO
dependency_lockfile_diff=ZERO
sql_config_diff=ZERO
```

`git diff --stat d1cd3b1 -- frontend backend '*.sql' '*/package-lock.json' '*/pom.xml'`
输出为空（0 行）。未修改 `docs/features/**`、既有报告或既有证据；未修改
`CLAUDE.md`、`.claude/settings.json` 或 `.claude/skills/**`；未修改 `docs/baseline/`
下六份正式项目级基线。

## 4. 数据库 / ZooKeeper / Kafka 边界

```text
database_access_status=NONE
database_write_status=ZERO
zookeeper_task_initiated_access_status=NONE
zookeeper_write_status=NOT_REQUESTED
kafka_access_status=NONE
```

- 数据库：本轮**未**建立任何数据库连接，未执行 `SELECT`，未执行任何写操作；
- ZooKeeper：本轮**未**由本任务发起任何访问（`ls` / `get` / `stat` 均未执行），
  未执行任何写操作；
- Kafka：本轮**未**访问。

## 5. 凭据扫描

对最终 diff（`git diff` 全量 + 全部未跟踪新文件）做凭据扫描：

```text
credential_scan_status=CLEAN
```

扫描模式覆盖口令 / 密钥 / 令牌 / 私钥 / 完整连接串 / 认证头
（`password|passwd|secret|token|api[-_]?key|BEGIN … PRIVATE KEY|Authorization:|Bearer |jdbc:|sqlplus|<内网 IP>|CDC/CDC`）。
命中 2 处，均为**技术术语**而非凭据：

- `spinner_token` / `--ql-btn-spinner-inset`：CSS 自定义属性名称；
- `hostId token` / `aria-describedby` 关联值：ARIA 无障碍属性术语。

除此之外无任何口令、私钥、完整连接串或认证信息；报告与证据中**未**打印任何
完整认证令牌、私钥或数据库连接串。

## 6. Git 校验

```text
git_diff_check_status=0
git_diff_cached_check_status=0
git_hooks_status=NOT_DISABLED_NOT_BYPASSED
```

- `git diff --check` 与 `git diff --cached --check` 均通过（退出码 0）；
- `core.hooksPath` 未设置（`git config --get core.hooksPath` 返回空），使用默认 `.git/hooks`；
  仓库中非 `.sample` 钩子文件数为 0，本轮**未**使用 `--no-verify`、
  `-c core.hooksPath=…` 或任何跳过手段。

## 7. 工作区与 worktree 保全

```text
main_worktree_preservation_status=PRESERVED_UNTOUCHED
existing_worktrees_preservation_status=PRESERVED_UNTOUCHED
```

- 主工作区 `/agent/cdc-config-platform` 验收前后均为 `develop @ 4222b0a…`，
  `git status --short` 行数恒为 116（全部为任务开始前既存的、与本任务无关的修改），
  本任务**未**修改、覆盖、暂存、提交或丢弃其中任何内容；
- `git worktree list` 总量恒为 **70** 条（1 个主工作区 + 69 个已登记隔离 worktree），
  本任务只使用其中 1 条
  （`/agent/query-list-page-shared-component-implementation-001-r1`）；
- 本任务**未**进入、清理、删除、`reset`、`stash` 或修改任何其它既有 worktree；
- 本任务**未**执行 `git worktree prune` / `remove`；本任务工作区在任务结束后**保留**，
  等待复审；
- 未删除任何既有报告或证据。

### 7.1 worktree 数量时点核验（R1 纠正）

基准提交中本文件与 `AC-001-base-isolation-and-services.md` 曾分别写为 `70` 与 `71`，
两者不一致。按提示词 §6.1（同一时点的笔误）核验并统一如下。

**对应的登记事实（命令与输出位置）**：

| 项 | 值 | 来源 |
|---|---|---|
| 注册表目录 mtime | `2026-09-17 12:19:35.714526647 +0800` | `stat -c '%y' .git/worktrees` |
| 本任务工作区注册项 birth | `2026-09-17 12:19:35.714526647 +0800` | `stat -c '%w' .git/worktrees/query-list-page-shared-component-implementation-001-r1` |
| 注册表当前条目数 | 69 | `ls -1 .git/worktrees \| wc -l` |
| `git worktree list` 当前条数 | 70 | `git worktree list \| wc -l` |
| prunable 条目数 | 0 | `git worktree list --porcelain \| grep -c '^prunable'` |
| 已登记路径缺失数 | 0 | 逐个读取 `.git/worktrees/*/gitdir` 后 `test -d` |

**推证**：`.git/worktrees` 目录 mtime 是该注册表**成员集合**最后一次发生增删的时刻；
实测为 `2026-09-17 12:19:35`，与 `…-implementation-001-r1` 注册项的 birth 时间逐微秒相同，
即该时刻的唯一变化就是本任务工作区被登记。注册表中 `2026-09-17` 只有该条目，
其余条目 birth 均为 `2026-09-16`。因此自 `12:19:35` 起直到提交时，
`git worktree list` 总数**恒为 70**，完整覆盖正式验收窗口（约 `13:18`–`13:41`），
且 `12:19:35` 早于验收开始。

**结论**：

- 被证明的实际数量为 **70**（起始与结束一致，无外部并发变化）；
- `AC-001` 中的 `71` 为同一时点的笔误，已按提示词 §6.1 统一为唯一可证明的 `70`；
  该文件已同步纠正并指向本节；
- 是否存在本任务之外的并发 worktree 变化：**否**（注册表成员自 `12:19:35` 起不变）；
- 本任务自身 worktree 路径：`/agent/query-list-page-shared-component-implementation-001-r1`，
  状态：**保留**（未清理、未 `prune`、未删除），等待复审。

```text
worktree_count_conflict_resolution=TYPO_CORRECTED
worktree_count_at_acceptance_start=70
worktree_count_at_acceptance_end=70
worktree_count_at_acceptance_commit=70
worktree_count_evidence_source=.git/worktrees registry (mtime + entry birth times) + git worktree list
external_concurrent_worktree_change_status=NONE_DETECTED
main_worktree_preservation_status=PRESERVED_UNTOUCHED
existing_worktrees_preservation_status=PRESERVED_UNTOUCHED
```

原始命令输出留存于验收临时目录：

```text
/tmp/query-list-page-shared-component-formal-acceptance-001/r1-worktree-count-evidence.log
```

该文件逐条记录本节全部命令与其原始输出；验收服务的日志同在该目录
（`backend.log`、`frontend.log`）。上述结论不依赖任何未留存的记录。

## 8. 进程与端口收口

本任务启动的前端与后端进程仅以**已记录的 PID** 精确停止，未使用 `pkill`、
`killall`、模糊匹配或按端口范围批量杀进程：

| 服务 | PID | 停止后端口 |
|---|---|---|
| 前端（vite） | 20827 | 5173 已释放 |
| 后端（java -jar） | 20646 | 8080 已释放 |

未停止任何其它任务的服务。所有运行日志只写入
`/tmp/query-list-page-shared-component-formal-acceptance-001/`，
**未**向 Git 工作区写入任何运行日志；日志目录、构建产物与临时脚本均未被提交。
