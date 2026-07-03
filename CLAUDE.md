# CDC配置管理平台 - Agent开发规范

## 1. 项目基本信息

- 项目名称：CDC配置管理平台
- 项目目录：`/agent/cdc-config-platform`
- 开发分支：`develop`
- JDK：8
- Spring Boot：2.7.x
- 数据库：Oracle
- 构建工具：Maven
- 前端运行环境：Node.js + npm
- Git 是唯一代码版本管理工具

---

## 2. Agent开发模式

本项目采用 Agent 与人工串行开发模式：

- Claude Code 只允许在 `develop` 分支上开发
- Claude Code 开始任务前必须拉取远程 `develop` 最新代码
- Claude Code 完成任务后必须完成验证、Commit 并 Push 到远程 `develop`
- 人工通过 Windows IDEA 拉取 `develop` 分支进行 Review、运行和验收
- 人工或 Codex 修改完成后必须 Commit 并 Push 回 `develop`
- Claude Code 与人工不得同时修改和推送 `develop`

---

## 3. Git强约束规则

### 允许操作

- `git status`
- `git status --short`
- `git branch --show-current`
- `git fetch origin`
- `git pull --ff-only origin develop`
- `git diff`
- `git diff --stat`
- `git log`
- `git add <明确文件>`
- `git commit`
- `git push origin develop`

### 禁止操作

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

工作区不干净、当前分支不是 `develop`、本地与远程发生分叉时，必须停止任务并报告，不得自行修复、覆盖或改写历史。

---

## 4. 任务开始规则

每次任务开始前必须：

1. 进入项目目录：`/agent/cdc-config-platform`
2. 加载环境：

```bash
source /agent/cdc-config-platform/agent-env.sh
```

3. 确认当前目录是有效 Git 仓库
4. 执行 `git status --short`，确认工作区干净
5. 执行 `git branch --show-current`，确认当前分支为 `develop`
6. 执行 `git fetch origin`
7. 执行 `git pull --ff-only origin develop`
8. 记录任务开始前的完整 Commit ID
9. 执行环境预检

任何前置检查失败时，必须停止当前任务，不得继续编码、Commit 或 Push。

---

## 5. 代码修改原则

- 只修改当前任务明确涉及的代码和文档
- 不得擅自扩大任务范围
- 不得引入与当前任务无关的重构
- 不得删除已有业务逻辑，除非任务明确要求
- 必须优先读取并复用已有 Entity、DTO、VO、Mapper、Service、配置和公共组件
- 不得重复创建已有类或功能相同的公共组件
- 新增或修改的代码必须能够通过当前阶段要求的构建或验证
- 不得修改 `.claude/settings.json`
- 不得修改 `.claude/skills/**`，除非任务明确要求
- 不得修改本文件，除非任务明确要求
- 发现需求、表结构或现有实现存在歧义时，应列出待确认问题，不得自行猜测后扩大实现

---

## 6. 数据库访问与写操作审批

Claude Code 使用项目提供的 Oracle 开发库普通可读写账号。

### 可直接执行

- `SELECT`
- `WITH ... SELECT`
- 查询表、字段、注释、索引、约束、序列、视图和少量样例数据
- 不改变数据库状态的 SQL*Plus 命令

### 必须获得人工明确确认后才能执行

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

执行前必须先向人工展示：

1. 完整 SQL 或 PL/SQL
2. 目标数据库和对象
3. 操作目的
4. 预计影响行数或对象范围
5. 风险说明
6. 可行的回滚方式

只有人工明确回复同意执行后，才允许真正执行。

以下行为不代表执行授权：

- 要求分析 SQL
- 要求生成 SQL
- 要求检查修改方案
- 要求说明如何更新数据
- 任务文档中出现写操作示例

不得猜测数据库字段、主键、约束、序列或字典值，必须优先读取真实数据库元数据和样例数据。

---

## 7. 预装基础环境

服务器已经预先安装并配置：

- JDK 8：`/usr/java/latest`
- Maven：`/usr/local/maven`
- Oracle Instant Client：`/opt/oracle/instantclient`
- SQL*Plus：由 Oracle Instant Client 提供
- Node.js：`/opt/node`
- Git
- Claude Code CLI
- 项目环境脚本：`/agent/cdc-config-platform/agent-env.sh`

执行构建、数据库访问、前端构建或代码任务前，必须先执行：

```bash
source /agent/cdc-config-platform/agent-env.sh
```

必须使用服务器已配置的固定环境，不得擅自切换或替换版本。

---

## 8. 环境预检规则

任务开始后、Git同步完成后，应执行：

```bash
source /agent/cdc-config-platform/agent-env.sh

command -v java
command -v javac
command -v mvn
command -v sqlplus
command -v git
command -v claude
command -v node
command -v npm

java -version
javac -version
mvn -version
sqlplus -v
git --version
claude --version
node -v
npm -v
locale
```

