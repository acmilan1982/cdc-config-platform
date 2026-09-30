# 探针端管理剩余验收缺口盘点与只读补测报告

- **任务编号**：`CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001`
- **范围**：**仅** `/config/client`（探针端管理）及其既有验收资料；**不**访问、测试或修改其他功能页面。
- **性质**：剩余验收缺口**逐 ID 盘点 + 分类**，并对**新发现且当前可构造的只读缺口**做真实浏览器**只读**补测。**不是**写授权；**不是** 157 条整体验收收口；**不是**其他页面（含 `/config/data-source`）的迁移授权。
- **分支 / 起点**：`develop`，任务开始前 HEAD = `e1c2ea55b23f8fd5ac7b053c44dd133a1819ab98`。

---

## 1. 现场与基线核对

| 项 | 值 |
|---|---|
| 分支 | `develop` |
| 任务开始前提交 | `e1c2ea55b23f8fd5ac7b053c44dd133a1819ab98` |
| 工作区既有无关内容（**保持原样，未改/未暂存/未提交**） | `.claude/settings.local.json`（M）、`docs/prompts/`（??）、`runtime-logs/`（??） |
| 正式项目级基线 | `docs/baseline/` 六份已于任务开始时完整读取 |
| 功能级基线 | `docs/features/client-config/{REQUIREMENTS,DESIGN,ACCEPTANCE,UI,API,DATABASE}.md` |
| 已批准定义行保护 | §4 除本任务最小改动的状态格外，全部定义单元**逐字节不变** |

**服务与版本核对（补测前置，未启停任何服务）**：前端 `http://127.0.0.1:5173`（Vite，pid `18651`，监听 `0.0.0.0:5173`，启动于 `13:39:24`，按磁盘源码即时提供当前 HEAD 内容）；后端 `http://127.0.0.1:8080`（java pid `22643`）。`GET /config/client` → `200`；`GET /api/clients` → `200`。两进程均为**本任务开始前既有**，**本任务未启停**。

---

## 2. §4 现状统计复核（按工作区 Git 对象复算）

按 `ACCEPTANCE.md` §4 状态列逐条复算：

```text
PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15 = 157
```

与任务提示词预期一致；`CCFG-AC-001~157` **连续、唯一、无跳号、无重号**；`CCFG-AC-010 = PASS`，`CCFG-AC-155/156/157 = BLOCKED`。

**缺口集合（87 条）**：

- `BLOCKED`（72）：`009 012 013 014 015 017 022 026 027 030 031 034 039 042 044 046 048 054 055 059 068 071 072 075 076 077 079 082 083 084 086 087 088 089 090 091 092 094 095 096 097 098 099 101 102 103 104 106 112 115 117 120 121 124 125 128 130 131 132 133 134 136 138 139 140 145 151 152 153 155 156 157`
- `NOT_RUN`（15）：`020 021 023 024 033 038 040 056 057 058 060 061 062 063 064`

---

## 3. 只读补测方法与网络写阻断

- 浏览器：Playwright 随附无品牌 Chromium `147.0.7727.15`（headless）；视口 `1440×900` / `1920×1080`，`deviceScaleFactor=1`。
- **导航前**在网络层安装拦截：`/api/**` 的 `GET/HEAD/OPTIONS` 放行，`POST/PUT/PATCH/DELETE` 一律 `abort('blockedbyclient')` 并计数。
- 允许动作：导航、`GET` 查询、悬停、键盘聚焦、滚动、开/关菜单与弹窗、未提交草稿（键入/改选）。**未**提交有效新增或编辑、**未**点击启停或删除最终确认、**未**建夹具、**未**改库、**未**写 ZooKeeper/Kafka、**未**执行历史 W1~W8 写方案。
- **零写实测**：探针 A~G **每条**脚本的 `writeInterception.nonGetAttempts` 均 = `0`，`attempts: []`（到达后端的非 GET 请求数 = `0`）。

| 探针 | 覆盖 | 视口 | 非 GET 拦截 |
|---|---|---|---|
| A | 列表结构/序号/查询重置重编号/菜单/末行裁切/弹窗只读/截断/空表单提交/启用确认 | 1440、1920 | 0 |
| B | 行分类/启用行菜单与 Hover/键盘/末行裁切/确认框非悬停态/编辑弹窗按钮色 | 1440 | 0 |
| C | 行状态普查/菜单结构（含分隔线/圆角/阴影/内边距/条目色） | 1440 | 0 |
| D | 分页缺席/警告项 Hover/菜单焦点样式/ID 40→32/非法字符提交 | 1920 | 0 |
| E | 双击进入编辑/`修改探针 ID` 解锁/`自动生成`/改选不联动/异常行菜单 | 1920 | 0 |
| F | `操作` 列固定/菜单 Hover 填充/异常行样式与几何 | 1440 | 0 |
| G | `FG_ACTIVE='0'` 行菜单（启用/删除）字重与 `启用` Hover | 1440 | 0 |

