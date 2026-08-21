# 日志查询后端实现报告

- 任务编号：`LOG-QUERY-BACKEND-IMPLEMENTATION-001`
- 任务类型：后端业务代码实现、逻辑 SQL、自动化测试、实现报告、精确提交与普通推送
- 分支：`develop`
- 授权基线提交：`c9e5b28d16b9958b724d86891124b151080cbbaf`
- 报告时间：2026-08-21

---

## 1. 任务结论

依据五份已批准基线（`docs/features/log-query/REQUIREMENTS.md`、`API.md`、`DESIGN.md`、`UI.md`、`ACCEPTANCE.md`），日志查询后端已实现完成，包含四个 HTTP API、列表 SQL 与游标分页、数据源一次全表读取与名称映射、大字段隔离、25 秒语句超时、批准错误码映射、游标签名密钥外部配置绑定及 124 个本任务相关自动化测试。

- 本任务相关自动化测试：**124/124 通过**
- 后端完整测试：564 个，其中 3 个失败 + 1 个错误，**全部 4 个为任务开始前已可复现的既有失败**（依赖开发库实时数据），与本任务无关，详见 §8、§11。
- 后端编译/打包：`mvn clean package -DskipTests` **BUILD SUCCESS**。
- 提交与推送：创建一次精确普通提交并推送到 `origin/develop`，验证本地 `HEAD == origin/develop`，ahead/behind `0 0`。
- 后端实现状态：**IMPLEMENTED_ACCEPTED**（初版、R1、R1.1、R1.2 已通过 ChatGPT 复审，见 §18）。
- 功能整体状态：**IN_PROGRESS**；前端：**NOT_STARTED**；整体验收：**NOT_RUN**。
- 菜单继续保持隐藏；最终物理分区/索引设计与性能验收继续延期。

本任务只代表日志查询功能的后端阶段实现，不代表整个功能已实现、已验收或可开放菜单。

## 2. Git 开始状态与基线

任务开始前记录并核验：

| 项目 | 值 |
|---|---|
| 当前分支 | `develop` |
| 本地 HEAD | `c9e5b28d16b9958b724d86891124b151080cbbaf` |
| 远程 `origin/develop` | `c9e5b28d16b9958b724d86891124b151080cbbaf` |
| ahead/behind | `0 0` |
| 暂存区 | 空 |
| `git status --short` | 保存完整开始快照；存在大量任务前既有已修改与未跟踪内容，均原样保留，未清理、未覆盖、未暂存、未提交 |

核验命令：

```bash
git branch --show-current
git rev-parse HEAD
git status --short
git diff --cached --name-only
git fetch origin develop
git rev-parse origin/develop
git rev-list --left-right --count HEAD...origin/develop
```

任务结束核验见 §13。

## 3. 仓库现状盘点和复用点

按 §4 仓库适配原则，盘点现有后端结构后复用：

- **统一响应体**：复用 `com.bsoft.cdcconfig.common.api.ApiResponse<T>`（int code + String message + T data + timestamp），新接口不另建响应包装。
- **全局异常与业务错误码**：复用 `GlobalExceptionHandler` 将 `BusinessException` 映射为 HTTP 200 + 业务码 `fail(code,message)`；本任务新增专用 `LogQueryExceptionHandler`（`@RestControllerAdvice`，`@Order(Ordered.HIGHEST_PRECEDENCE)`）将路径 `cdcLogId` 参数格式错误 `LogQueryBadRequestException` 映射为 HTTP 400，与 `GlobalExceptionHandler` 兜底 `Exception` 处理器正确区分（详见 §5 实现摘要）。
- **MyBatis Mapper/XML 组织方式**：Mapper 接口 + `src/main/resources/mapper/<module>/<Name>Mapper.xml`，`namespace` 指向接口全限定名，`resultType` 指向行对象。
- **VO/DTO/枚举**：按仓库分层放入 `controller/service/mapper/enums/vo/dto/exception/config/cursor`。
- **Jackson 全局配置**：`yyyy-MM-dd HH:mm:ss`、时区 GMT+8、`non_null`、未知字段忽略，均为项目既有约定。
- **错误码常量风格**：复用仓库 `BusinessException` 静态工厂与常量定义风格，`LogQueryErrorCode` 定义 40010~40017、40410、50020~50021。
- **Oracle/MyBatis 语句超时**：使用 MyBatis XML `timeout="25"` 可靠配置语句超时。
- **CDC_LOG_ID 既有先例**：大屏 `SafeUpperIdProvider` / `LogBatchReader` 已按 `CDC_LOG_ID` 只读读取；本任务不引入新依赖，全部复用 JDK 8 + Spring Boot 2.7 + MyBatis-Plus + ojdbc8 既有栈。

未引入任何新第三方依赖。

## 4. 实际新增/修改文件及用途

### 4.1 新增主源码（`backend/src/main/java/com/bsoft/cdcconfig/logquery/`）

