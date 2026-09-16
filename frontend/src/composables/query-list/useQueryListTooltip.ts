import { ref } from 'vue'
import type {
  BindGlobalCloseOptions,
  QueryListTooltipAnchor,
  QueryListTooltipShowOptions,
  QueryListTooltipTarget,
  UseQueryListTooltipReturn,
} from '@/components/query-list/types'

/** 统一短暂显示延迟（参考实现事实值，SHARED_COMPONENT_DESIGN §7.6.1）。 */
export const QUERY_LIST_TOOLTIP_DELAY_MS = 320

/** ASCII 空白拆分（`aria-describedby` token 规范化的唯一口径）。 */
const ASCII_WHITESPACE = /[\t\n\f\r ]+/

let hostSeq = 0

function toAnchor(el: HTMLElement): QueryListTooltipAnchor {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }
}

/** `maxWidthPx` 必须是有限正数；非法/缺失一律视为省略。 */
function normalizeMaxWidthPx(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function readTokens(el: HTMLElement): string[] {
  const attr = el.getAttribute('aria-describedby')
  if (attr === null) return []
  const seen = new Set<string>()
  for (const token of attr.split(ASCII_WHITESPACE)) {
    if (token !== '') seen.add(token)
  }
  return [...seen]
}

function writeTokens(el: HTMLElement, tokens: string[]): void {
  if (tokens.length === 0) el.removeAttribute('aria-describedby')
  else el.setAttribute('aria-describedby', tokens.join(' '))
}

/**
 * 页面级单实例 Tooltip 控制器（SHARED_COMPONENT_DESIGN §7.6.1）：任意时刻最多 1 个目标。
 * show：内容为空即关闭；触发新 key 前先即时关闭旧项再走统一延迟，延迟窗内离开取消；
 * 锚点几何在 show（鼠标进入提交）时刻取样——滚动/resize/记录替换等位置失效事件由全局关闭覆盖，
 * 故延迟窗内无需依赖触发元素存活；
 * 目标**真正成为当前 target 时**才把 `hostId` 作为 `aria-describedby` token 追加到触发元素；
 * hide / 延迟取消 / 列表整体更新 / 路由卸载 / destroy 时只移除自身 token，无剩余 token 时删除属性。
 */
export function useQueryListTooltip(): UseQueryListTooltipReturn {
  hostSeq += 1
  const hostId = `ql-tooltip-host-${hostSeq}`

  const current = ref<QueryListTooltipTarget | null>(null)

  let delayTimer: ReturnType<typeof setTimeout> | null = null
  let pendingKey: string | null = null
  let pendingAnchor: QueryListTooltipAnchor | null = null
  let pendingEl: HTMLElement | null = null
  let pendingMaxWidthPx: number | undefined
  /** 当前持有本控制器 hostId token 的元素；始终只承载自身 token 的增删。 */
  let describedEl: HTMLElement | null = null
  let disposed = false

  function clearDelay(): void {
    if (delayTimer !== null) {
      clearTimeout(delayTimer)
      delayTimer = null
    }
    pendingKey = null
    pendingAnchor = null
    pendingEl = null
    pendingMaxWidthPx = undefined
  }

  function clearDescribedBy(): void {
    if (describedEl === null) return
    const tokens = readTokens(describedEl).filter((token) => token !== hostId)
    writeTokens(describedEl, tokens)
    describedEl = null
  }

  function hide(): void {
    clearDelay()
    clearDescribedBy()
    if (current.value !== null) current.value = null
  }

  function show(opts: QueryListTooltipShowOptions): void {
    if (disposed) return
    const text = opts.content == null ? '' : String(opts.content).trim()
    if (text.length === 0) {
      hide()
      return
    }
    // 新 key 先关旧项（即时），不允许旧项与新项同时残留；同时清理旧目标的 ARIA token。
    hide()
    pendingKey = opts.key
    pendingEl = opts.el ?? null
    pendingAnchor = pendingEl !== null ? toAnchor(pendingEl) : (opts.anchor ?? null)
    pendingMaxWidthPx = normalizeMaxWidthPx(opts.maxWidthPx)
    delayTimer = setTimeout(() => {
      delayTimer = null
      if (disposed) return
      // 仅当仍是最新一次 show 且其锚点已取样才 reveal；旧 show 的定时器在此作废。
      const anchor = pendingAnchor
      if (pendingKey !== opts.key || anchor === null) {
        pendingKey = null
        pendingAnchor = null
        pendingEl = null
        pendingMaxWidthPx = undefined
        return
      }
      const el = pendingEl
      current.value = { key: opts.key, content: opts.content, anchor, maxWidthPx: pendingMaxWidthPx }
      pendingKey = null
      pendingAnchor = null
      pendingEl = null
      pendingMaxWidthPx = undefined
      // 目标真正成为当前 target 时建立读屏关联；无 el（仅显式 anchor）时不修改任何元素属性。
      if (el !== null) {
        describedEl = el
        const tokens = readTokens(el)
        if (!tokens.includes(hostId)) writeTokens(el, [...tokens, hostId])
      }
    }, QUERY_LIST_TOOLTIP_DELAY_MS)
  }

  /** 绑定页面级关闭事件（`scroll` 捕获覆盖表格容器滚动、`resize`、`visibilitychange`、可选 `Escape`）。 */
  function bindGlobalClose(options: BindGlobalCloseOptions = {}): () => void {
    const onScroll = (): void => hide()
    const onResize = (): void => hide()
    const onVisibility = (): void => hide()
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') hide()
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    if (options.escape === true) window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      if (options.escape === true) window.removeEventListener('keydown', onKeydown)
    }
  }

  /** 组件卸载：清除定时器、移除自身 ARIA token 并置空，防止卸载后写入。 */
  function destroy(): void {
    disposed = true
    clearDelay()
    clearDescribedBy()
    current.value = null
  }

  return { hostId, current, show, hide, bindGlobalClose, destroy }
}
