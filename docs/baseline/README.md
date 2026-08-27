# 项目级基线（docs/baseline/）

> 文档状态：`DRAFT_PENDING_USER_REVIEW`（六份项目级基线）
> 恢复任务：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001
> 恢复日期：2026-08-27
> 基线提交：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c

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

- 六份项目级基线状态：`DRAFT_PENDING_USER_REVIEW`（本任务恢复，未自行批准）。
- 核验提交：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c（恢复任务执行基线）。
- 批准流程：ChatGPT 复审 → 用户批准 → 开启具体 Feature 会话。
