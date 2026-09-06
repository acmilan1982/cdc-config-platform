import http from '@/services/http'
import type { ApiResponse } from '@/types/monitor'
import type { DataSourceSnapshotQueryParams, SnapshotStatusListResult } from '@/types/dataSourceSnapshot'

/** 查询类请求级超时（覆盖全局默认 10 秒，不修改 http.ts 全局默认；与 topic-offset 同惯例）。 */
const QUERY_TIMEOUT = 30000

/**
 * 查询参数序列化（API §4.1）：clientId/sourceId/status 多值用重复参数编码
 * clientId=A&clientId=B；axios 默认会序列化为 clientId[]=A，必须手工生成。
 * 空维度不输出任何参数（该维即“全部”，永不发送 __ALL__ 哨兵）。
 */
export function serializeDataSourceSnapshotParams(params: DataSourceSnapshotQueryParams): string {
  const pairs: string[] = []
  const appendRepeated = (key: string, values: string[]): void => {
    for (const value of values) {
      if (value === undefined || value === null || value === '') continue
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }
  appendRepeated('clientId', params.clientId)
  appendRepeated('sourceId', params.sourceId)
  appendRepeated('status', params.status)
  return pairs.join('&')
}

/**
 * GET /api/monitor/data-source-run-state/list（唯一接口）。
 * 首次加载、条件查询、自动/手工刷新、失败重试、恢复可见复用同一接口；区分仅存在于前端状态语义。
 */
export async function fetchSnapshotStatusList(
  params: DataSourceSnapshotQueryParams,
): Promise<ApiResponse<SnapshotStatusListResult>> {
  const res = await http.get<ApiResponse<SnapshotStatusListResult>>(
    '/api/monitor/data-source-run-state/list',
    {
      params,
      paramsSerializer: (raw) => serializeDataSourceSnapshotParams(raw as DataSourceSnapshotQueryParams),
      timeout: QUERY_TIMEOUT,
    },
  )
  return res.data
}
