# 中心端配置正式验收失败项定向重验报告

## 1. 任务元数据

| 项目 | 值 |
|---|---|
| 任务编号 | `SERVER-CONFIG-FORMAL-ACCEPTANCE-TARGETED-RETEST-001` |
| Feature | `server-config`（中心端配置） |
| 仓库/分支 | `acmilan1982/cdc-config-platform` / `develop` |
| 授权起点（HEAD = origin/develop） | `70382a64bfae5ef2ba847fe6c65d2817304042ca` |
| ChatGPT 代码复审结论 | `code_review_status=PASSED`（已只读复审 `70382a6` 修改范围、实现逻辑、安全文本边界及新增测试） |
| 任务性质 | 真实浏览器定向重验、最小数据库数据构造、证据报告 |
| 定向重验用例 | `SC-AC-009`、`SC-AC-062` |
| 执行日期 | 2026-08-28 |
| 候选综合结果 | `66 PASSED / 0 FAILED`，状态 `TARGETED_RETEST_PASSED_PENDING_CHATGPT_REVIEW` |

本任务只验证修复后的真实浏览器行为，未修改任何代码、测试、后端或批准文档，未执行其余 64 条验收，未进入最终收口。

## 2. Git 开始现场与无关工作区保护

任务开始时 `HEAD == origin/develop == 70382a64bfae5ef2ba847fe6c65d2817304042ca`，ahead/behind 为 `0 0`（`git rev-list --left-right --count origin/develop...HEAD` = `0 0`）。

工作区存在大量与本任务无关的既有变更（前端布局、`docs/agent-prompts`、`docs/database` 删除项、`agent-env.sh`、`frontend/index.html` 等），全部原样保留，未清理、未覆盖、未暂存、未提交。本任务只新建并提交 1 个定向重验报告文件。

## 3. 前后端实际运行状态与前端重启情况

- 后端 `cdc-config`（Spring Boot，端口 8080，pid 3312）：健康，未重启。
- 前端 Vite 开发服务器（端口 5173，pid 3376）：运行中，经服务端加载模块核验已反映 `70382a6` 修复（`ConfigValueEditor.vue` 模块含 `hasRawValue`，`ServerConfigPage.vue` 模块含 `配置Key：` 前缀），**未重启**。
- Chrome 无头浏览器（CDP 127.0.0.1:9222，pid 5045）用于真实浏览器定向重验。
- `frontend_service_operation_status=NONE`，`backend_service_operation_status=NONE`，`business_service_operation_status=NONE`。

## 4. 数据构造对象与影响行数

- 目标表：`CDC_SERVER_CONFIG`；目标行：`ID_SERVER_CONFIG='001'`、`CONFIG_KEY='server-log-topic-name'`、`IS_EDITABLE='0'`（只读）。
- 仅对该行 `CONFIG_VALUE` 执行临时 `UPDATE`，影响 1 行；`CONFIG_KEY / CONFIG_DESC / SERVER_ID / IS_EDITABLE / ID_SERVER_CONFIG` 均未修改。
- 测试值：由非敏感合成前缀与连续 ASCII 字符组成、长度 64 个可见字符的测试字符串，保证在约 360px 值列中必然溢出，不含任何敏感信息。
- 原值在 `/tmp` 非 Git 位置备份；重验完成后立即恢复，恢复后该行 `VAL_LEN=23`、`IS_EDITABLE='0'`。
- 本报告不记录原始真实配置值。

## 5. `SC-AC-009` 每个必要子项浏览器实测数据与状态

真实 Chrome 浏览器加载 `http://192.168.174.70:5173/config/server`，对行 0（`server-log-topic-name`，只读）逐项采集：

