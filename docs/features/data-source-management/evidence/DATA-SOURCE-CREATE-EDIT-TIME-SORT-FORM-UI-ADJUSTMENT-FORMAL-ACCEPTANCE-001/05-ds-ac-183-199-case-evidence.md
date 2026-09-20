# 05 — `DS-AC-183~199` 逐用例证据索引

> 任务：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`　`RUN_TAG=FACC002`
> 运行源：工作树 `/agent/cdc-temp-ds-formui-formal-001` @ `db1cfda7c8e10ddd5faa2a119e7550059a687d05`（后端 PID 51273 / 前端 PID 51302）
> 结论：**17/17 = PASS**（`FAIL=0 BLOCKED=0 NOT_RUN=0`）

## 0. 关键环境事实（影响所有时间类用例）

| 事实 | 值 | 来源 |
|---|---|---|
| 应用机时钟 `date` | `2026-09-20 17:18:09` | 本机 |
| 数据库 `SYSDATE`（同一时刻） | `2026-09-20 17:19:07` | 只读 `SELECT TO_CHAR(SYSDATE,…) FROM DUAL` |
| 偏差 | **数据库比应用机快 ≈ 58 秒** | — |

> 因此所有"是否被更新"的判断**一律以数据库 `SYSDATE` 为准**，不依赖应用机时钟；写操作前先读取数据库当前秒，确认已跨秒后再触发，避免同秒被误判为"未更新"。

## 1. 受控数据写入记录（真实执行）

| 阶段 | 通道 | 事务/HTTP | 预期 | 实际 |
|---|---|---|---|---|
| 预置 6 条（`FACC002-SRC-EN0/DIS0/BAD`、`FACC002-SORT-NULL/A/B`） | `SQL*Plus` 受控事务 | `SET EXITCOMMIT OFF` + PL/SQL 校验行数后 `COMMIT` | 6 行 | `TOTAL_INSERTED=6` → `DECISION=COMMIT`；主表 36→42 |
| 新增 6 条（`SRC-NEW/EN1/DIS1`、`TGT-BIZ`、`SRC-NAME/TGT-NAME`） | 真实 `POST /api/data-sources` | HTTP 200 ×6 | 6 行 | 主表 42→48；`data` 回显各自 ID |
| 新增 1 条（`FACC002-UI-NEW`） | **真实浏览器**新增弹窗提交 | POST `/api/data-sources` | 1 行 | 主表 48→49；界面提示「新增成功」 |

## 2. 逐用例结论

### DS-AC-183 新增时两条时间字段同源且相等 —— **PASS**

- 真实新增 `FACC002-SRC-NEW`（HTTP 200）。
- 数据库核验：`INSERT_TIME = UPDATE_TIME = 2026-09-20 17:18:53`，均非空。
- `.log` 证据：`ds-ac-183.log`（内含 `post-create.log`、`q1.log` 摘录与 mapper SQL）。
- 同一条 INSERT：`DataSourceMapper.insertWithSysdate` 使用**显式 `@Insert`**，`VALUES (…, SYSDATE, SYSDATE)`（`DataSourceMapper.java`），非 MyBatis-Plus 通用 insert。
- 非 JVM 时间：接口响应体 `timestamp` 为 `2026-09-20T17:17:54.916`（应用机），而落库值为 `17:18:53`（数据库时钟），**相差约 58 秒**，证明取的是数据库 `SYSDATE`。
- 无列默认值、无触发器：`03-db-metadata-and-run-tag.md §1`；`USER_TRIGGERS` 计数 = 0。

### DS-AC-184 修改保留 `INSERT_TIME`、同一条 UPDATE 更新 `UPDATE_TIME` —— **PASS**

- 写前读数据库 `SYSDATE=2026-09-20 17:19:17`，已跨秒。
- `PUT /api/data-sources/FACC002-SRC-NEW`（HTTP 200）。
- 前：`IT=17:18:53 / UT=17:18:53`；后：`IT=17:18:53 / UT=17:19:18`，`DATA_SOURCE_NAME` 同步变更。
- `INSERT_TIME` **逐字节未变**；`UPDATE_TIME` 与业务列在同一次 `LambdaUpdateWrapper`（`setSql("UPDATE_TIME = SYSDATE")`）中更新。
- 证据：`ds-ac-184.log`。

### DS-AC-185 启用：非幂等更新时间，幂等零 DML —— **PASS**

| 记录 | 写前 | 操作 | 写后 | 判定 |
|---|---|---|---|---|
| `FACC002-SRC-EN0`（`'0'`，`UT=2026-09-19 08:00:00`） | 非幂等 | `PUT .../enable` HTTP 200 | `FG_ACTIVE='1'`，`IT` 不变，`UT=2026-09-20 17:19:25` | 更新时间 ✓ |
| `FACC002-SRC-EN1`（`'1'`，`UT=2026-09-20 17:18:53`） | 幂等 | `PUT .../enable` HTTP 200 | `FG_ACTIVE='1'`，`IT/UT` **完全未变**（17:18:53 / 17:18:53） | 零 DML ✓ |

- `INSERT_TIME` 两条均未变。证据：`ds-ac-185.log`。
- 零 DML 的实现依据：`DataSourceServiceImpl.enable()` 观测到已为 `'1'` 时**提前返回**，不进入 `updateStatusConditionally`。
- 说明（证据层级）：开发库未开启 `ROWDEPENDENCIES`，`ORA_ROWSCN` 为块级近似值，故**不作为**零 DML 的判定依据；判定依据为"HTTP 成功 + 两列逐字节未变 + 代码路径审计"。

### DS-AC-186 停用：非幂等 / 异常归一化更新时间，幂等零 DML —— **PASS**

| 记录 | 写前 | 操作 | 写后 | 判定 |
|---|---|---|---|---|
| `FACC002-SRC-DIS1`（`'1'`） | 非幂等 | `PUT .../disable` 200 | `'0'`，`IT` 不变，`UT=17:19:31` | 更新时间 ✓ |
| `FACC002-SRC-BAD`（`NULL` 异常态） | 归一化 | `PUT .../disable` 200 | `'0'`（归一化），`IT=2026-09-19 07:50:00` 不变，`UT=17:19:31` | 归一化 + 更新时间 ✓ |
| `FACC002-SRC-DIS0`（`'0'`） | 幂等 | `PUT .../disable` 200 | `'0'`，`IT=2026-09-19 07:45:00`、`UT=2026-09-19 08:00:00` **完全未变** | 零 DML ✓ |

- 三条 `INSERT_TIME` 均未变。证据：`ds-ac-186.log`。

### DS-AC-187 业务属性：成功同一条 UPDATE 更新时间，失败整体回滚 —— **PASS**

- 成功：`PUT /api/data-sources/FACC002-TGT-BIZ/biz-attr`（短值）→ HTTP 200，`UT 17:18:53 → 17:19:39`，`IT` 不变。
- 失败：同端点提交 **2100 字符**业务属性 → HTTP **500**，后端日志 `ORA-12899: value too large for column "CDC"."CDC_DATA_SOURCE"."DATA_SOURCE_BIZ_ATTR" (actual: 2100, maximum: 2000)`（`backend-run.log:216`）。
- 失败后 `UT` **仍为 17:19:39**（未回退、也未推进），业务属性值仍为成功写入的 `FACC002 biz attr ok`（`LENGTH=19`）→ **整条 UPDATE 回滚，无部分写入**。

### DS-AC-188 命名策略只写延伸表，主表时间不变，零 DDL —— **PASS**

| 操作 | 端点 | HTTP | `CDC_DATA_SOURCE_EXTEND` | 主表 `SRC-NAME`/`TGT-NAME` 时间 |
|---|---|---|---|---|
| 写前 | — | — | 10 | `IT=UT=17:18:53` |
| 新增 | `POST /{SRC-NAME}/naming-strategies` | 200 | **11**（`SRC-NAME → TGT-NAME`, `CUSTOM_PREFIX_SUFFIX`） | **未变** |
| 修改 | `PUT /{SRC-NAME}/naming-strategies/{TGT-NAME}` | 200 | 11（策略改为 `TABLE_MERGE`） | **未变** |
| 删除 | `DELETE /{SRC-NAME}/naming-strategies/{TGT-NAME}` | 200 | **10** | **未变** |

- 主表两条记录全程 `IT=UT=2026-09-20 17:18:53`，未发生任何联动写入。
- **零 DDL**：`USER_TRIGGERS` 中两表触发器计数 = **0**；两表索引仅既有 5 个（`PK_CDC_DATA_SOURCE`、`IDX_CDC_DATA_SOURCE_ID_ACTIVE`、`IDX_CDC_DATA_SOURCE_NAME`、`IDX_CDC_LOG_CORRECT_ORG`、`IDX_CDS_ACTIVE`），无新增。
- **无回填**：仅上述 1 个组合键被写，主表 36 条存量与其余延伸表 10 条均未被触碰。
- 实现依据：`DataSourceNamingStrategyServiceImpl` 只调用 `extendMapper` 的 insert/update/delete，对 `dataSourceMapper` 仅做只读。

### DS-AC-189 三键排序由后端生成 —— **PASS**

- `GET /api/data-sources` 返回 48 行，逐行 `DATA_SOURCE_ID` 序列与**数据库同一条三键排序**的结果**完全一致**（`IDENTICAL_ORDER=True`，长度 48/48）。
- 比对口径：数据库侧 `ORDER BY UPDATE_TIME DESC NULLS LAST, INSERT_TIME DESC NULLS LAST, DATA_SOURCE_ID ASC` 直接导出 ID 序列，与接口响应 ID 序列逐项比较。
- 后端生成：`DataSourceServiceImpl.list()` 使用 `wrapper.last("ORDER BY UPDATE_TIME DESC NULLS LAST, INSERT_TIME DESC NULLS LAST, DATA_SOURCE_ID ASC")`（`DataSourceServiceImpl.java:71`）。
- 前端不再排序：`DataSourcePage.vue`、`api/dataSource.ts` 中**不存在 `.sort(` 调用**（grep 为空）。
- 无新增索引（见 DS-AC-188）。

### DS-AC-190 空时间记录排在最后且未被回填 —— **PASS**

- `FACC002-SORT-NULL`（`UPDATE_TIME=NULL`、`INSERT_TIME=NULL`）在 48 行中位于**第 48 位（最后一位）**。
- 写前写后两条时间列**始终为 `NULL`**，未被回填为当前时间。

### DS-AC-191 时间完全相同按 `DATA_SOURCE_ID ASC` 稳定排序 —— **PASS**

- `FACC002-SORT-A`、`FACC002-SORT-B` 两列时间**完全相同**（`UT=IT=2026-09-19 08:00:00`）。
- 排序结果：`SORT-A` 第 11 位、`SORT-B` 第 12 位 → 稳定按 `DATA_SOURCE_ID ASC`。
- 附：`FACC002-SRC-DIS0`（`UT` 与 A/B 相同、`INSERT_TIME` 更早为 `07:45:00`）位于第 13 位，即在 A/B 之后 → 第二键 `INSERT_TIME DESC NULLS LAST` 亦被实际区分。

### DS-AC-192 标签宽度 120px 右对齐 —— **PASS**

- `.editor-dialog .el-form-item__label`：`width=120px`、`text-align=right`（真实浏览器计算样式）。
- `el-form` 实际渲染 `class="el-form el-form--default el-form--label-right editor-form"`，`label-position="right"` 生效。

### DS-AC-193 测试连接按钮对齐、其他弹窗不受影响 —— **PASS**

- `.editor-dialog .test-bar`：`padding-left=120px`；首个输入框左边界 `546px`，测试连接按钮左边界 `546px` → **`aligned=true`**。
- 其他弹窗（`naming-dialog`）：标签 `width=110px`、`text-align=left`、`font-weight=400`、`color=rgb(96,98,102)`，`label-position="left"` **保持原状未被改动**。

### DS-AC-194 标签字号/字重/颜色/字族与非全局泄漏 —— **PASS**

- `font-size=14px`、`font-weight=500`、`color=rgb(63,63,70)`（`#3f3f46`）。
- 字族为系统无衬线栈（`-apple-system, … "Segoe UI", "PingFang SC", "Microsoft YaHei", …`），**非等宽字体**；**非** `600`、**非** `#09090b`。
- 星号仍为 Element Plus 危险红：`::before` `content="*"`、`color=rgb(245,108,108)`（`--el-color-danger`）。
- 作用域：构建产物中全部相关规则均带 `[data-v-9c65c310]` 且进一步限定 `.editor-dialog` / `.editor-form`；**不存在无作用域的全局规则**。
- 无全局泄漏：`naming-dialog` 标签不受影响；跨路由抽样（`/monitor/job-failure` 等，共 2 个标签）`editorStyledLabels=0`。

### DS-AC-195 新增态红星 + 空密码被既有中文校验拦截且不发请求 —— **PASS**

- 新增弹窗密码项带 `editor-password-required-mark`，`::before content="*"`、颜色危险红；密码输入 `type=password`（掩码）。
- 其余必填项已填、**密码留空**状态下点击「创建」：
  - 表单错误仅 `["请输入密码"]`（中文）；
  - **`POST /api/data-sources` 请求数为 0**（CDP `Network.requestWillBeSent` 实测）→ 未发请求。
- 密码项 `is-required` 类**不存在**（`isRequiredClassAnywhere=false`），无 `required`/`is-required` 造成的隐式英文校验。
- 补齐密码后再次提交：真实发出 `POST /api/data-sources`，界面提示「新增成功」，请求体含 `password` 字段。

### DS-AC-196 编辑态无星号、留空保存成功并沿用原密码、无回显 —— **PASS**

- 通过真实双击行打开「编辑数据源」：密码项**不含** `editor-password-required-mark`，`::before content="none"` → **无星号**。
- 密码框显示固定掩码常量 `*********`（9 位，`type=password`），与库中真实密码（`FACC002-UI-NEW` 的 **Agent 自建测试密码，16 位**，随该记录于清理阶段一并删除）**长度与内容均不同** → **不回显原密码**；提示「显示掩码表示沿用原密码」。（按项目规则，Agent 自建测试密码原文不写入 Git，仅在此说明长度以佐证掩码不等于原密码。）
- 未触碰密码直接「保存」：`PUT /api/data-sources/FACC002-UI-NEW` 请求体**不含 `password` 字段**，界面提示「保存成功」。
- 数据库核验：`DATA_SOURCE_PASSWORD` 列**未改变**（`PWD_UNCHANGED=YES`，以列级 SHA-256 比对为准）；`INSERT_TIME` 仍为 `17:21:02`，`UPDATE_TIME` 更新为 `17:21:33`。

### DS-AC-197 按钮文案与常态视觉 —— **PASS**

- 新增态文案 `创建`，编辑态文案 `保存`（真实打开两种弹窗分别读取）。
- 常态：`background=rgb(9,9,11)`（`#09090b`）、`color=rgb(255,255,255)`（`#ffffff`）、`border-radius=6px`、`font-weight=500`。

### DS-AC-198 悬停/聚焦/按下/加载/禁用 —— **PASS**

| 状态 | 取值 | 方式 |
|---|---|---|
| `:hover` | `background=rgb(39,39,42)`（`#27272a`） | `CSS.forcePseudoState` 强制伪类 + 计算样式 |
| `:focus` | `background=rgb(39,39,42)`（`#27272a`） | 同上 |
| `:active` | `background=rgb(24,24,27)`（`#18181b`） | 同上 |
| 加载中（**真实运行态**） | `class="… is-loading editor-submit-button"`、`hasSpinner=true`、`color=#ffffff`、`background=#09090b` → 转圈与文案可读 | 真实点击保存时逐 10ms 轮询实测 |
| 禁用 | `background=rgb(160,207,255)`（`--el-color-primary-light-5`）、`cursor=not-allowed` → **沿用 Element Plus 禁用视觉** | 见下方证据层级说明 |

- 禁用分支的证据层级（**如实标注**）：真实编辑弹窗 `editorLoading` 的禁用窗口过短，未能稳定捕获；本项采用 **`is-disabled` 类定向注入 + 计算样式**（等待过渡结束后取值）作为自动化证据，并由**构建产物 CSS** 佐证 `:not(.is-disabled)` 守卫：
  `[data-v-9c65c310] .editor-dialog .editor-submit-button:not(.is-disabled){background:#09090b;…}` —— 禁用态不套用自定义深色，落回 Element Plus 视觉。**该项并非完整端到端运行态证据**。

### DS-AC-199 取消 / 测试连接 / 其他弹窗 / 其他路由无样式外溢 —— **PASS**

- 「取消」按钮：`background=rgb(255,255,255)`、`color=rgb(96,98,102)`、`border-radius=4px`、`class="el-button"` → Element Plus 默认视觉，未被提交按钮样式污染。
- 「测试连接」按钮：同上默认视觉。
- 其他弹窗：`naming-dialog` 标签 `110px/left/400`，不受影响。
- 其他路由：抽样 `/config/client`、`/monitor/cdc-node`、`/config/subscribe`、`/monitor/log-query`、`/monitor/job-failure`、`/monitor/data-source-state`，`editorStyledLabels=0`、`editorMarkNodes=0`。

## 3. 用例结论汇总

| 用例 | 结论 | 关键证据 |
|---|---|---|
| DS-AC-183 | PASS | `ds-ac-183.log`（`post-create.log` + `q1.log` 摘录 + mapper SQL） |
| DS-AC-184 | PASS | `ds-ac-184.log` |
| DS-AC-185 | PASS | `ds-ac-185.log` |
| DS-AC-186 | PASS | `ds-ac-186.log` |
| DS-AC-187 | PASS | `ds-ac-187.log`、`backend-run.log:216` |
| DS-AC-188 | PASS | `ds-ac-188.log`、`extq.sql` 输出 |
| DS-AC-189 | PASS | `ds-ac-189-191.log` |
| DS-AC-190 | PASS | `ds-ac-189-191.log`、`row.sql SORT-NULL` |
| DS-AC-191 | PASS | `ds-ac-189-191.log` |
| DS-AC-192 | PASS | `ds-ac-192-193-199.json` |
| DS-AC-193 | PASS | `ds-ac-192-193-199.json` |
| DS-AC-194 | PASS | `measure-create.json`、构建 CSS 作用域审计 |
| DS-AC-195 | PASS | `ds-ac-195.json`（空密码 0 请求）、`ds-ac-195-create.json` |
| DS-AC-196 | PASS | `ds-ac-196.json`、数据库密码复核 |
| DS-AC-197 | PASS | `ds-ac-197-198.json` |
| DS-AC-198 | PASS | `ds-ac-197-198.json`、`ds-ac-197-198-realstates.json`、`ds-ac-197-disabled.json` |
| DS-AC-199 | PASS | `ds-ac-192-193-199.json`、`ds-ac-199-routes2.json` |
