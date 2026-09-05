# 源库快照状态 Feature 数据库查询设计草案（DATABASE）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态 |
| Feature 标识 | `data-source-snapshot-status` |
| 所属模块 | 运行监控 |
| 目标文档 | `docs/features/data-source-snapshot-status/DATABASE.md`（数据库查询设计草案） |
| 配套设计文档 | `DESIGN.md`（总设计入口）、`API.md`（接口设计草案）、`UI.md`（界面设计草案） |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（设计草案，尚未批准） |
| requirements_status | `APPROVED`（`DSS-REQ-001~065` 共 65 条） |
| acceptance_status | `APPROVED`（`DSS-AC-001~068` 共 68 条，全部 `NOT_RUN`） |
| design_status | `DRAFT_PENDING_USER_REVIEW`（本文件与 DESIGN.md / API.md / UI.md 均为草案，未批准） |
| implementation_status | `NOT_STARTED`（本设计不编码；当前后端无 RUN_STATE 访问链路，见 DESIGN §3） |
| acceptance_execution_status | `NOT_RUN`（本设计不执行验收；68 条 `DSS-AC-*` 全部保持 `NOT_RUN`） |
| pending_user_confirmation_count | `0`（与 DESIGN.md §15.2 一致） |
| 设计任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001` |
| 创建日期 | 2026-09-05 |

## 2. 事实依据与本任务数据库边界

- **本文件是 Feature 查询设计，不是重新执行数据库复核。** 本任务**未连接数据库、未执行任何 SELECT/DML/DDL**；所有 `CDC_DATA_SOURCE_RUN_STATE` 物理事实一律以已提交只读复核报告为权威依据：

  ```text
  docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md
  ```

- 复核报告为 `PASS_WITH_FINDINGS`（2026-09-05）：对象/6 字段/约束/索引/数据特征均只读核验；F1~F5 为事实性观察。下文 §3/§11 引用其结论，**不复制数据库凭据、不输出连接串、不声称本任务重新验证了实时数据**。
- 数据对象归属：`CDC_DATA_SOURCE_RUN_STATE` 当前不在已批准 16 张单表物理基线内（复核报告 §5 归属口径），本 Feature 仅将其作为**只读监控查询对象**引入；本设计不提出任何 DDL、不加字段、不加索引、不改表。
- 本 Feature 只允许以下只读数据访问（DSS-REQ-015，DESIGN §11）：主表 `CDC_DATA_SOURCE_RUN_STATE`（驱动），只读关联 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`（仅补充展示与关联异常判断）。**不访问任何其他业务表。**

## 3. 涉及三张表的字段、类型、可空性、主键/关联键与用途

### 3.1 `CDC_DATA_SOURCE_RUN_STATE`（驱动主表，六字段，全量读取）

复核报告 §6 六字段（Oracle CDC Schema，普通表 VALID；`VARCHAR2` 为 BYTE 语义；复合主键 `PK_CDC_DS_RUN_STATE(CLIENT_ID, DATA_SOURCE_ID)`；非空 4 字段；无外键/触发器/状态封闭 Check）：

| 字段 | 类型 | 长度/CHAR | 可空 | 本设计用途 |
|---|---|---|---|---|
| `CLIENT_ID` | VARCHAR2 | 64 BYTE | N | 探针端原始 ID；展示、过滤、候选去重键、行键之一 |
| `DATA_SOURCE_ID` | VARCHAR2 | 64 BYTE | N | 源库原始 ID；展示、过滤、候选去重键、行键之一 |
| `SNAPSHOT_STATUS` | VARCHAR2 | 32 BYTE | N | 原始状态值；`classify` 输入；过滤/展示/候选共用（§5） |
| `SNAPSHOT_LAST_SEEN_AT` | DATE | 7 | Y | “快照启动时间”；可空→TO_CHAR 后可能为 null（§9） |
| `SNAPSHOT_COMPLETED_AT` | DATE | 7 | Y | “快照完成时间”；可空→null（§9） |
| `UPDATED_AT` | DATE | 7 | N | “记录更新时间”；排序键（§8）；**不作健康判据** |

- 语义：每行 = 一个“探针端（`CLIENT_ID`）＋源库（`DATA_SOURCE_ID`）”组合的初始快照状态记录（复合主键约束每组合最多一条）（DSS-REQ-006，AC-006/064；复核报告 §13）。
- 状态取值：已确认两个已知值 `SNAPSHOT_RUNNING`/`SNAPSHOT_COMPLETED`；但**数据库层只有 4 条 NOT NULL Check（SYS_C0041433~1436），无对状态取值的封闭 Check**（复核报告 F2、§7.1）——必须宽容未知值（DSS-REQ-037，AC-034）。

