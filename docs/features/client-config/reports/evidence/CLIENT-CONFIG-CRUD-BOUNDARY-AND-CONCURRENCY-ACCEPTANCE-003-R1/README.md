# 证据索引（CRUD 边界与并发验收 003-R1 定向补证）

- 任务：`CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003-R1`
- 执行日期：2026-11-05
- 分支 / 基线：`develop` / `272196959dd1e402be9d68b4edccdab9e457d1a7`
- R1 报告：`../../CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003-R1.md`
- 本目录只含只读补证；R1 零业务写请求、零 DML/DDL/COMMIT。

## 1. 文件

| 文件 | 用途 |
|---|---|
| `raw/association-exact-ids.out` | 2026-11-05 14:22:25 精确 ID 关联查询结果（33 个客户端 ID） |
| `raw/metadata-structure.out` | 2026-11-05 14:22:35 当前完整元数据（列/约束/索引/外键/触发器/相关表/计数） |
| `raw/metadata-pre-1325.out` | 2026-11-05 13:25 原执行前元数据（索引、索引列、触发器、外键；列/约束因 LONG 报错） |
| `raw/metadata-pre-1326.out` | 2026-11-05 13:26 原执行前列与命名约束 |
| `raw/metadata-post-1336.out` | 2026-11-05 13:36 原执行后列与命名约束（与 13:26 逐字节相同） |
| `raw/check-conditions-1326.out` | 2026-11-05 13:26 正确处理的 NOT NULL 条件（10 条） |
| `raw/constraint-index-map.out` | 约束—索引映射（PK 支撑索引） |
| `raw/index-object-times.out` | 索引对象创建/最后 DDL 时间 |
| `raw/stats-rows.out` | 统计表行数与维度类型（无维度行） |
| `raw/jar-bytecode-refs.txt` | 运行 jar 字节码引用核对（命令、方法引用、禁用词扫描） |
| `raw/zk-current.txt` | 2026-11-05 14:22:38 当前只读 ZK `ls`（主机与节点已匿名化） |
| `sql/*.sql` | 上述只读查询所用 SQL |
| `SHA256SUMS` | 本目录文件校验和 |

## 2. 取证时间、来源与命令

| 时间 | 来源 | 内容 |
|---|---|---|
| 2026-11-05 13:25 | 003 原执行留存 `/tmp/s3ac/snap/schema-metadata.txt` | 夹具/CRUD 前：索引 6 个、索引列 7 行、触发器空、外键空、计数 61/235 |
| 2026-11-05 13:26 | 003 原执行留存 `schema-metadata2.txt`、`check-conditions.txt` | 列 4+17、2 主键 + 10 NOT NULL、FK 分节空 |
| 2026-11-05 13:36 | 003 原执行留存 `schema-metadata2-post.txt` | 与 13:26 逐字节相同（2213 字节） |
| 2026-11-05 14:22:25 | R1 只读 `sql/association-r1.sql` | 精确 ID 关联计数 |
| 2026-11-05 14:22:35 | R1 只读 `sql/metadata-r1.sql` | 当前完整元数据 |
| 2026-11-05 14:22:37 | R1 只读 `sql/followup.sql`、`sql/followup2.sql` | 约束—索引映射、对象时间 |
| 2026-11-05 14:22:38 | R1 只读 ZK `ls /bsoft-cdc/clients` | `[zk-client-01]` |
| 2026-11-05 14:36:49 | R1 只读 `sql/stats-r1b.sql` | 统计表行数（见 `raw/stats-rows.out` 的 SESSION 行） |

连接方式均为项目既有 Oracle 开发库（Schema `CDC`）与只读 ZK 客户端；本目录不写凭据。

## 3. 关键核对结果

### 3.1 关联（精确 ID，2026-11-05 14:22:25）

