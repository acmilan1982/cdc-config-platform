import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import CursorPagination from './CursorPagination.vue'

async function mountPager(extra: { loading?: boolean; hasPrev?: boolean; hasNext?: boolean } = {}) {
  const wrapper = mount(CursorPagination, {
    props: { loading: false, hasPrev: false, hasNext: false, ...extra },
    global: { plugins: [ElementPlus] },
  })
  await flushPromises()
  return wrapper
}

describe('CursorPagination 游标分页条（LQ-AC-059 / 060 / 119）', () => {
  it('仅渲染上一页/下一页两个按钮，无页码、无总数、无跳页输入（LQ-AC-059/060）', async () => {
    const wrapper = await mountPager({ hasPrev: true, hasNext: true })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toContain('上一页')
    expect(buttons[1].text()).toContain('下一页')

    expect(wrapper.text()).not.toContain('第')
    expect(wrapper.text()).not.toContain('共')
    expect(wrapper.text()).not.toContain('条')
    expect(wrapper.find('.el-pagination').exists()).toBe(false)
    expect(wrapper.find('.el-pagination__jump').exists()).toBe(false)
    expect(wrapper.find('input[type="number"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('hasPrev/hasNext 控制上一页/下一页可用性', async () => {
    const w1 = await mountPager({ hasPrev: false, hasNext: true })
    const b1 = w1.findAll('button')
    expect(b1[0].classes()).toContain('is-disabled')
    expect(b1[1].classes()).not.toContain('is-disabled')
    w1.unmount()

    const w2 = await mountPager({ hasPrev: true, hasNext: false })
    const b2 = w2.findAll('button')
    expect(b2[0].classes()).not.toContain('is-disabled')
    expect(b2[1].classes()).toContain('is-disabled')
    w2.unmount()
  })

  it('loading=true 时上一页/下一页同时禁用（LQ-AC-119）', async () => {
    const wrapper = await mountPager({ loading: true, hasPrev: true, hasNext: true })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].classes()).toContain('is-disabled')
    expect(buttons[1].classes()).toContain('is-disabled')
    wrapper.unmount()
  })

  it('点击上一页/下一页分别触发 prev/next 事件', async () => {
    const wrapper = await mountPager({ hasPrev: true, hasNext: true })
    await wrapper.findAll('button')[0].trigger('click')
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('prev')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
    wrapper.unmount()
  })
})
