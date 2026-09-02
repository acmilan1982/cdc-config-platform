# 数据订阅正式验收 R1 浏览器场景索引

- 任务编号：`DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1`
- 场景来源：真实 Chrome headless（`/usr/bin/google-chrome`），CDP 驱动，Node v24；页面 `http://127.0.0.1:5173/config/subscribe`（`/api`→后端 8080）。
- 覆盖：S1=10 + S2=6 + S3=13 + S3 补充=3 + S4-A=5 + S4-B=6 + S5=11 = **54 个浏览器场景**；每场景对应验收 ID、视口、前置数据、操作步骤、实际结果、证据路径、拦截标记。
- 拦截语义：`BROWSER_INTERCEPTED_UI_SCENARIO` 场景（标记 `拦截(UI)`）只证明 UI 行为（高容量/失败/断连/禁用/结构化错误回显/载荷采集），不代表真实 Oracle 数据；真实 API、数据库保存与元数据读取引用原正式验收真实 HTTP/DB 证据或本索引真实场景。
- 控制台：每段 CONSOLE 场景新增 error=0（证据见 `s*-console-errors.json`）。
- 机读完整记录：`s1..s5-scenarios.json`。证据路径相对本目录 `browser/`。

## §5.1 列表与查询（10 场景）

### S1-1 — 真实

- 验收 ID：DSUB-AC-028、DSUB-AC-029、DSUB-AC-030、DSUB-AC-031
- 视口：1440x900
- 前置数据：空条件进入
- 操作步骤：导航到 /config/subscribe；等待列表渲染
- 实际结果：进入自动加载 7 条启用订阅（预期 7），自动列表请求次数=2
- 关键请求/计数：{"listCalls":2}
- 证据：`s1-list-initial.png`、`s1-list-initial.json`

### S1-2 — 真实

- 验收 ID：DSUB-AC-032、DSUB-AC-033、DSUB-AC-034、DSUB-AC-035、DSUB-AC-036
- 视口：1440x900
- 前置数据：种子订阅含 112-source-19c 与 my-19c
- 操作步骤：源库多选: 孝感市第一人民医院 + 本机的oracle；点击查询
- 实际结果：组内 OR 后 5 行（源=112或my，含多源异常记录 token 匹配），新增列表请求 1 次
- 关键请求/计数：{"listDelta":1}
- 证据：`s1-multisource-or.json`

### S1-3 — 真实

- 验收 ID：DSUB-AC-033、DSUB-AC-034、DSUB-AC-035、DSUB-AC-036
- 视口：1440x900
- 前置数据：源=112-source-19c AND 目标=R1TGT01
- 操作步骤：源库选 孝感市第一人民医院；目标库选 R1临时目标库01；点击查询
- 实际结果：组间 AND 后 4 行（仅同时含该源与该目标），行=["R1验收-正常订阅-多目标多表 | \t | 孝感市第一人民医院 | \t | 共 3 张 | \t | R1临时目标库01 | +2 | \t |","R1验收-多Schema订阅 | \t | 孝感市第一人民医院 | \t | 共 3 张 | \t | R1临时目标库01 | \t | 2026-","配置异常：该记录包含多个源库，请直接维护数据库 | \t | — | \t | — | \t | R1临时目标库01 | \t | 2026-09-","R1验收-无法解析源表 | \t | 孝感市第一人民医院 | \t | 共 2 张 | \t | R1临时目标库01 | \t | 2026-09-"]
- 证据：`s1-and.json`

### S1-5 — 真实

- 验收 ID：DSUB-AC-037
- 视口：1440x900
- 前置数据：查询条件已生效
- 操作步骤：点击重置
- 实际结果：重置后查询区已选=["选择源库（可多选，组内 OR）","选择目标库（可多选，组内 OR）"]（应均无已选值），未触发列表请求（delta=0），列表仍保持 4 行
- 关键请求/计数：{"listDelta":0}
- 证据：`s1-reset.json`

### S1-6 — 真实

- 验收 ID：DSUB-AC-038
- 视口：1440x900
- 前置数据：源=112-source-19c AND 目标=my-target-doris-v4（无活动订阅同时引用）
- 操作步骤：设置源与目标；点击查询
- 实际结果：行数=0，空状态="暂无符合条件的订阅记录"
- 证据：`s1-empty.png`、`s1-empty.json`

### S1-7 — 真实

- 验收 ID：DSUB-AC-041
- 视口：1440x900
- 前置数据：R1ACNORMAL01 共 3 张（1 Schema 3 表）
- 操作步骤：关闭下拉后悬停“共 3 张”
- 实际结果：悬停新增 tooltip=["SPT_HIS_2023 | OPT_FEE | OPT_RECORD | PT_EXAMINATION_RECORD"]（预期含 SPT_HIS_2023 + OPT_FEE/OPT_RECORD/PT_EXAMINATION_RECORD）
- 证据：`s1-hover-tables.png`、`s1-hover-tables.json`

### S1-8 — 真实

