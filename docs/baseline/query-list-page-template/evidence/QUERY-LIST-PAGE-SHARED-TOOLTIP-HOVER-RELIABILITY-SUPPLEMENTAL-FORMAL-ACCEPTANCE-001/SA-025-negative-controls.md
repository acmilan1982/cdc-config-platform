# SA-025 负向控制（原 AC-016 重放 + 本轮新增）

## 1. 变异环境与隔离约束

- 变异只发生在 `/tmp/query-list-page-shared-tooltip-hover-reliability-supplemental-fa-001/negctl-frontend/`；
- 该副本的 `src/` 与 `package.json` / `package-lock.json` / `vite.config.ts` / `tsconfig.json` / `index.html`
  经 `diff -r` 确认与验收工作区**逐字节相同**，`node_modules` 为指向工作区的符号链接；
- 隔离服务：`npx vite --host 127.0.0.1 --port 5273 --strictPort`（PID 59862 / 启动器 59848）；
- 变异沿精确字面量替换实现，要求 `find` 在目标文件中**恰好出现 1 次**，否则拒绝执行；
- 每次变异记录 SHA-256 三态；还原后与变异前逐字节相同；
- 全程验收工作区 `git status --short` 为空；变异**未**进入暂存区 / 提交 / 证据源文件。

运行期结束后再次确认：

```bash
diff -r --exclude=node_modules --exclude=dist \
  /agent/...-correction-001/frontend/src \
  /tmp/...-supplemental-fa-001/negctl-frontend/src
# (无输出) —— SOURCE_BYTE_IDENTICAL=YES
git -C /agent/...-correction-001 status --short
# (空)
```

## 2. 原 AC-016 负向控制重放

### NC1 — `QueryListActions.vue` 内联样式重新定义 Spinner 选择器

```text
before    a49a447fb5e9e48fd7e00052daf6f27bc5db19ef9fdf7ca4f11335d54143413d
mutated   69571d912cf92cc30e7b8b60fac68e4bf98f27da040557f4d45c29c078ac4604
restored  a49a447fb5e9e48fd7e00052daf6f27bc5db19ef9fdf7ca4f11335d54143413d   ← 与 before 相同
```

```text
FAIL shared-layer.spec.ts > 两个组件的内联样式中不再定义 Spinner 选择器、Spinner 动画或 Spinner reduced-motion
FAIL shared-layer.spec.ts > 全部 frontend/src 中 Spinner 核心选择器与动画的 CSS 定义源码只有该文件一处
Test Files  1 failed (1)   Tests  2 failed | 14 passed (16)   EXIT=1
```

前向复查（还原后）：`Tests 16 passed (16)`，EXIT=0。

### NC2 — `QueryListRefreshToolbar.vue` 外部样式改指另一份文件

```text
before   0e096f8798e39b8ddb242deb700d48f4c73e960eaa0fdef888f07fcd84831021
mutated  01f071e6be57dc956f2450e1a95453deeb6fc1929877994c6821cca2f0cf14da
restored 0e096f8798e39b8ddb242deb700d48f4c73e960eaa0fdef888f07fcd84831021   ← 与 before 相同
```

```text
FAIL shared-layer.spec.ts > 两个消费者以外部 scoped stylesheet 引用同一份来源，且各自只引用一次
Test Files  1 failed (1)   Tests  1 failed | 15 passed (16)   EXIT=1
```

前向复查：`Tests 16 passed (16)`，EXIT=0。

### NC3 — 运行时给 `.ql-btn-spinner` 注入 `left + 0.001px`

无文件变更（运行期注入）。

```text
{"total":58,"passed":55,"failed":3}   EXIT=1
FAIL 查询 Spinner 使用公共默认偏移 2px                        => 2.001
FAIL 刷新 Spinner 使用页面局部令牌偏移 3px                    => 3.001
FAIL reduced-motion 下偏移值不变（2px / 3px）                 => "2.001/3.001"
```

前向复查（不注入）：`{"total":58,"passed":58,"failed":0}`，EXIT=0。

### NC4 — `router/index.ts` 给未声明路由加 `stableScrollbarGutter: true`

```text
before   b96cf2479515863b58ae553413e07f2c0e82ccc540b5b23dea6828152800f5cf
mutated  807f5aea81d9549fc01fdcbee113bd2ec47b68caca2bcb5941d5e07ea4b9cba9
restored b96cf2479515863b58ae553413e07f2c0e82ccc540b5b23dea6828152800f5cf   ← 与 before 相同
```

```text
{"checks":263,"failures":2}   EXIT=1
{"label":"after: 未声明路由无 is-stable-gutter 类","detail":"content-area is-stable-gutter"}
{"label":"after: 未声明路由 scrollbar-gutter=auto","detail":"stable"}
```

前向复查：`{"checks":263,"failures":0}` + `ALL STRICT CHECKS PASSED (threshold=0)`，EXIT=0。

### NC4b — 运行时同时出现两个 Tooltip 宿主

无文件变更（运行期注入；克隆真实宿主并在其消失时同步移除，模拟"同屏双宿主"缺陷）。

```text
probe.count=2  source.count=2  afterLeave.count=0
{"checks":263,"failures":2}   EXIT=1
{"label":"after: 同屏 Tooltip 宿主数恒 ≤ 1","detail":"[2,2,2]"}
{"label":"after: 表格探针 Tooltip 出现且唯一","detail":2}
```

前向复查（不注入）：`{"checks":263,"failures":0}`，EXIT=0。

