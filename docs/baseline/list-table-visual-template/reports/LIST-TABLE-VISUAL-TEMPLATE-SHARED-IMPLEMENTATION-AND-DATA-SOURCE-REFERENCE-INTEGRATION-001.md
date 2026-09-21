# LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001 · 执行报告

> 任务性质：**代码实现 + 真实浏览器等价验证**（非纯文档任务）
> 前置状态：`shared_implementation_design_status=APPROVED`、
> `shared_implementation_design_approval_status=APPROVED`、
> `approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`
> 本任务产出的状态：`shared_implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`、
> `reference_page_integration_status=IMPLEMENTED_PENDING_USER_REVIEW`
> **未**推进：`formal_acceptance_execution_status` 保持 `NOT_RUN`、
> `page_migration_status` 保持 `NOT_STARTED`、
> `page_migration_authorization_status` 保持 `NOT_GRANTED`。

## 1. 任务信息

```text
task_code=LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001
task_type=CODE_IMPLEMENTATION_WITH_REAL_BROWSER_EQUIVALENCE_VERIFICATION
branch=develop
base_commit_id=ae6439b312bb6549f9ac7c31a3c7e5a8c524fec7
reference_page=数据源管理
reference_route=/config/data-source
```

被实现的唯一架构（来自已批准详细设计）：

```text
selected_implementation_architecture=
EXPLICIT_ROOT_CLASS_CSS_PRESET_WITH_LIMITED_CSS_CUSTOM_PROPERTY_TOKENS
root_class=lt-main-table
token_count=9
public_layer_declares_token_values=false
vue_wrapper_component=false
extra_dom_layer=false
global_styles=false
router_metadata_auto_wiring=false
internal_helper_classes=0
```

## 2. 预检

```text
当前目录            /agent/cdc-config-platform
有效 Git 仓库       是
当前分支            develop（符合 CLAUDE.md §4）
任务开始前 HEAD     ae6439b312bb6549f9ac7c31a3c7e5a8c524fec7
任务开始前状态      M .claude/settings.local.json / ?? docs/prompts/（任务外既有内容，全程未动）
远程是否前进/分叉   否
环境预检            node / npm / java / mvn 可用；数据库与 ZooKeeper 本任务只读且未直接访问
```

## 3. 交付物

### 3.1 公共层（新增，3 个文件）

| 文件 | 作用 |
| --- | --- |
| `frontend/src/styles/list-table/list-table-visual.css` | **全仓唯一**公共视觉预设源：4 条规则，选择器全部由 `.lt-main-table` 限定；**不声明**任何 `--lt-*` 值；9 个令牌只作为 `var(--lt-*, 默认值)` 内联回退出现 |
| `frontend/src/styles/list-table/index.ts` | 导出 `LT_MAIN_TABLE_CLASS`、`LT_TABLE_VISUAL_TOKENS`（9 个，`as const`）；无 import、无副作用 |
| `frontend/src/styles/list-table/list-table-visual.spec.ts` | 静态契约测试 12 项（§7.1 断言 1–12），只断言源码文本，不涉及 CSS 求值/层叠/几何 |

公共预设实际内容（4 条规则）：

```css
.lt-main-table {
  width: var(--lt-table-width, 100%);
  --el-table-border-color: var(--lt-border-color, #f4f4f5);
  --el-table-header-text-color: var(--lt-header-text-color, #71717a);
  --el-table-header-bg-color: var(--lt-header-bg-color, #ffffff);
}
.lt-main-table :deep(.el-table__header th .cell) {
  font-size: var(--lt-header-font-size, 12px);
  font-weight: var(--lt-header-font-weight, 600);
  color: var(--lt-header-text-color, #71717a);
  letter-spacing: var(--lt-header-letter-spacing, 0.01em);
}
.lt-main-table :deep(td.el-table__cell) { padding: var(--lt-body-cell-padding, 12px 0); }
.lt-main-table :deep(th.el-table__cell) { padding: var(--lt-header-cell-padding, 11px 0); }
```

