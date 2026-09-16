import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  useQueryListTooltip,
  QUERY_LIST_TOOLTIP_DELAY_MS,
} from './useQueryListTooltip'

/**
 * 页面级单实例 Tooltip 控制器（SHARED_COMPONENT_DESIGN §7.6.1 / §7.6.3 / §7.6.5 / §7.6.6）：
 * 统一 320ms 延迟；空内容即关闭；新 key 先即时关闭旧项；同一时刻最多 1 个 current；
 * 锚点几何在 show 时刻取样；目标真正成为 current 时才建立 `aria-describedby` 读屏关联，
 * 并且只增删自身 token（空 token 集合时删除属性）。
 * 原私有 `useSnapshotTooltip.spec.ts` 的全部覆盖迁移到本文件，并补齐 ARIA 与 maxWidthPx 校验。
 */

function rect(over: Partial<DOMRect> = {}): DOMRect {
  return {
    top: 100,
    left: 200,
    width: 50,
    height: 20,
    bottom: 120,
    right: 250,
    x: 200,
    y: 100,
    toJSON: () => ({}),
    ...over,
  } as DOMRect
}

function element(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement('span')
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value)
  document.body.appendChild(el)
  return el
}

function showOn(ctl: ReturnType<typeof useQueryListTooltip>, el: HTMLElement, key = 'k', content = '内容'): void {
  ctl.show({ key, content, el })
}

function describedBy(el: HTMLElement): string | null {
  return el.getAttribute('aria-describedby')
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('useQueryListTooltip 延迟与揭示（§7.6.1）', () => {
  it('show 后未满 320ms 不产生 current；满 320ms 才成为 current', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    showOn(ctl, el)

    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS - 1)
    expect(ctl.current.value).toBeNull()

    vi.advanceTimersByTime(1)
    expect(ctl.current.value).not.toBeNull()
    expect(ctl.current.value!.key).toBe('k')
    expect(ctl.current.value!.content).toBe('内容')
    ctl.destroy()
  })

  it('空内容（含纯空白）立即关闭，不进入延迟窗', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    showOn(ctl, el)
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value).not.toBeNull()

    ctl.show({ key: 'k2', content: '   ', el })
    expect(ctl.current.value).toBeNull()
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value).toBeNull()
    ctl.destroy()
  })

  it('锚点在 show 时刻取样：延迟窗内触发元素被移除仍能揭示', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    el.getBoundingClientRect = () => rect()
    showOn(ctl, el)
    el.remove()

    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value).not.toBeNull()
    expect(ctl.current.value!.anchor.top).toBe(100)
    ctl.destroy()
  })

  it('getBoundingClientRect 恰好调用一次，anchor 等于该矩形', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    const spy = vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect({ top: 11, left: 22, width: 33, height: 44, bottom: 55, right: 66 }))
    showOn(ctl, el)

    expect(spy).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    const anchor = ctl.current.value!.anchor
    expect(anchor).toEqual({ top: 11, left: 22, width: 33, height: 44, bottom: 55, right: 66 })
    ctl.destroy()
  })

  it('显式 anchor（无 el）同样支持，且不触发任何元素属性写入', () => {
    const ctl = useQueryListTooltip()
    const setSpy = vi.spyOn(HTMLElement.prototype, 'setAttribute')
    const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeAttribute')
    ctl.show({ key: 'k', content: '内容', anchor: rect() })

    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value!.anchor.top).toBe(100)
    // setAttribute / removeAttribute 的实参元组不同，统一按「首参为属性名」的结构取用
    const aria = (spy: { mock: { calls: ReadonlyArray<ReadonlyArray<unknown>> } }) =>
      spy.mock.calls.filter((c) => c[0] === 'aria-describedby')
    expect(aria(setSpy)).toHaveLength(0)
    expect(aria(removeSpy)).toHaveLength(0)
    ctl.destroy()
  })

  it('取消：延迟窗内 hide 不产生 current；揭示后 hide 置空', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    showOn(ctl, el)
    ctl.hide()
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value).toBeNull()

    showOn(ctl, el)
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value).not.toBeNull()
    ctl.hide()
    expect(ctl.current.value).toBeNull()
    ctl.destroy()
  })

  it('单实例：新 key 先即时关闭旧项，旧项的待揭示定时器作废', () => {
    const ctl = useQueryListTooltip()
    const first = element()
    const second = element()
    showOn(ctl, first, 'a', 'A')
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value!.key).toBe('a')

    showOn(ctl, second, 'b', 'B')
    // 切换瞬间旧项立即消失（不允许两个同时残留）
    expect(ctl.current.value).toBeNull()
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value!.key).toBe('b')

    // 旧项后续再推进时间也不复活
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value!.key).toBe('b')
    ctl.destroy()
  })

  it('同一 key 重复触发以最后一次为准（不重复累积、不重复计时）', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    showOn(ctl, el, 'a', 'A1')
    vi.advanceTimersByTime(100)
    showOn(ctl, el, 'a', 'A2')

    // 第二次 show 重新开始计时
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS - 1)
    expect(ctl.current.value).toBeNull()
    vi.advanceTimersByTime(1)
    expect(ctl.current.value!.content).toBe('A2')
    ctl.destroy()
  })

  it('延迟窗内切换目标：只有最后一次 show 的锚点与内容生效', () => {
    const ctl = useQueryListTooltip()
    const a = element()
    const b = element()
    a.getBoundingClientRect = () => rect({ top: 1 })
    b.getBoundingClientRect = () => rect({ top: 2 })
    showOn(ctl, a, 'a', 'A')
    vi.advanceTimersByTime(100)
    showOn(ctl, b, 'b', 'B')
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)

    expect(ctl.current.value!.key).toBe('b')
    expect(ctl.current.value!.anchor.top).toBe(2)
    ctl.destroy()
  })
})

