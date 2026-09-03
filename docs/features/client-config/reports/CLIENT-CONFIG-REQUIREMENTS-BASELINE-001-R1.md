# 执行报告：CLIENT-CONFIG-REQUIREMENTS-BASELINE-001-R1

## 1. 任务身份

| 项目 | 值 |
|---|---|
| 任务代码 | `CLIENT-CONFIG-REQUIREMENTS-BASELINE-001-R1` |
| 任务类型 | ChatGPT 正式复审（`CHANGES_REQUIRED`）驱动的纯文档定向修订 |
| Feature | `client-config`（用户可见名称“探针端管理”，既有路由 `/config/client`） |
| 报告路径 | `docs/features/client-config/reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001-R1.md` |
| 目标分支 | `develop` |

## 2. 正式复审结论与两项发现

ChatGPT 已独立核验首版提交 `abf2f400f168164473866aba391f57cadfcb8fea`：

- 提交与 Push 范围正确；
- `CCFG-REQ-001~090` 共 90 条，连续无缺无重；
- `CCFG-AC-001~076` 共 76 条，全部 `NOT_RUN`；
- 需求与验收双向追踪完整；
- 列表、编辑、删除、启停、描述自动生成、数据源唯一分配、历史异常规则总体正确；
- 正式复审结论为 `CHANGES_REQUIRED`，仅有两项确定性语义需要修正：

1. 探针 ID 大小写唯一性必须从模糊口径改成确定规则（删除“以 Oracle 实际语义和项目统一规则为准”）；
2. `CLIENT_DESC` 的 1024 限制必须从“字符”改成真实 Oracle BYTE 语义。

项目负责人补充确认：

1. 探针 ID 必须按不区分大小写唯一；
2. 项目负责人在真实数据库执行元数据查询，结果为 `DATA_TYPE=VARCHAR2`、`DATA_LENGTH=1024`、`CHAR_LENGTH=1024`、`CHAR_USED=B`，因此 `CDC_CLIENT_MULTIPLE.CLIENT_DESC` 当前物理语义为 `VARCHAR2(1024 BYTE)`。

本任务仅定向修正上述两项，未重新设计 Feature，未修改其他已通过复审的业务规则，未实现代码，未自行批准。

## 3. Git 现场与工作区既有修改保护

| 项目 | 值 |
|---|---|
| 分支 | `develop` |
| 实际开始基线（本地 HEAD） | `abf2f400f168164473866aba391f57cadfcb8fea` |
| 开始前 `origin/develop` | `abf2f400f168164473866aba391f57cadfcb8fea` |
| 开始前远程 `git ls-remote refs/heads/develop` | `abf2f400f168164473866aba391f57cadfcb8fea` |
| 开始前 ahead/behind | 0 0 |

任务提示词 §1 要求开始前核对远程并视情 `git fetch origin develop`。本次会话开始时已先执行只读核对确认本地 `HEAD`、`origin/develop` 与远程 `develop` 一致（均为 `abf2f40...`），任务提示词“已知起始提交 abf2f40...”为有效交接锚点且与远程最新一致，故直接以其为实际基线。

任务开始前工作区已存在大量与本次任务无关的既有修改（tracked 修改/删除与 untracked 文件，含 `.claude/settings.local.json`、`agent-env.sh`、`docs/database/` 下三份历史报告删除、`frontend/` 下若干布局/样式/菜单/路由文件、`docs/agent-prompts/`、`docs/features/app-shell/`、`docs/features/large-screen/`、`docs/large-screen/`、`docs/pages/`、`docs/screenshots/`、`docs/task-reports/`、`docs/baseline-work/`、`docs/code/`、`docs/prompts/`、`frontend/src/styles/theme.css`、`frontend/src/api/subscription.spec.ts`、`frontend/src/views/large-screen/mock-data.ts`、`package-lock.json` 等）。

保护措施：本任务只读取上述既有文件，不对其做任何修改、暂存或提交。白名单内三个文件（`REQUIREMENTS.md`、`ACCEPTANCE.md`、本报告）在任务开始前不存在归属无法区分的既有修改：其中 `REQUIREMENTS.md`、`ACCEPTANCE.md` 首版内容已随 `abf2f40` 提交，工作区在任务开始前处于与 `HEAD` 一致状态（`git status --short -- docs/features/client-config/` 为空），本次改动全部由本任务产生；`reports/` 目录下 R1 报告为本次新增。因此不存在覆盖或归属冲突。

