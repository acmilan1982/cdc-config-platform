# 探针端管理定向只读验收补测 002-R1：两项关键操作补证或恢复 BLOCKED

> 任务编号：`CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002-R1`
> 分支：`develop`；基线提交：`c0a3c1d5784133704e7883e3df16b055a9a189e6`
> 范围：仅 `/config/client`（探针端管理）的未提交草稿、既有验收资料与文档；不访问、测试或修改其他功能页面。
> 性质：**真实浏览器只读补证**。不开启业务写路径、不提交有效表单、不点启停/删除最终确认、不建夹具、不改库/ZooKeeper/Kafka。
> 触发：ChatGPT 从远程 Git 对 `d925899..c0a3c1d` 的独立复审结论为 `CHANGES_REQUIRED`；本任务仅补 `CCFG-AC-124`（编辑模式完整五步）与 `CCFG-AC-130`（真实粘贴路径）两项，或按实际结果恢复 `BLOCKED`。
> **本轮 changed_ids（相对 base c0a3c1d）：`[]`**。两项补证后仍为 `PASS`，故 §4 状态格零变化；统计保持 `PASS 78 / FAIL 0 / BLOCKED 64 / NOT_RUN 15 = 157`。

---

## 1. 现场与基线核对

| 项 | 本次实测 |
|---|---|
| 仓库 / 分支 | `/agent/cdc-config-platform` / `develop` |
| HEAD（base） | `c0a3c1d5784133704e7883e3df16b055a9a189e6` |
| `origin/develop` / 远端 `refs/heads/develop` | 均等于 `c0a3c1d…`（未推进、无分叉） |
| 任务前工作区 | 仅 `.claude/settings.local.json`(M)、`docs/prompts/`(??)、`runtime-logs/`(??) 等无关内容，保持原样 |
| 后端 | 本次以仓库既有 `java -jar backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar` START-ONLY 启动；PID 4758，监听 `0.0.0.0:8080`；jar 早于末次 `backend/src` 提交（`807a5a5` 2026-09-20），无更新后端源码 |
| 前端 | 本次以 `npm run dev` START-ONLY 启动；PID 4790，监听 `0.0.0.0:5173`；Vite 直接服务当前工作树（末次 `frontend/src` 提交 `d878c3d`） |
| 浏览器 | Chromium `147.0.7727.15`，`headless=true`，`deviceScaleFactor=1` |
| 环境 | JDK `1.8.0_202`、Node `v24.17.0`；详见证据 `env-and-version.txt` |

> 服务为本次 START-ONLY 启动，仅用于只读浏览；未修改配置、未触碰数据服务。

---

## 2. 执行方式与写阻断

- **写阻断**：每个浏览器上下文在**首次导航前**安装 `context.route('**/api/**')`；`GET/HEAD/OPTIONS` 放行，其余方法 `abort('blockedbyclient')` 并计数。结果 `writeInterception.nonGetAttempts=0`、`attempts=[]`。
- **零业务写入**：编辑弹窗只打开并取消；唯一一次“提交”点击发生在**未选数据源**的本地校验失败表单上，点击后前端本地校验即阻断，未发出网络写；修正后**不再提交**。
- **AC-124 视口**：`1440×900`、`1920×1080`、`900×800`（沿用原报告三视口，便于逐态核对）；新增模式 S0～S4 直接复用 R0 已入仓证据，本轮不重跑。
- **AC-130 视口**：`1440×900` 留证；其余字符限制结果复用 R0 既有证据，不重复全部视口。
- **真实粘贴**：为一次性浏览器上下文授予 `clipboard-read` / `clipboard-write`，通过浏览器 **Clipboard API**（`navigator.clipboard.writeText`）把合成文本写入**真实剪贴板**，聚焦描述框后以真实 **`Control+V`** 快捷键粘贴；**未**使用 `dispatchEvent(new ClipboardEvent(...))`、直接赋值或 `page.fill()` 冒充粘贴。剪贴板上下文用完即随 context 关闭。
- **脱敏**：业务 ID／机构名不入仓；只记录存在性/布尔/几何/计数、事件元数据（`type`/`isTrusted`/`inputType`/长度）与静态 UI 文案。

---

## 3. R1-01：`CCFG-AC-124` 编辑模式补齐完整顺序

### 3.1 旧证据缺口
R0 的 `probe-s2-dialog.cjs`（约 L449～464）编辑序列只有「已选 N 项 → 全部清空 → 提交显示错误 → 修正为 1 项」，顺序为 `N→0→错误→1`，**缺少**已批准定义要求的 `未选(0) → 选中 1 → 全部取消(0) → 提交红色错误 → 修正消除` 中的“选中 1”与“再次全部取消”两个原子步。等价推导不能替代真实操作。

### 3.2 本轮新增操作
在**编辑模式**下，先清空既有已选项并记录“未选”初态，再严格执行 `0→1→0→本地错误→修正`；每个原子动作后独立记录已选数、字段反馈 tone/文本、弹窗底边、取消/保存按钮纵坐标。修正后**不**再次提交。

