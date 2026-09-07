import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DataSourceSnapshotStatusTag from './DataSourceSnapshotStatusTag.vue'
import type { StatusToken } from '@/types/dataSourceSnapshot'

/**
 * 状态标签（DSS-REQ-070③，AC-076）：本组件是纯展示 <el-tag>，不创建任何独立 Tooltip；
 * 数据库原始状态值经页面级单实例 Tooltip Host 由表格单元格层触发。jsdom 无 css，仅结构断言。
 */

function mountTag(category: StatusToken) {
  return mount(DataSourceSnapshotStatusTag, {
    props: { statusCategory: category },
    global: { plugins: [ElementPlus] },
  })
}

describe('DataSourceSnapshotStatusTag 纯展示（DSS-REQ-035/036/038，AC-028）', () => {
  it.each([
    ['RUNNING', '快照进行中'],
    ['COMPLETED', '快照已完成'],
    ['UNKNOWN', '未知状态'],
  ] as [StatusToken, string][])('statusCategory=%s 渲染标签文本 %s', (category, label) => {
    const wrapper = mountTag(category)
    expect(wrapper.find('.el-tag').exists()).toBe(true)
    expect(wrapper.text()).toBe(label)
    wrapper.unmount()
  })

  it('未知类别宽容归类为“未知状态”（type=warning，不抛错）', () => {
    const wrapper = mount(DataSourceSnapshotStatusTag, {
      props: { statusCategory: 'SOMETHING_ELSE' as StatusToken },
      global: { plugins: [ElementPlus] },
    })
    expect(wrapper.text()).toBe('未知状态')
    expect(wrapper.find('.el-tag--warning').exists()).toBe(true)
    wrapper.unmount()
  })

  it('不创建任何独立 Tooltip/触发器/原生 title', () => {
    const wrapper = mountTag('RUNNING')
    // 组件根部无 tooltip 触发类、无原生 title
    expect(wrapper.find('.dss-tt').exists()).toBe(false)
    expect(wrapper.find('[data-tt-kind]').exists()).toBe(false)
    expect(wrapper.find('[title]').exists()).toBe(false)
    // 未向 body teleport 任何单实例 Host 内容
    expect(document.querySelector('.dss-single-tooltip[data-tt-host="1"]')).toBeNull()
    wrapper.unmount()
  })
})
