# R2 证据索引（脱敏）

本目录为任务 `CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R2` 的**脱敏、可追溯**证据索引，供 ChatGPT 从远程 Git 复审本次 R2 纠错使用。

## 内容

| 文件 | 说明 |
|---|---|
| `evidence-index.json` | 154 条逐条索引：`id`、R0/R1/R2 三轮状态、证据文件名与 JSON 键名、本 R2 下调原因摘要 |
| `SHA256SUMS.txt` | 原始证据包完整 SHA-256，及解包后 JSON 成员的 SHA-256（仅哈希与文件名） |
| `verify-definition-protection.py` | 离线核验脚本：验证 §4 仅有状态格变化、其余定义逐字节不变、编号完整唯一连续、四态统计自洽 |

## 与 R1 索引的时序关系

- R1 版索引作为**历史快照**保留在 `../CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R1/`，**未改写**；
- 本 R2 版索引为**当前状态**，以 `chronology` 字段标明 `r0_status`（归档 matrix 原始执行状态）、`r1_status`（R1 纠错后）、`r2_status`（本 R2 纠错后）。
- 两版**并存**、可逐条对照；不得把 R1 快照静默改写为 R2。

## 原始证据包（未入仓）

- 路径（执行机器）：`/root/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-evidence.tar.gz`
- 完整 SHA-256：`1cf178aefb03b0727e5b036ee66123631cf8d4a525622177749e258e0a5e15e6`
- 本次复核前后成员哈希一致（见 `SHA256SUMS.txt`），原始归档**未被改写**。
- 归档**未**提交公开仓库：其内含内网地址/连接串、可识别业务数据（如机构名称）与未经审核截图。

## 脱敏规则

本目录**只**保留：用例编号、各轮判定、证据文件名与 JSON 键名、子步骤完成情况、下调原因摘要。
**不**包含：数据库连接信息、内网主机/端口、账号口令或令牌、可识别业务数据、原始截图或原始归档内容。
不通过改写源数据伪造原始运行结果。

## 核验

```bash
python3 docs/features/client-config/reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R2/verify-definition-protection.py 5f3660102b850d9890211a0438c45eba4432c477
```
