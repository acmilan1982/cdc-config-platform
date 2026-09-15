#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R4 校验：反向应用证明 + 冻结区/需求/验收/追踪/契约不变性 + 字段口径。

设计要点
--------
1. **反向应用**：把 R4 声明的三类编辑（下一入口令牌 R4→R3、R4 记录块、历史链插入、
   B1 块还原）逐一逆操作后，八份入口文档必须与基准 **逐字节完全相等**。
   这比"区域比对"更强：它同时证明"只改了声明过的东西"与"声明的都改了"。
2. **历史文件**：R3 报告 / R2 证据 README / R3 证据 README 必须是基准字节的**完整前缀**。
3. **冻结区**：frontend/backend/项目测试/依赖/锁文件/SQL/配置相对基准零差异。
4. **业务行**：DSS-REQ-001~091 与 DSS-AC-001~118 完整业务行与状态列逐字节不变。
5. **字段口径**：当前只允许 `*_fixed_width_px`；未限定的 `*_height_px` 计数必须为 0。

任何一项失败即返回真实非零退出码；不吞异常。
"""
import hashlib
import importlib.util
import io
import os
import re
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
WT = os.path.normpath(os.path.join(HERE, '..', '..', '..', '..', '..', '..'))
R4EVID = os.path.dirname(HERE)
CORRECTION = os.path.join(R4EVID, 'scripts', 'r4-docs-correction.py')

RESULTS = []


def load_correction():
    spec = importlib.util.spec_from_file_location('r4_correction', CORRECTION)
    mod = importlib.util.module_from_spec(spec)
    buf = io.StringIO()
    real = sys.stdout
    sys.stdout = buf
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.stdout = real
    if buf.getvalue().strip():
        raise SystemExit('导入纠正脚本产生输出（存在副作用）：%r' % buf.getvalue()[:200])
    return mod


def rec(name, ok, detail=''):
    RESULTS.append(bool(ok))
    print('[%s] %-46s %s' % ('PASS' if ok else 'FAIL', name, detail))


def git(*args):
    return subprocess.run(['git', '-C', WT] + list(args), capture_output=True)


def git_out(*args):
    r = git(*args)
    return r.stdout.decode('utf-8', 'replace')


def base_bytes(rel):
    r = git('show', '%s:%s' % (BASE, rel))
    if r.returncode != 0:
        return None
    return r.stdout


def cur_bytes(rel):
    with open(os.path.join(WT, rel), 'rb') as fh:
        return fh.read()


BASE = '64004ca062a92ab40e07350e231d97befe6f496c'
DSS = 'docs/features/data-source-snapshot-status'
ENTRY_DOCS = [
    'docs/features/README.md',
    DSS + '/README.md', DSS + '/REQUIREMENTS.md', DSS + '/ACCEPTANCE.md',
    DSS + '/DESIGN.md', DSS + '/UI.md', DSS + '/API.md', DSS + '/DATABASE.md',
]
HIST_FILES = [
    DSS + '/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3.md',
    DSS + '/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/README.md',
    DSS + '/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3/README.md',
]
FROZEN_R2_SCRIPT = (DSS + '/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
                    'STABILITY-IMPLEMENTATION-001-R2/scripts/run-checks.py')
R2_RESULT_COMMIT = '09e268f905d083d6237b4dfc446198b4c5157661'
R2_EV_README = (DSS + '/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
                'STABILITY-IMPLEMENTATION-001-R2/README.md')

WHITELIST_PREFIX = DSS + '/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-' \
                          'STABILITY-IMPLEMENTATION-001-R4/'
WHITELIST = set(ENTRY_DOCS + HIST_FILES + [
    DSS + '/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4.md',
    DSS + '/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/README.md',
])


def changed_paths():
    out = git_out('status', '--porcelain')
    paths = []
    for ln in out.splitlines():
        if len(ln) < 4:
            continue
        p = ln[3:].strip().strip('"')
        if ' -> ' in p:
            p = p.split(' -> ')[-1]
        paths.append(p)
    return paths


def main():
    mod = load_correction()

    print('# R4 校验：基准=%s' % BASE)
    print('# worktree=%s' % WT)
    print()

    def b1_old_of(base_text):
        j = base_text.find(mod.M1)
        if j < 0:
            raise ValueError('基准中找不到 B1 块前缀')
        return base_text[j:mod.find_paren_end(base_text, j) + 1]

    def undo_declared(t, base_text, rel):
        """撤销 R4 声明编辑；返回还原后的文本。"""
        layout_a = rel == 'docs/features/README.md'
        exp_hist = 2 if layout_a else 3
        exp_b1 = 2 if layout_a else 1

        suffix = '\n\n' + mod.R4_RECORD.strip('\n') + '\n'
        if not t.endswith(suffix):
            raise ValueError('文末追加块不匹配')
        t = t[:-len(suffix)]
        if t.count(mod.R3_HIST) != exp_hist:
            raise ValueError('历史链插入计数 %d（期望 %d）' % (t.count(mod.R3_HIST), exp_hist))
        t = t.replace(mod.R3_HIST, '')
        if t.count(mod.B1_NEW) != exp_b1:
            raise ValueError('B1 新块计数 %d（期望 %d）' % (t.count(mod.B1_NEW), exp_b1))
        t = t.replace(mod.B1_NEW, b1_old_of(base_text))
        if t.count(mod.E_R4) != 4:
            raise ValueError('R4 令牌计数 %d（期望 4）' % t.count(mod.E_R4))
        t = t.replace(mod.E_R4, mod.E_R3)
        return t + base_text[len(base_text.rstrip('\n')):]

    # ---------- 1. 反向应用：八份入口文档 ----------
    for rel in ENTRY_DOCS:
        base = base_bytes(rel).decode('utf-8')
        cur = cur_bytes(rel).decode('utf-8')
        try:
            t = undo_declared(cur, base, rel)
            rec('reverse-apply %s' % rel.split('/')[-1], t == base,
                'restored_equals_base=%s' % (t == base))
        except Exception as exc:
            rec('reverse-apply %s' % rel.split('/')[-1], False, '异常：%s' % exc)

    print()

    # ---------- 2. 历史文件：基准字节完整前缀 ----------
    for rel in HIST_FILES:
        b = base_bytes(rel)
        c = cur_bytes(rel)
        rec('append-only-prefix %s' % rel.split('/')[-1], c.startswith(b),
            'base=%d now=%d appended=%d prefix=%s'
            % (len(b), len(c), len(c) - len(b), c.startswith(b)))

    print()

    # ---------- 3. 冻结区零差异 ----------
    for spec, label in ((['frontend'], 'frontend/**'), (['backend'], 'backend/**'),
                        (['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'], '依赖与锁文件'),
                        (['*.sql'], '*.sql'), (['**/config/**', '*config*'], '配置')):
        n = len([x for x in git_out('diff', '--name-only', BASE, '--', *spec).splitlines() if x.strip()])
        rec('freeze-zero-diff %s' % label, n == 0, 'changed_files=%d' % n)

    b = base_bytes(FROZEN_R2_SCRIPT)
    c = cur_bytes(FROZEN_R2_SCRIPT)
    rec('freeze-zero-diff R2 run-checks.py', b == c,
        'sha256_base=%s sha256_now=%s' % (hashlib.sha256(b).hexdigest()[:16],
                                          hashlib.sha256(c).hexdigest()[:16]))

    for f in ('frontend/src/layouts/MainLayout.vue',
              'frontend/src/layouts/MainLayout.spec.ts',
              'frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue',
              'frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts'):
        n = len(git_out('diff', BASE, '--', f).splitlines())
        rec('freeze-zero-diff %s' % f.split('/')[-1], n == 0, 'diff_lines=%d' % n)

    print()

    # ---------- 4. 需求 / 验收业务行 ----------
    def rows(rel, prefix):
        gets = {}
        for src, data in (('base', base_bytes(rel)), ('now', cur_bytes(rel))):
            t = data.decode('utf-8')
            gets[src] = [ln for ln in t.splitlines()
                         if re.match(r'^\|\s*%s-\d{3}\s*\|' % prefix, ln)]
        return gets

    for rel, prefix, expect in ((DSS + '/REQUIREMENTS.md', 'DSS-REQ', 91),
                                (DSS + '/ACCEPTANCE.md', 'DSS-AC', 118)):
        g = rows(rel, prefix)
        rec('%s 业务行逐字节不变' % prefix, g['base'] == g['now'],
            'base_rows=%d now_rows=%d identical=%s'
            % (len(g['base']), len(g['now']), g['base'] == g['now']))
        rec('%s 行数=%d' % (prefix, expect), len(g['now']) == expect,
            'count=%d' % len(g['now']))

    print()

    # ---------- 5. 验收状态统计 ----------
    cur_t = cur_bytes(DSS + '/ACCEPTANCE.md').decode('utf-8')
    base_t = base_bytes(DSS + '/ACCEPTANCE.md').decode('utf-8')

    def ac_status(text, n):
        m = re.search(r'^\|\s*DSS-AC-%03d\s*\|.*$' % n, text, re.M)
        return m.group(0) if m else None

    notrun = [n for n in range(114, 119)
              if ac_status(cur_t, n) and 'NOT_RUN' in ac_status(cur_t, n)]
    rec('DSS-AC-114~118 仍为 NOT_RUN', len(notrun) == 5, 'not_run=%s' % notrun)
    same = all(ac_status(base_t, n) == ac_status(cur_t, n) for n in range(114, 119))
    rec('DSS-AC-114~118 状态列逐字节不变', same, 'identical=%s' % same)

    # ---------- 6. 需求/验收编号集合与追踪计数 ----------
    req_ids = sorted(set(re.findall(r'DSS-REQ-(\d{3})', cur_bytes(DSS + '/REQUIREMENTS.md').decode('utf-8'))))
    ac_ids = sorted(set(re.findall(r'DSS-AC-(\d{3})', cur_bytes(DSS + '/ACCEPTANCE.md').decode('utf-8'))))
    rec('requirements_count=91', len(req_ids) == 91, 'unique=%d' % len(req_ids))
    rec('acceptance_count=118', len(ac_ids) == 118, 'unique=%d' % len(ac_ids))

    def mapping_block(text):
        lines = text.split('\n')
        i2 = next(i for i, l in enumerate(lines) if re.match(r'^### 14\.2 ', l))
        i3 = next(i for i, l in enumerate(lines) if re.match(r'^### 14\.3 ', l))
        i4 = next((i for i, l in enumerate(lines) if i > i3 and re.match(r'^#{1,4} ', l)), len(lines))
        return lines[i2:i4]

    dsg_t = cur_bytes(DSS + '/DESIGN.md').decode('utf-8')
    dsg_b = base_bytes(DSS + '/DESIGN.md').decode('utf-8')
    mb_now, mb_base = mapping_block(dsg_t), mapping_block(dsg_b)
    mreq = set(re.findall(r'DSS-REQ-\d{3}', '\n'.join(mb_now)))
    mac = set(re.findall(r'DSS-AC-\d{3}', '\n'.join(mb_now)))
    rec('traceability-mapping-unchanged',
        len(mreq) == 91 and len(mac) == 118 and mb_now == mb_base,
        'unique REQ=%d/91 AC=%d/118 mapping_block_byte_identical=%s'
        % (len(mreq), len(mac), mb_now == mb_base))

    print()

    # ---------- 7. 字段口径 ----------
    height_tok = 0
    width_tok = set()
    for rel in ENTRY_DOCS + [DSS + '/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-'
                             'LAYOUT-STABILITY-IMPLEMENTATION-001-R3.md']:
        t = cur_bytes(rel).decode('utf-8')
        height_tok += len(re.findall(r'[a-z_]*height_px', t))
        width_tok |= set(re.findall(r'[a-z_]*fixed_width_px', t))
    rec('未限定 *_height_px 当前事实计数=0', height_tok == 0, 'count=%d' % height_tok)

    for tok, n in (('query_button_height_px=62', 62),
                   ('reset_button_height_px=62', 62),
                   ('refresh_button_height_px=110', 110)):
        c = sum(len(re.findall(re.escape(tok), cur_bytes(r).decode('utf-8'))) for r in ENTRY_DOCS)
        rec('未限定的 %s 当前事实计数=0' % tok, c == 0, 'count=%d' % c)

    joined = '\n'.join(cur_bytes(r).decode('utf-8') for r in ENTRY_DOCS)
    for tok, val in (('query_button_fixed_width_px=62', True),
                     ('reset_button_fixed_width_px=62', True),
                     ('refresh_button_fixed_width_px=110', True)):
        rec('当前字段 %s' % tok, (tok in joined) == val, 'present=%s' % (tok in joined))

    print()

    # ---------- 7b. 设计/UI/契约正文区域逐字节不变（[marker, EOF) 区域往返） ----------
    for rel, marker, label in (
            (DSS + '/DESIGN.md', '## 38. ', 'DESIGN §38 业务规则正文'),
            (DSS + '/UI.md', '## 32. ', 'UI §32 业务规则正文'),
            (DSS + '/API.md', '## 2. API 设计状态', 'API 契约正文'),
            (DSS + '/DATABASE.md', '## 2. 事实依据', 'DATABASE 契约正文')):
        try:
            bf = base_bytes(rel).decode('utf-8')
            cf = cur_bytes(rel).decode('utf-8')
            if marker not in bf or marker not in cf:
                raise ValueError('区域标记缺失')
            rb = bf[bf.index(marker):]
            rc = undo_declared(cf, bf, rel)[len(bf[:bf.index(marker)]):]
            rec('%s 逐字节不变' % label, rc == rb,
                'base_bytes=%d now_bytes=%d region_restored_equals_base=%s'
                % (len(rb), len(rc), rc == rb))
        except Exception as exc:
            rec('%s 逐字节不变' % label, False, '异常：%s' % exc)

    print()

    # ---------- 7c. R0/R1/R2/R3 既有脚本逐字节不变 ----------
    def tracked_scripts():
        out = git_out('ls-tree', '-r', '--name-only', BASE).splitlines()
        pat = (r'QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001'
               r'(-R[0-3])?/scripts/.*\.(py|sh)$')
        return [p for p in out if p.strip() and re.search(pat, p)]

    diff_scripts = []
    for rel in tracked_scripts():
        b = base_bytes(rel)
        if b != cur_bytes(rel):
            diff_scripts.append(rel)
    rec('R0/R1/R2/R3 既有脚本逐字节不变', not diff_scripts,
        'scripts=%d differing=%d' % (len(tracked_scripts()), len(diff_scripts)))

    # ---------- 8. R2 evidence README 的 Git 对象事实 ----------
    r = git('cat-file', '-e', '%s:%s' % (R2_RESULT_COMMIT, R2_EV_README))
    rec('R2 README cat-file -e 非 0', r.returncode != 0, 'exit_code=%d' % r.returncode)
    ls = [x for x in git_out('ls-tree', '-r', '--name-only', R2_RESULT_COMMIT,
                             '--', R2_EV_README).splitlines() if x.strip()]
    rec('R2 README ls-tree 无该路径', ls == [], 'ls_tree_lines=%d' % len(ls))
    dt = git_out('diff-tree', '--no-commit-id', '--name-status', '-r', BASE, '--', R2_EV_README).strip()
    rec('R2 README 在 R3 提交中为 A', dt.startswith('A\t'), 'diff_tree=%r' % dt)

    print()

    # ---------- 9. 白名单 ----------
    bad = [p for p in changed_paths()
           if p not in WHITELIST and not p.startswith(WHITELIST_PREFIX)]
    rec('变更路径全部属于白名单', not bad, 'outside=%r' % bad)
    print('# 变更路径（%d）' % len(changed_paths()))
    for p in sorted(changed_paths()):
        print('#   %s' % p)

    print()
    print('final_result=%s' % ('PASS' if all(RESULTS) else 'FAIL'))
    return 0 if all(RESULTS) else 1


if __name__ == '__main__':
    sys.exit(main())
