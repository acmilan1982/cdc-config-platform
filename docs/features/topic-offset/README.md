# 数据同步进度 Feature 入口（README）

## 1. 功能名称

**数据同步进度**（Feature 内部标识 `topic-offset`，路由 `/monitor/topic-offset`）。

> 历史 AS-IS：README 建立时（需求/验收文档阶段）Git 已提交菜单项标题仍为"Topic 偏移量"（`frontend/src/config/menu.ts`），该需求要求页面/菜单名称在实现阶段统一为"数据同步进度"并保持路由不变；该名称统一已在实现任务 `TOPIC-OFFSET-IMPLEMENTATION-001` 中落地（菜单与路由标题现均为"数据同步进度"，路由 `/monitor/topic-offset` 不变）。

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

当前处于**功能级实现完成、等待用户人工测试与正式验收阶段**：需求、验收标准、数据库物理只读复核与功能设计基线均已批准；实现任务 `TOPIC-OFFSET-IMPLEMENTATION-001`（起点基线提交 `5f3760f77c13fc0f290bd3360cce5dc7b0b95040`）已完成后端/前端实现，通过自动化测试与前后端构建，启动开发环境完成接口联调与接口验证，并将代码与测试推送至 `origin/develop`。正式验收未执行。

- 需求状态：`APPROVED`（`REQUIREMENTS.md` 需求基线已正式批准，本阶段零变化）
- 验收标准状态：`APPROVED`（`ACCEPTANCE.md` 验收标准基线已正式批准，本阶段零变化；100 条 `TOFF-AC-xxx` 仍全部 `NOT_RUN`）
- 设计状态：`APPROVED`（`DESIGN.md`/`API.md`/`UI.md` 功能设计基线已于 2026-09-02 经 ChatGPT 对提交 `68779649e673da7ee95079c4724b346ea441c5f6` 正式复审批准，本阶段零变化；数据库**设计**基线未单独批准，已建 `DATABASE.md` 仅为物理只读复核文档，非设计基线）
- `implementation_status`：`IMPLEMENTED_PENDING_USER_ACCEPTANCE`
  - 后端：新增 `com.bsoft.cdcconfig.monitor.topicoffset` 只读模块，仅暴露两个 GET 接口（`GET /api/monitor/topic-offset/offsets`、`GET /api/monitor/topic-offset/candidates`），Mapper 显式列投影且不读取 `DATA_SOURCE_PASSWORD`，`NEXT_OFFSET` 以字符串透传，无任何写/DML/DDL/Kafka 访问；
  - 前端：替换占位页为"数据同步进度"页面（查询区、结果/解析失败数量与刷新工具栏、8 列表格、分页、60 秒自动刷新与会话恢复）；菜单与路由标题由"Topic 偏移量"统一为"数据同步进度"；
  - 自动化测试与构建：后端 topic-offset 定向 44 条全通过、前端 topic-offset 定向 56 条全通过；后端/前端完整测试与构建在本任务完成时通过或仅存在任务开始前既有的基线失败（见任务最终报告）；
  - 开发环境联调：两个只读 GET 接口已对开发库返回真实配置候选与断点记录，`http://192.168.174.70:5173/monitor/topic-offset` 可供用户从 Windows 浏览器人工测试。
- 验收执行状态：`NOT_RUN`（尚未执行正式验收；100 条 `TOFF-AC-xxx` 保持 `NOT_RUN`）
- 数据库只读复核：`APPROVED`（`CDC_TOPIC_OFFSET` 及页面映射配置表的物理事实只读复核结果已于 2026-09-02 经 ChatGPT 复审批准，见 [DATABASE.md](DATABASE.md)；批准针对已复核数据库事实，不代表数据库设计或项目级物理基线批准）

本阶段实现完成**不代表功能已验收通过或已正式交付**：实现结果尚未交回 ChatGPT 做代码与实现复审，尚未经用户人工页面测试，正式验收尚未执行；须在用户人工测试通过后另行发起正式验收任务。

## 7. 文档导航（本次创建）

| 文档 | 说明 |
|---|---|
| `README.md`（本文件） | 功能入口、定位、业务背景、只读边界、当前阶段 |
| [REQUIREMENTS.md](REQUIREMENTS.md) | 需求基线（`APPROVED`）：定位、术语、业务规则、页面与查询交互要求、边界与依赖 |
| [ACCEPTANCE.md](ACCEPTANCE.md) | 验收标准基线（`APPROVED`）：`TOFF-AC-001`～`TOFF-AC-100`，全部 `NOT_RUN`（未执行验收） |
| [DATABASE.md](DATABASE.md) | 数据库物理只读复核（`APPROVED`）：`CDC_TOPIC_OFFSET` 结构/约束/索引/分区、数据质量与规模、设计前置事实结论（非设计基线） |
| [DESIGN.md](DESIGN.md) | 功能设计说明（`APPROVED`）：目标与范围、代码盘点、总体架构与调用链、后端分层与算法、前端状态与生命周期、刷新并发、只读/精度/性能、测试策略、决策与风险 |
| [API.md](API.md) | 接口契约（`APPROVED`）：2 个只读 GET 接口、请求/响应/字段字典、JSON 示例、错误码、只读与字符串精度追踪 |
| [UI.md](UI.md) | 页面与交互规范（`APPROVED`）：页面 IA、查询区、工具栏、8 列表格与列宽、同步对象、分页、刷新生命周期、加载/空/错误状态 |

