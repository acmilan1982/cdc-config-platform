/** 触发锚点矩形（DOMRect 的纯数据切片，便于测试与序列化）。 */
export interface TooltipAnchor {
  top: number
  left: number
  width: number
  height: number
  bottom: number
  right: number
}

export interface TooltipSize {
  width: number
  height: number
}

export interface ViewportSize {
  width: number
  height: number
}

export interface TooltipPlacement {
  top: number
  left: number
  placement: 'top' | 'bottom'
}

const EDGE_GAP = 8
const VIEWPORT_MARGIN = 8

/**
 * 页面级单实例 Tooltip 定位（DSS-REQ-070⑧，AC-077）：
 * 优先放在锚点上方；上方空间不足而下方充足则放下方；
 * 水平尽量对准锚点中心并对视口四边避让，任意边都不越界。
 */
export function computeTooltipPlacement(
  anchor: TooltipAnchor,
  tooltip: TooltipSize,
  viewport: ViewportSize,
): TooltipPlacement {
  const vw = Math.max(0, viewport.width)
  const vh = Math.max(0, viewport.height)
  const roomAbove = anchor.top
  const roomBelow = vh - anchor.bottom

  let placement: 'top' | 'bottom'
  let top: number
  if (roomAbove >= tooltip.height + EDGE_GAP && (roomBelow < tooltip.height + EDGE_GAP || roomAbove >= roomBelow)) {
    placement = 'top'
    top = anchor.top - tooltip.height - EDGE_GAP
  } else {
    placement = 'bottom'
    top = anchor.bottom + EDGE_GAP
  }

  let left = anchor.left + anchor.width / 2 - tooltip.width / 2
  left = clamp(left, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, vw - tooltip.width - VIEWPORT_MARGIN))
  top = clamp(top, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, vh - tooltip.height - VIEWPORT_MARGIN))

  return { top, left, placement }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
