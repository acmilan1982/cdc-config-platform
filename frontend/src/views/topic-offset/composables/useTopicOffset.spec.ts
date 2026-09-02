import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { ApiResponse } from '@/types/monitor'
import type { CandidateGroup, TopicOffsetItem, TopicOffsetPageResult, TopicOffsetQueryParams } from '@/types/topicOffset'
import { useTopicOffset, AUTO_REFRESH_INTERVAL_MS } from './useTopicOffset'
import { useTopicOffsetStore } from '@/stores/topicOffset'

vi.mock('@/api/topicOffset', () => ({
  fetchTopicCandidates: vi.fn(),
  fetchTopicOffsets: vi.fn(),
}))

import { fetchTopicCandidates, fetchTopicOffsets } from '@/api/topicOffset'

const mockedOffsets = vi.mocked(fetchTopicOffsets)
const mockedCandidates = vi.mocked(fetchTopicCandidates)

function row(): TopicOffsetItem {
  return {
    serverId: 'SVR1',
    rawTopic: 'cli.src.schema.tbl.tgt',
    nextOffset: '10',
    updatedAt: null,
    kafkaEndOffset: null,
    pendingCount: null,
    consumeLag: null,
    parseable: false,
    parsed: null,
    mapping: null,
  }
}

function candidatesRes(): ApiResponse<CandidateGroup> {
  return { code: 200, message: 'success', timestamp: '', data: { clients: [], sources: [], targets: [] } }
}

/** 默认实现：回显请求页码，按 total/pagesOverride 计算 pages；total=0 → pages=0 空结果。 */
function echoOk(total: number, pagesOverride?: number) {
  return (params: TopicOffsetQueryParams): Promise<ApiResponse<TopicOffsetPageResult>> => {
    const pages = pagesOverride ?? (total > 0 ? Math.ceil(total / 150) : 0)
    const data: TopicOffsetPageResult = {
      pageNum: params.pageNum,
      pageSize: 150,
      total,
      pages,
      unparseableTotal: 0,
      records: total > 0 ? [row()] : [],
    }
    return Promise.resolve({ code: 200, message: 'success', timestamp: '', data })
  }
}

function setup() {
  const notify = vi.fn()
  const ctl = useTopicOffset(notify)
  const store = useTopicOffsetStore()
  return { ctl, store, notify }
}

/** 冲刷当前 microtask 链（onPageMounted 返回 void，无法直接 await）。 */
async function settle(): Promise<void> {
  for (let i = 0; i < 12; i++) await Promise.resolve()
}

beforeEach(() => {
  setActivePinia(createPinia())
  mockedOffsets.mockReset()
  mockedCandidates.mockReset()
  mockedCandidates.mockResolvedValue(candidatesRes())
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('useTopicOffset 首次进入与自动刷新', () => {
  it('无成功现场时挂载用缺省条件（三维空+空表名）请求第 1 页（TOFF-REQ-034/097）', async () => {
    mockedOffsets.mockImplementation(echoOk(1))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()

    expect(store.hasSuccess).toBe(true)
    expect(store.appliedCriteria).toEqual({ clientIds: [], sourceIds: [], targetIds: [], tableName: '' })
    expect(store.pageNum).toBe(1)
    expect(mockedOffsets).toHaveBeenCalledTimes(1)
    expect(mockedOffsets.mock.calls[0][0].pageNum).toBe(1)
  })

  it('自动刷新固定 60s：59s 内不再请求，第 60s 用生效条件+当前页轻量刷新（TOFF-REQ-103）', async () => {
    vi.useFakeTimers()
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(1)
    expect(store.hasSuccess).toBe(true)

    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS - 1)
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)
    // 自动刷新使用已生效条件与当前页，而非草稿
    expect(mockedOffsets.mock.calls[1][0].pageNum).toBe(store.pageNum)
  })

  it('页面隐藏停止自动刷新；重新可见立即刷新一次并重计（TOFF-REQ-106/107）', async () => {
    vi.useFakeTimers()
    mockedOffsets.mockImplementation(echoOk(1))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(1)

    ctl.visibilityChanged(true)
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS * 3)
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(1)

    ctl.visibilityChanged(false)
    await settle()
    // 重新可见：立即刷新一次
    expect(mockedOffsets).toHaveBeenCalledTimes(2)
    expect(store.hasSuccess).toBe(true)
  })
})

