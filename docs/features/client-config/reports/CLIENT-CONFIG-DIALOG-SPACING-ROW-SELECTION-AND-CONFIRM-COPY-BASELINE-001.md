# 探针端管理弹窗间距、启停确认文案与列表单行选中调整 · 基线草案建立执行报告

> 任务代码：`CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001`
> 任务类型：纯文档（仅为 `/config/client` 的新增／编辑探针弹窗与主列表建立页面级调整**草案**）
> 分支：`develop`
> 起始提交：`0c30b150343853c29ddf0329496dee3272d14cc0`
> 上一时点事实：第四轮实现 R1 提交 `0c30b150343853c29ddf0329496dee3272d14cc0` 已经 ChatGPT 从远程 Git 代码复审通过，但**尚未**获得项目负责人最终页面接受或正式验收
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_REVIEW`
> 本任务不修改代码、不执行正式验收、不宣称本轮已实现或获批准，不作出项目负责人目测通过或最终接受结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=0c30b150343853c29ddf0329496dee3272d14cc0
actual_base_commit=0c30b150343853c29ddf0329496dee3272d14cc0
origin_develop=0c30b150343853c29ddf0329496dee3272d14cc0
remote_refs_heads_develop=0c30b150343853c29ddf0329496dee3272d14cc0
ahead_behind(origin/develop...HEAD)=0/0
baseline_approval_status=APPROVED(第一轮~第四轮)
adjustment4_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
adjustment5_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment5_approval_status=NOT_APPROVED
adjustment5_implementation_status=NOT_STARTED
adjustment5_formal_acceptance_execution_status=NOT_RUN
page_level_authorization_status=GRANTED_FOR_CONFIG_CLIENT_DIALOG_AND_MAIN_LIST_ONLY
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`0c30b15`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发任务提示词中的停线条件。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`。
- 开工时从 Git 核实的四类定义计数为 需求 `CCFG-REQ-136`／验收 `CCFG-AC-135`／设计 `CCFG-DESIGN-071`／界面 `CCFG-UI-059`，与任务提示词一致；本轮新增编号据此从 `137`／`136`／`072`／`060` 连续接续。
- 被**明确取消**的 `CLIENT-CONFIG-DIALOG-FIELD-SPACING-BASELINE-001` 提示词经核对**从未执行**（仓库中不存在其特征定义与报告），本任务**不**重复创建相同定义。

## 2. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/REQUIREMENTS.md` | 修改 | 新增 §7.14 与 `CCFG-REQ-137~147`（11 条）、**9** 条既有定义行定向修订标注 + §5.1 两条摘要同步、§8 编号核验与合计、§10 变更记录、§1 metadata |
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | 新增 §1.9 分层状态块与 `CCFG-AC-136~146`（11 条）、**8** 条既有定义行定向修订标注、§2／§3 编号与分类计数、§5 覆盖矩阵、§6 变更记录 |
| `docs/features/client-config/DESIGN.md` | 修改 | 新增 §17 与 `CCFG-DESIGN-072~082`（11 条）、**6** 条既有定义行定向修订标注、§12.1／§12.2 映射行、§1 metadata、`## 17 变更记录`顺延为`## 18` |
| `docs/features/client-config/UI.md` | 修改 | 新增 §19 与 `CCFG-UI-060~070`（11 条）、**4** 条既有定义行定向修订标注、§14 关联矩阵说明、§1 metadata、`## 19 变更记录`顺延为`## 20` |
| `docs/features/client-config/README.md` | 修改 | 新增 §1.11 第五轮草案分层状态块与三项决定映射表、§2 导航同步（README 自身与四份文档状态单元、新增报告行）、§4 当前状态条目、§5 将第四轮 R1 入口降为历史并新增当前入口 |
| `docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001.md` | 新增 | 本报告 |

**未修改**：`docs/features/client-config/API.md`、`DATABASE.md`、`docs/baseline/**`（含两套查询／列表视觉模板的 README／SHARED_COMPONENT_DESIGN／MIGRATION）、`docs/features/README.md`、任何历史报告、`docs/prompts/**`、前后端代码与测试、`CLAUDE.md`、`agent-env.sh`、参考页 `frontend/src/views/data-source/DataSourcePage.vue`、数据库对象与构建依赖。

