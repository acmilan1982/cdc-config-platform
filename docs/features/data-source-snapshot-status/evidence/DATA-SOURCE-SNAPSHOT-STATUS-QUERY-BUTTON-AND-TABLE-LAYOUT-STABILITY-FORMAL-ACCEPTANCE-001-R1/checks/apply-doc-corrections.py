#!/usr/bin/env python3
# R1 文档纠正执行脚本（prompt §6.1）。
# 只做三件事，每件事都带严格计数断言：
#   1) 把八份入口文档中「R0 正式验收下一入口」的当前直接值换成 R1 入口，并把原 R0 入口降级为历史；
#   2) 在八份入口文档的 QBTL R0 记录行中，为含糊表述「ZooKeeper 仅只读」补一条历史限定语；
#   3) 在每份文档末尾追加 R1 记录段。
# 任何计数不符即非零退出。
import hashlib
import os
import sys

W = "/agent/dss-query-button-table-layout-formal-acceptance-001-r1"
D = os.path.join(W, "docs/features")

FILES = [
    os.path.join(D, "README.md"),
    os.path.join(D, "data-source-snapshot-status/README.md"),
    os.path.join(D, "data-source-snapshot-status/REQUIREMENTS.md"),
    os.path.join(D, "data-source-snapshot-status/ACCEPTANCE.md"),
    os.path.join(D, "data-source-snapshot-status/DESIGN.md"),
    os.path.join(D, "data-source-snapshot-status/UI.md"),
    os.path.join(D, "data-source-snapshot-status/API.md"),
    os.path.join(D, "data-source-snapshot-status/DATABASE.md"),
]

T0 = ("CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_FORMAL_ACCEPTANCE_REVIEW_FROM_GIT_THEN_"
      "PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION")
T1 = ("CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_"
      "PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION")

SUF_R0 = "（**当前直接值（2026-09-15 正式验收执行任务提交并推送后）**："
SUF_R1 = "（**当前直接值（2026-09-16 R1 ZooKeeper 边界与结果事实纠正任务提交并推送后）**："

R1_DESC = (
    "ChatGPT 已从远程 Git 对 R0 正式验收提交 `71368a0a338209af564103291f5a51bc03e60bb4` 完成独立复审，"
    "`chatgpt_r0_formal_acceptance_review_status=CHANGES_REQUIRED_ZOOKEEPER_BOUNDARY_AND_RESULT_FACT_ONLY`"
    "（`r0_business_acceptance_evidence_review_status=APPROVED`、"
    "`r0_formal_acceptance_execution_result_status=PRESERVED_PASS_5_OF_5_TOTAL_118_OF_118`）；"
    "R0 任务**主动**执行过一次只读 `ls /bsoft-cdc/clients`（返回 `[hosp-012]`），"
    "违反 R0 提示词“不得主动执行 ZooKeeper CLI、不得读取节点”的任务边界，"
    "`formal_acceptance_task_initiated_zookeeper_node_operation_status=READ_ONLY_LS_ONE`、"
    "`formal_acceptance_task_initiated_zookeeper_cli_status=EXECUTED_ONCE`、"
    "`formal_acceptance_task_initiated_zookeeper_read_status=READ_ONE_PATH`、"
    "`formal_acceptance_task_initiated_zookeeper_read_path=/bsoft-cdc/clients`、"
    "`zookeeper_boundary_compliance_status=VIOLATED_READ_PROHIBITION`、"
    "`zookeeper_write_status=ZERO`、`zookeeper_acl_change_status=ZERO`、"
    "`feature_zookeeper_dependency=NONE`；该偏差是任务边界与结果事实问题，**不**推翻业务结论，"
    "`DSS-AC-114~118` 共 5 条仍全部 `PASS`、`formal_acceptance_pass_count=118` 保留，"
    "已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1` 如实纠正；"
    "待 ChatGPT 从远程 Git 复审 R1，再由项目负责人作最终接受决定，"
    "**不得据此声称已获批准或已作最终接受**"
)

HISTORY_PREFIX = "）。历史（2026-09-15 正式验收执行任务提交并推送后曾为本轮当前直接值）："

VAGUE = "ZooKeeper 仅只读"
QUALIFIER = (
    VAGUE
    + "（**历史表述（2026-09-15 R0 记录原文的笼统写法），未反映 R0 任务主动执行只读 `ls` 并违反 R0 提示词 "
      "ZooKeeper CLI/读取禁令这一事实；正确口径为 `formal_acceptance_task_initiated_zookeeper_node_operation_status="
      "READ_ONLY_LS_ONE`、`zookeeper_boundary_compliance_status=VIOLATED_READ_PROHIBITION`、"
      "`zookeeper_write_status=ZERO`、`zookeeper_acl_change_status=ZERO`、`feature_zookeeper_dependency=NONE`，"
      "已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1` "
      "于 2026-09-16 纠正，不构成本轮当前直接值）**"
)

