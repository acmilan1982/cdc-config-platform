# ENVIRONMENT — 环境配置（项目级基线）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-BASELINE-APPROVAL-CLOSEOUT-001
> 批准日期：2026-08-27
> 批准内容提交：b054718130bbe922f2e26b79b3ee946290949ef1
> 批准依据：ChatGPT 第二轮复审 PASS + 用户明确正式批准
> 恢复任务：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001
> 恢复日期：2026-08-27
> 恢复任务执行基线：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c
> 恢复草案首次入库提交：a6f51f8a8ff984bc946a4e2ccaccbf56692722fe
> 本轮修订任务：PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001（结果提交见本轮实施报告）
> 来源：服务器既有候选（docs/baseline/ 未提交文件，原 BASELINE-001/002 与 DATABASE-CODE-MAPPING-001 Phase 2 落版）+ 恢复任务修订 + 本轮复审修订，对齐当前代码与配置
> 首次草拟：2026-08-11

基线日期: 2026-08-27（恢复草案，历史草稿 2026-08-11）
基线来源: `BASELINE-001` + R1/R2 修订 → `BASELINE-002` → `BASELINE-002-R1` 修订 → 本任务恢复并修订
维护触发: 基础环境变更、连接信息变更、依赖版本变更

---

## 1. 服务器基础环境

以下环境已预装并配置于开发服务器（Linux 5.14.0）。`agent-env.sh` 初始（BASELINE-001 时期）仅声明 Java、Maven、Oracle Client、Node.js 和 npm 相关环境变量，ZK-ENV-001 已新增 ZOOKEEPER_HOME、CDC_ZK_CONNECT、CDC_ZK_ROOT 及 PATH 四行。

禁止在业务任务中安装或修改基础环境（CLAUDE.md §9）。

| 工具 | 版本 | 路径 | 说明 |
|---|---|---|---|
| JDK | 1.8.0_202 (Oracle) | `/usr/java/latest` | JAVA_HOME；版本来自现场 `java -version` / `javac -version` 验证 |
| Maven | 3.8.8 | `/usr/local/maven` | MAVEN_HOME；版本来自现场 `mvn -version` 验证 |
| Node.js | v24.17.0 | `/opt/node` | NODE_HOME；构建正常，不要求本轮降级；版本来自现场 `node -v` 验证 |
| npm | 11.13.0 | `/opt/node/bin/npm` | registry: https://registry.npmmirror.com; cache: /data/npm-cache |
| Oracle Instant Client | 19.x | `/opt/oracle/instantclient` | ORACLE_HOME，含SQL*Plus |
| Git | 2.47.3 | 系统PATH | 版本来自现场 `git --version` 验证 |
| Claude Code | 2.1.143 | 系统PATH | Agent执行环境 |

### 1.1 ZooKeeper 环境

| 项目 | 值 | 状态 |
|---|---|---|
| ZOOKEEPER_HOME (用户确认正式目标) | `/opt/zookeeper/zookeeper-3.4.14` | 目录存在，zkCli.sh 权限已修正 |
| 当前磁盘上残留的旧 ZK CLI 工具 | `/opt/zookeeper/apache-zookeeper-3.5.6-bin` (v3.5.6) | 磁盘仍存在，非目标版本，待替换 |
| agent-env.sh 当前是否声明 ZK 变量 | 是 | CDC_ZK_CONNECT、CDC_ZK_ROOT、ZOOKEEPER_HOME 已于 ZK-ENV-001 同步 |

环境脚本: `source /agent/cdc-config-platform/agent-env.sh`

---

## 2. 数据库连接

| 项目 | 值 | 说明 |
|---|---|---|
| 数据库类型 | Oracle 19c | - |
| 主机 | 192.168.174.65 | - |
| 端口 | 1521 | - |
| Service Name | prod.enmotech.com | - |
| Schema / 用户 | CDC | - |
| 连接池 | HikariCP | min-idle=2, max-pool=5, conn-timeout=10s |
| NLS_LANG | AMERICAN_AMERICA.AL32UTF8 | - |
| 认证 | 用户名/密码（开发环境，CLAUDE.md §11授权可提交） | 生产密码禁止提交 |

