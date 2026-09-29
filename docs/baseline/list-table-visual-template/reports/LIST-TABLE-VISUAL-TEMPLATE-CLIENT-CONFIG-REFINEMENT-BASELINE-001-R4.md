# 列表表格视觉模板参照修正草案 R4 报告 · 焦点环证据表述纠错

## 1. 任务身份与停点

- `task_code=LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R4`
- 类型：**纯文档、单点证据表述纠错**。R3 远程文档复审为 `CHANGES_REQUIRED`，唯一原因是
  `SHARED_COMPONENT_DESIGN.md` §12.3 对真实 `125%` 缩放焦点环的「外侧无描边像素」表述比原始证据更**绝对**。
- 分支：`develop`；预期起始提交 `d6b09d811d46cb02310ae22eed661860e84652ce`。
- 下一入口：`CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R4_REVIEW`。
  **提交推送成功不等于远程复审通过，更不等于 §13 草案已批准。**
- 本报告自身**不**预填不可知的 result SHA；实际 base/result/remote SHA 在最终回复中给出。

## 2. 开工门禁（只读核对）

- `git branch --show-current` = `develop`；`git rev-parse HEAD` = `d6b09d811d46cb02310ae22eed661860e84652ce`；
  本地 `origin/develop` = `d6b09d811d46cb02310ae22eed661860e84652ce`；`git ls-remote origin refs/heads/develop`
  = `d6b09d811d46cb02310ae22eed661860e84652ce`；`git rev-list --left-right --count origin/develop...HEAD` = `0 0`，
  与预期起始 SHA 一致且无分叉。
- 任务前既有无关工作区内容（**保持原样，不暂存、不提交**）：` M .claude/settings.local.json`、
  `?? docs/prompts/`、`?? runtime-logs/`。

## 3. 唯一纠错（旧 → 新）

### 3.1 旧绝对表述（R3 §12.3，`LIST_TABLE_REFERENCE_FACT —— 已知阻力与现行终解` 段）

> 「…实测描边四边与四角均落在 `28×28px` 命中区内、外侧无描边像素（证明未被 `overflow: hidden` 裁掉）。」

问题：该说法**未限定缩放**，与 R1 证据中 **125% 时严格整数盒外 27 个蓝色物理像素**不符，且把
「严格盒外计数」与「产品可见的焦点环逸出」混为一谈。

### 3.2 新分缩放表述（R4 改后）

- **真实 `100%` 缩放**：命中盒 `28×28` 物理像素，描边四边与四角均落在盒内，
  `blueDevicePixelsOutsideBox=0`、`ringOutsideMaxDevicePx=0`、`ringFullyInsideHitBoxStrict=true`（严格判定通过）。
- **真实 `125%` 缩放**：命中盒约 `35×35` **物理**像素（`28×28` CSS px × `dpr 1.25`）；严格整数盒判定
  `false`、盒外计数 `blueDevicePixelsOutsideBox=27`，**全部**落在盒子**左侧紧邻的 1 个物理像素列**
  （`ringOutsideSides={left:27, right:0, top:0, bottom:0}`、`ringOutsideMaxDevicePx=1`），而
  **1 物理像素容差**判定为 `true`（`ringFullyInsideHitBoxWithin1DevicePx=true`）。该边缘列源于元素左边界
  落在**半个物理像素**上（CSS `x=969.2 × 1.25 = 1211.5` 物理 px，严格整数盒左边界取 `1212`），
  严格整数盒把元素**自身半覆盖的边缘列**判为「盒外」，属**半像素量化归类**，**不是**产品可见的焦点环逸出。
- 两缩放下的描边均为**闭合圆角矩形**、**四边完整可见**（周长覆盖率 100% `.857/.857/.857/.857`、
  125% `.886/.886/.943/.829`，`ringVisibleOnAllFourSides=true`），**未**被 `.cell{overflow: hidden}` 裁切
  （若被裁切，裁切侧覆盖率会显著为 0）。
- 明确区分口径：`28×28px` 是 CSS 命中区，`35×35` 是 125% 下的物理像素命中盒；
  「严格盒外计数 `27`」**不等于**产品可见的焦点环逸出，「1 物理像素容差内」也**不等于**「严格无盒外像素」。

### 3.3 证据出处（只读，未修改）

- `docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1.md` §5.2
  （真实缩放焦点环表与「半像素量化」注释）。
- `docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/focus-ring-pixels.json`。

字段路径 / 数值（`perZoom` 下）：