describe('useTopicOffset 两阶段提交与失败保留（DESIGN §6.5/§7.4）', () => {
  it('点击查询成功才把 pending 提交为 applied、页码回 1（TOFF-REQ-035/091）', async () => {
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()

    // 先翻到第 2 页成功
    ctl.changePage(2)
    await settle()
    expect(store.pageNum).toBe(2)

    // 再次查询 → 生效条件改为新条件、页码回到 1
    ctl.submitQuery(['CLI-1'], [], [], '  orders  ')
    await settle()
    expect(store.appliedCriteria).toEqual({
      clientIds: ['CLI-1'],
      sourceIds: [],
      targetIds: [],
      tableName: 'orders',
    })
    expect(store.pageNum).toBe(1)
    const lastCall = mockedOffsets.mock.calls[mockedOffsets.mock.calls.length - 1]
    expect(lastCall[0].pageNum).toBe(1)
  })

  it('查询失败不改写上一次成功生效条件/页码/结果；仅内联弱提示不弹 ElMessage（TOFF-REQ-039/111）', async () => {
    mockedOffsets.mockImplementation(echoOk(1))
    const { ctl, store, notify } = setup()
    ctl.onPageMounted()
    await settle()
    const beforeCriteria = store.appliedCriteria
    const beforePage = store.pageNum

    mockedOffsets.mockRejectedValue(new Error('network'))
    ctl.submitQuery(['C1'], ['S1'], [], 'x')
    await settle()

    expect(store.appliedCriteria).toEqual(beforeCriteria)
    expect(store.pageNum).toBe(beforePage)
    expect(store.records).toHaveLength(1)
    // 查询失败（已有成功现场）只写工具栏内联弱提示，不弹 ElMessage
    expect(notify).not.toHaveBeenCalled()
    expect(ctl.refreshError.value).toBe('刷新失败，已保留上次数据')
  })

  it('手工刷新失败：轻提示一次、保留上一次成功数据（TOFF-REQ-111/113）', async () => {
    mockedOffsets.mockImplementation(echoOk(1))
    const { ctl, store, notify } = setup()
    ctl.onPageMounted()
    await settle()
    const beforeCriteria = store.appliedCriteria

    mockedOffsets.mockRejectedValue(new Error('network'))
    ctl.manualRefresh()
    await settle()

    expect(store.appliedCriteria).toEqual(beforeCriteria)
    expect(store.records).toHaveLength(1)
    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith('数据加载失败')
  })

  it('首次加载失败进入整区错误态；重新加载成功后恢复正常（TOFF-REQ-115）', async () => {
    mockedOffsets.mockRejectedValue(new Error('network'))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()

    expect(store.hasSuccess).toBe(false)
    expect(store.records).toEqual([])

    // 模拟网络恢复
    mockedOffsets.mockRejectedValueOnce(new Error('still down')).mockImplementation(echoOk(1))
    // 重新加载（第一次仍失败，仍无成功现场）
    ctl.retry()
    await settle()
    expect(store.hasSuccess).toBe(false)
    // 第二次成功
    ctl.retry()
    await settle()
    expect(store.hasSuccess).toBe(true)
  })

  it('自动刷新连续失败只更新工具栏内联弱提示，不逐次弹提示（TOFF-REQ-113/097）', async () => {
    vi.useFakeTimers()
    mockedOffsets.mockImplementation(echoOk(1))
    const { ctl, store, notify } = setup()
    ctl.onPageMounted()
    await settle()
    expect(store.hasSuccess).toBe(true)

    mockedOffsets.mockRejectedValue(new Error('network'))
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS)
    await settle()
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS)
    await settle()

    // 两次自动刷新失败均未弹 ElMessage，仅内联文本；数据保留
    expect(notify).not.toHaveBeenCalled()
    expect(store.hasSuccess).toBe(true)
    expect(store.records).toHaveLength(1)
  })
})

