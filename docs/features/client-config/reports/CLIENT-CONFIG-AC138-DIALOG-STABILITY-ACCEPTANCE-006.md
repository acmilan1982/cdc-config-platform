# CLIENT-CONFIG-AC138-DIALOG-STABILITY-ACCEPTANCE-006｜探针弹窗稳定性补测

- 任务：`CLIENT-CONFIG-AC138-DIALOG-STABILITY-ACCEPTANCE-006`
- 006 固定基线：`2a2760a96a74ab10ece5fa8d061b8639c6eadf19`（`develop`，005-R2 远端复审通过）
- R1 勘误基线：`bc5840d1933b0558bd2c0d195bac94f8cf743649`（`develop`，006 远端复审 `CHANGES_REQUIRED`）
- 验收对象：`CCFG-AC-138` / `CCFG-REQ-139`
- 页面范围：仅 `/config/client`
- 证据目录：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC138-DIALOG-STABILITY-ACCEPTANCE-006/`
- 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_AC138_DIALOG_STABILITY_ACCEPTANCE_006_R1_REVIEW`

## 1. 结论

| AC | 判定 | 依据摘要 |
|---|---|---|
| `CCFG-AC-138` | **FAIL** | 常规六步序列在两个已确认视口（1K 1920×1080、2K 2560×1440，侧栏展开）的几何变化量全部为 `0.00px`；但两行长错误出现时，两视口 `dialogHeight`、`dialogBottom`、`submitY` 均相对基线位移 `+16.37px`。原条款要求提示与错误状态切换不得造成弹窗高度或位置突变，且没有多行错误例外；长错误可读性通过不能抵消稳定性不通过，故整体判 FAIL |

- `changed_ids=[CCFG-AC-138]`
- 验收统计：`PASS 152 / FAIL 1 / BLOCKED 4 / NOT_RUN 0 = 157`（`CCFG-AC-079/087/091/094` 保持 `BLOCKED`）
- 不标记 Feature 正式接受。

## 2. 已确认的验收条件与环境

负责人原话：「主要进行1k，侧栏展开，附带2k。」本轮按浏览器 **CSS 视口**执行：

| 项目 | 实测 |
|---|---|
| 主验收（1K） | `innerWidth=1920`、`innerHeight=1080`，侧栏展开 |
| 补充（2K） | `innerWidth=2560`、`innerHeight=1440`，侧栏展开 |
| 追加补充 | `innerWidth=1024`、`innerHeight=720`，侧栏展开（仅用于换行/受控滚动的当前运行补充） |
| DPR / 缩放 | `devicePixelRatio=1`；`visualViewport.scale=1`（100%） |
| 侧栏 | `collapsed=false`，实际宽度 `220px`；内容区左边界 `220px` |
| 浏览器 | Chrome for Testing `147.0.7727.15`，headless |
| 服务 | 复用后端 PID 3215（`*:8080`）、前端 PID 3348（`0.0.0.0:5173`）；未构建、未重启 |
| 页面入口 | `http://192.168.174.70:5173/config/client` |

历史 1440×900 / 1024×720 结果不作为本轮主验收结果；本轮两个已确认视口均独立完整执行。

## 3. 六步稳定性序列（1K / 2K）

逐步执行并采样：① 打开后初始状态 → ② 未选数据源的稳定基线 → ③ 选中 1 个 → ④ 全部取消 → ⑤ 点击“创建”触发红色字段错误 → ⑥ 修正确认错误消除。①②界面状态相同，分别标明并各自采样，不以重复采样冒充额外交互。

### 3.1 1K（1920×1080，侧栏展开）

