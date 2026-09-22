# 探针端管理页面级调整基线草案 · R1 定向纠错与决定回填执行报告

> 任务编号：`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1`
> 任务性质：已有 Feature 页面级调整**基线草案**的 R1 定向纠错与项目负责人决定回填（**纯文档**，未实现、未测试、未构建、未目测、未启动服务、未执行正式验收）
> 目标分支：`develop`
> 起始提交：`fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1`
> 本任务授权：修改白名单文档、创建本报告、Commit、普通 Push
> 本任务不授权：任何业务代码/测试修改、数据库连接与写入、DDL、ZooKeeper/Kafka 访问、服务启停、浏览器目测、正式验收执行、最终接受或状态收口

本报告按规范**不**在正文中自引用“包含本报告的最终提交 ID”；最终提交 ID 只在 Push 后的控制台结果块中输出。

---

## 1. ChatGPT 对 R0 的复审结论

```text
r0_review_verdict=CHANGES_REQUIRED
```

ChatGPT 从远程 Git 对 R0 草案提交 `fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1` 的独立复审结论为
`CHANGES_REQUIRED`。本任务按其五类问题与项目负责人两项决定逐项修订，
**不**建立并行规则集，**不**新起编号体系，**不**删除历史链。

---

## 2. 五类复审问题的逐项修正证据

### 2.1 页面级授权口径被误写为“未获授权”

- **问题**：R0 已在 `docs/baseline/query-list-page-template/MIGRATION.md` 记录了
  `/config/client` 的页面级选择性接入授权（该文档由 R0 落地，内容正确），
  但部分 Feature 文档却写成“不代表任何模板已获迁移授权 / 未获批任何页面迁移授权”。
- **修正**：全文检索并修正矛盾表述；在
  `README.md` §1.1、`REQUIREMENTS.md` §1.3、`ACCEPTANCE.md` §1.3、
  `DESIGN.md` 元数据、`UI.md` 元数据与 §15 前置说明中统一补入
  **页面级授权事实**：`/config/client` 的页面级选择性接入授权**已获得**
  （查询列表页模板侧采用页面壳/查询面板/操作区/结果面板四组件、**不**接入刷新工具栏；
  列表表格视觉模板侧**仅**覆盖该页**主列表**，不含新增/编辑弹窗与弹窗内控件）。
- **分层声明**：页面级授权事实 **≠** 本轮调整基线已批准 **≠** 本轮实现已授权或已完成；
  两套模板的**模板级全局迁移状态保持不变**；**其他页面未被授权**。
- **验证**：`grep` 全量检索 `未获批任何页面迁移授权`、`不代表任何模板已获迁移授权` → **0 处**。

### 2.2 既有 Feature 实现状态被与本轮调整实现状态混为一谈

- **问题**：既有 Feature 实现事实上已是 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`
  （页面与后端 CRUD 已实现、尚待项目负责人验收），R0 部分文本把它与本轮页面级调整实现
  一并写成 `NOT_STARTED`。
- **修正**：五份文档统一为四层状态口径（见 §3）。
  仅**本轮页面级调整实现**为 `NOT_STARTED`；既有 Feature 实现状态保持
  `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，**不得**写成 `NOT_STARTED`。
  `README.md` §4 中一条无日期的旧 `NOT_STARTED` 汇总条目已明确标注为
  **历史记录、已被后续实现取代、不代表当前状态**。

### 2.3 `ACCEPTANCE.md` 的本轮修订用例清单漏列已实际修改项

- **问题**：R0 清单为 12 条（`CCFG-AC-002/009/016/017/018/019/021/022/023/025/026/032`），
  其中 `CCFG-AC-016`、`CCFG-AC-023` 实际已被修改但清单曾漏列；
  R1 又追加/再次修订了若干条。
- **修正**：`ACCEPTANCE.md` 新增 **§1.4 本轮修订的既有用例（R1 修正后的完整清单）**，
  按 R0 / R1 / 合计三行分阶段列出，合计（去重后）17 条：
  `CCFG-AC-002/009/016/017/018/019/020/021/022/023/025/026/032/082/087/088/089`。
  该清单与 §4 表格中带 `**【本轮定向修订 · 待批准】**` 标记的各行逐一对应。

### 2.4 历史异常 `FG_ACTIVE` 的展示承载与文案被留给实现阶段

- **问题**：R0 的 `CCFG-UI-035` 写“具体承载位置与呈现形式由实现阶段在……范围内确定”。
- **修正**：该表述**已删除**，并冻结为：**紧跟探针 ID 的红色徽标，固定文案 `异常：{原始值}`**；
  位置/间距/超长/Tooltip/不挤压不覆盖“操作”列/可读对比度/不得仅靠颜色 均已明确
  （见 `CCFG-UI-031`、`CCFG-UI-035`、`CCFG-REQ-101`、`CCFG-REQ-102`、`CCFG-AC-088`）。
