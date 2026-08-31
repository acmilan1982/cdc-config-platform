# 数据订阅设计基线 R4-R1 状态元数据定向收口报告

任务编号：`DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R4-R1`

## 1. 基准提交与正式复审结论

- 分支：`develop`
- 基准提交：`2d81f19b3da87202198ce507f76b6dd12a5aaad7`（R4 结果提交）
- 正式复审结论：`CHANGES_REQUIRED`
- 任务性质：纯文档、纯状态元数据定向收口

ChatGPT 对 R4 结果提交 `2d81f19b3da87202198ce507f76b6dd12a5aaad7` 完成正式复审。R4 三项业务技术修正均通过，但发现四份设计文档（DESIGN/API/UI/DATABASE）的版本/复审状态标记不一致，正式复审结论为 `CHANGES_REQUIRED`。本任务只修正状态元数据标记，不修改任何需求、验收标准、接口契约、业务流程、数据库设计语义或代码。

## 2. R4 三项业务修正已通过且本任务零业务语义变化

ChatGPT R4 正式复审确认通过且本任务不得改动的业务设计：

1. DELETE 影响 0 行使用 `40430`，影响多行使用 `50041 DELETE_FAILED`，不得映射为 `50040 SAVE_FAILED`；
2. DELETE 接口按当前设计执行普通 SELECT → 存在性校验 → 多源库异常业务校验 → 普通物理 DELETE；不加锁、不做版本比较、不做并发冲突检测；删除预览不替代 DELETE 接口自身业务校验；
3. Java null/split 语义已修正：对 `null` 调用实例方法 `split` 会抛 `NullPointerException`，`splitTrimDropEmpty(null)` 返回空集合，多源库异常按归一化后非空 token 数 `>= 2` 判定。

R2/R3 已正确内容（三类查询语义、`items + queryWarnings`、元数据 query 参数、`ALL_MVIEWS` 显式排除、`SourceTableInput[]`、`PRESERVE/REPLACE`、`UUID32 + IdType.INPUT`、无并发保护边界等）均保留不回退。

本任务零业务语义变化：未修改任何正文业务内容，只调整状态元数据与页尾状态说明。

## 3. 四份设计文档原状态不一致的事实

R4 结果提交中，四份同属数据订阅设计基线的文档状态不一致：

| 文档 | 顶部设计复审状态 | 页尾状态说明 |
|---|---|---|
| `DESIGN.md` | `PENDING_R4_REVIEW` | “R3 定向修订版 / 等待 R3 复审” |
| `DATABASE.md` | `PENDING_R4_REVIEW` | “R3 定向修订版 / 等待 R3 复审” |
| `API.md` | `PENDING_R3_REVIEW` | “R3 定向修订版 / 等待 R3 复审” |
| `UI.md` | `PENDING_R3_REVIEW` | “R3 定向修订版 / 等待 R3 复审” |

四份文件均属于同一套数据订阅设计基线，即使 API/UI 在 R4 中没有业务语义变化，其当前复审入口也必须统一指向 R4-R1 结果的正式复审，不能继续显示过期的 R3 状态。

## 4. 四份文档顶部/页尾状态统一结果

| 文档 | 顶部设计复审状态 | 页尾状态说明 |
|---|---|---|
| `DESIGN.md` | `PENDING_R4_REVIEW`（保持） | R4 定向修订版 / R4-R1 完成状态元数据收口；等待 ChatGPT 对 R4-R1 结果提交正式复审 |
| `DATABASE.md` | `PENDING_R4_REVIEW`（保持） | R4 定向修订版 / R4-R1 完成状态元数据收口；等待 ChatGPT 对 R4-R1 结果提交正式复审 |
| `API.md` | `PENDING_R3_REVIEW` → `PENDING_R4_REVIEW` | R4 定向修订版 / API 业务设计在 R4 中零语义变化；等待 ChatGPT 对 R4-R1 结果提交正式复审 |
| `UI.md` | `PENDING_R3_REVIEW` → `PENDING_R4_REVIEW` | R4 定向修订版 / UI 业务设计在 R4 中零语义变化；等待 ChatGPT 对 R4-R1 结果提交正式复审 |

统一口径：

- 当前业务设计版本仍是 R4，`PENDING_R4_REVIEW` 表示通过 R4-R1 修正状态元数据，下一动作是复审 R4-R1 结果提交；不得创造 `PENDING_R4_R1_REVIEW` 等未定义状态；
- API/UI 顶部与页尾均明确“API/UI 业务设计在 R4 中零语义变化，但作为四文档设计基线的一部分，当前统一等待 ChatGPT 对 R4-R1 结果提交正式复审”；
- 接口数量、URL、请求响应、错误码、字段映射、查询语义等 API 正文业务内容逐字保持；页面布局、交互、异常状态、删除流程等 UI 正文业务内容逐字保持。

