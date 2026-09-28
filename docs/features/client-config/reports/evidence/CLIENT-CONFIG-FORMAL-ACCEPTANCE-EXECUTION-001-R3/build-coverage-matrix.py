#!/usr/bin/env python3
"""R3 覆盖矩阵生成器（人工判定为源，脚本仅做结构化输出）。

本脚本内嵌**人工逐条审核**后的“现行定义关键步骤 → 原始证据文件/键/字段 → 覆盖判定”，
生成脱敏、可审阅的：
  - coverage-matrix.json
  - coverage-matrix.md

覆盖判定**不是**由 `v:PASS`、`all:true` 等结果布尔值自动推导；脚本只把人工判定排版。
用法（本目录）：python3 build-coverage-matrix.py
"""
import json
import os

FILES = {
    "A": "accA.json", "B": "accB.json", "B2": "accB2.json", "C": "accC.json",
    "D": "accD.json", "E": "accE.json", "F": "accF.json", "G": "accG.json",
    "H": "accH.json", "I": "accI.json", "J": "accJ.json", "R": "acc-result.json",
}

# 每条：(kind, 现行定义关键步骤短摘录, 证据键, 文件代号, 字段路径, 判定, 一句话理由)
# 判定 ∈ {COVERED, MISSING, SIMULATED_ONLY}
# r3 为整条建议状态；basis 为下调类别（A=真实写/DB/后端, B=前置数据/夹具缺失,
#   C=视口/模式/状态序列不全, D=键盘焦点未测, E=PARTIAL/FAIL/说明自承, NONE=保留 PASS）
CASES = [
    ("001", "PASS", "PASS", "NONE", [
        ("PRE", "已部署、平台已登录", "001", "A", ["meta.base", "route"], "COVERED", "页面壳与路由实测存在"),
        ("STEP", "菜单进入 + 直达既有路由", "001", "A", ["menuHas", "route"], "COVERED", "菜单项与路由均命中"),
        ("EXP", "名称统一为探针端管理、无旧名", "001", "A", ["title", "breadcrumb", "hasOldName"], "COVERED", "标题/面包屑/无旧名一致"),
    ]),
    ("002", "PASS", "PASS", "NONE", [
        ("PRE", "同时存在启用/停用/异常三态记录", "002", "A", ["rows", "off", "abn"], "COVERED", "三类计数由接口返回核对"),
        ("STEP", "首次进入不查询自动展示", "002", "A", ["allShown"], "COVERED", "首屏全量展示实测"),
        ("EXP", "三态标识按现行口径呈现", "002", "A", ["states"], "COVERED", "启用无标识/停用标识/异常红标逐一读取"),
    ]),
    ("003", "PASS", "PASS", "NONE", [
        ("STEP", "尝试翻页/加载更多/分页参数", "003", "A", ["pag", "loadMore"], "COVERED", "无分页控件"),
        ("EXP", "请求不含分页参数、无数量上限", "003", "A", ["apiCalls"], "COVERED", "实际请求 URL 无分页参数"),
    ]),
    ("004", "PASS", "PASS", "NONE", [
        ("PRE", "存在纯数字与含字母 ID", "004", "A", ["ids"], "COVERED", "样本集合覆盖两类 ID"),
        ("EXP", "按字符串降序（非数字自然序）", "004", "A", ["ids"], "COVERED", "实测顺序符合字符串降序"),
    ]),
    ("005", "PASS", "PASS", "NONE", [
        ("STEP", "关键词 + 状态过滤查询", "005", "A", ["enabled", "disabled", "disjoint"], "COVERED", "两态过滤互斥"),
        ("EXP", "对 ID/描述不区分大小写包含匹配", "005-keyword", "A", ["query", "matched"], "COVERED", "大写输入命中小写值"),
    ]),
    ("006", "PASS", "PASS", "NONE", [
        ("STEP", "改条件不点查询", "006", "A", ["netBefore", "netAfter"], "COVERED", "请求数不变"),
    ]),
    ("007", "PASS", "PASS", "NONE", [
        ("STEP", "点击重置", "007", "A", ["kwVal", "statusVal", "requestsDuringReset"], "COVERED", "表单复位且不查询"),
    ]),
    ("008", "PASS", "PASS", "NONE", [
        ("STEP", "无匹配查询", "008", "A", ["rows", "txt"], "COVERED", "空状态文案实测"),
    ]),
    # ---- 009 下调：仅缺 1920×1080 观测腿 ----
    ("009", "PASS", "BLOCKED", "C", [
        ("PRE", "存在关联多数据源的探针", "009", "A", ["headers"], "COVERED", "样本行含多数据源"),
        ("STEP", "在 1440×900 与 1920×1080 两种视口下观察表头与采集数据源列", "009", "A", ["headers", "noStatusCol", "orgShown"], "MISSING", "原始证据 meta.viewport 仅 1440x900；无 1920x1080 观测记录（其余 acc 文件亦无）"),
        ("EXP", "列集合正确、无状态列、机构名为主显示", "009", "A", ["headers", "noStatusCol", "orgShown"], "COVERED", "1440 视口下三项均可核对"),
    ]),
    ("010", "PASS", "PASS", "NONE", [
        ("PRE", "含 6~7 个数据源的探针", "010", "G", ["heights"], "COVERED", "样本行高与标签数实测"),
        ("STEP", "调整宽度观察列视觉", "010", "G", ["allSingleLine", "noOverflow"], "COVERED", "单行/无溢出实测"),
        ("EXP", "最多直接展示 6、+N 准确、不撑高", "010", "G", ["max6", "plusAccurate", "tdPad"], "COVERED", "两项布尔 + 盒模型内边距读取"),
    ]),
    ("011", "PASS", "PASS", "NONE", [
        ("STEP", "观察默认布局 + 点击 +N（非悬停）", "011", "C", ["plusText", "visibleTags", "hiddenN"], "COVERED", "点击触发、可见数与 +N 实测"),
        ("EXP", "可见数=min(可容纳,6)；清单按原序、非多行展开", "011-eyebrow", "B2", ["items"], "COVERED", "清单 7 项按序展开"),
    ]),
    ("012", "PASS", "PASS", "NONE", [
        ("PRE", "存在机构名称超长的数据源", "012", "C", ["tagWidth"], "COVERED", "标签最大宽度受 120px 上限约束实测"),
        ("STEP", "悬停标签（含超长与未截断）", "012", "C", ["tooltip"], "COVERED", "Tooltip 内容为主信息+数据源 ID，计数为 1（页面级单实例）"),
        ("EXP", "移入新目标关闭上一个、离开即隐藏", "012", "C", ["afterSecondHover", "afterLeave"], "COVERED", "二次悬停内容切换、离开后不可见"),
    ], "残余：Tooltip 出现延迟（约 200~300ms）未单独计时；超长机构名样例未逐一列出，仅以 120px 上限体现截断规则"),
    # ---- 013 下调：机构名缺失回退分支无夹具 ----
    ("013", "PASS", "BLOCKED", "B", [
        ("PRE", "存在已停用/不存在/ID 含逗号/重复分配的异常数据源", "013-part", "C", ["badTags"], "COVERED", "异常标签计数 8，覆盖重复分配等异常"),
        ("EXP", "异常标签红色、优先显示机构名称", "013-part", "C", ["atip.lines"], "COVERED", "异常 Tooltip 主信息为机构名称"),
        ("EXP", "数据源不存在且无法取得机构名称时才显示原始数据源 ID", "013-part", "C", ["atip.lines"], "MISSING", "原始证据仅取到“机构名可取”的冲突 Tooltip；全包无“机构名缺失→回退原始 ID”的样例（106 的 orgMissingItems=0 亦证夹具缺失）"),
        ("EXP", "显示异常原因“已分配给其他探针”+冲突探针清单、无旧文案", "013-part", "C", ["atip.lines"], "COVERED", "措辞与冲突清单实测"),
    ], "与 106 关系：R2 已因“机构名缺失分支不可构造”下调 106；013 含同一必要分支，保留 PASS 与 106 判定自相矛盾"),
    ("016", "PASS", "PASS", "NONE", [
        ("STEP", "两种视口核对无行单选/高亮/已选提示", "016", "I", ["at1440", "at1920"], "COVERED", "原始证据含 at1440/at1920 两腿"),
        ("STEP", "单击切换唯一固定选中、点更多不误触双击", "016", "I", ["singleFixedHighlightOnly", "moreMenuDoesNotOpenEdit"], "COVERED", "三态切换与隔离实测"),
        ("STEP", "双击行、ID 键盘 Enter/空格打开编辑", "016", "I", ["note"], "COVERED", "同页双击/键盘编辑由 142/142-d 原始键证明（同条件）"),
    ]),
    # ---- 017 下调：仅缺 1920 ----
    ("017", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 两种视口下观察结果区头部并单击行", "017-part", "A", ["last", "fixedRight"], "MISSING", "原始证据无 1920×1080 观测腿；且仅记录操作列固定，未记录“新增探针”按钮位置"),
        ("EXP", "头部最右“新增探针”、无“删除所选”与批量入口", "017-part", "A", ["fixedRight"], "MISSING", "本键未记录新增按钮右对齐断言（该断言在 079/080）"),
        ("EXP", "无行单选/高亮/已选提示", "016", "I", ["at1440"], "COVERED", "由 016 同页原始键证明无选择能力"),
    ]),
    ("018", "PASS", "PASS", "NONE", [
        ("STEP", "每行无独立编辑/删除按钮、无弱提示", "018-part", "A", ["perRow", "hint"], "COVERED", "行内控件计数 0、无提示"),
        ("STEP", "双击行、ID 键盘聚焦、点更多菜单项不误触双击", "018-part", "A", ["perRow"], "COVERED", "同页双击(142)/键盘(142-d)/更多隔离(143) 原始键证明同条件"),
    ]),
    ("019", "PASS", "PASS", "NONE", [
        ("STEP", "更多→删除", "019", "D", ["title", "msg", "primary"], "COVERED", "二次确认含探针 ID 与警示语义"),
        ("EXP", "取消不删除", "019-cancel", "D", ["closedWithoutDelete"], "COVERED", "取消后关闭且未删除"),
    ]),
    ("025", "PASS", "PASS", "NONE", [
        ("PRE", "存在非 0/1 的 FG_ACTIVE 记录", "025", "A", ["abnRows"], "COVERED", "异常行计数 1"),
        ("EXP", "紧跟探针 ID 显示红色 异常：{原始值}", "025", "A", ["abnRows"], "COVERED", "异常标识行可见且未被过滤"),
    ]),
    ("028", "PASS", "PASS", "NONE", [
        ("STEP", "三字段分别清空后保存", "028", "E", ["idError", "descError", "sourceFeedback"], "COVERED", "三字段各自错误文案实测"),
        ("EXP", "三项必填、均拒绝保存并提示", "028", "E", ["idBorderRed", "descBorderRed", "topLevelMessages"], "COVERED", "红框 + 无顶端消息"),
    ]),
    ("029", "PASS", "PASS", "NONE", [
        ("STEP", "超长/非字母数字开头/含非法字符后保存", "029", "E", ["input", "fieldError", "pattern"], "COVERED", "非法输入触发字段级错误与正则口径"),
    ]),
    ("032", "PASS", "PASS", "NONE", [
        ("STEP", "打开编辑弹窗观察状态字段/启停控件", "032", "F", ["hasStatusField", "hasEnableControl"], "COVERED", "两项均为 false"),
    ]),
    ("035", "PASS", "PASS", "NONE", [
        ("STEP", "双击记录打开编辑弹窗观察 ID 输入框", "035", "F", ["idDisabled", "lockHint", "lockedInputAttr"], "COVERED", "默认只读并显示锁定提示"),
    ]),
    ("036", "PASS", "PASS", "NONE", [
        ("STEP", "点击“修改探针 ID”", "036", "F", ["editable", "noWarningDialog", "toggleNow"], "COVERED", "解锁、无警告框、入口变取消"),
    ]),
    ("037", "PASS", "PASS", "NONE", [
        ("STEP", "点击“取消修改”", "037", "F", ["restoredTo", "locked", "toggle"], "COVERED", "恢复原值并回到锁定"),
    ]),
    ("041", "PASS", "PASS", "NONE", [
        ("STEP", "观察自动生成按钮位置与不同表单状态", "041", "E", ["positionRightOfDesc", "alwaysEnabled"], "COVERED", "位置右置且始终可点"),
    ], "残余：仅采到单次状态快照；“任何表单状态下”未逐状态枚举"),
    ("043", "PASS", "PASS", "NONE", [
        ("STEP", "无已选项时点击自动生成", "043", "E", ["before", "after", "noOpWhenNoSelection"], "COVERED", "前后值不变、无副作用"),
    ]),
    ("045", "PASS", "PASS", "NONE", [
        ("STEP", "自动生成后直接修改描述", "045", "E", ["afterGenerateCopyEditable", "appended"], "COVERED", "生成后可编辑并追加成功"),
    ]),
    ("046", "PASS", "PASS", "NONE", [
        ("STEP", "增删数据源不联动描述、再次点击才覆盖（新增模式）", "046-edit", "F", ["removeDidNotAutoUpdate", "regenerateOverwrote"], "COVERED", "编辑模式实测不联动、显式重生成才覆盖"),
        ("EXP", "新增与编辑提供同一按钮", "046", "E", ["allMains"], "PARTIAL", "新增模式键为 PARTIAL，编辑模式键 PASS；两模式按钮同源"),
    ], "残余：046@accE 为 PARTIAL（新增模式部分断言），覆盖由 046-edit@accF 补齐"),
    ("047", "PASS", "PASS", "NONE", [
        ("STEP", "打开编辑弹窗不点按钮观察描述", "047", "F", ["echoed", "matchesSaved", "truncatedTo256"], "COVERED", "原样回显已存描述"),
        ("EXP", "取消不产生确认框、数据不变", "047-nosave", "F", ["closedWithoutSaving", "dataUnchanged", "noConfirmBoxOnCancel"], "COVERED", "未保存关闭无副作用"),
    ]),
    ("049", "PASS", "PASS", "NONE", [
        ("PRE", "存在不同类别/类型/状态的 CDC_DATA_SOURCE", "049-ui", "E", ["uiCount", "allFromEligibleApi"], "COVERED", "候选数与资格接口一致"),
        ("EXP", "候选仅含 FG_ACTIVE=1 且 SOURCE 且 ORACLE", "049-ui", "E", ["allFromEligibleApi"], "COVERED", "由资格接口逐一核对"),
    ]),
    ("050", "PASS", "PASS", "NONE", [
        ("EXP", "候选主文本为机构名，名称与 ID 可见/悬停可见", "050", "E", ["sampleMain", "sampleSub"], "COVERED", "主/次文本结构与回退规则实测"),
    ]),
    ("051", "PASS", "PASS", "NONE", [
        ("STEP", "按机构名/名称/ID 搜索（含大小写差异）", "051", "E", ["byIdFragment", "byOrg", "caseInsensitive"], "COVERED", "三类关键字与大小写不敏感均实测"),
    ]),
    ("052", "PASS", "PASS", "NONE", [
        ("PRE", "存在 ID 含英文逗号的候选", "052", "E", ["candidate", "disabled", "reason"], "COVERED", "含逗号候选置灰并给出原因"),
    ]),
    ("053", "PASS", "PASS", "NONE", [
        ("PRE", "存在已被其他探针分配的数据源", "053", "E", ["candidate", "disabled", "reason"], "COVERED", "已分配候选置灰并标注探针 ID"),
    ]),
    ("065", "PASS", "PASS", "NONE", [
        ("STEP", "观察异常数据源探针在列表中的展示", "065", "F", ["rowVisibleUntruncated", "chips"], "COVERED", "行完整可见、关联未隐藏"),
    ]),
    ("066", "PASS", "PASS", "NONE", [
        ("STEP", "打开该探针编辑弹窗观察已选数据源", "066", "F", ["redChips", "totalChips"], "COVERED", "异常项以红色标签回显"),
    ]),
    ("067", "PASS", "PASS", "NONE", [
        ("EXP", "异常项不被丢弃，显示原始 ID 与原因", "067", "F", ["anomalyItemKept", "rawIdsShown", "reasonInText"], "COVERED", "原始 ID 与原因均呈现"),
    ]),
    ("069", "PASS", "PASS", "NONE", [
        ("STEP", "候选为空/搜索无匹配时尝试绕过至少选 1", "069", "J", ["emptySelection", "submitBlockedFeedback", "writes"], "COVERED", "两视口下拦截、弹窗不关闭、零写请求"),
    ]),
    ("070", "PASS", "PASS", "NONE", [
        ("STEP", "列表加载与编辑操作后检查异常历史是否被自动改动", "070", "I", ["anomalousRow", "unchangedAfterPageOperations", "writeRequestsDuringListAndDialogOperations"], "COVERED", "零写请求、异常数据未变"),
    ]),
    ("073", "PASS", "PASS", "NONE", [
        ("STEP", "检查接口响应字段", "073", "A", ["status", "keys"], "COVERED", "响应键集合中无敏感字段"),
    ]),
    ("074", "PASS", "PASS", "NONE", [
        ("STEP", "观察页面请求与源库侧行为", "074", "I", ["distinctPaths", "sourceDatabaseConnections", "schemaReads"], "COVERED", "全部同源 API、无源库连接/Schema 读取"),
    ]),
    ("078", "PASS", "PASS", "NONE", [
        ("STEP", "检查自动刷新/刷新按钮/倒计时/最近刷新时间/模板刷新工具栏", "078", "A", ["refreshBtn", "text"], "COVERED", "均不存在"),
    ]),
    # ---- 079 下调：仅缺 1920 + 存在 FAIL 子键 ----
    ("079", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 两种视口下观察结果区头部按钮位置", "079", "A", ["addRight", "toolbarRight"], "MISSING", "仅 1440x900 一腿；1920x1080 无记录"),
        ("EXP", "新增探针在最右侧、与参考页一致、左侧不再有", "079", "A", ["addRight", "toolbarRight", "delSelected"], "COVERED", "1440 下右缘与工具栏右缘重合"),
        ("EXP", "（历史上）addRightAligned 断言", "079", "R", ["addRightAligned"], "MISSING", "acc-result 记为 FAIL（addRightAligned=false），与 accA 的 PASS 冲突，未在原始证据内消除"),
    ]),
    ("080", "PASS", "PASS", "NONE", [
        ("STEP", "观察是否含“删除所选”或任何批量删除入口", "080", "A", ["delSelected", "hasAdd"], "COVERED", "无删除所选、仅有新增"),
    ]),
    ("081", "PASS", "PASS", "NONE", [
        ("STEP", "观察表头是否含状态列或列内启停文字", "081", "A", ["headers", "noStatusCol"], "COVERED", "表头无状态列"),
    ]),
    # ---- 082 下调：缺 1920 + 固定列/不误触双击未测 ----
    ("082", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 两种视口下观察操作列是否固定", "082", "D", ["enabled", "disabled", "abnormal"], "MISSING", "仅 1440x900；无 1920；且本键未记录固定列断言"),
        ("STEP", "对启用/停用/异常三类行点击更多并记录下拉可见项", "082", "D", ["enabled", "disabled", "abn"], "COVERED", "三态菜单条目与该行 FG_ACTIVE 严格相符"),
        ("EXP", "点击更多不触发该行双击编辑、不产生选中", "082", "D", ["enabled"], "MISSING", "本键未记录“更多未触发双击”断言（同类断言在 016/103）"),
    ]),
    ("085", "PASS", "PASS", "NONE", [
        ("STEP", "检查主列表 el-table 根类与模板令牌呈现", "085", "A", ["cls", "hasLt", "headBg", "cellPad"], "COVERED", "根类与表头背景/边框/内边距实测"),
    ]),
    # ---- 086/087/088/091/092/094/095/097 下调：仅缺 1920 ----
    ("086", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 两种视口下观察第一列并重置后重新加载", "086", "A", ["rc", "seq"], "MISSING", "仅 1440x900 一腿；无 1920 记录"),
        ("EXP", "序号从 1 连续、不跳号", "086", "A", ["seq"], "COVERED", "首屏序号连续"),
    ]),
    ("087", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 两种视口下对比两行探针 ID 单元格与参考页停用标识", "087", "A", ["mark", "offRows", "enabledWithoutMark"], "MISSING", "仅 1440x900；无 1920；参考页并排比对亦未在键内记录"),
        ("EXP", "启用无标识、停用显示停用标识且视觉与参考页一致", "087", "A", ["mark"], "COVERED", "1440 下标视觉属性读取"),
    ]),
    ("088", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 两种视口下核对 异常：{原始值} 与接口 fgActive", "088", "A", ["shown", "api"], "MISSING", "仅 1440x900；无 1920 记录"),
        ("EXP", "原样展示原始值、非静默转义、下拉只含删除/停用", "088", "A", ["shown", "api"], "COVERED", "界面值与接口值一致"),
    ]),
    ("091", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 下观察 ID 正文颜色/字重并与参考页比对", "091", "G", ["probeIdColumn", "referenceIdColumn"], "MISSING", "仅 1440x900；无 1920；且未记录 3 类逐行对比"),
        ("STEP", "悬停省略 ID 查看 Tooltip、鼠标点击与键盘聚焦 ID 编辑入口", "091", "G", ["weightsMatch"], "MISSING", "本键未记录 Tooltip/鼠标/键盘编辑入口行为"),
        ("EXP", "字重/颜色与参考页一致、未整体加粗改色", "091", "G", ["weightsMatch", "colorsMatch"], "COVERED", "字重与颜色两项一致"),
    ]),
    ("092", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 下观察行高并与参考页比对", "092", "G", ["referenceRowH", "probeRowH", "sharedTdPadding"], "MISSING", "仅 1440x900；无 1920；行高由内边距规则外推（48 vs 53）"),
        ("STEP", "双击行编辑、键盘编辑 ID、滚动查看表头与最右固定列", "092", "G", ["note"], "MISSING", "本键未记录双击/键盘/滚动行为（同类断言在 142/150 但非本条条件）"),
        ("EXP", "行高由公共内边距与内容决定、未写死、未改公共层", "092", "G", ["sharedTdPadding"], "COVERED", "两页内边距同值 12px/12px"),
    ]),
    ("093", "PASS", "PASS", "NONE", [
        ("PRE", "正常视口与窄视口均具备", "093", "H", ["viewport"], "COVERED", "窄视口 1024x900 实测"),
        ("STEP", "单行布局、表格横向滚动而非页面级溢出、滚动到最右操作列可点", "093", "H", ["singleLineAllRows", "pageLevelHorizontalOverflow", "tableInnerHorizontalScroll", "rightmostFixedOpColumnHittable"], "COVERED", "四项均实测"),
        ("EXP", "仅页面级溢出/截断/不可点/计数不符判失败", "093", "H", ["plusNOpensWithAccurateCount", "hiddenComputed"], "COVERED", "数量自洽"),
    ]),
    ("094", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 下观察该标签视觉并与参考页角色标签比对", "094", "G", ["probeOkTag", "referenceRoleTag"], "MISSING", "仅 1440x900；无 1920 记录"),
        ("EXP", "绿色语义=当前未检测到异常、非参考页目标库角色", "094", "G", ["semantics"], "COVERED", "状态色与语义实测"),
    ]),
    ("095", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 下观察标签状态色并悬停查看 Tooltip", "095", "G", ["probeBadTag"], "MISSING", "仅 1440x900；无 1920；Tooltip 内容转由 013/107 说明"),
        ("EXP", "红色、Tooltip 展示异常原因与冲突探针", "095", "G", ["probeBadTag"], "COVERED", "红色标签视觉实测"),
    ]),
    ("097", "PASS", "BLOCKED", "C", [
        ("STEP", "在 1440×900 与 1920×1080 下观察项级异常标签状态色与整行级歧义提示", "097", "G", ["ambiguousRows", "rowsWithBadTags", "rowLevelHintKept"], "MISSING", "仅 1440x900；无 1920 记录"),
        ("EXP", "红色优先不降级、整行提示并存", "097", "G", ["rowLevelHintKept"], "COVERED", "两者共存实测"),
    ]),
    # ---- 098 下调：缺 1920 + 恰好 6 个样本缺失 ----
    ("098", "PASS", "BLOCKED", "C", [
        ("PRE", "库内存在恰好 6 个与 ≥7 个数据源的探针两类", "098", "G", ["rowsAtLeast6Sources"], "MISSING", "仅命中 ≥7 一类（total=7 一条）；无“恰好 6”样本"),
        ("STEP", "在 1440×900 与 1920×1080 下观察单行直接展示数量与 +N 自洽", "098", "G", ["srcW"], "MISSING", "仅 1440x900；无 1920；缩窄窗口三条视口腿未齐"),
        ("EXP", "可见数≤min(可容纳,6)、N=未展示数、无估算遮挡", "098", "G", ["max6", "plusAccurate"], "COVERED", "单样本下规则成立"),
    ]),
    ("100", "PASS", "BLOCKED", "C", [
        ("PRE", "同时存在启用/停用/异常三类记录", "082", "D", ["enabled", "disabled", "abnormal"], "COVERED", "三类样例行存在"),
        ("STEP", "在 1440×900 与 1920×1080 下观察每一行入口形态", "100-trigger", "D", ["allIcon"], "MISSING", "仅 1440x900；无 1920；且仅一条样本断言，未逐一覆盖全部行"),
        ("STEP", "用 Tab 键盘聚焦入口并读取可访问名称", "100-trigger", "D", ["ariaOk", "sampleAria"], "MISSING", "仅记录 aria 名称；无键盘聚焦动作与可见焦点样式/截图"),
        ("EXP", "全部行三点图标、命中区足够、焦点可见、菜单三态相符", "082", "D", ["enabled", "disabled", "abnormal"], "COVERED", "菜单三态由 082 同页原始键证明"),
    ]),
    # ---- 101 下调：菜单 Hover/焦点与键盘遍历未测 ----
    ("101", "PASS", "BLOCKED", "D", [
        ("STEP", "单击三点图标展开菜单观察圆角/阴影/内边距/条目排列/分隔线", "101", "D", ["radius", "shadow", "padding", "divider", "itemOrder"], "COVERED", "静态样式与分隔线实测"),
        ("STEP", "分别悬停停用/启用与红色删除条目，观察 Hover/焦点反馈与红色警示", "101", "D", ["deleteColor"], "MISSING", "原始键无 Hover/焦点态记录（accD 无 hover 相关字段）"),
        ("STEP", "键盘聚焦并遍历菜单条目", "101", "D", ["itemOrder"], "MISSING", "无键盘遍历记录"),
    ]),
    ("105", "PASS", "PASS", "NONE", [
        ("STEP", "点击 +N 打开完整清单观察每项两行文本", "105", "C", ["items"], "COVERED", "主信息机构名 + 次信息“数据源 ID：”前缀逐一读取"),
    ]),
    ("107", "PASS", "PASS", "NONE", [
        ("STEP", "点击 +N 打开清单核对异常原因/冲突探针位置与颜色、含逗号歧义文案", "107", "H", ["anomalyItems", "commaAmbiguityWordingInList", "commaAmbiguityTooltip"], "COVERED", "项内红色警示与歧义文案逐项实测"),
    ]),
    ("108", "PASS", "PASS", "NONE", [
        ("STEP", "核对单行展示与 +N、点击 +N 对照去重顺序、异常项是否在清单", "108", "H", ["hiddenCountComputed", "orderMatchesStorage", "anomalyItemsPresent", "clickTriggeredNotHover"], "COVERED", "数量、顺序、异常项、点击触发均实测"),
        ("EXP", "主表行高与单实例 Tooltip 未变", "108", "H", ["rowHeightUnchanged", "singleTooltipInstance"], "COVERED", "两项实测"),
    ]),
    ("109", "PASS", "PASS", "NONE", [
        ("STEP", "点击 +N 观察是否内部滚动/固定最大高度、读取 .cc-full-list 样式", "109", "C", ["maxHeight", "overflowY", "listH"], "COVERED", "无 max-height、无内部滚动"),
    ]),
    ("110", "PASS", "PASS", "NONE", [
        ("STEP", "普通视口打开清单核对完整性；使行靠近视口边缘再打开", "110", "H", ["popoverRect", "fullyInsideViewport", "itemsReadable"], "COVERED", "弹层完整在视口内且项可读"),
    ]),
    ("111", "PASS", "PASS", "NONE", [
        ("STEP", "以新增与编辑两种模式打开弹窗；桌面测量宽度与安全间距", "111", "E", ["w", "marginL", "marginR", "title", "footer"], "COVERED", "桌面 900px、左右留白实测"),
        ("STEP", "窄视口观察收缩与横向溢出；标题/关闭/底部按钮可见可操作", "111-narrow", "F", ["dialogW", "viewportW", "noHorizontalOverflow"], "COVERED", "窄视口收缩且无横向溢出"),
    ]),
    ("113", "PASS", "PASS", "NONE", [
        ("STEP", "新增模式核对 ID 可直接填写（无开关、无锁定提示）", "113-create", "E", ["idDirectlyEditable", "noToggleSwitch", "noLockedHint"], "COVERED", "新增模式三项实测"),
        ("STEP", "编辑模式核对默认锁定/解锁修改/取消恢复", "035", "F", ["idDisabled", "lockHint"], "COVERED", "由 035/036/037 同页原始键证明同条件"),
        ("STEP", "候选搜索/已选项展示与移除/异常显示/校验阻断/关闭确认", "046-edit", "F", ["removeDidNotAutoUpdate", "regenerateOverwrote"], "COVERED", "由 046/066/068 同页原始键证明"),
    ]),
    ("114", "PASS", "PASS", "NONE", [
        ("STEP", "读取三项配置项名称标签计算样式并与参考页对照", "114", "E", ["labelStyle", "redAsterisk", "labelRightEdges"], "COVERED", "字号/字重/颜色/红星/对齐实测"),
    ]),
    ("116", "PASS", "PASS", "NONE", [
        ("STEP", "读取新增与编辑弹窗主按钮文案", "116", "E", ["createText"], "COVERED", "新增=创建"),
        ("EXP", "编辑主按钮=保存", "116-edit", "F", ["editSubmitText"], "COVERED", "编辑=保存"),
    ]),
    ("118", "PASS", "PASS", "NONE", [
        ("STEP", "三字段同时异常提交观察错误位置与颜色", "118", "E", ["threeFieldErrors", "allRedText", "allRedBorder", "topLevelMessageCount"], "COVERED", "三项字段级错误、红字红框、无顶端消息"),
        ("STEP", "只修正一个字段观察其余错误保持", "118-clearone", "E", ["idErrorCleared", "descStillError", "sourceStillError"], "COVERED", "仅清除被修正字段"),
    ]),
    ("119", "PASS", "PASS", "NONE", [
        ("STEP", "制造字段级错误提交，观察是否有顶端消息/重复弹出", "119", "E", ["fieldLevelErrors", "topLevelMessageNotUsed"], "COVERED", "以字段内反馈替代顶端消息"),
        ("STEP", "编辑弹窗核对 ID 默认锁定/解锁/取消恢复", "119", "E", ["note"], "COVERED", "由 035/036/037 同页原始键证明"),
    ]),
    ("122", "PASS", "PASS", "NONE", [
        ("STEP", "未选数据源未提交时观察提示文字/颜色/区域", "122", "E", ["text", "color", "cls", "role"], "COVERED", "中性灰说明实测"),
    ]),
    ("123", "PASS", "PASS", "NONE", [
        ("STEP", "未选直接提交观察反馈区由中性说明转红色错误、选中消除、再清空恢复", "123-submit", "E", ["beforeSubmit", "afterSubmit", "hintWasNeutral", "nowRedError"], "COVERED", "红/灰切换实测"),
        ("EXP", "关闭重开无状态残留", "123-restore-error", "E", ["afterClearPostSubmit"], "COVERED", "提交后清空恢复红色错误"),
    ]),
    ("126", "PASS", "PASS", "NONE", [
        ("STEP", "侧栏展开/收起 + 多种视口宽度下测量弹窗左右留白", "126", "H", ["measurements", "horizontalMarginDiffMax", "sidebarStates"], "COVERED", "1440/1920/1024 × 侧栏两态共 6 组实测，左右留白相等"),
        ("EXP", "无随侧栏变化的写死左偏、保留 900px 目标宽度", "126", "H", ["hardcodedOffset", "desktopTargetWidth"], "COVERED", "无左偏、宽度保持"),
    ]),
    ("127", "PASS", "PASS", "NONE", [
        ("STEP", "读取三项标签对齐方式与右缘、红星位置、字体规格", "127", "E", ["align", "fs", "fw", "col", "before"], "COVERED", "右对齐与规格实测"),
    ]),
    # ---- 128 下调：缺手工键入腿 + 后端唯一性 ----
    ("128", "PASS", "BLOCKED", "A", [
        ("STEP", "① 手工连续键入 >32 位并观察录入长度", "128-limit", "E", ["pasted", "accepted", "cappedAt32"], "MISSING", "原始键只记录②粘贴 40→32；无①手工连续键入的记录（129 的 maxlength 属性为静态观察）"),
        ("STEP", "② 粘贴 >32 位观察录入长度", "128-limit", "E", ["pasted", "accepted"], "COVERED", "粘贴 40→32 实测"),
        ("STEP", "③ 键入/粘贴非法字符提交，观察是否静默改写与字段级错误", "128-illegal", "E", ["typed", "valueNotSilentlyRewritten", "fieldError"], "COVERED", "非法字符触发字段级错误、未静默改写"),
        ("EXP", "④ 含后端校验的大小写不敏感唯一性未被放宽", "128", "E", [], "MISSING", "全包无“重复/大小写不同 ID 触发后端校验”的记录"),
    ]),
    ("129", "PASS", "PASS", "NONE", [
        ("STEP", "新增模式 ID 可直接填写且 32 位上限生效", "129-create", "E", ["idEditable", "maxlength", "noToggle", "noLockHint"], "COVERED", "新增模式三项实测"),
        ("STEP", "编辑模式默认锁定、解锁/取消还原、两模式 32 位上限一致", "129-edit", "F", ["unlockedMaxlength", "sameLimitAsCreate"], "COVERED", "解锁后 32 位与新增一致"),
        ("EXP", "锁定态输入框无 maxlength 属性", "129-edit-locked", "F", ["idLocked"], "PARTIAL", "锁定输入框不带 maxlength 属预期（不可编辑），解锁后已复测"),
    ], "残余：129-edit-locked@accF 为 PARTIAL，语义为“锁定态属性缺失属预期”，非失败"),
    ("135", "PASS", "PASS", "NONE", [
        ("STEP", "核对本轮是否提前创建/批准表单弹窗模板、是否声称其他页面接入", "135", "J", ["templateApprovalMentions", "otherPageClaim", "req136EntryOnly"], "COVERED", "无模板、无接入声称、仅登记入口"),
    ]),
    # ---- 136 下调：缺窄视口 + 编辑模式 ----
    ("136", "PASS", "BLOCKED", "C", [
        ("STEP", "分别在桌面视口与窄视口打开新增与编辑弹窗测量宽度与安全边距", "136", "E", ["labelToControlGap"], "MISSING", "仅桌面一腿、模式未标注；无窄视口记录"),
        ("STEP", "测量三项标签右缘与控件左缘间距是否约 12px、控件左右边界对齐", "136", "E", ["labelToControlGap", "controlLefts", "controlRights"], "COVERED", "12px 与左右边界实测"),
    ]),
    ("137", "PASS", "PASS", "NONE", [
        ("STEP", "比较字段纵向留白节奏、读取 .cc-form gap 与反馈区占位、核对反馈区仍在", "137", "H", ["formItemGap", "feedbackPlaceholderMinH", "feedbackAreas", "dialogNotFixedHeight"], "COVERED", "间距/占位/反馈区/非固定高度实测"),
        ("EXP", "数据源双栏布局与候选规则未变", "137", "H", ["twoPaneLayout"], "COVERED", "双栏内部结构与候选数实测"),
    ]),
    ("141", "PASS", "PASS", "NONE", [
        ("STEP", "悬停移走观察临时高亮消失", "147", "B", ["hoverBg", "afterAway"], "COVERED", "由 147 同页原始键证明悬停为移走即消失"),
        ("STEP", "点击/再点/点他行/ID 单元格单击的固定选中三态", "141", "B", ["afterClick", "afterSecondClick", "transferToOther", "maxOne", "idCellClickToggles"], "COVERED", "三态切换与 ID 单元格单击实测"),
    ]),
    ("142", "PASS", "PASS", "NONE", [
        ("STEP", "双击未选中/已选中/另一行，观察固定高亮与弹窗", "142-abc", "B", ["aFixed", "aDialog", "bFixed", "bDialog", "cFixed", "cDialog"], "COVERED", "三种双击场景实测"),
        ("STEP", "ID 单元格键盘 Enter/空格打开编辑且不误切选中", "142-d", "B2", ["kFix", "kPre", "enterOpen", "spaceOpen", "kEnd"], "COVERED", "键盘编辑打开弹窗且固定选中前后不变"),
    ], "残余：142-d@accB 曾记 FAIL（键盘计数口径），由 142-d@accB2 重跑为 PASS，原始键并存"),
    ("143", "PASS", "PASS", "NONE", [
        ("STEP", "未固定选中时依次点击更多/菜单项/确认框/+N/标签 Tooltip，观察不误切选中", "143", "B", ["step", "items", "boxOpen"], "COVERED", "各行内控件点击后固定选中计数不变"),
        ("STEP", "ID 的 Enter/空格键盘编辑不误切选中", "142-d", "B2", ["kPre", "enterOpen", "kAfterEnter"], "COVERED", "由 142-d@accB2 同页原始键证明键盘编辑入口不影响选中"),
    ]),
    ("144", "PASS", "PASS", "NONE", [
        ("STEP", "查询/重试/重置/重新进入后观察固定选中是否清除、是否发请求、有无刷新能力", "144", "I", ["clearedAfterQuery", "clearedAfterFailedReloadThenRetry", "resetClearsControlsOnlyAndDoesNotQuery", "noRefreshButton"], "COVERED", "四分支与刷新能力实测"),
        ("EXP", "加载失败→重试为注入模拟", "144", "I", ["injectedFailure", "loadFailureState"], "SIMULATED_ONLY", "加载失败分支由 harness 注入 500 响应模拟（已标注），非真实后端失败"),
    ], "说明：本条定义检验的是“加载失败时前端如何呈现与重试”，失败态本身即可由受控注入构造，注入已在原始键标注 injectedFailure:true；非要求真实后端失败的步骤，故 SIMULATED_ONLY 不阻断本条关键步骤成立"),
    ("146", "PASS", "PASS", "NONE", [
        ("STEP", "核对无复选框/批量入口/已选提示、无接口契约改动、无持久化", "146", "B", ["checkbox", "delSelected", "selectedText", "batchBtn", "urlHas", "lsKeys", "ssKeys"], "COVERED", "各项计数/文本/存储键均实测"),
        ("EXP", "刷新后固定选中重置", "146", "B", ["fixedBeforeReload", "fixedAfterReload"], "COVERED", "刷新后归零"),
    ]),
    ("147", "PASS", "PASS", "NONE", [
        ("STEP", "悬停普通行再移出", "147", "B", ["hoverBg", "onlyRow", "afterAway"], "COVERED", "浅中性灰、仅该行、移走消失"),
    ]),
    ("148", "PASS", "PASS", "NONE", [
        ("STEP", "固定选中视觉、移出、再悬停、悬停他行", "148", "B", ["fixedBg", "leftLine", "afterAway", "rehover", "otherRowHover"], "COVERED", "固定底色+左侧强调线、无跳动、他行不改固定行"),
    ]),
    ("149", "PASS", "PASS", "NONE", [
        ("STEP", "绿/红/异常三态行分别悬停与固定、并收窄视口重复观察", "149", "B2", ["results", "narrow"], "COVERED", "三态 × 三视觉 + 窄视口实测，标签未变灰"),
    ], "残余：149@accB 曾记 FAIL（红/异常样本缺采集），由 149@accB2 重采为 PASS"),
    ("150", "PASS", "PASS", "NONE", [
        ("STEP", "键盘焦点/悬停/固定选中三态互不混淆", "150", "B", ["focusability", "focusStyle", "note"], "COVERED", "行不可聚焦、ID span tabindex=0 且焦点环可见，三态可辨"),
    ]),
    ("154", "PASS", "PASS", "NONE", [
        ("STEP", "核对删除确认框维持既有外观/行为、参考页未受影响、无全局样式改动", "154", "D", ["cls", "primaryBg", "warnIcon"], "COVERED", "删除确认框为普通 message-box、未套用启停专用样式"),
    ]),
]

