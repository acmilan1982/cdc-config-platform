# 探针端管理 CRUD 边界与并发验收执行报告

- 任务编号：`CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003`
- 执行日期：2026-11-05
- 分支：`develop`
- 开工基线：`e0b0048ce530c46c397917dd8bbce8b6b59fabe7`（= 开工时 `origin/develop`）
- 验收入口：`http://192.168.174.70:5173/config/client`
- 证据目录：`reports/evidence/CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003/`

## 1. 结论摘要

本批按负责人既有授权，在 Oracle 开发库与 `/config/client` 范围执行 10 条目标 AC 的真实页面/API 验收。逐条判定如下：

| AC | 原状态 | 本批结论 | 核心依据 |
|---|---|---|---|
| `CCFG-AC-021` | NOT_RUN | **PASS** | 删除取消零写、确认物理删除、5 条运行态关联保留；ZK 仅有并发窗口前后两次子节点名观察（非删除前后快照），删除不触达 ZK 由固定源码路径支持 |
| `CCFG-AC-024` | NOT_RUN | **PASS** | 启用二次确认、取消零写、仅 `FG_ACTIVE→1` |
| `CCFG-AC-027` | BLOCKED | **PASS** | 停用/不存在/逗号不阻止停用删除；重复分配阻止启用并提示冲突探针 |
| `CCFG-AC-030` | BLOCKED | **PASS** | 三种大小写变体与绕过均 `40940`；混合大小写保留；并发双成功无锁超时 |
| `CCFG-AC-033` | NOT_RUN | **PASS** | 页面 256 码点、后端 1024 UTF-8 字节边界一致；原文持久化 |
| `CCFG-AC-038` | NOT_RUN | **PASS** | 改名成功，旧 ID 行消失，4 条运行态关联仍挂旧 ID |
| `CCFG-AC-064` | NOT_RUN | **PASS** | 三组并发均双成功，每请求先预检，无锁表，重复分配可见 |
| `CCFG-AC-075` | BLOCKED | **PASS** | 固定提交源码五类操作无级联调用路径；失败事件/句柄日志按精确 ID 计数为 0；ZK 子节点名列表在并发窗口前后相同（非 CRUD 前快照）；统计表无关联键；未观测范围见 §3.8 |
| `CCFG-AC-076` | BLOCKED | **PASS** | 列/约束/索引/外键/触发器/迁移产物核对完整（含独立唯一索引）；无 DDL；页面无实时生效文案；历史变化仅按真实前后数据与既有基线认定 |
| `CCFG-AC-128` | BLOCKED | **PASS** | 键入/粘贴 32 位上限、非法字符不静默改写、字段错误、后端兜底 |

- `changed_ids`：`CCFG-AC-021, CCFG-AC-024, CCFG-AC-027, CCFG-AC-030, CCFG-AC-033, CCFG-AC-038, CCFG-AC-064, CCFG-AC-075, CCFG-AC-076, CCFG-AC-128`
- 四态统计：`PASS 135 / FAIL 0 / BLOCKED 22 / NOT_RUN 0 = 157`
- 业务写请求 44 次（28 成功 / 16 业务拒绝），另有 8 次前端拦截提交；夹具 DML 52 条（47 INSERT + 5 UPDATE），另有 3 次 COMMIT，合计 55 条 DML/事务控制语句。
- 既有 235 条数据源的比对六字段一致（脱敏后按同一匿名键复核）；未清理、未恢复两表测试数据（按授权）。
- 本批 10 条通过**不等于** 157 条整体验收通过，**不等于** Feature 正式接受或页面迁移授权。

## 2. 业务执行事实

### 2.1 服务与环境

- 后端 PID `3327`，监听 `*:8080`，既有 jar SHA256 `efdbea827b6ab84dd47105d2cc130f0bc3c5b70dc78cc626b6421e1f9750a459`。
- 前端 npm PID `3373`、Vite PID `3385`，监听 `0.0.0.0:5173`。
- JDK 1.8.0_202、Maven 3.8.8、Node v24.17.0、Playwright Core 1.59.1、Chromium 147.0.7727.15。
- 详细环境与验证边界见 `evidence/.../environment-and-versions.md`。