describe('useTopicOffset 会话恢复与页码越界收敛', () => {
  it('同会话返回走恢复：以已生效条件+保留页码立即刷新一次（TOFF-REQ-099/101）', async () => {
    const { ctl, store } = setup()
    // 预置一次成功现场（页码 2、条件 C1）
    store.commitSuccess(
      { clientIds: ['C1'], sourceIds: [], targetIds: [], tableName: 't' },
      2,
      { pageNum: 2, pageSize: 150, total: 160, pages: 2, unparseableTotal: 0, records: [row()] },
      Date.now(),
    )
    mockedOffsets.mockImplementation(echoOk(160))

    ctl.onPageMounted()
    await settle()

    expect(mockedOffsets).toHaveBeenCalledTimes(1)
    expect(mockedOffsets.mock.calls[0][0]).toEqual(
      expect.objectContaining({ clientId: ['C1'], tableName: 't', pageNum: 2 }),
    )
    expect(store.hasSuccess).toBe(true)
  })

  it('刷新后当前页超过新末页 → 收敛到新末页再查（TOFF-REQ-093）', async () => {
    // 阶段一 pages=3；shrink=true 后 pages=2，模拟刷新后新末页收缩
    let shrink = false
    mockedOffsets.mockImplementation((params: TopicOffsetQueryParams) =>
      Promise.resolve({
        code: 200,
        message: 'success',
        timestamp: '',
        data: {
          pageNum: params.pageNum,
          pageSize: 150,
          total: 160,
          pages: shrink ? 2 : 3,
          unparseableTotal: 0,
          records: [row()],
        },
      }),
    )
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()
    ctl.changePage(3)
    await settle()
    // pages=3 阶段第 3 页有效，无需收敛
    expect(store.pageNum).toBe(3)

    // 新末页收缩为 2：手工刷新返回 pages=2 → 当前页 3 越界 → 收敛到第 2 页再查一次
    shrink = true
    ctl.manualRefresh()
    await settle()
    expect(store.pageNum).toBe(2)
    const lastCall = mockedOffsets.mock.calls[mockedOffsets.mock.calls.length - 1]
    expect(lastCall[0].pageNum).toBe(2)
  })
})

describe('useTopicOffset 请求并发（单飞行 + 用户操作排队）', () => {
  it('请求进行中用户操作入队按序执行，不被静默丢弃（TOFF-REQ-109）', async () => {
    let release!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gate = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => {
      release = resolve
    })
    mockedOffsets.mockImplementationOnce(() => gate).mockImplementation(echoOk(160))
    const { ctl, store } = setup()

    // 首次缺省查询挂起（busy）
    ctl.onPageMounted()
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(1)

    // 忙态下提交用户查询 → 入队（此时不发起第二个请求）
    ctl.submitQuery(['C2'], [], [], 'y')
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(1)

    // 首个请求成功后，排队的用户查询自动执行
    release({ code: 200, message: 'success', timestamp: '', data: { pageNum: 1, pageSize: 150, total: 1, pages: 1, unparseableTotal: 0, records: [row()] } })
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)
    expect(store.appliedCriteria).toEqual({ clientIds: ['C2'], sourceIds: [], targetIds: [], tableName: 'y' })
  })

  it('自动刷新 tick 在请求进行中跳过（不排队）', async () => {
    vi.useFakeTimers()
    let release!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gate = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => {
      release = resolve
    })
    const { ctl, store } = setup()
    // 首次查询挂起期间不进入 hasSuccess 阶段，自动刷新不会启动；此处先让成功场景发生一次以启动计时
    mockedOffsets.mockImplementation(echoOk(1))
    ctl.onPageMounted()
    await settle()

    // 下一次刷新改为慢速挂起
    mockedOffsets.mockImplementationOnce(() => gate)
    ctl.manualRefresh()
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)
    expect(store.hasSuccess).toBe(true)

    // 挂起期间推进 3 个周期：auto tick 因 busy 跳过，不新增请求
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS * 3)
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)

    // 挂起请求完成 → 无排队自动刷新残留
    release({ code: 200, message: 'success', timestamp: '', data: { pageNum: 1, pageSize: 150, total: 1, pages: 1, unparseableTotal: 0, records: [row()] } })
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)
  })
})

