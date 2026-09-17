# QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001

> 本文件是本轮**补充分正式验收**的独立报告。它不是对原正式验收报告的改写，也不代表项目负责人最终接受。
> 原报告 `reports/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001.md` 及其证据目录本轮**只读、未修改**。

## 1. 任务与结论

```text
task_code=QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001
branch=develop
expected_base_commit_id=0a1cd99640a5cfa08280a95c23ca3c7231ea6a73
correction_parent_commit_id=b453635ba7ac2183b260a3b31ee79e44cd11cf57
correction_task=QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-CORRECTION-001
chatgpt_correction_review_status=APPROVED
project_owner_manual_tooltip_recheck_status=PASS
supplemental_formal_acceptance_execution_status=PASS
supplemental_acceptance_case_count=21
supplemental_acceptance_pass_count=21
supplemental_acceptance_fail_count=0
project_owner_final_acceptance_status=PENDING
page_migration_status=NOT_STARTED
```

结论：在 `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73` 上，原正式验收 17 项（AC-001～AC-017）逐项重放通过；本轮新增 4 项专项（SA-018～SA-021）通过；21/21 全部 PASS，0 失败。

### 1.1 项目负责人人工复查记录（原样记录，不扩大解释）

```text
project_owner_manual_tooltip_recheck_status=PASS
project_owner_statement=启动好了，我检查了，“快照状态”的Tooltip已经没有问题了
project_owner_final_acceptance_status=PENDING
```

该记录只证明项目负责人对"快照状态 Tooltip 快速划入偶发不显示"这一现象的人工复查结论为 PASS；
**不等于**最终接受、不等于功能收口、不等于任何页面迁移获授权。

## 2. 验收基准与隔离

| 项目 | 值 |
|---|---|
| 验收工作区 | `/agent/query-list-page-shared-tooltip-hover-reliability-correction-001` |
| 工作区 HEAD | `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73`（detached） |
| 工作区 `git status --short` | 空 |
| 远程 `git ls-remote origin refs/heads/develop` | `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73` |
| 三方一致性（任务基准 / 本地 HEAD / 远程） | 一致 |
| 主工作区 | `develop@4222b0a24b927aca6f62ff348fd8549b73d4156c`，116 项任务前既有未提交改动，**保持原样** |
| 注册 worktree 数 | 71（与原验收 70 的差值来自此后新增的隔离 worktree，非删除） |

本轮**未**从主工作区执行验收或写入；**未** reset / stash / clean / 修改 / 删除任何既有 worktree。

## 3. 变更范围（§5 冻结）

`b453635ba7ac2183b260a3b31ee79e44cd11cf57..0a1cd99640a5cfa08280a95c23ca3c7231ea6a73` 严格为 10 个文件：

```text
M docs/baseline/query-list-page-template/MIGRATION.md
M docs/baseline/query-list-page-template/README.md
M docs/baseline/query-list-page-template/SHARED_COMPONENT_DESIGN.md
M frontend/src/components/query-list/types.ts
M frontend/src/composables/query-list/useQueryListTooltip.spec.ts
M frontend/src/composables/query-list/useQueryListTooltip.ts
M frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts
M frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue
M frontend/src/views/data-source-run-state/components/DataSourceSnapshotTable.spec.ts
M frontend/src/views/data-source-run-state/components/DataSourceSnapshotTable.vue
```

10 files changed, 602 insertions(+), 46 deletions(-)。后端、依赖、锁文件、SQL、配置、其他页面、原报告、原证据目录**零改动**。

静态契约确认：

- `QUERY_LIST_TOOLTIP_DELAY_MS === 320` 未变；
- `delayMs` 仅接受有限非负数，无隐式转换，非法值回落 320；
- `delayMs: 0` 不创建定时器、同步成为当前目标；
- 仅表格"快照状态"传 `delayMs: 0`；探针端、源库、查询候选均未传；
- 无参 `hide()` 仍为无条件全局关闭；`hide(key)` 只作用于匹配的等待/当前 key，过期 key 为 no-op；
- 三类触发器 enter/leave 使用同一稳定 key；
- 内容 / 锚点 / `maxWidthPx` / ARIA / 单实例语义不因 delay 改变；
- 命中区未放大，列宽 / 行高 / 内边距 / 状态标签外观字面量未变。

