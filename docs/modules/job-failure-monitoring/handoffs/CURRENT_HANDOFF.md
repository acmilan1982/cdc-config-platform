# 当前交接入口

> 稳定入口，始终指向最新交接文档。

---

## 最新交接

- **文档**：[2026-07-31-job-failure-monitoring-handoff.md](2026-07-31-job-failure-monitoring-handoff.md)
- **日期**：2026-07-31
- **分支**：`develop`
- **模块功能基线 Commit**：`77be858f3df98753559f51dfd89c227d70d72127`
- **模块状态**：当前版本正式完成

---

## 功能基线

**[JOB_FAILURE_MONITORING_BASELINE.md](../JOB_FAILURE_MONITORING_BASELINE.md)** — 模块当前功能的唯一事实来源。

---

## 新会话推荐阅读顺序

```
1. CLAUDE.md
2. docs/modules/job-failure-monitoring/handoffs/CURRENT_HANDOFF.md（本文件）
3. 最新日期交接文档
4. docs/modules/job-failure-monitoring/JOB_FAILURE_MONITORING_BASELINE.md
5. docs/modules/job-failure-monitoring/README.md
6. 仅按任务需要读取 README 中列出的现行专题文档
7. 只有追溯原因时才读取历史提示词和执行报告
```

---

## 重要提示

- **不要从旧任务提示词反推当前需求** — 以功能基线和当前代码为准
- **历史文档（docs/agent-prompts/）仅用于追溯**，不作为当前需求依据
- **早期设计文档（docs/pages/job-failure-backend-api-spec.md 等）**的 API 路径和数据结构与当前实现不一致，已由基线取代
- 模块当前为只读监控，不提供写操作、不读取 ZooKeeper、不读取 RUN_STATE
