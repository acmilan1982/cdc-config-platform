# DATA-SOURCE-DESIGN-BASELINE-001 — 数据源管理设计与契约基线草案执行报告

> 任务类型：纯文档设计草案建立、提交与推送（阶段4——设计与契约）
> 目标分支：`develop`
> 授权基准提交：`c24bbb826b252f06f75ec05bcac77e94a9871019`
> 需求状态：`APPROVED`
> 验收标准状态：`APPROVED`
> 实现状态：`NOT_STARTED`
> 报告日期：2026-08-29
> 最终提交 ID：见控制台结果块 `result_commit_id`（本报告不伪造尚未产生的 Commit ID）

---

## 1. 任务结论与授权基准

- 本任务只建立 4 份设计草案（`DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`）和 1 份执行报告，均为纯文档产物。
- 授权基准提交 `c24bbb826b252f06f75ec05bcac77e94a9871019`；任务开始前已核验 `HEAD == origin/develop == git ls-remote origin refs/heads/develop == c24bbb8...`，远端未前进、未分叉，无 `BLOCKED_REMOTE_BASE_CHANGED`。
- 四份设计文档状态均为 `DRAFT_PENDING_USER_REVIEW`，需求/验收保持 `APPROVED`，实现保持 `NOT_STARTED`；106 条验收用例全部 `NOT_RUN`。
- 本任务**不批准设计**：草案等待 ChatGPT 复审与用户最终批准；不代表代码已实现、构建通过、验收执行或生产可用。
- 未修改任何已批准需求/验收、项目/数据库基线、代码、测试、构建配置、菜单、路由或历史候选；未连接数据库、未执行 SQL/DDL、未启动服务、未构建、未测试。

---

## 2. 开始前 Git 状态

任务开始前记录：

| 项 | 值 |
|---|---|
| 当前分支 | `develop` |
| `git rev-parse HEAD` | `c24bbb826b252f06f75ec05bcac77e94a9871019` |
| `git ls-remote origin refs/heads/develop` | `c24bbb826b252f06f75ec05bcac77e94a9871019` |
| ahead/behind | 0 / 0 |
| 远端校验 | 精确等于授权基准，未前进/分叉 |

工作区既有无关内容（`frontend/**` 修改、`docs/database/TASK*.md` 删除、`docs/agent-prompts/**` 等未跟踪文件、`.claude/settings.local.json`、`agent-env.sh` 等）**原样保留**，未清理、未还原、未暂存、未提交。

---

## 3. 读取依据

完整读取并作为设计依据：

- 项目规则/流程：`CLAUDE.md`、`agent-env.sh`、`docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`、`PROJECT.md`、`ENVIRONMENT.md`、`ARCHITECTURE.md`、`DEVELOPMENT_RULES.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md`。
- 已批准 Feature 基线：`docs/features/data-source-management/REQUIREMENTS.md`（DS-REQ-001~109）、`ACCEPTANCE.md`（DS-AC-001~106）、`reports/DATA-SOURCE-REQUIREMENTS-APPROVAL-CLOSEOUT-001.md`、`reports/DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001.md`、`reports/DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001-R1.md`。
- 数据库权威基线：`docs/database/README.md`、`SCHEMA.md`、`RELATIONS.md`、`CODE_VALUES.md`、`DATA_PROFILE.md`、`CHANGELOG.md`、`tables/CDC_DATA_SOURCE.md`、`tables/CDC_DATA_SOURCE_EXTEND.md`。
- 当前代码与历史候选：后端 `datasource` 包（controller/service/mapper/entity/dto/error-code）、`pom.xml` JDBC 依赖、公共 `ApiResponse`/`BusinessException`/`GlobalExceptionHandler`/`PageResult`、前端路由/菜单/`DataSourcePage.vue` 占位页/`http.ts`/`logQuery.ts` 超时模式、`/api/data-sources` 全部调用者、历史候选 `docs/api/data-source-api.md`、`docs/pages/data-source-management.md`。

数据库结构、字段、约束、索引、数据画像均以已批准基线为准，本任务未重新连接数据库。

---

## 4. 5 个产物及章节/接口/追踪数量

