# 样本、数据变更与终态

- 任务：`CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002`
- 执行日期：2026-11-04
- 起始提交：`242cc5cf878216ef6e020effc539ee742c87a35c`

## 1. 负责人授权（逐字）

- **“一次覆盖多个验收项。”**
- **“当前任务中，CDC_CLIENT_MULTIPLE表的数据可以随意操作，随意增删改，完成之后不必清理。”**
- **“CDC_DATA_SOURCE表也可以随意操作，但最好不要动CDC_DATA_SOURCE表现有的记录。agent可以自行增加一些记录，并可以对自行增加的记录做任何操作。”**
- **“CDC_DATA_SOURCE与cdc_client_multiple表操作之后，均无需恢复。”**

授权边界：不含 DDL、其他表数据写入、ZK/Kafka 写入、外部进程/采集任务操作；不解释为其他功能页面接入或验收授权。数据源样本仅使用合成机构/名称/主机值，未复制真实凭据或连接信息，未连接样本源数据库，未启动采集，未调用源连接测试 API。

## 2. 表结构（只读核对）

| 表 | 列（`ALL_TAB_COLUMNS`，OWNER=`CDC`） |
|---|---|
| `CDC_CLIENT_MULTIPLE` | `CLIENT_ID VARCHAR2(32) NOT NULL`（PK）、`CLIENT_DESC VARCHAR2(1024) NULL`、`DATA_SOURCE_ID VARCHAR2(1024) NULL`、`FG_ACTIVE VARCHAR2(1) NOT NULL`；**无**“描述生成模式”列 |
| `CDC_DATA_SOURCE` | `DATA_SOURCE_ID/ORG/HOST/PORT/USER_NAME/PASSWORD/SERVICE_NAME/TYPE` 及 `INSERT_TIME/UPDATE_TIME/DELETE_TIME/FG_ACTIVE/DOMAIN/CATEGORY/SOURCE_APP/NAME/BIZ_ATTR`（全列带 `DATA_SOURCE_` 前缀；`DATA_SOURCE_ID` 为 `VARCHAR2(32)` PK） |

原始列清单见 `results/final-state.txt` 的 `===COLUMNS-*===` 段。

## 3. 本批合成数据源（164 行，全部为本批新增）

- `DATA_SOURCE_ID LIKE 'S2AC%'`：**160** 行。
- 额外合成边界 ID：`C01`、`C02`、`S2AM`、`S2AM,C02`：**4** 行（均于本批 2026-11-04 13:35 新建）。
- 主机/用户/密码仅为合成值（如 `s2ac-host.invalid`、`k-host-synthetic.local`、`s2ac_user` / `s2ac_notreal`），不指向任何真实系统。
- 完整 ID 清单：`samples/synthetic-source-ids.txt`（164 行）；字段快照：`samples/synthetic-sources.csv`。
- 用途：机构名超长/重复/大小写/首尾空白/空机构名/含逗号/占用冲突/停用/禁用类别/容量边界/长 ID/40 源等场景。

## 4. 本批合成探针记录（29 行）

- `CLIENT_ID LIKE 'S2AC-%'`：**29** 行；其中 `FG_ACTIVE='1'` 25 行、`'0'` 3 行（`S2AC-PDIS`、`S2AC-PDIS2`、`S2AC-PDIS3`）、非 `'0'/'1'` 1 行（`S2AC-PABN`，`FG_ACTIVE='X'` 历史异常态）。
- 完整字段快照：`samples/synthetic-clients.csv`；终态选取见 `results/final-state.txt` 的 `===SYNTHETIC-CLIENT-ROWS===`。

## 5. 业务写操作产生的变更（真实 API，未清理）

- 写请求到达真实后端共 **18** 次：成功 8 次，按预期被业务规则拒绝 10 次（`40103/40105/40441/40941`）。
- 8 次成功写请求覆盖：`S2AC-P14`、`S2AC-PAUTO`、`S2AC-PCAP`、`S2AC-PK40` 的创建/保存，以及对 `S2AC-P68`（移除异常项后保存）、`S2AC-PDIS3`（移除释放源 `S2AC-O07`）、`S2AC-PLONG`（保存截断后 256 字符）、`S2AC-P07`（取得释放后的 `S2AC-O07`）的更新/创建。
- 10 次被拒绝的写请求未产生行或字段变化：`S2AC-PNOSRC`（40103）、`S2AC-POVER`（40105）、`S2AC-PNEAR`（40441）、`S2AC-POCCNEW`/`S2AC-PEDIT`/`S2AC-PO7TRY`/`S2AC-PO4TRY`/`S2AC-PDIS2` 启用/`S2AC-PNORM` 两次（均 40941）。
- **未执行**任何删除探针记录的写请求；AC-057 的“移除释放”腿已执行，“删除释放”腿未单独执行。

## 6. 直接 DML

- `sql/fixture-prepare.sql` + `sql/fixture-prepare-extra.sql`：合并为可重放记录，共 **193 条 INSERT**（164 条 `CDC_DATA_SOURCE` + 29 条 `CDC_CLIENT_MULTIPLE`）与 2 条 `COMMIT`，无 `UPDATE`/`DELETE`/DDL。
- 其中少量探针记录实际由真实业务 API 创建（见 §5），脚本同时保留其等价的 INSERT 以便复现；脚本不是严格按执行时刻的单一事务记录。
- `sql/final-state.sql`、`sql/verification-ac014-ac015.sql` 仅含 `SELECT`。

## 7. 既有数据源保护核对

- 开工前快照的 **37** 条既有数据源，任务结束按 `ID|ORG|DATA_SOURCE_NAME|TYPE|CATEGORY|FG` 六字段逐条比对：**缺失 0、变化 0**。
- 未修改、未停用、未删除任何既有数据源记录。
- 含真实机构/源标识的原始快照仅保存在仓库外工作目录，**未入仓**；本目录只保留合成 ID 与脱敏统计。

## 8. 终态统计（`results/final-state.txt`）

| 项目 | 数值 |
|---|---|
| `CDC_DATA_SOURCE` 总行数 | **201** |
| 本批合成数据源 | **164** |
| 既有数据源（未改动） | **37** |
| `CDC_CLIENT_MULTIPLE` 总行数 | **59** |
| 本批合成探针 | **29** |
| 既有探针（未改动） | **30** |

**按负责人授权不清理、不恢复**；本任务不报告 `RESTORED`。保留的均为合成文本/ID。
