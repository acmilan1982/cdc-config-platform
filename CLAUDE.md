# CDC配置管理平台 - Agent开发规范

## 1. 项目基本信息

- 项目名称：CDC配置管理平台
- 项目目录：`/agent/cdc-config-platform`
- 开发分支：`develop`
- JDK：8
- Spring Boot：2.7.x
- 数据库：Oracle 19c
- 后端构建工具：Maven
- 前端运行环境：Node.js + npm
- Git 是唯一代码版本管理工具

---

## 2. 规则优先级

当不同规则之间出现冲突时，按以下顺序执行：

1. 人工在当前会话中的明确指令
2. 当前任务 Markdown
3. 本文件 `CLAUDE.md`
4. 项目 README 和其他设计、接口、分析文档
5. Agent 自行推断

限制：

- 当前任务不得擅自放宽本文件中的 Git、安全、数据库审批和 ZooKeeper 只读约束。
- 如确需修改公共规则，必须由人工明确提出，并作为独立任务处理。
- 存在歧义时必须停止并向人工确认，不得自行扩大实现范围。

冲突处理：

- 当前任务要求、正式基线、代码现状、环境现状之间出现实质冲突时，不得静默选边；
- 应记录冲突、证据、影响范围和可选处理方式；
- 涉及用户决策、越权操作或安全边界时，停止相关操作并报告；
- 不得擅自修改正式基线来迎合当前实现；
- 普通任务提示词不得暗中放宽安全规则；用户明确授权的规则维护任务可以修改本文件。

---

## 3. 项目基线读取规则

### 3.1 正式项目级基线

开始任何与本项目有关的分析、设计、开发、修复、测试、验收、文档或运维准备任务前，Agent 必须完整读取 `docs/baseline/` 下六份正式项目级基线：

| 文件 | 职责 |
|---|---|
| `PROJECT.md` | 项目总览 |
| `ENVIRONMENT.md` | 环境配置 |
| `ARCHITECTURE.md` | 系统架构 |
| `DEVELOPMENT_RULES.md` | 开发规则 |
| `PROJECT_STATUS.md` | 项目状态快照 |
| `DOMAIN_GLOSSARY.md` | 领域词汇表 |

这六份文件承载当前有效的项目级结论性事实。即使当前任务提示词没有重复列出，Agent 也不得跳过。正式基线的修改必须是用户明确授权的基线维护任务，不得在普通业务任务中顺手修改。

### 3.2 功能级基线

如果当前任务属于一个已经建立正式功能基线的功能，还必须读取 `docs/features/<feature>/` 下与该任务相关的正式功能基线。功能级基线不存在时，不得自行假设已经存在；不得用过程材料、旧提示词或临时报告冒充正式功能基线。

### 3.3 过程材料

`docs/baseline-work/` 是分析、证据、修订、执行和验收等过程材料。日常会话和 Agent 交接默认不读取，不得无目的批量读取。只有在以下情况才定向读取：

- 正式基线存在歧义或冲突，需要追溯证据；
- 执行基线审计、修订或升级任务；
- 继续未关闭的专项任务；
- 正式基线明确引用且当前任务确需细节；
- 用户明确要求。

如果日常任务频繁依赖过程材料才能理解项目，应报告正式基线可能沉淀不足，而不是把全部过程材料改成默认必读。

---

## 4. Agent开发模式

本项目采用 Agent 与人工串行开发模式：

- Claude Code 只允许在 `develop` 分支上开发。
- Claude Code 与人工不得同时修改和推送 `develop`。
- 人工通过 Windows IDEA 拉取 `develop` 分支进行 Review、运行和验收。
- 未经人工明确要求，不创建功能分支、不操作其他分支。
- 任务开始前必须按 §3 读取项目基线，按 §5 记录 Git 现场。

---

## 5. Git 约束规则

### 5.1 默认允许的只读检查

Agent 可按任务需要执行以下只读 Git 操作：

