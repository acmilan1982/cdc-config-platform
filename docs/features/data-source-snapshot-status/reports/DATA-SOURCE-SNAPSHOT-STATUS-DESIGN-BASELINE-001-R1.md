# 设计基线 R1 极小定向修订执行报告 DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001-R1

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001-R1` |
| 任务类型 | `CHATGPT_REVIEW_DRIVEN_DOCUMENT_REVISION`（ChatGPT 正式设计复审 `CHANGES_REQUIRED` 驱动的纯文档极小定向修订） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 任务状态 | `COMPLETED`（R1 极小定向修订完成并入库；设计仍 `DRAFT_PENDING_USER_REVIEW` 未批准，功能未实现、验收未执行） |
| 上一任务 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001`（设计基线草案建立，结果提交 `31aa9f5`） |
| R1 授权基准提交（base） | `31aa9f5beec7ded3cd798b3af617fd79a1606ed0`（上一任务结果提交；R1 开始时本地 HEAD 与其一致，ahead/behind=0/0） |
| 批准内容基准 | `4234af73db2190098f3dcd219319a4281fdabafd`（已批准需求/验收的批准内容基准，正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`） |
| 依据需求 | `REQUIREMENTS.md`（`DSS-REQ-001~065` 已批准；本任务整文件零差异） |
| 依据验收 | `ACCEPTANCE.md`（`DSS-AC-001~068` 全部 `NOT_RUN` 已批准；本任务整文件零差异） |
| 执行分支 | `develop` |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交与推送结果见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`） |

## 2. 任务范围与目标

ChatGPT 已对上一结果提交 `31aa9f5`（四份设计草案）进行独立正式复审，结论为 `CHANGES_REQUIRED`。复审已确认以下内容通过：提交范围、四份设计主体、唯一只读接口、全量候选方案、数据库保行设计、65/65 与 68/68 追踪覆盖。本 R1 只修正以下四项，不借机改动已通过复审的 API、数据库、展示字段、状态映射、排序、候选范围或其他业务设计：

1. **R1-01** 每次路由进入/页面实例创建一律初始化为三项“全部”并自动查询，不得从旧会话条件恢复现场；页面实例销毁后现场不跨路由保留；
2. **R1-02** 删除“最新用户意图槽位/排队/覆盖补发”等不唯一并发口径，统一“任意时刻最多一个实际请求在途、忙碌时按钮禁用/自动触发抑制、不排队不补发”规则；
3. **R1-03** 页面恢复可见且请求在途时，在当前请求结束后按届时最新已应用条件补发一次恢复刷新（一次性 `pendingVisibilityRefresh` 唯一例外，非通用排队）；
4. **R1-04** 纠正复审状态元数据：`pending_user_review=YES`、`pending_user_confirmation_count=0`，设计仍待复审。

本任务只修订文档草案，不批准设计、不实现代码、不执行验收，不访问数据库/ZooKeeper/Kafka/sync-client，不启停服务，不运行测试/构建。

## 3. 环境与前置检查

