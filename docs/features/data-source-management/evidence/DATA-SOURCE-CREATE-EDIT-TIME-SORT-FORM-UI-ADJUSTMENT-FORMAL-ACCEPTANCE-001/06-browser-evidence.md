# 06 — 真实浏览器证据（截图 / 计算样式 / 网络）

> 任务：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`　`RUN_TAG=FACC002`
> 覆盖用例：`DS-AC-192~199`

## 1. 采集环境

| 项 | 值 |
|---|---|
| 浏览器 | Google Chrome 148.0.7778.167（`/opt/google/chrome/chrome`，`--headless=new`，PID 20720） |
| 调试协议 | Chrome DevTools Protocol，`127.0.0.1:9222` |
| 驱动方式 | 无第三方依赖，自建 Node CDP 客户端 `/agent/cdc-temp-ds-formui-001/logs/FACC002/cdp.mjs`（Node 22+ 内建 `WebSocket` + `fetch`） |
| 视口 | `Emulation.setDeviceMetricsOverride {1440×900, dsf=1}` |
| 被测地址 | **`http://192.168.174.70:5173/config/data-source`**（真实前端 Vite 服务 `0.0.0.0:5173`） |
| 接口链路 | 页面内请求经 Vite 代理打到后端：请求 URL 形如 `http://192.168.174.70:5173/api/data-sources` |

> 说明：Chrome 以 headless 模式运行（服务器无图形界面）。交互一律通过 CDP 的 `Input.dispatchMouseEvent` 或对真实 DOM 元素派发原生事件完成，样式读数一律取 `getComputedStyle` 的**真实浏览器计算值**，非单元测试断言。

## 2. 截图清单

| 文件 | 内容 |
|---|---|
| `shot-list.png` | 数据源列表页（48 行，含 `FACC002-*` 排在最前与最后的分组） |
| `shot-create-dialog.png` | 新增弹窗（`DS-AC-192/193/194/197`：标签右对齐 120px、测试连接按钮对齐、密码红星、提交按钮「创建」） |
| `shot-195-empty-pw.png` | 新增弹窗密码留空点击「创建」后的中文校验错误「请输入密码」（`DS-AC-195`） |
| `shot-after-create.png` | `FACC002-UI-NEW` 经真实界面新增成功后列表状态（`DS-AC-195`） |
| `shot-196-edit.png` | 「编辑数据源」弹窗（`DS-AC-196`：密码项无红星、掩码显示、按钮文案「保存」） |
| `shot-naming-dialog.png` | 目标库命名策略弹窗（`DS-AC-193/199`：标签 `110px` 左对齐，未受主弹窗样式影响） |

截图文件保存在未提交的运行日志目录 `/agent/cdc-temp-ds-formui-001/logs/FACC002/`，不入 Git。

## 3. 计算样式证据（真实浏览器读数）

### 3.1 主弹窗表单（`DS-AC-192/193/194`）

来源：`measure-create.json`、`ds-ac-192-193-199.json`

| 选择器 | 属性 | 实测值 | 期望 | 判定 |
|---|---|---|---|---|
| `.editor-dialog .editor-form .el-form-item__label` | `text-align` | `right` | 右对齐 | ✓ |
| 同上 | `width` | `120px` | 120px | ✓ |
| 同上 | `font-size` | `14px` | 14px | ✓ |
| 同上 | `font-weight` | `500` | 500 | ✓ |
| 同上 | `color` | `rgb(63, 63, 70)` | `#3f3f46` | ✓ |
| 同上 | `font-family` | 系统无衬线栈（`-apple-system, … "Segoe UI", "PingFang SC", "Microsoft YaHei", …`） | 非等宽、非 `600`、非 `#09090b` | ✓ |
| `.editor-form`（实际 `class`） | — | `el-form el-form--default el-form--label-right editor-form` | `label-position="right"` | ✓ |
| `.editor-dialog .test-bar` | `padding-left` | `120px` | 120px | ✓ |
| 首个输入框 / 测试连接按钮 左边界 | `getBoundingClientRect().left` | `546px` / `546px` | 对齐 | ✓ `aligned=true` |

### 3.2 密码星号与作用域（`DS-AC-194/195`）

| 项 | 实测值 |
|---|---|
| 新增态密码项类名 | `editor-password-required-mark`（存在） |
| 新增态 `::before` | `content="*"`，`color=rgb(245, 108, 108)`（`--el-color-danger`） |
| 新增态密码输入 | `type=password`，`placeholder="请输入密码"` |
| 密码项 `is-required` 类 | **不存在**（无 `required`/`is-required` 造成的隐式英文校验） |
| 编辑态密码项类名 | `editor-password-required-mark` **不存在** |
| 编辑态 `::before` | `content="none"` → **无红星** |
| 编辑态密码框显示值 | 常量掩码 `*********`（9 位），≠ 库中真实密码（16 位）→ 无回显 |

### 3.3 提交按钮（`DS-AC-197/198`）

来源：`ds-ac-197-198.json`、`ds-ac-197-198-realstates.json`、`ds-ac-197-disabled.json`、构建产物 `dist/assets/DataSourcePage-D-BNKJE-.css`

