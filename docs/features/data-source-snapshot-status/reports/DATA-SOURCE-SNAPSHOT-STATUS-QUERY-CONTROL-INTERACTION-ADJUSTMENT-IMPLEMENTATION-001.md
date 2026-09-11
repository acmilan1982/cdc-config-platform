# 查询控件交互调整实现报告

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001`
- 任务类型：前端实现（`frontend/`，纯展示层）
- 执行日期：2026-09-11
- 分支口径：`develop`
- 基准提交：`548e16147675cdc6013a4d166bf60d7b1b8bda36`（＝执行时 `origin/develop`）
- 批准内容基准提交：`cf9f9eb0240f275cd50eb37546e6d6256892a9f4`
- 被测现场：隔离 worktree `/agent/dss-query-ctl-impl-001`（detached HEAD `548e161`）
- 证据目录：`evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001/`

> 本报告为**实现任务报告**，不是验收结论。所有 `DSS-AC-*` 仍为 `NOT_RUN`；结果提交 SHA 只在任务外层 `AGENT_TASK_RESULT` 给出，本报告不预填、不制造循环 amend。

---

## 1. 环境、起始提交、批准内容基准与执行边界

### 1.1 环境预检

| 项 | 实测 |
|---|---|
| `git` | `/usr/bin/git`，`git version 2.47.3` |
| `claude` | `/root/.local/bin/claude`，`2.1.143` |
| `node` / `npm` | `/opt/node/bin/node` `v24.17.0` / `npm 11.13.0` |
| `java` / `mvn` | `/usr/java/latest/bin/java` `1.8.0_202` / `/usr/local/maven/bin/mvn` |
| 已加载环境脚本 | `source /agent/cdc-config-platform/agent-env.sh` |

原始输出：`evidence/.../git/env-check.txt`。

### 1.2 Git 现场

- 本任务工作区：`/agent/dss-query-ctl-impl-001`（隔离 worktree，detached HEAD `548e161`）；
- 起始 `git status --short`：仅 4 个白名单文件被修改；
- `origin/develop = 548e16147675cdc6013a4d166bf60d7b1b8bda36`，`git ls-remote origin develop` 一致；
- 主工作区 `/agent/cdc-config-platform` 本地 `develop = 4222b0a`，是 `548e161` 的**祖先** → 本地/远程**未分叉**（`git merge-base --is-ancestor` 为真），符合停线前置条件。

### 1.3 执行边界

- 只改 `frontend/`：仅 `DataSourceSnapshotQueryBar.vue`、`DataSourceSnapshotQueryBar.spec.ts`、`utils/format.ts`、`utils/format.spec.ts`；
- **后端 / SQL / 接口 / 数据库 / 表格组件 / Tooltip 控制器零改动**（未改 `useDataSourceSnapshot.ts`、`tooltip/*`、`DataSourceSnapshotTable.vue`、`DataSourceSnapshotStatusTag.vue`、`DataSourceSnapshotToolbar.vue`）；
- 数据库：只读；**未执行任何手工 DML/DDL**、未构造测试数据、未修改调度器配置；
- ZooKeeper / Kafka：**未访问**（`zookeeper_access_status=NONE`、`kafka_access_status=NONE`）；
- 浏览器操作为只读：`0` 个非 GET 请求；
- 主工作区与 `5174` prototype worktree 的既有修改全程保留，未 stash/reset/checkout/clean/覆盖。

---

## 2. 实现前问题复现、元素几何与真实根因

### 2.1 复现方法

在基线 `548e161` 上用 Chrome DevTools Protocol（无 playwright/puppeteer 依赖，`Runtime.evaluate` + `Input.dispatchMouseEvent` + `Emulation.setDeviceMetricsOverride` + `Page.captureScreenshot`）对 `5173` 的 `/monitor/data-source-state` 做真实浏览器测量，覆盖 16 个命名内容状态 × 四档视口，并逐层记录盒模型计算样式。

### 2.2 实测（基线）

- 三个 select 的**根节点与 `.el-select__wrapper` 宽度在全部被测量状态下恒为 `240 / 300 / 200px`，相邻状态与相对初值的差值全部为 `0`**，且无横向溢出；
- 计算样式链：根 `width:240px; min-width:auto; max-width:none; flex:0 1 auto`；wrapper `min-width:0`（Element Plus 自带）；`.el-select__selection` `flex:1 1 0%; min-width:0`；`.el-select__selected-item` `max-width:100%`；`.el-select__tags-text` 省略号；
- `CLIENT_DESC` 完整 Tooltip **完全不存在**（可见 Tooltip 计数 `0`）；
- 源库候选 `sourceLabel()` **未做任何截断**：最长合成值 `214` 码点 / `2490px`，仅被 `overflow:hidden` 裁掉；源库 ghost 选项同样未截断。

### 2.3 真实根因（证据支撑，非“只写一句加了固定宽度”）

两个对照实验证明：一个带有**确定 `width`** 的 flex 子项，其 automatic minimum size 被“specified size suggestion”封顶，**内容无法把外层盒子撑宽**。因此基线上**并不存在可复现的外层几何不稳定**；项目负责人可见的真实缺陷位于**内容层**：

1. 源库候选与源库 ghost 未按码点截断（信息既被裁切、又无法读回）；
2. `DSS-REQ-086` 要求的 `CLIENT_DESC` 完整 Tooltip 整体缺失；
3. 三个宽度值虽然实测稳定，但**并非写在本 Feature 命名空间里的契约**，而是 Element Plus 内部收缩行为的“结果”，随 EP 升级或内部样式变化可能改变，且无法被测试直接锁定。

据此本轮的实现定位为：**补内容层能力（截断 + Tooltip）＋ 把几何契约显式化（锁定到 Feature 命名空间）**，而不是声称修好了一个不存在的“外层坍塌”。证据：`before/`。

---

## 3. 实际修改文件与每个文件职责

| 文件 | 职责 |
|---|---|
| `frontend/src/views/data-source-run-state/utils/format.ts` | 新增字段级截断公共能力：`FIELD_TRUNCATE_CODE_POINTS = 20`、`codePointLength(text)`、`truncateCodePoints(text, max=20)`。原 `TIME_DASH`/`formatTimeOrDash`/`formatEpochToHms` 不变。 |
| `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` | ① 外部几何锁 CSS（`min-width`/`max-width`/`flex: 0 0 <w>`，240/300/200）＋ 三个 `:deep(.el-select__selection){min-width:0}`；② `clientLabel`/`sourceLabel` 改为四字段统一码点截断、空值规则、ghost 也截断；③ 新增查询控件内 `CLIENT_DESC` 完整 Tooltip（Teleport + `.dss-q-tt` + 文档级委托锚点解析 + 先测后显定位）。 |
| `frontend/src/views/data-source-run-state/utils/format.spec.ts` | 11 条截断单测（常量、边界 19/20/21/22/100、ASCII `...`、CJK、emoji 代理对、码点 vs UTF-16 码元、空串/单字符）。 |
| `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts` | 由 42 条扩到 **61 条**：新增四字段截断、空/纯空白规则、候选与可见选中项一致、ghost 完整 value、宽度锁定 CSS、最长值不改变几何、Tooltip 触发条件/内容/单实例/源库不显示/`+N` 不聚合/卸载销毁、以及既有的查询/重置/全部互斥与 busy 行为。 |

---

## 4. 外部固定宽度与内部 flex 收缩的实现方式

在原有三条宽度声明（`.dss-client-select{width:240px}`、`.dss-source-select{width:300px}`、`.dss-status-select{width:200px}`，**逐字节保留**）之下，追加同命名空间的锁：

```css
.dss-client-select { min-width: 240px; max-width: 240px; flex: 0 0 240px; }
.dss-source-select { min-width: 300px; max-width: 300px; flex: 0 0 300px; }
.dss-status-select { min-width: 200px; max-width: 200px; flex: 0 0 200px; }
.dss-client-select :deep(.el-select__selection),
.dss-source-select :deep(.el-select__selection),
.dss-status-select :deep(.el-select__selection) { min-width: 0; }
```

- `min-width` + `max-width` 把宽度夹死；
- `flex: 0 0 <w>` 使 select 作为 `.dss-q-group` 的 flex 子项既**不被内容撑开**（`flex-grow=0`）也**不被过窄查询栏压缩**（`flex-shrink=0`）；
- `:deep(.el-select__selection){min-width:0}` 显式归零内部可收缩区的 automatic minimum size（EP 自身亦给同值，此处再声明使契约落在本 Feature 命名空间、不依赖 EP 内部实现）。

**不使用**任何全局 Element Plus 覆盖、不使用 JS 尺寸监听；`text-overflow` 仅保留为组合文本超出实际像素宽度时的最后保护（与 `DSS-REQ-084④` 一致）。

实测（`after/after-matrix12.json`，四档视口）：16 状态 × 4 视口，根与 wrapper 宽度恒为 `240/300/200`，`maxAdjacentDelta` 与 `maxDeltaVsInitial` **全部 `0`**（含 `qBtnX`、`barH`、三组 `groups x/y`），`maxHorizontalOverflow=0`，三组 `groupsY` 恒为 `175.5`。

---

## 5. Unicode code point 截断实现及完整 value 隔离

```ts
export const FIELD_TRUNCATE_CODE_POINTS = 20
export function codePointLength(text: string): number { return Array.from(text).length }
export function truncateCodePoints(text: string, max = FIELD_TRUNCATE_CODE_POINTS): string {
  const points = Array.from(text)
  if (points.length <= max) return text
  return `${points.slice(0, max).join('')}...`
}
```

- 判定用 `Array.from(text)` 迭代 → 按 **Unicode code point** 计数；CJK 计 1；**代理对不被拆开**；
- 超限追加**英文三点 `...`**（不是单字符 `…`）；恰好 20 不追加；
- 探针端展示 `truncate(CLIENT_ID,20)（truncate(CLIENT_DESC,20)）`；`CLIENT_DESC` trim 后为空 → 仅显示截断后 ID、**无空括号**；
- 源库展示 `truncate(DATA_SOURCE_ORG,20)（truncate(DATA_SOURCE_ID,20)）`；`DATA_SOURCE_ORG` trim 后为空 → 回退**截断后的原始 `DATA_SOURCE_ID`**、无空括号；
- 候选、可见选中项、ghost 选项共用同一套 `clientLabel`/`sourceLabel` 结果（ghost 仍保留完整 value 与“不在候选内”语义）；
- **仅显示态**：`option.value`、查询参数、已应用条件、请求语义一律保留完整原始 ID，截断不回流数据层。

实测（`after/after-tooltip.json` 合成 + `after/after-real.json` 真实后端）：19/20 码点原文；21/22/25/33/39/60/152 码点 → 前 20 码点 + `...`；CJK 与 emoji 按码点、代理对完整；`desc-empty-str` 仅 ID；恰好 20 码点无 `...`；真实后端 8 个探针候选中 `desc>20` 的 4 个（152/22/38/62 码点）显示 `...`，9 个源库候选全部截断（`maxSourceFieldCp=20`）。

完整值隔离（`after/after-regress.json`）：查询请求参数 `clientId=very-long-client-id-XXXX…`（完整 60 字符）、`sourceId=src-wide-org`，`clientIdNotTruncated=true`、`sourceIdPresent=true`。

---

## 6. `CLIENT_DESC` Tooltip 的触发、内容、单实例与安全宽度

实现要点：

- **触发**：`clientDescTooltip(c)` 仅当 `raw != null` 且 `codePointLength(raw.trim()) > 20` 时返回完整 `trim` 后描述，否则 `null`。作用于①探针端下拉候选项、②探针端控件中**可见的选中项**。
- **内容**：仅完整未截断的原始 `CLIENT_DESC`；不含 `CLIENT_ID`、不拼接、不加说明。
- **锚点解析**：文档级捕获阶段 `mouseover`/`mouseout` 委托（下拉面板被 Teleport 到 `body`，不在组件子树内）。命中 `.dss-client-popper .el-select-dropdown__item` → 用 `.textContent` 反查唯一候选；命中 `.dss-client-select .el-tag` 时要求 `is-closable`（折叠 `+N` 标签无此类，被排除），取 `.el-select__tags-text` 文本反查。反查命中 0 个（“全部”、ghost、`+N` `聚合文案`）或多个 → 一律不作为锚点。
- **单实例**：同一时刻至多一个 `.dss-q-tt` DOM 节点（`v-if`），快速扫过多候选不堆叠；`hoveredEl` 去重避免同锚点内重复计算；`mouseout` 后 `relatedTarget` 仍在锚点内则不隐藏。
- **安全宽度**：`max-width: min(480px, calc(100vw - 16px))`、`width: max-content`、`white-space: pre-line`、`overflow-wrap: anywhere` → 安全宽度内单行、超出自然换行、不越出视口。
- **不改变几何**：`position: fixed` + Teleport 到 `body`，全程不参与查询栏布局；定位采用“先置 `visibility:hidden` → `nextTick` 测 `offsetWidth/offsetHeight` → `computeTooltipPlacement` → 一次性显示”，无旧坐标残影。
- **不污染表格 Tooltip**：类名 `.dss-q-tt` 独立于页面级 `.dss-single-tooltip`，不复用 `useSnapshotTooltip` 控制器；源库表格 Tooltip（完整原始 `DATA_SOURCE_ID` only）保持既有已批准规则。

实测（`after/after-tooltip.json`，四档视口）：`clientProbe` 10 条 `clientBad=0`（渲染标签与独立码点 oracle 逐字相等；`expectTooltip==gotTooltip`；Tooltip 文本等于完整原始描述；leave 后 `0`；悬停期间控件几何 delta 全 `0`）；`sourceProbe` 8 条 `sourceBad=0`（全部 `gotTooltip=false`）；可见选中项悬停 `1`、`+N` 折叠标签悬停 `0`；`singleTooltips=0`。真实后端（`after-real.json`）逐候选项验证：恰在 `desc>20` 码点的 4 个出现 Tooltip、内容为完整 152/22/38/62 码点原文、离开即消失。

---

## 7. 自动化测试结果

| 项 | 命令 | 结果 | 原始输出 |
|---|---|---|---|
| 定向测试 | `npx vitest run <QueryBar.spec.ts> <format.spec.ts>` | **2 文件 / 72 用例全通过** | `tests/vitest-targeted.log` |
| Feature 全部 | `npx vitest run src/views/data-source-run-state` | **13 文件 / 211 用例全通过** | `tests/vitest-feature.log` |
| 前端全量 | `npm test` | **50 文件 / 800 用例全通过** | `tests/vitest-full.log` |
| 生产构建 | `npm run build`（含 `vue-tsc --noEmit`） | **成功** | `tests/build.log` |
| 空白检查 | `git diff --check` | **exit 0**，无空白错误 | `tests/diff-check.txt` |

新增/修订测试覆盖：码点 19/20/21/22、中文与 emoji 代理对、四字段各自截断与 ASCII `...`、`CLIENT_DESC`/`DATA_SOURCE_ORG` 的 `null`/空串/纯空白规则、候选与可见选中项一致、完整 option value / 查询 emit 参数 / ghost value 不被截断、三个选择器宽度锁定与内部 `min-width:0`、最长值不改变根/wrapper 几何、Tooltip 触发条件与内容、源库与仅超长 CLIENT_ID 不新增 Tooltip、`+N` 不聚合、查询/重置/“全部”互斥与 busy 不回退。

> 组件单测**不替代**浏览器几何测量；本报告几何结论全部来自真实浏览器（§8）。

---

## 8. 四档浏览器几何矩阵与截图索引

视口：`1280×800`、`1700×920`、`1920×1080`、`2560×1440`；状态：`initial_all`、`short_selected`、`long_selected`、`short_to_long`、`long_to_short`、`multi_collapse_tags`、`remove_longest`、`clear_to_all`、`reset`、`panel_open_close`、`tooltip_show_hide`（矩阵内共 16 个命名测量点）。

| 指标 | 1280 | 1700 | 1920 | 2560 |
|---|---|---|---|---|
| client 根/wrapper | 240 / 240 | 240 / 240 | 240 / 240 | 240 / 240 |
| source 根/wrapper | 300 / 300 | 300 / 300 | 300 / 300 | 300 / 300 |
| status 根/wrapper | 200 / 200 | 200 / 200 | 200 / 200 | 200 / 200 |
| 相邻状态最大差值（含 `qBtnX`/`barH`/`groups`） | 0 | 0 | 0 | 0 |
| 相对初值最大差值 | 0 | 0 | 0 | 0 |
| 横向溢出 | 0 | 0 | 0 | 0 |
| 三字段组 `groupsY` | 175.5 | 175.5 | 175.5 | 175.5 |
| 查询栏高度 | 70 | 32 | 32 | 32 |
| Tooltip 计数（关闭 / 悬停 / 离开） | 0 / 1 / 0 | 0 / 1 / 0 | 0 / 1 / 0 | 0 / 1 / 0 |

截图索引（`after/`）：四档全页 `after-<W>x<H>.png`、查询区放大 `after-zoom-initial-*` / `after-zoom-longest-*` / `after-zoom-reset-*`、选中最长项 `after-longest-selected-*`、多选折叠 `after-multi-collapse-*`、清空 `after-clear-*`、重置 `after-reset-*`、Tooltip 可见 `after-tooltip-visible-*`；`1280`/`1700` 另含候选 Tooltip `after-tooltip-candidate-*`、选中项 Tooltip `after-tooltip-tag-*`、`+N` 折叠 `after-tooltip-collapse-*`。

---

## 9. 请求 / 状态机 / 表格 / 其他路由回归

| 场景 | 期望 | 实测 |
|---|---|---|
| 初始加载 | 1 GET | **1** |
| 选择 / 取消 / 清空 / 重置 / Tooltip | 各 0 | **各 0** |
| 查询 | +1 GET，参数完整 | **+1**，`clientId`/`sourceId` 为完整原始值 |
| 三连击 | 单飞行 | **+1** |
| 倒计时走秒 | 0 | **0** |
| 自动刷新到期 | +1 | **+1** |
| hidden 冻结 / 恢复 | 0 / 补发 | **0 / +1** |
| 失败 | 保留旧结果 | 行数 **6→6** |
| 页面写请求 | 0 | **0** |
| Console error | 0 | **0** |

视觉回归（`after/after-regress.json`）：`min-width=1175px`、行高 `49px`、时间单元格 `18` 个且截断 `0`、查询标签 `14px/600/rgb(63,63,70)`、立即刷新 `110px`、`.dss-page`/查询栏背景透明、EP 主题 `--el-color-primary=#409eff` 未变、`.dss-*` 三个 select 齐备。表格 Tooltip：探针 `count=1` 且离开 `0`；源库 `count=1`、文本等于完整原始 `DATA_SOURCE_ID`（`matchesFullId=true`，而单元格显示 ORG）；查询栏 Tooltip 计数 `0`。`/config/data-source`：`dssElements=0`、`dssQtt=0`、`elSelectCount=0`、无 console error → **无样式泄漏**。

---

## 10. 数据库、统计调度器、ZooKeeper、Kafka 边界

- 后端 `13:18:46` 启动（worktree `backend/`，与基线零差异），前端 `13:18:33` 启动；
- `StatsScheduler` `13:18:59` 启动：`initialDelayMs=600000, intervalMs=3600000`；
- **按既有配置正常触发**一轮：`13:28:59.839 Round START | task=LARGE_SCREEN_STATS`；`Round RESULT | correctBatches=1 | errorBatches=1 | correctProcessed=0 | errorProcessed=0 | stopReason=all_caught_up | duration=72ms`；两路 `Caught up`；
- 完整后端日志检索 `INSERT INTO` / `UPDATE` / `MERGE INTO` / `DELETE FROM`：**计数均为 0**（`stats_scheduler_write_status=NOT_OBSERVED`）；
- 本任务**未执行任何手工 DML/DDL**（`manual_database_write_status=ZERO`）、未构造测试数据、未修改调度器配置；
- 真实后端联调已成功（`after-real.json` 为真实数据证据），合成边界样本仅在 CDP 层对 GET 响应做**只读拦截回放**，证据中已明确区分真实数据证据与合成边界证据；
- **ZooKeeper / Kafka 未访问**。证据：`backend/backend-scheduler-observation.txt`。

---

## 11. 文档状态同步与 86/103 条业务行零变化证明

- 同步范围（§6.2 白名单）：`docs/features/README.md` 与 `docs/features/data-source-snapshot-status/` 的 `README.md`/`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md`/`API.md`/`DATABASE.md`；
- 同步内容：把当前 `query_control_interaction_adjustment_implementation_status` 由 `PENDING_FORMAL_IMPLEMENTATION_ON_5173` 更新为本轮实现后的 `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`，并追加本轮实现记录；不改写历史记录、不改 `API.md`/`DATABASE.md` 业务正文、不改任何需求/验收业务行；
- `formal_5173_code_review_status=APPROVED`（上一轮正式实现）与 `project_owner_visual_review_status=CHANGES_REQUIRED` 继续保留；
- 计数：需求 **86**、验收 **103**、全部 `DSS-AC-*` 仍 `NOT_RUN`（`acceptance_not_run_count=103`）。

零变化证明：`docs/base-DSS-REQ-rows.txt`（86 行）与 `docs/base-DSS-AC-rows.txt`（103 行）为 `548e161` 上业务行提取物，同步后重新提取并 `diff`：**为空**，行数仍 `86`/`103`。证据：`docs/`。

---

## 12. Git diff、Commit、Push 与远程一致性

- `git diff --check`：**exit 0**（`tests/diff-check.txt`）；
- 差异文件：仅 4 个白名单前端文件（`793 insertions(+), 17 deletions(-)`），另新增本报告与 evidence 目录；
- Commit 消息：

```text
feat(source-snapshot): stabilize query controls [DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001]
```

- Push：普通 Push 到 `develop`（禁止 force/amend/rebase/merge）；推送后本地 HEAD、`origin/develop`、`git ls-remote` 三者一致且 `ahead/behind=0/0`；
- 具体结果 SHA 见任务外层 `AGENT_TASK_RESULT` 的 `result_commit_id` / `remote_commit_id`。

---

## 13. 主工作区与 prototype worktree 保留证明

- 主工作区 `/agent/cdc-config-platform`：分支 `develop`、HEAD `4222b0a`，其既有未提交修改（6 份 `docs/database/*` 删除、`frontend/` 与 `.claude/settings.local.json`、`agent-env.sh` 等）**全程未修改、未暂存、未提交、未 stash/reset/checkout/clean**；
- `5174` prototype worktree（`/agent/dss-linear-style-prototype-001.BfGw0Z`，HEAD `4222b0a`，detached）及其修改**未被修改或覆盖**；
- 本任务所有写操作均发生在独立 worktree `/agent/dss-query-ctl-impl-001` 内，未触碰上述两处。

---

## 14. 遗留问题与结论

### 14.1 已识别但**未**在本任务内修改的口径冲突（按要求记录，未擅自改正式基线）

`UI.md` §20.6 第二句“`1280` … 须重点核验查询区不溢出、**不换行**、不推动动作按钮”与同文件 §19.7（`DSS-REQ-083` / `DSS-AC-094`）**明确撤回**“`1280` 下所有查询条件与查询/重置必须同处一行”的前提存在表述冲突。

处理口径：以 `ACCEPTANCE.md` 的 `DSS-AC-094` 与 `UI.md` §19.7 为准，把 §20.6 读作“**不因候选文本长度产生额外换行**”。实测支撑：1280 下三个字段组 `groupsY` 恒为 `175.5`（同处一行），仅“查询/重置”按钮组按既有 `flex-wrap` 位于第二行（查询栏高度 `70px`），且该高度在实现前后、以及 16 个内容状态之间 **delta 恒为 0**。本任务**不修改** §20.6 已批准业务正文，仅如实记录冲突与实测证据，供 ChatGPT 复审与项目负责人裁定。

### 14.2 其他边界

- `after/after-viewports.json` 与 `before/before-viewports.json` 逐字节相同——因该脚本只记录几何与未悬停的 Tooltip 计数，二者相同正是“外部几何未变化”的直接证据；截断与 Tooltip 的正向证据见 `after-matrix12.json` / `after-tooltip.json` / `after-real.json` 与截图；
- 本任务未新增 API 路径/参数/响应字段/DTO/VO/错误码，`API.md`/`DATABASE.md` 业务契约零差异；
- **不创建**通用查询列表页 UI 基线。

### 14.3 结论

- 无阻塞性遗留问题；
- 实现状态：`query_control_interaction_adjustment_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`；
- 代码复审：`query_control_interaction_adjustment_code_review_status=PENDING_CHATGPT_REVIEW`；
- 正式验收与人工视觉验收仍 `NOT_RUN`（`acceptance_not_run_count=103`）；
- 下一入口：`CHATGPT_QUERY_CONTROL_INTERACTION_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_REVIEW`。
