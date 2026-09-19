# DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001 执行报告

- 任务编号：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`
- 日期：2026-09-19
- 分支：`develop`
- 任务性质：`FEATURE_ADJUSTMENT_BASELINE_DRAFT`（**纯文档任务**）
- 实现授权：`NOT_GRANTED_IN_THIS_TASK`
- 授权范围：`docs/features/data-source-management/` 下 7 份文档 + 本报告；必要时仅**追加**页面级例外记录到 `docs/baseline/query-list-page-template/MIGRATION.md`
- 开始前提交（base）：`75d4a9f526e191d58a9d42a80fbe57276cd3b920`
- 结果提交 / Push / 远程 SHA / ahead-behind：见任务控制台结果块 `result_commit_id` / `push_status` / 远程 `origin/develop` 与 `ahead_behind`
- 测试与构建：`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`

> 本任务为“数据源管理”Feature 主列表页 `/config/data-source` 的**又一调整基线草案**：把项目负责人已确认的
> 12 项决策（列表展示**全部**状态、逐行**启用/停用**、结果区头部与序号列、行高与字体对齐、
> “新增数据源”按钮视觉）写入需求、验收、设计、API、UI、数据库六份 Feature 文档，供 ChatGPT 从远程 Git 复审、
> 项目负责人批准。**未**修改任何 `.vue`/`.ts`/`.java`/测试/依赖/锁定文件/配置/SQL；**未**访问数据库 / ZooKeeper / Kafka；
> **未**运行 Maven / npm 测试或构建；**未**启动/停止任何服务。任务停在
> “ChatGPT 远程复审 + 项目负责人批准调整基线”入口，**禁止**直接进入实现。

---

## 1. 任务开始前 Git 现场

```text
branch=develop
HEAD=75d4a9f526e191d58a9d42a80fbe57276cd3b920
origin/develop=75d4a9f526e191d58a9d42a80fbe57276cd3b920
rev-list --left-right --count HEAD...origin/develop = 0	0
git status --short =
    M .claude/settings.local.json
    ?? docs/prompts/
