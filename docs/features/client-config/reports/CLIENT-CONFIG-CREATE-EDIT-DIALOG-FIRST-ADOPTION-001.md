# 探针端管理新增／编辑业务主弹窗接入公共 `create-edit-dialog-visual-template` 视觉预设报告

- 任务编号：`CREATE-EDIT-DIALOG-CLIENT-CONFIG-FIRST-ADOPTION-001`（前端实现报告按 Feature 目录归档于 `docs/features/client-config/reports/`）
- 任务类型：前端**页面接入 + 契约测试 + 最小文档同步**（改 `/config/client` 页面组件与其测试、公共契约测试，并同步 Feature 与模板的现行状态块、导航与迁移时序，新建本报告与脱敏证据包）
- 分支：`develop`
- 起始提交（base）：`ab4d49766d089c741159c2c86861f6af7e74b29b`
- 依据：`docs/prompts/client-config/CREATE-EDIT-DIALOG-CLIENT-CONFIG-FIRST-ADOPTION-001-Agent-Prompt.md`
- 接入对象：`create-edit-dialog-visual-template` 公共 CSS 预设（公共实现提交 `c8785e18`（R0）经远程代码复审 `CHANGES_REQUIRED` 后由 `...-R1` `8434b884904a34bed51a2d8364e217efb605f06c` 纠错并获 ChatGPT 远程代码复审 `APPROVED`，时点 `2026-09-30`；状态同步提交 `ae88ad1`）
- 现行下一入口：`CHATGPT_REMOTE_CREATE_EDIT_DIALOG_CLIENT_CONFIG_FIRST_ADOPTION_REVIEW`
- 边界声明：本任务**仅**把已复审通过的公共弹窗视觉预设接入 `/config/client`（探针端管理）**新增／编辑业务主弹窗**，**不**改公共 CSS 令牌/选择器/默认值，**不**改公共契约，**不**接入 `/config/data-source` 或任何其他页面，**不**创建公共 Vue 组件，**不**执行正式验收、**不**做项目负责人页面目测、**不**修改任何定义行。

---

## 1. 授权与批准依据

```text
task_code=CREATE-EDIT-DIALOG-CLIENT-CONFIG-FIRST-ADOPTION-001
public_preset_design_baseline=APPROVED_BY_PROJECT_OWNER（2026-09-30，R2 45ce16d）
public_preset_code_review=PASSED_APPROVED_BY_CHATGPT_REMOTE_CODE_REVIEW（2026-09-30，R1 8434b88）
public_preset_status_sync_commit=ae88ad1
project_owner_decision=仅 /config/client 新增／编辑主弹窗本轮接入；其余页面另起会话
page_adoption_authorization_scope=CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY
public_css_mutation=NONE
public_vue_component=NONE_ADDED
```

- 依据「公共 CSS 预设设计基线**已批准**」「公共 CSS 代码**已通过 ChatGPT 远程代码复审 `APPROVED`**」及项目负责人明确的范围决定「**先让 `/config/client`（探针端管理）的新增／编辑业务主弹窗**接入公共预设」，本任务只做**页面接线**。
- 本任务**不**改公共契约、公共 CSS、业务语义或任何其他页面；**不**创建公共 Vue 组件、**不**引入 `el-form`。
- 页面接入并推送 **≠** 远程复审通过 **≠** 项目负责人已目测 **≠** 157 条整体正式验收通过。

## 2. 门禁与基线

```text
branch=develop
expected_base_commit=ab4d49766d089c741159c2c86861f6af7e74b29b
actual_base_commit=ab4d49766d089c741159c2c86861f6af7e74b29b
origin_develop=ab4d49766d089c741159c2c86861f6af7e74b29b
remote_refs_heads_develop=ab4d49766d089c741159c2c86861f6af7e74b29b
ahead_behind(origin/develop...HEAD)=0/0
definition_rows=REQ 154 / AC 157 / DESIGN 89 / UI 77（开工时核对为各文件最大编号且连续唯一无缺号）
acceptance_status_cells=PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15 = 157（仅核对，不因本任务改动）
```

