# 行高与可选三点入口实现 · 证据索引（脱敏）

本目录为任务 `CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001` 的**脱敏、可追溯**证据，供 ChatGPT 从远程 Git 复审本轮实现使用。

本任务实现已批准的第七轮基线（`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-APPROVAL-CLOSEOUT-001`）：
公共层新增 `lt-row-action__cell` / `lt-row-action__ellipsis` 两个受 `.lt-main-table` 根类限定的显式 opt-in 辅助类，
探针端管理 `/config/client` 主列表显式接入，使**内容驱动的常规行高**回到参考页基准；
数据源管理 `/config/data-source` 保持“更多”文字入口，**本轮只读对照、文件未修改**。

## 内容

| 文件 | 说明 |
|---|---|
| `measure-before.mjs` | 实现前基线：两视口逐行 `tr.getBoundingClientRect().height` 与操作单元格/`.cell`/入口的计算样式与盒尺寸（探针端 53 / 参考页 48） |
| `measure-after.mjs` | 实现后复测：同样的逐行测量 + `td.lt-row-action__cell` / `.lt-row-action__ellipsis` 挂载核对 + 表头 `th` 不受影响核对 + **真实键盘 Tab** 到达入口并读取焦点计算样式 + hover 背景 + 125% 缩放等效与窄视口 |
| `focus-ring-pixel-probe.mjs` | 焦点环**像素级**验证：只截 `28×28` 命中区本身，按 PNG 原始像素确认 `:focus-visible` 描边四边与四角均可见，且外扩 `34×34` 区域**无**描边像素（证明描边内嵌、未被 `.cell{overflow:hidden}` 裁掉） |
| `row-height-results.json` | 合并的机读结果：`before` / `after` 两套逐行原值（保留原始小数）、逐样本与参考页差值、焦点与 hover 观测、零写统计 |
| `focus-ring-pixels.json` | 焦点环四边/四角像素采样与判定 |
| `SHA256SUMS.txt` | 仓库外原始产物（未脱敏结果 JSON、原始截图）与仓库内文件的完整 SHA-256 |

## 脱敏处理

- `row-height-results.json` 中探针业务 ID 一律按行序替换为 `S01..Sn`；元素类名中的 Element Plus 内部列序号 `el-table_<n>_column_<m>` 归一为 `el-table_N_column_N`。
- **不**含数据库连接信息、内网主机/端口、账号口令或令牌、真实业务数据、原始截图。
- 脱敏前的原始结果与截图保留在执行机器临时目录（仓库外），哈希见 `SHA256SUMS.txt`。

## 复现方式

三个脚本均为 ESM，依赖执行环境已有的 Playwright：

```bash
cd /tmp && ln -sfn <playwright-node_modules> ./node_modules   # ESM 不认 NODE_PATH，用软链解析
node measure-before.mjs   # 输出 /tmp/rh-evidence/baseline.json
node measure-after.mjs    # 输出 /tmp/rh-evidence/after.json
node focus-ring-pixel-probe.mjs
```

脚本在**打开页面前**安装网络拦截：`/api/**` 的 `GET`/`HEAD`/`OPTIONS` 放行，
`POST`/`PUT`/`PATCH`/`DELETE` 一律 `abort('blockedbyclient')` 并计数。
三次运行实测**拦截计数均为 0**（全部请求均为 GET，零写）。

## 判定边界

- 浏览器证据为**本机真实 Chromium**（非 jsdom、非 CSS 推导）；不声称外网可访问性。
- 参考页 `/config/data-source` 为**只读对照**，本轮未修改其文件；其复测值与本轮实现前基线一致，用于证明零变化。
- 本证据只支撑实现层面的行高/命中区/焦点事实，**不**等于正式验收结论，也未替代项目负责人目视。
