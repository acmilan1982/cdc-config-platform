# Claude Code 任务：初始化 CDC 配置管理平台 GitHub 仓库

你当前位于 Red Hat 开发服务器。

项目目录：

```text
/agent/cdc-config-platform
```

GitHub 私有空仓库地址：

```text
https://github.com/acmilan1982/cdc-config-platform.git
```

本次任务目标：

在不创建正式前后端工程、不连接数据库、不开发任何业务功能的前提下，完成本地项目目录的 Git 初始化、基础目录与规则文件创建、首次提交、远程仓库关联以及 `develop` 分支首次推送。

---

## 一、必须先执行的准备工作

1. 进入项目目录：

```bash
cd /agent/cdc-config-platform
```

2. 读取并严格遵守：

```text
/agent/cdc-config-platform/CLAUDE.md
```

3. 加载项目环境：

```bash
source /agent/cdc-config-platform/agent-env.sh
```

4. 检查以下工具是否可用：

```bash
git --version
java -version
javac -version
mvn -version
node -v
npm -v
sqlplus -v
claude --version
```

本任务只检查环境，不安装、不升级、不替换任何系统工具。

如果环境检查失败，立即停止并报告，不得自行修改：

- 系统 PATH
- `/etc/profile`
- 系统级环境变量
- Maven 全局配置
- npm registry
- JDK
- Maven
- Git
- Node.js
- npm
- Oracle Instant Client
- SQL*Plus
- Claude Code

---

## 二、任务开始前检查

执行：

```bash
pwd
ls -la
git status
```

说明：

- 当前 Git 仓库可能尚未初始化。
- GitHub 远程仓库是完全空仓库，没有文件、提交和分支。
- 如果当前目录已经是 Git 仓库，必须先检查其状态和远程配置。
- 如果发现已有提交、已有远程仓库、未提交文件或与本任务预期不一致的状态，立即停止并报告，不得覆盖或清理。

禁止执行：

```bash
git reset --hard
git clean -fd
git restore .
git checkout -- .
git stash
git push --force
```

---

## 三、初始化 Git 仓库

如果当前目录尚未初始化 Git，则执行：

```bash
git init
git checkout -b develop
```

如果 Git 默认分支初始化后不是 `develop`，必须显式创建并切换到 `develop`。

最终必须确认：

```bash
git branch --show-current
```

输出必须为：

```text
develop
```

本任务禁止创建或操作 `main`、`master` 或其他分支。

---

## 四、创建基础目录

只创建以下基础目录：

```text
backend/
frontend/
docs/
scripts/
```

为了让空目录能够被 Git 跟踪，可在每个目录中创建 `.gitkeep`：

```text
backend/.gitkeep
frontend/.gitkeep
docs/.gitkeep
scripts/.gitkeep
```

禁止创建：

- Spring Boot 工程
- Maven `pom.xml`
- Vue 工程
- Vite 工程
- `package.json`
- Controller
- Service
- Mapper
- Entity
- DTO
- VO
- 页面组件
- 数据库脚本
- ZooKeeper 代码
- CRUD 代码
- CI/CD 配置
- GitHub Actions
- Docker 配置

---

## 五、检查和创建基础文件

项目根目录最终应包含：

```text
CLAUDE.md
agent-env.sh
README.md
.gitignore
.gitattributes
.editorconfig
backend/
frontend/
docs/
scripts/
```

### 1. 现有文件处理原则

`CLAUDE.md` 和 `agent-env.sh` 已存在。

要求：

- 不得擅自重写、删除或替换。
- 只检查文件是否存在。
- 不得修改其中的数据库账号、密码、环境变量或项目规则。
- 如果发现内容明显缺失或文件不存在，停止并报告。

### 2. README.md

创建简洁的 `README.md`，只包含：

- 项目名称：CDC 配置管理平台
- 项目目标：通过 Web 页面维护 CDC 配置，并提供 ZooKeeper 运行状态监控
- 当前阶段：仓库初始化
- 计划技术栈：
  - 后端：JDK 8、Spring Boot 2.7.x、Maven、Oracle、MyBatis 或 MyBatis-Plus
  - 前端：Vue 3、Vite、Element Plus、Axios、Vue Router、Pinia
- 目录说明
- 当前尚未创建正式前后端工程

不得在 README 中写入数据库密码、Token、SSH 私钥或其他敏感信息。

### 3. .gitignore

至少忽略：

```text
# IDE
.idea/
*.iml
.vscode/

# Java
target/
*.class
*.jar
*.war
*.ear
hs_err_pid*
replay_pid*

# Maven
.mvn/timing.properties
.flattened-pom.xml

# Node
node_modules/
dist/
.vite/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
*.swp
*.swo
*~
```

