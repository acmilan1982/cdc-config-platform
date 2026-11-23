# 数据源行选中 4175 验收后复审与本地收口

- 任务编号：`DATA-SOURCE-ROW-SELECTION-4175-ACCEPTANCE-CLOSEOUT-001`
- 日期：2026-11-23
- 性质：页面级人工验收记录 + 只读业务复审 + 本地候选收口。未合入、未推送、未部署。
- 关联证据：`/agent/task-checkpoints/data-source-row-selection/production-retest/`（生产构建复测与最小实验证据）、`/agent/task-checkpoints/data-source-row-selection/`（R2 诊断现场）。

## 1. 已确认的人工验收

2026-11-23，项目负责人在 Windows Chrome 上对生产构建候选
`http://192.168.174.70:4175/config/data-source` 完成实际操作复验，三项均无问题：

1. 首次选中、跨行切换、再次单击取消，普通列与固定操作列的高亮一致。
2. 横向滚动时高亮一致；查询后旧高亮清除。
3. A 行选中时打开 B 行三点菜单，操作对象仍为 B；核对删除确认框后取消；双击单元格打开对应行的编辑框。

以上记为**该项目候选的人工验收通过**。Windows 本轮是实际操作验收，**未采集毫秒值**；
服务器无头 Chromium 的 35/35 自动化、定向测试 327 与性能数据单独记录，不混同为真机时延。
服务器测得的跨行切换 `367.8 → 0.6 ms` 是 DOM 反馈代理指标，不是 Windows 实际帧时延。

## 2. 被验收候选与最终候选的对应关系

| 项 | 值 |
|---|---|
| 人工验收的 4175 运行版本 | `f04621711c0504dc1d59d9e426b4b1c241194501` + 已校验实验补丁（仅 `DataSourcePage.vue`，36+/3-） |
| 实验补丁 | `/agent/task-checkpoints/data-source-row-selection/production-retest/report/experiment-DataSourcePage.patch` |
| 最终候选分支 | `ui/data-source-row-action-ellipsis` |
| 最终候选最新提交 | `526f33b74addd9ea237bc8806e79aa111d6bced8`（性能优化） |
| 相对远端 `develop`（`4eac2b9ade3f914143eab50b33d2a851d987a202`）提交链 | `c33572c137cae431402c75159fa3841c0f929fb4`（三点入口）→ `67d74b5cd2e22317c23a4915e9ef9c249cd2a082`（公共单行高亮接入）→ `f04621711c0504dc1d59d9e426b4b1c241194501`（R2 点击对齐）→ `526f33b74addd9ea237bc8806e79aa111d6bced8`（本轮性能优化） |
| 版本一致性 | 最终候选源码相对 `f046217` 的差异与 4175 实验补丁**逐字节一致**；生产构建入口均为 `assets/index-CbNUNwKx.js` |
| 结论 | 本轮提交只把已验收实现纳入候选，**未改变**已验收的视觉或交互；不需要复验 |

## 3. 代码复审结论

复审对象：`526f33b` 相对 `f046217` 的单文件差异（`frontend/src/views/data-source/DataSourcePage.vue`）。

- **目的**：让 `rowClassName` 不再读取响应式 `selectedDataSourceId`，改用非响应式镜像
  `highlightedDataSourceId` 返回行级类；选中变化时命令式只增删旧行/新行的
  `lt-row-highlight__row`，避免整张表体随选中重渲染。
- **选中 ID 与行 DOM 同步**：主路径使用点击事件 `event.target.closest('tr.el-table__row')`
  取得实际行元素，天然按被点击行同步；无事件时按稳定 `dataSourceId` 在 `rows` 中定位索引，
  再取对应已渲染行。页面**不支持排序**（无 `sortable`），表格无虚拟滚动、全部行已渲染，
  索引与 `rows` 顺序一致，回退路径当前安全。
- **重渲染与列表替换**：`loadList`（查询/重置/启停/删除后刷新）先清除待定计时器、
  置空选中与镜像，再替换 `rows`；任何重渲染时 `rowClassName` 按稳定 ID 返回类，
  旧高亮不会残留、新高亮落在正确行。
- **作用域与固定列**：DOM 查询以页面唯一的 `.data-table` 为界；弹窗内表格为
  `.naming-table`，不受影响。Element Plus 固定右列与普通列位于同一 `<tr>`（sticky），
  一个行级类同时覆盖普通列与固定操作列。
