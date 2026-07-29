# Job 故障恢复——后端接口规格

> 任务编号：045 阶段 B
> 设计日期：2026-07-29
> 技术栈：Spring Boot 2.7.x, JDK 8, MyBatis-Plus 3.5.3.1, Oracle 19c

---

## 1. 概述

### 1.1 接口清单

| # | 接口名称 | HTTP Method | URL |
|---|---------|------------|-----|
| API-1 | 主页面汇总 | GET | `/api/monitor/job-failure-summary` |
| API-2 | 最近故障详情 | GET | `/api/monitor/job-failure/{clientId}/{dataSourceId}/latest` |
| API-3 | 历史故障摘要 | GET | `/api/monitor/job-failure/{clientId}/{dataSourceId}/history` |
| API-4 | 指定故障详情 | GET | `/api/monitor/job-failure/{clientId}/{dataSourceId}/fault/{faultRootId}` |
| API-5 | 大字段详情 | GET | `/api/monitor/job-failure/{recordType}/{recordId}/clob-detail` |

### 1.2 统一响应封装

项目已有 `ApiResponse<T>`（code + message + data + timestamp），所有接口返回：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": "2026-07-29T10:00:00"
}
```

### 1.3 权限边界

- 当前项目无登录鉴权
- 所有接口为内网只读
- 本期不实现 RBAC

---

## 2. API-1: 主页面汇总

### GET `/api/monitor/job-failure-summary`

#### 功能

返回按客户端分组的逻辑 Job 列表、Job 当前状态、客户端汇总统计。

#### 请求参数

无必填参数。可选：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| clientId | String | 否 | — | 按指定客户端筛选，不传返回全部 |

#### 响应

```json
{
  "code": 200,
  "data": {
    "refreshTime": "2026-07-29 10:30:00",
    "clients": [
      {
        "clientId": "hosp-002",
        "clientDesc": "杭州市第二人民医院",
        "totalJobCount": 3,
        "normalCount": 2,
        "abnormalCount": 1,
        "lastUpdatedAt": "2026-07-28 09:47:12",
        "jobs": [
          {
            "dataSourceId": "db-his-01",
            "dataSourceName": "oracle-HIS生产库",
            "jobStatus": "RECOVERING",
            "jobStatusText": "恢复中",
            "currentJobId": "b7f84e91a3d24c6f...",
            "lastFailureTime": "2026-07-28 09:12:05",
            "lastRecoveryTime": null,
            "restartCount": 2,
            "hasFaultRecord": true
          }
        ]
      }
    ]
  }
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| clients | Array | 客户端列表 |
| clientId | String | 客户端 ID |
| clientDesc | String | 客户端描述（来自 CDC_CLIENT_MULTIPLE） |
| totalJobCount | int | Job 总数 |
| normalCount | int | 正常数量 |
| abnormalCount | int | 异常数量（恢复中） |
| lastUpdatedAt | Date | 该客户端下最近更新时间 |
| jobs[].dataSourceId | String | 数据源 ID |
| jobs[].dataSourceName | String | 数据源名称（来自 CDC_DATA_SOURCE） |
| jobs[].jobStatus | Enum | NORMAL / RECOVERING |
| jobs[].jobStatusText | String | 正常 / 恢复中 |
| jobs[].currentJobId | String | 当前物理 Job ID（截断展示） |
| jobs[].lastFailureTime | Date | 最近失败时间（null 时前端显示 --） |
| jobs[].lastRecoveryTime | Date | 最近恢复时间（null 时前端显示 --） |
| jobs[].restartCount | int | 本次重启次数 |
| jobs[].hasFaultRecord | boolean | 是否存在故障记录 |

#### 状态计算规则

| 条件 | jobStatus |
|------|----------|
| 无故障记录 | NORMAL |
| 有故障记录但已闭环 | NORMAL |
| 有未闭环故障 | RECOVERING |
| 多个未闭环故障 | RECOVERING |

#### 排序规则

- 异常客户端在前
- 同状态按 clientId 升序
- 前端控制折叠/展开

---

## 3. API-2: 最近故障详情

### GET `/api/monitor/job-failure/{clientId}/{dataSourceId}/latest`

#### 功能

返回指定逻辑 Job 最近一次故障过程的完整详情。

#### Path 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| clientId | String | 是 | 客户端 ID |
| dataSourceId | String | 是 | 数据源 ID |

#### 响应

```json
{
  "code": 200,
  "data": {
    "clientId": "hosp-002",
    "dataSourceId": "db-his-01",
    "dataSourceName": "oracle-HIS生产库",
    "jobStatus": "NORMAL",
    "jobStatusText": "正常",
    "currentJobId": "d9b06f13c5f46e8b1a34cd567890efab",
    "lastUpdatedAt": "2026-07-28 09:47:12",
    "faultSummary": {
      "firstFailureTime": "2026-07-28 09:12:05",
      "lastHandleTime": "2026-07-28 09:30:00",
      "finalRecoveryTime": "2026-07-28 09:30:00",
      "durationText": "17分55秒",
      "durationSeconds": 1075,
      "isOngoing": false,
      "faultProcessStatus": "RECOVERED",
      "faultProcessStatusText": "已恢复",
      "failureEventCount": 3,
      "restartCount": 2,
      "initialJobId": "a1b2c3d4e5f6a7b...",
      "currentOrFinalJobId": "d9b06f13c5f46e8b1a34cd567890efab"
    },
    "jobChain": {
      "nodes": [
        {"jobId": "a1b2c3d4...", "type": "INITIAL", "anomaly": false},
        {"jobId": "c2d3e4f5...", "type": "INTERMEDIATE", "anomaly": false},
        {"jobId": "e3f4a5b6...", "type": "INTERMEDIATE", "anomaly": false},
        {"jobId": "d9b06f13...", "type": "FINAL", "anomaly": false}
      ],
      "faultRootId": "3400900000000000001"
    },
    "events": [
      {
        "eventId": "EVENT_ID_3",
        "round": 3,
        "failureTime": "2026-07-28 09:13:45",
        "failedJobId": "e3f4a5b6c7d8e9f...",
        "newJobId": "d9b06f13c5f46e8...",
        "eventResult": "ACCEPTED",
        "eventResultText": "故障恢复闭环",
        "handleLogCount": 5,
        "isClosed": true,
        "isAnomaly": false,
        "timeline": [
          {
            "stage": "JOB_FAILURE_RECEIVED",
            "stageText": "收到失败事件",
            "handleTime": "2026-07-28 09:13:46",
            "dotColor": "gray",
            "detail": {
              "attemptNo": 3,
              "consecutiveFailures": 3
            }
          },
          {
            "stage": "RESTART_SCHEDULED",
            "stageText": "已安排重启",
            "handleTime": "2026-07-28 09:13:46",
            "dotColor": "orange",
            "detail": {
              "restartDelaySeconds": 120,
              "nextRestartTime": "2026-07-28 09:15:46"
            }
          }
        ],
        "clobSummary": {
          "type": "FAILURE_DETAIL",
          "preview": "oracle.net.ns.NetException: Listener refused...",
          "totalChars": 10929,
          "recordId": "EVENT_ID_3"
        }
      }
    ],
    "anomalySummary": null
  }
}
```

#### 字段说明

##### faultSummary

| 字段 | 类型 | 说明 |
|------|------|------|
| firstFailureTime | Date | 首次失败时间 |
| lastHandleTime | Date | 最近处理时间 |
| finalRecoveryTime | Date\|null | 最终恢复时间（未闭环时为 null） |
| durationText | String | 持续时间展示文本 |
| durationSeconds | long | 持续时间秒数 |
| isOngoing | boolean | 是否持续中 |
| faultProcessStatus | Enum | RECOVERED / WAITING_RESTART / RESTARTING / RECOVERY_FAILED / ABNORMAL |
| faultProcessStatusText | String | 中文展示 |
| failureEventCount | int | 失败事件数 |
| restartCount | int | 重启次数 |
| initialJobId | String | 初始物理 Job ID（截断） |
| currentOrFinalJobId | String | 当前/最终物理 Job ID（完整值含复制所需） |

##### jobChain

| 字段 | 类型 | 说明 |
|------|------|------|
| nodes | Array | 节点按时间正序排列 |
| nodes[].jobId | String | 短格式 Job ID |
| nodes[].type | Enum | INITIAL / INTERMEDIATE / FINAL |
| nodes[].fullJobId | String | 完整 Job ID（tooltip 用） |
| faultRootId | String | 故障过程根标识 |

##### events[]（按时间倒序：最新最先）

| 字段 | 类型 | 说明 |
|------|------|------|
| eventId | String | 事件 ID |
| round | int | 轮次（倒序展示，轮次号仍为正序编号） |
| failureTime | Date | 失败发生时间 |
| failedJobId | String | 失败 Job ID（截断） |
| newJobId | String | 新 Job ID（截断，可为 null） |
| eventResult | String | 事件处理结果枚举 |
| eventResultText | String | 前端展示文案 |
| isClosed | boolean | 是否已闭环（STABLE_CHECK_PASSED） |
| isAnomaly | boolean | 是否存在异常链 |
| anomalyType | String\|null | FORK / MULTI_PARENT / BROKEN_CHAIN / LOOP |
| anomalySummaryText | String\|null | 异常摘要文本 |
| timeline[] | Array | 处理时间线 |
| clobSummary | Object\|null | CLOB 摘要信息 |

##### timeline[]

| 字段 | 类型 | 说明 |
|------|------|------|
| stage | String | HANDLE_STAGE 枚举值 |
| stageText | String | 中文展示 |
| handleTime | Date | 处理时间 |
| dotColor | String | 时间线节点颜色 (gray/orange/blue/green/red) |
| detail | Object | 阶段详情（各阶段字段不同，见下表） |

##### clobSummary

| 字段 | 类型 | 说明 |
|------|------|------|
| type | String | FAILURE_DETAIL / ERROR_DETAIL |
| preview | String | 前 3 行预览文本 |
| totalChars | int | 总字符数 |
| recordId | String | 记录 ID（传给 API-5） |

##### anomalySummary（仅在存在异常链时返回）

| 字段 | 类型 | 说明 |
|------|------|------|
| anomalyType | String | FORK / MULTI_PARENT / BROKEN_CHAIN / LOOP |
| description | String | 异常描述文本 |
| anomalyEventIds | Array | 涉及的异常事件 ID |

---

## 4. API-3: 历史故障摘要

### GET `/api/monitor/job-failure/{clientId}/{dataSourceId}/history`

#### 功能

返回指定逻辑 Job 的历史故障过程摘要列表（时间范围过滤，不分页）。

#### Path 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| clientId | String | 是 | 客户端 ID |
| dataSourceId | String | 是 | 数据源 ID |

#### Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| range | String | 否 | 1d | 1d / 1w / 1m |

#### 响应

```json
{
  "code": 200,
  "data": {
    "clientId": "hosp-002",
    "dataSourceId": "db-drug-master",
    "dataSourceName": "oracle-药品主库",
    "jobStatus": "RECOVERING",
    "jobStatusText": "恢复中",
    "currentJobId": "d9b06f13c5f46e8b1a34cd567890efab",
    "lastUpdatedAt": "2026-07-28 10:30:00",
    "range": "1m",
    "hasUnclosed": true,
    "totalFaults": 5,
    "truncated": false,
    "maxFaults": 50,
    "unclosedFaults": [
      {
        "faultRootId": "1234567890123456789",
        "firstFailureTime": "2026-07-28 10:28:00",
        "finalRecoveryTime": null,
        "durationText": "2分0秒（持续中）",
        "isOngoing": true,
        "faultProcessStatus": "WAITING_RESTART",
        "faultProcessStatusText": "等待重启",
        "failureEventCount": 1,
        "restartCount": 0,
        "initialJobId": "d9b06f13...",
        "finalJobId": null,
        "hasAnomaly": false
      }
    ],
    "closedFaults": [
      {
        "faultRootId": "9876543210987654321",
        "firstFailureTime": "2026-07-27 19:17:24",
        "finalRecoveryTime": "2026-07-27 20:05:30",
        "durationText": "48分6秒",
        "isOngoing": false,
        "faultProcessStatus": "RECOVERED",
        "faultProcessStatusText": "已恢复",
        "failureEventCount": 3,
        "restartCount": 2,
        "initialJobId": "a1b2c3d4...",
        "finalJobId": "d9b06f13...",
        "hasAnomaly": false,
        "anomalyType": null
      }
    ]
  }
}
```

#### 业务规则

| 规则 | 实现 |
|------|------|
| 未闭环故障置顶 | unclosedFaults 始终在 closedFaults 之前 |
| 时间范围过滤 | 已闭环故障的 firstFailureTime >= (now - range) |
| 未闭环不受时间限制 | 即使 firstFailureTime 超过 range，仍返回并置顶 |
| 最大数量保护 | total = unclosedFaults.length + closedFaults.length <= maxFaults |
| 排序 | unclosedFaults 按 firstFailureTime DESC；closedFaults 按 firstFailureTime DESC |
| truncated | 超出 maxFaults 时为 true |

#### 注意事项

- 列表接口不在 `closedFaults[]` 中返回 CLOB 内容和完整处理日志
- 仅返回摘要信息（与页面表格 10 列对应）
- 点击"查看"跳转到 API-4

---

## 5. API-4: 指定故障详情

### GET `/api/monitor/job-failure/{clientId}/{dataSourceId}/fault/{faultRootId}`

#### 功能

通过稳定的 faultRootId 返回指定故障过程的完整详情。

#### Path 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| clientId | String | 是 | 客户端 ID |
| dataSourceId | String | 是 | 数据源 ID |
| faultRootId | String | 是 | 故障过程根标识（首次失败事件 ID） |

#### 响应

**与 API-2 结构完全相同**（复用同一个 VO）。区别仅在于：
- API-2 自动定位最近一次故障
- API-4 指定 faultRootId 定位

响应 `data` 结构同 API-2。页面前端通过 URL 路径区分：
- 最近故障: `/monitor/job-failure/{clientId}/{dataSourceId}/fault/latest`
- 指定故障: `/monitor/job-failure/{clientId}/{dataSourceId}/fault/{faultRootId}`

#### 异常响应

| 场景 | HTTP Code | message |
|------|-----------|---------|
| faultRootId 不存在 | 404 | 故障过程不存在 |
| clientId 或 dataSourceId 无效 | 400 | 参数无效 |
| faultRootId 对应的首事件不属于该逻辑 Job | 400 | 故障过程不属于指定逻辑 Job |

---

## 6. API-5: 大字段详情

### GET `/api/monitor/job-failure/{recordType}/{recordId}/clob-detail`

#### 功能

加载 CLOB 大字段完整内容。

#### Path 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| recordType | String | 是 | event / handle-log |
| recordId | String | 是 | 记录 ID |

#### Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| fieldType | String | 是 | — | FAILURE_DETAIL / ERROR_DETAIL（白名单校验） |

#### 响应

```json
{
  "code": 200,
  "data": {
    "recordId": "3400900000000000001",
    "recordType": "event",
    "fieldType": "FAILURE_DETAIL",
    "totalChars": 10929,
    "content": "oracle.net.ns.NetException: Listener refused the connection...",
    "isEmpty": false
  }
}
```

#### 白名单

| recordType | 允许的 fieldType |
|-----------|-----------------|
| event | FAILURE_DETAIL |
| handle-log | ERROR_DETAIL |

非白名单请求返回 400。

#### 异常响应

| 场景 | HTTP Code | message |
|------|-----------|---------|
| fieldType 不在白名单 | 400 | 不支持的大字段类型 |
| 记录不存在 | 404 | 记录不存在 |
| CLOB 为空 | 200 (isEmpty=true) | — |

---

## 7. 枚举定义

### 7.1 JobStatusEnum（Job 当前状态）

```java
public enum JobStatusEnum {
    NORMAL("正常"),
    RECOVERING("恢复中");
    
    private final String text;
}
```

### 7.2 FaultProcessStatusEnum（故障过程状态）

```java
public enum FaultProcessStatusEnum {
    RECOVERED("已恢复"),
    WAITING_RESTART("等待重启"),
    RESTARTING("重启中"),
    RECOVERY_FAILED("恢复失败"),
    ABNORMAL("流程异常");
    
    private final String text;
}
```

### 7.3 DotColorEnum（时间线节点颜色）

```java
public enum DotColorEnum {
    GRAY,    // 辅助/接收事件
    ORANGE,  // 等待/调度
    BLUE,    // 执行中
    GREEN,   // 成功/闭环
    RED;     // 失败
}
```

### 7.4 AnomalyTypeEnum（异常链类型）

```java
public enum AnomalyTypeEnum {
    FORK("分叉"),
    MULTI_PARENT("多父节点"),
    BROKEN_CHAIN("断链"),
    LOOP("环"),
    DUPLICATE_EDGE("重复边");
    
    private final String text;
}
```

---

## 8. 项目分层结构建议

### 8.1 包结构

```
com.bsoft.cdcconfig.monitor.jobfailure/
├── controller/
│   └── JobFailureController.java          -- REST API
├── service/
│   ├── JobFailureSummaryService.java      -- API-1
│   ├── FaultDetailService.java            -- API-2, API-4
│   ├── FaultHistoryService.java           -- API-3
│   ├── ClobDetailService.java             -- API-5
│   ├── FaultProcessGrouper.java           -- 故障过程归并算法
│   ├── JobChainBuilder.java               -- Job 链构建算法
│   ├── JobStatusResolver.java             -- 状态计算
│   ├── AnomalyDetector.java               -- 异常链检测
│   └── TimeCalculator.java                -- 时间计算工具
├── mapper/
│   ├── CdcJobFailureEventMapper.java      -- 事件表 Mapper（MyBatis-Plus）
│   ├── CdcJobFailureHandleLogMapper.java  -- 日志表 Mapper
│   ├── CdcClientMultipleMapper.java       -- 客户端主数据 Mapper（复用现有或新建）
│   └── CdcDataSourceMapper.java           -- 数据源主数据 Mapper（复用现有）
├── entity/
│   ├── CdcJobFailureEvent.java            -- 事件表实体
│   └── CdcJobFailureHandleLog.java        -- 日志表实体
├── vo/
│   ├── ClientSummaryVO.java               -- API-1 客户端汇总
│   ├── LogicalJobVO.java                  -- API-1 逻辑 Job
│   ├── LatestFaultResponse.java           -- API-2/4 故障详情
│   ├── FaultSummaryVO.java                -- 故障过程汇总
│   ├── JobChainVO.java                    -- Job 演变链
│   ├── EventCardVO.java                   -- 事件卡片
│   ├── TimelineEntryVO.java               -- 时间线条目
│   ├── ClobSummaryVO.java                 -- CLOB 摘要
│   ├── AnomalySummaryVO.java              -- 异常链摘要
│   ├── HistoryResponse.java               -- API-3 历史摘要
│   ├── HistoryFaultItemVO.java            -- 单条历史记录
│   └── ClobDetailResponse.java            -- API-5 CLOB 详情
├── query/
│   ├── HistoryQuery.java                  -- API-3 查询参数
│   └── ClobDetailQuery.java              -- API-5 查询参数
└── enums/
    ├── JobStatusEnum.java
    ├── FaultProcessStatusEnum.java
    ├── DotColorEnum.java
    └── AnomalyTypeEnum.java
```

### 8.2 依赖关系

```
Controller → Service (多个) → Mapper (MyBatis-Plus BaseMapper)
                ↕
         FaultProcessGrouper
         JobChainBuilder
         JobStatusResolver
         AnomalyDetector
         TimeCalculator
```

算法类为纯 Java POJO，不依赖 Spring Bean，可独立单元测试。

---

## 9. 配置项

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `cdc.job-failure.history-max-faults` | 50 | 历史故障最大返回数 |
| `cdc.job-failure.clob-max-preview-chars` | 300 | CLOB 预览最大字符数 |
| `cdc.job-failure.range-default` | 1d | 历史时间范围默认值 |
| `cdc.job-failure.refresh-interval-seconds` | 60 | 默认自动刷新间隔 |

---

> 本文档仅设计接口，不实现业务代码。
