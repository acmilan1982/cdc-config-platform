# 只读补测 R1 证据索引（脱敏）（CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001-R1）

本目录为任务 `CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001-R1` 的**脱敏、可追溯**证据，供 ChatGPT 从远程 Git 复审本轮补测使用。

本任务的来源是远程对 `b81284fd8a46b9c1bc99792d202456971e1ce50d` 的复审结论 `CHANGES_REQUIRED`：提交范围与 154 条验收定义保护成立，`CCFG-AC-041` 的多状态观察可保留，但 `CCFG-AC-100` 与 `CCFG-AC-143` 的**现有证据缺少定义要求的关键操作**。本目录即为**补齐这两个缺口**的逐步骤证据。上一轮（`...-001`）目录作为**历史证据保留，未改写**。

## 内容

| 文件 | 说明 |
|---|---|
| `probeE.mjs` | `CCFG-AC-100`：两视口（1440×900 / 1920×1080）逐行入口普查 + 三态菜单只读 + **真实键盘 Tab 导航**至三类代表行的三点入口；只读 |
| `probeF.mjs` | `CCFG-AC-143`：未固定 / 已固定两种初始状态各一条完整逐步时间线，**每个原子动作之后立即快照**；另以渲染“停用/删除”的行补 `停用` 分支；只读 |
| `per-id-results.json` | 逐 ID 机读结果：本轮复审指令、写拦截统计、改动/复核 ID、逐步骤观测（含两视口完整 Tab 落点序列与 57 步固定 ID 时间线） |
| `SHA256SUMS.txt` | 仓库外原始产物（截图、原始结果 JSON）的完整 SHA-256，仅哈希与文件名 |

## 上轮证据缺口如何补上

- **`CCFG-AC-100`**：上轮 `probeC.mjs` 只读取三点入口的 `tabindex` / `aria-label` / 图标结构，**没有按 Tab 键聚焦并观察焦点**。本轮 `probeE.mjs` 从 `BODY`（无焦点）起按真实 Tab 键逐步前进，记录**每一次落点**（键序号 / 元素 / 所在行 / 是否目标入口 / 可访问名称 / `:focus-visible`），直到 `FG_ACTIVE='1'`、`'0'`、异常三类代表行的三点入口逐一获得焦点；并保留三态行菜单只读检查。`locator.focus()`、只看 `tabindex="0"` 或代码推断均未被使用。
- **`CCFG-AC-143`**：上轮 `probeB.mjs` 在整组“更多→各菜单项→确认取消”**结束后**才读取一次固定行，无法排除中间操作发生短暂错误切换。本轮 `probeF.mjs` 对**每个原子动作之后立即**取独立快照——三点触发器打开/关闭、“启用/停用”条目打开确认窗/取消、“删除”条目打开确认窗/取消、`+N` 打开完整清单/关闭、数据源标签 Tooltip 显示/离开、探针 ID 经真实键盘 Enter 与 Space 打开/关闭编辑弹窗；“点击后确认窗打开”与“取消后”各有独立快照。未固定与已固定两种初始状态各一条完整逐步时间线。

## 通用证据约束（两个探针一致）

- **网络写拦截在打开页面之前安装**：`/api/**` 的 `GET`/`HEAD`/`OPTIONS` 放行，`POST`/`PUT`/`PATCH`/`DELETE` 一律 abort 并计数；两个脚本实测**拦截计数均为 0**（零写）。
- **只做只读操作**：导航、查询、悬停、聚焦、滚动、打开／取消弹层、真实按键触发客户端弹窗。
- **从不**：点击启停/删除的最终确认、提交有效新增/编辑表单、执行 W1~W8、创建夹具、手工连接或写入数据库/ZooKeeper/Kafka。
- 判定仅当**定义前置、步骤、预期全部真实覆盖**时才维持 `PASS`；缺项则下调 `BLOCKED`；发现真实产品反例则按定义 `FAIL` 并停线报告。

