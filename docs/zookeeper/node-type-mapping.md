# 节点类型映射

> 分析时间：2026-07-17 16:39 CST
> 更新日期：2026-07-17（根据项目负责人确认回答固化）
> 说明：标注"项目负责人已确认"的条目为正式结论，其余为推断。

## 一、监控范围

```text
监控根路径：/bsoft-cdc/clients
```

当前排除：
- `/bsoft-cdc/servers` — 项目负责人确认暂不处理
- `signals` 节点 — 项目负责人确认已废弃

## 二、节点类型总览

### 客户端进程节点（监控范围）

| 原始路径模式 | 节点类型 | 判断依据 | 可信度 |
|-------------|----------|----------|--------|
| /bsoft-cdc/clients | 客户端注册目录 | 子节点为独立进程实例 | 高 |
| /bsoft-cdc/clients/{client} | 客户端进程 | 每个子节点代表一个独立进程 | **项目负责人已确认** |
| /bsoft-cdc/clients/{client}/alive | 客户端在线会话 | 临时节点，存在即在线 | **项目负责人已确认** |
| /bsoft-cdc/clients/{client}/status | 客户端当前状态 | 含 code/description/detailInfo | 确认 |
| /bsoft-cdc/clients/{client}/ip | 客户端 IP 信息 | 含 ip/updateTime | 确认 |
| /bsoft-cdc/clients/{client}/jobs | 采集任务目录 | 子节点为 job 实例 | 高 |
| /bsoft-cdc/clients/{client}/jobs/{job} | 采集任务实例 | 具体数据源采集任务 | **项目负责人已确认** |
| /bsoft-cdc/clients/{client}/jobs/{job}/status | 任务运行状态 | 含 code/description | 确认 |
| /bsoft-cdc/clients/{client}/jobs/{job}/scn | 采集进度（SCN） | 快照阶段可为空，增量阶段含 scn 值 | **项目负责人已确认** |

### 已废弃或不纳入的节点

| 原始路径 | 状态 | 依据 |
|----------|------|------|
| /bsoft-cdc/clients/{client}/jobs/{job}/signals | **已废弃** | 项目负责人确认，今后不再使用 |
| /bsoft-cdc/servers 及全部子节点 | **本期不处理** | 项目负责人确认暂不处理 |

## 三、关键判断规则（已确认）

### alive 节点

```text
alive 存在 → 客户端在线
alive 不存在 → 客户端离线
```

- alive 依赖 ZK 临时节点和会话生命周期
- alive 不需要周期性更新数据
- 不使用 alive 的 updateTime/mtime 判断在线

### status.code

- 只读取当前实际值并展示
- 不需要掌握完整枚举列表
- 已观察到的值（1002/9001 等）仅为示例

### detailInfo

- 内容不固定，可能是普通描述或异常堆栈
- "everything under control" 不是固定协议，仅为测试数据
- 详情页完整展示，列表页可截断

### jobs 子节点

- jobs 可以为空（进程刚启动即关闭的情况）
- jobs 为空不直接判定为异常

## 四、未发现的节点类型

以下在当前 ZK 树中未出现：
- 数据源配置节点（存储于数据库）
- 订阅/表级任务配置节点（存储于数据库）
- 错误日志节点（存储于数据库）
