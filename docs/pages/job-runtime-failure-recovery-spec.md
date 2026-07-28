# Job 运行与故障恢复页面及接口规格

> 任务编号：041
> 规格日期：2026-07-28
> 修订日期：2026-07-28（v1.2，依据 043 视觉验收结论修订）
> 规格依据：040-job-failure-data-association-and-closure-analysis.md（含用户确认结论）；043 视觉验收修订结论
> 数据来源：CDC_JOB_FAILURE_EVENT、CDC_JOB_FAILURE_HANDLE_LOG、CDC_CLIENT_MULTIPLE、CDC_DATA_SOURCE
> 读写性质：只读
> 本任务边界：仅规格设计，不修改数据库、前后端代码或索引

---

## 1. 执行摘要

本文档基于 040 任务的数据关联与故障闭环分析最终结论，编制"Job 运行与故障恢复"功能的正式页面规格和后端接口规格。

**核心设计决策**：

| 决策项 | 结论 |
|--------|------|
| 信息层级 | 客户端 → 逻辑 Job → 数据库故障恢复过程 → 物理 Job 失败事件 → 处理记录 |
| 主页面 | 按客户端分组折叠，每个客户端下列出全部逻辑 Job |
| 详情页 | 独立页面，两个页签：最近一次故障 + 历史故障 |
| 状态体系 | **两级状态**：Job 当前状态（正常/恢复中）+ 故障过程状态（已恢复/等待重启/重启中/恢复失败/流程异常） |
| 接口数量 | 5 个：主页面概览、最近故障详情、历史故障摘要（时间范围）、指定故障详情、长文本懒加载 |
| 聚合策略 | Java 内存聚合（方案 C），SQL 只做简单 JOIN 查询 |
| 历史查询 | 按完整故障过程聚合，时间范围筛选（最近一天/一周/一个月），不设分页 |
| 刷新策略 | 主页面默认 1 分钟自动刷新，提供 1/60/360 分钟三档 |

---

## 2. 依据和已确认结论

### 2.1 依据文档

| 文档 | 用途 |
|------|------|
| `docs/database/040-job-failure-data-association-and-closure-analysis.md` | 数据关联分析、状态算法、聚合方案 |
| `docs/database/040-job-failure-data-association-and-closure-analysis-answers.md` | 用户对 6 个问题 + 3 个阻塞项的确认答复 |
| `docs/database/job-failure-record-analysis.md` | 表结构初步分析 |
| 项目根目录 `CLAUDE.md` | 开发规范与环境约束 |

### 2.2 已确认结论（继承自 040）

| 编号 | 结论 | 来源 |
|------|------|------|
| C-1 | 逻辑 Job = (CLIENT_ID, DATA_SOURCE_ID) | C-1 |
| C-2 | 客户端主数据来源为 CDC_CLIENT_MULTIPLE，CDC_CLIENT 已废弃 | Q-1 答复 |
| C-3 | 当前页面数据完全从数据库表读取，不关联 ZooKeeper | Q-2 答复 |
| C-4 | DATA_SOURCE_ID 是 CDC_DATA_SOURCE 主键 | C-2 |
| C-5 | 两表通过 FAILURE_EVENT_ID 一对多关联 | C-3 |
| C-6 | 处理日志排序：HANDLE_TIME ASC, ID ASC | C-4 |
| C-7 | 物理 Job 链：FAILED_JOB_ID → 同事件日志中第一条 NEW_JOB_ID → 下一事件 FAILED_JOB_ID | C-6 |
| C-8 | STABLE_CHECK_PASSED = 故障恢复闭环，无冷却期 | Q-3/Q-4 答复 |
| C-9 | 故障切分无时间阈值；STABLE_CHECK_PASSED 之后的新失败属于新故障过程 | Q-3 答复 |
| C-10 | 页面层级为四层：客户端 → 逻辑 Job → 数据库故障 → 物理 Job 失败事件 → 处理记录 | 040 任务文档第四节 |
| C-11 | 两张失败表只插入、不更新、不删除 | C-11 |
| C-12 | 推荐 Java 内存聚合方案（方案 C） | 040 第十三节 |
| C-13 | "正常"绿色，其余状态红色（仅限 Job 当前状态；故障过程状态中"已恢复"为绿色，其余为红色） | 040 第九节 + 043 修订 |

### 2.3 041 阶段已确认结论

| 编号 | 结论 | 来源 |
|------|------|------|
| C-14 | 主页面仅展示 CDC_CLIENT_MULTIPLE 中 FG_ACTIVE='1' 的客户端 | Q-1（已确认） |
| C-15 | 展示活跃客户端配置中声明的全部逻辑 Job，即使没有运行记录或失败记录 | Q-2（已确认） |
| C-16 | FAILURE_DETAIL、ERROR_DETAIL 通过独立 GET 接口按需懒加载 | Q-3（已确认） |
| C-17 | 无失败记录的逻辑 Job 保留"查看记录"按钮，进入详情页显示"暂无故障记录" | Q-4（已确认） |

### 2.4 043 视觉验收修订结论

| 编号 | 结论 | 来源 |
|------|------|------|
| C-18 | 采用两级状态体系：Job 当前状态（正常/恢复中）+ 故障过程状态（已恢复/等待重启/重启中/恢复失败/流程异常） | 043 第四条 |
| C-19 | 客户端标题栏增加正常数量和异常数量；异常数量>0 默认展开，异常数量=0 默认折叠 | 043 第五、十一条 |
| C-20 | 主页面删除"业务库/数据源"和"机构"相关字段 | 043 第五条 |
| C-21 | 历史故障删除分页，改为时间范围下拉（最近一天/一周/一个月） | 043 第七条 |
| C-22 | 当前未闭环故障不受时间范围限制，始终展示并置顶 | 043 第七条 |
| C-23 | 点击历史记录"查看"后打开独立的指定故障详情页面（路由含 faultRootId），不切换页签 | 043 第七条 |
| C-24 | 事件卡片按时间正序排列；已闭环默认展开最后一个事件，未闭环展开当前处理事件 | 043 第六条 |
| C-25 | 时间线颜色：普通=蓝色，等待=橙色，闭环=绿色，失败=红色，辅助=灰色；紧凑两层布局 | 043 第六条 |
| C-26 | CLOB 长文本默认最多显示 3 行，超出后通过"展开全文"经独立接口懒加载 | 043 第六条 |
| C-27 | 不采用 glassmorphism 风格，保持扁平边框风格 | 043 第五条 |
| C-28 | 返回入口文案："返回 Job 运行与故障恢复"；返回后恢复展开状态、滚动位置和刷新周期 | 043 第六条 |

---

## 3. 术语与信息层级

### 3.1 统一术语

| 术语 | 定义 | 数据来源 |
|------|------|----------|
| 客户端 | 以 CLIENT_ID 识别的 CDC 客户端进程 | CDC_CLIENT_MULTIPLE |
| 逻辑 Job | 某客户端对某数据源的长期采集任务，键 = (CLIENT_ID, DATA_SOURCE_ID) | CDC_JOB_FAILURE_EVENT + CDC_DATA_SOURCE |
| 物理 Job | 逻辑 Job 在某次运行中的 Flink Job 实例，有唯一 JOB_ID（UUID） | CDC_JOB_FAILURE_EVENT.FAILED_JOB_ID |
| 物理 Job 失败事件 | CDC_JOB_FAILURE_EVENT 中的一条记录 | CDC_JOB_FAILURE_EVENT |
| 失败事件处理记录 | CDC_JOB_FAILURE_HANDLE_LOG 中针对某失败事件的一条处理记录 | CDC_JOB_FAILURE_HANDLE_LOG |
| 数据库故障 | 导致一个或多个物理 Job 连续失败的上游故障（页面展示概念，非数据库实体） | 由失败事件链推导 |
| 数据库故障恢复过程 | 从首次物理 Job 失败开始，通过若干次重启，直到某事件出现 STABLE_CHECK_PASSED 的完整过程 | 由事件链推导 |
| 已闭环故障 | 链条末端事件存在 HANDLE_STAGE = STABLE_CHECK_PASSED | CDC_JOB_FAILURE_HANDLE_LOG |
| 未闭环故障 | 链条末端事件不存在 STABLE_CHECK_PASSED | CDC_JOB_FAILURE_HANDLE_LOG |
| 故障过程标识 | 由链首事件的 ID（即故障过程内第一个失败事件的 ID）作为聚合标识 | CDC_JOB_FAILURE_EVENT.ID |
| Job 当前状态 | 逻辑 Job 层级的概览状态，仅两种取值：正常、恢复中，用于主页面和详情页顶部 | 由故障过程推导 |
| 故障过程状态 | 一次数据库故障恢复过程的详细状态，五种取值：已恢复、等待重启、重启中、恢复失败、流程异常 | 由故障过程事件链推导 |

### 3.2 信息层级

```
客户端（CLIENT_ID）
  └─ 逻辑 Job（CLIENT_ID + DATA_SOURCE_ID）
       └─ 数据库故障恢复过程（由物理 Job 链聚合）
            ├─ 物理 Job 失败事件 #1
            │    ├─ 处理记录 #1
            │    ├─ 处理记录 #2
            │    └─ ...
            ├─ 物理 Job 失败事件 #2
            │    └─ 处理记录 ...
            └─ ...
```

---

## 4. 主页面规格

### 4.1 页面标识

| 属性 | 值 |
|------|-----|
| 页面名称 | Job 运行与故障恢复 |
| 菜单路径 | 运行监控 > Job 运行与故障恢复 |
| 路由路径 | `/monitor/job-failure` |
| 页面类型 | 只读监控列表（客户端分组 + 逻辑 Job 表格） |

### 4.2 页面顶部

取消查询区，仅保留：

- **最近刷新时间**：格式 `YYYY-MM-DD HH:mm:ss`，显示上一次数据成功加载的时间
- **自动刷新周期选择**：三个按钮切换 —— 1 分钟 / 60 分钟 / 360 分钟，默认选中 1 分钟
- **手动刷新按钮**：点击立即触发数据重新加载

#### 刷新行为规则

| 规则 | 定义 |
|------|------|
| 首次加载 | 进入页面立即发起主页面接口请求，加载完成后显示数据并启动自动刷新定时器 |
| 自动刷新触发 | 定时器按所选周期到期后自动发起请求 |
| 手动刷新触发 | 用户点击刷新按钮，立即发起请求；不重置定时器（在下一个周期到时正常触发） |
| 刷新防重复 | 刷新进行中时，手动刷新按钮置灰/禁用，自动刷新周期到时跳过（等下一次） |
| 刷新失败 | 保留旧数据不变，顶部显示"刷新失败，点击重试"提示条；不自动重试 |
| 折叠状态保持 | 刷新后客户端展开/折叠状态恢复刷新前状态（通过 clientId 集合记录展开项） |
| 滚动位置 | 刷新后尽量保持滚动位置（不做精确定位恢复，不强制滚回顶部） |
| 离开销毁 | 路由离开时清除自动刷新定时器；再次进入时重新开始首次加载 |

### 4.3 客户端分组

主内容按客户端分组展示，每个客户端为可折叠区域（使用 Element Plus `el-collapse` 或等价组件）。

#### 标题栏内容（五项）

| 字段 | 来源 | 说明 |
|------|------|------|
| 客户端 ID | CLIENT_ID | 如 `hosp-006` |
| Job 总数 | 该客户端下逻辑 Job 数量 | 从该客户端 DATA_SOURCE_ID（逗号分隔解析）计算 |
| 正常数量 | `Job 当前状态=正常`的逻辑 Job 数量 | 浅绿色标签 |
| 异常数量 | `Job 当前状态=恢复中`的逻辑 Job 数量 | 浅红色标签 |
| 最近更新时间 | MAX(该客户端下所有逻辑 Job 的最近更新时间) | 格式 `YYYY-MM-DD HH:mm:ss` |

必须满足：`Job 总数 = 正常数量 + 异常数量`。异常数量为 0 时仍显示"异常 0"。数量随主页面数据刷新同步更新。

视觉样式：
- Job 总数：中性灰标签
- 正常数量：浅绿色标签（`background: #f0f9eb; color: #67C23A; border: 1px solid #e1f3d8`）
- 异常数量：浅红色标签（`background: #fef0f0; color: #F56C6C; border: 1px solid #fde2e2`）
- 不增加客户端状态圆点
- 不增加红色左边框
- 不得展示正常/恢复中/异常的文字数量

#### 排序与展开规则

| 规则 | 定义 |
|------|------|
| 客户端排序 | 按 CLIENT_ID 升序（字符串比较） |
| 默认展开 | 异常数量 > 0 → 默认展开；异常数量 = 0 → 默认折叠 |
| 展开状态保持 | 用户手动展开或折叠后，本次页面访问期间保持用户选择；自动刷新不得重置用户展开状态 |
| 无逻辑 Job 时 | 显示"暂无逻辑 Job"，不展示空表格 |
| 信息不完整时 | CLIENT_DESC 为空时仅显示 CLIENT_ID；DATA_SOURCE_ID 为空时显示"--"并有 tooltip 提示"数据源信息缺失" |

#### 客户端信息来源

主页面客户端列表 = CDC_CLIENT_MULTIPLE 中 FG_ACTIVE='1' 的客户端。

对于每个客户端，逻辑 Job 列表 = 该客户端 DATA_SOURCE_ID（逗号分隔解析）中声明的全部数据源。即使某数据源没有运行记录或失败记录，也应在列表中展示。

### 4.4 逻辑 Job 列表

每个客户端分组内展示该客户端的全部逻辑 Job，使用表格（`el-table`）。

#### 列定义

