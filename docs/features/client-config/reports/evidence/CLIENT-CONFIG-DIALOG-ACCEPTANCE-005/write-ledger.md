# 005 写入台账（业务写 / 预期拒绝 / 前端零写 / 受控注入）

任务：`CLIENT-CONFIG-DIALOG-ACCEPTANCE-005`
页面范围：仅 `/config/client`。未打开、操作或测试 `/config/data-source` 或其他功能页面。

## 1. 写入边界

- 只读探针 A：首次导航前安装 `context.route('**/api/**')`；GET/HEAD/OPTIONS 放行，所有非 GET abort 并计数。实测非 GET 尝试 **0**。
- 写探针 B：网络门禁只放行两类 `POST /api/clients`：
  1. `clientId=CCFG005-NEW` + `dataSourceIds=['CCFG005-DS-LONG-0123456789ABCDE']`，立即转发（真实后端拒绝，预期 40941）；
  2. `clientId=CCFG005-NEW` + `dataSourceIds=['CCFG-AC-R1-DS06']`，延迟 5000 ms 后转发（真实成功写）。
- 其他一切非 GET 业务请求 abort 并计数；`aborted=[]`（最终运行无被拒请求）。
- 受控注入仅限网络层的 5000 ms 延迟；未伪造请求体、未伪造响应、未修改 DOM/CSS。40941 是真实后端业务码。

## 2. 业务 API 写尝试

### 2.1 最终证据运行（探针 B 第 3 次运行）

| # | 动作 | 方法/路径 | 请求体摘要 | HTTP | 业务码 | 结果 |
|---|---|---|---|---|---|---|
| 1 | 直接 Node fetch 建立占用（页面外） | `POST /api/clients` | `CCFG005-OCC1` + `[LONG_ID]` | 200 | 200 | 真实写 |
| 2 | 浏览器提交冲突源 | `POST /api/clients` | `CCFG005-NEW` + `[LONG_ID]` + 合成描述 | 200 | 40941 | 预期拒绝（真实后端） |
| 3 | 浏览器提交安全源（门禁延迟 5000 ms） | `POST /api/clients` | `CCFG005-NEW` + `[CCFG-AC-R1-DS06]` + 合成描述 | 200 | 200 | 真实写 |

- 忙碌窗口内真实鼠标重复点击：不产生额外请求；门禁记录 `POST` 总数 = 2（冲突 + 成功）。
- 成功响应后：对话框关闭，`新增成功` toast 被 MutationObserver 捕获。
- 独立回读：`GET /api/clients?status=ALL` 返回 `CCFG005-NEW`（`fgActive=1`、`status=ENABLED`、`dataSources=[CCFG-AC-R1-DS06]`）；列表行文本包含该 ID 与机构名。

### 2.2 已作废的前两次运行（如实保留）

- 第 1 次：直接写 OCC1（200/200）；直接写 OCC2（200/40941，因数据源只能分配给一个探针而被拒绝，未产生行）；冲突提交（40941）；成功提交（200/200）。
- 第 2 次：直接写 OCC1（200/200）；冲突提交（40941）；成功提交（200/200）；未捕获 HTTP 响应体，故以第 3 次为最终证据。
- 两次运行产生的合成探针均已通过定向 DELETE 清理，再重新建立；详见 `fixture-ledger.md`。

### 2.3 合计

| 类别 | 数量 |
|---|---|
| 业务 API 非 GET 尝试（全部运行） | 10 |
| 其中真实成功写 | 6 |
| 其中真实后端预期拒绝 | 4 |
| 最终证据运行成功写 | 2（OCC1 建立 + NEW 创建） |
| 最终证据运行预期拒绝 | 1（40941） |
| 前端零写（只读探针 A 非 GET） | 0 |
| 忙碌期重复点击新增请求 | 0 |

## 3. 独立回读与后置校验

- API 回读：`GET /api/clients?status=ALL`（见 `results/probeB-write.json` → `sections.readback.api`）。
- 必要 SELECT：`CDC_CLIENT_MULTIPLE` 中 `CCFG005%` 两行；`CDC_DATA_SOURCE` 中 5 个夹具；资格谓词计数 239。
- 候选 API 与 DB 互证：`GET /api/clients/data-source-options` 总数 239 = DB 资格行 239。
- 冲突源在占用后的 API 读回：`selectable=false`、`notSelectableReason=OCCUPIED`、`occupiedByClientIds=['CCFG005-OCC1']`。

## 4. 边界说明

- `CDC_CLIENT_MULTIPLE` 的合成行由产品 API 写入；`CDC_DATA_SOURCE` 的 5 行由夹具 SQL 写入。
- 未执行 DDL；未对其他表执行 DML；未写 ZooKeeper/Kafka；未连接源库；未启停/操作运行侧进程。
- 测试数据按任务约定保留，不要求清理或恢复。
