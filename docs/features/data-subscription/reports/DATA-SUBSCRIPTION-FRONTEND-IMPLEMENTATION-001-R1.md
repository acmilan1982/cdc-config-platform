# DATA-SUBSCRIPTION-FRONTEND-IMPLEMENTATION-001-R1 执行报告

- 任务编号：`DATA-SUBSCRIPTION-FRONTEND-IMPLEMENTATION-001-R1`
- 任务名称：数据订阅前端实现 R1 定向修订
- 任务性质：前端代码、前端测试及任务报告的定向修订
- 目标分支：`develop`
- 基准提交：`b042e5ef63e4d99530339c2d26445fb2f44b06a4`
- 结果提交：见本报告末尾 `AGENT_TASK_RESULT` 块 `result_commit_id`
- 结论：本实现仍需 ChatGPT 对 R1 结果提交进行正式代码与视觉复审，**不得**标记为正式验收通过，不得执行 126 条验收用例批量 `PASS`，不得执行大屏调整。

---

## 1. 任务前 Git 现场

- 分支：`develop`
- 基准提交：`b042e5ef63e4d99530339c2d26445fb2f44b06a4`
- 任务开始前工作区即存在与本次任务无关的用户既有修改（前端布局、菜单、样式等约 27 个文件修改及 `docs/agent-prompts/` 未跟踪文件），全程保持原样，未修改、未覆盖、未暂存、未提交。
- 本次任务仅修改授权范围内文件，见第 4 节。

## 2. 必须修正问题逐项证据（ChatGPT `CHANGES_REQUIRED`）

### 2.1 §3.1 编辑表单脏状态必须包含目标库

- `useSubscribeForm.ts` 编辑基线新增目标库记录：回显时以集合语义保存目标库基线，顺序变化不误判为业务变化。
- 仅当增加、删除或替换目标库时 `isDirty=true`。
- 关闭、取消、右上角关闭、点击遮罩触发关闭均复用同一未保存确认逻辑。
- 新增独立测试 `useSubscribeForm.spec.ts`：仅修改目标库时 `isDirty=true`（不通过同时修改描述间接覆盖）；目标库仅顺序变化不误判。

### 2.2 §3.2 异常引用和失效源表不得绕过保存校验

- 本地保存校验对异常数据源引用与失效源表一律拦截：
  - 原源库/目标库为 `INACTIVE`、`NOT_FOUND` 或含维护协议保留字符时，保存前必须替换或修复；使用 `PRESERVE` 同样不得绕过。
  - 异常目标库即使不在当前启用候选列表，也显式回显，并提供移除/替换路径。
  - 源库可连接但返回 `invalidTables` 时，要求调整源表并以 `REPLACE` 修复后才能保存。
  - 存在 `rawUnparseableTables` 时不得静默丢弃或以 `PRESERVE` 原样保存；提示重新选择有效源表或明确提示只能直接维护数据库。
  - 有限编辑仅适用于：源库引用本身正常、源库暂时不可连接、源库与源表完全未变；此时允许修改描述和正常目标库并保持 `PRESERVE`。
  - 保存按钮禁用状态与点击后的本地校验使用同一判断谓词。
- 新增/修订测试覆盖正常、异常、有限编辑三类边界（`useSubscribeForm.spec.ts`、`SubscribeFormDialog.spec.ts`）。

### 2.3 §3.3 编辑回显必须加载全部已选 Schema

- Schema 列表加载成功后，自动加载并缓存全部 `preloadSchemas` 对应表清单（受控并发，非串行阻塞；保留请求代际防护，切换源库后旧请求不污染新状态）。
- 当前查看 Schema 默认定位到第一个已选 Schema。
- 所有已选 Schema 的左侧数量、表格勾选、浅蓝背景、底部汇总均准确回显。
- 单个 Schema 加载失败时仅在对应位置给出可重试状态，不连坐清空其他已成功加载的 Schema。
- 新增至少两个已选 Schema 的回显与缓存测试（`SubscribeFormDialog.spec.ts`、`SourceTableSelector.spec.ts`）。
- 真实浏览器核验：编辑弹窗加载 `CDC_USER`、`SPT_HIS_2023` 两个 Schema，`SPT_HIS_2023` 下 9 张表全部勾选并回显，`CDC_USER` 显示“已选 0 张”。

