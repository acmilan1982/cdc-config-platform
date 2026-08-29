# 中心端配置 API 契约设计（API）

## 1. 文档元数据与状态

| 项目 | 值 |
|---|---|
| 正式功能标识 | `server-config` |
| 目标文档 | `docs/features/server-config/API.md` |
| 文档状态 | `APPROVED` |
| 需求基线状态 | `APPROVED`（原已批准，本次调整已批准） |
| 验收基线状态 | `APPROVED`（原已批准，本次调整已批准） |
| 实现状态 | `IMPLEMENTED_ACCEPTED`（旧批准契约与本次两项已批准调整均已实现并验收接受，见 §11 变更记录） |
| 验收用例状态/正式验收状态 | `66 PASSED / 0 FAILED（ACCEPTED）` |
| 收口任务 | `SERVER-CONFIG-FORMAL-ACCEPTANCE-CLOSEOUT-001` |
| 收口日期 | 2026-08-29 |
| 验收证据提交 | `b5aeec28eaf29e20a56dd7012e4077dee8b891a4` |
| 项目负责人最终人工测试 | 保存、刷新、恢复均正常 |
| PENDING_USER_CONFIRMATION | 0 |
| 设计任务 | `SERVER-CONFIG-DESIGN-BASELINE-001` |
| 授权基线提交 | `c1a6d7dc38de261093383d7abf719f0834dd9bb3` |
| R1 修订任务 | `SERVER-CONFIG-DESIGN-BASELINE-001-R1` |
| R1 授权基线提交 | `53d74c19e31c4068963e7b3c50c12073e9ebad8f` |
| R2 修订任务 | `SERVER-CONFIG-DESIGN-BASELINE-001-R2` |
| R2 授权基线提交 | `8f8e1182896bdb71d52516a1f441ae611845b359` |
| 批准任务 | `SERVER-CONFIG-DESIGN-BASELINE-APPROVAL-001` |
| 批准日期 | 2026-08-27 |
| 批准人 | 项目负责人 |
| ChatGPT 复审通过提交 | `77a8c639911bee78a17f62d2ce8af2db53c44d29` |
| 依据需求 | `docs/features/server-config/REQUIREMENTS.md`（已批准） |
| 关联契约 | `docs/features/server-config/DESIGN.md`、`UI.md`、`DATABASE.md`（同一接口路径、字段与错误码） |
| 创建日期 | 2026-08-27 |
| 候选调整任务 | `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001` |
| 候选调整授权基线提交 | `c0b9d4973e2b6bdd3e7b02a3748816ffc55362ba` |
| 候选调整批准任务 | `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001` |
| 候选调整批准日期 | 2026-08-28 |
| 候选调整批准人 | 项目负责人 |
| ChatGPT 最终复审通过提交 | `b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee` |

声明：本文档原为**已批准 API 契约设计**（批准任务 `SERVER-CONFIG-DESIGN-BASELINE-APPROVAL-001`，批准日期 2026-08-27，批准人=项目负责人）。旧批准契约已实现并经过 R1/R2 复审（实现审查基线 `24d8b80340cc691895bed8bc45a4cb2dc2c6b9b6`）。本次为负责人在正式验收前提出的两项候选调整（`configDesc` 原样返回与真实换行传输语义、`items` 按 `ID_SERVER_CONFIG ASC` 返回），已获项目负责人批准（批准任务 `SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001`，批准日期 2026-08-28，ChatGPT 最终复审通过提交 `b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee`）。当前有效状态：文档状态为 `APPROVED`，实现状态为 `IMPLEMENTED_ACCEPTED`（旧批准契约、两项已批准调整及后续显示缺陷修复均已实现并验收接受），正式验收 `66 PASSED / 0 FAILED / 0 BLOCKED / 0 NOT_RUN`，正式验收状态 `ACCEPTED`（2026-08-29 收口，收口任务 `SERVER-CONFIG-FORMAL-ACCEPTANCE-CLOSEOUT-001`）。设计批准不等于实现完成，也不等于验收执行或 PASS，但本 Feature 已完成正式验收收口。本文档保持接口最少化，唯一确定两套接口，不保留多套备选方案。

## 2. 设计依据与追踪方式

