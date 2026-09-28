# R5 证据索引（脱敏）

本目录为任务 `CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5` 的**脱敏、可追溯**证据，供 ChatGPT 从远程 Git 复审本轮纠错使用。R5 索引**取代 R4 索引的现行结论**；R0~R4 目录作为已提交历史快照保留，未改写。

## 内容

| 文件 | 说明 |
|---|---|
| `coverage-matrix.json` | 逐步骤覆盖矩阵（机读）：以 R4 已提交矩阵为基线，重判 `CCFG-AC-010`/`CCFG-AC-143` 两条；每条列证据文件+键+字段+**视口**+判定与理由，含 `r4_status`/`r5_status` |
| `coverage-matrix.md` | 同上的 Markdown 视图（列本轮涉及的两条） |
| `build-coverage-matrix.py` | 矩阵生成脚本。内嵌人工逐条审核结果与两条重判步骤；**不**由结果布尔值自动推导覆盖 |
| `SHA256SUMS.txt` | 原始证据包完整 SHA-256，及解包后 JSON 成员的 SHA-256（仅哈希与文件名） |
| `verify-coverage-matrix.py` | 离线核验脚本（见下） |
| `matrix-notes.md` | 覆盖判定口径、证据路径基准与两条重判的证据判定 |

## 核验器（`verify-coverage-matrix.py`）验证内容

1. **证据引用可解析性**：文件/键/字段路径/截图全部可解析（`meta.*` 指文件根，其余指 `ac[key].detail`，支持 `[n].x`）。
2. **矩阵状态与 `ACCEPTANCE.md` 一致**：每条 `r5_status` == §4 同名状态格。
3. **PASS 行严格性**：仍为 `PASS` 的行不得含 `MISSING`/`PARTIAL`；`SIMULATED_ONLY` 须带非空 `justify`；非 `COVERED` 须带非空 `why`。
4. **统计与迁移**：154 条四态合计自洽；矩阵 `r5_changed_ids` 与 §4 相对 R4 提交 `7389648` 的 `PASS->BLOCKED` 迁移逐条对齐；`counts.pass` == §4 `PASS`。
5. **独立断言（不只看文件/键/字段存在）**：
   - **AC-010**：直接扫描原包，确认不存在“绑定 6～7 源样本、非 1440 视口下的直接展示数量”记录 → 不得判 `PASS`；并要求矩阵确有标记 `AC010_WIDTH_CHANGE` 的未完成步骤；
   - **AC-143**：直接扫描原包，确认 143 相关键仅为已固定组（`accB#143`）与另一次 `+N`（`accC#143-plusN`），缺“未固定起始态”其余交互记录 → 不得判 `PASS`；并要求矩阵同时记录 `plusOpen:false` 与 `opened:true`，防止把未打开误读为已打开。
6. **现行统计签名**：`ACCEPTANCE.md`、`README.md`、R5 报告均含 `PASS` **66** / `FAIL` **0** / `BLOCKED` **73** / `NOT_RUN` **15**。

## 与 R4 索引的时序关系

- R4 版索引作为**历史快照**保留在 `../CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4/`，**未改写**；
- 本 R5 目录为**当前状态**：在 R4 基础上重判并下调 **2** 条（`010/143`）为 `BLOCKED`；
- 两版**并存**、可逐条对照；不得把 R4 快照静默改写为 R5。

## 原始证据包（未入仓）

- 路径（执行机器）：`/root/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-evidence.tar.gz`
- 完整 SHA-256：`1cf178aefb03b0727e5b036ee66123631cf8d4a525622177749e258e0a5e15e6`
- 本次复核前后成员哈希一致（见 `SHA256SUMS.txt`），原始归档**未被改写**。
- 归档**未**提交公开仓库：其内含内网地址/连接串、可识别业务数据（如机构名称）与未经审核截图。

## 脱敏规则

本目录**只**保留：用例编号、逐步判定、证据文件名与 JSON 键名、字段路径、视口、子步骤完成情况、下调原因摘要。
**不**包含：数据库连接信息、内网主机/端口、账号口令或令牌、可识别业务数据、原始截图或原始归档内容。

## 核验

```bash
# 需先解包原始证据包到仓库外目录（默认 /tmp/fa-evidence-r5，可用 R5_EVIDENCE_DIR 覆盖）
python3 docs/features/client-config/reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5/verify-coverage-matrix.py
```
