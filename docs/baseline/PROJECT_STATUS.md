# PROJECT_STATUS — 项目状态快照（项目级基线）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-BASELINE-APPROVAL-CLOSEOUT-001
> 批准日期：2026-08-27
> 批准内容提交：b054718130bbe922f2e26b79b3ee946290949ef1
> 批准依据：ChatGPT 第二轮复审 PASS + 用户明确正式批准
> 恢复任务：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001
> 恢复日期：2026-08-27
> 恢复任务执行基线：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c
> 恢复草案首次入库提交：a6f51f8a8ff984bc946a4e2ccaccbf56692722fe
> 本轮修订任务：PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001（结果提交见本轮实施报告）
> 来源：服务器既有候选（docs/baseline/ 未提交文件，原 BASELINE-001/002 与 DATABASE-CODE-MAPPING-001 Phase 2 固化）+ 恢复任务修订 + 本轮复审修订，对齐当前代码与已批准数据库基线
> 首次草拟：2026-08-12

基线日期: 2026-08-27（恢复草案，历史草稿 2026-08-12）
基线来源: `BASELINE-001` 盘点 + R1/R2 修订 → `BASELINE-002` → `DATABASE-CODE-MAPPING-001` Phase 2 固化 → 本任务恢复并修订
维护触发: 功能验收、测试状态变更、新模块上线、数据库映射/关系统计变更
快照时点: 截至 2026-08-27

---

## 1. 代码实现状态

### 1.1 前端

当前前端实现形态为4个较完整业务页面和6个占位页面。各功能的最终完成状态、本期范围和后续优先级分别记录，不以页面数量直接计算项目完成率。

| 页面 | 路由 | 实现形态 | 说明 |
|---|---|---|---|
| CDC节点状态 (ZK客户端监控) | /monitor/cdc-node | 较完整业务实现 | 用户验收通过 |
| 故障监控（总览/详情/历史） | /monitor/job-failure 及子路由 | 较完整业务实现 | 主要页面与已列调整用户验收通过；统一内部→对外状态映射层（对外 5 种状态）仍开放（GAP-STATUS-001/002/003，见 docs/features/job-failure-monitor/） |
| 日志查询 | /monitor/log-query | 较完整业务实现 | 功能基线已批准，实现与开发验收已完成 |
| 数据同步统计大屏 | /large-screen | 较完整业务实现 | 视觉验收通过，standalone路由 |
| 数据源管理 | /config/data-source | 占位页 | 已有旧后端候选实现（CRUD+启停等，与新批准目标存在冲突），批准的新目标尚未实现，前端未对接 |
| 客户端配置 | /config/client | 占位页 | PlaceholderPage |
| 数据订阅 | /config/subscribe | 占位页 | PlaceholderPage |
| 服务端配置 | /config/server | 占位页 | PlaceholderPage |
| 数据源运行状态 | /monitor/data-source-state | 占位页 | PlaceholderPage |
| Topic偏移量 | /monitor/topic-offset | 占位页 | PlaceholderPage |

6个占位页面的本期正式范围及优先级待用户确认。

> 菜单 Git 事实与本地候选：Git 已提交菜单为 2 组 10 项（配置管理 4 + 运行监控 6，不含大屏入口）；大屏 standalone 路由 `/large-screen` 已提交；大屏菜单入口仅存在于工作区未提交 `menu.ts` 修改中（本地候选，未提交），不作为 Git 可复核事实。

### 1.2 后端

| 模块 | 状态 | 说明 |
|---|---|---|
| common | 完整 | ApiResponse, PageResult, BusinessException, GlobalExceptionHandler |
| config | 完整 | CORS, MyBatis-Plus, SpringDoc, SpaForwardFilter |
| health | 完整 | HealthController |
| datasource | 后端CRUD完整（旧候选实现） | DataSourceController完整实现CRUD+启停（旧候选，与已批准数据源管理目标存在冲突），批准的新目标尚未实现，前端未对接 |
| monitor/zookeeper | 较完整业务实现 | ZooKeeperReadOnlyClient只读，代码已完成 |
| monitor/jobfailure | 较完整业务实现 | 13个算法类完整故障链 |
| logquery | 较完整业务实现 | 日志查询（游标分页 + XML Mapper），只读接口 |
| largescreen/stats | 较完整业务实现 | 调度+算法+接口+前端完整；开发库真实数据统计端到端验证待执行 |

---

