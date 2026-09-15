#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R1 任务 §9 验证清单的机器执行（不含浏览器/构建/服务/数据库/ZooKeeper）。

覆盖 §9 第 1、2、5、6、7、8、9、11、12、14、15 项。
第 3、4 项见 `check-frontend-reference-only.py`；
第 10 项见 `verify-report-append-only.py`；
第 13 项由 `conflicts-scan.py` 的 current unqualified 计数给出。

用法：run-checks.py <r1-worktree> <base-commit> <worktree-snapshot-at-start>
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
SNAP_START = sys.argv[3] if len(sys.argv) > 3 else ''
HERE = os.path.dirname(os.path.abspath(__file__))

DSS = 'docs/features/data-source-snapshot-status/'
R0REPORT = DSS + ('reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
                  'STABILITY-IMPLEMENTATION-001.md')
R1REPORT = DSS + ('reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
                  'STABILITY-IMPLEMENTATION-001-R1.md')
R1EVID = DSS + ('evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
                'STABILITY-IMPLEMENTATION-001-R1/')
R0EVID = DSS + ('evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
                'STABILITY-IMPLEMENTATION-001')
FRONTEND = [
    'frontend/src/layouts/MainLayout.vue',
    'frontend/src/layouts/MainLayout.spec.ts',
    'frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue',
    'frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts',
]
DOCS = [DSS + 'README.md', DSS + 'REQUIREMENTS.md', DSS + 'ACCEPTANCE.md',
        DSS + 'DESIGN.md', DSS + 'UI.md', DSS + 'API.md', DSS + 'DATABASE.md',
        'docs/features/README.md']
WHITELIST = set(DOCS) | set(FRONTEND) | {R0REPORT, R1REPORT}

results = []


def rec(no, name, ok, detail):
    results.append((no, name, ok, detail))
    print('[%s] §9-%-2s %-30s :: %s' % ('PASS' if ok else 'FAIL', no, name, detail))


def git(*args, text=True):
    return subprocess.run(['git', '-C', WT] + list(args), capture_output=True, text=text)


def blob(rel):
    return git('show', '%s:%s' % (BASE, rel)).stdout


def cur(rel):
    return open(os.path.join(WT, rel), encoding='utf-8').read()


def rows(text, pat):
    return [ln for ln in text.split('\n') if re.match(pat, ln)]


def lead_ids(lines, kind):
    """只取行首单元格编号，避免行内对其他编号的引用污染序列。"""
    out = []
    for ln in lines:
        m = re.match(r'^\| DSS-%s-(\d{3}) \|' % kind, ln)
        if m:
            out.append(m.group(1))
    return out


def exact_set(seq, n):
    return sorted(set(seq)) == ['%03d' % i for i in range(1, n + 1)]


# ---- 1. git diff --check / --cached --check ----
a = git('diff', '--check').returncode
b = git('diff', '--cached', '--check').returncode
rec('1', 'git-diff-check', a == 0 and b == 0,
    'git diff --check exit=%d ; git diff --cached --check exit=%d（工作区未暂存，后者为空）' % (a, b))

# ---- 2. 变更路径全部落在 §10 白名单内 ----
paths = []
for ln in git('status', '--porcelain').stdout.splitlines():
    p = ln[3:].strip()
    if ' -> ' in p:
        p = p.split(' -> ')[-1]
    paths.append(p.strip('"'))
outside = [p for p in paths if p not in WHITELIST and not p.startswith(R1EVID)]
rec('2', 'whitelist-only', not outside,
    'changed_paths=%d outside_whitelist=%d' % (len(paths), len(outside)) +
    ('  [%s]' % outside if outside else ''))

# ---- 5. DSS-REQ-001~091 连续唯一，业务行逐字节不变 ----
b_req = rows(blob(DSS + 'REQUIREMENTS.md'), r'^\| DSS-REQ-\d{3} \|')
c_req = rows(cur(DSS + 'REQUIREMENTS.md'), r'^\| DSS-REQ-\d{3} \|')
req_ids = lead_ids(c_req, 'REQ')
rec('5', 'requirement-rows',
    len(c_req) == 91 and exact_set(req_ids, 91) and b_req == c_req,
    'business_rows=%d unique_ids=%d set==001..091=%s byte_identical=%s'
    % (len(c_req), len(set(req_ids)), exact_set(req_ids, 91), b_req == c_req))

