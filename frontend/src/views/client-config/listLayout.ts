/**
 * 探针端管理列表“采集数据源”列两行自适应布局的纯函数与测量工具。
 *
 * 这些决策依赖真实元素尺寸；jsdom 没有布局，无法给出宽度。因此两行打包与文本截断
 * 判定抽成纯函数（用注入数值做单元测试），真实浏览器再作目测复核
 * （CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001 §7/§8）。展示顺序（异常优先、组内保持原顺序）
 * 由页面组件在渲染前决定，此处只负责数量与测量。
 */

export interface PackParams {
  /** 每个数据源标签按展示顺序的实测宽度（含内边距/边框），单位 px。 */
  widths: number[]
  /** 标签所在容器可用宽度（已扣除行级歧义标签等预留），单位 px。 */
  containerWidth: number
  /** 标签间距，单位 px。 */
  gap: number
  /** “+N”标签自身宽度，单位 px。 */
  moreWidth: number
  /** 允许的最大行数（探针端管理固定为 2）。 */
  maxLines: number
}

export interface PackResult {
  /** 两行内直接展示的数量（前缀）。 */
  shown: number
  /** 未直接展示数量（= `+N` 的 N）。 */
  hiddenCount: number
}

/**
 * 两行自适应打包：
 * - 全部能放入 maxLines 整行时不显示 `+N`；
 * - 放不下时在第二行末尾为 `+N` 预留 moreWidth+gap，保证 `+N` 不被裁切/换到第三行；
 * - `N` = 总数 − 直接展示数。
 * 展示顺序由调用方按“异常优先、组内保持原顺序”给定，此处只决定数量。
 */
export function packTwoLines(params: PackParams): PackResult {
  const { widths, containerWidth, gap, moreWidth, maxLines } = params
  const total = widths.length
  if (total === 0) return { shown: 0, hiddenCount: 0 }
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    // 无法取得真实容器宽度（如 jsdom/隐藏容器）：不臆测溢出，全部直接展示。
    return { shown: total, hiddenCount: 0 }
  }

  const fitCount = (start: number, lineCap: number): number => {
    let used = 0
    let count = 0
    for (let i = start; i < total; i += 1) {
      const w = widths[i]
      if (!Number.isFinite(w) || w < 0) return count
      const need = count === 0 ? w : used + gap + w
      if (need > lineCap) break
      used = need
      count += 1
    }
    return count
  }

  const fitFullLines = (): number => {
    let idx = 0
    for (let line = 0; line < maxLines && idx < total; line += 1) {
      idx += fitCount(idx, containerWidth)
    }
    return idx
  }

  if (fitFullLines() >= total) return { shown: total, hiddenCount: 0 }

  // 放不下：前面的 maxLines-1 行尽量放满；最后一行末尾为 +N 预留槽位
  // （moreWidth+gap），避免 +N 被裁切或换到下一行。+N 恒放最后一个可见行。
  let idx = 0
  for (let line = 0; line < maxLines - 1 && idx < total; line += 1) {
    idx += fitCount(idx, containerWidth)
  }
  if (maxLines > 0) {
    const lastCap = Math.max(0, containerWidth - (moreWidth + gap))
    idx += fitCount(idx, lastCap)
  }
  const shown = idx
  return { shown, hiddenCount: Math.max(0, total - shown) }
}

/** 单行省略确实被截断才需要完整描述 Tooltip（CCFG-UI-005/008）。 */
export function descNeedsTip(clientWidth: number, scrollWidth: number): boolean {
  return Number.isFinite(clientWidth) && Number.isFinite(scrollWidth) && scrollWidth > clientWidth + 1
}

export interface ChipStyleOptions {
  fontSize?: string
  lineHeight?: string
  paddingX?: number
  borderWidth?: number
  maxEm?: number
}

/**
 * 以与列表标签一致的盒模型离屏测量一段文本的视觉宽度（px）。
 * 无法布局（jsdom 等返回 0）时返回 0，调用方按“全部直接展示”兜底。
 */
export function measureChipWidth(text: string, opts: ChipStyleOptions = {}): number {
  if (typeof document === 'undefined') return 0
  const fontSize = opts.fontSize ?? '12px'
  const lineHeight = opts.lineHeight ?? '20px'
  const paddingX = opts.paddingX ?? 8
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