- 验收 ID：DSUB-AC-042
- 视口：1440x900
- 前置数据：R1ACNORMAL01 3 目标库（+2）
- 操作步骤：关闭下拉后悬停“+2”
- 实际结果：+N 悬停新增 tooltip=["R1临时目标库01 | doirs库 | doirs库"]（预期含全部 3 个目标描述）
- 证据：`s1-hover-n.png`、`s1-hover-n.json`

### S1-9 — 真实

- 验收 ID：DSUB-AC-009、DSUB-AC-010、DSUB-AC-044
- 视口：1440x900
- 前置数据：种子 R1ACANOMALY01
- 操作步骤：查看列表异常行
- 实际结果：异常行=1，操作按钮数=[0]（应为0）
- 证据：`s1-list-initial.png`

### S1-10 — 真实

- 验收 ID：DSUB-AC-044、DSUB-AC-045
- 视口：1440x900
- 前置数据：种子 R1ACINACTIVE01/R1ACNOTFOUND01
- 操作步骤：查看列表展示
- 实际结果：已停用行=["R1验收-源库已停用 | \t | 业务库 | 已停用 | \t | 共 1 张 | \t | R1临时目标库01 | \t | 2026-09-02T12:27:18 | 创建时间 | "]；不存在行=["R1验收-源库不存在 | \t | R1-NOT-EXIST-SRC | 不存在 | \t | 共 1 张 | \t | R1临时目标库01 | \t | 2026-09-02T12:27"]
- 证据：`s1-list-initial.png`

### S1-CONSOLE — 真实

- 验收 ID：DSUB-AC-118、DSUB-AC-126
- 视口：1440x900
- 操作步骤：全程收集
- 实际结果：控制台新增 error 数=0
- 证据：`s1-console-errors.json`

## §5.2 详情（6 场景）

### S2-1 — 真实

- 验收 ID：DSUB-AC-049、DSUB-AC-050、DSUB-AC-052
- 视口：1440x900
- 前置数据：R1ACNORMAL01 3表/1Schema/3目标
- 操作步骤：列表点击“查看”
- 实际结果：详情弹窗打开 title=订阅详情，宽 680px，详情请求 +1 次，分组=[{"schema":"SPT_HIS_2023","tables":["OPT_FEE","OPT_RECORD","PT_EXAMINATION_RECORD"]}]，目标=["R1临时目标库01 | R1TGT01","doirs库 | company-target-doris-v4","doirs库 | target-doris-v4"]
- 证据：`s2-detail-normal.png`、`s2-detail-normal.json`

### S2-2 — 真实

- 验收 ID：DSUB-AC-052
- 视口：1440x900
- 前置数据：R1ACNORMAL02 CDC_USER+SPT_HIS_2023 两 Schema
- 操作步骤：列表点击“查看”
- 实际结果：分组=[{"schema":"CDC_USER","tables":["LOG_MINING_FLUSH"]},{"schema":"SPT_HIS_2023","tables":["OPT_FEEDETAIL","OPT_HANDLEDETAIL"]}]，源表共 3 张，标题=订阅详情
- 证据：`s2-detail-multischema.png`、`s2-detail-multischema.json`

### S2-3 — 拦截(UI)

- 验收 ID：DSUB-AC-054
- 视口：1440x900
- 前置数据：截获详情返回 41 张表（40+1）以验证内部滚动
- 操作步骤：BROWSER_INTERCEPTED_UI_SCENARIO 查看 R1ACNORMAL01
- 实际结果：源表区 rows=41，表区 clientH=218 scrollH=930（内部滚动=true），弹窗体 clientH=540 scrollH=588，拦截命中=1
- 证据：`s2-detail-scroll.png`、`s2-detail-scroll.json`

### S2-4 — 真实

- 验收 ID：DSUB-AC-053、DSUB-AC-055
- 视口：1440x900
- 前置数据：R1ACUNPARSE01 含 THIS.IS.NOT.A.VALID.TOKEN
- 操作步骤：列表点击“查看”
- 实际结果：无法解析区={"title":"以下源表片段无法解析，可能存在历史格式异常：","list":"THIS.IS.NOT.A.VALID.TOKEN","warnings":["警告：源表配置存在无法解析的内容（1 项），请查看原始表清单"]}，弹窗文本片段=订阅详情 | 基本信息 | 订阅描述\tR1验收-无法解析源表 | 订阅ID\tR1ACUNPARSE01 | 源库\t孝感市第一人民医院112-source-19c | 源表（共 2 张） | SPT_HIS_2023 | OPT_FEE |
- 证据：`s2-detail-unparseable.png`、`s2-detail-unparseable.json`

### S2-5 — 真实

- 验收 ID：DSUB-AC-051
- 视口：1440x900
- 前置数据：R1ACANOMALY01 多源异常
- 操作步骤：查看列表异常行按钮
- 实际结果：异常行操作按钮=[]（不应含查看/编辑/删除），警示文字=配置异常：该记录包含多个源库，请直接维护数据库
- 证据：`s1-list-initial.png`、`s2-anomaly-noview.json`