## 3. 新旧定义编号与逐项覆盖

编号策略为**在既有最大编号之后连续追加**（不复用、不重排历史编号），并逐项建立 需求 ↔ 设计 ↔ 界面 ↔ 验收 映射：

| 需求（`REQUIREMENTS.md` §7.14） | 设计（`DESIGN.md` §17） | 界面（`UI.md` §19） | 验收（`ACCEPTANCE.md` §1.9） |
|---|---|---|---|
| `CCFG-REQ-137` 弹窗水平间距约 12px（保留约 900px 与窄视口边距、标签规格不变、控件左边界对齐、右边界不动、页面作用域布局、不给单个输入框设固定宽度） | `CCFG-DESIGN-072` | `CCFG-UI-060` | `CCFG-AC-136` |
| `CCFG-REQ-138` 纵向节奏以“新增数据源”弹窗为参照（核对 `.cc-form` `gap` 与 `.cc-field-feedback` 稳定占位；不得移除反馈区或用固定弹窗高度掩盖；数据源双栏内部与受控滚动维持现状） | `CCFG-DESIGN-073` | `CCFG-UI-061` | `CCFG-AC-137` |
| `CCFG-REQ-139` 间距调整后弹窗稳定性（提示／错误切换不造成高度／位置突变、长错误完整可读、允许响应式与受控滚动） | `CCFG-DESIGN-074` | `CCFG-UI-062` | `CCFG-AC-138` |
| `CCFG-REQ-140` 停用确认文案收窄为 `确定停用探针 {探针ID} 吗？`（标题“停用探针”、按钮“取消／停用”；二次确认与只改 `FG_ACTIVE` 语义不变） | `CCFG-DESIGN-075` | `CCFG-UI-063` | `CCFG-AC-139` |
| `CCFG-REQ-141` **启用新增确认步骤** `确定启用探针 {探针ID} 吗？`（标题“启用探针”、按钮“取消／启用”；取消不调用启用接口；`FG_ACTIVE`／服务端校验／错误处理／忙碌锁保留；一次点击不得触发多次请求） | `CCFG-DESIGN-076` | `CCFG-UI-064` | `CCFG-AC-140` |
| `CCFG-REQ-142` 主列表仅一行可固定选中（悬停仅临时高亮、左键点击切换固定选中三态、最多一行、视觉层级可区分） | `CCFG-DESIGN-077` | `CCFG-UI-065` | `CCFG-AC-141` |
| `CCFG-REQ-143` 双击编辑与单击选中的事件协调（保留双击行编辑与探针 ID 键盘编辑；不错误取消已固定行、不留与最后操作不符状态） | `CCFG-DESIGN-078` | `CCFG-UI-066` | `CCFG-AC-142` |
| `CCFG-REQ-144` 行内交互控件事件隔离（“更多”触发器／菜单项／确认窗口及遮罩按钮不得触发选中切换；不破坏既有不触发双击编辑口径） | `CCFG-DESIGN-079` | `CCFG-UI-067` | `CCFG-AC-143` |
| `CCFG-REQ-145` 普通重载不保留选中（首次加载／“查询”／失败后“重试”／其他非启停成功重载；“重置”不构成重载；无刷新按钮、自动刷新、轮询） | `CCFG-DESIGN-080` | `CCFG-UI-068` | `CCFG-AC-144` |
| `CCFG-REQ-146` 唯一例外：启停成功后按稳定探针 ID 固定选中或按查询条件清除；取消确认／启停失败不改动；删除成功清选、删除取消／失败不变 | `CCFG-DESIGN-081` | `CCFG-UI-069` | `CCFG-AC-145` |
| `CCFG-REQ-147` 边界与不恢复项（仅当前会话有效；不改 API 契约；不引入额外持久化字段；不改过滤／排序；不恢复行选择状态／复选框／“删除所选”／“已选择：{探针ID}”／批量操作／后端选择状态） | `CCFG-DESIGN-082` | `CCFG-UI-070` | `CCFG-AC-146` |

