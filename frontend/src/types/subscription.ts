/** 数据订阅 Feature 前端类型定义（docs/features/data-subscription/API.md，批准基线）。 */

/** 数据源引用状态（列表行/详情/编辑/删除预览共用）。 */
export type DataSourceRefStatus = 'NORMAL' | 'INACTIVE' | 'NOT_FOUND'

/** 源库候选选项（API.md §4.1）。 */
export interface SourceOptionVO {
  dataSourceId: string
  dataSourceOrg: string
}

/** 目标库候选选项（API.md §4.1）。 */
export interface TargetOptionVO {
  dataSourceId: string
  dataSourceOrg: string
}

/** 源库/目标库启用候选一次返回（API.md §4.1）。 */
export interface SubscriptionOptionsVO {
  sources: SourceOptionVO[]
  targets: TargetOptionVO[]
}

/** 源库引用（status 标记停用/不存在）。 */
export interface SourceRefVO {
  dataSourceId: string
  dataSourceOrg: string | null
  status: DataSourceRefStatus
}

/** 目标库引用（status 标记停用/不存在）。 */
export interface TargetRefVO {
  dataSourceId: string
  dataSourceOrg: string | null
  status: DataSourceRefStatus
}

/** 按 Schema 分组的可解析表清单（schema 保持源 Oracle 原始大小写）。 */
export interface SchemaTableGroup {
  schema: string
  tables: string[]
}

/** 查询歧义条件警告（API.md §4.2）。 */
export interface QueryWarningVO {
  type: 'AMBIGUOUS_COMMA_ID'
  field: 'sourceIds' | 'targetIds'
  value: string
  message: string
}

/** 订阅列表行（API.md §4.2 data.items[]）。 */
export interface SubscriptionRowVO {
  dataSubId: string
  dataSubDesc: string
  anomalyMultiSource: boolean
  source: SourceRefVO | null
  sourceTableCount: number
  tablesBySchema: SchemaTableGroup[]
  rawUnparseableTables: string[]
  targets: TargetRefVO[]
  updateTime: string | null
  insertTime: string | null
}

/** 列表响应（API.md §4.2：data 为对象含 items + queryWarnings，不得把 data 当数组）。 */
export interface SubscriptionListVO {
  items: SubscriptionRowVO[]
  queryWarnings: QueryWarningVO[]
}

/** 列表查询参数（源库组内 OR、目标库组内 OR、两组之间 AND；无分页；空数组/未填=无条件）。 */
export interface SubscriptionListQuery {
  sourceIds?: string[]
  targetIds?: string[]
}

/** 订阅详情（API.md §4.3）。 */
export interface SubscriptionDetailVO {
  dataSubId: string
  dataSubDesc: string
  source: SourceRefVO
  tablesBySchema: SchemaTableGroup[]
  rawUnparseableTables: string[]
  targets: TargetRefVO[]
  insertTime: string | null
  updateTime: string | null
  warnings: string[]
}

/** Schema 过滤实际采用模式（API.md §4.4，可核验性标识，不展示给普通用户）。 */
export type SchemaFilterMode = 'ORACLE_MAINTAINED' | 'FALLBACK_EXCLUSION_LIST'

/** Schema 列表（API.md §4.4）。 */
export interface SchemaListVO {
  dataSourceId: string
  filterMode: SchemaFilterMode
  schemas: string[]
}

/** 普通表列表（API.md §4.5，表名保持源 Oracle 原始大小写）。 */
export interface TableListVO {
  dataSourceId: string
  schema: string
  tables: string[]
}

/** 保存请求中的源表项（API.md §4.6，保存请求唯一类型 SourceTableInput）。 */
export interface SourceTableInput {
  schemaName: string
  tableName: string
}

/** 新增保存请求体（API.md §4.6；sourceSelectionMode 对 POST 可选，省略即 REPLACE）。 */
export interface SubscriptionCreateDTO {
  dataSubDesc: string
  dataFromSourceId: string
  dataToSourceIds: string[]
  sourceSelectionMode?: 'REPLACE'
  sourceTables: SourceTableInput[]
}

/** 编辑保存请求体（API.md §4.8；PRESERVE 不提交 sourceTables，REPLACE 必填）。 */
export interface SubscriptionUpdateDTO {
  dataSubDesc: string
  dataFromSourceId: string
  dataToSourceIds: string[]
  sourceSelectionMode: 'PRESERVE' | 'REPLACE'
  sourceTables?: SourceTableInput[]
}

/** 批量校验失效项（API.md §4.6 validationErrors[]）。 */
export interface ValidationErrorVO {
  errorCode: string
  field: 'dataSubDesc' | 'dataFromSourceId' | 'dataToSourceIds' | 'sourceTables'
  name: string
  message: string
}

/** 40300 批量校验失败响应 data（含 validationErrors 数组）。 */
export interface ValidationErrorsVO {
  validationErrors: ValidationErrorVO[]
}

/** 新增成功响应（API.md §4.6：data 为对象含 dataSubId，不是裸字符串）。 */
export interface SubscriptionCreateVO {
  dataSubId: string
}

/** 编辑打开时源表实时校验模式（API.md §4.7）。 */
export type SourceTableCheckMode = 'CHECKED' | 'UNREACHABLE' | 'SKIPPED'

/** 编辑打开回显（API.md §4.7；不含 versionToken/指纹/快照版本等并发字段）。 */
export interface SubscriptionEditOpenVO {
  dataSubId: string
  dataSubDesc: string
  source: SourceRefVO
  targets: TargetRefVO[]
  tablesBySchema: SchemaTableGroup[]
  rawUnparseableTables: string[]
  sourceReachable: boolean
  sourceTableCheck: SourceTableCheckMode
  invalidTables: string[]
}

/** 删除预览（API.md §4.9）。 */
export interface SubscriptionDeletePreviewVO {
  dataSubId: string
  dataSubDesc: string
  source: SourceRefVO
  schemaCount: number
  tableCount: number
  targets: TargetRefVO[]
  warnings: string[]
}
