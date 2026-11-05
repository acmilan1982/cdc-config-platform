# 证据索引（CRUD 边界与并发验收 003）

- 任务：`CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003`
- 执行日期：2026-11-05
- 分支 / 基线：`develop` / `e0b0048ce530c46c397917dd8bbce8b6b59fabe7`
- 执行报告：`../../CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003.md`

本目录只保存本批 10 条 AC 的真实运行证据、夹具脚本、探针源码与静态核对输出；不覆盖任何历史报告或历史证据。

## 1. 文件

| 文件 | 用途 |
|---|---|
| `environment-and-versions.md` | 服务 PID/端口、产物 SHA256、工具版本、验证边界 |
| `judgment-matrix.md` | 10 条 AC 的前置/动作/预期/实际/证据键/状态矩阵 |
| `fixtures/000-precheck.sql` | 写前核对目标 ID 不存在 |
| `fixtures/001-fixture-prepare.sql` / `.out` | 28 条合成数据源 + 16 条合成探针（44 INSERT + COMMIT，真实输出 exit 0） |
| `fixtures/002-fixture-adjust-isolation.sql` / `.out` | AC-027 异常隔离：2 源 INSERT + 5 探针 UPDATE + COMMIT |
| `fixtures/003-ac033-raw-source.sql` / `.out` | AC-033 原始空白描述样本：1 源 INSERT + COMMIT |
| `probes/lib.cjs` | Playwright 公共库（真实页面/真实 API 请求记录） |
| `probes/probe-ac021-delete.cjs` | AC-021 删除取消/确认、物理删除、关联不变 |
| `probes/probe-ac024-enable.cjs` | AC-024 启用取消/确认、仅 `FG_ACTIVE→1` |
| `probes/probe-ac027-disable-delete.cjs` | AC-027 四类异常下的停用与删除 |
| `probes/probe-ac027-enable.cjs` | AC-027 三类可启用异常 + 重复分配阻断 |
| `probes/probe-ac038-rename.cjs` | AC-038 改名、旧 ID 行消失、历史关联不变 |
| `probes/probe-ac033-desc.cjs` | AC-033 页面 256 码点 / 后端 1024 字节边界 |
| `probes/probe-ac030-sequential.cjs` | AC-030 顺序大小写冲突、绕过 API、混合大小写保存 |
| `probes/probe-ac128-id-input.cjs` | AC-128 键入/粘贴 32 位、非法字符、后端绕过 |
| `probes/probe-concurrency.cjs` | AC-064 + AC-030 并发四场景（双 socket、同一门闩） |
| `results/*.json` | 上述探针的脱敏裁剪结果（保留全部请求/响应/字段错误/回读关键字段） |
| `results/ac0*-postcheck.txt` | 独立 SQL 只读回读（行存在性、终态、关联计数、字节长度） |
| `results/association-postcheck.txt` | `CDC_JOB_FAILURE_EVENT`、`HANDLE_LOG`、`RUN_STATE`、`SCN`、`EXECUTION_PLAN` 关联计数 |
| `results/final-checks.txt` | 终态：非合成源 235 行六字段 + 关联计数 + 总行数 |
| `results/preexisting-data-sources.txt` | 开工前既有 235 条数据源六字段快照 |
| `results/runstate-c-dssr1.txt` | AC-021/038 所用历史探针的既有运行态关联快照（5 + 4 + 5 行） |
| `results/schema-metadata-final.txt` | 验收后列/约束元数据（无 FK、无新增唯一索引、无 DDL） |
| `results/static-checks.txt` | 源码静态核对（无 DDL/锁表/ZK/Kafka/进程调用；页面反馈文案） |
| `results/zk-clients-before-after.txt` | `/bsoft-cdc/clients` 两次只读观察均为 `[hosp-012]` |
| `results/backend-log-concurrency-window.txt` | 并发窗口后端 SQL 日志摘录（每请求先全量预检，无锁表） |
| `sql/*.sql` | 上述独立回读所用 SQL（只读） |
| `SHA256SUMS` | 本目录文件校验和 |

