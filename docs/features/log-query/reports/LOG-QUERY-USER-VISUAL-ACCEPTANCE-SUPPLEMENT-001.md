# 日志查询用户视觉验收补充记录与可执行用例重新核验报告（LOG-QUERY-USER-VISUAL-ACCEPTANCE-SUPPLEMENT-001）

- 任务编号：`LOG-QUERY-USER-VISUAL-ACCEPTANCE-SUPPLEMENT-001`
- 执行日期：2026-08-25
- 关联文档：`docs/features/log-query/ACCEPTANCE.md`
- 任务性质：用户视觉验收补充记录 + 当前可执行验收用例重新核验；非代码功能修复任务。
- 授权基线提交：`f7309403c88635854eaf3504a687365f0a18d931`
- 报告状态：补充验收记录（`ACCEPTANCE_SUPPLEMENT_EXECUTED_PENDING_CHATGPT_REVIEW`），不构成实现收口、代码批准或生产启用批准。

---

## 1. 授权基线、Git 开始状态与用户工作区保护

任务开始前执行的 Git 检查（结果与授权基线一致）：

| 检查项 | 结果 |
|---|---|
| 当前分支 | `develop` |
| 本地 HEAD | `f7309403c88635854eaf3504a687365f0a18d931` |
| 远程 `origin/develop` | `f7309403c88635854eaf3504a687365f0a18d931` |
| `git rev-list --left-right --count HEAD...origin/develop` | `0 0`（本地与远程一致，无分叉） |

- 本地 HEAD 与 `origin/develop` 均等于授权基线，ahead/behind 为 `0 0`，符合任务 §2 要求，未触发停线。
- 用户既有已修改文件与未跟踪文件全部属于用户资产，逐项登记并保持原样，未覆盖、删除、清理、暂存或提交任何无关内容。
  - 本任务相关的已修改文件（授权范围）：`docs/features/log-query/ACCEPTANCE.md`。
  - 本任务相关的新增文件（授权范围）：`docs/features/log-query/reports/LOG-QUERY-USER-VISUAL-ACCEPTANCE-SUPPLEMENT-001.md`（本报告）、`frontend/src/api/logQuery.spec.ts`、`frontend/src/views/log-query/components/CursorPagination.spec.ts`。
  - 本任务相关的已修改测试文件（授权范围）：`frontend/src/views/log-query/LogQueryPage.spec.ts`、`frontend/src/views/log-query/components/LogQueryFilter.spec.ts`、`frontend/src/views/log-query/components/LogQueryTable.spec.ts`、`frontend/src/views/log-query/composables/useLogQueryTab.spec.ts`。
  - 除上述文件外，`git status --short` 中出现的其余已修改/未跟踪内容均为用户既有资产，未作任何处理。

---

## 2. 用户于 2026-08-25 完成的五类真实页面确认

用户已打开最新开发页面并亲自操作，明确确认以下五类项目全部没有问题，记录为 `USER_VISUAL_CONFIRMATION_2026-08-25`：

1. **正确日志首次切换（未查询引导态）**：第一次切换到"正确日志"时不自动查询；默认条件已填充（当前自然日、源库/目标库"全部"、表名为空）；显示"正确日志数据量较大，请设置查询条件后点击'查询'"及辅助提示；不显示"暂无数据"；不显示查询旋转图标、等待秒数或慢查询提示；上一页、下一页不可用。
2. **点击"查询"后的加载态**：正常显示加载遮罩和等待秒数；当前查询控件和分页操作处于禁用状态，避免重复操作。
3. **查询成功后的结果替换**：未查询引导自然替换为结果表格。
4. **正确日志查询成功后切换 Tab 再切回**：不重复查询；正确日志已有查询结果得到保留。
5. **错误日志超过 100 条的真实游标翻页**：第一页显示 100 条；"下一页"可用；点击下一页正常取得后续记录；不再发生 `LogQuery cursor secret is not configured`。

---

## 3. 用户截图属于外部会话证据、未提交仓库的声明

- 用户提供了两张外部会话截图：一张为正确日志首次未查询引导，一张为错误日志查询加载状态。
- 截图位于 ChatGPT 会话附件，**不在本 Git 仓库中**。
- 本报告不虚构任何仓库截图文件路径、哈希、附件名称，也不声称截图已提交到 Git。
- 人工确认仅与现有自动化测试、代码证据组合使用；若某用例还包含用户没有实际执行的关键步骤，未仅凭相似截图判定 `PASS`（例如 `LQ-AC-004D` 与 `LQ-AC-120 / 125` 均依赖真实组件/接口模拟测试逐项复核，而非仅凭截图）。

---

## 4. 每个从 `NOT_RUN` 变更为其他状态的用例及证据

本任务将 17 个原 `NOT_RUN` 用例更新为 `PASS`，每个用例给出执行方式、实际结果、自动化测试/用户确认映射、代码/界面证据与判定理由。

### 4.1 LQ-AC-002 双 Tab 顺序与默认 Tab → PASS