### 2.4 §3.4 补齐“取消当前搜索结果的选择”

- `SourceTableSelector.vue` 提供：全选当前 Schema 当前搜索结果、取消选择当前 Schema 当前搜索结果、清除搜索关键字、只看已选、清空当前 Schema（二次确认）。
- “取消当前搜索结果”只作用于当前 Schema 下当前过滤结果中的表，不误删其他搜索结果或其他 Schema 的选择。
- 新增边界测试验证隔离性（`SourceTableSelector.spec.ts`）。

## 3. 产品负责人新增布局调整逐项证据

### 3.1 §4.1 弹窗尺寸与空间分配

- 桌面默认宽度 `1280px`，最大宽度 `calc(100vw - 64px)`，小屏退化 `calc(100vw - 32px)`；高度 `82vh` 同时受 `calc(100vh - 48px)` 约束。
- 标题栏固定、底部“取消/保存”固定、中间内容区占用剩余高度并独立滚动。
- 每次打开默认居中，仅标题栏可拖动且受 viewport 限制。
- 修正了一个真实布局缺陷：Element Plus `.el-form-item__content` 默认 `align-items: center` 会在源表选择区处于空状态时把内容收缩到内容宽（实测 380px）。已在 scoped 样式中改为 `align-items: stretch`，使源表选择区始终撑满内容宽度，避免“弹窗缩小后源表区被压缩成小块”。
- 真实浏览器核验：2048×768 下弹窗 `1280×630`（x=384,y=115），1440×900 下 `1280×738`（x=80,y=135），均在 viewport 内，源表区在未选源库空态与选中后均撑满内容宽度。

### 3.2 §4.2 订阅描述改为单行

- 描述改为单行输入框（`input`），保留必填、最大 255 字符与清晰校验提示，顶部表单区紧凑为源表区让出高度。
- 真实浏览器核验：描述控件为单行输入。

### 3.3 §4.3 源库和目标库同一行

- 桌面宽度下源库占约 34%（`flex: 0 0 34%`，`min-width: 260px`），目标库占剩余约 66%（`flex: 1 1 0`）；逻辑顺序保持“源库 → 目标库”。
- 小屏（≤900px）自动换行（两者 `flex: 1 1 100%`）。
- 源库仍为可搜索单选下拉，不平铺。
- 真实浏览器核验：两分辨率下源库/目标库在同一行（top 差 < 4px）。

### 3.4 §4.4 目标库紧凑小卡片

- 保留小卡片，改为紧凑样式：建议高度约 44px、宽度内容自适应、间距约 8px。
- 机构名称为主文字，数据源 ID 为小号浅色辅助文字；左侧复选框为唯一勾选控件，删除右侧重复勾选图标。
- 选中时蓝色边框 + 浅蓝背景；禁用候选灰显并说明保留字符原因。
- 常见 3 个目标库同一行完整展示；不增加搜索、“查看更多”或折叠交互。
- 真实浏览器核验：新增弹窗出现 3 张目标卡片且同一行，卡片 `width` 自适应；编辑弹窗正确回显选中卡片（蓝色选中态）。

### 3.5 §4.5 源表选择区获得主要空间

- 选择汇总压缩为一条紧凑信息栏：`已选择：X 个源库 · X 个 Schema · X 个表 · X 个目标库`。
- 源表选择区横向撑满弹窗内容区；Schema 区固定约 240~260px（实测 250px），右侧普通表区占全部剩余宽度。
- 右侧为固定表头表格形态，表内容区内部滚动；已选表使用复选框 + 整行浅蓝背景；不恢复右侧“已选源表”面板。
- 240 张已选表场景通过单元测试覆盖（`SourceTableSelector.spec.ts` 240 表高容量滚动/选择状态测试），真实数据量不足以复现，见第 6 节边界说明。
- 真实浏览器核验：选中源库后 Schema 区 250px、普通表区 932px（> Schema 区 1.5 倍），表头 `position: sticky`，表视口 `overflow: auto`。

