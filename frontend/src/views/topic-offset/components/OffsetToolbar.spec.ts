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

describe('OffsetToolbar 工具栏内容与禁用（TOFF-REQ-020/092/113/114）', () => {
  it('显示总数、完整无法解析文案、60 秒自动刷新、最近成功刷新：时间、立即刷新', () => {
    const wrapper = mountToolbar({
      total: 128,
      unparseableTotal: 3,
      lastRefreshText: '10:11:12',
    })
    const text = wrapper.text()
    expect(text).toContain('共 128 条')
    expect(text).toContain('其中 3 条 Topic 格式无法解析')
    expect(text).toContain('60 秒自动刷新')
    expect(text).toContain('最近成功刷新：10:11:12')
    expect(text).toContain('立即刷新')
    wrapper.unmount()
  })

  it('无法解析为 0 时整段警示（图标+文案）隐藏，不出现“无法解析”', () => {
    const wrapper = mountToolbar({ total: 0, unparseableTotal: 0 })
    expect(wrapper.find('.toff-warn').exists()).toBe(false)
    expect(wrapper.find('.toff-warn-icon').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Topic 格式无法解析')
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

describe('OffsetToolbar 左右分组与警示图标（R2 §4.2/4.3）', () => {
  it('总数与无法解析警示固定于左组，警示含 EP 橙色图标且文案精确', () => {
    const wrapper = mountToolbar({ total: 128, unparseableTotal: 3 })
    const left = wrapper.find('.toff-toolbar-left')
    const leftText = left.text()
    expect(leftText).toContain('共 128 条')
    expect(leftText).toContain('其中 3 条 Topic 格式无法解析')
    expect(left.find('.toff-warn-icon').exists()).toBe(true)
    // WarningFilled 图标渲染为 svg（项目现有 EP 图标，未引入图片资源）
    expect(left.find('.toff-warn-icon svg').exists()).toBe(true)
    wrapper.unmount()
  })

  it('右组顺序为 60 秒自动刷新 | 最近成功刷新：时间 立即刷新，保持同一逻辑组', () => {
    const wrapper = mountToolbar({ total: 128, lastRefreshText: '10:11:12' })
    const right = wrapper.find('.toff-toolbar-right')
    const t = right.text()
    const idxAuto = t.indexOf('60 秒自动刷新')
    const idxSep = t.indexOf('|')
    const idxLast = t.indexOf('最近成功刷新：10:11:12')
    const idxBtn = t.indexOf('立即刷新')
    expect(idxAuto).toBeGreaterThanOrEqual(0)
    expect(idxSep).toBeGreaterThan(idxAuto)
    expect(idxLast).toBeGreaterThan(idxSep)
    expect(idxBtn).toBeGreaterThan(idxLast)
    wrapper.unmount()
  })

  it('未产生最近成功刷新时间时右组不渲染分隔线与空时间，仍含自动刷新与立即刷新', () => {
    const wrapper = mountToolbar({ total: 5, lastRefreshText: null })
    const right = wrapper.find('.toff-toolbar-right')
    expect(right.text()).toContain('60 秒自动刷新')
    expect(right.text()).toContain('立即刷新')
    expect(right.text()).not.toContain('|')
    expect(right.text()).not.toContain('最近成功刷新')
    wrapper.unmount()
  })
})
