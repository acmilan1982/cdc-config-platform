# 查询控件交互调整实现 R1 修正 — 证据索引

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1`
- 任务类型：前端 R1 定向修正（`frontend/` 4 个白名单文件 + 文档同步）；后端/API/SQL/数据库契约零改动
- 前置实现提交：`a47988820c797ff60bd7244b2d0f899bd8fc3be5`（ChatGPT 复审 `CHANGES_REQUIRED`）
- 该实现提交的父提交：`548e16147675cdc6013a4d166bf60d7b1b8bda36`
- 批准内容基准：`cf9f9eb0240f275cd50eb37546e6d6256892a9f4`
- 被测现场：隔离 worktree `/agent/dss-query-ctl-impl-001-r1`（detached HEAD `a479888`）
- 验收入口：`http://192.168.174.70:5173/monitor/data-source-state`；回归路由 `/config/data-source`
- 执行日期：2026-09-11

本目录证据为**开发自测证据**，不得作为正式验收结论；所有 `DSS-AC-*` 仍为 `NOT_RUN`。

## 1. 与上一次实现（IMPL-001）证据的关系（取代 / 补充）

R1 的核心是修正 `a479888` 的两个缺陷并补齐**真正进入 Git 的原始证据**。关系如下：

| 上一次证据（`…-IMPLEMENTATION-001/`） | R1 处置 | 说明 |
|---|---|---|
| `tests/vitest-targeted.log` | **取代** | 该 `.log` 被仓库 `.gitignore` 第 30 行 `*.log` 排除，**从未进入 Git**。R1 以 `tests/vitest-targeted.txt`（`npx vitest run` 原始输出，含 `EXIT_CODE=0`）取代 |
| `tests/vitest-feature.log` | **取代** | 同上，改为 `tests/vitest-feature.txt` |
| `tests/vitest-full.log` | **取代** | 同上，改为 `tests/vitest-full.txt` |
| `tests/build.log` | **取代** | 同上，改为 `tests/build.txt` |
| `tests/diff-check.txt` | 保留并沿用 | 该文件本就是 `.txt`，未被忽略；R1 重新生成同名原始输出 |
| `after/`、`before/`、`docs/` 各证据 | **不动** | §13.6：不得篡改旧证据文件 |
| IMPL-001 证据 README §5 表格 | **补充更正** | R1 在原 README 追加更正段（不删除原行），说明 `.log` 行从未进入 Git |

R1 **新增**的原始证据：`tests/*.txt`（取代）、`browser/*`（含碰撞探针与逐状态截图哈希索引）、
`database/scheduler-observation.txt`（调度器触发与写入观测）、`git/env-check.txt`（环境与 Git 现场）。

## 2. 目录

```text
git/       环境预检与 Git 现场（含 fetch、远程、worktree 保护）
tests/     自动化测试、构建、git diff --check 原始输出（.txt，进入 Git）
browser/   四档视口真实浏览器证据：几何、Tooltip、请求、截图与哈希索引
database/  后端与统计调度器只读观测（调度器触发记录 + 只读 SQL 快照）
```

## 3. 环境与 Git（`git/env-check.txt`）

- `git=/usr/bin/git 2.47.3`、`node=/opt/node/bin/node v24.17.0`、`npm 11.13.0`、JDK `1.8.0_202`、`mvn=/usr/local/maven/bin/mvn 3.8.8`、`sqlplus=/opt/oracle/instantclient/sqlplus`、`zkCli.sh` 存在。
- R1 worktree HEAD = `a479888`（detached）；`origin/develop` = `a479888`；`ls-remote origin develop` = `a479888` → 未分叉。
- `a479888^` = `548e161`。
- 修改范围：8 个文档 `M` + 4 个业务代码 `M`（均在白名单）+ 本 R1 证据目录 `??`。
- 主工作区 `/agent/cdc-config-platform` HEAD `4222b0a`、116 处既有变更；prototype worktree HEAD `4222b0a`、13 处既有变更 —— R1 全程未触碰。

## 4. 自动化测试与构建（`tests/`，全部进入 Git）

