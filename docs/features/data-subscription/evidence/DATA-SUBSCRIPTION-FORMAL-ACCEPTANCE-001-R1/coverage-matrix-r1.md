# 数据订阅正式验收 R1 覆盖矩阵（DSUB-AC-001~126 逐条复核）

- 任务编号：`DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1`（R1：真实浏览器补验 + 证据定向修订）
- 本文件取代并明确纠正原正式验收 `coverage-matrix.md` 的证据标注。原矩阵为“执行前覆盖计划”，其中多处 `BR`（真实浏览器）标注在 R0 执行时并无对应真实浏览器场景（R0 浏览器证据仅覆盖列表/查询/详情/新增弹窗打开），属不准确声明。R1 以真实 Chrome 补验补齐这些场景（见 `browser/browser-scenario-index.md`），对仍无真实浏览器场景的用例明确改为 `FT/HTTP/DB/BT/SC`，不再标 `BR`。
- 判读规则：新旧矩阵冲突时，以本 R1 矩阵为当前结论；不得把本矩阵未列入 `BR` 的用例解释为已有真实浏览器证据。
- 全部 126 条复核结果：**PASS = 126**。`acceptance_execution_status = EXECUTED_PENDING_REVIEW`；`implementation_status = IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_REVIEW`（在 ChatGPT 复审结论前不写 `IMPLEMENTED_ACCEPTED` / 正式验收通过）。

## 证据路径基准

- 裸相对路径（`browser/...`、`frontend-tests/...`、`database/...`）= 本目录 `DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1/` 内文件。
- 场景引用 `S1-1`…`S5-9`、`S1-CONSOLE` 等 → 见 `browser/browser-scenario-index.md`（含每场景验收 ID、视口、前置数据、操作步骤、实际结果、证据路径、拦截标记）；场景级结构化记录见 `browser/s1-scenarios.json`…`s5-scenarios.json`。
- `[R0]` 前缀 = 原正式验收证据目录 `DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001/`（真实 HTTP、DB、后端定向测试、静态核对，按 §9 保留原结论）。
- 证据方式缩写：
  - `BR` = 真实浏览器（无网络拦截，真实后端 API + 已批准数据）
  - `BR-IC` = 浏览器拦截 UI 场景（`BROWSER_INTERCEPTED_UI_SCENARIO`，仅证明前端 UI 行为，不代表真实 Oracle 数据）
  - `FT` = 干净 worktree 前端定向测试（仅仓库已跟踪 7 个 spec，124 用例全 PASS，见 `frontend-tests/targeted-tests-clean-worktree.txt`）
  - `HTTP` = 真实 HTTP 证据（R0 `http/*.json`）
  - `BT` = 后端定向测试（R0 138 用例全 PASS，见 `[R0]backend-tests/targeted-tests-summary.txt`；后端代码/测试相对 `49eb778` 零变化）
  - `DB` = 数据库证据（R0 `database/*`；R1 `database/precheck-r1.txt`、`database/dml-execution-r1.txt`、`database/restore-r1.txt`）
  - `SC` = 静态契约核对（API/DATABASE/UI/需求基线 + 代码只读核对，结论沿用 R0 `coverage-matrix.md`）
- 未跟踪 `frontend/src/api/subscription.spec.ts` 未带入干净 worktree、未执行、未计数（R1 §2.2 已回应）；凡 R0 中以该文件为主的 `FT` 证据，本矩阵不再引用 `FT`，改用 HTTP/DB/BT/SC/真实浏览器。

---

## 领域一：生效边界与 sync-client 字段（DSUB-AC-001~005）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-001 | PASS | HTTP + DB + SC | [R0]http/create-success.json；[R0]database/dml-execution-summary.txt；R1 database/precheck-r1.txt | 新增保存后端按需写入 `DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID`/`DATA_SOURCE_TABLE`/`FG_ACTIVE` 等字段，`sync-client` 读取所需四字段完整 |
| DSUB-AC-002 | PASS | FT + HTTP + SC | frontend-tests/targeted-tests-clean-worktree.txt；[R0]http/http-summary.txt | 弹窗/列表/详情不展示、不解析、不维护遗留字段（`DATA_SOURCE_COMMENT` 等），响应无遗留字段 |
| DSUB-AC-003 | PASS | SC + HTTP | [R0]http/http-summary.txt；[R0]database/dml-execution-summary.txt | 新增/编辑/删除不触发通知或重启 sync-client、不操作 ZK/Kafka、不启停任务；页面无“已生效/待生效”状态 |
| DSUB-AC-004 | PASS | BR + FT | browser/s5-2b-create.json（真实成功提示）；browser/s5-9-e2e.json | 真实新增保存提示为“操作成功。配置将在相关 sync-client 重启后生效。” |
| DSUB-AC-005 | PASS | BR + FT | browser/s5-8-delete.json（真实删除提示）；browser/s5-scenarios.json S5-8 | 真实删除成功提示含“配置将在相关 sync-client 重启后生效。”重启说明 |

