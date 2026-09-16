import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ElementPlus from 'element-plus'
import QueryListActions from './QueryListActions.vue'

/**
 * 查询 / 重置操作区（SHARED_COMPONENT_DESIGN §7.4.3 / §7.5）：
 * 两个按钮本体由公共组件渲染，固定宽度四值同锁（默认 62/62）、可选显式高度（无公共默认值）、
 * 常驻 Spinner 只切换 opacity/visibility、busy 以 aria-disabled + 事件入口防御阻断（不用原生 disabled）。
 * 判据均落在渲染结果与真实 CSS 声明上，不做纯字符串快照。
 */

function actionsSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/components/query-list/QueryListActions.vue'), 'utf8')
}

function scopedStyle(): string {
  const block = actionsSource().match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
  return block.replace(/\/\*[\s\S]*?\*\//g, '')
}

function ruleOf(selector: string): string {
  return (
    scopedStyle().match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ??
    ''
  )
}

function mountActions(props: Record<string, unknown> = {}): VueWrapper {
  return mount(QueryListActions, { props, global: { plugins: [ElementPlus] } })
}

const FIVE_ZERO = 'flex-grow: 0;'
const FOUR_LOCK = (px: number): string[] => [
  `width: ${px}px`,
  `min-width: ${px}px`,
  `max-width: ${px}px`,
  `flex-basis: ${px}px`,
  FIVE_ZERO,
  'flex-shrink: 0;',
  'box-sizing: border-box',
]

function queryButton(wrapper: VueWrapper) {
  return wrapper.find('button.ql-actions__query')
}

function resetButton(wrapper: VueWrapper) {
  return wrapper.find('button.ql-actions__reset')
}

describe('QueryListActions 固定宽度四值同锁与可选高度（§7.5.1/§7.5.2）', () => {
  it('默认两按钮均为 62px 四值同锁（width/min/max/flex-basis + flex 0 0 + border-box）', () => {
    const wrapper = mountActions()
    for (const [label, btn] of [
      ['query', queryButton(wrapper)],
      ['reset', resetButton(wrapper)],
    ] as const) {
      const style = btn.attributes('style') ?? ''
      for (const decl of FOUR_LOCK(62)) {
        expect(style, `${label} 缺 ${decl}`).toContain(decl)
      }
    }
    wrapper.unmount()
  })

  it('未传 heightPx 时不输出任何 height 声明（无公共默认高度）', () => {
    const wrapper = mountActions()
    expect(queryButton(wrapper).attributes('style')).not.toMatch(/height\s*:/)
    expect(resetButton(wrapper).attributes('style')).not.toMatch(/height\s*:/)
    wrapper.unmount()
  })

  it('显式 heightPx=30 时两按钮都输出 height:30px 且宽度锁不变', () => {
    const wrapper = mountActions({ heightPx: 30 })
    for (const btn of [queryButton(wrapper), resetButton(wrapper)]) {
      const style = btn.attributes('style') ?? ''
      expect(style).toMatch(/height\s*:\s*30px/)
      for (const decl of FOUR_LOCK(62)) expect(style).toContain(decl)
    }
    wrapper.unmount()
  })

  it('自定义宽度分别作用于各自按钮，且四值仍同锁', () => {
    const wrapper = mountActions({ queryWidthPx: 88, resetWidthPx: 70 })
    for (const decl of FOUR_LOCK(88)) expect(queryButton(wrapper).attributes('style')).toContain(decl)
    for (const decl of FOUR_LOCK(70)) expect(resetButton(wrapper).attributes('style')).toContain(decl)
    wrapper.unmount()
  })

  it('按钮文案可由 prop 覆盖；文案节点为独立固定节点（不随 Loading 变化）', () => {
    const wrapper = mountActions({ queryText: '检索', resetText: '清空' })
    expect(queryButton(wrapper).find('.ql-action-label').text()).toBe('检索')
    expect(resetButton(wrapper).find('.ql-action-label').text()).toBe('清空')
    wrapper.unmount()
  })
})

describe('QueryListActions 常驻 Spinner 与四态几何（§7.5.3）', () => {
  it('Spinner 为查询按钮内的常驻节点；重置按钮不带指示器', () => {
    const wrapper = mountActions()
    expect(queryButton(wrapper).findAll('.ql-btn-spinner')).toHaveLength(1)
    expect(resetButton(wrapper).findAll('.ql-btn-spinner')).toHaveLength(0)
    wrapper.unmount()
  })

  it('四态（idle / queryLoading / busy / queryLoading+busy）下 Spinner 节点数恒为 1，仅切换 is-visible', async () => {
    const wrapper = mountActions()
    const seen: Array<number> = []
    const states = [
      { queryLoading: false, busy: false, visible: false },
      { queryLoading: true, busy: false, visible: true },
      { queryLoading: false, busy: true, visible: false },
      { queryLoading: true, busy: true, visible: true },
    ]
    for (const state of states) {
      await wrapper.setProps({ queryLoading: state.queryLoading, busy: state.busy })
      const spinners = queryButton(wrapper).findAll('.ql-btn-spinner')
      seen.push(spinners.length)
      expect(spinners[0]!.classes().includes('is-visible')).toBe(state.visible)
      // 文案节点在四态中恒定
      expect(queryButton(wrapper).find('.ql-action-label').text()).toBe('查询')
    }
    expect(seen).toEqual([1, 1, 1, 1])
    wrapper.unmount()
  })

  it('Spinner 绝对定位脱离内容流，且只靠 opacity/visibility 切换（不增删节点、不改尺寸）', () => {
    const body = ruleOf('.ql-btn-spinner')
    expect(body).toMatch(/(^|;)\s*position:\s*absolute\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*opacity:\s*0\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*visibility:\s*hidden\s*(;|$)/)
    expect(body).toMatch(/left:\s*var\(--ql-btn-spinner-inset,\s*2px\)/)
    expect(body).toMatch(/(^|;)\s*width:\s*12px\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*height:\s*12px\s*(;|$)/)
    const visible = ruleOf('.ql-btn-spinner.is-visible')
    expect(visible).toMatch(/(^|;)\s*opacity:\s*1\s*(;|$)/)
    expect(visible).toMatch(/(^|;)\s*visibility:\s*visible\s*(;|$)/)
    expect(visible).not.toMatch(/width|height|margin|padding/)
  })

  it('按钮本身为相对定位包含块，指示器不进入内容流', () => {
    expect(ruleOf('.ql-actions__query')).toMatch(/(^|;)\s*position:\s*relative\s*(;|$)/)
  })
})

describe('QueryListActions busy 阻断与事件（§7.4.3）', () => {
  it('busy=true：两按钮都带 aria-disabled=true，但都不使用原生 disabled', async () => {
    const wrapper = mountActions({ busy: true })
    for (const btn of [queryButton(wrapper), resetButton(wrapper)]) {
      expect(btn.attributes('aria-disabled')).toBe('true')
      expect(btn.attributes('disabled')).toBeUndefined()
      expect(btn.classes()).not.toContain('is-disabled')
    }
    wrapper.unmount()
  })

  it('busy=false：不输出 aria-disabled（未阻断时不加语义标记）', () => {
    const wrapper = mountActions()
    expect(queryButton(wrapper).attributes('aria-disabled')).toBeUndefined()
    expect(resetButton(wrapper).attributes('aria-disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('busy=true 时点击两按钮均不 emit，且事件入口直接返回（防御性阻断）', async () => {
    const wrapper = mountActions({ busy: true })
    await queryButton(wrapper).trigger('click')
    await queryButton(wrapper).trigger('click')
    await resetButton(wrapper).trigger('click')
    expect(wrapper.emitted('query')).toBeUndefined()
    expect(wrapper.emitted('reset')).toBeUndefined()
    wrapper.unmount()
  })

  it('非 busy 时点击查询 emit 一次 query；点击重置 emit 一次 reset', async () => {
    const wrapper = mountActions()
    await queryButton(wrapper).trigger('click')
    await resetButton(wrapper).trigger('click')
    expect(wrapper.emitted('query')).toHaveLength(1)
    expect(wrapper.emitted('reset')).toHaveLength(1)
    wrapper.unmount()
  })

  it('aria-busy 只随 queryLoading 出现，重置按钮恒不带 aria-busy', async () => {
    const wrapper = mountActions()
    expect(queryButton(wrapper).attributes('aria-busy')).toBeUndefined()
    await wrapper.setProps({ queryLoading: true })
    expect(queryButton(wrapper).attributes('aria-busy')).toBe('true')
    expect(resetButton(wrapper).attributes('aria-busy')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('QueryListActions 视觉契约与隔离（§7.4.3 / §10）', () => {
  it('查询按钮为深色主按钮、重置为浅灰次按钮，颜色全部来自 --ql-* 令牌', () => {
    const query = ruleOf('.ql-actions__query')
    expect(query).toMatch(/background:\s*var\(--ql-actions-query-bg,\s*#09090b\)/)
    expect(query).toMatch(/color:\s*var\(--ql-actions-query-fg,\s*#ffffff\)/)
    expect(query).toMatch(/padding:\s*var\(--ql-actions-query-padding,\s*0 16px\)/)
    expect(query).toMatch(/border-radius:\s*var\(--ql-actions-radius,\s*6px\)/)

    const reset = ruleOf('.ql-actions__reset')
    expect(reset).toMatch(/background:\s*var\(--ql-actions-reset-bg,\s*#e4e4e7\)/)
    expect(reset).toMatch(/color:\s*var\(--ql-actions-reset-fg,\s*#3f3f46\)/)
    expect(reset).toMatch(/padding:\s*var\(--ql-actions-reset-padding,\s*0 14px\)/)
  })

  it('焦点态使用 :focus（不是 :focus-visible），与参考实现既有口径一致', () => {
    expect(scopedStyle()).toMatch(/\.ql-actions__query:hover,\s*\.ql-actions__query:focus\s*\{/)
    expect(scopedStyle()).toMatch(/\.ql-actions__reset:hover,\s*\.ql-actions__reset:focus\s*\{/)
    expect(scopedStyle()).not.toMatch(/:focus-visible/)
  })

  it('操作区为整体 flex item：inline-flex + 8px 间距 + flex:0 0 auto（不可拆散）', () => {
    const body = ruleOf('.ql-actions')
    expect(body).toMatch(/(^|;)\s*display:\s*inline-flex\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*align-items:\s*center\s*(;|$)/)
    expect(body).toMatch(/gap:\s*var\(--ql-actions-gap,\s*8px\)/)
    expect(body).toMatch(/flex:\s*0 0 auto/)
  })

  it('不穿透 Element Plus、不使用 !important、不使用 defineExpose', () => {
    expect(scopedStyle()).not.toMatch(/\.el-button|\.el-icon|\.is-loading/)
    expect(scopedStyle()).not.toMatch(/!important/)
    expect(actionsSource()).not.toMatch(/defineExpose/)
    expect(actionsSource()).not.toMatch(/:deep\(/)
  })
})