### 2.2 夹具与动作分离

夹具只写 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`，全部带 `S3AC` 批次标识，写前按精确 ID 核对不存在：

| 脚本 | 内容 | 实际输出 |
|---|---|---|
| `001-fixture-prepare.sql` | 28 源 INSERT + 16 探针 INSERT + COMMIT | 44 行 created，exit 0 |
| `002-fixture-adjust-isolation.sql` | 2 源 INSERT + 5 探针 UPDATE + COMMIT | 7 行成功，异常类型隔离 |
| `003-ac033-raw-source.sql` | 1 源 INSERT + COMMIT | 1 行 created，共 31 条 S3AC 源 |

- 夹具 DML 合计 52 条（47 INSERT + 5 UPDATE），另有 3 次 COMMIT；合计 55 条 DML/事务控制语句（COMMIT 不计 DML）。R1 复核时判定的业务写次数与夹具口径为两项不同计数，见 §4。
- `c-dssr1-0906-a` / `-b` 为既有 Agent 合成探针，创建证据：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1/db/002-insert-master.sql`（第 13/17 行探针、第 64 行起运行态），非真实业务对象。
- 所有合成连接值仅为占位（`10.255.255.1` / `s3ac` / `s3ac-synthetic`），未做源库连接测试。

### 2.3 业务写尝试账本

| AC | 请求 | 成功 | 业务拒绝 | 前端拦截 | 证据 |
|---|---:|---:|---:|---:|---|
| 021 | 1 DELETE | 1 | 0 | 0 | `results/ac021-delete.json` |
| 024 | 1 enable | 1 | 0 | 0 | `results/ac024-enable.json` |
| 027 | 12 | 11 | 1×40941 | 0 | `results/ac027-*.json` |
| 030 | 6 | 2 | 4×40940 | 0 | `results/ac030-sequential.json` |
| 033 | 7 | 4 | 3×40102 | 1 | `results/ac033-desc.json` |
| 038 | 1 PUT | 1 | 0 | 0 | `results/ac038-rename.json` |
| 064 | 8 | 8 | 0 | 0 | `results/concurrency.json` |
| 128 | 8 API | 0 | 8×40100/40101 | 7 | `results/ac128-id-input.json` |
| **合计** | **44** | **28** | **16** | **8** | 提交尝试 52 |

并发双成功为定义明确允许；未做重试刷取。

### 2.4 数据完整性

- 既有 235 条数据源在验收前后比对的六个字段一致（`results/preexisting-data-sources.txt` 与 `results/final-checks.txt` 前 235 行逐行相同）。**仅声明这六个字段一致，不声明整行其他字段或整行逐字节不变。** R1 对真实机构名、内网地址与真实标识做确定性假名替换后，按同一匿名键复核两文件前 235 行仍逐行相同、行数仍为 235；详见 R1 报告。
- 验收终态：探针 83、数据源 266、运行态 30（仅既有 `c-dssr1` 29 行 + 1 行其他既有）。
- `CDC_JOB_FAILURE_EVENT` 47、`CDC_JOB_FAILURE_HANDLE_LOG` 152 总数未因本批变化；对 `S3AC%`、`c-dssr1-%`、`PROBE-001`、`RACE-001` 计数均为 0。
- ZK `/bsoft-cdc/clients` 两次只读 `ls` 观察均为 `[zk-client-01]`（节点名已匿名化），未出现任何合成探针。两次读数分别位于主 CRUD 之后、并发窗口之前与并发窗口之后，均不是 CRUD 前快照；仅证明两次观察子节点名列表相同，不证明节点内容不变。
- 未执行 DDL；验收前后列/约束元数据逐字节一致。

## 3. 逐 AC 证据与判定

完整矩阵见 `evidence/.../judgment-matrix.md`；以下逐条给出前置、动作、预期、实际、证据键与状态。

### 3.1 `CCFG-AC-021` — PASS