## 2. 测试状态

> 说明：本恢复任务为纯文档任务，未重跑前后端测试与构建。以下为最近一次已记录并复核的测试执行数据（LOG-QUERY-DEVELOPMENT-ACCEPTANCE-EXECUTION-001，授权基线 `7b3010e`）。

### 2.1 后端测试

| 项 | 结果 |
|---|---|
| 日志查询专项 | 135 例全部通过（7 个测试类） |
| 完整测试 | 575 run / 3 failures / 1 error，构建失败 |
| 打包 | `mvn clean package -DskipTests` BUILD SUCCESS |

完整测试失败均集中在 `monitor.jobfailure` 域，依赖开发库实时数据，在干净 worktree 授权基线复现一致，判定为既有无关失败，非日志查询功能引入：

1. `OracleDateMappingTest.oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly`
2. `JobFailureServiceTest.latestFaultShouldHaveCorrectRestartCount`
3. `JobFailureServiceTest.failureDetail_eventNotInFaultProcess_shouldThrow`
4. `JobFailureServiceTest.failureDetailByEvent_shouldReturnContent`

### 2.2 前端测试

最近一次（同上）：Vitest 7 个测试文件 / 42 个用例全部通过；`vue-tsc --noEmit` 与 Vite 生产构建成功（仅既有 chunk 体积警告）。

### 2.3 当前测试基线说明

后端完整测试存在 `monitor.jobfailure` 域 3 失败 + 1 错误项既有无关失败，修复为独立任务，不阻塞基线。本恢复任务未重跑测试。

---

## 3. 大屏验证多维度状态

大屏增量统计功能按6个独立维度分别记录：

| 维度 | 状态 | 证据 |
|---|---|---|
| 页面视觉 | 用户验收通过 | TASK7视觉验收报告 |
| 菜单入口（本地候选） | 工作区未提交 menu.ts 已含大屏菜单项；Git 已提交菜单为 2 组 10 项（不含大屏入口），大屏菜单入口不作为 Git 已提交事实 | menu.ts 当前为工作区未提交修改 |
| 前后端接口 | 代码已实现 | LargeScreenController + largeScreen.ts API |
| 统计任务代码 | Large Screen Stats 测试类在最近完整测试中无失败 | mvn test输出（见 §2.1） |
| 开发库真实数据验证 | 有源数据（CDC_LOG_CORRECT 约381万行、CDC_LOG_ERROR 442行，2026-08-26 数据画像），增量统计端到端验证待执行 | 已批准 DATA_PROFILE.md |
| 生产规模性能验证 | 未验证 | 不在当前开发环境范围内 |

---

## 4. 历史验收状态

| 验收项 | 报告状态 | 复核状态 |
|---|---|---|
| ZK客户端监控集成验收 | 通过 (docs/acceptance/zk-client-monitor-integration.md) | ZK-ENV-001: ZK 10.19.16.111:2181 可达，v3.4.14，会话建立成功，/bsoft-cdc/clients 读取成功 |
| 故障监控功能验收 | 通过 (docs/acceptance/job-failure-acceptance.md) | 用户验收通过（主要页面与已列调整）；统一内部→对外状态映射层仍开放（GAP-STATUS-001/002/003，独立接续任务处理） |
| 大屏视觉验收 (TASK7) | 用户验收通过 (commit 8822795) | 已确认 |
| 日志查询开发验收 | 功能基线已批准，实现与开发验收已完成 | ACCEPTANCE PASS 121 / BLOCKED 8 / NOT_RUN 46 / DEFERRED_UNTIL_PHYSICAL_DESIGN 5 |

注：日志查询功能的用户视觉验收与最终收口仍待用户完成（对应部分 NOT_RUN 用例）。

---

## 5. 运行验证状态

| 验证项 | 状态 | 说明 |
|---|---|---|
| 应用启动 | 未执行 | 未启动完整应用（本任务为纯文档任务） |
| ZK TCP 2181端口 | **可达** | ZK-ENV-001 验证: 10.19.16.111:2181 TCP可达 |
| ZK 会话连接 | **成功** | ZK-ENV-001 验证: zkCli v3.4.14 会话建立, timeout=30000ms |
| ZK /bsoft-cdc 读取 | **成功** | 子节点: [clients, servers] |
| ZK /bsoft-cdc/clients 读取 | **成功** | 子节点: [hosp-012] |
| ZK 服务端版本 | **3.4.14** | srvr命令确认: 3.4.14-4c25d48, built 03/06/2019, mode=standalone |
| ZK Java客户端/Curator兼容性 | **待验证** | CLI只读连接成功不等于项目 Curator 2.13.0 / ZK 3.4.14 依赖与服务端 3.4.14 兼容性验证通过 |
| 数据库连接 | 可达 | SQL*Plus连接正常（数据库基线核验时只读确认） |
| 统计调度运行 | 未执行 | 未启动应用，调度未触发 |
| 大屏端到端 | 未执行 | 开发库有源数据，增量统计验证待执行 |

