# 实施报告：PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001

> 报告状态：`DRAFT_PENDING_USER_REVIEW`
> 修订任务：PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001
> 报告日期：2026-08-27
> 执行基线（本地 HEAD == origin/develop）：a6f51f8a8ff984bc946a4e2ccaccbf56692722fe
> 复审提交：a6f51f8a8ff984bc946a4e2ccaccbf56692722fe（reviewed_commit）

## 1. 任务目标、ChatGPT 复审结论与执行基线

本任务为**纯文档任务**：针对 ChatGPT 对恢复任务提交 `a6f51f8` 的复审结论 `CHANGES_REQUIRED`，定向修订六份项目级基线、`docs/baseline/README.md` 与 `docs/features/README.md` 中的六类文档问题，新增本轮实施报告，精确 Commit 并普通 Push 到 origin/develop，Push 后停止。

- 仓库：`acmilan1982/cdc-config-platform`（origin），分支 `develop`
- 执行基线（本地 HEAD == origin/develop，与 reviewed_commit 相同）：`a6f51f8a8ff984bc946a4e2ccaccbf56692722fe`
- 约束：只允许追加普通提交，不允许回滚、重写或修改 `a6f51f8` 历史；不重新开展项目盘点，不批准项目基线，不进入任何具体 Feature 开发。

## 2. 现有内网开发库凭据保留授权

用户明确授权在本私有项目仓库中继续保留 `ENVIRONMENT.md` 现有的内网开发数据库连接信息（地址/端口/Schema/用户名/当前已入库开发密码及带凭据连接串），不得删除、替换或脱敏，也不得因此把敏感内容检查判为失败。该授权边界已在 `DEVELOPMENT_RULES.md` §8.1 与 `ENVIRONMENT.md` §2 固化，并与现行 `CLAUDE.md` §11/§20 保持一致。

本次授权**不是**对所有秘密信息的普遍放行：生产环境账号/密码、GitHub Token、Claude Code 认证信息、SSH/OS 私钥、与本项目无关的凭据、本任务开始时尚未入库的新密码或新密钥仍然禁止。本报告按 §4.3 要求不重复打印完整密码或带密码连接串，仅记录"现有内网开发数据库凭据经用户明确授权保留"。

## 3. Git 权限规则与 CLAUDE.md 对齐

`DEVELOPMENT_RULES.md` 原 §2 把 `git fetch origin`、`git pull --ff-only origin develop` 列为默认允许操作，与现行 `CLAUDE.md` §5 冲突。本轮按三层结构重写：

1. **默认允许的只读检查**：`git status`、`git diff`、`git log`、`git show`、`git rev-parse`、`git rev-list`、`git ls-remote` 等；
2. **需要用户或当前任务明确授权**的引用、工作区、索引、提交或远程写操作：`git fetch`、`git pull`、`git merge --ff-only`、`git add`、`git commit`、`git push`、`git reset`、`git clean`、`git stash`、`git checkout`、`git switch`、分支/Tag 操作等；
3. **永久禁止**：force push、覆盖人工未提交代码、自行解决本地与远程分叉、自行改写提交历史。

规则语义与 `CLAUDE.md` §5 一致，未机械整段复制。

## 4. 非干净工作区规则纠正

删除了 `DEVELOPMENT_RULES.md` 中"工作区不干净 → 必须停止"及"CLAUDE.md 要求工作区干净才能开始新任务"两处错误口径，替换为与 `CLAUDE.md` §6 一致的表述：

- 工作区不干净本身不构成自动停线；
- 任务开始前必须记录现场并分类（授权范围内 / 既有无关修改 / 目标文件重叠归属不明）；
- 无关既有修改保持原样，不修改、不覆盖、不暂存、不提交；
- 目标文件有既有修改时，只有能够确认归属并安全保留才允许继续；
- 目标重叠无法区分、存在覆盖风险或分支分叉时停止；
- 不得为获得干净工作区执行 Reset/Checkout/Clean/Stash/删除文件。

## 5. 提交元数据消除歧义

六份项目级基线、`docs/baseline/README.md`、`PROJECT_STATUS.md` 相关位置已统一区分两个历史提交的角色：