- 开工时本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`ab4d497`），ahead/behind `0/0`，无分叉、无冲突；远程**未**超前。
- 任务开始前已存在的**无关**工作区内容**全程保持原样、未修改、未暂存、未提交**：` M .claude/settings.local.json`（已版本化的 agent/server 配置）、未跟踪的 `docs/prompts/**` 与 `runtime-logs/**`。
- 未使用 `reset --hard`／`clean`／`stash`／force-push；未操作 `develop` 以外分支。

## 3. 允许修改范围与实际变更

**代码与测试：**
- `frontend/src/views/client-config/ClientConfigPage.vue`：主 `el-dialog` 根在 `cc-dialog` **并列处**追加根类 `ced-dialog`；三个字段行追加 `ced-label-row`、标签追加 `ced-form-label` 与 `ced-required-mark`、反馈占位追加 `ced-field-feedback`、主提交按钮追加 `ced-submit`；ID／描述控件行与字段错误文字改挂 `ced-field--error`／`ced-field-error`。**移除**页面私有同义视觉规则（弹窗 `max-width`、主按钮正常/hover/focus/active 色序、标签行 `display/gap`、标签字体/字重/颜色/对齐/`flex-basis`、`::before` 红星、字段错误红框 `box-shadow`、`.cc-field-feedback` 的 `min-height/margin-top`、`.cc-field-error` 的字体色阶），改由公共预设唯一承担；新增一个**非 scoped** `.cc-dialog.ced-dialog` 块声明**四个 Feature 令牌**。
- `frontend/src/views/client-config/ClientConfigPage.spec.ts`：字段错误选择器改读公共类 `ced-field--error`／`ced-field-error`；提交按钮断言补充 `ced-submit` 且校验“取消/自动生成/修改探针 ID”**零挂载**；新增“公共类挂载”用例；静态视觉断言改为核对**本页声明的 4 个 Feature 令牌** + **私有同义规则已移除**。
- `frontend/src/styles/dialog/create-edit-dialog-visual.spec.ts`：#19 根类 opt-in 由「任何页面零挂载」改为**白名单仅 `ClientConfigPage.vue`**；#20 增加“页面声明的 `--ced-*` 集合恰为 4 个 Feature 令牌、且不消费根类选择器”断言；`ROOT_RULE_RE` 收窄以排除本页合法的复合令牌块。

**文档（现行接入事实、导航、迁移时序）：**
- `docs/features/client-config/README.md`（新增 §1.15、§4 现行状态条目、§5 现行下一入口、§2 导航）
- `docs/baseline/create-edit-dialog-visual-template/{README,DESIGN,UI,SHARED_COMPONENT_DESIGN,MIGRATION}.md`（**仅**状态块与紧随的状态分层语句、迁移时序、导航最小同步；**不**改设计契约正文/令牌/断言）
- `docs/baseline/README.md`（弹窗模板导航条目状态同步）
- 新增本报告与脱敏证据包 `docs/features/client-config/reports/evidence/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001/`

> `docs/features/client-config/{UI,DESIGN,REQUIREMENTS,ACCEPTANCE,API,DATABASE}.md` **未改**（UI/DESIGN 未引用弹窗公共模板，无需同步；ACCEPTANCE 157 条状态格与定义行逐字节不变，统计仅核对）。

## 4. 视觉迁移：规则归属 before → after