- `git status`、`git status --short`、`git status --branch --short`
- `git branch --show-current`
- `git diff`、`git diff --stat`、`git diff -- <path>`
- `git log`、`git show`
- `git rev-parse`、`git rev-list`
- `git ls-remote`

### 5.2 需要明确授权的写操作

以下操作默认禁止，只有用户或当前上级任务明确授权时才能执行：

- `git add`、`git commit`、`git push`
- `git pull`、`git fetch`（会更新本地引用）
- `git merge`、`git rebase`
- `git reset`、`git clean`
- `git stash`、`git stash pop`
- `git checkout`（切换分支或恢复文件）
- `git switch`
- 分支创建、切换、重命名或删除
- Tag 创建、修改、删除或推送
- 任何可能改变工作区、索引、引用、本地历史或远程状态的 Git 命令

### 5.3 Commit 授权

- 只有用户或当前上级任务明确要求 Commit 时才允许执行；
- "完成任务""修复完成""验收通过""关闭任务""保存修改"等表述不等于 Commit 授权；
- 授权应能够识别提交范围以及是否包含新增文件；
- 只能暂存和提交明确授权范围内的文件；
- 默认禁止 `git add .`、`git add -A` 等可能混入范围外文件的宽泛暂存方式；
- Commit 授权只对当次明确范围有效，不自动延续到后续任务。

### 5.4 Push 授权

- Commit 授权不包含 Push 授权；
- 只有用户或当前上级任务明确要求 Push 时才允许执行；
- "提交""任务关闭""验收通过"不等于 Push 授权；
- 执行 Push 前应核对当前分支、本地 HEAD、远程目标、ahead/behind 和待推送 Commit；
- Push 授权只对当次明确目标有效。
- 同一条指令可以同时授权 Commit 与 Push，但必须明确包含两项操作及范围。

### 5.5 永久禁止的操作

无论是否授权，以下操作始终禁止：

- 操作 `develop` 以外的分支（读取除外）
- `git push --force`、`git push --force-with-lease`
- 删除或覆盖人工尚未提交的代码
- 自行解决本地与远程分叉
- 自行改写提交历史

### 5.6 停线条件

出现以下任一情况时，必须停止任务并报告：

- 当前分支不是 `develop`
- 本地与远程发生分叉（且未被授权解决）
- 目标文件存在无法安全区分的既有修改
- 需要超出授权范围的 Git 操作

不得自行修复、覆盖、暂存、丢弃或改写历史。

---

## 6. 任务开始规则

每次任务开始前必须执行：

```bash
cd /agent/cdc-config-platform
source /agent/cdc-config-platform/agent-env.sh

git status --short
git branch --show-current
git rev-parse HEAD
```

必须确认：

1. 当前目录为 `/agent/cdc-config-platform`
2. 当前目录是有效 Git 仓库
3. 当前分支为 `develop`
4. 已记录任务开始前完整 Commit ID 和 `git status --short` 输出
5. 当前任务所需环境通过预检

非干净工作区处理：

- 工作区不干净本身不构成自动停线；
- 区分本任务授权范围、任务开始前已存在的无关修改，以及与目标文件重叠或归属无法确定的修改；
- 本任务范围内的文件可按授权处理；
- 与本任务无关的既有修改必须保持原样，不修改、不覆盖、不暂存、不提交；
- 目标文件若在任务开始前已有修改，先判断是否可在保留既有内容的前提下安全编辑；如果无法明确区分或存在覆盖风险，停止修改该文件并报告；
- 不得为了获得干净工作区执行 Reset、Checkout、Clean、Stash 或删除文件。
- 不得执行 `git pull`、`git fetch`、`git merge` 或 `git rebase`，除非当前任务明确授权。

任一阻塞性前置检查失败时（如分支非 develop、本地与远程分叉且未被授权解决），立即停止任务并返回明确失败原因。

---

## 7. 任务范围与代码修改原则

