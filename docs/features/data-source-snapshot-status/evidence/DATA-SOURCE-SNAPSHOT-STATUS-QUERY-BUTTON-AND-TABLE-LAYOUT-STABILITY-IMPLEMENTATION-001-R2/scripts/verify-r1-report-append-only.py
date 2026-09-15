#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R1 报告 append-only 证明。

用法：verify-r1-report-append-only.py <worktree> <base-commit>

核验：
1. 基准提交的同路径字节是当前文件中**从头开始的完整前缀**；
2. 基准字节之后只出现追加内容（本次追加块以 `## 12. ChatGPT R1 复审与 R2 定向纠正记录` 开头，
   之前的追加块以 `## 10.`/`## 11.` 等既有标题开头，均非删除）；
3. 相对基准的删除行数为 0、删除字节数为 0；
4. 追加后字节数与 SHA-256 只记录在证据文件里（本文件自身不写入报告，避免自指哈希）。

失败时返回非零退出码。
"""
import hashlib
import os
import subprocess
import sys

WT = sys.argv[1]
BASE = sys.argv[2]
REL = ('docs/features/data-source-snapshot-status/reports/'
       'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R1.md')
MARK = '## 12. ChatGPT R1 复审与 R2 定向纠正记录'

path = os.path.join(WT, REL)
base = subprocess.run(['git', '-C', WT, 'show', '%s:%s' % (BASE, REL)],
                      capture_output=True, check=True).stdout
cur = open(path, 'rb').read()
prefix = cur.startswith(base)
tail = cur[len(base):] if prefix else b''

numstat = subprocess.run(['git', '-C', WT, 'diff', '--numstat', BASE, '--', REL],
                         capture_output=True, text=True).stdout.strip()
added, deleted = (numstat.split('\t')[:2] if numstat else ('0', '0'))
diff_txt = subprocess.run(['git', '-C', WT, 'diff', '-U0', BASE, '--', REL],
                          capture_output=True, text=True).stdout
del_lines = [l for l in diff_txt.split('\n') if l.startswith('-') and not l.startswith('---')]

print('# R1 报告 append-only 证明')
print('report=%s' % REL)
print('base_commit=%s' % BASE)
print('base_bytes=%d' % len(base))
print('base_sha256=%s' % hashlib.sha256(base).hexdigest())
print('now_bytes=%d' % len(cur))
print('now_sha256=%s' % hashlib.sha256(cur).hexdigest())
print('base_is_complete_prefix=%s' % str(prefix).lower())
print('appended_bytes=%d' % len(tail))
print('appended_starts_with_section12=%s'
      % str(tail.lstrip(b'\r\n-\t ').startswith(MARK.encode('utf-8'))).lower())
print('numstat_added=%s numstat_deleted=%s' % (added, deleted))
print('deleted_diff_lines=%d %s' % (len(del_lines), del_lines[:5]))
print('deletion_bytes=%d' % (0 if prefix else -1))
print('section12_present=%s' % str(MARK in cur.decode('utf-8')).lower())
print('section12_count=%d' % cur.decode('utf-8').count(MARK))

ok = prefix and deleted == '0' and len(del_lines) == 0 and MARK in cur.decode('utf-8')
print('append_only_status=%s' % ('PASS' if ok else 'FAIL'))
sys.exit(0 if ok else 1)