/** 构造成功分页数据（供 gate release 使用）。 */
function okData(pageNum: number, total = 160): ApiResponse<TopicOffsetPageResult> {
  return {
    code: 200,
    message: 'success',
    timestamp: '',
    data: {
      pageNum,
      pageSize: 150,
      total,
      pages: total > 0 ? Math.ceil(total / 150) : 0,
      unparseableTotal: 0,
      records: total > 0 ? [row()] : [],
    },
  }
}

describe('useTopicOffset 大态/轻量可视区分（TOPIC-OFFSET-R1 §4.2）', () => {
  it('用户条件查询（建立性）进行中：loading=true 整表大态、refreshing=false', async () => {
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()
    expect(store.hasSuccess).toBe(true)

    let releaseOff!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gate = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => { releaseOff = resolve })
    mockedOffsets.mockImplementationOnce(() => gate)
    ctl.submitQuery(['C1'], [], [], 'x')
    await settle()
    expect(ctl.loading.value).toBe(true)
    expect(ctl.refreshing.value).toBe(false)
    expect(ctl.busy.value).toBe(true)

    releaseOff(okData(1))
    await settle()
    expect(ctl.loading.value).toBe(false)
    expect(ctl.busy.value).toBe(false)
  })

  it('手工刷新（轻量）进行中：loading=false 不遮罩表格、仅 refreshing 轻量态', async () => {
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl } = setup()
    ctl.onPageMounted()
    await settle()

    let releaseOff!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gate = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => { releaseOff = resolve })
    mockedOffsets.mockImplementationOnce(() => gate)
    ctl.manualRefresh()
    await settle()
    expect(ctl.loading.value).toBe(false)
    expect(ctl.refreshing.value).toBe(true)
    expect(ctl.busy.value).toBe(true)

    releaseOff(okData(1))
    await settle()
    expect(ctl.refreshing.value).toBe(false)
  })

  it('返回页面恢复刷新（restore）进行中：不清表、不遮罩（仅 refreshing 轻量态）', async () => {
    const { ctl, store } = setup()
    store.commitSuccess(
      { clientIds: ['C1'], sourceIds: [], targetIds: [], tableName: 't' },
      1,
      { pageNum: 1, pageSize: 150, total: 160, pages: 2, unparseableTotal: 0, records: [row()] },
      Date.now(),
    )
    let releaseOff!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gate = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => { releaseOff = resolve })
    mockedOffsets.mockImplementationOnce(() => gate)
    ctl.onPageMounted()
    await settle()
    expect(ctl.loading.value).toBe(false)
    expect(ctl.refreshing.value).toBe(true)
    expect(store.records).toHaveLength(1)

    releaseOff(okData(1))
    await settle()
    expect(store.hasSuccess).toBe(true)
  })
})