```

- 本地 `HEAD` 与 `origin/develop` 一致，`ahead/behind = 0 0`，与提示词给定的远程起点 SHA `75d4a9f5...` 一致，**无需**以新基准恢复现场。
- 任务开始前工作区已存在两处**与本任务无关**的改动：已修改的 `.claude/settings.local.json`（Agent 运行环境自动追加的 `Bash(...)` 权限条目，本任务命令的副产物，非本任务授权范围）与未跟踪目录 `docs/prompts/`（既有提示词目录）。二者均**未**修改、**未**暂存、**未**提交、**未**回滚、**未**删除，保持现状并如实记录。本任务也未执行 `git checkout`/restore/stash 等回滚命令（项目 Git 规则禁止）。

## 2. 强制阅读与只读核对范围

### 2.1 项目规则与项目基线

`CLAUDE.md`；`docs/baseline/` 六份项目级基线（`PROJECT.md`/`ENVIRONMENT.md`/`ARCHITECTURE.md`/`DEVELOPMENT_RULES.md`/`PROJECT_STATUS.md`/`DOMAIN_GLOSSARY.md`）；
查询列表页模板基线 `docs/baseline/query-list-page-template/{README,DESIGN,UI,SHARED_COMPONENT_DESIGN,MIGRATION}.md`（§3.4 强制）。

### 2.2 本 Feature 七份正式功能基线（全文阅读）

`docs/features/data-source-management/{README,REQUIREMENTS,ACCEPTANCE,DESIGN,API,UI,DATABASE}.md`。

### 2.3 参照页面与既有先例（只读）

- Client-config 的「全部状态展示 / 启用-停用 / 异常状态标签」相关章节：`docs/features/client-config/{REQUIREMENTS,DESIGN,API,UI}.md` 定向 `grep`（依据 `CCFG-REQ-002/032/033/078`、`CCFG-API-004/005/011/012/019`、`CCFG-DESIGN-005/006/019/020`、`CCFG-DB-005/020`）。
- 视觉参照页「源库快照状态」`/monitor/data-source-state`（`frontend/src/views/monitor/**`，只读）：行高、表头/正文基础字号与字重、数据源 ID（对应其“探针端”列）字体、角色标签（对应其“快照状态”标签）字号的**精确取值**；其「停用」标记（`.dss-inactive-mark`）与状态 `el-tag` 取值。
- 行为参照页「探针端配置」（只读）：全部状态列表、`statusText`（`启用`/`停用`/`异常（原始值=${fgActive}）`）、`canToggle(disable)= '1' || !=='0'`、`canToggle(enable)= ==='0'`、`opBusy` 行键守卫、停用需确认/启用不需确认的先例。
- 当前实现（只读，不改）：`frontend/src/views/data-source/DataSourcePage.vue`、`frontend/src/types/dataSource.ts`、`frontend/src/views/data-source/dataSource.spec.ts`、`backend/src/main/java/com/bsoft/cdcconfig/datasource/**`、`backend/.../common/exception/GlobalExceptionHandler.java`、`backend/.../datasource/vo/DataSourceListVO.java`、`backend/.../datasource/common/DataSourceErrorCode.java`、`backend/.../clientconfig/**`（启停先例）。

### 2.4 缺失文件记录（`NOT_FOUND`，未臆造）

```text
missing_files=无（本节所引用的全部正式基线与实现文件均存在）
```

### 2.5 关键当前事实（实现侧，只读核对结论）

| 项目 | 当前事实 |
|---|---|
| 列表查询过滤 | `LambdaQueryWrapper` 三个文本条件（`UPPER(col) LIKE UPPER('%'||{0}||'%') ESCAPE '\\'`）+ 规范化 `DATA_SOURCE_CATEGORY` 过滤，再 `wrapper.eq(DataSource::getFgActive, "1")`，`orderByAsc(DATA_SOURCE_ID)` |
| 列表响应字段 | `DataSourceListVO` 仅 8 字段，**无** `fgActive` → 本轮需新增（`DS-REQ-154`） |
| 详情/编辑/删除等 | `requireActiveRecord` 以 `FG_ACTIVE='1'` 过滤，非 `'1'` → `40400`（“不存在”） |
| 唯一性校验 | `assertIdUnavailable`/`assertNameUnavailable` **有意覆盖全部记录**（不论 `FG_ACTIVE`），不受本轮影响 |
| 错误码 | `DataSourceErrorCode` 现有 `40400/40900/40901/40001/40002/40003/40005/40006/40401/40902/40903/50000/50001`；**无**状态类码；`50002` 在 `API.md` §5.2 标注为“已废弃”且代码中不存在 |
| 重置语义 | `onReset()` 置空三条件并把 `effectiveQuery` 复位后**立即重新加载**（`DS-REQ-009`） |
| 行操作 | 已移除可见“编辑”按钮，仅“更多”下拉（业务入口 / 分隔线 / 红色危险 删除），操作列 `width=300 fixed right` |
| 新增按钮 | `QueryListResultPanel` 的 `toolbar` 槽承载“新增数据源”，当前为 Element Plus 默认蓝色 |
| 稳定滚动条槽 | 仅在路由 `DataSourceRunState`（`/monitor/data-source-state`）启用 |
| 新增/编辑 | 新增写 `FG_ACTIVE='1'`；编辑不触碰 `FG_ACTIVE` |

## 3. 关键结论与冲突处理（未静默选边）

### 3.1 唯一的实质歧义（已冻结，不留待实现猜测）

提示词 §4.8 既要求“启用只接受当前状态精确为 `0`”，又要求冻结“重复目标状态请求”。二者在 `enable` 遇到当前值为 `'1'` 时看似冲突。**冻结结论**（记入 `DESIGN.md` §13.5、`API.md` §11.3/§11.4）：

- `enable`：当前 `'0'` → 写 `'1'`（成功）；当前 `'1'` → **不写库、幂等成功**（重复目标状态，非报错）；当前 `NULL`/非 `0`/`1` → **拒绝**，新码 `40250`，不写库。
- `disable`：当前 `'1'` → 写 `'0'`（成功）；当前 `'0'` → 不写库、幂等成功；当前 `NULL`/非 `0`/`1` → 写 `'0'`（归一化，成功）。
- 目标记录不存在 → 复用 `40400`；`UPDATE` 影响行数 ≠ 1 → 恢复启用既有 `50002`（`STATUS_FAILED`）并**回滚**；其他保存失败沿用 `50000`。
- 并发：不加锁、不引入乐观版本、不新增并发控制，最终**收敛**；文档**不承诺**“至多一次成功”，也**不承诺**请求顺序与最终值一一对应。

`40250` 为本轮**唯一**新增业务码；`40004` 的既有废弃结论不变。

### 3.2 模板适用范围与“本轮为页面级微调”的关系

本轮改动（行级操作、状态展示、序号列、Feature 自有按钮视觉）落在查询列表页模板的 **Feature-owned** 范围内（控件/列宽、状态标签颜色与文本、启用/停用、状态展示、行级操作、序号列均为 Feature 决定），**未**改写模板通用规则，也**未**触及模板级 `page_migration_status`。因此**不**需要向 `MIGRATION.md` 追加页面级例外记录：

```text
migration_md_modified=NO
migration_md_reason=本轮为 Feature-owned 页面级微调（行级操作/状态展示/序号列/按钮视觉），未改写模板通用规则，无需页面级例外记录
```

### 3.3 “局部替代”而非“静默重写”

凡触及既有冻结结论之处，一律采用**新增指向性声明 + 变更记录行**的方式**局部替代**，逐条给出替代边界，避免文档出现两套互相冲突的“当前有效结论”。详见 §5。

## 4. 变更文件与变更范围

| 文件 | 操作 | 变更范围 |
|---|---|---|
| `docs/features/data-source-management/REQUIREMENTS.md` | 修改 | 新增 §23「列表展示全部状态、启用/停用及视觉微调调整需求（`DRAFT_PENDING_USER_REVIEW`）」含 10 个子节与 39 条需求 `DS-REQ-139~177`（含各节局部替代声明）；§21 变更记录追加一行 |
| `docs/features/data-source-management/ACCEPTANCE.md` | 修改 | §3 新增本轮草案分类行与三层分层说明；新增 §4.17 `DS-AC-141~182`（42 条，全部 `NOT_RUN`）；§4.2/§4.3 追加“另一轮调整草案局部替代提示”；§5 追踪矩阵追加 `DS-REQ-139~177` 各行并给 `DS-REQ-138` 行补 `DS-AC-149`；§7 变更记录追加一行 |
| `docs/features/data-source-management/DESIGN.md` | 修改 | §1.2 表后新增本轮草案局部替代提示；新增 §13（§13.0 九条局部替代声明、§13.1 列表查询与状态派生、§13.2 头部/序号列/列宽、§13.3 视觉对齐、§13.4 操作矩阵、§13.5 启停后端设计、§13.6 前端交互、§13.7 按钮视觉、§13.8 不变项、§13.9 追踪、§13.10 重置语义）与 §14 变更记录 |
| `docs/features/data-source-management/API.md` | 修改 | 接口计数 13 → 15 指向；§4.1 后局部替代提示（移除 `FG_ACTIVE='1'` 固定过滤、新增 `fgActive`）；§5.2 后局部替代提示（恢复 `50002`、新增 `40250`）；§6.1 后提示；新增 §11（§11.1 接口增量 E14/E15、§11.2 列表状态字段、§11.3 状态机与写入边界、§11.4 错误契约、§11.5 兼容性增量、§11.6 追踪、§11.7 无契约变化结论）与 §12 变更记录 |
| `docs/features/data-source-management/UI.md` | 修改 | §1 追踪行后新增 5 条局部替代声明；新增 §11（§11.0 替代边界表、§11.1 目标线框、§11.2 序号列与列宽、§11.3 行高与字体、§11.4 状态标识、§11.5 重置语义、§11.6 操作列与启停菜单、§11.7 按钮视觉、§11.8 不变项、§11.9 追踪）与 §12 变更记录 |
| `docs/features/data-source-management/DATABASE.md` | 修改 | §2 操作矩阵后局部替代提示（列表 WHERE 去掉 `FG_ACTIVE='1'`；详情/编辑/删除/业务属性/命名策略/编辑态连接测试接受 `'1'`/`'0'`、拒绝 `NULL`/非 `0`/`1`）；§4 后局部替代提示（含禁止以 `FG_ACTIVE <> '1'` 方式放宽的明确约束）；新增 §9（§9.1 零数据库变化声明、§9.2 操作矩阵、§9.3 启停写入边界含示例 SQL、§9.4 局部替代清单、§9.5 追踪）与 §10 变更记录 |
| `docs/features/data-source-management/README.md` | 修改 | 头部新增草案指向块；§2.3 草案状态块（六个状态键 + 4 条说明）；§3 导航新增本轮章节映射；§4 标题与 3 条局部替代声明；§5 变更记录追加一行 |
| `docs/features/data-source-management/reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001.md` | **新增** | 本报告 |

**未修改**：任何 `.vue`/`.ts`/`.java`、任何测试代码、依赖、锁定文件、配置、SQL、数据库对象、菜单、路由；`docs/baseline/` 六份项目级基线；`docs/baseline/query-list-page-template/**`（含 `MIGRATION.md`）；`CLAUDE.md`；`.claude/settings.json`；`.claude/skills/**`；`docs/features/README.md`；任何公共组件实现；任何历史报告；`.claude/settings.local.json` 与 `docs/prompts/`（任务开始前既有，保持原样）。

## 5. 局部替代声明清单（逐项边界）

| # | 被替代的既有结论 | 替代需求 | 替代边界（只替代这些；其余继续有效） |
|---|---|---|---|
| 1 | `DS-REQ-009`/`DS-REQ-127`“重置后立即恢复全部有效记录” | `DS-REQ-139`/`DS-REQ-140` | 只替代“重置即发起查询”；控件清空（三文本条件清空、角色恢复“全部”）继续有效 |
| 2 | `DS-REQ-123`“结果区头部左侧为‘数据源列表’与当前结果数量” | `DS-REQ-141` | 只替代头部文字为 `共 n 条`；`QueryListResultPanel` 固定结构、`loadError` 固定错误槽、不增加辅助说明行继续有效 |
| 3 | `DS-REQ-011`/`DS-REQ-129`“第一列为数据源 ID / 保留当前列清单” | `DS-REQ-142`/`DS-REQ-143` | 只替代“新增序号列作为第一列”；既有各列列身份与默认 `DATA_SOURCE_ID ASC` 继续有效 |
| 4 | `DS-REQ-002`“其他值（含 `'0'`）全部视为不存在”中的**列表查询范围** | `DS-REQ-150` | 只替代“列表查询与展示只触及 `FG_ACTIVE='1'`” |
| 5 | `DS-REQ-012`“列表不得展示 `FG_ACTIVE`”的排他性 | `DS-REQ-152`~`DS-REQ-154` | 只替代为“API 返回原始 `fgActive`、在数据源 ID 列内以标识表达状态”；“不新增独立状态列”继续有效 |
| 6 | `DS-REQ-002`/`DS-REQ-091`“主记录非 `'1'` 即视为不存在”（详情/编辑/删除/业务属性/命名策略/编辑态连接测试） | `DS-REQ-155`~`DS-REQ-159` | 只替代为“`FG_ACTIVE='0'` 时上述读/写维护不再返回 `40400`”；目标库候选、其他 Feature 候选、角色校验、密码保护、命名策略唯一性、删除业务语义继续有效 |
| 7 | `DS-REQ-132`“行‘更多’菜单只有业务入口与红色删除” | `DS-REQ-163`~`DS-REQ-167` | 只替代为“在业务入口与红色删除之间插入启停项，且异常行菜单收敛为只有归一化停用”；业务入口身份、删除为最后且红色危险、菜单不含“编辑”继续有效 |
| 8 | `DS-REQ-003`“页面不提供启用/停用操作”与 `DS-REQ-091`“目标设计不提供启用/停用能力” | `DS-REQ-168`~`DS-REQ-173` | 只替代为“提供逐行启停，由两个独立接口只更新主表 `FG_ACTIVE`” |
| 9 | `DS-REQ-118`“`toolbar` 槽承载‘新增数据源’按钮”的默认蓝色视觉 | `DS-REQ-174` | 只替代视觉样式；槽位归属、位置、业务流程与点击行为继续有效 |

对应 `API.md` 侧另有 4 条局部替代（列表过滤、`fgActive`、`50002` 恢复、`40250` 新增）；`DATABASE.md` 侧 4 条局部替代（列表 WHERE、非启用记录维护语义、候选范围、无 DDL）；`UI.md` 侧 5 条局部替代；`ACCEPTANCE.md` §4.2/§4.3 补充 `DS-AC-005`/`006`/`010`/`018`/`123` 的**当前有效结论边界**，其历史状态与执行证据**逐字保留**。

## 6. 启用/停用：接口、状态机、错误与事务结论摘要

**接口（本轮新增 2 个，接口总数 13 → 15）**

| 方法 | 路径 | 作用 |
|---|---|---|
| `PUT` | `/api/data-sources/{dataSourceId}/enable` | 只把目标主表记录 `FG_ACTIVE` 写为 `'1'` |
| `PUT` | `/api/data-sources/{dataSourceId}/disable` | 只把目标主表记录 `FG_ACTIVE` 写为 `'0'` |

**状态机（冻结）**

```text
enable  : '0' -> 写 '1' 成功 | '1' -> 不写库 幂等成功 | NULL/非0/1 -> 拒绝 40250 不写库
disable : '1' -> 写 '0' 成功 | '0' -> 不写库 幂等成功 | NULL/非0/1 -> 写 '0' 归一化成功
```

**事务与写入边界**

- 单条主表记录的**单条 `UPDATE`**、短事务；`enable` 写入前**先读取**当前 `FG_ACTIVE` 以实施状态机；`disable` 可由 `UPDATE ... SET FG_ACTIVE='0' WHERE DATA_SOURCE_ID=?` 自身完成归一化。
- 只更新 `CDC_DATA_SOURCE.FG_ACTIVE` 一列；**不**修改其他字段；**不**级联修改/删除 `CDC_DATA_SOURCE_EXTEND`、客户端、订阅及任何其他表。
- **不访问**源库；**不操作**进程、ZooKeeper 或 Kafka；成功提示**不得**声称进程已启动/停止或配置已实时生效。
- 并发：不加锁、不引入乐观版本、不新增并发控制；最终**收敛**；不承诺“至多一次成功”。

**错误契约（冻结）**

| 场景 | 结果 |
|---|---|
| 目标主表记录不存在 | `40400`（复用既有 `notFound`），事务内无任何写入 |
| 非法状态（仅 `enable` 遇 `NULL`/非 `0`/`1`） | `40250`（**本轮唯一新增业务码**），不写库 |
| 重复目标状态（`enable` 遇 `'1'`、`disable` 遇 `'0'`） | 成功，不写库、不报错 |
| `UPDATE` 影响行数 ≠ 1 | `50002`（`STATUS_FAILED`，恢复启用既有码），事务**回滚** |
| 其他保存类失败 | `50000`（`SAVE_FAILED`，复用） |

**前端消息处理（冻结）**：`40400` → 提示目标不存在并按已应用条件刷新；`40250` → 提示状态异常、只能先停用归一化并刷新；`50002`/`50000` → 提示失败请重试，**保留**当前列表与已应用条件、恢复 busy；成功提示只陈述“状态已更新”。**成功刷新按当前已应用条件**（不读未点击“查询”的草稿条件）；因列表展示全部状态，停用成功后该行**仍保留**并出现“停用”标识，启用成功后标识消失。

## 7. 停用/异常记录的允许与禁止操作矩阵

| 操作 | `FG_ACTIVE='1'`（启用） | `FG_ACTIVE='0'`（停用） | `NULL`/非 `0`/`1`（异常） |
|---|---|---|---|
| 列表可见 | 可见，无标识 | 可见，行内“停用”标识 | 可见，行内 `异常（原始值=…）`（`NULL` 显式显示） |
| 双击编辑 | 允许 | **允许** | **禁止** |
| 保存后状态 | 保持 `'1'` | **保持 `'0'`**（不自动启用） | 不适用 |
| 物理删除 | 允许 | **允许** | **禁止**（须先停用归零） |
| 业务属性（仅目标库） | 允许 | **允许** | **禁止** |
| 源库命名策略（仅源库） | 允许 | **允许** | **禁止** |
| 编辑态连接测试 | 允许 | **允许** | 不适用 |
| 菜单“启用” | 不显示 | **显示** | **禁止**显示 |
| 菜单“停用” | **显示** | 不显示 | **显示**（唯一写入口，用于归一化） |
| 可作为其他 Feature 候选 | 是 | **否** | **否** |

- 前端按上表**隐藏或禁用**不允许的入口；**后端仍必须独立校验**，不得依赖前端。
- 停用记录的编辑**不得提供**任何修改 `FG_ACTIVE` 的入口；状态只能通过两个独立接口改变。
- 新增记录仍写 `FG_ACTIVE='1'`；编辑**不得修改** `FG_ACTIVE`；删除仍为**物理删除**，不改为逻辑删除。

## 8. 追踪完整性检查

```text
requirements_before=DS-REQ-001..138 (138 条, 逐字冻结, 未重排/删除/悄然改写)
requirements_added=DS-REQ-139..177 (39 条, DRAFT_PENDING_USER_REVIEW, 全部 NOT_STARTED)
requirements_after=DS-REQ-001..177 (177 条)
requirement_count_delta=+39

acceptance_before=DS-AC-001..140 (140 条; 001..115 = PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0 逐字冻结; 116..140 全部 NOT_RUN 未受影响)
acceptance_added=DS-AC-141..182 (42 条, 全部 NOT_RUN)
acceptance_after=DS-AC-001..182 (182 条)
acceptance_count_delta=+42

traceability_requirement_rows=DS-REQ-139..177 全部有覆盖 (REQUIREMENTS §23 ↔ ACCEPTANCE §4.17/§5 ↔ DESIGN §13.9 ↔ API §11.6 ↔ UI §11.9 ↔ DATABASE §9.5 ↔ README §2.3/§3)
traceability_cases_referenced=DS-AC-141..182 全部被 §5 追踪矩阵引用
traceability_status=COMPLETE
```

- 编号连续性：`DS-REQ` 由既有最大 138 续至 177（连续无缺号）；`DS-AC` 由既有最大 140 续至 182（连续无缺号）。无重编号、无复用、无删除。
- 覆盖广度校验：§7 列出的 17 个最低覆盖领域逐一对应到 `DS-AC-141~182`，无遗漏、无凑数拆分、无同义合并。
- 双向关系：每条新增需求至少被一条设计/API/UI/数据库落点与一条验收用例覆盖；每条新增验收用例均有明确关联需求。

## 9. 既有正式验收历史与新老两轮调整验收状态

```text
feature_existing_acceptance_statistics=PASS_113_FAIL_0_BLOCKED_2_NOT_RUN_0   # 逐字保留
blocked_cases=DS-AC-104,DS-AC-108                                            # 两个既有 BLOCKED 未被清零
formal_acceptance_status=BLOCKED
previous_adjustment_acceptance_status=DS-AC-116_TO_140_ALL_NOT_RUN           # 未混入本轮统计
new_adjustment_acceptance_status=ALL_NOT_RUN
adjustment_document_status=DRAFT_PENDING_USER_REVIEW
adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW
implementation_status=NOT_STARTED
implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK
formal_acceptance_execution_status=NOT_RUN
```

- 本轮新增 42 条验收**全部写为 `NOT_RUN`**；上一轮 `DS-AC-116~140` 仍全部 `NOT_RUN` 且未混入本轮；既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与两个 `BLOCKED` 逐字保留。
- 未把草案写成 `APPROVED`/`IMPLEMENTED`/`IMPLEMENTED_ACCEPTED`/已测试/已验收/生产可用。

## 10. 明确未执行事项

- 未修改任何业务代码、测试代码、依赖、锁定文件、配置、SQL 或数据库对象；
- 未访问数据库 / ZooKeeper / Kafka；未执行任何 DDL/DML；
- 未运行 Maven / npm 测试或构建（`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`）；
- 未启动、停止或重启任何服务；
- 未创建分页；未接入刷新工具栏/自动刷新；未启用稳定滚动条槽；未迁移公共单实例 Tooltip；
- 未修改任何公共组件实现；未迁移其他页面；未修改模板基线；
- 未实现启用/停用、未新增接口实现、未新增错误码实现；
- 未生成本轮实现提交或正式验收结果；未把草案状态写成已批准/已实现/已测试/已验收。

## 11. 下一步入口

```text
next_step=CHATGPT_REMOTE_GIT_REVIEW_THEN_PROJECT_OWNER_BASELINE_APPROVAL_DECISION
```

1. ChatGPT 从**远程 Git**（`origin/develop`）独立复审本草案，重点核对：12 项决策的落地一致性、九条局部替代边界、启停状态机与错误/事务结论的完整性、停用/异常操作矩阵的前后端双约束、既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与两轮调整验收统计是否逐字保留。
2. 项目负责人决定是否**批准本轮调整基线**；批准后**另行**生成本轮实现任务提示词。
3. 本任务**不得**继续实现。

---

## 12. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-19 | 创建本报告：记录读取范围、当前事实、歧义冻结、变更文件、局部替代清单、启停接口/状态机/错误/事务摘要、停用/异常操作矩阵、追踪完整性、既有与两轮调整验收统计、未执行事项与下一步入口 | DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001（纯文档任务） |
