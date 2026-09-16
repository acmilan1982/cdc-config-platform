import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, type VNode } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import QueryListPageShell from './QueryListPageShell.vue'

/**
 * 页面外壳（SHARED_COMPONENT_DESIGN §7.4.1）：只渲染页头与页面主体的纵向间距，业务零知识。
 * 关键契约：默认槽内容**逐一**成为 `.ql-page` 直接子节点（不生成 `.ql-page__body`），
 * 因此“正常 3 个直接元素子节点 / 首载失败 2 个”这类几何判定面由调用方决定。
 */

function stub(className: string): VNode {
  return h('section', { class: className })
}

function shellSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/components/query-list/QueryListPageShell.vue'), 'utf8')
}

function scopedStyle(): string {
  const block = shellSource().match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
  return block.replace(/\/\*[\s\S]*?\*\//g, '')
}

function ruleOf(selector: string): string {
  return scopedStyle().match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

describe('QueryListPageShell 默认值与页头渲染（§7.4.1）', () => {
  it('无 title / description 且无 #header 槽时不渲染页头，默认槽内容成为根的唯一直接子节点', () => {
    const wrapper = mount(QueryListPageShell, { slots: { default: () => stub('a') } })
    const page = wrapper.find('.ql-page')
    expect(page.exists()).toBe(true)
    expect(wrapper.find('.ql-page__header').exists()).toBe(false)
    expect(page.element.children).toHaveLength(1)
    expect(page.element.children[0]!.classList.contains('a')).toBe(true)
    wrapper.unmount()
  })

  it('title 非空时渲染 h2 标题；description 为空时不渲染描述行', () => {
    const wrapper = mount(QueryListPageShell, { props: { title: '页面标题' } })
    const h2 = wrapper.find('h2.ql-page__title')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toBe('页面标题')
    expect(wrapper.find('.ql-page__description').exists()).toBe(false)
    wrapper.unmount()
  })

  it('description 非空时渲染描述段落，文案为传入值', () => {
    const wrapper = mount(QueryListPageShell, { props: { title: 'T', description: '只读页面说明' } })
    const p = wrapper.find('p.ql-page__description')
    expect(p.exists()).toBe(true)
    expect(p.text()).toBe('只读页面说明')
    wrapper.unmount()
  })

  it('#header 槽整体替换默认标题/描述；#header-extra 仍渲染在页头内', () => {
    const wrapper = mount(QueryListPageShell, {
      props: { title: '被替换' },
      slots: {
        header: () => h('h1', { class: 'custom-title' }, '自定义'),
        'header-extra': () => h('span', { class: 'extra' }, '附加'),
      },
    })
    expect(wrapper.find('.custom-title').exists()).toBe(true)
    expect(wrapper.find('.ql-page__title').exists()).toBe(false)
    // 描述未提供且无 #description 槽 → 默认标题已被替换，故不再出现
    expect(wrapper.find('.ql-page__description').exists()).toBe(false)
    const header = wrapper.find('.ql-page__header')
    expect(header.find('.extra').exists()).toBe(true)
    expect(header.element.children).toHaveLength(2)
    wrapper.unmount()
  })

  it('#description 槽替换描述文本；仅提供槽（description 为空）也会渲染描述段落', () => {
    const wrapper = mount(QueryListPageShell, {
      props: { title: 'T' },
      slots: { description: () => h('em', { class: 'desc-slot' }, '来自槽') },
    })
    const p = wrapper.find('p.ql-page__description')
    expect(p.exists()).toBe(true)
    expect(p.find('.desc-slot').text()).toBe('来自槽')
    wrapper.unmount()
  })
})

describe('QueryListPageShell 无包装层（§7.4.1 关键几何契约）', () => {
  it('正常状态（页头 + 查询区 + 结果区）→ 根恰好 3 个直接元素子节点，且槽内容逐一直接挂在根下', () => {
    const wrapper = mount(QueryListPageShell, {
      props: { title: 'T' },
      slots: { default: () => [stub('query-panel'), stub('result-panel')] },
    })
    const page = wrapper.find('.ql-page')
    expect(page.element.children).toHaveLength(3)
    expect([...page.element.children].map((el) => el.className)).toEqual([
      'ql-page__header',
      'query-panel',
      'result-panel',
    ])
    // 默认槽内容均直接是 .ql-page 的 element 子节点：不存在任何中间包装层
    for (const child of [...page.element.children].slice(1)) {
      expect(child.parentElement).toBe(page.element)
    }
    expect(wrapper.find('.ql-page__body').exists()).toBe(false)
    wrapper.unmount()
  })

  it('首载失败状态（页头 + 错误卡片）→ 根恰好 2 个直接元素子节点，无额外占位', () => {
    const wrapper = mount(QueryListPageShell, {
      props: { title: 'T' },
      slots: { default: () => [stub('error-card')] },
    })
    const page = wrapper.find('.ql-page')
    expect(page.element.children).toHaveLength(2)
    expect(page.element.children[1]!.classList.contains('error-card')).toBe(true)
    expect(wrapper.find('.ql-page__body').exists()).toBe(false)
    wrapper.unmount()
  })

  it('默认槽项数与直接元素子节点数严格线性（1:1 透传，不合并也不拆分）', () => {
    for (const count of [0, 1, 3, 5]) {
      const children = Array.from({ length: count }, (_, i) => stub(`item-${i}`))
      const wrapper = mount(QueryListPageShell, {
        props: { title: 'T' },
        slots: { default: () => children },
      })
      const page = wrapper.find('.ql-page')
      expect(page.element.children, `槽 ${count} 项`).toHaveLength(count + 1)
      expect([...page.element.children].slice(1).map((el) => el.className)).toEqual(
        Array.from({ length: count }, (_, i) => `item-${i}`),
      )
      wrapper.unmount()
    }
  })

  it('源码不声明 body 包装层：模板与样式中都不存在 .ql-page__body（注释除外）', () => {
    // 注释中会解释“为何不生成 body 层”，因此先剥离 HTML/CSS 注释再判定真实声明。
    const stripped = shellSource()
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
    expect(stripped).not.toMatch(/ql-page__body/)
    expect(scopedStyle()).not.toMatch(/ql-page__body/)
  })
})

describe('QueryListPageShell 排版与画布样式契约（§7.4.1 / §10）', () => {
  it('.ql-page 为纵向 flex + 12px 间距 + 14px 16px 内边距 + 10px 圆角 + 透明底', () => {
    const body = ruleOf('.ql-page')
    expect(body).toMatch(/(^|;)\s*display:\s*flex\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*flex-direction:\s*column\s*(;|$)/)
    expect(body).toMatch(/gap:\s*var\(--ql-page-gap,\s*12px\)/)
    expect(body).toMatch(/padding:\s*var\(--ql-page-padding,\s*14px 16px\)/)
    expect(body).toMatch(/border-radius:\s*var\(--ql-page-radius,\s*10px\)/)
    expect(body).toMatch(/background:\s*var\(--ql-page-background,\s*transparent\)/)
  })

  it('.ql-page__title 与 .ql-page__description 排版令牌与参考事实值逐值一致', () => {
    const title = ruleOf('.ql-page__title')
    expect(title).toMatch(/margin:\s*var\(--ql-title-margin,\s*0\)/)
    expect(title).toMatch(/font-size:\s*var\(--ql-title-size,\s*20px\)/)
    expect(title).toMatch(/font-weight:\s*var\(--ql-title-weight,\s*650\)/)
    expect(title).toMatch(/letter-spacing:\s*var\(--ql-title-letter-spacing,\s*-0\.01em\)/)
    expect(title).toMatch(/color:\s*var\(--ql-title-color,\s*#09090b\)/)

    const desc = ruleOf('.ql-page__description')
    expect(desc).toMatch(/margin:\s*var\(--ql-desc-margin,\s*4px 0 0\)/)
    expect(desc).toMatch(/font-size:\s*var\(--ql-desc-size,\s*13px\)/)
    expect(desc).toMatch(/color:\s*var\(--ql-desc-color,\s*#71717a\)/)
    expect(desc).toMatch(/line-height:\s*var\(--ql-desc-line-height,\s*1\.5\)/)
  })

  it('全部规则均落在 ql- 命名空间与 --ql- 令牌内，且样式为 scoped（不泄漏到未接入页面）', () => {
    const src = shellSource()
    expect(src.match(/<style scoped>/g) ?? []).toHaveLength(1)
    const globalBlocks = src.match(/<style(?![^>]*\bscoped\b)[^>]*>/g) ?? []
    expect(globalBlocks).toHaveLength(0)
    // 不出现 Feature 私有前缀、不覆盖全局 Element Plus 令牌或根变量
    const style = scopedStyle()
    expect(style).not.toMatch(/\.dss-/)
    expect(style).not.toMatch(/--el-/)
    expect(style).not.toMatch(/:root/)
    expect(style).not.toMatch(/\bbody\b/)
    expect(style).not.toMatch(/!important/)
    // 不用子选择器穿透其它组件
    expect(style).not.toMatch(/::v-deep|:deep\(/)
  })
})
