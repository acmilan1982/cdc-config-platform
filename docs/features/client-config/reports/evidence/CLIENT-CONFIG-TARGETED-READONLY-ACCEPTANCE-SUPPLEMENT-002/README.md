# 证据目录：CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002

本目录是 [`CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002`](../../../CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002.md) 的真实浏览器**只读**补测证据。

## 采集口径

- 真实运行页面：Vite dev server `http://127.0.0.1:5173` 服务当前工作树（`frontend/src` 末次提交 `d878c3d`）；只读 GET `http://127.0.0.1:8080`（PID 7137 / 7191，见 `env-and-version.txt`）。
- 浏览器：Chromium（Playwright `playwright-core` + `chromium-1217`），headless，`deviceScaleFactor=1`。
- 视口：列表/确认框 1440×900 与 1920×1080；弹窗另有 900×800（窄视口）。
- **写阻断**：首次导航前安装 `context.route('**/api/**')`，`GET/HEAD/OPTIONS` 放行，其余方法 `abort('blockedbyclient')` 并计数。**四个结果文件的 `writeInterception.nonGetAttempts` 均为 `0`**，`attempts=[]`。
- **零业务写入**：未提交有效新增/编辑、未点击启停/删除最终确认、未直调写接口、未建夹具、未改库或写 ZooKeeper/Kafka。
- **脱敏**：业务 ID／机构名不入仓。确认框正文中的探针 ID 掩码为 `<ID>`（`bodyMasked`）；「已分配」原因文本掩码为 `已分配给：<ID>`；`fgActive` 原始值不落盘，仅记录逐行布尔匹配与掩码形状。

## 文件

| 文件 | 说明 |
|---|---|
| `probe-s2-list.cjs` | AC-009/017/088/101/103 列表探针（两桌面视口） |
| `probe-s2-dialog.cjs` | AC-092/112/115/124/130/136 弹窗探针（1440×900 / 1920×1080 / 900×800） |
| `probe-s2-fgactive.cjs` | AC-088：界面 `异常：{原始值}` 与只读 GET `fgActive` 逐行相关性（两视口） |
| `probe-s2-confirm.cjs` | AC-151：启停确认框标题/正文/按钮与主按钮各态视觉（两视口，最终确认从不点击） |
| `s2-list-results.json` | 列表探针脱敏结果 |
| `s2-dialog-results.json` | 弹窗探针脱敏结果 |
| `s2-fgactive-results.json` | `fgActive` 相关性脱敏结果 |
| `s2-confirm-results.json` | 确认框脱敏结果 |
| `env-and-version.txt` | 运行环境与版本对应（git HEAD、jar mtime/sha256、PIDs、监听地址、node/java 版本） |
| `SHA256SUMS.txt` | 本目录文件校验和 |

## 复核提示

```bash
node -e 'for(const f of ["s2-list-results","s2-dialog-results","s2-fgactive-results","s2-confirm-results"]){const d=require("./"+f+".json");console.log(f,d.writeInterception.nonGetAttempts)}'
sha256sum -c SHA256SUMS.txt
```

**只读补测 ≠ 写授权 ≠ 157 条整体验收通过。**
