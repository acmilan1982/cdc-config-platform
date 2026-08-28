# 中心端配置 只读联调与视觉验收交接报告

## 1. 任务元数据

- `task_id`: `SERVER-CONFIG-READONLY-INTEGRATION-VISUAL-001`
- Feature：`server-config`（中心端配置）
- 目标分支：`develop`
- 唯一授权基线：`24d8b80340cc691895bed8bc45a4cb2dc2c6b9b6`
- 任务性质：启动真实前后端、只读数据库/API 联调、页面视觉验收准备与交接
- 执行时间：2026-08-28
- 建议提交信息：`docs(server-config): record readonly integration handoff`

## 2. 权限边界

本任务为只读联调任务，全程遵守以下边界：

| 项 | 允许状态 | 实际执行 |
|---|---|---|
| 数据库访问 | `READ_ONLY`（仅 SELECT / GET） | 未执行任何写语句 |
| 数据库写入 | `NONE` | 0 条写语句 |
| DDL | `NONE` | 0 条 |
| ZooKeeper 访问 | `NONE` | 未连接 |
| `sync-server` 操作 | `NONE` | 未启动/停止/重启 |
| `POST /api/server-config/save` | `NONE` | 0 次调用 |
| 保存按钮/确认保存 | `NONE` | 未点击确认保存 |
| 业务代码/测试/配置/文档/基线修改 | `NONE` | 仅新增本报告 |

本任务只调用 `GET /api/server-config` 只读接口；在浏览器中仅进行不产生保存请求的临时交互（修改控件后点击“撤销修改”），全程未产生任何写库或保存请求。

## 3. Git 开始状态

- 当前分支：`develop`
- 任务开始前 HEAD：`24d8b80340cc691895bed8bc45a4cb2dc2c6b9b6`
- 与 `origin/develop` 对比：ahead `0`，behind `0`
- 任务开始前既有未提交条目数：114 条（全部保持原样，未清理、未覆盖、未暂存、未提交）
- 本任务仅新增本报告文件，不修改任何其他仓库文件

## 4. 环境预检

| 项 | 结果 |
|---|---|
| JDK | `1.8.0_202`，`JAVA_HOME=/usr/java/latest` |
| Maven | `Apache Maven 3.8.8`，来自 `/usr/local/maven` |
| Node.js | `v24.17.0` |
| npm | `11.13.0` |
| SQL\*Plus | 来自 `/opt/oracle/instantclient`（预检通过，本任务未直接连库） |

数据库连接复用项目既有 `backend/src/main/resources/application-dev.yml` 配置连接开发 Oracle 19c 库；本报告不复制数据库密码、完整 JDBC 凭据或完整服务环境变量。

## 5. 服务启动与运行交接

### 5.1 启动命令

后端（Spring Boot，端口 8080）：

```bash
cd /agent/cdc-config-platform/backend
nohup java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar > /tmp/cdc-server-config-backend.log 2>&1 &
```

前端（Vite dev，端口 5173）：

```bash
cd /agent/cdc-config-platform/frontend
nohup npm run dev > /tmp/cdc-server-config-frontend.log 2>&1 &
```

浏览器自动化（CDP headless Chrome，端口 9222，本任务用于只读交互验证与截图）：

```bash
nohup google-chrome --headless=new --no-sandbox --disable-gpu --no-proxy-server \
  --remote-debugging-port=9222 --user-data-dir=/tmp/sc-chrome-profile \
  --window-size=1920,1080 about:blank > /tmp/sc-chrome-cdp.log 2>&1 &
```

### 5.2 运行状态

| 服务 | PID（wrapper / 实际进程） | 监听 | 状态 |
|---|---|---|---|
| 后端 Spring Boot | 6560 / 6562（java） | `*:8080` | 运行中 |
| 前端 Vite | 6613 / 6626（vite） | `0.0.0.0:5173` | 运行中 |
| CDP headless Chrome | 8046 / 8049 | `127.0.0.1:9222` | 运行中 |

### 5.3 访问 URL

- 页面验收入口（用户可直接打开）：`http://192.168.174.70:5173/config/server`
- 前端首页：`http://192.168.174.70:5173/`
- 后端健康/API：`http://192.168.174.70:8080/api/server-config`

### 5.4 日志路径

- 后端：`/tmp/cdc-server-config-backend.log`
- 前端：`/tmp/cdc-server-config-frontend.log`
- CDP Chrome：`/tmp/sc-chrome-cdp.log`

### 5.5 停止命令

