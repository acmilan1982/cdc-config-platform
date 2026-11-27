# CDC 平台公共布局（app-shell）——验收（ACCEPTANCE.md）

> 文档状态：`DRAFT_PENDING_OWNER_REVIEW`
> 建立任务：`CDC-APP-SHELL-FEATURE-BASELINE-DRAFT-001`
> 建立日期：2026-11-27
> 实现取材版本：`fe53383e81151718c9cff2e741ff2a8fbf2db352`
> 用例编号前缀：`AS-AC-*`

```text
fixed_sidebar_acceptance_status=PASSED_OWNER_MANUAL       # Windows Chrome，原话“固定侧栏验收通过”
warm_tab_switch_acceptance_status=PASSED_OWNER_MANUAL     # 2026-11-27，“两页切换感觉不到明显停顿”；未采集真机毫秒
scroll_reopen_probe_status=PASSED_BROWSER_PROBE_5202_20261127  # 关闭激活标签后重开，scrollTop 稳定为 0
formal_acceptance_execution_status=NOT_RUN               # 本草案不宣布逐项正式验收
```

## 1. 验收结果状态模型

| 状态 | 含义 |
|---|---|
| `PASSED_OWNER_MANUAL` | 项目负责人人工试用通过（体感级，非逐项毫秒） |
| `PASS_SERVER_EVIDENCE` | 服务器只读 A/B 或结构证据覆盖该用例（证据见 `reports/APP-SHELL-ACCEPTANCE-5202.md` 与所引证据文件） |
| `PASS_UNIT` | 已有定向单元测试覆盖 |
| `PASS_BROWSER_PROBE` | 本轮在服务器上以真实浏览器（Chromium）执行行为探针，非 A/B 计时，读数见用例证据列 |
| `STATIC_ONLY` | 仅由源码核对成立，未在真实浏览器执行该交互 |
| `PENDING_VERIFICATION` | 截至本草案建立，无直接执行证据，待验证 |

> `PASS_UNIT` 列引用的测试文件是源码内可定位的测试索引；历史批次证据只记录“5 个相关测试文件、343 项通过”，没有逐文件清单，不把下表中的推测文件名并入该批次。

> 注意区分两个测量终点：**导航点击 → 目标行三点菜单可用**（端到端，需真实点击确认菜单可点）与**页面显示 / 行首次可见**（视觉出现）。二者不同，不可混用；详见验收报告 §5。

## 2. 验收用例