| 检查项 | 结果 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform`（Git 仓库） |
| 当前分支 | `develop` |
| R1 任务开始前 Commit ID（base） | `31aa9f5beec7ded3cd798b3af617fd79a1606ed0` |
| `origin/develop`（本地跟踪引用） | `31aa9f5beec7ded3cd798b3af617fd79a1606ed0` |
| `git ls-remote origin refs/heads/develop` | `31aa9f5beec7ded3cd798b3af617fd79a1606ed0` |
| ahead/behind | `0/0`（本地 HEAD 与 `origin/develop` 一致，无分叉，可安全快进） |
| 与本任务无关的既有工作区修改 | 存在大量用户既有未提交内容（约 120 项）；保持原样，未清理、未覆盖、未暂存、未提交，未使用任何破坏性 Git 命令 |
| 环境预检 | 纯文档任务；不要求后端/前端/数据库/ZooKeeper 环境启动（验证矩阵 `NOT_APPLICABLE`） |
| 需求/验收锚点复核 | `DSS-REQ-023/025/050/051/053/054/059/060/061` 与 `DSS-AC-021/024/048/050/051/056/057/058/068` 已复核，R1 未偏离已批准规则 |

## 4. 允许修改范围（白名单，6 个文件）

| 序号 | 文件 | 操作 |
|---|---|---|
| 1 | `docs/features/data-source-snapshot-status/DESIGN.md` | 修改（§1/§4/§7~§9/§8 事件表相关行/§12 测试设计/§14 落点文字/§15 已定决策；新增 §7.7 与 §16 R1 记录） |
| 2 | `docs/features/data-source-snapshot-status/UI.md` | 修改（§2/§3.1/§3.6/§6.2/§6.4/§7.4/§9；新增 §11 R1 记录） |
| 3 | `docs/features/data-source-snapshot-status/README.md` | 修改（§1/§5/§8/§9/§10 最小状态同步） |
| 4 | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001.md` | 修改（仅纠正 §6 `pending_user_review=NO`→`YES` 并追加一句 R1 元数据纠正注记） |
| 5 | `docs/features/README.md` | 修改（仅最小同步本 Feature 最新有效证据/当前缺口/下一入口并追加 R1 变更记录） |
| 6 | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001-R1.md` | 新增（本报告） |

严禁修改 `REQUIREMENTS.md`、`ACCEPTANCE.md`、`API.md`、`DATABASE.md`、数据库复核报告、需求阶段报告、历史报告、任何前后端代码、测试、配置、依赖、SQL/XML 或静态资源。实际 diff 仅包含上述 6 个文件。

## 5. ChatGPT 正式复审结论

- 复审对象：上一任务结果提交 `31aa9f5`（四份设计草案）。
- 复审结论：`CHANGES_REQUIRED`（R1-01~R1-04）。
- 已通过并保持不变的复审范围：提交范围、四份设计主体、唯一只读接口 `GET /api/monitor/data-source-run-state/list`、全量候选方案、数据库保行设计、65/65 与 68/68 追踪覆盖。
- 唯一需要修正的四项问题即 R1-01~R1-04（见 §6），本任务不扩大修订范围。

## 6. 四项定向修订的处理（R1-01~R1-04）

### R1-01：页面生命周期统一为每次进入默认“全部”

**修改前（R0 需删除的语义）**：

- 设计曾以 Pinia 路由级会话 store（`frontend/src/stores/dataSourceSnapshot.ts`）承载“上次成功现场/已应用查询条件”，页面卸载后由 store 保留、重新进入时可能从 store 恢复旧会话条件或旧草稿；
- 存在“卸载后还原为初始全部或最近成功条件”的二选一表述；隐含把 topic-offset“同一登录会话返回恢复”行为照搬至本 Feature；
- 架构图、职责表与建议实现文件清单含 `frontend/src/stores/dataSourceSnapshot.ts`；
- UI 行为表未把“离开路由后重新进入不恢复现场”与“同页面实例切后台再切回”区分开。

**修改后（DESIGN §1/§4.2/§4.3/§6.2/§7.1/§9/§16；UI §2/§3.1/§3.6/§7.4/§11）**：

1. 前端状态一律改为**页面/composable 实例内 `reactive/ref`**：不新增 Pinia store，不使用 localStorage/sessionStorage，不跨路由保留现场；
2. **每次路由进入/页面实例创建**初始化：界面选择条件=三项“全部”、已应用查询条件=三项“全部”、records/candidates/lastSuccessAt/hasSuccess/错误态=当前页面实例初始值，随即自动按三项“全部”发起首次查询；
3. 页面离开/组件卸载：清除计时器、可见性监听与 `pendingVisibilityRefresh` 待执行恢复标志；置 `disposed=true` 杜绝迟到响应写入；当前页面实例查询现场**不跨路由保留**；再次进入路由创建全新实例、重新初始化三项“全部”并自动查询；
4. 浏览器标签页隐藏→恢复属于**同一仍挂载页面实例**：该期间保留已应用条件与最近成功现场并按 R1-03 执行恢复刷新；与路由离开/重新进入两类生命周期严格区分；
5. 架构/职责/建议文件清单已移除 `frontend/src/stores/dataSourceSnapshot.ts`；
6. UI 行为表明确：首次进入与每次离开后重新进入=三项“全部”并自动查询、不恢复上次现场；同页面实例仅修改条件/重置/刷新/隐藏恢复时仍遵循已应用条件规则。

未改变“修改条件不查询”“重置只复位不查询”“只有点击查询成功才替换已应用条件”等既有规则（DSS-REQ-023/025、AC-024）。

### R1-02：统一请求在途时的用户/自动触发规则

**修改前（R0 需删除的语义）**：

- “最新用户意图槽位”“slot”“latest intent”“`preserveValidFor`”；
- “抑制或置入槽位”“manual 不排队等待？”等二选一/问号表述；
- query/manual 覆盖槽位并在当前请求结束后自动补发；
- `acceptedSeq` 因一个尚未真正发出的排队意图而提前使当前响应失效。

**修改后（DESIGN §7.3/§7.5/§7.6/§8 事件表约定/E5/E10/§9/§15.1 第 13 项；UI §3.6/§6.2/§6.4/§11）**：

1. **任意时刻最多一个实际请求在途**；
2. 请求在途（busy）时：“查询”按钮禁用、“立即刷新”按钮禁用——再次点击**不接受、不排队、不补发**；自动刷新触发被抑制、不排队；
3. 被禁用/被抑制的触发不产生实际请求、不更新最近成功时间、不单独重置 60 秒计时、不产生错误提示（DSS-REQ-053/054、AC-050/051）；
4. 在途时用户仍可修改三个查询控件：改动只停留在界面草稿；当前请求继续使用请求开始时捕获的不可变条件快照；成功应用仍是该次请求开始快照；在途草稿修改须在请求结束后再次点击“查询”才可能生效（AC-024 ③）；
5. 仅保留简单明确的**请求实例令牌 `seq`/`latestSeq`**：只用于防止组件卸载后迟到响应写入与防御异常情况下旧响应覆盖，**不承担任何用户意图排队语义**；
6. DESIGN/UI/事件表/并发章节/架构/测试设计使用同一口径，不再出现二选一或问号表述；
7. topic-offset 的“最新用户意图槽位/覆盖补发/`preserveValidFor`/被排队意图提前作废的 `acceptedSeq`”仅在 DESIGN §3.1 作为 **AS-IS 只读盘点**保留，并明确**“不复用于本 Feature”**。

恢复可见触发为 R1-03 的唯一特殊情况，不归入 query/manual/auto 的普通抑制规则。

### R1-03：恢复可见时的单次延后刷新

**修改前（R0 的缺口）**：

- DESIGN §7/UI §7.4 未对“恢复可见且请求在途”给出无歧义的一次性延后刷新规则：未定义 `pendingVisibilityRefresh`，未提供 `onRequestFinally` 统一收口，未覆盖“补发前再次隐藏/卸载清除标志不补发”与“补发结束才重启 60s”。

**修改后（DESIGN 新增 §7.7、事件表 E12/E13、§9 第 5/6 点、§16；UI §7.4 重写、§9 新增行、§11）**：

1. **空闲恢复可见**：立即按当时最新“已应用查询条件”发起 `restore` 刷新；该实际请求结束后，无论成功失败，重新开始完整 60 秒周期；
2. **busy 恢复可见**：不允许并发发起 restore；仅置**一次性布尔标志 `pendingVisibilityRefresh=true`**；多次可见事件**合并**为一次待执行恢复刷新，不累积队列；
3. 当前在途请求结束后（`onRequestFinally`）：若页面仍可见、组件未卸载且标志仍为 true，先清除标志；**不为刚结束的请求启动 60 秒计时器**；立即读取**届时最新**已应用查询条件并发起一次 restore 刷新——不得使用恢复可见事件发生时捕获的旧条件（刚结束为成功查询时其成功提交先于 finally 完成，restore 用升级后的新条件；刚结束为失败时已应用条件保持旧值，restore 用旧条件）；
4. 该次补发 restore 结束后，无论成功失败，才**重新开始完整 60 秒周期**；
5. 若待执行期间页面再次隐藏或组件卸载：清除 `pendingVisibilityRefresh`、不补发；隐藏期间不启动计时器；
6. 计时器统一收口伪代码已在 DESIGN §7.7 给出：

```text
onRequestFinally:
  busy = false
  if disposed or hidden:
    return
  if pendingVisibilityRefresh:
    pendingVisibilityRefresh = false
    startRestoreWithCurrentAppliedCriteria()
    return
  scheduleNextAfter60Seconds()
