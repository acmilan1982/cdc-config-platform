# 09 — `LTVT-FA-001` ～ `LTVT-FA-014` 正式验收用例结果

> 任务：`LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001`
> 受验对象：`b36c521023f0cf220376f5071e46c1b6b1300f7f`（实现 `284b263`）
> 接入前基准：`ae6439b312bb6549f9ac7c31a3c7e5a8c524fec7`（隔离临时副本）
> 执行日期：2026-09-22
> 汇总：**14 PASS / 0 FAIL / 0 BLOCKED / 0 NOT_RUN**

| ID | 验收项 | 前置条件 | 执行命令 / 步骤 | 原始结果 | 证据路径 | 判定 |
| --- | --- | --- | --- | --- | --- | --- |
| LTVT-FA-001 | Git 与实现身份 | `develop`，HEAD=`b36c521` | `git rev-parse HEAD/origin/develop/refs/remotes/origin/develop`；`git rev-list --left-right --count`；`git diff --quiet 284b263..HEAD -- backend frontend`；`git diff --name-only ae6439b..HEAD -- backend frontend` | 三方均为 `b36c521`；ahead/behind `0 0`；相对 `284b263` 零差异（退出码 0）；相对 `ae6439b` 恰为授权 5 文件 | `00-git-runtime-and-scope.md`；原始 `/tmp/ltvt-fa-001/fa001-git.txt` | **PASS** |
| LTVT-FA-002 | 公共静态契约 | `list-table-visual.spec.ts` 存在 | `npx vitest run src/styles/list-table/list-table-visual.spec.ts` | `Tests 12 passed (12)`；根类 `lt-main-table`；9 令牌；公共层不声明令牌值；无裸 EP 选择器 / 业务类 / 业务文案 / `!important` / 路由元数据；辅助类 0 | `01-automation-gates.md` | **PASS** |
| LTVT-FA-003 | 参考页组件契约 | `dataSource.spec.ts` 存在 | `npx vitest run src/views/data-source/dataSource.spec.ts` + 源码只读检查 | `Tests 116 passed (116)`；`['data-table', LT_MAIN_TABLE_CLASS]` 并存；import 与 `<style scoped src>` 均在；Props/Slots/Events/Ref、空态、双击、固定操作列行为不变 | `01-automation-gates.md` | **PASS** |
| LTVT-FA-004 | 前端定向测试 | 无 | `npx vitest run src/views/data-source/dataSource.spec.ts src/styles/list-table/list-table-visual.spec.ts` | `Test Files 2 passed (2)` / `Tests 128 passed (128)` | `01-automation-gates.md`；原始 `/tmp/ltvt-fa-001/fa004-targeted.txt` | **PASS** |
| LTVT-FA-005 | 前端全量测试 | 无 | `npx vitest run` | `Test Files 57 passed (57)` / `Tests 1063 passed (1063)`，`EXIT=0` | `01-automation-gates.md`；原始 `/tmp/ltvt-fa-001/fa005-full.txt` | **PASS** |
| LTVT-FA-006 | 前端生产构建与产物 | 基准产物已由 `ae6439b` 隔离副本构建 | `npm run build` + `scan-build-artifacts.mjs` | 构建 `EXIT=0`；`ok=true`，`newRules=4`（全部带根类）、`removedRules=4`（全部 `.data-table`）、`publicRules=4` 单分块、`newGlobalRules=0`、`tokenDeclarations=0`、令牌字面量仅出现在启用页 CSS | `02-static-contract-and-build-artifact.md`；原始 `/tmp/ltvt-fa-001/build-artifact-scan.json` | **PASS** |
| LTVT-FA-007 | 1440×900 逐值等价 | 基准服务 `:5174`、实现服务 `:5173`、Chrome CDP `:9222` 均就绪 | `sample-equivalence.mjs --cdp-port 9222 --baseline http://127.0.0.1:5174 --impl http://127.0.0.1:5173` + `judge-equivalence.mjs` | `EQUIVALENCE ok=true failures=0`；`mainStyleMax=0 mainGeomMax=0 namingStyleMax=0 namingGeomMax=0 subpixelNoise=0` | `03-browser-equivalence-1440x900.json` | **PASS** |
| LTVT-FA-008 | 1920×1080 逐值等价 | 同上 | 同上（第二次视口） | 同 1440×900，全部 `0`，`failures=0` | `04-browser-equivalence-1920x1080.json` | **PASS** |
| LTVT-FA-009 | Feature 覆盖与 fallback A–F | 同上 | `sample-fallback-override.mjs --cdp-port 9222 --impl http://127.0.0.1:5173` | `FALLBACK_OVERRIDE ok=true checks=25 failed=0`；覆盖令牌读到 Feature 值；未覆盖令牌本身为空；消费属性取 fallback；未以令牌非空判断启用 | `05-fallback-override-a-f.json`；原始 `/tmp/ltvt-fa-001/fa009.txt` | **PASS** |
| LTVT-FA-010 | 同页命名策略表隔离 | 同上 | 采样 `.naming-table` 与基准对比 | `.naming-table` 不含公共类；公共规则匹配数 0；令牌为空；计算样式/几何与基准逐值相同（`namingStyleMax=0 namingGeomMax=0`） | `03-browser-equivalence-1440x900.json`（`naming*` 字段） / `04-browser-equivalence-1920x1080.json` | **PASS** |
| LTVT-FA-011 | 负向页面矩阵 | 同上 | `sample-negative-pages.mjs --cdp-port 9222 --baseline …:5174 --impl …:5173` + 源码 grep 分层标注 | `NEGATIVE_PAGES ok=true pages=8 failures=0 maxStyleDiff=0 maxGeomDiff=0`；日志查询与故障历史基线与当前均 `TABLE_NOT_RENDERED`；源码仅公共层 + 数据源参考页引用 `lt-main-table` | `06-negative-page-matrix.json`；原始 `/tmp/ltvt-fa-001/fa011.txt` | **PASS** |
| LTVT-FA-012 | 反向控制 | 控制副本目录可用 | `reverse-controls-source.mjs` + 注入 `0.001px` 后 `judge-equivalence.mjs --inject-px 0.001` | 源码侧 `ok=true`：S0=0（保真）、S1=1、S2=1、S3=1；运行时注入 `0.001px` → `ok=false`、`failureCount=1`、`mainGeomMax=0.0009999999999976694` | `07-reverse-controls.md`；原始 `/tmp/ltvt-fa-001/reverse-controls-source.json`、`judgement-negative-control.json` | **PASS** |
| LTVT-FA-013 | 隔离回滚验证 | 隔离克隆 `/tmp/ltvt-fa-001/rollback` | 按路径回退参考页两文件 → 残留审核 → `npx vitest run` → `npm run build` → 产物扫描与直接 grep | 残留 `0`；业务类与四组本地规则恢复；公共层保留；`Tests 121 passed (121)`；构建 `EXIT=0`；回退产物含 `lt-main-table` 文件数 `0`（接入产物 `2`） | `08-isolated-rollback.md`；原始 `/tmp/ltvt-fa-001/fa013-*.txt` | **PASS** |
| LTVT-FA-014 | 授权与状态边界 | 无 | 授权文档、工作区与运行边界只读核验 | 项目负责人目测 PASS 已有证据；无其他页面迁移；无写 API、数据库写入或外部系统主动访问；正式验收未冒充最终接受 | `10-service-and-readonly-boundary.md` | **PASS** |

## 判定口径

- 严格 0：计算样式与几何差异阈值**未**放宽，`mainGeomMax`/`mainStyleMax` 等全部为 `0`（±0.001px 级别位移仍被检出，见 LTVT-FA-012）。
- 首次失败处置：LTVT-FA-005 出现一次后台 shell 工作目录错误（`EXIT=1`、无输出），原始日志保留于 `/tmp/ltvt-fa-001/fa005-attempt1-badcwd.txt`，修正执行目录后重跑通过；未修改代码、测试或断言。
- 计数基线：`26 / 0 / 42 / 7`、`0 / 79`、`15 / 14`、qlpt `48 / 43 / 9 / 66` 全部保持（见 `00-git-runtime-and-scope.md` §7）。