## 本轮结果摘要

- 两条缺口均以真实运行观察补齐，**均未发现产品反例**，故 `CCFG-AC-100`、`CCFG-AC-143` 维持 `PASS`。
- **本轮不改变任何状态格**：`changed_ids` 为空（上轮已由 `BLOCKED` 上调为 `PASS`）。
- 现行统计保持：`PASS` **69** / `FAIL` **0** / `BLOCKED` **70** / `NOT_RUN` **15** = 154。
- `CCFG-AC-041` 及所有其他历史状态不变。

## 仓库外原始产物（未入仓）

- 截图 `shots/*.png`（20 张，含两视口 Tab 焦点、逐动作确认窗/弹层/编辑弹窗现场）、原始结果 `probeE-result.json` / `probeF-result.json` 位于执行机器临时目录（仓库外）。
- 完整 SHA-256 见 `SHA256SUMS.txt`；原始归档 `CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001-R1-evidence.tar.gz`（SHA-256 `4e00afb0…`，2 886 352 字节）**未入仓**，需随交付一并交给项目负责人。
- **不**含数据库连接信息、内网主机/端口、账号口令或令牌、原始截图或归档内容。

## 脱敏规则

入仓内容**只**保留：用例编号、步骤判定、控件选择器与字段路径、视口、按键/步骤序号、结果数值、缺口摘要、脚本与外部产物哈希。
**不**包含：数据库连接信息、内网主机/端口、账号口令或令牌、原始截图或原始归档内容。

## 核验

1. `per-id-results.json` 的 `counts.after`（`69/0/70/15`，`total=154`）与 `ACCEPTANCE.md` §1.18 状态块及 §4 状态列、`README.md` 统计一致。
2. `changed_ids` 为空、`reverified_ids` 为 `["CCFG-AC-100","CCFG-AC-143"]`，与 `ACCEPTANCE.md` §4 相对 `b81284f` 无状态格迁移一致。
3. 两个探针脚本的写拦截计数为 0；`CCFG-AC-143` 时间线为**逐步骤**（57 步、4 个 scope），非聚合布尔。

```bash
python3 - <<'PY'
import json,re,pathlib
base=pathlib.Path('docs/features/client-config/reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001-R1')
d=json.loads((base/'per-id-results.json').read_text())
acc=pathlib.Path('docs/features/client-config/ACCEPTANCE.md').read_text()
rows=re.findall(r'^\| (CCFG-AC-\d{3}) \| (PASS|FAIL|BLOCKED|NOT_RUN) \|',acc,re.M)
from collections import Counter
c=Counter(s for _,s in rows)
assert len(rows)==154 and len(set(i for i,_ in rows))==154, len(rows)
for k,exp in {'PASS':69,'FAIL':0,'BLOCKED':70,'NOT_RUN':15}.items():
    assert c.get(k,0)==exp,(k,c.get(k,0))
assert d['counts']['after']['total']==154
for k,exp in {'PASS':69,'FAIL':0,'BLOCKED':70,'NOT_RUN':15}.items():
    assert d['counts']['after'].get(k,0)==exp,(k,d['counts']['after'].get(k,0))
assert d['changed_ids']==[], d['changed_ids']
assert d['reverified_ids']==['CCFG-AC-100','CCFG-AC-143']
assert d['network_write_interception']['blocked_request_count']==0
tl=d['per_id'][1]['observed']['per_action_timeline']
assert len(tl)==57 and len({s['scope'] for s in tl})==4, len(tl)
assert all(s['fixedProbeId'] is None for s in tl if s['scope'] in ('unfixed','secondary-unfixed'))
assert all(s['fixedProbeId']=='CCFG-AC-R1-ON' for s in tl if s['scope']=='fixed')
arr=d['per_id'][0]['observed']['probeE_1440x900']['realTabTraversal']['arrivals']
assert len(arr)==3 and all(a['focusVisible'] for a in arr.values())
print('OK', dict(c))
PY
```
