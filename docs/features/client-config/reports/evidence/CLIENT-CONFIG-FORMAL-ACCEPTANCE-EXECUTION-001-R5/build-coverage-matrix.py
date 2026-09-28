#!/usr/bin/env python3
"""R5 覆盖矩阵生成脚本（CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5）。

以 R4 已提交的覆盖矩阵（提交 7389648）为基线，仅对复审点名的两条仍为 PASS 的用例
`CCFG-AC-010`（宽度变化）与 `CCFG-AC-143`（未固定/已固定两组初始状态）按现行定义
重新拆分步骤并下调为 BLOCKED；其余 87 条逐字沿用 R4 判定与引用。

人工逐条审核结果内嵌于本脚本；脚本只做组织与渲染，**不**由结果布尔值自动推导覆盖。

用法（仓库根目录）：
    python3 docs/features/client-config/reports/evidence/\\
CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5/build-coverage-matrix.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", "..", ".."))
R4_MATRIX = os.path.join(
    REPO, "docs/features/client-config/reports/evidence/"
    "CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4/coverage-matrix.json")
OUT_JSON = os.path.join(HERE, "coverage-matrix.json")
OUT_MD = os.path.join(HERE, "coverage-matrix.md")

A, B, B2, C, D, E, F, G, H, I, J, R = (
    "accA.json", "accB.json", "accB2.json", "accC.json", "accD.json", "accE.json",
    "accF.json", "accG.json", "accH.json", "accI.json", "accJ.json", "acc-result.json")

HEADER = {
    "task": "CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5",
    "base_commit": "73896485765c3c33d602d317bfad3696576f4270",
    "raw_package_sha256": "1cf178aefb03b0727e5b036ee66123631cf8d4a525622177749e258e0a5e15e6",
    "source_of_truth": "ACCEPTANCE.md §4 现行定义（含定向修订）",
    "scope": "复审点名的 CCFG-AC-010（宽度变化）与 CCFG-AC-143（未固定/已固定两组）逐步骤复核；其余 87 条沿用 R4",
    "verdict_vocab": ["COVERED", "MISSING", "SIMULATED_ONLY", "PARTIAL"],
    "path_basis": "evidence.fields 中 `meta.*` 指向 JSON 文件根对象；其余字段指向 `ac[key].detail`（支持 `a.b` 与 `[n].x` 下标路径）；`shot` 指向包内截图文件名",
    "desensitization": "业务可识别值（机构名称、探针 ID、原始数据源 ID 等）以占位/描述替代；保留原始文件名、JSON 键名与字段路径，便于持有原包者逐项对账",
    "note": "判定为人工逐条审核结果，非由结果布尔值自动推导；非 COVERED 步骤不得使整条 PASS；PARTIAL/SIMULATED_ONLY 不因核验器放行而自动等同完整 PASS",
}

SEMANTICS = {
    "COVERED": "原始证据中存在执行本条现行定义所要求具体条件的记录（字段值或截图，含注明视口）",
    "MISSING": "原始证据中不存在该步骤的执行记录（含仅有静态样式/公式外推而无实测）",
    "PARTIAL": "该步骤仅有部分状态/方向/视口被实测；PARTIAL 不足以使整条 PASS，除非另有步骤显式补足本步骤的具体条件",
    "SIMULATED_ONLY": "该步骤仅由受控模拟（simulated:true）覆盖；仅在必须提供 justification 且该步骤不属定义要求的真实后端/写入时方可留在 PASS 行",
}


def S(kind, definition, fname, key, fields, verdict, why,
      shot=None, justify=None, assertion=None, viewport=None):
    st = {
        "kind": kind,
        "definition": definition,
        "evidence": {"key": key, "file": fname, "fields": fields},
        "verdict": verdict,
        "why": why,
    }
    if shot:
        st["shot"] = shot
    if justify:
        st["justify"] = justify
    if assertion:
        st["assertion"] = assertion
    if viewport:
        st["viewport"] = viewport
    return st


# ---------------------------------------------------------------------------
# 本轮重判：仅 CCFG-AC-010 与 CCFG-AC-143（PASS -> BLOCKED）
# ---------------------------------------------------------------------------
OVERRIDE = {
    "CCFG-AC-010": {
        "r5_status": "BLOCKED",
        "basis": "B/C",
        "note": "已执行子步骤保留：1440×900 下单行、行高一致 53px、无溢出、max6Rule/plusAccurate、7 源样本（+6）；"
                "缺口为“调整浏览器宽度”这一步——原包另有 1024×900 列表观测（属 AC-093），但未绑定本条 6～7 源样本，"
                "也无同一 6～7 源样本在改变宽度前后的直接展示数量对比。",
        "steps": [
            S("PRE", "库内存在含 6～7 个数据源的探针", G, "098",
              ["rowsAtLeast6Sources[0].total", "rowsAtLeast6Sources[0].direct",
               "rowsAtLeast6Sources[0].plus"], "COVERED",
              "098 的 7 源探针样本（total=7、direct=1、plus=+6）证明该类样本存在且 +N 准确", viewport="1440x900"),
            S("STEP", "调整浏览器宽度并观察“采集数据源”列视觉", G, "010",
              ["rowH", "uniformRowHeight", "singleLine", "noOverflow", "overflowProp"], "COVERED",
              "1440×900 下单行、行高一致 53px、无溢出（overflow:hidden）实测", viewport="1440x900"),
            S("STEP", "调整浏览器宽度并观察（宽度变化腿）", H, "093",
              ["singleLineAllRows", "uniformRowHeight", "pageLevelHorizontalOverflow",
               "plusNTxt", "hiddenComputed", "plusNOpensWithAccurateCount"], "PARTIAL",
              "原包另有 1024×900 的列表观测（属 AC-093 记录）：单行保持、行高一致、无页面级横向溢出、"
              "+N=“+4” 与隐藏数 4 自洽；但该记录未绑定本条 6～7 源样本，也无宽度变化前后的直接展示数量对比，"
              "属另一用例的窄视口记录，不能单独完成本条“调整浏览器宽度”步骤",
              viewport="1024x900", assertion="AC010_WIDTH_CHANGE"),
            S("EXP", "单行机构名称标签；按单元格实际可用宽度自适应决定直接展示数量；"
                     "含 6～7 源时最多直接展示 6 项、其余准确 `+N`；不撑高行、不裁切、不出现第二行/滚动条/越界",
              G, "010", ["max6Rule", "plusAccurate", "maxDirectShown", "tdPadding"], "COVERED",
              "1440×900 下 max6Rule/plusAccurate 为真、内边距 12px/12px、direct ≤ 6", viewport="1440x900"),
            S("EXP", "按单元格实际可用宽度自适应决定直接展示数量（同一 6～7 源样本在改变宽度前后的对比）",
              None, None, [], "MISSING",
              "原包无同一 6～7 源样本在改变宽度前后的直接展示数量对比记录；仅凭单视口值或跨用例窄视口记录"
              "不足以证明该自适应步骤", assertion="AC010_WIDTH_CHANGE"),
        ],
    },
    "CCFG-AC-143": {
        "r5_status": "BLOCKED",
        "basis": "B/C",
        "note": "已执行子步骤保留：accB#143 的已固定态组（更多/菜单项/确认窗/取消/标签点击，idx 恒为 0）、"
                "accC#143-plusN 的 +N（opened:true，固定态采样 0）、accB2#142-d 的键盘 Enter/空格；"
                "缺口为“未固定选中任何行”起始态下的更多/菜单/确认窗/标签 Tooltip/ID 键盘记录（两组场景未齐）。"
                "accB#143 的 plusN 步骤记录 plusOpen:false（未打开），不得解释为已打开。",
        "steps": [
            S("STEP", "已固定选中一行时：更多触发器/菜单项/启停或删除确认窗（含取消）/标签 Tooltip 均不改变固定选中",
              B, "143", ["[0].idx", "[1].items", "[1].idx", "[3].boxOpen", "[4].idx", "[6].idx"], "PARTIAL",
              "accB#143 自 baseline-fixed（idx=0）起，覆盖固定态下更多/菜单/确认窗打开与取消/标签点击；"
              "其中 plusN 步骤记录 plusOpen:false（未打开），本次未覆盖该点击是否打开完整清单",
              viewport="1440x900", assertion="AC143_FIXED_GROUP"),
            S("STEP", "未固定选中任何行时：重复同上各类交互并观察该行是否被固定选中",
              C, "143-plusN", ["opened", "fixed0", "fixed1", "fixed2"], "PARTIAL",
              "accC#143-plusN 记录 +N 打开（opened:true）且固定态采样 fixed0/1/2=0（未固定）；"
              "仅覆盖“未固定起始态”下的 +N 一项，未覆盖未固定下的更多/菜单/确认窗/标签 Tooltip",
              viewport="1440x900", assertion="AC143_UNFIXED_GROUP"),
            S("STEP", "探针 ID 的 Enter／Space 键盘编辑不改变固定选中",
              B2, "142-d", ["fixedBeforeEnter", "enterOpensDialog", "fixedAfterEnter",
                            "spaceOpensDialog", "fixedAfterSpace", "fixedAtStart", "fixedAtEnd"], "PARTIAL",
              "accB2#142-d（属 AC-142 记录）证明 Enter/空格打开编辑且固定态保持 0；"
              "但该键未在“未固定起始态”下执行，且属另一用例记录",
              viewport="1440x900", assertion="AC143_UNFIXED_GROUP"),
            S("EXP", "点击“更多”触发器、菜单项、启停／删除确认窗口（含遮罩与按钮）、`+N`、数据源标签 Tooltip 触发器"
                     "均不触发固定选中切换；两组初始选中状态下均须保持",
              None, None, [], "MISSING",
              "定义要求“未固定”与“已固定”两组初始状态下逐一覆盖六类交互；原包缺失“未固定起始态”下的"
              "更多/菜单/确认窗/标签 Tooltip 记录，两组场景未齐，不得仅以 idx=0 证明两组",
              assertion="AC143_UNFIXED_GROUP"),
        ],
    },
}


def build():
    base = json.load(open(R4_MATRIX, encoding="utf-8"))
    items = []
    changed = []
    for it in base["items"]:
        cid = it["id"]
        r4 = it["r4_status"]
        if cid in OVERRIDE:
            ov = OVERRIDE[cid]
            items.append({
                "id": cid,
                "r4_status": r4,
                "r5_status": ov["r5_status"],
                "basis": ov["basis"],
                "steps": ov["steps"],
                "note": ov["note"],
            })
            if ov["r5_status"] != r4:
                changed.append(cid)
        else:
            it = dict(it)
            it["r5_status"] = r4
            items.append(it)
    changed.sort()
    counts = {
        "items": len(items),
        "r5_changed": len(changed),
        "r5_changed_ids": changed,
        "pass": sum(1 for i in items if i["r5_status"] == "PASS"),
    }
    return {
        "header": HEADER,
        "semantics": SEMANTICS,
        "counts": counts,
        "items": items,
    }


def render_md(mx):
    out = ["# R5 逐步骤覆盖矩阵（CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5）", ""]
    h, c = mx["header"], mx["counts"]
    out += [
        f"- 任务：`{h['task']}`",
        f"- 基线提交：`{h['base_commit']}`",
        f"- 原始证据包 SHA-256：`{h['raw_package_sha256']}`",
        f"- 范围：{h['scope']}",
        f"- 路径基准：{h['path_basis']}",
        f"- 用例数：{c['items']}；本轮下调：{c['r5_changed']}（{'、'.join(c['r5_changed_ids'])}）；整条 PASS：{c['pass']}",
        "",
        "## 覆盖语义",
        "",
        "| 判定 | 含义 |",
        "|---|---|",
    ]
    for k, v in mx["semantics"].items():
        out.append(f"| `{k}` | {v} |")
    out += ["", "## 逐条（仅列本轮涉及的用例；其余逐字沿用 R4）", ""]
    for it in mx["items"]:
        if it["id"] not in ("CCFG-AC-010", "CCFG-AC-143"):
            continue
        out += [f"### {it['id']} —— `{it['r4_status']}` → `{it['r5_status']}`（{it['basis']}）", ""]
        if it.get("note"):
            out += [f"> {it['note']}", ""]
        out += ["| 类型 | 定义要点 | 证据（文件#键；视口） | 字段 | 判定 | 依据 |",
                "|---|---|---|---|---|---|"]
        for s in it["steps"]:
            ev = s["evidence"]
            loc = f"{ev['file']}#{ev['key']}" if ev.get("file") else "（无证据）"
            if s.get("viewport"):
                loc += f" @{s['viewport']}"
            if s.get("shot"):
                loc += f" [{s['shot']}]"
            fields = "、".join(f"`{x}`" for x in ev.get("fields") or []) or "—"
            out.append(f"| {s['kind']} | {s['definition']} | {loc} | {fields} | **{s['verdict']}** | {s['why']} |")
        out.append("")
    return "\n".join(out) + "\n"


def main():
    mx = build()
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(mx, f, ensure_ascii=False, indent=2)
        f.write("\n")
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write(render_md(mx))
    c = mx["counts"]
    print(f"items={c['items']} changed={c['r5_changed']} pass={c['pass']}")
    print("changed_ids=" + ",".join(c["r5_changed_ids"]))


if __name__ == "__main__":
    main()
