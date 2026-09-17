# 查询列表页公共组件 · 阶段一正式验收报告

```text
task_code=QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001
base_commit_id=d1cd3b1fffb56b50793e576a369325e94063cabc
parent_commit_id=ff9bf2b8ed026f42cfd42904065a4577e7aa1556
branch=develop
execution_status=PASS
review_status=PENDING_CHATGPT_REMOTE_GIT_REVIEW
scope=阶段一 6 个公共组件 + 1 个 composable；参考页等价接入；未迁移任何其它页面
```

## 1. 任务、基准与结论

本任务对查询列表页公共组件阶段一实现（`QUERY-LIST-PAGE-SHARED-COMPONENT-IMPLEMENTATION-001`
及其 R1 纠正 `…-IMPLEMENTATION-001-R1`）执行**正式验收**。验收基准为
`d1cd3b1fffb56b50793e576a369325e94063cabc`，其父提交为
`ff9bf2b8ed026f42cfd42904065a4577e7aa1556`；远程 `develop`（`git ls-remote`）、
隔离工作区 HEAD 与 `HEAD^` 三者均与指定值一致，未自动切换到任何更新提交。

**结论：17 项强制验收用例全部 PASS。** 未发现需要在生产代码或测试代码中修复的缺陷，
因此本任务范围内的生产代码、测试代码、依赖与锁定文件修改量均为零。

验收基准之上的三个前置状态：

| 项 | 状态 |
|---|---|
| ChatGPT 对 R1 实现的复审 | `APPROVED` |
| 公共组件详细设计 | `APPROVED` |
| 阶段一实现 | 已实现并通过本轮正式验收执行 |

## 2. 隔离工作区与服务来源

验收在独立工作区 `/agent/query-list-page-shared-component-implementation-001-r1`
（`detached HEAD`，HEAD 严格等于基准提交，验收开始前 `git status --short` 为空）中执行，
**未**在主工作区 `/agent/cdc-config-platform` 运行（该工作区存在与任务无关的既有修改）。

- 主工作区在验收前后始终为 `4222b0a [develop]`，分支未被移动；
- 未进入、清理、删除、reset、stash 或修改任何其它既有 worktree；
- 本任务工作区在任务结束后保留，等待复审，未做清理。

前端与后端均在本任务隔离工作区启动，进程工作目录经 `/proc/<pid>/cwd` 核实（详见
`evidence/…/AC-001-base-isolation-and-services.md`）：

| 服务 | PID | cwd | 监听 |
|---|---|---|---|
| 后端 | 20646 | 隔离工作区根 | `*:8080` |
| 前端 | 20827 | 隔离工作区 `frontend/` | `0.0.0.0:5173` |

后端 jar 位于主工作区 `backend/target/`，本轮未重新打包。核实：主工作区
`git status --short backend/` 为空，且 `git diff --stat 4222b0a d1cd3b1 -- backend/`
为空 —— jar 对应的后端源码树与被验提交逐字节一致，不存在版本替代。后端不在本任务
验收范围内（`backend_diff=ZERO`），仅作为浏览器验证的数据源：

- `GET /api/monitor/data-source-run-state/list` → HTTP 200，**records=30**；
- `GET /monitor/data-source-state` → HTTP 200。

启动前已检查预期端口是否被占用；8080 / 5173 / 5181 / 5182 / 5183 / 5190 均空闲，
无身份不明占用者，未触发停线条件。未使用 `pkill`、`killall`、模糊匹配杀进程或按端口
范围批量杀进程。

## 3. 环境预检

`source /agent/cdc-config-platform/agent-env.sh` 后实测：

| 工具 | 路径 | 版本 |
|---|---|---|
| git | `/usr/bin/git` | 2.47.3 |
| java / javac | `/usr/java/latest/bin/` | 1.8.0_202 |
| mvn | `/usr/local/maven/bin/mvn` | 3.8.8（`Maven home: /usr/local/maven`） |
| node | `/opt/node/bin/node` | v24.17.0 |
| npm | `/opt/node/bin/npm` | 11.13.0 |

`locale`：`LANG=en_US.UTF-8`、`LC_CTYPE=en_US.UTF-8`。

本轮未安装、升级或替换任何依赖、JDK、Maven、Node.js、npm、浏览器或系统工具。

## 4. 冻结范围核对

| 冻结项 | 要求 | 实测 |
|---|---|---|
| 候选组件数 | 10 | 10 |
| 已实现公共组件数 | 6 | 6 |
| 并入组件数 | 1（`StableTableContainer` 并入 `QueryListResultPanel` 正文区） | 1 |
| 推迟 composable 数 | 3 | 3（无任何文件、无任何引用） |
| 拒绝组件数 | 0 | 0 |