| 编号 | 规则 |
|---|---|
| SC-API-001 | 本文业务规则以已批准 `REQUIREMENTS.md` 为唯一来源，通过需求编号引用建立追踪关系；接口字段到数据库字段、需求与验收用例的映射见 §10。 |
| SC-API-002 | 只允许查询 `CDC_SERVER`、查询并修改 `CDC_SERVER_CONFIG`；只修改既有记录的 `CONFIG_VALUE`，禁止新增、删除与修改其他字段（`SC-NFR-07`、`SC-NONGOAL-01~03`）。 |
| SC-API-003 | `CONFIG_KEY`、`CONFIG_DESC`、`SERVER_ID`、`ID_SERVER_CONFIG`、`IS_EDITABLE` 均不可通过接口修改（`SC-NFR-07`）。 |
| SC-API-004 | 接口不做并发保护、不提供业务幂等键；重复合法请求按“最后一次成功保存生效”处理（`SC-BATCH-07/08`）。 |

## 3. 总体约定

| 编号 | 规则 |
|---|---|
| SC-API-010 | URL 风格沿用项目现有 `/api/<feature>` 方式（如 `/api/data-sources`、`/api/log-query`、`/api/job-failure`），本功能统一使用 `/api/server-config` 前缀。 |
| SC-API-011 | 所有接口使用项目统一响应体 `ApiResponse<T>`：`{ code: int, message: String, data: T, timestamp: String }`；成功 `code=200`、`message="success"`。 |
| SC-API-012 | 业务错误一律通过 `BusinessException` 抛出，由 `GlobalExceptionHandler` 映射为 HTTP 200 + `ApiResponse.fail(code, message)`（项目既有 `DataSourceErrorCode`、`JobFailureErrorCode`、`LogQueryErrorCode` 相同风格）。 |
| SC-API-013 | 参数绑定、类型错误、`@Valid` 校验失败由 `GlobalExceptionHandler` 映射为 HTTP 400；未捕获异常映射为 HTTP 500，`message="服务器内部错误"`。 |
| SC-API-014 | 项目 `spring.jackson.default-property-inclusion=non_null`：JSON 输出默认省略 null 字段；空值字段以“字段缺失”形式出现，前端必须把缺失字段等同于 null 处理。 |
| SC-API-015 | `ID_SERVER_CONFIG`、`SERVER_ID` 均为字符串（数据库 `VARCHAR2(32)`），全程按字符串序列化与处理，不得转数值、不得丢失前导/尾部字符（`SC-API-031`）。 |
| SC-API-016 | 页面可识别的中心端状态通过**独立业务错误码**表达（`40210`/`40211`），不得仅依赖中文 message 猜测状态；正常空配置通过 `code=200` + `configCount=0` + 空 `items` 表达，与中心端异常明确区分（`SC-SERVER-03~05`、`SC-AC-014~016`）。 |

## 4. 接口清单

| 编号 | 方法 | URL | 用途 |
|---|---|---|---|
| SC-API-020 | GET | `/api/server-config` | 查询中心端配置页面数据（唯一中心端 + 全部配置 + 可编辑判定） |
| SC-API-040 | POST | `/api/server-config/save` | 批量保存既有配置记录的 `CONFIG_VALUE` |

设计决策（单一方案，不保留多选）：

| 编号 | 规则 |
|---|---|
| SC-API-021 | 查询接口唯一确定为 `GET /api/server-config`，无请求参数、无中心端选择参数（`SC-SERVER-01`）。理由：纯只读查询、无查询串参数，GET 语义清晰；与项目数据源列表 `GET /api/data-sources` 风格一致。 |
| SC-API-022 | 批量保存唯一确定为 `POST /api/server-config/save`。理由：动作型批量更新（无资源主键在路径中、一次涉及多条既有记录），沿用仓库 `POST /api/log-query/logs/search` 承载请求体的做法，避免 GET 查询串承载结构化批量载荷；`PUT` 语义对应整资源替换且需要资源路径主键，不适用于批量局部字段更新，故不使用 PUT。 |

## 5. 查询接口 `GET /api/server-config`

### 5.1 请求

无请求参数；无中心端选择器（页面与接口均不提供中心端选择能力，`SC-SERVER-01`）。

### 5.2 响应 `data`：`ServerConfigPageVO`

| 编号 | 字段 | 类型 | 必填 | 说明 | 来源 |
|---|---|---|---|---|---|
| SC-API-023 | `serverId` | String | 是 | 唯一中心端 `SERVER_ID`（字符串） | `CDC_SERVER.SERVER_ID` |
| SC-API-024 | `configCount` | int | 是 | 配置项总数（与 `items.length` 一致） | `CDC_SERVER_CONFIG` 计数 |
| SC-API-025 | `items` | `ServerConfigItemVO[]` | 是 | 全部配置项，按 `ID_SERVER_CONFIG` 升序返回 | 见下 |

### 5.3 `ServerConfigItemVO`

