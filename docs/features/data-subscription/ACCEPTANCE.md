# 数据订阅 Feature 验收基线（ACCEPTANCE）

## 1. 文档元数据与状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据订阅 |
| Feature 标识 | `data-subscription` |
| 正式菜单 | 数据订阅（配置管理组，路由 `/config/subscribe`，菜单项与路由均保持既有值不变） |
| 既有路由 | `/config/subscribe` |
| 目标文档 | `docs/features/data-subscription/ACCEPTANCE.md` |
| 文档状态 | `APPROVED`（正式验收前 UI 交互基线对齐草案及 R1 状态文字修订已经获得 ChatGPT 对结果提交 `26094c6b6d8f9b8d5971ef38648851611799adee` 的正式复审 `APPROVED`，批准收口完成；当前版本把 `DSUB-AC-058/061/069/072/073/082` 对应的最终交互事实（弹窗尺寸与视口约束、描述单行输入、空间优先级与顶部布局、紧凑目标库卡片、白色主体四态、Shift 连选）作为正式批准验收标准基线；上一正式批准验收标准版本为“取消并发保护”验收标准调整版本，已获得 ChatGPT 对 R1 结果提交 `43a909773aec63fe8c4de2957074f113910f4686` 的正式复审 `APPROVED`，该批准历史保留；更早“含逗号数据源 ID 查询兼容”批准版本（批准依据提交 `5d5b5f4606da14f160e9db43068f114d35501db8`）与“英文句点 `.` 保留分隔符”批准版本（批准依据提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a`）同样作为历史事实保留，见 §6 变更记录；验收编号仍为 126 条连续唯一，全部仍 `NOT_RUN`；本次批准的是验收标准基线，不代表验收已经执行或通过） |
| 实现状态 | `IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_REVIEW`（数据订阅正式验收已执行，126 条验收用例全部 `PASS`，证据完整归档于 `evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001/`；正式验收报告见 `reports/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001.md`；待 ChatGPT 对正式验收结果提交进行正式复审；正式复审通过前当前不是 `IMPLEMENTED_ACCEPTED`）；R1（`DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1`）真实浏览器补验与证据定向修订已执行：126 条全部保持 `PASS`（0 `FAIL`/0 `BLOCKED`），R1 证据目录 `evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1/`（54 个浏览器场景 + 干净 worktree 前端测试 + 数据库恢复证据），`coverage-matrix-r1.md` 取代原 `coverage-matrix.md` 的证据标注并纠正不准确的 `BR` 声明；验收执行状态保持 `EXECUTED_PENDING_REVIEW`，实现状态保持 `IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_REVIEW`，待 ChatGPT 对 R1 结果提交正式复审；R1 不代表正式验收通过或 `IMPLEMENTED_ACCEPTED`） |
| 任务编号 | `DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001` |
| 创建日期 | 2026-08-30 |
| 依据需求 | `docs/features/data-subscription/REQUIREMENTS.md`（当前版本为“取消并发保护”需求调整版本基础上收口正式验收前 UI 交互基线对齐草案及 R1 状态文字修订，文档状态 `APPROVED`，ChatGPT 对结果提交 `26094c6b6d8f9b8d5971ef38648851611799adee` 正式复审 `APPROVED`；上一正式批准需求版本批准依据提交 `43a909773aec63fe8c4de2957074f113910f4686`，该批准历史保留；更早含逗号数据源 ID 查询兼容调整批准版本（批准依据提交 `5d5b5f4606da14f160e9db43068f114d35501db8`）同样作为历史事实保留） |

重要声明：本文件把所有需求转换为可客观验收的场景，使用唯一、稳定的验收编号。所有用例初始状态为 `NOT_RUN`（未执行）；`PASS / FAIL / BLOCKED` 是执行后状态，任何用例状态只有在执行并取得与步骤匹配的客观证据后才允许更新。对需要构造数据库异常数据的验收场景，本文件只定义期望行为，不授权任何测试数据写入；任何数据库写操作仍需按项目数据库审批规则另行获得授权。

状态含义必须清楚：批准验收标准、执行验收、正式验收通过、实现正式接受是不同状态。上一正式批准版本（提交 `d7560445be1504e6ed9957fa7b31be1fd393ea19`）已获得项目负责人正式批准；其后与“英文句点 `.` 保留分隔符”直接相关的既有验收项定向扩展版本已获得 ChatGPT 正式复审 `APPROVED`（批准依据提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a`），该批准历史保留不变；再后含英文逗号数据源 ID 查询兼容验收语义的定向调整版本已获得 ChatGPT 正式复审 `APPROVED`（批准依据提交 `5d5b5f4606da14f160e9db43068f114d35501db8`）；项目负责人随后明确“数据订阅页面的新增、编辑、删除完全不处理并发操作，不考虑其他页面用户或人工直接修改数据库造成的并发冲突”，本文件据此定向调整 `DSUB-AC-107/108/109/110/114/117` 与 §4.11，形成“取消并发保护”验收标准调整草案；该草案（含 R1 对 `DSUB-AC-048` 的定向修正）已获得 ChatGPT 对结果提交 `43a909773aec63fe8c4de2957074f113910f4686` 的正式复审 `APPROVED`，当前验收标准版本已正式批准。验收标准基线获得批准不等于验收用例已执行。验收标准获批当时功能尚未实现（当时实现状态为 `NOT_STARTED`，属历史事实，不代表当前状态）；其后后端实现及真实数据库集成验证、前端 R3 代码与视觉、R3-R1 报告元数据收口均已获 ChatGPT 正式批准，当前功能已经实现并完成实现复审，当前实现状态为 `IMPLEMENTED_REVIEW_APPROVED_PENDING_FORMAL_ACCEPTANCE`（代码已实现并复审通过，待正式验收，不是 `NOT_STARTED`，也不是 `IMPLEMENTED_ACCEPTED`）；全部 126 条用例状态仍必须保持 `NOT_RUN`，只有未来实际执行并取得与步骤匹配的客观证据后，才允许更新为 `PASS / FAIL / BLOCKED`。后续正式验收前 UI 交互基线对齐草案（`DATA-SUBSCRIPTION-PRE-ACCEPTANCE-UI-BASELINE-ALIGNMENT-001`）把已确认、已实现、已复审通过的最终交互事实（弹窗尺寸、目标库卡片白色主体四态、Shift 连选）同步为待正式复审的文档草案；126 条用例仍全部为 `NOT_RUN`，本草案不代表正式验收通过；批准验收标准、实现复审通过、正式验收执行、Feature 正式接受仍是不同状态，当前本文件不得作为功能已实现或验收已通过的证据。随后，ChatGPT 对批准收口结果提交 `dc97ffdee677ce8068d2652c9758359349174c82` 的正式复核结论为 `CHANGES_REQUIRED`，唯一问题是四份文档当前状态元数据未完全收口；本 R1（`DATA-SUBSCRIPTION-PRE-ACCEPTANCE-UI-BASELINE-ALIGNMENT-APPROVAL-001-R1`）已定向修正本文件实现状态说明中把当前批准版本称为“草案”的过期文字（“当前功能已经实现并完成实现复审”的说明保持不回退），业务语义零变化，文档状态保持 `APPROVED`，126 条用例仍全部 `NOT_RUN`，当前不是正式验收通过或 `IMPLEMENTED_ACCEPTED`。

## 2. 验收结果状态模型

| 状态 | 含义 |
|---|---|
| `NOT_RUN` | 尚未执行，不能推定通过（所有用例初始状态） |
| `PASS` | 已执行且符合预期，须附证据 |
| `FAIL` | 已执行且不符合预期，须记录失败点 |
| `BLOCKED` | 受环境或前置条件阻塞，须记录阻断原因 |
| `DEFERRED_UNTIL_*` | 经批准延期到明确后续阶段 |

## 3. 验收领域分类与数量

| 分类 | 编号范围 | 数量 |
|---|---|---|
| 生效边界与 sync-client 字段 | DSUB-AC-001 ~ DSUB-AC-005 | 5 |
| 数据模型与存储规则 | DSUB-AC-006 ~ DSUB-AC-027 | 22 |
| 列表页面与查询 | DSUB-AC-028 ~ DSUB-AC-043 | 16 |
| 异常记录与异常数据源展示 | DSUB-AC-044 ~ DSUB-AC-048 | 5 |
| 查看详情 | DSUB-AC-049 ~ DSUB-AC-056 | 8 |
| 新增/编辑弹窗交互与源库搜索 | DSUB-AC-057 ~ DSUB-AC-070 | 14 |
| 目标库选择 | DSUB-AC-071 ~ DSUB-AC-074 | 4 |
| Schema 与表选择 | DSUB-AC-075 ~ DSUB-AC-088 | 14 |
| 新增保存规则 | DSUB-AC-089 ~ DSUB-AC-096 | 8 |
| 编辑规则 | DSUB-AC-097 ~ DSUB-AC-106 | 10 |
| 无并发保护边界 | DSUB-AC-107 ~ DSUB-AC-110 | 4 |
| 删除规则 | DSUB-AC-111 ~ DSUB-AC-117 | 7 |
| 通用交互、安全与延期项 | DSUB-AC-118 ~ DSUB-AC-126 | 9 |
| **合计** | DSUB-AC-001 ~ DSUB-AC-126 | **126** |

