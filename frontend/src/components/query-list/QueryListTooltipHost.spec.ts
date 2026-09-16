import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import QueryListTooltipHost from './QueryListTooltipHost.vue'
import type { QueryListTooltipTarget } from './types'

/**
 * 页面级单实例受控 Tooltip Host（SHARED_COMPONENT_DESIGN §7.4.6 / §7.5.6 / §7.6.2-§7.6.4）：
 * Teleport 到 body、不可交互、内容宽度只有一个来源（`target.maxWidthPx`，省略则视口安全上限）；
 * 目标切换后必须先回到不可见定位态、测量新尺寸、再一次性显示（无旧坐标残影）；
 * 定位为锚点矩形算法：视口四边避让、优先上方、水平居中并夹取到视口。
 * 原私有 `tooltipPosition.spec.ts` 的定位覆盖全部迁移到本文件的 Host 级集成断言（非字符串快照）。
 */

const HOST_SELECTOR = '.ql-tooltip[data-ql-tooltip-host="1"]'

function hostSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/components/query-list/QueryListTooltipHost.vue'), 'utf8')
}

function scopedStyle(): string {
  const block = hostSource().match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
  return block.replace(/\/\*[\s\S]*?\*\//g, '')
}

function ruleOf(selector: string): string {
  return (
    scopedStyle().match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
  )
}

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height })
}

/** 锚点矩形：与控制器 `toAnchor` 输出的字段集完全一致。 */
function anchor(top: number, left: number, width = 100, height = 20) {
  return { top, left, width, height, bottom: top + height, right: left + width }
}

function target(overrides: Partial<QueryListTooltipTarget> = {}): QueryListTooltipTarget {
  return { key: 'k', content: '内容', anchor: anchor(300, 500), ...overrides }
}

async function flush(): Promise<void> {
  await nextTick()
  await nextTick()
}

function hostEl(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(HOST_SELECTOR)
}

function styleOf(el: HTMLElement): { left: number; top: number; hidden: boolean; maxWidth: string } {
  const style = el.getAttribute('style') ?? ''
  return {
    left: Number(style.match(/left:\s*(-?[\d.]+)px/)?.[1] ?? NaN),
    top: Number(style.match(/top:\s*(-?[\d.]+)px/)?.[1] ?? NaN),
    hidden: /visibility:\s*hidden/.test(style),
    maxWidth: style.match(/max-width:\s*([^;]+)/)?.[1]?.trim() ?? '',
  }
}

async function mountAt(t: QueryListTooltipTarget | null, width = 240, height = 40): Promise<{
  wrapper: VueWrapper
  left: number
  top: number
}> {
  const widthSpy = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(width)
  const heightSpy = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height)
  const wrapper = mount(QueryListTooltipHost, { props: { id: 'host-x', target: t } })
  await flush()
  const el = hostEl()
  const parsed = el ? styleOf(el) : { left: NaN, top: NaN, hidden: true, maxWidth: '' }
  widthSpy.mockRestore()
  heightSpy.mockRestore()
  return { wrapper, left: parsed.left, top: parsed.top }
}