## 4. 原 17 项重放（AC-001～AC-017）

每项均为**本轮在 `0a1cd996` 上重新采集**，未复用旧 PASS。

| 项 | 内容 | 本轮证据 | 结果 |
|---|---|---|---|
| AC-001 | 基准与隔离、服务可用 | 工作区/提交/远程三方一致；后端 `/api/monitor/data-source-run-state/list` 200 | PASS |
| AC-002 | 公共层静态契约 | `index.ts` 导出 6 组件 + 类型 + `useQueryListTooltip`/`QUERY_LIST_TOOLTIP_DELAY_MS`；`types.ts:49 delayMs?: number`、`:81 hide: (key?: string) => void` | PASS |
| AC-003 | 页面壳直接子节点 | 四视口正常态 `childElCount=3`（`HEADER.ql-page__header` / `DIV.ql-q-panel` / `DIV.ql-result-panel`）；首载失败态 2 | PASS |
| AC-004 | 无默认插槽包装层 | `QueryListPageShell.vue:12` `<slot />` 直接位于 `.ql-page` 下 | PASS |
| AC-005 | 按钮宽度四值同锁 | 四视口 查询 62×30 / 重置 62×30 / 立即刷新 110×32；`widthLock()` 共 4 处引用 | PASS |
| AC-006 | ResultPanel 四段 DOM | `__header` / `__error-slot` / `__divider` / `__body` 齐备 | PASS |
| AC-007 | 常驻 Spinner 契约 | `probe-spinner-contract.mjs` 四视口均 `total=58 passed=58 failed=0` | PASS |
| AC-008 | 刷新按钮 `aria-disabled` | `QueryListRefreshToolbar.vue:34 :aria-disabled`，无原生 `disabled` | PASS |
| AC-009 | Tooltip 宿主 / 宽度 / 定位 | `probe-candidate.mjs` 与 FA 采集逐字节一致；候选 4 项有 Tooltip，最大宽度 480，无越界 | PASS |
| AC-010 | `aria-describedby` 关联 | `probe-aria.mjs` `{"total":7,"passed":7,"failed":0}` | PASS |
| AC-011 | 稳定滚动条槽范围 | 声明路由 `content-area is-stable-gutter` / `stable`；未声明路由 `content-area` / `auto` | PASS |
| AC-012 | 参考页等价与生命周期 | `probe-lifecycle.mjs` 输出与 FA 逐字节一致（首载/查询/刷新/失败保留/隐藏暂停/恢复补发） | PASS |
| AC-013 | 测试 | 定向 17 文件 390 通过；全量 55 文件 990 通过；`vue-tsc` 0；`npm run build` 0 | PASS |
| AC-014 | 四视口浏览器回归 | 见 §5 | PASS |
| AC-015 | 严格几何 | 同角色与跨角色各 263 检查 / 0 失败 / 退出码 0 | PASS |
| AC-016 | 原负向控制 | NC1～NC4b 全部复现并逐字节还原，见 §7 | PASS |
| AC-017 | 范围 / 冻结 / 安全边界 | 10 文件范围；标记 48/0/43/9、66/0；原报告与原证据未被改写；DB/ZK/Kafka 边界成立 | PASS |

### 4.1 AC-007 注释

四视口 `probe-spinner-contract.mjs` 结果与 FA 完全一致（58/58）。另一支 `probe-indicators.mjs` 的
`states.querying` 快照存在**采样相位抖动**：本地请求常在轮询取样点之间已完成，同一构建连续三次运行
分别得到 `is-visible / 1 / visible`、`hidden`、`hidden`。这属于测试装置相位伪影，不是产品差异；
确定性的"切换契约"由 `probe-spinner-contract.mjs` 的 MutationObserver 路径覆盖，该路径四视口全绿。
`probe-indicators.mjs` 其余结构字段与 FA 完全一致。

