# Browser (BR / BI) 证据索引

真实 Chromium（Playwright-core，CDP，`--no-sandbox`，deviceScaleFactor 1）驱动正式
`5173` 页面：导航、点击只读控件、悬浮表格单元格、读取 DOM / computed style / 网络 / Console。
全部脚本**只读**——只发起 `GET`，从不写。

- 基址：`http://127.0.0.1:5173/monitor/data-source-state`
- 列表接口：`/api/monitor/data-source-run-state/list`
- 正式视口（§7.2）：`1280×800` / `1700×920` / `1920×1080` / `2560×1440`；另有 `1440×900`（`fa-closeout.cjs` 几何用）。
- 共享代码：`scripts/lib.cjs`（启动、视口、测量注入）、`scripts/harness.cjs`（面板开合/选项点击/截图辅助）。

## 场景 → 脚本 → 证据文件

| 脚本 | 场景 | 输出证据 | 主要支撑用例（`DSS-AC-*`） |
|---|---|---|---|
| `fa-structure.cjs` | 页面/菜单/结构 + 非 Feature 路由隔离（§11.1、§11.7） | `structure.json`、`leak.json`、`screenshots/structure-*.png` | 001, 003, 007, 011, 016, 018 |
| `fa-data.cjs` | 行级数据、七列内容、状态标签、Tooltip 触发、可空展示（40 断言） | `data.json` | 006, 009, 017, 019, 024, 025～048, 050～064 |
| `fa-bi.cjs` | 请求拦截替换响应：失败/空结果/超时等不可自然触发的分支（24 断言，**BI**） | `bi.json` | 026～032, 053～058 |
| `fa-requests.cjs` | 请求状态机：initial/query/manual/auto/restore、countdown、单飞抑制、隐藏冻结 | `requests.json` | 049～058, 060～062, 092～099 |
| `fa-changed-data.cjs` | "数据被另一写进程改变"：连续两次列表响应替换后重读最新值，页面零写（**BI**） | `changed-data.json` | 059 |
| `fa-popper.cjs` | 下拉面板几何矩阵：五状态 × 四视口 × 三控件（120 态，target 480/400/240，偏差 0） | `popper-matrix.json`、`popper-matrix.txt`、`screenshots/popper-*.png` | 020, 022, 065, 066～089, 100～107 |
| `fa-table.cjs` | 表格视觉/几何：行高 49、min-width 1175、时间列等宽无省略、8px 内边距、未知行底色、Popper 隔离 | `table-visual.json`、`table-visual.txt`、`screenshots/table-*.png` | 073～091, 104～107 |
| `fa-tokens.cjs` | 视觉 token 与 computed style 稳定性（配色、圆角、字号、tag 颜色等） | `tokens.json`、`screenshots/tokens-*.png` | 068～072, 093～096, 100～103 |
| `fa-closeout.cjs` | 1440×900 几何 + 内容长度不推动操作组（DSS-AC-097，五状态不变式，15 断言） | `closeout-1440.json`、`screenshots/table-1440x900.png`、`screenshots/page-idle-1440x900.png` | 080, 081, 090, 097 |
| `fa-shots.cjs` | 五视口整页/刷新/未知状态 Tooltip 截图与清单 | `screenshots-manifest.json`、`screenshots/*.png` | 截图旁证（不单独定案） |
| `fa-structure.cjs`（同） | route/menu 隔离复测 | `leak.json` | 107（Popper/样式不泄漏到非 Feature 路由） |

## 真实性边界

- `bi.json` 与 `changed-data.json` 属 **`BI`**：仅替换 `/list` 响应字节，**非真实后端数据**，文件内已显式标注。
  真实后端数据场景一律走 `fa-data.cjs` / `fa-requests.cjs` / `fa-table.cjs`。
- 组件级 vitest（前端 `FT`）**不作为**真实浏览器证据；本目录所有 `BR` 均为真实 Chromium + CDP。
- `screenshots/` 截图仅作旁证，判定以同次运行的 JSON 结构化测量为准，不以哈希差异代替内容判断。

## 运行

```bash
cd <evidence>/browser/scripts
node fa-structure.cjs && node fa-data.cjs && node fa-requests.cjs \
  && node fa-popper.cjs && node fa-table.cjs && node fa-tokens.cjs \
  && node fa-bi.cjs && node fa-changed-data.cjs && node fa-shots.cjs && node fa-closeout.cjs
```

需前端 `5173`、后端 `8080` 在运行（见 `../services/README.md`）。
