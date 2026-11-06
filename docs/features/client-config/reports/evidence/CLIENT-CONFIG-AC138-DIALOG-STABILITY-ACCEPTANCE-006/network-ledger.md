# 网络门禁与长错误回放台账（006）

## 1. 门禁

- 安装时机：浏览器**首次导航前**，`context.route('**/api/**')`。
- 规则：`GET` / `HEAD` / `OPTIONS` 放行；其余方法计数并默认 `abort`。
- 唯一受控例外：仅长错误场景内，`POST /api/clients` 由浏览器内路由**本地回放** 005 已入仓的 40941 响应，**不转发后端**。其余非 GET 一律中止。
- 浏览器上下文仅访问 `/config/client`；未打开数据源管理或其他功能页面。

## 2. 请求统计（原始结果 `results/ac138-stability.json → gate`）

| 类别 | 数量 | 说明 |
|---|---|---|
| GET 合计 | 8 | 其中 1 条为 Vite 开发模块 `/src/api/clientConfig.ts`（路径含 `/api/` 被门禁记录，非业务接口） |
| 业务 GET | 7 | `GET /api/clients` 1 次（初始列表）+ `GET /api/clients/data-source-options` 6 次（每次打开弹窗） |
| 业务非 GET 尝试 | **3** | 均为 `POST /api/clients`，均在长错误场景 |
| 其中本地回放 | 3 | `outcome=replayed-locally`，`forwarded=false` |
| 其中中止 | 0 | — |
| **转发到后端的非 GET** | **0** | `gate.backendNonGetForwarded=0` |
| 六步稳定性序列产生的非 GET | 0 | 未选数据源时的红色错误是前端校验，无 HTTP 请求 |

## 3. 长错误回放

- 来源：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-DIALOG-ACCEPTANCE-005/results/probeB-write.json → gate.responses[0]`（005 当次真实后端 40941 记录）。
- 回放方式：在浏览器内拦截 `POST /api/clients`，以 HTTP 200 + 以下脱敏 JSON 体 `fulfill`；请求**未发送到后端**。
- 渲染路径：真实应用 `submitDialog` → `applyServerFieldError`（`SOURCE_ERROR_CODES` 含 40941）→ 采集数据源字段反馈区；未插入 DOM、未改 CSS。

```json
{
  "code": 40941,
  "message": "数据源“CCFG005超长机构名称用于错误换行验证样本（CCFG005-DS-LONG-0123456789ABCDE）”已分配给探针：CCFG005-OCC1，不能重复分配。",
  "data": null,
  "timestamp": "2026-11-06T13:21:27.194"
}
```

- 三次拦截的请求体均为本批合成探针（`CCFG006-LONG-1920` / `CCFG006-LONG-2560` / `CCFG006-LONG-1024`）与合成/既有可选数据源 `CCFG-AC-R1-DS05`，不含真实业务记录或凭据；完整请求体见原始 JSON `replay.interceptions[]`。
- **回放 ≠ 本轮真实后端响应**；本轮未产生任何真实业务写。

## 4. 写入与外部状态

| 项目 | 数量 |
|---|---|
| 业务写成功 | 0 |
| 业务写尝试（含本地回放） | 3 次 POST，全部未出浏览器 |
| 数据库直连/查询 | 0 |
| 夹具 DML / COMMIT | 0 / 0 |
| ZooKeeper / Kafka 操作 | 0 |
| 服务启停 / 构建 / 配置修改 | 0 |