### 3.2 数据源管理参考页接入（2 个文件修改）

| 文件 | 变更 |
| --- | --- |
| `frontend/src/views/data-source/DataSourcePage.vue` | ① 引入 `LT_MAIN_TABLE_CLASS`；② 主列表 `el-table` 的 `:class` 改为 `['data-table', LT_MAIN_TABLE_CLASS]`（保留业务类）；③ 新增 `<style scoped src="@/styles/list-table/list-table-visual.css"></style>`，**保留**原有内联 `<style scoped>` 块；④ 删除被公共层**逐值等价替代**的四组局部基础规则 |
| `frontend/src/views/data-source/dataSource.spec.ts` | 追加 1 个 describe / 7 个测试：显式启用、未启用表不含公共类、公共类全页唯一、不声明任何 `--lt-*`、以 `<style scoped src>` 引入且保留原内联块、四组同义规则不再重复声明、组件契约（data/列定义/固定列/省略开关）不变、原内联 scoped 块仍可被既有提取器解析 |

接入仅限**主列表**：`.naming-table`（命名策略弹窗表）、`.ds-more-popper` 非 scoped 块、
Props/Slots/Events/Ref、API/数据模型/参数/错误处理**均未改动**。

被删除的四组局部规则（后由公共层以等价默认值承担）：

```css
.data-table { width: 100%; --el-table-border-color: #f4f4f5;
              --el-table-header-text-color: #71717a; --el-table-header-bg-color: #ffffff; }
.data-table :deep(.el-table__header th .cell) { font-size: 12px; font-weight: 600;
              color: #71717a; letter-spacing: 0.01em; }
.data-table :deep(td.el-table__cell) { padding: 12px 0; }
.data-table :deep(th.el-table__cell) { padding: 11px 0; }
```

### 3.3 验证证据与可复现脚本（新增）

```text
docs/baseline/list-table-visual-template/reports/evidence/
  LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001/
    browser/  raw-equivalence.json judgement.json judgement-negative-control.json
              fallback-override.json negative-pages.json
              reverse-controls-source.json build-artifact-scan.json
    scripts/  cdp-client.mjs sample-equivalence.mjs judge-equivalence.mjs
              sample-fallback-override.mjs sample-negative-pages.mjs
              reverse-controls-source.mjs scan-build-artifacts.mjs
```

零依赖 CDP 驱动（Node 全局 `WebSocket`/`fetch` + Google Chrome 148 headless），未安装任何新依赖。

## 4. 测试执行（§八）

```text
定向测试   npx vitest run src/views/data-source/dataSource.spec.ts src/styles/list-table/list-table-visual.spec.ts
           → 2 个文件 / 128 个测试全部通过
全量测试   npx vitest run
           → 57 个文件 / 1063 个测试全部通过
前端构建   npm run build（vue-tsc --noEmit && vite build）
           → 成功（built in ~17s）
```

- 既有测试**未删除、未弱化、未跳过**；
- jsdom 层只断言 DOM 结构、类名、源码文本、组件契约与既有交互；
  自定义属性运行时值、消费属性最终计算值、选择器实际匹配数、覆盖影响范围与几何
  一律由真实浏览器承接（批准设计 §2.5 / §7.4 / §7.5）。

## 5. 真实浏览器等价验证（§九）

环境：同一 Chromium、同一视口（`Emulation.setDeviceMetricsOverride`，DPR=1、`visualViewport.scale=1`）、100% 缩放；
`baseline` = `ae6439b312bb6549f9ac7c31a3c7e5a8c524fec7` 导出的干净工作副本（:5174），
`impl` = 本任务工作树（:5173），两者代理同一后端 `127.0.0.1:8080`。

### 5.1 §9.2 主列表逐值等价（严格 0）

```text
EQUIVALENCE ok=true failures=0 failedChecks=0
  mainComputedStyleMax=0  mainGeometryMax=0
  namingComputedStyleMax=0 namingGeometryMax=0
  噪声地板(同环境两次独立加载) {"1440x900":0,"1920x1080":0}
  视口 1440x900 / 1920x1080，各 42 项断言
```

