# 第二轮验收前 UI 调整基线 R3 极小记录纠正执行报告 DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R3

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R3` |
| 任务类型 | `DOCUMENT_MINIMAL_CORRECTION_R3`（纯文档极小记录纠正：对 R2 结果提交独立复审发现的两类**文档审计记录错误**做原位纠正；不改任何需求、验收、设计或 UI 业务规则；不实现代码、不执行验收） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 分支 | `develop` |
| 任务起始提交（base） | `e38cfaa4c4aed7b8e6a2a27b6df2774a8e8ef167`（本任务开始时本地 HEAD、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致，ahead/behind=`0/0`，无分叉） |
| R2 任务 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2` |
| R2 结果提交 | `e38cfaa4c4aed7b8e6a2a27b6df2774a8e8ef167`（本 R3 的任务起始提交，即 R2 结果提交） |
| 复审来源 | ChatGPT 对 R2 结果提交 `e38cfaa4c4aed7b8e6a2a27b6df2774a8e8ef167` 独立正式复审结论 `CHANGES_REQUIRED`（确认 R2 核心业务纠正正确，仅两类文档审计记录错误需 R3 修正） |
| 纠正日期 | `2026-09-08` |
| 任务状态 | `COMPLETED`（已完成纯文档 R3 记录纠正、四既有文档/报告与总索引同步并推送；当前 R2/R3 纠正版未批准、第二轮调整未实现、验收未执行） |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交与推送结果见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`） |

## 2. R3 基准与 ChatGPT 对 R2 的正式复审结论

ChatGPT 已对 R2 结果提交（任务起始提交 `e38cfaa4c4aed7b8e6a2a27b6df2774a8e8ef167`）独立正式复审，结论 `CHANGES_REQUIRED`，并确认 R2 核心业务纠正全部正确：

- 源库列主内容仍为 `DATA_SOURCE_ORG`，ORG 为空或配置不存在时回退原始 `DATA_SOURCE_ID`；
- 正常行与回退行 Tooltip 均只显示完整原始 `DATA_SOURCE_ID`；
- 需求业务行变化仅为 `DSS-REQ-029/070/074`；验收业务行变化仅为 `DSS-AC-027/075/076/077/083/086`；
- 需求 75 条、验收 86 条且全部 `NOT_RUN`；
- `API.md`、`DATABASE.md`、代码和测试零差异；
- 当前状态恢复为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 正确。

复审结论 `CHANGES_REQUIRED` 仅指向以下两类记录错误，本 R3 只针对这两类做文档级记录纠正：

1. **R3-01**：`REQUIREMENTS.md` 的 R2 变更记录错误声称整个 `ACCEPTANCE.md` 零差异；
2. **R3-02**：Feature README 与 R2 报告现行“下一入口”仍把 R2 纠正前旧批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 作为未来第二轮实现业务基准。

## 3. R3-01：纠正 R2 对 ACCEPTANCE 差异的错误声明

### 3.1 原错误

`docs/features/data-source-snapshot-status/REQUIREMENTS.md` 的 R2 变更记录（§25 文档级变更记录，2026-09-08 行）原文声称：

> `ACCEPTANCE.md`（86 条全部 `NOT_RUN`）与追踪矩阵、`API.md`/`DATABASE.md`/第二轮初版报告/R1 报告/批准收口报告/第一轮全部报告证据整文件零差异。

该说法与 R2 实际提交不一致。R2 确实原位修改了 `ACCEPTANCE.md` 以下 6 条验收业务行：

- `DSS-AC-027`
- `DSS-AC-075`
- `DSS-AC-076`
- `DSS-AC-077`
- `DSS-AC-083`
- `DSS-AC-086`

### 3.2 修正后事实（已原位写入 R2 变更记录）

R2 原位纠正 `DSS-AC-027/075/076/077/083/086` 六条验收业务行中的源库 Tooltip 内容；其余 80 条验收业务行逐字节零差异；86 条验收仍全部 `NOT_RUN`；需求—验收追踪矩阵零差异。修正后不再声称整个 `ACCEPTANCE.md` 零差异，也不把状态元数据、变更记录的同步误写成业务行变化。

### 3.3 实际修改位置

- `REQUIREMENTS.md` §25 文档级变更记录 2026-09-08 R2 行：把错误子句“`ACCEPTANCE.md`（86 条全部 `NOT_RUN`）与追踪矩阵、…整文件零差异”原位改为“`ACCEPTANCE.md` 仅原位纠正 `DSS-AC-027/075/076/077/083/086` 六条验收业务行中的源库 Tooltip 内容，其余 80 条验收业务行逐字节零差异、86 条验收仍全部 `NOT_RUN`、需求—验收追踪矩阵零差异；`API.md`/`DATABASE.md`/第二轮初版报告/R1 报告/批准收口报告/第一轮全部报告证据整文件零差异”。
- 并在该 R2 行之后新增一条 R3 文档级变更记录行（日期 2026-09-08，任务编号 `...-002-R3`），说明本 R3 只纠正审计描述与未来实现锚点、不修改任何 `DSS-REQ-001~075` 业务行、不修改追踪矩阵。

## 4. R3-02：纠正后续实现任务的旧批准内容锚点

### 4.1 原错误

以下现行“下一入口/下一步”记录仍要求后续第二轮实现任务严格基于 R2 纠正前的旧批准内容基准提交 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 提交：

1. `docs/features/data-source-snapshot-status/README.md` 当前第二轮 R2 后续入口说明（§1 实现状态行、§2 当前阶段行、§10 下一流程入口）；
2. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2.md` 的下一入口说明（§11）；
3. `docs/features/README.md`（总索引）主表 data-source-snapshot-status 行的“下一入口”列。

