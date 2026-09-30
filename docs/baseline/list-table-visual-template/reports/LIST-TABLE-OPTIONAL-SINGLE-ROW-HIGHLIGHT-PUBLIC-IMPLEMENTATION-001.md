# 报告：列表表格单行固定高亮公共可选视觉预设实现

- `task_code=LIST-TABLE-OPTIONAL-SINGLE-ROW-HIGHLIGHT-PUBLIC-IMPLEMENTATION-001`
- 分支：`develop`；任务类型：前端实现 + 公共契约测试 + 最小文档同步
- 批准依据：`SHARED_COMPONENT_DESIGN.md` §13（尤其 §13.3）与 `DESIGN.md` §7 的**可选视觉预设设计基线**
  已于 `2026-09-29` 批准（R4 `aa6285f…` 远程复审 `APPROVED` + 项目负责人同日批准）。
  **批准的是设计基线，本任务落地的是公共实现**。
- 任务起点（开工基线）：`5fa0edd6d6dc13868a085e15c54db0c48f69a763`
  （开工时核对：本地 `HEAD`、`origin/develop`、远程 `refs/heads/develop` 三者一致，ahead/behind `0/0`，无分叉）。

> **边界声明（贯穿全文）**：**实现并推送不等于**远程复审通过、项目负责人已目测、任何页面已接入或迁移、
> 或正式验收通过。本报告**不**预填本次交付的提交 SHA。

## 1. 目标与范围

在现有公共样式文件 `frontend/src/styles/list-table/list-table-visual.css` 上，为已批准设计基线 §13.3 的
「单行固定高亮」可选契约提供**显式 opt-in 的公共视觉预设**，使其**未启用页面的计算样式保持原样**（零泄漏）。

范围**仅限**：公共视觉 CSS、相应公共契约测试、必要且最小的文档同步。**不**授权任何页面接入、迁移或改变业务行为。

## 2. 实际选定的类名与实现方式

按“阅读源码与批准契约后确定，并在文档、测试、报告中唯一登记”的要求，实际选定**两级显式 opt-in**：

| 层级 | 类名 | 挂载方 | 语义 |
| --- | --- | --- | --- |
| 表级 opt-in | `lt-row-highlight` | 消费页面（须与公共根类 `lt-main-table` 并列） | 启用本表的可选 `hover` 预设与“当前行”底色归零 |
| 行级钩子 | `lt-row-highlight__row` | 消费页面在其 `row-class-name` 回调中，挂到“被固定”的那一行 | 标记哪一行处于固定态 |

- 公共层**不**推断哪一行被固定、**不**保存选中 ID、**不**监听行点击、**不**实现单击固定 / 再点取消 / 转移、
  **不**发起查询或启停请求、**不**接管事件隔离 / 权限 / 删除 / `FG_ACTIVE`。
- **未**引入 Vue 包装组件、Composable、全局 JS 状态、CSS `:has()`、路由元数据或数据库字段假设。
- **未**新增 `--lt-*` 令牌：预设以**字面量**写入，`lt_token_count` 仍 **9**（公共层不声明任何 `--lt-*` 值，
  仅以 `var(--lt-*, 默认值)` 内联回退消费既有 9 个令牌）。

### 2.1 规则清单（源码顺序即层叠顺序）

```css
.lt-main-table.lt-row-highlight :deep(.el-table__body tr.current-row > td.el-table__cell)          { background-color: transparent; }
.lt-main-table.lt-row-highlight :deep(.el-table__body tr:not(.lt-row-highlight__row):hover > td.el-table__cell) { background-color: #f4f4f5; }
.lt-main-table.lt-row-highlight :deep(.el-table__body tr.lt-row-highlight__row > td.el-table__cell)  { background-color: #e1e4e8; }
.lt-main-table.lt-row-highlight :deep(.el-table__body tr.lt-row-highlight__row:hover > td.el-table__cell) { background-color: #e1e4e8; }
.lt-main-table.lt-row-highlight :deep(.el-table__body tr.lt-row-highlight__row > td.el-table__cell:first-child) { box-shadow: inset 3px 0 0 0 #18181b; }
```

分层设计要点：

