# R1 证据索引（脱敏）

本目录为任务 `CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R1` 的**脱敏、可追溯**证据索引，供 ChatGPT 从远程 Git 复审本次 R1 纠错使用。

## 内容

| 文件 | 说明 |
|---|---|
| `evidence-index.json` | 154 条逐条索引：`id`、R0 状态、R1 状态、证据文件名与 JSON 键名、下调用例的原因摘要 |
| `SHA256SUMS.txt` | 原始证据包完整 SHA-256，及解包后 JSON 成员的 SHA-256（仅哈希与文件名） |
| `verify-definition-protection.py` | 离线核验脚本：验证 §4 仅有状态格变化、其余定义逐字节不变、编号完整唯一连续、四态统计自洽 |

## 原始证据包（未入仓）

- 路径（执行机器）：`/root/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-evidence.tar.gz`
- 完整 SHA-256：`1cf178aefb03b0727e5b036ee66123631cf8d4a525622177749e258e0a5e15e6`
- 归档**未**提交公开仓库：其内含内网地址/连接串、可识别业务数据（如机构名称）与未经审核截图。

## 脱敏规则

本目录**只**保留：用例编号、判定、证据文件名与 JSON 键名、子步骤完成情况、缺失步骤摘要。
**不**包含：数据库连接信息、内网主机/端口、账号口令或令牌、可识别业务数据、原始截图或原始归档内容。
不通过改写源数据伪造原始运行结果——门禁核对（哈希、成员路径安全性、解包）结果见 R1 报告 §2。

## 核验

```bash
python3 docs/features/client-config/reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R1/verify-definition-protection.py beadaac6636b2d4df52849a74f05ce399bb398b1
```
