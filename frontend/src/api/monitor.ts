import http from '@/services/http'
import type {
  ApiResponse,
  ZooKeeperClientMonitorResponse,
  ZooKeeperHealthResponse
} from '@/types/monitor'

export async function fetchClients(): Promise<ApiResponse<ZooKeeperClientMonitorResponse>> {
  const res = await http.get<ApiResponse<ZooKeeperClientMonitorResponse>>('/api/monitor/zookeeper/clients')
  return res.data
}

export async function fetchZkHealth(): Promise<ApiResponse<ZooKeeperHealthResponse>> {
  const res = await http.get<ApiResponse<ZooKeeperHealthResponse>>('/api/monitor/zookeeper/health')
  return res.data
}