---

## 4. 逐 ID 缺口矩阵（87 条）

**缺口类别图例**：`RO` 只读可构造｜`SM` 样本缺失｜`WA` 需写授权｜`DD` 需定义裁定｜`XP` 跨页（超出本任务范围）。组合用 `+` 表示。

**证据键**：`A.*`/`B.*`/`C.*`/`D.*`/`E.*`/`F.*`/`G.*` 指向同目录 `reports/evidence/CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001/gap-readonly-results-{a..g}.json` 的键；`R7.*` 指向既有第七轮只读记录 `.../CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001/round7-targeted-readonly-results.json`。**本矩阵不把任一 AC 的样本要求移植到相邻 AC**，也不因独立用例未执行而阻塞本条。

| 编号 | 现状 | 缺口类别 | 已具备证据键 | **本条自身**未覆盖的原子步骤 | 最小可执行条件 |
|---|---|---|---|---|---|
| CCFG-AC-009 | BLOCKED | RO | `A.list1440/1920`.headers/`hasStatusColumn`；`F`.opColumn(sticky right:0) | “采集数据源”以机构名称为主显示的标签**正文**未取 | 只读取一条多源行 `采集数据源` 标签主文本 |
| CCFG-AC-012 | BLOCKED | SM+RO | — | 缺“机构名称超长”数据源样本；悬停 Tooltip 单实例/延迟行为未测 | 库内提供超长 ORG 数据源 |
| CCFG-AC-013 | BLOCKED | SM+RO | `E.optionPool`（“已分配给：…”“ID 含英文逗号”） | 行级异常数据源（停用/不存在/逗号/重复分配）样本缺失 | 库内提供相应异常数据源 |
| CCFG-AC-014 | BLOCKED | WA | — | 新增保存 + 回读比对序列化（写） | 写授权 |
| CCFG-AC-015 | BLOCKED | SM | — | 缺同一行 `DATA_SOURCE_ID` 含重复（Trim 后相同）历史样本 | 库内提供该样本 |
| CCFG-AC-017 | BLOCKED | RO+DD | `A.list1440/1920`.addBtn(rightmost)/batchAbsence(全 false) | 单击普通行→唯一固定选中视觉（经 `CCFG-AC-141` 修订）未在两视口实测 | 两视口实测固定选中视觉 |
| CCFG-AC-020 | NOT_RUN | WA | — | 删除物理删除 + 回读（写） | 写授权 |
| CCFG-AC-021 | NOT_RUN | WA | — | 删除不级联 + 成功后重载（写） | 写授权 |
| CCFG-AC-022 | BLOCKED | SM+WA | — | 无 `FG_ACTIVE='1'` 行；启用写 | 库内启用行 + 写授权 |
| CCFG-AC-023 | NOT_RUN | SM+WA | `A.confirm`（确认框标题/正文/按钮模式） | 无启用行；停用写 | 库内启用行 + 写授权 |
| CCFG-AC-024 | NOT_RUN | WA | — | 启用写 + 进程/ZK/Kafka 观察 | 写授权 |
| CCFG-AC-026 | BLOCKED | WA | `C.census`（异常行）；`E.abnormalRow`（`[停用,删除]` 无启用）；`F.abnormal1440` | 删除/停用写使 `FG_ACTIVE`→0（写） | 写授权（异常样本**已具备**） |
| CCFG-AC-027 | BLOCKED | SM+WA | — | 异常数据源样本；停用/删除/启用写 | 样本 + 写授权 |
| CCFG-AC-030 | BLOCKED | SM+WA | — | `probe-001` 类样本；绕过前端 + 并发 | 样本 + 写授权 |
| CCFG-AC-031 | BLOCKED | RO+WA | `A.dialog`（表单无状态字段）；`A.emptySubmit` | 保存成功后 `FG_ACTIVE=1`（写） | 写授权 |
| CCFG-AC-033 | NOT_RUN | SM+WA | — | 1024/1025/Emoji 字节边界样本；绕过前端 | 样本 + 写授权 |
| CCFG-AC-034 | BLOCKED | RO+WA | `A.emptySubmit`（“至少选择 1 个数据源”） | 序列化超 `1000` 容量拒绝（写） | 写授权 |
| CCFG-AC-038 | NOT_RUN | WA | — | 改 ID 不级联（写） | 写授权 |
| CCFG-AC-039 | BLOCKED | SM+WA | — | `probe-001`/`alpha-01` 样本；改名写 | 样本 + 写授权 |
| CCFG-AC-040 | NOT_RUN | WA | — | 编辑保存原子性（写） | 写授权 |
| CCFG-AC-042 | BLOCKED | WA | — | `自动生成`后保存、检查请求与表（写） | 写授权 |
| CCFG-AC-044 | BLOCKED | SM+RO | `E.autoGenerate`（无确认框、覆盖描述）；`E.optionPool` | 多源（含同 ORG）选择样本缺失，逗号连接/不去重未测 | 库内 ≥2 可选源且含同 ORG |
| CCFG-AC-046 | BLOCKED | SM | `E.autoGenerate`/`E.nonLinkage`（改选不联动）；新增/编辑同一按钮 | 需 ≥2 可选源以演示“再次点击重新覆盖到新选择” | ≥2 可选源样本 |
| CCFG-AC-048 | BLOCKED | SM | — | 1024 字节边界选择样本；ORG 缺失样本 | 相应样本 |
| CCFG-AC-054 | BLOCKED | SM | `E.optionPool`（已分配/逗号原因） | 编辑态“已选 + 改 ID 未保存”样本 | 相应样本 |
| CCFG-AC-055 | BLOCKED | RO+SM | `E.optionPool`（`12` 禁用 / `1` 可选） | “候选无可用项 / 搜索无结果 / 候选加载失败”三态未逐一构造 | 构造三态（“搜索无结果”为只读） |
| CCFG-AC-056 | NOT_RUN | WA | — | 普通唯一分配拒绝（写） | 写授权 |
| CCFG-AC-057 | NOT_RUN | SM+WA | — | 停用占用样本；写 | 样本 + 写授权 |
| CCFG-AC-058 | NOT_RUN | WA | — | 绕过前端直调（写） | 写授权 |
| CCFG-AC-059 | BLOCKED | SM+WA | — | 启用重复分配样本；写 | 样本 + 写授权 |
| CCFG-AC-060 | NOT_RUN | WA | `E.editFromRow`（编辑态 ID 锁定） | 改名 + 重选保存（写） | 写授权 |
| CCFG-AC-061 | NOT_RUN | WA | — | 多源部分冲突整次失败（写） | 写授权 |
| CCFG-AC-062 | NOT_RUN | WA | — | 冲突文案内容（写） | 写授权 |
| CCFG-AC-063 | NOT_RUN | SM+WA | — | 多探针占用样本；写 | 样本 + 写授权 |
| CCFG-AC-064 | NOT_RUN | SM+WA | — | 并发争抢（写） | 样本 + 写授权 |
| CCFG-AC-068 | BLOCKED | SM+WA | — | 异常数据源编辑保存阻断（写） | 样本 + 写授权 |
| CCFG-AC-071 | BLOCKED | WA | — | 加载态/防重复（写） | 写授权 |
| CCFG-AC-072 | BLOCKED | WA | — | 业务错误提示（写） | 写授权 |
| CCFG-AC-075 | BLOCKED | WA | — | 无级联（写） | 写授权 |
| CCFG-AC-076 | BLOCKED | WA | — | 无 DDL / 无误导文案（写） | 写授权 |
| CCFG-AC-077 | BLOCKED | RO+WA | `A.list`（页面壳/查询区/结果区/错误槽） | CRUD 仍由本页承担（写） | 写授权 |
| CCFG-AC-079 | BLOCKED | XP+RO | `A.list1440/1920`.addBtn（rightmost） | 与 `/config/data-source`“新增数据源”位置对照（**越界**） | 后续获准的跨页只读对照 |
| CCFG-AC-082 | BLOCKED | SM+RO | `C.census`；`E.abnormalRow`；`G.items`；`F.opColumn` | 无 `FG_ACTIVE='1'` 行（`'1'→[删除,停用]` 腿未实测） | 库内启用行 |
| CCFG-AC-083 | BLOCKED | RO+WA | `E.abnormalRow`（`[停用,删除]` 无启用） | 停用写使 `FG_ACTIVE`→0（写） | 写授权 |
| CCFG-AC-084 | BLOCKED | WA | — | 写=写语义不变（写） | 写授权 |
| CCFG-AC-086 | **→ PASS** | — | `A.list1440/1920`（序号为首列、`1..16` 连续）；`A.reset`（重查后重编号）；`D.pagination`（不分页） | —（全部满足） | — |
| CCFG-AC-087 | BLOCKED | XP+SM | `A.list`（`序号` 后即 `探针 ID` 列） | 与数据源页“停用”标识并排对照（**越界**）；无启用行 | 跨页对照 + 启用行 |
| CCFG-AC-088 | BLOCKED | RO | `C.census`；`F.abnormal1440`（红 `rgb(185,28,28)`/11px/700/紧跟 ID/6px）；`E.abnormalRow` | 与接口 `fgActive` 原始值逐条核对；对比度/无遮挡**目测**子项 | 只读取 `fgActive` 原值 + 目测子项 |
| CCFG-AC-089 | BLOCKED | RO+WA | `A`/`B`/`C` 多数回归项（不分页、双击编辑、标签 `+N`、禁用文案等） | 物理删除/启停/唯一分配校验（写） | 写授权 |
| CCFG-AC-090 | BLOCKED | XP+DD | `A.list`.addBtn（黑色实心、位置） | 与参考页按钮对照（**越界**）；禁用态场景缺失 | 跨页对照 + 禁用态定义/样本 |
| CCFG-AC-091 | BLOCKED | XP+RO | `E.editFromRow`（ID 正文/编辑入口）；`F.abnormal1440` | 与参考页“数据源 ID”正文颜色/字重对照（**越界**） | 跨页对照 |
| CCFG-AC-092 | BLOCKED | XP | `A.list1440/1920`.heightHistogram；`wrappedRows` | 与参考页行高规则对照（**越界**）；缩行后完整性 | 跨页对照 |
| CCFG-AC-094 | BLOCKED | XP | — | 与参考页“角色”标签对照（**越界**）；绿色标签样本 | 跨页对照 + 样本 |
| CCFG-AC-095 | BLOCKED | SM | — | 缺项级异常样本（红标 + Tooltip 原因） | 样本 |
| CCFG-AC-096 | BLOCKED | SM | — | 缺 `COMMA_PROTOCOL_AMBIGUOUS` 行样本 | 样本 |
| CCFG-AC-097 | BLOCKED | SM | — | 缺“整行歧义 + 项级异常”共存样本 | 样本 |
| CCFG-AC-098 | BLOCKED | SM | `A.list`.tagStats（DOM 计数**含弹层**，**不采信**） | 恰好 6 / ≥7 源样本；测量盒模型口径 | 样本 + 测量口径 |
| CCFG-AC-099 | BLOCKED | SM+RO | `E.optionPool`（ORG 回退相关） | ORG 可取/不可取、去重较多、溢出 `+N` 样本 | 样本 |
| CCFG-AC-101 | BLOCKED | RO | `C.menuRow*`（圆角 8px/阴影/内边距/分隔线/顺序）；`F.menuFill`、`G.items`、`G.enableHover`（Hover/焦点填充浅蓝、危险文字色不被覆盖、删除字重 400） | “清晰 Hover/焦点反馈”属**美学定性**子项，按既有先例（`CCFG-AC-010`）需负责人目测 | 负责人目测确认 |
| CCFG-AC-102 | BLOCKED | RO+SM | `A.menuKeyboard`（键盘开/遍历/关）；`F.menuClipping`（不裁切） | 禁用态条目缺可观察场景（仅行级忙碌时出现） | 禁用态场景 |
| CCFG-AC-103 | BLOCKED | RO+WA | `A.menuKeyboard`；`E.editFromRow`（双击进入编辑） | 单击入口不冒泡触发编辑的隔离（只读可补）；删除/停用/启用确认路径（写） | 写授权 |
| CCFG-AC-104 | BLOCKED | RO+WA | `A.list`.queryPanel（无刷新）/headers（六列顺序）；`wrappedRows` | 长描述单行省略；执行一次 CRUD（写） | 写授权 |
| CCFG-AC-106 | BLOCKED | SM | `E.optionPool`（ORG 回退） | ORG 缺失 + `+N` 完整清单样本 | 样本 |
| CCFG-AC-112 | BLOCKED | RO(+SM) | `A.dialog`（候选 406 > 已选 356；高 343） | 超长机构名/超长 ID/不可选原因可读性；窄视口 | 样本 + 窄视口 |
| CCFG-AC-115 | BLOCKED | RO | `A.dialog`（主提交常态 `#09090b`、取消/自动生成/切换非黑）；`E.editFromRow` | Hover/聚焦/按下换色未逐一取；`submitting` 加载态 | 只读取余交互态 |
| CCFG-AC-117 | BLOCKED | RO+WA | `G.items`（删除字重 400 非加粗/红）；`C.menuRow*`（分隔线）；`F.menuFill` | “执行一次删除”核对确认框（写） | 写授权 |
| CCFG-AC-120 | BLOCKED | XP+RO | `A.dialog`/`A.emptySubmit`（不完整仍可点→字段级错误） | 与参考页主提交对照（**越界**）；蓝黑跳色完整观测 | 跨页对照（只读） |
| CCFG-AC-121 | BLOCKED | RO+WA | `A.emptySubmit`（字段级错误在字段下方） | 系统级全局错误；成功保存后关窗+刷新（写） | 写授权 |
| CCFG-AC-124 | BLOCKED | RO | `A.emptySubmit`（`dialogBottomDeltaPx=0`） | 新增与编辑两模式逐状态序列未分跑 | 只读序列补测 |
| CCFG-AC-125 | BLOCKED | SM+RO | `A.emptySubmit`（字段错误行高 18） | 需换行的长错误文案；窄视口 | 长错误文案 + 窄视口 |
| CCFG-AC-128 | BLOCKED | RO+WA | `D.idInserted`（40→32）；`D.idIllegalTyped`/`D.idIllegalSubmit`（不改写 + 字段级格式错误） | 后端校验（大小写不敏感唯一性） | 写授权 |
| CCFG-AC-130 | BLOCKED | RO+SM | `A.descTyped`（300 汉字→256）；`A.dialog`.placeholder | Emoji/代理对不拆；恰好 256 允许 | 相应样本/步骤 |
| CCFG-AC-131 | BLOCKED | SM+WA | — | 768/1024/>1024 字节边界；绕过前端 | 样本 + 写授权 |
| CCFG-AC-132 | BLOCKED | SM+RO | `E.autoGenerate`（未选时无动作） | 可生成 >256 的源选择样本；ORG 缺失样本 | 样本 |
| CCFG-AC-133 | BLOCKED | SM+WA | — | >256 字符历史 `CLIENT_DESC` 样本；打开/保存 | 样本 + 写授权 |
| CCFG-AC-134 | BLOCKED | XP+SM | `E.optionPool`（候选资格/已分配/逗号） | 参考页/其他页/全局未被改动核对（**越界**）；两模式全流程 | 跨页范围 + 样本 |
| CCFG-AC-136 | BLOCKED | RO | `A.dialog`（900px/间距 12px/控件左缘对齐） | 控件右缘、标签字号/字重/色/红星/右对齐；窄视口 | 只读取余几何 |
| CCFG-AC-138 | BLOCKED | RO+SM | `A.emptySubmit`（无跳动） | 需换行长错误；多视口重复核对 | 长错误文案 |
| CCFG-AC-139 | BLOCKED | SM+WA | `A.confirm`（启用确认模式可参照） | 无启用行（停用确认）；成功/失败写 | 启用行 + 写授权 |
| CCFG-AC-140 | BLOCKED | RO+WA | `A.confirm`（标题 `启用探针`、正文 `确定启用探针 {ID} 吗？`、按钮 `取消/启用`）+ `confirmCanceled` + `writes 0` | 确认成功后恰 1 次写；失败分支（写） | 写授权 |
| CCFG-AC-145 | BLOCKED | WA | — | 固定选中在启停/删除各写后语义（写） | 写授权 |
| CCFG-AC-151 | BLOCKED | RO+WA | `A.confirm`（主按钮非悬停常态 `rgb(39,39,42)`） | Hover/按下/键盘焦点；单击确认恰 1 次写 | 写授权 |
| CCFG-AC-152 | BLOCKED | SM+WA | — | 无启用行（停用确认）；写 | 启用行 + 写授权 |
| CCFG-AC-153 | BLOCKED | RO+WA | `A.list`.batchAbsence（全 false） | 选中语义 + 各类普通/启停/删除重载（写） | 写授权 |
| CCFG-AC-155 | BLOCKED | XP+SM | `A.list1440/1920`.heightHistogram（`{48:15,52:1}`）；`wrappedRows:[]` | 跨页行高对照（**越界**）；“超长内容行”样本缺失 | 跨页对照 + 样本 |
| CCFG-AC-156 | BLOCKED | RO+WA | `R7`（命中区 28×28、垂直居中、未额外撑高、`:focus-visible 2px` 焦点环） | 窄视口 + 125% 缩放；**写路径**的稳定 ID 重选与重载竞态 | 缩放只读 + 写授权 |
| CCFG-AC-157 | BLOCKED | XP+RO | `R7`（opt-in 恰 4 条无 `!important`、未启用页零变化） | 未启用页对照须访问 `/config/data-source`（**越界**） | 跨页只读对照 |