| 步骤 | 反馈文案 / 语气 | 选中数 | 弹窗外框 top–bottom（高） | 底部按钮 x / y | 表单 client/scroll/scrollTop |
|---|---|---|---|---|---|
| ① 初始 | “至少选择 1 个数据源” / 灰 `rgb(144,147,153)` | 0 | 162–775.19（613.19） | 1334 / 727.19 | 493 / 493 / 0 |
| ② 稳定基线 | 同①（分别采样） | 0 | 162–775.19（613.19） | 1334 / 727.19 | 493 / 493 / 0 |
| ③ 选中 1 | 隐藏 | 1 | 162–775.19（613.19） | 1334 / 727.19 | 493 / 493 / 0 |
| ④ 全部取消 | 灰 | 0 | 162–775.19（613.19） | 1334 / 727.19 | 493 / 493 / 0 |
| ⑤ 提交红色错误 | “至少选择 1 个数据源” / 红 `rgb(245,108,108)` | 0 | 162–775.19（613.19） | 1334 / 727.19 | 493 / 493 / 0 |
| ⑥ 修正 | 隐藏 | 1 | 162–775.19（613.19） | 1334 / 727.19 | 493 / 493 / 0 |

相对②基线的最大绝对变化量（`summary.deltas.maxAbs`）：`dialogTop=0`、`dialogBottom=0`、`dialogLeft=0`、`dialogRight=0`、`dialogHeight=0`、`submitX=0`、`submitY=0`。每步 `submit.hit.isSubmitOrChild=true`（提交按钮可命中）、弹窗可见、无整页横向溢出（`scrollWidth=clientWidth=1920`）。

### 3.2 2K（2560×1440，侧栏展开）

| 步骤 | 反馈文案 / 语气 | 选中数 | 弹窗外框 top–bottom（高） | 底部按钮 x / y | 表单 client/scroll/scrollTop |
|---|---|---|---|---|---|
| ① 初始 | “至少选择 1 个数据源” / 灰 | 0 | 216–829.19（613.19） | 1654 / 781.19 | 493 / 493 / 0 |
| ② 稳定基线 | 同①（分别采样） | 0 | 216–829.19（613.19） | 1654 / 781.19 | 493 / 493 / 0 |
| ③ 选中 1 | 隐藏 | 1 | 216–829.19（613.19） | 1654 / 781.19 | 493 / 493 / 0 |
| ④ 全部取消 | 灰 | 0 | 216–829.19（613.19） | 1654 / 781.19 | 493 / 493 / 0 |
| ⑤ 提交红色错误 | 红 | 0 | 216–829.19（613.19） | 1654 / 781.19 | 493 / 493 / 0 |
| ⑥ 修正 | 隐藏 | 1 | 216–829.19（613.19） | 1654 / 781.19 | 493 / 493 / 0 |

相对②基线的最大绝对变化量同样全部为 `0`；每步提交按钮可命中、弹窗可操作；无整页横向溢出（`2560=2560`）。

> 说明：反馈区由 `.ced-field-feedback` 预留 `min-height:20px`；1 行提示/错误实测高 `18.19px`，在预留空间内，因此提示、隐藏、变红切换均不改变对话框几何。步骤⑤的红字为前端校验（未选数据源），**不产生任何 HTTP 请求**。

## 4. 长错误可读性

### 4.1 证据来源与回放事实

长文案来自 005 已入仓的真实后端记录：`CLIENT-CONFIG-DIALOG-ACCEPTANCE-005/results/probeB-write.json → gate.responses[0]`，业务码 `40941`，HTTP 200。文本：

> 数据源“CCFG005超长机构名称用于错误换行验证样本（CCFG005-DS-LONG-0123456789ABCDE）”已分配给探针：CCFG005-OCC1，不能重复分配。

本轮在浏览器内拦截 `POST /api/clients` 并以该响应本地回放，经应用真实错误映射（40941 → 采集数据源字段）渲染；**未转发后端**，**未插入 DOM、未改 CSS**。因此该分支是“回放”，不是本轮真实后端响应；本轮无业务写。

### 4.2 1K（1920×1080，侧栏展开）

| 阶段 | 弹窗外框 top–bottom（高） | 按钮 y | 表单 client/scroll/scrollTop | 错误文字行框（top–bottom，宽） | 两行均在表单可视区 |
|---|---|---|---|---|---|
| 出现前（已选 1 源，无错误） | 162–775.19（613.19） | 727.19 | 493 / 493 / 0 | —（反馈区仅预留 20px） | — |
| 出现后 | 162–791.56（629.56） | 743.56 | 509 / 509 / 0 | 692.19–707.19（731.03）；710.38–725.38（140.13） | **true / true** |
| 修正后 | 162–775.19（613.19） | 727.19 | 493 / 493 / 0 | — | — |