R1_RECORD = (
    "> 查询按钮与表格布局稳定性正式验收 ZooKeeper 边界与结果事实 R1 纠正记录（2026-09-16，"
    "`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1`，"
    "纯文档与证据事实定向纠正任务；不改前端/后端代码、不改项目测试、不改 CSS、不改断言、"
    "不改 R0 浏览器证据/截图/rect JSON/判定 JSON/测试记录/数据库证据、不访问数据库/ZooKeeper/Kafka、"
    "不启停服务、不重跑 `DSS-AC-114~118`、不清理任何 worktree）：ChatGPT 已从远程 Git 对 R0 正式验收提交 "
    "`71368a0a338209af564103291f5a51bc03e60bb4` 完成独立复审，结论为 "
    "`chatgpt_r0_formal_acceptance_review_status=CHANGES_REQUIRED_ZOOKEEPER_BOUNDARY_AND_RESULT_FACT_ONLY`"
    "（`r0_business_acceptance_evidence_review_status=APPROVED`、"
    "`r0_formal_acceptance_execution_result_status=PRESERVED_PASS_5_OF_5_TOTAL_118_OF_118`）。"
    "复审确认 R0 业务验收与机器证据有效：四档视口、长短结果切换、398 项严格断言 0 失败、正式判定 `exit 0`、"
    "页面无关负向控制注入 `+0.001px` 后由同一判定器判出 20 项失败并真实 `exit 1`、"
    "查询/重置/立即刷新按钮固定宽度 `62px`/`62px`/`110px`、route-scoped stable scrollbar gutter 与其他路由零泄漏、"
    "前端/后端/项目测试/依赖/锁文件/SQL/配置零变化。唯一需要纠正的是 ZooKeeper 边界及其结果事实："
    "R0 任务**主动**执行过一次只读 `ls /bsoft-cdc/clients`（返回 `[hosp-012]`），"
    "违反 R0 提示词“不得主动执行 ZooKeeper CLI、不得读取节点”的任务边界；正确口径为 "
    "`zookeeper_environment_status=AVAILABLE`、"
    "`formal_acceptance_task_initiated_zookeeper_node_operation_status=READ_ONLY_LS_ONE`、"
    "`formal_acceptance_task_initiated_zookeeper_cli_status=EXECUTED_ONCE`、"
    "`formal_acceptance_task_initiated_zookeeper_read_status=READ_ONE_PATH`、"
    "`formal_acceptance_task_initiated_zookeeper_read_path=/bsoft-cdc/clients`、"
    "`zookeeper_boundary_compliance_status=VIOLATED_READ_PROHIBITION`、`zookeeper_write_status=ZERO`、"
    "`zookeeper_acl_change_status=ZERO`、`feature_zookeeper_dependency=NONE`；"
    "R0 记录中的 `formal_acceptance_task_initiated_zookeeper_node_operation_status` 字段值曾被记为 `NONE`，"
    "那是**错误结果字段**（正确值为 `READ_ONLY_LS_ONE`），"
    "已在 R0 证据文件 "
    "`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001/database/zookeeper-kafka-boundary.md` "
    "以 append-only 方式纠正（原命令、返回值与原错误字段全部保留为 R0 当时记录）。该偏差为任务边界与结果事实问题，"
    "**不**推翻业务结论：`DSS-AC-114=PASS`、`DSS-AC-115=PASS`、`DSS-AC-116=PASS`、`DSS-AC-117=PASS`、"
    "`DSS-AC-118=PASS`、`adjustment_acceptance_pass_count=5`、`formal_acceptance_pass_count=118`、"
    "0 FAIL / 0 BLOCKED / 0 NOT_RUN 全部保留；本轮未重跑测试、构建、浏览器验收或 `DSS-AC-114~118`，"
    "未连接数据库、ZooKeeper、Kafka。R1 本轮自身未执行任何 ZooKeeper 命令（`r1_task_zookeeper_access_status=NONE`）；"
    "`zookeeper_environment_status=AVAILABLE` 是既有环境事实，本轮只从 Git 读取历史证据并纠正文档。"
    "当前仍为 `query_button_and_table_layout_stability_document_status=APPROVED`、"
    "`query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FINAL_ACCEPTANCE`、"
    "`query_button_and_table_layout_stability_code_review_status=APPROVED`、"
    "`query_button_and_table_layout_stability_human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER`、"
    "`query_button_and_table_layout_stability_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`、"
    "`query_button_and_table_layout_stability_acceptance_execution_status=PASS`、`final_acceptance_status=NOT_EXECUTED`；"
    "**不等于** ChatGPT 已批准 R1、**不等于**项目负责人已作最终接受，不得写成 "
    "`ACCEPTED`/`IMPLEMENTED_ACCEPTED`/`COMPLETED`。报告见 "
    "`docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1.md`。"
)

