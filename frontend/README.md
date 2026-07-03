# CDC配置管理平台 - 前端工程

## 技术栈

- Node.js 24.x / npm 11.x
- Vue 3.4 + TypeScript
- Vite 5
- Element Plus 2.5 + @element-plus/icons-vue
- Vue Router 4
- Pinia 2
- Axios 1.6

## 安装

```bash
cd frontend
npm install
```

## 开发启动

```bash
npm run dev
```

开发服务器监听 `0.0.0.0:5173`，可从宿主机浏览器访问：

```
http://192.168.174.70:5173
```

## 构建

```bash
npm run build
```

产出目录：`dist/`

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://localhost:8080` |

开发环境变量定义在 `.env.development`。

## Vite 代理

开发环境下 `/api` 请求自动代理到 `http://localhost:8080`。

## 主布局

- 深色左侧导航栏（支持折叠）
- 顶部栏（折叠按钮 + 面包屑）
- 自适应全宽主内容区
- 浅灰背景 + 白色内容卡片
- 企业管理系统风格

## 菜单结构

```
配置管理
├── 数据源管理       → /config/data-source
├── 客户端配置       → /config/client
├── 数据订阅         → /config/subscribe
└── 服务端配置       → /config/server

运行监控
├── CDC 节点状态     → /monitor/cdc-node
├── 数据源运行状态   → /monitor/data-source-state
├── Topic 偏移量     → /monitor/topic-offset
└── 日志查询         → /monitor/log-query
```

默认进入 `/config/data-source`（数据源管理）。

## 当前状态

本项目已实现正式主布局和菜单导航，所有 8 个业务菜单页面均为占位页面，展示页面元信息（性质、结构、涉及数据源）。

尚未实现具体业务功能（表格、查询、CRUD 等）。