describe('useTopicOffset 候选纳入单飞行生命周期（TOPIC-OFFSET-R1 §4.3）', () => {
  it('同一操作内 offsets 先串行成功，candidates 才在同一 busy 内发起', async () => {
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl } = setup()
    ctl.onPageMounted()
    await settle()
    expect(mockedCandidates).toHaveBeenCalledTimes(1)

    let releaseOff!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gate = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => { releaseOff = resolve })
    mockedOffsets.mockImplementationOnce(() => gate)
    ctl.manualRefresh()
    await settle()
    // offsets 挂起期间候选不得先行发起
    expect(mockedOffsets).toHaveBeenCalledTimes(2)
    expect(mockedCandidates).toHaveBeenCalledTimes(1)

    releaseOff(okData(1))
    await settle()
    // offsets 成功提交后，同一 busy 内串行刷新候选
    expect(mockedCandidates).toHaveBeenCalledTimes(2)
  })

  it('候选请求未结束时 busy 不释放，下一用户操作不得与候选重叠', async () => {
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl } = setup()
    ctl.onPageMounted()
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(1)

    let releaseCand!: (v: ApiResponse<CandidateGroup>) => void
    const candGate = new Promise<ApiResponse<CandidateGroup>>((resolve) => { releaseCand = resolve })
    mockedCandidates.mockImplementationOnce(() => candGate)
    ctl.manualRefresh()
    await settle()
    // offsets 已提交、进入候选等待；busy 仍为 true
    expect(mockedOffsets).toHaveBeenCalledTimes(2)
    expect(ctl.busy.value).toBe(true)

    // 忙态再次手工刷新 → 仅记入最新意图槽位，不实际发起（无请求重叠）
    ctl.manualRefresh()
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)

    releaseCand(candidatesRes())
    await settle()
    expect(ctl.busy.value).toBe(false)
    // 槽位操作随后执行，全程请求不重叠
    expect(mockedOffsets).toHaveBeenCalledTimes(3)
  })

  it('offsets 失败时不发起候选；手工失败仅一次轻提示、保留上次成功现场', async () => {
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl, store, notify } = setup()
    ctl.onPageMounted()
    await settle()
    expect(mockedCandidates).toHaveBeenCalledTimes(1)

    mockedOffsets.mockRejectedValueOnce(new Error('network'))
    ctl.manualRefresh()
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)
    expect(mockedCandidates).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith('数据加载失败')
    expect(store.records).toHaveLength(1)
  })

  it('候选刷新失败保留上一次成功候选，列表仍按 offsets 成功提交', async () => {
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()
    // 已成功加载候选（含 OLD 客户端）
    store.setCandidates({ clients: [{ id: 'OLD', desc: null, active: true }], sources: [], targets: [] })
    const before = store.candidates!.clients[0].id

    mockedCandidates.mockRejectedValueOnce(new Error('candidate down'))
    ctl.manualRefresh()
    await settle()

    // offsets 成功提交列表；候选失败静默保留旧候选；busy 释放
    expect(store.records).toHaveLength(1)
    expect(store.candidates!.clients[0].id).toBe(before)
    expect(ctl.busy.value).toBe(false)
  })

  it('页面销毁后迟到的 offsets 与候选响应不覆盖新现场', async () => {
    // 迟到 offsets：冷启动首次请求销毁后返回 → 不得提交成功现场
    let releaseOff!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gate = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => { releaseOff = resolve })
    mockedOffsets.mockImplementationOnce(() => gate)
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(1)

    ctl.destroy()
    releaseOff(okData(1))
    await settle()
    expect(store.hasSuccess).toBe(false)
    expect(store.records).toEqual([])
    // 销毁后用户操作不再发起请求
    ctl.submitQuery(['C1'], [], [], 'x')
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(1)

    // 迟到候选：销毁前已有旧候选，销毁后迟到的候选不得覆盖
    mockedOffsets.mockImplementation(echoOk(160))
    const second = setup()
    second.ctl.onPageMounted()
    await settle()
    second.store.setCandidates({ clients: [{ id: 'OLD', desc: null, active: true }], sources: [], targets: [] })
    let releaseCand!: (v: ApiResponse<CandidateGroup>) => void
    const candGate = new Promise<ApiResponse<CandidateGroup>>((resolve) => { releaseCand = resolve })
    mockedCandidates.mockImplementationOnce(() => candGate)
    second.ctl.manualRefresh()
    await settle()
    expect(second.ctl.busy.value).toBe(true)
    second.ctl.destroy()
    releaseCand(candidatesRes())
    await settle()
    expect(second.store.candidates!.clients[0].id).toBe('OLD')
  })
})

