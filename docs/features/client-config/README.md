# 探针端管理 Feature（client-config）导航与状态

## 1. Feature 身份

| 项目 | 值 |
|---|---|
| 用户可见名称 | 探针端管理（页面、菜单、面包屑最终统一使用的名称；当前占位实现仍显示“客户端配置”，更名尚未实施） |
| Feature 内部标识 | `client-config`（内部目录标识不变） |
| 既有路由 | `/config/client`（保持不变） |
| 当前实现 | 占位实现（`frontend/src/views/client-config/ClientConfigPage.vue` 为占位页；后端无探针配置 CRUD，`CDC_CLIENT_MULTIPLE` 当前由人工维护，本 Feature 尚未实现） |
| 实现状态 | `NOT_STARTED` |
| 正式验收执行 | `NOT_RUN`（76 条验收用例全部未执行） |

## 2. 文档导航

| 文档 | 职责 | 状态 |
|---|---|---|
| `README.md`（本文件） | Feature 定位、文档导航与状态 | 已随 Feature 基线状态更新（2026-09-03）；R1 定向修订同步（2026-09-04）；并发口径调整草案同步（2026-09-04）；并发口径调整 R1 定向修订同步（2026-09-04）；并发口径调整批准收口同步（2026-09-04） |
| `REQUIREMENTS.md` | 需求基线（`CCFG-REQ-001~090`） | `APPROVED`（2026-09-03 曾 `APPROVED`，因并发口径调整于 2026-09-04 转为待复审草案：取消旧需求的并发“最多一个成功”强承诺（`LOCK TABLE ... WAIT 5` 是后续未批准设计草案的方案，本轮已过时），改为尽力写前检查 + 已接受并发边界；首版调整结果经 ChatGPT 正式复审 `CHANGES_REQUIRED`（R1-01~R1-04），R1 定向修订完成后，ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经并发口径调整批准收口重新收口为 `APPROVED`；批准的是需求基线，不代表功能已实现或验收已通过；调整前批准历史见 §1.1，本轮批准信息见 §1.2） |
| `ACCEPTANCE.md` | 验收标准（`CCFG-AC-001~076`，全部 `NOT_RUN`） | `APPROVED`（2026-09-03 曾 `APPROVED`，因并发口径调整于 2026-09-04 转为待复审草案，首版调整结果经 ChatGPT 正式复审 `CHANGES_REQUIRED`、R1 定向修订完成后，ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审 `APPROVED`、项目负责人于 2026-09-04 明确回复“批准”，经并发口径调整批准收口重新收口为 `APPROVED`；批准的是验收标准，不是验收执行结果；76 条用例仍全部 `NOT_RUN`） |
| `DESIGN.md` | 逻辑设计（`CCFG-DESIGN-001~037`，含并发/锁方案、追踪矩阵） | `DRAFT_PENDING_USER_REVIEW`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订，未正式 R1 复审批准）；因本轮需求并发口径调整（2026-09-04），其中 `LOCK TABLE ... WAIT 5` 表锁方案已过时；需求已重新批准（2026-09-04），标记 `STALE_LOCK_DESIGN_PENDING_DESIGN_REVISION`，暂不可批准、不可用于实现，待独立设计并发口径调整任务定向修订 |
| `API.md` | 接口契约（`CCFG-API-001~020`，接口 E1~E7、错误码表） | `DRAFT_PENDING_USER_REVIEW`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订，未正式 R1 复审批准）；因本轮需求并发口径调整（2026-09-04），其中 `LOCK TABLE ... WAIT 5` 相关错误码（`ORA-30006→50050`）方案已过时；需求已重新批准（2026-09-04），标记 `STALE_LOCK_DESIGN_PENDING_DESIGN_REVISION`，暂不可批准、不可用于实现，待独立设计并发口径调整任务定向修订 |
| `UI.md` | 界面设计（`CCFG-UI-001~026`，布局/交互/文案） | `DRAFT_PENDING_USER_REVIEW`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订，未正式 R1 复审批准）；因本轮需求并发口径调整（2026-09-04），其中 `LOCK TABLE ... WAIT 5`/`ORA-30006→50050` 相关文案已过时；需求已重新批准（2026-09-04），标记 `STALE_LOCK_DESIGN_PENDING_DESIGN_REVISION`，暂不可批准、不可用于实现，待独立设计并发口径调整任务定向修订 |
| `DATABASE.md` | 数据库使用设计（`CCFG-DB-001~022`，SQL 形态/事务锁矩阵） | `DRAFT_PENDING_USER_REVIEW`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订，未正式 R1 复审批准）；因本轮需求并发口径调整（2026-09-04），其中 `LOCK TABLE CDC_CLIENT_MULTIPLE ... WAIT 5` 事务锁方案已过时；需求已重新批准（2026-09-04），标记 `STALE_LOCK_DESIGN_PENDING_DESIGN_REVISION`，暂不可批准、不可用于实现，待独立设计并发口径调整任务定向修订 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001.md` | 需求与验收草案建立执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001-R1.md` | R1 定向修订执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-APPROVAL-001.md` | 需求与验收基线批准收口执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-DESIGN-BASELINE-001.md` | 设计基线草案建立执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-DESIGN-BASELINE-001-R1.md` | 设计基线 R1 定向修订（正式复审 `CHANGES_REQUIRED`）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md` | 并发口径定向调整草案（纯文档）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1.md` | 并发口径调整 R1 定向修订（正式复审 `CHANGES_REQUIRED`）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001.md` | 并发口径调整批准收口执行报告 | 已建立（2026-09-04） |

