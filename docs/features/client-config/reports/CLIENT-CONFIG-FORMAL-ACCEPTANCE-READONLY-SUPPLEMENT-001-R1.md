# 探针端管理 Feature 正式验收只读补测 R1 报告（CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001-R1）

> 任务编号：`CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001-R1`
> 执行分支：`develop`
> 任务开始前 Commit：`b81284fd8a46b9c1bc99792d202456971e1ce50d`
> 报告性质：**实际只读补测 + 验收记录纠错**——针对远程复审对 `b81284f` 给出的 `CHANGES_REQUIRED`（`CCFG-AC-100` 与 `CCFG-AC-143` 现有证据**缺少定义要求的关键操作**），在真实页面上**现场补齐**这两个缺口，**再据真实结果决定状态**；不预设两条必须 `PASS`，也不预设本轮四态统计。
> 触发事实：ChatGPT 从远程 Git 复审 `b81284f` 的结论为 `CHANGES_REQUIRED`——提交范围与 154 条验收定义保护成立，`CCFG-AC-041` 的多状态观察可保留，但 `CCFG-AC-100`/`CCFG-AC-143` 证据不足。
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_FORMAL_ACCEPTANCE_READONLY_SUPPLEMENT_R1_REVIEW`

---

## 0. 状态与边界声明

1. 本任务**不重启**服务：上轮（`...-001`）启动的前端 5173、后端 8080 在本次开始时**仍在运行**，且经进程启动目录、实际服务文件与只读 GET 交叉核对，对应本次 `develop` 源码（见 §2）。全程保持运行。
2. 浏览器侧**在打开页面之前**即安装 `/api/**` 拦截：`GET`/`HEAD`/`OPTIONS` 放行，其余方法一律 abort 并计数；本轮两个探针脚本实测**非 GET 请求到达后端计数均为 0**（零写）。
3. 只允许：导航、查询、悬停、聚焦、滚动、打开／取消弹层、真实按键触发客户端弹窗。**未**点击启停／删除的最终确认、**未**提交任何有效新增／编辑表单、**未**执行 W1~W8、**未**创建夹具、**未**手工连接或写入数据库／ZooKeeper／Kafka、**未**运行单元测试／构建／lint／迁移／部署。
4. **禁造证据**：本轮以真实页面的真实按键与真实弹层观察取证；用 `locator.focus()`、只看 `tabindex="0"` 或代码推断**一律不作为** Tab 证据。**不**以聚合布尔值替代逐步骤现场。
5. 本任务**未新增任何真实产品反例**，故 `FAIL` 仍为 0；若发现反例将如实记录并停线。
6. 本任务**不**写入 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/整体 `PASS`；`...-001` 及 R0~R5 报告与索引**不**回写；仅新建本报告与脱敏证据 R1 索引，并做 `ACCEPTANCE.md`／`README.md` 的最小必要同步。

---

## 1. 现场门禁（开始前，只读核对）

| 项 | 实测值 |
|---|---|
| 当前分支 | `develop`（非 develop 即停线，未触发） |
| `HEAD` | `b81284fd8a46b9c1bc99792d202456971e1ce50d` |
| `origin/develop` | `b81284fd8a46b9c1bc99792d202456971e1ce50d` |
| 远程 `refs/heads/develop` | `b81284fd8a46b9c1bc99792d202456971e1ce50d` |
| ahead/behind（`origin/develop...HEAD`） | `0 0`（无分叉） |
| 工作区既有无关改动 | ` M .claude/settings.local.json`、`?? docs/prompts/`、`?? runtime-logs/`（保持原样，未触碰、未暂存、未提交；前序任务的仓库外临时目录亦未清理） |

结论：基线与任务提示一致（`b81284f…`），无本地/远程分叉，未执行 reset/clean/stash/rebase/force-push 或任何覆盖他人工作的操作。

---

## 2. 服务与源码对应（START-ONLY，未重启）

上轮以 START-ONLY 方式启动的前后端在本轮开始时**仍在运行**，故本任务**未**重新启动，仅做只读核对。

| 项 | 值 |
|---|---|
| 后端进程 | `java`，PID **13434**，`/proc/13434/cwd → /agent/cdc-config-platform/backend`，监听 `0.0.0.0:8080` |
| 前端进程 | Vite dev server，PID **13522**（父 `npm` PID 13509），`/proc/13522/cwd → /agent/cdc-config-platform/frontend`，监听 `0.0.0.0:5173` |
| 只读 GET 结果 | 后端 `/api/health` → `200`、`/api/clients` → `200`；前端 `/config/client` → `200`（`curl --noproxy '*'` 本机核验） |
| 源码对应（后端） | 运行 jar 构建于 2026-09-22；`backend/` 最后一次改动为 `807a5a5`（2026-09-20），晚于该构建**无后端源码变更** → jar 与当前后端源码一致 |
| 源码对应（前端） | Vite dev server 从当前工作区源码实时提供；`frontend/src/views/client-config/` 最后改动 `aaaca77`（2026-09-26）且工作区干净 → 页面即当前源码；探针实测到的 `.cc-row--selected` 固定行样式与当前源码一致 |
| 收尾 | 任务结束时服务**保持运行**供项目负责人验收；停止命令与定位信息见 §8 |
| 边界 | 本机 `200` 不等于项目负责人侧网络可达；报告不宣称“外部访问已通过”。 |

> 报告中不输出密码、完整连接串或内网业务凭据；上述端口／PID 仅用于本项目内网开发环境定位。

---

## 3. 缺口补齐（`CCFG-AC-100`）
### 真实 Tab 聚焦与焦点视觉（1440×900 与 1920×1080）

**复审指出的缺口**：上轮 `probeC.mjs` 只读取三点入口的 `tabindex`/`aria-label`/图标结构，**没有按 Tab 键聚焦并观察焦点**。

**本轮补齐**（`probeE.mjs`，两视口）：先 blur 使 `document.activeElement` 为 `BODY`（无焦点），再**真实按 Tab 键**逐步前进，记录**每一次落点**（键序号 / 元素 / 所在行 / 是否目标入口 / 可访问名称 / `:focus-visible`），直到三类代表行的三点入口逐一获得焦点。

| 子步骤 | 1440×900 | 1920×1080 |
|---|---|---|
| 行总数 | 16 | 16 |
| 入口均为水平三点图标（无“更多”文字） | 是 | 是 |
| 行状态集合 | `['1','0','abnormal']` | `['1','0','abnormal']` |
| 三态菜单（单击入口读取） | `'1'`→`["停用","删除"]`；`'0'`→`["启用","删除"]`；异常→`["停用","删除"]` | 同左（一致） |
| 真实 Tab 总按键数 | 38 | 38 |

**真实 Tab 到达三类代表行入口的记录**（`activeElement` 即目标入口、可访问名称、焦点可见样式）：

| 代表行（状态） | 视口 | 到达键序号 | `document.activeElement` 即目标入口 | 可访问名称 | `:focus-visible` | 计算 outline | box-shadow | 背景 | 前一落点 |
|---|---|---|---|---|---|---|---|---|---|
| `hosp-001`（`FG_ACTIVE='0'`） | 1440×900 | 12 | 是 | `更多操作：hosp-001` | `true` | `2px solid rgb(64,158,255)` | `none` | `rgba(0,0,0,0)` | 同行 `.cc-id` |
| `CCFG-AC-R1-ABN`（异常） | 1440×900 | 30 | 是 | `更多操作：CCFG-AC-R1-ABN` | `true` | `2px solid rgb(64,158,255)` | `none` | `rgba(0,0,0,0)` | 同行 `.cc-id` |
| `hosp-012`（`FG_ACTIVE='1'`） | 1440×900 | 38 | 是 | `更多操作：hosp-012` | `true` | `2px solid rgb(64,158,255)` | `none` | `rgba(0,0,0,0)` | 同行 `.cc-id` |
| 同上三条 | 1920×1080 | 12 / 30 / 38 | 是 | 同左 | `true` | `2px solid rgb(64,158,255)` | `none` | `rgba(0,0,0,0)` | 同行 `.cc-id` |

- 键盘路径实录：每行落点恒为 `.cc-id`（`编辑探针 {ID}`，`role=button`）→ `.cc-more-link`（`更多操作：{ID}`，`role=button`，`tabindex=0`），即三点入口紧随本行 `.cc-id`；两视口到达序号一致（12/30/38），证明路径可复现且与视口无关。
- 每次到达均 `:focus-visible === true`，计算样式见到恒定 `2px solid rgb(64,158,255)` 焦点环；焦点可见、名称可读、三态菜单一致。

→ `CCFG-AC-100` 的**全部前置、步骤、预期**均获真实覆盖，**未发现产品反例**，维持 `PASS`。

---

## 4. 缺口补齐（`CCFG-AC-143`）
### 每个原子动作之后立即核对固定选中状态

**复审指出的缺口**：上轮 `probeB.mjs` 在整组“更多→各菜单项→确认取消”**结束后**才读取一次固定行，无法排除中间操作发生短暂错误切换。

**本轮补齐**（`probeF.mjs`）：从未固定与已固定两种初始状态分别执行定义的交互，并**在每个原子动作之后立即**取独立快照；菜单项“点击后确认窗打开”与“取消后”各有独立快照。57 个逐步快照，4 个 scope。

**主目标行**：`CCFG-AC-R1-ON`（渲染 `启用/删除`，即 `FG_ACTIVE='0'`）。
**补充目标行**：`hosp-012`（渲染 `停用/删除`，即 `FG_ACTIVE='1'`）——用于覆盖 `停用` 分支。

| 原子动作（每步各自独立快照） | 未固定起始态 · 固定 ID | 已固定起始态（固定 `CCFG-AC-R1-ON`） · 固定 ID |
|---|---|---|
| 起始 baseline | `null` | `CCFG-AC-R1-ON` |
| ① 三点触发器：打开 | `null`（菜单开，条目 `["启用","删除"]`） | `CCFG-AC-R1-ON` |
| ① 三点触发器：关闭 | `null` | `CCFG-AC-R1-ON` |
| ② “启用”条目 → 确认窗打开 | `null`（`confirmOpen=true`，标题“启用探针”，按钮 `["取消","启用"]`） | `CCFG-AC-R1-ON` |
| ② 取消 | `null` | `CCFG-AC-R1-ON` |
| ② “删除”条目 → 确认窗打开 | `null`（`confirmOpen=true`，标题“删除探针”，按钮 `["取消","删除"]`） | `CCFG-AC-R1-ON` |
| ② 取消 | `null` | `CCFG-AC-R1-ON` |
| ③ `+N`（`plusText="+6"`）：打开 | `null`（`popoverOpen=true`，完整清单 7 项） | `CCFG-AC-R1-ON` |
| ③ `+N`：关闭 | `null` | `CCFG-AC-R1-ON` |
| ④ 标签 Tooltip：显示 | `null`（`tooltipOpen=true`） | `CCFG-AC-R1-ON` |
| ④ 标签 Tooltip：离开 | `null`（`tooltipOpen=false`） | `CCFG-AC-R1-ON` |
| ⑤ 探针 ID：Enter → 编辑弹窗打开 | `null`（`editDialogOpen=true`） | `CCFG-AC-R1-ON` |
| ⑤ 探针 ID：关闭 | `null` | `CCFG-AC-R1-ON` |
| ⑤ 探针 ID：Space → 编辑弹窗打开 | `null`（`editDialogOpen=true`） | `CCFG-AC-R1-ON` |
| ⑤ 探针 ID：关闭 | `null` | `CCFG-AC-R1-ON` |
| 结束 baseline | `null` | `CCFG-AC-R1-ON`（`baseline-end` 仍保持） |

**补充分支（`hosp-012`）**：未固定起始态与已固定起始态各执行“三点触发器打开/关闭 → `停用` 条目 → 确认窗（标题“停用探针”，按钮 `["取消","停用"]`） → 取消”；固定 ID 分别为 `null` 与 `hosp-012`，全程不变。

- **`+N` 实测真正打开**：`popoverOpened=true`、完整清单 `7` 项（**非**仅点击、**非**旧 `plusOpen:false`）。
- **边界保持**：所有 `trigger:*`、`item-*` 快照的 `editDialogOpen=false` → “点击‘更多’及菜单项不触发行双击编辑”保持有效；仅 ⑤ 的 Enter/Space 打开编辑弹窗。
- **无意外切换**：未固定序列 21 步固定 ID 恒为 `null`；已固定序列固定 ID 恒为 `CCFG-AC-R1-ON`（补充序列恒为 `hosp-012`），无任何中间步骤发生短暂错误切换，无需“后续点击掩盖异常状态”。

→ `CCFG-AC-143` 的**全部前置、步骤、预期**均获逐步真实覆盖，**未发现产品反例**，维持 `PASS`。

---

## 5. 定义保护与文档最小改动

| 项 | 证据 |
|---|---|
| 编号完整性 | `CCFG-AC-001~154` 共 154 条，编号完整、唯一、连续 |
| 定义单元保护 | §4 相对 `b81284f` **无任何状态格变化**（程序化比对：定义单元差异集合为空） |
| `ACCEPTANCE.md` 改动范围 | ① 新增 §1.18 R1 状态块；② §4 表前统计/说明追加一段。**不**改动任何状态格 |
| `README.md` 改动范围 | §2 导航新增本报告与证据索引行；§5 将上轮只读补测入口降为历史、新增本项目当前入口 |
| 未改动 | `...-001` 及 R0~R5 报告与索引、`docs/baseline/**` 六份项目级基线、两套公共模板、数据源管理参考页、`docs/prompts/**`、产品代码与测试、`API.md`/`DATABASE.md` 业务定义、`CLAUDE.md`、`agent-env.sh`、`.claude/**` |

---

## 6. 统计（据实际状态格重新计算）

| 状态 | 仅读补测后（`...-001`） | **R1 后（本次）** | 变化 |
|---|---|---|---|
| `PASS` | 69 | **69** | 0 |
| `FAIL` | 0 | **0** | 0 |
| `BLOCKED` | 70 | **70** | 0 |
| `NOT_RUN` | 15 | **15** | 0 |
| 合计 | 154 | **154** | 0 |

- 两条被复审点名的用例（`CCFG-AC-100`、`CCFG-AC-143`）**补齐证据后仍为 `PASS`，本轮不改变任何状态格**（二者由 `BLOCKED`→`PASS` 的上调已在上轮完成）。
- `PASS + FAIL + BLOCKED + NOT_RUN` = **69 / 0 / 70 / 15** = 154；`changed_ids` 为空（相对 `b81284f`）。

---

## 7. 脱敏证据索引与核验

- 脱敏证据索引目录：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001-R1/`
  - `probeE.mjs`（AC-100：两视口入口普查 + 三态菜单 + **真实 Tab 聚焦**逐落点记录）
  - `probeF.mjs`（AC-143：两组初始状态**逐动作**固定 ID 时间线，另补 `停用` 分支）
  - `per-id-results.json`（逐 ID 机读结果：复审指令、写拦截统计、复核 ID、**逐步骤**观测——含两视口完整 Tab 落点序列与 57 步固定 ID 时间线，非聚合布尔）
  - `SHA256SUMS.txt`（仓库外原始产物的 SHA-256 清单，仅哈希与文件名）
- 仓库外原始产物（**未入仓**）：截图 `shots/*.png`（20 张：两视口 Tab 焦点、逐动作确认窗/弹层/编辑弹窗现场）、原始结果 `probeE-result.json`/`probeF-result.json`；原始归档 `CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001-R1-evidence.tar.gz`（SHA-256 `4e00afb0…`，2 886 352 字节）需随交付交给项目负责人。
- 脱敏规则：入仓内容**只**保留用例编号、步骤判定、控件选择器／字段路径、视口、按键/步骤序号、结果数值、缺口摘要、脚本与外部产物哈希；**不**包含数据库连接信息、内网主机/端口/口令/令牌、原始截图或原始归档内容。

核验要点（本报告与索引自检，已执行）：

1. `ACCEPTANCE.md` §4 四态合计 = 154，且与 §1.18 状态块、README 统计一致（均为 `69/0/70/15`）。
2. §4 相对 `b81284f` 状态格差异集合为空；`changed_ids=[]`、`reverified_ids=["CCFG-AC-100","CCFG-AC-143"]`。
3. 两个探针脚本**非 GET 请求拦截计数均为 0**（零写）。
4. AC-143 时间线为**逐步骤**（57 步、4 个 scope）；未固定序列固定 ID 恒 `null`、已固定序列恒 `CCFG-AC-R1-ON`。
5. `git diff --check` 无空白／冲突标记错误；提交白名单与敏感内容检查通过。

---

## 8. 服务收尾与下一入口

| 项 | 值 |
|---|---|
| 后端 | PID **13434**，`0.0.0.0:8080`，任务结束时**仍在运行** |
| 前端 | PID **13522**（父 `13509`），`0.0.0.0:5173`，任务结束时**仍在运行** |
| 状态 | 由当前 `develop` 源码启动，供项目负责人页面验收；`/config/client` 与 `/api/health` 返回 `200` |
| 停止方式 | 由项目负责人按项目既有方式停止（`kill 13522 13509 13434` 或对应进程管理方式）；本任务**不**擅自停止他人正在使用的进程 |
| 本机与外部 | 本机 HTTP 核验通过；**不**宣称项目负责人侧网络已可达 |

下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_FORMAL_ACCEPTANCE_READONLY_SUPPLEMENT_R1_REVIEW`（由 ChatGPT **从远程 Git** 对本 R1 补测结果做独立**文档/证据**复审）。**提交/推送成功不代表远程复审通过；远程复审通过后仍不等于项目负责人已正式验收或已接受。**
