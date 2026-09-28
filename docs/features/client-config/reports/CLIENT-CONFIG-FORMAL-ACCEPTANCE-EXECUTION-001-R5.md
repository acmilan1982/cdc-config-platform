# 探针端管理 Feature 正式验收执行 R5 纠错报告（CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5）

> 任务编号：`CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5`
> 执行分支：`develop`
> 任务开始前 Commit：`73896485765c3c33d602d317bfad3696576f4270`
> 报告性质：**R4 结果的只读证据复核与两条仍为 `PASS` 的用例重新判定**。本任务**不新增实际验收执行**、**不修改产品或业务代码**、**不执行写用例**、**不作整体验收通过或项目负责人最终接受结论**。
> 触发事实：ChatGPT 从远程 Git 复审 R4 提交 `7389648` 后结论为 `CHANGES_REQUIRED`——R4 的下调、154 条定义保护与证据路径修复成立，但仍为 `PASS` 的 `CCFG-AC-010`（宽度变化）与 `CCFG-AC-143`（未固定/已固定两组初始状态）尚未证明定义中的关键步骤。
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_FORMAL_ACCEPTANCE_EXECUTION_R5_REVIEW`

---

## 0. 状态与边界声明

1. 本任务**只读分析原始证据 + 纠正文档状态**：不点击任何启停/删除确认框的最终确认、不提交新增/编辑、不放行 `POST`/`PUT`/`DELETE`、不运行 SQL DML/DDL、不访问或写入 ZooKeeper/Kafka、不制造额外业务数据、不创建夹具数据。
2. 本任务**不运行**测试、构建或浏览器验收；**不启停**项目负责人正在使用的前后端服务。使用的脚本仅用于**离线比对文档与 JSON**，不制造任何新的验收 `PASS`。
3. 本任务**未新增任何实际验收结果**；仅按现有证据**下调** 2 条原为 `PASS` 的整条状态，且**未上调任何状态**。**项目负责人未作最终接受决定**。本报告**不**写入 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/整体 `PASS`。
4. 本任务**不回写** R0~R4 报告；对 R4 的更正以本报告的 **errata/override**（§6、§7）呈现。R4 覆盖矩阵目录作为**历史快照**保留，未改写；现行结论由新建的 R5 索引（`reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5/`）**取代**。
5. 判定标准以 `ACCEPTANCE.md` §4 **现行定义（含历史定向修订后的现行口径）**为唯一依据。R4 已核实的三条下调（`012/041/046`）、29→0 证据路径修复与历史迁移**均不回退**。
6. **禁造证据**：本轮未在原始 JSON 补造任何键或字段；不以“引用可解析”自动把步骤标为 `COVERED`；不从 CSS 推断或其它用例的空泛“窄视口通过”代替实际观察。
7. 本任务**未**批准 R0 报告 §7 的写用例计划（W1~W8）；该计划仍属**待另行授权**，不因本报告生效。

---

## 1. 现场门禁（开始前，只读核对）

| 项 | 实测值 |
|---|---|
| 当前分支 | `develop`（非 develop 即停线，未触发） |
| `HEAD` | `73896485765c3c33d602d317bfad3696576f4270` |
| `origin/develop` | `73896485765c3c33d602d317bfad3696576f4270` |
| 远程 `refs/heads/develop`（`git ls-remote`） | `73896485765c3c33d602d317bfad3696576f4270` |
| ahead/behind（`origin/develop...HEAD`） | `0 0`（无分叉） |
| 工作区既有无关改动 | ` M .claude/settings.local.json`、`?? docs/prompts/`、`?? runtime-logs/`（保持原样，未触碰、未暂存、未提交；前序任务遗留的仓库外目录亦未清理） |

结论：基线与任务提示一致（`7389648…`），无本地/远程分叉，未执行 reset/clean/stash/rebase/force-push 或任何覆盖他人工作的操作。

---

## 2. 原始证据包核验

| 项 | 实测值 |
|---|---|
| 原始证据包（执行机器） | `/root/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-evidence.tar.gz` |
| 完整 SHA-256（实测，与任务提示预期一致） | `1cf178aefb03b0727e5b036ee66123631cf8d4a525622177749e258e0a5e15e6` |
| 解包位置（本任务新建仓库外临时目录） | `/tmp/fa-evidence-r5/`（仓库外，未入库；任务结束清理本目录） |
| 解包后成员 JSON 的 SHA-256 | 17 个成员逐一与 R3/R4 记录相同（见 `.../evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5/SHA256SUMS.txt`），**原始归档与成员均未被改写** |

**原始 `acc*.json` 与截图才是原执行证据**；入仓的脱敏索引只作导览，本报告不直接以子键值作为整条状态。

---

## 3. 判定口径与证据路径基准

沿用 R4 的路径基准（`meta.*` 指文件根对象；其余字段指 `ac[key].detail`；支持 `a.b` 与 `[n].x`）与覆盖语义（`COVERED`/`MISSING`/`PARTIAL`/`SIMULATED_ONLY`）。本轮新增 `evidence.viewport`，用于对宽度相关步骤做**独立断言**。非 `COVERED` 步骤不得使整条 `PASS`。

下调触发轴：**B**（定义前置数据/分支在数据集内不存在或不可构造）、**C**（定义明确写入多种模式/视口/完整状态序列，而证据仅有其一）。**不因缺证据判 `FAIL`**。

---

## 4. 修订前后统计

| 状态 | R0（`beadaac`） | R1（`5f36601`） | R2（`999de14`） | R3（`dca1a5b`） | R4（`7389648`） | **R5（本次提交）** | R4→R5 变化 |
|---|---|---|---|---|---|---|---|
| `PASS` | 120 | 102 | 89 | 71 | 68 | **66** | −2 |
| `FAIL` | 0 | 0 | 0 | 0 | 0 | **0** | 0 |
| `BLOCKED` | 19 | 37 | 50 | 68 | 71 | **73** | +2 |
| `NOT_RUN` | 15 | 15 | 15 | 15 | 15 | **15** | 0 |
| 合计 | 154 | 154 | 154 | 154 | 154 | **154** | 0 |

`PASS + FAIL + BLOCKED + NOT_RUN` = `PASS` **66** / `FAIL` **0** / `BLOCKED` **73** / `NOT_RUN` **15** = 154。R5 **仅下调 2 条**，未上调任何状态，未新增/删除任何用例。

本轮下调 2 条（`PASS` → `BLOCKED`）：`010, 143`。

---

## 5. 两条重新判定（`PASS` → `BLOCKED`）

### 5.1 `CCFG-AC-010` — “采集数据源”列宽度变化（**复审点名**）

**定义（逐字）**：前置“库内存在含 6～7 个数据源的探针”；操作“**调整浏览器宽度**并观察‘采集数据源’列视觉”；预期“以单行机构名称标签展示，常规行视觉高度约 58～64px（以实际盒模型为准），**按单元格实际可用宽度与各标签实际渲染宽度自适应决定直接展示数量**；含 6～7 个数据源时单行最多直接展示 6 项、其余以准确 `+N` 表示，不把整行撑高、不出现标签裁切、第二行、滚动条或越界”。

**原包内该列的全部记录**：

| 文件#键 | 视口 | 关键实测值 |
|---|---|---|
| `accG#010` | 1440×900 | `rowH=53`、`uniformRowHeight`、`singleLine`、`noOverflow`、`overflowProp=hidden`、`maxDirectShown=2`、`max6Rule`、`plusAccurate`、`tdPadding=12px/12px` |
| `accG#098` | 1440×900 | 7 源样本 `rowsAtLeast6Sources[0]`：`total=7`、`direct=1`、`plus=+6`、`srcW=271` |
| `accH#093` | 1024×900 | `singleLineAllRows`、`uniformRowHeight=53`、`pageLevelHorizontalOverflow=false`、`plusNTxt="+4"`、`hiddenComputed=4`、`plusNOpensWithAccurateCount=true`、`tableInnerHorizontalScroll="1026 > 645"` |

