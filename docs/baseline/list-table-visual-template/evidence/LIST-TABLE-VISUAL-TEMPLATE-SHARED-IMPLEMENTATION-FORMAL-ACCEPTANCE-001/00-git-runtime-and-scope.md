# 00 — Git、运行时与范围现场（LTVT-FA-001 支撑证据）

> 任务：`LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001`
> 类型：`FORMAL_ACCEPTANCE_FRONTEND_SHARED_VISUAL_PRESET_AND_REFERENCE_INTEGRATION`
> 执行日期：2026-09-22
> 受验对象：`b36c521023f0cf220376f5071e46c1b6b1300f7f`
> 原始日志：`/tmp/ltvt-fa-001/fa001-git.txt`（本任务运行期临时目录，不入 Git）

## 1. Git 身份三方一致

```text
git rev-parse HEAD                    = b36c521023f0cf220376f5071e46c1b6b1300f7f
git rev-parse origin/develop          = b36c521023f0cf220376f5071e46c1b6b1300f7f
git rev-parse refs/remotes/origin/develop = b36c521023f0cf220376f5071e46c1b6b1300f7f
git branch --show-current             = develop
git rev-list --left-right --count HEAD...origin/develop = 0	0
```

结论：本地 HEAD、`origin/develop` 与远程 `refs/heads/develop` 三方一致，ahead/behind = `0 0`，与任务要求的 `required_base_commit` 完全相同。

## 2. 相对实现提交的代码身份

受验对象必须与实现任务提交 `284b263` 在 `backend/**`、`frontend/**` 上零差异：

```text
git diff --quiet 284b263d741c1af14abe2bdd1479a69ca24d8fb7..HEAD -- backend frontend
```

实际输出：**空**（无文件列出），退出码 `0` —— 满足通过条件。

## 3. 授权变更范围收敛

相对**接入前提交** `ae6439b312bb6549f9ac7c31a3c7e5a8c524fec7`：

```text
git diff --name-only ae6439b..HEAD -- backend frontend
frontend/src/styles/list-table/index.ts
frontend/src/styles/list-table/list-table-visual.css
frontend/src/styles/list-table/list-table-visual.spec.ts
frontend/src/views/data-source/DataSourcePage.vue
frontend/src/views/data-source/dataSource.spec.ts
```

恰为设计批准文件清单中的 5 个文件，无多余文件、无其他页面接入、无后端改动。**该 5 个文件之外不存在任何业务代码变更**。

## 4. 任务开始前工作区现场

```text
 M .claude/settings.local.json
?? docs/prompts/
```

两者均为任务开始前已存在的范围外内容（Agent/服务器配置与未跟踪任务提示词）。本任务全程未修改、未暂存、未提交、未删除它们。

## 5. 运行时现场（正式验收期间）

| 角色 | PID | 监听 | 说明 |
| --- | --- | --- | --- |
| 后端应用 | 3915 | `127.0.0.1:8080` | 前序任务遗留，本任务只做只读 GET 观察，未启停 |
| 前端 wrapper | 4018 | — | 前序任务遗留 |
| 前端 npm | 4019 | — | 前序任务遗留 |
| 前端 vite | 4030 | `0.0.0.0:5173` | 「当前实现」服务，页面 `http://192.168.174.70:5173/config/data-source` |
| 前端 esbuild | 4038 | — | 前序任务遗留 |
| **基准 vite（本任务新建）** | wrapper 8653 | `0.0.0.0:5174` | 来自接入前提交 `ae6439b` 的**隔离临时副本**，端口与 5173 分离 |
| **Chrome（本任务新建）** | wrapper 8978 | CDP `127.0.0.1:9222` | 用于只读浏览器取证 |

原始日志：`/tmp/ltvt-fa-001/baseline.pid`、`/tmp/ltvt-fa-001/baseline-dev.log`、`/tmp/ltvt-fa-001/chrome.pid`、`/tmp/ltvt-fa-001/chrome.log`。

基准副本构建于 `/tmp/ltvt-baseline/`（`ae6439b` 副本 + 独立 `dist`），**未**触碰正式工作树 `frontend/dist` 之外的任何产物，也**未**在正式工作树执行任何回滚。

## 6. 范围边界声明

- 未修改 `backend/**`、`frontend/**`、测试代码、配置、依赖或锁文件。
- 未调用 POST / PUT / PATCH / DELETE 或任何启停、删除、保存类接口。
- 未直接连接数据库、未执行 SQL/DDL/DML。
- 未主动访问或写入 ZooKeeper、Kafka、业务源库、目标库。
- 未修改既有实现报告、R1/R2/目测收口历史报告或既有浏览器证据。
- 未迁移任何其他页面。
- 未写入 `ACCEPTED` / `IMPLEMENTED_ACCEPTED` / 生产可用 / 页面迁移已授权。

## 7. 冻结不变量复核

| 不变量 | 期望 | 实测 | 结果 |
| --- | --- | --- | --- |
| 四份规范文档标记计数 | `26 / 0 / 42 / 7` | `26 / 0 / 42 / 7` | PASS |
| 公共实现详细设计标记计数 | `0 / 79` | `0 / 79` | PASS |
| 候选盘点 | `15 / 14` | MIGRATION.md `el_table_usage_count=15` 保留 | PASS |
| qlpt 冻结计数 | `48 / 43 / 9 / 66` | `docs/baseline/query-list-page-template/` 相对 HEAD **零差异** | PASS |
| 公共根类 | `lt-main-table` | 仅 `frontend/src/styles/list-table/{index.ts,list-table-visual.css,list-table-visual.spec.ts}` 与数据源参考页两文件引用 | PASS |
| 令牌数量 | `9` | `index.ts` 中 `'--lt-` 字面量 = 9 | PASS |
| 内部辅助类数量 | `0` | 静态契约测试第 10 项断言 0，实测 0 | PASS |
