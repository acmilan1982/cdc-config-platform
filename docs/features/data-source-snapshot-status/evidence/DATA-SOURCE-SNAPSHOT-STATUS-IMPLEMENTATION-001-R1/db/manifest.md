# R1-02 合成测试数据清单（前缀 dssr1-0906-）

授权：负责人本会话明确授权对本项目内网库（DB_NAME=prod / 主机 snoopy-linux，Schema=CDC）以下三表
执行测试 INSERT 并 COMMIT，测试后保留不还原。本清单是权限记录，不改产品只读规则。

- 新增主键（全部独立合成，未使用/冒充任何运行中 clientId/源库）：
  - CDC_CLIENT_MULTIPLE（+5，FG_ACTIVE='0'）：c-dssr1-0906-a / -b / -c / -d / -e
  - CDC_DATA_SOURCE（+5，FG_ACTIVE='0'）：s-dssr1-0906-1 / -2 / -3 / -4 / -5
  - CDC_DATA_SOURCE_RUN_STATE（+29）：见下方状态分组；缺失关联引用 s-dssr1-0906-m1/-m2/-m3
    与 c-dssr1-0906-miss1/-miss2（故意不建配置，用于 NOT_FOUND）。
- 行数：RUN_STATE 12 RUNNING + 11 COMPLETED + 6 UNKNOWN；总 29。基准 1 → 提交后 30。
- 基线：RUN_STATE 1 / CLIENT_MULTIPLE 11 / DATA_SOURCE 29；提交后 30 / 16 / 34。

## 场景映射

| 场景 | 合成行依据 |
|---|---|
| RUNNING / COMPLETED / 多 UNKNOWN 原值 | SNAPSHOT_RUNNING、SNAPSHOT_COMPLETED、SNAPSHOT_STALE、UNKNOWN、STARTING、SNAPSHOT_UNKNOWN、UNKNOWN_MODE |
| 两个可空时间字段 | 见 003 复核输出：a/s4、d/s1 等 SNAPSHOT_LAST_SEEN_AT=NULL；UNKNOWN 双 NULL；b/s2 双 NULL |
| 并列 UPDATED_AT + 时间/名称排序 | 2026-09-05 08:00:00 一组 7 行（c4,c5,d3,d5,e1,e2,e5）验证并列时间按 CLIENT_ID/DATA_SOURCE_ID 升序 |
| 多探针 / 多源库 / 同源不同探针组合 | 5 探针 + 5 源 + 2 缺失探针 + 3 缺失源；a/b/d/e 同源 s1..s5 交叉 |
| 专用停用关联配置、类别非 SOURCE | 新建 5 探针/5 源均 FG_ACTIVE='0'、描述含“快照页测试，请勿启用”；s4 category=TARGET、s5 category=NULL（均 sourceRole=false） |
| 缺失探针 / 缺失源 / 同时缺失 | miss1、miss2 无配置（NOT_FOUND）；c/m1..m3 缺源；miss2/m1、miss2/m2 双缺失 |
| 长描述 / 同名 ORG 不同 ID（Tooltip 与筛选） | a 探针约 200 字描述；s1/s2 同名 ORG（SNAPSHOT-TEST-某市一院信息中心源库-DONOTUSE）不同 ID |

## 连接字段（不可用合成值，绝不连接）

host=192.0.2.250（TEST-NET-1）、user=dssr1_noop、password=dssr1_noop_pwd_0906、
service=dssr1.0906.invalid、type=ORACLE；FG_ACTIVE='0'，SOURCE_APP='DSSR1-TEST'。

## SQL 与结果文件

- db/001-precheck.sql：只读查重，碰撞 0
- db/002-insert-master.sql：INSERT + COMMIT，exit 0，1 row×39，提交后行数复核 30/16/34
- db/003-verify-reads.sql：新会话只读复核，29/5/5，状态 12 RUNNING/11 COMPLETED/6 UNKNOWN
- db/004-api-read-summary.txt：运行中只读接口读到 29 条前缀行

同名 `002-insert-master.spool.log`、`003-verify-reads.spool.log` 为 SQL*Plus 本地执行原始留档；因仓库 `.gitignore` 忽略 `*.log`，它们保留在本地不入库，上述结果要点已在本清单与 `004-api-read-summary.txt` 记录。

本批数据为测试证据保留，不自动清理；无 UPDATE/DELETE 已有行、无 TRUNCATE、无 DDL、无触发器写入。
