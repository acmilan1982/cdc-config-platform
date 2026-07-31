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
- **模块功能基线提交**：`77be858f3df98753559f51dfd89c227d70d72127`
- **提交说明**：`feat(job-failure-monitoring): finalize monitoring module`
- **远程状态**：待推送（Phase 2 交接文档提交后统一推送）

---

## 4. 工作区状态

**模块代码已全部提交**（`77be858`），包含以下范围：

- TASK 048 详情页 UI 重构（FaultProcessOverview, PhysicalJobChain, RestartCards, FailureEventList）
- TASK 048 详情页修正 002（FaultHistory 恢复、ID 截断、排序修正）
- TASK 048 Overview 修正 003（卡片结构、7 列表格、"故障"文案、latestRecoveryTime）
- TASK 048 Overview 修正 004（数据源 ID 下拉框）
- TASK 049 文档收口（README, BASELINE, handoff, CURRENT_HANDOFF）

**剩余未提交文件**（与本模块无关，保留不提交）：
- `.claude/settings.local.json` — 本地 IDE 配置
- `package-lock.json` — 无对应 package.json 变更，排除
- `docs/agent-prompts/` — 历史任务提示词（保留作为追溯资料）
- `docs/database/040-*.md` 等 — 历史分析文档
- `docs/pages/zk-*`、`docs/zookeeper/` — 其他模块文档

---

## 5. 已完成任务范围

| 任务 | 说明 | 状态 |
|------|------|------|
| TASK 046 | 后端 Phase 1：Entity、Mapper、VO、Service、Controller、测试 | 已完成并提交 |
| TASK 047 | 前端开发：Overview + 详情页 + 所有组件 + 路由菜单 | 已完成并提交 |
| TASK 047 修正 | Overview 页面修正（002） | 已完成并提交 |
| TASK 048 | 详情页 UI 重构 | 已完成并提交 |
| TASK 048 修正 002 | 详情页 4 项修正 + FaultHistory 恢复 | 已完成并提交 |
| TASK 048 修正 003 | Overview 修正：卡片结构、7 列字段、"故障"文案、恢复时间 | 已完成并提交 |
| TASK 048 修正 004 | 数据源 ID 下拉框 | 已完成并提交 |
| TASK 049 | 文档收口（README, BASELINE, handoff, CURRENT_HANDOFF） | 已完成并提交 |
| TASK 050 | 最终收尾：构建验证、一致性核查、提交与推送 | 执行中 |

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

### TASK 050 最终验证（2026-07-31）

### 前端
- **构建**：`npm run build`（vue-tsc + vite build）— **SUCCESS**
- **Node**：v18.20.8
- **npm**：10.8.2
- **运行**：Vite dev server，`http://192.168.174.70:5173`，PID 2504
- **代理**：`/api` → `http://127.0.0.1:8080`

### 后端
- **构建**：`mvn clean package -DskipTests` — **SUCCESS**
- **测试**：`mvn test` — 179/180 pass，1 预存失败（OracleDateMappingTest，非本模块）
- **Java**：1.8.0_312
- **Maven**：3.6.3
- **运行**：Spring Boot，`http://127.0.0.1:8080`

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

## 11. 当前状态

- TASK 050 Phase 1 已完成：模块功能基线提交 `77be858`
- TASK 050 Phase 2 进行中：交接文档更新后提交并推送
- 模块当前版本正式完成，功能冻结
- 下一会话应从 `CURRENT_HANDOFF.md` 开始读取

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

## 13. 最终文档产物

| 文件 | 类型 | 说明 |
|------|------|------|
| `docs/modules/job-failure-monitoring/README.md` | 新建 | 模块文档导航入口 |
| `docs/modules/job-failure-monitoring/JOB_FAILURE_MONITORING_BASELINE.md` | 新建 | 模块功能基线（唯一事实来源） |
| `docs/modules/job-failure-monitoring/handoffs/2026-07-31-job-failure-monitoring-handoff.md` | 新建 | 日期交接文档（本文件） |
| `docs/modules/job-failure-monitoring/handoffs/CURRENT_HANDOFF.md` | 新建 | 交接入口（稳定指针） |

### TASK 050 提交

| Phase | Commit ID | 说明 |
|-------|-----------|------|
| Phase 1 | `77be858f3df98753559f51dfd89c227d70d72127` | 模块功能基线：代码 + 文档 |
| Phase 2 | （待提交） | 交接文档最终更新 |