| 列名 | 宽度 | 来源 | 说明 |
|------|------|------|------|
| 数据源 ID | 200px | DATA_SOURCE_ID | 技术标识，可复制 |
| 数据源名称 | 自适应 | CDC_DATA_SOURCE.DATA_SOURCE_NAME | 如 "oracle-业务库33" |
| Job 当前状态 | 100px | 见状态体系 §8 | 正常=绿色文字+浅绿色背景标签；恢复中=红色文字+浅红色背景标签 |
| 当前物理 Job ID | 280px | 见计算口径 §9.2 | 截断显示前 16 位 + "..."，可点击复制完整值；悬停截断值可查看完整 Job ID；无依据时显示"--" |
| 最近失败时间 | 180px | 最近一次故障过程的首次失败时间 | 从未失败显示"--" |
| 最近恢复时间 | 180px | 最近一次故障过程的恢复时间（STABLE_CHECK_PASSED 的 HANDLE_TIME） | 未恢复显示"--" |
| 本次重启次数 | 100px | 最近一次故障过程的重启次数 | 从未失败显示"--" |
| 操作 | 100px | -- | "查看记录"按钮 |

不展示"业务库/数据源""业务库""机构"或 `DATA_SOURCE_ORG` 字段。不展示物理 Job 演变链。

#### 逻辑 Job 的稳定唯一键

```
CLIENT_ID + DATA_SOURCE_ID
```

#### "当前物理 Job ID"的空值语义

NULL 表示：该逻辑 Job 从未有过失败记录，且不在 CDC_DATA_SOURCE_RUN_STATE 中，无法推断当前运行的物理 Job ID。前端展示 "--"。

#### "最近失败时间"的精确定义

该逻辑 Job 最近一次数据库故障恢复过程的**链首事件 FAILURE_TIME**。如从未失败则为 NULL。

#### "最近恢复时间"的精确定义

若最近故障过程已闭环 → 链尾事件中 STABLE_CHECK_PASSED 记录的 HANDLE_TIME。
若最近故障过程未闭环 → NULL（展示 "--"）。

#### "本次重启次数"的精确定义

最近一次故障过程中，链尾事件日志中 RESTART_COUNT_TOTAL 的最大值。若为 NULL 则取链尾事件的 ATTEMPT_NO。

#### 从未失败的逻辑 Job

- Job 当前状态 → "正常"（绿色标签）
- "正常"仅表示当前失败恢复记录中不存在未闭环故障，不代表已证明物理 Job 正常运行
- 无运行依据的"正常"应提供悬停说明：**"当前失败恢复记录中不存在未闭环故障，不代表已验证物理 Job 正在运行"**
- 当前物理 Job ID → 尝试从 CDC_DATA_SOURCE_RUN_STATE 或失败表推算，如无数据则 "--"
- 最近失败时间 → "--"
- 最近恢复时间 → "--"
- 本次重启次数 → "--"
- "查看记录"按钮 → 可用，进入后显示"暂无故障记录"

#### 排序规则

逻辑 Job 在客户端分组内按以下规则排序：
1. 有未闭环故障的（Job 当前状态=恢复中）排在最前
2. 其余按 DATA_SOURCE_ID 升序

#### Job ID 展示

- 列表展示：截断为前 16 位 + "..."（如 `783e7f54d0c2420e...`）
- hover tooltip：显示完整 Job ID
- 使用 Element Plus 标准复制图标，悬停复制图标提示"复制完整 Job ID"
- 点击复制按钮：复制完整 Job ID 到剪贴板，提示"已复制"

#### 状态颜色

- `正常`：绿色文字 `#67C23A` + 浅绿色背景标签（`background: #f0f9eb`）
- `恢复中`：红色文字 `#F56C6C` + 浅红色背景标签（`background: #fef0f0`）
- 不增加状态圆点

---

## 5. 详情页规格

### 5.1 页面标识

| 属性 | 值 |
|------|-----|
| 路由路径 | `/monitor/job-failure/:clientId/:dataSourceId` |
| 页面类型 | 独立详情页（非弹窗/抽屉） |
| 面包屑 | 运行监控 > Job 运行与故障恢复 > 故障详情 |

### 5.2 顶部信息区

详情页顶部展示逻辑 Job 的稳定信息：

| 字段 | 来源 |
|------|------|
| 客户端 ID | CLIENT_ID |
| 数据源 ID | DATA_SOURCE_ID |
| 数据源名称 | CDC_DATA_SOURCE.DATA_SOURCE_NAME |
| Job 当前状态 | 仅"正常"或"恢复中"（含颜色） |
| 当前物理 Job ID | 见 §9.2，保留标准复制按钮 |
| 最近更新时间 | 同主页面的客户端最近更新时间 |

不展示"机构""业务库"或"数据源名称/机构"组合字段。

### 5.3 页签结构

两个页签：
1. **最近一次故障**（默认激活）
2. **历史故障**

页签切换时保留各自内部状态（展开/折叠、滚动位置）。

### 5.4 返回入口

入口文案：**"← 返回 Job 运行与故障恢复"**

返回后恢复：
- 客户端展开状态
- 页面滚动位置
- 当前自动刷新周期

### 5.5 详情页刷新规则

| 规则 | 定义 |
|------|------|
| 自动刷新 | 详情页默认**不**自动刷新。用户通过浏览器刷新或手动点击刷新按钮更新 |
| 手动刷新 | 顶部提供手动刷新按钮 |
| 刷新后状态保持 | 刷新后保持当前页签、事件卡片展开状态 |

---

## 6. 最近一次故障页签

默认页签，展示该逻辑 Job 最新一个数据库故障恢复过程（无论是否闭环）。

若无任何故障记录，展示"暂无故障记录"空状态。

### 6.1 汇总区域

汇总信息按两层视觉组织。

#### 第一视觉层（核心状态）

| 字段 | 已闭环时 | 未闭环时 | 数据不完整时 |
|------|----------|----------|-------------|
| 首次失败时间 | 链首事件 FAILURE_TIME | 同左 | 链首事件 FAILURE_TIME（如有） |
| 最终恢复时间 | STABLE_CHECK_PASSED 的 HANDLE_TIME | "--（尚未恢复）" | "--（数据不完整）" |
| 故障持续时间 | 恢复时间 - 首次失败时间，格式如 `48分6秒` | 当前时间 - 首次失败时间，格式如 `2分30秒（持续中）` | "--" |
| 故障过程状态 | "已恢复"（绿色） | 5 种详细状态之一（红色） | "流程异常"（红色） |

持续时间显示格式：`X小时Y分`、`X分Y秒` 或 `X秒`，不插入不必要的空格。

#### 第二视觉层（明细）

| 字段 | 已闭环时 | 未闭环时 | 数据不完整时 |
|------|----------|----------|-------------|
| 失败事件数 | 链中事件总数 | 同左 | 已知事件数 + "（可能不完整）" |
| 重启次数 | 链尾 RESTART_COUNT_TOTAL 或 ATTEMPT_NO | 同左 | 已知重启次数 |
| 初始物理 Job ID | 链首 FAILED_JOB_ID（可复制） | 同左 | 链首 FAILED_JOB_ID |
| 当前/最终物理 Job ID | STABLE_CHECK_PASSED 的 NEW_JOB_ID | 最近 NEW_JOB_SUBMIT_SUCCEEDED 的 NEW_JOB_ID | 最近有值记录的 NEW_JOB_ID |
| 最近处理时间 | STABLE_CHECK_PASSED 的 HANDLE_TIME | 链尾最后一条日志的 HANDLE_TIME | 已知最后处理时间 |
| 物理 Job 演变链 | 从左到右按时间正序排列所有物理 Job ID | 同左 | 已知部分 + 异常标注 |

不展示与结构化字段重复的说明文字（如"3次失败事件，2次重启，已恢复"）。

### 6.2 物理 Job 失败事件卡片

一次故障过程中的每条 `CDC_JOB_FAILURE_EVENT` 使用一张独立卡片，按 **FAILURE_TIME 升序**（时间正序）排列：

```text
事件 1 → 事件 2 → 事件 3（最早 → 最新）
```

#### 卡片摘要

| 字段 | 来源 |
|------|------|
| 轮次 | 该事件在故障过程中的序号（从 1 开始） |
| 失败物理 Job ID | FAILED_JOB_ID（可复制） |
| 新物理 Job ID | 该事件第一条非空 NEW_JOB_ID（可复制），无则 "--" |
| 失败时间 | FAILURE_TIME |
| 本事件处理结果 | 事件最后一个 HANDLE_STAGE 的中文映射，或 EVENT_RESULT |
| 本事件最后处理时间 | 事件最后一条日志的 HANDLE_TIME |
| 处理记录数量 | 该事件的日志条数 |

不增加"首次失败"或"最终恢复"卡片标签。最后一个成功事件可显示"故障恢复闭环"。

#### 卡片默认展开规则

| 场景 | 默认展开 |
|------|----------|
| 已闭环故障 | 展开**最后一个**失败事件（链尾，含 STABLE_CHECK_PASSED） |
| 未闭环故障 | 展开**当前正在处理**的事件（链尾） |
| 存在异常链 | 异常事件默认展开 |
| 其他事件 | 默认折叠 |
| 单事件故障 | 始终展开 |

用户手动展开/折叠状态在页面刷新后尽量保持（基于事件 ID 记录展开集合）。用户手动展开状态不得因 CLOB 懒加载而改变。

### 6.3 卡片内处理时间线

每条 CDC_JOB_FAILURE_HANDLE_LOG 按 HANDLE_TIME ASC, ID ASC 排列为时间线。

#### 时间线颜色规则

| 节点类型 | 颜色 | 适用 HANDLE_STAGE |
|----------|------|-------------------|
| 普通处理 | 蓝色 | JOB_FAILURE_RECEIVED、RESTART_STARTED、NEW_JOB_SUBMIT_SUCCEEDED |
| 等待/计划 | 橙色 | RESTART_SCHEDULED、SCHEDULED_RESTART_SKIPPED |
| 成功闭环 | 绿色 | STABLE_CHECK_PASSED |
| 失败/异常 | 红色 | NEW_JOB_SUBMIT_FAILED、JOB_FAILURE_IGNORED_*、DUPLICATED_EVENT_IGNORED |
| 辅助信息 | 灰色 | 元数据标签 |

不增加独立颜色图例。每个节点必须同时有清楚文字。

#### 紧凑两层结构

- 第一行：时间、处理阶段、处理结果
- 第二行：尝试次数、退避时间、计划重启时间、新物理 Job ID 等补充信息
- 避免右侧大面积空白和页面过度拉长

#### 展示字段

| 展示字段 | 来源 |
|----------|------|
| 时间 | HANDLE_TIME（格式 YYYY-MM-DD HH:mm:ss） |
| 处理阶段 | HANDLE_STAGE → 中文映射 |
| 处理说明 | REMARK（非空时展示） |
| 处理结果 | HANDLE_STAGE 的中文含义描述 |
| 异常信息 | ERROR_DETAIL（详见下方 CLOB 处理规则） |
| 重启延迟 | RESTART_DELAY_SECONDS（仅在 RESTART_SCHEDULED 阶段展示） |
| 计划重启时间 | NEXT_RESTART_TIME（仅在 RESTART_SCHEDULED 阶段展示） |
| 连续失败次数 | CONSECUTIVE_FAILURES（非空时展示） |
| 累计重启次数 | RESTART_COUNT_TOTAL（非空时展示） |

#### CLOB 长文本处理

`FAILURE_DETAIL`、`ERROR_DETAIL`：
- 默认最多显示 3 行，超出后显示"展开全文"
- 通过独立接口 API-5 懒加载完整内容
- 加载后支持"收起"和"复制全文"
- 加载失败只影响长文本区域，不阻塞页面其他功能
- 敏感连接串、账号或参数按正式规格脱敏

### 6.4 物理 Job 演变链

- 详情页在汇总区域第二视觉层展示物理 Job 演变链
- 按时间正序从左到右排列所有物理 Job ID
- 每个 Job ID 支持复制和悬停查看完整值
- 当前或最终 Job 使用稍强的蓝色边框
- Job 数量较多时允许横向滚动，不能省略中间节点
- 异常分叉或断链应在对应位置显示明确警告

### 6.5 异常链提示

采用中等强度提示：
- 卡片标题栏右侧显示红色"异常链"标签
- 卡片左边框使用 3px 红色（`border-left: 3px solid #F56C6C`）
- 显示一行异常摘要
- 提供"查看异常详情"入口
- 不使用大面积深红背景
- 只有实际检测到异常链时，才显示带文字的"异常链"红色标签

#### HANDLE_STAGE 中文映射表

| HANDLE_STAGE | 中文名称 | 说明 |
|-------------|----------|------|
| JOB_FAILURE_RECEIVED | 收到失败事件 | 故障检测入口 |
| JOB_FAILURE_IGNORED_INVALID | 忽略（无效事件） | 事件校验未通过 |
| JOB_FAILURE_IGNORED_STALE | 忽略（过期事件） | 事件已过期 |
| DUPLICATED_EVENT_IGNORED | 忽略（重复事件） | 重复事件已处理 |
| RESTART_SCHEDULED | 已安排重启 | 含退避延迟 |
| SCHEDULED_RESTART_SKIPPED | 跳过计划重启 | 条件不满足 |
| RESTART_STARTED | 开始重启 | 到达计划时间 |
| NEW_JOB_SUBMIT_SUCCEEDED | 新 Job 提交成功 | 新物理 Job 已创建 |
| NEW_JOB_SUBMIT_FAILED | 新 Job 提交失败 | 重启失败 |
| STABLE_CHECK_PASSED | 稳定性检查通过 | 恢复闭环 |

#### 禁止补造处理步骤

处理日志有几条就展示几条。不做固定步骤数假设，不为了视觉整齐而补造缺失步骤。

---

## 7. 历史故障页签

### 7.1 时间范围筛选

历史故障第一版**不分页**。页面提供时间范围下拉选项：

- 最近一天（默认）
- 最近一周
- 最近一个月

查询规则：
- 查询依据为故障过程的**首次失败时间**
- 一次性返回所选范围内的故障过程摘要
- 第一版不提供任意起止日期
- 时间范围最长为最近一个月

### 7.2 未闭环故障的跨时间范围规则

筛选语义为：**当前未闭环故障 + 所选时间范围内开始的历史故障**。

