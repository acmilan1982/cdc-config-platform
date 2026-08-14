// Generic paginated result, reusable across API calls
export interface PageResult<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
  pages: number
}

// ==================== API-1: Summary ====================

export interface JobFailureSummaryVO {
  clientId: string
  clientName?: string | null
  dataSourceId: string
  dataSourceName?: string | null
  dataSourceOrg?: string | null
  dataSourceActive?: boolean | null
  dataSourceExists: boolean
  clientOnline?: boolean | null
  jobOnline?: boolean | null
  jobStatus: string
  latestFailureTime?: string | null
  latestRecoveryTime?: string | null
  latestEventId?: number | null
  latestFaultRootId?: number | null
  latestRestartCount: number
  eventCountInWindow: number
}

// ==================== API-2/4: Fault Process Detail ====================

export interface FaultProcessDetailVO {
  faultRootId: number
  faultRootIdText?: string | null
  clientId: string
  dataSourceId: string
  dataSourceOrg?: string | null
  dataSourceExists: boolean
  dataSourceActive?: boolean | null
  firstFailureTime?: string | null
  lastHandleTime?: string | null
  jobChain: JobChainVO[]
  mainChainEvents: EventCardVO[]
  excludedEvents: EventCardVO[]
  handleTimeline: HandleTimelineVO[]
  restartCount: number
  recordStatus?: string | null
  recordStatusLabel?: string | null
  faultProcessResult?: string | null
  faultProcessResultLabel?: string | null
  anomalies: AnomalyVO[]
}

export interface JobChainVO {
  jobId: string
  nodeType: string
  nodeTypeLabel: string
  hasAnomaly: boolean
}

export interface EventCardVO {
  eventId: number
  eventIdText?: string | null
  failedJobId: string
  failureTime?: string | null
  eventResult?: string | null
  validity?: string | null
  validityLabel?: string | null
  hasDuplicateIgnoredLog: boolean
}

export interface HandleTimelineVO {
  logId: number
  logIdText?: string | null
  eventId: number
  handleStage?: string | null
  handleTime?: string | null
  attemptNo?: number | null
  newJobId?: string | null
}

export interface AnomalyVO {
  type: string
  typeLabel: string
  description?: string | null
  involvedEventIds?: number[] | null
}

// ==================== API-3: History ====================

export interface FaultProcessSummaryVO {
  faultRootId: number
  faultRootIdText?: string | null
  startTime?: string | null
  lastRecordTime?: string | null
  startFailedJobId?: string | null
  lastSubmittedJobId?: string | null
  mainChainEventCount: number
  restartCount: number
  recordStatus?: string | null
  recordStatusLabel?: string | null
  faultProcessResult?: string | null
  faultProcessResultLabel?: string | null
  hasAnomalies: boolean
}

export interface HistoryQuery {
  clientId: string
  dataSourceId: string
  startTime?: string
  endTime?: string
  pageNum: number
  pageSize: number
}

// ==================== API-5: CLOB ====================

export interface ClobDetailVO {
  recordType: string
  recordId: number
  recordIdText?: string | null
  contentType?: string | null
  content?: string | null
  contentLength: number
  truncated: boolean
}
