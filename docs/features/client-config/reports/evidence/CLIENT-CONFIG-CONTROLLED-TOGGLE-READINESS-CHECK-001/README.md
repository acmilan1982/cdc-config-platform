# CLIENT-CONFIG-CONTROLLED-TOGGLE-READINESS-CHECK-001 证据说明

只读就绪核查证据。仅调用既有业务 GET 接口，不执行启停、保存、删除或任何非 GET 业务请求；未创建/修改探针或关联源；未访问数据库、ZooKeeper、Kafka；未查看或操作 sync-client 进程；未运行测试、构建、lint、类型检查；未启动、停止或重启服务。

## 文件

| 文件 | 内容 |
|---|---|
| `probe-readiness-get-only.mjs` | 仅 GET 的就绪核查脚本：读取列表，按 `FG_ACTIVE='0'`、token、行异常/逗号歧义/源异常/重复占用筛选技术候选，并按候选调用一次 `data-source-options?excludeClientId=<原始ID>`；脚本不含写方法分支 |
| `readiness-results.json` | 脱敏结果：别名 `T01/T02`、源别名 `S01..`、计数、布尔条件、排除原因聚合、请求方法与脱敏路径；不含真实 clientId/描述/机构/源 ID |
| `env-and-version.txt` | 采集时点、三方 Git SHA、源码最后提交、服务进程/端口、jar mtime+sha256 与限制、请求纪律与脱敏口径 |
| `README.md` | 本说明 |
| `SHA256SUMS.txt` | 上述文件的 SHA-256 |

## 采集方式

```bash
mkdir -p /root/cdc-controlled-toggle-readiness-001 && chmod 700 /root/cdc-controlled-toggle-readiness-001
MAPPING_OUT=/root/cdc-controlled-toggle-readiness-001/candidate-map.json \
  node docs/features/client-config/reports/evidence/CLIENT-CONFIG-CONTROLLED-TOGGLE-READINESS-CHECK-001/probe-readiness-get-only.mjs
```

- 后端：既有 Spring Boot jar（pid 8120，`:8080`）；前端：既有 Vite（pid 8141，`0.0.0.0:5173`）。均复用，未启停/未构建。
- 脚本实际仅发出 `GET /api/clients?status=ALL`（1 次）与 `GET /api/clients/data-source-options?excludeClientId=<原始 clientId>`（每个候选 1 次，共 2 次）；`write_requests=0`。
- 未使用浏览器，未安装浏览器网络拦截；本证据**不是**数据库层零写审计，只证明脚本本身仅调用 GET。

## 结果要点

- 列表 16 行：`FG_ACTIVE='0'` 15 行、`'1'` 1 行、非 `0/1` 0 行。
- 两行通过技术初筛，别名 `T01`（7 个关联源）、`T02`（1 个关联源）；两者每个关联源在 E1 中 `anomalies=[]`、`conflictClientIds=[]`，在按原始 clientId 自排除的 E2 中均存在且 `selectable=true`。
- 排除原因聚合（同一行可命中多项）：`FG_ACTIVE_NOT_EXACT_0` 1、`SOURCE_ANOMALY` 8、`SOURCE_CONFLICT` 7、`NO_DATA_SOURCE_TOKEN` 5、`ROW_ANOMALY` 1、`COMMA_AMBIGUITY` 1。
- E1 `conflictClientIds` 与 E2 占用均只是**时点快照**，不证明执行窗口内不会发生并发变化。

## 脱敏

- 仓库内只保留别名、计数、布尔条件与排除原因；真实 clientId、描述、机构、源 ID、连接信息与原始响应不落盘。
- 别名→完整 clientId（含描述与 token）映射保存在仓库外临时文件，权限 `600`；路径仅在最终执行回复中告知负责人。
- 候选仍是“待负责人绑定”，不等于已专用、已隔离或可执行。

## 边界

- 未执行 `PUT .../enable`、`PUT .../disable`、保存、删除或任何写请求；未点击 UI 启停/删除最终确认。
- 未访问 `/config/client` 以外的功能页面；未跨页采集。
- 未将候选名称是否含 test/demo 当作负责人确认。
