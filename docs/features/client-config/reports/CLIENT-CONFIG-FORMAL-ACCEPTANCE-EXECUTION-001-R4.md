# 探针端管理 Feature 正式验收执行 R4 纠错报告（CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4）

> 任务编号：`CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4`
> 执行分支：`develop`
> 任务开始前 Commit：`dca1a5b2381078d94653fa4c725e551ddccdc9a7`
> 报告性质：**R3 结果的只读证据复核、覆盖矩阵证据索引修复与三条用例重新判定**。本任务**不新增实际验收执行**、**不修改产品或业务代码**、**不执行写用例**、**不作整体验收通过或项目负责人最终接受结论**。
> 触发事实：ChatGPT 从远程 Git 复审 R3 提交 `dca1a5b` 后结论为 `CHANGES_REQUIRED`——R3 的 18 条下调、四态算术与定义行保护成立，但 R3 覆盖矩阵存在 **29** 处无法解析的证据引用（其中 **22** 处涉及仍为 `PASS` 的 7 条用例 `002/010/141/142/143/149/150`），且 `CCFG-AC-012`/`CCFG-AC-041`/`CCFG-AC-046` 三条 `PASS` 缺少定义所要求的前置数据/状态/方向证据。
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_FORMAL_ACCEPTANCE_EXECUTION_R4_REVIEW`

---

## 0. 状态与边界声明

1. 本任务**只读分析原始证据 + 修复索引 + 纠正文档状态**：不点击任何启停/删除确认框的最终确认、不提交新增/编辑、不放行 `POST`/`PUT`/`DELETE`、不运行 SQL DML/DDL、不访问或写入 ZooKeeper/Kafka、不制造额外业务数据、不创建夹具数据。
2. 本任务**不运行**测试、构建或浏览器验收；**不启停**项目负责人正在使用的前后端服务。使用的脚本仅用于**离线比对文档与 JSON**，不制造任何新的验收 `PASS`。
3. 本任务**未新增任何实际验收结果**；仅按现有证据**下调** 3 条原为 `PASS` 的整条状态，且**未上调任何状态**。**项目负责人未作最终接受决定**。本报告**不**写入 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/整体 `PASS`。
4. 本任务**不回写** R0/R1/R2/R3 报告；对 R3 的更正以本报告的 **errata/override**（§6、§7）呈现，历史文本按零改写原则保留。R3 覆盖矩阵目录作为**已提交历史快照**保留，未改写；现行结论由新建的 R4 索引（`reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4/`）**取代**。
5. 判定标准以 `ACCEPTANCE.md` §4 **现行定义（含历史定向修订后的现行口径）**为唯一依据；R0~R3 报告是历史执行记录，不是用例定义替代品。
6. **禁造字段**：修复索引时只在原始 JSON 中**查找**真实存在的键与字段路径，未在原始 JSON 中补造任何字段；无证据的步骤显式标 `MISSING`。
7. 本任务**未**批准 R0 报告 §7 的写用例计划（W1~W8）；该计划仍属**待另行授权**，不因本报告生效。

---

## 1. 现场门禁（开始前，只读核对）

| 项 | 实测值 |
|---|---|
| 当前分支 | `develop`（非 develop 即停线，未触发） |
| `HEAD` | `dca1a5b2381078d94653fa4c725e551ddccdc9a7` |
| `origin/develop` | `dca1a5b2381078d94653fa4c725e551ddccdc9a7` |
| 远程 `refs/heads/develop`（`git ls-remote`） | `dca1a5b2381078d94653fa4c725e551ddccdc9a7`（启动时段子网 `git ls-remote` 经 SSH 两次连接失败，以本地跟踪引用 `origin/develop` 为准；推送前重试核对，见 §9） |
| ahead/behind（`origin/develop...HEAD`） | `0 0`（无分叉） |
| 工作区既有无关改动 | ` M .claude/settings.local.json`、`?? docs/prompts/`、`?? runtime-logs/`（保持原样，未触碰、未暂存、未提交） |

结论：基线与任务提示一致（`dca1a5b…`），无本地/远程分叉，未执行 reset/clean/stash/rebase/force-push 或任何覆盖他人工作的操作。

---

## 2. 原始证据包核验

| 项 | 实测值 |
|---|---|
| 原始证据包（执行机器） | `/root/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-evidence.tar.gz` |
| 完整 SHA-256（实测，与任务提示预期一致） | `1cf178aefb03b0727e5b036ee66123631cf8d4a525622177749e258e0a5e15e6` |
| 解包位置（仓库外临时目录） | `/tmp/fa-evidence-r4/`（仓库外，未入库） |
| 关键成员 | `matrix.json`、`consolidated.json`、`accA.json`~`accJ.json`（含 `accB2.json`、`acc-result.json`）、`status-before-after.json`、`gate135.json`、`probe.json`、截图 |
| 解包后成员 JSON 的 SHA-256 | 17 个成员逐一与 R3 记录相同（见 `.../evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4/SHA256SUMS.txt`），**原始归档与成员均未被改写** |

**原始 `acc*.json`、`consolidated.json` 与必要截图才是原执行证据**；入仓的脱敏索引只作导览。原始 JSON 内部的子键布尔值有时仅表示**子步骤**通过，本报告不直接以子键值作为整条状态，而按 §3 规则逐条重判。

---

## 3. 判定口径与证据路径基准

### 3.1 证据路径基准（本轮先予澄清）

R3 矩阵的 `evidence.fields` 在原包内可解析性的**基准**在 R3 未明确写清，导致 29 处引用在复审的解析下无法定位。R4 明确并固定为：

- `evidence.file`：证据包内文件名；
- `evidence.key`：该文件顶层 `ac` 字典的键（如 `"002"`、`"142-d"`、`"128-limit"`）；
- `evidence.fields` 的路径基准：**以 `meta.` 开头者指文件根对象**（如 `meta.base` → `doc["meta"]["base"]`）；**其余字段指 `ac[key].detail`**（如 `rowH` → `doc["ac"]["010"]["detail"]["rowH"]`）；支持 `a.b` 与 `[n].x` 下标；
- `evidence.shot`：证据包内截图文件名。

### 3.2 覆盖语义（非 `COVERED` 不得自动算作完整 PASS）

在 R3 语义基础上明确：`COVERED`（存在所要求**具体条件**的记录）/ `MISSING`（不存在该步骤执行记录，含仅有静态外推）/ `PARTIAL`（仅部分状态/方向/视口实测，**不足以使整条 PASS**）/ `SIMULATED_ONLY`（仅由受控注入覆盖，须附 `justify` 且该步骤不属定义要求的真实后端/写入）。核验器据此强制 PASS 行不得含 `MISSING`/`PARTIAL`，`SIMULATED_ONLY` 须带非空 `justify`。

### 3.3 下调触发轴

沿用 R3 的 A（真实后端校验/写入）、B（前置数据/分支不可构造）、C（多模式/多视口/窄视口腿缺失）、D（键盘焦点/悬停反馈缺失）。**不因缺证据判 `FAIL`**；`FAIL` 仅在已有可复核反例时使用。

---

## 4. 修订前后统计

| 状态 | R0（`beadaac`） | R1（`5f36601`） | R2（`999de14`） | R3（`dca1a5b`） | **R4（本次提交）** | R3→R4 变化 |
|---|---|---|---|---|---|---|
| `PASS` | 120 | 102 | 89 | 71 | **68** | −3 |
| `FAIL` | 0 | 0 | 0 | 0 | **0** | 0 |
| `BLOCKED` | 19 | 37 | 50 | 68 | **71** | +3 |
| `NOT_RUN` | 15 | 15 | 15 | 15 | **15** | 0 |
| 合计 | 154 | 154 | 154 | 154 | **154** | 0 |

`PASS + FAIL + BLOCKED + NOT_RUN` = `PASS` **68** / `FAIL` **0** / `BLOCKED` **71** / `NOT_RUN` **15** = 154。R4 **仅下调 3 条**，未上调任何状态，未新增/删除任何用例。

本轮下调 3 条（`PASS` → `BLOCKED`）：`012, 041, 046`。

---

## 5. 三条重新判定（`PASS` → `BLOCKED`）

> 证据定位格式：`用例子键@分段文件`（分段文件为 R0 CDP 执行脚本的 JSON 结果，归档于仓库外原始证据包，SHA-256 见 §2）。逐条拆分与判定见覆盖矩阵（§6）。

### 5.1 `CCFG-AC-012` — 采集数据源标签悬停详情（**复审点名**）

| 步骤 | 现行定义要求 | 包内证据 | 判定 |
|---|---|---|---|
| PRE | 库内存在机构名称**超长**的数据源 | 仅 `012@accC` 记 `tagWidth=120`（**样式宽度**，非超长样本存在性） | `MISSING` |
| STEP | 悬停超长与未截断标签 | `012@accC` 有悬停可见/单实例记录，无超长样本腿 | `PARTIAL` |
| EXP | 单标签最大视觉宽度≈10 全角汉字 + CSS 省略号 | 仅有样式宽度值，无对超长样本的截断实测 | `MISSING` |
| EXP | 详情仅含完整机构名称与数据源 ID，不得显示数据源名称 | 实测（逐行文字） | `COVERED` |
| EXP | 页面级单实例、进入新目标关闭上一个、鼠标离开立即隐藏 | 实测（count/切换/离开） | `COVERED` |
| EXP | 约 200~300ms 延迟后显示 | 无计时 | `MISSING` |
| EXP | 各标签文字水平/垂直居中（正常/异常/原始 ID/省略/`+N` 各态） | 无逐态居中实测 | `MISSING` |

缺失的关键步骤为超长机构名样本（PRE）与宽度/居中/延迟测量（EXP）。R3 备注已自承“未逐一列出样本、未计时”。→ 保留已执行子步骤（详情内容、单实例、切换与隐藏）为 `COVERED`，整条降为 **`BLOCKED`**（触发轴 B/C）。

### 5.2 `CCFG-AC-041` — “自动生成”按钮位置与可点击性（**复审点名**）

| 步骤 | 现行定义要求 | 包内证据 | 判定 |
|---|---|---|---|
| PRE | 分别进入**新增与编辑**弹窗 | 仅一次入口记录 | `PARTIAL` |
| STEP | 在**未选数据源、编辑含异常历史、填写自定义描述等不同表单状态**下检查可点击 | 仅单点 `positionRightOfDesc:true`、`alwaysEnabled:true`，无逐状态观察 | `MISSING` |
| EXP | 按钮位于“探针描述”输入框右侧，**任何表单状态**下保持可点击、不显示为禁用 | 仅单点记录 | `PARTIAL` |

定义要求逐状态运行观察，包内仅单次记录，**不得**用静态代码推断替代。→ 整条降为 **`BLOCKED`**（触发轴 B/C）。

### 5.3 `CCFG-AC-046` — 增删数据源不联动 + 手动重生成（**复审点名**）

| 步骤 | 现行定义要求 | 包内证据 | 判定 |
|---|---|---|---|
| PRE | 已在弹窗自动生成描述 | 实测 | `COVERED` |
| STEP | 自动生成后**增删**数据源，观察描述不联动；再次点击才重新覆盖 | 新增模式 `046@accE` 为 `PARTIAL`（`extra:false`）；编辑模式 `046-edit@accF` 仅证“删方向不联动 + 手动重生成” | `PARTIAL` |
| EXP | 增删数据源后不自动更新；再次点击才重新覆盖；**新增与编辑**表单提供**同一个**按钮 | 两模式覆盖不足、增方向不足 | `PARTIAL` |

定义要求“增删”**两方向**与新增/编辑**两模式**的全部结果，包内不足。→ 原始 `PARTIAL` 与已通过的编辑子步骤**原样保留**，整条降为 **`BLOCKED`**（触发轴 B/C）。

---

## 6. R3 覆盖矩阵证据索引修复（无效引用 29 → 0）

### 6.1 修复前后

| 指标 | R3 矩阵 | R4 矩阵 |
|---|---|---|
| 字段路径总数 | 367 | 421 |
| 无法解析的引用数 | **29**（28 处字段路径 + 1 处键位） | **0** |
| 其中涉及仍为 `PASS` 的用例 | **22**（`002/010/141/142/143/149/150`） | 0 |
| 其中涉及已为 `BLOCKED` 的用例 | 7（`082/088/098/128`） | 0 |

（R3 复审的“29”= 28 处字段路径失败 + `128@accE` 的 `key='128'` 在 `ac` 中不存在这一键位失败。）

### 6.2 修复方式（`修复前字段` → `修复后字段`；仅在原包中查找真实字段，未补造）

| 用例 | 步骤 | 文件#键 | 修复 |
|---|---|---|---|
| `002` | EXP | `accA#002` | `states` → 拆为 `allShown`，并对“标记色/启用无标记”交叉引用 `087#mark.text/mark.color/offRows/enabledWithoutMark`、`088#[0].shown/[0].api` |
| `010` | PRE | `accG#010` | `heights` → 交叉引用 `098#rowsAtLeast6Sources[0].total/direct/plus`（7 源样本腿） |
| `010` | STEP | `accG#010` | `allSingleLine` → `rowH`、`uniformRowHeight`、`singleLine`、`noOverflow`、`overflowProp` |
| `010` | EXP | `accG#010` | `max6`→`max6Rule`；`tdPad`→`tdPadding`（另保留 `plusAccurate`、`maxDirectShown`） |
| `082` | STEP | `accD#082` | `abn` → `abnormal` |
| `088` | STEP/EXP | `accA#088` | `shown`/`api` → `[0].shown`/`[0].api`（`detail` 为列表） |
| `098` | STEP | `accG#098` | `srcW` → `rowsAtLeast6Sources[0].srcW`（嵌套于列表元素） |
| `128` | EXP | `accE#128` | 键位 `128` 在 `ac` 中不存在 → 显式标为**无证据**（无键/无字段，`MISSING`） |
| `141` | STEP | `accB#141` | `afterClick`→`click`；`afterSecondClick`→`clickAgainCancel`；补 `refix` |
| `142` | STEP | `accB2#142-d` | `kFix`→`fixedAtStart`；`kPre`→`fixedBeforeEnter`；`enterOpen`→`enterOpensDialog`；`spaceOpen`→`spaceOpensDialog`；`kEnd`→`fixedAtEnd`（另保留 `fixedAfterEnter`、`fixedAfterSpace`） |
| `143` | STEP | `accB#143` | `step`/`items`/`boxOpen` → `[0].idx`/`[1].items`/`[1].idx`/`[3].boxOpen`/`[4].idx`（`detail` 为列表） |
| `143` | STEP | `accB2#142-d` | `kPre`→`fixedBeforeEnter`；`enterOpen`→`enterOpensDialog`；`kAfterEnter`→`fixedAfterEnter` |
| `149` | STEP | `accB2#149` | `results`→`samples`；`narrow`→`narrowStable`；补截图 `B2-149-tags-1440.png`、`B2-149-narrow-900.png` |
| `150` | STEP | `accB#150` | `focusability`→`idTab`；`focusStyle`→`outlineColor`/`outlineWidth`/`note`；对行悬停/固定态交叉引用 `147#hoverBg/onlyRow/afterAway`、`148#fixedBg/leftLine` |