### S2-CONSOLE — 真实

- 验收 ID：DSUB-AC-118
- 视口：1440x900
- 操作步骤：全程收集
- 实际结果：控制台新增 error 数=0
- 证据：`s2-console-errors.json`

## §5.3 新增/编辑弹窗（13 场景）

### S3-1 — 真实

- 验收 ID：DSUB-AC-057
- 视口：1440x900
- 前置数据：无
- 操作步骤：新增订阅 打开；对 R1ACNORMAL01 点编辑
- 实际结果：新增 title=新增订阅，编辑 title=编辑订阅；两者同一弹窗类 subscribe-form-dialog，字段结构一致（描述/源库/目标库/源表 footer 取消/保存）
- 证据：`s3-form-create.png`、`s3-shared-dialog.json`

### S3-2 — 真实

- 验收 ID：DSUB-AC-061
- 视口：1440x900
- 前置数据：新增弹窗
- 操作步骤：输入 300 个 a 到描述框
- 实际结果：输入前 value=0，maxlength 属性=255，输入 300 字符后 value.length=255（浏览器 maxlength 截断到 255），字数=255 / 255，placeholder=请输入订阅描述（必填，最多 255 字符）
- 证据：`s3-desc-max255.json`

### S3-3 — 真实

- 验收 ID：DSUB-AC-058、DSUB-AC-070
- 视口：1440/1024/1920
- 前置数据：无
- 操作步骤：三种视口打开新增弹窗并测量；1920 下重开对比位置
- 实际结果：1440:1280x738@(73,135)；1024:960x630@(25,115)（宽收窄到 960<1280）；1920:1280x886@(313,162)；1920 重开=1280x886@(313,162)（重开后水平居中 x≈320）
- 证据：`s3-size.json`

### S3-4 — 真实

- 验收 ID：DSUB-AC-059、DSUB-AC-070
- 视口：1440x900
- 前置数据：新增弹窗
- 操作步骤：拖动标题栏到左上角与右下角；关闭后重开
- 实际结果：初始=(73,135) 拖后=(176,848)（发生位移=true）；标题栏仍完整在视口内=true（hx=192 hw=1248 hy=864 hh=36）；重开后 x=73（居中=true）
- 证据：`s3-drag-boundary.png`、`s3-drag.json`

### S3-5 — 真实

- 验收 ID：DSUB-AC-060
- 视口：1440x900
- 前置数据：描述框已输入字符(脏)
- 操作步骤：脏状态下点取消 → 二次确认；取消确认仍停留；再次取消 → 确定关闭
- 实际结果：二次确认弹窗="提示 | | 表单有未保存的修改，确定关闭吗？ | | 取消 | 确定"；第一次取消后弹窗仍开=true；确定后关闭=true
- 证据：`s3-dirty-close.json`

### S3-6 — 真实

- 验收 ID：DSUB-AC-069
- 视口：1440x900
- 前置数据：新增弹窗
- 操作步骤：测量源库/目标库 form-item 布局
- 实际结果：源库 cy=305 top=289，目标库 cy=305 top=253，同行=true，中轴差=0px
- 证据：`s3-axis.json`、`s3-form-create.png`

### S3-7 — 真实

- 验收 ID：DSUB-AC-071、DSUB-AC-072、DSUB-AC-073
- 视口：1440x900
- 前置数据：5 目标候选含禁用 R1TGT.DOT
- 操作步骤：截图 + DOM 测量；悬停第一张可用卡；勾选 R1TGT01
- 实际结果：卡片数=5，首行=3 张/行、次行=2 张；卡尺寸 200x48；禁用=R1TGT.DOT（bg=rgb(247, 248, 250) border=rgb(228, 231, 237) disabled=true）；勾选后 R1TGT01 checked=true selected=true border=rgb(37, 99, 235)；悬停后 company-target-doris-v4 border=rgb(220, 223, 230)（vs 未悬停 rgb(228, 231, 237)）
- 证据：`s3-target-cards.png`、`s3-target-cards.json`

### S3-8 — 真实

- 验收 ID：DSUB-AC-062、DSUB-AC-064、DSUB-AC-065、DSUB-AC-066、DSUB-AC-067
- 视口：1440x900
- 前置数据：启用源库 3 个
- 操作步骤：空搜索看全部；输入 my-19；输入 MY-19C（大写）；输入 本机；输入 source-19；点选 my-19c
- 实际结果：空=全部 3 项(孝感市第一人民医院 | 112-source-19c;杭州市第一人民医院 | 5905f1ce83024410836b40ca0ebfc446;本机的oracle | my-19c)；'my-19'→本机的oracle | my-19c；'MY-19C'(大小写不敏感)→本机的oracle | my-19c；'本机'(机构)→本机 | 的oracle | my-19c；'source-19'(ID模糊优先)→孝感市第一人民医院 | 112-source-19c；选中后源库区=源库 | 本机的oracle
- 证据：`s3-source-search.json`

