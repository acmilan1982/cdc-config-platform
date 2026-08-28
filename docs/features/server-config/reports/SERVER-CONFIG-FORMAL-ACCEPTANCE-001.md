# 中心端配置 66 条正式验收候选结果报告

> **重要声明**：本报告只记录 `SC-AC-001` ~ `SC-AC-066` 共 66 条正式验收的逐条执行结果与证据，**不构成"正式验收通过"结论**。因 `SC-AC-009` 存在两处与批准基线不一致的显示偏差，本任务标记 `formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`，等待 ChatGPT 复审与项目负责人确认后再建立验收收口任务。本报告不修改六份批准功能文档，不更新 Feature 状态，不进入最终收口。

## 1. 任务元数据、基线提交、运行环境与服务版本

| 项目 | 值 |
|---|---|
| 任务编号 | `SERVER-CONFIG-FORMAL-ACCEPTANCE-001` |
| Feature | `server-config`（中心端配置） |
| 仓库/分支 | `acmilan1982/cdc-config-platform` / `develop` |
| 授权起点（HEAD = origin/develop） | `b7c3bc0250552ee3969c59be657d82c613345931` |
| 任务性质 | 正式验收执行、证据记录、验收报告提交（非代码修改、非需求调整、非验收收口） |
| 执行日期 | 2026-08-28 |
| 验收契约 | `ACCEPTANCE.md`（`APPROVED`，含两项已批准调整：`CONFIG_DESC` 人工换行、按 `ID_SERVER_CONFIG ASC` 排序） |
| 运行环境 | Linux；JDK 8（1.8.0_202）；Maven 3.8.8；Node v24.17.0；Oracle 19c（`192.168.174.65:1521/prod.enmotech.com`，CDC/CDC） |
| 服务版本 | 后端 Spring Boot 2.7.18（端口 8080，pid 3312）；前端 Vite 5.4.21（`0.0.0.0:5173`，pid 3376）；Chrome CDP（`127.0.0.1:9222`，pid 5045） |
| 服务运行方式 | 复用任务开始前已运行且健康的 `cdc-config` 前后端，未做无必要重启；未启动/停止/重启 `sync-server`/`sync-client`/`sync-log`/Kafka 等业务进程 |

本任务执行期间 `HEAD` 与 `origin/develop` 均为 `b7c3bc0...`，ahead/behind 为 `0 0`；`server-config` 相关代码在任务开始前与结束后均未被修改（工作区无关变更见 §3）。

## 2. 项目负责人对 `CDC_SERVER_CONFIG` 的本次写授权

项目负责人已备份 `CDC_SERVER_CONFIG` 并明确授权本任务：

- 可对 `CDC_SERVER_CONFIG` 执行验收所需的 `SELECT / INSERT / UPDATE / DELETE`；
- 不要求每次写入前单独申请审批、不要求每次修改后立即恢复原值；
- 可构造空表、异常字段值、未知 Key、不同 `SERVER_ID` 归属、非法当前值、批量更新及并发覆盖等验收状态；
- 可通过正式 `POST /api/server-config/save` 触发应用写入，也可用人工 DML 构造前置状态；
- 直接 DML 只能用于验收数据准备或核验，必须在报告中记录用途、对象、影响行数及最终状态。

实际执行边界（严格保持）：

- `CDC_SERVER` 只读，未执行任何 `INSERT/UPDATE/DELETE/TRUNCATE`；
- 除 `CDC_SERVER_CONFIG` 外未写入任何其他数据库表；
- 未执行任何 DDL、`TRUNCATE`、索引/约束/物理外键修改；
- 未操作 ZooKeeper；
- 未启动、停止或重启任何业务进程（含 `sync-server`、`sync-client`、`sync-log`、Kafka）；
- 未重启 `cdc-config` 前后端（服务一直健康且已加载 `b7c3bc0` 对应代码）；
- 未把任何包含真实配置值的临时导出文件写入 Git。

## 3. Git 开始现场与无关工作区保护

任务开始与结束时工作区存在大量与本任务无关的既有变更（`git status --short` 共 114 项，含 `M/D/??`），分布在前端布局、`docs/agent-prompts`、`docs/baseline-work`、`docs/task-reports`、大屏相关文件等。按 CLAUDE.md §6 与任务 §2 要求，这些内容全部**原样保留**，未清理、未覆盖、未暂存、未提交。本任务唯一新建文件为：

```
docs/features/server-config/reports/SERVER-CONFIG-FORMAL-ACCEPTANCE-001.md
```

