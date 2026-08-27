import http from '@/services/http'
import type { ApiResponse } from '@/types/monitor'
import type { ServerConfigPageVO, ServerConfigSaveRequest } from '@/types/serverConfig'

/**
 * 中心端配置 API 封装（API.md SC-API-020 / SC-API-040）。
 * 请求级 timeout=30000ms，覆盖全局 http.ts 默认 10 秒，不修改全局默认值。
 */
const REQUEST_TIMEOUT = 30000

/** GET /api/server-config（API.md SC-API-020~025） */
export async function fetchServerConfigPage(): Promise<ApiResponse<ServerConfigPageVO>> {
  const res = await http.get<ApiResponse<ServerConfigPageVO>>(
    '/api/server-config',
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** POST /api/server-config/save（API.md SC-API-040，仅 items，不含其他字段） */
export async function saveServerConfig(
  request: ServerConfigSaveRequest,
): Promise<ApiResponse<null>> {
  const res = await http.post<ApiResponse<null>>(
    '/api/server-config/save',
    request,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}
