import http from '@/services/http'
import type { ApiResponse } from '@/types/monitor'
import type { CandidateGroup, TopicOffsetPageResult, TopicOffsetQueryParams } from '@/types/topicOffset'

/** 查询类请求级超时（覆盖全局默认 10 秒，不修改 http.ts 全局默认）。 */
const QUERY_TIMEOUT = 30000

/**
 * offsets 多值/单值查询参数序列化（API.md §4.1）。
 * clientId/sourceId/targetId 用重复参数编码 clientId=A&clientId=B；axios 默认会序列化为
 * clientId[]=A，必须手工生成。空数组/空表名不输出任何参数。
 */
export function serializeTopicOffsetParams(params: TopicOffsetQueryParams): string {
  const pairs: string[] = []
  const appendRepeated = (key: string, values: string[]): void => {
    for (const value of values) {
      if (value === undefined || value === null) continue
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }
  appendRepeated('clientId', params.clientId)
  appendRepeated('sourceId', params.sourceId)
  appendRepeated('targetId', params.targetId)
  if (params.tableName && params.tableName.length > 0) {
    pairs.push(`tableName=${encodeURIComponent(params.tableName)}`)
  }
  if (params.pageNum >= 1) {
    pairs.push(`pageNum=${params.pageNum}`)
  }
  return pairs.join('&')
}

/** GET /api/monitor/topic-offset/offsets 按条件分页查询断点列表（API.md §4.1）。 */
export async function fetchTopicOffsets(
  params: TopicOffsetQueryParams,
): Promise<ApiResponse<TopicOffsetPageResult>> {
  const res = await http.get<ApiResponse<TopicOffsetPageResult>>(
    '/api/monitor/topic-offset/offsets',
    {
      params,
      paramsSerializer: (raw) => serializeTopicOffsetParams(raw as TopicOffsetQueryParams),
      timeout: QUERY_TIMEOUT,
    },
  )
  return res.data
}

/** GET /api/monitor/topic-offset/candidates 候选配置（API.md §4.2）。 */
export async function fetchTopicCandidates(): Promise<ApiResponse<CandidateGroup>> {
  const res = await http.get<ApiResponse<CandidateGroup>>('/api/monitor/topic-offset/candidates', {
    timeout: QUERY_TIMEOUT,
  })
  return res.data
}