## 领域二：数据模型与存储规则（DSUB-AC-006~027）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-006 | PASS | BT + HTTP + DB | [R0]backend-tests/targeted-tests-summary.txt；[R0]http/create-success.json；[R0]database/dml-execution-summary.txt | 新增写入唯一 `DATA_SUB_ID`（32 位十六进制），作为数据库主键，由后端生成 |
| DSUB-AC-007 | PASS | BT + HTTP + DB | [R0]http/create-fail-commaSource.json；[R0]backend-tests/targeted-tests-summary.txt | 源库只保存单一 ID，含英文逗号被拒绝（40316） |
| DSUB-AC-008 | PASS | HTTP + DB | [R0]http/detail-DSUB-FA-001-AC008A.json；[R0]database/dml-execution-summary.txt | 同源两条记录均可保存，不因同源重复拒绝 |
| DSUB-AC-009 | PASS | BR + FT + DB | browser/s1-list-initial.png；browser/s1-scenarios.json S1-9（真实 R1ACANOMALY01 多源异常行）；frontend-tests/targeted-tests-clean-worktree.txt；R1 database/dml-execution-r1.txt | 真实多源异常行整行警示色，文案“配置异常：该记录包含多个源库，请直接维护数据库” |
| DSUB-AC-010 | PASS | BR + FT | browser/s1-scenarios.json S1-9（真实：异常行操作按钮数=0） | 真实异常行不提供查看/编辑/删除任何操作入口，无自动拆分 |
| DSUB-AC-011 | PASS | BT + HTTP + DB | [R0]http/create-success.json；[R0]backend-tests/targeted-tests-summary.txt | `DATA_TO_SOURCE_ID` 以英文逗号保存多目标库 |
| DSUB-AC-012 | PASS | BT + HTTP + DB | [R0]http/create-success.json；[R0]backend-tests/targeted-tests-summary.txt | `DATA_SOURCE_TABLE` 多表英文逗号分隔、无换行符 |
| DSUB-AC-013 | PASS | BT + HTTP + DB | [R0]backend-tests/targeted-tests-summary.txt；[R0]http/update-preserve.json | Schema/表名保持源 Oracle 原始大小写；三段保留分隔符为两个英文句点 |
| DSUB-AC-014 | PASS | FT + BT + HTTP | frontend-tests/targeted-tests-clean-worktree.txt（subscriptionFormat.spec `isReservedCommaOrDot`/表单禁用）；[R0]http/create-fail-commaTableName.json、create-fail-dotTableName.json | 名称含英文逗号或组件内部英文句点不可选择并说明协议限制 |
| DSUB-AC-015 | PASS | BT + HTTP | [R0]backend-tests/targeted-tests-summary.txt（40317）；[R0]http/create-fail-dupTable.json | 记录内重复表返回结构化错误 40317 |
| DSUB-AC-016 | PASS | HTTP + DB | [R0]http/create-duplicate.json；[R0]database/dml-execution-summary.txt | 完全重复跨行记录允许保存 |
| DSUB-AC-017 | PASS | SC + HTTP + DB | [R0]http/list-*.json；[R0]database/dml-execution-summary.txt | 列表仅展示启用记录（`FG_ACTIVE=1`） |
| DSUB-AC-018 | PASS | SC + HTTP + FT | [R0]http/options.json；frontend-tests/targeted-tests-clean-worktree.txt | 新增候选仅启用且类别匹配；表单无“状态”选择入口 |
| DSUB-AC-019 | PASS | SC + FT | frontend-tests/targeted-tests-clean-worktree.txt；SC（后端无 `FG_ACTIVE=0` 更新路径、按主键物理删除） | 无停用入口、无软删除逻辑 |
| DSUB-AC-020 | PASS | FT + BT + HTTP | frontend-tests/targeted-tests-clean-worktree.txt（必填/maxlength=255）；[R0]http/create-fail-emptyDesc.json、create-fail-descTooLong.json | 描述必填且单行最大 255；后端 40310/40311 一致 |
| DSUB-AC-021 | PASS | SC + DB | [R0]database/dml-execution-summary.txt；R1 database/precheck-r1.txt | 新增时遗留字段列值为 NULL |
| DSUB-AC-022 | PASS | SC + BT + DB | [R0]backend-tests/targeted-tests-summary.txt（update_preserve sqlSet）；[R0]database/dml-execution-summary.txt | 编辑 SET 不含遗留字段，PRESERVE 不重写遗留列 |
| DSUB-AC-023 | PASS | SC + DB | [R0]database/dml-execution-summary.txt | 新增 NULL、编辑保持（遗留注释列） |
| DSUB-AC-024 | PASS | SC + DB | [R0]database/dml-execution-summary.txt | 新增 NULL、编辑保持（遗留目标表列） |
| DSUB-AC-025 | PASS | SC + DB | [R0]database/dml-execution-summary.txt | 新增 `INSERT_TIME=SYSDATE`、`UPDATE_TIME` 为空 |
| DSUB-AC-026 | PASS | SC + BT + DB | [R0]backend-tests/targeted-tests-summary.txt；[R0]database/dml-execution-summary.txt | 编辑更新 `UPDATE_TIME=SYSDATE` |
| DSUB-AC-027 | PASS | FT + HTTP + SC | frontend-tests/targeted-tests-clean-worktree.txt（subscriptionFormat.spec `resolveUpdateTime`）；[R0]http/list-all2.json | 列表按更新时间 NVL 倒序展示 |

