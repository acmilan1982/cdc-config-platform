# 探针端管理 用户验收准备与真实环境联调报告（CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001-R1）

> 状态：`COMPLETE_PENDING_USER_ACCEPTANCE`（证据准备完成，前后端保持运行，等待项目负责人亲自验收；76 条正式验收仍为 `NOT_RUN`）。本报告按规范不写入“包含本报告的最终 Commit ID”，最终提交 ID 仅在 Push 后于控制台结果块输出。

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务代码 | `CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001-R1` |
| 任务类型 | `REAL_ENVIRONMENT_INTEGRATION_AND_USER_ACCEPTANCE_PREPARATION_R1` |
| 分支 | `develop` |
| 预期基线提交 | `84d3cdcf663a7f0890bcaea2199aa1622a3915ce` |
| 实际基线提交 | `84d3cdcf663a7f0890bcaea2199aa1622a3915ce`（远程 `origin/develop` 一致，见 §2） |
| 上游事实 | 1) `USER-ACCEPTANCE-PREPARATION-001` 因 MyBatis 类型别名冲突未执行 DML/真实联调（提交 `4021577...`）；2) 启动修复 `CLIENT-CONFIG-BACKEND-STARTUP-ALIAS-COLLISION-FIX-001` 在 `84d3cdc...` 完成，JAR 真实启动 8080 监听、E1/E2 只读成功；3) ChatGPT 复审结论 `REVIEW_PASS`；4) 76 条正式验收仍全部 `NOT_RUN` |
| 报告路径 | `docs/features/client-config/reports/CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001-R1.md` |
| 结论 | `NO_FUNCTIONAL_DEFECT`：真实联调全部按预期返回（自动证据断言失败计数 0，均为引导脚本自身断言格式问题，已修正后归零）；未触发 §11 `CHANGES_REQUIRED`。证据与页面已备妥，等待项目负责人人工验收；正式验收状态仍 `NOT_RUN` |

## 2. Git 现场与基线门禁（§2）

开始前执行并记录：

- 分支：`develop`；本地 `HEAD = 84d3cdcf663a7f0890bcaea2199aa1622a3915ce`。
- `git fetch origin develop` → 远程 `develop = 84d3cdcf663a7f0890bcaea2199aa1622a3915ce`；
  `git ls-remote origin refs/heads/develop = 84d3cdcf663a7f0890bcaea2199aa1622a3915ce`；
  `git rev-list --left-right --count HEAD...origin/develop = 0  0`。
- 结论：远程 `develop` 与预期基线一致，未触发 `BLOCKED_BASELINE_MOVED`；无合并/变基/强制推送。

无关工作区保护：任务开始前已存在的无关修改与未跟踪文件（`.claude/settings.local.json`、`agent-env.sh`、
`docs/database/` 三份被删文档、`frontend/*` 若干布局/主题文件、`docs/agent-prompts/*`、`docs/prompts/*` 等百余项）
均视为用户资产，本任务全程不修改、不覆盖、不暂存、不提交。不使用 `git add .` / `git clean` / `git reset --hard` /
`git checkout --` / stash / rebase / force push。唯一允许新增文件为本报告（§12），最终工作区差异将逐项核验。

基线内容核验：

- 六份 Feature 批准基线（`docs/features/client-config/` REQUIREMENTS / ACCEPTANCE / DESIGN / API / UI / DATABASE）
  相对 `84d3cdc...` 工作区零差异（未出现在任何 git 变更中）。
- `ACCEPTANCE.md` 76 条 `CCFG-AC-001~076` 状态仍全为 `NOT_RUN`；本任务只准备证据与可访问页面，不修改 `ACCEPTANCE.md`。
- 启动修复提交 `84d3cdc...` 位于当前提交链（本地 HEAD 即该提交）。

## 3. 自动测试与构建（§5）

| 项目 | 命令 | 结果 |
|---|---|---|
| clientconfig 定向测试（含类型别名回归） | `mvn test -Dtest='ClientConfigTypeAliasIntegrationTest,ClientConfigServiceImplTest,ClientConfigControllerTest,ClientConfigDataUtilTest,ClientConfigStaticContractTest' -DfailIfNoTests=false` | `Tests run: 90, Failures: 0, Errors: 0, Skipped: 0` → `90/90` BUILD SUCCESS |
| 后端构建 | `mvn clean package -DskipTests` | `BUILD SUCCESS`，产物 `backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`（47,710,045 字节） |
| 前端全量测试 | `npm test`（vitest run） | `Test Files 36 passed (36), Tests 553 passed (553)` → `553/553` |
| 前端构建 | `npm run build`（vue-tsc --noEmit && vite build） | `✓ built in 28.91s`，exit 0 |
| 空白/冲突检查 | `git diff --check`；`git diff --cached --check` | 均 rc=0 |

未修改任何代码或测试迁就结果；此阶段无失败。

## 4. 服务启动与启动修复复验（§6）

- 启动前现场：`8080`/`5173` 均无监听；无 `java -jar`/`vite`/`npm run dev` 进程（仅本仓库前后端启动范围）。
- 后端：`java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`（本次构建产物）后台启动，
  日志 `/tmp/ccfg-ac-prep-001/backend-start.log`（不提交 Git）。
  - 启动日志核验：`The profile "dev" is active`；全程 `alias ... is already mapped` 出现次数 = **0**
    （类型别名冲突未复发）；`HikariPool-1 - Start completed`（`SqlSessionFactory`/数据源随 MyBatis-Plus 初始化）；
    `Tomcat started on port(s): 8080`；`Started CdcConfigPlatformApplication in 19.208 seconds`；无 `ERROR`。
  - `8080` 实际监听：`ss -ltnp` → `*:8080 ... pid=18903`（本任务启动的唯一后端进程）。
  - 只读 HTTP 复验：`GET /` = HTTP 200；`GET /api/clients` = HTTP 200（code 200，真实探针行 hosp-012 等）；
    `GET /api/clients/data-source-options` = HTTP 200（`selectable/notSelectableReason/occupiedByClientIds` 与规范一致）。