## 5. 需求、验收、设计正文、代码和外部系统保护情况

- `REQUIREMENTS.md`：相对基准零 diff，107 条连续唯一，状态 `APPROVED`；
- `ACCEPTANCE.md`：相对基准零 diff，126 条连续唯一且全部 `NOT_RUN`，状态 `APPROVED`；
- 四份设计文档正文业务设计零语义变化，仅顶部状态元数据与页尾状态说明变化；
- 业务代码、测试代码、数据库基线与项目级基线零 diff；
- 未访问数据库、未执行 DDL/DML、未操作 ZooKeeper/Kafka/sync-client、未启动服务、未运行 Maven/npm/测试/构建；
- 未恢复版本令牌、指纹、行锁、并发字段比较或 `40910`；
- 未把设计状态更新为 `APPROVED`，未把任何验收项更新为 PASS；
- 任务开始前已有无关工作区修改（`frontend/**`、`.claude/settings.local.json`、`agent-env.sh`、`docs/database/` 删除、`docs/agent-prompts/**` 等）全部保持原样，未进入本次提交。

## 6. 验证结果

执行 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R4-R1-AGENT-PROMPT.md` §7 全部强制验证项：

| # | 验证项 | 结果 |
|---|---|---|
| 1 | 当前分支为 `develop` | 通过 |
| 2 | fetch 后 `origin/develop` 等于基准 `2d81f19...` | 通过 |
| 3 | 任务开始前既有无关修改记录并保护 | 通过 |
| 4 | `REQUIREMENTS.md` 零 diff，107 条，APPROVED | 通过 |
| 5 | `ACCEPTANCE.md` 零 diff，126 条 NOT_RUN，APPROVED | 通过 |
| 6 | 四份设计文档状态均为 `DRAFT_PENDING_USER_REVIEW` | 通过 |
| 7 | 四份文档顶部设计复审状态均为 `PENDING_R4_REVIEW` | 通过 |
| 8 | 四份文档页尾均不再出现“R3 定向修订版”“等待 R3 复审”等过期当前状态 | 通过 |
| 9 | 四份文档均明确下一入口为 ChatGPT 对 R4-R1 结果提交正式复审 | 通过 |
| 10 | DESIGN/DATABASE 除状态元数据和页尾外零变化 | 通过 |
| 11 | API/UI 除顶部状态元数据和页尾外零变化 | 通过 |
| 12 | API 接口契约与 25 个错误码逐字保持 | 通过 |
| 13 | UI 业务交互正文逐字保持 | 通过 |
| 14 | DELETE 普通读取业务防护、`40351/40430/50041` 规则保持 | 通过 |
| 15 | Java null/split 修正及 9 个 CSV 边界示例保持 | 通过 |
| 16 | 无活动版版本令牌、指纹、行锁、并发冲突设计回归 | 通过 |
| 17 | 107 条需求追踪与 126 条验收设计覆盖完整 | 通过 |
| 18 | 四文档交叉引用无悬空 | 通过 |
| 19 | README 只有 `data-subscription` 行和新增本任务变更记录变化 | 通过 |
| 20 | 大屏延期状态保持 | 通过 |
| 21 | 无敏感信息新增 | 通过 |
| 22 | `git diff --check` 通过 | 通过 |
| 23 | 暂存区恰好只有 6 个授权文件 | 通过 |
| 24 | 任务前无关修改未进入提交 | 通过 |
| 25 | 普通提交与普通 push | 通过 |
| 26 | 推送后本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 一致，ahead/behind 为 `0 0` | 通过 |

## 7. 文件范围与 Git 保护

授权修改/新增文件（共 6 个）：

1. `docs/features/data-subscription/DESIGN.md`
2. `docs/features/data-subscription/API.md`
3. `docs/features/data-subscription/UI.md`
4. `docs/features/data-subscription/DATABASE.md`
5. `docs/features/README.md`
6. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R4-R1.md`（新增）

只读零 diff 文件：`REQUIREMENTS.md`、`ACCEPTANCE.md`、业务代码、测试代码、数据库基线、项目级基线、前序任务报告。

本提示词文件不属于提交范围，未暂存未提交。逐文件暂存授权文件，普通提交与普通推送至 `origin/develop`，未使用 force push。

## 8. 状态边界

```text
requirements_status=APPROVED
acceptance_status=APPROVED
design_status=DRAFT_PENDING_USER_REVIEW
design_review_status=PENDING_R4_REVIEW
implementation_status=NOT_STARTED
acceptance_execution_status=NOT_RUN
requirements_count=107
acceptance_count=126
large_screen_adjustment_status=DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE
```

## 9. 下一入口

ChatGPT 对 R4-R1 结果提交的正式设计复审。
