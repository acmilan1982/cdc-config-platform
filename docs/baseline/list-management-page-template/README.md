# 公共列表管理页模板 · 第一步盘点与范围草案

```text
list_management_page_template_document_status=DRAFT_PENDING_OWNER_CONFIRMATION
list_management_page_template_baseline_status=NOT_APPROVED
task_scope=PHASE_1_INVENTORY_AND_SCOPE_DRAFT_ONLY
task_code=PUBLIC-LIST-MANAGEMENT-TEMPLATE-INVENTORY-AND-SCOPE-DRAFT-001
inventory_source_commit=6560c73fb71aa5b8441de4a57fe777d7810b12da
branch=develop
product_code_change_status=NONE
page_migration_status=NOT_STARTED_BY_THIS_TASK
owner_scope_approval_status=PENDING
next_entry=CHATGPT_REVIEW_INVENTORY_AND_SCOPE_THEN_OWNER_CONFIRMATION
```

> 本目录只承载**第一阶段：盘点与范围草案**。文档状态为
> `DRAFT_PENDING_OWNER_CONFIRMATION`，**不是**已批准基线，**不是**实施设计，
> **不构成**任何页面迁移或产品代码变更授权。
>
> 本任务**未修改**任何产品代码、CSS、Vue 组件、测试、依赖、配置、业务基线定义或既有验收状态；
> **未迁移**任何页面；**未运行**测试、构建、浏览器、业务接口或数据库操作；
> **未启停**任何服务；**未访问** ZooKeeper / Kafka / 业务源库或目标库。
> 文中凡不能由静态源码或既有基线直接证明的运行效果，均列入后续验证项，**不写成已通过**。

## 1. 目标与非目标

### 1.1 目标

为**带新增／编辑流程的配置管理主列表页**建立一份**组合式**公共模板：

1. 统一**页面骨架、搜索栏、结果工具栏、无分页主表格、行操作入口、新增／编辑主弹窗**的外观；
2. 明确这些元素的**交互契约**：查询与重置语义、行操作事件隔离、重复提交与失败反馈、
   保存后的列表刷新、稳定 ID 重选、关闭顺序等；
3. 让公共层只承担**跨页可复现、无业务语义**的部分，业务判断继续留在 Feature 页面；
4. 用最小改动复用既有三套公共能力，**不另建一套平行视觉系统**。

### 1.2 非目标

- 不建设**万能 CRUD 组件**、低代码引擎、表单元数据驱动或权限框架；
- 不把 API 地址、业务字段、错误码（如 `40941`）、`FG_ACTIVE` 数值、ID 唯一性、
  描述字节限制、自动描述算法、启停运行含义、数据库事务或业务权限放入公共层；
- 不为假设需求建设**虚拟滚动**、分页器或自动刷新；
- 不在本阶段统一各页面的**业务专属流程**（数据源连接测试、业务属性、命名策略等）；
- 不修改、不重解释、不扩展现有三套模板的已批准规则；如确需修改，另立基线维护任务。

## 2. 现状结论摘要

以下结论的逐项证据、行号与分类见 [INVENTORY-AND-SCOPE.md](./INVENTORY-AND-SCOPE.md)。

**已经存在且可直接复用：**

- 查询列表页公共组件：`QueryListPageShell`、`QueryListQueryPanel`、`QueryListActions`、
  `QueryListResultPanel`；可选 `QueryListRefreshToolbar`、`QueryListTooltipHost`。
  共享组件已正式验收，参考页“源库快照状态”与本项目两个管理页均已**页面级**接入。
- 列表表格公共视觉：`lt-main-table` 根类 + 9 个 `--lt-*` 令牌；可选行内三点入口
  （`lt-row-action__cell` / `lt-row-action__ellipsis`）与可选单行固定高亮
  （`lt-row-highlight` / `lt-row-highlight__row`）。
- 新增／编辑弹窗公共视觉：`ced-dialog` 根类 + 7 个辅助类 + 17 个 `--ced-*` 令牌，
  纯 CSS、显式 opt-in，不承载校验／请求／关闭时序。

**仍然缺失或各页重复：**

- 没有一份“管理页如何组合上述三套能力”的**唯一契约**；
- 查询字段组排版（标签 + 控件）、结果摘要文字、结果工具栏“新增”主按钮在两页各写一份，
  数值相同但无公共来源；
- 行操作入口的**触发器与菜单项忙碌状态、事件隔离、危险项呈现**只有页面级实现，
  公共表格层只提供三点**外观**；