- 只修改当前任务明确涉及的代码和文档。
- 不得擅自扩大任务范围。
- 不得引入与当前任务无关的重构。
- 不得删除已有业务逻辑，除非任务明确要求。
- 必须优先读取并复用已有 Entity、DTO、VO、Mapper、Service、配置和公共组件。
- 不得重复创建已有类或功能相同的公共组件。
- 新增或修改的代码必须通过当前任务要求的构建或验证。
- 不得修改 `.claude/settings.json`。
- 不得修改 `.claude/skills/**`，除非任务明确要求。
- 不得修改本文件，除非人工明确要求。
- 不得修改 `docs/baseline/` 下六份正式项目级基线，除非当前任务是用户明确授权的基线维护任务。
- 公共规则调整必须作为独立任务，不得夹带在业务任务中。
- 发现需求、表结构、接口或现有实现存在歧义时，必须列出待确认问题，不得自行猜测。
- 如发现任务开始前已存在的无关缺陷，必须报告，不得为了完成当前任务而顺手修复。
- 不得因构建失败擅自修改当前任务范围之外的代码。

---

## 8. 预装基础环境

服务器已预先安装并配置：

- JDK 8：`/usr/java/latest`
- Maven：`/usr/local/maven`
- Oracle Instant Client：`/opt/oracle/instantclient`
- SQL*Plus：由 Oracle Instant Client 提供
- Node.js：`/opt/node`
- Git
- Claude Code CLI
- ZooKeeper 客户端：`/opt/zookeeper/zookeeper-3.4.14`
- 项目环境脚本：`/agent/cdc-config-platform/agent-env.sh`

执行任何任务前必须先加载：

```bash
source /agent/cdc-config-platform/agent-env.sh
```

必须使用服务器已配置的固定环境，不得擅自切换或替换版本。

---

## 8. 环境预检规则

环境预检采用“通用必检 + 按任务类型检查”。

### 8.1 所有任务必检

```bash
command -v git
command -v claude

git --version
claude --version
locale
```

### 8.2 后端任务

```bash
command -v java
command -v javac
command -v mvn

java -version
javac -version
mvn -version
```

必须满足：

- `java` 和 `javac` 使用 JDK 8
- `JAVA_HOME=/usr/java/latest`
- Maven 来自 `/usr/local/maven/bin/mvn`
- Maven 实际使用 JDK 8

### 8.3 前端任务

```bash
command -v node
command -v npm

node -v
npm -v
```

### 8.4 数据库任务

```bash
command -v sqlplus
sqlplus -v
```

必须确认 SQL*Plus 来自 `/opt/oracle/instantclient`。

### 8.5 ZooKeeper任务

```bash
test -x ${ZOOKEEPER_HOME}/bin/zkCli.sh
```

必要时执行只读连接检查。

### 8.6 失败处理

当前任务必需的环境项不存在、版本不符合或无法启动时：

- 立即停止任务
- 不得继续编码
- 不得 Commit
- 不得 Push
- 返回 `status=FAILED`
- 保留并报告原始错误信息

不要求与当前任务无关的环境项通过检查。

---

## 9. 禁止自动安装或修改基础环境

业务开发任务中禁止：

- 下载或安装 JDK
- 下载或安装 Maven
- 下载或安装 Oracle Instant Client
- 下载或安装 SQL*Plus
- 下载或安装 Git
- 下载或安装 Claude Code CLI
- 下载或安装另一套 Node.js 或 npm
- 下载或安装另一套 ZooKeeper 客户端
- 使用 `yum`、`dnf`、`rpm`、`apt` 安装基础开发工具
- 修改 `/usr/java`
- 修改 `/usr/local/maven`
- 修改 `/opt/oracle`
- 修改 `/opt/node`
- 修改 `/opt/zookeeper`
- 修改 `/usr/local/bin`
- 修改系统级 `PATH`
- 修改 `/etc/profile`
- 修改用户 Shell 启动文件
- 为解决单个任务问题而替换基础环境版本

