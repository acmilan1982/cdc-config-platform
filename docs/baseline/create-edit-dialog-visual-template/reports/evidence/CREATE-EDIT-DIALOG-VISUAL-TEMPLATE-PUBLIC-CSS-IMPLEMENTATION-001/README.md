# 公共 CSS 实现 · 脱敏可复算浏览器证据

本目录为任务 `CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001` 的**隔离合成夹具**
真实浏览器证据，用于独立复算公共视觉预设的各状态表现。**不含任何业务数据、业务文案、内网地址或口令。**

## 文件

| 文件 | 说明 |
|---|---|
| `driver.mjs` | 证据驱动脚本：读取仓库中已提交的公共 CSS 工件并内联进合成夹具，启动无头 Chrome，经 DevTools 协议（CDP）读取真实计算样式；强制 `:hover`／`:active`／`:focus`／`:focus-visible` 并模拟窄视口 |
| `fixture.html` | `driver.mjs` 生成的合成夹具（根类 `.ced-dialog` 弹窗 + 无根类对照弹窗），标签文案为中性占位文本 |
| `computed-styles.json` | `driver.mjs` 的原始输出（宽视口 / hover / active / focus / focus-visible / 窄视口） |

## 复算方式

```bash
# 依赖：Node.js（内置全局 WebSocket，Node ≥ 22）、/usr/bin/google-chrome；无需 playwright/puppeteer
cd <repo>/docs/baseline/create-edit-dialog-visual-template/reports/evidence/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001
node driver.mjs > /dev/null   # 重新生成 fixture.html 与本目录外 /tmp 下的 evidence.json
```

`driver.mjs` 顶部的 `CSS_PATH` 指向仓库内公共 CSS 工件；夹具把该工件原样内联进 `<style>`，
故证据反映的是**已提交的公共 CSS 内容**，而非副本。

## 边界

- 夹具为**合成结构**：以最小 DOM 模拟“私有 flex 表单标签”与“Element Plus `el-form-item__label`”两类接入形态，
  并模拟 Element Plus 既有全局环境（提供 `--el-color-danger` 等变量）。
- 夹具挂根类**不计为任何业务页面接入**；生产页面挂载 `.ced-dialog` 数仍为 `0`（见静态契约测试第 16 条）。
- 本证据**不是** Feature 的正式验收，也**不是**项目负责人目测结论。
