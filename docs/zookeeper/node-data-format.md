# 节点数据格式

> 分析时间：2026-07-17 16:39 CST
> 更新日期：2026-07-17（根据项目负责人确认回答固化）

## 监控范围

本期监控路径：`/bsoft-cdc/clients`

## 数据格式分类

### 空数据节点（dataLength = 0）

| 路径 | 说明 |
|------|------|
| /bsoft-cdc/clients/{client} | 客户端进程实例 |

### null 数据节点

| 路径 | 说明 |
|------|------|
| /bsoft-cdc/clients/{client}/jobs | 采集任务目录 |

### 可能为空的 JSON 数据节点

| 路径 | 说明 |
|------|------|
| /bsoft-cdc/clients/{client}/jobs/{job} | 采集任务实例；可能为空 JSON `{}`，也可能包含数据源业务名称 |

### JSON 数据节点

所有含业务数据的叶子节点均使用 JSON 格式。

## JSON 节点详细分析

### ip 节点

路径：`/bsoft-cdc/clients/{client}/ip`

```json
{"ip":"10.16.18.86:10003","updateTime":"2026-07-17 16:29:12"}
```

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| ip | string | 否 | IP:端口 |
| updateTime | string | 否 | 最后更新时间（yyyy-MM-dd HH:mm:ss，CST） |

### status 节点

路径：`/bsoft-cdc/clients/{client}/status`

正常示例（hosp-006）：
```json
{"code":"1002","description":"进程运行正常","detailInfo":"everything under control","updateTime":"2026-07-17 16:29:38"}
```

异常示例（hosp-007）：
```json
{"code":"9001","description":"进程异常","detailInfo":"java.sql.SQLException: ORA-00257: Archiver error. Connect AS SYSDBA only until resolved.\n","updateTime":"2026-07-17 16:23:16"}
```

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| code | string | 否 | 状态码，直接展示当前值，不预设枚举 |
| description | string | 否 | 状态中文描述 |
| detailInfo | string | 否 | **项目负责人已确认**：内容不固定，可能是描述或异常堆栈；"everything under control" 是测试数据，不视为固定协议 |
| updateTime | string | 否 | 最后更新时间 |

### alive 节点（临时节点）

路径：`/bsoft-cdc/clients/{client}/alive`

```json
{"clientId":"hosp-006","ip":"10.16.18.86:10003","pid":"19584","instanceId":"40833a77-ee6f-43b7-a302-0edcdae476ff","startTime":"2026-07-17 16:29:12","updateTime":"2026-07-17 16:29:12"}
```

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| clientId | string | 否 | 客户端标识 |
| ip | string | 否 | IP:端口 |
| pid | string | 否 | 操作系统进程 ID |
| instanceId | string | 否 | 进程实例 UUID |
| startTime | string | 否 | 进程启动时间 |
| updateTime | string | 否 | 创建时间，**不用于在线判断** |

**项目负责人已确认**：alive 依赖 ZK 临时节点和会话生命周期，不需要周期性更新数据。

### job status 节点

路径：`/bsoft-cdc/clients/{client}/jobs/{job}/status`

```json
{"code":"1101","description":"增量模式运行中","detailInfo":"everything under control","updateTime":"2026-07-17 16:29:38"}
```

字段结构与客户端 status 一致。detailInfo 同样内容不固定。

### scn 节点

路径：`/bsoft-cdc/clients/{client}/jobs/{job}/scn`

**快照阶段（可为空）：**
```json
{}
```

**增量阶段（项目负责人已确认格式）：**
```json
{"scn":"31120290432","updateTime":"2026-07-16 16:00:04"}
```

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| scn | string | **是**（快照阶段为空） | SCN 值，项目负责人确认字段名为 `scn` |
| updateTime | string | 否（增量阶段） | SCN 更新时间 |

**项目负责人已确认**：快照阶段 SCN 可为空，进入增量阶段后写入。统一使用 `scn` 字段名。

### job 节点（job 元数据）

路径：`/bsoft-cdc/clients/{client}/jobs/{job}`

job 节点本身可以保存数据源业务名称等元数据：

```json
{"dataSourceOrg":"杭州市第一人民医院","updateTime":"2026-07-22 15:54:20"}
```

也可能为空 JSON：`{}`

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| dataSourceOrg | string | **是** | 数据源业务名称，用于页面展示；缺失或为空时回退展示 job 节点名 |
| updateTime | string | 是 | 元数据更新时间 |

## 状态码（已观察到的示例）

以下仅为当前已观察到的值，**不是完整枚举**：

| code（示例） | description | 出现位置 |
|-------------|-------------|----------|
| 1002 | 进程运行正常 | hosp-006 |
| 9001 | 进程异常 | hosp-007 |
| 1101 | 增量模式运行中 | my-19c/job |

**项目负责人已确认**：不需要掌握完整枚举，只需读取并展示当前实际值。

## 已废弃节点

| 路径 | 状态 |
|------|------|
| /bsoft-cdc/clients/{client}/jobs/{job}/signals | **已废弃**（项目负责人确认，今后不再使用） |

## 敏感信息

- 所有 IP 为内网地址（10.16.18.86）
- 无密码、Token、密钥、JDBC URL
- detailInfo 中的异常堆栈不涉及敏感信息泄露（项目负责人确认）