编号总数（当前值）：

| 文档 | 原最大编号 | 本轮新增 | 现最大编号 | 总数 |
|---|---|---|---|---|
| `REQUIREMENTS.md` | `CCFG-REQ-136` | 11（`137~147`） | `CCFG-REQ-147` | **147** |
| `ACCEPTANCE.md` | `CCFG-AC-135` | 11（`136~146`） | `CCFG-AC-146` | **146** |
| `DESIGN.md` | `CCFG-DESIGN-071` | 11（`072~082`） | `CCFG-DESIGN-082` | **82** |
| `UI.md` | `CCFG-UI-059` | 11（`060~070`） | `CCFG-UI-070` | **70** |

覆盖关系：需求→设计→界面→验收 **147/147**，需求→验收 **147/147**；`DESIGN.md` §12.1 追加 `CCFG-REQ-137~147` 映射行（共 147 行）、§12.2 追加 `CCFG-AC-136~146` 映射行（共 146 行）；`ACCEPTANCE.md` §5 追加 11 行需求覆盖行；`UI.md` §14 关联矩阵覆盖同步为 147/147 与 146/146。

## 4. 已批准基线与本轮草案的分层状态

- **历史已批准层（保持真实、不改写）**：`adjustment_baseline_status=APPROVED`、`adjustment2_baseline_status=APPROVED`、`adjustment3_baseline_status=APPROVED`（`adjustment3_approved_reviewed_commit=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244`）、`adjustment4_baseline_status=APPROVED`（`adjustment4_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment4_approval_date=2026-09-24`、`adjustment4_approved_reviewed_commit=9daf03848d53008d3ac73e6a43c1368fa5d72750`）。
- **既有实现事实层（保持真实、不改写）**：`existing_feature_implementation_status`／`adjustment_implementation_status`／`adjustment2_implementation_status` 均为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`；`adjustment3_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`；`adjustment4_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`（第四轮实现 R1 提交 `0c30b15` 已经 ChatGPT 远程代码复审通过，**尚未**项目负责人目测／正式验收）。
- **本轮草案层（本次建立）**：`adjustment5_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment5_approval_status=NOT_APPROVED`、`adjustment5_implementation_status=NOT_STARTED`、`adjustment5_formal_acceptance_execution_status=NOT_RUN`。
- `PENDING_USER_CONFIRMATION=0`；两份查询／列表视觉模板的模板级全局状态（`NOT_STARTED`／`NOT_GRANTED`／`NOT_DECIDED`）与数据源管理参考页最终接受状态保持不变。

**口径区分**：本任务结果是「**已建立草案**」，既**不是**「已实现」，也**不是**「已正式验收」，本轮**不**产生项目负责人批准；项目负责人在会话中确认三项调整**不等于**草案已复审或已批准。

## 5. 被定向修订的条款（原文保留、可追踪）

均在原定义行**保留原文**并就地追加 `**【本轮（第五轮）定向修订 · 待批准】**` 标注，**不**改写原文、**不**伪装为原规则从未存在：

| 文档 | 条款 | 修订方向 | 承接条目 |
|---|---|---|---|
| `REQUIREMENTS.md` | `CCFG-REQ-020` | “不得提供任何行单选机制／单击普通单元格不得产生任何选中视觉”由页面级定向修订，仅恢复“点击固定单行高亮” | `CCFG-REQ-142` |
| `REQUIREMENTS.md` | `CCFG-REQ-022` | “选中行高亮／已选提示”定向修订；“已选择：{探针ID}”与“删除所选”仍为取消 | `CCFG-REQ-142`、`CCFG-REQ-147` |
| `REQUIREMENTS.md` | `CCFG-REQ-028` | 删除成功后普通重载清除此前固定选中 | `CCFG-REQ-145`、`CCFG-REQ-146` |
| `REQUIREMENTS.md` | `CCFG-REQ-030` | 停用确认正文收窄 | `CCFG-REQ-140` |
| `REQUIREMENTS.md` | `CCFG-REQ-031` | “启用一般不弹确认”定向修订为**新增**确认并给出新旧适用时序；只改 `FG_ACTIVE` 的语义保留 | `CCFG-REQ-141` |
| `REQUIREMENTS.md` | `CCFG-REQ-094` | “选中行背景／高亮／左侧强调线”定向修订，其余取消项不变 | `CCFG-REQ-142`、`CCFG-REQ-147` |
| `REQUIREMENTS.md` | `CCFG-REQ-096` | “更多”事件边界扩展为不得触发选中切换 | `CCFG-REQ-144` |
| `REQUIREMENTS.md` | `CCFG-REQ-103` | “单击普通单元格不得产生选中视觉”定向修订；“更多”入口仍不得产生选中视觉 | `CCFG-REQ-142`、`CCFG-REQ-145` |
| `REQUIREMENTS.md` | `CCFG-REQ-130` | 在其上追加标签右缘与控件左缘约 12px 间距 | `CCFG-REQ-137` |
| `ACCEPTANCE.md` | `CCFG-AC-016`／`-017`／`-018`／`-021` | 行单选／选中视觉／空白取消／“删除所选”等第一轮排除口径的页面级定向修订 | `CCFG-AC-141`、`CCFG-AC-146` |
| `ACCEPTANCE.md` | `CCFG-AC-022`／`-024` | “启用免确认”旧口径定向修订并**新增**启用确认步骤 | `CCFG-AC-140` |
| `ACCEPTANCE.md` | `CCFG-AC-023` | 停用确认文案收窄（业务语义不变） | `CCFG-AC-139` |
| `ACCEPTANCE.md` | `CCFG-AC-127` | 确认弹窗文案核验点更新 | `CCFG-AC-139`、`CCFG-AC-140` |
| `DESIGN.md` | `CCFG-DESIGN-018` | 删除成功重载后的选中口径（清选）；物理 `DELETE`／行数／回滚不变 | `CCFG-DESIGN-081` |
| `DESIGN.md` | `CCFG-DESIGN-019` | “二次确认由前端负责”保留，确认正文收窄 | `CCFG-DESIGN-075` |
| `DESIGN.md` | `CCFG-DESIGN-020` | “一般不弹确认”定向修订为**新增**一次确认；其后后备口径全部不变 | `CCFG-DESIGN-076` |
| `DESIGN.md` | `CCFG-DESIGN-040` | “取消全部选择能力”页面级定向修订，仅恢复视觉单行定位 | `CCFG-DESIGN-077` |
| `DESIGN.md` | `CCFG-DESIGN-041` | “不存在 `@row-click` 改变选中的语义”修订；冒泡阻止边界扩展 | `CCFG-DESIGN-077`、`CCFG-DESIGN-079` |
| `DESIGN.md` | `CCFG-DESIGN-043` | 删除成功重载清选；不新增批量删除接口／调用路径不变 | `CCFG-DESIGN-081` |
| `UI.md` | `CCFG-UI-004` | 工具栏行选中相关口径定向修订；“删除所选”与计数逻辑仍为取消 | `CCFG-UI-065`、`CCFG-UI-070` |
| `UI.md` | `CCFG-UI-005` | 行单选／选中行高亮／点击切换口径页面级定向修订；各“保留／清除选择”分支重新赋义 | `CCFG-UI-065`、`CCFG-UI-068`、`CCFG-UI-069` |
| `UI.md` | `CCFG-UI-018` | “启用：一般免确认，点击直接调 E6”定向修订为**新增**确认；停用二次确认保留、正文收窄 | `CCFG-UI-063`、`CCFG-UI-064` |
| `UI.md` | `CCFG-UI-020` | 停用确认正文收窄；其余文案（删除确认、成功提示、`40940`／`40941`／`40942`、候选加载失败）逐字节保留；启用确认文案由 `CCFG-UI-064` 新定义 | `CCFG-UI-063`、`CCFG-UI-064` |

**保留正确口径**（未被本轮改写）：“重置只清空查询控件、不发起查询”“本页不提供任何刷新能力（无刷新按钮／自动刷新／轮询）”“停用需要二次确认”“异常状态行‘更多’的安全操作口径与启停忙碌锁、失败提示不变”。

## 6. 验收状态

- 本轮新增 `CCFG-AC-136~146`（11 条）**全部为 `NOT_RUN`**。
- 全文件 `formal_acceptance_execution_status=NOT_RUN`：**146 条全部未执行**；`adjustment5_formal_acceptance_execution_status=NOT_RUN`。
- 既有 135 条验收**未假写为通过**，仍全部 `NOT_RUN`；本轮**未**把任何用例标记为执行或通过；本轮**只定义验收，不运行正式验收**。

## 7. 未修改文件与未执行项

**未修改**：见 §2 末尾列表（含 `API.md`、`DATABASE.md`、`docs/baseline/**`、`docs/features/README.md`、历史报告、`docs/prompts/**`、前后端代码与服务、参考页）。

**未执行项（本任务明确不做）**：

- 未运行测试、Vitest、Maven 测试；未运行前后端构建、类型检查、lint。
- 未启动或停止任何服务；未做浏览器核对。
- 未执行正式验收；未访问数据库、ZooKeeper、Kafka。
- 未修改代码、配置、数据库对象。
- 未提前创建、批准或推广“新增／编辑表单弹窗模板”；未声称其他页面已接入；未修改参考页 `/config/data-source`。

## 8. 静态检查结果

| 检查项 | 命令／方法 | 结果 |
|---|---|---|
| 分支与提交 | `git branch --show-current`、`git rev-parse HEAD`、`git ls-remote origin refs/heads/develop` | `develop`；本地／`origin/develop`／远程三者均为 `0c30b15`，`0/0` |
| 空白／冲突标记 | `git diff --check` | 干净（退出码 0） |
| 变更白名单 | `git status --short` | 仅 5 份白名单文档 + 新增 1 份报告 + 未跟踪 `docs/prompts/` 与预先存在的 ` M .claude/settings.local.json`（后者与本任务无关，未暂存） |
| 编号连续唯一 | 逐文档提取 `CCFG-REQ/AC/DESIGN/UI` 编号 | 需求 001~147（147）、验收 001~146（146）、设计 001~082（82）、界面 001~070（70），均唯一连续无缺号 |
| 映射完整性 | `DESIGN.md` §12.1／§12.2 行数、`ACCEPTANCE.md` §5 行数核对 | §12.1 = 147 行、§12.2 = 146 行；需求 147 条、验收 146 条覆盖齐备 |
| 定向修订可追踪 | 逐条核对既有定义行标记与原文保真 | 需求 9 条、验收 8 条、设计 6 条、界面 4 条均含 `**【本轮（第五轮）定向修订 · 待批准】**`；逐行核对**原文描述与尾部映射列均逐字节保留**，仅在其后追加标注 |
| 定义行差异边界 | `git diff -U0` 逐文件统计移除／新增的 `| CCFG-` 行 | 被修改的定义行恰为上述 9／8／6／4 条（无其他既有定义行被改动）；新增行仅为本轮新增条款与章节文字 |
| 状态口径 | 全文检索 `adjustment5_*`、`NOT_RUN`、批准／实现措辞 | 本轮统一为草案 `DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`／`NOT_STARTED`／`NOT_RUN`，未混用「已批准／已实现／已验收」；仅存在一处叙述性“无 `PASSED`/`FAILED`/`BLOCKED`”的历史变更记录文字，**无任何用例被标记为执行或通过** |
| 历史分层不被改写 | 核对四轮基线状态与各轮实现事实 | 第一~第四轮已批准基线与各轮实现事实逐条保留，第四轮实现 R1 提交 `0c30b15` 的远程代码复审通过事实照实登记、其“尚未目测／尚未正式验收”边界明示 |

## 9. 下一入口

- `next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_REVIEW`
- 复审对象：本草案结果提交（从远程 Git 读取）；复审要点为 §3 定义映射、§5 定向修订与原文保真、§6 验收状态与状态口径。
- **远程文档复审通过后仍需项目负责人批准本轮草案**，才能另行进入本轮代码实现；**不得**在复审与批准前进入实现，也**不得**把本草案写成已批准、已实现、已目测或已验收。
- `blocker`：无（任务范围内无阻塞；本轮停在本复审入口等待基线复审与项目负责人批准）。
