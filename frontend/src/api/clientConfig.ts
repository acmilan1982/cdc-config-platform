import http from '@/services/http'
import type { ApiResponse } from '@/types/monitor'
import type {
  ClientListQuery,
  ClientListVO,
  ClientSaveRequest,
  DataSourceOptionVO,
} from '@/types/clientConfig'

/**
 * 探针端管理 API 封装（API.md E1~E7）。路径参数一律 encodeURIComponent；
 * 请求级超时覆盖全局默认 10 秒，不修改全局默认值（CCFG-API-001/019）。
 */
const REQUEST_TIMEOUT = 30000

/** E1 GET /api/clients（列表，keyword/status 走 Query 参数） */
export async function fetchClientList(
  query: ClientListQuery,
): Promise<ApiResponse<ClientListVO>> {
  const res = await http.get<ApiResponse<ClientListVO>>('/api/clients', {
    params: query,
    timeout: REQUEST_TIMEOUT,
  })
  return res.data
}

/** E2 GET /api/clients/data-source-options（数据源候选与占用；编辑传原探针 ID 做自排除） */
export async function fetchDataSourceOptions(
  excludeClientId?: string,
): Promise<ApiResponse<DataSourceOptionVO[]>> {
  const res = await http.get<ApiResponse<DataSourceOptionVO[]>>(
    '/api/clients/data-source-options',
    {
      params: excludeClientId ? { excludeClientId } : {},
      timeout: REQUEST_TIMEOUT,
    },
  )
  return res.data
}

/** E3 POST /api/clients（新增，FG_ACTIVE 由后端置为 '1'） */
export async function createClient(request: ClientSaveRequest): Promise<ApiResponse<null>> {
  const res = await http.post<ApiResponse<null>>('/api/clients', request, {
    timeout: REQUEST_TIMEOUT,
  })
  return res.data
}

/** E4 PUT /api/clients/{originalClientId}（编辑） */
export async function updateClient(
  originalClientId: string,
  request: ClientSaveRequest,
): Promise<ApiResponse<null>> {
  const res = await http.put<ApiResponse<null>>(
    `/api/clients/${encodeURIComponent(originalClientId)}`,
    request,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** E5 DELETE /api/clients/{clientId}（物理删除） */
export async function deleteClient(clientId: string): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(
    `/api/clients/${encodeURIComponent(clientId)}`,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** E6 PUT /api/clients/{clientId}/enable（启用） */
export async function enableClient(clientId: string): Promise<ApiResponse<null>> {
  const res = await http.put<ApiResponse<null>>(
    `/api/clients/${encodeURIComponent(clientId)}/enable`,
    null,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** E7 PUT /api/clients/{clientId}/disable（停用） */
export async function disableClient(clientId: string): Promise<ApiResponse<null>> {
  const res = await http.put<ApiResponse<null>>(
    `/api/clients/${encodeURIComponent(clientId)}/disable`,
    null,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}
