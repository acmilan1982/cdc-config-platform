# 执行报告：列表表格视觉模板公共实现详细设计（草案）

## 1. 任务信息

```text
task_code=LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001
task_type=DOCS_ONLY_SHARED_IMPLEMENTATION_DETAILED_DESIGN
branch=develop
design_base_commit_id=e8eb68e368313aa501eb5f7158f6e95975b2077b
approved_baseline_source_commit=575379895c4c57fd3df7e0d0ce27c1f6841d2f17
baseline_approval_closeout_commit=7b16919ea9a7ac2a1196e302e987e5e355689c31
baseline_approval_closeout_r1_commit=e8eb68e368313aa501eb5f7158f6e95975b2077b
reference_source_commit=10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e
execution_date=2026-09-21
```

## 2. 前置检查结果

```text
branch=develop
HEAD=origin/develop=远程 refs/heads/develop=e8eb68e368313aa501eb5f7158f6e95975b2077b
ahead_behind=0 0
工作区任务前状态： M .claude/settings.local.json 、 ?? docs/prompts/
（以上两项属任务外工作区内容，本任务未修改、未暂存、未提交）
```

## 3. 已批准基线证据链

```text
R0 基线建立=LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001
R1 定向修订=LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1（提交 575379895c4c57fd3df7e0d0ce27c1f6841d2f17）
ChatGPT 远程 R1 复审=REVIEW_PASS
blocking_finding_count=0
项目负责人批准日期=2026-09-21
approval_scope=BASELINE_CONTENT_ONLY
批准收口=LIST-TABLE-VISUAL-TEMPLATE-BASELINE-APPROVAL-CLOSEOUT-001（提交 7b16919ea9a7ac2a1196e302e987e5e355689c31）
批准收口 R1 定向修订=...-APPROVAL-CLOSEOUT-001-R1（提交 e8eb68e368313aa501eb5f7158f6e95975b2077b）
```

## 4. 读取范围

### 4.1 文档

```text
docs/baseline/list-table-visual-template/README.md
docs/baseline/list-table-visual-template/DESIGN.md
docs/baseline/list-table-visual-template/UI.md
docs/baseline/list-table-visual-template/MIGRATION.md
docs/baseline/list-table-visual-template/reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md
docs/baseline/list-table-visual-template/reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1.md
docs/baseline/list-table-visual-template/reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-APPROVAL-CLOSEOUT-001.md
docs/baseline/query-list-page-template/README.md
docs/baseline/query-list-page-template/DESIGN.md
docs/baseline/query-list-page-template/UI.md
docs/baseline/query-list-page-template/MIGRATION.md
docs/baseline/query-list-page-template/SHARED_COMPONENT_DESIGN.md
docs/baseline/README.md
docs/baseline/ARCHITECTURE.md
docs/baseline/DEVELOPMENT_RULES.md
docs/baseline/PROJECT_STATUS.md
docs/baseline/DOMAIN_GLOSSARY.md
CLAUDE.md
```

### 4.2 真实源码（全部只读）

```text
frontend/package.json
frontend/vite.config.ts
frontend/src/main.ts
frontend/src/styles/global.css
frontend/src/views/data-source/DataSourcePage.vue
frontend/src/views/data-source/dataSource.spec.ts
frontend/src/components/query-list/index.ts
frontend/src/components/query-list/types.ts
frontend/src/components/query-list/query-list-spinner.css
frontend/src/components/query-list/QueryListResultPanel.vue
frontend/src/components/query-list/shared-layer.spec.ts
frontend/src/composables/query-list/useQueryListTooltip.ts
frontend/src/views/client-config/ClientConfigPage.vue
frontend/src/views/data-subscribe/DataSubscribePage.vue
frontend/src/views/data-source-run-state/components/DataSourceSnapshotTable.vue
frontend/src/views/topic-offset/components/OffsetTable.vue
frontend/src/views/server-config/ServerConfigPage.vue
frontend/src/views/log-query/components/LogQueryTable.vue
frontend/src/views/monitor/job-failure/history-list.vue
frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs（只读，用于核验 §5 的插件行为）
```

