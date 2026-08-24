import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'

vi.mock('@/views/log-query/reinitBus', () => ({
  triggerLogQueryReinit: vi.fn(),
  onLogQueryReinit: vi.fn(() => () => {}),
}))

import Sidebar from '@/layouts/Sidebar.vue'
import { triggerLogQueryReinit } from '@/views/log-query/reinitBus'

const mockedTrigger = vi.mocked(triggerLogQueryReinit)

const View = { template: '<div />' }

async function mountSidebar(initialPath: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: View },
      { path: '/monitor/log-query', component: View },
      { path: '/monitor/cdc-node', component: View },
    ],
  })
  router.push(initialPath)
  await router.isReady()
  const wrapper = mount(Sidebar, {
    global: { plugins: [router, ElementPlus] },
  })
  await flushPromises()
  return { wrapper, router }
}

async function clickMenuItem(wrapper: VueWrapper, title: string) {
  const items = wrapper.findAll('.el-menu-item')
  const target = items.find((it) => it.text().includes(title))
  expect(target, `未找到菜单 "${title}"`).toBeTruthy()
  await target!.trigger('click')
  await flushPromises()
}

beforeEach(() => {
  mockedTrigger.mockClear()
})

describe('Sidebar 日志查询菜单真实入口（R1-04 / LQ-UI-142~146 / LQ-AC-181）', () => {
  it('当前路由为 /monitor/log-query 时再次点击"日志查询"触发重新初始化事件', async () => {
    const { wrapper } = await mountSidebar('/monitor/log-query')
    await clickMenuItem(wrapper, '日志查询')
    expect(mockedTrigger).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('当前路由为 /monitor/log-query 时点击其他菜单不触发重新初始化', async () => {
    const { wrapper } = await mountSidebar('/monitor/log-query')
    await clickMenuItem(wrapper, 'CDC 节点状态')
    expect(mockedTrigger).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('当前路由不是日志查询时第一次进入不被误判为再次点击', async () => {
    const { wrapper } = await mountSidebar('/monitor/cdc-node')
    await clickMenuItem(wrapper, '日志查询')
    expect(mockedTrigger).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('当前路由不是日志查询时点击其他菜单也不触发', async () => {
    const { wrapper } = await mountSidebar('/monitor/cdc-node')
    await clickMenuItem(wrapper, 'CDC 节点状态')
    expect(mockedTrigger).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
