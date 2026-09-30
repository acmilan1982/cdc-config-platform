# 探针端管理主列表接入 §13 公共可选单行固定高亮预设报告

- 任务编号：`CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001`
- 任务类型：前端**页面接入 + 契约测试 + 最小文档同步**（改 `/config/client` 页面代码与测试，并同步五份 Feature 文档、三份模板文档，新建本报告与脱敏证据包）
- 分支：`develop`
- 起始提交（base）：`ebf34d970d720aa124dc7a1ea94ba811dcf21584`
- 依据：`docs/prompts/client-config/CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001-AGENT-PROMPT.md`
- 接入对象：`list-table-visual-template` `SHARED_COMPONENT_DESIGN.md` §13.3 **公共可选单行固定高亮视觉预设**（公共 CSS 提交 `f35fb5a91fa872402d23a0ce2656a3d3719aa157` 已通过 ChatGPT 远程代码复审 `APPROVED`；状态同步提交 `ebf34d970d720aa124dc7a1ea94ba811dcf21584`）
- 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_OPTIONAL_ROW_HIGHLIGHT_PUBLIC_PRESET_ADOPTION_REVIEW`
- 边界声明：本任务**仅**把已复审通过的公共 §13.3 外观接入 `/config/client`**主列表**，**不**改公共契约/9 个 `--lt-*` 令牌/4 个内部 helper 类，**不**改业务语义或其余页面，**不**执行正式验收、**不**做项目负责人页面目测、**不**修改任何定义行。

---

## 1. 授权与批准依据

```text
task_code=CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001
public_preset_design_baseline=SHARED_COMPONENT_DESIGN.md §13（已批准）
public_preset_code_review=PASSED_APPROVED_BY_CHATGPT_REMOTE_CODE_REVIEW
public_preset_status_sync_commit=ebf34d970d720aa124dc7a1ea94ba811dcf21584   # 本任务 base
project_owner_decision=仅 /config/client 主列表本轮接入；其余页面另起会话
page_adoption_authorization_scope=CLIENT_CONFIG_MAIN_LIST_ONLY
```

- 依据 §13 公共可选单行固定高亮视觉预设的**设计基线已批准**、**公共实现已通过 ChatGPT 远程代码复审 `APPROVED`**，以及项目负责人明确的范围决定「本轮只让 `/config/client` 主列表采用公共预设，其他页面留给别的会话」，本任务只做**页面接线**。
- 本任务**不**改公共契约、业务语义或任何其他页面；**不**修改批准对象本身。页面接入并推送**不**等于远程复审通过、**不**等于项目负责人已目测、**不**等于正式验收通过。

## 2. 门禁与基线

```text
branch=develop
expected_base_commit=ebf34d970d720aa124dc7a1ea94ba811dcf21584
actual_base_commit=ebf34d970d720aa124dc7a1ea94ba811dcf21584
origin_develop=ebf34d970d720aa124dc7a1ea94ba811dcf21584
remote_refs_heads_develop=ebf34d970d720aa124dc7a1ea94ba811dcf21584
ahead_behind(origin/develop...HEAD)=0/0
definition_rows=REQ 154 / AC 157 / DESIGN 89 / UI 77（开工时核对连续唯一无缺号）
```

- 开工时本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`ebf34d9`），ahead/behind `0/0`，无分叉、无冲突；远程**未**超前。
- 任务开始前已存在的**无关**工作区内容**全程保持原样、未修改、未暂存、未提交**：` M .claude/settings.local.json`（已版本化的 agent/server 配置）、未跟踪的 `docs/prompts/**` 与 `runtime-logs/**`。
- 未使用 `reset --hard`／`clean`／`stash`／force-push；未操作 `develop` 以外分支。

## 3. 允许修改范围与实际变更

**代码与测试：**
- `frontend/src/views/client-config/ClientConfigPage.vue`：主列表表根在根类 `lt-main-table` **并列处**新增表级 `lt-row-highlight`；`rowClassName` 为被固定行提供行级 `lt-row-highlight__row`；**移除**页面五条私有高亮视觉规则（`current-row` 归零 / 普通行 `tr:hover` / 固定行底色 / 固定行自 `hover` / 首格左缘强调），改由公共 §13.3 预设单独承载；保留既有 `<style scoped src="@/styles/list-table/list-table-visual.css">`。
- `frontend/src/views/client-config/ClientConfigPage.spec.ts`：静态视觉断言改读公共源文件 `src/styles/list-table/list-table-visual.css` 经 `PUBLIC_NS`（`.lt-main-table.lt-row-highlight :deep(.el-table__body `）核验；`cc-row--selected` 挂载断言改为公共行级类 `lt-row-highlight__row`；保留单击固定 / 双击编辑 / 启停确认 / 重载竞态 / 行内控件事件隔离等行为断言；旧私有类列入「不存在」断言。
- `frontend/src/styles/list-table/list-table-visual.spec.ts`：#14 由「业务页零挂载」改为**正向断言仅 `ClientConfigPage.vue` 主列表允许挂双层类、其余页面仍为零**；#11 helper 集合仍为 4；#13/#15 不变。

**文档（现行接入事实、导航、变更记录）：**
- `docs/features/client-config/README.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`UI.md`
- `docs/baseline/list-table-visual-template/README.md`、`SHARED_COMPONENT_DESIGN.md`、`MIGRATION.md`
- 新增本报告、模板侧交叉引用报告与脱敏证据包
  `docs/features/client-config/reports/evidence/CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001/`

## 4. 视觉迁移：规则归属 before → after

| 视觉关注点 | 迁移前（页面私有规则） | 迁移后（公共 §13.3 预设） |
| --- | --- | --- |
| 普通行悬停底 | 页面 `tr:hover` 私有规则 `#f4f4f5` | 公共 `:not(.lt-row-highlight__row)` 悬停 `#f4f4f5` |
| 固定行底色 | 页面 `.cc-row--selected` 私有规则 `#e1e4e8` | 公共 `lt-row-highlight__row` → `#e1e4e8` |
| 固定行自 `hover` | 页面私有覆盖 | 公共固定行自 `hover` 维持 `#e1e4e8` |
| `current-row` 蓝底归零 | 页面私有重置 | 公共重置（置于固定规则**之前**、同一前导段，靠源序让固定规则胜出） |
| 首格左缘强调 | 页面私有 `inset 3px 0 0 0 #18181b` | 公共 `td.el-table__cell:first-child` 内嵌 3px `#18181b` |

- **接入方式**：表级 `lt-row-highlight` 与根类 `lt-main-table` **并列**（缺一不可），行级 `lt-row-highlight__row` 由 `rowClassName` 提供，形成**双层显式 opt-in**；弹窗内列表**不**接入。
- 迁移后**不再保留**与公共规则竞争或重复的页面私有高亮视觉规则（避免双份来源与源序依赖）。
- 页面视觉**取值不变**（悬停 `rgb(244,244,245)`、固定 `rgb(225,228,232)`、左缘 `rgb(24,24,27)` 3px），**仅**改变规则的来源与归属。

## 5. 行为回归核对（不改交互）

保留且经测试核验不变的页面行为：

- 单击固定 / 再次单击取消（`CLICK_CANCEL_DELAY_MS = 260`，`onRowClick` 对 `event.detail > 1` 早退）／点击其他行转移固定；同一时刻最多一行固定；
- 双击进入编辑与两次点击检测；
- 行内控件（三点/复选框等）事件隔离，不触发固定；
- 查询/重载清除选中；启用/停用成功后按**最新可见 ID** 重选；失败/取消保留；
- R1 请求私有重选参数 `loadList(reselectTarget)` 与过期响应隔离。

**不**新增额外请求；**不**写 URL/存储/接口/数据库；**不**改启停确认、删除语义、三点入口或弹窗。

## 6. 真实浏览器实际页面证据（只读）

- **方法**：真实无头 Chromium 打开**实际** `/config/client` 页面，数据来自独立**只读**合成桩（GET `/api/clients` 由浏览器内合成脱敏行填充，其余非 GET `/api/**` 网络层拦截并计数），**非**夹具冒充、**非**访问真实后端/数据库/ZooKeeper。以真实鼠标 `hover` 触发行悬停，读值均在 Element Plus `0.25s` 过渡沉降（~450ms）之后。
- **证据脚本**：`reports/evidence/CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001/verify-client-optin.mjs`
  （关键：路由谓词按**路径**判定 `new URL(url).pathname.startsWith('/api/')`，避免误拦 Vite 源模块请求）。
- **结果**：`client-optin-results.json` → `ok: true`，**37/37 检查通过**，**写请求计数 0**。
  - 表根实测类串含 `... cc-table lt-main-table lt-row-highlight ...`（双层并列）；
  - 实测色值：未固定透明 `rgba(0,0,0,0)`、普通行悬停 `rgb(244,244,245)`、固定行（含自悬停）`rgb(225,228,232)`、首格左缘 `rgb(24,24,27) 3px 0px 0px 0px inset`；
  - 固定行整行同色（含最右 `el-table-fixed-column--right` 单元格）；文字/描述/三点触发器颜色与未固定行**一致**（未灰化）；取消后无残留 `current-row`、左缘强调消失、行级类计数归零；
  - 覆盖 **1440×900** 与 **1024×768** 两视口；常规行高 `48px`（与只读参考页一致），歧义行 `52px`（内容驱动）；
  - **零泄漏对照**：`/config/data-source` 实测表根 `data-table lt-main-table`，`lt-row-highlight` 与 `lt-row-highlight__row` 计数**均为 0**。
- **未**伪装成迁移前/后像素对照：本任务**无**可比对的接入前截图/测量，故仅核验**已批准色值与既有行为**，**不**编造迁移前基线。

## 7. 测试与构建

- 定向：`ClientConfigPage.spec.ts` **183/183**；`list-table-visual.spec.ts` **15/15**（合计 198）。
- 全量前端：`npm test` **57 文件 / 1166 用例**通过。
- 构建：`npm run build`（`vue-tsc` 类型检查 + Vite 构建）**成功**。
- 说明：测试 `PASS` **≠** 正式验收 `PASS`；jsdom 断言**不**充当 CSS 级联验证，级联行为由第 6 节真实浏览器证据支撑。

## 8. 定义保护与状态边界

**定义行逐字节零变化**（相对 base `ebf34d9`）：

```text
CCFG-REQ-001~154   154 条   连续、唯一、不新增/删除/重排，逐字节零变化
CCFG-AC-001~157    157 条   定义行与状态格逐字节零变化（AC-010 仍 PASS、AC-155~157 仍 BLOCKED）
CCFG-DESIGN-001~089 89 条   逐字节零变化
CCFG-UI-001~077     77 条   逐字节零变化
验收统计=PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15 = 157（按 Git 起点复算，非引用历史值）
```

**四通道标记计数（各通道严格不混算，逐值不变）**：

```text
通道1（README+DESIGN+UI+MIGRATION 四份规范文档）：
  LIST_TABLE_REFERENCE_FACT=28 / LIST_TABLE_TEMPLATE_DRAFT=0 /
  LIST_TABLE_TEMPLATE_APPROVED=43 / LIST_TABLE_PROPOSED_NOT_IMPLEMENTED=7
通道2（SHARED_COMPONENT_DESIGN.md LIST_TABLE_SHARED_DESIGN_APPROVED）=81
通道3（SHARED_COMPONENT_DESIGN.md LIST_TABLE_REFERENCE_FACT）=26
通道4（SHARED_COMPONENT_DESIGN.md LIST_TABLE_PROPOSED_NOT_IMPLEMENTED）=8
lt_token_count=9          # --lt-* 名去重 9、公共层声明 0（未新增令牌）
lt_internal_helper_class_count=4   # {lt-row-action__cell, lt-row-action__ellipsis, lt-row-highlight, lt-row-highlight__row}
公共 CSS !important 计数=0
```

**状态边界（不越界声明）**：

- §13 公共代码复审 `APPROVED` **未**回退；页面接入状态记为**「已接入、待 ChatGPT 远程代码复审及负责人目测」**，**不**直接记为最终验收。
- 本轮**仅**授权 `/config/client` **主列表**接入；**其余任何页面未被授权**。
- 模板级全局页面迁移 `page_migration_status=NOT_STARTED` / `page_migration_authorization_status=NOT_GRANTED` / `pilot_page_selection_status=NOT_DECIDED` 与模板级 `current_next_entry`（`NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`）**保持原措辞**。
- `/config/data-source`「更多」仍是**文字入口**，其三点改造属**另一会话**任务；§12.1 三点触发器**禁用态视觉**仍**未实现**（`CCFG-AC-157` 保持 `BLOCKED`）。
- 本次页面接入**不**自动扩张公共模板默认行为；**未**执行正式验收。
- 页面接入并推送 **≠** 远程复审通过 **≠** 项目负责人已目测 **≠** 157 条整体正式验收通过。

## 9. 实际变更文件

```text
frontend/src/views/client-config/ClientConfigPage.vue
frontend/src/views/client-config/ClientConfigPage.spec.ts
frontend/src/styles/list-table/list-table-visual.spec.ts
docs/features/client-config/README.md
docs/features/client-config/REQUIREMENTS.md
docs/features/client-config/ACCEPTANCE.md
docs/features/client-config/DESIGN.md
docs/features/client-config/UI.md
docs/features/client-config/reports/CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001.md（本报告，新增）
docs/features/client-config/reports/evidence/CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001/verify-client-optin.mjs（新增）
docs/features/client-config/reports/evidence/CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001/client-optin-results.json（新增）
docs/baseline/list-table-visual-template/README.md
docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md
docs/baseline/list-table-visual-template/MIGRATION.md
docs/baseline/list-table-visual-template/reports/LIST-TABLE-CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001.md（模板侧交叉引用报告，新增）
```

- 公共 `frontend/src/styles/list-table/list-table-visual.css` **未改**（已复审通过的公共规则原样沿用）。
- 历史报告与历史证据**未回写**（append-only）。
- 任务开始前已有的无关工作区内容全程保持原样，**未**修改、**未**暂存、**未**提交。

## 10. 未执行项

- **未**修改公共 CSS 规则、9 个 `--lt-*` 令牌、4 个内部 helper 类；
- **未**修改 `/config/data-source` 或任何其他业务页面；**未**改造数据源管理「更多」文字入口；
- **未**执行正式验收、**未**做项目负责人页面目测、**未**作 157 条整体接受决定；
- **未**访问数据库、ZooKeeper、Kafka；浏览器核对仅走**只读**合成桩；
- **未**授权或评估任何其他页面接入/迁移。

## 11. 下一入口

```text
optional_extension_chain_next_step=CHATGPT_REMOTE_CLIENT_CONFIG_OPTIONAL_ROW_HIGHLIGHT_PUBLIC_PRESET_ADOPTION_REVIEW
optional_extension_chain_next_step_scope=CLIENT_CONFIG_MAIN_LIST_SECTION_13_PUBLIC_PRESET_ADOPTION_CODE_REVIEW_ONLY
```

即：**`/config/client` 主列表接入 §13 公共预设的远程代码复审**——只读核验接入实现，**不是**批准其他页面迁移、**不是**正式验收。模板级页面迁移状态层**保持** `NOT_STARTED/NOT_GRANTED/NOT_DECIDED`。

**页面接入并推送 ≠ 远程复审通过 ≠ 项目负责人已目测 ≠ 正式验收通过。**