- 当前未闭环故障不受时间范围限制，始终展示并置顶
- 多个未闭环故障之间按首次失败时间倒序
- 已闭环故障随后按首次失败时间倒序
- 同一个逻辑 Job 正常情况下只应存在一个未闭环故障
- 发现多个未闭环故障时，应作为数据或流程异常明确提示

### 7.3 最大故障过程数量保护

为避免数据量过大，后端应设置最大故障过程数量保护。限制对象是聚合后的故障过程数，不是 `CDC_JOB_FAILURE_EVENT` 明细数。具体上限在数据库数据量分析后确定，不在规格中擅自写死。

超过上限时页面提示：**"当前仅展示最新的部分故障过程，请缩小查询范围。"**

API 响应中增加 `truncated: boolean` 字段标识是否被截断。

### 7.4 历史列表

历史故障按故障过程聚合，不按原始失败事件分页。列表只返回摘要，不包含事件卡片、处理时间线或 CLOB。

| 列 | 来源 | 宽度 |
|----|------|------|
| 首次失败时间 | 故障过程链首事件 FAILURE_TIME | 180px |
| 最终恢复时间 | STABLE_CHECK_PASSED 的 HANDLE_TIME，未闭环时 "--" | 180px |
| 持续时间 | 恢复时间 - 开始时间（已闭环）/ 当前时间 - 开始时间 + "（持续中）" | 140px |
| 故障过程状态 | "已恢复"（绿色标签）/ 4 种异常状态之一（红色标签） | 110px |
| 失败事件数 | 故障过程内事件数量 | 100px |
| 重启次数 | 链尾 RESTART_COUNT_TOTAL 最大值 | 100px |
| 初始物理 Job ID | 链首 FAILED_JOB_ID（可复制） | 200px |
| 当前/最终物理 Job ID | 链尾 NEW_JOB_ID（可复制） | 200px |
| 异常链 | 是否存在异常链标记（是/否） | 80px |
| 操作 | "查看"按钮 | 80px |

示例数据必须体现失败事件数与重启次数不一定相等，例如：

| 失败事件数 | 重启次数 | 故障过程状态 |
|---:|---:|---|
| 1 | 0 | 等待重启 |
| 3 | 2 | 已恢复 |
| 5 | 4 | 已恢复 |

### 7.5 持续时间计算与显示

计算规则：
- 已闭环：`最终恢复时间 - 首次失败时间`
- 未闭环：`当前时间 - 首次失败时间`（随页面数据刷新重新计算，不要求每秒刷新）
- 时间缺失、倒置或产生负数时显示 `--`，并按流程异常处理

显示格式：
- `2分30秒（持续中）`
- `48分6秒`
- `1小时15分`

删除数字之间不必要的空格。

### 7.6 无故障记录

- "最近一次故障"和"历史故障"页签均保留
- 历史页签显示"暂无故障记录"
- 不显示表格空行、时间范围下拉或未闭环提示
- 顶部 Job 当前状态显示"正常"
- 当前物理 Job ID 无依据时显示 `--`
- 保留"正常不代表已验证物理 Job 正在运行"的悬停解释

### 7.7 未闭环行样式

- 使用很浅的红色背景（`background: #fef0f0`）
- 故障过程状态使用浅红色标签
- 顶部可保留低强度提示"当前存在未闭环故障，已置顶显示"
- 删除无明确含义的黄色警告图标
- 只有实际检测到异常链时，才显示带文字的"异常链"红色标签

### 7.8 查看指定故障

点击历史记录"查看"后：
- 打开**独立的"指定故障详情"页面**，不切换或伪装成"最近一次故障"页签
- 页面结构复用故障详情组件（汇总 + 物理 Job 演变链 + 事件卡片 + 处理时间线 + CLOB 懒加载）
- 路由：`/monitor/job-failure/:clientId/:dataSourceId/fault/:faultRootId`
- URL 中包含故障过程标识（`faultRootId`），刷新后仍能打开同一故障
- 页面标题使用"指定故障详情"或"历史故障详情"，并显示首次失败时间
- 根据故障过程唯一标识（链首事件 ID）查询指定故障
- 返回后恢复历史故障页签、时间范围和滚动位置

### 7.9 与"最近一次故障"页签的关系

- "最近一次故障"页签：展示最新一个故障过程（优先未闭环，其次取首次失败时间最新的已闭环），含完整汇总+卡片+时间线
- "历史故障"页签：展示该逻辑 Job 的**全部**故障过程（含最新故障），以时间范围筛选+列表形式，点击"查看"进入独立详情页
- 最新故障过程同时出现在两个页签，职责不同：最近故障页签是快捷详情视图，历史故障页签是完整列表视图

---

## 8. 状态体系

页面采用**两级状态**，不在所有位置直接展示同一套状态。

### 8.1 第一级：Job 当前状态

`Job 当前状态` 用于主页面列表、详情页顶部信息区等概览场景，仅承担概览、预览和快速判断作用，共 **2 种**：

| 中文名称 | 英文标识 | 运维含义 | 精确判定条件 |
|----------|----------|----------|-------------|
| 正常 | NORMAL | 该逻辑 Job 没有故障记录，或最近一次故障过程已经闭环 | 无失败事件 OR 最近故障链尾事件存在 STABLE_CHECK_PASSED |
| 恢复中 | RECOVERING | 最近一次故障过程尚未闭环 | 存在失败事件 AND 最近故障链尾事件不存在 STABLE_CHECK_PASSED |

**重要**："正常"仅表示当前失败恢复记录中不存在未闭环故障，不代表已验证物理 Job 正在运行。无运行依据时应通过悬停提示解释该口径。

等待重启、重启中、恢复失败、流程异常在 Job 当前状态层都映射为"恢复中"。

### 8.2 第二级：故障过程状态

`故障过程状态` 用于故障汇总区域和历史故障列表，保留详细区分，共 **5 种**：

| 优先级 | 中文名称 | 英文标识 | 运维含义 | 精确判定条件 |
|--------|----------|----------|----------|-------------|
| 0 | 已恢复 | RECOVERED | 该次故障过程已闭环 | 链尾事件存在 STABLE_CHECK_PASSED |
| 1 | 等待重启 | WAITING_RESTART | 已安排重启，尚未到达计划时间 | 链尾事件存在 RESTART_SCHEDULED 且 NEXT_RESTART_TIME > 当前时间 |
| 2 | 重启中 | RESTARTING | 新 Job 已提交或正在重启，尚未完成稳定性检查 | 链尾事件存在 RESTART_STARTED 或 NEW_JOB_SUBMIT_SUCCEEDED，且无 STABLE_CHECK_PASSED |
| 3 | 恢复失败 | RECOVERY_FAILED | 恢复尝试已确认失败 | 链尾事件存在 NEW_JOB_SUBMIT_FAILED 且无后续 STABLE_CHECK_PASSED |
| 4 | 流程异常 | ABNORMAL | 处理记录序列不符合预期或存在数据质量问题 | 链尾无 JOB_FAILURE_RECEIVED OR 序列校验失败 OR 事件无处理记录 OR RESTART_SCHEDULED 已过期 OR 存在链异常（分叉/循环/断链） |

注意：RESTART_SCHEDULED 且 NEXT_RESTART_TIME 已过仍未进入 RESTART_STARTED 的情况，归入"流程异常"。

### 8.3 两级状态映射

| 故障过程状态 | Job 当前状态 |
|-------------|-------------|
| 已恢复 | 正常 |
| 等待重启 | 恢复中 |
| 重启中 | 恢复中 |
| 恢复失败 | 恢复中 |
| 流程异常 | 恢复中 |
| 无故障记录 | 正常 |

### 8.4 状态与 HANDLE_STAGE 映射速查表

| 链尾最后阶段 | 故障过程状态 | Job 当前状态 |
|-------------|-------------|-------------|
| 无事件 | -- | 正常 |
| STABLE_CHECK_PASSED | 已恢复 | 正常 |
| NEW_JOB_SUBMIT_FAILED（无后续 STABLE_CHECK_PASSED） | 恢复失败 | 恢复中 |
| NEW_JOB_SUBMIT_SUCCEEDED（无 STABLE_CHECK_PASSED） | 重启中 | 恢复中 |
| RESTART_STARTED（无后续） | 重启中 | 恢复中 |
| RESTART_SCHEDULED（NEXT_RESTART_TIME > now） | 等待重启 | 恢复中 |
| RESTART_SCHEDULED（NEXT_RESTART_TIME < now，无 RESTART_STARTED） | 流程异常 | 恢复中 |
| JOB_FAILURE_RECEIVED（无后续处理） | 流程异常 | 恢复中 |
| 序列异常（缺失阶段、乱序） | 流程异常 | 恢复中 |

### 8.5 页面颜色

| 级别 | 状态 | 颜色 | 标签样式 |
|------|------|------|----------|
| Job 当前状态 | 正常 | 绿色文字 `#67C23A` + 浅绿色背景 `#f0f9eb` | el-tag 浅绿 |
| Job 当前状态 | 恢复中 | 红色文字 `#F56C6C` + 浅红色背景 `#fef0f0` | el-tag 浅红 |
| 故障过程状态 | 已恢复 | 绿色文字 `#67C23A` + 浅绿色背景 `#f0f9eb` | el-tag 浅绿 |
| 故障过程状态 | 等待重启/重启中/恢复失败/流程异常 | 红色文字 `#F56C6C` + 浅红色背景 `#fef0f0` | el-tag 浅红 |

不增加状态圆点。

### 8.6 空数据或冲突数据处理

- 失败事件无处理记录 → 故障过程状态=流程异常, Job 当前状态=恢复中
- 处理记录中 HANDLE_STAGE 为 NULL → 跳过该条，不影响序列判断
- 关键字段（FAILURE_TIME、HANDLE_TIME）为 NULL → 标记异常，使用 CREATED_AT 回退排序

---

## 9. 字段映射与计算口径

### 9.1 客户端最近更新时间

```
MAX(该客户端下所有逻辑 Job 的最新事件 CREATED_AT 或最新处理日志 CREATED_AT，以及 CDC_DATA_SOURCE_RUN_STATE.UPDATED_AT)
```

伪代码：
```java
Instant getClientLatestUpdateTime(String clientId) {
    Instant maxEvent = maxCreatedAt of CDC_JOB_FAILURE_EVENT WHERE CLIENT_ID = clientId
    Instant maxLog = maxCreatedAt of CDC_JOB_FAILURE_HANDLE_LOG WHERE CLIENT_ID = clientId
    Instant maxRunState = maxUpdatedAt of CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID = clientId
    return max(maxEvent, maxLog, maxRunState)
}
```

### 9.2 逻辑 Job 当前物理 Job ID

```
优先: 最近一次 STABLE_CHECK_PASSED 日志中的 NEW_JOB_ID
次选: 最近一次 NEW_JOB_SUBMIT_SUCCEEDED 日志中的 NEW_JOB_ID
回退: 最近一次失败事件的 FAILED_JOB_ID
无数据: null → 展示 "--"
```

伪代码：
```java
String getCurrentJobId(List<FailureEvent> allEvents) {
    if (allEvents.isEmpty()) return null
    // 按 FAILURE_TIME DESC 遍历所有事件
    for (event in allEvents sorted by FAILURE_TIME DESC) {
        for (log in event.logs sorted by HANDLE_TIME DESC, ID DESC) {
            if (log.handleStage == "STABLE_CHECK_PASSED" && log.newJobId != null)
                return log.newJobId
        }
    }
    for (event in allEvents sorted by FAILURE_TIME DESC) {
        for (log in event.logs sorted by HANDLE_TIME DESC, ID DESC) {
            if (log.handleStage == "NEW_JOB_SUBMIT_SUCCEEDED" && log.newJobId != null)
                return log.newJobId
        }
    }
    if (!allEvents.isEmpty())
        return allEvents.last().failedJobId  // 最近事件的 FAILED_JOB_ID
    return null
}
```

### 9.3 最近一次数据库故障

选取规则（按优先级）：
1. 存在未闭环故障过程 → 以 FAILURE_TIME 最新的未闭环过程为"最近"
2. 全部已闭环 → 以故障开始时间降序取第一个
3. 无任何故障 → null

### 9.4 数据库故障首次失败时间

```
故障过程中链首事件的 FAILURE_TIME
```

### 9.5 最终恢复时间

```
已闭环: 链尾事件中 STABLE_CHECK_PASSED 记录的 HANDLE_TIME
未闭环: null
```

### 9.6 故障持续时间

```
已闭环: 最终恢复时间 - 首次失败时间（精确到秒）
未闭环: 当前时间 - 首次失败时间
前端展示格式: "X小时Y分Z秒" 或 "X分Y秒"
```

### 9.7 失败事件数量

```
故障过程中包含的 CDC_JOB_FAILURE_EVENT 记录数
```

### 9.8 重启次数

```
Max(故障过程所有事件的处理日志中 RESTART_COUNT_TOTAL)
若全为 NULL: Max(故障过程所有事件的 ATTEMPT_NO)
```

### 9.9 最近处理时间

```
链尾事件最后一条处理日志的 HANDLE_TIME
若链尾事件无日志: 链尾事件 CREATED_AT
```

### 9.10 Job 当前状态

```
见 §8.1 两级状态定义。
仅基于最近一次故障过程计算。
无故障过程 → 正常。
有故障过程且已闭环 → 正常。
有故障过程且未闭环 → 恢复中。
```

### 9.11 已闭环与未闭环故障的边界

```
故障过程内至少有一个事件的日志包含 STABLE_CHECK_PASSED → 已闭环
否则 → 未闭环
```

### 9.12 历史故障返回规则

```
按时间范围筛选（最近一天/一周/一个月），基于首次失败时间。
当前未闭环故障不受时间范围限制，始终包含。
一次性返回所有符合条件的故障过程摘要（不分页）。
有最大故障过程数量保护，超出时截断并标记 truncated=true。
```

---

## 10. 计算口径边界场景覆盖