| 文件 | 用途 |
|---|---|
| `enums/LogTypeEnum.java` | 封闭枚举：`ERROR("error","CDC_LOG_ERROR")`、`CORRECT("correct","CDC_LOG_CORRECT")`，唯一提供 `${tableName}` 固定表名 |
| `dto/LogListQuery.java` | 列表请求 DTO：logType、sourceDataSourceIds、sourceTableName、targetDataSourceIds、targetTableName、startTime、endTime、cursor；**无 pageSize/pageNo/page/total** |
| `vo/DataSourceOptionVO.java` | 数据源候选项：id、org |
| `vo/DataSourceOptionsVO.java` | 候选项响应：sourceList、targetList |
| `vo/LogListResponse.java` | 列表响应：items、hasNext、nextCursor；**无 total/page/pageNo/pageSize** |
| `vo/LogListVO.java` | 列表行：cdcLogId(String)、offset(String) 等，时间字段为字符串 |
| `vo/LogDetailVO.java` | 详情响应：最小详情字段 + 完整 logDetail；不含 rawMessage/resultDetail |
| `vo/RawMessageVO.java` | 原始消息响应：cdcLogId、rawMessage |
| `controller/LogQueryController.java` | 4 个 HTTP API 路由、HTTP 层 logType 白名单 |
| `service/LogQueryService.java` | 服务接口 |
| `service/impl/LogQueryServiceImpl.java` | 时间/条件规范化、数据源一次读取与名称映射、游标校验、BigDecimal 转换、错误映射、结果组装 |
| `mapper/LogQueryMapper.java` | 4 个只读查询方法；`CDC_LOG_ID` 以 `BigDecimal` 数值绑定 |
| `mapper/LogListRow.java` | 列表查询行对象（CDC_LOG_ID 为 BigDecimal，LOG_DETAIL 摘要、存在性标志） |
| `mapper/LogDetailRow.java` | 详情查询行对象 |
| `mapper/RawMessageRow.java` | 原始消息查询行对象 |
| `mapper/DataSourceRow.java` | CDC_DATA_SOURCE 四列全表读取行对象 |
| `config/LogQueryProperties.java` | `@ConfigurationProperties(prefix="cdc.log-query")`，绑定外部配置 `cursor-secret` |
| `config/LogQueryConfig.java` | 提供 `@Lazy` 的 `LogCursorCodec` Bean，密钥缺失时首次使用 fail-closed |
| `cursor/LogQueryFingerprint.java` | 条件指纹：固定字段顺序规范化 JSON（数组去重排序、空数组 `[]`、空文本 `null`）+ SHA-256 |
| `cursor/LogCursorCodec.java` | 不透明签名游标编码/验签：base64url(no-pad)+HMAC-SHA256+常量时间比较+版本校验 |
| `cursor/LogCursorBoundary.java` | 游标排序边界（targetTime、cdcLogId） |
| `cursor/LogCursorInvalidException.java` | 游标非法/验签失败异常 → 40015/40016 |
| `cursor/LogCursorConditionMismatchException.java` | 游标 logType 或条件指纹不匹配异常 → 40016 |
| `exception/LogQueryErrorCode.java` | 批准错误码常量 + `BusinessException` 静态工厂 |
| `exception/LogQueryBadRequestException.java` | 参数格式错误异常 → HTTP 400 |
| `exception/LogQueryExceptionHandler.java` | `@RestControllerAdvice` 专用映射：`LogQueryBadRequestException` → HTTP 400 |

### 4.2 新增资源文件

| 文件 | 用途 |
|---|---|
| `backend/src/main/resources/mapper/logquery/LogQueryMapper.xml` | 4 条只读查询，均 `timeout="25"`；列表 101 上限、固定排序、keyset 游标谓词、绑定参数 |

### 4.3 修改的既有配置

| 文件 | 修改内容 |
|---|---|
| `backend/src/main/resources/application-dev.yml` | `cdc:` 下新增 `log-query.cursor-secret: ${CDC_LOG_QUERY_CURSOR_SECRET:}`，仅声明外部环境变量占位，不含任何真实密钥 |

### 4.4 新增测试源码（`backend/src/test/java/com/bsoft/cdcconfig/logquery/`）

| 文件 | 测试数 | 覆盖要点 |
|---|---|---|
| `service/LogQueryServiceImplTest.java` | 51 | 时间必填/顺序/半开端点/7 天公式、条件规范化与 IN 上限 100、logType 白名单、数据源一次读取无 N+1、名称降级、101/100 边界、游标错误映射、cdcLogId 十进制与 NUMBER(19,0) 范围、详情/原始消息隔离、超时 50020/通用 50021/不重试、候选项过滤排序、R1-01 严格自然日期、R1-04 候选项稳定排序 |
| `controller/LogQueryControllerTest.java` | 11 | 4 路由/方法/统一响应、pageSize 输入被忽略、非法 logType → 200+业务码、非法 cdcLogId → HTTP 400、不存在 → 200+40410、cdcLogId 字符串化 |
| `cursor/LogCursorCodecTest.java` | 28 | 编码/验签往返、base64url 无填充、篡改→非法、版本错误、logType/指纹不匹配、同密钥重启等价、不同密钥失效、空密钥 fail-fast、R1-02 游标 CDC_LOG_ID 严格校验、R1-03 验证顺序 |
| `cursor/LogQueryFingerprintTest.java` | 10 | 确定性、字段顺序、数组去重排序、空数组/空文本、UTF-8 |
| `mapper/LogQueryMapperXmlCheckTest.java` | 12 | 4 个 select、4 个 timeout="25"、无 SELECT*/LIKE/COUNT/JOIN/TO_CHAR/CAST/OFFSET 分页/DDL、大字段隔离、keyset 谓词、绑定参数、无物理设计 DDL |
| `LogQueryStaticCheckTest.java` | 7 | 源码无物理设计解耦、DTO/VO 无页容量/total 字段、无直接 JDBC、BigDecimal 绑定、无 TO_CHAR/CAST |
| `config/LogQueryConfigTest.java` | 5 | R1-05 密钥配置行为：外部属性绑定、非空可用、空白 fail-closed 无默认密钥、同值重启等价、@Lazy 下仅扫描/注入不误用、实际调用才 fail-closed |

### 4.5 新增报告文件

| 文件 | 用途 |
|---|---|
| `docs/features/log-query/reports/LOG-QUERY-BACKEND-IMPLEMENTATION-001.md` | 本报告 |

## 5. 四个 API 的实现摘要

统一响应体 `ApiResponse<T>`；路径与 JSON 中 `cdcLogId` 一律十进制字符串；时间字段 `yyyy-MM-dd HH:mm:ss`；`cdcLogId`、`offset` 为字符串。

### 5.1 `GET /api/log-query/data-source-options`

