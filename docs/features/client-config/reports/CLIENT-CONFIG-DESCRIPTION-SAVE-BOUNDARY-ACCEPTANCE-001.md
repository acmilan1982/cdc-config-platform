# 探针端管理：描述保存边界定向验收（前置阻断，未写入）

- 任务编号：`CLIENT-CONFIG-DESCRIPTION-SAVE-BOUNDARY-ACCEPTANCE-001`
- 分支：`develop`
- base：`42a0aa2f880f4c14a117c500cc3038e32209ba3f`
- result：见最终 `AGENT_TASK_RESULT`（本报告不预填自身提交 SHA）
- 目标：`/config/client` 的 `CCFG-AC-131`
- 目标对象：别名 `OWNER_TEST_B`（由仓库外候选映射 `T02` 精确绑定）
- 性质：**只读前置检索即触发任务前置停止**。未进入 S1–S5，未执行任何业务写入、未做浏览器导航、未启停服务、未构建、未访问数据库/ZooKeeper/Kafka/sync-client。

## 0. 结论摘要

**业务结果优先：原描述未被触碰，未执行任何写入，因此不存在“恢复”动作，不得报告 `RESTORED`。**

| 项目 | 结果 |
|---|---|
| 业务写尝试 | **0**（含预期拒绝在内的任何写请求均未发送） |
| 恢复写尝试 | **0** |
| 原描述最终状态 | 仍为 **NULL**（与开工前一致，未被覆盖） |
| `final_fg_active` | `0`（只读回读） |
| `CCFG-AC-131` | **维持 `BLOCKED`**（不预填 PASS） |
| `changed_ids` | `[]`（未改变任何 AC 状态 token） |
| 统计（独立复算） | `PASS` **84** / `FAIL` **0** / `BLOCKED` **59** / `NOT_RUN` **14** = **157**（未变） |

## 1. 身份绑定

- 唯一身份来源：仓库外 `/root/cdc-controlled-toggle-readiness-001/candidate-map.json`（mode 600）。
- 绑定 `alias=T02` → 报告别名 `OWNER_TEST_B`；候选映射给出的完整 clientId 仅用于精确 GET 与仓库外前像，不按 `T01..T16` 列表顺序或行号识别。
- 精确匹配结果：`/api/clients?status=ALL` 中与绑定 clientId **完全相等**的行数 = **1**（用 `_norm(clientId)` 精确比较，非模糊/序号匹配）。
- 脱敏：提交侧仅记录 `clientIdSha256` 与数据源 token 的 SHA256，不含真实 ID/源/描述文本。

证据：`evidence/CLIENT-CONFIG-DESCRIPTION-SAVE-BOUNDARY-ACCEPTANCE-001/precondition-results.json`
键：`target.alias`、`target.clientIdSha256`、`preconditions.exactRowMatchCount`、`preconditions.identityBoundFromCandidateMap`。

## 2. S0 只读前置结果

只读 `GET /api/clients?status=ALL` 与 `GET /api/clients/data-source-options?excludeClientId=<绑定ID>`，未发送任何非 GET 请求。

| 前置 | 证据键（`precondition-results.json`） | 实际值 | 结论 |
|---|---|---|---|
| 对象精确存在且唯一 | `preconditions.exactRowMatchCount` | `1` | 通过 |
| `fgActive` 精确为 `0` | `preconditions.fgActiveIsZero` / `preImage.fgActive` | `true` / `"0"` | 通过 |
| 状态为停用 | `preconditions.statusIsDisabled` / `preImage.status` | `true` / `"DISABLED"` | 通过 |
| 无行异常 | `preconditions.rowAnomaliesEmpty` / `preImage.rowAnomaliesCount` | `true` / `0` | 通过 |
| 无源异常 | `preconditions.dataSourceAnomaliesEmpty` | `true` | 通过 |
| 无分配冲突 | `preconditions.dataSourceConflictsEmpty` | `true` | 通过 |
| 源集合与映射 token 一致 | `preconditions.sourceSetMatchesMapping` | `true` | 通过 |
| 自排除候选源仍存在且可选 | `preconditions.allMappingTokensPresentSelectableUnoccupied` | `true` | 通过 |
| 候选源明细 | `tokenChecks[0].present/selectable/occupied/conflictCount` | `true/true/false/0` | 通过 |
| **原描述存在** | `preImage.clientDescPresent` / `preImage.clientDescIsNull` | **`false` / `true`** | **阻断** |
| **原描述可经授权编辑接口恢复** | `preconditions.originalDescRestorableViaAuthorizedEditApi` / `restoration.restoreFeasible` | **`false`** | **阻断** |

