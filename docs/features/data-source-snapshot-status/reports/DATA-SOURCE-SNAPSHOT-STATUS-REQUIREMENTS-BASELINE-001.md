# 需求与验收草案建立执行报告 DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001` |
| 任务类型 | `FEATURE_REQUIREMENTS_AND_ACCEPTANCE_DRAFT`（纯文档任务） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 任务状态 | `COMPLETED`（草案已建立并入库，未批准、未实现、未执行验收） |
| 任务开始前 Commit ID（base） | `72b305a8e4134d10f514920c215b9647fb7d9e3b` |
| 执行分支 | `develop` |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交见任务提交记录） |

## 2. 任务范围与目标

为运行监控模块下“源库快照状态”（既有路由 `/monitor/data-source-state`，前端占位目录 `frontend/src/views/data-source-run-state/`）建立**第一版需求草案与验收标准草案**。任务只产生文档，不涉及设计、不实现代码、不执行验收、不访问数据库、不操作 ZooKeeper、不启动服务、不改动代码。

允许修改范围（白名单，5 个文件）：

1. `docs/features/data-source-snapshot-status/README.md`（新建）
2. `docs/features/data-source-snapshot-status/REQUIREMENTS.md`（新建）
3. `docs/features/data-source-snapshot-status/ACCEPTANCE.md`（新建）
4. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001.md`（本报告，新建）
5. `docs/features/README.md`（Feature 总索引最小更新：运行监控下 `data-source-run-state`/“数据源运行状态”占位行对齐为 `data-source-snapshot-status`/“源库快照状态”，并追加本次变更记录行；不修改其他 Feature）

## 3. 环境与前置检查

| 检查项 | 结果 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform`（Git 仓库） |
| 当前分支 | `develop` |
| 任务开始前 Commit ID | `72b305a8e4134d10f514920c215b9647fb7d9e3b` |
| 本地与 `origin/develop` 关系 | 开始前一致（本地 HEAD == origin/develop），无分叉 |
| 白名单目标文件现场 | 三份 Feature 文档均不存在（新建）；`docs/features/README.md` 相对 HEAD 无既有修改，可安全编辑 |
| 与本任务无关的既有工作区修改 | 保持原样，不修改、不覆盖、不暂存、不提交（含 `frontend/src/config/menu.ts`、`frontend/src/router/`、各 Layout、`HeaderBar.vue` 等既有未提交内容） |
| 环境预检 | 纯文档任务；不要求后端/前端/数据库/ZooKeeper 环境启动（验证矩阵 `NOT_APPLICABLE`） |

## 4. 依据与输入

- 任务提示词：`docs/prompts/data-source-snapshot-status/DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001.md`。
- 已提交数据库只读复核报告（本 Feature 数据库事实权威依据）：`docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`（提交 `72b305a...`）。本任务**不重新查询数据库**。
- Feature 生命周期：`FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`（需求/验收草案 → ChatGPT 正式复审 → 项目负责人审阅/批准 → 设计 → 实现 → 验收）。
- 参考结构与风格：`docs/features/topic-offset/`（同属运行监控只读自动刷新页面，断点结构模板）、`docs/features/client-config/`、`docs/features/data-source-management/`。
- 前端 AS-IS 事实：路由 `/monitor/data-source-state`（`frontend/src/router/index.ts`）、菜单“数据源运行状态”（`frontend/src/config/menu.ts`）、占位页 `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（标题“数据源运行状态”）。以上为既有未提交工作区内容所在，本任务不修改这些文件。

## 5. 产出文档与数量核验

### 5.1 新建 Feature 文档

| 文档 | 内容要点 | 状态 |
|---|---|---|
| `README.md` | Feature 身份、定位、业务背景、数据表与读写边界、文档导航与状态、页面/路由现状命名映射（AS-IS）、数据规模假设、开放事项与草案建议、阶段声明、下一流程入口 | 已建立 |
| `REQUIREMENTS.md` | 需求草案：`DSS-REQ-001~065` 共 **65 条**（编号连续唯一）；草案建议 `DSS-PROP-001~008` 共 **8 项**（统一 `DRAFT_PROPOSAL_PENDING_USER_REVIEW` 标记）；明确非目标；测试数据 DML 授权边界（`DSS-REQ-065`） | 草案（`DRAFT_PENDING_USER_REVIEW`） |
| `ACCEPTANCE.md` | 验收标准草案：`DSS-AC-001~067` 共 **67 条**，全部 `NOT_RUN`；含状态模型、领域分类、逐用例表（关联需求/前置条件/操作·输入/预期结果）与 §5 需求—验收追踪矩阵 | 草案（`DRAFT_PENDING_USER_REVIEW`） |

### 5.2 需求—验收覆盖核验

- 需求条数：`DSS-REQ-001~065`，连续唯一（65/65）。
- 验收条数：`DSS-AC-001~067`，连续唯一（67/67），全部 `NOT_RUN`。
- 正向覆盖：每条 `DSS-REQ-001~065` 均被至少一条 `DSS-AC` 覆盖（§5 追踪矩阵覆盖 65/65，脚本核验无遗漏）。
- 反向引用：每条 `DSS-AC` 的“关联需求”列引用的均为已存在需求编号（`DSS-REQ-001~065` 范围内），无悬空引用（脚本核验通过）。
- 草案建议：`DSS-PROP-001~008` 共 8 项，全部标记 `DRAFT_PROPOSAL_PENDING_USER_REVIEW`，集中于 REQUIREMENTS §22，待用户复审（`pending_user_confirmation_count=8`）。

### 5.3 Feature 状态声明

- `requirements_status` = `DRAFT_PENDING_USER_REVIEW`
- `acceptance_status` = `DRAFT_PENDING_USER_REVIEW`
- `implementation_status` = `NOT_STARTED`
- `acceptance_execution_status` = `NOT_RUN`
- `design_status` = `NOT_STARTED`（DESIGN/API/UI/DATABASE 未建立）
- `pending_user_review` = `YES`

以上状态未被写成 `APPROVED`、`IMPLEMENTED`、`PASS`、`ACCEPTED` 或验收通过；全部验收用例保持 `NOT_RUN`。

## 6. 涉及业务事实与草案建议摘要

- 本页面为**绝对只读**监控页，仅读取 `CDC_DATA_SOURCE_RUN_STATE`（可选 LEFT JOIN `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 补充展示），不推断 sync-client 在线/健康/失联、不推断增量或同步进度。
- 每行表达“探针端（`CLIENT_ID`）＋源库（`DATA_SOURCE_ID`）”组合的初始快照状态：`SNAPSHOT_RUNNING`→快照进行中、`SNAPSHOT_COMPLETED`→快照已完成；未知状态宽容展示，具体 UI 待设计。
- 七列展示（探针端、源库、快照状态、快照启动时间、快照完成时间、记录更新时间等）；默认排序 RUNNING→未知→COMPLETED、组内 `UPDATED_AT` 倒序、`CLIENT_ID`/`DATA_SOURCE_ID` 定序；规模预期约 ≤100 条不分页。
- 60 秒自动刷新 + 手工刷新，不可见暂停；加载/空/失败/恢复交互继承运行监控只读页平台规范。
- 三个查询条件（探针端、源库、快照状态）的单选/多选/“全部”形态、加载态、刷新失败保留旧结果、时间格式、状态标签颜色、轻量异常提示形式等实现与交互细节列为 `DRAFT_PROPOSAL_PENDING_USER_REVIEW` 草案建议，等待项目负责人指定。
- 测试数据 DML 未来授权边界（仅开发库、仅 `CDC_DATA_SOURCE_RUN_STATE`、备份/恢复、禁 DDL/其他表/生产）已精确记录（`DSS-REQ-065` 与相关验收用例）；本草案任务不访问数据库。