- 无参数；执行一次 `CDC_DATA_SOURCE` 四列全表只读（`DATA_SOURCE_ID`、`DATA_SOURCE_ORG`、`DATA_SOURCE_CATEGORY`、`FG_ACTIVE`）。
- 候选过滤：`FG_ACTIVE = '1'`；类别 `trim()` 后 `equalsIgnoreCase` 识别 `source`/`target`。
- 候选排序（R1-04）：主排序 `DATA_SOURCE_ORG`（NULL 放最后），同名或空名称时以 `DATA_SOURCE_ID` 升序作为稳定第二排序，保证跨请求顺序一致；名称为空 → 降级为已批准「未定义名称」（降级规则见 §6.3）。

### 5.2 `POST /api/log-query/logs/search`

- 必填 `startTime`、`endTime`；后端统一计算 `endExclusive = endTime + 1 秒`，SQL 半开区间 `TARGET_TIME >= :startTime AND TARGET_TIME < :endExclusive`。
- 校验：缺任一端 → 40010；开始晚于结束 → 40011；`endExclusive - startTime > 7×24h` → 40012（完整 7 个自然日合法，超过 1 秒即拒绝）。
- 可选条件：`sourceDataSourceIds`/`targetDataSourceIds` 精确多选（去重、上限 100、超限 → 40013）、`sourceTableName`/`targetTableName` 可选精确匹配（trim、≤64，超限 → 40017）；均用绑定参数 `IN`/`=` 组合。
- `logType` 白名单（HTTP 层 `requireLogType` 拒绝非法值 → 40014），Mapper 只接收封闭枚举固定表名。
- 数据源一次全表读取构建 ID→名称映射与 source/target 候选；所选 ID 不在候选中 → 40013；日志行 NULL ID → ID 与名称省略（前端显示 `--`）；非 NULL 无可用名称 → 已批准降级。
- 游标校验：版本/验签/边界/条件指纹，非法 → 40015/40016。
- 固定排序 `TARGET_TIME DESC, CDC_LOG_ID DESC`；`FETCH FIRST 101 ROWS ONLY`；`rows.size()>100` → hasNext=true，最多返回 100 条；第 101 条仅用于判断，不返回；有下一页时由第 100 条生成 `nextCursor`。
- 不做 COUNT、OFFSET、页码、total；不建服务端游标会话/缓存/游标表。

### 5.3 `GET /api/log-query/logs/{logType}/{cdcLogId}/detail`

- `logType` 白名单；`cdcLogId` 1~19 位十进制且在 `NUMBER(19,0)` 范围内（`parseCdcLogId` → `BigDecimal` scale=0），非法 → HTTP 400（`LogQueryBadRequestException`）。
- SQL 读取最小详情字段 + 完整 `LOG_DETAIL` + `RESULT_CODE` + `OFFSET` 等；**不读取** `RAW_MESSAGE`、`RESULT_DETAIL`；`FETCH FIRST 1 ROWS ONLY`。
- 记录不存在 → `LOG_RECORD_NOT_FOUND`（HTTP 200 + 40410），与参数非法 HTTP 400 明确区分。

### 5.4 `GET /api/log-query/logs/{logType}/{cdcLogId}/raw-message`

- 与详情一致的白名单与 `cdcLogId` 校验/映射/HTTP 400 行为。
- SQL 只读取 `CDC_LOG_ID`、`RAW_MESSAGE`；**不读取**详情字段或列表字段；`FETCH FIRST 1 ROWS ONLY`。
- 记录不存在 → 40410。

## 6. 列表 SQL、游标、数据源映射、大字段隔离、超时与错误码实现摘要

### 6.1 列表 SQL（`LogQueryMapper.xml` `selectLogList`，`timeout="25"`）

- 选择列：`CDC_LOG_ID`（BigDecimal）、四源/目标 ID 与表名、`INSTRUCTION_TYPE`、`SUBSTR(LOG_DETAIL,1,300) AS LOG_DETAIL_SUMMARY`、`CASE WHEN LENGTH(LOG_DETAIL) > 0` / `LENGTH(RAW_MESSAGE) > 0` 存在性标志、`OFFSET`、四个时间字段。
- `FROM ${tableName}`，仅来自封闭枚举 `LogTypeEnum`；所有值条件使用 `#{}` 绑定参数；无 `LIKE`、无 `COUNT`、无 JOIN、无 TO_CHAR/CAST、无隐式转换。
- keyset 谓词：`TARGET_TIME < :cursorTargetTime OR (TARGET_TIME = :cursorTargetTime AND CDC_LOG_ID < :cursorCdcLogId)`。
- 固定排序 + `FETCH FIRST 101 ROWS ONLY`。

### 6.2 游标

- 载荷 base64url 无填充（UTF-8 JSON）；HMAC-SHA256 覆盖载荷原始 base64url 文本；签名用 `MessageDigest.isEqual` 常量时间比较。
- 载荷含版本 `v=1`、`logType`、排序边界（targetTime、cdcLogId）、条件指纹（SHA-256 小写 hex）。
- 指纹基于固定字段顺序 `logType,startTime,endExclusive,sourceDataSourceIds,sourceTableName,targetDataSourceIds,targetTableName` 的规范化 JSON：秒级时间、数组去重 + 字典序排序、空数组 `[]`、空文本 `null`；再计算 SHA-256。
- 同密钥重启/重部署后旧游标可验签；密钥轮换/配置改变/版本不兼容/篡改 → 失效（错误码 40015/40016）；不承诺永久有效。

### 6.3 数据源映射

