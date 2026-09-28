# R5 覆盖矩阵说明（CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5）

## 1. 与 R4 矩阵的关系

R5 矩阵以 R4 已提交的 `coverage-matrix.json`（提交 `7389648`）为基线，仅对复审点名的两条仍为 `PASS` 的用例
`CCFG-AC-010` 与 `CCFG-AC-143` 按现行定义重新拆分步骤并下调为 `BLOCKED`；其余 **87** 条逐字沿用 R4 判定与引用。

R4 已核实的三条下调（`012/041/046`）、29→0 的证据路径修复与 R0~R3 的历史迁移**均不回退**。

## 2. 证据路径基准

- `evidence.file`：证据包内文件名（`accA.json`~`accJ.json`、`accB2.json`、`acc-result.json`）。
- `evidence.key`：该文件顶层 `ac` 字典的键。
- `evidence.fields`：以 `meta.` 开头者指**文件根对象**；其余指 `ac[key].detail`；支持 `a.b` 与 `[n].x`。
- `evidence.viewport`：该记录实测视口（本轮新增，用于宽度相关步骤独立断言）。
- `evidence.shot`：证据包内截图文件名。

## 3. 覆盖语义（非 `COVERED` 不得使整条 PASS）

- `COVERED`：存在执行该步骤所要求**具体条件**的记录（含注明视口）。
- `MISSING`：不存在该步骤执行记录（含仅有静态外推）。
- `PARTIAL`：仅部分状态/方向/视口实测；**PARTIAL 不足以使整条 PASS**，除非另有步骤显式补足。
- `SIMULATED_ONLY`：仅由受控注入覆盖，须附 `justify` 且不属定义要求的真实后端/写入。

## 4. 本轮两条重判的证据判定

### 4.1 `CCFG-AC-010`（宽度变化）

定义操作明确为“**调整浏览器宽度**并观察‘采集数据源’列视觉”。原包内该列的记录仅：

- `accG#010`（1440×900）：`rowH=53`、`uniformRowHeight`、`singleLine`、`noOverflow`、`overflowProp=hidden`、`maxDirectShown=2`、`max6Rule`、`plusAccurate`、`tdPadding=12px/12px`；
- `accG#098`（1440×900）：7 源样本 `rowsAtLeast6Sources[0]`（`total=7`、`direct=1`、`plus=+6`、`srcW=271`）；
- `accH#093`（1024×900）：`singleLineAllRows`、`uniformRowHeight=53`、`pageLevelHorizontalOverflow=false`、`plusNTxt="+4"`、`hiddenComputed=4`、`plusNOpensWithAccurateCount=true`。

`accH#093` 是**另一用例（AC-093）的窄视口记录**：它未绑定本条的 6～7 源样本，也未记录“改变宽度前后直接展示数量的对比”，因此**不构成**本条“调整浏览器宽度”步骤的完整证据；不得以之代替实际观察。故保留 1440 已执行子步骤，将“宽度变化腿”标 `PARTIAL`、“同一 6～7 源样本跨宽度直接展示数量对比”标 `MISSING`，整条 `PASS→BLOCKED`。

### 4.2 `CCFG-AC-143`（未固定 / 已固定两组初始状态）

定义要求在**未固定选中任何行**时分别操作 ①“更多”触发器等、②菜单与确认窗取消、③`+N`、④标签 Tooltip、⑤ID 的 Enter/Space；**再固定一行重复**同一组操作。原包内 143 相关记录仅：

- `accB#143`（1440×900，步骤列表）：自 `baseline-fixed`（`idx=0`）起，覆盖**已固定态**下更多/菜单项/确认窗打开/取消/标签点击；其中 `plusN` 步骤记录 `plusOpen:false`（**未打开**）；
- `accC#143-plusN`（1440×900）：`opened:true`、`fixed0/fixed1/fixed2=0`，覆盖**未固定起始态**下的 `+N` 一项；
- `accB2#142-d`（1440×900，属 AC-142）：Enter/空格打开编辑且固定态保持 0。

缺“未固定起始态”下的更多/菜单/确认窗/标签 Tooltip/ID 键盘记录，两组场景未齐；`accB#143` 的 `plusOpen:false` **不得**解释为已打开。故整条 `PASS→BLOCKED`。

## 5. 残余与不判 `FAIL` 的理由

`plusOpen:false`、缺宽度变化腿等均为**证据缺口**（环境/观测限制），属 `BLOCKED` 成因，**不**据此判 `FAIL`。本 R5 结论中 `FAIL` 仍为 0；未发现可复现的真实产品反例。

## 6. 脱敏

原始归档含内网地址与可识别业务信息，**未入仓**。本目录仅保留键名、字段路径、文件名、视口、哈希与判定结果。
