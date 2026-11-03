# 证据目录：探针端管理列表与三态菜单定向只读验收

任务：`CLIENT-CONFIG-LIST-AND-THREE-STATE-MENU-READONLY-ACCEPTANCE-001`
分支：`develop`；base：`4354e3083e00b995819b967eb860e93024089a3a`

## 本轮性质与边界

本任务要求**复用既有前后端，不启停、不重启、不构建**，只在服务可用时对
`/config/client` 做真实只读核对。开工检查时：

- 后端 `:8080` 与前端 `:5173` 均无监听进程；
- `GET /api/clients?status=ALL` 与 `GET /config/client` 均返回 HTTP `000`。

因此本轮**没有**读取当前列表样本、**没有**启动浏览器、**没有**安装浏览器
`/api/**` 门禁、**没有**任何业务写入。所有判定只基于：

1. 已入仓历史证据中的**真实 JSON 键**（逐个读取，不凭历史摘要拼键）；
2. 当前前端源码的**静态推导**（明确标注为源码推导，不冒充运行时观察）。

不伪造当前页面观察；不同时点的历史快照未被拼接成“当场三态共存”。

## 文件

| 文件 | 说明 |
|---|---|
| `env-and-service-check.txt` | 开盘 Git/Node/服务可用性检查原值与命令、结果、边界说明 |
| `static-evidence-matrix.json` | AC-022 / AC-082 的逐原子证据矩阵：已有证据文件 + 实际键 + 观察 + 覆盖等级 + 限制；含 `live_legs` 与 `blocking_gaps` |
| `README.md` | 本文件 |
| `SHA256SUMS` | 上述文件的 SHA-256（不含自身） |

## 复用证据清单（只读）

- `../CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002/`
  - `s2-list-results.json`：两视口表头/状态列缺席/操作列最右/菜单项/异常行菜单/事件隔离；
  - `s2-confirm-results.json`：启用/停用确认框标题、掩码正文、按钮。
- `../CLIENT-CONFIG-T02-CONTROLLED-UI-TOGGLE-ACCEPTANCE-001/`
  - `ui-toggle-results.json`：B0–B7、写门禁、取消 0 写、启用/停用菜单与确认框、成功后标记变化、最终 `FG_ACTIVE='0'`；
  - `sql-window-extract.txt`：恰 2 条单行 `UPDATE`，无其他写语句。
- `../CLIENT-CONFIG-CONTROLLED-TOGGLE-READINESS-CHECK-001/readiness-results.json`：
  - `fg_active_histogram={exact_0:15, exact_1:1, other:0}`（时点快照）。
- `../CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001/round7-targeted-readonly-results.json`：
  - `AC156_menu_isolation`：菜单打开时 `editDialogOpen=false`、`fixedSelectedRows=0`；
  - `AC156_dblclick_edit`：行双击仍打开编辑弹窗（负向对照）。

## 当前源码推导（非运行时观察）

`frontend/src/views/client-config/ClientConfigPage.vue`：

- 列顺序：序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作；无状态列；
- 操作列 `fixed="right"`，唯一入口为三点图标，`role=button`、`tabindex=0`、`aria-label="更多操作：{clientId}"`；
- 下拉：`idState !== 'off'` → 停用，否则 → 启用；删除始终存在；
- 触发器和菜单项均 `@click.stop` / `@dblclick.stop`；
- 探针 ID 后：`'0'` → 停用标记；异常 → `异常：{原始值}`；`'1'` → 无标记。

## 判定摘要

- `CCFG-AC-022`：维持 `BLOCKED`。历史两视口与 T02 写路径证据覆盖了多数步骤/预期，但
  “启用与停用各若干条”前置未成立（历史仅 1 条启用；`若干条` 无已批准数量阈值），且当前
  样本因服务不可用无法重读。
- `CCFG-AC-082`：维持 `BLOCKED`。历史快照各自缺少三态中的一态，R4 矩阵引用的
  `accD.json` 原始包在仓库外、不可读取真实键；当前三态共存前置无法确认；固定列仅有源码
  推导，未在本轮两视口实测。
- 无直接反例，故不判 `FAIL`；`changed_ids=[]`，统计仍 `PASS 83 / FAIL 0 / BLOCKED 60 / NOT_RUN 14 = 157`。

**定向只读验收 ≠ 写授权 ≠ 157 条整体验收通过 ≠ 批准其他页面接入或迁移。**
