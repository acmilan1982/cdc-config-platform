/** Tooltip 与视口四边保留的最小安全距离（px）。 */
export const TIP_SAFETY_MARGIN = 8
/** Tooltip 常规最大宽度（px）；窄视口下按 tooltipMaxWidth 收窄。 */
export const TIP_DEFAULT_MAX_WIDTH = 340
/** Tooltip 与指针的间隙（px）。 */
export const TIP_GAP = 14

export interface PointerPoint {
  x: number
  y: number
}

export interface TipSize {
  width: number
  height: number
}

export interface ViewportSize {
  width: number
  height: number
}

export interface TipPosition {
  left: number
  top: number
}

/**
 * Tooltip 可用最大宽度：常规 340px，窄视口下收窄为 viewportWidth - 2*margin，
 * 保证左右两侧都至少保留 margin 安全距离。
 * 与 CSS `max-width: min(340px, calc(100vw - 16px))` 保持一致。
 */
export function tooltipMaxWidth(
  viewportWidth: number,
  maxWidth = TIP_DEFAULT_MAX_WIDTH,
  margin = TIP_SAFETY_MARGIN,
): number {
  return Math.min(maxWidth, Math.max(0, viewportWidth - margin * 2))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 计算 Tooltip 的 fixed 定位（R3 §4）：
 * 水平优先显示在指针右侧，右侧空间不足则显示在左侧/向左收拢；
 * 垂直优先显示在指针下方，下方不足则显示在上方，上方也不足则钳到安全上边；
 * 最终对四边做安全边距钳制。水平使用按视口收窄后的宽度，保证：
 *   left >= margin
 *   top >= margin
 *   left + usedWidth <= viewport.width - margin
 *   top + height <= viewport.height - margin
 */
export function computeTooltipPosition(
  pointer: PointerPoint,
  tooltipSize: TipSize,
  viewport: ViewportSize,
  gap = TIP_GAP,
  margin = TIP_SAFETY_MARGIN,
): TipPosition {
  const safeRight = viewport.width - margin
  const safeBottom = viewport.height - margin
  const width = Math.min(tooltipSize.width, tooltipMaxWidth(viewport.width, TIP_DEFAULT_MAX_WIDTH, margin))
  const height = tooltipSize.height

  let left: number
  if (pointer.x + gap + width <= safeRight) {
    left = pointer.x + gap
  } else {
    left = pointer.x - gap - width
  }
  left = clamp(left, margin, Math.max(margin, safeRight - width))

  let top: number
  if (pointer.y + gap + height <= safeBottom) {
    top = pointer.y + gap
  } else {
    top = pointer.y - gap - height
  }
  top = clamp(top, margin, Math.max(margin, safeBottom - height))

  return { left, top }
}