- **验证**：`grep` 全量检索 `由实现阶段在`、`具体承载位置与呈现形式由实现阶段` → **0 处**。

### 2.5 行选择去留仍挂在待确认项

- **问题**：R0 的 `PENDING_USER_CONFIRMATION=1` 把“取消删除所选后行单选/高亮/‘已选择’是否保留”
  留作待确认（“暂按保留”）。
- **修正**：项目负责人本轮已明确决定并冻结（见 §4），该事项关闭。
  全部目标文档与本报系统一为 `PENDING_USER_CONFIRMATION=0`；
  `PENDING_USER_CONFIRMATION=1`、“暂按保留”表述已删除或明确标注为已被取代的历史文本。
- **验证**：全量检索 `PENDING_USER_CONFIRMATION=1` → **0 处**；`暂按保留` → **0 处**。

---

## 3. 四层状态口径（五份文档统一）

```text
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment_implementation_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
```

- 既有 Feature 实现**不**写成 `NOT_STARTED`；
- 仅**本轮页面级调整实现**为 `NOT_STARTED`；
- 89 条验收用例**全部** `NOT_RUN`；
- 旧的有日期 `NOT_STARTED` 记录仅在明确标注为历史、且不出现在当前状态汇总中时保留。

---

## 4. 项目负责人两项决定及其影响条目

### 4.1 决定一：取消“删除所选”后，整体取消行选中能力

- **口径**：不存在行单选机制、选择状态、选择事件、选择键、已选行集合、
  “当前选中行”概念与选中行视觉（无选中底色、高亮、左侧强调线、无“已选择：{探针ID}”或等价文本）；
  删除/启用/停用一律由该行“更多”下拉发起，**不**依赖、也**不**改变任何行选中态；
  查询/重置/重新加载/删除成功后**无**“清空选中”动作，取消删除/启停确认后**无**“保留选中”语义。
  行**双击编辑**与**探针 ID 键盘聚焦后 Enter/空格编辑**保留，与取消选择不冲突。
- **受影响条目**：
  - 需求：`CCFG-REQ-020`、`CCFG-REQ-022`、`CCFG-REQ-028`、`CCFG-REQ-094`、`CCFG-REQ-103`、§5.1 行入口口径
  - 验收：`CCFG-AC-016`、`CCFG-AC-017`、`CCFG-AC-020`、`CCFG-AC-021`、`CCFG-AC-082`
  - 设计：`CCFG-DESIGN-040`、`CCFG-DESIGN-041`、`CCFG-DESIGN-043`
  - 界面：`CCFG-UI-004`、`CCFG-UI-005`、`CCFG-UI-029`、`CCFG-UI-032`、`CCFG-UI-035`

### 4.2 决定二：历史异常 `FG_ACTIVE` 显示红色 `异常：{原始值}`

- **口径（三态冻结）**：
  - `FG_ACTIVE='1'` → 探针 ID 后**无**状态标记；下拉 `停用`（另有 `删除`）。
  - `FG_ACTIVE='0'` → 探针 ID 后“停用”标记，**与数据源管理主列表“数据源 ID”后的“停用”标记完全一致**；下拉 `启用`（另有 `删除`）。
  - 其他历史异常值 → 紧跟探针 ID 的**红色徽标，固定文案 `异常：{原始值}`**；下拉**仅** `停用`（另有 `删除`），**不**提供 `启用`。
- **原始值可见性依据既有数据契约**：`CDC_CLIENT_MULTIPLE.FG_ACTIVE` 为
  `VARCHAR2(1) NOT NULL`（仅 `NOT NULL` 约束，无取值域 `CHECK`）；
  Oracle 中 `''` 与 `NULL` 等价 ⇒ null / 空串为契约**不可达**。
  理论上不可见的**单空白字符**按半角引号定界展示（如 `异常：" "`），
  该规则由既有契约确定性推导，**未**自行发明后端语义，**未**触发 `BLOCKED_DATA_CONTRACT_AMBIGUITY`。
- **受影响条目**：
  - 需求：`CCFG-REQ-101`、`CCFG-REQ-102`、`CCFG-REQ-103`
  - 验收：`CCFG-AC-087`、`CCFG-AC-088`
  - 设计：`CCFG-DESIGN-045`
  - 界面：`CCFG-UI-006`（承载方式被取代）、`CCFG-UI-031`、`CCFG-UI-035`

---

## 5. R1 前后规则差异（要点）

