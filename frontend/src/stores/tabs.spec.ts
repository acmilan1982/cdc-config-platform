import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTabsStore } from './tabs'

describe('页面标签状态（CDC-APP-SHELL-DARK-SIDEBAR-AND-PAGE-TABS-001）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('首次访问打开标签，同一路径再次访问只激活、不重复', () => {
    const tabs = useTabsStore()
    tabs.open('/config/data-source', '数据源管理')
    tabs.open('/config/client', '探针端管理')
    tabs.open('/config/data-source', '数据源管理')
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/config/data-source', '/config/client'])
    expect(tabs.activePath).toBe('/config/data-source')
  })

  it('关闭非当前标签保持当前页', () => {
    const tabs = useTabsStore()
    tabs.open('/config/data-source', '数据源管理')
    tabs.open('/config/client', '探针端管理')
    expect(tabs.close('/config/data-source')).toBe('/config/client')
    expect(tabs.activePath).toBe('/config/client')
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/config/client'])
  })

  it('关闭当前标签优先切到右邻，否则左邻，最后一个返回 null', () => {
    const tabs = useTabsStore()
    tabs.open('/a', 'A')
    tabs.open('/b', 'B')
    tabs.open('/c', 'C')
    tabs.activePath = '/b'
    expect(tabs.close('/b')).toBe('/c')
    expect(tabs.activePath).toBe('/c')

    tabs.activePath = '/c'
    expect(tabs.close('/c')).toBe('/a')
    expect(tabs.activePath).toBe('/a')

    expect(tabs.close('/a')).toBeNull()
    expect(tabs.activePath).toBeNull()
    expect(tabs.tabs).toHaveLength(0)
  })

  it('仅数据源管理与探针端管理进入 keep-alive 缓存', () => {
    const tabs = useTabsStore()
    tabs.open('/config/data-source', '数据源管理')
    tabs.open('/config/client', '探针端管理')
    tabs.open('/monitor/cdc-node', 'CDC 节点状态')
    expect(tabs.cachedViews).toEqual(['DataSourcePage', 'ClientConfigPage'])
  })

  it('关闭标签清除其滚动记录，重新打开从顶部开始', () => {
    const tabs = useTabsStore()
    tabs.open('/config/data-source', '数据源管理')
    tabs.saveScroll('/config/data-source', 320)
    expect(tabs.getScroll('/config/data-source')).toBe(320)
    tabs.close('/config/data-source')
    expect(tabs.getScroll('/config/data-source')).toBe(0)
  })

  it('独立空工作区可清空当前激活标签', () => {
    const tabs = useTabsStore()
    tabs.open('/config/data-source', '数据源管理')
    tabs.clearActive()
    expect(tabs.activePath).toBeNull()
  })
})
