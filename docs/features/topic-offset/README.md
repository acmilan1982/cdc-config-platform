# 数据同步进度 Feature 入口（README）

## 1. 功能名称

**数据同步进度**（Feature 内部标识 `topic-offset`，路由 `/monitor/topic-offset`）。

> AS-IS 事实：当前 Git 已提交菜单项标题仍为"Topic 偏移量"（`frontend/src/config/menu.ts`）；本需求要求页面/菜单名称在实现阶段统一为"数据同步进度"并保持路由不变。本任务为纯文档任务，不改动任何前后端文件。

## 2. 功能定位

属于 CDC 配置管理平台"运行监控"模块下的**绝对只读**数据同步断点进度查询功能。

页面读取中心端 `sync-server` 持久化到数据库的消费断点（`CDC_TOPIC_OFFSET` 表达的业务数据，本平台只读），展示每个 Kafka 业务 Topic 在中心端（`SERVER_ID`）下的已保存消费位置（`NEXT_OFFSET`）与断点更新时间。

第一版**只查询数据库断点，不连接 Kafka**；不判断断点是否过期、异常、离线或有效；不展示完成百分比；不提供任何写动作。

## 3. 业务背景和用途

- `sync-client` 从源库读取数据并写入 Kafka 业务 Topic；一个源表 + 一个目标库对应一个 Kafka Topic，每个 Topic 有且只有一个分区。
- 中心端 `sync-server`（进程只有一个）消费所有业务 Topic，将数据同步到目标库。
- `sync-server` 定期把每个 Topic 的下一消费位置写入 `CDC_TOPIC_OFFSET`，作为重启续传断点。
- 运维和开发人员通过本功能查看：中心端下各 Kafka 业务 Topic 的已保存消费断点位置与断点更新时间，据此了解数据同步的相对进度与断点写入是否持续。

`NEXT_OFFSET` 仅表示"下一条准备消费的消息位置"，且是定期持久化值，不等同于进程内存中的绝对实时位置。

## 4. 数据来源与操作边界

**严格只读：**

- 断点数据来源于数据库断点记录（`CDC_TOPIC_OFFSET` 表达的业务数据），本平台绝对只读；
- 不连接 Kafka，不读取 Kafka 末端位置，不计算待消费数量或消费延迟；
- 不写库，不提供任何写动作；
- 第一版不做断点过期、异常、离线或有效性判断。

## 5. 数据量与规模假设

- 开发环境约十余条记录；
- 生产环境通常不超过 6000 条（用户确认的规模假设）。

## 6. 当前阶段

当前处于**功能级基线第一阶段**：需求与验收标准基线已批准，设计、实现与验收执行尚未开始。

- 需求状态：`APPROVED`（`REQUIREMENTS.md` 需求基线已正式批准）
- 验收标准状态：`APPROVED`（`ACCEPTANCE.md` 验收标准基线已正式批准）
- 设计状态：`NOT_STARTED`（DESIGN.md / API.md / UI.md 及数据库**设计**基线均未建立；已建 `DATABASE.md` 仅为物理只读复核文档，非设计基线）
- `implementation_status`：`NOT_STARTED`
- 验收执行状态：`NOT_RUN`（尚未执行正式验收；100 条 `TOFF-AC-xxx` 保持 `NOT_RUN`）
- 数据库只读复核：`VERIFIED_PENDING_USER_REVIEW`（`CDC_TOPIC_OFFSET` 及页面映射配置表已完成物理事实只读复核，见 [DATABASE.md](DATABASE.md)；待用户/ChatGPT 审阅，不代表数据库设计或项目级物理基线批准）

状态批准**不代表功能已实现、已验收通过或已正式交付**；设计、实现与验收执行均未开始。

## 7. 文档导航（本次创建）

