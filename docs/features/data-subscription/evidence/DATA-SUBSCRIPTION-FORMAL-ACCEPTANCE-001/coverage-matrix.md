# 数据订阅正式验收覆盖矩阵（验收 ID → 证据来源）

- 任务编号：`DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001`
- 本文件是正式验收执行前"验收 ID → 证据来源"覆盖计划（任务 Prompt §3），全部证据在执行后归档。
- 证据来源缩写：
  - `BT` = 后端数据订阅单元测试（`com.bsoft.cdcconfig.subscription.**`，7 个测试类）
  - `FT` = 前端数据订阅测试（7 个 spec）
  - `HTTP` = 真实 HTTP API 验证（10 项能力，成功 + 失败）
  - `BR` = 真实浏览器验证（1440×900 + 2048×768）
  - `DB` = 真实数据库验证（授权 DML + 备份恢复）
  - `SC` = 静态契约核对（代码只读核对、API/DATABASE 基线逐项核对、前后端零 diff）
  - `REP` = 已批准历史报告（补充证据）：BACKEND-IMPLEMENTATION-001-R1 / BACKEND-INTEGRATION-TEST-001 / FRONTEND-IMPLEMENTATION-001-R3

## 领域一：生效边界与 sync-client 字段（DSUB-AC-001~005）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-001 | SC(DATABASE §4.3 写入字段) + HTTP(新增成功 dataSubId) + DB(写入四字段核对) |
| DSUB-AC-002 | SC(不展示遗留字段) + FT(表单/详情无遗留字段) + HTTP(响应无遗留字段) |
| DSUB-AC-003 | SC(后端代码无 sync-client/ZK/Kafka/启停调用) + HTTP(无副作用) |
| DSUB-AC-004 | FT(成功提示"操作成功。配置将在相关 sync-client 重启后生效。") + BR |
| DSUB-AC-005 | FT(删除成功提示含重启说明) + BR |

## 领域二：数据模型与存储规则（DSUB-AC-006~027）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-006 | BT(create_success_usesUuid32AndPersistsFields) + HTTP(32-hex) + DB(唯一主键) |
| DSUB-AC-007 | BT(create_emptySourceId_returns40312 / create_sourceContainsComma_returns40316) + HTTP + DB |
| DSUB-AC-008 | HTTP(同源两条记录) + DB |
| DSUB-AC-009 | FT(DataSubscribePage 异常行警示) + BR + DB(构造多源异常) |
| DSUB-AC-010 | FT(异常行无操作按钮) + BR + DB |
| DSUB-AC-011 | BT(create_success 双目标库逗号分隔) + HTTP + DB |
| DSUB-AC-012 | BT(create_success 多表逗号分隔无换行) + HTTP + DB |
| DSUB-AC-013 | BT(DataSourceTableParser 大小写保持) + HTTP + DB |
| DSUB-AC-014 | FT(保留字符禁用) + BT(40316) + HTTP |
| DSUB-AC-015 | BT(create_structuralErrors 40317 记录内重复表) + HTTP |
| DSUB-AC-016 | HTTP(完全重复跨行允许) + DB |
| DSUB-AC-017 | SC(列表 SQL FG_ACTIVE=1) + HTTP(仅启用) + DB |
| DSUB-AC-018 | SC(新增 SQL FG_ACTIVE=1) + HTTP + DB + FT(无状态选择) |
| DSUB-AC-019 | SC(无 FG_ACTIVE=0 更新路径、按主键物理删除) + FT(无停用入口) |
| DSUB-AC-020 | BT(40310/40311) + FT(maxlength=255、必填) + HTTP |
| DSUB-AC-021 | SC(新增列清单 DATA_SOURCE_COMMENT 为 NULL) + DB |
| DSUB-AC-022 | SC(编辑 SET 不含遗留字段) + BT(update_preserve 不重写) + DB |
| DSUB-AC-023 | SC(新增 NULL、编辑保持) + DB |
| DSUB-AC-024 | SC(新增 NULL、编辑保持) + DB |
| DSUB-AC-025 | SC(INSERT_TIME=SYSDATE、UPDATE_TIME 空) + DB |
| DSUB-AC-026 | SC(更新 UPDATE_TIME=SYSDATE) + BT(update_preserve sqlSet) + DB |
| DSUB-AC-027 | SC(列表 SQL NVL 倒序) + FT(resolveUpdateTime / createFallbackRow) + HTTP |