- 前置：`c-dssr1-0906-a` 存在且有 5 条运行态关联；页面可固定选中该行。
- 动作：删除菜单 → 取消；再次 → 确认。
- 预期：取消不请求且行保留、固定选中不变；确认后物理删除、重载列表、不清洗关联表/ZK/Kafka。
- 实际：取消 `deleteRequests=0`、行仍在、选中保留；确认 `DELETE` 200，`GET ?status=ALL` 重载；行不存在；运行态 5 行逐字段未变；其他探针 76、其他源 265；ZK 子节点名列表在并发窗口前后两次观察均为 `[zk-client-01]`（均在删除之后，非删除前后快照；删除不触达 ZK 由固定源码路径仅调用 `deleteById` 支持）。
- 证据键：`results/ac021-delete.json`（`cancel`、`confirm.deleteResponse`、`post`）、`results/ac021-postcheck.txt`、`results/zk-clients-before-after.txt`。
- 删除成功后的固定选中清除：**本轮未当场观察，直接引用前序真实证据** `docs/features/client-config/reports/evidence/CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001/group-f-results.json` 的 `ac145.b5`（可追溯提交 `242cc5cf878216ef6e020effc539ee742c87a35c`）：删除前 `selectionBefore=["MULTIAC-DEL2"]`，删除成功后 `result.code=200`、`rowPresent=false`、`selectionAfter=[]`。该引用仅覆盖“固定选中为被删行、删除成功后清选”这一分支；与 003 本批真实删除、列表重载、运行态关联保留证据配合使用，不表述为 003 当场观察，也不因此重复计分。
- 状态：**PASS**。

### 3.2 `CCFG-AC-024` — PASS

- 前置：`S3AC-C024-OFF` 停用，关联源启用。
- 动作：启用 → 取消；再次 → 确认。
- 预期：二次确认；取消不调用接口；成功仅 `FG_ACTIVE→1`；不直接启停/通知 `sync-client`，不写 ZK/Kafka。
- 实际：确认框文案与类名正确；取消 `putRequests=0`；确认 `PUT .../enable` 200；回读 `FG_ACTIVE='1'`，描述/源不变；源 `FG_ACTIVE='1'` 不变；ZK 子节点名列表仍为 `[zk-client-01]`（均在启用之后，非启用前后快照）；源码无运行侧 ZK/Kafka/进程调用。
- 证据键：`results/ac024-enable.json`、`results/ac024-postcheck.txt`、`results/static-checks.txt`。
- 状态：**PASS**。

### 3.3 `CCFG-AC-027` — PASS

- 前置：四类异常各一隔离样本（停用、不存在、含逗号、重复分配）；重复分配组含已停用持有者 `S3AC-C027DA`。
- 动作：对每类执行停用、删除；对前三类执行启用；对重复分配执行启用。
- 预期：前三类异常不阻止停用/删除，除重复分配外不阻止启用；重复分配启用给出冲突提示。
- 实际：4 停用 + 4 删除 + 3 启用全部 200 且终态正确；重复分配启用 `40941`，提示「已分配给探针：S3AC-C027DA，不能重复分配。」。
- 证据键：`results/ac027-disable-delete.json`、`results/ac027-enable.json`。
- 状态：**PASS**。

### 3.4 `CCFG-AC-030` — PASS

- 前置：`probe-001` 先经真实页面建立；`race-001`/`RACE-001` 不存在。
- 动作：三种大小写变体页面提交；混合大小写保存；绕过前端提交；两独立 socket 并发提交竞态 ID。
- 预期：三种变体按不区分大小写判重拒绝；无冲突保存保留原大小写；绕过仍拒绝；并发允许双成功且无锁超时。
- 实际：三变体均 `40940` 且有字段错误；绕过 `40940`；`S3AC-C030-MiXeD` 与 `probe-001` 原大小写回读；竞态两笔均 200 且并存；后端日志两线程先预检再 INSERT。
- 证据键：`results/ac030-sequential.json`、`results/concurrency.json`（`scenarios.raceIds`）、`results/backend-log-concurrency-window.txt`。
- 状态：**PASS**。

### 3.5 `CCFG-AC-033` — PASS