## 领域三：列表页面与查询（DSUB-AC-028~043）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-028 | PASS | BR + FT | browser/s1-scenarios.json S1-1（真实：进入 `/config/subscribe` 自动空条件查询）；frontend-tests/targeted-tests-clean-worktree.txt | 挂载自动执行一次空条件查询 |
| DSUB-AC-029 | PASS | SC + FT + BR | browser/s1-scenarios.json S1-1；frontend-tests/targeted-tests-clean-worktree.txt；SC（接口无分页参数） | 无分页参数、无分页控件，单页全量列表 |
| DSUB-AC-030 | PASS | SC + FT + HTTP + BR | [R0]http/list-all2.json；browser/s1-list-initial.png | 默认 NVL 倒序（最新更新在前） |
| DSUB-AC-031 | PASS | FT + BR | browser/s1-scenarios.json S1-1；frontend-tests/targeted-tests-clean-worktree.txt | 查询区仅两个多选下拉（源/目标） |
| DSUB-AC-032 | PASS | BT + FT + HTTP + BR | browser/s1-scenarios.json S1-2（真实查询候选）；[R0]http/options.json；frontend-tests/targeted-tests-clean-worktree.txt（含逗号候选歧义警告） | 候选仅启用且类别匹配、大小写兼容；含逗号候选可选项显示歧义警告 |
| DSUB-AC-033 | PASS | BT + HTTP + DB + BR | browser/s1-scenarios.json S1-2/S1-3（真实源/目标筛选请求）；[R0]http/list-and.json、list-source.json | 同一组源（目标）内 OR、分组间 AND 精确匹配 |
| DSUB-AC-034 | PASS | BT + HTTP + DB + BR | browser/s1-scenarios.json S1-2/S1-3；[R0]http/list-target.json | 目标库组合命中行为正确 |
| DSUB-AC-035 | PASS | BT + HTTP + BR | browser/s1-scenarios.json S1-2/S1-3（组间 AND 请求参数） | 源组与目标组间 AND 语义正确 |
| DSUB-AC-036 | PASS | FT + BR | browser/s1-scenarios.json S1-2/S1-3（点击查询才发起请求的网络计数）；frontend-tests/targeted-tests-clean-worktree.txt | 需点击“查询”按钮才请求 |
| DSUB-AC-037 | PASS | FT + BR | browser/s1-scenarios.json S1-5（真实重置：清空表单、无新请求）；frontend-tests/targeted-tests-clean-worktree.txt | 重置仅清空表单，不发起请求 |
| DSUB-AC-038 | PASS | FT + BR | browser/s1-scenarios.json S1-6（真实空列表文案）；browser/s1-empty.png | 显示“暂无符合条件的订阅记录” |
| DSUB-AC-039 | PASS | FT + BR | frontend-tests/targeted-tests-clean-worktree.txt（DataSubscribePage.spec 列结构）；[R0]browser/list-1440x900-dom.json（R0 真实列表 DOM）；browser/s1-list-initial.png | 列顺序正确，`DATA_SUB_ID` 不占独立列（R0 BR 为真实 DOM，予以保留） |
| DSUB-AC-040 | PASS | FT + BR | frontend-tests/targeted-tests-clean-worktree.txt（机构主文字/ID 辅助）；[R0]browser/list-1440x900-dom.json | 源/目标列主要显示 `DATA_SOURCE_ORG`，悬停可查 `DATA_SOURCE_ID` |
| DSUB-AC-041 | PASS | FT + BR | browser/s1-scenarios.json S1-7（真实“共 N 张”+悬停）；browser/s1-hover-tables.json/png | 源表计数“共 N 张”，悬停展示清单 |
| DSUB-AC-042 | PASS | FT + BR | browser/s1-scenarios.json S1-8（真实 +N 悬停）；browser/s1-hover-n.json/png | 超过展示上限的目标用“+N”并悬停查看全部 |
| DSUB-AC-043 | PASS | FT + BR | browser/s1-scenarios.json S1-10（真实行含“创建时间”回退标记）；frontend-tests/targeted-tests-clean-worktree.txt（resolveUpdateTime） | 无 `UPDATE_TIME` 时回退 `INSERT_TIME` 并标记创建时间；操作含查看/编辑/删除 |

