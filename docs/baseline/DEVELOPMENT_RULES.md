# DEVELOPMENT_RULES — 开发规则（项目级基线）

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 恢复任务：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001
> 恢复日期：2026-08-27
> 恢复任务执行基线：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c
> 恢复草案首次入库提交：a6f51f8a8ff984bc946a4e2ccaccbf56692722fe
> 本轮修订任务：PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001（结果提交见本轮实施报告）
> 来源：服务器既有候选（docs/baseline/ 未提交文件，原 BASELINE-001/002 与 DATABASE-CODE-MAPPING-001 Phase 2 固化）+ 恢复任务修订 + 本轮复审修订，对齐当前代码与已批准数据库基线
> 首次草拟：2026-08-12

基线日期: 2026-08-27（恢复草案，历史草稿 2026-08-12）
基线来源: CLAUDE.md（现行开发规范）、BASELINE-001 盘点、用户确认、DATABASE-CODE-MAPPING-001 Phase 2 固化
维护触发: CLAUDE.md 修订、安全边界调整、审批流程变更、数据库映射/关系规则变更

---

## 1. 规则来源与优先级

当不同规则出现冲突时，按以下顺序执行：

1. 人工在当前会话中的明确指令
2. 当前任务 Markdown
3. 项目 `CLAUDE.md`
4. 项目 README 及其他设计、接口、分析文档
5. Agent 自行推断

限制：当前任务不得擅自放宽本文件中的 Git、安全、数据库审批和 ZooKeeper 只读约束。存在歧义时必须停止并向人工确认。

来源: CLAUDE.md §2

---

## 2. Git铁律

### 2.1 分支约束

- 只允许在 `develop` 分支上开发。
- 当前仓库仅 `develop` 单分支，线性历史，单作者（acmilan1982），无 main/master/release 分支。提交总数属动态口径，以 Git 实际为准，不在本文固定。
- 未经人工明确要求，不创建功能分支、不操作其他分支。

### 2.2 默认允许的只读检查

以下操作不改变工作区、索引、引用、本地历史或远程状态，Agent 可按任务需要执行：

`git status`、`git status --short`、`git status --branch --short`、`git diff`、`git diff --stat`、`git diff -- <path>`、`git log`、`git show`、`git rev-parse`、`git rev-list`、`git ls-remote`

### 2.3 需要用户或当前任务明确授权的操作

以下操作默认禁止，只有用户或当前任务明确授权时才能执行：

- `git fetch`、`git pull`、`git merge --ff-only`（会更新本地引用）；
- `git add`、`git commit`、`git push`；
- `git reset`、`git clean`、`git stash`、`git stash pop`；
- `git checkout` / `git switch`（切换分支或恢复文件）；
- 分支、Tag 的创建、切换、重命名或删除；
- 任何可能改变工作区、索引、引用、本地历史或远程状态的 Git 命令。

### 2.4 永久禁止的操作

- 操作 `develop` 以外的分支（读取除外）；
- `git push --force`、`git push --force-with-lease`；
- 删除或覆盖人工尚未提交的代码；
- 自行解决本地与远程分叉；
- 自行改写提交历史。

### 2.5 非干净工作区处理

- 工作区不干净本身不构成自动停线；
- 任务开始前必须记录 Git 现场，并区分本任务授权范围、任务开始前已存在的无关修改、以及归属无法确定的修改；
- 与本任务无关的既有修改保持原样：不修改、不覆盖、不暂存、不提交；
- 目标文件若在任务开始前已有修改，只有能够确认归属并安全保留时才允许继续编辑；无法明确区分或存在覆盖风险时，停止修改该文件并报告；
- 当前分支非 `develop`、本地与远程分叉（且未被授权解决）、暂存区存在未知内容或需要超出授权范围时，停止任务并报告。

来源: CLAUDE.md §4, §5

---

## 3. 提交规范

- 格式: `type(scope): subject`（Conventional Commits）
- Commit Message 必须包含任务编号
- 一个 Commit 对应一个任务，不得混合多个无关任务
- 不得提交日志、构建输出、缓存和临时文件
- 不得将当前任务之外的人工修改一并提交

来源: Git历史、CLAUDE.md §20

---

## 4. 数据库操作规则

### 4.1 连接信息

Oracle 19c @ 192.168.174.65:1521/prod.enmotech.com，Schema: CDC。此为内网开发数据库，其连接信息（含密码）在 CLAUDE.md §11 明确授权下可保存于仓库。

### 4.2 读操作

允许: `SELECT`、DDL/DML 查看、Oracle 数据字典查询、样例数据查询

### 4.3 写操作审批