describe('useTopicOffset 最新用户意图槽位（替换 FIFO，TOPIC-OFFSET-R1 §4.4）', () => {
  it('查询 Y 进行中触发旧条件 X 翻页：翻页被判定陈旧丢弃，最终保持 Y', async () => {
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle() // X（缺省）已生效第 1 页
    expect(store.hasSuccess).toBe(true)

    let releaseY!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gateY = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => { releaseY = resolve })
    mockedOffsets.mockImplementationOnce(() => gateY)
    ctl.submitQuery(['Y'], [], [], 'y') // 查询 Y 进行中
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)

    ctl.changePage(2) // 基于旧 X 的第 2 页：不应排队也不应发起
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)

    releaseY(okData(1))
    await settle()
    // 最终保持 Y 第 1 页，X 第 2 页未覆盖
    expect(store.appliedCriteria).toEqual({ clientIds: ['Y'], sourceIds: [], targetIds: [], tableName: 'y' })
    expect(store.pageNum).toBe(1)
    expect(mockedOffsets).toHaveBeenCalledTimes(2)
  })

  it('连续查询 Y、Z（Y 挂起中提交 Z）：Y 被取代不提交，最终只提交 Z', async () => {
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()

    let releaseY!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gateY = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => { releaseY = resolve })
    mockedOffsets.mockImplementationOnce(() => gateY)
    ctl.submitQuery(['Y'], [], [], 'y')
    await settle()
    ctl.submitQuery(['Z'], [], [], 'z') // 覆盖等待槽位
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2) // Z 未提前发起

    releaseY(okData(1))
    await settle()
    expect(store.appliedCriteria).toEqual({ clientIds: ['Z'], sourceIds: [], targetIds: [], tableName: 'z' })
    expect(store.pageNum).toBe(1)
    expect(mockedOffsets).toHaveBeenCalledTimes(3) // X、Y、Z 各一次，无重复
  })

  it('第 2 页等待中又翻第 3 页：最终只提交第 3 页', async () => {
    // total=500 → pages=4，保证第 3 页有效且不触发越界收敛
    mockedOffsets.mockImplementation(echoOk(500))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()
    expect(store.pageNum).toBe(1)

    let releaseP2!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gateP2 = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => { releaseP2 = resolve })
    mockedOffsets.mockImplementationOnce(() => gateP2)
    ctl.changePage(2)
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)

    ctl.changePage(3) // 最新意图覆盖等待中的第 2 页
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)

    releaseP2(okData(2))
    await settle()
    expect(store.pageNum).toBe(3)
    const lastCall = mockedOffsets.mock.calls[mockedOffsets.mock.calls.length - 1]
    expect(lastCall[0].pageNum).toBe(3)
  })

  it('自动刷新与用户查询碰撞：自动刷新被取代，用户查询不丢失', async () => {
    vi.useFakeTimers()
    mockedOffsets.mockImplementation(echoOk(1))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(1)

    let releaseAuto!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gateAuto = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => { releaseAuto = resolve })
    mockedOffsets.mockImplementationOnce(() => gateAuto)
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS) // 自动刷新发起
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)
    expect(ctl.loading.value).toBe(false) // 自动刷新为轻量态，不遮罩表格

    ctl.submitQuery(['Z'], [], [], 'z') // 忙中提交用户查询 → 槽位
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)

    releaseAuto(okData(1))
    await settle()
    expect(store.appliedCriteria).toEqual({ clientIds: ['Z'], sourceIds: [], targetIds: [], tableName: 'z' })
    expect(store.pageNum).toBe(1)
    expect(mockedOffsets).toHaveBeenCalledTimes(3)
  })

  it('新查询成功后，旧条件的等待翻页/刷新不得再次提交（旧意图不覆盖最新成功）', async () => {
    mockedOffsets.mockImplementation(echoOk(160))
    const { ctl, store } = setup()
    ctl.onPageMounted()
    await settle() // X 已生效第 1 页

    // 手工刷新 X 进行中 → 产生基于 X 的等待翻页意图
    let releaseManual!: (v: ApiResponse<TopicOffsetPageResult>) => void
    const gateManual = new Promise<ApiResponse<TopicOffsetPageResult>>((resolve) => { releaseManual = resolve })
    mockedOffsets.mockImplementationOnce(() => gateManual)
    ctl.manualRefresh()
    await settle()
    ctl.changePage(2) // 有效（运行中仍为 X）→ 进入等待槽位
    await settle()
    // 新查询 Z 覆盖该等待翻页意图
    ctl.submitQuery(['Z'], [], [], 'z')
    await settle()
    expect(mockedOffsets).toHaveBeenCalledTimes(2)

    releaseManual(okData(2))
    await settle()
    // Z 提交，旧 X 第 2 页等待意图被丢弃，未再发起
    expect(store.appliedCriteria).toEqual({ clientIds: ['Z'], sourceIds: [], targetIds: [], tableName: 'z' })
    expect(store.pageNum).toBe(1)
    expect(mockedOffsets).toHaveBeenCalledTimes(3)
  })
})
