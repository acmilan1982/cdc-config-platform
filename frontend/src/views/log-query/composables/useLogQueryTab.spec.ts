import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { LogListVO, LogListResponse } from '@/types/logQuery'
import type { ApiResponse } from '@/types/monitor'
import {
  useLogQueryTab,
  ALL_DATA_SOURCE,
  currentNaturalDay,
  deriveTabQueryStatus,
} from './useLogQueryTab'

vi.mock('@/api/logQuery', () => ({
  searchLogs: vi.fn(),
}))

import { searchLogs } from '@/api/logQuery'

const mockedSearch = vi.mocked(searchLogs)

function okList(items: LogListVO[], hasNext = false, nextCursor?: string): ApiResponse<LogListResponse> {
  return { code: 200, message: 'success', timestamp: '', data: { items, hasNext, nextCursor } }
}

function row(id: string): LogListVO {
  return {
    cdcLogId: id,
    hasLogDetail: false,
    hasRawMessage: false,
    targetTime: '2026-08-20 10:00:00',
  }
}

beforeEach(() => {
  mockedSearch.mockReset()
})

describe('useLogQueryTab', () => {
  it('“全部”哨兵提交时不携带具体数据源 ID 数组（LQ-DESIGN-171）', async () => {
    mockedSearch.mockResolvedValue(okList([]))
    const tab = useLogQueryTab('error', () => 0)
    tab.reinitialize()
    expect(tab.form.sourceDataSourceIds).toEqual([ALL_DATA_SOURCE])
    expect(tab.form.targetDataSourceIds).toEqual([ALL_DATA_SOURCE])

    await tab.query()

    const payload = mockedSearch.mock.calls[0][0]
    expect(payload.logType).toBe('error')
    expect(payload.sourceDataSourceIds).toBeUndefined()
    expect(payload.targetDataSourceIds).toBeUndefined()
  })

  it('重置清除校验错误但保留列表、已生效条件和游标（LQ-DESIGN-172）', async () => {
    mockedSearch.mockResolvedValue(okList([row('1')], true, 'C1'))
    const tab = useLogQueryTab('error', () => 0)
    tab.reinitialize()
    await tab.query()
    expect(tab.applied).not.toBeNull()
    expect(tab.items).toHaveLength(1)

    tab.form.timeRange = null
    await tab.query()
    expect(tab.validationError).not.toBe('')

    await tab.reset()

    expect(tab.validationError).toBe('')
    expect(tab.applied).not.toBeNull()
    expect(tab.items).toHaveLength(1)
    expect(tab.requestCursorStack).toEqual([null])
  })

  it('两个 Tab 状态完全独立（LQ-DESIGN-173）', async () => {
    mockedSearch.mockResolvedValue(okList([]))
    const errorTab = useLogQueryTab('error', () => 0)
    const correctTab = useLogQueryTab('correct', () => 0)
    errorTab.reinitialize()
    correctTab.reinitialize()

    await errorTab.query()
    correctTab.form.sourceTableName = 'T_X'

    expect(errorTab.form.sourceTableName).toBe('')
    expect(errorTab.applied).not.toBeNull()
    expect(correctTab.applied).toBeNull()
    expect(correctTab.items).toHaveLength(0)
    expect(errorTab.items).toHaveLength(0)
  })

  it('三页游标序列及上一页/下一页失败原子性（LQ-DESIGN-174）', async () => {
    const tab = useLogQueryTab('error', () => 0)
    tab.reinitialize()

    mockedSearch.mockResolvedValueOnce(okList([], true, 'C1'))
    await tab.query()
    expect(tab.requestCursorStack).toEqual([null])
    expect(tab.hasNext).toBe(true)

    mockedSearch.mockResolvedValueOnce(okList([], true, 'C2'))
    await tab.nextPage()
    expect(tab.requestCursorStack).toEqual([null, 'C1'])

    mockedSearch.mockResolvedValueOnce(okList([], false, undefined))
    await tab.nextPage()
    expect(tab.requestCursorStack).toEqual([null, 'C1', 'C2'])

    // 上一页失败：不弹栈
    mockedSearch.mockRejectedValueOnce(new Error('network'))
    await tab.prevPage()
    expect(tab.requestCursorStack).toEqual([null, 'C1', 'C2'])
    expect(tab.error).not.toBeNull()

    // 上一页成功：弹栈并回到上一页游标
    mockedSearch.mockResolvedValueOnce(okList([], true, 'C1'))
    await tab.prevPage()
    expect(tab.requestCursorStack).toEqual([null, 'C1'])
  })

  it('重新初始化后旧请求响应被丢弃（LQ-DESIGN-179）', async () => {
    const tab = useLogQueryTab('error', () => 0)
    tab.reinitialize()

    let resolveOld!: (v: ApiResponse<LogListResponse>) => void
    let resolveNew!: (v: ApiResponse<LogListResponse>) => void
    mockedSearch.mockImplementationOnce(
      () => new Promise((res) => { resolveOld = res }),
    )
    const p1 = tab.query()

    // 重新初始化作废在途请求
    tab.reinitialize()
    expect(tab.initialQueryAttempted).toBe(false)
    expect(tab.items).toHaveLength(0)
    expect(tab.requestCursorStack).toEqual([null])

    mockedSearch.mockImplementationOnce(
      () => new Promise((res) => { resolveNew = res }),
    )
    const p2 = tab.query()

    // 旧响应先返回，不得覆盖重新初始化后的新状态
    resolveOld(okList([row('old')]))
    await p1
    expect(tab.items).toHaveLength(0)

    resolveNew(okList([row('new')]))
    await p2
    expect(tab.items).toHaveLength(1)
    expect(tab.items[0].cdcLogId).toBe('new')
  })

  it('cdcLogId 超过 JavaScript 安全整数后仍以字符串往返（LQ-DESIGN-181）', async () => {
    const big = '7755033852453421056'
    expect(Number(big) > Number.MAX_SAFE_INTEGER).toBe(true)
    mockedSearch.mockResolvedValue(okList([row(big)]))
    const tab = useLogQueryTab('error', () => 0)
    tab.reinitialize()
    await tab.query()
    expect(typeof tab.items[0].cdcLogId).toBe('string')
    expect(tab.items[0].cdcLogId).toBe(big)
  })
})

