# 执行报告：建立“中心端配置”Feature 需求与验收基线

## 1. 任务结论与状态

本任务按提示词 `SERVER-CONFIG-FEATURE-BASELINE-001-AGENT-PROMPT.md` 建立“中心端配置”Feature 的候选需求与验收基线，共新增三个 Markdown 文件：

1. `docs/features/server-config/REQUIREMENTS.md`
2. `docs/features/server-config/ACCEPTANCE.md`
3. `docs/features/server-config/reports/SERVER-CONFIG-FEATURE-BASELINE-001.md`（本报告）

任务结论：**SUCCESS**。初始任务（含 R1）建立了“中心端配置”Feature 的候选需求与验收基线：初始创建与 R1 修订时三份文档状态均为 `DRAFT_PENDING_USER_REVIEW`（候选基线，待用户复审批准）；此后经 ChatGPT 复审通过并由项目负责人批准，`REQUIREMENTS.md` 与 `ACCEPTANCE.md` 的现行文档状态已更新为 `APPROVED`（详见本报告 §14 批准收口记录）。本任务为纯文档任务，未连接数据库，未执行任何数据库查询或写操作，未执行 DDL，未修改任何业务代码、前端、后端、测试、配置、菜单、路由或占位页，未创建或修改其他文档。

## 2. Git 开始状态、授权基线和分类

| 项 | 值 |
|---|---|
| 当前分支 | `develop` |
| 授权基线提交 | `7ea9d702e831245fbe8f0e84691bf0aea093dbdf` |
| 本地 HEAD | `7ea9d702e831245fbe8f0e84691bf0aea093dbdf`（== 授权基线） |
| origin/develop | `7ea9d702e831245fbe8f0e84691bf0aea093dbdf`（== 授权基线） |
| ahead/behind | `0 0` |
| 环境预检 | git 2.47.3、claude 2.1.143、locale en_US.UTF-8，均通过 |

工作区分类（任务开始前记录）：

- 任务开始前工作区已存在大量与本任务无关的既有未提交内容（未跟踪提示词/过程材料、已修改菜单与布局文件、已删除历史报告等），全部保持原样，未修改、未覆盖、未暂存、未提交。
- 本任务授权的三个目标文件在任务开始前均不存在（`docs/features/server-config/` 目录为空，`reports/` 子目录不存在），不存在无法安全区分的既有修改。
- 本任务仅新建授权范围内的三个文件，与其他文件无重叠。

## 3. 实际读取的正式基线和当前代码入口

按 §4 要求完整读取：

- `CLAUDE.md`（仓库根目录 Agent 开发规范）；
- `docs/baseline/` 六份正式项目级基线：`PROJECT.md`、`ENVIRONMENT.md`、`ARCHITECTURE.md`、`DEVELOPMENT_RULES.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md`；
- `docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`；
- `docs/database/README.md`、`docs/database/SCHEMA.md`、`docs/database/RELATIONS.md`、`docs/database/tables/CDC_SERVER.md`、`docs/database/tables/CDC_SERVER_CONFIG.md`、`docs/database/reports/DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001.md`；
- 复用格式：`docs/features/log-query/REQUIREMENTS.md` 与 `docs/features/log-query/ACCEPTANCE.md`（已批准正式 Feature 基线）。

当前代码入口只读检查（`OBSERVED_CODE`）：

- `frontend/src/router/index.ts`：路由 `/config/server`（name `ServerConfig`，title“服务端配置”，group“配置管理”）指向占位页；
- `frontend/src/config/menu.ts`：“配置管理”组下菜单项 `/config/server`，title“服务端配置”；
- `frontend/src/views/server-config/ServerConfigPage.vue`：占位页（`PlaceholderPage`），info 文本提及 `CDC_SERVER`、`CDC_SERVER_CONFIG`，无数据访问。

以上代码事实与已批准数据库基线 `CDC_SERVER.md` §8 / `CDC_SERVER_CONFIG.md` §8 一致。

## 4. 需求来源与负责人确认事实摘要

