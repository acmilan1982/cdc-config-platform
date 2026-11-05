# 证据索引

- 任务：`CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002`
- 执行日期：2026-11-04
- 分支：`develop`
- 起始提交：`242cc5cf878216ef6e020effc539ee742c87a35c`
- 执行报告：`../../CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002.md`

本目录保留本批 24 条验收的真实执行证据。探针连接本机真实前端/后端（真实 Oracle 开发库），页面与接口行为来自真实运行。例外仅为已标注的受控响应：AC-055 的“候选空池”“候选加载失败”由路由 fulfill/abort 注入（用于观察前端分支，不等同于真实空库故障），AC-133 有一次只读观察。除此之外未使用 mock 数据。直接 DML 仅用于合成夹具与后置读取，不替代被测页面/API 行为。

## 文件

| 文件 | 用途 |
|---|---|
| `environment-and-versions.md` | 环境预检、服务 PID/端口、产物 SHA256、验证边界 |
| `samples-and-final-state.md` | 授权、合成样本、数据变更、既有数据源保护、终态统计 |
| `ac-matrix.md` | 逐 AC 覆盖矩阵、旧证据真实键、本批真实键与统计 |
| `sql/fixture-prepare.sql` | 第一批合成夹具 DML（102 源 + 22 探针） |
| `sql/fixture-prepare-extra.sql` | 补充合成夹具 DML（62 源 + 7 探针） |
| `sql/final-state.sql` | 终态读取（仅 SELECT） |
| `sql/verification-ac014-ac015.sql` | AC-014/015 持久化核对（仅 SELECT） |
| `probes/probe-lib.cjs` | 探针公共库（页面打开、行定位、API 基址） |
| `probes/probe-group-a.cjs` / `results/group-a-results.json` | AC-012/013/014/015 标签、Tooltip、序列化 |
| `probes/probe-group-a-delay.cjs` / `results/group-a-delay-results.json` | AC-012 Tooltip 延迟与单实例 |
| `probes/probe-group-b.cjs` / `results/group-b-results.json` | AC-098/099/106 双视口数量、`+N`、完整清单 |
| `probes/probe-group-c.cjs` / `results/group-c-results.json` | AC-042/044/046/048 自动生成 |
| `probes/probe-group-c2.cjs` / `results/group-c2-results.json` | AC-132 未选数据源隔离 |
| `probes/probe-group-d.cjs` / `results/group-d-results.json` | AC-034/055/056/057/059/063/068/112 |
| `probes/probe-group-e.cjs`、`probe-group-e2.cjs` / `results/group-e*.json` | AC-133 打开/关闭/保存 |
| `probes/probe-group-supp.cjs` / `results/group-supp-results.json` | AC-012/015/044/048/055/098/112 补充 |
| `probes/probe-group-supp2.cjs` / `results/group-supp2-results.json` | 红/中性标签像素与选项高度补充 |
| `probes/probe-supplements.cjs` / `results/group-supp3-supplements.json` | 规范化重复拒绝、1920 行级歧义、trim-empty 分支补充 |
| `probes/probe-final-read.cjs` / `results/final-read-results.json` | 终态 1440/1920 只读复核 |
| `samples/synthetic-source-ids.txt` | 164 条合成数据源 ID |
| `samples/synthetic-sources.csv`、`synthetic-clients.csv` | 合成源/探针字段快照；R0 采集时点 2026-11-04 14:07，仅合成值，脱敏后补入 |
| `results/final-state.txt` | 终态行列、列结构与计数 |
| `results/sql-verification-ac014-ac015.txt` | AC-014/015 SQL 核对输出 |
| `SHA256SUMS` | 本目录文件校验和 |

R1 定向补证（AC-034、AC-057）使用独立目录 `../CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1/`，其中含修正版探针、依赖校验和现行执行顺序。历史探针文件保持 R0 原始字节，不在此目录改写。

## 复现

1. 按 `environment-and-versions.md` 复用后端（`:8080`）与前端（`:5173`）。
2. `sql/fixture-prepare.sql`、`sql/fixture-prepare-extra.sql` 是合并后的可重放记录，不是可在任意当前库上无条件执行的“创建前脚本”：其中 `S2AC-P14`、`S2AC-PAUTO`、`S2AC-PCAP`、`S2AC-PK40`、`S2AC-P07` 等探针行当时由真实业务 API 创建，脚本只是保留等价 INSERT；在已含这些对象或已有占用关系的库上直接执行会因主键已存在而失败。
3. 如需复跑历史探针，应在能重现 R0 前态的独立库上先准备合成源、再按 R0 当时的 API/页面路径创建探针行；不能把合并 SQL 当作先于 API 操作的前置夹具。R1 两项的现行可执行顺序见 R1 目录 README。
4. 历史探针文件（本目录 `probes/`）存在 `require('./lib.cjs')` 与实际提交文件名 `probe-lib.cjs` 不一致的依赖错误；未执行的修正版副本仅提供于 R1 目录，运行前应以该副本为准。导入检查只做静态语法/依赖核对，不加载有业务副作用的探针。
5. 注入仅限 AC-055 的候选空池/加载失败与 AC-133 的只读观察；均为标注注入，未伪装为真实故障。

探针依赖既有 Playwright Core 与 Chromium；脚本头注释包含可执行路径与启动方式。

## 数据与脱敏

- 未保存凭据；数据库连接仅取自既有环境配置。
- 未保存既有真实源 ID/机构名称的原始响应全文与全屏截图；既有数据源只以汇总统计（37 条、0 变化）呈现。
- 本批生成的纯合成 ID/文本（`S2AC-*`、`C01/C02/S2AM` 等）按授权保留在证据与数据库中。

## 边界

- 批次 24 条通过不等于 157 条整体验收通过，也不等于 Feature 正式接受或页面迁移授权。
- 保留样本未清理，未执行恢复动作，因此不报告 `RESTORED`。
- 报告与证据不预填自身提交 SHA，不预宣布远程复审通过。