- 执行方式：页面真实操作 + 前端组件测试。
- 实际结果：两个 Tab，顺序为"错误日志"在前、"正确日志"在后；默认打开"错误日志"。
- 测试映射：`LogQueryPage.spec.ts` → `两个 Tab 顺序为错误日志在前、正确日志在后，默认打开错误日志（LQ-AC-002）`。
- 代码证据：`LogQueryPage.vue` 的 `tabs` 数组 `[{key:'error',label:'错误日志'},{key:'correct',label:'正确日志'}]`，`activeTab` 默认 `'error'`。
- 判定理由：用户真实页面确认 + 组件测试双重证据，完整满足预期。

### 4.2 LQ-AC-004 正确日志第一次切换只初始化缺省条件，点击"查询"才首次查询 → PASS

- 执行方式：页面真实操作 + 前端组件/状态测试。
- 实际结果：首次进入未出现 `logType=correct` 请求；首次切换只填充缺省条件并显示引导、不查询、无加载遮罩/等待秒数/慢查询提示、不显示"暂无数据"、状态 `NOT_QUERIED`；点击"查询"后才发起首次 `correct` 请求，`initialQueryAttempted` 置为 `true`（无论成功、业务失败、网络失败或超时）。
- 测试映射：
  - `LogQueryPage.spec.ts` → `第一次切换到正确日志不调用正确日志列表 API，缺省条件已初始化`；`用户点击正确日志"查询"后才恰好发起一次列表请求`。
  - `useLogQueryTab.spec.ts` → `正确日志缺省查询与查询状态推导（LOG-QUERY-CURSOR-CORRECT-TAB-ADJUSTMENT-001）` 中 `缺省条件直接点击查询：请求为当天时间范围且不携带"全部"的具体数据源 ID 数组`；`initialQueryAttempted` 相关用例（R1-02-4/5/6）。
  - 用户确认映射：`USER_VISUAL_CONFIRMATION_2026-08-25` 第 1、2 类。
- 判定理由：任务 §5.1 明确 `LQ-AC-004` 已具用户真实操作确认 + 提交 `f730940` 中组件/页面自动化测试，重新执行后证据完整。

### 4.3 LQ-AC-004A 正确日志未查询引导态不混淆空数据与加载态 → PASS

- 执行方式：页面真实操作 + 前端组件测试。
- 实际结果：未查询状态显示引导文案，不显示"暂无数据"（与 `SUCCESS_EMPTY` 区分），不显示加载遮罩/旋转图标/等待秒数/慢查询提示；分页按钮不可用。
- 测试映射：`LogQueryTable.spec.ts` → `正确日志 NOT_QUERIED：显示引导文案，不显示"暂无数据"，无加载遮罩与等待秒数`；`LogQueryPage.spec.ts` → `正确日志 NOT_QUERIED 引导两行文案在页面真实挂载下仍显示（R1-01-6）`。
- 用户确认映射：`USER_VISUAL_CONFIRMATION_2026-08-25` 第 1 类。
- 判定理由：引导两行文案、加载遮罩、等待秒数、分页不可用均被真实挂载测试与用户确认覆盖。

### 4.4 LQ-AC-004B 正确日志手动查询触发单次请求且成功后进入有数据状态 → PASS

- 执行方式：页面真实操作 + 前端组件/状态测试。
- 实际结果：点击"查询"恰好触发一次 `POST /api/log-query/logs/search`（`logType=correct`）；请求期间显示加载遮罩；成功有数据 `SUCCESS_WITH_DATA`，成功无数据 `SUCCESS_EMPTY`，失败 `FAILED`；未查询态不产生请求。
- 测试映射：`LogQueryPage.spec.ts` → `用户点击正确日志"查询"后才恰好发起一次列表请求`；`useLogQueryTab.spec.ts` → `手动查询成功后为 true（R1-02-4）`、`后续再次查询保持 true`；`查询状态推导覆盖 NOT_QUERIED/LOADING/SUCCESS_WITH_DATA/SUCCESS_EMPTY/FAILED`。
- 用户确认映射：`USER_VISUAL_CONFIRMATION_2026-08-25` 第 2、3 类。
- 判定理由：单次请求、四种状态推导、加载遮罩均有测试证据，用户真实点击确认。

### 4.5 LQ-AC-004C 正确日志查询后切换回保留状态且不重新查询 → PASS

- 执行方式：页面真实操作 + 前端组件/状态测试。
- 实际结果：切回正确日志恢复表单、已生效条件、列表、错误与游标历史，不重新发起查询；错误日志状态不被覆盖。
- 测试映射：`LogQueryPage.spec.ts` → `正确日志查询后切换 Tab 再返回不自动重查且保留结果`；`正确日志手动查询成功后，切换 Tab 返回不再自动请求且保留结果（R1-02-7 页级）`。
- 用户确认映射：`USER_VISUAL_CONFIRMATION_2026-08-25` 第 4 类。
- 判定理由：用户真实操作确认 + 页级测试双重证据。

