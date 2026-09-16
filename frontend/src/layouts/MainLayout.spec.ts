import { describe, it, expect } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineComponent, h, nextTick } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import ElementPlus from 'element-plus'
import MainLayout from './MainLayout.vue'

/**
 * 稳定滚动条槽位（SHARED_COMPONENT_DESIGN §7.7）：判据为路由显式声明的
 * `meta.stableScrollbarGutter === true`，未声明 / `false` / `undefined` / 非布尔真值一律保持浏览器默认。
 * 判定基于同一挂载实例上的响应式路由切换，而不是两个互不相关的静态字符串快照。
 */

const GUTTER_CLASS = 'is-stable-gutter'
/** 声明了稳定滚动条槽位的目标路由（等价接入后的“源库快照状态”）。 */
const TARGET_PATH = '/monitor/stable-target'
const TARGET_ROUTE_NAME = 'StableTarget'

/** 目标路由之外的代表性真实路由名（覆盖配置/监控两组与 standalone 大屏）。 */
const OTHER_ROUTE_NAMES = [
  'DataSource',
  'ClientConfig',
  'CdcNodeStatus',
  'TopicOffset',
  'LogQuery',
  'JobFailure',
  'LargeScreen',
] as const

/** 显式声明 false 的路由：不得启用。 */
const FALSE_FLAG_PATH = '/stub/flag-false'
/** 声明了真但非 `true` 的值：`=== true` 严格判据下不得启用。 */
const TRUTHY_FLAG_PATH = '/stub/flag-truthy'

const StubPage = defineComponent({
  name: 'StubPage',
  setup: () => () => h('div', { class: 'stub-page' }),
})

function makeRouter(includeTarget: boolean): Router {
  const routes = [
    ...(includeTarget
      ? [
          {
            path: TARGET_PATH,
            name: TARGET_ROUTE_NAME,
            component: StubPage,
            meta: { title: '源库快照状态', group: '运行监控', stableScrollbarGutter: true },
          },
        ]
      : []),
    ...OTHER_ROUTE_NAMES.map((name, i) => ({
      path: `/stub/${i}`,
      name,
      component: StubPage,
      meta: { title: name, group: '测试' },
    })),
    { path: FALSE_FLAG_PATH, name: 'FlagFalse', component: StubPage, meta: { stableScrollbarGutter: false } },
    {
      path: TRUTHY_FLAG_PATH,
      name: 'FlagTruthy',
      component: StubPage,
      // 非布尔真值：仅用于证明判据严格为 `=== true`
      meta: { stableScrollbarGutter: 'true' as unknown as boolean },
    },
    // 无 name 的具名路由：route.name 为 undefined
    { path: '/unnamed', component: StubPage, meta: { title: ' unnamed' } },
  ]
  return createRouter({ history: createMemoryHistory(), routes })
}

function otherPathFor(name: string): string {
  return `/stub/${OTHER_ROUTE_NAMES.indexOf(name as (typeof OTHER_ROUTE_NAMES)[number])}`
}

/** 同一实例：只挂载一次，后续全靠 router.push 驱动响应式切换。 */
async function mountLayout(initial: string): Promise<{ wrapper: VueWrapper; router: Router }> {
  const router = makeRouter(true)
  const pinia = createPinia()
  await router.push(initial)
  await router.isReady()
  const wrapper = mount(MainLayout, {
    global: { plugins: [pinia, router, ElementPlus] },
  })
  await flushPromises()
  await nextTick()
  return { wrapper, router }
}

function contentArea(wrapper: VueWrapper) {
  const area = wrapper.find('.content-area')
  expect(area.exists()).toBe(true)
  return area
}

// ---------------------------------------------------------------------------
// 源码静态契约
// ---------------------------------------------------------------------------

function layoutSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/layouts/MainLayout.vue'), 'utf8')
}