### 3.2 `CDC_CLIENT_MULTIPLE`（只读关联，仅以下必要安全投影）

| 字段 | 用途 |
|---|---|
| `CLIENT_ID` | 关联键（= RUN_STATE.CLIENT_ID） |
| `CLIENT_DESC` | 探针端描述（展示补充，可为 null） |
| `FG_ACTIVE` | 启用标志（`'1'`=启用；非 `'1'` 视为停用，见 §12） |

### 3.3 `CDC_DATA_SOURCE`（只读关联，仅以下必要安全投影，**绝不读 `DATA_SOURCE_PASSWORD`**）

| 字段 | 用途 |
|---|---|
| `DATA_SOURCE_ID` | 关联键（= RUN_STATE.DATA_SOURCE_ID） |
| `DATA_SOURCE_ORG` | 源库 ORG（展示，可为 null） |
| `DATA_SOURCE_CATEGORY` | 类别（`SOURCE`/其它；trim+upper 归一，见 §12；当前存小写 `source`，复核报告 F3） |
| `FG_ACTIVE` | 启用标志（`'1'`=启用） |

- 本设计**不读取任何密码/凭据/连接串类字段**；`CDC_DATA_SOURCE` 列清单中不存在、也绝不出现 `DATA_SOURCE_PASSWORD`（DSS-REQ-015、DESIGN §11、API §2，AC-010）。`DATA_SOURCE_CATEGORY` 归一在服务层做（DESIGN §5.6），数据库层不判断。

## 4. 主表驱动只读关联设计与保行证明

### 4.1 结论：三条独立全量只读 SELECT ＋ 服务层内存关联（等价保行 LEFT JOIN）

不写多表 `LEFT JOIN` SQL，而是**三次全量只读 + 服务层建索引关联**（DESIGN §5.1“全量读取→服务层处理”，topic-offset 同骨架），在结果上等价于以 RUN_STATE 为驱动的 LEFT JOIN，且保行性可显式证明：

- `DataSourceRunStateMapper.selectAll()`：固定只读 `@Select`，读取 RUN_STATE **全部行（无 WHERE）**——这是驱动数据集；
- `RunStateClientMapper.selectAll()`：读取 `CDC_CLIENT_MULTIPLE` 投影，服务层建 `CLIENT_ID → 行` 索引（`putIfAbsent`）；
- `RunStateDataSourceMapper.selectAll()`：读取 `CDC_DATA_SOURCE` 投影（无 PASSWORD），建 `DATA_SOURCE_ID → 行` 索引。

服务层对**每一条 RUN_STATE 行**做关联查找：命中则补充展示信息，未命中则该行的 `clientRef/sourceRef.state=NOT_FOUND`（DESIGN §5.6），**行必然保留**。

### 4.2 保行证明（为何不用 INNER JOIN/WHERE 过滤 RUN_STATE）

- 展示行集合恒 = `selectAll()` 的 RUN_STATE **全量行**；关联表查找结果**只补充字段、从不裁剪行**（DESIGN §6/§10）。
- 等价 LEFT JOIN 形式：`RUN_STATE LEFT JOIN CLIENT_MULTIPLE … LEFT JOIN DATA_SOURCE …`（无 WHERE 条件削行）；任一侧关联缺失时另一侧为 NULL，行保留。
- **禁止**：以 `INNER JOIN`、或在 SQL `WHERE` 中对关联表列加条件的方式书写（会把孤立 RUN_STATE 行滤掉，违反 DSS-REQ-015/019，AC-013/017）。本设计用“驱动全量读 + 内存关联”从结构上杜绝该风险。
- 不补行：无 RUN_STATE 记录的“探针端＋源库”组合不进入结果，绝不用两张配置表补出缺失行（DSS-REQ-016/017，AC-014/015）。

## 5. 状态分类逻辑（RUNNING / COMPLETED / UNKNOWN）

- 分类在**服务层 `classify(String raw)`**（DESIGN §5.5），统一用于展示/过滤/候选，三处共享同一函数保证语义一致：

| `SNAPSHOT_STATUS` 原始值 | `statusCategory` |
|---|---|
| `SNAPSHOT_RUNNING` | `RUNNING` |
| `SNAPSHOT_COMPLETED` | `COMPLETED` |
| 其它任意值 | `UNKNOWN` |