1. **“当前行”归零与固定行同前导段、同特异性**，归零规则置于**前**，故同时命中时固定行按**源码顺序**胜出；
2. **普通行 `hover` 预设**用 `:not(.lt-row-highlight__row)` 排除固定行，与固定行规则**无层叠竞争**；
3. **固定行底色**作用于通用 `> td.el-table__cell`（不回退到更窄的单元格），故覆盖**整行每个 `td`**，
   与 Element Plus 最右**固定操作列**的 `td.el-table-fixed-column--right` 一致；
4. **固定行再次 `hover`** 保持固定底色，不产生颜色跳动；
5. **左缘强调**只画在 `td.el-table__cell:first-child`（首个可见单元格），每行至多一条。

未使用 `!important`、裸 `tr:hover`、全局 Element Plus 选择器或页面业务类名前缀；全部规则由
根类 `.lt-main-table` **及新增表级 opt-in** 共同限定。

## 3. 公共契约测试

`frontend/src/styles/list-table/list-table-visual.spec.ts`（**15 项断言**）在本任务中更新与新增：

- **更新**：#6 每条 `:deep(...)` 由 `.lt-main-table` 限定，并允许根类与**已登记的 opt-in 表级类**并列
  （`.lt-main-table.lt-row-highlight`），其余前导类仍禁止；
- **更新**：#11 允许 helper 类集合 = `{lt-row-action__cell, lt-row-action__ellipsis, lt-row-highlight, lt-row-highlight__row}`（4 个）；
- **新增** #14：§13.3 两级 opt-in 类在 `src/views/**` 的 `.vue` 中**零挂载**（未 opt-in 页零泄漏）；
- **新增** #15：§13.3 分层契约（固定底色覆盖通用 `td`；归零与固定行同前导段且归零在前；普通 `hover` 预设
  为 `#f4f4f5` 且排除固定行；固定行自 `hover` 保持 `#e1e4e8`；左缘强调仅 `:first-child` 且为
  `inset 3px 0 0 0 #18181b`）；
- #2 / #3 / #4 / #5 / #7–#10 / #12 / #13 **不变**（令牌数仍 9；唯一来源仍为公共 CSS 文件；业务页面中
  仅 `ClientConfigPage.vue` 挂载 §12 三点入口辅助类）。

**静态测试只证明源码契约**，不证明运行时层叠与固定列视觉——后者由下节真实浏览器夹具承接。

## 4. 真实浏览器运行时核对（隔离夹具，无业务数据）

- **方法**：headless Chrome（`Chrome/148.0.7778.167`）+ 零依赖 CDP 客户端；`hover` 一律用
  `CSS.forcePseudoState` **强制**，避免离屏 / 遮挡造成的假失败（沿用既有教训）；
  Element Plus 行底色带 `.25s` 过渡，读取前等待过渡结束，避免读到中间色。
- **夹具**：临时静态夹具（`el-table` + 真实 `@/styles/list-table/list-table-visual.css` scoped 编译；
  仅 3 行**合成**数据 `row-0-a` 等，**无真实业务数据**），通过 URL 参数切换
  `optin=0|1`（表级 `.lt-row-highlight`）与 `fixed=-1|<rowIndex>`（行级 `.lt-row-highlight__row`）。
  夹具与核对脚本作为证据存入 `reports/evidence/.../scripts/`，**未**把临时夹具冒充页面迁移。

### 4.1 场景与实测（`browser/single-row-highlight-cascade.json`）

| 场景 | 关键量测 | 结果 |
| --- | --- | --- |
| S0 无 opt-in、未 hover | 行 1 首格底色 `rgba(0,0,0,0)`；文档内 opt-in 类计数 `0`；表根类无 `.lt-row-highlight` | 零泄漏 |
| S0 无 opt-in、hover | hover 底色 ≠ `#f4f4f5`（实测 `rgba(0,0,0,0)`，EP 默认未启用） | 不泄漏 |
| S1 opt-in、未 hover | `rgba(0,0,0,0)` | 不显示预设底色 |
| S2 opt-in、hover 普通行 | `rgb(244,244,245)`（`#f4f4f5`） | 预设 hover 生效 |
| S3 opt-in、固定第 2 行 | 4 个 `td`（含固定右列）**全部** `rgb(225,228,232)`（`#e1e4e8`） | 覆盖整行 + 固定列 |
| S3 左缘强调 | 首格 `rgb(24,24,27) 3px 0px 0px 0px inset`；次 / 三格 `none` | 仅首格 |
| S3 文字 / 操作触发器色 | 固定行与普通行**同为** `rgb(96,98,102)`；三点触发器同为 `rgb(64,158,255)` | 未灰化 |
| S4 固定第 2 行 + hover 第 1 行 | 第 2 行 `rgb(225,228,232)`（固定压过普通行 hover）；第 1 行 `rgb(244,244,245)` | 分层正确 |
| S5 固定第 2 行 + hover 自身 | 首格与固定列 `td` 均 `rgb(225,228,232)` | 不跳到 hover 灰 |
| S7 取消固定（移除行级类） | 前 `rgb(225,228,232)` → 后 `rgba(0,0,0,0)` | 无残留固定底 |
| S8 叠加 EP `current-row` | 底色 `rgba(0,0,0,0)` | 归零生效，不留“看似固定”的底 |
| S9 未 opt-in 整表 hover | ≠ `#f4f4f5`（实测 `rgba(0,0,0,0)`） | 零泄漏 |