连接示例: `sqlplus 'CDC/CDC@//192.168.174.65:1521/prod.enmotech.com'`

> 凭据保留授权：本仓库现有内网开发数据库连接信息（地址/端口/Schema/用户名/密码及带凭据连接串）已经用户明确授权保留（PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001 §4），不删除、不替换、不脱敏；敏感内容检查将其视为用户批准例外。此授权不适用于生产环境凭据、GitHub Token、Claude Code 认证信息、SSH/OS 私钥或本任务开始时尚未入库的新凭据。

---

## 3. ZooKeeper连接

### 3.1 用户确认的开发环境正式配置 (BASELINE-002-R1)

以下三项为用户于 2026-08-11 确认的开发环境 ZooKeeper 正式目标配置：

```bash
CDC_ZK_CONNECT=10.19.16.111:2181
CDC_ZK_ROOT=/bsoft-cdc
ZOOKEEPER_HOME=/opt/zookeeper/zookeeper-3.4.14
```

**当前同步状态**：

| 配置项 | agent-env.sh | CLAUDE.md §14 | application-dev.yml |
|---|---|---|---|
| CDC_ZK_CONNECT=10.19.16.111:2181 | 已同步 (ZK-ENV-001) | 已同步 (ZK-ENV-001) | 已同步 (ZK-ENV-001) |
| CDC_ZK_ROOT=/bsoft-cdc | 已同步 (ZK-ENV-001) | 已声明 `/bsoft-cdc` | 包含在 Spring Boot 配置中 |
| ZOOKEEPER_HOME=/opt/zookeeper/zookeeper-3.4.14 | 已同步 (ZK-ENV-001) | 已同步 (ZK-ENV-001) | 不适用 |

### 3.2 旧配置（待替换）

以下为仍残留在代码/配置中的旧值，**不得作为当前正式配置使用**：

| 旧值 | 残留位置 | 说明 |
|---|---|---|
| CDC_ZK_CONNECT=192.168.174.51:2181 | 仅保留于本文档作为历史记录 | 曾用地址，No route to host，已确认不可达。CLAUDE.md、application-dev.yml 已于 ZK-ENV-001 同步为新地址 |
| ZOOKEEPER_HOME=/opt/zookeeper/apache-zookeeper-3.5.6-bin | 磁盘残留目录 | 本地CLI工具v3.5.6，非目标版本3.4.14，待替换 |

### 3.3 四概念分离

以下四个概念独立记录，不得混淆：

| 概念 | 事实 | 状态 |
|---|---|---|
| **A. 服务端目标版本** | 生产环境: 3.4.14; 开发环境: 3.4.14 | 用户于2026-08-10确认 |
| **B. Maven ZK客户端依赖** | pom.xml: 3.4.14（已提交，与目标版本一致） | 与服务端 3.4.14 版本匹配；运行时兼容性见 D |
| **C. Curator版本** | pom.xml: 2.13.0（已提交，与 ZK 3.4.14 关联） | 与ZK版本关联，运行时兼容性待验证（见 D） |
| **D. 运行时兼容性** | CLI层已验证；Java/Curator层未验证 | CLI 3.4.14→server 3.4.14: TCP可达，会话建立成功，/bsoft-cdc/clients 读取成功 (ZK-ENV-001)。Java客户端/Curator 2.13.0 依赖与 ZK 3.4.14 服务端的兼容性仍待应用层独立验证 |

### 3.4 连接信息

| 项目 | 值 | 说明 |
|---|---|---|
| 开发环境ZK地址 | **10.19.16.111:2181** | 用户于2026-08-11确认的正式配置；ZK-ENV-001 已验证 TCP 可达、会话建立成功 |
| 根路径 | **/bsoft-cdc** | 用户于2026-08-11确认的正式配置 |
| 监控范围 | /bsoft-cdc/clients | 不读取servers/signals |
| Session超时 | 30000ms | commit ae2b6cf调整为生产友好值 |
| 连接超时 | 15000ms | 同上 |
| 重试策略 | ExponentialBackoffRetry(1000, 3) | ZooKeeperConfig |
| 认证 | 无 | - |