基础环境不可用时必须报告失败，不得自行安装或修复。

---

## 10. Maven与npm依赖规则

### 10.1 Maven

允许 Maven 根据项目 `pom.xml` 和服务器已有 `settings.xml` 下载项目依赖和插件。

本地仓库使用：

```text
${HOME}/.m2/repository
```

禁止：

- 替换 Maven 版本
- 临时下载另一套 Maven
- 修改 `/usr/local/maven`
- 删除整个 Maven 本地仓库
- 绕过公司已有 Maven 镜像配置
- 擅自修改全局 Maven `settings.xml`
- 引入与当前任务无关的新依赖

### 10.2 npm

允许 npm 根据项目 `package.json` 和锁文件下载项目依赖，并使用 `agent-env.sh` 配置的缓存目录和 registry。

默认前端任务不重复执行 `npm install`。

仅在以下情况执行依赖安装：

- `node_modules` 不存在
- `package-lock.json` 发生变化
- 当前任务明确新增或调整依赖
- 项目 README 明确要求

禁止：

- 擅自修改 npm registry
- 删除整个 npm 缓存目录
- 全局安装与当前任务无关的 npm 包
- 替换 Node.js 或 npm 版本

依赖下载失败时，应保留原始错误，并判断网络、镜像、认证或依赖坐标问题，不得通过替换基础工具解决。

---

## 11. 开发数据库连接

本项目使用以下 Oracle 开发数据库：

- 数据库类型：Oracle 19c
- 主机地址：`192.168.174.65`
- 端口：`1521`
- Service Name：`prod.enmotech.com`
- 用户名：`CDC`
- 密码：`CDC`
- 默认 Schema：`CDC`

SQL*Plus 连接示例：

```bash
sqlplus 'CDC/CDC@//192.168.174.65:1521/prod.enmotech.com'
```

本项目明确允许在仓库中保存上述内网开发数据库连接信息，包括用户名和密码。

该授权仅适用于本文档明确列出的内网开发数据库，不适用于：

- 生产数据库
- 外网环境
- 其他系统账号
- GitHub Token
- Claude Code认证信息
- SSH私钥
- 操作系统私钥
- 其他敏感凭据

不得自行切换到其他数据库、用户或 Schema。

---

## 12. 数据库访问与写操作审批

Claude Code 使用上述 Oracle 开发库普通可读写账号。

### 12.1 可直接执行

- `SELECT`
- `WITH ... SELECT`
- 查询表、字段、注释、索引、约束、序列、视图和少量样例数据
- 查询必要的 Oracle 数据字典视图
- 不改变数据库状态的 SQL*Plus 命令

### 12.2 必须获得人工明确确认

任何可能修改数据库状态的操作，包括但不限于：

- `INSERT`
- `UPDATE`
- `DELETE`
- `MERGE`
- `CREATE`
- `ALTER`
- `DROP`
- `TRUNCATE`
- `COMMENT`
- `GRANT`
- `REVOKE`
- 存储过程、函数或包调用
- 匿名 PL/SQL 块
- 可能写入临时表、配置表或业务表的脚本

执行前必须向人工展示：

1. 完整 SQL 或 PL/SQL
2. 目标数据库和对象
3. 操作目的
4. 预计影响行数或对象范围
5. 风险说明
6. 可行回滚方式

只有人工明确回复同意执行后，才允许真正执行。

以下行为不代表执行授权：

- 要求分析 SQL
- 要求生成 SQL
- 要求检查修改方案
- 要求说明如何更新数据
- 任务文档中出现写操作示例

不得猜测数据库字段、主键、约束、序列或字典值，必须优先读取真实数据库元数据和样例数据。

任务另有表白名单时，只访问白名单内业务表；必要的 Oracle 数据字典视图不受该限制。

---

## 13. Oracle客户端规则

Oracle客户端环境由 `agent-env.sh` 统一提供，包括：