HTTP 及业务码：列表 `200/200`、候选源 `200/200`（`http.listStatus`、`http.listBusinessCode`、`http.dataSourceOptionsStatus`、`http.dataSourceOptionsBusinessCode`）。

## 3. 决定性阻断：原描述为 NULL 且不可恢复

### 3.1 只读事实

1. 绑定行在 `GET /api/clients?status=ALL` 的响应中**没有 `clientDesc` 字段**；同响应其他行均带 `clientDesc`。
2. 后端全局 Jackson 为 `default-property-inclusion: non_null`（`backend/src/main/resources/application.yml:9`），因此“字段缺失”即 **null**，不是空串。
3. 前序 readiness 前像独立记录该对象 `clientDesc = None`（仓库外 `/root/cdc-controlled-toggle-readiness-001/pre-image-T02.json`，mode 600）。
4. 本次新鲜前像已另存仓库外 `/root/cdc-description-save-boundary-001/pre-image-OWNER_TEST_B.json`（mode 600），含完整原描述（null）、ID、源原序列、`fgActive` 及全部可比较业务字段。

### 3.2 授权编辑接口无法写回 NULL

`PUT /api/clients/{originalClientId}`（`ClientConfigController.java:74-79`）→ `ClientConfigServiceImpl.normalizePayload`：

```text
L532  String descOriginal = clientDescRaw == null ? "" : clientDescRaw;
L533  String descTrimmed = descOriginal.trim();
L534  if (descTrimmed.isEmpty()) { throw ClientConfigErrorCode.invalidClientDesc(); }
L537  if (ClientConfigDataUtil.utf8Length(descOriginal) > CLIENT_DESC_MAX_BYTES) ...
L554  return new NormalizedPayload(clientId, descOriginal, tokens, serialized);
```

- `CLIENT_DESC_MAX_BYTES = 1024`（`ClientConfigServiceImpl.java:42`）。
- `INVALID_CLIENT_DESC = 40102`（`ClientConfigErrorCode.java:18`；工厂方法 L42-44）。
- 业务失败为 HTTP 200 + 业务码，不以 HTTP 状态判断成功。

**结论**：null / 空串 / 纯空白描述均被归一为空并被 `40102` 拒绝；能成功写入的只有非空原文。授权范围内**没有任何 API 能把该列写回 NULL**：
- 编辑接口拒绝空描述；
- 新增接口同样要求非空描述（同一归一化），且任务禁止新增/删除对象；
- 任务禁止数据库直写。

因此，一旦做任何描述编辑，原值（NULL）**不可逆**，直接违反任务 §2“当前原值无法通过已知安全方式恢复，停止本批，不覆盖原记录”。

### 3.3 未做的“验证性写入”

本报告**没有**为了证明拒绝而发送空描述 PUT：该请求会消耗未列入执行矩阵的写尝试，且即便被拒也无法恢复 NULL，不能产生任何恢复能力。阻断依据完全来自源码校验规则与只读回读事实。

## 4. 未自动切换到其他对象

任务明确“只从候选映射绑定原 readiness T02……选定对象后本批不自动切换别的对象”。虽然负责人授权同时覆盖 T01/T02，但本任务身份绑定为 `OWNER_TEST_B`（T02），故未在触发阻断后擅自改用 T01 或其他行。

## 5. `CCFG-AC-131` 原子腿执行状态

| 定义腿 | 状态 | 原因 / 证据 |
|---|---|---|
| 前置：功能部署、进入 `/config/client`、可触发保存与后端校验 | 部分只读确认 | 服务在 8080/5173 运行；未导航、未触发保存（阻断先于导航） |
| 前置：目标对象精确定位、状态/源无异常 | 满足 | §2 通过项 |
| 前置：原描述可通过已知安全方式恢复 | **不满足** | §3；`restoration.stopReason=ORIGINAL_DESC_NULL_CANNOT_BE_RESTORED` |
| S1 恰好 256 汉字 / 768 字节 UI 保存 | **NOT_EXECUTED** | 前置阻断，未进入写路径 |
| S2 恰好 256 个四字节码点 / 1024 字节 UI 保存 | **NOT_EXECUTED** | 同上 |
| S3 直连同一编辑接口提交 >1024 字节并观察后端拒绝 | **NOT_EXECUTED** | 同上；未发送任何直连写请求 |
| S3 前半：前端第 257 字符被限制 | 复用已审客观证据（非本对象写入） | 见 §6 |
| S4 首尾空白短描述 UI 保存、逐字节回读 | **NOT_EXECUTED** | 前置阻断 |
| S5 恢复本次原描述 UI 保存 | **NOT_EXECUTED** | 原描述为 NULL 且无授权方式写回，恢复不可行 |

