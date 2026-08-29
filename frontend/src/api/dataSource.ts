import http from '@/services/http'
import type { ApiResponse } from '@/types/monitor'
import type {
  BizAttrSaveRequest,
  BizAttrVO,
  DataSourceCreateRequest,
  DataSourceListQuery,
  DataSourceRow,
  DataSourceUpdateRequest,
  NamingStrategySaveRequest,
  NamingStrategyVO,
  TargetOptionVO,
  TestConnectionRequest,
  TestConnectionResult,
} from '@/types/dataSource'

/** 数据源管理 API 封装（API.md 数据源管理 §4）。请求级超时覆盖全局默认 10 秒。 */
const REQUEST_TIMEOUT = 30000

/** GET /api/data-sources（列表，三条件忽略大小写模糊，无分页） */
export async function fetchDataSourceList(
  query: DataSourceListQuery,
): Promise<ApiResponse<DataSourceRow[]>> {
  const res = await http.get<ApiResponse<DataSourceRow[]>>('/api/data-sources', {
    params: query,
    timeout: REQUEST_TIMEOUT,
  })
  return res.data
}

/** GET /api/data-sources/{dataSourceId}（详情） */
export async function fetchDataSourceDetail(
  dataSourceId: string,
): Promise<ApiResponse<DataSourceRow>> {
  const res = await http.get<ApiResponse<DataSourceRow>>(
    `/api/data-sources/${encodeURIComponent(dataSourceId)}`,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** POST /api/data-sources（新增，password 必填，返回新 dataSourceId） */
export async function createDataSource(
  request: DataSourceCreateRequest,
): Promise<ApiResponse<string>> {
  const res = await http.post<ApiResponse<string>>('/api/data-sources', request, {
    timeout: REQUEST_TIMEOUT,
  })
  return res.data
}

/** PUT /api/data-sources/{originalDataSourceId}（编辑，password 缺席=保留原密码） */
export async function updateDataSource(
  originalDataSourceId: string,
  request: DataSourceUpdateRequest,
): Promise<ApiResponse<string>> {
  const res = await http.put<ApiResponse<string>>(
    `/api/data-sources/${encodeURIComponent(originalDataSourceId)}`,
    request,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** DELETE /api/data-sources/{dataSourceId} */
export async function deleteDataSource(dataSourceId: string): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(
    `/api/data-sources/${encodeURIComponent(dataSourceId)}`,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** POST /api/data-sources/test-connection（编辑未改密码时携带 originalDataSourceId） */
export async function testDataSourceConnection(
  request: TestConnectionRequest,
): Promise<ApiResponse<TestConnectionResult>> {
  const res = await http.post<ApiResponse<TestConnectionResult>>(
    '/api/data-sources/test-connection',
    request,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** GET /api/data-sources/target-options（目标库候选） */
export async function fetchTargetOptions(): Promise<ApiResponse<TargetOptionVO[]>> {
  const res = await http.get<ApiResponse<TargetOptionVO[]>>('/api/data-sources/target-options', {
    timeout: REQUEST_TIMEOUT,
  })
  return res.data
}

/** GET /api/data-sources/{dataSourceId}/biz-attr（业务属性读取） */
export async function fetchBizAttr(dataSourceId: string): Promise<ApiResponse<BizAttrVO>> {
  const res = await http.get<ApiResponse<BizAttrVO>>(
    `/api/data-sources/${encodeURIComponent(dataSourceId)}/biz-attr`,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** PUT /api/data-sources/{dataSourceId}/biz-attr（业务属性保存，原样保存） */
export async function saveBizAttr(
  dataSourceId: string,
  request: BizAttrSaveRequest,
): Promise<ApiResponse<null>> {
  const res = await http.put<ApiResponse<null>>(
    `/api/data-sources/${encodeURIComponent(dataSourceId)}/biz-attr`,
    request,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** GET /api/data-sources/{sourceId}/naming-strategies（目标库命名策略列表） */
export async function fetchNamingStrategies(
  sourceId: string,
): Promise<ApiResponse<NamingStrategyVO[]>> {
  const res = await http.get<ApiResponse<NamingStrategyVO[]>>(
    `/api/data-sources/${encodeURIComponent(sourceId)}/naming-strategies`,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** POST /api/data-sources/{sourceId}/naming-strategies（新增命名策略） */
export async function createNamingStrategy(
  sourceId: string,
  request: NamingStrategySaveRequest,
): Promise<ApiResponse<null>> {
  const res = await http.post<ApiResponse<null>>(
    `/api/data-sources/${encodeURIComponent(sourceId)}/naming-strategies`,
    request,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** PUT /api/data-sources/{sourceId}/naming-strategies/{originalTargetId}（编辑命名策略） */
export async function updateNamingStrategy(
  sourceId: string,
  originalTargetId: string,
  request: NamingStrategySaveRequest,
): Promise<ApiResponse<null>> {
  const res = await http.put<ApiResponse<null>>(
    `/api/data-sources/${encodeURIComponent(sourceId)}/naming-strategies/${encodeURIComponent(originalTargetId)}`,
    request,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}

/** DELETE /api/data-sources/{sourceId}/naming-strategies/{targetId}（删除命名策略） */
export async function deleteNamingStrategy(
  sourceId: string,
  targetId: string,
): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(
    `/api/data-sources/${encodeURIComponent(sourceId)}/naming-strategies/${encodeURIComponent(targetId)}`,
    { timeout: REQUEST_TIMEOUT },
  )
  return res.data
}
