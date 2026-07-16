# 页面候选字段与 ZK 原始字段映射

> 分析时间：2026-07-16 17:11 CST
> 说明：仅记录实际存在或可可靠推导的字段映射。

## 一、探针列表页面

| 页面候选字段 | 数据来源 | ZK 原始路径/字段 | 类型 | 说明 |
|-------------|----------|-----------------|------|------|
| 探针名称 | ZK 节点名 | /bsoft-cdc/clients/{id} 的节点名 | string | 如 hosp-002、hosp-006 |
| IP 地址 | ZK 数据 | clients/{id}/ip → ip | string | 如 10.16.18.86:10003 |
| 在线状态 | ZK 数据 | clients/{id}/status → code | string | 1002=在线, 2002=离线 |
| 状态描述 | ZK 数据 | clients/{id}/status → description | string | "进程运行正常" |
| 最后上报时间 | ZK 数据 | clients/{id}/status → updateTime | datetime | 2026-07-16 15:50:43 |
| 最后 IP 更新时间 | ZK 数据 | clients/{id}/ip → updateTime | datetime | 2026-07-16 15:50:34 |
| 采集任务数 | ZK 子节点 | clients/{id}/jobs 的子节点数 | number | 统计 jobs 下子节点数 |

## 二、探针详情页面

除探针列表字段外，增加：

| 页面候选字段 | 数据来源 | ZK 原始路径/字段 | 类型 | 说明 |
|-------------|----------|-----------------|------|------|
| 探针详情信息 | ZK 数据 | clients/{id}/status → detailInfo | string | 当前值固定为 "everything under control" |
| 节点路径 | ZK 路径 | /bsoft-cdc/clients/{id} | string | ZK 完整路径 |

## 三、采集任务列表（探针下）

| 页面候选字段 | 数据来源 | ZK 原始路径/字段 | 类型 | 说明 |
|-------------|----------|-----------------|------|------|
| 任务名称 | ZK 节点名 | jobs/{jobId} 的节点名 | string | my-19c 或 UUID |
| 任务状态码 | ZK 数据 | jobs/{jobId}/status → code | string | 1101=增量运行中 |
| 任务状态描述 | ZK 数据 | jobs/{jobId}/status → description | string | "增量模式运行中" |
| 最后上报时间 | ZK 数据 | jobs/{jobId}/status → updateTime | datetime | 2026-07-16 15:58:19 |
| SCN/Offset | ZK 数据 | jobs/{jobId}/scn → offset | string | "31120290432"（仅部分数据源有值） |
| SCN 更新时间 | ZK 数据 | jobs/{jobId}/scn → updateTime | datetime | 2026-07-16 16:00:04 |

## 四、中心端列表页面

| 页面候选字段 | 数据来源 | ZK 原始路径/字段 | 类型 | 说明 |
|-------------|----------|-----------------|------|------|
| 中心端名称 | ZK 节点名 | /bsoft-cdc/servers/{id} 的节点名 | string | Server001 |
| IP 地址 | ZK 数据 | servers/{id}/ip → ip | string | 10.16.18.86:12002 |
| 运行状态 | ZK 数据 | servers/{id}/status → code | string | 1001 |
| 状态描述 | ZK 数据 | servers/{id}/status → description | string | "系统初始化" |
| 最后更新时间 | ZK 数据 | servers/{id}/status → updateTime | datetime | 2026-07-14 15:23:02 |

## 五、跨 ZK 节点类型的通用字段

所有 JSON 数据节点共用的字段：

| ZK 字段 | 含义 | 涉及页面 |
|---------|------|----------|
| code | 状态码 | 探针列表、任务列表、中心端列表 |
| description | 状态中文描述 | 探针列表、任务列表、中心端列表 |
| detailInfo | 状态详情 | 探针详情、任务详情、中心端详情 |
| updateTime | 最后更新时间 | 所有页面 |
| ip | IP:端口 | 探针列表、中心端列表 |
| offset | 采集偏移量 | 任务列表（特定数据源） |

## 六、无法从 ZK 直接获取的字段

以下页面可能需要的字段**不存在于当前 ZK 数据中**，需从数据库获取：

| 页面候选字段 | 原因 | 替代来源 |
|-------------|------|----------|
| 数据源名称 | ZK job 名为 UUID 或简称 | CDC_DATA_SOURCE 表 |
| 数据源类型 | ZK 不存储类型信息 | CDC_DATA_SOURCE.DATA_SOURCE_TYPE |
| 数据源分类 | ZK 不存储分类信息 | CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY |
| 表名/Schema | ZK 不存储表级信息 | CDC_DATA_SOURCE_EXTEND 表 |
| 客户端描述 | ZK 无描述字段 | CDC_CLIENT_MULTIPLE 表 |
| 中心端描述 | ZK 无描述字段 | CDC_SERVER 表 |

## 七、字段映射注意事项

1. **job 命名不统一**：UUID（如 5905f1ce...）和可读名称（如 my-19c）并存，需设计映射逻辑关联到 DATA_SOURCE_ID 或 DATA_SOURCE_NAME
2. **scn 数据可能为空**：非 Oracle 数据源或不支持 SCN 的数据源，scn 节点为空，页面需处理空值情况
3. **monitor_data 未启用**：Server001/monitor_data 为 null，暂不纳入页面
4. **signals 始终为空**：不纳入页面字段