### 4.1 类别汇总

| 类别 | 条数（主类别） | 说明 |
|---|---|---|
| `WA`（含 `WA` 为唯一缺口的写路径） | 26 | 需**逐项**写授权 + 回滚方案，本任务不作授权 |
| `SM`（样本缺失为决定性前置） | 15 | 需业务方提供真实样本或允许在受控环境构造 |
| `RO`（只读可构造，本轮已部分/接近覆盖） | 12 | 见 §5 下一批次只读补测清单 |
| `XP`（跨页对照，超出本任务范围） | 9 | 需负责人**明确授权**访问 `/config/data-source` 后方可执行 |
| `RO+WA` / `SM+WA` / `XP+*` 等组合 | 25 | 既含只读可补腿、又含写或跨页腿 |
| 已可判 `PASS` | 1（`CCFG-AC-086`） | 本条全部前置/步骤/预期已由只读证据满足 |

> 说明：**未**把上述 87 条笼统标记为“需要写授权”。多数条目的**决定性前置是样本或跨页对照**，而非写操作；相反，若把样本/跨页腿误并入写授权，会掩盖“只要补样本即可执行”的事实。

---

## 5. 状态变更（前 → 后）

| 编号 | 变更前 | 变更后 | 依据 |
|---|---|---|---|
| `CCFG-AC-086` | `BLOCKED` | **`PASS`** | 本条预期全为**客观结构事实**：第一列为“序号”、页面不分页、按当前展示顺序 `1..N` 连续、**不跳号/不沿用主键**、重载后重新连续编号。`A.list1440/1920` 证 `headers[0]='序号'`、`seqValues=['1'..'16']`、`seqContinuousFrom1=true`；`D.pagination` 证 `.el-pagination` 计数 `0`、无每页条数选择器、仅一处 `共 16 条`（不分页成立）；`A.reset` 证查询→重置→重查后序号仍 `1..16` 连续（重编号不错位）。全部前置/步骤/预期已满足，且**无**美学定性子项、无写路径、无跨页对照。 |