`5da9b17c1a720f89482eeda1436ad633145fe9fa` 是 R2 纠正前的旧批准内容基准，其中正常源库行 Tooltip 仍错误写为完整 `DATA_SOURCE_ORG`；若继续把它作为未来实现任务的业务基准，将重新引入 R2 已经纠正的 ORG Tooltip 问题。

### 4.2 修正后事实（已写入三处现行下一入口）

- 现行下一入口统一为先由 ChatGPT 对 R3 结果提交独立正式复审；
- 复审通过后由项目负责人重新批准当前 R2/R3 纠正版；
- 再单独建立批准收口任务；
- 后续第二轮实现任务必须以批准收口中记录的、包含 R2 Tooltip 纠正的最新批准内容基准为业务依据；
- 禁止继续以 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 作为第二轮实现任务的业务基准（其仅保留为 R2 纠正前的历史批准内容基准/历史批准事实）。

当前尚未产生 R3 结果提交和新的批准收口提交，因此：
- 不虚构、不预填未来提交 SHA；
- `e38cfaa4c4aed7b8e6a2a27b6df2774a8e8ef167` 可描述为“R2 纠正内容提交/当前业务纠正来源”；
- 未来实现基准使用描述性占位“重新批准并完成批准收口后记录的最新批准内容基准提交”（Feature README 与 R2 报告用“重新批准并完成批准收口后记录的、包含 R2 Tooltip 纠正的最新批准内容基准提交”）；
- 历史批准记录中提到 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 保留，但明确其只代表 R2 前的历史批准事实，不作为当前后续实现依据。

### 4.3 实际修改位置

- `README.md` §1 实现状态行、§2 当前阶段行：把“另立第二轮 UI 调整实现任务按批准内容基准提交 `5da9b17c...` 落地”等未来指令改为描述性占位，并标注 `5da9b17c...` 仅历史、不得作为未来业务依据；§2 当前下一入口改为“ChatGPT 对本 R3 结果提交独立正式复审”。
- `README.md` §8 已决策交互方案与当前开放状态：新增一条 R3 记录纠正 bullet（2026-09-08，任务 `...-002-R3`），说明 R3-01/R3-02 纠正内容、状态不变、下一入口。
- `README.md` §10 下一流程入口：重写未来第二轮实现任务与当前下一入口，禁止以 `5da9b17c...` 作为业务基准。
- `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2.md` §11 下一入口：修正错误绑定 `5da9b17c...` 的句子，并加一条明确的 **R3 纠正注记**（标注为 ChatGPT 对 R2 结果独立正式复审 `CHANGES_REQUIRED` 后补记，非 R2 执行当时已知事实）；R2 已发生的执行事实、文件范围、需求/验收变化编号、Git 结果和零差异证明未改写。
- `docs/features/README.md`（总索引）主表 data-source-snapshot-status 行“下一入口”列：未来业务基准改为描述性占位、禁止 `5da9b17c...`，下一入口改为“ChatGPT 对本 R3 结果提交独立正式复审”；并在变更记录新增一条 2026-09-08 R3 记录纠正行。

## 5. R2 实际修改的验收业务行与其余 80 条零差异

R2（任务起始提交前已完成，本 R3 只做记录纠正）实际原位修改 6 条验收业务行：`DSS-AC-027/075/076/077/083/086`（源库 Tooltip 内容），其余 80 条验收业务行逐字节零差异、86 条验收仍全部 `NOT_RUN`、需求—验收追踪矩阵零差异。需求业务行变化仅为 `DSS-REQ-029/070/074`；其余需求/验收业务行逐字节零差异。

