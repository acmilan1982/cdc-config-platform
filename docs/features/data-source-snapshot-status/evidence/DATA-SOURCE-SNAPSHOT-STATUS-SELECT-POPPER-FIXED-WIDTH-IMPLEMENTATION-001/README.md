# 证据索引：查询下拉弹层固定宽度正式实现

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001`
- 任务类型：前端正式实现（已批准查询下拉弹层固定宽度规则），不执行正式验收、不做批准收口
- 隔离 worktree：`/agent/dss-popper-width-impl-001`
- 基准提交：`485be09db758e4ba6f543fcc88a399cc5a46d384`（= `origin/develop`）
- 批准业务内容基准：`f74dd725682b745f1b8ac6a1b9358eff10aaddc2`
- 报告：`../../reports/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001.md`

> 本目录全部为开发自测证据。`DSS-AC-001~107` 共 107 条全部保持 `NOT_RUN`，本目录任何结论都不构成正式验收结论。

## 目录结构

### `git/` — Git 现场与范围证明

| 文件 | 说明 |
|---|---|
| `worktree-states-before.txt` | 任务开始（2026-09-11T21:23:05+08:00）全部 worktree 的路径 / HEAD / 分支或游离态 |
| `worktree-states-after.txt` | 任务结束全部 worktree 的同口径快照 |
| `worktree-preservation-proof.txt` | 逐行对比结论：既有 worktree 全部原样保留；主工作区保持 `4222b0a [develop]` 且既有未提交改动未被触碰 |
| `per-worktree-status-before.txt` / `per-worktree-status-after.txt` | 每个 worktree 的 HEAD、分支与 `git status --short` |
| `diff-check.txt` | `git diff --check` 原始输出（空 = 无空白错误） |

### `tests/` — 自动化测试与构建（原始 `.txt` + `.exit` 退出码）

| 文件 | 命令 | 结果 |
|---|---|---|
| `targeted-querybar.txt/.exit` | `npx vitest run .../DataSourceSnapshotQueryBar.spec.ts` | 1 文件 / 85 用例通过，exit 0 |
| `feature-full.txt/.exit` | `npx vitest run src/views/data-source-run-state/` | 13 文件 / 245 用例通过，exit 0 |
| `frontend-full.txt/.exit` | `npx vitest run` | 50 文件 / 834 用例通过，exit 0 |
| `frontend-build.txt/.exit` | `npm run build`（`vue-tsc --noEmit && vite build`） | 成功，exit 0 |
| `diff-check.txt/.exit` | `git diff --check` | 干净，exit 0 |

### `browser/` — 真实浏览器几何验证（5173 正式前端）

| 文件 | 模式 | 说明 |
|---|---|---|
| `before.json` / 含于 `scripts/` | `before` | 修复前根因事实（1280×800）：外层无 inline 尺寸、宽度随内容浮动 |
| `matrix.json` / `matrix-summary.json` / `matrix-summary.txt` | `matrix` | 四档视口 × 三维度 × 状态矩阵 × 5 次重复原始几何 + 归约窄表 |
| `narrow.json` / `narrow-summary.json` / `narrow-summary.txt` | `narrow` | 窄视口 480 / 400 / 240 的三维度几何与溢出判定 |
| `regression.json` | `regression` | 请求增量、其他路由样式泄漏、console、非 GET 请求 |
| `singleflight.json` | `singleflight` | 同一 JS 任务内同步连击的并发/重叠判定 |
| `timer.json` | `timer` | 倒计时走秒、自动刷新到期、页面隐藏冻结与恢复 |
| `failure.json` | `failure` | 查询失败保留旧结果与旧已应用条件 |
| `shots.json` / `screenshots-manifest.json` | `shots` | 7 档视口 × 10 张截图清单（共 70 张） |
| `screenshots/` | — | 70 张 PNG 截图 |
| `screenshots-sha256.txt` | — | 截图 SHA-256 哈希索引（sha256 / 字节 / 文件名） |
| `scripts/popper-harness.cjs` | — | 只读几何采集脚本（多模式） |
| `scripts/reduce-matrix.cjs` / `scripts/reduce-narrow.cjs` | — | 原始 JSON → 可复核窄表归约脚本 |
| `matrix.txt` / `narrow.txt` / `regression.txt` / `singleflight.txt` / `timer.txt` / `failure.txt` / `shots.txt` | — | 各模式采集的原始 stdout/stderr 日志（`.log` 被 `.gitignore:30` 忽略，故按任务提示 §12 保存为明确命名的 `.txt`） |
| `harness-exit-codes.txt` | — | 各模式退出码来源说明（`matrix.txt` 无 `# EXIT` 标记，其成功依据见该文件） |
| `vite-5173.txt` | — | 5173 前端开发服务启动日志 |

