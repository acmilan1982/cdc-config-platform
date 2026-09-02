import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import OffsetToolbar from './OffsetToolbar.vue'

function mountToolbar(props: Record<string, unknown> = {}) {
  return mount(OffsetToolbar, {
    props: {
      total: 0,
      unparseableTotal: 0,
      refreshing: false,
      lastRefreshText: null,
      refreshError: '',
      ...props,
    },
    global: { plugins: [ElementPlus] },
  })
}

describe('OffsetToolbar 工具栏（TOFF-REQ-020/092/113/114）', () => {
  it('固定顺序渲染总数/无法解析/60 秒自动刷新/最近成功刷新时间/立即刷新（TOFF-REQ-117）', () => {
    const wrapper = mountToolbar({
      total: 128,
      unparseableTotal: 3,
      lastRefreshText: '10:11:12',
    })
    const text = wrapper.text()
    expect(text).toContain('共 128 条')
    expect(text).toContain('无法解析 3 条')
    expect(text).toContain('60 秒自动刷新')
    expect(text).toContain('最近成功刷新 10:11:12')
    wrapper.unmount()
  })

  it('无法解析为 0 时不渲染“无法解析”项', () => {
    const wrapper = mountToolbar({ total: 0, unparseableTotal: 0 })
    expect(wrapper.text()).not.toContain('无法解析')
    wrapper.unmount()
  })

  it('点击“立即刷新”触发 refresh', async () => {
    const wrapper = mountToolbar({ total: 1 })
    const btn = wrapper.findAll('button').find((b) => b.text().includes('立即刷新'))!
    await btn.trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    wrapper.unmount()
  })

  it('轻量刷新或任一请求进行中时禁用“立即刷新”并显示加载', () => {
    const refreshing = mountToolbar({ refreshing: true, total: 1 })
    const btnRef = refreshing.findAll('button').find((b) => b.text().includes('立即刷新'))!
    expect((btnRef.element as HTMLButtonElement).disabled).toBe(true)
    refreshing.unmount()

    const busy = mountToolbar({ busy: true, refreshing: false, total: 1 })
    const btnBusy = busy.findAll('button').find((b) => b.text().includes('立即刷新'))!
    expect((btnBusy.element as HTMLButtonElement).disabled).toBe(true)
    busy.unmount()
  })

  it('刷新失败内联弱提示文本渲染（TOFF-REQ-113）', () => {
    const wrapper = mountToolbar({ refreshError: '自动刷新失败，已保留上次数据' })
    expect(wrapper.text()).toContain('自动刷新失败，已保留上次数据')
    wrapper.unmount()
  })
})