- 每个列表查询请求与每个候选项请求各自执行一次 `CDC_DATA_SOURCE` 四列全表读取，本次请求内构建映射；无跨请求缓存、无逐行查询、无 N+1；列表 SQL 不 JOIN `CDC_DATA_SOURCE`。
- 候选仅 `FG_ACTIVE='1'`；类别 trim + equalsIgnoreCase；候选排序见 §5.1（R1-04 稳定排序）。
- 名称映射降级规则（LQ-API-64 / LQ-DESIGN-81，R1-06 勘误）：
  - 原始 `DATA_SOURCE_ID` 为 NULL → ID 与名称均省略；
  - 在名称映射中找到记录且 `DATA_SOURCE_ORG` 有值 → 显示机构名称；
  - 找到记录但名称为空 → 降级为「未定义名称」；
  - 找不到记录 → 回退显示原始 ID。

### 6.4 大字段隔离

- 列表：只读 `SUBSTR(LOG_DETAIL,1,300)`；存在性判断用 `LENGTH()`（不加载完整 CLOB）；不读完整 `LOG_DETAIL`、不读完整 `RAW_MESSAGE`、不读 `RESULT_DETAIL`。
- 详情：只读最小详情字段 + 完整 `LOG_DETAIL` + `RESULT_CODE`；不读 `RAW_MESSAGE`/`RESULT_DETAIL`。
- 原始消息：只读 `RAW_MESSAGE` + `CDC_LOG_ID`。

### 6.5 超时与异常

- 4 条语句均 `timeout="25"`（25 秒数据库语句超时）；后端不自动重试。
- 错误码：40010~40017、40410、50020~50021；`LogQueryExceptionHandler`（`@Order(HIGHEST_PRECEDENCE)`）保证 `LogQueryBadRequestException` → HTTP 400 不被全局兜底 `Exception` 处理器遮蔽。
- 根因不吞、响应不泄露 SQL 拼接/密钥/堆栈/敏感内部信息；所有接口只读，无 INSERT/UPDATE/DELETE/MERGE/DDL/锁表。

### 6.6 只读元数据核验（READ_ONLY_METADATA）

依据人工授权，仅执行了一次只读数据字典查询以解除先前阻塞，未查询日志业务数据、未执行任何写操作或 DDL：

- 核验对象：`CDC_LOG_CORRECT`、`CDC_LOG_ERROR` 的 `CDC_LOG_ID` 列。
- 核验结果：两表 `CDC_LOG_ID` 均为 `NUMBER(19,0)`、`NOT NULL`、且为该表主键（与 `docs/features/log-query/REQUIREMENTS.md` LQ-PAGE-27、`API.md` LQ-API-97/98/99、`DESIGN.md` LQ-DESIGN-14/18 的记录一致）。
- 因此 Mapper 以 `BigDecimal`（scale=0）数值绑定 `CDC_LOG_ID`，禁止 `TO_CHAR`/`CAST`/隐式转换；外部 JSON 与路径一律十进制字符串。
- 本次核验不改变任何数据库状态，本任务其余部分不连接、不查询、不修改真实数据库。

## 7. 自动化测试清单及结果

命令：`cd /agent/cdc-config-platform/backend && mvn test`

| 测试类 | 通过 | 失败 | 错误 | 跳过 |
|---|---:|---:|---:|---:|
| `logquery.service.LogQueryServiceImplTest` | 51 | 0 | 0 | 0 |
| `logquery.controller.LogQueryControllerTest` | 11 | 0 | 0 | 0 |
| `logquery.cursor.LogCursorCodecTest` | 28 | 0 | 0 | 0 |
| `logquery.cursor.LogQueryFingerprintTest` | 10 | 0 | 0 | 0 |
| `logquery.mapper.LogQueryMapperXmlCheckTest` | 12 | 0 | 0 | 0 |
| `logquery.LogQueryStaticCheckTest` | 7 | 0 | 0 | 0 |
| `logquery.config.LogQueryConfigTest` | 5 | 0 | 0 | 0 |
| **logquery 合计** | **124** | **0** | **0** | **0** |

覆盖 §12 的 23 项最低覆盖要求：4 接口路由/响应（1）、不接受/不定义 pageSize（2）、必填时间两端/顺序/端点转换/7 天公式（3）、完整 7 个自然日合法且超 1 秒拒绝（4）、可选条件与 IN 上限 100（5）、封闭枚举表名/非法 logType 不进 Mapper（6）、SQL 无拼接/LIKE/OFFSET/COUNT/大表 JOIN/大字段预取（7）、固定排序与 keyset 谓词（8）、101 判断 hasNext 且只返回 100（9）、cdcLogId 外部字符串内部数值绑定并覆盖大于 JS 安全整数（10）、非法/超范围/带小数/非十进制 → HTTP 400、不存在 → 40410（11）、游标生成/解析/篡改/版本/logType/指纹（12）、规范化 JSON 字段顺序/数组去重排序/空数组空文本/UTF-8（13）、同密钥重启可验签/不同密钥失效（14）、数据源每请求一次四列全表无 N+1（15）、FG_ACTIVE/类别 trim/名称 NULL 与降级（16）、三类字段隔离（17）、LOG_DETAIL 摘要 300 与存在性不加载正文（18）、25 秒超时配置与异常映射（19）、不自动重试（20）、响应 CDC_LOG_ID 恒为字符串（21）、NULL 字段与 `--` 省略语义（22）、物理设计解耦（23）。

### 完整测试套件（含既有测试）

| 项 | 结果 |
|---|---|
| 总测试数 | 564 |
| 失败 | 3 |
| 错误 | 1 |
| 跳过 | 0 |

失败/错误全部为任务开始前既有、依赖开发库实时数据、与本任务无关的失败，详见 §11。

## 8. 构建/编译命令与结果

### 8.1 编译与打包

```bash
cd /agent/cdc-config-platform/backend
mvn clean package -DskipTests
```

结果：**BUILD SUCCESS**，产出 `target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`（约 45 MB）。

### 8.2 本任务相关测试（初版历史结果）

```bash
cd /agent/cdc-config-platform/backend
mvn test
```

结果（初版历史结果）：logquery 相关 99 个测试全部通过（初版累计，R1 后累计为 124 个，见 §7 / §R1.2）；完整套件仅余 4 个既有失败（见 §11）。