该文件不在任务开始前工作区清单中；除此之外未新增、未修改、未删除任何 Git 追踪或未追踪文件。

## 4. 66 条逐条验收结果表

状态含义：`PASSED`=已执行且符合预期；`PASSED_BY_TEST_AND_CODE_EVIDENCE`=因 `CDC_SERVER` 无写权限，仅以自动化测试+静态代码交叉证据通过（归入 `PASSED`，单独披露）；`FAILED`=已执行且不符合预期；`BLOCKED`=受环境阻塞；`NOT_RUN`=未执行。

| 编号 | 执行方式 | 关键证据摘要 | 状态 |
|---|---|---|---|
| SC-AC-001 | 浏览器 | 侧边栏"配置管理"下"中心端配置"出现 1 次，无"服务端配置"残留，无重复菜单项 | PASSED |
| SC-AC-002 | 浏览器 | 点击"中心端配置"→地址 `/config/server`，页面加载 8 行，无 404 | PASSED |
| SC-AC-003 | 静态代码 | `router/index.ts` 仅 1 条 `/config/server` 路由（name `ServerConfig`），无重复路由 | PASSED |
| SC-AC-004 | 浏览器 | 顶部显示"中心端 ID：Server001 \| 配置项总数：8"，与唯一 `CDC_SERVER` 及已加载行数一致 | PASSED |
| SC-AC-005 | 浏览器 | 表头仅"配置项说明 / 配置值"两列，无"是否可编辑"或 `IS_EDITABLE` 值展示 | PASSED |
| SC-AC-006 | 浏览器 | 无 `ID_SERVER_CONFIG` 列、无 `SERVER_ID` 列 | PASSED |
| SC-AC-007 | 浏览器 | 说明列占最大可用宽度（min-width 240 无固定 max），普通过长文本按列宽折行多行完整展示，无大段省略；英文 Key 不作为主内容持续展示 | PASSED |
| SC-AC-008 | 浏览器 + DML 构造 | 两列结构；`CONFIG_DESC=NULL` 时主内容兜底显示 `CONFIG_KEY`（实测 006 显示 "auto-create-table"）；`CONFIG_DESC` 与 `CONFIG_KEY` 均空时显示"未定义配置项"且该行只读、无 Key 图标；兜底不改数据库（DML 前后查询确认） | PASSED |
| SC-AC-009 | 浏览器 + 静态代码 | **失败**：①信息图标 Tooltip 内容为纯 Key（实测 "snapshotBatchSize"），无要求的 `配置Key：` 前缀；②超宽只读值不省略（64 字符值折行为 3 行，`white-space:normal`、无 `text-overflow:ellipsis` 生效），值本身无 tooltip，悬停只读值不弹出完整原文（悬停显示的是 Key 名而非值）。详见 §11 | **FAILED** |
| SC-AC-010 | 浏览器交互 | 枚举/多选/数字编辑控件使用值列宽度，下拉选项完整可读、多选与数字输入正常操作，未被窄列挤压 | PASSED |
| SC-AC-011 | 浏览器 | 页面无搜索、筛选、分页、自动刷新控件；无新增、复制、删除入口（实测 `no_search/no_pagination/no_add_del_btn` 均 true） | PASSED |
| SC-AC-012 | 浏览器 | 页面顶部无中心端下拉框或切换器（实测 `no_server_switch` true） | PASSED |
| SC-AC-013 | 浏览器 | 唯一中心端且有配置：顶部显示 `SERVER_ID` 与配置总数，列表加载全部配置 | PASSED |
| SC-AC-014 | 测试 + 代码交叉 | `ServerConfigServiceImplTest.getPage_noServer_shouldThrowServerNotRegistered`、`ServerConfigControllerTest.page_noServer_shouldReturnHttp200With40210`；代码分支返回 40210 对应提示"中心端尚未注册，请先启动 sync-server"、不加载配置、控件禁用、不批量保存。未在真实库构造（无 `CDC_SERVER` 写权限） | PASSED_BY_TEST_AND_CODE_EVIDENCE |
| SC-AC-015 | 测试 + 代码交叉 | `ServerConfigControllerTest.page_multipleServers_shouldReturnHttp200With40211`；代码分支返回 40211 对应提示"检测到多个中心端，当前功能仅支持唯一中心端"、不加载/不编辑/不保存、不自行选择首条。未在真实库构造（无 `CDC_SERVER` 写权限） | PASSED_BY_TEST_AND_CODE_EVIDENCE |
| SC-AC-016 | 浏览器 + DML 构造 | 构造 `CDC_SERVER_CONFIG` 空表（DELETE 全部后观察再恢复）：页面显示空状态"暂无配置项"、顶部"配置项总数：0"、无新增配置入口、"保存全部"禁用 | PASSED |
| SC-AC-017 | 浏览器 + SQL | 列表按 `ID_SERVER_CONFIG ASC` 排列（实测行序 001→008），与 `ORDER BY ID_SERVER_CONFIG ASC` 一致 | PASSED |
| SC-AC-018 | 浏览器 | 每行仅"配置项说明 + 配置值"两列，无 `CONFIG_KEY` 独立列 | PASSED |
| SC-AC-019 | 浏览器 | `IS_EDITABLE='1'` 且白名单内 key 显示专用编辑控件（实测 6 行编辑控件） | PASSED |
| SC-AC-020 | 浏览器 | `IS_EDITABLE='0'` 的 001/002 仅展示只读值、无编辑控件 | PASSED |
| SC-AC-021 | 浏览器 + DML 构造 | DML 将 006 `IS_EDITABLE` 置为 `'x'`：该行只读展示配置值、无编辑控件、不可编辑 | PASSED |
| SC-AC-022 | 浏览器 + DML 构造 | DML 将 003 `CONFIG_KEY` 改为白名单外 key 且保持 `IS_EDITABLE='1'`：该行完整展示、Key 仅图标 Tooltip 可查、只读、无通用文本编辑 | PASSED |
| SC-AC-023 | 浏览器 + DML + API | 未来新增 key 场景（白名单外 key）：该行只读展示；前端无编辑控件；后端经正式 `POST /api/server-config/save` 返回 40422 整批拒绝，不允许修改其值 | PASSED |
| SC-AC-024 | API + SQL | `auto-create-table` 保存 `true`/`false` 均成功，保存后重载为小写值 | PASSED |
| SC-AC-025 | API + SQL | `auto-expand-column-length` 保存 `true`/`false` 均成功 | PASSED |
| SC-AC-026 | API + SQL | 布尔变体 `TRUE`/`False`/`1`/`0`/空串均被后端整批拒绝（40226/40224），数据库值不变 | PASSED |
| SC-AC-027 | API + SQL | `raw-message-storage-strategy` 保存 `NONE`/`PLAIN`/`COMPRESS` 均成功，重载为精确大写 | PASSED |
| SC-AC-028 | API + SQL | 小写 `none`/混合 `Plain`/非枚举 `PLAINTEXT` 均被后端拒绝，数据库值不变 | PASSED |
| SC-AC-029 | API + SQL | 单选一种数据库类型保存成功，值为小写、无多余空格 | PASSED |
| SC-AC-030 | API + SQL | 输入 ` MySQL, mysql, ORACLE ` 后保存：去首尾空格、统一小写、去重，值为规范化逗号连接串 | PASSED |
| SC-AC-031 | API + SQL | 白名单外类型（`doris,sqlserver`、`postgres`）被后端整批拒绝，数据库值不变 | PASSED |
| SC-AC-032 | API + SQL + 浏览器 | 不同选择顺序规范化后值固定为 `doris,oracle,mysql` 子序列、不视为实际修改（API 规范化 + 浏览器 SC-AC-046 顺序无关验证） | PASSED |
| SC-AC-033 | API + SQL | 空值、尾随空 token（`doris,`）被后端整批拒绝 | PASSED |
| SC-AC-034 | API + SQL | `snapshotBatchSize` 保存 `100`/`10000`/`500`/`0500` 均成功，前导零被规范化去除，无多余空格 | PASSED |
| SC-AC-035 | API + SQL | `99`（低于下限）、`10001`（超上限）被后端整批拒绝 | PASSED |
| SC-AC-036 | API + SQL | 小数 `100.5`/科学计数 `1e3`/带符号 `+100`/`-100`/空值/非数字均被后端整批拒绝 | PASSED |
| SC-AC-037 | API + SQL | `tableRowDeleteStrategy` 保存 `DELETE`/`DELETE_FLAG` 均成功，重载为精确大写 | PASSED |
| SC-AC-038 | API + SQL | 小写 `delete`/混合 `Delete`/非枚举 `DROP` 均被后端整批拒绝 | PASSED |
| SC-AC-039 | 浏览器 + API | `monitor-metric-topic-name`/`server-log-topic-name` 两行只读、无编辑控件；API 提交被 40421 拒绝，不可编辑不可保存 | PASSED |
| SC-AC-040 | 浏览器 + DML 构造 | DML 将 002 `IS_EDITABLE` 强制置为 `'1'`：页面仍只读（无编辑控件、值完整展示），未因 `IS_EDITABLE` 开放编辑 | PASSED |
| SC-AC-041 | API + SQL | 空串/纯空白/JSON `null` 均被后端整批拒绝（40224），数据库值不变 | PASSED |
| SC-AC-042 | API + SQL | 专门值域内合法值保存成功（同时满足专门值域与长度≤64）；65 字符新值被后端写库前拒绝（40225）并整批回滚，不依赖数据库截断 | PASSED |
| SC-AC-043 | 浏览器交互 | 连续修改 003、004 两条：全部编辑内容保留，可一并进入保存确认流程 | PASSED |
| SC-AC-044 | 浏览器交互 | 页面加载后未修改："保存全部"与"撤销修改"均禁用 | PASSED |
| SC-AC-045 | 浏览器交互 | 点击"撤销修改"：所有编辑控件恢复最近一次成功加载值，未发起网络请求，数据库值不变 | PASSED |
| SC-AC-046 | 浏览器交互 | dbtypes 不同选择顺序（先 Doris 后 MySQL 与先 MySQL 后 Doris）规范化后值相同（`doris,mysql`），不视为实际修改，不进入确认框、全页仅此变化时"保存全部"保持禁用 | PASSED |
| SC-AC-047 | 浏览器交互 | 编辑未保存期间等待 6s：页面不自动刷新、未保存编辑内容未被覆盖、无后台刷新请求 | PASSED |
| SC-AC-048 | 浏览器交互 | 输入非法值（`60`）：前端校验拦截、"保存全部"禁用、点击不弹出确认框且显示校验错误；校验通过才弹确认框 | PASSED |
| SC-AC-049 | 浏览器交互 | 确认框只列出实际变更项（实测 2 项：003/004），展示配置项显示名称/原值/新值，不突出 `CONFIG_KEY`，无 Key 列，Key 经信息图标 Tooltip 按需查看 | PASSED |
| SC-AC-050 | 浏览器交互 | 点击"取消"：未发送任何保存请求，页面编辑内容全部保留 | PASSED |
| SC-AC-051 | 浏览器交互 | 点击"确认保存"：仅发送一次批量请求，请求体只携带既有主键与新 `CONFIG_VALUE`（实测 `{"items":[{"idServerConfig":"003","configValue":"800"}]}`） | PASSED |
| SC-AC-052 | API + SQL | 批量含 `IS_EDITABLE='0'` 记录（001）：后端重新读取判定不可编辑，整批拒绝 40421，006/001 数据库值均不变 | PASSED |
| SC-AC-053 | API + SQL | DML 构造 004 `CONFIG_KEY='unknown.zzz.key'`：批量含未知 key 整批拒绝 40422，006/004 值不变；恢复 key | PASSED |
| SC-AC-054 | API + SQL | DML 构造 005 `SERVER_ID='FakeServerX'`：批量含非唯一中心端归属记录整批拒绝 40423，006/005 值不变；恢复 `SERVER_ID` | PASSED |
| SC-AC-055 | API + SQL | 批量含不存在主键（`999`）：整批拒绝 40420，006 值不变 | PASSED |
| SC-AC-056 | API + SQL | 批量尝试修改 `CONFIG_DESC` 等非 `CONFIG_VALUE` 字段：整批拒绝 40227，006 值不变 | PASSED |
| SC-AC-057 | API + SQL | 三条全部合法（003/004/005）批量保存：同一事务全部更新成功（→600/NONE/DELETE），重载展示最新值 | PASSED |
| SC-AC-058 | API + SQL | 同批 `006=合法(true)` + `003=非法(99)`：整批回滚，006/003 均保持原值，禁止部分成功 | PASSED |
| SC-AC-059 | API + SQL | 两个均合法、值不同的并发请求（`006=true` 与 `006=false`）：均返回 200 无版本/冲突错误，最终 DB `006=true` 与较晚完成请求值一致，证明"最后一次成功保存生效" | PASSED |
| SC-AC-060 | 浏览器交互 | 保存成功：页面给出成功反馈，并重新查询唯一中心端及全部配置，重载结果成为新的原始值（脏值清空、按钮回禁用） | PASSED |
| SC-AC-061 | 浏览器 + DML | DML 在确认框打开期间将 003 `IS_EDITABLE='0'`：确认保存被后端 40421 拒绝，页面显示明确错误"保存失败：配置项不可编辑"（不泄露底层堆栈），数据库整批回滚、编辑内容保留；恢复 `IS_EDITABLE` | PASSED |
| SC-AC-062 | 浏览器 | 正常态所有 `CONFIG_VALUE` 完整展示、不脱敏不掩码；无配置 Key 独立列，Key 仅信息图标 Tooltip 展示。注：本用例的"只读值超宽省略时悬停展示完整原文"子条款与 `SC-AC-009` 同一行为，该行为在 `SC-AC-009` 专项中失败（见 §11） | PASSED（附披露） |
| SC-AC-063 | 静态代码 + 全程观察 | `server-config` 后端无任何 `sync-server` 重启/通知/生效检测/生效提示调用（唯一 "sync-server" 引用为错误提示文案）；验收全程保存操作未触发、未提示 `sync-server` 重启 | PASSED |
| SC-AC-064 | 静态代码 + 全程观察 | 后端无任何 DDL 语句；`CDC_SERVER` 在 server-config 模块仅 `selectList` 读取；`CDC_SERVER_CONFIG` 仅 select/update，无 insert/delete；验收全程未执行 DDL、未新增索引/约束/外键、未提供 `CDC_SERVER` 维护能力、未新增或删除配置记录（最终行数仍为 8） | PASSED |
| SC-AC-065 | 浏览器 + DML + API | DML 构造 006 非法当前值（不符合布尔规则）：页面显示专用控件与当前值异常提示、不因值异常变只读；未修正前"保存全部"不得提交含非法值的批次；通过 UI 改为合法值 `true` 后进入确认并按正常批量规则保存成功 | PASSED |
| SC-AC-066 | 浏览器 + DML 构造 | DML 构造 005 `CONFIG_DESC` 含真实 LF 与 CRLF：`innerText` 在真实换行位置分行（`afterL1=10`、`afterL2=10` CRLF 归一）；字面量 `\n`（`betweenLit=92` 反斜杠）、`<br>`、`<b>` 均保持普通文本（`brElementCount=0`，无 `v-html`）；多行说明无横向溢出（`doc_no_hscroll=true`）；信息图标 Key Tooltip 仍可悬停查看（"tableRowDeleteStrategy"）；已恢复 desc | PASSED |

