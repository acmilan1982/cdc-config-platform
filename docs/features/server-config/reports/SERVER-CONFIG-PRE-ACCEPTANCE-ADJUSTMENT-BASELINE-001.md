# 中心端配置 验收前显示与排序调整候选基线报告

## 1. 任务元数据

- `task_id`: `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001`
- Feature：`server-config`（中心端配置）
- 目标分支：`develop`
- 授权基线：`c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba`
- 任务性质：纯文档、候选基线建立任务（不进入实现、不执行验收）
- 执行时间：2026-08-28
- 建议提交信息：`docs(server-config): draft pre-acceptance display adjustment`

## 2. 权限边界

本任务为纯文档任务，全程遵守以下边界：

| 项 | 允许状态 | 实际执行 |
|---|---|---|
| 代码修改（Java/Vue/TS/CSS/测试） | `NONE` | 未修改任何代码 |
| 数据库访问 | `NONE` | 未连接数据库，0 条查询/写入/DDL |
| ZooKeeper 访问 | `NONE` | 未连接 |
| `sync-server` 操作 | `NONE` | 未启动/停止/重启 |
| `POST /api/server-config/save` | `NONE` | 0 次调用 |
| 前后端/Chrome/CDP 运行服务 | `NONE` | 未启动/停止/重启/操作 |
| 正式验收 | `NONE` | 未执行（状态保持 `NOT_RUN`） |
| 已批准数据库基线 | `NONE` | 未修改 |
| 文档修改 | 仅 6 份功能基线文档 | 已修改 6 份 |
| 报告新建 | 仅 1 份执行报告 | 本报告 |

## 3. Git 开始状态

- 当前分支：`develop`
- 任务开始前 HEAD：`c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba`
- `origin/develop`：`c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba`
- ahead / behind：`0 0`
- 任务开始前既有未提交条目数：114 条（全部保持原样，未清理、未覆盖、未暂存、未提交；其中不含本次 6 份授权文档）
- 授权文档开始前状态：6 份均为 `CLEAN`（与授权基线一致）

## 4. 负责人视觉结论

负责人已完成页面目测。除本次任务列出的两项调整（`CONFIG_DESC` 人工换行、展示顺序改为 `ID_SERVER_CONFIG ASC`）外，未发现其他视觉问题。

本报告不把负责人目测或此前的只读联调描述为正式验收完成；正式验收仍为 `NOT_RUN`。

## 5. 两项调整

### 5.1 `CONFIG_DESC` 人工换行

- 原因：当前页面已能对过长配置项说明自动折行，但数据库 `CONFIG_DESC` 存在真实换行字符（如 Oracle `CHR(10)`）时，页面不按该换行显示。
- 旧规则：未明确数据库真实换行的显示语义，仅具备自然折行行为。
- 新候选规则：
  - 普通过长文本按列宽自动折行；
  - `CONFIG_DESC` 中真实 LF/CRLF 换行按换行位置显示，目标前端样式语义为 `white-space: pre-line; line-height: 1.6; overflow-wrap: anywhere;`；
  - 不解析 HTML、不把 `<br>` 作为换行协议、不把字面量 `\n` 自动转换为换行、严禁 `v-html`；
  - API 原样返回 `configDesc`（JSON 标准转义在线路上传输换行），后端不做 HTML/换行替换或规范化；
  - `CONFIG_DESC` 仍为只读字段，页面不允许修改；
  - 不新增数据库字段、约束、索引或 DDL，不要求修改任何数据；
  - 多行说明下信息图标/Key Tooltip 仍合理对齐，不破坏布局、不造成横向溢出。
- 实现状态：尚未实现（本次仅调整候选基线）。

### 5.2 展示顺序

- 原因：负责人要求配置项说明列表不再按 `CONFIG_KEY` 排序，改为按 `ID_SERVER_CONFIG` 升序展示。
- 旧规则：`CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC`。
- 新候选规则：
  - 统一契约为 `ORDER BY ID_SERVER_CONFIG ASC`；
  - 后端查询负责排序，前端保持接口返回顺序、不二次排序；
  - `CONFIG_KEY` 不再承担页面排序职责，但仍作为 sync-server 读取配置、编辑白名单识别和 Key Tooltip 展示所需的技术标识；
  - `ID_SERVER_CONFIG` 按数据库字段自身字符串排序语义升序，不做数值转换；当前补零编号（如 `001`～`008`）可得到负责人期望顺序；
  - 不新增或修改数据库约束、索引、主键及数据。