### 8.3 静态检索禁止项

对 logquery 主源码、Mapper XML、测试源码执行静态检索，确认无以下禁止项（命中仅存在于注释说明文字，注释已在检查脚本中剔除）：

- `SELECT *`、`LIKE`、`COUNT(`、`JOIN`、`TO_CHAR`、`CAST(`、`TO_NUMBER`、`TO_DATE`、`TO_TIMESTAMP`
- `OFFSET <n> ROWS` 分页子句（`OFFSET` 仅作为业务列名）
- `PARTITION`、`SUBPARTITION`、`TABLESPACE`、`CREATE`、`ALTER`、`DROP`、`TRUNCATE`、`INDEX`（物理设计/DDL 解耦）
- 硬编码密钥；`${}` 仅 3 处 `${tableName}`（封闭枚举）

### 8.4 `git diff --check`

通过（无空白错误）。

## 9. 与五份批准基线的一致性检查

| 基线 | 一致性结论 |
|---|---|
| `REQUIREMENTS.md` | 一致：时间必填半开区间、7 天排他公式、固定 100 条、双字段游标、`CDC_LOG_ID` 字符串传输、大字段隔离、数据源一次读取、菜单开放前置 |
| `API.md` | 一致：4 接口路径/方法/字段/HTTP 状态/业务码/错误码完全按 API.md；`offset`、`cdcLogId` 字符串；非法路径 cdcLogId → HTTP 400 与 40410 区分 |
| `DESIGN.md` | 一致：包结构、`LogQueryServiceImpl` 职责、BigDecimal 数值绑定、keyset 谓词、数据源一次全表读取、游标指纹规范 |
| `UI.md` | 一致：本任务不实现前端 UI，仅保证后端字段契约满足 UI 展示（`--` 省略、字符串 ID） |
| `ACCEPTANCE.md` | 一致：后端阶段满足可在后续联调中验证的接受标准基础；整体验收未执行、菜单未开放 |

## 10. 禁止项与物理设计延期检查

- 未修改五份已批准基线正文及状态（`git diff -- docs/features/log-query/*.md` 为空）。
- 未修改任何前端源码、前端配置、菜单可见性或路由行为（`frontend/**` 未纳入本次暂存）。
- 未生成、未执行生产 DDL；未确定最终 RANGE 粒度、子分区、索引形态、索引数量/列序/本地全局属性。
- 未连接、查询或修改真实数据库业务数据（仅人工授权的只读数据字典核验，见 §6.6）；无任何数据库写操作。
- 代码未依赖任何物理分区/索引；后续调整物理设计不要求改变 API、DTO、业务条件或游标语义。
- 未引入新第三方依赖；未引入自动刷新、自动重试、总数查询或后台预取。

## 11. 已知限制或未解决问题

### 11.1 完整测试套件中的 4 个既有失败（与本任务无关）

完整测试 `mvn test` 输出（初版历史结果，总数 539；R1 后完整套件累计 564，仍为相同 3 失败 + 1 错误，见 §R1.2）：

```text
[INFO] Tests run: 539, Failures: 3, Errors: 1, Skipped: 0
[INFO] BUILD FAILURE
```

命令、失败测试、失败原因、为何判定为既有问题及对本任务的影响如下：

| 失败测试 | 失败信息 | 失败原因（判定） |
|---|---|---|
| `OracleDateMappingTest.oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly:43` | `expected: <27> but was: <30>` | `@SpringBootTest` + `JdbcTemplate` 读取开发库实时数据断言，开发库 `SYSDATE`/数据随日期漂移导致预期失效 |
| `JobFailureServiceTest.latestFaultShouldHaveCorrectRestartCount:125` | `expected: <1> but was: <4>` | 依赖开发库 `CDC_JOB_FAILURE_EVENT`/`CDC_JOB_FAILURE_HANDLE_LOG` 实时行数据，重启计数随运维数据变化 |
| `JobFailureServiceTest.failureDetail_eventNotInFaultProcess_shouldThrow:215` | `expected: <40006> but was: <40401>` | 同一实时数据依赖；所查事件已不在「故障过程」集合中，分支落入不同业务码 |
| `JobFailureServiceTest.failureDetailByEvent_shouldReturnContent:200` | `BusinessException: 故障过程不存在或已被排除: faultRootId=341473352776552448` | 所查 `faultRootId` 在开发库当前数据中已不存在 |

判定为既有问题的证据：

1. **零代码关联**：对 `jobfailure` 测试/主源码执行 `grep logquery|cdcconfig.logquery` 无任何命中；4 个失败测试均未引用、未依赖本任务任何类型或文件。
2. **零 git 修改**：`git diff -- backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure backend/src/test/java/com/bsoft/cdcconfig/monitor/jobfailure` 为空，上述文件未被本任务触碰。
3. **依赖实时开发库数据**：失败测试为 `@SpringBootTest` 或直接走 `JdbcTemplate`/真实 Mapper 读取 `CDC_JOB_FAILURE_EVENT`、`CDC_JOB_FAILURE_HANDLE_LOG` 等表并断言具体数值/分支；这些数据随运维持续变化（此前会话已观察到不同失败形态）。
4. **本任务零写库**：本任务所有接口只读，未执行任何 INSERT/UPDATE/DELETE，不可能是本任务改动数据导致的失败。
5. **本任务相关测试全绿**：logquery 测试全部通过（初版历史结果：99 个；R1 后累计 124 个）；`mvn clean package -DskipTests` 构建成功。

影响：上述失败与本任务无关，按任务 §13 以 `PARTIAL_WITH_PROVEN_PREEXISTING_FAILURES` 记录，不影响本任务的提交与推送。

### 11.2 其他已知限制