## 4. 列表与详情同步修正证据（提示词 §5）

### 4.1 §5.1 查询候选

- 源库、目标库查询候选均以 `DATA_SOURCE_ORG` 为主文字、`DATA_SOURCE_ID` 为辅助文字（选项 `:label` 与自定义 slot 结构）。
- 含英文逗号的候选仍可选择，但显示“含逗号，历史兼容查询可能存在歧义”警告；仅含英文句点且不含逗号的候选仍为普通候选。
- 查询候选不复用维护候选的禁用规则；保留组内 OR、组间 AND，以及“重置只清空表单、不自动查询”的既定行为。
- 定向测试：`DataSubscribePage.spec.ts` 覆盖含逗号候选警告、句点普通候选、组内 OR/组间 AND 与重置行为。

### 4.2 §5.2 列表展示

- 订阅描述超长省略，悬停 `title` 显示完整内容。
- 正常源库只显示机构名称，数据源 ID 通过悬停查看；已停用源库显示机构名称 + “已停用”，不存在源库显示原始 ID + “不存在”。
- “源表”单元格主体只显示“共 N 张”；悬停层逐行显示所有可解析 `Schema.表名`，不可解析 token 在同一悬停层内以警示分区展示，悬停层限高并内部滚动，不在列表单元格内平铺。
- 目标库展示前几个紧凑标签与 `+N`；`+N` 通过悬停查看全部目标库，点击不展开/收起；展示容量依据列宽用 `computeTargetCapacity` 稳定计算，不硬编码“永远两个”。
- 操作文字统一为“查看、编辑、删除”，不使用“详情”。
- 多源库异常行及无操作入口规则保持不变。
- 定向测试：`DataSubscribePage.spec.ts` 覆盖描述省略、机构名主文字与 ID 悬停、源表单元格“共 N 张”、悬停层逐行与警示分区、`+N` 悬停、目标标签容量、“查看/编辑/删除”文案。

### 4.3 §5.3 详情弹窗

- 源表总数计数包含不可解析的非空历史 token（`sourceTableTotalCount`）。
- 按 Schema 分组，每张表逐行显示（`sd-table-tables`），不再用顿号挤在一行；原始不可解析内容单独警示分区。
- 源表区域限高并内部滚动；源库、目标库直接显示机构名称和完整 ID；订阅 ID、创建时间、更新时间保持显示。
- 定向测试：`SubscribeDetailDialog.spec.ts`、`subscriptionFormat.spec.ts` 覆盖总数口径（含不可解析 token）、逐行表名、警示分区。

## 5. 源库维护候选视觉规则证据（提示词 §6）

- 新增/编辑弹窗源库候选：机构名称为主文字、数据源 ID 为辅助文字（`.sf-source-org` / `.sf-source-id`）。
- 搜索优先级保持：ID 完全匹配 → ID 前缀 → ID 模糊 → 机构名称模糊（`filterSourceOptions` 通用化后同时服务源库与目标库候选）。
- ID 与机构名称命中部分均高亮；当前已选择项有明显蓝色状态、勾选标记与“已选择”文字。
- ID 含英文逗号或英文句点的维护候选显示但禁用，并说明协议保留字符原因；无结果显示“未找到匹配的源库”。
- 定向测试：`SubscribeFormDialog.spec.ts` 覆盖搜索优先级、命中高亮、选中态、保留字符禁用与空结果文案。

## 6. 修改文件清单

授权范围内修改（12 个）+ 新增（1 个报告）：

