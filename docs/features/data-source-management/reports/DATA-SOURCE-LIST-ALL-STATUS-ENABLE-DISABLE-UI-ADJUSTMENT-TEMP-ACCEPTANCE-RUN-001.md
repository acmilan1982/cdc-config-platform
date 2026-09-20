# 数据源列表全状态、启停与 UI 调整——临时验收运行及只读核验报告（TEMP-ACCEPTANCE-RUN-001）

> 任务编号：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-TEMP-ACCEPTANCE-RUN-001`
> 任务类型：`TEMPORARY_ACCEPTANCE_RUNTIME_AND_READ_ONLY_VERIFICATION`
> 分支：`develop`
> 结论：**`SUCCESS`（临时后端与前端已从同一提交启动并保持运行，只读契约核验与技术冒烟通过）**
> 本报告**不构成项目负责人目测通过**，也不构成正式验收。

---

## 1. 结论摘要

项目负责人已明确选择**临时验收运行**（不再寻找持久部署目标）。本任务在独立干净工作树检出远程提交 `e6965dd...`（前后端业务代码与已复审 `399cb224...` 零差异），完成规定测试与构建后，启动了临时后端与 Vite 前端，完成只读契约核验与技术冒烟，**两端保持运行**供项目负责人亲自目测。

只读核验关键结果：`GET /api/data-sources` 返回 **34 条**，**每行均含 `fgActive` 键**，其中 `"1"`=**15**、`"0"`=**19**、`null`=0、其他异常值=0，响应无 `undefined`，无密码等禁止字段；页面实际渲染 **34 行**，对 19 条 `'0'` 记录显示 **19 个“停用”标识**，**不再出现 `异常（原始值=undefined）`**。此前“只显示启用记录 + 每行 undefined”的现象已不复现。

---

## 2. 提交关系（§2）

| 项 | 值 |
|---|---|
| 分支 | `develop` |
| `origin/develop` | `e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb` |
| `git ls-remote origin refs/heads/develop` | `e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb` |
| `git diff --quiet 399cb2249f60411b52235a859a8ce95d9f6e4579..e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb -- backend frontend` | **退出码 0**（前后端业务代码零差异） |
| 运行源提交 | `e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb` |
| 已复审业务代码提交 | `399cb2249f60411b52235a859a8ce95d9f6e4579` |

`399cb224...` 为 ChatGPT 远程复审通过（`REVIEW_PASS`）的实现 R1 业务代码提交；`e6965dd...` 仅在其上新增部署核验 `BLOCKED` 报告与 README 记录，未改动前后端代码、配置、测试、依赖或锁文件（由上表 `diff --quiet` 证明）。

---

## 3. 隔离工作树与现场保护（§3）

- 隔离工作树：`/agent/cdc-temp-acceptance-001`（`git worktree add --detach`，检出精确提交 `e6965dd...`），全部构建与临时运行均在其中进行。
- 主工作区未执行任何清理、覆盖、`stash`、`reset`、`checkout` 回退或批量暂存。
- 任务前既有内容保持原样：`.claude/settings.local.json`（已修改）、`docs/prompts/`（未跟踪）。
- 临时日志置于仓库已忽略（`.gitignore` 的 `*.log`）的 `runtime-logs/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-TEMP-ACCEPTANCE-RUN-001/`；接口**原始响应 JSON、页面 DOM、PID 文件**因 `.gitignore` 未覆盖该扩展名，另存于仓库外 `/tmp/tta-001-evidence/`，**不进入仓库、不可被提交**。未提交日志、PID、构建产物、接口原始响应或截图。
- 未读取、输出、复制或使用 `BLOCKED` 报告提到的旧目录 GitHub Token；未访问该旧检出的 `.git/config`。

---

## 4. 构建与测试（§5，均在隔离工作树）

### 4.1 后端

| 项 | 命令 | 结果 |
|---|---|---|
| 数据源定向测试 | `mvn test -Dtest='DataSourceConnectionTesterTest,DataSourceControllerTest,DataSourcePasswordLogSecurityTest,DataSourceNamingStrategyServiceTest,DataSourceServiceTest'` | **147**，Failures 0，Errors 0，Skipped 0，BUILD SUCCESS |
| 同范围安全回归集 | `mvn -o test -Dtest='!OracleDateMappingTest,!JobFailureServiceTest,!HealthControllerTest,!CdcConfigPlatformApplicationTests'` | **1019**，Failures 0，Errors 0，Skipped 0，BUILD SUCCESS |
| 打包 | `mvn -o clean package -DskipTests` | **BUILD SUCCESS** |

排除范围与实现 R1 报告**完全一致**，未扩大。未运行连接真实 Oracle/ZooKeeper/Kafka 的测试类（上述 4 个被排除类）。

产物：

| 项 | 值 |
|---|---|
| jar 绝对路径 | `/agent/cdc-temp-acceptance-001/backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar` |
| 大小 | `47,741,438` 字节 |
| SHA-256 | `baf711cfa4600bc4f4eddc853d3fe6cfd86a404aa2617c85a7da35a9fbd57277` |
| 构建源提交 | `e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb` |

### 4.2 前端

| 项 | 命令 | 结果 |
|---|---|---|
| 可重复依赖安装 | `npm ci`（锁文件 `package-lock.json`；未升级依赖、未改 `package.json`/锁文件） | 成功 |
| 数据源定向测试 | `npm test -- src/views/data-source/dataSource.spec.ts src/api/dataSource.spec.ts` | **108** 通过（97 + 11），0 失败 |
| 前端全量测试 | `npm test` | **1032** 通过（56 个测试文件），0 失败 |
| 构建 | `npm run build`（`vue-tsc --noEmit && vite build`） | **BUILD SUCCESS**（`✓ built`，仅既有 chunk 体积警告） |

构建源提交：`e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb`（与后端同一工作树）。临时验收运行使用 Vite dev server；`npm run build` 仅作构建验证，未把 `dist` 复制到后端或任何持久目录。

### 4.3 已定位并排除的偶发失败（flaky，与提交无关）

初次执行时出现两处非确定性失败，均经复现判定为环境/时序性、与被测提交无关，并在空闲重跑中全部通过。此处如实记录：

1. **后端 `monitor.zookeeper.ZooKeeperMonitorServiceTest.shouldNotSetScnStaleWhenExactlyAtThreshold` 偶发失败 1 次**：该用例以 `LocalDateTime.now().minusHours(24)`（精确到秒）构造“恰好等于阈值”，断言不陈旧，结果取决于执行是否跨秒边界，属时序 flaky。证据：单独隔离重跑 5 次 = 通过/失败/通过/通过/通过（**4/5 通过**）；随后同范围安全回归集空闲重跑 = **1019/0/0/0 BUILD SUCCESS**。属 `monitor/zookeeper` 域，与本次数据源改动无关。
2. **前端全量测试 2 例超时（5000ms）**（`dataSource.spec.ts` 的“拖动监听生命周期清理（R1）”“表单标签左对齐与固定列宽（DS-REQ-113）”）**发生于与 Maven 并发、机器高负载时**；同一文件在定向测试中 **108/108 全通过**，且空闲重跑全量 = **1032/1032 通过**。判定为负载导致的超时 flaky。

上述仅为记录；**最终有效口径为：后端 1019/0、前端 1032/0、两端构建成功。**

---

## 5. 临时启动方式与运行事实（§6）

### 5.1 前置检查

启动前确认 `127.0.0.1:8080` 与 `5173` 均无监听，无遗留本项目进程，无需终止任何无关进程（未使用 `pkill`/`killall`/模糊匹配）。

### 5.2 后端

| 项 | 值 |
|---|---|
| 启动命令（脱敏） | `java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=127.0.0.1` |
| 工作目录 | `/agent/cdc-temp-acceptance-001/backend` |
| profile | `dev`（既有开发 profile；未修改任何配置） |
| 绑定/端口 | `127.0.0.1:8080`（仅回环，**未开放到外网**；依 §6.1 以运行时参数 `--server.address=127.0.0.1` 覆盖默认 `0.0.0.0`，未改动配置文件） |
| PID | `14440` |
| 启动时间 | `2026-09-20 10:32:47`（日志 `Started ... in 6.266 s`） |
| 日志路径 | `runtime-logs/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-TEMP-ACCEPTANCE-RUN-001/backend-8080.log` |
| 健康检查 | `GET /api/health` → `http=200` |

### 5.3 前端

| 项 | 值 |
|---|---|
| 启动命令 | `npm run dev`（`vite`；`vite.config.ts` 既有 host `0.0.0.0`、port `5173`、`/api` 代理 `http://127.0.0.1:8080`，**未修改代理配置**） |
| 工作目录 | `/agent/cdc-temp-acceptance-001/frontend` |
| 绑定/端口 | `0.0.0.0:5173` |
| PID | `14579`（`node .../node_modules/.bin/vite`） |
| 启动时间 | `2026-09-20 10:35:13`（Vite `ready in 316 ms`） |
| 日志路径 | `runtime-logs/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-TEMP-ACCEPTANCE-RUN-001/frontend-5173.log` |

