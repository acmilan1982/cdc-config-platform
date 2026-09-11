# 查询控件交互调整实现 — 证据索引

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001`
- 任务类型：前端实现（`frontend/`），后端/SQL/接口/数据库零改动
- 基准提交：`548e16147675cdc6013a4d166bf60d7b1b8bda36`（＝远程 `develop`）
- 批准内容基准提交：`cf9f9eb0240f275cd50eb37546e6d6256892a9f4`
- 被测现场：隔离 worktree `/agent/dss-query-ctl-impl-001`（detached HEAD `548e161`）
- 验收入口：`http://192.168.174.70:5173/monitor/data-source-state`；回归路由 `/config/data-source`
- 执行日期：2026-09-11

证据目录为**开发自测证据**，不得作为正式验收结论；本任务所有 `DSS-AC-*` 仍为 `NOT_RUN`。

## 1. 目录

```text
git/     环境预检与 Git 现场
before/  实现前（基线 548e161）真实浏览器几何与截图
after/   实现后真实浏览器几何、截断、Tooltip、截图
tests/   自动化测试、构建、git diff --check 原始输出
docs/    需求/验收业务行 zero-change 提取物
backend/ 后端与统计调度器只读观察记录（脱敏）
```

## 2. 环境与 Git（`git/`）

| 文件 | 说明 |
|---|---|
| `git/env-check.txt` | 通用 + 前端环境预检、`git status --short`、`HEAD`、`git ls-remote origin develop`、本地/远程未分叉证明 |

关键事实：`git=/usr/bin/git`、`node=/opt/node/bin/node v24.17.0`、`npm 11.13.0`、JDK `1.8.0_202`、`mvn=/usr/local/maven/bin/mvn`；工作区仅本任务 4 个白名单文件被修改；`origin/develop = 548e161`；主工作区本地 `develop`（`4222b0a`）是 `548e161` 的祖先 → 未分叉。

## 3. 实现前（`before/`）

| 文件 | 说明 |
|---|---|
| `before-geometry.json` / `before-geometry-1280.json` | 基线计算样式链（`.dss-select` / `.el-select__wrapper` / `.el-select__selection` / `.el-select__selected-item` / `.el-select__tags-text` 的 `width/min-width/max-width/flex`）与几何 |
| `before-matrix-synth-1280.json` / `-1700.json` | 合成候选取样下的多状态几何矩阵（1280 / 1700） |
| `before-matrix-real-1700.json` | 真实后端数据下的多状态几何矩阵（1700） |
| `chain-synth-1700.json` | 盒子模型逐层收缩链 |
| `before-viewports.json` | 四档视口几何（脚本只记录几何与 `tooltipsVisible`，不记录文案） |
| `before-1280x800.png` … `before-2560x1440.png` | 四档全页截图 |

实现前结论（证据支撑）：三个 select 的**根节点与 wrapper 宽度在全部被测量状态下恒为 `240/300/200px`、差值为 `0`、无横向溢出**（`maxDelta` 全 `0`）；`CLIENT_DESC` 完整 Tooltip 完全不存在（`tooltipsVisible=0`）；源库候选 `sourceLabel()` 未做任何截断（最长合成值 `214` 码点 / `2490px` 被 `overflow:hidden` 裁掉）。两个实验进一步证明：外层盒子带确定 `width` 时自动最小尺寸被其上限约束，**内容无法把外层盒子撑大**。因此负责人可见的真实缺陷在**内容层**（源库标签未截断、源库 ghost 未截断、`DSS-REQ-086` Tooltip 缺失），而非外层几何不稳定；本轮的 `width/min-width/max-width/flex-basis` 锁定属于把契约显式化、脱离 Element Plus 内部实现的加固，使契约可测。

## 4. 实现后（`after/`）

### 4.1 几何矩阵（`DSS-REQ-084` / `DSS-AC-096`/`097`/`103`）

| 文件 | 说明 |
|---|---|
| `after-viewports.json` | 四档视口几何（新跑）；与 `before-viewports.json` **逐字节相同**（`sha256 3c60a00c…`）——脚本只记录几何与未悬停的 `tooltipsVisible`，二者相同正是“外部几何未变化”的直接证据 |
| `after-matrix12.json` | 16 状态命名几何矩阵 × 四档视口，含相邻状态差值、查询区/按钮几何、Tooltip 计数 |
| `after-longest-selected-*` / `after-zoom-longest-*` / `after-zoom-initial-*` / `after-zoom-reset-*` / `after-multi-collapse-*` / `after-clear-*` / `after-reset-*` / `after-tooltip-visible-*` | 1280 与 1700 等重点状态的全页与查询区放大截图（四档） |

