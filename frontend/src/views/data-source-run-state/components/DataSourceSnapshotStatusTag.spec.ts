import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DataSourceSnapshotStatusTag from './DataSourceSnapshotStatusTag.vue'
import type { StatusToken } from '@/types/dataSourceSnapshot'

/**
 * 状态标签（DSS-REQ-070③，AC-076）：本组件是纯展示 <el-tag>，不创建任何独立 Tooltip；
 * 数据库原始状态值经页面级单实例 Tooltip Host 由表格单元格层触发。jsdom 无 css，仅结构断言。
 *
 * R3 调整三（§8）：前导符号改为显式局部元素（aria-hidden），RUNNING=●/COMPLETED=✓/UNKNOWN=?，
 * 放固定宽度槽；状态文字统一 600。符号不引入图标库；中文文字仍是主要语义。
 */

const SOURCE = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotStatusTag.vue'), 'utf-8')

function mountTag(category: StatusToken) {
  return mount(DataSourceSnapshotStatusTag, {
    props: { statusCategory: category },
    global: { plugins: [ElementPlus] },
  })
}

describe('DataSourceSnapshotStatusTag 纯展示（DSS-REQ-035/036/038，AC-028）', () => {
  it.each([
    ['RUNNING', '●', '快照进行中'],
    ['COMPLETED', '✓', '快照已完成'],
    ['UNKNOWN', '?', '未知状态'],
  ] as [StatusToken, string, string][])(
    'statusCategory=%s 渲染 符号(%s)＋标签文本(%s)（R3 §8/§12.2）',
    (category, symbol, label) => {
      const wrapper = mountTag(category)
      expect(wrapper.find('.el-tag').exists()).toBe(true)
      // 符号为显式局部元素 + aria-hidden，中文文字仍存在且是主语义
      const sym = wrapper.find('.dss-status-symbol')
      expect(sym.exists()).toBe(true)
      expect(sym.attributes('aria-hidden')).toBe('true')
      expect(sym.text()).toBe(symbol)
      expect(wrapper.text()).toBe(symbol + label)
      wrapper.unmount()
    },
  )

  it('三种状态使用同一固定符号槽（相同类名结构，槽宽契约 14px 来自源码），保证文字起点对齐', () => {
    for (const category of ['RUNNING', 'COMPLETED', 'UNKNOWN'] as StatusToken[]) {
      const wrapper = mountTag(category)
      expect(wrapper.find('.dss-status-symbol').exists()).toBe(true)
      wrapper.unmount()
    }
    // jsdom 无法计算 CSS：以源码字形约束断言固定槽宽与槽内居中
    expect(SOURCE).toMatch(/\.dss-status-symbol\s*\{[^}]*width:\s*14px/m)
    expect(SOURCE).toMatch(/\.dss-status-symbol\s*\{[^}]*text-align:\s*center/m)
  })

  it('RUNNING 符号槽使用更小字号（保留原实心圆点紧凑视觉尺寸，R3 §8）', () => {
    const wrapper = mountTag('RUNNING')
    expect(wrapper.find('.dss-status-symbol--dot').exists()).toBe(true)
    wrapper.unmount()
    const completed = mountTag('COMPLETED')
    expect(completed.find('.dss-status-symbol--dot').exists()).toBe(false)
    completed.unmount()
  })

  it('状态文字统一 600 字重且符号随文字同色（源码契约，jsdom 不计算样式）', () => {
    // .el-tag 分型文字色已存在（primary/success/warning 背景色）；R3 只把字号/字重与符号规则加入
    expect(SOURCE).toMatch(/font-weight:\s*600/)
    expect(SOURCE).toMatch(/color:\s*inherit/)
  })

  it('未知类别宽容归类为“未知状态”（type=warning，不抛错；符号兜底 ?，R3 §8/§12.2）', () => {
    const wrapper = mount(DataSourceSnapshotStatusTag, {
      props: { statusCategory: 'SOMETHING_ELSE' as StatusToken },
      global: { plugins: [ElementPlus] },
    })
    expect(wrapper.find('.dss-status-symbol').text()).toBe('?')
    expect(wrapper.text()).toBe('?未知状态')
    expect(wrapper.find('.el-tag--warning').exists()).toBe(true)
    wrapper.unmount()
  })

  it('不创建任何独立 Tooltip/触发器/原生 title；不引入图标依赖', () => {
    const wrapper = mountTag('RUNNING')
    // 组件根部无 tooltip 触发类、无原生 title、无问号图标触发器
    expect(wrapper.find('.dss-tt').exists()).toBe(false)
    expect(wrapper.find('[data-tt-kind]').exists()).toBe(false)
    expect(wrapper.find('[title]').exists()).toBe(false)
    // 未向 body teleport 任何单实例 Host 内容
    expect(document.querySelector('.dss-single-tooltip[data-tt-host="1"]')).toBeNull()
    // R3：符号为普通文本/字符槽，不是图标组件（无 ElIcon / svg / 图标库引用）
    expect(wrapper.find('.el-icon').exists()).toBe(false)
    wrapper.unmount()
  })
})