需求来源为项目负责人逐项确认的业务需求（提示词 §6 记录的 12 项负责人确认事实），均已写入 `REQUIREMENTS.md`，未降级为 Agent 推测：

1. “中心端”实际描述独立进程 `sync-server`；
2. 每个中心端在 `CDC_SERVER` 中对应唯一一条记录；
3. `CDC_SERVER` 记录由 `sync-server` 启动时插入，存在时不重复插入；
4. 当前以及可见的将来只有一个中心端；
5. `CDC_SERVER` 与 `CDC_SERVER_CONFIG` 为逻辑一对多关系；
6. `CDC_SERVER` 不提供独立管理页面，管理平台不新增、修改或删除其记录；
7. Feature 中文名称“中心端配置”，标识 `server-config`；
8. 现有“服务端配置”占位菜单/占位页直接演进为“中心端配置”，保留路由 `/config/server`；
9. 本 Feature 只查询 `CDC_SERVER`、查询并修改 `CDC_SERVER_CONFIG`；
10. `CDC_SERVER_CONFIG` 只允许修改既有记录的 `CONFIG_VALUE`，禁止新增和删除，其他字段均不可修改；
11. `CONFIG_VALUE` 当前不包含敏感内容，不做脱敏或掩码；
12. 修改配置后 `sync-server` 必须由外部方式重启才会生效；重启、生效通知、生效检测均不属于本 Feature。

数据库物理结构、字段类型、长度、可空性、约束、当前行数与数据分布均引用已批准数据库基线（`docs/database/`），本任务未重新查询数据库，也未把当前快照写成生产常态。

## 5. REQUIREMENTS 覆盖范围

`REQUIREMENTS.md` 按 §13 要求包含全部 20 节：

1. 元数据、文档状态和任务编号；
2. Feature 定位与术语；
3. 当前代码事实与未来目标分层（`OBSERVED_CODE` / `FUTURE_FEATURE_TARGET` / `OBSERVED_DATABASE`）；
4. 数据来源与已批准数据库基线引用（16 张已批准单表物理基线分层，14 当前访问 + 2 已批准待实现）；
5. 范围内/范围外；
6. 角色与主要使用场景；
7. 菜单、路由、页面结构和字段显示规则（页面主体为“配置项说明 + 配置值”两列，配置项说明为主内容宽列；配置Key 通过信息图标 Tooltip 按需查看；配置项显示名称兜底；换行/省略/Tooltip 规则，未锁死像素）；
8. 唯一中心端识别与异常行为（0/1/多中心端、0 配置）；
9. 全部配置展示规则；
10. 可编辑性双重判定与未知 Key 兼容策略（`IS_EDITABLE='1'` + 白名单）；
11. 六类已支持可编辑配置的控件和完整校验规则（布尔、`raw-message-storage-strategy`、`realtime-insert-batch-enabled-database-types`、`snapshotBatchSize`、`tableRowDeleteStrategy` + 通用非空与 VARCHAR2(64) 物理长度）；
12. 当前只读配置（`monitor-metric-topic-name`、`server-log-topic-name`）；
13. 编辑、撤销、脏值判断；
14. 保存确认框；
15. 后端防绕过、事务、无并发保护的更新语义（整批回滚、最后成功保存生效）；
16. 成功、失败和空状态；
17. 非功能边界与安全约束；
18. 明确的非目标；
19. 当前待确认项（数量为 0）；
20. 文档级变更记录。

需求文档未发明具体类名、接口 URI、DTO 字段名、SQL 实现、组件库代码或技术分层方案。

## 6. ACCEPTANCE 验收项分类与数量

