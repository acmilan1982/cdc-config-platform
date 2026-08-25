import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import type { ApiResponse } from '@/types/monitor'
import type { DataSourceOptionsVO, LogListResponse, LogQueryStatusVO, LogListVO } from '@/types/logQuery'
import { ALL_DATA_SOURCE, currentNaturalDay } from '@/views/log-query/composables/useLogQueryTab'
import type { LogQueryForm } from '@/views/log-query/composables/useLogQueryTab'

vi.mock('@/api/logQuery', () => ({
  getLogQueryStatus: vi.fn(),
  fetchDataSourceOptions: vi.fn(),
  searchLogs: vi.fn(),
  fetchLogDetail: vi.fn(),
  fetchRawMessage: vi.fn(),
}))

vi.mock('@/views/log-query/reinitBus', () => {
  const handlers = new Set<() => void>()
  return {
    onLogQueryReinit: vi.fn((handler: () => void) => {
      handlers.add(handler)
      return () => {
        handlers.delete(handler)
      }
    }),
    triggerLogQueryReinit: vi.fn(() => {
      for (const handler of [...handlers]) {
        handler()
      }
    }),
  }
})

import { getLogQueryStatus, fetchDataSourceOptions, searchLogs } from '@/api/logQuery'
import { triggerLogQueryReinit } from '@/views/log-query/reinitBus'
import LogQueryPage from '@/views/log-query/LogQueryPage.vue'

const mockedStatus = vi.mocked(getLogQueryStatus)
const mockedOptions = vi.mocked(fetchDataSourceOptions)
const mockedSearch = vi.mocked(searchLogs)

function okStatus(enabled: boolean): ApiResponse<LogQueryStatusVO> {
  return { code: 200, message: 'success', timestamp: '', data: { enabled } }
}

function okOptions(): ApiResponse<DataSourceOptionsVO> {
  return { code: 200, message: 'success', timestamp: '', data: { sourceList: [], targetList: [] } }
}

function okList(): ApiResponse<LogListResponse> {
  return { code: 200, message: 'success', timestamp: '', data: { items: [], hasNext: false } }
}

function failList(code: number, message: string): ApiResponse<LogListResponse> {
  return { code, message, timestamp: '', data: null as unknown as LogListResponse }
}

function listWithOne(id: string): ApiResponse<LogListResponse> {
  return {
    code: 200,
    message: 'success',
    timestamp: '',
    data: {
      items: [{ cdcLogId: id, hasLogDetail: true, hasRawMessage: false, targetTime: '2026-08-20 10:00:00' }],
      hasNext: false,
    },
  }
}

function row(id: string): LogListVO {
  return { cdcLogId: id, hasLogDetail: true, hasRawMessage: false, targetTime: '2026-08-20 10:00:00' }
}

async function mountPage() {
  return mount(LogQueryPage, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        LogQueryFilter: true,
        LogQueryTable: true,
        CursorPagination: true,
        LogDetailDialog: true,
        RawMessageDialog: true,
      },
    },
  })
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  mockedStatus.mockReset()
  mockedOptions.mockReset()
  mockedSearch.mockReset()
  mockedOptions.mockResolvedValue(okOptions())
  mockedSearch.mockResolvedValue(okList())
})