| ID | 关联需求 | 前置条件 | 操作 | 预期 | 证据 / 状态 |
|---|---|---|---|---|---|
| AS-AC-001 | AS-REQ-001/002 | 已加载公共布局 | 打开任一公共布局页面，观察侧栏 | 侧栏固定 220px、始终展开、含完整标题“CDC 配置管理平台”，无折叠入口 | `PASSED_OWNER_MANUAL`（固定侧栏，5201 验收）+ 源码核对 |
| AS-AC-002 | AS-REQ-003/004 | 已加载公共布局 | 依次点击“配置管理”“运行监控”下各菜单项 | 菜单分组与项与 `menu.ts` 一致；当前路径对应项为选中态 | `STATIC_ONLY`（`default-active=route.path`）；菜单数据由 `menu.spec.ts` 覆盖（`PASS_UNIT`）；运行态选中同步待验证 |
| AS-AC-003 | AS-REQ-006 | 已加载某页面 | 切换到不同分组/标题页面 | 面包屑显示“分组 / 标题”；空工作区不显示 | `STATIC_ONLY` |
| AS-AC-004 | AS-REQ-007 | 冷启动 | 首次导航到 `/config/client` | 自动出现该标签且为激活态 | `PASS_UNIT`（`tabs.spec.ts`）+ 证据冷加载 `coldLoadClient` |
| AS-AC-005 | AS-REQ-008 | 已打开“数据源管理” | 再次进入 `/config/data-source` | 只激活既有标签，不新增重复项 | `PASS_UNIT`（`tabs.spec.ts`“同一路径再次访问只激活、不重复”） |
| AS-AC-006 | AS-REQ-010、AS-REQ-032 | 两管理页已打开并在数据源页滚动 | 仅改变查询字符串（如 `/config/data-source?probe=1`，同路径） | 不新增标签、不重挂载管理页实例、不触发路径级滚动保存/恢复（`.content-area.scrollTop` 不被重置） | 本轮浏览器探针（5202 构建，273 行）：标签仍 2 个、宿主实例仍 2、`scrollTop` 保持 4800；`PASS_BROWSER_PROBE` |
| AS-AC-007 | AS-REQ-013 | 至少 2 个标签，当前非目标 | 关闭一个非激活标签 | 该标签移除，当前页与激活标签不变 | `PASS_UNIT`（`tabs.spec.ts`“关闭非当前标签保持当前页”） |
| AS-AC-008 | AS-REQ-014 | 3 个标签，关闭中间激活标签 | 关闭激活标签 | 激活右邻；无右邻激活左邻 | `PASS_UNIT` + 生命周期证据（关闭激活标签跳到相邻标签） |
| AS-AC-009 | AS-REQ-015 | 仅 1 个标签 | 关闭唯一标签 | 进入 `/workspace`，显示空工作区文案，标签条隐藏 | 生命周期证据（`lifecycle-candidate` 空工作区）+ `PASS_UNIT`（`close` 返回 `null`） |
| AS-AC-010 | AS-REQ-017 | 有历史记录 | 浏览器后退 / 前进 | 标签与激活态随路由同步；进 `/workspace` 清空激活 | 生命周期证据（后退/前进） |
| AS-AC-011 | AS-REQ-018 | 数据源为激活标签 | 点击其关闭按钮 | 切换到相邻标签，**无额外列表请求**，无瞬时重挂载 | 生命周期证据 `closeActive.requests=0`（与基线一致）；A/B 窗口 API 增量 0 |
| AS-AC-012 | AS-REQ-020/021/025 | 两个管理页已打开并稳定 | 在两页之间往返 | 返回页筛选/结果/滚动/横向滚动/选中态保留；`.content-area.scrollTop` 还原 | A/B 与结构证据（筛选值保留、`scrollTop` 还原、横滚 240px 保留）；`PASS_SERVER_EVIDENCE` |
| AS-AC-013 | AS-REQ-021 | 数据源第 100 行（`S2AC-TE01`）滚到内容区中部；两页已打开 | 顶部标签：数据源 → 中心端 → 探针端 → 数据源 | 返回后该行仍在原纵向位置；**首次真实点击**其三点菜单即弹出正确菜单 | A/B `returnViaCenter` + `menuAfterCenterReturn`（3 项菜单、命中正确行）；`PASS_SERVER_EVIDENCE` |
| AS-AC-014 | AS-REQ-021 | 同 AS-AC-013 | 左侧菜单：中心端 → 数据源 / 探针端 | 与顶部标签一致：行原位、菜单正确、零列表 GET | A/B `sidebar` 组合（`PASS_SERVER_EVIDENCE`） |
| AS-AC-015 | AS-REQ-020/021 | 探针端滚动到中部行 | 顶部标签与左侧菜单往返 | 中段行位置保留、切回可交互、无空帧 | A/B 探针端组合 + `final` 结构证据；`PASS_SERVER_EVIDENCE` |
| AS-AC-016 | AS-REQ-022/024 | 两个管理页已打开 | 快速来回切换 8 次 | 无空白帧、无错误、无重复请求 | 生命周期证据（快速往返 8 次无错误）；A/B 全部样本 `blankFrames=0` |
| AS-AC-017 | AS-REQ-024 | 两个管理页已打开 | 反复切换、关闭非激活标签 | 切换不产生列表 GET；关闭非激活标签无请求 | A/B 测量窗口 API 请求 0（两版本一致）、非 GET 0；生命周期证据 |
| AS-AC-018 | AS-REQ-016、AS-REQ-033 | 两管理页已打开，数据源为激活标签并滚到约第 100 行 | 直接关闭当前激活的数据源标签，再从左侧菜单重开 | 新实例；发起一次列表 GET；用户可见滚动位置为顶部 | 本轮浏览器探针（2026-11-27，5202 构建 `index-1x59Uxdx`，Chromium 1400×900，273 行）：关前 `scrollTop=4873`；关闭后跳到右邻“探针端管理”、0 次列表 GET；重开新增 1 次列表 GET，两帧及 0.5/1.5s 后 `scrollTop` 均为 0；`PASS_BROWSER_PROBE`（覆盖场景与机制边界见 DESIGN §6） |
| AS-AC-019 | AS-REQ-022 | 两个管理页已打开，中心端激活 | 观察隐藏页；在活动区做 `elementFromPoint`/聚焦 | 隐藏页不可见、不可点、不可聚焦、不进可访问性树；命中落在活动页 | `final-candidate.centerActive`（命中非隐藏页、隐藏页 `inert/aria-hidden`）；浮层证据（`PASS_SERVER_EVIDENCE`） |
| AS-AC-020 | AS-REQ-029 | 两页已打开 | 视口缩到 1000px；数据源横向滚动 240px 后往返 | 不撑破布局；横滚与固定右列保持；隐藏页宽度与激活态一致 | `final-candidate.dsHScroll*`（`PASS_SERVER_EVIDENCE`） |
| AS-AC-021 | AS-REQ-027 | 打开带轮询的监控页 | 离开监控页并观察 ≥60s | 离开后不再轮询（定时器停止） | `poll-candidate`（离开后 63s 内 0 次，激活期 1 次）；`PASS_SERVER_EVIDENCE` |
| AS-AC-022 | AS-REQ-028（边界另涉 AS-REQ-020） | — | 打开 `/large-screen` | 无侧栏/面包屑/标签条，页面独立渲染；进入时卸载 `MainLayout`，已打开的常驻页实例与标签随之销毁，返回公共布局按当前 URL 重建 | `final-candidate.largeScreen`（`PASS_SERVER_EVIDENCE`）；卸载边界为 `STATIC_ONLY`（`App.vue` 分流） |
| AS-AC-023 | AS-REQ-011 | 多个标签，焦点在标签上 | 左右方向键 / `Home` / `End` | 焦点与激活在标签间按预期移动，具可见焦点样式 | `PENDING_VERIFICATION`（源码具备 `keydown` 处理，未单独执行键盘用例） |
| AS-AC-024 | AS-REQ-012 | 标签数量超过可视宽度 | 切换到靠后的标签 | 标签条横向滚动，激活项进入可视范围 | `PENDING_VERIFICATION`（源码 `scrollIntoView`，未单独执行） |
| AS-AC-025 | AS-REQ-031 | 已打开多个标签 | 浏览器刷新 | 仅按当前 URL 重建当前页标签，滚动从顶部 | `PENDING_VERIFICATION`（源码：标签仅内存态，未单独执行） |
| AS-AC-026 | AS-REQ-030 | 进入/离开源库快照状态与其他路由 | 切换路由观察 `.content-area` class | 仅 `stableScrollbarGutter===true` 路由启用稳定槽位，其余保持默认 | `PASS_UNIT`（`MainLayout.spec.ts` 全组） |
| AS-AC-027 | AS-REQ-005 | 当前在日志查询页 | 再次点击“日志查询”菜单 | 触发页面重新初始化；其他页首次进入不误触发 | `PASS_UNIT`（`SidebarReinit.spec.ts` 4 条） |
| AS-AC-028 | AS-REQ-001/002 | Windows Chrome，生产预览 | 人工试用固定侧栏版本 | 负责人确认固定侧栏通过 | `PASSED_OWNER_MANUAL`（“固定侧栏验收通过”） |
| AS-AC-029 | AS-REQ-020~024 | Windows Chrome，5202 候选 | 数据源与探针端两标签之间切换 | 负责人体感“感觉不到明显的停顿”（未采集真机毫秒） | `PASSED_OWNER_MANUAL`（2026-11-27） |
| AS-AC-030 | AS-REQ-026 | 已打开一个普通页（如数据订阅/中心端配置） | 切到其他页再返回 | 普通页离开即卸载、返回重建，按原有数量重新发起自身请求；不被常驻承载 | `STATIC_ONLY`（不在 `CACHEABLE_VIEWS`，RouterView 卸载重建；未在候选上单独计时） |