### 4.6 LQ-AC-004D 正确日志重置保留列表与已生效条件，重新进入恢复未查询态 → PASS

- 执行方式：前端组件/状态测试逐项执行（本用例未获得用户亲自完整执行声明，全部依赖真实组件/状态测试复核）。
- 实际结果（两部分均覆盖）：
  - 重置只把表单恢复为缺省，不发起查询、不清空列表、不改已生效条件与游标历史、清除 `validationError`。
  - 重新进入且 `enabled=true` 后正确日志恢复到 `NOT_QUERIED`，旧页面在途响应不覆盖新状态。
- 测试映射：
  - 重置部分：`useLogQueryTab.spec.ts` → `重置清除校验错误但保留列表、已生效条件和游标（LQ-DESIGN-172）`；`正确日志重置不触发查询，并保留已生效条件与列表（表单/已生效条件分离）`。
  - 重新进入部分：`useLogQueryTab.spec.ts` → `重新初始化后旧请求响应被丢弃（LQ-DESIGN-179）`、`完整重新初始化后恢复为 false（R1-02-8）`；`LogQueryPage.spec.ts` → `旧页面代次中的正确日志响应不得覆盖重新初始化后的尚未查询状态`。
- 判定理由：任务 §5.1 要求 `LQ-AC-004D` 必须依靠真实组件/状态测试逐项重新执行；本任务两条关键路径（重置保留 + 重新进入旧响应失效）均被独立测试覆盖，无缺失关键证据。

### 4.7 LQ-AC-016 重新进入后正确日志恢复"缺省条件已填充但未查询" → PASS

- 执行方式：前端组件/状态测试。
- 实际结果：重新进入且 `enabled=true` 时仅错误日志自动首查；正确日志不查询，恢复 `NOT_QUERIED` 并显示引导，直到点击"查询"。
- 测试映射：`LogQueryPage.spec.ts` → `同路由再次点击菜单后错误日志重新默认查询、正确日志恢复尚未查询`；`useLogQueryTab.spec.ts` → `完整重新初始化后恢复为 false（R1-02-8）`。
- 判定理由：页级重新初始化测试覆盖完整预期，无用户必须亲自执行且未执行的关键步骤。

### 4.8 LQ-AC-037 正确日志第一次切换按切换时自然日填充缺省时间且不查询 → PASS

- 执行方式：前端组件/状态测试。
- 实际结果：正确日志缺省时间按切换时所在自然日生成 `00:00:00`–`23:59:59`，仅填充缺省条件不发起查询，状态 `NOT_QUERIED`。
- 测试映射：`LogQueryPage.spec.ts` → `第一次切换到正确日志不调用正确日志列表 API，缺省条件已初始化`（断言 `form.timeRange` 等于 `currentNaturalDay()`）；`useLogQueryTab.spec.ts` → `缺省条件直接点击查询：请求为当天时间范围`（断言 `startTime/endTime` 等于 `currentNaturalDay()`）。
- 判定理由：切换时自然日由 `currentNaturalDay()` 实时计算并在页级/状态级测试中断言，覆盖完整预期。

### 4.9 LQ-AC-059 分页条仅显示上一页/下一页 → PASS

- 执行方式：前端组件测试 + 用户真实页面确认。
- 实际结果：分页条仅显示"上一页/下一页"两个按钮，不显示页码、当前页次、数字输入、总数、`pageSize` 控件。
- 测试映射：`CursorPagination.spec.ts` → `仅渲染上一页/下一页两个按钮，无页码、无总数、无跳页输入（LQ-AC-059/060）`。
- 用户确认映射：`USER_VISUAL_CONFIRMATION_2026-08-25` 第 1 类（未查询态分页不可用）与第 5 类（错误日志真实游标翻页仅两个按钮）。
- 判定理由：任务 §5.3 要求 `LQ-AC-059 / 060` 视觉用例必须根据用户截图和实际页面结构逐项核对，证据完整改为 `PASS`。

### 4.10 LQ-AC-060 无页码跳转 → PASS

- 执行方式：前端组件测试 + 用户真实页面确认。
- 实际结果：不存在页码列表、数字输入、跳页按钮、"第 N 页共 M 页"导航；除上一页/下一页外无其他翻页方式。
- 测试映射：`CursorPagination.spec.ts` → `仅渲染上一页/下一页两个按钮…`（断言无 `.el-pagination`、无 `.el-pagination__jump`、无 `input[type="number"]`）。
- 用户确认映射：`USER_VISUAL_CONFIRMATION_2026-08-25` 第 5 类。
- 判定理由：页面结构与用户实际操作均无页码跳转，证据完整。

### 4.11 LQ-AC-116 查询开始立即显示加载 → PASS