## 4. 验收用例

> 正式验收执行汇总：任务 `DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001` 已执行，126 条用例全部更新为 `PASS`（0 `FAIL`、0 `BLOCKED`、0 `NOT_RUN`），证据归档于 `evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001/`，正式验收报告见 `reports/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001.md`。“状态”列的含义与更新规则见 §2。

### 4.1 生效边界与 sync-client 字段（对应 REQUIREMENTS §7）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-001 | PASS | DSUB-REQ-001, DSUB-REQ-002 | 已进入数据订阅页面 | 新增一条订阅并保存；检查后端写入 `CDC_DATA_SUBSCRIBE` 的字段 | 保存的订阅记录含 `DATA_FROM_SOURCE_ID`、`DATA_TO_SOURCE_ID`、`DATA_SOURCE_TABLE`、`FG_ACTIVE` 等按需求写入；`sync-client` 读取所依赖的四字段完整可用 |
| DSUB-AC-002 | PASS | DSUB-REQ-003 | 打开新增或编辑弹窗 | 观察弹窗与列表字段 | 页面不展示、不解析、不维护 `DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT`（遗留字段） |
| DSUB-AC-003 | PASS | DSUB-REQ-004, DSUB-REQ-005 | 已完成一次订阅新增/编辑/删除 | 检查后端与页面行为；检查接口调用 | 新增、编辑、删除均不触发通知或重启 `sync-client`、不操作 ZooKeeper、不创建/删除/检查 Kafka Topic、不启停同步任务；页面不显示“已生效”或“待生效”状态 |
| DSUB-AC-004 | PASS | DSUB-REQ-006 | 完成一次订阅新增 | 观察成功提示 | 提示为“操作成功。配置将在相关 sync-client 重启后生效。” |
| DSUB-AC-005 | PASS | DSUB-REQ-005 | 完成一次订阅删除 | 观察删除成功提示 | 提示包含重启 `sync-client` 后生效的说明 |

### 4.2 数据模型与存储规则（对应 REQUIREMENTS §8）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-006 | PASS | DSUB-REQ-007 | 新增订阅并保存 | 检查新增记录的主键与 ID 生成 | 新增记录写入唯一的 `DATA_SUB_ID`（数据库主键）；ID 由后端生成，格式在后续设计确定，本阶段不虚构 |
| DSUB-AC-007 | PASS | DSUB-REQ-008 | 新增或编辑订阅 | 选择源库并保存 | `DATA_FROM_SOURCE_ID` 只保存一个源库 ID，不含英文逗号 |
| DSUB-AC-008 | PASS | DSUB-REQ-009 | 已存在一条以源库 A 为源的订阅 | 新增第二条同样以源库 A 为源的订阅并保存 | 保存成功，不因同一源库出现在多条记录而拒绝 |
| DSUB-AC-009 | PASS | DSUB-REQ-010, DSUB-REQ-011 | 数据库存在 `DATA_FROM_SOURCE_ID` 含多个源库（逗号分隔）的启用记录 | 进入列表页 | 该记录整行使用警示色并显示“配置异常：该记录包含多个源库，请直接维护数据库” |
| DSUB-AC-010 | PASS | DSUB-REQ-012 | 数据库存在多源库异常记录 | 查看该行操作列与尝试操作 | 该行不提供查看、编辑、删除等任何操作入口；不提供自动拆分 |
| DSUB-AC-011 | PASS | DSUB-REQ-013, DSUB-REQ-014 | 新增订阅并保存 | 选择两个目标库并保存 | `DATA_TO_SOURCE_ID` 保存两个目标库 ID，以英文逗号分隔；该记录的源表将同步到全部目标库 |
| DSUB-AC-012 | PASS | DSUB-REQ-015 | 新增订阅并保存 | 源表清单含多张表 | `DATA_SOURCE_TABLE` 中多张表以英文逗号分隔保存，不含换行符 |
| DSUB-AC-013 | PASS | DSUB-REQ-016 | 源库存在 Schema 与表名为混合大小写的表 | 选择并保存该表 | 保存的表标识为 `DATA_SOURCE_ID.Schema.表名` 格式，两个英文句点为三段结构的保留分隔符（正常格式）；Schema 与表名保持源 Oracle 原始大小写 |
| DSUB-AC-014 | PASS | DSUB-REQ-017 | 源库存在名称含英文逗号、或名称组件内部含英文句点的对象 | 分别对名称含英文逗号、名称组件内部含英文句点的对象尝试选择 | 页面均不得允许选择，并明确说明协议限制：数据源 ID、Schema 名和表名不得包含英文逗号 `,`，也不得包含组件内部英文句点 `.`（`DATA_SOURCE_ID.Schema.表名` 三段结构中的两个句点为正常保留分隔符，不属异常） |
| DSUB-AC-015 | PASS | DSUB-REQ-018 | 新增订阅 | 尝试在同一行重复选择同一张表 | 单条记录内不重复保存同一完整表标识 |
| DSUB-AC-016 | PASS | DSUB-REQ-019 | 数据库已存在“源A+Schema+表+目标B”的订阅 | 新增第二条完全相同的“源A+Schema+表+目标B”订阅并保存 | 保存成功，管理平台不因跨行重复而拒绝 |
| DSUB-AC-017 | PASS | DSUB-REQ-020 | 数据库存在 `FG_ACTIVE=1` 与 `FG_ACTIVE=0` 的订阅记录 | 进入列表页 | 只展示 `FG_ACTIVE=1` 记录；`FG_ACTIVE=0` 记录完全不显示 |
| DSUB-AC-018 | PASS | DSUB-REQ-020 | 新增订阅 | 观察新增流程与保存结果 | 新增固定写入 `FG_ACTIVE=1`；页面不提供启用状态选择 |
| DSUB-AC-019 | PASS | DSUB-REQ-021 | 打开任一正常记录 | 观察可用的状态操作 | 页面不提供停用、恢复或回收站；删除为按主键物理删除，不通过将 `FG_ACTIVE` 置 `0` 实现 |
| DSUB-AC-020 | PASS | DSUB-REQ-022 | 新增或编辑订阅 | 订阅描述留空或超长 | 订阅描述必填校验生效；长度校验前后端一致（数据库 `DATA_SUB_DESC` VARCHAR2(255)） |
| DSUB-AC-021 | PASS | DSUB-REQ-023 | 新增订阅并保存 | 检查 `DATA_SOURCE_COMMENT` | 新增时 `DATA_SOURCE_COMMENT` 写入 `NULL`，页面不展示、不解析、不维护 |
| DSUB-AC-022 | PASS | DSUB-REQ-023 | 编辑一条已有历史记录 | 不修改遗留字段并保存 | 编辑后 `DATA_SOURCE_COMMENT` 保持原值，不主动清空 |
| DSUB-AC-023 | PASS | DSUB-REQ-024 | 新增订阅并保存 | 检查 `DATA_TARGET_TABLE` | 新增时 `DATA_TARGET_TABLE` 写入 `NULL`；编辑历史记录时保持原值 |
| DSUB-AC-024 | PASS | DSUB-REQ-025 | 新增订阅并保存 | 检查 `DATA_TARGET_COMMENT` | 新增时 `DATA_TARGET_COMMENT` 写入 `NULL`；编辑历史记录时保持原值 |
| DSUB-AC-025 | PASS | DSUB-REQ-026 | 新增订阅并保存 | 检查时间字段 | 新增时 `INSERT_TIME` 为数据库当前时间；`UPDATE_TIME` 为空 |
| DSUB-AC-026 | PASS | DSUB-REQ-027 | 编辑一条已有记录并保存 | 检查时间字段 | 编辑后 `INSERT_TIME` 保持不变，`UPDATE_TIME` 更新为数据库当前时间 |
| DSUB-AC-027 | PASS | DSUB-REQ-028 | 列表含 `UPDATE_TIME` 为空与不为空的记录 | 进入列表页 | 列表按 `NVL(UPDATE_TIME, INSERT_TIME)` 倒序排序；`UPDATE_TIME` 为空时回退显示 `INSERT_TIME` |

