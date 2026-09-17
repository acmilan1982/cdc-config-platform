import type { Ref } from 'vue'

/** 查询列表页公共组件契约类型（SHARED_COMPONENT_DESIGN §7.4 / §7.6）。 */

/** 锚点矩形（视口坐标系）。 */
export interface QueryListTooltipAnchor {
  top: number
  left: number
  width: number
  height: number
  bottom: number
  right: number
}

/** 当前 Tooltip 目标。同一时刻至多一个。 */
export interface QueryListTooltipTarget {
  /** 稳定触发键：内容/锚点变化但 key 不变时不重复弹出。 */
  key: string
  /** 展示文案。空字符串语义为“无内容”→ 关闭。 */
  content: string
  /** 锚点矩形。 */
  anchor: QueryListTooltipAnchor
  /**
   * **已校验后**的调用方内容上限（px）；省略表示只使用视口安全上限。
   * 由控制器在 `show()` 时校验后写入，Host **只**从这里读取。
   */
  maxWidthPx?: number
}

export interface QueryListTooltipShowOptions {
  key: string
  content: string
  /** 锚点来源：元素（取 getBoundingClientRect）或显式矩形。二者取其一。 */
  el?: HTMLElement
  anchor?: QueryListTooltipAnchor
  /**
   * 调用方内容上限（px）。必须是有限正数；非法值忽略并退回视口安全上限。
   */
  maxWidthPx?: number
  /**
   * 调用方显示延迟（ms）。唯一语义：
   * - 省略 → 公共默认 {@link QUERY_LIST_TOOLTIP_DELAY_MS}（320ms）；
   * - `0` → 立即成为当前目标，不创建等待定时器；
   * - 有限正数 → 使用该毫秒数；
   * - 其它（负数、`NaN`、`Infinity`、非 number）→ 不报错，统一退回公共默认 320ms。
   *
   * 只控制显示时机：内容、锚点、最大宽度、ARIA 与单实例语义均不受影响。
   */
  delayMs?: number
}

/** 自动刷新倒计时投影。`null` 表示该页面不使用自动刷新。 */
export interface QueryListCountdown {
  /** 剩余秒数（60→0）；null 表示当前无已安排周期（显示占位 --）。 */
  seconds: number | null
  /** 剩余比例（1→0）；null 表示无已安排周期（环为空）。 */
  progress: number | null
}

export interface BindGlobalCloseOptions {
  /**
   * 是否启用控制器提供的 `Escape` 关闭。默认 `false`（不启用）：
   * 参考页面阶段一不得静默新增该交互行为（见 SHARED_COMPONENT_DESIGN §7.6.6）。
   */
  escape?: boolean
}

export interface UseQueryListTooltipReturn {
  /** 控制器创建时生成；页面实例内唯一且整个生命周期稳定，同时用作 Host 根节点 `id`。 */
  hostId: string
  /** 当前目标（响应式）。 */
  current: Ref<QueryListTooltipTarget | null>
  /** 请求显示；内容为空即关闭；新 key 先即时关闭旧项再走该次调用指定的延迟。 */
  show: (opts: QueryListTooltipShowOptions) => void
  /**
   * 关闭接口：
   * - `hide()`：无条件取消当前等待并关闭当前 Tooltip（滚动、resize、页面隐藏、记录整体替换、路由卸载等全局关闭）；
   * - `hide(key)`：仅当 `key` 等于当前等待目标或当前显示目标时才取消/关闭；key 已过期时 no-op，
   *   旧目标的延迟 `mouseleave` 不会取消新目标刚建立的等待或显示。
   */
  hide: (key?: string) => void
  /** 绑定页面级关闭事件（页面/表格滚动、窗口缩放、页面隐藏）。返回解绑函数。 */
  bindGlobalClose: (options?: BindGlobalCloseOptions) => () => void
  /** 组件卸载：清定时器并置空，防止卸载后写入。 */
  destroy: () => void
}
