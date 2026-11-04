# 证据索引

- 任务：`CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001`
- 执行日期：2026-11-04
- 分支：`develop`
- 起始提交：`2304e3181595889d87dcdcefb4ce612afcd5e58e`
- 执行报告：`../../CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001.md`

本目录保留本批 17 条验收的真实执行证据。所有探针均连接本机真实前端/后端（真实 Oracle 开发库），未使用 mock。直接 DML 仅用于前置夹具与后置读取，不替代被测页面/API 行为。

## 文件

| 文件 | 用途 |
|---|---|
| `environment-and-versions.md` | 环境预检、服务 PID/端口、产物 SHA256、验证边界 |
| `ac-matrix.md` | 逐 AC 覆盖矩阵与统计 |
| `fixture-prepare.sql` | 第一批夹具 DML（2 UPDATE + 10 INSERT） |
| `fixture-prepare-group-ef.sql` | 第二批夹具 DML（4 INSERT） |
| `probe-group-a.cjs` / `group-a-results.json` | AC-131、AC-031 |
| `probe-group-b.cjs` / `group-b-results.json` | AC-039、AC-054、AC-060、AC-040 |
| `probe-ac054-supplement.cjs` / `ac054-supplement-results.json` | AC-054 自有源可选性补充 |
| `probe-group-c.cjs` / `group-c-results.json` | AC-058、AC-061、AC-062、AC-121 |
| `probe-ac121-network-supplement.cjs` / `ac121-network-supplement-results.json` | AC-121 全局错误提示补充 |
| `probe-group-d.cjs` / `group-d-results.json` | AC-082、AC-026 |
| `probe-group-e.cjs` / `group-e-results.json` | AC-139、AC-140、AC-115 |
| `probe-ac115-supplement.cjs` / `ac115-supplement-results.json` | AC-115 非悬停黑色态与字段错误补充 |
| `probe-group-f.cjs` / `group-f-results.json` | AC-020、AC-145 |
| `group-f-sql-verification.txt` | AC-020/145 的 SQL 后置核对 |
| `retained-fixtures-snapshot.txt` | 任务结束时保留的 `MULTIAC-*` 样本快照 |
| `SHA256SUMS` | 本目录文件校验和 |

## 复现

1. 按 `environment-and-versions.md` 启动/复用后端（`:8080`）与前端（`:5173`）。
2. 执行 `fixture-prepare.sql`、`fixture-prepare-group-ef.sql` 准备夹具。
3. 按 `probe-group-a` → `f` 顺序运行探针，再运行三个补充探针。
4. 仅在报告 2.4 节列出的目标上使用注入（网络中断、延迟、请求体变异）；每个注入均在对应结果 JSON 中标注。

探针依赖既有 Playwright Core 与 Chromium；脚本头注释包含可执行路径与启动方式。

## 数据与脱敏

- 未保存凭据；数据库连接仅取自既有环境配置。
- 未保存真实源 ID、机构名称的原始响应全文与全屏截图；真实数据源以稳定别名 `CCFG-AC-R1-*` / `DS0x` 呈现。
- 本批生成的合成测试 ID/文本（如 `MULTIAC-*`）按授权保留在证据与数据库中。

## 边界

- 批次 17 条通过不等于 157 条整体验收通过，也不等于 Feature 正式接受或页面迁移授权。
- 保留样本未清理，未执行恢复动作，因此不报告 `RESTORED`。
