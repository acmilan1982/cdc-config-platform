#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R2 范围内“当前语气”冲突扫描：找出八份入口文档中仍以当前事实口吻
残留的（a）R0/R1 文件事实混写、（b）R1 入口仍作当前值、（c）已收口前旧状态文字。

判定：命中关键词后，取其所在段落（必要时向前回退到段落起点，上限 4000 字符）
作为窗口；窗口内若出现历史限定词（历史/已由/不构成当前直接值/不构成本轮当前直接值/
已处理/当时/草案建立/批准前/批准收口时点/已收口）则记为 QUALIFIED，否则 UNQUALIFIED。

带 `--brief` 时只打印计数；默认打印明细。发现 UNQUALIFIED 时返回非零退出码。
"""
import re
import sys

B = ('/agent/dss-query-button-table-layout-implementation-001-r2/'
     'docs/features/')
FILES = ['README.md',
         'data-source-snapshot-status/README.md',
         'data-source-snapshot-status/REQUIREMENTS.md',
         'data-source-snapshot-status/ACCEPTANCE.md',
         'data-source-snapshot-status/DESIGN.md',
         'data-source-snapshot-status/UI.md',
         'data-source-snapshot-status/API.md',
         'data-source-snapshot-status/DATABASE.md']

T_R1 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R1_REVIEW_FROM_GIT_THEN_'
        'PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
T_R2 = ('CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R2_REVIEW_FROM_GIT_THEN_'
        'PROJECT_OWNER_VISUAL_INTERACTION_REVIEW')
MARK = 'ChatGPT R1 复审发现的不准确历史表述，已由 R2 纠正'

TOPIC = re.compile('查询按钮与表格布局稳定性|DSS-REQ-090|DSS-REQ-091|'
                   'DSS-AC-114|DSS-AC-115|DSS-AC-116|DSS-AC-117|DSS-AC-118|'
                   'query_button_and_table_layout_stability')
HIST = re.compile('历史|已由|不构成当前直接值|不构成本轮当前直接值|当时|已处理|批准前|'
                  '草案建立|批准收口时点|已收口|已成文|先于本轮')
# 错误的“R0 文件范围 = R1 引用纠正范围”混写原句（含 R2 块内的限定引用）
CONFLATED = re.compile('两个前端实现文件除 5 处需求编号注释/测试名称外逐字节不变')
STALE = [
    ('conflated_r0_r1_file_fact', CONFLATED),
    ('r1_entry_as_current_value',
     re.compile(re.escape(T_R1) + '`\\**（\\*\\*当前直接值')),
    ('r1_entry_unqualified_line', None),           # 逐行判定，见下
    ('implementation_not_implemented', re.compile('未实现')),
    ('frontend_zero_diff', re.compile('(frontend_code_diff=ZERO|测试代码[^。；]{0,20}零差异|代码零差异)')),
    ('acceptance_all_pass', re.compile('DSS-AC-001~118[^。；\\n]{0,20}全部\\s*PASS')),
]

WINB, WINA = 600, 900
total = 0
brief = '--brief' in sys.argv
for rel in FILES:
    text = open(B + rel, encoding='utf-8').read()
    out = []
    for name, pat in STALE:
        if name == 'r1_entry_unqualified_line':
            for i, line in enumerate(text.split('\n'), 1):
                if T_R1 in line and '历史入口' not in line:
                    out.append((i, name, 'UNQUALIFIED', line.strip()[:60]))
            continue
        for m in pat.finditer(text):
            para = text.rfind('\n\n', 0, m.start())
            s = max(para, m.start() - 4000) if para >= 0 else max(0, m.start() - WINB)
            e = min(len(text), m.end() + WINA)
            win = text[s:e]
            if not TOPIC.search(win):
                continue
            line = text.count('\n', 0, m.start()) + 1
            # R2 块内的历史引用自带限定标记，按 QUALIFIED 处理
            if name == 'conflated_r0_r1_file_fact' and MARK in text[m.start():m.start() + 400]:
                out.append((line, name, 'QUALIFIED', m.group(0)[:40]))
                continue
            qual = 'QUALIFIED' if HIST.search(win) else 'UNQUALIFIED'
            out.append((line, name, qual, m.group(0)[:40]))
    if out:
        unq = sum(1 for o in out if o[2] == 'UNQUALIFIED')
        total += unq
        if not brief:
            print('######## %s  hits=%d unqualified=%d' % (rel, len(out), unq))
            for line, name, qual, snip in out:
                print('  L%-5d [%-11s] %s' % (line, qual, name))
    # 每份文档必须出现 R2 当前入口，且分层计数令牌齐全
    need = ['r0_production_source_file_count=2', 'r0_test_file_count=2',
            'r0_total_frontend_changed_file_count=4',
            'r1_reference_corrected_file_count=4',
            'r1_reference_corrected_location_count=5',
            'r1_business_logic_diff=ZERO', 'r1_css_rule_diff=ZERO',
            'r1_test_assertion_diff=ZERO', 'r1_fixture_mock_diff=ZERO']
    miss = [n for n in need if n not in text]
    r2cur = len(re.findall(re.escape(T_R2) + '`\\**（\\*\\*当前直接值', text))
    if miss or r2cur < 1:
        total += 1
        print('######## %s 令牌缺失=%s R2当前值=%d' % (rel, miss, r2cur))
print('### total_unqualified=%d' % total)
sys.exit(1 if total else 0)