- 主列表（`.data-table`，唯一被接入表格）：计算样式与几何**严格 0**，零容差；
- 命名策略弹窗表（未启用负向对照）：计算样式严格 0；几何在噪声地板为 0 的前提下亦为 0，
  未启用任何亚像素容差；
- 结构断言：启用表命中数=1、越界命中=0、未启用表公共规则命中=0、9 令牌在两张表上读数均为空。

### 5.2 §9.3 fallback 与覆盖（A–F，真实浏览器）

```text
FALLBACK_OVERRIDE ok=true checks=25 failed=0
```

| 项 | 结论 |
| --- | --- |
| A | 覆盖 `--lt-header-text-color` 后，消费属性（表头 `color` 与 `--el-table-header-text-color`）读到覆盖值 |
| B | 同页未覆盖的弹窗表**不受影响**，且仍不含公共类、9 令牌仍为空 |
| C | 未覆盖令牌的消费属性取内联回退默认值（`rgb(113, 113, 122)`、`12px`、`600`、`0.12px`、`11px 0`、`12px 0`） |
| D | 移除覆盖后消费属性回到默认值 |
| E | 被覆盖令牌本身读到 Feature 值 |
| F | 未覆盖令牌**本身为空**是设计预期，**不判失败** |

判定语义：是否启用**只由根类 `lt-main-table` 判定**，不以「`--lt-*` 非空」判定；
自定义属性按 token 字面量求值（`--el-table-header-text-color` 读回 `#71717a` 而非 `rgb(...)`）。

### 5.3 §9.4 负向页面矩阵（8 个页面）

```text
NEGATIVE_PAGES ok=true pages=8 failures=0 failedChecks=0 maxStyleDiff=0 maxGeomDiff=0
```

| 页面 | 路由 | 结论 |
| --- | --- | --- |
| data-source-naming-dialog-table | `/config/data-source` 弹窗子表 | 无公共类、无令牌；公共规则不越出启用根节点 |
| probe-client-config-main-table | `/config/client` | 无公共类、公共规则命中 0、无令牌、与基线逐值相同 |
| data-subscribe-main-table | `/config/subscribe` | 同上 |
| data-source-run-state-main-table | `/monitor/data-source-state` | 同上 |
| topic-offset-main-table | `/monitor/topic-offset` | 同上 |
| server-config-save-confirm-dialog-table | `/config/server` 确认弹窗 | 同上（**只打开弹窗并点“取消”，未点“确认保存”**） |
| log-query-main-table | `/monitor/log-query` | 该环境未开放日志查询功能 → 记 `TABLE_NOT_RENDERED`，仅核对「无公共类」 |
| job-failure-history-list-table | `/monitor/job-failure/history/list` | 无数据未渲染 → 同上 |

共同不变式：公共规则**命中启用根节点之外元素的数量恒为 0**；页面矩阵未接入或修改任何未启用页面。
未产生写操作：服务配置弹窗交互只点“取消”；后端日志中只有 MyBatis `SELECT`，
`snapshotBatchSize` 复读仍为 `'6000'`（未变更）。

### 5.4 §9.5 反向控制（代表项全部被检出）

| 违规 | 形态 | 检出方式 | 结果 |
| --- | --- | --- | --- |
| 裸 `.el-table__cell` | 源级（临时副本） | 静态契约断言 5 | `td.el-table__cell: expected … to contain '.lt-main-table'` |
| 裸 `.el-table__cell` | 运行时注入 | fallback-override RC1 | 消费属性被改变、注入可观测 |
| `:root` 上声明 `--lt-*` | 源级（临时副本） | 静态契约断言 4 / 5 | 两项均失败 |
| `:root` 上声明 `--lt-*` | 运行时注入 | fallback-override RC2 | 令牌读数与消费属性随之改变 |
| 参考页保留重复同义规则 | 源级（临时副本） | `dataSource.spec.ts` 单一发布者断言 | `not to contain '--el-table-'` |
| ≥0.001px 几何偏移 | 内存注入 | `judge-equivalence.mjs --inject-px 0.001` | `1440x900.main.firstRowRect.h 48 → 48.001`，exit 1 |