# ---- 6. DSS-AC-001~118 连续唯一，业务行与状态列逐字节不变 ----
b_ac = rows(blob(DSS + 'ACCEPTANCE.md'), r'^\| DSS-AC-\d{3} \|')
c_ac = rows(cur(DSS + 'ACCEPTANCE.md'), r'^\| DSS-AC-\d{3} \|')
ac_ids = lead_ids(c_ac, 'AC')
rec('6', 'acceptance-rows',
    len(c_ac) == 118 and exact_set(ac_ids, 118) and b_ac == c_ac,
    'business_rows=%d unique_ids=%d set==001..118=%s byte_identical=%s'
    % (len(c_ac), len(set(ac_ids)), exact_set(ac_ids, 118), b_ac == c_ac))

# ---- 7. 验收统计 PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 5 ----
stat = {'PASS': 0, 'FAIL': 0, 'BLOCKED': 0, 'NOT_RUN': 0}
for ln in c_ac:
    cell = ln.split('|')[2].strip()
    if cell in stat:
        stat[cell] += 1
rec('7', 'acceptance-statistics', stat == {'PASS': 113, 'FAIL': 0, 'BLOCKED': 0, 'NOT_RUN': 5},
    'PASS=%d FAIL=%d BLOCKED=%d NOT_RUN=%d (total=%d)'
    % (stat['PASS'], stat['FAIL'], stat['BLOCKED'], stat['NOT_RUN'],
       sum(stat.values())))

# ---- 8. DESIGN §14.2/§14.3 映射 91/91、118/118，映射行逐字节不变 ----
def mapping_block(lines):
    i2 = next(i for i, l in enumerate(lines) if re.match(r'^### 14\.2 ', l))
    i3 = next(i for i, l in enumerate(lines) if re.match(r'^### 14\.3 ', l))
    i4 = next((i for i, l in enumerate(lines) if i > i3 and re.match(r'^#{1,4} ', l)),
              len(lines))
    return lines[i2:i4]


bb, cb = mapping_block(blob(DSS + 'DESIGN.md').split('\n')), mapping_block(cur(DSS + 'DESIGN.md').split('\n'))
mreq = re.findall(r'DSS-REQ-\d{3}', '\n'.join(cb))
mac = re.findall(r'DSS-AC-\d{3}', '\n'.join(cb))
rec('8', 'design-traceability',
    len(set(mreq)) == 91 and len(set(mac)) == 118 and bb == cb,
    '§14.2+§14.3 unique REQ=%d/91 AC=%d/118  mapping_block_byte_identical=%s'
    % (len(set(mreq)), len(set(mac)), bb == cb))

# ---- 9. API.md / DATABASE.md：变更集合恰好等于声明编辑 ----
sys.argv = [sys.argv[0]] + sys.argv[1:]
sys.dont_write_bytecode = True          # 避免在被加载脚本旁生成 __pycache__
spec = importlib.util.spec_from_file_location(
    'plan', os.path.join(HERE, 'r1-docs-correction.py'))
mod = importlib.util.module_from_spec(spec)
_argv = sys.argv[:]
sys.argv = ['r1-docs-correction.py']            # 无 --apply => dry-run
try:
    with contextlib.redirect_stdout(io.StringIO()):
        spec.loader.exec_module(mod)
except SystemExit:
    pass
finally:
    sys.argv = _argv

ops_by_file = {}
for rel, old, new, n in mod.EDITS:
    ops_by_file.setdefault(rel, []).append((old, new, n))

r9 = []
for rel in (DSS + 'API.md', DSS + 'DATABASE.md'):
    t = cur(rel)
    decl = ops_by_file[rel[len('docs/features/'):]]
    for old, new, n in reversed(decl):
        if n != 0:
            t = t.replace(new, old, 1)
    t = t[:-len('\n' + mod.R1_BLOCK + '\n')]
    r9.append((rel.rsplit('/', 1)[-1], t == blob(rel), len([o for o in decl if o[2] != 0])))
rec('9', 'api-db-contract', all(x[1] for x in r9),
    'restored_equals_base=%s；两文件的声明编辑均为状态表/记录措辞（各 %d 处）'
    % ([(x[0], x[1]) for x in r9], r9[0][2]))

# ---- 11. R0 既有证据目录逐字节不变 ----
ev = git('diff', '--numstat', BASE, '--', R0EVID).stdout.strip()
evfiles = git('ls-tree', '-r', '--name-only', '%s:%s' % (BASE, R0EVID)).stdout.split()
rec('11', 'r0-evidence-frozen', ev == '' and len(evfiles) > 0,
    'base_files=%d  git diff %s -- <R0 evidence> => %r' % (len(evfiles), BASE[:7], ev))