| 状态 | 取值 | 采集方式 |
|---|---|---|
| 常态 | `bg=rgb(9,9,11)`、`color=rgb(255,255,255)`、`radius=6px`、`weight=500` | 计算样式 |
| `:hover` | `bg=rgb(39,39,42)` | `CSS.forcePseudoState(['hover'])` |
| `:focus` | `bg=rgb(39,39,42)` | `CSS.forcePseudoState(['focus'])` |
| `:active` | `bg=rgb(24,24,27)` | `CSS.forcePseudoState(['active'])` |
| 加载中 | `class` 含 `is-loading`、`hasSpinner=true`、`color=rgb(255,255,255)`、`bg=rgb(9,9,11)` | **真实运行态**：点击保存后逐 10ms 轮询捕获 |
| 禁用 | `bg=rgb(160,207,255)`、`cursor=not-allowed` | 定向注入 `is-disabled` 类（过渡结束后读数） |

构建产物中的规则（作用域经 Vue `data-v-9c65c310` 限定）：

```css
[data-v-9c65c310] .editor-dialog .editor-submit-button:not(.is-disabled){background:#09090b;border-color:#09090b;color:#fff;border-radius:6px;font-weight:500}
[data-v-9c65c310] .editor-dialog .editor-submit-button:not(.is-disabled):hover,[data-v-9c65c310] .editor-dialog .editor-submit-button:not(.is-disabled):focus{background:#27272a;border-color:#27272a;color:#fff}
[data-v-9c65c310] .editor-dialog .editor-submit-button:not(.is-disabled):active{background:#18181b;border-color:#18181b;color:#fff}
[data-v-9c65c310] .editor-dialog .editor-password-required-mark .el-form-item__label:before{content:"*";color:var(--el-color-danger);margin-right:4px}
[data-v-9c65c310] .editor-dialog .el-form-item__label{font-size:14px;font-weight:500;color:#3f3f46}
```

**证据层级如实标注**：

- 常态 / `:hover` / `:focus` / `:active` / 加载中 = **真实浏览器态**（伪类由 CDP 强制或在真实请求中进行中捕获）。
- **禁用** = 定向自动化（`is-disabled` 类注入）+ 计算样式 + 构建产物 CSS 佐证。真实编辑弹窗的 `editorLoading` 禁用窗口过短未能稳定捕获，**不声称**该项为完整端到端运行态证据。
- 本组件全部 `editor-*` 规则在构建产物中均带 `[data-v-9c65c310]` 作用域且进一步限定 `.editor-dialog`，**不存在无作用域全局规则**（对 `DataSourcePage-D-BNKJE-.css` 的规则集合审计）。

## 4. 网络证据（CDP `Network.requestWillBeSent`）

| 用例 | 场景 | 观测到的写请求 | 结论 |
|---|---|---|---|
| `DS-AC-195` | 新增弹窗密码留空点击「创建」 | `POST /api/data-sources` **计数 = 0** | 校验拦截在发出请求之前 ✓ |
| `DS-AC-195` | 补齐密码后点击「创建」 | 1 条 `POST http://192.168.174.70:5173/api/data-sources`，请求体含 `password` 字段（Agent 自建测试密码，原文不入 Git） | 真实新增成功 ✓ |
| `DS-AC-196` | 编辑弹窗未触碰密码直接「保存」 | 1 条 `PUT http://192.168.174.70:5173/api/data-sources/FACC002-UI-NEW`，请求体**不含 `password` 字段** | 沿用原密码 ✓ |

配套界面提示：新增成功 → `新增成功`；保存成功 → `保存成功`；新增失败态（`FACC002-UI-NEW` 编辑后）→ 弹窗关闭、无错误。

## 5. 其他弹窗与跨路由无外溢（`DS-AC-193/199`）

| 对象 | 实测 |
|---|---|
| 命名策略弹窗标签 | `width=110px`、`text-align=left`、`font-weight=400`、`color=rgb(96,98,102)`、`class="… el-form--label-left naming-form"` → 保持 Element Plus 默认，**未被主弹窗覆盖** |
| 主弹窗「取消」按钮 | `bg=rgb(255,255,255)`、`color=rgb(96,98,102)`、`radius=4px`、`class="el-button"` → 默认视觉 |
| 主弹窗「测试连接」按钮 | 同上默认视觉 |
| 跨路由抽样（`/config/client`、`/monitor/cdc-node`、`/config/subscribe`、`/monitor/log-query`、`/monitor/job-failure`、`/monitor/data-source-state`） | `editorStyledLabels=0`、`editorMarkNodes=0` |

## 6. 复现命令

```bash
cd /agent/cdc-temp-ds-formui-001/logs/FACC002
node nav.mjs                 # 打开 192.168.174.70:5173/config/data-source 并截图
node measure-create.mjs      # DS-AC-192/193/194：标签与星号计算样式
node ui-195-empty-pw.mjs     # DS-AC-195：空密码中文校验 + 零请求
node ui-create.mjs           # DS-AC-195：真实新增 FACC002-UI-NEW
node ui-196-edit.mjs         # DS-AC-196：编辑态无星号、沿用原密码
node ui-197-198-button.mjs   # DS-AC-197/198：常态/悬停/聚焦/按下/禁用
node ui-197-198b.mjs         # DS-AC-198：真实加载态捕获
node ui-192-193-199.mjs      # DS-AC-192/193/199：对齐、其他弹窗、按钮默认视觉
node route-leak2.mjs         # DS-AC-199：跨路由无外溢抽样
```
