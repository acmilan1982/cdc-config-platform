# 探针端管理主列表第二轮视觉调整 · 实现任务执行报告

> 任务代码：`CLIENT-CONFIG-VISUAL-FOLLOWUP-IMPLEMENTATION-001`
> 任务类型：前端实现（`/config/client` 主列表五项视觉调整）
> 分支：`develop`
> 起始提交：`81bb8f172f612a2a6edf91181c59b4388da2c999`
> 上游门禁：ChatGPT 远程 R1 复审 `APPROVED`（对象提交 `3830cba16142b4e2ad88f1fa96682ea8397a1203`）；项目负责人 2026-09-23 批准第二轮五项视觉调整基线（`adjustment2_approval_status=APPROVED_BY_PROJECT_OWNER`）
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_IMPLEMENTATION_REVIEW`
> 本任务不执行正式验收，不作出项目负责人目测通过或最终接受结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=81bb8f172f612a2a6edf91181c59b4388da2c999
actual_base_commit=81bb8f172f612a2a6edf91181c59b4388da2c999
baseline_status=APPROVED
approval_status=APPROVED_BY_PROJECT_OWNER
approved_reviewed_commit=3830cba16142b4e2ad88f1fa96682ea8397a1203
page_level_authorization=GRANTED_FOR_CONFIG_CLIENT_MAIN_LIST_ONLY
template_level_page_migration_status=NOT_STARTED
template_level_page_migration_authorization_status=NOT_GRANTED
```

- 本地 `HEAD` 与任务预期起始提交一致，工作区起点干净（除任务开始前已存在的无关修改外）。
- 任务开始时已存在、**全程未修改/未暂存/未提交**的无关修改：已修改的 `.claude/settings.local.json`、未跟踪的 `docs/prompts/**`。
- 已按 `CLAUDE.md` §3.1 完整读取六份项目级基线，按 §3.2 读取本轮功能级基线，按 §3.4 读取查询列表页模板三份基线文档（`README.md`/`SHARED_COMPONENT_DESIGN.md`/`MIGRATION.md`）——因本轮涉及公共交互（操作列“更多”入口）的**页面级**修改。
- 未执行 `git pull` / `fetch` / `merge` / `rebase` / `reset` / `clean` / `stash` / `checkout --`，未改写历史，未强推。

## 2. 实际文件清单

### 2.1 代码与测试（实现范围）

| 文件 | 变更性质 |
|---|---|
| `frontend/src/views/client-config/ClientConfigPage.vue` | 主列表五项视觉调整实现（重写） |
| `frontend/src/views/client-config/ClientConfigPage.spec.ts` | 组件测试同步替换与新增（重写） |
| `frontend/src/views/client-config/listLayout.ts` | 导出 `CHIP_BOX` 标签盒模型常量，供页面与测试共用 |

**关于 `listLayout.ts` 的扩展说明（按提示词要求显式说明范围与理由）**：该文件是本页已有的标签排版工具模块，本轮第 ④ 项“标签尺寸变更后须同步核准测量盒模型”要求测量基准与运行时渲染一致。为避免页面样式与测试断言各写一份盒模型导致漂移，新增一个 `CHIP_BOX` 导出常量（`fontSize/lineHeight/paddingX/borderWidth/maxEm`），页面用它调用既有 `measureChipWidth`，测试也引用同一常量校准。**未新增**任何平行实现，**未**改动 `measureChipWidth` 的既有行为（仅其 `fontWeight` 已支持由参数传入）。未修改数据源管理参考页、两套公共模板实现、路由/菜单、前端 API 类型与接口、后端代码、数据库对象、DDL 或构建依赖。

### 2.2 当前状态文档（最小同步）

| 文件 | 变更性质 |
|---|---|
| `docs/features/client-config/README.md` | 状态表行、§1.4 分层状态、新增 §1.6 实现小节、§2 导航与报告表、§4/§5 追加记录 |
| `docs/features/client-config/REQUIREMENTS.md` | 元数据状态行、§7.11 现行状态注记、§10 变更记录追加 |
| `docs/features/client-config/ACCEPTANCE.md` | §1.6 状态表与下一入口行、用例状态与状态区分说明、§6 变更记录追加 |
| `docs/features/client-config/DESIGN.md` | 状态行、§14 现行状态段、§15 变更记录追加 |
| `docs/features/client-config/UI.md` | 状态行、§16 草案块历史标注与现行状态段、§17 变更记录追加 |
| `docs/features/client-config/reports/CLIENT-CONFIG-VISUAL-FOLLOWUP-IMPLEMENTATION-001.md` | 本实现报告（新建） |

五份 Feature 文档仅同步**当前实现状态**、导航与追加执行记录；未改写任何定义行、未改写历史报告、未修改 `API.md`/`DATABASE.md`/`docs/features/README.md`/`docs/baseline/**`/`docs/prompts/**`。

## 3. 设计映射（已批准基线 → 实现）