```

7. 补发的 restore 是恢复可见规则要求的**实际请求**，走与其它实际请求一致的提交/错误/计时语义；它是 busy 时“不发起重叠请求”的**唯一例外**，不是 query/manual/auto 的通用排队机制；
8. R1-03 场景覆盖（DESIGN §7.7 场景清单，已全部落在 §12 测试设计与 §14 落点）：可见恢复时空闲；可见恢复时 query/manual/auto/initial/retry/restore 任一种在途；在途查询成功改变已应用条件后补发（用新条件）；在途查询失败后补发（用旧条件）；多次可见事件合并一次；补发前再次隐藏/卸载清除标志不补发；补发请求成功/失败后的完整 60 秒重计时。

### R1-04：纠正当前复审状态

**修改前（状态元数据笔误）**：

- Feature `README.md` §9 当前状态行曾把 `pending_user_review` 记为 `NO`；
- 原设计任务报告（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001.md`）§6 曾把 `pending_user_review` 记为 `NO`——与实际设计状态 `DRAFT_PENDING_USER_REVIEW` 矛盾。

**修改后**：

1. Feature `README.md` §9 当前状态行 `pending_user_review=NO` 改为 `YES`；
2. 原设计任务报告 §6 `pending_user_review=NO` 纠正为 `YES`，并追加一句 R1 元数据纠正注记：此系状态元数据笔误纠正，不改变 R0 设计草案建立的业务内容、范围或其他执行事实；
3. `pending_user_confirmation_count=0` 保持不变（DESIGN §15.2：0 项待确认设计项）；
4. 四份设计文档继续 `design_status=DRAFT_PENDING_USER_REVIEW`，本任务**不批准设计**；
5. `docs/features/README.md` 继续准确表达“设计草案已完成 R1 极小定向修订、待 ChatGPT 对 R1 结果提交正式复审与项目负责人批准”，不得写成已批准。