describe('LogQueryPage 状态流程', () => {
  it('enabled=false 显示未开放页且不调用原四接口（LQ-AC-176）', async () => {
    mockedStatus.mockResolvedValue(okStatus(false))
    const wrapper = await mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('日志查询功能暂未开放')
    expect(wrapper.text()).toContain('当前环境尚未启用日志查询功能。如需使用，请联系系统管理员。')
    expect(mockedOptions).not.toHaveBeenCalled()
    expect(mockedSearch).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('enabled=true 后加载候选并默认查询错误日志（LQ-AC-177）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const wrapper = await mountPage()
    await flushPromises()

    expect(mockedOptions).toHaveBeenCalledTimes(1)
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')
    expect(wrapper.text()).toContain('错误日志')
    wrapper.unmount()
  })

  it('状态接口失败显示固定失败页，无“重新检测”按钮、无自动重试（LQ-AC-178/179）', async () => {
    mockedStatus.mockRejectedValue(new Error('network'))
    const wrapper = await mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('功能状态获取失败')
    expect(wrapper.text()).toContain('暂时无法获取日志查询功能状态，请刷新页面或稍后重新进入。')
    expect(wrapper.text()).not.toContain('重新检测')
    expect(mockedOptions).not.toHaveBeenCalled()
    expect(mockedSearch).not.toHaveBeenCalled()
    expect(mockedStatus).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('再次点击当前菜单重新调用状态接口并重新初始化（LQ-AC-181）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const wrapper = await mountPage()
    await flushPromises()
    expect(mockedStatus).toHaveBeenCalledTimes(1)

    mockedStatus.mockClear()
    mockedOptions.mockClear()
    mockedSearch.mockClear()

    triggerLogQueryReinit()
    await flushPromises()

    expect(mockedStatus).toHaveBeenCalledTimes(1)
    expect(mockedOptions).toHaveBeenCalled()
    expect(mockedSearch).toHaveBeenCalled()
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')
    wrapper.unmount()
  })

  it('真实入口重新初始化后清空两 Tab、关闭弹窗、重查默认错误日志（R1-04）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    mockedOptions.mockResolvedValue(okOptions())
    mockedSearch.mockResolvedValue(okList())
    const wrapper = await mountPage()
    await flushPromises()

    // 切到"正确日志"Tab
    await wrapper.findAll('.tab-item')[1].trigger('click')
    await flushPromises()
    expect(wrapper.find('.tab-item.active').text()).toContain('正确日志')

    // 打开详情弹窗（从列表真实 emit detail）
    const table = wrapper.findComponent({ name: 'LogQueryTable' })
    table.vm.$emit('detail', {
      cdcLogId: '1',
      hasLogDetail: true,
      hasRawMessage: false,
      targetTime: '2026-08-20 10:00:00',
    })
    await flushPromises()
    expect(wrapper.findComponent({ name: 'LogDetailDialog' }).props('visible')).toBe(true)

    mockedStatus.mockClear()
    mockedOptions.mockClear()
    mockedSearch.mockClear()

    triggerLogQueryReinit()
    await flushPromises()

    // Tab 回到"错误日志"、弹窗关闭
    expect(wrapper.find('.tab-item.active').text()).toContain('错误日志')
    expect(wrapper.findComponent({ name: 'LogDetailDialog' }).props('visible')).toBe(false)
    // 重新调用状态接口并重新执行默认错误日志查询
    expect(mockedStatus).toHaveBeenCalledTimes(1)
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')
    wrapper.unmount()
  })
})

describe('enabled=true 初始化顺序（R1-03 / LQ-DESIGN-177）', () => {
  it('候选加载完成后才发起默认错误日志查询', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const dOpts = deferred<ApiResponse<DataSourceOptionsVO>>()
    mockedOptions.mockImplementationOnce(() => dOpts.promise)
    const wrapper = await mountPage()
    await flushPromises()

    // 候选在途：不得提前默认查询
    expect(mockedOptions).toHaveBeenCalledTimes(1)
    expect(mockedSearch).not.toHaveBeenCalled()

    dOpts.resolve(okOptions())
    await flushPromises()

    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')
    wrapper.unmount()
  })

  it('候选加载失败后仍允许默认错误日志查询', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    mockedOptions.mockRejectedValue(new Error('network'))
    const wrapper = await mountPage()
    await flushPromises()

    expect(mockedOptions).toHaveBeenCalledTimes(1)
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')
    // 候选失败只影响下拉框（候选失败状态），不影响列表查询
    const filterStub = wrapper.findComponent({ name: 'LogQueryFilter' })
    expect(filterStub.props('optionsError')).toContain('数据源候选加载失败')
    wrapper.unmount()
  })

  it('初始化过程中重新进入，旧初始化链不得发起旧默认查询', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const dOpts1 = deferred<ApiResponse<DataSourceOptionsVO>>()
    const dOpts2 = deferred<ApiResponse<DataSourceOptionsVO>>()
    mockedOptions.mockImplementationOnce(() => dOpts1.promise)
    mockedOptions.mockImplementationOnce(() => dOpts2.promise)
    const wrapper = await mountPage()
    await flushPromises()

    expect(mockedOptions).toHaveBeenCalledTimes(1)
    expect(mockedSearch).not.toHaveBeenCalled()

    // 重新进入 → 新代次初始化也发起候选加载
    triggerLogQueryReinit()
    await flushPromises()
    expect(mockedOptions).toHaveBeenCalledTimes(2)
    expect(mockedSearch).not.toHaveBeenCalled()

    // 旧代次候选先返回：不得触发默认查询
    dOpts1.resolve(okOptions())
    await flushPromises()
    expect(mockedSearch).not.toHaveBeenCalled()

    // 新代次候选返回：仅新初始化链触发一次默认错误日志查询
    dOpts2.resolve(okOptions())
    await flushPromises()
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')
    wrapper.unmount()
  })
})