| 设计编号 | 需求 | 验收 | 实现方式 |
|---|---|---|---|
| `CCFG-UI-036` | `CCFG-REQ-104` | `CCFG-AC-090` | `.cc-btn-add:not(.is-disabled)` 黑色实心：`#09090b` 底与边框、白色文字、圆角 6px、字重 500；保留加号图标/文案/位置/新增行为；查询/重置与禁用态视觉未动 |
| `CCFG-UI-037` | `CCFG-REQ-105` | `CCFG-AC-091` | `.cc-id` 字重 600、颜色 `#09090b`；紧随其后的“停用”标记与历史异常 `异常：{原值}` 标记样式、文案与 Tooltip 保持不变 |
| `CCFG-UI-038` | `CCFG-REQ-106` | `CCFG-AC-092/093` | 移除本页主表固定像素行高，行高由公共视觉预设 `td.el-table__cell{padding:12px 0}` 与内容决定；未改公共模板/全局预设/弹窗内表格 |
| `CCFG-UI-039` | `CCFG-REQ-107/108/109` | `CCFG-AC-094~099` | `.cc-dstag` 借用“角色”标签语言（高度 20px、字号 12px、字重 600、圆角 4px、无边框、柔和底色）并采绿/红/中性三态：项级 `anomalies` → `--bad` 红；否则整行 `COMMA_PROTOCOL_AMBIGUOUS` → `--neutral` 中性；否则 `--ok` 绿。独立行级歧义警示 `.cc-rowbad` 保持红色与原文案/Tooltip。`+N` 测量基准改用 `CHIP_BOX` |
| `CCFG-UI-040` | `CCFG-REQ-110` | `CCFG-AC-100` | 操作列**全部行**唯一入口由“更多”文字改为水平三点图标 `.cc-more-link`（28×28 命中区、`:focus-visible` 可见焦点、可访问名称 `更多操作：{探针ID}`）；三态条目不变（`'1'` 停用/删除、`'0'` 启用/删除、历史异常 停用/删除） |
| `CCFG-UI-041` | `CCFG-REQ-111` | `CCFG-AC-101/102/103` | 菜单 `radius 8px`、弥散阴影、`padding 4px`、条目 Hover/焦点反馈；`divided` 分隔线将红色“删除”单独隔开；键盘可操作；点击/双击触发器与菜单内交互均不触发行双击编辑；菜单不被右边缘裁切 |
| `CCFG-UI-042` | `CCFG-REQ-112` | `CCFG-AC-093/104` | 探针描述列宽、六列顺序、横向滚动、既有省略规则、最右固定操作列、刷新能力缺席、CRUD 合同均未变 |

## 4. 验证证据

### 4.1 环境预检

```text
node=v24.17.0   npm=11.13.0
chrome=148.0.7778.167
env_check_status=SUCCESS
```

### 4.2 定向测试

```text
cd /agent/cdc-config-platform/frontend
npx vitest run src/views/client-config/ClientConfigPage.spec.ts
→ 110 passed (110)
```

新增覆盖：采集数据源标签三态取色与优先级（含“项级异常优先于整行歧义、绝不降级为中性”与混合行内逐项独立取色）、静态三态底色/字色但中性色区别于红绿两态、独立行级歧义警示仍为红且文案不变、`+N` 槽位与标签同盒模型、`+N` 数值随测量宽度重算（宽度基准变更后不残留旧值）、三态菜单与菜单事件隔离（点击/双击触发器不触发编辑）。

### 4.3 全量前端测试

```text
cd /agent/cdc-config-platform/frontend
npm test
→ Test Files 57 passed (57)
   Tests      1090 passed (1090)
```

### 4.4 前端构建

```text
cd /agent/cdc-config-platform/frontend
npm run build   # vue-tsc --noEmit && vite build
→ vue-tsc 无错误；vite build 成功
  仅有既有（非本任务引入）的 >500 kB chunk 体积提示
frontend_build_status=SUCCESS
```

### 4.5 浏览器只读实机核对（无头 Chrome + CDP）

- 方式：以真实 Chrome 二进制 `/usr/bin/google-chrome --headless=new` 启动，经 CDP（Node 24 全局 `WebSocket`）驱动；由临时 Node 服务器（端口 5199）静态托管已构建的 `frontend/dist` 并桩接列表/选项接口，仅读取真实渲染的样式与几何，不修改任何源码。
- 结论：`browser_runtime_status=BROWSER_VERIFIED_HEADLESS_CDP`（**非**项目负责人目测，**非**正式验收通过）。
- 视口：`1440×900` 与 `1920×1080`。

实测值（两视口一致处仅列一次）：

