# 006 证据索引：CCFG-AC-138 弹窗稳定性补测

任务 `CLIENT-CONFIG-AC138-DIALOG-STABILITY-ACCEPTANCE-006`，基线 `2a2760a96a74ab10ece5fa8d061b8639c6eadf19`，仅访问 `/config/client`。

## 文件

| 文件 | 内容 |
|---|---|
| `environment-and-version.txt` | 复用服务、PID/端口、浏览器版本、CSS 视口、DPR、侧栏状态与实际宽度 |
| `results/ac138-stability.json` | 探针原始 JSON：1K/2K 六步序列、长错误回放（出现前/出现后/修正后）、1024×720 补充、门禁台账、静态计算样式 |
| `probes/probeA-ac138.cjs` | 本次使用的 Playwright 探针（只读；长错误为浏览器内本地回放） |
| `network-ledger.md` | 网络门禁、3 次本地回放、0 次后端非 GET 转发、0 写/0 DML |
| `static-layout-check.md` | 固定高度与侧栏偏移的源码/计算样式核对 |
| `SHA256SUMS` | 上述文件校验和 |

## 复现（同一基线、同一运行服务）

```bash
cd /agent/cdc-config-platform
source /agent/cdc-config-platform/agent-env.sh
node docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC138-DIALOG-STABILITY-ACCEPTANCE-006/probes/probeA-ac138.cjs
```

- 前置：后端 `:8080`、前端 `:5173` 已健康运行；探针不构建、不重启服务。
- 浏览器：Chrome for Testing `147.0.7727.15`，headless，DPR 1，100% 缩放。
- 视口：`1920×1080`（主）、`2560×1440`（补充，均为侧栏展开）；`1024×720` 仅作换行/受控滚动的当前运行补充。
- 门禁：首次导航前 `context.route('**/api/**')`；GET/HEAD/OPTIONS 放行，其他方法计数并中止；长错误场景的 `POST /api/clients` 仅在浏览器内回放 005 已入仓 40941，不转发后端。

## 结果摘要

- 六步序列（初始→稳定基线→选中 1→全部取消→提交红色错误→修正消除）：两个已确认视口的对话框上/下/左/右边、高度、底部按钮 x/y 相对基线变化量均为 `0.00px`；反馈语气 灰→隐藏→灰→红→隐藏；无整页横向溢出；每步提交按钮命中测试通过、弹窗可操作。
- 长错误：005 记录的 40941 文案经真实错误渲染路径显示，两视口均 2 行、两行均在表单可视区内，`overflow:visible`、`overflow-wrap:anywhere`，无祖先硬裁剪；修正后回到基线。
- 限制：两行长错误在 1K/2K 使对话框内容自然增高 `16.37px`（上边固定，下边/按钮下移），修正后归零；1024×720 下由表单受控滚动吸收、对话框高度不变（滚动 29px 后两行可读）。

## 边界

- 未修改产品源码/模板/配置，未构建/重启服务，未打开其他功能页面。
- 未访问数据库/夹具/ZooKeeper/Kafka，未产生业务写；3 次 POST 均为浏览器内本地回放，后端非 GET 转发 0。
- 原始 JSON 保持探针输出原样；提交前以 `SHA256SUMS` 校验。