- 数据库层**不存在对状态取值的封闭 Check**（复核报告 F2/§7.1）；`SNAPSHOT_STATUS` 为 NOT NULL，因此无 NULL 分支（若出现 NULL——非约束事实外的不可能情形——宽容按 `UNKNOWN` 处理亦可，但正常不触发）。
- 分类是**只读推导**：不改写原值、不写库、不对任何状态判失败；未知值行保留并展示原始值（DSS-REQ-037/038/039，AC-034/035/037）。开发库当前仅 1 条 RUNNING 样例（复核报告 F1、§12），COMPLETED/未知场景需按 §13 受控构造（REQ-040，AC-036/065）。

## 6. 查询候选的全量来源、去重键、排序与当前筛选无关

- 候选由当次请求读取的 **RUN_STATE 全量行**（过滤之前）派生（DESIGN §6.1），**与当前筛选条件无关**：因为候选在过滤前计算，不会出现“筛到某状态后其它探针/源库候选消失”的收窄（DSS-REQ-024，AC-022）。
- 去重键与排序（服务层）：

| 候选 | 去重键 | 排序 |
|---|---|---|
| 探针端候选 | `CLIENT_ID`（一个探针可对应多源库） | `clientId` 升序 |
| 源库候选 | `DATA_SOURCE_ID`（一个源库可被多探针引用） | `org`（空值后置）→ `dataSourceId` 升序 |
| 状态候选 | —（枚举） | 恒 `[RUNNING, COMPLETED]`，仅在全量行存在未知状态时追加 `UNKNOWN` 在后 |

- 每项补充展示：探针端=配置 `CLIENT_DESC`/启停；源库=ORG/启停；均为展示补充、不改变候选集合（候选集合只看 RUN_STATE 是否出现该 ID）。

## 7. 多选过滤语义、参数安全与“全部”规则

- **过滤在服务层 Java 完成，无动态 SQL、无字符串拼接 SQL**：Mapper 恒为参数无关的固定只读 `SELECT`（§4.1），注入面从结构上为零（DESIGN §5.1、API §4，AC-023）。
- 语义（DESIGN §5.3）：每一维（`clientId`/`sourceId`/`status`）多值集合，命中任一为 OR、跨维为 AND；集合为空（=“全部”）不过滤；`status` token 命中判据复用 §5 `classify`（`UNKNOWN` 命中=非两已知原值）。
- 绑定参数方案：由于全量读取，无需把集合绑定进 SQL WHERE；若未来（规模变更时，见 §11）需要在 SQL 层下推，**必须使用 `#{}`/`<foreach>` 绑定参数**，禁止任何字符串拼接（本项目既有 MyBatis 动态 SQL 亦遵循该安全约束；本设计当前不采用）。
- 空集合/“全部”规则：参数缺失或归一为空 ⇒ 该维不筛选；“全部”不以哨兵值落库/落网（API §4.1）。
- 过滤只作用于 RUN_STATE 原始行；关联缺失/停用/类别异常的行**不会被过滤掉**（DSS-REQ-025，AC-023）。

## 8. 固定排序设计及 NULL 处理

- 排序在**服务层**完成（DESIGN §5.4）；`UPDATED_AT` 由 SQL `TO_CHAR` 输出固定宽度字符串 `YYYY-MM-DD HH24:MI:SS`，其字典序即时间序（无需解析日期）。
- 规则（DSS-REQ-046/047/048，AC-043/044/045）：
  1. 状态组排序键：`RUNNING=0`、`UNKNOWN=1`、`COMPLETED=2`（先运行中，再未知，后已完成）；
  2. 组内 `updatedAt` **倒序**；
  3. `updatedAt` 并列时 `clientId` 升序、再 `dataSourceId` 升序 → 全序确定可复现。
- NULL 处理：`UPDATED_AT` 非空，组内排序无 NULL 分支；为稳妥，Java 比较器对 null `updatedAt` 一律按“最小”处理并置于组内末尾（防御，正常不触发，DSS-REQ-033）。源库候选按 `org` 排序时空值（null）后置（§6）。

## 9. 三个 DATE 字段的读取与 API 格式化边界

