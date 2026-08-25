import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import LogQueryTable from './LogQueryTable.vue'
import type { LogListVO } from '@/types/logQuery'
import type { LogQueryTabStatus } from '../composables/useLogQueryTab'

function row(id: string): LogListVO {
  return { cdcLogId: id, hasLogDetail: false, hasRawMessage: false, targetTime: '2026-08-20 10:00:00' }
}

async function mountTable(props: {
  logType: 'error' | 'correct'
  items: LogListVO[]
  loading: boolean
  error: string | null
  elapsed: number
  queryStatus: LogQueryTabStatus
}) {
  const wrapper = mount(LogQueryTable, {
    props,
    global: { plugins: [ElementPlus] },
  })
  await flushPromises()
  return wrapper
}

describe('LogQueryTable 未查询引导与查询状态（LOG-QUERY-CURSOR-CORRECT-TAB-ADJUSTMENT-001）', () => {
  it('正确日志 NOT_QUERIED：显示引导文案，不显示“暂无数据”，无加载遮罩与等待秒数（§4.2/§7.1-4/5）', async () => {
    const wrapper = await mountTable({
      logType: 'correct',
      items: [],
      loading: false,
      error: null,
      elapsed: 0,
      queryStatus: 'NOT_QUERIED',
    })

    expect(wrapper.text()).toContain('正确日志数据量较大，请设置查询条件后点击"查询"')
    expect(wrapper.text()).toContain('默认查询时间为当天。缩小时间范围或指定数据源、表名可提高查询速度。')
    expect(wrapper.text()).not.toContain('暂无数据')
    expect(wrapper.text()).not.toContain('正在查询正确日志')
    expect(wrapper.text()).not.toContain('已等待')
    expect(wrapper.find('.table-mask').exists()).toBe(false)
    expect(wrapper.find('.table-guide').exists()).toBe(true)
  })

  it('SUCCESS_WITH_DATA：渲染表格且不显示引导或“暂无数据”（§7.1-8）', async () => {
    const wrapper = await mountTable({
      logType: 'correct',
      items: [row('1'), row('2')],
      loading: false,
      error: null,
      elapsed: 0,
      queryStatus: 'SUCCESS_WITH_DATA',
    })

    expect(wrapper.find('.table-guide').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('请设置查询条件')
    expect(wrapper.text()).not.toContain('暂无数据')
    expect(wrapper.text()).not.toContain('当前查询条件下暂无日志')
  })

  it('SUCCESS_EMPTY：显示“当前查询条件下暂无日志”，不显示引导（§7.1-8）', async () => {
    const wrapper = await mountTable({
      logType: 'correct',
      items: [],
      loading: false,
      error: null,
      elapsed: 0,
      queryStatus: 'SUCCESS_EMPTY',
    })

    expect(wrapper.find('.table-guide').exists()).toBe(false)
    expect(wrapper.text()).toContain('当前查询条件下暂无日志')
    expect(wrapper.text()).not.toContain('正确日志数据量较大')
  })

  it('FAILED：显示既有失败提示（§7.1-8）', async () => {
    const wrapper = await mountTable({
      logType: 'correct',
      items: [],
      loading: false,
      error: '查询超时，请缩小查询范围或增加筛选条件后重试',
      elapsed: 0,
      queryStatus: 'FAILED',
    })

    expect(wrapper.find('.table-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('查询超时，请缩小查询范围或增加筛选条件后重试')
  })

  it('LOADING：显示查询遮罩、旋转图标与等待秒数（§7.1-5 反向）', async () => {
    const wrapper = await mountTable({
      logType: 'correct',
      items: [],
      loading: true,
      error: null,
      elapsed: 5,
      queryStatus: 'LOADING',
    })

    expect(wrapper.find('.table-mask').exists()).toBe(true)
    expect(wrapper.text()).toContain('正在查询正确日志，请稍候')
    expect(wrapper.text()).toContain('已等待 5 秒')
  })

  it('错误日志 NOT_QUERIED：不显示正确日志引导，渲染空白表格且无加载遮罩（R1-01-7）', async () => {
    const wrapper = await mountTable({
      logType: 'error',
      items: [],
      loading: false,
      error: null,
      elapsed: 0,
      queryStatus: 'NOT_QUERIED',
    })

    expect(wrapper.find('.table-guide').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('正确日志数据量较大')
    expect(wrapper.text()).not.toContain('请设置查询条件')
    expect(wrapper.text()).not.toContain('暂无数据')
    expect(wrapper.find('.table-mask').exists()).toBe(false)
    expect(wrapper.find('.el-table').exists()).toBe(true)
  })

  it('错误日志 LOADING：显示错误日志加载遮罩与等待秒数，不显示引导（R1-01-5）', async () => {
    const wrapper = await mountTable({
      logType: 'error',
      items: [],
      loading: true,
      error: null,
      elapsed: 3,
      queryStatus: 'LOADING',
    })

    expect(wrapper.find('.table-guide').exists()).toBe(false)
    expect(wrapper.find('.table-mask').exists()).toBe(true)
    expect(wrapper.text()).toContain('正在查询错误日志，请稍候')
    expect(wrapper.text()).toContain('已等待 3 秒')
  })
})
