# 节点类型映射

> 分析时间：2026-07-17 16:39 CST
> 说明：基于实际节点路径、名称和数据推断，**推断不等于事实**。

## 节点类型总览

| 原始路径模式 | 推断类型 | 判断依据 | 可信度 | 页面候选名称 |
|-------------|----------|----------|--------|-------------|
| /bsoft-cdc | CDC 根节点 | 顶层路径，含 clients 和 servers | 高 | — |
| /bsoft-cdc/clients | 客户端注册目录 | 子节点为客户端实例 | 高 | 探针列表 |
| /bsoft-cdc/clients/{id} | CDC 探针实例 | hosp 前缀，含 ip/status/jobs | 高 | 探针详情 |
| /bsoft-cdc/clients/{id}/ip | 探针 IP 地址 | 数据含 ip 字段 | 确认 | 探针 IP |
| /bsoft-cdc/clients/{id}/status | 探针运行状态 | 数据含 code/description | 确认 | 探针状态 |
| /bsoft-cdc/clients/{id}/alive | 探针在线心跳 | **临时节点**，含 clientId/pid/instanceId/startTime | 确认 | 在线状态 |
| /bsoft-cdc/clients/{id}/jobs | 探针采集任务目录 | 子节点为 job 实例 | 高 | 任务列表 |
| /bsoft-cdc/clients/{id}/jobs/{jobId} | 采集任务实例 | 含 scn/status | 高 | 任务详情 |
| /bsoft-cdc/clients/{id}/jobs/{jobId}/status | 任务运行状态 | 数据含 code/description（1101=增量运行） | 确认 | 任务状态 |
| /bsoft-cdc/clients/{id}/jobs/{jobId}/scn | 采集进度 | 节点名 scn，数据可含 offset（当前为空） | 高 | SCN/Offset |
| /bsoft-cdc/servers | 服务端注册目录 | 子节点为服务端实例 | 高 | 中心端列表 |
| /bsoft-cdc/servers/{id} | CDC 中心端实例 | 命名 Server001，含 ip/status/monitor_data | 高 | 中心端详情 |
| /bsoft-cdc/servers/{id}/ip | 中心端 IP | 数据含 ip 字段 | 确认 | 中心端 IP |
| /bsoft-cdc/servers/{id}/status | 中心端运行状态 | 数据含 code/description | 确认 | 中心端状态 |
| /bsoft-cdc/servers/{id}/monitor_data | 监控数据 | 当前为 null，从未更新 | 低（未启用） | 监控数据 |

## alive 临时节点（核心发现）

`alive` 是本轮分析新发现的节点类型，且是**唯一使用 ZK 临时节点机制**的节点：

| 属性 | 值 |
|------|-----|
| 出现位置 | 仅 hosp-006（正常运行客户端） |
| 未出现位置 | hosp-007（异常客户端） |
| 节点类型 | **临时节点**（ephemeralOwner≠0） |
| 数据格式 | JSON（clientId/ip/pid/instanceId/startTime/updateTime） |

推断机制：客户端启动后创建 `alive` 临时节点维持心跳，断连时 ZK 自动删除。同时更新 `ip`/`status` 等永久节点记录最后已知状态。

## 服务端与客户端差异

| 维度 | 客户端（hosp-006） | 客户端（hosp-007） | 服务端（Server001） |
|------|-------------------|-------------------|---------------------|
| 子节点 | ip, status, alive, jobs | ip, status, jobs | ip, status, monitor_data |
| alive 节点 | 有（临时） | 无 | 无 |
| jobs 子节点 | 1（my-19c） | 0 | 无此节点 |
| 状态 | 1002 正常 | 9001 异常 | 1001 初始化 |

## job 实例命名

当前仅一个 job 实例：
- 名称：`my-19c`（可读名称，推断为 Oracle 19c 数据源简称）
- 上一轮分析中存在的 UUID 格式 job 名已随探针重建消失

## 未发现的节点类型

以下类型在当前 ZK 树中**未出现**：
- 数据源配置节点（配置存储在数据库）
- 订阅/表级任务配置节点（配置存储在数据库）
- 错误日志节点（日志存储在数据库）
- signals 控制信号节点（上轮存在但当前已消失）

推断：ZK 负责运行态注册与心跳，配置与日志类数据由 Oracle 数据库管理。