任何可能修改数据库状态的操作（`INSERT`, `UPDATE`, `DELETE`, `MERGE`, `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, 存储过程/包调用、匿名 PL/SQL 块）执行前必须向人工展示：

1. 完整 SQL 或 PL/SQL
2. 目标数据库和对象
3. 操作目的
4. 预计影响行数或对象范围
5. 风险说明
6. 可行回滚方式

只有人工明确回复同意后才允许执行。

来源: CLAUDE.md §12

---

## 5. ZooKeeper操作规则

### 5.1 默认只读

所有 ZK 分析、监控、联调和排查任务默认只读。允许: `ls`, `get`, `stat`，通过项目后端只读接口读取节点。

### 5.2 写操作审批

未经人工明确审批，禁止: `create`, `set`, `delete`, `deleteall`, `setAcl`, `reconfig`, `multi/transaction` 及任何 ZK 写 API。代码中禁止新增或调用写 API。

审批要求与数据库写操作相同（展示目标路径、操作类型、内容、目的、影响、回滚方式）。

### 5.3 监控范围

限定于 `/bsoft-cdc/clients`。默认不处理 `/bsoft-cdc/servers` 和 `/bsoft-cdc/signals`，除非任务明确要求。

来源: CLAUDE.md §14

---

## 6. 构建与验证规则

### 6.1 验证矩阵

| 任务类型 | 后端构建 | 前端构建 | DB连接 | ZK连接 |
|---|---|---|---|---|
| 后端开发 | 必须 | 不适用 | 按需 | 按需 |
| 前端开发 | 不适用 | 必须 | 不适用 | 不适用 |
| 前后端联调 | 必须 | 必须 | 按需 | 按需 |
| 文档/盘点 | 不适用 | 不适用 | 不适用 | 不适用 |

### 6.2 后端构建

```bash
cd /agent/cdc-config-platform/backend
mvn clean test     # 验证
mvn clean package  # 打包
```

使用预装 Maven 3.8.8 + JDK 8。构建失败不得 Commit/Push。

### 6.3 前端构建

```bash
cd /agent/cdc-config-platform/frontend
npm run build      # 含 vue-tsc 类型检查 + vite build
npm test           # vitest run（log-query 等已含组件测试）
```

构建失败不得 Commit/Push。

来源: CLAUDE.md §15-17

---

## 7. 环境预检规则

所有任务必检: `git`, `claude` 命令可用性。后端任务加检: `java`, `javac`, `mvn`，必须使用 JDK 8。前端任务加检: `node`, `npm`。数据库任务加检: `sqlplus`。ZK任务加检: zkCli.sh 存在性。

任一必需环境项不可用时，立即停止任务，不得自行安装或修复。

来源: CLAUDE.md §8-9

---

## 8. 安全与配置规则

### 8.1 凭据保护

- **允许提交**: 内网开发数据库连接信息（CLAUDE.md §11 明确授权）。本项目现有内网开发数据库连接信息（地址/端口/Schema/用户名/密码及带凭据连接串）已经用户明确授权保留（PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001 §4），敏感内容检查将其视为用户批准例外，不删除、不替换、不脱敏。
- **禁止提交**: 生产环境账号或密码、GitHub Token、Claude Code 认证信息、SSH 私钥或操作系统私钥、与本项目无关的凭据，以及任务开始时尚未入库的新密码或新密钥。发现此类内容时立即停止相关提交并报告。
- 不得在日志、任务结果或 Commit Message 中打印完整认证令牌或私钥；实施报告不得重复打印完整密码或带密码连接串，只记录"现有内网开发数据库凭据经用户明确授权保留"。

### 8.2 认证机制

当前系统无认证/授权机制（无 Spring Security、Shiro、JWT）。是否为长期目标待后续决策。

来源: 代码审查、CLAUDE.md §11、§20

### 8.3 未提交文件

工作区不干净不构成自动停线，但任务开始前必须记录现场并区分归属（见 §2.5）。截至 2026-08-27 恢复任务盘点，开发环境存在 129 个未跟踪文件、9 个已修改文件、3 个已删除文件（含文档、截图、配置修改、源码修改和模拟数据），尚未逐项确认归属与冲突。未提交文件治理为独立任务，不阻塞基线。

---

## 9. 禁止自动安装或修改

业务开发任务中禁止: 安装/下载 JDK、Maven、Node.js、Oracle Client、ZK客户端、Git、Claude Code CLI；使用 yum/dnf/rpm/apt 安装基础工具；修改系统环境变量、用户 Shell 启动文件；替换基础环境版本。环境不可用时必须报告失败。

来源: CLAUDE.md §9

---

## 10. 数据库映射与逻辑关系规则

### 10.1 映射变更同步

新增、修改或删除数据库表或字段时，必须同步检查并更新：
1. Entity 类及 @TableName/@TableId 注解；
2. Mapper 接口（BaseMapper 或纯 @Select/@Update）；
3. Service/定时任务中通过 Mapper 或 JdbcTemplate 的访问代码；
4. Controller/API 端点对外暴露的数据结构；
5. 前端消费链路（API 调用、Store、页面组件）；
6. 项目级基线（ARCHITECTURE.md §4 数据架构）。

### 10.2 物理外键

项目采用逻辑外键（代码层引用 + 数据一致性核验），数据库无 FOREIGN KEY 约束。这是架构决策，不是缺陷。未经独立设计与明确批准，不得擅自建立物理外键。

### 10.3 关系确认标准

字段名相似不能单独证明逻辑关系存在。关系确认至少需要以下证据之一：
- 代码中的 JOIN、.eq()、.in() 等关联查询证据；
- 数据库只读核验（空值、重复、孤立引用检查）；
- 用户对关系语义的明确确认。

关系状态分为三级：已确认（有代码证据+数据核验）、高度可信（字段/类型/数据一致但缺代码级 JOIN）、待用户确认。不得静默升级确认等级。

### 10.4 当前事实、目标规则、差异分离

任何存在偏差的数据库对象或代码映射，必须明确区分：
- **当前事实**：代码和数据库当前实际状态；
- **目标规则**：已确认的正确业务规则；
- **当前差异**：二者尚未一致的部分。

不得把目标规则写成数据库当前已有约束，不得把人工测试数据写成正常业务基数，也不得把建议修复写成完成状态。

### 10.5 多值弱逻辑引用

逗号分隔 ID 字段（如 CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID、CDC_DATA_SUBSCRIBE.DATA_FROM_SOURCE_ID 等）为多值弱逻辑引用，不得按普通外键处理。代码通过 `.split(",")` 解析，无法使用标准 SQL JOIN。核验时不以 token 级完整性为标准。

失败 Job ID 链（FAILED_JOB_ID / NEW_JOB_ID）同理，其关联方式由 algorithm 包定义，不得假定为传统外键关系。

统计水位关系（如 CDC_STATS_WATERMARK.TASK_CODE → CDC_STATS_TASK_CONFIG.TASK_CODE）以业务键/任务标识关联统计任务与水位记录，表达调度进度和增量处理边界，不是普通实体父子关系。不得将其误建、误写或误推导为传统物理外键。

### 10.6 管理平台只读数据

管理平台对 CDC_CLIENT_MULTIPLE、CDC_DATA_SUBSCRIBE、CDC_LOG_CORRECT、CDC_LOG_ERROR、CDC_JOB_FAILURE_EVENT、CDC_JOB_FAILURE_HANDLE_LOG 及其关联关系只读。不得由管理平台擅自补写、清理或修复这些数据。

实际维护方（已批准数据库基线 RELATIONS.md）：CDC_CLIENT_MULTIPLE、CDC_DATA_SUBSCRIBE 由人工维护；CDC_LOG_CORRECT / CDC_LOG_ERROR 由 sync-server → Kafka → sync-log 写入；CDC_JOB_FAILURE_EVENT / CDC_JOB_FAILURE_HANDLE_LOG 由 sync-client 写入。管理平台对这些数据均只读。

### 10.7 测试构造数据标注

涉及开发环境中人工构造的容错测试场景（如 CDC_DATA_SOURCE_EXTEND 的重复、孤立、缺失记录），必须在文档中标注其性质和确认时间，不得固化为永久结构事实或正常业务基数。

### 10.8 映射差异修复流程

发现数据库—代码映射差异时，应创建独立修复任务并单独评审验证。不得在文档任务、基线任务或无关业务任务中顺手修改。

---

## 11. 普通任务提示词保留规则

用户确认的规则方向：普通任务级提示词 Markdown 默认不上传 Git。

### 11.1 默认不入 Git

- 一次性实现提示词；
- 一次性定向修复提示词；
- 已执行完成且已由代码、基线和报告覆盖的提示词；
- 仅用于从聊天向 Agent 传递任务的临时 Markdown；
- 重复复制 REQUIREMENTS、DESIGN、API、UI、DATABASE 的提示词。

### 11.2 允许例外

只有以下内容可入 Git，且要写明理由：

- 长期复用的项目流程、规则或模板；
- 尚未执行、必须跨会话继续的高风险任务说明；
- 审计、合规或事故复盘要求保留的原始授权；
- 正式基线或批准报告明确引用且没有等价证据的任务说明。

### 11.3 报告单独判断

- 提示词不入 Git，不等于报告全部不入 Git；
- 影响现行状态、验收、批准链或重大边界的报告可保留；
- 普通成功报告若结论已进入正式基线，可以不长期保留；
- 报告不能替代正式基线。

### 11.4 本任务处理边界

- 本恢复任务的提示词不得提交到仓库；
- 不新增任何普通任务提示词；
- 不删除已跟踪的历史 agent-prompts；
- 未跟踪提示词保持原样，不暂存、不提交、不删除；
- 历史 prompts 清理属于独立任务。

来源: PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001 §11（用户确认的规则方向）

---

## 12. 文档维护规则

- 六份项目级基线文档（`docs/baseline/`）为持续维护的正式基线，重大变更后应更新
- 任务提示词和执行报告为历史过程资料，不进入长期基线
- 同一事实只在最合适的主文档完整定义，其他文档引用

---

## 待确认事项

| 事项 | 说明 |
|---|---|
| 认证方案 | 当前无认证，长期是否需要待决定 |
| 分支策略 | 当前仅develop单分支，未来是否引入main分支待决定 |
| 未提交文件治理 | 需独立任务执行分类和处理 |