### 3.3 实测结果（R1 证据 `r1-dialog-results.json`）

| 状态 | 已选数 | 错误数 | 反馈 tone / 文本 | 弹窗底边 | 取消/保存按钮 y |
|---|---|---|---|---|---|
| `E0-unselected-after-clear` | **0** | 0 | `hint` /「至少选择 1 个数据源」 | 1440：`770.578`；1920：`797.578`；900：`755.578` | 同名视口三态各自唯一值 |
| `E1-one-selected` | **1** | 0 | `null`（无反馈） | 同上（唯一值） | 同上（唯一值） |
| `E2-all-cleared` | **0** | 0 | `hint` /「至少选择 1 个数据源」 | 同上（唯一值） | 同上（唯一值） |
| `E3-submit-local-error` | **0** | **1** | `error` /「至少选择 1 个数据源」 | 同上（唯一值） | 同上（唯一值） |
| `E4-corrected` | **1** | 0 | `null`（错误消除） | 同上（唯一值） | 同上（唯一值） |

- **三视口逐态一致**：已选数 `0,1,0,0,1`；错误数 `0,0,0,1,0`；每个视口内**弹窗底边唯一值**、**底部按钮 y 唯一值**（零跳动）。
- **校验性质**：`E3` 的错误来自前端**本地业务规则校验**「至少选择 1 个数据源」，不是系统/API 错误——提交点击时 **`nonGetAttempts=0`**，无任何非 GET 请求到达后端；选择 1 个数据源后错误即消除（`E4`），无需后端报错。本任务**未**给定义增加“必须后端报错”的条件。
- 新增模式 S0～S4 复用 R0 证据（三视口同样为 `0,1,0,0,1` / 错误数 `0,0,0,2,0`、底边与按钮 y 唯一值；创建态 `S3` 多出“ID 为空”一条本地错误，属独立字段校验，与本 AC 的数据源校验不冲突）。

### 3.4 判定：`CCFG-AC-124` 维持 `PASS`
新增与编辑**两模式各一次完整五步**、三视口、零跳动、错误出现/消除均被真实操作覆盖；本轮补齐编辑模式缺失的原子步。`changed_ids` 不含 `CCFG-AC-124`。

---

## 4. R1-02：`CCFG-AC-130` 执行真实粘贴路径

### 4.1 旧证据缺口
R0 的 `descSet()` 调用 `page.fill()`。**整段填值不是粘贴操作**，不能证明真实粘贴事件路径；R0 报告虽披露“未使用剪贴板”，但仍将其称“粘贴式 input”并认定覆盖定义中的“粘贴”，属口径不足。既有“完整字符/代理对截断”结果继续有效，但“粘贴”一腿需真实补证。

### 4.2 本轮新增操作
在真实页面把合成文本写入**浏览器实际剪贴板**，聚焦描述框后用真实 `Control+V` 执行粘贴；在输入框安装**只读事件观察**，记录 `paste / beforeinput / input` 的实际顺序、`isTrusted`、`inputType`、合成输入长度、最终码点数/UTF-16 长度、是否存在孤立代理项。

### 4.3 实测结果（1440×900，R1 证据 `r1-dialog-results.json`）

| 用例 | 粘贴源 | 事件序列（全部 `isTrusted=true`） | `inputType` | 最终码点 / UTF-16 | 末码点 | 孤立代理项 |
|---|---|---|---|---|---|---|
| `han300` | 300 汉字（300cp/300utf16） | `paste → beforeinput → input` | `insertFromPaste` | **256** / 256 | `20013`（中） | `false` |
| `mixed` | 200 汉字 + 100 😀（300cp/400utf16） | `paste → beforeinput → input` | `insertFromPaste` | **256** / 312 | `128512`（😀） | `false` |
| `boundary` | 255 汉字 + 1 😀（256cp/257utf16） | `paste → beforeinput → input` | `insertFromPaste` | **256** / 257 | `128512`（😀） | `false` |

- 剪贴板可用性：`isSecureContext=true`、`navigator.clipboard.writeText` 可用；三次 `clipboardWrite.ok=true`；`paste` 事件 `clipboardTypes=["text/plain"]`、`clipboardTextCp` 与源一致（300/300/256）。
- `beforeinput`/`input` 的 `inputType` 均为浏览器实际值 **`insertFromPaste`**，非程序合成。
- 跨 256 边界用例 `boundary`（255 汉字 + 😀）最终保留 **256 完整字符**，即**恰好 256 允许**，且**未拆开代理对**（末码点仍为完整 Emoji 码点，`hasLoneSurrogateAnywhere=false`）。
- 提示文案 `placeholder="探针用途描述（最多 256 个字符）"`，`maxlength=null`（限制由字符计数逻辑而非原生属性实现）。

