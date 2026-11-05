# 探针端管理 CRUD 边界与并发验收 R1：定向补证、证据勘误与脱敏

- 任务编号：`CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003-R1`
- 执行日期：2026-11-05
- 分支：`develop`
- 基线：`272196959dd1e402be9d68b4edccdab9e457d1a7`
- 原 003 复审区间：`e0b0048ce530c46c397917dd8bbce8b6b59fabe7..272196959dd1e402be9d68b4edccdab9e457d1a7`（结论 `CHANGES_REQUIRED`）
- R1 报告与证据：本文件；`evidence/CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003-R1/`
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_CRUD_BOUNDARY_AND_CONCURRENCY_ACCEPTANCE_003_R1_REVIEW`

## 1. 结论摘要

| AC | 原状态 | R1 结论 | 核心依据 |
|---|---|---|---|
| `CCFG-AC-075` | `PASS` | **`PASS`（维持）** | 固定源码与运行 jar 字节码无级联调用路径；精确 ID 关联在当前时点无匹配；统计表无关联键；未观测范围已单列 |
| `CCFG-AC-076` | `PASS` | **`PASS`（维持）** | 原 `CHECK_CONDITIONS` 报错保留为历史事实；补齐列/约束/索引（含独立唯一索引）/外键/触发器/相关表核对；历史不变由真实前后导出与早于验收日的 `LAST_DDL_TIME` 支持 |

- `changed_ids`：`[]`（两项状态 token 未变）。
- 四态统计：`PASS 135 / FAIL 0 / BLOCKED 22 / NOT_RUN 0 = 157`；157 个 AC ID 唯一且连续（1–157）。
- R1 业务写请求 **0**；夹具 DML **0**；DDL **0**；COMMIT **0**。
- 本批 R1 为只读补证与文档修订；**R1 提交不代表远端复审通过，也不代表 Feature 正式接受或页面迁移授权**。

## 2. 逐问题旧 → 新

| # | 原问题 | R1 处理 |
|---|---|---|
| 1 | AC-075 仅以关键字 grep 无命中代替路径检查 | 逐层列明 Controller 7 个端点 → Service 方法 → Mapper/SQL；核对运行 jar 字节码引用；注明源码与 jar 来源及边界 |
| 2 | AC-075 声称“本批所有探针 ID”，但 `association-postcheck.txt` 仅 `S3AC%`/`c-dssr1-%` | 更正为“S3AC 与 c-dssr1 前缀范围”，并补 33 个精确 ID 的只读查询（含 `probe-001`/`race-001`/`RACE-001`） |
| 3 | AC-075 把 ZK 两次读数当 CRUD 前后 | 标注两次均在主 CRUD 之后（并发窗口前/后）；仅证明子节点名列表相同，不扩大到节点内容；无 CRUD 前快照。同一观察也支撑 AC-021/024/038 的运行侧口径；已将 AC-021/024 的“ZK 不变”改为两次子节点名观察的精确表述（AC-038 原文已注明并发窗口前观察），并注明删除/启停/改名不触达 ZK 由固定源码路径支持 |
| 4 | AC-075 统计表未定位、以 SCN/执行计划代替 | 定位 6 个统计对象：均无 `CLIENT_ID`/`DATA_SOURCE_ID`，仅 `DIM_TYPE/DIM_VALUE`；结果表与 WATERMARK 0 行、TASK_CONFIG 1 行；不做全库扫描 |
| 5 | AC-075 以“可验证范围内 PASS”替代整项判定 | 分开列示源码证明、003 运行证据、R1 当前观察、未观测范围；整项判 `PASS`，未观测部分如实单列 |
| 6 | AC-076 原 `CHECK_CONDITIONS` 把 LONG 拼接而报 `ORA-00932` | 保留错误输出与退出码为历史事实；用 `SEARCH_CONDITION_VC` 只读重取（10 条 `IS NOT NULL`） |
| 7 | AC-076 原查询未覆盖独立唯一索引 | 补齐 6 个索引及索引列，识别独立唯一索引 `PK_CDC_DATA_SOURCE` 与 PK 支撑索引 `IDX_CDC_DATA_SOURCE_ID_ACTIVE`；13:25 前后一致 |
| 8 | AC-076 仅凭“前后文本一致” | 明确前后证据的时间与命令；补外键/触发器/相关表；以 `LAST_DDL_TIME`（2026-10-22）覆盖“验收日未变化”，当前快照不单独承担历史证明 |
| 9 | AC-021 未写清删除后清选的证据来源 | 引用前序 `group-f-results.json` 的 `ac145.b5`（提交 `242cc5c`），注明复用范围，不表述为 003 当场观察 |
| 10 | AC-064 引用未提交的 `results/concurrency-postcheck.txt` | 补入原执行 13:40 留存真实输出（SHA256 `4c8b90…0e23`）；未重跑、未改写 |
| 11 | AC-064 “列表显示”混淆 API 返回与浏览器渲染 | 更正为“列表 API 返回含异常字段”；未另行采集渲染截图，不作扩大表述 |
| 12 | 夹具台账“52 条含 COMMIT” | 更正为 52 DML（47 INSERT + 5 UPDATE）+ 3 COMMIT = 55 条 DML/事务控制语句 |
| 13 | 003 证据含真实机构名、内网地址、真实标识与 ZK 主机/节点 | 确定性假名替换；ZK 主机/节点匿名化；合成样本保留；未入仓映射表或原始快照 |

## 3. `CCFG-AC-075` 分支证据与结论

### 3.1 源码与运行 jar（证明分支）

- 控制器 `ClientConfigController`：E1 `GET /api/clients`→`list`；E2 `GET /data-source-options`→`dataSourceOptions`；E3 `POST /api/clients`→`create`；E4 `PUT /{originalClientId}`→`update`；E5 `DELETE /{clientId}`→`delete`；E6 `PUT /{clientId}/enable`→`enable`；E7 `PUT /{clientId}/disable`→`disable`。全部直接委托 Service，无旁路。
- 服务 `ClientConfigServiceImpl`：`list`/`dataSourceOptions`/`create`/`update` 调用 `CdcClientConfigMapper.selectByKeywordAndStatus|selectFullScan|insert|update` 与 `CdcDataSourceMapper.selectSafeAll`；`delete` 仅 `deleteById`；`enable` 为全量预读 + `update`；`disable` 仅 `update`。5 处 `@Transactional(rollbackFor=Exception.class)`，无显式 `LOCK TABLE`。
- Mapper/SQL 仅触达 `CDC_CLIENT_MULTIPLE`（读/写）与 `CDC_DATA_SOURCE`（只读安全列），无第三张表、存储过程、DDL 或外部调用。
- 来源与边界：功能源码最后变更 `84d3cdcf`（2026-09-05）；运行 jar SHA256 `efdbea827b6ab84dd47105d2cc130f0bc3c5b70dc78cc626b6421e1f9750a459`（2026-09-22 12:21）。从运行 jar 提取的 Service/Controller 字节码仅引用上述 7 个 Service 方法与 6 个 Mapper 方法及同包 VO/DTO/工具类；禁用词扫描（ZK/Kafka/进程/统计表/失败事件/SCN/执行计划）为 0。边界：未观察运行期动态代理，但两 Mapper SQL 为注解固定语句。

### 3.2 003 运行证据（保留原执行事实）

- `results/association-postcheck.txt` 谓词为 `LIKE 'S3AC%' OR LIKE 'c-dssr1-%'`，**不覆盖** `probe-001`、`race-001`、`RACE-001`；原报告“所有探针 ID”已更正。
- 该前缀范围内：失败事件 0、句柄日志 0、运行态 S3AC 0 / c-dssr1 前缀 29、SCN 0、执行计划 0；表总数 47/152/30。
- `results/zk-clients-before-after.txt`：13:36:30 与 13:40:27 两次 `ls` 均在主 CRUD 之后，非 CRUD 前快照；仅子节点名列表相同。

### 3.3 R1 当前只读观察（2026-11-05 14:22:25）

- 精确 ID 集合：全部 S3AC 批次、`c-dssr1-0906-a`、`c-dssr1-0906-b`、`S3AC-C038-RENAMED`、`probe-001`、`race-001`、`RACE-001`（33 个客户端 ID），并按 DATA_SOURCE_ID 核对源 ID。
- 结果：失败事件 0；句柄日志 0；运行态 9 行（a=5、b=4；改名后新 ID 0），表总数 30；SCN 0；执行计划按 CLIENT_ID/FROM/TO 均 0。零行只证明相应谓词在 14:22:25 的结果。

### 3.4 统计表

- 对象：`CDC_STATS_CUMULATIVE_OVERVIEW`、`CDC_STATS_DAILY_OVERVIEW`、`CDC_STATS_DIM_CUMULATIVE`、`CDC_STATS_DIM_DAILY`、`CDC_STATS_TASK_CONFIG`、`CDC_STATS_WATERMARK`。
- 均无 `CLIENT_ID`/`DATA_SOURCE_ID`，仅 `DIM_TYPE/DIM_VALUE`，无直接关联键；结果表与 WATERMARK 当前 0 行、TASK_CONFIG 1 行，`DIM_TYPE` 无数据。未做对象级匹配或全库扫描；SCN/执行计划不作为统计表替代证据。

### 3.5 判定

五类操作的固定源码路径与运行 jar 字节码均无指向失败事件、句柄日志、ZK、统计表或其他进程的调用；可查运行证据未见对应记录；结构层无触发器/外键/级联约束（见 AC-076）。未发现直接反例，按定义判 **`PASS`**。未观测范围：「其他进程」（`sync-client`/`sync-server` 等运行侧）未调用、未模拟、未启动，不可直接观测；无 CRUD 前 ZK 快照、无验收期间连续 ZK 内容观测。不以“可验证范围内 `PASS`”替代整项判定。

## 4. `CCFG-AC-076` 分支证据与结论

### 4.1 原证据勘误（保留历史）

原 `results/schema-metadata-final.txt` 的 `CHECK_CONDITIONS` 分节把 LONG 列 `SEARCH_CONDITION` 与字符拼接，实际返回 `ORA-00932: inconsistent datatypes: expected CHAR got LONG`，该分节不构成结果；原查询也未覆盖独立唯一索引。错误输出保留原文件，不回改、不当作结果。

### 4.2 补齐后的核对（Schema `CDC`）

- 列：`CDC_CLIENT_MULTIPLE` 4 列、`CDC_DATA_SOURCE` 17 列；13:26 与 13:36 两次导出逐字节相同。
- 约束：2 主键 + 10 NOT NULL；`SEARCH_CONDITION_VC` 重取均为 `"列" IS NOT NULL`，无其他 CHECK 表达式。
- 索引（13:25 与 14:22 一致，共 6 个）：`PK_CDC_CLIENT_MULTIPLE`（UNIQUE，CLIENT_ID）；`PK_CDC_DATA_SOURCE`（UNIQUE，DATA_SOURCE_ID，独立唯一索引）；`IDX_CDC_DATA_SOURCE_ID_ACTIVE`（NONUNIQUE，DATA_SOURCE_ID+FG_ACTIVE，为 `PK_CDC_DATA_SOURCE` 约束提供支撑索引）；`IDX_CDC_DATA_SOURCE_NAME`；`IDX_CDC_LOG_CORRECT_ORG`；`IDX_CDS_ACTIVE`。无新增唯一索引/唯一约束。
- SQL 报错与替代：R1 两条辅助查询分别因 `USER_INDEXES.CREATED`、`USER_IND_COLUMNS.UNIQUENESS` 返回 `ORA-00904`，报错原文保留在 `raw/constraint-index-map.out` 与 `raw/index-object-times.out`，不作为结果；索引定义/列/约束映射以 `raw/metadata-structure.out` 的 `INDEXES`/`INDEX_COLUMNS`/`INDEX_TO_CONSTRAINT` 为准，对象时间以 `INDEX_OBJECT_TIMES`（`USER_OBJECTS`）为准。
- 外键与反向引用：13:25 与 14:22 均无指向两表的外键，也无两表持有的外键；schema 级 `ALL_FK_IN_SCHEMA=0`。
- 触发器：两次均为空。
- 关联表/迁移产物：相关表创建时间为 2026-10-22 或 2026-11-04；两表 `LAST_DDL_TIME` 为 2026-10-22 16:53:22，未落在 2026-11-05 验收日；`backend/` 无 Flyway/Liquibase/migration 产物；clientconfig 源码无 DDL。
- 页面反馈：复用 003 页面证据与静态核对，成功提示仅为「新增成功/编辑成功/删除成功/启用成功/停用成功」，无“已实时作用于 `sync-client`”类文案。

### 4.3 判定

物理模型在验收前后保持一致：无新增物理外键、唯一索引、关联表或迁移脚本，无 DDL，页面不声称实时生效。历史不变由真实前后导出与早于验收日的 `LAST_DDL_TIME` 共同支持，不仅凭 R1 当前快照。判 **`PASS`**。未重新执行 CRUD 制造新的“前后”。

## 5. 其他勘误

### 5.1 `CCFG-AC-021` 删除后清选

引用前序任务 `CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001` 的 `reports/evidence/.../group-f-results.json` 键 `ac145.b5`（可追溯提交 `242cc5cf878216ef6e020effc539ee742c87a35c`）：删除前 `selectionBefore=["MULTIAC-DEL2"]`；删除成功后 `result.code=200`、`rowPresent=false`、`selectionAfter=[]`。复用范围仅覆盖“固定选中为被删行、删除成功后清选”这一分支；与 003 本批真实删除、列表重载、运行态关联保留证据配合使用。不表述为 003 当场观察，不重复计分，未再执行删除。

### 5.2 `CCFG-AC-064` 并发

- 补充 `results/concurrency-postcheck.txt`：原执行 13:40 留存的真实独立 SQL 输出（342 字节，SHA256 `4c8b90a5b6c9be99516ebedca9198fd91f2f334a4dcdbcb9f8e016254b560e23`），未重跑、未改写。
- 报告/矩阵的证据键同时指向实际存在的 `concurrency.json`、`pre-concurrency.json`、`backend-log-concurrency-window.txt`。
- 口径更正：`duplicateDisplay` 为**列表 API 响应**字段；本轮未另行采集浏览器对该异常的渲染截图，不把 API 返回扩大表述为已单独验证的页面渲染。

### 5.3 夹具台账

原始三份脚本与输出支持 **52 条 DML（47 INSERT + 5 UPDATE）**，另有 **3 次 COMMIT**，合计 **55 条 DML/事务控制语句**；COMMIT 不计 DML。已逐处更正原“52 条含 COMMIT”写法。003 业务写 44 次（成功 28 / 业务拒绝 16），另 8 次前端拦截，是不同口径；R1 业务写与夹具 DML 均为 0。

## 6. 脱敏与历史证据保护

### 6.1 变更范围

| 文件 | 处理 |
|---|---|
| `003/results/preexisting-data-sources.txt` | 12 行真实标识/地址/机构名替换；235 行不变 |
| `003/results/final-checks.txt` | 同上（前 235 行数据部分）；关联计数行不变 |
| `003/results/zk-clients-before-after.txt` | ZK 主机与节点名匿名化；观察时点与边界更正 |
| `003/environment-and-versions.md` | ZK 主机匿名化 |
| `003/README.md`、`003/judgment-matrix.md`、003 报告 | 定向口径更正与匿名化 |
| `003/results/static-checks.txt` | 补充脱敏后复核说明 |
| `003/results/concurrency-postcheck.txt` | 新增（原执行留存） |

其余 003 运行证据字节保留（探针 JSON、夹具 SQL、日志摘录、其余 postcheck）。只处理 003 新增证据；其他任务的历史报告未在本任务改写。

### 6.2 规则与校验

- 真实机构名 → `ORG-<sha256前12位>`；含内网地址的连接别名 → `SRCNAME-<…>`；真实长十六进制标识 → `SRC-<…>`；ZK 主机 → `ZK_HOST`；节点 → `zk-client-01`。同一真实对象映射一致，保持行数、字段边界与前后比对语义。
- 合成样本保留：S2AC/dssr1/S3AC 等测试对象、`10.255.255.1` 占位地址、`ac021-delete.json` 中“某市第一人民医院”合成描述。
- 未入仓映射表、原始快照、凭据或原始日志；本报告不复述被脱敏原值。
- 235 条既有源仅声明**实际比对的六个字段一致**。脱敏后按同一匿名键复核：两文件前 235 行逐行相同、行数 235、每条 6 个字段；不声明整行逐字节不变。
- 已复算本目录及变更文件的 SHA256SUMS；`git diff --check` 对新增/改动行处理记录于交付校验。

## 7. 文档变更、状态与统计

- 新增：本报告；R1 evidence 目录（SQL、原始只读输出、字节码核对、ZK 当前观察、README、SHA256SUMS）。
- 修改：003 报告（AC-075/076、AC-021/064、计数、ZK、脱敏、R1 指针）；003 evidence README 与 judgment-matrix；`results/static-checks.txt`；`results/zk-clients-before-after.txt`；`results/preexisting-data-sources.txt`；`results/final-checks.txt`；`environment-and-versions.md`；新增 `results/concurrency-postcheck.txt`。
- Feature README：新增 R1 现行入口段，003 段保留为历史并更正计数口径。
- `ACCEPTANCE.md`：仅追加 1 条 R1 复核记录行；157 条定义行与非目标状态格不变。
- 状态：`CCFG-AC-075`、`CCFG-AC-076` 均维持 `PASS`；`changed_ids=[]`。
- 统计：`PASS 135 / FAIL 0 / BLOCKED 22 / NOT_RUN 0 = 157`；157 个 AC ID 唯一且连续。
- 未改产品代码、测试、依赖、配置、模板或其他 Feature。

## 8. 访问与写入边界

- 只读访问：Oracle 开发库元数据/对象/计数、当前 ZK `ls`、本机既有日志与运行 jar 字节码；均在既有权限内。
- 业务写请求 **0**；DML **0**；DDL **0**；COMMIT **0**；夹具 DML **0**。
- 未重跑 CRUD、并发或夹具；未清理/恢复数据；未改产品代码或配置；未构建；未启停服务；未操作运行侧进程、ZK 写或 Kafka；未扩大取证权限。
- 缺历史证据处如实留缺，未为取得前后快照再做业务写入。

## 9. 遗留与下一入口

- AC-075 未观测范围：其他进程运行侧、CRUD 前 ZK 快照、验收期间连续 ZK 内容观测。
- 统计表当前无关联键与业务数据，无法做对象级统计匹配；不扩大到全库扫描。
- 剩余 22 条 `BLOCKED` 未在本批处理。
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_CRUD_BOUNDARY_AND_CONCURRENCY_ACCEPTANCE_003_R1_REVIEW`。R1 提交不代表远端复审通过，也不代表 Feature 正式接受。
