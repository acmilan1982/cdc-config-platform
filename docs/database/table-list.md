# 白名单表清单与分析状态

## 数据库信息

- 数据库类型：Oracle 19c
- 当前用户：CDC
- 当前 Schema：CDC
- 分析日期：2026-07-03
- 最近更新：2026-07-03（根据项目负责人答复更新）

## 表清单

| 序号 | 表名 | 是否存在 | 表注释 | 记录数 | 字段数 | 主键 | 有数据 | 分析状态 |
|------|------|----------|--------|--------|--------|------|--------|----------|
| 1 | CDC_CLIENT_MULTIPLE | 是 | (无注释) | 3 | 4 | CLIENT_ID | 是 | 已更新 |
| 2 | CDC_DATA_SOURCE | 是 | 数据源，包括源库，目标库 | 15 | 17 | DATA_SOURCE_ID | 是 | 已更新 |
| 3 | CDC_DATA_SOURCE_EXTEND | 是 | (无注释) | 9 | 4 | 无 | 是 | 已完成 |
| 4 | CDC_DATA_SOURCE_RUN_STATE | 是 | (无注释) | 1 | 6 | CLIENT_ID, DATA_SOURCE_ID (复合) | 是 | 已完成 |
| 5 | CDC_DATA_SUBSCRIBE | 是 | (无注释) | 9 | 12 | DATA_SUB_ID | 是 | 已更新 |
| 6 | CDC_LOG_CORRECT | 是 | (乱码，仅存"???") | 0 | 16 | CDC_LOG_ID | 否（空表） | 已更新 |
| 7 | CDC_LOG_ERROR | 是 | (无注释) | 1 | 16 | CDC_LOG_ID | 是 | 已完成 |
| 8 | CDC_SERVER | 是 | (无注释) | 1 | 4 | SERVER_ID | 是 | 已更新 |
| 9 | CDC_SERVER_CONFIG | 是 | (无注释) | 8 | 6 | ID_SERVER_CONFIG | 是 | 已完成 |
| 10 | CDC_TOPIC_OFFSET | 是 | (无注释) | 1 | 4 | SERVER_ID, KAFKA_TOPIC (复合) | 是 | 已更新 |

## 本次更新说明（基于项目负责人答复）

| 变更项 | 说明 |
|--------|------|
| CDC_CLIENT_MULTIPLE 主键 | CLIENT_ID 已设为主键（PK_CDC_CLIENT_MULTIPLE），重复记录已清理（21→3条） |
| CDC_DATA_SUBSCRIBE 主键 | DATA_SUB_ID 已设为主键（PK_CDC_DATA_SUBSCRIBE） |
| CDC_DATA_SUBSCRIBE 字段注释 | 12个字段均已添加注释 |
| CDC_SERVER 主键 | SERVER_ID 已设为主键（PK_CDC_SERVER） |
| CDC_SERVER 字段注释 | 4个字段均已添加注释 |
| CDC_TOPIC_OFFSET 字段注释 | 4个字段均已添加注释 |
| CDC_DATA_SOURCE 表注释 | 已更新为"数据源，包括源库，目标库" |
| CDC_LOG_CORRECT RAW_MESSAGE | 类型已从 BLOB 更新为 CLOB |

## 已确认

- 白名单表存在性：10/10 存在
- 数据库连接正常
- 当前用户 CDC，Schema CDC，与 CLAUDE.md 一致
- 所有查询均为只读操作
- 项目负责人已确认多个问题的答复（详见 open-questions.md）