阶段一集合 = `QueryListPageShell`、`QueryListQueryPanel`、`QueryListActions`、
`QueryListResultPanel`、`QueryListRefreshToolbar`、`QueryListTooltipHost`、
`useQueryListTooltip`。

- `StableTableContainer` 未单独成组件：`src` 下不存在该文件，也不存在任何引用；
- 三个行为 composable（`useQueryListAppliedQuery`、`useQueryListSingleFlightRequest`、
  `useQueryListVisibleAutoRefresh`）仍为推迟状态，`src` 下不存在同名文件，
  源码中无任何导入或引用（含占位、别名、空文件）；
- 未迁移第二个页面；公共 API 未增长（出口仍为 6 组件 + 1 composable，样式源不导出）；
- 参考页业务语义未改变；后端、依赖、锁定文件、SQL 与运行时配置的实现改动为零。

## 5. 十七项强制验收用例逐条结论

| 用例 | 结论 | 主要证据 |
|---|---|---|
| QLPSC-AC-001 基准与工作区来源 | PASS | `evidence/…/AC-001-base-isolation-and-services.md` |
| QLPSC-AC-002 公共实现边界 | PASS | `evidence/…/AC-002-008-static-contract.md` §AC-002 |
| QLPSC-AC-003 页面壳契约 | PASS | 同文件 §AC-003；`AC-014-browser-four-viewports.md` |
| QLPSC-AC-004 查询面板与操作组 | PASS | 同文件 §AC-004 |
| QLPSC-AC-005 结果面板契约 | PASS | 同文件 §AC-005 |
| QLPSC-AC-006 刷新工具组契约 | PASS | 同文件 §AC-006 |
| QLPSC-AC-007 加载态几何稳定 | PASS | 同文件 §AC-007；`AC-014-browser-four-viewports.md` |
| QLPSC-AC-008 Spinner 单来源契约 | PASS | 同文件 §AC-008（含生产构建产物等价性） |
| QLPSC-AC-009 Tooltip 单实例与数据流 | PASS | `AC-009-010-tooltip.md` §AC-009 |
| QLPSC-AC-010 `aria-describedby` 生命周期 | PASS | 同文件 §AC-010（含浏览器实测） |
| QLPSC-AC-011 稳定滚动条槽作用域 | PASS | `AC-003-011-012-013-tests-and-contracts.md` §AC-011 |
| QLPSC-AC-012 参考页等价性 | PASS | 同文件 §AC-012；`AC-015-strict-geometry.md` |
| QLPSC-AC-013 测试 / 类型检查 / 构建 | PASS | 同文件 §AC-013 |
| QLPSC-AC-014 浏览器与多视口 | PASS | `AC-014-browser-four-viewports.md` |
| QLPSC-AC-015 严格几何比对 | PASS | `AC-015-strict-geometry.md` |
| QLPSC-AC-016 负向对照 | PASS | `AC-016-negative-controls.md` |
| QLPSC-AC-017 范围、冻结标记与安全 | PASS | `AC-017-scope-freeze-safety.md` |

关键结果字段：

```text
normal_content_state_direct_element_children=EXACTLY_3_HEADER_QUERY_RESULT
first_load_error_state_direct_element_children=EXACTLY_2_HEADER_ERROR_CARD
default_slot_wrapper_status=NONE
query_button_width_px=62
reset_button_width_px=62
refresh_button_width_px=110
reference_action_button_height_px=30
spinner_css_source_count=1
spinner_css_source_path=frontend/src/components/query-list/query-list-spinner.css
query_spinner_inset_px=2
refresh_spinner_inset_px=3
loading_geometry_status=PASS
single_tooltip_status=PASS
tooltip_host_count=1
tooltip_controller_count=1
tooltip_aria_describedby_status=PASS
route_meta_stable_gutter_status=PASS
other_route_gutter_leak_status=NONE_DETECTED
reference_page_equivalence_status=PASS
strict_geometry_status=PASS
strict_geometry_check_count=263
strict_geometry_failure_count=0
negative_control_case_count=4（另加 1 项 Tooltip 单实例变体，共 5 次独立变异）
negative_control_restore_status=ALL_BYTE_IDENTICAL
```

## 6. 测试 / 类型检查 / 构建

| 步骤 | 命令 | 结果 | 退出码 |
|---|---|---|---|
| 定向测试（公共层） | `npx vitest run src/components/query-list src/composables/query-list` | 8 files / 145 passed | 0 |
| 定向测试（参考页） | `npx vitest run src/views/data-source-run-state` | 9 files / 222 passed | 0 |
| 定向合计 | 同上 | **367 passed / 0 failed** | 0 |
| 全量前端测试 | `npm test` | 55 files / **967 passed** | 0 |
| 类型检查 | `npx vue-tsc --noEmit` | 无输出 | 0 |
| 生产构建 | `npm run build` | 构建成功 | 0 |