## 领域四：异常记录与异常数据源展示（DSUB-AC-044~048）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-044 | PASS | BR + FT | browser/s1-scenarios.json S1-9/S1-10（真实 R1ACINACTIVE01 源“已停用”）；browser/s1-list-initial.png | 源库已停用行显示机构名并标记“已停用” |
| DSUB-AC-045 | PASS | BR + FT | browser/s1-scenarios.json S1-10（真实 R1ACNOTFOUND01 源“不存在”）；browser/s1-list-initial.png | 源库不存在行显示原始 ID 并标记“不存在” |
| DSUB-AC-046 | PASS | FT + BT + DB | frontend-tests/targeted-tests-clean-worktree.txt（DataSubscribePage.spec 目标 +N 悬停含 T03 已停用）；[R0]backend-tests/targeted-tests-summary.txt（toTargetRefVO）；[R0]database/dml-execution-summary.txt | 目标库停用/不存在标记正确。R1 未构造“目标异常”行，**纠正 R0 原 `BR` 标注为 `FT+BT`** |
| DSUB-AC-047 | PASS | BR + FT | browser/s1-scenarios.json S1-9（真实多源异常行整行警示，与 AC-009 同一截图）；browser/s1-list-initial.png | 真实多源异常行整行警示色 + 明确异常提示（与 AC-009 同场景覆盖） |
| DSUB-AC-048 | PASS | BR + FT + BT + HTTP | browser/s3-scenarios.json S3-11（真实：异常源记录仍可查看/编辑回显、保存阻断）；[R0]http/update-anomaly.json | 异常源/目标记录仍提供查看/编辑/删除入口；修复异常前编辑保存被阻断 |

## 领域五：查看详情（DSUB-AC-049~056）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-049 | PASS | BR + FT | browser/s2-scenarios.json S2-1（真实查看打开详情弹窗）；frontend-tests/targeted-tests-clean-worktree.txt | 点击“查看”打开详情弹窗并加载 |
| DSUB-AC-050 | PASS | SC + HTTP + BR | [R0]http/detail-*.json；browser/s2-scenarios.json S2-1（详情为只读 GET，不连源 Oracle） | 详情只读展示配置与映射，不连接源库、无写请求 |
| DSUB-AC-051 | PASS | FT + BR | browser/s2-scenarios.json S2-5（真实：异常行无查看入口）；browser/s1-list-initial.png | 多源异常行不提供查看入口 |
| DSUB-AC-052 | PASS | BR + FT | browser/s2-scenarios.json S2-1/S2-2（真实详情完整渲染）；browser/s2-detail-normal.png/json | 详情完整渲染描述/源/分组表/目标/状态 |
| DSUB-AC-053 | PASS | FT + BT + BR | browser/s2-scenarios.json S2-4（真实无法解析分区警告）；browser/s2-detail-unparseable.png | 异常源/无法解析历史记录在详情显示警告 |
| DSUB-AC-054 | PASS | BR-IC + FT | browser/s2-scenarios.json S2-3（41 表详情内部滚动，`BROWSER_INTERCEPTED_UI_SCENARIO`，仅证 UI）；frontend-tests/targeted-tests-clean-worktree.txt | 详情表区限高内部滚动、表头固定 |
| DSUB-AC-055 | PASS | BT + HTTP + BR + FT | browser/s2-scenarios.json S2-4（真实无法解析分区保留展示）；[R0]backend-tests/targeted-tests-summary.txt；frontend-tests/targeted-tests-clean-worktree.txt | 三段正常不误判；无法解析历史 token 保留并展示 |
| DSUB-AC-056 | PASS | FT + SC | frontend-tests/targeted-tests-clean-worktree.txt（SubscribeDetailDialog.spec）；SC | 详情不展示遗留字段 |