## 领域三：列表页面与查询（DSUB-AC-028~043）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-028 | FT(挂载自动查询空条件) + BR(菜单进入 /config/subscribe) |
| DSUB-AC-029 | SC(接口无分页参数) + FT(无分页控件) + BR |
| DSUB-AC-030 | SC(默认 NVL 倒序) + FT + HTTP |
| DSUB-AC-031 | FT(仅两个多选下拉) + BR |
| DSUB-AC-032 | BT(options 启用且类别匹配 / lowercase) + FT(查询下拉含逗号候选歧义警告) + HTTP + REP |
| DSUB-AC-033 | BT(list_sourceOrTargetAnd / list_commaCandidate / CsvHelper 精确匹配) + HTTP + DB |
| DSUB-AC-034 | BT(同上目标组) + HTTP + DB |
| DSUB-AC-035 | BT(list_sourceOrTargetAnd 组间 AND) + HTTP |
| DSUB-AC-036 | FT(需点击查询才请求) + BR |
| DSUB-AC-037 | FT(重置仅清空表单不请求) + BR |
| DSUB-AC-038 | FT("暂无符合条件的订阅记录") + BR |
| DSUB-AC-039 | FT(列顺序、DATA_SUB_ID 不占列) + BR |
| DSUB-AC-040 | FT(机构主显示、ID 悬停) + BR |
| DSUB-AC-041 | FT("共 N 张"+悬停) + BR |
| DSUB-AC-042 | FT(+N 悬停) + BR |
| DSUB-AC-043 | FT(时间回退 + 查看/编辑/删除) + BR |

## 领域四：异常记录与异常数据源展示（DSUB-AC-044~048）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-044 | FT(INACTIVE 已停用) + BT(converter) + BR |
| DSUB-AC-045 | FT(NOT_FOUND 不存在) + BT(converter) + BR |
| DSUB-AC-046 | FT + BT(converter toTargetRefVO) + BR |
| DSUB-AC-047 | FT(异常行警示) + BR + DB |
| DSUB-AC-048 | FT(异常源/目标仍可查看编辑删除、保存被阻断) + BT(update 校验) + HTTP + BR |

## 领域五：查看详情（DSUB-AC-049~056）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-049 | FT(查看打开详情弹窗) + BR |
| DSUB-AC-050 | SC(详情只读配置与映射、不连源 Oracle) + HTTP(详情请求) |
| DSUB-AC-051 | FT(异常行无查看入口) + BR |
| DSUB-AC-052 | FT(详情完整渲染) + BR |
| DSUB-AC-053 | FT(详情警告) + BT(converter toDetailVO warnings) + BR |
| DSUB-AC-054 | FT(限高滚动结构) + BR |
| DSUB-AC-055 | BT(Parser 正常三段不误判 / unparseable 保留) + FT(无法解析分区) + HTTP + DB |
| DSUB-AC-056 | FT(详情无遗留字段) + SC |

## 领域六：新增/编辑弹窗交互与源库搜索（DSUB-AC-057~070）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-057 | FT(新增/编辑同一弹窗) + BR |
| DSUB-AC-058 | SC(UI §7.7 弹窗尺寸) + BR(1K/2K 实测) |
| DSUB-AC-059 | FT(标题栏拖动 enableDialogDrag) + BR |
| DSUB-AC-060 | FT(脏表单关闭二次确认) + BR |
| DSUB-AC-061 | FT(必填校验、单行输入 max255) + BT(40310~40314) + BR |
| DSUB-AC-062 | FT(可搜索单选下拉) + BR |
| DSUB-AC-063 | FT(禁用项+原因) + BT(options) + HTTP |
| DSUB-AC-064 | FT(filterSourceOptions 四级排序) + BR |
| DSUB-AC-065 | FT(大小写不敏感/trim/高亮/无结果) + BR |
| DSUB-AC-066 | FT(空搜索显示全部) + BR |
| DSUB-AC-067 | FT(选中态) + BR |
| DSUB-AC-068 | FT(切换源库二次确认清空) + BR |
| DSUB-AC-069 | FT(布局结构、flex 中轴、源表区主要空间) + BR |
| DSUB-AC-070 | SC(视口约束) + BR |

## 领域七：目标库选择（DSUB-AC-071~074）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-071 | FT(目标卡片禁用项) + BT(options) + HTTP |
| DSUB-AC-072 | FT(两行紧凑卡片、唯一左复选框、3 卡同排、无查看更多) + BR |
| DSUB-AC-073 | FT(scoped CSS 白色主体四态) + BR(截图) + REP(R3 视觉) |
| DSUB-AC-074 | FT(3 目标选中) + BT(create 逗号分隔) + HTTP + DB |

## 领域八：Schema 与表选择（DSUB-AC-075~088）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-075 | BT(SourceMetadataServiceImpl 元数据读取) + HTTP(metadata) + SC(不泄露口令) + BR |
| DSUB-AC-076 | SC(目标库只选择不连接) + HTTP |
| DSUB-AC-077 | BT(mviewExclusion 三处 / validateTables 40331 / listSchemas 过滤) + HTTP(真实 schema/表) + BR |
| DSUB-AC-078 | FT(Schema 懒加载+会话缓存) + BR |
| DSUB-AC-079 | FT(Schema 失败重试) + BR |
| DSUB-AC-080 | FT(左 Schema 右表、无已选面板) + BR |
| DSUB-AC-081 | FT(表名模糊搜索大小写不敏感) + BR |
| DSUB-AC-082 | FT(全选/取消筛选/只看已选/清空/Shift 连选) + BR |
| DSUB-AC-083 | FT(切换 Schema 已选保留) + BR |
| DSUB-AC-084 | FT(勾选+整行浅蓝、无重复状态列) + BR |
| DSUB-AC-085 | FT(st-table-head 固定表头、内部滚动) + BR |
| DSUB-AC-086 | FT(240 表) + BR |
| DSUB-AC-087 | FT(汇总与 Schema 徽标 formatSelectionSummary) + BR |
| DSUB-AC-088 | FT(240 表渲染) + BR |