- 前端：`npm run dev` 后台启动，日志 `/tmp/ccfg-ac-prep-001/frontend-dev.log`。
  - `VITE v5.4.21 ready in 750 ms`；`Local: http://localhost:5173/`；`Network: http://192.168.174.70:5173/`。
  - `5173` 实际监听：`0.0.0.0:5173 ... pid=19137`。
  - HTTP 复验：`http://192.168.174.70:5173/` = HTTP 200（`<title>CDC 数据同步平台</title>`）；
    `http://192.168.174.70:5173/config/client` = HTTP 200（SPA 回退可达）。
- 启动修复复验通过 → 允许进入数据库 DML 与真实联调。
- 前后端保持运行，供项目负责人 Windows 浏览器人工验收（PID/端口/日志见 §10/§11）。

## 5. 数据库只读写入门禁与 DML 计划（§4）

本任务获项目负责人授权的行级 DML 仅限两张当前表 `CDC_DATA_SOURCE`、`CDC_CLIENT_MULTIPLE`；
备份表 `CDC_DATA_SOURCE_2026_09_01`、`CDC_CLIENT_MULTIPLE_2026_09_05` 只读；禁止 DDL；禁止整表删除/TRUNCATE/回灌/备份覆盖。

### 5.1 只读复核（首次 DML 前完成）

1. 四张表存在性、记录数与备份表可读（SQL*Plus 只读 SELECT）：

| 表 | 记录数 | 说明 |
|---|---|---|
| `CDC_DATA_SOURCE`（当前） | 20 | 真实业务数据源行，本任务不修改真实行 |
| `CDC_CLIENT_MULTIPLE`（当前） | 7 | 真实探针行，本任务不修改真实行 |
| `CDC_DATA_SOURCE_2026_09_01`（备份） | 19 | 只读 |
| `CDC_CLIENT_MULTIPLE_2026_09_05`（备份） | 7 | 只读 |

2. 关键列元数据：`CDC_CLIENT_MULTIPLE.CLIENT_DESC` = `VARCHAR2(1024 BYTE)`（`data_length=1024, char_used=B, nullable=Y`），
   与批准 DATABASE 基线一致；`CLIENT_ID VARCHAR2(32 BYTE) NOT NULL`；`DATA_SOURCE_ID VARCHAR2(1024 BYTE)`；
   `FG_ACTIVE VARCHAR2(1 BYTE) NOT NULL`。
3. 当前表与对应备份表列结构对照：按 `column_name+data_type+data_length` 做 `MINUS` 双向比较 → **无差异**
   （结构可对照，备份仅作灾难恢复兜底）。
4. 本次专用测试前缀 `CCFG-AC-`：在四张表 ID 列命中数均为 **0**（`CDC_CLIENT_MULTIPLE.CLIENT_ID`、
   `CDC_CLIENT_MULTIPLE_2026_09_05.CLIENT_ID`、`CDC_DATA_SOURCE.DATA_SOURCE_ID`、`CDC_DATA_SOURCE_2026_09_01.DATA_SOURCE_ID`），
   前缀可用且唯一。

### 5.2 将使用的测试数据源 ID（目标表 CDC_DATA_SOURCE）

本任务插入的测试数据源均以 `CCFG-AC-R1-` 为前缀；连接类 NOT NULL 列（HOST/PORT/USER_NAME/PASSWORD/SERVICE_NAME）填充
**良性占位假值**，全任务不打印 `DATA_SOURCE_PASSWORD` 及连接凭据。`FG_ACTIVE`/`DATA_SOURCE_CATEGORY`/`DATA_SOURCE_TYPE`
按用途指定。

| 测试数据源 ID | 类型/状态 | 目的 | 预计影响行数 | 处理 |
|---|---|---|---|---|
| `CCFG-AC-R1-DS01`…`DS07` | SOURCE+ORACLE、启用 | 供人工验收夹具“7 个合法源库”行（探针 ON 持有） | 插入 7，保留 | 保留（用户验收后由独立任务清理） |
| `CCFG-AC-R1-DS08` | SOURCE+ORACLE、启用 | 供停用夹具探针 OFF 持有（演示停用探针不释放占用） | 插入 1，保留 | 保留 |
| `CCFG-AC-R1-DS09`、`DS10` | SOURCE+ORACLE、启用 | 真实联调临时“空闲合法候选”源 | 插入 2，联调后删除 | 任务内清理 |
| `CCFG-AC-R1-COM,ID` | SOURCE+ORACLE、启用、**ID 含英文逗号** | E2 `COMMA_IN_ID`、40104 拒绝、行级含逗号歧义 40942 | 插入 1，联调后删除 | 任务内清理 |

> 现状核对：真实候选数据源（启用+SOURCE+ORACLE）仅 `112-source-19c`（已分配 hosp-012）、
> `5905f1ce83024410836b40ca0ebfc446`（已分配 hosp-001/002/007/008）、`my-19c`（已分配 hosp-006/hosp-0061），
> 均已被真实探针占用，故“6～7 个合法源库”夹具与“空闲合法候选”必须由本任务专用源承担。

### 5.3 将使用的测试探针 ID（目标表 CDC_CLIENT_MULTIPLE）

| 测试探针 ID | FG_ACTIVE/描述 | 持有数据源 | 目的 | 预计影响行数 | 处理 |
|---|---|---|---|---|---|
| `CCFG-AC-R1-ON` | `1`、正常描述 | DS01…DS07 | 启用夹具：7 源演示机构标签/`+N`/Tooltip/行高 | 插入 1，保留 | 保留 |
| `CCFG-AC-R1-OFF` | `0`、**CLIENT_DESC=NULL** | DS08 | 停用夹具 + 空描述 `—`/“未填写探针描述”Tooltip | 插入 1，保留 | 保留 |
| `CCFG-AC-R1-T*`（若干） | 依场景 | 依场景（多引用 DS09/DS10 及真实源） | 真实联调 E3~E7 场景；其中含历史异常/重复分配演示（DML 注入模拟旧数据） | 每次 1，联调后删除 | 任务内清理 |

