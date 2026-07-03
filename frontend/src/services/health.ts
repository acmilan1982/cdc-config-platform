import http from './http'

export interface HealthInfo {
  status: string
  appName: string
  currentTime: string
}

export async function checkHealth(): Promise<HealthInfo | null> {
  try {
    const res = await http.get('/api/health')
    return res.data?.data as HealthInfo
  } catch {
    return null
  }
}
