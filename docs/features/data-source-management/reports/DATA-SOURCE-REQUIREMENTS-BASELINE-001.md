# 执行报告：建立“数据源管理”Feature 需求与验收基线草案

## 1. 任务结论与状态

本任务按提示词 `DATA-SOURCE-REQUIREMENTS-BASELINE-001` 建立“数据源管理”Feature 的候选需求与验收基线草案，共新增三个 Markdown 文件：

1. `docs/features/data-source-management/REQUIREMENTS.md`
2. `docs/features/data-source-management/ACCEPTANCE.md`
3. `docs/features/data-source-management/reports/DATA-SOURCE-REQUIREMENTS-BASELINE-001.md`（本报告）

任务结论：**SUCCESS**。本任务为纯文档任务，建立“数据源管理”Feature 的需求与验收基线草案：三份文档状态均为 `DRAFT_PENDING_USER_REVIEW`（候选基线，待 ChatGPT 复审与用户批准），实现状态 `NOT_STARTED`，验收用例全部 `NOT_RUN`。本任务未连接数据库，未执行任何数据库查询或写操作，未执行 DDL，未修改任何业务代码、前端、后端、测试、配置、菜单、路由或占位页，未创建 DESIGN/API/UI/DATABASE 文档，未修改 `docs/database/**`、`docs/baseline/**`、`docs/features/README.md`、其他 `docs/features/**` 或 `CLAUDE.md`。

## 2. Git 开始状态、授权基线和分类

| 项 | 值 |
|---|---|
| 当前分支 | `develop` |
| 授权基线提交 | `eca58e669c8ebad3cf73a1732870d1cfb8388517` |
| 本地 HEAD | `eca58e669c8ebad3cf73a1732870d1cfb8388517`（== 授权基线） |
| origin/develop | `eca58e669c8ebad3cf73a1732870d1cfb8388517`（== 授权基线） |
| ahead/behind | `0 0` |
| 环境预检 | git、claude、locale 均通过（本任务为纯文档任务，不要求后端/前端/数据库/ZooKeeper 环境项） |

工作区分类（任务开始前记录）：

- 任务开始前工作区已存在大量与本任务无关的既有未提交内容（未跟踪提示词/过程材料、已修改菜单与布局文件、已删除历史报告等），全部保持原样，未修改、未覆盖、未暂存、未提交。
- 本任务授权的三个目标文件在任务开始前均不存在（`docs/features/data-source-management/` 目录为空，`reports/` 子目录不存在），不存在无法安全区分的既有修改。
- 本任务仅新建授权范围内的三个文件，与其他文件无重叠。

## 3. 实际读取的正式基线和当前代码入口

按 §3 要求完整读取：

- `CLAUDE.md`（仓库根目录 Agent 开发规范）；
- `docs/baseline/` 六份正式项目级基线：`PROJECT.md`、`ENVIRONMENT.md`、`ARCHITECTURE.md`、`DEVELOPMENT_RULES.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md`；
- `docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`；
- `docs/features/README.md`（Feature 总索引）；
- `docs/database/README.md`、`docs/database/SCHEMA.md`、`docs/database/RELATIONS.md`、`docs/database/CODE_VALUES.md`、`docs/database/tables/CDC_DATA_SOURCE.md`、`docs/database/tables/CDC_DATA_SOURCE_EXTEND.md`；
- 复用格式：`docs/features/server-config/REQUIREMENTS.md`、`docs/features/server-config/ACCEPTANCE.md` 与 `docs/features/server-config/reports/SERVER-CONFIG-FEATURE-BASELINE-001.md`（已批准正式 Feature 基线的文档结构）。

当前代码入口只读检查（`OBSERVED_CODE`）：

- `frontend/src/router/index.ts`：路由 `/config/data-source` 已存在；
- `frontend/src/config/menu.ts`：“配置管理”组下存在数据源管理菜单项；
- `frontend/src/views/data-source/DataSourcePage.vue`：占位页（`PlaceholderPage`），无数据访问；
- 后端 `com.bsoft.cdcconfig.datasource` 包已存在一套 CRUD + 启停的候选实现（`DataSourceController` 提供 7 个 API 端点：分页查询、详情、新增、修改、删除、启用、停用）。

以上代码事实与已批准数据库基线 `CDC_DATA_SOURCE.md`、`CDC_DATA_SOURCE_EXTEND.md` 一致。后端候选实现与新目标需求存在多处冲突（分页、启停、一对一 EXTEND、ID 同步、级联删除、查询口径、`FG_ACTIVE` 过滤等），已按现状差距记录在 `REQUIREMENTS.md` §3.1，**不** 作为已满足本基线的证据，也 **不** 写入目标需求。

