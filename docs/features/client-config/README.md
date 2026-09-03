# 探针端管理 Feature（client-config）导航与状态

## 1. Feature 身份

| 项目 | 值 |
|---|---|
| 用户可见名称 | 探针端管理（页面、菜单、面包屑最终统一使用的名称；当前占位实现仍显示“客户端配置”，更名尚未实施） |
| Feature 内部标识 | `client-config`（内部目录标识不变） |
| 既有路由 | `/config/client`（保持不变） |
| 当前实现 | 占位实现（`frontend/src/views/client-config/ClientConfigPage.vue` 为占位页；后端无探针配置 CRUD，`CDC_CLIENT_MULTIPLE` 当前由人工维护，本 Feature 尚未实现） |
| 实现状态 | `NOT_STARTED` |

## 2. 文档导航

| 文档 | 职责 | 状态 |
|---|---|---|
| `README.md`（本文件） | Feature 定位、文档导航与状态 | `DRAFT_PENDING_USER_REVIEW` |
| `REQUIREMENTS.md` | 需求基线草案（`CCFG-REQ-001~090`） | `DRAFT_PENDING_USER_REVIEW`（待正式复审，未批准） |
| `ACCEPTANCE.md` | 验收标准草案（`CCFG-AC-001~076`，全部 `NOT_RUN`） | `DRAFT_PENDING_USER_REVIEW`（待正式复审，未批准） |
| `DESIGN.md` / `API.md` / `UI.md` / `DATABASE.md` | 设计阶段文档 | 尚未建立 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001.md` | 本阶段需求与验收草案建立执行报告 | 已建立 |

## 3. Feature 定位

“探针端管理”用于维护 Oracle 表 `CDC_CLIENT_MULTIPLE` 的探针配置（探针 ID、探针描述、采集数据源、启停状态）。`sync-client` 进程用自身 `client_id` 命中 `CLIENT_ID` 相同且 `FG_ACTIVE=1` 的记录并读取其采集数据源。本 Feature 只维护数据库配置，不直接启停、通知进程，不操作 ZooKeeper、Kafka 或 Topic。

## 4. 当前状态

- 本阶段仅为需求与验收草案建立（纯文档），尚未实现任何页面、接口或写库能力。
- `REQUIREMENTS.md` 与 `ACCEPTANCE.md` 为待复审草案，尚未批准；不得把草案中的目标规则（如“探针端管理”命名、探针 CRUD、唯一分配不变量）描述为当前已实施事实。
- 页面、菜单与既有资料当前仍使用“客户端配置”，占位页不变；更名与功能实现均不在本阶段。
- 基线影响项（如旧资料“客户端配置”“管理平台对 `CDC_CLIENT_MULTIPLE` 只读”“编辑时探针 ID 不可改”等表述、`CLIENT_DESC` 长度 256 与 1024 的数据库基线差异）已在 `REQUIREMENTS.md` §9 记录，待本 Feature 获批并实现后以独立任务收口。

## 5. 下一入口

由项目负责人/ChatGPT 对 `REQUIREMENTS.md` 与 `ACCEPTANCE.md` 进行需求与验收正式复审（批准或退回）；复审通过后才进入设计阶段，不直接实现。
