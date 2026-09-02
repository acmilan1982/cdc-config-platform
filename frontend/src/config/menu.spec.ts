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