fails = []


def fail(msg):
    fails.append(msg)
    print("FAIL " + msg)


summary = []
for path in FILES:
    rel = os.path.relpath(path, D)
    before = open(path, "rb").read()
    text = before.decode("utf-8")
    trailing_nl = text.endswith("\n")

    n_bt = text.count("`" + T0 + "`" + SUF_R0)
    n_plain = text.count(T0 + SUF_R0)
    if n_bt + n_plain != 2:
        fail("%s: expected 2 R0 current-entry markers, got backticked=%d plain=%d" % (rel, n_bt, n_plain))
        continue

    new_bt = "`" + T1 + "`" + SUF_R1 + R1_DESC + HISTORY_PREFIX + "`" + T0 + "`（"
    new_plain = T1 + SUF_R1 + R1_DESC + HISTORY_PREFIX + T0 + "（"
    text2 = text.replace("`" + T0 + "`" + SUF_R0, new_bt).replace(T0 + SUF_R0, new_plain)

    if text2.count(T1) != 2:
        fail("%s: expected 2 R1 entries after entry rewrite, got %d" % (rel, text2.count(T1)))
    if text2.count(SUF_R0) != 0:
        fail("%s: R0 current-value marker still present after rewrite (%d)" % (rel, text2.count(SUF_R0)))

    n_vague = text2.count(VAGUE)
    if n_vague != 1:
        fail("%s: expected exactly 1 vague ZooKeeper phrase, got %d" % (rel, n_vague))
    else:
        text2 = text2.replace(VAGUE, QUALIFIER)

    if trailing_nl:
        text2 = text2 + R1_RECORD + "\n"
    else:
        text2 = text2 + "\n" + R1_RECORD

    open(path, "wb").write(text2.encode("utf-8"))
    after = open(path, "rb").read().decode("utf-8")

    # 八份入口文档不是 append-only 对象（prompt §6.2/§6.3 只约束 R0 报告与 R0 ZooKeeper 证据文件），
    # 因此这里只核验「业务行零差异」所需的性质：被替换的只是入口元数据，业务行未触碰。
    summary.append({
        "path": rel,
        "mode": "IN_PLACE_ENTRY_METADATA_REWRITE_PLUS_APPEND",
        "before_bytes": len(before),
        "after_bytes": len(after.encode("utf-8")),
        "before_sha256": hashlib.sha256(before).hexdigest(),
        "after_sha256": hashlib.sha256(after.encode("utf-8")).hexdigest(),
        "entry_backticked_replaced": n_bt,
        "entry_plain_replaced": n_plain,
        "r1_current_entry_count": after.count(T1),
        "r0_entry_demoted_to_history_count": after.count(T0),
        "r0_current_value_marker_remaining": after.count(SUF_R0),
        "vague_phrase_qualified": after.count("zookeeper_boundary_compliance_status=VIOLATED_READ_PROHIBITION"),
        # 该错误字段字面量在仓库中只允许出现在 R0 证据文件保留的 R0 原始记录里，
        # 所以这里用拼接构造，避免检查脚本自身成为第二处字面量。
        "wrong_none_field_count": after.count(
            "formal_acceptance_task_initiated_zookeeper_node_operation_status=" + "NONE"),
        "wrong_readonly_field_count": after.count("formal_acceptance_task_initiated_zookeeper_node_operation_status=READ_ONLY_LS_ONE"),
        "r1_record_appended": after.rstrip("\n").endswith(R1_RECORD.rstrip("\n")),
    })

print("=" * 100)
print("mode for all eight entry docs: IN_PLACE_ENTRY_METADATA_REWRITE_PLUS_APPEND")
print("(prompt §6.2/§6.3 append-only constraints apply only to the R0 report and the R0")
print(" ZooKeeper evidence file; these eight entry docs are corrected in place per §6.1)")
for s in summary:
    print("path=%(path)s before=%(before_bytes)d after=%(after_bytes)d" % s)
    print("  before_sha256=%(before_sha256)s" % s)
    print("  after_sha256=%(after_sha256)s" % s)
    for k in ("entry_backticked_replaced", "entry_plain_replaced", "r1_current_entry_count",
              "r0_entry_demoted_to_history_count", "r0_current_value_marker_remaining",
              "vague_phrase_qualified", "wrong_none_field_count", "wrong_readonly_field_count",
              "r1_record_appended"):
        print("  %s=%s" % (k, s[k]))
print("files_processed=%d fails=%d" % (len(summary), len(fails)))
sys.exit(1 if fails else 0)
