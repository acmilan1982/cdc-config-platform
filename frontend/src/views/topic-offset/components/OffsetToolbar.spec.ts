import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import OffsetToolbar from './OffsetToolbar.vue'

/**
 * 测试环境限制说明（R3 §7.1）：
 * vitest 使用 jsdom 且未配置 css 注入，scoped 样式不会被应用，
 * getComputedStyle/getBoundingClientRect 无法反映真实换行布局。
 * 因此“右组禁止内部换行 / 外层允许左右组整体换行”的布局规则，
 * 通过组件结构断言表达：外层 .toff-toolbar 仅含两个直接子组，
 * 右组所有刷新元素（自动刷新、分隔线、最近刷新、失败弱提示、立即刷新）
 * 均嵌套在 .toff-toolbar-right 内部，按钮不是外层可单独漂移的同级节点。
 * 真正的 flex-wrap: nowrap 样式定义于 OffsetToolbar.vue <style scoped>。
 */

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

describe('OffsetToolbar 右组禁止内部换行 / 外层整组换行（R3 修复一）', () => {
  it('外层工具栏仅含左右两个直接子组，允许两整组上下排列而非组内拆散', () => {
    const wrapper = mountToolbar({ total: 128, unparseableTotal: 3, lastRefreshText: '10:11:12' })
    const children = wrapper.find('.toff-toolbar').element.children
    expect(children).toHaveLength(2)
    expect(children[0].classList.contains('toff-toolbar-left')).toBe(true)
    expect(children[1].classList.contains('toff-toolbar-right')).toBe(true)
    wrapper.unmount()
  })

  it('立即刷新按钮嵌套于右组内部，不是外层可被单独挤到下一行的同级节点', () => {
    const wrapper = mountToolbar({ total: 1, lastRefreshText: '10:11:12' })
    const right = wrapper.find('.toff-toolbar-right')
    const btn = right.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('立即刷新')
    // 右组是按钮的祖先容器 → 换行只发生在左右两组的边界，不会拆散右组
    expect(btn.element.closest('.toff-toolbar-right')).not.toBeNull()
    // 按钮并非外层 .toff-toolbar 的直接子级
    expect(wrapper.find('.toff-toolbar > button').exists()).toBe(false)
    wrapper.unmount()
  })

  it('refreshError 存在时仍位于右组内部，不把按钮单独拆出右组', () => {
    const wrapper = mountToolbar({
      total: 1,
      lastRefreshText: null,
      refreshError: '自动刷新失败，已保留上次数据',
    })
    const right = wrapper.find('.toff-toolbar-right')
    const t = right.text()
    const idxAuto = t.indexOf('60 秒自动刷新')
    const idxErr = t.indexOf('自动刷新失败')
    const idxBtn = t.indexOf('立即刷新')
    expect(idxErr).toBeGreaterThan(idxAuto)
    expect(idxBtn).toBeGreaterThan(idxErr)
    expect(wrapper.find('.toff-toolbar-right .toff-error').exists()).toBe(true)
    expect(right.find('button').text()).toContain('立即刷新')
    wrapper.unmount()
  })

  it('最近成功刷新时间存在时右组保持 自动刷新 → 分隔线 → 最近刷新 → 立即刷新 的顺序', () => {
    const wrapper = mountToolbar({ total: 128, unparseableTotal: 3, lastRefreshText: '10:11:12', refreshError: '' })
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
})