- Mapper 用 Oracle `TO_CHAR(col,'YYYY-MM-DD HH24:MI:SS')` 把三个 DATE 字段**在 SQL 层确定性字符串化**（topic-offset 已验证做法，DESIGN §3.2/§5.7）；Java 层以 `String` 承载并**只透传、不重排**，避免 JVM 时区二次转换（DSS-REQ-055，AC-052）。
- `DATE` 本身无时区；显式格式串固定输出格式，展示文本即 `YYYY-MM-DD HH:mm:ss`。前端展示即为该文本，不再格式化成别的时区（API §2/§6，UI §4.5）。
- 可空两列：`SNAPSHOT_LAST_SEEN_AT`/`SNAPSHOT_COMPLETED_AT` 数据库 NULL ⇒ `TO_CHAR` 结果 NULL ⇒ Java `null` ⇒ JSON **显式 null**（`@JsonInclude(ALWAYS)`）⇒ UI `--`（DSS-REQ-031/032/055，AC-029/052）。
- **健康推断禁令**：任何一层不得依据 `UPDATED_AT` 或其它时间字段推断 sync-client 在线/健康/超时/离线；`SNAPSHOT_COMPLETED` 后记录通常不再更新，`UPDATED_AT` 停更是正常（DSS-REQ-010/056/057，AC-009/053/054；复核报告 F5）。长时间 RUNNING 行不因时长判错（AC-054）。

## 10. 只读 Mapper 的显式列清单（禁 `SELECT *`、禁读密码）

- 三个 Mapper 均为**纯注解 `@Select`、不继承 `BaseMapper`、无任何写方法**（天然无内置 CRUD），只暴露只读方法（DESIGN §4.2/§11，AC-010/049）。
- 显式列清单（设计建议 SQL，**待实现阶段**；本任务不创建代码）：

```sql
-- DataSourceRunStateMapper.selectAll()（无 WHERE，全量，驱动集）
SELECT CLIENT_ID                       AS clientId,
       DATA_SOURCE_ID                  AS dataSourceId,
       SNAPSHOT_STATUS                 AS snapshotStatus,
       TO_CHAR(SNAPSHOT_LAST_SEEN_AT, 'YYYY-MM-DD HH24:MI:SS')    AS snapshotLastSeenAt,
       TO_CHAR(SNAPSHOT_COMPLETED_AT, 'YYYY-MM-DD HH24:MI:SS')    AS snapshotCompletedAt,
       TO_CHAR(UPDATED_AT, 'YYYY-MM-DD HH24:MI:SS')               AS updatedAt
FROM CDC_DATA_SOURCE_RUN_STATE

-- RunStateClientMapper.selectAll()（仅必要投影）
SELECT CLIENT_ID     AS clientId,
       CLIENT_DESC   AS clientDesc,
       FG_ACTIVE     AS fgActive
FROM CDC_CLIENT_MULTIPLE

-- RunStateDataSourceMapper.selectAll()（仅必要安全投影；不含任何密码列）
SELECT DATA_SOURCE_ID        AS dataSourceId,
       DATA_SOURCE_ORG       AS dataSourceOrg,
       DATA_SOURCE_CATEGORY  AS dataSourceCategory,
       FG_ACTIVE             AS fgActive
FROM CDC_DATA_SOURCE
```

- 禁止 `SELECT *`；`RunStateDataSourceMapper` 列清单**绝不包含** `DATA_SOURCE_PASSWORD`（DSS-REQ-015，AC-010，DESIGN §11）。Row 映射模型（`DataSourceRunStateRow`/`RunStateClientRow`/`RunStateDataSourceRow`）仅含上述列（DESIGN §4.2）。

## 11. 性能判断：约 100 行、不分页，无需新增索引

- 规模假设：生产最多约 100 条记录，一次全量加载、不分页（DSS-REQ-020/021，AC-018；复核报告当前开发库仅 1 行）。
- 全表扫描成本对 ≤ ~100 行可忽略：一次 `selectAll()` 全量读 + 内存过滤/排序即为最优简单方案（DESIGN §5.1/§13）。
- **结论：无需新增索引，本设计不提出任何 DDL**（包括 `CREATE/ALTER/DROP/COMMENT`）。现有唯一索引 `PK_CDC_DS_RUN_STATE(CLIENT_ID, DATA_SOURCE_ID)` 已满足唯一与全量读场景（复核报告 §7.2）。
- 若未来规模假设被突破（千行级以上），应先重新评审设计（DESIGN §13），**未经授权不得自行改表或加索引**（DSS-REQ-065 ⑥ 禁 DDL 精神同样适用于产品只读侧）。

## 12. 数据现状、异常兼容与脱敏日志边界