| 场景 | 首次失败时间 | 恢复时间 | 持续时间 | 失败事件数 | 重启次数 | 当前状态 | 当前 Job ID |
|------|------------|---------|---------|-----------|---------|---------|------------|
| 从未失败 | -- | -- | -- | -- | -- | 正常 (Job) / -- (故障过程) | 从 CDC_DATA_SOURCE_RUN_STATE 推算或 "--" |
| 一次失败后恢复 | 单事件 FAILURE_TIME | STABLE_CHECK_PASSED 的 HANDLE_TIME | 两者之差 | 1 | RESTART_COUNT_TOTAL 或 1 | 正常 / 已恢复 | STABLE_CHECK_PASSED 的 NEW_JOB_ID |
| 多次失败后最终恢复 | 链首 FAILURE_TIME | 链尾 STABLE_CHECK_PASSED HANDLE_TIME | 两者之差 | N | 链尾 RESTART_COUNT_TOTAL | 正常 / 已恢复 | 同上 |
| 当前尚未恢复 | 链首 FAILURE_TIME | -- | now - 开始时间 | N | 同上 | 恢复中 / 依链尾阶段判定 | 最近 NEW_JOB_SUBMIT_SUCCEEDED 的 NEW_JOB_ID |
| 新 Job 已产生但后续事件未插入 | 链首 FAILURE_TIME | -- | now - 开始时间 | N | 同上 | 恢复中 / 重启中 | NEW_JOB_SUBMIT_SUCCEEDED 的 NEW_JOB_ID |
| 处理日志不足（< 2 条） | 唯一事件 FAILURE_TIME | -- | -- | 1 | -- | 恢复中 / 流程异常 | 事件 FAILED_JOB_ID |
| NEW_JOB_ID 匹配多个后续事件 | 链首 FAILURE_TIME | 取决于最终状态 | 正常计算 | N | 同左 | 恢复中 / 流程异常（取最早匹配事件继续追链，其余标记异常） | 正常计算 |
| 链条断裂 | 链首 FAILURE_TIME | --（未闭环） | -- | 已知事件数 | 已知 | 恢复中 / 流程异常 | 最后已知 NEW_JOB_ID |
| 链条循环 | 链首 FAILURE_TIME | --（未闭环） | -- | 截断前事件数 | 已知 | 恢复中 / 流程异常 | 最后已知 NEW_JOB_ID（循环处截断） |
| 重复 FAILED_JOB_ID | 链首 FAILURE_TIME | 取决于最终状态 | 正常计算 | 去重计数 | 去重计算 | 去重计算 | 正常计算 |
| 关键关联字段为空 | 有则计算/无则标记 | -- | -- | 已知 | 已知 | 恢复中 / 流程异常 | "--" |
| 已恢复后同逻辑 Job 再次失败（无关联） | 新故障的独立时间 | 独立计算 | 独立计算 | 独立计算 | 独立计算 | 依新故障判定 | 新故障的当前 Job ID |

**异常数据保留可见性**：异常场景（断链、循环、空值）在页面上标记 warning 图标（黄色感叹号），tooltip 说明具体异常类型，禁止静默丢弃。被算法排除的异常事件（如分叉中未被选取的分支）在故障过程中作为独立 warning 记录保留，不得静默丢失。

---

## 11. 接口清单

结合项目现有 REST 风格（统一响应 `ApiResponse<T>`，时间格式 `yyyy-MM-dd HH:mm:ss`），设计 5 个接口：

| 编号 | 方法 | 路径 | 用途 |
|------|------|------|------|
| API-1 | GET | `/api/monitor/job-failures/summary` | 主页面客户端及逻辑 Job 概览 |
| API-2 | GET | `/api/monitor/job-failures/{clientId}/{dataSourceId}/latest` | 逻辑 Job 最近一次故障详情 |
| API-3 | GET | `/api/monitor/job-failures/{clientId}/{dataSourceId}/history` | 逻辑 Job 历史故障过程摘要（时间范围查询） |
| API-4 | GET | `/api/monitor/job-failures/{clientId}/{dataSourceId}/fault/{faultRootId}` | 指定历史故障恢复过程详情 |
| API-5 | GET | `/api/monitor/job-failures/{clientId}/{dataSourceId}/clob` | 长文本字段（FAILURE_DETAIL/ERROR_DETAIL）懒加载 |

---

## 12. 接口详细定义

### 12.1 API-1: 主页面客户端及逻辑 Job 概览

#### 请求

```http
GET /api/monitor/job-failures/summary
```

无请求参数。无分页。

#### 用途

一次性返回所有活跃客户端及其逻辑 Job 概览信息，避免 N+1 HTTP 调用。

API-1 按指定 CLIENT_ID + DATA_SOURCE_ID 范围查询生成当前概览所需数据，不设固定时间窗口。

#### 响应 DTO 层级

```
JobFailureSummaryResponse
├── refreshedAt: String                    -- 数据刷新时间（服务端查询时间）
├── clients: List<ClientSummaryVO>
│   ├── clientId: String                   -- CLIENT_ID
│   ├── clientDesc: String                 -- CLIENT_DESC（可为 null）
│   ├── logicalJobCount: int               -- 逻辑 Job 总数
│   ├── normalCount: int                   -- Job 当前状态=正常的逻辑 Job 数量
│   ├── abnormalCount: int                 -- Job 当前状态=恢复中的逻辑 Job 数量
│   ├── latestUpdateTime: String           -- 客户端最近更新时间
│   └── logicalJobs: List<LogicalJobSummaryVO>
│       ├── dataSourceId: String           -- DATA_SOURCE_ID
│       ├── dataSourceName: String         -- CDC_DATA_SOURCE.DATA_SOURCE_NAME（可为 null）
│       ├── status: String                 -- Job 当前状态枚举值（NORMAL / RECOVERING）
│       ├── statusText: String             -- Job 当前状态中文名称（正常 / 恢复中）
│       ├── currentJobId: String           -- 当前物理 Job ID（可为 null）
│       ├── lastFailureTime: String        -- 最近失败时间（可为 null）
│       ├── lastRecoveryTime: String       -- 最近恢复时间（可为 null）
│       └── restartCount: Integer          -- 本次重启次数（可为 null）
```

#### 响应 JSON 示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "refreshedAt": "2026-07-28 10:30:00",
    "clients": [
      {
        "clientId": "hosp-006",
        "clientDesc": "总部测试 IP: 192.168.0.94, 192.168.174.1, 3.3.0.192, 192.168.100.1",
        "logicalJobCount": 1,
        "normalCount": 1,
        "abnormalCount": 0,
        "latestUpdateTime": "2026-07-27 19:23:44",
        "logicalJobs": [
          {
            "dataSourceId": "my-19c",
            "dataSourceName": "oracle-业务库33",
            "status": "NORMAL",
            "statusText": "正常",
            "currentJobId": "1d45cf72cad04153b9c81409038561d0",
            "lastFailureTime": "2026-07-27 19:17:24",
            "lastRecoveryTime": "2026-07-27 19:23:44",
            "restartCount": 1
          }
        ]
      },
      {
        "clientId": "hosp-001",
        "clientDesc": "总部测试 IP: 192.168.174.1, 10.32.17.127, 192.168.1.128, 3.3.0.192, 192.168.100.1",
        "logicalJobCount": 2,
        "normalCount": 2,
        "abnormalCount": 0,
        "logicalJobs": [
          {
            "dataSourceId": "199-source",
            "dataSourceName": "oracle-199-source",
            "status": "NORMAL",
            "statusText": "正常",
            "currentJobId": null,
            "lastFailureTime": null,
            "lastRecoveryTime": null,
            "restartCount": null
          },
          {
            "dataSourceId": "5905f1ce83024410836b40ca0ebfc446",
            "dataSourceName": null,
            "status": "NORMAL",
            "statusText": "正常",
            "currentJobId": null,
            "lastFailureTime": null,
            "lastRecoveryTime": null,
            "restartCount": null
          }
        ]
      }
    ]
  },
  "timestamp": "2026-07-28T10:30:00"
}
```

#### 空数据语义

- `clients` 为空数组 → 无活跃客户端或数据
- `logicalJobs` 为空数组 → 该客户端无逻辑 Job
- 单个字段 null → 该信息不可用，前端展示 "--"

#### 业务错误

| 场景 | HTTP Status | code | message |
|------|-------------|------|---------|
| 数据库连接失败 | 503 | 503 | "数据库不可用，请稍后重试" |

#### 自动刷新调用

页面自动刷新和手动刷新均调用此接口。此接口为**只读、幂等**。

---

### 12.2 API-2: 逻辑 Job 最近一次故障详情

#### 请求

```http
GET /api/monitor/job-failures/{clientId}/{dataSourceId}/latest
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| clientId | String | 客户端 ID，如 `hosp-006` |
| dataSourceId | String | 数据源 ID，如 `my-19c` |

#### 查询逻辑

按 CLIENT_ID + DATA_SOURCE_ID 查询该逻辑 Job 的**全部**失败事件及处理记录（不设固定时间窗口），在 Java 内存中构建物理 Job 链、切分故障过程后，返回最新一个故障过程的完整详情。

#### 响应 DTO 层级

```
LatestFaultResponse
├── clientId: String
├── dataSourceId: String
├── dataSourceName: String
├── status: String                            -- Job 当前状态（NORMAL / RECOVERING）
├── statusText: String                        -- Job 当前状态中文（正常 / 恢复中）
├── currentJobId: String
├── latestUpdateTime: String
├── hasFault: boolean                        -- 是否有故障记录
└── latestFault: FaultProcessVO              -- 最近故障过程（无故障时为 null）
    ├── faultRootId: Long                     -- 故障过程标识 = 链首事件 ID
    ├── closed: boolean                        -- 是否已闭环
    ├── faultProcessStatus: String             -- 故障过程状态（RECOVERED / WAITING_RESTART / RESTARTING / RECOVERY_FAILED / ABNORMAL）
    ├── faultProcessStatusText: String         -- 故障过程状态中文（已恢复 / 等待重启 / 重启中 / 恢复失败 / 流程异常）
    ├── firstFailureTime: String               -- 首次失败时间
    ├── recoveryTime: String                   -- 恢复时间（未闭环时为 null）
    ├── durationSeconds: Long                  -- 持续秒数
    ├── durationText: String                   -- 格式化持续时间
    ├── eventCount: int                        -- 物理 Job 失败事件数
    ├── restartCount: Integer                  -- 重启次数
    ├── initialJobId: String                   -- 初始物理 Job ID
    ├── finalJobId: String                     -- 当前/最终物理 Job ID
    ├── lastHandleTime: String                 -- 最近处理时间
    ├── dataQualityWarning: String             -- 数据质量警告（正常时为 null）
    ├── chainAnomalies: List<String>           -- 链构建过程的异常说明列表
    └── events: List<FailureEventVO>
        ├── eventId: Long                      -- 事件 ID
        ├── roundIndex: int                    -- 轮次（从 1 开始）
        ├── failedJobId: String                -- 失败物理 Job ID
        ├── newJobId: String                   -- 新物理 Job ID（可为 null）
        ├── failureTime: String                -- 失败时间
        ├── failureReason: String              -- 失败原因摘要（VARCHAR2 4000，非 CLOB）
        ├── failureDetailAvailable: boolean    -- FAILURE_DETAIL CLOB 是否可用（通过 API-5 懒加载）
        ├── eventResult: String                -- EVENT_RESULT
        ├── lastHandleStage: String            -- 本事件最后处理阶段
        ├── lastHandleTime: String             -- 本事件最后处理时间
        ├── handleLogCount: int                -- 处理记录数量
        ├── anomalyFlag: boolean               -- 该事件是否为链异常事件（分叉/重复/断链处）
        ├── anomalyNote: String                -- 异常说明（正常时为 null）
        └── handleLogs: List<HandleLogVO>
            ├── logId: Long                    -- 日志 ID
            ├── handleStage: String            -- HANDLE_STAGE 枚举值
            ├── handleStageText: String        -- 中文名称
            ├── handleTime: String             -- 处理时间
            ├── attemptNo: Integer             -- 尝试次数
            ├── consecutiveFailures: Integer
            ├── restartCountTotal: Long
            ├── restartDelaySeconds: Integer
            ├── nextRestartTime: String        -- 可为 null
            ├── restartStartTime: String       -- 可为 null
            ├── restartEndTime: String         -- 可为 null
            ├── newJobId: String               -- 可为 null
            ├── errorDetailAvailable: boolean  -- ERROR_DETAIL CLOB 是否可用（通过 API-5 懒加载）
            └── remark: String                 -- 可为 null
```

**注意**：API-2 和 API-4 的 `events` 和 `handleLogs` 中**不**直接返回 CLOB 字段（FAILURE_DETAIL、ERROR_DETAIL）的完整内容。改为返回 boolean 标记是否存在长文本，前端通过 API-5 按需懒加载。

