# 探针端管理数据源选择与历史数据验收执行报告

- 任务编号：`CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002`
- 任务提示词：`docs/prompts/client-config/CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-Agent-Prompt.md`
- 执行日期：2026-11-04
- 分支：`develop`
- 起始提交：`242cc5cf878216ef6e020effc539ee742c87a35c`
- 目标范围：24 条 `CCFG-AC-012、013、014、015、034、042、044、046、048、055、056、057、059、063、068、095、096、097、098、099、106、112、132、133`

## 1. 任务与授权

本任务对 `/config/client` 的 24 条验收用例做真实页面/真实后端执行，并只允许这 24 个状态 token 变化。项目负责人授权原话：

- **“一次覆盖多个验收项。”**
- **“当前任务中，CDC_CLIENT_MULTIPLE表的数据可以随意操作，随意增删改，完成之后不必清理。”**
- **“CDC_DATA_SOURCE表也可以随意操作，但最好不要动CDC_DATA_SOURCE表现有的记录。agent可以自行增加一些记录，并可以对自行增加的记录做任何操作。”**
- **“CDC_DATA_SOURCE与cdc_client_multiple表操作之后，均无需恢复。”**

边界：不含 DDL、其他表数据写入、ZK/Kafka 写入、外部进程或采集任务操作；不解释为其他功能页面接入或验收授权；不连接/测试样本源数据库，不启动采集，不调用源连接测试 API；不修改源码/CSS/产品测试/依赖/配置/模板、其他 Feature 或 REQ/DESIGN/UI/API/DATABASE/历史报告。

## 2. 数据变更与保留样本（按授权不清理）

| 项目 | 结果 |
|---|---|
| 合成数据源 | **164** 行（`S2AC%` **160** + `C01/C02/S2AM/S2AM,C02` **4**），全部为本批新增；主机/用户/密码均为合成值 |
| 合成探针记录 | **29** 行（`FG_ACTIVE='1'` 25、`'0'` 3、异常 `'X'` 1） |
| 业务写请求 | 到达真实后端 **18** 次：成功 **8**、按业务规则拒绝 **10**（`40103/40105/40441/40941`） |
| 直接 DML | 两份夹具脚本合计 **193 条 INSERT**（164 源 + 29 探针）+ 2 `COMMIT`；无 `UPDATE`/`DELETE`/DDL |
| 既有数据源保护 | 开工前 **37** 条，结束按 6 字段比对：缺失 **0**、变化 **0** |
| 删除 | **未执行**任何删除探针记录的写请求 |
| 终态 | `CDC_DATA_SOURCE` **201**（164+37）；`CDC_CLIENT_MULTIPLE` **59**（29+30） |

说明：

- 夹具脚本为合并后的可重放记录；少量探针记录（如 `S2AC-P14`、`S2AC-PAUTO`、`S2AC-PCAP`、`S2AC-PK40`、`S2AC-P07`）实际由真实业务 API 创建/保存，脚本同时保留等价 INSERT 以便复现。
- 被拒绝的写请求未产生行或字段变化，包括 `S2AC-POCCNEW`、`S2AC-PEDIT`、`S2AC-PO7TRY`、`S2AC-PO4TRY`、`S2AC-PDIS2` 启用与两次 `S2AC-PNORM` 规范化重复提交。
- 按授权**不清理、不恢复**；本报告不报告 `RESTORED`。

详细样本清单与终态：`reports/evidence/CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002/samples-and-final-state.md`。

## 3. 执行方式与服务

- 真实无头 Chromium（Playwright Core 1.59.1；`/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`）+ 真实后端 `GET/POST/PUT`。
- 复用既有服务，未重建、未改配置：后端 PID **3670**，监听 `*:8080`；前端 Vite PID **3756**，监听 `0.0.0.0:5173`。
- 数据库：既有 Oracle 19c 开发库 `CDC` schema；连接信息取自环境，未写入报告/证据。
- 注入仅两类且均标注：AC-055 的“候选空池”“候选加载失败”，AC-133 的只读观察（不带写请求）。其余失败/冲突均为真实后端业务码。
- 直接 DML 仅用于夹具准备与后置读取，不替代被测页面/API 行为。

## 4. 逐 AC 判定

完整“原子要求 → 旧证据真实键 → 本批真实键 → 结论”链见 `.../evidence/.../ac-matrix.md`；以下为结论摘要。