- 动作：页面空白描述；页面键入 300 Emoji；API 六组边界。
- 预期：空白拒绝；页面 256 码点；后端 UTF-8 1024 字节；超限拒绝；Emoji 按真实字节；原文持久化。
- 实际：空白字段错误「探针描述不能为空。」且零请求；300 Emoji 截断为 256 码点/1024 字节保存成功；ASCII 1024 成功/1025 拒绝；825 码点/1025 字节拒绝；Emoji 256/1024 成功、257/1028 拒绝；含空白原文逐字节回读一致；`LENGTHB<=1024` 全部成立。
- 证据键：`results/ac033-desc.json`、`results/ac033-postcheck.txt`。
- 状态：**PASS**。

### 3.6 `CCFG-AC-038` — PASS

- 前置：`c-dssr1-0906-b` 有 4 条运行态关联。
- 动作：编辑页解除 ID 锁定，改名 `S3AC-C038-RENAMED` 并保存。
- 预期：改名成功；不检查/不修改/不级联其他表、进程、ZK、Kafka。
- 实际：`PUT` 200；旧行消失、新行存在；运行态仍为旧 ID 下 4 行、新 ID 下 0 行；ZK 不变；源不变。
- 证据键：`results/ac038-rename.json`、`results/ac038-postcheck.txt`。
- 状态：**PASS**。

### 3.7 `CCFG-AC-064` — PASS

- 前置：三个争抢源均无持有者；编辑目标源不冲突。
- 动作：同一门闩放行两个独立 socket，执行 insert×insert、edit×edit、insert×edit。
- 预期：每请求写前检查；无 `LOCK TABLE`；允许一笔或两笔成功；重复时按异常规则展示。
- 实际：三组均两笔 200；发送差 1–5 ms、响应 23–57 ms；终态每源两行；**列表 API 返回**（`concurrency.json.duplicateDisplay`）含 `ASSIGNED_TO_MULTIPLE_CLIENTS` 及冲突探针 ID；后端日志每线程先 `selectFullScan`+`selectSafeAll`；源码无锁表。
- 证据键：`results/concurrency.json`、`results/pre-concurrency.json`、`results/concurrency-postcheck.txt`、`results/backend-log-concurrency-window.txt`、`results/static-checks.txt`。
- `results/concurrency-postcheck.txt` 为原执行 13:40 留存的独立 SQL 真实输出（342 字节，SHA256 `4c8b90a5b6c9be99516ebedca9198fd91f2f334a4dcdbcb9f8e016254b560e23`），R1 复查时补入本目录；未重跑并发、未改写输出。
- 口径边界：上述异常为 **API 列表响应**中的字段，本轮未另行采集浏览器对该异常的渲染截图；不把它扩大表述为已单独验证的页面渲染。页面侧的并发操作本身由探针真实请求/响应记录支持。
- 状态：**PASS**。

### 3.8 `CCFG-AC-075` — PASS

定义关注：新增、编辑、删除、启用、停用时不处理与故障事件、故障处置记录、ZK 节点、统计表、其他进程的级联关系。

- **分支一·固定提交源码路径（只读核对，非仅关键字 grep）**
  - 控制器 `ClientConfigController`：E1 `GET /api/clients`→`list`；E2 `GET /data-source-options`→`dataSourceOptions`；E3 `POST /api/clients`→`create`；E4 `PUT /{originalClientId}`→`update`；E5 `DELETE /{clientId}`→`delete`；E6 `PUT /{clientId}/enable`→`enable`；E7 `PUT /{clientId}/disable`→`disable`。全部直接委托 Service，无旁路。
  - Service `ClientConfigServiceImpl`：`list`/`dataSourceOptions`/`create`/`update` 调用 `CdcClientConfigMapper.selectByKeywordAndStatus|selectFullScan|insert|update` 与 `CdcDataSourceMapper.selectSafeAll`；`delete` 仅 `deleteById`；`enable` 为全量预读 + `update`；`disable` 仅 `update`。5 处声明式 `@Transactional(rollbackFor=Exception.class)`，无显式 `LOCK TABLE`。
  - Mapper/SQL 仅触达 `CDC_CLIENT_MULTIPLE`（读/写）与 `CDC_DATA_SOURCE`（只读安全列）。无第三张表、无存储过程、无 DDL、无外部调用。
  - 来源与边界：功能源码最后变更 `84d3cdcf`（2026-09-05）；运行 jar SHA256 `efdbea827b6ab84dd47105d2cc130f0bc3c5b70dc78cc626b6421e1f9750a459`（2026-09-22 12:21）。从该运行 jar 提取的 Service/Controller 字节码仅引用上述 7 个 Service 方法与 6 个 Mapper 方法及其同包 VO/DTO/工具类；未引用 ZK、Kafka、进程、统计表、失败事件、SCN、执行计划或其他 Mapper。边界：未观察运行期动态代理，但两 Mapper 的 SQL 为注解固定语句。
