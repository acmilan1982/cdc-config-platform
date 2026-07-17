# 页面候选字段与 ZK 原始字段映射

> 分析时间：2026-07-17 16:39 CST
> 说明：仅记录实际存在或可可靠推导的字段映射。

## 一、探针列表页面

| 页面候选字段 | ZK 路径/字段 | 类型 | 示例值 |
|-------------|-------------|------|--------|
| 探针名称 | clients/{id} 节点名 | string | hosp-006 |
| IP:端口 | clients/{id}/ip → ip | string | 10.16.18.86:10003 |
| 在线状态 | clients/{id}/alive 是否存在 | boolean | true/false |
| 运行状态码 | clients/{id}/status → code | string | 1002 |
| 运行状态描述 | clients/{id}/status → description | string | 进程运行正常 |
| 最后状态上报时间 | clients/{id}/status → updateTime | datetime | 2026-07-17 16:29:38 |
| 采集任务数 | clients/{id}/jobs 子节点数 | number | 1 |

## 二、探针详情页面

除列表字段外，增加：

| 页面候选字段 | ZK 路径/字段 | 类型 | 示例值 |
|-------------|-------------|------|--------|
| 进程 PID | clients/{id}/alive → pid | string | 19584 |
| 进程实例 UUID | clients/{id}/alive → instanceId | string | 40833a77-... |
| 进程启动时间 | clients/{id}/alive → startTime | datetime | 2026-07-17 16:29:12 |
| 心跳时间 | clients/{id}/alive → updateTime | datetime | 2026-07-17 16:29:12 |
| 最后 IP 更新时间 | clients/{id}/ip → updateTime | datetime | 2026-07-17 16:29:12 |
| 状态详情 | clients/{id}/status → detailInfo | string | everything under control |
| ZK 节点路径 | 完整路径 | string | /bsoft-cdc/clients/hosp-006 |

## 三、采集任务列表（探针下）

| 页面候选字段 | ZK 路径/字段 | 类型 | 示例值 |
|-------------|-------------|------|--------|
| 任务名称 | jobs/{jobId} 节点名 | string | my-19c |
| 任务状态码 | jobs/{jobId}/status → code | string | 1101 |
| 任务状态描述 | jobs/{jobId}/status → description | string | 增量模式运行中 |
| 最后状态上报时间 | jobs/{jobId}/status → updateTime | datetime | 2026-07-17 16:29:38 |
| SCN/Offset | jobs/{jobId}/scn → offset | string | （当前为空，增量阶段恢复） |
| SCN 更新时间 | jobs/{jobId}/scn → updateTime | datetime | （当前为空） |

## 四、中心端列表页面

| 页面候选字段 | ZK 路径/字段 | 类型 | 示例值 |
|-------------|-------------|------|--------|
| 中心端名称 | servers/{id} 节点名 | string | Server001 |
| IP:端口 | servers/{id}/ip → ip | string | 10.16.18.86:12002 |
| 运行状态码 | servers/{id}/status → code | string | 1001 |
| 运行状态描述 | servers/{id}/status → description | string | 系统初始化 |
| 最后更新时间 | servers/{id}/status → updateTime | datetime | 2026-07-14 15:23:02 |

## 五、通用 JSON 字段

所有 JSON 数据节点共用的字段：

| ZK 字段 | 类型 | 含义 | 涉及页面 |
|---------|------|------|----------|
| code | string | 状态码 | 探针列表/详情、任务列表、中心端列表 |
| description | string | 状态中文描述 | 同上 |
| detailInfo | string | 状态详情（可能含异常堆栈） | 探针详情、任务详情 |
| updateTime | string | 最后更新时间（yyyy-MM-dd HH:mm:ss） | 所有页面 |
| ip | string | IP:端口 | 探针列表、中心端列表 |
| pid | string | 进程 ID（仅 alive） | 探针详情 |
| instanceId | string | 实例 UUID（仅 alive） | 探针详情 |
| startTime | string | 启动时间（仅 alive） | 探针详情 |
| offset | string | 采集偏移量（仅 scn，可能为空） | 任务列表 |

## 六、无法从 ZK 直接获取的字段

需从数据库获取：

| 页面候选字段 | 原因 | 数据库来源 |
|-------------|------|-----------|
| 数据源名称 | job 名为简称 | CDC_DATA_SOURCE |
| 数据源类型 | ZK 不存储 | CDC_DATA_SOURCE.DATA_SOURCE_TYPE |
| 数据源分类 | ZK 不存储 | CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY |
| 表名/Schema | ZK 不存储 | CDC_DATA_SOURCE_EXTEND |
| 探针描述 | ZK 无此信息 | CDC_CLIENT_MULTIPLE |
| job 到数据源的映射 | job 名非标准 | 需关联 DATA_SOURCE_ID |

## 七、字段映射注意事项

1. **alive 节点不一定存在**：无 alive 不代表离线（可能是旧版本客户端），页面需同时展示 alive（在线）和 status.code（运行状态）两个维度
2. **scn 数据可能为空**：探针刚重启后 scn 为空 JSON `{}`，页面需处理空值
3. **detailInfo 可能含多行异常堆栈**：如 hosp-007，需考虑前端换行展示
4. **monitor_data 未启用**：不纳入页面
5. **所有时间字段为秒级字符串格式**，时区 CST