## 5. AC-014：四视口浏览器回归

视口 `1280x800` / `1700x920` / `1920x1080` / `2560x1440`，逐项重放原验收覆盖点：

| 覆盖点 | 结果 |
|---|---|
| 首载 / 查询 / 重置 / 立即刷新 | 正常，见 §4 AC-012 生命周期证据 |
| 按钮 62 / 62 / 110，高度 30（刷新按钮 32） | 四视口一致 |
| Loading 期间按钮与相邻文字零位移 | `probe-spin-visible.mjs` 与 FA 一致（除采样相位字段） |
| 正常态页面壳直接元素子节点 = 3 | 四视口均 3 |
| 首载失败态直接元素子节点 = 2 | 2，无表格、无查询栏、`role=alert` 唯一、出现"数据加载失败" |
| 无默认插槽包装层 | 成立 |
| 表格 / 查询栏 / 刷新区 / Tooltip Host / 路由稳定滚动条槽 | 四视口几何与样式严格一致 |
| 同屏 Tooltip 至多 1 个 | 四视口与探针均 ≤ 1 |
| Tooltip 视口安全最大宽度 | 不越上/下/左/右 |
| 查询候选最大宽度 480 | 实测最大 480 |
| 其他路由 `scrollbar-gutter` 无泄漏 | 未声明路由保持 `auto` |
| 控制台无阻断错误 | 仅验收主动注入 500 产生的一条例外（见下） |
| 业务请求全部 GET | `network.methods=["GET"]` |
| 真实后端数据正常 | 30 行，与后端返回一致 |

首载失败态由本验收**主动注入 500** 触发，属验收注入而非产品错误，已在注入后恢复；
该条 500 日志是采集文件中唯一一条控制台错误。

## 6. SA-018：快照状态即时显示可靠性

全部使用真实指针事件（CDP `Input.dispatchMouseEvent`），**未**在页面上下文调用控制器伪造成功。

| 视口 | 结果 | 首载快速直入 | 查询后快速直入 | 扫行 | 两行往返 | 最大宿主数 |
|---|---|---|---|---|---|---|
| `1920x1080` | PASS 10/10 | 20/20 | 20/20 | 12 行（可见 20）全成功 | 40 次往返 / 80 次进入全成功 | 1 |
| `1280x800` | PASS 10/10 | 20/20 | 20/20 | 12 行（可见 14）全成功 | 40 次往返 / 80 次进入全成功 | 1 |

- 每次进入前先移到表格外安全位置，再快速直入状态背景框中心，**不人为等待**；
- Tooltip 内容断言为当前行原始状态文本（`原始状态：<SNAPSHOT_*>`）；
- 逐帧采样确认任意时刻 `.ql-tooltip` 宿主数 ≤ 1，`violations=0`；
- 首载与一次真实查询后的新记录**均**重复执行；
- 失败次数均为 0。

数据条件说明：本数据集可见状态值种类有限，两行往返固定选取状态互异且可辨识的相邻两行
（DOM 第 13/14 行，对应后端记录顺序）；不存在因数据不足导致的不可观测项。

## 7. SA-019：key 感知关闭与生命周期

### 7.1 单元层

`src/composables/query-list/useQueryListTooltip.spec.ts` 41/41 通过，其中"按 key 关闭（§6.4 / §10.2）"覆盖：

- `hide(当前显示 key)` 关闭当前目标；
- `hide(当前等待 key)` 取消该等待；
- `hide(过期 key)` 不取消新 key 刚建立的等待；
- `hide(过期 key)` 不关闭新 key 的当前目标，也不误清其 ARIA 关联；
- `hide()`（无参）仍然无条件取消等待并关闭当前目标；
- 全局关闭（scroll / resize / visibilitychange）无条件生效，与 key 无关；
- `destroy` 在即时目标与按 key 关闭路径下同样清空并进入终止态。