| 视觉关注点 | 迁移前（页面私有规则，`ab4d497`） | 迁移后（公共预设唯一承担 + Feature 令牌） |
| --- | --- | --- |
| 弹窗容器安全边距 | `:deep(.cc-dialog){ max-width: calc(100vw - 48px) }` | `.ced-dialog{ max-width: calc(100vw - var(--ced-dialog-safety-inset)) }`；本页给 `--ced-dialog-safety-inset: 48px` |
| 标签行水平间距 | `.cc-form-item{ display:flex; align-items:flex-start; gap:12px }` | `.ced-label-row{ display:flex; align-items:flex-start; gap:var(--ced-label-gap) }`；本页给 `--ced-label-gap: 12px` |
| 标签排版 | `.cc-form-label{ flex:0 0 84px; font-size:14px; font-weight:500; color:#3f3f46; text-align:right }` | `.ced-form-label`（字体/字重/颜色/右对齐/`flex-basis:var(--ced-label-column-width)`）；本页给 `--ced-label-column-width: 84px`，仅保留无关的 `padding-top: 6px` |
| 必填红星 | `.cc-form-label::before{ content:'*'; color:#f56c6c; margin-right:2px }` | `.ced-form-label.ced-required-mark::before`（同上视觉）；沿用页面既有无条件呈现，**不**新增必填校验 |
| 主提交按钮 | `.cc-dialog-submit:not(.is-disabled)` 正常/hover/focus/active 色序 | `.ced-submit:not(.is-disabled)` 同色序（`#09090b` / `#27272a` / `#18181b`） |
| 字段错误红框 | `.cc-field--error :deep(.el-input__wrapper…) { box-shadow: 0 0 0 1px var(--el-color-danger) inset }` | `.ced-field--error .el-input__wrapper,…{ box-shadow: 0 0 0 1px var(--el-color-danger) inset }` |
| 反馈占位 | `.cc-field-feedback{ min-height:20px; margin-top:2px }` | `.ced-field-feedback{ min-height:20px; margin-top:2px }`（公共） |
| 错误文字 | `.cc-field-error{ … 13px/1.4/var(--el-color-danger)/overflow-wrap:anywhere }` | `.ced-field-error`（公共同值） |
| 主按钮加载态 | 页面私有 `.cc-dialog-submit.is-loading…`，底色硬编码 `#3f3f46` | **仍留页面**（公共 `:not(.is-disabled)` 在真实 EP 下不命中，见 §5），底色改用 Feature 令牌 `--ced-submit-bg-loading: #3f3f46` |

> **取值来源边界**：迁移前的值取自 `git show ab4d497:frontend/src/views/client-config/ClientConfigPage.vue`（**源码字面量**，可复算）；迁移后的值取自**实际页面**的 `getComputedStyle`（见 §7 证据）。两者口径不同（源码声明 vs 计算样式），**不**混称同一测量。

## 5. 加载态归属（据实现事实）

- 本页主按钮同时绑定 `:disabled="submitting"` 与 `:loading="submitting"`；真实 Element Plus 下加载态**同时**带 `is-disabled` 与 `is-loading`（浏览器实测 `className` 含两者，`disabled` 属性为真）。
- 因此公共预设的 `.ced-submit.is-loading:not(.is-disabled)` **不会命中**本按钮。该加载态墨色（背景/边框/字色/游标）**确属 Feature 专用视觉**，按任务要求**以 Feature 令牌 `--ced-submit-bg-loading` 保留在本页**，仅限定本主弹窗主按钮的加载态，不新增全局覆盖、不强制提升优先级；`::before` 白遮罩透明化同样保留在本页。
- 结论：这是**已知且经核验的页面事实**，**不是**公共 CSS 缺陷；公共预设的加载态规则本身正确，只是该页按钮的 `is-disabled` 使其不适用。公共 CSS **未**因此改动。

## 6. 行为零改动

字段构成、字段级校验与错误归属、错误清除时机、`role="alert"`、候选源库／已选源库双栏与选择语义、ID 锁定与修改、自动生成、保存防重、取消／关闭确认、错误反馈长文案换行、请求与响应时序**全部保持**；**未**引入 `el-form`、**未**新增 Vue 组件、**未**改路由/菜单/接口/存储/数据库/ZooKeeper/Kafka；**未**触发额外请求。

