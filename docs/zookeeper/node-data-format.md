# 节点数据格式

> 分析时间：2026-07-17 16:39 CST

## 数据格式分类

### 1. 空数据节点（dataLength = 0）

| 路径 | 说明 |
|------|------|
| /bsoft-cdc | 根节点 |
| /bsoft-cdc/clients | 客户端目录 |
| /bsoft-cdc/servers | 服务端目录 |
| /bsoft-cdc/clients/hosp-006 | 客户端实例 |
| /bsoft-cdc/clients/hosp-007 | 客户端实例 |
| /bsoft-cdc/servers/Server001 | 服务端实例 |

### 2. null 数据节点（dataLength = 2~4，内容为字面量 null）

| 路径 | dataLength | 说明 |
|------|-----------|------|
| /bsoft-cdc/clients/hosp-006/jobs | 2 | job 目录 |
| /bsoft-cdc/clients/hosp-006/jobs/my-19c | 2 | job 实例 |
| /bsoft-cdc/clients/hosp-007/jobs | 2 | job 目录（无子节点） |
| /bsoft-cdc/servers/Server001/monitor_data | 4 | 监控数据（预留） |

### 3. JSON 数据节点

所有含业务数据的叶子节点均使用 JSON 格式。

## JSON 节点详细分析

### ip 节点

路径模式：`/bsoft-cdc/{type}/{instanceId}/ip`

hosp-006：
```json
{"ip":"10.16.18.86:10003","updateTime":"2026-07-17 16:29:12"}
```

hosp-007：
```json
{"ip":"10.16.18.86:10003","updateTime":"2026-07-17 16:23:01"}
```

Server001（3天前，未更新）：
```json
{"ip":"10.16.18.86:12002","updateTime":"2026-07-14 15:23:02"}
```

| 字段 | 类型 | 示例值 | 可空 | 说明 |
|------|------|--------|------|------|
| ip | string | "10.16.18.86:10003" | 否 | IP:端口，客户端 10003，服务端 12002 |
| updateTime | string | "2026-07-17 16:29:12" | 否 | 最后更新时间，格式 yyyy-MM-dd HH:mm:ss |

### 客户端 status 节点

hosp-006（正常）：
```json
{"code":"1002","description":"进程运行正常","detailInfo":"everything under control","updateTime":"2026-07-17 16:29:38"}
```

hosp-007（异常）：
```json
{"code":"9001","description":"进程异常","detailInfo":"java.sql.SQLException: ORA-00257: Archiver error. Connect AS SYSDBA only until resolved.\n","updateTime":"2026-07-17 16:23:16"}
```

| 字段 | 类型 | 示例值 | 可空 | 说明 |
|------|------|--------|------|------|
| code | string | "1002" | 否 | 状态码 |
| description | string | "进程运行正常" | 否 | 状态中文描述 |
| detailInfo | string | "everything under control" | 否 | 状态详情，可能含异常堆栈 |
| updateTime | string | "2026-07-17 16:29:38" | 否 | 最后更新时间 |

### alive 节点（临时节点）

**仅 hosp-006 存在，hosp-007 无此节点。**

```json
{"clientId":"hosp-006","ip":"10.16.18.86:10003","pid":"19584","instanceId":"40833a77-ee6f-43b7-a302-0edcdae476ff","startTime":"2026-07-17 16:29:12","updateTime":"2026-07-17 16:29:12"}
```

| 字段 | 类型 | 示例值 | 可空 | 说明 |
|------|------|--------|------|------|
| clientId | string | "hosp-006" | 否 | 客户端标识 |
| ip | string | "10.16.18.86:10003" | 否 | IP:端口 |
| pid | string | "19584" | 否 | 操作系统进程 ID |
| instanceId | string | "40833a77-..." | 否 | 进程实例 UUID |
| startTime | string | "2026-07-17 16:29:12" | 否 | 进程启动时间 |
| updateTime | string | "2026-07-17 16:29:12" | 否 | 心跳时间 |

**alive 是唯一的临时节点**（ephemeralOwner=0x10000028e490044）。客户端断连时自动删除。

### job status 节点

```json
{"code":"1101","description":"增量模式运行中","detailInfo":"everything under control","updateTime":"2026-07-17 16:29:38"}
```

字段结构与客户端 status 一致，code=1101 表示增量采集运行中。

### scn 节点（采集进度）

当前 my-19c 的 scn 节点数据为空 JSON：
```json
{}
```

数据长度为 2 字节。上一轮分析（7月16日）该节点数据为：
```json
{"offset":"31120290432","updateTime":"2026-07-16 16:00:04"}
```

**差异**：探针重启后 scn 重置为空对象，推断开始增量采集后 offset 字段才会重新出现。

## 状态码汇总

| code | description | 位置 | 含义推断 |
|------|-------------|------|----------|
| 1001 | 系统初始化 | Server001 | 服务端已启动 |
| 1002 | 进程运行正常 | hosp-006 | 客户端正常运行 |
| 1101 | 增量模式运行中 | my-19c/job | Job 增量采集进行中 |
| 9001 | 进程异常 | hosp-007 | 客户端异常（含错误详情） |

状态码规律：1xxx=正常，9xxx=异常。上一轮分析中存在的 2002（进程已停止）本次未出现。

## 数据格式总结

| 格式类型 | 节点数 | 占比 |
|----------|--------|------|
| 空数据（0 字节） | 6 | 32% |
| null（2~4 字节） | 4 | 21% |
| JSON（含空 JSON） | 9 | 47% |
| **合计** | **19** | **100%** |

### 与上一轮（7月16日）的关键差异

| 维度 | 7月16日 | 7月17日 |
|------|---------|---------|
| 总节点数 | 23 | 19 |
| 临时节点 | 0 | **1**（alive） |
| signals 节点 | 2 个 | **0** 个 |
| scn 数据 | offset+updateTime | **空 JSON {}** |
| 状态码 | 1001/1002/1101/2002 | 1001/1002/1101/**9001** |
| detailInfo | 全部固定短语 | **含完整异常堆栈**（hosp-007） |

## 敏感信息检查

- **hosp-007/status.detailInfo** 包含完整 Java 异常信息（ORA-00257 归档错误），非密码/密钥类敏感信息
- 所有 IP 均为内网地址（10.16.18.86）
- 无密码、Token、密钥、JDBC URL 等敏感字段
- 无患者或业务敏感数据