- 执行方式：前端组件/状态测试 + 用户真实页面确认。
- 实际结果：请求开始立即进入加载态（半透明遮罩、旋转图标、文案"正在查询错误日志/正确日志，请稍候"），且保留原列表不先清空。
- 测试映射：`useLogQueryTab.spec.ts` → `查询开始立即进入加载并保留原列表不先清空（LQ-AC-116）`；`LogQueryPage.spec.ts` → `错误日志默认查询在途时仍显示查询遮罩、旋转图标与等待秒数（R1-01-5）`。
- 用户确认映射：`USER_VISUAL_CONFIRMATION_2026-08-25` 第 2 类。
- 判定理由：加载立即出现 + 原列表保留两条断言均有测试证据，用户真实点击确认。

### 4.12 LQ-AC-117 动态显示已等待秒数 → PASS

- 执行方式：前端状态测试（fake timer）+ 用户真实页面确认。
- 实际结果：加载期间动态显示已等待秒数（纯文本更新），请求结束后停止递增。
- 测试映射：`useLogQueryTab.spec.ts` → `查询期间等待秒数动态递增并在请求结束后停止（LQ-AC-117）`（`vi.advanceTimersByTimeAsync` 断言 `elapsed` 0→2→5 后冻结）。
- 用户确认映射：`USER_VISUAL_CONFIRMATION_2026-08-25` 第 2 类（等待秒数可见）。
- 判定理由：虚拟时间下秒数逐秒递增与停止均被客观断言。

### 4.13 LQ-AC-118 超过 3 秒显示慢查询提示 → PASS

- 执行方式：前端组件测试。
- 实际结果：超过 3 秒后追加"查询耗时较长，请耐心等待"提示；恰好 3 秒不显示。
- 测试映射：`LogQueryTable.spec.ts` → `超过 3 秒显示慢查询提示（LOG-QUERY-USER-VISUAL-ACCEPTANCE-SUPPLEMENT-001 / LQ-AC-118）`（`elapsed=3` 不显示，`elapsed=5` 显示）。
- 判定理由：组件级 `elapsed > 3` 边界被直接断言，覆盖完整预期。

### 4.14 LQ-AC-119 查询按钮加载状态与控件禁用 → PASS

- 执行方式：前端组件测试 + 用户真实页面确认。
- 实际结果（任务 §5.2 要求的关键项全部覆盖）：
  - 查询按钮显示加载状态（`is-loading`）；
  - 当前 Tab 查询控件、查询、重置、分页按钮暂时禁用（下拉 `is-disabled`、输入禁用、按钮禁用）；
  - 点击禁用按钮不触发 query/reset 事件；
  - 仍允许切换到另一 Tab。
- 测试映射：
  - `LogQueryFilter.spec.ts` → `loading=true 时源库/目标库下拉、表名输入、时间范围、查询/重置按钮全部禁用`、`查询按钮显示加载状态（is-loading）`、`loading=true 时点击查询/重置不触发事件`。
  - `CursorPagination.spec.ts` → `loading=true 时上一页/下一页同时禁用（LQ-AC-119）`。
  - `LogQueryPage.spec.ts` → `普通用户查询在途（loading=true 且初始化已结束）时仍允许切换到另一 Tab（LQ-AC-119）`。
- 用户确认映射：`USER_VISUAL_CONFIRMATION_2026-08-25` 第 2 类（查询控件和分页操作禁用）。
- 判定理由：任务 §5.2 特别要求 `LQ-AC-119` 必须覆盖"仍允许切换另一 Tab"；该关键项由页级测试明确断言（普通查询在途而非初始化锁定态），加上控件禁用、按钮加载态、事件阻断测试，证据完整。

### 4.15 LQ-AC-120 前端请求 30 秒超时 → PASS

- 执行方式：前端接口层测试（自定义 Axios 适配器 + fake timer）+ 前端状态测试（fake timer）+ 无业务代码修改。
- 实际结果：日志查询五个函数均显式携带请求级 `timeout: 30000`，覆盖全局 10 秒默认且不改动全局；30 秒边界到达后请求以 `ECONNABORTED`/`timeout of 30000ms exceeded` 结束并进入超时错误路径；`loading=false`、等待计时停止、不无限旋转；不自动重试。
- 测试映射：`logQuery.spec.ts` → 两个用例；`useLogQueryTab.spec.ts` → `请求超过 30 秒未返回时进入超时错误路径，加载结束、计时停止、不自动重试（LQ-AC-120）`。
- 判定理由：任务 §6.1 五项要求全部满足，详见本报告 §6 专项说明。仅静态检查 `timeout: 30000` 已由客观边界模拟取代。

### 4.16 LQ-AC-125 超时提示可操作 → PASS

- 执行方式：前端状态测试（fake timer）+ 无业务代码修改。
- 实际结果：模拟前端超时后显示明确提示"查询超时，请缩小查询范围或增加筛选条件后重试"；查询前已有列表、已生效条件与游标历史保持不变；查询条件仍可编辑、可再次手动查询；不自动重试；加载遮罩与等待计时结束。
- 测试映射：`useLogQueryTab.spec.ts` → `超时后旧列表、已生效条件与游标保留，表单可编辑、可再次查询、不自动重试（LQ-AC-125）`。
- 判定理由：任务 §6.2 六项要求全部满足，详见本报告 §6 专项说明。