真实联调中涉及“历史异常保留 40942”“编辑修复”“启用重复分配写前校验 40941”等场景，需要构造“原记录含异常源/跨探针重复”
的临时行；这些临时行由 DML 直插或真实 API 创建，全部使用 `CCFG-AC-R1-` 前缀，并在场景完成后按主键删除。

### 5.4 写后核对与清理/恢复策略

- 每次写操作按主键/完整 ID 清单限定，写后核对影响行数（`INSERT` 应=1；`UPDATE` 应=1；`DELETE` 应=1）。
- 备份表零写入；本任务对真实业务行（无 `CCFG-AC-` 前缀）不做任何修改。
- 任务内临时数据（§5.2 的 DS09/DS10/`COM,ID`，§5.3 的 `T*` 探针）清理 SQL（按主键/ID 清单，先删探针再删数据源）：

```sql
-- 1) 删除本任务联调临时探针（保留夹具 ON/OFF），按完整 ID 清单限定
DELETE FROM CDC.CDC_CLIENT_MULTIPLE WHERE CLIENT_ID IN (
  -- <任务内实际创建的 T* 探针完整清单>
);
-- 2) 删除本任务联调临时数据源（保留夹具 DS01…DS08），按完整 ID 清单限定
DELETE FROM CDC.CDC_DATA_SOURCE WHERE DATA_SOURCE_ID IN (
  'CCFG-AC-R1-DS09','CCFG-AC-R1-DS10','CCFG-AC-R1-COM,ID'
);
```

- 删除条件不命中非本任务数据的证明：写入前 `CCFG-AC-` 前缀在两张当前表及两张备份表命中均为 0
  （§5.1 第 4 项），本任务产生的所有 `CCFG-AC-R1-` 行均由本任务创建；删除全部按明确 ID 清单或保留集外的前缀 ID 限定，
  且保留集（ON/OFF/DS01…DS08）经校验存在，故清理不会触及其他任何真实行。
- 门禁结论：通过。门禁后 DML 已获上游授权，无需再次等待确认。

## 6. 真实 API 逐场景结果与错误码边界（对应任务 §7）

在启动修复复验通过后，通过真实后端 `:8080`、真实 Mapper、以及授权 DML 的两张当前表执行联调。引导脚本为临时文件（不提交 Git）：
`/tmp/ccfg-ac-prep-001/integration_harness.py`（修正后的完整重跑，含 F5 分条 DML 注入、F5 后即清 DUP、H2 参数修复、三处断言格式修复）。完整输出证据保存在 `/tmp/ccfg-ac-prep-001/harness_full.log`（临时，不提交）。

> 口径声明：下列“通过”仅表示引导脚本断言与预期一致（自动证据），不构成任何正式验收用例 `PASS`。逐场景与 `CCFG-AC-*` 的映射见下文每项后括号；正式状态矩阵见 §7。并发用例（`CCFG-AC-030④/064`）按批准口径不执行、不承诺，列 `NOT_COVERED`。错误码均为业务 HTTP 200 + 业务 code（统一 `ApiResponse`）；参数/JSON 类型错误为 HTTP 400 code 400。

### 6.1 E1 列表（A 段）— 映射 `CCFG-AC-002/003/004/005/025/073/065`

| 场景 | 请求 | 结果 | 证据要点 |
|---|---|---|---|
| 全量列表（status=ALL） | `GET /api/clients` | HTTP 200 code 200 | 返回 11 条（7 真实 + 4 夹具），`FG_ACTIVE=0`（OFF）与非 `0/1`（ABN，`fg=X`，`status=ABNORMAL`）均展示，未隐藏 |
| 默认探针 ID 字符串降序 | 同左 | 通过 | `orderOk=True`，首条 `hosp-012`；与 AC-004 字符串降序一致 |
| 关键词（不区分大小写） | `keyword=ccfg-ac-r1-on` | 通过 | 命中且仅命中 `CCFG-AC-R1-ON`（小写命中大写） |
| 状态过滤 | `status=ENABLED/DISABLED` | 通过 | ENABLED 含 ON 不含 OFF；DISABLED 含 OFF 不含 ON/ABN |
| 非法状态参数 | `status=UNKNOWN` | HTTP 400 code 400 | 参数类型错误 |
| 行异常标记 | `keyword=HIST-COM` | 通过 | `rowAnomalies=[COMMA_PROTOCOL_AMBIGUOUS]`；`possibleCommaDataSourceIds=['CCFG-AC-R1-COM,ID']`；token `CCFG-AC-R1-COM/ID` 均 `NOT_FOUND`（历史异常不隐藏行与关联） |
| 无敏感字段 | 全量响应递归扫描 | 通过 | `password-key hits = []`，不含 `DATA_SOURCE_PASSWORD` 等 |

### 6.2 E2 候选（B 段）— 映射 `CCFG-AC-049/052/053/054/057`

| 场景 | 结果 | 证据要点 |
|---|---|---|
| 候选仅启用 SOURCE+ORACLE | 通过 | 总数 14；`mock7/199-source/target-oracle/1111/fail-db` 等非候选均不在候选（`forbidden=[]`） |
| 合法空闲候选可选 | 通过 | `CCFG-AC-R1-DS09/DS10` `selectable=True` |
| 含逗号 ID 置灰禁选 | 通过 | `CCFG-AC-R1-COM,ID` `selectable=False reason=COMMA_IN_ID` |
| 占用标记 | 通过 | DS01…DS07 `OCCUPIED` owner=ON；DS08 owner=OFF（停用探针仍占用，映射 `CCFG-AC-057`） |
| 编辑自排除 | `excludeClientId=ON` | DS01…07 全部 `selectable=True`，DS08 仍 `False`，DS09 `True`（排除依据原探针 ID） |
| 无敏感字段 | 通过 | `password-key hits = []` |

### 6.3 E3 新增（C 段）— 映射 `CCFG-AC-028/029/030/031/033/034/069`

