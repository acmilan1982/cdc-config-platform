import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DataSourceSnapshotToolbar from './DataSourceSnapshotToolbar.vue'

/**
 * 测试环境限制说明：vitest 使用 jsdom 且未注入 scoped css，无法计算真实像素宽度与换行行为，
 * “不可拆散刷新组、按钮固定宽度、loading 图标显隐不改变几何”以结构与类断言表达
 * （单一 .dss-refresh-group、直接子节点固定顺序、按钮承载独立固定宽度类 .dss-refresh-btn），
 * 真实像素与几何稳定性由浏览器开发验证覆盖。
 */

function mountToolbar(props: Record<string, unknown> = {}) {
  return mount(DataSourceSnapshotToolbar, {
    props: {
      lastRefreshText: '--',
      refreshActive: false,
      manualLoading: false,
      busy: false,
      ...props,
    },
    global: { plugins: [ElementPlus] },
  })
}

function group(wrapper: ReturnType<typeof mountToolbar>) {
  const g = wrapper.find('.dss-refresh-group')
  expect(g.exists()).toBe(true)
  return g
}

function refreshBtn(wrapper: ReturnType<typeof mountToolbar>) {
  const btn = wrapper.findAll('button').find((b) => b.text().includes('立即刷新'))
  if (!btn) throw new Error('未找到“立即刷新”按钮')
  return btn
}

/** 刷新组直接子元素（元素节点），顺序即视觉顺序。 */
function directChildren(wrapper: ReturnType<typeof mountToolbar>) {
  return Array.from(group(wrapper).element.children) as HTMLElement[]
}

describe('DataSourceSnapshotToolbar 内容与固定顺序（UI §13.3，DSS-REQ-068，AC-071/072）', () => {
  it('刷新组为单一不可拆散结构，直接子节点顺序固定：圆点→60 秒自动刷新→分隔符→最近成功刷新→立即刷新', () => {
    const wrapper = mountToolbar({ lastRefreshText: '10:11:12' })
    const children = directChildren(wrapper)
    // 圆点 / 文案 / 分隔符 / 时间 / 按钮 五类元素按固定顺序存在
    expect(children[0].classList.contains('dss-refresh-dot')).toBe(true)
    expect(children[1].classList.contains('dss-refresh-text')).toBe(true)
    expect(children[2].classList.contains('dss-refresh-sep')).toBe(true)
    expect(children[3].classList.contains('dss-refresh-time')).toBe(true)
    expect(children[4].classList.contains('dss-refresh-btn')).toBe(true)
    expect(children[1].textContent).toBe('60 秒自动刷新')
    expect(children[3].textContent).toBe('最近成功刷新：10:11:12')
    expect(children[4].textContent).toContain('立即刷新')
    wrapper.unmount()
  })

  it('从未成功刷新时“最近成功刷新：--”（页面空值占位，不出现空时间）', () => {
    const wrapper = mountToolbar({ lastRefreshText: '--' })
    expect(directChildren(wrapper)[3].textContent).toBe('最近成功刷新：--')
    wrapper.unmount()
  })

  it('结果卡片头部只存在一个刷新逻辑组；按钮为组内直接子节点，不存在可单独靠右的外层右分组', () => {
    const wrapper = mountToolbar()
    expect(wrapper.findAll('.dss-refresh-group')).toHaveLength(1)
    expect(wrapper.find('.dss-refresh-group > button').exists()).toBe(true)
    // 旧版“文案左区 + 按钮右区”的双分组结构不复存在
    expect(wrapper.find('.dss-toolbar-left').exists()).toBe(false)
    expect(wrapper.find('.dss-toolbar-right').exists()).toBe(false)
    expect(wrapper.find('.dss-toolbar').exists()).toBe(false)
    wrapper.unmount()
  })

  it('错误提示已不在本组件内渲染（失败提示移入结果卡片稳定槽位，DSS-REQ-068）', () => {
    const wrapper = mountToolbar()
    expect(wrapper.text()).not.toContain('刷新失败')
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotToolbar 刷新按钮几何稳定与三态（DSS-REQ-071，AC-068/072）', () => {
  it('“立即刷新”承载独立固定宽度类 .dss-refresh-btn，仅 manual 在途显示 loading（is-loading 且原生禁用）', () => {
    const wrapper = mountToolbar()
    expect(refreshBtn(wrapper).classes()).toContain('dss-refresh-btn')
    expect(refreshBtn(wrapper).classes()).not.toContain('is-loading')
    expect((refreshBtn(wrapper).element as HTMLButtonElement).disabled).toBe(false)
    wrapper.unmount()

    const loading = mountToolbar({ manualLoading: true })
    expect(refreshBtn(loading).classes()).toContain('is-loading')
    wrapper.unmount()
    loading.unmount()
  })

  it('auto/restore 在途不使立即刷新按钮 loading（只有圆点激活，DSS-REQ-071 e）', () => {
    const wrapper = mountToolbar({ refreshActive: true, manualLoading: false })
    expect(refreshBtn(wrapper).classes()).not.toContain('is-loading')
    expect((refreshBtn(wrapper).element as HTMLButtonElement).disabled).toBe(false)
    wrapper.unmount()
  })

  it('busy 时按钮功能阻断但不原生禁用、不显示 loading：以 aria-disabled 标记（外观稳定，AC-072）', () => {
    const wrapper = mountToolbar({ busy: true })
    const btn = refreshBtn(wrapper)
    expect(btn.attributes('aria-disabled')).toBe('true')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
    expect(btn.classes()).not.toContain('is-loading')
    wrapper.unmount()
  })

  it('空闲时按钮无 aria-disabled；点击触发 refresh', async () => {
    const wrapper = mountToolbar()
    const btn = refreshBtn(wrapper)
    expect(btn.attributes('aria-disabled')).toBeUndefined()
    await btn.trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    wrapper.unmount()
  })

  it('busy 时点击“立即刷新”被事件防御直接返回：不产生 refresh（鼠标/键盘同一入口，DSS-REQ-053）', async () => {
    const wrapper = mountToolbar({ busy: true })
    const btn = refreshBtn(wrapper)
    await btn.trigger('click')
    btn.element.click()
    expect(wrapper.emitted('refresh')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotToolbar 刷新状态圆点（DSS-REQ-071 e，AC-071）', () => {
  it('默认圆点为灰非激活；刷新类请求在途时激活（is-active）', () => {
    const idle = mountToolbar()
    expect(idle.find('.dss-refresh-dot').classes()).not.toContain('is-active')
    idle.unmount()

    const active = mountToolbar({ refreshActive: true })
    expect(active.find('.dss-refresh-dot').classes()).toContain('is-active')
    active.unmount()
  })
})
