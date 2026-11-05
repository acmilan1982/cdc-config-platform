# R1 证据索引（AC-034、AC-057 定向补证）

- 任务：`CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1`
- 执行日期：2026-11-05
- 分支：`develop`
- 基线提交：`6c72727b4e77efc15034af0dc44242e15ced094f`
- 执行报告：`../../CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1.md`
- 前序证据：`../CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002/`（R0 运行 JSON/SQL 输出/历史探针保持原字节）

本目录只包含 R1 新增的两项真实运行证据、修正版探针与 R1 独立计数所需材料，不改写 R0 当时的响应或重算成新运行数据。

## 1. 文件

| 文件 | 用途 |
|---|---|
| `environment-and-versions.md` | R1 环境预检、START-ONLY 服务 PID/端口、产物 SHA256、验证边界 |
| `sql/fixture-prepare-r1.sql` | R1 夹具：32 条 AC-034 容量源 + 2 条 AC-057 源（S/R），34 INSERT + 1 COMMIT |
| `results/fixture-prepare-r1.out` | 上述脚本单次执行的真实输出（34 行 created、1 次 Commit complete、exit 0） |
| `probes/probe-lib.cjs` | 公共库，复制自 R0 `probes/probe-lib.cjs`，SHA256 相同 |
| `probes/probe-ac034-r1.cjs` | AC-034：候选前置、真实新增页选择 32 源、真实 API 超限、独立回读、1000B 复用核对 |
| `results/ac034-r1-results.json` | 上述探针完整请求/响应/前置/回读结果 |
| `probes/probe-exact1000-refresh.cjs` | AC-034：对既有 1000B 记录经真实编辑 API 重新保存（漂移后的新成功腿） |
| `results/ac034-exact1000-refresh.json` | 上述刷新腿的请求、响应与持久化回读 |
| `probes/probe-ac057-r1.cjs` | AC-057：创建 A → 停用 → B 被 40941 阻断 → 编辑移除 S → B 成功取得 S |
| `results/ac057-r1-results.json` | 上述探针每步请求/响应/A 与 B 的 API 回读 |
| `results/r1-fixtures.csv` | 从数据库导出的 R1 夹具行（源 34 行、探针 2 行），采集时点 2026-11-05 |
| `results/r1-sql-verification.txt` | 独立 SQL 核对（源存在/可选/未占用、无超限行、A/B 终态、1000B 持久化、总行数） |
| `results/legacy-probe-dependency-check.txt` | R0 历史探针修正副本的相对依赖与语法静态核对记录 |
| `results/preexisting-source-check.txt` | 既有 37 条数据源在本批前后的六字段比对（缺失 0、变化 0） |
| `probes/legacy-r0/` | R0 历史探针的修正版副本（仅静态核对，未执行） |
| `samples/r1-synthetic-source-ids.txt` | R1 34 条合成源 ID |
| `samples/r1-synthetic-sources.csv`、`samples/r1-synthetic-clients.csv` | R1 夹具字段快照（仅合成值） |
| `SHA256SUMS` | 本目录文件校验和 |

## 2. 准备与执行顺序

依赖：本机真实前端 `:5173`、后端 `:8080`、既有 Oracle 开发库；Playwright Core 与 Chromium 为服务器既有版本（路径见 `environment-and-versions.md`）。所有探针只访问 `/config/client` 页面与 `/api/clients*` 接口。

1. **服务**：按 `environment-and-versions.md` START-ONLY 复用既有后端 jar 与 Vite；不构建、不改配置。
2. **夹具（必须先于本批探针）**：`sql/fixture-prepare-r1.sql`。该脚本是本批 R1 真正的前置创建脚本，34 条 INSERT + 1 条 COMMIT，仅使用合成机构/主机/账号值；重复执行会因主键已存在而失败。
3. **AC-034**：`node probes/probe-ac034-r1.cjs`（先在真实新增页选择 32 个有效源并提交，再以同一集合调用真实 API，最后独立回读）。该探针每次运行会产生 2 次预期被拒绝的业务写请求（UI 1 次、API 1 次，均 40105）；重跑必须记账。
4. **AC-034 1000B 成功腿**：`node probes/probe-exact1000-refresh.cjs`。使用已持久化的 `S2AC-PCAP` 1000 字节载荷经真实编辑 API 重新保存；若该行不存在则此腿不可复用，需另备恰好 1000 字节的未占用集合。
5. **AC-057**：`node probes/probe-ac057-r1.cjs`。要求 `S2AC-R1A`、`S2AC-R1B` 不存在，`S2AC-R1S1`、`S2AC-R1R1` 存在且未被占用；每次运行产生 5 次业务写请求（4 成功、1 次 40941），重跑前必须清理或更换夹具。
6. **独立核对**：运行 `results/r1-sql-verification.txt` 对应的 SQL（只读）；本目录保存的是当次输出。

R0 历史探针副本（`probes/legacy-r0/`）仅用于证明依赖已修正、可静态解析，**本批未运行**，也不需要为它们另备新样本。其输出路径仍指向 R0 外部工作目录；如需复跑应在能重现 R0 前态的独立库上按前序 README 的限定说明进行。

## 3. 历史探针依赖修正

- R0 `probes/*.cjs` 中存在 `require('./lib.cjs')`，但提交的公共库名为 `probe-lib.cjs`；`probe-supplements.cjs` 另有 `require('./probe-lib.cjs')`，移动到副本目录后同样失效。
- 修正版副本统一改为 `require('../probe-lib.cjs')`，公共库复制自 R0 且 SHA256 一致（`1628c6ff…52ca2f`）。
- 逐文件 `node --check` 通过，未加载执行任何整段探针，未因此发出业务请求。

## 4. R0 缺失 CSV 与表述修正

- R0 `samples/synthetic-sources.csv`、`samples/synthetic-clients.csv` 的原始快照真实存在（R0 采集时点 2026-11-04 14:07，仅合成值），已脱敏检查后补入 R0 证据目录，并在 R0 README 标注采集时点。
- R0 README 的绝对“未使用 mock”已改为符合实际的限定：AC-055 空候选池/加载失败为标注的路由注入，AC-133 为只读观察；其余为真实页面/接口。
- R0 README 的复现顺序已改为明确说明合并 SQL 不是无条件前置脚本：其中 5 条探针行当时由真实 API 创建，脚本仅保留等价 INSERT。

## 5. 边界

- 本批两项补证完成不等于 157 条整体验收通过，也不等于 Feature 正式接受或页面迁移授权。
- R1 夹具按负责人授权保留、不清理、不恢复，因此不报告 `RESTORED`。
- 报告与证据不预填自身提交 SHA，不预宣布远程复审通过。