环境检查必须满足：

- `java` 和 `javac` 使用 JDK 8
- `JAVA_HOME` 指向 `/usr/java/latest`
- `mvn` 来自 `/usr/local/maven/bin/mvn`
- Maven 实际使用 JDK 8
- `sqlplus` 来自 `/opt/oracle/instantclient`
- Node.js 和 npm 可以正常执行
- Git 和 Claude Code CLI 可以正常执行
- Locale 加载后不存在错误提示

如果任一当前任务必需的环境项不存在、版本不符合要求或无法启动：

- 立即停止任务
- 不得继续编码
- 不得 Commit
- 不得 Push
- 返回 `status=FAILED`
- 明确指出异常环境项和原始错误信息

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
- 使用 `yum`、`dnf`、`rpm`、`apt` 安装基础开发工具
- 修改 `/usr/java`
- 修改 `/usr/local/maven`
- 修改 `/opt/oracle`
- 修改 `/opt/node`
- 修改 `/usr/local/bin`
- 修改系统级 `PATH`
- 修改 `/etc/profile`
- 修改用户 Shell 启动文件
- 为解决单个任务问题而替换系统基础环境版本

如果基础环境不可用，必须报告失败，不得自行修复或安装。

---

## 10. Maven和npm依赖规则

允许 Maven 根据项目 `pom.xml` 和服务器已有 `settings.xml` 下载项目依赖与插件。

Maven 本地仓库使用当前运行用户的默认目录：

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

允许 npm 根据项目 `package.json` 下载前端依赖，并使用 `agent-env.sh` 中配置的缓存目录和 registry。

禁止：

- 擅自修改 npm registry
- 删除整个 npm 缓存目录
- 全局安装与当前任务无关的 npm 包
- 为解决单个任务而替换 Node.js 或 npm 版本

依赖下载失败时，应保留原始错误并判断是网络、镜像、认证还是依赖坐标问题，不得通过替换基础工具解决。

---

## 11. Oracle客户端规则

Oracle客户端环境由 `agent-env.sh` 统一提供，包括：

- `ORACLE_HOME`
- `TNS_ADMIN`
- `NLS_LANG`
- `LD_LIBRARY_PATH`
- `PATH`

执行 SQL*Plus 前必须先加载：

```bash
source /agent/cdc-config-platform/agent-env.sh
```

数据库访问规则：

- 使用项目明确配置的开发库账号和连接地址
- 优先读取真实表结构、字段注释、约束、索引、序列和样例数据
- SQL*Plus 连接失败时，必须停止依赖数据库元数据的任务
- 中文表注释或字段注释出现乱码时，必须报告并停止基于乱码内容进行业务推断
- 不得擅自修改 Oracle 客户端、TNS 配置或字符集环境

---

## 12. 构建与验证规则

在前后端项目骨架尚未创建前，不得假设具体构建目录和命令。

项目骨架建立后，应以项目实际结构和 README 中明确的命令为准。通常包括：

后端：

```bash
cd /agent/cdc-config-platform/backend
mvn clean compile -DskipTests
```

前端：

```bash
cd /agent/cdc-config-platform/frontend
npm install
npm run build
```

构建要求：

- 必须从正确目录执行
- 必须使用预装环境
- 必须保留并汇报完整构建结果
- 当前任务导致的编译或构建错误必须修复
- 构建失败不得 Commit
- 构建失败不得 Push
- 构建失败不得返回 `status=SUCCESS`

若当前任务仅涉及仓库初始化、文档或数据库分析，可根据任务性质执行相应的文件检查和 Git 验证，不强制执行尚不存在的前后端构建命令。

---

## 13. 配置与凭据规则

允许提交本项目内网开发环境所需的数据库连接配置。

禁止提交：

- GitHub访问令牌
- Claude Code认证信息
- SSH私钥
- 操作系统账号私钥
- 生产环境账号或密码
- 与本项目无关的凭据

不得在日志、任务结果或 Commit Message 中额外打印完整认证令牌和私钥内容。

---

## 14. 提交和推送规则

任务完成后必须：

1. 执行 `git status --short`
2. 执行 `git diff --stat`
3. 执行 `git diff`
4. 确认修改仅属于当前任务
5. 执行当前任务要求的构建或验证
6. 只使用 `git add <明确文件>` 暂存文件
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

## 15. 任务结果输出要求

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
- Push 状态
- 遗留问题或失败原因

建议使用：

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
push_status=SUCCESS、FAILED或NOT_APPLICABLE
changed_files=使用逗号分隔的实际变更文件
error=失败时填写具体原因，成功时留空
AGENT_TASK_RESULT_END
```

只有在当前任务要求的条件全部满足时才能返回 `status=SUCCESS`。