## 8. 页面与路由现状

| 项目 | 值 |
|---|---|
| 页面/菜单名称（实现后现状） | 数据同步进度（运行监控组） |
| 既有路由 | `/monitor/topic-offset`（保持不变） |
| 前端现状 | `frontend/src/views/topic-offset/TopicOffsetPage.vue` 已由实现任务替换占位页，为真实"数据同步进度"页面（历史 AS-IS：README 建立时此处为 `PlaceholderPage` 占位页） |
| 菜单现状 | `frontend/src/config/menu.ts` 标题已统一为"数据同步进度"（历史 AS-IS：README 建立时为"Topic 偏移量"） |

## 9. 当前未批准 / 尚未完成事项（基线边界）

本功能的需求基线（`REQUIREMENTS.md`）、验收标准基线（`ACCEPTANCE.md`）与功能设计基线（`DESIGN.md`/`API.md`/`UI.md`）均已获正式批准；实现任务已完成并推送（实现状态 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`）。以下实现/数据库层面的内容仍**未批准或未完成**，不得据此宣称功能已验收通过或已正式交付：

- 本次实现已按批准设计落地，但其是否符合批准设计，须经 ChatGPT 对实现结果提交的代码与实现复审、用户人工页面测试以及正式验收确认，并以实际复审与验收结果为准；
- 未批准数据库**设计**基线（设计用途的 DATABASE 设计文档）；未批准任何数据模型变更；已建 `DATABASE.md` 仅为物理只读复核文档（`APPROVED`），不是设计基线；本次实现仅对 `CDC_TOPIC_OFFSET` 与两张配置表做只读 SELECT，未执行任何 DDL/DML；
- 正式验收未执行（100 条 `TOFF-AC-xxx` 全部 `NOT_RUN`）；尚未获得 ChatGPT 对实现结果提交的复审结论；
- 占位页 `PlaceholderPage` 与"Topic 偏移量"菜单标题为历史 AS-IS 记录；实现任务已用"数据同步进度"页面替换占位页、并将菜单与路由标题统一为"数据同步进度"（路由 `/monitor/topic-offset` 不变），最终页面/UI 基线以人工测试与正式验收结果为准。

## 10. CDC_TOPIC_OFFSET 物理只读复核状态与项目级基线边界

- `CDC_TOPIC_OFFSET` **不在**已批准数据库物理基线（`docs/database/`，16 张已批准单表基线）之内；已批准 `SCHEMA.md` 仅将其列为"历史提及、当前代码无访问"。
- 物理事实只读复核已于 2026-09-02 完成并记录于 [DATABASE.md](DATABASE.md)，复核结果已获 ChatGPT 复审批准（状态 `APPROVED`），覆盖实际 Owner/Schema、字段类型、约束/索引/分区、数据质量与规模、Topic 结构样本与设计前置事实结论。
- 该复核为**功能级只读复核记录，不代表项目级物理基线批准，也不代表数据库设计或任何数据模型变更获准**；`CDC_TOPIC_OFFSET` 字段名仍属于用户已确认的业务字段语义与历史候选。
- 是否将 `CDC_TOPIC_OFFSET` 提升为项目级已批准物理基线、以及是否需要任何建表/改表/加索引/加约束，均属后续独立任务，本功能未授权。

## 11. 下一步

需求、验收标准、数据库物理只读复核与功能设计基线（`DESIGN.md`/`API.md`/`UI.md`）均已获正式批准（`APPROVED`；设计基线于 2026-09-02 经 ChatGPT 对提交 `68779649e673da7ee95079c4724b346ea441c5f6` 复审批准，实现中引用了 `DATABASE.md` 物理事实）。实现任务 `TOPIC-OFFSET-IMPLEMENTATION-001` 已完成实现、自动化测试与构建、开发环境联调与接口验证并推送（实现状态 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`）。下一步：实现结果先交回 ChatGPT 做代码与实现复审；随后由用户对已启动的开发环境页面做人工测试；用户人工测试通过后再另行发起正式验收任务执行 100 条 `TOFF-AC-xxx`。

- 实现与联调只读访问 `CDC_TOPIC_OFFSET` 与两张配置表，不执行任何数据库 DDL/DML；
- 正式验收须在用户完成人工页面测试后另行发起执行；验收执行状态保持 `NOT_RUN`。
