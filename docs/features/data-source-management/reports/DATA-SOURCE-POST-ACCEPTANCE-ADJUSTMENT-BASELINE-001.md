# DATA-SOURCE-POST-ACCEPTANCE-ADJUSTMENT-BASELINE-001 执行报告

- 任务编号：DATA-SOURCE-POST-ACCEPTANCE-ADJUSTMENT-BASELINE-001
- 日期：2026-08-30
- 分支：`develop`
- 授权基准提交：`5c110bca4374906044cd5f0a99c4cbdae66161ed`
- 结果提交：本任务结果提交（即本报告所在提交；具体 Commit ID 与推送核验结果见任务控制台结果块 result_commit_id / push_status / ahead_behind）
- Push 状态：普通推送至 `origin develop`（推送后核验 `HEAD == origin/develop == ls-remote`，ahead/behind `0 0`）
- 任务性质：纯文档任务，为“数据源管理”正式验收后确认的五项页面调整建立待用户审批的需求、验收与 UI 设计草案，同时对齐三份目标文档的当前实现/验收状态与已完成的正式验收事实

> 本报告记录正式验收后五项页面调整（主列表空状态、可拖动业务弹窗、标签对齐、命名策略弹窗宽度、命名策略单选卡片）的调整草案落盘过程。本任务不修改业务代码、测试代码或配置，不修复 `DS-AC-052`/`DS-AC-105`，不重新执行任何验收用例，不把 `DS-AC-104` 改成通过，不批准新增调整，不进入实现、构建、服务启动或数据库操作。

---

## 1. 任务开始前 Git 现场

- 任务开始前 HEAD：`5c110bca4374906044cd5f0a99c4cbdae66161ed`
- `origin/develop`：`5c110bca4374906044cd5f0a99c4cbdae66161ed`
- ahead/behind：`0 0`，本地与远程一致，可安全快进整合
- 工作区存在多处与本任务无关的既有修改（前端布局/菜单/样式、`.claude/settings.local.json`、`agent-env.sh`、`docs/database/**` 三个历史报告删除、`docs/agent-prompts/**` 与 `docs/prompts/**` 未跟踪提示词等）。本任务对上述无关内容一律保持原样：不修改、不覆盖、不暂存、不提交。

## 2. 授权文件与实际修改范围

| 文件 | 操作 | 修改范围 |
|---|---|---|
| `docs/features/data-source-management/REQUIREMENTS.md` | 修改 | 元数据状态对齐 + 分层状态；§3 标记为历史实施前差距快照；新增 §20 验收后页面调整需求草案（`DS-REQ-110~115`）；变更记录追加 |
| `docs/features/data-source-management/ACCEPTANCE.md` | 修改 | 元数据分层状态；§3 分类数量（合计 115）；新增 §4.15 调整草案用例（`DS-AC-107~115`）；追踪矩阵追加 `DS-REQ-110~115`；变更记录追加 |
| `docs/features/data-source-management/UI.md` | 修改 | 头部元数据分层状态；§0/§0.1 过期状态表述调整为当前事实；新增 §9 验收后页面调整草案设计 |
| `docs/features/data-source-management/reports/DATA-SOURCE-POST-ACCEPTANCE-ADJUSTMENT-BASELINE-001.md` | 新增 | 本报告 |

禁止修改 `DESIGN.md`、`API.md`、`DATABASE.md`、原正式验收报告及其 R1 报告、项目级基线、数据库基线、历史报告，以及任何前后端代码、测试、依赖、配置、菜单或路由——均未修改。

## 3. 三层状态表达

| 层次 | 状态 | 说明 |
|---|---|---|
| 原批准基线 | `APPROVED` | 原需求 `DS-REQ-001~109`、原验收标准 `DS-AC-001~106`、原 UI 设计基线保持已批准，编号与正文逐字冻结 |
| 原正式验收 | `FAIL`（PASS=103/FAIL=2/BLOCKED=1/NOT_RUN=0） | `DS-AC-052`、`DS-AC-105` 为 FAIL，`DS-AC-104` 为 BLOCKED，保持不变 |
| 新调整草案 | `DRAFT_PENDING_USER_REVIEW` | 新增 `DS-REQ-110~115`（6 条）与 `DS-AC-107~115`（9 条，全部 `NOT_RUN`），尚未获得用户正式批准、尚未实现、尚未执行，不并入原正式验收统计 |

三份文档均分别表达上述分层状态，不使用含义不清的单一状态覆盖。

## 4. 新增清单

### 4.1 新增需求 `DS-REQ-110~115`（6 条，`DRAFT_PENDING_USER_REVIEW`）

