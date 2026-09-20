# 07 — DS-AC-175 `影响行数 ≠ 1 → 50002 + 回滚` 分支证据（证据层级明示）

任务编号：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
覆盖用例：`DS-AC-175`
判定依据：任务提示词 §9.4 明确授权——“`DS-AC-175` 的 `影响行数≠1` 分支若无法在不改代码、不碰既有数据的真实 HTTP 环境中确定性构造，可使用已存在的定向自动化测试与实现路径审计作为补充证据；必须说明证据层级，不得制造不安全竞态或修改实现以让验收通过。”

---

## 1. 判定标准（ACCEPTANCE.md §4.17 正文，逐字）

> 返回 `50002`（`STATUS_FAILED`）；事务**回滚**，记录 `FG_ACTIVE` 保持原值，**不留下**中间状态；错误信息可展示且不泄露堆栈。

---

## 2. 为什么不能取得端到端真实 HTTP 证据（前置说明）

该分支要求「`SELECT` 观察到原状态」与「带原状态条件的 `UPDATE`」之间，记录被第三方改写，使条件 `UPDATE` 影响行数为 0。要**确定性**复现这一交错，只能：

- 在该窗口内注入人为停顿（= 修改实现代码）；或
- 用高并发盲打制造不安全竞态；或
- 直接对既有记录做写操作。

三者分别违反「不改代码」「不制造不安全竞态」「不碰既有数据」。因此本用例按 §9.4 走补充证据路径。

**真实 HTTP + 真实数据库的旁证（`DS-AC-174` 并发实测）**：对任务自建记录 `FACC001-CONC-1` 并发发起状态相反的 `enable` + `disable`，共 4 轮，全部返回 `200 / success`，未出现 `50002`；最终状态收敛到单一目标值。原因是本实现的「先读后带条件写」在两次请求间未出现交错窗口——**这不构成 175 的反例**，只说明真实环境中该窗口极窄且不可确定性命中。原始证据：`runtime-logs/.../phaseB-case-h.log`（1 轮）、`phaseB-case-h2-174-repeat.log`（3 轮）。

---

## 3. 补充证据层 A：服务层定向自动化测试（真实运行、通过）

测试类：`backend/src/test/java/com/bsoft/cdcconfig/datasource/service/DataSourceServiceTest.java`
证据文件：`backend/target/surefire-reports/TEST-com.bsoft.cdcconfig.datasource.service.DataSourceServiceTest.xml`
运行日志：`runtime-logs/.../backend-targeted.log:62` — `Tests run: 59, Failures: 0, Errors: 0, Skipped: 0`

| 测试方法 | 源码行 | 构造 | 断言 |
|---|---|---|---|
| `enable_conditionalUpdateZeroRows_shouldThrow50002` | `DataSourceServiceTest.java:632` | 记录原始状态 `'0'`；`selectOne` 返回该记录；`update(…)` 返回 **0** | 抛出 `BusinessException`，`getCode() == STATUS_FAILED`(50002) |
| `disable_conditionalUpdateZeroRows_shouldThrow50002` | `DataSourceServiceTest.java:703` | 记录原始状态 `'1'`；`selectOne` 返回该记录；`update(…)` 返回 **0** | 抛出 `BusinessException`，`getCode() == STATUS_FAILED`(50002) |

surefire XML 中两条 `testcase` 均为自闭合（无 `<failure>`/`<error>`），即通过：

```xml
<testcase name="enable_conditionalUpdateZeroRows_shouldThrow50002" classname="com.bsoft.cdcconfig.datasource.service.DataSourceServiceTest" time="0.002"/>
<testcase name="disable_conditionalUpdateZeroRows_shouldThrow50002" classname="com.bsoft.cdcconfig.datasource.service.DataSourceServiceTest" time="0.002"/>
```

**证据层标注：Mockito 单元测试（模拟 Mapper），非真实 HTTP、非真实数据库。**

---

## 4. 补充证据层 B：控制器层 MockMvc 测试（Spring MVC 真实分发，Service 打桩）

测试类：`backend/src/test/java/com/bsoft/cdcconfig/datasource/controller/DataSourceControllerTest.java`
证据文件：`backend/target/surefire-reports/TEST-com.bsoft.cdcconfig.datasource.controller.DataSourceControllerTest.xml`
运行日志：`runtime-logs/.../backend-targeted.log:112` — `Tests run: 37, Failures: 0, Errors: 0, Skipped: 0`

| 测试方法 | 源码行 | 断言 |
|---|---|---|
| `disable_statusConflict_shouldReturn50002` | `DataSourceControllerTest.java:321` | `PUT /api/data-sources/DS001/disable` → HTTP 200，`$.code == 50002`，`$.data.success` 不存在 |