### 6.3 修正字段名后**仍逐条检查实际值是否足以证明定义**（不可仅改字段名）

| 用例 | 修正后仍为 `PASS` 的依据 |
|---|---|
| `002` | `allShown`=真；`087` 标记文本/颜色/未标记但启用行、`088` 首行 `shown`/`api` 均可解析且与定义“全量展示/标记/启用无标记”一致 |
| `010` | 7 源样本腿 `rowsAtLeast6Sources[0]` 证明 ≥6 源行；`rowH`/`uniformRowHeight`/`singleLine`/`noOverflow` 与 `max6Rule`/`tdPadding` 与定义“固定两行高度、单行、最多 6、加号准确”一致 |
| `141` | `click=0`（固定）、`clickAgainCancel=-1`（再次点击取消）、`refix`/`transferToOther`/`maxOne`/`idCellClickToggles` 均为实测值 |
| `142` | `accB#142-abc` 的 `a/b/c` 固定态与弹窗、`accB2#142-d` 键盘 `Enter`/空格开编辑、`fixedAtStart/End` 保持 0，均有实测值 |
| `143` | 各步 `idx` 恒为 0（固定选中不变），菜单条目为“停用＋删除”，`boxOpen` 为真 |
| `149` | 绿色标签样本、`stableAcrossIdleHoverFixed`、`narrowStable` 均有实测，并有两张尾块截图（1440/900）佐证 |
| `150` | Tab 首次落于探针 ID（`idTab`）+ 可见焦点轮廓（`outlineColor`/`outlineWidth`/`note`）；行悬停/固定由 `147`/`148` 交叉证据补足 |