- `ORACLE_HOME`
- `TNS_ADMIN`
- `NLS_LANG`
- `LD_LIBRARY_PATH`
- `PATH`

执行 SQL*Plus 前必须加载：

```bash
source /agent/cdc-config-platform/agent-env.sh
```

规则：

- 使用本文档明确配置的开发库账号和连接地址
- 优先读取真实表结构、字段注释、约束、索引、序列和样例数据
- SQL*Plus 连接失败时，停止依赖数据库元数据的任务
- 中文注释乱码时，停止基于乱码内容进行业务推断
- 不得擅自修改 Oracle 客户端、TNS 配置或字符集环境

---

## 14. ZooKeeper环境与操作规则

### 14.1 环境信息

- ZooKeeper 服务端目标版本：3.4.14
- ZooKeeper 客户端目录：`/opt/zookeeper/zookeeper-3.4.14`（ZOOKEEPER_HOME）
- ZooKeeper 客户端命令：`${ZOOKEEPER_HOME}/bin/zkCli.sh`
- CDC ZooKeeper 地址：`10.19.16.111:2181`
- CDC 根路径：`/bsoft-cdc`
- ZooKeeper 无认证

环境变量由 `agent-env.sh` 提供，包括：

```text
ZOOKEEPER_HOME
CDC_ZK_CONNECT
CDC_ZK_ROOT
```

### 14.2 默认只读

所有 ZooKeeper 分析、监控、联调和排查任务默认只读。

允许使用：

```text
ls
get
stat
```

允许通过项目后端只读接口读取节点。

### 14.3 禁止写操作

未经人工明确审批，禁止：

- 创建节点
- 修改节点数据
- 删除节点
- 修改 ACL
- 修改集群配置
- 执行事务写操作
- 调用任何 ZooKeeper 写 API

包括但不限于：

```text
create
set
delete
deleteall
setAcl
reconfig
multi/transaction
```

代码中禁止新增或调用：

```text
create
setData
delete
setACL
reconfig
transaction
```

### 14.4 写操作审批

如任务确实需要 ZooKeeper 写操作，执行前必须向人工展示：

1. 完整目标路径
2. 操作类型
3. 写入内容
4. 操作目的
5. 影响范围
6. 风险说明
7. 回滚方式

只有人工明确回复同意后才允许执行。

任务文档中出现写操作示例不代表授权。

### 14.5 监控范围

当前 CDC 监控范围：

```text
/bsoft-cdc/clients
```

默认不处理：

```text
/bsoft-cdc/servers
/bsoft-cdc/signals
```

除非当前任务明确要求。

### 14.6 读取失败处理

ZooKeeper 连接失败、节点读取失败或数据解析失败时：

- 保留原始错误
- 不得写入或修复节点
- 不得自行创建缺失节点
- 按任务要求返回 warning、partialFailure 或失败结果
- 不得把底层敏感堆栈直接返回前端

---

## 15. 构建与验证矩阵

| 任务类型 | 后端构建 | 前端构建 | 数据库连接 | ZooKeeper连接 |
|---|---|---|---|---|
| 后端开发 | 必须 | 不适用 | 按需 | 按需 |
| 前端开发 | 不适用 | 必须 | 不适用 | 不适用 |
| 前后端联调 | 必须 | 必须 | 按需 | 按需 |
| 文档任务 | 不适用 | 不适用 | 不适用 | 不适用 |
| 数据库分析 | 不适用 | 不适用 | 必须 | 不适用 |
| ZooKeeper分析 | 不适用 | 不适用 | 不适用 | 必须 |
| Git/仓库任务 | 按任务要求 | 按任务要求 | 不适用 | 不适用 |

当前任务 Markdown 可在不放宽安全约束的前提下，进一步指定验证范围。

---

## 16. 后端构建规则

后端默认验证命令：

```bash
cd /agent/cdc-config-platform/backend
mvn clean test
mvn clean package
```

要求：

