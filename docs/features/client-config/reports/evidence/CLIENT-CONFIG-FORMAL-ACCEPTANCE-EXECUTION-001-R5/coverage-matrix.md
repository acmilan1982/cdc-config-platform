# R5 逐步骤覆盖矩阵（CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5）

- 任务：`CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5`
- 基线提交：`73896485765c3c33d602d317bfad3696576f4270`
- 原始证据包 SHA-256：`1cf178aefb03b0727e5b036ee66123631cf8d4a525622177749e258e0a5e15e6`
- 范围：复审点名的 CCFG-AC-010（宽度变化）与 CCFG-AC-143（未固定/已固定两组）逐步骤复核；其余 87 条沿用 R4
- 路径基准：evidence.fields 中 `meta.*` 指向 JSON 文件根对象；其余字段指向 `ac[key].detail`（支持 `a.b` 与 `[n].x` 下标路径）；`shot` 指向包内截图文件名
- 用例数：89；本轮下调：2（CCFG-AC-010、CCFG-AC-143）；整条 PASS：66

## 覆盖语义

| 判定 | 含义 |
|---|---|
| `COVERED` | 原始证据中存在执行本条现行定义所要求具体条件的记录（字段值或截图，含注明视口） |
| `MISSING` | 原始证据中不存在该步骤的执行记录（含仅有静态样式/公式外推而无实测） |
| `PARTIAL` | 该步骤仅有部分状态/方向/视口被实测；PARTIAL 不足以使整条 PASS，除非另有步骤显式补足本步骤的具体条件 |
| `SIMULATED_ONLY` | 该步骤仅由受控模拟（simulated:true）覆盖；仅在必须提供 justification 且该步骤不属定义要求的真实后端/写入时方可留在 PASS 行 |

## 逐条（仅列本轮涉及的用例；其余逐字沿用 R4）

### CCFG-AC-010 —— `PASS` → `BLOCKED`（B/C）

> 已执行子步骤保留：1440×900 下单行、行高一致 53px、无溢出、max6Rule/plusAccurate、7 源样本（+6）；缺口为“调整浏览器宽度”这一步——原包另有 1024×900 列表观测（属 AC-093），但未绑定本条 6～7 源样本，也无同一 6～7 源样本在改变宽度前后的直接展示数量对比。

| 类型 | 定义要点 | 证据（文件#键；视口） | 字段 | 判定 | 依据 |
|---|---|---|---|---|---|
| PRE | 库内存在含 6～7 个数据源的探针 | accG.json#098 @1440x900 | `rowsAtLeast6Sources[0].total`、`rowsAtLeast6Sources[0].direct`、`rowsAtLeast6Sources[0].plus` | **COVERED** | 098 的 7 源探针样本（total=7、direct=1、plus=+6）证明该类样本存在且 +N 准确 |
| STEP | 调整浏览器宽度并观察“采集数据源”列视觉 | accG.json#010 @1440x900 | `rowH`、`uniformRowHeight`、`singleLine`、`noOverflow`、`overflowProp` | **COVERED** | 1440×900 下单行、行高一致 53px、无溢出（overflow:hidden）实测 |
| STEP | 调整浏览器宽度并观察（宽度变化腿） | accH.json#093 @1024x900 | `singleLineAllRows`、`uniformRowHeight`、`pageLevelHorizontalOverflow`、`plusNTxt`、`hiddenComputed`、`plusNOpensWithAccurateCount` | **PARTIAL** | 原包另有 1024×900 的列表观测（属 AC-093 记录）：单行保持、行高一致、无页面级横向溢出、+N=“+4” 与隐藏数 4 自洽；但该记录未绑定本条 6～7 源样本，也无宽度变化前后的直接展示数量对比，属另一用例的窄视口记录，不能单独完成本条“调整浏览器宽度”步骤 |
| EXP | 单行机构名称标签；按单元格实际可用宽度自适应决定直接展示数量；含 6～7 源时最多直接展示 6 项、其余准确 `+N`；不撑高行、不裁切、不出现第二行/滚动条/越界 | accG.json#010 @1440x900 | `max6Rule`、`plusAccurate`、`maxDirectShown`、`tdPadding` | **COVERED** | 1440×900 下 max6Rule/plusAccurate 为真、内边距 12px/12px、direct ≤ 6 |
| EXP | 按单元格实际可用宽度自适应决定直接展示数量（同一 6～7 源样本在改变宽度前后的对比） | （无证据） | — | **MISSING** | 原包无同一 6～7 源样本在改变宽度前后的直接展示数量对比记录；仅凭单视口值或跨用例窄视口记录不足以证明该自适应步骤 |

### CCFG-AC-143 —— `PASS` → `BLOCKED`（B/C）

> 已执行子步骤保留：accB#143 的已固定态组（更多/菜单项/确认窗/取消/标签点击，idx 恒为 0）、accC#143-plusN 的 +N（opened:true，固定态采样 0）、accB2#142-d 的键盘 Enter/空格；缺口为“未固定选中任何行”起始态下的更多/菜单/确认窗/标签 Tooltip/ID 键盘记录（两组场景未齐）。accB#143 的 plusN 步骤记录 plusOpen:false（未打开），不得解释为已打开。

| 类型 | 定义要点 | 证据（文件#键；视口） | 字段 | 判定 | 依据 |
|---|---|---|---|---|---|
| STEP | 已固定选中一行时：更多触发器/菜单项/启停或删除确认窗（含取消）/标签 Tooltip 均不改变固定选中 | accB.json#143 @1440x900 | `[0].idx`、`[1].items`、`[1].idx`、`[3].boxOpen`、`[4].idx`、`[6].idx` | **PARTIAL** | accB#143 自 baseline-fixed（idx=0）起，覆盖固定态下更多/菜单/确认窗打开与取消/标签点击；其中 plusN 步骤记录 plusOpen:false（未打开），本次未覆盖该点击是否打开完整清单 |
| STEP | 未固定选中任何行时：重复同上各类交互并观察该行是否被固定选中 | accC.json#143-plusN @1440x900 | `opened`、`fixed0`、`fixed1`、`fixed2` | **PARTIAL** | accC#143-plusN 记录 +N 打开（opened:true）且固定态采样 fixed0/1/2=0（未固定）；仅覆盖“未固定起始态”下的 +N 一项，未覆盖未固定下的更多/菜单/确认窗/标签 Tooltip |
| STEP | 探针 ID 的 Enter／Space 键盘编辑不改变固定选中 | accB2.json#142-d @1440x900 | `fixedBeforeEnter`、`enterOpensDialog`、`fixedAfterEnter`、`spaceOpensDialog`、`fixedAfterSpace`、`fixedAtStart`、`fixedAtEnd` | **PARTIAL** | accB2#142-d（属 AC-142 记录）证明 Enter/空格打开编辑且固定态保持 0；但该键未在“未固定起始态”下执行，且属另一用例记录 |
| EXP | 点击“更多”触发器、菜单项、启停／删除确认窗口（含遮罩与按钮）、`+N`、数据源标签 Tooltip 触发器均不触发固定选中切换；两组初始选中状态下均须保持 | （无证据） | — | **MISSING** | 定义要求“未固定”与“已固定”两组初始状态下逐一覆盖六类交互；原包缺失“未固定起始态”下的更多/菜单/确认窗/标签 Tooltip 记录，两组场景未齐，不得仅以 idx=0 证明两组 |