`ACCEPTANCE.md` 将所有需求转换为可客观验收的场景，使用唯一、稳定的验收编号 `SC-AC-001` ~ `SC-AC-065`，共 **65** 项，覆盖 §14 列出的全部验收领域，包括：菜单名称/路由复用/无重复菜单；顶部中心端信息与配置数量；不展示“是否可编辑”字段；不展示主键与 `SERVER_ID` 列；页面主体“配置项说明 + 配置值”两列布局与配置项显示名称兜底；配置Key 信息图标 Tooltip；异常当前值允许纠正（SC-AC-065）；超长省略悬停原文与编辑控件宽度；无搜索/筛选/分页/自动刷新/增删入口；唯一中心端正常场景；0/多中心端与 0 配置异常场景；全部配置展示与 `CONFIG_KEY` 升序；`IS_EDITABLE` 双重判定；未知 key 只读；布尔/枚举/多选/整数/删除策略的有效与无效边界；只读配置；通用非空与物理长度（长度≤64 为通用上限）；多项编辑、无修改、撤销；确认框仅列变更项、不突出 Key；取消不保存；后端拒绝不可编辑/未知/非当前中心端/不存在记录/非 `CONFIG_VALUE` 字段；单事务全部成功/任一失败整批回滚；无并发保护与最后成功保存覆盖；保存成功重新加载；保存失败保留编辑值；不脱敏；不触发 `sync-server` 重启/生效；无 DDL、无 `CDC_SERVER` 维护能力。

每个验收项均写明前置条件、操作/输入、预期结果，未使用“功能正常”“体验良好”等无法客观判断的表述。对需要构造数据库异常数据的验收场景只定义期望行为，未授权本任务或未来验收人员执行数据库写操作；任何测试数据写入仍需按项目数据库审批规则另行获得授权。所有用例初始状态为 `NOT_RUN`。

## 7. 当前待确认项数量

当前 `PENDING_USER_CONFIRMATION` 数量为 **0**。`REQUIREMENTS.md` §19 明确记录待确认项数量为 0；已批准数据库基线中的未来边界前瞻说明（未来多中心端、未来新增 key、`IS_EDITABLE` 合法值全集等）均按 `FUTURE_SCOPE_RECONFIRMATION` / 未来边界归类，不构成本基线的当前待确认项。

## 8. 三个新增文件清单

| # | 文件 | 操作 | 状态 |
|---|---|---|---|
| 1 | `docs/features/server-config/REQUIREMENTS.md` | 新增 | `DRAFT_PENDING_USER_REVIEW` |
| 2 | `docs/features/server-config/ACCEPTANCE.md` | 新增 | `DRAFT_PENDING_USER_REVIEW` |
| 3 | `docs/features/server-config/reports/SERVER-CONFIG-FEATURE-BASELINE-001.md` | 新增（本报告） | — |

## 9. 文档自检、链接和一致性检查

| 检查项 | 结果 |
|---|---|
| 三个文档状态均为 `DRAFT_PENDING_USER_REVIEW` | 通过 |
| `REQUIREMENTS.md` 与 `ACCEPTANCE.md` 对每项规则无冲突 | 通过 |
| 中文名称、Feature 标识、菜单和路由一致（中心端配置 / `server-config` / 中心端配置 / `/config/server`） | 通过 |
| 不展示“是否可编辑”字段的要求明确且有验收项（SC-AC-005） | 通过 |
| 页面主体明确为“配置项说明 + 配置值”两列，配置项说明为主宽列；配置Key 通过信息图标 Tooltip 按需查看；配置项显示名称有兜底；异常当前值允许纠正；均有对应验收项（SC-UI-10~22、SC-AC-007/008/009/018/022/065） | 通过 |
| 验收用例总数由 64 更新为 65（新增 SC-AC-065），REQUIREMENTS、ACCEPTANCE、本报告三处一致 | 通过 |
| 六个支持编辑配置（auto-create-table、auto-expand-column-length、raw-message-storage-strategy、realtime-insert-batch-enabled-database-types、snapshotBatchSize、tableRowDeleteStrategy）及两个只读配置（monitor-metric-topic-name、server-log-topic-name）清单准确 | 通过 |
| 数据库类型固定顺序为 `doris,oracle,mysql` 子序列 | 通过 |
| 所有枚举、范围和大小写规则准确（布尔小写 true/false；RMSS 大写枚举；DBTYPE 小写子序列；snapshotBatchSize 100~10000；DELSTRAT 大写枚举） | 通过 |
| 未把当前开发库快照写成生产常态 | 通过 |
| 未把未来目标写成已实现 | 通过 |
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
- 提交信息：`docs(server-config): establish feature requirements baseline`。
- 推送：普通 `git push origin develop`，禁止 force push。
- 推送后核验：`git rev-parse HEAD` 与 `git rev-parse origin/develop` 一致，`git rev-list --left-right --count HEAD...origin/develop` 为 `0 0`；三个目标文件工作区状态正常。