## 7. 验证执行情况

| 验证项 | 结果 |
|---|---|
| Feature 文档目录与 reports 子目录 | 已建立 |
| `DSS-REQ`/`DSS-AC`/`DSS-PROP` 编号连续性与唯一性 | 通过（65/67/8，无重复无跳号） |
| 验收状态统一 `NOT_RUN` | 通过（脚本核验 67/67） |
| 反向引用存在性（AC→REQ） | 通过（引用均在 `DSS-REQ-001~065`） |
| 正向覆盖完整性（REQ→AC） | 通过（65/65 全覆盖） |
| 越权状态词（APPROVED/IMPLEMENTED/PASS/ACCEPTED）检查 | 通过（仅以否定/图例/已批准历史基线引用出现，未误用为当前状态） |
| 跨文档计数一致性（README/REQUIREMENTS/ACCEPTANCE） | 通过（65 / 67 / 8 一致） |
| `docs/features/README.md` 最小更新 | 仅对齐目标行 + 追加变更记录行；未触碰其他 Feature 行 |
| 白名单范围 | 仅 5 个白名单文件变更 |
| 与本任务无关的既有修改 | 未触碰 |

## 8. 未执行事项与遗留

- 未进入设计阶段；未创建 `DESIGN.md` / `API.md` / `UI.md` / `DATABASE.md`。
- 未实现或修改任何前后端代码；页面仍为占位页。
- 未执行任何验收（全部 `DSS-AC-*` 保持 `NOT_RUN`）。
- 未访问数据库、未执行 DML/DDL、未操作 ZooKeeper、未启动服务。
- 工作区既有与本任务无关的未提交修改保持原样，未纳入本次提交。

## 9. 结果汇总

| 输出字段 | 值 |
|---|---|
| 任务状态 | `COMPLETED`（草案建立；未批准、未实现、未执行验收） |
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001` |
| 分支 | `develop` |
| base_commit_id | `72b305a8e4134d10f514920c215b9647fb7d9e3b` |
| 后端构建 | `NOT_APPLICABLE`（纯文档） |
| 前端构建 | `NOT_APPLICABLE`（纯文档） |
| 数据库访问/写操作 | `NOT_REQUESTED` |
| ZooKeeper 操作 | `NOT_REQUESTED` |
| requirements_count | 65 |
| acceptance_count | 67 |
| acceptance_not_run_count | 67 |
| traceability_status | `COMPLETE` |
| pending_user_confirmation_count | 8 |
| 变更文件 | 见 §5.1 与 §5.2（白名单 5 个文件） |

下一入口：**ChatGPT 对 `REQUIREMENTS.md` 与 `ACCEPTANCE.md` 草案进行正式复审**，随后由项目负责人审阅/批准需求与验收草案；批准后再进入设计阶段。