- 数据源管理主弹窗仍使用页面私有标签与主提交按钮规则，未接入 `ced-dialog`；
- 两页的错误处理与刷新语义**有意不同**（失败保留旧行 vs 清空旧行），不能直接抽成同一行为；
- 页面私有 Tooltip、`+N` 打包、行选中、双击编辑等均属 Feature，公共层尚无对应组件。

## 3. 来源与核验锚点

### 3.1 固定提交

| 项 | 值 |
|---|---|
| 分支 | `develop` |
| 调查固定 SHA | `6560c73fb71aa5b8441de4a57fe777d7810b12da` |
| 父提交 | `8ff227deea08a598f98ff4b81e3236dd8e836191` |
| 开始时本地 HEAD / `origin/develop` / 远端 | 三者均为上述固定 SHA |
| 本地未提交内容 | `.claude/settings.local.json`（修改）、`docs/prompts/`（未跟踪）、`runtime-logs/`（未跟踪）；均**与本任务无关**，未纳入本次提交 |

固定提交用于**只读调查取证**，不要求回退。下文“已核实源码”均指该 SHA 下的内容；
若未来源码变化，需重新核对。

### 3.2 已阅读的现行基线

- 六份项目级基线：`docs/baseline/PROJECT.md`、`ENVIRONMENT.md`、`ARCHITECTURE.md`、
  `DEVELOPMENT_RULES.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md`；
- `docs/baseline/query-list-page-template/` 的 `README.md`、`SHARED_COMPONENT_DESIGN.md`、
  `MIGRATION.md`、`DESIGN.md`、`UI.md`；
- `docs/baseline/list-table-visual-template/` 的 `README.md`、
  `SHARED_COMPONENT_DESIGN.md`（重点 §12、§13）、`MIGRATION.md`、`DESIGN.md`、`UI.md`；
- `docs/baseline/create-edit-dialog-visual-template/` 的 `README.md`、`MIGRATION.md`、
  `SHARED_COMPONENT_DESIGN.md`、`DESIGN.md`、`UI.md`；
- Feature 现行基线：`docs/features/client-config/`、`docs/features/data-source-management/`；
- 锁文件与依赖声明：`frontend/package.json`、`frontend/package-lock.json`。

### 3.3 已核实的版本

`package.json` 声明 Vue `^3.4.0`、Element Plus `^2.5.0`；锁文件实际安装
Vue `3.5.39`、Element Plus `2.14.2`、Vite `5.4.21`、Vitest `1.6.1`。
本盘点以**锁文件实际版本**为准，不把声明范围当作已安装版本。

## 4. 状态分层（阅读必读）

| 状态 | 含义 |
|---|---|
| **已实现** | 当前源码或 CSS 中可核验地存在 |
| **代码复审通过** | 仅表示某次远程代码复审对指定提交给出 `APPROVED` |
| **负责人接受／反馈** | 仅覆盖指定页面、指定时点的人工操作反馈，**不等同**正式验收 |
| **模板正式验收** | 仅对明确列出的模板与范围成立 |

关键边界：

- 探针端管理已完成的**157 PASS / 0 FAIL / 0 BLOCKED / 0 NOT_RUN** 正式验收，
  **只**覆盖该 Feature 的实现与页面，**不自动**传播为任何模板的正式验收；
- 查询列表页模板共享组件、列表表格视觉模板公共实现、新增／编辑弹窗公共 CSS
  各有自己的状态与验收范围，**不得互相替代**；
- 同一个页面上“已接入查询列表组件”“已接入表格视觉”“已接入弹窗视觉”是**三个独立事实**；
- 任何“候选页”“推荐页”都**不等于**已授权迁移。

## 5. 最小模板职责结构（本次建议）

本模板定位为**组合契约层**，不新增第四套视觉命名空间去重写已批准规则：

```text
QueryListPageShell + QueryListQueryPanel + QueryListActions       （页面与查询层，直接复用）
        └─ 查询字段组排版 / 结果摘要 / 新增按钮                   （本次建议的最小新公共视觉）
QueryListResultPanel
        └─ lt-main-table                                            （表格基础，直接复用）
             ├─ lt-row-action__*（可选三点外观，直接复用）
             └─ lt-row-highlight__*（可选单行高亮，直接复用）
                行操作菜单、状态、请求、刷新                          （Feature 页面职责）
新增／编辑主弹窗
        └─ ced-dialog + ced-* 辅助类 + --ced-* 令牌                （直接复用，不建 Vue 包装）
            校验、请求、关闭时序、业务字段                            （Feature 页面职责）
```

**唯一维护位置原则：**