### 4.3 列表页面与查询（对应 REQUIREMENTS §9.1、§9.2、§9.3）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-028 | PASS | DSUB-REQ-029 | 左侧菜单“数据订阅”可见 | 点击“数据订阅”菜单 | 进入数据订阅页面，地址为 `/config/subscribe`；首次进入自动查询并展示全部 `FG_ACTIVE=1` 记录 |
| DSUB-AC-029 | PASS | DSUB-REQ-030 | 启用订阅记录总数超过单屏可显示 | 进入页面观察列表与接口 | 一次显示全部启用记录；页面无分页控件、无页码、无“加载更多”；查询请求与接口契约不使用分页参数 |
| DSUB-AC-030 | PASS | DSUB-REQ-031 | 列表含多条启用记录 | 进入页面或完成查询后观察顺序 | 默认按 `NVL(UPDATE_TIME, INSERT_TIME) DESC` 排序 |
| DSUB-AC-031 | PASS | DSUB-REQ-032 | 已进入数据订阅页面 | 观察查询区 | 查询条件严格为两个多选下拉：源库、目标库；无其他查询条件 |
| DSUB-AC-032 | PASS | DSUB-REQ-033 | 已进入数据订阅页面 | 展开源库/目标库下拉候选项；对照存量数据源 ID 含英文逗号或句点的记录 | 源库候选项仅含 `FG_ACTIVE=1` 且类别匹配的源库；目标库候选项仅含 `FG_ACTIVE=1` 且类别匹配的目标库；不包含停用或不存在的数据源；ID 含英文逗号或英文句点的存量候选不因保留字符被静默移除；ID 仅含英文句点（不含英文逗号）的候选保持普通可选并可按完整 token 精确匹配；ID 含英文逗号的候选仍可选，但显示明确歧义警告（如“含逗号，历史兼容查询可能存在歧义”），不得冒充普通精确候选（新增/编辑维护候选的禁用规则不变，本次只涉及列表查询候选） |
| DSUB-AC-033 | PASS | DSUB-REQ-034 | 主列表含记录 | 在源库条件选择两个源库并点击“查询” | 两个普通源库 ID 之间为 OR；token 去除首尾空白后精确匹配，`S01` 不误匹配 `S012`，`%`、`_` 等字符按字面值处理；仅含英文句点（不含英文逗号）的源库 ID 可精确匹配；选择含英文逗号的源库候选时，返回“可能匹配记录集合”并显示查询歧义警告——由于无转义 CSV 无法区分单个含逗号 ID 与相邻普通 ID，验收必须承认该歧义无法从当前物理字段消除，不得要求后端伪造精确识别（详见紧邻补充说明） |
| DSUB-AC-034 | PASS | DSUB-REQ-034 | 主列表含记录 | 在目标库条件选择两个目标库并点击“查询” | 两个普通目标库 ID 之间为 OR；token 去除首尾空白后精确匹配，`S01` 不误匹配 `S012`，`%`、`_` 等字符按字面值处理；仅含英文句点（不含英文逗号）的目标库 ID 可精确匹配；选择含英文逗号的目标库候选时，返回“可能匹配记录集合”并显示查询歧义警告——由于无转义 CSV 无法区分单个含逗号 ID 与相邻普通 ID，验收必须承认该歧义无法从当前物理字段消除，不得要求后端伪造精确识别（详见紧邻补充说明） |
| DSUB-AC-035 | PASS | DSUB-REQ-034 | 主列表含记录 | 同时选择源库与目标库条件并点击“查询” | 返回同时满足源库条件组与目标库条件组的记录（两组之间为 AND）；任一组包含含英文逗号候选时仍按组间 AND 执行；只要查询包含任意含逗号候选，页面持续展示查询歧义警告（详见紧邻补充说明） |

> 查询歧义补充说明：`DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID` 为无引号、无转义符、无长度前缀的英文逗号分隔协议（第一版未引入关联表或数据迁移）。原始字符串 `A,B` 既可能表示单个含逗号 ID `A,B`，也可能表示两个相邻普通 ID `A` 与 `B`，无法从当前物理字段消除歧义。因此：普通 ID 与仅含句点 ID 按去除首尾空白后的完整 token 字面精确匹配；含逗号候选只能采用“历史兼容可能匹配”语义，返回可能匹配记录集合（可能包含歧义记录），页面必须显示歧义警告；验收不得要求后端把无转义 CSV 中的含逗号 ID 精确识别为单个 token。新增/编辑维护候选的禁用规则不受影响。
| DSUB-AC-036 | PASS | DSUB-REQ-034 | 已进入数据订阅页面 | 修改表单条件但不点击“查询” | 列表保持上次查询结果，不因表单变化自动重新查询 |
| DSUB-AC-037 | PASS | DSUB-REQ-034 | 已完成一次带条件的查询 | 点击“重置” | 表单条件被清空；列表保持上一次已生效的查询结果，不自动重新查询，也不自动恢复全部记录。 |
| DSUB-AC-038 | PASS | DSUB-REQ-034 | 查询结果为空 | 点击“查询” | 显示“暂无符合条件的订阅记录” |
| DSUB-AC-039 | PASS | DSUB-REQ-035, DSUB-REQ-036 | 已进入数据订阅页面 | 观察列表列 | 列顺序为：订阅描述、源库、源表、目标库、更新时间、操作；`DATA_SUB_ID` 不在第一层列表单独占列 |
| DSUB-AC-040 | PASS | DSUB-REQ-037 | 主列表含记录 | 观察源库列与目标库列，悬停 | 主要显示 `DATA_SOURCE_ORG`；悬停显示 `DATA_SOURCE_ID` |
| DSUB-AC-041 | PASS | DSUB-REQ-038 | 主列表含源表为多张的订阅 | 观察源表列，悬停 | 源表列只显示“共 N 张”；悬停逐行显示全部 `Schema.表名`，悬停层限高并内部滚动 |
| DSUB-AC-042 | PASS | DSUB-REQ-039 | 主列表含多个目标库的订阅 | 观察目标库列 | 目标库以独立标签显示；空间不足时显示前几个标签和 `+N`，悬停可查看全部 |
| DSUB-AC-043 | PASS | DSUB-REQ-040, DSUB-REQ-041 | 主列表含 `UPDATE_TIME` 为空与不为空的记录 | 观察更新时间列与操作列 | 只显示更新时间；`UPDATE_TIME` 为空时回退显示 `INSERT_TIME` 并标记为创建时间；正常单源库记录操作含查看、编辑、删除 |

### 4.4 异常记录与异常数据源展示（对应 REQUIREMENTS §9.4）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-044 | PASS | DSUB-REQ-042 | 订阅引用的源库已停用 | 进入列表页观察该行源库 | 显示 `DATA_SOURCE_ORG` 并标记“已停用” |
| DSUB-AC-045 | PASS | DSUB-REQ-042 | 订阅引用的源库不存在 | 进入列表页观察该行源库 | 显示原始 `DATA_SOURCE_ID` 并标记“不存在” |
| DSUB-AC-046 | PASS | DSUB-REQ-042 | 订阅引用的目标库已停用或不存在 | 进入列表页观察该行目标库 | 对应目标库标记“已停用”或“不存在” |
| DSUB-AC-047 | PASS | DSUB-REQ-043 | 数据库存在多源库异常记录 | 进入列表页 | 该行整行使用警示色并显示明确异常提示 |
| DSUB-AC-048 | PASS | DSUB-REQ-042, DSUB-REQ-094 | 订阅引用的源库或目标库已停用或不存在，且该记录为正常单源库记录 | 对该记录执行查看、编辑、删除 | 该记录仍显示查看、编辑、删除入口；查看可正常打开并展示异常标记；编辑可打开并回显原值及异常状态，但若源库或目标库已停用或不存在、未替换或修复异常数据源时禁止编辑保存；删除仍按既定物理删除和二次确认规则执行，不做并发保护。 |

### 4.5 查看详情（对应 REQUIREMENTS §10）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-049 | PASS | DSUB-REQ-044 | 主列表存在正常记录 | 点击该行“查看” | 打开居中只读弹窗，展示订阅详情 |
| DSUB-AC-050 | PASS | DSUB-REQ-045 | 打开详情弹窗 | 观察网络请求与后端日志 | 查看详情不连接源 Oracle，只读取已保存配置和数据源映射 |
| DSUB-AC-051 | PASS | DSUB-REQ-046 | 数据库存在多源库异常记录 | 尝试在该行寻找“查看”入口 | 该行不提供查看入口 |
| DSUB-AC-052 | PASS | DSUB-REQ-047 | 打开正常记录详情 | 观察详情内容 | 显示订阅描述、订阅 ID、源库机构名称和数据源 ID、源表总数、按 Schema 分组的表清单、各目标库机构名称和数据源 ID、创建时间、更新时间 |
| DSUB-AC-053 | PASS | DSUB-REQ-048 | 订阅引用的数据源已停用或不存在，或字段格式异常 | 打开详情弹窗 | 详情显示数据源已停用、不存在、字段格式异常等警告 |
| DSUB-AC-054 | PASS | DSUB-REQ-049 | 详情弹窗源表清单较长 | 滚动源表清单区域 | 源表清单区域限高并内部滚动，弹窗不无限增高 |
| DSUB-AC-055 | PASS | DSUB-REQ-050 | `DATA_SOURCE_TABLE` 含无法解析的内容（如组件内部额外英文句点造成无法可靠解析），同时含正常三段格式的项 | 打开详情弹窗 | 正常三段格式（`DATA_SOURCE_ID.Schema.表名`，含两个结构句点）不被误判为异常并可正常解析展示；无法解析的项单独展示原始异常内容和警告，不静默丢弃 |
| DSUB-AC-056 | PASS | DSUB-REQ-051 | 打开详情弹窗 | 观察字段 | 不展示 `DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT` |

