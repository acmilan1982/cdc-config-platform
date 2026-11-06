# CLIENT-CONFIG-DIALOG-ACCEPTANCE-005 — 证据包

任务：`CLIENT-CONFIG-DIALOG-ACCEPTANCE-005`（新增／编辑弹窗专项验收）
页面范围：仅 `/config/client`。未打开、操作或测试 `/config/data-source` 或其他功能页面。
基线：`9b1bf9f309b9a2afd635bb408b490f62546b2dff`
判定对象：`CCFG-AC-120`、`125`、`134`、`138`

## 文件

| 文件 | 内容 |
|---|---|
| `four-item-matrix.md` | 四项逐步骤矩阵与实际判定 |
| `environment-and-version.txt` | 服务 PID、端口、jar SHA256、前端来源、浏览器/视口、DB 计数 |
| `fixture-ledger.md` | 005 夹具 INSERT、合成探针、清理 DELETE 与 DML 统计 |
| `write-ledger.md` | 业务写、预期拒绝、前端零写、受控注入与回读 |
| `reference-evidence-index.md` | AC-120/134 参考页已入仓运行证据与仍适用性核对 |
| `probes/probeA-readonly.cjs` | 只读探针：按钮状态、6 步几何序列、窄视口反馈、候选与新增/编辑矩阵 |
| `probes/probeB-write.cjs` | 受控写探针：真实 40941 长错误、忙碌窗口、防重复、真实创建与回读 |
| `probes/probeC-git-audit.cjs` | 固定 Git 区间审计（AC-134 范围不变性） |
| `results/probeA-readonly.json` | 探针 A 原始结果 |
| `results/probeB-write.json` | 探针 B 最终结果（含 HTTP 状态与业务码） |
| `results/ac134-git-audit.json` | 探针 C 结果 |
| `results/ac138-precondition-search.txt` | AC-138 负责人确认前置的检索记录 |
| `sql/fixture-prepare-005.sql` | 005 合成数据源夹具（5 行，inert 连接字段） |
| `SHA256SUMS` | 本目录文件的 SHA-256 |

## 复现

```bash
cd /agent/cdc-config-platform
source ./agent-env.sh
node docs/features/client-config/reports/evidence/CLIENT-CONFIG-DIALOG-ACCEPTANCE-005/probes/probeA-readonly.cjs
# probeB creates CCFG005-OCC1 and CCFG005-NEW; delete those two synthetic rows first
# if a clean rerun is required (see fixture-ledger.md), then:
node docs/features/client-config/reports/evidence/CLIENT-CONFIG-DIALOG-ACCEPTANCE-005/probes/probeB-write.cjs
node docs/features/client-config/reports/evidence/CLIENT-CONFIG-DIALOG-ACCEPTANCE-005/probes/probeC-git-audit.cjs
```

## 网络门禁

- 探针 A：GET/HEAD/OPTIONS 放行；所有非 GET abort 并计数。实测 0。
- 探针 B：仅放行两类 `POST /api/clients`（精确合成 ID + 校验过的 dataSourceIds）；成功类延迟 5000 ms 以观察忙碌窗口。最终运行 `aborted=[]`。
- 探针 C：只读 Git/本地文件，无网络。

## 边界

- 无产品代码/测试/依赖/配置/模板改动。
- 无 DDL；夹具 SQL 与业务写分离；未写 ZooKeeper/Kafka；未连接源库；未启停服务。
- 证据已脱敏：不含数据库凭据、真实连接信息、原始业务记录或整屏截图。
