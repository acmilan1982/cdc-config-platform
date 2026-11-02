# 证据目录：CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002-R1

本目录是 [`CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002-R1`](../../../CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002-R1.md) 的真实浏览器**只读**补证证据，仅覆盖两项：

- `R1-01` `CCFG-AC-124`：**编辑模式**完整五步 `未选(0) → 选中 1 → 全部取消(0) → 本地错误 → 修正消除`（三视口）。
- `R1-02` `CCFG-AC-130`：**真实剪贴板粘贴**（`Control+V`）路径（1440×900），含只读事件观察。

## 采集口径

- 真实运行页面：Vite dev server `http://127.0.0.1:5173` 服务当前工作树（末次 `frontend/src` 提交 `d878c3d`）；只读 GET `http://127.0.0.1:8080`（本次 START-ONLY 启动，PID 见 `env-and-version.txt`）。
- 浏览器：Chromium `147.0.7727.15`，headless，`deviceScaleFactor=1`。
- 视口：AC-124 为 1440×900 / 1920×1080 / 900×800；AC-130 为 1440×900。
- **写阻断**：首次导航前安装 `context.route('**/api/**')`，`GET/HEAD/OPTIONS` 放行，其余方法 `abort('blockedbyclient')` 并计数。结果 `writeInterception.nonGetAttempts=0`，`attempts=[]`。
- **零业务写入**：编辑弹窗只打开并取消；唯一一次“提交”点击发生于**未选数据源**的本地校验失败表单，前端本地校验即阻断、未发网络写；修正后不再提交。
- **真实粘贴**：一次性浏览器上下文授予 `clipboard-read`/`clipboard-write`，经 `navigator.clipboard.writeText` 写入真实剪贴板后用真实 `Control+V` 粘贴；未用 `dispatchEvent`/直接赋值/`page.fill()` 冒充。事件 `isTrusted=true`、`inputType=insertFromPaste`。
- **脱敏**：业务 ID／机构名不入仓；只记录存在性/布尔/几何/计数、事件元数据与静态 UI 文案。

## 文件

| 文件 | 说明 |
|---|---|
| `probe-r1-dialog.cjs` | R1 只读探针（AC-124 编辑完整五步 + AC-130 真实粘贴） |
| `r1-dialog-results.json` | 脱敏结果 |
| `env-and-version.txt` | 运行环境与版本对应 |
| `SHA256SUMS.txt` | 本目录文件校验和 |

## 复核提示

```bash
node -e 'for(const k of ["han300","mixed","boundary"]){const c=require("./r1-dialog-results.json").clipboard.cases[k];console.log(k,c.eventSequence.join(">"),c.events.every(e=>e.isTrusted),c.events.find(e=>e.type==="input").inputType,c.final.valueCodePoints,c.final.hasLoneSurrogateAnywhere)}'
sha256sum -c SHA256SUMS.txt
```

**R1 只读补证 ≠ 写授权 ≠ 157 条整体验收通过。**
