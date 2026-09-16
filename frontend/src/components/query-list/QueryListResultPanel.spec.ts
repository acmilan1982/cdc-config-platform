import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import QueryListResultPanel from './QueryListResultPanel.vue'

/**
 * 结果区卡片容器（SHARED_COMPONENT_DESIGN §7.4.4 / §7.5.5）：
 * 四段 DOM 顺序固定 header → error-slot → divider → body，只有 4 个具名槽；
 * 提示槽**始终渲染**并保留 min-height（出现/消失不推动后续内容）；
 * 横向溢出职责并入正文区（原「稳定表格容器」候选项已合并，不另建薄包装组件）。
 */

function panelSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/components/query-list/QueryListResultPanel.vue'), 'utf8')
}

function scopedStyle(): string {
  const block = panelSource().match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
  return block.replace(/\/\*[\s\S]*?\*\//g, '')
}

function ruleOf(selector: string): string {
  return scopedStyle().match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

describe('QueryListResultPanel 四段结构与槽位（§7.4.4）', () => {
  it('无任何槽与文本时仍渲染四段，DOM 顺序固定为 header → error-slot → divider → body', () => {
    const wrapper = mount(QueryListResultPanel)
    const root = wrapper.find('.ql-result-panel')
    expect(root.exists()).toBe(true)
    expect([...root.element.children].map((el) => el.className)).toEqual([
      'ql-result-panel__header',
      'ql-result-panel__error-slot',
      'ql-result-panel__divider',
      'ql-result-panel__body',
    ])
    wrapper.unmount()
  })

  it('只认 4 个具名槽：summary / toolbar / error / body 均落入各自区段', () => {
    const wrapper = mount(QueryListResultPanel, {
      slots: {
        summary: () => h('span', { class: 's' }, 'S'),
        toolbar: () => h('span', { class: 't' }, 'T'),
        error: () => h('span', { class: 'e' }, 'E'),
        body: () => h('span', { class: 'b' }, 'B'),
      },
    })
    expect(wrapper.find('.ql-result-panel__summary .s').text()).toBe('S')
    expect(wrapper.find('.ql-result-panel__toolbar .t').text()).toBe('T')
    expect(wrapper.find('.ql-result-panel__error-slot .e').text()).toBe('E')
    expect(wrapper.find('.ql-result-panel__body .b').text()).toBe('B')
    wrapper.unmount()
  })

  it('summaryText 为空且无 #summary 槽时不渲染左摘要；有文本时渲染在头部左区', () => {
    const empty = mount(QueryListResultPanel)
    expect(empty.find('.ql-result-panel__summary').exists()).toBe(false)
    empty.unmount()

    const withText = mount(QueryListResultPanel, { props: { summaryText: '共 3 条' } })
    expect(withText.find('.ql-result-panel__summary').text()).toBe('共 3 条')
    withText.unmount()
  })

  it('工具栏区恒存在（即使未传 #toolbar）；摘要区与工具栏区同处一个 header', () => {
    const wrapper = mount(QueryListResultPanel, { props: { summaryText: '共 1 条' } })
    const header = wrapper.find('.ql-result-panel__header')
    expect(header.exists()).toBe(true)
    const summary = header.find('.ql-result-panel__summary')
    const toolbar = header.find('.ql-result-panel__toolbar')
    expect(summary.exists()).toBe(true)
    expect(toolbar.exists()).toBe(true)
    expect(summary.element.parentElement).toBe(header.element)
    expect(toolbar.element.parentElement).toBe(header.element)
    wrapper.unmount()
  })

  it('errorText 为空且无 #error 槽：槽容器保留，但不渲染任何内容节点；errorText 非空时渲染默认文本', () => {
    const empty = mount(QueryListResultPanel)
    const slot = empty.find('.ql-result-panel__error-slot')
    expect(slot.exists()).toBe(true)
    expect(slot.element.children).toHaveLength(0)
    empty.unmount()

    const withText = mount(QueryListResultPanel, { props: { errorText: '刷新失败' } })
    expect(withText.find('.ql-result-panel__error-slot span').text()).toBe('刷新失败')
    withText.unmount()
  })

  it('variant=plain 加 --plain 修饰类；四段结构不变', () => {
    const wrapper = mount(QueryListResultPanel, { props: { variant: 'plain' } })
    const root = wrapper.find('.ql-result-panel')
    expect(root.classes()).toContain('ql-result-panel--plain')
    expect(root.element.children).toHaveLength(4)
    wrapper.unmount()
  })

  it('无默认槽：不具名内容不会落入任何区段（body 只接受 #body）', () => {
    expect(panelSource()).toMatch(/<div class="ql-result-panel__body">\s*<slot name="body" \/>/)
    expect(panelSource()).not.toMatch(/<slot\s*\/>/)
  })
})

describe('QueryListResultPanel 布局与视觉契约（§7.4.4 / §7.5.5 / §10）', () => {
  it('.ql-result-panel 为纵向 flex 卡片：白底 / 10px 圆角 / 极弱阴影', () => {
    const body = ruleOf('.ql-result-panel')
    expect(body).toMatch(/(^|;)\s*display:\s*flex\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*flex-direction:\s*column\s*(;|$)/)
    expect(body).toMatch(/background:\s*var\(--ql-result-panel-bg,\s*#ffffff\)/)
    expect(body).toMatch(/border-radius:\s*var\(--ql-result-panel-radius,\s*10px\)/)
    expect(body).toMatch(/box-shadow:\s*var\(--ql-result-panel-shadow,/)
  })

  it('--plain 透明无圆角无阴影', () => {
    const body = ruleOf('.ql-result-panel--plain')
    expect(body).toMatch(/background:\s*transparent/)
    expect(body).toMatch(/border-radius:\s*0/)
    expect(body).toMatch(/box-shadow:\s*none/)
  })

  it('头部为两端对齐可换行 flex：12px 16px 行间距 + 12px 16px 2px 内边距', () => {
    const body = ruleOf('.ql-result-panel__header')
    expect(body).toMatch(/(^|;)\s*display:\s*flex\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*align-items:\s*center\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*justify-content:\s*space-between\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*flex-wrap:\s*wrap\s*(;|$)/)
    expect(body).toMatch(/gap:\s*var\(--ql-result-panel-header-gap,\s*12px 16px\)/)
    expect(body).toMatch(/padding:\s*var\(--ql-result-panel-header-padding,\s*12px 16px 2px\)/)
  })

  it('左右两区为布局透明的 flex 容器（不降级调用方 inline-flex 内容）', () => {
    const summary = ruleOf('.ql-result-panel__summary')
    expect(summary).toMatch(/(^|;)\s*display:\s*flex\s*(;|$)/)
    expect(summary).toMatch(/(^|;)\s*align-items:\s*center\s*(;|$)/)
    expect(summary).toMatch(/flex:\s*0 1 auto/)
    expect(summary).toMatch(/(^|;)\s*min-width:\s*0\s*(;|$)/)

    const toolbar = ruleOf('.ql-result-panel__toolbar')
    expect(toolbar).toMatch(/(^|;)\s*display:\s*flex\s*(;|$)/)
    expect(toolbar).toMatch(/(^|;)\s*align-items:\s*center\s*(;|$)/)
    expect(toolbar).toMatch(/flex:\s*0 0 auto/)
  })

  it('提示槽保留 22px 最小高度与 0 16px 内边距（出现/消失不改变后续坐标）', () => {
    const body = ruleOf('.ql-result-panel__error-slot')
    expect(body).toMatch(/min-height:\s*var\(--ql-result-panel-error-min-height,\s*22px\)/)
    expect(body).toMatch(/padding:\s*var\(--ql-result-panel-error-padding,\s*0 16px\)/)
    expect(body).toMatch(/(^|;)\s*display:\s*flex\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*align-items:\s*center\s*(;|$)/)
  })

  it('分隔线为 1px / #f0f0f1 / 0 16px 外边距 / 不参与伸缩', () => {
    const body = ruleOf('.ql-result-panel__divider')
    expect(body).toMatch(/height:\s*var\(--ql-result-panel-divider-height,\s*1px\)/)
    expect(body).toMatch(/background:\s*var\(--ql-result-panel-divider-color,\s*#f0f0f1\)/)
    expect(body).toMatch(/margin:\s*var\(--ql-result-panel-divider-margin,\s*0 16px\)/)
    expect(body).toMatch(/flex:\s*0 0 auto/)
  })

  it('正文区承担横向溢出：width:100% + min-width:0 + border-box + 10px 16px 14px 内边距 + overflow-x:auto', () => {
    const body = ruleOf('.ql-result-panel__body')
    expect(body).toMatch(/(^|;)\s*width:\s*100%\s*(;|$)/)
    expect(body).toMatch(/min-width:\s*var\(--ql-result-panel-body-min-width,\s*0\)/)
    expect(body).toMatch(/(^|;)\s*box-sizing:\s*border-box\s*(;|$)/)
    expect(body).toMatch(/padding:\s*var\(--ql-result-panel-body-padding,\s*10px 16px 14px\)/)
    expect(body).toMatch(/overflow-x:\s*var\(--ql-result-body-overflow-x,\s*auto\)/)
  })

  it('不内建表格/业务命名空间：样例样式不含 dss-、不含固定像素宽', () => {
    const style = scopedStyle()
    expect(style).not.toMatch(/dss-/)
    expect(style).not.toMatch(/min-width:\s*\d+px/)
    expect(style).not.toMatch(/\.el-table/)
  })

  it('样式 scoped 单块、ql- 命名空间、无全局泄漏、无 !important 与子选择器穿透', () => {
    const src = panelSource()
    expect(src.match(/<style scoped>/g) ?? []).toHaveLength(1)
    expect(src.match(/<style(?![^>]*\bscoped\b)[^>]*>/g) ?? []).toHaveLength(0)
    const style = scopedStyle()
    expect(style).not.toMatch(/--el-|:root|!important|::v-deep|:deep\(/)
  })
})