### 4.17 LQ-AC-177 enabled=true 正常初始化并默认查询错误日志 → PASS

- 执行方式：前端组件测试 + 用户真实页面确认。
- 实际结果：先调用状态接口返回 `enabled=true`；随后加载数据源选项，并按既有规则执行错误日志默认查询；正确日志第一次切换只初始化缺省条件不自动查询。
- 测试映射：`LogQueryPage.spec.ts` → `enabled=true 后加载候选并默认查询错误日志（LQ-AC-177）`、`候选加载完成后才发起默认错误日志查询（R1-03 / LQ-DESIGN-177）`。
- 用户确认映射：`USER_VISUAL_CONFIRMATION_2026-08-25` 第 2 类。
- 判定理由：初始化顺序（状态→候选→默认查询）与默认查询 `logType=error` 均有测试证据，用户真实页面确认。

---

## 5. 58 个原 `NOT_RUN` 用例完整处置表

基线初始状态：`113 PASS / 58 NOT_RUN / 8 BLOCKED / 5 DEFERRED`，合计 184。

58 个原 `NOT_RUN` 用例处置结果：

| 处置类别 | 数量 | 用例列表 |
|---|---|---|
| `EXECUTED_PASS`（本任务重新执行，证据完整，更新为 `PASS`） | 17 | LQ-AC-002 / 004 / 004A / 004B / 004C / 004D / 016 / 037 / 059 / 060 / 116 / 117 / 118 / 119 / 120 / 125 / 177 |
| `EXECUTED_FAIL`（重新执行发现不符合预期，更新为 `FAIL`） | 0 | — |
| `KEEP_NOT_RUN_USER_ACTION_REQUIRED`（仍需用户未完成的真实视觉/交互操作） | 40 | LQ-AC-006 / 007 / 008 / 014 / 020 / 021 / 022 / 025 / 026 / 029 / 032 / 036 / 038 / 056 / 081 / 085 / 086 / 087 / 088 / 089 / 090 / 092 / 094 / 110 / 111 / 114 / 122 / 131 / 132 / 133 / 135 / 147 / 148 / 149 / 150 / 151 / 152 / 153 / 154 / 169 |
| `KEEP_NOT_RUN_ENVIRONMENT_REQUIRED`（需要当前没有的可控环境或数据） | 0 | — |
| `KEEP_NOT_RUN_EVIDENCE_INSUFFICIENT`（现有证据不足） | 0 | — |
| `KEEP_NOT_RUN_OUT_OF_SCOPE`（不属于本轮补充验收范围） | 1 | LQ-AC-163（日志量级聚合开发库整体验证，超出用户五类确认与可执行前端/接口用例范围） |
| **合计** | **58** | |

> 注：另外 3 个原 `BLOCKED` 用例（LQ-AC-104 / 106 / 107）经阻断复核解除后转为 `NOT_RUN`，不属于上述 58 个原 `NOT_RUN` 集合；其复核证据见 §7。最终 `NOT_RUN` 数 = 58 − 17 + 3 = 44。

### 40 个 `KEEP_NOT_RUN_USER_ACTION_REQUIRED` 的保留理由

这 40 个用例均需要用户对真实页面进行尚未完成的视觉/交互确认或构造特定数据场景，本任务未获得对应的人工确认且自动化测试无法替代：

- 视觉展示类（需人工截图确认）：LQ-AC-006（Tab 标题不显示总数）、007（不展示总数）、008（无当前页次）、085（详情弹窗内容展示）、086（原始消息弹窗展示）、087（原文/格式化视觉区分）、088（格式化渲染效果）、089（非 JSON 原文展示）、090（空内容展示）、092（摘要与详情一致性）、122（弹窗独立加载态）、147（表格纵向滚动条唯一）、148（布局）、149（滚动条统一）、150（无横向滚动条）、151（表格列宽）、152（行高）、153（斑马纹/间隔）、154（超长文本截断）。
- 交互操作类（需用户亲自操作）：LQ-AC-014（查询时禁用提交等交互）、020（首次查询失败后手动查询）、021（失败后重置可恢复）、022（重置清除校验错误的人工确认）、025（无数据分页按钮）、026（数据源候选降级的人工确认）、029（超时与网络错误人工确认）、032（空数据与失败区分人工确认）、036（跨 Tab 独立人工确认）、038（重置按点击时自然日人工确认）、056（详情弹窗加载错误人工确认）、081（详情与原始消息弹窗操作）、094（翻页保留筛选条件人工确认）、110（大 CLOB 展示人工确认）、111（大 CLOB 摘要截断人工确认）、114（原始消息弹窗关闭清理人工确认）、131（游标失效 UI 人工确认）、132（游标条件失配 UI 人工确认）、133（返回码提示文案人工确认）、135（查询触发事件收口人工确认）、169（菜单可点击人工确认）。

这些用例在 ACCEPTANCE.md 中继续保持 `NOT_RUN`，未因本任务批量改动。

---

