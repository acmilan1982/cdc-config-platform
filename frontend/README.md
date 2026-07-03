# CDC配置管理平台 - 前端工程

## 技术栈

- Node.js 24.x / npm 11.x
- Vue 3.4 + TypeScript
- Vite 5
- Element Plus 2.5
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

## 接口地址

| 页面 | 地址 |
|------|------|
| 首页 | http://localhost:5173/ |

## 当前状态

本项目当前仅为 Vue 3 前端骨架，已实现：

- Element Plus 集成（中文环境）
- Vue Router 路由配置
- Pinia 状态管理（app store）
- Axios HTTP 封装
- 全局样式
- 后端健康检查联通
- 首次可视化首页

尚未实现具体业务模块。
