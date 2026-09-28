#!/usr/bin/env python3
"""R4 离线核验脚本：验证 R4 覆盖矩阵的每一条证据引用都可在原始证据包内解析，
并核对矩阵状态与 ACCEPTANCE.md 相应状态格一致、四态统计自洽、状态迁移边界成立。

与 R3 核验器相比，本脚本新增/强化：
  1. 证据引用可解析性（R3 复审发现 29 处无效引用，本脚本须把它们压到 0）：
       - evidence.file 必须在证据包内存在；
       - evidence.key 必须存在于该文件的顶层 `ac` 字典（无 key 的 MISSING 步骤除外）；
       - evidence.fields 的每个路径必须可解析：`meta.*` 指向文件根对象，
         其余字段指向 `ac[key].detail`；支持 `a.b` 与 `[n].x` 下标路径；
       - evidence.shot（如有）必须是包内截图文件名；
  2. 每条用例的矩阵 r4_status 必须等于 ACCEPTANCE.md §4 同名状态格；
  3. 仍为 PASS 的行不得含 MISSING / PARTIAL 步骤；含 SIMULATED_ONLY 的步骤
     必须带非空 justify；非 COVERED 步骤必须带非空 why；
  4. counts / 状态迁移与 ACCEPTANCE.md 相对于 R3 提交的 PASS->BLOCKED 迁移逐条对齐。

用法（仓库根目录）：
    python3 docs/features/client-config/reports/evidence/\\
CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4/verify-coverage-matrix.py \\
        [<证据包解压目录>]

证据包解压目录默认取环境变量 R4_EVIDENCE_DIR，否则 /tmp/fa-evidence-r4。
脚本只读矩阵、ACCEPTANCE.md、README.md、R4 报告与 Git 对象，不写入、不构建、不联网。
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = subprocess.run(["git", "rev-parse", "--show-toplevel"],
                      capture_output=True, text=True).stdout.strip() or "."
ACC_PATH = os.path.join(REPO, "docs/features/client-config/ACCEPTANCE.md")
README_PATH = os.path.join(REPO, "docs/features/client-config/README.md")
REPORT_PATH = os.path.join(
    REPO, "docs/features/client-config/reports/"
    "CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4.md")
MATRIX_PATH = os.path.join(HERE, "coverage-matrix.json")
BASE = "dca1a5b2381078d94653fa4c725e551ddccdc9a7"  # R3 结果提交
EVIDENCE_DIR = (sys.argv[1] if len(sys.argv) > 1
                else os.environ.get("R4_EVIDENCE_DIR", "/tmp/fa-evidence-r4"))
ROW = re.compile(r"^\| (CCFG-AC-\d{3}) \| (NOT_RUN|PASS|FAIL|BLOCKED) \|(.*)$")
STAT_SIG = "PASS` **68** / `FAIL` **0** / `BLOCKED` **71** / `NOT_RUN` **15**"
TOK = re.compile(r"\[(\d+)\]|([^.\[\]]+)")


def rows(text):
    out = {}
    for ln in text.split("\n"):
        m = ROW.match(ln)
        if m:
            out[m.group(1)] = (m.group(2), m.group(3))
    return out


def walk(obj, path):
    """解析 `a.b[0].c` 形式路径；返回 (ok, value)。空路径视为已解析。"""
    if path == "":
        return True, obj
    cur = obj
    for m in TOK.finditer(path):
        if m.group(1) is not None:
            idx = int(m.group(1))
            if not isinstance(cur, list) or idx >= len(cur):
                return False, None
            cur = cur[idx]
        else:
            name = m.group(2)
            if not isinstance(cur, dict) or name not in cur:
                return False, None
            cur = cur[name]
    return True, cur


_files = {}


def load(fname):
    if fname not in _files:
        p = os.path.join(EVIDENCE_DIR, fname)
        _files[fname] = (json.load(open(p, encoding="utf-8"))
                         if os.path.exists(p) else None)
    return _files[fname]


def main():
    ok = True
    bad_refs = []
    checked_refs = 0

    if not os.path.isdir(EVIDENCE_DIR):
        print(f"FAIL: 证据包目录不存在 {EVIDENCE_DIR}")
        sys.exit(1)

    mx = json.load(open(MATRIX_PATH, encoding="utf-8"))
    acc = rows(open(ACC_PATH, encoding="utf-8").read())

    # ---- 1. 证据引用可解析性 ----
    for item in mx["items"]:
        cid = item["id"]
        for s in item["steps"]:
            ev = s["evidence"]
            fname, key = ev.get("file"), ev.get("key")
            fields = ev.get("fields") or []
            shot = s.get("shot")
            # 非 COVERED 步骤须有可审计 why 说明
            if s["verdict"] != "COVERED" and not (s.get("why") or "").strip():
                bad_refs.append((cid, s["kind"], "非 COVERED 步骤缺少 why 说明"))
            # 显式“无证据”标记：MISSING 且未声明任何 key/字段，此时不存在待解析引用
            if s["verdict"] == "MISSING" and not fields and key is None and not shot:
                continue
            if not fname:
                bad_refs.append((cid, s["kind"], "缺少 evidence.file"))
                continue
            if not os.path.exists(os.path.join(EVIDENCE_DIR, fname)):
                bad_refs.append((cid, s["kind"], f"文件不存在 {fname}"))
                continue
            doc = load(fname)
            if doc is None:
                bad_refs.append((cid, s["kind"], f"文件不可解析 {fname}"))
                continue
            if shot and not os.path.exists(os.path.join(EVIDENCE_DIR, shot)):
                bad_refs.append((cid, s["kind"], f"截图不存在 {shot}"))
            if key is not None:
                acdict = doc.get("ac", {})
                if key not in acdict:
                    bad_refs.append((cid, s["kind"],
                                     f"键不存在 {fname}#ac[{key!r}]"))
                    continue
            # 字段路径
            for path in fields:
                checked_refs += 1
                if path == "meta" or path.startswith("meta."):
                    base_obj = doc
                    sub = path
                else:
                    if key is None:
                        bad_refs.append((cid, s["kind"],
                                         f"字段 {path!r} 需要 key 但 key 为空"))
                        continue
                    base_obj = doc["ac"][key].get("detail")
                    sub = path
                good, _ = walk(base_obj, sub)
                if not good:
                    bad_refs.append((cid, s["kind"], f"路径不可解析 {fname}#{path}"))

    if bad_refs:
        print(f"FAIL: 存在 {len(bad_refs)} 处无效证据引用（等待修复：0）")
        for cid, kind, msg in bad_refs:
            print(f"   - {cid} {kind}: {msg}")
        ok = False
    else:
        print(f"OK: 所有证据引用可解析（文件/键/字段路径/截图，共校验 "
              f"{checked_refs} 条字段路径）")

    # ---- 2. 矩阵状态 vs ACCEPTANCE 状态格 ----
    mism = []
    for item in mx["items"]:
        cid = item["id"]
        if cid not in acc:
            mism.append((cid, "ACCEPTANCE 缺该状态格"))
        elif acc[cid][0] != item["r4_status"]:
            mism.append((cid, f"矩阵 {item['r4_status']} != §4 {acc[cid][0]}"))
    if mism:
        print(f"FAIL: {len(mism)} 条矩阵状态与 ACCEPTANCE 不一致")
        for cid, msg in mism:
            print(f"   - {cid}: {msg}")
        ok = False
    else:
        print(f"OK: 覆盖矩阵 {len(mx['items'])} 条 r4_status 与 ACCEPTANCE 状态格一致")

    # ---- 3. PASS 行严格性 ----
    strict = []
    for item in mx["items"]:
        if item["r4_status"] != "PASS":
            continue
        for s in item["steps"]:
            if s["verdict"] in ("MISSING", "PARTIAL"):
                strict.append(f"{item['id']} {s['kind']} 为 {s['verdict']}，不得留在 PASS 行")
            if s["verdict"] == "SIMULATED_ONLY" and not (s.get("justify") or "").strip():
                strict.append(f"{item['id']} {s['kind']} SIMULATED_ONLY 缺少 justify")
    if strict:
        print(f"FAIL: PASS 行存在 {len(strict)} 处不合规步骤")
        for msg in strict:
            print(f"   - {msg}")
        ok = False
    else:
        print("OK: 全部 PASS 行无 MISSING/PARTIAL，SIMULATED_ONLY 均带 justify")

    # ---- 4. 四态统计与迁移 ----
    stats = {}
    for _k, (st, _rest) in acc.items():
        stats[st] = stats.get(st, 0) + 1
    four = {s: stats.get(s, 0) for s in ("PASS", "FAIL", "BLOCKED", "NOT_RUN")}
    print("四态统计：", four, "合计", sum(four.values()))
    if len(acc) != 154 or sum(four.values()) != 154:
        print("FAIL: 编号或四态合计不等于 154")
        ok = False

    base_text = subprocess.run(["git", "show", f"{BASE}:docs/features/client-config/ACCEPTANCE.md"],
                               capture_output=True, text=True).stdout
    base = rows(base_text)
    transitions = {}
    for k in sorted(set(base) & set(acc)):
        if base[k][0] != acc[k][0]:
            transitions.setdefault(f"{base[k][0]}->{acc[k][0]}", []).append(k)
    print("状态变化：", {t: len(v) for t, v in transitions.items()} or "无")
    moved = sorted(transitions.get("PASS->BLOCKED", []))
    mchanged = sorted(mx["counts"]["r4_changed_ids"])
    if mchanged != moved:
        print("FAIL: 矩阵 r4_changed_ids 与 §4 PASS->BLOCKED 迁移不一致")
        print("  矩阵：", mchanged)
        print("  §4  ：", moved)
        ok = False
    else:
        print(f"OK: 矩阵下调 {len(mchanged)} 条与 §4 迁移逐条对齐")
    if mx["counts"]["r4_changed"] != len(mchanged):
        print("FAIL: counts.r4_changed 与列表长度不符")
        ok = False
    if mx["counts"]["pass"] != four["PASS"]:
        print(f"FAIL: counts.pass={mx['counts']['pass']} != §4 PASS={four['PASS']}")
        ok = False

    # ---- 5. 现行统计签名一致性 ----
    for path in (ACC_PATH, README_PATH, REPORT_PATH):
        if not os.path.exists(path):
            print(f"FAIL: 缺少现行统计文件 {os.path.relpath(path, REPO)}")
            ok = False
            continue
        if STAT_SIG not in open(path, encoding="utf-8").read():
            print(f"FAIL: {os.path.relpath(path, REPO)} 未含现行四态统计签名")
            ok = False
    if ok:
        print("OK: 矩阵 / ACCEPTANCE / README / R4 报告现行统计一致")

    print("RESULT:", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