- 页面骨架、查询按钮、结果卡片的结构与基础视觉，唯一来源是 `query-list-page-template`；
- 表头、正文、三点入口、单行高亮的视觉，唯一来源是 `list-table-visual-template`；
- 弹窗标签、主提交按钮、字段反馈的视觉，唯一来源是 `create-edit-dialog-visual-template`；
- 本模板只维护“管理页特有的少量重复件”（查询字段组、结果摘要、新增按钮）及其**组合用法**；
- 同一规则不得在两个模板或页面中并存副本；迁移时应删除页面私有同义规则。

具体候选与理由见 [INVENTORY-AND-SCOPE.md](./INVENTORY-AND-SCOPE.md) §3。

## 6. 与既有模板的关系

| 模板 | 层 | 本模板的关系 |
|---|---|---|
| `query-list-page-template` | 页面层／查询层 | **直接复用**其组件与契约；本模板不重写、不改其规则 |
| `list-table-visual-template` | 表格视觉层 | **直接复用**根类、令牌与可选扩展；不新增表格令牌 |
| `create-edit-dialog-visual-template` | 弹窗视觉层 | **直接复用** CSS 与 opt-in；**暂不**创建 Vue 包装组件 |

三者**正交、可组合**。本模板不改变任何既有模板的批准状态、迁移状态或验收结论；
若组合过程中发现既有规则不足，应在**独立基线维护任务**中提出，不得借本任务静默修改。

## 7. 三阶段计划

### 第一阶段（本任务，已完成草案）

- 只读盘点、能力矩阵、第二页候选比较、范围草案；
- 状态 `DRAFT_PENDING_OWNER_CONFIRMATION`；
- 不写产品代码、不迁移页面、不运行验证。

### 第二阶段（待负责人确认后另立任务）

目标：提取**最小可用模板**。

建议范围（**均为待批准建议，不是现行规则**）：

1. 新增少量**显式 opt-in 纯 CSS**：查询字段组排版、结果摘要文字、结果工具栏新增主按钮；
2. 不新增 Vue 组件（继续复用四个查询组件 + 三套 CSS）；
3. 在**探针端管理**作为首个参考页消除对应私有重复规则，业务行为不变；
4. 静态契约测试、零泄漏断言、构建与真实浏览器等价核对；
5. 独立远程代码复审与负责人页面接受。

### 第三阶段（待负责人确认第二页后另立任务）

目标：在**第二个真实管理页**验证复用。

- 推荐候选：数据源管理（理由与边界见盘点文档 §6）；
- 仅覆盖其**主列表**与**新增／编辑主弹窗**；
- 业务属性、命名策略、连接测试等**业务专属流程不进模板**；
- 每页独立授权、独立实现、独立复审与验收。

## 8. 本任务明确未做

- 未创建任何 CSS、Vue 组件、composable、TypeScript 类型或测试；
- 未修改 `frontend/**`、`backend/**`、依赖、锁文件、配置或业务基线；
- 未迁移任何页面，未更新任何页面的迁移状态；
- 未运行 `npm test`、`npm run build`、浏览器、业务接口或数据库操作；
- 未启停服务，未访问 ZooKeeper / Kafka。

## 9. 文档导航

| 文件 | 职责 |
|---|---|
| `README.md`（本文件） | 任务边界、现状摘要、组合结构、三阶段计划、状态分层 |
| [INVENTORY-AND-SCOPE.md](./INVENTORY-AND-SCOPE.md) | 11 项能力矩阵、职责边界、探针预计改动、第二页比较、验证标准、待决事项、源码索引 |

## 10. 待负责人确认（一次确认即可进入第二阶段）

完整问题与推荐见 [INVENTORY-AND-SCOPE.md](./INVENTORY-AND-SCOPE.md) §8。摘要：

1. 是否批准第二阶段只提取“查询字段组排版、结果摘要、新增按钮”三项纯 CSS，不建组件；
2. 是否确认第二阶段仍以 `/config/client` 为参考页且不改变业务行为；
3. 是否确认第三阶段第二页优先数据源管理，范围仅限主列表与新增／编辑主弹窗；
4. 是否同意本轮**不**提取请求 composable、确认框、状态标签、行操作菜单组件，
   仅以契约与使用示例约束。

## 11. 边界声明

- 本文档是**草案**；所有“建议提取”“建议形态”“推荐第二页”均**未被批准**，
  不得被引用为现行项目规则；
- 未批准前不得据此创建公共代码、修改页面或更新任何迁移状态；
- 静态盘点不能证明真实键盘行为、焦点顺序、几何布局、后端结果或写路径；
  这些必须在后续阶段以真实浏览器／真实后端分别验证，且不得把未运行项写成 `PASS`。
