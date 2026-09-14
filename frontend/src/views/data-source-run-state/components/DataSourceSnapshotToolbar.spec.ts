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

/**
 * 「最近成功刷新」的可见正文 = 固定前缀文本 + 可见 actual 文本。
 * 定宽槽位内另有 aria-hidden 的常量 reserve（88:88:88），它只占位、不显示、不参与读屏，
 * 因此不能用整节点 textContent 断言可见正文（R1 §5.2 / §7.1）。
 */
function visibleTimeText(el: HTMLElement): string {
  const prefix = el.querySelector('.dss-refresh-time-prefix')?.textContent ?? ''
  const actual = el.querySelector('.dss-refresh-time-actual')?.textContent ?? ''
  return `${prefix}${actual}`
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
    expect(visibleTimeText(children[3])).toBe('最近成功刷新：10:11:12')
    expect(children[4].textContent).toContain('立即刷新')
    // 静态灰点已移除（R2 §9.1 用倒计时环替换）
    expect(wrapper.find('.dss-refresh-dot').exists()).toBe(false)
    wrapper.unmount()
  })

  it('从未成功刷新时“最近成功刷新：--”（页面空值占位，不出现空时间）', () => {
    const wrapper = mountToolbar({ lastRefreshText: '--' })
    expect(visibleTimeText(directChildren(wrapper)[3])).toBe('最近成功刷新：--')
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

  it('秒数占位固定 2ch 槽位 + tabular-nums；reduced-motion 关闭 progress 过渡但仍保留静态正确进度', () => {
    const src = SRC()
    const rule = src.match(/\.dss-countdown-seconds\s*\{[^}]*\}/s)?.[0] ?? ''
    expect(rule).not.toBe('')
    // R1 §5.3：width / min-width / max-width / flex-basis 四值同锁 2ch，盒宽恒定（不再只靠 min-width 兜底）
    expect(rule).toMatch(/width:\s*2ch/)
    expect(rule).toMatch(/min-width:\s*2ch/)
    expect(rule).toMatch(/max-width:\s*2ch/)
    expect(rule).toMatch(/flex-basis:\s*2ch/)
    expect(rule).toMatch(/box-sizing:\s*border-box/)
    expect(rule).toMatch(/text-align:\s*right/)
    expect(rule).toMatch(/font-variant-numeric:\s*tabular-nums/)
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

describe('DataSourceSnapshotToolbar 时间值定宽槽位（R1 §5.2 / §7.1，DSS-AC-113 全矩形 0px 判据）', () => {
  const TIMES = ['--', '00:00:00', '11:11:11', '14:11:09', '14:11:10', '14:11:11', '23:59:59']

  it('固定前缀与可见时间值拆为独立子节点：prefix=“最近成功刷新：”，actual=真实时间值', () => {
    const wrapper = mountToolbar({ lastRefreshText: '14:11:11' })
    const time = directChildren(wrapper)[3]
    expect(time.querySelector('.dss-refresh-time-prefix')?.textContent).toBe('最近成功刷新：')
    expect(time.querySelector('.dss-refresh-time-actual')?.textContent).toBe('14:11:11')
    wrapper.unmount()
  })

  it('reserve 为常量节点 88:88:88，不可见语义（visibility:hidden）且 aria-hidden=true、不出现在可见正文', () => {
    const wrapper = mountToolbar({ lastRefreshText: '14:11:11' })
    const reserve = directChildren(wrapper)[3].querySelector('.dss-refresh-time-reserve')
    expect(reserve).not.toBeNull()
    expect(reserve?.textContent).toBe('88:88:88')
    expect(reserve?.getAttribute('aria-hidden')).toBe('true')
    expect(visibleTimeText(directChildren(wrapper)[3])).toBe('最近成功刷新：14:11:11')
    wrapper.unmount()
  })

  it('reserve 常驻且内容恒定：在 -- 与多个不同数字组合时间值之间切换，占位节点不增删、文本不变', () => {
    const domShape = (v: string) => {
      const wrapper = mountToolbar({ lastRefreshText: v })
      const time = directChildren(wrapper)[3]
      const shape = {
        children: Array.from(time.children).map((c) => (c as HTMLElement).className),
        valueChildren: Array.from(time.querySelector('.dss-refresh-time-value')?.children ?? []).map(
          (c) => (c as HTMLElement).className,
        ),
        reserve: time.querySelector('.dss-refresh-time-reserve')?.textContent,
        reserveHidden: time.querySelector('.dss-refresh-time-reserve')?.getAttribute('aria-hidden'),
        actualCount: time.querySelectorAll('.dss-refresh-time-actual').length,
        reserveCount: time.querySelectorAll('.dss-refresh-time-reserve').length,
      }
      wrapper.unmount()
      return shape
    }
    const base = domShape('--')
    for (const v of TIMES) {
      expect(domShape(v)).toEqual(base)
    }
    expect(base.reserve).toBe('88:88:88')
    expect(base.reserveHidden).toBe('true')
    expect(base.actualCount).toBe(1)
    expect(base.reserveCount).toBe(1)
  })

  it('可见正文严格为“最近成功刷新：{{ lastRefreshText }}”，全部时间取值均不泄漏 reserve 文本', () => {
    for (const v of TIMES) {
      const wrapper = mountToolbar({ lastRefreshText: v })
      expect(visibleTimeText(directChildren(wrapper)[3])).toBe(`最近成功刷新：${v}`)
      wrapper.unmount()
    }
  })

  it('源码静态契约：槽位定宽靠常量 reserve；actual 绝对定位脱离内容流；无 JS 测宽 / 观察器 / !important / 全局覆盖', () => {
    const src = SRC()
    const valueRule = src.match(/\.dss-refresh-time-value\s*\{[^}]*\}/s)?.[0] ?? ''
    const reserveRule = src.match(/\.dss-refresh-time-reserve\s*\{[^}]*\}/s)?.[0] ?? ''
    const actualRule = src.match(/\.dss-refresh-time-actual\s*\{[^}]*\}/s)?.[0] ?? ''
    expect(valueRule).not.toBe('')
    expect(reserveRule).not.toBe('')
    expect(actualRule).not.toBe('')
    // 槽位包含块：相对定位 + inline-block（宽度由流内 reserve 决定）
    expect(valueRule).toMatch(/position:\s*relative/)
    expect(valueRule).toMatch(/display:\s*inline-block/)
    // reserve 必须占位（visibility:hidden 而非 display:none），且不得可见
    expect(reserveRule).toMatch(/visibility:\s*hidden/)
    expect(reserveRule).not.toMatch(/display:\s*none/)
    // actual 绝对定位于槽位左上，脱离内容流，不推动相邻元素
    expect(actualRule).toMatch(/position:\s*absolute/)
    expect(actualRule).toMatch(/left:\s*0/)
    expect(actualRule).toMatch(/top:\s*0/)
    // 纯 CSS 方案：不引入 JS 测宽 / 尺寸观察器 / 轮询 / 强制样式 / 全局覆盖
    expect(src).not.toMatch(/!important/)
    expect(src).not.toMatch(/ResizeObserver/)
    expect(src).not.toMatch(/requestAnimationFrame/)
    expect(src).not.toMatch(/offsetWidth|clientWidth|getBoundingClientRect/)
    expect(src).not.toMatch(/(^|\n)\s*\.el-/)
    expect(src).not.toMatch(/:root/)
  })

  it('不改变时间值字体与页面现有文字视觉：不使用等宽字体族，不新增 font-family 声明', () => {
    const src = SRC()
    expect(src).not.toMatch(/font-family/)
    expect(src).not.toMatch(/monospace/)
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

  it('按钮承载独立固定宽度类 .dss-refresh-btn；仅 manual 在途点亮私有指示器（不再使用 Element Plus loading）', () => {
    const wrapper = mountToolbar()
    const idle = refreshBtn(wrapper)
    expect(idle.classes()).toContain('dss-refresh-btn')
    expect(idle.classes()).toContain('el-button')
    expect(idle.classes()).not.toContain('is-loading')
    expect(idle.find('.dss-btn-spinner').exists()).toBe(true)
    expect(idle.find('.dss-btn-spinner').classes()).not.toContain('is-visible')
    expect(idle.find('.dss-action-label').text()).toBe('立即刷新')
    wrapper.unmount()

    const loading = mountToolbar({ manualLoading: true })
    const loadingBtn = refreshBtn(loading)
    expect(loadingBtn.classes()).not.toContain('is-loading')
    expect(loadingBtn.find('.el-icon').exists()).toBe(false)
    expect((loadingBtn.element as HTMLButtonElement).disabled).toBe(false)
    expect(loadingBtn.find('.dss-btn-spinner').classes()).toContain('is-visible')
    expect(loadingBtn.find('.dss-action-label').text()).toBe('立即刷新')
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

describe('DataSourceSnapshotToolbar 立即刷新 Loading 视觉稳定性（DSS-REQ-089，AC-110/111/112/113）', () => {
  it('常驻指示器在 idle 与 Loading 两态都存在、仅切可见性；两态文案严格为“立即刷新”', () => {
    const idle = mountToolbar()
    const idleBtn = refreshBtn(idle)
    expect(idleBtn.find('.dss-btn-spinner').exists()).toBe(true)
    expect(idleBtn.find('.dss-btn-spinner').classes()).not.toContain('is-visible')
    expect(idleBtn.find('.dss-action-label').text()).toBe('立即刷新')
    expect(idleBtn.text().trim()).toBe('立即刷新')
    idle.unmount()

    const loading = mountToolbar({ manualLoading: true })
    const loadingBtn = refreshBtn(loading)
    expect(loadingBtn.find('.dss-btn-spinner').exists()).toBe(true)
    expect(loadingBtn.find('.dss-btn-spinner').classes()).toContain('is-visible')
    expect(loadingBtn.find('.dss-action-label').text()).toBe('立即刷新')
    expect(loadingBtn.text().trim()).toBe('立即刷新')
    loading.unmount()
  })

  it('指示器为 Feature 私有节点且 aria-hidden="true"；不借用 Element Plus loading 图标类', () => {
    const wrapper = mountToolbar({ manualLoading: true })
    const spinner = refreshBtn(wrapper).find('.dss-btn-spinner')
    expect(spinner.attributes('aria-hidden')).toBe('true')
    expect(spinner.classes()).not.toContain('is-loading')
    expect(spinner.classes()).not.toContain('el-icon')
    wrapper.unmount()
  })

  it('aria-busy 跟随 manualLoading：Loading 中为 true，空闲态移除；aria-disabled 语义不受影响', () => {
    const idle = mountToolbar()
    expect(refreshBtn(idle).attributes('aria-busy')).toBeUndefined()
    idle.unmount()

    const loading = mountToolbar({ manualLoading: true })
    expect(refreshBtn(loading).attributes('aria-busy')).toBe('true')
    loading.unmount()

    const busy = mountToolbar({ busy: true })
    const busyBtn = refreshBtn(busy)
    expect(busyBtn.attributes('aria-busy')).toBeUndefined()
    expect(busyBtn.attributes('aria-disabled')).toBe('true')
    busy.unmount()
  })

  it('状态独立：仅 busy（非 manual）不点亮指示器；仅 manual 不产生 aria-disabled', () => {
    const busy = mountToolbar({ busy: true })
    const busyBtn = refreshBtn(busy)
    expect(busyBtn.find('.dss-btn-spinner').classes()).not.toContain('is-visible')
    expect(busyBtn.attributes('aria-disabled')).toBe('true')
    busy.unmount()

    const manual = mountToolbar({ manualLoading: true })
    const manualBtn = refreshBtn(manual)
    expect(manualBtn.find('.dss-btn-spinner').classes()).toContain('is-visible')
    expect(manualBtn.attributes('aria-disabled')).toBeUndefined()
    manual.unmount()
  })

  it('源码静态契约：width/min-width/max-width/flex-basis 四值锁定 110px + box-sizing: border-box + position: relative', () => {
    const rule = SRC().match(/\.dss-refresh-btn\s*\{[^}]*\}/s)?.[0] ?? ''
    expect(rule).not.toBe('')
    expect(rule).toMatch(/width:\s*110px/)
    expect(rule).toMatch(/min-width:\s*110px/)
    expect(rule).toMatch(/max-width:\s*110px/)
    expect(rule).toMatch(/flex-basis:\s*110px/)
    expect(rule).toMatch(/box-sizing:\s*border-box/)
    expect(rule).toMatch(/position:\s*relative/)
  })

  it('源码静态契约：私有指示器绝对定位、不进内容流；显隐只切可见性/透明度；无 !important、无全局 EP 覆写、无 JS 尺寸监听', () => {
    const src = SRC()
    const spinner = src.match(/\.dss-btn-spinner\s*\{[^}]*\}/s)?.[0] ?? ''
    expect(spinner).not.toBe('')
    expect(spinner).toMatch(/position:\s*absolute/)
    expect(spinner).toMatch(/opacity:\s*0/)
    expect(spinner).toMatch(/visibility:\s*hidden/)
    expect(src).toMatch(/\.dss-btn-spinner\.is-visible\s*\{[^}]*opacity:\s*1[^}]*visibility:\s*visible/s)
    expect(src).not.toMatch(/!important/)
    expect(src).not.toMatch(/(^|\n)\s*\.el-button\s*\{/)
    expect(src).not.toMatch(/(^|\n)\s*\.el-icon\s*\{/)
    expect(src).not.toMatch(/(^|\n)\s*\.is-loading\s*\{/)
    expect(src).not.toMatch(/ResizeObserver/)
    expect(src).not.toMatch(/requestAnimationFrame/)
    // 仍不引入主按钮/蓝色基底视觉（保持次级白底细边框）
    expect(src).not.toMatch(/background:\s*#09090b/)
    expect(src).not.toMatch(/background:\s*#2563eb/)
  })

  it('reduced-motion 规则在停止旋转的同时保留静态可见指示器（不隐藏、不改变几何）', () => {
    const src = SRC()
    const block = src.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(block).not.toBe('')
    expect(block).toMatch(/\.dss-btn-spinner\s*\{[^}]*animation:\s*none/)
    expect(block).toMatch(/\.dss-countdown-ring \.dss-ring-progress\s*\{[^}]*transition:\s*none/)
    expect(block).not.toMatch(/display:\s*none/)
    expect(block).not.toMatch(/visibility:\s*hidden/)
  })
})