describe('正确日志缺省查询与查询状态推导（LOG-QUERY-CURSOR-CORRECT-TAB-ADJUSTMENT-001）', () => {
  it('缺省条件直接点击查询：请求为当天时间范围且不携带“全部”的具体数据源 ID 数组', async () => {
    mockedSearch.mockResolvedValue(okList([]))
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    const [start, end] = currentNaturalDay()
    await tab.query()

    const payload = mockedSearch.mock.calls[0][0]
    expect(payload.logType).toBe('correct')
    expect(payload.startTime).toBe(start)
    expect(payload.endTime).toBe(end)
    expect(payload.sourceDataSourceIds).toBeUndefined()
    expect(payload.targetDataSourceIds).toBeUndefined()
  })

  it('正确日志重置不触发查询，并保留已生效条件与列表（表单/已生效条件分离）', async () => {
    mockedSearch.mockResolvedValue(okList([row('1')]))
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    await tab.query()
    expect(tab.applied).not.toBeNull()
    expect(tab.items).toHaveLength(1)

    mockedSearch.mockClear()
    tab.form.sourceTableName = 'T_X'
    tab.reset()
    expect(mockedSearch).not.toHaveBeenCalled()
    expect(tab.applied).not.toBeNull()
    expect(tab.items).toHaveLength(1)
    expect(tab.form.sourceTableName).toBe('')
  })

  it('查询状态推导覆盖 NOT_QUERIED/LOADING/SUCCESS_WITH_DATA/SUCCESS_EMPTY/FAILED', async () => {
    // NOT_QUERIED：缺省条件已填充但尚未查询
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    expect(deriveTabQueryStatus(tab)).toBe('NOT_QUERIED')
    expect(tab.form.sourceDataSourceIds).toEqual([ALL_DATA_SOURCE])
    expect(tab.form.targetDataSourceIds).toEqual([ALL_DATA_SOURCE])
    expect(tab.form.timeRange).not.toBeNull()

    // LOADING：用户发起查询后立即进入加载
    let resolve!: (v: ApiResponse<LogListResponse>) => void
    mockedSearch.mockImplementationOnce(() => new Promise((res) => { resolve = res }))
    const p = tab.query()
    expect(deriveTabQueryStatus(tab)).toBe('LOADING')

    // SUCCESS_WITH_DATA
    resolve(okList([row('1')], true, 'C1'))
    await p
    expect(deriveTabQueryStatus(tab)).toBe('SUCCESS_WITH_DATA')

    // SUCCESS_EMPTY：成功但无数据，区别于 NOT_QUERIED
    mockedSearch.mockResolvedValueOnce(okList([]))
    await tab.query()
    expect(tab.items).toHaveLength(0)
    expect(deriveTabQueryStatus(tab)).toBe('SUCCESS_EMPTY')

    // FAILED
    mockedSearch.mockRejectedValueOnce(new Error('timeout'))
    await tab.query()
    expect(tab.error).not.toBeNull()
    expect(deriveTabQueryStatus(tab)).toBe('FAILED')
  })
})

