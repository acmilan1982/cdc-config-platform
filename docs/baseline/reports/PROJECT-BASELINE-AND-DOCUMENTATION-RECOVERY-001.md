# 实施报告：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001

> 报告状态：`DRAFT_PENDING_USER_REVIEW`
> 恢复任务：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001
> 恢复日期：2026-08-27
> 执行基线：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c

## 1. 任务目标和执行基线

本任务为**纯文档任务**：恢复六份项目级基线草案、建立 `docs/baseline/README.md` 与 `docs/features/README.md`、修正根 README 过期状态、建立实施报告、精确 Commit 并普通 Push 到 origin/develop，Push 后停止。

- 仓库：`acmilan1982/cdc-config-platform`（origin），分支 `develop`
- 期望远程基线：`6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c`（同步后确认）
- 执行基线（本地 HEAD == origin/develop）：`6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c`

## 2. 结果提交和 Git 状态

- 提交信息：`docs(baseline): restore project documentation baseline`
- 提交方式：精确文件路径逐个暂存，`git diff --cached --check` 通过；普通 push origin develop，未使用 force push。
- Push 后确认：本地 HEAD == origin/develop，ahead/behind = 0 / 0，任务前用户工作区内容完整保留。

## 3. 项目基线恢复来源

六份项目级基线均为**服务器既有候选**（`docs/baseline/` 未提交文件，2026-08-11/12 起草，原 BASELINE-001/002 与 DATABASE-CODE-MAPPING-001 Phase 2 落版），分类为 **A 现行基线候选**，本次在原文件上做**最小修订**，对齐当前 Git 代码与已批准数据库基线。六份均为"恢复既有候选"，非重新建立。

## 4. 六份文档摘要

| 文件 | 摘要 |
|---|---|
| PROJECT.md | 项目总览：定位、业务范围（11 菜单项）、实现现状（4 较完整 + 6 占位）、核心用户价值、技术边界、项目历史（121 commits）、文档体系、关键约束 |
| ENVIRONMENT.md | 环境配置：服务器基础环境、数据库/ZK 连接（10.19.16.111:2181、/bsoft-cdc）、构建配置、依赖版本、连接性状态、未完成事项（Curator/ZK 兼容性验证） |
| ARCHITECTURE.md | 系统架构：技术架构、模块关系（含 logquery）、数据架构（14 表、15 逻辑关系 R01～R15、维护边界）、ZK 监控模型、Job 故障监控模型、前端路由（14 条）与布局、部署形态、技术债 |
| DEVELOPMENT_RULES.md | 开发规则：规则优先级、Git 铁律、提交规范、数据库/ZK 操作规则、构建验证规则、安全配置规则、数据库映射与逻辑关系规则、**普通任务提示词保留规则（新增 §11）** |
| PROJECT_STATUS.md | 项目状态快照：代码实现状态、测试状态、大屏验证状态、历史验收状态、运行验证状态、未提交现场概况、Git 仓库状态、已知待处理事项、数据库基线状态、项目级基线状态 |
| DOMAIN_GLOSSARY.md | 领域词汇表：基础概念、ZK 节点模型、数据库核心概念、**同步链路术语（新增 sync-client/sync-server/sync-log/正确日志/错误日志/Topic/Offset 等）**、Job 故障监控领域、大屏增量统计领域、统计表体系、数据库—代码映射核心术语、**文档体系术语（新增 Feature/基线/提示词/报告/状态编码）** |

## 5. Feature 覆盖盘点

`docs/features/README.md` 建立 Feature 总索引，覆盖 11 个 Feature（app-shell、data-source-management、client-config、data-subscribe、server-config、zk-node-monitor、data-source-run-state、topic-offset、log-query、job-failure-monitor、large-screen），各记录代码状态、基线覆盖、基线状态、最新有效证据、当前缺口与下一入口。

- **log-query**：REQUIREMENTS/DESIGN/API/UI/ACCEPTANCE + reports 已批准（APPROVED）；缺 README、DATABASE。
- **job-failure-monitor / zk-node-monitor**：README + REQUIREMENTS 已入库，未查到独立批准记录（标 DRAFT）。
- **app-shell / large-screen**：本地候选未入库（标 LOCAL_CANDIDATE 待独立复审）。
- **其余 6 个**（data-source-management、client-config、data-subscribe、server-config、data-source-run-state、topic-offset）：`BASELINE_NOT_ESTABLISHED`。