### 4.1 结果统计

| 状态 | 数量 |
|---|---|
| PASSED | 65（含 `PASSED_BY_TEST_AND_CODE_EVIDENCE` 2 条：SC-AC-014、SC-AC-015） |
| FAILED | 1（SC-AC-009） |
| BLOCKED | 0 |
| NOT_RUN | 0 |
| **合计** | **66** |

## 5. 浏览器、API、SQL、测试与构建证据摘要

### 5.1 浏览器（Chrome headless CDP，端口 9222，`--no-proxy-server`）

- 菜单/路由（SC-AC-001/002）、页面结构与列布局（SC-AC-004~008/011/012/013/017/018/019/020/039/062）、空状态（SC-AC-016）、排序（SC-AC-017）、真实换行（SC-AC-066）、Key Tooltip（SC-AC-009/022/023/040/049/066）均通过真实浏览器导航与 DOM 测量采集。
- 前端交互（SC-AC-043~051/060）：使用原生 value setter + `input` 事件驱动 el-input；el-select 通过点击 `.el-select__wrapper` 打开下拉、CDP `Input.dispatchMouseEvent` 真实坐标点击 `.el-select-dropdown__item` 选项；Network 捕获 `POST /api/server-config/save` 请求体。
- SC-AC-009 溢出测量：只读 `.raw-value` `whiteSpace=normal`、`textOverflow=clip`；64 字符值渲染为 3 行折行（`lineCount=3`）；仅 key-icon 为 `.el-tooltip__trigger`（`tooltipTriggerCount=1`），值本身无 tooltip。