| 编号 | 字段 | 类型 | 必填 | 说明 | 来源 |
|---|---|---|---|---|---|
| SC-API-026 | `idServerConfig` | String | 是 | 配置记录主键（保存时回传） | `CDC_SERVER_CONFIG.ID_SERVER_CONFIG` |
| SC-API-027 | `configKey` | String | 否 | 配置 Key（可 NULL/空），用于 Key Tooltip 与白名单判定；不再承担排序职责 | `CONFIG_KEY` |
| SC-API-028 | `configDesc` | String | 否 | 配置项说明原始值（可 NULL/空/纯空格/含真实换行），原样返回；前端按兜底规则计算显示名称 | `CONFIG_DESC` |
| SC-API-029 | `configValue` | String | 否 | 当前配置值（可 NULL/空/非法），完整返回，不脱敏、不掩码 | `CONFIG_VALUE` |
| SC-API-030 | `editable` | boolean | 是 | **计算可编辑布尔** = 数据库 `IS_EDITABLE` 规范值精确为 `'1'` 且 `CONFIG_KEY` 属于可编辑白名单（`SC-EDIT-01`） | 应用层计算 |

| 编号 | 规则 |
|---|---|
| SC-API-031 | `idServerConfig`、`serverId` 均为字符串，`spring.jackson.default-property-inclusion=non_null` 不影响非 null 主键；前端不得把主键转数值。 |
| SC-API-032 | **不返回原始 `IS_EDITABLE`**。`editable` 是计算后的布尔值，**只用于前端控件形态判定**（是否渲染编辑控件），不是可编辑证明；后端保存时仍按主键重新读取数据库真实记录并独立重新校验（`SC-EDIT-05`、`SC-NFR-01`）。页面任何位置不得把 `editable` 或 `IS_EDITABLE` 展示为“是否可编辑”列（`SC-UI-07`）。 |
| SC-API-033 | `configCount` 与 `items` 为空是“正常空配置”（`code=200`），前端进入空状态；0/多中心端由错误码 `40210`/`40211` 表达，前端不得把 `configCount=0` 当作中心端异常（`SC-AC-016`）。 |
| SC-API-034 | `items` 排序由后端执行：`ORDER BY ID_SERVER_CONFIG ASC`（按数据库字段自身的字符串排序语义升序，不做数值转换，保证多次查询结果顺序确定不变）；前端不重新排序，不按 `CONFIG_KEY` 或其他字段二次排序（`SC-DISPLAY-02`）。 |
| SC-API-035 | 接口一次返回全部配置（小表全量，无分页、无筛选、无搜索参数），符合 `SC-NFR-08`、`SC-NONGOAL-09`。 |
| SC-API-036 | `configDesc` 为 `CONFIG_DESC` 原样返回字段：真实换行字符通过 JSON 标准转义（如 `\n`）在线路上传输，客户端 JSON 解析后仍是换行字符；后端不做 HTML 解析、不做换行替换或规范化。本语义是 HTTP JSON 响应字段 `configDesc` 的传输契约，不是某个 `CONFIG_VALUE` 的格式协议。 |

## 6. 批量保存接口 `POST /api/server-config/save`

### 6.1 请求体：`ServerConfigSaveRequest`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `items` | `ServerConfigSaveItem[]` | 是 | 非空、去重、条数 ≤ 200 |

`ServerConfigSaveItem`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `idServerConfig` | String | 是 | 既有记录主键（非空、≤32 字符、字符串） |
| `configValue` | String | 是 | 新配置值（必须为 JSON 字符串；缺失/null → `40224`、非字符串类型 → `40226`，提交后按 `SC-API-052` 顺序校验：trim 非空、≤64、符合 Key 专门规则） |

