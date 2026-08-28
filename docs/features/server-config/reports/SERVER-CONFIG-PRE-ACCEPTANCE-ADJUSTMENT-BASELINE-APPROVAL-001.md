# 中心端配置 验收前调整基线批准报告

报告状态：`APPROVED`（本次批准仅收口验收前两项调整基线；**不代表两项代码调整已经实现，也不代表 66 条正式验收已经执行**）

## 1. 任务元数据

- `task_id`: `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001`
- Feature：`server-config`（中心端配置）
- 目标分支：`develop`
- 授权基线：`b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee`
- 任务性质：纯文档批准收口
- 执行时间：2026-08-28
- 建议提交信息：`docs(server-config): approve pre-acceptance adjustment baseline`

## 2. 批准链路

| 环节 | 结论 |
|---|---|
| 候选调整初始提交 | `2a8255a231a20a4fc9414c25494c25f54d716ae5`（候选基线建立） |
| R1 实现事实修正 | `789087dda2382ed72b913ecc500b1dbe8c3186fa` |
| R2 口径微修正 | `b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee` |
| ChatGPT 远程复审 R2 | 范围、两处口径、两项候选规则、66 条验收和状态均通过，无需 R3 |
| 项目负责人批准 | 已在 ChatGPT 会话明确回复“同意”，正式批准本次验收前调整基线 |
| 当前业务待确认项 | `PENDING_USER_CONFIRMATION=0` |

## 3. 两项获批调整

1. `CONFIG_DESC` 真实 LF/CRLF 在页面按换行位置安全显示；普通长文本仍自动折行；不解析 `<br>`、字面量 `\n` 或 HTML，禁止 `v-html`；
2. 配置列表查询与展示顺序改为 `ORDER BY ID_SERVER_CONFIG ASC`，前端不二次排序。

两项调整内容与候选基线一致，批准未改变任何业务规则、编号、接口、字段、错误码、SQL 目标、UI 目标或数据库边界。

## 4. 六份文档状态迁移前后

| 文档 | 迁移前 | 迁移后 |
|---|---|---|
| `docs/features/server-config/REQUIREMENTS.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |
| `docs/features/server-config/ACCEPTANCE.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |
| `docs/features/server-config/DESIGN.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |
| `docs/features/server-config/API.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |
| `docs/features/server-config/UI.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |
| `docs/features/server-config/DATABASE.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |

每份文档均：

- 保留原需求/设计首次批准历史、候选调整初始提交 `2a8255a`、R1 `789087d`、R2 `b1c5349` 全部历史记录，未覆盖或删除；
- 增加本次调整批准元数据：候选调整批准任务 `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001`、批准日期 2026-08-28、批准人=项目负责人、ChatGPT 最终复审通过提交 `b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee`；
- 将“候选调整、待用户复审”当前警示迁移为“调整已批准、待实现”；历史变更记录中的旧状态原样保留并明确为历史；
- 追加批准收口变更记录。

## 5. 实现状态与正式验收

- 旧批准版本：`IMPLEMENTED_REVIEWED`（已实现并经过 R1/R2 复审）；
- 本次两项调整：已批准，代码**尚未实现**；
- 总体实现状态：`IMPLEMENTED_ADJUSTMENT_PENDING`（未迁移为已实现/已验收）；
- 正式验收：`SC-AC-001 ~ SC-AC-066` 共 66 条，全部 `NOT_RUN`，编号连续唯一；
- `PENDING_USER_CONFIRMATION=0`。

## 6. 9 个授权文件实际变更清单

本次批准仅修改/新建以下 9 个授权文件：

