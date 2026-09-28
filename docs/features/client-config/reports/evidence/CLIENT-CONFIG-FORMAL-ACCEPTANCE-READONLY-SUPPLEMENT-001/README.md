# 只读补测证据索引（脱敏）（CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001）

本目录为任务 `CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001` 的**脱敏、可追溯**证据，供 ChatGPT 从远程 Git 复审本轮只读补测使用。本目录为**当前状态**；R0~R5 索引作为**历史快照**保留在各自目录中，**未改写**。

## 内容

| 文件 | 说明 |
|---|---|
| `probeA.mjs` | AC-010 宽度腿（7 源样本跨 5 宽度）与全表数据源计数；只读 |
| `probeB.mjs` | AC-143 未固定／已固定两组初始状态的行内控件隔离序列；只读 |
| `probeC.mjs` | AC-100/098/099/106/117/102/012 的只读测量 |
| `probeD.mjs` | AC-041/090/128/132/125/138 的只读测量（草稿与客户端校验，从不提交有效表单） |
| `per-id-results.json` | 逐 ID 机读结果：原状态、现状态、定义要求、已执行只读子步骤、证据定位、实测值、判定（`COVERED`/`MISSING`/`PARTIAL`）、剩余缺口 |
| `SHA256SUMS.txt` | 仓库外原始产物（截图、结果 JSON、调试脚本、只读响应快照）的完整 SHA-256，仅哈希与文件名 |

## 通用证据约束（四个探针一致）

- **网络写拦截在打开页面之前安装**：`/api/**` 的 `GET`/`HEAD`/`OPTIONS` 放行，`POST`/`PUT`/`PATCH`/`DELETE` 一律 abort 并计数；四个脚本实测**拦截计数均为 0**（零写）。
- **只做只读操作**：导航、查询、悬停、聚焦、滚动、打开／取消弹层、填写未提交草稿、触发客户端字段校验。
- **从不**：点击启停/删除的最终确认、提交有效新增/编辑表单、执行 W1~W8、创建夹具、手工连接或写入数据库/ZooKeeper/Kafka。
- 判定仅当**定义前置、步骤、预期全部真实覆盖**时才把整条由 `BLOCKED`/`NOT_RUN` 上调为 `PASS`；证据缺口记为 `BLOCKED`（`PARTIAL`/`MISSING`），未执行记为 `NOT_RUN`，**不**因部分完成升级整条。

## 本轮结果摘要

- 上调 3 条：`CCFG-AC-041`、`CCFG-AC-100`、`CCFG-AC-143`（`BLOCKED` → `PASS`）。
- 现行统计：`PASS` **69** / `FAIL` **0** / `BLOCKED` **70** / `NOT_RUN` **15** = 154。
- 保留 `BLOCKED` 的关键理由：`010`（行高 53px vs 定义 58~64px，与已批准盒模型冲突待裁定）、`012`（含负责人目测项）、`044/098/132`（样本缺失：可选数据源仅 1、无恰好 6 源、无 >256 字符描述）、`090/102`（禁用态不可构造）、`106`（前置不满足）、`099`（去重腿）、`117/128`（需写授权）、`125/138`（长错误换行不可构造）。
- `FAIL` 仍为 0：未发现可复现的真实产品反例。

## 仓库外原始产物（未入仓）

- 截图 `shots/*.png`、原始结果 `probe*-result.json`、临时调试脚本 `dbg*.mjs`、只读响应快照 `clients.json`/`dsoptions.json` 位于执行机器临时目录（仓库外）。
- 完整 SHA-256 见 `SHA256SUMS.txt`；原始归档 `...-evidence.tar.gz`（SHA-256 `1cf178ae…`）**未被改写**、**未入仓**。
- **不**含数据库连接信息、内网主机/端口、账号口令或令牌、可识别业务机构名称、原始截图或归档内容。

## 脱敏规则

入仓内容**只**保留：用例编号、步骤判定、控件选择器与字段路径、视口、结果数值、缺口摘要、脚本哈希。
**不**包含：数据库连接信息、内网主机/端口、账号口令或令牌、可识别业务数据（如机构名称）、原始截图或原始归档内容。

## 核验

1. `per-id-results.json` 的 `counts.after`（`69/0/70/15`）与 `ACCEPTANCE.md` §1.17 状态块及 §4 状态列、`README.md` 统计一致。
2. `per-id-results.json` 的 `changed_ids`（`041/100/143`）与 `ACCEPTANCE.md` §4 相对 `bec9beb` 的实际状态格迁移逐条对齐。
3. 四个探针脚本 `network_write_interception.blocked_request_count` 为 0。

```bash
python3 - <<'PY'
import json,re,pathlib
p=pathlib.Path('docs/features/client-config/reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001/per-id-results.json')
d=json.loads(p.read_text())
acc=pathlib.Path('docs/features/client-config/ACCEPTANCE.md').read_text()
rows=re.findall(r'^\| (CCFG-AC-\d{3}) \| (PASS|FAIL|BLOCKED|NOT_RUN) \|',acc,re.M)
from collections import Counter
c=Counter(s for _,s in rows)
assert len(rows)==154, len(rows)
assert len(set(i for i,_ in rows))==154
for k,exp in {'PASS':69,'FAIL':0,'BLOCKED':70,'NOT_RUN':15}.items():
    assert c.get(k,0)==exp, (k, c.get(k,0))
for ch in d['changed_ids']:
    st=dict(rows)[ch['id']]
    assert st==ch['to'], (ch['id'],st)
assert d['network_write_interception']['blocked_request_count']==0
print('OK', dict(c))
PY
```
