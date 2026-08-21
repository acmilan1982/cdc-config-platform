import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LogListVO, LogListResponse } from '@/types/logQuery'
import type { ApiResponse } from '@/types/monitor'
import { useLogQueryTab, ALL_DATA_SOURCE } from './useLogQueryTab'

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