## 4. 实际修改文件清单（均在任务白名单内）

| 文件 | 操作 |
|---|---|
| `docs/features/client-config/REQUIREMENTS.md` | 修改（两项定向语义修订） |
| `docs/features/client-config/ACCEPTANCE.md` | 修改（对应验收场景定向修订） |
| `docs/features/client-config/reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001-R1.md` | 新增（本执行报告） |

未修改 `docs/features/client-config/README.md`、`docs/features/README.md` 或其他任何文件。

## 5. 修订项一：探针 ID 不区分大小写唯一

### 5.1 REQUIREMENTS.md

`CCFG-REQ-038` 由原模糊表述重写为确定语义：

- 探针 ID 去除首尾空白后，在全部 `CDC_CLIENT_MULTIPLE.CLIENT_ID` 中按 ASCII 大小写不敏感比较保持唯一；
- 因 `CCFG-REQ-037` 限定探针 ID 仅由英文字母、数字、句点、下划线与连字符组成，大小写折叠只涉及英文字母，不引入中文或区域化大小写规则；
- `probe-001`、`Probe-001`、`PROBE-001` 视为同一唯一键，不能属于三条不同记录；
- 保存保留用户最终输入的大小写形式，不强制转大写或小写；
- 新增时只要存在仅大小写不同的 ID 即拒绝并提示冲突（`CCFG-REQ-043` 最小一致性补充）；
- 编辑以“原探针 ID”排除当前记录定位：仅自身大小写调整且无其他冲突时允许保存并保留新大小写，改成与另一记录仅大小写不同时拒绝（`CCFG-REQ-048` 最小一致性补充）；
- 前端可提前校验，后端保存前执行最终校验；
- 并发提交守住不区分大小写唯一性，最多一个成功；锁与事务方案留待后续 DESIGN/DATABASE 阶段，不虚构实现；
- Oracle 主键只保证精确值唯一，不冒充不区分大小写唯一的物理约束；本规则为应用层目标业务约束，不新增函数索引、约束、不执行 DDL。

已删除原“以 Oracle 实际语义和项目统一规则为准”的模糊表述。

### 5.2 ACCEPTANCE.md

`CCFG-AC-030` 与 `CCFG-AC-039` 定向修订（用例内部补充子场景，不新增验收编号）：

- `CCFG-AC-030`：已有 `probe-001` 时新增 `probe-001`/`Probe-001`/`PROBE-001` 均判定冲突且提示可理解；无冲突保存保留用户输入大小写；直接调用接口绕过前端仍被后端拒绝；两个并发请求仅大小写不同新 ID 最多一个成功（仅定义未来取证预期，不构造数据、不执行验收）。
- `CCFG-AC-039`：编辑用原探针 ID 定位并排除当前记录；仅自身 ID 大小写调整且无其他冲突时允许保存并保留新大小写；改成与另一记录仅大小写不同时拒绝；原格式非法、精确相同冲突、合法无冲突既有场景不丢失。

## 6. 修订项二：CLIENT_DESC 为 1024 BYTE

### 6.1 证据来源

项目负责人在正式复审中提供的真实数据库元数据查询结果：

```text
DATA_TYPE   = VARCHAR2
DATA_LENGTH = 1024
CHAR_LENGTH = 1024
CHAR_USED   = B
```

文档据此写为 `CDC_CLIENT_MULTIPLE.CLIENT_DESC = VARCHAR2(1024 BYTE)`。本任务 Agent 未获得数据库访问授权，报告与文档明确标注该结果来自“项目负责人提供的查询结果”，未写成 Agent 已连库核验；未执行数据库查询、DDL 或 DML。仓库已批准数据库基线记录 256 的差异仍作为待后续独立数据库基线同步项，但不再把真实 1024 语义描述为待确认。

### 6.2 REQUIREMENTS.md

全文清理“1024 字符 / ≤1024 字符 / 超过 1024 字符”目标口径，改为 BYTE 语义：

