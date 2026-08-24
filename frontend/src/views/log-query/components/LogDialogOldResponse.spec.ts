import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import LogDetailDialog from './LogDetailDialog.vue'
import RawMessageDialog from './RawMessageDialog.vue'
import type { ApiResponse } from '@/types/monitor'
import type { LogDetailVO, LogListVO, RawMessageVO } from '@/types/logQuery'

vi.mock('@/api/logQuery', () => ({
  fetchLogDetail: vi.fn(),
  fetchRawMessage: vi.fn(),
}))

import { fetchLogDetail, fetchRawMessage } from '@/api/logQuery'

const mockedDetail = vi.mocked(fetchLogDetail)
const mockedRaw = vi.mocked(fetchRawMessage)

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function row(id: string): LogListVO {
  return {
    cdcLogId: id,
    hasLogDetail: true,
    hasRawMessage: true,
    targetTime: '2026-08-20 10:00:00',
  }
}

function detail(id: string, logDetail: string): LogDetailVO {
  return { cdcLogId: id, instructionType: `指令-${id}`, logDetail }
}

function ok<T>(data: T): ApiResponse<T> {
  return { code: 200, message: 'success', timestamp: '', data }
}

beforeEach(() => {
  mockedDetail.mockReset()
  mockedRaw.mockReset()
})

describe('详情弹窗旧响应失效（R1-05 / LQ-AC-130）', () => {
  it('关闭后旧详情响应返回，弹窗保持关闭且旧详情不重新展示', async () => {
    const d = deferred<ApiResponse<LogDetailVO>>()
    mockedDetail.mockImplementationOnce(() => d.promise)

    const wrapper = mount(LogDetailDialog, {
      props: { visible: false, logType: 'error', row: row('1') },
      global: { plugins: [ElementPlus] },
    })
    await wrapper.setProps({ visible: true })
    await flushPromises()
    expect(mockedDetail).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('正在加载日志详情')

    await wrapper.setProps({ visible: false })
    await flushPromises()

    d.resolve(ok(detail('1', '旧详情内容')))
    await flushPromises()

    const elDialog = wrapper.findComponent({ name: 'ElDialog' })
    expect(elDialog.props('modelValue')).toBe(false)
    expect(wrapper.text()).not.toContain('旧详情内容')
    expect(wrapper.text()).not.toContain('指令-1')
    wrapper.unmount()
  })

  it('旧记录详情响应晚于新记录返回时不覆盖新记录', async () => {
    const dOld = deferred<ApiResponse<LogDetailVO>>()
    const dNew = deferred<ApiResponse<LogDetailVO>>()
    mockedDetail.mockImplementationOnce(() => dOld.promise)
    mockedDetail.mockImplementationOnce(() => dNew.promise)

    const wrapper = mount(LogDetailDialog, {
      props: { visible: false, logType: 'error', row: row('1') },
      global: { plugins: [ElementPlus] },
    })
    await wrapper.setProps({ visible: true })
    await flushPromises()
    expect(mockedDetail).toHaveBeenCalledTimes(1)

    // 关闭旧记录，切换到新记录重新打开
    await wrapper.setProps({ visible: false, row: row('2') })
    await wrapper.setProps({ visible: true })
    await flushPromises()
    expect(mockedDetail).toHaveBeenCalledTimes(2)
    expect(mockedDetail.mock.calls[1][1]).toBe('2')

    // 旧响应先返回，不得覆盖新记录
    dOld.resolve(ok(detail('1', '旧记录详情')))
    await flushPromises()
    expect(wrapper.text()).not.toContain('旧记录详情')

    // 新响应返回，仅展示新记录
    dNew.resolve(ok(detail('2', '新记录详情')))
    await flushPromises()
    expect(wrapper.text()).toContain('新记录详情')
    expect(wrapper.text()).toContain('指令-2')
    wrapper.unmount()
  })
})

describe('原始消息弹窗旧响应失效（R1-05 / LQ-AC-130）', () => {
  it('关闭后旧原始消息响应返回，弹窗保持关闭且旧内容不重新展示', async () => {
    const d = deferred<ApiResponse<RawMessageVO>>()
    mockedRaw.mockImplementationOnce(() => d.promise)

    const wrapper = mount(RawMessageDialog, {
      props: { visible: false, logType: 'error', row: row('1') },
      global: { plugins: [ElementPlus] },
    })
    await wrapper.setProps({ visible: true })
    await flushPromises()
    expect(mockedRaw).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('正在加载原始消息')

    await wrapper.setProps({ visible: false })
    await flushPromises()

    d.resolve(ok({ cdcLogId: '1', rawMessage: '旧原始消息内容' }))
    await flushPromises()

    const elDialog = wrapper.findComponent({ name: 'ElDialog' })
    expect(elDialog.props('modelValue')).toBe(false)
    expect(wrapper.text()).not.toContain('旧原始消息内容')
    wrapper.unmount()
  })
})
