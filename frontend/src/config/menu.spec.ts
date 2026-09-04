import { describe, it, expect } from 'vitest'
import { menuGroups } from './menu'
import router from '@/router'

describe('数据同步进度页面命名（TOFF-REQ-001/003）', () => {
  it('菜单“运行监控”下 /monitor/topic-offset 标题统一为“数据同步进度”', () => {
    const monitor = menuGroups.find((g) => g.title === '运行监控')!
    const item = monitor.items.find((i) => i.path === '/monitor/topic-offset')
    expect(item?.title).toBe('数据同步进度')
  })

  it('路由 /monitor/topic-offset meta.title 统一为“数据同步进度”', () => {
    const route = router.getRoutes().find((r) => r.path === '/monitor/topic-offset')
    expect(route?.meta.title).toBe('数据同步进度')
  })
})

describe('探针端管理页面命名（CCFG-UI-001 / CCFG-REQ-001）', () => {
  it('菜单“配置管理”下 /config/client 标题统一为“探针端管理”，不再显示“客户端配置”', () => {
    const config = menuGroups.find((g) => g.title === '配置管理')!
    const item = config.items.find((i) => i.path === '/config/client')
    expect(item?.title).toBe('探针端管理')
    expect(menuGroups.some((g) => g.items.some((i) => i.title.includes('客户端配置')))).toBe(false)
  })

  it('路由 /config/client meta.title 统一为“探针端管理”且路径保持不变', () => {
    const route = router.getRoutes().find((r) => r.path === '/config/client')
    expect(route?.meta.title).toBe('探针端管理')
    expect(route?.path).toBe('/config/client')
  })
})
