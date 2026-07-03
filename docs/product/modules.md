# CDC 配置管理平台 — 全局业务模块

> 任务编号：PRODUCT_DESIGN_001
> 设计日期：2026-07-03
> 设计依据：DATABASE_ANALYSIS_001 / DATABASE_ANALYSIS_002 已确认结论

## 一级业务模块

### 1. 配置管理

- **模块目标**：管理 CDC 平台的数据源、客户端、订阅及服务端等配置数据，支持增删改查。
- **模块边界**：所有可维护的配置（允许新增、编辑、删除），不包含只读运行数据。
- **涉及表**：
  - CDC_DATA_SOURCE
  - CDC_DATA_SOURCE_EXTEND
  - CDC_CLIENT_MULTIPLE
  - CDC_DATA_SUBSCRIBE
  - CDC_SERVER
  - CDC_SERVER_CONFIG
- **第一版范围**：上述 6 张表全部纳入，提供完整的增删改查能力（除已确认只读的字段外）。
- **暂不纳入范围**：
  - 登录与权限体系
  - 首页/仪表盘
  - 字段级页面规格（留到模块开发前设计）

### 2. 运行监控

- **模块目标**：以只读方式监控 CDC 平台的节点状态、数据源运行状态、Topic 消费偏移量和操作日志。
- **模块边界**：所有只读运行数据，不提供任何增删改查之外的数据修改能力。
- **涉及数据源**：
  - Oracle：CDC_DATA_SOURCE_RUN_STATE
  - Oracle：CDC_TOPIC_OFFSET
  - Oracle：CDC_LOG_ERROR
  - Oracle：CDC_LOG_CORRECT
  - ZooKeeper：节点状态（不对应 Oracle 表）
- **第一版范围**：4 张表 + ZooKeeper 节点状态，全部只读。前端轮询刷新，不使用 WebSocket。
- **暂不纳入范围**：
  - 启停 CDC 任务
  - 重置采集进度
  - 修改 ZooKeeper 节点
  - WebSocket 实时推送
  - 导出功能（可在模块开发前确认是否纳入）

## 模块总览

| 一级模块 | 目标 | 涉及表/ZK | 读写性质 | 第一版纳入 |
|----------|------|-----------|----------|-----------|
| 配置管理 | 维护 CDC 平台配置数据 | CDC_DATA_SOURCE, CDC_DATA_SOURCE_EXTEND, CDC_CLIENT_MULTIPLE, CDC_DATA_SUBSCRIBE, CDC_SERVER, CDC_SERVER_CONFIG | 可读写 | 全部 |
| 运行监控 | 只读监控 CDC 运行状态 | CDC_DATA_SOURCE_RUN_STATE, CDC_TOPIC_OFFSET, CDC_LOG_ERROR, CDC_LOG_CORRECT, ZooKeeper | 只读 | 全部 |

## 模块间关系

- 配置管理和运行监控为并列一级模块，无父子关系。
- 允许从运行监控页面通过链接跳转到对应的配置管理页面（如从数据源运行状态跳转到数据源管理）。
  - **状态**：产品设计建议，待项目负责人确认。
- ZooKeeper 监控独立于 Oracle 配置表，属于运行监控模块。

## 不纳入第一版的功能（已确认）

| 功能 | 原因 |
|------|------|
| 登录页 | 项目负责人确认本期不开发 |
| 用户管理 | 项目负责人确认本期不开发 |
| 角色管理 | 项目负责人确认本期不开发 |
| 菜单权限 | 项目负责人确认本期不开发 |
| 按钮权限 | 项目负责人确认本期不开发 |
| 数据权限 | 项目负责人确认本期不开发 |
| 首页/仪表盘 | 项目负责人确认本期不开发，默认进入数据源管理 |

## 后续可扩展

- 登录与权限体系
- 首页/仪表盘
- WebSocket 实时推送（替换轮询）
- 导出功能
- CDC 任务控制（启停、重置进度等）