describe('useQueryListTooltip 内容宽度上限校验（§7.6.3）', () => {
  it('有限正数被原样投影到 target.maxWidthPx', () => {
    const ctl = useQueryListTooltip()
    ctl.show({ key: 'k', content: '内容', anchor: rect(), maxWidthPx: 480 })
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value!.maxWidthPx).toBe(480)
    ctl.destroy()
  })

  it('0 / 负数 / NaN / Infinity / 缺失一律视为省略', () => {
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY, undefined]) {
      const ctl = useQueryListTooltip()
      ctl.show({ key: 'k', content: '内容', anchor: rect(), maxWidthPx: bad })
      vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
      expect(ctl.current.value!.maxWidthPx, `maxWidthPx=${String(bad)}`).toBeUndefined()
      ctl.destroy()
    }
  })

  it('maxWidthPx 变化会随下一次 show 生效（控制器不缓存旧值）', () => {
    const ctl = useQueryListTooltip()
    ctl.show({ key: 'a', content: 'A', anchor: rect(), maxWidthPx: 480 })
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value!.maxWidthPx).toBe(480)

    ctl.show({ key: 'b', content: 'B', anchor: rect() })
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value!.maxWidthPx).toBeUndefined()
    ctl.destroy()
  })
})

describe('useQueryListTooltip aria-describedby 关联（§7.6.5）', () => {
  it('目标成为 current 时追加自身 hostId token', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    showOn(ctl, el)
    expect(describedBy(el)).toBeNull()

    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(describedBy(el)).toBe(ctl.hostId)
    ctl.destroy()
  })

  it('追加不改写既有 token，顺序为「原有 token + hostId」', () => {
    const ctl = useQueryListTooltip()
    const el = element({ 'aria-describedby': 'pre-existing' })
    showOn(ctl, el)
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(describedBy(el)).toBe(`pre-existing ${ctl.hostId}`)

    ctl.hide()
    expect(describedBy(el)).toBe('pre-existing')
    ctl.destroy()
  })

  it('按 ASCII 空白拆分并去重，自身 token 不重复追加', () => {
    const ctl = useQueryListTooltip()
    const el = element({ 'aria-describedby': '  foo\n\tfoo  ' })
    showOn(ctl, el)
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(describedBy(el)).toBe(`foo ${ctl.hostId}`)

    // 再次触发同一元素：hostId 已存在，不重复追加
    ctl.show({ key: 'k2', content: '内容2', el })
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(describedBy(el)).toBe(`foo ${ctl.hostId}`)
    ctl.destroy()
  })

  it('切换目标：先清除旧元素的自身 token，再关联新元素', () => {
    const ctl = useQueryListTooltip()
    const first = element({ 'aria-describedby': 'keep' })
    const second = element()
    showOn(ctl, first, 'a', 'A')
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(describedBy(first)).toBe(`keep ${ctl.hostId}`)

    showOn(ctl, second, 'b', 'B')
    expect(describedBy(first)).toBe('keep')
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(describedBy(second)).toBe(ctl.hostId)
    expect(describedBy(first)).toBe('keep')
    ctl.destroy()
  })

  it('只移除自身 token；清空后删除属性（不遗留空 aria-describedby）', () => {
    const ctl = useQueryListTooltip()
    const only = element()
    const shared = element({ 'aria-describedby': 'other' })
    showOn(ctl, only, 'a', 'A')
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    ctl.hide()
    expect(describedBy(only)).toBeNull()

    showOn(ctl, shared, 'b', 'B')
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    ctl.hide()
    expect(describedBy(shared)).toBe('other')
    ctl.destroy()
  })

  it('延迟窗内取消（未成为 current）不建立关联', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    showOn(ctl, el)
    ctl.hide()
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(describedBy(el)).toBeNull()
    ctl.destroy()
  })

  it('destroy 清除延迟、移除自身关联并进入终止态', () => {
    const ctl = useQueryListTooltip()
    const el = element({ 'aria-describedby': 'keep' })
    showOn(ctl, el)
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(describedBy(el)).toBe(`keep ${ctl.hostId}`)

    ctl.destroy()
    expect(ctl.current.value).toBeNull()
    expect(describedBy(el)).toBe('keep')

    showOn(ctl, el)
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value).toBeNull()
    expect(describedBy(el)).toBe('keep')
  })

  it('destroy 在延迟窗内同样清空待揭示状态', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    showOn(ctl, el)
    ctl.destroy()
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value).toBeNull()
    expect(describedBy(el)).toBeNull()
  })
})