| # | 必要子项 | 实测数据 | 状态 |
|---|---|---|---|
| 1 | 悬停 `.key-icon` 的 Key Tooltip 精确为 `配置Key：{CONFIG_KEY}` | 可见 Tooltip 文本 = `配置Key：server-log-topic-name` | PASSED |
| 2 | Key Tooltip 非纯 Key、未截断、未脱敏 | 文本完整含前缀与完整 Key | PASSED |
| 3 | 页面无独立 Key 列 | 表头 = `[配置项说明, 配置值]`，无 `CONFIG_KEY` 独立列 | PASSED |
| 4 | `.raw-value` 的 `textContent` 等于完整测试原文（无 JS 截断） | `textLen=64`，`textEqualsFull=true` | PASSED |
| 5 | `.raw-value` 计算样式为单行省略 | `white-space=nowrap`、`overflow=hidden`、`text-overflow=ellipsis`、`display=block` | PASSED |
| 6 | 测试值真实超出可用宽度 | `clientWidth=336`、`scrollWidth=478`、`scrollGtClient=true` | PASSED |
| 7 | 渲染高度保持单行范围，不再多行折行 | `clientHeight=23`、`lineCount=1`（`getClientRects()` 单行）、行高 `row_height=40` | PASSED |
| 8 | 只读值尾部可见省略号 | 截图证据 `/tmp/sc-retest-009-062.png`（非 Git）可见省略号 | PASSED |
| 9 | 悬停 `.raw-value` 本身（非 `.key-icon`）显示完整原文 | 可见 Tooltip 文本 = 完整 64 字符测试原文 | PASSED |
| 10 | 值 Tooltip 与 Key Tooltip 是两个不同触发目标、内容不串用 | `keyIconCount=1`、`rawValueIsTooltipTrigger=true`、`keyIconIsRawValue=false`；分别悬停各自取到对应内容 | PASSED |
| 11 | 页面无横向滚动溢出 | `documentElement.scrollWidth <= clientWidth` = `true` | PASSED |

`SC-AC-009` 定向重验结论：**PASSED**（全部必要子项通过）。

## 6. `SC-AC-062` 独立合取要求结论

`SC-AC-062` 作为独立验收编号逐项判定：

| 合取子项 | 实测 | 状态 |
|---|---|---|
| 正常值与长测试值均不脱敏、不掩码 | DOM 与 Tooltip 均为完整原文，无掩码/脱敏 | PASSED |
| DOM/Tooltip 保存的是完整原文 | `textEqualsFull=true`、Tooltip = 完整 64 字符原文 | PASSED |
| 长只读值在单元格中省略显示，悬停展示完整原文 | 单行省略（`overflow:hidden`/`ellipsis`/`nowrap`）+ 悬停原文 | PASSED |
| 页面不存在配置 Key 独立列 | 表头 = `[配置项说明, 配置值]` | PASSED |
| Key 仅通过信息图标按需展示，符合批准格式 | `.key-icon` 悬停 Tooltip = `配置Key：server-log-topic-name` | PASSED |

`SC-AC-062` 定向重验结论：**PASSED**（全部合取子项通过）。

## 7. Key Tooltip 与值 Tooltip 触发元素、实际文本及不串用证据

- **Key Tooltip**：触发元素为配置项说明列的信息图标 `.key-icon`；实际文本 `配置Key：server-log-topic-name`；在页面加载后单独悬停取证。
- **值 Tooltip**：触发元素为不可编辑单元格值 `.raw-value`；实际文本为完整 64 字符测试原文（未截断、未脱敏）。
- **不串用证据**：两个 Tooltip 分别由不同元素触发，`trigger_analysis` 显示 `.key-icon` 与 `.raw-value` 为两个不同节点（`keyIconIsRawValue=false`），先悬停 `.key-icon` 取到 Key 内容、再悬停 `.raw-value` 取到值内容，内容互不串用。两 Tooltip 均隐藏后再分别悬停取证，避免残留弹层干扰。

## 8. 客观测量数据汇总

| 测量项 | 值 |
|---|---|
| `.raw-value` `clientWidth` | 336 |
| `.raw-value` `scrollWidth` | 478 |
| `scrollWidth > clientWidth` | true（真实溢出） |
| `white-space` | nowrap |
| `overflow` | hidden |
| `text-overflow` | ellipsis |
| `display` | block |
| `clientHeight` | 23 |
| 行数（`getClientRects()`） | 1（单行） |
| 行高 `row_height` | 40 |
| 页面横向溢出 `no_hscroll` | true |
| 表头 | `[配置项说明, 配置值]`（无 Key 独立列） |