**判定**：`accH#093` 是**另一用例（AC-093）的窄视口记录**——它未绑定本条的 6～7 源样本，也未记录“改变宽度前后直接展示数量”的对比，因此**不构成**本条“调整浏览器宽度”步骤的完整证据；不得以之代替实际观察。保留 1440 已执行子步骤（单行、行高一致、无溢出、`max6Rule`/`plusAccurate`、7 源样本 `+6`），把“宽度变化腿”标 `PARTIAL`、“同一 6～7 源样本跨宽度直接展示数量对比”标 `MISSING`。→ 整条降为 **`BLOCKED`**（触发轴 B/C）。

### 5.2 `CCFG-AC-143` — 未固定 / 已固定两组初始状态下的行内控件隔离（**复审点名**）

**定义（逐字）**：前置“已进入 `/config/client`；列表已加载启用/停用/历史异常三类记录；行内存在 `+N`、数据源标签 Tooltip 等可交互控件”；操作“在**未固定选中任何行**时，分别点击某行的：①‘更多’三点触发器；②展开菜单中的条目（含打开启停／删除确认窗口、点击取消）；③`+N`（打开完整清单）；④数据源标签 Tooltip 触发器；⑤探针 ID 的 Enter／Space 键盘编辑。每次操作后观察该行是否被固定选中或被取消固定；**再先固定选中一行，重复上述操作**，核对固定选中行是否保持不变”。