---

## 4. 构建配置

### 4.1 后端

| 项目 | 值 |
|---|---|
| 构建工具 | Maven 3.8.8 |
| Java版本 | 1.8（pom.xml java.version） |
| Spring Boot | 2.7.18 |
| 端口 | 8080 |
| 验证命令 | `mvn clean test` |
| 打包命令 | `mvn clean package` |
| 测试框架 | JUnit 5 + Surefire |
| Jackson | 日期格式 `yyyy-MM-dd HH:mm:ss`，时区 GMT+8，non_null序列化 |
| SpringDoc | `/v3/api-docs`, `/swagger-ui.html` |

### 4.2 前端

| 项目 | 值 |
|---|---|
| 构建工具 | npm 11.13.0 + Vite 5.1 |
| TypeScript | ~5.3.0 |
| 验证命令 | `npm run build`（含 vue-tsc --noEmit 类型检查 + vite build） |
| 测试命令 | `npm test`（vitest run；log-query 等已含组件测试） |
| Dev Server | host 0.0.0.0, port 5173 |
| Proxy | `/api` → `http://127.0.0.1:8080` |
| 路径别名 | `@` → `src/` |

### 4.3 构建产物与部署

前端构建产物（JS/CSS/PNG）复制到 `backend/src/main/resources/static/assets/` 并被Git跟踪（~2.5MB）。Spring Boot serve前端SPA静态资源——此为当前部署方式，非永久架构决定。`dist/` 目录在 `.gitignore` 中。

### 4.4 依赖版本摘要

| 依赖 | 版本 | 来源 |
|---|---|---|
| Spring Boot | 2.7.18 | pom.xml |
| MyBatis-Plus | 3.5.3.1 | pom.xml |
| Oracle JDBC (ojdbc8) | 19.8.0.0 | pom.xml |
| SpringDoc (springdoc-openapi-ui) | 1.7.0 | pom.xml |
| Curator | 2.13.0 | pom.xml（已提交，与 ZK 3.4.14 匹配） |
| ZooKeeper客户端 | 3.4.14 | pom.xml（已提交；排除自 curator-framework 并显式声明） |
| Vue | ^3.4.0 | package.json |
| Vite | ^5.1.0 | package.json |
| Element Plus | ^2.5.0 | package.json |
| ECharts | ^6.1.0 | package.json |
| Pinia | ^2.1.0 | package.json |
| Axios | ^1.6.0 | package.json |

---

## 5. 连接性状态（截至2026-08-11）

| 目标 | 可达性 | 说明 |
|---|---|---|
| Oracle DB (192.168.174.65:1521) | 可达 | SQL*Plus连接正常（BASELINE-001 现场验证） |
| ZK (10.19.16.111:2181) | **可达** | ZK-ENV-001 验证: TCP 2181端口可达，zkCli v3.4.14 会话建立成功，timeout=30000ms，/bsoft-cdc 及 /bsoft-cdc/clients 读取成功，服务端版本 3.4.14 (standalone, 200节点) |
| ZK (192.168.174.51:2181) | 不可达 | **旧配置**，No route to host（BASELINE-001 现场验证） |
| GitHub Remote (git@github-cdc) | 可达 | git fetch成功 |
| npm Registry (npmmirror.com) | 可达 | npm build成功 |

---

## 6. 未完成的环境事项

| 事项 | 说明 | 优先级 |
|---|---|---|
| Curator/ZK依赖兼容性验证 | pom.xml 当前为 Curator 2.13.0 / ZK 3.4.14（已提交），与 ZK 3.4.14 服务端的 Java/Curator 层兼容性仍待应用层独立验证；CLI只读连接成功不等于项目Curator依赖兼容 | **高** |
