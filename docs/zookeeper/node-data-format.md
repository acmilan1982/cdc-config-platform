# 节点数据格式

> 分析时间：2026-07-16 17:11 CST

## 数据格式分类

### 1. 空数据节点（dataLength = 0）

| 路径 | 说明 |
|------|------|
| /bsoft-cdc | 根节点 |
| /bsoft-cdc/clients | 客户端目录 |
| /bsoft-cdc/servers | 服务端目录 |
| /bsoft-cdc/clients/hosp-002 | 客户端实例 |
| /bsoft-cdc/clients/hosp-006 | 客户端实例 |
| /bsoft-cdc/servers/Server001 | 服务端实例 |
| /bsoft-cdc/clients/hosp-002/jobs/{id}/scn | 采集进度（空，已停止客户端） |
| /bsoft-cdc/clients/hosp-002/jobs/{id}/signals | 信号（空，已停止客户端） |
| /bsoft-cdc/clients/hosp-006/jobs/my-19c/signals | 信号（空） |

### 2. null 数据节点（dataLength = 4，内容为字面量 null）

| 路径 | 说明 |
|------|------|
| /bsoft-cdc/clients/hosp-002/jobs | job 目录 |
| /bsoft-cdc/clients/hosp-002/jobs/{id} | job 实例 |
| /bsoft-cdc/clients/hosp-006/jobs | job 目录 |
| /bsoft-cdc/clients/hosp-006/jobs/my-19c | job 实例 |
| /bsoft-cdc/servers/Server001/monitor_data | 监控数据（预留，未启用） |

### 3. JSON 数据节点

所有含业务数据的叶子节点均使用 JSON 格式。

## JSON 节点详细分析

### ip 节点

路径模式：`/bsoft-cdc/{type}/{instanceId}/ip`

```json
{"ip":"10.16.18.86:10003","updateTime":"2026-07-16 15:50:34"}
```

| 字段 | 类型 | 示例值 | 可空 | 说明 |
|------|------|--------|------|------|
| ip | string | "10.16.18.86:10003" | 否 | IP:端口，客户端为业务端口，服务端为管理端口 |
| updateTime | string | "2026-07-16 15:50:34" | 否 | 最后更新时间，格式 yyyy-MM-dd HH:mm:ss |

观察：
- 两个客户端实例（hosp-002、hosp-006）IP 相同（10.16.18.86:10003），同一机器
- 服务端端口 12002，客户端端口 10003
- updateTime 持续更新（hosp-006 在分析当日仍有更新）

### 客户端 status 节点

路径模式：`/bsoft-cdc/clients/{instanceId}/status`

```json
{"code":"1002","description":"进程运行正常","detailInfo":"everything under control","updateTime":"2026-07-16 15:50:43"}
```

| 字段 | 类型 | 示例值 | 可空 | 说明 |
|------|------|--------|------|------|
| code | string | "1002" | 否 | 状态码 |
| description | string | "进程运行正常" | 否 | 状态中文描述 |
| detailInfo | string | "everything under control" | 否 | 状态详情（当前均为固定短语） |
| updateTime | string | "2026-07-16 15:50:43" | 否 | 最后更新时间 |

### 服务端 status 节点

路径模式：`/bsoft-cdc/servers/{instanceId}/status`

```json
{"code":"1001","description":"系统初始化","detailInfo":"everything under control","updateTime":"2026-07-14 15:23:02"}
```

字段结构与客户端 status 完全一致。

### job status 节点

路径模式：`/bsoft-cdc/clients/{instanceId}/jobs/{jobId}/status`

```json
{"code":"1101","description":"增量模式运行中","detailInfo":"everything under control","updateTime":"2026-07-16 15:58:19"}
```

字段结构与客户端/服务端 status 完全一致。

### scn 节点（采集进度）

路径模式：`/bsoft-cdc/clients/{instanceId}/jobs/{jobId}/scn`

**运行中实例（my-19c）：**
```json
{"offset":"31120290432","updateTime":"2026-07-16 16:00:04"}
```

**已停止实例（5905f1ce...）：**
空数据（dataLength = 0）

| 字段 | 类型 | 示例值 | 可空 | 说明 |
|------|------|--------|------|------|
| offset | string | "31120290432" | 未知 | 采集偏移量（Oracle SCN 或类似概念） |
| updateTime | string | "2026-07-16 16:00:04" | 否 | 最后更新时间 |

### signals 节点

路径模式：`/bsoft-cdc/clients/{instanceId}/jobs/{jobId}/signals`

所有已检查的 signals 节点数据均为空（dataLength = 0），可能仅在需要发送控制信号时才会写入数据。

## 状态码汇总

| 节点类型 | code | description | 出现位置 |
|----------|------|-------------|----------|
| 客户端 | 1002 | 进程运行正常 | hosp-006 |
| 客户端 | 2002 | 进程已停止 | hosp-002 |
| 服务端 | 1001 | 系统初始化 | Server001 |
| Job | 1101 | 增量模式运行中 | hosp-006/my-19c、hosp-002/5905f1ce... |

状态码推断规律：
- 1xxx：正常运行状态
- 2xxx：停止或异常状态

## 数据格式总结

| 格式类型 | 节点数 | 占比 |
|----------|--------|------|
| 空数据（0 字节） | 9 | 39% |
| null（4 字节） | 5 | 22% |
| JSON | 9 | 39% |
| **合计** | **23** | **100%** |

所有 JSON 节点字段结构一致，共用相同的字段命名约定：`code`、`description`、`detailInfo`、`updateTime`、`ip`、`offset`。

## 敏感信息检查

- IP 地址：均为内网地址（10.16.18.86），非敏感
- 无密码、Token、密钥、JDBC URL 等敏感字段
- 无患者数据或其他业务敏感数据