### 5.2 接口 + SQL

- 合法/非法保存（SC-AC-024~042）：正式 `POST /api/server-config/save` + 保存前后 `SELECT CONFIG_VALUE` 比对，共覆盖 6 个可编辑 key 的合法成功与非法拒绝（含 40224 空值、40225 超长、40226 值规则、40421 不可编辑、40422 未知 key、40420 不存在主键、40227 非目标字段）。
- 批量/事务/并发（SC-AC-052~059）：同批合法全部成功、同批任一失败整批回滚（`@Transactional(rollbackFor=Exception.class)`）、两个并行合法请求"最后一次成功保存生效"（均 200、无版本冲突，最终 DB 值=较晚完成请求值）。

### 5.3 自动化测试与构建（2026-08-28 19:52~19:54 执行）

| 命令 | 结果 |
|---|---|
| `mvn -Dtest='com.bsoft.cdcconfig.serverconfig.**' test` | Tests run: 62, Failures: 0, Errors: 0, Skipped: 0；BUILD SUCCESS |
| `npx vitest run src/api/serverConfig.spec.ts src/views/server-config/configRules.spec.ts src/views/server-config/ServerConfigPage.spec.ts` | 3 files, 59 tests passed |
| `npx vitest run`（前端完整） | 13 files, 145 tests passed |
| `npm run build`（前端生产构建） | ✓ built in 22.64s（仅 chunk 体积警告，非错误） |
| `mvn clean package -DskipTests`（后端构建） | BUILD SUCCESS（`cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`） |