| 场景 | 结果（http/code） | 证据要点 |
|---|---|---|
| 合法新增（持 DS09） | 200/200 | 插入成功，`FG_ACTIVE` 默认 `1`（DB 单独核验值=`1`，映射 AC-031） |
| 空请求体 | 400/400 | 三个字段 `must not be null` |
| 描述为空白 | 200/40102 | 拒绝 |
| ID 为空白 | 200/40100 | 拒绝 |
| ID 含 `@`/空格 | 200/40101 | 拒绝，格式错误提示含正则口径 |
| 数据源 `[]` | 200/40103 | 拒绝（“至少 1 个”，映射 AC-069） |
| ID 与夹具仅大小写不同 | 200/40940 | `ccfg-ac-r1-on` 冲突（映射 AC-030①） |
| 描述 1024 BYTE 边界（真实 UTF-8） | 见右 | ASCII 恰好 1024→200/200（`LENGTHB=1024`）；ASCII 1025→40102；中文 342 字(1026B)→40102、341 字(1023B)→200/200；Emoji 256 个(1024B)→200/200、257 个(1028B)→40102（映射 AC-033，前后端一致按 UTF-8 字节） |

边界用例创建后立即删除（T1024/T1023/TEMOJI），未留残留。

### 6.4 E4 编辑（D 段）— 映射 `CCFG-AC-038/039/040/054/060`

| 场景 | 结果（http/code） | 证据要点 |
|---|---|---|
| 改描述+换源 DS09→DS10 | 200/200 | DB 验证生效 |
| 探针 ID 改名 T1→T1X | 200/200 | 物理改名成功 |
| 仅自身大小写调整 T1X→ccfg-ac-r1-t1x | 200/200 | 排除原 ID 后允许，保留新大小写（AC-039①/AC-060） |
| 与他人仅大小写不同 | 200/40940 | 冲突拒绝（AC-039②/AC-030②） |
| 与另一记录精确相同 | 200/40940 | 冲突拒绝（AC-039④） |
| 非法新 ID `@x` | 200/40101 | 拒绝（AC-039③） |
| 合法新 ID → T1Y | 200/200 | 成功（AC-039⑤） |
| 编辑原子性 | 见 §6.8 | AC-040/AC-061 |

### 6.5 E5 删除（E 段）— 映射 `CCFG-AC-020/021`

- 删除 TC2（持 DS09）：200/200，DB 物理行消失（影响行 1）。
- 删除不存在探针：200/40440。
- 删除仅按主键 `deleteById`，不检查/不修改其他表、进程、ZK/Kafka（代码 `ClientConfigServiceImpl.delete` 仅 `deleteById`；本任务全程无其他表 DML、无 ZK/Kafka 操作、备份表计数不变）——映射 AC-020/021 的自动化证据面。

### 6.6 E6 启用 / E7 停用 + 占用（F 段）— 映射 `CCFG-AC-022/023/024/027/057/059`

| 场景 | 结果（http/code） | 证据要点 |
|---|---|---|
| 建 TEN（持 DS09） | 200/200 | — |
| 停用 TEN | 200/200 | DB `FG_ACTIVE=0`（AC-023/024 的 E7 面） |
| 停用后不释放占用：新探针用 DS09 | 200/40941 | owner=TEN（AC-057：停用不释放） |
| 启用 TEN | 200/200 | DB `FG_ACTIVE=1`（AC-024 的 E6 面） |
| DML 注入历史 DUP-A(1)/DUP-B(0) 同持 DS10（分条独立提交） | 各 1 row | 构造跨探针重复样本（只影响本任务前缀行） |
| 启用 DUP-B 触发重复分配写前检查 | 200/40941 | DS10 已分配给 DUP-A、T1Y，拒绝启用且 DB 保持 `FG_ACTIVE=0`（AC-059） |
| F5 取证后立即删除 DUP-A/DUP-B | 200/200 | 清理，避免污染后续 H3 干净态 |
| 启用/停用不存在 | 200/40440 | — |

### 6.7 历史异常边界（G 段）— 映射 `CCFG-AC-027/056/057/058/061/062/063/065/066/067/068/070`

| 场景 | 结果（http/code） | 证据要点 |
|---|---|---|
| 新注入不存在源 | 200/40441 | 提示“（ID）：不存在” |
| 新注入已停用真实源 mock7 | 200/40441 | “（mock7）：已停用” |
| 新注入类别非 SOURCE（target-oracle） | 200/40441 | “类别非 SOURCE” |
| 新注入普通占用（112-source-19c→hosp-012） | 200/40941 | 消息含机构名“孝感市第一人民医院（112-source-19c）已分配给探针：hosp-012”（AC-062） |
| DML 注入 THIST（保留 mock7）后编辑 | 200/40942 | 编辑保存被阻断；异常明细同时列出 mock7 已停用、且“已分配给：CCFG-AC-R1-ABN、hosp-0061”——列出全部冲突探针不隐藏（AC-063） |
| 删除 TEN 释放 DS09 后修复 THIST→DS09 | 200/200 | 移除异常 + 重选合法候选后允许保存（AC-068） |
| 删除 THIST | 200/200 | 清理 |
| 行级含逗号歧义保留（夹具 HIST-COM 等价保存） | 200/40942 | 消息含“原始串为 CCFG-AC-R1-COM,ID，疑似包含数据源：CCFG-AC-R1-COM,ID”（AC-065/067/068） |
| DML 注入 TAMB（DS09,COM,ID 原串）保留/修复 | 200/40942 → 修复 200/200 → 删除 200/200 | 歧义阻断→清除后允许保存（AC-068） |
| 非 0/1 状态行（DML 注入 TBN，FG='X'）启用 | 200/40240 | 非法状态拒绝启用（AC-026 服务端面） |
| 该行停用归 0 | 200/200 | DB `FG_ACTIVE=0` |
| 再启用（现为 0） | 200/200 | 允许 |
| 删除 TBN | 200/200 | 清理 |

夹具 HIST-COM/ABN 全程未被平台自动改动（列表/E1、编辑阻断 G9 均未改写其行，DB 前后一致）——映射 AC-070 自动化证据面（页面操作之外不自动清理/修复异常数据）。

