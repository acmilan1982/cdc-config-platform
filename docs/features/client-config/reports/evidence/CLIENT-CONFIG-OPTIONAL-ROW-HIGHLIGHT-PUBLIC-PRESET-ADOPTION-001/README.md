# 证据包：探针端管理主列表接入 §13 公共可选单行固定高亮预设

`task_code=CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001`

真实无头 Chromium 对**实际** `/config/client` 页面主列表的**只读**核验证据。
数据来自独立**只读**合成桩（GET `/api/clients` 由浏览器内合成脱敏行填充；其余非 GET `/api/**` 在网络层拦截并计数），
**未**访问真实后端、数据库或 ZooKeeper，**未**发出任何写请求。

## 文件

| 文件 | 说明 |
| --- | --- |
| `verify-client-optin.mjs` | Playwright 只读核验脚本（真实鼠标 `hover`；读值在 `0.25s` 过渡沉降后） |
| `client-optin-results.json` | 核验结果：`ok: true`，37/37 检查通过，写请求计数 0 |

## 复现

```bash
# 需已运行前端 dev server（如 127.0.0.1:5173），并以 NODE_PATH 指向只读 playwright 安装目录
NODE_PATH=<playwright-install-dir>/node_modules node verify-client-optin.mjs
```

## 覆盖

- 视口：`1440×900` 与 `1024×768`；
- 场景：未固定透明 / 普通行悬停 `#f4f4f5` / 单击固定 `#e1e4e8` / 固定行自悬停维持 / 他行悬停不影响固定行 / 取消后无残留 `current-row` 与左缘强调 / 最右固定列同色 / 文字与三点焦点不灰化 / 行高 `48px`（歧义行 `52px` 内容驱动）；
- 零泄漏对照：`/config/data-source` 的 `lt-row-highlight` 与 `lt-row-highlight__row` 计数均为 0。

结果 JSON 中的类串、色值（`rgb(...)`）与行高均直接取自浏览器 `getComputedStyle` / `getBoundingClientRect` 实测，不含业务可识别数据。