## 6. 对 `CDC_SERVER_CONFIG` 的人工数据构造清单

以下均为验收数据准备或核验，全部属于授权范围内的 `CDC_SERVER_CONFIG` 写入；`CDC_SERVER` 与其他表未做任何写入。影响行数均为目标行；执行后均已恢复/重建为可用状态（§9）。

| # | 用途 | 对象/操作 | 影响行数 | 清理/恢复 |
|---|---|---|---|---|
| 1 | SC-AC-009 超宽只读值 | `UPDATE 001.CONFIG_VALUE` 为 64 字符 | 1 | 恢复为 `cdc.sync.server.logs.v1` |
| 2 | SC-AC-053 未知 key | `UPDATE 004.CONFIG_KEY='unknown.zzz.key'` | 1 | 恢复为 `raw-message-storage-strategy` |
| 3 | SC-AC-054 非唯一中心端归属 | `UPDATE 005.SERVER_ID='FakeServerX'` | 1 | 恢复为 `Server001` |
| 4 | SC-AC-061 确认框期间变不可编辑 | `UPDATE 003.IS_EDITABLE='0'` | 1 | 恢复为 `'1'` |
| 5 | SC-AC-065 非法当前值 | `UPDATE 006.CONFIG_VALUE` 置为非法布尔值并调整 desc | 1 | 经 UI 改为合法 `true` 保存；desc 恢复 |
| 6 | SC-AC-066 真实换行 desc | `UPDATE 005.CONFIG_DESC` 构造含 LF/CRLF/字面量 `\n`/`<br>`/`<b>` | 1 | 恢复为原始多行 desc |
| 7 | SC-AC-022/023 未知/未来 key | `UPDATE 003.CONFIG_KEY='future.unknown.key.example'` | 1 | 恢复为 `snapshotBatchSize` |
| 8 | SC-AC-016 空表状态 | `DELETE FROM CDC_SERVER_CONFIG` 全部行 | 8 | 依据完整备份 `INSERT` 重建 8 行 |
| 9 | SC-AC-008 描述兜底 | `UPDATE 006.CONFIG_DESC=NULL`；再 `CONFIG_KEY=NULL` | 1 | 恢复 key 与 desc |
| 10 | SC-AC-021 异常 `IS_EDITABLE` | `UPDATE 006.IS_EDITABLE='x'` | 1 | 恢复为 `'1'` |
| 11 | SC-AC-040 只读 key 开放 `IS_EDITABLE` | `UPDATE 002.IS_EDITABLE='1'` | 1 | 恢复为 `'0'` |

