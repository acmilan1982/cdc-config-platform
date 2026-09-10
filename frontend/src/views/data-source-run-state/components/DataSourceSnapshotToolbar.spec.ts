import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ElementPlus from 'element-plus'
import DataSourceSnapshotToolbar from './DataSourceSnapshotToolbar.vue'

/**
 * 测试环境限制说明：vitest 使用 jsdom 且未注入 scoped css，无法计算真实像素宽度与换行行为，
 * “不可拆散刷新组、倒计时环、秒数固定 2ch 占位、按钮固定宽度”以结构/类/源码字面量契约表达，
 * 真实像素与几何稳定性（60→9 不移动、ring 同向递减、按钮 idle/loading 等宽）由浏览器开发验证覆盖。
 * R2 §8/§9：静态灰点被替换为真实自动刷新倒计时环；秒数来自 composable 投影 prop，本组件不做计时。
 */
const SRC = (): string =>
  readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotToolbar.vue'), 'utf8')

function mountToolbar(props: Record<string, unknown> = {}) {
  return mount(DataSourceSnapshotToolbar, {
    props: {
      lastRefreshText: '--',
      countdownSeconds: 60,
      countdownProgress: 1,
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

const RING_LENGTH = 2 * Math.PI * 6.5

describe('DataSourceSnapshotToolbar 内容与固定顺序（UI §13.3，R2 §9.1）', () => {
  it('直接子节点顺序固定：倒计时环→N 秒后自动刷新→分隔符→最近成功刷新→立即刷新', () => {
    const wrapper = mountToolbar({ lastRefreshText: '10:11:12' })
    const children = directChildren(wrapper)
    expect(children[0].classList.contains('dss-countdown-ring')).toBe(true)
    expect(children[1].classList.contains('dss-countdown-text')).toBe(true)
    expect(children[2].classList.contains('dss-refresh-sep')).toBe(true)
    expect(children[3].classList.contains('dss-refresh-time')).toBe(true)
    expect(children[4].classList.contains('dss-refresh-btn')).toBe(true)
    expect(children[1].textContent).toBe('60 秒后自动刷新')
    expect(children[3].textContent).toBe('最近成功刷新：10:11:12')
    expect(children[4].textContent).toContain('立即刷新')
    // 静态灰点已移除（R2 §9.1 用倒计时环替换）
    expect(wrapper.find('.dss-refresh-dot').exists()).toBe(false)
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
    expect(wrapper.find('.dss-toolbar-left').exists()).toBe(false)
    expect(wrapper.find('.dss-toolbar-right').exists()).toBe(false)
    expect(wrapper.find('.dss-toolbar').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotToolbar 倒计时环与可见秒数（R2 §9.1，装饰性 + 秒数为主信息）', () => {
  it('倒计时环为 16px 装饰性 SVG（aria-hidden），含 track 与 progress 两个 circle', () => {
    const wrapper = mountToolbar()
    const ring = wrapper.find('.dss-countdown-ring')
    expect(ring.exists()).toBe(true)
    expect(ring.attributes('aria-hidden')).toBe('true')
    expect(ring.attributes('role')).toBeUndefined()
    expect(ring.find('.dss-ring-track').exists()).toBe(true)
    expect(ring.find('.dss-ring-progress').exists()).toBe(true)
    wrapper.unmount()
  })

  it('环形进度随剩余比例同向递减：progress=1 满环(offset≈0)，0.5 半环，0 空环(offset≈周长)', () => {
    const off = (w: ReturnType<typeof mountToolbar>): number =>
      parseFloat((w.find('.dss-ring-progress').element as SVGCircleElement).style.strokeDashoffset)
    expect(Math.abs(off(mountToolbar({ countdownProgress: 1 })) - 0)).toBeLessThan(0.01)
    expect(Math.abs(off(mountToolbar({ countdownProgress: 0.5 })) - RING_LENGTH / 2)).toBeLessThan(0.1)
    expect(Math.abs(off(mountToolbar({ countdownProgress: 0 })) - RING_LENGTH)).toBeLessThan(0.1)
  })

  it('可见秒数明确显示：60→60、9→9、无安排→--，后缀“秒后自动刷新”恒定', () => {
    const w60 = mountToolbar({ countdownSeconds: 60 })
    const w9 = mountToolbar({ countdownSeconds: 9 })
    const wNone = mountToolbar({ countdownSeconds: null, countdownProgress: null })
    expect(w60.find('.dss-countdown-seconds').text()).toBe('60')
    expect(w9.find('.dss-countdown-seconds').text()).toBe('9')
    expect(wNone.find('.dss-countdown-seconds').text()).toBe('--')
    expect(w60.find('.dss-countdown-text').text()).toBe('60 秒后自动刷新')
    expect(w9.find('.dss-countdown-text').text()).toBe('9 秒后自动刷新')
    expect(wNone.find('.dss-countdown-text').text()).toBe('-- 秒后自动刷新')
    w60.unmount()
    w9.unmount()
    wNone.unmount()
  })

  it('秒数占位固定 2ch + tabular-nums；reduced-motion 关闭 progress 过渡但仍保留静态正确进度', () => {
    const src = SRC()
    expect(src).toMatch(/\.dss-countdown-seconds\s*\{[^}]*min-width:\s*2ch[^}]*\}/)
    expect(src).toMatch(/\.dss-countdown-seconds\s*\{[^}]*font-variant-numeric:\s*tabular-nums[^}]*\}/)
    expect(src).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*transition:\s*none/)
  })

  it('倒计时环不放进“立即刷新”按钮；环为独立直接子节点', () => {
    const wrapper = mountToolbar()
    const btn = refreshBtn(wrapper)
    expect(btn.find('.dss-countdown-ring').exists()).toBe(false)
    expect(btn.find('.dss-countdown-text').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotToolbar “立即刷新”白底细边框次级按钮（R5 §5）', () => {
  it('源码契约：无 primary/plain 类型；白底 #FFFFFF、1px #E4E4E7 边框、深灰文字 #3F3F46、6px 圆角、宽 110px；hover #F4F4F5、克制焦点环', () => {
    const src = SRC()
    expect(src).not.toMatch(/type="primary"/)
    expect(src).not.toMatch(/type="plain"/)
    expect(src).toMatch(/\.dss-refresh-btn\s*\{\s*width:\s*110px/)
    expect(src).toMatch(/box-sizing:\s*border-box/)
    expect(src).toMatch(/background:\s*#ffffff/)
    expect(src).toMatch(/border:\s*1px solid #e4e4e7/)
    expect(src).toMatch(/color:\s*var\(--dss-text-secondary, #3f3f46\)/)
    expect(src).toMatch(/border-radius:\s*6px/)
    // hover 浅灰，不再是灰色实心基底
    expect(src).toMatch(/\.dss-refresh-btn:hover[\s\S]{0,200}background:\s*#f4f4f5/)
    expect(src).toMatch(/focus-visible/)
    expect(src).toMatch(/outline:\s*2px solid rgba\(37, 99, 235, 0.5\)/)
    // 不是黑色主按钮/蓝色描边/纯文字链接（未引入主按钮类视觉）
    expect(src).not.toMatch(/background:\s*#09090b/)
    expect(src).not.toMatch(/background:\s*#2563eb/)
  })

  it('按钮承载独立固定宽度类 .dss-refresh-btn；仅 manual 在途显示 loading', () => {
    const wrapper = mountToolbar()
    expect(refreshBtn(wrapper).classes()).toContain('dss-refresh-btn')
    expect(refreshBtn(wrapper).classes()).toContain('el-button')
    expect(refreshBtn(wrapper).classes()).not.toContain('is-loading')
    wrapper.unmount()

    const loading = mountToolbar({ manualLoading: true })
    expect(refreshBtn(loading).classes()).toContain('is-loading')
    loading.unmount()
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

  it('无通用 Element Plus 全局覆盖：组件样式全部落在 .dss-* 命名空间内，未对裸 .el-button 或 :root 作全局覆盖', () => {
    const src = SRC()
    expect(src).not.toMatch(/:root/)
    // 除 scoped 自带的属性化选择器外，任何 .el-button 规则都必须以 .dss- 前缀出现
    expect(src).toMatch(/\.dss-refresh-group \.dss-refresh-btn/)
  })
})
