# 隔离夹具真实浏览器证据（R1）

对应任务：`CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001-R1`
对应报告：`../../CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001-R1.md`

> **本夹具是隔离合成夹具**：只用合成结构与中性占位文案（`字段名称`／`字段标识`／`创建`／`取消`／`次要按钮`），
> **不加载任何业务页面、不使用业务数据、不发任何写请求**。
> 夹具通过不代表任何业务页面已接入本模板（`migrated_page_count=0`，`PAGE_ADOPTION_NOT_AUTHORIZED`）。

## 1. 与 R0 证据的差别（为什么重做）

R0 的合成夹具**只内联了公共 CSS 与一个危险色变量**，没有加载 Element Plus 的样式表，因此：

- 其「禁用态」计算样式来自**浏览器默认样式**，不能作为「沿用 Element Plus 禁用视觉」的证据；
- 其 loading 用例用**虚拟类名组合**代替真实组件渲染的最终 DOM。

本 R1 夹具改为加载**项目当前依赖的真实 Element Plus 样式**并用**真实 Vue / Element Plus 组件**渲染 DOM：

| 依赖工件 | 来源 | 版本 |
|---|---|---|
| `vue.esm-browser.prod.js` | `frontend/node_modules/vue/dist/` | 3.5.39 |
| `element-plus/dist/index.full.mjs`（含默认安装插件与全部组件） | `frontend/node_modules/element-plus/dist/` | 2.14.2 |
| `element-plus/dist/index.css` | 同上 | 2.14.2 |
| 公共 CSS 工件 | `frontend/src/styles/dialog/create-edit-dialog-visual.css` | 本任务提交 |

浏览器经**原生 import map** 解析 `vue` / `element-plus` 裸模块名；`el-form`、`el-form-item`、`el-input`、
`el-button`、`el-dialog` 均为真实组件实例，不再手写 EP 的类名。

## 2. 文件

| 文件 | 说明 |
|---|---|
| `fixture.html` | 夹具页面：真实 EP 样式表（先）+ 公共 CSS 工件（后）→ import map → 组件写法（全部在 HTML 内） |
| `fixture-main.js` | 仅 `createApp({}).use(ElementPlus).mount('#app')`，无业务逻辑 |
| `driver.mjs` | 证据驱动：白名单静态服务 + 无头 Chrome + CDP 读计算样式／强制伪类／读匹配规则 |
| `computed-styles.json` | 原始输出（计算样式、`::before`、强制伪类结果、匹配规则与其来源样式表、窄视口） |

## 3. 复算方式

```bash
cd /agent/cdc-config-platform/docs/baseline/create-edit-dialog-visual-template/reports/evidence/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001-R1
node driver.mjs          # 重写 computed-styles.json 并打印摘要
```

- 需要无头 Chrome：`/usr/bin/google-chrome`（本机实测 `Google Chrome 148.0.7778.167`）；不需要 playwright／puppeteer。
- 脚本内**全部路径相对本文件定位**（`import.meta.url`），不含服务器绝对路径。
- `driver.mjs` 起一个仅监听 `127.0.0.1` 的静态服务，**只**暴露 6 个白名单路径
  （夹具 2 个 + 公共 CSS 工件 + 上述 3 个依赖发行版文件），不暴露仓库其他内容。

## 4. 覆盖矩阵（在 `computed-styles.json` 中的键）

| 验证项 | JSON 键 |
|---|---|
| 真实 EP 表单标签排版／星号 opt-in | `wide.epForm.{plain,marked}` |
| 私有标签 + 标签行（有／无 `--ced-label-gap`） | `wide.privateForm.*` |
| 主提交按钮正常／禁用／loading（无变量）／loading（有变量）／取消／派生 | `wide.buttons.*` |
| 真实 EP loading 遮罩 `::before` | `wide.buttons.loadingBefore` / `loadingVarBefore` |
| 强制 `:hover` / `:active` / `:focus` / `:focus-visible` | `states.{hover,active,focus,focusVisible}` |
| 强制 loading 按钮 `:hover`、禁用按钮 `:hover` | `states.loadingHover` / `states.disabledHover` |
| 命中规则及**来源样式表**（`/ep/index.css` vs `/ced.css`） | `matched.*[].matched[].sheet` |
| 真实 `el-dialog`（Teleport）+ 根类 | `wide.dialog` |
| 窄视口（400px）安全边距 | `narrow` |
| 未接入对照零命中 | `wide.plain.*`、`wide.counts.cedDialogInPlain` |

## 5. 已知边界（诚实标注）

- **不实测真实业务页面**：`/config/client`、`/config/data-source` 未加载、未修改、未接入；
  页面的实际层叠环境（页面 `<style scoped>` 与 `.el-dialog` 的 `:deep()` 规则）未纳入。
- **命中规则的伪元素列表有限**：本 Chrome 的 `CSS.getMatchedStylesForNode` 未在 `pseudoElements[].matchedCSSRules`
  中返回样式表来源的 `::before` 规则，故 loading 遮罩以**计算样式**（`rgba(255,255,255,0.3)`、
  `position: absolute`、`pointer-events: none`）作为证据，而非规则来源。
- **过渡时序**：EP `.el-button { transition: .1s }`，强制伪类后须等过渡结束再读（驱动内已固定等待 500ms），
  否则会读到过渡中间值。
- **字体渲染**：无头环境无中文字体族保证，字形不作为证据；本夹具只断言排版度量（字号／字重／颜色／对齐）。