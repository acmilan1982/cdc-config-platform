/**
 * 探针端管理类型定义（API.md CCFG-API-005/006/008/009/013）。
 * 业务 ID 一律按字符串传输，绝不进入 Number。
 */

/** 列表状态筛选（API.md CCFG-API-004：ALL/ENABLED/DISABLED，缺省 ALL）。 */
export type ClientStatusFilter = 'ALL' | 'ENABLED' | 'DISABLED'

/** 列表行状态（CCFG-API-005：由 FG_ACTIVE 推导）。 */
export type ClientRowStatus = 'ENABLED' | 'DISABLED' | 'ABNORMAL'

/** 项级数据源异常稳定枚举（CCFG-API-005）。 */
export type DataSourceAnomaly =
  | 'INACTIVE'
  | 'NOT_FOUND'
  | 'CATEGORY_MISMATCH'
  | 'TYPE_MISMATCH'
  | 'COMMA_IN_ID'
  | 'DUPLICATE_IN_ROW'
  | 'ASSIGNED_TO_MULTIPLE_CLIENTS'

/** 行级歧义枚举（CCFG-API-005：仅 COMMA_PROTOCOL_AMBIGUOUS）。 */
export type RowAnomaly = 'COMMA_PROTOCOL_AMBIGUOUS'

/** E1 行内数据源视图项（CCFG-API-005）。org/dataSourceName 允许 null（回显原始 ID 即可）。 */
export interface DataSourceViewItemVO {
  dataSourceId: string
  org: string | null
  dataSourceName: string | null
  anomalies: string[]
  conflictClientIds: string[]
}

/** E1 列表行（CCFG-API-005）。dataSources 恒为规范化去重后的原存储顺序。 */
export interface ClientListItemVO {
  clientId: string
  clientDesc: string | null
  status: ClientRowStatus
  fgActive: string
  dataSourceCount: number
  rawDataSourceIds: string | null
  possibleCommaDataSourceIds: string[]
  rowAnomalies: string[]
  dataSources: DataSourceViewItemVO[]
}

/** E1 列表响应 data（CCFG-API-005）。 */
export interface ClientListVO {
  items: ClientListItemVO[]
}

/** E2 候选不可选原因（CCFG-API-006）。 */
export type NotSelectableReason = 'COMMA_IN_ID' | 'OCCUPIED'

/** E2 数据源候选项（CCFG-API-006）。 */
export interface DataSourceOptionVO {
  dataSourceId: string
  org: string
  dataSourceName: string
  selectable: boolean
  notSelectableReason: NotSelectableReason | null
  occupiedByClientIds: string[]
}

/** 列表查询参数（keyword 查询前 Trim；空串按无关键词处理）。 */
export interface ClientListQuery {
  keyword?: string
  status?: ClientStatusFilter
}

/** 新增/编辑请求体（CCFG-API-008/009/013；originalClientId 走 E4 路径参数不入 body）。 */
export interface ClientSaveRequest {
  clientId: string
  clientDesc: string
  dataSourceIds: string[]
}
