#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R1 §5/§7：8 份入口文档的可追踪性引用与“当前事实”纠正。

- 每个修改都使用字节精确锚点，且要求锚点出现次数严格等于期望值；
- 只改状态/历史限定/下一入口文字，不改任何需求业务行、验收业务行/状态列、
  设计或界面业务规则；
- 文末追加 R1 记录。
用法：r1_docs.py [--apply]
"""
import sys

B = '/agent/dss-query-button-table-layout-implementation-001-r1/docs/features/'
DSS = 'data-source-snapshot-status/'
SEVEN = [DSS + 'README.md', DSS + 'REQUIREMENTS.md', DSS + 'ACCEPTANCE.md',
         DSS + 'DESIGN.md', DSS + 'UI.md', DSS + 'API.md', DSS + 'DATABASE.md']
ALL8 = ['README.md'] + SEVEN

IMPL = 'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001'
R1TASK = IMPL + '-R1'
R0E = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_REVIEW_FROM_GIT'
       '_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
R1E = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R1_REVIEW_FROM_GIT'
       '_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
STALE_CUR = '（**当前直接值（2026-09-15 查询按钮与表格布局稳定性实现任务提交并推送后）**：'

R1_SHORT = (
    '本轮实现任务 `%s` 已完成代码实现与开发自测并提交推送；ChatGPT 从远程 Git 的 R0 复审结论为 '
    '`chatgpt_r0_review_status=CHANGES_REQUIRED_DOCUMENT_TRACEABILITY_AND_CURRENT_STATUS_ONLY`'
    '（**仅**要求纠正需求编号引用与文档当前事实；`business_implementation_review_status=CORRECT_AND_PRESERVED`、'
    '`browser_evidence_review_status=APPROVED_FOR_IMPLEMENTATION_REVIEW`，业务实现与 R0 浏览器证据不被推翻、不重跑），'
    '两类问题已由定向纠正任务 `%s` 处理；据此进入 ChatGPT 从远程 Git 对 R1 的实现复审与项目负责人对 `5173` 的人工视觉'
    '交互复核，随后另立任务执行 `DSS-AC-114~118` 共 5 条新增验收；实现完成**不等于**代码复审通过、**不等于**本轮 5 条新增验收'
    '已执行、**不等于**最终接受收口'
) % (IMPL, R1TASK)

R1_ENTRY_HIST = (
    '历史（2026-09-15 R0 实现提交并推送后）该入口曾为 `%s`'
    '（**2026-09-15 R0 实现提交后的历史入口，已由 R1 纠正任务处理，不构成当前直接值**：' % R0E
)

R1_BLOCK = (
    '> 查询按钮与表格布局稳定性实现 R1 定向纠正记录（2026-09-15，`%s`，纯文档与注释/测试名称可追踪性纠正任务；'
    '不改变任何业务实现、CSS、断言、验收业务行或冻结边界，不执行 `DSS-AC-114~118`、不启停服务、'
    '不访问数据库/ZooKeeper/Kafka、不清理任何 worktree）：ChatGPT 从远程 Git 对实现提交 '
    '`d77e174a912daf852837c9658f13672918fc766e` 的 R0 复审结论为 '
    '`chatgpt_r0_review_status=CHANGES_REQUIRED_DOCUMENT_TRACEABILITY_AND_CURRENT_STATUS_ONLY`'
    '（**仅**要求纠正需求编号引用与文档当前事实；`business_implementation_review_status=CORRECT_AND_PRESERVED`、'
    '`browser_evidence_review_status=APPROVED_FOR_IMPLEMENTATION_REVIEW`，业务实现与 R0 浏览器证据不被推翻、不重跑）。'
    '本次 R1 纠正两类问题：① **需求编号引用**——`DSS-REQ-090` = 查询与重置按钮固定 `62px`、立即刷新保持 `110px`；'
    '`DSS-REQ-091` = 源库快照状态路由真实主内容滚动容器保留 stable scrollbar gutter；共纠正 5 处误引用'
    '（`MainLayout.vue` gutter 注释 `090→091`、`MainLayout.spec.ts` 文件头注释与 `describe` 名 `090→091`、'
    '`DataSourceSnapshotQueryBar.vue` 重置按钮注释 `091→090`、`DataSourceSnapshotQueryBar.spec.ts` `describe` 名 `091→090`），'
    '只改注释与测试展示名称，可执行逻辑、CSS 声明、断言、fixture 与 mock 零变化；② **文档当前事实**——'
    '把本轮查询按钮与表格布局稳定性的状态/记录文字由实现前口径的当前语气，改为带日期与任务编号、'
    '且注明“已由实现任务处理完毕”的历史事实。当前事实：'
    '`query_button_and_table_layout_stability_document_status=APPROVED`、'
    '`query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、'
    '`query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW`、'
    '`query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN`、'
    '`query_button_and_table_layout_stability_acceptance_status=NOT_RUN`、'
    '`query_button_and_table_layout_stability_acceptance_not_run_count=5`、`requirements_count=91`、`acceptance_count=118`、'
    '`pending_user_review=NO`、`pending_user_confirmation_count=0`；既有 `DSS-AC-001~113` 保持 '
    '`PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 0` 逐字节不变，本轮 `DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`。'
    '冻结边界：`DSS-REQ-001~091` 业务行、`DSS-AC-001~118` 完整业务行与状态列、`DESIGN.md` §14.2/§14.3 映射行、'
    '`API.md`/`DATABASE.md` 业务契约、`backend/**`、SQL、配置、依赖与锁文件、R0 既有证据目录逐字节不变，'
    '两个前端实现文件除 5 处需求编号注释/测试名称外逐字节不变。'
    '**实现完成不等于代码复审通过、不等于本轮 5 条新增验收已执行、不等于最终接受收口**；'
    '当前统一下一入口 `%s`（R0 入口 `%s` 为 2026-09-15 R0 实现提交后的历史入口，'
    '已由本 R1 纠正任务处理，不构成当前直接值）。报告见 '
    '`docs/features/data-source-snapshot-status/reports/'
    'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R1.md`。'
) % (R1TASK, R1E, R0E)

EDITS = []


def add(rel, old, new, n=1):
    EDITS.append((rel, old, new, n))


# ---- E1: “草案下一入口”行的当前直接值（7 份 ds-ss 文档，普通反引号形态） ----
for rel in SEVEN:
    add(rel,
        '`%s`%s' % (R0E, STALE_CUR),
        '`%s`（**当前直接值（2026-09-15 R1 定向纠正任务提交并推送后）**：%s）。%s' % (
            R1E, R1_SHORT, R1_ENTRY_HIST))

# ---- E1b: docs/features/README.md 中同一行的加粗形态 ----
add('README.md',
    '**`%s`**%s' % (R0E, STALE_CUR),
    '**`%s`**（**当前直接值（2026-09-15 R1 定向纠正任务提交并推送后）**：%s）。%s' % (
        R1E, R1_SHORT, R1_ENTRY_HIST))

# ---- E2: docs/features/README.md 中“其统一下一入口当前为 …” ----
add('README.md',
    '当前为 `%s`%s' % (R0E, STALE_CUR),
    '当前为 `%s`（**当前直接值（2026-09-15 R1 定向纠正任务提交并推送后）**：%s）。%s' % (
        R1E, R1_SHORT, R1_ENTRY_HIST))

# ---- E3: current_next_entry=... ----
for rel in SEVEN:
    add(rel, 'current_next_entry=%s' % R0E, 'current_next_entry=%s' % R1E)

# ---- E4: R0 实现记录块文末“下一入口 <R0>” ----
for rel in ALL8:
    add(rel, '；下一入口 `%s`。' % R0E,
        '；下一入口 `%s`（**2026-09-15 R0 实现提交后的历史入口，已由 `%s` 纠正任务处理，不构成当前直接值**；'
        'R1 后本轮统一下一入口见本文件状态表的“查询按钮与表格布局稳定性草案下一入口”行与文末 R1 记录）。' % (R0E, R1TASK))

# ---- E5: REQUIREMENTS.md §21.10 ④ 事实边界 ----
add(DSS + 'REQUIREMENTS.md',
    '④ 本轮批准后仍**不得**把 Feature 写成 `IMPLEMENTED`/`PASS`/`ACCEPTED`/`COMPLETED` 或最终收口'
    '（`query_button_and_table_layout_stability_document_status=APPROVED` 仅表示**文档基线**已批准，不等于实现或验收）；'
    'Feature 最终接受收口待独立正式实现任务 `%s` 完成后另行收口。' % IMPL,
    '④ **当前事实（2026-09-15 R1 定向纠正任务提交并推送后）**：本轮实现任务 `%s` 已完成代码实现与开发自测'
    '（`query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`），'
    '但**实现完成不等于代码复审通过、不等于本轮 5 条新增验收已执行、不等于最终接受收口**：仍**不得**把 Feature 写成 '
    '`IMPLEMENTED_ACCEPTED`/`PASS`/`ACCEPTED`/`COMPLETED` 或最终收口'
    '（`query_button_and_table_layout_stability_document_status=APPROVED` 仅表示**文档基线**已批准，'
    '`DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`）；Feature 最终接受收口待 ChatGPT 从远程 Git 对 R1 的实现复审、'
    '项目负责人人工视觉交互复核与 `DSS-AC-114~118` 共 5 条新增验收执行后另行收口。'
    '**批准时点历史（2026-09-15 文档批准收口时点，该时点本轮尚未实现；已由 `%s` 于 2026-09-15 完成实现并处理完毕，'
    '不构成当前直接值）**：该时点仍**不得**把 Feature 写成 `IMPLEMENTED`/`PASS`/`ACCEPTED`/`COMPLETED` 或最终收口，'
    'Feature 最终接受收口当时待独立正式实现任务 `%s` 完成后另行收口。' % (IMPL, IMPL, IMPL))

# ---- E6: DESIGN.md §38.1 任务与状态边界（两处） ----
add(DSS + 'DESIGN.md',
    '：仍不在 `5173` 实现、不执行本轮新增验收、不做最终接受收口、不启停服务、不访问数据库/ZooKeeper/Kafka（**批准前历史状态',
    '：**当前事实（2026-09-15 R1 定向纠正任务提交并推送后）**：本轮实现任务 `%s` 已在 `5173` 完成代码实现与开发自测'
    '（`query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`），'
    '但**未执行本轮新增验收、未做最终接受收口**；本节设计口径仍为已批准的冻结设计，不因实现完成而改写。'
    '**起草与批准时点历史（2026-09-15 草案建立至文档批准收口时点，该时点本轮尚未实现）**：该时点仍不在 `5173` 实现、'
    '不执行本轮新增验收、不做最终接受收口、不启停服务、不访问数据库/ZooKeeper/Kafka（**批准前历史状态' % IMPL)

add(DSS + 'DESIGN.md',
    '；**批准文档不等于实现完成，也不等于本轮 5 条新增验收 `DSS-AC-114~118` 已执行**；'
    '本节**不得**被解释为本轮已实现或已通过。',
    '；**当前事实（2026-09-15 R1 定向纠正任务提交并推送后）**：本轮实现已完成'
    '（`query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、'
    '`query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW`），'
    '但本轮 5 条新增验收 `DSS-AC-114~118` 仍全部 `NOT_RUN`、未做最终接受收口；'
    '本节**不得**被解释为本轮 5 条新增验收已通过或已最终接受收口。')

# ---- E7: DESIGN.md §38.9 自检（frontend/test 零差异限定为时点自检） ----
add(DSS + 'DESIGN.md',
    '；`frontend/**`、`backend/**`、测试代码、SQL、配置、依赖与锁文件零差异。',
    '；**自检时点（2026-09-15 草案建立与批准收口时点，该时点本轮尚未实现）**：'
    '`frontend/**`、`backend/**`、测试代码、SQL、配置、依赖与锁文件零差异'
    '（**该结论仅对该时点成立、不构成当前事实**——本轮实现已由 `%s` 于 2026-09-15 落地 '
    '`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` 与 '
    '`frontend/src/layouts/MainLayout.vue` 两处前端改动，见文末实现记录；`backend/**`、SQL、配置、'
    '依赖与锁文件仍零差异）。' % IMPL)

# ---- E8: UI.md §32 开头（未实现 / 待实现任务完成） ----
add(DSS + 'UI.md',
    '；**未实现**（**不得**写成 `IMPLEMENTED`）、**未验收**（**不得**写成 `PASS`/`ACCEPTED`）、'
    'Feature 最终接受收口待独立正式实现任务 `%s` 完成后另行收口（**批准前历史状态' % IMPL,
    '；**当前事实（2026-09-15 R1 定向纠正任务提交并推送后）**：本轮实现任务 `%s` 已在 `5173` 完成代码实现与开发自测'
    '（`query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`），'
    '但本轮 5 条新增验收 `DSS-AC-114~118` **仍全部 `NOT_RUN`**'
    '（**不得**把实现完成写成 `PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`/`COMPLETED`）、Feature 最终接受收口未完成。'
    '**起草与批准时点历史（2026-09-15 草案建立至文档批准收口时点，该时点本轮尚未实现）**：该时点本节**未实现**'
    '（**不得**写成 `IMPLEMENTED`）、**未验收**（**不得**写成 `PASS`/`ACCEPTED`）、Feature 最终接受收口当时待'
    '独立正式实现任务 `%s` 完成后另行收口（**批准前历史状态' % (IMPL, IMPL))

# ---- E9: UI.md §32.7 代码零差异（限定为时点自检） ----
add(DSS + 'UI.md',
    '- 代码零差异：本轮不产生 `frontend/`/`backend/`/测试/SQL/配置/依赖/锁文件差异'
    '（`frontend_code_diff=ZERO`、`backend_code_diff=ZERO`）。',
    '- 代码零差异（**自检时点：2026-09-15 草案建立与批准收口时点，该时点本轮尚未实现**）：该时点不产生 '
    '`frontend/`/`backend/`/测试/SQL/配置/依赖/锁文件差异（`frontend_code_diff=ZERO`、`backend_code_diff=ZERO`）；'
    '**该结论仅对该时点成立、不构成当前事实**——本轮实现已由 `%s` 于 2026-09-15 修改 '
    '`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` 与 '
    '`frontend/src/layouts/MainLayout.vue` 两个前端文件（其中 5 处为需求编号注释/测试名称纠正，`backend/`、SQL、配置、'
    '依赖与锁文件仍零差异），见文末实现记录。' % IMPL)

# ---- E10: 文末追加 R1 记录 ----
for rel in ALL8:
    add(rel, '\n', '\n' + R1_BLOCK + '\n', n=0)


def main():
    apply = '--apply' in sys.argv
    bad = 0
    plan = {}
    for rel, old, new, n in EDITS:
        t = plan.get(rel)
        if t is None:
            t = open(B + rel, encoding='utf-8').read()
        c = t.count(old)
        if n == 0:  # append-to-EOF entry: only require the file ends with newline
            if not t.endswith('\n'):
                print(f'BAD {rel}: no trailing newline')
                bad += 1
                continue
            t = t + new
        elif c != n:
            print(f'BAD {rel}: anchor count={c} expected={n} :: {old[:70]!r}')
            bad += 1
            continue
        else:
            t = t.replace(old, new, n)
        plan[rel] = t
    print(f'plan size={len(plan)}  bad={bad}')
    if bad or not apply:
        return 1 if bad else 0
    for rel, t in plan.items():
        with open(B + rel, 'w', encoding='utf-8') as fh:
            fh.write(t)
        print('applied', rel)
    return 0


sys.exit(main())
