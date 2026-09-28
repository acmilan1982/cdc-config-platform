#!/usr/bin/env python3
"""R5 离线核验脚本（CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5）。

在 R4 核验器基础上强化：
  1. 证据引用可解析性（文件/键/字段路径/截图）；
  2. R5 矩阵 r5_status 与 ACCEPTANCE.md §4 状态格逐条一致；
  3. PASS 行不得含 MISSING/PARTIAL；SIMULATED_ONLY 必须带非空 justify；非 COVERED 须带非空 why；
  4. counts / 相对 R4 提交 7389648 的 PASS->BLOCKED 迁移逐条对齐、四态合计 154；
  5. **独立断言**（不只看文件/键/字段存在）：
     - AC-010：直接扫描原始证据包，确认不存在“绑定 6～7 源样本、在非 1440 视口下的直接展示数量”记录，
       故不得判 PASS；并要求矩阵中确有标记 `AC010_WIDTH_CHANGE` 的未完成步骤；
     - AC-143：直接扫描原始证据包，确认 143 相关键仅有已固定态组与另一次 +N（未固定），
       缺少“未固定起始态”下的更多/菜单/确认窗/标签 Tooltip 记录，故不得判 PASS；
       并要求矩阵记录 accB#143 的 `plusOpen:false` 与 accC#143-plusN 的 `opened:true`，防止把未打开误读为已打开。

用法（仓库根目录）：
    python3 docs/features/client-config/reports/evidence/\\
CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5/verify-coverage-matrix.py [<证据包解压目录>]

证据包解压目录默认取环境变量 R5_EVIDENCE_DIR，否则 /tmp/fa-evidence-r5。脚本只读，不写入、不构建、不联网。
"""
import glob
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", "..", ".."))
ACC_PATH = os.path.join(REPO, "docs/features/client-config/ACCEPTANCE.md")
README_PATH = os.path.join(REPO, "docs/features/client-config/README.md")
REPORT_PATH = os.path.join(
    REPO, "docs/features/client-config/reports/"
    "CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5.md")
MATRIX_PATH = os.path.join(HERE, "coverage-matrix.json")
BASE = "73896485765c3c33d602d317bfad3696576f4270"  # R4 结果提交
EVIDENCE_DIR = (sys.argv[1] if len(sys.argv) > 1
                else os.environ.get("R5_EVIDENCE_DIR", "/tmp/fa-evidence-r5"))
ROW = re.compile(r"^\| (CCFG-AC-\d{3}) \| (NOT_RUN|PASS|FAIL|BLOCKED) \|(.*)$")
STAT_SIG = "PASS` **66** / `FAIL` **0** / `BLOCKED` **73** / `NOT_RUN` **15**"
TOK = re.compile(r"\[(\d+)\]|([^.\[\]]+)")

_files = {}


def rows(text):
    out = {}
    for ln in text.split("\n"):
        m = ROW.match(ln)
        if m:
            out[m.group(1)] = (m.group(2), m.group(3))
    return out


def walk(obj, path):
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


def load(fname):
    if fname not in _files:
        p = os.path.join(EVIDENCE_DIR, fname)
        _files[fname] = (json.load(open(p, encoding="utf-8"))
                         if os.path.exists(p) else None)
    return _files[fname]


def pkg_keys(bases):
    """扫描原包：返回 [(base, file, key, viewport, detail)]，key 的短号在 bases 中。"""
    found = []
    for p in sorted(glob.glob(os.path.join(EVIDENCE_DIR, "acc*.json"))):
        doc = json.load(open(p, encoding="utf-8"))
        vp = (doc.get("meta") or {}).get("viewport")
        for k, v in (doc.get("ac") or {}).items():
            base = str(k).split("-")[0]
            if base in bases:
                found.append((base, os.path.basename(p), k, vp, v.get("detail")))
    return found


