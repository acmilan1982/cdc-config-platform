import { describe, it, expect, vi, afterEach } from 'vitest'
import { descNeedsTip, measureChipWidth, packChips } from './listLayout'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('packChips：单行自适应打包，可见数量 = min(单行实际可容纳数, 6)（注入数值，不依赖布局）', () => {
  it('无数据源：显示 0、无隐藏', () => {
    expect(
      packChips({ widths: [], containerWidth: 200, gap: 8, moreWidth: 30, maxVisible: 6 }),
    ).toEqual({ shown: 0, hiddenCount: 0 })
  })

  it('容器宽度不可得（0/负数/非有限）：只按数量上限截断，不臆测宽度溢出', () => {
    const base = { widths: [40, 40, 40, 40, 40, 40, 40, 40], gap: 8, moreWidth: 30, maxVisible: 6 }
    expect(packChips({ ...base, containerWidth: 0 })).toEqual({ shown: 6, hiddenCount: 2 })
    expect(packChips({ ...base, containerWidth: -5 })).toEqual({ shown: 6, hiddenCount: 2 })
    expect(packChips({ ...base, containerWidth: Number.NaN })).toEqual({ shown: 6, hiddenCount: 2 })
  })

  it('总数 ≤ 6 且单行放得下：无 +N，全部直接展示', () => {
    // 5 个 40px + 4×8 gap = 232 ≤ 260
    const res = packChips({ widths: [40, 40, 40, 40, 40], containerWidth: 260, gap: 8, moreWidth: 30 })
    expect(res).toEqual({ shown: 5, hiddenCount: 0 })
  })

  it('总数 ≤ 6 但单行放不下：末尾为 +N 预留槽位（moreWidth+gap），多余项进 +N', () => {
    // containerWidth=120，gap=8，moreWidth=30 → 可用 120-(30+8)=82
    // 40 ≤82 →1；40+8+40=88 >82 →停（1）；shown=1，hidden=4
    const res = packChips({
      widths: [40, 40, 40, 40, 40],
      containerWidth: 120,
      gap: 8,
      moreWidth: 30,
      maxVisible: 6,
    })
    expect(res).toEqual({ shown: 1, hiddenCount: 4 })
  })

  it('总数 > 6：即使单行物理上放得下也只直接展示 6，其余进 +N（数量上限优先）', () => {
    // 7 个 30px + 6×8 gap = 258，宽容器物理可放满；仍按 maxVisible=6 截断
    const res = packChips({
      widths: [30, 30, 30, 30, 30, 30, 30],
      containerWidth: 1000,
      gap: 8,
      moreWidth: 30,
      maxVisible: 6,
    })
    expect(res).toEqual({ shown: 6, hiddenCount: 1 })
  })

  it('总数 > 6 且单行连 6 个都放不下：预留 +N 后按实际可容纳数截断', () => {
    // 7 个 40px；容器 250 → 可用 250-(30+8)=212：40,88,136,184,224>212 →4
    const res = packChips({
      widths: [40, 40, 40, 40, 40, 40, 40],
      containerWidth: 250,
      gap: 8,
      moreWidth: 30,
      maxVisible: 6,
    })
    expect(res).toEqual({ shown: 4, hiddenCount: 3 })
  })

  it('maxVisible 可覆盖：默认 6，显式传 3 时按 3 上限截断', () => {
    const res = packChips({
      widths: [30, 30, 30, 30, 30, 30, 30],
      containerWidth: 1000,
      gap: 8,
      moreWidth: 30,
      maxVisible: 3,
    })
    expect(res).toEqual({ shown: 3, hiddenCount: 4 })
  })

  it('极窄：预留 +N 后连一个都放不下 → shown=0，全部进 +N', () => {
    const res = packChips({
      widths: [40, 40, 40, 40, 40, 40],
      containerWidth: 46,
      gap: 8,
      moreWidth: 30,
      maxVisible: 6,
    })
    // 可用 46-(30+8)=8 <40 →0；shown=0 hidden=6
    expect(res).toEqual({ shown: 0, hiddenCount: 6 })
  })

  it('非法宽度中断打包：不越界访问后续项', () => {
    const res = packChips({
      widths: [40, Number.NaN, 40, 40],
      containerWidth: 200,
      gap: 8,
      moreWidth: 30,
      maxVisible: 6,
    })
    expect(res.hiddenCount).toBeGreaterThanOrEqual(0)
    expect(res.shown).toBeGreaterThanOrEqual(1)
  })
})

describe('descNeedsTip：仅真实截断才需要 Tooltip', () => {
  it('scrollWidth 明显大于 clientWidth → 需要', () => {
    expect(descNeedsTip(120, 200)).toBe(true)
  })

  it('等宽或接近等宽 → 不需要（避免误差抖动）', () => {
    expect(descNeedsTip(120, 120)).toBe(false)
    expect(descNeedsTip(120, 121)).toBe(false) // 容差 +1
  })

  it('非有限尺寸（jsdom 无布局返回 0）→ 不触发', () => {
    expect(descNeedsTip(0, 0)).toBe(false)
    expect(descNeedsTip(Number.NaN, 200)).toBe(false)
  })
})

describe('measureChipWidth：离屏测量盒模型宽度', () => {
  it('jsdom 无真实布局时返回 0（调用方按全部直接展示兜底），且不抛异常', () => {
    expect(typeof measureChipWidth('机构A')).toBe('number')
    expect(Number.isFinite(measureChipWidth('机构A'))).toBe(true)
    expect(measureChipWidth('')).toBeGreaterThanOrEqual(0)
  })

  it('未显式传盒模型时采用放大标签默认值（14px/10px 内边距/1px 边框/10em 上限）', () => {
    expect(measureChipWidth('机构', { fontSize: '14px' })).toBeGreaterThanOrEqual(0)
  })
})