- **分支二·003 运行证据（保留原执行事实）**
  - `results/association-postcheck.txt` 的谓词为 `LIKE 'S3AC%' OR LIKE 'c-dssr1-%'`，**实际不覆盖** `probe-001`、`race-001`、`RACE-001`。原报告“对本批所有探针 ID”扩大了范围；R1 更正为“S3AC 与 c-dssr1 前缀范围”。
  - 该前缀范围内：`CDC_JOB_FAILURE_EVENT`、`CDC_JOB_FAILURE_HANDLE_LOG` 均 0；`CDC_DATA_SOURCE_RUN_STATE` 的 S3AC 0、c-dssr1 前缀 29；`CDC_DATA_SOURCE_SCN` 0；`CDC_EXECUTION_PLAN` 0；表总数 47/152/30。
  - `results/zk-clients-before-after.txt` 的两次 `ls` 均在主 CRUD **之后**（13:36:30 并发窗口前、13:40:27 并发窗口后），**不是 CRUD 前快照**；仅证明两次子节点名列表相同，不证明节点内容不变。
- **分支三·R1 当前只读补证（2026-11-05 14:22:25，Schema `CDC`）**
  - 按真实请求的实际 ID 集合精确查询：全部 S3AC 批次 ID、`c-dssr1-0906-a`、`c-dssr1-0906-b`、改名后 `S3AC-C038-RENAMED`、`probe-001`、`race-001`、`RACE-001`（共 33 个客户端 ID）。
  - 结果：失败事件按 CLIENT_ID/DATA_SOURCE_ID 均 0；句柄日志均 0；运行态 9 行（`c-dssr1-0906-a`=5、`-b`=4；旧 ID 保留、改名后新 ID 0），另 c-dssr1 前缀共 29 行、表总数 30；SCN 均 0；执行计划按 CLIENT_ID/FROM/TO 均 0。零行只证明相应精确谓词在 2026-11-05 14:22:25 的结果。
- **分支四·统计表**
  - 按已批准基线与代码定位的统计对象：`CDC_STATS_CUMULATIVE_OVERVIEW`、`CDC_STATS_DAILY_OVERVIEW`、`CDC_STATS_DIM_CUMULATIVE`、`CDC_STATS_DIM_DAILY`、`CDC_STATS_TASK_CONFIG`、`CDC_STATS_WATERMARK`。均无 `CLIENT_ID`/`DATA_SOURCE_ID` 列，仅 `DIM_TYPE/DIM_VALUE` 维度，**无直接关联键**；因此未做有意义的对象级匹配，也未扫描全库。当前行数：前四个结果表与 WATERMARK 均为 0，TASK_CONFIG 为 1（配置行），`DIM_TYPE` 无数据。SCN/执行计划不作为统计表的替代证据。
- **未观测范围**：「其他进程」（`sync-client`/`sync-server` 等运行侧）在本批未调用、未模拟、未启动，不可直接观测；本任务也不允许调用/模拟。另无 CRUD 前 ZK 快照、无验收期间连续 ZK 内容观测。
- **判定**：五类操作的固定源码路径与运行 jar 字节码均无指向失败事件、句柄日志、ZK、统计表或其他进程的调用；可查运行证据未见对应记录；结构层无触发器/外键/级联约束（见 AC-076）。未发现直接反例，按定义判 **PASS**；上述未观测范围如实单列，不以“可验证范围内 PASS”替代整项判定。
- 证据键：003 `results/association-postcheck.txt`、`results/final-checks.txt`、`results/zk-clients-before-after.txt`、`results/static-checks.txt`；R1 只读补证见 `evidence/CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003-R1/`（`raw/association-exact-ids.out`、`raw/jar-bytecode-refs.txt`、`raw/stats-rows.out`、`raw/zk-current.txt`）。

