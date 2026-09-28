# R4 覆盖矩阵说明（CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4）

## 1. 与 R3 矩阵的关系

R4 矩阵以 R3 已提交的 `coverage-matrix.json`（提交 `dca1a5b`）为基线，在其 89 条用例上做两类**定向**修订：

1. **证据引用修复**：把 R3 复审认定的 29 处无法解析引用（28 处字段路径 + 1 处键位）逐一更正为原包内真实存在的键/字段/截图，或显式标为缺失；未在原始 JSON 中补造任何字段。
2. **三条重判**：把 `CCFG-AC-012` / `CCFG-AC-041` / `CCFG-AC-046` 由 `PASS` 下调为 `BLOCKED`，并按现行定义把其步骤重新拆分。

未列出的用例步骤逐字沿用 R3 矩阵；R3 的 18 条下调（`009,013,017,079,082,086,087,088,091,092,094,095,097,098,100,101,128,136`）原样保留。

## 2. 证据路径基准（R4 明确）

- `evidence.file`：证据包内文件名（`accA.json`~`accJ.json`、`accB2.json`、`acc-result.json`）。
- `evidence.key`：该文件顶层 `ac` 字典的键（如 `"002"`、`"142-d"`、`"128-limit"`）。
- `evidence.fields` 中的路径**基准**：
  - 以 `meta.` 开头的路径 → **文件根对象**（如 `meta.base` → `doc["meta"]["base"]`）；
  - 其余路径 → `ac[key].detail`（如 `rowH` → `doc["ac"]["010"]["detail"]["rowH"]`；`[0].shown` → `detail` 为列表时的首元素字段）。
- `evidence.shot`：证据包内截图文件名（如 `B2-149-tags-1440.png`）。

## 3. 覆盖语义（非 `COVERED` 不得自动算作完整 PASS）

- `COVERED`：原包中存在执行该步骤所要求**具体条件**的记录。
- `MISSING`：原包中不存在该步骤的执行记录（含仅有静态样式/公式外推而无实测）。
- `PARTIAL`：仅部分状态/方向/视口被实测；**PARTIAL 不足以使整条 PASS**，除非另有步骤显式补足本步骤条件。
- `SIMULATED_ONLY`：仅由受控注入（`simulated:true`）覆盖；仅在该步骤不属定义要求的真实后端/写入、且附非空 `justify` 时方可留在 PASS 行。

R4 核验器（`verify-coverage-matrix.py`）据此强制：仍为 `PASS` 的行**不得**含 `MISSING`/`PARTIAL` 步骤；含 `SIMULATED_ONLY` 的步骤必须带非空 `justify`；非 `COVERED` 步骤必须带非空 `why`。

## 4. 已知残余与不判 `FAIL` 的理由

- `CCFG-AC-012`：超长机构名样本（PRE）与宽度/居中/约 200~300ms 延迟测量在包内不存在 → 保留已执行子步骤（悬停详情仅机构名+数据源 ID、单实例、切换与隐藏）为 `COVERED`，缺口标 `MISSING`。
- `CCFG-AC-041`：仅单点 `positionRightOfDesc=true`/`alwaysEnabled=true`，缺新增/编辑/未选数据源/编辑异常历史/自定义描述等**逐状态**可点击观察 → 该多状态观察为 `MISSING`。
- `CCFG-AC-046`：新增模式 `046@accE` 为 `PARTIAL`（`extra:false`），编辑模式 `046-edit@accF` 仅证“删方向不联动 + 手动重生成”；定义要求的“增删”两方向与新增/编辑两模式的全部结果不足 → 标 `PARTIAL`。
- `CCFG-AC-144`：失败态由受控注入构造（键显式标注 `injectedFailure:true`），其文案与重试请求行为均实测 → 该步骤 `SIMULATED_ONLY` 且附 justification，**不**据此判 `FAIL`。
- 缺失多为**环境与数据限制**（超长机构名/多视口/编辑异常历史等），属 `BLOCKED` 成因，**不**据此判 `FAIL`；本 R4 结论中 `FAIL` 仍为 0。

## 5. 脱敏

原始归档含内网地址与可识别业务信息，**未入仓**。本目录仅保留键名、字段路径、文件名、哈希与判定结果；业务可识别值（机构名称、探针 ID、原始数据源 ID 等）不落入矩阵与说明。
