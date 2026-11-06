# 005 参考页与历史证据索引

依据 005 任务提示词：AC-120/134 的参考页条件仅从可溯源、可比且仍适用的已入仓运行证据满足；不打开、不操作 `/config/data-source` 或其他页面。

## 1. AC-120 参考页：数据源管理主提交按钮

- 证据提交：`935478a`（`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`）
- 证据文件：`docs/features/data-source-management/evidence/DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001/06-browser-evidence.md`
- 关键 JSON / 章节键：`§3.3 提交按钮（DS-AC-197/198）`、`ds-ac-197-198.json`、`ds-ac-197-198-realstates.json`、`ds-ac-197-disabled.json`
- 运行条件（证据原文）：Google Chrome 148.0.7778.167，headless，视口 1440×900，`dsf=1`，100% 缩放，CDP 真实计算样式
- 参考值：
  - 常态：`bg=rgb(9,9,11)`、`color=rgb(255,255,255)`、`radius=6px`、`weight=500`
  - `:hover` / `:focus`：`bg=rgb(39,39,42)`
  - `:active`：`bg=rgb(24,24,27)`
  - 加载中：`class` 含 `is-loading`、`hasSpinner=true`、`color=rgb(255,255,255)`、`bg=rgb(9,9,11)`
- 实现与基线：参考实现提交 `807a5a5`（2026-09-20），验收基线 `db1cfda`，jar SHA256 `1150fb57…`（证据原文）
- 仍适用性核对：
  - `git blame -L 1724,1741 frontend/src/views/data-source/DataSourcePage.vue` → `.editor-submit-button` 的常态/hover/focus/active 规则自 `807a5a5` 起未变
  - 参考页后续提交 `c6d752c`（模板共享视觉接入）与 `55e6273` 未改动这些行
  - 版本差异：参考证据为 Chrome 148，本次为 Chrome 147；计算样式值一致，记录该差异不构成阻断

## 2. AC-120 同一弹窗的历史轮次证据（辅助）

- 证据提交：`d878c3d`（`CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001`）
- 证据文件：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001/dialog-adoption-results.json`
- 键：`values.createDialog.submitNormal`、`values.createDialog.states.submitHover/submitFocus/submitActive`、`values.createDialog.submitLoading`、`values.editDialog.submit`
- 运行条件：Chrome 147.0.7727.15，视口 1280×900
- 值：常态 `rgb(9,9,11)` / `#fff` / `6px` / `500`；hover/focus `rgb(39,39,42)`；active `rgb(24,24,27)`；loading `rgb(63,63,70)` + `is-loading` + spinner
- 与本次实测的创建模式一致；本次新增真实 HTTP 忙碌窗口、防重复与独立回读。

### 2.1 AC-120 忙碌态来源分列（新增 vs 编辑）

- **新增模式**：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-DIALOG-ACCEPTANCE-005/results/probeB-write.json → sections.busy`（`snapshots` 在 129/557/2113/3656 ms；`gateDelayMs=5000`、`isRealHttpDelay=true`；`blueDetected=false`）与 `sections.requestLedger`（`apiRequestMethods.POST=2`）。5000 ms 为受控网络延迟；多时点采样仅覆盖新增模式。
- **编辑模式 ①**：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004-R1/results/r1b-write-dedup.json → flows.edit`（`busyState`、`duplicateAction`、`putCount=1`、`response` 200/200、`readback`）。`duplicateAction.deltaAttempts` 中唯一一条 `PUT /api/clients/CCFG004-NEW1` 的时间戳 `1793883054470` 早于重复点击 `1793883055183`，是已存在的首笔请求，不是第二笔。
- **编辑模式 ②**：固定提交 `242cc5cf878216ef6e020effc539ee742c87a35c` 的 `docs/features/client-config/reports/evidence/CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001/group-e-results.json → ac115.submitting.inFlight`：`loadingVisible=1`、`textWhileLoading="保存"`、`backgroundColor/borderColor="rgb(63, 63, 70)"`、`color="rgb(255, 255, 255)"`。该记录是编辑忙碌态快照，不是完整颜色时序。

## 3. AC-134 参考页与范围不变性

- 参考页运行时条件沿用第 1 节证据（同一 `06-browser-evidence.md`）。
- 本任务未补做跨页操作；参考页实际运行覆盖引用已入仓证据。
- 固定 Git 区间审计见 `results/ac134-git-audit.json`（探针 C）：
  - 区间：`3d4cec1^..9b1bf9f`（102 个 client-config 归属提交）
  - `referencePageTouchedByClientConfig=[]`
  - `otherFeatureTouchedByClientConfig=[]`
  - `globalComponentsTouchedByClientConfig=[]`
  - `backendOutsideClientConfigTouchedByClientConfig=[]`
  - `dbDefinitionTouchedByClientConfig=[]`
  - client-config 工作区相对基线的 `backend frontend` diff 为空
- 共享模板路径的归属说明：
  - `docs/baseline/create-edit-dialog-visual-template/*` 与 `frontend/src/styles/dialog/*.spec.ts`：仅由已批准的首次接入轮次（`d878c3d` 等）更新
  - `docs/baseline/list-table-visual-template/*`：模板侧批准/收口轮次的文档更新；`d93f838` 的 CSS 仅新增 `.lt-main-table` 限定、显式 opt-in 的两条辅助规则，未新增 `--lt-*` 令牌、无全局覆盖、无 `!important`
  - `docs/baseline/query-list-page-template/MIGRATION.md`：仅页面迁移状态文档
