# DSS-AC-065 R1 人工批准记录

## 1. 总体授权（任务提示词 §4，2026-09-12 项目负责人会话）

项目负责人在 2026-09-12 会话中明确回复“同意”，授权本任务在以下边界内补验 `DSS-AC-065`：

- 仅操作项目 `CLAUDE.md` 指定的 Oracle 19c 开发库；
- 唯一允许写入的业务表为 `CDC_DATA_SOURCE_RUN_STATE`；
- 只允许插入带本任务独立前缀的少量临时行，并在验证后删除这些精确临时行；
- 不修改 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 或其他表；
- 不执行 `UPDATE`、`MERGE`、DDL、`TRUNCATE`、匿名 PL/SQL、存储过程；
- 必须先完成全表备份证据，后执行真实 API/浏览器验收，最后恢复并做逐行一致核验；
- 无法保证安全恢复时立即停止。

ZooKeeper 补充：当前环境没有可用 ZooKeeper，本页面也不依赖 ZooKeeper；不得主动访问、写入、创建、修改或删除任何 ZooKeeper 节点。

## 2. 完整 SQL 展示后的最终检查点（`CLAUDE.md` §12.2）

阶段 A 已在本会话中原样展示：

- 目标数据库、Schema、表（`Oracle 19c development / CDC / CDC_DATA_SOURCE_RUN_STATE`）；
- 7 条 `INSERT` 的完整六字段值 + `COMMIT`；
- 7 条精确复合主键 `DELETE` + 清理 `COMMIT`；
- 预计插入/删除行数（各 7）；
- 风险与失败恢复顺序；
- 任务前后全表逐行比对方法。

完整审批包见同目录 `sql-package.md`，可执行脚本见 `insert.sql` / `delete.sql`。

**项目负责人在 Agent 会话中明确回复（原文）：**

> **批准执行上述 SQL**

该回复作用于**阶段 A 所展示的那一份精确 SQL**，不构成对任何其它 SQL 的授权；执行过程中未对 SQL 做任何变更，因此无需二次审批。

## 3. 执行一致性声明

- 实际执行的 `INSERT` / `DELETE` 与 `sql-package.md` 所列**逐条一致**；
- 未额外执行 `UPDATE`、`MERGE`、DDL、`TRUNCATE`、匿名 PL/SQL、存储过程；
- 未对 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 或其他表执行任何写入；
- 执行结果：`INSERT` 各 1 行 × 7 成功并 `COMMIT`；`DELETE` 各 1 行 × 7 成功并 `COMMIT`（见 `../database/insert-run.txt`、`../database/delete-run.txt`）。