| AC | 判定 | 本批关键证据与结论 |
|---|---|---|
| CCFG-AC-012 | PASS | 标签最大宽 120px、CSS 省略号、水平垂直居中；Tooltip 仅含完整机构名与“数据源 ID”；页面级单实例，实测进入延迟 238/241/239/241/239ms，离开隐藏。`group-supp-results.json`、`group-a-delay-results.json` |
| CCFG-AC-013 | PASS | 不存在源显示原始 ID 红色并提示“异常原因：不存在”；重复分配显示“已分配给其他探针”并列出冲突探针；异常项优先进入可见集且其余保持原序。`group-supp-results.json`、`group-a-results.json` |
| CCFG-AC-014 | PASS | 写入 `[" S2AC-N02 ","","S2AC-N02","S2AC-N03"]` 持久化为 `S2AC-N02,S2AC-N03`（17B）；读取 2 个标签；API 返回 `rawDataSourceIds`。SQL 与 API 双核对。 |
| CCFG-AC-015 | PASS | 历史行 ` S2AC-D15 , S2AC-D15 ,,S2AC-D16` 展示 2 项、计数 2、D15 红色且 Tooltip“异常原因：行内重复”，展示与计数口径一致。 |
| CCFG-AC-034 | PASS | UI 未选源 0 请求并提示“至少选择 1 个数据源”；API 40103；1022B→40105；989B 通过容量检查后 40441；1000B→200；40 个短源 359B→200。序列化 1000 边界与列宽 1024 并存，按定义校验 1000。 |
| CCFG-AC-042 | PASS | 保存请求体仅 `clientId/clientDesc/dataSourceIds`；`CDC_CLIENT_MULTIPLE` 仅 4 列，无“描述生成模式”字段。 |
| CCFG-AC-044 | PASS | 自动生成结果 81B 精确匹配；两个同名机构均保留；顺序 A/B 产生不同结果；不排序、不按机构名去重；每个片段仅去首尾空白。 |
| CCFG-AC-046 | PASS | 增删数据源后描述不变；再次点击才覆盖；新增/编辑同一按钮且仅 1 个。 |
| CCFG-AC-048 | PASS | 1024 cp/1024B 与 1039 cp/1039B 输入均按 `CCFG-REQ-133`/`CCFG-AC-132` 保留前 256 cp；emoji 324B→256cp/259B，末码点完整、无孤立代理；缺机构名指出 `S2AC-N15` 并保持原描述。④“结果为空白”为结构性不可达分支：控制字符机构名先被后端归一为 null，命中“无机构名称”分支。 |
| CCFG-AC-055 | PASS | 三种状态文案可区分：`未找到匹配数据源`、`无可选数据源`、`数据源候选加载失败，请稍后重试`；后两者为标注注入，占用候选为真实禁用态。 |
| CCFG-AC-056 | PASS | 新增、编辑、启用三处写前检查均 40941；填充/空项/重复项的规范化提交仍 40941。`group-d-results.json`、`group-supp3-supplements.json` |
| CCFG-AC-057 | PASS | 停用探针 `S2AC-PDIS3` 仍占用 `S2AC-O07` 并阻断新分配；真实 UI 从原记录移除后保存 200，另一探针取得 `S2AC-O07` 200。“移除或删除”二选一，本批执行移除释放，删除释放腿未单独执行。 |
| CCFG-AC-059 | PASS | 停用记录 `S2AC-PDIS2` 启用时在写 `FG_ACTIVE='1'` 前 40941，冲突探针 `S2AC-PHOLD6`；其后记录仍为 `FG_ACTIVE='0'`。 |
| CCFG-AC-063 | PASS | 冲突信息列出全部三个探针 `S2AC-PMA、S2AC-PMB、S2AC-POCCV`，无隐藏。 |
| CCFG-AC-068 | PASS | 编辑弹窗可打开；含异常源时提交 0 请求并显示红色反馈；移除异常项并选合法源后 PUT 200。 |
| CCFG-AC-095 | PASS | `S2AC-PAMB2` 项级异常 `S2AC-X01` 为红底红字，未因整行歧义降级；Tooltip 保留异常原因与冲突探针；1440 与 1920 一致。 |
| CCFG-AC-096 | PASS | `S2AC-PAMB1` 无项级异常的两个标签为中性色（非绿），整行“含逗号歧义”可见，计数注“（展示）”；双视口一致。 |
| CCFG-AC-097 | PASS | `S2AC-PAMB2` 同行“项级红色 + 其余中性 + 整行歧义提示”共存；1920 复核 `rowbad.visible=true`。 |
| CCFG-AC-098 | PASS | 1440：6 源显示 2+`+4`、8 源显示 1+`+7`、异常 8 源显示 2+`+6`；1920：6 源显示 6、8 源显示 6+`+2`；盒模型/无重叠/间距检查全部通过。 |
| CCFG-AC-099 | PASS | `+N` 为点击交互（悬停不展开）；完整清单按规范化去重后的原存储顺序展示；异常项优先进入可见集但完整清单不隐藏；缺机构名回退原始 ID。 |
| CCFG-AC-106 | PASS | 缺机构名项 `S2AC-N13` 以原始 ID 为主信息、`id=null`、无重复次行；有机构名项保持两级呈现。 |
| CCFG-AC-112 | PASS | 1440：候选区 406.33 > 已选区 355.67；900×800：380.66 > 333.34、弹窗 852×613 适配、文档无横向溢出；候选列表 260px 受控滚动，长 ID/长原因可读。 |
| CCFG-AC-132 | PASS | 先按顺序生成完整描述再取前 256 cp；超 256 不失败、不弹超长提示；未选源 0 请求 0 消息；缺机构名指出 ID 并保持原描述。 |
| CCFG-AC-133 | PASS | 打开编辑仅回显 256cp/768B，1 个 GET、0 写；取消后列表/API 仍 297cp/873B；再次打开保存 PUT 200，持久化 256cp/768B。 |