## 6. 为什么 `5da9b17c...` 只能作为历史批准事实

`5da9b17c1a720f89482eeda1436ad633145fe9fa` 是 R2 纠正前的第二轮批准内容基准提交（ChatGPT 对 R1 结果独立正式复审 `APPROVED`、项目负责人明确“批准”后收口为正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-002` 所依据的内容提交）。批准收口后发现该基准把“正常源库行 Tooltip 显示完整 `DATA_SOURCE_ORG`”误记为现行规则、与项目负责人真实需求冲突，R2 已纯文档纠正为“悬停 Tooltip 只显示完整原始 `DATA_SOURCE_ID`”。因此：

- `5da9b17c...` 只是 R2 纠正发生之前的**历史批准内容基准**，代表当时的批准事实；
- 若把 `5da9b17c...` 重新作为未来第二轮实现业务基准，实现将按错误 ORG Tooltip 落地，重新引入 R2 已经纠正的冲突；
- 未来实现必须以重新批准并完成批准收口后记录的、包含 R2 Tooltip 纠正的最新批准内容基准为业务依据；R3 不虚构该最新基准的提交 SHA，在批准收口完成后由批准收口记录补记。

## 7. 强制一致性与残留扫描（机械核验）

Commit 前机械核验结果：

1. `DSS-REQ-001~075` 定义行连续唯一，共 75 条（`grep '^| DSS-REQ-[0-9]+'` 计数 75、唯一 75、无 `DSS-REQ-076`）；全部业务行相对任务起始提交 `e38cfaa4...` 逐字节零差异（`diff` 提取 REQ 定义行与 base 对比为空，`REQ-ROWS-ZERO`）。
2. `DSS-AC-001~086` 定义行连续唯一，共 86 条（计数 86、唯一 86、无 `DSS-AC-087`），86 条全部 `NOT_RUN`（`acceptance_not_run_count=86`）。
3. `ACCEPTANCE.md`、`DESIGN.md`、`UI.md`、`API.md`、`DATABASE.md` 相对任务起始提交 `e38cfaa4...` **整文件零差异**（`git diff --quiet` 均 ZERO）。
4. 第二轮初版报告 `...-002.md`、R1 报告 `...-002-R1.md`、批准收口报告 `...-APPROVAL-002.md` 整文件零差异（`git diff --quiet` 均 ZERO）。
5. 需求—验收、需求—设计、验收—设计追踪矩阵零差异（所在文件整文件零差异或未触碰，见上文）。
6. `REQUIREMENTS.md` 的 R2 记录不再声称整个 `ACCEPTANCE.md` 零差异（已原位纠正；grep 旧错误子句计数 0）。
7. R2 记录准确列出 6 条变化验收（`DSS-AC-027/075/076/077/083/086`）和其余 80 条零差异（grep 命中 1 处修正句）。
8. Feature README 与 R2 报告的现行下一入口不再以 `5da9b17c...` 作为未来实现业务基准（grep 残余 `5da9b17c...` 逐处分类均为历史批准内容基准/批准事实，见 §8 残留扫描）。
9. 所有仍出现的 `5da9b17c...` 逐处分类：只作为历史批准内容基准/历史批准事实出现；不得作为当前/未来实现依据。
10. 未出现“R3 已批准”“R3 复审通过”“第二轮已实现”“正式验收已执行/通过”等越权表述；R3 只描述“ChatGPT 对本 R3 结果提交独立正式复审”为当前下一入口。
11. 当前状态（requirements/acceptance/design/ui_status、implementation_status、验收状态、pending_user_review、pending_user_confirmation_count）在 REQUIREMENTS、Feature README、总索引与本 R3 报告一致。
12. 实际修改/新增文件只能是本任务白名单的 5 个文件（4 个既有文件＋1 个新增报告）。

残留扫描说明：扫描四份既有白名单文件（REQUIREMENTS、Feature README、总索引、R2 报告）中全部 `5da9b17c1a720f89482eeda1436ad633145fe9fa`/`5da9b17...` 出现处，逐处确认只属于：R2 前第二轮批准收口的正式批准内容基准记录（`...-APPROVAL-002` 历史批准事实）、R2 纠正过程叙述（描述 R2 前旧基准含错误 ORG Tooltip）、或 R3 纠正句中“该最新基准不是/禁止/仅历史 `5da9b17c...`”的否定性表述；没有一处作为当前或未来第二轮实现任务的业务基准指令。

## 8. 修改文件与 UTF-8/NUL 校验

- 实际修改的既有文件（4 个）：
  1. `docs/features/data-source-snapshot-status/REQUIREMENTS.md`
  2. `docs/features/data-source-snapshot-status/README.md`
  3. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R2.md`
  4. `docs/features/README.md`
