# AC-001 基准提交、隔离工作区与服务来源

本文件记录 QLPSC-AC-001（任务基准与工作区来源）在 2026-09-17 实际观测到的事实。

## 1. 基准提交

| 项 | 值 |
|---|---|
| `expected_commit_id` | `d1cd3b1fffb56b50793e576a369325e94063cabc` |
| 父提交 `HEAD^` | `ff9bf2b8ed026f42cfd42904065a4577e7aa1556` |
| `git cat-file -t HEAD` | `commit` |
| `git ls-remote origin refs/heads/develop` | `d1cd3b1fffb56b50793e576a369325e94063cabc refs/heads/develop` |

远程 `develop`、隔离工作区 HEAD、`HEAD^` 三者与提示词 §2/§3 指定值一致，未切换到任何更新提交。

## 2. 隔离工作区

复用实现阶段工作区 `/agent/query-list-page-shared-component-implementation-001-r1`，复用前满足全部条件：

- 工作区存在，且 `git worktree list` 中登记为 `d1cd3b1 (detached HEAD)`；
- `git rev-parse HEAD` 严格等于指定提交；
- 验收开始前 `git status --short` 为空（无修改、无未跟踪文件、无残留脚本）；
- 无其它任务占用该工作区；
- 未移动主工作区分支：主工作区 `/agent/cdc-config-platform` 仍为 `4222b0a [develop]`，会话开始前后一致。

未进入、清理、删除、reset、stash 或修改任何其它既有 worktree：`git worktree list`
在本任务整个窗口内的总量恒为 **70** 项（1 个主工作区 + 69 个已登记隔离 worktree），
本任务只使用其中 1 项（`/agent/query-list-page-shared-component-implementation-001-r1`），
验收开始与结束两次检查数量一致、全部保持原状。（此前本文件一度写作 `71`，
经 Git worktree 注册表证据核验为笔误；完整推证见
`AC-017-scope-freeze-safety.md` §7.1。）

## 3. 环境预检

工具路径（`source agent-env.sh` 后）：

| 工具 | 路径 |
|---|---|
| git | `/usr/bin/git` |
| java / javac | `/usr/java/latest/bin/java`、`/usr/java/latest/bin/javac` |
| mvn | `/usr/local/maven/bin/mvn` |
| node / npm | `/opt/node/bin/node`、`/opt/node/bin/npm` |

版本：`git 2.47.3`、`java 1.8.0_202`、`javac 1.8.0_202`、`Apache Maven 3.8.8`（`Maven home: /usr/local/maven`）、`node v24.17.0`、`npm 11.13.0`、`locale LANG=en_US.UTF-8 / LC_CTYPE=en_US.UTF-8`。

未安装、升级或替换任何依赖、JDK、Maven、Node.js、npm、浏览器或系统工具。

## 4. 服务来源

验收所需前端与后端均在本任务隔离工作区启动，进程工作目录经 `/proc/<pid>/cwd` 核实：

| 服务 | PID | cwd | 命令 |
|---|---|---|---|
| 后端 | 20646 | `/agent/query-list-page-shared-component-implementation-001-r1` | `java -jar /agent/cdc-config-platform/backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar` |
| 前端 | 20827 | `/agent/query-list-page-shared-component-implementation-001-r1/frontend` | `node .../frontend/node_modules/.bin/vite` |

监听：`0.0.0.0:5173`（pid 20827）、`*:8080`（pid 20646）。

健康检查：`GET /api/monitor/data-source-run-state/list -> HTTP 200，records=30`；`GET /monitor/data-source-state -> HTTP 200`。

### 4.1 后端 jar 的来源说明

后端 jar 位于主工作区的 `backend/target/`，本轮未重新打包。核实结论：jar 所对应的后端源码树与被验提交完全一致，不存在版本替代。

- `git status --short backend/`（主工作区）为空 —— 后端无任何未提交修改；
- `git diff --stat 4222b0a d1cd3b1 -- backend/` 为空 —— 主工作区提交点与被验提交的后端源码树逐字节一致；
- jar：`sha256 737e0519a26e0bacf3bd21f5a4cdfd81796a30db313964cc59349f7d6e2dde6f`。

后端不在本任务验收范围内（`backend_diff=ZERO`），仅作为浏览器验证的数据源使用。

## 5. 端口预检

启动前 8080 / 5173 / 5181 / 5182 / 5183 / 5190 均空闲，且无遗留 java / vite / chrome 进程，不存在占用者身份不明的端口冲突。未使用 `pkill`、`killall`、模糊匹配杀进程或按端口范围批量杀进程。