| 检查项 | 实测结果 |
|---|---|
| 新增探针按钮 | `background rgb(9,9,11)`、`color rgb(255,255,255)`、`border-radius 6px`、`font-weight 500`，文案“新增探针”，含加号图标 |
| 列顺序 | `序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作`，表类含 `cc-table lt-main-table`，最右固定操作列存在 |
| 探针 ID 正文 | `font-weight 600`、`color rgb(9,9,11)`；其后“停用”/`异常：x` 标记独立可见 |
| 行高 | 全部行 `53px`，单元格 `padding-top 12px`（内容与内边距决定，无固定像素行高；采集数据源单元格高 20px，含行级歧义警示时为 27px） |
| 采集数据源标签（绿） | `cc-dstag--ok`，`bg rgb(236,253,245)`、`color rgb(4,120,87)`，`h 20px / font 12px / weight 600 / radius 4px / border 0` |
| 采集数据源标签（红） | `cc-dstag--bad`，`bg rgb(254,240,240)`、`color rgb(213,73,73)`，盒模型同上 |
| 采集数据源标签（中性） | `cc-dstag--neutral`，`bg rgb(244,244,245)`、`color rgb(96,98,102)`，盒模型同上 |
| 三态优先级（同一歧义行） | `probe-amb` 行内三个数据源：`ds_a`/`legacy_b`（有项级异常）渲染为红、`歧义机构`（无项级异常）渲染为中性——实机证明“项级异常优先、其余在整行歧义下降为中性” |
| 独立行级歧义警示 | `.cc-rowbad` `bg rgb(254,240,240)`、`color rgb(213,73,73)`、`border rgb(241,167,167)`、`h 27px`，文案“含逗号歧义”保持不变 |
| `+N` 计数与重算 | `probe-overflow`（7 个数据源）：1440×900 下显示 `+4`（直接展示 3 项）；1920×1080 下显示 `+1`（直接展示 6 项）——随可见宽度重算 |
| 更多图标 | `.cc-more-link` `28×28`、`radius 6px`、`role=button`、`tabindex=0`、可访问名称 `更多操作：{探针ID}`、内含 1 个图标，无“更多”文字残留（含停用行/异常行，全部行统一为图标） |
| 菜单视觉 | `radius 8px`、阴影 `0 6px 16px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)`、菜单 `radius 8px` / `padding 4px` |
| 菜单条目与分隔 | 顺序 `['停用','|','删除']`；分隔项 `role=separator`、`margin 4px 0`；“停用” `color rgb(180,83,9)`、“删除” `color rgb(245,108,108)`、条目 `radius 6px / padding 6px 12px / h 34px / role=menuitem` |
| 右边缘裁切 | `clippedRight=false`（菜单右边界 `1298` ≤ 视口宽） |
| 键盘可达 | 触发器聚焦后按 `Enter`：`aria-expanded=true`，菜单项 `['停用','删除']` |
| 双击编辑隔离 | 点击触发器 `dialogAfterTriggerClick=false`；双击触发器 `dialogAfterTriggerDblclick=false`（均未打开编辑弹窗） |

- 截图证据（留存于仓库外，**未**提交）：`/tmp/ccvis/1440x900-list.png`、`/tmp/ccvis/1440x900-menu-open.png`、`/tmp/ccvis/1920x1080-list.png`、`/tmp/ccvis/1920x1080-menu-open.png`；结构化结果 `/tmp/ccvis/results.json`。
- 临时进程已在核对完成后停止：无头 Chrome（调试端口 9333）与静态桩服务器（端口 5199）；未残留重复进程，未修改服务器防火墙/代理/网络配置。

## 5. 定义行与边界核验

| 核验项 | 结果 |
|---|---|
| `CCFG-REQ-*` 定义行（112 条） | 相对起始提交 `81bb8f1` **逐字节零差异** |
| `CCFG-AC-*` 定义行（104 条） | 相对起始提交 **逐字节零差异** |
| `CCFG-DESIGN-*` 定义行（53 条） | 相对起始提交 **逐字节零差异** |
| `CCFG-UI-*` 定义行（42 条） | 相对起始提交 **逐字节零差异** |
| 104 条验收执行状态 | 全部保持 `NOT_RUN`（`formal_acceptance_execution_status=NOT_RUN`），**未**改为通过 |
| 数据源管理参考页 | `frontend/src/views/data-source/DataSourcePage.vue` **未修改** |
| 两套公共模板与全局预设 | `docs/baseline/query-list-page-template/**`、`docs/baseline/list-table-visual-template/**`（含两份 `MIGRATION.md`）**未修改**；模板级 `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED` 未变 |
| 保护文件 | `CLAUDE.md`、`agent-env.sh`、`docs/features/README.md`、`API.md`、`DATABASE.md`、`docs/baseline/` 六份项目级基线、`docs/prompts/**`、历史报告 **均未修改**（`docs/prompts/**` 51 个文件 SHA-256 与任务前快照一致） |
| `git diff --check` | 无空白/行尾错误 |

## 6. 未执行项与下一入口

- 未执行正式验收（104 条 `CCFG-AC-*` 全部 `NOT_RUN`），未作出项目负责人目测通过或最终接受结论。
- 未访问/修改数据库、ZooKeeper、Kafka（`database_write_status=NOT_REQUESTED`、`zookeeper_write_status=NOT_REQUESTED`）。
- 未改 `API.md`/`DATABASE.md`，未新增/调整依赖。
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_IMPLEMENTATION_REVIEW`。