---

## 6. 未提交现场概况

截至 2026-08-27 本恢复任务盘点，工作区存在 129 个未跟踪文件、9 个已修改文件、3 个已删除文件：

| 类型 | 说明 |
|---|---|
| 已修改跟踪文件 (9个) | .claude/settings.local.json、agent-env.sh、frontend/src/config/menu.ts 及前端布局/样式等，docs/ 下历史任务材料 |
| 已删除跟踪文件 (3个) | 历史 TASK 报告 |
| 未跟踪文件 (129个) | docs/prompts/、docs/baseline-work/、docs/agent-prompts/ 等过程材料；docs/baseline/ 六份候选基线（本任务恢复来源）；docs/features/app-shell/ 与 large-screen/ 本地候选；docs/screenshots/ 截图等 |

未提交文件治理为独立任务，不阻塞基线。全部文件保持原状，未经逐项确认归属与冲突。

---

## 7. Git仓库状态

| 项目 | 值 |
|---|---|
| 当前分支 | develop |
| 作者 | acmilan1982 (单作者) |
| 分支模型 | 仅develop，无main/master/release |
| 合并历史 | 无merge，线性历史 |
| Tag | 无 |
| 恢复任务执行基线 | 6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c |
| 恢复草案首次入库提交 | a6f51f8a8ff984bc946a4e2ccaccbf56692722fe（PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001） |
| 本轮修订提交 | 见 Git 历史与本轮实施报告（PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001） |

> 提交总数与最新提交为动态口径，不在本文固定；如需统计以 Git 实际为准（截至恢复快照提交 a6f51f8 时点可由 Git 统计）。

---

## 8. 已知待处理事项

| 事项 | 优先级 | 说明 |
|---|---|---|
| 重跑并确认当前后端/前端测试基线 | 高 | 最近记录 575 / 3失败 / 1错误（monitor.jobfailure 既有无关失败），本恢复任务未重跑 |
| JobFailureServiceTest 失败诊断 | 高 | 3 failures + 1 error，依赖开发库实时数据，根因待诊断 |
| ZK Java客户端/Curator兼容性验证 | 高 | CLI 只读连接成功（ZK-ENV-001）；pom.xml Curator 2.13.0 / ZK 3.4.14 与服务端 3.4.14 的 Java/Curator 层兼容性待应用层独立验证 |
| 大屏增量统计端到端验证 | 中 | 开发库有源数据，调度运行验证待执行 |
| 日志查询物理设计与生产启用 | 中 | LQ-AC-164/165/171/172/173 保持延期 |
| 故障监控状态映射层收口（GAP-STATUS-001/002/003） | 中 | 统一内部→对外状态映射层（对外5种状态）仍开放，作为独立接续任务处理，见 docs/features/job-failure-monitor/ |
| 未提交文件治理 | 中 | 129个未跟踪 / 9个已修改 / 3个已删除文件需分类处理 |
| 数据源前端对接 | 低 | 后端CRUD已完成，前端对接待排定 |
| 6个占位页面范围确认 | 低 | 本期正式范围和优先级待用户排定 |
| 认证方案 | 待决策 | 当前无认证，长期是否需要待决定 |
| 分支策略 | 待决策 | 当前仅develop单分支，未来是否引入main分支待决定 |

---

## 9. 数据库基线状态

> 项目级数据库物理基线已于 2026-08-26 经 PROJECT-DATABASE-BASELINE-APPROVAL-001 正式批准（APPROVED），详见 docs/database/。

### 9.1 映射规模（与批准基线一致）

| 类型 | 数量 |
|---|---|
| 生产代码实际使用的数据库表 | 14 |
| Entity 类 | 12 |
| BaseMapper 接口 | 12 |
| 纯查询 Mapper（LargeScreenMapper） | 1 |
| Mapper 接口合计 | 13 |
| JdbcTemplate 直接访问的表 | 2（CDC_LOG_CORRECT、CDC_LOG_ERROR） |
| Mapper XML 文件 | 1（mapper/logquery/LogQueryMapper.xml） |

