# 查询控件交互调整实现 R1 修正报告

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1`
- 任务类型：前端 R1 定向修正（代码复审 `CHANGES_REQUIRED` 驱动）+ 文档状态同步；**非**视觉重设计、**非**正式验收、**非**批准收口
- 执行日期：2026-09-11
- 分支口径：`develop`
- 前置实现结果提交：`a47988820c797ff60bd7244b2d0f899bd8fc3be5`（ChatGPT 复审 `CHANGES_REQUIRED`）
- 该实现提交的父提交：`548e16147675cdc6013a4d166bf60d7b1b8bda36`
- 批准内容基准提交：`cf9f9eb0240f275cd50eb37546e6d6256892a9f4`
- 被测现场：隔离 worktree `/agent/dss-query-ctl-impl-001-r1`（detached HEAD `a479888`）
- 验收入口：`http://192.168.174.70:5173/monitor/data-source-state`；回归路由 `/config/data-source`
- 证据目录：`evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1/`

> 本报告为**修正任务报告**，不是验收结论。所有 `DSS-AC-*` 仍为 `NOT_RUN`；结果提交 SHA 只在任务外层 `AGENT_TASK_RESULT` 给出。

---

## 1. Tooltip 原身份定位方式与修复前后对照

**修复前（`a479888`）**：`DataSourceSnapshotQueryBar.vue` 用 `matchClientByLabel(label: string)` 把**截断后的可见显示文字**反查回候选：

```ts
function matchClientByLabel(label: string): ClientCandidate | null {
  const hits = props.clients.filter((c) => clientLabel(c) === label)
  return hits.length === 1 ? hits[0]! : null
}
```

锚点解析对下拉行取 `row.textContent`、对已选标签取 `.el-select__tags-text` 的 `textContent`，再喂给 `matchClientByLabel`。

**缺陷**：`clientLabel` 对 `CLIENT_ID` 与 `CLIENT_DESC` 都做 trim + 20 码点截断。当两个候选的**原始 `CLIENT_ID` 与完整 `CLIENT_DESC` 不同**但截断后可见标签逐字节相同时，`matchClientByLabel` 命中 `hits.length = 2`，函数返回 `null` → 两个候选都**丢失 Tooltip**；若实现改为“取首个命中”则会把 B 的描述错显示为 A 的。即“用显示文字当身份键”本身不可靠。

**修复后（R1）**：删除 `matchClientByLabel` 与全部 `textContent` 反查，改按**稳定身份**（原始完整 `CLIENT_ID`）定位：

- 新增 Feature 私有属性常量 `const CLIENT_ID_ATTR = 'data-dss-client-id'`；
- 下拉候选项 `el-option` 直接绑定 `:data-dss-client-id="opt.value"`（Element Plus `ElOption` 未设 `inheritAttrs:false`，该属性透传到渲染出的 `li`）；
- 可见已选项通过 `el-select` 的 `label` slot 拿到 Element Plus 提供的**原始 option value**：`<template #label="{ value, label }"><span :data-dss-client-id="value">{{ label }}</span></template>`；
- 新增 `clientById(id)` 以原始完整 `CLIENT_ID` 精确 `find`；

```ts
function resolveTooltipAnchor(target: HTMLElement): { el: HTMLElement; content: string } | null {
  const row = target.closest('.dss-client-popper .el-select-dropdown__item')
  if (row) {
    const c = clientById(row.getAttribute(CLIENT_ID_ATTR))
    const content = c ? clientDescTooltip(c) : null
    return content === null ? null : { el: row as HTMLElement, content }
  }
  const tag = target.closest('.dss-client-select .el-tag')
  if (tag) {
    if (!tag.classList.contains('is-closable')) return null
    const holder = tag.querySelector(`[${CLIENT_ID_ATTR}]`)
    const c = clientById(holder?.getAttribute(CLIENT_ID_ATTR) ?? null)
    const content = c ? clientDescTooltip(c) : null
    return content === null ? null : { el: tag as HTMLElement, content }
  }
  return null
}
```

`__ALL__`、幽灵项、不存在的值、折叠 `+N` 标签一律返回 `null`（不作为锚点）。**未**做全局 Element Plus DOM 猜测，**未**跨 Feature 覆盖任何属主 DOM。

