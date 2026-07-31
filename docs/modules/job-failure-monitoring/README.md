# Job Failure Monitoring（故障监控）

CDC 配置管理平台的 Job 故障与恢复只读监控模块。

---

## 文档导航

### 现行功能基线

- **[JOB_FAILURE_MONITORING_BASELINE.md](JOB_FAILURE_MONITORING_BASELINE.md)** — 模块当前功能的唯一事实来源。包含页面、API、数据模型、算法规则、代码位置和验证状态。

### 会话交接

- **[handoffs/CURRENT_HANDOFF.md](handoffs/CURRENT_HANDOFF.md)** — 稳定交接入口，指向最新日期交接文档
- **[handoffs/2026-07-31-job-failure-monitoring-handoff.md](handoffs/2026-07-31-job-failure-monitoring-handoff.md)** — 本次会话交接文档

### 现行专题文档

- [数据模型与表结构分析](../../database/job-failure-table-data-analysis.md) — DDL、字段字典、索引、数据质量
- [故障链算法设计](../../database/job-failure-chain-algorithm-design.md) — 故障过程归并、Job 链、异常检测算法（代码实现基本匹配）
- [查询与索引设计建议](../../database/job-failure-query-and-index-design.md) — 查询计划和索引推荐

### 历史文档

以下文档仅用于追溯开发过程，**不作为当前需求依据**：

**设计阶段提示词**（按编号）:
- `docs/agent-prompts/033-job-failure-record-analysis-prompt.md`
- `docs/agent-prompts/040-job-failure-data-association-and-closure-analysis-prompt.md`
- `docs/agent-prompts/041-job-runtime-and-failure-recovery-page-api-spec-prompt.md`
- `docs/agent-prompts/042-job-runtime-failure-recovery-ui-mockup-prompt.md`
- `docs/agent-prompts/044-job-runtime-failure-recovery-ui-final-polish-prompt.md`
- `docs/agent-prompts/045-job-failure-data-analysis-and-backend-design-prompt.md`

**开发阶段提示词**（按编号）:
- `docs/agent-prompts/TASK_046_JOB_FAILURE_RESTART_BACKEND_PHASE1.md`
- `docs/agent-prompts/TASK_047_JOB_FAILURE_RESTART_FRONTEND.md`
- `docs/agent-prompts/TASK_047_JOB_FAILURE_OVERVIEW_CORRECTION.md`
- `docs/agent-prompts/TASK_047_JOB_FAILURE_OVERVIEW_UI_CORRECTION_002.md`
- `docs/agent-prompts/TASK_047_JOB_FAILURE_FINAL_VERIFY_COMMIT_PUSH.md`
- `docs/agent-prompts/TASK_048_JOB_FAILURE_DETAIL_UI_RESTRUCTURE.md`
- `docs/agent-prompts/TASK_048_JOB_FAILURE_DETAIL_UI_CORRECTION_002.md`
- `docs/agent-prompts/TASK_048_JOB_FAILURE_OVERVIEW_UI_CORRECTION_003.md`
- `docs/agent-prompts/TASK_049_JOB_FAILURE_MONITORING_DOCUMENTATION_CLOSURE_001.md`

**早期设计文档**（已被当前实现取代）:
- `docs/pages/job-failure-backend-api-spec.md` — TASK 045 设计阶段 API 规格，路径和数据结构与实际实现不一致
- `docs/pages/job-runtime-failure-recovery-spec.md` — TASK 041 页面规格，早期设计
- `docs/pages/job-runtime-failure-recovery-ui-review.md` — UI 评审修订记录

**分析过程文档**:
- `docs/database/040-job-failure-data-association-and-closure-analysis.md`
- `docs/database/040-job-failure-data-association-and-closure-analysis-answers.md`
- `docs/database/job-failure-analysis-open-questions.md`
- `docs/database/job-failure-record-analysis.md`

---

## 文档状态说明

```
当前功能以 JOB_FAILURE_MONITORING_BASELINE.md 为准。
历史提示词、执行报告和早期设计仅用于追溯，不作为当前需求依据。
```

当专题文档与功能基线冲突时，以功能基线和当前代码为准。

---

## 关键快捷链接

- 前端 Overview 页面：`/monitor/job-failure`
- 前端详情页面：`/monitor/job-failure/detail?clientId=<id>&dataSourceId=<id>`
- 后端 API Base：`/api/job-failure`
- 菜单位置：运行监控 → 故障监控