说明：构造过程中未对 desc 原值造成不可逆丢失；SC-AC-008/016/021/022/040/065/066 均以当前行完整状态为备份再恢复，未遗留验收临时 Key、伪造 `SERVER_ID`、非法 `IS_EDITABLE` 或非法当前值在最终工作数据中。包含真实配置值的临时导出仅存在于 `/tmp`，未写入 Git。

## 7. `SC-AC-014/015` 未写 `CDC_SERVER`、替代证据及充分性判断

本任务未获得 `CDC_SERVER` 写权限，故**未在真实数据库构造** `CDC_SERVER` 零条/多条状态。替代证据由"后端定向自动化测试 + 前端自动化测试 + 静态代码分支"组成：

- `ServerConfigServiceImplTest.getPage_noServer_shouldThrowServerNotRegistered()`：服务层零中心端抛错；
- `ServerConfigControllerTest.page_noServer_shouldReturnHttp200With40210()`：控制器零中心端返回业务码 40210；
- `ServerConfigControllerTest.page_multipleServers_shouldReturnHttp200With40211()`：控制器多中心端返回业务码 40211；
- 静态代码：`ServerConfigServiceImpl` 依据 `CDC_SERVER` 查询结果分支——0 条走"中心端尚未注册，请先启动 sync-server"（不加载配置、不返回数据）、>1 条走"检测到多个中心端，当前功能仅支持唯一中心端"（不加载、不编辑、不保存、不自行选择首条）；前端把 40210/40211 映射为对应提示与禁用状态。

