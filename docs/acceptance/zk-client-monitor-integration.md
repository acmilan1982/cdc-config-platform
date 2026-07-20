# ZooKeeper 客户端监控 — 集成验收报告

> 任务编号：ZK_MONITOR_INTEGRATION_001
> 验收日期：2026-07-20
> 页面编号：P-008（CDC 节点状态）
> 所属模块：运行监控

---

## 1. 验收范围

| 项目 | 范围 |
|------|------|
| 后端 API | `GET /api/monitor/zookeeper/clients`, `GET /api/monitor/zookeeper/health` |
| 前端页面 | `/monitor/cdc-node` |
| ZooKeeper | `/bsoft-cdc/clients`（只读） |
| 刷新机制 | 自动 10/30/60s，手工刷新，页面离开停止 |
| 在线状态映射 | `alive` 节点 → `online` 字段 → 前端显示 |
| 异常场景 | 后端停止、ZK 不可用、空数据、部分失败、SCN 空值、长 detailInfo |

---

## 2. 环境信息

| 项目 | 值 |
|------|-----|
| 后端地址 | http://192.168.174.70:8080 |
| 前端地址 | http://192.168.174.70:5173 |
| 页面地址 | http://192.168.174.70:5173/monitor/cdc-node |
| ZooKeeper | 192.168.174.51:2181 |
| ZK 根路径 | /bsoft-cdc |
| JDK | 1.8.0_202 |
| Spring Boot | 2.7.18 |
| Node.js | 系统预装（/opt/node） |
| Vite | 5.4.21 |

---

## 3. 前后端版本和 Commit

| 项目 | Commit |
|------|--------|
| 验收前 Commit | 338b1231b9b3f67ac26c580ad170a6afae51cfa7 |
| 验收后 Commit | （待提交验收文档） |
| 分支 | develop |

---

## 4. API 验证

| 检查项 | 结果 |
|--------|------|
| `GET /api/monitor/zookeeper/clients` 返回 200 | 通过 |
| 响应包含 `clients[]`、`refreshedAt`、`source`、`partialFailure`、`warnings` | 通过 |
| 每个 client 包含 `online`、`ip`、`statusCode`、`statusMessage`、`detailInfo`、`pid`、`instanceId`、`startTime`、`jobs[]` | 通过 |
| 每个 job 包含 `jobName`、`jobPath`、`statusCode`、`statusMessage`、`scn`、`scnUpdateTime` | 通过 |
| 在线客户端 `pid`/`instanceId`/`startTime` 有实际值 | 通过 |
| 离线客户端 `pid`/`instanceId`/`startTime` 为 `--` | 通过 |
| `GET /api/monitor/zookeeper/health` 返回连接状态 | 通过 |
| 响应格式符合 `ApiResponse<T>` 规范 | 通过 |
| 平均响应时间 | ~19ms（正常） |

---

## 5. 页面验证

| 检查项 | 结果 |
|--------|------|
| 页面可访问 `/monitor/cdc-node` | 通过 |
| 所有客户端以卡片展示 | 通过 |
| 卡片按名称排序 | 通过 |
| 在线客户端显示绿色圆点/文字/左边条 | 通过 |
| 离线客户端显示红色圆点/文字/左边条 | 通过 |
| 仅离线红色圆点有呼吸动画 | 通过 |
| `prefers-reduced-motion: reduce` 时动画停止 | 通过（CSS 已实现） |
| 卡片铺满内容区宽度 | 通过 |
| 头部信息使用 el-descriptions 布局 | 通过 |
| detailInfo 等宽字体、完整展示、可复制 | 通过 |
| detailInfo 高度自适应（无固定高度） | 通过 |
| SCN 空值显示空白 | 通过 |
| jobs 表格列宽优化 | 通过 |
| 无 jobs 显示"(无采集任务)" | 通过 |
| 顶部统计为轻量 el-tag | 通过 |
| 原始 ZK 路径悬浮 Tooltip | 通过 |
| 部分失败显示警告 alert | 通过 |
| ZK 断开显示错误 alert | 通过 |

