import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ElementPlus from 'element-plus'
import QueryListRefreshToolbar from './QueryListRefreshToolbar.vue'
import type { QueryListCountdown } from './types'

/**
 * 结果区右侧刷新逻辑组（SHARED_COMPONENT_DESIGN §7.4.5 / §7.5.2-§7.5.4）：
 * `countdown` 必填可空——`null` 表示本页不使用自动刷新（环 / 秒数 / 分隔符整体不渲染），
 * `{ seconds: null, progress: null }` 表示启用但当前无已安排周期（秒数显示 `--`）；
 * 立即刷新按钮 110px 四值同锁、常驻 Spinner 只切换 opacity/visibility、busy 以 aria-disabled + 事件入口阻断；
 * 组件不持有倒计时状态、不持有请求、不注册任何定时器。
 */

function toolbarSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/components/query-list/QueryListRefreshToolbar.vue'), 'utf8')
}

function scopedStyle(): string {
  const block = toolbarSource().match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
  return block.replace(/\/\*[\s\S]*?\*\//g, '')
}

function ruleOf(selector: string): string {
  return (
    scopedStyle().match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
  )
}

function mountToolbar(props: Record<string, unknown> = {}): VueWrapper {
  return mount(QueryListRefreshToolbar, {
    props: { countdown: { seconds: 30, progress: 0.5 } as QueryListCountdown, ...props },
    global: { plugins: [ElementPlus] },
  })
}

function refreshButton(wrapper: VueWrapper) {
  return wrapper.find('button.ql-refresh-btn')
}

const COUNTDOWN_PROPS = (countdown: QueryListCountdown | null) => ({ countdown })

describe('QueryListRefreshToolbar countdown 必填可空语义（§7.4.5）', () => {
  it('countdown === null：倒计时环、秒数文本、分隔符整体不渲染；时间与按钮仍在', () => {
    const wrapper = mountToolbar(COUNTDOWN_PROPS(null))
    expect(wrapper.find('.ql-countdown-ring').exists()).toBe(false)
    expect(wrapper.find('.ql-countdown-text').exists()).toBe(false)
    expect(wrapper.find('.ql-refresh-sep').exists()).toBe(false)
    expect(wrapper.find('.ql-refresh-time').exists()).toBe(true)
    expect(refreshButton(wrapper).exists()).toBe(true)
    wrapper.unmount()
  })

  it('countdown 非 null：环 / 秒数 / 单位 / 分隔符按固定顺序渲染', () => {
    const wrapper = mountToolbar(COUNTDOWN_PROPS({ seconds: 42, progress: 0.25 }))
    const group = wrapper.find('.ql-refresh-group')
    // SVG 元素的 className 是 SVGAnimatedString 而非字符串，统一取 class 属性。
    const classes = [...group.element.children].map((el) => el.getAttribute('class'))
    expect(classes.slice(0, 4)).toEqual([
      'ql-countdown-ring',
      'ql-countdown-text',
      'ql-refresh-sep',
      'ql-refresh-time',
    ])
    expect(wrapper.find('.ql-countdown-seconds').text()).toBe('42')
    expect(wrapper.find('.ql-countdown-unit').text()).toBe('秒后自动刷新')
    wrapper.unmount()
  })

  it('countdown.seconds === null：秒数槽渲染 `--`（槽位仍在，宽度不变）', () => {
    const wrapper = mountToolbar(COUNTDOWN_PROPS({ seconds: null, progress: null }))
    expect(wrapper.find('.ql-countdown-ring').exists()).toBe(true)
    expect(wrapper.find('.ql-countdown-seconds').text()).toBe('--')
    wrapper.unmount()
  })

  it('countdown.progress 驱动环的 stroke-dashoffset：0 → 满偏移（空环），1 → 0', () => {
    const full = mountToolbar(COUNTDOWN_PROPS({ seconds: 5, progress: 0 }))
    const progress = mountToolbar(COUNTDOWN_PROPS({ seconds: 5, progress: 1 }))
    const zero = Number(
      full.find('.ql-ring-progress').attributes('style')?.match(/stroke-dashoffset:\s*([\d.]+)/)?.[1] ?? NaN,
    )
    const one = Number(
      progress.find('.ql-ring-progress').attributes('style')?.match(/stroke-dashoffset:\s*([\d.]+)/)?.[1] ?? NaN,
    )
    expect(zero).toBeGreaterThan(40)
    expect(one).toBeLessThan(0.01)
    full.unmount()
    progress.unmount()
  })

  it('lastRefreshText/lastRefreshLabel 由 prop 覆盖；默认文本为 `--` 与 `最近成功刷新：`', () => {
    const defaults = mountToolbar()
    expect(defaults.find('.ql-refresh-time-prefix').text()).toBe('最近成功刷新：')
    expect(defaults.find('.ql-refresh-time-actual').text()).toBe('--')
    defaults.unmount()

    const custom = mountToolbar({ lastRefreshText: '08:00:00', lastRefreshLabel: '上次：' })
    expect(custom.find('.ql-refresh-time-prefix').text()).toBe('上次：')
    expect(custom.find('.ql-refresh-time-actual').text()).toBe('08:00:00')
    custom.unmount()
  })

  it('时间值槽位定宽常量常驻：reserve 恒为 88:88:88 且 aria-hidden（真实值不参与槽宽）', () => {
    const wrapper = mountToolbar({ lastRefreshText: '1:2:3' })
    const reserve = wrapper.find('.ql-refresh-time-reserve')
    expect(reserve.text()).toBe('88:88:88')
    expect(reserve.attributes('aria-hidden')).toBe('true')
    // 真实值与常量分离：定宽槽宽不随真实时间串长度变化
    expect(wrapper.find('.ql-refresh-time-actual').text()).toBe('1:2:3')
    wrapper.unmount()
  })

  it('reserve 常驻不增删、内容恒定；可见正文只有 prefix + 真实时间值', async () => {
    const wrapper = mountToolbar({ lastRefreshText: '--' })
    const snapshot = () => ({
      reserveCount: wrapper.findAll('.ql-refresh-time-reserve').length,
      reserveText: wrapper.find('.ql-refresh-time-reserve').text(),
      actualText: wrapper.find('.ql-refresh-time-actual').text(),
    })
    expect(snapshot()).toEqual({ reserveCount: 1, reserveText: '88:88:88', actualText: '--' })

    for (const value of ['09:05:07', '23:59:59', '00:00:00']) {
      await wrapper.setProps({ lastRefreshText: value })
      expect(snapshot(), `lastRefreshText=${value}`).toEqual({
        reserveCount: 1,
        reserveText: '88:88:88',
        actualText: value,
      })
    }
    wrapper.unmount()
  })

  it('定宽槽位靠常量 reserve；actual 绝对定位脱离内容流；不新增 font-family（视觉零改动）', () => {
    const reserve = ruleOf('.ql-refresh-time-reserve')
    expect(reserve).toMatch(/(^|;)\s*visibility:\s*hidden\s*(;|$)/)
    const actual = ruleOf('.ql-refresh-time-actual')
    expect(actual).toMatch(/(^|;)\s*position:\s*absolute\s*(;|$)/)
    expect(actual).toMatch(/(^|;)\s*left:\s*0\s*(;|$)/)
    expect(actual).toMatch(/(^|;)\s*top:\s*0\s*(;|$)/)
    // 时间值沿用页面既有字体，不引入等宽字体族
    const style = scopedStyle()
    expect(style).not.toMatch(/font-family/)
    expect(style).not.toMatch(/monospace/)
  })
})

describe('QueryListRefreshToolbar 固定宽度四值同锁与常驻 Spinner（§7.5.2/§7.5.3）', () => {
  it('默认按钮宽度 110px，四值同锁经 --ql-refresh-btn-width 驱动；CSS 声明四值齐备', () => {
    const wrapper = mountToolbar()
    const style = refreshButton(wrapper).attributes('style') ?? ''
    expect(style).toContain('--ql-refresh-btn-width: 110px')
    const body = ruleOf('.ql-refresh-btn')
    for (const decl of ['width', 'min-width', 'max-width', 'flex-basis']) {
      expect(body, `缺 ${decl}`).toMatch(
        new RegExp(`${decl}:\\s*var\\(--ql-refresh-btn-width,\\s*110px\\)`),
      )
    }
    expect(body).toMatch(/flex-grow:\s*0/)
    expect(body).toMatch(/flex-shrink:\s*0/)
    expect(body).toMatch(/(^|;)\s*box-sizing:\s*border-box\s*(;|$)/)
    wrapper.unmount()
  })

  it('refreshWidthPx 覆盖按钮宽度令牌，四值仍同锁（同一令牌驱动）', () => {
    const wrapper = mountToolbar({ refreshWidthPx: 96 })
    expect(refreshButton(wrapper).attributes('style')).toContain('--ql-refresh-btn-width: 96px')
    wrapper.unmount()
  })

  it('按钮高度不由公共层设置（保持 Element Plus 默认，§7.5.4）', () => {
    expect(refreshButton(mountToolbar()).attributes('style')).not.toMatch(/height\s*:/)
    expect(ruleOf('.ql-refresh-btn')).not.toMatch(/height\s*:/)
  })

  it('Spinner 为按钮内常驻节点，只切换 is-visible；文案节点为独立固定节点', async () => {
    const wrapper = mountToolbar()
    const seen: number[] = []
    for (const manualLoading of [false, true, false]) {
      await wrapper.setProps({ manualLoading })
      const spinners = refreshButton(wrapper).findAll('.ql-btn-spinner')
      seen.push(spinners.length)
      expect(spinners[0]!.classes().includes('is-visible')).toBe(manualLoading)
      expect(refreshButton(wrapper).find('.ql-action-label').text()).toBe('立即刷新')
    }
    expect(seen).toEqual([1, 1, 1])
    wrapper.unmount()
  })

  it('Spinner 绝对定位、只靠 opacity/visibility 切换、颜色 currentColor（不增删节点、不改尺寸）', () => {
    const body = ruleOf('.ql-btn-spinner')
    expect(body).toMatch(/(^|;)\s*position:\s*absolute\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*opacity:\s*0\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*visibility:\s*hidden\s*(;|$)/)
    expect(body).toMatch(/left:\s*var\(--ql-btn-spinner-inset,\s*2px\)/)
    expect(body).toMatch(/(^|;)\s*width:\s*12px\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*height:\s*12px\s*(;|$)/)
    expect(body).toMatch(/border:\s*2px solid currentColor/)
    const visible = ruleOf('.ql-btn-spinner.is-visible')
    expect(visible).toMatch(/(^|;)\s*opacity:\s*1\s*(;|$)/)
    expect(visible).toMatch(/(^|;)\s*visibility:\s*visible\s*(;|$)/)
    expect(visible).not.toMatch(/width|height|margin|padding/)
  })

  it('按钮为相对定位包含块；秒数槽 2ch 四值同锁（60/59/9/0 盒宽恒定）', () => {
    expect(ruleOf('.ql-refresh-btn')).toMatch(/(^|;)\s*position:\s*relative\s*(;|$)/)
    const seconds = ruleOf('.ql-countdown-seconds')
    for (const decl of ['width', 'min-width', 'max-width', 'flex-basis']) {
      expect(seconds, `缺 ${decl}`).toMatch(new RegExp(`${decl}:\\s*2ch`))
    }
    expect(seconds).toMatch(/(^|;)\s*box-sizing:\s*border-box\s*(;|$)/)
    expect(seconds).toMatch(/(^|;)\s*text-align:\s*right\s*(;|$)/)
    expect(seconds).toMatch(/font-variant-numeric:\s*tabular-nums/)
  })

  it('整组不可拆散且自身不换行：inline-flex + 8px 间距 + flex:0 0 auto + nowrap', () => {
    const body = ruleOf('.ql-refresh-group')
    expect(body).toMatch(/(^|;)\s*display:\s*inline-flex\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*align-items:\s*center\s*(;|$)/)
    expect(body).toMatch(/gap:\s*var\(--ql-refresh-group-gap,\s*8px\)/)
    expect(body).toMatch(/flex:\s*0 0 auto/)
    expect(body).toMatch(/(^|;)\s*white-space:\s*nowrap\s*(;|$)/)
  })

  it('组件不持有倒计时/请求：源码无定时器、无请求调用', () => {
    expect(toolbarSource()).not.toMatch(/setInterval|setTimeout|requestAnimationFrame/)
    expect(toolbarSource()).not.toMatch(/fetch\(|axios|\bXMLHttpRequest\b/)
    expect(toolbarSource()).not.toMatch(/defineExpose/)
  })
})

describe('QueryListRefreshToolbar busy 阻断与事件（§7.4.5）', () => {
  it('busy=true：按钮带 aria-disabled=true，但不使用原生 disabled、不带 is-disabled', () => {
    const wrapper = mountToolbar({ busy: true })
    const btn = refreshButton(wrapper)
    expect(btn.attributes('aria-disabled')).toBe('true')
    expect(btn.attributes('disabled')).toBeUndefined()
    expect(btn.classes()).not.toContain('is-disabled')
    wrapper.unmount()
  })

  it('busy=false：不输出 aria-disabled', () => {
    expect(refreshButton(mountToolbar()).attributes('aria-disabled')).toBeUndefined()
  })

  it('busy=true 时点击不 emit（事件入口防御性返回）', async () => {
    const wrapper = mountToolbar({ busy: true })
    await refreshButton(wrapper).trigger('click')
    await refreshButton(wrapper).trigger('click')
    expect(wrapper.emitted('refresh')).toBeUndefined()
    wrapper.unmount()
  })

  it('非 busy 时点击 emit 一次 refresh', async () => {
    const wrapper = mountToolbar()
    await refreshButton(wrapper).trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    wrapper.unmount()
  })

  it('aria-busy 只随 manualLoading 出现（倒计时在途不等于按钮 Loading）', async () => {
    const wrapper = mountToolbar()
    expect(refreshButton(wrapper).attributes('aria-busy')).toBeUndefined()
    await wrapper.setProps({ manualLoading: true })
    expect(refreshButton(wrapper).attributes('aria-busy')).toBe('true')
    wrapper.unmount()
  })
})

describe('QueryListRefreshToolbar 视觉契约与隔离（§7.5.4 / §10）', () => {
  it('按钮为浅底次按钮，颜色来自 --ql-* 令牌；hover 与 :focus 同口径', () => {
    const body = ruleOf('.ql-refresh-btn')
    expect(body).toMatch(/(^|;)\s*background:\s*#ffffff\s*(;|$)/)
    expect(body).toMatch(/border:\s*1px solid #e4e4e7/)
    expect(body).toMatch(/color:\s*var\(--ql-refresh-text-color,\s*#3f3f46\)/)
    expect(body).toMatch(/border-radius:\s*6px/)
    expect(scopedStyle()).toMatch(/\.ql-refresh-btn:hover,\s*\.ql-refresh-btn:focus\s*\{/)
    // 视觉全部由本组件 scoped 规则承担：不借用 Element Plus 的 primary/plain 类型
    const btnTag = toolbarSource().match(/<el-button[\s\S]*?>/)?.[0] ?? ''
    expect(btnTag).not.toMatch(/\btype=/)
    expect(btnTag).not.toMatch(/\bplain\b/)
  })

  it('保留 :focus-visible 外环（§7.5.4 与 Actions 有意不同）', () => {
    const focusVisible = ruleOf('.ql-refresh-btn:focus-visible')
    expect(focusVisible).toMatch(/outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.5\)/)
    expect(focusVisible).toMatch(/outline-offset:\s*1px/)
  })

  it('倒计时环 16px、轨道 #e4e4e7、进度 #2563eb；分隔符 1px / 14px 高（不含布局尺寸副作用）', () => {
    const ring = ruleOf('.ql-countdown-ring')
    expect(ring).toMatch(/width:\s*var\(--ql-countdown-size,\s*16px\)/)
    expect(ring).toMatch(/height:\s*var\(--ql-countdown-size,\s*16px\)/)
    expect(ruleOf('.ql-ring-track')).toMatch(/stroke:\s*var\(--ql-countdown-track,\s*#e4e4e7\)/)
    expect(ruleOf('.ql-ring-progress')).toMatch(/stroke:\s*var\(--ql-countdown-progress,\s*#2563eb\)/)

    const sep = ruleOf('.ql-refresh-sep')
    expect(sep).toMatch(/(^|;)\s*width:\s*1px\s*(;|$)/)
    expect(sep).toMatch(/height:\s*var\(--ql-refresh-sep-height,\s*14px\)/)
    expect(sep).toMatch(/flex:\s*0 0 auto/)
  })

  it('reduced-motion 下停止旋转与过渡，但指示器几何与可见性语义不变', () => {
    const style = scopedStyle()
    expect(style).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    expect(style).toMatch(/\.ql-btn-spinner\s*\{\s*animation:\s*none/)
  })

  it('不使用 !important / :deep / 全局选择器，不覆写 Element Plus 类', () => {
    const style = scopedStyle()
    expect(style).not.toMatch(/!important|:deep\(|::v-deep|:root/)
    expect(style).not.toMatch(/\.el-button|\.el-icon|\.is-loading/)
    expect(toolbarSource().match(/<style scoped>/g) ?? []).toHaveLength(1)
    expect(toolbarSource().match(/<style(?![^>]*\bscoped\b)[^>]*>/g) ?? []).toHaveLength(0)
  })
})