两端均以 `setsid nohup ... &`（脱离本任务会话）方式启动，可在 Agent 任务结束后继续存活。

---

## 6. 只读接口核验（§7.1）

调用 `GET /api/data-sources`（本机后端 `127.0.0.1:8080` 与 Vite 代理 `127.0.0.1:5173` 两路，响应除服务端 `timestamp` 外一致）：

| 核验项 | 结果 |
|---|---|
| HTTP / 业务响应 | `http=200`，正文 `code=200`，成功 |
| 记录总数 | **34** |
| 每行均含 `fgActive` 键 | **是**（34/34） |
| `fgActive="1"` | **15** |
| `fgActive="0"` | **19**（真实停用记录**不再被过滤**） |
| `fgActive` 为 JSON `null` | **0** → `NOT_OBSERVED_NO_DATA_SAMPLE` |
| `fgActive` 其他非空异常值 | **0** → `NOT_OBSERVED_NO_DATA_SAMPLE` |
| 响应含 `undefined` | **否** |
| 禁止字段（password 等） | 无；行字段仅为 `dataSourceId/dataSourceName/dataSourceCategory/dataSourceType/host/port/serviceName/userName/fgActive` |

未为凑齐状态样本而新增、编辑、启用、停用或清洗数据；`null` 与“其他异常值”分支无现存样本，记录 `NOT_OBSERVED_NO_DATA_SAMPLE`，由自动化测试覆盖。