**其余 86 条维持原状态**，理由见 §4 矩阵（各自“未覆盖的原子步骤”）。其中 `CCFG-AC-101`、`CCFG-AC-009`、`CCFG-AC-088`、`CCFG-AC-124`、`CCFG-AC-136`、`CCFG-AC-115`、`CCFG-AC-140`、`CCFG-AC-151`、`CCFG-AC-128`、`CCFG-AC-130` 的**只读腿已高度覆盖**，但因仍各存在**未覆盖原子步骤**（美学目测 / 接口原值核对 / 窄视口 / 交互态 / 后端校验 / Emoji 样本），依“仅当**全部**前置与预期满足才可变更”**不予翻状态**；`CCFG-AC-101` 的“清晰 Hover/焦点反馈”为**美学定性**子项，按既有先例（`CCFG-AC-010` 由负责人目测）须负责人目测后方可判定。

**统计变化**：

```text
变更前：PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15 = 157
变更后：PASS 71 / FAIL 0 / BLOCKED 71 / NOT_RUN 15 = 157   （changed_ids=[CCFG-AC-086]）
```

`FAIL` 仍为 `0`；本轮**未**观察到任何可复现的产品反例，故**无**新增 `FAIL` 判定。

---

## 6. 重点复核：`CCFG-AC-155` / `CCFG-AC-156` / `CCFG-AC-157`