beforeEach(() => {
  setViewport(1000, 600)
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('QueryListTooltipHost 渲染与单实例（§7.4.6）', () => {
  it('target=null 时不渲染任何 DOM', () => {
    const wrapper = mount(QueryListTooltipHost, { props: { id: 'host-1', target: null } })
    expect(document.body.querySelector(HOST_SELECTOR)).toBeNull()
    expect(document.body.innerHTML).not.toContain('ql-tooltip')
    wrapper.unmount()
  })

  it('id 直接取传入值（Host 不生成第二个 ID），语义为 role=tooltip 且携带宿主标记', async () => {
    const wrapper = mount(QueryListTooltipHost, { props: { id: 'ql-tooltip-host-7', target: target() } })
    await flush()
    const el = document.body.querySelector(HOST_SELECTOR)
    expect(el).not.toBeNull()
    expect(el!.id).toBe('ql-tooltip-host-7')
    expect(el!.getAttribute('role')).toBe('tooltip')
    expect(el!.textContent?.trim()).toBe('内容')
    // 内容不依赖原生 title 属性
    expect(el!.getAttribute('title')).toBeNull()
    wrapper.unmount()
  })

  it('Teleport 到 body：宿主节点不是组件挂载容器的子节点', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const wrapper = mount(QueryListTooltipHost, {
      props: { id: 'host-2', target: target() },
      attachTo: container,
    })
    await flush()
    const el = hostEl()
    expect(el).not.toBeNull()
    expect(el!.parentElement).toBe(document.body)
    expect(container.contains(el!)).toBe(false)
    wrapper.unmount()
    container.remove()
  })

  it('目标切换与清空：任意时刻 body 内至多 1 个 Host；清空后无残留', async () => {
    const wrapper = mount(QueryListTooltipHost, { props: { id: 'host-3', target: target() } })
    await flush()
    expect(document.body.querySelectorAll(HOST_SELECTOR)).toHaveLength(1)

    await wrapper.setProps({ target: target({ key: 'other', content: '第二个', anchor: anchor(120, 60) }) })
    await flush()
    expect(document.body.querySelectorAll(HOST_SELECTOR)).toHaveLength(1)
    expect(hostEl()!.textContent?.trim()).toBe('第二个')

    await wrapper.setProps({ target: null })
    await flush()
    expect(document.body.querySelectorAll(HOST_SELECTOR)).toHaveLength(0)
    wrapper.unmount()
  })

  it('目标切换先回到不可见定位态，测量完成后才显示（不沿用旧锚点坐标）', async () => {
    const wrapper = mount(QueryListTooltipHost, { props: { id: 'host-4', target: target() } })
    await flush()
    const before = styleOf(hostEl()!)

    await wrapper.setProps({ target: target({ content: '新内容', anchor: anchor(120, 60) }) })
    // 未 flush：仍是不可见定位态，不携带任何已测量坐标
    const mid = styleOf(hostEl()!)
    expect(mid.hidden).toBe(true)
    expect(mid.left).toBeNaN()

    await flush()
    const after = styleOf(hostEl()!)
    expect(after.hidden).toBe(false)
    expect(after.top).not.toBe(before.top)
    wrapper.unmount()
  })
})

describe('QueryListTooltipHost 最大宽度只有一个来源（§7.6.3）', () => {
  it('省略 maxWidthPx：只使用视口安全上限', async () => {
    const wrapper = mount(QueryListTooltipHost, { props: { id: 'host-5', target: target() } })
    await flush()
    expect(styleOf(hostEl()!).maxWidth).toBe('var(--ql-tooltip-max-width, calc(100vw - 16px))')
    wrapper.unmount()
  })

  it('显式 maxWidthPx：收窄为 min(给定 px, 视口安全上限)', async () => {
    const wrapper = mount(QueryListTooltipHost, {
      props: { id: 'host-6', target: target({ maxWidthPx: 480 }) },
    })
    await flush()
    expect(styleOf(hostEl()!).maxWidth).toBe('min(480px, var(--ql-tooltip-max-width, calc(100vw - 16px)))')
    wrapper.unmount()
  })

  it('样式为 fixed 定位、指针事件穿透、内容优先单行、可长词换行', () => {
    const body = ruleOf('.ql-tooltip')
    expect(body).toMatch(/(^|;)\s*position:\s*fixed\s*(;|$)/)
    expect(body).toMatch(/pointer-events:\s*none/)
    expect(body).toMatch(/(^|;)\s*width:\s*max-content\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*box-sizing:\s*border-box\s*(;|$)/)
    expect(body).toMatch(/overflow-wrap:\s*anywhere/)
    expect(body).toMatch(/(^|;)\s*z-index:\s*var\(--ql-tooltip-z-index,\s*3000\)/)
  })

  it('不写死内容宽度上限：样式不含固定像素 max-width 常量', () => {
    expect(ruleOf('.ql-tooltip')).not.toMatch(/max-width:\s*\d+px/)
  })
})

describe('QueryListTooltipHost 锚点矩形定位（§7.6.2，迁移自 tooltipPosition 覆盖）', () => {
  it('上方空间充足且不小于下方时优先置于上方（top = anchor.top - height - 8）', async () => {
    const { wrapper, top } = await mountAt(target({ anchor: anchor(300, 500) }))
    expect(top).toBe(252)
    wrapper.unmount()
  })

  it('上方空间不足时置于下方（top = anchor.bottom + 8）', async () => {
    const { wrapper, top } = await mountAt(target({ anchor: anchor(10, 500) }))
    expect(top).toBe(38)
    wrapper.unmount()
  })

  it('上方够放但小于下方空间时置于下方', async () => {
    const { wrapper, top } = await mountAt(target({ anchor: anchor(100, 100) }))
    expect(top).toBe(128)
    wrapper.unmount()
  })

  it('水平居中于锚点：left = anchor 中心 - 内容半宽', async () => {
    const { wrapper, left } = await mountAt(target({ anchor: anchor(300, 500) }))
    expect(left).toBe(430)
    wrapper.unmount()
  })

  it('右侧越界时夹取到视口内：left = 视口宽 - 内容宽 - 8', async () => {
    const { wrapper, left } = await mountAt(target({ anchor: anchor(300, 900) }))
    expect(left).toBe(1000 - 240 - 8)
    wrapper.unmount()
  })

  it('左侧越界时夹取到 8px 边距', async () => {
    const { wrapper, left } = await mountAt(target({ anchor: anchor(300, 0) }))
    expect(left).toBe(8)
    wrapper.unmount()
  })

  it('下方越界时纵向夹取到视口内', async () => {
    setViewport(1000, 60)
    const { wrapper, top } = await mountAt(target({ anchor: anchor(10, 20) }))
    expect(top).toBe(12)
    wrapper.unmount()
  })

  it('极小视口收敛到左上边距 (8, 8) 且不出现负坐标', async () => {
    setViewport(10, 10)
    const { wrapper, left, top } = await mountAt(target({ anchor: anchor(2, 2) }))
    expect({ left, top }).toEqual({ left: 8, top: 8 })
    wrapper.unmount()
  })

  it('零尺寸测量结果下输出仍为有限且不小于边距的值', async () => {
    const { wrapper, left, top } = await mountAt(target({ anchor: anchor(300, 500) }), 0, 0)
    expect(Number.isFinite(left)).toBe(true)
    expect(Number.isFinite(top)).toBe(true)
    expect(left).toBeGreaterThanOrEqual(8)
    expect(top).toBeGreaterThanOrEqual(8)
    wrapper.unmount()
  })

  it('无 420px 硬上限：900px 宽内容在 1920 视口内完整落在安全区内', async () => {
    setViewport(1920, 1080)
    const { wrapper, left } = await mountAt(target({ anchor: anchor(500, 900) }), 900, 40)
    expect(left).toBeGreaterThanOrEqual(8)
    expect(left + 900).toBeLessThanOrEqual(1920 - 8)
    wrapper.unmount()
  })

  it('接近视口安全上限的宽度仍不横向越界（984 in 1000）', async () => {
    const { wrapper, left } = await mountAt(target({ anchor: anchor(500, 400) }), 984, 40)
    expect(left).toBeGreaterThanOrEqual(8)
    expect(left + 984).toBeLessThanOrEqual(1000 - 8)
    wrapper.unmount()
  })

  it('定位基准是锚点矩形（非指针坐标）：同一 anchor 重复渲染坐标稳定', async () => {
    const first = await mountAt(target({ anchor: anchor(200, 300) }))
    first.wrapper.unmount()
    document.body.innerHTML = ''
    const second = await mountAt(target({ anchor: anchor(200, 300) }))
    expect({ left: second.left, top: second.top }).toEqual({ left: first.left, top: first.top })
    second.wrapper.unmount()
  })
})
