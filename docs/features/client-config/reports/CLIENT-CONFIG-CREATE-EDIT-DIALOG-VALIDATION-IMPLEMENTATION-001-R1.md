# 第四轮新增／编辑弹窗校验与交互调整实现 R1 定向纠偏报告

- 任务编号：`CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-IMPLEMENTATION-001-R1`
- 任务类型：前端定向纠偏（非纯文档）
- 分支：`develop`
- 起始提交（base）：`9da96206cae51a891e326e586793e5e641082952`
- 依据：`docs/prompts/client-config/CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-IMPLEMENTATION-001-R1-Agent-Prompt.md`
- 上游结论：ChatGPT 对实现提交 `9da9620` 的远程代码复审结论 `CHANGES_REQUIRED`（唯一目标：主提交按钮加载态蓝黑跳色）

---

## 1. 问题与根因

新增／编辑探针弹窗的**主提交按钮**（`.cc-dialog-submit`）在**非提交处理中**为黑色可点击（`#09090b`），
但在**提交请求处理中**变为 Element Plus 主色浅蓝，实测 `rgb(160, 207, 255)`
（`#a0cfff`），即已批准条款（`CCFG-REQ-124`／`CCFG-AC-120`／`CCFG-DESIGN-062`／`CCFG-UI-051`）
禁止的**蓝黑跳色**。

根因（已从 `node_modules/element-plus/dist/index.css` 逐条核对）：

1. Element Plus 在 `is-loading` 时同时置 `is-disabled`（`_disabled = disabled || loading`），
   渲染出 `el-button el-button--primary is-disabled is-loading`。
2. `.el-button.is-disabled, .el-button.is-disabled:hover { background-color: var(--el-button-disabled-bg-color) }`，
   而 `.el-button--primary` 上 `--el-button-disabled-bg-color = var(--el-color-primary-light-5) = #a0cfff`（浅蓝）。
   该规则特异度 (0,2,0)，**未**使用 `!important`，因此可被更高特异度的本页 scoped 规则覆盖。
3. 另有 `.el-button.is-loading:before { background-color: var(--el-mask-color-extra-light) }`（`#ffffff4d`，30% 白遮罩）
   会冲淡深色底色，削弱加载态与常态的对比与可读性。

常态黑色来自本页既有 scoped 规则 `.cc-dialog-submit:not(.is-disabled)`（含 `[data-v-*]` 后特异度 (0,3,0)）；
加载态因命中 `:not(.is-disabled)` 的排除项而落回 Element Plus 的浅蓝，形成跳色。

**条款校验**：本次纠偏**未**发现无法同时满足的基线矛盾。`CCFG-UI-047` 要求“禁用态与 loading 态沿用 Element Plus
既有视觉且不被正常态规则覆盖”，其“本轮未被修订的保留”指**正常态规则不得扩张覆盖到禁用态**；
而本次新增的是**仅加载态**的定向规则（不是把正常态规则覆盖到所有禁用按钮），
与 `CCFG-DESIGN-059`“独立类名、不使用 `!important`、不新增全局样式”的口径一致，
亦不与 `CCFG-REQ-124`／`CCFG-AC-120`／`CCFG-DESIGN-062`／`CCFG-UI-051`“不得在蓝色与黑色之间跳色”冲突。

---

## 2. 变更清单

| 文件 | 变更 |
|---|---|
| `frontend/src/views/client-config/ClientConfigPage.vue` | 在 `.cc-dialog-submit:not(.is-disabled):active` 之后新增**仅加载态**定向规则与遮罩中和规则（见下），其余样式、模板与逻辑未改 |
| `frontend/src/views/client-config/ClientConfigPage.spec.ts` | 新增分组选择器取块助手 `cssGroupBlock`，并新增 `describe('第一轮纠偏（R1）：主提交按钮加载态保持黑色系（CCFG-REQ-120/124）')` 共 **4** 条回归用例 |
| `docs/features/client-config/README.md` | §1.10 追加 R1 时序说明与 R1 纠偏条目、修订“加载态配色口径”条目；§2 文档导航新增 R1 报告行；§4 追加 R1 实现条目；§5 现行下一入口更新为 R1 复审 |
| `docs/features/client-config/{REQUIREMENTS,ACCEPTANCE,DESIGN,UI}.md` | 仅追加**现行实现状态与追加时序说明**（下一入口改为 R1 复审），**未**修改任何业务定义行 |
| `docs/features/client-config/reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-IMPLEMENTATION-001-R1.md` | 本报告（新增） |

新增样式（原文）：

