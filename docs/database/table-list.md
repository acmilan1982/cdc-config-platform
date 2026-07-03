# 白名单表清单与分析状态

## 数据库信息

- 数据库类型：Oracle 19c
- 当前用户：CDC
- 当前 Schema：CDC
- 分析日期：2026-07-03

## 表清单

| 序号 | 表名 | 是否存在 | 表注释 | 记录数 | 字段数 | 主键 | 有数据 | 分析状态 |
|------|------|----------|--------|--------|--------|------|--------|----------|
| 1 | CDC_CLIENT_MULTIPLE | 是 | (无注释) | 21 | 4 | 无 | 是 | 已完成 |
| 2 | CDC_DATA_SOURCE | 是 | (乱码，仅存"???") | 15 | 17 | DATA_SOURCE_ID | 是 | 已完成 |
| 3 | CDC_DATA_SOURCE_EXTEND | 是 | (无注释) | 9 | 4 | 无 | 是 | 已完成 |
| 4 | CDC_DATA_SOURCE_RUN_STATE | 是 | (无注释) | 1 | 6 | CLIENT_ID, DATA_SOURCE_ID (复合) | 是 | 已完成 |
| 5 | CDC_DATA_SUBSCRIBE | 是 | (无注释) | 9 | 12 | 无 | 是 | 已完成 |
| 6 | CDC_LOG_CORRECT | 是 | (乱码，仅存"???") | 0 | 16 | CDC_LOG_ID | 否（空表） | 已完成 |
| 7 | CDC_LOG_ERROR | 是 | (无注释) | 1 | 16 | CDC_LOG_ID | 是 | 已完成 |
| 8 | CDC_SERVER | 是 | (无注释) | 1 | 4 | 无 | 是 | 已完成 |
| 9 | CDC_SERVER_CONFIG | 是 | (无注释) | 8 | 6 | ID_SERVER_CONFIG | 是 | 已完成 |
| 10 | CDC_TOPIC_OFFSET | 是 | (无注释) | 1 | 4 | SERVER_ID, KAFKA_TOPIC (复合) | 是 | 已完成 |

## 关键发现

1. **全部 10 张白名单表均存在**，可正常访问。
2. **2 张表注释乱码**：CDC_DATA_SOURCE 和 CDC_LOG_CORRECT 的表注释在数据库中存储为字面值 "???"（字节序列 3f,3f,3f），原始中文内容已不可恢复。
3. **4 张表无主键**：CDC_CLIENT_MULTIPLE、CDC_DATA_SOURCE_EXTEND、CDC_DATA_SUBSCRIBE、CDC_SERVER 无主键约束。
4. **1 张表为空表**：CDC_LOG_CORRECT 记录数为 0。
5. **无外键约束**：所有白名单表之间及对外部表均无数据库级外键约束。
6. **无序列、无触发器**：当前 Schema 下不存在任何序列或触发器。
7. **各表均有 NOT NULL 约束（Check 约束）**：所有表的 Check 约束均用于字段级 NOT NULL，无业务规则类 Check 约束。

## 已确认

- 白名单表存在性：10/10 存在
- 数据库连接正常
- 当前用户 CDC，Schema CDC，与 CLAUDE.md 一致
- 所有查询均为只读操作