已废弃对象 `CDC_CLIENT` 不在当前有效清单内。

### 9.2 链路状态分类

14 张已用表按真实链路分为 4 类：

| 分类 | 表数 | 包含的表 | 链路特征 |
|---|---|---|---|
| 已闭环 | 9 | CDC_CLIENT_MULTIPLE、CDC_DATA_SUBSCRIBE、CDC_JOB_FAILURE_EVENT、CDC_JOB_FAILURE_HANDLE_LOG、CDC_STATS_CUMULATIVE_OVERVIEW、CDC_STATS_DAILY_OVERVIEW、CDC_STATS_DIM_CUMULATIVE、CDC_STATS_DIM_DAILY、CDC_STATS_WATERMARK | 后端+前端完整（含调度写入与 API 读取双路径） |
| 旧后端候选实现/新目标未实现 | 2 | CDC_DATA_SOURCE、CDC_DATA_SOURCE_EXTEND | 已有旧后端候选实现（CRUD+启停、双表联写、一对一读取等，与新批准目标存在冲突）；批准的新目标尚未实现，前端仍占位 |
| 后端闭环（纯调度配置） | 1 | CDC_STATS_TASK_CONFIG | 仅 StatsTaskConfigLoader 后端读取 |
| 日志读取（双路径） | 2 | CDC_LOG_CORRECT、CDC_LOG_ERROR | 日志查询页经 MyBatis XML 读取（前端完整）；大屏统计经 JdbcTemplate 读取 |

**自校验：9 + 2 + 1 + 2 = 14 ✓**

CDC_DATA_SOURCE 另被日志查询的 selectAllDataSources 读取用于过滤条件；其管理页仍为占位页。

### 9.3 逻辑关系

| 确认状态 | 数量 | 编号 |
|---|---|---|
| 已确认 | 12 | R01～R11、R15 |
| 高度可信 | 3 | R12～R14 |
| 待用户确认 | 0 | — |

- 全部为逻辑外键，无物理 FOREIGN KEY 约束（架构决策，非缺陷）。
- R01：已批准为源库 0..N 命名策略关系——`CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID → CDC_DATA_SOURCE` 为源库弱逻辑引用，反向一个源库 0..N 条策略；`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 为逻辑联合唯一组合，第一版由后端保存前查询校验，无数据库唯一约束/DDL；现有重复/孤立/缺失为人工构造容错测试场景。
- R02/R03/R04：逗号分隔多值弱逻辑引用，维护方为人工维护 / 管理平台只读。
- R05～R08：LOG_CORRECT / LOG_ERROR 维护方为 sync-server → Kafka → sync-log 写入。
- R09～R11：JFE / JHL 维护方为 sync-client 写入，管理平台只读。
- R15：EXTEND.TARGET_DATA_SOURCE_ID 单值弱逻辑引用（业务语义目标库），管理平台维护（EXTEND 联写；字段当前代码未映射）。
- FAILED_JOB_ID 是 Flink Job ID，与 ZK jobName 不建立直接逻辑关系。

### 9.4 候选物理设计（PENDING_DECISION，未实施、不承诺排期）

| 编号 | 对象 | 候选内容 | 状态 |
|---|---|---|---|
| D03 | CDC_JOB_FAILURE_EVENT | 是否为查询字段补索引 | PENDING_DECISION |
| D04 | CDC_JOB_FAILURE_HANDLE_LOG | 是否为查询字段补索引 | PENDING_DECISION |

原 R01（是否约束每数据源一条扩展配置）已由已批准数据源管理 Feature 基线关闭：`CDC_DATA_SOURCE_EXTEND` 为源库 0..N 命名策略，第一版不新增主键、唯一约束、索引或 DDL，逻辑联合唯一 `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 由后端保存前查询校验，不再作为待决策项。

原 D01（是否将 `CDC_DATA_SUBSCRIBE.DATA_SUB_ID` 设置为主键）已关闭：DATA_SUB_ID 已为数据库真实主键（约束 `PK_CDC_DATA_SUBSCRIBE`，PRIMARY KEY、ENABLED、NOT DEFERRABLE IMMEDIATE，唯一索引 NORMAL/UNIQUE/VALID，LAST_DDL_TIME 2026-08-28 17:36:20，`DATABASE_VERIFIED`），无需再作待决策项。此为当前数据库物理事实（只读核验），非新增 DDL，本 R1 未访问数据库、未执行 DDL、未改变数据库结构。