### 4.6 新增/编辑弹窗交互与源库搜索（对应 REQUIREMENTS §11.1、§11.2、§11.3）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-057 | PASS | DSUB-REQ-052 | 已进入数据订阅页面 | 点击“新增”或“编辑” | 打开同一近全屏大尺寸居中弹窗与选表组件；不使用抽屉、新页面或新标签页 |
| DSUB-AC-058 | PASS | DSUB-REQ-053 | 打开新增/编辑弹窗 | 观察弹窗尺寸 | 弹窗尺寸为最终批准实现事实：桌面默认宽度 `1280px`，宽度上限 `calc(100vw - 64px)`，小屏宽度退化为 `calc(100vw - 32px)`；高度 `82vh`，受 `calc(100vh - 48px)` 约束；弹窗不得超出浏览器可视区域；标题栏与底部按钮固定，中间内容区使用剩余高度并滚动 |
| DSUB-AC-059 | PASS | DSUB-REQ-055 | 打开新增/编辑弹窗 | 拖动标题栏、表单区、表格区；缩放浏览器；关闭后重开 | 仅标题栏可拖动，表单/表格区域不触发拖动；不得拖出浏览器可视区域；首期不支持手动缩放；关闭后不记忆位置；每次打开默认居中 |
| DSUB-AC-060 | PASS | DSUB-REQ-056 | 编辑弹窗存在未保存修改 | 关闭或取消弹窗 | 二次确认是否放弃修改；确认后放弃，取消则保留编辑状态 |
| DSUB-AC-061 | PASS | DSUB-REQ-057 | 打开新增弹窗 | 订阅描述留空、未选源库、未选源表或未选目标库并点击保存 | 保存被阻止；提示满足必填：订阅描述非空、恰好一个源库、至少一张源表、至少一个目标库；订阅描述使用单行输入框、不使用 textarea、最大 255 字符 |
| DSUB-AC-062 | PASS | DSUB-REQ-058 | 打开新增弹窗 | 观察源库选择控件 | 源库为可搜索单选下拉框，不把约 50～100 个候选平铺成卡片 |
| DSUB-AC-063 | PASS | DSUB-REQ-059 | 打开新增弹窗展开源库下拉 | 观察候选项；对照 ID 含英文逗号或句点的候选 | 候选仅含 `FG_ACTIVE=1` 且类别匹配的源库；显示以 `DATA_SOURCE_ORG` 为主、`DATA_SOURCE_ID` 为辅；ID 含英文逗号或句点的候选显示为禁用项并标注“名称含协议保留字符，不能用于订阅配置”，不静默隐藏 |
| DSUB-AC-064 | PASS | DSUB-REQ-060 | 源库下拉含 ID 完全匹配/前缀匹配/模糊包含的记录 | 输入源库 ID 的完全值、前缀与子串 | 结果依次按“ID 完全匹配 > ID 前缀匹配 > ID 模糊包含 > ORG 模糊包含”排序 |
| DSUB-AC-065 | PASS | DSUB-REQ-061 | 源库下拉含记录 | 输入与库中大小写不一致的 ID、带首尾空格的输入、无匹配输入 | ID 搜索不区分大小写；输入自动去除首尾空格；高亮命中文字；无结果时显示“未找到匹配的源库” |
| DSUB-AC-066 | PASS | DSUB-REQ-061 | 源库下拉搜索框为空 | 观察候选项 | 显示全部启用源库 |
| DSUB-AC-067 | PASS | DSUB-REQ-062 | 源库下拉含记录 | 选中一个源库 | 使用明显的蓝色选中状态、勾选标记和“已选择”提示 |
| DSUB-AC-068 | PASS | DSUB-REQ-063 | 已选择源表后更改源库 | 选择新的源库 | 弹窗二次确认；确认后清空 Schema 缓存和全部已选表 |
| DSUB-AC-069 | PASS | DSUB-REQ-054 | 打开新增/编辑弹窗 | 观察弹窗布局 | 标题栏和底部按钮固定，中间内容区使用剩余高度；桌面下源库与目标库处于同一行，小屏空间不足时整组换行；源库标签、源库选择框、目标库标签与目标库卡片按同一水平中轴垂直居中；源表选择区获得中间区域主要空间；Schema 区约 `240~260px`，普通表区使用剩余宽度 |
| DSUB-AC-070 | PASS | DSUB-REQ-053, DSUB-REQ-055 | 弹窗尺寸超出浏览器可视范围 | 观察 | 弹窗受浏览器可视范围约束，不超出可视区域 |

### 4.7 目标库选择（对应 REQUIREMENTS §11.4）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-071 | PASS | DSUB-REQ-064 | 打开新增弹窗 | 展开目标库选择区；对照 ID 含英文逗号或句点的候选 | 候选仅含 `FG_ACTIVE=1` 且类别匹配的目标库；多选，至少选择一个；ID 含英文逗号或句点的候选显示为禁用项并标注“名称含协议保留字符，不能用于订阅配置”，不静默隐藏（目标库 ID 虽不参与三段拼接，同样禁止句点） |
| DSUB-AC-072 | PASS | DSUB-REQ-065 | 目标库候选约 5 个 | 观察目标库选择区 | 全部以紧凑复选卡片平铺展示，卡片约 `200×48px`（允许在不破坏布局的合理范围微调）、两行紧凑显示（第一行机构名称、第二行数据源 ID），左侧复选框为唯一勾选控件，长 ID 单行省略并可悬停查看完整值；常见 3 个目标库在 1K、2K 下保持同一行；最多 5 个、空间确实不足时才换行；无需“查看更多”、独立搜索、右侧重复对勾或折叠 |
| DSUB-AC-073 | PASS | DSUB-REQ-066 | 选择目标库 | 选中一个目标库卡片 | 卡片选中态保持白色主体、主题蓝边框、左侧主题蓝复选框与克制的淡蓝灰轻阴影，不使用大面积浅蓝或蓝色渐变背景；同时显示机构名称和 ID 两行；未选中态为白色主体、浅灰边框、极轻阴影；悬停态保持白色主体、浅主题蓝边框与轻阴影；禁用态为浅灰背景、灰色文字、不可选择并展示原因；不使用绿色、红色、黄色等健康/告警语义色 |
| DSUB-AC-074 | PASS | DSUB-REQ-064 | 已选 3 个目标库 | 观察已选状态 | 三个目标库均保持选中状态，保存后写入逗号分隔的目标库 ID |