| 文件 | 命令 | 结果 |
|---|---|---|
| `vitest-targeted.txt` | `npx vitest run .../format.spec.ts .../DataSourceSnapshotQueryBar.spec.ts` | **2 文件 / 102 用例全通过**（`81` + `21`），`EXIT_CODE=0` |
| `vitest-feature.txt` | Feature `src/views/data-source-run-state` 全量 | **13 文件 / 241 用例全通过**，`EXIT_CODE=0` |
| `vitest-full.txt` | 前端全量 `npm test` | **50 文件 / 830 用例全通过**，`EXIT_CODE=0` |
| `build.txt` | `npm run build`（含 `vue-tsc --noEmit`） | **成功**（`✓ built in 28.51s`），`EXIT_CODE=0` |
| `diff-check.txt` | `git diff --check` / `--stat` / `status --short` | `git diff --check` **exit 0 无空白错误**；差异 12 文件（8 文档 + 4 代码） |

> 所有 `.txt` 均为命令的完整原始输出；`git check-ignore` 证明 `.txt` 不被忽略、`.log` 被 `.gitignore:30` 忽略。

## 5. 真实浏览器验证（`browser/`）

- 运行方式：headless Chrome（`--remote-debugging-port=9222`）+ 最小 CDP 驱动，四档视口
  `1280x800 / 1700x920 / 1920x1080 / 2560x1440`，`synth`（合成只读探针负载）与 `real`（真实只读后端）各一轮。
- `r1-synth.json` / `r1-real.json`：每档视口的结构化结果（几何、碰撞探针、边界探针、选中项探针、源库探针、请求计数、其他路由泄漏、Console）。
- `r1-screenshot-hashes.txt`：104 张截图的 sha256 索引，逐张标注**操作**与**选项稳定身份**，并解释“预期相同”的哈希分组。
- `r1-1280-before-after-layout.txt`：R1 前后 1280 真实数据布局对照（逐字节相同）。

关键实测（两模式、四档一致）：

| 项 | 结果 |
|---|---|
| 三下拉固定宽度 | `client=240 / source=300 / status=200`，跨全部内容状态 `maxAdjacentDelta` 恒为 `0` |
| 截断标签碰撞 | 冲突探针 A/B 可见标签逐字节相同，Tooltip 各显示自身完整 `CLIENT_DESC`。`collisionBad=0` |
| 边界探针 | 19/20 码点原文无 Tooltip；21/22 码点截断并出现 Tooltip；`boundaryBad=0` |
| 已选可见项 Tooltip | 按稳定身份正确映射。`selectedBad=0`；`singleTooltips=0`（未污染表格 Tooltip） |
| 源库标签 | 逐分量 `trim`+20 码点截断，无 Tooltip。`sourceProbe` 全部 `labelOk=true` |
| 请求语义 | 初始加载 `1`、重置 `0`、开关下拉 `0`、悬停 Tooltip `0`、查询点击 `+1`；查询参数为**完整原始**标识（synth `clientId=PPPPPPPPPPPPPPPPPPPPAAA`，real `clientId=c-dssr1-0906-a`）；`nonGet=[]` |
| 其他路由 | `/config/data-source`：`dssElements=0`、`elSelect=0` |
| Console | `consoleErrors=0` |

## 6. 数据库 / 调度器（`database/scheduler-observation.txt`）

- `StatsScheduler` 于 `13:18:59.610` 启动（`initialDelayMs=600000, intervalMs=3600000`），本任务窗口内**正常触发 4 轮** `LARGE_SCREEN_STATS`：`13:28:59 / 14:28:59 / 15:29:00 / 16:29:00`。
- 每轮均为 `stopReason=all_caught_up, correctProcessed=0, errorProcessed=0` → **触发但 0 条处理、无写入**。
- 后端日志写语句计数 `=0`；`CDC_STATS_WATERMARK` 最近更新为 `2026-08-25`（早于窗口）；本 Feature 表 `CDC_DATA_SOURCE_RUN_STATE` `max(updated_at)=2026-09-06 11:02:00`、30 行不变。
- 结论：`manual_database_write_status=ZERO`；`stats_scheduler_status=TRIGGERED`；`stats_scheduler_write_status=NO_WRITE_OBSERVED`；ZooKeeper / Kafka 未访问。

## 7. 边界声明

1. 本目录证据为**开发自测证据**，不替代正式验收；所有 `DSS-AC-*` 仍 `NOT_RUN`。
2. 未新增需求/验收编号；86 条 `DSS-REQ-*` 与 103 条 `DSS-AC-*` 业务行逐字节不变。
3. 未修改后端、SQL、数据库结构或业务数据；接口/数据库业务契约零变化。