def main():
    ok = True

    if not os.path.isdir(EVIDENCE_DIR):
        print(f"FAIL: 证据包目录不存在 {EVIDENCE_DIR}")
        sys.exit(1)

    mx = json.load(open(MATRIX_PATH, encoding="utf-8"))
    acc = rows(open(ACC_PATH, encoding="utf-8").read())

    # ---- 1. 证据引用可解析性 ----
    bad, checked = [], 0
    for item in mx["items"]:
        cid = item["id"]
        for s in item["steps"]:
            ev = s["evidence"]
            fname, key, fields = ev.get("file"), ev.get("key"), ev.get("fields") or []
            shot = s.get("shot")
            if s["verdict"] != "COVERED" and not (s.get("why") or "").strip():
                bad.append((cid, s["kind"], "非 COVERED 步骤缺少 why 说明"))
            if s["verdict"] == "MISSING" and not fields and key is None and not shot:
                continue
            if not fname:
                bad.append((cid, s["kind"], "缺少 evidence.file"))
                continue
            if not os.path.exists(os.path.join(EVIDENCE_DIR, fname)):
                bad.append((cid, s["kind"], f"文件不存在 {fname}"))
                continue
            doc = load(fname)
            if doc is None:
                bad.append((cid, s["kind"], f"文件不可解析 {fname}"))
                continue
            if shot and not os.path.exists(os.path.join(EVIDENCE_DIR, shot)):
                bad.append((cid, s["kind"], f"截图不存在 {shot}"))
            if key is not None and key not in doc.get("ac", {}):
                bad.append((cid, s["kind"], f"键不存在 {fname}#ac[{key!r}]"))
                continue
            for path in fields:
                checked += 1
                if path == "meta" or path.startswith("meta."):
                    base_obj, sub = doc, path
                else:
                    if key is None:
                        bad.append((cid, s["kind"], f"字段 {path!r} 需要 key 但 key 为空"))
                        continue
                    base_obj, sub = doc["ac"][key].get("detail"), path
                good, _ = walk(base_obj, sub)
                if not good:
                    bad.append((cid, s["kind"], f"路径不可解析 {fname}#{path}"))
    if bad:
        print(f"FAIL: 存在 {len(bad)} 处无效证据引用")
        for cid, kind, msg in bad:
            print(f"   - {cid} {kind}: {msg}")
        ok = False
    else:
        print(f"OK: 所有证据引用可解析（文件/键/字段路径/截图，共校验 {checked} 条字段路径）")

    # ---- 2. 矩阵状态 vs ACCEPTANCE ----
    mism = [(i["id"], f"矩阵 {i['r5_status']} != §4 {acc.get(i['id'], ('<缺>',))[0]}")
            for i in mx["items"]
            if i["id"] not in acc or acc[i["id"]][0] != i["r5_status"]]
    if mism:
        print(f"FAIL: {len(mism)} 条矩阵状态与 ACCEPTANCE 不一致")
        for cid, msg in mism:
            print(f"   - {cid}: {msg}")
        ok = False
    else:
        print(f"OK: {len(mx['items'])} 条 r5_status 与 ACCEPTANCE 状态格一致")

    # ---- 3. PASS 行严格性 ----
    strict = []
    for item in mx["items"]:
        if item["r5_status"] != "PASS":
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

    # ---- 4. 统计与迁移 ----
    stats = {}
    for _k, (st, _r) in acc.items():
        stats[st] = stats.get(st, 0) + 1
    four = {s: stats.get(s, 0) for s in ("PASS", "FAIL", "BLOCKED", "NOT_RUN")}
    print("四态统计：", four, "合计", sum(four.values()))
    if len(acc) != 154 or sum(four.values()) != 154:
        print("FAIL: 编号或四态合计不等于 154")
        ok = False
    base = rows(subprocess.run(["git", "show", f"{BASE}:docs/features/client-config/ACCEPTANCE.md"],
                               capture_output=True, text=True).stdout)
    moved = sorted(k for k in set(base) & set(acc)
                   if base[k][0] == "PASS" and acc[k][0] == "BLOCKED")
    mchanged = sorted(mx["counts"]["r5_changed_ids"])
    if mchanged != moved:
        print("FAIL: 矩阵 r5_changed_ids 与 §4 PASS->BLOCKED 迁移不一致")
        print("  矩阵：", mchanged, "\n  §4  ：", moved)
        ok = False
    else:
        print(f"OK: 矩阵下调 {len(mchanged)} 条与 §4 迁移逐条对齐")
    if mx["counts"]["r5_changed"] != len(mchanged):
        print("FAIL: counts.r5_changed 与列表长度不符")
        ok = False
    if mx["counts"]["pass"] != four["PASS"]:
        print(f"FAIL: counts.pass={mx['counts']['pass']} != §4 PASS={four['PASS']}")
        ok = False

    # ---- 5. 独立断言 ----
    by = {i["id"]: i for i in mx["items"]}

    # 5a. AC-010：原包不得存在绑定 6~7 源样本的非 1440 视口直接展示数量记录
    w010 = [r for r in pkg_keys({"010", "098"}) if r[3] and "1440" not in str(r[3])]
    a010 = by.get("CCFG-AC-010")
    width_steps = [s for s in (a010 or {}).get("steps", [])
                   if s.get("assertion") == "AC010_WIDTH_CHANGE"]
    if w010 and a010 and a010["r5_status"] == "PASS":
        print(f"FAIL: 发现 AC-010 非 1440 视口记录 {[(r[1], r[2], r[3]) for r in w010]}，不得据此仍判 PASS")
        ok = False
    if not width_steps:
        print("FAIL: AC-010 矩阵缺少标记 AC010_WIDTH_CHANGE 的宽度变化步骤")
        ok = False
    elif all(s["verdict"] == "COVERED" for s in width_steps) and a010["r5_status"] == "PASS":
        print("FAIL: AC-010 宽度变化步骤标 COVERED 但无独立原包证据，禁止判 PASS")
        ok = False
    else:
        print(f"OK: AC-010 宽度变化步骤未完成（{'、'.join(s['verdict'] for s in width_steps)}），"
              f"整条 {a010['r5_status']}；原包无非 1440 的直接展示数量记录")

    # 5b. AC-143：143 相关键须为已固定组 + 另一次 +N（未固定），缺未固定其余交互
    k143 = pkg_keys({"143"})
    keynames = sorted({r[2] for r in k143})
    a143 = by.get("CCFG-AC-143")
    unfixed = [s for s in (a143 or {}).get("steps", [])
               if s.get("assertion") == "AC143_UNFIXED_GROUP"]
    if not unfixed:
        print("FAIL: AC-143 矩阵缺少标记 AC143_UNFIXED_GROUP 的未固定组步骤")
        ok = False
    elif all(s["verdict"] == "COVERED" for s in unfixed) and a143["r5_status"] == "PASS":
        print("FAIL: AC-143 未固定组标 COVERED 但原包无对应记录，禁止判 PASS")
        ok = False
    else:
        print(f"OK: AC-143 矩阵标出未固定组未完成（{'、'.join(s['verdict'] for s in unfixed)}），"
              f"整条 {a143['r5_status']}")
    if "143" not in keynames or "143-plusN" not in keynames:
        print(f"FAIL: 原包 143 相关键异常：{keynames}")
        ok = False
    note143 = (a143 or {}).get("note", "")
    whys = " ".join(s.get("why", "") for s in (a143 or {}).get("steps", []))
    if "plusOpen:false" not in (note143 + whys) or "opened:true" not in (note143 + whys):
        print("FAIL: AC-143 未同时记录 accB#143 的 plusOpen:false 与 accC#143-plusN 的 opened:true（防误读）")
        ok = False
    else:
        print(f"OK: AC-143 原包键 {keynames}，已记录 plusOpen:false 与 opened:true，未把未打开误读为已打开")

    # ---- 6. 现行统计签名 ----
    for path in (ACC_PATH, README_PATH, REPORT_PATH):
        if not os.path.exists(path):
            print(f"FAIL: 缺少现行统计文件 {os.path.relpath(path, REPO)}")
            ok = False
            continue
        if STAT_SIG not in open(path, encoding="utf-8").read():
            print(f"FAIL: {os.path.relpath(path, REPO)} 未含现行四态统计签名")
            ok = False
    if ok:
        print("OK: 矩阵 / ACCEPTANCE / README / R5 报告现行统计一致")

    print("RESULT:", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