```bash
# 后端
kill 6562                      # 或 kill $(cat /tmp/cdc-server-config-backend.pid)
# 前端
kill 6613 6626                 # wrapper 与 vite 主进程
# CDP Chrome
kill 8046 8049
```

## 6. 只读 GET 接口联调结果

调用：`GET /api/server-config`（HTTP 200，耗时约 0.02s）

统一响应摘要：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "serverId": "Server001",
    "configCount": 8,
    "items": [ ... 8 条 ... ]
  }
}
```

逐项验证：

1. HTTP 状态 `200`，统一响应 `code=200`，`message=success`。
2. 当前开发库识别唯一中心端：`Server001`，共 1 个中心端，符合已批准数据库快照。
3. 配置项数 `configCount=8`，`configCount == items.length` 成立。
4. 排序符合 `CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC`；后端日志可见对应 SQL。
5. 每条主键 `idServerConfig` 保持字符串：`004/005/007/002/008/006/003/001`，未被转为数字。
6. `editable` 为计算结果；响应字段仅 `configDesc/configKey/configValue/editable/idServerConfig`，不包含原始 `IS_EDITABLE`（grep 未命中）。
7. 可编辑/只读分布：6 条可编辑、2 条只读，与已批准快照（6 个 `'1'`、2 个 `'0'`）一致。
8. null 字段由 Jackson `non_null` 省略时，前端仍可正常展示（页面渲染无异常，见 §7）。
9. 本报告未复制任何数据库密码、连接串凭据或完整服务环境变量。

实际配置清单（value 为当前开发库真实值）：

| id | configKey | configValue | editable |
|---|---|---|---|
| 004 | auto-create-table | true | 可编辑 |
| 005 | auto-expand-column-length | false | 可编辑 |
| 007 | monitor-metric-topic-name | cdc.sync.monitor.metrics.v1 | 只读 |
| 002 | raw-message-storage-strategy | PLAIN | 可编辑 |
| 008 | realtime-insert-batch-enabled-database-types | doris,oracle | 可编辑 |
| 006 | server-log-topic-name | cdc.sync.server.logs.v1 | 只读 |
| 003 | snapshotBatchSize | 500 | 可编辑 |
| 001 | tableRowDeleteStrategy | DELETE | 可编辑 |

## 7. 页面联调与视觉检查结果

页面入口：菜单“配置管理 → 中心端配置”，或直接访问 `http://192.168.174.70:5173/config/server`。

### 7.1 逐项必查结果

| # | 检查项 | 结果 |
|---|---|---|
| 1 | 菜单与面包屑/路由标题显示“中心端配置”，不再显示“服务端配置” | PASS |
| 2 | 页面加载成功，显示中心端 ID（Server001）与配置总数（8） | PASS |
| 3 | 主体为一个卡片和恰好两列表格：`配置项说明`、`配置值` | PASS |
| 4 | 不显示独立 CONFIG_KEY 列，不显示 IS_EDITABLE 或“是否可编辑”状态列 | PASS |
| 5 | 配置项说明为主宽列，长说明可读，未严重挤压配置值区域 | PASS |
| 6 | 配置值列约 360px、收缩下限约 300px，控件宽度一致 | PASS（视觉未发现宽度异常） |
| 7 | 有 Key 时说明旁信息图标 Tooltip 可显示英文技术 Key | PASS（10 处信息图标渲染） |
| 8 | 显示名称按 说明 → Key → “未定义配置项” 兜底 | PASS |
| 9 | 6 条可编辑配置显示正确专门控件（布尔下拉、枚举下拉、数据库类型多选、数字输入） | PASS |
| 10 | 2 条只读配置只展示值，不出现编辑控件 | PASS |
| 11 | 页面不展示新增、删除、搜索、筛选、分页、刷新或 Key/说明编辑入口 | PASS |
| 12 | 操作区位于表格下方右侧、非 sticky；初始“保存全部”和“撤销修改”禁用 | PASS |
| 13 | 临时改控件 → 出现未保存提示、按钮按设计变化 → 只点击“撤销修改” → 恢复原始显示；全程无 POST | PASS（详见 §8） |
| 14 | 不出现 `undefined.trim()` 或其他控制台运行时异常 | PASS（前端日志无 error/异常） |

### 7.2 分辨率检查

本任务具备浏览器自动化能力，通过 CDP headless Chrome 实测：

