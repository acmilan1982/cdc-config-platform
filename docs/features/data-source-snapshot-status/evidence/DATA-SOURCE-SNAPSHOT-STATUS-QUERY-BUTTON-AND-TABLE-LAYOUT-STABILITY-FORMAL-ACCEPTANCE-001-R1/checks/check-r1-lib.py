#!/usr/bin/env python3
"""R1 强制校验辅助库（DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1）。

只提供「基准提交 vs 当前工作区」的精确文本比较原语，供 checks/check-r1.sh 调用。
所有子命令：通过打印 PASS/FAIL 行并返回退出码（0 = 全部通过，非 0 = 有失败）表达结果。
不使用空匹配伪造 PASS：每个断言都同时验证期望数量或目标集合。
"""
import os
import re
import subprocess
import sys

FAILS = []


def fail(msg):
    FAILS.append(msg)
    print("  FAIL %s" % msg)


def ok(msg):
    print("  PASS %s" % msg)


def git_show(repo, base, rel):
    p = subprocess.run(["git", "-C", repo, "show", "%s:%s" % (base, rel)],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode != 0:
        raise SystemExit("GIT_SHOW_FAILED %s: %s" % (rel, p.stderr.decode("utf-8", "replace")))
    return p.stdout.decode("utf-8")


def split_lines(text):
    lines = text.split("\n")
    if lines and lines[-1] == "":
        lines = lines[:-1]
    return lines


def cur_lines_of(worktree, rel):
    with open(os.path.join(worktree, rel), "r", encoding="utf-8") as fh:
        return split_lines(fh.read())


VAGUE = "ZooKeeper 仅只读"
R1_RECORD_PREFIX = "> 查询按钮与表格布局稳定性正式验收 ZooKeeper 边界与结果事实 R1 纠正记录"
INSERT_TOKENS = [
    "历史表述",
    "formal_acceptance_task_initiated_zookeeper_node_operation_status=READ_ONLY_LS_ONE",
    "zookeeper_boundary_compliance_status=VIOLATED_READ_PROHIBITION",
    "zookeeper_write_status=ZERO",
    "zookeeper_acl_change_status=ZERO",
    "feature_zookeeper_dependency=NONE",
    "FORMAL-ACCEPTANCE-001-R1",
]


def cmd_doc_verify(argv):
    """doc-verify <repo> <base> <rel> <m1> <m2> <worktree>

    验证某份入口文档相对基准提交**只有** m1、m2 两行不同，且末行只做「历史限定语插入」，
    并在末行之后**恰好新增一行** R1 记录段。
    该单一断言同时覆盖：DSS-REQ / DSS-AC 业务行、DESIGN §38、UI §32、API / DATABASE 契约正文
    以及其余全部正文的逐字节不变性。
    """
    repo, base, rel, m1_s, m2_s, worktree = argv
    m1, m2 = int(m1_s), int(m2_s)
    base_lines = split_lines(git_show(repo, base, rel))
    cur_lines = cur_lines_of(worktree, rel)
    nb, nc = len(base_lines), len(cur_lines)

    print("doc=%s base_lines=%d cur_lines=%d expected_changed=%d,%d" % (rel, nb, nc, m1, m2))

    if nc != nb + 1:
        fail("%s: 当前行数应为基础行数 +1（仅追加一行 R1 记录），实际 base=%d cur=%d" % (rel, nb, nc))
        return

    # 1) 1..nb-1 行只有 m1 / m2 允许不同
    diffs = [i for i in range(1, nb) if base_lines[i - 1] != cur_lines[i - 1]]
    if sorted(diffs) != sorted([m1, m2]):
        fail("%s: 变更行应为 %s，实际 %s（第 %d 行起为末行区，不在此断言内）"
             % (rel, sorted([m1, m2]), diffs, nb))
    else:
        ok("%s: 除第 %d、%d 行外，1..%d 行逐字节不变（覆盖全部业务行 / §38 / §32 / 契约正文）"
           % (rel, m1, m2, nb - 1))

    # 2) 末行：仅在「ZooKeeper 仅只读」之后插入历史限定语，基础末行原字节一字未删
    tail_base = base_lines[nb - 1]
    cur_tail = cur_lines[nb - 1]
    pos = tail_base.find(VAGUE)
    if pos < 0:
        fail("%s: 基准末行未找到限定语锚点「%s」" % (rel, VAGUE))
        return
    k = pos + len(VAGUE)
    prefix, suffix = tail_base[:k], tail_base[k:]
    if not (cur_tail.startswith(prefix) and cur_tail.endswith(suffix)):
        fail("%s: 末行未保持「基础末行前缀 + 插入 + 基础末行后缀」结构" % rel)
        return
    inserted = cur_tail[len(prefix):len(cur_tail) - len(suffix)]
    if len(cur_tail) != len(prefix) + len(inserted) + len(suffix) or len(inserted) <= 0:
        fail("%s: 末行无法分解出非空插入段" % rel)
        return
    missing = [t for t in INSERT_TOKENS if t not in inserted]
    if missing:
        fail("%s: 末行插入段缺少 %s" % (rel, missing))
    else:
        ok("%s: 末行仅在原句后插入 %d 字节历史限定语，原字节（前缀 %d + 后缀 %d）一字未删"
           % (rel, len(inserted), len(prefix), len(suffix)))

    # 3) 末行之后恰好追加一行 R1 记录段
    appended = cur_lines[nb]
    if not appended.startswith(R1_RECORD_PREFIX):
        fail("%s: 追加行未以 R1 记录段开头" % rel)
    elif "\n" in appended:
        fail("%s: 追加行不是单行记录段" % rel)
    else:
        ok("%s: 末行之后追加 1 行 R1 记录段（%d 字节）" % (rel, len(appended)))


def row_rx(kind):
    if kind == "REQ":
        return re.compile(r"^\| `?(DSS-REQ-[0-9]+)")
    if kind == "AC":
        return re.compile(r"^\| `?(DSS-AC-[0-9]+)")
    raise SystemExit("unknown kind %s" % kind)


def rows_of(lines, kind):
    rx = row_rx(kind)
    return [ln for ln in lines if rx.match(ln)]


def ids_of(lines, kind):
    rx = row_rx(kind)
    out = []
    for ln in lines:
        m = rx.match(ln)
        if m:
            out.append(m.group(1))
    return out


def cmd_rows_verify(argv):
    """rows-verify <repo> <base> <rel> <REQ|AC> <expected_count> <worktree>"""
    repo, base, rel, kind, exp_s, worktree = argv
    exp = int(exp_s)
    base_lines = split_lines(git_show(repo, base, rel))
    cur_lines = cur_lines_of(worktree, rel)
    b = rows_of(base_lines, kind)
    c = rows_of(cur_lines, kind)
    print("doc=%s kind=%s base_rows=%d cur_rows=%d expected_distinct_ids=%d" % (rel, kind, len(b), len(c), exp))
    if len(b) != len(c):
        fail("%s %s: 行数变化 base=%d cur=%d" % (rel, kind, len(b), len(c)))
        return
    diff = [i for i in range(len(b)) if b[i] != c[i]]
    if diff:
        fail("%s %s: %d 行业务行发生逐字节变化（首个：第 %d 行）" % (rel, kind, len(diff), diff[0] + 1))
        return
    ok("%s %s: %d 行业务行相对基准逐字节不变" % (rel, kind, len(c)))

    distinct = sorted(set(ids_of(cur_lines, kind)))
    expected = ["DSS-%s-%03d" % (kind, i) for i in range(1, exp + 1)]
    if distinct != expected:
        missing = [e for e in expected if e not in distinct]
        extra = [d for d in distinct if d not in expected]
        fail("%s %s: 编号集合不符（缺 %s，多 %s）" % (rel, kind, missing[:5], extra[:5]))
    else:
        ok("%s %s: 编号集合完整覆盖 DSS-%s-001~%03d（%d 个）" % (rel, kind, kind, exp, len(distinct)))


def heading_and_boundary(lines, heading_prefix):
    """返回 (heading_idx, boundary_idx)：section 从 heading 行到「尾部记录块引用区」之前的最后一行。"""
    hidx = next((i for i, ln in enumerate(lines) if ln.startswith(heading_prefix)), None)
    if hidx is None:
        raise SystemExit("HEADING_NOT_FOUND %s" % heading_prefix)
    j = len(lines) - 1
    if j >= 0 and lines[j] == "":
        j -= 1
    while j > hidx and (lines[j] == "" or lines[j].startswith("> ")):
        j -= 1
    return hidx, j


def cmd_span_verify(argv):
    """span-verify <repo> <base> <rel> <heading_prefix> <worktree>"""
    repo, base, rel, heading, worktree = argv
    base_lines = split_lines(git_show(repo, base, rel))
    cur_lines = cur_lines_of(worktree, rel)
    bh, be = heading_and_boundary(base_lines, heading)
    ch, ce = heading_and_boundary(cur_lines, heading)
    b_span = base_lines[bh:be + 1]
    c_span = cur_lines[ch:ce + 1]
    print("doc=%s heading=%s base_span_lines=%d cur_span_lines=%d" % (rel, heading, len(b_span), len(c_span)))
    if len(b_span) < 5:
        fail("%s: 章节跨度异常小（%d 行），疑似定位失败" % (rel, len(b_span)))
        return
    if b_span != c_span:
        fail("%s: 章节正文相对基准发生逐字节变化" % rel)
        return
    ok("%s: 章节正文 %d 行相对基准逐字节不变（%s..%s 起）" % (rel, len(c_span), heading, rel))


def main():
    if len(sys.argv) < 2:
        raise SystemExit("usage: check-r1-lib.py <doc-verify|rows-verify|span-verify> ...")
    cmd = sys.argv[1]
    argv = sys.argv[2:]
    if cmd == "doc-verify":
        cmd_doc_verify(argv)
    elif cmd == "rows-verify":
        cmd_rows_verify(argv)
    elif cmd == "span-verify":
        cmd_span_verify(argv)
    else:
        raise SystemExit("unknown command %s" % cmd)
    print("  sub_result=%s failures=%d" % ("PASS" if not FAILS else "FAIL", len(FAILS)))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