### `backend/` — 只读联调与数据库语句分类

| 文件 | 说明 |
|---|---|
| `capture-meta.txt` | 受控只读 GET 的时间、日志偏移、HTTP 状态与耗时 |
| `feature-get-window.txt` | 两次受控 Feature GET 对应的后端日志窗口原文（`.log` 被忽略，按 §12 存为 `.txt`） |
| `scheduler-window.txt` / `scheduler-window-meta.txt` | 100s 自然观察窗口的后端日志原文与起止边界 |
| `db-statement-classification.txt` | 语句分类结论：本 Feature GET / 既有大屏统计只读触发 / 手工写入 = 0 |

### `docs/` — 需求 / 验收业务行零变化与追踪校验

| 文件 | 说明 |
|---|---|
| `requirements-business-rows-before.txt` / `-after.txt` | 87 条 `DSS-REQ-*` 业务行提取（前后同口径） |
| `acceptance-business-rows-before.txt` / `-after.txt` | 107 条 `DSS-AC-*` 业务行提取（前后同口径） |
| `requirements-rows-cmp.txt` / `acceptance-rows-cmp.txt` | `diff` 原文（空 = 逐字节一致） |
| `tracking-status-validation.txt` | 计数、`NOT_RUN` 计数、追踪映射与零变化校验（含一处既有非单调排序的如实记录） |

## 复现方式

```bash
source /agent/cdc-config-platform/agent-env.sh
cd <worktree>/frontend && npm run dev -- --host 0.0.0.0 --port 5173 --strictPort   # 5173 正式前端
cd <evidence>/browser
node scripts/popper-harness.cjs matrix   && node scripts/reduce-matrix.cjs matrix.json matrix-summary.json
node scripts/popper-harness.cjs narrow   && node scripts/reduce-narrow.cjs narrow.json narrow-summary.json
node scripts/popper-harness.cjs regression
node scripts/popper-harness.cjs singleflight
node scripts/popper-harness.cjs timer
node scripts/popper-harness.cjs failure
node scripts/popper-harness.cjs shots
```

## 边界与待裁决事项（如实记录，非隐藏）

- 外层 `.el-popper` 在全部视口遵循 `min(目标宽度, calc(100vw - 16px))`。
- Element Plus 会在内层 `.el-select-dropdown` 写入 inline `min-width = 触发控件宽度 − 2px`（探针端 238 / 源库 298 / 快照状态 198）。内联样式无法在“不用 `!important`、不用 JS 尺寸监听”的前提下被覆盖。
- 在各自窄视口阈值（探针端 496 / 源库 416 / 快照状态 256）及以上，内层均能容纳于外层。
- 仅在低于内层下限的极小视口（例如三档合一的 240px 视口：外层按公式收为 224px）时，内层 238 / 298 > 224，内层盒会超出外层；此为框架内联约束，未用 `!important` 覆盖，已提交项目负责人裁决。证据见 `browser/narrow-summary.txt` 的 `status_lt_256` 分组。