## 6. LQ-AC-120 / LQ-AC-125 专项模拟方法和结果

### 6.1 方法总览（两层客观证据）

本任务只允许新增测试代码、不允许修改业务代码。由于 jsdom 无真实网络，采用"接口层适配器模拟 + 组合式函数层状态模拟"两层证据共同证明前端 30 秒超时行为：

1. **接口层**（`frontend/src/api/logQuery.spec.ts`）：
   - 用例 1：`vi.spyOn(http,'post')`/`vi.spyOn(http,'get')`，断言五个日志查询函数（`searchLogs`/`getLogQueryStatus`/`fetchDataSourceOptions`/`fetchLogDetail`/`fetchRawMessage`）都显式携带请求级 `timeout: 30000`；同时断言 `http.defaults.timeout === 10000`，证明请求级覆盖不影响全局及其他 API。
   - 用例 2（客观边界）：自定义 `timeoutAdapter` 模拟 Axios xhr 适配器，在 `config.timeout` 毫秒后以 `{code:'ECONNABORTED', message:'timeout of Nms exceeded'}` 中止；用 `vi.useFakeTimers({ toFake:['setTimeout','clearTimeout'] })` 证明：第 29999ms 请求仍未结束（`settled===false`），第 30000ms 边界请求结束（`settled===true`），错误 `code==='ECONNABORTED'`、`message==='timeout of 30000ms exceeded'`。这是对"Axios 请求按自身 timeout 配置在边界超时"的客观证明，取代"仅静态检查 `timeout: 30000`"。
2. **组合式函数层**（`useLogQueryTab.spec.ts`，新增 describe `查询加载等待与前端 30 秒超时`）：
   - `vi.useFakeTimers({ toFake:['setTimeout','clearTimeout','setInterval','clearInterval'] })`，`mockedSearch` 在第 30000ms 以 `Object.assign(new Error('timeout of 30000ms exceeded'),{code:'ECONNABORTED'})` 拒绝，验证 `runSearch` 的超时错误路径：错误信息、`loading`、`elapsed` 冻结、状态 `FAILED`、不自动重试。

### 6.2 LQ-AC-120 五项要求逐项对照

| §6.1 要求 | 证据 |
|---|---|
| 1. 请求级 `timeout: 30000` 覆盖全局但不影响其他 API | `logQuery.spec.ts` 用例 1：五个函数均携带 `{timeout:30000}`，`http.defaults.timeout===10000` 不变 |
| 2. 可控 fake timer/deferred/模拟适配器表示请求超 30 秒未返回 | `logQuery.spec.ts` 用例 2 自定义 `timeoutAdapter`；`useLogQueryTab.spec.ts` deferred + fake timers |
| 3. 30 秒边界到达后请求结束并进入超时错误路径 | `logQuery.spec.ts`：29999ms 未结束、30000ms 结束且 `code==='ECONNABORTED'`；`useLogQueryTab.spec.ts`：30s 边界后 `error` 设置为超时文案、状态 `FAILED` |
| 4. `loading=false`、等待计时停止、不无限旋转 | `useLogQueryTab.spec.ts`：超时后 `tab.loading===false`，`elapsed` 冻结（再推进 3s 不变） |
| 5. 没有自动重试或第二次请求 | `useLogQueryTab.spec.ts`：`mockedSearch` 仅被调用 1 次 |

### 6.3 LQ-AC-125 六项要求逐项对照

| §6.2 要求 | 证据（`useLogQueryTab.spec.ts` → `超时后旧列表、已生效条件与游标保留，表单可编辑、可再次查询、不自动重试（LQ-AC-125）`） |
|---|---|
| 显示明确提示"查询超时，请缩小查询范围或增加筛选条件后重试" | 超时后 `tab.error === '查询超时，请缩小查询范围或增加筛选条件后重试'` |
| 查询前已有列表、已生效条件与游标历史保持不变 | 超时后 `items` 仍为旧 1 条、`applied` 非空、`requestCursorStack===[null]`、`hasNext`/`nextCursor` 不变 |
| 查询条件仍可编辑 | 超时后 `tab.form.sourceTableName='T_X'` 成功赋值 |
| 可再次手动点击查询 | 第三次查询成功返回新行，`mockedSearch` 总调用次数 3，`error` 归空 |
| 不自动重试、不轮询、不刷新 | 超时路径 `mockedSearch` 调用次数 2（首查 + 超时查询各一次），无第三次自动请求 |
| 加载遮罩和等待计时结束 | `tab.loading===false`，`elapsed` 冻结 |

### 6.4 修改的测试文件与必要性

- 新增 `frontend/src/api/logQuery.spec.ts`：任务 §6.3 明确"如不存在且确有必要可新增"，用于客观证明请求级 `timeout:30000` 与 Axios 超时边界。
- 新增 `frontend/src/views/log-query/components/CursorPagination.spec.ts`：补齐 LQ-AC-059/060/119 分页条视觉与禁用证据（任务 §5.2/5.3 要求）。
- 追加 `useLogQueryTab.spec.ts` / `LogQueryPage.spec.ts` / `LogQueryFilter.spec.ts` / `LogQueryTable.spec.ts`：补齐 LQ-AC-002/004~004D/016/037/116~119/120/125/177 证据。
- 未引入新的生产依赖，全部使用现有 Vitest、Vue Test Utils、Axios 测试能力与 jsdom。