describe('useQueryListTooltip 全局关闭与实例标识（§7.6.1 / §7.6.6）', () => {
  it('每个控制器拥有唯一 hostId，格式为 ql-tooltip-host-N', () => {
    const a = useQueryListTooltip()
    const b = useQueryListTooltip()
    expect(a.hostId).toMatch(/^ql-tooltip-host-\d+$/)
    expect(b.hostId).not.toBe(a.hostId)
    a.destroy()
    b.destroy()
  })

  it('scroll（捕获）/ resize / visibilitychange 均关闭当前目标', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    const unbind = ctl.bindGlobalClose()
    const cases: Array<() => void> = [
      () => window.dispatchEvent(new Event('scroll')),
      () => window.dispatchEvent(new Event('resize')),
      () => document.dispatchEvent(new Event('visibilitychange')),
    ]
    for (const fire of cases) {
      ctl.show({ key: 'k', content: '内容', el })
      vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
      expect(ctl.current.value).not.toBeNull()
      fire()
      expect(ctl.current.value).toBeNull()
    }
    unbind()
    ctl.destroy()
  })

  it('表格容器内部滚动（捕获阶段）同样关闭目标', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    const inner = document.createElement('div')
    document.body.appendChild(inner)
    const unbind = ctl.bindGlobalClose()
    ctl.show({ key: 'k', content: '内容', el })
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    expect(ctl.current.value).not.toBeNull()

    inner.dispatchEvent(new Event('scroll'))
    expect(ctl.current.value).toBeNull()
    unbind()
    ctl.destroy()
  })

  it('默认不启用 Escape 关闭（参考页面阶段一不得静默新增该交互）', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    const unbind = ctl.bindGlobalClose()
    ctl.show({ key: 'k', content: '内容', el })
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(ctl.current.value).not.toBeNull()
    unbind()
    ctl.destroy()
  })

  it('显式 escape=true 时才启用 Escape 关闭', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    const unbind = ctl.bindGlobalClose({ escape: true })
    ctl.show({ key: 'k', content: '内容', el })
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(ctl.current.value).toBeNull()
    unbind()
    ctl.destroy()
  })

  it('解绑后不再响应全局事件，且不误伤其它监听', () => {
    const ctl = useQueryListTooltip()
    const el = element()
    const unbind = ctl.bindGlobalClose()
    unbind()
    ctl.show({ key: 'k', content: '内容', el })
    vi.advanceTimersByTime(QUERY_LIST_TOOLTIP_DELAY_MS)
    window.dispatchEvent(new Event('scroll'))
    expect(ctl.current.value).not.toBeNull()
    ctl.destroy()
  })
})