describe('正确日志 initialQueryAttempted（LOG-QUERY-CURSOR-CORRECT-TAB-ADJUSTMENT-001-R1 / R1-02）', () => {
  it('创建/重新初始化后为 false（R1-02-1/8）', () => {
    const tab = useLogQueryTab('correct', () => 0)
    expect(tab.initialQueryAttempted).toBe(false)
    tab.reinitialize()
    expect(tab.initialQueryAttempted).toBe(false)
  })

  it('首次切换但尚未点击查询时仍为 false（R1-02-2）', () => {
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    expect(tab.initialQueryAttempted).toBe(false)
    expect(tab.applied).toBeNull()
    expect(tab.items).toHaveLength(0)
  })

  it('表单校验失败时仍为 false，且不调用 API（R1-02-3）', async () => {
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    tab.form.timeRange = null
    await tab.query()
    expect(tab.initialQueryAttempted).toBe(false)
    expect(tab.validationError).not.toBe('')
    expect(mockedSearch).not.toHaveBeenCalled()
  })

  it('手动查询成功后为 true（R1-02-4）', async () => {
    mockedSearch.mockResolvedValue(okList([]))
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    await tab.query()
    expect(tab.initialQueryAttempted).toBe(true)
    expect(mockedSearch).toHaveBeenCalledTimes(1)
  })

  it('手动查询业务失败后仍为 true（R1-02-5）', async () => {
    mockedSearch.mockResolvedValue({ code: 40015, message: '游标已失效', timestamp: '', data: null as unknown as LogListResponse })
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    await tab.query()
    expect(tab.initialQueryAttempted).toBe(true)
    expect(tab.error).not.toBeNull()
  })

  it('手动查询网络失败或超时后仍为 true（R1-02-6）', async () => {
    mockedSearch.mockRejectedValue(new Error('timeout'))
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    await tab.query()
    expect(tab.initialQueryAttempted).toBe(true)
    expect(tab.error).not.toBeNull()
  })

  it('后续再次查询保持 true（R1-02 后续查询）', async () => {
    mockedSearch.mockResolvedValue(okList([]))
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    await tab.query()
    await tab.query()
    expect(tab.initialQueryAttempted).toBe(true)
    expect(mockedSearch).toHaveBeenCalledTimes(2)
  })

  it('完整重新初始化后恢复为 false（R1-02-8）', async () => {
    mockedSearch.mockResolvedValue(okList([]))
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    await tab.query()
    expect(tab.initialQueryAttempted).toBe(true)
    tab.reinitialize()
    expect(tab.initialQueryAttempted).toBe(false)
  })
})

