import http from '@/services/http'
import type { ApiResponse } from '@/types/monitor'
import type {
  SchemaListVO,
  SubscriptionCreateDTO,
  SubscriptionCreateVO,
  SubscriptionDeletePreviewVO,
  SubscriptionDetailVO,
  SubscriptionEditOpenVO,
  SubscriptionListQuery,
  SubscriptionListVO,
  SubscriptionOptionsVO,
  SubscriptionUpdateDTO,
  TableListVO,
} from '@/types/subscription'

/** 查询类请求级超时（覆盖全局默认 10 秒，不修改 http.ts 全局默认）。 */
const QUERY_TIMEOUT = 30000
/** 写入类请求级超时。 */
const WRITE_TIMEOUT = 30000

/**
 * 列表多选查询参数序列化（API.md §4.2）。
 * 后端使用 request.getParameterValues("sourceIds") 解析重复参数，必须生成
 * sourceIds=a&sourceIds=b 形式；axios 默认会把数组序列化为 sourceIds[]=a&sourceIds[]=b，
 * 传入 JSON 字符串或错误 CSV 也会导致后端解析失败。空数组/未填不输出任何参数。
 */
export function serializeSubscriptionParams(params: SubscriptionListQuery): string {
  const pairs: string[] = []
  const appendRepeated = (key: string, values?: string[]): void => {
    if (!values || values.length === 0) return
    for (const value of values) {
      if (value === undefined || value === null) continue
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }
  appendRepeated('sourceIds', params.sourceIds)
  appendRepeated('targetIds', params.targetIds)
  return pairs.join('&')
}

/** GET /api/subscriptions/options 源库/目标库启用候选（API.md §4.1）。 */
export async function fetchSubscriptionOptions(): Promise<ApiResponse<SubscriptionOptionsVO>> {
  const res = await http.get<ApiResponse<SubscriptionOptionsVO>>('/api/subscriptions/options', {
    timeout: QUERY_TIMEOUT,
  })
  return res.data
}

/** GET /api/subscriptions 列表（API.md §4.2；data 为对象含 items+queryWarnings；多选重复参数序列化）。 */
export async function fetchSubscriptionList(
  query: SubscriptionListQuery,
): Promise<ApiResponse<SubscriptionListVO>> {
  const res = await http.get<ApiResponse<SubscriptionListVO>>('/api/subscriptions', {
    params: query,
    paramsSerializer: (params) => serializeSubscriptionParams(params as SubscriptionListQuery),
    timeout: QUERY_TIMEOUT,
  })
  return res.data
}

/** GET /api/subscriptions/{dataSubId} 详情（API.md §4.3；{dataSubId} 为 32 位十六进制 UUID）。 */
export async function fetchSubscriptionDetail(
  dataSubId: string,
): Promise<ApiResponse<SubscriptionDetailVO>> {
  const res = await http.get<ApiResponse<SubscriptionDetailVO>>(
    `/api/subscriptions/${encodeURIComponent(dataSubId)}`,
    { timeout: QUERY_TIMEOUT },
  )
  return res.data
}

/** GET /api/subscriptions/metadata/schemas 源库 Schema 列表（API.md §4.4；query 参数承载 dataSourceId）。 */
export async function fetchSourceSchemas(
  dataSourceId: string,
): Promise<ApiResponse<SchemaListVO>> {
  const res = await http.get<ApiResponse<SchemaListVO>>('/api/subscriptions/metadata/schemas', {
    params: { dataSourceId },
    timeout: QUERY_TIMEOUT,
  })
  return res.data
}

/** GET /api/subscriptions/metadata/tables 按 Schema 查询普通表（API.md §4.5；query 参数承载 dataSourceId/schema）。 */
export async function fetchSourceTables(
  dataSourceId: string,
  schema: string,
): Promise<ApiResponse<TableListVO>> {
  const res = await http.get<ApiResponse<TableListVO>>('/api/subscriptions/metadata/tables', {
    params: { dataSourceId, schema },
    timeout: QUERY_TIMEOUT,
  })
  return res.data
}

/** POST /api/subscriptions 新增（API.md §4.6；成功 data 为对象含 dataSubId，非裸字符串）。 */
export async function createSubscription(
  request: SubscriptionCreateDTO,
): Promise<ApiResponse<SubscriptionCreateVO>> {
  const res = await http.post<ApiResponse<SubscriptionCreateVO>>('/api/subscriptions', request, {
    timeout: WRITE_TIMEOUT,
  })
  return res.data
}

/** GET /api/subscriptions/{dataSubId}/edit 编辑打开回显（API.md §4.7）。 */
export async function fetchSubscriptionEdit(
  dataSubId: string,
): Promise<ApiResponse<SubscriptionEditOpenVO>> {
  const res = await http.get<ApiResponse<SubscriptionEditOpenVO>>(
    `/api/subscriptions/${encodeURIComponent(dataSubId)}/edit`,
    { timeout: QUERY_TIMEOUT },
  )
  return res.data
}

/** PUT /api/subscriptions/{dataSubId} 编辑保存（API.md §4.8；PRESERVE 不提交 sourceTables）。 */
export async function updateSubscription(
  dataSubId: string,
  request: SubscriptionUpdateDTO,
): Promise<ApiResponse<null>> {
  const res = await http.put<ApiResponse<null>>(
    `/api/subscriptions/${encodeURIComponent(dataSubId)}`,
    request,
    { timeout: WRITE_TIMEOUT },
  )
  return res.data
}

/** GET /api/subscriptions/{dataSubId}/delete-preview 删除预览（API.md §4.9）。 */
export async function fetchSubscriptionDeletePreview(
  dataSubId: string,
): Promise<ApiResponse<SubscriptionDeletePreviewVO>> {
  const res = await http.get<ApiResponse<SubscriptionDeletePreviewVO>>(
    `/api/subscriptions/${encodeURIComponent(dataSubId)}/delete-preview`,
    { timeout: QUERY_TIMEOUT },
  )
  return res.data
}

/** DELETE /api/subscriptions/{dataSubId} 物理删除（API.md §4.10；无 JSON 请求体，不携带并发字段）。 */
export async function deleteSubscription(dataSubId: string): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(
    `/api/subscriptions/${encodeURIComponent(dataSubId)}`,
    { timeout: WRITE_TIMEOUT },
  )
  return res.data
}