- 当前数据样本（复核报告 F1/F3/§8）：仅 1 条 `SNAPSHOT_RUNNING`（`hosp-012`+`112-source-19c`），`SNAPSHOT_COMPLETED_AT` 为 NULL，无 COMPLETED 天然样例，无未知值样例；关联均启用、无孤立记录；源库类别当前存小写 `source`。**这些是观察事实，不是数据库强约束**（REQ-040，AC-036）。
- 宽容处理（不改行、不抛错、不丢行，DESIGN §10/§5.6）：
  - 未知 `SNAPSHOT_STATUS` → `UNKNOWN`，行保留；
  - 关联 `FG_ACTIVE` 非 `'1'`（含 `'0'` 或异常值）→ 视为停用（`state=INACTIVE`）；对“非 `'1'` 亦非 `'0'`”的畸形值同样宽容为停用；
  - `DATA_SOURCE_CATEGORY`：服务层 `trim().toUpperCase()` 后等于 `SOURCE` 视为正常源库；等于 `TARGET`、空/畸形或其它值 ⇒ `sourceRole=false` 并加“类别非 SOURCE”轻提示，**行保留**（DSS-REQ-044，AC-041）；当前小写 `source` 经归一后正常（F3）。
  - `CLIENT_ID`/`DATA_SOURCE_ID` 按原始值精确匹配（去空白不做、大小写不改），与数据库 BYTE 语义一致；候选去重同键。
- 脱敏日志边界：查询日志不得输出行明细、密码或无关敏感字段；失败信息与日志只含收敛、脱敏内容（DSS-REQ-064，AC-062）；错误响应经 API §8 脱敏。

## 13. 产品只读契约与未来测试 DML 授权严格分离

1. **产品代码永远只读**：最终交付的 `cdc-config` 对 `CDC_DATA_SOURCE_RUN_STATE` 只执行 `SELECT`；本设计/实现不含、也不得含对该表或两张关联表的 `INSERT/UPDATE/DELETE/MERGE`，以及任何 DDL（DSS-REQ-011/012/013，AC-010/012；DESIGN §11）。
2. **未来测试 DML 授权的边界（`DSS-REQ-065`，AC-063/065）**：仅当**后续**测试/验收任务的提示词显式纳入该授权时，Agent 才可对**开发库** `CDC_DATA_SOURCE_RUN_STATE` 执行受控 `INSERT/UPDATE/DELETE` 用于构造场景（如 COMPLETED、未知状态、孤立探针/源库），并满足：操作前完整备份原始数据、操作后恢复到任务开始前状态且逐行一致核验、报告记录目的/范围/备份/恢复证据；**不授权** `TRUNCATE/ALTER/DROP` 或其它 DDL、**不授权**操作 `CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 或其它表、**不授权**生产库。
3. **本设计任务没有该 DML 授权**：本任务未连接数据库、未执行任何 SELECT/DML/DDL；§13.2 只是为后续测试任务预置的授权边界记录，不是本任务的执行授权。
4. 复核报告中“测试数据构造不改变两张关联表、引用既有只读关联配置”的约束同步适用（复核报告 §13/ACCEPTANCE §4.16，AC-065）。

## 14. 数据库设计与需求/验收映射

| 本文件设计要素 | 主要承担需求 | 主要承担验收 |
|---|---|---|
| §3 三表字段/键/可空性/安全投影（含禁读密码） | REQ-006/015/044 | AC-006/010/041/064 |
| §4 主表驱动只读关联与保行、不补行 | REQ-014/015/016/017/019 | AC-013/014/015/017 |
| §5 状态分类（宽容未知、无封闭 Check） | REQ-035/036/037 | AC-032/033/034/035/037 |
| §6 候选全量来源/去重/与筛选无关 | REQ-016/024 | AC-022 |
| §7 过滤语义与“全部”、无动态 SQL 拼接 | REQ-025 | AC-023 |
| §8 固定确定性排序与 NULL 规则 | REQ-046/047/048 | AC-043/044/045 |
| §9 DATE 读取 TO_CHAR 透传、时区边界、不推断健康 | REQ-010/055/056/057 | AC-009/030/052/053/054 |
| §10 只读 Mapper 显式列、禁 SELECT */禁读密码 | REQ-011/013 | AC-010/049 |
| §11 约 100 行不分页、无需索引、禁 DDL | REQ-020/021 | AC-018 |
| §12 数据现状与异常宽容、脱敏日志 | REQ-040/044/064 | AC-036/041/062 |
| §13 产品只读 vs 测试 DML 授权分离 | REQ-011/065 | AC-010/012/063/065 |

> 一致性：本文件与 DESIGN.md/API.md/UI.md 统一使用接口 `GET /api/monitor/data-source-run-state/list`、字段/枚举/原始值、时间格式与显式 null、映射状态、错误码与刷新状态机（DESIGN §14.1）。本文件不输出数据库凭据、不声称重新验证实时数据；待确认设计项为 0。