## 4. 需求来源与已确认产品决策摘要

需求来源为已确认的产品决策（提示词 §5～§12 记录的 12 项产品决策）与已批准数据库基线，均写入 `REQUIREMENTS.md`，未降级为 Agent 推测，未发明新规则：

1. `CDC_DATA_SOURCE` 作为独立主表展示；
2. 仅查询和操作 `FG_ACTIVE = '1'` 的有效记录；其他值（包括 `'0'`）全部视为不存在；
3. 页面不提供启用/停用操作；新增显式写入 `FG_ACTIVE='1'`，编辑不修改 `FG_ACTIVE`；
4. 主列表不分页（记录总数 ≤ 100）；
5. 查询条件严格限定为数据源 ID、名称、主机地址三个输入框，均为不区分大小写的包含/模糊查询，多个非空条件 AND 组合，查询值去除首尾空格，默认按数据源 ID 升序；
6. 新增、编辑使用居中大弹窗；未保存关闭确认；防重复提交；
7. 唯一性：数据源 ID 与名称均不区分大小写唯一，后端保存前查询校验，第一版不新增数据库约束或 DDL；
8. 隐藏字段与跨表处理：新增自动 `DATA_SOURCE_ORG = DATA_SOURCE_NAME`；编辑保留 `ORG`、`SOURCE_APP`、`DATA_SOURCE_DOMAIN`；修改类别/ID 只改主表当前记录，不同步其他表引用；
9. 密码不返回、掩码展示、未修改不覆盖、修改后覆盖、日志与响应不泄露；
10. 测试连接：一次性临时 JDBC 连接，10 秒超时不重试，成功/脱敏失败原因，迟返回忽略，连接字段修改后状态失效，测试不修改业务数据；
11. `CDC_DATA_SOURCE_EXTEND` 表示源库到目标库的命名策略，0..N 条，`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 逻辑联合键唯一，第一版后端保存前查重校验、不新增 DDL，`TABLE_MERGE` 清空前缀后缀、`CUSTOM_PREFIX_SUFFIX` 前后缀必填；
12. 业务属性 `DATA_SOURCE_BIZ_ATTR` 仅目标库，独立弹窗普通 JSON 文本原样保存，第一版不做校验；
13. 删除为物理删除主表记录，二次确认，不检查、不级联 `CDC_DATA_SOURCE_EXTEND` 或其他表；
14. 通用交互与错误处理：加载态、空数据、脱敏提示与重试、防重复提交、成功反馈；
15. 安全边界：前端校验不是安全边界，后端必须独立重新校验；密码与敏感信息不泄露；第一版不新增 DDL。

数据库物理结构、字段类型、长度、可空性、约束、当前行数与数据分布均引用已批准数据库基线（`docs/database/`），本任务未重新查询数据库，也未把当前快照写成生产常态。

## 5. REQUIREMENTS 覆盖范围

`REQUIREMENTS.md` 包含全部 20 节：

1. 元数据、文档状态和任务编号；
2. Feature 定位与术语；
3. 当前状态与目标差距分层（`OBSERVED_CODE` / `OBSERVED_DATABASE` / `TARGET_REQUIREMENT` / `GAP`）；
4. 数据来源与已批准数据库基线引用（`CDC_DATA_SOURCE`、`CDC_DATA_SOURCE_EXTEND` 物理基线）；
5. 范围内/范围外；
6. 角色与主要使用场景；
7. 主数据源列表（数据范围、三条件查询、列表字段与行操作）；
8. 新增与编辑数据源（交互形式、表单字段、字段规则、唯一性、隐藏字段与跨表处理）；
9. 密码展示与保存；
10. 测试连接；
11. 目标库命名策略弹窗（业务语义、入口与列表、目标库选择与策略规则）；
12. 业务属性弹窗；
13. 删除数据源；
14. 通用交互与错误处理；
15. 权限/安全边界与错误处理补充；
16. 历史候选差异/废止规则；
17. 基线影响；
18. 依赖与后续工作；
19. 开放问题（数量为 0）；
20. 文档级变更记录。

需求编号 `DS-REQ-001` ~ `DS-REQ-109` 共 **109** 条。需求文档未发明具体类名、接口 URI、DTO 字段名、SQL 实现、组件库代码或技术分层方案。

## 6. ACCEPTANCE 验收项分类与数量

`ACCEPTANCE.md` 将所有需求转换为可客观验收的场景，使用唯一、稳定的验收编号 `DS-AC-001` ~ `DS-AC-101`，共 **101** 项，覆盖提示词 §16 列出的全部验收领域：

- 菜单与路由（DS-AC-001~004）；
- 主列表字段与行操作（DS-AC-005~010）：列字段、隐藏字段、按角色的行操作、双击编辑、`FG_ACTIVE != '1'` 不可见；
- 三条件模糊查询（DS-AC-011~019）：ID/名称/主机模糊与大小写、AND 组合、trim、查询、重置、默认升序、无分页；
- 新增与编辑弹窗交互（DS-AC-020~023）：居中大弹窗、未保存关闭确认、防重复提交、保存刷新；
- 表单字段与校验（DS-AC-024~035）：仅 9 个主字段、ID/名称/角色/类型联动/主机/端口/用户名/密码/Service Name 规则；
- 唯一性校验（DS-AC-036~040）：ID 与名称不区分大小写查重、后端校验、编辑排除自身、业务提示；
- 隐藏字段与跨表处理（DS-AC-041~046）：新增自动 `ORG`、编辑保留、`SOURCE_APP`/`DOMAIN` 保留、类别/ID 修改不更新其他表、`FG_ACTIVE` 处理；
- 密码展示与保存（DS-AC-047~052）：不显示、不返回、掩码、未改不上传、改后覆盖、不泄露；
- 测试连接（DS-AC-053~064）：成功、认证失败、不可达、10 秒超时、迟返回忽略、不影响保存、字段修改后状态失效；
- 业务属性弹窗（DS-AC-065~070）：仅目标库、独立弹窗、可为空、非法 JSON 可保存、空格原样保留、未保存关闭确认；
- 目标库命名策略弹窗（DS-AC-071~086）：0..N、目标下拉范围、逻辑联合键重复、多条异常阻止保存、`TABLE_MERGE` 清空、`CUSTOM_PREFIX_SUFFIX` 必填、删除只删对应行、`FG_ACTIVE != '1'` 不作为下拉选项；
- 删除数据源（DS-AC-087~092）：只保留删除、物理删除主表、不级联、被引用不阻止、二次确认、不通过 `FG_ACTIVE`；
- 通用交互、错误处理与安全（DS-AC-093~101）：加载态、空数据、脱敏提示与重试、防重复提交、成功反馈、双击与按钮一致、未保存关闭确认、不使用新标签页、测试连接不修改业务数据。

每个验收项均写明关联需求编号（`DS-REQ-xxx`）、前置条件、操作/输入、预期结果，未使用“功能正常”“体验良好”等无法客观判断的表述。对需要构造数据库异常数据的验收场景只定义期望行为，未授权本任务或未来验收人员执行数据库写操作；任何测试数据写入仍需按项目数据库审批规则另行获得授权。所有用例初始状态为 `NOT_RUN`。

## 7. 当前待确认项数量

当前 `PENDING_USER_CONFIRMATION` 数量为 **0**。`REQUIREMENTS.md` §19 明确记录开放问题数量为 0；MySQL/Doris JDBC 驱动为设计/实现阶段的依赖约束（§18），已批准基线后续维护为独立任务（§17），均不构成本草案的当前开放问题。

## 8. 三个新增文件清单

| # | 文件 | 操作 | 状态 |
|---|---|---|---|
| 1 | `docs/features/data-source-management/REQUIREMENTS.md` | 新增 | `DRAFT_PENDING_USER_REVIEW` |
| 2 | `docs/features/data-source-management/ACCEPTANCE.md` | 新增 | `DRAFT_PENDING_USER_REVIEW` |
| 3 | `docs/features/data-source-management/reports/DATA-SOURCE-REQUIREMENTS-BASELINE-001.md` | 新增（本报告） | — |

## 9. 文档自检、链接和一致性检查

| 检查项 | 结果 |
|---|---|
| 三个文档状态均为 `DRAFT_PENDING_USER_REVIEW` | 通过 |
| 实现状态均为 `NOT_STARTED`；全部验收用例 `NOT_RUN` | 通过 |
| `REQUIREMENTS.md` 与 `ACCEPTANCE.md` 对每项规则无冲突 | 通过 |
| 中文名称、Feature 标识、菜单和路由一致（数据源管理 / `data-source-management` / 数据源管理 / `/config/data-source`） | 通过 |
| 需求编号 `DS-REQ-001`~`DS-REQ-109` 连续、无重复、无缺失 | 通过 |
| 验收编号 `DS-AC-001`~`DS-AC-101` 连续、无重复、无缺失 | 通过 |
| 每个验收项均引用有效的 `DS-REQ-xxx` 关联需求编号 | 通过 |
| 验收覆盖提示词 §16 全部领域 | 通过 |
| 三字段模糊查询/大小写/AND/trim/重置/默认排序/无分页均有验收项（DS-AC-011~019、DS-AC-004） | 通过 |
| SOURCE/TARGET 类型联动、角色-类型合法性有验收项（DS-AC-028/029/030） | 通过 |
| ID/名称不区分大小写查重有验收项（DS-AC-036/037） | 通过 |
| 新增/编辑时 ORG、FG_ACTIVE、SOURCE_APP、DOMAIN 处理有验收项（DS-AC-041/042/043/046） | 通过 |
| 修改 ID/类别不更新其他表有验收项（DS-AC-044/045） | 通过 |
| 密码掩码/未改不上传/改后覆盖/不泄露有验收项（DS-AC-047~052） | 通过 |
| 连接测试成功/认证失败/不可达/10秒超时/迟返回忽略/不影响保存/字段修改后状态失效均有验收项（DS-AC-053~064） | 通过 |
| BIZ_ATTR 为空/非法 JSON 可保存/空格原样保留有验收项（DS-AC-067/068/069） | 通过 |
| 命名策略 0..N/目标下拉范围/逻辑联合键重复/多条异常阻止保存有验收项（DS-AC-074/075/076/081/082） | 通过 |
| `TABLE_MERGE` 清空前后缀、`CUSTOM_PREFIX_SUFFIX` 前后缀必填有验收项（DS-AC-079/080） | 通过 |
| 删除策略只删对应 EXTEND、删除数据源只删主表不检查关联有验收项（DS-AC-083/089/090） | 通过 |
| 双击与按钮编辑、未保存关闭确认、防重复提交、脱敏错误有验收项（DS-AC-009/021/022/095/098/099） | 通过 |
| `FG_ACTIVE != '1'` 记录不可见且不可作为目标库选项有验收项（DS-AC-010/086） | 通过 |
| 现有后端候选实现与新目标冲突仅记录为现状差距（REQUIREMENTS §3.1），未写成目标需求 | 通过 |
| 未把当前开发库快照写成生产常态 | 通过 |
| 未把未来目标写成已实现 | 通过 |
| 未把现有后端候选实现描述为已满足本基线 | 通过 |
| 待确认项数量为 0 | 通过 |
| Markdown 相对链接可解析 | 通过 |
| 未修改授权范围外文件 | 通过 |
| `git diff --check` 通过 | 通过 |

## 10. 数据库访问 / 写操作 / DDL / 业务代码修改声明

```text
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_write_status=NONE
service_start_stop_status=NONE
business_code_change_status=NONE
feature_document_change_status=NONE（未修改任何已有 Feature 文档；仅新增本 Feature 三个文件）
```

本任务按提示词要求未连接数据库，未执行任何数据库查询或写操作（INSERT/UPDATE/DELETE/MERGE/CREATE/ALTER/DROP/TRUNCATE/COMMENT/GRANT/REVOKE/PL-SQL）；未连接 ZooKeeper；未启动任何业务进程；未修改任何业务代码、前端、后端、测试、配置、菜单、路由或占位页；未创建 DESIGN/API/UI/DATABASE 文档；未修改 `docs/database/**`、`docs/baseline/**`、`docs/features/README.md` 或其他 `docs/features/**`、`CLAUDE.md`。

## 11. Commit / Push 执行结果

- 授权范围：仅 §8 列出的 3 个文件；逐文件精确暂存，不使用 `git add .` / `git add -A`。
- 提交信息：`docs(data-source-management): establish requirements baseline draft [DATA-SOURCE-REQUIREMENTS-BASELINE-001]`。
- 推送：普通 `git push origin develop`，禁止 force push。
- 推送后核验：`git rev-parse HEAD` 与 `git rev-parse origin/develop` 一致，`git rev-list --left-right --count HEAD...origin/develop` 为 `0 0`；三个目标文件工作区状态正常。

说明：包含本报告自身的最终 Commit ID 无法在同一 Commit 内自洽生成，故本报告记录授权基线（`eca58e669c8ebad3cf73a1732870d1cfb8388517`）。本任务最终 result_commit_id、remote_commit_id、ahead_behind 在控制台 `AGENT_TASK_RESULT` 中输出，之后由 ChatGPT 直接核验远程提交。本报告不保留任何伪装成实际值的尖括号占位符。

## 12. 下一步

本任务完成三个候选文档的建立、验证、Commit 并 Push 后立即停止。此后按标准流程推进 **ChatGPT 复审 → 用户批准**；需求与验收基线批准后，下一阶段为 **阶段 4“设计与契约”**：建立 `DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md` 中适用文件；不得直接进入代码实现。
