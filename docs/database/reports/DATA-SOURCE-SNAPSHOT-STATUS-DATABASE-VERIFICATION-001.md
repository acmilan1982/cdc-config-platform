# 源库快照状态 —— `CDC_DATA_SOURCE_RUN_STATE` 数据库只读复核报告

> 文档状态：执行报告（一次性只读复核）
> 任务代码：`DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001`
> 任务类型：`DATABASE_READ_ONLY_VERIFICATION`
> Feature：`data-source-snapshot-status`（源库快照状态）
> 执行日期：2026-09-05
> 执行分支：develop
> 报告路径：`docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`

---

## 1. 结论

**`PASS_WITH_FINDINGS`**

本次对开发 Oracle 数据库中 `CDC_DATA_SOURCE_RUN_STATE` 的严格只读复核全部完成：对象存在性与归属、6 个字段定义、约束与索引、数据量与状态分布、时间字段数据特征、键与引用完整性、当前代码与文档状态均已核验并记录。存在以下“发现项”，均为供后续 REQUIREMENTS/ACCEPTANCE/DESIGN 使用的事实性观察，不构成数据库缺陷，也不阻断本次复核：

- **F1**：当前开发库该表仅 1 条记录，状态为 `SNAPSHOT_RUNNING`（`hosp-012` / `112-source-19c`），其 `SNAPSHOT_COMPLETED_AT` 为 NULL；`SNAPSHOT_LAST_SEEN_AT = UPDATED_AT = 2026-08-17 17:28:46`。开发库当前数据中没有 `SNAPSHOT_COMPLETED` 样例。
- **F2**：`SNAPSHOT_STATUS` 两个取值（`SNAPSHOT_RUNNING` / `SNAPSHOT_COMPLETED`）**不是数据库约束事实**。数据库层只有 4 条 NOT NULL Check 约束，没有任何对状态取值封闭的 Check 约束。状态值集合是否封闭由写入方（sync-client）保证，页面/需求侧不应假定数据库会拒绝未知状态。
- **F3**：唯一记录引用的 `CDC_DATA_SOURCE`（`112-source-19c`）的 `DATA_SOURCE_CATEGORY` 当前存储为小写 `source`。历史资料已记录过类别大小写混用、程序层统一转大写，管理平台只读，此处作为数据观察记录。
- **F4**：表与 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 的引用关系无任何孤立记录，关联的源库类别为 SOURCE、启停均为启用；未发现重复对、跨探针同源库、ID 空白/大小写异常。
- **F5**：`UPDATED_AT` 停更在 2026-08-17，距今约 19 天，仅能说明该组合快照记录未被更新，不能据 `UPDATED_AT` 判断 sync-client 在线/健康（与已确认业务规则一致）。该 RUNNING 记录长期未转为 COMPLETED 是否为预期，需 sync-client 侧另行确认，不属本表核验范围。

---

## 2. 执行时点与 Git 现场

| 项 | 值 |
|---|---|
| 当前分支 | `develop` |
| 本地基线提交（HEAD） | `a9567f4c32af4c869a49a92ca6b3592f85782cb6` |
| 远程 develop（ls-remote） | `a9567f4c32af4c869a49a92ca6b3592f85782cb6` |
| ahead / behind（HEAD...origin/develop） | `0 / 0`（本地与远程一致，无分叉） |
| 任务提示词中“已知远程提交”锚点 | `fc4d033aac5a9952727cd80626bda90e471dd674`（仅为任务生成时锚点，执行时远程已前进到 `a9567f4`，以实际为准） |

### 2.1 任务开始前 Git 状态与用户既有工作区保护

执行前置检查时 `git status --short` 显示工作区存在大量**任务开始前已存在的用户修改/未跟踪/已删除文件**，包括但不限于：