- 必须从正确目录执行
- 必须使用预装 Maven 和 JDK 8
- 必须报告测试数量和构建结果
- 当前任务导致的失败必须修复
- 任务开始前已存在的无关失败必须停止并报告，不得擅自扩大修复范围
- 构建失败不得 Commit
- 构建失败不得 Push
- 构建失败不得返回 `status=SUCCESS`

仅文档或不涉及后端代码的任务，按验证矩阵可标记为 `NOT_APPLICABLE`。

---

## 17. 前端构建规则

前端默认验证命令：

```bash
cd /agent/cdc-config-platform/frontend
npm run build
```

如项目已有以下脚本且当前任务适用，也应执行：

```bash
npm run type-check
npm run lint
npm test
```

要求：

- 默认不重复执行 `npm install`
- 必须从正确目录执行
- 必须报告构建结果
- 当前任务导致的失败必须修复
- 任务开始前已存在的无关失败必须停止并报告
- 构建失败不得 Commit
- 构建失败不得 Push
- 构建失败不得返回 `status=SUCCESS`

---

## 18. 服务启动与运行验证

如任务要求启动服务，必须：

- 使用项目 README 或现有脚本中的真实启动命令
- 不猜测目录、端口或配置
- 记录前端和后端 PID
- 输出访问 URL
- 输出停止命令
- 保持服务运行或停止服务，以当前任务要求为准
- 不得遗留重复进程
- 不得因重复启动造成端口冲突

后台运行时应使用项目现有方式；不得擅自创建 systemd 服务或修改系统配置。

---

## 19. 程序启动与外部访问验收规则

当任务要求启动前端、后端或完整应用供用户验收时：

1. 服务必须监听可被服务器外部访问的网络接口，通常绑定 `0.0.0.0`；不得只监听 `127.0.0.1` 或 `localhost`。
2. Agent 必须在最终报告中提供用户可直接打开的完整 URL，主机部分使用 `192.168.174.70`。
3. URL 必须包含实际协议、端口和页面路径，例如 `http://192.168.174.70:5173/large-screen`。示例只表达格式，不得把端口或路径当作所有任务的固定值；必须使用本次实际启动结果。
4. 不得仅提供 `localhost`、`127.0.0.1`、`0.0.0.0` 作为最终验收 URL。`0.0.0.0` 只用于监听绑定，不能作为交付给用户打开的 URL 主机。
5. Agent 必须核验并报告：
   - 实际监听地址和端口；
   - 进程是否仍在运行；
   - 本机 HTTP 请求或健康检查结果；
   - 供用户访问的完整 URL；
   - 若前后端分别启动，分别给出必要地址，并明确主要页面验收入口。
6. 本机请求成功不等于已经证明用户侧网络可达。若条件允许，应进一步验证使用 `192.168.174.70` 的 URL；若仍无法确认用户侧可访问，必须如实标注验证边界，不得虚假声明"外部访问已通过"。
7. 如果服务启动成功但外部访问受防火墙、端口策略、反向代理或网络路由阻断，Agent 应报告具体阻断点和建议操作，不得擅自修改服务器防火墙、安全策略、代理或网络配置，除非用户另行明确授权。
8. 为视觉验收启动的程序应保持运行，直到用户完成验收或明确要求停止；报告中应给出必要的进程或日志定位信息，便于后续检查和停止。

**规则适用边界：**

- 只有任务要求"启动程序供用户验收"时，才强制提供外部访问 URL。
- 纯代码分析、文档、静态检查或不要求启动程序的任务，不得为了满足此规则擅自启动服务。
- 若用户在具体任务中明确指定其他服务器地址、域名、协议、端口或访问方式，以该次明确指令为准，并在报告中说明。

---

## 20. 配置与凭据规则

允许提交：

- 本文档明确列出的内网开发数据库连接信息
- 本项目内网开发环境所需的配置

禁止提交：

