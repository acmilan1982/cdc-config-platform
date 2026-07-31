# 故障监控模块 — 会话交接

> 上一会话结束时的研发现场记录，新会话应从这里接手。

---

## 1. 交接日期

2026-07-31

---

## 2. 当前模块

`job-failure-monitoring`（故障监控）

---

## 3. 当前分支与提交

- **分支**：`develop`
- **最新 commit**：`420966cd1bae3b36d6eb8629ea2b9a7429062ba7`
- **远程状态**：已同步（`Already up to date.`）

---

## 4. 工作区状态

工作区存在**未提交修改**，来源于 TASK 048 系列（详情页 UI 重构 + Overview 修正）：

**后端未提交**（3 个文件）：
- `backend/src/main/java/.../vo/JobFailureSummaryVO.java` — 新增 `latestRecoveryTime` 字段
- `backend/src/main/java/.../service/impl/JobFailureServiceImpl.java` — 从 STABLE_CHECK_PASSED 日志提取恢复时间
- `backend/src/main/java/.../query/HistoryQuery.java` — 添加 `@DateTimeFormat` 修复时间参数解析

**前端未提交**（7 个文件）：
- `frontend/src/types/jobFailure.ts` — 新增 `latestRecoveryTime` 字段
- `frontend/src/views/monitor/job-failure/index.vue` — Overview 页面改写（TASK 048 Correction 003）
- `frontend/src/views/monitor/job-failure/detail.vue` — 详情页调整（TASK 048 Correction 002）
- `frontend/src/views/monitor/job-failure/components/FaultProcessOverview.vue`
- `frontend/src/views/monitor/job-failure/components/PhysicalJobChain.vue`
- `frontend/src/views/monitor/job-failure/components/FailureEventList.vue`
- `frontend/src/views/monitor/job-failure/components/FaultHistory.vue`

**前端新增未跟踪**（1 个文件）：
- `frontend/src/views/monitor/job-failure/components/RestartCards.vue`

**本次文档收口新增**（6 个文件）：
- `docs/modules/job-failure-monitoring/README.md`
- `docs/modules/job-failure-monitoring/JOB_FAILURE_MONITORING_BASELINE.md`
- `docs/modules/job-failure-monitoring/handoffs/2026-07-31-job-failure-monitoring-handoff.md`（本文件）
- `docs/modules/job-failure-monitoring/handoffs/CURRENT_HANDOFF.md`

其他 untracked 文件（`docs/agent-prompts/`、`docs/database/`、`docs/pages/`、`docs/zookeeper/`、`package-lock.json`）不属于本模块更改。

另有 `.claude/settings.local.json` 修改（与本模块无关）。

---

## 5. 已完成任务范围

| 任务 | 说明 | 状态 |
|------|------|------|
| TASK 046 | 后端 Phase 1：Entity、Mapper、VO、Service、Controller、测试 | 已完成并提交 |
| TASK 047 | 前端开发：Overview + 详情页 + 所有组件 + 路由菜单 | 已完成并提交 |
| TASK 047 修正 | Overview 页面修正（002） | 已完成并提交 |
| TASK 048 | 详情页 UI 重构 | 已完成（未提交） |
| TASK 048 修正 002 | 详情页 4 项修正 + FaultHistory 恢复 | 已完成（未提交） |
| TASK 048 修正 003 | Overview 修正：卡片结构、7 列字段、"故障"文案、恢复时间 | 已完成（未提交） |
| TASK 049 | 文档收口（本任务） | 执行中 |

---

## 6. 已通过验收的状态

### Overview 页面
- [x] 客户端卡片：`CLIENT_ID | Job 总数 N | 正常 N | 异常 N`
- [x] 7 列表格：数据源 ID、数据源名称、Job 当前状态、最近故障时间、最近恢复时间、故障期间恢复尝试、操作
- [x] 默认全部展开，刷新保持展开状态
- [x] 查询/重置/自动刷新/手动刷新均保留
- [x] 面向用户文案统一使用"故障"
- [x] 详情入口准确定位最近故障

