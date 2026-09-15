#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""查询按钮与表格布局稳定性实现的证据校验脚本（§14 提交前强制校验）。

用法::

    run-checks.py [--staged] [WT] [BASE] [SNAP]
    run-checks.py --verify-paths <路径清单文件>

无位置参数时按脚本自身位置推断 worktree，并使用 R3 基准提交与 R3 证据目录中的
worktree/服务起始快照。

------------------------------------------------------------------------------
R3（2026-09-15）修复说明
------------------------------------------------------------------------------
R2 提交中的本脚本副本在 `--staged` 分支写作::

    stg = [ln[3:].strip() for ln in git('diff', '--cached', '--name-only').stdout.splitlines() if ln.strip()]

但 `git diff --cached --name-only` 输出的是**裸路径**，不含 `XY ` 状态前缀；
无条件截断前 3 个字符会把每个合法路径变成残缺路径（`docs/features/...` →
`s/features/...`），使全部白名单路径被误判为越界、进程返回非零退出码。
`git status --porcelain` 的输出**含** `XY ` 前缀，那里用 `ln[3:]` 才是对的：
两种输出格式不同却共用了同一种截取方式，就是该缺陷的根因。

修复后：

1. 路径解析与白名单判定收敛为同一套纯函数 `parse_path_lines()` /
   `judge_paths()`，普通模式与 `--staged` 模式共用同一判定，避免两套规则漂移；
2. 每行只做安全的首尾空白清理并忽略空行，**绝不无条件截断**；
3. `git status --porcelain` 的 `XY ` 前缀由独立的 `parse_porcelain()` 处理；
4. 判定失败真实返回非零退出码，判定成功真实返回 0，异常不外吞；
5. 输出明确列出模式、判定路径数、失败数与最终结果；
6. 新增 `--verify-paths <路径清单文件>`：对给定路径清单执行同一套判定，
   白名单外路径务必导致真实非零退出码（负向自测入口）；
