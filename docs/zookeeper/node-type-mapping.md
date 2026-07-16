# 节点类型映射

> 分析时间：2026-07-16 17:11 CST
> 说明：基于实际节点路径、名称和数据推断，**推断不等于事实**。

## 节点类型总览

| 原始路径模式 | 推断类型 | 判断依据 | 可信度 | 页面候选名称 |
|-------------|----------|----------|--------|-------------|
| /bsoft-cdc | CDC 根节点 | 顶层路径，含 clients 和 servers | 高 | — |
| /bsoft-cdc/clients | 客户端注册目录 | 子节点为客户端实例 | 高 | 探针列表 |
| /bsoft-cdc/clients/{id} | CDC 客户端（探针）实例 | 以 hosp 前缀命名，含 ip/status/jobs | 高 | 探针详情 |
| /bsoft-cdc/clients/{id}/ip | 客户端 IP 地址 | 数据含 ip 字段 | 确认 | 探针 IP |
| /bsoft-cdc/clients/{id}/status | 客户端运行状态 | 数据含 code/description | 确认 | 探针状态 |
| /bsoft-cdc/clients/{id}/jobs | 客户端作业目录 | 子节点为 job 实例 | 高 | 采集任务列表 |
| /bsoft-cdc/clients/{id}/jobs/{jobId} | 采集任务（Job）实例 | 含 scn/signals/status，对应数据源 | 高 | 采集任务详情 |
| /bsoft-cdc/clients/{id}/jobs/{jobId}/status | Job 运行状态 | 数据含 code/description（1101=增量运行） | 确认 | 任务状态 |
| /bsoft-cdc/clients/{id}/jobs/{jobId}/scn | 采集进度/偏移量 | 数据含 offset 字段 | 高（仅 Oracle） | SCN / Offset |
| /bsoft-cdc/clients/{id}/jobs/{jobId}/signals | 控制信号 | 当前为空，名称推断为信号通道 | 中 | 控制信号 |
| /bsoft-cdc/servers | 服务端注册目录 | 子节点为服务端实例 | 高 | 中心端列表 |
| /bsoft-cdc/servers/{id} | CDC 服务端（中心端）实例 | 命名 Server001，含 ip/status/monitor_data | 高 | 中心端详情 |
| /bsoft-cdc/servers/{id}/ip | 服务端 IP 地址 | 数据含 ip 字段 | 确认 | 中心端 IP |
| /bsoft-cdc/servers/{id}/status | 服务端运行状态 | 数据含 code/description | 确认 | 中心端状态 |
| /bsoft-cdc/servers/{id}/monitor_data | 监控数据 | 当前为 null，预留字段 | 低（未启用） | 监控数据 |

## Job 实例命名与数据源关联

Job 实例存在两种命名风格：

| 命名风格 | 示例 | 推断数据源类型 | 特点 |
|----------|------|---------------|------|
| UUID | 5905f1ce83024410836b40ca0ebfc446 | 未知（可能对应 DATA_SOURCE_ID） | scn 为空（非 Oracle 或不支持 SCN） |
| 可读名称 | my-19c | Oracle 19c | scn 含 offset 数据 |

## 服务端与客户端差异

| 维度 | 客户端（clients） | 服务端（servers） |
|------|------------------|-------------------|
| 实例数 | 2 | 1 |
| 子节点 | ip, jobs, status | ip, monitor_data, status |
| 有 jobs | 是 | 否 |
| 有 monitor_data | 否 | 是（预留） |
| 实例命名 | hosp-{编号} | Server{编号} |

## 未发现的节点类型

以下类型在当前 ZK 树中**未出现**：
- 数据源配置节点（数据源信息存储在数据库中）
- 订阅/表级任务配置节点（存储在数据库中）
- 错误日志节点（存储在数据库中）
- 配置变更历史节点

推断：ZK 主要承担运行态注册与状态上报，配置类数据由 Oracle 数据库管理。
