# DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R1 执行报告

> ## ⚠️ R2 勘误声明（2026-09-19，任务 `...-001-R2`）
>
> **本报告（R1）关于“跨文档完全一致 / 无残留冲突”的结论已被 R2 定向修正，阅读本报告时须同时阅读 R2 结论。**
>
> - ChatGPT 对远程 R1 提交 `c4e10486465fbb406dbc068ff0998c49edd4e53b` 的复审结论仍为 **`CHANGES_REQUIRED`**，`blocking_finding_count=1`，`implementation_may_start=NO`：**唯一阻塞位于 `DATABASE.md §9.2`**（两处关联表述错误）。
> - 具体地，本报告 §5「静态检查结果」中“**跨文档一致性**……对读取、幂等、条件 `UPDATE`、`50002`、失败保留列表的表述一致”以及“冲突表述清除”两项结论**不完整**：`DATABASE.md §9.2` 仍把「停用」的 `NULL`/非 `0`/`1` 统一写成 `FG_ACTIVE IS NULL`，且错误码说明仍写成“`NULL`/非 `0`/`1`……对启停接口返回 `40250`”（误含 `disable`）。
> - R1 的其余修订（删除虚构需求引用、先读、幂等不写、带原状态条件 `UPDATE`、并发 `50002`、失败不刷新）**继续有效**，本 R2 只修正上述 `DATABASE.md §9.2` 两处。
> - 本报告历史内容**不删除**；修订详情见 [DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2.md](./DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2.md)。

- 任务编号：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R1`
- 日期：2026-09-19
- 分支：`develop`
- 任务性质：`DOCUMENT_ONLY_TARGETED_R1_CORRECTION`（**纯文档定向修订**）
- 复审依据：ChatGPT 对远程提交 `4ccd66106e832a0fd10dc42617507899cbb26463` 的独立复审
  （`review_status=CHANGES_REQUIRED`、`blocking_finding_count=3`、`implementation_may_start=NO`）
- 实现授权：`NOT_GRANTED_IN_THIS_TASK`
- 测试与构建：`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`

> 本 R1 只修复 ChatGPT 复审发现的**文档内部冲突**：删除虚构的需求引用、统一启停的读取/幂等/条件 `UPDATE`/并发方案、
> 统一“失败不刷新列表”的页面行为，并对初版报告做勘误。**未**实现任何功能、**未**批准基线、**未**执行正式验收；
> **未**修改任何 `.java`/`.vue`/`.ts`/测试/依赖/锁定文件/配置/SQL/数据库对象；**未**访问数据库 / ZooKeeper / Kafka；
> **未**启动/停止服务。

---

## 1. Git 现场

```text
branch=develop
reviewed_base_commit_id=4ccd66106e832a0fd10dc42617507899cbb26463
HEAD(before)=4ccd66106e832a0fd10dc42617507899cbb26463
origin/develop(before)=4ccd66106e832a0fd10dc42617507899cbb26463
rev-list --left-right --count HEAD...origin/develop (before) = 0	0
git status --short --branch (before) =
    ## develop...origin/develop
     M .claude/settings.local.json
    ?? docs/prompts/
