# 探针端管理多 AC CRUD 与异常状态验收执行报告

- 任务编号：`CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001`
- 执行日期：2026-11-04
- 分支：`develop`
- 起始提交：`2304e3181595889d87dcdcefb4ce612afcd5e58e`
- 范围：`CCFG-AC-020/026/031/039/040/054/058/060/061/062/082/115/121/131/139/140/145` 共 17 条
- 证据目录：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001/`

> 本报告只记录本批 17 条的真实执行结果。批次 17 条通过不等于 157 条整体验收通过，也不等于 Feature 正式接受或其他页面迁移授权。本报告不预填自身提交 SHA，不预宣布远程复审通过。

## 1. 任务与授权

项目负责人在本会话中明确授权：

1. **“一次覆盖多个验收项。”**
2. **“当前任务中，CDC_CLIENT_MULTIPLE表的数据可以随意操作，随意增删改，完成之后不必清理。”**

授权边界：

- 仅限 `CDC_CLIENT_MULTIPLE` 的数据操作，通过真实页面/业务 API 或直接 DML；
- 不含 DDL、其他表数据修改、外部进程或 ZooKeeper/Kafka 写入；
- 未执行全表 `TRUNCATE/DROP` 或无差别清空；
- 直接 DML 只用于前置样本与后置读取，未替代被验收的页面/API 行为；
- 未访问其他功能页面，未操作 sync-client/sync-server/ZK/Kafka；
- 未修改产品源码、CSS、产品测试、依赖、配置、模板、其他 Feature、REQ/DESIGN/UI/API/DATABASE。

## 2. 真实业务执行与保留样本

### 2.1 服务与版本

| 项目 | 值 |
|---|---|
| 后端 | `java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`，PID 3670，监听 `*:8080` |
| 后端产物 | SHA256 `efdbea827b6ab84dd47105d2cc130f0bc3c5b70dc78cc626b6421e1f9750a459`，mtime 2026-09-22 12:21:27 |
| 前端 | `npm run dev -- --host 0.0.0.0 --port 5173`，PID 3743（Vite 子进程 PID 3756），监听 `0.0.0.0:5173` |
| 运行环境 | JDK 1.8.0_202、Node v24.17.0、npm 11.13.0、Oracle 19c 开发库（连接信息取自既有环境配置，未在报告或证据中输出凭据） |
| 服务处置 | `START-ONLY` 复用既有产物与已安装依赖；未重建、未改配置、未重启健康服务 |
| 本机探活 | 前端根路径 HTTP 200；`GET /api/clients?status=ALL` HTTP 200 |

**限制**：后端 jar 的 mtime 早于本任务，仅能证明启动的是该既有产物，不能证明其与当前工作区源码逐字节一致；本任务按授权未重新构建。

### 2.2 业务写尝试（实际计数）

| 来源 | 尝试数 | 到达后端 | 说明 |
|---|---:|---:|---|
| 留档证据运行（A–F + 补充） | 30 | 27 | 3 次为标注的目标 URL 网络中断，未到后端 |
| 因探针缺陷放弃并重跑的两轮 | 7 | 7 | Group A 首轮 5 次；Group D 首轮 2 次；均已用夹具 DML 复位后重跑 |
| AC-121 网络补充 | 1 | 0 | 标注的 `PUT /api/clients/MULTIAC-DESC` 中断 |
| **合计** | **38** | **34** | 按操作：POST 5、编辑 PUT 19、启用 3、停用 6、删除 5 |

留档证据运行的 30 次分布：

- Group A 5：创建 `MULTIAC-NEW1` 1、`MULTIAC-DESC` 编辑 4（含 1 次真实 `40102` 拒绝）。
- Group B 7：`MULTIAC-ID1`/`MULTIAC-id1` 编辑 5（含 `40940`、`40101` 拒绝与后端直连）、`POST MULTIAC-OCC` 占用 1、`MULTIAC-ID1X` 编辑 1。
- Group C 5：两次真实 `40941` 创建拒绝、描述超限变异请求 1（真实 `40102`）、网络中断 1、成功保存 1。
- Group D 2：`MULTIAC-ABN2` 停用 1、`MULTIAC-ABN3` 删除 1（修正探针后重跑）。
- Group E 5：`MULTIAC-E139A` 停用成功、`MULTIAC-E139F` 停用中断、`MULTIAC-OFF1` 启用成功（双击确认仍仅 1 请求）、`MULTIAC-ENC` 启用真实 `40941`、`MULTIAC-DESC` 延迟保存成功。
- Group F 6：`MULTIAC-DEL1` 删除、`MULTIAC-F145A` 停用、`MULTIAC-OFF1` 停用、`MULTIAC-ENC` 启用 `40941`、`MULTIAC-DEL2` 删除、`MULTIAC-F145D` 删除中断。

### 2.3 被放弃并重跑的探针轮次

| 轮次 | 缺陷 | 处置 | 业务写影响 |
|---|---|---|---|
| Group A 首轮 | 结果对象 `s4` 未初始化，保存成功后赋值抛错 | 初始化字段；用夹具 DML 删除 `MULTIAC-NEW1` 并复位 `MULTIAC-DESC` 描述后重跑 | 5 次尝试（均到达后端），已计入合计 |
| Group D 首轮 | Element Plus 下拉 popper 淡出未完成，`openMenu` 读到上一行的菜单（错位一格） | 等待可见 popper 数恰为 1、读取作用域限定到该 popper；复位 `MULTIAC-ABN2`、重建 `MULTIAC-ABN3` 后重跑 | 2 次尝试（均到达后端），已计入合计 |

两轮缺陷均属探针脚本问题，不是产品缺陷；修正后结果见对应 `group-*-results.json`。

### 2.4 注入清单（仅以下注入，均标注）

| 注入 | 目标 | 目的 | 是否到达后端 |
|---|---|---|---|
| 请求体变异 | `PUT /api/clients/MULTIAC-DESC`（`clientDesc` 改为 257 个四字节码点，1028 字节） | 从真实弹窗触发真实后端 `40102` 字段级错误 | 是 |
| 网络中断 | `PUT /api/clients/MULTIAC-DESC` | AC-121 全局（非字段）错误路径 | 否 |
| 网络中断 | `PUT /api/clients/MULTIAC-E139F/disable` | AC-139 停用失败 | 否 |
| 请求延迟 1800ms | `PUT /api/clients/MULTIAC-DESC` | AC-115 观察 submitting/loading 并尝试重复提交 | 是 |
| 网络中断 | `DELETE /api/clients/MULTIAC-F145D` | AC-145 删除失败保留选中 | 否 |

### 2.5 保留样本（按授权不清理）

- 保留 `MULTIAC-*` 合成样本 **14** 行，快照见 `retained-fixtures-snapshot.txt`。
- 异常态样本：`MULTIAC-ABN1`（`FG_ACTIVE='2'`，保留三态对照）；`MULTIAC-ABN2` 经真实 UI 停用归 `'0'`；`MULTIAC-ABN3` 经真实 UI 删除。
- 冲突样本：`MULTIAC-CONFA`（`FG_ACTIVE='1'`，持有 DS08）与 `MULTIAC-ENC`（`FG_ACTIVE='0'`，同样持有 DS08），用于真实 `40941` 冲突。
- 验证用样本：`MULTIAC-DEL1/DEL2` 已删除；`MULTIAC-DEL3/F145D` 保留；`MULTIAC-E139A` 已停用；`MULTIAC-E139F` 保持启用；`MULTIAC-F145A` 已停用；`MULTIAC-OFF1` 在 AC-145 分支后已停用；`MULTIAC-DESC` 描述更新为 AC-115 观察值。
- **未执行恢复/清理动作，故不报告 `RESTORED`。**

### 2.6 夹具 DML

- `fixture-prepare.sql`：2 条 `UPDATE`（释放 `CCFG-AC-R1-ON/OFF` 的源）+ 10 条 `INSERT`（`MULTIAC-*` 样本）= 12 条。
- `fixture-prepare-group-ef.sql`：4 条 `INSERT`（`E139A/E139F/F145A/F145D`）。
- 重跑前人工复位：4 条（`MULTIAC-NEW1` 删除、`MULTIAC-DESC` 描述复位、`MULTIAC-ABN2` 复位、`MULTIAC-ABN3` 重建）。
- 全部只作用于 `CDC_CLIENT_MULTIPLE`；无 DDL，无其他表写入。

## 3. 逐 AC 判定

| AC | 关联需求 | 真实执行要点 | 证据键 | 判定 |
|---|---|---|---|---|
| `CCFG-AC-020` | `CCFG-REQ-026` | 未选中任何行时，从 `MULTIAC-DEL1` 的“更多”点击“删除”，二次确认后 `DELETE` 返回 200；删除后 GET 无该行、SQL 查询 0 行 | `group-f-results.json` `ac020.before/menuItems/confirm/after`；`group-f-sql-verification.txt` | `PASS` |
| `CCFG-AC-026` | `CCFG-REQ-034/097` | 异常行菜单仅“停用/删除”无“启用”；真实 UI 停用 `MULTIAC-ABN2` → `FG_ACTIVE='0'`；另一异常行 `MULTIAC-ABN3` 真实 UI 删除成功，兄弟行保持 | `group-d-results.json` `ac026.disable/delete`、`viewports.*.menus` | `PASS` |
| `CCFG-AC-031` | `CCFG-REQ-041` | 新增表单标签仅“探针 ID/探针描述/采集数据源”，无状态字段；真实 UI 创建 `MULTIAC-NEW1` 后 `FG_ACTIVE='1'` | `group-a-results.json` `ac031` | `PASS` |
| `CCFG-AC-039` | `CCFG-REQ-048` | 仅大小写改名成功；大小写冲突/精确冲突返回 `40940` 且字段级提示；非法格式前端阻断（0 请求）且后端直连 `40101`；合法新 ID 成功 | `group-b-results.json` `ac039.step1..step5` | `PASS` |
| `CCFG-AC-040` | `CCFG-REQ-049` | 同时改 ID/描述/源，真实后端 `40941` 拒绝；原 ID、描述、源均不变，新 ID 不存在，无部分写入 | `group-b-results.json` `ac040` | `PASS` |
| `CCFG-AC-054` | `CCFG-REQ-066` | 编辑弹窗按**原** `clientId` 请求候选（`excludeClientId` 原 ID）；改动未保存的新 ID 时自有源仍可选；移除选择后该源可选、无“已分配”原因 | `group-b-results.json` `ac054`；`ac054-supplement-results.json` `observations` | `PASS` |
| `CCFG-AC-058` | `CCFG-REQ-071` | 前端候选过时仍由真实后端写前校验拒绝 `40941`，不创建行，源仍被占用 | `group-c-results.json` `ac058` | `PASS` |
| `CCFG-AC-060` | `CCFG-REQ-073` | 改名同时保留自有源成功；编辑器以原 ID 为排除键；新 ID 持久化、旧 ID 不存在、源保留 | `group-b-results.json` `ac060`、`ac054.optionsRequestUrl` | `PASS` |
| `CCFG-AC-061` | `CCFG-REQ-074` | 多源中仅一个冲突（DS08）时整体拒绝 `40941`；未创建行，未选中的 DS06 仍可选，无部分写入 | `group-c-results.json` `ac061` | `PASS` |
| `CCFG-AC-062` | `CCFG-REQ-075` | 冲突提示含机构名、数据源 ID 与冲突探针 ID（`MULTIAC-CONFA`/`MULTIAC-ENC`） | `group-c-results.json` `ac062` | `PASS` |
| `CCFG-AC-082` | `CCFG-REQ-096` | 1440×900 与 1920×1080：最右固定“操作”列（`sticky`/`right:0`）；`FG_ACTIVE='1'` 菜单“停用/删除”、`'0'` 菜单“启用/删除”、异常菜单“停用/删除”；点“更多”不打开编辑弹窗、不产生选中行 | `group-d-results.json` `viewports.1440x900/1920x1080.structure/menus`、`ac082.snapshotBefore` | `PASS` |
| `CCFG-AC-115` | `CCFG-REQ-120` | 主提交按钮常态 `#09090b/#ffffff/6px/500`；Hover/聚焦 `#27272a`、按下 `#18181b`；表单不完整时按钮可点且黑色，点击出现 3 条字段级错误、0 写；提交处理中 `#3f3f46`、loading 可见、重复点击仅 1 次 PUT；“取消/自动生成/修改探针 ID”未变黑 | `group-e-results.json` `ac115`；`ac115-supplement-results.json` `baseAfterPointerAway/fieldErrors/writeCount` | `PASS` |
| `CCFG-AC-121` | `CCFG-REQ-125` | 描述超限真实 `40102` 显示在描述字段下且弹窗保持；网络中断为全局提示（`Network Error` + `编辑失败，请检查网络后重试。`）、无字段错误、库不变；成功保存关闭弹窗并重新加载；空描述/ID/源/字节上限条件沿用 A/B 证据 | `group-c-results.json` `ac121`；`ac121-network-supplement-results.json` | `PASS` |
| `CCFG-AC-131` | `CCFG-REQ-132、CCFG-REQ-039` | 256 汉字 = 768B 精确保存；256 个四字节码点 = 1024B 精确保存；绕过前端直接提交 1028B 被 `40102` 拒绝且无部分写；首尾空白仅用于判空、原文保存；前端第 257 个码点截断（复用 002-R1 已复核键） | `group-a-results.json` `ac131.s1..s5` | `PASS` |
| `CCFG-AC-139` | `CCFG-REQ-140` | 停用确认标题“停用探针”、正文 `确定停用探针 {id} 吗？`、按钮“取消/停用”；取消 0 写且状态不变；成功归 `'0'` 并出现“停用”标记；网络失败提示可读且状态不变 | `group-e-results.json` `ac139` | `PASS` |
| `CCFG-AC-140` | `CCFG-REQ-141` | 启用确认标题“启用探针”、正文 `确定启用探针 {id} 吗？`、按钮“取消/启用”；取消 0 写、状态与固定选中不变；成功**恰 1 次** PUT 归 `'1'`、“停用”标记消失；真实 `40941` 失败提示可读且状态不变 | `group-e-results.json` `ac140` | `PASS` |
| `CCFG-AC-145` | `CCFG-REQ-146` | ① 另一行 A 选中时停用 B 成功 → 选中落在 B；② “启用”筛选下停用目标并按该条件重载 → 目标消失、选中清空；③ 取消确认 → 选中不变；④ 启停失败 → 选中不变；⑤ 删除成功 → 选中清空；⑥ 删除取消/失败 → 选中不变 | `group-f-results.json` `ac145.b1..b6` | `PASS` |