每个视口实测（`after-matrix12.json`）：
- 根节点与 wrapper 宽度 `client=240 / source=300 / status=200`，`maxAdjacentDelta` 与 `maxDeltaVsInitial` **全部 `0`**（含 `qBtnX`、`barH`、三个字段组 `x/y`）；
- `maxHorizontalOverflow=0`；
- 三个字段组 `groupsY` 恒为 `175.5`（1280 下三个字段仍在同一行）；
- 查询栏高度：1700/1920/2560 为 `32px`；1280 为 `70px`（查询/重置按钮组按既有 `flex-wrap` 落到第二行——既有响应式设计，见 `UI.md` §19.7），**同一视口内跨 16 个内容状态 delta 恒为 `0`**。

### 4.2 四字段截断与完整值（`DSS-REQ-085` / `DSS-AC-098`/`099`/`103`）

| 文件 | 说明 |
|---|---|
| `after-tooltip.json` | 合成候选取样（19/20/21/22 码点、CJK × 25、emoji × 25、超长 ID、空白 desc、恰好 20 码点 desc）逐候选项渲染标签 + 悬停 Tooltip + 几何 delta（四档） |
| `after-real.json` | **真实后端只读**数据（无拦截）候选渲染标签、逐候选项 Tooltip、源库候选、页面几何 delta、表格单元格（四档） |

合成证实：`id19`/`id20`（19/20 码点）原文；`id21`/`id22`（21/22 码点）→ 前 20 码点 + ASCII `...`（`...` 不是 `…`）；CJK 25 码点 → 20 + `...`（CJK 按 1 码点）；emoji 25 码点 → 20 + `...`（代理对未被拆分）；`desc-empty-str`（纯空白 desc）→ 仅 ID、无空括号；`desc-20`（恰好 20 码点）→ 原文无 `...`。候选与可见选中项渲染结果一致。

真实后端证实：8 个真实候选，`desc` 码点 `>20` 的 4 个（`152`/`22`/`38`/`62` 码点）显示 `...` 并出现 Tooltip，其余不出现；9 个真实源库候选全部截断且无 Tooltip（`maxSourceFieldCp=20`）。

完整值隔离：`after-regress.json` 中查询请求 URL 为 `clientId=very-long-client-id-XXXX…（完整 60 字符）`、`sourceId=src-wide-org`，`clientIdNotTruncated=true`、`sourceIdPresent=true`。

### 4.3 `CLIENT_DESC` Tooltip（`DSS-REQ-086` / `DSS-AC-100`/`101`/`102`/`103`）

| 文件 | 说明 |
|---|---|
| `after-tooltip.json` | 逐候选项 Tooltip 计数/内容、leave 后计数、选中项与 `+N` 悬停、Tooltip 期间控件几何 delta |
| `after-tooltip-candidate-*` / `after-tooltip-tag-*` / `after-tooltip-collapse-*` | 候选 Tooltip、选中项 Tooltip、`+N` 折叠标签悬停截图（四档） |
| `after-regress.json` → `stateMachine.queryBarTooltipText` / `tableTooltip` | 查询栏 Tooltip 全文与表格 Tooltip 未回退 |

实测：`10` 个合成候选中恰好在 `desc>20` 码点者各显示 `1` 个 Tooltip，内容等于**完整未截断原始 `CLIENT_DESC`**，leave 后为 `0`；`sourceProbe` 全部 `gotTooltip=false`；可见选中项悬停为 `1`；`+N` 折叠标签悬停为 `0`（无聚合 Tooltip）；Tooltip 显隐期间控件几何 delta 全部 `0`；`singleTooltips=0`（未污染表格 Tooltip）；源库表格 Tooltip 仍只显示完整原始 `DATA_SOURCE_ID`（`matchesFullId=true`，而单元格显示的是 ORG）。

### 4.4 请求/状态机/视觉/其他路由回归