**原包内 143 相关的全部记录**：

| 文件#键 | 视口 | 做了什么 | 覆盖的初始状态 |
|---|---|---|---|
| `accB#143`（步骤列表） | 1440×900 | 自 `baseline-fixed`（`idx=0`）起：`open-menu`（items 停用/删除）、`after-esc`、`confirm-dialog-open`（`boxOpen:true`）、`after-confirm-cancel`、`plusN`（`plusOpen:false`，**未打开**）、`tag-click`，各步 `idx` 恒为 0 | **已固定态** |
| `accC#143-plusN` | 1440×900 | `opened:true`、`fixed0/fixed1/fixed2=0` | **未固定起始态**（仅 `+N` 一项） |
| `accB2#142-d`（属 AC-142） | 1440×900 | `enterOpensDialog`/`spaceOpensDialog`，固定态前后保持 0 | 键盘（属另一用例记录） |

**判定**：定义要求在**两组初始状态**下逐一覆盖六类交互；原包仅覆盖“已固定态”的更多/菜单/确认窗/取消/标签点击，以及“未固定起始态”的 `+N` **一项**，**缺**“未固定起始态”下的更多/菜单/确认窗/标签 Tooltip/ID 键盘记录。两组场景未齐，**不得仅以 `idx=0` 证明两组**；`accB#143` 的 `plusOpen:false` **不得**解释为已打开。保留已完成的已固定组、键盘与另一次 `+N` 子步骤。→ 整条降为 **`BLOCKED`**（触发轴 B/C）。

> `plusOpen:false` 本身尚不足以判定产品 `FAIL`；未发现可复现的真实产品反例，故本 R5 `FAIL` 仍为 0。

---

## 6. 对 R4 报告的 errata / override（不回写 R4）

| 项 | R4 原表述 | R5 更正 |
|---|---|---|
| `CCFG-AC-010` 状态 | `PASS`（引用 `010@accG`/`098@accG`，均 1440×900） | **`BLOCKED`**（缺“调整浏览器宽度”这一步；`accH#093@1024` 属 AC-093 记录，未绑定本条样本、无跨宽度对比） |
| `CCFG-AC-143` 状态 | `PASS`（引用 `143@accB` 与 `142-d@accB2`） | **`BLOCKED`**（仅已固定态组 + 未固定起始态 `+N` 一项；缺未固定起始态其余交互；`plusOpen:false` 不得读作已打开） |
| 现行统计 | `PASS` 68 / `FAIL` 0 / `BLOCKED` 71 / `NOT_RUN` 15 | **`PASS` 66 / `FAIL` 0 / `BLOCKED` 73 / `NOT_RUN` 15** |