HEADER = {
    "task": "CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R3",
    "base_commit": "999de14087f0d4ae1054d7d50fb4cca09dd910dd",
    "raw_package_sha256": "1cf178aefb03b0727e5b036ee66123631cf8d4a525622177749e258e0a5e15e6",
    "source_of_truth": "ACCEPTANCE.md §4 现行定义（含定向修订）",
    "scope": "R2 后仍为 PASS 的 89 条逐步骤覆盖核实",
    "verdict_vocab": ["COVERED", "MISSING", "SIMULATED_ONLY"],
    "desensitization": "业务可识别值（机构名称、探针 ID、原始数据源 ID 等）以占位/描述替代；保留原始文件名、JSON 键名与字段路径，便于持有原包者逐项对账",
    "note": "判定为人工逐条审核结果，非由 v:PASS/all:true 等结果布尔值自动推导；交叉引用他用例证据处已注明所证明的具体条件",
}


def render_json():
    items = []
    for cid, r2, r3, basis, steps, *rest in CASES:
        note = rest[0] if rest else ""
        items.append({
            "id": "CCFG-AC-%s" % cid,
            "r2_status": r2,
            "r3_status": r3,
            "basis": basis,
            "steps": [
                {
                    "kind": k, "definition": d,
                    "evidence": {"key": key, "file": FILES[fl], "fields": fields},
                    "verdict": v, "why": why,
                }
                for (k, d, key, fl, fields, v, why) in steps
            ],
            "note": note,
        })
    changed = [i["id"] for i in items if i["r2_status"] != i["r3_status"]]
    return {
        "header": HEADER,
        "counts": {
            "items": len(items),
            "r3_changed": len(changed),
            "r3_changed_ids": changed,
        },
        "items": items,
    }