不得忽略：

```text
CLAUDE.md
agent-env.sh
README.md
docs/
scripts/
```

### 4. .gitattributes

至少配置：

```text
* text=auto
*.sh text eol=lf
*.md text eol=lf
*.java text eol=lf
*.xml text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
*.properties text eol=lf
*.js text eol=lf
*.ts text eol=lf
*.vue text eol=lf
```

### 5. .editorconfig

至少配置：

```text
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 4

[*.{yml,yaml,json,js,ts,vue}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

---

## 六、检查敏感信息

首次提交前，检查所有待提交文件。

禁止提交：

- GitHub Token
- Claude Code 登录信息
- SSH 私钥
- 操作系统私钥
- 生产环境账号
- 与本项目无关的凭据

本项目开发数据库连接信息按照项目规则可以保留，但不得新增、扩散或复制到无关文件。

执行类似检查：

```bash
git status --short
git diff --no-index /dev/null README.md || true
git diff --no-index /dev/null .gitignore || true
git diff --no-index /dev/null .gitattributes || true
git diff --no-index /dev/null .editorconfig || true
```

同时人工检查 `CLAUDE.md` 和 `agent-env.sh` 是否包含不应提交的 Token、SSH 私钥或生产凭据。

如果发现风险，停止并报告，不得提交。

---

## 七、暂存与首次提交

禁止使用：

```bash
git add .
git add -A
```

必须显式暂存本任务文件，例如：

```bash
git add CLAUDE.md
git add agent-env.sh
git add README.md
git add .gitignore
git add .gitattributes
git add .editorconfig
git add backend/.gitkeep
git add frontend/.gitkeep
git add docs/.gitkeep
git add scripts/.gitkeep
```

然后执行：

```bash
git status
git diff --cached
```

确认暂存区只包含本次初始化任务文件。

首次提交信息使用：

```text
chore(REPO_INIT_001): initialize project repository
```

执行：

```bash
git commit -m "chore(REPO_INIT_001): initialize project repository"
```

---

## 八、关联 GitHub 远程仓库

远程仓库地址：

```text
https://github.com/acmilan1982/cdc-config-platform.git
```

先检查：

```bash
git remote -v
```

如果不存在 `origin`，执行：

```bash
git remote add origin https://github.com/acmilan1982/cdc-config-platform.git
```

如果已经存在 `origin`：

- 地址完全一致：继续。
- 地址不一致：立即停止并报告，不得自动修改或删除远程地址。

再次确认：

```bash
git remote -v
```

---

## 九、推送 develop 分支

执行：

```bash
git push -u origin develop
```

禁止：

```bash
git push --force
git push -f
```

如果 GitHub 身份验证失败，停止并报告完整错误，不得把 Token 写入项目文件或命令历史。

---

## 十、完成后验证

依次执行：

```bash
git status
git branch --show-current
git log -1 --oneline
git remote -v
git rev-parse HEAD
git ls-remote origin refs/heads/develop
find . -maxdepth 2 -type f | sort
```

必须确认：

1. 当前目录为 `/agent/cdc-config-platform`
2. 当前分支为 `develop`
3. 工作区干净
4. 本地存在首次提交
5. `origin` 地址正确
6. 远程 `develop` 已创建
7. 本地 HEAD 与远程 `develop` Commit ID 一致
8. 没有创建正式前后端工程
9. 没有连接数据库
10. 没有执行任何数据库写操作
11. 没有修改系统环境
12. 没有操作其他分支

---

## 十一、最终输出格式

任务完成后，按以下结构输出：

```text
任务编号：REPO_INIT_001
任务名称：初始化 CDC 配置管理平台 GitHub 仓库

一、执行结果
- 成功 / 失败
- 当前目录
- 当前分支
- 本地 Commit ID
- 远程 develop Commit ID
- 远程仓库地址
- 工作区状态

二、创建或确认的目录
- backend/
- frontend/
- docs/
- scripts/

三、创建或确认的文件
- CLAUDE.md
- agent-env.sh
- README.md
- .gitignore
- .gitattributes
- .editorconfig

四、验证结果
- Git 初始化
- develop 分支
- 首次提交
- origin 关联
- push develop
- 本地与远程 HEAD 一致
- 工作区干净

五、未执行事项
- 未创建 Spring Boot 工程
- 未创建 Vue 工程
- 未连接数据库
- 未开发 CRUD
- 未开发 ZooKeeper 监控
- 未修改系统环境
- 未操作 main 或其他分支

六、异常或风险
- 无；或列出具体问题
```

---

## 十二、严格边界

本任务只完成仓库初始化。

不得自行扩大范围，不得继续执行任何后续任务。

完成后立即停止，等待项目负责人验收和下一步指令。
