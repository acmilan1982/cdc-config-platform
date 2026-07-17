# ZooKeeper 分析摘要

> 任务编号：ZK_MONITOR_ANALYSIS_001
> 分析时间：2026-07-17 16:38–16:40 CST
> 连接地址：192.168.174.51:2181
> 根路径：/bsoft-cdc

## 一、节点统计

| 指标 | 值 |
|------|-----|
| 总节点数 | 19 |
| 最大深度 | 5 |
| 顶层子节点 | 2（clients、servers） |
| 客户端实例 | 2（hosp-006、hosp-007） |
| 服务端实例 | 1（Server001） |
| Job 实例 | 1（my-19c） |

## 二、节点类型分布

| 类型 | 数量 |
|------|------|
| 目录/容器节点 | 10 |
| IP 节点 | 3 |
| 状态节点（client/job/server） | 4 |
| 心跳节点（alive） | 1 |
| 进度节点（scn） | 1 |
| 监控数据节点（monitor_data） | 1 |

## 三、临时节点与永久节点

| 类型 | 数量 |
|------|------|
| 永久节点（ephemeralOwner=0x0） | 18 |
| **临时节点（ephemeralOwner≠0x0）** | **1**（hosp-006/alive） |

**与上一轮分析（2026-07-16）的关键差异**：上一轮全部 23 个节点均为永久节点，本轮发现 1 个临时节点（alive）。这改变了在线状态判断的核心逻辑。

## 四、数据格式

| 格式 | 节点数 | 占比 |
|------|--------|------|
| 空数据 | 6 | 32% |
| null | 4 | 21% |
| JSON | 9 | 47% |

## 五、状态码

| code | description | 位置 | 推断 |
|------|-------------|------|------|
| 1001 | 系统初始化 | Server001 | 服务端在线 |
| 1002 | 进程运行正常 | hosp-006 | 客户端正常 |
| 1101 | 增量模式运行中 | my-19c | Job 运行中 |
| 9001 | 进程异常 | hosp-007 | 客户端异常 |

规律：1xxx=正常，9xxx=异常。

## 六、在线状态判断

### 可确认
- **alive 临时节点是否存在** = 最可靠的实时在线判断依据（ZK 原生机制）
- status.code（1xxx=在线/正常，9xxx=异常）
- status.updateTime 周期性更新

### 不可靠
- 仅凭永久节点是否存在判断（全部都是永久节点）
- ZK ctime（创建时间静态）

## 七、敏感信息

- hosp-007/status.detailInfo 含 Java 异常堆栈（ORA-00257），非密码/密钥类
- IP 均为内网地址（10.16.18.86）
- 无密码、Token、密钥、JDBC URL

## 八、页面设计前置条件

| 页面 | 核心字段来源 | 前置条件 |
|------|-------------|----------|
| 探针列表 | ZK clients 子节点 + status + alive | 具备 |
| 探针详情 | ZK ip/status/alive | 具备 |
| 任务列表 | ZK jobs 子节点 + job status | 具备（需处理 scn 空值） |
| 中心端列表 | ZK servers 子节点 + status | 具备（在线状态判断待确认） |

总体：**具备页面设计前置条件**。

## 九、阻塞问题

| 编号 | 问题 | 阻塞程度 |
|------|------|----------|
| ZK-Q-001 | alive 节点是否通用 | 部分阻塞 |
| ZK-Q-002 | Server001 在线状态 | 部分阻塞 |
| ZK-Q-003~008 | 其他待确认事项 | 不阻塞 |

## 十、结论分类

- **实际读取事实**：19 个节点，1 个临时节点（alive），4 种状态码，JSON 数据格式，hosp-007 处于异常状态
- **基于节点结构的推断**：alive 为心跳机制，1xxx/9xxx 状态码规律，scn 在增量阶段写入
- **页面设计建议**：探针列表/详情、任务列表、中心端列表均已具备数据来源
- **待项目负责人确认**：8 个问题，其中 2 个部分阻塞

## 十一、输出文档

| 文档 | 路径 |
|------|------|
| 连接信息 | docs/zookeeper/connection.md |
| 节点树 | docs/zookeeper/node-tree.md |
| 数据格式 | docs/zookeeper/node-data-format.md |
| 节点类型映射 | docs/zookeeper/node-type-mapping.md |
| 在线规则 | docs/zookeeper/online-rules.md |
| 字段映射 | docs/zookeeper/field-mapping.md |
| 待确认问题 | docs/zookeeper/open-questions.md |
| 分析摘要 | docs/zookeeper/analysis-summary.md（本文档） |