### S3-9 — 真实

- 验收 ID：DSUB-AC-068
- 视口：1440x900
- 前置数据：先选 112-source-19c + SPT_HIS_2023 下勾选 OPT_FEE
- 操作步骤：切到 my-19c → 二次确认；取消确认观察；再切 → 确定
- 实际结果：Schemas=["CDC_USER","SPT_HIS_2023"]，选表后摘要=已选择：1 个源库 · 1 个 Schema · 1 个表 · 0 个目标库；切换确认弹窗="提示 | | 切换源库将清空当前已选择的源表，是否继续？ | | 取消 | 确定"；取消后仍=源库 | 孝感市第一人民医院，摘要=已选择：1 个源库 · 1 个 Schema · 1 个表 · 0 个目标库（未清空）；确定后摘要=已选择：1 个源库 · 0 个 Schema · 0 个表 · 0 个目标库（源表清空）
- 证据：`s3-switch-source.json`

### S3-10 — 真实

- 验收 ID：DSUB-AC-097、DSUB-AC-098
- 视口：1440x900
- 前置数据：R1ACNORMAL01 3表/1Schema/3目标
- 操作步骤：列表点编辑，读回显
- 实际结果：描述回显="R1验收-正常订阅-多目标多表"，源库=源库 | 孝感市第一人民医院，已选目标=["R1TGT01","company-target-doris-v4","target-doris-v4"]，激活Schema=SPT_HIS_2023，已选表=["OPT_FEE","OPT_RECORD","PT_EXAMINATION_RECORD"]，摘要=已选择：1 个源库 · 1 个 Schema · 3 个表 · 3 个目标库
- 证据：`s3-edit-echo.png`、`s3-edit-echo.json`

### S3-11 — 真实

- 验收 ID：DSUB-AC-048、DSUB-AC-104、DSUB-AC-105
- 视口：1440x900
- 前置数据：R1ACINACTIVE01 源库 199-source 已停用
- 操作步骤：列表点编辑
- 实际结果：弹窗 banner="源库 业务库 已停用，请更换源库后保存"，源库=源库 | 业务库，保存按钮 disabled=true
- 证据：`s3-edit-inactive-blocked.png`、`s3-edit-blocked.json`

### S3-12 — 拦截(UI)

- 验收 ID：DSUB-AC-102、DSUB-AC-103
- 视口：1440x900
- 前置数据：截获 /edit 返回 sourceReachable=false
- 操作步骤：BROWSER_INTERCEPTED_UI_SCENARIO 编辑 R1ACNORMAL01
- 实际结果：banner="当前使用已保存源表配置，源库暂不可连接，仅可修改描述与正常目标库"，源库下拉 disabled=true，表选择器 disabled=true opacity=0.6
- 证据：`s3-limited-edit.png`、`s3-limited-edit.json`

### S3-CONSOLE — 真实

- 验收 ID：DSUB-AC-118
- 视口：1440x900
- 操作步骤：全程收集
- 实际结果：控制台新增 error 数=0
- 证据：`s3-console-errors.json`

## §5.3 补充：编辑换源二次确认与失效已选表警告（3 场景）

### S3-13 — 真实

- 验收 ID：DSUB-AC-099、DSUB-AC-068
- 视口：1440x900
- 前置数据：R1ACNORMAL01 编辑已回显（3 表 SPT_HIS_2023 / 源 112-source-19c）
- 操作步骤：编辑→源库改选 my-19c；取消确认观察；再改选→确定清空；不保存取消关闭
- 实际结果：回显：源=源库 | 孝感市第一人民医院，已选表=3(OPT_FEE,OPT_RECORD,PT_EXAMINATION_RECORD)；确认弹窗1="切换源库将清空当前已选择的源表，是否继续？"（按钮 ["取消","确定"]）；取消后仍源=源库 | 孝感市第一人民医院，表=3（未清空=true）；确定后源=源库 | 本机的oracle，表=0，摘要=已选择：1 个源库 · 0 个 Schema · 0 个表 · 3 个目标库（清空=true）；关闭弹窗确认="表单有未保存的修改，确定关闭吗？"；PUT 请求=0（未写库=true）
- 证据：`s3b-source-switch-edit.png`、`s3b-source-switch-edit.json`

### S3-14 — 拦截(UI)

