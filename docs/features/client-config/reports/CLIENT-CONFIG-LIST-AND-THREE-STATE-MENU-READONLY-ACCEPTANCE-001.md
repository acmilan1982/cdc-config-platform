# 探针端管理列表与三态菜单定向只读验收

- 任务编号：`CLIENT-CONFIG-LIST-AND-THREE-STATE-MENU-READONLY-ACCEPTANCE-001`
- 分支：`develop`
- base：`4354e3083e00b995819b967eb860e93024089a3a`
- result：见最终 `AGENT_TASK_RESULT`（本报告不预填自身提交 SHA）
- 性质：定向只读验收；复用已入仓历史证据 + 当前源码推导；**未**启停/重启/构建服务，**未**读取当前列表样本，**未**启动浏览器，**未**执行任何业务写入。

## 0. 结论摘要

| 项目 | 结果 |
|---|---|
| `CCFG-AC-022` | **维持 `BLOCKED`** |
| `CCFG-AC-082` | **维持 `BLOCKED`** |
| `changed_ids` | `[]` |
| 本轮统计（实际复算） | `PASS` **83** / `FAIL` **0** / `BLOCKED` **60** / `NOT_RUN` **14** = **157** |
| 业务写尝试 | **0** |
| 数据库直写 / ZooKeeper 写 | `NOT_REQUESTED` |
| 直接反例 | **0**（两条均不判 `FAIL`） |

两条 `BLOCKED` 的根因不同：

- **AC-022**：步骤与预期大多有历史证据，但前置“启用与停用探针**各若干条**”未成立——历史快照仅观察到 1 条启用；`若干条` 无已批准的数量阈值；且当前样本因服务不可用无法重读。
- **AC-082**：前置“库内**同时**存在 `'1'`、`'0'` 与异常三态记录”在当前不可确认；已入仓历史快照各自缺少三态中的一态，不能跨时点拼接；R4 矩阵引用的 `accD.json` 原始包在仓库外、不可读取真实键。

**R1 勘误（2026-11-03）**：初版误将固定操作列记为“仅源码推导、缺运行时实测”。已入仓的 `s2-dialog-results.json` 在两桌面视口记录了主列表操作列的实际浏览器计算样式（`viewports["1440x900"].ac092.fixedCol` 与 `viewports["1920x1080"].ac092.fixedCol`：`position=sticky`、`stickyRight=0px`、`tdPosition=sticky`、`tdRight=0px`），现据实补入 §3.2；固定列不构成独立阻断，结论与状态格不变。

## 1. 开工核对

