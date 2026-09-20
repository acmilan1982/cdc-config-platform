# 00 — 验收前自动化门禁结果（数据库写入之前）

> 任务：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> 执行时点：**数据库写入之前**（门禁在数据库写入前执行）
> 执行工作树：`/agent/cdc-temp-ds-formui-formal-001`（`HEAD=db1cfda7c8e10ddd5faa2a119e7550059a687d05`，即本次运行源，前后端同源）
> 执行时间：2026-09-20
> 原始日志：`/agent/cdc-temp-ds-formui-001/logs/FACC002/`（`backend-targeted.log`、`backend-safe-suite.log`、`backend-package.log`、`frontend-targeted-109.log`、`frontend-targeted.log`、`frontend-full.log`、`frontend-build.log`、`frontend-npm-ci.log`，均**未入库**）

## 1. 后端

| # | 命令 | 预期 | 实测 | 结果 |
|---|---|---|---|---|
| 1 | `mvn -o test -Dtest='DataSourceConnectionTesterTest,DataSourceControllerTest,DataSourcePasswordLogSecurityTest,DataSourceNamingStrategyServiceTest,DataSourceServiceTest'` | 161 / 0 | **Tests run: 161, Failures: 0, Errors: 0, Skipped: 0**（exit 0，BUILD SUCCESS） | **PASS** |
| 2 | `mvn -o test -Dtest='!OracleDateMappingTest,!JobFailureServiceTest,!HealthControllerTest,!CdcConfigPlatformApplicationTests'` | 1033 / 0 | **Tests run: 1033, Failures: 0, Errors: 0, Skipped: 0**（exit 0，BUILD SUCCESS） | **PASS** |
| 3 | `mvn -o clean package -DskipTests` | BUILD SUCCESS | **BUILD SUCCESS**（exit 0，`Total time: 19.254 s`） | **PASS** |

- 排除范围与实现 R1 / 上一轮验收 **完全一致，未扩大**；被排除的 4 个**真实外部系统**测试类（`OracleDateMappingTest`、`JobFailureServiceTest`、`HealthControllerTest`、`CdcConfigPlatformApplicationTests`）**未运行**。
- 打包产物 `target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar` 为**门禁验证构建**；临时验收运行实际启动的 jar 见 `01-git-and-runtime-identity.md`（SHA-256 `1150fb57…`）。jar 字节级不可复现（内含时间戳），源提交前后端零差异。

## 2. 前端

| # | 命令 | 预期 | 实测 | 结果 |
|---|---|---|---|---|
| 4 | `npm test -- src/views/data-source/dataSource.spec.ts` | 109 | **Test Files 1 passed (1) / Tests 109 passed (109)**（exit 0） | **PASS** |
| 5 | `npm test` | 1044 / 56 文件 | **Test Files 56 passed (56) / Tests 1044 passed (1044)**（exit 0） | **PASS** |
| 6 | `npm run build`（`vue-tsc --noEmit && vite build`） | BUILD SUCCESS | **`✓ built in 27.84s`**（exit 0，仅既有 chunk 体积警告） | **PASS** |

补充（不改写预期口径）：两文件合并运行 `npm test -- src/views/data-source/dataSource.spec.ts src/api/dataSource.spec.ts` 实测 **Test Files 2 passed (2) / Tests 120 passed (120)**，即单文件 109 + `src/api/dataSource.spec.ts` 11。本任务 §6 预期为 **109**，故以**单文件**命令为准；两文件结果作为补充证据保留，**未**用其替换预期值。

依赖：本次为**新建的独立工作树**，`node_modules` 初始不存在，按 `CLAUDE.md §10.2`（`node_modules` 不存在时可执行安装）执行 `npm ci`，exit 0，**未修改** `package.json` 与锁文件。

## 3. 与预期数字的核对

六项实测数字（**161 / 1033 / 109 / 1044** + 两次构建成功）与任务书 §6 预期**逐项完全一致**，无数量变化。

**本次为顺序、空闲执行，未出现任何偶发失败**，故未进入"保留首次证据 + 隔离复现"流程。

## 4. 门禁结论

全部 6 项 **PASS**，门禁**放行**数据库写入阶段。门禁期间**未修改任何业务代码、测试代码或断言**；未为通过门禁而调整实现。