- 已修改跟踪文件：`.claude/settings.local.json`、`agent-env.sh`、`frontend/index.html`、`frontend/src/config/menu.ts`、`frontend/src/layouts/*`、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css` 等；
- 已删除跟踪文件：`docs/database/TASK3_FINAL_REVISION_REPORT_20260806.md` 等 3 个历史报告；
- 大量未跟踪文件：`docs/agent-prompts/`、`docs/baseline-work/`、`docs/features/*` 本地候选、`docs/prompts/`、`docs/task-reports/` 等。

按规则（CLAUDE.md §6、DEVELOPMENT_RULES.md §2.5），本次任务**未修改、未覆盖、未暂存、未提交任何上述既有文件**；唯一新增文件为本报告。执行过程未执行 `git pull/merge/rebase/reset/clean/stash/checkout`，未 fetch 其他分支（本地与远程一致，无需 fetch）。

---

## 3. 已读取资料

- 项目规范与流程：`CLAUDE.md`、`docs/baseline/README.md`、`docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`。
- 六份正式项目级基线：`PROJECT.md`、`ENVIRONMENT.md`、`ARCHITECTURE.md`、`DEVELOPMENT_RULES.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md`。
- Feature 索引：`docs/features/README.md`（`data-source-run-state` 一行：数据源运行状态 / 占位 / `BASELINE_NOT_ESTABLISHED`）。
- 数据库基线（`docs/database/`）：`README.md`、`SCHEMA.md`、`RELATIONS.md`、`CODE_VALUES.md`、`DATA_PROFILE.md`、`VERIFICATION.md`、`CHANGELOG.md`（定向 grep 复核 RUN_STATE/SNAPSHOT 相关记录）。
- 历史快照资料（待复核线索）：`table-list.md`、`table-detail.md`、`table-relations.md`、`confirmed-business-rules.md`、`data-characteristics.md`、`dictionary-candidates.md`。
- 前端代码：`frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`、`frontend/src/router/index.ts`、`frontend/src/config/menu.ts`（工作区当前版）。
- 后端/前端源代码 grep：`CDC_DATA_SOURCE_RUN_STATE`、`run_state`、`snapshot`、`runstate` 等关键字跨仓库扫描。
- Feature 目录：`docs/features/data-source-snapshot-status/`（目录存在但为空）。

> 说明：`table-list.md`、`table-detail.md`、`confirmed-business-rules.md`、`data-characteristics.md`、`table-relations.md`、`dictionary-candidates.md` 均标 `HISTORICAL_SUPERSEDED`，为 2026-07-03 历史快照，仅作为待复核线索，不冒充当前数据库事实。

---

## 4. 数据库连接结果

- 目标：项目已配置的内网开发 Oracle（`192.168.174.65:1521/prod.enmotech.com`），Schema `CDC`；使用项目 CLAUDE.md §11 授权开发库账号；**报告不打印密码与带凭据连接串**。
- 连接方式：Oracle Instant Client SQL\*Plus（`/opt/oracle/instantclient`）。
- 结果：`READ_ONLY_SUCCESS`。当前用户 = 当前 Schema = `CDC`。
- 全部执行为只读 `SELECT` / 数据字典查询；**未执行任何写操作、DDL、锁表、`FOR UPDATE`、临时表或存储过程**。

---

## 5. 表存在性、Owner、对象类型与注释

| 项 | 值 |
|---|---|
| 对象名 | `CDC_DATA_SOURCE_RUN_STATE` |
| Owner | `CDC` |
| 对象类型 | TABLE（普通堆表） |
| 状态 | VALID |
| 表注释 | 空（无注释）——与历史“（无注释）”记录一致 |
| created | 2026-07-02 14:47:20 |
| last_ddl_time | 2026-08-17 17:27:47 |
| 数据库层归属范围 | 属于 SCHEMA.md §5.1“历史提及但当前生产代码未使用（待分析）”对象；不在已批准 16 张单表物理基线范围内 |

---

## 6. 完整字段表

来自 `ALL_TAB_COLUMNS`（按 column_id 顺序）与 `ALL_COL_COMMENTS`，Oracle 数据字典直接核验：

| # | 字段名 | 数据类型 | 长度（BYTE） | CHAR 语义 | 精度/小数位 | 可空 | 默认值 | 字段注释（字典） |
|---|---|---|---|---|---|---|---|---|
| 1 | CLIENT_ID | VARCHAR2 | 64 | BYTE（char_used=B） | -/- | N | 无 | 探针id |
| 2 | DATA_SOURCE_ID | VARCHAR2 | 64 | BYTE（char_used=B） | -/- | N | 无 | 数据源id(源库id) |
| 3 | SNAPSHOT_STATUS | VARCHAR2 | 32 | BYTE（char_used=B） | -/- | N | 无 | 快照状态，SNAPSHOT_COMPLETED/SNAPSHOT_RUNNING |
| 4 | SNAPSHOT_LAST_SEEN_AT | DATE | 7 | - | -/- | Y | 无 | 快照任务启动时间 |
| 5 | SNAPSHOT_COMPLETED_AT | DATE | 7 | - | -/- | Y | 无 | 快照任务完成时间 |
| 6 | UPDATED_AT | DATE | 7 | - | -/- | N | 无 | 当前记录更新时间 |

历史记录中的六字段名、顺序、类型与可空性**全部仍成立**（细节差异见 §12）。

---

## 7. 完整约束与索引表

### 7.1 约束（`ALL_CONSTRAINTS` / `ALL_CONS_COLUMNS`）

| 类型 | 约束名 | 字段（position） | 状态 | 校验 | 条件 |
|---|---|---|---|---|---|
| PRIMARY KEY (P) | PK_CDC_DS_RUN_STATE | CLIENT_ID(1), DATA_SOURCE_ID(2) | ENABLED | VALIDATED | 复合主键 |
| CHECK (C) | SYS_C0041433 | CLIENT_ID | ENABLED | VALIDATED | "CLIENT_ID" IS NOT NULL |
| CHECK (C) | SYS_C0041434 | DATA_SOURCE_ID | ENABLED | VALIDATED | "DATA_SOURCE_ID" IS NOT NULL |
| CHECK (C) | SYS_C0041435 | SNAPSHOT_STATUS | ENABLED | VALIDATED | "SNAPSHOT_STATUS" IS NOT NULL |
| CHECK (C) | SYS_C0041436 | UPDATED_AT | ENABLED | VALIDATED | "UPDATED_AT" IS NOT NULL |

- 唯一约束：无独立 UNIQUE 约束（唯一性由复合主键承载）。
- 外键：**无**（表上无 R 约束，也无其他表 R 约束引用本表主键）。与项目“逻辑外键、无物理外键”架构决策一致。
- **不存在对 `SNAPSHOT_STATUS` 取值的封闭 Check 约束**（F2）。
- 触发器：无。

### 7.2 索引（`ALL_INDEXES` / `ALL_IND_COLUMNS`）

| 索引名 | 类型 | 唯一性 | 字段顺序 | 状态 | last_analyzed |
|---|---|---|---|---|---|
| PK_CDC_DS_RUN_STATE | NORMAL | UNIQUE | CLIENT_ID(1), DATA_SOURCE_ID(2) | VALID | 2026-08-19 22:56:09 |

历史记录中的复合主键 `CLIENT_ID, DATA_SOURCE_ID`（`PK_CDC_DS_RUN_STATE`）**仍然成立**。

---

## 8. 数据量、状态值及时间字段统计（开发库快照，执行时点）

### 8.1 数据量与状态分布

| 指标 | 结果 |
|---|---|
| 总记录数 | 1 |
| SNAPSHOT_STATUS 分布 | `SNAPSHOT_RUNNING` = 1，`SNAPSHOT_COMPLETED` = 0 |
| 状态原始内容 | 仅 `SNAPSHOT_RUNNING`（长度 16，与 byte 长度一致，无前后空白） |
| NULL 状态 | 0 |
| 空字符串状态 | 0（Oracle VARCHAR2 空串即 NULL，二者已并入 NULL 检查为 0） |
| 未知状态（非 RUNNING/COMPLETED） | 0 |
| 去重数量 | CLIENT_ID 去重 1，DATA_SOURCE_ID 去重 1，`(CLIENT_ID, DATA_SOURCE_ID)` 去重 1 |
| 重复对 | 0（复合主键约束下不可能出现） |

> 状态约束口径分离：实际数据分布仅见 `SNAPSHOT_RUNNING`；数据库层无对状态取值封闭的约束（见 §7.1、F2）。**不得把“当前只有两个状态值”写成数据库强约束。**

### 8.2 时间字段数据特征

| 时间字段 | NULL 数 | 非 NULL 数 | 最小值 | 最大值 |
|---|---|---|---|---|
| SNAPSHOT_LAST_SEEN_AT | 0 | 1 | 2026-08-17 17:28:46 | 2026-08-17 17:28:46 |
| SNAPSHOT_COMPLETED_AT | 1 | 0 | NULL | NULL |
| UPDATED_AT | 0 | 1 | 2026-08-17 17:28:46 | 2026-08-17 17:28:46 |

| 规则检查 | 数量 |
|---|---|
| `SNAPSHOT_RUNNING` 且 `SNAPSHOT_COMPLETED_AT` 非空 | 0 |
| `SNAPSHOT_COMPLETED` 且 `SNAPSHOT_COMPLETED_AT` 为空 | 0（当前无 COMPLETED 记录） |
| `SNAPSHOT_COMPLETED_AT < SNAPSHOT_LAST_SEEN_AT` | 0 |
| `UPDATED_AT < SNAPSHOT_LAST_SEEN_AT` | 0 |
| `UPDATED_AT < SNAPSHOT_COMPLETED_AT` | 0 |

三个时间字段均为 `DATE`（长度 7，无精度/小数位）。唯一样例记录状态为 RUNNING，完成时间为 NULL，`SNAPSHOT_LAST_SEEN_AT = UPDATED_AT = 2026-08-17 17:28:46`。只能描述观察规律；**不得仅凭字段名将 `SNAPSHOT_LAST_SEEN_AT` 或 `UPDATED_AT` 推断为实时心跳**（业务已确认其不是 sync-client 在线状态依据）。

### 8.3 样例记录（唯一行，证据）

```
CLIENT_ID=hosp-012 | DATA_SOURCE_ID=112-source-19c | SNAPSHOT_STATUS=SNAPSHOT_RUNNING
SNAPSHOT_LAST_SEEN_AT=2026-08-17 17:28:46 | SNAPSHOT_COMPLETED_AT=NULL | UPDATED_AT=2026-08-17 17:28:46
```

---

## 9. 键、引用与异常数据核验

关联核验使用当前 `CDC_CLIENT_MULTIPLE`（当前 11 行）与 `CDC_DATA_SOURCE`（当前 29 行）作为参照，全部只读；不删、不改、不补任何 RUN_STATE 行。

| 检查项 | 结果 |
|---|---|
| 重复 `(CLIENT_ID, DATA_SOURCE_ID)` | 0（复合主键承载，DB 唯一性约束成立） |
| 同一 `DATA_SOURCE_ID` 对应多个不同 `CLIENT_ID` | 0（当前单行，不构成多客户端同源库样例） |
| `CLIENT_ID` 在 `CDC_CLIENT_MULTIPLE` 中找不到的孤立记录 | 0 |
| `DATA_SOURCE_ID` 在 `CDC_DATA_SOURCE` 中找不到的孤立记录 | 0 |
| 对应 `CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY` 非 SOURCE（UPPER 判定） | 0；匹配记录类别当前存为小写 `source`（F3） |
| 关联 `CDC_DATA_SOURCE.FG_ACTIVE` | 匹配记录 = `1`（启用） |
| 关联 `CDC_CLIENT_MULTIPLE.FG_ACTIVE` | 匹配记录 = `1`（启用） |
| ID 前后空白（LENGTH(TRIM)<>LENGTH） | CLIENT_ID 0 / DATA_SOURCE_ID 0 |
| ID 大小写异常/其他明显异常 | 未发现 |

- 关联核验未发现停用源库、停用探针或孤立引用；当前唯一组合同时映射到一个启用中的 SOURCE 类别源库与一个启用中的探针。

---

## 10. 当前代码、菜单、路由、占位页与 Feature 文档状态

| 检查项 | 结果 |
|---|---|
| 后端访问该表的 Entity / Mapper / Service / Controller / SQL | **无**。后端源码 grep `run_state/snapshot` 仅命中与故障监控 ZK 运行快照（`JobRuntimeSnapshot`、`JobRuntimeStatusReader`）及 server-config 的 `snapshotBatchSize` 配置项，与本表无关 |
| 前端真实查询 API | **无**。`frontend/src/api/` 中不存在针对该表的查询封装 |
| 当前页面形态 | **占位页**。`frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue` 渲染 `PlaceholderPage`，title“数据源运行状态”，info 仅声明只读/列表/表名 `CDC_DATA_SOURCE_RUN_STATE` |
| 路由 | `/monitor/data-source-state`（name `DataSourceRunState`，meta.title“数据源运行状态”，group“运行监控”） |
| 菜单（工作区当前版 menu.ts） | “运行监控”组含“数据源运行状态”→ `/monitor/data-source-state`（“数据源运行状态”菜单为任务开始前已存在项；menu.ts 属任务开始前用户既有修改，本任务未改动） |
| Feature 正式基线 | `docs/features/data-source-snapshot-status/` 目录存在但为空，**无** REQUIREMENTS/ACCEPTANCE/DESIGN 等正式基线 |
| Feature 总索引 | `docs/features/README.md` 以 `data-source-run-state`（数据源运行状态）登记为占位 / `BASELINE_NOT_ESTABLISHED`，尚未出现 `data-source-snapshot-status`（源库快照状态）条目 |

按任务边界：**本任务不创建、不修改任何业务代码、API、菜单、路由、占位页及 Feature 文档。**

---

## 11. 结果口径分类

| 类别 | 内容 |
|---|---|
| 项目负责人已确认的业务规则 | §3 历史资料/本项目业务事实（快照状态语义、sync-client 读写边界、页面只展示实际记录、约 100 条不分页、60s 刷新等）——来自任务提示词，**未在本任务中验证 sync-client 源码实现** |
| Oracle 数据字典直接核验的物理事实 | §5～§7、§8.1（结构）、§9 中“约束/索引/对象/字段”部分 |
| 当前数据样本观察 | §8（行数、状态分布、时间特征）、§8.3 样例、§9 引用核验结果 |
| 历史文档记录 | §12 所引 `table-*.md`、`confirmed-business-rules.md`、`data-characteristics.md` 等 2026-07-03 快照 |
| Agent 推断 / 仍待确认 | F1（RUNNING 记录长期未转 COMPLETED 是否符合 sync-client 预期，需在 sync-client 侧确认）；F3（类别大小写与目标“统一大写”的关系）；是否新增表/字段的物理设计决策不在本任务范围 |

---

## 12. 历史定义与当前数据库的逐项差异

对比 2026-07-03 历史快照（`table-list.md` / `table-detail.md` / `confirmed-business-rules.md` / `data-characteristics.md` / `table-relations.md` / `dictionary-candidates.md`）与本次数据库核验：

| 项目 | 历史（2026-07-03） | 当前数据库（2026-09-05） | 差异结论 |
|---|---|---|---|
| 表存在性/类型/Owner | CDC 下 TABLE | CDC 下 TABLE，VALID | 一致 |
| 表注释 | （无注释） | 空 | 一致 |
| 字段数/字段名 | 6 个同名字段 | 6 个同名字段、同顺序 | 一致 |
| CLIENT_ID / DATA_SOURCE_ID / SNAPSHOT_STATUS 长度 | VARCHAR2 64 / 64 / 32 | VARCHAR2 64 / 64 / 32，**CHAR 语义=BYTE** | 长度一致；本次补充确认 BYTE 语义（历史未记录） |
| 三个时间字段类型 | DATE | DATE（长度 7） | 一致 |
| 可空性 | CLIENT_ID/DATA_SOURCE_ID/SNAPSHOT_STATUS/UPDATED_AT 非空；两个完成/启动时间可空 | 同上（字典验证一致） | 一致 |
| 默认值 | 均无 | 均无 | 一致 |
| 复合主键 | PK_CDC_DS_RUN_STATE (CLIENT_ID, DATA_SOURCE_ID) | 同名同列，ENABLED VALIDATED | 一致（仍成立） |
| NOT NULL Check | SYS_C0041433～1436 | 同名同列 | 一致 |
| 索引 | 仅 PK 唯一索引 | 仅 PK 唯一索引，VALID | 一致 |
| 物理外键 | 无 | 无（表上无，也无引用本表） | 一致 |
| 记录数 / 状态 | 1 条，`SNAPSHOT_COMPLETED`（data-characteristics） | 1 条，`SNAPSHOT_RUNNING`，COMPLETED_AT 为 NULL | **数据内容不同**：同一开发库当前唯一记录为 RUNNING 且完成时间空；历史上该条为 COMPLETED。与“sync-client 在 RUNNING 时重跑快照”的业务事实相容（F1） |
| UPDATED_AT 最晚值 | 2026-07-02 | 2026-08-17 17:28:46 | 数据随时间变化（样例行更新于 08-17） |
| 表级别归属 | 旧 10 表白名单第 4 号，“使用中/当前程序只读” | SCHEMA.md §5.1“历史提及但当前生产代码未使用（待分析）”；当前代码确实无访问 | 口径演进一致：历史“使用中/只读”指业务定位，代码基线确认当前生产代码未访问 |
| SNAPSHOT_STATUS 字典候选 | SNAPSHOT_COMPLETED / SNAPSHOT_RUNNING（候选字典，未确认封闭） | 当前样本仅见 RUNNING；数据库无封闭 Check | 一致（候选状态未获 DB 封闭约束背书） |

---

## 13. 对后续 REQUIREMENTS / ACCEPTANCE / DESIGN 的事实输入

- 表物理事实（字段/主键/约束/索引）以 §5～§7 为准，可作为 Feature 数据库基线的事实起点。
- 该表是“探针端＋源库”组合的初始快照状态记录，每组合最多一条（复合主键约束）；页面“只展示实际存在记录、不补行、不分页”与当前单行数据规模一致。
- 当前开发库仅 1 条 RUNNING 记录，**不含 COMPLETED 样例**：REQUIREMENTS/ACCEPTANCE 的状态展示、自动刷新、列表样式等设计不能依赖“开发库存在 COMPLETED 样例”，且需要决定是否要求提供构造/补充 COMPLETED 场景的验证方式（属于后续 Feature 任务范围，不改变本表数据）。
- 状态取值集合无数据库封闭约束（F2）：需求与页面应按“未知状态值也可能出现”做宽容处理或明确规则，不能把数据库当作状态枚举的守护者。
- `UPDATED_AT` 不能作为在线/健康判据（已确认业务规则 9）；本表只反映初始快照阶段状态。
- 页面预期的“60 秒自动刷新＋立即刷新、不可见暂停、只刷新不写库”与“管理平台只读”规则下，无需新增任何后端写能力。
- Feature 用户可见名称“源库快照状态”与现有占位路由/菜单/Feature 索引所用“数据源运行状态 / data-source-run-state”名称不一致：后续 Feature 建立时应决定是否同步更名或明确命名映射（本任务不改动任何现有命名）。

---

## 14. 未执行 / 失败 / 阻断 / 无法确认项

| 项 | 说明 |
|---|---|
| sync-client 源码实现核验 | 不在本任务范围（任务仅核验数据库物理事实与数据特征），**未执行** |
| 数据库写操作 / DDL / 锁表 | **未执行**（严格只读） |
| ZooKeeper / 服务启停 / 外部写操作 | **未执行**（本任务不需要） |
| 后端/前端构建与测试 | **未运行**（只读数据库复核任务，见 §15） |
| “UPDATED_AT 停更近 19 天”是否属 sync-client 预期 | **无法确认**（需 sync-client 侧），记为 F1 观察 |

---

## 15. 数据库读写 / DDL / ZooKeeper / 服务与构建状态

| 类别 | 状态 |
|---|---|
| 数据库连接 | `READ_ONLY_SUCCESS`（全部只读 SELECT/数据字典） |
| 数据库写操作 | `NONE`（无 INSERT/UPDATE/DELETE/MERGE/DML） |
| DDL / 结构变更 | `NONE`（无 CREATE/ALTER/DROP/COMMENT 等） |
| 锁 / SELECT FOR UPDATE / 临时表 / PL/SQL 写 | `NONE` |
| ZooKeeper 访问 | `NONE`（未访问） |
| 服务启动/停止 | `NONE`（未启动服务） |
| 代码变更 | `NONE`（无业务代码/配置修改） |
| backend_tests | `NOT_RUN_NOT_APPLICABLE_READ_ONLY_DATABASE_VERIFICATION` |
| frontend_tests | `NOT_RUN_NOT_APPLICABLE_READ_ONLY_DATABASE_VERIFICATION` |
| backend_build | `NOT_RUN_NOT_APPLICABLE_READ_ONLY_DATABASE_VERIFICATION` |
| frontend_build | `NOT_RUN_NOT_APPLICABLE_READ_ONLY_DATABASE_VERIFICATION` |

---

## 16. 实际变更文件

| 文件 | 变更类型 |
|---|---|
| `docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md` | 新增（本报告，唯一授权新增文件） |

任务开始前已存在的用户工作区修改/未跟踪/删除文件均保持原样，未纳入任何变更。

---

## 17. Commit / Push 与 Push 后核验

| 项 | 值 |
|---|---|
| 任务开始前 Commit ID | `a9567f4c32af4c869a49a92ca6b3592f85782cb6` |
| 是否 Commit | 见本任务 Git 收口（§11-§12 授权流程），执行结果以最终控制台输出为准 |
| 是否 Push | 见最终控制台输出 |
| 核验方式 | `git diff --check`、`git diff -- <报告>`、Push 后核对本地 HEAD / `origin/develop` / `git ls-remote` / ahead-behind |

---

## 18. 复核 SQL 方法记录（只读）

复核基于 Oracle 数据字典 `ALL_OBJECTS` / `ALL_TAB_COMMENTS` / `ALL_TAB_COLUMNS` / `ALL_COL_COMMENTS` / `ALL_CONSTRAINTS` / `ALL_CONS_COLUMNS` / `ALL_INDEXES` / `ALL_IND_COLUMNS` / `ALL_TRIGGERS` / `ALL_DEPENDENCIES` 与业务表只读 `SELECT`（`COUNT`/`GROUP BY`/`MIN`/`MAX`/`LEFT JOIN` 存在性判定）。两次小查询（字段默认值 LONG 列函数包裹、单列 SELECT 后 ORDER BY 序号越界）首次报错后已用等价只读查询替代并成功，最终全部检查项完成，无残留失败查询。报告不含数据库密码及任何敏感业务原文。
