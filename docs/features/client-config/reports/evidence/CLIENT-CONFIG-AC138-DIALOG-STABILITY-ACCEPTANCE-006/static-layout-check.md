# 静态布局与固定高度/侧栏偏移核对（006）

基线 `2a2760a96a74ab10ece5fa8d061b8639c6eadf19`。仅静态读取当前提交源码，并用同一提交运行页面的计算样式交叉核对；未修改任何源码、模板或 CSS。

## 1. 源码事实

| 项目 | 位置 | 内容 |
|---|---|---|
| 弹窗宽度 | `frontend/src/views/client-config/ClientConfigPage.vue:261` | `width="900px"`（设计桌面宽度；组件未设置固定 `height`） |
| 弹窗最大宽度 | `frontend/src/styles/dialog/create-edit-dialog-visual.css:21-22` | `.ced-dialog { max-width: calc(100vw - var(--ced-dialog-safety-inset)); }` |
| 页面安全边距令牌 | `frontend/src/views/client-config/ClientConfigPage.vue:2171-2175` | `--ced-dialog-safety-inset: 48px` |
| 表单响应式最大高度与受控滚动 | `frontend/src/views/client-config/ClientConfigPage.vue:1950-1951` | `.cc-form { max-height: calc(100vh - 240px); overflow-y: auto; }` |
| 反馈区稳定占位（最小高度，非固定高度） | `frontend/src/styles/dialog/create-edit-dialog-visual.css:105-108` | `.ced-dialog .ced-field-feedback { min-height: var(--ced-feedback-min-height, 20px); margin-top: 2px; }` |
| 错误文字换行、不裁剪 | `frontend/src/styles/dialog/create-edit-dialog-visual.css:110-116`；`ClientConfigPage.vue:2025-2030` | `.ced-field-error { ... overflow-wrap: anywhere; }`；`.cc-field-feedback__text { overflow-wrap: anywhere; }`，未设 `overflow:hidden`、未设固定单行高度 |
| 侧栏宽度 | `frontend/src/layouts/Sidebar.vue:64,74` | 展开 `220px`，收起 `64px` |
| 内容区让位 | `frontend/src/layouts/MainLayout.vue:48,53` | `.layout-right` 展开 `margin-left: 220px`，收起 `64px` |

核对结果：源码中**没有**给 `.cc-dialog` / `.ced-dialog` / `.el-dialog` 写死像素高度，也**没有**任何以侧栏宽度（220/64）为基准的弹窗 `left` / `margin-left` / 偏移规则。

## 2. 计算样式实测（原始值见 `results/ac138-stability.json`）

| 视口（侧栏展开 220px） | 对话框计算宽 | 计算高 | max-width | max-height | margin-top | 视口中心差 | 内容区中心差 | 表单 max-height | 表单 client/scroll |
|---|---|---|---|---|---|---|---|---|---|
| 1920×1080（1K） | 900px | 613.188px（序列）/ 629.562px（两行长错误） | 1872px | none | 162px（15vh） | 0 | -110px | 840px | 493 / 493（长错误 509 / 509） |
| 2560×1440（2K） | 900px | 613.188px / 629.562px | 2512px | none | 216px（15vh） | 0 | -110px | 1200px | 493 / 493（长错误 509 / 509） |
| 1024×720（补充） | 900px | 600.391px / 600.391px | 976px | none | 108px（15vh） | 0 | -110px | 480px | 480 / 493（长错误 509） |

- `position: relative; top: 0; left: 0; margin-bottom: 50px`；水平位置由 Element Plus 覆盖层的 `margin: 15vh auto 50px` 自动居中决定。
- 竖向上边距随视口高度按 `15vh` 缩放（162/216/108），不是固定像素偏移。
- 对话框中心与视口中心差恒为 `0`；与内容区中心差恒为 `-110px`。`-110px` 恰为展开侧栏 `220px` 的一半，是“在整视口覆盖层内居中、而内容区整体右移 220px”的几何结果，并非把侧栏宽度写死为弹窗偏移；若为侧栏硬编码偏移，对话框应对齐内容区中心（该差应为 0）或随侧栏状态改变而改变。

## 3. 稳定性与长错误的几何解释

- 六步序列中，提示（1 行 18.19px）在反馈区 `min-height:20px` 预留空间内，反馈出现/隐藏/变红均不改变占位高度，因此对话框上下边、左右边、底部按钮坐标变化量全部为 `0.00px`。
- 两行长错误文字实际高度 `36.375px`，比 `20px` 预留多 `16.375px`；在 1K/2K 下表单未达到 `max-height`（493/509 远小于 840/1200），因此对话框内容自然增高 `16.37px`（上边不动、下边与底部按钮同量下移），修正后回到基线（差 0）。
- 在 1024×720 下表单已达到 `max-height:480px`，两行错误被表单内部受控滚动吸收，对话框高度保持不变；滚动 29px 后两行文字均在表单可视区内。
- 这说明行为是**内容驱动的响应式高度 + 受控滚动**，不是固定弹窗高度，也不是靠裁掉长文案“看起来稳定”。
