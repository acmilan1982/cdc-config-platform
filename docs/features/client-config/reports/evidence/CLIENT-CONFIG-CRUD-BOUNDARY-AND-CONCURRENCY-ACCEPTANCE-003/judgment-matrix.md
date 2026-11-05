# 判定矩阵（10 条 AC）

状态：`PASS` 表示本批可验证范围内的定义为真；证据路径均相对于本目录。

## CCFG-AC-021 删除取消/确认与物理删除、无级联 — PASS

- 前置：`c-dssr1-0906-a` 为 Agent 在 `data-source-snapshot-status` 任务中创建的合成探针（`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1/db/002-insert-master.sql`），验收前有 5 条 `CDC_DATA_SOURCE_RUN_STATE` 关联（`results/runstate-c-dssr1.txt`）。
- 动作：固定选中该行 → 打开删除菜单 → 取消；再次打开 → 确认删除。
- 实际：取消框标题/正文/按钮正确，`deleteRequests=0`，行仍在，固定选中仍为该行；确认 `DELETE /api/clients/c-dssr1-0906-a` HTTP 200，随后 `GET ?status=ALL` 重载；`post.apiRow=null`、`apiCount=77→76`；SQL 回读 `CLIENT_ROW|0`、`RUNSTATE_ROWS|5` 且 5 行逐字段未变，其他探针 76、其他源 265；ZK 子节点名列表仍为 `[zk-client-01]`（匿名化；该观察在并发窗口前，非 CRUD 前快照）。
- 证据键：`results/ac021-delete.json`（`cancel`、`confirm.deleteResponse`、`post`）、`results/ac021-postcheck.txt`、`results/zk-clients-before-after.txt`。
- 删除成功后固定选中清除：本轮未当场观察，引用前序真实证据 `../CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001/group-f-results.json` 的 `ac145.b5`（提交 `242cc5cf878216ef6e020effc539ee742c87a35c`；`selectionBefore=["MULTIAC-DEL2"]`，删除成功后 `rowPresent=false`、`selectionAfter=[]`）。
- 覆盖：取消、确认、物理删除、关联零级联。删除成功后的固定选中清除属 `CCFG-AC-144` 的独立定义，本轮只观察取消保留选中；清除分支按上述前序证据引用，不声称是 003 当场观察。

## CCFG-AC-024 启用确认与仅 FG_ACTIVE→1 — PASS

- 前置：`S3AC-C024-OFF` 停用，`FG_ACTIVE='0'`，关联源 `S3AC-S024-1` 启用。
- 动作：启用菜单 → 取消；再次 → 确认。
- 实际：确认框标题「启用探针」、正文「确定启用探针 S3AC-C024-OFF 吗？」、按钮「取消/启用」、类 `cc-confirm--enable`；取消 `putRequests=0` 且行仍停用；确认 `PUT .../enable` HTTP 200；回读 `fgActive='1'`、`status=ENABLED`，描述/数据源不变；源 `FG_ACTIVE` 仍为 `1`；ZK 不变；静态核对后端 clientconfig 无 ZK/Kafka/进程调用。
- 证据键：`results/ac024-enable.json`、`results/ac024-postcheck.txt`、`results/static-checks.txt`。
- 覆盖：启用二次确认、取消零写、成功仅改 `FG_ACTIVE`、不操作运行侧。

## CCFG-AC-027 异常数据源下的启停删矩阵 — PASS

- 前置：四类异常各自隔离——源停用、源不存在、源 ID 含逗号、源重复分配；重复分配组含已停用持有者 `S3AC-C027DA`。
- 动作：对每类执行停用、删除；对停用/不存在/逗号记录执行启用；对重复分配记录执行启用。
- 实际：4 条停用全部 200 → `FG_ACTIVE='0'`；4 条删除全部 200 → 行不存在；3 条可启用异常全部 200 → `FG_ACTIVE='1'`；重复分配启用返回业务码 `40941`，提示「数据源“S3AC-ORG（S3AC-S027-DUPP）”已分配给探针：S3AC-C027DA，不能重复分配。」，行仍停用。
- 证据键：`results/ac027-disable-delete.json`（`disable[]`、`delete[]`）、`results/ac027-enable.json`（`allow[]`、`reject[]`）。
- 覆盖：停用/删除不受四类异常阻止；启用仅受重复分配阻止且提示明确。

## CCFG-AC-030 大小写不敏感唯一性与并发竞态 — PASS

