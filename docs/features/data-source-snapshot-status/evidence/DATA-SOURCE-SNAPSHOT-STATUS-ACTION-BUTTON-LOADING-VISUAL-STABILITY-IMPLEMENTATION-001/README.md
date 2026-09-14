# 证据索引 —— 操作按钮 Loading 视觉稳定性前端实现

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001`
- 任务性质：前端正式实现 + 自动化测试 + 构建 + 真实浏览器开发自测 + 实现状态文档同步（**非**正式验收、**非**最终收口）
- 执行日期：2026-09-14
- 分支：`develop`（任务在独立 worktree `detached HEAD` 上执行）
- 任务起始提交：`9f06725d23d66e845cb5ab1d8d8d4f151401893b`
- 批准内容基准提交：`c4d5c096a7428d7f5be1af0d776c53655dd86e26`
- 结果 worktree：`/agent/dss-abl-impl-001`（**本任务全部实现与自测证据均产自该 worktree**；主 worktree `/agent/cdc-config-platform` 保持 `develop@4222b0a` 与其既有修改，未进入、未清理、未暂存、未提交）

> 本目录仅为**开发自测证据**。开发自测不等于正式验收，`DSS-AC-108~113` 共 6 条在本任务结束时仍为 `NOT_RUN`。
> 本目录不含密码、令牌、Cookie、Authorization、私钥或完整连接串；不含 `node_modules`、构建产物或临时缓存。

## 目录结构

```
browser/   真实 Chromium（Chrome/148.0.7778.167）四视口矩阵与回归抽查证据
  matrix.json            4 视口 × 9 状态原始几何/可访问性/网络采样（原始 JSON）
  13-browser-analysis.txt 分析器输出（含断言与 === FAILS === 段，结果 NONE）
  15-browser-summary.txt  人可读汇总（A 四视口矩阵 / B §9.5 回归抽查 / C 状态机与网络）
  spot.json               回归抽查原始结果
  12-browser-matrix.txt   矩阵运行日志（requests=375 consoleErrors=0）
  14-browser-spot.txt     抽查运行日志（checks=18 failed=0 listCalls=5 consoleErrors=0）
  10-vite-dev.txt         本 worktree Vite 开发服务器日志
  11-chrome.txt           无头 Chromium 启动日志
  （以上四个 `.txt` 为对应 `.log` 的**逐字节相同副本**：仓库 `.gitignore` 第 30 行 `*.log` 会忽略 `.log`，
    故按任务 §8.4 规则以逐字节相同的 `.txt` 形式纳入证据；磁盘上 `.log` 原件保留但未提交。）
  16-refresh-group-diagnosis.txt 唯一非零几何量（刷新信息组左缘 0.95px）的成因诊断
  shot-*.png              关键状态截图（空闲 / 查询 Loading / 手动 Loading / 查询成功 / 手动失败 / 查询失败，1920×1080）
  harness/                自测脚本（cdp.mjs、matrix.mjs、analyze.mjs、spot.mjs、diag-group.mjs）
frontend/  前端自动化测试 / 类型检查 / 构建原始日志
  01-targeted-component-specs.txt  第 1 层：两个目标组件 spec（113 passed）
  02-feature-data-source-run-state.txt 第 2 层：Feature 全目录（259 passed）
  03-frontend-full-vitest.txt      第 3 层：前端全量 vitest（848 passed）
  04-typecheck-vue-tsc-noEmit.txt  第 4 层：vue-tsc --noEmit（退出码 0，无输出）
  05-build-npm-run-build.txt       第 4 层：npm run build（含 vue-tsc，✓ built in 16.98s）
service/   服务现场证据
  port-process-http.txt   启动前后端口/进程/本机 HTTP 快照
  final-service-state.txt 结束时服务状态、访问 URL 与停止命令