## 7. 保持零变化的设计内容

除 R1-01~R1-04 直接影响的前端状态存放、并发/可见性状态机与状态元数据外，以下内容保持业务语义零变化（DESIGN §14.1 一致性清单复核通过）：

- 唯一接口 `GET /api/monitor/data-source-run-state/list`；参数 `clientId`/`sourceId`/`status`；单响应 `records+candidates`；
- RUN_STATE 全量读取、服务层过滤、候选派生不被筛选收窄；三表只读安全投影与内存关联保行设计；无分页；
- 七列顺序；`RUNNING`/`UNKNOWN`/`COMPLETED` 分类、展示与排序；原始状态值 `SNAPSHOT_RUNNING`/`SNAPSHOT_COMPLETED` 保留；
- 三个时间字段 `YYYY-MM-DD HH:mm:ss`、JSON null、UI `--`；关联缺失/停用/类别异常兼容；
- 查询/刷新成功失败、空结果、重置不查询、稳定宽度“立即刷新”按钮；
- 错误码 `41001/41002`；行键 `clientId + '\x00' + dataSourceId` 字面转义（未重写真实 NUL 字节）；
- 65/65 需求、68/68 验收追踪覆盖；待项目负责人确认设计项仍为 0。

`API.md` 与 `DATABASE.md` 已通过本轮正式复审且与四项修正无直接冲突，本任务整文件零修改；`REQUIREMENTS.md` 与 `ACCEPTANCE.md` 相对批准内容基准整文件零差异。