未覆盖项与 `FAIL`：**无**。

## 4. 证据索引与复现

| 文件 | 内容 |
|---|---|
| `fixture-prepare.sql` / `fixture-prepare-group-ef.sql` | 夹具 DML（无凭据） |
| `probe-group-a.cjs` / `group-a-results.json` | AC-131、AC-031 |
| `probe-group-b.cjs` / `group-b-results.json` | AC-039、AC-054、AC-060、AC-040 |
| `probe-ac054-supplement.cjs` / `ac054-supplement-results.json` | AC-054 自排除补充 |
| `probe-group-c.cjs` / `group-c-results.json` | AC-058、AC-061、AC-062、AC-121 |
| `probe-ac121-network-supplement.cjs` / `ac121-network-supplement-results.json` | AC-121 全局提示补充 |
| `probe-group-d.cjs` / `group-d-results.json` | AC-082、AC-026 |
| `probe-group-e.cjs` / `group-e-results.json` | AC-139、AC-140、AC-115 |
| `probe-ac115-supplement.cjs` / `ac115-supplement-results.json` | AC-115 非悬停黑色态补充 |
| `probe-group-f.cjs` / `group-f-results.json` | AC-020、AC-145 |
| `group-f-sql-verification.txt` | AC-020/145 的 SQL 后置核对 |
| `retained-fixtures-snapshot.txt` | 结束时保留样本快照 |
| `environment-and-versions.md` | 环境、版本、服务与产物 |
| `ac-matrix.md` | 逐 AC 覆盖矩阵 |
| `SHA256SUMS` | 证据文件校验和 |

