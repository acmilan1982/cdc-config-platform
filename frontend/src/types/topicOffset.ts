import type { ApiResponse } from '@/types/monitor'

export type { ApiResponse }

export type MappingState = 'ACTIVE' | 'INACTIVE' | 'NOT_FOUND'

export interface TopicNameMap {
  clientId: string
  sourceId: string
  schema: string
  table: string
  targetId: string
}

export interface TopicMappingRef {
  state: MappingState
  id: string
  org?: string | null
  desc?: string | null
}

export interface TopicRowMapping {
  client: TopicMappingRef
  source: TopicMappingRef
  target: TopicMappingRef
}

export interface TopicOffsetItem {
  serverId: string
  rawTopic: string
  nextOffset: string | null
  updatedAt: string | null
  kafkaEndOffset: string | null
  pendingCount: string | null
  consumeLag: string | null
  parseable: boolean
  parsed: TopicNameMap | null
  mapping: TopicRowMapping | null
}

export interface TopicOffsetPageResult {
  pageNum: number
  pageSize: number
  total: number
  pages: number
  unparseableTotal: number
  records: TopicOffsetItem[]
}

export interface ClientCandidate {
  id: string
  desc?: string | null
  active: boolean
}

export interface DataSourceCandidate {
  id: string
  org?: string | null
  active: boolean
}

export interface CandidateGroup {
  clients: ClientCandidate[]
  sources: DataSourceCandidate[]
  targets: DataSourceCandidate[]
}

/** 查询区草稿：各维度可能含 __ALL__ 哨兵（仅表单层），表名可为原始含首尾空格文本。 */
export interface QueryDraft {
  clients: string[]
  sources: string[]
  targets: string[]
  tableName: string
}

/** 已生效/待提交的查询条件：各维度为具体 ID（不含 __ALL__），表名已去首尾空格。 */
export interface AppliedCriteria {
  clientIds: string[]
  sourceIds: string[]
  targetIds: string[]
  tableName: string
}

export interface TopicOffsetQueryParams {
  clientId: string[]
  sourceId: string[]
  targetId: string[]
  tableName: string
  pageNum: number
}

export type TopicOffsetApiResponse<T> = ApiResponse<T>
