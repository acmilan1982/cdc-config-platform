#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R2 定向纠正：把八份入口文档中的残余 R0/R1 文件事实混写按 §3 分层原位纠正，
并把当前下一入口由 R1 复审入口更新为 R2 复审入口（R1 入口保留为已限定历史事实）。

默认 dry-run；`--apply` 才写盘。每一处编辑都断言锚点出现次数严格等于声明值。
"""
import io
import os
import sys

WT = '/agent/dss-query-button-table-layout-implementation-001-r2'
B = WT + '/'
DSS = 'docs/features/data-source-snapshot-status/'

TASK_R2 = 'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2'
T_R1 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R1_REVIEW_FROM_GIT_THEN_'
        'PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
T_R2 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R2_REVIEW_FROM_GIT_THEN_'
        'PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
T_R0 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_'
        'PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')

# ---- §3 分层事实（八份文档统一口径） ----
LAYER = (
    'R0 业务实现实际涉及 2 个生产源码文件（`frontend/src/layouts/MainLayout.vue`、'
    '`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue`）和 2 个测试文件'
    '（`frontend/src/layouts/MainLayout.spec.ts`、'
    '`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts`），'
    '共 4 个前端路径（`r0_production_source_file_count=2`、`r0_test_file_count=2`、'
    '`r0_total_frontend_changed_file_count=4`）；R1 仅在这 4 个文件中纠正 5 处需求编号注释/测试名称'
    '（`r1_reference_corrected_file_count=4`、`r1_reference_corrected_location_count=5`：'
    '`MainLayout.vue` 1 处、`MainLayout.spec.ts` 2 处、`DataSourceSnapshotQueryBar.vue` 1 处、'
    '`DataSourceSnapshotQueryBar.spec.ts` 1 处），未改变业务逻辑、CSS 规则、测试断言、fixture 或 mock'
    '（`r1_business_logic_diff=ZERO`、`r1_css_rule_diff=ZERO`、`r1_test_assertion_diff=ZERO`、'
    '`r1_fixture_mock_diff=ZERO`）'
)

# ---- 原句（不准确历史表述） ----
BAD = '两个前端实现文件除 5 处需求编号注释/测试名称外逐字节不变。'

R1_PARA = ('（**当前直接值（2026-09-15 R1 定向纠正任务提交并推送后）**：本轮实现任务 '
           '`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001` '
           '已完成代码实现与开发自测并提交推送；ChatGPT 从远程 Git 的 R0 复审结论为 '
           '`chatgpt_r0_review_status=CHANGES_REQUIRED_DOCUMENT_TRACEABILITY_AND_CURRENT_STATUS_ONLY`'
           '（**仅**要求纠正需求编号引用与文档当前事实；`business_implementation_review_status=CORRECT_AND_PRESERVED`、'
           '`browser_evidence_review_status=APPROVED_FOR_IMPLEMENTATION_REVIEW`，业务实现与 R0 浏览器证据不被推翻、不重跑），'
           '两类问题已由定向纠正任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R1` '
           '处理；据此进入 ChatGPT 从远程 Git 对 R1 的实现复审与项目负责人对 `5173` 的人工视觉交互复核，'
           '随后另立任务执行 `DSS-AC-114~118` 共 5 条新增验收；实现完成**不等于**代码复审通过、'
           '**不等于**本轮 5 条新增验收已执行、**不等于**最终接受收口）。')
R1_PARA_BODY = R1_PARA[len('（**当前直接值（2026-09-15 R1 定向纠正任务提交并推送后）**：'):]

R2_CUR_HEAD = ('（**当前直接值（2026-09-15 R2 定向纠正任务提交并推送后）**：'
               'ChatGPT 从远程 Git 对 R1 结果提交 `8272d69bda0fa917cd569d85cbd61f6ed9e28b4e` 的复审结论为 '
               '`chatgpt_r1_review_status=CHANGES_REQUIRED_ONE_RESIDUAL_DOCUMENT_FACT_CONFLATION`'
               '（`r1_business_implementation_review_status=APPROVED`、'
               '`r1_traceability_reference_correction_status=APPROVED`、'
               '`r1_current_status_correction_status=APPROVED`、'
               '`r1_report_append_only_review_status=APPROVED`），残余文档事实混写已由定向纠正任务 `'
               + TASK_R2 + '` 原位纠正并提交推送；据此进入 ChatGPT 从远程 Git 对 R2 的实现复审与项目负责人对 '
               '`5173` 的人工视觉交互复核，随后另立任务执行 `DSS-AC-114~118` 共 5 条新增验收；'
               '实现完成**不等于**代码复审通过、**不等于**本轮 5 条新增验收已执行、**不等于**最终接受收口）。')

# R1 记录块文末“当前统一下一入口”子句
R1_TAIL_OLD = ('当前统一下一入口 `%s`（R0 入口 `%s` 为 2026-09-15 R0 实现提交后的历史入口，'
               '已由本 R1 纠正任务处理，不构成当前直接值）。' % (T_R1, T_R0))
R1_TAIL_NEW = ('当前统一下一入口 `%s`（R1 入口 `%s` 为 2026-09-15 R1 定向纠正任务提交后的历史入口，'
               '已由 `%s` 接续，不构成当前直接值；R0 入口 `%s` 为 2026-09-15 R0 实现提交后的历史入口，'
               '已由 R1 纠正任务处理，不构成当前直接值）。' % (T_R2, T_R1, TASK_R2, T_R0))


def r2_block(label):
    return (
        '> 查询按钮与表格布局稳定性实现 R2 定向纠正记录（2026-09-15，`%s`，纯文档事实分层纠正任务；'
        '不改代码、不改测试、不改 CSS、不改断言、不启停服务、不访问数据库/ZooKeeper/Kafka、'
        '不执行 `DSS-AC-114~118`、不清理任何 worktree）：ChatGPT 从远程 Git 对 R1 结果提交 '
        '`8272d69bda0fa917cd569d85cbd61f6ed9e28b4e` 的复审结论为 '
        '`chatgpt_r1_review_status=CHANGES_REQUIRED_ONE_RESIDUAL_DOCUMENT_FACT_CONFLATION`'
        '（`r1_business_implementation_review_status=APPROVED`、'
        '`r1_traceability_reference_correction_status=APPROVED`、'
        '`r1_current_status_correction_status=APPROVED`、'
        '`r1_report_append_only_review_status=APPROVED`；R1 的业务实现结论、5 处需求编号引用纠正结论与'
        '当前状态纠正结论均有效，不被推翻，R2 只增强文档事实精确性）。发现的唯一残余问题是：%s中的原句'
        '“两个前端实现文件除 5 处需求编号注释/测试名称外逐字节不变”把 R0 业务实现的文件范围与 '
        'R1 引用纠正的文件范围混写为同一事实（ChatGPT R1 复审发现的不准确历史表述，已由 R2 纠正）。'
        'R2 按事实分层原位纠正为：%s。本轮不改变任何业务实现、CSS、'
        '断言、验收业务行或冻结边界：`query_button_and_table_layout_stability_document_status=APPROVED`、'
        '`query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、'
        '`query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW`、'
        '`query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN`、'
        '`query_button_and_table_layout_stability_acceptance_status=NOT_RUN`、'
        '`query_button_and_table_layout_stability_acceptance_not_run_count=5`、`pending_user_review=NO`、'
        '`pending_user_confirmation_count=0`；既有 `DSS-AC-001~113` 保持 '
        '`PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`，本轮 `DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`。'
        '**实现完成不等于代码复审通过、不等于本轮 5 条新增验收已执行、不等于最终接受收口**；'
        '当前统一下一入口 `%s`（R1 入口 `%s` 为 2026-09-15 R1 定向纠正任务提交后的历史入口，'
        '已由本 R2 定向纠正任务接续，不构成当前直接值）。报告见 '
        '`docs/features/data-source-snapshot-status/reports/%s.md`。'
        % (TASK_R2, label, LAYER, T_R2, T_R1, TASK_R2))


DSS_DOCS = [DSS + n for n in ('README.md', 'REQUIREMENTS.md', 'ACCEPTANCE.md', 'DESIGN.md',
                              'UI.md', 'API.md', 'DATABASE.md')]

EDITS = []
for rel in DSS_DOCS:
    EDITS.append((rel, '`current_next_entry=%s`。' % T_R1,
                  '`current_next_entry=%s`（R1 入口 `%s` 为 2026-09-15 R1 定向纠正任务提交后的历史入口，'
                  '已由 `%s` 接续，不构成当前直接值）。' % (T_R2, T_R1, TASK_R2), 1))
    EDITS.append((rel, '`%s`%s' % (T_R1, R1_PARA),
                  '`%s`%s历史（2026-09-15 R1 定向纠正任务提交并推送后）该入口曾为 `%s`'
                  '（**2026-09-15 R1 定向纠正任务提交后的历史入口，已由 `%s` 接续，不构成当前直接值**：%s'
                  % (T_R2, R2_CUR_HEAD, T_R1, TASK_R2, R1_PARA_BODY), 1))
    EDITS.append((rel, BAD, LAYER + '；原「两个前端实现文件」表述将 R0 的业务实现文件范围与 R1 的引用纠正'
                  '文件范围混写为同一事实，属 ChatGPT R1 复审发现的不准确历史表述，已由 R2 纠正，'
                  '不再构成当前事实。', 1))
    EDITS.append((rel, R1_TAIL_OLD, R1_TAIL_NEW, 1))
    EDITS.append((rel, None, r2_block('其 R1 记录（§4.2 第 6 项 / §5）'), 1))

# ---- features/README.md：表行 + 段落两处当前直接值 ----
FREAD = 'docs/features/README.md'
EDITS.append((FREAD, '**`%s`**%s' % (T_R1, R1_PARA),
              '**`%s`**%s历史（2026-09-15 R1 定向纠正任务提交并推送后）本行统一入口曾为 `%s`'
              '（**2026-09-15 R1 定向纠正任务提交后的历史入口，已由 `%s` 接续，不构成当前直接值**：%s'
              % (T_R2, R2_CUR_HEAD, T_R1, TASK_R2, R1_PARA_BODY), 1))
EDITS.append((FREAD, '其统一下一入口当前为 `%s`%s' % (T_R1, R1_PARA),
              '其统一下一入口当前为 `%s`%s历史（2026-09-15 R1 定向纠正任务提交并推送后）该入口曾为 `%s`'
              '（**2026-09-15 R1 定向纠正任务提交后的历史入口，已由 `%s` 接续，不构成当前直接值**：%s'
              % (T_R2, R2_CUR_HEAD, T_R1, TASK_R2, R1_PARA_BODY), 1))
EDITS.append((FREAD, BAD, LAYER + '；原「两个前端实现文件」表述将 R0 的业务实现文件范围与 R1 的引用纠正'
              '文件范围混写为同一事实，属 ChatGPT R1 复审发现的不准确历史表述，已由 R2 纠正，'
              '不再构成当前事实。', 1))
EDITS.append((FREAD, R1_TAIL_OLD, R1_TAIL_NEW, 1))
EDITS.append((FREAD, None, r2_block('其 R1 记录（§变更记录 R1 块）'), 1))

# ---- UI.md §32.7 ----
SHORT_LAYER = (
    'R0 业务实现同时修改对应两个测试文件 `frontend/src/layouts/MainLayout.spec.ts`、'
    '`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts`，'
    '共 4 个前端路径（`r0_production_source_file_count=2`、`r0_test_file_count=2`、'
    '`r0_total_frontend_changed_file_count=4`）；R1 仅在这 4 个文件中纠正 5 处需求编号注释/测试名称'
    '（`r1_reference_corrected_file_count=4`、`r1_reference_corrected_location_count=5`），'
    '未改变业务逻辑、CSS 规则、测试断言、fixture 或 mock'
)
UI_OLD = ('本轮实现已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001` '
          '于 2026-09-15 修改 `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` '
          '与 `frontend/src/layouts/MainLayout.vue` 两个前端文件（其中 5 处为需求编号注释/测试名称纠正，'
          '`backend/`、SQL、配置、依赖与锁文件仍零差异），见文末实现记录。')
UI_NEW = ('本轮实现已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001` '
          '于 2026-09-15 落地 `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` '
          '与 `frontend/src/layouts/MainLayout.vue` 两个生产源码文件（' + SHORT_LAYER + '；'
          '`backend/`、SQL、配置、依赖与锁文件仍零差异），见文末实现记录。')
EDITS.append((DSS + 'UI.md', UI_OLD, UI_NEW, 1))

# ---- DESIGN.md §38.9 ----
DE_OLD = ('本轮实现已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001` '
          '于 2026-09-15 落地 `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` '
          '与 `frontend/src/layouts/MainLayout.vue` 两处前端改动，见文末实现记录；')
DE_NEW = ('本轮实现已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001` '
          '于 2026-09-15 落地 `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` '
          '与 `frontend/src/layouts/MainLayout.vue` 两个生产源码文件（' + SHORT_LAYER + '），见文末实现记录；')
EDITS.append((DSS + 'DESIGN.md', DE_OLD, DE_NEW, 1))


BASE_COMMIT = '8272d69bda0fa917cd569d85cbd61f6ed9e28b4e'


def base_blob(rel):
    """取基准提交的同路径原始内容，保证结果由基准 + 声明编辑唯一决定。"""
    import subprocess
    out = subprocess.run(['git', '-C', WT, 'show', '%s:%s' % (BASE_COMMIT, rel)],
                         capture_output=True)
    if out.returncode != 0:
        raise SystemExit('无法读取基准 blob：%s' % rel)
    return out.stdout.decode('utf-8')


def apply_edits():
    by_file = {}
    for rel, old, new, n in EDITS:
        by_file.setdefault(rel, []).append((old, new, n))
    apply_mode = '--apply' in sys.argv
    bad = 0
    for rel in sorted(by_file):
        text = base_blob(rel)
        for old, new, n in by_file[rel]:
            if old is None:                      # 追加块
                text = text + '\n' + new + '\n'
                continue
            c = text.count(old)
            if c != n:
                print('BAD %-52s 锚点出现 %d 次（期望 %d）：%r' % (rel, c, n, old[:70]))
                bad += 1
                continue
            text = text.replace(old, new, 1)
        cur = io.open(B + rel, encoding='utf-8').read()
        same = (cur == text)
        print('%-52s ops=%d  worktree_equals_expected=%s  expected_bytes=%d'
              % (rel, len(by_file[rel]), same, len(text.encode('utf-8'))))
        if not same:
            if apply_mode:
                with io.open(B + rel, 'w', encoding='utf-8') as fh:
                    fh.write(text)
                print('    -> 已按基准 + 声明编辑重写')
            else:
                bad += 1
    print('edits=%d  bad=%d' % (len(EDITS), bad))
    print('mode=%s' % ('APPLY' if apply_mode else 'DRY_RUN'))
    return 0 if bad == 0 else 1


if __name__ == '__main__':
    sys.exit(apply_edits())