定向 367 与全量 967 均与实现阶段 R1 参考值完全一致，不存在测试发现范围变化或仓库事实变化；
无任何失败用例，无断言被降级、删除、跳过或改写。

## 7. 四视口浏览器验证

真实前端 + 真实后端 + 真实浏览器，四个正式视口
（`1280x800`、`1700x920`、`1920x1080`、`2560x1440`）逐视口执行：正常首载（30 条真实数据）、
查询、重置、立即刷新、加载态几何、Tooltip 单实例与宽度约束与切换、表格与查询区响应式、
路由槽不泄漏、控制台与网络。四视口全部通过，页面壳正常态直接元素子节点恒为 3
（`HEADER.ql-page__header` / `DIV.ql-q-panel` / `DIV.ql-result-panel`），首载失败态恒为 2，
三个按钮在四视口恒为 `62×30 / 62×30 / 110×32`，表头恒为 7 列，
结果区 body `overflow-x: auto`，内容区 `scrollbar-gutter: stable`。

网络拦截仅在浏览器运行时临时使用一次（使列表请求返回 500 以触发首载失败态），
随后恢复真实后端并重新验证正常态；未修改源码、未写入 Git 工作区、未改变后端状态。

## 8. 严格零容差几何比对

复用并审查实现阶段已有严格比较方法，阈值保持为 `0`：等值判定为 `JSON.stringify` 逐值相等，
任何差异（含浮点末位）都判失败并以非零退出码结束；每次断言递增 `checks`；
`nullPaths()` 守卫禁止 `null === null` 静默通过；已批准差异仅在明确注释的省略集合
（`cls`、`overflow-x/y`、`spinnerCount`）内剔除。

| 比对 | checks | failures | 退出码 |
|---|---|---|---|
| 同角色（`ff9bf2b` vs `d1cd3b1`） | **263** | **0** | 0 |
| 跨实现角色（`0d676a7` vs `d1cd3b1`） | **263** | **0** | 0 |

与实现阶段 R1 参考结果一致，未减少任何关键断言。比较范围详见
`evidence/…/AC-015-strict-geometry.md`。

## 9. 负向对照

五个临时变异全部在干净基线上独立执行，均命中目标断言并以非零退出码失败，
随后以 `git checkout -- <file>` 精确还原，SHA-256 与 `git status --short` 证明逐字节一致，
最后重跑正向检查 PASS。任何变异均未提交入库。

| 编号 | 变异 | 命中断言 | 退出码 | 还原 | 重跑 |
|---|---|---|---|---|---|
| NC1 | 组件内联样式重新写回 Spinner 规则 | 单来源 / 内联无副本 | 1 | 哈希一致 | 16/16，0 |
| NC2 | 外部样式引用改指其它路径 | 两个消费者引用同一来源 | 1 | 哈希一致 | 16/16，0 |
| NC3 | 注入 `+0.001px` Spinner 几何偏移 | 偏移 2px / 3px / reduced-motion 不变 | 1 | 无文件改动 | 58/58，0 |
| NC4 | 未声明路由出现 gutter 泄漏 | 未声明路由无 class / `scrollbar-gutter=auto` | 1 | 哈希一致 | 263/0，0 |
| NC4b | 参考页出现第二个 Tooltip 宿主 | 同屏宿主 ≤1 / 表格 Tooltip 唯一 | 1 | 哈希一致 | 263/0，0 |

`+0.001px` 仍被严格判定为失败，证明几何阈值确实为 `0`，不存在非零容差掩盖差异。
详见 `evidence/…/AC-016-negative-controls.md`。

## 10. 控制台与网络结论

- 页面请求方法集合实测为 `{GET}`，无任何非 GET 写请求；
- 唯一一条控制台错误为本验证主动注入的 `status of 500`（首载失败态所需），属预期并已排除；
- 除该注入外无阻止使用的控制台错误。

## 11. 数据库 / ZooKeeper / Kafka 边界

- 数据库：**未访问、未读写**（`database_access_status=NONE`、`database_write_status=ZERO`）；
  未执行任何 `SELECT` 之外的连接，也未执行任何 `SELECT`；
- ZooKeeper：**未发起任何访问、未读写**（`zookeeper_task_initiated_access_status=NONE`、
  `zookeeper_write_status=NOT_REQUESTED`）；
- Kafka：**未访问**（`kafka_access_status=NONE`）。

