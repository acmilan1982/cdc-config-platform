# 中心端配置正式验收缺陷修复实现报告

## 1. 任务元数据

| 项目 | 值 |
|---|---|
| 任务编号 | `SERVER-CONFIG-FORMAL-ACCEPTANCE-DEFECT-FIX-001` |
| Feature | `server-config`（中心端配置） |
| 仓库/分支 | `acmilan1982/cdc-config-platform` / `develop` |
| 授权起点（HEAD = origin/develop） | `dea33609831965885147e6b1da08c264471eebd9` |
| 任务性质 | 正式验收失败项的小范围前端修复、自动化测试与构建验证 |
| 目标验收项 | `SC-AC-009`、`SC-AC-062` |
| 批准需求依据 | `REQUIREMENTS.md`：`SC-UI-12`、`SC-UI-15`、`SC-READONLY-03`；`ACCEPTANCE.md`：`SC-AC-009`、`SC-AC-062`；`UI.md`：`SC-UI-DESIGN-031/032/156` |
| 执行日期 | 2026-08-28 |
| 当前正式验收候选结果 | `64 PASSED / 2 FAILED`，状态 `FAILED_PENDING_FIX_REVIEW_AND_TARGETED_RETEST` |

本任务只实现已批准基线中缺失的两项前端显示行为，不修改需求或验收标准，不执行正式验收收口，不把 `SC-AC-009/062` 改成 PASSED。

## 2. Git 开始现场与无关工作区保护

任务开始时 `HEAD == origin/develop == dea3360...`，ahead/behind 为 `0 0`。工作区存在 114 项与本任务无关的既有变更（前端布局、`docs/agent-prompts`、`docs/baseline-work`、`docs/task-reports`、大屏相关等），全部原样保留，未清理、未覆盖、未暂存、未提交。本任务只暂存并提交 4 个授权文件。

## 3. 两项修复的实现细节与安全文本边界

### 3.1 Key Tooltip 前缀（SC-UI-15 / SC-AC-009 问题一）

- 文件：`frontend/src/views/server-config/ServerConfigPage.vue`（配置项说明列）。
- 变更：Key 信息图标 Tooltip 的 `content` 由纯 `row.configKey` 改为 `` `配置Key：${row.configKey}` ``。
- 效果：Key 为 `snapshotBatchSize` 时 Tooltip 精确显示 `配置Key：snapshotBatchSize`；`configKey` 为 NULL/空时保持 `v-if="row.configKey"` 不渲染 Key 信息图标，现有兜底逻辑不变。
- 安全边界：使用 Vue 文本插值绑定，未使用 `v-html`、`innerHTML` 或 HTML 拼接；不新增独立 Key 列，Key 不作为页面主内容持续展示。

### 3.2 超宽只读值省略与悬停原文（SC-UI-12 / SC-READONLY-03 / SC-AC-009 问题二 / SC-AC-062）

- 文件：`frontend/src/views/server-config/ConfigValueEditor.vue`（不可编辑分支）。
- 模板变更：不可编辑且值非空时，`.raw-value` 被 `el-tooltip` 包裹，`:content="rawDisplay"`（未截断、未脱敏、未改写的原始 `CONFIG_VALUE`），`placement="top"`；值为 NULL/空串时 `:disabled="!hasRawValue"` 禁用 Tooltip，仍显示 `（空值）` 占位。
- 脚本变更：新增 `hasRawValue = rawDisplay !== ''`，用于空值禁 Tooltip。
- CSS 变更：`.raw-value` 增加 `display:block; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;`，保证单行省略；`.config-value-editor` 增加 `min-width:0` 以支持省略在表格窄列生效。
- 行为保持：短值同样提供完整原文 Tooltip（允许，不构成缺陷）；未引入 ResizeObserver/手工尺寸状态；未改变可编辑行的下拉/多选/数字输入/校验/保存/禁用行为；值展示与 Tooltip 均为安全文本渲染（无 `v-html`），`<b>`/`<script>` 等 HTML 文本不会被解析执行。

## 4. 精确修改文件清单

| 文件 | 类型 | 变更 |
|---|---|---|
| `frontend/src/views/server-config/ServerConfigPage.vue` | 代码 | Key Tooltip `content` 增加 `配置Key：` 前缀 |
| `frontend/src/views/server-config/ConfigValueEditor.vue` | 代码 | 只读值 el-tooltip 包裹 + 空值禁用 + 单行省略 CSS + `min-width:0` |
| `frontend/src/views/server-config/ServerConfigPage.spec.ts` | 测试 | 新增 7 条缺陷修复覆盖用例 |
| `docs/features/server-config/reports/SERVER-CONFIG-FORMAL-ACCEPTANCE-DEFECT-FIX-001.md` | 报告 | 本报告（新建） |

