# CLIENT-CONFIG-DISABLED-APPLICABILITY-TARGETED-READONLY-ACCEPTANCE-001 证据说明

只读定向验收证据。任务仅访问 `/config/client` 及其新增弹窗、行菜单；不访问其他功能页面；不提交有效表单、不点击启停/删除最终确认、不调用写接口、不修改产品源码/CSS/测试。

## 文件

| 文件 | 内容 |
|---|---|
| `probe-disabled-applicability.mjs` | 只读浏览器探针：在**首次导航前**对浏览器上下文安装 `/api/**` 非 GET 阻断；采集 1440×900 与 1920×1080 两视口的 AC-090 与 AC-157 观察值 |
| `disabled-applicability-results.json` | 探针输出的脱敏结果（设备像素比 1） |
| `env-and-version.txt` | 采集时点、三方 Git SHA、服务进程/端口、工具链版本、拦截策略与限制 |
| `README.md` | 本说明 |
| `SHA256SUMS.txt` | 上述文件的 SHA-256 |

## 采集方式

```bash
PLAYWRIGHT_CORE_DIR=/root/.hermes/hermes-agent/node_modules/playwright-core \
node docs/features/client-config/reports/evidence/CLIENT-CONFIG-DISABLED-APPLICABILITY-TARGETED-READONLY-ACCEPTANCE-001/probe-disabled-applicability.mjs
```

- 浏览器：无头 Chromium 147.0.7727.15，`--no-sandbox`，`deviceScaleFactor=1`。
- 前端：既有 Vite dev server（pid 8141，`0.0.0.0:5173`），提供工作区 HEAD 源码；未构建、未重启。
- 后端：既有 Spring Boot jar（pid 8120，`:8080`）；本任务不依赖后端写入。
- 网络拦截：`context.route('**/api/**')`，GET/HEAD/OPTIONS 放行，其余方法 `abort('blockedbyclient')` 并计数；安装发生在 `page.goto` 前。

## 结果要点

- `writeInterception.nonGetAttempts = 0`，`attempts = []`。该计数仅覆盖本探针浏览器会话的网络层，不等于对后端全部请求日志或数据库层的独立审计。
- AC-090：默认 `rgb(9,9,11)` 底/边框、白字、6px、500；hover/focus `rgb(39,39,42)`；按下 `rgb(24,24,27)`；按钮含 SVG 加号、文案“新增探针”、位于工具栏最右；点击打开标题“新增探针”的弹窗后仅关闭、未提交；查询/重置外观保持各自默认值。
- AC-157：16 行均挂 opt-in 单元格与触发器；触发器 28×28、6px、主色、`role=button`、`tabindex=0`、可访问名称存在（探针 ID 已脱敏为 `<ID>`）、真实 Tab 可达、`:focus-visible` 为 2px 内嵌焦点环；行高内容驱动（15 行 48px、1 行 52px）；当前源码 4 条 opt-in 规则全部限定在 `.lt-main-table` 内、无 `!important`；菜单项由页面渲染，公共 CSS 只承载外观。

## 脱敏

- 行内可访问名称以 `更多操作：<ID>` 形式记录，真实探针 ID 不落盘。
- 不包含凭据、机构名、连接串或业务整屏截图。

## 边界

- 本轮**未**访问 `/config/data-source` 或其他页面；AC-157 的未启用页零变化前置仅复用已入仓历史证据（见主报告的复用说明）。
- 触发器 `disabled` 与新增按钮 `disabled` 子项当前按 2026-11-03 适用性说明记为不适用，未人为构造禁用状态。