- **悬空引用与定时器**：不持久保存 DOM 引用（同步函数内即时使用）；`onBeforeUnmount`
  已清理 `pendingCancelTimer`；无 keep-alive 复用。
- **事件与可访问性**：三点触发器 `@click.stop` 与键盘打开逻辑未改；行点击/双击、
  菜单事件隔离、删除确认与编辑入口语义保持不变。
- **结论**：`review_status=PASS`，未发现需要修复的缺陷，本轮未新增代码修改。

## 4. 实跑验证（最终候选，生产构建）

最终候选在独立工作树 `/tmp/cdc-row-action-ellipsis` 实跑：

| 项 | 结果 |
|---|---|
| 生产构建 | `npm run build`（`vue-tsc --noEmit && vite build`）通过；入口 `assets/index-CbNUNwKx.js` |
| `git diff --check` | 通过 |
| 定向测试 | `dataSource.spec.ts`(123) + `ClientConfigPage.spec.ts`(189) + `list-table-visual.spec.ts`(15) = **327/327 通过** |
| 生产构建回归（4176，本地） | **35/35 通过**：颜色（普通列/固定列选中、悬停、强调线）、A→B→A、约 260ms 取消、双击编辑对象、三点菜单不改变选中、删除确认对象为当前行且取消零写请求、查询清选且无迟到计时器、重置、横向滚动固定列、探针页不变、全程 **0 个非 GET 请求** |
| 排序 | 页面不支持排序，**N/A** |
| 写操作 | 真实预览中删除仅打开确认框并取消、编辑未保存；全流程无业务写请求 |

## 5. 性能依据（同环境方法，服务器无头 Chromium）

| 场景 | R2 `f046217`（中位） | 最终候选 `526f33b`（中位） |
|---|---|---|
| 数据源首次选中 class | 385.8 ms（262.4–430.3） | 0.6 ms（0.5–1.3） |
| 数据源 A→B 切换 class | 367.8 ms（253.0–590.9） | 0.6 ms（0.4–0.9） |
| 数据源取消端到端 | 596.6 ms（510.9–823.6） | 261.5 ms（260.8–265.4） |
| 取消窗口外额外开销 | 336.6 ms（250.9–563.6） | 1.5 ms（0.8–5.4） |
| 探针首次/切换/取消 | 102.8 / 99.1 / 375.4 ms | 79.7 / 68.2 / 325.4 ms（250ms 渐显保留） |

生产 CPU profile（R2）显示耗时集中在 Vue/Element Plus 表体 `runIfDirty → render → wrappedRowRender`
（约 384.8 ms），与单元格数近似线性；优化后同一操作不再触发整表渲染。上表为可见反馈代理指标，
Windows 真机时延未采集。

## 6. 文档收口范围

本次收口两项**页面级事实**（不改变模板契约、令牌或正式验收统计）：

1. **数据源管理采用水平三点入口**：操作列唯一行操作入口由文字“更多”改为水平三点，
   保留原菜单项、顺序、禁用条件、点击区域、键盘打开与读屏“更多操作”名称。
2. **数据源主列表采用公共单行高亮**：主列表显式挂载 `.lt-main-table` + `.lt-row-highlight`
   与行级 `.lt-row-highlight__row`；单击固定一行、再点取消、点他行转移、双击编辑；
   查询/刷新清除高亮；固定操作列与普通列同色。

同步位置：本报告；[README.md](../README.md) §2.6/§5；[UI.md](../UI.md) §10.3；
[ACCEPTANCE.md](../ACCEPTANCE.md) §4.16 局部替代提示；
`docs/baseline/list-management-page-template/README.md` §0.5/§2/§3/§4/§6；
`docs/baseline/list-table-visual-template/README.md` §8.6 与文档状态行。
历史报告、历史状态值与既有正式验收口径（含 `DS-AC-116~140` 的 `NOT_RUN`）逐字保留。

## 7. 边界与未执行项

- **未合入 `develop`、未推送、未部署**；合入审查由项目负责人另行授权。
- 未修改公共契约、令牌、其它页面或模板级迁移状态；模板级页面迁移仍为 `NOT_GRANTED`。
- 新增/编辑主弹窗接入 `ced-dialog` 另立任务，本轮未改。
- 仅做只读业务验证；未执行数据库或 ZooKeeper 写操作，未发送业务写请求。
- Windows 真机未采集毫秒值；服务器数据为无头 Chromium 代理指标。
