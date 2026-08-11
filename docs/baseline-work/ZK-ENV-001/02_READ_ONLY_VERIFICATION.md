# 02_READ_ONLY_VERIFICATION — ZK-ENV-001 只读验证报告

## 验证总览

| 验证项 | 结果 | 说明 |
|---|---|---|
| 1. 配置文件已经同步 | **PASS** | CLAUDE.md, agent-env.sh, application-dev.yml 全部更新 |
| 2. ZOOKEEPER_HOME 目录存在 | **PASS** | `/opt/zookeeper/zookeeper-3.4.14` 存在，确认为 ZK 3.4.14 工具目录 |
| 3. zkCli.sh 可用 | **PASS** | 文件存在，权限已修正 (R1)，通过 `bash zkCli.sh` 或直接调用均可 |
| 4. TCP 2181端口可达 | **PASS** | `bash -c 'echo > /dev/tcp/10.19.16.111/2181'` 成功 |
| 5. ZooKeeper 会话连接成功 | **PASS** | zkCli v3.4.14 → server 10.19.16.111:2181，session established，timeout=30000ms |
| 6. /bsoft-cdc 读取成功 | **PASS** | 子节点: `[clients, servers]` |
| 7. /bsoft-cdc/clients 读取成功 | **PASS** | 子节点: `[hosp-012]` |
| 8. 服务端版本得到验证 | **PASS** | `srvr` 命令返回: 3.4.14-4c25d480e66aadd371de8bd2fd8da255ac140bcf, built on 03/06/2019 16:18 GMT |
| 9. Java 客户端/Curator 只读兼容性 | **NOT_VERIFIED** | CLI只读连接成功不等于项目 Curator 依赖兼容；需应用层独立验证 |

---

## 详细验证记录

### 1. ZOOKEEPER_HOME 只读检查

**命令**:
```bash
ls -la /opt/zookeeper/zookeeper-3.4.14/
ls -la /opt/zookeeper/zookeeper-3.4.14/bin/
```

**结果**:
- 目录存在: `/opt/zookeeper/zookeeper-3.4.14/`
- 包含文件: `zookeeper-3.4.14.jar`, `pom.xml`, `build.xml`, `README.md` 等
- 子目录: `bin/`, `conf/`, `lib/`, `src/`, `zookeeper-client/`, `zookeeper-server/` 等
- `bin/zkCli.sh`: 存在 (1534 bytes)，权限已修正 (R1)
- `bin/zkCli.sh` 内容确认为 ZK CLI 启动脚本

### 2. TCP 连通性

**命令**:
```bash
timeout 5 bash -c 'echo > /dev/tcp/10.19.16.111/2181'
```

**结果**: 连接成功，退出码 0。

### 3. ZK 只读连接

**命令**:
```bash
bash /opt/zookeeper/zookeeper-3.4.14/bin/zkCli.sh -server 10.19.16.111:2181
```

**客户端版本日志**:
```
Client environment:zookeeper.version=3.4.14-4c25d480e66aadd371de8bd2fd8da255ac140bcf, built on 03/06/2019 16:18 GMT
```

**会话建立日志**:
```
Session establishment complete on server 10.19.16.111/10.19.16.111:2181, sessionid = 0x108dea5e5ad0056, negotiated timeout = 30000
```

### 4. 根节点读取

**命令**: `ls /`

**结果**: `[zookeeper, bsoft-cdc, kafka]`

### 5. /bsoft-cdc 读取

**命令**: `ls /bsoft-cdc`

**结果**: `[clients, servers]`

### 6. /bsoft-cdc/clients 读取

**命令**: `ls /bsoft-cdc/clients`

**结果**: `[hosp-012]`

### 7. 服务端版本

**命令**:
```bash
echo "srvr" | timeout 5 nc 10.19.16.111 2181
```

**结果**:
```
Zookeeper version: 3.4.14-4c25d480e66aadd371de8bd2fd8da255ac140bcf, built on 03/06/2019 16:18 GMT
Latency min/avg/max: 0/0/11
Received: 5410738
Sent: 5410751
Connections: 34
Outstanding: 0
Zxid: 0x196
Mode: standalone
Node count: 200
```

### 8. 客户端与服务端版本对比

| 端 | 版本 | 状态 |
|---|---|---|
| CLI 客户端 (zkCli.sh) | 3.4.14-4c25d48 | 与服务端匹配 |
| 服务端 | 3.4.14-4c25d48 | standalone 模式，200节点 |
| 项目 Curator (已提交) | 4.3.0 | **兼容性未验证** |
| 项目 Curator (未提交) | 2.13.0 | **兼容性未验证** |
| 项目 ZK 客户端依赖 (已提交) | 3.5.6 | **兼容性未验证** |
| 项目 ZK 客户端依赖 (未提交) | 3.4.14 | **兼容性未验证** |

### 9. ZK 节点树实际结构

```
/
├── zookeeper
├── kafka
└── bsoft-cdc
    ├── clients
    │   └── hosp-012
    │       ├── ip → {"ip":"10.16.18.86:10012","updateTime":"2026-08-05 13:45:59"}
    │       ├── jobs
    │       │   └── 112-source-19c
    │       │       ├── scn
    │       │       └── status
    │       └── status
    └── servers
```

### 10. 与 ARCHITECTURE.md §5.1 文档化节点模型的差异

| 文档化模型 | 实际节点结构 | 差异 |
|---|---|---|
| /bsoft-cdc/clients/{clientId}/alive (临时节点) | 无 alive 节点（未使用临时节点模式，或当前未连接） | alive 非临时节点模型 |
| /bsoft-cdc/clients/{clientId}/{jobName}/alive | jobs/{jobName}/ 下无 alive | 同上 |
| /bsoft-cdc/clients/{clientId}/{jobName}/scnUpdateTime | 无 scnUpdateTime | 仅 scn 和 status |

---

## 未执行操作

- 无 create、set、delete、rmr、deleteall、setAcl 等写操作
- 无 ZooKeeper 服务端启动/停止
- 无 ZooKeeper 软件安装或部署
- 无 pom.xml 或依赖版本修改
- 无数据库操作
- 无 chmod 操作（zkCli.sh 权限由用户在 R1 执行期间修正）

---

## 结论

ZK-ENV-001 只读验证结果：TCP 端口可达，ZK 会话建立成功，CLI 客户端与服务端版本一致 (均为 3.4.14)，`/bsoft-cdc/clients` 节点读取成功。三项正式配置已同步到 agent-env.sh、CLAUDE.md 和 application-dev.yml。

**ZK-ENV-001-R1 只读核验 (2026-08-11)**: application-dev.yml 只读核验通过 — connect-string 为 `10.19.16.111:2181`，root-path 为 `/bsoft-cdc`，均符合用户确认正式值。ENVIRONMENT.md 6处文档状态冲突已修正。zkCli.sh 执行权限已由用户修正。

Java 客户端/Curator 兼容性仍需独立任务在应用层验证——CLI 只读连接成功不能等同于项目 Curator 依赖与 ZK 3.4.14 的兼容性。