### 3.9 `CCFG-AC-076` — PASS

- 动作：完成五类操作后检查数据库对象变更与页面提示（复用 003 已执行证据，不重跑 CRUD）。
- 预期：不新增物理外键、唯一索引、关联表或迁移脚本；不执行 DDL；页面不声称已实时作用于 `sync-client`。
- **原证据勘误（保留为历史事实）**：原 `results/schema-metadata-final.txt` 的 `CHECK_CONDITIONS` 分节把 LONG 列 `SEARCH_CONDITION` 与字符拼接，实际返回 `ORA-00932: inconsistent datatypes: expected CHAR got LONG`，该分节不构成结果；原查询也未覆盖独立唯一索引。失败输出与错误码保留在原文件，不回改、不当作结果。
- **R1 补齐后的实际（Schema `CDC`）**
  - 列：`CDC_CLIENT_MULTIPLE` 4 列、`CDC_DATA_SOURCE` 17 列；13:26 与 13:36 两次导出逐字节相同。
  - 约束：仅 2 个主键 + 10 个 NOT NULL 检查约束；用数据库版本支持的 `SEARCH_CONDITION_VC` 重取，10 条均为 `"列" IS NOT NULL`，无其他 CHECK 表达式。
  - 索引：13:25（夹具/CRUD 前）与 R1 14:22（当前）两次导出完全一致，共 6 个——`PK_CDC_CLIENT_MULTIPLE`（UNIQUE，CLIENT_ID）、`PK_CDC_DATA_SOURCE`（UNIQUE，DATA_SOURCE_ID，独立唯一索引）、`IDX_CDC_DATA_SOURCE_ID_ACTIVE`（NONUNIQUE 复合 DATA_SOURCE_ID+FG_ACTIVE，同时为 `PK_CDC_DATA_SOURCE` 约束提供支撑索引）、`IDX_CDC_DATA_SOURCE_NAME`、`IDX_CDC_LOG_CORRECT_ORG`、`IDX_CDS_ACTIVE`。无新增唯一索引/唯一约束。
  - 外键与反向引用：13:25 与 14:22 均无指向两表的外键，也无两表持有的外键；schema 级 `ALL_FK_IN_SCHEMA=0`。
  - 触发器：两次核对均为空。
  - 关联表/迁移产物：相关表 `CDC_CLIENT`、`CDC_CLIENT_MULTIPLE`、`CDC_CLIENT_MULTIPLE_2026_11_04`、`CDC_DATA_SOURCE`、`CDC_DATA_SOURCE_2026_09_01`、`CDC_DATA_SOURCE_EXTEND`、`CDC_DATA_SOURCE_RUN_STATE`、`CDC_DATA_SOURCE_SCN` 的创建时间均为 2026-10-22 或 2026-11-04，早于本批验收日；`backend/` 无 Flyway/Liquibase/migration 产物；clientconfig 源码无 DDL。两表 `LAST_DDL_TIME` 为 2026-10-22 16:53:22，未落在 2026-11-05 验收日。
  - 页面反馈：复用 003 页面证据（`results/ac021-delete.json`、`results/ac024-enable.json`）与固定源码/静态核对（`results/static-checks.txt`），成功提示仅为「新增成功/编辑成功/删除成功/启用成功/停用成功」，无“已实时作用于 `sync-client`”类文案。