1. `frontend/src/views/data-subscribe/DataSubscribePage.vue`
2. `frontend/src/views/data-subscribe/DataSubscribePage.spec.ts`
3. `frontend/src/views/data-subscribe/components/SubscribeFormDialog.vue`
4. `frontend/src/views/data-subscribe/components/SubscribeFormDialog.spec.ts`
5. `frontend/src/views/data-subscribe/components/SubscribeDetailDialog.vue`
6. `frontend/src/views/data-subscribe/components/SubscribeDetailDialog.spec.ts`
7. `frontend/src/views/data-subscribe/components/SourceTableSelector.vue`
8. `frontend/src/views/data-subscribe/components/SourceTableSelector.spec.ts`
9. `frontend/src/views/data-subscribe/composables/useSubscribeForm.ts`
10. `frontend/src/views/data-subscribe/composables/useSubscribeForm.spec.ts`
11. `frontend/src/views/data-subscribe/utils/subscriptionFormat.ts`
12. `frontend/src/views/data-subscribe/utils/subscriptionFormat.spec.ts`
13. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-FRONTEND-IMPLEMENTATION-001-R1.md`（新增）

说明：

- 本次未修改 `frontend/src/api/subscription.ts`、`frontend/src/types/subscription.ts`（现有前端契约无需修正）。
- `docs/features/README.md` 本次未修改（授权范围内但属可选项）。R1 为定向修订，Feature 状态仍为 `IMPLEMENTED_PENDING_REVIEW`，README 的 `data-subscription` 行变更记录建议在 R1 结果提交经 ChatGPT 正式复审后随后续文档任务追加，避免在本提交内写入尚不可用的结果提交引用。

## 7. 测试与构建结果

- 定向测试（`views/data-subscribe/` 下 7 个 spec 文件）：**93 个用例全部通过**。
  - `DataSubscribePage.spec.ts` 13、`SourceTableSelector.spec.ts` 13、`SubscribeFormDialog.spec.ts` 23、`SubscribeDetailDialog.spec.ts` 5、`SubscribeDeleteDialog.spec.ts` 7、`useSubscribeForm.spec.ts` 9、`subscriptionFormat.spec.ts` 23。
- 前端全量测试：`npm test -- --run` 23 个文件 **345 个用例全部通过**。
- 前端构建：`npm run build` 成功（产物含 `DataSubscribePage-*.js`；仅存在既有 chunk 体积 >500kB 警告，非本次引入）。
- 后端全量测试：**未运行**。原因：本任务无后端业务代码与后端测试变更；R1 提示词 §7.3 明确禁止运行会扫描全部后端测试的 `mvn test` / `mvn clean test` / 未跳过测试的 `mvn clean package`，默认无需运行 Maven。后端契约相关前端调用沿用已批准 API 契约，未做后端侧改动。

## 8. 只读浏览器视觉复核

- 复核方式：headless Chromium 驱动同一 vite 实例（监听 `0.0.0.0:5173`，PID 见本次服务运行记录）访问 `/config/subscribe`，对 `2048 × 768` 与 `1440 × 900` 各核验一次；外部地址 `http://192.168.174.70:5173/config/subscribe` 实测 `HTTP 200`，可路由到用户侧。全部为只读核验：未点击最终保存/最终删除，未产生数据库写入。
- 核验场景与结果：
  - 列表：两分辨率均无横向溢出；描述超长省略（`ellipsis`）并悬停显示完整内容；正常源库只显示机构名，数据源 ID 通过悬停 title 查看；“源表”单元格只显示“共 N 张”，异常 token 不在单元格内平铺；操作文字为“查看、编辑、删除”。
  - 详情：弹窗在 viewport 内，展示基本信息、源表（共 N 张，逐行表名、按 Schema 分组）、目标库、时间等分区。
  - 新增：弹窗尺寸适中（1280×630 / 1280×738）且 viewport 内；源库/目标库同一行；3 张目标卡片同一行；描述单行输入；选中源库后源表区占据主要空间（Schema 250px / 普通表 932px），表头固定、表内容滚动。
  - 编辑回显：源库机构名回显；全部已选 Schema 自动加载（两个 Schema，其中 `SPT_HIS_2023` 9 张表全部勾选）；目标库选中卡片回显；描述为空为真实数据本身无描述。
  - 删除预览：弹窗在 viewport 内，展示订阅描述/源库/Schema 数/表数/目标库预览与“取消 / 确认删除”按钮，未点击确认。
  - 标题栏拖动：拖动后弹窗移动且标题栏始终完整留在 viewport 内；关闭重开后恢复居中（transform 复位、水平居中）。
  - 浏览器控制台：两分辨率、全场景 `consoleErrors=0`。