- 实现状态：尚未实现（旧实现仍采用旧排序，本次仅调整候选基线）。

## 6. 授权文件修改清单

共修改 6 个既有文档、新建 1 个报告，共 7 个授权文件：

| 文件 | 修改摘要 |
|---|---|
| `docs/features/server-config/REQUIREMENTS.md` | 状态标记更新；`SC-UI-04`、`SC-DISPLAY-02` 排序改为 `ID_SERVER_CONFIG ASC`；`SC-UI-11` 拆分自动折行/真实换行；新增 §7.6（`SC-UI-23`～`SC-UI-26`）；追加变更记录 |
| `docs/features/server-config/ACCEPTANCE.md` | 状态标记更新；`SC-AC-007` 聚焦自动折行、`SC-AC-017` 改为 `ID_SERVER_CONFIG ASC`；新增 §4.15 + `SC-AC-066`；总数 65→66；追加变更记录 |
| `docs/features/server-config/DESIGN.md` | 状态标记更新；`SC-DESIGN-046`、`SC-DESIGN-121` 排序改为 `ID_SERVER_CONFIG ASC`；新增 `SC-DESIGN-047`；追加变更记录 |
| `docs/features/server-config/API.md` | 状态标记更新；`SC-API-025`、`SC-API-034` 排序改为 `ID_SERVER_CONFIG ASC`；`SC-API-027` 移除排序职责；`SC-API-028` 明确含真实换行原样返回；新增 `SC-API-036`；追加变更记录 |
| `docs/features/server-config/UI.md` | 状态标记更新；`SC-UI-DESIGN-030` 聚焦自动折行；新增 `SC-UI-DESIGN-035`～`SC-UI-DESIGN-038`、`SC-UI-DESIGN-045`；`SC-UI-DESIGN-152` 视觉清单更新；追加变更记录 |
| `docs/features/server-config/DATABASE.md` | 状态标记更新；`SC-DB-023`、`SC-DB-024`、`SC-DB-034`、`SC-DB-054`、`SC-DB-091` 排序与职责修订；新增 `SC-DB-056`；§6 章节标题更新；追加变更记录 |
| `docs/features/server-config/reports/SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001.md` | 本报告（新建） |

历史 `APPROVED` 状态与 R1/R2 修订记录均保留，未抹除；旧规则仅保留在明确标记为历史的变更记录行中。

## 7. 状态与计数

- 六份文档候选状态：`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`
- 实现状态：`IMPLEMENTED_ADJUSTMENT_PENDING`（旧批准版本已实现并复审，本次两项调整尚未实现）
- 正式验收：`NOT_RUN`
- 验收用例总数：66（`SC-AC-001`～`SC-AC-066`，连续且唯一）
- 验收用例 `NOT_RUN` 数：66
- 负责人业务待确认项：0

## 8. 验证命令与真实结果

| 验证项 | 命令 | 退出码/结果 |
|---|---|---|
| 分支与现场 | `git branch --show-current` | `develop` |
| 授权基线 | `git rev-parse HEAD` / `git rev-parse origin/develop` | 均为 `c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba` |
| ahead/behind | `git rev-list --left-right --count HEAD...origin/develop` | `0 0` |
| 空白错误 | `git diff --check` | 退出码 0，无输出 |
| 变更范围 | `git status --short`（限定 7 个授权文件） | 仅 6 个文档 ` M` + 本报告新建 |
| 状态一致 | grep 六份文档状态标记 | 六份一致 |
| 排序统一 | grep 当前目标规则 `ORDER BY ID_SERVER_CONFIG ASC` | 一致；`CONFIG_KEY ASC NULLS LAST` 仅存在于历史记录行 |
| `configDesc` 语义 | 交叉核对 API/DESIGN/UI/DATABASE | 一致（原样传输、安全文本渲染、真实换行语义） |
| 安全边界 | grep `v-html`/`<br>` 协议/字面量 `\n` 转换 | 目标规则中无；已明确禁止 |
| 验收用例 | grep `SC-AC-001`～`SC-AC-066` | 连续唯一，66 条，全部 `NOT_RUN` |
| 编号冲突 | grep 新增编号定义行 | 定义行唯一，未与既有编号冲突 |
| Markdown 链接 | 相对链接检查 | 可解析 |
| 待确认项 | grep `PENDING_USER_CONFIRMATION` | 0 |

> 验证在提交前完成；本表记录的是任务执行中的真实命令与结果，未使用推测值。

## 9. 零副作用声明