| 维度 | R1 之前（R0 草案） | R1 之后（本报告提交） |
|---|---|---|
| 行选择 | 行单选 + 选中高亮保留，去留 `PENDING_USER_CONFIRMATION=1`、暂按保留 | **整体取消**：无行单选、无选择状态/事件/选择键/已选集合/当前选中行概念、无选中视觉、无“已选择：{探针ID}”文本；`PENDING_USER_CONFIRMATION=0` |
| 删除/启停入口 | 工具栏“删除所选” + 行内状态文字操作 | 结果区头部“新增探针”（右侧） + 每行“更多”下拉；**无**批量删除入口；“更多”**不**误触发行双击编辑 |
| 异常 `FG_ACTIVE` | 承载与文案“由实现阶段确定” | 冻结为**紧跟探针 ID 的红色 `异常：{原始值}`**，含位置/间距/溢出/对比度规则 |
| 页面级授权 | 与模板级状态混写，局部误写为“未获授权” | 明确 `/config/client` 页面级授权**已获得**（查询列表页模板四组件、不接入刷新工具栏；列表表格视觉模板仅主列表），模板级全局状态**未变**、其他页面**未授权** |
| 实现状态 | 既有实现与本轮调整实现混为 `NOT_STARTED` | 四层分层：既有 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`；本轮调整基线 `DRAFT_PENDING_USER_REVIEW`；本轮调整实现 `NOT_STARTED`；正式验收 `NOT_RUN` |
| 修订用例清单 | 12 条，漏列 `CCFG-AC-016`/`CCFG-AC-023` | §1.4 分阶段完整清单，合计 17 条（不新增/删除/重排编号） |
| 保留能力 | — | 行**双击编辑**、探针 ID **键盘编辑**、描述单行省略/占位、数据源标签/Tooltip/`+N` 等既有交互**均保留** |

---

## 6. 授权分层最终口径

```text
query_list_page_authorization_status=GRANTED_FOR_CONFIG_CLIENT_ONLY
list_table_authorization_status=GRANTED_FOR_CONFIG_CLIENT_MAIN_LIST_ONLY
page_level_authorization_means_baseline_approved=NO
page_level_authorization_means_implementation_authorized=NO
other_pages_authorized=NO
query_list_page_template_global_status=UNCHANGED
list_table_visual_template_global_status=UNCHANGED
```

- 页面级授权（`/config/client`）为**事实**，由项目负责人在 R0 阶段授予并记录于
  `docs/baseline/query-list-page-template/MIGRATION.md`；本 R1 **不**修改该文件、
  **不**改写其模板级全局状态。
- 模板级全局状态保持：
  `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、
  `pilot_page_selection_status=NOT_DECIDED`。
- 数据源管理参考页最终接受事实保持：
  `IMPLEMENTED_ACCEPTED`、`final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`，**均不变**。

---

## 7. 列表表格视觉模板 MIGRATION 的 R1 修正记录

在 `docs/baseline/list-table-visual-template/MIGRATION.md` **追加**（不改写任何历史行）：

- R0 记录仅把 §4“探针端管理主表”一行的**“批量工具栏”**记为被业务决定部分替代；
  R1 明确 §4 同行的**“多选与选中态（`#ecf5ff` + `inset 3px 0 0`）”**
  （即行单选、选中行浅蓝底、左侧 3px 强调线、`@row-click` 改变选中）
  **同样被本页业务决定替代**，后续以本 Feature 获批后的调整基线为准。
- 修正后目标页主列表**不再有**删除所选/批量工具栏/行单选/选中视觉/`@row-click` 改变选中/
  “已选择”文本；**仍保留**行双击编辑（`@row-dblclick`）、探针 ID 键盘编辑、
  固定行高、数据源标签与 Tooltip、`+N` 点击清单等既有交互。
- 本修正**只**适用于 `/config/client` 主列表，**不**修改模板通用规则、
  **不**改变 §4 对其余页面的效力、**不**改变模板级全局状态、**不**新增授权。
- **未**修改 `docs/baseline/query-list-page-template/MIGRATION.md`。

---

## 8. 文件清单（白名单与实际变更）

**白名单（本任务允许修改/新增）**

```text
docs/features/client-config/README.md
docs/features/client-config/REQUIREMENTS.md
docs/features/client-config/ACCEPTANCE.md
docs/features/client-config/DESIGN.md
docs/features/client-config/UI.md
docs/baseline/list-table-visual-template/MIGRATION.md
docs/features/client-config/reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1.md  (新建)
```

**实际变更（`git diff --numstat`，新增报告另行提交）**

```text
50	0	docs/baseline/list-table-visual-template/MIGRATION.md
40	27	docs/features/client-config/ACCEPTANCE.md
19	16	docs/features/client-config/DESIGN.md
24	21	docs/features/client-config/README.md
23	26	docs/features/client-config/REQUIREMENTS.md
43	25	docs/features/client-config/UI.md
```