```css
/* 提交请求处理中的加载态：仍为黑色系深灰，避免正常态黑色与 Element Plus
   主色蓝之间跳色；以略浅于常态的深灰底 + 加载图标 + 不可重复点击游标与
   “可点击的黑色常态”区分，白字与加载图标保持可读。选择器仅限定本主提交
   按钮的加载态（不新增全局覆盖，也不强制提升优先级），`:loading="submitting"`
   与 `:disabled="submitting"` 的防重复提交逻辑不变。
   CCFG-REQ-120/124、CCFG-AC-115/120、CCFG-DESIGN-059/062、CCFG-UI-047/051。 */
.cc-dialog-submit.is-loading,
.cc-dialog-submit.is-loading:hover,
.cc-dialog-submit.is-loading:focus,
.cc-dialog-submit.is-loading:active {
  background: #3f3f46;
  border-color: #3f3f46;
  color: #ffffff;
  border-radius: 6px;
  font-weight: 500;
  cursor: not-allowed;
}

/* Element Plus 在加载态以 30% 白色遮罩涂抹按钮（其 `is-loading:before` 伪元素
   的 `--el-mask-color-extra-light`）；在深色加载态下该遮罩会冲淡底色并削弱与
   常态的对比，故在本按钮的加载态内置为透明。 */
.cc-dialog-submit.is-loading::before {
  background-color: transparent;
}
```

设计取舍：

- 底色／边框选 `#3f3f46`——本页既有“配置项名称标签”同款深灰，属**黑色系**而非蓝，且明显浅于常态 `#09090b`，
  与“仍可点击的黑色常态”形成可辨差异；配白字与 Element Plus 加载图标，满足“清楚可辨 / 可读”。
- 分组内显式带上 `:hover` / `:focus` / `:active`，防止 Element Plus 的 `.el-button.is-disabled:hover` 在悬停时把浅蓝刷回。
- 保留 `:loading="submitting"`、`:disabled="submitting"` 与 `submitDialog()` 首行守卫三重防重复，**未**改逻辑。
- 常态样式仍由 `:not(.is-disabled)` 限定；**未**新增全局覆盖、**未**使用 `!important`、**未**触及 `.el-button` 全局类名。

---

## 3. 测试与构建结果

| 验证 | 命令 | 结果 |
|---|---|---|
| 定向 R1 用例 | `npx vitest run src/views/client-config/ClientConfigPage.spec.ts -t "第一轮纠偏"` | **4/4 通过** |
| 定向全文件 | `npx vitest run src/views/client-config/ClientConfigPage.spec.ts` | **140/140 通过**（本轮由 136 增至 140） |
| 全量前端测试 | `npm test` | **57 个测试文件 / 1120 个用例通过**（本轮由 1116 增至 1120） |
| 前端构建 | `npm run build`（`vue-tsc --noEmit && vite build`） | **成功**（仅既有 chunk 体积提示，非错误） |

新增的 4 条回归用例及“避免只断言 class 而漏掉实际颜色”的落实：

1. **静态：加载态定向声明为黑色系深灰，且覆盖 hover/focus/active 不给浅蓝留入口**——
   从 SFC 源码取 `.cc-dialog-submit.is-loading` 分组声明块，断言实际配色令牌
   `background/border-color = #3f3f46`、`color = #ffffff`、`border-radius = 6px`、`font-weight = 500`、
   `cursor = not-allowed`；断言存在 `:hover`/`:focus`/`:active` 变体；断言 `::before` 的 `background-color = transparent`。
2. **静态：纠偏不引入浅蓝令牌、全局覆盖或 `!important`**——断言源文件**不**含 `#a0cfff`、
   `--el-color-primary-light-5`、`--el-button-disabled-bg-color`、`.el-button.is-loading`、`!important`，
   且正常态 `:not(.is-disabled)` 作用域保留。
3. **新增：常态黑可点击 → 挂起 `is-loading` 且防重复 → 结束后恢复**——
   断言常态无 `is-disabled`/`is-loading`、无 `disabled`；挂起时 `is-loading` + `is-disabled` + `disabled`，
   连点后写接口仅调用 1 次；成功结束后重开弹窗按钮无残留。
4. **编辑：常态黑可点击 → 挂起 `is-loading` 且防重复 → 失败后恢复**——
   同一三态在编辑“保存”按钮上复验；失败（reject）后弹窗保持打开、按钮恢复常态并给出网络错误提示。

因 **jsdom 不注入 SFC 样式**，真实 `computed` 色值由第 4 节的真实浏览器证据给出，不由 jsdom 断言代替。

---

## 4. 真实浏览器三态实测（新增／编辑均覆盖）

工具：仓库外临时静态服务 + 真实 `/usr/bin/google-chrome --headless=new`（CDP 驱动），
加载本轮 `npm run build` 产物 `/config/client`；写请求以接口桩注入并**可控延迟 2600ms 后以业务错误码
`40940` 收尾**（弹窗保持打开，便于观察“结束后恢复常态”），**未**写入任何真实业务数据。
脚本 `/tmp/ccvis/r1-validate.mjs`（仓库外），结果 `/tmp/ccvis/r1/r1-results.json` 与 6 张截图。