目标 24 条：**PASS 24 / FAIL 0 / BLOCKED 0 / NOT_RUN 0**。

## 5. 文档变更与统计

- `ACCEPTANCE.md`：仅把 24 个目标状态 token 由 `BLOCKED`（21 条）或 `NOT_RUN`（3 条：`056/057/063`）改为 `PASS`；追加 §1.37 本批状态块与 §6 一行变更记录。
- `README.md`：仅追加本批导航/下一入口段落。
- 其余 133 个状态格与 157 条定义行逐字节不变；四族数量 `REQ154 / AC157 / DESIGN89 / UI77` 不变；未触碰历史报告/证据。
- 统计：本批前 `PASS 101 / FAIL 0 / BLOCKED 48 / NOT_RUN 8`；本批后 `PASS 125 / FAIL 0 / BLOCKED 27 / NOT_RUN 5`，合计 **157**。
- `changed_ids`：`[CCFG-AC-012, CCFG-AC-013, CCFG-AC-014, CCFG-AC-015, CCFG-AC-034, CCFG-AC-042, CCFG-AC-044, CCFG-AC-046, CCFG-AC-048, CCFG-AC-055, CCFG-AC-056, CCFG-AC-057, CCFG-AC-059, CCFG-AC-063, CCFG-AC-068, CCFG-AC-095, CCFG-AC-096, CCFG-AC-097, CCFG-AC-098, CCFG-AC-099, CCFG-AC-106, CCFG-AC-112, CCFG-AC-132, CCFG-AC-133]`

## 6. 边界与未执行项

- 未运行全量产品测试/构建/lint/类型检查（任务明确不要求）；未修改任何产品源码/CSS/测试/依赖/配置。
- 未访问其他功能页面；未操作 sync-client/sync-server/ZK/Kafka；未做 DDL，未写其他表。
- 后端 jar mtime 早于本任务，不能证明与当前工作区源码逐字节一致；本任务按授权未重建。
- 服务绑定 `0.0.0.0` 且本机 HTTP 200；`192.168.174.70` 侧用户网络可达性未独立证明。
- 未做恢复/清理，故不报告 `RESTORED`；保留样本均为合成 ID/文本。
- 本报告不预填自身提交 SHA，不预宣布远程复审通过；本批 24 条 `PASS` **不等于** 157 条整体验收通过、**不等于** Feature 正式接受或页面迁移授权。

## 7. 服务与停止方式

| 项目 | 值 |
|---|---|
| 后端 | PID 3670，`*:8080`；包装 shell PID 3668 |
| 前端 | Vite PID 3756，`0.0.0.0:5173`；包装 shell PID 3743 |
| 验收入口 | `http://192.168.174.70:5173/config/client` |
| 停止后端 | `kill 3670` |
| 停止前端 | `kill 3756` |

服务保持运行，供项目负责人验收；如需一并停止包装 shell，可再执行 `kill 3668 3743`。

## 8. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_SOURCE_SELECTION_AND_HISTORICAL_DATA_ACCEPTANCE_002_REVIEW`