- 新增文件（1 个）：
  5. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R3.md`（本报告）

上述 5 个文件均为有效 UTF-8，真实 NUL 字节为 0（写入内容不含二进制/控制字符）。

## 9. 业务与状态零变化边界（本 R3）

- `DSS-REQ-001~075` 共 75 条业务行逐字节零差异；
- `DSS-AC-001~086` 共 86 条业务行逐字节零差异且全部 `NOT_RUN`；
- 需求—验收、需求—设计、验收—设计追踪矩阵零差异；
- 源库主内容 ORG/原始 ID 回退和 Tooltip 只显示原始 `DATA_SOURCE_ID` 的 R2 现行规则零变化；
- 探针端、表格铺满、五固定两弹性列、下拉截断、Tooltip 单实例、刷新/查询状态机等全部规则零变化；
- API、DATABASE、后端、数据库和产品只读边界零变化；
- 历史提交、批准事实和历史报告内容除本任务明确纠正的 R2 报告错误句（§11）外不变。

当前状态保持：

```text
requirements_status=DRAFT_ADJUSTMENT_PENDING_USER_REVIEW
acceptance_status=DRAFT_ADJUSTMENT_PENDING_USER_REVIEW
design_status=DRAFT_ADJUSTMENT_PENDING_USER_REVIEW
ui_status=DRAFT_ADJUSTMENT_PENDING_USER_REVIEW
implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING
formal_acceptance_execution_status=NOT_RUN
human_visual_acceptance_status=NOT_RUN
human_visual_review_status=CHANGES_REQUIRED
pending_user_review=YES
pending_user_confirmation_count=0
```

说明：`human_visual_review_status=CHANGES_REQUIRED` 仍是第一轮页面人工检查历史；本 R3 只纠正记录，不新增待用户决策。

## 10. 零差异证明

- `ACCEPTANCE.md`、`DESIGN.md`、`UI.md`、`API.md`、`DATABASE.md`：整文件零差异（相对任务起始提交 `e38cfaa4...`，`git status`/`git diff` 无任何改动）。
- 第二轮初版报告 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002.md`、R1 报告 `...-002-R1.md`、批准收口报告 `...-APPROVAL-002.md`：整文件零差异。
- 第一轮全部报告与证据：零差异。
- 全部前后端源码、测试、配置、数据库、ZooKeeper、Kafka、服务操作：`NONE`（本任务为纯文档记录纠正）。
- 其他 Feature 文档：零差异（总索引本 Feature 行与本次变更记录除外）。

## 11. 构建/测试/服务/数据访问

本任务为纯文档任务，未构建、未测试、未启动任何服务、未执行浏览器验证与正式验收、未访问数据库/ZooKeeper/Kafka：

```text
test_build_status=NOT_RUN_NOT_APPLICABLE_DOCS_ONLY
browser_verification_status=NOT_RUN_NOT_APPLICABLE_DOCS_ONLY
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_access_status=NONE
kafka_access_status=NONE
service_operation_status=NONE
code_change_status=NONE
```

## 12. Git 提交记录

- 本任务开始提交：`e38cfaa4c4aed7b8e6a2a27b6df2774a8e8ef167`（本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 三者一致，ahead/behind=`0/0`）。
- 本任务按完整路径逐个暂存白名单内 5 个文件（4 个既有文件＋本新增报告），未使用 `git add .`/`git add -A`；工作区其余用户既有未提交内容保持原样。
- 结果提交、远程提交与推送状态见任务机器可读输出 `AGENT_TASK_RESULT`（本报告不预填尚未产生的 result_commit_id）。
- 本任务完成普通 Commit 与普通 Push 后即停止；未批准 R2/R3 纠正版、未实现第二轮 UI 调整、未执行正式验收、未把页面标记为人工接受。

## 13. 下一入口

下一入口为 **ChatGPT 对本 R3 结果提交独立正式复审**（不是直接实现、不是直接批准收口）。复审通过并由项目负责人重新批准后，再单独建立批准收口任务；后续第二轮 UI 调整实现任务必须以批准收口中记录的、包含 R2 Tooltip 纠正的最新批准内容基准为业务依据（禁止以 `5da9b17c1a720f89482eeda1436ad633145fe9fa` 作为未来第二轮实现业务基准），按 DESIGN §22/§23 与 UI §16/§17 落地本轮四类展示调整并补齐证据与验收；正式验收（`DSS-AC-001~086` 共 86 条）另立独立正式验收任务执行。
