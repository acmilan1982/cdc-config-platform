# 中心端配置 验收前显示与排序调整候选基线报告

## 1. 任务元数据

- `task_id`: `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001`
- Feature：`server-config`（中心端配置）
- 目标分支：`develop`
- 授权基线：`c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba`
- 任务性质：纯文档、候选基线建立任务（不进入实现、不执行验收）
- 执行时间：2026-08-28
- 建议提交信息：`docs(server-config): draft pre-acceptance display adjustment`

## 2. 权限边界

本任务为纯文档任务，全程遵守以下边界：

| 项 | 允许状态 | 实际执行 |
|---|---|---|
| 代码修改（Java/Vue/TS/CSS/测试） | `NONE` | 未修改任何代码 |
| 数据库访问 | `NONE` | 未连接数据库，0 条查询/写入/DDL |
| ZooKeeper 访问 | `NONE` | 未连接 |
| `sync-server` 操作 | `NONE` | 未启动/停止/重启 |
| `POST /api/server-config/save` | `NONE` | 0 次调用 |
| 前后端/Chrome/CDP 运行服务 | `NONE` | 未启动/停止/重启/操作 |
| 正式验收 | `NONE` | 未执行（状态保持 `NOT_RUN`） |
| 已批准数据库基线 | `NONE` | 未修改 |
| 文档修改 | 仅 6 份功能基线文档 | 已修改 6 份 |
| 报告新建 | 仅 1 份执行报告 | 本报告 |

## 3. Git 开始状态

- 当前分支：`develop`
- 任务开始前 HEAD：`c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba`
- `origin/develop`：`c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba`
- ahead / behind：`0 0`
- 任务开始前既有未提交条目数：114 条（全部保持原样，未清理、未覆盖、未暂存、未提交；其中不含本次 6 份授权文档）
- 授权文档开始前状态：6 份均为 `CLEAN`（与授权基线一致）

## 4. 负责人视觉结论

负责人已完成页面目测。除本次任务列出的两项调整（`CONFIG_DESC` 人工换行、展示顺序改为 `ID_SERVER_CONFIG ASC`）外，未发现其他视觉问题。

本报告不把负责人目测或此前的只读联调描述为正式验收完成；正式验收仍为 `NOT_RUN`。

## 5. 两项调整

### 5.1 `CONFIG_DESC` 人工换行

- 原因：当前页面已能对过长配置项说明自动折行，但数据库 `CONFIG_DESC` 存在真实换行字符（如 Oracle `CHR(10)`）时，页面不按该换行显示。
- 旧规则：未明确数据库真实换行的显示语义，仅具备自然折行行为。
- 新候选规则：
  - 普通过长文本按列宽自动折行；
  - `CONFIG_DESC` 中真实 LF/CRLF 换行按换行位置显示，目标前端样式语义为 `white-space: pre-line; line-height: 1.6; overflow-wrap: anywhere;`；
  - 不解析 HTML、不把 `<br>` 作为换行协议、不把字面量 `\n` 自动转换为换行、严禁 `v-html`；
  - API 原样返回 `configDesc`（JSON 标准转义在线路上传输换行），后端不做 HTML/换行替换或规范化；
  - `CONFIG_DESC` 仍为只读字段，页面不允许修改；
  - 不新增数据库字段、约束、索引或 DDL，不要求修改任何数据；
  - 多行说明下信息图标/Key Tooltip 仍合理对齐，不破坏布局、不造成横向溢出。
- 实现状态：尚未实现（本次仅调整候选基线）。

### 5.2 展示顺序

- 原因：负责人要求配置项说明列表不再按 `CONFIG_KEY` 排序，改为按 `ID_SERVER_CONFIG` 升序展示。
- 旧规则：`CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC`。
- 新候选规则：
  - 统一契约为 `ORDER BY ID_SERVER_CONFIG ASC`；
  - 后端查询负责排序，前端保持接口返回顺序、不二次排序；
  - `CONFIG_KEY` 不再承担页面排序职责，但仍作为 sync-server 读取配置、编辑白名单识别和 Key Tooltip 展示所需的技术标识；
  - `ID_SERVER_CONFIG` 按数据库字段自身字符串排序语义升序，不做数值转换；当前补零编号（如 `001`～`008`）可得到负责人期望顺序；
  - 不新增或修改数据库约束、索引、主键及数据。
- 实现状态：尚未实现（旧实现仍采用旧排序，本次仅调整候选基线）。

## 6. 授权文件修改清单

共修改 6 个既有文档、新建 1 个报告，共 7 个授权文件：