### 详情页面
- [x] 故障概览（含状态为"已恢复"）
- [x] 物理 Job 链：单行横向滚动，红/绿标记
- [x] 事件列表：ID 截断（≤16 完整，>16 前6…后8），无复制按钮
- [x] 恢复尝试卡片（RestartCards）：RESTART_STARTED 为界分组，升序排列
- [x] 故障历史：时间范围下拉（1天/1周/1月），不分页，当前行高亮

---

## 7. 构建与运行状态

### 前端
- **构建**：`npm run build`（vue-tsc + vite build）— **SUCCESS**（2026-07-31）
- **运行**：Vite dev server，`http://192.168.174.70:5173`，PID 2504
- **代理**：`/api` → `http://127.0.0.1:8080`

### 后端
- **构建**：`mvn clean package -DskipTests` — **SUCCESS**（2026-07-31）
- **测试**：`mvn test` — 179/180 pass，1 预存失败（OracleDateMappingTest，非本模块）
- **运行**：Spring Boot，`http://127.0.0.1:8080`，PID 需要现场确认

### 访问方式
- Overview：`http://192.168.174.70:5173/monitor/job-failure`
- 详情页：`http://192.168.174.70:5173/monitor/job-failure/detail?clientId=hosp-006&dataSourceId=my-19c`

---

## 8. API 与真实数据

### 已验证接口

- `GET /api/job-failure/summary` — 返回 2 条记录（hosp-006/my-19c、hosp-012/112-source-19c），均含 `latestRecoveryTime`
- `GET /api/job-failure/latest/{clientId}/{dataSourceId}` — 返回完整故障过程详情
- `GET /api/job-failure/history/{clientId}/{dataSourceId}` — 分页历史查询（需 startTime/endTime）
- `GET /api/job-failure/process/{faultRootId}` — 指定故障过程详情
- `GET /api/job-failure/clob/{faultRootId}/{clobField}/{recordId}` — CLOB 内容

### 当前数据

| clientId | dataSourceId | 状态 | 故障时间 | 恢复时间 | 恢复尝试 |
|----------|-------------|------|---------|---------|---------|
| hosp-006 | my-19c | 正常运行 | 2026-07-27T19:17:24 | 2026-07-27T19:23:44 | 1 次 |
| hosp-012 | 112-source-19c | 正常运行 | 2026-07-30T21:14:09 | 2026-07-30T21:29:09 | 19 次 |

---

## 9. 当前功能冻结范围

- 不再调整 Overview 页面结构和字段
- 不再调整详情页布局和组件
- 不再修改后端 API 路径和返回结构
- 不再修改数据库表结构
- 不读取 ZooKeeper 或 RUN_STATE
- 不实现写操作

---

## 10. 已知但暂不处理

- `OracleDateMappingTest` 1 个测试失败（预存，日期敏感，与故障监控无关）
- 开发库仅 2 个客户端有故障数据，缺少"恢复中"、无故障等边界场景
- 两张表仅有主键索引，未来数据增长需补充业务索引
- 前端 `HandleTimeline.vue` 和 `JobFailureSummaryTable.vue` 保留在代码中但已不被使用

---

## 11. 下一步建议

1. 人工验收本次文档收口产物
2. 确认 Overview 和详情页 UI 验收通过
3. 执行 `git add` + `git commit` + `git push`（将所有 TASK 048 + TASK 049 变更一次性提交）

---

## 12. 新会话必须阅读的文件及顺序

```
1. CLAUDE.md
2. docs/modules/job-failure-monitoring/handoffs/CURRENT_HANDOFF.md
3. 本文件（最新日期交接文档）
4. docs/modules/job-failure-monitoring/JOB_FAILURE_MONITORING_BASELINE.md
5. docs/modules/job-failure-monitoring/README.md
6. 仅按任务需要读取 README 中列出的现行专题文档
7. 只有追溯原因时才读取历史提示词和执行报告
```

---

## 13. 本次文档收口产物

| 文件 | 类型 |
|------|------|
| `docs/modules/job-failure-monitoring/README.md` | 新建 |
| `docs/modules/job-failure-monitoring/JOB_FAILURE_MONITORING_BASELINE.md` | 新建 |
| `docs/modules/job-failure-monitoring/handoffs/2026-07-31-job-failure-monitoring-handoff.md` | 新建 |
| `docs/modules/job-failure-monitoring/handoffs/CURRENT_HANDOFF.md` | 新建 |