| 文件 | 变更类型 | 内容 |
|---|---|---|
| `docs/features/server-config/REQUIREMENTS.md` | 修改 | 文档状态迁移 `APPROVED`；新增批准元数据；声明段更新；§20 追加批准收口变更记录 |
| `docs/features/server-config/ACCEPTANCE.md` | 修改 | 文档状态迁移 `APPROVED`；新增批准元数据；状态含义行更新；§5 追加批准收口变更记录 |
| `docs/features/server-config/DESIGN.md` | 修改 | 文档/需求基线/验收基线状态迁移 `APPROVED`；新增批准元数据；声明段更新；§19 追加批准收口变更记录 |
| `docs/features/server-config/API.md` | 修改 | 文档/需求基线/验收基线状态迁移 `APPROVED`；新增批准元数据；声明段更新；§11 追加批准收口变更记录 |
| `docs/features/server-config/UI.md` | 修改 | 文档/需求基线/验收基线状态迁移 `APPROVED`；新增批准元数据；声明段更新；§20 追加批准收口变更记录 |
| `docs/features/server-config/DATABASE.md` | 修改 | 文档/需求基线/验收基线状态迁移 `APPROVED`；新增批准元数据；声明段更新；§18 追加批准收口变更记录 |
| `docs/features/server-config/reports/SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001.md` | 修改 | 末尾追加独立批准收口章节（§14） |
| `docs/features/server-config/reports/SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001.md` | 新建 | 本批准报告 |
| `docs/features/README.md` | 修改 | 仅更新 `server-config` 行（Feature 名称不变、基线状态 `APPROVED`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`、验收 66 条全部 `NOT_RUN`、下一入口=两项已批准调整的小范围实现、补充本批准报告入口），并追加变更记录；其他 Feature 行未改动 |

## 7. 验证命令与真实结果

| 验证项 | 命令 | 结果 |
|---|---|---|
| 分支与基线 | `git branch --show-current` / `git rev-parse HEAD` / `git rev-parse origin/develop` | `develop`；`HEAD==origin/develop==b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee` |
| ahead/behind | `git rev-list --left-right --count HEAD...origin/develop` | `0 0` |
| 空白检查 | `git diff --check` | 退出码 0，无输出 |
| 变更范围 | `git status --short`（授权范围核验） | 相对授权基线仅 9 个授权文件变化；代码、测试、数据库基线零变化 |
| 六份文档状态 | `grep` 六份文档 `文档状态` 行 | 全部为 `APPROVED` |
| 六份实现状态 | `grep` 六份文档 `实现状态` 行 | 全部为 `IMPLEMENTED_ADJUSTMENT_PENDING` |
| 验收用例 | `grep -oP 'SC-AC-\d{3}' ACCEPTANCE.md \| sort -u` | 66 个唯一编号，`SC-AC-001`~`SC-AC-066` 连续；文档声明全部 `NOT_RUN`；合计 66 |
| 待确认项 | `grep 'PENDING_USER_CONFIRMATION'` | 仅存在“数量为 0”的说明，无非零值 |
| 候选状态 | `grep 'DRAFT_ADJUSTMENT_PENDING_USER_REVIEW'` 六份文档 | 仅存在于历史变更记录中，无当前生效状态 |
| 历史保留 | 六份文档变更记录 | 初始候选、R1、R2 记录均保留 |
| 批准报告 | `test -f` 新建报告 | 存在，状态 `APPROVED` |
| 原报告追加 | 阅读原报告 §14 | 已追加独立批准收口章节 |
| README 范围 | `git diff docs/features/README.md` | 仅 `server-config` 行与变更记录变更 |
| Markdown 链接 | 逐项核验相对链接 | 全部可解析 |

## 8. 零副作用声明

- 未修改任何 Java/Vue/TS/CSS/测试、配置或构建文件；
- 未修改数据库基线；
- 未连接或查询数据库，未执行任何 SQL/DDL；
- 未连接或操作 ZooKeeper；
- 未调用任何业务接口；
- 未启动、停止、重启前后端、Chrome/CDP 或 sync-server；
- 未运行构建、测试或正式验收；
- 未把 `IMPLEMENTED_ADJUSTMENT_PENDING` 改成已实现/已验收；
- 未创建实现代码或实现任务报告；
- 未 force push、rebase、reset 或混入无关工作区内容；
- 任务前无关工作区内容原样保留。

## 9. Commit / Push 结果

- Commit：精确暂存 9 个授权文件，提交信息 `docs(server-config): approve pre-acceptance adjustment baseline`；
- Push：普通 Push 到 `origin/develop`，禁止 force；
- Push 后确认 `HEAD == origin/develop` 且 ahead/behind 为 `0 0`；
- 任务前无关工作区内容原样保留。

## 10. 下一阶段入口

本次批准收口后，下一阶段为**单独建立小范围代码实现任务**，实现两项已批准调整（`CONFIG_DESC` 人工换行安全显示、`ORDER BY ID_SERVER_CONFIG ASC`），随后再进入 66 条正式验收。本批准任务不实现任何代码。
