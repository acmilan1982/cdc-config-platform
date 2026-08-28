import http from '@/services/http'
import type { ApiResponse } from '@/types/monitor'
import type { ServerConfigPageVO, ServerConfigSaveRequest } from '@/types/serverConfig'

/**
 * 中心端配置 API 封装（API.md SC-API-020 / SC-API-040）。
 * 请求级超时覆盖全局 http.ts 默认 10 秒，不修改全局默认值（SC-API-090）：
 * GET 查询 15000ms；POST 批量保存 30000ms（事务批量更新不应被过早截断）。
 */
const GET_TIMEOUT = 15000
const POST_TIMEOUT = 30000

/** GET /api/server-config（API.md SC-API-020~025） */
export async function fetchServerConfigPage(): Promise<ApiResponse<ServerConfigPageVO>> {
  const res = await http.get<ApiResponse<ServerConfigPageVO>>(
    '/api/server-config',
    { timeout: GET_TIMEOUT },
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
    { timeout: POST_TIMEOUT },
  )
  return res.data
}