- `6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c` = **恢复任务执行基线**（恢复任务开始时 HEAD 所在提交）；
- `a6f51f8a8ff984bc946a4e2ccaccbf56692722fe` = **恢复草案首次入库提交**（六份恢复草案第一次进入 Git 的提交）；
- 本轮修订提交 = **通过 Git 历史与本轮实施报告查询**，不在提交前伪造占位哈希。

同时删除了容易立即过期的"最新提交"和动态提交总数表述：`PROJECT.md` §5、`PROJECT_STATUS.md` §7 均改为"提交总数与最新提交为动态口径，以 Git 实际为准，不在本文固定"；`PROJECT_STATUS.md` 不再把 `6dc22ecd` 写成当前最新提交。`PROJECT_STATUS.md` 中的 "PASS 121" 为日志查询验收用例数（非提交数），保持原状。

## 6. Git 菜单事实与服务器本地候选分离

核对提交 `a6f51f8` 中 `frontend/src/config/menu.ts` 与 `frontend/src/router/index.ts` 后，在 `PROJECT.md`、`ARCHITECTURE.md`、`PROJECT_STATUS.md`、`docs/features/README.md` 中统一采用三分法：

1. **产品/项目目标范围**：大屏属于平台功能范围，产品目标菜单为 2 组 11 项；
2. **Git 已提交实现事实**：大屏 standalone 路由 `/large-screen` 已提交；Git 已提交菜单为 **2 组 10 项**（配置管理 4 + 运行监控 6，不含大屏入口）；
3. **服务器本地候选**：工作区未提交的 `menu.ts` 修改已增加大屏入口（共 11 项），仅标为本地候选，不作为 Git 可复核事实。

本轮未修改 `menu.ts` 或任何前端代码。

## 7. job-failure-monitor 状态核定

不再把 `job-failure-monitor` 简单标记为"DRAFT（未查到独立批准记录）"。核对了 `docs/features/job-failure-monitor/README.md`、`REQUIREMENTS.md` 内部元数据（`baseline_status: APPROVED`、`implementation_status: IMPLEMENTED_ACCEPTED`）及 closeout 提交：

- `e03c6df`：JOB-FAILURE-ZK-STATUS-BASELINE-CLOSEOUT-001（ZK 状态融合收口）
- `bcc2320`：JOB-FAILURE-DETAIL-HISTORY-NAV-BASELINE-CLOSEOUT-001（详情导航收口）
- `2b54db3`：JOB-FAILURE-HISTORY-NO-PAGINATION-BASELINE-CLOSEOUT-001（无分页收口）

最终表达同时保留两类事实：

- **基线**：现行业务需求已建立，多个调整链（ZK 状态融合/详情导航/故障历史/无分页等）已 APPROVED/收口；
- **实现**：主要页面与已列调整已实现并验收，但 `GAP-STATUS-001/002/003`（统一内部→对外状态映射层，对外 5 种状态）仍开放；
- **下一入口**：针对开放 GAP 进入已有 Feature 调整/接续，不重新新建 Feature。

在 `PROJECT.md`、`PROJECT_STATUS.md`、`docs/features/README.md` 中同步修订；`PROJECT_STATUS.md` §8 新增 GAP-STATUS-001/002/003 待处理项。未创造未经依据的新批准状态码，未关闭任何 GAP。

## 8. 两条日志读取链路

`CDC_LOG_CORRECT` 与 `CDC_LOG_ERROR` 的两条只读链路均已记录在 `ARCHITECTURE.md` 与 `DOMAIN_GLOSSARY.md`：

1. **日志查询**：`LogQueryMapper` + `mapper/logquery/LogQueryMapper.xml` 游标分页查询；
2. **大屏增量统计**：`JdbcTemplate`（LogBatchReader）批量读取日志并在内存聚合。

不再把两张日志表概括成"仅通过 JdbcTemplate 读取"。同时保持边界：管理平台对两张日志表只读；日志写入链为 `sync-server → Kafka → sync-log → CDC_LOG_CORRECT / CDC_LOG_ERROR`；日志查询与大屏统计是两个不同读路径；未修改已批准数据库基线的物理事实。