### 4.8 Schema 与表选择（对应 REQUIREMENTS §11.5、§11.6、§11.7）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-075 | PASS | DSUB-REQ-067 | 新增弹窗已选择源库 | 观察 Schema 加载 | Schema 和表清单由 `cdc-config` 后端直接连接所选源库读取；日志与响应不泄露数据库口令或完整连接串 |
| DSUB-AC-076 | PASS | DSUB-REQ-068 | 新增弹窗已选择源库 | 观察目标库加载 | 目标库只选择，不在本流程中连接 |
| DSUB-AC-077 | PASS | DSUB-REQ-069 | 源库含系统 Schema、空 Schema、视图、物化视图、同义词，或含名称含英文逗号/组件内部英文句点的对象 | 观察 Schema 列表与表列表 | 只展示当前账号可访问且包含普通表的非系统 Schema；不展示空 Schema、系统 Schema、视图、物化视图或同义词；Schema 或表名含英文逗号或组件内部英文句点的对象显示为不可选择并明确说明原因（协议保留字符），不静默隐藏 |
| DSUB-AC-078 | PASS | DSUB-REQ-070 | 新增弹窗已选择源库 | 点击一个 Schema，再切到另一个 Schema，再切回 | 点击 Schema 时首次加载其普通表并在本次弹窗会话内缓存；切换回时复用缓存，不重复查询 |
| DSUB-AC-079 | PASS | DSUB-REQ-070 | Schema 加载失败 | 观察错误与重试入口 | 显示明确错误并提供“重试加载” |
| DSUB-AC-080 | PASS | DSUB-REQ-071 | 新增弹窗已加载 Schema 与表 | 观察布局 | 左侧为 Schema 列表，右侧为当前 Schema 的普通表表格；不存在独立的“已选源表”右侧面板；用户在中间表格中选表和取消选表 |
| DSUB-AC-081 | PASS | DSUB-REQ-072 | 当前 Schema 表较多 | 输入表名字符串（含大小写不一致） | 当前 Schema 表名支持不区分大小写的模糊搜索 |
| DSUB-AC-082 | PASS | DSUB-REQ-073 | 当前 Schema 当前搜索结果含多张表 | 执行“全选当前搜索结果”“取消当前搜索结果选择”“只看已选”“清空当前 Schema”；并执行 Shift 连选 | 各操作按预期生效；清空当前 Schema 前二次确认。Shift 连选：普通点击一张可选表切换状态并记录该表为起点及点击后的目标状态；按住 Shift 点击另一张当前可见可选表，按当前页面可见顺序将起点与终点之间（含首尾）的可选表统一设为起点记录的目标状态（起点选中则范围全部选中，起点取消则范围全部取消）；连续 Shift 点击不同终点时起点不移动，下一次普通点击才更新起点；仅作用于当前 Schema 当前可见结果，搜索后只作用于当前搜索结果，“只看已选”后按当前可见结果计算；保留字符禁选表和 disabled 表跳过；无有效起点或起点已不可见时 Shift 点击退化为普通单表点击并建立新起点；切换 Schema、切换源库、改变搜索、切换只看已选、表清单重载/重试、执行全选/取消筛选/清空 Schema 后清除起点；一次范围操作只生成一次选中集合并只触发一次状态提交、不逐表发请求；120~240 张表场景下无明显卡顿 |
| DSUB-AC-083 | PASS | DSUB-REQ-074 | 已在 Schema A 勾选若干表 | 切到 Schema B 后再切回 A，或改变搜索条件 | 全部已选表保留，不丢失 |
| DSUB-AC-084 | PASS | DSUB-REQ-075 | 当前 Schema 含已选表 | 观察表格行样式 | 已选表通过复选框勾选和整行浅蓝背景突出；不存在重复的“选择状态”列 |
| DSUB-AC-085 | PASS | DSUB-REQ-076 | 当前 Schema 表较多 | 滚动表格、观察表头 | 表头固定，内容区内部滚动；无明显卡顿（建议虚拟滚动） |
| DSUB-AC-086 | PASS | DSUB-REQ-077 | 源库含约 120～240 张可选表（1～2 个 Schema，每 Schema 约 120 张） | 完成选择 | 支持典型规模约 120～240 张表的选择；无明显卡顿、弹窗不无限增高 |
| DSUB-AC-087 | PASS | DSUB-REQ-078, DSUB-REQ-079 | 已选 1 个源库、2 个 Schema、若干表、2 个目标库 | 观察汇总区与 Schema 徽标 | 汇总显示“已选择：1 个源库 · 2 个 Schema · N 个表 · 2 个目标库”（Schema 数只统计至少选中一张表的 Schema）；左侧每个 Schema 显示“已选 N 张”；中间当前 Schema 显示“共 N 张，已选 N 张” |
| DSUB-AC-088 | PASS | DSUB-REQ-080 | 已选约 240 张表 | 观察弹窗 | 不产生大量标签、弹窗无限增高或明显卡顿 |

### 4.9 新增保存规则（对应 REQUIREMENTS §12）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-089 | PASS | DSUB-REQ-081 | 新增订阅 | 触发基础必填或格式校验错误 | 前后端均做基础必填和格式校验，最终以后端校验结果为准 |
| DSUB-AC-090 | PASS | DSUB-REQ-082 | 新增订阅，所选的源库或目标库已被停用或删除 | 保存 | 后端重新校验：源库、目标库仍存在、启用且类别正确；不满足则拒绝保存 |
| DSUB-AC-091 | PASS | DSUB-REQ-083 | 新增订阅，源表已被删除、格式错误、名称含英文逗号或组件内部英文句点、重复；或绕过前端直接向后端提交含保留字符的组件 | 保存 | 后端重新校验：Schema 和表仍存在且账号可访问、表标识格式正确且属于所选源库、名称不包含英文逗号、也不包含组件内部英文句点、单条记录内无重复表标识或重复目标库 ID；不满足则拒绝保存并列出失效项 |
| DSUB-AC-092 | PASS | DSUB-REQ-084 | 新增约 240 张表 | 观察保存过程中的数据库访问与查询 | 有效性校验使用一次源库连接并按 Schema 批量查询，不逐表建立连接、不产生约 240 次查询 |
| DSUB-AC-093 | PASS | DSUB-REQ-085 | 新增订阅含失效项 | 保存 | 拒绝保存，并一次性列出具体失效的数据源或表；修正后重试可成功 |
| DSUB-AC-094 | PASS | DSUB-REQ-086 | 保存请求处理中 | 快速重复点击保存 | 保存按钮进入加载状态并禁用，无法重复提交 |
| DSUB-AC-095 | PASS | DSUB-REQ-087 | 新增成功 | 观察保存后行为 | 关闭弹窗、刷新列表、提示成功和重启生效说明 |
| DSUB-AC-096 | PASS | DSUB-REQ-084 | 源表选择约 240 张 | 观察接口请求 | 后端按 Schema 批量校验，验证性能满足需求（一次连接、按 Schema 批量） |

### 4.10 编辑规则（对应 REQUIREMENTS §13）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-097 | PASS | DSUB-REQ-088 | 编辑一条已有记录 | 打开编辑弹窗 | 与新增使用同一界面；自动回显描述、源库、目标库、全部 Schema 和源表选择 |
| DSUB-AC-098 | PASS | DSUB-REQ-089 | 原记录涉及多个 Schema | 打开编辑弹窗 | 自动加载全部已选 Schema，恢复表格勾选和浅蓝背景；左侧 Schema 数量、当前 Schema 数量和总汇总准确 |
| DSUB-AC-099 | PASS | DSUB-REQ-090 | 编辑弹窗已回显源表 | 更换源库 | 二次确认；确认后清空原 Schema 和全部源表选择 |
| DSUB-AC-100 | PASS | DSUB-REQ-091 | 原选择的表已被删除或不可访问 | 打开编辑弹窗 | 显示“异常已选表”警告，不静默取消 |
| DSUB-AC-101 | PASS | DSUB-REQ-092 | 编辑时修改了源库或源表 | 保存 | 必须成功连接源 Oracle 并完成保存前有效性校验 |
| DSUB-AC-102 | PASS | DSUB-REQ-093 | 源 Oracle 暂时无法连接，且源库与 `DATA_SOURCE_TABLE` 完全未变 | 修改订阅描述或目标库并保存 | 允许保存；页面明确说明当前使用已保存源表配置，未完成源库实时校验 |
| DSUB-AC-103 | PASS | DSUB-REQ-093 | 源 Oracle 暂时无法连接 | 尝试新增、删除或更换源表，或更换源库 | 不允许保存；页面阻止此类修改 |
| DSUB-AC-104 | PASS | DSUB-REQ-094 | 原订阅引用的源库或目标库已停用或不存在，或原记录含保留字符的无效配置 | 打开编辑弹窗并保存 | 回显原值（含保留字符的异常项）并标记异常；保存前必须替换或修复异常数据源或含保留字符的无效配置，不得原样保存或强制保存 |
| DSUB-AC-105 | PASS | DSUB-REQ-095 | 数据库存在多源库异常记录 | 尝试编辑该记录 | 该行不提供编辑入口 |
| DSUB-AC-106 | PASS | DSUB-REQ-096 | 编辑并保存成功 | 检查字段 | `DATA_SUB_ID`、`INSERT_TIME` 保持不变；`UPDATE_TIME` 更新为数据库当前时间；遗留字段保持原值 |

### 4.11 无并发保护边界（对应 REQUIREMENTS §14）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-107 | PASS | DSUB-REQ-097 | 打开编辑弹窗 | 观察请求 | 编辑打开响应中不包含 `versionToken`、内容指纹或等效快照字段；编辑保存请求也不携带此类字段 |
| DSUB-AC-108 | PASS | DSUB-REQ-098 | 编辑弹窗打开期间记录被他人或人工修改 | 由原页面保存 | 系统不执行并发比较、不返回并发冲突，按普通保存规则处理，最后一次成功写入的内容生效 |
| DSUB-AC-109 | PASS | DSUB-REQ-099 | 人工直接修改数据库但未同步 `UPDATE_TIME` | 打开编辑并保存 | 系统不使用 `UPDATE_TIME` 或其他字段判断并发，正常按普通保存规则处理 |
| DSUB-AC-110 | PASS | DSUB-REQ-098 | 保存过程中记录已被他人或人工修改 | 观察保存接口与页面 | 保存接口和页面不存在 `40910 CONCURRENT_MODIFIED`、“记录已被修改”或“刷新后重新编辑”等并发处理流程 |