- **`CCFG-AC-155`（行高协调）**：**维持 `BLOCKED`**。`A.list` 两视口实测 `{48px: 15, 52px: 1}`、`wrappedRows: []`——**“超长内容行”真实样本仍不存在**，自适应观察组该分组未覆盖；对照组需与 `/config/data-source` **跨页**逐条对照（**越界**），本轮**未**重做跨页对照。关键前置样本缺口未消除，**不**以推断或笼统目测判 `PASS`。
- **`CCFG-AC-156`（三点入口）**：**维持 `BLOCKED`**。只读腿（命中区 28×28、行内垂直居中、未额外撑高常规行、`:focus-visible` 内嵌焦点环、单击固定/取消/转移、菜单隔离、双击进入编辑不提交）由既有第七轮记录覆盖；但定义末尾的**写路径回归项**（启停成功后按稳定 ID 重选、写操作触发的列表重载竞态）在只读边界内**不可实测**，窄视口 + 125% 缩放腿亦未在本轮重跑 → 关键步骤缺口。
- **`CCFG-AC-157`（显式 opt-in / 未启用页零变化）**：**维持 `BLOCKED`**。本轮**不重做**跨页零泄漏对照（须访问 `/config/data-source`，**越界**）；且定义要求实际观察三点触发器的 **`disabled` 状态**，而**当前无可观察的触发器禁用场景**（提交处理中禁用的是**菜单条目**而非**触发器**本身）。**不得**人为制造禁用态并写成实际验收；如需保留该子项，应由独立定义澄清任务裁定其可执行性（**本轮不改已批准定义**）。既有第七轮只读结论（opt-in 恰 4 条且限定 `.lt-main-table`、无 `!important`、未启用页零变化）**保留引用，不回写**。

