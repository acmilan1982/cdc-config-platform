#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""向 R1 报告文末追加“ChatGPT R1 复审与 R2 定向纠正记录”（严格 append-only）。

用法：r2-r1-report-append.py [--apply]
不带 --apply 时只校验“基准字节是当前文件的完整前缀”并打印；
带 --apply 时先校验再追加，追加后再次校验前缀性质。
"""
import hashlib
import io
import os
import subprocess
import sys

WT = '/agent/dss-query-button-table-layout-implementation-001-r2'
BASE = '8272d69bda0fa917cd569d85cbd61f6ed9e28b4e'
REL = ('docs/features/data-source-snapshot-status/reports/'
       'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R1.md')

BLOCK = '''## 12. ChatGPT R1 复审与 R2 定向纠正记录

本节由任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2` 于 2026-09-15 以**文末追加**方式写入：本报告既有内容未被删除、未被替换、未被移动、未被原位编辑。

### 12.1 ChatGPT 对 R1 的复审结论

```text
chatgpt_r1_review_status=CHANGES_REQUIRED_ONE_RESIDUAL_DOCUMENT_FACT_CONFLATION
r1_business_implementation_review_status=APPROVED
r1_traceability_reference_correction_status=APPROVED
r1_current_status_correction_status=APPROVED
r1_report_append_only_review_status=APPROVED
```

即：R1 的业务实现结论、§3 的 5 处需求编号引用纠正结论、§4 的文档当前事实纠正结论、§7 的 R0 报告 append-only 结论**均有效，不被推翻**；R2 只增强文档事实精确性，不改变任何业务实现、CSS、断言、验收业务行或冻结边界。

### 12.2 本报告中被指出的混淆

R1 复审指出，本报告 §4.2 第 6 项（`UI.md` §32.7）的处理方式文字——“限定为“**自检时点**”结论，并注明本轮实现已修改两个前端文件（其中 5 处为需求编号注释/测试名称纠正）”——以及 §5 中相邻的相关文字，把**两个不同层次的事实**混写成了同一事实：

1. R0 业务实现的**文件范围**（2 个生产源码文件 + 2 个测试文件，共 4 个前端路径）；
2. R1 需求编号引用纠正的**文件范围与位置数**（横跨上述 4 个文件的 5 处）。

由此在多份入口文档中派生出不准确表述：

```text
两个前端实现文件除 5 处需求编号注释/测试名称外逐字节不变
```

该表述不准确的原因：R0 业务实现并不只涉及“两个前端实现文件”，R1 的 5 处纠正也并非只发生在这两个文件内。

### 12.3 准确的文件与位置事实

```text
r0_production_source_file_count=2
r0_test_file_count=2
r0_total_frontend_changed_file_count=4
r1_reference_corrected_file_count=4
r1_reference_corrected_location_count=5
r1_business_logic_diff=ZERO
r1_css_rule_diff=ZERO
r1_test_assertion_diff=ZERO
r1_fixture_mock_diff=ZERO
```

| 层次 | 文件 | 说明 |
|---|---|---|
| R0 生产源码实现 | `frontend/src/layouts/MainLayout.vue`、`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` | 业务实现落点的 2 个生产源码文件 |
| R0 同时修改的测试文件 | `frontend/src/layouts/MainLayout.spec.ts`、`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts` | 与源码实现同一提交内同时修改的 2 个测试文件 |
| R1 引用纠正分布 | `MainLayout.vue` 1 处（注释）、`MainLayout.spec.ts` 2 处（文件说明/测试名称）、`DataSourceSnapshotQueryBar.vue` 1 处（注释）、`DataSourceSnapshotQueryBar.spec.ts` 1 处（测试名称） | 4 个文件、5 处 |

正确口径：**R0 业务实现涉及 2 个生产源码文件和 2 个测试文件，共 4 个前端路径；R1 仅在这 4 个文件中纠正 5 处需求编号注释/测试名称，未改变业务逻辑、CSS 规则、测试断言、fixture 或 mock。**

### 12.4 本报告既有结论仍然有效

- §4.2 第 4 项（`DESIGN.md` §38.9）与第 6 项（`UI.md` §32.7）所处理的**冲突本身成立**；R2 只是把“两个前端实现文件（其中 5 处…）”这一层表述按 §12.3 分层改写；
- §5 的两条结论仍然成立：`MainLayout.vue` 与 `DataSourceSnapshotQueryBar.vue` 除各 1 行需求编号注释外与基准提交逐字节相同；两个 spec 文件除名称/注释外用例数、断言、fixture、mock 与基准提交逐字节相同；
- §1～§3 的 R0 复审结论、090/091 口径与 5 处误引用 before/after 表、§6 冻结边界核验、§7 R0 报告 append-only 证明、§9 验证清单、§10 Git/Commit/Push 结果均不变；
- 本节更正在**文档事实精确性**层面，不构成对任何代码、测试、CSS、断言或验收结论的修改；`DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`。

### 12.5 本报告 append-only 证明

| 项目 | 值 |
|---|---|
| 基准提交 | `8272d69bda0fa917cd569d85cbd61f6ed9e28b4e` |
| 追加前字节数（基准提交） | `16602` |
| 追加前 SHA-256（基准提交） | `8783e06c862eabe4c4a88a515bad8630918cf11a423b84e662f3a5e68ecf7323` |
| 既有字节为追加后文件的完整前缀 | `true` |
| 删除字节数 | `0` |
| 删除行数 | `0` |
| 追加后字节数与 SHA-256 | 记于 R2 证据 `evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/records/r1-report-append-only-proof.txt`（文件无法内嵌自身哈希，故不写入本文件） |
'''


def main():
    path = os.path.join(WT, REL)
    base_bytes = subprocess.run(['git', '-C', WT, 'show', '%s:%s' % (BASE, REL)],
                                capture_output=True, check=True).stdout
    cur_bytes = open(path, 'rb').read()
    prefix = cur_bytes.startswith(base_bytes)
    print('base_bytes=%d  base_sha256=%s' % (len(base_bytes), hashlib.sha256(base_bytes).hexdigest()))
    print('cur_bytes=%d  base_is_complete_prefix=%s  deletion_bytes=%d'
          % (len(cur_bytes), prefix, len(cur_bytes) - (len(base_bytes) if prefix else 0)))
    if not prefix:
        print('FAIL: 基准字节不是当前文件的完整前缀')
        return 1
    if '--apply' in sys.argv:
        text = io.open(path, encoding='utf-8').read()
        if '## 12. ChatGPT R1 复审与 R2 定向纠正记录' in text:
            print('已包含 §12，跳过追加')
        else:
            if not text.endswith('\n'):
                text += '\n'
            text += '\n---\n\n' + BLOCK
            io.open(path, 'w', encoding='utf-8').write(text)
            print('已追加 §12')
        after = open(path, 'rb').read()
        print('after_bytes=%d  after_sha256=%s  base_is_complete_prefix=%s'
              % (len(after), hashlib.sha256(after).hexdigest(), after.startswith(base_bytes)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