除上述 4 个文件外，未修改、新建、删除或提交任何文件。

## 5. 新增/调整测试的逐项覆盖

在 `ServerConfigPage.spec.ts` 新增 describe「缺陷修复：Key Tooltip 前缀与只读超宽值省略/悬停原文（SC-AC-009/SC-AC-062）」，7 条用例：

| # | 用例 | 覆盖 |
|---|---|---|
| 1 | Key Tooltip content 精确为 `配置Key：{CONFIG_KEY}`，不是纯 Key | SC-AC-009 问题一 / SC-UI-15 |
| 2 | configKey 缺失时不渲染 `.key-icon` | 现有兜底逻辑保持 |
| 3 | 非空只读值由 Tooltip 包裹，content 为完整原始值且未禁用 | SC-AC-009 问题二 |
| 4 | 长只读值（120 字符）DOM 文本保持完整原文，不在 JS 截断，Tooltip 完整 | SC-AC-009/062 不截断 |
| 5 | `.raw-value` 具备单行省略关键样式语义（源码静态断言：`overflow:hidden`、`text-overflow:ellipsis`、`white-space:nowrap`、无 `v-html`） | SC-AC-009/062 省略样式 |
| 6 | NULL/空只读值仍显示 `（空值）`，Tooltip 被禁用 | SC-AC-009 空值兜底 |
| 7 | 只读值含 `<b>`/`<script>` 文本时不生成对应 DOM 元素，Tooltip 与页面文本均保持安全原文 | XSS 安全文本边界 |

测试断言实际组件属性与 DOM 结构，不只搜索源码字符串；未删除、放宽或跳过任何既有测试。

## 6. 定向、Feature、完整前端测试和生产构建真实结果

| 验证 | 命令 | 结果 |
|---|---|---|
| 定向测试 | `npx vitest run src/views/server-config/ServerConfigPage.spec.ts` | 1 file, 36 tests passed |
| Feature 测试 | `npx vitest run src/api/serverConfig.spec.ts src/views/server-config/configRules.spec.ts src/views/server-config/ServerConfigPage.spec.ts` | 3 files, 66 tests passed |
| 完整前端测试 | `npx vitest run` | 13 files, 152 tests passed（修复前 145，新增 7 条） |
| 生产构建 | `npm run build` | ✓ built in 15.71s（仅 chunk 体积警告，非错误） |
| 空白校验 | `git diff --check` | 通过 |
| 修改文件范围 | 相对授权基线 `dea3360...` 核验 | 仅上述 4 个授权文件 |
| v-html 检查 | `grep v-html` 于 `server-config` 视图 | 组件无 `v-html`（仅测试中的断言字符串出现） |
| 后端/批准文档 | `git diff` 核验 | 后端代码、测试与六份批准功能文档零变化 |

## 7. JSDOM 不计算真实溢出布局的边界说明

JSDOM 不执行真实布局计算，`text-overflow:ellipsis` 的省略号是否在特定列宽处实际出现，无法在 JSDOM 中客观验证。因此：单行省略的关键样式语义通过源码静态断言（`.raw-value` 具备 `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`）与 class 结构验证；最终省略显示与悬停完整原文，由生产构建 + 后续真实浏览器定向重验（`SC-AC-009/062`）共同验证。

## 8. 数据库、接口、服务、ZooKeeper 均未操作

- 未访问或写入数据库；
- 未调用 `GET /api/server-config` 或 `POST /api/server-config/save`；
- 未启动、停止或重启前后端及任何业务服务；
- 未操作 ZooKeeper、Kafka；
- 未执行正式浏览器验收；未运行 Maven。

## 9. 正式验收状态

正式验收仍为 `64 PASSED / 2 FAILED`（`SC-AC-009`、`SC-AC-062`），本任务不得提前改为通过。当前实现状态为 `IMPLEMENTED_FIX_PENDING_CHATGPT_REVIEW_AND_TARGETED_RETEST`。

## 10. 下一步

仅为 ChatGPT 代码复审；复审通过后另行执行真实浏览器定向重验 `SC-AC-009`、`SC-AC-062` 及相关回归测试，再进入验收收口。本任务不执行这些步骤。

## 11. Commit、Push 与 ahead/behind 结果

- 新建报告文件（唯一新建）：`docs/features/server-config/reports/SERVER-CONFIG-FORMAL-ACCEPTANCE-DEFECT-FIX-001.md`
- Commit 信息：`fix(server-config): complete readonly value tooltips`
- Push：普通 push 到 `origin/develop`（无 force）
- 推送后核对：`HEAD == origin/develop`、ahead/behind `0 0`
- 无关工作区内容：原样保留，未清理/未覆盖/未暂存/未提交

（本报告记录 Commit/Push 计划与实际执行结果；最终值见任务完成后的控制台机器块。）