| 编号 | 规则 |
|---|---|
| SC-API-041 | 批量条数上限固定为 `200`（`MAX_BATCH_SIZE`）；当前开发库 8 行，200 为防御性上限，防止超长载荷。超出返回 `ITEM_COUNT_EXCEEDED`（`40221`）。 |
| SC-API-042 | 请求只携带顶层 `items`（每个 item 仅 `idServerConfig` + `configValue`）；**禁止携带并信任** `CONFIG_KEY`、`CONFIG_DESC`、原值、`IS_EDITABLE`、`SERVER_ID`（`SC-BATCH-01`）。若请求出现这些不允许的额外字段（顶层或 item 级），后端**整批拒绝**并返回 `REQUEST_FIELD_NOT_ALLOWED`（`40227`），不做部分保存、不以客户端声明的 Key/可编辑状态/归属作为判定依据（`SC-AC-056`、`SC-API-055/057`）。 |
| SC-API-043 | 主键为字符串；`idServerConfig` 缺失、JSON null、空白、长度超过 32 或非 JSON 字符串（数字/布尔等，不隐式转换）→ `ID_INVALID`（`40223`）。 |
| SC-API-044 | 请求 `items` 缺失/NULL/空数组 → `BATCH_EMPTY`（`40220`）（`SC-API-056`）；包含重复主键 → `DUPLICATE_ID`（`40222`）。 |
| SC-API-050 | 请求体契约检查由本 Feature 自带的严格反序列化器完成（Request/Item DTO `@JsonAnySetter` 收集未知字段，或等价的 Feature 局部 `JsonNode` 预校验），在进入业务校验前校验结构（顶层 JSON object、`items` 为 JSON array、元素为 JSON object）与字段类型：顶层/元素结构错误统一映射 HTTP 400 + `ApiResponse.fail(400, "请求格式错误")`（不得被全局兜底异常处理映射成 HTTP 500），未知/额外字段即**整批拒绝** `REQUEST_FIELD_NOT_ALLOWED`（`40227`）；全局 `spring.jackson.default-property-inclusion=non_null` 只影响序列化输出，不影响反序列化契约；如实现需补充 `HttpMessageNotReadableException` 精确映射，只限定本 Feature 影响范围与返回契约，不修改全局 Jackson 宽松策略（结构/类型契约见 `SC-API-051/055~057`）。 |
| SC-API-051 | 反序列化契约的合法请求体结构：顶层必须是 JSON object，只允许字段 `items`；`items` 必须是 JSON array，其元素必须是 JSON object；每个 item 只允许 `idServerConfig`、`configValue` 两个字段，且这两个字段均必须是 JSON 字符串类型（`VALUE_STRING`）。数字、布尔等非字符串值一律按类型不匹配处理，不允许隐式转换为字符串后继续查询/保存。 |
| SC-API-052 | `configValue` 校验顺序固定为：① 缺失或 JSON null（则 `VALUE_EMPTY` `40224`）→ ② 非 JSON 字符串类型（数字/布尔等，则 `VALUE_FORMAT_INVALID` `40226`，不允许隐式转字符串）→ ③ trim 后非空（否则 `VALUE_EMPTY` `40224`）→ ④ **原样提交长度**（未 trim 前）≤ 64（否则 `VALUE_LENGTH_EXCEEDED` `40225`）→ ⑤ 按 Key 专门规则解析/规范化/领域校验（否则 `VALUE_FORMAT_INVALID` `40226`）→ ⑥ 规范化后最终值非空且 ≤ 64；任一步失败即该条失败，整批拒绝，禁止部分成功。 |
| SC-API-055 | 顶层请求体必须是 JSON object，顶层只允许字段 `items`；出现 `items` 之外的其他字段 → **整批拒绝** `REQUEST_FIELD_NOT_ALLOWED`（`40227`），不进入数据库处理。 |
| SC-API-056 | `items` 必须是 JSON array：缺失、JSON null 或空数组 → `BATCH_EMPTY`（`40220`）；非数组类型（object/字符串/数字/布尔）→ 请求体结构错误，HTTP 400 + `ApiResponse.fail(400, "请求格式错误")`，不进入数据库处理。 |
| SC-API-057 | `items` 每个元素必须是 JSON object：元素为 null、字符串、数字、数组等非对象 → 请求体结构错误，HTTP 400 + `ApiResponse.fail(400, "请求格式错误")`，不进入数据库处理；每个 item 只允许 `idServerConfig`、`configValue`，出现其他字段 → **整批拒绝** `40227`。 |

### 6.2 后端处理顺序（全部在一个事务内，`SC-DESIGN-057/058`、`SC-DB-070~076`）

