#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""找出本 Feature 本轮（查询按钮与表格布局稳定性）范围内、以“当前语气”残留的
旧状态文字：未实现 / 待正式实现 / 代码零差异 / 旧下一入口 / 旧的 PENDING 与 NOT_RUN。

判定：命中关键词，且其上下文窗口同时命中本轮主题锚点，
且窗口内**没有**历史限定词（历史/已由/不构成当前直接值/当时/已处理）。
"""
import re

B = '/agent/dss-query-button-table-layout-implementation-001-r1/docs/features/'
FILES = ['README.md',
         'data-source-snapshot-status/README.md',
         'data-source-snapshot-status/REQUIREMENTS.md',
         'data-source-snapshot-status/ACCEPTANCE.md',
         'data-source-snapshot-status/DESIGN.md',
         'data-source-snapshot-status/UI.md',
         'data-source-snapshot-status/API.md',
         'data-source-snapshot-status/DATABASE.md']

TOPIC = re.compile('查询按钮与表格布局稳定性|DSS-REQ-090|DSS-REQ-091|DSS-AC-114|DSS-AC-115|DSS-AC-116|DSS-AC-117|DSS-AC-118')
HIST = re.compile('历史|已由|不构成当前直接值|不构成本轮当前直接值|当时|已处理|批准前|草案建立|批准收口时点|已收口')
STALE = [
    ('未实现', re.compile('未实现')),
    ('不得写成IMPLEMENTED', re.compile('不得[^。；]{0,40}写成[^。；]{0,20}IMPLEMENTED(?![_A-Za-z])')),
    ('PENDING_FORMAL_IMPLEMENTATION_ON_5173',
     re.compile('query_button_and_table_layout_stability_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173')),
    ('code_review_status=NOT_RUN',
     re.compile('query_button_and_table_layout_stability_code_review_status=NOT_RUN')),
    ('frontend_zero_diff', re.compile('(frontend_code_diff=ZERO|测试代码[^。；]{0,20}零差异|代码零差异)')),
    ('R0_entry_current', re.compile('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')),
]

WINB, WINA = 600, 900
total = 0
for rel in FILES:
    text = open(B + rel, encoding='utf-8').read()
    out = []
    for name, pat in STALE:
        for m in pat.finditer(text):
            # 段落作用域：向前回退到所在段落的起点（上限 4000 字符），
            # 使"草案建立记录（…）"/"历史（…）"这类段首限定词可被纳入判定窗口。
            para = text.rfind('\n\n', 0, m.start())
            s = max(para, m.start() - 4000) if para >= 0 else max(0, m.start() - WINB)
            e = min(len(text), m.end() + WINA)
            win = text[s:e]
            if not TOPIC.search(win):
                continue
            line = text.count('\n', 0, m.start()) + 1
            qual = 'QUALIFIED' if HIST.search(win) else 'UNQUALIFIED'
            out.append((line, name, qual, m.group(0)[:40]))
    if out:
        unq = sum(1 for o in out if o[2] == 'UNQUALIFIED')
        total += unq
        print(f'######## {rel}  hits={len(out)} unqualified={unq}')
        for line, name, qual, snip in out:
            print(f'  L{line:5d} [{qual:11s}] {name}')
print(f'### total_unqualified={total}')
