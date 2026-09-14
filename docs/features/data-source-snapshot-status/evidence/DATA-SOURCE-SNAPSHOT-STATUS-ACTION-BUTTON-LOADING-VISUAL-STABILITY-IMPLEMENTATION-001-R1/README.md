# 证据索引 —— 操作按钮 Loading 视觉稳定性前端实现 R1（刷新信息定宽修复与 R0 复审更正）

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R1`
- 任务性质：前端极小修正 + 自动化测试 + 真实浏览器重新验证 + 证据事实纠正（**非**正式验收、**非**最终收口）
- 执行日期：2026-09-14
- 分支：`develop`（任务在独立 worktree `detached HEAD` 上执行）
- 任务唯一基点提交：`fccefbffccac7fbcc7bff039384549c24e0ed45e`（R0 实现提交）
- 批准内容基准提交：`c4d5c096a7428d7f5be1af0d776c53655dd86e26`
- 文档批准收口 R1 提交：`9f06725d23d66e845cb5ab1d8d8d4f151401893b`
- 结果 worktree：`/agent/dss-abl-impl-001-r1`（**本任务全部实现与自测证据均产自该 worktree**；主 worktree `/agent/cdc-config-platform` 保持 `develop@4222b0a` 与其既有修改，未进入、未清理、未暂存、未提交）
- R0 复审结论（历史事实）：`chatgpt_r0_implementation_review_status=CHANGES_REQUIRED`

> 本目录仅为**开发自测证据**。开发自测不等于正式验收；`DSS-AC-108~113` 共 6 条在 R1 结束时仍为 `NOT_RUN`。
> 本目录不含密码、令牌、Cookie、Authorization、私钥或完整连接串；不含 `node_modules`、构建产物或临时缓存。

## R1 修复内容（对应 R1 Prompt §5）

1. **时间值定宽槽位**：`最近成功刷新：` 固定前缀与时间值拆为独立子节点；时间值槽位由常驻、不可见（`visibility:hidden` + `aria-hidden="true"`）的常量 reserve 文本 `88:88:88` 占位，真实值 `actual` 绝对定位于同一槽位左上。槽位宽度只由常量决定，与真实时间字符串的字形宽度无关（比例数字字体下尤为必要）；页面可见正文严格为 `最近成功刷新：{{ lastRefreshText }}`；未改字体、未用 JS 尺寸测量/`ResizeObserver`/轮询、未用 `!important` 或全局样式。
2. **倒计时秒数固定槽位**：`.dss-countdown-seconds` 由仅 `min-width:2ch` 加固为 `width/min-width/max-width/flex-basis` 同锁 `2ch`、`box-sizing:border-box`、`text-align:right`。
3. **R0 按钮实现零回退**：62px/110px 定宽、两个常驻绝对定位指示器、两个独立标签节点、`aria-busy`/`aria-hidden`/`aria-disabled`、事件去重、reduced-motion、状态独立性全部保留。

## 目录结构

```
browser/   真实 Chromium（Chrome/148.0.7778.167）四视口严格全矩形矩阵、单飞与抽查证据
  strict-matrix.json             4 视口 × 20 状态原始采样（原始 JSON）
  13-strict-whole-rect-analysis.txt 严格分析器输出（全矩形 0px 判据 + 10 项不变量 + 全局网络/控制台/reduced-motion/其他路由）
  15-browser-summary.txt         人可读汇总（A 严格矩阵 / B 单飞 / C §8.4 回归抽查；FAILS=NONE）
  16-per-state-geometry.txt      1920×1080 逐状态几何明细（时间槽位 50.609375px、秒数槽位 14.453125px 等）
  17-r0-0.95px-closure-1280x800.txt 用 R0 相同测量方法在 1280×800 复测：R0 左沿 0.953px -> R1 0px
  12-singleflight-run.txt / singleflight.json  单飞/重复点击防御（10/10 PASS）
  11-spot-run.txt / spot.json    §8.4 回归抽查（18/18 PASS）
  10-strict-matrix-run.txt       严格矩阵运行日志
  14-shot-run.txt                截图脚本运行日志
  shot-*.png                     关键状态截图（空闲 / 时间替换 / 手动 Loading，1920×1080）
  harness/                       自测脚本（cdp.mjs、strict.mjs、singleflight.mjs、spot.mjs、shot.mjs、diag-group.mjs）
frontend/  前端自动化测试 / 类型检查 / 构建原始日志
  01-targeted-component-specs.txt  第 1 层：两个目标组件 spec（2 文件 / 119 passed）
  02-feature-data-source-run-state.txt 第 2 层：Feature 全目录（13 文件 / 265 passed）
  03-frontend-full-vitest.txt      第 3 层：前端全量 vitest（50 文件 / 854 passed）
  04-vue-tsc-noemit.txt            第 4 层：vue-tsc --noEmit（exit=0）
  05-frontend-build.txt            第 4 层：npm run build（✓ built in 16.29s，exit=0）
