# 06 — DS-AC-169 / DS-AC-181 运行日志、外部系统与 API/VO 敏感字段审计

任务编号：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
证据层：**真实应用运行日志 + 真实 HTTP API 响应 + 后端源码静态审计**
覆盖用例：`DS-AC-169`、`DS-AC-181`
采集时间：2026-09-20 13:34 ~ 13:40（本地）

---

## 1. 采集对象与身份

| 项 | 值 |
|---|---|
| 后端进程 | PID `14440`，`java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=127.0.0.1`，启动于 2026-09-20 10:32:47 |
| 后端监听 | `[::ffff:127.0.0.1]:8080`（回环，符合 §5.2） |
| 前端进程 | PID `14579`，`node .../frontend/node_modules/.bin/vite`，启动于 2026-09-20 10:35:13 |
| 前端监听 | `0.0.0.0:5173` |
| 后端日志 | `runtime-logs/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-TEMP-ACCEPTANCE-RUN-001/backend-8080.log`（508 行，81,553 字节，采集时） |
| 前端日志 | 同目录 `frontend-5173.log`（9 行） |
| 页面 | `http://192.168.174.70:5173/config/data-source` |

---

## 2. DS-AC-169 — 成功提示文案、后端日志与外部系统访问、进程/ZooKeeper/Kafka 不变

### 2.1 判定标准（ACCEPTANCE.md §4.17 正文）

> 未访问源库；未操作任何进程、ZooKeeper 或 Kafka；成功提示**不声称**进程已启动/停止或配置已实时生效，只陈述状态字段已更新。

### 2.2 成功提示文案（真实浏览器捕获）

启用/停用成功后，页面 toast（`.el-message`）文本，来自本轮真实浏览器用例日志：

```text
数据源状态已更新
```

出现位置（原始证据）：
- `runtime-logs/.../phaseB-case-i.log:51`（UI 停用）
- `runtime-logs/.../phaseB-case-j.log:28`、`:48`（UI 启用）
- `runtime-logs/.../phaseB-case-j2-176.log:20`、`:50`（已应用条件下的启用/停用）

文案源码位置：`frontend/src/views/data-source/DataSourcePage.vue` `onToggleStatus()` 成功分支
`ElMessage.success('数据源状态已更新')`。

结论：成功提示只陈述“状态已更新”，**不含**“进程已启动/已停止”“配置已实时生效”“重启成功”等措辞。PASS。

### 2.3 后端日志审计

对后端日志执行两类扫描（原始输出见 `/tmp/fa001/audit/ds-ac-169-181-log-audit.txt`）：

**(a) 副作用扫描** `zookeeper|kafka|zkCli|ProcessBuilder|Runtime.getRuntime|restart|shutdown`

命中行仅为本应用标准启动时 Curator/ZooKeeper 客户端自身建立的**只读会话**日志（第 29–47 行启动期 `Client environment:*` 与 `Session establishment complete ... sessionid = 0x10922dad14a00c9`），以及第 149–150 行监看页触发的一次只读查询：

```text
149: ... c.b.c.m.z.c.ZooKeeperMonitorController : ZK monitor clients request
150: ... .b.c.m.z.s.i.ZooKeeperMonitorServiceImpl : ZK monitor query completed: 1 clients, 116ms
```

- **无** `kafka` 命中。
- **无** `ProcessBuilder` / `Runtime.getRuntime` 命中（即应用从未派生/操作外部进程）。
- 无任何 ZooKeeper **写** API（`create` / `setData` / `delete` / `setACL` / `reconfig` / `transaction`）日志。

**(b) 环境侧 ZooKeeper 会话抖动（本次如实记录，非本 Feature 操作）**

日志第 226–256、386–507 行存在 Curator `ConnectionState` 的会话超时/重连记录，例如：

```text
2026-09-20 13:33:36.485 WARN  --- [19.16.111:2181)] org.apache.zookeeper.ClientCnxn : Client session timed out, have not heard from server in 20011ms for sessionid 0x10922dad14a00ca
2026-09-20 13:33:54.604 ERROR --- [tor-Framework-0] o.a.c.f.imps.CuratorFrameworkImpl : Background operation retry gave up
org.apache.zookeeper.KeeperException$ConnectionLossException: KeeperErrorCode = ConnectionLoss
```