---

## 7. 页面技术冒烟（§7.2）

使用无头 Chrome 渲染 `http://127.0.0.1:5173/config/data-source` 并分析 DOM：

| 核验项 | 结果 |
|---|---|
| 页面 HTTP（回环与 `192.168.174.70:5173`） | 均 `http=200`，`text/html`，标题 `CDC 配置管理平台` |
| 阻塞性 JavaScript 错误 | 无（过滤后的控制台错误为空） |
| 页面列表数量与接口数组长度一致 | **一致**：接口 34 行，页面渲染的 34 个 `dataSourceId` **全部命中 DOM** |
| 结果区头部 | `共 34 条` |
| 出现 `异常（原始值=undefined）` | **否** |
| 出现 `异常（FG_ACTIVE 未返回）` | **否**（同版本部署不应出现字段缺失） |
| `'0'` 状态展示 | **19 个 `停用` 标识**，与接口 `'0'` 行数（19）**完全一致** |
| `'1'` 状态展示 | **无额外状态标识**（15 行均无） |
| `null` / 其他异常值展示 | 当前无样本，未出现 |
| 写操作 | **未点击、未调用**任何新增/编辑/删除/启用/停用/连接测试/业务属性保存/命名策略保存接口 |

**技术冒烟通过，但不等于项目负责人目测通过。**

### 7.1 技术冒烟中的一处如实观察（非本次改动引入）

DOM 中唯一字面量 `undefined` 出现在一个**隐藏**（`display:none`）的“目标库命名策略”对话框的 `aria-label` 模板中（`aria-label="目标库命名策略 - undefined（undefined）"`），属该隐藏弹窗未初始化时的占位文本，**不在可见的列表/状态区域**，也**不是**本次修复针对的 `异常（原始值=undefined）`，且与本次数据源列表改动无关（预存在）。列表与状态区域无任何 `undefined`。建议作为独立小任务评估，本次不修改代码。

---

## 8. 外部系统与写入边界（§8，如实记录）

本任务 Agent 侧**未**直接访问数据库、未执行任何 SQL/DDL/DML、未调用任何应用写接口、未主动访问或修改 ZK/Kafka/源库/目标库。

应用在**标准启动过程**中自动产生的连接（如实记录，未主动扩大）：

| 外部系统 | 情形 |
|---|---|
| Oracle 开发库 `192.168.174.65:1521` | 应用按 `dev` profile 建立 HikariCP 连接池（`HikariPool-1 - Start completed`），仅用于只读列表查询 |
| ZooKeeper `10.19.16.111:2181` | 应用启动自动初始化只读 ZK 客户端并**连接成功**（`Session establishment complete ... sessionid = 0x10922dad14a00c9, negotiated timeout = 30000`） |
| Kafka / 源库 / 目标库 | 无访问 |