## 3. Feature 定位

“探针端管理”用于维护 Oracle 表 `CDC_CLIENT_MULTIPLE` 的探针配置（探针 ID、探针描述、采集数据源、启停状态）。`sync-client` 进程用自身 `client_id` 命中 `CLIENT_ID` 相同且 `FG_ACTIVE=1` 的记录并读取其采集数据源。本 Feature 只维护数据库配置，不直接启停、通知进程，不操作 ZooKeeper、Kafka 或 Topic。

## 4. 当前状态

- 旧口径批准历史：需求基线 `REQUIREMENTS.md`（`CCFG-REQ-001~090`，90 条）与验收标准 `ACCEPTANCE.md`（`CCFG-AC-001~076`，76 条）曾于 2026-09-03 获项目负责人正式批准（ChatGPT 对 R1 结果正式复审结论 `APPROVED`，项目负责人明确回复“批准”），旧口径状态为 `APPROVED`。该次批准只覆盖旧口径的并发强保证目标（并发“最多一个成功”强承诺；当时需求只要求后续设计确定事务/锁/原子方案，未批准任何具体表锁语句，`LOCK TABLE ... WAIT 5` 是随后形成、始终未获项目负责人批准的设计草案方案），不代表功能已实现或验收已通过；后续因并发口径调整进入本轮待复审草案状态，经 ChatGPT 对 R1 结果正式复审 `APPROVED` 与项目负责人 2026-09-04 批准后重新收口为 `APPROVED`（见下条）；旧批准不自动批准本轮调整。
- 并发口径调整草案（2026-09-04，`CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001`，纯文档）：按项目负责人明确决定，配置平台不再为保证数据源唯一分配执行 Oracle 显式表锁，取消并发“最多一个成功”强承诺，改为“新增/编辑/启用写入前重新读取 + 尽力写前检查 + 已接受极端并发下两笔先后都成功的边界”；运行侧 `sync-client`/`sync-server` 使用配置时的重复检查为最终防线但不属本 Feature 范围。受影响需求 `CCFG-REQ-038/068/071/072/074/077`、验收 `CCFG-AC-030/056/058/059/061/064`；`REQUIREMENTS.md` 与 `ACCEPTANCE.md` 状态由旧口径 `APPROVED` 调整为 `DRAFT_PENDING_USER_REVIEW`。ChatGPT 对首版调整结果（提交 `6071d7a...`）正式复审结论为 `CHANGES_REQUIRED`（R1-01~R1-04）；R1 定向修订（`CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1`，2026-09-04，对应报告见 §2 导航）已完成；ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审结论为 `APPROVED`（`CHATGPT_FORMAL_REQUIREMENTS_ADJUSTMENT_R1_REVIEW`），项目负责人于 2026-09-04 明确回复“批准”，`REQUIREMENTS.md` 与 `ACCEPTANCE.md` 经批准收口任务 `CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001` 重新收口为 `APPROVED`（对应报告见 §2 导航）；2026-09-03 批准保留为历史，不自动批准本轮调整（本轮依据独立复审与项目负责人明确回复）。
- 实现状态仍为 `NOT_STARTED`：尚未实现任何页面、接口或写库能力；页面/菜单仍为占位，用户可见名称仍为“客户端配置”。
- 正式验收执行状态仍为 `NOT_RUN`：76 条验收用例全部未执行，不得把已批准需求/验收标准中的目标规则描述为当前已实施事实，不得写成“验收通过”。
- `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 已于 2026-09-03 建立设计基线草案（`CLIENT-CONFIG-DESIGN-BASELINE-001`），状态均为 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`；本 Feature 尚未进入实现阶段。四份设计文档是草案，不得写成已批准基线；不因建立设计草案而改变已批准需求/验收，也不修改任何数据库基线。因本轮需求并发口径调整（2026-09-04），四份设计文档所含 `LOCK TABLE ... WAIT 5` 表锁/锁等待错误码（`ORA-30006→50050`）方案已过时，整体标记 `STALE_LOCK_DESIGN_PENDING_DESIGN_REVISION`：本轮对设计文档零改动，需求已重新批准（2026-09-04），暂不可批准、不可用于实现，须由下一独立设计并发口径调整任务定向修订后再复审。
- ChatGPT 对初版设计草案提交 `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` 的正式设计复审结论为 `CHANGES_REQUIRED`（R1-01~R1-09）。`CLIENT-CONFIG-DESIGN-BASELINE-001-R1`（2026-09-04，纯文档）已完成定向修订：API 设计编号重排为 `CCFG-API-001~020` 连续唯一；四文档编号范围同步为 `CCFG-DESIGN-001~037`/`CCFG-API-001~020`/`CCFG-UI-001~026`/`CCFG-DB-001~022`；数据源数组固定“原存储顺序返回 + 前端非持久化前三项投影”单一契约；`CLIENT_DESC` 固定原文保存、Trim 仅判空、按原文计 UTF-8 字节；关键词 LIKE 增加 `\` 字面量转义与 `ESCAPE '\'`；删除未批准的数据源 ID“其他非法字符”限制；补齐 `CATEGORY_MISMATCH`/`TYPE_MISMATCH`、含逗号歧义（`COMMA_PROTOCOL_AMBIGUOUS`）与历史 NULL/空白 `CLIENT_DESC` 契约。修订后四文档状态保持 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`；受本轮需求并发口径调整影响，正式 R1 设计复审延后；需求调整 R1 结果已获 ChatGPT 正式复审 `APPROVED` 并由项目负责人于 2026-09-04 批准，四份设计文档仍含过时表锁方案，须先由独立设计并发口径调整任务（`CLIENT_CONFIG_DESIGN_CONCURRENCY_ADJUSTMENT`）去除过时表锁方案后，再对四份设计文档进行正式 R1 复审；不得自行批准为 `APPROVED`。
- 基线影响项（如旧资料“客户端配置”“管理平台对 `CDC_CLIENT_MULTIPLE` 只读”“编辑时探针 ID 不可改”等表述、`CLIENT_DESC` 长度 256 与 1024 的数据库基线差异）已在 `REQUIREMENTS.md` §9 记录；其中 `CLIENT_DESC` 真实语义已确认为 `VARCHAR2(1024 BYTE)`，256 与 1024 的已批准数据库基线差异继续作为后续独立数据库基线同步事项保留。

## 5. 下一入口

下一入口为设计并发口径调整任务（`CLIENT_CONFIG_DESIGN_CONCURRENCY_ADJUSTMENT`）：需求与验收已随本轮并发口径调整重新批准（ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，`REQUIREMENTS.md`/`ACCEPTANCE.md` 已收口为 `APPROVED`）。下一独立任务应先从四份设计草案（`DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`）中移除已过时的 `LOCK TABLE ... WAIT 5`、`ORA-30006→50050` 及并发“最多一个成功”等设计，再对该设计调整结果进行正式设计复审；在此之前四份设计文档保持 `DRAFT_PENDING_USER_REVIEW`、标记 `STALE_LOCK_DESIGN_PENDING_DESIGN_REVISION`，暂不可批准、不可用于实现；实现状态保持 `NOT_STARTED`；76 条验收保持全部 `NOT_RUN`。不得直接写成“设计已可批准”，也不得直接进入实现阶段。
