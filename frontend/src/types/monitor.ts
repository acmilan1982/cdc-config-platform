export interface ZooKeeperJobVO {
  jobName: string
  jobPath: string
  displayName: string
  running: boolean | null
  statusCode: string | null
  statusMessage: string | null
  detailInfo: string | null
  scn: string | null
  scnUpdateTime: string | null
  scnStale: boolean | null
  scnStaleThresholdHours: number | null
  scnStaleDurationSeconds: number | null
  readStatus: string
  warnings: string[] | null
}

export interface ZooKeeperClientVO {
  clientName: string
  clientPath: string
  online: boolean
  ip: string | null
  statusCode: string | null
  statusMessage: string | null
  detailInfo: string | null
  updateTime: string | null
  pid: string
  instanceId: string
  startTime: string
  readStatus: string
  warnings: string[] | null
  jobs: ZooKeeperJobVO[]
}

export interface ZooKeeperClientMonitorResponse {
  refreshedAt: string
  source: string
  partialFailure: boolean
  warnings: string[]
  clients: ZooKeeperClientVO[]
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: string
}

export interface ZooKeeperHealthResponse {
  connected: boolean
  connectString: string
  rootPath: string
  checkedAt: string
  errorMessage: string | null
}