#### 响应 JSON 示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "clientId": "hosp-006",
    "dataSourceId": "my-19c",
    "dataSourceName": "oracle-业务库33",
    "status": "NORMAL",
    "statusText": "正常",
    "currentJobId": "1d45cf72cad04153b9c81409038561d0",
    "latestUpdateTime": "2026-07-27 19:23:44",
    "hasFault": true,
    "latestFault": {
      "faultRootId": 3400900000000000001,
      "closed": true,
      "faultProcessStatus": "RECOVERED",
      "faultProcessStatusText": "已恢复",
      "firstFailureTime": "2026-07-27 19:17:24",
      "recoveryTime": "2026-07-27 19:23:44",
      "durationSeconds": 380,
      "durationText": "6分20秒",
      "eventCount": 1,
      "restartCount": 1,
      "initialJobId": "783e7f54d0c2420e8b54add510a0f1c7",
      "finalJobId": "1d45cf72cad04153b9c81409038561d0",
      "lastHandleTime": "2026-07-27 19:23:44",
      "dataQualityWarning": null,
      "chainAnomalies": [],
      "events": [
        {
          "eventId": 3400900000000000001,
          "roundIndex": 1,
          "failedJobId": "783e7f54d0c2420e8b54add510a0f1c7",
          "newJobId": "1d45cf72cad04153b9c81409038561d0",
          "failureTime": "2026-07-27 19:17:24",
          "failureReason": "oracle.net.ns.NetException: Listener refused the connection...",
          "failureDetailAvailable": true,
          "eventResult": "ACCEPTED",
          "lastHandleStage": "STABLE_CHECK_PASSED",
          "lastHandleTime": "2026-07-27 19:23:44",
          "handleLogCount": 5,
          "anomalyFlag": false,
          "anomalyNote": null,
          "handleLogs": [
            {
              "logId": 1,
              "handleStage": "JOB_FAILURE_RECEIVED",
              "handleStageText": "收到失败事件",
              "handleTime": "2026-07-27 19:17:43",
              "attemptNo": 1,
              "consecutiveFailures": null,
              "restartCountTotal": null,
              "restartDelaySeconds": null,
              "nextRestartTime": null,
              "restartStartTime": null,
              "restartEndTime": null,
              "newJobId": null,
              "errorDetailAvailable": false,
              "remark": null
            },
            {
              "logId": 2,
              "handleStage": "RESTART_SCHEDULED",
              "handleStageText": "已安排重启",
              "handleTime": "2026-07-27 19:17:43",
              "attemptNo": 1,
              "consecutiveFailures": null,
              "restartCountTotal": null,
              "restartDelaySeconds": 60,
              "nextRestartTime": "2026-07-27 19:18:43",
              "restartStartTime": null,
              "restartEndTime": null,
              "newJobId": null,
              "errorDetailAvailable": false,
              "remark": null
            },
            {
              "logId": 3,
              "handleStage": "RESTART_STARTED",
              "handleStageText": "开始重启",
              "handleTime": "2026-07-27 19:18:43",
              "attemptNo": 1,
              "consecutiveFailures": null,
              "restartCountTotal": null,
              "restartDelaySeconds": null,
              "nextRestartTime": null,
              "restartStartTime": "2026-07-27 19:18:43",
              "restartEndTime": null,
              "newJobId": null,
              "errorDetailAvailable": false,
              "remark": null
            },
            {
              "logId": 4,
              "handleStage": "NEW_JOB_SUBMIT_SUCCEEDED",
              "handleStageText": "新 Job 提交成功",
              "handleTime": "2026-07-27 19:18:44",
              "attemptNo": 1,
              "consecutiveFailures": null,
              "restartCountTotal": null,
              "restartDelaySeconds": null,
              "nextRestartTime": null,
              "restartStartTime": null,
              "restartEndTime": null,
              "newJobId": "1d45cf72cad04153b9c81409038561d0",
              "errorDetailAvailable": false,
              "remark": null
            },
            {
              "logId": 5,
              "handleStage": "STABLE_CHECK_PASSED",
              "handleStageText": "稳定性检查通过",
              "handleTime": "2026-07-27 19:23:44",
              "attemptNo": 1,
              "consecutiveFailures": null,
              "restartCountTotal": 1,
              "restartDelaySeconds": null,
              "nextRestartTime": null,
              "restartStartTime": null,
              "restartEndTime": null,
              "newJobId": "1d45cf72cad04153b9c81409038561d0",
              "errorDetailAvailable": false,
              "remark": null
            }
          ]
        }
      ]
    }
  },
  "timestamp": "2026-07-28T10:30:05"
}
```

#### 无故障记录时的响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "clientId": "hosp-006",
    "dataSourceId": "5905f1ce83024410836b40ca0ebfc446",
    "dataSourceName": null,
    "status": "NORMAL",
    "statusText": "正常",
    "currentJobId": null,
    "latestUpdateTime": "2026-07-27 18:00:00",
    "hasFault": false,
    "latestFault": null
  },
  "timestamp": "2026-07-28T10:30:05"
}
```

#### 业务错误

| 场景 | HTTP Status | code | message |
|------|-------------|------|---------|
| 逻辑 Job 不存在 | 404 | 404 | "逻辑 Job 不存在：{clientId}/{dataSourceId}" |
| clientId 或 dataSourceId 包含非法字符 | 400 | 400 | "参数格式不合法" |

---

### 12.3 API-3: 历史故障过程摘要（时间范围查询）

#### 请求

```http
GET /api/monitor/job-failures/{clientId}/{dataSourceId}/history?range=1d
```

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| range | String | 否 | 1d | 时间范围：`1d`（最近一天）、`1w`（最近一周）、`1m`（最近一个月） |

第一版不提供任意起止日期。时间范围最长为最近一个月。

#### 用途

返回该逻辑 Job 在所选时间范围内的故障过程摘要列表。查询依据为故障过程的**首次失败时间**。

**关键规则**：
- 当前未闭环故障**不受时间范围限制**，始终包含并置顶
- 一次性返回所有符合条件的故障过程摘要（**不分页**）
- 后端设置最大故障过程数量保护，超出时截断并标记 `truncated: true`
- 不返回事件详情、处理时间线或 CLOB（通过 API-4 按需获取）

#### 响应 DTO 层级

```
HistoryResponse
├── clientId: String
├── dataSourceId: String
├── dataSourceName: String
├── status: String                            -- Job 当前状态（NORMAL / RECOVERING）
├── statusText: String
├── currentJobId: String
├── latestUpdateTime: String
├── range: String                             -- 实际使用的时间范围
├── truncated: boolean                        -- 是否因超过最大数量保护而被截断
├── truncatedMessage: String                  -- 截断时的提示（正常时为 null）
├── hasUnclosed: boolean                      -- 是否存在当前未闭环故障
└── records: List<HistoricalFaultVO>
    ├── faultRootId: Long                     -- 故障过程标识 = 链首事件 ID
    ├── firstFailureTime: String              -- 首次失败时间
    ├── recoveryTime: String                  -- 恢复时间（未闭环时为 null）
    ├── durationSeconds: Long                 -- 持续秒数
    ├── durationText: String                  -- 格式化持续时间
    ├── faultProcessStatus: String            -- 故障过程状态枚举
    ├── faultProcessStatusText: String        -- 故障过程状态中文
    ├── eventCount: int                       -- 失败事件数
    ├── restartCount: Integer                 -- 重启次数
    ├── initialJobId: String                  -- 初始物理 Job ID
    ├── finalJobId: String                    -- 当前/最终物理 Job ID
    ├── closed: boolean                       -- 是否已闭环
    └── hasAnomalyChain: boolean              -- 是否存在异常链（分叉/循环/断链等）
```

注意：`records` 中不包含 events 详情 —— 列表仅返回摘要。事件详情通过 API-4 按需获取。

#### 响应 JSON 示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "clientId": "hosp-002",
    "dataSourceId": "db-drug-master",
    "dataSourceName": "药品字典库",
    "status": "RECOVERING",
    "statusText": "恢复中",
    "currentJobId": "d9b06f13c5f46e8b1a34cd567890efab",
    "latestUpdateTime": "2026-07-28 10:30:00",
    "range": "1d",
    "truncated": false,
    "truncatedMessage": null,
    "hasUnclosed": true,
    "records": [
      {
        "faultRootId": 3400900000000000100,
        "firstFailureTime": "2026-07-28 10:28:00",
        "recoveryTime": null,
        "durationSeconds": 120,
        "durationText": "2分0秒（持续中）",
        "faultProcessStatus": "WAITING_RESTART",
        "faultProcessStatusText": "等待重启",
        "eventCount": 1,
        "restartCount": 0,
        "initialJobId": "d9b06f13c5f46e8b1a34cd567890efab",
        "finalJobId": "d9b06f13c5f46e8b1a34cd567890efab",
        "closed": false,
        "hasAnomalyChain": false
      },
      {
        "faultRootId": 3400900000000000090,
        "firstFailureTime": "2026-07-27 19:17:24",
        "recoveryTime": "2026-07-27 20:05:30",
        "durationSeconds": 2886,
        "durationText": "48分6秒",
        "faultProcessStatus": "RECOVERED",
        "faultProcessStatusText": "已恢复",
        "eventCount": 3,
        "restartCount": 2,
        "initialJobId": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
        "finalJobId": "d9b06f13c5f46e8b1a34cd567890efab",
        "closed": true,
        "hasAnomalyChain": false
      }
    ]
  },
  "timestamp": "2026-07-28T10:30:10"
}
```

#### 示例数据说明

示例数据体现失败事件数与重启次数不一定相等：
- 第1条：1 次失败事件，0 次重启（仅收到失败事件，尚未执行重启），状态为"等待重启"
- 第2条：3 次失败事件，2 次重启，已恢复

#### 排序规则

- 当前未闭环故障**置顶**（排在所有已闭环故障之前）
- 多个未闭环故障之间按首次失败时间倒序
- 已闭环故障按首次失败时间倒序
- 同一个逻辑 Job 正常情况下只应存在一个未闭环故障；发现多个未闭环故障时应作为数据或流程异常明确提示

#### 最大故障过程数量保护

后端设置保护上限（具体上限在数据库数据量分析后确定）。限制对象是聚合后的故障过程数，不是 CDC_JOB_FAILURE_EVENT 明细数。

超过上限时：
- 返回最新的部分故障过程
- `truncated: true`
- `truncatedMessage: "当前仅展示最新的部分故障过程，请缩小查询范围。"`

#### 业务错误

| 场景 | HTTP Status | code | message |
|------|-------------|------|---------|
| range 参数值不合法 | 400 | 400 | "不支持的时间范围：{range}，支持的值为 1d、1w、1m" |

---

### 12.4 API-4: 指定历史故障详情

#### 请求

```http
GET /api/monitor/job-failures/{clientId}/{dataSourceId}/fault/{faultRootId}
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| clientId | String | 客户端 ID |
| dataSourceId | String | 数据源 ID |
| faultRootId | Long | 故障过程标识 = 链首事件 ID（CDC_JOB_FAILURE_EVENT.ID） |

#### 用途

查看某一次历史故障恢复过程的完整详情，打开**独立的"指定故障详情"页面**（不切换或伪装成"最近一次故障"页签）。复用与 API-2 中 `latestFault` 相同的 FaultProcessVO 结构。

URL 中包含故障过程标识（`faultRootId`），刷新后仍能打开同一故障。页面标题使用"指定故障详情"或"历史故障详情"，并显示首次失败时间。

#### 响应 DTO

返回的 data 结构与 API-2 中的 `latestFault`（FaultProcessVO）完全一致，包含 events 数组及每个 event 下的 handleLogs。CLOB 字段同样通过 API-5 懒加载。

#### 响应 JSON 示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "faultRootId": 3400900000000000001,
    "closed": true,
    "faultProcessStatus": "RECOVERED",
    "faultProcessStatusText": "已恢复",
    "firstFailureTime": "2026-07-27 19:17:24",
    "recoveryTime": "2026-07-27 19:23:44",
    "durationSeconds": 380,
    "durationText": "6分20秒",
    "eventCount": 1,
    "restartCount": 1,
    "initialJobId": "783e7f54d0c2420e8b54add510a0f1c7",
    "finalJobId": "1d45cf72cad04153b9c81409038561d0",
    "lastHandleTime": "2026-07-27 19:23:44",
    "dataQualityWarning": null,
    "chainAnomalies": [],
    "events": [ "... 同 API-2 的 events 结构 ..." ]
  },
  "timestamp": "2026-07-28T10:30:15"
}
```

#### 业务错误

| 场景 | HTTP Status | code | message |
|------|-------------|------|---------|
| faultRootId 对应的故障不存在 | 404 | 404 | "故障过程不存在：{faultRootId}" |
| faultRootId 不属于该逻辑 Job | 400 | 400 | "故障过程不属于指定逻辑 Job" |

---

### 12.5 API-5: 长文本懒加载

#### 请求

```http
GET /api/monitor/job-failures/{clientId}/{dataSourceId}/clob?type=FAILURE_DETAIL&eventId=3400900000000000001
GET /api/monitor/job-failures/{clientId}/{dataSourceId}/clob?type=ERROR_DETAIL&logId=1
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| clientId | String | 客户端 ID |
| dataSourceId | String | 数据源 ID |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | 枚举：`FAILURE_DETAIL`（事件失败详情）或 `ERROR_DETAIL`（处理日志异常详情） |
| eventId | Long | type=FAILURE_DETAIL 时必填 | 事件 ID |
| logId | Long | type=ERROR_DETAIL 时必填 | 处理日志 ID |

#### 用途

按需加载 CDC_JOB_FAILURE_EVENT.FAILURE_DETAIL（CLOB）或 CDC_JOB_FAILURE_HANDLE_LOG.ERROR_DETAIL（CLOB）。

#### 响应 DTO

```
ClobResponse
├── type: String               -- FAILURE_DETAIL 或 ERROR_DETAIL
├── eventId: Long              -- 关联事件 ID（type=FAILURE_DETAIL 时有值）
├── logId: Long                -- 关联日志 ID（type=ERROR_DETAIL 时有值）
├── content: String            -- 完整 CLOB 文本（经脱敏处理）
├── contentLength: int         -- 原始字符数
└── truncated: boolean         -- 是否因超过最大返回长度而被截断（当前最大 50000 字符）
```