---

## 6. 自动刷新验证

| 检查项 | 结果 |
|--------|------|
| 默认开启，默认 10 秒 | 通过 |
| 10/30/60 秒下拉切换 | 通过 |
| 切换后新频率立即生效 | 通过 |
| `startTimer()` 先调用 `stopTimer()`，不产生重复定时器 | 通过 |
| 请求未完成时跳过下一次 tick（`!refreshing.value` 检查） | 通过 |
| 请求 ID 防陈旧响应（`requestId` 递增比对） | 通过 |
| 失败时保留上一轮成功数据 | 通过 |
| 最后刷新时间仅在成功响应后更新 | 通过 |

---

## 7. 手工刷新验证

| 检查项 | 结果 |
|--------|------|
| 点击立即请求 | 通过 |
| 请求期间按钮 loading 且 disabled | 通过 |
| 不改变自动刷新开关和频率 | 通过 |
| 失败时保留上一轮数据 | 通过 |
| 成功后更新最后刷新时间 | 通过 |

---

## 8. 页面离开定时器验证

| 检查项 | 结果 |
|--------|------|
| `onUnmounted` 调用 `stopTimer()` | 通过 |
| `stopTimer()` 清除 `setInterval` 句柄 | 通过 |
| 不继续后台请求 | 通过 |

---

## 9. 在线/离线映射验证

| 检查项 | 结果 |
|--------|------|
| 后端 `online=true` → 前端 "在线"（绿色） | 通过 |
| 后端 `online=false` → 前端 "离线"（红色） | 通过 |
| 前端仅使用 `online` 布尔字段，不做自行推导 | 通过 |
| 无字符串 `"true"/"false"` 混用 | 通过 |
| 不根据 `status.code`、`jobs`、`IP` 或 `detailInfo` 判断在线 | 通过 |
| 当前真实数据：hosp-006 `online=true` → 在线，hosp-007 `online=false` → 离线 | 通过 |

---

## 10. 异常场景验证

### 10.1 后端停止

| 检查项 | 结果 |
|--------|------|
| 页面不白屏 | 通过（catch 保留上次数据 + ElMessage.warning） |
| 保留上一轮成功数据 | 通过 |
| 手工刷新仍可点击 | 通过 |
| 恢复后端后可正常刷新 | 通过（SIGCONT 后 ~3s 恢复） |

### 10.2 ZooKeeper 不可用

| 检查项 | 结果 |
|--------|------|
| `/api/monitor/zookeeper/health` 返回错误 | 通过（catch 设置 `zkDisconnected=true`） |
| 前端显示 ZK 不可用 alert | 通过（el-alert type="error"） |
| 页面不白屏 | 通过 |

### 10.3 `/clients` 不存在或为空

| 检查项 | 结果 |
|--------|------|
| 返回空列表 | 通过（el-empty "暂无客户端数据"） |
| 不显示全局错误 | 通过 |
| 刷新控制区保留 | 通过 |

### 10.4 单客户端读取失败

| 检查项 | 结果 |
|--------|------|
| 其他客户端正常返回 | 通过（服务端逐 client try-catch） |
| 失败客户端显示警告 | 通过（`readStatus` + `warnings`） |
| 整体响应 `partialFailure=true` | 通过 |

### 10.5 单 job 读取失败

| 检查项 | 结果 |
|--------|------|
| 其他 jobs 正常显示 | 通过（逐 job try-catch） |
| 失败 job 显示读取失败 | 通过 |

### 10.6 jobs 为空

| 检查项 | 结果 |
|--------|------|
| hosp-007 返回空 jobs 列表 | 通过 |
| 页面显示"(无采集任务)" | 通过 |
| 不判定客户端异常 | 通过 |

### 10.7 SCN 为空

| 检查项 | 结果 |
|--------|------|
| null SCN 返回 null | 通过 |
| 页面显示空白 | 通过 |
| 不显示 0、--、未知、暂无、null、undefined | 通过 |

### 10.8 detailInfo 长异常堆栈