| 文件 | 修改摘要 |
|---|---|
| `docs/features/server-config/REQUIREMENTS.md` | 状态标记更新；`SC-UI-04`、`SC-DISPLAY-02` 排序改为 `ID_SERVER_CONFIG ASC`；`SC-UI-11` 拆分自动折行/真实换行；新增 §7.6（`SC-UI-23`～`SC-UI-26`）；追加变更记录 |
| `docs/features/server-config/ACCEPTANCE.md` | 状态标记更新；`SC-AC-007` 聚焦自动折行、`SC-AC-017` 改为 `ID_SERVER_CONFIG ASC`；新增 §4.15 + `SC-AC-066`；总数 65→66；追加变更记录 |
| `docs/features/server-config/DESIGN.md` | 状态标记更新；`SC-DESIGN-046`、`SC-DESIGN-121` 排序改为 `ID_SERVER_CONFIG ASC`；新增 `SC-DESIGN-047`；追加变更记录 |
| `docs/features/server-config/API.md` | 状态标记更新；`SC-API-025`、`SC-API-034` 排序改为 `ID_SERVER_CONFIG ASC`；`SC-API-027` 移除排序职责；`SC-API-028` 明确含真实换行原样返回；新增 `SC-API-036`；追加变更记录 |
| `docs/features/server-config/UI.md` | 状态标记更新；`SC-UI-DESIGN-030` 聚焦自动折行；新增 `SC-UI-DESIGN-035`～`SC-UI-DESIGN-038`、`SC-UI-DESIGN-045`；`SC-UI-DESIGN-152` 视觉清单更新；追加变更记录 |
| `docs/features/server-config/DATABASE.md` | 状态标记更新；`SC-DB-023`、`SC-DB-024`、`SC-DB-034`、`SC-DB-054`、`SC-DB-091` 排序与职责修订；新增 `SC-DB-056`；§6 章节标题更新；追加变更记录 |
| `docs/features/server-config/reports/SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001.md` | 本报告（新建） |

历史 `APPROVED` 状态与 R1/R2 修订记录均保留，未抹除；旧规则仅保留在明确标记为历史的变更记录行中。

## 7. 状态与计数

- 六份文档候选状态：`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`
- 实现状态：`IMPLEMENTED_ADJUSTMENT_PENDING`（旧批准版本已实现并复审，本次两项调整尚未实现）
- 正式验收：`NOT_RUN`
- 验收用例总数：66（`SC-AC-001`～`SC-AC-066`，连续且唯一）
- 验收用例 `NOT_RUN` 数：66
- 负责人业务待确认项：0

## 8. 验证命令与真实结果

| 验证项 | 命令 | 退出码/结果 |
|---|---|---|
| 分支与现场 | `git branch --show-current` | `develop` |
| 授权基线 | `git rev-parse HEAD` / `git rev-parse origin/develop` | 均为 `c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba` |
| ahead/behind | `git rev-list --left-right --count HEAD...origin/develop` | `0 0` |
| 空白错误 | `git diff --check` | 退出码 0，无输出 |
| 变更范围 | `git status --short`（限定 7 个授权文件） | 仅 6 个文档 ` M` + 本报告新建 |
| 状态一致 | grep 六份文档状态标记 | 六份一致 |
| 排序统一 | grep 当前目标规则 `ORDER BY ID_SERVER_CONFIG ASC` | 一致；`CONFIG_KEY ASC NULLS LAST` 仅存在于历史记录行 |
| `configDesc` 语义 | 交叉核对 API/DESIGN/UI/DATABASE | 一致（原样传输、安全文本渲染、真实换行语义） |
| 安全边界 | grep `v-html`/`<br>` 协议/字面量 `\n` 转换 | 目标规则中无；已明确禁止 |
| 验收用例 | grep `SC-AC-001`～`SC-AC-066` | 连续唯一，66 条，全部 `NOT_RUN` |
| 编号冲突 | grep 新增编号定义行 | 定义行唯一，未与既有编号冲突 |
| Markdown 链接 | 相对链接检查 | 可解析 |
| 待确认项 | grep `PENDING_USER_CONFIRMATION` | 0 |

> 验证在提交前完成；本表记录的是任务执行中的真实命令与结果，未使用推测值。

## 9. 零副作用声明

- 未修改任何前后端业务代码与测试；
- 未执行数据库查询、写入、DDL 或提供/执行任何 `UPDATE`；
- 未连接 ZooKeeper；
- 未调用 `POST /api/server-config/save`；
- 未启动、停止、重启或操作此前交接的前后端、Chrome/CDP、sync-server；
- 未执行正式验收；
- 未修改已批准数据库基线、`docs/features/README.md` 或既有执行报告；
- 未 force push、rebase 或改写历史；
- 任务开始前的无关工作区修改（114 条）原样保留，未清理、未覆盖、未暂存、未提交。

## 10. Commit / Push 结果

- 提交信息：`docs(server-config): draft pre-acceptance display adjustment`
- 仅精确暂存 7 个授权文件；
- 普通 Push 到 `origin/develop`（未使用 force）；
- Push 后验证 `HEAD == origin/develop` 且 ahead/behind 为 `0 0`；
- 任务开始前的无关工作区内容仍原样存在。

## 11. 下一步

本任务在 Commit 与 Push 成功后即停止，不进行批准收口、不创建实现任务、不修改代码、不运行构建/测试/业务服务，也不操作数据库、ZooKeeper 或 sync-server。

下一步仅允许：ChatGPT 直接核对远程提交和本报告；复审通过后，由项目负责人决定是否批准本次调整基线。批准后再建立一个只修改排序与说明换行显示的小范围实现任务。