## 8. 追踪与残留扫描核验

| 验证项 | 结果 |
|---|---|
| 需求 → 设计落点矩阵（DESIGN §14.2） | 65/65（§14 内 `DSS-REQ-001~065` 全数出现，无悬空、无越界 ID） |
| 验收 → 设计落点矩阵（DESIGN §14.3） | 68/68（§14 内 `DSS-AC-001~068` 全数出现，无悬空、无越界 ID） |
| 通用意图槽位残留扫描 | **0**（`slot`/`latest intent`/`preserveValidFor`/`acceptedSeq`/“最新用户意图槽位”等仅在 §3.1 AS-IS 盘点（明确“不复用于本 Feature”）、否定表述（“不存在/删除/不复用/不设”）、R1 变更记录中出现；本 Feature 现行并发口径无任何槽位/排队/覆盖补发语义） |
| Pinia/session/localStorage 恢复旧现场残留扫描 | **0**（DESIGN/UI 中 `Pinia`/`stores/`/`localStorage`/`sessionStorage`/`dataSourceSnapshot.ts` 仅在“不新增 Pinia store”“不使用 localStorage/sessionStorage”“已移除 `frontend/src/stores/dataSourceSnapshot.ts`”等否定/移除语境与 topic-offset AS-IS 盘点中出现；topic-offset 盘点已声明不复用于本 Feature，不作为本 Feature 目标设计） |
| 跨路由会话恢复残留扫描 | **0**（“恢复上次/会话级/跨路由恢复现场”仅以“不恢复上次现场”“现场不跨路由保留”“不复用于本 Feature”等否定/边界语境出现） |
| 忙碌触发口径一致性 | `SUPPRESSED_NOT_QUEUED`（DESIGN/UI/事件表/并发章节/测试设计一致：busy 时查询与立即刷新禁用、自动抑制、不排队不补发；唯一例外为恢复可见延后单次刷新） |
| `pendingVisibilityRefresh` 场景覆盖 | 通过（DESIGN §7.7 场景清单覆盖空闲、各类在途、在途成功/失败后补发、多次可见合并、补发前再隐藏/卸载、补发成功/失败后 60s 重计时；事件表 E12/E13、§9、UI §7.4/§9、§12 测试设计、§14 落点同步） |
| 隐藏/卸载清待补发标志 | `CLEARED`（DESIGN E11/E16/§7.7/§9、UI §7.4：重新隐藏或卸载清除 `pendingVisibilityRefresh`、不补发；隐藏期间 finally 直接返回不调度计时） |
| NUL 字节检查 | **0**（6 个变更文件 + 控制文件均为 UTF-8 文本、实 NUL 字节 0；行键仍为字面 `\x00` 文本，见 §7） |
| 越权状态词检查（把设计草案写成已批准/把功能写成已实现/把验收写成 PASS） | 通过（全文仅以否定/边界限定语境出现；R1 不批准设计） |

## 9. 状态边界

R1 完成后保持：

| 输出字段 | 值 |
|---|---|
| requirements_status | `APPROVED`（保持，相对批准内容基准零差异） |
| acceptance_status | `APPROVED`（保持，68 条业务行全部 `NOT_RUN`、零差异） |
| design_status | `DRAFT_PENDING_USER_REVIEW`（四份设计草案完成 R1 极小定向修订，仍未批准） |
| implementation_status | `NOT_STARTED`（页面仍为占位） |
| acceptance_execution_status | `NOT_RUN`（保持） |
| pending_user_review | `YES` |
| pending_user_confirmation_count | `0` |
| 验收用例状态 | `DSS-AC-001~068` 共 68 条全部 `NOT_RUN`（保持） |