## 领域九：新增保存规则（DSUB-AC-089~096）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-089 | BT(create 结构化校验) + FT(前后端校验、40300 展示) + HTTP |
| DSUB-AC-090 | BT(create_refsNotFoundOrWrongCategory 40320/40321、sourceCategoryMismatch 40322) + HTTP |
| DSUB-AC-091 | BT(create_structuralErrors 40316/40317/40318、validateTables 40330/40331) + HTTP |
| DSUB-AC-092 | BT(validateTables_oneSchemaManyTables 单 Schema 占位符、dedupsSchemas 批量) + HTTP + BR |
| DSUB-AC-093 | BT(校验错误一次列出) + FT(40300 全部展示) + HTTP |
| DSUB-AC-094 | FT(保存按钮加载禁用) + BR |
| DSUB-AC-095 | FT(保存成功关闭+刷新+提示) + BR |
| DSUB-AC-096 | BT(120 表批量) + HTTP(真实 schema 表批量) |

## 领域十：编辑规则（DSUB-AC-097~106）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-097 | FT(编辑完整回显同一弹窗) + BR |
| DSUB-AC-098 | FT(多 Schema 回显计数) + BR |
| DSUB-AC-099 | FT(编辑换源二次确认清空) + BR |
| DSUB-AC-100 | FT(invalidTables 异常已选表警告) + BT(editOpen_sourceChecked_returnsInvalidTables) + BR |
| DSUB-AC-101 | BT(update_replace_validateTablesErrors) + HTTP |
| DSUB-AC-102 | BT(editOpen_sourceUnreachable_marksUnreachable / update_preserve) + FT(断连有限编辑) + HTTP |
| DSUB-AC-103 | FT(断连禁用源库/源表) + HTTP |
| DSUB-AC-104 | FT(异常数据源回显+修复前禁止保存) + BT(update 校验) + BR |
| DSUB-AC-105 | FT(异常行无编辑入口) + BT(editOpen_anomaly_throws40350) + BR |
| DSUB-AC-106 | BT(update 不改 DATA_SUB_ID/INSERT_TIME、UPDATE_TIME=SYSDATE) + DB |

## 领域十一：无并发保护边界（DSUB-AC-107~110）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-107 | BT(noConcurrencyVersionTokenOrRowLockFields / dataSubscribe_usesTableIdInput) + FT(载荷无 versionToken 等) + HTTP |
| DSUB-AC-108 | SC(update 无并发比较) + HTTP(编辑期间修改后保存成功) |
| DSUB-AC-109 | SC(不使用 UPDATE_TIME 判断并发) + HTTP + DB |
| DSUB-AC-110 | BT(无 40910) + SC(API.md 无 40910) + FT(无并发处理流程) |

## 领域十二：删除规则（DSUB-AC-111~117）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-111 | FT(异常行无删除入口) + BT(delete_anomaly_throws40351) + BR |
| DSUB-AC-112 | BT(delete_success_removesByPrimaryKey) + DB + HTTP |
| DSUB-AC-113 | FT(删除确认完整内容) + BR |
| DSUB-AC-114 | BT(deletePreview_normal_returnsCountsWithoutVersionToken / noConcurrencyField) + SC + HTTP + DB |
| DSUB-AC-115 | BT(delete_notFound 40430 / deleteReturnsZero 40430) + FT(40430 提示) + HTTP |
| DSUB-AC-116 | FT(删除成功刷新+重启提示) + BR |
| DSUB-AC-117 | FT(取消不删除) + BR |

## 领域十三：通用交互、安全与延期项（DSUB-AC-118~126）

| 验收 ID | 证据来源 |
|---|---|
| DSUB-AC-118 | FT(防双击/按钮禁用) + BR |
| DSUB-AC-119 | BT(40340/40341 脱敏) + FT(业务错误清晰提示) + BR |
| DSUB-AC-120 | SC(后端代码无 ZK/Kafka/进程操作) + HTTP(日志) |
| DSUB-AC-121 | SC(大屏零 diff + 延期状态 DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE) + git |
| DSUB-AC-122 | SC(延期不阻断验收) |
| DSUB-AC-123 | SC(DATABASE.md DATA_SUB_ID 真实主键 DATABASE_VERIFIED) + DB(数据字典只读核对) |
| DSUB-AC-124 | SC(新增 FG_ACTIVE=1、删除物理) + DB + BT |
| DSUB-AC-125 | SC(无通知/重启/ZK/Kafka/运行态/任务启停能力) + FT(无此类 UI) |
| DSUB-AC-126 | HTTP(端到端新增) + DB + BR(页面完整流程) |
