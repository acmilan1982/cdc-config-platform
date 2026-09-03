import { describe, it, expect } from 'vitest'
import {
  computeTooltipPosition,
  tooltipMaxWidth,
  TIP_DEFAULT_MAX_WIDTH,
  TIP_SAFETY_MARGIN,
  TIP_GAP,
} from './tooltipPosition'

/** 与实际定位完全一致的“已收窄宽度”推导，供不变量断言复用。 */
function usedWidth(width: number, viewportWidth: number): number {
  return Math.min(width, tooltipMaxWidth(viewportWidth, TIP_DEFAULT_MAX_WIDTH, TIP_SAFETY_MARGIN))
}

describe('tooltipPosition computeTooltipPosition 四边视口钳制（R3 §4/§7.2）', () => {
  const VIEW = { width: 1024, height: 768 }
  const M = TIP_SAFETY_MARGIN
  const G = TIP_GAP

  it('普通中央位置：右下显示，left/top 均为指针 + gap', () => {
    const pos = computeTooltipPosition({ x: 400, y: 300 }, { width: 220, height: 60 }, VIEW)
    expect(pos).toEqual({ left: 400 + G, top: 300 + G })
  })

  it('靠近右边：显示到指针左侧并收拢，右边界不超过 viewportWidth - 8', () => {
    const pos = computeTooltipPosition({ x: 1000, y: 300 }, { width: 220, height: 60 }, VIEW)
    // 右侧放不下 → 移到指针左侧
    expect(pos.left).toBeLessThan(1000)
    expect(pos.left).toBe(1000 - G - 220)
    expect(pos.left + 220).toBeLessThanOrEqual(VIEW.width - M)
    expect(pos.left).toBeGreaterThanOrEqual(M)
  })

  it('靠近底部：显示到指针上方，底边界不超过 viewportHeight - 8', () => {
    const pos = computeTooltipPosition({ x: 500, y: 740 }, { width: 220, height: 60 }, VIEW)
    // 下方放不下 → 移到指针上方
    expect(pos.top).toBeLessThan(740)
    expect(pos.top).toBe(740 - G - 60)
    expect(pos.top + 60).toBeLessThanOrEqual(VIEW.height - M)
    expect(pos.top).toBeGreaterThanOrEqual(M)
  })

  it('靠近顶部（指针在极上方）：不向上越界，top 不小于 8', () => {
    const pos = computeTooltipPosition({ x: 400, y: 2 }, { width: 220, height: 60 }, VIEW)
    // 下方空间足够，显示在指针下方，top = 2 + gap >= 8
    expect(pos.top).toBe(2 + G)
    expect(pos.top).toBeGreaterThanOrEqual(M)
    expect(pos.top + 60).toBeLessThanOrEqual(VIEW.height - M)
  })

  it('上方也不足时：top 钳制到 8，且仍满足底部安全边距', () => {
    // vh=200，safeBottom=192；指针 y=90 时下方放不下、上方会为负 → 钳到 8
    const pos = computeTooltipPosition({ x: 400, y: 90 }, { width: 220, height: 100 }, { width: 1024, height: 200 })
    expect(pos.top).toBe(M)
    expect(pos.top + 100).toBeLessThanOrEqual(200 - M)
  })

  it('左右均空间不足：left 钳制到 8，仍满足右侧安全边距', () => {
    // vw=200，safeRight=192；指针 x=90 时右侧放不下、左侧为负 → 钳到 8
    const pos = computeTooltipPosition({ x: 90, y: 50 }, { width: 100, height: 60 }, { width: 200, height: 768 })
    expect(pos.left).toBe(M)
    expect(pos.left + 100).toBeLessThanOrEqual(200 - M)
  })

  it('较高的不可解析提示：按实际高度定位，底边界仍在视口内', () => {
    const pos = computeTooltipPosition({ x: 700, y: 740 }, { width: 300, height: 160 }, VIEW)
    expect(pos.top + 160).toBeLessThanOrEqual(VIEW.height - M)
    expect(pos.top).toBe(740 - G - 160)
    expect(pos.left + 300).toBeLessThanOrEqual(VIEW.width - M)
  })

  it('视口宽度小于默认最大宽度时，实际宽度受 viewportWidth - 16 约束', () => {
    expect(tooltipMaxWidth(1024)).toBe(TIP_DEFAULT_MAX_WIDTH)
    expect(tooltipMaxWidth(300)).toBe(300 - M * 2)
    expect(tooltipMaxWidth(340)).toBe(340 - M * 2)
    // 传入超大宽度但窄视口：定位保证 left + 收窄宽度 <= vw - 8
    const pos = computeTooltipPosition({ x: 150, y: 100 }, { width: 500, height: 60 }, { width: 300, height: 768 })
    const used = usedWidth(500, 300)
    expect(used).toBe(300 - M * 2)
    expect(pos.left).toBeGreaterThanOrEqual(M)
    expect(pos.left + used).toBeLessThanOrEqual(300 - M)
  })

  it('不变量扫描：任意可容纳的指针/尺寸/视口组合均满足四边安全边距', () => {
    const sizes = [
      { width: 180, height: 60 },
      { width: 260, height: 60 },
      { width: 320, height: 60 },
      { width: 260, height: 120 },
      { width: 300, height: 160 },
    ]
    const viewports = [
      { width: 1024, height: 768 },
      { width: 800, height: 600 },
      { width: 500, height: 400 },
      { width: 360, height: 320 },
    ]
    for (const vp of viewports) {
      for (const size of sizes) {
        // 只扫描数学上可容纳的高（高度 <= 视口高 - 16），避免构造不可能满足约束的场景
        if (size.height > vp.height - M * 2) continue
        for (const x of [0, 40, 200, vp.width / 2, vp.width - 40, vp.width - 1]) {
          for (const y of [0, 40, 200, vp.height / 2, vp.height - 40, vp.height - 1]) {
            const pos = computeTooltipPosition({ x, y }, size, vp)
            const used = usedWidth(size.width, vp.width)
            expect(pos.left).toBeGreaterThanOrEqual(M)
            expect(pos.top).toBeGreaterThanOrEqual(M)
            expect(pos.left + used).toBeLessThanOrEqual(vp.width - M)
            expect(pos.top + size.height).toBeLessThanOrEqual(vp.height - M)
          }
        }
      }
    }
  })
})
