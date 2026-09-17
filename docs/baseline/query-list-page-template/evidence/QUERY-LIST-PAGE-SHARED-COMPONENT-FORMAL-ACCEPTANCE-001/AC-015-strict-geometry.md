# AC-015 严格零容差几何比对

复用并审查实现阶段已有的严格比较方法（`compare.mjs`），阈值保持为 `0`，不做四舍五入、不设任何容差。

## 1. 判定方法

- 等值判定为 `JSON.stringify` 逐值相等；任何差异（含浮点末位）都记为失败并使进程以非零退出码结束；
- 每次断言（`strict` / `assertTrue`）都递增 `checks`；失败项记录 `label / before / after`；
- `nullPaths()` 守卫：比对前先统计两侧采集结果中的 `null` 路径，任一必需节点缺失立即判失败，禁止 `null === null` 静默通过；
- 已批准差异只在明确注释的省略集合内剔除：`cls`（`dss-*` → `ql-*` 命名迁移）、`overflow-x/y`（StableTableContainer 职责并入 ResultPanel body）、`spinnerCount`（指示器改名，另行单独断言 `1/0/1`）；
- `SAME_ROLE=1` 模式用于「两侧都是已批准实现」的比对，横向滚动宿主角色断言由单向改为对称，断言强度不降反升。

## 2. 比较范围

- 四个正式视口：`1280x800`、`1700x920`、`1920x1080`、`2560x1440`；
- 每视口严格比对：结构 / 文案 / 计算样式 / 几何共 16 个标量键（`titleText`、`descText`、`title`、`desc`、`header`、`queryPanel`、`resultPanel`、`resultHeader`、`errorSlot`、`divider`、`contentCard`、`table`、`headerCells`、`bodyCells`、`headerCols`、`refreshGroup`），body 几何与非 overflow 样式、body 矩形、`contentArea`、画面壳 `pageRoot`（矩形 / 样式 / 子节点相对与绝对几何）、三个按钮的几何与样式；
- 首载失败态：直接子节点数、错误卡片 class、`role=alert`、重新加载按钮几何与样式；
- 长短数据切换：内容区 / 内容卡 / 横向滚动宿主 `clientWidth`，表头列、表头单元格矩形、正文单元格矩形、查询/重置/刷新按钮与刷新组矩形，滚动宿主与结果卡横向几何 —— 全部严格零位移；
- 稳定滚动条槽：声明路由与未声明路由的 class 与 `scrollbar-gutter`，两条路由的 `content-area clientWidth`；
- Tooltip：同屏宿主机数量、表格探针 Tooltip 四向越界、定位方式、指针事件、文案长度、尺寸；候选下拉矩形、逐项悬停宽度上限与越界；
- 网络与控制台：请求方法集合、除注入 500 外的控制台错误。

## 3. 结果

| 比对 | 输入 | checks | failures | 退出码 |
|---|---|---|---|---|
| SAME_ROLE | 实现阶段 `ff9bf2b` 采集 vs 本次 `d1cd3b1` 采集 | **263** | **0** | 0 |
| 跨实现角色 | 设计批准点 `0d676a7` 采集 vs 本次 `d1cd3b1` 采集 | **263** | **0** | 0 |

`263 checks / 0 failures` 与实现阶段 R1 记录完全一致，无检查项减少、无关键断言被削弱。