---

## 7. 8 个 BLOCKED 用例阻断复核表

逐一复核原 8 个 `BLOCKED` 用例的阻断原因是否仍存在：

| 用例 | 原阻断原因 | 复核结果 | 处置 |
|---|---|---|---|
| LQ-AC-104 合法 JSON 提供原文/格式化切换 | 开发库无 `RAW_MESSAGE` 为合法 JSON 的记录 | **已解除**。只读复核：`CDC_LOG_CORRECT` 共 3,819,479 行，`RAW_MESSAGE` 为合法 JSON 的行数 3,819,479，非 JSON 0 行，`LOG_DETAIL` 为 NULL 0 行，`RAW_MESSAGE` 非 NULL 3,819,479 行 | 由 `BLOCKED` → `NOT_RUN`（待真实弹窗原文/格式化切换验证或用户人工确认，不直接判 `PASS`） |
| LQ-AC-106 切换不修改不保存 | 依赖 LQ-AC-104 的合法 JSON 数据 | **已解除**。同上，开发库已存在 3,819,479 行合法 JSON `RAW_MESSAGE` | 由 `BLOCKED` → `NOT_RUN`（待用户人工确认） |
| LQ-AC-107 复制始终复制原始内容 | 依赖 LQ-AC-104 的合法 JSON 数据 | **已解除**。同上 | 由 `BLOCKED` → `NOT_RUN`（待用户人工确认） |
| LQ-AC-072 晚到数据可能在后续页出现 | 需构造晚到数据（写操作），只读联调禁止造数 | 仍存在：本任务禁止数据库写操作，开发库无现成晚到数据 | 保持 `BLOCKED` |
| LQ-AC-073 不承诺跨请求快照一致性 | 需两次查询之间插入/修改数据验证快照语义 | 仍存在：同上 | 保持 `BLOCKED` |
| LQ-AC-096 无 LOG_DETAIL 时摘要 `--` 且按钮禁用 | 开发库无 `LOG_DETAIL` 为 NULL 的记录 | 仍存在：`CDC_LOG_ERROR` 与 `CDC_LOG_CORRECT` 均无 `LOG_DETAIL` 为 NULL 的记录（只读复核） | 保持 `BLOCKED` |
| LQ-AC-105 非 JSON 不提供切换 | 开发库无 `RAW_MESSAGE` 为非 JSON 文本的记录 | 仍存在：两张日志表均无非 JSON `RAW_MESSAGE` 记录 | 保持 `BLOCKED` |
| LQ-AC-158 物理调整保持完全离线能力边界 | 需在受控环境停止 sync-log 与日志查询读取 | 仍存在：需生产启用前具备运维访问的受控离线窗口，本任务不可执行 | 保持 `BLOCKED` |

处置后 `BLOCKED` 数 = 8 − 3 = 5（LQ-AC-072 / 073 / 096 / 105 / 158）。

---

## 8. 五个 DEFERRED 用例保持不变的说明

五个延期用例精确保持 `DEFERRED_UNTIL_PHYSICAL_DESIGN`：

```text
LQ-AC-164
LQ-AC-165
LQ-AC-171
LQ-AC-172
LQ-AC-173
```

- 未执行任何最终物理设计工作：未设计/执行一级 RANGE 粒度、子分区方案、最终索引、生产 DDL 或生产等价性能验收。
- 未修改生产 `CDC_LOG_QUERY_ENABLED`（保持 `false`），未改动固定游标密钥 `cdc.log-query.cursor-secret`。
- 脚本校验确认延期集合与上述五个用例精确一致（见 §11）。

---

## 9. 修改前后状态数量对比与总数守恒

| 状态 | 修改前（R1 后续说明记录） | 修改后（本任务当前有效） | 变化 |
|---|---|---|---|
| PASS | 113 | 130 | +17 |
| NOT_RUN | 58 | 44 | −17 + 3（解除 3 个 BLOCKED）＝ −14 |
| BLOCKED | 8 | 5 | −3 |
| DEFERRED_UNTIL_PHYSICAL_DESIGN | 5 | 5 | 0 |
| **合计** | **184** | **184** | 0 |

- 总数守恒：`PASS + NOT_RUN + BLOCKED + DEFERRED = 130 + 44 + 5 + 5 = 184`。
- 编号总数仍为 184，编号唯一、无重复、无丢失，每个用例恰好一个执行状态。
- 历史执行记录中的旧统计（如开发阶段执行记录 121/46/8/5、R1 后续说明 113/58/8/5）保留为当时事实，未悄悄重写；仅在 §6 执行记录追加"补充验收后续说明"并记录当前有效统计。
- 每个状态变化均可在本报告 §4 / §5 / §7 找到证据映射。