1. HTTP/参数层：请求体结构契约与严格反序列化（顶层 JSON object 且仅 `items`、`items` 为 JSON array、元素为 JSON object、item 仅 `idServerConfig` + `configValue` 且均为 JSON 字符串；顶层/元素结构错误 HTTP 400 + `ApiResponse.fail(400, "请求格式错误")`，额外字段整批拒绝 `40227`，`SC-API-050/051/055~057`）；`items` 非空、条数 ≤ 200、无重复主键、主键格式（`SC-API-041~044`、`SC-API-042` 含 `40227`）。
2. 重新识别唯一中心端：`CDC_SERVER` 0 条 → `SERVER_NOT_REGISTERED`（`40210`）；>1 条 → `SERVER_MULTIPLE`（`40211`）；恰 1 条 → 继续（`SC-SERVER-01~04`）。
3. 逐条按主键重读真实记录：不存在 → `CONFIG_RECORD_NOT_FOUND`（`40420`）；归属不是唯一中心端 → `SERVER_BELONGING_MISMATCH`（`40423`）；`IS_EDITABLE` 精确非 `'1'` → `CONFIG_NOT_EDITABLE`（`40421`）；Key 不在白名单 → `CONFIG_KEY_NOT_SUPPORTED`（`40422`）。
4. 逐条值校验，顺序固定：缺失/JSON null（`VALUE_EMPTY` `40224`）→ 非 JSON 字符串类型（`VALUE_FORMAT_INVALID` `40226`）→ trim 后非空（`VALUE_EMPTY` `40224`）→ 原样提交长度 ≤ 64（`VALUE_LENGTH_EXCEEDED` `40225`）→ 符合该 Key 专门规则（含多选规范化）（`VALUE_FORMAT_INVALID` `40226`）→ 规范化后最终值非空且 ≤ 64（`SC-API-052`）。
5. 任一记录任一环节失败 → 抛 `BusinessException` → **整批回滚**，禁止部分成功（`SC-BATCH-06`）。

| 编号 | 规则 |
|---|---|
| SC-API-045 | 更新使用按主键 `UPDATE`，`WHERE ID_SERVER_CONFIG = ?`；逐条校验更新行数恰为 1，不符即回滚（`SC-DB-092`、`SC-AC-058`）。 |
| SC-API-046 | 多选值在后端保存前规范化（trim→小写→去重→固定顺序 `doris,oracle,mysql` 子序列→逗号连接），与前端一致（`SC-CFG-DBTYPE-04~09`）。 |
| SC-API-047 | 不做并发保护：不使用旧值、版本号、时间戳或原值作为更新条件；以本次合法提交值覆盖数据库当时值（`SC-BATCH-07/08`、`SC-AC-059`）。 |
| SC-API-053 | 数据库异常映射唯一确定：**保存**过程抛出的数据库异常一律转译为运行时 `BusinessException` 并回滚，最终返回 `SAVE_FAILED`（`50030`）；**查询**过程抛出的数据库异常不转译业务码，由 `GlobalExceptionHandler` 按未捕获异常映射为 HTTP 500、`code=500`、`message="服务器内部错误"`，前端进入 `LOAD_FAILED`。本 Feature 不新增 `DATABASE_ACCESS_FAILED` 风格错误码，不提供“或”选项（`SC-DB-111/112`）。 |

### 6.3 成功响应

| 编号 | 规则 |
|---|---|
| SC-API-048 | 全部成功 → `ApiResponse.success()`（`code=200`、`data=null`）；前端提示成功后重新调用 `GET /api/server-config` 重载，重新加载结果成为新的原始值（`SC-STATE-01`、`SC-AC-060`）。 |
| SC-API-049 | 失败 → 不返回部分成功列表；统一为对应业务错误码 + 可理解 message，数据库整批回滚（`SC-STATE-02`、`SC-AC-058/061`）。 |
| SC-API-054 | 保存成功后重新加载查询失败 → 前端进入独立状态 `SAVE_SUCCEEDED_RELOAD_FAILED`（“保存成功，但最新配置加载失败，请重试加载”），仅提供“重试加载”按钮（仅 GET 查询，不发保存），重试成功后以最新加载结果重建原值（`DESIGN.md` `SC-DESIGN-067`、`UI.md` `SC-UI-DESIGN-084`）。 |

## 7. 专用错误码表

码值不与仓库既有码冲突（既有码：`40001~40007`、`40010~40017`、`40400~40403`、`40410`、`40900~40901`、`50000~50002`、`50010`、`50020~50021`）。