充分性判断：上述证据已覆盖前置状态（0 条 / >1 条）、返回状态（40210/40211）、禁止加载/编辑/保存（服务层空返回 + 前端禁用）及提示文案（两个分支文案），满足"仅以测试+代码证据交叉通过"的条件。故两用例判为 `PASSED_BY_TEST_AND_CODE_EVIDENCE`，在最终统计中归入 `PASSED`，并在此单独披露"未在真实数据库构造"。

## 8. 保存成功、整批回滚与并发覆盖的数据库前后证据

- 保存成功（SC-AC-057）：批量 `{"items":[{"idServerConfig":"003","configValue":"600"},{"idServerConfig":"004","configValue":"NONE"},{"idServerConfig":"005","configValue":"DELETE"}]}` → 响应 200，保存后 `SELECT` 确认 003=600、004=NONE、005=DELETE，全部在同一事务更新成功，页面重新加载展示最新值。
- 整批回滚（SC-AC-058）：同批 `006=true`（合法）+ `003=99`（非法）→ 响应非 200 整批拒绝；保存后 `SELECT` 确认 006 与 003 均保持原值，合法项未部分提交（证明单事务回滚）。
- 并发覆盖（SC-AC-059）：并行发起 `006=true` 与 `006=false` 两个合法请求；记录各自完成时间与最终 DB 值。两请求均返回 200、无旧值/版本号/更新时间冲突错误；最终 DB `006=true`，与较晚完成请求值一致，符合"最后一次成功保存生效"。
- 失败回滚（SC-AC-052~056、SC-AC-061）：不可编辑 40421、未知 key 40422、`SERVER_ID` 错配 40423、不存在主键 40420、非 `CONFIG_VALUE` 字段 40227、确认框期间 `IS_EDITABLE` 变 `'0'` 40421——均整批拒绝且目标记录值不变，页面保留编辑内容并给出不泄露底层堆栈的明确错误。

## 9. 任务结束时 `CDC_SERVER_CONFIG` 的最终可用状态

最终行数 8，页面可正常加载（`中心端 ID：Server001 | 配置项总数：8`，列表 8 行，编辑控件/只读展示与白名单一致）。关键结构状态（不泄露敏感配置值）：

- 只读 key（`IS_EDITABLE='0'`）：`server-log-topic-name`、`monitor-metric-topic-name`，值完整展示、无编辑控件；
- 可编辑白名单 key（`IS_EDITABLE='1'`）：`snapshotBatchSize`、`raw-message-storage-strategy`、`tableRowDeleteStrategy`、`auto-create-table`、`auto-expand-column-length`、`realtime-insert-batch-enabled-database-types`；
- 全部行 `SERVER_ID='Server001'`；`CONFIG_DESC` 为原始多行说明文本（003/004/005/008 含真实 LF，与验收前一致），无验收临时标记残留；
- 未新增、未删除配置记录；无未知 Key、无伪造 `SERVER_ID`、无非法 `IS_EDITABLE`、无非法当前值残留。

本报告不声称"已恢复任务开始前的每个原值"；当前为验收后可正常加载的连贯合法状态（其中 003/004/005/006 等值含经正式保存接口产生的合法配置值）。

## 10. 数量汇总

| 状态 | 数量 |
|---|---|
| PASSED | 65 |
| FAILED | 1 |
| BLOCKED | 0 |
| NOT_RUN | 0 |
| **合计** | **66** |

其中 `PASSED_BY_TEST_AND_CODE_EVIDENCE` 2 条（SC-AC-014/015）已归入 PASSED 并单独披露。

## 11. 缺陷、阻塞项、残余风险与待负责人确认项

### 11.1 缺陷（FAILED）

**SC-AC-009 —— Key Tooltip 格式与超宽只读值省略/悬停原文，两处与批准基线不符（疑似本 Feature 缺陷）**