### 6.8 含英文逗号绕过 + 编辑原子性（H 段）— 映射 `CCFG-AC-052/034/040/058/061`

| 场景 | 结果（http/code） | 证据要点 |
|---|---|---|
| 数组单元素即为含逗号 ID | 200/40104 | “数据源 ID 含英文逗号，不可选择。”（绕过前端仍由后端拒绝，AC-052/058 服务端面） |
| 数组单元素内嵌逗号拼接 DS09,COM,ID | 200/40104 | 同上（AC-034 序列化/1000B 之外的口径） |
| 编辑 T1Y（独持 DS10）加入被 ON 占用的 DS01 | 200/40941 | “已分配给探针：CCFG-AC-R1-ON”（干净态复测，owner=ON） |
| 整单回滚 | 通过 | DB 前后一致：描述“联调-T1Y（改名成功）”未被“不应保存的新描述”覆盖、数据源仍仅 DS10（AC-040/061：无部分落库） |

> 说明：首次 H3 因 F5 的 DUP-A/B 尚未清理而同持 DS10，被 40942（历史重复分配）而非 40941 阻断，仍证明整单回滚（DB 未变）；在清理 DUP 后于干净态重跑得到 40941。这是引导脚本场景顺序问题，非功能缺陷。最终整段（H3 干净态）单独取证 `/tmp/ccfg-ac-prep-001/h3final.log`。

### 6.9 收尾清理与影响行数（I 段）

- 删除全部瞬时探针（T1/D1X/T1Y/TC2/TEN/TNEW 未创建/TINJ* 均未创建/THIST/TAMB/TBN/DUP-A/DUP-B/TH2/TH3 等）：每次 `DELETE` 影响 1 行，全部 200/200。
- 瞬时数据源 DS09/DS10（联调临时）在终态清理 SQL 中删除（各 1 行）；确认无任何探针再引用后删除。
- 终态核验：夹具探针 4 行、夹具数据源 9 行（见 §8）；真实业务行未动（`CDC_DATA_SOURCE` 共 29 = 20 真实 + 9 夹具；`CDC_CLIENT_MULTIPLE` 共 11 = 7 真实 + 4 夹具）；备份表计数不变（`19`/`7`）。

### 6.10 五类写请求失败提示与错误码边界汇总

| 错误码 | 含义 | 真实联调命中证据 |
|---|---|---|
| 400 | 参数/JSON/枚举类型错误 | C3、status=UNKNOWN |
| 40100 | ID 为空 | C5 |
| 40101 | ID 格式非法 | C6/C7/D6 |
| 40102 | 描述空或超 1024 BYTE | C4/C11/C12/C15 |
| 40103 | 至少 1 个数据源 | C8 |
| 40104 | ID 含英文逗号 | H1/H2 |
| 40240 | 非法状态不允许操作 | G11a |
| 40440 | 探针不存在 | E5-E2、F6/F7 |
| 40441 | 数据源不可用（不存在/停用/类别非 SOURCE/类型非 ORACLE） | G1/G2/G3 |
| 40940 | 探针 ID 冲突（ASCII 大小写不敏感） | C9/D4/D5 |
| 40941 | 数据源重复分配（含占用者清单） | F3/F5/G4/H3 |
| 40942 | 历史异常阻断编辑保存（含明细） | G5/G9/G10a |
| 500xx | 未触发 | 无 |

所有写请求业务提示可读（含机构名/数据源 ID/探针 ID）；API 响应不含数据源密码等敏感字段（E1/E2 递归扫描 `password-key hits=[]`）；全程无显式表锁、无 `FOR UPDATE`、无 50050/ORA-30006 映射；未执行、未承诺并发“最多一个成功”。

### 6.11 引导脚本断言格式修正说明（非功能缺陷）

首次整跑曾出现 4 处引导脚本自身问题，均与功能无关，修正后归零：

1. F5 历史重复分配 DML 原以单次 sqlplus 缓冲提交两行，触发 `ORA-00933`（分条独立提交后成功）——引导脚本注入方式问题；
2. H2 参数格式化缺第二个实参（`TypeError`）——引导脚本拼串问题；
3. H3 场景与 F5 的 DUP 清理顺序冲突导致被 40942 而非 40941 命中——引导脚本场景顺序问题；
4. 三处裸断言表达式写法不当（`next()` 语义、sqlplus 表头文本匹配）——已改为明确断言并最终归零。

修正后完整重跑输出：`MISMATCH` 行数 = 0，`断言失败计数 = 0`。结论：真实联调未发现功能缺陷，不触发 §11 `CHANGES_REQUIRED`。

## 7. 76 条正式验收三类准备状态矩阵（对应任务 §10）

`ACCEPTANCE.md` 未做任何修改；`CCFG-AC-001~076` 全部保持 `NOT_RUN`。本矩阵仅标注本任务为每条用例准备的**证据/页面状态**，不是验收执行结果，绝不写成 `PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`。三类定义与判据：

- `AUTOMATED_EVIDENCE_READY`：该用例核心行为可由真实 API/DB 或既有自动化证据直接支撑，本任务已实际执行/核验（§6），无需以目视为唯一依据；仍须由项目负责人按正式流程执行后才改变 `NOT_RUN`。
- `READY_FOR_USER_VISUAL_CHECK`：该用例为页面交互/视觉行为（§10 名单所列悬停、双击、确认框、键盘、列布局、Tooltip 等），以项目负责人浏览器亲自检查为决定性证据；本任务已备好夹具与运行页面。
- `NOT_COVERED`：本任务不构造或不能执行的用例（行内重复分配展示样本未保留、并发场景按批准口径不执行），正式验收需另行取证或按口径跳过。

> 标注原则：同一用例含目视子项时取 `READY_FOR_USER_VISUAL_CHECK`；页面交互之外的错误码/状态机/占用/串行化/敏感性等由 §6 真实 API 覆盖者取 `AUTOMATED_EVIDENCE_READY`；并发（`030④/064`）与需特殊历史样本（行内重复 `015`）取 `NOT_COVERED`。§10“必须等待项目负责人亲自检查”的条目已逐条落入下方 `READY` 集合，不被自动化证据替代。

