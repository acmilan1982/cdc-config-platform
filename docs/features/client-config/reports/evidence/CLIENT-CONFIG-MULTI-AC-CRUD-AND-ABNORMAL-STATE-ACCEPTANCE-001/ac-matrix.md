# 逐 AC 覆盖矩阵

- 任务：`CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001`
- 目标 17 条：`CCFG-AC-020/026/031/039/040/054/058/060/061/062/082/115/121/131/139/140/145`

判定口径：所有判定均来自真实浏览器页面 + 真实后端（含真实 Oracle 读写），直接 DML 仅用于前置样本与后置读取，未替代被验收的页面/ API 行为。

| AC | 关联需求 | 验证方式 | 证据文件 / 键 | 判定 |
|---|---|---|---|---|
| `CCFG-AC-020` | `CCFG-REQ-026` | 真实 UI：无选中行时“更多”→“删除”→二次确认；真实后端物理删除；GET + SQL 后置核对 | `group-f-results.json` `ac020.*`；`group-f-sql-verification.txt` | PASS |
| `CCFG-AC-026` | `CCFG-REQ-034、CCFG-REQ-097` | 真实 UI：三态行菜单；异常行真实停用、真实删除；兄弟行保留 | `group-d-results.json` `ac026.*`、`viewports.*.menus` | PASS |
| `CCFG-AC-031` | `CCFG-REQ-041` | 真实 UI：新增表单标签集校验；创建后 `FG_ACTIVE='1'` | `group-a-results.json` `ac031` | PASS |
| `CCFG-AC-039` | `CCFG-REQ-048` | 真实 UI + 后端直连：大小写改名、`40940` 冲突、前端格式阻断、后端 `40101` | `group-b-results.json` `ac039.step1..step5` | PASS |
| `CCFG-AC-040` | `CCFG-REQ-049` | 真实 UI：同时改 ID/描述/源触发 `40941`，核对无部分写入 | `group-b-results.json` `ac040` | PASS |
| `CCFG-AC-054` | `CCFG-REQ-066` | 真实 UI：候选请求的 `excludeClientId` 为原 ID；自有源可选性 | `group-b-results.json` `ac054`；`ac054-supplement-results.json` | PASS |
| `CCFG-AC-058` | `CCFG-REQ-071` | 真实 UI：前端候选过时，后端写前校验 `40941` 拒绝 | `group-c-results.json` `ac058` | PASS |
| `CCFG-AC-060` | `CCFG-REQ-073` | 真实 UI：改名保留自有源，新 ID 持久化、旧 ID 不存在 | `group-b-results.json` `ac060`、`ac054.optionsRequestUrl` | PASS |
| `CCFG-AC-061` | `CCFG-REQ-074` | 真实 UI：多源单冲突整体 `40941`，无部分写入 | `group-c-results.json` `ac061` | PASS |
| `CCFG-AC-062` | `CCFG-REQ-075` | 真实 UI：冲突提示含机构名、数据源 ID、冲突探针 ID | `group-c-results.json` `ac062` | PASS |
| `CCFG-AC-082` | `CCFG-REQ-096` | 真实 UI：1440×900 与 1920×1080 固定操作列、三态菜单、点“更多”无副作用 | `group-d-results.json` `viewports.1440x900/1920x1080.*` | PASS |
| `CCFG-AC-115` | `CCFG-REQ-120` | 真实 UI + 延迟注入：按钮常态/Hover/按下/loading 颜色；不完整表单 0 写；重复点击 1 请求 | `group-e-results.json` `ac115`；`ac115-supplement-results.json` | PASS |
| `CCFG-AC-121` | `CCFG-REQ-125` | 真实 UI：字段级 `40102`、网络中断全局提示、成功关闭并重载 | `group-c-results.json` `ac121`；`ac121-network-supplement-results.json` | PASS |
| `CCFG-AC-131` | `CCFG-REQ-132、CCFG-REQ-039` | 真实 UI/API：768B/1024B 精确保存、1028B 拒绝、空白判空原文保存、前端截断 | `group-a-results.json` `ac131.s1..s5` | PASS |
| `CCFG-AC-139` | `CCFG-REQ-140` | 真实 UI：停用确认文案、取消 0 写、成功归 0、失败提示 | `group-e-results.json` `ac139` | PASS |
| `CCFG-AC-140` | `CCFG-REQ-141` | 真实 UI：启用确认文案、取消 0 写、成功恰 1 请求、`40941` 失败 | `group-e-results.json` `ac140` | PASS |
| `CCFG-AC-145` | `CCFG-REQ-146` | 真实 UI：六个固定选中分支（重选/筛选消失清空/取消保留/失败保留/删除清空/删除取消或失败保留） | `group-f-results.json` `ac145.b1..b6` | PASS |

## 汇总

| 指标 | 值 |
|---|---:|
| 目标 AC 总数 | 17 |
| `PASS` | 17 |
| `FAIL` | 0 |
| 未覆盖 | 0 |

全文件状态统计（按实际状态格独立复算）：`PASS` 101 / `FAIL` 0 / `BLOCKED` 48 / `NOT_RUN` 8 = 157。

## 说明

- 本批 17 条通过不等于 157 条整体验收通过，也不等于 Feature 正式接受或其他页面迁移授权。
- 夹具准备（`fixture-prepare*.sql`、重跑前复位）属于**测试前置**，不作为被测产品行为计入证据判定。
- 被放弃并重跑的两轮（Group A 首轮、Group D 首轮）为探针脚本缺陷，已修复并重跑；重跑结果用于判定。
- 保留的合成样本、异常态与冲突态按授权不清理；未执行恢复动作，故不报告 `RESTORED`。