- 验收 ID：DSUB-AC-100、DSUB-AC-093
- 视口：1440x900
- 前置数据：截获 /edit 注入 invalidTables=[SPT_HIS_2023.OPT_FEE, SPT_HIS_2023.OPT_RECORD]
- 操作步骤：BROWSER_INTERCEPTED_UI_SCENARIO 编辑 R1ACNORMAL01；读警告；读保存禁用；移除异常已选表；读解除状态
- 实际结果：警告 banner=["存在 2 个已失效的已选源表，请移除异常已选表后保存","以下已选源表在当前源库中已不存在或不可访问，保存前必须移除： | | SPT_HIS_2023.OPT_FEE、SPT_HIS_2023.OPT_RECORD | 移除异常已选表"]；sf-list=SPT_HIS_2023.OPT_FEE、SPT_HIS_2023.OPT_RECORD；保存 disabled=true（失效期间禁止保存）；移除按钮点击=true；移除后 banner 残留=0，保存 disabled=false，摘要=已选择：1 个源库 · 1 个 Schema · 1 个表 · 3 个目标库，剩余已选表=1(PT_EXAMINATION_RECORD)；全程未发 PUT=true POST=true
- 证据：`s3b-invalid-tables.png`、`s3b-invalid-tables.json`

### S3-CONSOLE-B — 真实

- 验收 ID：DSUB-AC-118
- 视口：1440x900
- 操作步骤：S3-13/S3-14 全程收集
- 实际结果：控制台新增 error 数=0
- 证据：`s3b-console-errors.json`

## §5.4a Schema/表（真实源小容量）（5 场景）

### S4-1 — 真实

- 验收 ID：DSUB-AC-078、DSUB-AC-080、DSUB-AC-085
- 视口：1440x900
- 前置数据：真实源 112-source-19c（CDC_USER 1 表 / SPT_HIS_2023 9 表）
- 操作步骤：选源→首 Schema 自动加载；切 SPT_HIS_2023；回 CDC_USER；再回 SPT_HIS_2023；DOM 布局测量；勾选行样式
- 实际结果：Schemas=["CDC_USER | 已选 0 张","SPT_HIS_2023 | 已选 0 张"]；首 Schema=LOG_MINING_FLUSH（CDC_USER 请求 +1）；SPT_HIS_2023 请求 +1 表数=9(OPT_FEE,OPT_FEEDETAIL,OPT_HANDLEDETAIL,OPT_HANDLEDETAIL_EXE,OPT_RECORD,OPT_REGISTER,PT_EXAMINATION_DETAIL,PT_EXAMINATION_RECORD,PT_EXAMINATION_SUMMARY)；回 CDC_USER +0；再回 SPT +0（会话缓存命中）；布局 schemaPaneW=250 tablesPaneW=932 表视口 211/399 弹窗高=738；独立已选面板=false；勾选行 bg=rgb(237, 242, 254)
- 证据：`s4a-cache-layout.png`、`s4a-cache-layout.json`

### S4-2 — 真实

- 验收 ID：DSUB-AC-081
- 视口：1440x900
- 前置数据：SPT_HIS_2023 共 9 表
- 操作步骤：搜索 'OPT'；搜索 'opt'(小写)；搜索 'RECORD'；搜索 'zzz_nomatch'；清除搜索
- 实际结果：'OPT'→6 项(OPT_FEE,OPT_FEEDETAIL,OPT_HANDLEDETAIL,OPT_HANDLEDETAIL_EXE,OPT_RECORD,OPT_REGISTER)；'opt'→6 项（大小写不敏感=true）；'RECORD'→OPT_RECORD,PT_EXAMINATION_RECORD；'zzz_nomatch'→空提示“没有匹配当前搜索的源表”；清除后 9 项
- 证据：`s4a-search.json`

### S4-3 — 真实

- 验收 ID：DSUB-AC-082
- 视口：1440x900
- 前置数据：SPT_HIS_2023 9 表（真实）
- 操作步骤：筛选 OPT→全选当前筛选→取消当前筛选→仅看已选↕→清空当前Schema(取消/确定)
- 实际结果：全选后=6（徽标=SPT_HIS_2023 | 已选 6 张）→取消当前筛选后=0→单选2张→仅看已选可见=2(OPT_FEE,OPT_RECORD)→关闭仅看已选可见=9；清空确认弹窗“提示 | 确定清空当前 Schema（SPT_HIS_2023）下已选择的源表吗？”；取消后保留 2 张；二次确定后清空 0 张；汇总=已选择：1 个源库 · 0 个 Schema · 0 个表 · 0 个目标库
- 证据：`s4a-toolbar.png`、`s4a-toolbar.json`

### S4-4 — 真实