| 文件 | 说明 |
|---|---|
| `after-regress.json` | 请求计数步进、完整查询参数、单飞行、倒计时、自动刷新、hidden 冻结/恢复、失败保留旧结果、视觉度量、表格 Tooltip、Console、非 GET、`/config/data-source` 泄漏检查 |
| `after-regress-1700x920.png` / `after-other-route-1700x920.png` | 回归页与其他路由截图 |
| `after-real-*.png` | 真实后端四档全页截图 |

实测：初始加载 `1` 个 GET；选择/取消/清空/重置/Tooltip 各 `0`；查询 `+1` 且参数为完整原始值；三连击 `+1`（单飞行）；倒计时走秒 `0`；自动刷新到期 `+1`；hidden 冻结 `0`、恢复 `+1`；失败后行数 `6→6`；`console.errors=[]`；`nonGet=[]`；`/config/data-source` 中 `dssElements=0`、`elSelectCount=0`、`epPrimary=#409eff` 未变、无 console error。

## 5. 自动化测试与构建（`tests/`）

| 文件 | 说明 |
|---|---|
| `vitest-targeted.log` | `DataSourceSnapshotQueryBar.spec.ts` + `format.spec.ts`：**2 文件 / 72 用例全通过** |
| `vitest-feature.log` | `src/views/data-source-run-state` Feature 全部：**13 文件 / 211 用例全通过** |
| `vitest-full.log` | 前端全量 `npm test`：**50 文件 / 800 用例全通过** |
| `build.log` | `npm run build`（含 `vue-tsc --noEmit`）：**成功** |
| `diff-check.txt` | `git diff --check`：**exit 0，无空白错误**；差异仅限 4 个白名单文件 |

## 6. 文档业务行零变化（`docs/`）

| 文件 | 说明 |
|---|---|
| `base-DSS-REQ-rows.txt` | `548e161` 上 `REQUIREMENTS.md` 的 `DSS-REQ-*` 业务行提取物（**86** 行） |
| `base-DSS-AC-rows.txt` | `548e161` 上 `ACCEPTANCE.md` 的 `DSS-AC-*` 业务行提取物（**103** 行） |

同步后再次提取并与本目录提取物比对：`diff` 为空、行数仍 `86`/`103`、全部 `DSS-AC-*` 仍 `NOT_RUN`。

## 7. 后端 / 统计调度器 / 数据库边界（`backend/`）

| 文件 | 说明 |
|---|---|
| `backend-scheduler-observation.txt` | 后端与前端进程启动时间、调度器启动与触发记录（脱敏）、DML 检索计数、SELECT 计数 |

结论：后端 `13:18:46` 启动；`StatsScheduler` 于 `13:18:59` 启动（`initialDelayMs=600000, intervalMs=3600000`），并于 `13:28:59.839` **按既有配置正常触发**一轮 `LARGE_SCREEN_STATS`（`stopReason=all_caught_up`，`correctProcessed=0`/`errorProcessed=0`）。完整后端日志中 `INSERT INTO`/`UPDATE`/`MERGE INTO`/`DELETE FROM` 检索计数**均为 0**（`stats_scheduler_write_status=NOT_OBSERVED`）。本任务未执行任何手工 DML/DDL、未修改调度器配置、未构造测试数据；浏览器操作为只读；ZooKeeper / Kafka 未访问。

## 8. 已知口径冲突与边界

1. `UI.md` §20.6 第二句“`1280` … 不换行”与 §19.7（`DSS-REQ-083`/`DSS-AC-094`）明确撤回“1280 下所有查询条件与查询/重置必须同处一行”的前提存在**表述冲突**。按 `ACCEPTANCE.md` 的 `DSS-AC-094` 与 `UI.md` §19.7，以“**不因候选文本长度产生额外换行**”为口径；实测 1280 查询栏高度在实现前后、以及 16 个内容状态之间 delta 恒为 `0`（三个字段同处一行，仅查询/重置按钮组按既有 `flex-wrap` 位于第二行）。本任务不修改 §20.6 已批准业务正文，仅记录冲突与实测证据。
2. `after-viewports.json` 与 `before-viewports.json` 逐字节相同——见 §4.1 说明，属预期结果而非文件重复使用。
3. 本目录证据为**开发自测证据**，不替代正式验收；所有 `DSS-AC-*` 仍 `NOT_RUN`。
