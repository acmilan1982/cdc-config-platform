#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""§6/§9-10 的 R0 实现报告 append-only 机器证明。

证明三件事：
  1. 基准提交 `d77e174...` 的报告字节，是当前报告字节的**完整前缀**（逐字节比较）；
  2. 因此删除/替换/就地修改 = 0 字节，追加字节数 = 当前长度 − 基准长度；
  3. 报告文末新增内容只包含 R1 的 "## 11. ChatGPT R0 复审与 R1 定向纠正记录" 一节。

用法：verify-report-append-only.py <worktree> <base-commit>
"""
import hashlib
import os
import subprocess
import sys

WORKTREE = sys.argv[1]
BASE = sys.argv[2]
REL = ('docs/features/data-source-snapshot-status/reports/'
       'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
       'STABILITY-IMPLEMENTATION-001.md')

base = subprocess.run(['git', '-C', WORKTREE, 'show', '%s:%s' % (BASE, REL)],
                      capture_output=True, check=True).stdout
cur = open(os.path.join(WORKTREE, REL), 'rb').read()

prefix_ok = cur.startswith(base)
appended = cur[len(base):] if prefix_ok else b''
text = appended.decode('utf-8')

header = ('## 11. ChatGPT R0 复审与 R1 定向纠正记录（2026-09-15，'
          '`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
          'STABILITY-IMPLEMENTATION-001-R1`）')
header_hits = text.count(header)
# 只统计恰好以 "## " 开头的标题行（避免把 "### 11.x" 一并计入）
h2_lines = [ln for ln in text.splitlines() if ln.startswith('## ')]
only_section11 = text.lstrip().startswith('---') and header in text and len(h2_lines) == 1

print('report_path=%s' % REL)
print('base_commit=%s' % BASE)
print('base_bytes=%d' % len(base))
print('base_sha256=%s' % hashlib.sha256(base).hexdigest())
print('current_bytes=%d' % len(cur))
print('current_sha256=%s' % hashlib.sha256(cur).hexdigest())
print('base_is_complete_prefix_of_current=%s' % prefix_ok)
print('appended_bytes=%d' % len(appended))
print('appended_line_count=%d' % len(appended.splitlines()))
print('r1_section_header_occurrences=%d' % header_hits)
print('appended_h2_section_count=%d' % len(h2_lines))
print('deleted_or_replaced_bytes_count=0' if prefix_ok else 'deleted_or_replaced_bytes_count=UNKNOWN')
print('git_diff_numstat=%s' % subprocess.run(
    ['git', '-C', WORKTREE, 'diff', '--numstat', '--', REL],
    capture_output=True).stdout.decode('utf-8').strip())
print('report_append_only_status=%s' % ('PASS' if (prefix_ok and only_section11) else 'FAIL'))
sys.exit(0 if (prefix_ok and only_section11) else 1)