### 4.3 只读核验命令

```bash
grep -rnP '<el-table(?![-_])' frontend/src --include=*.vue | wc -l   # 15
grep -rlP '<el-table(?![-_])' frontend/src --include=*.vue | wc -l   # 14
grep -rn '\blt-' frontend/src --include=*.vue --include=*.css --include=*.ts   # 无命中
git diff --quiet 10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e \
  e8eb68e368313aa501eb5f7158f6e95975b2077b -- frontend               # 退出码 0
```

## 5. 关键工程能力核验（本设计的技术前提）

公共实现形态依赖一项此前**未被仓库先例证明**的能力：**在外部普通 `.css` 文件中
编写 `:deep(...)` 并能被作用域正确编译**。qlpt 的 `query-list-spinner.css` 先例
刻意不含 `:deep(...)`，故不能据此推断。

本轮以**构建插件源码行为**为唯一依据，在
`frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs` 中核实：

1. `load` 钩子对 `query.vue && query.src` 直接返回
   `fs.readFileSync(filename, 'utf-8')`——外部文件内容成为样式模块代码；
2. `transform` 钩子对 `query.type === 'style'` 调用 `transformStyle(code, …)`，
   与内联样式块**同一路径**；
3. `transformStyle` 调用
   `compileStyleAsync({ source: code, scoped: block.scoped, id: 'data-v-<id>' })`——
   `scoped` 标记与内联块**同源**，因此 `:deep(...)` 变换同样适用；
4. `linkSrcToDescriptor` 使用 `pluginContext.resolve(src, descriptor.filename)`——
   Vite 的 `resolve.alias` 对 `<style src>` 同样生效。

**结论**：设计形态可实现。该前提已写入 `SHARED_COMPONENT_DESIGN.md` §2.3，
并附带一条前置条件失效处置规则（实现阶段若与之不符，**停止并报告**，
**不得**改用全局样式绕行）。

同时核实的其他工程事实：

```text
CSS Module / 预处理器                      不存在
样式令牌前缀                               --el-* / --dss-* / 局部单值变量
公共共享 CSS 源                            仅 query-list-spinner.css
路径别名                                   '@' → frontend/src
vitest 环境                                jsdom：不能断言计算样式与几何矩形
测试可断言对象                             类名、SFC 源码文本、外部 CSS 文本、构建产物文本
```

## 6. 四种候选方案对比与唯一设计选择

### 6.1 对比结论

| 候选 | 结论 | 核心理由 |
| --- | --- | --- |
| §8.1 显式 CSS 预设（纯类名） | **部分采纳**（组合的一半） | 能承载全部规则与显式启用，但无令牌时 Feature 覆盖只能整条复制规则、与公共规则**同特异性**竞争，覆盖点无法枚举与断言 |
| §8.2 CSS 变量（纯令牌） | **部分采纳**（组合的另一半） | CSS 自定义属性只能承载“值”，**不能**承载选择器；无法表达 `th/td` 内边距与表头 `.cell` 排版，故**不能**独立成立 |
| §8.3 Vue 轻包装组件 | **拒绝** | ① 必须重新声明 `el-table` 的 slots/events/ref，侵入对外契约；② 与 qlpt 已批准结论（§7.3.4「没有超级组件，也没有薄包装」）冲突，且本模板全部不变量都能由类名+令牌完整表达，组件**不新增任何可断言不变量**；③ 要么新增 DOM 层（破坏表格几何与 `fixed` 基准），要么是纯薄包装 |
| §8.4 组合方式 | **采纳（唯一结论）** | 兼顾显式启用与细粒度、可枚举、可回滚的覆盖；无组件间接；与仓库现有 `<style scoped src>` 形态一致 |

### 6.2 唯一结论

