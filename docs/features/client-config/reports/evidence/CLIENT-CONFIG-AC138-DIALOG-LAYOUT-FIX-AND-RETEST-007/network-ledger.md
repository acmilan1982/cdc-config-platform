# CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007 — 网络台账

- 采集方式：Playwright `context.route('**/api/**')`，在**首次导航前**安装；每个场景使用全新
  浏览器上下文；`serviceWorkers: 'block'`，禁用可能绕过拦截的 service worker。
- 放行规则：`GET` / `HEAD` / `OPTIONS` 直接转发（只读请求）。
- 非 GET 规则：仅长错误分支的提交请求按**实际方法 + 路径**精确匹配，在浏览器内以 005
  已入仓的 40941 响应**本地回放**，**绝不转发后端**；其他非 GET 一律中止并计数。
- 结论：**后端业务非 GET 转发 = 0**；无业务写入、无 DML/DDL、无夹具、无数据库直连。
- 回放来源：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-DIALOG-ACCEPTANCE-005/results/probeB-write.json`
  → `gate.responses[0].body`（HTTP 200，业务码 `40941`）。
- 说明：长错误分支是**浏览器本地回放**，不是本轮真实后端响应；本轮没有发生真实后端拒绝。

## 1. 修复后完整复测（ac138-fix-retest.json）

6 个场景：create/edit × 1920×1080、2560×1440，以及 create/edit × 1024×720 长错误回归。

### 1.1 只读请求（22 次）

| 请求 | 次数 | 用途 |
|---|---|---|
| `GET /src/api/clientConfig.ts` | 6 | Vite 按需加载页面 API 模块（每场景 1 次） |
| `GET /api/clients` | 6 | 列表首次加载（每场景 1 次） |
| `GET /api/clients/data-source-options` | 10 | 打开弹窗加载候选数据源：1K/2K 每场景 2 次（六步序列打开 + 长错误分支打开），1024 每场景 1 次 |

以上均为应用运行所需的只读请求，经既有后端正常返回，无写入。

### 1.2 非 GET 尝试（6 次，全部本地回放，转发 0）

| 场景 | 方法 | 精确 URL | 请求体（脱敏） | 结果 | 后端转发 |
|---|---|---|---|---|---|
| create 1920×1080 | POST | `/api/clients` | `clientId=CCFG007-LONG-1920`，`dataSourceIds=["CCFG-AC-R1-DS05"]` | `replayed-locally`，响应码 40941 | 否 |
| edit 1920×1080 | PUT | `/api/clients/probe-001` | `clientId=probe-001`，`dataSourceIds=["S3AC-S030-1"]` | `replayed-locally`，响应码 40941 | 否 |
| create 2560×1440 | POST | `/api/clients` | `clientId=CCFG007-LONG-2560`，`dataSourceIds=["CCFG-AC-R1-DS05"]` | `replayed-locally`，响应码 40941 | 否 |
| edit 2560×1440 | PUT | `/api/clients/probe-001` | `clientId=probe-001`，`dataSourceIds=["S3AC-S030-1"]` | `replayed-locally`，响应码 40941 | 否 |
| create 1024×720 | POST | `/api/clients` | `clientId=CCFG007-LONG-1024`，`dataSourceIds=["CCFG-AC-R1-DS05"]` | `replayed-locally`，响应码 40941 | 否 |
| edit 1024×720 | PUT | `/api/clients/probe-001` | `clientId=probe-001`，`dataSourceIds=["S3AC-S030-1"]` | `replayed-locally`，响应码 40941 | 否 |

合计：`nonGetTotal=6`，`backendNonGetForwarded=0`；原始键见 `results/ac138-fix-retest.json`
的 `gate.apiRequests`、`gate.nonGetAttempts`、`replay.interceptions`。

### 1.3 回放的 40941 正文（与 005 记录一致）

> 数据源“CCFG005超长机构名称用于错误换行验证样本（CCFG005-DS-LONG-0123456789ABCDE）”已分配给探针：CCFG005-OCC1，不能重复分配。

## 2. 修复前基线复现（baseline-repro-1k.json，仅 1K）

2 个场景：create/edit × 1920×1080，侧栏展开。

- 只读请求 8 次：`GET /src/api/clientConfig.ts` ×2、`GET /api/clients` ×2、
  `GET /api/clients/data-source-options` ×4。
- 非 GET 尝试 2 次（create `POST /api/clients`、edit `PUT /api/clients/probe-001`），
  全部本地回放，后端转发 0。
- 该轮用于证明修复前 `+16.37px` 位移确实可复现，不参与最终验收计数。

## 3. 边界

- 未访问 `/config/data-source` 或其他页面。
- 未直连数据库；页面只读接口由既有后端访问数据库，探针本身不发起 DB 连接。
- 未创建夹具，未操作 ZooKeeper/Kafka。
- 两轮探针均由本任务自行启动的前后端服务承载；仅停止本任务启动的进程。
