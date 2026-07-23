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

---

## 3. Agent开发模式

本项目采用 Agent 与人工串行开发模式：

- Claude Code 只允许在 `develop` 分支上开发。
- Claude Code 开始任务前必须拉取远程 `develop` 最新代码。
- Claude Code 完成任务后必须完成验证、Commit 并 Push 到远程 `develop`。
- 人工通过 Windows IDEA 拉取 `develop` 分支进行 Review、运行和验收。
- 人工或 Codex 修改完成后必须 Commit 并 Push 回 `develop`。
- Claude Code 与人工不得同时修改和推送 `develop`。
- 每次任务只对应一个明确任务编号和一个独立 Commit。
- 未经人工明确要求，不创建功能分支、不操作其他分支。

---

## 4. Git强约束规则

### 4.1 允许操作

- `git status`
- `git status --short`
- `git branch --show-current`
- `git fetch origin`
- `git pull --ff-only origin develop`
- `git diff`
- `git diff --stat`
- `git log`
- `git rev-parse HEAD`
- `git ls-remote origin refs/heads/develop`
- `git add <明确文件>`
- `git commit`
- `git push origin develop`

### 4.2 禁止操作

- 操作 `develop` 以外的分支
- 创建其他开发分支
- `git push --force`
- `git push --force-with-lease`
- `git rebase`
- `git merge`
- `git reset --hard`
- `git clean -fd`
- `git restore .`
- `git checkout -- .`
- 未经人工确认执行 `git stash`
- `git add .`
- `git add -A`
- 删除或覆盖人工尚未提交的代码
- 自行解决本地与远程分叉
- 自行改写提交历史

出现以下任一情况时，必须停止任务并报告：

- 工作区不干净
- 当前分支不是 `develop`
- 本地与远程发生分叉
- 存在无法识别的人工修改
- `git pull --ff-only` 失败

不得自行修复、覆盖、暂存、丢弃或改写历史。

---

## 5. 任务开始规则

每次任务开始前必须执行：

```bash
cd /agent/cdc-config-platform
source /agent/cdc-config-platform/agent-env.sh

git status --short
git branch --show-current
git fetch origin
git pull --ff-only origin develop
git rev-parse HEAD
```

必须确认：

1. 当前目录为 `/agent/cdc-config-platform`
2. 当前目录是有效 Git 仓库
3. 工作区干净
4. 当前分支为 `develop`
5. 已同步远程最新代码
6. 已记录任务开始前完整 Commit ID
7. 当前任务所需环境通过预检

任一前置检查失败时：

- 立即停止任务
- 不得继续编码
- 不得 Commit
- 不得 Push
- 返回明确失败原因

---

## 6. 任务范围与代码修改原则

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
- 公共规则调整必须作为独立任务，不得夹带在业务任务中。
- 发现需求、表结构、接口或现有实现存在歧义时，必须列出待确认问题，不得自行猜测。
- 如发现任务开始前已存在的无关缺陷，必须报告，不得为了完成当前任务而顺手修复。
- 不得因构建失败擅自修改当前任务范围之外的代码。

---

## 7. 预装基础环境

服务器已预先安装并配置：

- JDK 8：`/usr/java/latest`
- Maven：`/usr/local/maven`
- Oracle Instant Client：`/opt/oracle/instantclient`
- SQL*Plus：由 Oracle Instant Client 提供
- Node.js：`/opt/node`
- Git
- Claude Code CLI
- ZooKeeper 客户端：`/opt/zookeeper/apache-zookeeper-3.5.6-bin`
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
test -x /opt/zookeeper/apache-zookeeper-3.5.6-bin/bin/zkCli.sh
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

- ZooKeeper 客户端版本：3.5.6
- ZooKeeper 客户端目录：`/opt/zookeeper/apache-zookeeper-3.5.6-bin`
- ZooKeeper 客户端命令：`/opt/zookeeper/apache-zookeeper-3.5.6-bin/bin/zkCli.sh`
- CDC ZooKeeper 地址：`192.168.174.51:2181`
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

## 19. 配置与凭据规则

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

## 20. 提交和推送规则

任务完成后必须：

1. 执行 `git status --short`
2. 执行 `git diff --stat`
3. 执行 `git diff`
4. 确认修改仅属于当前任务
5. 执行当前任务要求的构建或验证
6. 使用 `git add <明确文件>` 逐个暂存
7. 创建一个与当前任务对应的 Commit
8. Push 到 `origin/develop`
9. 确认本地 HEAD 与远程 `develop` HEAD 一致
10. 确认任务结束时工作区干净

Commit Message 必须包含任务编号，例如：

```text
feat(DATASOURCE_CREATE_002): implement entity and dto
```

不得：

- 在一个 Commit 中混合多个无关任务
- 提交日志、构建输出、缓存和临时文件
- 将当前任务之外的人工修改一并提交
- Push 到 `develop` 以外的分支

---

## 21. 任务结果输出要求

每次任务结束必须输出：

- 任务状态
- 任务编号
- 修改文件列表
- 任务开始前 Commit ID
- 任务完成后 Commit ID
- 分支名称
- 环境预检结果
- 后端构建结果（适用时）
- 前端构建结果（适用时）
- 数据库写操作及审批状态（适用时）
- ZooKeeper写操作及审批状态（适用时）
- Push 状态
- 遗留问题或失败原因
- 服务 PID、URL和停止命令（适用时）

统一机器可读格式：

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS或FAILED
task_code=实际任务编号
branch=develop
base_commit_id=任务开始前完整Commit ID
result_commit_id=任务结束后完整Commit ID
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

只有当前任务要求的全部条件满足时，才能返回：

```text
status=SUCCESS
```

---

## 22. 单任务Prompt最小要求

在本文件已经定义公共规则后，单任务 Markdown 原则上只需要包含：

1. 任务编号
2. 任务目标
3. 允许修改范围
4. 明确业务规则
5. 特殊禁止事项
6. 验收标准
7. 提交信息
8. 当前任务特有的真实环境验证

单任务 Prompt 不需要重复粘贴本文件中已经明确的：

- Git通用规则
- 环境通用规则
- 数据库审批通用规则
- ZooKeeper只读通用规则
- 通用构建命令
- 通用提交和结果输出格式

如当前任务需要覆盖默认验证范围，必须明确说明，但不得放宽安全边界。