## 9. 路由计数结果

以当前 `frontend/src/router/index.ts` 实际 Route Record 为准，统一口径为：

```text
共 15 条 Route Record：1 条根路径重定向 + 14 条具名页面路由。
```

`ARCHITECTURE.md` 与 `docs/features/README.md` 已统一采用该口径，不再混用"14条路由""14条加重定向""15个页面"等不同说法。

## 10. 修改文件、链接检查、状态检查与工作区保护

本轮修改文件（均在默认白名单内）：

| 文件 | 修改 |
|---|---|
| docs/baseline/README.md | 头部元数据（执行基线/首次入库提交/本轮修订任务） |
| docs/baseline/PROJECT.md | 头部元数据、§2.1 菜单三分法、§2.2 故障监控 GAP、§5 动态口径 |
| docs/baseline/ENVIRONMENT.md | 头部元数据、§2 凭据保留授权说明（未删除现有凭据） |
| docs/baseline/ARCHITECTURE.md | 头部元数据、菜单/路由口径、§4.1/§4.8 两条日志读链、§7.1 15 条 Route Record |
| docs/baseline/DEVELOPMENT_RULES.md | §2 Git 三层权限、§2.5 非干净工作区、§8.1 凭据边界、待确认项清理 |
| docs/baseline/PROJECT_STATUS.md | 头部元数据、§1.1/§3/§4 菜单与 GAP 口径、§7 提交元数据、§8 新增 GAP 待办 |
| docs/baseline/DOMAIN_GLOSSARY.md | 头部元数据、sync-server/正确日志/错误日志两条读链 |
| docs/features/README.md | 头部元数据、15 条 Route Record、菜单三分法、job-failure-monitor 状态 |
| docs/baseline/reports/PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001.md | 本报告（新增） |

验证结果：

- `git diff --check` / `git diff --cached --check` 通过，无空白错误；
- 全部新增或修改的相对链接均可解析（baseline README / features README 引用的文件路径均存在）；
- 六份项目级基线全部存在，状态均为 `DRAFT_PENDING_USER_REVIEW`；
- Git 权限、分叉停线、非干净工作区规则与 `CLAUDE.md` 无冲突；
- 已用 `rg` 定向核对，不再存在旧错误表述（详见 §17 验证清单）；
- 暂存区只包含实际修改的白名单文件；
- 未修改任何业务代码、Feature 业务基线或已批准数据库基线；
- 未提交本提示词或任何普通任务提示词（普通任务提示词提交数量为 0）；
- 任务前用户工作区内容（9 个已修改跟踪文件、3 个已删除跟踪文件、约 129 个未跟踪文件）原样保留，未修改、未覆盖、未暂存、未提交、未清理。

## 11. 数据库、ZooKeeper、服务、业务代码零操作

```text
database_read_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_status=NONE
service_start_stop_status=NONE
business_code_change_status=NONE
frontend_code_change_status=NONE
backend_code_change_status=NONE
```

本任务未连接数据库、未访问 ZooKeeper、未执行 DDL/DML、未启停服务、未修改前后端生产代码、配置、锁文件或测试。未执行前后端构建（文档任务，验证矩阵标记 NOT_APPLICABLE）。

## 12. DRAFT_PENDING_USER_REVIEW

六份项目级基线、`docs/baseline/README.md`、`docs/features/README.md` 均保持 `DRAFT_PENDING_USER_REVIEW`。本任务不批准任何基线，不代表用户批准任何 Feature，不修改 Feature 业务需求或验收规则，不关闭 `job-failure-monitor` 中尚未解决的 GAP，不把本轮文档修订称为业务验收通过。

## 13. 下一步

```text
Agent 修订并 Push（本任务）
→ ChatGPT 第二轮复审
→ 用户批准项目级基线
→ 再开启具体 Feature 会话
```

Push 成功后本任务立即停止，不继续任何业务代码、Feature 批准、数据源管理、数据库/ZooKeeper 操作或历史 prompts 清理。