7. 校验逻辑收敛在 `main()` 内，模块导入无副作用，纯函数可被负向自测直接调用。
"""
import contextlib
import importlib.util
import io
import importlib
import os
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
# HERE = <WT>/docs/features/<feature>/evidence/<dir-R2>/scripts
WT_DEFAULT = os.path.normpath(os.path.join(HERE, '..', '..', '..', '..', '..', '..'))
BASE_DEFAULT = '09e268f905d083d6237b4dfc446198b4c5157661'

DSS = 'docs/features/data-source-snapshot-status/'
D8 = [DSS + n for n in ('README.md', 'REQUIREMENTS.md', 'ACCEPTANCE.md', 'DESIGN.md',
                        'UI.md', 'API.md', 'DATABASE.md')] + ['docs/features/README.md']
FREAD = 'docs/features/README.md'
R0REPORT = (DSS + 'reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
            'STABILITY-IMPLEMENTATION-001.md')
R1REPORT = (DSS + 'reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
            'STABILITY-IMPLEMENTATION-001-R1.md')
R2REPORT = (DSS + 'reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
            'STABILITY-IMPLEMENTATION-001-R2.md')
R3REPORT = (DSS + 'reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
            'STABILITY-IMPLEMENTATION-001-R3.md')
R0EVID = (DSS + 'evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
          'STABILITY-IMPLEMENTATION-001')
R1EVID = R0EVID + '-R1'
R2EVID = R0EVID + '-R2/'
R3EVID = R0EVID + '-R3/'
R2SCRIPT = R2EVID + 'scripts/run-checks.py'
R2EV_README = R2EVID + 'README.md'
R3_EDITS = R3EVID + 'scripts/r3-docs-correction.py'

T_R1 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R1_REVIEW_FROM_GIT_THEN_'
        'PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
T_R2 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R2_REVIEW_FROM_GIT_THEN_'
        'PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
T_R3 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R3_REVIEW_FROM_GIT_THEN_'
        'PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')

# R3 白名单（§11）：八份入口文档 + R2 报告（append-only）+ R3 报告 + R2 证据 README（append-only）
# + R2 证据脚本（本轮修复对象）+ R3 证据目录整体。
WHITELIST = set(D8) | {R2REPORT, R3REPORT, R2EV_README, R2SCRIPT}
EVID_PREFIXES = (R3EVID,)

CLAIM_SCRIPT = ('校验脚本 `scripts/run-checks.py` 对每项断言失败均返回真实非零退出码；'
                '本清单结果由该脚本真实执行产生，未以"脚本成功运行"代替断言结论。')
CLAIM_OUTPUT = 'checks/01-section10-checks.txt                 # §10 校验输出（25 项全 PASS）'
QUALIFIER = 'R2 提交时的不准确可复现性声明，已由 R3 纠正'
R3_SECTION = '## 12. ChatGPT R2 复审与 R3 证据脚本纠正记录'

STATUS_TOKENS = (
    'query_button_and_table_layout_stability_document_status=APPROVED',
    'query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW',
    'query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW',
    'query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN',
    'query_button_and_table_layout_stability_acceptance_status=NOT_RUN',
    'query_button_and_table_layout_stability_acceptance_not_run_count=5',
    'pending_user_review=NO',
    'pending_user_confirmation_count=0',
)

SECRET = re.compile(r'(CDC/CDC@|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+\S{8,}|'
                    r'ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|Authorization:\s*\S)')

# ============================================================================
# 共享判定逻辑
# 普通模式、--staged 模式、--verify-paths 负向自测三处共用下面同一套纯函数。
# ============================================================================
def parse_path_lines(text):
    """解析**裸路径**逐行输出（如 `git diff --cached --name-only`）。

    只做安全的首尾空白清理并忽略空行；**绝不截断**。
    （历史缺陷：把这里当成 `git status --porcelain` 的 `XY <路径>` 格式，无条件 `ln[3:]`。）
    """
    out = []
    for ln in text.splitlines():
        p = ln.strip()
        if p:
            out.append(p)
    return out


def parse_porcelain(text):
    """解析 `git status --porcelain`：每行形如 `XY <路径>`，需剥掉 2 字符状态 + 1 空格。"""
    out = []
    for ln in text.splitlines():
        if len(ln) < 3 or ln[2:3] != ' ':
            continue
        p = ln[3:]
        if ' -> ' in p:
            p = p.split(' -> ')[-1]
        out.append(p.strip().strip('"'))
    return out


def judge_paths(paths, whitelist=None, prefixes=None):
    """共享白名单判定：返回不在白名单内的路径列表（空列表表示全部合法）。"""
    whit = WHITELIST if whitelist is None else whitelist
    pref = EVID_PREFIXES if prefixes is None else prefixes
    return [p for p in paths
            if p not in whit and not any(p.startswith(x) for x in pref)]


# ============================================================================
# 运行期状态（由 main() 设置；模块导入本身无副作用）
# ============================================================================
WT = WT_DEFAULT
BASE = BASE_DEFAULT
SNAP = ''
STAGED = False
HERE_SCRIPT = os.path.abspath(__file__)
results = []
judged_path_count = 0


def rec(no, name, ok, detail):
    results.append((no, name, ok, detail))
    print('[%s] §14-%-2s %-38s :: %s' % ('PASS' if ok else 'FAIL', no, name, detail))


def git(*args):
    return subprocess.run(['git', '-C', WT] + list(args), capture_output=True, text=True)


def blob(rel):
    return git('show', '%s:%s' % (BASE, rel)).stdout


def blob_bytes(rel):
    return subprocess.run(['git', '-C', WT, 'show', '%s:%s' % (BASE, rel)],
                          capture_output=True).stdout


def cur(rel):
    return io.open(os.path.join(WT, rel), encoding='utf-8').read()


def rows(text, pat):
    return [ln for ln in text.split('\n') if re.match(pat, ln)]


def lead_ids(lines, kind):
    out = []
    for ln in lines:
        m = re.match(r'^\| DSS-%s-(\d{3}) \|' % kind, ln)
        if m:
            out.append(m.group(1))
    return out


def exact_set(seq, n):
    return sorted(set(seq)) == ['%03d' % i for i in range(1, n + 1)]


def load_edits_module():
    """载入 R3 声明式编辑表（基准派生证明的唯一权威来源）。"""
    path = os.path.join(WT, R3_EDITS)
    if not os.path.exists(path):
        raise SystemExit('缺少 R3 声明式编辑表，无法执行基准派生证明：%s' % path)
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location('r3docs', path)
    mod = importlib.util.module_from_spec(spec)
    with contextlib.redirect_stdout(io.StringIO()):
        spec.loader.exec_module(mod)
    return mod


def strip_appended_r3(text):
    """剥离文末追加的 R3 记录块。"""
    key = '\n\n> 查询按钮与表格布局稳定性实现 R3 证据脚本纠正记录'
    i = text.find(key)
    if i < 0:
        return None
    return text[:i] + '\n'


# ============================================================================
# --verify-paths：负向自测入口（与生产判定同一套共享逻辑）
# ============================================================================
def run_verify_paths(verify_file):
    """对给定路径清单执行共享判定，并把完整诊断写到 stdout。

    白名单外路径必须导致真实非零退出码。
    """
    paths = parse_path_lines(io.open(verify_file, encoding='utf-8').read())
    outside = judge_paths(paths)
    print('judge_mode=VERIFY_PATHS')
    print('judge_input=%s' % verify_file)
    print('judged_path_count=%d' % len(paths))
    print('failed_path_count=%d' % len(outside))
    for p in paths:
        print('  path=%r  in_whitelist=%s  untruncated=%s'
              % (p, not judge_paths([p]), not (len(p) > 3 and p[0] != '/' and p[2:3] == '/')))
    for p in outside:
        print('  OUTSIDE_WHITELIST: %r' % p)
    print('final_result=%s' % ('FAIL' if outside else 'PASS'))
    return 1 if outside else 0


def main(argv):
    global WT, BASE, SNAP, STAGED, judged_path_count
    if '--verify-paths' in argv:
        return run_verify_paths(argv[argv.index('--verify-paths') + 1])
    STAGED = '--staged' in argv
    positional = [a for a in argv if not a.startswith('--')]
    WT = positional[0] if len(positional) > 0 else WT_DEFAULT
    BASE = positional[1] if len(positional) > 1 else BASE_DEFAULT
    SNAP = positional[2] if len(positional) > 2 else os.path.join(WT, R3EVID, 'records/worktrees-at-start.txt')
    services_snap = os.path.join(WT, R3EVID, 'records/services-at-start.txt')
    EDITS_MOD = load_edits_module()

    def region_roundtrip(rel, marker):
        """证明 [marker, EOF) 区域相对基准只含有声明编辑 + 文末追加。"""
        b = blob(rel)
        c = cur(rel)
        if marker not in b or marker not in c:
            return False, '区域标记缺失'
        base_reg = b[b.index(marker):]
        cur_reg = c[c.index(marker):]
        stripped = strip_appended_r3(cur_reg)
        if stripped is None:
            return False, '未找到文末 R3 追加块'
        text = stripped
        err = None
        for old, new, n in reversed(EDITS_MOD.BY_FILE.get(rel, [])):
            if old is None:
                continue
            cnt = text.count(new)
            if cnt == 0:
                continue
            if cnt != 1:
                err = '逆锚点出现 %d 次（期望 1）：%r' % (cnt, new[:60])
                break
            text = text.replace(new, old, 1)
        if err:
            return False, err
        return text == base_reg, 'region_restored_equals_base=%s' % (text == base_reg)

    def doc_equals_expected(rel):
        """证明当前字节 == 基准字节 + 声明编辑（结果由「基准 + 声明」唯一决定）。"""
        expected, errs = EDITS_MOD.apply_edits_text(rel, EDITS_MOD.base_blob(rel))
        if errs:
            return False, '声明编辑锚点异常：%s' % errs[:1]
        actual = cur(rel) if os.path.exists(os.path.join(WT, rel)) else None
        return actual == expected, 'bytes=%s' % (len(actual.encode('utf-8')) if actual else None)

    # ================= 1 =================
    a = git('diff', '--check').returncode
    rec('1', 'git-diff-check', a == 0, 'git diff --check exit=%d' % a)

    # ================= 2 =================
    paths = parse_porcelain(git('status', '--porcelain').stdout)
    judged_path_count = len(paths)
    outside = judge_paths(paths)
    rec('2', 'whitelist-only-changed-paths', not outside,
        'changed_paths=%d outside_whitelist=%d%s'
        % (len(paths), len(outside), '  [%s]' % outside if outside else ''))

    # ================= 3/4/5/6 =================
    def paths_diff(*pats):
        return git('diff', '--name-only', BASE, '--', *pats).stdout.split()

    f3 = paths_diff('frontend')
    rec('3', 'frontend-zero-diff', not f3,
        'git diff %s -- frontend => %d 个文件 %s' % (BASE[:7], len(f3), f3[:3]))
    b3 = paths_diff('backend')
    rec('4', 'backend-zero-diff', not b3,
        'git diff %s -- backend => %d 个文件 %s' % (BASE[:7], len(b3), b3[:3]))
    t3_all = paths_diff('*test*', '*.spec.*')
    # `*test*` 通配也会命中 `docs/**` 下的文档与证据工具文件名（如 R3 负向自测脚本），
    # 它们不是项目测试代码，故零差异判定只在项目源码树（frontend/、backend/）内进行；
    # 命中总数与被排除的 docs 路径一并输出，不做隐藏。
    t3 = [p for p in t3_all if not p.startswith('docs/')]
    t3_docs = [p for p in t3_all if p.startswith('docs/')]
    rec('5', 'test-files-zero-diff', not t3,
        'git diff %s -- *test* *.spec.* => 项目测试文件 %d 个 %s（另排除 docs/** 非测试代码 %d 个 %s）'
        % (BASE[:7], len(t3), t3[:3], len(t3_docs), t3_docs[:3]))
    dep = paths_diff('package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', '*.sql', '*config*')
    rec('6', 'deps-lock-sql-config-zero-diff', not dep,
        'git diff %s -- 依赖/锁文件/SQL/配置 => %d 个文件 %s' % (BASE[:7], len(dep), dep[:3]))

    # ================= 7/8 =================
    b_req = rows(blob(DSS + 'REQUIREMENTS.md'), r'^\| DSS-REQ-\d{3} \|')
    c_req = rows(cur(DSS + 'REQUIREMENTS.md'), r'^\| DSS-REQ-\d{3} \|')
    req_ids = lead_ids(c_req, 'REQ')
    rec('7', 'requirement-rows', len(c_req) == 91 and exact_set(req_ids, 91) and b_req == c_req,
        'business_rows=%d unique=%d set==001..091=%s byte_identical=%s'
        % (len(c_req), len(set(req_ids)), exact_set(req_ids, 91), b_req == c_req))

    b_ac = rows(blob(DSS + 'ACCEPTANCE.md'), r'^\| DSS-AC-\d{3} \|')
    c_ac = rows(cur(DSS + 'ACCEPTANCE.md'), r'^\| DSS-AC-\d{3} \|')
    ac_ids = lead_ids(c_ac, 'AC')
    rec('8', 'acceptance-rows', len(c_ac) == 118 and exact_set(ac_ids, 118) and b_ac == c_ac,
        'business_rows=%d unique=%d set==001..118=%s byte_and_status_identical=%s'
        % (len(c_ac), len(set(ac_ids)), exact_set(ac_ids, 118), b_ac == c_ac))

    # ================= 9 =================
    stat = {'PASS': 0, 'FAIL': 0, 'BLOCKED': 0, 'NOT_RUN': 0}
    for ln in c_ac:
        cell = ln.split('|')[2].strip()
        if cell in stat:
            stat[cell] += 1
    rec('9', 'acceptance-statistics', stat == {'PASS': 113, 'FAIL': 0, 'BLOCKED': 0, 'NOT_RUN': 5},
        'PASS=%d FAIL=%d BLOCKED=%d NOT_RUN=%d (total=%d)'
        % (stat['PASS'], stat['FAIL'], stat['BLOCKED'], stat['NOT_RUN'], sum(stat.values())))

    def mapping_block(lines):
        i2 = next(i for i, l in enumerate(lines) if re.match(r'^### 14\.2 ', l))
        i3 = next(i for i, l in enumerate(lines) if re.match(r'^### 14\.3 ', l))
        i4 = next((i for i, l in enumerate(lines) if i > i3 and re.match(r'^#{1,4} ', l)), len(lines))
        return lines[i2:i4]

    bb = mapping_block(blob(DSS + 'DESIGN.md').split('\n'))
    cb = mapping_block(cur(DSS + 'DESIGN.md').split('\n'))
    mreq = set(re.findall(r'DSS-REQ-\d{3}', '\n'.join(cb)))
    mac = set(re.findall(r'DSS-AC-\d{3}', '\n'.join(cb)))
    rec('10', 'design-traceability-14.2-14.3',
        len(mreq) == 91 and len(mac) == 118 and bb == cb,
        'unique REQ=%d/91 AC=%d/118 mapping_block_byte_identical=%s' % (len(mreq), len(mac), bb == cb))

    # ================= 11/12/13 区域往返 + 基准派生字节证明 =================
    ok11, d11 = region_roundtrip(DSS + 'DESIGN.md', '## 38. ')
    ok11b, d11b = doc_equals_expected(DSS + 'DESIGN.md')
    rec('11', 'design-38-non-authorized-body', ok11 and ok11b,
        '%s；base+declared=%s(%s)' % (d11, ok11b, d11b))
    ok12, d12 = region_roundtrip(DSS + 'UI.md', '## 32. ')
    ok12b, d12b = doc_equals_expected(DSS + 'UI.md')
    rec('12', 'ui-32-non-authorized-body', ok12 and ok12b,
        '%s；base+declared=%s(%s)' % (d12, ok12b, d12b))
    ok13a, d13a = region_roundtrip(DSS + 'API.md', '## 2. API 设计状态')
    ok13b, d13b = region_roundtrip(DSS + 'DATABASE.md', '## 2. 事实依据')
    ok13c = doc_equals_expected(DSS + 'API.md')[0] and doc_equals_expected(DSS + 'DATABASE.md')[0]
    rec('13', 'api-database-contract-body', ok13a and ok13b and ok13c,
        'API(%s) DATABASE(%s) base+declared=%s' % (d13a, d13b, ok13c))

    # ================= 14 =================
    r14 = git('diff', '--name-only', BASE, '--', R0REPORT, R1REPORT, R0EVID, R1EVID).stdout.split()
    n14 = len(git('ls-tree', '-r', '--name-only', '%s:%s' % (BASE, R0EVID)).stdout.split())
    n14b = len(git('ls-tree', '-r', '--name-only', '%s:%s' % (BASE, R1EVID)).stdout.split())
    rec('14', 'r0-r1-report-evidence-frozen', not r14,
        'R0 证据=%d 文件 R1 证据=%d 文件 报告+证据差异=%s' % (n14, n14b, r14 or '零差异'))

    # ================= 15 =================
    bb15 = blob_bytes(R2REPORT)
    cc15 = io.open(os.path.join(WT, R2REPORT), 'rb').read()
    num15 = [l for l in git('diff', '--numstat', BASE, '--', R2REPORT).stdout.split('\n') if l.strip()]
    dels15 = int(num15[0].split('\t')[1]) if num15 else -1
    deltxt15 = len([l for l in git('diff', BASE, '--', R2REPORT).stdout.split('\n')
                    if l.startswith('-') and not l.startswith('---')])
    rec('15', 'r2-report-append-only',
        cc15.startswith(bb15) and deltxt15 == 0 and dels15 == 0,
        'base_bytes=%d now_bytes=%d complete_prefix=%s numstat_deletions=%d deleted_lines=%d'
        % (len(bb15), len(cc15), cc15.startswith(bb15), dels15, deltxt15))

    # ================= 16 =================
    bb16 = blob_bytes(R2EV_README)          # 基准中不存在 -> 0 字节
    cc16 = io.open(os.path.join(WT, R2EV_README), 'rb').read()
    num16 = [l for l in git('diff', '--numstat', BASE, '--', R2EV_README).stdout.split('\n') if l.strip()]
    dels16 = int(num16[0].split('\t')[1]) if num16 else 0
    rec('16', 'r2-evidence-readme-append-only',
        len(bb16) == 0 and cc16.startswith(bb16) and dels16 == 0,
        'base_bytes=%d now_bytes=%d complete_prefix=%s numstat_deletions=%d'
        % (len(bb16), len(cc16), cc16.startswith(bb16), dels16))

    # ================= 17 =================
    r17 = [p for p in git('diff', '--name-only', BASE, '--', R2EVID).stdout.split()
           if p not in (R2SCRIPT, R2EV_README)]
    r17b = [p for p in parse_porcelain(git('status', '--porcelain', '--', R2EVID).stdout)
            if p not in (R2SCRIPT, R2EV_README)]
    rec('17', 'r2-other-evidence-frozen', not r17 and not r17b,
        'R2 证据目录内除 README 与 run-checks.py 外的差异=%s / 变更=%s'
        % (r17 or '零差异', r17b or '零差异'))

    # ================= 24 =================
    claim_hits = []
    for rel in D8:
        t = cur(rel)
        for pat in (CLAIM_SCRIPT, CLAIM_OUTPUT):
            if pat in t:
                claim_hits.append(rel.rsplit('/', 1)[-1])
    t_r2r = cur(R2REPORT)
    b_r2r = blob(R2REPORT)
    r24 = (claim_hits == []
           and CLAIM_SCRIPT in b_r2r and CLAIM_OUTPUT in b_r2r
           and t_r2r.count(CLAIM_SCRIPT) >= 1 and t_r2r.count(CLAIM_OUTPUT) >= 1
           and R3_SECTION in t_r2r and QUALIFIER in t_r2r)
    rec('24', 'stale-reproducibility-claim-qualified', r24,
        '八份文档内过强声明=%d；R2 报告原句仍在（基准内=%s/%s）；纠正章节与限定语齐全=%s'
        % (len(claim_hits), CLAIM_SCRIPT in b_r2r, CLAIM_OUTPUT in b_r2r,
           R3_SECTION in t_r2r and QUALIFIER in t_r2r))

    # ================= 25 =================
    d25 = []
    for rel in D8:
        t = cur(rel)
        slot = (t.count('`current_next_entry=%s`' % T_R3) if rel != FREAD
                else t.count('其统一下一入口当前为 `%s`' % T_R3))
        miss = [s for s in STATUS_TOKENS if s not in t]
        bad_cur = t.count('`%s`（**当前直接值' % T_R2) + t.count('`%s`（**当前直接值' % T_R1)
        if slot != 1 or miss or bad_cur:
            d25.append('%s 当前入口槽位=%d 缺失状态令牌=%s R2/R1 仍作当前值=%d'
                       % (rel.rsplit('/', 1)[-1], slot, miss[:2], bad_cur))
    rec('25', 'current-status-and-next-entry-r3', not d25,
        '八份文档当前下一入口均为 R3 入口、状态令牌齐全、R2/R1 入口仅为已限定历史=%s'
        % (d25[:3] or '是'))

    # ================= 26 =================
    r26 = rows(cur(DSS + 'ACCEPTANCE.md'), r'^\| DSS-AC-11[4-8] \|')
    r26_ok = len(r26) == 5 and all(l.split('|')[2].strip() == 'NOT_RUN' for l in r26)
    rec('26', 'dss-ac-114-118-still-not-run', r26_ok,
        'AC-114~118=%d 条且全 NOT_RUN=%s' % (len(r26), r26_ok))

    # ================= 27 =================
    targets = [os.path.join(WT, r) for r in ([R0REPORT, R1REPORT, R2REPORT, R3REPORT] + D8
                                            + [R2EV_README, R2SCRIPT])
               if os.path.exists(os.path.join(WT, r))]
    for root, _dirs, files in os.walk(os.path.join(WT, R3EVID)):
        for fn in files:
            targets.append(os.path.join(root, fn))
    hits = []
    for fp in targets:
        if os.path.abspath(fp) == HERE_SCRIPT:
            continue                      # 本脚本自身的凭据正则字面量不是凭据
        try:
            txt = io.open(fp, encoding='utf-8', errors='ignore').read()
        except OSError:
            continue
        for m in SECRET.finditer(txt):
            hits.append((os.path.relpath(fp, WT), m.group(0)[:30]))
    rec('27', 'credential-scan', not hits,
        'scanned=%d secret_hits=%d %s' % (len(targets), len(hits), hits[:3]))

    # ================= 28 =================
    trail = []
    for rel in [r for r in paths if r.endswith('.md')]:
        fp = os.path.join(WT, rel)
        if not os.path.exists(fp):
            continue
        for i, l in enumerate(io.open(fp, encoding='utf-8').read().split('\n'), 1):
            if l != l.rstrip():
                trail.append('%s:L%d' % (rel, i))
    tool = None
    for cand in ('docs/tools/validate_docs.py', 'scripts/validate-docs.py', 'tools/docs-validate.py',
                 'scripts/validate_docs.py', 'docs/tools/validate-docs.py'):
        if os.path.exists(os.path.join(WT, cand)):
            tool = cand
            break
    if tool is None:
        doc_validation = 'NOT_AVAILABLE'
        tool_ok = True
    else:
        rc = subprocess.run([sys.executable, os.path.join(WT, tool)], cwd=WT,
                            capture_output=True, text=True).returncode
        doc_validation = 'PASS' if rc == 0 else 'FAIL(exit=%d)' % rc
        tool_ok = (rc == 0)
    rec('28', 'no-trailing-whitespace-and-doc-validation', not trail and tool_ok,
        '行尾空白=%d %s；项目文档校验工具=%s'
        % (len(trail), trail[:3],
           ('%s(%s)' % (tool, doc_validation)) if tool else 'NOT_AVAILABLE'))

    # ================= 34 =================
    out34 = git('worktree', 'list', '--porcelain').stdout
    now = {}
    path = None
    for ln in out34.splitlines():
        if ln.startswith('worktree '):
            path = ln[9:].strip()
            now[path] = {'HEAD': None, 'branch': 'detached', 'mods': None}
        elif ln.startswith('HEAD ') and path and now[path]['HEAD'] is None:
            now[path]['HEAD'] = ln[5:].strip()
        elif ln.startswith('branch ') and path:
            now[path]['branch'] = ln[7:].strip()
    for p in list(now):
        st = subprocess.run(['git', '-C', p, 'status', '--porcelain'],
                            capture_output=True, text=True).stdout
        now[p]['mods'] = len([x for x in st.splitlines() if x.strip()])
    start = {}
    if SNAP and os.path.exists(SNAP):
        for ln in io.open(SNAP, encoding='utf-8'):
            ln = ln.rstrip('\n')
            if not ln:
                continue
            wp, hd, br, md = ln.split('|')
            start[wp] = (hd, br, md)
    drift = []
    for wp, (hd, br, md) in start.items():
        if wp not in now:
            drift.append('%s MISSING' % wp)
            continue
        if os.path.realpath(wp) == os.path.realpath(WT):
            continue                     # 本任务自己的隔离 worktree，mod 数必然变化，另行核验
        if (now[wp]['HEAD'], now[wp]['branch'], 'mods=%s' % now[wp]['mods']) != (hd, br, md):
            drift.append('%s %s|%s|%s -> %s|%s|mods=%s'
                         % (wp, hd, br, md, now[wp]['HEAD'], now[wp]['branch'], now[wp]['mods']))
    main_wt = '/agent/cdc-config-platform'
    main_ok = (main_wt in now and start.get(main_wt) is not None
               and (now[main_wt]['HEAD'], now[main_wt]['branch'],
                    'mods=%s' % now[main_wt]['mods']) == start[main_wt])
    wt_self = None
    for k in now:
        if os.path.realpath(k) == os.path.realpath(WT):
            wt_self = now[k]
    self_ok = (wt_self is not None and wt_self['HEAD'] == BASE and wt_self['branch'] == 'detached')
    rec('34', 'worktree-preservation', not drift and main_ok and self_ok and bool(start),
        'baseline_worktrees=%d 既有 worktree 漂移=%d main_unchanged=%s 本任务 worktree=base/detached=%s'
        % (len(start), len(drift), main_ok, self_ok))

    # ================= 35 =================
    def listen_map():
        out = subprocess.run(['ss', '-ltnp'], capture_output=True, text=True).stdout
        m = {}
        for ln in out.splitlines():
            for port in ('5173', '8080'):
                if (':%s ' % port) in ln:
                    pid = re.search(r'pid=(\d+)', ln)
                    m[port] = pid.group(1) if pid else '?'
        return m

    now35 = listen_map()
    start35 = {}
    if os.path.exists(services_snap):
        for ln in io.open(services_snap, encoding='utf-8'):
            ln = ln.strip()
            if ln and not ln.startswith('#'):
                f = ln.split('|')
                start35[f[0]] = f[1]
    rec('35', 'existing-services-untouched', bool(start35) and now35 == start35,
        '快照=%s 当前=%s 一致=%s' % (start35, now35, now35 == start35))

    # ================= 20/21/22/23 共享判定与负向自测 =================
    PURE = 'docs/features/data-source-snapshot-status/README.md'
    parsed = parse_path_lines(PURE + '\n\n')
    rec('20', 'pure-path-preserved', parsed == [PURE],
        'parse_path_lines(%r) == %r（完整、未截断）' % (PURE, parsed))

    SYNTH = 'frontend/src/unauthorized-negative-control.vue'
    synth_outside = judge_paths([SYNTH])
    rec('21', 'unauthorized-path-rejected-by-shared-judge', synth_outside == [SYNTH],
        'judge_paths([%r]) == %r（共享判定真实拒绝）' % (SYNTH, synth_outside))

    idx_before = git('diff', '--cached', '--name-only').stdout
    status_before = git('status', '--porcelain').stdout
    tmpdir = tempfile.mkdtemp(prefix='NEGATIVE-CONTROL-')
    probe = os.path.join(tmpdir, 'NEGATIVE-CONTROL-DO-NOT-USE-AS-BUSINESS-EVIDENCE-paths.txt')
    io.open(probe, 'w', encoding='utf-8').write(
        '# NEGATIVE-CONTROL / DO-NOT-USE-AS-BUSINESS-EVIDENCE\n'
        '# 合成输入：一个不在本任务白名单内的路径。不得据此产生任何业务失败结论。\n%s\n' % SYNTH)
    sub = subprocess.run([sys.executable, HERE_SCRIPT, '--verify-paths', probe],
                         capture_output=True, text=True)
    rec('22', 'negative-control-subprocess-nonzero', sub.returncode != 0,
        '--verify-paths 真实子进程 exit=%d（期望非 0）；stdout 末行=%r'
        % (sub.returncode, sub.stdout.splitlines()[-1:]))
    rec('23', 'negative-control-did-not-touch-project',
        idx_before == git('diff', '--cached', '--name-only').stdout
        and status_before == git('status', '--porcelain').stdout
        and not os.path.exists(os.path.join(WT, SYNTH)),
        'index 与工作区未变=%s；未创建真实 %s=%s'
        % (idx_before == git('diff', '--cached', '--name-only').stdout
           and status_before == git('status', '--porcelain').stdout,
           SYNTH, not os.path.exists(os.path.join(WT, SYNTH))))

    # ================= 29/30/31/32/33（需暂存后运行） =================
    if STAGED:
        c29 = git('diff', '--cached', '--check').returncode
        rec('29', 'git-diff-cached-check', c29 == 0, 'git diff --cached --check exit=%d' % c29)

        stg = parse_path_lines(git('diff', '--cached', '--name-only').stdout)
        out30 = judge_paths(stg)
        judged_path_count += len(stg)
        rec('30', 'staged-paths-whitelist', not out30,
            'staged=%d outside_whitelist=%d%s；示例完整路径=%r'
            % (len(stg), len(out30), '  [%s]' % out30 if out30 else '', stg[:1]))

        diff_rc = git('diff', '--exit-code', '--', R2SCRIPT).returncode
        idx_script = subprocess.run(['git', '-C', WT, 'show', ':%s' % R2SCRIPT],
                                    capture_output=True).stdout
        wt_script = io.open(os.path.join(WT, R2SCRIPT), 'rb').read()
        rec('31', 'worktree-index-script-byte-identity', diff_rc == 0 and idx_script == wt_script,
            'git diff --exit-code -- <脚本> exit=%d；worktree==index bytes=%s'
            % (diff_rc, idx_script == wt_script))
        rec('32', 'git-show-index-script-byte-identity', idx_script == wt_script,
            'git show :<脚本> == 工作树脚本 bytes=%s (%d bytes)'
            % (idx_script == wt_script, len(wt_script)))

        unstaged = git('diff', '--name-only').stdout.split()
        untracked = [ln[3:].strip().strip('"') for ln in git('status', '--porcelain').stdout.splitlines()
                     if ln.startswith('??')]
        rec('33', 'all-evidence-staged-no-leftover', not unstaged and not untracked,
            '未暂存的工作区修改=%d %s；未跟踪新增=%d %s'
            % (len(unstaged), unstaged[:3], len(untracked), untracked[:3]))
    else:
        print('[SKIP] §14-29/30/31/32/33 需在暂存后以 --staged 运行')

    print()
    print('mode=%s' % ('STAGED' if STAGED else 'NORMAL'))
    print('worktree=%s' % WT)
    print('base=%s' % BASE)
    print('judged_path_count=%d' % judged_path_count)
    print('checks_run=%d  failed=%d' % (len(results), sum(1 for r in results if not r[2])))
    print('final_result=%s' % ('PASS' if all(r[2] for r in results) else 'FAIL'))
    return 0 if all(r[2] for r in results) else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