#### 响应 JSON 示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "type": "FAILURE_DETAIL",
    "eventId": 3400900000000000001,
    "logId": null,
    "content": "oracle.net.ns.NetException: Listener refused the connection with the following error:\nORA-12514, TNS:listener does not currently know of service requested in connect descriptor\n  (CONNECTION_ID=***MASKED***)...",
    "contentLength": 10929,
    "truncated": false
  },
  "timestamp": "2026-07-28T10:30:20"
}
```

#### 脱敏规则

后端返回前对 content 进行以下过滤：
- `password=`、`PASSWORD=`、`pwd=`、`PWD=` 后的值替换为 `***MASKED***`
- `token=`、`TOKEN=`、`Authorization=` 后的值替换为 `***MASKED***`
- `CONNECTION_ID=` 后的值替换为 `***MASKED***`
- IP 地址保留（内网运维需要），不处理

#### 业务错误

| 场景 | HTTP Status | code | message |
|------|-------------|------|---------|
| type 参数值不合法 | 400 | 400 | "不支持的 CLOB 类型：{type}，支持的值为 FAILURE_DETAIL、ERROR_DETAIL" |
| 缺少必填的 eventId 或 logId | 400 | 400 | "type=FAILURE_DETAIL 时必须提供 eventId；type=ERROR_DETAIL 时必须提供 logId" |
| 指定 eventId 或 logId 不存在 | 404 | 404 | "记录不存在：eventId={eventId}" 或 "记录不存在：logId={logId}" |
| CLOB 字段为空 | 200 | -- | content 返回 null，contentLength 返回 0 |

---

## 13. 接口通用规范

### 13.1 统一响应格式

所有接口使用 `com.bsoft.cdcconfig.common.api.ApiResponse<T>` 包装：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": "2026-07-28T10:30:00"
}
```

### 13.2 分页响应格式（保留，当前接口未使用）

当前 5 个接口均不采用分页。API-1 和 API-3 一次性返回全部数据（API-3 有时间范围和最大数量保护）。

以下分页格式保留供未来扩展参考：

```json
{
  "records": [...],
  "total": 100,
  "pageNum": 1,
  "pageSize": 10,
  "pages": 10
}
```

### 13.3 时间格式

所有时间字段使用 `yyyy-MM-dd HH:mm:ss`（字符串），时区为服务器本地时区。

### 13.4 Job ID 类型

Job ID 为 String 类型（UUID 格式），不解析为数值。

### 13.5 接口幂等性

所有 5 个接口均为 GET 请求，只读、幂等。

### 13.6 故障过程标识

当前表无统一 `INCIDENT_ID` 或 `ROOT_EVENT_ID`。使用**链首事件的 ID**（即故障过程中第一个 CDC_JOB_FAILURE_EVENT.ID）作为故障过程的聚合标识（`faultRootId`）。

**稳定性说明**：链首事件 ID 不会变化（表只插入不更新不删除），因此该标识是稳定的。限制：新的事件插入后，如果新事件通过 Job ID 链串联到已有故障过程的链首之前成为新的链首，则原来的 faultRootId 不再指向完整的故障过程。目前这种场景尚未出现。第一版接受此限制。

### 13.7 长文本处理

- `failureReason`（VARCHAR2 4000）在 API-2/API-4 中直接返回
- `failureDetail`（CLOB）不在 API-1/API-2/API-3/API-4 中直接返回。API-2/API-4 通过 `failureDetailAvailable: boolean` 标记，前端通过 API-5 懒加载
- `errorDetail`（CLOB）同样通过 `errorDetailAvailable: boolean` + API-5 懒加载
- API-5 返回完整 CLOB 文本（经脱敏），最大 50000 字符；超出则截断并设置 `truncated: true`
- 前端对长文本使用等宽字体、限高滚动、一键复制

### 13.8 敏感信息脱敏

API-5 返回前对以下模式进行过滤屏蔽：
- `password=`、`PASSWORD=`、`pwd=`、`PWD=` 后的值
- `token=`、`TOKEN=`、`Authorization=` 后的值
- `CONNECTION_ID=` 等连接串参数中的敏感部分

前端在展示详情中也应做二次脱敏校验。

---

## 14. 聚合算法及伪代码

### 14.1 总体流程

```
┌─────────────────────────────────────────────────┐
│  SQL: 查询所有活跃客户端                          │
│  (CDC_CLIENT_MULTIPLE WHERE FG_ACTIVE='1')       │
├─────────────────────────────────────────────────┤
│  SQL: 查询各逻辑 Job 的全部失败事件 + JOIN 处理记录  │
│  SELECT e.*, l.*                                 │
│  FROM CDC_JOB_FAILURE_EVENT e                    │
│  LEFT JOIN CDC_JOB_FAILURE_HANDLE_LOG l           │
│  ON e.ID = l.FAILURE_EVENT_ID                    │
│  WHERE (e.CLIENT_ID, e.DATA_SOURCE_ID) IN (...)  │
│  ORDER BY e.FAILURE_TIME ASC, l.HANDLE_TIME ASC   │
│  （不设固定时间窗口，性能通过索引保障）               │
├─────────────────────────────────────────────────┤
│  SQL: 查询 CDC_DATA_SOURCE（全部）                │
├─────────────────────────────────────────────────┤
│  SQL: 查询 CDC_DATA_SOURCE_RUN_STATE             │
│  （用于获取无失败记录的逻辑Job的运行状态信息）        │
├─────────────────────────────────────────────────┤
│  Java: 按 (CLIENT_ID, DATA_SOURCE_ID) 分组        │
├─────────────────────────────────────────────────┤
│  Java: 每组内构建物理Job链 → 切分故障过程          │
│  （含异常检测：重复/分叉/循环/断链/多前驱）         │
├─────────────────────────────────────────────────┤
│  Java: 计算摘要、状态、当前Job ID                  │
├─────────────────────────────────────────────────┤
│  Java: 区分最近故障 vs 历史故障                    │
├─────────────────────────────────────────────────┤
│  Java: 组装响应 DTO                               │
└─────────────────────────────────────────────────┘
```

### 14.2 构建物理 Job 链（含异常检测）

```java
/**
 * 为单个逻辑 Job 构建物理 Job 失败事件链。
 * 输入: 按 FAILURE_TIME ASC 排序的事件列表（每个事件含日志列表）
 * 输出: ChainBuildResult（含一条或多条 FailureChain + 异常说明列表）
 *
 * 关键设计:
 * - 使用 ListMultiMap 处理重复 FAILED_JOB_ID，不静默覆盖
 * - 明确检测分叉、多前驱、循环、断链
 * - 被选取和未被选取的事件都不静默丢失
 */
ChainBuildResult buildChains(List<FailureEvent> events) {

    List<String> anomalies = new ArrayList<>();

    // Map: FAILED_JOB_ID → List<FailureEvent>（允许重复，不静默覆盖）
    Map<String, List<FailureEvent>> byFailedJobId = new LinkedHashMap<>();
    for (FailureEvent e : events) {
        byFailedJobId.computeIfAbsent(e.failedJobId, k -> new ArrayList<>()).add(e);
    }

    // 检测重复 FAILED_JOB_ID
    for (Map.Entry<String, List<FailureEvent>> entry : byFailedJobId.entrySet()) {
        if (entry.getValue().size() > 1) {
            anomalies.add("检测到重复 FAILED_JOB_ID: " + entry.getKey()
                + "，出现 " + entry.getValue().size() + " 次，取 FAILURE_TIME 最早的事件");
            // 重复事件中未被选取的标记为 anomalyFlag=true
            List<FailureEvent> dupes = entry.getValue();
            dupes.sort(Comparator.comparing(FailureEvent::getFailureTime));
            for (int i = 1; i < dupes.size(); i++) {
                dupes.get(i).setAnomalyFlag(true);
                dupes.get(i).setAnomalyNote("重复 FAILED_JOB_ID，已被事件 ID="
                    + dupes.get(0).getEventId() + " 取代");
            }
        }
    }

    // Map: 事件 → 后继事件列表（检测分叉）
    Map<FailureEvent, List<FailureEvent>> nextMap = new LinkedHashMap<>();

    for (FailureEvent event : events) {
        String newJobId = getEffectiveNewJobId(event.getLogs());
        if (newJobId != null) {
            List<FailureEvent> candidates = byFailedJobId.get(newJobId);
            if (candidates != null && !candidates.isEmpty()) {
                // 过滤掉自身
                List<FailureEvent> validNext = candidates.stream()
                    .filter(e -> !e.getEventId().equals(event.getEventId()))
                    .toList();
                if (!validNext.isEmpty()) {
                    nextMap.put(event, validNext);
                    // 检测分叉：一个 NEW_JOB_ID 匹配多个后续事件
                    if (validNext.size() > 1) {
                        anomalies.add("NEW_JOB_ID " + newJobId + " 匹配到 "
                            + validNext.size() + " 个后续事件，取 FAILURE_TIME 最早的事件 ID="
                            + validNext.get(0).getEventId());
                        // 未被选取的分支标记异常
                        for (int i = 1; i < validNext.size(); i++) {
                            validNext.get(i).setAnomalyFlag(true);
                            validNext.get(i).setAnomalyNote(
                                "NEW_JOB_ID 分叉，已被事件 ID="
                                + validNext.get(0).getEventId() + " 取代");
                        }
                    }
                }
            }
        }
    }

    // 确定性选取：每个事件取第一个有效后继（按 FAILURE_TIME ASC）
    Map<FailureEvent, FailureEvent> selectedNext = new LinkedHashMap<>();
    for (Map.Entry<FailureEvent, List<FailureEvent>> entry : nextMap.entrySet()) {
        selectedNext.put(entry.getKey(), entry.getValue().get(0));
    }

    // 检测多前驱：同一事件被多个前驱事件指向
    Map<FailureEvent, List<FailureEvent>> predecessors = new LinkedHashMap<>();
    for (Map.Entry<FailureEvent, FailureEvent> entry : selectedNext.entrySet()) {
        predecessors.computeIfAbsent(entry.getValue(), k -> new ArrayList<>()).add(entry.getKey());
    }
    for (Map.Entry<FailureEvent, List<FailureEvent>> entry : predecessors.entrySet()) {
        if (entry.getValue().size() > 1) {
            anomalies.add("事件 ID=" + entry.getKey().getEventId()
                + " 有 " + entry.getValue().size() + " 个前驱事件，保留所有前驱链接");
        }
    }

    // 找出链首（没有前驱的事件）
    Set<FailureEvent> allNextValues = new HashSet<>(selectedNext.values());
    List<FailureEvent> chainHeads = events.stream()
        .filter(e -> !allNextValues.contains(e))
        .toList();

    // 从每个链首遍历构建链条（含循环检测）
    List<FailureChain> chains = new ArrayList<>();
    for (FailureEvent head : chainHeads) {
        FailureChain chain = new FailureChain();
        FailureEvent curr = head;
        Set<Long> visitedEventIds = new LinkedHashSet<>();
        while (curr != null && !visitedEventIds.contains(curr.getEventId())) {
            chain.add(curr);
            visitedEventIds.add(curr.getEventId());
            curr = selectedNext.get(curr);
        }
        if (curr != null && visitedEventIds.contains(curr.getEventId())) {
            anomalies.add("检测到事件链循环：事件 ID=" + curr.getEventId()
                + " 在链中重复出现，已截断");
        }
        chains.add(chain);
    }

    // 检测孤岛事件（既不是链首也不在任何链中，因异常被排除）
    Set<FailureEvent> allInChains = chains.stream()
        .flatMap(c -> c.getEvents().stream())
        .collect(Collectors.toSet());
    Set<FailureEvent> allEventsSet = new HashSet<>(events);
    allEventsSet.removeAll(allInChains);
    for (FailureEvent orphan : allEventsSet) {
        // 未被选取的分支事件：已在上面标记 anomalyFlag=true
        // 仍将其包装为单事件链条保留
        FailureChain orphanChain = new FailureChain();
        orphanChain.add(orphan);
        chains.add(orphanChain);
    }

    return new ChainBuildResult(chains, anomalies);
}

/**
 * 从事件的处理日志中选取有效 NEW_JOB_ID。
 * 规则: 按 HANDLE_TIME ASC, ID ASC，取第一条 NEW_JOB_ID IS NOT NULL 的记录。
 */
String getEffectiveNewJobId(List<HandleLog> logs) {
    return logs.stream()
        .filter(l -> l.newJobId != null && !l.newJobId.isEmpty())
        .min(Comparator.comparing(HandleLog::getHandleTime)
                        .thenComparing(HandleLog::getLogId))
        .map(HandleLog::getNewJobId)
        .orElse(null);
}
```

### 14.3 切分故障过程

```java
/**
 * 将一条物理Job链切分为多个独立的数据库故障恢复过程。
 * 切分规则: STABLE_CHECK_PASSED 表示一次故障结束。
 * 之后的事件属于新的独立故障过程。
 */
List<FaultProcess> splitIntoProcesses(FailureChain chain) {
    List<FaultProcess> processes = new ArrayList<>();
    List<FailureEvent> batch = new ArrayList<>();

    for (FailureEvent event : chain.getEvents()) {
        batch.add(event);

        boolean hasStableCheck = event.getLogs().stream()
            .anyMatch(l -> "STABLE_CHECK_PASSED".equals(l.getHandleStage()));

        if (hasStableCheck) {
            processes.add(new FaultProcess(new ArrayList<>(batch)));
            batch.clear();
        }
    }

    // 剩余未闭环的事件作为一个独立过程
    if (!batch.isEmpty()) {
        processes.add(new FaultProcess(new ArrayList<>(batch)));
    }

    return processes;
}
```

### 14.4 判断故障过程是否闭环

```java
boolean isClosed(FaultProcess process) {
    List<FailureEvent> events = process.getEvents();
    if (events.isEmpty()) return false;
    FailureEvent last = events.get(events.size() - 1);
    return last.getLogs().stream()
        .anyMatch(l -> "STABLE_CHECK_PASSED".equals(l.getHandleStage()));
}
```

### 14.5 计算故障摘要