`DataSourceSnapshotTable.spec.ts` 36/36 通过，覆盖"三类触发器 mouseenter 与 mouseleave 使用同一稳定 key"
"多行扫描：每行离开只带自己的 key，旧行遗留的 leave 不会关掉新行目标""records 替换仍走无参全局关闭"。

`aria-describedby` 关联独立覆盖 4 项：只追加/移除自身 hostId token、保留既有 token、去重、清空后删除属性。

### 7.2 真实浏览器层

`browser-verify.mjs`：`1280x800` PASS 31/31、`1920x1080` PASS 30/30（1280 视口多一项横向滚动关闭）。
通过项涵盖：快速直入 20 次全显示、快速横扫 ≥10 行每个新目标都成为当前目标、两行快速来回 20 轮无随机不显示、
查询/记录替换关闭、resize 关闭、表格容器真实滚轮关闭、页面滚动关闭、横向滚动关闭、
离开后宿主归零且 ARIA 关联清除、全程未出现第二宿主。

## 8. SA-020：公共默认 320ms 冻结

- 控制器省略 delay：319ms 不显示、320ms 才显示（单元）；
- `delayMs` 为负数 / `NaN` / `Infinity` / 非 number：一律不隐式转换，统一退回 320（单元）；
- `delayMs=0`：同步成为当前目标且不创建任何等待定时器（单元）；
- 探针端 / 源库 / 查询候选：快速穿过不显示、连续停留约 320ms 后显示（真实浏览器，见 §7.2）；
- 查询候选 Tooltip 最大宽度仍 480，判定阈值仍是原始 CLIENT_DESC code point 长度 > 20；
- `delayMs: 0` 仅用于表格"快照状态"；

本项无需修改数据库制造数据；三个对照类别在现有数据下**均可观测**并通过，未出现 `NOT_OBSERVABLE_DATA_CONDITION`。

## 9. SA-021：修正范围、文档冻结与项目负责人决策

| 检查 | 结果 |
|---|---|
| 生产源码改动仅 4 个允许文件 | 成立 |
| 测试改动仅 3 个允许文件 | 成立 |
| 基线文档改动仅 3 个允许文件 | 成立 |
| 原验收报告与原证据未被修正提交改写 | 成立（不在 diff 列表内） |
| 模板标记 `48/0/43/9` | 成立（基线正文口径） |
| 设计决策标记 `66/0` | 成立（基线正文口径） |
| `page_migration_status=NOT_STARTED` | 成立 |
| 项目负责人人工复查记录为 PASS | 已记录（§1.1） |
| 项目负责人最终接受仍为 PENDING | 成立 |
| 未声明任何页面迁移授权 | 成立 |

文档中既有的 `FINAL_ACCEPTED_AND_CLOSED` 字样均指**参考页**（"数据同步进度"）或**明令禁止本 Feature 写入**的说明文字，
与本 Feature 状态无关。

冻结计数的口径为**基线正文**（`README.md` / `MIGRATION.md` / `SHARED_COMPONENT_DESIGN.md` / `DESIGN.md` / `UI.md`），
**排除 `reports/` 与 `evidence/`**。这两份目录承载历次与本次验收记录，必然复述标记名；
计入记录目录会使判据随记录书写方式漂移、失去跨轮可比性。该口径下六项计数与上一轮修正任务记录的
`48 / 0 / 43 / 9`、`66 / 0` 逐值一致，冻结未被本轮触碰。命令与完整输出见 SA-021 证据。

## 10. 测试、类型检查与构建

| 项目 | 命令 | 结果 |
|---|---|---|
| 定向测试（17 文件） | `npx vitest run <17 files>` | 17 files / **390 tests** passed，0 failed，退出码 0 |
| 全量测试 | `npx vitest run` | 55 files / **990 tests** passed，0 failed，退出码 0 |
| 类型检查 | `npx vue-tsc --noEmit` | 退出码 0 |
| 生产构建 | `npm run build` | `built in 17.21s`，退出码 0 |