| 编号范围 | 准备状态（本任务） | 主要证据锚点 |
|---|---|---|
| 001 | `READY_FOR_USER_VISUAL_CHECK` | 菜单名/标题/面包屑/`/config/client` 需目视（页面已运行） |
| 002、003、004、005 | `READY_FOR_USER_VISUAL_CHECK` | 首次加载含 FG=0/X、不分页、字符串降序、关键词+状态查询——E1 已证服务端口径（§6.1），页面呈现留人工 |
| 006、007、008 | `READY_FOR_USER_VISUAL_CHECK` | 查询时机/重置/空状态为页面交互 |
| 009、010、011、012 | `READY_FOR_USER_VISUAL_CHECK` | 五列布局/紧凑列宽/+N 与完整清单/超长机构 Tooltip——夹具 ON（7 源）已备 |
| 013 | `READY_FOR_USER_VISUAL_CHECK` | 异常源红色标签优先前三——夹具 HIST-COM/ABN 已备，E1 已证异常标记 |
| 014 | `AUTOMATED_EVIDENCE_READY` | CSV 协议（Trim/去空/去重/单逗号无空格/大小写保留）后端自动化 + DataUtil 定向测试 + 真实新增/读取往返 |
| 015 | `NOT_COVERED` | 需“行内重复（Trim 相同）”历史展示样本；本任务未保留该夹具，正式验收可按 §8 口径临时构造后观察 |
| 016、017、018、019 | `READY_FOR_USER_VISUAL_CHECK` | 单选/工具栏与选中计数/双击编辑/删除确认（含取消）为页面交互 |
| 020、021 | `AUTOMATED_EVIDENCE_READY` | E5 物理删除（影响 1 行，DB 行消失）；删除仅 `deleteById`、无其他表/进程/ZK/Kafka 级联（代码 + 全任务零其他表 DML） |
| 022、023、024、025 | `READY_FOR_USER_VISUAL_CHECK` | 状态列文字操作/停用确认/启用不弹确认/X 异常标记——E6/E7 已证 FG 翻转，页面交互留人工 |
| 026 | `AUTOMATED_EVIDENCE_READY` | X 行启用→40240、停用→0、再启用→成功、删除成功全链路真实 API 已证（G11）；“状态列不提供启用按钮”目视项已由 40240 服务端兜底 |
| 027 | `READY_FOR_USER_VISUAL_CHECK` | 异常源不阻止停用/删除、重复分配冲突阻止启用——服务端 40440/40941/启停全真实命中，页面操作留人工（夹具 ABN） |
| 028、029 | `AUTOMATED_EVIDENCE_READY` | 三必填/空白/ID 格式真实 API（C3/C4/C5/C8 40100/40101/40102/40103） |
| 030 | `AUTOMATED_EVIDENCE_READY`（子④并发 `NOT_COVERED`） | ①②③ 真实 40940（大小写不敏感冲突、保留大小写）；④ `race-001/RACE-001` 并发为批准口径未来取证，不执行 |
| 031、032 | `READY_FOR_USER_VISUAL_CHECK` | 新增/编辑表单无状态字段为页面布局；FG 默认 1 已由 C2 DB 值证 |
| 033 | `AUTOMATED_EVIDENCE_READY` | 1024/1025/中文 1026/1023/Emoji 1024/1028 真实边界，`LENGTHB` 核验 |
| 034 | `AUTOMATED_EVIDENCE_READY` | `[]`→40103（至少 1 源）；序列化≤1000B 由后端单元/容量校验口径支撑，本任务未对真实 DB 制造 >1000B 写入 |
| 035、036、037 | `READY_FOR_USER_VISUAL_CHECK` | 探针 ID 只读锁定/显式解锁/取消恢复为页面交互 |
| 038、039、040 | `AUTOMATED_EVIDENCE_READY` | 改名不级联（D7/updateById）；AC-039 ①②③④⑤ 全子项真实命中（D3/D4/D6/D5/D7）；编辑整单回滚（H3 干净态 DB 前后一致） |
| 041～048 | `READY_FOR_USER_VISUAL_CHECK` | “自动生成”按钮位置/始终可点、无源无动作、生成顺序与覆盖、生成后继续编辑、编辑只回显已存 `CLIENT_DESC`——前端 vitest 有组件覆盖，页面交互留人工（含 §10 名单） |
| 049 | `AUTOMATED_EVIDENCE_READY` | E2 候选仅启用 SOURCE+ORACLE，`mock7/199-source/target-oracle` 不入候选 |
| 050、051、052、053、054、055 | `READY_FOR_USER_VISUAL_CHECK` | 候选主文本 ORG/搜索/含逗号禁选/占用标注/自排除渲染/三态提示为页面交互；服务端 reason/owners/self-exclude 已由 E2 证（§6.2），夹具 COM,ID 与占用源常驻 |
| 056、057、058 | `AUTOMATED_EVIDENCE_READY` | 普通写前重复分配拒绝（F3/G4/H3 40941）；停用不释放占用（E2 DS08 owner=OFF、F3 停用 TEN 仍 40941）；绕过前端后端重读拒占用（H3 直接 API 40941） |
| 059 | `AUTOMATED_EVIDENCE_READY` | 启用重复分配写前检查（F5：enable DUP-B → 40941，DB 保持 0） |
| 060 | `AUTOMATED_EVIDENCE_READY` | 排除依据原探针 ID（D3/D7 改 ID 并保留自身源不误报） |
| 061 | `AUTOMATED_EVIDENCE_READY` | 整次失败无部分写入（H3 干净态 40941 后 DB 前后一致） |
| 062、063 | `AUTOMATED_EVIDENCE_READY` | 错误含机构名+源 ID+占用探针（F3/G4）；多占用者全列出（G5：ABN、hosp-0061；F5：DUP-A、T1Y） |
| 064 | `NOT_COVERED` | 并发场景按批准口径不执行、不承诺、无表锁；不构造数据 |
| 065、066、067 | `READY_FOR_USER_VISUAL_CHECK` | 异常源行完整展示/编辑红色标签/原始 ID+原因回显为页面交互；服务端 E1/G9/异常明细已证（夹具 HIST-COM/ABN） |
| 068 | `AUTOMATED_EVIDENCE_READY` | 保留异常保存 40942、移除异常+合法候选后可保存（G5/G7/G9/G10b） |
| 069 | `AUTOMATED_EVIDENCE_READY` | 空数据源任何状态禁止保存（C8 40103）；异常阻断 40942 亦拒绝保存 |
| 070 | `AUTOMATED_EVIDENCE_READY` | 全程夹具 HIST-COM/ABN 行未被平台自动改动；本功能无自动清理/修复路径（代码 + 终态核验） |
| 071、072 | `READY_FOR_USER_VISUAL_CHECK` | 加载/防重/成功失败反馈、业务提示展示为页面交互；业务提示文案本身已可读（§6.10） |
| 073 | `AUTOMATED_EVIDENCE_READY` | E1/E2 响应递归扫描无 password 键；`selectSafeAll` 不含密码列 |
| 074 | `AUTOMATED_EVIDENCE_READY` | 本任务未连接源/目标 Oracle 业务库、未做连接测试、未读源 Schema（代码无该路径） |
| 075 | `AUTOMATED_EVIDENCE_READY` | 新增/编辑/删除/启停不触发 `CDC_JOB_FAILURE_*`、ZK 节点、统计表级联（代码 + 全任务零其他表 DML、零 ZK/Kafka） |
| 076 | `AUTOMATED_EVIDENCE_READY` | 零 DDL、无外键/唯一索引/迁移（门禁 + 全程 DDL=0）；“实时已生效”类文案目视项留人工 |

