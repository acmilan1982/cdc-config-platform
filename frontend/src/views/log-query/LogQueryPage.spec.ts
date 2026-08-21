import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import type { ApiResponse } from '@/types/monitor'
import type { DataSourceOptionsVO, LogListResponse, LogQueryStatusVO } from '@/types/logQuery'

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
})