另：D06（WATERMARK 等缺 @TableId）为代码层 MyBatis-Plus 注解差异，见 ARCHITECTURE.md §9；数据源前端占位为功能实现状态，见 §1.1。

### 9.5 开放业务问题

0 — 所有业务问题已在批准数据库中确认关闭；PENDING_DECISION 候选物理设计均待独立决策，不阻塞现行实现。

---

## 10. 项目级基线状态

### 10.1 六份正式项目级基线

以下六份文件构成项目级基线，位于 `docs/baseline/`，新会话应优先读取（CLAUDE.md §3）：

| 文件 | 职责 |
|---|---|
| `PROJECT.md` | 项目总览：定位、业务范围、技术边界、关键约束、文档体系 |
| `ENVIRONMENT.md` | 环境配置：服务器基础环境、数据库/ZK 连接、构建配置、连接性状态 |
| `ARCHITECTURE.md` | 系统架构：技术架构、模块关系、数据架构（对象清单/访问层/逻辑关系/维护边界）、ZK 监控模型、Job 故障监控模型、前端路由与布局、部署形态 |
| `DEVELOPMENT_RULES.md` | 开发规则：规则优先级、Git 铁律、提交规范、数据库/ZK 操作规则、构建验证规则、安全配置规则、数据库映射与逻辑关系规则、普通任务提示词保留规则 |
| `PROJECT_STATUS.md` | 项目状态快照（本文件） |
| `DOMAIN_GLOSSARY.md` | 领域词汇表：基础概念、ZK 节点模型、数据库核心概念、同步链路术语、Job 故障监控领域、大屏增量统计领域、统计表体系、数据库—代码映射核心术语、文档体系术语 |

### 10.2 当前状态

- 六份项目级基线此前仅存在于服务器工作区（未进入 Git）。本任务按 PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001 恢复并修订，经 PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001 按 ChatGPT 复审意见修订。
- 历史 BASELINE-001/002、ZK-ENV-001、DATABASE-CODE-MAPPING-001 的结论在恢复时已对齐当前代码与已批准数据库基线。
- 六份项目级基线已于 2026-08-27 由用户正式批准（批准任务：PROJECT-BASELINE-APPROVAL-CLOSEOUT-001；批准内容提交：`b054718`；批准依据：ChatGPT 第二轮复审 PASS + 用户明确正式批准），状态为 `APPROVED`。
- 项目级基线批准人为用户，Agent 不得自行批准；批准后项目目标、环境、架构、规则、状态或术语发生变化时，仍需通过新的独立维护任务更新。

### 10.3 维护原则

- 项目目标、环境、架构、规则、状态或领域术语发生实质变化时，更新对应基线文件；
- 基线是长期文档资产，不通过聊天记忆替代；
- 基线维护触发条件已在各文件头声明。

### 10.4 列表表格视觉模板基线状态

- 独立基线 `docs/baseline/list-table-visual-template/` 于 2026-09-21 由
  纯文档任务 `LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001` 建立（当时为草案状态），
  并经 `LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1` 定向修订；
- **参考页**：数据源管理主列表（`/config/data-source`）；
- **当前状态**：`APPROVED` / `BASELINE_APPROVED` —— 经 ChatGPT 远程 Git R1 复审
  （`REVIEW_PASS`、`blocking_finding_count=0`）并由项目负责人于 2026-09-21 批准
  （`approval_scope=BASELINE_CONTENT_ONLY`，
  批准源提交 `575379895c4c57fd3df7e0d0ce27c1f6841d2f17`）；
