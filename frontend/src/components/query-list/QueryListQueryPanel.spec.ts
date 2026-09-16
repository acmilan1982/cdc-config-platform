import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, type VNode } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import QueryListQueryPanel from './QueryListQueryPanel.vue'

/**
 * 查询条件区容器（SHARED_COMPONENT_DESIGN §7.4.2）：只提供字段组流式换行区与操作区位置，
 * 以及可选嵌入式卡片视觉；不生成标签、不设控件宽度、不持有请求。
 * 关键几何契约：字段组与操作组同处一个换行 flex 流；操作组作为**整体** flex item 不可拆散。
 */

const FIELD_GROUP = 'dss-q-group'

function group(index: number): VNode {
  return h('div', { class: FIELD_GROUP, 'data-group': index })
}

function panelSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/components/query-list/QueryListQueryPanel.vue'), 'utf8')
}

function scopedStyle(): string {
  const block = panelSource().match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
  return block.replace(/\/\*[\s\S]*?\*\//g, '')
}

function ruleOf(selector: string): string {
  return scopedStyle().match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

describe('QueryListQueryPanel 变体与结构（§7.4.2）', () => {
  it('默认 variant=card：根为 .ql-q-panel（无 --plain），字段组成为换行流的直接子项', () => {
    const wrapper = mount(QueryListQueryPanel, { slots: { default: () => [group(0), group(1), group(2)] } })
    const panel = wrapper.find('.ql-q-panel')
    expect(panel.exists()).toBe(true)
    expect(panel.classes()).not.toContain('ql-q-panel--plain')
    const flow = panel.find('.ql-q-panel__flow')
    expect(flow.exists()).toBe(true)
    // 字段组不经过任何额外包装层：直接挂在换行流下
    expect([...flow.element.children].map((el) => el.className)).toEqual([
      FIELD_GROUP,
      FIELD_GROUP,
      FIELD_GROUP,
    ])
    wrapper.unmount()
  })

  it('variant=plain：加 --plain 修饰类，透明无内边距；结构不变', () => {
    const wrapper = mount(QueryListQueryPanel, {
      props: { variant: 'plain' },
      slots: { default: () => group(0), actions: () => h('div', { class: 'ql-actions' }) },
    })
    const panel = wrapper.find('.ql-q-panel')
    expect(panel.classes()).toContain('ql-q-panel--plain')
    expect(panel.find('.ql-q-panel__flow').exists()).toBe(true)
    wrapper.unmount()
  })

  it('无 #actions 槽时不渲染操作区容器（不产生空占位）', () => {
    const wrapper = mount(QueryListQueryPanel, { slots: { default: () => group(0) } })
    expect(wrapper.find('.ql-q-panel__actions').exists()).toBe(false)
    expect(wrapper.find('.ql-q-panel__flow').element.children).toHaveLength(1)
    wrapper.unmount()
  })

  it('#actions 槽作为整体渲染在字段组之后，顺序固定（字段组 → 操作组）', () => {
    const wrapper = mount(QueryListQueryPanel, {
      slots: {
        default: () => [group(0), group(1)],
        actions: () => h('div', { class: 'ql-actions' }, 'BUTTONS'),
      },
    })
    const flow = wrapper.find('.ql-q-panel__flow')
    const children = [...flow.element.children]
    expect(children).toHaveLength(3)
    expect(children[0]!.classList.contains(FIELD_GROUP)).toBe(true)
    expect(children[1]!.classList.contains(FIELD_GROUP)).toBe(true)
    expect(children[2]!.classList.contains('ql-q-panel__actions')).toBe(true)
    expect(children[2]!.querySelector('.ql-actions')!.textContent).toBe('BUTTONS')
    wrapper.unmount()
  })

  it('容器不生成标签、不设控件宽度、模板内不出现任何业务命名空间', () => {
    const wrapper = mount(QueryListQueryPanel, { slots: { default: () => group(0) } })
    expect(wrapper.html()).not.toMatch(/<label/)
    // 字段组类名由调用方提供：容器自身模板不得内建任何业务 class
    expect(panelSource().match(/<template>[\s\S]*?<\/template>/)?.[0] ?? '').not.toMatch(/dss-/)
    expect(scopedStyle()).not.toMatch(/width\s*:\s*\d+px/)
    wrapper.unmount()
  })
})

describe('QueryListQueryPanel 布局与视觉契约（§7.4.2 / §10）', () => {
  it('.ql-q-panel 为嵌入式卡片：圆角 8px / 底色 #f4f4f5 / 无阴影 / 内边距 10px 16px', () => {
    const body = ruleOf('.ql-q-panel')
    expect(body).toMatch(/border-radius:\s*var\(--ql-q-panel-radius,\s*8px\)/)
    expect(body).toMatch(/background:\s*var\(--ql-q-panel-bg,\s*#f4f4f5\)/)
    expect(body).toMatch(/padding:\s*var\(--ql-q-panel-padding,\s*10px 16px\)/)
    expect(body).not.toMatch(/box-shadow/)
    expect(body).not.toMatch(/width|height/)
  })

  it('.ql-q-panel--plain 透明无内边距', () => {
    const body = ruleOf('.ql-q-panel--plain')
    expect(body).toMatch(/background:\s*transparent/)
    expect(body).toMatch(/padding:\s*0/)
  })

  it('字段组整体换行：换行流为 flex + wrap + 居中 + 8px 14px 间距，且子项 shrink 由字段组自身控制', () => {
    const body = ruleOf('.ql-q-panel__flow')
    expect(body).toMatch(/(^|;)\s*display:\s*flex\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*flex-wrap:\s*wrap\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*align-items:\s*center\s*(;|$)/)
    expect(body).toMatch(/gap:\s*var\(--ql-q-panel-gap,\s*8px 14px\)/)
    expect(body).not.toMatch(/flex:\s*1/)
  })

  it('操作组不可拆散：整体 flex item（inline-flex + flex:0 0 auto），不参与拉伸/压缩', () => {
    const body = ruleOf('.ql-q-panel__actions')
    expect(body).toMatch(/(^|;)\s*display:\s*inline-flex\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*align-items:\s*center\s*(;|$)/)
    expect(body).toMatch(/flex:\s*0 0 auto/)
    expect(body).not.toMatch(/flex-wrap/)
  })

  it('样式 scoped、ql- 命名空间、无全局泄漏与 !important', () => {
    const src = panelSource()
    expect(src.match(/<style scoped>/g) ?? []).toHaveLength(1)
    expect(src.match(/<style(?![^>]*\bscoped\b)[^>]*>/g) ?? []).toHaveLength(0)
    expect(scopedStyle()).not.toMatch(/\.dss-|--el-|:root|!important|::v-deep|:deep\(/)
  })
})