## 7. 验证与证据

### 7.1 测试与构建（本地，`frontend/`）

| 命令 | 结果 |
| --- | --- |
| `npx vitest run src/styles/dialog/create-edit-dialog-visual.spec.ts src/views/client-config/ClientConfigPage.spec.ts` | **2 文件 205 用例全通过**（`21` + `184`），退出码 `0` |
| `npm test`（全量） | 见 §7.3（本次复核实跑） |
| `npm run build` | **成功**，`✓ built`，退出码 `0` |

公共契约测试继续守住：17 令牌、根类作用域（`.ced-dialog {` 单处）、`!important` 计数 0、未接入页面零泄漏（白名单仅本页）。

### 7.2 真实浏览器只读核对（实际 `/config/client` 页）

- 驱动：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001/verify-dialog-adoption.mjs`（Playwright 只读；`PLAYWRIGHT_MODULE` 指向只读安装目录）。
- 结果：`dialog-adoption-results.json`，`checks` **29/29 通过**。
- 覆盖：弹窗根类 `el-dialog cc-dialog ced-dialog`；公共预设规则**来源为公共 CSS 文件**（Vite dev id 校验，12 条 `.ced-dialog` 规则来自 `frontend/src/styles/dialog/create-edit-dialog-visual.css`，页面仅贡献 1 条 `.cc-dialog.ced-dialog` 令牌块）；四枚 Feature 令牌 `84px/12px/48px/#3f3f46`；标签 `14px/500/rgb(63,63,70)` 右对齐 `flex-basis 84px` + `padding-top 6px`；红星唯一 `content:"*"` `rgb(245,108,108)`；标签行 `flex`+`gap:12px`；反馈占位 `min-height:20px/margin-top:2px`；主按钮 常态 `rgb(9,9,11)`／hover `rgb(39,39,42)`／focus `rgb(39,39,42)`／active `rgb(24,24,27)`／恢复常态；加载态 `rgb(63,63,70)`、白字、`cursor:not-allowed`、遮罩 `rgba(0,0,0,0)`；错误态容器 2、红框 `rgb(245,108,108) 0 0 0 1px inset`、长文案 3 行换行；窄视口（`420`）弹窗宽 `372 = 420−48` 不溢出；宽视口宽 `900`／`max-width 1232 = 1280−48`；编辑弹窗同挂公共类且仅保存按钮挂 `ced-submit`；`/config/data-source` 弹窗 `ced-*` 计数全 0 且视觉未变。
- **桩与真实后端边界**：GET `/api/clients` 与 `/api/clients/data-source-options` 由浏览器内**只读合成桩**填充（脱敏合成数据），其余 GET 返回空集合 `200`；**未**连真实后端/数据库/ZooKeeper；**未**以静态 HTML 夹具冒充实际页面（导航的是真实运行中的 Vite 页面）。
- **零写**：`/api/**` 的 POST/PUT/PATCH/DELETE 在浏览器路由层 `abort`，`writeSummary.nonGetReachedBackend=0`（仅 1 次 POST `/api/clients` 尝试被浏览器层拦截，未转发到 Vite 代理、更未到达后端）；未提交有效表单、未触发启停/删除最终确认、未改业务数据。

### 7.3 本次复核实跑记录

- 定向：`2 文件 205 用例全通过`（见 §7.1）。
- 全量 `npm test`：**`58` 文件 / `1188` 用例全通过**，退出码 `0`（复核命令与退出码见证据 JSON 与本节）。
- 构建：`npm run build` 退出码 `0`。

## 8. 定义与状态保护

```text
definition_rows=REQ 154 / AC 157 / DESIGN 89 / UI 77（逐字节不变）
acceptance_status_cells=PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15 = 157（不变）
preexisting_feature_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE（不变）
adjustment1..7_* 状态键=保持原值（不变）
public_css_code_review_status=APPROVED（不回退）
formal_acceptance_execution_status=NOT_EXECUTED / NOT_RUN（不变）
```