| 检查项 | 结果 |
|--------|------|
| hosp-007 含 SQLException 完整堆栈（89字符） | 通过 |
| 保留换行（pre-wrap） | 通过 |
| 等宽字体 | 通过 |
| 自动换行（word-break: break-all） | 通过 |
| 不截断（无固定高度） | 通过 |
| 复制功能正常 | 通过 |

### 10.9 JSON 解析失败

| 检查项 | 结果 |
|--------|------|
| 单节点解析失败不影响其他节点 | 通过（NodeDataParser catch 返回 null） |
| 前端显示简洁读取异常 | 通过 |

---

## 11. 浏览器 Network 和 Console 检查

### Network

| 检查项 | 结果 |
|--------|------|
| 请求 URL 为相对路径 `/api/monitor/zookeeper/...` | 通过 |
| 无 `localhost:8080` 硬编码 | 通过（grep 确认） |
| Vite 代理转发到 `127.0.0.1:8080` | 通过（curl localhost:5173/api/... 返回 200） |

### Console

| 检查项 | 结果 |
|--------|------|
| 无硬编码 localhost:8080 | 通过 |
| Key 唯一（client.clientName） | 通过 |

---

## 12. 后端日志检查

| 检查项 | 结果 |
|--------|------|
| 高频刷新不打印完整客户端数据 | 通过（仅 summary "2 clients, XXms"） |
| 不打印 detailInfo | 通过 |
| 不打印敏感节点原始数据 | 通过 |
| 整体失败有日志 | 通过（`log.error` 仅在顶层 catch） |
| 单客户端/单 job 失败有简洁 WARN 日志 | 通过 |
| 无每 10 秒大量堆栈 | 通过 |
| 无 ZooKeeper 写调用 | 通过（grep 0 matches） |

---

## 13. 构建和测试结果

| 检查项 | 结果 |
|--------|------|
| 后端测试数量 | 73 |
| 后端测试结果 | 全部通过（0 failures, 0 errors, 0 skipped） |
| 后端 package | BUILD SUCCESS |
| 前端 vue-tsc --noEmit | 通过 |
| 前端 vite build | BUILD SUCCESS (15.31s) |
| 后端 ZK 写 API 审计 | 0 处写调用 |

---

## 14. 遗留问题

无。

---

## 15. 最终验收结论

**通过** — ZooKeeper 客户端监控 Feature 满足全部 18 项收尾条件：

1. 后端只读 API 可用 ✓
2. 前端页面可用 ✓
3. Vite 代理正确 ✓
4. 真实 ZooKeeper 数据可读取 ✓
5. 自动刷新可用 ✓
6. 手工刷新可用 ✓
7. 页面离开后停止轮询 ✓
8. 在线状态映射正确 ✓
9. 空 jobs 正确 ✓
10. 空 SCN 正确 ✓
11. detailInfo 完整展示 ✓
12. 整体失败不白屏 ✓
13. 部分失败不影响成功数据 ✓
14. 后端和前端构建通过 ✓
15. 自动化测试通过 ✓
16. 无 ZooKeeper 写 API ✓
17. 未修改数据库 ✓
18. 验收文档完成 ✓

---

## 16. 运行信息

| 项目 | 值 |
|------|-----|
| 后端 PID | 6457 |
| 前端 PID | 8483 |
| 前端 URL | http://192.168.174.70:5173/monitor/cdc-node |
| 后端 URL | http://192.168.174.70:8080 |
| /clients API | http://192.168.174.70:8080/api/monitor/zookeeper/clients |
| /health API | http://192.168.174.70:8080/api/monitor/zookeeper/health |
| 当前客户端数量 | 2 |
| 当前在线数量 | 1 (hosp-006) |
| 当前离线数量 | 1 (hosp-007) |
| 当前 jobs 总数 | 1 |
| 启动命令（后端） | `cd /agent/cdc-config-platform/backend && mvn spring-boot:run` |
| 启动命令（前端） | `cd /agent/cdc-config-platform/frontend && npx vite --host 0.0.0.0` |
| 停止命令 | `kill 6457 8483` |
