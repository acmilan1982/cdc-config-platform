# 探针端管理 CRUD 边界与并发验收执行报告

- 任务编号：`CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003`
- 执行日期：2026-11-05
- 分支：`develop`
- 开工基线：`e0b0048ce530c46c397917dd8bbce8b6b59fabe7`（= 开工时 `origin/develop`）
- 验收入口：`http://192.168.174.70:5173/config/client`
- 证据目录：`reports/evidence/CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003/`

## 1. 结论摘要

本批按负责人既有授权，在 Oracle 开发库与 `/config/client` 范围执行 10 条目标 AC 的真实页面/API 验收。逐条判定如下：

| AC | 原状态 | 本批结论 | 核心依据 |
|---|---|---|---|
| `CCFG-AC-021` | NOT_RUN | **PASS** | 删除取消零写、确认物理删除、5 条运行态关联与 ZK 不变 |
| `CCFG-AC-024` | NOT_RUN | **PASS** | 启用二次确认、取消零写、仅 `FG_ACTIVE→1` |
| `CCFG-AC-027` | BLOCKED | **PASS** | 停用/不存在/逗号不阻止停用删除；重复分配阻止启用并提示冲突探针 |
| `CCFG-AC-030` | BLOCKED | **PASS** | 三种大小写变体与绕过均 `40940`；混合大小写保留；并发双成功无锁超时 |
| `CCFG-AC-033` | NOT_RUN | **PASS** | 页面 256 码点、后端 1024 UTF-8 字节边界一致；原文持久化 |
| `CCFG-AC-038` | NOT_RUN | **PASS** | 改名成功，旧 ID 行消失，4 条运行态关联仍挂旧 ID |
| `CCFG-AC-064` | NOT_RUN | **PASS** | 三组并发均双成功，每请求先预检，无锁表，重复分配可见 |
| `CCFG-AC-075` | BLOCKED | **PASS**（可验证范围） | 失败事件/句柄日志/SCN/执行计划零行，ZK 不变，源码无调用路径 |
| `CCFG-AC-076` | BLOCKED | **PASS** | 元数据前后一致、无迁移/DDL、页面无实时生效文案 |
| `CCFG-AC-128` | BLOCKED | **PASS** | 键入/粘贴 32 位上限、非法字符不静默改写、字段错误、后端兜底 |

- `changed_ids`：`CCFG-AC-021, CCFG-AC-024, CCFG-AC-027, CCFG-AC-030, CCFG-AC-033, CCFG-AC-038, CCFG-AC-064, CCFG-AC-075, CCFG-AC-076, CCFG-AC-128`
- 四态统计：`PASS 135 / FAIL 0 / BLOCKED 22 / NOT_RUN 0 = 157`
- 业务写请求 44 次（28 成功 / 16 业务拒绝），另有 8 次前端拦截提交；夹具 DML 52 条。
- 既有 235 条数据源逐字节未变；未清理、未恢复两表测试数据（按授权）。
- 本批 10 条通过**不等于** 157 条整体验收通过，**不等于** Feature 正式接受或页面迁移授权。

## 2. 业务执行事实

### 2.1 服务与环境

- 后端 PID `3327`，监听 `*:8080`，既有 jar SHA256 `efdbea827b6ab84dd47105d2cc130f0bc3c5b70dc78cc626b6421e1f9750a459`。
- 前端 npm PID `3373`、Vite PID `3385`，监听 `0.0.0.0:5173`。
- JDK 1.8.0_202、Maven 3.8.8、Node v24.17.0、Playwright Core 1.59.1、Chromium 147.0.7727.15。
- 详细环境与验证边界见 `evidence/.../environment-and-versions.md`。

### 2.2 夹具与动作分离