## 3. 需求—验收追踪矩阵

| 需求 | 关联用例 |
|---|---|
| AS-REQ-001、AS-REQ-002 | AS-AC-001、AS-AC-028 |
| AS-REQ-003、AS-REQ-004、AS-REQ-005 | AS-AC-002、AS-AC-027 |
| AS-REQ-006 | AS-AC-003 |
| AS-REQ-007 | AS-AC-004 |
| AS-REQ-008 | AS-AC-005 |
| AS-REQ-009 | AS-AC-004、AS-AC-005 |
| AS-REQ-012 | AS-AC-024 |
| AS-REQ-010、AS-REQ-032 | AS-AC-006 |
| AS-REQ-011 | AS-AC-023 |
| AS-REQ-013 | AS-AC-007 |
| AS-REQ-014 | AS-AC-008 |
| AS-REQ-015、AS-REQ-016 | AS-AC-009、AS-AC-018 |
| AS-REQ-017 | AS-AC-010 |
| AS-REQ-018 | AS-AC-011 |
| AS-REQ-019 | AS-AC-004、AS-AC-012（按需挂载） |
| AS-REQ-020、AS-REQ-021 | AS-AC-012、AS-AC-013、AS-AC-014、AS-AC-015、AS-AC-022、AS-AC-029 |
| AS-REQ-022 | AS-AC-016、AS-AC-019 |
| AS-REQ-023 | AS-AC-012、AS-AC-018 |
| AS-REQ-024 | AS-AC-016、AS-AC-017 |
| AS-REQ-025 | AS-AC-012、AS-AC-013 |
| AS-REQ-026 | AS-AC-030 |
| AS-REQ-027 | AS-AC-021 |
| AS-REQ-028 | AS-AC-022 |
| AS-REQ-029 | AS-AC-020 |
| AS-REQ-030 | AS-AC-026 |
| AS-REQ-031 | AS-AC-025 |
| AS-REQ-032 | AS-AC-006 |
| AS-REQ-033 | AS-AC-018 |