- `OFFSET` 列真实数据库类型未从生产 DDL 最终确认，按已批准决策 LQ-API-47/90-H、LQ-DESIGN-157 对外 JSON 暂按字符串传输；开发库未确认类型时以字符串映射，不影响无损传输与编译。
- 本任务未连接真实开发库执行端到端 SQL 验证（任务 §10 禁止），SQL 正确性由 Mapper XML 静态结构测试、绑定参数断言与单元测试覆盖。
- 游标不承诺永久有效；密钥轮换后旧游标失效为设计预期。
- 生产性能、分区边界、索引方案属于后续专项，本任务未涉及。

## 12. 提交前的文档状态说明

- 五份已批准基线（`REQUIREMENTS.md`、`API.md`、`DESIGN.md`、`UI.md`、`ACCEPTANCE.md`）正文与状态均未修改。
- 本报告仅记录后端阶段实现状态；日志查询功能整体**未标记为已实现或已验收**，菜单保持隐藏，前端实现未开始。
- 任务开始前既有工作区内容（大量已修改与未跟踪文件）原样保留，未清理、未覆盖、未暂存、未提交。

## 13. 提交 ID、推送结果与结束时 ahead/behind

- 授权基线提交：`c9e5b28d16b9958b724d86891124b151080cbbaf`
- 本任务提交 ID、远程 `origin/develop` 提交 ID、结束时 ahead/behind：以本任务最终聊天报告的 §17 机器可读结果块为准（字段 `result_commit_id`、`remote_commit_id`、`ahead_behind`）。
- 说明：本报告文件随本次提交一并进入仓库，报告自身无法在其提交创建之前写入该提交的 ID，因此不在此处内嵌自引用 ID；提交后核验命令与结果见最终聊天报告。
- 推送目标：`origin/develop`（普通推送，非 force）。
- 推送后核验命令：

```bash
git rev-parse HEAD
git rev-parse origin/develop
git rev-list --left-right --count HEAD...origin/develop
git status --short
```

必须确认：本地 `HEAD == origin/develop`、ahead/behind `0 0`、任务目标文件无未提交残留、任务前既有无关工作区内容仍存在且未被修改或提交。

## 14. 下一步

- 后端实现已通过 ChatGPT 复审并收口为 `IMPLEMENTED_ACCEPTED`（初版、R1、R1.1、R1.2 复审结论见 §18）；本段不再包含"等待复审、不得进入前端"的约束。
- 下一步为前端实现阶段：等待人工下发前端实现指示；在人工指示前不自行进入前端实现、不开放菜单、不执行整体验收。
- 最终物理分区/索引设计与生产 DDL 继续延期。

---

## R1. ChatGPT 复审与 R1 定向修订记录（LOG-QUERY-BACKEND-IMPLEMENTATION-001-R1）

本段为 ChatGPT 对前序已推送后端实现进行 GitHub 复审后的定向修订记录，保留前序实现与测试历史，不重写实现、不进入前端、不改变已批准业务/API/UI 语义。

- 任务编号：`LOG-QUERY-BACKEND-IMPLEMENTATION-001-R1`
- 授权基线提交：`afdfc889fb3e9b4c03056febcd321488e7c45765`（前序 `feat(log-query): implement backend query api`）
- R1 提交信息：`fix(log-query): harden backend validation`（提交 ID 与推送状态见最终聊天报告机器可读结果块）

### R1.1 六项修订的实际位置与结果

| 修订 | 代码位置 | 行为变更 | 测试 |
|---|---|---|---|
| R1-01 严格自然日期校验 | `service/impl/LogQueryServiceImpl.java` `TIME_FORMAT` | `yyyy-MM-dd HH:mm:ss`（SMART）→ `uuuu-MM-dd HH:mm:ss` + `ResolverStyle.STRICT`；`2026-02-30`、非闰年 `02-29`、`04-31`、`13-01`、`24:00`、`60` 分/秒等不存在日期 → `TIME_RANGE_REQUIRED=40010`；合法闰日通过；时间顺序、`endExclusive=end+1s`、7 天公式不变；对外字符串格式仍为 `yyyy-MM-dd HH:mm:ss` | `LogQueryServiceImplTest` 新增 R1-01 用例 |
| R1-02 游标 CDC_LOG_ID 严格校验 | `cursor/LogCursorCodec.java` `encode()`、`requireCdcLogId()`、`decodeAndVerify()` | 解码后 `id` 必须为 JSON 字符串且严格 `[0-9]{1,19}`、scale=0、`≤9999999999999999999`；`1e3`/`-1`/`1.0`/空/20 位/JSON number/缺失 → `CURSOR_INVALID=40015`；`encode()` 拒绝 null、非整数 scale、超范围 BigDecimal；合法 19 位大于 `Long.MAX_VALUE` 的 ID 正常往返 | `LogCursorCodecTest` 新增 R1-02 用例 |
| R1-03 对齐游标验证顺序 | `cursor/LogCursorCodec.java` `decodeAndVerify()` | 按批准 `LQ-DESIGN-63`/`LQ-API-54`：①按最后 `.` 拆解 → ②base64url 解码确认编码合法 → ③重算 HMAC 并以 `MessageDigest.isEqual` 常量时间比较（HMAC 覆盖原始 base64url 文本）→ ④验签通过后才解析 JSON → ⑤`v==1` → ⑥logType → ⑦条件指纹 → ⑧校验并构造排序边界；格式/base64/签名/版本/边界 → 40015，logType/指纹 → 40016 | `LogCursorCodecTest` 新增 R1-03 用例（base64 非法但签名格式合法 / base64 合法但签名错误 / 签名正确但 JSON 非法） |
| R1-04 候选项稳定排序 | `service/impl/LogQueryServiceImpl.java` `orgComparator()` | 主排序 `DATA_SOURCE_ORG`（NULL 放最后），同名/空名称时以 `DATA_SOURCE_ID` 升序稳定第二排序；仍为一次四列全表读取后内存排序，不在 SQL 增加过滤/第二套候选 | `LogQueryServiceImplTest` 新增 R1-04 用例（同名、多 NULL 名称、输入行顺序改变输出一致） |
| R1-05 密钥配置行为测试 | 新增 `config/LogQueryConfigTest.java`（5 个用例） | 验证外部 Spring 属性绑定 `cdc.log-query.cursor-secret`；非空可创建 codec 并编解码；空/空白不能创建可用 codec 且无默认密钥；同配置值新 codec 可验证旧游标；`@Lazy` 下仅扫描/注入代理不因缺失密钥失败；真正调用时缺失密钥 fail-closed（不生成无签名/固定默认签名游标）。未发现既有实现错误，未新增错误码、未改 API | `LogQueryConfigTest` 5/5 通过 |
| R1-06 本报告勘误 | 本报告 §5.1、§6.3、§R1 | §5.1 修正为「主排序 `DATA_SOURCE_ORG`，同名/空名称以 `DATA_SOURCE_ID` 稳定排序」；§6.3 名称映射降级规则写准确；新增本 R1 记录 | — |