| 编号 | 错误码 | 常量名 | HTTP | 分类 | message |
|---|---|---|---|---|---|
| SC-API-060 | `40210` | `SERVER_NOT_REGISTERED` | 200 | 页面可识别状态 | 中心端尚未注册，请先启动 sync-server |
| SC-API-061 | `40211` | `SERVER_MULTIPLE_FOUND` | 200 | 页面可识别状态 | 检测到多个中心端，当前功能仅支持唯一中心端 |
| SC-API-062 | `40220` | `BATCH_EMPTY` | 200 | 参数错误 | 批量保存请求不能为空 |
| SC-API-063 | `40221` | `ITEM_COUNT_EXCEEDED` | 200 | 参数错误 | 批量保存记录数超过上限 200 |
| SC-API-064 | `40222` | `DUPLICATE_ID` | 200 | 参数错误 | 批量请求包含重复主键 |
| SC-API-065 | `40223` | `ID_INVALID` | 200 | 参数错误 | 配置记录主键为空或格式非法 |
| SC-API-066 | `40224` | `VALUE_EMPTY` | 200 | 参数错误 | 配置值为空 |
| SC-API-067 | `40225` | `VALUE_LENGTH_EXCEEDED` | 200 | 参数错误 | 配置值超过 64 字符上限 |
| SC-API-068 | `40226` | `VALUE_FORMAT_INVALID` | 200 | 参数错误 | 配置值不符合该配置项的专门规则 |
| SC-API-069 | `40420` | `CONFIG_RECORD_NOT_FOUND` | 200 | 业务拒绝 | 配置记录不存在 |
| SC-API-070 | `40421` | `CONFIG_NOT_EDITABLE` | 200 | 业务拒绝 | 配置项不可编辑 |
| SC-API-071 | `40422` | `CONFIG_KEY_NOT_SUPPORTED` | 200 | 业务拒绝 | 配置Key不受支持 |
| SC-API-072 | `40423` | `SERVER_BELONGING_MISMATCH` | 200 | 业务拒绝 | 配置记录不属于唯一中心端 |
| SC-API-073 | `50030` | `SAVE_FAILED` | 200 | 服务器错误 | 保存失败，请稍后重试 |
| SC-API-076 | `40227` | `REQUEST_FIELD_NOT_ALLOWED` | 200 | 参数错误 | 批量保存请求包含不允许的字段 |

| 编号 | 规则 |
|---|---|
| SC-API-074 | 本 Feature 专用错误码共 **15 个**（`40210`、`40211`、`40220~40227`、`40420~40423`、`50030`）。`40210`/`40211` 是前端页面可识别状态（唯一中心端 0/多），页面据此进入 `SERVER_NOT_REGISTERED` / `SERVER_MULTIPLE` 状态；`400`-类错误（`40220~40227`）为参数/请求契约/值校验错误，其中 `40227` 专用于“批量保存请求包含不允许的字段”整批拒绝；`404`-类错误为记录级业务拒绝；`50030` 为服务器错误兜底，message 不泄露底层堆栈（`SC-NFR-02`）。 |
| SC-API-075 | 业务错误统一 HTTP 200 + 业务码（项目 `GlobalExceptionHandler` 约定）；前端以 `code` 而非 HTTP 状态或 message 字符串判断状态。 |

## 8. JSON 示例

