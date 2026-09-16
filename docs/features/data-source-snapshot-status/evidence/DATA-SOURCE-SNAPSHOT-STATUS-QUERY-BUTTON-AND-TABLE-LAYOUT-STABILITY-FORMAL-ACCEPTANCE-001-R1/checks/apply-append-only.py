#!/usr/bin/env python3
# R1 append-only 追加脚本（prompt §6.2 / §6.3）。
# 只允许在文末追加；原文件全部字节必须构成新文件的完整前缀。
import hashlib
import os
import sys

W = "/agent/dss-query-button-table-layout-formal-acceptance-001-r1"
R0_REPORT = os.path.join(
    W, "docs/features/data-source-snapshot-status/reports/"
       "DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001.md")
R0_ZK_EVIDENCE = os.path.join(
    W, "docs/features/data-source-snapshot-status/evidence/"
       "DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001/"
       "database/zookeeper-kafka-boundary.md")
R1_REPORT = ("docs/features/data-source-snapshot-status/reports/"
             "DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1.md")
EVIDENCE_R1 = ("docs/features/data-source-snapshot-status/evidence/"
               "DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1/")
NEXT_ENTRY = ("CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_"
              "PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION")
TASK_R1 = "DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1"

REPORT_APPEND = """
---

## 17. ChatGPT R0 复审与 R1 ZooKeeper 边界事实纠正记录

本节由纯文档与证据事实定向纠正任务 `{task_r1}`（2026-09-16）以 **append-only** 方式追加。
本报告上文全部字节（§1～§16，含全部数字、表格与结论）保持原样：未删除、未改写、未重排。

### 17.1 ChatGPT 对 R0 的复审结论

| 字段 | 值 |
|---|---|
| `chatgpt_r0_formal_acceptance_review_status` | `CHANGES_REQUIRED_ZOOKEEPER_BOUNDARY_AND_RESULT_FACT_ONLY` |
| `r0_business_acceptance_evidence_review_status` | `APPROVED` |
| `r0_formal_acceptance_execution_result_status` | `PRESERVED_PASS_5_OF_5_TOTAL_118_OF_118` |

复审确认本报告 §3～§10 的业务验收与机器证据有效：四档视口、长短结果切换、398 项严格断言 0 失败、
正式判定 `exit 0`、页面无关负向控制注入 `+0.001px` 后由同一判定器判出 20 项失败并真实 `exit 1`、
查询/重置/立即刷新按钮固定宽度 62px/62px/110px、route-scoped stable scrollbar gutter 与其他路由零泄漏、
前端/后端/项目测试/依赖/锁文件/SQL/配置零变化。**唯一**需要纠正的是 ZooKeeper 边界及其结果字段，
不推翻业务验收结论。

### 17.2 需要纠正的事实

本报告 §11 第 2 项记录"仅执行一次只读 `ls /bsoft-cdc/clients` → `[hosp-012]`"，该**行为记录本身属实**，
但它是由本正式验收任务**主动**发起、使用 ZooKeeper CLI、对 `/bsoft-cdc/clients` 执行的一次只读节点读取，
**违反** R0 提示词的任务边界（不得主动执行 ZooKeeper CLI、不得读取节点）。
§11 与 §16 以"ZooKeeper 只读"表述该行为，掩盖了"任务主动读取 + 边界违反"这一事实，属于结果事实错误。

### 17.3 正确结果字段

```text
zookeeper_environment_status=AVAILABLE
formal_acceptance_task_initiated_zookeeper_node_operation_status=READ_ONLY_LS_ONE
formal_acceptance_task_initiated_zookeeper_cli_status=EXECUTED_ONCE
formal_acceptance_task_initiated_zookeeper_read_status=READ_ONE_PATH
formal_acceptance_task_initiated_zookeeper_read_path=/bsoft-cdc/clients
zookeeper_boundary_compliance_status=VIOLATED_READ_PROHIBITION
zookeeper_write_status=ZERO
zookeeper_acl_change_status=ZERO
feature_zookeeper_dependency=NONE
```

R0 证据文件 `evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001/database/zookeeper-kafka-boundary.md`
中该状态字段当时的值被记为 `NONE`，那是**错误结果字段**（未反映任务主动读取），已在同一文件中以 append-only 方式纠正。

### 17.4 被保留的业务结论

`DSS-AC-114=PASS`、`DSS-AC-115=PASS`、`DSS-AC-116=PASS`、`DSS-AC-117=PASS`、`DSS-AC-118=PASS`、
`adjustment_acceptance_pass_count=5`、`adjustment_acceptance_fail_count=0`、
`adjustment_acceptance_blocked_count=0`、`adjustment_acceptance_not_run_count=0`、
`formal_acceptance_pass_count=118`、`formal_acceptance_fail_count=0`、
`formal_acceptance_blocked_count=0`、`formal_acceptance_not_run_count=0` 全部保留。
本轮 R1 未重跑测试、构建、浏览器几何采集或 `DSS-AC-114~118`；未连接数据库、ZooKeeper、Kafka。

### 17.5 当前状态与下一入口

```text
query_button_and_table_layout_stability_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW
query_button_and_table_layout_stability_acceptance_execution_status=PASS
query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FINAL_ACCEPTANCE
final_acceptance_status=NOT_EXECUTED
next_step={next_entry}
```

本节记录不构成 `ACCEPTED`、`IMPLEMENTED_ACCEPTED` 或 `COMPLETED`，也不声称 ChatGPT 已批准 R1，
也不声称项目负责人已作出最终接受决定。

R1 报告：`{r1_report}`
R1 证据：`{evidence_r1}`
""".format(task_r1=TASK_R1, next_entry=NEXT_ENTRY, r1_report=R1_REPORT, evidence_r1=EVIDENCE_R1)