service/   服务现场证据
  vite-dev.txt           本 worktree Vite 开发服务器日志（0.0.0.0:5173）
  chrome.txt             无头 Chromium 启动日志
  final-service-state.txt 结束时服务状态、访问 URL、日志路径与停止命令
git/       Git 现场与范围/零差异/冻结区证明
  01-r0-evidence-whitespace-cleanup-proof.txt  R0 证据 7 文件空白机械清理证明（含 R0 `git diff --check` 实测退出码 2 的事实）
  02-r1-base-and-zero-diff-scope.txt   R1 基点、变更范围、Feature 目录逐文件零差异核验
  03-r1-frozen-region-proof.txt        DSS-REQ 89 行业务行、DSS-AC 113 行业务行+状态列、§14.2/§14.3 映射行逐字节不变
```

## 关键结论（开发自测）

| 结论 | 值 | 证据 |
|---|---|---|
| 刷新信息组整矩形（x/y/w/h）四视口最大位移 | `0px`（x/y/width/height 全部） | `browser/strict-matrix.json` + `13-strict-whole-rect-analysis.txt` |
| `.dss-refresh-time` 外框宽度位移 | `0px` | 同上 |
| 时间值槽位宽度位移 | `0px`（1920×1080 恒为 `50.609375px`） | 同上 |
| 倒计时秒数槽位宽度位移 | `0px`（恒为 `14.453125px`） | 同上 |
| R0 唯一非零量复测（1280×800 刷新组左沿） | R0 `0.953px` → R1 `0px` | `17-r0-0.95px-closure-1280x800.txt` |
| 立即刷新按钮四态几何位移 / 宽度 | `0px` / 恒 `110px` | `browser/strict-matrix.json` |
| 查询按钮四态几何位移 / 宽度 | `0px` / 恒 `62px` | 同上 |
| 两标签中心位移 | `0px` / `0px` | 同上 |
| 查询/重置组、查询栏高度几何位移 | `0px` / `0px` | 同上 |
| 指示器 | 常驻 `aria-hidden=true`、文本恒 `88:88:88`、`visibility=hidden`（reserve） | 同上 |
| `aria-busy` | 仅手动 Loading 期为 `true`；按钮从不原生 `disabled` | 同上 |
| 状态独立性 / reduced-motion | 查询与刷新指示器互不串点亮；`prefers-reduced-motion` 下动画 `none` 且指示器静态可见、几何零位移 | 同上 |
| 请求/网络 | 总请求 318、非 GET `0`、api 非 GET `0` | 同上 |
| 控制台 | 错误 `0` | 同上 |
| 其他路由样式泄漏 | `/monitor/data-source` 上 `dss-*` 节点 `0` | 同上 |
| 单飞/重复点击防御 | 10/10 PASS（busy 期间 3×刷新+3×查询+2×Enter 仅 1 次列表 GET） | `browser/singleflight.json` |
| §8.4 回归抽查 | 18/18 PASS（popper 480/400/240、截断、Tooltip、重复查询参数、失败保留旧数据、隐形冻结/恢复） | `browser/spot.json` |
| 测试阶梯 | 目标 119 / Feature 265 / 前端全量 854，全部通过 | `frontend/01~03-*.txt` |
| 类型检查 / 构建 | `vue-tsc --noEmit` exit=0；`npm run build` exit=0 | `frontend/04~05-*.txt` |
| R0 证据空白清理 | 7 文件仅空白机械清理，非空白内容逐字节不变；R0 `git diff --check` 实测退出码 `2` | `git/01-r0-evidence-whitespace-cleanup-proof.txt` |
| 冻结区 | `DSS-REQ` 89 行、`DSS-AC` 113 行+状态列（`PASS 107 / NOT_RUN 6`）、§14.2/§14.3 映射行逐字节不变 | `git/03-r1-frozen-region-proof.txt` |


## R2 严格断言闭环更正导航（2026-09-14，追加；不改动上文任何字节）

> 本 R1 证据目录为**历史事实**，保持原样不变：其中 `browser/10-strict-matrix-run.txt` 的 `exit=0` 只证明脚本运行到底，`browser/harness/strict.mjs` 除运行异常外未做失败断言。该问题已由 **R2** 更正，未回写、未覆盖、未删除本目录任何文件。

- 更正确认（远程 Git 复审）：ChatGPT 对 R1 结果提交 `1b58e3c9a234062bb1b9351f7675aeb21abd76cd` 的复审结论为 `CHANGES_REQUIRED_EVIDENCE_ASSERTION_ONLY`，唯一问题为“实测数据 → 机器可失败断言 → 真实退出码”闭环缺失。
- 更正交付：`DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R2`，仅新增断言模块、带失败断言的浏览器 harness、无页面负向自测及对应证据，**`frontend/**` 零差异**。
- 更正后证据目录：`../DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R2/`
- 更正后报告：`docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R2.md`
- 状态不变：`DSS-AC-108~113` 共 6 条仍为 `NOT_RUN`。
