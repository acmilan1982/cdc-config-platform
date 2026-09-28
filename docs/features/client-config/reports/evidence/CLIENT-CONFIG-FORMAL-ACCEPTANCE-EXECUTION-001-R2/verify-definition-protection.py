#!/usr/bin/env python3
"""R2 离线核验脚本：验证 ACCEPTANCE.md §4 仅有“状态格”变化、其余定义逐字节不变，
并核对 154 条编号完整/唯一/连续与四态统计自洽。

用法（仓库根目录）：
    python3 docs/features/client-config/reports/evidence/\
CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R2/verify-definition-protection.py <base_commit>

base_commit 默认取 R2 起始提交 5f36601（R1 纠错提交）。
脚本只读 Git 对象与工作区文件，不做任何写入/构建/网络访问。
"""
import re
import subprocess
import sys

ACC_PATH = "docs/features/client-config/ACCEPTANCE.md"
BASE = sys.argv[1] if len(sys.argv) > 1 else "5f3660102b850d9890211a0438c45eba4432c477"
ROW = re.compile(r"^\| (CCFG-AC-\d{3}) \| (NOT_RUN|PASS|FAIL|BLOCKED) \|(.*)$")


def rows(text):
    out = {}
    for ln in text.split("\n"):
        m = ROW.match(ln)
        if m:
            out[m.group(1)] = (m.group(2), m.group(3))
    return out


def main():
    base_text = subprocess.run(
        ["git", "show", f"{BASE}:{ACC_PATH}"],
        check=True, capture_output=True, text=True,
    ).stdout
    cur_text = open(ACC_PATH, encoding="utf-8").read()
    base, cur = rows(base_text), rows(cur_text)

    nums = sorted(int(k.split("-")[-1]) for k in cur)
    ok = True

    if len(cur) != 154 or nums != list(range(1, 155)):
        print(f"FAIL: 编号应完整/唯一/连续 154 条，实得 {len(cur)}")
        ok = False
    else:
        print("OK: 154 条编号完整、唯一、连续（CCFG-AC-001~154）")

    if set(base) != set(cur):
        print("FAIL: 编号集合与基线不一致")
        ok = False

    # 除状态格外，定义字节不变
    changed_def = []
    for k in sorted(set(base) & set(cur)):
        if base[k][1] != cur[k][1]:
            changed_def.append(k)
    if changed_def:
        print(f"FAIL: 定义列发生变化（应仅状态格变化）：{changed_def}")
        ok = False
    else:
        print("OK: 除状态格外，§4 全部定义单元逐字节不变")

    stats = {}
    for _k, (st, _rest) in cur.items():
        stats[st] = stats.get(st, 0) + 1
    total = sum(stats.values())
    print("四态统计：", {s: stats.get(s, 0) for s in ("PASS", "FAIL", "BLOCKED", "NOT_RUN")}, "合计", total)
    if total != 154:
        print("FAIL: 四态合计不等于 154")
        ok = False

    transitions = {}
    for k in sorted(set(base) & set(cur)):
        if base[k][0] != cur[k][0]:
            transitions.setdefault(f"{base[k][0]}->{cur[k][0]}", []).append(k)
    print("状态变化：", {t: len(v) for t, v in transitions.items()} or "无")

    print("RESULT:", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