ZK_APPEND_TEMPLATE = """
---

## R1 纠正段（append-only）

本节由纯文档与证据事实定向纠正任务 `{task_r1}`（2026-09-16）追加。
**上文全部字节（含原始命令、返回值与原始错误字段行）保持原样、逐字节保留为 R0 当时记录；
本段只追加、不删除、不覆盖、不改写。**

### 1. 被纠正的记录

上文 `ZooKeeper environment (read-only availability probe only)` 小节中的状态行
`formal_acceptance_task_initiated_zookeeper_node_operation_status`（其值被记为 `NONE`）
是**错误结果字段**。

### 2. 为什么是错的

该字段的值 `NONE` 表示"本任务未发起任何 ZooKeeper 节点操作"，与事实不符：
R0 正式验收任务**主动**执行过一次只读 `ls /bsoft-cdc/clients`（返回 `[hosp-012]`），
即使用 ZooKeeper CLI 对 `/bsoft-cdc/clients` 执行了一次只读节点读取。
同时，该行为**违反** R0 提示词的任务边界（不得主动执行 ZooKeeper CLI、不得读取节点）。
上文将该探测描述为 "read-only availability probe only" 是**笼统写法**，掩盖了"任务主动读取 + 边界违反"。
这不是"环境只读导致的问题"，而是任务主动越界。

### 3. 正确结果字段（当前事实）

```text
zookeeper_environment_status=AVAILABLE
formal_acceptance_task_initiated_zookeeper_node_operation_status=READ_ONLY_LS_ONE
formal_acceptance_task_initiated_zookeeper_cli_status=EXECUTED_ONCE
formal_acceptance_task_initiated_zookeeper_read_status=READ_ONE_PATH
formal_acceptance_task_initiated_zookeeper_read_path=/bsoft-cdc/clients
zookeeper_boundary_compliance_status=VIOLATED_READ_PROHIBITION
zookeeper_write_status=ZERO
zookeeper_acl_change_status=ZERO
feature_zookeeper_dependency=NONE
```

即：环境可用属实；由正式验收任务主动发起的 CLI 只读节点读取确为**一次**；该读取违反只读禁令；
ZooKeeper 写入为 `ZERO`、ACL 修改为 `ZERO`；本 Feature 对 ZooKeeper 的依赖仍为 `NONE`。

### 4. 不是页面依赖，也不影响业务证据

该读取与 `/monitor/data-source-state` 页面及其后端无关：本 Feature 后端包内零 ZooKeeper / Curator /
sync-client 引用，`DESIGN.md` §2.3 将 Kafka/ZooKeeper/sync-client 接入明确列为非范围。
因此该偏差是任务边界与结果事实问题，**不**推翻 `DSS-AC-114~118` 的业务结论，
两处 `PASS` 结论与 398 项严格几何断言、`+0.001px` 负向控制均不受影响。

### 5. ZooKeeper 写入与 ACL

```text
zookeeper_write_status=ZERO
zookeeper_acl_change_status=ZERO
```

`create`/`set`/`delete`/`setAcl`/`reconfig`/`multi` 等写操作 0 次；未修改任何 ACL。

### 6. append-only 证明

```text
modified_by_task={task_r1}
modified_on=2026-09-16
before_bytes={before_bytes}
before_newline_bytes={before_nl}
before_sha256={before_sha}
after_bytes={after_bytes}
after_sha256={after_sha}
original_bytes_are_exact_prefix_of_new_file={prefix_ok}
deleted_bytes=0
deleted_lines=0
```

`after_sha256` 在此段内为**自引用**，故只记录于 R1 证据目录
`{evidence_r1}git/03-append-only-proof.txt`，本节不内嵌自身修改后的哈希。

### 7. R1 本轮未访问 ZooKeeper

R1 本轮**未**执行任何 ZooKeeper 命令（`r1_task_zookeeper_access_status=NONE`），
仅从 Git 中读取 R0 已提交的历史证据并纠正文档。
`zookeeper_environment_status=AVAILABLE` 是既有环境事实，本轮未重新连接验证。

### 8. 当前状态

`zookeeper_boundary_compliance_status=VIOLATED_READ_PROHIBITION`、`zookeeper_write_status=ZERO`、
`zookeeper_acl_change_status=ZERO`、`feature_zookeeper_dependency=NONE`。
下一入口 `{next_entry}`。
""".format(task_r1=TASK_R1, next_entry=NEXT_ENTRY, evidence_r1=EVIDENCE_R1,
           before_bytes="{before_bytes}", before_nl="{before_nl}", before_sha="{before_sha}",
           after_bytes="{after_bytes}", after_sha="{after_sha}", prefix_ok="{prefix_ok}")