> 三条均**不**因本轮只读补测而翻状态；判定与 §4 矩阵一致。

---

## 7. 下一批次决策建议（**仅计划，不执行写路径，本任务不是写授权**）

### 7.1 需业务方 / 负责人提供的**真实样本**（`SM`）

1. 至少 **2 个可选（未被占用、ID 不含逗号）数据源**，其中尽量含 **机构名称相同** 的两个 → 解锁 `044/046/048/054/132/134`（多选、逗号连接、不去重、编辑态候选、自动生成截断）。
2. 一条 **`FG_ACTIVE='1'`（启用）** 探针 → 解锁 `022/023/082/087/091/139/152` 的启用行腿。
3. 一条 **机构名称超长** 的数据源 → 解锁 `012`。
4. 一条 **`FG_ACTIVE` 非 `0/1`** 记录本轮**已具备**（`异常：X`）→ `026/083/088` 的异常腿**不必再等样本**。
5. 一条 **`CLIENT_DESC` 超 256 字符**的历史记录 → 解锁 `133`。
6. 一条含 **`COMMA_PROTOCOL_AMBIGUOUS`** 行、一条含 **项级异常** 行、一条**二者共存**行 → 解锁 `096/097/095`。
7. 一条**同 ID 重复（Trim 后相同）**记录、一条**行级异常数据源**记录 → 解锁 `015/013/027/068`。
8. 恰好 **6 个**与 **≥7 个**已分配数据源的探针 → 解锁 `098/099/106`。

