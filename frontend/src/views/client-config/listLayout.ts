/**
 * 探针端管理列表“采集数据源”列单行自适应布局的纯函数与测量工具。
 *
 * 这些决策依赖真实元素尺寸；jsdom 没有布局，无法给出宽度。因此单行打包与文本截断
 * 判定抽成纯函数（用注入数值做单元测试），真实浏览器再作目测复核
 * （CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001-R1 §5.4/§5.6）。展示顺序（异常优先、组内保持原顺序）
 * 由页面组件在渲染前决定，此处只负责数量与测量。
 */

export interface PackChipsParams {
  /** 每个数据源标签按展示顺序的实测宽度（含内边距/边框），单位 px。 */
  widths: number[]
  /** 标签所在容器可用宽度（已扣除行级歧义标签等预留），单位 px。 */
  containerWidth: number
  /** 标签间距，单位 px。 */
  gap: number
  /** “+N”标签自身宽度，单位 px。 */
  moreWidth: number
  /** 单行最多直接展示数量（探针端管理固定为 6）。 */
  maxVisible?: number
}

export interface PackResult {
  /** 单行内直接展示的数量（前缀）。 */
  shown: number
  /** 未直接展示数量（= `+N` 的 N）。 */
  hiddenCount: number
}

/**
 * 单行自适应打包：
 * - `可见数量 = min（单行实际可容纳的数量，6）`；
 * - 实际可容纳数量不足（容器太窄放不下全部）时，末尾为 `+N` 预留 moreWidth+gap，
 *   保证 `+N` 不被裁切；
 * - 总量超过 maxVisible 或放不下时，`N` = 总数 − 直接展示数。
 * 展示顺序由调用方按“异常优先、组内保持原顺序”给定，此处只决定数量。
 */
export function packChips(params: PackChipsParams): PackResult {
  const { widths, containerWidth, gap, moreWidth } = params
  const maxVisible = params.maxVisible ?? 6
  const total = widths.length
  if (total === 0) return { shown: 0, hiddenCount: 0 }

  const place = (capWidth: number, capCount: number): number => {
    if (!Number.isFinite(capWidth) || capWidth < 0) return 0
    let used = 0
    let count = 0
    for (let i = 0; i < total; i += 1) {
      if (count >= capCount) break
      const w = widths[i]
      if (!Number.isFinite(w) || w < 0) break
      const need = count === 0 ? w : used + gap + w
      if (need > capWidth) break
      used = need
      count += 1
    }
    return count
  }

  // 无法取得真实容器宽度（如 jsdom/隐藏容器）：不臆测溢出，只按数量上限截断。
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    const shown = Math.min(total, maxVisible)
    return { shown, hiddenCount: total - shown }
  }

  // 全部放得下且不超过数量上限：不显示 +N。
  if (total <= maxVisible && place(containerWidth, total) === total) {
    return { shown: total, hiddenCount: 0 }
  }

  // 放不下或超量：单行内直接展示，末尾为 +N 预留 moreWidth+gap 槽位避免被裁切。
  const avail = containerWidth - (moreWidth + gap)
  const shown = place(Math.max(0, avail), maxVisible)
  return { shown, hiddenCount: Math.max(0, total - shown) }
}

/** 单行省略确实被截断才需要完整描述 Tooltip（CCFG-UI-005/008）。 */
export function descNeedsTip(clientWidth: number, scrollWidth: number): boolean {
  return Number.isFinite(clientWidth) && Number.isFinite(scrollWidth) && scrollWidth > clientWidth + 1
}

export interface ChipStyleOptions {
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  paddingX?: number
  borderWidth?: number
  maxEm?: number
}

/**
 * 采集数据源列标签的测量盒模型基准，必须与页面 `.cc-dstag` / `.cc-more` 的声明保持一致：
 * 高度 20px、字号 12px、字重 600、圆角 4px、无边框、左右内边距 9px
 * （参考页“角色”标签视觉语言，CCFG-UI-039）。标签盒模型变更后必须同步更新本基准，
 * 否则宽度估算偏差会导致标签遮挡或 `+N` 误计数（CCFG-REQ-107/CCFG-DESIGN-050）。
 */
export const CHIP_BOX: ChipStyleOptions = {
  fontSize: '12px',
  fontWeight: '600',
  lineHeight: '20px',
  paddingX: 9,
  borderWidth: 0,
  maxEm: 10,
}

/**
 * 以与列表标签一致的盒模型离屏测量一段文本的视觉宽度（px）。
 * 无法布局（jsdom 等返回 0）时返回 0，调用方按“全部直接展示”兜底。
 */
export function measureChipWidth(text: string, opts: ChipStyleOptions = {}): number {
  if (typeof document === 'undefined') return 0
  const fontSize = opts.fontSize ?? '14px'
  const fontWeight = opts.fontWeight ?? '400'
  const lineHeight = opts.lineHeight ?? '27px'
  const paddingX = opts.paddingX ?? 10
  const borderWidth = opts.borderWidth ?? 1
  const maxEm = opts.maxEm ?? 10

  const holder = document.createElement('div')
  holder.setAttribute('aria-hidden', 'true')
  holder.style.cssText =
    'position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;z-index:-1;'
  const span = document.createElement('span')
  span.style.cssText = [
    'box-sizing:border-box',
    'display:inline-block',
    `font-size:${fontSize}`,
    `font-weight:${fontWeight}`,
    `line-height:${lineHeight}`,
    `padding:0 ${paddingX}px`,
    `border:${borderWidth}px solid transparent`,
    'border-radius:4px',
    'white-space:nowrap',
    'overflow:hidden',
    'text-overflow:ellipsis',
    `max-width:${maxEm}em`,
  ].join(';')
  span.textContent = text
  holder.appendChild(span)
  document.body.appendChild(holder)
  const rect = span.getBoundingClientRect()
  const width = rect && rect.width > 0 ? rect.width : span.offsetWidth
  document.body.removeChild(holder)
  return width
}