- 行数 `2`；`overflow=visible`、`overflow-wrap=anywhere`、`white-space=normal`；文字框 `691.19–727.56`，位于表单可视区 `218.39–727.56` 内。
- 直接反馈/控件祖先均为 `overflow:visible`；`.cc-form` 为 `overflow:auto` 但 `scrollHeight=clientHeight=509`，无内部滚动、无硬裁剪。
- 几何变化：上边固定（`0.00px`）、水平位置固定（`0.00px`）；下边与底部按钮因两行内容比预留高度多 `16.37px` 而下移 `16.37px`；修正后回到基线（差 `0.00px`）。

### 4.3 2K（2560×1440，侧栏展开）

| 阶段 | 弹窗外框 top–bottom（高） | 按钮 y | 表单 client/scroll/scrollTop | 错误文字行框（top–bottom，宽） | 两行均在表单可视区 |
|---|---|---|---|---|---|
| 出现前 | 216–829.19（613.19） | 781.19 | 493 / 493 / 0 | — | — |
| 出现后 | 216–845.56（629.56） | 797.56 | 509 / 509 / 0 | 746.19–761.19（731.03）；764.38–779.38（140.13） | **true / true** |
| 修正后 | 216–829.19（613.19） | 781.19 | 493 / 493 / 0 | — | — |

与 1K 相同的行数、行宽与 `16.37px` 内容增高；上边与水平位置固定，修正后归零；无内部滚动、无硬裁剪。

### 4.4 1024×720 补充（侧栏展开，当前运行）

| 阶段 | 弹窗外框 top–bottom（高） | 按钮 y | 表单 client/scroll/scrollTop | 错误文字行框 | 均在表单可视区 |
|---|---|---|---|---|---|
| 出现前 | 108–708.39（600.39） | 660.39 | 480 / 493 / 0 | — | — |
| 出现后 | 108–708.39（600.39） | 660.39 | 480 / 509 / 0 | 638.19–653.19；656.38–671.38 | false / false |
| 表单滚动 29px 后 | 108–708.39（600.39） | 660.39 | 480 / 509 / **29** | 609.19–624.19；627.38–642.38 | **true / true** |
| 修正后 | 108–708.39（600.39） | 660.39 | 480 / 493 / 0 | — | — |

该视口表单达到 `max-height:480px`，两行错误由**表单内部受控滚动**吸收，对话框高度不变；滚动 `29px` 后两行完整可读。该场景为当前运行的补充证据，不替代两个已确认视口。

### 4.5 关于 `16.37px`（R1 纠正）

两行文字实际高 `36.375px`，反馈区预留 `20px`，差值 `16.375px`（实测四舍五入为 `16.37px`）。在 1K/2K 表单未达最大高度时，对话框按内容自然增高：`dialogTop`、`dialogLeft` 不变，但 `dialogHeight`、`dialogBottom`、`submitY` 均相对长错误出现前基线位移 `+16.37px`；在 1024×720 下则由受控滚动吸收，几何变化为 `0`。

006 原判曾把这 `16.37px` 解释为“长错误完整可读所必需、因此符合稳定性条款”。**R1 撤回该解释**：AC-138/REQ-139 明确要求提示与错误状态切换**不造成弹窗高度或位置突变**（上下边与底部按钮纵坐标稳定），原条款**没有**多行错误例外。内容驱动增高说明它不是固定弹窗高度或侧栏硬编码偏移，但不能豁免位移本身——错误显示期间弹窗下边与底部按钮确实发生了 `+16.37px` 位移。可读性条款通过不能抵消稳定性条款不通过，故 AC-138 整体判 **FAIL**。

## 5. 静态布局核对（固定高度 / 侧栏偏移）

