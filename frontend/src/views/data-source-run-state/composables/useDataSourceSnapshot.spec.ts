import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ApiResponse } from '@/types/monitor'
import type {
  AppliedCriteria,
  CandidateGroup,
  DataSourceSnapshotQueryParams,
  SnapshotStatusItem,
  SnapshotStatusListResult,
  StatusToken,
} from '@/types/dataSourceSnapshot'
import { useDataSourceSnapshot, AUTO_REFRESH_INTERVAL_MS, REFRESH_FAIL_MESSAGE } from './useDataSourceSnapshot'

vi.mock('@/api/dataSourceSnapshot', () => ({
  fetchSnapshotStatusList: vi.fn(),
}))

import { fetchSnapshotStatusList } from '@/api/dataSourceSnapshot'

const mockedFetch = vi.mocked(fetchSnapshotStatusList)

function row(
  clientId = 'hosp-012',
  sourceId = '112-source-19c',
  statusCategory: StatusToken = 'RUNNING',
  raw = 'SNAPSHOT_RUNNING',
): SnapshotStatusItem {
  return {
    clientId,
    clientRef: { state: 'ACTIVE', desc: 'HIS 探针示例' },
    sourceId,
    sourceRef: { state: 'ACTIVE', org: '示例医院源库', category: 'SOURCE', sourceRole: true },
    snapshotStatus: raw,
    statusCategory,
    snapshotLastSeenAt: '2026-08-17 17:28:46',
    snapshotCompletedAt: null,
    updatedAt: '2026-08-17 17:28:46',
  }
}

function candidates(): CandidateGroup {
  return {
    clients: [{ id: 'hosp-012', desc: 'HIS 探针示例', active: true }],
    sources: [{ id: '112-source-19c', org: '示例医院源库', active: true }],
    statuses: ['RUNNING', 'COMPLETED'],
  }
}

function okRes(records: SnapshotStatusItem[], cand: CandidateGroup = candidates()): ApiResponse<SnapshotStatusListResult> {
  const data: SnapshotStatusListResult = { records, candidates: cand }
  return { code: 200, message: 'success', timestamp: '', data }
}

function allApplied(): AppliedCriteria {
  return { clientIds: [], sourceIds: [], statuses: [] }
}

function paramsToCriteria(params: DataSourceSnapshotQueryParams): AppliedCriteria {
  return { clientIds: params.clientId, sourceIds: params.sourceId, statuses: params.status as StatusToken[] }
}

function setup() {
  const ctl = useDataSourceSnapshot()
  return ctl
}

/** 冲刷当前 microtask 链（onPageMounted/launch 返回 void，无法直接 await）。 */
async function settle(): Promise<void> {
  for (let i = 0; i < 16; i++) await Promise.resolve()
}

