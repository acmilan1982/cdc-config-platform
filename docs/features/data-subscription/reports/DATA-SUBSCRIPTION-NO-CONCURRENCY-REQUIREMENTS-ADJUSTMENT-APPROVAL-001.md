# 取消并发保护需求调整批准收口报告

- 任务编号：`DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001`
- 报告日期：2026-08-31
- 基准提交：`43a909773aec63fe8c4de2957074f113910f4686`
- 批准依据：ChatGPT 对结果提交 `43a909773aec63fe8c4de2957074f113910f4686` 的正式复审 `APPROVED`
- 任务类型：项目负责人批准驱动的纯文档需求/验收调整批准收口（不涉及任何业务代码、测试代码、数据库或外部系统操作）

---

## 1. 任务目的与批准范围

本任务对"取消并发保护"需求/验收调整进行批准收口。该调整此前已完成草案（`DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001`）与 R1 定向修订（`DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1`），ChatGPT 对 R1 结果提交 `43a9097...` 返回正式复审 `APPROVED`。

本任务范围仅为：

- 将 `docs/features/data-subscription/REQUIREMENTS.md` 文档状态与说明更新为 `APPROVED`；
- 将 `docs/features/data-subscription/ACCEPTANCE.md` 文档状态与依据需求状态更新为 `APPROVED`；
- 同步更新 Feature 索引 `docs/features/README.md`（仅 `data-subscription` 行与一条变更记录）；
- 新增本批准收口报告。

本任务不执行设计 R3，不修改任何设计文档，不修改任何需求/验收业务行、验收步骤、预期结果或需求映射，不把设计状态改为 `APPROVED`，不把实现状态改为已实现，不把任何验收用例改为 `PASS/FAIL/BLOCKED`，不实现功能。

## 2. 批准依据

ChatGPT 对 R1 定向修订结果提交 `43a909773aec63fe8c4de2957074f113910f4686` 的正式复审结论为 `APPROVED`。

前序 R1 定向修订（`DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1`）解决了两项问题：

1. 修正 `DSUB-AC-048` 中"删除仍按既定物理删除、二次确认和并发保护规则执行"残留表述，改为不包含并发保护的物理删除与二次确认规则；
2. 修正原调整报告 §8 对三类数据源 ID 查询语义的错误描述（普通不含逗号 ID 完整 token 字面精确匹配 / 仅含句点不含逗号 ID 完整 token 字面精确匹配 / 含逗号 ID 历史兼容可能匹配 + `queryWarnings` 歧义警告）。

批准历史链保留：上一正式批准版本为"含逗号数据源 ID 查询兼容"版本（批准依据提交 `5d5b5f4606da14f160e9db43068f114d35501db8`）；更早"英文句点 `.` 保留分隔符"批准版本（批准依据提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a`）作为历史事实保留。

## 3. 基准提交和开始前 Git 状态

- 分支：`develop`
- 基准提交：`43a909773aec63fe8c4de2957074f113910f4686`（R1 结果提交）
- 本地 HEAD 与远程 `origin/develop` 一致，ahead/behind 为 `0 0`
- 任务开始前工作区存在与本任务无关的既有修改（`.claude/settings.local.json`、`agent-env.sh`、`docs/database/` 三份删除、`frontend/` 七个文件等）以及大量未跟踪文档，均保持原样，不清理、不回滚、不覆盖、不提交。

## 4. 授权范围与实际修改文件

授权文件（共 4 个）：

1. `docs/features/data-subscription/REQUIREMENTS.md`
2. `docs/features/data-subscription/ACCEPTANCE.md`
3. `docs/features/README.md`
4. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001.md`（本报告，新增）

实际修改/新增文件与授权范围完全一致；提交暂存区仅包含上述 4 个文件。

## 5. 当前正式批准的取消并发保护业务规则

以下规则已成为正式需求基线（`DSUB-REQ-097/098/099/103` 逐字保持，本节为规则说明）：