- 前置：库内起初无 `probe-001`（`preExisting=[]`）；先经真实新增页创建 `probe-001`（200）；`race-001`/`RACE-001` 均不存在。
- 动作：① 页面依次提交 `probe-001`、`Probe-001`、`PROBE-001`；② 保存无冲突混合大小写 ID；③ 绕过前端 POST `Probe-001`；④ 两个独立 socket 并发提交 `race-001`/`RACE-001`。
- 实际：① 三次均业务码 `40940`，字段错误「探针 ID 已存在冲突（不区分大小写），请更换探针 ID。」，无新增行；③ 绕过同样 `40940`；② `S3AC-C030-MiXeD` 保存成功且回读保留原大小写，`probe-001` 回读保留小写，大小写不敏感计数=1；④ 两笔均 200，最终 `race-001` 与 `RACE-001` 并存（允许），无锁等待超时；后端日志显示两线程先各自全量预检再 INSERT。
- 证据键：`results/ac030-sequential.json`、`results/concurrency.json`（`scenarios.raceIds`）、`results/backend-log-concurrency-window.txt`。
- 覆盖：顺序冲突、绕过、大小写保留、并发双成功、无锁表错误。

## CCFG-AC-033 描述 1024 字节边界 — PASS

- 动作：① 页面提交去空白后为空；⑤ 页面键入 300 个 Emoji；②③④⑥ 真实 API 提交边界载荷。
- 实际：① 字段错误「探针描述不能为空。」，`postDelta=0`，无行；⑤ 输入层截断为 256 码点 / 1024 UTF-8 字节 / 512 UTF-16 单元，代理对完整，保存 200，`LENGTHB=1024`；API 1024 ASCII 200 且逐字节相等；1025 ASCII `40102` 无行；825 码点/1025 字节中文混合 `40102` 无行；256 Emoji/1024 字节 200；257 Emoji/1028 字节 `40102` 无行；含首尾空白原文保存后逐字节相等（`storedDescEqualsRequest=true`）；回读 `FAILED_ROWS|0`。
- 证据键：`results/ac033-desc.json`（`page`、`api[]`）、`results/ac033-postcheck.txt`。
- 覆盖：页面 256 码点、后端 1024 UTF-8 字节、Trim 仅用于判空、原文持久化、无部分写入。

## CCFG-AC-038 改名不处理历史关联 — PASS

- 前置：`c-dssr1-0906-b` 为既有 Agent 合成探针，有 4 条运行态关联（同 `002-insert-master.sql`；`results/runstate-c-dssr1.txt`）。
- 动作：编辑页解除 ID 锁定 → 改为 `S3AC-C038-RENAMED` → 选择源 → 保存。
- 实际：`PUT /api/clients/c-dssr1-0906-b` 200；旧行不存在、新行存在且描述保留；运行态仍为旧 ID 下 4 行、新 ID 下 0 行，逐字段未变；ZK 子节点名列表仍为 `[zk-client-01]`（匿名化；并发窗口前观察，非 CRUD 前快照）；源行数不变。
- 证据键：`results/ac038-rename.json`、`results/ac038-postcheck.txt`。
- 覆盖：ID 修改成功、物理键迁移仅限本表、其他表/ZK 零级联。

## CCFG-AC-064 并发争抢同一数据源 — PASS

- 前置：`S3AC-S064-II`、`S3AC-S064-EE-T`、`S3AC-S064-IE-T` 三个争抢源均无持有者；两个编辑目标各自持不同且不冲突的源（`EE-A0`/`EE-B0`/`IE-A0`）。
- 动作：两个独立 `http.request` socket 在同一个 `setImmediate` 门闩后同时放行：insert×insert、edit×edit、insert×edit 各一组。
- 实际：三组均两笔 200；发送时刻差 1–5 ms，响应耗时 23–57 ms；终态每源各两行；**列表 API 返回**（`duplicateDisplay`）含 `ASSIGNED_TO_MULTIPLE_CLIENTS` 及冲突探针列表；后端日志每个线程先 `selectFullScan` + `selectSafeAll` 再 DML；源码无 `LOCK TABLE`，无锁等待超时。
- 证据键：`results/concurrency.json`（`scenarios.insertInsert/editEdit/insertEdit`、`duplicateDisplay`）、`results/pre-concurrency.json`、`results/concurrency-postcheck.txt`（原执行 13:40 留存输出，R1 补入）、`results/backend-log-concurrency-window.txt`、`results/static-checks.txt`。
- 口径：异常字段来自 API 列表响应；本轮未另行采集浏览器渲染截图，不把该返回扩大表述为已单独验证的页面渲染。
- 覆盖：双成功允许路径、写前检查、无人工锁、重复分配展示。

## CCFG-AC-075 不处理失败事件/句柄日志/ZK/统计/其他进程级联 — PASS