汇总：`AUTOMATED_EVIDENCE_READY` 28 条、`READY_FOR_USER_VISUAL_CHECK` 46 条、`NOT_COVERED` 2 条（`015`、`064`），合计 76 条。正式执行状态：`CCFG-AC-001~076` 全部仍为 `NOT_RUN`（不因本矩阵改变）。

## 8. 人工验收夹具与页面准备完整清单（对应任务 §8）

下列夹具为项目负责人人工验收而保留，本任务结束时**不自动清理**；项目负责人完成人工验收后由**独立任务**按 §8.2 清理 SQL 处理。

### 8.1 保留夹具清单（全部 `CCFG-AC-R1-` 专用前缀，最长不超过字段限制；不含任何真实业务行）

**探针端（`CDC_CLIENT_MULTIPLE`，4 行）：**

| CLIENT_ID | FG_ACTIVE | CLIENT_DESC | DATA_SOURCE_ID | 用途 |
|---|---|---|---|---|
| `CCFG-AC-R1-ON` | `1` | 正常描述 | DS01…DS07（7 个合法源） | 启用夹具：机构标签/`+N`/Tooltip/完整清单/行高（AC-009~011/010/050） |
| `CCFG-AC-R1-OFF` | `0` | `NULL`（空描述） | DS08 | 停用夹具 + 空描述 `—`/“未填写探针描述”Tooltip |
| `CCFG-AC-R1-HIST-COM` | `0` | 历史异常样本描述 | `CCFG-AC-R1-COM,ID`（原始串含逗号歧义） | 列表红色异常/编辑 40942/`CCFG-AC-013/065/066/067/068` |
| `CCFG-AC-R1-ABN` | `X` | 非 0/1 样本描述 | `mock7`（真实停用且重复分配源） | 非 0/1 状态展示/异常源标签/重复占用（AC-002/013/025/026/027） |

**数据源（`CDC_DATA_SOURCE`，9 行，全部 SOURCE+ORACLE+启用，`CCFG-AC-R1-` 前缀，良性占位连接值，密码列未打印/未选择）：**

| DATA_SOURCE_ID | 说明 |
|---|---|
| `CCFG-AC-R1-DS01` … `CCFG-AC-R1-DS07` | 供 ON 夹具持有的 7 个合法源库（人工验收机构 01~07） |
| `CCFG-AC-R1-DS08` | 供 OFF 夹具持有的停用探针占用源 |
| `CCFG-AC-R1-COM,ID` | ID 含英文逗号样本（候选置灰禁选 + 行级歧义展示） |

> 敏感列处理：夹具数据源 `DATA_SOURCE_PASSWORD` 填唯一良性占位 `CCFG-AC-R1-FAKE-PW`，本报告与全部证据**未打印、未选择、未回显**该列。连接类主机/端口/账号/服务名为开发库样板值（`192.168.174.70:1521`/`CCFG_AC_R1`/`prod.enmotech.com`），仅为满足 NOT NULL，不作为真实连接用途。

### 8.2 人工验收完成后的清理 SQL（由独立任务执行；按主键/完整 ID 清单限定，先删探针再删数据源）

```sql
-- 1) 删除本任务保留的人工验收夹具探针（4 行，按完整 ID 清单）
DELETE FROM CDC.CDC_CLIENT_MULTIPLE WHERE CLIENT_ID IN (
  'CCFG-AC-R1-ON',
  'CCFG-AC-R1-OFF',
  'CCFG-AC-R1-HIST-COM',
  'CCFG-AC-R1-ABN'
);
-- 2) 删除本任务保留的人工验收夹具数据源（9 行，按完整 ID 清单）
DELETE FROM CDC.CDC_DATA_SOURCE WHERE DATA_SOURCE_ID IN (
  'CCFG-AC-R1-DS01','CCFG-AC-R1-DS02','CCFG-AC-R1-DS03','CCFG-AC-R1-DS04',
  'CCFG-AC-R1-DS05','CCFG-AC-R1-DS06','CCFG-AC-R1-DS07','CCFG-AC-R1-DS08',
  'CCFG-AC-R1-COM,ID'
);
```