## 3. 本轮新增修正专项负向控制

### NCN1 — 移除表格"快照状态"的 `delayMs: 0`

```text
before   90863a3419c275da1c1c82084c26a9b8bac786fd97564c0dc695ff34ad09061e
mutated  b6287582bc1332106dd15b866f05f7bdf4aa4b021a44dd9598f055d71224cea4
restored 90863a3419c275da1c1c82084c26a9b8bac786fd97564c0dc695ff34ad09061e   ← 与 before 相同
```

单元：

```text
FAIL DataSourceSnapshotTable.spec.ts > 快照状态显式传 delayMs:0（小命中区同步成为当前目标，不依赖 320ms 连续停留）
Tests  1 failed | 35 passed (36)   EXIT=1
```

浏览器（`sa018.mjs` 1920x1080）：

```text
1920x1080: FAIL 4/10  fastEntries=0/40 sweepRows=24 tripEntries=160 maxHosts=0   EXIT=1
FAIL  首载：快速直入 20 次全部成功（0/20）
FAIL  查询后：快速直入 20 次全部成功（0/20）
FAIL  首载：快速扫行全部成为当前目标（扫过 12 行 / 可见 20 行，成功 0）
FAIL  查询后：快速扫行全部成为当前目标（扫过 12 行，成功 0）
FAIL  首载：相邻两行往返 40 次（80 次进入）全部成功
FAIL  查询后：相邻两行往返 40 次（80 次进入）全部成功
```

前向复查：单元 `36 passed (36)` EXIT=0；浏览器 `1920x1080: PASS 10/10  fastEntries=40/40 maxHosts=1` EXIT=0。

### NCN2 — 把 `hide(key)` 改回无条件关闭

```text
before   221e15cfdd8cf630dc6cd6b6fadf75dca7b84c4599223e7e190429f89bc71535
mutated  60dc23fa07eeaa93168626f2b291d9f0ae2e9e7bfd9a7bb8cec821e1f956f4f8
restored 221e15cfdd8cf630dc6cd6b6fadf75dca7b84c4599223e7e190429f89bc71535   ← 与 before 相同
```

```text
FAIL useQueryListTooltip.spec.ts > hide(过期 key) 不取消新 key 刚建立的等待
FAIL useQueryListTooltip.spec.ts > hide(过期 key) 不关闭新 key 的当前目标，也不误清其 ARIA 关联
Tests  2 failed | 39 passed (41)   EXIT=1
```

恰好命中"过期 key 保护"这两项断言，未波及其他用例。

前向复查：`Tests 41 passed (41)`，EXIT=0。

### NCN3 — 给探针端触发器加 `delayMs: 0`

```text
before   90863a3419c275da1c1c82084c26a9b8bac786fd97564c0dc695ff34ad09061e
mutated  b787ad538340b9056b85145df2033f85ad0eac72b8972f3390d0f4fb1b511842
restored 90863a3419c275da1c1c82084c26a9b8bac786fd97564c0dc695ff34ad09061e   ← 与 before 相同
```

单元：

```text
FAIL DataSourceSnapshotTable.spec.ts > 探针端与源库不传 delayMs：保持公共默认 320ms，不得成为即时
Tests  1 failed | 35 passed (36)   EXIT=1
```

浏览器（`browser-verify.mjs` 1920x1080）：

```text
1920x1080: FAIL (29/30)   EXIT=1
FAIL  探针端仍为公共默认 320ms：快速穿过不显示、停留后显示
```

恰好命中"公共默认冻结"断言，其余 29 项不受影响。

前向复查：单元 `36 passed (36)` EXIT=0；浏览器 `1920x1080: PASS (30/30)` EXIT=0。

### NCN4 — 运行时给 `.content-area` 注入 `translateX(0.001px)`

无文件变更（运行期注入）。

```text
{"checks":263,"failures":77}   EXIT=1
```

0.001px 位移被零容差比较器判为 77 项失败（形如 `title.rect.x 276 → 276.0010070800781`），
证明比较器不取整、不设容差。

前向复查（不注入）：`{"checks":263,"failures":0}` + `ALL STRICT CHECKS PASSED (threshold=0)`，EXIT=0。

## 4. 汇总

```text
original_negative_control_status=PASS（NC1 / NC2 / NC3 / NC4 / NC4b 全部复现，退出码均非 0）
correction_negative_control_status=PASS（NCN1 / NCN2 / NCN3 / NCN4 全部复现，退出码均非 0）
negative_control_restore_status=ALL_BYTE_IDENTICAL
```

| 编号 | 变异类型 | 目标断言失败 | 退出码 | 还原 |
|---|---|---|---|---|
| NC1 | 文件 | 2 | 1 | 逐字节 |
| NC2 | 文件 | 1 | 1 | 逐字节 |
| NC3 | 运行期 | 3 | 1 | 不适用（无文件变更） |
| NC4 | 文件 | 2 | 1 | 逐字节 |
| NC4b | 运行期 | 2 | 1 | 不适用（无文件变更） |
| NCN1 | 文件 | 1 单元 + 6 浏览器 | 1 | 逐字节 |
| NCN2 | 文件 | 2 | 1 | 逐字节 |
| NCN3 | 文件 | 1 单元 + 1 浏览器 | 1 | 逐字节 |
| NCN4 | 运行期 | 77 | 1 | 不适用（无文件变更） |

所有变异均**未**写入验收工作区、**未**进入暂存区或提交、**未**污染证据源文件。
