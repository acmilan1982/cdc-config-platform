# 数据订阅设计基线正式批准收口报告

任务编号：`DATA-SUBSCRIPTION-DESIGN-BASELINE-APPROVAL-001`

## 1. 任务编号、性质、基准提交

- 分支：`develop`
- 基准提交：`ba7feddff426e369e1e73791b8d75e2ab62934e9`（R4-R1 结果提交）
- 任务性质：数据订阅设计基线正式批准收口，纯文档任务
- ChatGPT 正式复审结论：`APPROVED`

本任务只把已经完成正式复审的数据订阅 DESIGN/API/UI/DATABASE 四份设计基线由草案状态收口为正式批准状态，不修改任何业务语义，不实现功能，不执行验收。

## 2. ChatGPT 正式复审依据与 `APPROVED` 结论

ChatGPT 已正式复审 R4-R1 结果提交 `ba7feddff426e369e1e73791b8d75e2ab62934e9`，正式复审结论：`APPROVED`。

复审确认：

1. R4 三项技术修正正确：
   - DELETE 影响 0 行使用 `40430`，影响多行使用 `50041 DELETE_FAILED`；
   - DELETE 当前设计为普通 SELECT → 存在性校验 → 多源库异常业务校验 → 普通物理 DELETE；不加锁、不做并发比较，删除预览不替代 DELETE 接口自身业务校验；
   - Java null/split 语义正确，`splitTrimDropEmpty(null)` 返回空集合，多源库异常按归一化后非空 token 数 `>= 2` 判定。
2. R4-R1 已统一四份设计文档的顶部和页尾状态。
3. R4-R1 相对基准仅修改状态元数据与页尾说明，设计正文业务语义零变化。
4. 需求与验收基线保持 `APPROVED`：107 条需求、126 条验收，验收全部 `NOT_RUN`。
5. 设计仍未实现，代码状态为 `NOT_STARTED`。
6. 结果提交已推送，与远程 `develop` 一致。

## 3. 正式批准范围

本次正式批准四份设计文档：

- `docs/features/data-subscription/DESIGN.md`
- `docs/features/data-subscription/API.md`
- `docs/features/data-subscription/UI.md`
- `docs/features/data-subscription/DATABASE.md`

批准含义：

- 四份文档共同组成当前数据订阅 Feature 的正式设计基线；
- 后续实现必须遵循已批准需求、验收和四份设计文档；
- TBD-01/TBD-02 的设计结论随四份设计基线正式批准；
- 当前 10 项 API 能力、25 个业务错误码、UI 交互、数据库字段读写与无 DDL 结论成为正式实现依据。

批准不代表功能已实现、业务代码或测试代码已完成、126 条验收已执行或通过、已部署、已通知或重启 sync-client、已执行数据库 DDL/DML、大屏延期修正已执行。

## 4. 四份设计文档状态变化

| 文档 | 文档状态（改前 → 改后） | 设计正式复审状态（改前 → 改后） | 页尾状态 |
|---|---|---|---|
| `DESIGN.md` | `DRAFT_PENDING_USER_REVIEW` → `APPROVED` | `PENDING_R4_REVIEW` → `APPROVED` | `APPROVED`，删除等待办语义 |
| `API.md` | `DRAFT_PENDING_USER_REVIEW` → `APPROVED` | `PENDING_R4_REVIEW` → `APPROVED` | `APPROVED`，删除等待办语义 |
| `UI.md` | `DRAFT_PENDING_USER_REVIEW` → `APPROVED` | `PENDING_R4_REVIEW` → `APPROVED` | `APPROVED`，删除等待办语义 |
| `DATABASE.md` | `DRAFT_PENDING_USER_REVIEW` → `APPROVED` | `PENDING_R4_REVIEW` → `APPROVED` | `APPROVED`，删除等待办语义 |

统一版本说明：ChatGPT 对 R4-R1 结果提交 `ba7feddff426e369e1e73791b8d75e2ab62934e9` 正式复审结论 `APPROVED`；当前正式批准设计版本为 R4，R4-R1 仅完成状态元数据收口；批准不代表实现或验收通过。

API/UI 保留“其业务设计在 R4 中零语义变化”的历史事实；原“任务编号 R3”表示该文件最后一次业务语义修订任务，予以保留；批准状态以“文档状态、设计正式复审状态、当前版本说明、页尾状态”为权威口径。

## 5. 已批准的核心设计摘要