beforeEach(() => {
  mockedFetch.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('useDataSourceSnapshot 首次进入与两阶段提交（DESIGN §7/§8 E1~E3/E6）', () => {
  it('E1 首次进入用三项“全部”（三维空）发起请求；成功建立已应用条件与最近成功刷新时间', async () => {
    mockedFetch.mockResolvedValue(okRes([row()]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()

    expect(mockedFetch).toHaveBeenCalledTimes(1)
    expect(mockedFetch.mock.calls[0][0]).toEqual({ clientId: [], sourceId: [], status: [] })
    expect(ctl.appliedCriteria.value).toEqual(allApplied())
    expect(ctl.hasSuccess.value).toBe(true)
    expect(ctl.records.value).toHaveLength(1)
    expect(ctl.firstLoadError.value).toBe(false)
    expect(ctl.lastRefreshText.value).not.toBe('--')
    expect(ctl.candidateStatuses.value).toEqual(['RUNNING', 'COMPLETED'])
  })

  it('E3 点击查询成功才把请求快照升级为已应用条件（含成功空结果）', async () => {
    mockedFetch.mockResolvedValue(okRes([row()]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()

    mockedFetch.mockResolvedValue(okRes([]))
    ctl.submitQuery(['hosp-012'], ['112-source-19c'], ['RUNNING'])
    await settle()

    expect(ctl.appliedCriteria.value).toEqual({
      clientIds: ['hosp-012'],
      sourceIds: ['112-source-19c'],
      statuses: ['RUNNING'],
    })
    expect(ctl.records.value).toEqual([])
    expect(ctl.hasSuccess.value).toBe(true)
    const lastParams = mockedFetch.mock.calls[mockedFetch.mock.calls.length - 1][0]
    expect(paramsToCriteria(lastParams)).toEqual(ctl.appliedCriteria.value)
  })

  it('E6 查询失败保留上一次成功数据与条件，仅给内联收敛提示，不清表', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A')]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()
    const before = ctl.appliedCriteria.value

    mockedFetch.mockRejectedValue(new Error('network'))
    ctl.submitQuery(['B'], [], [])
    await settle()

    expect(ctl.appliedCriteria.value).toEqual(before)
    expect(ctl.records.value.map((r) => r.clientId)).toEqual(['A'])
    expect(ctl.hasSuccess.value).toBe(true)
    expect(ctl.refreshError.value).toBe(REFRESH_FAIL_MESSAGE)
  })

  it('E1/E14 首次失败进入整区错误态；重新加载成功恢复（A 仍为三项“全部”）', async () => {
    mockedFetch.mockRejectedValue(new Error('network'))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()

    expect(ctl.hasSuccess.value).toBe(false)
    expect(ctl.firstLoadError.value).toBe(true)
    expect(ctl.appliedCriteria.value).toEqual(allApplied())

    mockedFetch.mockResolvedValue(okRes([row()]))
    ctl.retry()
    await settle()
    expect(ctl.firstLoadError.value).toBe(false)
    expect(ctl.hasSuccess.value).toBe(true)
    expect(ctl.appliedCriteria.value).toEqual(allApplied())
  })
})

describe('useDataSourceSnapshot 刷新语义与自动刷新（DESIGN §8 E8/E9，AC-024/047）', () => {
  it('E8 立即刷新成功只更新结果与最近成功时间，不替换已应用条件', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A')]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()
    ctl.submitQuery(['hosp-012'], [], [])
    await settle()
    const before = ctl.appliedCriteria.value

    mockedFetch.mockResolvedValue(okRes([row('A2', 'src-9', 'COMPLETED', 'SNAPSHOT_COMPLETED')]))
    ctl.manualRefresh()
    await settle()

    expect(ctl.appliedCriteria.value).toEqual(before)
    expect(ctl.records.value[0].clientId).toBe('A2')
    expect(ctl.refreshError.value).toBe('')
  })

  it('E9 自动刷新固定 60s：59s 内不请求，第 60s 按已应用条件轻量刷新', async () => {
    vi.useFakeTimers()
    mockedFetch.mockResolvedValue(okRes([row()]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()
    ctl.submitQuery(['hosp-012'], [], [])
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS - 1)
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1)
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(3)
    const lastParams = mockedFetch.mock.calls[2][0]
    expect(paramsToCriteria(lastParams)).toEqual({ clientIds: ['hosp-012'], sourceIds: [], statuses: [] })
  })

  it('E6/E9 有成功现场后自动刷新失败约 60s 后按已应用条件自动重试', async () => {
    vi.useFakeTimers()
    mockedFetch.mockResolvedValue(okRes([row()]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(1)

    mockedFetch.mockRejectedValue(new Error('network'))
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS)
    await settle()
    expect(ctl.refreshError.value).toBe(REFRESH_FAIL_MESSAGE)
    expect(ctl.records.value).toHaveLength(1)

    // 失败也重启 60s：下一周期按原已应用条件自动重试
    mockedFetch.mockResolvedValue(okRes([row('A2')]))
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS)
    await settle()
    expect(ctl.records.value[0].clientId).toBe('A2')
    expect(ctl.refreshError.value).toBe('')
  })
})

describe('useDataSourceSnapshot 单飞行统一忙碌抑制（R1-02，AC-050/051）', () => {
  it('busy 时“立即刷新”点击与自动触发均被抑制：不新增请求、不排队、不补发', async () => {
    vi.useFakeTimers()
    let release!: (v: ApiResponse<SnapshotStatusListResult>) => void
    const gate = new Promise<ApiResponse<SnapshotStatusListResult>>((resolve) => {
      release = resolve
    })
    mockedFetch.mockResolvedValue(okRes([row()]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()

    // 下一次刷新改慢速挂起（busy）
    mockedFetch.mockImplementationOnce(() => gate)
    ctl.manualRefresh()
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(2)
    expect(ctl.busy.value).toBe(true)

    // busy 期间立即刷新被抑制（按钮禁用，点击直接返回）
    ctl.manualRefresh()
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(2)

    // busy 期间推进 3 个周期：auto tick 因 busy 被抑制，不新增请求
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS * 3)
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(2)

    release(okRes([row()]))
    await settle()
    // 挂起请求结束后不残留排队自动刷新
    expect(mockedFetch).toHaveBeenCalledTimes(2)
    expect(ctl.busy.value).toBe(false)
  })

  it('视觉分级：建立性（查询）整表 loading；轻量（立即刷新）工具栏 refreshing', async () => {
    mockedFetch.mockResolvedValue(okRes([row()]))
    const ctl = setup()

    let releaseFirst!: (v: ApiResponse<SnapshotStatusListResult>) => void
    const gateFirst = new Promise<ApiResponse<SnapshotStatusListResult>>((resolve) => {
      releaseFirst = resolve
    })
    mockedFetch.mockImplementationOnce(() => gateFirst)
    ctl.onPageMounted()
    await settle()
    expect(ctl.loading.value).toBe(true)
    expect(ctl.refreshing.value).toBe(false)
    expect(ctl.busy.value).toBe(true)

    releaseFirst(okRes([row()]))
    await settle()
    expect(ctl.loading.value).toBe(false)
    expect(ctl.busy.value).toBe(false)

    let releaseRefresh!: (v: ApiResponse<SnapshotStatusListResult>) => void
    const gateRefresh = new Promise<ApiResponse<SnapshotStatusListResult>>((resolve) => {
      releaseRefresh = resolve
    })
    mockedFetch.mockImplementationOnce(() => gateRefresh)
    ctl.manualRefresh()
    await settle()
    expect(ctl.loading.value).toBe(false)
    expect(ctl.refreshing.value).toBe(true)
    expect(ctl.busy.value).toBe(true)

    releaseRefresh(okRes([row()]))
    await settle()
    expect(ctl.refreshing.value).toBe(false)
    expect(ctl.busy.value).toBe(false)
  })
})

describe('useDataSourceSnapshot 隐藏/恢复可见（DESIGN §7.7，R1-03，AC-048/051）', () => {
  it('E11 隐藏停止自动刷新；恢复空闲立即按已应用条件刷新并重启 60s', async () => {
    vi.useFakeTimers()
    mockedFetch.mockResolvedValue(okRes([row()]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(1)

    ctl.visibilityChanged(true)
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS * 3)
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(1)

    ctl.visibilityChanged(false)
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(2)
    // 恢复刷新参数取已应用条件
    expect(paramsToCriteria(mockedFetch.mock.calls[1][0])).toEqual(allApplied())

    // 恢复刷新结束后重启完整 60s
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS)
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(3)
  })

  it('在途时恢复可见只置一次性标志，当前请求结束按届时最新已应用条件补发一次 restore（合并多次可见）', async () => {
    let release!: (v: ApiResponse<SnapshotStatusListResult>) => void
    const gate = new Promise<ApiResponse<SnapshotStatusListResult>>((resolve) => {
      release = resolve
    })
    mockedFetch.mockResolvedValue(okRes([row()]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()

    // 查询 Q 在途（busy）
    mockedFetch.mockImplementationOnce(() => gate)
    ctl.submitQuery(['Q'], [], [])
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(2)

    // 在途恢复可见两次 → 合并为一次待补发，不并发
    ctl.visibilityChanged(false)
    ctl.visibilityChanged(false)
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(2)

    // 在途查询成功：先升级已应用条件为 Q，再在 finally 补发一次 restore（用升级后的新条件）
    release(okRes([row('Q')]))
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(3)
    expect(paramsToCriteria(mockedFetch.mock.calls[2][0])).toEqual({
      clientIds: ['Q'],
      sourceIds: [],
      statuses: [],
    })
  })

  it('在途请求失败后补发 → 补发用保持的旧已应用条件', async () => {
    let release!: (v: ApiResponse<SnapshotStatusListResult>) => void
    const gate = new Promise<ApiResponse<SnapshotStatusListResult>>((resolve) => {
      release = resolve
    })
    mockedFetch.mockResolvedValue(okRes([row('A')]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()
    expect(ctl.appliedCriteria.value).toEqual(allApplied())

    mockedFetch.mockImplementationOnce(() => gate)
    ctl.manualRefresh()
    await settle()
    ctl.visibilityChanged(false) // busy 中恢复 → 置待补发
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(2)

    release(okRes([row('B')]))
    await settle()
    // 补发 restore 用保持的旧已应用条件（A=全部）
    expect(mockedFetch).toHaveBeenCalledTimes(3)
    expect(paramsToCriteria(mockedFetch.mock.calls[2][0])).toEqual(allApplied())
  })

  it('待补发期间再次隐藏/卸载 → 清除标志不补发；隐藏期间不启动计时', async () => {
    let release!: (v: ApiResponse<SnapshotStatusListResult>) => void
    const gate = new Promise<ApiResponse<SnapshotStatusListResult>>((resolve) => {
      release = resolve
    })
    mockedFetch.mockResolvedValue(okRes([row()]))
    const ctl = setup()
    ctl.onPageMounted()
    await settle()

    mockedFetch.mockImplementationOnce(() => gate)
    ctl.manualRefresh()
    await settle()
    ctl.visibilityChanged(false) // busy → 待补发
    ctl.visibilityChanged(true) // 再隐藏 → 清除待补发
    await settle()

    release(okRes([row()]))
    await settle()
    // 隐藏期间补发被清除，不产生 restore
    expect(mockedFetch).toHaveBeenCalledTimes(2)
  })

  it('E16 卸载后迟到响应不写入现场；销毁后不再发起请求', async () => {
    let release!: (v: ApiResponse<SnapshotStatusListResult>) => void
    const gate = new Promise<ApiResponse<SnapshotStatusListResult>>((resolve) => {
      release = resolve
    })
    mockedFetch.mockImplementationOnce(() => gate)
    const ctl = setup()
    ctl.onPageMounted()
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(1)

    ctl.destroy()
    release(okRes([row('LATE')]))
    await settle()

    expect(ctl.hasSuccess.value).toBe(false)
    expect(ctl.records.value).toEqual([])

    ctl.submitQuery(['X'], [], [])
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(1)
  })
})