## 领域六：新增/编辑弹窗交互与源库搜索（DSUB-AC-057~070）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-057 | PASS | BR + FT | browser/s3-scenarios.json S3-1（真实新增打开同一表单弹窗） | 新增与编辑共用同一表单弹窗组件 |
| DSUB-AC-058 | PASS | SC + BR | browser/s3-scenarios.json S3-3/S3-4（1440×900 与宽视口实测尺寸）；SC（UI §7.7 弹窗尺寸） | 弹窗尺寸符合 UI 基线并随视口约束 |
| DSUB-AC-059 | PASS | FT + BR | browser/s3-scenarios.json S3-4（真实标题栏拖动）；frontend-tests/targeted-tests-clean-worktree.txt（enableDialogDrag） | 标题栏可拖动（含 2048 宽视口实测） |
| DSUB-AC-060 | PASS | FT + BR | browser/s3-scenarios.json S3-5（真实脏表单关闭二次确认）；browser/s3-dirty-close.json | 脏表单关闭弹窗弹二次确认，取消不丢失表单 |
| DSUB-AC-061 | PASS | FT + BT + BR | browser/s3-scenarios.json S3-2（真实必填/单行 max255 交互）；[R0]backend-tests/targeted-tests-summary.txt | 必填校验、单行输入 max255，前后端一致 |
| DSUB-AC-062 | PASS | FT + BR | browser/s3-scenarios.json S3-8（真实可搜索单选下拉） | 源库下拉支持搜索 |
| DSUB-AC-063 | PASS | FT + BT + HTTP | frontend-tests/targeted-tests-clean-worktree.txt（禁用项+原因）；[R0]http/options.json | 停用/类别不符源库显示禁用与原因 |
| DSUB-AC-064 | PASS | FT + BR | browser/s3-scenarios.json S3-8（真实结果排序）；frontend-tests/targeted-tests-clean-worktree.txt（filterSourceOptions 四级排序） | 候选按四级排序（ID 精确/前缀/模糊/机构模糊） |
| DSUB-AC-065 | PASS | FT + BR | browser/s3-scenarios.json S3-8（真实大小写不敏感/trim/高亮） | 搜索忽略大小写、trim、命中高亮、无结果提示 |
| DSUB-AC-066 | PASS | FT + BR | browser/s3-scenarios.json S3-8（真实空搜索显示全部） | 空关键字显示全部候选 |
| DSUB-AC-067 | PASS | FT + BR | browser/s3-scenarios.json S3-8（真实选中态） | 下拉选项有清晰选中态 |
| DSUB-AC-068 | PASS | FT + BR | browser/s3-scenarios.json S3-9（真实新增态换源确认清空）；browser/s3b-scenarios.json S3-13（真实编辑态换源：取消保留/确定清空，PUT=0） | 切换源库弹二次确认并清空已选源表（新增与编辑态均实测） |
| DSUB-AC-069 | PASS | FT + BR | browser/s3-scenarios.json S3-6（真实布局结构） | 弹窗布局为左源库/右中源表区/右下目标区，源表区占主要空间 |
| DSUB-AC-070 | PASS | SC + BR | browser/s3-scenarios.json S3-3/S3-4；SC（视口约束） | 弹窗受视口尺寸约束可正常完整操作 |

## 领域七：目标库选择（DSUB-AC-071~074）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-071 | PASS | FT + BT + HTTP | frontend-tests/targeted-tests-clean-worktree.txt（SubscribeFormDialog.spec 目标禁用）；[R0]http/options.json | 目标库仅展示启用项，停用项禁用并说明 |
| DSUB-AC-072 | PASS | FT + BR | browser/s3-scenarios.json S3-7（真实两行紧凑卡片布局）；browser/s3-target-cards.png/json | 两行紧凑卡片、唯一复选框、3 卡同排、无“查看更多” |
| DSUB-AC-073 | PASS | FT + BR + REP | browser/s3-scenarios.json S3-7（真实卡片截图）；browser/s3-target-cards.png；REP(FRONTEND-IMPLEMENTATION-001-R3 视觉) | scoped CSS 白色主体四态（选中/禁用/悬停）视觉正确 |
| DSUB-AC-074 | PASS | FT + BT + HTTP + DB | [R0]http/create-success.json（3 目标选中保存）；[R0]backend-tests/targeted-tests-summary.txt | 最多 3 个目标均可选中并逗号分隔保存 |

