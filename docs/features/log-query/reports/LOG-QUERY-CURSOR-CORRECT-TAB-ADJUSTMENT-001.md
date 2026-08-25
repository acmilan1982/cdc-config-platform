# 任务报告：LOG-QUERY-CURSOR-CORRECT-TAB-ADJUSTMENT-001

## 1. 任务结论

本任务依据用户对日志查询游标分页与正确日志 Tab 的视觉复审，定向修复两个问题并同步基线文档，属于微型调整，不改变既有业务语义边界。状态为 `IMPLEMENTED_PENDING_REVIEW`，未自评验收通过，未收口 README。

- **问题 1（游标分页 >100 失败）**：开发库 `CDC_LOG_ERROR` 结果超过固定页大小（100）需生成 `nextCursor` 时，`LogCursorCodec` 因 `cdc.log-query.cursor-secret` 为空抛 `IllegalStateException: LogQuery cursor secret is not configured`。已按用户明确授权把 `application-dev.yml` 现有 `cdc.log-query` 节点下的 `cursor-secret` 改为固定开发密钥（密钥值不写入本报告、正文与任何代码外的文档），生产配置 `application.yml` 不携带该密钥。开发库实测第 1 页（100 条 + `nextCursor`）、第 2 页按游标继续翻页均正常，不再抛异常。
- **问题 2（正确日志首次切换自动查询）**：正确日志首次切换不再自动调用列表接口，改为只初始化并展示缺省条件（当前自然日 `00:00:00`–`23:59:59`、源库/目标库“全部”、表名空），状态为 `NOT_QUERIED`，展示引导文案“正确日志数据量较大，请设置查询条件后点击"查询"”，无加载遮罩/旋转图标/等待秒数/慢查询提示，不显示“暂无数据”；用户点击“查询”后才发起首次列表查询。查询后切换回正确日志恢复其表单/已生效条件/列表/错误/游标历史，不重新查询；错误日志默认首查行为不变。

## 2. Git 开始/结束状态

### 开始状态（任务启动时）

```text
分支：develop
HEAD：c237b8ce5d71e0f766bbbb7fc3793870c83c9763
origin/develop：c237b8ce5d71e0f766bbbb7fc3793870c83c9763（任务启动时记录）
暂存区：空（本任务范围内）
```

任务开始前工作区既有内容（`9` 个已修改文件 + `130` 个未跟踪文件/目录，含 `.claude/settings.local.json`、`agent-env.sh`、前端布局/菜单/样式、`docs/` 下大量历史任务材料与基线过程材料等）已完整记录，并在整个任务过程中原样保留：未修改、未覆盖、未暂存、未提交、未清理。本任务只修改与新增本任务授权范围内的文件（见 §3）。

### 结束状态（提交与推送后）

见本任务提交与推送段（提交后本地 `HEAD == origin/develop`、`ahead/behind = 0 / 0`，用户既有工作区内容完整保留；提交仅包含本任务授权范围文件）。

## 3. 修改/新增文件列表

### 后端