- 数据边界诚实说明：开发库真实数据仅 1 条订阅、1 个源库、1 个目标库，无法用真实数据复现“约 120 张表滚动”和“3 目标容量展示”场景；这两类场景已由单元测试覆盖（`SourceTableSelector.spec.ts` 240 表高容量测试、`SubscribeFormDialog.spec.ts` 3 目标卡片布局测试），报告中不得据此声称真实环境已演示大表滚动。

## 9. 明确未操作项

- 数据库：未访问、未写入；未执行任何 `DDL/DML`；未新增数据源/订阅记录；未操作备份表 `CDC_DATA_SUBSCRIBE_2026_08_31`。
- ZooKeeper：未访问、未读写。
- Kafka：未操作。
- sync-client：未操作。
- 大屏：未执行大屏逻辑修正，保持 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`。

## 10. 任务前无关修改保护结果

- 任务开始前已存在的用户既有修改与未跟踪文件（前端布局/菜单/样式等文件及 `docs/agent-prompts/`）全部原样保留，未修改、未覆盖、未暂存、未提交。
- 本次提交仅暂存第 4 节授权范围内文件。

## 11. 待后续同步的基线差异（本提示词新布局 vs 既有批准 UI 基线）

以下为本提示词“产品负责人新增批准调整”相对既有批准 UI 基线描述的差异，均已按本提示词实现；R1 报告如实记录，待后续 UI 基线同步任务逐项收口：

1. 弹窗尺寸：旧 `94vw × 92vh` → 桌面默认宽 `1280px`（最大 `calc(100vw - 64px)`，小屏 `calc(100vw - 32px)`）、高 `82vh`（受 `calc(100vh - 48px)` 约束）。
2. 订阅描述：由多行 textarea → 单行输入框（仍必填、最大 255 字符）。
3. 源库/目标库：桌面同一行布局（源库约 34%、目标库约 66%），小屏自动换行。
4. 目标库卡片：由大卡片 → 紧凑小卡片（约 44px 高、内容自适应宽、间距约 8px），删除重复勾选图标，3 个目标库同排展示。
5. 源表选择区：由截图中小块 → 占据弹窗中间区主要空间，Schema 区固定 240~260px，普通表区占剩余宽度并以固定表头表格 + 内部滚动呈现，选择汇总压缩为单条信息栏，不恢复右侧“已选源表”面板。
6. 列表目标库展示：由固定展示 2 个标签 → 按列宽计算展示容量并配合 `+N` 悬停查看全部。
7. 列表操作文字：由“详情”改为“查看”。
8. 列表“源表”单元格：只显示“共 N 张”，逐行表名与不可解析 token 移入悬停层（限高滚动 + 警示分区）。
9. 详情源表展示：由顿号合并 → 按 Schema 分组、逐行显示表名，总数口径包含不可解析非空 token。

## 12. 复审状态

- 本实现仍为 `IMPLEMENTED_PENDING_REVIEW`，需 ChatGPT 对 R1 结果提交进行正式代码与视觉复审；本次不得视为正式验收通过，不得执行验收批量 `PASS`。
- 本任务完成后的唯一下一入口为 ChatGPT 对 R1 结果提交的正式复审；复审通过后再进入正式验收与（延期的）大屏调整。
