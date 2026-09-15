#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R3 共享判定负向自测（NEGATIVE-CONTROL / DO-NOT-USE-AS-BUSINESS-EVIDENCE）。

用途
----
验证 R2 证据脚本 `scripts/run-checks.py` 修复后的白名单判定确实可被证伪：

1. 正向：合法裸路径经共享解析后必须**完整保留**（不得被截取前 3 个字符）；
2. 正向：白名单内路径与 R3 证据前缀路径必须**不被**共享判定拒绝；
3. 负向：合成越界路径 `frontend/src/unauthorized-negative-control.vue`
   必须被共享判定拒绝；
4. 负向：以**真实子进程**运行 `run-checks.py --verify-paths` 必须返回非零退出码，
   并在 stdout 明确报告该路径不在白名单；
5. 不污染：全过程不得创建、修改或暂存任何真实 `frontend/**` 文件，
   不得改变工作区与 Git 索引。

为什么必须调用共享逻辑
----------------------
正向与负向判定都直接 import 生产脚本模块并调用其
`parse_path_lines` / `judge_paths`，以及通过真实子进程调用生产脚本自身的
`--verify-paths` 入口；**不存在**本文件内重复实现的一套"假判定"。
因此本自测通过并不能证明"脚本运行成功"，只证明"判定逻辑真的能分辨合法与越界"。