夹具只写 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`，全部带 `S3AC` 批次标识，写前按精确 ID 核对不存在：

| 脚本 | 内容 | 实际输出 |
|---|---|---|
| `001-fixture-prepare.sql` | 28 源 INSERT + 16 探针 INSERT + COMMIT | 44 行 created，exit 0 |
| `002-fixture-adjust-isolation.sql` | 2 源 INSERT + 5 探针 UPDATE + COMMIT | 7 行成功，异常类型隔离 |
| `003-ac033-raw-source.sql` | 1 源 INSERT + COMMIT | 1 行 created，共 31 条 S3AC 源 |

- 夹具 DML 合计 52 条（47 INSERT + 5 UPDATE + 3 COMMIT）。
- `c-dssr1-0906-a` / `-b` 为既有 Agent 合成探针，创建证据：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1/db/002-insert-master.sql`（第 13/17 行探针、第 64 行起运行态），非真实业务对象。
- 所有合成连接值仅为占位（`10.255.255.1` / `s3ac` / `s3ac-synthetic`），未做源库连接测试。

### 2.3 业务写尝试账本

| AC | 请求 | 成功 | 业务拒绝 | 前端拦截 | 证据 |
|---|---:|---:|---:|---:|---|
| 021 | 1 DELETE | 1 | 0 | 0 | `results/ac021-delete.json` |
| 024 | 1 enable | 1 | 0 | 0 | `results/ac024-enable.json` |
| 027 | 12 | 11 | 1×40941 | 0 | `results/ac027-*.json` |
| 030 | 6 | 2 | 4×40940 | 0 | `results/ac030-sequential.json` |
| 033 | 7 | 4 | 3×40102 | 1 | `results/ac033-desc.json` |
| 038 | 1 PUT | 1 | 0 | 0 | `results/ac038-rename.json` |
| 064 | 8 | 8 | 0 | 0 | `results/concurrency.json` |
| 128 | 8 API | 0 | 8×40100/40101 | 7 | `results/ac128-id-input.json` |
| **合计** | **44** | **28** | **16** | **8** | 提交尝试 52 |

并发双成功为定义明确允许；未做重试刷取。

### 2.4 数据完整性

- 既有 235 条数据源六字段在验收前后逐字节一致（`results/preexisting-data-sources.txt` 与 `results/final-checks.txt` 前 235 行 diff 为空）。
- 验收终态：探针 83、数据源 266、运行态 30（仅既有 `c-dssr1` 29 行 + 1 行其他既有）。
- `CDC_JOB_FAILURE_EVENT` 47、`CDC_JOB_FAILURE_HANDLE_LOG` 152 总数未因本批变化；对 `S3AC%`、`c-dssr1-%`、`PROBE-001`、`RACE-001` 计数均为 0。
- ZK `/bsoft-cdc/clients` 两次只读观察均为 `[hosp-012]`，未出现任何合成探针。
- 未执行 DDL；验收前后列/约束元数据逐字节一致。

## 3. 逐 AC 证据与判定

完整矩阵见 `evidence/.../judgment-matrix.md`；以下逐条给出前置、动作、预期、实际、证据键与状态。

### 3.1 `CCFG-AC-021` — PASS

- 前置：`c-dssr1-0906-a` 存在且有 5 条运行态关联；页面可固定选中该行。
- 动作：删除菜单 → 取消；再次 → 确认。
- 预期：取消不请求且行保留、固定选中不变；确认后物理删除、重载列表、不清洗关联表/ZK/Kafka。
- 实际：取消 `deleteRequests=0`、行仍在、选中保留；确认 `DELETE` 200，`GET ?status=ALL` 重载；行不存在；运行态 5 行逐字段未变；其他探针 76、其他源 265；ZK 不变。
- 证据键：`results/ac021-delete.json`（`cancel`、`confirm.deleteResponse`、`post`）、`results/ac021-postcheck.txt`、`results/zk-clients-before-after.txt`。
- 状态：**PASS**。删除成功后的固定选中清除由 `CCFG-AC-144` 独立定义，本轮未重复计分。

### 3.2 `CCFG-AC-024` — PASS

- 前置：`S3AC-C024-OFF` 停用，关联源启用。
- 动作：启用 → 取消；再次 → 确认。
- 预期：二次确认；取消不调用接口；成功仅 `FG_ACTIVE→1`；不直接启停/通知 `sync-client`，不写 ZK/Kafka。
- 实际：确认框文案与类名正确；取消 `putRequests=0`；确认 `PUT .../enable` 200；回读 `FG_ACTIVE='1'`，描述/源不变；源 `FG_ACTIVE='1'` 不变；ZK 不变；源码无运行侧调用。
- 证据键：`results/ac024-enable.json`、`results/ac024-postcheck.txt`、`results/static-checks.txt`。
- 状态：**PASS**。