# ---- 12. 当前需求编号引用冲突 0 ----
GUTTER = re.compile(r'gutter|scrollbar|滚动条槽位')
GEOM = re.compile(r'62px|固定几何|按钮几何|重置按钮|宽度')
conf = []
for rel in FRONTEND:
    for i, ln in enumerate(cur(rel).split('\n'), 1):
        has90, has91 = 'DSS-REQ-090' in ln, 'DSS-REQ-091' in ln
        if has90 and not has91 and GUTTER.search(ln) and not GEOM.search(ln):
            conf.append('%s:L%d 090/gutter' % (rel.rsplit('/', 1)[-1], i))
        if has91 and not has90 and GEOM.search(ln) and not GUTTER.search(ln):
            conf.append('%s:L%d 091/geometry' % (rel.rsplit('/', 1)[-1], i))
rq = {re.search(r'DSS-REQ-(\d{3})', r).group(1): r for r in c_req}
if not (GEOM.search(rq['090']) and not GUTTER.search(rq['090'])):
    conf.append('REQUIREMENTS DSS-REQ-090 业务行主题不符')
if not (GUTTER.search(rq['091']) and not GEOM.search(rq['091'])):
    conf.append('REQUIREMENTS DSS-REQ-091 业务行主题不符')
rec('12', 'requirement-reference-conflict', not conf,
    'conflict_count=%d %s' % (len(conf), conf[:3]))

# ---- 14. 新增报告/证据/文档无凭据 ----
SECRET = re.compile(r'(CDC/CDC@|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+\S{8,}|'
                    r'ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|Authorization:\s*\S)')
SELF = os.path.abspath(__file__)
hits = []
targets = [os.path.join(WT, r) for r in [R0REPORT, R1REPORT] + DOCS
           if os.path.exists(os.path.join(WT, r))]
for root, _dirs, files in os.walk(os.path.join(WT, R1EVID)):
    for fn in files:
        fp = os.path.join(root, fn)
        if os.path.abspath(fp) == SELF:      # 跳过本检查器自身（其中含检测模式字面量）
            continue
        targets.append(fp)
for fp in targets:
    try:
        txt = open(fp, encoding='utf-8', errors='ignore').read()
    except OSError:
        continue
    for m in SECRET.finditer(txt):
        hits.append((os.path.relpath(fp, WT), m.group(0)[:30]))
rec('14', 'credential-scan', not hits,
    'scanned=%d secret_hits=%d %s' % (len(targets), len(hits), hits[:3]))

# ---- 15. 主工作区与既有 worktree 未被改动 ----
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
    st = subprocess.run(['git', '-C', p, 'status', '--porcelain'],
                        capture_output=True, text=True).stdout
    now[p]['mods'] = len([x for x in st.splitlines() if x.strip()])
start = {}
if SNAP_START and os.path.exists(SNAP_START):
    for ln in open(SNAP_START, encoding='utf-8'):
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
    if (now[wp]['HEAD'], now[wp]['branch'], 'mods=%s' % now[wp]['mods']) != (hd, br, md):
        drift.append('%s %s|%s|mods=%s -> %s|%s|mods=%s'
                     % (wp, hd, br, md, now[wp]['HEAD'], now[wp]['branch'], now[wp]['mods']))
main = '/agent/cdc-config-platform'
main_ok = (main in now and start.get(main) is not None
           and (now[main]['HEAD'], now[main]['branch'],
                'mods=%s' % now[main]['mods']) == start[main])
rec('15', 'worktree-preservation', not drift,
    'baseline_worktrees=%d drift=%d main_worktree_unchanged=%s new_worktree_present=%s'
    % (len(start), len(drift), main_ok,
       os.path.realpath(WT) in [os.path.realpath(k) for k in now]))

# ---- 16（补充 §8 冻结边界）：相对基准提交的受控文件恰好为 4 前端 + 8 文档 + R0 报告 ----
tracked = set(git('diff', '--name-only', BASE).stdout.split())
expected = set(FRONTEND) | set(DOCS) | {R0REPORT, R1REPORT}
frozen_untouched = tracked == expected
rec('16', 'frozen-boundary', frozen_untouched,
    'tracked_changed=%d expected=%d ；backend/SQL/配置/依赖/锁文件/路由/全局样式/其他既有报告均不在变更集内'
    % (len(tracked), len(expected)) +
    ('' if frozen_untouched else '  差异=%s' % sorted(tracked ^ expected)))

print()
print('checks_run=%d  failed=%d' % (len(results), sum(1 for r in results if not r[2])))
print('section9_core_status=%s' % ('PASS' if all(r[2] for r in results) else 'FAIL'))
sys.exit(0 if all(r[2] for r in results) else 1)