### 8.1 正常有数据（`code=200`）

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "serverId": "Server001",
    "configCount": 2,
    "items": [
      { "idServerConfig": "00000000000000000000000000000001", "configKey": "auto-create-table", "configDesc": "自动建表", "configValue": "true", "editable": true },
      { "idServerConfig": "00000000000000000000000000000002", "configKey": "monitor-metric-topic-name", "configDesc": "监控指标Topic", "configValue": "cdc-metric", "editable": false }
    ]
  },
  "timestamp": "2026-08-27T10:00:00.000"
}
```

### 8.2 正常空配置（`code=200`，`items` 为空）

```json
{
  "code": 200,
  "message": "success",
  "data": { "serverId": "Server001", "configCount": 0, "items": [] },
  "timestamp": "2026-08-27T10:00:00.000"
}
```

### 8.3 0 中心端（页面可识别状态）

```json
{
  "code": 40210,
  "message": "中心端尚未注册，请先启动 sync-server",
  "data": null,
  "timestamp": "2026-08-27T10:00:00.000"
}
```

### 8.4 多中心端（页面可识别状态）

```json
{
  "code": 40211,
  "message": "检测到多个中心端，当前功能仅支持唯一中心端",
  "data": null,
  "timestamp": "2026-08-27T10:00:00.000"
}
```

### 8.5 合法批量保存请求

```json
{
  "items": [
    { "idServerConfig": "00000000000000000000000000000001", "configValue": "false" },
    { "idServerConfig": "00000000000000000000000000000004", "configValue": "doris,mysql" }
  ]
}
```

成功响应：

```json
{ "code": 200, "message": "success", "data": null, "timestamp": "2026-08-27T10:00:00.000" }
```

### 8.6 典型失败（非法值 → 整批拒绝）

```json
{
  "code": 40226,
  "message": "配置值不符合该配置项的专门规则",
  "data": null,
  "timestamp": "2026-08-27T10:00:00.000"
}
```

| 编号 | 规则 |
|---|---|
| SC-API-080 | 以上 JSON 为契约示意，字段名/类型以 §5/§6 为准；`timestamp` 为响应时间字符串，前端不依赖其业务含义。 |

## 9. 超时、防重复提交、重试与幂等语义

| 编号 | 规则 |
|---|---|
| SC-API-090 | 前端请求级超时覆盖全局默认值（全局 `http.ts` 默认 10 秒，不改全局默认值，同 `log-query` 做法）：查询接口 `GET /api/server-config` 请求级超时 `15000ms`；批量保存 `POST /api/server-config/save` 请求级超时 `30000ms`（事务批量更新不应被过早截断）。 |
| SC-API-091 | 前端**不自动重试**保存请求；保存失败/超时后由用户修改或重新点击“保存全部”才再次提交（`SC-STATE-02`、`SC-AC-061`）。 |
| SC-API-092 | 接口**不提供业务幂等键**，不维护幂等表；重复合法请求按“最后成功保存生效”语义自然收敛（`SC-BATCH-08`、`SC-AC-059`）。 |
| SC-API-093 | 防重复提交由前端在 `SAVING` 状态禁用按钮与编辑控件实现（`SC-DESIGN-104`、`UI.md`）；请求层不新增去重中间件。 |
| SC-API-094 | 查询失败允许用户主动重试（页面“重试”按钮），不自动轮询（`UI.md` `SC-UI-DESIGN-120~122`）。 |

## 10. API 字段到数据库字段、需求与验收用例的映射

| API 字段 | 数据库字段 | 读写属性 | 对应需求 | 验收用例 |
|---|---|---|---|---|
| `serverId` | `CDC_SERVER.SERVER_ID` | 读 | `SC-UI-01`、`SC-SERVER-02` | `SC-AC-004/013` |
| `items[].idServerConfig` | `CDC_SERVER_CONFIG.ID_SERVER_CONFIG` | 读 / 保存请求回传 | `SC-UI-06` | `SC-AC-006/051` |
| `items[].configKey` | `CONFIG_KEY` | 读（不可修改） | `SC-UI-15~17`、`SC-EDIT-01` | `SC-AC-009/022` |
| `items[].configDesc` | `CONFIG_DESC` | 读（不可修改） | `SC-UI-18~22` | `SC-AC-007/008` |
| `items[].configValue` | `CONFIG_VALUE` | 读 / 唯一可写字段 | `SC-NFR-03/07` | `SC-AC-062` |
| `items[].editable` | 计算（`IS_EDITABLE='1'` && Key ∈ 白名单） | 计算只读（控件形态） | `SC-EDIT-01` | `SC-AC-019~023`、`SC-AC-065` |
| 保存 `items[].idServerConfig` | `ID_SERVER_CONFIG` | 更新条件（`WHERE`） | `SC-BATCH-01` | `SC-AC-051/052~056` |
| 保存 `items[].configValue` | `CONFIG_VALUE` | 更新 | `SC-BATCH-01` | `SC-AC-051/057/058` |

| 编号 | 规则 |
|---|---|
| SC-API-100 | `CONFIG_DESC` 物理长度 1024、`CONFIG_KEY`/`CONFIG_VALUE` 物理长度 64、`ID_SERVER_CONFIG`/`SERVER_ID` 为 `VARCHAR2(32)`；上述字段全部保持字符串序列化，前端/后端均不按数值处理（`SC-API-015`、`SC-API-031`）。 |
| SC-API-101 | 接口只暴露本 Feature 需要的字段；不暴露数据库原始 `IS_EDITABLE`、其他未使用字段、表结构元数据或物理列全集。 |

编号策略：本文档编号按章节分组、预留区间编号（章节内递增），不要求全文连续；每条规则编号唯一、引用可解析（同一文档或跨文档引用均能在对应文档定位到具体规则），章节内相邻编号保持递增，全局不保证无空隙。

## 11. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-27 | 建立“中心端配置”Feature 候选 API 契约（DRAFT_PENDING_USER_REVIEW / NOT_STARTED） | SERVER-CONFIG-DESIGN-BASELINE-001（阶段 4 设计与契约；纯文档任务） |
| 2026-08-27 | R1 修订：批量保存出现不允许的额外字段一律**整批拒绝**并新增错误码 `40227`（`REQUEST_FIELD_NOT_ALLOWED`，专用错误码 14→15）；`items` 排序补充稳定次序 `ID_SERVER_CONFIG ASC`；JSON 示例主键改为 ≤32 字符；`configValue` 校验顺序与长度口径明确（原样提交长度 ≤64）；保存/查询数据库异常映射唯一化（不新增 `DATABASE_ACCESS_FAILED`）；新增 `SAVE_SUCCEEDED_RELOAD_FAILED` 状态；保持 DRAFT_PENDING_USER_REVIEW / NOT_STARTED | SERVER-CONFIG-DESIGN-BASELINE-001-R1（REQUIRES_CHANGES 修订；纯文档任务） |
| 2026-08-27 | R2 修订：修正 `SC-API-051` 请求体结构契约（`items` 为 JSON array、元素为 JSON object，仅 `idServerConfig`/`configValue` 为 JSON 字符串）；新增 `SC-API-055~057` 顶层 object/`items` array/item object 结构与类型唯一映射（非数组/非对象 → HTTP 400 + `code=400`，额外字段 → `40227`，`items` 缺失/null/空 → `40220`，`idServerConfig` 非字符串 → `40223`，`configValue` 非字符串 → `40226`）；`configValue` 校验顺序修正为先缺失/null 后非字符串类型；错误码总数保持 15；保持 DRAFT_PENDING_USER_REVIEW / NOT_STARTED | SERVER-CONFIG-DESIGN-BASELINE-001-R2（REQUIRES_ONE_MICRO_FIX 修订；纯文档任务） |
| 2026-08-27 | 批准：文档状态由 `DRAFT_PENDING_USER_REVIEW` 改为 `APPROVED`；记录批准任务、批准日期、批准人（项目负责人）与 ChatGPT 复审通过提交 `77a8c639...`；同步 `SC-API-052` 两处“否则→则”纯文字逻辑方向修正（ChatGPT R2 复审后确认：① 缺失或 JSON null 则 `VALUE_EMPTY` `40224`、② 非 JSON 字符串类型则 `VALUE_FORMAT_INVALID` `40226`，后续正向条件 trim 非空、原样长度 ≤64、符合 Key 专门规则仍保留“否则”）；设计批准不等于实现完成或验收执行；实现状态保持 `NOT_STARTED`，65 条验收保持 `NOT_RUN` | SERVER-CONFIG-DESIGN-BASELINE-APPROVAL-001（项目负责人批准驱动的设计基线收口；纯文档任务） |
| 2026-08-28 | 候选调整（预验收）：`items` 按 `ID_SERVER_CONFIG ASC` 返回（SC-API-025/034）；`configKey` 不再承担排序职责（SC-API-027）；新增 SC-API-036 明确 `configDesc` 原样返回、真实换行经 JSON 标准转义传输；不新增接口、请求字段、响应字段或错误码；文档状态迁移为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态迁移为 `IMPLEMENTED_ADJUSTMENT_PENDING`，66 条验收保持 NOT_RUN | SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-001（纯文档候选基线任务；待用户复审） |
| 2026-08-28 | 批准收口（预验收调整基线）：文档状态由 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` 迁移为 `APPROVED`；记录候选调整批准任务、批准日期、批准人（项目负责人）与 ChatGPT 最终复审通过提交 `b1c5349df43c73bc855b5ca8b3ea92acb6faa7ee`；两项调整内容不变（`configDesc` 真实换行安全显示、`ORDER BY ID_SERVER_CONFIG ASC`）；实现状态保持 `IMPLEMENTED_ADJUSTMENT_PENDING`（两项已批准调整代码尚未实现），66 条验收保持 `NOT_RUN`；`PENDING_USER_CONFIRMATION=0`；保留初始候选、R1、R2 全部历史 | SERVER-CONFIG-PRE-ACCEPTANCE-ADJUSTMENT-BASELINE-APPROVAL-001（项目负责人批准驱动的验收前调整基线收口；纯文档任务） |
| 2026-08-29 | 最终收口：实现状态由 `IMPLEMENTED_ADJUSTMENT_PENDING` 迁移为 `IMPLEMENTED_ACCEPTED`；新增元数据行（验收用例状态/正式验收状态 = `66 PASSED / 0 FAILED（ACCEPTED）`、收口任务、收口日期、验收证据提交 `b5aeec2...`、项目负责人最终人工测试、`PENDING_USER_CONFIRMATION=0`）；接口契约（URL、请求/响应字段、排序 `ID_SERVER_CONFIG ASC`、`configDesc` 原样返回与换行传输、错误码）保持不变，仅收口实现/验收状态。历史变更记录中的 `NOT_STARTED`/`DRAFT_*`/`IMPLEMENTED_ADJUSTMENT_PENDING` 等历史状态原样保留 | SERVER-CONFIG-FORMAL-ACCEPTANCE-CLOSEOUT-001（纯文档正式验收收口；不修改代码/测试，不连接数据库，不重新执行验收） |