**结论**：31 条断言**全部通过**（脚本输出 `ALL PASSED`，退出码 `0`）。

### 4.2 证据限制

- 证据为**脱敏合成数据**的最小量测，**不含**真实业务截图或识别数据；
- 夹具为**临时构造**，仅用于运行时层叠核对，**不代表**任何页面已接入 §13 公共类；
- 未拦截 `/api/**` 亦未触发任何非 GET 请求——夹具为纯静态、无接口调用（后端 / 数据库 / ZooKeeper / Kafka
  **均未**参与）；
- 量测在**单一**浏览器与 DPR（headless 默认）下进行；不同 DPR / 缩放下未复测（§12 焦点环 DPR 细节不在本任务范围）。

## 5. 验证命令与结果

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 定向测试 | `cd frontend && npx vitest run src/styles/list-table/list-table-visual.spec.ts` | `15 passed (15)` |
| 全量测试 | `cd frontend && npm test` | `Test Files 57 passed (57)`、`Tests 1166 passed (1166)` |
| 含类型检查构建 | `cd frontend && npm run build`（脚本为 `vue-tsc --noEmit && vite build`） | 类型检查通过，`✓ built in 16.61s` |
| 浏览器核对 | headless Chrome + CDP，见 §4 | 31/31 断言通过 |

未观察到任务开始前已存在的无关失败。后端测试 / 构建、数据库 / ZooKeeper / Kafka 操作**不需要**，均未执行。

## 6. 状态边界（本任务改变与未改变的）

**改变**：

- §13 可选单行固定高亮的**公共实现状态**：`NOT_STARTED`（实现提交时点值，**保留为历史**）
  → **`IMPLEMENTED_PENDING_CHATGPT_REVIEW`**（已实现、**待 ChatGPT 远程代码复审**）；
- 现行 `lt_internal_helper_class_count`：`2` → **`4`**；`lt_token_count` 仍 **9**。

**未改变**：

- §12 三点入口现行实现状态 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（**不**回退）；
- §12.1 三点触发器**禁用态视觉**：仍属**设计契约、尚未实现、尚未验收**（本任务**未**补做、**未**制造禁用业务场景）；
- 模板整体已接受的旧基础实现状态（`shared_implementation_status` / `reference_page_integration_status`
  仍 `IMPLEMENTED_ACCEPTED`、`final_acceptance_status` 仍 `ACCEPTED_BY_PROJECT_OWNER`）；
- 页面迁移 `page_migration_status=NOT_STARTED` / `page_migration_authorization_status=NOT_GRANTED` /
  `pilot_page_selection_status=NOT_DECIDED`；模板级 `current_next_entry` 仍
  `NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`；
- 四通道标记计数**逐值不变**（命令实测见 §7）；
- Feature 四层定义行、157 条验收状态格、既有历史报告**均未**改动。

## 7. 标记 / helper 类 / 令牌实测

命令（标记字面量以拼接构造，避免本报告自身被计入）：

- 四份规范文档（通道 1，`REFERENCE_FACT / DRAFT / APPROVED / PROPOSED`）：
  `README 7/0/16/5` + `DESIGN 5/0/15/0` + `UI 12/0/8/0` + `MIGRATION 4/0/4/2` = **`28 / 0 / 43 / 7`**（不变）；