启动日志另含 MyBatis-Plus 关于若干实体缺 `@TableId` 的既有 `WARN`（如 `DataSourceExtend`、`CumulativeOverviewEntity` 等），为已知既有代码层差异（`ARCHITECTURE.md §9`），与本次改动无关。

---

## 9. 版本一致性证据（§6.4 组合）

- 构建工作树精确提交：`e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb`（前后端同一工作树）；
- 运行后端 jar = 本次构建产物（同一文件），SHA-256 `baf711cfa4600bc4f4eddc853d3fe6cfd86a404aa2617c85a7da35a9fbd57277`；
- 前端临时运行由同一工作树源码经 Vite dev server 提供（`SourceMap`/模块即该提交源码），未使用任何持久 `dist`；
- 服务启动时间（后端 `10:32:47`、前端 `10:35:13`）晚于构建时间（`10:24`）；
- 运行接口体现 `399cb224...` 冻结的新契约：全状态范围（返回 19 条 `'0'`）、每行 `fgActive` 键、无 `undefined`；
- 页面静态行为体现新前端：不再出现 `异常（原始值=undefined）`，`'0'` 行显示 19 个 `停用`。

说明：本次构建 jar 的 SHA-256 与实现 R1 构建（`37773adf...`）不同，属 jar 字节级不可复现（内含时间戳），不影响上述一致性结论。

---

## 10. 服务留存与项目负责人交接（§9）

只读核验后已等待稳定窗口复核：两端 PID、端口、HTTP 与关键日志均正常，**保持运行**。

| 交接项 | 值 |
|---|---|
| 页面访问地址 | **http://192.168.174.70:5173/config/data-source** |
| 后端 PID / 端口 | `14440` / `127.0.0.1:8080` |
| 前端 PID / 端口 | `14579` / `0.0.0.0:5173` |
| 启动时间 | 后端 `2026-09-20 10:32:47`；前端 `2026-09-20 10:35:13` |
| 日志路径 | `runtime-logs/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-TEMP-ACCEPTANCE-RUN-001/{backend-8080.log,frontend-5173.log}` |
| 运行源提交 | `e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb`（前后端业务代码 = 已复审 `399cb224...` 零差异） |
| 列表记录数与各状态数 | 共 34 条：`'1'`=15、`'0'`=19、`null`=0、其他=0 |

**请项目负责人现在亲自目测 `http://192.168.174.70:5173/config/data-source` 页面。** 本任务成功结束时**未执行任何停止命令**。

后续停止方式（供项目负责人需要时使用，本次未执行）：

```bash
kill 14440   # 临时后端（127.0.0.1:8080）；如已重启请以实际 PID 为准
kill 14579   # 临时前端（0.0.0.0:5173）
```

---

## 11. 状态声明与 Git 边界

- 本报告仅记录**临时验收运行与技术性只读核验**；服务已保持运行等待项目负责人目测；**项目负责人尚未给出目测结论，正式验收也未执行**。
- `implementation_status` 保持 `IMPLEMENTED_PENDING_USER_REVIEW`；`DS-AC-141~182`（42 条）仍全部 `NOT_RUN`；未置 `PROJECT_OWNER_VISUAL_REVIEW_PASS`/`IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用。
- 未修改任何业务代码、测试、配置、依赖、锁文件、SQL 或已批准正文；未创建 systemd 单元、Nginx 配置、持久部署目录或开机启动项；未修改防火墙或开放新端口；未把 8080 暴露到外网。
- 本报告仅新增：本文件 + `docs/features/data-source-management/README.md` 变更记录一行。
- 临时运行工作树 `/agent/cdc-temp-acceptance-001` 已登记为 Git worktree，将在服务停止后由后续任务清理（本任务保留其存活，未删除）。

---

## 12. 遗留观察

1. **隐藏弹窗 `aria-label` 含 `undefined`**（§7.1）：`目标库命名策略` 对话框隐藏态占位文本，可见区域无 `undefined`；建议独立任务评估。
2. **两处 flaky 测试**（§4.3）：后端 ZK 阈值边界用例、前端高负载下的 5s 超时用例；均非本次改动引入，建议后续独立任务加固（时间边界容差 / 提高测试超时）。
3. 本次为**临时运行**，非持久部署；是否需持久化交付形态仍由项目负责人后续决定。
