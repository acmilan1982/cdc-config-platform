# DATA-SOURCE-FORMAL-ACCEPTANCE-001 正式验收执行报告

- 任务编号：DATA-SOURCE-FORMAL-ACCEPTANCE-001
- 日期：2026-08-30
- 分支：`develop`
- 授权基准提交：`a241c29b3c4ba8475f1bfe9ea009e0927e95b944`
- RUN_TAG：`0830FTA`
- 正式验收状态：`FAIL`（PASS=103，FAIL=2，BLOCKED=1，NOT_RUN=0）
- 下一步：`CHATGPT_REVIEW_FORMAL_ACCEPTANCE`

> 本报告是 Agent 正式验收执行记录。验收以真实运行服务、真实后端接口、只读数据库核对、真实 Oracle/MySQL 连接测试为证据来源，不依据代码阅读推定用例状态。验收结论为 `FAIL`，实现状态未置为 `IMPLEMENTED_ACCEPTED`。

---

## 1. 执行环境与方法

- 后端：`cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`，监听 `0.0.0.0:8080`（dev 配置，Oracle 192.168.174.65:1521/prod.enmotech.com）
- 前端：Vite 开发服务器，监听 `0.0.0.0:5173`，代理 `/api` → 后端
- 验收访问 URL：`http://192.168.174.70:5173/`（无需登录）
- 证据方式：
  - 全部 13 个数据源接口经前端代理直连后端实测（GET/POST/PUT/DELETE 与测试连接）
  - 数据库状态经只读 SQL 核对（主表字段、隐藏字段、约束、索引、EXTEND 关联、行数前后对照）
  - 连接测试对真实 Oracle（192.168.174.65:1521/prod.enmotech.com）执行；MySQL/Doris 探测见 DS-AC-104
  - 前端交互类用例结合 `frontend/src/views/data-source/DataSourcePage.vue`、`src/config/menu.ts`、`src/router/index.ts` 代码证据（行号核对）
- 验收测试数据在 `CDC_DATA_SOURCE`/`CDC_DATA_SOURCE_EXTEND` 中以 `ACDS_0830FTA_*` 及本轮边界构造记录创建，执行后已按 RUN_TAG 精确清理并核验（见 §7）。

## 2. 任务开始前 Git 现场与无关工作区保护

- 任务开始前 HEAD：`a241c29b3c4ba8475f1bfe9ea009e0927e95b944`
- 任务开始前工作区已存在多处与本任务无关的修改（`docs/agent-prompts/**` 未跟踪提示词、`docs/database/**` 三个历史报告删除、前端 `index.html`/`menu.ts`/layouts/stores/styles 调整、`.claude/settings.local.json`、`agent-env.sh` 等）。本任务对上述无关内容一律保持原样：不修改、不覆盖、不暂存、不提交。
- 本次授权修改范围仅：`docs/features/data-source-management/ACCEPTANCE.md`（逐例状态更新）与新增本报告。

## 3. 验收结果总览

| 状态 | 数量 | 用例 |
|---|---|---|
| PASS | 103 | DS-AC-001~051，053~103，106 |
| FAIL | 2 | DS-AC-052、DS-AC-105 |
| BLOCKED | 1 | DS-AC-104 |
| NOT_RUN | 0 | — |
| **合计** | **106** | — |

所有 `DS-AC` 用例状态已在 `ACCEPTANCE.md` 逐例更新为上述实际状态（`PASS`/`FAIL`/`BLOCKED`），不再存在 `NOT_RUN`。

## 4. 失败用例（FAIL）

### 4.1 DS-AC-052：后端日志泄露密码参数（关联 DS-REQ-047/107）

- 期望：日志、异常、响应中均不出现密码或敏感连接信息。
- 实际：dev 配置 `application-dev.yml` 将 `com.bsoft.cdcconfig.**.mapper` 设为 `DEBUG`，叠加 `application.yml` 中 `mybatis-plus.configuration.log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl`，MyBatis-Plus 在 DEBUG 级别输出 `DataSourceMapper.update` 的全部绑定参数，包含 `password` 列值。
- 证据（后端运行日志，密码已脱敏）：`DataSourceMapper.update : ==> Parameters: S02 [ACCEPTANCE 0830FTA](String), SOURCE(String), ORACLE(String), 192.168.174.65(String), 1521(String), CDC(String), prod.enmotech.com(String), <REDACTED>(String), ...`
- 影响：编辑保存操作会把密码明文写入后端日志，违反 DS-REQ-047/107。
- 本次任务按授权边界不改代码/配置；该缺陷需单独任务决策修复（例如关闭 mapper DEBUG 参数日志或对敏感列脱敏）。

### 4.2 DS-AC-105：端口参数类型错误返回 HTTP 500，不符合契约（关联 DS-REQ-106 / API.md §5.1）

- 期望：绕过前端直接调用后端接口提交不合法数据时，后端独立校验并拒绝；按 API.md §5.1，参数类型不匹配应返回 HTTP 400、`code=400`、消息 `参数类型错误: <name>`。
- 实际：`POST /api/data-sources` 提交 `"port":"abc"`（非整数字符串）时，请求体反序列化失败（`HttpMessageNotReadableException: Cannot deserialize value of type java.lang.Integer from String "abc"`），`GlobalExceptionHandler` 落入未知异常分支，返回 HTTP 500、`{"code":500,"message":"服务器内部错误"}`。
- 证据（实测响应）：`HTTP=500 {"code":500,"message":"服务器内部错误"}`。
- 说明：拒绝本身生效（无数据落库、消息脱敏不泄敏感信息），但 HTTP 状态与错误结构不符合批准契约 §5.1。
- 其余 DS-AC-105 子项（必填缺失、超长、值域越界、角色—类型联动、ID/名称唯一性、命名策略逻辑联合键查重）均经实测符合契约（如缺失名称 400"数据源名称不能为空"、名称 31 字符 400"数据源名称长度不能超过30"、端口 0 400"端口必须为1-65535之间的整数"、源库+MySQL 40002、重复 ID 40900、重复名称 40901、命名策略重复 40902/40903）。

