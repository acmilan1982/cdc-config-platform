# Feature 总索引（docs/features/）

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 恢复任务：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001
> 恢复日期：2026-08-27
> 基线提交：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c

## 用途

本文件是 **Feature 总索引**，不替代各 Feature 的需求。每个 Feature 在 `docs/features/<feature>/` 下可有 README、REQUIREMENTS、DESIGN、API、UI、DATABASE、ACCEPTANCE 等基线文档。

规则（PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001 §9）：

- 没有正式基线就写 `BASELINE_NOT_ESTABLISHED`；
- pages、modules、普通提示词、Agent 报告不能冒充 Feature 基线；
- 分散资料可列为恢复候选，但须独立复审后方可成为正式基线；
- 本索引不批准任何 Feature；具体 Feature 的缺失文档以后按 FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md 通用流程单独建立。

## 状态口径

- **基线状态**：`APPROVED`（已批准）、`DRAFT`（草案/已入库未批准）、`BASELINE_NOT_ESTABLISHED`（未建立）、`LOCAL_CANDIDATE`（服务器本地候选，未进入 Git，待独立复审）。
- **代码状态**：已实现 / 部分实现 / 占位 / 未开始。
- Feature 状态编码（NOT_RUN / PASS / FAIL / BLOCKED / DEFERRED）见 DOMAIN_GLOSSARY.md。

清单以当前路由（frontend/src/router/index.ts，14 条）、菜单（frontend/src/config/menu.ts，2 组 11 项）、前端页面（frontend/src/views/）、后端包与现有文档为准。

---

## 配置管理

| Feature 标识 | 功能名称 | 代码状态 | 基线覆盖 | 基线状态 | 最新有效证据 | 当前缺口 | 下一入口 |
|---|---|---|---|---|---|---|---|
| data-source-management | 数据源管理 | 部分实现（后端 CRUD 完整，前端占位） | 无 | BASELINE_NOT_ESTABLISHED | backend `datasource` 包（CRUD+启停，7 个 API 端点） | 前端占位未对接；缺全部基线文档；docs/pages/data-source-management.md 为恢复候选 | 新建 |
| client-config | 客户端配置 | 占位 | 无 | BASELINE_NOT_ESTABLISHED | frontend `views/client-config/`（占位页） | 占位页；缺全部基线文档 | 新建 |
| data-subscribe | 数据订阅 | 占位 | 无 | BASELINE_NOT_ESTABLISHED | frontend `views/data-subscribe/`（占位页） | 占位页；缺全部基线文档 | 新建 |
| server-config | 服务端配置 | 占位 | 无 | BASELINE_NOT_ESTABLISHED | frontend `views/server-config/`（占位页） | 占位页；缺全部基线文档 | 新建 |

## 运行监控

| Feature 标识 | 功能名称 | 代码状态 | 基线覆盖 | 基线状态 | 最新有效证据 | 当前缺口 | 下一入口 |
|---|---|---|---|---|---|---|---|
| zk-node-monitor | CDC 节点状态（ZK 客户端监控） | 已实现（用户验收通过） | README、REQUIREMENTS | DRAFT（已入库，未查到独立批准记录） | docs/features/zk-node-monitor/；docs/acceptance/zk-client-monitor-integration.md | 缺 DESIGN/API/UI/ACCEPTANCE/DATABASE；部分资料散落 api/acceptance/zookeeper | 调整/补全 |
| data-source-run-state | 数据源运行状态 | 占位 | 无 | BASELINE_NOT_ESTABLISHED | frontend `views/data-source-run-state/`（占位页） | 占位页；缺全部基线文档 | 新建 |
| topic-offset | Topic 偏移量 | 占位 | 无 | BASELINE_NOT_ESTABLISHED | frontend `views/topic-offset/`（占位页） | 占位页；缺全部基线文档 | 新建 |
| log-query | 日志查询 | 已实现（功能基线已批准，实现与开发验收已完成） | REQUIREMENTS、DESIGN、API、UI、ACCEPTANCE、reports | APPROVED | docs/features/log-query/；实现提交 17680b3 等；开发验收执行 7b3010e（前端 42 例、后端 logquery 专项 135 例通过） | 缺 README、DATABASE；用户视觉验收与最终收口待完成 | 接续（视觉验收→收口）；补 README/DATABASE |
| job-failure-monitor | 故障监控 | 已实现（用户验收通过） | README、REQUIREMENTS | DRAFT（已入库，未查到独立批准记录） | docs/features/job-failure-monitor/；docs/acceptance/job-failure-acceptance.md | 缺 DESIGN/API/UI/ACCEPTANCE/DATABASE；部分资料散落 modules/pages/database（docs/database/job-failure-*.md 为恢复候选） | 调整/补全 |
| large-screen | 数据同步统计大屏 | 已实现（视觉验收通过） | README、REQUIREMENTS（AS-IS-R3） | LOCAL_CANDIDATE（未入库，待独立复审） | docs/features/large-screen/（未提交） | 未进入 Git；缺 DESIGN/API/UI/ACCEPTANCE/DATABASE 正式基线 | 复审（独立任务） |

## 应用外壳

| Feature 标识 | 功能名称 | 代码状态 | 基线覆盖 | 基线状态 | 最新有效证据 | 当前缺口 | 下一入口 |
|---|---|---|---|---|---|---|---|
| app-shell | 全局应用外壳 | 已实现（布局/菜单/路由/公共主题） | README、REQUIREMENTS | LOCAL_CANDIDATE（未入库，待独立复审） | docs/features/app-shell/（未提交） | 未进入 Git；批准证据未核验 | 复审（独立任务） |

## 本地候选说明

`docs/features/app-shell/`、`docs/features/large-screen/` 为服务器上未提交的 Feature 基线候选，按 PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001 §12 处理：列入本索引、标记"本地候选待独立复审"，默认不随本任务批量提交；只有被当前 Git、批准报告和实现充分证明且不引入新规则时，才可作为恢复文件提交。

## 下一步

各 Feature 的缺失文档（README/DATABASE/DESIGN/API/UI/ACCEPTANCE）按 FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md 通用流程单独建立，本索引随后更新。