## 领域八：Schema 与表选择（DSUB-AC-075~088）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-075 | PASS | HTTP + SC + BT + BR | [R0]http/metadata-schemas.json、metadata-tables-*.json（响应不含口令）；browser/s4a-scenarios.json S4-1（真实源 112-source-19c 加载 Schema 控制台无泄漏） | Schema/表由后端直连所选源库读取，日志与响应不泄露口令或完整连接串 |
| DSUB-AC-076 | PASS | SC + HTTP | [R0]http/options.json；SC（目标库只选择不连接） | 目标库仅选择，不在本流程连接 |
| DSUB-AC-077 | PASS | BT + HTTP + SC | [R0]backend-tests/targeted-tests-summary.txt（mviewExclusion/validateTables 40331/listSchemas 过滤）；[R0]http/metadata-schemas-fail.json | 不展示系统/空 Schema、视图、物化视图、同义词；协议保留字符对象不可选并说明 |
| DSUB-AC-078 | PASS | BR + FT | browser/s4a-scenarios.json S4-1（真实：Schema 懒加载 + 会话缓存，见网络计数/二次命中） | Schema 懒加载并在本次会话缓存 |
| DSUB-AC-079 | PASS | BR-IC + FT | browser/s4b-scenarios.json S4-8（Schema 加载失败重试，拦截 UI，仅证前端） | Schema 加载失败提供重试且不重复建立 240 次连接 |
| DSUB-AC-080 | PASS | BR + FT | browser/s4a-scenarios.json S4-1（真实左 Schema 右表结构） | 左侧 Schema 列表、右侧表列表，无“已选面板”独立区 |
| DSUB-AC-081 | PASS | BR + FT | browser/s4a-scenarios.json S4-2（真实表名模糊搜索，大小写不敏感） | 表名模糊搜索不区分大小写 |
| DSUB-AC-082 | PASS | BR + BR-IC + FT | browser/s4a-scenarios.json S4-3/S4-4（真实全选/只看已选）；browser/s4b-scenarios.json S4-6/S4-7a/S4-7b（拦截：240 行 Shift 边界/锚点连选） | 全选/取消筛选/只看已选/清空/Shift 连选行为正确 |
| DSUB-AC-083 | PASS | BR-IC + FT | browser/s4b-scenarios.json S4-8（拦截：切换 Schema 后已选表保留） | 切换 Schema 后已选表保留 |
| DSUB-AC-084 | PASS | BR + BR-IC + FT | browser/s4a-scenarios.json S4-4（真实勾选行浅蓝）；browser/s4b-scenarios.json S4-7b（拦截 240 行勾选态） | 勾选行整行浅蓝，无重复状态列 |
| DSUB-AC-085 | PASS | BR + BR-IC + FT | browser/s4a-scenarios.json S4-1（真实表头固定/内部滚动）；browser/s4b-scenarios.json S4-5（拦截 240 行内部滚动） | st-table-head 固定表头，表区内部滚动 |
| DSUB-AC-086 | PASS | BR-IC + FT | browser/s4b-scenarios.json S4-5（拦截 240 表容量） | 240 表容量正确渲染与可操作（拦截 UI，仅证前端） |
| DSUB-AC-087 | PASS | FT + BR | frontend-tests/targeted-tests-clean-worktree.txt（subscriptionFormat.spec `summarizeSelection/formatSelectionSummary`）；browser/s3-edit-echo.json、browser/s3b-source-switch-edit.json（真实弹窗摘要文本） | 汇总“已选择：1 个源库 · N 个 Schema · N 个表 · N 个目标库”；Schema 徽标计数正确。R0 原 `BR` 改为 `FT + 真实弹窗摘要观察` |
| DSUB-AC-088 | PASS | BR-IC + FT | browser/s4b-scenarios.json S4-5（拦截 240 表渲染，实际渲染完成） | 240 表渲染完整（拦截 UI 场景，仅证前端渲染） |

## 领域九：新增保存规则（DSUB-AC-089~096）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-089 | PASS | BT + HTTP + FT + BR-IC | browser/s5-scenarios.json S5-1（40300 结构化错误回显，拦截 UI，仅证前端展示）；[R0]http/create-fail-*.json | 前端/后端一致结构化校验，40300 业务错误清晰回显 |
| DSUB-AC-090 | PASS | BT + HTTP | [R0]http/create-fail-srcNotFound.json、srcInactive.json、categoryMismatch.json、tgtNotFound.json、tgtInactive.json | 源/目标不存在或类别不符/停用返回 40320/40321/40322 |
| DSUB-AC-091 | PASS | BT + HTTP | [R0]http/create-fail-commaSource.json、dupTable.json、dotTableName.json、schemaNotFound.json、tableNotFound.json | 结构化错误 40316/40317/40318、表校验 40330/40331 |
| DSUB-AC-092 | PASS | BT + HTTP | [R0]backend-tests/targeted-tests-summary.txt（validateTables 单 Schema 占位符/批量去重）；[R0]http/http-summary.txt | 有效性校验按 Schema 批量一次连接，非逐表 240 次 |
| DSUB-AC-093 | PASS | BT + FT + HTTP + BR-IC | browser/s5-scenarios.json S5-1（拦截 40300 一次列出）；browser/s3b-scenarios.json S3-14（失效表移除后解除保存阻断） | 校验错误一次全部列出并在表单结构化展示 |
| DSUB-AC-094 | PASS | BR + BR-IC + FT | browser/s5-scenarios.json S5-2a（拦截：保存中按钮禁用）；S5-2b（真实：双击仅提交 1 次） | 请求处理中保存按钮禁用，无法重复提交 |
| DSUB-AC-095 | PASS | BR + FT | browser/s5-scenarios.json S5-2b/S5-3/S5-9（真实：保存成功关闭弹窗、刷新列表、成功提示） | 新增保存成功自动关闭、刷新并提示生效说明 |
| DSUB-AC-096 | PASS | BT + HTTP | [R0]backend-tests/targeted-tests-summary.txt（120 表批量用例）；[R0]http/http-summary.txt | 后端按 Schema 批量校验，性能满足需求（一次连接） |