```text
selected_implementation_architecture=
  EXPLICIT_ROOT_CLASS_CSS_PRESET_WITH_LIMITED_CSS_CUSTOM_PROPERTY_TOKENS
selected_implementation_architecture_status=PROPOSED_PENDING_REVIEW
introduces_vue_wrapper_component=NO
adds_extra_dom_layer=NO
```

准确术语：**一个普通 CSS 样式预设源文件 + 一个常量模块**；以**显式根类**承担
选择器纪律，以**有限 CSS 自定义属性**承担受控覆盖。**不是**组件、**不是** Composable、
**不是**指令/插件、**不是** CSS Module。

### 6.3 关键设计要点

1. **公共层不定义令牌值**：`--lt-*` 只出现在 `var(--lt-…, 默认值)` 的内联回退中。
   由此 Feature 覆盖**不存在同属性竞争者**，优先级**与 CSS 加载顺序无关**——
   这正是对基线候选 §8.4「泄漏风险低至中，取决于是否避免全局作用域」的正面消除。
2. **同一属性只能有一个发表者**：4 个规则组（宽度 / EP 令牌 / 表头排版 / 内边距）
   只能由公共层声明；接入时 Feature **必须删除**被等价替代的同义规则，
   否则二者同特异性、仅靠加载顺序决定结果（列为接入验收硬性检查项）。
3. **根类必须声明在 `el-table` 根元素上**（而非祖先容器），否则
   `width` 会落到错误元素。
4. **枚举的覆盖面**：9 个 `--lt-*` 令牌，全部有参考实现事实来源。

## 7. 公共契约摘要

### 7.1 未来文件布局（本任务未创建）

```text
frontend/src/styles/list-table/
├── list-table-visual.css    # 唯一的公共预设样式源
└── index.ts                 # 常量模块：LT_MAIN_TABLE_CLASS、LT_TABLE_VISUAL_TOKENS
```

阶段一文件数上限为 2；不新增仓库中不存在且无必要的层级；
不新增 composables/ 与 types/ 产物。

### 7.2 显式启用方式（设计伪代码，未实现）

```vue
<script setup lang="ts">
import { LT_MAIN_TABLE_CLASS } from '@/styles/list-table'
</script>

<el-table :data="rows" :class="['data-table', LT_MAIN_TABLE_CLASS]" @row-dblclick="onRowDoubleClick">
```

```vue
<style scoped src="@/styles/list-table/list-table-visual.css"></style>
<style scoped>/* Feature 专属规则原样保留 */</style>
```

原有 `class="data-table"` **必须保留**（`dataSource.spec.ts` 第 899–901 行依赖它）。

### 7.3 命名空间

```text
公共根类            lt-main-table（常量 LT_MAIN_TABLE_CLASS）
令牌前缀            --lt-
内部辅助类          阶段一数量 = 0（命名规则保留为 lt-<block>__<element>）
禁止的业务前缀      .data-table / .naming-table / .dss-* / .toff-* / .cc-* /
                    .config-table / .ds-* / .empty-* / .query-* / .q-*
```

### 7.4 公共视觉令牌（9 个，全部来自参考实现事实）

| 令牌 | 默认值 | 来源 |
| --- | --- | --- |
| `--lt-table-width` | `100%` | `DataSourcePage.vue` 1761–1766 |
| `--lt-border-color` | `#f4f4f5` | 同上 |
| `--lt-header-bg-color` | `#ffffff` | 同上 |
| `--lt-header-text-color` | `#71717a` | 同上与 1768–1773 |
| `--lt-header-font-size` | `12px` | 1768–1773 |
| `--lt-header-font-weight` | `600` | 1768–1773 |
| `--lt-header-letter-spacing` | `0.01em` | 1768–1773 |
| `--lt-header-cell-padding` | `11px 0` | 1779–1781 |
| `--lt-body-cell-padding` | `12px 0` | 1775–1777 |

```text
lt_token_count=9
lt_internal_helper_class_count=0
lt_new_invented_visual_value_count=0
```

未在参考实现中显式定义的项按三种处置之一落定（正文、`height/line-height`、
hover 色、长文本省略、Tooltip → **不由公共层定义**；横向内边距 → 并入 padding 令牌的 `0`）。