实测数量**高于**修正报告记载（390 > 390 持平、990 > 967），未为凑数修改任何测试；无关键用例被跳过。
本轮未新增或调整测试文件（零 diff）。

## 11. 严格几何（§10.1）

比较口径：`compare.mjs`（`JSON.stringify` 严格等值，阈值 0），
`OMIT_CLS` / `OMIT_OVERFLOW` / `OMIT_SPINNER` 三组已批准差异集未扩大，
`nullPaths()` 守卫保留，`SAME_ROLE` 口径保留。

| 口径 | 基准 | 结果 |
|---|---|---|
| 跨实现角色 | `0d676a7`（`implementation-001/before.json`）vs 本轮采集 | **263 checks / 0 failures / 退出码 0** |
| 同角色 | `ff9bf2b`（`implementation-001/after.json`）vs 本轮采集 | **263 checks / 0 failures / 退出码 0** |

四视口标量键、`body` 几何、`contentArea`、横向滚动宿主语义、按钮几何、页面壳子节点相对/绝对几何、
首载失败态、长短数据切换零位移、稳定滚动条槽、Tooltip 唯一性与越界、网络与控制台均逐值相同。
已批准排除项（如容器高度随行数变化）**未**被私下当作等价断言，排除集未扩大。

## 12. 负向控制（§10.2 / §10.3）

所有变异只发生在 `/tmp/query-list-page-shared-tooltip-hover-reliability-supplemental-fa-001/negctl-frontend/`
这一份运行副本中（`src` 与验收工作区**逐字节相同**，`node_modules` 为符号链接），
在隔离端口 `5273`（`--strictPort`）上验证；**未**写入验收工作区，
**未**进入暂存区 / 提交 / 证据源文件；验收工作区 `git status --short` 全程为空。

### 12.1 原 AC-016 负向控制重放

| 编号 | 变异 | 目标断言与结果 | 还原 |
|---|---|---|---|
| NC1 | `QueryListActions.vue` 内联样式重新定义 `.ql-btn-spinner` | `shared-layer.spec.ts` 2 failed / 14 passed，退出码 1 | 逐字节还原，前向 16/16 通过 |
| NC2 | `QueryListRefreshToolbar.vue` 外部样式改指 `./query-list-spinner-copy.css` | `shared-layer.spec.ts` 1 failed / 15 passed，退出码 1 | 逐字节还原，前向 16/16 通过 |
| NC3 | 运行时给 `.ql-btn-spinner` 注入 `left + 0.001px` | `probe-spinner-contract` `total=58 passed=55 failed=3`，退出码 1 | 运行时注入，无文件变更；前向 58/58 通过 |
| NC4 | `router/index.ts` 给未声明路由加 `stableScrollbarGutter: true` | `compare.mjs` 2 failures（未声明路由 gutter），退出码 1 | 逐字节还原，前向 263/0 通过 |
| NC4b | 运行时克隆出第二个 `[data-ql-tooltip-host]` | `compare.mjs` 2 failures（宿主数 ≤1、探针唯一），退出码 1 | 运行时注入，无文件变更；前向 263/0 通过 |

### 12.2 本轮新增修正专项负向控制

| 编号 | 变异 | 目标断言与结果 | 还原 |
|---|---|---|---|
| NCN1 | 移除表格"快照状态"的 `delayMs: 0` | 单元 `DataSourceSnapshotTable.spec.ts` 1 failed / 35 passed；浏览器 `sa018.mjs` `1920x1080 FAIL 4/10`，快速直入 0/40、往返 0/160，退出码 1 | 逐字节还原；单元 36/36、浏览器 PASS 10/10 |
| NCN2 | 把 `hide(key)` 改回无条件关闭 | `useQueryListTooltip.spec.ts` 恰为 2 项过期 key 保护断言 failed / 39 passed，退出码 1 | 逐字节还原，前向 41/41 通过 |
| NCN3 | 给探针端触发器加 `delayMs: 0` | 单元"探针端与源库不传 delayMs"failed / 35 passed；浏览器 `browser-verify` 恰为"探针端仍为公共默认 320ms"FAIL（29/30），退出码 1 | 逐字节还原；单元 36/36、浏览器 PASS 30/30 |
| NCN4 | 运行时给 `.content-area` 注入 `translateX(0.001px)` | `compare.mjs` **77 failures**，退出码 1（证明比较器零容差） | 运行时注入，无文件变更；前向 263/0 通过 |

