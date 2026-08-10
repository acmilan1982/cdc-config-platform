import http from '@/services/http'
import type { ApiResponse } from '@/types/monitor'
import type { DashboardVO } from '@/types/largeScreen'

export async function fetchDashboard(): Promise<ApiResponse<DashboardVO>> {
  const res = await http.get<ApiResponse<DashboardVO>>('/api/large-screen/dashboard')
  return res.data
}