- `SHARED_COMPONENT_DESIGN.md` 批准态设计标记（通道 2）：**`81`**（不变）；
- `SHARED_COMPONENT_DESIGN.md` 参考事实标记（通道 3）：**`26`**（不变）；
- `SHARED_COMPONENT_DESIGN.md` 候选未实现标记（通道 4）：**`8`**（不变）；
- `lt_token_count`：**`9`**（`--lt-*` 名去重 + 声明计数 `0`）；
- `lt_internal_helper_class_count`：**`4`**
  （`{lt-row-action__cell, lt-row-action__ellipsis, lt-row-highlight, lt-row-highlight__row}`）。

## 8. 真实变更文件

- `frontend/src/styles/list-table/list-table-visual.css`（新增 §13.3 两级 opt-in 预设 5 条规则 + 说明注释）
- `frontend/src/styles/list-table/list-table-visual.spec.ts`（更新 #6 / #11，新增 #14 / #15）
- `docs/baseline/list-table-visual-template/README.md`（§8 导航、§8.1 状态与入口、新增 §8.3、§11 变更记录）
- `docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md`（§0.1、§13 引言、§13.2 表、§13.3 状态块、§13.5）
- `docs/baseline/list-table-visual-template/MIGRATION.md`（追加本任务记录）
- `docs/baseline/list-table-visual-template/reports/LIST-TABLE-OPTIONAL-SINGLE-ROW-HIGHLIGHT-PUBLIC-IMPLEMENTATION-001.md`（本报告）
- `docs/baseline/list-table-visual-template/reports/evidence/LIST-TABLE-OPTIONAL-SINGLE-ROW-HIGHLIGHT-PUBLIC-IMPLEMENTATION-001/browser/single-row-highlight-cascade.json`
- `.../evidence/LIST-TABLE-OPTIONAL-SINGLE-ROW-HIGHLIGHT-PUBLIC-IMPLEMENTATION-001/scripts/lt-fixture-verify.mjs`
- `.../evidence/LIST-TABLE-OPTIONAL-SINGLE-ROW-HIGHLIGHT-PUBLIC-IMPLEMENTATION-001/scripts/lt-fixture.vue`
- `.../evidence/LIST-TABLE-OPTIONAL-SINGLE-ROW-HIGHLIGHT-PUBLIC-IMPLEMENTATION-001/scripts/lt-fixture.html`
- `.../evidence/LIST-TABLE-OPTIONAL-SINGLE-ROW-HIGHLIGHT-PUBLIC-IMPLEMENTATION-001/scripts/lt-fixture-mount.ts`

任务开始前已有的无关工作区内容（`.claude/settings.local.json`、`docs/prompts/**`、`runtime-logs/**`）
**全程保持原样，未修改、未暂存、未提交**。

## 9. 未执行 / 未改变项

- **未修改** `ClientConfigPage.vue` 及其测试（该页继续使用自己的现行类与样式，**未**改为公共类）；
- **未修改** `DataSourcePage.vue`（其“更多”仍是文字入口）；**不**把任一页面写成已接入 §13；
- **未**补做 §12.1 三点触发器禁用态视觉；**未**制造禁用业务场景；
- **未**新增 Vue 包装组件 / Composable / 全局 JS 状态 / CSS `:has()` / 路由元数据 / 数据库字段假设；
- **未**新增或改动 `--lt-*` 令牌；**未**使用 `!important` 或全局 CSS；
- **未**改动 Feature 四层定义行、157 条验收状态格、任何历史报告、`docs/features/**`、`CLAUDE.md` 或配置；
- **未**执行后端测试 / 构建、数据库 / ZooKeeper / Kafka 操作；
- **未**进行页面迁移评估或授权。

## 10. 下一入口

```text
next_step=CHATGPT_REMOTE_LIST_TABLE_OPTIONAL_SINGLE_ROW_HIGHLIGHT_PUBLIC_IMPLEMENTATION_REVIEW
next_step_scope=SHARED_COMPONENT_DESIGN_SECTION_13_PUBLIC_IMPLEMENTATION_ONLY
```

该入口**只**覆盖本次公共 CSS 与公共契约测试的远程代码复审，**不**表示复审已通过、**不**表示任何页面已接入或迁移、
**不**表示正式验收通过。模板级 `current_next_entry` 保持
`NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`（**另一状态层**）。