/** 仅 `<style>` 块、去注释：契约断言只看真实 CSS 声明。 */
function layoutStyle(): string {
  const block = layoutSource().match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
  return block.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** 模板 + `<script setup>`、去 HTML/JS 注释：用于“无脚本补偿”类断言。 */
function layoutCode(): string {
  return layoutSource()
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

describe('MainLayout 路由元数据作用域稳定滚动条槽位（SHARED_COMPONENT_DESIGN §7.7）', () => {
  it('声明 meta.stableScrollbarGutter === true 的路由下 .content-area 带通用 stable-gutter class', async () => {
    const { wrapper, router } = await mountLayout(TARGET_PATH)
    expect(router.currentRoute.value.name).toBe(TARGET_ROUTE_NAME)
    expect(router.currentRoute.value.meta.stableScrollbarGutter).toBe(true)
    expect(contentArea(wrapper).classes()).toContain(GUTTER_CLASS)
    wrapper.unmount()
  })

  it('同一实例路由切换：切到任一其他路由移除 class，切回目标路由恢复（响应式，不重新挂载）', async () => {
    const { wrapper, router } = await mountLayout(TARGET_PATH)
    const area = contentArea(wrapper)
    expect(area.classes()).toContain(GUTTER_CLASS)

    for (const name of OTHER_ROUTE_NAMES) {
      await router.push(otherPathFor(name))
      await flushPromises()
      await nextTick()
      expect(router.currentRoute.value.name, `切到 ${name}`).toBe(name)
      expect(area.classes(), `${name} 下不应带 gutter class`).not.toContain(GUTTER_CLASS)

      await router.push(TARGET_PATH)
      await flushPromises()
      await nextTick()
      expect(area.classes(), `从 ${name} 切回目标路由应恢复`).toContain(GUTTER_CLASS)
    }

    // 整个过程复用同一个 wrapper 与同一个 .content-area 元素
    expect(contentArea(wrapper).element).toBe(area.element)
    wrapper.unmount()
  })

  it('未声明元数据的路由（含无 name 路由）下也不带 class：不是“非目标即启用”的反向逻辑', async () => {
    const { wrapper, router } = await mountLayout('/unnamed')
    expect(router.currentRoute.value.name).toBeUndefined()
    expect(router.currentRoute.value.meta.stableScrollbarGutter).toBeUndefined()
    expect(contentArea(wrapper).classes()).not.toContain(GUTTER_CLASS)

    // 同一实例再切到具名非目标路由，仍不带 class
    await router.push(otherPathFor('TopicOffset'))
    await flushPromises()
    await nextTick()
    expect(contentArea(wrapper).classes()).not.toContain(GUTTER_CLASS)

    // 切到目标路由则启用
    await router.push(TARGET_PATH)
    await flushPromises()
    await nextTick()
    expect(contentArea(wrapper).classes()).toContain(GUTTER_CLASS)
    wrapper.unmount()
  })

  it('显式 false 与非布尔真值均不启用：判据严格为 === true', async () => {
    const { wrapper, router } = await mountLayout(FALSE_FLAG_PATH)
    expect(router.currentRoute.value.meta.stableScrollbarGutter).toBe(false)
    expect(contentArea(wrapper).classes()).not.toContain(GUTTER_CLASS)

    await router.push(TRUTHY_FLAG_PATH)
    await flushPromises()
    await nextTick()
    expect(contentArea(wrapper).classes()).not.toContain(GUTTER_CLASS)

    await router.push(TARGET_PATH)
    await flushPromises()
    await nextTick()
    expect(contentArea(wrapper).classes()).toContain(GUTTER_CLASS)
    wrapper.unmount()
  })

  it('scoped CSS：通用 gutter class 规则确实声明 scrollbar-gutter: stable', () => {
    const style = layoutStyle()
    const rule = style.match(/\.content-area\.is-stable-gutter\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(rule).not.toBe('')
    expect(rule).toMatch(/(^|;)\s*scrollbar-gutter:\s*stable\s*(;|$)/)
  })

  it('全文件只有一处 scrollbar-gutter 声明，且必须与 gutter class 复合：通用 .content-area 不得无条件 stable', () => {
    const style = layoutStyle()
    const all = style.match(/scrollbar-gutter/g) ?? []
    expect(all).toHaveLength(1)

    // 通用 .content-area 规则只有一条，且其规则体不含 scrollbar-gutter / stable
    const baseRules = [...style.matchAll(/(^|\n)\s*\.content-area\s*\{([^}]*)\}/g)].map((m) => m[2]!)
    expect(baseRules).toHaveLength(1)
    for (const body of baseRules) {
      expect(body).not.toMatch(/scrollbar-gutter/)
      expect(body).not.toMatch(/stable/)
    }

    // 角色分离：不把 stable 挂在 .content-card / router-view 等其他容器
    expect(style).not.toMatch(/\.content-card[^{]*\{[^}]*scrollbar-gutter/)
  })

  it('不使用 overflow-y: scroll 永久强制滚动条，不改动既有 overflow-y: auto', () => {
    const style = layoutStyle()
    expect(style).not.toMatch(/overflow-y:\s*scroll/)
    const base = style.match(/(^|\n)\s*\.content-area\s*\{([^}]*)\}/)?.[2] ?? ''
    expect(base).toMatch(/(^|;)\s*overflow-y:\s*auto\s*(;|$)/)
  })

  it('无 JS/observer/轮询/运行时宽度或 padding/margin 补偿', () => {
    const code = layoutCode()
    expect(code).not.toMatch(/ResizeObserver/)
    expect(code).not.toMatch(/MutationObserver/)
    expect(code).not.toMatch(/setInterval/)
    expect(code).not.toMatch(/setTimeout/)
    expect(code).not.toMatch(/requestAnimationFrame/)
    expect(code).not.toMatch(/window\.addEventListener\(\s*['"]resize/)
    expect(code).not.toMatch(/clientWidth/)
    expect(code).not.toMatch(/innerWidth/)
    expect(code).not.toMatch(/getBoundingClientRect/)
    expect(code).not.toMatch(/offsetWidth\s*[=+\-]/)
    expect(code).not.toMatch(/style\.(paddingRight|paddingLeft|marginRight|width)\s*=/)
  })

  it('源码契约：class 开关只由路由元数据决定，且已删除硬编码路由名判据', () => {
    const code = layoutCode()
    expect(code).toMatch(/route\.meta\.stableScrollbarGutter\s*===\s*true/)
    // 判据不得回退为硬编码路由名，也不得引入 path 前缀匹配
    expect(code).not.toMatch(/route\.name\s*===\s*['"]DataSourceRunState['"]/)
    expect(code).not.toMatch(/route\.name\s*===/)
    expect(code).not.toMatch(/route\.path\s*===\s*['"]\/monitor['"]/)
    // 通用 class 名去注释后只出现两处：一处模板绑定 + 一处 CSS 规则
    expect(code.match(/is-stable-gutter/g) ?? []).toHaveLength(1)
    expect(layoutStyle().match(/is-stable-gutter/g) ?? []).toHaveLength(1)
  })

  it('通用 class 不进入全局非 scoped 样式块（不污染其他路由与全局样式）', () => {
    const src = layoutSource()
    const globalBlocks = src.match(/<style(?![^>]*\bscoped\b)[^>]*>/g) ?? []
    expect(globalBlocks).toHaveLength(0)
  })

  it('不改变既有布局契约：.content-area 仍为 flex: 1 + 16px 20px 内边距 + overflow-y: auto', () => {
    const base = layoutStyle().match(/(^|\n)\s*\.content-area\s*\{([^}]*)\}/)?.[2] ?? ''
    expect(base).toMatch(/(^|;)\s*flex:\s*1\s*(;|$)/)
    expect(base).toMatch(/(^|;)\s*padding:\s*16px 20px\s*(;|$)/)
    expect(base).toMatch(/(^|;)\s*overflow-y:\s*auto\s*(;|$)/)
    expect(base).toMatch(/(^|;)\s*background-color:\s*#f0f2f5\s*(;|$)/)
  })
})
