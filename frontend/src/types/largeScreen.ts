export interface CoreMetricsVO {
  todaySync: number
  cumulativeSync: number
  todaySuccess: number
  todayError: number
  todaySuccessRate: number
}

export interface CoverageStatsVO {
  institutionCount: number
  clientCount: number
  sourceDbCount: number
  targetDbCount: number
  subscribeTableCount: number
}

export interface DataRatioVO {
  successCount: number
  errorCount: number
}

export interface DailyTrendVO {
  date: string
  weekday: string
  count: number
}

export interface TopItemVO {
  rank: number
  key: string
  name: string
  successCount: number
  errorCount: number
  totalCount: number
}

export interface Top10VO {
  sourceDatabases: TopItemVO[]
  targetDatabases: TopItemVO[]
  tables: TopItemVO[]
}

export interface OrgRankVO {
  rank: number
  orgName: string
  todaySync: number
  todaySuccess: number
  todayError: number
  todaySuccessRate: number
  cumulativeSync: number
  lastDataTime: string
}

export interface DataFlowVO {
  sourceDb: string
  sourceOrg: string
  targetDb: string
  tableCount: number
}

export interface DashboardVO {
  title: string
  subtitle: string
  dataUpdateTime: string
  dataStatus: string
  coreMetrics: CoreMetricsVO
  coverageStats: CoverageStatsVO
  cumulativeRatio: DataRatioVO
  todayRatio: DataRatioVO
  sevenDayTrend: DailyTrendVO[]
  top: Top10VO
  orgDetails: OrgRankVO[]
  dataFlows: DataFlowVO[]
}