### 3.3 `CCFG-AC-027` — PASS

- 前置：四类异常各一隔离样本（停用、不存在、含逗号、重复分配）；重复分配组含已停用持有者 `S3AC-C027DA`。
- 动作：对每类执行停用、删除；对前三类执行启用；对重复分配执行启用。
- 预期：前三类异常不阻止停用/删除，除重复分配外不阻止启用；重复分配启用给出冲突提示。
- 实际：4 停用 + 4 删除 + 3 启用全部 200 且终态正确；重复分配启用 `40941`，提示「已分配给探针：S3AC-C027DA，不能重复分配。」。
- 证据键：`results/ac027-disable-delete.json`、`results/ac027-enable.json`。
- 状态：**PASS**。

### 3.4 `CCFG-AC-030` — PASS

- 前置：`probe-001` 先经真实页面建立；`race-001`/`RACE-001` 不存在。
- 动作：三种大小写变体页面提交；混合大小写保存；绕过前端提交；两独立 socket 并发提交竞态 ID。
- 预期：三种变体按不区分大小写判重拒绝；无冲突保存保留原大小写；绕过仍拒绝；并发允许双成功且无锁超时。
- 实际：三变体均 `40940` 且有字段错误；绕过 `40940`；`S3AC-C030-MiXeD` 与 `probe-001` 原大小写回读；竞态两笔均 200 且并存；后端日志两线程先预检再 INSERT。
- 证据键：`results/ac030-sequential.json`、`results/concurrency.json`（`scenarios.raceIds`）、`results/backend-log-concurrency-window.txt`。
- 状态：**PASS**。

### 3.5 `CCFG-AC-033` — PASS

- 动作：页面空白描述；页面键入 300 Emoji；API 六组边界。
- 预期：空白拒绝；页面 256 码点；后端 UTF-8 1024 字节；超限拒绝；Emoji 按真实字节；原文持久化。
- 实际：空白字段错误「探针描述不能为空。」且零请求；300 Emoji 截断为 256 码点/1024 字节保存成功；ASCII 1024 成功/1025 拒绝；825 码点/1025 字节拒绝；Emoji 256/1024 成功、257/1028 拒绝；含空白原文逐字节回读一致；`LENGTHB<=1024` 全部成立。
- 证据键：`results/ac033-desc.json`、`results/ac033-postcheck.txt`。
- 状态：**PASS**。

### 3.6 `CCFG-AC-038` — PASS

- 前置：`c-dssr1-0906-b` 有 4 条运行态关联。
- 动作：编辑页解除 ID 锁定，改名 `S3AC-C038-RENAMED` 并保存。
- 预期：改名成功；不检查/不修改/不级联其他表、进程、ZK、Kafka。
- 实际：`PUT` 200；旧行消失、新行存在；运行态仍为旧 ID 下 4 行、新 ID 下 0 行；ZK 不变；源不变。
- 证据键：`results/ac038-rename.json`、`results/ac038-postcheck.txt`。
- 状态：**PASS**。

### 3.7 `CCFG-AC-064` — PASS

- 前置：三个争抢源均无持有者；编辑目标源不冲突。
- 动作：同一门闩放行两个独立 socket，执行 insert×insert、edit×edit、insert×edit。
- 预期：每请求写前检查；无 `LOCK TABLE`；允许一笔或两笔成功；重复时按异常规则展示。
- 实际：三组均两笔 200；发送差 1–5 ms、响应 23–57 ms；终态每源两行；列表显示重复分配异常及冲突探针；后端日志每线程先 `selectFullScan`+`selectSafeAll`；源码无锁表。
- 证据键：`results/concurrency.json`、`results/pre-concurrency.json`、`results/concurrency-postcheck.txt`、`results/backend-log-concurrency-window.txt`、`results/static-checks.txt`。
- 状态：**PASS**。