全部变异均有 SHA-256 before / mutated / restored 三态记录，还原后与变异前**逐字节相同**。

## 13. 数据与外部系统边界

```text
database_access_status=NONE_EXCEPT_APPLICATION_GET_READS
database_write_status=ZERO
zookeeper_task_initiated_access_status=NONE
zookeeper_write_status=NOT_REQUESTED
kafka_access_status=NONE
```

页面与后端正常 GET 读取允许且已发生；**未**直接连接数据库做查询 / 插入 / 更新 / 删除；
**未**主动执行 ZooKeeper CLI 或读写节点；**未**访问 Kafka；后端启动产生的背景连接未记为本页面依赖。
负向控制使用隔离前端 + 既有后端只读接口，未来自建数据库。

## 14. 服务与生命周期

- 项目负责人当前人工检查环境 `http://192.168.174.70:5173`（vite PID 47425）与 `http://127.0.0.1:8080`
  （java PID 47301）经核实来自 `0a1cd996`，本轮**用作**真实浏览器验收环境且**保持运行、未停止**；
- 本轮为负向控制自行启动的隔离实例监听 `127.0.0.1:5273`（PID 59862，启动器 59848），
  验收结束后**仅按已核实的精确 PID** 停止，端口已释放；父进程 59848 一并退出；
- **未**使用 `pkill` / `killall` / 模糊匹配 / 按端口宽泛杀进程；
- **未**清理任何 worktree。

## 15. 证据目录

```text
docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001/
```

| 证据文件 | 覆盖 |
|---|---|
| `SA-001-baseline-isolation-services.md` | 基准提交、三方一致、隔离工作树、服务版本溯源 |
| `SA-002-017-original-cases-replay.md` | 原 `AC-001`～`AC-017` 在当前提交上的重新采集复现 |
| `SA-018-status-tooltip-immediate-reliability.md` | 快照状态即时显示可靠性（两视口真实指针） |
| `SA-019-key-aware-hide-lifecycle.md` | key 感知关闭与生命周期（单元 + 真实浏览器） |
| `SA-020-default-320ms-freeze.md` | 公共默认 `320ms` 冻结（三类消费者对照） |
| `SA-021-scope-freeze-owner-decision.md` | 修正范围、文档冻结与项目负责人决策 |
| `SA-022-tests-typecheck-build.md` | 定向 / 全量测试、`vue-tsc`、生产构建 |
| `SA-023-four-viewport-regression.md` | 四视口浏览器回归、Tooltip、网络与控制台 |
| `SA-024-strict-geometry.md` | 严格几何零容差（两种角色口径） |
| `SA-025-negative-controls.md` | 原五项 + 本轮四项负向控制与逐字节还原 |
| `SA-026-git-security-boundaries.md` | Git 三态、零 diff 类别、凭据扫描、外部系统与进程收尾 |

大体积日志、截图与构建产物留在
`/tmp/query-list-page-shared-tooltip-hover-reliability-supplemental-fa-001/`，证据目录内为可复核的
Markdown 摘要、命令与关键结果。**未**提交 `/tmp` 日志、构建产物、截图二进制、`node_modules`
或任何敏感配置。

## 16. 边界声明

```text
formal_acceptance_status=SUPPLEMENTAL_EXECUTION_PASS_REVIEW_PENDING
supplemental_formal_acceptance_review_status=PENDING_CHATGPT_REMOTE_GIT_REVIEW
project_owner_final_acceptance_status=PENDING
page_migration_status=NOT_STARTED
```

本报告**不**宣称 ChatGPT 复审通过、**不**宣称项目负责人最终接受、**不**开始任何页面迁移。
