import http from '@/services/http'
import type { ApiResponse } from '@/types/monitor'
import type {
  DataSourceOptionsVO,
  LogDetailVO,
  LogListQuery,
  LogListResponse,
  LogQueryStatusVO,
  RawMessageVO,
} from '@/types/logQuery'

/**
 * 日志查询 API 封装（LQ-API-11 ~ 14）。
 * 所有请求显式使用请求级 timeout=30000ms，覆盖全局 http.ts 默认 10 秒（LQ-UI-163 / LQ-API-91），
 * 不修改全局默认值，不影响其他功能。
 */
const REQUEST_TIMEOUT = 30000

/** GET /api/log-query/status（LQ-API-11 / 170，请求级 30 秒超时，不自动重试） */
export async function getLogQueryStatus(): Promise<ApiResponse<LogQueryStatusVO>> {
  const res = await http.get<ApiResponse<LogQueryStatusVO>>(
    '/api/log-query/status',
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** GET /api/log-query/data-source-options（LQ-API-11 / 20） */
export async function fetchDataSourceOptions(): Promise<ApiResponse<DataSourceOptionsVO>> {
  const res = await http.get<ApiResponse<DataSourceOptionsVO>>(
    '/api/log-query/data-source-options',
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** POST /api/log-query/logs/search（LQ-API-12 / 15，首查/下一页/上一页共用） */
export async function searchLogs(query: LogListQuery): Promise<ApiResponse<LogListResponse>> {
  const res = await http.post<ApiResponse<LogListResponse>>(
    '/api/log-query/logs/search',
    query,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** GET /api/log-query/logs/{logType}/{cdcLogId}/detail（LQ-API-13 / 70） */
export async function fetchLogDetail(
  logType: string,
  cdcLogId: string,
): Promise<ApiResponse<LogDetailVO>> {
  const res = await http.get<ApiResponse<LogDetailVO>>(
    `/api/log-query/logs/${encodeURIComponent(logType)}/${encodeURIComponent(cdcLogId)}/detail`,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** GET /api/log-query/logs/{logType}/{cdcLogId}/raw-message（LQ-API-14 / 75） */
export async function fetchRawMessage(
  logType: string,
  cdcLogId: string,
): Promise<ApiResponse<RawMessageVO>> {
  const res = await http.get<ApiResponse<RawMessageVO>>(
    `/api/log-query/logs/${encodeURIComponent(logType)}/${encodeURIComponent(cdcLogId)}/raw-message`,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}
