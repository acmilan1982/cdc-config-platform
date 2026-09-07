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

describe('computeTooltipPlacement 单行优先宽 Tooltip 不越界（R1-01：去掉固定 420px 上限）', () => {
  it('自然宽度超过 420px 但低于安全视口：按真实宽度整体定位，不截断到 420', () => {
    // 宽屏下自然单行宽 900px > 旧 420 上限，但仍远小于安全视口 → 整体不越界
    const wide: ViewportSize = { width: 1920, height: 1080 }
    const big = { width: 900, height: 40 }
    const p = computeTooltipPlacement(anchor(800, 500), big, wide)
    // 不因任何 420 常量被截断：left/right 按 900px 计算且落入视口
    expect(p.left).toBeGreaterThanOrEqual(8)
    expect(p.left + 900).toBeLessThanOrEqual(1920 - 8)
    expect(p.placement).toBe('top')
  })

  it('宽度逼近安全视口上限（border-box 含 padding/border）仍不横向越界', () => {
    // 安全视口 = 1000 - 16（左右各留 8），测量宽度按 border-box 传入（含 padding/border）
    const vp: ViewportSize = { width: 1000, height: 600 }
    const maxWidth = 1000 - 16 // 984，视作已含 padding/border 的实际宽度
    const p = computeTooltipPlacement(anchor(300, 400), { width: maxWidth, height: 60 }, vp)
    expect(p.left).toBeGreaterThanOrEqual(8)
    expect(p.left + maxWidth).toBeLessThanOrEqual(1000 - 8)
  })
})