```java
FaultProcessVO computeSummary(FaultProcess process, List<String> chainAnomalies) {
    FailureEvent first = process.getEvents().get(0);
    FailureEvent last = process.getEvents().get(process.getEvents().size() - 1);
    boolean closed = isClosed(process);

    LocalDateTime startTime = first.getFailureTime();
    LocalDateTime recoveryTime = null;
    Long durationSeconds = null;

    if (closed) {
        recoveryTime = last.getLogs().stream()
            .filter(l -> "STABLE_CHECK_PASSED".equals(l.getHandleStage()))
            .map(HandleLog::getHandleTime)
            .min(Comparator.naturalOrder())
            .orElse(null);
        if (recoveryTime != null) {
            durationSeconds = ChronoUnit.SECONDS.between(startTime, recoveryTime);
        }
    } else {
        durationSeconds = ChronoUnit.SECONDS.between(startTime, LocalDateTime.now());
    }

    Integer restartCount = last.getLogs().stream()
        .map(HandleLog::getRestartCountTotal)
        .filter(Objects::nonNull)
        .max(Comparator.naturalOrder())
        .orElse(last.getLogs().stream()
            .map(HandleLog::getAttemptNo)
            .filter(Objects::nonNull)
            .max(Comparator.naturalOrder())
            .orElse(null));

    String finalJobId;
    if (closed) {
        finalJobId = last.getLogs().stream()
            .filter(l -> "STABLE_CHECK_PASSED".equals(l.getHandleStage()) && l.getNewJobId() != null)
            .min(Comparator.comparing(HandleLog::getHandleTime))
            .map(HandleLog::getNewJobId)
            .orElse(null);
    } else {
        finalJobId = last.getLogs().stream()
            .filter(l -> l.getNewJobId() != null)
            .reduce((first2, second) -> second)  // 取最后一条
            .map(HandleLog::getNewJobId)
            .orElse(last.getFailedJobId());
    }

    return FaultProcessVO.builder()
        .faultRootId(first.getEventId())
        .closed(closed)
        .firstFailureTime(format(startTime))
        .recoveryTime(recoveryTime != null ? format(recoveryTime) : null)
        .durationSeconds(durationSeconds)
        .durationText(formatDuration(durationSeconds))
        .eventCount(process.getEvents().size())
        .restartCount(restartCount)
        .initialJobId(first.getFailedJobId())
        .finalJobId(finalJobId)
        .lastHandleTime(format(last.getLogs().get(last.getLogs().size() - 1).getHandleTime()))
        .chainAnomalies(chainAnomalies)
        .events(buildEventVOs(process.getEvents()))
        .build();
}
```

### 14.6 计算逻辑 Job 两级状态

```java
/**
 * 计算两级状态。
 * 返回 JobStatusResult 包含：
 * - jobStatus: Job 当前状态（NORMAL / RECOVERING）
 * - faultProcessStatus: 故障过程状态（RECOVERED / WAITING_RESTART / RESTARTING / RECOVERY_FAILED / ABNORMAL）
 */
JobStatusResult computeStatus(FaultProcess latestProcess) {
    // 无故障过程 → 正常
    if (latestProcess == null) {
        return new JobStatusResult(JobStatus.NORMAL, null);
    }

    List<FailureEvent> events = latestProcess.getEvents();
    if (events.isEmpty()) {
        return new JobStatusResult(JobStatus.NORMAL, null);
    }

    FailureEvent lastEvent = events.get(events.size() - 1);
    List<HandleLog> logs = lastEvent.getLogs();

    // 检查链异常
    boolean hasChainAnomaly = latestProcess.getChainAnomalies() != null
        && !latestProcess.getChainAnomalies().isEmpty();

    // 无处理记录 → 流程异常
    if (logs.isEmpty()) {
        return new JobStatusResult(JobStatus.RECOVERING, FaultProcessStatus.ABNORMAL);
    }

    // STABLE_CHECK_PASSED → 已恢复 → Job 正常
    boolean hasStableCheck = logs.stream()
        .anyMatch(l -> "STABLE_CHECK_PASSED".equals(l.getHandleStage()));
    if (hasStableCheck) {
        return new JobStatusResult(JobStatus.NORMAL, FaultProcessStatus.RECOVERED);
    }

    // 获取最后一条日志的阶段
    HandleLog lastLog = logs.get(logs.size() - 1);
    String stage = lastLog.getHandleStage();

    FaultProcessStatus faultStatus;
    if ("NEW_JOB_SUBMIT_FAILED".equals(stage)) {
        faultStatus = FaultProcessStatus.RECOVERY_FAILED;
    } else if ("RESTART_STARTED".equals(stage) || "NEW_JOB_SUBMIT_SUCCEEDED".equals(stage)) {
        faultStatus = FaultProcessStatus.RESTARTING;
    } else if ("RESTART_SCHEDULED".equals(stage)) {
        if (lastLog.getNextRestartTime() != null
            && lastLog.getNextRestartTime().isAfter(LocalDateTime.now())) {
            faultStatus = FaultProcessStatus.WAITING_RESTART;
        } else {
            faultStatus = FaultProcessStatus.ABNORMAL;  // 计划时间已过
        }
    } else if (hasChainAnomaly) {
        faultStatus = FaultProcessStatus.ABNORMAL;
    } else {
        faultStatus = FaultProcessStatus.ABNORMAL;
    }

    // 所有非"已恢复"的故障过程状态 → Job 当前状态=恢复中
    return new JobStatusResult(JobStatus.RECOVERING, faultStatus);
}
```

### 14.7 选取最近故障

```java
FaultProcess getLatestFault(List<FaultProcess> processes) {
    if (processes.isEmpty()) return null;

    // 按故障开始时间降序排序
    List<FaultProcess> sorted = processes.stream()
        .sorted(Comparator.comparing(FaultProcess::getFirstFailureTime).reversed())
        .toList();

    // 存在未闭环 → 即为"最近故障"
    for (FaultProcess p : sorted) {
        if (!isClosed(p)) return p;
    }

    // 全部已闭环 → 返回最新的
    return sorted.get(0);
}
```

### 14.8 历史故障时间范围筛选

```java
/**
 * 按时间范围筛选故障过程，返回摘要列表。
 * 当前未闭环故障不受时间范围限制，始终包含并置顶。
 */
HistoryResult filterHistoryByTimeRange(
    List<FaultProcess> allProcesses, String range, int maxFaultProcesses) {

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime cutoff = switch (range) {
        case "1d" -> now.minusDays(1);
        case "1w" -> now.minusWeeks(1);
        case "1m" -> now.minusMonths(1);
        default -> now.minusDays(1);
    };

    // 分离未闭环和已闭环
    List<FaultProcess> unclosed = allProcesses.stream()
        .filter(p -> !isClosed(p))
        .sorted(Comparator.comparing(FaultProcess::getFirstFailureTime).reversed())
        .toList();

    List<FaultProcess> closedInRange = allProcesses.stream()
        .filter(p -> isClosed(p)
            && p.getFirstFailureTime() != null
            && !p.getFirstFailureTime().isBefore(cutoff))
        .sorted(Comparator.comparing(FaultProcess::getFirstFailureTime).reversed())
        .toList();

    // 合并：未闭环始终置顶
    List<FaultProcess> result = new ArrayList<>(unclosed);
    result.addAll(closedInRange);

    // 最大数量保护
    boolean truncated = result.size() > maxFaultProcesses;
    if (truncated) {
        result = result.subList(0, maxFaultProcesses);
    }

    List<HistoricalFaultVO> records = result.stream()
        .map(this::toHistoricalVO)
        .toList();

    return new HistoryResult(records, truncated, !unclosed.isEmpty());
}
```

### 14.9 算法执行位置总结

| 步骤 | 位置 | 说明 |
|------|------|------|
| 查询活跃客户端 | SQL | CDC_CLIENT_MULTIPLE WHERE FG_ACTIVE='1' |
| 查询失败事件+日志 | SQL | 单次 LEFT JOIN，按 (CLIENT_ID, DATA_SOURCE_ID) 过滤 |
| 查询数据源名称 | SQL | CDC_DATA_SOURCE 全表（缓存） |
| 查询运行状态 | SQL | CDC_DATA_SOURCE_RUN_STATE |
| 按逻辑 Job 分组 | Java | Map<(String,String), List<FailureEvent>> |
| 构建物理 Job 链 | Java | ListMultiMap + 确定性选取 + 异常标记 |
| 检测重复/分叉/循环/断链/多前驱 | Java | 遍历 + 异常标记 + anomalyNote |
| 切分故障过程 | Java | STABLE_CHECK_PASSED 切分 |
| 计算摘要和状态 | Java | 遍历计算 |
| 选取最近故障 | Java | 规则判断 |
| 历史故障时间范围筛选 | Java | 未闭环置顶 + 时间范围筛选 + 最大数量保护 |
| 组装响应 DTO | Java | Builder/Converter |

---

## 15. 排序、分页和刷新规则汇总

### 15.1 排序规则

| 维度 | 排序规则 |
|------|----------|
| 客户端 | CLIENT_ID 升序 |
| 客户端内逻辑 Job | 有未闭环故障的排前 → DATA_SOURCE_ID 升序 |
| 故障过程中事件 | FAILURE_TIME 升序（时间正序） |
| 事件内处理记录 | HANDLE_TIME ASC, ID ASC |
| 历史故障列表 | 未闭环置顶 → 已闭环按首次失败时间降序 |

### 15.2 分页与时间范围规则

| 维度 | 方式 | 说明 |
|------|------|------|
| 主页面 | 不分页 | 客户端数有限，一次性返回 |
| API-3 历史故障 | 时间范围筛选 | 最近一天（默认）/一周/一个月，不分页 |
| API-4 指定故障 | 按 faultRootId 精确查询 | 不涉及分页 |

历史故障第一版不提供任意起止日期。时间范围最长为最近一个月。后端设置最大故障过程数量保护，超出时截断并返回 `truncated: true`。

### 15.3 刷新规则

| 页面 | 自动刷新 | 默认周期 |
|------|----------|----------|
| 主页面 | 是 | 1 分钟 |
| 详情页-最近故障 | **否** | N/A |
| 详情页-历史故障 | **否** | N/A |

---

## 16. 查询性能与索引建议

### 16.1 各接口涉及的表和关联

| 接口 | 涉及表 | 主要关联 |
|------|--------|----------|
| API-1 | CDC_CLIENT_MULTIPLE, CDC_JOB_FAILURE_EVENT, CDC_JOB_FAILURE_HANDLE_LOG, CDC_DATA_SOURCE, CDC_DATA_SOURCE_RUN_STATE | LEFT JOIN + Java 聚合 |
| API-2 | CDC_JOB_FAILURE_EVENT, CDC_JOB_FAILURE_HANDLE_LOG, CDC_DATA_SOURCE | 按 (CLIENT_ID, DATA_SOURCE_ID) 过滤 + LEFT JOIN |
| API-3 | 同上 | 同上 + Java 聚合后时间范围筛选 |
| API-4 | 同上 | 同上 + 需构建完整事件链 |
| API-5 | CDC_JOB_FAILURE_EVENT 或 CDC_JOB_FAILURE_HANDLE_LOG | 按主键 ID 查询单条 CLOB 字段 |

### 16.2 数据库侧聚合 vs 应用侧聚合边界

```
数据库侧:
  - 按逻辑 Job 过滤事件
  - 事件 JOIN 处理日志
  - 按 HANDLE_TIME / FAILURE_TIME 排序
  - 数据源名称查询
  - CLOB 字段按主键点查（API-5）

应用侧:
  - 物理 Job 链构建（含异常检测）
  - 故障过程切分
  - 状态计算
  - 摘要计算
  - 历史故障排序与时间范围筛选
```

### 16.3 为什么不设固定时间窗口

- 物理 Job 链可能跨任意时间范围，固定时间窗口会截断链条
- 故障过程的完整性依赖完整的 Job ID 链，不应被时间边界破坏
- 页面按 CLIENT_ID + DATA_SOURCE_ID 查询，数据规模由逻辑 Job 的事件数决定
- 性能问题通过索引和后续执行计划验证解决

### 16.4 为什么历史采用时间范围而非分页

- 故障过程按首次失败时间筛选，用户对时间维度有直觉认知
- 单次时间范围内的故障过程数量可控（通常不超过几十个）
- 避免分页 total 是故障过程数但实际数据量难以预估的问题
- 第一版简化交互，后续可根据数据量增长增加分页
- 后端有最大故障过程数量保护，防止一次返回过多数据

### 16.5 预期查询次数

| 接口 | SQL 查询次数 | 说明 |
|------|-------------|------|
| API-1 | 4 | CDC_CLIENT_MULTIPLE + 失败事件批量查询 + CDC_DATA_SOURCE + CDC_DATA_SOURCE_RUN_STATE |
| API-2 | 2 | 失败事件+日志 JOIN + CDC_DATA_SOURCE |
| API-3 | 2 | 同 API-2 |
| API-4 | 2 | 同 API-2 |
| API-5 | 1 | 按主键查询单条 CLOB 字段 |

不存在 N+1 查询。客户端和数据源名称通过批量查询或缓存获取。CLOB 按需独立加载，不阻塞列表和详情主接口。

### 16.6 现有索引能否支持

| 表 | 现有索引 | 能否支持 |
|------|----------|----------|
| CDC_JOB_FAILURE_EVENT | 仅主键 ID | **不能** — 缺 (CLIENT_ID, DATA_SOURCE_ID, FAILURE_TIME) 复合索引 |
| CDC_JOB_FAILURE_HANDLE_LOG | 仅主键 ID | **不能** — 缺 (FAILURE_EVENT_ID, HANDLE_TIME, ID) 复合索引 |
| CDC_CLIENT_MULTIPLE | 未知（需确认） | 需确认 CLIENT_ID 上有无索引 |
| CDC_DATA_SOURCE | 主键 DATA_SOURCE_ID | 能支持 |

### 16.7 建议索引

| 优先级 | 表 | 建议索引 | 覆盖查询 |
|--------|------|----------|----------|
| **高** | CDC_JOB_FAILURE_EVENT | `(CLIENT_ID, DATA_SOURCE_ID, FAILURE_TIME DESC)` | 逻辑 Job 维度查询 |
| **高** | CDC_JOB_FAILURE_HANDLE_LOG | `(FAILURE_EVENT_ID, HANDLE_TIME, ID)` | 事件详情 JOIN + 排序 |
| 中 | CDC_CLIENT_MULTIPLE | `(CLIENT_ID)` | 客户端查询（如不存在） |

### 16.8 需要进一步验证