文件：`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue`。

## 2. 四字段 trim 与 Unicode 截断的统一实现

新增单一纯函数管线（`utils/format.ts`），`CLIENT_ID`/`CLIENT_DESC`/`DATA_SOURCE_ORG`/`DATA_SOURCE_ID` 共用：

```ts
export function normalizeFieldText(value: string | null | undefined): string {
  return value == null ? '' : value.trim()
}
export function displayField(value: string | null | undefined, max: number = FIELD_TRUNCATE_CODE_POINTS): string {
  return truncateCodePoints(normalizeFieldText(value), max)
}
```

- `null`/`undefined` → `''`；其余先 JS `trim()`；
- 计数基于 **Unicode code point**（既有 `truncateCodePoints` 用 `Array.from`，代理对安全）：`≤20` 全量；`>20` 取前 20 码点 + **ASCII `...`**（非 `…`）；
- `clientLabel` / `sourceLabel` 对**每个组成字段分别调用** `displayField`（不先拼接再整体截断）；
- ghost 标签 `` `${displayField(id)}（不在候选内）` ``；
- **仅展示**：`displayField` 的返回值不回流到 option `value`、已选值或查询参数。

业务行依据 `DSS-REQ-085`（`DSS-AC-098`/`099`），未新增需求/验收编号。

## 3. CLIENT_DESC Tooltip 的触发与内容规则

```ts
function clientDescTooltip(c: ClientCandidate): string | null {
  const desc = normalizeFieldText(c.desc)
  if (desc.length === 0) return null
  return codePointLength(desc) > FIELD_TRUNCATE_CODE_POINTS ? desc : null
}
```

- 内容 = **完整** trim 后 `CLIENT_DESC`（等价 `normalizedDesc = String(CLIENT_DESC ?? '').trim()`），**不二次截断**、无无意义首尾空白；
- 仅 `codePointLength(normalizedDesc) > 20` 时出现；
- 覆盖 ①下拉候选 ②控件中可见的已选标签；`+N` 折叠标签、源库字段、状态字段一律无 Tooltip；
- 既有已批准约束保留：单实例、离开即销毁、`max-width: min(480px, calc(100vw - 16px))`、`position: fixed`、不污染表格既有 Tooltip。

## 4. 截断标签碰撞测试结果

合成探针（`synth` 模式，只读、不触库）在候选列表**最前**放置一对冲突项：

| 稳定身份（原始完整 `CLIENT_ID`） | 完整 `CLIENT_DESC` | 可见标签（trim+20 码点） |
|---|---|---|
| `'P'×20 + 'AAA'` | `'D'×20 + 'AAA'` | `PPPPPPPPPPPPPPPPPPPP...（DDDDDDDDDDDDDDDDDDDD...）` |
| `'P'×20 + 'BBB'` | `'D'×20 + 'BBB'` | `PPPPPPPPPPPPPPPPPPPP...（DDDDDDDDDDDDDDDDDDDD...）` |

（两者可见标签逐字节相同 `visibleLabelIdenticalToOther=true`；若用文字反查，B 会被错映射到 A。）

实测（两轮均 `collisionBad=0`）：

- 悬停 A → tooltip 文本 `'D'×20 + 'AAA'`（`wrongIfReverseLookup` 为 `…BBB`，实际未取到）；悬停 B → `'D'×20 + 'BBB'`；
- 每个 hover `tooltipCount=1`、离开后 `tooltipCountAfterLeave=0`、`parentIsBody=true`、tooltip 显隐期间控件几何 `ctrlDelta={client:0,barH:0}`；
- 已选可见项：标签属性 `data-dss-client-id` 分别为 `…AAA`/`…BBB`，tooltip 文本各对应自身完整描述（`selectedProbe.correct=true`）；
- `singleTooltips=0`（未污染表格 Tooltip）。

边界探针：19/20 码点 → 原文无 Tooltip；21/22 码点 → 截断且出现 Tooltip；CJK/emoji 25 码点 → 按码点 20 + `...`；`desc-empty-str`（纯空白）→ 仅 ID；`desc-20`（恰好 20）→ 原文无 `...`。`boundaryBad=0`。