| # | 产物 | 章节 | 关键数量 |
|---|---|---|---|
| 1 | `docs/features/data-source-management/DESIGN.md` | §0~§9 | 架构/改造边界、核心流程、事务边界、逻辑唯一性、密码安全、测试连接、校验 trim 状态、性能限制、需求追踪矩阵（DS-REQ-001~109，109 行） |
| 2 | `docs/features/data-source-management/API.md` | §0~§7 | 目标接口总表 **13 个**接口、组合逻辑键、密码契约、逐接口请求/响应字段、错误契约、兼容性、追踪 |
| 3 | `docs/features/data-source-management/UI.md` | §0~§7 | 页面布局、主弹窗、连接测试交互、业务属性弹窗、命名策略大弹窗、通用状态与视觉验收、追踪 |
| 4 | `docs/features/data-source-management/DATABASE.md` | §0~§6 | 物理结构引用（2 表）、操作矩阵（13 类操作）、更新/删除边界、查询与唯一校验、数据安全、追踪（13 行） |
| 5 | `docs/features/data-source-management/reports/DATA-SOURCE-DESIGN-BASELINE-001.md` | 本报告 | — |

---

## 5. 关键技术设计决策

1. **目标接口**：复用 `/api/data-sources` 根路径，13 个接口覆盖无分页列表/详情/新增/编辑/删除/测试连接/目标候选/业务属性读写/命名策略 CRUD；删除旧分页/启停/一对一 EXTEND 语义。
2. **命名策略无主键定位**：`CDC_DATA_SOURCE_EXTEND` 无物理主键，编辑/删除按原始逻辑键 `(sourceId, targetId)` 定位；编辑切换目标库时路径携带原目标库 ID、请求体携带新目标库 ID；不使用伪造主键/记录 ID；按逻辑键定位要求恰好一行（0 行 `40401`、≥2 行 `40903`），不使用 MyBatis-Plus 不可控的单记录更新/删除。
3. **密码契约**：真实密码永不返回；编辑掩码为 UI 状态；未改密码请求字段缺席（不依赖 `*********` 魔法哨兵）；新密码 trim 后覆盖；编辑测试未改密码时后端安全读取持久化密码仅用于本次临时连接。
4. **测试连接**：后端生成 JDBC URL/驱动、一次性临时连接、Oracle `SELECT 1 FROM DUAL`/MySQL·Doris `SELECT 1`、10 秒超时不重试、try-with-resources 关闭、不写业务数据；前端 10→0 倒计时、请求代次机制、到 0 忽略迟响应、修改连接字段后成功失效、不是保存前置条件；MySQL/Doris JDBC 驱动为后续实现任务的构建依赖调整，本任务不修改 POM。
5. **逻辑唯一性**：ID/名称忽略大小写精确查重；命名策略逻辑键忽略大小写联合查重；第一版无数据库约束/索引/DDL，明确"查询后写入"不宣称数据库级并发唯一保证；不新增本地/分布式锁或 DDL，如实现必须新增则停止报告。
6. **事务与维护边界**：新增只插主表并写 `FG_ACTIVE='1'`、`DATA_SOURCE_ORG=DATA_SOURCE_NAME`；编辑只改主表当前记录、修改 ID 不同步任何引用、隐藏字段保留；删除只物理删主表当前记录不级联；业务属性只更新 `DATA_SOURCE_BIZ_ATTR` 一列（原样不 trim 不校验）；命名策略 CRUD 只操作 EXTEND；测试连接无业务 DML。
7. **错误契约**：结合真实 `ApiResponse`（成功 code=200）/`BusinessException`（HTTP 200 + 业务码）/BeanValidation（HTTP 400）/未知（HTTP 500 "服务器内部错误"）；复用兼容码、废弃 `40004`（EXTEND_REQUIRED）与 `50002`（STATUS_FAILED）、新增 `40005`/`40401`/`40902`/`40903`；测试连接失败返回脱敏结果对象而非业务异常；业务消息不含密码/敏感连接串（`GlobalExceptionHandler` 以 `log.warn` 记录业务消息）。

---

## 6. 当前代码到目标设计的主要差异（现状差距，非目标）

| 当前代码事实（旧候选） | 目标设计 |
|---|---|
| 列表分页 `PageResult`；`enable`/`disable` 端点 | 无分页列表；删除启停能力 |
| `create/update` 强校验 `extend` 必填、双表联写 | 命名策略独立 0..N，主表保存不触碰 EXTEND |
| 修改 ID 同步 EXTEND、删除先删 EXTEND 再删主表 | 修改 ID 只改主表、删除只删主表不级联 |
| `findExtend` 用 `ROWNUM=1` 假定一对一 | 策略无分页全量、逻辑键定位、多行异常防护 |
| 无密码掩码/不返回、无测试连接、无业务属性、无命名策略多记录维护 | 完整目标契约（见四份文档） |
| 前端占位页 | 正式页面替换，路由/菜单保持不变 |

上述差异只作为改造差距记录；本任务不修改代码。

---

## 7. 109/109 需求追踪检查

