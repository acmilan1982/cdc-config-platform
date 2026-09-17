# SA-024 严格几何零容差（原 AC-015）

## 1. 方法

`compare.mjs`（`implementation-001-r1` 版本）：

```js
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b) }
function strict(label, a, b) { checks++; if (!eq(a, b)) failures.push({ label, before: a, after: b }) }
```

- 阈值 0：不取整、不设容差，浮点末位差异即判失败；
- 已批准差异集未扩大：`OMIT_CLS = {cls}`（`dss-*` → `ql-*`）、
  `OMIT_OVERFLOW = {overflow-x, overflow-y}`（稳定滚动容器并入 ResultPanel body）、
  `OMIT_SPINNER = {spinnerCount}`（指示器改名，另单独断言）；
- `nullPaths()` 守卫保留：任一必需节点为 `null` 即判失败，禁止 `null === null` 静默通过；
- `SAME_ROLE=1` 时横向滚动宿主角色断言改为对称口径。

## 2. 命令

```bash
# 跨实现角色：0d676a7（旧 Feature 私有实现）vs 当前提交
node compare.mjs \
  /tmp/query-list-page-shared-component-implementation-001/before.json \
  <本轮 sfa-capture.json> \
  /tmp/query-list-page-shared-component-implementation-001/cand-before.json \
  /tmp/query-list-page-shared-component-formal-acceptance-001/cand-fa.json

# 同角色：ff9bf2b（已批准实现）vs 当前提交
SAME_ROLE=1 node compare.mjs \
  /tmp/query-list-page-shared-component-implementation-001/after.json \
  <本轮 sfa-capture.json> \
  /tmp/query-list-page-shared-component-implementation-001/cand-after.json \
  /tmp/query-list-page-shared-component-formal-acceptance-001/cand-fa.json
```

## 3. 结果

```text
跨实现角色：
{
  "checks": 263,
  "failures": 0,
  "notes": [
    "before 长短切换表头列数=7 行数 30→2",
    "after 长短切换表头列数=7 行数 30→2",
    "after 查询候选 Tooltip 最大实测宽度=480"
  ]
}
ALL STRICT CHECKS PASSED (threshold=0)
CROSS_EXIT=0

同角色：
{
  "checks": 263,
  "failures": 0,
  "notes": [ 同上 ]
}
ALL STRICT CHECKS PASSED (threshold=0)
SAMEROLE_EXIT=0
```

| 口径 | checks | failures | 退出码 |
|---|---|---|---|
| 跨实现角色 | 263 | 0 | 0 |
| 同角色 | 263 | 0 | 0 |

## 4. 覆盖范围

四视口逐值比较的字段：`titleText` / `descText` / `title` / `desc` / `header` / `queryPanel` /
`resultPanel` / `resultHeader` / `errorSlot` / `divider` / `contentCard` / `table` / `headerCells` /
`bodyCells` / `headerCols` / `refreshGroup`；`body` 几何与非 overflow 样式；`contentArea`；
横向滚动宿主语义；按钮几何与常驻指示器计数；页面壳子节点相对/绝对几何；
首载失败态（直接子节点 2、错误卡片 class、重新加载按钮几何与样式）；
长短数据切换零位移（内容区宽度、表头列、单元格矩形、按钮与刷新组矩形）；
稳定滚动条槽声明/未声明两路由；Tooltip 唯一性、定位、尺寸与文案长度；网络方法与控制台。

已批准排除项（如容器高度随行数变化）**未**被暗中当作等价断言，排除集未扩大。

```text
strict_geometry_status=PASS
strict_geometry_check_count=263
strict_geometry_failure_count=0
```
