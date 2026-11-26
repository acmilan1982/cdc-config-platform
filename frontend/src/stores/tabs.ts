import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface PageTab {
  path: string
  title: string
}

/**
 * 需要保留页面实例的路由 → 组件名（与 SFC 文件名一致，供 keep-alive include 匹配）。
 * 仅数据源管理与探针端管理需要跨标签保留筛选、结果与滚动位置；
 * 其余页面切换时卸载重建，使监控页定时器自然停止，返回时按现有节奏重新启动。
 */
const CACHEABLE_VIEWS: Record<string, string> = {
  '/config/data-source': 'DataSourcePage',
  '/config/client': 'ClientConfigPage'
}

export const useTabsStore = defineStore('tabs', () => {
  /** 页面标签仅保存在本次页面会话内：刷新浏览器后从当前 URL 重新建立。 */
  const tabs = ref<PageTab[]>([])
  const activePath = ref<string | null>(null)

  // 滚动位置不参与响应式渲染，按路由路径记录，切回时还原实际滚动容器位置。
  const scrollPositions = new Map<string, number>()

  const cachedViews = computed(() =>
    tabs.value
      .map((tab) => CACHEABLE_VIEWS[tab.path])
      .filter((name): name is string => Boolean(name))
  )

  function has(path: string): boolean {
    return tabs.value.some((tab) => tab.path === path)
  }

  function open(path: string, title: string): void {
    if (!has(path)) {
      tabs.value.push({ path, title })
    }
    activePath.value = path
  }

  /**
   * 关闭标签。返回关闭当前标签后应激活的相邻标签路径（右邻优先，其次左邻）；
   * 关闭非当前标签返回当前激活路径；关闭最后一个标签返回 null。
   */
  function close(path: string): string | null {
    const index = tabs.value.findIndex((tab) => tab.path === path)
    if (index === -1) {
      return activePath.value
    }
    const wasActive = activePath.value === path
    tabs.value.splice(index, 1)
    scrollPositions.delete(path)
    if (!wasActive) {
      return activePath.value
    }
    const neighbor = tabs.value[index] ?? tabs.value[index - 1] ?? null
    activePath.value = neighbor ? neighbor.path : null
    return neighbor ? neighbor.path : null
  }

  function clearActive(): void {
    activePath.value = null
  }

  function saveScroll(path: string, top: number): void {
    scrollPositions.set(path, top)
  }

  function getScroll(path: string): number {
    return scrollPositions.get(path) ?? 0
  }

  return {
    tabs,
    activePath,
    cachedViews,
    has,
    open,
    close,
    clearActive,
    saveScroll,
    getScroll
  }
})
