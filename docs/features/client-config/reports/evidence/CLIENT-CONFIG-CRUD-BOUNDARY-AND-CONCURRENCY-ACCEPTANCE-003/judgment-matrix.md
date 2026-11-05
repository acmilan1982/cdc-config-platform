# 判定矩阵（10 条 AC）

状态：`PASS` 表示本批可验证范围内的定义为真；证据路径均相对于本目录。

## CCFG-AC-021 删除取消/确认与物理删除、无级联 — PASS

- 前置：`c-dssr1-0906-a` 为 Agent 在 `data-source-snapshot-status` 任务中创建的合成探针（`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1/db/002-insert-master.sql`），验收前有 5 条 `CDC_DATA_SOURCE_RUN_STATE` 关联（`results/runstate-c-dssr1.txt`）。
- 动作：固定选中该行 → 打开删除菜单 → 取消；再次打开 → 确认删除。
- 实际：取消框标题/正文/按钮正确，`deleteRequests=0`，行仍在，固定选中仍为该行；确认 `DELETE /api/clients/c-dssr1-0906-a` HTTP 200，随后 `GET ?status=ALL` 重载；`post.apiRow=null`、`apiCount=77→76`；SQL 回读 `CLIENT_ROW|0`、`RUNSTATE_ROWS|5` 且 5 行逐字段未变，其他探针 76、其他源 265；ZK 仍为 `[hosp-012]`。
- 证据键：`results/ac021-delete.json`（`cancel`、`confirm.deleteResponse`、`post`）、`results/ac021-postcheck.txt`、`results/zk-clients-before-after.txt`。
- 覆盖：取消、确认、物理删除、关联零级联。删除成功后的固定选中清除属 `CCFG-AC-144` 的独立定义，本轮只观察取消保留选中。

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
- 实际：`PUT /api/clients/c-dssr1-0906-b` 200；旧行不存在、新行存在且描述保留；运行态仍为旧 ID 下 4 行、新 ID 下 0 行，逐字段未变；ZK 仍 `[hosp-012]`；源行数不变。
- 证据键：`results/ac038-rename.json`、`results/ac038-postcheck.txt`。
- 覆盖：ID 修改成功、物理键迁移仅限本表、其他表/ZK 零级联。

## CCFG-AC-064 并发争抢同一数据源 — PASS

- 前置：`S3AC-S064-II`、`S3AC-S064-EE-T`、`S3AC-S064-IE-T` 三个争抢源均无持有者；两个编辑目标各自持不同且不冲突的源（`EE-A0`/`EE-B0`/`IE-A0`）。
- 动作：两个独立 `http.request` socket 在同一个 `setImmediate` 门闩后同时放行：insert×insert、edit×edit、insert×edit 各一组。
- 实际：三组均两笔 200；发送时刻差 1–5 ms，响应耗时 23–57 ms；终态每源各两行；列表对重复分配显示 `ASSIGNED_TO_MULTIPLE_CLIENTS` 及冲突探针列表；后端日志每个线程先 `selectFullScan` + `selectSafeAll` 再 DML；源码无 `LOCK TABLE`，无锁等待超时。
- 证据键：`results/concurrency.json`（`scenarios.insertInsert/editEdit/insertEdit`、`duplicateDisplay`）、`results/pre-concurrency.json`、`results/concurrency-postcheck.txt`、`results/backend-log-concurrency-window.txt`、`results/static-checks.txt`。
- 覆盖：双成功允许路径、写前检查、无人工锁、重复分配展示。

## CCFG-AC-075 不处理失败事件/句柄日志/ZK/统计/其他进程级联 — PASS（可验证范围）

- 动作：完成新增、编辑、删除、启用、停用五类真实操作后观察接口与对象。
- 实际：`CDC_JOB_FAILURE_EVENT`、`CDC_JOB_FAILURE_HANDLE_LOG`、`CDC_DATA_SOURCE_SCN`、`CDC_EXECUTION_PLAN` 对 `S3AC%`、`c-dssr1-%`、`PROBE-001`、`RACE-001` 计数均为 0；`CDC_DATA_SOURCE_RUN_STATE` 仅保留既有 `c-dssr1` 29 行（删除/改名未级联）；ZK 两次均为 `[hosp-012]`；clientconfig 源码无失败事件/句柄日志/ZK/Kafka/统计表/进程调用路径。
- 证据键：`results/association-postcheck.txt`、`results/final-checks.txt`、`results/zk-clients-before-after.txt`、`results/static-checks.txt`。
- 边界：「其他进程」的运行侧不可直接观测；结论基于“源码无调用路径 + 可观察 DB/ZK 零变化”，不声称已模拟或调用运行侧。

## CCFG-AC-076 无物理外键/唯一索引/关联表/迁移/DDL，页面不声称实时生效 — PASS

- 实际：验收前后 Oracle 元数据逐字节一致（两表列定义、约束名与类型不变；仅主键 P 与 NOT NULL C，无 FK，无新增唯一索引/关联表）；`backend/` 无 Flyway/Liquibase/migration 产物；clientconfig 源码无 DDL/LOCK 语句；页面成功反馈仅为「新增成功/编辑成功/删除成功/启用成功/停用成功」，无“已实时作用于 sync-client”类文案。
- 证据键：`results/schema-metadata-final.txt`、`results/static-checks.txt`、`results/ac024-enable.json`、`results/ac021-delete.json`。
- 覆盖：物理模型不变、无 DDL、页面文案边界。

## CCFG-AC-128 探针 ID 输入边界 — PASS

- 前置：`/config/client` 新增弹窗；库内已有 `probe-001` 供唯一性核对。
- 动作：① 真实键入 40 个合法字符；② 真实剪贴板 `Control+V` 粘贴 40 个合法字符；③ 键入/粘贴空格、中文、`@`、英文逗号、非法首字符、纯空白、空串并提交；④ 绕过前端提交非法 ID 与 33 位 ID。
- 实际：① 键入与② 粘贴均只保留 32 位；③ 输入值保持原样（如 `ab cd`、`中文ABC`、`ab@cd`、`ab,cd`、`-abc`），无静默改写，全部 `postDelta=0` 并给出字段级错误；空/纯空白提示「探针 ID 不能为空。」；④ 后端分别返回 `40101`（非法字符/33 位）与 `40100`（空），无新增行；大小写不敏感唯一性由 AC-030 的四次 `40940` 支持。
- 证据键：`results/ac128-id-input.json`、`results/ac030-sequential.json`。
- 覆盖：键入/粘贴上限、非法字符不静默改写、字段提示、后端兜底、唯一性口径不变。