- 未修改任何前后端业务代码与测试；
- 未执行数据库查询、写入、DDL 或提供/执行任何 `UPDATE`；
- 未连接 ZooKeeper；
- 未调用 `POST /api/server-config/save`；
- 未启动、停止、重启或操作此前交接的前后端、Chrome/CDP、sync-server；
- 未执行正式验收；
- 未修改已批准数据库基线、`docs/features/README.md` 或既有执行报告；
- 未 force push、rebase 或改写历史；
- 任务开始前的无关工作区修改（114 条）原样保留，未清理、未覆盖、未暂存、未提交。

## 10. Commit / Push 结果

- 提交信息：`docs(server-config): draft pre-acceptance display adjustment`
- 仅精确暂存 7 个授权文件；
- 普通 Push 到 `origin/develop`（未使用 force）；
- Push 后验证 `HEAD == origin/develop` 且 ahead/behind 为 `0 0`；
- 任务开始前的无关工作区内容仍原样存在。

## 11. 下一步

本任务在 Commit 与 Push 成功后即停止，不进行批准收口、不创建实现任务、不修改代码、不运行构建/测试/业务服务，也不操作数据库、ZooKeeper 或 sync-server。

下一步仅允许：ChatGPT 直接核对远程提交和本报告；复审通过后，由项目负责人决定是否批准本次调整基线。批准后再建立一个只修改排序与说明换行显示的小范围实现任务。

---

## 12. R1 复审修正章节

### 12.1 R1 任务标识

- `task_id`: `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001-R1`
- 授权基线：`2a8255a231a20a4fc9414c25494c25f54d716ae5`
- 任务性质：纯文档 R1 精确修正
- 建议提交信息：`docs(server-config): correct implemented-state facts`

### 12.2 ChatGPT 远程复审结论与阻断点

ChatGPT 已直接核对远程提交 `2a8255a231a20a4fc9414c25494c25f54d716ae5`：

- 相对授权基线 `c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba` 恰好 1 个提交；
- 变更范围恰好为任务授权的 7 个文档；
- `CONFIG_DESC` 真实换行规则正确；
- 排序目标已统一为 `ORDER BY ID_SERVER_CONFIG ASC`；
- `SC-AC-001`～`SC-AC-066` 共 66 条、全部 `NOT_RUN`；
- 两项候选调整本身无业务待确认项。

**阻断点**：若干正文仍保留 Feature 实现前的旧事实，例如“页面仍是 PlaceholderPage”“菜单仍叫服务端配置”“当前没有后端接口或数据库访问”“全部读写路径尚未实现”。这些表述与同一文档顶部的真实状态——旧批准版本已实现、经 R1/R2 复审并完成只读联调，本次仅有两项调整尚未实现——直接矛盾。因此提交 `2a8255a` 暂不批准，必须先执行本 R1。

### 12.3 本 R1 修正的文件与规则

仅修改 4 个文档 + 追加本报告 R1 章节，未修改 `ACCEPTANCE.md`、`API.md`、任何代码、测试、数据库基线、索引或其他报告：

| 文件 | 修正内容 |
|---|---|
| `docs/features/server-config/REQUIREMENTS.md` | §3 由“当前代码事实与未来目标分层”改写为“当前已实现事实与候选调整目标分层”（§3.1 `IMPLEMENTED_REVIEWED`、§3.2 `ADJUSTMENT_TARGET`、§3.3 分层约定）；删除“菜单仍为服务端配置”“页面仍为 PlaceholderPage”“无后端接口/数据库访问”“全部读写路径未实现”等实现前旧事实；SC-MENU-04 分层约定同步更新；追加 R1 变更记录 |
| `docs/features/server-config/DESIGN.md` | §3 标题与 SC-DESIGN-003/010/011/013 修正：由实现前“占位实现 → 整体未来目标”更新为“旧批准版本已实现 → 两项候选调整尚未实现”，列出正式前后端能力与本次仅两项调整目标；追加 R1 变更记录 |
| `docs/features/server-config/UI.md` | SC-UI-DESIGN-003 改为菜单/路由 title 当前已是“中心端配置”；SC-UI-DESIGN-005 改为正式页面已实现；新增 SC-UI-DESIGN-006 记录当前 UI 已实现状态与尚待实现项；候选规则 SC-UI-DESIGN-035~038、SC-UI-DESIGN-045 目标语义不变；追加 R1 变更记录 |
| `docs/features/server-config/DATABASE.md` | SC-DB-002 改为旧批准查询/保存/两表访问路径已实现，本次数据库使用调整仅为查询排序改为 `ORDER BY ID_SERVER_CONFIG ASC`，`CONFIG_DESC` 真实换行不需要数据库结构或写路径变化；SC-DB-050 移除 `FUTURE_FEATURE_TARGET` 标签；`DDL_STATUS=NONE` 不变；追加 R1 变更记录 |