- §2.2“探针描述”术语：明确 `VARCHAR2(1024 BYTE)`（`CHAR_USED=B`），去除首尾空白后非空、UTF-8 字节数 ≤1024；
- §4 数据库事实摘要：写入元数据证据四要素与来源说明；
- `CCFG-REQ-039`：限制对象为 UTF-8 编码字节数（不是 Java `String.length()`/JavaScript 字符数/码点数/肉眼字符数）；纯 ASCII 1024 字符=1024 字节可通过、1025 必须拒绝；中文常见 3 字节、Emoji 等补充字符常见 4 字节按真实 UTF-8 计数；前后端同一字节口径、后端最终防线；具体工具留待设计阶段；
- `CCFG-REQ-059`：后端最终校验为必填/去除首尾空白/`VARCHAR2(1024 BYTE)` 字节校验；
- `CCFG-REQ-060`：自动生成英文逗号组合同样受 `VARCHAR2(1024 BYTE)` 限制、按 UTF-8 字节判断不得只按字符数；超 1024 字节失败并明确提示、保持原描述不变、不静默截断；
- §9 `BI-CFG-004`：目标按 `VARCHAR2(1024 BYTE)`（去除首尾空白后必填、UTF-8 字节数 ≤1024）；真实物理语义 `CHAR_USED=B` 已由项目负责人查询结果确认，不再描述为待确认；256 与当前 1024 BYTE 差异作为待后续独立数据库只读核验同步项；
- §10 变更记录：追加 R1 记录，不篡改首版历史记录。

### 6.3 ACCEPTANCE.md

`CCFG-AC-033` 与 `CCFG-AC-048` 定向修订（不新增编号）：

- `CCFG-AC-033`：Trim 后为空拒绝；纯 ASCII 1024 BYTE 允许 / 1025 BYTE 拒绝；中文或混合文本字符数 <1024 但 UTF-8 字节数 >1024 拒绝；Emoji 按真实 UTF-8 字节数计算；前后端边界一致、绕过前端直提超 1024 BYTE 仍被后端拒绝；保存成功值客观核验口径 `LENGTHB(CLIENT_DESC) <= 1024`（本 R1 文档任务不连接数据库、不执行）。
- `CCFG-AC-048`：自动生成结果恰好 1024 BYTE 允许填入；超过 1024 BYTE 失败、明确提示并保留原描述；不能只按字符数判断；原“无法取得非空机构名称 / 生成结果为空”异常场景不丢失。

验收文本未把数据库 BYTE 语义写成“1024 个字符”的当前目标规则。

## 7. 编号、数量与状态核验

本任务执行只读 Python 正则校验（命令与结果见 §8），结果：

| 项目 | 结果 |
|---|---|
| 需求编号 | `CCFG-REQ-001~090`，共 90 条，连续、无重复、无缺号 |
| 验收编号 | `CCFG-AC-001~076`，共 76 条，连续、无重复、无缺号 |
| 验收用例状态 | 76 条全部为 `NOT_RUN` |
| 验收引用需求合法性 | 未引用任何不存在的需求编号 |
| 需求覆盖 | 90/90 条需求均被至少一条验收用例关联覆盖（`CCFG-REQ-038/039/043/048/059/060` 覆盖在列） |
| 文档状态 | `REQUIREMENTS.md`、`ACCEPTANCE.md` 均为 `DRAFT_PENDING_USER_REVIEW` |
| 实现状态 | 均 `NOT_STARTED` |
| 追踪矩阵 | §5（REQ → AC）覆盖关系未减少，未做覆盖关系改动 |

## 8. 验证命令与结果

```text
git diff --check -- docs/features/client-config/
git status --short
git status --short -- docs/features/client-config/
git branch --show-current
git rev-parse HEAD
git diff --name-status <实际基线>..HEAD        （提交后执行）
```

结果：

- `git diff --check` 通过（无空白错误）；
- scoped `git status --short -- docs/features/client-config/` 仅显示白名单内 `REQUIREMENTS.md`（M）、`ACCEPTANCE.md`（M）与本报告（新增）；
- 全库只读文本校验（Python 正则）结果：需求 90 条连续无缺无重；验收 76 条连续无缺无重且状态集合为 `{'NOT_RUN'}`；验收引用需求无越界；需求 90/90 全覆盖；两份基线文档状态均 `DRAFT_PENDING_USER_REVIEW`、实现状态均 `NOT_STARTED`；
- 残留扫描：当前目标规则不再出现“以 Oracle 实际语义和项目统一规则为准”“最多 1024 字符”等错误口径；仅保留必要的正确说明（`CCFG-REQ-039` 中“纯 ASCII 1024 个字符为 1024 字节可通过”属 BYTE 语义的正确解释）与 §10 变更记录对旧口径的变更引用；
- 历史旧值 256 与当前 `1024 BYTE` 在 §2.2、§4、§9 `BI-CFG-004` 正确分层。

### 8.1 明确未执行项及原因

