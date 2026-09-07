import { describe, it, expect } from 'vitest'
import { computeTooltipPlacement } from './tooltipPosition'
import type { TooltipAnchor, TooltipSize, ViewportSize } from './tooltipPosition'

function anchor(top: number, left: number, width = 20, height = 20): TooltipAnchor {
  return { top, left, width, height, bottom: top + height, right: left + width }
}

const TT: TooltipSize = { width: 200, height: 40 }
const VP: ViewportSize = { width: 1000, height: 600 }

describe('computeTooltipPlacement 视口四边避让（DSS-REQ-070⑧，AC-077）', () => {
  it('上方空间充足且不小于下方时优先置于上方（gap 8）', () => {
    // top=300（上余 300），bottom=320，vh 600 → 下余 280；上 ≥ 下 → top
    const p = computeTooltipPlacement(anchor(300, 500), TT, VP)
    expect(p.placement).toBe('top')
    expect(p.top).toBe(300 - 40 - 8) // 252
  })

  it('上方空间不足而下方充足时置于下方', () => {
    const p = computeTooltipPlacement(anchor(10, 500), TT, VP)
    expect(p.placement).toBe('bottom')
    expect(p.top).toBe(10 + 20 + 8) // 38
  })

  it('上方即使放得下，但下方空间明显更大时也选下方（空间较大侧优先）', () => {
    // top=100（上余 100 可放下 48），bottom=120，vh 600 → 下余 480；下 > 上 → bottom
    const p = computeTooltipPlacement(anchor(100, 500), TT, VP)
    expect(p.placement).toBe('bottom')
    expect(p.top).toBe(100 + 20 + 8)
  })

  it('水平对准锚点中心；超出右边缘时钳制到安全边距内', () => {
    // 锚点中心 left=910，tooltip 半宽 100 → 期望 left 810 超出 1000-200-8=792 → 钳制 792
    const p = computeTooltipPlacement(anchor(300, 900), TT, VP)
    expect(p.left).toBe(1000 - 200 - 8) // 792
  })

  it('水平左边缘同样避让：锚点贴近左边时 left 钳制到 8', () => {
    const p = computeTooltipPlacement(anchor(300, 0), TT, VP)
    expect(p.left).toBe(8)
  })

  it('竖直方向也做上下边缘钳制：bottom 超出视口底时夹回安全区域', () => {
    const tiny: ViewportSize = { width: 300, height: 60 }
    // bottom top=30+8=38，而可视区间 [8, 60-40-8=12]，→ 钳制到 12
    const p = computeTooltipPlacement(anchor(10, 20), TT, tiny)
    expect(p.placement).toBe('bottom')
    expect(p.top).toBe(60 - 40 - 8) // 12
  })

  it('窄视口下同时约束水平与竖直，不越任意一边', () => {
    const nano: ViewportSize = { width: 150, height: 60 }
    // tooltip 宽 160 > 视口安全区 → 可摆放范围塌缩为单点 8（水平），竖直亦钳到 8
    const p = computeTooltipPlacement(anchor(0, 0, 150, 20), { width: 160, height: 50 }, nano)
    expect(p.left).toBe(8)
    expect(p.top).toBe(8)
  })

  it('返回数值型 top/left，无 NaN/负值穿透', () => {
    const p = computeTooltipPlacement(anchor(0, 0), { width: 0, height: 0 }, { width: 0, height: 0 })
    expect(Number.isFinite(p.top)).toBe(true)
    expect(Number.isFinite(p.left)).toBe(true)
    expect(p.top).toBeGreaterThanOrEqual(0)
    expect(p.left).toBeGreaterThanOrEqual(0)
  })
})
