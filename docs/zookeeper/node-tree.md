# 实际节点树

> 分析时间：2026-07-16 17:11 CST

## 完整节点树

```text
/bsoft-cdc                                    [空数据, 永久, 2子节点]
├── clients/                                  [空数据, 永久, 2子节点]
│   ├── hosp-002/                             [空数据, 永久, 3子节点]
│   │   ├── ip                                [JSON, 永久]
│   │   ├── jobs/                             [null, 永久, 1子节点]
│   │   │   └── 5905f1ce83024410836b40ca0ebfc446/  [null, 永久, 3子节点]
│   │   │       ├── scn                       [空数据, 永久]
│   │   │       ├── signals                   [空数据, 永久]
│   │   │       └── status                    [JSON, 永久]
│   │   └── status                            [JSON, 永久]
│   └── hosp-006/                             [空数据, 永久, 3子节点]
│       ├── ip                                [JSON, 永久]
│       ├── jobs/                             [null, 永久, 1子节点]
│       │   └── my-19c/                       [null, 永久, 3子节点]
│       │       ├── scn                       [JSON, 永久]
│       │       ├── signals                   [空数据, 永久]
│       │       └── status                    [JSON, 永久]
│       └── status                            [JSON, 永久]
└── servers/                                  [空数据, 永久, 1子节点]
    └── Server001/                            [空数据, 永久, 3子节点]
        ├── ip                                [JSON, 永久]
        ├── monitor_data                      [null, 永久]
        └── status                            [JSON, 永久]
```

## 节点统计

| 指标 | 值 |
|------|-----|
| 总节点数 | 23 |
| 最大深度 | 5（/bsoft-cdc/clients/{id}/jobs/{jobId}/scn） |
| 顶层子节点 | 2（clients、servers） |
| 客户端实例 | 2（hosp-002、hosp-006） |
| 服务端实例 | 1（Server001） |

## 各层节点数量

| 层级 | 节点数 | 说明 |
|------|--------|------|
| 1（根） | 1 | /bsoft-cdc |
| 2 | 2 | clients、servers |
| 3 | 3 | hosp-002、hosp-006、Server001 |
| 4 | 9 | ip(×3)、status(×3)、jobs(×2)、monitor_data(×1) |
| 5 | 7 | job实例(×2)、scn(×2)、signals(×2)、job_status(×2) |

注：job 实例节点（5905f1ce...、my-19c）处于第5层，其下的 scn/signals/status 处于第6层，但 job 实例本身视为第5层目录节点的一部分。实际叶子最大深度为 6 级路径。

## 命名规律

### 客户端实例命名

- 格式：`hosp-{编号}`
- 示例：hosp-002、hosp-006
- 推断：以医院为单位的 CDC 客户端实例标识

### Job 实例命名

- hosp-002 下的 job：`5905f1ce83024410836b40ca0ebfc446`（UUID 格式，推测对应 DATA_SOURCE_ID）
- hosp-006 下的 job：`my-19c`（可读名称，推测为 Oracle 19c 数据源简称）
- 两种命名风格并存，推断系统支持按 DATA_SOURCE_ID（UUID）或自定义名称命名 job

### 服务端实例命名

- 格式：`Server{编号}`
- 当前仅 Server001

## 临时节点与永久节点

**全部节点均为永久节点**（ephemeralOwner = 0x0）。

这意味着：
- 客户端/服务端断开连接后，节点不会自动删除
- 在线状态不能仅靠节点是否存在来判断
- 状态信息通过节点数据中的 `updateTime` 和 `code` 字段反映

## 代表性路径

| 路径 | 说明 |
|------|------|
| /bsoft-cdc/clients/hosp-006/status | 运行中客户端状态（code=1002） |
| /bsoft-cdc/clients/hosp-002/status | 已停止客户端状态（code=2002） |
| /bsoft-cdc/clients/hosp-006/jobs/my-19c/scn | 含 SCN/offset 数据的采集进度 |
| /bsoft-cdc/clients/hosp-006/jobs/my-19c/status | 运行中 job 状态（code=1101） |
| /bsoft-cdc/servers/Server001/status | 服务端运行状态（code=1001） |

## 疑似历史或异常节点

- **hosp-002**：状态为"进程已停止"（code=2002），updateTime 为 2026-07-14，已停止约 2 天。其下的 job scn/signals 节点数据为空，可能该客户端已离线但节点保留。
- **Server001/monitor_data**：数据为 null，从未更新（ctime=mtime=2026-07-14），可能是预留字段尚未启用。