### 7.2 需**独立定义澄清**（`DD`）

- `CCFG-AC-010` 历史“约 58～64px”与现行实测 `48/52px` 的口径取代关系（**本轮不改定义**，仅建议独立裁定并留痕）。
- `CCFG-AC-157` 的 **`disabled` 触发器子项**：当前仅“菜单条目”有禁用场景，触发器本身无可观察禁用态。建议裁定该子项是否调整为“菜单条目禁用”或标记不适用（**须独立任务**）。
- `CCFG-AC-090/120` 的**禁用态**场景定义与样本前提。

### 7.3 需**逐项写授权 + 回滚方案**（`WA`，本任务不授权）

写路径建议按依赖分组、逐组单独授权，每组须先给：完整 SQL/接口、目标对象、目的、预计影响行数、风险、回滚方式。

1. **启停组**：`022/023/024/026/059/083/139/140/151/152`（含二次确认取消不发写、成功后恰 1 次写/状态翻转）。
2. **新增/编辑组**：`014/031/032/034/038/039/040/042/060/061/068/071/072/128/131/133`。
3. **删除组**：`020/021/084`。
4. **唯一分配与并发组**：`027/030/056/057/058/062/063/064`（含绕过前端与并发，须独立授权与专门夹具）。
5. **选择/重载回归组**：`089/103/104/145/153`（含固定选中在各类写后的语义）。

### 7.4 需负责人**明确授权跨页只读对照**（`XP`）

- 一次性授权访问 `/config/data-source`（**只读、不修改**）以关闭 `079/087/090/091/092/094/120/155/157` 的对照腿；未获授权前**仅**能评估、**不得**实施迁移或更新任何页面迁移状态。

### 7.5 下一批次**只读**补测清单（无需写授权，`RO`）

在**不新增样本**前提下即可补的只读腿：`009`（多源行标签正文）、`017`（两视口固定选中视觉）、`088`（只读取 `fgActive` 原值 + 目测对比度）、`101`（负责人目测“清晰”）、`103`（单击入口不触发编辑的隔离）、`112/136`（弹窗其余几何与窄视口）、`115/151`（提交/确认按钮 Hover/聚焦/按下）、`124`（新增/编辑两模式序列）、`130`（Emoji/恰好 256）。