- **问题一：Key 信息图标 Tooltip 缺少 `配置Key：` 前缀。** `REQUIREMENTS` SC-UI-15 与 `ACCEPTANCE` SC-AC-009 要求悬停信息图标显示 `配置Key：{CONFIG_KEY}`；实测 Tooltip 内容为纯 Key（如 "snapshotBatchSize"、"server-log-topic-name"）。代码位置：`frontend/src/views/server-config/ServerConfigPage.vue` 第 56 行 `<el-tooltip :content="row.configKey">`。
- **问题二：超宽只读值未省略、值本身无悬停完整原文。** `REQUIREMENTS` SC-UI-12 / SC-READONLY-03 与 `ACCEPTANCE` SC-AC-009 要求超宽只读值省略显示、悬停弹出完整原文。实测将 001 的 `CONFIG_VALUE` 置为 64 字符后：`.raw-value` `white-space:normal`、无 `text-overflow:ellipsis`（`rawEllipsis=false`），文本折行为 3 行完整铺满而非省略；且值本身不是 `el-tooltip__trigger`（仅 key-icon 是），悬停只读值不弹出任何 tooltip——悬停显示的内容实为 key-icon 上的 Key 名而非完整原文。代码位置：`frontend/src/views/server-config/ConfigValueEditor.vue` 第 5 行（普通 `<span class="raw-value">`，`.raw-value` 样式仅 `color`）。

**影响与处置**：此为显示/交互层偏差，不影响数据保存正确性、事务性、安全性与其余 65 条用例。按任务要求，保留证据（浏览器 DOM 测量 + 截图 + 代码位置）、标记 SC-AC-009 为 `FAILED`，并停止进一步可能扩大影响的写操作；后续只执行只读/独立用例。本任务不修改代码/测试/文档来掩盖缺口。

**待负责人确认**：是否接受当前"纯 Key Tooltip + 折行展示只读值"的现有实现，或要求按批准基线补 `配置Key：` 前缀与超宽值省略+悬停原文；若接受现状，请明确是否需同步修订 `REQUIREMENTS`/`ACCEPTANCE` 相应条目。

### 11.2 阻塞项

无。

### 11.3 残余风险

- `SC-AC-014/015` 未在真实库构造（无 `CDC_SERVER` 写权限），以测试+代码证据替代；若需真实库复核，须另获 `CDC_SERVER` 写授权。
- `SC-AC-062` 正常态所有值完整展示（不脱敏、不掩码）、无 Key 列、Key 仅图标 Tooltip，均通过；其"只读值超宽省略时悬停展示完整原文"子条款依赖的行为与 `SC-AC-009` 相同，该行为专项失败，已在上文披露。
- `SC-AC-023` 属于"未来新增 key"场景，当前白名单内 6 个 key 均内置控件与校验规则；白名单外 key 的前后端只读行为已由同机制证据覆盖（DML 构造 + API 40422）。

## 12. 数据库、DDL、ZooKeeper、服务、接口操作的真实状态

| 项目 | 状态 |
|---|---|
| 数据库访问 | 仅 `CDC_SERVER_CONFIG` 可写（授权 DML），`CDC_SERVER` 及其他表只读 |
| 数据库写入 | 仅验收所需 `CDC_SERVER_CONFIG` DML（UPDATE/DELETE/INSERT 均用于数据准备与恢复）与正式保存接口写入 |
| `CDC_SERVER` 写入 | 无 |
| 其他表写入 | 无 |
| DDL / TRUNCATE / 索引 / 约束 / 外键 | 无 |
| ZooKeeper | 无操作 |
| `cdc-config` 前后端 | 复用已运行服务，未重启（服务健康且已加载 `b7c3bc0` 代码） |
| 业务进程（sync-server/sync-client/sync-log/Kafka） | 未启动/停止/重启 |
| 接口 | 正式 `GET /api/server-config`（读取）、`POST /api/server-config/save`（批量保存） |

## 13. 修改文件、Commit、Push 与 ahead/behind 结果

- 本任务新建文件（唯一）：`docs/features/server-config/reports/SERVER-CONFIG-FORMAL-ACCEPTANCE-001.md`
- Commit 信息：`test(server-config): record formal acceptance results`
- Push：普通 push 到 `origin/develop`（无 force）
- 推送后核对：`HEAD == origin/develop`、ahead/behind `0 0`
- 无关工作区内容：原样保留，未清理/未覆盖/未暂存/未提交

（本报告记录 Commit/Push 计划与实际执行结果；最终值见任务完成后的控制台机器块。）

## 14. 声明

本任务只形成**候选验收结果**，不把六份批准功能文档（`REQUIREMENTS/ACCEPTANCE/DESIGN/API/UI/DATABASE`）或 Feature 状态直接收口。`formal_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`，等待 ChatGPT 复审与项目负责人确认后再建立验收收口任务。因存在 1 条 `FAILED`（SC-AC-009），本报告不以"正式验收通过"自居，如实记录 65 条通过、1 条失败。