| 项目 | 实际值 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform` |
| 分支 | `develop` |
| HEAD | `4354e3083e00b995819b967eb860e93024089a3a` |
| `origin/develop` | `4354e3083e00b995819b967eb860e93024089a3a` |
| 远端 `refs/heads/develop` | `4354e3083e00b995819b967eb860e93024089a3a` |
| 预期 base | `4354e3083e00b995819b967eb860e93024089a3a`（一致） |
| 工作区 | 仅有任务开始前的 `.claude/settings.local.json` 修改，以及未跟踪的 `docs/prompts/`、`runtime-logs/`；均**未**触碰、**未**暂存 |
| Node | `v24.17.0` |

未执行 `reset` / `clean` / `stash` / `pull` / `fetch` / `merge` / `rebase`；未改 `.claude/settings.local.json`、`docs/prompts/**`、`runtime-logs/**`。

服务可用性（只读检查，证据见 `evidence/.../env-and-service-check.txt`）：

| 检查 | 结果 |
|---|---|
| `GET http://127.0.0.1:8080/api/clients?status=ALL` | HTTP `000` |
| `GET http://127.0.0.1:5173/config/client` | HTTP `000` |
| `ss`/`netstat` 监听 8080、5173 | 无 |

任务提示词要求“复用现有前后端，不启停、不重启、不构建；若服务不可用，完成可做的静态/历史核对并如实报告，不伪造实际页面观察”。因此本轮未启动服务、未伪造页面观察；当前样本与真实浏览器两视口核对记为**未执行**。

## 2. 定义、修订时序与判定口径

完整读取了 `ACCEPTANCE.md` 中 `CCFG-AC-022`（第 654 行，当前 `BLOCKED`）与 `CCFG-AC-082`（第 714 行，当前 `BLOCKED`）的前置、步骤、预期，以及对应 `REQUIREMENTS.md`（`CCFG-REQ-029/031/095/096/101/102` 等）、`DESIGN.md`（`CCFG-DESIGN-020/021/041/043/045`）、`UI.md`（`CCFG-UI-006/018/028/031/032/035`）。未用本提示词的摘要替代定义。

与本轮判定直接相关的两处**已批准修订**（只记录，不修改定义字节）：

1. **AC-022 启用确认**：原文“点击后一般不弹确认”由第五轮 `CCFG-REQ-141` / `CCFG-AC-140` 定向修订为**启用也新增一次二次确认**（标题“启用探针”、正文 `确定启用探针 {探针ID} 吗？`、按钮“取消／启用”；取消不调用启用接口）。本轮按修订后口径核对。
2. **AC-082 “文字更多”入口**：该定义行仍写“唯一文字入口为‘更多’”；后续已批准的第八轮/`CCFG-AC-156` 把入口改为三点图标（可访问名称 `更多操作：{探针ID}`）。本轮按**已批准时序**记录该替代关系，**不**改定义、**不**因旧文字残留宣告新缺陷。

登记一处**未决语义**（不擅自解释）：AC-022 前置要求“列表含启用与停用探针**各若干条**”。“若干条”没有已批准的数量阈值，历史证据最多只看到 **1** 条启用；本轮不把“若干条”改成“一条”，也不虚构阈值，因此该前置按**未完整成立**处理。

## 3. 逐步骤证据矩阵

列：AC / 原子前置或步骤或预期 / 已有证据文件及实际键 / 当前补采 / 覆盖结论与限制。

覆盖等级：`已覆盖（历史）`、`部分（历史）`、`源码推导`（非运行时观察）、`未成立`、`未覆盖（服务不可用）`。

### 3.1 `CCFG-AC-022`

| AC | 原子前置 / 步骤 / 预期 | 已有证据文件及实际键 | 当前补采 | 覆盖结论与限制 |
|---|---|---|---|---|
| 022 | 前置：目标功能已实现并部署 | `frontend/src/views/client-config/ClientConfigPage.vue:57-65`（`el-table`）、`:66-99`（序号/探针 ID）、`:201-249`（操作列/下拉） | 服务不可用，无运行时核对 | 源码存在；部署/运行态本轮不可证 → **部分（源码推导）** |
| 022 | 前置：列表含启用与停用探针**各若干条** | `CONTROLLED-TOGGLE-READINESS-CHECK-001/readiness-results.json`：`list_total_rows=16`、`fg_active_histogram={exact_0:15, exact_1:1, other:0}`、`note=point-in-time snapshot` | 未读取当前样本（HTTP `000`） | 历史仅 1 条启用；`若干条` 无已批准阈值；当前样本不可读 → **未成立** |
| 022 | 步骤：1440×900 / 1920×1080 观察是否仍有“状态”列 | `TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002/s2-list-results.json`：`viewports.1440x900.structure.headers=[序号,探针 ID,探针描述,采集数据源,数据源数量,操作]`、`hasStatusColumn=false`；`1920x1080` 同 | 未重跑浏览器 | **已覆盖（历史）**；未在当轮重测 |
| 022 | 步骤：停用记录最右操作列“更多”点“启用” | 同上：`viewports.*.menu.itemTexts=[启用,删除]`；`T02-CONTROLLED-UI-TOGGLE-ACCEPTANCE-001/ui-toggle-results.json`：`steps.B1.menu.menu_items=[启用,删除]` | 未打开菜单 | **已覆盖（历史）** |
| 022 | 预期：列表不再有“状态”列、无列内启停文字操作 | `s2-list-results.json`：`structure.headers`、`structure.batchAbsence.hasRowCheckbox=false`；源码列定义无状态列 | 源码推导 | **已覆盖（历史）+ 源码推导** |
| 022 | 预期：启用新增二次确认（标题“启用探针”、正文含精确 ID、按钮“取消／启用”） | `SUPPLEMENT-002/s2-confirm-results.json`：`viewports.1440x900.enableBox.title=启用探针`、`bodyMasked=确定启用探针 <ID> 吗？`、`buttons=[取消,启用]`；`T02/ui-toggle-results.json`：`steps.B1.dialog.message_contains_exact_id=true`、`button_texts=[取消,启用]` | 未打开确认框 | **已覆盖（历史）** |
| 022 | 预期：取消确认不调用启用接口 | `T02/ui-toggle-results.json`：`steps.B2.cancel_clicked=true`、`writes_delta=0`、`blocked_delta=0`、`dialog_hidden=true` | 未执行写 | **已覆盖（历史写路径）** |
| 022 | 预期：启用成功后状态变为启用、探针 ID 后“停用”标记消失；仅 `FG_ACTIVE` 变化 | `T02/ui-toggle-results.json`：`steps.B3.t02_after_reload.marker_present=false`、`steps.B4.fg_active='1'`、`status=ENABLED`、`diff_fields=[fgActive,status]`；`gate.write_attempts[0].kind=enable`；`sql-window-extract.txt`：`UPDATE CDC_CLIENT_MULTIPLE SET FG_ACTIVE=? WHERE CLIENT_ID=?`、`Updates: 1`；终态 `steps.B7.fg_active='0'`、`business_fields_identical=true` | 未启用（不重跑） | **已覆盖（历史已审写证据）** |
| 022 | 当前样本 | 无 | `GET /api/clients?status=ALL` = HTTP `000` | **未覆盖（服务不可用）** |

**AC-022 判定**：`BLOCKED`。步骤/预期大多可由历史证据覆盖，但完整前置（启用与停用各若干条）未成立且当前样本不可读；不满足“全部适用前置/步骤/预期覆盖才 PASS”。无直接反例，故不判 `FAIL`。

### 3.2 `CCFG-AC-082`

| AC | 原子前置 / 步骤 / 预期 | 已有证据文件及实际键 | 当前补采 | 覆盖结论与限制 |
|---|---|---|---|---|
| 082 | 前置：库内**同时**存在 `'1'`、`'0'` 与非 `'0'/'1'` 异常状态记录 | `readiness-results.json`：`fg_active_histogram={exact_0:15, exact_1:1, other:0}`（无异常）；`s2-list-results.json`：`abnormalRowCount=1`、`idMarkers[15].hasInactiveMark=false` 且带异常标记（有停用+异常，但无启用行标记）；`T02/ui-toggle-results.json`：`steps.B4.fg_active='1'` 仅存在于其自身往返期间、`steps.B7.fg_active='0'` 终态 | 未读取当前样本 | 各时点**至少缺一态**；R4 矩阵引用的 `accD.json#082` 原始包在仓库外（`evidence-index.json.raw_package_sha256=1cf178…`），本机无文件可读真实键；不同时点快照不得拼接 → **未成立** |
| 082 | 步骤：两视口观察最右侧操作列是否固定 | `s2-list-results.json`：`viewports.1440x900.structure.headersRightmost=操作`、`1920x1080` 同（仅证明“操作”为最右表头）；`s2-dialog-results.json`：`viewports["1440x900"].ac092.fixedCol` 与 `viewports["1920x1080"].ac092.fixedCol` 均为 `{position:"sticky", stickyRight:"0px", tdPosition:"sticky", tdRight:"0px"}`（采集脚本 `probe-s2-dialog.cjs:342-348` 取 `.cc-table th/td.lt-row-action__cell`）；`ClientConfigPage.vue:201-205`：`el-table-column label="操作" width="110" fixed="right"` | 未运行浏览器 | 两桌面视口已有主列表操作列的历史浏览器**计算样式**（表头与单元格均 `position=sticky`、`right=0px`），与当前源码 `fixed="right"` 一致；该证据不覆盖水平滚动后的全部几何/可见性，本轮未重测 → **已覆盖（历史）+ 源码推导** |
| 082 | 步骤：分别对启用/停用/异常三类记录点“更多”并记录可见项 | `s2-list-results.json`：`viewports.*.menu.itemTexts=[启用,删除]`（停用行）、`viewports.*.abnormalRowMenu.itemTexts=[停用,删除]`（异常行）；`T02/ui-toggle-results.json`：`steps.B5.menu.menu_items=[停用,删除]`（启用后） | 未打开菜单 | 三类菜单**分别**有记录，但来自不同快照/任务，非同一三态页面 → **部分（历史）** |
| 082 | 预期：下拉严格符合三态表，任何状态行均含“删除”，异常行无“启用” | 同上 + `ClientConfigPage.vue:230-246`：`idState(row)!=='off'` → 停用，否则 → 启用；`删除` 始终渲染 | 源码推导 | 逐态观察一致；无同一快照三态菜单 → **部分（历史）+ 源码推导** |
| 082 | 预期：点击“更多”及菜单项不触发该行双击编辑 | `s2-list-results.json`：`rowEventIsolation.editDialogOpened=false`、`sequence=[singleClickTrigger,doubleClickTrigger,doubleClickMenuItem]`；`ROUND7/round7-targeted-readonly-results.json`：`AC156_menu_isolation.editDialogOpen=false` | 未运行浏览器 | **已覆盖（历史）** |
| 082 | 预期：点击“更多”不产生选中视觉 | `ROUND7/round7-targeted-readonly-results.json`：`AC156_menu_isolation.fixedSelectedRows=0`；负向对照 `AC156_dblclick_edit.fixedSelectedRows=1`（行双击仍编辑） | 未运行浏览器 | **已覆盖（历史）**；第五轮已恢复“行内容点击固定选中”，但菜单入口已隔离，观测为 0 |
| 082 | 当前样本 | 无 | `GET /api/clients?status=ALL` = HTTP `000` | **未覆盖（服务不可用）** |

**AC-082 判定**：`BLOCKED`。三态同时存在的前置在当前不可确认，历史快照不能拼接，当前样本不可读；因此不满足整条 `PASS`。固定列已有两桌面视口历史计算样式且与源码一致，不构成独立阻断。无直接反例，故不判 `FAIL`。

## 4. 当前样本核查（未执行，如实记录）

本轮**未**获得当前 `FG_ACTIVE` 直方图，因为后端未监听：

```text
GET /api/clients?status=ALL  -> HTTP 000
```

因此不写“当前为 15 个 '0' + 1 个 '1' + 0 个异常”。该数值只作为**历史快照**引用自就绪核查：

| 历史来源 | 时点性质 | `exact_0` | `exact_1` | `other` | 说明 |
|---|---|---|---|---|---|
| `CLIENT-CONFIG-CONTROLLED-TOGGLE-READINESS-CHECK-001/readiness-results.json` | 历史时点 | 15 | 1 | 0 | 无异常行 |
| `CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002/s2-list-results.json` | 历史时点 | 15（带“停用”标记） | 0（未见无标记行） | 1（`abnormalRowCount=1`） | 无启用行标记 |
| `CLIENT-CONFIG-T02-CONTROLLED-UI-TOGGLE-ACCEPTANCE-001/ui-toggle-results.json` | 历史往返期间 | 15（终态） | 1（B4 期间，仅 T02） | 未在 B 步骤中单列 | 启用态只存在于其自身往返期间 |

上述三行**不得**合并声称“当场三态共存”。当前样本状态：**未读取**。

## 5. 真实浏览器核对（未执行）

因前端 `:5173` 无监听，本轮**没有**导航到 `/config/client`，因此：

- 没有首次导航前的浏览器上下文 `/api/**` 拦截器，`nonGetAttempts` 对本轮**不适用**（不存在浏览器上下文请求）；
- 没有两视口 1440×900 / 1920×1080 的实际观察；
- 没有打开任何行菜单或二次确认框；
- 没有临时浏览器进程需要关闭。

本轮只做了两类替代核对，均明确标注性质：

1. **历史真实浏览器证据复用**（§3 表中的 `已覆盖（历史）` 项）——这些是既往真实页面观察，不是本轮观察；
2. **当前源码推导**——下拉条目分支、ID 三态标记、事件 `click.stop`/`dblclick.stop`，均来自 `ClientConfigPage.vue`，不等于运行时实测；固定列 `fixed="right"` 另有两桌面视口历史浏览器计算样式（见 §3.2），源码与之一致。

对于 AC-082 的“更多”文字入口：当前源码为三点图标（`role=button`、`tabindex=0`、`aria-label=更多操作：{clientId}`），与第八轮已批准修订一致；本轮按提示词要求记录已批准时序，不因旧定义残留“文字更多”擅改产品或宣告新缺陷。

## 6. 校验与定义保护

| 校验 | 结果 |
|---|---|
| 四族定义计数 | `REQ154 / AC157 / DESIGN89 / UI77`（按定义行唯一编号复算） |
| AC 编号 | `CCFG-AC-001~157` 完整、唯一、连续 |
| 状态格总数 | 157 |
| 本轮状态格变化 | **无**；`changed_ids=[]` |
| 未变状态格 | 其余 155 条与 base 一致；目标 AC-022、AC-082 两格亦维持原值 `BLOCKED`；合计 157 格一致（R1 勘误未改状态格） |
| 统计复算 | `PASS 83 / FAIL 0 / BLOCKED 60 / NOT_RUN 14 = 157` |
| 定义单元 | 相对 base 逐字节不变（本轮未改任何 AC 定义行） |
| `git diff --check` | 通过 |
| 白名单 | 初版仅修改 `ACCEPTANCE.md`、`README.md`；新建本报告与证据目录。R1 勘误仅改本报告、证据目录 `static-evidence-matrix.json`、证据目录 `README.md`、`SHA256SUMS`，未改 `ACCEPTANCE.md`、功能 `README.md` 与历史采集 JSON/脚本 |
| 脱敏 | 无真实 ID／描述／机构／数据源 ID／凭据／连接串／原始 API 响应／业务整屏截图入仓 |
| 新证据 SHA-256 | `evidence/.../SHA256SUMS` 已生成并本地校验通过 |
| 历史报告/证据 | 原样保留，未回写 |

## 7. 未执行项与最小后续建议

未执行：

- 未启动/停止/重启服务，未构建；
- 未读取当前 `GET /api/clients?status=ALL`；
- 未启动真实浏览器、未做两视口观察、未打开菜单/确认框；
- 未执行任何启停/删除写操作，未访问数据库/ZooKeeper/Kafka/外部采集进程；
- 未运行测试套件、构建、lint、类型检查；
- 未修改产品、测试、样式、配置、依赖、模板或定义。

最小后续建议（不在本任务扩大范围）：

1. 在服务由负责人启动并保持可用的前提下，独立只读任务重读 `GET /api/clients?status=ALL`，并以 1440×900 / 1920×1080 补做 AC-022、AC-082 的运行时步骤/前置观察。
2. **AC-022**：需澄清“各若干条”的数量口径，或取得一个同时含**多条启用与多条停用**的当前样本；不得把“若干条”擅自降为一条。
3. **AC-082**：需取得**同一时点**同时含 `'1'`、`'0'` 与非 `'0'/'1'` 异常的当前样本；若无异常行，应如实保留前置缺口，不制造样本、不为本批申请写入。

## 8. Git

- 初版单次提交，逐路径暂存；提交/推送范围仅本任务报告、证据目录、`ACCEPTANCE.md`、`README.md`。
- R1 勘误另做单次提交，逐路径暂存；范围仅本报告、`static-evidence-matrix.json`、证据目录 `README.md`、`SHA256SUMS`。
- 推送前核对远端与普通快进条件；禁止强推；推送后核对 local / `origin/develop` / 远端三方 SHA。
- 提交与推送结果见最终 `AGENT_TASK_RESULT` 块；本报告不预填自身 SHA。

## 9. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_LIST_AND_THREE_STATE_MENU_READONLY_ACCEPTANCE_REVIEW`

**定向只读验收 ≠ 写授权 ≠ 157 条整体验收通过 ≠ 批准其他页面接入或迁移。**
