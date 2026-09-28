#!/usr/bin/env python3
"""R3 离线核验脚本：验证 ACCEPTANCE.md §4 仅有“状态格”变化、其余定义逐字节不变，
核对 154 条编号完整/唯一/连续、四态统计自洽，并把状态迁移与本目录覆盖矩阵的
`r3_changed_ids` 逐条对齐，最后检查 ACCEPTANCE/README/R3 报告/矩阵现行统计一致。

用法（仓库根目录）：
    python3 docs/features/client-config/reports/evidence/\
CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R3/verify-definition-protection.py <base_commit>

base_commit 默认取 R3 起始提交 999de14（R2 纠错提交）。
脚本只读 Git 对象与工作区文件，不做任何写入/构建/网络访问。
"""
import json
import os
import re
import subprocess
import sys

ACC_PATH = "docs/features/client-config/ACCEPTANCE.md"
README_PATH = "docs/features/client-config/README.md"
REPORT_PATH = ("docs/features/client-config/reports/"
               "CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R3.md")
MATRIX_PATH = ("docs/features/client-config/reports/evidence/"
               "CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R3/coverage-matrix.json")
BASE = sys.argv[1] if len(sys.argv) > 1 else "999de14087f0d4ae1054d7d50fb4cca09dd910dd"
ROW = re.compile(r"^\| (CCFG-AC-\d{3}) \| (NOT_RUN|PASS|FAIL|BLOCKED) \|(.*)$")
STAT_SIG = "PASS` **71** / `FAIL` **0** / `BLOCKED` **68** / `NOT_RUN` **15**"


def rows(text):
    out = {}
    for ln in text.split("\n"):
        m = ROW.match(ln)
        if m:
            out[m.group(1)] = (m.group(2), m.group(3))
    return out


def main():
    ok = True
    base_text = subprocess.run(
        ["git", "show", f"{BASE}:{ACC_PATH}"],
        check=True, capture_output=True, text=True,
    ).stdout
    cur_text = open(ACC_PATH, encoding="utf-8").read()
    base, cur = rows(base_text), rows(cur_text)

    nums = sorted(int(k.split("-")[-1]) for k in cur)

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
    four = {s: stats.get(s, 0) for s in ("PASS", "FAIL", "BLOCKED", "NOT_RUN")}
    print("四态统计：", four, "合计", total)
    if total != 154:
        print("FAIL: 四态合计不等于 154")
        ok = False

    transitions = {}
    for k in sorted(set(base) & set(cur)):
        if base[k][0] != cur[k][0]:
            transitions.setdefault(f"{base[k][0]}->{cur[k][0]}", []).append(k)
    print("状态变化：", {t: len(v) for t, v in transitions.items()} or "无")

    moved = sorted(transitions.get("PASS->BLOCKED", []))
    print(f"PASS->BLOCKED 共 {len(moved)} 条")

    # 与覆盖矩阵对齐
    if not os.path.exists(MATRIX_PATH):
        print(f"FAIL: 缺少覆盖矩阵 {MATRIX_PATH}")
        ok = False
    else:
        mx = json.load(open(MATRIX_PATH, encoding="utf-8"))
        mchanged = sorted(mx["counts"]["r3_changed_ids"])
        if mx["counts"]["items"] != 89:
            print("FAIL: 覆盖矩阵 items 应为 89，实得", mx["counts"]["items"])
            ok = False
        if mx["counts"]["r3_changed"] != len(mchanged):
            print("FAIL: 覆盖矩阵 r3_changed 与列表长度不符")
            ok = False
        if mchanged != moved:
            print("FAIL: 覆盖矩阵 r3_changed_ids 与 §4 PASS->BLOCKED 迁移不一致")
            print("  矩阵：", mchanged)
            print("  §4  ：", moved)
            ok = False
        else:
            print(f"OK: 覆盖矩阵 {mx['counts']['items']} 条 / 下调 {len(mchanged)} 条与 §4 迁移逐条对齐")
        # 每一条下调用例在矩阵内确有 MISSING/SIMULATED_ONLY 步骤
        for item in mx["items"]:
            cid = item["id"]
            if cid in moved:
                bad = [s for s in item["steps"]
                       if s["verdict"] in ("MISSING", "SIMULATED_ONLY")]
                if not bad:
                    print(f"FAIL: 下调用例 {cid} 在矩阵中未标出缺失步骤")
                    ok = False
        # PASS 行不得含 MISSING 步骤；含 SIMULATED_ONLY 时须有说明性备注
        for item in mx["items"]:
            if item["r3_status"] == "PASS":
                miss = [s for s in item["steps"] if s["verdict"] == "MISSING"]
                if miss:
                    print(f"FAIL: 仍为 PASS 的 {item['id']} 含 MISSING 步骤")
                    ok = False
                sim = [s for s in item["steps"]
                       if s["verdict"] == "SIMULATED_ONLY"]
                if sim and not item.get("note"):
                    print(f"FAIL: 仍为 PASS 的 {item['id']} 含 SIMULATED_ONLY 但无说明备注")
                    ok = False

    # 现行统计一致性
    for path in (ACC_PATH, README_PATH, REPORT_PATH):
        if not os.path.exists(path):
            print(f"FAIL: 缺少现行统计文件 {path}")
            ok = False
            continue
        txt = open(path, encoding="utf-8").read()
        if STAT_SIG not in txt:
            print(f"FAIL: {path} 未含现行四态统计签名")
            ok = False
    if ok:
        print("OK: ACCEPTANCE/README/R3 报告/覆盖矩阵现行统计一致")

    print("RESULT:", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