- `DS-REQ-110`：主列表两类空状态（有生效查询条件零结果 / 无生效查询条件无数据）的触发依据与两级文案。
- `DS-REQ-111`：空状态无重复重置入口；中性灰色信息样式；主辅提示层级与留白。
- `DS-REQ-112`：三个业务弹窗可拖动（仅标题栏非控件区域、不可完全拖出、窗口变化修正、重开居中）；小型确认框固定居中不可拖动。
- `DS-REQ-113`：三个业务弹窗表单标签固定宽度左对齐、输入框左边界一致、必填星号不错位（含动态标签 `Service Name/数据库名`）。
- `DS-REQ-114`：“目标库命名策略”弹窗桌面端约 `1050px` 响应式宽度、五行展示、七列布局、长内容省略 + 悬停完整值。
- `DS-REQ-115`：`TABLE_MERGE` 与 `CUSTOM_PREFIX_SUFFIX` 横向单选卡片（第一行单选按钮 + 策略名称、第二行固定说明、整卡点击、蓝色边框浅蓝背景选中态），前后缀联动保持既有规则。

### 4.2 新增验收用例 `DS-AC-107~115`（9 条，全部 `NOT_RUN`）

`DS-AC-107`（DS-REQ-110）、`DS-AC-108`（DS-REQ-110）、`DS-AC-109`（DS-REQ-111）、`DS-AC-110`（DS-REQ-112）、`DS-AC-111`（DS-REQ-112）、`DS-AC-112`（DS-REQ-113）、`DS-AC-113`（DS-REQ-114）、`DS-AC-114`（DS-REQ-114）、`DS-AC-115`（DS-REQ-115/079/080）。

需求—验收追踪矩阵追加 `DS-REQ-110~115` 行；原 `DS-REQ-001~109` 追踪行保持不变。

## 5. 为什么不修改 DESIGN/API/DATABASE

- 两个失败点（`DS-AC-052`：MyBatis DEBUG 参数日志泄露密码；`DS-AC-105`：`port:"abc"` 返回 HTTP 500 而非 HTTP 400/code=400）已有批准需求/API 契约，属于既有需求与契约实现缺陷，不需要重新定义，本任务不改判定、不修复。
- 五项新增调整只涉及前端页面交互与视觉，不改变后端 API、数据库结构或维护边界，因此 DESIGN/API/DATABASE 无需修改。

## 6. 两个 FAIL、一个 BLOCKED 保持不变

- `DS-AC-052`：密码进入 MyBatis DEBUG 参数日志，违反既有 `DS-REQ-047/107`，保持 FAIL；本任务不新增需求、不改判定、不修复。
- `DS-AC-105`：`port:"abc"` 返回 HTTP 500 而非批准 API 契约要求的 HTTP 400/code=400，保持 FAIL；本任务不修改 API 契约、不改判定、不修复。
- `DS-AC-104`：MySQL 远程授权未放行、Doris 无可用验收环境，保持 BLOCKED，待 MySQL 授权与 Doris 环境具备后补验。
- 修复方案未写成已实现事实。

## 7. 机械核验

| 检查项 | 结果 |
|---|---|
| 原 `DS-REQ-001~109` 编号和文本相对 `5c110bc` 逐行完全一致 | 通过 |
| 新 `DS-REQ-110~115` 连续、唯一，共 6 条 | 通过 |
| 原 `DS-AC-001~106` 全行相对 `5c110bc` 完全一致 | 通过 |
| 新 `DS-AC-107~115` 连续、唯一，共 9 条，全部 `NOT_RUN` | 通过 |
| 原正式验收统计仍为 PASS 103、FAIL 2、BLOCKED 1、NOT_RUN 0 | 通过 |
| FAIL 仍仅为 `DS-AC-052/105`，BLOCKED 仍仅为 `DS-AC-104` | 通过 |
| 需求追踪矩阵原 001~109 行不变，新 110~115 均至少被一条新用例覆盖，无无效引用 | 通过 |
| 三份文档对基础基线、调整草案、当前实现、原正式验收的状态表达一致 | 通过 |
| DESIGN/API/DATABASE、原验收报告、R1 报告及所有非授权文件相对基准零 diff | 通过 |
| 不存在把新调整写成 `APPROVED/PASS/IMPLEMENTED` 的表述 | 通过 |
| `git diff --check` 通过 | 通过 |
| 最终提交仅含 4 个授权文件 | 通过 |

## 8. 安全与脱敏声明

- 本报告与 Git 文件不写入任何真实密码。
- 本任务未连接数据库、ZooKeeper，未执行 SQL/DDL，未启动服务，未构建或运行测试；未修改任何代码、测试或配置。

## 9. 结果提交与 Push 核验

- 结果提交：本报告所在提交（DATA-SOURCE-POST-ACCEPTANCE-ADJUSTMENT-BASELINE-001 结果提交）
- 推送后核验：推送后执行 `git rev-parse HEAD`、`git rev-parse origin/develop` 与 `git ls-remote` 比对一致，ahead/behind 为 `0 0`

## 10. 后续

- 本任务仅建立调整草案，不进入代码修复、页面修改、服务启动或复验。
- 下一步：`CHATGPT_REVIEW_POST_ACCEPTANCE_ADJUSTMENT_BASELINE`
