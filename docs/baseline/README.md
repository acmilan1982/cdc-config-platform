# 项目级基线（docs/baseline/）

> 文档状态：`APPROVED`（六份项目级基线）
> 批准任务：PROJECT-BASELINE-APPROVAL-CLOSEOUT-001
> 批准日期：2026-08-27
> 批准内容提交：b054718130bbe922f2e26b79b3ee946290949ef1
> 批准依据：ChatGPT 第二轮复审 PASS + 用户明确正式批准
> 恢复任务：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001
> 恢复日期：2026-08-27
> 恢复任务执行基线：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c
> 恢复草案首次入库提交：a6f51f8a8ff984bc946a4e2ccaccbf56692722fe
> 本轮修订任务：PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001（结果提交见本轮实施报告）

## 用途与导航

本目录承载**项目级基线**：当前有效的项目级结论性事实，新会话应优先读取（CLAUDE.md §3.1）。任何开始分析、设计、开发、修复、测试、验收、文档或运维准备的任务前，Agent 必须完整读取六份正式项目级基线。

## 六份项目级基线

| 文件 | 职责 |
|---|---|
| [PROJECT.md](./PROJECT.md) | 项目总览：定位、业务范围、技术边界、关键约束、文档体系 |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | 环境配置：服务器基础环境、数据库/ZK 连接、构建配置、连接性状态 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构：技术架构、模块关系、数据架构（对象清单/访问层/逻辑关系/维护边界）、ZK 监控模型、Job 故障监控模型、前端路由与布局、部署形态 |
| [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) | 开发规则：规则优先级、Git 铁律、提交规范、数据库/ZK 操作规则、构建验证规则、安全配置规则、数据库映射与逻辑关系规则、普通任务提示词保留规则 |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | 项目状态快照：代码实现状态、测试状态、大屏验证状态、历史验收状态、运行验证状态、未提交现场概况、Git 仓库状态、已知待处理事项、数据库基线状态、项目级基线状态 |
| [DOMAIN_GLOSSARY.md](./DOMAIN_GLOSSARY.md) | 领域词汇表：基础概念、ZK 节点模型、数据库核心概念、同步链路术语、Job 故障监控领域、大屏增量统计领域、统计表体系、数据库—代码映射核心术语、文档体系术语 |

## 通用流程入口

- [FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md](./FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md) — Feature 开发与调整标准流程（四种入口与十二阶段）。

## 数据库基线与 Feature 基线入口

- 数据库基线：[docs/database/](../database/README.md) — 已批准（APPROVED，PROJECT-DATABASE-BASELINE-APPROVAL-001）：14 张表、15 条逻辑关系（已确认 12、高度可信 3、待确认 0）、4 项候选物理设计 PENDING_DECISION。
- Feature 基线：[docs/features/](../features/README.md) — Feature 总索引与各 Feature 基线目录。

## 查询列表页模板基线入口

查询列表页模板基线（**项目级已批准**）：[docs/baseline/query-list-page-template/](./query-list-page-template/README.md)。
该模板面向只读查询列表页：模板文档已完成设计并获批准；其阶段一公共组件已实现、通过正式验收，并由项目负责人于 `2026-09-17` 最终接受收口；模板页面迁移实现**尚未开始**。

主要入口：

- 目标、适用范围、参考实现与当前状态：[query-list-page-template/README.md](./query-list-page-template/README.md)
- 公共组件详细设计（已批准；阶段一已实现并接受）：[query-list-page-template/SHARED_COMPONENT_DESIGN.md](./query-list-page-template/SHARED_COMPONENT_DESIGN.md)
- 逐页迁移评估清单、推荐顺序与已接受页保护：[query-list-page-template/MIGRATION.md](./query-list-page-template/MIGRATION.md)
- 其余文档：[DESIGN.md](./query-list-page-template/DESIGN.md)、[UI.md](./query-list-page-template/UI.md)

当前状态（**权威状态块以模板目录 `README.md` §9 最终接受收口段落为准**，本节不另立定义）：

```text
query_list_page_template_document_status=APPROVED
query_list_page_template_implementation_status=NOT_STARTED
shared_component_status=FINAL_ACCEPTED_AND_CLOSED
reference_page=源库快照状态
reference_page_status=IMPLEMENTED_ACCEPTED
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
pilot_page_selection_status=NOT_DECIDED
```

- **参考页**：“源库快照状态”（`/monitor/data-source-state`）是**已接受的参考页等价接入**，
  其查询字段、列定义、状态标签语义、接口与分页策略仍属该 Feature 专属，**不是**可直接复制的业务页面。
- **使用触发条件**：新建查询列表页、对查询列表页做结构性调整、修改公共交互，
  或评估既有页面迁移时，必须先阅读上述三份入口文档，并优先评估复用该模板与公共组件；
  若业务差异确实不适用，必须记录差异与理由，不得静默复制一套平行实现。
- **授权边界**：模板文档批准与公共组件最终接受**不等同于**页面迁移授权，也**不等于**其他页面已迁移。既有页面是否迁移必须**单独评估**，
  并经项目负责人**明确授权**；当前**未授权**其他页面迁移，**未选择**试点页面。
- **计数口径**：原正式验收 17 项、补充正式验收 21 项；补充 21 项**包含**原 17 项在纠正后提交上的
  重新重放，两者是**包含关系而非并列关系**，**不得**把两者相加累计为“独立用例总数”；权威验收覆盖为补充验收 `21/21` PASS。

## 文档权威边界

- 项目级基线（本目录）与 Feature 级基线（docs/features/）承载正式结论；`docs/baseline-work/` 等过程材料不冒充正式基线（CLAUDE.md §3.3）。
- 普通任务提示词与执行报告默认不上传 Git（DEVELOPMENT_RULES.md §11）。

## 新会话必读顺序

1. 本文件（docs/baseline/README.md）定位导航；
2. 六份项目级基线（PROJECT → ENVIRONMENT → ARCHITECTURE → DEVELOPMENT_RULES → PROJECT_STATUS → DOMAIN_GLOSSARY）；
3. 当前任务涉及的 Feature 级基线（docs/features/<feature>/）；
4. 已批准数据库基线（docs/database/）按需读取。

## 修改边界

项目级基线只能通过**独立基线维护任务**修改，并由**用户批准**；普通业务任务不得顺手修改。修改需遵守 CLAUDE.md §7 与 DEVELOPMENT_RULES.md。

## 当前状态与核验提交

- 六份项目级基线状态：`APPROVED`（ChatGPT 第二轮复审 PASS + 用户于 2026-08-27 明确正式批准，批准任务 PROJECT-BASELINE-APPROVAL-CLOSEOUT-001，批准内容提交 `b054718`）。
- 恢复任务执行基线：`6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c`。
- 恢复草案首次入库提交：`a6f51f8a8ff984bc946a4e2ccaccbf56692722fe`（六份草案首次进入 Git）。
- 本轮修订结果提交：见 `docs/baseline/reports/PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001.md` 及 Git 历史。
- 批准收口结果提交：见 `docs/baseline/reports/PROJECT-BASELINE-APPROVAL-CLOSEOUT-001.md` 及 Git 历史。
- 批准流程状态：ChatGPT 第二轮复审通过 → 用户正式批准 → Git 状态已收口。
- Feature 总索引（docs/features/README.md）与具体 Feature 未随项目级基线批准，仍按各自状态处理；Feature 总索引仍为 `DRAFT_PENDING_USER_REVIEW`。