## 领域十：编辑规则（DSUB-AC-097~106）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-097 | PASS | FT + BR | browser/s3-scenarios.json S3-10（真实编辑完整回显同一弹窗）；browser/s5-scenarios.json S5-5（真实编辑后更新持久化） | 编辑完整回显描述/源/表/目标/状态到同一弹窗 |
| DSUB-AC-098 | PASS | FT + BR | browser/s3-scenarios.json S3-10（真实 1 Schema 回显计数）；browser/s5-5-edit.json（编辑后详情 2 Schema 分组） | 多 Schema 回显计数与分组正确 |
| DSUB-AC-099 | PASS | FT + BR | browser/s3b-scenarios.json S3-13（真实编辑换源：取消保留原表、确定清空；PUT=0 未写库） | 编辑态切换源库二次确认并清空已选表（不保存不落库） |
| DSUB-AC-100 | PASS | FT + BT + BR-IC | browser/s3b-scenarios.json S3-14（拦截注入 invalidTables：警告 + 保存禁用 + “移除异常已选表”解除）；[R0]backend-tests/targeted-tests-summary.txt（editOpen_sourceChecked_returnsInvalidTables） | 已失效已选源表在编辑打开时警告，保存前必须移除，移除后解除阻断 |
| DSUB-AC-101 | PASS | BT + HTTP + BR + BR-IC | browser/s5-scenarios.json S5-5（真实 PUT 编辑成功持久化）；S5-4（拦截：PUT REPLACE/PRESERVE 载荷采集不写库）；[R0]http/update-replace.json | 编辑提交采用 replace 语义并校验表有效性；异常路径不写库 |
| DSUB-AC-102 | PASS | BT + FT + HTTP + BR-IC | browser/s3-scenarios.json S3-12（拦截：源库不可达有限编辑）；browser/s5-scenarios.json S5-4（拦截 PRESERVE 载荷） | 源库断连时进入有限编辑，可改描述/目标，不触碰源表清单 |
| DSUB-AC-103 | PASS | FT + HTTP + BR-IC | browser/s3-scenarios.json S3-12（拦截：断连禁用源库/源表区） | 断连时源库/源表禁用且说明不可用原因 |
| DSUB-AC-104 | PASS | FT + BT + BR | browser/s3-scenarios.json S3-11（真实：异常源记录回显 + 修复前保存阻断） | 异常数据源完整回显；修复前禁止保存 |
| DSUB-AC-105 | PASS | FT + BT + BR | browser/s3-scenarios.json S3-11（真实：异常行无编辑入口） | 多源异常行无编辑入口，后端 editOpen 抛 40350 |
| DSUB-AC-106 | PASS | BT + DB | [R0]backend-tests/targeted-tests-summary.txt；R1 database/dml-execution-r1.txt | 编辑不改 `DATA_SUB_ID`/`INSERT_TIME`，`UPDATE_TIME=SYSDATE` |

## 领域十一：无并发保护边界（DSUB-AC-107~110）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-107 | PASS | BT + HTTP + SC + BR-IC | [R0]backend-tests/targeted-tests-summary.txt（noConcurrencyVersionTokenOrRowLockFields）；[R0]http/create-success.json；browser/s5-4-mode.json（拦截 PUT 载荷无 versionToken，采集不写库） | 无并发版本令牌/行锁字段，提交载荷不含 versionToken 等 |
| DSUB-AC-108 | PASS | SC + HTTP | [R0]http/update-preserve-keep.json（编辑期间外部修改后保存成功）；SC（update 无并发比较） | update 无并发比较，编辑后保存仍成功 |
| DSUB-AC-109 | PASS | SC + HTTP + DB | [R0]http/update-preserve-keep.json；[R0]database/dml-execution-summary.txt | 不使用 `UPDATE_TIME` 判断并发冲突 |
| DSUB-AC-110 | PASS | BT + SC | [R0]backend-tests/targeted-tests-summary.txt；SC（API 基线无 40910 定义） | 无并发冲突错误码 40910 及处理流程 |

## 领域十二：删除规则（DSUB-AC-111~117）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-111 | PASS | FT + BT + BR | browser/s1-list-initial.png + browser/s1-scenarios.json S1-9（真实：异常行操作按钮数=0，含删除入口缺失）；frontend-tests/targeted-tests-clean-worktree.txt | 多源异常行不提供删除入口 |
| DSUB-AC-112 | PASS | BT + HTTP + DB + BR | browser/s5-scenarios.json S5-8/S5-9（真实按主键删除，DELETE 增量=1，行消失）；[R0]http/delete-normal.json | 删除按主键物理删除 |
| DSUB-AC-113 | PASS | FT + BR | browser/s5-scenarios.json S5-6（真实删除确认完整内容）；browser/s5-6-delete-preview.json | 删除确认弹窗含完整提示、预览与二次确认文案 |
| DSUB-AC-114 | PASS | BT + SC + HTTP + BR | browser/s5-scenarios.json S5-6（真实删除预览计数）；[R0]http/delete-preview-normal.json | 预览返回删除计数且无 versionToken（无并发保护） |
| DSUB-AC-115 | PASS | BT + HTTP | [R0]backend-tests/targeted-tests-summary.txt（40430）；[R0]http/delete-notfound.json、delete-preview-notfound.json | 目标不存在返回 40430 业务提示 |
| DSUB-AC-116 | PASS | FT + BR | browser/s5-scenarios.json S5-8（真实：删除成功行消失 + 刷新 + 含重启说明提示） | 删除成功刷新列表并提示配置重启后生效 |
| DSUB-AC-117 | PASS | FT + BR | browser/s5-scenarios.json S5-7/S5-9（真实：取消删除不删除，DELETE 增量=0） | 取消不执行删除 |