NEGATIVE-CONTROL / DO-NOT-USE-AS-BUSINESS-EVIDENCE
--------------------------------------------------
本文件及其产生的一切输出只用于证明校验工具的判定能力，
**不构成任何业务失败证据**，也不是对真实项目文件的变更。
"""
import hashlib
import importlib.util
import io
import os
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
WT = os.path.normpath(os.path.join(HERE, '..', '..', '..', '..', '..', '..'))
R2EV = ('docs/features/data-source-snapshot-status/evidence/'
        'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-'
        'IMPLEMENTATION-001-R2/')
R2SCRIPT_REL = R2EV + 'scripts/run-checks.py'
R2SCRIPT_ABS = os.path.join(WT, R2SCRIPT_REL)

PURE_PATH = 'docs/features/data-source-snapshot-status/README.md'
WHITELISTED = PURE_PATH
R3_PREFIX_PATH = ('docs/features/data-source-snapshot-status/evidence/'
                  'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-'
                  'STABILITY-IMPLEMENTATION-001-R3/records/synthetic-probe.txt')
UNAUTHORIZED = 'frontend/src/unauthorized-negative-control.vue'
TAG = 'NEGATIVE-CONTROL-DO-NOT-USE-AS-BUSINESS-EVIDENCE'


def load_production_module():
    """导入生产脚本模块；导入必须无副作用（全部逻辑在 main() 内）。"""
    spec = importlib.util.spec_from_file_location('r2_run_checks', R2SCRIPT_ABS)
    mod = importlib.util.module_from_spec(spec)
    saved = sys.argv
    sys.argv = [R2SCRIPT_ABS]
    buf = io.StringIO()
    real = sys.stdout
    sys.stdout = buf
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.stdout = real
        sys.argv = saved
    leaked = buf.getvalue()
    if leaked.strip():
        raise SystemExit('导入生产脚本产生了输出，存在副作用：%r' % leaked[:200])
    return mod


def sha256_file(path):
    h = hashlib.sha256()
    with io.open(path, 'rb') as fh:
        for chunk in iter(lambda: fh.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()


def git(*args):
    return subprocess.run(['git', '-C', WT] + list(args),
                          capture_output=True, text=True)


def main():
    results = []
    mod = load_production_module()
    tmpdir = tempfile.mkdtemp(prefix='r3-negative-control-')
    tmp_probe = os.path.join(tmpdir, 'synthetic-paths.txt')

    print('# %s' % TAG)
    print('# 被测生产脚本=%s' % R2SCRIPT_REL)
    print('# 生产脚本 sha256=%s' % sha256_file(R2SCRIPT_ABS))
    print('# worktree=%s' % WT)
    print('# 共享逻辑入口=%s' % ', '.join(
        sorted(n for n in ('parse_path_lines', 'parse_porcelain', 'judge_paths')
               if hasattr(mod, n))))
    print('# 临时目录=%s（合成样例，仅存在于 /tmp）' % tmpdir)
    print()

    # --- 前置：工作区与索引的基线指纹（用于证明未被本自测触碰） ---
    idx_before = git('diff', '--cached', '--name-only').stdout
    wt_before = git('status', '--porcelain').stdout
    frontend_real = os.path.join(WT, UNAUTHORIZED)
    real_vue_existed_before = os.path.exists(frontend_real)
    print('# 前置：索引条目数=%d  工作区变更条目数=%d  真实 frontend 上界路径已存在=%s'
          % (len([x for x in idx_before.splitlines() if x.strip()]),
             len([x for x in wt_before.splitlines() if x.strip()]),
             real_vue_existed_before))
    print()

    # --- 1. 正向：裸路径解析必须完整保留 ---
    pure_lines = mod.parse_path_lines(PURE_PATH + '\n')
    ok1 = pure_lines == [PURE_PATH]
    results.append(ok1)
    print('[%s] 1-positive-pure-path-intact :: parse_path_lines(%r) == %r'
          % ('PASS' if ok1 else 'FAIL', PURE_PATH, pure_lines))

    # --- 2. 正向：白名单内路径与 R3 证据前缀路径不被拒绝 ---
    accepted = mod.judge_paths([WHITELISTED, R3_PREFIX_PATH])
    ok2 = accepted == []
    results.append(ok2)
    print('[%s] 2-positive-whitelisted-accepted :: judge_paths([白名单路径, R3 前缀路径]) '
          '== %r' % ('PASS' if ok2 else 'FAIL', accepted))

    # --- 3. 负向：合成越界路径必须被共享判定拒绝 ---
    rejected = mod.judge_paths([UNAUTHORIZED])
    ok3 = rejected == [UNAUTHORIZED]
    results.append(ok3)
    print('[%s] 3-negative-unauthorized-rejected-by-shared-judge :: '
          'judge_paths([%r]) == %r'
          % ('PASS' if ok3 else 'FAIL', UNAUTHORIZED, rejected))

    # --- 4. 负向：真实子进程必须返回非零退出码 ---
    with io.open(tmp_probe, 'w', encoding='utf-8') as fh:
        fh.write('%s\n' % UNAUTHORIZED)
    proc = subprocess.run([sys.executable, R2SCRIPT_ABS, '--verify-paths', tmp_probe],
                          capture_output=True, text=True)
    out_lines = [ln for ln in proc.stdout.splitlines() if ln.strip()]
    ok4 = proc.returncode != 0
    results.append(ok4)
    print('[%s] 4-negative-subprocess-nonzero-exit :: exit_code=%d（期望非 0）'
          % ('PASS' if ok4 else 'FAIL', proc.returncode))
    for ln in out_lines:
        print('       | %s' % ln)
    ok4b = any('OUTSIDE_WHITELIST' in ln for ln in out_lines)
    results.append(ok4b)
    print('[%s] 4b-negative-subprocess-explicit-report :: stdout 含 OUTSIDE_WHITELIST=%s'
          % ('PASS' if ok4b else 'FAIL', ok4b))

    # --- 5. 不污染：索引、工作区与真实 frontend 路径均未被触碰 ---
    idx_after = git('diff', '--cached', '--name-only').stdout
    wt_after = git('status', '--porcelain').stdout
    ok5 = (idx_after == idx_before and wt_after == wt_before
           and not os.path.exists(frontend_real)
           and not real_vue_existed_before)
    results.append(ok5)
    print('[%s] 5-no-pollution :: 索引未变=%s 工作区未变=%s 未创建真实 %s=%s'
          % ('PASS' if ok5 else 'FAIL',
             idx_after == idx_before, wt_after == wt_before,
             UNAUTHORIZED, not os.path.exists(frontend_real)))

    # --- 清理临时合成样例（仅 /tmp 下自建文件） ---
    try:
        os.remove(tmp_probe)
        os.rmdir(tmpdir)
        cleaned = True
    except OSError:
        cleaned = False
    print()
    print('# 合成样例清理=%s（未删除或改动任何真实项目路径）' % cleaned)
    print('final_result=%s' % ('PASS' if all(results) else 'FAIL'))
    return 0 if all(results) else 1


if __name__ == '__main__':
    sys.exit(main())