- `DESIGN.md` §9 主追踪矩阵含 `DS-REQ-001`~`DS-REQ-109` 共 **109 行**，机械提取校验：`unique=True`、`continuous_001_109=True`、无缺失、无重复；每条至少映射到一个具体设计章节（D/A/U/DB 具体节号），未出现"整体覆盖"式占位。
- `API.md` §1 总表 13 个接口每个均关联 ≥1 个 `DS-REQ` 与 ≥1 个 `DS-AC`（逐行校验通过）。
- `UI.md` 各节均含"追踪"行（6 处），组件/交互关联对应 `DS-REQ`/`DS-AC`。
- `DATABASE.md` §6 追踪表 13 行每行均关联 `DS-REQ`、`DS-AC` 与对应 API 路径（逐行校验通过）。

---

## 8. 四文档一致性检查

- API 路径、HTTP 方法、字段名（camelCase）在四文档一致；逻辑组合键 `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 四文档均出现。
- 密码状态模型（缺席/提供、掩码为 UI 状态、不依赖哨兵）、错误码集合（`API.md` 定义、`DATABASE.md` 引用）、事务/删除边界、测试连接超时（10 秒）/倒计时（10→0）一致。
- 关键词扫描（分页/启用/停用/一对一/扩展配置/级联/DDL/密码/星号/自动刷新）：全部仅作为"旧实现差距、禁止项或明确目标边界"出现；`星号` 未使用（掩码以"掩码/`*********`"表述）；未出现"API 分页而 UI 不分页"、"UI 提交星号而 API 字段缺席"、"API 伪造策略主键而 DATABASE 无主键"、"DESIGN 级联而需求只删主表"、"DATABASE 暗含 DDL/索引"或"文档把旧代码写成已满足新目标"。

---

## 9. 未修改需求、验收、代码、数据库和其他基线的证明

- `git diff c24bbb8 -- docs/features/data-source-management/REQUIREMENTS.md docs/features/data-source-management/ACCEPTANCE.md` 为空（0 行）。
- 已批准项目/数据库基线、`README.md`、代码、测试、构建文件、配置、菜单、路由、历史候选、原报告均未修改。
- 本任务未连接数据库、未执行 SQL/DDL、未启动服务、未构建、未测试（验证矩阵按文档任务标记 `NOT_APPLICABLE`）。
- 工作区既有无关内容原样保留。

---

## 10. 设计追踪机械检查结果（任务提示词 §12）

| # | 检查项 | 结果 |
|---|---|---|
| 1 | DS-REQ-001~109 连续、无缺失、无重复，每条指向具体章节 | 通过（109 行） |
| 2 | API 总表每个接口关联 ≥1 需求与 ≥1 验收 | 通过（13/13） |
| 3 | UI 主要组件/交互关联需求与验收 | 通过（6 处追踪） |
| 4 | DATABASE 每类读写操作关联需求、验收与 API | 通过（13/13） |
| 5 | 四文档 API 路径/字段名/错误码/状态/逻辑键/超时一致 | 通过 |
| 6 | 关键词分类仅作差距/禁止项/目标边界 | 通过 |
| 7 | 文档状态均 `DRAFT_PENDING_USER_REVIEW`，需求/验收 `APPROVED`，实现 `NOT_STARTED` | 通过（四文档元数据逐项一致） |
| 8 | 106 条验收用例仍 `NOT_RUN`；已批准源文件无 diff | 通过（REQUIREMENTS/ACCEPTANCE diff=0） |
| 9 | `git diff --check` 通过 | 通过（EXIT=0） |
| 10 | 实际变更只有 5 个授权文件 | 通过（4 个新增设计文件 + 本报告） |

---

## 11. Commit/Push/远端同步结果

- 精确暂存 5 个授权文件（不使用 `git add .` / `git add -A`）。
- Commit Message（按任务建议）：`docs(data-source-management): establish design baseline draft [DATA-SOURCE-DESIGN-BASELINE-001]`。
- 普通非强制推送 `git push origin develop`。
- 推送后核验：`HEAD == origin/develop == git ls-remote origin refs/heads/develop`；ahead/behind 为 `0 0`；提交仅含 5 个授权文件；无关工作区内容原样保留。
- 最终 `result_commit_id`、`remote_commit_id` 与 `push_status` 见控制台结果块。

---

## 12. 下一步

下一步仅为 `CHATGPT_REVIEW_DESIGN_BASELINE`。任务成功提交并核验后立即停止，等待 ChatGPT 从远端 Git 复审四份设计草案后再决定后续。

本任务未宣布 Feature 已设计批准、已实现、已构建、已验收或已生产可用。