## 12. 零源码 / 测试 / 依赖 / 锁定文件修改证明

被验提交的源码、测试与配置在本轮**零修改**。最终 diff 仅含文档：

```text
frontend_source_diff=ZERO
backend_diff=ZERO
project_test_code_diff=ZERO
dependency_lockfile_diff=ZERO
sql_config_diff=ZERO
```

五个负向变异均已在干净基线上精确还原，`git status --short` 在还原后与提交前均为空。
验收过程中未发现需要修改生产代码或测试代码才能通过的缺陷；若存在此类缺陷，
本任务结果必须为 `FAILED`，本任务不得在内部修复。

## 13. 冻结标记与设计决策

```text
template_rule_approved_count=48
template_rule_draft_count=0
reference_implementation_fact_count=43
proposed_not_implemented_count=0（保留 9 处未实现建议标记）
shared_component_design_decision_approved_count=66
shared_component_design_decision_draft_count=0
```

（上列标记名称以 `README.md` §5.1–§5.3 与 `SHARED_COMPONENT_DESIGN.md` §0.1 的
定义为准；本报告与证据目录不新增任何标记实例，计数范围仍为
`README.md` / `DESIGN.md` / `UI.md` / `MIGRATION.md` 四份模板文档与
`SHARED_COMPONENT_DESIGN.md`。）

模板保留标记与已批准设计决策标记的数量与状态**均无漂移**；本轮**未**修改任何规范设计内容、
候选决策、数值契约或保留标记，仅做最小的状态、下一步入口与审计更新。

## 14. 安全与 Git 校验

- `git diff --check` 与 `git diff --cached --check` 均通过（退出码 0）；
- Git 钩子未被禁用或绕过：`core.hooksPath` 未设置（使用默认 `.git/hooks`），
  仓库中不存在任何非 `.sample` 钩子，未使用 `--no-verify` 等跳过手段；
- 对最终 diff 完成凭据扫描：不含任何口令、令牌、私钥、完整连接串或认证信息
  （`credential_scan_status=CLEAN`）；
- 未执行 `pkill` / `killall` / 模糊匹配或按端口批量杀进程；仅精确停止本任务启动的进程。

## 15. 当前状态与未授权事项

```text
shared_component_design_status=APPROVED
shared_component_implementation_status=IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_CHATGPT_REVIEW
formal_acceptance_execution_status=PASS
formal_acceptance_review_status=PENDING_CHATGPT_REMOTE_GIT_REVIEW
project_owner_acceptance_status=PENDING
page_migration_status=NOT_STARTED
```

本报告是**执行结论**，**不是** ChatGPT 的远程复审结论，也**不是**项目负责人的最终接受。
以下事项本轮**均未**发生、也**不得**据此报告推断为已发生：

- 未声明项目负责人最终接受（`FINAL_ACCEPTED` / `FINAL_ACCEPTED_AND_CLOSED`）、
  未声明 `PROJECT_OWNER_APPROVED`、未声明 `PAGE_MIGRATION_STARTED`；
- 未批准第二个页面迁移、未选择试点页面、未启动任何页面迁移；
- 未修改实现（公共组件、参考页、路由、布局一律零改动）；
- 未降低、删除、跳过或改写任何失败断言，未引入任何非零几何容差；
- 未安装或升级任何依赖，未修改数据库数据，未主动访问或写入 ZooKeeper，未访问 Kafka；
- 未清理任何 worktree，未删除任何既有报告或证据。

参考页“源库快照状态”的 `FINAL_ACCEPTED_AND_CLOSED` 由原 Feature 收口任务确立，
本轮只读取、不重开、不改写。

## 16. 下一入口

```text
next_step=CHATGPT_QUERY_LIST_PAGE_SHARED_COMPONENT_FORMAL_ACCEPTANCE_REVIEW_FROM_REMOTE_GIT
```

## 17. 证据索引

```text
evidence_path=docs/baseline/query-list-page-template/evidence/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001/
service_log_directory=/tmp/query-list-page-shared-component-formal-acceptance-001/
```

| 文件 | 覆盖用例 |
|---|---|
| `AC-001-base-isolation-and-services.md` | AC-001 |
| `AC-002-008-static-contract.md` | AC-002 / 003 / 004 / 005 / 006 / 008 |
| `AC-003-011-012-013-tests-and-contracts.md` | AC-007 / 011 / 012 / 013 |
| `AC-009-010-tooltip.md` | AC-009 / 010 |
| `AC-014-browser-four-viewports.md` | AC-014 |
| `AC-015-strict-geometry.md` | AC-015 |
| `AC-016-negative-controls.md` | AC-016 |
| `AC-017-scope-freeze-safety.md` | AC-017 |