### 7.5 参考页等价接入清单

`SHARED_COMPONENT_DESIGN.md` §6 给出 10 项逐项清单：移交的 4 个规则组、
留在 Feature 的规则、原类名保留、公共类与业务类并存方式、
不得变化的 DOM/列定义/slots/events/双击/固定列/业务标签、
逐值等价的计算样式清单、表头与几何一致项、证明弹窗第二张表不受影响、
证明其他 13 个使用点不受影响、一键回滚方法。

## 8. 设计决策标记计数

本设计文件**只**使用一个标记：

```text
LIST_TABLE_SHARED_DESIGN_DRAFT
```

定义域为 `SHARED_COMPONENT_DESIGN.md` 单文件。核验命令（拼接构造，避免自计入）：

```bash
design_marker="LIST_TABLE_SHARED_DESIGN_""DRAFT"
grep -ohF "$design_marker" \
  docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md | wc -l
```

实测计数：

```text
LIST_TABLE_SHARED_DESIGN_DRAFT（SHARED_COMPONENT_DESIGN.md） = 71
LIST_TABLE_SHARED_DESIGN_DRAFT（四份规范性文档）              = 0
```

71 个实例全部对应真实的设计决策段落（逐行检查：不存在单行多实例、
不存在无意义堆叠）。

## 9. 状态同步

### 9.1 四份规范性文档状态块

```text
shared_implementation_design_status=DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW
shared_implementation_design_approval_status=NOT_APPROVED
```

文件：`README.md`、`DESIGN.md`、`UI.md`、`MIGRATION.md`。

- `README.md`：另增加详细设计入口（§8 导航表）、状态说明与变更记录（§11）；
- `DESIGN.md`：§8 **只**新增指向详细设计草案的交叉引用，
  明确 §8.1–§8.5 候选描述**保持原样**、不因草案改写为已批准实现方案；
- `UI.md`、`MIGRATION.md`：除状态块外**正文未改**。

### 9.2 项目级文档最小同步

- `docs/baseline/README.md`：状态块增加两行；导航增加详细设计入口；
  「批准基线 ≠ …」段与授权边界段按新阶段最小更新；
- `docs/baseline/PROJECT_STATUS.md`：§10.4 当前阶段与下一入口最小同步，
  并在 §11 变更记录追加一行。

### 9.3 未改变的状态值

```text
list_table_visual_template_document_status=APPROVED          （未改变）
list_table_visual_template_design_status=BASELINE_APPROVED    （未改变）
project_owner_approval_status=APPROVED                        （未改变）
approval_scope=BASELINE_CONTENT_ONLY                          （未改变）
shared_implementation_status=NOT_STARTED                      （未改变）
reference_page_integration_status=NOT_STARTED                 （未改变）
formal_acceptance_execution_status=NOT_RUN                    （未改变）
page_migration_status=NOT_STARTED                             （未改变）
page_migration_authorization_status=NOT_GRANTED               （未改变）
```

qlpt 的任何状态与冻结计数**未改变**。

## 10. 未修改代码、未实现、未接入、未迁移的证据

```text
业务/前端/后端代码改动       无（git diff --quiet -- backend frontend docs/features → 0）
测试代码改动                 无
Feature 文档改动             无
配置/依赖/锁文件改动         无
qlpt 目录改动                无（git diff --quiet -- docs/baseline/query-list-page-template → 0）
新建代码文件（CSS/Vue/TS/路由）无
测试执行                     未运行（文档任务，不适用）
构建执行                     未运行（文档任务，不适用）
服务启动/停止                无
HTTP 调用                    无
数据库读写 / DDL / DML       无
ZooKeeper / Kafka 访问       无
业务源库 / 目标库访问        无
```

已知**任务开始前已存在**、本任务**未触碰**的工作区内容：

```text
.claude/settings.local.json   （保持未暂存、未提交、未修改）
docs/prompts/                 （保持未暂存、未提交、未修改）
```