| 场景 | 状态 | classes | `background-color` | `border-top-color` | `color` | 圆角 | 字重 | 加载图标 | `cursor` | `::before` |
|---|---|---|---|---|---|---|---|---|---|---|
| 新增 | 常态 | `… cc-dialog-submit` | `rgb(9, 9, 11)` | `rgb(9, 9, 11)` | `rgb(255, 255, 255)` | 6px | 500 | 无 | pointer | `rgba(0,0,0,0)` |
| 新增 | 挂起 | `… is-disabled is-loading cc-dialog-submit` | `rgb(63, 63, 70)` | `rgb(63, 63, 70)` | `rgb(255, 255, 255)` | 6px | 500 | **有** | not-allowed | 透明 |
| 新增 | 结束 | `… cc-dialog-submit` | `rgb(9, 9, 11)` | `rgb(9, 9, 11)` | `rgb(255, 255, 255)` | 6px | 500 | 无 | pointer | `rgba(0,0,0,0)` |
| 编辑 | 常态 | `… cc-dialog-submit` | `rgb(9, 9, 11)` | `rgb(9, 9, 11)` | `rgb(255, 255, 255)` | 6px | 500 | 无 | pointer | `rgba(0,0,0,0)` |
| 编辑 | 挂起 | `… is-disabled is-loading cc-dialog-submit` | `rgb(63, 63, 70)` | `rgb(63, 63, 70)` | `rgb(255, 255, 255)` | 6px | 500 | **有** | not-allowed | 透明 |
| 编辑 | 结束 | `… cc-dialog-submit` | `rgb(9, 9, 11)` | `rgb(9, 9, 11)` | `rgb(255, 255, 255)` | 6px | 500 | 无 | pointer | `rgba(0,0,0,0)` |

**蓝黑跳色核对结论**：六个采样点中**不存在任何蓝色**（对照 `9da9620` 的挂起态为 `rgb(160, 207, 255)`）；
挂起态为黑系深灰 `#3f3f46`，与常态 `#09090b` 同族、单次稳定呈现、无来回跳变，满足
`CCFG-REQ-124`／`CCFG-AC-120`／`CCFG-DESIGN-062`／`CCFG-UI-051`。

**挂起期间防重复提交证据**：新增与编辑两场景均在同一挂起窗口内**连续点击 3 次**，服务端收到的写请求
`POST /api/clients` 与 `PUT /api/clients/probe-ok` **各恰为 1 次**（`dedupe.createWrites = 1`、`dedupe.editWrites = 1`），
两次请求的桩延迟实测为 2603ms / 2600ms。

截图：`r1-create-normal.png`、`r1-create-pending.png`、`r1-create-restored.png`、
`r1-edit-normal.png`、`r1-edit-pending.png`、`r1-edit-restored.png`。

---

## 5. 保留行为复核（未回归）

同一构建产物重跑第四轮几何／回归脚本（`/tmp/ccvis/r4-validate.mjs`，输出 `/tmp/ccvis/r4b/`）：

| 项 | 结论 |
|---|---|
| 弹窗视口居中 | 24 个“弹窗打开”场景（3 视口 × 侧栏展开/收起 × 4 状态）中心偏差**全部为 0** |
| 字段反馈区稳定高度 | `min-height = 20px`、`overflow = visible`，各视口一致 |
| 弹窗/footer 底边稳定 | footer 底边 1440×900 = **606.16**、1920×1080 = **633.16**、1024×720 = **579.16**，与 `9da9620` 记录值一致 |
| 加载态跨视口着色 | 3 视口 × 侧栏展开/收起共 6 个 loading 场景按钮底色均为 `rgb(63, 63, 70)`（原为浅蓝） |
| 字段级校验、ID 32 位、描述 256 字符截断 | 由 `ClientConfigPage.spec.ts` 140/140 覆盖并通过 |

---

## 6. 定义行完整性与状态边界

- **定义行完整性**：`CCFG-REQ-001~136`（136）、`CCFG-AC-001~135`（135）、`CCFG-DESIGN-001~071`（71）、
  `CCFG-UI-001~059`（59）四类定义行相对 base `9da9620` **逐字节零变化**（已用 `grep` 抽取定义行比对）。
- **验收状态**：135 条验收**全部为 `NOT_RUN`**，无 `PASSED`/`FAILED`/`BLOCKED`；本次**未**执行正式验收。
- **状态分层**：`adjustment4_baseline_status=APPROVED` 不变；
  `adjustment4_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW` **保持**（仍停在远程代码复审入口）；
  `adjustment4_formal_acceptance_execution_status=NOT_RUN`；`PENDING_USER_CONFIRMATION=0`。
- **范围边界**：**未**修改 `/config/data-source` 参考页、后端、`API.md`／`DATABASE.md`、`docs/baseline/**`、
  两套共享模板、`docs/prompts/**`、`.claude/**`；**未**访问或写入数据库／ZooKeeper／Kafka；
  **未**创建或推广任何通用弹窗模板；两套模板的模板级全局状态与数据源管理参考页最终接受状态**不变**。
- **未执行事项**：正式验收（135 条）、项目负责人页面目测、ChatGPT 远程代码复审。

---

## 7. 结果与下一步

- 起始提交 `9da96206cae51a891e326e586793e5e641082952`；本次结果提交见任务结果输出。
- **下一入口**：`CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_IMPLEMENTATION_R1_REVIEW`
  （由 ChatGPT 从远程 Git 对本 R1 结果提交做独立代码复审）。
- **远程代码复审通过仍不等于项目负责人目测或正式验收通过**；项目负责人**后续仍须对实际页面做目测**。