### 4.12 删除规则（对应 REQUIREMENTS §15）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-111 | PASS | DSUB-REQ-100 | 数据库存在多源库异常记录 | 尝试在该行寻找“删除”入口 | 该行不提供删除入口 |
| DSUB-AC-112 | PASS | DSUB-REQ-100, DSUB-REQ-101 | 存在正常单源库记录 | 点击“删除”并确认 | 按 `DATA_SUB_ID` 主键执行物理删除 |
| DSUB-AC-113 | PASS | DSUB-REQ-102 | 点击正常记录“删除” | 观察二次确认内容 | 展示订阅描述、源库、Schema 数、源表数量、目标库、“数据库记录物理删除且无法恢复”提示、“当前运行中的同步任务不会立即停止，需要重启相关 sync-client 后生效”说明 |
| DSUB-AC-114 | PASS | DSUB-REQ-103 | 删除确认前记录被人工或其他页面修改 | 确认删除 | 删除预览/确认请求不返回、不携带版本令牌；预览后记录被修改时，用户确认仍按 `DATA_SUB_ID` 直接物理删除，不执行并发比较 |
| DSUB-AC-115 | PASS | DSUB-REQ-104 | 删除一个已不存在的记录 | 发起删除 | 提示“记录不存在或已被删除” |
| DSUB-AC-116 | PASS | DSUB-REQ-105 | 删除成功 | 观察删除后行为 | 刷新列表，并提示重启 `sync-client` 后生效 |
| DSUB-AC-117 | PASS | DSUB-REQ-102 | 删除确认二次确认未通过 | 取消删除 | 不执行删除，记录保持不变 |