这 7 条经路径修正后**实际值足以证明其现行定义**，故**保留 `PASS`**，不下调。

### 6.4 `PARTIAL` / `SIMULATED_ONLY` 的处理

- `CCFG-AC-129`：R3 矩阵中 `129-edit-locked@accF` 为 `PARTIAL`（锁定态属性缺失属**预期**），另两步 `129-create@accE`、`129-edit@accF` 为 `COVERED`；本轮进一步以 `035@accF`（`idDisabled`/`lockHint`/`toggle`/`lockedInputAttr`）与 `037@accF`（`restoredTo`/`locked`/`lockHint`/`toggle`）**交叉证据显式补足**锁定态语义 → 该 EXP 记为 `COVERED`，整条维持 `PASS`（**不隐藏**其由他步补足的事实）。
- `CCFG-AC-144`：失败态由**受控注入**构造（原始键显式标注 `injectedFailure:true`）；本条定义检验的是“加载失败时前端如何呈现与重试”，失败态即可由受控注入构造，且失败态文案与重试请求行为均实测 → 该步骤保留 `SIMULATED_ONLY` 并附 `justify`，整条维持 `PASS`；**不**隐瞒模拟标记，**不**据此判 `FAIL`。

### 6.5 其余仍为 `PASS` 的 69 条

