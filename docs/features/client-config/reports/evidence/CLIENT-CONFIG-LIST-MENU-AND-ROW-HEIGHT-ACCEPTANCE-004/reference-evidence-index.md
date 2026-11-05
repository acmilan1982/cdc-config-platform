# 004 复用证据与参考证据索引

## 1. 复用证据（真实覆盖部分）

| 代号 | 提交 | 路径 / JSON 键 | 本批用途 | 条件与边界 |
|---|---|---|---|---|
| E1 | 242cc5c（2026-11-04） | `reports/evidence/CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001/group-b-results.json`（AC-082/115/121/139/140/145） | 三态菜单、提交加载/防重、反馈、启停确认、删除清选 | 当时真实页面；本批对 071/072/083/084/103/153 的关键分支重新实测，未直接套用旧判定 |
| E2 | 6c72727 / e0b0048 | `reports/evidence/CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1/`（results、probes、SQL） | 标签、+N、Tooltip、超长内容、选择边界 | 历史实测仅作回归对照；本批已用 A/B/D 重新覆盖 |
| E3 | 2721969 / 968c1e5 | `reports/evidence/CLIENT-CONFIG-CRUD-BOUNDARY-AND-CONCURRENCY-ACCEPTANCE-003-R1/` | 真实 CRUD、异常动作、业务冲突、并发边界 | 并发业务写入 ≠ 列表响应时序交错；后者由本批 E 探针单独验证 |
| E4 | c0a3c1d（文件级） | `reports/evidence/CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002/s2-list-results.json` 等 | 列表、菜单键盘/边缘、事件隔离、两视口固定列、弹窗 | 只读；本批 B/H 复测当前版本 |
| E5 | d93f838 / aa942dc | `reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/row-height-results.json`；`...-001-R1/real-zoom-summary.json` | 参考页行高 48（数据源页 36 行，1440×900 与 1920×1080，DPR1，100%，Chromium）；真实 100→125→100 缩放、28×28 命中区、焦点环 | 同机 Playwright/Chromium；参考页数据为当时只读实测 |
| E6 | 1e72e4e（文件级） | `reports/evidence/CLIENT-CONFIG-LIST-MENU-LIVE-READONLY-SUPPLEMENT-002/live-readonly-results.json` | 菜单、行操作、只读结构 | 本批 A/B 已重新实测 |
| E7 | 30142e2（文件级） | `reports/evidence/CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001/round7-targeted-readonly-results.json` | 历史视觉记录 | 仅作补充，不替代本批实测 |

## 2. 跨页参考腿（079/087/091/094）

参考对象：数据源管理页（`/config/data-source`）的新增按钮位置、停用标识、数据源 ID 正文、角色标签。

可追溯的历史材料：
- `docs/features/data-source-management/reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001.md` @81c2081：
  - DS-AC-147 行高（参考页 49 / 数据源页 48，同量级）；
  - DS-AC-148 ID 正文 `14px/600/rgb(9,9,11)/monospace`；
  - DS-AC-149 角色标签 `height=20px / 12px / 600 / radius 4px / borderTopWidth 0`；
  - DS-AC-151/152 停用/异常标识与 ID 同格、行高一致。
  - 原始日志 `phaseB-case-b.log` 位于 `runtime-logs/`，该目录被 `.gitignore` 忽略（不随仓库分发）。
- `docs/baseline/list-table-visual-template/UI.md` 记录 `.ds-inactive-mark` 与角色标签的设计基线取值。

缺口：上述摘要未记录参考页测量时的视口、缩放、DPR 与样本明细，原始日志未入仓；基线文档不是运行时实测。按任务 §2/§4 的取证规则，无法“逐条注明参考页证据提交、样本、视口、缩放和客观属性”，故：

- 079：本页部分完成；参考页“新增数据源”右侧位置无运行时证据（DS 验收摘要亦未记录按钮几何）→ BLOCKED。
- 087：本页三态与固定列部分完成；参考停用标识缺同条件运行时证据 → BLOCKED。
- 091：本页三态 ID 正文、长 ID 省略/Tooltip/编辑部分完成；参考 ID 正文缺同条件运行时证据 → BLOCKED。
- 094：本页绿色标签几何与居中部分完成；参考“角色”标签缺同条件运行时证据 → BLOCKED。

最小补证条件：由后续任务在仓库内提交参考页同浏览器、同 DPR、同缩放、同视口的可追溯运行时证据（含样本键、几何与样式原始值），或授权在参考页现场实测；本任务未打开参考页，也未以共同 CSS 代替视觉对照。

## 3. 行高参考（092/155）为何可判定

E5 的 `row-height-results.json` 直接包含数据源管理页两视口（1440×900、1920×1080）各 36 行、DPR1、100%、Chromium 的实测行高，均为 48；本批 A 探针在同一引擎/DPR/缩放/视口测得本页常规行 48、逐行绝对差 0。满足 §6 冻结定义中“同浏览器、同缩放、同视口及可比条件”的要求，因此 155（及 092 的参考行高规则）可判 PASS。