### 4.13 通用交互、安全与延期项（对应 REQUIREMENTS §16、§17）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作/输入 | 预期结果 |
|---|---|---|---|---|---|
| DSUB-AC-118 | PASS | DSUB-REQ-106 | 查询、保存、删除或加载 Schema/表请求处理中 | 快速重复点击对应按钮 | 请求处理中对应按钮禁用，无法重复提交 |
| DSUB-AC-119 | PASS | DSUB-REQ-106 | 后端接口返回异常 | 观察页面提示与日志 | 返回清晰、可展示、脱敏的业务提示；不暴露原始堆栈、数据库口令或完整连接串 |
| DSUB-AC-120 | PASS | DSUB-REQ-002, DSUB-REQ-004 | 完成一次订阅新增/编辑/删除 | 检查后端日志与外部系统调用 | 全程不操作 ZooKeeper、不操作 Kafka、不启停业务进程 |
| DSUB-AC-121 | PASS | DSUB-REQ-107 | 大屏存在按换行符解析 `DATA_SOURCE_TABLE` 的实现 | 检查大屏相关代码基线 | 本 Feature 实现阶段未修改大屏代码或大屏基线；延期状态记录为 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` |
| DSUB-AC-122 | PASS | DSUB-REQ-107 | 数据订阅 Feature 尚未正式验收 | 检查本 Feature 验收状态 | 大屏修正延期不成为本 Feature 的验收阻断项 |
| DSUB-AC-123 | PASS | DSUB-REQ-007 | 本 Feature 交付后 | 检查数据库物理基线 | `CDC_DATA_SUBSCRIBE.DATA_SUB_ID` 主键物理基线已定向修正为真实主键（`DATABASE_VERIFIED`） |
| DSUB-AC-124 | PASS | DSUB-REQ-020, DSUB-REQ-021 | 检查新增与删除实现 | 检查后端写入逻辑 | 新增固定写入 `FG_ACTIVE=1`；删除为按主键物理删除，无 `FG_ACTIVE` 更新为 `0` 的路径 |
| DSUB-AC-125 | PASS | DSUB-REQ-004 | 检查本 Feature 首期实现 | 检查后端与页面能力 | 不提供通知/重启 `sync-client`、ZooKeeper、Kafka Topic、运行态生效判断、任务启停等能力 |
| DSUB-AC-126 | PASS | DSUB-REQ-001 | 本 Feature 交付后 | 综合验证端到端 | 通过页面维护 `CDC_DATA_SUBSCRIBE` 实现“一个源库 × 一组源表 × 一个或多个目标库”的订阅配置，供 `sync-client` 启动时读取建立同步任务 |

## 5. 需求追踪完整性说明

- 本验收基线共 **126** 条用例（`DSUB-AC-001 ~ DSUB-AC-126`），映射 `REQUIREMENTS.md` 中 **107** 条需求（`DSUB-REQ-001 ~ DSUB-REQ-107`）。
- 覆盖校验：每条需求至少被一条验收用例引用；强制覆盖清单（§16.2）中全部场景均已有对应用例（只显示 `FG_ACTIVE=1` → DSUB-AC-017；查询多选 OR/AND → DSUB-AC-033~037；含逗号候选历史兼容可能匹配与歧义警告 → DSUB-AC-032~035；多源库异常行无操作 → DSUB-AC-009/010；停用与不存在数据源展示 → DSUB-AC-044~046；详情按 Schema 分组 → DSUB-AC-052；源库搜索排序 → DSUB-AC-064；目标库约 5 个平铺多选 → DSUB-AC-072；Schema 懒加载与缓存 → DSUB-AC-078；120~240 张表选择与状态保持 → DSUB-AC-083/086；无右侧“已选源表”面板 → DSUB-AC-080；汇总数量与 Schema 徽标 → DSUB-AC-087；弹窗拖动边界 → DSUB-AC-059/070；表名大小写与英文逗号/组件内部句点协议 → DSUB-AC-013/014、DSUB-AC-055、DSUB-AC-091；跨行重复订阅允许 → DSUB-AC-016；新增固定 `FG_ACTIVE=1` → DSUB-AC-018；编辑断连有限修改 → DSUB-AC-102/103；失效项拒绝保存 → DSUB-AC-090~093；无并发保护边界（编辑/删除不比较、不拒绝覆盖、直接按主键更新/物理删除、最后一次成功写入生效）→ DSUB-AC-107~110、DSUB-AC-114；物理删除与不可恢复提示 → DSUB-AC-112/113；重启 `sync-client` 后生效 → DSUB-AC-004/005/095；不操作 Kafka/ZooKeeper/进程 → DSUB-AC-120/125；大屏修正延期且不阻断 → DSUB-AC-121/122）。
- 正式验收前 UI 基线对齐映射：DSUB-AC-058 对应 DSUB-REQ-053（最终弹窗尺寸）；DSUB-AC-061 对应 DSUB-REQ-057（描述单行必填最大 255）；DSUB-AC-069 对应 DSUB-REQ-054（空间优先级与顶部布局）；DSUB-AC-072/073 对应 DSUB-REQ-065/066（紧凑两行卡片与白色主体四态）；DSUB-AC-082 对应扩展后的 DSUB-REQ-073（含 Shift 连选）。
- 执行汇总（R1 补验）：`DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1` 在真实浏览器补验基础上逐条复核 126 条用例全部保持 `PASS`（0 `FAIL`/0 `BLOCKED`）。逐条最终状态、实际执行方式与具体证据路径见 `evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1/coverage-matrix-r1.md`（取代原 `coverage-matrix.md` 证据标注并纠正不准确的 `BR` 声明）；浏览器场景见 `evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1/browser/browser-scenario-index.md`。

## 6. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-30 | 建立“数据订阅”Feature 验收基线草案（`DRAFT_PENDING_USER_REVIEW`；实现状态 `NOT_STARTED`；全部 126 条用例 `NOT_RUN`） | DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001（纯文档任务；待用户复审与批准） |
| 2026-08-30 | R1 定向修订（ChatGPT 正式复审 `CHANGES_REQUIRED`）：`DSUB-AC-037` 移除“（或按批准交互保持已查询结果）”候选语义，重置行为唯一确定（保持上一次已生效的查询结果，不自动重新查询、不自动恢复全部记录）；`DSUB-AC-048` 明确异常数据源记录的查看/编辑打开/编辑保存限制与删除边界，避免与 `DSUB-REQ-094` 冲突；`DSUB-AC-085` 修正“无明显的明显卡顿”重复文案；文档状态保持 `DRAFT_PENDING_USER_REVIEW`，全部 126 条用例仍 `NOT_RUN`，未批准、未实现、未执行验收 | DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001-R1（纯文档定向修订；不改变编号、数量与状态） |
| 2026-08-30 | 验收标准基线正式批准收口：文档状态由 `DRAFT_PENDING_USER_REVIEW` 转为 `APPROVED`；批准依据为提交 `b9fb1e955492bef905b3c33acbf9d617bb5a0857` 的 ChatGPT 正式复审结论 `APPROVED`；本次批准的是验收标准基线，不代表功能已实现或验收已通过；126 条用例（`DSUB-AC-001` ~ `DSUB-AC-126`）编号、数量、步骤、前置条件、预期结果与需求映射不变，状态全部保持 `NOT_RUN`；功能实现状态仍为 `NOT_STARTED`；下一阶段为设计基线建立 | DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-APPROVAL-001（项目负责人批准驱动的需求与验收基线正式收口；纯文档任务） |
| 2026-08-30 | 点号保留分隔符验收覆盖调整草案：项目负责人明确第一版把英文句点 `.` 定义为三段结构保留分隔符；在不增加编号的前提下定向扩展既有验收项——`DSUB-AC-013`（两个结构句点为正常保留分隔符，大小写规则不变）、`DSUB-AC-014`（从名称含英文逗号扩展为分别验证英文逗号与组件内部英文句点）、`DSUB-AC-032`（查询候选仍能选择协议不兼容的存量数据源以查询历史记录）、`DSUB-AC-063`/`DSUB-AC-071`（新增/编辑候选中协议不兼容数据源显示但禁用并说明原因）、`DSUB-AC-077`（Schema/表名含英文逗号或组件内部句点不可选择并说明原因）、`DSUB-AC-091`（绕过前端提交含保留字符组件时后端拒绝并列出失效项）、`DSUB-AC-055`（正常结构分隔点不误判为异常；组件内部点号造成不可解析时保留原始内容并警告）、`DSUB-AC-104`（编辑回显异常项，修复前禁止保存；删除规则保持不变）；编号保持 126 条连续唯一，全部仍为 `NOT_RUN`；文档状态由 `APPROVED` 转为 `DRAFT_PENDING_USER_REVIEW`（上一正式批准版本提交 `d7560445be1504e6ed9957fa7b31be1fd393ea19`，历史批准事实保留）；实现状态仍为 `NOT_STARTED`；本调整草案待正式复审 | DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-001（项目负责人决策驱动的纯文档需求/验收定向调整草案） |
| 2026-08-30 | 点号保留分隔符验收标准批准收口：ChatGPT 对提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a` 正式复审结论 `APPROVED`；当前验收标准版本由调整草案收口为 `APPROVED`；126 条用例（`DSUB-AC-001` ~ `DSUB-AC-126`）编号、需求映射、步骤、前置条件、预期结果不变，状态全部保持 `NOT_RUN`；实现状态仍为 `NOT_STARTED`；设计仍为 `DRAFT_PENDING_USER_REVIEW` 草案且设计复审仍为 `CHANGES_REQUIRED`，待设计 R1 修订和重新复审；本次批准只批准点号需求对应验收标准，不批准设计、不实现功能、不执行验收 | DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-APPROVAL-001（项目负责人批准驱动的纯文档需求/验收调整批准收口） |
| 2026-08-30 | 含逗号数据源 ID 查询兼容验收标准调整草案：正式复审发现无转义英文逗号分隔协议无法精确识别含逗号 ID；在不增加编号的前提下定向调整 `DSUB-AC-032`（候选仅含启用且类别匹配数据源、含逗号/句点 ID 不静默移除、仅含句点候选保持普通可选、含逗号候选可选但显示明确歧义警告）、`DSUB-AC-033`/`DSUB-AC-034`（源库组/目标库组分别覆盖：两个普通 ID 之间 OR、token 去首尾空白后精确匹配、`S01` 不误匹配 `S012`、`%`/`_` 按字面值处理、仅含句点 ID 可精确匹配、选择含逗号候选时返回可能匹配集合并显示歧义警告、验收承认 `A,B` 歧义无法从当前物理字段消除）、`DSUB-AC-035`（组间 AND 不变、任一组含逗号候选仍按 AND 执行、页面持续展示歧义警告），并增加紧邻“查询歧义补充说明”；编号保持 126 条连续唯一，全部仍为 `NOT_RUN`；文档状态与依据需求状态由 `APPROVED` 转为 `DRAFT_PENDING_USER_REVIEW`（上一正式批准版本为点号保留分隔符批准版本，批准依据提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a`，历史批准事实保留）；实现状态仍为 `NOT_STARTED`；本调整草案待正式复审 | DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-001（正式复审发现驱动的纯文档需求/验收定向调整草案） |
| 2026-08-30 | 含逗号数据源 ID 查询兼容验收标准批准收口：ChatGPT 对提交 `5d5b5f4606da14f160e9db43068f114d35501db8` 正式复审结论 `APPROVED`；当前验收标准版本由调整草案收口为 `APPROVED`；126 条用例（`DSUB-AC-001` ~ `DSUB-AC-126`）编号、需求映射、步骤、前置条件、预期结果不变，`DSUB-AC-032~035` 及紧邻“查询歧义补充说明”逐字保持，状态全部保持 `NOT_RUN`；本次批准的是含逗号查询调整对应的验收标准，未批准设计、未实现功能、未执行验收；实现状态仍为 `NOT_STARTED`；设计（DESIGN/API/UI/DATABASE）仍为 `DRAFT_PENDING_USER_REVIEW` 草案且设计复审仍为 `CHANGES_REQUIRED`，下一阶段为设计 R2 定向修订 | DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001（项目负责人批准驱动的纯文档需求/验收调整批准收口） |
| 2026-08-31 | 取消并发保护验收标准调整草案：项目负责人明确“数据订阅页面的新增、编辑、删除完全不处理并发操作，不考虑其他页面用户或人工直接修改数据库造成的并发冲突”；定向调整 `DSUB-AC-107`（编辑打开响应不包含 `versionToken`、内容指纹或等效快照字段，保存请求不携带此类字段）、`DSUB-AC-108`（编辑打开后记录被他人或人工修改，原页面保存时系统不执行并发比较、不返回并发冲突、按普通保存规则处理、最后一次成功写入生效）、`DSUB-AC-109`（人工修改未同步 `UPDATE_TIME` 时系统不使用 `UPDATE_TIME` 或其他字段判断并发、正常按普通保存处理）、`DSUB-AC-110`（保存接口和页面不存在 `40910 CONCURRENT_MODIFIED`、“记录已被修改”或“刷新后重新编辑”等并发处理流程）、`DSUB-AC-114`（删除预览/确认请求不返回、不携带版本令牌，预览后记录被修改时确认仍按 `DATA_SUB_ID` 直接物理删除、不执行并发比较）、`DSUB-AC-117`（取消二次确认时不执行删除，关联需求由 `DSUB-REQ-102, DSUB-REQ-103` 修正为仅 `DSUB-REQ-102`，不再依赖旧版并发语义）；§4.11 标题由“并发保护”改为“无并发保护边界”，§3 分类表同步；§5 需求追踪完整性说明删除“并发编辑与并发删除”旧覆盖描述、改为“无并发保护边界”由 `DSUB-AC-107~110/114` 覆盖；验收编号保持 126 条连续唯一，状态全部仍为 `NOT_RUN`；文档状态与依据需求状态由 `APPROVED` 转为 `DRAFT_PENDING_USER_REVIEW`（上一正式批准版本为含逗号查询验收批准版本，批准依据提交 `5d5b5f4606da14f160e9db43068f114d35501db8`，历史批准事实保留）；实现状态仍为 `NOT_STARTED`；设计仍为 `DRAFT_PENDING_USER_REVIEW` 草案且设计复审仍为 `CHANGES_REQUIRED`，因本需求决策，设计 R3 将整体删除指纹/令牌/行锁方案；本调整草案待正式复审 | DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001（项目负责人决策驱动的纯文档需求/验收定向调整草案） |
| 2026-08-31 | 取消并发保护验收标准 R1 定向修订（ChatGPT 对提交 `27a27e3de22cf2ea03c378bf6d39f58549c0c6fa` 正式复审结论 `CHANGES_REQUIRED`）：仅修正 `DSUB-AC-048` 结尾“删除仍按既定物理删除、二次确认和并发保护规则执行”的并发保护残留，改为“删除仍按既定物理删除和二次确认规则执行，不做并发保护”，该行的编号、状态、关联需求、前置条件、查看行为和编辑行为全部保持不变；相对 R1 基准 `27a27e3...` 仅 `DSUB-AC-048` 一条验收业务行变化，`DSUB-AC-107/108/109/110/114/117` 相对 `27a27e3...` 零变化；相对原始设计 R2 基准 `026417e7...`，本轮“取消并发保护”调整累计承载的验收业务行为 7 条（`DSUB-AC-048/107/108/109/110/114/117`），其余 119 条验收业务行保持不变；验收编号保持 126 条连续唯一，状态全部仍为 `NOT_RUN`；文档状态与依据需求状态继续为 `DRAFT_PENDING_USER_REVIEW`；需求未修改，设计未修改，实现未开始，验收未执行；当前仍待 ChatGPT 重新正式复审 | DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1（ChatGPT 复审 CHANGES_REQUIRED 驱动的纯文档定向修订） |
| 2026-08-31 | 取消并发保护验收标准批准收口：ChatGPT 对 R1 结果提交 `43a909773aec63fe8c4de2957074f113910f4686` 正式复审结论 `APPROVED`；当前验收标准版本由“取消并发保护”验收标准调整草案收口为 `APPROVED`；126 条用例（`DSUB-AC-001` ~ `DSUB-AC-126`）编号、需求映射、步骤、前置条件、预期结果相对复审提交零变化，`DSUB-AC-048/107/108/109/110/114/117` 逐字保持，状态全部保持 `NOT_RUN`；批准验收标准不等于验收已执行或通过；设计未批准（仍为 `DRAFT_PENDING_USER_REVIEW` 草案且设计复审仍为 `CHANGES_REQUIRED`），功能未实现（实现状态仍为 `NOT_STARTED`）；下一阶段为设计 R3 | DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001（项目负责人批准驱动的纯文档需求/验收调整批准收口） |
| 2026-09-01 | 正式验收前 UI 交互基线对齐草案：在既有后端实现及真实数据库集成验证、前端 R3 代码与视觉、R3-R1 报告元数据收口均已获 ChatGPT 正式批准的前提下，把已确认、已实现、已复审通过的最终交互事实同步为待正式复审的文档草案，解决三个确定冲突——(1) 弹窗尺寸由 `94vw × 92vh` 对齐为桌面默认宽 `1280px`、高 `82vh` 及视口约束（`DSUB-AC-058`）；(2) 目标库选中卡片由“浅蓝背景”对齐为白色主体 + 主题蓝边框 + 左侧蓝复选框 + 克制轻阴影四态（`DSUB-AC-073`）；(3) 将 R2 已实现并复审通过的 Shift 连续范围选择写入 `DSUB-AC-082` 与 §7.6；另补充 `DSUB-AC-061`（描述单行无 textarea 最大 255）、`DSUB-AC-069`（桌面源库/目标库同行、统一水平中轴、源表区占主要空间、Schema 区 240~260px）、`DSUB-AC-072`（紧凑两行卡片、唯一左侧复选框、3 卡同排、最多 5 个）；§5 追踪说明同步对应关系；文档状态由 `APPROVED` 转为 `DRAFT_PENDING_USER_REVIEW`（上一正式批准验收标准版本批准依据提交 `43a909773aec63fe8c4de2957074f113910f4686`，历史批准事实保留）；实现状态更新为 `IMPLEMENTED_REVIEW_APPROVED_PENDING_FORMAL_ACCEPTANCE`（代码已实现并复审通过，待正式验收，非 `IMPLEMENTED_ACCEPTED`）；验收编号保持 126 条连续唯一，状态全部仍 `NOT_RUN`；本草案待 ChatGPT 正式复审，不代表正式验收通过 | DATA-SUBSCRIPTION-PRE-ACCEPTANCE-UI-BASELINE-ALIGNMENT-001（纯文档任务；待正式复审） |
| 2026-09-01 | 正式验收前 UI 交互基线对齐草案批准收口：ChatGPT 对 R1 结果提交 `26094c6b6d8f9b8d5971ef38648851611799adee` 正式复审结论 `APPROVED`；当前验收标准版本由“正式验收前 UI 交互基线对齐草案”收口为 `APPROVED`；126 条用例（`DSUB-AC-001` ~ `DSUB-AC-126`）编号、需求映射、步骤、前置条件、预期结果相对复审提交零变化，`DSUB-AC-058/061/069/072/073/082` 逐字保持，状态全部保持 `NOT_RUN`；实现状态保持 `IMPLEMENTED_REVIEW_APPROVED_PENDING_FORMAL_ACCEPTANCE`；批准验收标准不等于验收已执行或通过，不得把任何用例标记为 `PASS` | DATA-SUBSCRIPTION-PRE-ACCEPTANCE-UI-BASELINE-ALIGNMENT-APPROVAL-001（ChatGPT 复审 APPROVED 驱动的纯文档批准收口） |
| 2026-09-01 | 批准收口 R1 状态元数据定向修订：ChatGPT 对批准收口结果提交 `dc97ffdee677ce8068d2652c9758359349174c82` 正式复核结论 `CHANGES_REQUIRED`（107 条需求业务行、126 条验收业务行、API/DATABASE、提交范围与批准边界全部通过；唯一问题是四份文档当前状态元数据未完全收口）；本 R1 定向修正本文件实现状态说明中把当前批准版本称为“草案”的过期文字，业务语义零变化，“当前功能已经实现并完成实现复审”的说明不回退；文档状态保持 `APPROVED`；126 条用例（`DSUB-AC-001` ~ `DSUB-AC-126`）相对基准提交 `dc97ffd...` 逐字零变化，状态全部保持 `NOT_RUN`；实现状态保持 `IMPLEMENTED_REVIEW_APPROVED_PENDING_FORMAL_ACCEPTANCE`；当前不是正式验收通过或 `IMPLEMENTED_ACCEPTED`；下一入口为 ChatGPT 对本 R1 结果提交正式复审 | DATA-SUBSCRIPTION-PRE-ACCEPTANCE-UI-BASELINE-ALIGNMENT-APPROVAL-001-R1（ChatGPT 正式复核 CHANGES_REQUIRED 驱动的纯文档状态元数据定向修订；待 ChatGPT 正式复审，不代表正式验收通过） |
| 2026-09-02 | 正式验收执行：任务 `DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001` 对 126 条验收用例（`DSUB-AC-001` ~ `DSUB-AC-126`）逐条执行并取得客观证据，全部更新为 `PASS`（0 `FAIL`、0 `BLOCKED`、0 `NOT_RUN`），编号、关联需求、前置条件、操作/输入、预期结果业务列零变化；证据完整归档于 `evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001/`（BT 138/138、FT 定向 141/141 + 全量 376/376、HTTP 10 项能力、BR 1K/2K、DB 授权 DML + 备份恢复、SC 静态契约、REP 历史报告）；`CDC_DATA_SUBSCRIBE` 已从备份表 `CDC_DATA_SUBSCRIBE_2026_08_31` 完整恢复（12 行，双向 MINUS 0，CLOB 0 不一致，临时目标库 0）；文档状态保持 `APPROVED`；实现状态更新为 `IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_REVIEW`（正式验收已执行，待 ChatGPT 正式复审；不是 `IMPLEMENTED_ACCEPTED`）；下一入口为 ChatGPT 对正式验收结果提交进行正式复审 | DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001（数据订阅正式验收执行；本记录仅更新验收状态、执行汇总与实现状态元数据，验收标准业务语义零变化） |
| 2026-09-02 | R1 真实浏览器补验与证据定向修订：ChatGPT 正式复审结论 `CHANGES_REQUIRED`，问题①原矩阵部分 `BR` 标注缺真实浏览器证据、②前端测试计数依赖未跟踪 `frontend/src/api/subscription.spec.ts`；R1 以真实 Chrome headless 补验 §5 全段共 54 个浏览器场景（含明确 `BROWSER_INTERCEPTED_UI_SCENARIO` 的拦截 UI 场景），在干净 worktree 重跑前端定向/全量/构建（7 文件/124、22 文件/359、BUILD PASS，未跟踪文件未带入未计数），逐条复核 126 条用例全部保持 `PASS`（0 `FAIL`、0 `BLOCKED`）；R1 覆盖矩阵 `evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1/coverage-matrix-r1.md` 取代原 `coverage-matrix.md` 证据标注并纠正不准确 `BR` 声明；`CDC_DATA_SUBSCRIBE` 单一事务恢复至备份状态（12 行、双向 MINUS 0、4 CLOB 一致 0、R1 残留 0），临时目标库清理至 0；文档状态保持 `APPROVED`；业务列（编号、关联需求、前置条件、操作/输入、预期结果）零变化，§4 各用例状态保持 `PASS`；验收执行状态保持 `EXECUTED_PENDING_REVIEW`，实现状态保持 `IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_REVIEW`，待 ChatGPT 对 R1 结果提交正式复审；R1 不代表正式验收通过或 `IMPLEMENTED_ACCEPTED` | DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1（数据订阅正式验收 R1 浏览器补验与证据修订；本记录仅更新状态与执行汇总，验收标准业务语义零变化） |

> 关联文档：需求基线 `docs/features/data-subscription/REQUIREMENTS.md`；任务报告 `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001.md`、`...-001-R1.md`、`...-APPROVAL-001.md`、`.../DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-001.md`、`.../DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-APPROVAL-001.md`、`.../DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-001.md`、`.../DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001.md`、`.../DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md`、`.../DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1.md`、`.../DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001.md`、`.../DATA-SUBSCRIPTION-PRE-ACCEPTANCE-UI-BASELINE-ALIGNMENT-001.md`。