按定义的前置条件、视口、交互分支与预期逐条审查其余仍为 `PASS` 的前置条件、视口、交互分支与预期，未发现新的缺口；步骤拆分与判定沿用 R3 人工审核结果。核验器已强制这些行的全部步骤为 `COVERED`（`SIMULATED_ONLY` 者附 `justify`）。

---

## 7. 对 R3 报告的 errata / override（不回写 R3）

| 项 | R3 原表述 | R4 更正 |
|---|---|---|
| 覆盖矩阵证据引用 | 未标注路径基准，29 处引用在原包内无法解析（含 `010@accG` 的 `heights/allSingleLine/max6/tdPad`） | 澄清基准为 `meta.*` 指根、其余指 `ac[key].detail`；逐处更正为真实字段（`rowH/singleLine/max6Rule/tdPadding` 等）；无效引用归零；R3 目录作为历史快照保留 |
| `CCFG-AC-012` 状态 | `PASS`（备注自承未列样本、未计时） | **`BLOCKED`**（缺超长样本 PRE 与宽度/居中/延迟 EXP） |
| `CCFG-AC-041` 状态 | `PASS` | **`BLOCKED`**（缺逐状态可点击观察） |
| `CCFG-AC-046` 状态 | `PASS`（新增模式 `PARTIAL`、`extra:false`） | **`BLOCKED`**（增删两方向/两模式覆盖不足） |
| `CCFG-AC-129` `PARTIAL` | 锁定态 `PARTIAL` | 由 `035`/`037` 交叉证据补足为 `COVERED`（语义明示） |
| 现行统计 | `PASS` 71 / `FAIL` 0 / `BLOCKED` 68 / `NOT_RUN` 15 | **`PASS` 68 / `FAIL` 0 / `BLOCKED` 71 / `NOT_RUN` 15** |