### R1.2 R1 测试与构建结果

- logquery 相关测试：**124/124 通过**（初版历史结果：原 99 + R1 新增 25：Service +7、Codec +13、Config 新增文件 5）。
- 完整后端测试套件：**564 个，3 失败 + 1 错误**，4 个全部为前序 §11 已证明、依赖开发库实时数据的既有无关失败，与 R1 修订无关（`OracleDateMappingTest.oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly:43`、`JobFailureServiceTest.latestFaultShouldHaveCorrectRestartCount:125`、`JobFailureServiceTest.failureDetail_eventNotInFaultProcess_shouldThrow:215`、`JobFailureServiceTest.failureDetailByEvent_shouldReturnContent:200`），失败集合/数量/原因与前序一致。
- 构建：`mvn clean package -DskipTests` **BUILD SUCCESS**。
- `git diff --check`：通过。
- 部署/联调前必须配置环境变量 `CDC_LOG_QUERY_CURSOR_SECRET`，本任务未记录具体值，未把真实密钥写入源码、正式配置、报告或日志（测试仅使用测试专用值）。

### R1.3 R1 未改变的实现

四 API 方法与路径、列表 POST 请求体（无 pageSize）、`error/correct` 固定表枚举、必填时间范围/半开区间/7 天公式、数据源每请求一次四列全表读取、固定 100/读取 101/无 COUNT/OFFSET/页码、`TARGET_TIME DESC, CDC_LOG_ID DESC`、BigDecimal 数值绑定、三类大字段隔离、25 秒超时与不重试、错误码 40010~40017/40410/50020~50021、HMAC-SHA256/规范化 JSON 指纹/无服务端游标会话、菜单隐藏、最终分区/子分区/索引/生产 DDL 继续延期，均保持不变。

### R1.4 R1 声明

- 五份已批准基线正文与状态未修改；前端与菜单未修改；无数据库读写与 DDL。
- 本 R1 修订不代表日志查询功能整体验收通过；菜单仍保持隐藏，最终物理设计仍延期。
- 下一步：等待 ChatGPT 从 GitHub 复审 R1，不得进入前端开发。（历史阶段表述，仅记录 R1 当时状态；复审已通过，见 §18）

---

## 15. 提交前强制自检（§15，24 项）

| # | 自检项 | 结果 |
|---|---|---|
| 1 | 五份批准基线文件内容未变化 | ✅ `git diff -- docs/features/log-query/*.md` 为空 |
| 2 | 未修改任何前端文件 | ✅ 暂存区不含 `frontend/**` |
| 3 | 未修改菜单可见性 | ✅ 未触碰菜单/路由 |
| 4 | 未生成或执行生产 DDL | ✅ 无 DDL，仅逻辑 SQL |
| 5 | 未确定最终 RANGE 粒度、子分区或索引形态 | ✅ 代码无分区/索引依赖 |
| 6 | 四个接口与 API.md 完全一致 | ✅ 路径/方法/字段/状态/错误码一致 |
| 7 | 列表接口只存在 POST `/api/log-query/logs/search` | ✅ 无 GET 列表接口 |
| 8 | 请求/响应 `CDC_LOG_ID` 均为字符串，Mapper 无损数值绑定 | ✅ BigDecimal(scale=0) 绑定 |
| 9 | 列表查询必带 `TARGET_TIME` 半开范围 | ✅ `>= startTime AND < endExclusive` |
| 10 | 最大跨度公式正确 | ✅ `endExclusive - startTime <= 7×24h` |
| 11 | 每页固定 100、读取 101、无 COUNT/OFFSET/页码 | ✅ `FETCH FIRST 101 ROWS ONLY` |
| 12 | 固定双字段排序与游标边界正确 | ✅ `TARGET_TIME DESC, CDC_LOG_ID DESC` + keyset 谓词 |
| 13 | 游标签名、条件指纹和持久化外部密钥符合设计 | ✅ HMAC-SHA256 常量时间比较 + 指纹 + 外部配置占位 |
| 14 | 每个列表/候选请求各只读取一次数据源四列全表，无 N+1 | ✅ 一次全表读取、无缓存、无 N+1 |
| 15 | 列表不读取完整 `LOG_DETAIL`、`RAW_MESSAGE`、`RESULT_DETAIL` | ✅ SUBSTR 300 + LENGTH 标志 |
| 16 | 详情与原始消息按需、最小字段、相互隔离 | ✅ 详情不含 RAW/RESULT_DETAIL；原始消息仅 RAW+ID |
| 17 | 25 秒语句超时生效，不自动重试 | ✅ 4 条语句均 `timeout="25"` |
| 18 | 错误码与统一异常响应符合 API.md 和仓库规范 | ✅ 40010~40017/40410/50020~50021 |
| 19 | 本任务测试通过 | ✅ 124/124 |
| 20 | 后端编译/构建通过，或仅存在已被充分证明的无关既有失败 | ✅ BUILD SUCCESS；4 个既有失败已证明与本任务无关 |
| 21 | `git diff --check` 通过 | ✅ |
| 22 | 暂存区只包含本任务文件 | ✅ 精确 `git add -- <paths>`，见 §16 |
| 23 | 任务开始前既有工作区内容原样保留 | ✅ 未清理/覆盖/暂存/提交 |
| 24 | 实现报告已包含实际证据，未写入秘密 | ✅ 无真实密钥/凭据/完整异常数据 |

