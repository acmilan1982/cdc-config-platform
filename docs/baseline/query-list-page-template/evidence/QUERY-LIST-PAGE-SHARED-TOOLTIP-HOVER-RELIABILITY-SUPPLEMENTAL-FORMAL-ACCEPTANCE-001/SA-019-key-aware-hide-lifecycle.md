# SA-019 key 感知关闭与生命周期

## 1. 单元层

```bash
cd ...-correction-001/frontend
npx vitest run src/composables/query-list/useQueryListTooltip.spec.ts   # 41 passed (41), exit 0
npx vitest run src/views/data-source-run-state                        # 9 files / 230 passed, exit 0
```

### 1.1 控制器按 key 关闭（`useQueryListTooltip.spec.ts`）

```text
✓ hide(当前显示 key) 关闭当前目标
✓ hide(当前等待 key) 取消延迟等待
✓ hide(过期 key) 不取消新 key 刚建立的等待
✓ hide(过期 key) 不关闭新 key 的当前目标，也不误清其 ARIA 关联
✓ hide()（无参）仍然无条件取消等待并关闭当前目标
✓ 全局关闭（scroll / resize / visibilitychange）仍然无条件生效，与 key 无关
✓ destroy 在即时目标与按 key 关闭路径下同样清空并进入终止态
✓ 回归：320ms 连续停留内离开仍取消（缺陷机制本身保留为公共默认语义）
```

### 1.2 `aria-describedby` 仅增删自身 token

```text
✓ 目标成为 current 时追加自身 hostId token
✓ 追加不改写既有 token，顺序为「原有 token + hostId」
✓ 按 ASCII 空白拆分并去重，自身 token 不重复追加
✓ 切换目标：先清除旧元素的自身 token，再关联新元素
✓ 只移除自身 token；清空后删除属性（不遗留空 aria-describedby）
✓ 延迟窗内取消（未成为 current）不建立关联
✓ destroy 清除延迟、移除自身关联并进入终止态
✓ destroy 在延迟窗内同样清空待揭示状态
```

### 1.3 表格委托与稳定 key（`DataSourceSnapshotTable.spec.ts`，36/36）

```text
✓ 快照状态显式传 delayMs:0（小命中区同步成为当前目标，不依赖 320ms 连续停留）
✓ 探针端与源库不传 delayMs：保持公共默认 320ms，不得成为即时
✓ 三类触发器 mouseenter 与 mouseleave 使用同一稳定 key，离开按该 key 精确关闭
✓ 多行扫描：每行离开只带自己的 key，旧行遗留的 leave 不会关掉新行目标
✓ records 替换仍走无参全局关闭（与 key 无关，历史行为不变）
✓ 状态命中区未被放大：触发器仍是标签外包的 inline-block span，单元格/列宽/标签外观字面量不变
```

## 2. 真实浏览器层

`browser-verify.mjs`（CDP 真实指针，未调用控制器）：

```bash
node browser-verify.mjs http://127.0.0.1:5173 <out.json> 1920 1080
# 1920x1080: PASS (30/30)  exit=0
node browser-verify.mjs http://127.0.0.1:5173 <out.json> 1280  800
# 1280x800:  PASS (31/31)  exit=0   （1280 视口表格横向溢出，额外覆盖横向滚动关闭）
```

通过项（节选）：

```text
PASS  慢速进入状态背景框：Tooltip 显示
PASS  状态 Tooltip 内容 = 原始状态：<SNAPSHOT_*>
PASS  状态触发元素持有自身 aria-describedby token
PASS  离开后 Tooltip 关闭、宿主归零、aria 关联清除
PASS  快速横扫 ≥10 行状态列：每个新进入的目标都成为当前目标（未被旧行 leave 取消）
PASS  横扫全程未出现第二宿主
PASS  两行快速来回 20 次（40 次进入）无随机不显示
PASS  查询/记录替换时旧 Tooltip 正常关闭
PASS  窗口 resize 关闭 Tooltip
PASS  表格容器滚动（真实滚轮）关闭 Tooltip
PASS  页面滚动关闭 Tooltip
PASS  横向滚动关闭 Tooltip           （1280x800 视口）
PASS  结束状态：无残留宿主与 aria 关联
```

## 3. 覆盖矩阵

| 要求 | 单元 | 浏览器 |
|---|---|---|
| `hide(当前等待 key)` 取消该等待 | ✓ | ✓（扫行/往返中旧 leave 不取消新目标） |
| `hide(当前显示 key)` 关闭该目标并清理自身 ARIA token | ✓ | ✓（离开后宿主归零、aria 清除） |
| `hide(过期 key)` 不取消新等待 | ✓ | ✓（横扫全程无被误取消） |
| `hide(过期 key)` 不关闭新当前目标、不清新目标 ARIA | ✓ | ✓ |
| `hide()` 仍无条件关闭 | ✓ | ✓ |
| 快速 A→B：A 的旧 mouseleave 不关 B | ✓ | ✓（往返 80 次进入全成功） |
| scroll / 横向滚动 / resize / visibilitychange 关闭 | ✓ | ✓ |
| 记录整体替换关闭 | ✓ | ✓ |
| 组件卸载清理 | ✓ | ✓（结束无残留） |
| `aria-describedby` 只增删自身 hostId、保留既有 token | ✓ | ✓ |

```text
stale_mouseleave_protection_status=PASS
tooltip_aria_describedby_status=PASS
```