| 字段 | `perZoom.100.ring` | `perZoom.125.ring` |
|---|---|---|
| `blueDevicePixelsOutsideBox` | `0` | `27` |
| `ringFullyInsideHitBoxStrict` | `true` | `false` |
| `ringFullyInsideHitBoxWithin1DevicePx` | `true` | `true` |
| `ringOutsideSides` | `{left:0, right:0, top:0, bottom:0}` | `{left:27, right:0, top:0, bottom:0}` |
| `ringOutsideMaxDevicePx` | `0` | `1` |
| `sideCoverage` | `.857/.857/.857/.857` | `.886/.886/.943/.829` |
| `ringVisibleOnAllFourSides` | `true` | `true` |
| `focusComputed.box.w×h` / `dpr` | `28×28` / `1` | `28×28` / `1.25` |
| `boxDevice.w×h` | `28×28` | `35×35` |

## 4. 各文件旧 → 新关系

| 文件 | 修改 |
|---|---|
| `SHARED_COMPONENT_DESIGN.md` §12.3 | 「已知阻力与现行终解」段焦点环结论由**未限定缩放的绝对表述**改为**分缩放陈述**（见 §3）；未改其他语义。 |
| `SHARED_COMPONENT_DESIGN.md` §12.8 | 标题补「R4 焦点环证据表述纠错后复测」；末尾追加 R4 复测段（四通道计数 + 边界）。 |
| `README.md` §11 | 变更记录追加 R4 条目（触发、修正要点、四通道复算、边界、下一入口）。 |
| `MIGRATION.md` | 追加「模板整理任务 R4 焦点环证据表述纠错追加记录」（修正旧→新、证据字段路径、状态与计数、边界）。 |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R4.md` | 本文件，新建。 |

## 5. 四通道标记计数（R4 后，命令实测）

计数命令按 §12.8 已记录口径，标记字面量以字符串拼接构造以避免自计；通道 1 **不**扫描
`SHARED_COMPONENT_DESIGN.md`（该文件的参考事实/候选未实现标记另立通道 3/4）。

- 通道 1 四份规范文档（`README.md`／`DESIGN.md`／`UI.md`／`MIGRATION.md`）：参考事实 / 草案 / 批准 / 候选
  = **`28 / 0 / 42 / 8`**（**不变**，R4 未改四份规范文档的标记实例）。
- 通道 2 `SHARED_COMPONENT_DESIGN.md` 批准态设计标记：**`79`**（**不变**）。
- 通道 3 `SHARED_COMPONENT_DESIGN.md` 参考事实标记：**`25`**（**不变**，R4 仅改既有参考事实段内部措辞、
  未增删标记实例）。
- 通道 4 `SHARED_COMPONENT_DESIGN.md` 候选未实现标记：**`10`**（**不变**）。
- 各通道**严格不混算**。

## 6. 勘误 / 承接（errata / override）

R0～R3 报告与证据**保留原样、不回写**。R3 报告中关于 §12.3 焦点环「外侧无描边像素」的表述，
由本 R4 报告以 **errata / override** 方式承接并更正为分缩放表述；R3 的其它结论（§12.1 职责分层、
调整前 `53px` 与现行可比行约 `48 CSS px`、`CCFG-AC-010` 现行 `PASS`、§13 待批准）**未**改写。

## 7. 状态分层（只读核对，本轮未修改任何状态格）

| 项 | 现状 |
|---|---|
| §13 分层可选契约 | `DRAFT_PENDING_USER_REVIEW` / `NOT_APPROVED`（**不变**） |
| §12.1 禁用态视觉 | 设计契约、**尚未实现、尚未验收**；`CCFG-AC-157` 仍 `BLOCKED` |
| `CCFG-AC-010` | 现行状态格 `PASS`（只读核对，未改） |
| `CCFG-AC-155~157` | 现行状态格 `BLOCKED`（只读核对，未改） |
| 第七轮 opt-in 实现 | `IMPLEMENTED_PENDING_CHATGPT_REVIEW`（**不变**） |
| 模板级页面迁移 | `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED`（**均不变**） |
| 行内三点入口 | 仍为 **opt-in**（**不变**） |

## 8. 未执行项与边界

- 纯文档任务：**未**运行测试 / 构建 / 浏览器验收，**未**启停服务，**未**访问 DB / ZooKeeper / Kafka，
  **未**重跑浏览器、**未**新增正式验收 PASS。
- **未**修改：`docs/features/**`（含焦点环原始证据与 AC 状态格）、`DESIGN.md`、`UI.md`、`frontend/**`、
  `backend/**`、共享 CSS、测试、`docs/prompts/**`、项目级基线、配置，以及任务前无关改动
  （`.claude/settings.local.json`、`docs/prompts/**`、`runtime-logs/**`）。
- **未**回写 R0～R3 历史报告与证据。
- `git diff --check` 干净；改动白名单与暂存清单已核对。

## 9. 下一入口

- `CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R4_REVIEW`
  （R3 入口 `..._R3_REVIEW` 已因 `CHANGES_REQUIRED` 成为**历史**入口）。
- **提交推送成功 ≠ 远程复审通过 ≠ §13 草案已批准。**