**未修改（禁止项均已遵守）**：`frontend/**`、`backend/**`、
`docs/features/client-config/API.md`、`docs/features/client-config/DATABASE.md`、
`docs/baseline/query-list-page-template/MIGRATION.md`、
R0 报告 `reports/...-BASELINE-001.md`（原样保留）、
`docs/baseline/` 六份项目级基线、`CLAUDE.md`、`.claude/**`、`agent-env.sh`、`docs/prompts/**`。

---

## 9. 校验结果

### 9.1 编号连续性与唯一性

```text
requirement_count=103          # CCFG-REQ-001~103，连续、唯一
acceptance_count=89            # CCFG-AC-001~089，连续、唯一
design_count=46                # CCFG-DESIGN-001~046，连续、唯一
ui_count=35                    # CCFG-UI-001~035，连续、唯一
```

R1 **未**新增、删除或重排任何编号。

### 9.2 覆盖与执行状态

```text
requirements_acceptance_coverage=103/103
acceptance_not_run_count=89    # 逐行状态列均为 NOT_RUN
```

### 9.3 状态与待确认项

```text
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment_implementation_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
pending_user_confirmation_count=0
```

### 9.4 残留表述检索

| 检索项 | 结果 |
|---|---|
| `PENDING_USER_CONFIRMATION=1` | 0 处 |
| `暂按保留` | 0 处 |
| `未获批任何页面迁移授权` | 0 处 |
| `不代表任何模板已获迁移授权` | 0 处 |
| `由实现阶段在` / `具体承载位置与呈现形式由实现阶段` | 0 处 |
| `行选中仍保留` | 0 处 |
| `已选择：{探针ID}` / `选中行浅蓝` / `左侧 3px 强调线` | 仅出现在**明确取消或历史取代**语境，无残留有效声明 |

### 9.5 修订用例清单与 diff 一致性

`ACCEPTANCE.md` §1.4 的 17 条合计清单与 §4 中带
`**【本轮定向修订 · 待批准】**` 标记的各行逐一对应，含 R0 曾漏列的
`CCFG-AC-016`、`CCFG-AC-023`。

### 9.6 Git 现场与工作区

```text
branch=develop
base_commit_id=fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1
origin_develop=fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1
git_ls_remote_origin_refs_heads_develop=fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1
ahead_behind=0 0
```

任务开始时 `git status --short`：

```text
 M .claude/settings.local.json
?? docs/prompts/
```

| 项 | 归属 | 处理 |
|---|---|---|
| `.claude/settings.local.json`（已修改） | 任务开始前已存在，Claude Code 会话瞬时变化，非本任务范围 | 不修改、不覆盖、不暂存、不提交 |
| `docs/prompts/`（未跟踪，40 个文件） | 用户输入 | 不修改、不暂存、不提交、不删除 |

`git diff --check`：**无输出**（无空白/冲突标记问题）。

### 9.7 `docs/prompts/**` 完整性

任务前后对 `docs/prompts` 下全部 40 个文件做 `sha256sum` 比对：

```text
PROMPTS_INTEGRITY_IDENTICAL_40_FILES
```

### 9.8 未执行事项（明确记录，防止误推）

- 单元测试 / 集成测试：**未运行**（纯文档任务，未授权）；
- 后端 `mvn clean test` / `mvn clean package`：**未运行**（未授权，非本任务范围）；
- 前端 `npm run build` / `type-check` / `lint` / `test`：**未运行**（未授权）；
- 浏览器访问与真实页面目测、截图验收：**未执行**（未授权）；
- 服务启动 / 停止：**未执行**（未授权）；
- 数据库连接、查询、DML、DDL：`NONE`；
- ZooKeeper 访问与写入：`NONE`；
- Kafka 访问：`NONE`；
- 正式验收执行、最终接受、状态收口：**均未进行**。

本任务仅运行只读的 `git status/diff/log/ls-remote`、`grep`/`python3` 统计与
`sha256sum` 校验；**未**提交任何脚本。

---

## 10. 结论边界

本报告所述全部结论**仅**为文档层面的 R1 定向纠错结果：

- **不**表示本轮调整基线已批准（仍为 `DRAFT_PENDING_USER_REVIEW`）；
- **不**表示目标页面已实现（`adjustment_implementation_status=NOT_STARTED`）；
- **不**表示验收已通过（`formal_acceptance_execution_status=NOT_RUN`，89 条全 `NOT_RUN`）；
- **不**表示任务已推进到实现阶段。

---

## 11. 下一入口

```text
next_entry=CHATGPT_REMOTE_BASELINE_R1_REVIEW
```

R1 修正后的草案须先由 **ChatGPT 从远程 Git 对本 R1 结果提交进行独立复审**，
再由项目负责人批准；**不是**直接进入实现。在复审与批准完成前，
不得实施页面、不得执行正式验收、不得迁移任何页面。
