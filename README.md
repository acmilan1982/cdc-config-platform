# CDC 配置管理平台

## 项目简介

CDC 配置管理平台是一个 **Oracle CDC 配置维护和运行监控 Web 平台**，面向 CDC 运维和开发人员，提供 CDC 配置的可视化管理和运行状态的全景监控。本平台管理 CDC 配置并监控运行状态，不执行 CDC 同步逻辑，不替代现有 CDC 同步程序。

## 工程状态

前后端工程均已存在（当前详细状态见 [docs/baseline/PROJECT_STATUS.md](docs/baseline/PROJECT_STATUS.md)）：

- `backend/` — Spring Boot 2.7.18 后端（Maven，JDK 8，Oracle 19c + MyBatis-Plus）
- `frontend/` — Vue 3 + Vite 5 前端（TypeScript、Element Plus、ECharts、Pinia、Axios）

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | JDK 8、Spring Boot 2.7.18、Maven、Oracle 19c、MyBatis-Plus、SpringDoc、Curator / ZooKeeper |
| 前端 | Vue 3、Vite 5、TypeScript、Element Plus、ECharts、Pinia、Axios、Vue Router |

## 构建与启动

```bash
# 加载项目环境
source /agent/cdc-config-platform/agent-env.sh

# 后端构建与测试
cd /agent/cdc-config-platform/backend
mvn clean test
mvn clean package

# 前端构建与测试
cd /agent/cdc-config-platform/frontend
npm run build
npm test
```

- 开发模式：前端 Vite Dev Server（`0.0.0.0:5173`），`/api` 代理到后端 `127.0.0.1:8080`。
- 部署形态：Spring Boot 内嵌 Tomcat serve 前端 SPA 静态资源（`backend/src/main/resources/static/`），JAR 包包含全部前端资源。

## 文档入口

- 项目级基线：`docs/baseline/README.md`（六份正式基线：PROJECT / ENVIRONMENT / ARCHITECTURE / DEVELOPMENT_RULES / PROJECT_STATUS / DOMAIN_GLOSSARY）
- 数据库基线：`docs/database/README.md`（已批准：14 张表、15 条逻辑关系）
- Feature 基线：`docs/features/README.md`（Feature 总索引）
- 通用流程：`docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`
- 当前详细状态：`docs/baseline/PROJECT_STATUS.md`

## 开发规范

Agent 开发规范见根目录 [CLAUDE.md](CLAUDE.md)；开发规则基线见 `docs/baseline/DEVELOPMENT_RULES.md`。