describe('R1.1 初始化锁定与查询 A/B 竞争消除', () => {
  type PageWrapper = Awaited<ReturnType<typeof mountPage>>
  const filter = (w: PageWrapper) => w.findComponent({ name: 'LogQueryFilter' })
  const table = (w: PageWrapper) => w.findComponent({ name: 'LogQueryTable' })
  const pager = (w: PageWrapper) => w.findComponent({ name: 'CursorPagination' })

  it('候选加载在途时初始化锁定，点击查询不发起列表请求（§8.1/8.2）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const dOpts = deferred<ApiResponse<DataSourceOptionsVO>>()
    mockedOptions.mockImplementationOnce(() => dOpts.promise)
    const wrapper = await mountPage()
    await flushPromises()

    expect(mockedOptions).toHaveBeenCalledTimes(1)
    expect(mockedSearch).not.toHaveBeenCalled()
    expect(filter(wrapper).props('initializing')).toBe(true)

    // 锁定期间点击查询：不得发起列表请求
    filter(wrapper).vm.$emit('query')
    await flushPromises()
    expect(mockedSearch).not.toHaveBeenCalled()

    // 候选完成 → 默认查询发起并解锁
    dOpts.resolve(okOptions())
    await flushPromises()
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')
    expect(filter(wrapper).props('initializing')).toBe(false)
    wrapper.unmount()
  })

  it('默认查询在途时查询/重置/Tab/翻页/详情全部锁定，成功后解除（§8.3/8.4/8.5/8.13）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const dSearch = deferred<ApiResponse<LogListResponse>>()
    mockedSearch.mockImplementationOnce(() => dSearch.promise)
    const wrapper = await mountPage()
    await flushPromises()

    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(filter(wrapper).props('initializing')).toBe(true)

    // 默认查询在途：查询/重置/Tab/上一页/下一页/详情/原始消息均不可触发
    mockedSearch.mockClear()
    filter(wrapper).vm.$emit('query')
    filter(wrapper).vm.$emit('reset')
    await wrapper.findAll('.tab-item')[1].trigger('click')
    pager(wrapper).vm.$emit('prev')
    pager(wrapper).vm.$emit('next')
    table(wrapper).vm.$emit('detail', row('1'))
    table(wrapper).vm.$emit('raw', row('1'))
    await flushPromises()

    expect(mockedSearch).not.toHaveBeenCalled()
    expect(wrapper.find('.tab-item.active').text()).toContain('错误日志')
    expect(wrapper.findComponent({ name: 'LogDetailDialog' }).props('visible')).toBe(false)
    expect(wrapper.findComponent({ name: 'RawMessageDialog' }).props('visible')).toBe(false)

    // 默认查询成功 → 解锁
    dSearch.resolve(okList())
    await flushPromises()
    expect(filter(wrapper).props('initializing')).toBe(false)
    wrapper.unmount()
  })

  it('默认查询业务失败后解除初始化锁定（§8.6）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    mockedSearch.mockResolvedValueOnce(failList(40017, '查询失败'))
    const wrapper = await mountPage()
    await flushPromises()

    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(filter(wrapper).props('initializing')).toBe(false)
    expect(table(wrapper).props('error')).toContain('查询失败')
    wrapper.unmount()
  })

  it('默认查询网络失败或超时后解除初始化锁定（§8.7）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    mockedSearch.mockRejectedValueOnce(new Error('network'))
    const wrapper = await mountPage()
    await flushPromises()

    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(filter(wrapper).props('initializing')).toBe(false)
    expect(table(wrapper).props('error')).toContain('网络请求失败')
    wrapper.unmount()
  })

  it('候选加载失败后仍执行一次默认错误日志查询并在结束后解锁（§8.8）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    mockedOptions.mockRejectedValueOnce(new Error('network'))
    const wrapper = await mountPage()
    await flushPromises()

    expect(mockedOptions).toHaveBeenCalledTimes(1)
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')
    expect(filter(wrapper).props('initializing')).toBe(false)
    expect(filter(wrapper).props('optionsError')).toContain('数据源候选加载失败')
    wrapper.unmount()
  })

  it('初始化完成后用户查询结果不被延迟默认查询覆盖（§8.9）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const wrapper = await mountPage()
    await flushPromises()
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(filter(wrapper).props('initializing')).toBe(false)

    // 用户主动查询（deferred）：结果稳定展示，不存在后续默认查询覆盖
    const dUser = deferred<ApiResponse<LogListResponse>>()
    mockedSearch.mockImplementationOnce(() => dUser.promise)
    filter(wrapper).vm.$emit('query')
    await flushPromises()
    expect(mockedSearch).toHaveBeenCalledTimes(2)

    dUser.resolve(listWithOne('u1'))
    await flushPromises()
    expect(mockedSearch).toHaveBeenCalledTimes(2)
    expect(table(wrapper).props('items')).toHaveLength(1)
    expect((table(wrapper).props('items') as LogListVO[])[0].cdcLogId).toBe('u1')
    expect(filter(wrapper).props('initializing')).toBe(false)
    wrapper.unmount()
  })

  it('初始化期间重新进入：旧候选不触发旧默认查询、旧默认不覆盖新代次、旧 finally 不解锁新代次（§8.10-8.12）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const dOpts1 = deferred<ApiResponse<DataSourceOptionsVO>>()
    const dSearch1 = deferred<ApiResponse<LogListResponse>>()
    const dOpts2 = deferred<ApiResponse<DataSourceOptionsVO>>()
    mockedOptions.mockImplementationOnce(() => dOpts1.promise)
    mockedSearch.mockImplementationOnce(() => dSearch1.promise)
    mockedOptions.mockImplementationOnce(() => dOpts2.promise)
    const wrapper = await mountPage()
    await flushPromises()

    // 旧代次候选完成 → 旧默认查询在途
    dOpts1.resolve(okOptions())
    await flushPromises()
    expect(mockedSearch).toHaveBeenCalledTimes(1)

    // 重新进入 → 新代次发起候选加载
    triggerLogQueryReinit()
    await flushPromises()
    expect(mockedOptions).toHaveBeenCalledTimes(2)
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(filter(wrapper).props('initializing')).toBe(true)

    // 旧默认查询返回：代次已变，不得覆盖新代次、不得追加请求
    dSearch1.resolve(okList())
    await flushPromises()
    expect(mockedSearch).toHaveBeenCalledTimes(1)

    // 新代次候选完成 → 仅新链发起一次默认错误日志查询并解锁
    mockedSearch.mockImplementationOnce(() => Promise.resolve(okList()))
    dOpts2.resolve(okOptions())
    await flushPromises()
    expect(mockedSearch).toHaveBeenCalledTimes(2)
    expect(mockedSearch.mock.calls[1][0].logType).toBe('error')
    expect(filter(wrapper).props('initializing')).toBe(false)
    wrapper.unmount()
  })
})