| 文档 | 说明 |
|---|---|
| `README.md`（本文件） | 功能入口、定位、业务背景、只读边界、当前阶段 |
| [REQUIREMENTS.md](REQUIREMENTS.md) | 需求基线（`APPROVED`）：定位、术语、业务规则、页面与查询交互要求、边界与依赖 |
| [ACCEPTANCE.md](ACCEPTANCE.md) | 验收标准基线（`APPROVED`）：`TOFF-AC-001`～`TOFF-AC-100`，全部 `NOT_RUN`（未执行验收） |
| [DATABASE.md](DATABASE.md) | 数据库物理只读复核（`VERIFIED_PENDING_USER_REVIEW`）：`CDC_TOPIC_OFFSET` 结构/约束/索引/分区、数据质量与规模、设计前置事实结论（非设计基线） |

## 8. 页面与路由现状

| 项目 | 值 |
|---|---|
| 页面/菜单名称（目标规则） | 数据同步进度（运行监控组） |
| 既有路由 | `/monitor/topic-offset`（保持既有值不变） |
| 前端现状 | `frontend/src/views/topic-offset/TopicOffsetPage.vue` 为 `PlaceholderPage` 占位页（AS-IS 事实） |
| 菜单现状 | `frontend/src/config/menu.ts` 标题为"Topic 偏移量"（AS-IS 事实；实现阶段统一为"数据同步进度"） |

## 9. 当前未建立 / 未批准事项（基线边界）

本功能的需求基线（`REQUIREMENTS.md`）与验收标准基线（`ACCEPTANCE.md`）已获正式批准。以下设计/实现层面的内容均**未建立 / 未批准**，不得据当前文档宣称其存在：

- 未建立 `DESIGN.md`（功能设计说明）；
- 未建立 `API.md`（接口契约）；当前未批准任何接口结构；
- 未建立 `UI.md`（页面与交互规范）；
- 未建立数据库**设计**基线（设计用途的 DATABASE 设计文档）；未批准任何数据模型变更；已建 `DATABASE.md` 仅为物理只读复核文档（`VERIFIED_PENDING_USER_REVIEW`），不是设计基线；
- 无任何后端 / 前端实现，未设计或编写 Java / Vue / TS 等代码；
- 占位页 `PlaceholderPage` 与"Topic 偏移量"菜单标题仅作为 AS-IS 现状记录，**不等于**最终页面、UI 或菜单基线。

## 10. CDC_TOPIC_OFFSET 物理只读复核状态与项目级基线边界

- `CDC_TOPIC_OFFSET` **不在**已批准数据库物理基线（`docs/database/`，16 张已批准单表基线）之内；已批准 `SCHEMA.md` 仅将其列为"历史提及、当前代码无访问"。
- 物理事实只读复核已于 2026-09-02 完成并记录于 [DATABASE.md](DATABASE.md)（状态 `VERIFIED_PENDING_USER_REVIEW`），覆盖实际 Owner/Schema、字段类型、约束/索引/分区、数据质量与规模、Topic 结构样本与设计前置事实结论。
- 该复核为**功能级只读复核记录，不代表项目级物理基线批准，也不代表数据库设计或任何数据模型变更获准**；`CDC_TOPIC_OFFSET` 字段名仍属于用户已确认的业务字段语义与历史候选。
- 是否将 `CDC_TOPIC_OFFSET` 提升为项目级已批准物理基线、以及是否需要任何建表/改表/加索引/加约束，均属后续独立任务，本功能未授权。

## 11. 下一步

需求与验收标准基线已获正式批准（`APPROVED`），数据库物理只读复核已完成（`VERIFIED_PENDING_USER_REVIEW`）。下一步可**另起任务进入设计阶段**（另立任务建立功能设计基线，含 DESIGN.md / API.md / UI.md 及数据库设计基线，并可在设计中引用本 DATABASE.md 物理事实）。

- 设计任务未完成并获批前，不进入编码、数据库写访问或服务运行阶段；
- 正式验收须在实现完成并满足环境条件后，另行发起验收任务执行。
