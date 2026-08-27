# PROJECT — 项目总览（项目级基线）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-BASELINE-APPROVAL-CLOSEOUT-001
> 批准日期：2026-08-27
> 批准内容提交：b054718130bbe922f2e26b79b3ee946290949ef1
> 批准依据：ChatGPT 第二轮复审 PASS + 用户明确正式批准
> 恢复任务：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001
> 恢复日期：2026-08-27
> 恢复任务执行基线：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c
> 恢复草案首次入库提交：a6f51f8a8ff984bc946a4e2ccaccbf56692722fe
> 本轮修订任务：PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001（结果提交见本轮实施报告）
> 来源：服务器既有候选（docs/baseline/ 未提交文件，原 BASELINE-001/002 与 DATABASE-CODE-MAPPING-001 Phase 2 落版）+ 恢复任务修订 + 本轮复审修订，对齐当前代码与已批准数据库基线
> 首次草拟：2026-08-11

基线日期: 2026-08-27（恢复草案，历史草稿 2026-08-11）
基线来源: `BASELINE-001` 盘点 + R1/R2 修订 → `BASELINE-002` → 本任务恢复并修订
维护触发: 模块边界调整、新增业务模块、项目目标变更

---

## 1. 项目定位

**CDC配置管理平台**是一个 **Oracle CDC配置维护和运行监控Web平台**，不替代现有CDC同步程序。

平台提供CDC配置的可视化管理和运行状态的全景监控能力，面向CDC运维和开发人员。

来源: CLAUDE.md §1、docs/product/business-rules.md、代码审查

---

## 2. 业务范围

### 2.1 功能模块

两大功能模块（产品/项目目标范围共 11 个菜单项，含大屏）：

**配置管理（4项）**：
- 数据源管理 — 源库/目标库连接配置的CRUD与启停
- 客户端配置 — CDC同步客户端实例管理
- 数据订阅 — 源表到目标表的同步订阅关系管理
- 服务端配置 — CDC服务端参数配置

**运行监控（7项，含大屏）**：
- CDC节点状态 — ZK客户端/Job实时在线监控
- 数据源运行状态 — 数据源级别的运行状态查看
- Topic偏移量 — Kafka Topic消费偏移量监控
- 日志查询 — CDC同步日志检索（已实现）
- 故障监控 — Job故障事件全生命周期追踪（含故障过程详情）
- 故障历史 — 故障事件历史检索（按时间范围/客户端/数据源）
- 数据同步统计大屏 — 增量统计数据的ECharts可视化大屏

**菜单 Git 事实与本地候选**（三分法，GitHub 新会话可复核口径）：

1. **产品/项目目标范围**：大屏属于平台功能范围，产品目标菜单为 2 组 11 项；
2. **Git 已提交实现事实**：大屏 standalone 路由 `/large-screen` 已提交；Git 已提交菜单为 **2 组 10 项**（配置管理 4 + 运行监控 6，不含大屏入口）；
3. **服务器本地候选**：工作区未提交的 `menu.ts` 修改已增加大屏入口（共 11 项），仅能标为本地候选，不作为 Git 可复核事实。

来源: menu.ts（Git 已提交 10 项 / 工作区本地候选 11 项）、router/index.ts、docs/product/modules.md

### 2.2 实现现状

当前前端实现形态为4个较完整业务功能页面和6个占位页面。各功能的最终完成状态、本期范围和后续优先级分别记录，不以页面数量直接计算项目完成率。

4个较完整业务功能页面：
- CDC节点状态 (ZK客户端监控) — 用户验收通过
- 故障监控（含故障过程详情、故障历史）— 主要页面与已列调整用户验收通过；统一内部→对外状态映射层（对外 5 种状态）仍存在开放 GAP（GAP-STATUS-001/002/003，见 docs/features/job-failure-monitor/）
- 日志查询 — 功能基线已批准，实现与开发验收已完成
- 数据同步统计大屏 — 视觉验收通过（standalone 路由已提交；菜单入口为工作区本地候选）

6个占位页面（全部使用PlaceholderPage）：
- 数据源管理 — 后端CRUD已完成，前端未对接
- 客户端配置、数据订阅、服务端配置、数据源运行状态、Topic偏移量 — 占位页

