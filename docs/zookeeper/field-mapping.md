# 页面候选字段与 ZK 原始字段映射

> 分析时间：2026-07-17 16:39 CST
> 更新日期：2026-07-17（根据项目负责人确认回答固化）
> 监控范围：`/bsoft-cdc/clients`

## 一、探针列表页面

| 页面字段 | 数据来源 | ZK 路径/字段 | 类型 | 说明 |
|---------|----------|-------------|------|------|
| 客户端名称 | ZK 节点名 | /bsoft-cdc/clients/{client} 节点名 | string | 如 hosp-006 |
| 在线状态 | **alive 节点是否存在** | alive 存在=在线，不存在=离线 | boolean | 项目负责人已确认 |
| IP 地址 | ZK 数据 | ip → ip | string | 10.16.18.86:10003 |
| 状态码 | ZK 数据 | status → code | string | 直接展示当前值，不映射枚举 |
| 状态描述 | ZK 数据 | status → description | string | 直接展示 |
| 详细信息 | ZK 数据 | status → detailInfo | string | 列表页可截断展示 |
| 最后更新时间 | ZK 数据 | status → updateTime | datetime | 直接展示 |
| 采集任务数 | ZK 子节点 | jobs 的子节点数 | number | 允许为 0 |

## 二、探针详情页面

除列表字段外：

| 页面字段 | 数据来源 | ZK 路径/字段 | 类型 | 说明 |
|---------|----------|-------------|------|------|
| 进程 PID | ZK 数据 | alive → pid | string | 仅在线时有值 |
| 实例 UUID | ZK 数据 | alive → instanceId | string | 仅在线时有值 |
| 启动时间 | ZK 数据 | alive → startTime | datetime | 仅在线时有值 |
| 完整详细信息 | ZK 数据 | status → detailInfo | string | **完整展示**，可能含异常堆栈 |

## 三、采集任务列表（探针下）

| 页面字段 | 数据来源 | ZK 路径/字段 | 类型 | 说明 |
|---------|----------|-------------|------|------|
| 任务名称 | ZK 节点名 | jobs/{job} 节点名 | string | 如 my-19c |
| 任务状态码 | ZK 数据 | jobs/{job}/status → code | string | 直接展示当前值 |
| 任务状态描述 | ZK 数据 | jobs/{job}/status → description | string | 直接展示 |
| SCN | ZK 数据 | jobs/{job}/scn → scn | string | **允许为空**（快照阶段） |
| SCN 更新时间 | ZK 数据 | jobs/{job}/scn → updateTime | datetime | 允许为空 |
| 任务最后更新时间 | ZK 数据 | jobs/{job}/status → updateTime | datetime | 直接展示 |

## 四、字段映射核心规则（项目负责人已确认）

| 规则 | 说明 |
|------|------|
| 在线判断唯一依据 | alive 节点是否存在 |
| SCN 字段名 | 使用 `scn`，不使用 `offset` |
| SCN 空值 | 快照阶段允许为空，页面和 API 必须支持 |
| status.code | 不预设枚举，直接展示当前实际值 |
| detailInfo | 详情页完整展示，列表页可截断；不基于其内容做状态判断 |
| jobs 空列表 | 允许为空，不据此判定异常 |
| alive 时间字段 | 不用于在线判断 |

## 五、不纳入的节点

| 排除项 | 原因 |
|--------|------|
| `/bsoft-cdc/servers` 及全部子节点 | 项目负责人确认暂不处理 |
| signals 节点 | 项目负责人确认已废弃 |
| monitor_data 节点 | 随 servers 一并排除 |

## 六、无法从 ZK 直接获取的字段

需从数据库获取：

| 页面候选字段 | 数据库来源 |
|-------------|-----------|
| 数据源名称 | CDC_DATA_SOURCE |
| 数据源类型 | CDC_DATA_SOURCE.DATA_SOURCE_TYPE |
| Schema/表名 | CDC_DATA_SOURCE_EXTEND |
| 探针描述 | CDC_CLIENT_MULTIPLE |