删除条件不会命中非本任务数据的证明：写入前（§5.1 第 4 项）`CCFG-AC-` 前缀在两张当前表与两张备份表命中均为 0；本任务产生的全部 `CCFG-AC-R1-` 行均由本任务按前缀 ID 创建并逐一按完整 ID 清单限定；保留集经终态核验存在且无其他前缀行残留（§6.9）。清理由独立任务执行，本任务不自动清理。

## 9. 项目负责人访问地址与外网验证状态（对应任务 §9）

- 本机（服务器自身）已验证：后端 `GET http://127.0.0.1:8080/` = 200；前端 `http://192.168.174.70:5173/` = 200、`http://192.168.174.70:5173/config/client` = 200（SPA 回退可达）；经前端代理 `:5173/api/clients?...` = 200（含夹具行）。
- 供项目负责人 Windows 浏览器打开的**完整验收 URL**：`http://192.168.174.70:5173/config/client`（页面名称“探针端管理”；前端开发服务绑定 `0.0.0.0:5173`，`/api` 已代理至 `127.0.0.1:8080`）。
- 外网可达边界：本机对 `192.168.174.70:5173` 的 HTTP 复验仅证明服务器本机经该外部 IP 可访问；**未实测项目负责人浏览器侧网络**，按 §9 标记为 `EXTERNAL_ACCESS_NOT_VERIFIED`。若浏览器无法访问，请检查服务器防火墙/端口策略/反向代理；Agent 未修改也不擅自修改服务器防火墙、安全策略、代理或网络配置。
- 本机 curl 成功不代表项目负责人浏览器已完成验收；验收结果由项目负责人人工判定。

## 10. PID / 端口 / 日志 / 缺陷与未覆盖项（对应任务 §13 之 7~9）

### 10.1 进程与访问信息（保持运行，供人工验收；不得由 Agent 擅自停止）

| 项 | 值 |
|---|---|
| 后端 | `java -jar backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`，PID `18903`，监听 `*:8080` |
| 后端日志 | `/tmp/ccfg-ac-prep-001/backend-start.log`（临时，不提交） |
| 前端 | `npm run dev`（vite），PID `19137`，监听 `0.0.0.0:5173` |
| 前端日志 | `/tmp/ccfg-ac-prep-001/frontend-dev.log`（临时，不提交） |
| 停止命令 | 前端：`kill 19137`；后端：`kill 18903`（人工验收完成后由负责人决定是否停止；本任务成功时保持运行） |

### 10.2 失败 / 阻断 / 未覆盖项汇总

- 无功能缺陷；未触发 §11 `CHANGES_REQUIRED`（真实联调全部按预期返回，见 §6.11）。
- 未覆盖项：并发场景 `CCFG-AC-030④/064`（按批准口径不执行）；行内重复展示样本 `CCFG-AC-015`（未保留夹具，需另行临时构造观察）；序列化 >1000 BYTE 未对真实 DB 制造写入（AC-034 之边界）；`CCFG-AC-012` 超长机构 Tooltip 依赖现网/夹具中存在足够长的机构名。
- 需人工目视（§10 名单）：页面整体视觉、菜单名与五列布局、单击/双击/删除所选、7 源拥挤度与前 3+`+N`、空描述占位与 Tooltip、探针 ID 只读/解锁/取消、自动生成按钮与覆盖、启停/删除确认交互、1366×768 与 1920×1080 弹窗滚动、Tab/Enter/Space 键盘、错误提示与整体感受。
- 边界：不连接源/目标 Oracle 业务库、不测连接、不读源 Schema；不操作 ZK/Kafka；不启停 `sync-client/server/log/monitor`；并发不测（无表锁/`FOR UPDATE`/50050/ORA-30006）。

## 11. 数据库 / ZooKeeper / 其他程序写操作边界（对应任务 §13 之 10~11、§3）

- 数据库 DML 仅发生在本任务授权范围内两张当前表：`CDC_DATA_SOURCE`、`CDC_CLIENT_MULTIPLE`；全部行级操作按主键/完整 `CCFG-AC-R1-` ID 清单限定，写后均核对影响行数（`INSERT=1`/`UPDATE=1`/`DELETE=1`）。
- 备份表 `CDC_DATA_SOURCE_2026_09_01`、`CDC_CLIENT_MULTIPLE_2026_09_05`：只读，**零写入**（终态计数 `19`/`7` 不变）。
- DDL：**零**（无 CREATE/ALTER/DROP/TRUNCATE/COMMENT/GRANT/REVOKE）。
- 真实业务行：**零修改**（`CCFG-AC-` 前缀在两张当前表及备份表原命中为 0，终态仅含本任务夹具行）。
- 数据源密码列：从未 `SELECT`/打印/回显；夹具密码为唯一良性占位值。
- ZooKeeper / Kafka：`NOT_RUN_NOT_AUTHORIZED`（未连接、未读写）。
- 本仓库前后端以外的 CDC 程序（`sync-client/server/log/monitor`）：未启动、未停止、未触碰。

## 12. 变更文件、Commit、Push 与远程一致性（对应任务 §12/§14）

- 唯一新增文件：`docs/features/client-config/reports/CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001-R1.md`（本报告）。
- 提交前核验：六份批准文档、业务代码、测试、配置相对基线 `84d3cdc...` 零差异；`ACCEPTANCE.md` 76 条仍全 `NOT_RUN`；staged 仅本报告；`git diff --check` 通过。
- 提交信息（按 §14 建议）：`docs(client-config): prepare user acceptance environment R1 [CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001-R1]`。
- Push：普通 Push 到 `origin/develop`，禁止 force；Push 后核验 `HEAD == origin/develop == git ls-remote`、ahead/behind=`0 0`。
- 本报告不写入包含自身的最终 Commit ID（避免自引用）；实际 Commit/Push 结果与远程一致性以上下文“控制台结果块”输出为准。

## 13. 正式验收状态边界声明

**正式验收状态仍为 `NOT_RUN`（`CCFG-AC-001~076` 共 76 条），等待项目负责人亲自验收。** 本任务仅准备证据与可访问页面，不进入正式验收收口，不清理人工验收夹具，不自行批准。