R3 报告与 R3 目录**不回写**；对 R3 结论的更正以本报告为准。

---

## 8. 未完成清单与后续入口

- R0 报告 §7 的写用例计划（W1~W8）仍**待另行授权**，本任务未执行、未批准。
- 本轮下调 3 条与 R3 保留的 68 条 `BLOCKED` 的缺失步骤，多属**环境与数据限制**（超长机构名样本、多视口腿、编辑异常历史、手工键入与后端唯一性、键盘焦点等）；补齐需具备相应数据/环境与（如涉及写）独立授权。
- 未发现真实产品反例，故 `FAIL` 仍为 0；如有反例将如实记录并停线报告。
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_FORMAL_ACCEPTANCE_EXECUTION_R4_REVIEW`（由 ChatGPT **从远程 Git** 对本 R4 纠错结果做独立**文档/证据**复审）。**提交/推送成功不代表远程复审通过，远程复审通过后仍不等于项目负责人已正式验收或已接受。**

---

## 9. 验证与保护证据

| 项 | 实测值 |
|---|---|
| 证据引用可解析性 | `verify-coverage-matrix.py`：421 条字段路径、文件/键/截图全部可解析，**无效引用 0** |
| 矩阵状态 vs `ACCEPTANCE.md` | 89 条 `r4_status` 与 §4 状态格逐条一致 |
| PASS 行严格性 | 68 条 `PASS` 行无 `MISSING`/`PARTIAL`；`SIMULATED_ONLY`（`144`）附 `justify` |
| 四态统计 | `PASS` **68** / `FAIL` **0** / `BLOCKED` **71** / `NOT_RUN` **15** = 154 |
| 状态迁移 | 相对 `dca1a5b` 仅 `PASS->BLOCKED` 3 条：`012/041/046`，与矩阵 `r4_changed_ids` 逐条对齐 |
| 定义保护 | §4 除 3 个状态格外全部定义单元逐字节不变；`CCFG-AC-001~154` 编号完整、唯一、连续 |
| `git diff --check` | 无空白/冲突标记错误 |
| 原始证据包 | SHA-256 `1cf178ae…` 复核前后一致；17 个成员哈希与 R3 逐一同；归档**未入仓** |

### 9.1 原始证据包未入仓与脱敏规则

原始归档含内网与可识别业务信息，**未入仓**；R4 证据索引与报告只保留脱敏键名、路径、哈希与结果。R4 目录**只**保留：用例编号、逐步判定、证据文件名与 JSON 键名、字段路径、子步骤完成情况、下调原因摘要；**不**包含数据库连接信息、内网主机/端口、账号口令或令牌、可识别业务数据、原始截图或归档内容。

### 9.2 核验命令

```bash
# 需先解包原始证据包到仓库外目录（默认 /tmp/fa-evidence-r4，可用 R4_EVIDENCE_DIR 覆盖）
python3 docs/features/client-config/reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4/verify-coverage-matrix.py
```
