#!/usr/bin/env python3
"""R4 覆盖矩阵生成器（人工判定为源，脚本仅做结构化修正与输出）。

以 **R3 已提交的覆盖矩阵**（`../CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R3/coverage-matrix.json`，
冻结历史快照）为基线，套用下方**人工逐条审核**后的显式修正表（`PATCH`）与状态调整（`STATUS_OVERRIDE`），
生成脱敏、可审阅、证据路径可解析的 R4 矩阵：

  - coverage-matrix.json
  - coverage-matrix.md

修正范围（逐项见 R4 报告 §3）：
  1. 修复 R3 矩阵中 29 个无法在原始包内解析的 `evidence.file/key/fields` 引用（含字段改名与列表下标路径）；
  2. 对复审点名仍为 PASS 的 `012/041/046` 按现行定义重判并下调为 `BLOCKED`；
  3. 为 `129` 的 `PARTIAL` 锁定态与 `144` 的 `SIMULATED_ONLY` 受控注入补充显式、可审计的判定语义。

R0~R3 报告与 R3 索引目录**不回写**；本 R4 矩阵为**现行结论**。
用法（本目录）：python3 build-coverage-matrix.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
R3_JSON = os.path.normpath(os.path.join(
    HERE, "..", "CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R3", "coverage-matrix.json"))

HEADER = {
    "task": "CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R4",
    "base_commit": "dca1a5b2381078d94653fa4c725e551ddccdc9a7",
    "raw_package_sha256": "1cf178aefb03b0727e5b036ee66123631cf8d4a525622177749e258e0a5e15e6",
    "source_of_truth": "ACCEPTANCE.md §4 现行定义（含定向修订）",
    "scope": "R3 后仍为 PASS 的 71 条逐步骤覆盖核实 + R3 矩阵全部证据引用可解析性修正",
    "verdict_vocab": ["COVERED", "MISSING", "SIMULATED_ONLY", "PARTIAL"],
    "path_basis": "evidence.fields 中 `meta.*` 指向 JSON 文件根对象；其余字段指向 `ac[key].detail`（支持 `a.b` 与 `[n].x` 下标路径）；`shot` 指向包内截图文件名",
    "desensitization": "业务可识别值（机构名称、探针 ID、原始数据源 ID 等）以占位/描述替代；保留原始文件名、JSON 键名与字段路径，便于持有原包者逐项对账",
    "note": "判定为人工逐条审核结果，非由 v:PASS/all:true 等结果布尔值自动推导；交叉引用他用例证据处已注明所证明的具体条件；PARTIAL/SIMULATED_ONLY 不因核验器放行而自动等同完整 PASS",
}


def S(kind, definition, fname, key, fields, verdict, why, shot=None, justify=None):
    e = {"key": key, "file": fname, "fields": fields}
    st = {"kind": kind, "definition": definition, "evidence": e, "verdict": verdict, "why": why}
    if shot:
        st["shot"] = shot
    if justify:
        st["justify"] = justify
    return st


A, B, B2, C, D, E, F, G, H, I, J, R = (
    "accA.json", "accB.json", "accB2.json", "accC.json", "accD.json", "accE.json",
    "accF.json", "accG.json", "accH.json", "accI.json", "accJ.json", "acc-result.json")

# ---------------------------------------------------------------------------
# 修正表：key = (用例短号, 步骤下标(0 基))，value = 替换后的步骤列表（可增删步骤）
# 未列出的步骤逐字沿用 R3 矩阵。
# ---------------------------------------------------------------------------
PATCH = {
    # --- 002：EXP 老字段 `states` 不存在；拆为“自动展示 + 三态标识（跨 087/088）” ---
    ("002", 2): [
        S("EXP", "页面自动查询并展示全部记录、状态记录不被隐藏", A, "002", ["allShown"], "COVERED",
          "首屏全量展示实测"),
        S("EXP", "探针 ID 后状态标识按三态呈现（跨用例 087/088）", A, "087",
          ["mark.text", "mark.color", "offRows", "enabledWithoutMark"], "COVERED",
          "087 证明“停用”标识文本/配色与“启用无标识”计数"),
        S("EXP", "异常行显示红色 `异常：{原始值}`（跨用例 088）", A, "088", ["[0].shown", "[0].api"],
          "COVERED", "088 证明异常标识文本与其接口原始值一致"),
    ],
    # --- 010：字段改名 heights→rowH/uniformRowHeight、allSingleLine→singleLine、
    #          max6→max6Rule、tdPad→tdPadding；并补 6~7 数据源样本的跨用例证据（098） ---
    ("010", 0): [
        S("PRE", "库内存在含 6～7 个数据源的探针（跨用例 098）", G, "098",
          ["rowsAtLeast6Sources[0].total", "rowsAtLeast6Sources[0].direct", "rowsAtLeast6Sources[0].plus"],
          "COVERED", "098 的 7 源探针样本（total=7、direct=1、+6）证明该类样本存在且 +N 准确"),
    ],
    ("010", 1): [
        S("STEP", "调整宽度观察“采集数据源”列视觉", G, "010",
          ["rowH", "uniformRowHeight", "singleLine", "noOverflow", "overflowProp"], "COVERED",
          "行高一致、单行、无溢出且 overflow:hidden 实测"),
    ],
    ("010", 2): [
        S("EXP", "单行最多直接展示 6、`+N` 准确、盒模型内边距", G, "010",
          ["max6Rule", "plusAccurate", "maxDirectShown", "tdPadding"], "COVERED",
          "max6Rule/plusAccurate 为真、内边距 12px/12px 实测"),
    ],
    # --- 082：`abn` 实为 `abnormal` ---
    ("082", 1): [
        S("STEP", "分别对启用/停用/异常三类记录点击“更多”并记录下拉可见项", D, "082",
          ["enabled", "disabled", "abnormal", "order"], "COVERED",
          "三类下拉条目实测（异常行仅“停用＋删除”）"),
    ],
    # --- 088：detail 为列表，字段需带 [0] 下标 ---
    ("088", 0): [
        S("STEP", "核对界面 `异常：{原始值}` 与接口 fgActive 原始值", A, "088",
          ["[0].shown", "[0].api"], "MISSING",
          "仅 1 条异常样本且无 1920×1080 观测腿（见本行 STEP 缺失）"),
    ],
    ("088", 1): [
        S("EXP", "异常原值与接口一致、红色标识、下拉符合三态表", A, "088", ["[0].shown", "[0].api"],
          "COVERED", "shown 与 api 值一致（同为原始字符串）"),
    ],
    # --- 098：srcW 位于列表元素内 ---
    ("098", 1): [
        S("STEP", "在 1440×900 与 1920×1080 与缩窄窗口下观察直接展示数量与 `+N` 自洽", G, "098",
          ["rowsAtLeast6Sources[0].srcW", "rowsAtLeast6Sources[0].direct", "rowsAtLeast6Sources[0].plus"],
          "MISSING", "仅 1440×900 一腿且仅 ≥7 一类样本；无 1920/缩窄腿、无恰好 6 样本"),
    ],
    # --- 128：该 EXP 步骤本就无证据，显式置为“无证据”标记（无 key/字段可指） ---
    ("128", 3): [
        S("EXP", "首位字符、允许字符集、判空、大小写不敏感唯一性（含后端校验）不放宽", None, None, [],
          "MISSING", "全包无真实后端唯一性校验记录（无可指向的证据键）"),
    ],
    # --- 141：字段改名 afterClick→click、afterSecondClick→clickAgainCancel ---
    ("141", 0): [
        S("STEP", "点击固定 / 再次点击取消 / 转移 / 最多一行 / ID 单击切换", B, "141",
          ["click", "clickAgainCancel", "transferToOther", "maxOne", "idCellClickToggles"], "COVERED",
          "五类断言均有实测值（含 ID 单元格单击）"),
    ],
    ("141", 1): [
        S("STEP", "点击固定 / 再次点击取消 / 转移 / 最多一行 / ID 单击切换", B, "141",
          ["click", "clickAgainCancel", "refix", "transferToOther", "maxOne", "idCellClickToggles"],
          "COVERED", "点击=0（固定）、再次点击取消=-1、重复固定 refix=0、转移至他行=1、至多一行=1"),
    ],
    # --- 142：accB2#142-d 键盘字段改名 ---
    ("142", 1): [
        S("STEP", "探针 ID 键盘 Enter/空格打开编辑且不切换固定选中", B2, "142-d",
          ["fixedBeforeEnter", "enterOpensDialog", "fixedAfterEnter", "spaceOpensDialog", "fixedAfterSpace",
           "fixedAtStart", "fixedAtEnd"], "COVERED",
          "Enter/空格均打开编辑、固定态在前后保持 0 不变"),
    ],
    # --- 143：accB#143 为步骤列表（带下标）；accB2#142-d 字段改名 ---
    ("143", 0): [
        S("STEP", "点击“更多”/菜单项/确认窗/`+N`/标签均不切换固定选中", B, "143",
          ["[0].idx", "[1].items", "[1].idx", "[3].boxOpen", "[4].idx"], "COVERED",
          "各步 idx 恒为 0（固定选中不变），菜单条目为“停用＋删除”"),
    ],
    ("143", 1): [
        S("STEP", "探针 ID Enter/空格键盘编辑隔离", B2, "142-d",
          ["fixedBeforeEnter", "enterOpensDialog", "fixedAfterEnter"], "COVERED",
          "键盘编辑打开弹窗且固定态不意外变化"),
    ],
    # --- 149：字段改名 results→samples、narrow→narrowStable；红/异常标签补截图 ---
    ("149", 0): [
        S("STEP", "绿/红/异常提示在行内清晰可读、不被灰底吞没、不变灰", B2, "149",
          ["greenTag", "samples", "stableAcrossIdleHoverFixed"], "COVERED",
          "样本集合含 green/red/abnormal，绿标签色值实测，跨 idle/hover/fixed 稳定",
          shot="B2-149-tags-1440.png"),
        S("STEP", "窄视口下仍可读且状态可区分", B2, "149", ["narrowStable"], "COVERED",
          "窄视口稳定性实测", shot="B2-149-narrow-900.png"),
    ],
    # --- 150：字段改名 focusability→idTab、focusStyle→focus 轮廓字段；补悬停/固定跨用例 ---
    ("150", 0): [
        S("STEP", "键盘焦点、悬停、固定选中三态互不混淆且各自可辨识", B, "150",
          ["idTab", "outlineColor", "outlineWidth", "note"], "COVERED",
          "ID 跨度 tabindex=0 且带可见焦点环（note 明示），轮廓色为中性近黑非蓝"),
        S("STEP", "悬停态（跨用例 147）与固定选中态（跨用例 148）视觉层级", B, "147",
          ["hoverBg", "onlyRow", "afterAway"], "COVERED", "147 证明悬停临时高亮、单一目标"),
        S("STEP", "固定选中态视觉（跨用例 148）", B, "148",
          ["fixedBg", "leftLine"], "COVERED", "148 证明固定选中底色与左缘强调线"),
    ],
    # --- 129：锁定态 PARTIAL 由 035/037 跨用例补足，显式替代（原 PARTIAL 保留说明） ---
    ("129", 2): [
        S("EXP", "编辑模式默认锁定并显示“（已锁定）”、可解锁与还原", F, "035",
          ["idDisabled", "lockHint", "toggle", "lockedInputAttr"], "COVERED",
          "035 证明编辑默认锁定、提示“（已锁定）”与“修改探针 ID”入口存在"),
        S("EXP", "点击“取消修改”恢复锁定与原值", F, "037",
          ["restoredTo", "locked", "lockHint", "toggle"], "COVERED",
          "037 证明取消修改后恢复锁定与原值"),
    ],
    # --- 144：受控失败注入显式补充 justification（SIMULATED_ONLY 不自动等同完整 PASS） ---
    ("144", 1): [
        S("EXP", "加载失败时前端呈现失败态并支持重试", I, "144",
          ["injectedFailure", "loadFailureState", "retryIssuesRequest"], "SIMULATED_ONLY",
          "失败态由 harness 注入 500 响应模拟（原键标注 injectedFailure:true），非真实后端失败",
          justify="本条定义检验“加载失败时前端如何呈现与重试”，失败态即可由受控注入构造；"
                  "注入已在原始键显式标注，且失败态文案与重试请求行为均实测，故该步骤不阻断本条关键步骤成立"),
    ],
}

# 复审点名仍为 PASS 的三条：按现行定义重判，整条下调为 BLOCKED（步骤整体替换）。
STATUS_OVERRIDE = {
    "012": {
        "status": "BLOCKED", "basis": "B",
        "steps": [
            S("PRE", "库内存在机构名称超长的数据源", C, "012", ["tagWidth"], "MISSING",
              "原始键仅有 tagWidth=120 的样式宽度，未标识或测量任何“超长机构名称”样本，前置样本不可证明"),
            S("STEP", "悬停机构名称标签（含超长与未截断）", C, "012", ["tooltip.visible", "tooltip.count"],
              "PARTIAL", "悬停动作与 Tooltip 单实例已实测；“超长与未截断”两类样本未分别定位（见 PRE 缺口）"),
            S("EXP", "标签正文仅机构名、单标签最大宽度≈10 全角汉字并 CSS 省略号", C, "012", ["tagWidth"],
              "MISSING", "tagWidth=120 仅为样式上限，未测量实际标签宽度、未在超长样本上观察省略号"),
            S("EXP", "详情仅含完整机构名称与“数据源 ID”、不显示数据源名称", C, "012",
              ["tooltip.lines", "tooltip.tones"], "COVERED", "实测两行：机构名 + 数据源 ID，无数据源名称"),
            S("EXP", "页面级单实例、进入新目标关闭上一个、离开立即隐藏", C, "012",
              ["tooltip.count", "afterSecondHover", "afterLeave"], "COVERED",
              "count=1、二次悬停切换、离开后隐藏"),
            S("EXP", "Tooltip 约 200～300ms 延迟后显示", C, "012", ["tooltip"], "MISSING",
              "未记录出现延迟计时，原始键无时序字段"),
            S("EXP", "各态文字水平/垂直居中，无裁切、无上下偏移、无行高抖动", C, "012", ["tooltip"], "MISSING",
              "无各态居中/裁切/行高抖动测量字段"),
        ],
        "note": "已执行子步骤保留：悬停详情仅机构名+数据源 ID、单实例、切换与隐藏；缺口为超长样本（PRE）与宽度/居中/延迟测量",
    },
    "041": {
        "status": "BLOCKED", "basis": "B",
        "steps": [
            S("PRE", "分别进入新增与编辑弹窗", E, "041", ["positionRightOfDesc"], "PARTIAL",
              "accE 为新增弹窗阶段；编辑弹窗中的“自动生成”按钮未单独定位"),
            S("STEP", "在未选数据源、编辑含异常历史、填写自定义描述等不同状态下检查按钮", E, "041",
              ["positionRightOfDesc", "alwaysEnabled"], "MISSING",
              "仅单点记录按钮位于描述框右侧且始终启用；未逐一覆盖未选数据源/编辑异常历史/自定义描述三态"),
            S("EXP", "按钮位于“探针描述”右侧、任何表单状态下均可点击、不显示禁用", E, "041",
              ["positionRightOfDesc", "alwaysEnabled"], "PARTIAL",
              "单次实测为真，未逐态验证“任何状态”；不得用静态代码推断替代逐态运行观察"),
        ],
        "note": "已执行子步骤保留：单点 positionRightOfDesc=true 与 alwaysEnabled=true；缺口为多状态逐态观察与编辑弹窗定位",
    },
    "046": {
        "status": "BLOCKED", "basis": "B",
        "steps": [
            S("PRE", "已在弹窗自动生成描述", E, "046", ["descAfterRegen"], "COVERED",
              "自动生成后描述被覆盖为“222”实测"),
            S("STEP", "自动生成后继续增删数据源观察描述是否联动；再次点击“自动生成”", F, "046-edit",
              ["removeDidNotAutoUpdate", "regenerateOverwrote", "remainingCount"], "PARTIAL",
              "编辑模式的“删”方向与“再次生成覆盖”已实测；“增”方向未单独取证"),
            S("EXP", "增删后描述不自动更新；再次点击才覆盖；新增与编辑提供同一个按钮", E, "046",
              ["descBeforeSel", "descAfterSel", "allMains", "extra"], "PARTIAL",
              "新增模式该键标记 PARTIAL、extra=false；“同一按钮”与增删两方向未完整取证"),
        ],
        "note": "原始 accE#046 的 PARTIAL 与 extra=false 原样保留；编辑子步骤（删方向+重生成）保留",
    },
}

SEMANTICS = {
    "COVERED": "原始证据中存在执行本条现行定义所要求具体条件的记录（字段值或截图）",
    "MISSING": "原始证据中不存在该步骤的执行记录（含仅有静态样式/公式外推而无实测）",
    "PARTIAL": "该步骤仅有部分状态/方向/视口被实测；PARTIAL 不足以使整条 PASS，除非另有步骤显式补足本步骤的具体条件",
    "SIMULATED_ONLY": "该步骤仅由受控模拟（simulated:true）覆盖；仅在必须提供 justification 且该步骤不属定义要求的真实后端/写入时方可留在 PASS 行",
}


def load_r3():
    with open(R3_JSON, encoding="utf-8") as f:
        return json.load(f)


def build():
    r3 = load_r3()
    items = []
    for it in r3["items"]:
        cid = it["id"].replace("CCFG-AC-", "")
        steps = []
        for idx, st in enumerate(it["steps"]):
            new = PATCH.get((cid, idx))
            steps.extend(new if new else [st])
        status = it["r3_status"]
        basis = it["basis"]
        note = it.get("note", "")
        if cid in STATUS_OVERRIDE:
            ov = STATUS_OVERRIDE[cid]
            status, basis, steps = ov["status"], ov["basis"], ov["steps"]
            note = ov["note"]
        items.append({
            "id": it["id"],
            "r3_status": it["r3_status"],
            "r4_status": status,
            "basis": basis,
            "steps": steps,
            "note": note,
        })
    changed = [i["id"] for i in items if i["r3_status"] != i["r4_status"]]
    return {
        "header": HEADER,
        "semantics": SEMANTICS,
        "counts": {
            "items": len(items),
            "r4_changed": len(changed),
            "r4_changed_ids": changed,
            "pass": sum(1 for i in items if i["r4_status"] == "PASS"),
        },
        "items": items,
    }


def render_md(doc):
    L = ["# R4 逐步骤覆盖矩阵（脱敏）", ""]
    L.append("- 任务：`%s`" % HEADER["task"])
    L.append("- 基准提交：`%s`" % HEADER["base_commit"])
    L.append("- 原始证据包 SHA-256：`%s`" % HEADER["raw_package_sha256"])
    L.append("- 判定标准：%s" % HEADER["source_of_truth"])
    L.append("- 范围：%s" % HEADER["scope"])
    L.append("- 判定词汇：`COVERED` / `MISSING` / `SIMULATED_ONLY` / `PARTIAL`")
    L.append("- 字段路径基准：%s" % HEADER["path_basis"])
    L.append("- 脱敏：%s" % HEADER["desensitization"])
    L.append("- 说明：%s" % HEADER["note"])
    L.append("")
    L.append("判定语义：")
    for k, v in SEMANTICS.items():
        L.append("- `%s`：%s" % (k, v))
    L.append("")
    L.append("本轮由 `PASS` 下调为 `BLOCKED` 共 **%d** 条：%s" % (
        doc["counts"]["r4_changed"],
        "、".join(x.replace("CCFG-AC-", "") for x in doc["counts"]["r4_changed_ids"])))
    L.append("")
    for it in doc["items"]:
        mark = "" if it["r3_status"] == it["r4_status"] else "  **[本轮下调]**"
        L.append("## %s — R3 `%s` → R4 `%s`（basis=%s）%s" % (
            it["id"], it["r3_status"], it["r4_status"], it["basis"], mark))
        L.append("")
        L.append("| 步骤 | 现行定义关键要求 | 证据文件 / 键 | 字段 | 判定 | 理由 |")
        L.append("|---|---|---|---|---|---|")
        for st in it["steps"]:
            ev = st["evidence"]
            extra = ""
            if st.get("shot"):
                extra += "；截图 `%s`" % st["shot"]
            if st.get("justify"):
                extra += "；justification：%s" % st["justify"]
            L.append("| %s | %s | `%s#%s` | %s | %s | %s%s |" % (
                st["kind"], st["definition"], ev["file"], ev["key"],
                ", ".join(ev["fields"]) or "—", st["verdict"], st["why"], extra))
        if it["note"]:
            L.append("")
            L.append("> 残余说明：%s" % it["note"])
        L.append("")
    return "\n".join(L)


def main():
    doc = build()
    with open(os.path.join(HERE, "coverage-matrix.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(os.path.join(HERE, "coverage-matrix.md"), "w", encoding="utf-8") as f:
        f.write(render_md(doc) + "\n")
    print("items=%d changed=%d pass=%d" % (
        doc["counts"]["items"], doc["counts"]["r4_changed"], doc["counts"]["pass"]))
    print("changed_ids=%s" % ",".join(doc["counts"]["r4_changed_ids"]))


if __name__ == "__main__":
    main()