- 验收 ID：DSUB-AC-082、DSUB-AC-084
- 视口：1440x900
- 前置数据：SPT_HIS_2023（已清空）
- 操作步骤：普通点 OPT_RECORD；Shift 点 PT_EXAMINATION_SUMMARY(正向)；Shift 点 OPT_FEEDETAIL(反向)；普通点 PT_EXAMINATION_SUMMARY(取消锚点)；Shift 点 OPT_RECORD(范围取消)
- 实际结果：plain OPT_RECORD=[OPT_RECORD](1) → shift->PT_EXAMINATION_SUMMARY=[OPT_RECORD,OPT_REGISTER,PT_EXAMINATION_DETAIL,PT_EXAMINATION_RECORD,PT_EXAMINATION_SUMMARY](5) → shift reverse->OPT_FEEDETAIL=[OPT_FEEDETAIL,OPT_HANDLEDETAIL,OPT_HANDLEDETAIL_EXE,OPT_RECORD,OPT_REGISTER,PT_EXAMINATION_DETAIL,PT_EXAMINATION_RECORD,PT_EXAMINATION_SUMMARY](8) → plain PT_EXAMINATION_SUMMARY(取消)=[OPT_FEEDETAIL,OPT_HANDLEDETAIL,OPT_HANDLEDETAIL_EXE,OPT_RECORD,OPT_REGISTER,PT_EXAMINATION_DETAIL,PT_EXAMINATION_RECORD](7) → shift range-cancel->OPT_RECORD=[OPT_FEEDETAIL,OPT_HANDLEDETAIL,OPT_HANDLEDETAIL_EXE](3)；最终=OPT_FEEDETAIL,OPT_HANDLEDETAIL,OPT_HANDLEDETAIL_EXE（期望 OPT_FEEDETAIL,OPT_HANDLEDETAIL,OPT_HANDLEDETAIL_EXE，一致=true）
- 证据：`s4a-shift.png`、`s4a-shift.json`

### S4-CONSOLE-A — 真实

- 验收 ID：DSUB-AC-118
- 视口：1440x900
- 操作步骤：全程收集
- 实际结果：控制台新增 error 数=0
- 证据：`s4a-console-errors.json`

## §5.4b Schema/表高容量（拦截）（6 场景）

### S4-5 — 拦截(UI)

- 验收 ID：DSUB-AC-086、DSUB-AC-088、DSUB-AC-085
- 视口：1440x900
- 前置数据：BROWSER_INTERCEPTED_UI_SCENARIO SCHEMA_A 240 表（238 普通 + HIS.DOT/BAD,COM 保留字符）
- 操作步骤：拦截 metadata 后新建选源；读 DOM 行数与滚动；读弹窗高度
- 实际结果：渲染行数=240（240）；表视口 211/9639（内部滚动=true）弹窗高=738px（有界）；表头=共 240 张，已选 0 张；Schemas=["SCHEMA_A | 已选 0 张","SCHEMA_B | 已选 0 张","SCHEMA_ERR | 已选 0 张"]；徽标=["已选 0 张","已选 0 张","已选 0 张"]
- 证据：`s4b-240cap.png`、`s4b-240cap.json`

### S4-6 — 拦截(UI)

- 验收 ID：DSUB-AC-082
- 视口：1440x900
- 前置数据：BROWSER_INTERCEPTED_UI_SCENARIO SCHEMA_A 240
- 操作步骤：筛选 TAB1(100)→全选当前筛选→清除搜索→仅看已选↕→取消当前筛选→全量全选(238,保留字符跳过)→取消
- 实际结果：filter TAB1=100 → selectAll TAB1=100(已选择：1 个源库 · 1 个 Schema · 100 个表 · 0 个目标库) → clearSearch= HIS.DOT.sel=false BAD,COM.sel=false → onlySelected ON count=100 已选含保留=false → cancel current filter=0(已选择：1 个源库 · 0 个 Schema · 0 个表 · 0 个目标库) → selectAll full list=238 保留被选= → cancel full list=0
- 证据：`s4b-toolbar240.png`、`s4b-toolbar240.json`

### S4-7a — 拦截(UI)

- 验收 ID：DSUB-AC-082
- 视口：1440x900
- 前置数据：BROWSER_INTERCEPTED_UI_SCENARIO SCHEMA_A 240（从 0 开始）
- 操作步骤：普通 TAB015；Shift TAB030(正向 16)；Shift TAB010(反向)；普通 TAB055；Shift TAB065(跨保留字符 idx59)
- 实际结果：plain TAB015=1(期望1) → shift TAB030(fwd)=16(期望16) → shift TAB010(reverse)=21(期望21) → plain TAB055=22(期望22) → shift TAB065(cross-reserved)=32(期望32)；全部与期望一致=true；保留字符被选= 或 无=true（单次 Shift 一次性提交整段=true）
- 证据：`s4b-shift240.png`、`s4b-shift240.json`

### S4-7b — 拦截(UI)

- 验收 ID：DSUB-AC-082、DSUB-AC-084
- 视口：1440x900
- 前置数据：BROWSER_INTERCEPTED_UI_SCENARIO；R2§6.3 搜索变化清除锚点
- 操作步骤：搜索 TAB2 后 Shift TAB230(应为单表)；清除搜索→普通 TAB220→Shift TAB228(新锚点正向)；普通 TAB224(取消)→Shift TAB220(范围取消)
- 实际结果：搜索 TAB2 后（筛选内起点 0）Shift TAB230 后筛选内=1（增量 1，期望 1 → 锚点已清=true，搜索前全量 32）；plain TAB220(new anchor)=34(期望34) → shift TAB228(fwd fresh)=42(期望42) → plain TAB224(取消锚点)=41(期望41) → shift TAB220(range cancel)=37(期望37)（一致=true）；最终=37；选中集合含保留字符=true
- 证据：`s4b-anchor240.json`