性质判定：
- 触发线程为 Curator 后台框架线程 `[tor-Framework-0]` / ZooKeeper 事件线程 `[ain-EventThread]`，**不是** 请求处理线程 `[0.1-8080-exec-*]`；
- 这是 ZK **客户端**与服务端 `10.19.16.111:2181` 之间的会话保活失败（环境侧 ZK 服务端不可达/响应超时），属于环境状态；
- 期间数据源启用/停用请求（`[0.1-8080-exec-*]` 线程）未受影响，成功提示与 DB 写入均正常；
- **不构成本 Feature 对 ZooKeeper 的写操作**，也不构成本 Feature 操作导致的副作用。

已按 §8 要求把“应用标准启动自动建立的只读会话”与“环境状态”如实区分记录。

### 2.4 静态审计：启用/停用代码路径与 ZooKeeper/Kafka 零耦合

```bash
grep -rn 'zookeeper|ZooKeeper|kafka|Kafka|curator|Curator' \
  backend/src/main/java/com/bsoft/cdcconfig/datasource
```

结果：`MATCHES=0` — `datasource` 包（含 `DataSourceServiceImpl`、`DataSourceController`、`connection/*`）**完全不引用** ZooKeeper / Kafka / Curator。

启用/停用入口（`DataSourceController.java:111-122`）→ `dataSourceService.enable/disable`（`DataSourceServiceImpl.java:192/206`），实现只做：读主表原始 `FG_ACTIVE` → 条件单条 `UPDATE`。全路径不含任何跨系统调用。

### 2.5 进程与外部系统快照（启用/停用执行后）

```text
14440  1  03:02:52  Sun Sep 20 10:32:47 2026  java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=127.0.0.1
14579  14568  03:00:26  Sun Sep 20 10:35:13 2026  node .../node_modules/.bin/vite
14587  14579  03:00:26  Sun Sep 20 10:35:13 2026  .../@esbuild/linux-x64/bin/esbuild --service=0.21.5 --ping

LISTEN 0 511       0.0.0.0:5173   users:(("MainThread",pid=14579,fd=22))
LISTEN 0 100 [::ffff:127.0.0.1]:8080  users:(("java",pid=14440,fd=23))

zkCli  进程：none
kafka  进程：none
```

后端与前端进程自启动以来 PID、启动时间、监听均未变化；无新增/消失进程。

### 2.6 源库/目标库访问

本轮全部启用/停用均为数据库状态字段写入，未建立任何到业务源库/目标库的连接（与 §8 一致）；连接测试类用例 `DS-AC-164` 使用任务自建数据的安全失败路径。后端日志中无真实业务源库/目标库连接成功记录。

### 2.7 DS-AC-169 判定

**PASS**
- 成功提示文案为“数据源状态已更新”，不声称进程启停或实时生效；
- 后端日志显示未操作任何进程、ZooKeeper（写）或 Kafka；
- 进程/端口快照前后一致；
- 未访问真实业务源库/目标库。

---

## 3. DS-AC-181 — API/VO 与日志的敏感信息扫描

### 3.1 判定标准（ACCEPTANCE.md §4.17 正文）

> API/VO **不返回**密码等敏感字段；启停日志与错误消息**不泄露**密码、凭据或其他敏感信息。

### 3.2 列表 API 字段审计

```bash
curl -s --noproxy '*' http://127.0.0.1:8080/api/data-sources   # HTTP 200
```

真实响应行数 47（34 条既有 + 13 条 `FACC001%` 任务自建）。全部行的字段键集合：

```text
["dataSourceCategory","dataSourceId","dataSourceName","dataSourceType","fgActive","host","port","serviceName","userName"]
```

- 敏感键（`password/passwd/pwd/secret/token/credential`）命中：**0**；
- 原始 JSON 文本正则扫描 `"(dataSource)?(password|passwd|pwd|secret|token|credential)"`：**无命中**。

