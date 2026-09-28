# R3 证据索引（脱敏）

本目录为任务 `CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R3` 的**脱敏、可追溯**证据，供 ChatGPT 从远程 Git 复审本轮纠错使用。

## 内容

| 文件 | 说明 |
|---|---|
| `coverage-matrix.json` | R2 后仍为 `PASS` 的 **89** 条**逐步骤**覆盖矩阵（机读）：每条列出拆分出的关键 PRE/STEP/EXP、对应原始证据文件+JSON 键+字段、逐步 `COVERED`/`MISSING`/`SIMULATED_ONLY` 判定与理由、整条建议状态与理由 |
| `coverage-matrix.md` | 同上的 Markdown 视图，便于远程逐条阅读 |
| `build-coverage-matrix.py` | 矩阵生成脚本。脚本内嵌**人工逐条审核**的步骤拆分与判定结果，仅做组织与渲染；**不**由 `v:PASS`/`all:true`/`hasNoOverflow:true` 等结果布尔值自动推导覆盖 |
| `SHA256SUMS.txt` | 原始证据包完整 SHA-256，及解包后 JSON 成员的 SHA-256（仅哈希与文件名） |
| `verify-definition-protection.py` | 离线核验脚本：验证 §4 仅有状态格变化、其余定义逐字节不变、编号完整唯一连续、四态统计自洽、状态迁移与矩阵 `r3_changed_ids` 逐条对齐、四份现行统计一致 |
| `matrix-notes.md` | 覆盖判定口径、证据边界与环境/数据限制说明 |

## 与 R2 索引的时序关系

- R2 版索引作为**历史快照**保留在 `../CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R2/`，**未改写**；
- 本 R3 目录为**当前状态**：在 R2 保留的 89 条 `PASS` 上建立逐步骤矩阵，本轮据此下调 **18** 条为 `BLOCKED`；
- 两版**并存**、可逐条对照；不得把 R2 快照静默改写为 R3。

## 原始证据包（未入仓）

- 路径（执行机器）：`/root/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-evidence.tar.gz`
- 完整 SHA-256：`1cf178aefb03b0727e5b036ee66123631cf8d4a525622177749e258e0a5e15e6`
- 本次复核前后成员哈希一致（见 `SHA256SUMS.txt`），原始归档**未被改写**。
- 归档**未**提交公开仓库：其内含内网地址/连接串、可识别业务数据（如机构名称）与未经审核截图。

## 脱敏规则

本目录**只**保留：用例编号、逐步判定、证据文件名与 JSON 键名、字段路径、子步骤完成情况、下调原因摘要。
**不**包含：数据库连接信息、内网主机/端口、账号口令或令牌、可识别业务数据、原始截图或原始归档内容。
业务可识别值（机构名称、探针 ID、原始数据源 ID 等）以占位/描述替代；保留原始文件名、键名与字段路径，便于持有原包者逐项对账。
不通过改写源数据伪造原始运行结果；脱敏后的例子**不**代表新的执行结果。

## 核验

```bash
python3 docs/features/client-config/reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R3/verify-definition-protection.py 999de14087f0d4ae1054d7d50fb4cca09dd910dd
```
