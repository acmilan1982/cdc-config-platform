#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R3 证据脚本纠正任务：八份入口文档、R2 报告与 R2 证据 README 的**基准派生**声明式编辑表。

本脚本同时承担两个角色：

1. 生成器：以 `git show <基准>:<路径>` 读取基准 blob，在内存中施加声明的锚定编辑
   （每处断言锚点出现次数严格等于声明值），默认 dry-run，`--apply` 才写盘。
   因此纠正结果由「基准 + 声明编辑」唯一决定，`--apply` 幂等。
2. 声明表：`EDITS` 是 R3 允许的全部文本改动的唯一权威列表，供
   `...-R2/scripts/run-checks.py` 复用做「当前字节 == 基准 + 声明编辑」与
   区域往返（region round-trip）证明。

R3 只做三件事：

- 当前下一入口 R2 → R3，R2 入口降级为「已由 R3 接续」的带日期历史事实；
- 追加一条 R3 证据脚本纠正记录；
- 把 R2 提交时的不准确可复现性声明明确限定为「已由 R3 纠正」。

不修改任何需求、验收、设计、UI、API 或数据库业务内容。
"""
import importlib.util
import io
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
R3EVID = os.path.dirname(HERE)                      # .../evidence/...-R3
EVID = os.path.dirname(R3EVID)                      # .../evidence
R2DIR = os.path.join(EVID, 'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-'
                           'LAYOUT-STABILITY-IMPLEMENTATION-001-R2')
WT = os.path.normpath(os.path.join(EVID, '..', '..', '..', '..'))
BASE = '09e268f905d083d6237b4dfc446198b4c5157661'

DSS = 'docs/features/data-source-snapshot-status/'
D8 = [DSS + n for n in ('README.md', 'REQUIREMENTS.md', 'ACCEPTANCE.md', 'DESIGN.md',
                        'UI.md', 'API.md', 'DATABASE.md')] + ['docs/features/README.md']
FREAD = 'docs/features/README.md'
R2REPORT = (DSS + 'reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
            'STABILITY-IMPLEMENTATION-001-R2.md')
R3REPORT = (DSS + 'reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
            'STABILITY-IMPLEMENTATION-001-R3.md')
R2EV_README = (DSS + 'evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
               'STABILITY-IMPLEMENTATION-001-R2/README.md')
R2SCRIPT = (DSS + 'evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
            'STABILITY-IMPLEMENTATION-001-R2/scripts/run-checks.py')

TASK_R3 = ('DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-'
           'IMPLEMENTATION-001-R3')
T_R3 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R3_REVIEW_FROM_GIT_'
        'THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')

# ---- 复用 R2 声明表常量，保证 R3 锚点与 R2 写入的字节完全一致 ----
sys.dont_write_bytecode = True
_argv = sys.argv[:]
sys.argv = ['r2-docs-correction.py']
try:
    _spec = importlib.util.spec_from_file_location(
        'r2docs', os.path.join(R2DIR, 'scripts', 'r2-docs-correction.py'))
    R2MOD = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(R2MOD)
finally:
    sys.argv = _argv

T_R0 = R2MOD.T_R0
T_R1 = R2MOD.T_R1
T_R2 = R2MOD.T_R2
TASK_R2 = R2MOD.TASK_R2
R1_PARA_BODY = R2MOD.R1_PARA_BODY
R1_TAIL = R2MOD.R1_TAIL_NEW
R2_PREFIX = '（**当前直接值（2026-09-15 R2 定向纠正任务提交并推送后）**：'
assert R2MOD.R2_CUR_HEAD.startswith(R2_PREFIX), 'R2_CUR_HEAD 结构变化，R3 拒绝继续'
R2_PARA_BODY = R2MOD.R2_CUR_HEAD[len(R2_PREFIX):]
assert R1_TAIL.startswith('当前统一下一入口 `%s`' % T_R2), 'R2 尾句结构变化，R3 拒绝继续'

# ---- R3 当前值段落 ----
R3_PREFIX = '（**当前直接值（2026-09-15 R3 证据脚本纠正任务提交并推送后）**：'
R3_PARA_BODY = (
    'ChatGPT 从远程 Git 对 R2 结果提交 `%s` 的复审结论为 '
    '`chatgpt_r2_review_status=CHANGES_REQUIRED_EVIDENCE_SCRIPT_REPRODUCIBILITY_ONLY`'
    '（`r2_document_fact_separation_review_status=APPROVED`、'
    '`r2_business_implementation_status=PRESERVED_APPROVED`、'
    '`r2_evidence_script_reproducibility_status=CHANGES_REQUIRED`），唯一残余问题是 R2 提交中的'
    '证据校验脚本副本在 `--staged` 分支截断了路径前三个字符，已由极小定向纠正任务 `%s` '
    '原位修复并提交推送；据此进入 ChatGPT 从远程 Git 对 R3 的实现复审与项目负责人对 `5173` 的'
    '人工视觉交互复核，随后另立任务执行 `DSS-AC-114~118` 共 5 条新增验收；实现完成**不等于**'
    '代码复审通过、**不等于**本轮 5 条新增验收已执行、**不等于**最终接受收口）。'
    % (BASE, TASK_R3))
R3_CUR_HEAD = R3_PREFIX + R3_PARA_BODY

R2_HIST = ('历史（2026-09-15 R2 定向纠正任务提交并推送后）该入口曾为 `%s`'
           '（**2026-09-15 R2 定向纠正任务提交后的历史入口，已由 `%s` 接续，'
           '不构成当前直接值**：%s' % (T_R2, TASK_R3, R2_PARA_BODY))
R1_HIST = ('历史（2026-09-15 R1 定向纠正任务提交并推送后）该入口曾为 `%s`'
           '（**2026-09-15 R1 定向纠正任务提交后的历史入口，已由 `%s` 接续，'
           '不构成当前直接值**：%s' % (T_R1, TASK_R2, R1_PARA_BODY))
R2_HIST_ROW = R2_HIST.replace('该入口曾为', '本行统一入口曾为')
R1_HIST_ROW = R1_HIST.replace('该入口曾为', '本行统一入口曾为')

R3_TAIL = ('当前统一下一入口 `%s`（R2 入口 `%s` 为 2026-09-15 R2 定向纠正任务提交后的历史入口，'
           '已由 `%s` 接续，不构成当前直接值；R1 入口 `%s` 为 2026-09-15 R1 定向纠正任务提交后的'
           '历史入口，已由 `%s` 接续，不构成当前直接值；R0 入口 `%s` 为 2026-09-15 R0 实现提交后的'
           '历史入口，已由 R1 纠正任务处理，不构成当前直接值）。'
           % (T_R3, T_R2, TASK_R3, T_R1, TASK_R2, T_R0))

# ---- R2 报告中过强表述的原文与限定语 ----
CLAIM_SCRIPT = ('校验脚本 `scripts/run-checks.py` 对每项断言失败均返回真实非零退出码；'
                '本清单结果由该脚本真实执行产生，未以"脚本成功运行"代替断言结论。')
CLAIM_OUTPUT = 'checks/01-section10-checks.txt                 # §10 校验输出（25 项全 PASS）'
QUALIFIER = 'R2 提交时的不准确可复现性声明，已由 R3 纠正'

R3_QUALIFY = (
    '本报告 §8 结尾的「%s」与 §9 文件清单中的「%s」属于 %s：'
    'R2 提交中的 `scripts/run-checks.py` 副本在 `--staged` 分支无条件截断了路径前 3 个字符，'
    '因此该提交副本在今天复跑 `--staged` 会误报白名单失败，'
    '§10-27 的通过结论**不可**由该提交副本直接复现；R2 当时手工核验的对象是工作区中'
    '已修复但**未再次暂存**的副本。两个事实必须分开：'
    '**R2 实际提交范围**经独立检查合规（对 `09e268f...` 执行 `git show --name-only`，'
    '21 条路径全部属于 R2 白名单，'
    '`r2_changed_path_whitelist_independent_recheck_status=PASS`），'
    '而 **R2 已提交脚本的可复现性**确认为失败'
    '（`r2_committed_evidence_script_staged_replay_status=FAIL_KNOWN_PARSER_DEFECT`）。'
    '不得把二者混写为「R2 已提交脚本自身可复跑成功」。'
    % (CLAIM_SCRIPT, CLAIM_OUTPUT, QUALIFIER))

# ---- 文末追加的 R3 记录块（单行 blockquote，与 R2 记录块同类） ----
R3_BLOCK = (
    '> 查询按钮与表格布局稳定性实现 R3 证据脚本纠正记录（2026-09-15，`%s`，纯文档与证据工具的'
    '极小定向纠正任务；不改代码、不改测试、不改 CSS、不改断言、不启停服务、不访问'
    '数据库/ZooKeeper/Kafka、不执行 `DSS-AC-114~118`、不清理任何 worktree）：ChatGPT 从远程 Git '
    '对 R2 结果提交 `%s` 的复审结论为 '
    '`chatgpt_r2_review_status=CHANGES_REQUIRED_EVIDENCE_SCRIPT_REPRODUCIBILITY_ONLY`'
    '（`r2_document_fact_separation_review_status=APPROVED`、'
    '`r2_business_implementation_status=PRESERVED_APPROVED`、'
    '`r2_evidence_script_reproducibility_status=CHANGES_REQUIRED`）；R2 的文档事实分层结论、业务实现'
    '结论与状态纠正结论均有效、不被推翻，本轮只修复证据工具的复现性。发现的唯一问题是 R2 提交中的'
    '校验脚本副本 `%s` 在 `--staged` 分支对 `git diff --cached --name-only` 的**裸路径**输出使用了 '
    '`ln[3:]`，无条件截断前 3 个字符，使合法白名单路径被误判为越界、提交后复跑必然误报失败'
    '（%s；R2 实际提交范围经独立检查仍为合规，'
    '`r2_changed_path_whitelist_independent_recheck_status=PASS`）。R3 已把路径解析与白名单判定'
    '收敛为同一套共享纯函数，普通模式与 `--staged` 模式共用同一判定，并新增 `--verify-paths` '
    '负向自测入口；修复后的真实退出码见 R3 报告与 R3 证据目录。本轮不改变任何业务实现、CSS、断言、'
    '验收业务行或冻结边界：`query_button_and_table_layout_stability_document_status=APPROVED`、'
    '`query_button_and_table_layout_stability_implementation_status='
    'IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、'
    '`query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW`、'
    '`query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN`、'
    '`query_button_and_table_layout_stability_acceptance_status=NOT_RUN`、'
    '`query_button_and_table_layout_stability_acceptance_not_run_count=5`、`pending_user_review=NO`、'
    '`pending_user_confirmation_count=0`；既有 `DSS-AC-001~113` 保持 '
    '`PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`，本轮 `DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`。'
    '**实现完成不等于代码复审通过、不等于本轮 5 条新增验收已执行、不等于最终接受收口**；'
    '当前统一下一入口 `%s`（R2 入口 `%s` 为 2026-09-15 R2 定向纠正任务提交后的历史入口，'
    '已由本 R3 证据脚本纠正任务接续，不构成当前直接值）。报告见 '
    '`%s`。'
    % (TASK_R3, BASE, R2SCRIPT, QUALIFIER, T_R3, T_R2, R3REPORT))

# ---- R2 报告文末追加章节（多行，非 blockquote） ----
R3_REPORT_APPEND = (
    '\n## 12. ChatGPT R2 复审与 R3 证据脚本纠正记录（append-only 追加，2026-09-15）\n'
    '\n'
    '> 本节由 `%s` 在文末追加。基准 `%s` 中本文件的全部原始字节构成修改后文件的**完整字节前缀**；'
    '未删除、未替换、未移动、未原位编辑任何既有内容。\n'
    '\n'
    '### 12.1 ChatGPT 从远程 Git 的 R2 复审结论\n'
    '\n'
    '```text\n'
    'chatgpt_r2_review_status=CHANGES_REQUIRED_EVIDENCE_SCRIPT_REPRODUCIBILITY_ONLY\n'
    'r2_document_fact_separation_review_status=APPROVED\n'
    'r2_business_implementation_status=PRESERVED_APPROVED\n'
    'r2_evidence_script_reproducibility_status=CHANGES_REQUIRED\n'
    '```\n'
    '\n'
    'R2 的文档事实分层结论、业务实现结论与状态纠正结论**均不被推翻**：本报告 §2～§6 的事实分层与 '
    'append-only 证明继续有效，§11 的状态与下一入口表述也未被撤销。本轮唯一需要纠正的是'
    '**证据工具的可复现性**。\n'
    '\n'
    '### 12.2 缺陷根因与修复前的真实复跑\n'
    '\n'
    'R2 提交中的 `scripts/run-checks.py` 副本在 `--staged` 分支写作：\n'
    '\n'
    '```python\n'
    "stg = [ln[3:].strip() for ln in git('diff', '--cached', '--name-only').stdout.splitlines() if ln.strip()]\n"
    '```\n'
    '\n'
    '`git diff --cached --name-only` 输出的是**裸路径**，不含 `XY ` 状态前缀；而同一脚本对 '
    '`git status --porcelain`（**含** `XY ` 前缀）使用 `ln[3:]` 是正确的。两种输出格式不同却用了'
    '同一种截取方式，于是 `--staged` 复跑会把每个已暂存路径的前 3 个字符无条件吃掉'
    '（例如 `docs/features/...` 变成 `s/features/...`），使**全部**合法白名单路径被误判为越界并'
    '返回非零退出码。这是确定性的解析缺陷，与仓库内容无关，可稳定复现。\n'
    '\n'
    '使用 R2 提交中的原始字节（未做任何修改）真实复跑的结果见 R3 证据目录 '
    '`records/` 下的修复前复跑记录：退出码为非零，输出同时给出被截断的解析结果与完整的真实路径。\n'
    '\n'
    '### 12.3 两个必须分开的事实\n'
    '\n'
    '- **R2 实际提交范围**：经独立检查合规。对提交 `09e268f...` 执行 `git show --name-only`，'
    '21 条路径全部属于 R2 白名单，'
    '`r2_changed_path_whitelist_independent_recheck_status=PASS`；\n'
    '- **R2 已提交脚本的可复现性**：失败，'
    '`r2_committed_evidence_script_staged_replay_status=FAIL_KNOWN_PARSER_DEFECT`。\n'
    '\n'
    '二者是两个事实，不得混写为「R2 已提交脚本自身可复跑成功」。\n'
    '\n'
    '### 12.4 本报告过强表述的限定\n'
    '\n'
    '%s\n'
    '\n'
    '### 12.5 R3 修复内容与真实退出码\n'
    '\n'
    'R2 证据脚本 `scripts/run-checks.py` 已由 R3 修复：路径解析与白名单判定收敛为同一套共享纯函数 '
    '`parse_path_lines()` / `judge_paths()`（普通模式与 `--staged` 模式共用同一判定），'
    '`git status --porcelain` 的 `XY ` 前缀由独立的 `parse_porcelain()` 处理；新增 '
    '`--verify-paths <路径清单>` 负向自测入口；判定失败真实返回非零退出码，成功真实返回 0，'
    '异常不外吞。修复后真实退出码见 R3 报告 §5 与 R3 证据目录 `records/`。\n'
    '\n'
    '### 12.6 本轮未执行的范围\n'
    '\n'
    'R3 **未**重跑任何业务测试、**未**执行前端或后端构建、**未**做浏览器几何验证、'
    '**未**执行 `DSS-AC-114~118`、**未**开始正式验收、**未**访问数据库/ZooKeeper/Kafka、'
    '**未**启停 `5173`/`8080` 服务、**未**清理任何 worktree。证据脚本复跑只是证据工具的自我核验，'
    '**不得**写成正式验收。\n'
    % (TASK_R3, BASE, R3_QUALIFY))

# ---- R2 证据 README（基准中不存在，基准字节视作 0） ----
R2EV_README_TEXT = (
    '# R2 证据目录说明（R3 追加）\n'
    '\n'
    '本 README 由 `%s` 创建并写入。基准 `%s` 中本路径**不存在**，'
    '因此基准字节为 0 字节、删除字节与删除行均为 `0`，append-only 前缀性质平凡成立；'
    'R2 当时没有任何本文件内容被覆盖或篡改。\n'
    '\n'
    '## 1. R2 证据目录用途\n'
    '\n'
    '本目录保存 `%s`（R2 定向纠正任务）的证据：'
    '§10 提交前校验输出、状态冲突扫描、R1 报告 append-only 证明、worktree 与 Git 现场快照，'
    '以及可复跑的校验脚本。\n'
    '\n'
    '## 2. 已知缺陷（R3 记录）\n'
    '\n'
    '- **缺陷位置**：`scripts/run-checks.py` 的 `--staged` 分支；\n'
    '- **缺陷写法**：`stg = [ln[3:].strip() for ln in git(\'diff\', \'--cached\', '
    '\'--name-only\').stdout.splitlines() if ln.strip()]`；\n'
    '- **根因**：`git diff --cached --name-only` 输出**裸路径**，不含 `XY ` 状态前缀，'
    '却被无条件截断前 3 个字符，于是每个合法白名单路径都变成残缺路径并被误判为越界；\n'
    '- **影响**：该副本提交后复跑 `--staged` 必然误报白名单失败并返回非零退出码；'
    '（%s）\n'
    '- **不影响**：R2 的实际提交范围（21 条路径）经独立检查仍然合规。\n'
    '\n'
    '## 3. R3 修复位置\n'
    '\n'
    '同一路径 `scripts/run-checks.py` 已由 `%s` 修复：路径解析与白名单判定收敛为同一套共享纯函数 '
    '`parse_path_lines()` / `judge_paths()`，普通模式与 `--staged` 模式共用；'
    '`git status --porcelain` 的 `XY ` 前缀改由独立的 `parse_porcelain()` 处理；'
    '新增 `--verify-paths <路径清单>` 负向自测入口。修复后的真实退出码见 R3 证据目录。\n'
    '\n'
    '## 4. 复跑方式\n'
    '\n'
    '```bash\n'
    '# 普通模式（校验工作区相对基准的差异）\n'
    'python3 docs/features/data-source-snapshot-status/evidence/'
    'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/'
    'scripts/run-checks.py\n'
    '\n'
    '# 暂存模式（追加校验暂存区路径白名单）\n'
    'python3 docs/features/data-source-snapshot-status/evidence/'
    'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/'
    'scripts/run-checks.py --staged\n'
    '\n'
    '# 负向自测入口（白名单外路径必须导致非零退出码）\n'
    'python3 docs/features/data-source-snapshot-status/evidence/'
    'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/'
    'scripts/run-checks.py --verify-paths <路径清单文件>\n'
    '```\n'
    '\n'
    '## 5. R3 证据入口\n'
    '\n'
    'R3 证据目录：`docs/features/data-source-snapshot-status/evidence/'
    'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3/`'
    '（共享判定负向自测、修复前复跑、修复后普通/`--staged` 复跑、append-only 与冻结区记录）。\n'
    '\n'
    '报告：`docs/features/data-source-snapshot-status/reports/'
    'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3.md`。\n'
    % (TASK_R3, BASE, TASK_R2, QUALIFIER, TASK_R3))

# ---- 声明式编辑表 ----
EDITS = []

for rel in [r for r in D8 if r != FREAD]:
    EDITS.append((rel,
                  '`current_next_entry=%s`（R1 入口 `%s` 为 2026-09-15 R1 定向纠正任务提交后的历史入口，'
                  '已由 `%s` 接续，不构成当前直接值）。' % (T_R2, T_R1, TASK_R2),
                  '`current_next_entry=%s`（R2 入口 `%s` 为 2026-09-15 R2 定向纠正任务提交后的历史入口，'
                  '已由 `%s` 接续，不构成当前直接值；R1 入口 `%s` 为 2026-09-15 R1 定向纠正任务提交后的'
                  '历史入口，已由 `%s` 接续，不构成当前直接值）。'
                  % (T_R3, T_R2, TASK_R3, T_R1, TASK_R2), 1))
    EDITS.append((rel,
                  '`%s`%s%s' % (T_R2, R2MOD.R2_CUR_HEAD, R1_HIST),
                  '`%s`%s%s%s' % (T_R3, R3_CUR_HEAD, R2_HIST, R1_HIST), 1))
    EDITS.append((rel, R1_TAIL, R3_TAIL, 1))
    EDITS.append((rel, None, R3_BLOCK, 1))

EDITS.append((FREAD,
              '**`%s`**%s%s' % (T_R2, R2MOD.R2_CUR_HEAD, R1_HIST_ROW),
              '**`%s`**%s%s%s' % (T_R3, R3_CUR_HEAD, R2_HIST_ROW, R1_HIST_ROW), 1))
EDITS.append((FREAD,
              '其统一下一入口当前为 `%s`%s%s' % (T_R2, R2MOD.R2_CUR_HEAD, R1_HIST),
              '其统一下一入口当前为 `%s`%s%s%s'
              % (T_R3, R3_CUR_HEAD, R2_HIST, R1_HIST), 1))
EDITS.append((FREAD, R1_TAIL, R3_TAIL, 1))
EDITS.append((FREAD, None, R3_BLOCK, 1))

EDITS.append((R2REPORT, None, R3_REPORT_APPEND, 1))
EDITS.append((R2EV_README, None, R2EV_README_TEXT, 1))

BY_FILE = {}
for _rel, _old, _new, _n in EDITS:
    BY_FILE.setdefault(_rel, []).append((_old, _new, _n))


def base_blob(rel):
    """取基准提交的同路径原始内容；基准中不存在的文件返回 None（视作 0 字节）。"""
    out = subprocess.run(['git', '-C', WT, 'show', '%s:%s' % (BASE, rel)],
                         capture_output=True)
    if out.returncode != 0:
        return None
    return out.stdout.decode('utf-8')


def append_block(text, new, had_base):
    """文末追加：既有文件在其后空一行接块；基准中不存在的新文件直接以块内容开头。

    统一去除块自身的首尾空行，避免产生 EOF 空行（`git diff --check` 会报
    「new blank line at EOF」）。
    """
    body = new.strip('\n')
    if not had_base:
        return body + '\n'
    return text + '\n' + body + '\n'


def apply_edits_text(rel, base_text):
    """把该文件的声明编辑施加到基准文本上，返回 (结果文本, 错误列表)。"""
    errs = []
    text = '' if base_text is None else base_text
    for old, new, n in BY_FILE.get(rel, []):
        if old is None:
            text = append_block(text, new, base_text is not None)
            continue
        c = text.count(old)
        if c != n:
            errs.append('锚点出现 %d 次（期望 %d）：%r' % (c, n, old[:80]))
            continue
        text = text.replace(old, new, 1)
    return text, errs


def apply_edits():
    apply_mode = '--apply' in sys.argv
    bad = 0
    for rel in sorted(BY_FILE):
        text, errs = apply_edits_text(rel, base_blob(rel))
        for e in errs:
            print('BAD %-52s %s' % (rel, e))
            bad += 1
        path = os.path.join(WT, rel)
        cur = io.open(path, encoding='utf-8').read() if os.path.exists(path) else None
        same = (cur == text)
        print('%-52s ops=%d  worktree_equals_expected=%s  expected_bytes=%d'
              % (rel, len(BY_FILE[rel]), same, len(text.encode('utf-8'))))
        if not same:
            if apply_mode and not errs:
                with io.open(path, 'w', encoding='utf-8') as fh:
                    fh.write(text)
                print('    -> 已按基准 + 声明编辑重写')
            else:
                bad += 1
    print('edits=%d  bad=%d' % (len(EDITS), bad))
    print('mode=%s' % ('APPLY' if apply_mode else 'DRY_RUN'))
    return 0 if bad == 0 else 1


if __name__ == '__main__':
    sys.exit(apply_edits())