- **未**因代码测试通过而上调任何正式验收；**未**修改任何 REQ/AC/DESIGN/UI 定义行；**未**回写历史报告与历史证据（append-only）。
- 页面接入状态记为**「已实现、待远程代码复审和负责人目测」**，**不**写成已接受或正式验收 PASS。

## 9. 实际变更文件

```text
frontend/src/views/client-config/ClientConfigPage.vue
frontend/src/views/client-config/ClientConfigPage.spec.ts
frontend/src/styles/dialog/create-edit-dialog-visual.spec.ts
docs/features/client-config/README.md
docs/features/client-config/reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001.md（本报告，新增）
docs/features/client-config/reports/evidence/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001/verify-dialog-adoption.mjs（新增）
docs/features/client-config/reports/evidence/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001/dialog-adoption-results.json（新增）
docs/features/client-config/reports/evidence/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001/README.md（新增）
docs/features/client-config/reports/evidence/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001/SHA256SUMS.txt（新增）
docs/baseline/create-edit-dialog-visual-template/README.md
docs/baseline/create-edit-dialog-visual-template/DESIGN.md
docs/baseline/create-edit-dialog-visual-template/UI.md
docs/baseline/create-edit-dialog-visual-template/SHARED_COMPONENT_DESIGN.md
docs/baseline/create-edit-dialog-visual-template/MIGRATION.md
docs/baseline/README.md
```

- 公共 `frontend/src/styles/dialog/create-edit-dialog-visual.css` 与其 17 令牌、7 辅助类、选择器、默认值 **未改**（已复审通过的公共规则原样沿用）。
- **未**修改 `docs/features/client-config/ACCEPTANCE.md`、`REQUIREMENTS.md`（定义行/状态格保护）。
- `/config/data-source` 源码、后端、数据库/ZooKeeper/Kafka、其他模板与项目级基线**不在范围、未改**。
- 任务开始前已有的无关工作区内容全程保持原样，**未**修改、**未**暂存、**未**提交。

## 10. 未执行项

- **未**修改公共 CSS 的令牌/选择器/默认值；**未**创建公共 Vue 组件；**未**引入 `el-form`；
- **未**接入 `/config/data-source` 或任何其他页面（其 `ced-*` 挂载计数仍为 0）；
- **未**执行正式验收、**未**做项目负责人页面目测、**未**作 157 条整体接受决定；
- **未**访问真实后端/数据库/ZooKeeper/Kafka；浏览器核对仅走**只读**合成桩；
- **未**启动/重启/部署业务服务（沿用已在运行的只读核对环境）。

## 11. 下一入口（模板级迁移时序分层）

```text
template_page_migration_history_keys=PAGE_MIGRATION_NOT_STARTED / PILOT_NOT_DECIDED（模板级「页面迁移/试点」语义：模板级批量迁移，保持原措辞）
single_page_adoption_status=IMPLEMENTED_PENDING_CHATGPT_REMOTE_REVIEW_AND_OWNER_VISUAL_CHECK
migrated_page_count=1（口径：本模板 opt-in 根类 ced-dialog 的真实接入**业务页数**，本页 = 1；不含隔离合成夹具）
next_entry=CHATGPT_REMOTE_CREATE_EDIT_DIALOG_CLIENT_CONFIG_FIRST_ADOPTION_REVIEW
```

- 模板级「页面迁移/试点」历史键（`page_migration_status`/`pilot_page_selection_status` 等）**语义为模板级批量迁移**，与本次**单页接入**不同层，**保持原措辞**并分层说明，**不**机械改为“全项目已授权”。
- `migrated_page_count` 由 `0` 更新为 `1`，并限定统计口径为“已接入本模板 opt-in 根类的真实业务页面数”。

**页面接入并推送 ≠ 远程复审通过 ≠ 项目负责人已目测 ≠ 157 条整体正式验收通过。**
