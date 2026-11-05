# 004 夹具与写入台账

## 1. SQL DML（仅 CDC_CLIENT_MULTIPLE / CDC_DATA_SOURCE，Agent 自建）

| 顺序 | 时间（UTC） | 语句 | 对象 | 行数 | 事务 |
|---|---|---|---|---|---|
| 1 | 2026-11-05T10:41:56Z | INSERT ×6 | CCFG004-ABN('X')、CCFG004-ON('1')、CCFG004-OFF('0')、CCFG004-OFF2('0')、CCFG004-DEL('1')、CCFG004-LONGID-0123456789ABCDEFG('1') | 6 | COMMIT ×1 |
| 2 | 2026-11-05T10:53:43Z–10:54:56Z | INSERT ×3 | CDC_DATA_SOURCE：CCFG004-DS-A、CCFG004-DS-B；CDC_CLIENT_MULTIPLE：CCFG004-DEL2('1') | 3 | COMMIT ×1 |
| 3 | 2026-11-05T10:58:36Z | DELETE ×1 | CCFG004-NEW1、CCFG004-HOLDER（两次探针运行之间的重新准备；两行均为本批合成对象） | 2 | COMMIT ×1 |

汇总：
- DML 语句：10（9 INSERT + 1 DELETE），涉及写入 11 行、删除 2 行。
- COMMIT：3。
- DDL：0；其他表写入：0。
- 既有 CDC_DATA_SOURCE 行修改：0（仅新增 2 行合成源）。

## 2. 浏览器业务写请求（真实页面/API，写门禁统计）

门禁：/api/** 的 GET/HEAD/OPTIONS 放行；非 GET 仅放行预定动作与合成对象，创建时核对请求体 ID；其余 abort 并计数。

| 探针 | 非 GET 尝试 | 放行（到达后端） | 注入（受控中断） | 前端拦截 |
|---|---:|---:|---:|---:|
| D write | 11 | 9 | 2 | 0 |
| F write-timing | 5 | 2 | 3 | 0 |
| G toast | 2 | 2 | 0 | 0 |
| E stale | 2 | 2 | 0 | 0 |
| I edit-failure | 1 | 0 | 1 | 0 |
| A/B/C/H 只读 | 0 | 0 | 0 | 0 |
| **合计** | **21** | **15** | **6** | **0** |

另有 1 次 Node 侧直接 API 调用（POST /api/clients，创建 CCFG004-HOLDER 作为 40941 占用方），不计入浏览器门禁。

后端实际收到：15（门禁放行）+ 1（直接 API）= 16。
- 预期业务拒绝：2（40940 重复探针 ID；40941 数据源重复分配）。
- 成功写入：14。
- 用户取消确认且零写：3（停用取消、删除取消、启用取消）。

### 明细（全部为合成对象）
- 创建：CCFG004-ON（经 SQL 预置）、CCFG004-NEW1（真实 UI POST 成功）、CCFG004-HOLDER（直接 API 成功）、CCFG004-VICTIM（真实 UI POST 被 40941 拒绝）。
- 编辑：CCFG004-NEW1（真实 UI PUT 成功）；CCFG004-NEW1 编辑失败注入（PUT 被中断，库态不变）。
- 启停：CCFG004-ON/disable、CCFG004-OFF/enable、CCFG004-ABN/disable、CCFG004-NEW1/disable、CCFG004-HOLDER/disable、CCFG004-HOLDER/enable（含慢请求、stale 场景、Toast 时序）；失败注入：CCFG004-OFF/disable、CCFG004-OFF2/enable。
- 删除：CCFG004-DEL（真实删除成功并清选）；失败注入：CCFG004-DEL2。

## 3. 最终独立回读（SQL SELECT，2026-11-05）

| CLIENT_ID | FG_ACTIVE | 绑定数据源 |
|---|---|---|
| CCFG004-ABN | 0 | — |
| CCFG004-DEL2 | 1 | — |
| CCFG004-HOLDER | 1 | CCFG004-DS-A |
| CCFG004-LONGID-0123456789ABCDEFG | 1 | — |
| CCFG004-NEW1 | 0 | CCFG004-DS-B |
| CCFG004-OFF | 1 | — |
| CCFG004-OFF2 | 0 | — |
| CCFG004-ON | 0 | — |

- CDC_CLIENT_MULTIPLE 总数：91（任务开始时 89 → 本批新增/删除后 91）。
- CDC_DATA_SOURCE 总数：268；合成源：CCFG004-DS-A、CCFG004-DS-B（FG_ACTIVE=1）。
- CCFG004-DEL 已被真实删除流程物理删除，不在回读列表中。

## 4. 保留策略
- 按任务授权保留全部合成样本，不做清理或恢复；未回滚任何夹具。
- 未修改任何既有生产/历史样本；未连接源库。