- 数据量增长后（如事件超过万条），Java 内存聚合的内存占用
- 如未来数据量显著增长，需通过执行计划验证索引是否满足查询性能
- Oracle 递归 CTE 方案的性能对比（作为长期优化选项）

**本任务不创建索引。** 索引创建需独立审批。

---

## 17. 前端交互状态

### 17.1 路由和导航

| 属性 | 值 |
|------|-----|
| 主页面路由 | `/monitor/job-failure` |
| 详情页路由 | `/monitor/job-failure/:clientId/:dataSourceId` |
| 指定故障详情路由 | `/monitor/job-failure/:clientId/:dataSourceId/fault/:faultRootId` |
| 面包屑-主页 | 运行监控 > Job 运行与故障恢复 |
| 面包屑-最近故障 | 运行监控 > Job 运行与故障恢复 > 故障详情 |
| 面包屑-历史故障详情 | 运行监控 > Job 运行与故障恢复 > 历史故障详情 |
| 返回行为-主页 | "返回 Job 运行与故障恢复" → 回到主页面（恢复折叠状态、滚动位置、自动刷新周期） |
| 返回行为-历史 | "返回 Job 运行与故障恢复" → 回到历史故障页签（恢复时间范围和滚动位置） |

### 17.2 加载状态

| 场景 | UI 表现 |
|------|---------|
| 首次加载 | 页面级骨架屏（skeleton），各区域占位 |
| 自动刷新 | 无感刷新（不显示 loading 遮罩），右上角刷新时间更新 |
| 手动刷新 | 刷新按钮旋转动画，刷新时间更新 |
| 详情加载 | 汇总区域骨架屏 + 卡片骨架屏 |
| 历史时间范围切换 | 列表区域局部 loading |
| CLOB 懒加载 | 点击"展开全文"后，对应区域显示局部 loading → 加载完成后展示完整文本 |

### 17.3 空数据状态

| 场景 | UI 表现 |
|------|---------|
| 无客户端 | 空状态插图 + "暂无活跃客户端" |
| 客户端无逻辑 Job | 折叠区域展开后显示 "暂无逻辑 Job" |
| 逻辑 Job 无故障记录 | 详情页显示 "暂无故障记录"（绿色空状态） |
| 全部故障过程已展示完 | "暂无更多故障记录" |
| 无处理记录 | 卡片内显示 "暂无处理记录" + 标记为流程异常 |

### 17.4 错误状态

| 场景 | UI 表现 |
|------|---------|
| 接口整体失败 | 页面级错误提示 + 重试按钮 |
| 部分客户端加载失败 | 该客户端区域显示错误信息 + 单独重试 |
| 刷新失败 | 顶部 warning 条 "刷新失败，点击重试"，旧数据保留 |
| 参数不合法 | 详情页显示 404/400 错误提示 |
| CLOB 加载失败 | 展开区域显示错误提示 + "重新加载"按钮 |

### 17.5 交互细节

| 场景 | 交互 |
|------|------|
| 长 Job ID | 截断 + hover tooltip + 点击复制图标（Element Plus 标准复制图标，悬停提示"复制完整 Job ID"） |
| 异常堆栈/ERROR_DETAIL | 等宽字体、默认 3 行、点击"展开全文"通过 API-5 懒加载、支持"收起"和"复制全文" |
| FAILURE_DETAIL | 点击"展开全文"通过 API-5 懒加载，等宽字体、限高可滚动、一键复制 |
| 客户端折叠 | 点击标题栏展开/折叠，带过渡动画；异常客户端默认展开，正常客户端默认折叠；自动刷新不重置用户选择 |
| 事件卡片展开 | 已闭环：默认展开最后一个事件；未闭环：默认展开当前事件；异常事件默认展开；手动展开不因 CLOB 懒加载而改变 |
| 历史时间范围 | 使用 `el-select` 下拉框，选项：最近一天/一周/一个月，默认最近一天 |
| 历史"查看"操作 | 打开独立的指定故障详情页面，URL 携带 `faultRootId`；不切换或伪装成"最近一次故障"页签 |
| 页签切换 | 保留各自展开状态 |
| 页面返回 | "返回 Job 运行与故障恢复"链接 → 回到主页面（恢复折叠状态、滚动位置、刷新周期） |
| 异常链标记 | 事件卡片标题栏右侧显示红色"异常链"标签，左边框 3px 红色，显示异常摘要 |
| 未闭环行样式 | 浅红色背景（#fef0f0），故障过程状态使用浅红色标签 |
| 无故障记录 | 历史页签显示"暂无故障记录"，Job 当前状态显示"正常"，当前 Job ID 无依据时显示 `--` |
| 响应式 | 最低支持 1280px 宽度；低于此宽度时表格横向滚动 |

---

## 18. 异常数据及边界场景完整清单

| 序号 | 边界场景 | 检测方式 | 处理策略 | 用户可见提示 |
|------|----------|----------|----------|-------------|
| 1 | 失败事件无处理记录 | NOT EXISTS 检查 | 状态=流程异常 | 事件卡片标记 ⚠️ "处理记录缺失" |
| 2 | 处理步骤数异常（< 3 或 > 10） | COUNT 检查 | 按实际条数渲染 | 不提示（不做数量假设） |
| 3 | JOB_FAILURE_RECEIVED 缺失 | 检查首条 HANDLE_STAGE | 状态=流程异常 | ⚠️ "处理序列异常：缺少失败接收阶段" |
| 4 | 同一 HANDLE_STAGE 重复 | GROUP BY + COUNT | 取 HANDLE_TIME 最早的 | ⚠️ "检测到重复处理阶段，已自动去重" |
| 5 | 处理时间相同 | 相邻比较 | ID ASC 稳定排序 | 不提示 |
| 6 | NEW_JOB_ID 为空（应有值阶段） | NEW_JOB_SUBMIT_SUCCEEDED 但 NEW_JOB_ID IS NULL | 状态=流程异常 | ⚠️ "新 Job ID 缺失，无法追踪" |
| 7 | 同事件多个不同 NEW_JOB_ID | DISTINCT NEW_JOB_ID > 1 | 取第一条，其他忽略 | ⚠️ "检测到多个新 Job ID，已取首次出现值" |
| 8 | 重复 FAILED_JOB_ID | ListMultiMap size > 1 | 取 FAILURE_TIME 最早的事件构建链，其余标记 anomalyFlag=true | ⚠️ "检测到重复 FAILED_JOB_ID，已取最早事件，其余保留可见" |
| 9 | NEW_JOB_ID 匹配多个后续 FAILED_JOB_ID（分叉） | ListMultiMap size > 1 | 取 FAILURE_TIME 最早的事件作为链后继，其余分支标记 anomalyFlag=true 并保留为独立链条 | ⚠️ "Job ID 匹配到多个后续事件，已取最早事件，分支事件保留可见" |
| 10 | 链条中间断裂 | NEW_JOB_ID 无匹配 FAILED_JOB_ID | 断裂处标记为独立故障过程 | ⚠️ "事件链断裂，已作为独立故障处理" |
| 11 | 事件链形成循环 | 递归访问检测 | 截断循环，标记异常 | ⚠️ "检测到事件链循环，已在重复处截断" |
| 12 | 同一事件有多个前驱 | predecessors size > 1 | 保留所有链接，在 anomalyNote 中注明 | ⚠️ "该事件有多个前驱事件，可能存在数据关联歧义" |
| 13 | 跨客户端/逻辑 Job 的 Job ID 碰撞 | GROUP BY 检查 | 分链处理 | 不提示（UUID 不应碰撞） |
| 14 | STABLE_CHECK_PASSED 后同逻辑 Job 再失败 | 时间线检查 | 归为新的独立故障过程 | 不提示（正常业务逻辑） |
| 15 | FAILURE_DETAIL / ERROR_DETAIL 过大 | LENGTH > 50000 | 截断至 50000 字符，API-5 返回 truncated=true | "内容过长（{N}字符），已截断至前 50000 字符" |
| 16 | 长文本含敏感信息 | 正则匹配 | API-5 后端脱敏 + 前端二次校验 | 不提示 |
| 17 | FAILURE_TIME / HANDLE_TIME 为 NULL | IS NULL 检查 | 使用 CREATED_AT 回退 | ⚠️ "部分时间字段缺失，已使用记录创建时间替代" |
| 18 | CLIENT_ID 不在 CDC_CLIENT_MULTIPLE 中 | -- | 不会出现（仅展示活跃客户端） | 不适用 |
| 19 | DATA_SOURCE_ID 不在 CDC_DATA_SOURCE 中 | LEFT JOIN 检查 | 仅显示 DATA_SOURCE_ID | "数据源配置未找到" |
| 20 | CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID 解析失败 | 逗号分隔解析异常 | 跳过该条目 | "数据源 ID 解析异常：{原始值}" |
| 21 | RESTART_SCHEDULED 但 NEXT_RESTART_TIME 已过 | NEXT_RESTART_TIME < now 且无 RESTART_STARTED | 状态=流程异常 | ⚠️ "计划重启时间已过但未执行，请检查" |

---

## 19. 待确认问题

**所有问题已在 041 修订阶段确认完毕。**

| 编号 | 问题 | 状态 | 结论 |
|------|------|------|------|
| Q-1 | 主页面是否仅展示 FG_ACTIVE='1' 的客户端？ | **已确认** | 仅展示活跃客户端 |
| Q-2 | 无运行记录的逻辑 Job 是否展示？ | **已确认** | 展示活跃客户端配置中声明的全部逻辑 Job |
| Q-3 | FAILURE_DETAIL CLOB 是否需要独立加载接口？ | **已确认** | 增加 API-5 长文本懒加载接口 |
| Q-4 | 无失败记录的逻辑 Job 的"查看记录"按钮行为？ | **已确认** | 保留按钮，进入详情页显示"暂无故障记录" |

---

## 20. 阻塞项

| 编号 | 阻塞项 | 严重程度 | 状态 |
|------|--------|----------|------|
| -- | **当前无阻塞项** | -- | -- |

040 任务的 B-1/B-2/B-3 已全部由用户确认解除。本规格任务无新增阻塞项。

---

## 21. 下一步建议

按以下顺序推进：

1. **效果图修订**：基于 v1.2 规格修订 HTML 效果图和 PNG 截图（043 任务当前阶段）
2. **UI 视觉说明文档修订**：同步更新 `job-runtime-failure-recovery-ui-review.md`（043 任务当前阶段）
3. **后端任务拆分**：从零构建 Java 实体、Mapper、Service、Controller
4. **前端任务拆分**：实现主页面、详情页（最近一次故障 + 历史故障 + 指定故障详情）、CLOB 懒加载
5. **数据库索引创建**：独立审批后补充复合索引
6. **集成验收**：端到端验证页面功能和数据准确性

---

## 附录 A: DTO/VO 命名对照表

| VO 名称 | 用途 | 所属接口 |
|---------|------|----------|
| JobFailureSummaryResponse | 主页面顶层响应 | API-1 |
| ClientSummaryVO | 客户端概览 | API-1 |
| LogicalJobSummaryVO | 逻辑 Job 概览 | API-1 |
| LatestFaultResponse | 最近故障详情响应 | API-2 |
| FaultProcessVO | 故障过程完整信息（含事件+日志） | API-2, API-4 |
| FailureEventVO | 物理 Job 失败事件 | API-2, API-4 |
| HandleLogVO | 处理日志记录 | API-2, API-4 |
| HistoryResponse | 历史故障响应（含时间范围、截断标记） | API-3 |
| HistoricalFaultVO | 历史故障摘要（不含事件详情） | API-3 |
| ClobResponse | 长文本懒加载响应 | API-5 |

## 附录 B: 状态枚举值对照

### B.1 Job 当前状态（2 种）

| 中文名称 | Java 枚举 | 前端展示 |
|----------|-----------|----------|
| 正常 | NORMAL | 绿色文字 #67C23A + 浅绿色背景 #f0f9eb |
| 恢复中 | RECOVERING | 红色文字 #F56C6C + 浅红色背景 #fef0f0 |

### B.2 故障过程状态（5 种）

| 中文名称 | Java 枚举 | 前端展示 |
|----------|-----------|----------|
| 已恢复 | RECOVERED | 绿色文字 #67C23A + 浅绿色背景 #f0f9eb |
| 等待重启 | WAITING_RESTART | 红色文字 #F56C6C + 浅红色背景 #fef0f0 |
| 重启中 | RESTARTING | 红色文字 #F56C6C + 浅红色背景 #fef0f0 |
| 恢复失败 | RECOVERY_FAILED | 红色文字 #F56C6C + 浅红色背景 #fef0f0 |
| 流程异常 | ABNORMAL | 红色文字 #F56C6C + 浅红色背景 #fef0f0 |

### B.3 两级状态映射

| 故障过程状态 | Job 当前状态 |
|-------------|-------------|
| 已恢复 | 正常 |
| 等待重启 | 恢复中 |
| 重启中 | 恢复中 |
| 恢复失败 | 恢复中 |
| 流程异常 | 恢复中 |
| 无故障记录 | 正常 |

## 附录 C: 文档修订记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-07-28 | v1.0 | 初始版本，基于 040 分析结论编制 |
| 2026-07-28 | v1.1 | 修订：恢复为 5 种状态，删除调度超时；移除 90 天固定时间窗口；统一最近/历史故障定义；修正物理 Job 链算法（ListMultiMap + 异常检测）；确认 Q1-Q4；新增 API-5 CLOB 懒加载；全文同步修订 |
| 2026-07-28 | v1.2 | 依据 043 视觉验收结论全面修订：引入两级状态体系（Job 当前状态 2 种 + 故障过程状态 5 种）；客户端标题栏增加正常/异常数量统计；主列表删除 dataSourceOrg/机构/业务库字段；历史故障从分页改为时间范围查询（1d/1w/1m）；增加最大故障过程数量保护；指定故障详情独立页面；物理 Job 演变链、异常链提示、CLOB 三行摘要懒加载；事件卡片时间正序；扁平边框风格（无 glassmorphism）；全文 DTO、JSON 示例、算法、状态枚举同步修订 |
