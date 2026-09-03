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
| `README.md`（本文件） | Feature 定位、文档导航与状态 | 已随 Feature 基线状态更新（2026-09-03） |
| `REQUIREMENTS.md` | 需求基线（`CCFG-REQ-001~090`） | `APPROVED`（2026-09-03 项目负责人批准） |
| `ACCEPTANCE.md` | 验收标准（`CCFG-AC-001~076`，全部 `NOT_RUN`） | `APPROVED`（批准的是验收标准，不是验收执行结果；76 条用例仍全部 `NOT_RUN`） |
| `DESIGN.md` / `API.md` / `UI.md` / `DATABASE.md` | 设计阶段文档 | 尚未建立 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001.md` | 需求与验收草案建立执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001-R1.md` | R1 定向修订执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-APPROVAL-001.md` | 需求与验收基线批准收口执行报告 | 已建立 |

## 3. Feature 定位

“探针端管理”用于维护 Oracle 表 `CDC_CLIENT_MULTIPLE` 的探针配置（探针 ID、探针描述、采集数据源、启停状态）。`sync-client` 进程用自身 `client_id` 命中 `CLIENT_ID` 相同且 `FG_ACTIVE=1` 的记录并读取其采集数据源。本 Feature 只维护数据库配置，不直接启停、通知进程，不操作 ZooKeeper、Kafka 或 Topic。

## 4. 当前状态

- 需求基线 `REQUIREMENTS.md`（`CCFG-REQ-001~090`，90 条）与验收标准 `ACCEPTANCE.md`（`CCFG-AC-001~076`，76 条）已于 2026-09-03 获项目负责人正式批准（ChatGPT 对 R1 结果正式复审结论 `APPROVED`，项目负责人明确回复“批准”），状态 `APPROVED`。本次批准的是需求基线与验收标准本身，不代表功能已实现或验收已通过。
- 实现状态仍为 `NOT_STARTED`：尚未实现任何页面、接口或写库能力；页面/菜单仍为占位，用户可见名称仍为“客户端配置”。
- 正式验收执行状态仍为 `NOT_RUN`：76 条验收用例全部未执行，不得把已批准需求/验收标准中的目标规则描述为当前已实施事实，不得写成“验收通过”。
- `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 尚未建立，本 Feature 尚未进入设计或实现阶段。
- 基线影响项（如旧资料“客户端配置”“管理平台对 `CDC_CLIENT_MULTIPLE` 只读”“编辑时探针 ID 不可改”等表述、`CLIENT_DESC` 长度 256 与 1024 的数据库基线差异）已在 `REQUIREMENTS.md` §9 记录；其中 `CLIENT_DESC` 真实语义已确认为 `VARCHAR2(1024 BYTE)`，256 与 1024 的已批准数据库基线差异继续作为后续独立数据库基线同步事项保留。

## 5. 下一入口

下一入口为设计基线（`CLIENT_CONFIG_DESIGN_BASELINE`）：进入 `client-config` 设计阶段，建立 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 设计基线草案；设计草案须经正式复审与批准后才能进入实现阶段，不得跳过设计直接实现代码。