- 编辑打开接口不生成、不返回版本令牌、内容指纹或等效快照标识；页面编辑保存请求也不携带此类字段。
- 编辑保存不加行锁，不比较打开时与保存时的记录内容；完成现有业务校验后按 `DATA_SUB_ID` 普通更新；多个页面用户或人工数据库操作交叉发生时不提供并发冲突检测，最后一次成功写入的内容生效。
- 不使用 `UPDATE_TIME` 或其他字段进行并发判断；不提供"记录已被他人或人工数据库操作修改"的识别、拒绝覆盖或刷新重试机制；页面打开期间的数据与最终写入之间不提供快照一致性保证。
- 删除为按 `DATA_SUB_ID` 主键执行物理删除；删除确认信息可通过普通只读读取获得，但不锁行、不返回或回传版本令牌；用户确认后直接按 `DATA_SUB_ID` 主键物理删除，不检查预览后记录是否发生变化；记录不存在仍按 `DSUB-REQ-104` 处理。
- 取消并发保护是明确批准的产品边界，不得重新解读为乐观锁、悲观锁、ETag、幂等键或数据库触发器。

## 6. 明确保留的非并发业务规则

本调整只取消并发保护，以下既有规则保持不变：

- 必填校验；
- 数据源与源表有效性校验；
- 多源库异常限制（只允许正常单源库记录删除；多源库异常记录无删除入口）；
- 物理删除与删除前二次确认（展示订阅描述、源库、Schema 数、源表数量、目标库、"数据库记录物理删除且无法恢复"提示、"当前运行中的同步任务不会立即停止，需要重启相关 sync-client 后生效"说明）；
- 更新/删除受影响行数检查与记录不存在处理（`DSUB-REQ-104`）；
- 重启 `sync-client` 后生效等原有规则。

## 7. 需求状态由草案转为 `APPROVED`

`docs/features/data-subscription/REQUIREMENTS.md` 文档状态由 `DRAFT_PENDING_USER_REVIEW` 更新为 `APPROVED`：

当前正式批准需求版本为"取消并发保护"需求调整版本，已获得 ChatGPT 对结果提交 `43a9097...` 的正式复审 `APPROVED`。说明段落相应更新：取消并发保护规则正式成为当前需求基线。需求批准不代表设计批准、功能实现或验收通过。

107 条需求（`DSUB-REQ-001～107`）编号连续唯一；业务行相对基准 `43a9097...` 逐行零变化。

## 8. 验收标准状态由草案转为 `APPROVED`

`docs/features/data-subscription/ACCEPTANCE.md` 文档状态与依据需求状态均由 `DRAFT_PENDING_USER_REVIEW` 更新为 `APPROVED`：

当前正式批准验收标准版本为"取消并发保护"验收标准调整版本，已获得 ChatGPT 对 R1 结果提交 `43a9097...` 的正式复审 `APPROVED`；当前批准的是验收标准基线，不是验收执行结果。126 条验收用例（`DSUB-AC-001～126`）编号连续唯一，状态全部保持 `NOT_RUN`。

## 9. 107 条需求业务行零变化

相对基准提交 `43a9097...`，107 条需求业务行逐行零变化（仅元数据行、状态行、说明段落与 §19 变更记录更新）。

## 10. 126 条验收业务行和映射零变化，全部 `NOT_RUN`

相对基准提交 `43a9097...`：

- 126 条验收业务行、步骤、预期结果与验收→需求映射逐行零变化；
- 126 条验收全部为 `NOT_RUN`，非 `NOT_RUN` 数量为 0；
- 验收→需求映射无悬空，107 条需求均有验收覆盖；
- `DSUB-AC-048/107/108/109/110/114/117` 逐字保持；
- 未把任何验收用例改为 `PASS/FAIL/BLOCKED`。

## 11. REQUIREMENTS/ACCEPTANCE 批准不等于功能实现或验收执行通过

需求与验收标准文档批准仅表示需求基线与验收标准基线正式生效，不代表：

- 功能已实现（前端仍为占位，实现状态仍为 `NOT_STARTED`）；
- 设计已批准（四份设计文档仍为 `DRAFT_PENDING_USER_REVIEW`，设计复审仍为 `CHANGES_REQUIRED`）；
- 验收已执行或已通过（126 条验收用例全部 `NOT_RUN`）。

## 12. 四份设计文档零 diff，设计仍为 `DRAFT_PENDING_USER_REVIEW / CHANGES_REQUIRED`

`docs/features/data-subscription/DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md` 相对基准提交 `43a9097...` 零 diff：

- 文档状态仍为 `DRAFT_PENDING_USER_REVIEW`；
- 设计复审结论仍为 `CHANGES_REQUIRED`；
- 本任务未把设计状态改为 `APPROVED`，未提前执行设计 R3。

