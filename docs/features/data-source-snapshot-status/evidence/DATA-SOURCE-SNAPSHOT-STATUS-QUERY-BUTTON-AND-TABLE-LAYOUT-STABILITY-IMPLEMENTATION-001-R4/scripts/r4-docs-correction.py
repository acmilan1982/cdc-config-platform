#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R4 文档结果事实纠正（声明式、基准派生、幂等）。

只做两件被授权的事：
  A. 三个按钮的 62/62/110px 明确为**固定宽度**字段（`*_fixed_width_px`），不是高度；
     本轮不建立、不测量、不修改任何按钮高度基线。
  B. R2 证据 README 在 R2 结果提交 `09e268f...` 中的真实 Git 对象状态：
     该路径**不存在**（`git cat-file -e` 退出码 128、`git ls-tree` 无该路径），
     由 R3 回溯创建 → `r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE`。

编辑方式：
  * 所有编辑从基准 blob（`git show <base>:<path>`）派生，不基于上一次运行结果，故幂等；
  * 八份入口文档：下一入口令牌 R3→R4（4 处/份），"当前直接值"块改写，
    历史链插入 R3 入口条目，文末追加 R4 记录；
  * 历史文件（R3 报告 / R2 证据 README / R3 证据 README）严格 append-only，只追加不改写。