- 证据键：003 原始 `results/schema-metadata-final.txt`（含失败的 CHECK 查询）、`results/static-checks.txt`、`results/ac021-delete.json`、`results/ac024-enable.json`；R1 只读补证见同名 R1 evidence 目录（`raw/metadata-pre-1325.out`、`raw/metadata-pre-1326.out`、`raw/metadata-post-1336.out`、`raw/check-conditions-1326.out`、`raw/metadata-structure.out`、`raw/constraint-index-map.out`、`raw/index-object-times.out`）。
- 边界：R1 元数据为 2026-11-05 14:22 的当前快照。“验收期间未变化”由 13:25/13:26 与 13:36 的真实前后导出、以及早于验收日的 `LAST_DDL_TIME` 共同支持，不仅凭当前快照；未重新运行 CRUD 制造新的“前后”。
- 状态：**PASS**。

### 3.10 `CCFG-AC-128` — PASS

- 前置：`/config/client` 新增弹窗；`probe-001` 供唯一性核对。
- 动作：真实键入/粘贴 40 位；键入非法字符并提交；绕过前端提交非法/33 位 ID。
- 预期：键入与粘贴均最多 32 位；非法字符不静默改写、给出字段错误；首位/字符集/判空/大小写唯一性与后端校验不变。
- 实际：键入与粘贴均截断 32 位；非法输入原样保留、`postDelta=0`、字段错误明确；空/空白提示必填；后端 `40101`/`40100` 拒绝且不新增；唯一性由 AC-030 四次 `40940` 佐证。
- 证据键：`results/ac128-id-input.json`、`results/ac030-sequential.json`。
- 状态：**PASS**。

## 4. 文档变更与统计

- 修改：`docs/features/client-config/ACCEPTANCE.md` 仅 10 个目标状态格（`NOT_RUN`/`BLOCKED` → `PASS`），定义行文字未改。
- 修改：`docs/features/client-config/README.md` 仅追加本批“现行下一入口”导航段。
- 新增：本报告 + 证据目录（探针、夹具、SQL、脱敏结果、静态核对、SHA256SUMS）。
- 四态：`PASS 135 / FAIL 0 / BLOCKED 22 / NOT_RUN 0 = 157`；157 个 AC ID 唯一且行数一致。
- 定义行计数保持 `REQ 154 / AC 157 / DESIGN 89 / UI 77`。
- 未改产品代码、测试、依赖、配置、模板或其他 Feature；未暂存 `.claude/settings.local.json`、`docs/prompts/**`、`runtime-logs/**`。
- **R1 定向更正（2026-11-05，仅文档与证据口径，未重跑验收）**：AC-075/076 证据口径与未观测范围；AC-021 引用前序 `ac145.b5`；补入原执行留存的 `results/concurrency-postcheck.txt` 并区分 API 返回与浏览器渲染；夹具计数改为“52 DML + 3 COMMIT = 55 条 DML/事务控制语句”；ZK 观察时点标注为并发窗口前后（非 CRUD 前快照）；真实机构名、内网地址与真实标识做确定性假名替换；`results/preexisting-data-sources.txt` 与 `results/final-checks.txt` 前 235 行按同一匿名键复核仍逐行相同。详见 `CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003-R1.md`。

## 5. 边界与遗留

- 本批 10 条通过不等于 157 条整体验收通过，也不等于 Feature 正式接受或页面迁移授权。
- 运行侧（`sync-client`/`sync-server` 进程、Kafka、真实 ZK 写）未调用、未模拟；AC-075 的未观测范围（其他进程、CRUD 前 ZK 快照、连续 ZK 内容观测）已在 §3.8 单列。
- 按授权，两表测试数据不清理、不恢复，不报告 `RESTORED`。
- 剩余 22 条 `BLOCKED` 留待后续批次，本批未处理。
- 未预填自身提交 SHA，不宣告远程复审通过。

## 6. 下一入口

- 原复审入口（已被 R1 更新）：`CHATGPT_REMOTE_CLIENT_CONFIG_CRUD_BOUNDARY_AND_CONCURRENCY_ACCEPTANCE_003_REVIEW`。
- **R1 入口**：`CHATGPT_REMOTE_CLIENT_CONFIG_CRUD_BOUNDARY_AND_CONCURRENCY_ACCEPTANCE_003_R1_REVIEW`（对象为 R1 结果提交，由 ChatGPT 从远程 Git 对 R1 报告、定向更正与脱敏证据做独立只读复审）。R1 提交不代表远端复审通过，也不代表 Feature 正式接受。