### 12.4 不变项声明

本 R1：

- 不改变两项候选业务规则（真实换行显示、`ORDER BY ID_SERVER_CONFIG ASC`）；
- 不改变验收数量（仍为 66 条，全部 `NOT_RUN`）；
- 不批准候选调整（状态仍为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` / `IMPLEMENTED_ADJUSTMENT_PENDING`）；
- 不修改代码或数据库；
- 保持六份候选文档状态一致，待确认 0。

### 12.5 验证、Commit、Push 结果

- R1 验证：`git diff --check` 退出码 0 无输出；相对 `2a8255a` 仅 5 个授权文件发生变化；`ACCEPTANCE.md`、`API.md` 相对授权基线零变化；业务代码/测试/数据库基线相对授权基线零变化；四份文档不再保留实现前旧事实，且一致区分“旧批准版本已实现；真实换行与新排序尚未实现”；候选规则 `white-space: pre-line` 安全文本显示与 `ORDER BY ID_SERVER_CONFIG ASC` 未变化；66 条验收全部 `NOT_RUN`、待确认 0；历史记录保留且追加 R1 记录；无数据库/ZooKeeper/服务访问或操作。
- Commit：精确暂存 5 个授权文件，提交信息 `docs(server-config): correct implemented-state facts`。
- Push：普通 Push 到 `origin/develop`；Push 后确认 `HEAD == origin/develop` 且 ahead/behind 为 `0 0`；任务前无关工作区内容原样保留。

---

## 13. R2 复审微修正章节

### 13.1 R2 任务标识

- `task_id`: `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001-R2`
- 授权基线：`789087dda2382ed72b913ecc500b1dbe8c3186fa`
- 任务性质：纯文档、两处文字口径微修正
- 建议提交信息：`docs(server-config): finalize adjustment baseline wording`

### 13.2 ChatGPT R1 复审结论与剩余问题

ChatGPT 已直接核对远程提交 `789087dda2382ed72b913ecc500b1dbe8c3186fa`：

- 相对 `2a8255a` 恰好 1 个提交、5 个授权文件；
- R1 对 `REQUIREMENTS/DESIGN/UI/DATABASE` 的实现事实修正正确；
- 两项候选规则未改变；
- `ACCEPTANCE.md`、`API.md`、代码、测试和数据库基线未被修改；
- 状态仍为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW / IMPLEMENTED_ADJUSTMENT_PENDING`；
- 66 条验收仍全部 `NOT_RUN`。

剩余问题仅为 `REQUIREMENTS.md` 的两处当前口径残留，批准前必须精确修正：

1. §1 说明同一句先写“65 条验收”、后写“现 66 条”，容易形成当前数量矛盾；前者必须明确为原需求批准时的历史数量 65 条，当前候选基线一律为 66 条。
2. §4 数据库文档引用表仍写“14 当前访问 + 2 已批准待实现”；该分层是数据库基线批准当时的历史口径，现在两张表已经由 `server-config` 实现访问，必须明确标注为历史分层，且不得修改数据库基线文档。

### 13.3 本 R2 修正的文件

本 R2 仅修改 2 个授权文件，未修改其他任何文件：

| 文件 | 修正内容 |
|---|---|
| `docs/features/server-config/REQUIREMENTS.md` | §1 说明“65 条验收”明确为原需求批准时的历史数量，并注明新增 `SC-AC-066` 后当前共 66 条仍全部未执行；§4 权威文档引用表“16 张（14 当前访问 + 2 已批准待实现）”明确为数据库基线批准时的历史分层，并注明后两张现已由本 Feature 实现访问；§20 追加 R2 变更记录 |
| `docs/features/server-config/reports/SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001.md` | 追加本 R2 复审微修正章节 |

### 13.4 不变项声明

本 R2 不改变：

- 换行规则（真实换行安全显示，`white-space: pre-line` 目标语义）；
- 排序规则（`ORDER BY ID_SERVER_CONFIG ASC`）；
- 接口、验证规则、状态或验收数量（仍为 66 条，全部 `NOT_RUN`）；
- 六份候选文档状态（`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` / `IMPLEMENTED_ADJUSTMENT_PENDING`）；
- 代码或数据库基线（零修改，`ACCEPTANCE.md`、`API.md` 亦零变化）。

