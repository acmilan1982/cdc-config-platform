# R4 证据索引（脱敏）

本目录为任务 `CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4` 的**脱敏、可追溯**证据，供 ChatGPT 从远程 Git 复审本轮纠错使用。R4 索引**取代 R3 索引的现行结论**；R3 目录作为已提交历史快照保留，未改写。

## 内容

| 文件 | 说明 |
|---|---|
| `coverage-matrix.json` | R3 后仍为 `PASS` 的 **71** 条逐步骤覆盖矩阵（机读）：每条列出拆分出的关键 PRE/STEP/EXP、对应原始证据文件+JSON 键+字段路径、逐步判定与理由、整条 `r3_status`/`r4_status` 与理由 |
| `coverage-matrix.md` | 同上的 Markdown 视图，便于远程逐条阅读 |
| `build-coverage-matrix.py` | 矩阵生成脚本。以 R3 已提交矩阵为基线，应用**证据引用修复表**（29 处）与**三条重判**（`012/041/046`）；脚本内嵌人工逐条审核结果，仅做组织与渲染，**不**由结果布尔值自动推导覆盖 |
| `SHA256SUMS.txt` | 原始证据包完整 SHA-256，及解包后 JSON 成员的 SHA-256（仅哈希与文件名） |
| `verify-coverage-matrix.py` | 离线核验脚本（见下） |
| `matrix-notes.md` | 覆盖判定口径、证据路径基准与残余缺口说明 |

## 核验器（`verify-coverage-matrix.py`）验证内容

1. **证据引用可解析性**：`evidence.file` 存在、`evidence.key` 在文件顶层 `ac` 字典存在、`evidence.fields` 的每个路径可解析（`meta.*` 指文件根，其余指 `ac[key].detail`，支持 `a.b` 与 `[n].x` 下标）、`shot` 文件存在。R4 复审发现的 29 处无效引用在本轮被压到 **0**（共校验 421 条字段路径）。
2. **矩阵状态与 `ACCEPTANCE.md` 一致**：每条 `r4_status` == §4 同名状态格。
3. **PASS 行严格性**：仍为 `PASS` 的行不得含 `MISSING`/`PARTIAL`；`SIMULATED_ONLY` 步骤必须带非空 `justify`；非 `COVERED` 步骤必须带非空 `why`。
4. **统计与迁移**：154 条四态合计自洽；矩阵 `r4_changed_ids` 与 §4 相对 R3 提交 `dca1a5b` 的 `PASS->BLOCKED` 迁移逐条对齐；`counts.pass` == §4 `PASS` 数。
5. **现行统计签名**：`ACCEPTANCE.md`、`README.md`、R4 报告均含 `PASS` **68** / `FAIL` **0** / `BLOCKED` **71** / `NOT_RUN` **15**。

核验器**不只比较统计数字**，也**不只检查 `MISSING`**；字段路径与键位存在性、PASS 行严格性均逐条强制。

## 与 R3 索引的时序关系

- R3 版索引作为**历史快照**保留在 `../CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R3/`，**未改写**；
- 本 R4 目录为**当前状态**：在 R3 保留的 71 条 `PASS` 上修复全部证据引用、重判并下调 **3** 条（`012/041/046`）为 `BLOCKED`；
- 两版**并存**、可逐条对照；不得把 R3 快照静默改写为 R4。

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
# 需先解包原始证据包到仓库外目录（默认 /tmp/fa-evidence-r4，可用 R4_EVIDENCE_DIR 覆盖）
python3 docs/features/client-config/reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4/verify-coverage-matrix.py
```