`DataSourceListVO` 仅暴露上述 9 个字段，符合“不返回密码”。

### 3.3 详情 API 字段审计

```bash
curl -s --noproxy '*' http://127.0.0.1:8080/api/data-sources/FACC001-SRC-ON   # HTTP 200
```

真实响应（脱敏后原文）：

```json
{"code":200,"message":"success","data":{"dataSourceId":"FACC001-SRC-ON","dataSourceName":"FACC001源库启用","dataSourceCategory":"SOURCE","dataSourceType":"ORACLE","host":"fac001-src-on.host.internal.example.corp","port":1521,"userName":"fac001u","serviceName":"fac001svc"},"timestamp":"2026-09-20T13:35:39.881"}
```

`data` 键集合：`["dataSourceId","dataSourceName","dataSourceCategory","dataSourceType","host","port","userName","serviceName"]` — **不含** `password` 或任何敏感字段。`DataSourceDetailVO` 与 `DataSourceListVO` 同为无密码视图。

### 3.4 启停日志与错误消息审计

**(a) 后端日志敏感串扫描**（全程 508 行）

```
pattern: password|passwd|pwd=|credential|fac001pw|jdbc:oracle|secret|token
result : MATCHES=0
```

**(b) 前端日志敏感串扫描**（9 行）：`MATCHES=0`。

**(c) 页面/接口错误消息样本（真实捕获）**

```text
数据源状态异常，不可启用，请先停用以归一化状态      # 40250
数据源不存在: FACC001-SRC-NULL                    # 40400
数据源不存在: FACC001-NOPE-999                    # 40400
数据源不存在: FACC001-TGT-BAD                     # 40400
数据源ID已存在: DS001                             # 40900
Network Error                                     # 网络层失败（浏览器官网拦截）
```

均只包含业务状态说明与用例 ID，**不含**密码、凭据、Token、连接串。

**(d) 错误响应不泄露堆栈的源码依据**

`common/exception/GlobalExceptionHandler.java`：

- `BusinessException` → 仅返回 `ApiResponse.fail(e.getCode(), e.getMessage())`（无堆栈）；
- 兜底 `Exception` → `log.error("Unknown exception", e)` 记服务端日志，响应体只返回 `ApiResponse.fail(500, "服务器内部错误")`，不把堆栈返回前端。

**(e) 已有的密码与日志安全自动化测试（同一运行源，定向集内通过）**

`DataSourcePasswordLogSecurityTest`，5/5 通过（`runtime-logs/.../backend-targeted.log:264`）：

```text
createAndUpdatePaths_doNotLeakRandomSentinelPassword
unknownExceptionResponse_doesNotLeakSentinel
serviceBusinessAndUnknownErrors_doNotLeakSentinelIntoResponse
devConfig_declaresDatasourceMapperLevelInfo
devConfig_effectiveLevel_suppressesDebugBindingLogs
```

### 3.5 DS-AC-181 判定

**PASS**
- 列表 API/VO 与详情 API/VO 均不返回密码等敏感字段（真实 HTTP 200 响应字段集合已核）；
- 启停日志、错误消息、错误响应均不泄露密码/凭据/堆栈（日志扫描 0 命中 + 源码路径审计 + 已有密码日志安全测试 5/5 通过）。

---

## 4. 证据文件

| 文件 | 内容 |
|---|---|
| `/tmp/fa001/audit/ds-ac-169-181-log-audit.txt` | 上述日志/进程/静态扫描的原始命令输出（214 行） |
| `/tmp/fa001/audit/list.json` | 列表 API 原始脱敏响应 |
| `/tmp/fa001/audit/detail.json` | 详情 API 原始脱敏响应 |
| `runtime-logs/.../backend-8080.log` | 后端真实运行日志（508 行） |
| `runtime-logs/.../backend-targeted.log` | 定向自动化测试原始输出（147 条，含密码日志安全测试 5 条） |

本文件所有响应/日志已剔除密码、Token、Cookie、Authorization 与完整连接串，符合 §11 脱敏要求。