- 生产环境账号或密码
- GitHub访问令牌
- Claude Code认证信息
- SSH私钥
- 操作系统账号私钥
- 与本项目无关的凭据

不得在日志、任务结果或 Commit Message 中额外打印完整认证令牌或私钥。

---

## 21. 提交和推送规则

Commit 和 Push 均需用户或当前上级任务明确授权，默认禁止执行。详见 §5.2-§5.4。

当获得 Commit 和/或 Push 授权时：

1. 执行 `git status --short`；
2. 执行 `git diff --stat`，必要时执行 `git diff`；
3. 确认操作范围仅包含本次明确授权内容；
4. 执行当前任务要求的构建或验证；
5. 获得 Commit 授权时，才允许逐个暂存本次授权范围内的文件并创建 Commit；
6. 获得 Push 授权时，才允许推送已明确授权的 Commit；仅获得 Push 授权而未获得 Commit 授权时，不得创建新 Commit；
7. 仅在实际执行 Push 后，确认本地 HEAD 与远程目标分支 HEAD 一致；
8. 已执行 Commit、但未获得 Push 授权时，应报告本地 ahead 状态，不得因此自行 Push。

Commit Message 必须包含任务编号，格式：`type(scope): subject`。

不得：

- 在一个 Commit 中混合多个无关任务
- 提交日志、构建输出、缓存和临时文件
- 将当前任务之外的人工修改一并提交
- 提交未经授权的文件或变更
- Push 到 `develop` 以外的分支
- 在未获得 Push 授权的情况下推送

---

## 22. 任务结果输出要求

每次任务结束必须输出：

- 任务状态
- 任务编号
- 修改文件列表
- 任务开始前 Commit ID
- 分支名称
- 环境预检结果
- 后端构建结果（适用时）
- 前端构建结果（适用时）
- 数据库写操作及审批状态（适用时）
- ZooKeeper写操作及审批状态（适用时）
- 遗留问题或失败原因
- 服务 PID、URL和停止命令（适用时）

当任务获得并执行了 Commit/Push 授权时，额外输出：
- 任务完成后 Commit ID
- Push 状态

统一机器可读格式：

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS或FAILED
task_code=实际任务编号
branch=develop
base_commit_id=任务开始前完整Commit ID
result_commit_id=任务结束后完整Commit ID（仅获得并执行Commit授权时填写，否则为NOT_APPLICABLE）
env_check_status=SUCCESS或FAILED
backend_build_status=SUCCESS、FAILED或NOT_APPLICABLE
frontend_build_status=SUCCESS、FAILED或NOT_APPLICABLE
database_write_status=NOT_REQUESTED、PENDING_APPROVAL、APPROVED_AND_EXECUTED或FAILED
zookeeper_write_status=NOT_REQUESTED、PENDING_APPROVAL、APPROVED_AND_EXECUTED或FAILED
push_status=SUCCESS、FAILED或NOT_APPLICABLE
changed_files=使用逗号分隔的实际变更文件
error=失败时填写具体原因，成功时留空
AGENT_TASK_RESULT_END
```

只有当前任务要求的全部条件满足时，才能返回 `status=SUCCESS`。

---

## 23. 单任务Prompt最小要求

在本文件已经定义公共规则后，单任务 Markdown 原则上只需要包含：

1. 任务编号
2. 任务目标
3. 允许修改范围
4. 明确业务规则
5. 特殊禁止事项
6. 验收标准
7. 当前任务特有的真实环境验证
8. 如需要 Commit/Push，应提供明确授权说明

单任务 Prompt 不需要重复粘贴本文件中已经明确的：

- 项目基线读取规则（§3）
- Git 通用规则（§5）
- 环境通用规则（§8-§10）
- 数据库审批通用规则（§12）
- ZooKeeper 只读通用规则（§14）
- 通用构建命令（§16-§17）
- 通用结果输出格式（§22）

如当前任务需要覆盖默认验证范围或 Git 授权范围，必须明确说明，但不得放宽安全边界。
