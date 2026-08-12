# ZooKeeper 节点监控（zk-node-monitor）

## 1. 功能名称

**ZooKeeper 节点监控**。

## 2. 功能定位

属于 CDC 配置管理平台"运行监控"模块下的**只读状态监控**功能。不执行配置变更，不控制 CDC 客户端启停。

## 3. 业务背景和用途

CDC 同步客户端进程在运行时将自身状态信息注册到 ZooKeeper 的 `/bsoft-cdc/clients` 路径下，包括在线标识、IP 地址、采集任务列表、SCN 进度等。

运维和开发人员通过本功能查看上述信息，了解：
- 哪些 CDC 客户端正在运行；
- 各客户端下有哪些采集任务及其 SCN 采集进度；
- 客户端和采集任务的在线/离线状态。

客户端和采集任务均通过对应的 `alive` 临时节点判断在线状态。成功查询后，节点存在表示在线，节点不存在表示离线；查询失败或无法确认节点状态时，应显示未知或读取异常。普通身份、描述、SCN 等数据节点缺失不得用于推断离线。

## 4. 数据来源

数据直接来源于 ZooKeeper，不经过数据库业务表。

监控路径：`/bsoft-cdc/clients`（当前有效配置见 [ENVIRONMENT.md](../../baseline/ENVIRONMENT.md) §3）。

具体节点结构和数据格式参见 [node-data-format.md](../../zookeeper/node-data-format.md)，在线判定规则参见 [online-rules.md](../../zookeeper/online-rules.md)。

## 5. 数据操作边界

**严格只读：**

- 不创建 ZooKeeper 节点；
- 不修改节点数据；
- 不删除节点；
- 不向数据库写入任何业务数据；
- 不提供客户端启停或其他控制操作。

后端通过 `ZooKeeperReadOnlyClient` 封装只读访问，仅暴露 `getChildren()` 和 `getData()` 操作。详见 [CLAUDE.md](../../../CLAUDE.md) §14。

## 6. 与其他功能的职责关系

| 功能 | 职责 | 与本功能的关系 |
|---|---|---|
| **job-failure-monitor**（故障监控） | Job 故障事件追踪、自动重启和恢复过程 | 职责分离：本功能展示 ZK 实时在线状态和 SCN，故障监控关注数据库中的故障事件和处理链路 |
| **large-screen**（数据同步统计大屏） | 基于 CDC 日志的增量统计可视化 | 职责分离：本功能展示 ZK 节点级运行信息，大屏展示数据库中的统计聚合数据 |
| **数据源/客户端/订阅配置管理** | CDC 配置数据的 CRUD 维护 | 职责分离：本功能只读监控，配置管理读写数据库 |

## 7. 关键代码位置

### 后端

以下路径用于帮助后续 Session 定位当前实现，不表示其中的页面结构、接口或可调整的实现算法已经成为最终基线。

| 层次 | 文件 | 说明 |
|---|---|---|
| Controller | `backend/src/main/java/com/bsoft/cdcconfig/monitor/zookeeper/controller/ZooKeeperMonitorController.java` | 提供当前 ZooKeeper 监控查询入口 |
| Service 接口 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/zookeeper/service/ZooKeeperMonitorService.java` | `getClients()`、`isZooKeeperConnected()` |
| Service 实现 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/zookeeper/service/impl/ZooKeeperMonitorServiceImpl.java` | 客户端和采集任务监控信息的只读读取与组装 |
| 只读客户端 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/zookeeper/client/ZooKeeperReadOnlyClient.java` | ZooKeeper 只读访问封装（当前技术实现，不构成不可替换的功能基线） |
| 配置 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/zookeeper/config/ZooKeeperConfig.java` | ZK 连接配置（connectString、rootPath、超时等） |
| VO | `backend/src/main/java/com/bsoft/cdcconfig/monitor/zookeeper/vo/` | `ZooKeeperClientMonitorResponse`、`ZooKeeperClientVO`、`ZooKeeperJobVO` |
| 解析器 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/zookeeper/parser/NodeDataParser.java` | ZK 节点 JSON 数据解析 |

### 前端

| 层次 | 文件 | 说明 |
|---|---|---|
| 页面 | `frontend/src/views/cdc-node-status/CdcNodeStatusPage.vue` | 主页面：工具栏、自动刷新、卡片网格 |
| 组件 | `frontend/src/components/monitor/ClientCard.vue` | 客户端卡片：状态、IP、PID、Job 表格、SCN 展示 |
| API | `frontend/src/api/monitor.ts` | `fetchClients()`、`fetchZkHealth()` |
| 类型 | `frontend/src/types/monitor.ts` | 前端类型定义，对应后端 VO |
| 路由 | `frontend/src/router/index.ts` | 当前实现入口，仅供代码定位，不构成最终路由基线 |
| 菜单 | `frontend/src/config/menu.ts` | 当前实现入口，仅供代码定位，不构成最终菜单基线 |

## 8. 相关配置位置

| 配置 | 文件 |
|---|---|
| ZK 连接串、根路径 | `backend/src/main/resources/application-dev.yml`（`cdc.zookeeper.*`） |
| 环境变量默认值 | `agent-env.sh`（`CDC_ZK_CONNECT`、`CDC_ZK_ROOT`） |
| 项目级 ZK 环境配置 | [ENVIRONMENT.md](../../baseline/ENVIRONMENT.md) §3 |

## 9. 文档导航

| 文档 | 说明 |
|---|---|
| `README.md`（本文件） | 功能入口、定位、边界、代码位置 |
| [REQUIREMENTS.md](REQUIREMENTS.md) | 稳定的核心业务需求 |
| [PROJECT.md](../../baseline/PROJECT.md) | 项目总览 |
| [ENVIRONMENT.md](../../baseline/ENVIRONMENT.md) | ZooKeeper 连接信息、地址、版本 |
| [ARCHITECTURE.md](../../baseline/ARCHITECTURE.md) | ZK 监控数据模型（§5） |
| [DEVELOPMENT_RULES.md](../../baseline/DEVELOPMENT_RULES.md) | ZooKeeper 操作规则（§5） |
| [node-data-format.md](../../zookeeper/node-data-format.md) | ZK 节点数据格式 |
| [online-rules.md](../../zookeeper/online-rules.md) | 在线判定规则 |
| [node-tree.md](../../zookeeper/node-tree.md) | ZK 节点树结构 |
| [CLAUDE.md](../../../CLAUDE.md) | Agent 开发规范（§14 ZooKeeper 规则） |

## 10. 当前阶段的基线说明

当前处于**功能级基线第一阶段**。本轮只固化了功能认知和稳定核心需求。

以下内容**尚未固化**为正式基线：

- 当前页面布局和组件结构**不等于**正式 UI 基线；
- 当前 API 端点、请求/响应字段**不等于**最终 API 基线；
- 当前刷新周期、字段顺序、颜色、图标**不等于**设计规范。

后续经用户确认功能调整方向后，可按需补充以下文档：

- `DESIGN.md`：功能设计说明
- `API.md`：接口契约
- `UI.md`：页面和交互规范
- `ACCEPTANCE.md`：验收标准