| 核对项 | 结果 |
|---|---|
| 弹窗固定高度 | 未发现。`ClientConfigPage.vue:261` 仅设 `width="900px"`；组件未设固定 `height`；实测计算高 `613.188` / `629.562` / `600.391px`，`max-height:none` |
| 响应式最大高度 | 表单 `max-height: calc(100vh - 240px)` + `overflow-y:auto`（`ClientConfigPage.vue:1950-1951`），实测 `840/1200/480px` |
| 反馈区固定高度 | 未发现。仅 `min-height:20px`（公共预设 `create-edit-dialog-visual.css:105-108`），长文案可自然增高 |
| 长文案裁剪 | 未发现。`.ced-field-error` 与 `.cc-field-feedback__text` 均 `overflow-wrap:anywhere`，无 `overflow:hidden`、无固定单行高度 |
| 侧栏宽度硬编码偏移 | 未发现。源码未给弹窗设置以 `220/64px` 为基准的 `left`/`margin-left`；实测对话框中心与视口中心差 `0`，与内容区中心差 `-110px`（恰为 220px 侧栏的一半，是整视口居中 + 内容区右移的几何结果），且 1K/2K/1024 三视口恒定 |
| 垂直位置 | Element Plus `margin: 15vh auto 50px`；实测 `margin-top=162/216/108px`，随视口高度缩放，非固定像素 |

源码依据与逐项实测见 `evidence/.../static-layout-check.md`。

## 6. 判定依据与限制

AC-138 条款逐项对应：

1. **同一已确认视口、同一序列、逐步记录纵/横坐标**：1K、2K 各自完整执行六步，`sequence1920x1080.summary.deltas.maxAbs` 与 `sequence2560x1440.summary.deltas.maxAbs` 全 `0`。符合。
2. **提示与错误状态切换不造成弹窗高度或位置突变**：常规灰/隐藏/红切换的六步几何稳定；但两行长错误出现时，`longError1920x1080.geometryDelta.afterVsBefore` 与 `longError2560x1440.geometryDelta.afterVsBefore` 的 `dialogHeight`、`dialogBottom`、`submitY` 均为 `+16.37`，即错误显示期间弹窗下边与底部按钮发生纵向位移。**不符合。**
3. **长错误完整可读、不被硬裁剪**：两视口均 2 行、行框均在表单可视区，`overflow:visible`、`overflow-wrap:anywhere`，无祖先硬裁剪；1024 补充场景滚动 29px 后两行可读。符合。
4. **允许响应式布局与受控滚动**：1K/2K 内容驱动高度，1024 表单受控滚动。符合。
5. **不得写死侧栏偏移或固定弹窗高度**：源码与计算样式均未发现；居中为视口居中（`margin:auto`），垂直为 `15vh`。符合。

限制与改判依据（如实记录，不吞掉）：

- 两行长错误在 1K/2K 使对话框下边与底部按钮下移 `16.37px`（上边不动），修正后归零；内容驱动增高可以解释位移成因，但原条款没有多行错误例外，位移事实违反“不造成弹窗高度或位置突变”。
- 可读性通过、响应式布局合规、无固定高度/侧栏硬编码，均不能抵消第 2 项的稳定性不通过；故 AC-138 整体判 **FAIL**。
- 1024×720 为补充视口，不是负责人确认的主/补充验收条件；且该补充视口的 `0` 位移不能替代两个已确认视口中的 `+16.37px` 事实。
- 长错误为浏览器内本地回放（来源 005 真实记录），不是本轮真实后端响应；真实错误渲染路径与错误码映射未改动。
- 本轮未做数据库级核对；AC-138 为前端布局/可读性条款，且本轮零写，无 DB 核对对象。

**判定：FAIL。**

## 7. 网络与写入台账

- 门禁：首次导航前安装 `context.route('**/api/**')`；GET/HEAD/OPTIONS 放行，其余方法计数并中止。
- 业务 GET：`GET /api/clients` 1 次、`GET /api/clients/data-source-options` 6 次（另有 1 条 Vite 模块 `/src/api/clientConfig.ts` 被门禁记录，非业务接口）。
- 业务非 GET 尝试：**3** 次 `POST /api/clients`，均在长错误场景；全部浏览器内本地回放 005 的 40941，`forwarded=false`。
- 转发到后端的非 GET：**0**（`gate.backendNonGetForwarded=0`）。
- 业务写成功：**0**；数据库/夹具 DML：**0**；COMMIT：**0**；ZooKeeper/Kafka：**0**。
- 六步序列无任何非 GET 请求。

