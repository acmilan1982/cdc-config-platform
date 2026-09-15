#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""§9 检查 3/4：证明四个前端文件相对基准提交只发生“需求编号引用”纠正，
且去除这些被授权的编号行后，工作区字节与基准提交完全一致。

判定方式（不靠人工目测）：
  1. 用 difflib 逐行对齐基准版与工作区版；
  2. 要求每一处差异都是“替换”，且替换行的差异严格只落在
     DSS-REQ-090 <-> DSS-REQ-091 这一个子串上；
  3. 把替换行还原成基准行后，重新拼接的字节必须与基准版逐字节相等。
"""
import subprocess
import sys
import difflib

BASE = 'd77e174a912daf852837c9658f13672918fc766e'
WT = '/agent/dss-query-button-table-layout-implementation-001-r1'
PAIRS = [('DSS-REQ-090', 'DSS-REQ-091'), ('DSS-REQ-091', 'DSS-REQ-090')]

FILES = [
    'frontend/src/layouts/MainLayout.vue',
    'frontend/src/layouts/MainLayout.spec.ts',
    'frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue',
    'frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts',
]

fail = 0
total_replaced = 0

for rel in FILES:
    base_bytes = subprocess.run(['git', '-C', WT, 'show', f'{BASE}:{rel}'],
                                capture_output=True, check=True).stdout
    with open(f'{WT}/{rel}', 'rb') as fh:
        cur_bytes = fh.read()
    base_lines = base_bytes.decode('utf-8').splitlines(keepends=True)
    cur_lines = cur_bytes.decode('utf-8').splitlines(keepends=True)

    sm = difflib.SequenceMatcher(None, base_lines, cur_lines, autojunk=False)
    replaced = 0
    unparsed = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            continue
        if tag != 'replace' or (i2 - i1) != (j2 - j1):
            unparsed.append((tag, i1, i2, j1, j2))
            continue
        for a, b in zip(base_lines[i1:i2], cur_lines[j1:j2]):
            if a == b:
                continue
            ok = False
            for src, dst in PAIRS:
                if a.replace(src, dst) == b:
                    ok = True
                    break
            if not ok:
                unparsed.append(('line', a.rstrip('\n'), b.rstrip('\n')))
            replaced += 1

    # 还原：把工作区的替换行换回基准行，再与基准字节比较
    restored = list(cur_lines)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag != 'replace':
            continue
        for k, (a, b) in enumerate(zip(base_lines[i1:i2], cur_lines[j1:j2])):
            restored[j1 + k] = a
    restored_bytes = ''.join(restored).encode('utf-8')

    identical = restored_bytes == base_bytes
    print(f'file={rel}')
    print(f'  base_bytes={len(base_bytes)}')
    print(f'  worktree_bytes={len(cur_bytes)}')
    print(f'  replaced_line_count={replaced}')
    print(f'  restored_bytes_equals_base={identical}')
    print(f'  unauthorized_diff_count={len(unparsed)}')
    for u in unparsed:
        print(f'    UNAUTHORIZED {u}')
    if not identical or unparsed:
        fail += 1
    total_replaced += replaced

print(f'total_replaced_line_count={total_replaced}')
print(f'traceability_reference_only_status={"PASS" if fail == 0 else "FAIL"}')
sys.exit(1 if fail else 0)