| 项目 | 状态与原因 |
|---|---|
| 前后端测试与构建 | `NOT_RUN_NOT_REQUIRED_DOCS_ONLY`：纯文档任务，未改业务代码/测试/配置 |
| 数据库连接与读写 | `NOT_RUN_NOT_AUTHORIZED`：任务未授权；元数据证据来自项目负责人查询结果 |
| DDL/DML | `NONE` |
| ZooKeeper / Kafka | `NOT_RUN_NOT_AUTHORIZED` |
| 服务启停 | `NONE` |

## 9. 不得改变的既有业务语义保持情况

除两项定向修订外，本任务未改动列表五列与排序、查询/重置、单击单选/双击编辑/顶部删除、删除不处理关联、启停只改数据库、探针 ID 默认锁定可解锁、描述自动生成“始终可点/无数据源无动作/按选择顺序英文逗号覆盖/生成后可编辑不提交模式”、数据源候选过滤与含逗号禁选与已占用显示探针 ID、单源单探针唯一分配与停用不释放与后端二次校验与并发最多一个成功、历史异常展示/编辑阻断/操作边界、不操作进程/ZK/Kafka/源库/DDL 等既有业务规则文字。未借 R1 顺手改写或优化其他需求。

## 10. 未触碰边界

- 未修改 `docs/features/client-config/README.md`、`docs/features/README.md`；
- 未修改 `docs/baseline/` 下已批准项目级基线、`docs/database/` 下已批准数据库基线；
- 未修改其他 Feature 文档、前端/后端/测试/配置/脚本或构建产物；
- 未建立 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`；
- 未连接数据库、未执行 DDL/DML、未操作 ZooKeeper/Kafka/sync-client、未启动/停止任何服务；
- 未将任何内容标记为已批准/已实现/用例通过；未创建功能分支；未执行任何越权 Git 写操作。

## 11. 当前状态与下一入口

| 项目 | 值 |
|---|---|
| 需求文档状态 | `DRAFT_PENDING_USER_REVIEW` |
| 验收文档状态 | `DRAFT_PENDING_USER_REVIEW` |
| 实现状态 | `NOT_STARTED` |
| 验收用例状态 | 76 条全部 `NOT_RUN` |
| 当前代码状态 | 占位页不变；本任务无任何代码改动 |
| 下一入口 | ChatGPT 对 R1 结果（本提交）进行正式复审；本任务不得创建设计文档、不得实现代码、不得自行批准 |

## 12. Commit/Push 与 Push 后核验

- 仅暂存本任务白名单 3 个文件（`docs/features/client-config/REQUIREMENTS.md`、`docs/features/client-config/ACCEPTANCE.md`、本报告），逐文件核对 staged diff；
- 提交信息：`docs(client-config): clarify id uniqueness and description byte limit`；
- 普通 Push 到 `origin/develop`，禁止 force push；
- Push 后核验 `local HEAD == origin/develop == git ls-remote origin refs/heads/develop` 且 ahead/behind = 0 0；
- 本报告与最终提交同一提交入库，不写入自身最终提交 ID；最终提交 ID 与远程提交 ID 在控制台 `AGENT_TASK_RESULT` 中给出，供后续复审从 Git 核验。

## 13. 结果字段

```text
AGENT_TASK_RESULT_BEGIN
status=见控制台最终结果
task_code=CLIENT-CONFIG-REQUIREMENTS-BASELINE-001-R1
branch=develop
base_commit_id=abf2f400f168164473866aba391f57cadfcb8fea
result_commit_id=控制台补充（本报告不写入以避免自引用）
remote_commit_id=控制台补充（本报告不写入以避免自引用）
ahead_behind=控制台补充（预计 0 0）
requirements_status=DRAFT_PENDING_USER_REVIEW
acceptance_status=DRAFT_PENDING_USER_REVIEW
implementation_status=NOT_STARTED
requirements_count=90
acceptance_count=76
report_path=docs/features/client-config/reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001-R1.md
database_access_status=NOT_RUN_NOT_AUTHORIZED
database_write_status=NONE
ddl_dml_status=NONE
zookeeper_kafka_status=NOT_RUN_NOT_AUTHORIZED
service_operation_status=NONE
test_build_status=NOT_RUN_NOT_REQUIRED_DOCS_ONLY
push_status=见控制台最终结果
next_entry=CHATGPT_FORMAL_REQUIREMENTS_R1_REVIEW
AGENT_TASK_RESULT_END
```
