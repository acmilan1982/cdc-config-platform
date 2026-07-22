# ZooKeeper 客户端监控 API

> 任务编号：ZK_MONITOR_BACKEND_001
> 页面规格依据：docs/pages/zk-client-monitor.md

## API 清单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/monitor/zookeeper/clients` | 查询全部 CDC 客户端节点 |
| GET | `/api/monitor/zookeeper/health` | ZooKeeper 连接健康检查 |

## 1. GET /api/monitor/zookeeper/clients

查询 `/bsoft-cdc/clients` 下所有客户端及其 jobs，聚合返回在线状态、IP、status、detailInfo、SCN 等信息。

### 请求

无参数。无分页。无筛选。每次调用重新读取当前 ZooKeeper 状态。

### 响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "refreshedAt": "2026-07-20 10:42:57",
    "source": "/bsoft-cdc/clients",
    "partialFailure": false,
    "warnings": [],
    "clients": [
      {
        "clientName": "hosp-006",
        "clientPath": "/bsoft-cdc/clients/hosp-006",
        "online": true,
        "ip": "10.16.18.86:10003",
        "statusCode": "1002",
        "statusMessage": "进程运行正常",
        "detailInfo": "everything under control",
        "updateTime": "2026-07-17 16:29:38",
        "pid": "19584",
        "instanceId": "40833a77-ee6f-43b7-a302-0edcdae476ff",
        "startTime": "2026-07-17 16:29:12",
        "readStatus": "OK",
        "warnings": null,
        "jobs": [
          {
            "jobName": "5905f1ce83024410836b40ca0ebfc446",
            "jobPath": "/bsoft-cdc/clients/hosp-006/jobs/5905f1ce83024410836b40ca0ebfc446",
            "running": true,
            "statusCode": "1101",
            "statusMessage": "增量模式运行中",
            "detailInfo": "everything under control",
            "scn": "110812544",
            "scnUpdateTime": "2026-07-21 11:30:02",
            "readStatus": "OK",
            "warnings": null
          },
          {
            "jobName": "my-19c",
            "jobPath": "/bsoft-cdc/clients/hosp-006/jobs/my-19c",
            "running": false,
            "statusCode": "--",
            "statusMessage": "未运行",
            "detailInfo": "everything under control",
            "readStatus": "OK",
            "warnings": null
          }
        ]
      },
      {
        "clientName": "hosp-007",
        "clientPath": "/bsoft-cdc/clients/hosp-007",
        "online": false,
        "ip": "10.16.18.86:10003",
        "statusCode": "--",
        "statusMessage": "未运行",
        "detailInfo": "java.sql.SQLException: ORA-00257: Archiver error\n",
        "updateTime": "2026-07-17 16:23:16",
        "pid": "--",
        "instanceId": "--",
        "startTime": "--",
        "readStatus": "OK",
        "warnings": null,
        "jobs": []
      }
    ]
  }
}
```

### 字段说明

#### 顶层

| 字段 | 类型 | 说明 |
|------|------|------|
| refreshedAt | string | 本次读取时间 |
| source | string | 数据来源 ZK 路径 |
| partialFailure | boolean | 是否存在部分客户端/节点读取失败 |
| warnings | string[] | 整体级警告信息 |
| clients | array | 客户端列表（按名称升序） |

#### 客户端 (clients[])

| 字段 | 类型 | 说明 |
|------|------|------|
| clientName | string | 客户端名称（ZK 子节点名） |
| clientPath | string | 完整 ZK 路径 |
| online | boolean\|null | 在线状态：alive 存在=true, 不存在=false, 检查失败=null |
| ip | string\|null | IP:端口 |
| statusCode | string\|null | 当前状态码：alive 存在时返回持久化 status.code，alive 不存在时返回 "--" |
| statusMessage | string\|null | 当前状态描述：alive 存在时返回 status.description，alive 不存在时返回 "未运行"，alive 读取失败时返回 "状态未知" |
| detailInfo | string\|null | 完整 detailInfo，保留换行 |
| updateTime | string\|null | status.updateTime |
| pid | string | 在线时展示实际值，离线时展示 "--" |
| instanceId | string | 在线时展示实际值，离线时展示 "--" |
| startTime | string | 在线时展示实际值，离线时展示 "--" |
| readStatus | string | "OK" / "PARTIAL" / "ERROR" |
| warnings | string[]\|null | 客户端级警告信息 |
| jobs | array | 任务列表（按名称升序），可能为空 |

#### 任务 (clients[].jobs[])

| 字段 | 类型 | 说明 |
|------|------|------|
| jobName | string | 任务名称（ZK 子节点名） |
| jobPath | string | 完整 ZK 路径 |
| running | boolean\|null | 当前运行状态（alive 存在=true, 不存在=false, 检查失败=null） |
| statusCode | string\|null | job 当前状态码；alive 存在时返回持久化 status.code，alive 不存在时返回 "--" |
| statusMessage | string\|null | job 当前状态描述；alive 存在时返回持久化 status.description，alive 不存在时返回 "未运行"，alive 读取失败时返回 "状态未知" |
| detailInfo | string\|null | job detailInfo（无论 alive 是否存在均保留最后一次值） |
| scn | string\|null | SCN 值；快照阶段为空时返回 null（无论 alive 是否存在均保留） |
| scnUpdateTime | string\|null | SCN 更新时间；SCN 为空时返回 null |
| readStatus | string | "OK" / "PARTIAL" / "ERROR" |
| warnings | string[]\|null | 任务级警告信息 |

## 2. GET /api/monitor/zookeeper/health

检查到 ZooKeeper 的连接状态。

### 响应

```json
{
  "code": 200,
  "data": {
    "connected": true,
    "connectString": "192.168.174.51:2181",
    "rootPath": "/bsoft-cdc",
    "checkedAt": "2026-07-20 10:42:57"
  }
}
```

## 业务规则

### 统一当前运行状态规则

客户端和 job 的当前运行状态均以各自 `alive` 临时节点是否存在为准。

| 节点 | alive 存在 | alive 不存在 | alive 读取失败 |
|------|-----------|-------------|--------------|
| 客户端 | online=true, statusCode=status.code, statusMessage=status.description | online=false, statusCode="--", statusMessage="未运行" | online=null, statusCode="--", statusMessage="状态已知" |
| job | running=true, statusCode=status.code, statusMessage=status.description | running=false, statusCode="--", statusMessage="未运行" | running=null, statusCode="--", statusMessage="状态已知" |

统一原则：

```
alive 表示当前是否运行；
status 只表示最后一次上报状态；
只有 alive 存在时，status 才能作为当前状态展示。
alive 节点值为 {}，不解析其内容，仅判断节点是否存在。
```

- 持久化 status 仅代表最后一次上报状态，不得解释为当前运行状态
- alive 不存在时不产生 warning，不设置 partialFailure
- detailInfo 和 SCN 在 alive 不存在时仍保留最后一次值

### SCN 空值

快照阶段 SCN 可为空（空 JSON `{}`）。API 返回 null，不返回 "0"、"--" 等占位文本。

### 只读边界

本模块仅使用 Curator 只读能力（checkExists、getChildren、getData）。项目业务代码不调用 ZooKeeper 写 API。

### 异常隔离

- ZK 整体不可用 → 客户端列表为空，partialFailure=true，warnings 含错误描述
- clients 路径不存在 → 同上
- 单客户端读取失败 → 其他客户端继续返回，该客户端 readStatus="ERROR"
- 单 job 读取失败 → 其他 jobs 继续返回，该 job readStatus="ERROR"
- 节点读取过程中消失 → 按当前语义转换为空值或离线
- JSON 解析失败 → 对应字段为 null，添加 warning，不影响其他节点

### 排序

- 客户端：按名称升序
- Jobs：按名称升序

### 监控范围

仅 `/bsoft-cdc/clients`。排除 `/bsoft-cdc/servers` 和 signals 节点。