### S4-8 — 拦截(UI)

- 验收 ID：DSUB-AC-079、DSUB-AC-083
- 视口：1440x900
- 前置数据：BROWSER_INTERCEPTED_UI_SCENARIO SCHEMA_ERR 首次失败→重试成功；跨 Schema 保留
- 操作步骤：进 SCHEMA_ERR(失败)；切走再切回(再次请求未缓存空)；成功重试；SCHEMA_A 保留；SCHEMA_B 选 1；回 A/回 ERR(缓存命中)
- 实际结果：首次失败:msg=BROWSER_INTERCEPTED_UI_SCENARIO 模拟：该 Schema 表清单加载失 retry按钮=true（徽标=["已选 37 张","已选 0 张"]）；切走再切回仍报错=true（失败请求共 2 次 → 失败未被缓存为空列表）；重试成功后表=E_ONE,E_TWO,E_THREE（failed 标记清除=true）；回 SCHEMA_A 请求 +0（缓存命中）徽标=SCHEMA_A | 已选 37 张；SCHEMA_B 选后汇总=已选择：1 个源库 · 2 个 Schema · 38 个表 · 0 个目标库；回 SCHEMA_ERR 请求 +0（缓存命中）表=E_ONE,E_TWO,E_THREE；最终汇总=已选择：1 个源库 · 2 个 Schema · 38 个表 · 0 个目标库
- 证据：`s4b-fail-retry.json`、`s4b-fail-retry.png`

### S4-CONSOLE-B — 真实

- 验收 ID：DSUB-AC-118
- 视口：1440x900
- 操作步骤：全程收集
- 实际结果：控制台新增 error 数=0
- 证据：`s4b-console-errors.json`

## §5.5 保存/删除/完整闭环（11 场景）

### S5-1 — 拦截(UI)

- 验收 ID：DSUB-AC-089、DSUB-AC-093
- 视口：1440x900
- 前置数据：新增弹窗
- 操作步骤：空表单点保存(前端校验)；填合法→拦截 POST 返回 40300(3 项)→点保存
- 实际结果：前端本地校验 4 条：[dataSubDesc] dataSubDesc：订阅描述不能为空 | [dataFromSourceId] dataFromSourceId：必须且只能选择一个源库 | [dataToSourceIds] dataToSourceIds：必须至少选择一个目标库 | [sourceTables] sourceTables：必须至少选择一张源表；40300 结构化失效项 3 条：[sourceTables] OPT_NOPE：源表不存在或不可订阅 | [dataToSourceIds] R1-NOT-EXIST-TGT：目标库引用不存在 | [dataSubDesc] dataSubDesc：订阅描述超过 255 字符上限（截获 POST 1 次，UI 逐条展示纯前端行为）
- 证据：`s5-1-validation.png`、`s5-1-validation.json`

### S5-2a — 拦截(UI)

- 验收 ID：DSUB-AC-094
- 视口：1440x900
- 前置数据：拦截 POST 延迟 1000ms 观察保存中状态
- 操作步骤：点保存；350ms 读取按钮；请求完成后读取
- 实际结果：保存中按钮 disabled=true loading=true（el-button is-disabled/is-loading 生效）；请求结束后 disabled=false（恢复可点）；弹窗仍开=true
- 证据：`s5-2a-saving-disabled.png`、`s5-2a-saving-disabled.json`

### S5-2b — 真实

- 验收 ID：DSUB-AC-094、DSUB-AC-095
- 视口：1440x900
- 前置数据：真实后端（已批准 e2e DML），描述=R1验收-e2e-浏览器闭环-0902-新
- 操作步骤：填描述/源/表/目标；同步双击保存；等关闭+刷新
- 实际结果：双击后创建 POST 提交数=1（双击瞬间=1，快速重复点击未重复提交=true，按钮中 disabled=false）；弹窗关闭=true；成功提示=操作成功。配置将在相关 sync-client 重启后生效。；列表出现行=true（重复行=1）
- 证据：`s5-2b-create.png`、`s5-2b-create.json`

### S5-3 — 真实

- 验收 ID：DSUB-AC-095
- 视口：1440x900
- 前置数据：新增后列表点击查看
- 操作步骤：点查看→详情
- 实际结果：详情标题=订阅详情；分组=[{"schema":"CDC_USER","tables":["LOG_MINING_FLUSH"]}]；目标=["R1临时目标库01 R1TGT01"]；含描述=true
- 证据：`s5-3-detail.png`、`s5-3-detail.json`

### S5-4 — 拦截(UI)

- 验收 ID：DSUB-AC-101、DSUB-AC-102、DSUB-AC-103
- 视口：1440x900
- 前置数据：拦截 PUT 采集载荷（不写库）
- 操作步骤：编辑仅改描述→PUT；编辑新增表→PUT
- 实际结果：PRESERVE 载荷={"mode":"PRESERVE","hasSourceTables":false,"desc":"S5-4 PRESERVE 描述改"}；REPLACE 载荷={"mode":"REPLACE","sourceTables":["CDC_USER.LOG_MINING_FLUSH","SPT_HIS_2023.OPT_FEE"],"hasSourceTables":true,"desc":"R1验收-e2e-浏览器闭环-0902-新"}（新增表后汇总=已选择：1 个源库 · 2 个 Schema · 2 个表 · 1 个目标库）
- 证据：`s5-4-mode.json`