- **批准范围**：**基线内容**，以及此后**单独批准**的**公共实现详细设计文档**。
  详细设计（`docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md`）
  经 ChatGPT 远程 R2 复审（`REVIEW_PASS`、`blocking_finding_count=0`）后，
  由项目负责人于 2026-09-21 批准（`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`，
  批准源提交 `e72264de14a9483aae5593435f818ea65c5116e0`），
  状态为 `shared_implementation_design_status=APPROVED` /
  `shared_implementation_design_approval_status=APPROVED`；
  但**批准详细设计 ≠ 批准实现**。公共实现与数据源管理**主列表**的等价接入随后由
  独立实施任务 `LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001`
  实现：`shared_implementation_status` / `reference_page_integration_status` 现为
  `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`；
  项目负责人已于 `2026-09-22` 打开 `http://192.168.174.70:5173/config/data-source`
  **目测复核通过**（`project_owner_visual_review_status=PASS` /
  `project_owner_visual_review_date=2026-09-22`）；
  随后独立正式验收任务
  `LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001`
  以 `b36c521`（实现 `284b263`）为受验对象、以接入前提交 `ae6439b` 为基准，
  执行 `LTVT-FA-001`～`014` 共 14 条，结果 **14 PASS / 0 FAIL / 0 BLOCKED / 0 NOT_RUN**：
  `formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`；
  **本地正式验收通过只表示 Agent 侧在隔离环境完成验收，不等于项目负责人最终接受**：
  `final_acceptance_status=NOT_ACCEPTED_PENDING_PROJECT_OWNER`，
  `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`；
- **下一入口**：先由 ChatGPT 复审远程正式验收提交，再由项目负责人决定是否最终接受
  （`CHATGPT_REMOTE_GIT_FORMAL_ACCEPTANCE_REVIEW_THEN_PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION`；
  **未经项目负责人再次明确批准不得修改代码**，也不得进入页面迁移）；
- 与查询列表页模板基线是**正交、可组合**的两层（页面层 / 表格层）；
- 该基线与六份项目级基线的正式状态**无关**，不影响六份基线的 `APPROVED` 状态。

来源: 本任务执行记录、已批准数据库基线

---