```text
REVERSE_CONTROLS_SOURCE ok=true
  S0 副本保真（未植入违规）=0（不得自造假失败）
  S1 裸 EP 选择器=1  S2 :root 令牌=1  S3 重复同义规则=1
```

**1px 偏移控制**：`EQUIVALENCE ok=false failures=1 … mainGeomMax=0.0009999999999976694`，exit 1。

所有反向控制只在 `/tmp` 临时副本或运行时注入中完成，**未**污染最终源码、提交或构建产物
（fallback-override 脚本结束前断言注入物已全部移除、取值回到默认）。

### 5.5 §7.3 构建产物检查

以「基线 dist ↔ 实现 dist」的**规则集差分**（归一化 Vue 作用域哈希后比较）判定净影响：

```text
BUILD_ARTIFACT_SCAN ok=true
  implRules=4080  baselineRules=4080  newRules=4  removedRules=4
  publicRules=4@assets/DataSourcePage-*.css  newGlobalRules=0
  tokenDeclarations=0  tokenLiteralFiles=assets/DataSourcePage-*.css
```

- 本次**新增**的规则恰好 4 条，全部带 `.lt-main-table` 根类；
- 本次**移除**的规则恰好 4 条，全部是被替代的 `.data-table` 局部规则；
- **未新增任何全局规则**；`:deep()` 编译为后代组合子且带作用域属性；
- 产物中**不存在** `:root`/`html`/`body`/`*` 上的 `--lt-*` 声明；
- 九个令牌字面量只出现在被启用页面的 CSS 分片，**不出现在任何 JS**，也不出现在未启用页面分片。

## 6. 提交组织（§十）

两个**可独立回滚**的提交，均在 `develop`：

| # | 范围 | 文件 |
| --- | --- | --- |
| 1 | 公共层 | `frontend/src/styles/list-table/list-table-visual.css`、`index.ts`、`list-table-visual.spec.ts` |
| 2 | 参考页接入 + 验证证据 + 文档回写 | `DataSourcePage.vue`、`dataSource.spec.ts`、`docs/baseline/list-table-visual-template/reports/**`、`docs/baseline/{README,PROJECT_STATUS}.md`、`docs/baseline/list-table-visual-template/README.md`、本报告 |

- 两个提交的真实 commit id 见本任务结果块与 `git log`；
- **回滚能力验证**（在 `/tmp` 的本地临时克隆中模拟，未触碰已推送分支）：
  `git revert --no-commit c6d752c`（仅回退接入提交）与
  `git revert --no-commit f984035`（仅回退公共层提交）**均干净应用**；
  整任务回滚按逆序 2 → 1 执行即完全还原。仅回退公共层会让仍引用该预设的参考页失去样式来源，
  这是「先加层、后消费层」的固有顺序，故整任务回滚须逆序进行，特此说明；
- 回滚验证按 §十 的约束，**未**使用 `reset --hard` / `checkout .` / `clean -f`，**未**改写历史；
- 本次**未**迁移任何其他页面；
- 另有**第三个纯记录提交**：§十二 要求从最终提交重启服务，故在重启后同步本报告 §8 的
  服务 PID 与日志路径（只改文档，不含代码）。

## 7. 文档回写（§十一）

```text
shared_implementation_status=IMPLEMENTED_PENDING_USER_REVIEW
reference_page_integration_status=IMPLEMENTED_PENDING_USER_REVIEW
formal_acceptance_execution_status=NOT_RUN          （保持不变）
page_migration_status=NOT_STARTED                   （保持不变）
page_migration_authorization_status=NOT_GRANTED     （保持不变）
shared_implementation_design_status=APPROVED        （保持不变）
```

