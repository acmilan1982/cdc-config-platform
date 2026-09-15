#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R2 任务 §10 提交前强制校验的机器执行。

覆盖 §10 第 1～25 项；第 26、27 项需在暂存后运行，用 `--staged` 打开：
    run-checks.py <worktree> <base-commit> <worktrees-at-start> [--staged]

任何一项失败都会产生真实非零退出码。
"""
import contextlib
import importlib.util
import io
import os
import re
import subprocess
import sys

WT = sys.argv[1]
BASE = sys.argv[2]
SNAP = sys.argv[3] if len(sys.argv) > 3 else ''
STAGED = '--staged' in sys.argv
HERE = os.path.dirname(os.path.abspath(__file__))
STAGED_OK = STAGED

DSS = 'docs/features/data-source-snapshot-status/'
D8 = [DSS + n for n in ('README.md', 'REQUIREMENTS.md', 'ACCEPTANCE.md', 'DESIGN.md',
                        'UI.md', 'API.md', 'DATABASE.md')] + ['docs/features/README.md']
R0REPORT = (DSS + 'reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
            'STABILITY-IMPLEMENTATION-001.md')
R1REPORT = (DSS + 'reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
            'STABILITY-IMPLEMENTATION-001-R1.md')
R2REPORT = (DSS + 'reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
            'STABILITY-IMPLEMENTATION-001-R2.md')
R0EVID = (DSS + 'evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
          'STABILITY-IMPLEMENTATION-001')
R1EVID = R0EVID + '-R1'
R2EVID = R0EVID + '-R2/'
WHITELIST = set(D8) | {R1REPORT, R2REPORT}

T_R1 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R1_REVIEW_FROM_GIT_THEN_'
        'PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
T_R2 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R2_REVIEW_FROM_GIT_THEN_'
        'PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
BAD = '两个前端实现文件除 5 处需求编号注释/测试名称外逐字节不变'
MARK = 'ChatGPT R1 复审发现的不准确历史表述，已由 R2 纠正'

results = []


def rec(no, name, ok, detail):
    results.append((no, name, ok, detail))
    print('[%s] §10-%-2s %-34s :: %s' % ('PASS' if ok else 'FAIL', no, name, detail))


def git(*args):
    return subprocess.run(['git', '-C', WT] + list(args), capture_output=True, text=True)


def blob(rel):
    return git('show', '%s:%s' % (BASE, rel)).stdout


def cur(rel):
    return open(os.path.join(WT, rel), encoding='utf-8').read()


def rows(text, pat):
    return [ln for ln in text.split('\n') if re.match(pat, ln)]


def lead_ids(lines, kind):
    """只取行首单元格编号，避免行内引用污染序列。"""
    out = []
    for ln in lines:
        m = re.match(r'^\| DSS-%s-(\d{3}) \|' % kind, ln)
        if m:
            out.append(m.group(1))
    return out


def exact_set(seq, n):
    return sorted(set(seq)) == ['%03d' % i for i in range(1, n + 1)]


# ---- 载入 R2 文档纠正脚本（dry-run 语义，不写盘） ----
sys.dont_write_bytecode = True
_argv = sys.argv[:]
sys.argv = ['r2-docs-correction.py']
_cand = [os.path.join(HERE, 'r2-docs-correction.py'), '/tmp/dss-r2/r2_docs.py']
_cand = [p for p in _cand if os.path.exists(p)]
if not _cand:
    raise SystemExit('找不到声明式编辑表脚本 r2-docs-correction.py')
spec = importlib.util.spec_from_file_location('r2docs', _cand[0])
MOD = importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()):
    spec.loader.exec_module(MOD)
sys.argv = _argv
R2_BLOCK = MOD.r2_block('X')          # 仅取结构；正文按文件不同, 故下面用通用剥离
ops_by_file = {}
for rel, old, new, n in MOD.EDITS:
    ops_by_file.setdefault(rel, []).append((old, new, n))


def strip_appended(text, rel):
    """剥离文末追加的 R2 记录块（以 '\\n\\n> 查询按钮与表格布局稳定性实现 R2 定向纠正记录' 起）。"""
    key = '\n\n> 查询按钮与表格布局稳定性实现 R2 定向纠正记录'
    i = text.find(key)
    if i < 0:
        return None
    return text[:i] + '\n'


def reverse_ops(text, rel, region_only=False):
    """按逆序反转该文件的声明编辑；每个逆锚点必须恰好出现 1 次。"""
    err = None
    for old, new, n in reversed(ops_by_file.get(rel, [])):
        if old is None:
            continue
        c = text.count(new)
        if c == 0 and region_only:
            continue
        if c != 1:
            err = '逆锚点出现 %d 次（期望 1）：%r' % (c, new[:60])
            break
        text = text.replace(new, old, 1)
    return text, err


def region_roundtrip(rel, marker):
    """证明 [marker, EOF) 区域相对基准只含有声明编辑 + 文末追加。"""
    b = blob(rel)
    if marker not in b or marker not in cur(rel):
        return False, '区域标记缺失'
    base_reg = b[b.index(marker):]
    cur_reg = cur(rel)[cur(rel).index(marker):]
    stripped = strip_appended(cur_reg, rel)
    if stripped is None:
        return False, '未找到文末 R2 追加块'
    restored, err = reverse_ops(stripped, rel, region_only=True)
    if err:
        return False, err
    return restored == base_reg, ('region_restored_equals_base=%s' % (restored == base_reg))


# ================= 1 =================
a = git('diff', '--check').returncode
rec('1', 'git-diff-check', a == 0, 'git diff --check exit=%d' % a)

# ================= 2 =================
paths = []
for ln in git('status', '--porcelain').stdout.splitlines():
    p = ln[3:].strip()
    if ' -> ' in p:
        p = p.split(' -> ')[-1]
    paths.append(p.strip('"'))
outside = [p for p in paths if p not in WHITELIST and not p.startswith(R2EVID)]
rec('2', 'whitelist-only-changed-paths', not outside,
    'changed_paths=%d outside_whitelist=%d%s'
    % (len(paths), len(outside), '  [%s]' % outside if outside else ''))

# ================= 3/4/5/6 =================
def paths_diff(*pats):
    return git('diff', '--name-only', BASE, '--', *pats).stdout.split()

f3 = paths_diff('frontend')
rec('3', 'frontend-zero-diff', not f3, 'git diff %s -- frontend => %d 个文件 %s' % (BASE[:7], len(f3), f3[:3]))
b3 = paths_diff('backend')
rec('4', 'backend-zero-diff', not b3, 'git diff %s -- backend => %d 个文件 %s' % (BASE[:7], len(b3), b3[:3]))
t3 = paths_diff('*test*', '*.spec.*')
rec('5', 'test-files-zero-diff', not t3, 'git diff %s -- *test* *.spec.* => %d 个文件 %s' % (BASE[:7], len(t3), t3[:3]))
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

# ================= 11/12/13 区域级往返 =================
ok11, d11 = region_roundtrip(DSS + 'DESIGN.md', '## 38. ')
rec('11', 'design-38-non-authorized-body', ok11, d11)
ok12, d12 = region_roundtrip(DSS + 'UI.md', '## 32. ')
rec('12', 'ui-32-non-authorized-body', ok12, d12)
ok13a, d13a = region_roundtrip(DSS + 'API.md', '## 2. API 设计状态')
ok13b, d13b = region_roundtrip(DSS + 'DATABASE.md', '## 2. 事实依据')
rec('13', 'api-database-contract-body', ok13a and ok13b, 'API(%s) DATABASE(%s)' % (d13a, d13b))

# ================= 14/15 =================
r14 = git('diff', '--name-only', BASE, '--', R0REPORT).stdout.split()
rec('14', 'r0-report-frozen', not r14, 'git diff %s -- R0 实现报告 => %s' % (BASE[:7], r14 or '零差异'))
r15 = git('diff', '--name-only', BASE, '--', R0EVID, R1EVID).stdout.split()
n15 = len(git('ls-tree', '-r', '--name-only', '%s:%s' % (BASE, R0EVID)).stdout.split())
n15b = len(git('ls-tree', '-r', '--name-only', '%s:%s' % (BASE, R1EVID)).stdout.split())
rec('15', 'r0-r1-existing-evidence-frozen', not r15,
    'R0 证据=%d 文件 R1 证据=%d 文件 差异=%s' % (n15, n15b, r15 or '零差异'))

# ================= 16 =================
bb16 = blob(R1REPORT).encode('utf-8')
cc16 = cur(R1REPORT).encode('utf-8')
num = [l for l in git('diff', '--numstat', BASE, '--', R1REPORT).stdout.split('\n') if l.strip()]
dels = int(num[0].split('\t')[1]) if num else -1
deltxt = len([l for l in git('diff', BASE, '--', R1REPORT).stdout.split('\n')
              if l.startswith('-') and not l.startswith('---')])
rec('16', 'r1-report-append-only',
    cc16.startswith(bb16) and deltxt == 0 and dels == 0,
    'base_bytes=%d now_bytes=%d complete_prefix=%s numstat_deletions=%d deleted_lines=%d'
    % (len(bb16), len(cc16), cc16.startswith(bb16), dels, deltxt))

# ================= 17 =================
def docs_consistent():
    need = ['r0_production_source_file_count=2', 'r0_test_file_count=2',
            'r0_total_frontend_changed_file_count=4', 'r1_reference_corrected_file_count=4',
            'r1_reference_corrected_location_count=5']
    miss = {}
    for rel in D8:
        t = cur(rel)
        m = [x for x in need if x not in t]
        if m:
            miss[rel.rsplit('/', 1)[-1]] = m
    return miss


miss17 = docs_consistent()
rec('17', 'r0-r1-file-facts-consistent', not miss17, '8 份文档分层计数令牌缺失=%s' % (miss17 or '无'))


# ================= 18 =================
def unqualified():
    hits = []
    for rel in D8:
        t = cur(rel)
        for pat in (BAD, '两个前端实现文件'):
            i = 0
            while True:
                i = t.find(pat, i)
                if i < 0:
                    break
                if MARK not in t[i:i + 400]:
                    hits.append('%s@%d' % (rel.rsplit('/', 1)[-1], i))
                i += 1
    return hits


u18 = unqualified()
rec('18', 'unqualified-fact-conflation-zero', not u18,
    '未限定错误混写计数=%d %s' % (len(u18), u18[:3]))

# ================= 19/20 =================
rec('19', 'r0-file-counts', all(cur(r).count('r0_total_frontend_changed_file_count=4') >= 1 for r in D8),
    '八份文档均含 r0_production_source_file_count=2 / r0_test_file_count=2 / r0_total_frontend_changed_file_count=4')
rec('20', 'r1-reference-counts',
    all(cur(r).count('r1_reference_corrected_file_count=4') >= 1 and
        cur(r).count('r1_reference_corrected_location_count=5') >= 1 for r in D8),
    '八份文档均含 r1_reference_corrected_file_count=4 / r1_reference_corrected_location_count=5')

# ================= 21 =================
status_ok = True
detail21 = []
for rel in D8:
    t = cur(rel)
    chk = {
        'PENDING_CHATGPT_REVIEW': 'query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW' in t,
        'acceptance_NOT_RUN': 'query_button_and_table_layout_stability_acceptance_status=NOT_RUN' in t,
        'not_run_count=5': 'query_button_and_table_layout_stability_acceptance_not_run_count=5' in t,
    }
    if not all(chk.values()):
        status_ok = False
        detail21.append('%s:%s' % (rel.rsplit('/', 1)[-1], [k for k, v in chk.items() if not v]))
r21 = rows(cur(DSS + 'ACCEPTANCE.md'), r'^\| DSS-AC-11[4-8] \|')
r21_ok = len(r21) == 5 and all(l.split('|')[2].strip() == 'NOT_RUN' for l in r21)
rec('21', 'status-awaiting-r2-and-114-118-not-run', status_ok and r21_ok,
    '八份文档状态令牌一致=%s；AC-114~118=%d 条且全 NOT_RUN=%s %s'
    % (status_ok, len(r21), r21_ok, detail21[:3]))

# ================= 22 =================
d22 = []
FSLOT = '其统一下一入口当前为 `%s`' % T_R2
for rel in D8:
    t = cur(rel)
    lines = t.split('\n')
    bad_lines = [i + 1 for i, l in enumerate(lines) if T_R1 in l and '历史入口' not in l]
    cur_lines = [i + 1 for i, l in enumerate(lines) if re.search(re.escape(T_R1) + '`\\**（\\*\\*当前直接值', l)]
    r2_cur = len(re.findall(re.escape(T_R2) + '`\\**（\\*\\*当前直接值', t))
    # 当前下一入口槽位：ds-ss 七份用 current_next_entry=，features/README 用「其统一下一入口当前为」
    if rel == 'docs/features/README.md':
        slot = t.count(FSLOT)
    else:
        slot = t.count('`current_next_entry=%s`' % T_R2)
    if bad_lines or cur_lines or r2_cur < 1 or slot != 1:
        d22.append('%s R1未限定行=%s R1仍作当前值=%s R2当前值出现=%d 当前入口槽位=%d'
                   % (rel.rsplit('/', 1)[-1], bad_lines[:2], cur_lines[:2], r2_cur, slot))
rec('22', 'current-next-entry-is-r2', not d22,
    '八份文档当前下一入口均为 R2 入口、R1 入口仅为已限定历史=%s' % (d22[:3] or '是'))

# ================= 23 =================
SECRET = re.compile(r'(CDC/CDC@|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+\S{8,}|'
                    r'ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|Authorization:\s*\S)')
SELF = os.path.abspath(__file__)
targets = [os.path.join(WT, r) for r in [R0REPORT, R1REPORT, R2REPORT] + D8
           if os.path.exists(os.path.join(WT, r))]
for root, _dirs, files in os.walk(os.path.join(WT, R2EVID)):
    for fn in files:
        fp = os.path.join(root, fn)
        if os.path.abspath(fp) == SELF:
            continue
        targets.append(fp)
hits = []
for fp in targets:
    try:
        txt = open(fp, encoding='utf-8', errors='ignore').read()
    except OSError:
        continue
    for m in SECRET.finditer(txt):
        hits.append((os.path.relpath(fp, WT), m.group(0)[:30]))
rec('23', 'credential-scan', not hits,
    'scanned=%d secret_hits=%d %s' % (len(targets), len(hits), hits[:3]))

# ================= 24 =================
trail = []
for rel in [r for r in paths if r.endswith('.md')]:
    fp = os.path.join(WT, rel)
    if not os.path.exists(fp):
        continue
    for i, l in enumerate(open(fp, encoding='utf-8').read().split('\n'), 1):
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
rec('24', 'no-trailing-whitespace-and-doc-validation',
    not trail and tool_ok,
    '行尾空白=%d %s；项目文档校验工具=%s'
    % (len(trail), trail[:3],
       ('%s(%s)' % (tool, doc_validation)) if tool else 'NOT_AVAILABLE'))

# ================= 25 =================
out = git('worktree', 'list', '--porcelain').stdout
now = {}
path = None
for ln in out.splitlines():
    if ln.startswith('worktree '):
        path = ln[9:].strip()
        now[path] = {'HEAD': None, 'branch': 'detached', 'mods': None}
    elif ln.startswith('HEAD ') and path and now[path]['HEAD'] is None:
        now[path]['HEAD'] = ln[5:].strip()
    elif ln.startswith('branch ') and path:
        now[path]['branch'] = ln[7:].strip()
for p in list(now):
    st = subprocess.run(['git', '-C', p, 'status', '--porcelain'], capture_output=True, text=True).stdout
    now[p]['mods'] = len([x for x in st.splitlines() if x.strip()])
start = {}
if SNAP and os.path.exists(SNAP):
    for ln in open(SNAP, encoding='utf-8'):
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
main = '/agent/cdc-config-platform'
main_ok = (main in now and start.get(main) is not None
           and (now[main]['HEAD'], now[main]['branch'], 'mods=%s' % now[main]['mods']) == start[main])
wt_self = None
for k in now:
    if os.path.realpath(k) == os.path.realpath(WT):
        wt_self = now[k]
r2_ok = (wt_self is not None and wt_self['HEAD'] == BASE and wt_self['branch'] == 'detached')
rec('25', 'worktree-preservation', not drift and main_ok and r2_ok,
    'baseline_worktrees=%d 既有 worktree 漂移=%d main_unchanged=%s r2_worktree_present=%s '
    'r2_head=base/detached=%s'
    % (len(start), len(drift), main_ok, wt_self is not None, r2_ok))

# ================= 26/27 =================
if STAGED_OK:
    c26 = git('diff', '--cached', '--check').returncode
    rec('26', 'git-diff-cached-check', c26 == 0, 'git diff --cached --check exit=%d' % c26)
    stg = [ln[3:].strip() for ln in git('diff', '--cached', '--name-only').stdout.splitlines() if ln.strip()]
    out27 = [p for p in stg if p not in WHITELIST and not p.startswith(R2EVID)]
    rec('27', 'staged-paths-whitelist', not out27,
        'staged=%d outside_whitelist=%d%s' % (len(stg), len(out27), '  [%s]' % out27 if out27 else ''))
else:
    print('[SKIP] §10-26/27 需在暂存后以 --staged 运行')

print()
print('checks_run=%d  failed=%d' % (len(results), sum(1 for r in results if not r[2])))
print('section10_status=%s' % ('PASS' if all(r[2] for r in results) else 'FAIL'))
sys.exit(0 if all(r[2] for r in results) else 1)