## 5. 1280 文档冲突的具体修正文案及实际布局

**冲突**：`UI.md` 旧文“`1280` … 须重点核验查询区不溢出、**不换行**、不推动动作按钮”与 §19.7 / `DSS-AC-094`（撤回“`1280` 下所有查询条件和查询/重置必须同处一行”这一前提）表述冲突。

**修正文案（负责人批准口径）**：

> `1280` 为最窄口径，须重点核验查询区不溢出、不推动动作按钮，并且**允许查询/重置动作组按既有响应式规则进入第二行**——该换行为既有响应式设计，不是缺陷、回退或阻塞项；选择、取消、清空任意长短选项时，不得额外改变三个下拉框宽度、查询栏高度、既有换行状态或下游控件位置（与 `DSS-AC-094` 口径一致；已撤回“`1280` 下所有查询条件和查询/重置必须同处一行”这一前提）。

**实际布局（四档实测）**：

| 视口 | 查询栏高 | 三个字段组 y | 动作组 |
|---|---|---|---|
| `1280x800`（synth） | `70px` | `[175.5, 175.5, 175.5]`（三字段同处一行） | 第二行 |
| `1280x800`（real） | `72px` | `[175.5, 175.5, 215.5]`（第三个字段组换行，因真实数据区有内滚动条，可用宽 901px） | 第二行 |
| `1700 / 1920 / 2560` | `32px` | `[175.5, 175.5, 175.5]` | 同一行 |

无论是否换行，三下拉宽度恒为 `240/300/200`，跨全部内容状态 `maxAdjacentDelta` 全 `0`；`r1-1280-before-after-layout.txt` 证明 R1 前后该换行布局逐字节相同（既有响应式行为，非本次引入）。

## 6. 当前状态和下一入口修正位置

按 §9 同步以下文件的 §1 元数据（原地更新）+ 追加式变更记录行（历史保留）：

| 文件 | 修正 |
|---|---|
| `docs/features/data-source-snapshot-status/README.md` | 当前状态 + 下一入口 |
| `REQUIREMENTS.md` | §1 元数据“下一入口”行（`CHATGPT_R1_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`）+ §24 追加 R1 变更记录行 |
| `ACCEPTANCE.md` | §1 元数据“下一入口”行 + 末尾追加 R1 变更记录行 |
| `DESIGN.md` / `UI.md` | 状态与下一入口 + R1 变更记录 |
| `API.md` / `DATABASE.md` | `implementation_status` 元数据 + R1 同步记录（业务契约零变化） |
| `docs/features/README.md` | Feature 总索引状态 |