## 8. 验收统计与定义保护

- 从 `ACCEPTANCE.md` 独立复算：157 个 AC ID 连续唯一。
- 006 开工统计为 `PASS 152 / FAIL 0 / BLOCKED 5 / NOT_RUN 0`；006 原将 `CCFG-AC-138` 由 `BLOCKED` 更新为 `PASS`（`PASS 153 / FAIL 0 / BLOCKED 4 / NOT_RUN 0 = 157`），该结果已被 R1 取代。
- R1 现行统计：`CCFG-AC-138` 由 `PASS` 改判为 `FAIL`，即 **`PASS 152 / FAIL 1 / BLOCKED 4 / NOT_RUN 0 = 157`**。
- `CCFG-AC-079/087/091/094` 保持 `BLOCKED`；其余状态格不变；157 条定义行逐字节不变。
- `ACCEPTANCE.md` 本轮仅将 AC-138 状态格 `PASS → FAIL`；未改功能接受状态，未改其他 Feature/模板/产品代码/配置。
- 未标记 Feature 正式接受。

## 9. 变更文件

### 006（历史，已提交并推送）

- `docs/features/client-config/reports/CLIENT-CONFIG-AC138-DIALOG-STABILITY-ACCEPTANCE-006.md`（新建）
- `docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC138-DIALOG-STABILITY-ACCEPTANCE-006/`（新建）
  - `README.md`、`environment-and-version.txt`、`network-ledger.md`、`static-layout-check.md`
  - `probes/probeA-ac138.cjs`、`results/ac138-stability.json`、`SHA256SUMS`
- `docs/features/client-config/ACCEPTANCE.md`（仅 AC-138 状态格）
- `docs/features/client-config/README.md`（追加本轮报告入口一行）

### R1 勘误（本轮）

- `docs/features/client-config/ACCEPTANCE.md`（仅 AC-138 状态格 `PASS → FAIL`）
- `docs/features/client-config/reports/CLIENT-CONFIG-AC138-DIALOG-STABILITY-ACCEPTANCE-006.md`（本文件：结论、条款对照、统计改判，撤回 16.37px 符合稳定性的解释，追加 R1 勘误记录）
- `docs/features/client-config/README.md`（仅修正 006 段落的现行状态、统计与复审入口）
- 006 证据目录、原始 JSON、探针与 `SHA256SUMS` **逐字节保留**，未改动。

## 10. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_AC138_DIALOG_STABILITY_ACCEPTANCE_006_R1_REVIEW`

## 11. R1 勘误记录（2026-11-06）

- **006 原判**：`CCFG-AC-138` = `PASS`（提交 `bc5840d` 并推送）；当时把两行长错误造成的 `+16.37px` 视为“长错误完整可读所必需”，未计为稳定性失败。
- **远端复审**：`CHANGES_REQUIRED`。指出原条款要求提示与错误状态切换时弹窗下边和底部按钮纵坐标稳定，没有多行错误例外。
- **纠正结论**：`CCFG-AC-138` = **`FAIL`**；`changed_ids=[CCFG-AC-138]`；统计 `PASS 152 / FAIL 1 / BLOCKED 4 / NOT_RUN 0 = 157`。
- **证据键**：`sections.sequence1920x1080.summary.deltas.maxAbs`、`sections.sequence2560x1440.summary.deltas.maxAbs` 全 `0`；`sections.longError1920x1080.geometryDelta.afterVsBefore`、`sections.longError2560x1440.geometryDelta.afterVsBefore` 的 `dialogHeight`/`dialogBottom`/`submitY` = `+16.37`，`dialogTop`/`dialogLeft`/`submitX` = `0`；`correctedVsBefore` 全 `0`；`sections.longError1024x720Supplement.geometryDelta` 全 `0`（补充场景，不替代已确认视口）。
- **本轮性质**：纯文档勘误；未启动浏览器或服务、未构建、未运行探针、未调用业务 API、未读写数据库/夹具、未改产品代码或配置。006 原始证据逐字节保留。
- 006 原 `PASS` 判定仅作为已被 R1 取代的历史记录保留。