### 3.8 `CCFG-AC-075` — PASS（可验证范围）

- 动作：完成新增、编辑、删除、启用、停用后观察接口与对象。
- 预期：不处理与失败事件、句柄日志、ZK 节点、统计表或其他进程的级联关系。
- 实际：五类操作后，`CDC_JOB_FAILURE_EVENT`、`CDC_JOB_FAILURE_HANDLE_LOG`、`CDC_DATA_SOURCE_SCN`、`CDC_EXECUTION_PLAN` 对本批所有探针 ID 计数均为 0；运行态仅保留既有 29 行；ZK 两次相同；源码无对应调用路径。
- 证据键：`results/association-postcheck.txt`、`results/final-checks.txt`、`results/zk-clients-before-after.txt`、`results/static-checks.txt`。
- 边界：「其他进程」的运行侧不可直接观测，结论限于源码路径与可观察状态。
- 状态：**PASS**（在可验证范围内；已在报告中显式标注边界）。

### 3.9 `CCFG-AC-076` — PASS

- 动作：完成五类操作后检查数据库对象变更与页面提示。
- 预期：不新增物理外键、唯一索引、关联表或迁移脚本；不执行 DDL；页面不声称已实时作用于 `sync-client`。
- 实际：验收前后元数据逐字节一致；仅主键与 NOT NULL 约束，无 FK；无迁移产物；源码无 DDL；成功提示仅为「新增/编辑/删除/启用/停用成功」。
- 证据键：`results/schema-metadata-final.txt`、`results/static-checks.txt`、`results/ac021-delete.json`、`results/ac024-enable.json`。
- 状态：**PASS**。

### 3.10 `CCFG-AC-128` — PASS

- 前置：`/config/client` 新增弹窗；`probe-001` 供唯一性核对。
- 动作：真实键入/粘贴 40 位；键入非法字符并提交；绕过前端提交非法/33 位 ID。
- 预期：键入与粘贴均最多 32 位；非法字符不静默改写、给出字段错误；首位/字符集/判空/大小写唯一性与后端校验不变。
- 实际：键入与粘贴均截断 32 位；非法输入原样保留、`postDelta=0`、字段错误明确；空/空白提示必填；后端 `40101`/`40100` 拒绝且不新增；唯一性由 AC-030 四次 `40940` 佐证。
- 证据键：`results/ac128-id-input.json`、`results/ac030-sequential.json`。
- 状态：**PASS**。

## 4. 文档变更与统计

- 修改：`docs/features/client-config/ACCEPTANCE.md` 仅 10 个目标状态格（`NOT_RUN`/`BLOCKED` → `PASS`），定义行文字未改。
- 修改：`docs/features/client-config/README.md` 仅追加本批“现行下一入口”导航段。
- 新增：本报告 + 证据目录（探针、夹具、SQL、脱敏结果、静态核对、SHA256SUMS）。
- 四态：`PASS 135 / FAIL 0 / BLOCKED 22 / NOT_RUN 0 = 157`；157 个 AC ID 唯一且行数一致。
- 定义行计数保持 `REQ 154 / AC 157 / DESIGN 89 / UI 77`。
- 未改产品代码、测试、依赖、配置、模板或其他 Feature；未暂存 `.claude/settings.local.json`、`docs/prompts/**`、`runtime-logs/**`。

## 5. 边界与遗留

- 本批 10 条通过不等于 157 条整体验收通过，也不等于 Feature 正式接受或页面迁移授权。
- 运行侧（`sync-client`/`sync-server` 进程、Kafka、真实 ZK 写）未调用、未模拟；AC-075/076 的进程侧结论有明确可验证边界。
- 按授权，两表测试数据不清理、不恢复，不报告 `RESTORED`。
- 剩余 22 条 `BLOCKED` 留待后续批次，本批未处理。
- 未预填自身提交 SHA，不宣告远程复审通过。

## 6. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_CRUD_BOUNDARY_AND_CONCURRENCY_ACCEPTANCE_003_REVIEW`（对象为本任务结果提交，由 ChatGPT 从远程 Git 对报告与脱敏证据做独立只读复审）。