R4 报告与 R4 目录**不回写**；对 R4 结论的更正以本报告为准。R4 的 3 条下调、29→0 证据路径修复与 R0~R3 历史迁移均**保留**。

---

## 7. 未完成清单与后续入口

- R0 报告 §7 的写用例计划（W1~W8）仍**待另行授权**，本任务未执行、未批准。
- 本轮下调 2 条与既有 `BLOCKED` 的缺失步骤，多属**观测/证据缺口**（宽度变化腿、两组初始状态覆盖、超长机构名样本、多视口腿、编辑异常历史、后端唯一性、键盘焦点等）；补齐需具备相应数据/环境与（如涉及写）独立授权。
- 未发现真实产品反例，故 `FAIL` 仍为 0；如有反例将如实记录并停线报告。
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_FORMAL_ACCEPTANCE_EXECUTION_R5_REVIEW`（由 ChatGPT **从远程 Git** 对本 R5 纠错结果做独立**文档/证据**复审）。**提交/推送成功不代表远程复审通过，远程复审通过后仍不等于项目负责人已正式验收或已接受。**

---

## 8. 验证与保护证据

| 项 | 实测值 |
|---|---|
| 证据引用可解析性 | `verify-coverage-matrix.py`：436 条字段路径、文件/键/截图全部可解析，**无效引用 0** |
| 矩阵状态 vs `ACCEPTANCE.md` | 89 条 `r5_status` 与 §4 状态格逐条一致 |
| PASS 行严格性 | 66 条 `PASS` 行无 `MISSING`/`PARTIAL`；`SIMULATED_ONLY`（`144`）附 `justify` |
| 四态统计 | `PASS` **66** / `FAIL` **0** / `BLOCKED` **73** / `NOT_RUN` **15** = 154 |
| 状态迁移 | 相对 `7389648` 仅 `PASS->BLOCKED` 2 条：`010/143`，与矩阵 `r5_changed_ids` 逐条对齐 |
| **独立断言 · AC-010** | 直接扫描原包确认无“绑定 6～7 源样本、非 1440 视口的直接展示数量”记录；矩阵含 `AC010_WIDTH_CHANGE` 未完成步骤（`PARTIAL`/`MISSING`），整条不得 `PASS` |
| **独立断言 · AC-143** | 直接扫描原包确认 143 相关键仅 `143`/`143-plusN`（无未固定组其余交互）；矩阵含 `AC143_UNFIXED_GROUP` 未完成步骤，并同时记录 `plusOpen:false` 与 `opened:true` 防误读 |
| 定义保护 | §4 除 2 个状态格外全部定义单元逐字节不变；`CCFG-AC-001~154` 编号完整、唯一、连续 |
| `git diff --check` | 无空白/冲突标记错误 |
| 原始证据包 | SHA-256 `1cf178ae…` 复核前后一致；17 个成员哈希与 R3/R4 逐一同；归档**未入仓** |

### 8.1 原始证据包未入仓与脱敏规则

原始归档含内网与可识别业务信息，**未入仓**；R5 证据索引与报告只保留脱敏键名、路径、视口、哈希与结果。R5 目录**只**保留：用例编号、逐步判定、证据文件名与 JSON 键名、字段路径、视口、子步骤完成情况、下调原因摘要；**不**包含数据库连接信息、内网主机/端口、账号口令或令牌、可识别业务数据、原始截图或归档内容。

### 8.2 核验命令

```bash
# 需先解包原始证据包到仓库外目录（默认 /tmp/fa-evidence-r5，可用 R5_EVIDENCE_DIR 覆盖）
python3 docs/features/client-config/reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5/verify-coverage-matrix.py
```
