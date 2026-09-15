#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""§9 检查 4/5/6/9 的文档侧机器证明：

对 8 份入口文档，把 R1 授权编辑按**逆序**逐一反转（每个逆操作的锚点必须在该文件
当前文本中恰好出现 1 次），再把 R1 追加记录块（`\\n + R1_BLOCK + \\n`）从文末剥离，
要求结果与基准提交 `d77e174...` 的同路径 blob **逐字节相等**。

若相等，则说明：8 份文档相对基准提交的全部差异，恰好等于 R1 脚本声明的那组
授权编辑，不存在任何未授权的增删改。

用法：verify-docs-roundtrip.py <worktree> <base-commit>
"""
import contextlib
import importlib.util
import io
import subprocess
import sys

WORKTREE = sys.argv[1]
BASE = sys.argv[2]


def load_plan():
    """在不执行写盘的前提下取出 r1_docs.py 的编辑定义（其模块末尾会 sys.exit）。"""
    argv_bak = sys.argv[:]
    sys.argv = ['r1_docs.py']          # 不带 --apply => dry-run，不写文件
    sys.dont_write_bytecode = True     # 避免在被加载脚本旁生成 __pycache__
    try:
        spec = importlib.util.spec_from_file_location('r1_docs_mod', '/tmp/dss-r1/r1_docs.py')
        mod = importlib.util.module_from_spec(spec)
        try:
            with contextlib.redirect_stdout(io.StringIO()):   # 屏蔽其 dry-run 自检输出
                spec.loader.exec_module(mod)
        except SystemExit:
            pass
        return mod
    finally:
        sys.argv = argv_bak


def base_blob(rel):
    return subprocess.run(['git', '-C', WORKTREE, 'show', '%s:docs/features/%s' % (BASE, rel)],
                          capture_output=True, check=True).stdout.decode('utf-8')


def main():
    mod = load_plan()
    B, EDITS, R1_BLOCK = mod.B, mod.EDITS, mod.R1_BLOCK
    files = mod.ALL8

    by_file = {}
    for rel, old, new, n in EDITS:
        by_file.setdefault(rel, []).append((old, new, n))

    bad = 0
    for rel in files:
        cur = open(B + rel, encoding='utf-8').read()
        base = base_blob(rel)
        ops = by_file.get(rel, [])

        # 剥离 R1 追加记录块（E10 的等价物）
        suffix = '\n' + R1_BLOCK + '\n'
        if not cur.endswith(suffix):
            print('BAD %s: 文末未出现 R1 记录块' % rel)
            bad += 1
            continue
        stripped = cur[:-len(suffix)]

        # 逆序反转授权编辑
        err = None
        for old, new, n in reversed(ops):
            if n == 0:
                continue                       # E10 已按后缀剥离处理
            c = stripped.count(new)
            if c != 1:
                err = '逆锚点出现 %d 次（期望 1）：%r' % (c, new[:80])
                break
            stripped = stripped.replace(new, old, 1)
        if err:
            print('BAD %s: %s' % (rel, err))
            bad += 1
            continue

        ok = (stripped == base)
        print('file=%s  base_bytes=%d  cur_bytes=%d  r1_block_bytes=%d  '
              'ops=%d  restored_equals_base=%s  unauthorized_diff_count=%d'
              % (rel, len(base.encode('utf-8')), len(cur.encode('utf-8')),
                 len(R1_BLOCK.encode('utf-8')),
                 len([o for o in ops if o[2] != 0]), ok, 0 if ok else 1))
        if not ok:
            bad += 1

    print('total_files=%d  bad=%d' % (len(files), bad))
    print('docs_roundtrip_status=%s' % ('PASS' if bad == 0 else 'FAIL'))
    return 0 if bad == 0 else 1


sys.exit(main())