- 需求：107 条 `DSUB-REQ-001` ~ `DSUB-REQ-107`（“取消并发保护”批准版本，`43a9097...`）；
- 验收：126 条 `DSUB-AC-001` ~ `DSUB-AC-126`，全部 `NOT_RUN`；
- API：10 项能力、25 个业务错误码；
- UI：列表/详情/新增/编辑/删除预览/删除流程及交互；
- DATABASE：字段读写与无 DDL 结论；
- 关键设计：三类数据源 ID 查询语义、`items + queryWarnings`、元数据 API query 参数、`ALL_MVIEWS` 显式排除、`SourceTableInput[]`、`PRESERVE/REPLACE`、UUID32 + `@TableId IdType.INPUT`、无并发保护边界（普通主键读写、最后一次成功写入生效）。

## 6. 需求/验收/设计/实现/验收执行状态边界

```text
requirements_status=APPROVED
acceptance_status=APPROVED
design_status=APPROVED
api_status=APPROVED
ui_status=APPROVED
database_design_status=APPROVED
implementation_status=NOT_STARTED
acceptance_execution_status=NOT_RUN
requirements_count=107
acceptance_count=126
design_approved_version=R4
design_metadata_closeout_version=R4-R1
```

## 7. TBD-01/TBD-02 正式闭环状态

- TBD-01（`DATA_SUB_ID` 生成方式）：设计结论确定——`@TableId(value = "DATA_SUB_ID", type = IdType.INPUT)` 专用实体 + Service 在 INSERT 前执行 `UUID.randomUUID().toString().replace("-", "")`（32 位无连字符 UUID，`VARCHAR2(32)` 容纳），前端不感知、不生成。状态：`APPROVED_RESOLVED`。
- TBD-02（源库/目标库类别匹配规则）：设计结论确定——候选与保存校验使用同一类别规则 `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='SOURCE|TARGET'`，保存请求不包含数据源类别字段、不写 `CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY`。状态：`APPROVED_RESOLVED`。

两处 TBD 设计结论随四份设计基线正式批准闭环。

## 8. 10 项 API 能力和 25 个错误码保持情况

- API 接口总览表 10 项能力逐字保持；
- §7 业务错误码表 25 个错误码（40300/40310~40318/40320~40323/40330/40331/40340/40341/40350/40351/40352/40353/40430/50040/50041）相对基准零变化，与只读权威错误码口径一致；
- 相对基准，API 仅顶部状态元数据与页尾状态说明变化，接口契约正文逐字保持。

## 9. 无并发保护设计边界

已批准边界（`DSUB-REQ-097/098/099/103`）：无版本令牌、无 `DSUB-FP-V1` 内容指纹、无黄金向量、无行锁、无并发字段比较、无 `40910 CONCURRENT_MODIFIED`；编辑保存与删除为普通主键读/写，删除预览只读不返回令牌，普通 SELECT 与 DELETE 之间被其他页面或人工数据库操作修改不检测、不拒绝，最后一次成功写入生效。四文档正文均未出现活动版并发机制回归。

## 10. 关键规则保持情况

- DELETE：事务内普通 SELECT 当前记录（不加锁）→ 记录不存在返回 `40430` → 多源库异常返回 `40351`（不得 DELETE）→ 普通物理 DELETE → 受影响行数 0 行 `40430`、多行 `50041`；不映射 `50040`；删除预览不替代 DELETE 自身防护；
- nullable CSV：`splitTrimDropEmpty(null)` 返回空集合，对 `null` 调用 `split` 抛 `NullPointerException`，多源库异常按归一化后非空 token 数 `>= 2` 判定，9 个边界示例逐字保持；
- 含逗号数据源 ID：三类查询语义（普通完整 token 字面精确匹配、含逗号历史兼容可能匹配并经 `queryWarnings` 展示歧义警告）与 `items + queryWarnings` 响应保持；
- 点号保留分隔符规则保持；
- Oracle 元数据过滤：统一“可订阅普通表集合”谓词显式排除物化视图（`ALL_MVIEWS.MVIEW_NAME` 与 `ALL_MVIEWS.CONTAINER_NAME`）保持；
- `SourceTableInput[]`、`PRESERVE/REPLACE`、UUID32 + `IdType.INPUT`、元数据 API query 参数保持。

## 11. 无 DDL、无数据库访问、无代码修改等保护情况