### 13.5 验证、Commit、Push 结果

- R2 验证：`git diff --check` 退出码 0 无输出；相对授权基线 `789087d` 仅 2 个授权文件发生变化；`REQUIREMENTS.md` 当前口径不再出现未标注历史的“65 条验收”；“14 当前访问 + 2 已批准待实现”仅作为明确标注的数据库批准时历史口径且同处说明后两张现已实现访问；其他 5 份功能文档、代码、测试、数据库基线零变化；两项候选规则、66 条验收与状态零漂移；报告追加 R2 记录；无数据库/ZooKeeper/业务服务操作。
- Commit：精确暂存 2 个授权文件，提交信息 `docs(server-config): finalize adjustment baseline wording`。
- Push：普通 Push 到 `origin/develop`；Push 后确认 `HEAD == origin/develop` 且 ahead/behind 为 `0 0`；任务前无关工作区内容原样保留。

---

## 14. 批准收口（SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001）

本候选基线任务在 R2 提交 `b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee` 后，经 ChatGPT 远程复审与项目负责人批准，由独立批准任务完成收口，结论如下。

### 14.1 复审与批准事实

- ChatGPT 已直接核对远程 R2（`b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee`）：范围、两处口径、两项候选规则、66 条验收和状态均通过，**无需 R3**；
- 项目负责人已在 ChatGPT 会话中明确回复“同意”，正式批准本次验收前调整基线；
- 当前业务待确认项 `PENDING_USER_CONFIRMATION=0`。

### 14.2 六份文档状态迁移结果

| 文档 | 迁移前 | 迁移后 |
|---|---|---|
| `REQUIREMENTS.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |
| `ACCEPTANCE.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |
| `DESIGN.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |
| `API.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |
| `UI.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |
| `DATABASE.md` | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` | `APPROVED` |

六份文档均保留原需求/设计首次批准历史、候选调整初始提交 `2a8255a`、R1 `789087d`、R2 `b1c5349` 全部历史记录，未覆盖或删除；均追加批准收口变更记录与批准元数据（批准任务 `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001`、批准日期 2026-08-28、批准人=项目负责人、ChatGPT 最终复审通过提交 `b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee`）。

### 14.3 两项规则内容不变

- `CONFIG_DESC` 真实 LF/CRLF 在页面按换行位置安全显示；普通长文本仍自动折行；不解析 `<br>`、字面量 `\n` 或 HTML，禁止 `v-html`；
- 配置列表查询与展示顺序改为 `ORDER BY ID_SERVER_CONFIG ASC`，前端不二次排序。

### 14.4 实现与验收状态

- 旧批准版本：`IMPLEMENTED_REVIEWED`（已实现并复审）；
- 本次两项调整：已批准，但代码**尚未实现**；
- 总体实现状态：`IMPLEMENTED_ADJUSTMENT_PENDING`；
- 正式验收：66 条 `SC-AC-001~066` 全部 `NOT_RUN`；
- `PENDING_USER_CONFIRMATION=0`。

### 14.5 批准任务修改范围、验证与 Commit/Push 结果

- 修改范围：仅 9 个授权文件（六份功能文档 + 本报告追加批准章节 + 新建批准报告 `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001.md` + `docs/features/README.md` server-config 行）；
- 验证：`git diff --check` 退出码 0 无输出；相对授权基线 `b1c5349` 仅 9 个授权文件变化；六份文档状态均为 `APPROVED`、实现状态均为 `IMPLEMENTED_ADJUSTMENT_PENDING`、66 条验收全部 `NOT_RUN` 且编号连续唯一；无当前生效的 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 状态（历史记录除外）；初始候选、R1、R2 历史均保留；代码、测试、数据库基线相对授权基线零变化；所有相对 Markdown 链接可解析；未访问数据库/ZK、未操作服务、未执行构建测试或验收；
- Commit：精确暂存 9 个授权文件，提交信息 `docs(server-config): approve pre-acceptance adjustment baseline`；
- Push：普通 Push 到 `origin/develop`，禁止 force；Push 后确认 `HEAD == origin/develop` 且 ahead/behind 为 `0 0`；任务前无关工作区内容原样保留。

### 14.6 下一步

本次批准不代表两项代码调整已经实现，也不代表 66 条正式验收已经执行。下一阶段为**单独建立小范围代码实现任务**，在本任务中不实现任何代码。