### S5-5 — 真实

- 验收 ID：DSUB-AC-097、DSUB-AC-098、DSUB-AC-101
- 视口：1440x900
- 前置数据：真实后端编辑（已批准），描述 R1验收-e2e-浏览器闭环-0902-新→R1验收-e2e-浏览器闭环-0902-编辑后 且新增 SPT_HIS_2023.OPT_FEE（REPLACE 真实写库）
- 操作步骤：编辑回显读旧描述；改描述+加表；保存→详情校验
- 实际结果：回显描述=R1验收-e2e-浏览器闭环-0902-新；编辑前汇总=编辑后关闭=true 成功提示=操作成功。配置将在相关 sync-client 重启后生效。 列表出现新描述=true；详情分组=[{"schema":"CDC_USER","tables":["LOG_MINING_FLUSH"]},{"schema":"SPT_HIS_2023","tables":["OPT_FEE"]}]（共 2 张，含 LOG_MINING_FLUSH+OPT_FEE=true）
- 证据：`s5-5-edit.png`、`s5-5-edit.json`

### S5-6 — 真实

- 验收 ID：DSUB-AC-113、DSUB-AC-114
- 视口：1440x900
- 前置数据：真实删除预览 R1验收-e2e-浏览器闭环-0902-编辑后
- 操作步骤：列表点删除→预览
- 实际结果：不可恢复提示=数据库记录物理删除且无法恢复；订阅描述=R1验收-e2e-浏览器闭环-0902-编辑后；源库=孝感市第一人民医院112-source-19c；Schema 数=2；表数=2；目标库=R1临时目标库01R1TGT01；重启说明=当前运行中的同步任务不会立即停止，需要重启相关 sync-client 后生效。
- 证据：`s5-6-delete-preview.png`、`s5-6-delete-preview.json`

### S5-7 — 真实

- 验收 ID：DSUB-AC-117
- 视口：1440x900
- 前置数据：删除弹窗已打开
- 操作步骤：点取消
- 实际结果：DELETE 请求增量=0（取消不发 DELETE=true）；行仍在列表=true
- 证据：`s5-7-cancel-delete.json`

### S5-8 — 真实

- 验收 ID：DSUB-AC-112、DSUB-AC-116
- 视口：1440x900
- 前置数据：真实后端删除（已批准），行 R1验收-e2e-浏览器闭环-0902-编辑后
- 操作步骤：再次点删除预览；点确认删除
- 实际结果：DELETE 增量=1（=1 物理删除）；删除成功提示=操作成功。配置将在相关 sync-client 重启后生效。；行从列表消失=true；预览再次加载=true
- 证据：`s5-8-delete.png`、`s5-8-delete.json`

### S5-9 — 真实

- 验收 ID：DSUB-AC-095、DSUB-AC-112、DSUB-AC-117
- 视口：1440x900
- 前置数据：完整闭环 新增→列表→详情→编辑→删除预览→取消→再次预览→确认删除
- 操作步骤：串联 S5-2b/3/5/6/7/8
- 实际结果：闭环=PASS：{"createDesc":"R1验收-e2e-浏览器闭环-0902-新","editedDesc":"R1验收-e2e-浏览器闭环-0902-编辑后","created":true,"detailShown":true,"editedPersisted":true,"previewShown":true,"cancelNoDelete":true,"confirmDelete":true,"goneAfterDelete":true}
- 证据：`s5-9-e2e.json`

### S5-CONSOLE — 真实

- 验收 ID：DSUB-AC-118
- 视口：1440x900
- 操作步骤：全程收集
- 实际结果：控制台新增 error 数=0
- 证据：`s5-console-errors.json`

## 计数与真实/拦截边界

- 共 54 场景（S1×10、S2×6、S3×13、S3 补充×3、S4-A×5、S4-B×6、S5×11）。
- 真实场景（真实后端 API / 已批准 e2e DML）：S1 全段、S2-1/2/4/5、S3-1~S3-11、S3-13、S4-1~S4-4、S5-2b/3/5/6/7/8/9。
- 拦截 UI 场景：S2-3（详情 41 表内部滚动）、S3-12（源库不可达有限编辑）、S3-14（已失效已选表警告与保存阻断）、S4-5~S4-8（240 表容量、Shift/锚点边界、失败重试）、S5-1（40300 结构化错误回显）、S5-2a（保存中按钮禁用/延迟）、S5-4（PUT PRESERVE/REPLACE 载荷采集，不写库）。
- 缓存命中、单次提交、取消不删除等用网络请求计数或拦截命中次数证明（见各场景实际结果）。
