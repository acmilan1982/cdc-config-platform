import { ref } from 'vue'
import type { TooltipAnchor } from './tooltipPosition'

/** 页面级单实例 Tooltip 状态（DSS-REQ-070 / DESIGN §19.5 / UI §13.5）。 */
export interface SnapshotTooltipState {
  /** 稳定触发键：cell/图标定位，key 未变不重复弹出。 */
  key: string
  content: string
  /** 触发元素的视口矩形，供 Host 定位。 */
  anchor: TooltipAnchor
}

/** 统一短暂显示延迟约 300~350ms（DSS-REQ-070④，AC-077）。 */
export const SNAPSHOT_TOOLTIP_DELAY_MS = 320

function toAnchor(el: HTMLElement): TooltipAnchor {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }
}

export interface ShowTooltipOptions {
  key: string
  content: string
  el: HTMLElement
}

/**
 * 单一受控 Tooltip Host 的控制器：任意时刻最多 1 个。
 * show：内容为空即关闭；触发新 key 前先即时关闭旧项再走统一延迟，延迟窗内离开取消；
 * 锚点几何在 show（鼠标进入提交）时刻取样——滚动/resize/records 替换等位置失效事件
 * 已由全局关闭覆盖（见 bindGlobalClose 与表格 records watch），故延迟窗内无需依赖触发元素存活，
 * 也规避宿主表格在 jsdom 中于 hover 重建单元格导致旧节点失连的问题；
 * hide：取消延迟并即时关闭；全局关闭事件（页面/表格滚动、窗口缩放、页面隐藏）由 bindGlobalClose 绑定。
 * 该控制器由表格实例持有（页面唯一表格 → 页面任意时刻最多 1 个 Tooltip）。
 */
export function useSnapshotTooltip() {
  const current = ref<SnapshotTooltipState | null>(null)

  let delayTimer: ReturnType<typeof setTimeout> | null = null
  let pendingKey: string | null = null
  let pendingAnchor: TooltipAnchor | null = null
  let disposed = false

  function clearDelay(): void {
    if (delayTimer !== null) {
      clearTimeout(delayTimer)
      delayTimer = null
    }
    pendingKey = null
    pendingAnchor = null
  }

  function hide(): void {
    clearDelay()
    if (current.value !== null) current.value = null
  }

  function show(opts: ShowTooltipOptions): void {
    if (disposed) return
    const text = opts.content == null ? '' : String(opts.content).trim()
    if (text.length === 0) {
      hide()
      return
    }
    // 新 key 先关旧项（即时），不允许旧项与新项同时残留。
    hide()
    pendingKey = opts.key
    pendingAnchor = toAnchor(opts.el)
    delayTimer = setTimeout(() => {
      delayTimer = null
      if (disposed) return
      // 仅当仍是最新一次 show 且其锚点已取样才 reveal；旧 show 的定时器在此作废。
      const anchor = pendingAnchor
      if (pendingKey !== opts.key || anchor === null) {
        pendingKey = null
        pendingAnchor = null
        return
      }
      current.value = { key: opts.key, content: opts.content, anchor }
      pendingKey = null
      pendingAnchor = null
    }, SNAPSHOT_TOOLTIP_DELAY_MS)
  }

  /** 绑定页面级关闭事件（scroll 捕获覆盖表格容器滚动）。返回解绑函数。 */
  function bindGlobalClose(): () => void {
    const onScroll = (): void => hide()
    const onResize = (): void => hide()
    const onVisibility = (): void => hide()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }

  /** 组件卸载：清除定时器并置空，防止卸载后 setState。 */
  function destroy(): void {
    disposed = true
    clearDelay()
    current.value = null
  }

  return { current, show, hide, bindGlobalClose, destroy }
}
