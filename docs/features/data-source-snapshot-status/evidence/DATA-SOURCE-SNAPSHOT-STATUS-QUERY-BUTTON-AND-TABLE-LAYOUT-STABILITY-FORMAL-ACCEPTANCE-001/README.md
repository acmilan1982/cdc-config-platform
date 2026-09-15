# 证据索引

任务：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001`
基准提交：`682650058b85b99b13a343373d6887bf0784ec1f`
验收范围：仅 `DSS-AC-114~118`（5 条）
报告：`../reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001.md`

## 目录

| 路径 | 内容 |
|---|---|
| `browser/` | 四档视口原始采集结果、判定输出、负向控制、截图、汇总 |
| `browser/harness/` | 采集器、共享严格判定器、负向自测、CDP 客户端、环境探针 |
| `browser/rects/` | 每个「视口 × 状态」的原始矩形 JSON（24 份） |
| `browser/screenshots/` | 每个「视口 × 状态」的截图（20 张） |
| `tests/` | 定向、Feature、全量测试与生产构建的有界脱敏摘录 |
| `http/` | 接口与页面 HTTP、请求方法统计 |
| `database/` | 数据库只读摘要与写 SQL=0；ZooKeeper / Kafka 边界 |
| `git/` | 基准、冻结区、范围、diff-check、凭据扫描、worktree 快照 |
| `services/` | 端口来源、PID/cwd、服务版本证明 |

## 关键结论

| 字段 | 值 |
|---|---|
| `strict_geometry_assertion_status` | `PASS` |
| `strict_harness_real_run_exit_code` | `0` |
| `strict_harness_negative_control_exit_code` | `1` |
| `strict_assertion_pass_count` | `398` |
| `strict_assertion_failure_count` | `0` |
| `DSS-AC-114` ~ `DSS-AC-118` | 全部 `PASS` |
| `adjustment_acceptance_pass_count` | `5` |
| `formal_acceptance_pass_count` | `118` |

## 说明

- 原始日志（`*.log`）由 `.gitignore` 排除，未提交，也未修改 `.gitignore`；被排除的日志以有界脱敏 `.txt` / `.md` 摘录收录于 `tests/`。
- 浏览器 profile、缓存、`node_modules`、`dist/` 均未提交。
- 未包含任何凭据、完整连接串或数据库账号信息。