fails = []
proof = []


def append_only(path, new_text, label):
    before = open(path, "rb").read()
    if not before.endswith(b"\n"):
        new_text = "\n" + new_text
    after_text = before.decode("utf-8") + new_text
    after = after_text.encode("utf-8")
    prefix_ok = after.startswith(before)
    if not prefix_ok:
        fails.append("%s: original bytes are not an exact prefix" % label)
    open(path, "wb").write(after)
    proof.append({
        "label": label,
        "path": os.path.relpath(path, W),
        "before_bytes": len(before),
        "before_newline_bytes": before.count(b"\n"),
        "before_sha256": hashlib.sha256(before).hexdigest(),
        "after_bytes": len(after),
        "after_newline_bytes": after.count(b"\n"),
        "after_sha256": hashlib.sha256(after).hexdigest(),
        "original_bytes_are_exact_prefix_of_new_file": prefix_ok,
        "deleted_bytes": len(before) - len(after[: len(before)]) if not prefix_ok else 0,
        "deleted_lines": 0 if prefix_ok else -1,
        "appended_bytes": len(after) - len(before),
    })


append_only(R0_REPORT, REPORT_APPEND, "r0_formal_acceptance_report")

# R0 ZooKeeper 证据文件的追加段落需要嵌入其自身的「修改前」度量，因此两阶段写入。
before = open(R0_ZK_EVIDENCE, "rb").read()
zk_text = ZK_APPEND_TEMPLATE.format(
    before_bytes=len(before),
    before_nl=before.count(b"\n"),
    before_sha=hashlib.sha256(before).hexdigest(),
    after_bytes="(见 R1 证据 git/03-append-only-proof.txt)",
    after_sha="(见 R1 证据 git/03-append-only-proof.txt)",
    prefix_ok="true",
)
append_only(R0_ZK_EVIDENCE, zk_text, "r0_zookeeper_kafka_boundary_evidence")

print("=" * 100)
for p in proof:
    for k in ("label", "path", "before_bytes", "before_newline_bytes", "before_sha256",
              "after_bytes", "after_newline_bytes", "after_sha256",
              "original_bytes_are_exact_prefix_of_new_file", "deleted_bytes", "deleted_lines",
              "appended_bytes"):
        print("%s=%s" % (k, p[k]))
    print("-" * 100)
print("append_only_targets=%d fails=%d" % (len(proof), len(fails)))
sys.exit(1 if fails else 0)
