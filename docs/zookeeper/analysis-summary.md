# ZooKeeper 分析摘要

> 任务编号：ZK_MONITOR_ANALYSIS_001
> 分析时间：2026-07-17 16:38–16:40 CST
> 更新日期：2026-07-17（ZK_MONITOR_ANALYSIS_002：固化确认结论）
> 连接地址：192.168.174.51:2181

## 一、监控范围（已确认）

```text
本期监控根路径：/bsoft-cdc/clients
排除：/bsoft-cdc/servers（项目负责人确认暂不处理）
排除：signals 节点（项目负责人确认已废弃）
```

## 二、节点统计

| 指标 | 值 |
|------|-----|
| 监控范围内节点数 | 19（全局）/ 13（clients 子树） |
| 最大深度 | 5 |
| 客户端实例 | 2（hosp-006、hosp-007） |
| Job 实例 | 1（my-19c） |
| 临时节点 | 1（hosp-006/alive） |
| 永久节点 | 18 |

## 三、核心规则（项目负责人已确认）

### 在线状态

```text
在线 = /bsoft-cdc/clients/{client}/alive 临时节点存在
离线 = /bsoft-cdc/clients/{client}/alive 临时节点不存在
```

alive 依赖 ZK 临时节点和会话生命周期，不需要周期性更新数据。不使用 alive 的 updateTime 或 mtime 判断在线。

### 状态展示

- status.code：直接展示当前值，不预设完整枚举
- detailInfo：内容不固定（描述或异常堆栈），详情完整展示，列表可截断
- "everything under control" 是测试数据，不是固定协议

### SCN

- 快照阶段可为空 `{}`
- 增量阶段格式：`{"scn":"...", "updateTime":"..."}`
- 字段名统一使用 `scn`

### 其他

- jobs 可以为空，不据此判定异常
- signals 已废弃，不纳入开发
- servers 暂不纳入本期监控

## 四、页面设计前置条件

| 条件 | 状态 |
|------|------|
| 探针列表（名称/在线/IP/状态/任务数） | 具备 |
| 探针详情（PID/UUID/启动时间/完整 detailInfo） | 具备 |
| 任务列表（名称/状态/SCN） | 具备（SCN 允许为空） |
| 在线判断规则 | **已确认** |
| 阻塞问题 | **0 个** |

**结论：已具备进入页面详细设计的前置条件。**

## 五、待确认问题状态

全部 8 个问题已由项目负责人确认答复。ZK-Q-001 至 ZK-Q-008 均已关闭。详见 `docs/zookeeper/open-questions.md`。

## 六、输出文档

| 文档 | 路径 | 状态 |
|------|------|------|
| 连接信息 | docs/zookeeper/connection.md | 完成 |
| 节点树 | docs/zookeeper/node-tree.md | 完成 |
| 数据格式 | docs/zookeeper/node-data-format.md | 已更新（固化确认结论） |
| 节点类型映射 | docs/zookeeper/node-type-mapping.md | 已更新（固化确认结论） |
| 在线规则 | docs/zookeeper/online-rules.md | 已更新（固化确认结论） |
| 字段映射 | docs/zookeeper/field-mapping.md | 已更新（固化确认结论） |
| 待确认问题 | docs/zookeeper/open-questions.md | 已更新（全部已确认） |
| 分析摘要 | docs/zookeeper/analysis-summary.md | 已更新（本文档） |

## 七、结论分类

- **实际读取事实**：19 个节点，1 个临时节点（alive），JSON 数据格式
- **项目负责人已确认**：在线规则（alive 存在=在线）、监控范围（clients 子树）、SCN 生命周期、signals 已废弃、status.code 无需完整枚举、detailInfo 内容不固定、jobs 允许为空
- **页面设计建议**：探针列表/详情、任务列表均已具备数据来源，可进入详细设计阶段
