# 实际节点树

> 分析时间：2026-07-17 16:39 CST
> 更新日期：2026-07-17（根据项目负责人确认回答固化）
> 监控范围：`/bsoft-cdc/clients`（servers 暂不处理，signals 已废弃）

## 完整节点树

```text
/bsoft-cdc                                    [空, 永久, 2子节点]
├── clients/                                  [空, 永久, 2子节点, cversion=10]
│   ├── hosp-006/                             [空, 永久, 4子节点, ctime=2026-07-17]
│   │   ├── ip                                [JSON, 永久]
│   │   ├── status                            [JSON, 永久]
│   │   ├── alive                             [JSON, 临时] ← 唯一临时节点
│   │   └── jobs/                             [null, 永久, 1子节点]
│   │       └── my-19c/                       [null, 永久, 2子节点]
│   │           ├── scn                       [JSON(空), 永久]
│   │           └── status                    [JSON, 永久]
│   └── hosp-007/                             [空, 永久, 3子节点, ctime=2026-07-17]
│       ├── ip                                [JSON, 永久]
│       ├── status                            [JSON, 永久]
│       └── jobs/                             [null, 永久, 0子节点]
└── servers/ ← 本期不纳入监控（项目负责人已确认）
    └── Server001/                            [空, 永久, 3子节点, ctime=2026-07-14]
        ├── ip                                [JSON, 永久]
        ├── status                            [JSON, 永久]
        └── monitor_data                      [null, 永久]

注：signals 节点已废弃（项目负责人已确认），当前树中已不存在。
```

## 节点统计

| 指标 | 值 |
|------|-----|
| 总节点数 | 19 |
| 最大深度 | 5（/bsoft-cdc/clients/{id}/jobs/{jobId}/status） |
| 顶层子节点 | 2（clients、servers） |
| 客户端实例 | 2（hosp-006、hosp-007） |
| 服务端实例 | 1（Server001） |
| Job 实例 | 1（my-19c） |

## 各层节点数量

| 层级 | 节点数 | 说明 |
|------|--------|------|
| 1（根） | 1 | /bsoft-cdc |
| 2 | 2 | clients、servers |
| 3 | 3 | hosp-006、hosp-007、Server001 |
| 4 | 10 | ip(×3)、status(×3)、alive(×1)、jobs(×2)、monitor_data(×1) |
| 5 | 3 | my-19c(×1)、scn(×1)、job_status(×1) |

## 命名规律

### 客户端实例命名

- 格式：`hosp-{编号}`
- 示例：hosp-006、hosp-007
- 推断：以医院为单位的 CDC 客户端探针实例标识

### Job 实例命名

当前仅 my-19c（可读名称，推断为 Oracle 19c 数据源简称）。上一轮分析中存在的 UUID 格式 job 名（5905f1ce...）已消失。

### 服务端实例命名

- 格式：`Server{编号}`
- 当前仅 Server001

## 临时节点与永久节点

| 类型 | 数量 | 说明 |
|------|------|------|
| 临时节点（ephemeralOwner≠0） | **1** | hosp-006/alive（ephemeralOwner=0x10000028e490044） |
| 永久节点（ephemeralOwner=0） | 18 | 其余全部 |

**关键发现**：`alive` 节点是唯一的临时节点。客户端断开 ZK 会话时该节点会自动删除，据此可判断客户端**实时在线状态**。

## 代表性路径

| 路径 | 说明 |
|------|------|
| /bsoft-cdc/clients/hosp-006/status | 正常运行客户端状态（code=1002） |
| /bsoft-cdc/clients/hosp-006/alive | 临时节点，客户端在线心跳 |
| /bsoft-cdc/clients/hosp-007/status | 异常客户端状态（code=9001, ORA-00257） |
| /bsoft-cdc/clients/hosp-006/jobs/my-19c/status | 运行中 job（code=1101） |
| /bsoft-cdc/servers/Server001/status | 服务端状态（code=1001） |

## 疑似异常节点

- **hosp-007**：状态码 9001（进程异常），detailInfo 含 Oracle 归档错误（ORA-00257），无 alive 临时节点，jobs 为空。推断该探针已启动但因 Oracle 归档错误无法正常工作。
- **Server001/monitor_data**：null 值从未更新（ctime=mtime=2026-07-14），推测为预留字段未启用。
- **hosp-006/jobs/my-19c/scn**：当前为空 JSON `{}`，上一轮分析（7月16日）有 offset 值，可能因探针重启导致重新采集。