**证据层标注：MockMvc 真实走 Spring MVC 分发与 `GlobalExceptionHandler`，但 Service 为 Mockito 打桩；非真实数据库。**
该层证明「50002 在 HTTP 契约上被如实返回给前端」，且响应体只有 `code`+`message`。

---

## 5. 补充证据层 C：实现路径审计（源码逐行核对）

`backend/src/main/java/com/bsoft/cdcconfig/datasource/service/impl/DataSourceServiceImpl.java`

```java
190    @Override
191    @Transactional(rollbackFor = Exception.class)
192    public void enable(String dataSourceId) {
193        String id = trim(dataSourceId);
194        String observedStatus = readRawStatus(id);
195        if ("1".equals(observedStatus)) { return; }        // 幂等：不执行 DML
198        if (!"0".equals(observedStatus)) { throw DataSourceErrorCode.statusInvalid(); }  // 40250
201        updateStatusConditionally(id, observedStatus, "1");
202    }

204    @Override
205    @Transactional(rollbackFor = Exception.class)
206    public void disable(String dataSourceId) {
207        String id = trim(dataSourceId);
208        String observedStatus = readRawStatus(id);
209        if ("0".equals(observedStatus)) { return; }        // 幂等：不执行 DML
213        updateStatusConditionally(id, observedStatus, "0");// '1' 与异常值(含 NULL)均归一化
214    }

227    /** 带原状态条件的单条 UPDATE；影响行数不为 1 抛 50002 回滚。 */
228    private void updateStatusConditionally(String dataSourceId, String observedStatus, String targetStatus) {
229        LambdaUpdateWrapper<DataSource> wrapper = new LambdaUpdateWrapper<>();
230        wrapper.eq(DataSource::getDataSourceId, dataSourceId);
231        if (observedStatus == null) {
232            wrapper.isNull(DataSource::getFgActive);
233        } else {
234            wrapper.eq(DataSource::getFgActive, observedStatus);
235        }
236        wrapper.set(DataSource::getFgActive, targetStatus);
237        int rows = dataSourceMapper.update(null, wrapper);
238        if (rows != 1) {
239            throw DataSourceErrorCode.statusFailed();     // 50002
240        }
241        log.info("Updated data source status: {} [{}] -> {}", dataSourceId, observedStatus, targetStatus);
242    }
```

逐条对应判定标准：

| 判定要求 | 实现依据 | 结论 |
|---|---|---|
| 返回 `50002`（`STATUS_FAILED`） | L238-239 `rows != 1 → throw statusFailed()`；`DataSourceErrorCode.STATUS_FAILED = 50002` | 满足 |
| 事务**回滚** | L191 / L205 方法级 `@Transactional(rollbackFor = Exception.class)`；抛异常触发回滚 | 满足 |
| 记录 `FG_ACTIVE` 保持原值、不留下中间状态 | `UPDATE` 为**单条语句**、带原状态条件（L230/L234/L232）；`rows != 1` 时该语句影响 0 行且事务被标记回滚，不存在“部分更新”路径 | 满足 |
| 错误信息可展示且不泄露堆栈 | `DataSourceErrorCode.statusFailed()` 返回固定业务文案；`GlobalExceptionHandler.handleBusinessException` 仅返回 `ApiResponse.fail(code, message)`，堆栈不进入响应体 | 满足（另见证据文件 `06-ds-ac-169-181-runtime-api-log-audit.md` §3.4） |

补充事实：`FG_ACTIVE` 为 `CDC_DATA_SOURCE` 主键之外的单列条件写；`rows` 在真实表上只能是 0 或 1，故该分支的成立条件就是「竞争改写导致条件不再命中」⇒ `rows == 0`。

---

## 6. 未做的事（边界声明）

- 未修改任何实现、测试、配置或 SQL；
- 未对既有记录做任何写操作；
- 未为制造该分支而注入停顿或制造不安全竞态；
- 未把本用例判为 `FAIL/BLOCKED/NOT_RUN`——§9.4 已明确上述补充证据层级即为本用例的可接受证据。

---

## 7. DS-AC-175 判定

**PASS（证据层级：Mockito 单元测试 + MockMvc 控制器测试 + 实现路径审计；非端到端真实 HTTP/真实数据库）**

- `影响行数 ≠ 1` → 抛 `STATUS_FAILED`(50002)：层 A、层 C 直接证明，层 B 证明 HTTP 契约返回 50002；
- 事务回滚、不留下中间状态：层 C 的 `@Transactional(rollbackFor = Exception.class)` + 单条条件 `UPDATE` 结构证明；
- 错误信息可展示且不泄露堆栈：层 B（响应体仅 code+message）+ 源码审计。