- **未**写入 `IMPLEMENTED_ACCEPTED` / `ACCEPTED` / 正式验收通过 / 生产可用；
- 回写文件：`docs/baseline/list-table-visual-template/README.md`、
  `docs/baseline/README.md`、`docs/baseline/PROJECT_STATUS.md`（+ 本报告与上述报告索引）；
- **未**修改 `docs/features/data-source-management/**`；
- 历史报告（`reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001*.md`、
  `reports/*-SHARED-IMPLEMENTATION-DESIGN-*.md`、`reports/*-APPROVAL-CLOSEOUT-*.md`）**未回写**。

## 8. 服务与外部访问（§十二 / §十九）

| 服务 | 监听 | PID（最终，自最终提交重启后） | 工作目录 | 日志 |
| --- | --- | --- | --- | --- |
| 后端（未修改） | `127.0.0.1:8080` | 6789 | `/agent/cdc-config-platform/backend` | `/tmp/ltvt-001/backend.log` |
| 前端（实现侧，验收入口） | `0.0.0.0:5173` | 包装 13026 / 监听 13040 | `/agent/cdc-config-platform/frontend` | `/tmp/ltvt-001/impl-frontend-final.log` |

- 验证期间另有基线副本前端（`0.0.0.0:5174`，PID 7062，工作目录 `/tmp/ltvt-baseline/frontend`）
  与 headless Chrome（CDP 9222，PID 7289）；两者均为验证专用，
  **验证结束后已按精确 PID 停止**，不属于交付运行态。
- 前端已在提交完成后**从最终提交重新启动**（§十二），当前工作树与 `HEAD` 一致
  （`git diff HEAD -- frontend/ docs/baseline/` 为空）。

供项目负责人目测的 URL：

```text
http://192.168.174.70:5173/config/data-source
```

服务保持运行等待验收；停止命令（按精确 PID，未使用 `pkill`/`killall`/模糊匹配）：

```bash
kill 13026 13040   # 实现侧前端（验收完成后）
kill 6789          # 后端
```

**验证边界**：本机 `curl --noproxy '*'` 对 `127.0.0.1:5173` 请求成功；
`http://192.168.174.70:5173` 的用户侧可达性未在本机证实（未修改服务器防火墙、代理或网络配置），
请项目负责人在浏览器实际打开确认。

## 9. 遗留问题与边界

1. **本任务不构成正式验收**：`formal_acceptance_execution_status` 仍为 `NOT_RUN`；
   `IMPLEMENTED_PENDING_USER_REVIEW` 只表示待项目负责人目测复核。
2. **未授权的迁移状态**：`page_migration_status=NOT_STARTED`、
   `page_migration_authorization_status=NOT_GRANTED`；本任务**未**评估或修改任何其他页面的迁移状态。
3. **任务外既有修改保持不动**：`.claude/settings.local.json`、`docs/prompts/` 全程未修改、未暂存、未提交。
4. **构建产物核对依赖基线副本**：`scan-build-artifacts.mjs` 需要基线 dist 才能做规则集差分；
   本次基线 dist 由 `ae6439b` 导出副本现场构建（工作副本，未提交）。
5. **非白名单基线文档存在过期表述（本任务未修改，仅报告）**：
   `docs/baseline/DEVELOPMENT_RULES.md`、`docs/baseline/ARCHITECTURE.md`、
   `docs/baseline/DOMAIN_GLOSSARY.md` 中仍写有该模板「公共实现未开始 / `NOT_STARTED`」。
   这三份文件**不在本任务允许修改范围内**，故保持原样；
   其中 `ARCHITECTURE.md` 的「公共实现详细设计未开始」在本次任务之前**即已过期**
   （详细设计批准收口时未同步）。建议由**独立授权的基线维护任务**统一同步。
6. **两个可选负向页面在该环境未渲染表格**（日志查询功能未开放、故障历史无数据），
   按 `TABLE_NOT_RENDERED` 记录，不参与逐值比较。

---

来源: 本任务执行记录、真实浏览器证据（`reports/evidence/…-001/browser/`）与可复现脚本（`…/scripts/`）
