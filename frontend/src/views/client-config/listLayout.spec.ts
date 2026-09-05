import { describe, it, expect, vi, afterEach } from 'vitest'
import { descNeedsTip, measureChipWidth, packTwoLines } from './listLayout'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('packTwoLines：两行自适应打包（注入数值，不依赖布局）', () => {
  it('无数据源：显示 0、无隐藏', () => {
    expect(
      packTwoLines({ widths: [], containerWidth: 200, gap: 6, moreWidth: 30, maxLines: 2 }),
    ).toEqual({ shown: 0, hiddenCount: 0 })
  })

  it('容器宽度不可得（0/负数/非有限）：不臆测溢出，全部直接展示', () => {
    const base = { widths: [40, 40, 40], gap: 6, moreWidth: 30, maxLines: 2 }
    expect(packTwoLines({ ...base, containerWidth: 0 })).toEqual({ shown: 3, hiddenCount: 0 })
    expect(packTwoLines({ ...base, containerWidth: -5 })).toEqual({ shown: 3, hiddenCount: 0 })
    expect(packTwoLines({ ...base, containerWidth: Number.NaN })).toEqual({
      shown: 3,
      hiddenCount: 0,
    })
  })

  it('全部能放入 maxLines 行时：无 +N', () => {
    // 每行 ~200：5 个 40px + 间距恰好可放入单行；两行必然容纳
    const res = packTwoLines({
      widths: [40, 40, 40, 40, 40],
      containerWidth: 200,
      gap: 6,
      moreWidth: 30,
      maxLines: 2,
    })
    expect(res).toEqual({ shown: 5, hiddenCount: 0 })
  })

  it('两行放不下：第一行尽量放满，第二行末尾为 +N 预留槽位（moreWidth+gap）', () => {
    // containerWidth=120，gap=6，moreWidth=30 → 第二行可用 120-(30+6)=84
    // 第一行：40 + (40+6)=86 ≤120 →2；40+6+40+6+40=132 >120 →停（2）
    // 第二行：40 ≤84 →1；40+6+40=86 >84 →停（1）；shown=3，hidden=2
    const res = packTwoLines({
      widths: [40, 40, 40, 40, 40],
      containerWidth: 120,
      gap: 6,
      moreWidth: 30,
      maxLines: 2,
    })
    expect(res).toEqual({ shown: 3, hiddenCount: 2 })
  })

  it('极窄：第二行连一个都放不下时 also 为 +N 预留（shown 可能仅第一行）', () => {
    const res = packTwoLines({
      widths: [40, 40, 40, 40, 40],
      containerWidth: 46,
      gap: 6,
      moreWidth: 30,
      maxLines: 2,
    })
    // 第一行 40 ≤46 →1；第二行可用 46-36=10 →0；shown=1 hidden=4
    expect(res).toEqual({ shown: 1, hiddenCount: 4 })
  })

  it('maxLines=1 时只允许一行直接展示，其余进 +N', () => {
    const res = packTwoLines({
      widths: [40, 40],
      containerWidth: 80,
      gap: 6,
      moreWidth: 30,
      maxLines: 1,
    })
    expect(res).toEqual({ shown: 1, hiddenCount: 1 })
  })

  it('非法宽度中断打包：不越界访问后续项', () => {
    const res = packTwoLines({
      widths: [40, Number.NaN, 40, 40],
      containerWidth: 200,
      gap: 6,
      moreWidth: 30,
      maxLines: 2,
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
})