## 9. 数据库恢复与最终页面正常加载证据

- **SQL 恢复确认**：定向重验后立即恢复 `CONFIG_VALUE` 原值（1 行更新），随后查询确认该行 `VAL_LEN=23`、`IS_EDITABLE='0'`。
- **浏览器重载确认**：重新加载页面后行 0 显示恢复后的值（`row0ValueLen=23`），页面正文无测试字符串残留（`bodyHasTestValue=false`），页面正常加载（`mainLoaded=true`）。
- **最终表状态**：`CDC_SERVER_CONFIG` 共 8 行、`SERVER_ID` 去重 1 个、只读行 2 个、测试字符串残留 0；`CDC_SERVER` 只读查询 1 行。
- `config_table_restore_status=SUCCESS`，`config_table_final_state=NORMAL_LOADABLE`（行数与记录身份不变、无测试字符串残留）。

## 10. 定向与 Feature 自动化测试真实结果

| 验证 | 命令 | 结果 |
|---|---|---|
| 定向测试 | `npx vitest run src/views/server-config/ServerConfigPage.spec.ts` | 1 file, 36 tests passed |
| Feature 测试 | `npx vitest run src/api/serverConfig.spec.ts src/views/server-config/configRules.spec.ts src/views/server-config/ServerConfigPage.spec.ts` | 3 files, 66 tests passed |
| 空白校验 | `git diff --check` | 通过 |
| 代码/批准文档零变化 | `git diff 70382a6 -- frontend/src/views/server-config/ frontend/src/api/serverConfig.spec.ts docs/features/server-config/ docs/features/README.md` | 无输出（零变化） |

代码与测试未做任何修改。

## 11. 数据库、接口、服务、ZooKeeper、业务进程操作状态

- **数据库**：`CDC_SERVER_CONFIG` 仅 1 行 `CONFIG_VALUE` 临时 `UPDATE`（已恢复），`CDC_SERVER` 仅只读查询；其余表未访问；未执行任何 `INSERT / DELETE`、DDL、`TRUNCATE`、索引/约束/物理外键操作。
- **接口**：未调用任何写接口；仅浏览器通过现有前端只读加载页面。
- **服务**：后端、前端均未启动、停止或重启；Chrome CDP 复用现有实例。
- **ZooKeeper / Kafka**：未操作。
- **业务进程**：`sync-server`、`sync-client`、`sync-log` 均未启动、停止或重启。

## 12. 候选综合结果与等待 ChatGPT 复审声明

- `targeted_retest_passed_count=2`，`targeted_retest_failed_count=0`，`targeted_retest_blocked_count=0`。
- 候选综合结果 `66 PASSED / 0 FAILED`。
- 状态仅可为 `TARGETED_RETEST_PASSED_PENDING_CHATGPT_REVIEW`。
- 本任务未修改原正式验收报告中的 `64/2`，未修改 `ACCEPTANCE.md`；最终状态迁移由 ChatGPT 复审通过后的单独收口任务完成。等待 ChatGPT 复审，尚未收口。

## 13. 修改文件、Commit、Push 与 ahead/behind

- 唯一新建并提交文件：`docs/features/server-config/reports/SERVER-CONFIG-FORMAL-ACCEPTANCE-TARGETED-RETEST-001.md`。
- 未修改/未提交：任何代码或测试、`SERVER-CONFIG-FORMAL-ACCEPTANCE-001.md`、`SERVER-CONFIG-FORMAL-ACCEPTANCE-DEFECT-FIX-001.md`、六份批准功能文档、`docs/features/README.md`、其他报告或截图/数据库导出/临时 SQL/浏览器会话/构建产物。
- Commit 信息：`test(server-config): record targeted acceptance retest`。
- Push：普通 push 到 `origin/develop`（无 force）。
- 推送后核对：`HEAD == origin/develop`、ahead/behind `0 0`。
- 无关工作区内容全部原样保留。

（本报告记录 Commit/Push 计划与实际执行结果；最终值见任务完成后的控制台机器块。）