## 13. 设计 R3 的明确输入

设计 R3（后续独立任务，本任务不实施）将统一处理：

1. 从 DESIGN/API/UI/DATABASE 删除 `versionToken`、`DSUB-FP-V1`、黄金向量、`SELECT ... FOR UPDATE`、并发字段比较、`40910 CONCURRENT_MODIFIED` 及相关提示；
2. 编辑保存改为完成既有业务校验后按 `DATA_SUB_ID` 普通更新；
3. 删除预览保留普通只读确认信息，不返回令牌；
4. 删除确认后按 `DATA_SUB_ID` 普通物理删除；
5. 保留更新/删除受影响行数检查和记录不存在处理；
6. 多源库异常判定统一为：逗号拆分 → trim → 丢弃空 token → 非空 token 数量至少 2；
7. CSV 查询匹配和异常判定统一处理：`NULL/空白 → 空 token 集合 → 不匹配/非多源库异常`。

## 14. 实现仍为 `NOT_STARTED`

数据订阅功能实现状态仍为 `NOT_STARTED`；前端实现目录仍为 `views/data-subscribe/`，路由 `/config/subscribe`，菜单及代码包名零修改；业务代码、测试代码零 diff。

## 15. 大屏延期状态继续保持

大屏调整状态继续保持在 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`；本任务未顺手处理大屏或其他 Feature。

## 16. 数据库、DDL/DML、代码、测试、外部系统均未操作

- 未访问数据库，未执行任何 DDL/DML；
- 未操作 ZooKeeper、Kafka、sync-client 或业务进程；
- 未修改任何业务代码或测试代码；
- 未运行 Maven、npm、前后端测试，未启动任何服务；
- 未修改数据库基线或项目级正式基线。

## 17. 强制验证结果

按授权提示词 §10 的 27 项强制验证全部通过：

- REQUIREMENTS 文档状态 `APPROVED`；ACCEPTANCE 文档状态与依据需求状态 `APPROVED`；
- `DSUB-REQ-001～107` 恰好 107 条连续唯一，业务行零变化；`DSUB-AC-001～126` 恰好 126 条连续唯一，业务行与映射零变化，全部 `NOT_RUN`（非 `NOT_RUN` 数量 0），无悬空映射；
- `DSUB-REQ-097/098/099/103`、`DSUB-AC-048/107/108/109/110/114/117` 逐字保持；
- 文档仍明确无版本令牌、无指纹、无行锁、无并发字段比较、无 `40910`；仍明确最后一次成功写入生效，以及删除按主键直接物理删除；
- 前序调整报告、R1 报告、四份设计文档相对基准零 diff；设计仍为 `DRAFT_PENDING_USER_REVIEW / CHANGES_REQUIRED`；
- 实现状态 `NOT_STARTED`；Feature 索引仅修改 `data-subscription` 行并追加一条变更记录；
- 大屏延期状态 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`；
- 前端目录、路由、菜单、代码包名零修改；业务代码、测试代码、数据库基线、项目级基线零 diff；
- 未访问数据库、未执行 DDL/DML、未操作 ZooKeeper/Kafka/sync-client/业务进程；未运行 Maven/npm/测试，未启动服务；
- 无密码、Token、完整连接串或其他敏感信息；`git diff --check` 通过；
- 相对基准文件变化只包含 4 个授权文件；提交暂存区只包含 4 个授权文件；
- 任务开始前既有无关修改原样保留。

## 18. Git 提交与推送结果

本报告创建时尚未预填本任务自身的提交号，避免制造额外提交链。本任务真实的提交与推送结果（result commit、remote commit、ahead/behind）以 Agent 控制台结果块为准。

- 提交范围：4 个授权文件，逐文件暂存；
- 提交方式：普通提交，禁止 force push；
- 推送目标：`origin/develop`；
- 推送后核验本地 HEAD、远端跟踪分支与远程 develop 一致，ahead/behind 为 `0 0`；
- 任务前既有无关修改仍原样存在且未进入提交。

---

## 下一阶段

本任务成功并经后续结果核验后，唯一下一入口为：

`DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R3`

设计 R3 完成后仍需再次由 ChatGPT 正式复审，设计获得正式批准后才能进入功能实现阶段。

本报告不声称设计 R3 已完成、设计已批准、功能已实现或 126 条验收已通过。