describe('查询加载等待与前端 30 秒超时（LOG-QUERY-USER-VISUAL-ACCEPTANCE-SUPPLEMENT-001）', () => {
  function timeoutError(): Error {
    return Object.assign(new Error('timeout of 30000ms exceeded'), { code: 'ECONNABORTED' })
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('查询开始立即进入加载并保留原列表不先清空（LQ-AC-116）', async () => {
    mockedSearch.mockResolvedValue(okList([row('1')]))
    const tab = useLogQueryTab('error', () => 0)
    tab.reinitialize()
    await tab.query()
    expect(tab.items).toHaveLength(1)

    let resolve!: (v: ApiResponse<LogListResponse>) => void
    mockedSearch.mockImplementationOnce(() => new Promise((res) => { resolve = res }))
    const p = tab.query()
    expect(tab.loading).toBe(true)
    expect(deriveTabQueryStatus(tab)).toBe('LOADING')
    // 加载期间原列表不被清空
    expect(tab.items).toHaveLength(1)
    expect(tab.items[0].cdcLogId).toBe('1')

    resolve(okList([row('2')]))
    await p
    expect(tab.items).toHaveLength(1)
    expect(tab.items[0].cdcLogId).toBe('2')
  })

  it('查询期间等待秒数动态递增并在请求结束后停止（LQ-AC-117）', async () => {
    mockedSearch.mockImplementationOnce(
      () => new Promise((res) => { setTimeout(() => res(okList([])), 5000) }),
    )
    const tab = useLogQueryTab('error', () => 0)
    tab.reinitialize()
    const p = tab.query()
    expect(tab.elapsed).toBe(0)

    await vi.advanceTimersByTimeAsync(2000)
    expect(tab.elapsed).toBe(2)

    await vi.advanceTimersByTimeAsync(3000)
    expect(tab.elapsed).toBe(5)
    await p
    expect(tab.loading).toBe(false)
    const frozen = tab.elapsed
    await vi.advanceTimersByTimeAsync(2000)
    expect(tab.elapsed).toBe(frozen)
  })

  it('请求超过 30 秒未返回时进入超时错误路径，加载结束、计时停止、不自动重试（LQ-AC-120）', async () => {
    mockedSearch.mockImplementationOnce(
      () => new Promise((_res, rej) => { setTimeout(() => rej(timeoutError()), 30000) }),
    )
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()

    const p = tab.query()
    await vi.advanceTimersByTimeAsync(20000)
    expect(tab.loading).toBe(true)
    expect(tab.elapsed).toBe(20)
    expect(deriveTabQueryStatus(tab)).toBe('LOADING')

    // 30 秒边界到达 → 超时拒绝 → 错误路径
    await vi.advanceTimersByTimeAsync(10000)
    await p
    expect(tab.loading).toBe(false)
    expect(tab.error).toBe('查询超时，请缩小查询范围或增加筛选条件后重试')
    expect(deriveTabQueryStatus(tab)).toBe('FAILED')
    expect(mockedSearch).toHaveBeenCalledTimes(1)

    // 等待计时停止，不无限旋转
    const frozen = tab.elapsed
    await vi.advanceTimersByTimeAsync(3000)
    expect(tab.elapsed).toBe(frozen)
  })

  it('超时后旧列表、已生效条件与游标保留，表单可编辑、可再次查询、不自动重试（LQ-AC-125）', async () => {
    mockedSearch.mockResolvedValueOnce(okList([row('1')], true, 'C1'))
    const tab = useLogQueryTab('correct', () => 0)
    tab.reinitialize()
    await tab.query()
    expect(tab.items).toHaveLength(1)
    expect(tab.applied).not.toBeNull()
    expect(tab.hasNext).toBe(true)
    expect(tab.nextCursor).toBe('C1')

    // 第二次查询模拟超过 30 秒未返回 → 超时
    mockedSearch.mockImplementationOnce(
      () => new Promise((_res, rej) => { setTimeout(() => rej(timeoutError()), 30000) }),
    )
    const p2 = tab.query()
    await vi.advanceTimersByTimeAsync(30000)
    await p2

    expect(tab.loading).toBe(false)
    expect(tab.error).toBe('查询超时，请缩小查询范围或增加筛选条件后重试')
    // 旧列表、已生效条件与游标历史保持不变
    expect(tab.items).toHaveLength(1)
    expect(tab.items[0].cdcLogId).toBe('1')
    expect(tab.applied).not.toBeNull()
    expect(tab.requestCursorStack).toEqual([null])
    expect(tab.hasNext).toBe(true)
    expect(tab.nextCursor).toBe('C1')
    // 不自动重试
    expect(mockedSearch).toHaveBeenCalledTimes(2)

    // 查询条件仍可编辑
    tab.form.sourceTableName = 'T_X'
    expect(tab.form.sourceTableName).toBe('T_X')

    // 可再次手动查询
    mockedSearch.mockResolvedValueOnce(okList([row('2')]))
    await tab.query()
    expect(mockedSearch).toHaveBeenCalledTimes(3)
    expect(tab.items).toHaveLength(1)
    expect(tab.items[0].cdcLogId).toBe('2')
    expect(tab.error).toBeNull()
  })
})