describe('正确日志首次切换不自动查询（LOG-QUERY-CURSOR-CORRECT-TAB-ADJUSTMENT-001）', () => {
  type PageWrapper = Awaited<ReturnType<typeof mountPage>>
  const filters = (w: PageWrapper) => w.findAllComponents({ name: 'LogQueryFilter' })
  const tables = (w: PageWrapper) => w.findAllComponents({ name: 'LogQueryTable' })
  const tabItems = (w: PageWrapper) => w.findAll('.tab-item')

  it('页面首次进入仍只自动查询错误日志一次（LQ-AC-177 延续）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const wrapper = await mountPage()
    await flushPromises()
    expect(mockedOptions).toHaveBeenCalledTimes(1)
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')
    wrapper.unmount()
  })

  it('第一次切换到正确日志不调用正确日志列表 API，缺省条件已初始化（§4.2/§7.1-2/3）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const wrapper = await mountPage()
    await flushPromises()
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')

    mockedSearch.mockClear()
    await tabItems(wrapper)[1].trigger('click')
    await flushPromises()

    expect(wrapper.find('.tab-item.active').text()).toContain('正确日志')
    expect(mockedSearch).not.toHaveBeenCalled()

    // 缺省时间与四个筛选条件正确初始化
    const form = filters(wrapper)[1].props('form') as LogQueryForm
    const [start, end] = currentNaturalDay()
    expect(form.timeRange).toEqual([start, end])
    expect(form.sourceDataSourceIds).toEqual([ALL_DATA_SOURCE])
    expect(form.targetDataSourceIds).toEqual([ALL_DATA_SOURCE])
    expect(form.sourceTableName).toBe('')
    expect(form.targetTableName).toBe('')

    // 正确日志保持尚未查询状态
    expect(tables(wrapper)[1].props('queryStatus')).toBe('NOT_QUERIED')
    wrapper.unmount()
  })

  it('用户点击正确日志"查询"后才恰好发起一次列表请求（§7.1-6）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const wrapper = await mountPage()
    await flushPromises()
    expect(mockedSearch).toHaveBeenCalledTimes(1)

    await tabItems(wrapper)[1].trigger('click')
    await flushPromises()
    mockedSearch.mockClear()

    filters(wrapper)[1].vm.$emit('query')
    await flushPromises()

    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('correct')
    wrapper.unmount()
  })

  it('正确日志查询后切换 Tab 再返回不自动重查且保留结果（§4.2/§7.1-9）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const wrapper = await mountPage()
    await flushPromises()

    await tabItems(wrapper)[1].trigger('click')
    await flushPromises()
    mockedSearch.mockClear()
    mockedSearch.mockResolvedValue(listWithOne('c1'))
    filters(wrapper)[1].vm.$emit('query')
    await flushPromises()
    expect(tables(wrapper)[1].props('queryStatus')).toBe('SUCCESS_WITH_DATA')
    expect((tables(wrapper)[1].props('items') as LogListVO[])[0].cdcLogId).toBe('c1')

    mockedSearch.mockClear()
    await tabItems(wrapper)[0].trigger('click')
    await tabItems(wrapper)[1].trigger('click')
    await flushPromises()

    expect(mockedSearch).not.toHaveBeenCalled()
    expect(tables(wrapper)[1].props('queryStatus')).toBe('SUCCESS_WITH_DATA')
    expect((tables(wrapper)[1].props('items') as LogListVO[])[0].cdcLogId).toBe('c1')
    wrapper.unmount()
  })

  it('同路由再次点击菜单后错误日志重新默认查询、正确日志恢复尚未查询（§4.2/§7.1-11）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const wrapper = await mountPage()
    await flushPromises()

    // 正确日志先完成一次有数据查询
    await tabItems(wrapper)[1].trigger('click')
    await flushPromises()
    mockedSearch.mockClear()
    mockedSearch.mockResolvedValue(listWithOne('c1'))
    filters(wrapper)[1].vm.$emit('query')
    await flushPromises()
    expect(tables(wrapper)[1].props('queryStatus')).toBe('SUCCESS_WITH_DATA')

    mockedStatus.mockClear()
    mockedOptions.mockClear()
    mockedSearch.mockClear()

    triggerLogQueryReinit()
    await flushPromises()

    // 错误日志重新执行默认查询
    expect(mockedSearch).toHaveBeenCalledTimes(1)
    expect(mockedSearch.mock.calls[0][0].logType).toBe('error')
    // 正确日志恢复尚未查询状态且无数据
    expect(tables(wrapper)[1].props('queryStatus')).toBe('NOT_QUERIED')
    expect(tables(wrapper)[1].props('items')).toHaveLength(0)
    // 缺省条件重新填充
    const form = filters(wrapper)[1].props('form') as LogQueryForm
    expect(form.sourceDataSourceIds).toEqual([ALL_DATA_SOURCE])
    wrapper.unmount()
  })

  it('旧页面代次中的正确日志响应不得覆盖重新初始化后的尚未查询状态（§7.1-12）', async () => {
    mockedStatus.mockResolvedValue(okStatus(true))
    const wrapper = await mountPage()
    await flushPromises()

    await tabItems(wrapper)[1].trigger('click')
    await flushPromises()
    const dOld = deferred<ApiResponse<LogListResponse>>()
    mockedSearch.mockClear()
    mockedSearch.mockImplementationOnce(() => dOld.promise)
    filters(wrapper)[1].vm.$emit('query')
    await flushPromises()
    expect(tables(wrapper)[1].props('queryStatus')).toBe('LOADING')

    triggerLogQueryReinit()
    await flushPromises()
    expect(tables(wrapper)[1].props('queryStatus')).toBe('NOT_QUERIED')

    dOld.resolve(listWithOne('old'))
    await flushPromises()
    expect(tables(wrapper)[1].props('queryStatus')).toBe('NOT_QUERIED')
    expect(tables(wrapper)[1].props('items')).toHaveLength(0)
    wrapper.unmount()
  })
})