---

## 10. 前后端测试、构建、只读联调结果

### 10.1 前端测试与构建

- `cd frontend && npm test`：**10 个测试文件全部通过，86 例通过（86 passed / 86）**，退出码 0。
  - `LogQueryPage.spec.ts` 27 例、`useLogQueryTab.spec.ts` 21 例、`LogQueryFilter.spec.ts` 13 例、`LogQueryTable.spec.ts` 8 例、`LogDialogOldResponse.spec.ts` 3 例、`logQuery.spec.ts` 2 例、`SidebarReinit.spec.ts` 4 例、`CursorPagination.spec.ts` 4 例、`dsDisplay.spec.ts` 3 例、`RawMessageDialogSafety.spec.ts` 1 例。
- `cd frontend && npm run build`：**前端生产构建通过**。

### 10.2 后端日志查询专项测试与构建

- `cd backend && mvn -Dtest='com.bsoft.cdcconfig.logquery.**' test`：日志查询专项测试全部通过（`Tests run: 136, Failures: 0, Errors: 0, Skipped: 0`，`BUILD SUCCESS`；测试过程中 `LogQueryServiceImpl` 语句超时路径的 WARN 日志为既有用例的预期输出）。
- `cd backend && mvn clean package -DskipTests`：后端打包通过。

（本节结果将在提交后 detached 干净 worktree 中再次完整复核，见 §14。）

### 10.3 只读联调与数据库

- 仅执行数据库只读查询（`SELECT` / `WITH ... SELECT`），读取两张日志表行数与 `RAW_MESSAGE` / `LOG_DETAIL` 形态，用于解除 LQ-AC-104/106/107 阻断（见 §7）。
- 未执行任何数据库写操作、未制造/清理开发库日志数据、未调用 ZooKeeper 读或写接口。
- 未启动/停止开发前后端进程；如环境存在既有进程，仅做只读识别。

---

## 11. 未修改业务代码、数据库数据、ZooKeeper、DDL、固定密钥、生产开关、README 的声明

- 未修改任何业务生产代码（仅新增/追加测试文件，见 §6.4；`ACCEPTANCE.md` 与本报告为验收文档）。
- 未对数据库执行 `INSERT / UPDATE / DELETE / MERGE / TRUNCATE / DDL / 存储过程` 等任何写操作；数据库写状态 `NONE`。
- 未执行任何 ZooKeeper 写操作，也未执行 ZooKeeper 读取；ZooKeeper 状态 `NONE`。
- 未执行任何 DDL；`ddl_status=NONE`。
- 未修改固定游标密钥 `cdc.log-query.cursor-secret` 的值或位置。
- 未修改生产 `CDC_LOG_QUERY_ENABLED`（保持 `false`），未将功能标记为生产可启用。
- 未修改 `REQUIREMENTS.md` / `API.md` / `DESIGN.md` / `UI.md` / `README.md`（未发现与本次验收结果直接相关的计数错误）。
- 未做 README 最终收口；`readme_closeout_status=NOT_EXECUTED`。

---

## 12. 下一步边界

- 本任务仅完成"用户视觉验收补充记录 + 可执行验收用例重新核验"，输出 `ACCEPTANCE_SUPPLEMENT_EXECUTED_PENDING_CHATGPT_REVIEW`。
- 下一步仅限 **ChatGPT 复审** 本轮验收结果（包括 17 例 `NOT_RUN→PASS` 的证据充分性、3 例 `BLOCKED→NOT_RUN` 的阻断解除依据、LQ-AC-120/125 两层模拟方法的客观性）。
- 本任务不自行批准实现收口，不批准生产启用，不执行任何物理设计。
- 当前仍存在 `BLOCKED`（5）、`DEFERRED_UNTIL_PHYSICAL_DESIGN`（5）与可能继续保留的 `NOT_RUN`（44），在全部阻断项通过并获批前生产 `CDC_LOG_QUERY_ENABLED` 必须保持 `false`。

---

## 附录：58 个原 NOT_RUN 用例处置分类明细

### EXECUTED_PASS（17，见 §4 证据映射）

`LQ-AC-002 / 004 / 004A / 004B / 004C / 004D / 016 / 037 / 059 / 060 / 116 / 117 / 118 / 119 / 120 / 125 / 177`

### KEEP_NOT_RUN_USER_ACTION_REQUIRED（40）

`LQ-AC-006 / 007 / 008 / 014 / 020 / 021 / 022 / 025 / 026 / 029 / 032 / 036 / 038 / 056 / 081 / 085 / 086 / 087 / 088 / 089 / 090 / 092 / 094 / 110 / 111 / 114 / 122 / 131 / 132 / 133 / 135 / 147 / 148 / 149 / 150 / 151 / 152 / 153 / 154 / 169`

### KEEP_NOT_RUN_OUT_OF_SCOPE（1）

`LQ-AC-163`（日志量级聚合开发库整体验证，超出本轮补充验收范围）
