import http from '@/services/http'
import type { ApiResponse } from '@/types/monitor'
import type {
  JobFailureSummaryVO,
  FaultHistorySummaryVO,
  FaultHistoryListQuery,
  FaultProcessDetailVO,
  FaultProcessSummaryVO,
  HistoryQuery,
  ClobDetailVO,
  PageResult
} from '@/types/jobFailure'

export async function fetchSummary(): Promise<ApiResponse<JobFailureSummaryVO[]>> {
  const res = await http.get<ApiResponse<JobFailureSummaryVO[]>>('/api/job-failure/summary')
  return res.data
}

export async function fetchLatestFault(
  clientId: string, dataSourceId: string
): Promise<ApiResponse<FaultProcessDetailVO>> {
  const res = await http.get<ApiResponse<FaultProcessDetailVO>>(
    `/api/job-failure/latest/${encodeURIComponent(clientId)}/${encodeURIComponent(dataSourceId)}`
  )
  return res.data
}

export async function fetchHistory(
  clientId: string, dataSourceId: string, params: Partial<HistoryQuery>
): Promise<ApiResponse<PageResult<FaultProcessSummaryVO>>> {
  const res = await http.get<ApiResponse<PageResult<FaultProcessSummaryVO>>>(
    `/api/job-failure/history/${encodeURIComponent(clientId)}/${encodeURIComponent(dataSourceId)}`,
    { params }
  )
  return res.data
}

export async function fetchHistorySummary(
  clientId?: string
): Promise<ApiResponse<FaultHistorySummaryVO[]>> {
  const res = await http.get<ApiResponse<FaultHistorySummaryVO[]>>(
    '/api/job-failure/history/summary',
    { params: clientId ? { clientId } : undefined }
  )
  return res.data
}

export async function fetchFaultHistoryList(
  params: FaultHistoryListQuery
): Promise<ApiResponse<PageResult<FaultProcessSummaryVO>>> {
  const res = await http.get<ApiResponse<PageResult<FaultProcessSummaryVO>>>(
    '/api/job-failure/history/list',
    { params }
  )
  return res.data
}

export async function fetchProcessDetail(
  faultRootId: string
): Promise<ApiResponse<FaultProcessDetailVO>> {
  const res = await http.get<ApiResponse<FaultProcessDetailVO>>(
    `/api/job-failure/process/${encodeURIComponent(faultRootId)}`
  )
  return res.data
}

export async function fetchClobDetail(
  faultRootId: string, clobField: string, recordId: string
): Promise<ApiResponse<ClobDetailVO>> {
  const res = await http.get<ApiResponse<ClobDetailVO>>(
    `/api/job-failure/clob/${encodeURIComponent(faultRootId)}/${encodeURIComponent(clobField)}/${encodeURIComponent(recordId)}`
  )
  return res.data
}