- ID 集合：全部 S3AC 批次、`c-dssr1-0906-a`、`c-dssr1-0906-b`、`S3AC-C038-RENAMED`、`probe-001`、`race-001`、`RACE-001`，共 33 个客户端 ID；另按 DATA_SOURCE_ID 核对对应源 ID。
- `CDC_JOB_FAILURE_EVENT`、`CDC_JOB_FAILURE_HANDLE_LOG`、`CDC_DATA_SOURCE_SCN`、`CDC_EXECUTION_PLAN`：按 CLIENT_ID、DATA_SOURCE_ID、FROM/TO 的精确匹配均为 0。
- `CDC_DATA_SOURCE_RUN_STATE`：精确命中 9 行（`c-dssr1-0906-a`=5、`c-dssr1-0906-b`=4；改名后新 ID 0）；表总数 30，其中 c-dssr1 前缀 29 行。
- 零行只证明相应谓词在 2026-11-05 14:22:25 的结果，不回填历史前像。

### 3.2 元数据（Schema `CDC`）

- 列：`CDC_CLIENT_MULTIPLE` 4 列、`CDC_DATA_SOURCE` 17 列；13:26 与 13:36 导出逐字节相同。
- 约束：2 主键 + 10 NOT NULL；`SEARCH_CONDITION_VC` 显示条件均为 `"列" IS NOT NULL`。
- 索引（6 个，13:25 与 14:22 一致）：`PK_CDC_CLIENT_MULTIPLE`（UNIQUE，CLIENT_ID）、`PK_CDC_DATA_SOURCE`（UNIQUE，DATA_SOURCE_ID，独立唯一索引）、`IDX_CDC_DATA_SOURCE_ID_ACTIVE`（NONUNIQUE，DATA_SOURCE_ID+FG_ACTIVE；约束 `PK_CDC_DATA_SOURCE` 的支撑索引）、`IDX_CDC_DATA_SOURCE_NAME`、`IDX_CDC_LOG_CORRECT_ORG`、`IDX_CDS_ACTIVE`。
- 外键：13:25 与 14:22 均为空；schema 级 `ALL_FK_IN_SCHEMA=0`。
- 触发器：13:25 与 14:22 均为空。
- 相关表创建时间：`CDC_CLIENT`/两目标表/`CDC_DATA_SOURCE_EXTEND`/`CDC_DATA_SOURCE_RUN_STATE`/`CDC_DATA_SOURCE_SCN` 为 2026-10-22；`CDC_CLIENT_MULTIPLE_2026_11_04` 为 2026-11-04 09:59:04；两目标表 `LAST_DDL_TIME` 为 2026-10-22 16:53:22。
- 统计表：6 个对象均无 `CLIENT_ID`/`DATA_SOURCE_ID` 列；结果表与 WATERMARK 0 行、TASK_CONFIG 1 行。

### 3.3 辅助查询报错与替代（保留原始输出）

- `raw/constraint-index-map.out` 末段 `INDEX_DEFS` 与 `raw/index-object-times.out` 末段 `INDEX_COLS_FINAL` 分别因 `USER_INDEXES.CREATED` 与 `USER_IND_COLUMNS.UNIQUENESS` 不存在而返回 `ORA-00904`；报错文本与退出状态保留在原文件，不作为结果。
- 对应成功替代：索引定义与索引列以 `raw/metadata-structure.out` 的 `INDEXES`/`INDEX_COLUMNS`/`INDEX_TO_CONSTRAINT` 分节为准；索引对象时间以 `raw/index-object-times.out` 的 `INDEX_OBJECT_TIMES` 分节（源自 `USER_OBJECTS`）为准。
- 原始输出保留采集时尾部空行，`git diff --check` 会对上述两份 raw 文件报告 `new blank line at EOF`；属输出保真，不改写。

## 4. 边界

- 本目录为只读补证；未重跑 CRUD、并发或夹具，未清理/恢复数据，未改产品代码或配置，未构建、未启停服务、未操作运行侧进程。
- ZK 当前读数只代表 2026-11-05 14:22:38 的子节点名列表；003 的两次读数均在主 CRUD 之后，非 CRUD 前快照。
- 当前快照不单独证明历史未变化；“验收期间未变化”由 13:25/13:26 与 13:36 的真实前后导出及早于验收日的 `LAST_DDL_TIME` 共同支持。
