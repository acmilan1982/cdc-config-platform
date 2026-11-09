# CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007 — 证据索引

- 任务：`CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007`
- 基线：`ed41449cba8a6d6738deb4c52f456939999992ef`（`develop`，006-R1）
- 对象：`/config/client` 新增／编辑主弹窗 `CCFG-AC-138` / `CCFG-REQ-139`
- 报告：`docs/features/client-config/reports/CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007.md`
- 006/R1 原始记录与证据未改动（本目录独立新建）。

## 目录

| 文件 | 内容 |
|---|---|
| `probes/probeA-ac138-fix.cjs` | 专用浏览器探针（脱敏）；`MODE=baseline` 复现修复前位移，`MODE=fixed` 执行修复后完整复测 |
| `results/baseline-repro-1k.json` | 修复前 1K 复现：create/edit 六步 + 40941 长错误，`+16.37px` 位移 |
| `results/ac138-fix-retest.json` | 修复后完整复测：create/edit × 1K/2K + 1024×720 回归 |
| `environment-and-version.txt` | 服务、进程、浏览器、视口、DPR/缩放、源码来源与工具版本 |
| `network-ledger.md` | 网络门禁规则、非 GET 本地回放台账、后端转发 0 |
| `SHA256SUMS` | 本目录证据文件校验值 |

## 复现命令

前置：前端 `/config/client` 服务在 `BASE_URL` 可用（本任务使用本机 Vite `5173`）。

```bash
# 修复前基线（需先临时移除 ClientConfigPage.vue 中的页面局部块，并在服务端确认
# style 模块不含 --ced-feedback-min-height，然后恢复；仅 1K）
MODE=baseline BASE_URL=http://127.0.0.1:5173 \
  node docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007/probes/probeA-ac138-fix.cjs

# 修复后完整复测（1K/2K 主补充 + 1024 回归）
MODE=fixed BASE_URL=http://127.0.0.1:5173 \
  node docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007/probes/probeA-ac138-fix.cjs
```

探针在首次导航前安装网络门禁并禁用 service worker；仅放行只读请求；长错误提交在浏览器
内本地回放 005 的 40941 响应，绝不转发后端；不修改产品代码、DOM 或 CSS。

## 关键原始证据键

### 修复前（baseline-repro-1k.json）

- `sections.create1920x1080.longError.geometryDelta.afterVsBefore`
  → `dialogBottom/dialogHeight/submitY = +16.37`，`dialogTop/dialogLeft/dialogRight/submitX = 0`
- `sections.create1920x1080.longError.geometryDelta.correctedVsBefore` → 全 `0`
- `sections.edit1920x1080.longError.geometryDelta.afterVsBefore` → 同上 `+16.37`；修正后全 `0`
- `summary.redTransition.*.maxAbsVsBefore`（六步）→ 全 `0`
- `longError.transition.*.maxAbsVsBefore` → `top 0`、`bottom/height/submitY 16.37`
- `longError.feedbackStyle.height = 36.375px`，`reservedBoxMinHeight = 20px`

### 修复后（ac138-fix-retest.json）

- 1K/2K create/edit：`summary.deltas.maxAbs` 与 `longError.geometryDelta`
  （`afterVsBefore`、`correctedVsBefore`）全部 `0`
- `longError.transition.{dialogTop,dialogBottom,dialogHeight,submitY}.maxAbsVsBefore = 0`
- `longError.lineCount = 2`，`wrapped = true`，`textEqualsRecorded = true`
- `longError.reservedBoxHeight = 36.39`，`reservedBoxMinHeight = "36.4px"`，
  `feedbackStyle.height = "36.375px"`
- 1K/2K：`afterAllLinesInsideFormViewport = true`，`submitHittableAfter = true`
- 1024 create：`afterScroll.scrollInfo = {scrollTop:29, clientHeight:480, scrollHeight:509}`，
  `afterScrollAllLinesInsideFormViewport = true`，`submitHittableAfterScroll = true`
- 1024 edit：`afterScroll.scrollInfo = {scrollTop:52, clientHeight:480, scrollHeight:532}`，
  同上全部可读、按钮可命中
- 全部场景 `horizontalOverflowAfter = false`
- `gate.nonGetTotal = 6`，`gate.backendNonGetForwarded = 0`
- `meta.browserVersion = "147.0.7727.15"`，`meta.serviceWorkers = "blocked"`

## 脱敏

- 探针与结果仅含 `/config/client` 页面路径、页面只读接口路径、合成探针 ID 与合成描述；
  无数据库凭据、无令牌、无私钥、无真实业务数据。
- 请求体中的记录均为历史验收批次已入仓的合成样本（`probe-001`、`CCFG007-LONG-*`、
  `CCFG-AC-R1-DS05`、`S3AC-S030-1`）。