## 5. 阻塞用例（BLOCKED）

### 5.1 DS-AC-104：MySQL / Doris 真实连接受环境限制（关联 DS-REQ-052/053）

- MySQL 子项：`POST /api/data-sources/test-connection`（type=MYSQL，host=192.168.174.65:3306，userName=root）实测返回脱敏结果 `{"success":false,"message":"连接失败：认证失败"}`；此前用驱动直连得到的原始错误为 `Access denied for user 'root'@'192.168.174.70' (using password: YES)`，即 MySQL 远程授权未放行本服务器（192.168.174.70）。接口的 MySQL 探测与脱敏链路本身可用，但无法在现有环境完成真实 MySQL `SELECT 1` 成功连接 → BLOCKED（环境限制，非产品缺陷）。
- Doris 子项：`POST /api/data-sources/test-connection`（type=DORIS，host=192.168.174.65:9030）实测返回脱敏结果 `{"success":false,"message":"连接失败：连接超时"}`，当前无可用 Doris 验收环境 → BLOCKED（环境限制）。
- 不得为通过用例而伪造成功结果。

## 6. 视觉验收结论（用户人工操作）

用户已完成 7 项页面功能人工核验，整体显示与交互正常，视觉检查通过：

1. 列表、查询、重置及无分页展示正常。
2. 源库与目标库操作入口区分正常。
3. 目标库命名策略弹窗及表格、编辑表单可正常使用。
4. 业务属性弹窗可正常展示内容。
5. 编辑按钮、双击编辑及密码掩码显示正常。
6. 查询条件与连接测试交互正常。
7. 菜单、路由、未保存确认与删除确认正常。

## 7. 测试数据清理与核验

- 清理范围（本轮专用，精确按 RUN_TAG 与边界构造记录，不影响生产数据）：
  - 主表 `CDC_DATA_SOURCE` 13 条：`ACDS_0830FTA_SRC03 / TGT02X / TGT03 / TGT04 / VISRC / INACTIVE / TGTINACT` 及边界构造 `AAAAAAAAAABBBBBBBBBBCCCCCCCCCCD / AAAAAAAAAABBBBBBBBBBCCCCCCCCCCD1 / HST01 / NM30 / PRT1 / PRT65`。
  - `CDC_DATA_SOURCE_EXTEND` 4 条：`(SRC02,TGT01) / (SRC02,TGT02) / (SRC02,TGT03) / (VISRC,TGT04)`。
- 删除前核对：主表目标 13、EXTEND 目标 4，总数 CDC_DATA_SOURCE=32、EXTEND=14。
- 删除结果：EXTEND 4 行、主表 13 行，`MAIN_RESIDUAL=0`、`EXTEND_RESIDUAL=0`，总数回到基线 `CDC_DATA_SOURCE=19`、`EXTEND=10`。
- 一致性：清理后总数与任务开始前快照（主表 19、EXTEND 10）一致，未影响其他数据。

## 8. 后续新增调整项（非本次验收缺陷，未在本次任务修改代码）

以下为用户在视觉检查后提出的新调整需求，不属于当前批准基线的验收缺陷，相关用例状态不因这些项改为 FAIL，本次任务不修改任何业务代码、配置、需求或设计文档：

1. 有查询条件且无匹配记录时：主提示改为“未找到符合当前查询条件的数据源”，辅助提示为“请调整查询条件后重试，或点击上方‘重置’查看全部数据源”；不增加重复的“重置查询”按钮；无查询条件且系统无数据时仍显示“暂无数据源”，并提示使用右上角“新增数据源”；空状态使用正常中性颜色，不使用红色或橙色。
2. 新增/编辑数据源、业务属性、目标库命名策略三个业务弹窗支持通过标题栏拖动：不得完全拖出可视区域；每次重新打开恢复居中；删除确认、未保存确认等小型确认框保持固定居中。
3. 所有业务弹窗的表单标签采用固定宽度并左对齐；输入框左边界保持一致；必填星号不得造成文字错位。
4. “目标库命名策略”弹窗默认宽度调整到约 1050px，同时适配浏览器可视宽度：表格不分页；默认可完整容纳约 5 行记录；优化目标库 ID、目标库名称、数据库类型、命名策略、前缀、后缀和操作列宽；长内容可以省略，悬停显示完整值。
5. “表合并”和“自定义前后缀”改为带说明的单选卡片：表合并——按表合并规则生成目标表名，无需填写前缀和后缀；自定义前后缀——在源表名基础上添加指定前缀和后缀，生成目标表名；点击整张卡片可以选中；选中状态使用蓝色边框和浅蓝色背景。

## 9. 安全与脱敏声明

- 本报告与 Git 文件不写入任何真实密码；涉及密码处一律以 `<REDACTED>` 表示。
- 验收期间的临时运行日志（后端/前端）在提取脱敏证据后已删除；含明文测试密码的临时证据文件已脱敏处理。
- 数据库连接信息仅按 db 类型/host/port/Service Name/db 名/userName 记录。

## 10. 环境限制与遗留

- MySQL/Doris 真实连接受环境限制（见 §5.1），不作为产品缺陷。
- 20 项全量测试既有失败（17 项 ZooKeeper JobFailureService 错误 + 2 项失败 + 1 项 OracleDateMapping）按任务约束不修复、不放宽、不影响本功能验收结论。
- 验收期间未执行任何 ZooKeeper 写操作（只读）。
