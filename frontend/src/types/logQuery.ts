/**
 * 日志查询 API 类型（LQ-API-01 ~ 14、LQ-API-73/78）。
 * CDC_LOG_ID、OFFSET 全程按字符串处理，禁止转为 JavaScript Number（LQ-API-07）。
 */

export type LogType = 'error' | 'correct'

/** POST /api/log-query/logs/search 请求体（LQ-API-12 / 15） */
export interface LogListQuery {
  logType: string
  sourceDataSourceIds?: string[]
  sourceTableName?: string | null
  targetDataSourceIds?: string[]
  targetTableName?: string | null
  startTime: string
  endTime: string
  cursor?: string | null
}

/** 列表查询响应 data（LQ-API-41） */
export interface LogListResponse {
  items: LogListVO[]
  hasNext: boolean
  nextCursor?: string
}

/** 列表行（LQ-API-05 / 6.3） */
export interface LogListVO {
  cdcLogId: string
  sourceDataSourceId?: string
  sourceDataSourceName?: string
  sourceTableName?: string
  targetDataSourceId?: string
  targetDataSourceName?: string
  targetTableName?: string
  instructionType?: string
  logSummary?: string
  hasLogDetail: boolean
  hasRawMessage: boolean
  offset?: string
  sourceTime?: string
  kafkaEnqueueTime?: string
  targetTime: string
  insertTime?: string
}

/** 日志详情响应 data（LQ-API-73） */
export interface LogDetailVO {
  cdcLogId: string
  sourceDataSourceId?: string
  sourceTableName?: string
  targetDataSourceId?: string
  targetTableName?: string
  instructionType?: string
  resultCode?: string
  offset?: string
  sourceTime?: string
  kafkaEnqueueTime?: string
  targetTime?: string
  insertTime?: string
  logDetail?: string
}

/** 原始消息响应 data（LQ-API-78） */
export interface RawMessageVO {
  cdcLogId: string
  rawMessage: string
}

/** 数据源候选响应 data（LQ-API-20 / 5.2） */
export interface DataSourceOptionsVO {
  sourceList: DataSourceOptionVO[]
  targetList: DataSourceOptionVO[]
}

/** 数据源候选行（LQ-API-5.2） */
export interface DataSourceOptionVO {
  id: string
  org?: string
}