## 11. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-29 | 数据源管理 Feature 已批准规则同步：§9.3 R01 更新为已批准的源库 0..N 命名策略关系；§9.4 原 R01（是否约束每数据源一条扩展配置）`PENDING_DECISION` 关闭；§9.2 数据源两表分类由“后端闭环/前端缺口”调整为“旧后端候选实现/新目标未实现”，明确区分“已有旧后端候选实现”与“批准的新目标尚未实现、前端仍占位”；§1.1/§1.2 数据源行补充“旧候选实现”说明；分类合计与表数自洽不变；数据库物理事实与当前代码事实保留 | DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001（已批准业务规则向权威项目基线同步；纯文档任务，数据库物理结构和当前代码无变化） |
| 2026-08-30 | R1 修订：§9.4 原 D01（是否将 `CDC_DATA_SUBSCRIBE.DATA_SUB_ID` 设置为主键）关闭——DATA_SUB_ID 已为数据库真实主键（`PK_CDC_DATA_SUBSCRIBE`，`DATABASE_VERIFIED`），从 PENDING_DECISION 候选表移除并记录关闭原因；订阅 CRUD 未实现、管理平台只读、订阅记录人工维护等当前实现事实保留 | DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001-R1（ChatGPT 复审 CHANGES_REQUIRED 定向修订；纯文档任务，未访问数据库、未执行 DDL） |
| 2026-09-21 | 新增 §10.4：记录独立的“列表表格视觉模板”基线草案状态（`DRAFT_PENDING_USER_REVIEW`，未实现、未批准、未授权迁移，参考页为数据源管理主列表）；与查询列表页模板基线为正交、可组合的两层 | LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001（纯文档任务，未修改代码、Feature 文档或其他基线状态） |
| 2026-09-21 | §10.4 当前状态更新为 `APPROVED` / `BASELINE_APPROVED`：基线内容经 ChatGPT 远程 R1 复审（`REVIEW_PASS`）并由项目负责人批准（`BASELINE_CONTENT_ONLY`）；公共实现详细设计、公共实现、参考页接入均为 `NOT_STARTED`，正式验收 `NOT_RUN`，页面迁移 `NOT_STARTED` / `NOT_GRANTED`；下一入口改为公共实现详细设计任务 | LIST-TABLE-VISUAL-TEMPLATE-BASELINE-APPROVAL-CLOSEOUT-001（纯文档任务，未修改代码、测试、配置或依赖） |
| 2026-09-21 | §10.4 当前阶段推进：新增 `docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md` 详细设计草案（`DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW` / `NOT_APPROVED`，对四个候选作出唯一结论：显式根类 CSS 预设 + 有限 CSS 自定义属性令牌）；公共实现、参考页接入仍 `NOT_STARTED`，正式验收 `NOT_RUN`，页面迁移 `NOT_STARTED` / `NOT_GRANTED`；下一入口改为“ChatGPT 远程复审 → 项目负责人设计批准” | LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001（纯文档任务，未修改代码、测试、配置、依赖或任何业务页面） |
| 2026-09-21 | §10.4 详细设计批准收口：经 R1 / R2 定向修订后，ChatGPT 远程 R2 复审 `REVIEW_PASS`（`blocking_finding_count=0`），项目负责人于 2026-09-21 批准公共实现详细设计（`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`，批准源提交 `e72264de1`）；§10.4 状态块改为 `shared_implementation_design_status=APPROVED` / `shared_implementation_design_approval_status=APPROVED`；**批准详细设计 ≠ 批准实现**：公共实现、参考页接入仍 `NOT_STARTED`，正式验收 `NOT_RUN`，页面迁移 `NOT_STARTED` / `NOT_GRANTED`；下一入口改为“公共实现 + 数据源管理参考页等价接入”独立任务待提示词与项目负责人批准 | LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-APPROVAL-CLOSEOUT-001（纯文档任务，未修改代码、测试、配置、依赖或任何业务页面） |
| 2026-09-22 | §10.4 公共实现与参考页等价接入落地：新增公共视觉预设 `frontend/src/styles/list-table/list-table-visual.css`（+ `index.ts` 常量、静态契约测试），数据源管理**主列表**追加公共类 `lt-main-table` 并以 `<style scoped src>` 引入、删除被逐值等价替代的四组局部基础规则；`shared_implementation_status` / `reference_page_integration_status` 改为 `IMPLEMENTED_PENDING_USER_REVIEW`；**待复核 ≠ 已验收**：`formal_acceptance_execution_status` 保持 `NOT_RUN`，页面迁移 `NOT_STARTED` / `NOT_GRANTED`，详细设计保持 `APPROVED`；下一入口改为项目负责人目测复核与正式验收任务 | LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001（代码实现任务；未迁移任何其他页面，未修改后端、数据库或 qlpt 契约） |
| 2026-09-22 | §10.4 项目负责人目测通过收口：ChatGPT 远程 R2 复审 `REVIEW_PASS`（`blocking_finding_count=0`）后，项目负责人于 `2026-09-22` 打开 `http://192.168.174.70:5173/config/data-source` 目测复核，结论“没啥问题”，`project_owner_visual_review_status=PASS`；`shared_implementation_status` / `reference_page_integration_status` 由 `IMPLEMENTED_PENDING_USER_REVIEW` 推进为 `IMPLEMENTED_PENDING_FORMAL_ACCEPTANCE`；**目测通过 ≠ 正式验收**：`formal_acceptance_execution_status` 保持 `NOT_RUN`、`final_acceptance_status=NOT_ACCEPTED_PENDING_FORMAL_ACCEPTANCE`，页面迁移 `NOT_STARTED` / `NOT_GRANTED`，详细设计保持 `APPROVED`；下一入口改为**单独授权**的正式验收任务（需另立提示词） | LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-VISUAL-REVIEW-CLOSEOUT-001（纯文档任务，未修改代码、测试、配置、依赖、证据或历史报告；未执行正式验收，未授权迁移） |
| 2026-09-22 | §10.4 公共实现与参考页接入**正式验收**执行通过：以 `b36c521`（实现 `284b263`，`backend/frontend` 零差异）为受验对象，基准取自接入前提交 `ae6439b` 的隔离副本，执行 `LTVT-FA-001`～`014` 共 14 条，结果 **14 PASS / 0 FAIL / 0 BLOCKED / 0 NOT_RUN**（定向 2/128、全量 57/1063、构建成功且产物仅新增 4 条带根类规则；1440×900 / 1920×1080 计算样式与几何严格 0 差异；fallback/覆盖 A–F、负向页面矩阵、六类反向控制、隔离回滚均通过）；`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`，`shared_implementation_status` / `reference_page_integration_status` 推进为 `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`；**本地正式验收通过 ≠ 项目负责人最终接受**：`final_acceptance_status=NOT_ACCEPTED_PENDING_PROJECT_OWNER`，页面迁移 `NOT_STARTED` / `NOT_GRANTED`，详细设计保持 `APPROVED`；下一入口改为“ChatGPT 复审远程正式验收提交 → 项目负责人最终接受决定” | LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001（前端正式验收任务；未修改业务代码、测试、配置、依赖或锁文件；未迁移任何页面；未作最终接受） |