### 4.4 结合既有证据的逐项判断
- **可粘贴大段文本**：真实 `Control+V` 粘贴 300 汉字成功接收。✔（本轮）
- **≤256 字符 / 按 Unicode 完整字符计数 / 256 汉字允许**：`han300→256`、`boundary` 256 允许。✔（本轮 + R0）
- **手输与粘贴同一限制**：手输 `keyboard.type` 258 汉字→256（R0），真实粘贴 300→256（本轮），同一受控 setter。✔
- **截断不拆代理对 / 不产生半个字符**：`mixed`、`boundary` 均无孤立代理项。✔
- **提示文案“最多 256 个字符”**：✔（R0 + 本轮）

### 4.5 判定：`CCFG-AC-130` 维持 `PASS`
真实粘贴事件路径已补证，全部现行预期逐项覆盖。`changed_ids` 不含 `CCFG-AC-130`。

---

## 5. 关于 `CCFG-AC-092` 的边界澄清（状态不变）

R0 报告“本轮未新增跨页对照”**只记为本轮执行边界**，不作为现行新缺口。此前已审的 `/config/data-source` 跨页行高历史证据继续有效；AC-092 维持 `BLOCKED` 的原因**仅为**当前库内缺“超长 ID / 超长描述”样本（`maxClientIdLen=19`、`maxDescLen=152`），与本轮是否重复跨页对照无关。本轮不改其状态格与定义。

---

## 6. 状态变更与统计

| 项 | 值 |
|---|---|
| 本 R1 相对 base `c0a3c1d` 的 `changed_ids` | **`[]`**（两项补证后状态不变） |
| 原 002 轮次累计 `changed_ids`（相对 `d925899`） | `[CCFG-AC-009, CCFG-AC-017, CCFG-AC-088, CCFG-AC-101, CCFG-AC-124, CCFG-AC-130, CCFG-AC-136]`（7 条，保持不变） |
| 本轮补证结论 | `CCFG-AC-124` 维持 `PASS`；`CCFG-AC-130` 维持 `PASS` |
| 变更后四态（从实际 Git 对象复算） | `PASS` **78** / `FAIL` **0** / `BLOCKED` **64** / `NOT_RUN` **15** = **157** |
| `FAIL` | **0**（本轮**未**发现产品反例） |

---

## 7. 与 R0 结论的覆盖关系（历史快照不回写）

R0 报告、脚本与 JSON 作为历史快照**保留不回写**；以下两条 R0 结论由本 R1 **覆盖**：

1. R0「AC-124 五步序列在新增与编辑两模式、三视口均执行」——编辑模式当时实际为 `N→0→错误→1`，缺“选中 1 / 再次全部取消”；**本 R1 以编辑模式 `0→1→0→错误→1` 三视口真实补证覆盖**。
2. R0「手输与粘贴同一限制 … 粘贴」——当时“粘贴”由 `page.fill()` 代表，非真实粘贴；**本 R1 以真实 `Control+V`（`isTrusted=true`/`insertFromPaste`）覆盖**。

其余 R0 结论（009/017/088/101/136 上调、092/103/112/115/151 保持 `BLOCKED`）不受本 R1 影响。

---

## 8. 证据索引与核验命令

目录：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002-R1/`

| 文件 | 说明 |
|---|---|
| `probe-r1-dialog.cjs` | R1 只读探针（AC-124 编辑完整五步 + AC-130 真实粘贴） |
| `r1-dialog-results.json` | 脱敏结果（含事件序列、`isTrusted`、`inputType`、最终码点/UTF-16） |
| `env-and-version.txt` | 运行环境与版本对应（HEAD、jar mtime/sha256、PID、监听、版本） |
| `README.md` | 证据目录说明 |
| `SHA256SUMS.txt` | 本目录文件校验和 |

```bash
cd docs/features/client-config/reports/evidence/CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002-R1
node -e 'const d=require("./r1-dialog-results.json");console.log("nonGet=",d.writeInterception.nonGetAttempts);for(const k of ["han300","mixed","boundary"]){const c=d.clipboard.cases[k];console.log(k,c.eventSequence.join(">"),c.events.every(e=>e.isTrusted),c.events.find(e=>e.type==="input").inputType,c.final.valueCodePoints,c.final.hasLoneSurrogateAnywhere)}'
sha256sum -c SHA256SUMS.txt
```

---

## 9. 边界与未执行项

- 本任务**仅**补 AC-124/AC-130，未重跑 12 条全量探针；未改产品代码、测试、CSS、模板、定义或其他功能文档。
- 未提交有效表单、未点启停/删除最终确认、未建夹具、未改库/ZooKeeper/Kafka；`nonGetAttempts=0`。
- 服务为 START-ONLY 启动，仅用于只读浏览。
- **定向只读补证 ≠ 写授权 ≠ 157 条整体验收通过 ≠ 批准其他页面接入或迁移。**

---

## 10. 任务结果

- base：`c0a3c1d5784133704e7883e3df16b055a9a189e6`
- 状态变化：`changed_ids=[]`；`CCFG-AC-124`、`CCFG-AC-130` 维持 `PASS`；统计 `78/0/64/15`
- 非 GET 尝试：`0`
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_TARGETED_READONLY_ACCEPTANCE_SUPPLEMENT_002_R1_REVIEW`