## 领域十三：通用交互、安全与延期项（DSUB-AC-118~126）

| 验收 ID | 最终状态 | 实际执行方式 | 具体证据路径 | 结论 |
|---|---|---|---|---|
| DSUB-AC-118 | PASS | BR + BR-IC + FT | browser/s5-scenarios.json S5-2a/S5-2b（按钮禁用/双击仅 1 次提交）；全流程控制台 error=0：s1-console-errors.json、s2-console-errors.json、s3-console-errors.json、s3b-console-errors.json、s4a-console-errors.json、s4b-console-errors.json、s5-console-errors.json | 请求处理中按钮禁用防双击；全部浏览器流程控制台新增 error=0 |
| DSUB-AC-119 | PASS | BT + HTTP + BR-IC | [R0]backend-tests/targeted-tests-summary.txt（40340/40341 脱敏）；browser/s5-scenarios.json S5-1（拦截 40300 结构化错误清晰回显，无底层堆栈泄漏） | 后端凭据/口令脱敏；业务错误以结构化方式清晰提示 |
| DSUB-AC-120 | PASS | SC + HTTP | [R0]http/http-summary.txt；SC（后端无 ZK/Kafka/进程操作代码） | 后端无 ZK/Kafka/进程/启停副作用；真实 HTTP 调用无外部副作用日志 |
| DSUB-AC-121 | PASS | SC | SC（git 现场：R1 主工作区无 `large-screen` 修改；基线标注 DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE） | 大屏零 diff，正式基线保留延期状态 |
| DSUB-AC-122 | PASS | SC | SC（ACCEPTANCE 基线标注） | 大屏延期不阻断本 Feature 验收 |
| DSUB-AC-123 | PASS | SC + DB | R1 database/precheck-r1.txt；[R0]database/precheck-summary.txt | `DATA_SUB_ID` 为真实主键（DATABASE 基线 DATABASE_VERIFIED），数据字典只读核对一致 |
| DSUB-AC-124 | PASS | SC + DB + BT | R1 database/dml-execution-r1.txt（R1 种子 `FG_ACTIVE=1`）；[R0]backend-tests/targeted-tests-summary.txt | 新增默认 `FG_ACTIVE=1`，删除为物理删除 |
| DSUB-AC-125 | PASS | SC + FT | frontend-tests/targeted-tests-clean-worktree.txt；SC | 无通知/重启/ZK/Kafka/运行态/任务启停能力，页面无此类 UI |
| DSUB-AC-126 | PASS | BR + HTTP + DB | browser/s5-scenarios.json S5-9（真实端到端闭环：新增→列表→详情→编辑→删除预览→取消→再次预览→确认删除→消失）；[R0]http/create-success.json；R1 database/dml-execution-r1.txt、restore-r1.txt | 页面端到端完整维护 `CDC_DATA_SUBSCRIBE`，“一个源库 × 一组源表 × 一个或多个目标库”闭环通过 |

---

## 汇总与真实/拦截边界

- 逐条复核：126/126 **PASS**（无 FAIL、无 BLOCKED）。
- 浏览器场景共 54 个（S1×10、S2×6、S3×13、S3 补充×3、S4-A×5、S4-B×6、S5×11），其中真实场景引用真实后端 API 与已批准数据；`BROWSER_INTERCEPTED_UI_SCENARIO`（`BR-IC`）仅证明前端 UI 行为，标注于场景记录与本矩阵各行。
- R0 原矩阵不准确 `BR` 标注纠正：
  - AC-046 目标异常展示、AC-087 汇总/徽标改为 `FT + 真实弹窗摘要/真实列表 DOM` 支撑（AC-087 以 `subscriptionFormat.spec formatSelectionSummary` 为 FT 主证据，辅以真实弹窗摘要文本）；不再以 `BR` 概括。
  - 其余 R0 声明 `BR` 的用例（059/060/078~088/094~100/104/113/116~118/126 等）已在 R1 以真实浏览器场景或明确 `BR-IC` 场景补验，见 `browser/browser-scenario-index.md`。
- 数据库：R1 数据源前缀种子/临时目标库已按 §7.3 于单一事务内恢复（见 `database/restore-r1.txt`）；备份表与当前表行数一致、双向 `MINUS=0`、主键集合一致、CLOB 一致、R1 残留 0。
- 前端干净 worktree：定向 7 文件 / 124 用例全 PASS、全量 22 文件 / 359 用例全 PASS、`npm run build` PASS（`frontend-tests/*clean-worktree.txt`）。未跟踪 `frontend/src/api/subscription.spec.ts` 未带入、未执行、未计数。