## 6. 未提交本地候选及原因

| 候选 | 处理 |
|---|---|
| `docs/features/app-shell/`（README + REQUIREMENTS） | 本地 Feature 基线候选，超出默认白名单，按任务 §12 标记"本地候选待独立复审"，**未提交** |
| `docs/features/large-screen/`（README + REQUIREMENTS，AS-IS-R3） | 同上，**未提交** |
| `docs/prompts/` 及历史 Agent 提示词 | 过程材料，默认不入 Git，保持未跟踪原样 |
| 六份项目级基线候选 | 在默认白名单内，本次恢复并提交 |

## 7. 根 README 修订

删除"仓库初始化（尚未创建正式前后端工程）"及"backend/frontend 待创建"的过期目录说明；改为项目简介、工程状态（前后端已存在）、技术栈、构建与启动、文档入口、开发规范，详细状态指向 `docs/baseline/PROJECT_STATUS.md`。

## 8. 普通提示词规则

按用户确认的规则方向，在 `DEVELOPMENT_RULES.md` §11 固化：

- 11.1 默认不入 Git（一次性实现/修复提示词、已覆盖的提示词、临时传递 Markdown、重复复制的提示词）；
- 11.2 允许例外（长期复用流程、跨会话高风险任务、审计要求、正式基线引用的任务说明，需写明理由）；
- 11.3 报告单独判断（报告不能替代正式基线）；
- 11.4 本任务边界（本任务提示词不提交、不新增提示词、不删除已跟踪 agent-prompts、未跟踪提示词原样保留）。

本任务提交中普通任务提示词数量为 0。

## 9. 链接、状态、敏感信息检查

按任务 §16 执行十三项自检：

1. `git diff --cached --check` 通过；新增文件无尾随空白；
2. 全部新增相对链接可解析（baseline README / features README / 根 README 引用路径均存在）；
3. 六份项目级基线全部存在；
4. CLAUDE.md §3 引用的六份基线存在；
5. baseline README 导航完整；
6. Feature 索引引用的 feature 目录与前端视图路径存在；
7. 版本、模块、路由（14 条）、菜单（2 组 11 项）与当前代码一致；
8. 数据库事实（14 表、15 关系、维护方、行数）与已批准数据库基线一致；
9. 当前状态与提交（6dc22ecd，121 commits）、最近记录测试基线一致；
10. 无密码、Token、真实密钥或敏感数据（仅保留 CLAUDE.md §11 授权提交的内网开发库连接信息）；
11. 根 README 不再声称工程未创建；
12. 暂存区无普通任务提示词；
13. 用户既有工作区未被误改或暂存。

## 10. 数据库、ZooKeeper、服务、业务代码零操作

```text
database_read_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_status=NONE
service_start_stop_status=NONE
business_code_change_status=NONE
frontend_code_change_status=NONE
backend_code_change_status=NONE
```

本任务未连接数据库、未访问 ZooKeeper、未执行 DDL/DML、未启停服务、未修改前后端生产代码、配置、锁文件或测试。未执行前后端构建（文档任务，验证矩阵标记 NOT_APPLICABLE）。

## 11. 工作区保护

任务开始前工作区既有内容（9 个已修改跟踪文件、3 个已删除跟踪文件、约 129 个未跟踪文件）已完整记录并在全过程中原样保留：未修改、未覆盖、未暂存、未提交、未清理。仅暂存本任务默认白名单内的文件。未执行 `git reset / checkout -- / clean / stash / pull / merge / rebase / force push`（本任务仅执行授权的一次 `git fetch origin develop` 与一次 `git merge --ff-only origin/develop`）。

## 12. DRAFT_PENDING_USER_REVIEW

六份项目级基线、`docs/baseline/README.md`、`docs/features/README.md` 均标记 `DRAFT_PENDING_USER_REVIEW`。本任务不批准任何基线，不批准任何 Feature，不修改任何 Feature 业务规则，不执行正式验收。

## 13. 下一步

```text
ChatGPT 复审
→ 用户批准项目级基线
→ 开启具体 Feature 会话
```

Push 成功后本任务立即停止，不继续任何业务代码、Feature 批准、数据库/ZooKeeper 操作或历史 prompts 清理。