- 动作：完成新增、编辑、删除、启用、停用五类真实操作后观察接口与对象；R1 另做固定源码/运行 jar 字节码核对与当前只读补证。
- 源码路径：Controller 7 个端点全部委托 Service；Service 仅调用 `CdcClientConfigMapper`（`selectByKeywordAndStatus`/`selectFullScan`/`insert`/`update`/`deleteById`）与 `CdcDataSourceMapper.selectSafeAll`，只触达 `CDC_CLIENT_MULTIPLE` 与 `CDC_DATA_SOURCE`；运行 jar 字节码无 ZK/Kafka/进程/统计表/失败事件/SCN/执行计划引用。
- 003 运行证据：`association-postcheck.txt` 前缀谓词为 `S3AC%` 与 `c-dssr1-%`，**不覆盖** `probe-001`/`race-001`/`RACE-001`；该前缀范围内失败事件、句柄日志、SCN、执行计划均为 0，运行态 c-dssr1 前缀 29 行；ZK 两次 `ls` 均在主 CRUD 之后（并发窗口前后），非 CRUD 前快照，仅证明子节点名列表相同。
- R1 精确 ID 补证（2026-11-05 14:22:25）：覆盖全部 S3AC 批次、`c-dssr1-0906-a/-b`、`S3AC-C038-RENAMED`、`probe-001`、`race-001`、`RACE-001` 共 33 个客户端 ID；失败事件/句柄日志/SCN/执行计划均 0；运行态 9 行（a=5、b=4），表总数 30。
- 统计表：6 个统计对象均无 `CLIENT_ID`/`DATA_SOURCE_ID` 列，仅 `DIM_TYPE/DIM_VALUE`，无直接关联键；结果表与 WATERMARK 当前 0 行、TASK_CONFIG 1 行，未做对象级匹配或全库扫描；SCN/执行计划不替代统计表。
- 证据键：`results/association-postcheck.txt`、`results/final-checks.txt`、`results/zk-clients-before-after.txt`、`results/static-checks.txt`；R1 evidence 目录（精确 ID、元数据、字节码引用）。
- 未观测范围：「其他进程」（sync-client/sync-server 运行侧）未调用、未模拟、不可直接观测；无 CRUD 前 ZK 快照与连续内容观测。未发现直接反例，按定义判 PASS，不以“可验证范围内 PASS”替代整项判定。

## CCFG-AC-076 无物理外键/唯一索引/关联表/迁移/DDL，页面不声称实时生效 — PASS

- 原证据勘误：`results/schema-metadata-final.txt` 的 `CHECK_CONDITIONS` 分节把 LONG 列拼接，实际为 `ORA-00932` 报错，且原查询未覆盖独立唯一索引；错误输出保留为历史事实。
- 列/约束：两表 4 + 17 列；13:26 与 13:36 导出逐字节相同；仅 2 主键 + 10 个 NOT NULL 检查约束（`SEARCH_CONDITION_VC` 重取，均为 `"列" IS NOT NULL`）。
- 索引：13:25（夹具/CRUD 前）与 14:22（当前）一致，共 6 个，含独立唯一索引 `PK_CDC_DATA_SOURCE`；`IDX_CDC_DATA_SOURCE_ID_ACTIVE` 为 NONUNIQUE 复合列并支撑 `PK_CDC_DATA_SOURCE` 约束；无新增唯一索引/约束。
- 外键/触发器/关联表：前后均无外键（schema 级 0）、无触发器；相关表创建时间均为 2026-10-22 或 2026-11-04，两表 `LAST_DDL_TIME` 为 2026-10-22 16:53:22，未落在验收日。
- 迁移/DDL：`backend/` 无 Flyway/Liquibase/migration 产物；clientconfig 源码无 DDL/LOCK。
- 页面反馈：成功提示仅为「新增成功/编辑成功/删除成功/启用成功/停用成功」，无“已实时作用于 sync-client”类文案。
- 证据键：`results/schema-metadata-final.txt`（含失败查询）、`results/static-checks.txt`、`results/ac024-enable.json`、`results/ac021-delete.json`；R1 补证见 R1 evidence 目录。
- 覆盖：物理模型不变、无 DDL、页面文案边界；历史不变由真实前后导出与早于验收日的 DDL 时间支持，不仅凭当前快照。

## CCFG-AC-128 探针 ID 输入边界 — PASS

- 前置：`/config/client` 新增弹窗；库内已有 `probe-001` 供唯一性核对。
- 动作：① 真实键入 40 个合法字符；② 真实剪贴板 `Control+V` 粘贴 40 个合法字符；③ 键入/粘贴空格、中文、`@`、英文逗号、非法首字符、纯空白、空串并提交；④ 绕过前端提交非法 ID 与 33 位 ID。
- 实际：① 键入与② 粘贴均只保留 32 位；③ 输入值保持原样（如 `ab cd`、`中文ABC`、`ab@cd`、`ab,cd`、`-abc`），无静默改写，全部 `postDelta=0` 并给出字段级错误；空/纯空白提示「探针 ID 不能为空。」；④ 后端分别返回 `40101`（非法字符/33 位）与 `40100`（空），无新增行；大小写不敏感唯一性由 AC-030 的四次 `40940` 支持。
- 证据键：`results/ac128-id-input.json`、`results/ac030-sequential.json`。
- 覆盖：键入/粘贴上限、非法字符不静默改写、字段提示、后端兜底、唯一性口径不变。