说明：包含本报告自身的最终 Commit ID 无法在同一 Commit 内自洽生成，故本报告记录授权基线（`7ea9d702e831245fbe8f0e84691bf0aea093dbdf`）。本任务最终 result_commit_id、remote_commit_id、ahead_behind 在控制台 `AGENT_TASK_RESULT` 中输出，之后由 ChatGPT 直接核验远程提交。本报告不保留任何伪装成实际值的尖括号占位符。

## 12. 下一步

初始任务完成三个候选文档的建立、验证、Commit 并 Push 后立即停止。此后按标准流程推进 **ChatGPT 复审（R1 修订）→ 用户批准（`SERVER-CONFIG-FEATURE-BASELINE-APPROVAL-001`）**，需求与验收基线已批准（详见本报告 §14）。批准后下一阶段为 **阶段 4“设计与契约”**：建立 `DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md` 中适用文件；不得直接进入代码实现。

## 13. R1 复审修订记录（SERVER-CONFIG-FEATURE-BASELINE-001-R1）

### 13.1 R1 结论

本 R1 修订由 ChatGPT 复审驱动。ChatGPT 已直接核对远程 `develop` 提交 `90a02aad40a29f404c1d369c3a297d57b3f1a13e`，确认该提交只新增 `docs/features/server-config/REQUIREMENTS.md`、`docs/features/server-config/ACCEPTANCE.md`、`docs/features/server-config/reports/SERVER-CONFIG-FEATURE-BASELINE-001.md` 三个文件，候选基线核心规则完整，复审结论为“有条件通过，需要 R1 修订后再次复审”。项目负责人已确认 R1 调整方案。

### 13.2 ChatGPT 发现的三类问题

1. `CONFIG_KEY` 不应作为独立面向用户的列表列；
2. “异常当前值强制只读”与 `IS_EDITABLE='1'` + 可编辑白名单的双重判定冲突；
3. 当前可编辑白名单均为布尔/枚举/多选/整数 Key，不存在可执行的“提交合法 64 字符值保存成功”验收项。

### 13.3 R1 在 REQUIREMENTS 中的落实位置

- 术语：`CONFIG_KEY` 定位为技术标识（§2.2），不作为独立列表列、不作为面向用户的主要名称；
- 页面主体：§7.2 SC-UI-05、§7.3 SC-UI-10~14 改为“配置项说明 + 配置值”两列；
- 配置Key 按需查看：§7.4 SC-UI-15~17 信息图标 Tooltip `配置Key：{CONFIG_KEY}`；
- 配置项显示名称兜底：§7.5 SC-UI-18~22；
- 排序：§7.2 SC-UI-04、§9 SC-DISPLAY-02 明确 Key 不显示不影响排序，NULL/重复 Key 保持确定性稳定次序；
- 异常当前值纠正：§9 SC-DISPLAY-04/06/07/08；
- 保存确认框：§14 SC-CONFIRM-02 不突出 Key，技术 Key 通过信息图标按需查看；
- 物理长度：§11.7 SC-CFG-GEN-02/04 明确“长度≤64 为通用上限，不替代专门值域”；
- §20 追加 R1 文档级变更记录；文档状态保持 `DRAFT_PENDING_USER_REVIEW`。

### 13.4 R1 在 ACCEPTANCE 中的落实位置

- 修订 SC-AC-004/007/008/009/010/018/022/046/049/062；
- 修正 SC-AC-042：不再要求当前 Key 保存 64 字符合法值；超过 64 字符的新值请求由后端在写库前拒绝并整批回滚；
- 新增 SC-AC-065（非法当前值允许纠正）；
- 配置项显示名称兜底覆盖并入 SC-AC-007/008/009/022；
- 分类与合计更新为 65；全部用例保持 `NOT_RUN`；文档状态保持 `DRAFT_PENDING_USER_REVIEW`。

