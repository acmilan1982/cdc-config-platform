# 探针端管理查询列表页与列表表格调整 · 独立实现任务执行报告

> 任务代码：`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001`
> 任务类型：前端实现（`/config/client` 单页页面级调整）
> 分支：`develop`
> 起始提交：`40d28125de5d7977936a35bca193ccf4489d65b7`
> 上游门禁：ChatGPT 远程 R2 复审 `APPROVED`；项目负责人 2026-09-22 批准页面调整基线（`adjustment_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0`）
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_PAGE_ADJUSTMENT_IMPLEMENTATION_REVIEW`
> 本任务不执行正式验收，不作出项目负责人目测通过或最终接受结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=40d28125de5d7977936a35bca193ccf4489d65b7
actual_base_commit=40d28125de5d7977936a35bca193ccf4489d65b7
baseline_approval_status=APPROVED
page_level_authorization_status=GRANTED_FOR_CONFIG_CLIENT_ONLY
```

- 本地 `HEAD` 与任务预期起始提交一致；任务开始时工作区已存在两项与目标重叠的本任务范围内修改（`ClientConfigPage.vue`、`ClientConfigPage.spec.ts`），属本任务授权范围，按授权继续编辑。
- 任务开始前即存在的无关修改：已修改的 `.claude/settings.local.json`、未跟踪的 `docs/prompts/**`。二者**全程未修改、未暂存、未提交**。
- 未执行 `git pull` / `fetch` / `merge` / `rebase` / `reset` / `clean` / `stash` / `checkout --`，未改写历史，未强推。

## 2. 实际文件清单

### 2.1 代码与测试（允许修改的白名单内）

| 文件 | 变更性质 |
|---|---|
| `frontend/src/views/client-config/ClientConfigPage.vue` | 页面级调整实现（重写） |
| `frontend/src/views/client-config/ClientConfigPage.spec.ts` | 组件测试同步替换与新增（重写） |

未新增其他定向测试文件；未修改两个公共模板实现、数据源管理参考页、路由/菜单、前端 API 类型与接口、后端代码、数据库对象、DDL 或构建依赖。

### 2.2 当前状态文档（最小同步）

| 文件 | 变更性质 |
|---|---|
| `docs/features/client-config/README.md` | 当前状态、导航、新增 §1.3 实现记录 |
| `docs/features/client-config/REQUIREMENTS.md` | 元数据实现状态、§1.3 行、§10 变更记录追加 |
| `docs/features/client-config/ACCEPTANCE.md` | 元数据实现状态、§1.2/§2 行、§6 变更记录追加 |
| `docs/features/client-config/DESIGN.md` | 元数据实现状态、§1 行、§14 变更记录追加 |
| `docs/features/client-config/UI.md` | 元数据实现状态、§1 行、§15 说明、§16 变更记录追加 |
| `docs/baseline/query-list-page-template/MIGRATION.md` | 末尾追加页面级实现记录（保留全部历史原文） |
| `docs/baseline/list-table-visual-template/MIGRATION.md` | 末尾追加页面级实现记录（保留全部历史原文） |

### 2.3 新增报告

| 文件 | 说明 |
|---|---|
| `docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001.md` | 本报告 |

## 3. 设计映射（已批准条款 → 实现）

| 已批准条款 | 实现落点 | 结果 |
|---|---|---|
| `CCFG-DESIGN-038` / `CCFG-UI-027` / `CCFG-REQ-091` | 页面根替换为 `QueryListPageShell`，查询区替换为 `QueryListQueryPanel`，查询/重置由 `QueryListActions` 承载，结果区替换为 `QueryListResultPanel` | 已实现 |
| `CCFG-DESIGN-039` / `CCFG-UI-033` / `CCFG-REQ-092` | 未引入 `QueryListRefreshToolbar`，无倒计时、无最近刷新时间、无轮询；写操作后重载走既有查询数据流 | 已实现（刷新能力 ABSENT） |
| `CCFG-DESIGN-040` / `CCFG-UI-028` / `CCFG-REQ-021`/`022`/`093` | 结果区头部左侧摘要 `共 {n} 条`，右侧 `新增探针`；无“删除所选”、无批量工具栏 | 已实现 |
| `CCFG-DESIGN-044` / `CCFG-REQ-011` | 六列固定顺序：序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作；序号列 `$index + 1` 连续编号 | 已实现 |
| `CCFG-DESIGN-045` / `CCFG-UI-031`/`035` / `CCFG-REQ-101`/`102` | 探针 ID 后三态标识：`fgActive === '1'` 无标识；`=== '0'` 显示与数据源管理“数据源 ID”一致的 `停用` 标记；其余原始值红色 `异常：{原始值}`，不可见单空白以可见定界符如实呈现；完整文本由 Tooltip 承担；操作列不被挤压 | 已实现 |
| `CCFG-DESIGN-041` / `CCFG-UI-032` / `CCFG-REQ-023`/`094` | 最右 `fixed="right"` “操作”列，唯一文字入口“更多”；菜单按行态：启用行「停用、删除」、停用行「启用、删除」、历史异常行「停用、删除」；删除为危险语义、停用为警告语义；入口与菜单 `click`/`dblclick` 均不触发行双击编辑、不产生选中视觉 | 已实现 |
| `CCFG-DESIGN-042` / `CCFG-REQ-103` | 行级忙碌按探针 ID 记录在途行，只锁对应行；取消/失败正确复位；确认阶段即覆盖同一行，其他行不被阻塞 | 已实现 |
| `CCFG-DESIGN-043` / `CCFG-REQ-095` | 写操作继续复用既有 `deleteClient` / `enableClient` / `disableClient`；无新增接口、无批量删除接口 | 已实现 |
| `CCFG-DESIGN-046` / `CCFG-UI-034` / `CCFG-REQ-096` | 主表以显式根类 `lt-main-table` 接入，并 `<style scoped src="@/styles/list-table/list-table-visual.css">` 引入预设；仅主表，弹窗与内部控件不接入；无 `!important`、无全局泄漏、无包装组件或额外 DOM 层 | 已实现 |
| `CCFG-UI-012` / `CCFG-UI-034` | 空态 `暂无符合条件的探针`；失败提示改为普通加载语义 `列表加载失败，请重试。` 并提供重试，保留旧结果 | 已实现 |
| `CCFG-UI-018`/`020` / `CCFG-REQ-025` | 删除、停用保留二次确认；启用维持无确认语义；取消确认不发送请求 | 已实现 |
| 既有回归（`CCFG-REQ-` 既有条目） | 首次自动查询、默认 ID 降序、不分页、关键词与状态过滤、重置仅恢复控件不自动查询、双击行编辑、探针 ID 键盘 Enter/Space 编辑、采集数据源标签与 `+N`、页面级单实例 Tooltip、CRUD 与异常行安全规则 | 保留 |

