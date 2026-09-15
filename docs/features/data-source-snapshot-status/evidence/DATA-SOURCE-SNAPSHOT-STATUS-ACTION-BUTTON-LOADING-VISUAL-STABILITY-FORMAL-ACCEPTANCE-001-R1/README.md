# R1 证据索引（DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001-R1）

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001-R1`
- 基准提交：`eeafac6fb1030615bb17f21f35da9f2043597903`
- 日期：2026-09-15
- 性质：**纯文档与证据事实一致性定向纠正**。不重新执行正式验收，不修改前端/后端/测试代码，不改变 6 条新验收均为 PASS 的结论，不执行最终接受收口。
- 本轮范围：只纠正「当前状态 / 统计 / 下一入口」事实、`ACCEPTANCE.md` §4.23 现行事实、ZooKeeper 当前环境分层口径，以及 R0 负向自测退出码事实。

## 目录

### browser/ —— 页面无关的严格判定 CLI（无浏览器、无页面、无服务、无后端、无数据库、无 ZooKeeper）

| 文件 | 说明 | sha256 |
|---|---|---|
| `browser/harness/assert-result.mjs` | 页面无关 CLI，复用 R0 同一 `evaluateAcceptanceResult()`（不复制判定逻辑），传 PASS 结果退出 0，传 FAIL 结果退出 1 并打印失败字段（用法错误退出 2） | `a7488a44277ec62260ee9a86dea500fd22e5ee8200bf757b1fdbecf03c5bfb28` |
| `browser/original-result-assertion.txt` | 对 R0 `acceptance-matrix.json` 的实际运行输出（`passed=true`、`failure_count=0`、`check_count=294`） | `989756558f8f19c7beb5528b0b6722120e072ff54ffe26c6cf7f6f0eff1c671c` |
| `browser/negative-control-assertion.txt` | 对注入 0.001px 的对照 JSON 的实际运行输出（`passed=false`、`failure_count=3`，含未取整的 0.001 级误差与失败字段） | `55712e9b862d8701e0b861c55509c1fa4153e36b4f3adfd28ef1db0c3b99fa23` |
| `browser/negative-control-injection-record.txt` | 注入记录（`queryBtn.w 62 → 62.001`、`refreshBtn.y 241.5 → 241.501`，仅 1920x1080 MANUAL_LOADING；标记字段 `__R1_NEGATIVE_CONTROL__`） | `9ca5822afb42774806a78d5b64189dc6baadf8e2419f11565ab42184f8939ca3` |
| `browser/NEGATIVE-CONTROL-0.001PX-DO-NOT-USE-AS-ACCEPTANCE-EVIDENCE.json` | 对照用结果 JSON 副本；文件名含 `NEGATIVE-CONTROL` 与 `DO-NOT-USE-AS-ACCEPTANCE-EVIDENCE`，**不得作为 PASS 依据，且未覆盖 R0 原始 `acceptance-matrix.json`** | `3a744e88f3d00d3cd6a315863bdee0b7c5932ed81b6550809f287c16c55eedcd` |
| `browser/cli-run-record.txt` | 命令、stdout、stderr 与 **shell 捕获的真实子进程退出码**（原始结果 `exit 0`，负向对照 `exit 1`） | `ba87b03ecb1504e9568e21ddf53cdf1c69fa34617ef8d7aa1dd57ffea679abc7` |

R0 原始 `acceptance-matrix.json` sha256 = `e90e8bf398a8018523f6bc237a6c5c9acb78f0f4bfd3e80f45aa7a743c4e506e`（不在本目录内，位于 R0 证据目录，未改动）。

### git/ —— 冻结边界、一致性、追加与凭据证据

| 文件 | 说明 |
|---|---|
| `git/01-scope-and-base.txt` | 白名单审计与基准/远程前置条件（`paths_outside_whitelist=0`） |
| `git/02-frozen-boundary-proof.txt` | 冻结边界证明（前端/后端/测试零差异、89 条需求字节一致、113 条验收全 PASS 且仅 108/110 前置条件更正、DESIGN §31 / UI §25 / API §9 / DATABASE §14 契约正文未变） |
| `git/03-diff-check.txt` | `git diff --check` 与 `git diff --cached --check` 真实退出码 0；新证据无 CRLF、无行尾空白 |
| `git/04-credential-scan.txt` | 凭据扫描（密码 / Token / Cookie / Authorization / 私钥 / 完整连接串 / 开发库地址端口 均为 0） |
| `git/05-r0-report-append-only-proof.txt` | R0 报告仅追加证明（基 17900 字节为精确前缀，前缀 sha256 一致，0 删除 / 0 改写） |
| `git/06-r0-evidence-unchanged-proof.txt` | R0 证据目录逐文件哈希零变化（49/49 一致，无新增） |
| `git/07-doc-consistency-check.txt` | 8 份入口文档一致性（统一当前值/统计/ZooKeeper 分层/R1 下一入口；旧入口仅作历史；现行层冲突 0） |
| `git/08-rows-and-traceability-check.txt` | 行与追踪矩阵（89 连续唯一、113 连续唯一全 PASS、89/89 与 113/113） |

## 结论

- R0 负向自测真实进程退出码 = `0`（`evaluateAcceptanceResult()` 已检出变异；R0 报告已按仅追加方式在 §10.1 更正）。
- R1 页面无关 CLI 真实退出码：原始结果 `0`、负向对照 `1`（shell 捕获，见 `browser/cli-run-record.txt`）。
- 本目录为**新增**证据目录，位于 R0 证据目录之外；R0 证据目录逐文件零改动。
