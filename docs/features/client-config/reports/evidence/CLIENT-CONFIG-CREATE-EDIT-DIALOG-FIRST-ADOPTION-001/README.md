# 证据包：探针端管理新增／编辑主弹窗接入公共 create-edit-dialog-visual-template 视觉预设

`task_code=CREATE-EDIT-DIALOG-CLIENT-CONFIG-FIRST-ADOPTION-001`

真实无头 Chromium 对**实际** `/config/client` 页面**新增／编辑业务主弹窗**的**只读**核验证据。
数据来自独立**只读**合成桩（GET `/api/clients` 由浏览器内合成脱敏 1 行填充；GET `/api/clients/data-source-options` 由合成脱敏 2 项填充；其余 GET 返回空集合 200）；
`/api/**` 的 POST/PUT/PATCH/DELETE 在**浏览器路由层**拦截并计数，**未**访问真实后端、数据库或 ZooKeeper，**未**发出任何到达后端的写请求。

## 文件

| 文件 | 说明 |
| --- | --- |
| `verify-dialog-adoption.mjs` | Playwright 只读核验脚本（真实鼠标 `hover`/`focus`/`mousedown`；读值在过渡沉降后） |
| `dialog-adoption-results.json` | 核验结果：`checks` 29/29 通过（`failed` 为空）；`writeSummary.nonGetReachedBackend=0` |

## 复现

```bash
# 需已运行前端 dev server（如 127.0.0.1:5173），并以 NODE_PATH 指向只读 playwright 安装目录
# 例：PLAYWRIGHT_MODULE=/root/.hermes/hermes-agent/node_modules/playwright node verify-dialog-adoption.mjs
node verify-dialog-adoption.mjs
```

脚本仅做只读导航与 DOM/计算样式读取；不发起来源写请求（非 GET `/api/**` 一律 `route.abort('blockedbyclient')`，先登记再阻断）。

## 覆盖（29 项检查）

- **接入面**：弹窗根类保留 `cc-dialog` 并追加 `ced-dialog`；三个标签行／标签／必填星号／反馈占位挂公共类（`cedLabelRow=3`、`cedFormLabel=3`、`cedRequiredMark=3`、`cedFieldFeedback=3`）；仅主提交按钮挂 `ced-submit`（1 个）；`cedFieldError`／`cedFieldErrorState` 初始为 0。
- **来源归属**：公共预设 12 条规则来自公共 CSS 文件（Vite dev id `frontend/src/styles/dialog/create-edit-dialog-visual.css`）；页面仅以非 scoped 块 `.cc-dialog.ced-dialog` 声明 **4 个 Feature 令牌**（`84px` / `12px` / `48px` / `#3f3f46`）。
- **宽度与令牌**：有效宽度 `900px`（经 EP `style="--el-dialog-width: 900px"`，计算 `width=900`、`maxWidth=1232px`＝`1280−48`）；窄视口 `420` 时 `width=372`＝`420−48`，无横向溢出。
- **标签与行**：字体 `14px/500/rgb(63,63,70)`、右对齐、`flex-basis 84px`、`padding-top 6px`；必填星号唯一 `content:"*"` 且 `rgb(245,108,108)`；标签行 `display:flex`、`gap:12px`；反馈占位 `min-height:20px`、`margin-top:2px`。
- **主按钮可观察态**：常态 `rgb(9,9,11)` / hover `rgb(39,39,42)` / focus `rgb(39,39,42)` / active `rgb(24,24,27)` / 恢复常态 `rgb(9,9,11)`；加载态 `rgb(63,63,70)`（Feature 令牌）、白字、`cursor:not-allowed`、`::before` 遮罩透明化 `rgba(0,0,0,0)`。加载态**同时**带 `is-disabled` 与 `is-loading`（故公共 `:not(.is-disabled)` 选择器不命中，属预期）。
- **非目标按钮零挂载**：`取消`／`自动生成`／`修改探针 ID` 均不含 `ced-submit`（也不含 `cc-dialog-submit`）。
- **错误态**：提交后 `.ced-field--error` 容器 2 个、`.ced-field-error` 文字 3 处、输入框 `box-shadow rgb(245,108,108) 0 0 0 1px inset`；长文案 `13px`/危险色/`overflow-wrap:anywhere`，窄视口内换行至 3 行。
- **编辑弹窗**：同挂根类与公共标签类；保存按钮同为黑色实心且仅它挂 `ced-submit`。
- **零泄漏对照**：`/config/data-source` 的 `ced-*` 计数（含打开其主弹窗后）全为 0；其主弹窗仍为 `el-dialog editor-dialog`、宽 `620`、提交底色 `rgb(9,9,11)` 未变。

## 写请求边界

```json
{
  "nonGetAttempts": [ { "method": "POST", "url": "http://127.0.0.1:5173/api/clients" } ],
  "nonGetReachedBackend": 0,
  "blockedByClient": "在浏览器路由层 abort，未转发到 Vite 代理，更未到达后端",
  "readGetsFulfilledByStub": 4
}
```

结果 JSON 中的类串、色值（`rgb(...)`）、尺寸均直接取自浏览器 `getComputedStyle` / `getBoundingClientRect` / `element.style` 实测，不含业务可识别数据；
页面不提交有效表单、不触发启停／删除最终确认、不修改业务数据。