## 11. 计数复核

```text
LIST_TABLE_REFERENCE_FACT（四份规范性文档）           = 22
LIST_TABLE_TEMPLATE_DRAFT（四份规范性文档）           = 0
LIST_TABLE_TEMPLATE_APPROVED（四份规范性文档）        = 42
LIST_TABLE_PROPOSED_NOT_IMPLEMENTED（四份规范性文档） = 11
LIST_TABLE_SHARED_DESIGN_DRAFT（SHARED_COMPONENT_DESIGN.md） = 71

el_table_usage_count=15
el_table_file_count=14
REFERENCE_PAGE=1 / CANDIDATE_HIGH=4 / CANDIDATE_MEDIUM=3 / CANDIDATE_LOW=0 /
EXCLUDED_NON_MAIN_TABLE=6 / NEEDS_SEPARATE_EVALUATION=1   （1+4+3+0+6+1=15）

query_list_template_frozen_marker_status=UNCHANGED_48_43_9_66
```

## 12. 本任务修改的文件

```text
新增：docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md
新增：docs/baseline/list-table-visual-template/reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001.md
修改：docs/baseline/list-table-visual-template/README.md
修改：docs/baseline/list-table-visual-template/DESIGN.md
修改：docs/baseline/list-table-visual-template/UI.md
修改：docs/baseline/list-table-visual-template/MIGRATION.md
修改：docs/baseline/README.md
修改：docs/baseline/PROJECT_STATUS.md
```

未修改任何白名单外文件（详见 §10）。

## 13. 下一步

```text
next_step=CHATGPT_REMOTE_GIT_SHARED_IMPLEMENTATION_DESIGN_REVIEW_THEN_PROJECT_OWNER_DESIGN_APPROVAL
```

1. 先由 ChatGPT 对提交 `SHARED_COMPONENT_DESIGN.md` 进行**远程 Git 复审**；
2. 再由**项目负责人**决定是否批准该详细设计；
3. **未经批准不得修改任何代码**，也不得进入公共实现、数据源管理参考页接入
   或任何页面迁移；
4. 本详细设计**未预先选择**探针端管理、数据订阅或任何其他页面作为首个迁移对象。

## 14. 任务状态

本报告是**提交前核验快照**：它随本次 Commit 一并入库，因此**不内嵌**包含
`result_commit_id` / `remote_commit_id` / `push_status` 的 `AGENT_TASK_RESULT` 块
（这些字段只有在 Commit 与 Push 实际执行后才能取值，写死在随该 Commit 入库的文件里
必然失真）。权威 `AGENT_TASK_RESULT` 块在本次任务**最终会话报告**中输出。

本任务状态（截至提交前核验）：

```text
task_code=LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001
task_type=DOCS_ONLY_SHARED_IMPLEMENTATION_DETAILED_DESIGN
branch=develop
base_commit_id=e8eb68e368313aa501eb5f7158f6e95975b2077b
shared_implementation_design_status=DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW
shared_implementation_design_approval_status=NOT_APPROVED
selected_implementation_architecture=EXPLICIT_ROOT_CLASS_CSS_PRESET_WITH_LIMITED_CSS_CUSTOM_PROPERTY_TOKENS
selected_implementation_architecture_status=PROPOSED_PENDING_REVIEW
shared_design_draft_marker_count=71
shared_implementation_status=NOT_STARTED
reference_page_integration_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
business_code_change_status=NONE
test_code_change_status=NONE
feature_document_change_status=NONE
configuration_dependency_lockfile_change_status=NONE
test_build_status=NOT_RUN_NOT_REQUIRED_DOCS_ONLY
service_operation_status=NONE
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_access_status=NONE
kafka_access_status=NONE
source_target_database_access_status=NONE
next_step=CHATGPT_REMOTE_GIT_SHARED_IMPLEMENTATION_DESIGN_REVIEW_THEN_PROJECT_OWNER_DESIGN_APPROVAL
```