由于基本写入腿均未执行，`CCFG-AC-131` 不具备 PASS 条件，维持 `BLOCKED`。

## 6. 前端 256 码点上限的客观证据复用

前序已审证据 `reports/evidence/CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002-R1/r1-dialog-results.json` 在**同一 `/config/client` 编辑弹窗**上以真实剪贴板粘贴记录：

| 键 | 值 | 含义 |
|---|---|---|
| `clipboard.cases.han300.sourceCodePoints` | `300` | 粘贴源 300 码点 |
| `clipboard.cases.han300.final.valueCodePoints` | `256` | 输入框最终 256 码点（第 257 起被限制） |
| `clipboard.cases.han300.final.utf8Bytes` | `768` | 256 汉字 = 768 字节 |
| `clipboard.cases.mixed.sourceCodePoints` / `final.valueCodePoints` | `300` / `256` | 混合内容同样截断到 256 码点 |
| `clipboard.cases.mixed.final.lastIsLoneSurrogate` / `hasLoneSurrogateAnywhere` | `false` / `false` | 无孤立代理项 |

适用性说明：该证据证明的是**页面/弹窗级输入上限**（`ClientConfigPage.vue:511 DESC_MAX_CHARS=256`、`:547 truncateCodePoints`、`:943/:1011` 入口截断），与具体行身份无关；其 `editTargetSourceCount=7` 属前序对象属性，**不**用于本对象身份或本任务写入结论。本任务**未**借用 `CCFG-AC-130` 的 PASS 状态，只引用上述客观键。

## 7. 判定与状态保护

- 唯一可能变化的 `CCFG-AC-131`：**不改**，维持 `BLOCKED`。
- 其余 156 个状态格、全部 AC/REQ/DESIGN/UI 定义行：**逐字节不变**。
- 四族定义数量独立复算：`REQ154 / AC157 / DESIGN89 / UI77`，编号连续唯一。
- 状态复算：`PASS 84 / FAIL 0 / BLOCKED 59 / NOT_RUN 14 = 157`（与本任务起点一致）。
- `CCFG-AC-082` 维持 `BLOCKED`。

## 8. 证据与校验

证据目录：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-DESCRIPTION-SAVE-BOUNDARY-ACCEPTANCE-001/`

| 文件 | 说明 |
|---|---|
| `probe-description-save-preconditions.py` | 只读 GET 前置探针；确定性退出码 `3` 表示原描述 NULL 不可恢复 |
| `precondition-results.json` | 脱敏结果（别名、哈希、长度、布尔） |
| `env-and-version.txt` | git HEAD、服务 PID/监听、jar 哈希/时间戳、版本 |
| `README.md` | 证据索引与脱敏边界 |
| `SHA256SUMS.txt` | 证据哈希清单，`sha256sum -c` 全 `OK` |

- 仓库外原始快照（mode 700/600）：`/root/cdc-description-save-boundary-001/{list-snapshot-OWNER_TEST_B.json,data-source-options-snapshot-OWNER_TEST_B.json,pre-image-OWNER_TEST_B.json}`。
- 提交侧敏感扫描：脱敏 JSON 不含 `CCFG-AC-R1*`、机构名、源名或描述文本。
- 未做数据库 `LENGTHB` 实查；持久化事实来自只读 GET 回读，不以页面视觉推断持久化。

## 9. 未执行项

- 未执行 S1–S5，未发送任何 `POST/PUT/PATCH/DELETE`，业务写尝试 0、恢复写尝试 0。
- 未做浏览器导航（阻断先于首次导航，故未安装/使用页面门禁，也无页面上下文失败）。
- 未启停服务、未构建、未安装依赖、未改配置；未运行测试套件/lint/类型检查。
- 未访问数据库、ZooKeeper、Kafka、sync-client；未访问其他功能页面。
- 未新增/删除对象，未改 ID、关联源或 `FG_ACTIVE`。
- 未修改产品源码/CSS/测试/依赖/配置/模板、其他 Feature、REQ/DESIGN/UI/API/DATABASE 及历史证据。

## 10. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_DESCRIPTION_SAVE_BOUNDARY_ACCEPTANCE_REVIEW`

**前置阻断 ≠ 验收通过 ≠ 157 条整体接受；原描述未被触碰，不得声称已恢复或已验收。**
