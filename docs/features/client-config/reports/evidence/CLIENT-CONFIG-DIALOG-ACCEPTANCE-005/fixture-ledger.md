# 005 夹具台账（CDC_DATA_SOURCE / CDC_CLIENT_MULTIPLE）

任务：`CLIENT-CONFIG-DIALOG-ACCEPTANCE-005`
执行日期：2026-11-06
授权边界：`CDC_CLIENT_MULTIPLE` 可按任务需要操作；`CDC_DATA_SOURCE` 仅新增/操作本任务自建合成样本；保留其他既有源。无 DDL。

## 1. 新增的 005 合成数据源（SQL fixture）

- 脚本：`sql/fixture-prepare-005.sql`
- 前缀：`CCFG005`（本批唯一前缀）
- 执行方式：SQL*Plus，脚本内含 `COMMIT`
- 夹具 SQL 与被测业务写严格分离：这些 INSERT 只准备数据源候选样本，不经过产品 API

| DATA_SOURCE_ID | ORG | FG_ACTIVE | CATEGORY | TYPE | 用途 |
|---|---|---|---|---|---|
| `CCFG005-DS-LONG-0123456789ABCDE` | `CCFG005超长机构名称用于错误换行验证样本` | `1` | `SOURCE` | `ORACLE` | 资格命中；配合占用探针产生真实 40941 长错误 |
| `CCFG005-DS-OFF` | `CCFG005 Disabled Source Org` | `0` | `SOURCE` | `ORACLE` | 停用样本；不得出现在候选 API |
| `CCFG005-DS-ABN` | `CCFG005 Abnormal Source Org` | `X` | `SOURCE` | `ORACLE` | 异常样本；不得出现在候选 API |
| `CCFG005-DS-CAT` | `CCFG005 Target Category Org` | `1` | `TARGET` | `ORACLE` | 非 SOURCE；不得出现在候选 API |
| `CCFG005-DS-TYP` | `CCFG005 MySQL Type Org` | `1` | `SOURCE` | `MYSQL` | 非 ORACLE；不得出现在候选 API |

- INSERT 语句：5
- 保留状态：保留（任务允许测试数据留存，无需清理）
- 合成连接字段均为不可达的 inert 值（`ccfg005-host.invalid` / `ccfg005_user` / `ccfg005_notreal`），非真实连接信息

## 2. 合成探针行（经产品 API 写入 `CDC_CLIENT_MULTIPLE`）

| CLIENT_ID | CLIENT_DESC | DATA_SOURCE_ID | FG_ACTIVE | 来源 |
|---|---|---|---|---|
| `CCFG005-OCC1` | `CCFG005 synthetic occupier` | `CCFG005-DS-LONG-0123456789ABCDE` | `1` | 探针 B 通过 `POST /api/clients` 建立占用关系 |
| `CCFG005-NEW` | `CCFG005 dialog create synthetic sample` | `CCFG-AC-R1-DS06` | `1` | 探针 B 经浏览器真实提交创建 |

最终状态：两行均保留，供复核读取。`CDC_CLIENT_MULTIPLE` 合计 92 行。

## 3. 夹具清理 DML（为可重复运行执行）

探针 B 的首轮与次轮运行各产生 `CCFG005-OCC1` / `CCFG005-NEW`；为保证下一次运行处于干净前置，执行了两次相同的定向清理：

```sql
DELETE FROM CDC_CLIENT_MULTIPLE WHERE CLIENT_ID IN ('CCFG005-OCC1','CCFG005-NEW');
COMMIT;
```

- DELETE 语句：2 次；每次影响 2 行；合计删除 4 行
- 只删除本任务自建的合成探针，未触碰其他既有记录
- 最终运行重新创建的两行保留

## 4. DML 统计

| 类别 | 数量 | 说明 |
|---|---|---|
| fixture INSERT | 5 | 005 合成数据源 |
| fixture DELETE | 2 | 探针 B 重跑前的合成探针清理；合计 4 行 |
| fixture DML 语句合计 | 7 | 不含 COMMIT（事务控制） |
| 保留的 005 合成数据源 | 5 | 无需清理 |
| 保留的 005 合成探针 | 2 | `CCFG005-OCC1`、`CCFG005-NEW` |
