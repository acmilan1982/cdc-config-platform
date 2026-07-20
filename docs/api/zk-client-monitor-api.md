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
        "online": false,
        "ip": "10.16.18.86:10003",
        "statusCode": "1002",
        "statusMessage": "进程运行正常",
        "detailInfo": "everything under control",
        "updateTime": "2026-07-17 16:29:38",
        "pid": "--",
        "instanceId": "--",
        "startTime": "--",
        "readStatus": "OK",
        "warnings": null,
        "jobs": [
          {
            "jobName": "my-19c",
            "jobPath": "/bsoft-cdc/clients/hosp-006/jobs/my-19c",
            "statusCode": "1101",
            "statusMessage": "增量模式运行中",
            "detailInfo": "everything under control",
            "scn": null,
            "scnUpdateTime": null,
            "readStatus": "OK",
            "warnings": null
          }
        ]
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
| online | boolean | 在线状态（唯一依据 alive 临时节点是否存在） |
| ip | string\|null | IP:端口 |
| statusCode | string\|null | status.code 当前值，不映射枚举 |
| statusMessage | string\|null | status.description |
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
| statusCode | string\|null | job status.code |
| statusMessage | string\|null | job status.description |
| detailInfo | string\|null | job detailInfo |
| scn | string\|null | SCN 值；快照阶段为空时返回 null |
| scnUpdateTime | string\|null | SCN 更新时间；SCN 为空时返回 null |
| readStatus | string | "OK" / "ERROR" |
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

### 在线规则

```
alive 临时节点存在 = 在线
alive 临时节点不存在 = 离线
```

不依赖 alive 的 mtime、updateTime、status.code 或 jobs 是否存在。

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