- 本任务及本 Feature 均未执行也不授权任何 DDL/DML；
- 未访问数据库；
- 未操作 ZooKeeper、Kafka、sync-client 或业务进程；
- 未启动服务；
- 未运行 Maven/npm/测试/构建；
- 未修改业务代码或测试代码；
- 未修改 `REQUIREMENTS.md`、`ACCEPTANCE.md` 及任何前序任务报告；
- 未把实现状态写成已实现，未把验收执行状态写成 PASS；
- 未清理、覆盖或回滚任务前已有无关工作区修改。

## 12. 大屏延期状态

大屏调整状态保持 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`，作为独立任务在数据订阅 Feature 完成并正式验收后处理，本任务不执行大屏延期修正，不作为本 Feature 验收阻断项。

## 13. 验证结果

执行 `DATA-SUBSCRIPTION-DESIGN-BASELINE-APPROVAL-001-AGENT-PROMPT.md` §8 全部强制验证项：

| # | 验证项 | 结果 |
|---|---|---|
| 1 | 当前分支为 `develop` | 通过 |
| 2 | fetch 后 `origin/develop` 等于基准 `ba7fedd...` | 通过 |
| 3 | 任务开始前既有无关修改记录并保护 | 通过 |
| 4 | REQUIREMENTS 零 diff，107 条，APPROVED | 通过 |
| 5 | ACCEPTANCE 零 diff，126 条 NOT_RUN，APPROVED | 通过 |
| 6 | 四份设计文档正文业务内容相对基准零语义变化 | 通过 |
| 7 | 四份文档顶部文档状态均为 APPROVED | 通过 |
| 8 | 四份文档顶部设计正式复审状态均为 APPROVED | 通过 |
| 9 | 四份文档页尾均为 APPROVED，不含“等待 R4/R4-R1 正式复审”等当前待办语义 | 通过 |
| 10 | 四份文档均准确记录批准依据提交 `ba7fedd...` | 通过 |
| 11 | 实现状态仍为 NOT_STARTED | 通过 |
| 12 | 验收执行状态仍为 126 条全部 NOT_RUN | 通过 |
| 13 | 需求追踪 107/107 完整 | 通过 |
| 14 | 验收设计覆盖 126/126 完整 | 通过 |
| 15 | 四文档交叉引用无悬空 | 通过 |
| 16 | API 仍为 10 项能力、25 个业务错误码 | 通过 |
| 17 | DELETE 规则保持（`40351/40430/50041`，普通 SELECT 防护后普通物理 DELETE） | 通过 |
| 18 | nullable CSV 9 个边界示例及 Java null/split 语义保持 | 通过 |
| 19 | 三类数据源 ID 查询语义与 `items + queryWarnings` 保持 | 通过 |
| 20 | 元数据 API query 参数、`ALL_MVIEWS` 显式排除保持 | 通过 |
| 21 | `SourceTableInput[]`、`PRESERVE/REPLACE`、UUID32 + `IdType.INPUT` 保持 | 通过 |
| 22 | 无活动版并发保护机制回归 | 通过 |
| 23 | DATABASE 继续明确不执行、不授权 DDL | 通过 |
| 24 | README 仅 `data-subscription` 行和新增本任务变更记录变化 | 通过 |
| 25 | 大屏延期状态保持 | 通过 |
| 26 | 无敏感信息新增 | 通过 |
| 27 | `git diff --check` 通过 | 通过 |
| 28 | 暂存区恰好只有 6 个授权文件 | 通过 |
| 29 | 任务前无关修改未进入提交 | 通过 |
| 30 | 普通提交、普通 push | 通过 |
| 31 | 推送后本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 一致，ahead/behind 为 `0 0` | 通过 |

## 14. Git 文件范围

授权修改/新增文件（共 6 个）：

1. `docs/features/data-subscription/DESIGN.md`
2. `docs/features/data-subscription/API.md`
3. `docs/features/data-subscription/UI.md`
4. `docs/features/data-subscription/DATABASE.md`
5. `docs/features/README.md`
6. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-DESIGN-BASELINE-APPROVAL-001.md`（新增）

只读零 diff 文件：`REQUIREMENTS.md`、`ACCEPTANCE.md`、业务代码、测试代码、数据库基线、项目级基线、前序任务报告。

本提示词文件不属于提交范围，未暂存未提交。逐文件暂存授权文件，普通提交与普通推送至 `origin/develop`，未使用 force push。

## 15. 下一入口

数据订阅实现阶段任务规划 / 实现基线建立。