### 13.5 数据库访问 / 写操作 / DDL / 业务代码修改声明

```text
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_write_status=NONE
service_start_stop_status=NONE
business_code_change_status=NONE
```

本 R1 修订为纯文档任务，未连接数据库，未执行任何 SQL，未执行 DDL，未修改任何业务代码、前端、后端、测试、配置、菜单、路由或占位页，未创建 DESIGN/API/UI/DATABASE 文档。

### 13.6 R1 Commit / Push

- 授权基线提交：`90a02aad40a29f404c1d369c3a297d57b3f1a13e`；
- 提交信息：`docs(server-config): revise feature display requirements`；
- 普通 `git push origin develop`，禁止 force push；
- 本 R1 最终 Commit ID 与远程 Commit ID 以控制台 `AGENT_TASK_RESULT` 输出为准，本报告不保留尖括号占位符；
- 验收用例总数：65。

### 13.7 下一步

本 R1 修订完成三个候选文档的精确修订、验证、Commit 并 Push 后立即停止。R1 之后 ChatGPT 再次直接核验远程提交 `4e55493a0292b462885e4dde0d789e5e1ca48df2`，判定 R1 复审通过；项目负责人批准需求与验收基线（批准任务 `SERVER-CONFIG-FEATURE-BASELINE-APPROVAL-001`），详见本报告 §14。批准后下一阶段为 **阶段 4“设计与契约”**，不得直接进入实现。

## 14. 批准收口记录（SERVER-CONFIG-FEATURE-BASELINE-APPROVAL-001）

本小节由批准收口任务 `SERVER-CONFIG-FEATURE-BASELINE-APPROVAL-001` 追加，记录需求与验收基线由候选状态批准为正式状态的事实。本小节为纯文档记录，不改变 §1～§13 记录的初始任务与 R1 历史执行事实。

### 14.1 ChatGPT 复审结论

ChatGPT 已直接核对远程 `develop` 提交 `4e55493a0292b462885e4dde0d789e5e1ca48df2`，确认 R1 只修改 `REQUIREMENTS.md`、`ACCEPTANCE.md` 与原执行报告；页面主体统一为“配置项说明 + 配置值”两列；`CONFIG_KEY` 不作为独立列、通过信息图标 Tooltip 按需查看；配置项显示名称兜底规则完整；异常当前值允许纠正；物理长度验收口径准确；验收编号 `SC-AC-001`～`SC-AC-065` 连续、无重复、无缺失；需求、验收和执行报告一致；当前待确认项为 0；文档仍为 `DRAFT_PENDING_USER_REVIEW`、实现状态 `NOT_STARTED`、未修改代码或数据库。

ChatGPT 复审结论：**R1 复审通过，具备批准条件。**

### 14.2 项目负责人批准事实

项目负责人已明确批准“中心端配置”Feature 的需求与验收基线，批准任务编号为 `SERVER-CONFIG-FEATURE-BASELINE-APPROVAL-001`。批准只代表“系统应该做什么、怎样验收”正式生效；不代表设计已完成、代码已实现或 65 条验收已经执行通过。

### 14.3 批准后的文档与实现状态

| 项目 | 状态 |
|---|---|
| `REQUIREMENTS.md` 文档状态 | `APPROVED` |
| `ACCEPTANCE.md` 文档状态 | `APPROVED` |
| 实现状态 | `NOT_STARTED`（代码尚未开始） |
| 验收用例状态 | 65 条全部 `NOT_RUN`（尚未执行） |
| 当前待确认项 | 0 |

批准收口不改变任何现行业务规则，不把未来目标写成已实现，不把 65 条验收写成已执行或 PASS，不伪造实现、构建、测试或验收证据。

### 14.4 下一步

批准后进入 **阶段 4“设计与契约”**：建立 `DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md` 中适用文件；不得直接进入代码实现。本任务最终 Commit ID 与远程 Commit ID 以控制台 `AGENT_TASK_RESULT` 输出为准，本报告不保留任何伪装成实际结果的尖括号占位符。