git/       Git 现场与范围/零差异证明
  01-base-status.txt          任务起始分支/HEAD/远程/worktree/主 worktree 快照
  02-diff-and-scope.txt       git diff --check（CLEAN）、--stat、status、变更路径清单
  03-zero-diff-scope.txt      白名单外零差异证明（backend/baseline/CLAUDE.md/composable/page vue/依赖/样式…）
  04-frozen-region-proof.txt  DSS-REQ/DSS-AC 业务行逐字节不变、状态列 107 PASS + 6 NOT_RUN、§14.2/§14.3 与冻结区变更行范围
  05-remote-sync-precheck.txt push 前远程同步复核（local HEAD / origin/develop / ls-remote / ahead-behind）
```

## 关键结论（开发自测）

| 结论 | 值 | 证据 |
|---|---|---|
| 查询按钮四态几何最大位移 | `0.0px`（x/y/w/h 全部） | `browser/matrix.json` + `13-browser-analysis.txt` |
| 立即刷新按钮四态几何最大位移 | `0.0px`（x/y/w/h 全部） | 同上 |
| 查询按钮宽度（四视口 × 九状态） | 恒为 `62px` | 同上 |
| 立即刷新按钮宽度 | 恒为 `110px` | 同上 |
| 两标签中心位移 | `0.0px` / `0.0px` | 同上 |
| 邻近控件（查询/重置组）位移 | `0.0px` | 同上 |
| 查询栏高度 | 单值（`32px`；`1280×800` 既有换行档 `70px`），Loading 不新增换行 | 同上 |
| 指示器 | 常驻节点 ×1、`aria-hidden=true`、与标签无重叠（间隙 2px/11px） | 同上 |
| `aria-busy` | 仅自身 Loading 期间为 `true`，结束即移除 | 同上 |
| 状态独立性 | 查询 Loading 不点亮刷新指示器，反之亦然；自动刷新不点亮任一手动指示器 | 同上 |
| 请求/网络 | 总请求 375、非 GET `0`、1 次有效点击 = 1 次 GET、busy 期间重复点击仅 1 次 GET | 同上 |
| 控制台 | 错误 `0` | 同上 |
| reduced-motion | `animationName=none` 且指示器静态可见、几何仍为零位移 | 同上 |
| 其他路由样式泄漏 | `/monitor/data-source` 上 `dss-*` 节点 `0` | 同上 |
| 回归抽查 | 18/18 通过（popper 480/400/240、截断、Tooltip、重复查询参数、失败保留旧数据、隐形冻结/恢复） | `browser/spot.json` + `14-browser-spot.log` |
| 唯一非零几何量 | 刷新信息组左缘 `0.95px`（`1280×800`），成因=既有“最近成功刷新 HH:mm:ss”文本宽度差，锚定右缘位移 `0`，与 Loading 无关 | `browser/16-refresh-group-diagnosis.txt` |

---

## 更正索引（R1 追加，2026-09-14）

> 本节由 **DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R1** 追加；上方原文（含其原始字节）保持不变，作为历史记录保留。

- 本目录（R0 证据）经 ChatGPT 远程 Git 复审后结论为 **`CHANGES_REQUIRED`**：
  - 本目录 7 个文本文件（`frontend/01-targeted-component-specs.txt`、`frontend/02-feature-data-source-run-state.txt`、`frontend/03-frontend-full-vitest.txt`、`git/01-base-status.txt`、`git/04-frozen-region-proof.txt`、`service/final-service-state.txt`、`service/port-process-http.txt`）经实测 `git diff --check` 返回码 2；R1 已仅做**空白机械清理**（非空白内容逐字节不变），清理证明见 R1 证据 `git/01-r0-evidence-whitespace-cleanup-proof.txt`。
  - 本目录 `browser/16-refresh-group-diagnosis.txt` 记录的刷新信息组左沿 `0.95px` 事实，已被 R1 以定宽时间值槽位 + 固定 2ch 秒数槽位修复至四视口 `0px`。
- R0 报告更正记录：`reports/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001.md` 附录 A（追加）。
- R1 实现报告：`reports/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R1.md`
- R1 证据目录：`evidence/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R1/`
- R1 结束时 `DSS-AC-108~113` 仍为 `NOT_RUN`（本目录开发自测证据不代表正式验收）。
