import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DataSourceSnapshotToolbar from './DataSourceSnapshotToolbar.vue'

/**
 * 测试环境限制说明（同 topic-offset 既有约定）：
 * vitest 使用 jsdom 且未注入 css，scoped 样式不生效，
 * “左区为完整逻辑块，宽度稳定不横向移动立即刷新”的布局通过结构断言表达：
 * .dss-toolbar 仅含左/右两个直接子组，按钮嵌套在 .dss-toolbar-right 内部。
 */

function mountToolbar(props: Record<string, unknown> = {}) {
  return mount(DataSourceSnapshotToolbar, {
    props: {
      lastRefreshText: '--',
      refreshing: false,
      busy: false,
      refreshError: '',
      ...props,
    },
    global: { plugins: [ElementPlus] },
  })
}

function refreshBtn(wrapper: ReturnType<typeof mountToolbar>) {
  return wrapper.findAll('button').find((b) => b.text().includes('立即刷新'))!
}

describe('DataSourceSnapshotToolbar 内容与失败内联提示（DSS-REQ-052/053/054/055，AC-047/068）', () => {
  it('显示 60 秒自动刷新｜最近成功刷新：时间 与 立即刷新', () => {
    const wrapper = mountToolbar({ lastRefreshText: '10:11:12' })
    const text = wrapper.text()
    expect(text).toContain('60 秒自动刷新｜最近成功刷新：10:11:12')
    expect(text).toContain('立即刷新')
    wrapper.unmount()
  })

  it('从未成功刷新时“最近成功刷新”显示 --（页面空值占位，不出现空时间）', () => {
    const wrapper = mountToolbar({ lastRefreshText: '--' })
    expect(wrapper.find('.dss-note').text()).toBe('60 秒自动刷新｜最近成功刷新：--')
    wrapper.unmount()
  })

  it('点击“立即刷新”触发 refresh', async () => {
    const wrapper = mountToolbar()
    await refreshBtn(wrapper).trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    wrapper.unmount()
  })

  it('refreshError 存在时渲染带 role=status 的收敛提示，不影响按钮', () => {
    const wrapper = mountToolbar({ refreshError: '刷新失败，将在约 60 秒后自动重试' })
    const err = wrapper.find('.dss-error')
    expect(err.exists()).toBe(true)
    expect(err.attributes('role')).toBe('status')
    expect(err.text()).toBe('刷新失败，将在约 60 秒后自动重试')
    wrapper.unmount()
  })

  it('无 refreshError 时错误区整段隐藏', () => {
    const wrapper = mountToolbar()
    expect(wrapper.find('.dss-error').exists()).toBe(false)
    wrapper.unmount()
  })

  it('轻量刷新(refreshing)或任一请求在途(busy)时禁用“立即刷新”', () => {
    const refreshing = mountToolbar({ refreshing: true })
    expect((refreshBtn(refreshing).element as HTMLButtonElement).disabled).toBe(true)
    refreshing.unmount()

    const busy = mountToolbar({ busy: true, refreshing: false })
    expect((refreshBtn(busy).element as HTMLButtonElement).disabled).toBe(true)
    busy.unmount()

    const idle = mountToolbar()
    expect((refreshBtn(idle).element as HTMLButtonElement).disabled).toBe(false)
    idle.unmount()
  })
})

describe('DataSourceSnapshotToolbar 左右分组与稳定宽度结构（AC-068，UI §6.1）', () => {
  it('外层工具栏仅含左(.dss-toolbar-left)右(.dss-toolbar-right)两个直接子组', () => {
    const wrapper = mountToolbar({ refreshError: '刷新失败，将在约 60 秒后自动重试' })
    const children = wrapper.find('.dss-toolbar').element.children
    expect(children).toHaveLength(2)
    expect(children[0].classList.contains('dss-toolbar-left')).toBe(true)
    expect(children[1].classList.contains('dss-toolbar-right')).toBe(true)
    // 说明文案与失败提示均在左组
    expect(children[0].textContent).toContain('60 秒自动刷新')
    expect(children[0].textContent).toContain('最近成功刷新')
    wrapper.unmount()
  })

  it('立即刷新按钮嵌套于右组内部，不是外层可直接被挤动换行的同级节点', () => {
    const wrapper = mountToolbar()
    const right = wrapper.find('.dss-toolbar-right')
    const btn = right.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('立即刷新')
    expect(btn.element.closest('.dss-toolbar-right')).not.toBeNull()
    expect(wrapper.find('.dss-toolbar > button').exists()).toBe(false)
    wrapper.unmount()
  })
})
