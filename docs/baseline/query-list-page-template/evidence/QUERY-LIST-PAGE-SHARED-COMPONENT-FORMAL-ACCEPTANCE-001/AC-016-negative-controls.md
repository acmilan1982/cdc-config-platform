# AC-016 负向对照：验收器必须能失败

五个临时变异全部在干净基线（`d1cd3b1`，`git status --short` 为空）上独立执行；每个变异都单独记录「变异内容 / 命中的目标断言 / 实际非零退出码」，随后**精确**还原（`git checkout -- <file>`，未使用 reset / clean / stash），以 SHA-256 与 `git status --short` 证明还原后逐字节一致，最后重跑对应正向检查获得 PASS。

任何负向变异均未提交入库。

| 编号 | 变异 | 命中断言 | 退出码 | 还原校验 | 重跑正向 |
|---|---|---|---|---|---|
| NC1 | 在 `QueryListActions.vue` 内联 `<style scoped>` 里重新写回 `.ql-btn-spinner` 规则 | 「两个组件的内联样式中不再定义 Spinner 选择器、Spinner 动画或 Spinner reduced-motion」（`expected 1 to be +0`）与「全部 frontend/src 中 Spinner 核心选择器与动画的 CSS 定义源码只有该文件一处」 | **1**（2 failed / 14 passed） | SHA-256 前后一致，`git status --short` 为空 | `shared-layer.spec.ts` 16/16，退出码 0 |
| NC2 | 把 `QueryListRefreshToolbar.vue` 的外部样式引用改指 `./query-list-spinner-copy.css` | 「两个消费者以外部 scoped stylesheet 引用同一份来源，且各自只引用一次」 | **1**（1 failed / 15 passed） | SHA-256 前后一致，`git status --short` 为空 | `shared-layer.spec.ts` 16/16，退出码 0 |
| NC3 | 浏览器运行时注入 `.ql-actions__query …{left:2.001px}` / `.ql-refresh-btn …{left:3.001px}` | 「查询 Spinner 使用公共默认偏移 2px」→ `2.001`；「刷新 Spinner 使用页面局部令牌偏移 3px」→ `3.001`；「reduced-motion 下偏移值不变」→ `2.001/3.001` | **1**（55 passed / 3 failed） | 运行时注入，无文件改动，`git status --short` 为空 | 契约探针 58/58，退出码 0 |
| NC4 | 在 `frontend/src/router/index.ts` 给未声明路由 `TopicOffset` 加上 `stableScrollbarGutter: true` | 「after: 未声明路由无 is-stable-gutter 类」；「after: 未声明路由 scrollbar-gutter=auto」→ `stable` | **1**（263 checks / 2 failures） | SHA-256 前后一致，`git status --short` 为空 | 严格比对 263/0，退出码 0 |
| NC4b | 在 `DataSourceRunStatePage.vue` 额外渲染第二个 `QueryListTooltipHost` | 「after: 同屏 Tooltip 宿主数恒 ≤ 1」；「after: 表格探针 Tooltip 出现且唯一」 | **1**（263 checks / 2 failures） | SHA-256 前后一致，`git status --short` 为空 | 严格比对 263/0，退出码 0 |

## 1. 还原后的文件哈希

| 文件 | SHA-256（前 = 后） |
|---|---|
| `frontend/src/components/query-list/QueryListActions.vue` | `a49a447fb5e9e48fd7e00052daf6f27bc5db19ef9fdf7ca4f11335d54143413d` |
| `frontend/src/components/query-list/QueryListRefreshToolbar.vue` | `0e096f8798e39b8ddb242deb700d48f4c73e960eaa0fdef888f07fcd84831021` |
| `frontend/src/router/index.ts` | `b96cf2479515863b58ae553413e07f2c0e82ccc540b5b23dea6828152800f5cf` |
| `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue` | `bfc96d293335137b971be81b91d2751b601240b633566f71b87106f3b44afa98` |

## 2. NC3 的非零容差含义

注入量为 `+0.001px`，小于任何像素级肉眼阈值，仍被严格判定为失败并返回非零退出码 —— 证明几何判定阈值确实为 `0`，不存在「非零容差掩盖差异」。

## 3. 还原完整性

全部变异均通过逐文件 `git checkout --` 精确还原，未触碰其它文件、未使用任何放宽性 Git 操作。第 1 节表格中的哈希为还原后重新计算值，与变异前记录值逐字符相同；每次还原后 `git status --short` 均为空。