## 4. 证据来源与边界

- **服务器只读 A/B / 结构证据**：实验阶段产出，归档于仓库外证据目录（服务器路径仅作辅助索引），详见 [reports/APP-SHELL-ACCEPTANCE-5202.md](./reports/APP-SHELL-ACCEPTANCE-5202.md) §8。
- **历史单元测试批次**：既有执行结果只记录“5 个相关测试文件、343 个用例全部通过”，未附逐文件清单；本草案引用该合计，不把推测的文件名归入该批次，也不重跑。
- **源码测试索引（非该批次清单）**：源码中可定位的相关测试包括 `stores/tabs.spec.ts`、`layouts/MainLayout.spec.ts`、`config/menu.spec.ts`、`views/log-query/SidebarReinit.spec.ts` 等，供复核时检索；`PASS_UNIT` 指这些源码测试，而非 343 批次的逐文件证据。
- **浏览器探针（本轮）**：2026-11-27 在 5202 生产预览（`index-1x59Uxdx.js`，对应 `fe53383`）以 Chromium 1400×900 复验关闭/重开滚动、实例保留时的滚动恢复、同路径查询字符串变化；只记录脱敏读数，不记录业务行明细。
- **人工验收**：固定侧栏与两管理页切换体感为 Windows Chrome 负责人体验级结论，非逐项正式执行。
- 本草案**不宣布**通用正式验收通过；标 `PENDING_VERIFICATION` 的用例需后续在真实浏览器补充执行。

## 5. 变更记录

| 日期 | 任务 | 说明 |
|---|---|---|
| 2026-11-27 | `CDC-APP-SHELL-FEATURE-BASELINE-DRAFT-001` | 初版草案，`AS-AC-001~030` |
| 2026-11-27 | `CDC-APP-SHELL-BASELINE-REVIEW-R1` | 补 AS-AC-018 滚动重开浏览器探针、AS-AC-006 查询字符串检查；校正 031/032/033 映射与 343 批次措辞 |