def render_md(doc):
    L = []
    L.append("# R3 逐步骤覆盖矩阵（脱敏）")
    L.append("")
    L.append("- 任务：`%s`" % HEADER["task"])
    L.append("- 基准提交：`%s`" % HEADER["base_commit"])
    L.append("- 原始证据包 SHA-256：`%s`" % HEADER["raw_package_sha256"])
    L.append("- 判定标准：%s" % HEADER["source_of_truth"])
    L.append("- 范围：%s" % HEADER["scope"])
    L.append("- 判定词汇：`COVERED` / `MISSING` / `SIMULATED_ONLY`")
    L.append("- 脱敏：%s" % HEADER["desensitization"])
    L.append("- 说明：%s" % HEADER["note"])
    L.append("")
    L.append("本轮由 `PASS` 下调为 `BLOCKED` 共 **%d** 条：%s" % (
        doc["counts"]["r3_changed"], "、".join(x.replace("CCFG-AC-", "") for x in doc["counts"]["r3_changed_ids"])))
    L.append("")
    for it in doc["items"]:
        mark = "" if it["r2_status"] == it["r3_status"] else "  **[本轮下调]**"
        L.append("## %s — R2 `%s` → R3 `%s`（basis=%s）%s" % (it["id"], it["r2_status"], it["r3_status"], it["basis"], mark))
        L.append("")
        L.append("| 步骤 | 现行定义关键要求 | 证据文件 / 键 | 字段 | 判定 | 理由 |")
        L.append("|---|---|---|---|---|---|")
        for st in it["steps"]:
            L.append("| %s | %s | `%s#%s` | %s | %s | %s |" % (
                st["kind"], st["definition"], st["evidence"]["file"], st["evidence"]["key"],
                ", ".join(st["evidence"]["fields"]) or "—", st["verdict"], st["why"]))
        if it["note"]:
            L.append("")
            L.append("> 残余说明：%s" % it["note"])
        L.append("")
    return "\n".join(L)


def main():
    d = os.path.dirname(os.path.abspath(__file__))
    doc = render_json()
    with open(os.path.join(d, "coverage-matrix.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(os.path.join(d, "coverage-matrix.md"), "w", encoding="utf-8") as f:
        f.write(render_md(doc) + "\n")
    print("items=%d changed=%d" % (doc["counts"]["items"], doc["counts"]["r3_changed"]))
    print("changed_ids=%s" % ",".join(doc["counts"]["r3_changed_ids"]))


if __name__ == "__main__":
    main()