- `backend/src/main/resources/application-dev.yml`：在既有 `cdc.log-query` 节点下把 `cursor-secret` 由空值占位改为固定开发密钥（未新增重复节点、未改动 `enabled`）。生产 `application.yml` 保持不含 `cursor-secret`。
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/config/LogQueryConfigTest.java`：新增 1 例测试，从 `application-dev.yml` 读取 `cdc.log-query.cursor-secret`（不把密钥值写进测试源码），断言非空、可被 Spring 属性绑定、可创建 `LogCursorCodec` 完成编码/验签往返；同时断言生产 `application.yml` 不含该密钥。原 8 例保持不变。

### 前端

- `frontend/src/views/log-query/composables/useLogQueryTab.ts`：新增 `LogQueryTabStatus`（`NOT_QUERIED / LOADING / SUCCESS_WITH_DATA / SUCCESS_EMPTY / FAILED`）与 `deriveTabQueryStatus()` 推导函数；`initialQueryAttempted` 语义保持。
- `frontend/src/views/log-query/LogQueryPage.vue`：两 Tab 的 `<LogQueryTable>` 由 `:applied` 改为 `:query-status`（错误/正确各自 `computed` 推导）；`onTabSwitch` 仅切换活动 Tab，不再触发首次自动查询（正确日志首次查询由用户点击“查询”触发；错误日志默认首查仍由初始化链 `initNormal → errorTab.initialQuery` 负责）。
- `frontend/src/views/log-query/components/LogQueryTable.vue`：`applied` prop 改为 `queryStatus`；`NOT_QUERIED` 显示引导文案（主文案“正确日志数据量较大，请设置查询条件后点击"查询"”、弱提示“默认查询时间为当天。缩小时间范围或指定数据源、表名可提高查询速度。”），不显示“暂无数据”与加载遮罩；`SUCCESS_EMPTY` 显示“当前查询条件下暂无日志”。
- `frontend/src/views/log-query/composables/useLogQueryTab.spec.ts`：新增正确日志缺省查询与状态推导 3 例。
- `frontend/src/views/log-query/LogQueryPage.spec.ts`：新增正确日志首次切换不自动查询 6 例。
- `frontend/src/views/log-query/components/LogQueryTable.spec.ts`：新建 5 例（引导文案、成功有数据/无数据、失败、加载遮罩与等待秒数）。

### 文档

- `docs/features/log-query/REQUIREMENTS.md`：修订记录 + 元数据 + LQ-SCOPE-11 / LQ-FILTER-62 / LQ-TAB-21 / LQ-TAB-52 / LQ-LOAD-02 / AC-14 / AC-32 / AC-60 同步新规则。
- `docs/features/log-query/DESIGN.md`：修订记录 + LQ-DESIGN-72 / LQ-DESIGN-177 同步新规则。
- `docs/features/log-query/UI.md`：修订记录 + LQ-UI-032 / 035 / 062 / 140 / 143 / §15.2 状态转换表 / 新增 LQ-UI-180A。
- `docs/features/log-query/ACCEPTANCE.md`：修订记录；受新规则影响的既有 PASS 用例 `LQ-AC-004 / 016 / 020 / 135 / 177` 改为 `NOT_RUN` 并改写预期，`LQ-AC-037` 预期改写；新增 `LQ-AC-004A~004D`；追踪矩阵同步；执行记录说明补正。未修改历史修订记录内容，仅追加新条目。
- `docs/features/log-query/reports/LOG-QUERY-CURSOR-CORRECT-TAB-ADJUSTMENT-001.md`（本报告，新增）。

## 4. 关键实现说明

### 4.1 开发环境游标密钥（问题 1）

- `LogCursorCodec` 构造时对 `cdc.log-query.cursor-secret` 做非空校验，为空抛 `IllegalStateException` 并 fail-closed（不生成无签名/默认签名游标）。开发库此前该值取自 `CDC_LOG_QUERY_CURSOR_SECRET` 且为空，导致结果超过 100 条需要 `nextCursor` 时抛异常。
- 按用户明确授权，在 `application-dev.yml` 的既有 `cdc.log-query` 节点内配置固定开发密钥，无新增重复节点、不改变 `enabled` 开关。生产配置 `application.yml` 不含该密钥；不扩散到前端、接口响应、日志、其他文档正文与本报告正文。
- 边界不变：原四接口不判断开关、不新增 403/拦截器/服务门禁；仍为固定排序（`TARGET_TIME DESC, CDC_LOG_ID DESC`）+ 固定页大小（100 + 101 探测）游标分页，不改为 offset/页号分页。

### 4.2 正确日志首次切换不自动查询（问题 2）

- 状态模型：`deriveTabQueryStatus()` 按 `loading / error / applied（已生效条件）/ items` 推导 `NOT_QUERIED / LOADING / SUCCESS_WITH_DATA / SUCCESS_EMPTY / FAILED`，明确不用 `items.length === 0` 推断“未查询”。
- 正确日志第一次切换：表单已填充缺省条件（`sourceDataSourceIds/targetDataSourceIds=[ALL_DATA_SOURCE]`、表名空、时间=当天自然日），`applied=null`、`requestCursorStack=[null]`、不发起列表请求，`NOT_QUERIED` 引导态。
- 点击“查询”后正确日志才首次请求；失败/超时 Tab 保持 `FAILED`，不自动重试；重置只恢复缺省表单，不查询、不清列表、不改已生效条件与游标；查询后切换回正确日志恢复其完整状态不重新查询。
- 重新进入（含再次点击当前菜单）：错误日志重新默认首查，正确日志恢复到“缺省条件已填充但未查询”，页面代次 + 请求令牌作废旧响应，不覆盖新状态。

## 5. 验证结果

### 5.1 前端

```text
npm test       → 8 个测试文件 56 例全部通过
npm run build  → BUILD SUCCESS（Vite 生产构建，存在大 chunk 提示为既有情况，非失败）
```

### 5.2 后端

```text
mvn -Dtest='com.bsoft.cdcconfig.logquery.**' test  → 136 例全部通过，0 失败 0 错误
mvn clean package -DskipTests                      → BUILD SUCCESS
```

`LogQueryConfigTest` 由 8 例增至 9 例（新增 dev-yml 固定密钥绑定与往返测试）。

### 5.3 后端完整测试与干净基线复现

`mvn clean test` 全量存在 4 例失败（`OracleDateMappingTest.oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly` 期望 27 实得 30；`JobFailureServiceTest.latestFaultShouldHaveCorrectRestartCount` 期望 1 实得 4；`failureDetail_eventNotInFaultProcess_shouldThrow` 期望 40006 实得 40401；`failureDetailByEvent_shouldReturnContent` 抛业务异常），集中在 `monitor.jobfailure` 域，依赖开发库实时数据。已在授权基线提交 `c237b8c` 的干净 detached worktree 中复现完全一致，判定为任务开始前已存在的既有无关失败，本任务未引入失败、未擅自扩大修复范围。

## 6. 开发库只读联调（问题 1 实证）

后端以 `CDC_LOG_QUERY_ENABLED=true` 重启（开发环境进程级临时设置）后，针对 `CDC_LOG_ERROR`（开发库 400+ 行）只读验证：

- 第 1 页：返回 100 条 + `nextCursor`，不再抛 `IllegalStateException`。
- 第 2 页：携带第 1 页 `nextCursor` 请求成功，排序稳定（`TARGET_TIME` 降序、同时间 `CDC_LOG_ID` 降序）。
- 第 1 页重复请求：结果幂等。
- 篡改游标：返回 `40015 CURSOR_INVALID`（“游标无效或已过期，请重新查询第一页”）。
- 带过滤条件（源数据源 ID）翻页：条件指纹校验通过，翻页继续生效。

全部为只读 `SELECT` 联调；未执行任何数据库写操作。

## 7. 文档同步说明

受新规则影响、此前依赖“正确日志首次切换自动执行缺省查询”旧行为得出的既有验收 `PASS`（`LQ-AC-004 / 016 / 020 / 135 / 177`）不再冒充有效 PASS，按文档现有状态体系改为 `NOT_RUN` 并改写预期结果；新增 `LQ-AC-004A~004D`（未查询引导态、手动查询触发单次请求、查询后切换回状态保留、重置保留列表/已生效条件、重新进入后旧响应不覆盖新状态）。REQUIREMENTS / DESIGN / UI / ACCEPTANCE 四份基线均追加本任务修订记录，保留历史记录原样；生产阻断边界（`CDC_LOG_QUERY_ENABLED` 保持 `false`）、5 个 `DEFERRED_UNTIL_PHYSICAL_DESIGN` 用例、原四接口不判断开关边界均未改变。

## 8. 声明与约束遵守

- 分支 `develop`，未创建/切换其他分支，未 force push，未改写历史。
- 未执行数据库写操作（INSERT/UPDATE/DELETE/MERGE/DDL/PLSQL）；未操作 ZooKeeper。
- 生产配置不携带游标密钥；`CDC_LOG_QUERY_ENABLED` 生产保持 `false`；密钥值不扩散到前端、接口、日志、其他文档与本报告正文。
- 用户任务开始前既有的 `9` 个已修改文件与 `130` 个未跟踪文件/目录全程原样保留，未修改、未覆盖、未暂存、未提交、未清理。
- 未删除或弱化既有测试；仅新增与调整本任务相关测试。
- 状态止步 `IMPLEMENTED_PENDING_REVIEW`，未自评 `IMPLEMENTED_ACCEPTED`，未收口 README。

## 9. 已知问题与遗留

- 后端完整测试 4 例既有失败（§5.3）属任务开始前已存在的开发库实时数据依赖问题，留待相应域任务处理，本任务不顺手修复。
- 正确日志/错误日志视觉与交互需用户按新规则人工复审验收（对应 ACCEPTANCE 中 `NOT_RUN` 用例）。
- 生产游标密钥、轮换与安全加固不在本任务范围（用户明确要求不引入 Vault/KMS/轮换/安全重构）。

---

## 10. R1 复审修订章节（LOG-QUERY-CURSOR-CORRECT-TAB-ADJUSTMENT-001-R1，2026-08-25）

> 本章节为对提交 `ab7bf528e4c68b1f7a71b1d5f66861aac4fe801c` 的 ChatGPT 代码复审定向修订的当前结论。§1~§9 为初版任务当时记录；本 R1 章节为当前结论。

### 10.1 修订概述

本任务为微调修订，只处理三个已明确问题，不重新设计日志查询，不扩大到游标算法、Tab 结构、查询条件、超时机制、物理索引或生产安全改造：

1. 错误日志初始化期间误显示"正确日志数据量较大"引导文案（R1-01）。
2. 正确日志第一次手动查询后 `initialQueryAttempted` 未变为 `true`（R1-02）。
3. `LQ-AC-119 / 120 / 125` 三个证据不足用例仍错误保留为 `PASS`，恢复为 `NOT_RUN` 并修正当前有效统计（R1-03）。

### 10.2 R1-01 错误日志初始化误显示正确日志引导

**触发链**：状态接口返回 `enabled=true` 后 `loadStatus()` 以 `void initNormal()` 启动正常初始化；`initNormal()` 对两 Tab 执行 `reinitialize()`，错误日志此时 `applied === null`，`deriveTabQueryStatus(errorTab)` 返回 `NOT_QUERIED`；当前激活 Tab 仍为错误日志；`LogQueryTable.vue` 原实现对所有 `NOT_QUERIED` 无条件显示固定文案，导致候选接口稍慢时用户会在"错误日志"Tab 中看到属于正确日志的引导。

**修复条件**："正确日志数据量较大"引导只在 `logType === 'correct' && queryStatus === 'NOT_QUERIED'` 同时成立时显示（`LogQueryTable.vue` 新增 `showGuide` 推导）。错误日志无论处于初始化候选加载、默认查询前、失败、空数据或成功状态，都绝不显示正确日志引导；不得把错误日志初始化状态伪装成"正确日志尚未查询"。

**行为保持**：错误日志默认查询真正开始后既有查询遮罩、旋转图标、动态等待秒数与慢查询提示继续正常；正确日志首次切换后的引导文案、弱提示、无"暂无数据"、无加载遮罩行为保持不变；正确日志查询成功空数据后必须显示"当前查询条件下暂无日志"，不得重新显示首次引导。错误日志候选加载期间沿用空白表格/既有锁定表现，不出现错误文案。

**回归测试**：`LogQueryTable.spec.ts` 新增错误日志 `NOT_QUERIED`/`LOADING` 组件用例；`LogQueryPage.spec.ts` 真实挂载 `LogQueryTable` 覆盖候选 deferred 期间激活错误日志不显示引导、无正确日志请求、候选完成后仅一次错误日志默认查询、错误日志默认查询在途显示加载表现、正确日志 `NOT_QUERIED` 仍显示两行引导、切换 Tab 返回不自动请求。

### 10.3 R1-02 正确日志手动查询未更新 initialQueryAttempted

**不一致**：`ACCEPTANCE.md` 要求正确日志第一次点击"查询"真正发起请求后 `initialQueryAttempted` 必须为 `true`，且无论成功、业务失败、网络失败或超时都保持 `true`；原实现只有 `initialQuery()` 设置该字段，正确日志经用户点击调用的是 `query()`，其中未设置该字段。

**修复语义**（`useLogQueryTab.ts` 的 `query()`）：在途请求被 `state.loading` 拒绝不改变标志；表单校验失败、没有真正发起请求不改变标志；表单校验通过且准备真正调用 `runSearch()` 时置 `state.initialQueryAttempted = true`；请求成功、业务失败、网络失败、前端超时后均保持 `true`；后续再次查询保持 `true`；`reinitialize()` 仍将其重置为 `false`；错误日志 `initialQuery()` 既有行为不回退；切换 Tab 仍不得依赖该字段触发正确日志自动查询。

**状态断言**：创建/重新初始化后 `false`；首次切换尚未点击查询时 `false`；校验失败时 `false` 且不调用 API；手动查询成功后 `true`；业务错误后 `true`；网络错误或超时后 `true`；后续查询保持 `true`；完整重新初始化后恢复 `false`。

### 10.4 R1-03 三个证据不足验收用例恢复 NOT_RUN

- `LQ-AC-119`（查询按钮加载状态与控件禁用）：既有证据主要覆盖初始化锁定，不等于普通用户查询 `loading=true` 期间的真实控件状态，也没有足够的人工 UI 截图。
- `LQ-AC-120`（前端请求 30 秒超时）：既有证据只证明请求代码静态设置 `timeout: 30000`，没有实际模拟超过 30 秒未返回并验证前端结束加载、进入可操作错误态。
- `LQ-AC-125`（超时提示可操作）：既有证据是后端 25 秒语句超时/50020 路径或静态错误映射，不是"制造前端 30 秒超时并观察页面提示"。
- 处理：三例从 `PASS` 恢复为 `NOT_RUN`，各用例旁注明证据不足原因；不写成 `FAIL`/`BLOCKED`（当前没有实现错误的证据，只是尚未完成对应验收）。保留 `LOG-QUERY-DEVELOPMENT-ACCEPTANCE-EXECUTION-001` 当时"121 PASS"历史执行记录原貌，并明确该数字是当时记录，不是当前有效状态。

**当前有效状态统计**（脚本核对）：`113 PASS / 58 NOT_RUN / 8 BLOCKED / 5 DEFERRED_UNTIL_PHYSICAL_DESIGN = 184`。用例编号总数为 184、唯一且无重复；执行状态总数为 184；五个延期用例仍精确为 `LQ-AC-164 / 165 / 171 / 172 / 173`；没有新增伪造的 `PASS / FAIL / BLOCKED`。

### 10.5 修改文件清单

- `frontend/src/views/log-query/components/LogQueryTable.vue`
- `frontend/src/views/log-query/components/LogQueryTable.spec.ts`
- `frontend/src/views/log-query/composables/useLogQueryTab.ts`
- `frontend/src/views/log-query/composables/useLogQueryTab.spec.ts`
- `frontend/src/views/log-query/LogQueryPage.spec.ts`
- `docs/features/log-query/ACCEPTANCE.md`
- `docs/features/log-query/reports/LOG-QUERY-CURSOR-CORRECT-TAB-ADJUSTMENT-001.md`（本报告，追加 R1 章节）

未修改后端生产代码、`application-dev.yml`、REQUIREMENTS / DESIGN / UI 三份业务基线、README、菜单、主题或布局。

### 10.6 前后端测试与构建结果

- 前端 `npm test`：8 个测试文件 70 例全部通过（新增 14 例）。
- 前端 `npm run build`：BUILD SUCCESS（大 chunk 提示为既有情况）。
- 后端 `mvn -Dtest='com.bsoft.cdcconfig.logquery.**' test`：136 例全部通过，0 失败 0 错误。
- 后端 `mvn clean package -DskipTests`：BUILD SUCCESS。

### 10.7 Git 开始/结束状态

- 授权基线：`ab7bf528e4c68b1f7a71b1d5f66861aac4fe801c`；任务开始前本地 HEAD == `origin/develop` == 基线，ahead/behind 为 `0 0`。
- 结果提交：见本任务提交与推送段；普通 push 后本地 HEAD 与 `origin/develop` 一致，ahead/behind 为 `0 0`。
- 提交后建立 detached 临时 worktree 检出结果提交，仅基于提交内容重新执行前端全部测试、前端构建、后端日志查询专项测试、后端打包与 ACCEPTANCE 用例数量/状态统计脚本，验证通过后删除临时 worktree，不影响主工作区。

### 10.8 声明与约束遵守

- 分支 `develop`，未创建/切换其他分支，未 force push，未改写历史。
- 未修改后端生产代码、`application-dev.yml`、REQUIREMENTS / DESIGN / UI 三份业务基线、README、菜单、主题或布局；`cdc.log-query.cursor-secret` 固定开发密钥保持原值和原位置。
- 未执行数据库写操作（INSERT/UPDATE/DELETE/MERGE/DDL/PLSQL）；未操作 ZooKeeper；生产 `CDC_LOG_QUERY_ENABLED` 保持 `false`。
- 用户既有已修改文件与未跟踪文件全程原样保留，未修改、未覆盖、未暂存、未提交、未清理。
- 未删除或弱化既有测试；仅新增与调整本任务相关测试。
- 状态止步 `IMPLEMENTED_PENDING_REVIEW`，未自评 `IMPLEMENTED_ACCEPTED`，未收口 README，未执行正式验收；下一步仅限 ChatGPT 代码复审。