必须反复明确：

> R1 极小定向修订完成不等于设计已批准。四份设计文档仍为 `DRAFT_PENDING_USER_REVIEW`、`pending_user_review=YES`，待 ChatGPT 对 R1 结果提交正式复审并经项目负责人批准后才进入实现。功能仍为占位（`NOT_STARTED`），68 条验收仍全部 `NOT_RUN`。当前状态不是 `IMPLEMENTED`/`PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`，也未把“设计草案已修订”写成“设计已批准”。

## 10. 未执行事项

- 未批准设计（design_status 保持 `DRAFT_PENDING_USER_REVIEW`）；下一入口为 ChatGPT 对 R1 结果提交正式复审，批准前不进入实现。
- 未实现或修改任何前后端代码、测试、依赖、构建配置、SQL/XML 或静态资源；页面仍为占位页。
- 未执行任何验收（全部 `DSS-AC-*` 保持 `NOT_RUN`）。
- 未访问数据库、未执行任何 SELECT/DML/DDL；未操作 ZooKeeper/TongZK、Kafka、sync-client；未启动/停止/重启任何服务。
- 未运行前端/后端测试、构建、格式化或自动修复命令（纯文档任务，验证矩阵 `NOT_APPLICABLE`）。
- 未修改 `REQUIREMENTS.md`/`ACCEPTANCE.md`/`API.md`/`DATABASE.md` 或任何 `DSS-REQ-*`/`DSS-AC-*` 业务行（四文件整文件零差异）。
- 数据库复核报告、需求阶段报告、历史报告等白名单外文件未改动；未重新引入 Pinia store、跨路由会话恢复或通用意图槽位。
- 工作区既有与本任务无关的未提交修改保持原样，未清理、未覆盖、未纳入本次提交。

## 11. 结果汇总

| 输出字段 | 值 |
|---|---|
| 任务状态 | `COMPLETED`（R1 极小定向修订完成；设计未批准、功能未实现、验收未执行） |
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001-R1` |
| 分支 | `develop` |
| base_commit_id | `31aa9f5beec7ded3cd798b3af617fd79a1606ed0` |
| requirements_status | `APPROVED` |
| acceptance_status | `APPROVED` |
| design_status | `DRAFT_PENDING_USER_REVIEW` |
| implementation_status | `NOT_STARTED` |
| acceptance_execution_status | `NOT_RUN` |
| pending_user_review | `YES` |
| pending_user_confirmation_count | `0` |
| requirements_design_coverage | 65/65 |
| acceptance_design_coverage | 68/68 |
| requirements_file_diff | `ZERO` |
| acceptance_file_diff | `ZERO` |
| api_file_diff | `ZERO` |
| database_file_diff | `ZERO` |
| cross_route_state_restore_status | `REMOVED` |
| general_intent_slot_status | `REMOVED` |
| busy_query_manual_auto_status | `SUPPRESSED_NOT_QUEUED` |
| pending_visibility_refresh_status | `DOCUMENTED_SINGLE_DEFERRED_RESTORE` |
| hidden_pending_restore_status | `CLEARED` |
| nul_byte_count | `0` |
| database_access_status | `NONE` |
| database_write_status | `NONE` |
| ddl_status | `NONE` |
| code_change_status | `NONE` |
| test_build_status | `NOT_RUN`（纯文档任务，验证矩阵 `NOT_APPLICABLE`） |
| push_status | 本任务按任务提示词 §12 授权执行 commit + 普通 push 至 `origin/develop`（非强推）；推送后本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 三者一致、ahead/behind=0/0，详见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT` |
| 变更文件 | 白名单 6 个文件（见 §4） |

下一入口：**ChatGPT 对设计 R1 极小定向修订结果提交（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001-R1`）进行正式复审**；R1 复审通过并由项目负责人批准设计后，才进入实现阶段。本 R1 修订任务不得继续批准设计、实现功能或执行验收。
