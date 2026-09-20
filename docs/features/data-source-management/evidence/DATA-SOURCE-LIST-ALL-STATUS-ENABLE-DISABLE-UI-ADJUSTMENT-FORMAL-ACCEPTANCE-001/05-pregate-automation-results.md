# 正式验收 001 —— §6 验收前自动化门禁结果

> 任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> 执行时点：课程库写入之前（经项目负责人确认，`§6` 门禁可在数据库写入前执行）
> 执行工作树：`/agent/cdc-config-platform`（`HEAD=583e9df`，与运行源 `e6965dd` 前后端**零差异**，已由 `git diff --quiet` 证明）
> 执行时间：2026-09-20
> 原始日志：`runtime-logs/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001/`（`backend-targeted.log`、`backend-safe-suite.log`、`backend-package.log`、`frontend-targeted.log`、`frontend-full.log`、`frontend-build.log`、`06-gates.log`）

## 1. 后端

| # | 命令 | 预期 | 实测 | 结果 |
|---|---|---|---|---|
| 1 | `mvn -o test -Dtest='DataSourceConnectionTesterTest,DataSourceControllerTest,DataSourcePasswordLogSecurityTest,DataSourceNamingStrategyServiceTest,DataSourceServiceTest'` | 147 | **Tests run: 147, Failures: 0, Errors: 0, Skipped: 0**（exit 0） | **PASS** |
| 2 | `mvn -o test -Dtest='!OracleDateMappingTest,!JobFailureServiceTest,!HealthControllerTest,!CdcConfigPlatformApplicationTests'` | 1019 | **Tests run: 1019, Failures: 0, Errors: 0, Skipped: 0**（exit 0） | **PASS** |
| 3 | `mvn -o clean package -DskipTests` | BUILD SUCCESS | **BUILD SUCCESS**（exit 0） | **PASS** |

排除范围与实现 R1 **完全一致**，未扩大；**未运行**被排除的 4 个真实外部系统测试类。

打包产物：`/agent/cdc-config-platform/backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`
SHA-256：`1668f7258ed100dfb49824d95da0abcf9d95e47f3fed3b83099b02e4010f9c32`
（本产物为**门禁验证构建**，非临时验收运行中的 jar；jar 字节级不可复现（内含时间戳），源提交前后端零差异。）

## 2. 前端

| # | 命令 | 预期 | 实测 | 结果 |
|---|---|---|---|---|
| 4 | `npm test -- src/views/data-source/dataSource.spec.ts src/api/dataSource.spec.ts` | 108 | **Tests 108 passed (108)**（exit 0） | **PASS** |
| 5 | `npm test` | 1032 | **Tests 1032 passed (1032)**（exit 0） | **PASS** |
| 6 | `npm run build`（`vue-tsc --noEmit && vite build`） | BUILD SUCCESS | **`✓ built in 13.59s`**（exit 0，仅既有 chunk 体积警告） | **PASS** |

依赖：`node_modules` 已存在（196 项），按 `CLAUDE.md §10.2` **未重复执行 `npm install`/`npm ci`**，未修改 `package.json`/锁文件。

## 3. 与预期数字的核对

六项实测数字（147 / 1019 / 108 / 1032 / 两次构建成功）与 `§6` 预期**逐项完全一致**，无数量变化。

**本次为顺序、空闲执行，未出现任何偶发失败**，故无需进入“保留首次证据 + 隔离复现”流程。

## 4. 门禁结论

- 门禁全部 **PASS**，可作为正式验收执行阶段的**前置条件已满足**证据。
- 依 `§6` 末句与 `§10`：自动化测试通过**只是前置门禁**，**不自动把任何 `DS-AC` 写为 `PASS`**；42 条判定仍须逐条真实执行。