| 分辨率 | 横向溢出 | scrollWidth/clientWidth | 按钮初始态 | 未保存提示 |
|---|---|---|---|---|
| 1920×1080（主基准） | 无 | 1920 / 1920 | 撤销修改/保存全部 均禁用 | 无 |
| 1366×768（最小支持宽度） | 无 | 1366 / 1366 | 撤销修改/保存全部 均禁用 | 无 |

未发现横向溢出、说明被过度截断、操作区遮挡或表格/卡片宽度异常。

截图（仅本任务临时证据，未提交仓库）：

- `/tmp/sc-server-config-1920x1080.png`
- `/tmp/sc-server-config-1366x768.png`

## 8. 未调用 POST 保存接口的证明

验证方式：CDP 真实浏览器交互 + 后端日志审计 + 数据库值前后对比。

1. 通过 CDP 在页面中定位唯一整数输入框（`snapshotBatchSize`，当前值 `500`），使用原生 setter 改为 `999` 并派发 `input` 事件：
   - 出现“存在未保存的修改”提示；
   - “撤销修改”“保存全部”由禁用变为启用。
2. 随后只点击“撤销修改”按钮：
   - “存在未保存的修改”提示消失；
   - 两个按钮恢复禁用；
   - 整数输入框展示值恢复为 `500`。
3. 后端日志审计（`/tmp/cdc-server-config-backend.log`）：
   - `UPDATE CDC_SERVER_CONFIG` 出现次数：**0**
   - `INSERT INTO / MERGE INTO CDC_SERVER_CONFIG` 出现次数：**0**
   - `POST /api/server-config/save` 请求数：**0**
   - 日志仅出现只读 `SELECT`（含 `ORDER BY CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC`，Total 8）。
4. 数据库值前后对比：交互验证前后再次 `GET /api/server-config`，`snapshotBatchSize` 仍为 `500`，未被改写。

结论：整个交互过程为纯前端编辑状态变化与撤销，未产生任何保存请求或数据库写入。

## 9. 验收状态边界

- 已将实际完成的只读 API 联调、服务启动、页面渲染与不保存交互检查记录为 `PASS`。
- 以下用例保持 `NOT_RUN_REQUIRES_WRITE_AUTHORIZATION`，需要后续获得写授权后才能执行：
  - 保存全部/批量保存请求（POST /api/server-config/save）及其成功回显；
  - 保存事务提交与回滚；
  - 各错误码真实触发（参数缺失、重复保存、并发等）与异常分支；
  - 数据库写入结果验证（`CONFIG_VALUE` 更新）；
  - 重启后端后保存值生效验证；
  - 构造异常/边界数据库数据（如空配置集、空 ConfigKey、多中心端）需要单独授权。
- 65 条正式验收用例未整体执行，全部保持 `NOT_RUN`；本任务不修改 `ACCEPTANCE.md` 中任何用例状态。
- 用户主观视觉确认在用户明确反馈前保持 `PENDING_USER_VISUAL_REVIEW`。

## 10. 待用户视觉验收清单

请用户在浏览器打开 `http://192.168.174.70:5173/config/server` 后确认：

1. 面包屑/标题显示“中心端配置”，无“服务端配置”残留。
2. 页面显示中心端 ID `Server001`、配置项总数 `8`。
3. 表格为两列（`配置项说明` / `配置值`），说明列为主宽列，无独立 Key 列与可编辑状态列。
4. 6 条可编辑配置控件形态正确（布尔下拉、枚举下拉、数据库类型多选、数字输入）；2 条只读配置仅展示值。
5. 说明旁信息图标 Tooltip 可显示英文技术 Key。
6. 操作区位于表格下方右侧、非 sticky；初始“保存全部”“撤销修改”均为禁用。
7. 临时改动任一控件 → 出现未保存提示、按钮变为可用；点击“撤销修改”→ 恢复原值、提示消失、按钮恢复禁用。
8. 在 1920×1080 与 1366×768 下无横向溢出、说明无过度截断、操作区无遮挡。

> 提示：撤销修改只会清空前端编辑状态，不会发起任何保存请求；本任务全程未调用保存接口。

## 11. 下一步

1. 用户对本报告 §10 清单反馈视觉验收结果（可通过截图或文字）。
2. 用户视觉验收通过后，由 ChatGPT 决定是否授权受控写入验收（保存/回滚/错误码/重启生效等用例）。
3. 获得明确写授权前，本 Agent 不执行任何保存接口调用或数据库写入。

---

**总体状态：`READONLY_INTEGRATION_READY_FOR_USER_VISUAL_REVIEW`**