## 2. 夹具与业务动作分离

- 夹具 DML 只写 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 两个已授权表；无 DDL、无其他表 DML、无 ZK/Kafka 写、无进程启停。
- 所有夹具对象带 `S3AC` 批次标识；写前用精确 ID 核对不存在（`000-precheck.sql`）。
- 验收业务动作全部经真实页面或真实 `/api/clients*`，持久化用独立 GET/SELECT 回读。
- 合成值仅为占位：主机 `10.255.255.1`、用户 `s3ac`、密码 `s3ac-synthetic`（非真实凭据，且不会被连接测试）。
- 夹具 DML 合计：44 + 7 + 1 = **52 条 DML**（47 INSERT + 5 UPDATE + 3 COMMIT）。
- 既有 235 条数据源六字段逐字节未变；既有非合成探针未被修改。

## 3. 业务写尝试账本

| AC | 业务写请求 | 成功 | 业务拒绝 | 前端拦截 | 证据键 |
|---|---:|---:|---:|---:|---|
| AC-021 | 1（DELETE） | 1 | 0 | 0（取消不请求） | `cancel.deleteRequests=0`、`confirm.deleteResponse`、`post.apiRow=null` |
| AC-024 | 1（enable） | 1 | 0 | 0（取消不请求） | `cancel.putRequests=0`、`confirm.enableResponse`、`post.fgActive=1` |
| AC-027 | 12 | 11 | 1（40941） | 0 | `disable[]`、`delete[]`、`allow[]`、`reject[]` |
| AC-030 | 6 | 2 | 4（40940） | 0 | `sequential.pageAttempts`、`sequential.bypass`、`after` |
| AC-033 | 7 | 4 | 3（40102） | 1（空白描述） | `page.emptyDesc`、`page.emojiBoundary`、`api[]` |
| AC-038 | 1（PUT） | 1 | 0 | 0 | `response`、`post.oldRow/newRow` |
| AC-064 | 8 | 8 | 0 | 0 | `scenarios.*.requests` |
| AC-128 | 8（API） | 0 | 8（40100/40101） | 7 | `illegalPage[]`、`apiBypass[]` |
| **合计** | **44** | **28** | **16** | **8** | 业务提交尝试 **52** |

- 并发场景两笔均成功属于 AC-064/AC-030 明确允许的结果，不按失败处理。
- 未做重试刷取；每次运行只发生表中列出的请求。

## 4. 复现顺序

1. 服务按 `environment-and-versions.md` START-ONLY；不构建。
2. 执行 `fixtures/001`、`002`、`003`（顺序不可颠倒；重复执行会因主键/状态已变更而失败）。
3. 依次运行 `probes/probe-ac021-delete.cjs`、`probe-ac024-enable.cjs`、`probe-ac027-disable-delete.cjs`、`probe-ac027-enable.cjs`、`probe-ac038-rename.cjs`、`probe-ac033-desc.cjs`、`probe-ac030-sequential.cjs`、`probe-ac128-id-input.cjs`、`probe-concurrency.cjs`。
4. 运行 `sql/*postcheck.sql` 与 `final-checks.sql` 只读回读。
5. 复现前须确认夹具 ID 尚不存在、`c-dssr1-0906-a`/`-b` 与 `race-001`/`RACE-001` 状态符合对应探针前置；不满足时更换合成 ID，不得修改既有真实对象。

## 5. 边界

- 本批 10 条通过不等于 157 条整体验收通过，也不等于 Feature 正式接受或页面迁移授权。
- 运行侧（`sync-client`/`sync-server` 进程、Kafka、真实 ZK 写入）未调用、未模拟；AC-075/076 对“其他进程”的结论由静态源码核对 + 可观察的 DB/ZK 零变化支持，属于**可验证范围**结论。
- 按负责人授权，两表测试数据不清理、不恢复，不报告 `RESTORED`。
- 报告与证据不预填自身提交 SHA，不宣告远程复审通过。