6个占位页面的本期正式范围及优先级待用户确认。

来源: router/index.ts、menu.ts、frontend/src/views/、已批准数据库基线（docs/database/）、log-query Feature 基线（docs/features/log-query/）

---

## 3. 核心用户价值

- **配置可视化**：通过Web界面管理Oracle CDC配置，替代直接操作数据库或ZK节点
- **全景监控**：一站查看CDC客户端在线状态、Job运行状况、SCN进度
- **故障溯源**：完整的故障事件→处理记录→恢复链路追踪，含CLOB详情懒加载
- **数据统计**：基于CDC日志的增量统计，累计/每日/维度多级聚合，大屏可视化

---

## 4. 技术边界

### 4.1 平台定位

- 本平台**管理CDC配置**和**监控CDC运行状态**，不执行CDC同步逻辑
- CDC同步由独立的CDC程序执行（不在本仓库范围内）
- ZooKeeper操作严格限定于**只读**监控（CLAUDE.md §14.5）

### 4.2 外部系统依赖

| 系统 | 用途 | 版本/地址 |
|---|---|---|
| Oracle数据库 | CDC配置存储、日志存储、统计结果存储 | 19c @ 192.168.174.65:1521 |
| ZooKeeper | CDC客户端/Job在线状态和SCN信息 | 目标3.4.14 @ 10.19.16.111:2181 (开发环境) |

### 4.3 非目标 (Non-Goals)

以下不在此项目范围内：
- CDC同步程序的开发或维护 — 独立系统
- ZooKeeper集群的管理 — 仅只读监控
- 用户认证/权限管理 — 当前无认证，长期方案待决策
- 多租户支持 — 当前仅单Schema (CDC)
- CI/CD流水线 — 当前开发环境未配置
- 容器化部署 — 当前为JAR包直接部署

---

## 5. 项目历史

| 项目 | 值 |
|---|---|
| 项目启动 | 约2026-07-03（基于最早commit） |
| 开发模式 | Agent (Claude Code) + 人工 (Windows IDEA) 串行 |
| 分支策略 | 仅 develop 单分支，线性历史，单作者 (acmilan1982)。提交总数属动态口径，以 Git 实际为准，不在本文固定（截至恢复快照提交 a6f51f8 时点可由 Git 统计） |
| 任务编号体系 | 按功能模块编号（TASK/Feature/Database 等），Conventional Commits |

来源: Git历史

---

## 6. 文档体系

### 6.1 基线文档 (docs/baseline/)

六份项目级基线文档，新会话应优先读取：
- `PROJECT.md` (本文件) — 项目总览
- `ENVIRONMENT.md` — 环境配置
- `ARCHITECTURE.md` — 系统架构
- `DEVELOPMENT_RULES.md` — 开发规则
- `PROJECT_STATUS.md` — 项目状态快照
- `DOMAIN_GLOSSARY.md` — 领域词汇表

### 6.2 其他关键文档

- `CLAUDE.md` (根目录) — Agent开发规范，为DEVELOPMENT_RULES.md的主要来源
- `docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md` — Feature 开发与调整标准流程（四种入口与十二阶段）
- `docs/database/` — 项目级数据库物理基线（已批准 APPROVED，14 张表、15 条逻辑关系）
- `docs/features/` — Feature 级基线（含 Feature 总索引）
- `docs/product/` — 产品功能文档
- `docs/pages/` — 各页面设计文档
- `docs/acceptance/` — 历史验收报告
- `docs/agent-prompts/` — 历史任务提示词和执行报告
- `docs/baseline-work/` — 基线盘点与修订过程材料（BASELINE-001/002、DATABASE-CODE-MAPPING-001 等）

---

## 7. 关键约束

- **Git**：仅develop分支开发，禁止force push/rebase/merge
- **ZK**：严格只读，监控范围限于 `/bsoft-cdc/clients`
- **数据库**：写操作需人工审批（展示完整SQL、目标、影响、风险、回滚方式）
- **环境**：禁止在业务任务中安装或修改基础环境
- **提交**：Conventional Commits格式，一个任务对应一个Commit

详见 DEVELOPMENT_RULES.md。

来源: CLAUDE.md