## 4. 验证证据（真实执行结果）

### 4.1 定向组件测试（Vitest）

```text
命令：npx vitest run src/views/client-config/ClientConfigPage.spec.ts
结果：Test Files 1 passed (1)；Tests 96 passed (96)；Duration 26.26s
```

覆盖要点：四组件接入与无刷新工具栏/轮询；首次查询、查询/重置与失败重试；六列顺序、序号 `1..n`、右侧新增按钮、固定操作列、无选中/批量入口；`'1'`/`'0'`/历史异常三态 ID 标识与菜单条目、异常空白值可见定界；删除与停用确认/取消/失败/重复点击/行级忙碌、启用无确认及原接口；“更多”事件不冒泡至编辑、普通双击与 ID 键盘编辑仍可用；表格预设只在主列表、弹窗未受影响；数据源标签与 `+N`、Tooltip、表单关键回归。

其中「`停用` 标识视觉完全一致」以跨组件证据核验：从 `ClientConfigPage.vue` 与 `DataSourcePage.vue` 分别提取 `.cc-inactive-mark` 与 `.ds-inactive-mark` 声明块，逐条归一化（trim / 过滤空项 / 排序）后逐项相等。

### 4.2 全量前端测试

```text
命令：npm test
结果：Test Files 57 passed (57)；Tests 1076 passed (1076)；Duration 92.71s
```

### 4.3 前端构建

```text
命令：npm run build
结果：成功（vue-tsc + vite），built in 15.86s
产物：dist/assets/ClientConfigPage-BBA3v00j.js 22.28 kB (gzip 9.07 kB)
既有告警：仅 `index-*.js` / `LargeScreenPage-*.js` 超过 500 kB 的分包告警，属任务开始前已存在的既有现象
```

### 4.4 真实浏览器只读目测

```text
browser_readonly_review_status=BROWSER_BLOCKED_RUNTIME_UNAVAILABLE
browser_viewports=NONE
```

- 检查时点无前端/后端开发服务在本机监听（`5173` / `4173` / `8080` / `3000` 均无监听）。
- `frontend/node_modules` 无 `puppeteer` / `playwright` 包，亦无 `playwright` CLI；按 `CLAUDE.md` §9/§10 不得擅自安装工具或替换基础环境。
- 依任务提示词 §七，条件不具备时如实报告 `BROWSER_BLOCKED_RUNTIME_UNAVAILABLE`。**未伪造任何截图、未声称任何视觉通过结论**，1440×900 与 1920×1080 的真实几何与菜单展开目测**留待用户**。

## 5. 定义行与边界核验

```text
requirement_definition_rows_changed=0   （103 条，base=103 / worktree=103，逐字节 IDENTICAL）
acceptance_definition_rows_changed=0    （89 条，base=89 / worktree=89，逐字节 IDENTICAL）
design_definition_rows_changed=0        （46 条，base=46 / worktree=46，逐字节 IDENTICAL）
ui_definition_rows_changed=0            （35 条，base=35 / worktree=35，逐字节 IDENTICAL）
acceptance_not_run_count=89
requirements_acceptance_coverage=103/103
formal_acceptance_execution_status=NOT_RUN
```

- 定义行核验方法：以 `git show HEAD:<path>` 与工作区文件分别抽取 `^| <编号前缀>` 起始的定义行，排序后逐字节比较，结果均为 `IDENTICAL`。
- `API.md`、`DATABASE.md`、所有既有报告、`docs/features/README.md`、`docs/baseline/` 六份项目级基线、`docs/baseline/README.md`：**零变化**。
- 模板级全局状态保持不变：`page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED`。数据源管理参考页最终接受状态不变（`IMPLEMENTED_ACCEPTED`、`final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`）。
- 后端代码、数据库对象、DDL、ZooKeeper/Kafka：**零访问、零写入**。
- `docs/prompts/**`：全程未修改、未暂存、未提交；本提示词未写入该目录。

## 6. 未执行项与下一入口

未执行（且本任务不作出结论）：

- 正式验收执行（89 条全部 `NOT_RUN`）；正式验收不得由本任务改写为 `PASS`。
- 项目负责人真实页面目测与最终接受。
- 后端构建/后端测试（后端代码与接口不变，按验证矩阵 `NOT_APPLICABLE`）。
- 真实浏览器 1440×900 / 1920×1080 目测（见 §4.4，条件不具备）。

下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_PAGE_ADJUSTMENT_IMPLEMENTATION_REVIEW`，由 ChatGPT 从远程 Git 对本实现提交做独立复审；**代码 Agent 不得自行批准实现、不得改写任何正式验收用例为 `PASS`、不得宣布用户目测或最终接受**。
