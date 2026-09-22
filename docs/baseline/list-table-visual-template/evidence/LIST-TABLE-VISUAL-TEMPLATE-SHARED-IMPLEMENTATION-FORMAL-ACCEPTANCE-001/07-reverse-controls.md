# 07 — 反向控制（LTVT-FA-012 支撑证据）

> 通过条件：既有 6 类代表性违规均被检测并以**非零退出**报告，且控制副本本身保真（不得自造假失败）。
> 原始日志：`/tmp/ltvt-fa-001/fa012-source.txt`、`/tmp/ltvt-fa-001/fa012-inject.txt`
> 原始 JSON：`/tmp/ltvt-fa-001/reverse-controls-source.json`、`/tmp/ltvt-fa-001/judgement-negative-control.json`
> 工具：既有 `reverse-controls-source.mjs` 与 `judge-equivalence.mjs`（均未修改）

## 1. 源码侧与运行时侧控制分解

| 控制 | 违规类别 | 施加方式 | 期望退出码 | 实测退出码 | 结果 |
| --- | --- | --- | --- | --- | --- |
| S0 | 保真对照（无违规） | 原样复制公共层与参考页 | `0` | `0` | PASS（对照有效） |
| S1 | 裸 Element Plus 选择器 | 在副本中加入 `td.el-table__cell {...}` 无根类限定规则 | `1` | `1` | PASS（检出） |
| S2 | `:root` 级令牌声明 | 在副本中加入 `:root { --lt-*: ... }` 令牌声明 | `1` | `1` | PASS（检出） |
| S3 | 重复同义规则 | 在副本中加入与公共层重复的同义规则 | `1` | `1` | PASS（检出） |
| RC1 | 运行时 ≥0.001px 几何位移 | 对实现侧注入 `0.001px` 行高偏移 | 判定 `ok=false` | `ok=false`，`failureCount=1` | PASS（检出） |
| RC2 | 运行时裸选择器 / `:root` 注入形态 | 见 `05-fallback-override-a-f.json` 的注入矩阵 | 检出 | 检出 | PASS（检出） |

原始输出：

```text
REVERSE_CONTROLS_SOURCE ok=true \
  S0_copy_is_faithful_static=0(want 0) S0_copy_is_faithful_page=0(want 0) \
  S1_bare_ep_selector=1(want 1) S2_root_token_declaration=1(want 1) \
  S3_duplicate_synonymous_rules=1(want 1)
```

## 2. 保真对照 S0 的意义

S0 在**未施加任何违规**的副本上执行同一套静态契约与参考页测试，退出码必须为 `0`：

```text
src/styles/list-table/list-table-visual.spec.ts  (12 tests)   → Tests 12 passed (12)
src/views/data-source/dataSource.spec.ts          (116 tests) → Tests 1 passed | 115 skipped (116)
```

即副本与原实现等价、检测器不会自造假失败。因此 S1/S2/S3 的 `1` 只能归因于被注入的违规本身。

## 3. 源码侧违规的检出细节

- **S1（裸 EP 选择器）**：失败断言为第 5 项，报错 `td.el-table__cell: expected 'td.el-table__cell' to contain '.lt-main-table'`，`Tests 1 failed | 11 passed (12)`。
- **S2（`:root` 令牌声明）**：`Tests 2 failed | 10 passed (12)`，命中第 4 项「公共层不声明任何 `--lt-*` 的值」与第 5 项「不存在裸 Element Plus 选择器，也不存在 `:root` / `html` / `body` / `*` 规则」。
- **S3（重复同义规则）**：`Tests 1 failed | 115 skipped (116)`，命中参考页等价接入用例「被公共层逐值等价替代的四组局部基础规则已不再重复声明（单一发布者）」。

三项均在 `reverse-controls-source.json` 的 `controls.*.failedTests` 中留有具体断言名与原始 tail，可逐条复核。

## 4. 运行时违规的检出细节（RC1）

对实现侧注入 `0.001px` 后重新采样并判定：

```text
EQUIVALENCE ok=false failures=1 failedChecks=0 \
  mainStyleMax=0 mainGeomMax=0.0009999999999976694 \
  namingStyleMax=0 namingGeomMax=0 subpixelNoise=0 injectPx=0.001
FAILURES: [{"path":"1440x900.main.firstRowRect.h","baseline":48,"impl":48.001,
           "absDiff":0.0009999999999976694,"reason":"main-table strict-0 violated"}]
```

结论：严格 0 阈值对 **0.001px** 级位移仍然敏感，判定器不会把亚像素位移吸收为噪声（`subpixelNoise=0`、`noiseFloorPx=0`）。这与无注入时 `mainGeomMax=0` 的正向结果形成闭环：**正向严格 0 是真实等价，不是阈值放宽的结果**。

## 5. 阈值未被放宽的声明

本任务全程**未**修改 `judge-equivalence.mjs`、`sample-*.mjs`、`reverse-controls-source.mjs`、`scan-build-artifacts.mjs` 或任何静态契约测试，**未**调整 `snapshot` 精度（`normalizeDecimals=3` 为脚本既有默认）、**未**降低严格 0 阈值。