不做：不改前端/后端/测试/CSS/契约/需求验收业务行；不改 R3 已修复的证据脚本；不访问网络与外部系统。
"""
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
WT = os.path.normpath(os.path.join(HERE, '..', '..', '..', '..', '..', '..'))
BASE = '64004ca062a92ab40e07350e231d97befe6f496c'

DSS = 'docs/features/data-source-snapshot-status'
ENTRY_DOCS = [
    'docs/features/README.md',
    DSS + '/README.md',
    DSS + '/REQUIREMENTS.md',
    DSS + '/ACCEPTANCE.md',
    DSS + '/DESIGN.md',
    DSS + '/UI.md',
    DSS + '/API.md',
    DSS + '/DATABASE.md',
]
R3_REPORT = DSS + '/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3.md'
R2_EV_README = DSS + '/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/README.md'
R3_EV_README = DSS + '/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3/README.md'

TASK = 'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4'
TASK_R3 = 'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3'

E_R3 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R3_REVIEW_'
        'FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
E_R4 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R4_REVIEW_'
        'FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
E_R2 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R2_REVIEW_'
        'FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')

# --- 标记：两种注解块的稳定前缀（B1 = "当前直接值"块；B234 = 历史链块） ---
M1 = '（**当前直接值（2026-09-15 R3 证据脚本纠正任务提交并推送后）**'
M234 = ('（R2 入口 `' + E_R2 + '` 为 2026-09-15 R2 定向纠正任务提交后的历史入口，已由')

# --- B1 改写：当前直接值 → R4，并把 R3 入口降为历史 ---
B1_NEW = (
    '（**当前直接值（2026-09-15 R4 事实纠正任务提交并推送后）**：'
    'ChatGPT 从远程 Git 对 R3 结果提交 `64004ca062a92ab40e07350e231d97befe6f496c` 的复审结论为 '
    '`chatgpt_r3_review_status=CHANGES_REQUIRED_TWO_RESULT_FACT_CORRECTIONS_ONLY`'
    '（`r3_evidence_script_correction_review_status=APPROVED`、'
    '`r3_business_implementation_status=PRESERVED_APPROVED`），仅需纠正两处**结果事实**：'
    '① 62/62/110px 是三个按钮的**固定宽度**（`query_button_fixed_width_px=62`、'
    '`reset_button_fixed_width_px=62`、`refresh_button_fixed_width_px=110`），'
    '不是按钮高度；本轮不建立、不测量、不修改任何按钮高度基线；'
    '② R2 证据 README 在 R2 结果提交 `09e268f905d083d6237b4dfc446198b4c5157661` 中**不存在**'
    '（`git cat-file -e` 真实退出码 `128`、`git ls-tree -r --name-only` 无该路径），'
    '由 R3 回溯创建，属 R3 在 R2 证据目录中新增的说明文件，不构成对 R2 已存在文件的追加。'
    '两处已由极小定向纠正任务 `' + TASK + '` 原位纠正并提交推送；'
    '据此进入 ChatGPT 从远程 Git 对 R4 的复审与项目负责人对 `5173` 的人工视觉交互复核，'
    '随后另立任务执行 `DSS-AC-114~118` 共 5 条新增验收；'
    '实现完成**不等于**代码复审通过、**不等于**本轮 5 条新增验收已执行、**不等于**最终接受收口。'
    '历史（2026-09-15 R3 证据脚本纠正任务提交并推送后）**本入口曾为 `' + E_R3 + '`'
    '（2026-09-15 R3 证据脚本纠正任务提交后的历史入口，已由 R4 接续，不构成当前直接值）**）'
)

# --- 插入到历史链首位的 R3 入口条目 ---
R3_HIST = (
    'R3 入口 `' + E_R3 + '` 为 2026-09-15 R3 证据脚本纠正任务提交后的历史入口，'
    '已由 `' + TASK + '` 接续，不构成当前直接值；'
)

R4_RECORD = (
    '> 查询按钮与表格布局稳定性 R4 结果事实纠正记录（2026-09-15，`' + TASK + '`，'
    '纯文档结果事实纠正任务；不改前端/后端代码、不改项目测试、不改 CSS、不改断言、'
    '不改 R3 已修复的证据脚本逻辑、不访问数据库/ZooKeeper/Kafka、不启停服务、'
    '不执行 `DSS-AC-114~118`、不清理任何 worktree）：'
    'ChatGPT 从远程 Git 对 R3 结果提交 `64004ca062a92ab40e07350e231d97befe6f496c` 的复审结论为 '
    '`chatgpt_r3_review_status=CHANGES_REQUIRED_TWO_RESULT_FACT_CORRECTIONS_ONLY`'
    '（`r3_evidence_script_correction_review_status=APPROVED`、'
    '`r3_business_implementation_status=PRESERVED_APPROVED`）。R4 只纠正两处**结果事实**：'
    '① 三个按钮的 62/62/110px 是**固定宽度**，字段口径为 `query_button_fixed_width_px=62`、'
    '`reset_button_fixed_width_px=62`、`refresh_button_fixed_width_px=110`；'
    '它们不是按钮高度，R4 不建立、不测量、不修改任何按钮高度基线'
    '（`button_height_baseline_status=NOT_DEFINED_NOT_CHANGED`，当前未限定高度字段计数为 `0`），'
    '亦不修改前端 CSS；凡以高度命名的同类字段一律标记为'
    '“R3 结果输出中的错误字段名，已由 R4 纠正”，不作当前事实。'
    '② R2 证据 README 在 R2 结果提交 `09e268f905d083d6237b4dfc446198b4c5157661` 中**不存在**：'
    '`git cat-file -e` 真实退出码 `128`、`git ls-tree -r --name-only` 无该路径、'
    '`git diff-tree` 在 R3 提交中标记为 `A`，其真实口径为 '
    '`r2_evidence_readme_base_status=NOT_PRESENT_AT_R2_RESULT_COMMIT`、'
    '`r2_evidence_readme_creation_status=CREATED_RETROSPECTIVELY_BY_R3`、'
    '`r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE`；'
    '该 README 是 R3 在 R2 证据目录中新增的**R3 回溯说明文件**，不是对 R2 已存在 README 的追加，'
    '“基准 0 字节为完整前缀”只是空前缀性质，不构成 R2 历史文件保留证明；'
    '文件本身无需删除或移动，仅纠正其来源与性质描述。'
    '本轮状态未放宽：`query_button_and_table_layout_stability_document_status=APPROVED`、'
    '`query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、'
    '`query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW`、'
    '`query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN`、'
    '`query_button_and_table_layout_stability_acceptance_status=NOT_RUN`、'
    '`query_button_and_table_layout_stability_acceptance_not_run_count=5`、'
    '`pending_user_review=NO`、`pending_user_confirmation_count=0`；'
    '`DSS-REQ-001~091` 业务行、`DSS-AC-001~118` 完整业务行与状态列、'
    '`DESIGN.md` §14.2/§14.3 映射行、`DESIGN.md` §38、`UI.md` §32、API 与数据库契约正文逐字节不变；'
    '`frontend/**`、`backend/**`、项目测试、SQL、配置、依赖、锁文件、'
    'R3 已修复证据脚本与其他既有证据零差异。'
    '本轮**未**运行测试、构建、浏览器几何验证或正式验收，**未**访问数据库/ZooKeeper/Kafka，'
    '**未**启停任何服务。报告见 `' + DSS + '/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4.md`。'
)

R3_REPORT_APPEND = (
    '## 14. ChatGPT R3 复审与 R4 结果事实纠正记录（append-only 追加，2026-09-15）\n'
    '\n'
    '> 本节由 `' + TASK + '` 在文末追加。基准 `' + BASE + '` 中本文件的全部原始字节构成修改后文件的'
    '**完整字节前缀**；未删除、未替换、未移动、未原位编辑任何既有内容。\n'
    '\n'
    '### 14.1 ChatGPT 从远程 Git 的 R3 复审结论\n'
    '\n'
    '```text\n'
    'chatgpt_r3_review_status=CHANGES_REQUIRED_TWO_RESULT_FACT_CORRECTIONS_ONLY\n'
    'r3_evidence_script_correction_review_status=APPROVED\n'
    'r3_business_implementation_status=PRESERVED_APPROVED\n'
    '```\n'
    '\n'
    'R3 对 `scripts/run-checks.py` 的 `--staged` 路径解析修复与共享判定负向自测**被认可且不被推翻**，'
    '本轮不得再次修改该脚本：`r3_evidence_script_correction_status=PASS`、'
    '`r3_evidence_script_reproducibility_status=PASS`、`r3_evidence_script_change_status=ZERO`。\n'
    '\n'
    '### 14.2 纠正一：62/62/110px 是固定宽度，不是高度\n'
    '\n'
    '本报告 §10 末段的「查询按钮 62px、重置 62px、刷新 110px」是**固定宽度**口径，'
    '正确字段名为 `query_button_fixed_width_px=62`、`reset_button_fixed_width_px=62`、'
    '`refresh_button_fixed_width_px=110`。上述原文属历史记录，按 append-only 规则**不改写**；'
    '本节作为其唯一定性说明。R3 结果输出中如以高度命名同一批数值，属'
    '“R3 结果输出中的错误字段名，已由 R4 纠正”，不构成当前事实，也不是本报告正文的表述。\n'
    '\n'
    'R4 **未**建立、**未**测量、**未**修改任何按钮高度基线：'
    '`button_height_baseline_status=NOT_DEFINED_NOT_CHANGED`；'
    '基准提交中未限定高度字段的当前事实计数为 `0`；`frontend/**` 零差异，未重新测量按钮。\n'
    '\n'
    '### 14.3 纠正二：R2 证据 README 的真实 Git 对象状态\n'
    '\n'
    '本报告 §8.2 把 `evidence/...-R2/README.md` 记为「在基准中**不存在**（基准字节 0），'
    '故 append-only 以‘基准字节 0 为完整前缀’成立」。该表述与 Git 对象事实一致的部分是'
    '「不存在」，但其 append-only 措辞不精确，容易与「存在一个被跟踪的 0 字节文件」混淆。'
    '按 R4 提示词 §5.4，R4 以 Git 对象机器判定选取唯一分支：\n'
    '\n'
    '```text\n'
    'r2_result_commit_id=09e268f905d083d6237b4dfc446198b4c5157661\n'
    'r2_evidence_readme_git_object_status=NOT_PRESENT\n'
    'r2_evidence_readme_cat_file_exit_code=128\n'
    'r2_evidence_readme_base_blob_size_bytes=NOT_APPLICABLE\n'
    'r2_evidence_readme_base_status=NOT_PRESENT_AT_R2_RESULT_COMMIT\n'
    'r2_evidence_readme_creation_status=CREATED_RETROSPECTIVELY_BY_R3\n'
    'r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE\n'
    'r2_evidence_readme_ambiguous_zero_byte_claim_count=0\n'
    '```\n'
    '\n'
    '判定命令与真实输出见 R4 证据目录 `records/02-r2-readme-git-object-judgement.txt`'
    '（含原始命令、标准输出、标准错误与真实退出码）。'
    '结论：R3 创建的是位于 R2 证据目录中的**R3 回溯说明文件**，不是对 R2 已存在 README 的追加；'
    '“基准 0 字节为完整前缀”只是空前缀性质，不能作为 R2 历史文件保留证明；'
    '该文件无需删除或移动，只纠正其来源与性质描述。\n'
    '\n'
    '### 14.4 冻结与未执行范围\n'
    '\n'
    'R4 相对 ' + BASE[:7] + ' 的冻结结论与 R3 一致：需求 `DSS-REQ-001~091`（91 行）业务行、'
    '验收 `DSS-AC-001~118`（118 行）完整业务行与状态列、`DESIGN.md` §14.2/§14.3 映射行、'
    '`DESIGN.md` §38、`UI.md` §32、API/DATABASE 契约正文逐字节不变；'
    '`frontend/**`、`backend/**`、项目测试、SQL、配置、依赖与锁文件零差异；'
    'R2 `run-checks.py` 与基准逐字节不变；`DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`。\n'
    '\n'
    'R4 **未**重跑任何业务测试、**未**执行前端或后端构建、**未**做浏览器几何验证、'
    '**未**执行 `DSS-AC-114~118`、**未**开始正式验收、**未**访问数据库/ZooKeeper/Kafka、'
    '**未**启停 `5173`/`8080` 服务、**未**清理任何 worktree。'
    '文档事实纠正**不等于**代码复审通过、**不等于**新增验收已执行、**不等于**最终接受收口。\n'
)

R2_EV_README_APPEND = (
    '## 6. R4 对本文基准口径的纠正（append-only 追加，2026-09-15）\n'
    '\n'
    '> 本节由 `' + TASK + '` 在文末追加。基准 `' + BASE + '` 中本文件的全部原始字节构成'
    '修改后文件的**完整字节前缀**；未删除、未替换、未移动、未原位编辑任何既有内容。\n'
    '\n'
    '第 1 节原文写「基准 `09e268f905d083d6237b4dfc446198b4c5157661` 中本路径**不存在**，'
    '因此基准字节为 0 字节 …… append-only 前缀性质平凡成立」。'
    '其中「不存在」与 Git 对象事实一致，但「基准 0 字节」的写法不足以区分'
    '「R2 结果提交中根本不存在该文件」与「R2 结果提交中存在一个被 Git 跟踪的 0 字节文件」。'
    'R4 按提示词 §5 以 Git 对象机器判定选取唯一分支：\n'
    '\n'
    '```text\n'
    'r2_evidence_readme_git_object_status=NOT_PRESENT\n'
    'r2_evidence_readme_cat_file_exit_code=128\n'
    'r2_evidence_readme_base_blob_size_bytes=NOT_APPLICABLE\n'
    'r2_evidence_readme_base_status=NOT_PRESENT_AT_R2_RESULT_COMMIT\n'
    'r2_evidence_readme_creation_status=CREATED_RETROSPECTIVELY_BY_R3\n'
    'r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE\n'
    '```\n'
    '\n'
    '即：本文件在 R2 结果提交 `09e268f905d083d6237b4dfc446198b4c5157661` 中**不存在**，'
    '由 `' + TASK_R3 + '` 在 R3 结果提交 `' + BASE + '` 中创建。'
    '它是位于 R2 证据目录中的 **R3 回溯说明文件**，不是对 R2 已存在 README 的追加；'
    '其 `append-only` 应为 `NOT_APPLICABLE_NO_BASE_FILE`，而非 PASS。'
    '本文件无需删除或移动，仅纠正来源与性质描述。\n'
    '\n'
    '判定命令与真实输出（含原始标准输出、标准错误与退出码）见 '
    '`' + DSS + '/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4/records/02-r2-readme-git-object-judgement.txt`。\n'
)

R3_EV_README_APPEND = (
    '## 8. R4 对第 2 节表的基准口径纠正（append-only 追加，2026-09-15）\n'
    '\n'
    '> 本节由 `' + TASK + '` 在文末追加。基准 `' + BASE + '` 中本文件的全部原始字节构成'
    '修改后文件的**完整字节前缀**；未删除、未替换、未移动、未原位编辑任何既有内容。\n'
    '\n'
    '第 2 节表把 `records/05-append-only-proofs.txt` 描述为'
    '「R2 报告 / R2 证据 README 的 append-only 证明」。该描述对 R2 **报告**成立，'
    '但对 R2 **证据 README** 不成立：后者在 R2 结果提交 '
    '`09e268f905d083d6237b4dfc446198b4c5157661` 中**不存在**，由 R3 创建，'
    '因此不存在可追加的基准文件。其唯一正确口径为：\n'
    '\n'
    '```text\n'
    'r2_evidence_readme_git_object_status=NOT_PRESENT\n'
    'r2_evidence_readme_cat_file_exit_code=128\n'
    'r2_evidence_readme_base_blob_size_bytes=NOT_APPLICABLE\n'
    'r2_evidence_readme_base_status=NOT_PRESENT_AT_R2_RESULT_COMMIT\n'
    'r2_evidence_readme_creation_status=CREATED_RETROSPECTIVELY_BY_R3\n'
    'r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE\n'
    '```\n'
    '\n'
    '`records/05-append-only-proofs.txt` 中「基准字节 0」只是空前缀性质，'
    '不构成 R2 历史文件保留证明，也不是 `append-only=PASS` 的依据。'
    '该原始记录按规则**不原位修改**，纠正仅以本节与 R4 证据目录为准。\n'
    '\n'
    '另外，第 2 节表与第 4 节中出现的按钮尺寸描述一律应按**固定宽度**理解：'
    '`query_button_fixed_width_px=62`、`reset_button_fixed_width_px=62`、'
    '`refresh_button_fixed_width_px=110`；它们不是按钮高度，'
    'R4 不建立、不测量、不修改任何按钮高度基线。\n'
)


def git(*args):
    return subprocess.run(['git', '-C', WT] + list(args), capture_output=True)


def base_text(rel):
    """基准 blob 文本；基准不存在返回 None。"""
    r = git('show', '%s:%s' % (BASE, rel))
    if r.returncode != 0:
        return None
    return r.stdout.decode('utf-8')


def read_text(rel):
    with open(os.path.join(WT, rel), encoding='utf-8') as fh:
        return fh.read()


def write_text(rel, text):
    with open(os.path.join(WT, rel), 'w', encoding='utf-8') as fh:
        fh.write(text)


def find_paren_end(text, start):
    """从 text[start] == '（' 起按嵌套深度找配对的 '）'。"""
    assert text[start] == '（', text[start:start + 10]
    depth = 0
    for i in range(start, len(text)):
        c = text[i]
        if c == '（':
            depth += 1
        elif c == '）':
            depth -= 1
            if depth == 0:
                return i
    raise ValueError('未闭合的括号 @%d' % start)


def rewrite_blocks(text):
    """B1 改写 + 历史链插入。返回 (text, n_b1, n_hist)。"""
    # 先把 M1（B1 块，可能含嵌套括号）整体替换
    n_b1 = 0
    out = []
    i = 0
    while True:
        j = text.find(M1, i)
        if j < 0:
            out.append(text[i:])
            break
        end = find_paren_end(text, j)
        out.append(text[i:j])
        out.append(B1_NEW)
        i = end + 1
        n_b1 += 1
    text = ''.join(out)

    # 再把 R3 入口条目插入到每个历史链块的开头
    n_hist = 0
    out = []
    i = 0
    while True:
        j = text.find(M234, i)
        if j < 0:
            out.append(text[i:])
            break
        out.append(text[i:j + 1])   # 保留 '（'
        out.append(R3_HIST)
        i = j + 1
        n_hist += 1
    text = ''.join(out)
    return text, n_b1, n_hist


def append_block(text, block):
    """文末追加：去除块自身首尾换行，保证唯一一个结尾换行，不产生 EOF 空行。"""
    body = block.strip('\n')
    return text.rstrip('\n') + '\n\n' + body + '\n'


def main():
    changed = []
    problems = []

    # ---------- 1. 八份入口文档 ----------
    for rel in ENTRY_DOCS:
        src = base_text(rel)
        if src is None:
            problems.append('基准缺少 %s' % rel)
            continue
        n_r3 = src.count(E_R3)
        if n_r3 != 4:
            problems.append('%s: 基准中 R3 下一入口令牌出现 %d 次（期望 4）' % (rel, n_r3))
            continue
        t = src.replace(E_R3, E_R4)
        t, n_b1, n_hist = rewrite_blocks(t)
        # features/README.md 的 4 处令牌为 2×B1 + 2×历史链；其余文档为 1×B1 + 3×历史链
        layout_a = rel == 'docs/features/README.md'
        exp_b1 = 2 if layout_a else 1
        exp_hist = 2 if layout_a else 3
        if n_b1 != exp_b1:
            problems.append('%s: B1 块改写 %d 处（期望 %d）' % (rel, n_b1, exp_b1))
        if n_hist != exp_hist:
            problems.append('%s: 历史链插入 %d 处（期望 %d）' % (rel, n_hist, exp_hist))
        t = append_block(t, R4_RECORD)
        if t != read_text(rel):
            write_text(rel, t)
            changed.append(rel)
        print('  %-62s R3→R4=%d  B1=%d  hist=%d  bytes=%d→%d'
              % (rel, n_r3, n_b1, n_hist, len(src.encode()), len(t.encode())))

    # ---------- 2. 历史文件：严格 append-only ----------
    for rel, block in ((R3_REPORT, R3_REPORT_APPEND),
                       (R2_EV_README, R2_EV_README_APPEND),
                       (R3_EV_README, R3_EV_README_APPEND)):
        src = base_text(rel)
        if src is None:
            problems.append('基准缺少 %s' % rel)
            continue
        t = append_block(src, block)
        assert t.startswith(src), '%s 追加后不再是基准字节前缀' % rel
        if t != read_text(rel):
            write_text(rel, t)
            changed.append(rel)
        print('  %-62s append-only  基准=%d  现在=%d  追加=%d 前缀=%s'
              % (rel.split('/')[-1], len(src.encode()), len(t.encode()),
                 len(t.encode()) - len(src.encode()),
                 t.encode().startswith(src.encode())))

    print()
    print('changed_files=%d' % len(changed))
    for c in changed:
        print('  %s' % c)
    if problems:
        print()
        print('PROBLEMS:')
        for p in problems:
            print('  %s' % p)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