复现前置：后端/前端按第 2.1 节运行；执行两份夹具 SQL；按 `probe-group-a..f` 顺序运行；注入仅限 2.4 列出的目标。探针依赖 Playwright Core 与 Chromium，命令见各脚本头注释。

## 5. 文档变更与统计

- `ACCEPTANCE.md`：17 个目标状态格 `BLOCKED`/`NOT_RUN` → `PASS`；新增 §1.36 批次状态块；其余 140 个状态格与 157 条定义行不变。
- `README.md`：追加最小摘要、报告导航、当前统计与下一入口。
- 新增本报告与证据目录。
- 统计：**`PASS` 101 / `FAIL` 0 / `BLOCKED` 48 / `NOT_RUN` 8 = 157**（按实际状态格独立复算）。
- 四族定义数量：`REQ154 / AC157 / DESIGN89 / UI77`（不变）。

## 6. 边界与未执行项

- 本批 17 条通过**不等于** 157 条整体验收通过，也**不等于** Feature 正式接受或页面迁移授权。
- 未运行全量产品测试、构建、lint、类型检查（任务明确不要求）；未访问其他功能页面；未操作 sync-client/sync-server/ZK/Kafka；未做 DDL 或其他表写入。
- 未做恢复/清理动作，**不**报告 `RESTORED`；按授权保留合成样本与异常/冲突态。
- 外部访问：服务监听 `0.0.0.0`，本机 HTTP 200；`192.168.174.70` 侧网络可达性未由本任务独立证明。

## 7. 服务与停止方式

- 前端：`http://192.168.174.70:5173/config/client`（本机 `http://127.0.0.1:5173/config/client`）；实际监听 Vite 进程 PID 3756（启动包装 shell PID 3743），日志 `runtime-logs/CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001/frontend-5173.log`
- 后端：`http://192.168.174.70:8080`（本机 `http://127.0.0.1:8080`）；实际监听 java 进程 PID 3670（启动包装 shell PID 3668），日志 `runtime-logs/CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001/backend-8080.log`
- 停止（终止实际监听进程）：`kill 3756 3670`；如包装 shell 仍在，再 `kill 3743 3668`。`frontend.pid`/`backend.pid` 记录的是包装 shell PID，仅杀包装 PID 不会停止端口监听。
- 按任务要求服务保持运行，供项目负责人验收。

## 8. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_MULTI_AC_CRUD_AND_ABNORMAL_STATE_ACCEPTANCE_REVIEW`