---

## 8. 边界、未执行项与合规声明

- **未执行**：任何写路径（新增/编辑有效提交、启停/删除最终确认）、夹具创建、数据库写入、ZooKeeper/Kafka 写入、历史 W1~W8 写方案；**未**启停项目负责人既有服务；**未**访问 `/config/data-source` 或其他功能页面做对照。
- **未改动**：产品源码、测试、共享 CSS、两套页面/表格模板基线、其他功能文档、历史报告、`.claude/**`、`CLAUDE.md`、`docs/baseline/` 六份正式项目级基线。仅新增本报告与证据目录，并**最小化**改写 `ACCEPTANCE.md` 中 `CCFG-AC-086` 的**状态格**（`BLOCKED`→`PASS`）及其本轮状态块、`README.md` 的统计与导航。
- **保护既有无关改动**：`.claude/settings.local.json`（M）、`docs/prompts/`、`runtime-logs/` 全部保持原样，**未**暂存、**未**提交。
- **本任务不是写授权**：§7 仅为计划；实施任何写路径须另行逐项授权。
- **本任务不构成整体验收结论**：不改判 `formal_acceptance_execution_status`，不代表 157 条整体通过，也不批准任何其他页面接入或迁移。
- **脱敏**：探针业务 ID → `<ID>`、机构/数据源取值 → `<ORG>`；**不**含数据库连接、内网主机/端口、账号口令/令牌、真实业务数据、任何截图。

---

## 9. 附录：证据索引

- 证据目录：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001/`
- 内容：`probe-gaps-a.cjs` … `probe-gaps-g.cjs`（7 个只读探针脚本）、`gap-readonly-results-a.json` … `-g.json`（脱敏机读结果）、`README.md`（索引与关键实测）、`SHA256SUMS.txt`（SHA-256 校验和）。
- 既有可追溯引用：`.../evidence/CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001/round7-targeted-readonly-results.json`（第七轮只读记录，本轮**只引用不回写**）。

---

## 10. 任务结果与变更清单

| 项 | 值 |
|---|---|
| 任务编号 | `CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001` |
| 分支 | `develop` |
| `base_commit_id`（任务开始前） | `e1c2ea55b23f8fd5ac7b053c44dd133a1819ab98` |
| `result_commit_id` | 本任务提交（单一提交，SHA 见本次任务的 `AGENT_TASK_RESULT` 块；报告不能自引其自身提交哈希） |
| 路由与授权边界 | **仅** `/config/client`；**不**访问/测试/修改其他功能页面；**不**构成写授权、整体验收结论或其他页面接入/迁移批准 |
| 本轮统计 | `PASS` **71** / `FAIL` **0** / `BLOCKED` **71** / `NOT_RUN` **15** = **157**；`changed_ids=[CCFG-AC-086]` |
| 下一入口 | `CHATGPT_REMOTE_CLIENT_CONFIG_REMAINING_ACCEPTANCE_GAP_TRIAGE_AND_READONLY_SUPPLEMENT_REVIEW` |

**变更文件（本任务明确授权范围内的路径）**：

- `docs/features/client-config/reports/CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001.md`（新增，本报告）
- `docs/features/client-config/reports/evidence/CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001/`（新增：7 探针脚本 + 7 脱敏结果 + `README.md` + `SHA256SUMS.txt`）
- `docs/features/client-config/ACCEPTANCE.md`（最小改动：`CCFG-AC-086` 状态格 `BLOCKED`→`PASS`、新增 §1.26 状态块、§6 追加一行变更记录）
- `docs/features/client-config/README.md`（最小改动：新增 §1.16 状态块、§2 报告导航两行、§4 一条当前状态、§5 一条现行下一入口）

**未变更**：产品源码、测试、共享 CSS、两套模板基线、`API.md`/`DATABASE.md`、`docs/baseline/` 六份正式项目级基线、`docs/features/README.md`、`docs/prompts/**`、`runtime-logs/**`、`.claude/**`、历史报告与历史证据、参考页 `/config/data-source`。

**未执行项**：任何写路径（有效新增/编辑提交、启停/删除最终确认）、夹具创建、数据库写入、ZooKeeper/Kafka 写入、历史 W1~W8 写方案；**未**启停既有服务；**未**跨页访问 `/config/data-source` 或任何其他功能页面做对照。