result_commit_id / remote_commit_id / ahead_behind（after）：见任务控制台结果块
```

- 开始前执行 `git fetch origin develop`，确认 `origin/develop` **仍为** `4ccd6610...`，与 `reviewed_base_commit_id` 一致，未出现新远程提交，无需换基准。
- 任务开始前工作区已有的 `.claude/settings.local.json`（修改）与 `docs/prompts/`（未跟踪）属用户现场，本任务**未**修改、**未**暂存、**未**提交、**未**回滚。

## 2. ChatGPT 三类阻塞问题与修订前/后结论

### 2.1 引用不存在的需求编号（记为 `DS-REQ-18x`）

> 约定：初版 `API.md` 错误引用了一个**不存在、编号超出本轮最大 `DS-REQ-177`** 的需求编号；为避免与实际需求编号混淆，本报告统一将其记为 `DS-REQ-18x`。

- **修订前**：`API.md` §11 有 4 处引用该虚构需求编号（§4.1 局部替代提示、§11.2、§11.4、§11.6 追踪表）；本轮需求最大编号实为 `DS-REQ-177`，故 `traceability_status=COMPLETE` 不成立。
- **修订后**：删除全部 `DS-REQ-18x` 引用，改为引用**既有权威**敏感信息保护需求 `DS-REQ-047`/`DS-REQ-107`；涉及启停不访问外部系统与成功消息边界处**并列** `DS-REQ-169`（不以其替代安全需求）。`ACCEPTANCE.md` 中 `DS-AC-181` 的“关联需求”列由 `DS-REQ-169` 修正为 `DS-REQ-047, DS-REQ-107, DS-REQ-169`；`DS-AC-181` 编号、状态、正文保持不变。§5 追踪矩阵：`DS-REQ-047` 增补 `DS-AC-181`、`DS-REQ-107` 增补 `DS-AC-181`、`DS-REQ-169` 保留 `DS-AC-181`。
- **检查**：全仓定向搜索“编号大于本轮最大 `DS-REQ-177` 的需求引用”结果数为 **0**；未新增任何需求编号。

### 2.2 `disable` 的无状态条件 `UPDATE` 与幂等/目标不存在判定冲突

- **修订前**：`DESIGN.md` §13.5 写“单条 `UPDATE` 短事务”、`disable` 可由 `UPDATE ... SET FG_ACTIVE='0' WHERE DATA_SOURCE_ID=?` 自身归一化（无限定原状态）；`DATABASE.md` §9.3 示例 SQL 亦为无状态条件。无状态条件 SQL 会破坏“当前已为 `'0'` 时不执行 DML”的幂等约束，也无法独立区分“目标不存在”与“已经为 `'0'`”。
- **修订后**（`DESIGN.md` §13.5、`API.md` §11.3/§11.4、`DATABASE.md` §9.2/§9.3 统一为**同一套唯一方案**）：
  - **两接口均先读取**：在事务内先按 `DATA_SOURCE_ID` 读取主表当前记录及原始 `FG_ACTIVE`（**不**按 `FG_ACTIVE='1'` 过滤）；记录不存在 → `40400`，**不执行 DML**；只读本表该记录，不访问源库 / ZooKeeper / Kafka / 进程；不加锁、不新增版本字段。
  - **最多一条 `UPDATE`**：**每次非幂等状态变更最多执行一条 `UPDATE`；允许在 `UPDATE` 前执行状态读取**。不再表述为“接口全程只有一条 SQL”。
  - **条件 `UPDATE`**：非幂等路径 `UPDATE` 必须**同时匹配** `DATA_SOURCE_ID` 与**本事务开始时读取到的原始 `FG_ACTIVE`**（含 `NULL` 正确处理）。等价伪 SQL：

    ```sql
    UPDATE CDC_DATA_SOURCE
    SET FG_ACTIVE = :targetStatus
    WHERE DATA_SOURCE_ID = :dataSourceId
      AND ( FG_ACTIVE = :observedStatus
            OR (FG_ACTIVE IS NULL AND :observedStatus IS NULL) )
    ```

    **禁止**退化为 `UPDATE CDC_DATA_SOURCE SET FG_ACTIVE='0' WHERE DATA_SOURCE_ID=?`。
  - **状态机不变**：`enable` 仅 `'0'`→`'1'`、`'1'` 幂等不写、`NULL`/非 `0`/`1` → `40250` 不写；`disable` `'1'`→`'0'`、`'0'` 幂等不写、`NULL`/非 `0`/`1`→条件 `UPDATE` 写 `'0'` 归一化。
  - **影响行数与并发完全冻结**：影响行数为 `1` → 成功；**不为 `1`（含读取后被其他请求改变导致 `0` 行）→ `50002`，当前事务回滚**；不引入重试、再次读取后改判成功、悲观锁、乐观版本字段或新错误码；重复目标状态**只有**在首次读取时已处于目标状态才按幂等成功；并发相反请求最终状态允许为其中一个请求的目标值，发生条件 `UPDATE` 冲突的请求返回 `50002`。

### 2.3 失败页面行为不一致 + 并发错误码留待实现期

- **修订前**：`DS-REQ-173`/`DS-AC-177` 与 `UI.md` 要求“任何启停失败保留当前列表”，但 `DESIGN.md` §13.5、`API.md` §11.4 与原报告要求 `40400`/`40250` 后**刷新列表**；同时 `DS-AC-174` 把并发冲突错误码留到实现期冻结，违反 `DS-REQ-171`“设计期完全冻结”。
- **修订后**（以 `DS-REQ-173`/`DS-AC-177` 为唯一当前有效结论）：
  - `40400` → 提示目标数据源不存在；**不刷新列表**。
  - `40250` → 提示状态异常、需先停用归一化；**不刷新列表**。
  - `50002`/`50000` → 提示操作失败、请重试；**不刷新列表**。
  - **任何启停失败（含网络失败与上述业务码）均不自动重新查询**，一律保留当前列表、结果总数与已应用查询条件并**恢复 busy**；**只有成功**才按当前已应用查询条件重新查询（不读取未点击“查询”的草稿条件）。
  - `DS-AC-174` 预期结果中“按实现期冻结的错误码返回”改为明确的“条件 `UPDATE` 冲突（影响行数 ≠ 1）返回 `50002`（`STATUS_FAILED`）并回滚”；用例编号与 `NOT_RUN` 状态不变。
  - `REQUIREMENTS.md`、`UI.md` 的失败行为本已正确，按授权**未**修改。

## 3. 实际修改文件

| 文件 | 操作 | 变更范围 |
|---|---|---|
| `docs/features/data-source-management/API.md` | 修改 | 删除 `DS-REQ-18x`（4 处）→ `DS-REQ-047`/`DS-REQ-107`（并列 `DS-REQ-169`）；§11.3 重写读取/事务/条件 `UPDATE`/影响行数/并发；§11.4 错误表 50002 行与前端消息处理统一为“失败不刷新”；§11.6 追踪表行更新；新增 §12.2 R1 变更记录 |
| `docs/features/data-source-management/ACCEPTANCE.md` | 修改 | `DS-AC-181` 关联需求列 → `DS-REQ-047, DS-REQ-107, DS-REQ-169`；`DS-AC-174` 预期结果 → 明确 `50002` 回滚；§5 追踪矩阵 `DS-REQ-047`/`DS-REQ-107` 增补 `DS-AC-181`；§7 新增 R1 变更记录行 |
| `docs/features/data-source-management/DESIGN.md` | 修改 | §13.5 重写“读取、事务与写入边界（冻结）”、错误表 50002 行、前端消息处理；§13.6 成功/失败处理；新增 §14.2 R1 变更记录 |
| `docs/features/data-source-management/DATABASE.md` | 修改 | §9.2 启停两行重写为先读 + 条件 `UPDATE`；§9.3 重写（先读、最多一条条件 `UPDATE`、伪 SQL、禁止无状态条件、影响行数/并发冻结）；新增 §10.2 R1 变更记录 |
| `docs/features/data-source-management/README.md` | 修改 | §2.3 追加 R1 修订链并指向本 R1 报告；§5 新增 R1 变更记录行；状态分层与导航未改 |
| `docs/features/data-source-management/reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001.md` | 修改 | 顶部新增 R1 勘误声明；§3.1/§6/§8 被取代处就近加 **【已被 R1 取代】** 标注；§12 新增勘误记录行；历史内容保留未删 |
| `docs/features/data-source-management/reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R1.md` | **新增** | 本报告 |

**未修改**：`REQUIREMENTS.md`、`UI.md`（按 §3 授权明确禁止，其正文已正确）；任何 `.java`/`.vue`/`.ts`/测试/依赖/锁定文件/配置/SQL/数据库对象；`docs/baseline/**`；其他 Feature；公共组件；历史报告（本任务明确授权勘误的原报告除外）；任务前已有的 `.claude/settings.local.json`、`docs/prompts/`。

## 4. 编号、数量、状态与正文保护检查

```text
requirements_before=DS-REQ-001..177 (177 条)
requirements_after =DS-REQ-001..177 (177 条)
requirements_body_change_status=NONE                         # DS-REQ-001~177 编号与正文零变化
new_requirement_range=DS-REQ-139_TO_177
new_requirement_count=39                                     # DS-REQ-139~177 仍为 39 条
fabricated_requirement_reference=OUT_OF_RANGE_REQ_REF_COUNT=0  # 超出 DS-REQ-177 的虚构需求引用已清零

acceptance_before=DS-AC-001..182 (182 条)
acceptance_after =DS-AC-001..182 (182 条)
new_acceptance_range=DS-AC-141_TO_182
new_acceptance_count=42                                      # 仍为 42 条，全部 NOT_RUN
acceptance_allowed_change_status=ONLY_DS_AC_181_REQUIREMENT_COLUMN_AND_DS_AC_174_CONFLICT_WORDING_AND_TRACEABILITY_MAPPING
previous_adjustment_acceptance_status=DS-AC-116_TO_140_ALL_NOT_RUN   # 仍为 25 条全部 NOT_RUN
existing_acceptance_status=PASS_113_FAIL_0_BLOCKED_2_NOT_RUN_0       # 逐字保留
blocked_cases=DS-AC-104,DS-AC-108                            # 两个既有 BLOCKED 及证据不变

traceability_status=COMPLETE_AFTER_R1
```

- `DS-AC-141~182` 除 §5 允许的三个单元格外，其余业务正文零变化；本轮 42 条仍全部 `NOT_RUN`。
- 既有 115 条用例、`PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 及原始证据逐字保留。
- 初版草案的 UI 决策（重置零请求、只显示 `共 n 条`、序号列、主机列缩窄、行高/字体、全部状态展示、停用/异常标识、动态启停菜单、黑色新增按钮、不分页、无刷新工具栏、Tooltip 保留、三个弹窗无非必要视觉调整）与停用/异常操作矩阵**不变**；仅修正其后端落地方式与并发返回规则。
- 启停仍只修改 `CDC_DATA_SOURCE.FG_ACTIVE`；无级联、无 DDL、无存量清洗、不访问源库/ZooKeeper/Kafka、不操作服务或进程。

## 5. 静态检查结果

| 检查 | 结果 |
|---|---|
| `git diff --check` | 无空白/冲突标记问题（见 §7 执行记录） |
| 变更文件范围 | 仅 §3 授权的 7 个文件（6 修改 + 1 新增），无范围外文件 |
| `DS-REQ-139~177` 数量与正文 | 39 条，正文零变化 |
| `DS-AC-141~182` 数量与状态 | 42 条，全部 `NOT_RUN`；仅 §5 允许单元格变化 |
| 上一轮 `DS-AC-116~140` 与既有统计 | 25 条全部 `NOT_RUN`；`PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 未变 |
| 搜索 `DS-REQ-1(7[8-9]\|8[0-9])` | 7 份正式文档 + 本轮 2 份报告均为 **0** |
| 冲突表述清除 | 无“`disable` 仅靠无状态条件 `UPDATE ... WHERE DATA_SOURCE_ID=?`”“当前为 `'0'` 仍执行 DML”“`40400`/`40250` 后自动刷新列表”“并发错误码留待实现期冻结”的**当前有效**表述（初版报告仅以 【已被 R1 取代】 保留历史） |
| 跨文档一致性 | `DESIGN`/`API`/`DATABASE`/`ACCEPTANCE` 与两份报告对读取、幂等、条件 `UPDATE`、`50002`、失败保留列表的表述一致 |

## 6. 明确未执行事项

- 未实现任何功能；未新增/修改接口实现、未新增错误码实现；
- 未修改任何业务代码、测试代码、依赖、锁定文件、配置、SQL 或数据库对象；
- 未访问数据库 / ZooKeeper / Kafka；未执行任何 DDL/DML；未启动/停止服务；
- 未运行 Maven / npm 测试或构建（`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`）；
- 未批准基线；未执行任何正式验收；本轮 42 条验收仍全部 `NOT_RUN`；
- 未把草案状态写成 `APPROVED`/`IMPLEMENTED`/`IMPLEMENTED_ACCEPTED`/已测试/已验收/生产可用。

## 7. 下一步入口

```text
next_step=CHATGPT_REMOTE_GIT_R1_REVIEW_THEN_PROJECT_OWNER_BASELINE_APPROVAL_DECISION
```

1. ChatGPT 必须**先从远程 Git 独立复审 R1**（`origin/develop` 上的 R1 提交），核对三类阻塞问题是否已按本报告修正。
2. 复审通过后，由**项目负责人**决定是否批准本轮调整基线；批准后**另行**生成实现任务提示词。
3. 本任务**不得**继续实现。

---

## 8. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-19 | 创建本报告：记录 Git 现场、三类阻塞问题的修订前/后结论、实际修改文件、编号/数量/状态/正文保护检查、静态检查结果、未执行事项与下一步入口 | DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R1（ChatGPT 远程复审 `CHANGES_REQUIRED` 定向修订；纯文档任务） |
| 2026-09-19 | **R2 勘误**：在报告标题后新增 R2 勘误声明，定向修正本报告 §5 中“跨文档一致性 / 无残留冲突”的不完整结论（R1 后 `DATABASE.md §9.2` 仍残留“异常状态统一写成 `FG_ACTIVE IS NULL`”与“`40250` 误含 `disable`”两处错误），指向 R2 报告；R1 历史内容保留未删 | DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2（ChatGPT 远程 R2 复审 `CHANGES_REQUIRED` 定向勘误；纯文档任务） |