## 16. 提交与推送记录（§16 精确提交与推送）

### 16.1 本任务文件清单

新增：

- `backend/src/main/java/com/bsoft/cdcconfig/logquery/enums/LogTypeEnum.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/dto/LogListQuery.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/vo/DataSourceOptionVO.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/vo/DataSourceOptionsVO.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/vo/LogListResponse.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/vo/LogListVO.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/vo/LogDetailVO.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/vo/RawMessageVO.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/controller/LogQueryController.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/service/LogQueryService.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/service/impl/LogQueryServiceImpl.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/mapper/LogQueryMapper.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/mapper/LogListRow.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/mapper/LogDetailRow.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/mapper/RawMessageRow.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/mapper/DataSourceRow.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/config/LogQueryProperties.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/config/LogQueryConfig.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/cursor/LogQueryFingerprint.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/cursor/LogCursorCodec.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/cursor/LogCursorBoundary.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/cursor/LogCursorInvalidException.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/cursor/LogCursorConditionMismatchException.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/exception/LogQueryErrorCode.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/exception/LogQueryBadRequestException.java`
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/exception/LogQueryExceptionHandler.java`
- `backend/src/main/resources/mapper/logquery/LogQueryMapper.xml`
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/LogQueryStaticCheckTest.java`
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/service/LogQueryServiceImplTest.java`
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/cursor/LogCursorCodecTest.java`
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/cursor/LogQueryFingerprintTest.java`
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/controller/LogQueryControllerTest.java`
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/mapper/LogQueryMapperXmlCheckTest.java`
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/config/LogQueryConfigTest.java`
- `docs/features/log-query/reports/LOG-QUERY-BACKEND-IMPLEMENTATION-001.md`

修改：

- `backend/src/main/resources/application-dev.yml`（新增 `cdc.log-query.cursor-secret: ${CDC_LOG_QUERY_CURSOR_SECRET:}` 占位）

### 16.2 暂存与检查

```bash
git add -- <上述精确文件逐个列出>
git diff --cached --name-status
git diff --cached --check
git diff --cached
```

暂存区经核验仅包含本任务文件；如出现任务外文件，本任务将停止并报告现场（未发生）。

### 16.3 提交

提交信息固定为：

```text
feat(log-query): implement backend query api
```

仅创建一次普通提交，不 amend，未签入真实密钥，未把任务前既有修改带入提交。

### 16.4 推送与验证

```bash
git fetch origin develop
git rev-list --left-right --count HEAD...origin/develop
git push origin develop
git rev-parse HEAD
git rev-parse origin/develop
git rev-list --left-right --count HEAD...origin/develop
git status --short
```

推送后实际核验结果以最终聊天报告 §17 机器可读结果块为准（`result_commit_id`、`remote_commit_id`、`ahead_behind=0 0`）。核验结论：本地 `HEAD == origin/develop`、ahead/behind `0 0`、任务目标文件无未提交残留、任务前既有无关工作区内容仍存在且未被修改/提交。

## 17. 最终聊天报告格式

见对话最终回复；机器可读结果块中：

- `status=SUCCESS`
- `backend_test_status=PARTIAL_WITH_PROVEN_PREEXISTING_FAILURES`（124/124 本任务测试通过，完整套件仅 4 个已证明既有无关失败）
- `backend_build_status=PASS`
- `database_read_status=READ_ONLY_METADATA`（依据人工指示记录本次只读元数据核验）
- `database_write_status=NONE`
- `ddl_status=NONE`
- `frontend_change_status=NONE`
- `menu_status=HIDDEN_UNTIL_PHYSICAL_AND_PERFORMANCE_ACCEPTANCE`
- `commit_status=SUCCESS`
- `push_status=SUCCESS`

---

## 18. ChatGPT 复审通过记录与状态收口（LOG-QUERY-BACKEND-IMPLEMENTATION-APPROVAL-001）

- 任务编号：`LOG-QUERY-BACKEND-IMPLEMENTATION-APPROVAL-001`
- 授权基线提交：`58e877f5c6f3a04f8d62415bf103b03535e4f43d`
- 复审结论：以下四个阶段均已由 ChatGPT 从 GitHub 完成复审，无遗留修订项，后端实现据此收口：
  1. 初版实现：`feat(log-query): implement backend query api`（提交 `afdfc889fb3e9b4c03056febcd321488e7c45765`）
  2. R1 定向修订：`fix(log-query): harden backend validation`（提交 `4f6de884897054f7466d5930b77af6c17a28c9aa`）
  3. R1.1 报告一致性修订：`docs(log-query): align backend implementation report`（提交 `1fc4a587fbf1eda51678c96220e3ca4786500665`）
  4. R1.2 报告清单补正：`docs(log-query): complete backend report inventory`（提交 `58e877f5c6f3a04f8d62415bf103b03535e4f43d`）
- 状态收口：
  - 后端实现状态：**IMPLEMENTED_ACCEPTED**
  - 功能整体：**IN_PROGRESS**
  - 前端：**NOT_STARTED**
  - 整体验收：**NOT_RUN**
- 保持项：五份已批准基线正文与状态未修改；代码、测试、配置、菜单未修改；菜单保持隐藏；最终物理分区/索引设计与性能验收继续延期。
- 本任务不重新构建、不重新测试、不操作数据库；仅收口报告状态表述并清理过期的"等待复审"语气。