分层状态（均不倒退、不含 `APPROVED`/`IMPLEMENTED_ACCEPTED`/`PASS`/`FORMALLY_ACCEPTED`）：
`requirements_status=APPROVED`（既有批准事实保留）、`query_control_interaction_adjustment_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、
`query_control_interaction_adjustment_code_review_status=PENDING_CHATGPT_REVIEW`、`formal_acceptance_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`。

业务行零变化：`git diff` hunk 仅 `@@ -34 +34 @@`（元数据）与 `@@ -496,0 +497 @@`（追加行），`DSS-REQ-001~086` 共 86 行、`DSS-AC-001~103` 共 103 行业务行逐字节不变。

## 7. 定向、Feature、前端全量、build、diff-check 结果

| 项 | 命令 | 结果 | 证据 |
|---|---|---|---|
| 定向 | `npx vitest run format.spec.ts DataSourceSnapshotQueryBar.spec.ts` | **2 文件 / 102 用例通过**（81 + 21），`EXIT_CODE=0` | `tests/vitest-targeted.txt` |
| Feature | Feature 全量 | **13 文件 / 241 用例通过**，`EXIT_CODE=0` | `tests/vitest-feature.txt` |
| 全量 | `npm test` | **50 文件 / 830 用例通过**，`EXIT_CODE=0` | `tests/vitest-full.txt` |
| 构建 | `npm run build`（含 `vue-tsc --noEmit`） | **成功**（`✓ built in 28.51s`），`EXIT_CODE=0` | `tests/build.txt` |
| 空白检查 | `git diff --check` | **exit 0**，无空白错误 | `tests/diff-check.txt` |

## 8. Git 中实际存在的原始日志文件清单

R1 重新执行并以 `.txt` 提交（`git check-ignore` 证明 `.txt` 不被忽略、`.log` 被 `.gitignore:30` 忽略）：

```text
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1/tests/vitest-targeted.txt
…/tests/vitest-feature.txt
…/tests/vitest-full.txt
…/tests/build.txt
…/tests/diff-check.txt
```

上一次实现证据索引声称的 `vitest-targeted.log`/`vitest-feature.log`/`vitest-full.log`/`build.log` **从未进入 Git**（根因 `.gitignore:30 *.log`）。R1 已在 `…-IMPLEMENTATION-001/README.md` 追加更正段（不删除原行）、并在 R1 证据 `README.md` §1 给出取代/补充关系。既有证据文件未改写。

## 9. 四档浏览器几何、Tooltip、请求和截图哈希结果

- 几何：三下拉 `240/300/200` 恒定，`maxAdjacentDelta` 全 `0`，`maxHorizontalOverflow=0`；
- Tooltip：碰撞探针各显自身完整描述、单实例、离开销毁、父节点为 `body`、无几何位移（见 §4）；
- 请求状态机：`apiTotal=5`、`initialLoad=1`、`afterReset=0`、`afterOpenClose=0`、`afterHoverTooltip=0`、`queryClickDelta=1`；查询参数为完整原始标识（synth `clientId=PPPPPPPPPPPPPPPPPPPPAAA`、real `clientId=c-dssr1-0906-a`）；`nonGet=[]`；
- Console：`consoleErrors=0`；其他路由 `/config/data-source`：`dssElements=0`、`elSelect=0`；
- 截图：104 张（2 模式 × 13 状态 × 4 视口），`browser/r1-screenshot-hashes.txt` 逐张标注操作与稳定身份。`initial` vs `longest` 在 8 组全部不同；`collision-cand-A` vs `collision-cand-B` 在 4 档全部不同；“预期相同”分组（`other-route` synth=real、`tooltip-tag-*` 在 ≥1700 的同模式裁剪图）已在索引中说明原因。

## 10. 数据库、调度器、ZooKeeper、Kafka 状态

- `manual_database_write_status=ZERO`：本任务未执行任何手工 DML/DDL、未构造测试数据；
- `stats_scheduler_status=TRIGGERED`：`StatsScheduler`（`initialDelayMs=600000, intervalMs=3600000`）于 `13:18:59` 启动，本任务窗口内正常触发 4 轮 `LARGE_SCREEN_STATS`（`13:28:59 / 14:28:59 / 15:29:00 / 16:29:00`）；
- `stats_scheduler_write_status=NO_WRITE_OBSERVED`：每轮 `stopReason=all_caught_up, correctProcessed=0, errorProcessed=0`；后端日志写语句计数 `=0`；`CDC_STATS_WATERMARK` 最近更新 `2026-08-25`（早于窗口）；`CDC_DATA_SOURCE_RUN_STATE` 30 行、`max(updated_at)=2026-09-06 11:02:00` 未变；
- `zookeeper_access_status=NONE`、`kafka_access_status=NONE`（未访问）。

证据：`database/scheduler-observation.txt`。

## 11. 修改文件清单与范围证明

**业务代码（4，全部在白名单）**：

```text
frontend/src/views/data-source-run-state/utils/format.ts
frontend/src/views/data-source-run-state/utils/format.spec.ts
frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue
frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts
```

**文档同步（8 + 新增报告 + 证据目录）**：

```text
docs/features/data-source-snapshot-status/{README.md,REQUIREMENTS.md,ACCEPTANCE.md,DESIGN.md,UI.md,API.md,DATABASE.md}
docs/features/README.md
docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1.md  （新增）
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1/**                    （新增证据目录）
docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001/README.md              （按 §13.5 追加更正段，不删原行）
```

**范围证明**：`git diff --stat` 恰 12 个已跟踪文件（8 文档 + 4 代码）；`git diff` 中 `DataSourceSnapshotQueryBar.vue` **无任何 CSS/几何规则改动**，仅为标签绑定、身份解析与纯函数复用；未改后端/SQL/数据库/全局 Element Plus 样式/其他路由/表格组件/Tooltip 控制器。白名单外**无**业务代码改动。

## 12. Commit、Push、远程一致性和工作区保护证明

- 单次普通提交（不 amend），提交信息含任务编号；仅暂存上述授权路径；未用 `git add .`/`-A`；
- 推送前再次 `git fetch`：仅当 `origin/develop` 仍为 `a479888` 且可安全快进时普通推送到 `develop`；否则停止；
- 推送后核对本地 HEAD、`origin/develop`、`git ls-remote origin develop` 三者一致、ahead/behind `0/0`；
- 主工作区 `/agent/cdc-config-platform`（`4222b0a`，116 处既有变更）与 prototype worktree（`4222b0a`，13 处既有变更）全程保留，未 stash/reset/checkout/clean/覆盖。
- 具体 SHA、push 状态与 ahead/behind 见任务外层 `AGENT_TASK_RESULT`。

## 13. 正式验收与人工视觉验收状态

**正式验收与人工视觉验收仍为 `NOT_RUN`。** 本任务未执行任何 `DSS-AC-*` 验收、未把任何验收改为 `PASS`、未写入 `APPROVED`/`IMPLEMENTED_ACCEPTED`/`COMPLETED`/`FORMALLY_ACCEPTED`。下一入口为 `CHATGPT_R1_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`。

---

## 附：AGENT_TASK_RESULT

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1
branch=develop
base_commit_id=a47988820c797ff60bd7244b2d0f899bd8fc3be5
result_commit_id=<见任务外层结果>
remote_commit_id=<见任务外层结果>
commit_status=COMMITTED
push_status=<见任务外层结果>

tooltip_stable_identity_status=PASS_SELF_TEST
truncated_label_collision_status=PASS_SELF_TEST
four_field_trim_status=PASS_SELF_TEST
unicode_truncate_status=PASS_SELF_TEST
client_desc_tooltip_normalized_full_content_status=PASS_SELF_TEST
full_value_query_semantics_status=PASS_SELF_TEST

select_fixed_width_status=PASS_SELF_TEST
select_width_state_delta_px=0
query_bar_height_content_delta_px=0
responsive_1280_contract_status=CONSISTENT_WITH_OWNER_APPROVED_WORDING
current_document_navigation_status=SYNCED

targeted_test_status=SUCCESS_2FILES_102TESTS
feature_test_status=SUCCESS_13FILES_241TESTS
frontend_full_test_status=SUCCESS_50FILES_830TESTS
frontend_build_status=SUCCESS
git_diff_check_status=SUCCESS
committed_raw_test_build_evidence_status=COMMITTED_AS_TXT
screenshot_distinct_state_evidence_status=SUCCESS

browser_1280x800_status=PASS_SELF_TEST
browser_1700x920_status=PASS_SELF_TEST
browser_1920x1080_status=PASS_SELF_TEST
browser_2560x1440_status=PASS_SELF_TEST
browser_console_status=ZERO_ERRORS
browser_network_write_status=ZERO_NON_GET
request_state_machine_regression_status=PASS_SELF_TEST
other_route_style_leak_status=NO_LEAK

requirements_count=86
acceptance_count=103
formal_acceptance_not_run_count=103
query_control_interaction_adjustment_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW
query_control_interaction_adjustment_code_review_status=PENDING_CHATGPT_REVIEW
formal_acceptance_status=NOT_RUN
human_visual_acceptance_status=NOT_RUN

frontend_code_diff=4_FILES
backend_code_diff=ZERO
api_contract_change_status=NONE
database_contract_change_status=NONE
manual_database_write_status=ZERO
stats_scheduler_status=TRIGGERED
stats_scheduler_write_status=NO_WRITE_OBSERVED
zookeeper_access_status=NONE
kafka_access_status=NONE

main_worktree_preservation_status=PRESERVED
prototype_worktree_preservation_status=PRESERVED
remote_sync_status=<见任务外层结果>
evidence_path=docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-IMPLEMENTATION-001-R1/
next_step=CHATGPT_R1_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW
error=
AGENT_TASK_RESULT_END
```
