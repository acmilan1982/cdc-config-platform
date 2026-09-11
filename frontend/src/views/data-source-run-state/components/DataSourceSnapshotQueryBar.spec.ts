import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { nextTick } from 'vue'
import ElementPlus from 'element-plus'
import DataSourceSnapshotQueryBar from './DataSourceSnapshotQueryBar.vue'
import { ALL_OPTION } from '@/views/data-source-run-state/utils/selection'
import type { ClientCandidate, SourceCandidate, StatusToken } from '@/types/dataSourceSnapshot'

const CLIENTS: ClientCandidate[] = [
  { id: 'CL1', desc: '客户端一', active: true },
  { id: 'CL2', desc: null, active: false },
]
const SOURCES: SourceCandidate[] = [{ id: 'DS1', org: '源库A', active: true }]
const STATUSES: StatusToken[] = ['RUNNING', 'COMPLETED']

async function mountBar(props: Record<string, unknown> = {}, attachTo?: Element) {
  const wrapper = mount(DataSourceSnapshotQueryBar, {
    props: {
      clients: CLIENTS,
      sources: SOURCES,
      statuses: STATUSES,
      busy: false,
      queryLoading: false,
      ...props,
    },
    global: { plugins: [ElementPlus] },
    ...(attachTo ? { attachTo } : {}),
  })
  await flushPromises()
  return wrapper
}

async function openSelect(wrapper: VueWrapper, index: number) {
  const select = wrapper.findAll('.el-select')[index]
  await select.find('.el-select__wrapper').trigger('click')
  await nextTick()
  await nextTick()
}

function dropdownByText(text: string): HTMLElement {
  const dropdowns = Array.from(document.body.querySelectorAll('.el-select-dropdown')) as HTMLElement[]
  const found = dropdowns.find((d) =>
    Array.from(d.querySelectorAll('.el-select-dropdown__item')).some((it) =>
      it.textContent?.includes(text),
    ),
  )
  if (!found) throw new Error(`未找到含 "${text}" 的下拉面板`)
  return found
}

async function clickOption(dropdown: HTMLElement, label: string) {
  const items = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item')) as HTMLElement[]
  const target = items.find((it) => it.textContent?.trim() === label)
  if (!target) throw new Error(`未找到选项 "${label}"`)
  target.click()
  await nextTick()
  await nextTick()
}

function queryButton(wrapper: VueWrapper) {
  return wrapper.findAll('button').find((b) => b.text().includes('查询'))!
}

function resetButton(wrapper: VueWrapper) {
  return wrapper.findAll('button').find((b) => b.text().includes('重置'))!
}

describe('DataSourceSnapshotQueryBar 三维固定名称与“全部”互斥草稿（DESIGN §7.1/§7.2，DSS-REQ-022/023）', () => {
  it('渲染 探针端/源库/快照状态 三个固定名称，未选择时每维下拉占位仍为“全部”', async () => {
    const wrapper = await mountBar()
    const labels = wrapper.findAll('.dss-q-label').map((el) => el.text().trim())
    expect(labels).toEqual(['探针端', '源库', '快照状态'])
    expect(wrapper.findAll('.el-select')).toHaveLength(3)
    wrapper.unmount()
  })

  it('默认三项“全部”，点击查询发出 __ALL__ 哨兵草稿（哨兵只存在于草稿层）', async () => {
    const wrapper = await mountBar()
    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect(emitted).toHaveLength(1)
    expect(emitted[0][0]).toEqual({
      clients: [ALL_OPTION],
      sources: [ALL_OPTION],
      statuses: [ALL_OPTION],
    })
    wrapper.unmount()
  })

  it('“全部”固定为每个维度下拉第一项', async () => {
    const wrapper = await mountBar()
    for (let i = 0; i < 3; i++) {
      await openSelect(wrapper, i)
      const dropdown = dropdownByText(i === 0 ? 'CL1（客户端一）' : i === 1 ? '源库A（DS1）' : '快照进行中（RUNNING）')
      const items = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item'))
      expect(items[0]?.textContent?.trim()).toBe('全部')
    }
    wrapper.unmount()
  })

  it('选具体值自动取消“全部”；查询草稿只含具体值；互斥不跨维', async () => {
    const wrapper = await mountBar()
    await openSelect(wrapper, 0)
    await clickOption(dropdownByText('CL1（客户端一）'), 'CL1（客户端一）')
    await openSelect(wrapper, 2)
    await clickOption(dropdownByText('快照进行中（RUNNING）'), '快照进行中（RUNNING）')

    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect(emitted[0][0]).toEqual({
      clients: ['CL1'],
      sources: [ALL_OPTION],
      statuses: ['RUNNING'],
    })
    wrapper.unmount()
  })

  it('具体值选中后再点“全部”只保留“全部”', async () => {
    const wrapper = await mountBar()
    await openSelect(wrapper, 0)
    await clickOption(dropdownByText('CL1（客户端一）'), 'CL1（客户端一）')
    await openSelect(wrapper, 0)
    await clickOption(dropdownByText('全部'), '全部')

    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect((emitted[0][0] as { clients: string[] }).clients).toEqual([ALL_OPTION])
    wrapper.unmount()
  })

  it('已选具体值被再次点击取消（清空）后回“全部”，不出现空白态', async () => {
    const wrapper = await mountBar()
    await openSelect(wrapper, 1)
    await clickOption(dropdownByText('源库A（DS1）'), '源库A（DS1）')
    await openSelect(wrapper, 1)
    await clickOption(dropdownByText('源库A（DS1）'), '源库A（DS1）')

    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect((emitted[0][0] as { sources: string[] }).sources).toEqual([ALL_OPTION])
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar 重置/忙碌禁用（DESIGN §8 E7，R1-02，DSS-REQ-025/AC-050）', () => {
  it('重置只恢复草稿为三项“全部”、不查询；重置后再查询仍为“全部”草稿', async () => {
    const wrapper = await mountBar()
    await openSelect(wrapper, 0)
    await clickOption(dropdownByText('CL1（客户端一）'), 'CL1（客户端一）')
    expect(wrapper.emitted('query')).toBeUndefined()

    await resetButton(wrapper).trigger('click')
    expect(wrapper.emitted('query')).toBeUndefined()

    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect(emitted[0][0]).toEqual({
      clients: [ALL_OPTION],
      sources: [ALL_OPTION],
      statuses: [ALL_OPTION],
    })
    wrapper.unmount()
  })

  it('busy（任一实际请求在途）时“查询”功能被阻断：不原生禁用、不闪动，以 aria-disabled 标记（AC-072）', async () => {
    const wrapper = await mountBar({ busy: true })
    const btn = queryButton(wrapper)
    expect(btn.attributes('aria-disabled')).toBe('true')
    // 非发起按钮不得因全局 busy 出现变灰/按压视觉：不原生禁用、不显示 loading
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
    expect(btn.classes()).not.toContain('is-loading')
    wrapper.unmount()
  })

  it('busy 时点击“查询”被事件防御直接返回：鼠标与键盘同一入口均不产生第二请求（DSS-REQ-071 a）', async () => {
    const wrapper = await mountBar({ busy: true })
    const btn = queryButton(wrapper)
    await btn.trigger('click')
    btn.element.click()
    expect(wrapper.emitted('query')).toBeUndefined()
    wrapper.unmount()
  })

  it('空闲时“查询”无 aria-disabled，点击发出一次查询草稿', async () => {
    const wrapper = await mountBar()
    const btn = queryButton(wrapper)
    expect(btn.attributes('aria-disabled')).toBeUndefined()
    await btn.trigger('click')
    expect(wrapper.emitted('query')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar 六类请求查询按钮视觉映射（DSS-REQ-071④，AC-078）', () => {
  it('仅 query 在途（queryLoading）时“查询”按钮显示 loading（is-loading 且原生禁用）', async () => {
    const wrapper = await mountBar({ queryLoading: true, busy: true })
    const btn = queryButton(wrapper)
    expect(btn.classes()).toContain('is-loading')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    wrapper.unmount()
  })

  it('initial/retry/auto/restore 在途不使“查询”按钮 loading：queryLoading=false 时按钮外观稳定', async () => {
    const wrapper = await mountBar({ busy: true }) // 模拟其它请求在途
    const btn = queryButton(wrapper)
    expect(btn.classes()).not.toContain('is-loading')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar 候选下拉幽灵项（UI §3.5）', () => {
  it('已选值随候选列表消失后保留为“不在候选内”幽灵项，可再次选中回草稿', async () => {
    const wrapper = await mountBar()
    await openSelect(wrapper, 0)
    await clickOption(dropdownByText('CL1（客户端一）'), 'CL1（客户端一）')

    // 候选列表变化：CL1 已不存在（只剩 CL2）
    await wrapper.setProps({ clients: [{ id: 'CL2', desc: null, active: false }] })
    await nextTick()

    await openSelect(wrapper, 0)
    const dropdown = dropdownByText('CL1（不在候选内）')
    const item = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item')).find((it) =>
      it.textContent?.includes('CL1（不在候选内）'),
    )!
    expect(item).toBeTruthy()
    expect(item.classList.contains('dss-ghost')).toBe(true)

    // 已消失值仍保留在草稿中，可随查询再次提交（幽灵项用于保留已选值语义，不发请求时不受影响）
    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect((emitted[0][0] as { clients: string[] }).clients).toEqual(['CL1'])
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar 探针端下拉长度与文本截断（UI §16.5，DSS-REQ-075，AC-084）', () => {
  const LONG_ID = 'X'.repeat(25)
  const LONG_DESC = 'Y'.repeat(25)

  async function mountProbe(desc: string | null) {
    return mountBar({ clients: [{ id: LONG_ID, desc, active: true }] })
  }

  function dropdownItems(): HTMLElement[] {
    const popper = document.body.querySelector('.el-select-dropdown.dss-client-popper') as HTMLElement | null
    if (!popper) throw new Error('未找到 dss-client-popper 下拉面板')
    return Array.from(popper.querySelectorAll('.el-select-dropdown__item')) as HTMLElement[]
  }

  it('ID/描述各截断到前 20 个 Unicode 字符并追加英文 ...；完整 value 不截断，点击查询提交完整 ID', async () => {
    const wrapper = await mountProbe(LONG_DESC)
    await openSelect(wrapper, 0)
    const items = dropdownItems()
    // 第一项“全部”完整显示
    expect(items[0]!.textContent!.trim()).toBe('全部')
    // 长 ID/描述显示：20 + "..."
    const longItem = items[1]!
    expect(longItem.textContent!.trim()).toMatch(/^X{20}\.\.\.（Y{20}\.\.\.）$/)
    longItem.click()
    await nextTick()
    await nextTick()

    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect((emitted[0][0] as { clients: string[] }).clients).toEqual([LONG_ID])
    wrapper.unmount()
  })

  it('描述为空时只显示截断后的 ID，不显示空括号', async () => {
    const wrapper = await mountProbe(null)
    await openSelect(wrapper, 0)
    const item = dropdownItems()[1]!
    expect(item.textContent!.trim()).toMatch(/^X{20}\.\.\.$/)
    expect(item.textContent).not.toContain('（')
    wrapper.unmount()
  })

  it('码点安全：截断按 Unicode code point，不拆开代理对（emoji 超出 20 码点正常截断）', async () => {
    const emojiId = '😀'.repeat(25)
    const wrapper = await mountBar({ clients: [{ id: emojiId, desc: null, active: true }] })
    await openSelect(wrapper, 0)
    const item = dropdownItems()[1]!
    // 恰好 20 个完整 emoji + "..."
    expect(item.textContent!.trim()).toMatch(/^(?:😀){20}\.\.\.$/)
    item.click()
    await nextTick()
    await nextTick()
    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect((emitted[0][0] as { clients: string[] }).clients).toEqual([emojiId])
    wrapper.unmount()
  })

  it('ghost（不在候选内）候选按相同 ID 截断规则展示，且保留“不在候选内”语义；提交仍用完整值', async () => {
    const wrapper = await mountProbe(null)
    await openSelect(wrapper, 0)
    dropdownItems()[1]!.click()
    await nextTick()
    await nextTick()

    // 候选列表变化：长 ID 已不存在（候选为空）
    await wrapper.setProps({ clients: [] })
    await nextTick()

    await openSelect(wrapper, 0)
    const popper = document.body.querySelector('.el-select-dropdown.dss-client-popper') as HTMLElement
    const item = Array.from(popper.querySelectorAll('.el-select-dropdown__item')).find((it) =>
      it.textContent?.includes('不在候选内'),
    ) as HTMLElement
    expect(item.textContent!.trim()).toMatch(/^X{20}\.\.\.（不在候选内）$/)
    expect(item.classList.contains('dss-ghost')).toBe(true)

    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect((emitted[0][0] as { clients: string[] }).clients).toEqual([LONG_ID])
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar 控件宽度与下拉面板宽度约束（UI §16.5，DSS-REQ-075，AC-085）', () => {
  it('源码字面量契约：控件宽度 探针端 240 / 源库 300 / 快照状态 200，popper-class 使用 Feature 命名空间', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue'), 'utf8')
    expect(src).toMatch(/\.dss-client-select\s*\{\s*width:\s*240px;\s*\}/s)
    expect(src).toMatch(/\.dss-source-select\s*\{\s*width:\s*300px;\s*\}/s)
    expect(src).toMatch(/\.dss-status-select\s*\{\s*width:\s*200px;\s*\}/s)
    expect(src).toContain('popper-class="dss-client-popper"')
    expect(src).toContain('popper-class="dss-source-popper"')
    expect(src).toContain('popper-class="dss-status-popper"')
  })

  it('源码字面量契约：下拉面板上限 探针端 ≤480px、源库 ≤560px，均不超过安全视口 calc(100vw - 16px)', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue'), 'utf8')
    expect(src).toMatch(/\.dss-client-popper\s*\{\s*max-width:\s*min\(480px,\s*calc\(100vw - 16px\)\);\s*\}/s)
    expect(src).toMatch(/\.dss-source-popper\s*\{\s*max-width:\s*min\(560px,\s*calc\(100vw - 16px\)\);\s*\}/s)
  })

  it('打开探针端下拉时挂载专属 popper-class（命名空间化，不污染全局下拉样式）', async () => {
    const wrapper = await mountBar()
    await openSelect(wrapper, 0)
    expect(document.body.querySelector('.el-select-dropdown.dss-client-popper')).toBeTruthy()
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar R5 已选值去灰底（§4）', () => {
  it('源码字面量契约：已选标签底色透明、去边框，仅保留文字与清除 ×；不改变盒模型（高度/内边距/圆角不变）', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue'), 'utf8')
    const rule = src.match(/\.dss-select :deep\(\.el-select__wrapper \.el-tag\)\s*\{[^}]*\}/)?.[0] ?? ''
    expect(rule).toMatch(/background:\s*transparent/)
    expect(rule).toMatch(/border:\s*none/)
    // 去灰底不引入盒模型变化：不覆写 height / padding / line-height，下拉框尺寸与布局保持
    expect(rule).not.toMatch(/(?<!-)\bheight\s*:/)
    expect(rule).not.toMatch(/\bpadding\s*:/)
    expect(rule).not.toMatch(/line-height\s*:/)
    // 旧的灰色块底色已彻底移除
    expect(src).not.toMatch(/rgba\(9, 9, 11, 0\.06\)/)
  })

  it('三个下拉框均渲染可清除的已选标签（× 保留）；清除 × 未被隐藏', async () => {
    const wrapper = await mountBar()
    const selects = wrapper.findAll('.el-select')
    expect(selects).toHaveLength(3)
    for (const sel of selects) {
      const tag = sel.find('.el-tag')
      expect(tag.exists()).toBe(true)
      // Element Plus 的清除 × 即标签内的 el-tag__close；R5 不得移除
      expect(tag.find('.el-tag__close').exists()).toBe(true)
    }
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar R6 查询字段标签视觉层级（R6 §1）', () => {
  const queryBarSrc = () =>
    readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue'), 'utf8')

  /** 提取唯一 .dss-q-label 规则体，用于字面量契约校验。 */
  function labelRule(): string {
    return queryBarSrc().match(/\.dss-q-label\s*\{[^}]*\}/)?.[0] ?? ''
  }

  it('三个字段标签（探针端/源库/快照状态）均存在，且共用唯一 dss-q-label 类与唯一规则（样式完全统一）', async () => {
    const wrapper = await mountBar()

    const labels = wrapper.findAll('.dss-q-label')
    expect(labels).toHaveLength(3)
    expect(labels.map((el) => el.text().trim())).toEqual(['探针端', '源库', '快照状态'])

    // 三个标签均只带 dss-q-label 单一类 → 字号/字重/颜色/行高由同一条规则决定，必然一致
    for (const label of labels) {
      expect(label.classes()).toEqual(['dss-q-label'])
    }

    // 源码中只存在一处 .dss-q-label 声明：不存在覆盖式第二条规则导致三者不一致
    const declarations = queryBarSrc().match(/\.dss-q-label\s*\{/g) ?? []
    expect(declarations).toHaveLength(1)

    wrapper.unmount()
  })

  it('源码字面量契约：字号 14px、字重 600、颜色 #3F3F46（提升为明确字段标签）', () => {
    const rule = labelRule()
    expect(rule).not.toBe('')
    expect(rule).toMatch(/font-size:\s*14px/)
    expect(rule).toMatch(/font-weight:\s*600/)
    expect(rule).toMatch(/color:\s*var\(--dss-text-secondary,\s*#3f3f46\)/)
    // R5 偏小的辅助文字层级（13px/500）不得保留
    expect(rule).not.toMatch(/font-size:\s*13px/)
    expect(rule).not.toMatch(/font-weight:\s*500/)
  })

  it('源码字面量契约：无背景、无边框、无阴影（保持纯文字标签）', () => {
    const rule = labelRule()
    expect(rule).not.toMatch(/background/)
    expect(rule).not.toMatch(/border/)
    expect(rule).not.toMatch(/box-shadow/)
    expect(rule).not.toMatch(/outline/)
  })

  it('源码字面量契约：保持单行（nowrap）且不覆写盒模型（不设 padding / height / line-height）', () => {
    const rule = labelRule()
    expect(rule).toMatch(/white-space:\s*nowrap/)
    expect(rule).not.toMatch(/\bpadding\s*:/)
    expect(rule).not.toMatch(/(?<!-)\bheight\s*:/)
    expect(rule).not.toMatch(/line-height\s*:/)
  })

  it('垂直居中：每个标签与其下拉框同处一个 inline-flex + align-items:center 的 .dss-q-group', async () => {
    const wrapper = await mountBar()
    const groups = wrapper.findAll('.dss-q-group')
    expect(groups).toHaveLength(3)
    for (const group of groups) {
      expect(group.find('.dss-q-label').exists()).toBe(true)
      expect(group.find('.el-select').exists()).toBe(true)
      // 标签在控件之前，符合“字段名 + 控件”的阅读顺序
      expect(group.element.firstElementChild?.classList.contains('dss-q-label')).toBe(true)
    }
    // 组容器对齐方式决定垂直居中
    expect(queryBarSrc()).toMatch(/\.dss-q-group\s*\{[^}]*align-items:\s*center/s)
    wrapper.unmount()
  })

  it('不影响三个下拉框原有尺寸：控件宽度字面量 240 / 300 / 200 与 wrapper 最小高度保持 R5', () => {
    const src = queryBarSrc()
    expect(src).toMatch(/\.dss-client-select\s*\{\s*width:\s*240px;\s*\}/s)
    expect(src).toMatch(/\.dss-source-select\s*\{\s*width:\s*300px;\s*\}/s)
    expect(src).toMatch(/\.dss-status-select\s*\{\s*width:\s*200px;\s*\}/s)
    expect(src).toMatch(/\.dss-select :deep\(\.el-select__wrapper\)\s*\{[^}]*min-height:\s*30px/s)
  })

  it('不影响查询按钮：仍为黑色主按钮，文案与类名不变', async () => {
    const wrapper = await mountBar()
    const btn = queryButton(wrapper)
    expect(btn.classes()).toContain('dss-query-btn')
    expect(btn.text().trim()).toBe('查询')
    // 黑色主按钮语义（R5 已确认）不被本轮标签调整触碰
    expect(queryBarSrc()).toMatch(/\.dss-q-actions \.dss-query-btn\s*\{[^}]*background:\s*var\(--dss-primary,\s*#09090b\)/s)
    wrapper.unmount()
  })

  it('不产生额外请求：渲染与点击标签均不发查询；仅点击“查询”发出一次草稿', async () => {
    const wrapper = await mountBar()
    // 渲染本身不产生任何查询
    expect(wrapper.emitted('query')).toBeUndefined()

    // 标签为非交互纯文本，点击不触发查询
    const label = wrapper.findAll('.dss-q-label')[0]!
    expect(label.element.tagName).toBe('SPAN')
    await label.trigger('click')
    expect(wrapper.emitted('query')).toBeUndefined()

    // 仍然只有显式“查询”才发出草稿，且恰好一次
    await queryButton(wrapper).trigger('click')
    expect(wrapper.emitted('query')).toHaveLength(1)

    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// DSS-REQ-084 / DSS-REQ-085 / DSS-REQ-086（AC-096~103）本轮查询控件交互调整
// ---------------------------------------------------------------------------

/** 20 个字符：恰好等于截断上限，必须完整显示、不追加省略号。 */
const CP20 = 'A'.repeat(20)
/** 21 个字符：只显示前 20 个并追加 "..."。 */
const CP21 = 'B'.repeat(21)
/** 25 个 code point 的长描述：>20 → 展示被截断、Tooltip 应出现。 */
const LONG_DESC = '长'.repeat(25)

function queryBarSource(): string {
  return readFileSync(
    resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue'),
    'utf8',
  )
}

function optionRow(popper: HTMLElement, label: string): HTMLElement {
  const row = Array.from(popper.querySelectorAll('.el-select-dropdown__item')).find(
    (it) => it.textContent?.trim() === label,
  )
  if (!row) throw new Error(`未找到候选行 "${label}"`)
  return row as HTMLElement
}

function popperByClass(cls: string): HTMLElement {
  const all = document.body.querySelectorAll(`.el-select-dropdown.${cls}`)
  const p = all.length ? (all[all.length - 1] as HTMLElement) : null
  if (!p) throw new Error(`未找到 .${cls} 下拉面板`)
  return p
}

/**
 * Tooltip 锚点解析走 document 级委托，只有挂在 document 上的子树才能触发；
 * 而下拉面板被 Teleport 到 body、选中项标签留在组件子树内，故需要把组件挂到 body 再悬停。
 */
const hosts: HTMLElement[] = []
async function mountTtBar(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  hosts.push(host)
  return mountBar(props, host)
}

function clientPopper(): HTMLElement {
  return popperByClass('dss-client-popper')
}

function sourcePopper(): HTMLElement {
  return popperByClass('dss-source-popper')
}

function hover(el: Element) {
  el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
}

function unhover(el: Element, to?: Element) {
  el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: to ?? null }))
}

async function settleTooltip() {
  await nextTick()
  await nextTick()
  await nextTick()
}

function tooltipEl(): HTMLElement | null {
  const all = document.body.querySelectorAll('.dss-q-tt')
  return all.length ? (all[all.length - 1] as HTMLElement) : null
}

describe('DataSourceSnapshotQueryBar 四字段统一字段级截断（DSS-REQ-085，AC-098/099/103）', () => {
  it('边界 19/20 显示原文不追加省略号；21/22 只显示前 20 个 code point + 英文 ...', async () => {
    const wrapper = await mountBar({
      clients: [
        { id: 'A'.repeat(19), desc: null, active: true },
        { id: CP20, desc: null, active: true },
        { id: CP21, desc: null, active: true },
        { id: 'C'.repeat(22), desc: null, active: true },
      ],
    })
    await openSelect(wrapper, 0)
    const popper = clientPopper()
    expect(optionRow(popper, 'A'.repeat(19)).textContent!.trim()).toBe('A'.repeat(19))
    expect(optionRow(popper, CP20).textContent!.trim()).toBe(CP20)
    expect(optionRow(popper, 'B'.repeat(20) + '...').textContent!.trim()).toBe('B'.repeat(20) + '...')
    expect(optionRow(popper, 'C'.repeat(20) + '...').textContent!.trim()).toBe('C'.repeat(20) + '...')
    wrapper.unmount()
  })

  it('探针端组合展示为 truncate(ID,20)（truncate(DESC,20)）：ID 与描述各自独立截断', async () => {
    const wrapper = await mountBar({ clients: [{ id: CP21, desc: 'D'.repeat(22), active: true }] })
    await openSelect(wrapper, 0)
    const label = `${'B'.repeat(20)}...（${'D'.repeat(20)}...）`
    expect(optionRow(clientPopper(), label).textContent!.trim()).toBe(label)
    wrapper.unmount()
  })

  it('源库端组合展示为 truncate(ORG,20)（truncate(ID,20)）——本轮新增 ORG/ID 两侧字段级截断', async () => {
    const wrapper = await mountBar({
      sources: [{ id: 'S'.repeat(22), org: '源'.repeat(22), active: true }],
    })
    await openSelect(wrapper, 1)
    const label = `${'源'.repeat(20)}...（${'S'.repeat(20)}...）`
    expect(optionRow(sourcePopper(), label).textContent!.trim()).toBe(label)
    wrapper.unmount()
  })

  it('源库 ORG 为 null/空/纯空白时只显示截断后的 ID，不出现空括号', async () => {
    for (const org of [null, '', '   ']) {
      const wrapper = await mountBar({ sources: [{ id: 'S'.repeat(22), org, active: true }] })
      await openSelect(wrapper, 1)
      const row = Array.from(sourcePopper().querySelectorAll('.el-select-dropdown__item')).find(
        (it) => it.textContent?.includes('...'),
      ) as HTMLElement
      expect(row.textContent!.trim()).toBe('S'.repeat(20) + '...')
      expect(row.textContent).not.toContain('（')
      wrapper.unmount()
    }
  })

  it('CLIENT_DESC 为 null/空/纯空白时只显示截断后的 ID，不出现空括号', async () => {
    for (const desc of [null, '', '   ']) {
      const wrapper = await mountBar({ clients: [{ id: CP21, desc, active: true }] })
      await openSelect(wrapper, 0)
      const row = optionRow(clientPopper(), 'B'.repeat(20) + '...')
      expect(row.textContent!.trim()).toBe('B'.repeat(20) + '...')
      expect(row.textContent).not.toContain('（')
      wrapper.unmount()
    }
  })

  it('候选下拉项与可见选中项采用同一套显示结果（同一原始值两处逐字一致）', async () => {
    const wrapper = await mountBar({ clients: [{ id: CP21, desc: 'D'.repeat(22), active: true }] })
    const label = `${'B'.repeat(20)}...（${'D'.repeat(20)}...）`
    await openSelect(wrapper, 0)
    const rowLabel = optionRow(clientPopper(), label).textContent!.trim()
    await clickOption(clientPopper(), label)
    const tagLabel = wrapper.find('.dss-client-select .el-select__tags-text').text().trim()
    expect(tagLabel).toBe(rowLabel)
    expect(tagLabel).toBe(label)
    wrapper.unmount()
  })

  it('代理对不被拆断：emoji 超 20 code point 时按 code point 截断（下拉与选中项一致）', async () => {
    const emojiId = '😀'.repeat(25)
    const wrapper = await mountBar({ clients: [{ id: emojiId, desc: null, active: true }] })
    await openSelect(wrapper, 0)
    const label = '😀'.repeat(20) + '...'
    expect(optionRow(clientPopper(), label).textContent!.trim()).toBe(label)
    await clickOption(clientPopper(), label)
    expect(wrapper.find('.dss-client-select .el-select__tags-text').text().trim()).toBe(label)
    wrapper.unmount()
  })

  it('截断只影响显示：选项 value / 查询参数仍为完整原始 ID（超长 ID 与超长 ORG 均不回填截断值）', async () => {
    const wrapper = await mountBar({
      clients: [{ id: CP21, desc: 'D'.repeat(22), active: true }],
      sources: [{ id: 'S'.repeat(22), org: '源'.repeat(22), active: true }],
    })
    await openSelect(wrapper, 0)
    await clickOption(clientPopper(), `${'B'.repeat(20)}...（${'D'.repeat(20)}...）`)
    await openSelect(wrapper, 1)
    await clickOption(sourcePopper(), `${'源'.repeat(20)}...（${'S'.repeat(20)}...）`)

    await queryButton(wrapper).trigger('click')
    const draft = wrapper.emitted('query')![0]![0] as { clients: string[]; sources: string[] }
    expect(draft.clients).toEqual([CP21])
    expect(draft.sources).toEqual(['S'.repeat(22)])
    wrapper.unmount()
  })

  it('源库幽灵项（不在候选内）超长 ID 同样按 20 code point 截断', async () => {
    const wrapper = await mountBar({ sources: [{ id: 'S'.repeat(22), org: null, active: true }] })
    await openSelect(wrapper, 1)
    await clickOption(sourcePopper(), 'S'.repeat(20) + '...')
    await wrapper.setProps({ sources: [] })
    await nextTick()
    await openSelect(wrapper, 1)
    const ghost = Array.from(sourcePopper().querySelectorAll('.el-select-dropdown__item')).find(
      (it) => it.textContent?.includes('不在候选内'),
    ) as HTMLElement
    expect(ghost.textContent!.trim()).toBe('S'.repeat(20) + '...（不在候选内）')
    await queryButton(wrapper).trigger('click')
    expect((wrapper.emitted('query')![0]![0] as { sources: string[] }).sources).toEqual(['S'.repeat(22)])
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar 四字段先 trim 再 20 码点截断（R1 §5/§5.1，DSS-REQ-085）', () => {
  it('四个展示字段（CLIENT_ID / CLIENT_DESC / DATA_SOURCE_ORG / DATA_SOURCE_ID）共用同一规则：先 trim 再截断', async () => {
    const wrapper = await mountBar({
      clients: [{ id: `  ${'I'.repeat(22)}  `, desc: `  ${'D'.repeat(22)}  `, active: true }],
      sources: [{ id: `  ${'S'.repeat(22)}  `, org: `  ${'源'.repeat(22)}  `, active: true }],
    })
    await openSelect(wrapper, 0)
    const clientLabel = `${'I'.repeat(20)}...（${'D'.repeat(20)}...）`
    expect(optionRow(clientPopper(), clientLabel).textContent!.trim()).toBe(clientLabel)

    await openSelect(wrapper, 1)
    const sourceLabel = `${'源'.repeat(20)}...（${'S'.repeat(20)}...）`
    expect(optionRow(sourcePopper(), sourceLabel).textContent!.trim()).toBe(sourceLabel)
    wrapper.unmount()
  })

  it('首尾空白被 trim：trim 前超 20、trim 后恰好 20 时完整显示、不追加省略号', async () => {
    const id = `   ${'T'.repeat(20)}   `
    const wrapper = await mountBar({ clients: [{ id, desc: null, active: true }] })
    await openSelect(wrapper, 0)
    const row = optionRow(clientPopper(), 'T'.repeat(20))
    expect(row.textContent!.trim()).toBe('T'.repeat(20))
    expect(row.textContent).not.toContain('...')
    wrapper.unmount()
  })

  it('trim 只影响显示：带首尾空白的原始 ID 仍是完整选项 value 与查询参数', async () => {
    const id = `  ${'U'.repeat(22)}  `
    const wrapper = await mountBar({ clients: [{ id, desc: null, active: true }] })
    await openSelect(wrapper, 0)
    const label = 'U'.repeat(20) + '...'
    const row = optionRow(clientPopper(), label)
    expect(row.getAttribute('data-dss-client-id')).toBe(id)
    await clickOption(clientPopper(), label)
    await queryButton(wrapper).trigger('click')
    expect((wrapper.emitted('query')![0]![0] as { clients: string[] }).clients).toEqual([id])
    wrapper.unmount()
  })

  it('CLIENT_DESC 纯空白 trim 后为空：只显示处理后的 ID，不出现空括号', async () => {
    const wrapper = await mountBar({ clients: [{ id: 'CL1', desc: '    ', active: true }] })
    await openSelect(wrapper, 0)
    const row = optionRow(clientPopper(), 'CL1')
    expect(row.textContent!.trim()).toBe('CL1')
    expect(row.textContent).not.toContain('（')
    wrapper.unmount()
  })

  it('DATA_SOURCE_ORG 纯空白 trim 后为空：回退显示处理后的 DATA_SOURCE_ID，不出现空括号', async () => {
    const wrapper = await mountBar({ sources: [{ id: '  DS1  ', org: '   ', active: true }] })
    await openSelect(wrapper, 1)
    const row = optionRow(sourcePopper(), 'DS1')
    expect(row.textContent!.trim()).toBe('DS1')
    expect(row.textContent).not.toContain('（')
    wrapper.unmount()
  })

  it('组合标签不是整体截断：ID 与描述各自独立 trim + 20 码点截断', async () => {
    // 组合串整体共 44 码点，若整体截断会得到 20 码点；分字段截断则应两段各保留 20 码点 + ...
    const wrapper = await mountBar({
      clients: [{ id: 'B'.repeat(21), desc: 'D'.repeat(21), active: true }],
    })
    await openSelect(wrapper, 0)
    const label = `${'B'.repeat(20)}...（${'D'.repeat(20)}...）`
    expect(optionRow(clientPopper(), label).textContent!.trim()).toBe(label)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar CLIENT_DESC 完整 Tooltip（DSS-REQ-086，AC-100/101/102/103）', () => {
  // Tooltip 宿主 Teleport 到 body：每个用例前清掉可能残留的实例，避免跨用例误判“至多一个”。
  beforeEach(() => {
    document.body.querySelectorAll('.dss-q-tt').forEach((n) => n.remove())
  })
  afterEach(() => {
    while (hosts.length) hosts.pop()!.remove()
  })

  it('仅当原始 CLIENT_DESC code point 长度 > 20 时，候选项悬停显示完整未截断原文', async () => {
    const wrapper = await mountTtBar({
      clients: [{ id: 'C1', desc: LONG_DESC, active: true }],
    })
    await openSelect(wrapper, 0)
    const row = optionRow(clientPopper(), `C1（${'长'.repeat(20)}...）`)
    hover(row)
    await settleTooltip()
    const tt = tooltipEl()
    expect(tt).toBeTruthy()
    // 内容 = 完整原始描述：不含 CLIENT_ID、不含组合文本、不含截断文本、不追加说明
    expect(tt!.textContent).toBe(LONG_DESC)
    expect(tt!.textContent).not.toContain('C1')
    expect(tt!.textContent).not.toContain('...')
    expect(tt!.textContent).not.toContain('不在候选内')
    unhover(row)
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('长度恰好 20（不被截断）时无 Tooltip；19 亦无', async () => {
    for (const desc of ['长'.repeat(20), '长'.repeat(19)]) {
      const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc, active: true }] })
      await openSelect(wrapper, 0)
      hover(optionRow(clientPopper(), `C1（${desc}）`))
      await settleTooltip()
      expect(tooltipEl()).toBeNull()
      wrapper.unmount()
    }
  })

  it('CLIENT_DESC 为 null/空串/纯空白时无 Tooltip', async () => {
    for (const desc of [null, '', '   ']) {
      const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc, active: true }] })
      await openSelect(wrapper, 0)
      hover(optionRow(clientPopper(), 'C1'))
      await settleTooltip()
      expect(tooltipEl()).toBeNull()
      wrapper.unmount()
    }
  })

  it('超长 CLIENT_ID 自身不产生 Tooltip（本轮不为 ID 新增 Tooltip）', async () => {
    const wrapper = await mountTtBar({ clients: [{ id: CP21, desc: null, active: true }] })
    await openSelect(wrapper, 0)
    hover(optionRow(clientPopper(), 'B'.repeat(20) + '...'))
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('源库候选（ORG/ID 超 20）悬停不产生 Tooltip（本轮不为源库新增 Tooltip）', async () => {
    const wrapper = await mountTtBar({
      sources: [{ id: 'S'.repeat(22), org: '源'.repeat(22), active: true }],
    })
    await openSelect(wrapper, 1)
    hover(optionRow(sourcePopper(), `${'源'.repeat(20)}...（${'S'.repeat(20)}...）`))
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('“全部”候选悬停不产生 Tooltip', async () => {
    const wrapper = await mountTtBar()
    await openSelect(wrapper, 0)
    hover(optionRow(clientPopper(), '全部'))
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('控件中可见选中项悬停同样显示完整原文；内容与候选一致', async () => {
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc: LONG_DESC, active: true }] })
    await openSelect(wrapper, 0)
    await clickOption(clientPopper(), `C1（${'长'.repeat(20)}...）`)
    const tag = wrapper.find('.dss-client-select .el-tag').element
    hover(tag)
    await settleTooltip()
    const tt = tooltipEl()
    expect(tt).toBeTruthy()
    expect(tt!.textContent).toBe(LONG_DESC)
    unhover(tag)
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('已选但描述 ≤20 的选中项悬停无 Tooltip', async () => {
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc: '短描述', active: true }] })
    await openSelect(wrapper, 0)
    await clickOption(clientPopper(), 'C1（短描述）')
    hover(wrapper.find('.dss-client-select .el-tag').element)
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('多选折叠 +N：悬停可见标签显示其自身描述，悬停 +N 不聚合、不显示任何 Tooltip', async () => {
    const wrapper = await mountTtBar({
      clients: [
        { id: 'C1', desc: LONG_DESC, active: true },
        { id: 'C2', desc: 'D'.repeat(23), active: true },
        { id: 'C3', desc: '第三个描述', active: true },
      ],
    })
    await openSelect(wrapper, 0)
    await clickOption(clientPopper(), `C1（${'长'.repeat(20)}...）`)
    await openSelect(wrapper, 0)
    await clickOption(clientPopper(), `C2（${'D'.repeat(20)}...）`)
    await openSelect(wrapper, 0)
    await clickOption(clientPopper(), 'C3（第三个描述）')

    // 可见标签 = 第一个选中项（C1），Tooltip 只显示它自己的完整描述
    const visibleTag = wrapper.findAll('.dss-client-select .el-tag').find((t) =>
      t.classes().includes('is-closable'),
    )!
    hover(visibleTag.element)
    await settleTooltip()
    expect(tooltipEl()!.textContent).toBe(LONG_DESC)
    unhover(visibleTag.element)
    await settleTooltip()

    // +N 折叠标签：无 is-closable，且其文案不对应任何单个探针候选 → 不产生 Tooltip
    const collapseTag = wrapper
      .findAll('.dss-client-select .el-tag')
      .find((t) => /^\s*\+\s*\d+\s*$/.test(t.text()))!
    expect(collapseTag.classes()).not.toContain('is-closable')
    hover(collapseTag.element)
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('快速在两个候选间移动：任意时刻至多一个可见实例（不叠加）', async () => {
    const wrapper = await mountTtBar({
      clients: [
        { id: 'C1', desc: LONG_DESC, active: true },
        { id: 'C2', desc: 'D'.repeat(23), active: true },
      ],
    })
    await openSelect(wrapper, 0)
    const first = optionRow(clientPopper(), `C1（${'长'.repeat(20)}...）`)
    const second = optionRow(clientPopper(), `C2（${'D'.repeat(20)}...）`)
    hover(first)
    await settleTooltip()
    expect(document.body.querySelectorAll('.dss-q-tt')).toHaveLength(1)
    hover(second)
    await settleTooltip()
    expect(document.body.querySelectorAll('.dss-q-tt')).toHaveLength(1)
    expect(tooltipEl()!.textContent).toBe('D'.repeat(23))
    wrapper.unmount()
  })

  it('鼠标移出锚点即隐藏；移出到同一锚点内部不隐藏', async () => {
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc: LONG_DESC, active: true }] })
    await openSelect(wrapper, 0)
    const row = optionRow(clientPopper(), `C1（${'长'.repeat(20)}...）`)
    hover(row)
    await settleTooltip()
    expect(tooltipEl()).toBeTruthy()
    // 在同一锚点内部移动：仍保持可见
    unhover(row, row)
    await settleTooltip()
    expect(tooltipEl()).toBeTruthy()
    // 移出锚点：隐藏
    unhover(row, document.body)
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('卸载后不再响应文档级悬停事件（不残留监听器）', async () => {
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc: LONG_DESC, active: true }] })
    await openSelect(wrapper, 0)
    const row = optionRow(clientPopper(), `C1（${'长'.repeat(20)}...）`)
    hover(row)
    await settleTooltip()
    expect(tooltipEl()).toBeTruthy()
    wrapper.unmount()
    // Teleport 宿主随组件卸载移除
    expect(tooltipEl()).toBeNull()
    // 卸载后再出现“结构上命中锚点选择器”的节点：若文档级监听器未移除，会重新弹出 Tooltip
    const zombie = document.createElement('div')
    zombie.className = 'dss-client-popper'
    const zombieRow = document.createElement('div')
    zombieRow.className = 'el-select-dropdown__item'
    zombieRow.textContent = `C1（${'长'.repeat(20)}...）`
    zombie.appendChild(zombieRow)
    document.body.appendChild(zombie)
    hover(zombieRow)
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    zombie.remove()
  })

  it('不产生额外请求：悬停/隐藏 Tooltip 全程 0 次 query 事件', async () => {
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc: LONG_DESC, active: true }] })
    await openSelect(wrapper, 0)
    const row = optionRow(clientPopper(), `C1（${'长'.repeat(20)}...）`)
    hover(row)
    await settleTooltip()
    unhover(row)
    await settleTooltip()
    expect(wrapper.emitted('query')).toBeUndefined()
    wrapper.unmount()
  })

  it('Tooltip 宿主 Teleport 到 body、不在查询栏子树内（position:fixed 不参与查询栏布局）', async () => {
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc: LONG_DESC, active: true }] })
    await openSelect(wrapper, 0)
    hover(optionRow(clientPopper(), `C1（${'长'.repeat(20)}...）`))
    await settleTooltip()
    const tt = tooltipEl()!
    expect(wrapper.find('.dss-q-tt').exists()).toBe(false)
    expect(tt.closest('.dss-query-bar')).toBeNull()
    wrapper.unmount()
  })

  it('类名与页面级表格 Tooltip 独立：不使用 dss-single-tooltip（不污染表格 Tooltip 规则）', async () => {
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc: LONG_DESC, active: true }] })
    await openSelect(wrapper, 0)
    hover(optionRow(clientPopper(), `C1（${'长'.repeat(20)}...）`))
    await settleTooltip()
    expect(document.body.querySelector('.dss-single-tooltip')).toBeNull()
    expect(tooltipEl()!.classList.contains('dss-q-tt')).toBe(true)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar Tooltip 稳定身份与截断标签碰撞（R1 §6.1/§6.2/§6.3，DSS-REQ-086）', () => {
  beforeEach(() => {
    document.body.querySelectorAll('.dss-q-tt').forEach((n) => n.remove())
  })
  afterEach(() => {
    while (hosts.length) hosts.pop()!.remove()
  })

  /** 两个探针：trim + 20 码点截断后可见标签逐字相同，但原始 CLIENT_ID 与完整 CLIENT_DESC 均不同。 */
  const COL_ID_A = `${'P'.repeat(20)}AAA`
  const COL_ID_B = `${'P'.repeat(20)}BBB`
  const COL_DESC_A = `${'D'.repeat(20)}AAA`
  const COL_DESC_B = `${'D'.repeat(20)}BBB`
  const COLLIDING_CLIENTS: ClientCandidate[] = [
    { id: COL_ID_A, desc: COL_DESC_A, active: true },
    { id: COL_ID_B, desc: COL_DESC_B, active: true },
  ]
  const COLLIDING_LABEL = `${'P'.repeat(20)}...（${'D'.repeat(20)}...）`

  function clientRows(): HTMLElement[] {
    return Array.from(clientPopper().querySelectorAll('.el-select-dropdown__item')) as HTMLElement[]
  }

  it('前提复核：两个探针的可见标签确实碰撞（逐字相同），而原始 ID / 完整描述互不相同', async () => {
    const wrapper = await mountTtBar({ clients: COLLIDING_CLIENTS })
    await openSelect(wrapper, 0)
    const rows = clientRows()
    expect(rows[1]!.textContent!.trim()).toBe(COLLIDING_LABEL)
    expect(rows[2]!.textContent!.trim()).toBe(COLLIDING_LABEL)
    expect(COL_ID_A).not.toBe(COL_ID_B)
    expect(COL_DESC_A).not.toBe(COL_DESC_B)
    wrapper.unmount()
  })

  it('候选行携带原始完整 CLIENT_ID 作为私有稳定身份（不依赖显示文字）', async () => {
    const wrapper = await mountTtBar({ clients: COLLIDING_CLIENTS })
    await openSelect(wrapper, 0)
    const rows = clientRows()
    expect(rows[0]!.getAttribute('data-dss-client-id')).toBe(ALL_OPTION)
    expect(rows[1]!.getAttribute('data-dss-client-id')).toBe(COL_ID_A)
    expect(rows[2]!.getAttribute('data-dss-client-id')).toBe(COL_ID_B)
    wrapper.unmount()
  })

  it('可见已选项同样携带原始完整 CLIENT_ID（Element Plus label slot 提供的原始 option value）', async () => {
    const wrapper = await mountTtBar({ clients: COLLIDING_CLIENTS })
    await openSelect(wrapper, 0)
    clientRows()[1]!.click()
    await nextTick()
    await nextTick()
    const holder = wrapper.find('.dss-client-select .el-tag.is-closable [data-dss-client-id]')
    expect(holder.exists()).toBe(true)
    expect(holder.attributes('data-dss-client-id')).toBe(COL_ID_A)
    wrapper.unmount()
  })

  it('碰撞候选分别悬停：各自显示自己的完整描述，互不串号', async () => {
    const wrapper = await mountTtBar({ clients: COLLIDING_CLIENTS })
    await openSelect(wrapper, 0)
    const rows = clientRows()

    hover(rows[1]!)
    await settleTooltip()
    expect(tooltipEl()!.textContent).toBe(COL_DESC_A)
    unhover(rows[1]!)
    await settleTooltip()

    hover(rows[2]!)
    await settleTooltip()
    expect(tooltipEl()!.textContent).toBe(COL_DESC_B)
    expect(tooltipEl()!.textContent).not.toContain('AAA')
    unhover(rows[2]!)
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('碰撞候选分别选中：可见已选项 Tooltip 仍对应正确探针（不因标签碰撞而失效或串号）', async () => {
    const wrapper = await mountTtBar({ clients: COLLIDING_CLIENTS })
    await openSelect(wrapper, 0)
    clientRows()[1]!.click()
    await nextTick()
    await nextTick()

    const tag = wrapper.find('.dss-client-select .el-tag.is-closable').element
    hover(tag)
    await settleTooltip()
    expect(tooltipEl()!.textContent).toBe(COL_DESC_A)

    // 追加选中第二个碰撞探针：可见标签仍是首个选中项，Tooltip 必须仍为 A 的完整描述
    await openSelect(wrapper, 0)
    clientRows()[2]!.click()
    await nextTick()
    await nextTick()
    const collapseTag = wrapper.find('.dss-client-select .el-tag.is-closable')
    expect(collapseTag.find('[data-dss-client-id]').attributes('data-dss-client-id')).toBe(COL_ID_A)
    hover(collapseTag.element)
    await settleTooltip()
    expect(document.body.querySelectorAll('.dss-q-tt')).toHaveLength(1)
    expect(tooltipEl()!.textContent).toBe(COL_DESC_A)
    wrapper.unmount()
  })

  it('碰撞探针快速交替悬停：任意时刻至多一个实例，内容随锚点正确切换', async () => {
    const wrapper = await mountTtBar({ clients: COLLIDING_CLIENTS })
    await openSelect(wrapper, 0)
    const rows = clientRows()
    hover(rows[1]!)
    await settleTooltip()
    expect(document.body.querySelectorAll('.dss-q-tt')).toHaveLength(1)
    hover(rows[2]!)
    await settleTooltip()
    expect(document.body.querySelectorAll('.dss-q-tt')).toHaveLength(1)
    expect(tooltipEl()!.textContent).toBe(COL_DESC_B)
    hover(rows[1]!)
    await settleTooltip()
    expect(document.body.querySelectorAll('.dss-q-tt')).toHaveLength(1)
    expect(tooltipEl()!.textContent).toBe(COL_DESC_A)
    wrapper.unmount()
  })

  it('Tooltip 内容为 trim 后的完整描述：不截断、不保留首尾无意义空白', async () => {
    const desc = `   ${'长'.repeat(25)}   `
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc, active: true }] })
    await openSelect(wrapper, 0)
    hover(optionRow(clientPopper(), `C1（${'长'.repeat(20)}...）`))
    await settleTooltip()
    expect(tooltipEl()!.textContent).toBe('长'.repeat(25))
    expect(tooltipEl()!.textContent).not.toContain(' ')
    wrapper.unmount()
  })

  it('判定基于 trim 后的码点数：trim 前 >20 但 trim 后恰好 20 → 无 Tooltip', async () => {
    const desc = `   ${'长'.repeat(20)}   `
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc, active: true }] })
    await openSelect(wrapper, 0)
    hover(optionRow(clientPopper(), `C1（${'长'.repeat(20)}）`))
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('判定基于 trim 后的码点数：trim 后 21 → 显示 Tooltip，且内容为 trim 后的 21 码点全文', async () => {
    const desc = `  ${'长'.repeat(21)}  `
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc, active: true }] })
    await openSelect(wrapper, 0)
    hover(optionRow(clientPopper(), `C1（${'长'.repeat(20)}...）`))
    await settleTooltip()
    expect(tooltipEl()!.textContent).toBe('长'.repeat(21))
    wrapper.unmount()
  })

  it('纯空白候选描述不产生 Tooltip（trim 后为空）', async () => {
    const wrapper = await mountTtBar({ clients: [{ id: 'C1', desc: '   ', active: true }] })
    await openSelect(wrapper, 0)
    hover(optionRow(clientPopper(), 'C1'))
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('幽灵项即使标签碰撞也不产生错误映射：原始 ID 不在候选内 → 无 Tooltip', async () => {
    const wrapper = await mountTtBar({ clients: [{ id: COL_ID_A, desc: COL_DESC_A, active: true }] })
    await openSelect(wrapper, 0)
    clientRows()[1]!.click()
    await nextTick()
    await nextTick()
    await wrapper.setProps({ clients: [] })
    await nextTick()
    await openSelect(wrapper, 0)
    const ghost = clientRows().find((it) => it.textContent?.includes('不在候选内'))!
    expect(ghost.getAttribute('data-dss-client-id')).toBe(COL_ID_A)
    hover(ghost)
    await settleTooltip()
    expect(tooltipEl()).toBeNull()
    wrapper.unmount()
  })

  it('hover 全程不发送请求：碰撞候选与已选项悬停/移出 0 次 query 事件', async () => {
    const wrapper = await mountTtBar({ clients: COLLIDING_CLIENTS })
    await openSelect(wrapper, 0)
    const rows = clientRows()
    hover(rows[1]!)
    await settleTooltip()
    unhover(rows[1]!)
    await settleTooltip()
    hover(rows[2]!)
    await settleTooltip()
    unhover(rows[2]!)
    await settleTooltip()
    expect(wrapper.emitted('query')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar 查询控件外部几何锁（DSS-REQ-084，AC-096/097/103）', () => {
  it('源码字面量契约：三个下拉框锁定 width/min-width/max-width/flex-basis 为 240/300/200', () => {
    const src = queryBarSource()
    for (const [cls, w] of [
      ['dss-client-select', 240],
      ['dss-source-select', 300],
      ['dss-status-select', 200],
    ] as const) {
      // 既有 width 契约保持不变
      expect(src).toMatch(new RegExp(`\\.${cls}\\s*\\{\\s*width:\\s*${w}px;\\s*\\}`, 's'))
      // 本轮新增外部几何锁
      expect(src).toMatch(
        new RegExp(`\\.${cls}\\s*\\{\\s*min-width:\\s*${w}px;\\s*max-width:\\s*${w}px;\\s*flex:\\s*0 0 ${w}px;\\s*\\}`, 's'),
      )
    }
  })

  it('源码字面量契约：内部可收缩区域显式 min-width: 0（三个下拉框的 selection）', () => {
    const src = queryBarSource()
    const block = src.match(
      /\.dss-client-select :deep\(\.el-select__selection\),[\s\S]*?\.dss-status-select :deep\(\.el-select__selection\)\s*\{[^}]*\}/,
    )?.[0]
    expect(block).toBeTruthy()
    expect(block).toMatch(/min-width:\s*0/)
  })

  it('不使用 JS 尺寸监听、不按内容长度动态改宽度（不靠脚本维持稳定）', () => {
    const src = queryBarSource()
    expect(src).not.toMatch(/ResizeObserver/)
    expect(src).not.toMatch(/window\.addEventListener\(\s*['"]resize/)
    expect(src).not.toMatch(/style\.width\s*=/)
    expect(src).not.toMatch(/offsetWidth\s*[=+]/)
  })

  it('三个控件保留 Feature 专属 popper-class，不引入全局 Element Plus 覆写', () => {
    const src = queryBarSource()
    expect(src).toContain('popper-class="dss-client-popper"')
    expect(src).toContain('popper-class="dss-source-popper"')
    expect(src).toContain('popper-class="dss-status-popper"')
    // 非 scoped 样式块中不得出现裸 .el-select / .el-select__wrapper 覆写（必须挂在本 Feature 命名空间下）
    expect(src).not.toMatch(/^\s*\.el-select\s*\{/m)
    expect(src).not.toMatch(/^\s*\.el-select__wrapper/m)
  })

  it('文本兜底仍在：三个控件的 tags-text 保留 text-overflow:ellipsis 作为最后保护（DSS-REQ-084④）', () => {
    const src = queryBarSource()
    const block = src.match(
      /\.dss-client-select :deep\(\.el-select__tags-text\),[\s\S]*?\.dss-status-select :deep\(\.el-select__tags-text\)\s*\{[^}]*\}/,
    )?.[0]
    expect(block).toBeTruthy()
    expect(block).toMatch(/text-overflow:\s*ellipsis/)
  })

  it('Tooltip 安全最大宽度契约：min(480px, calc(100vw - 16px)) 且自然换行、不可交互、fixed 定位', () => {
    const src = queryBarSource()
    const block = src.match(/\.dss-q-tt\s*\{[^}]*\}/s)?.[0]
    expect(block).toBeTruthy()
    expect(block).toMatch(/max-width:\s*min\(480px,\s*calc\(100vw - 16px\)\)/)
    expect(block).toMatch(/position:\s*fixed/)
    expect(block).toMatch(/pointer-events:\s*none/)
    expect(block).toMatch(/overflow-wrap:\s*anywhere/)
  })

  it('内容长度不同不改变 query 草稿语义：三个字段的“全部”默认态仍为 ALL_OPTION', async () => {
    const wrapper = await mountBar()
    expect(wrapper.findAll('.dss-client-select')).toHaveLength(1)
    await queryButton(wrapper).trigger('click')
    const draft = wrapper.emitted('query')![0]![0] as { clients: string[]; sources: string[]; statuses: string[] }
    expect(draft).toEqual({ clients: [ALL_OPTION], sources: [ALL_OPTION], statuses: [ALL_OPTION] })
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotQueryBar R1 稳定身份实现约束（R1 §6.2）', () => {
  it('源码不再以显示文字反查探针身份（无按标签等值匹配、无 textContent 反查）', () => {
    const src = queryBarSource()
    expect(src).not.toMatch(/matchClientByLabel/)
    expect(src).not.toContain('textContent')
    // 不引入全局 Element Plus DOM 猜测
    expect(src).not.toMatch(/document\.querySelector\(\s*['"]\.el-select/)
  })

  it('私有身份属性只落在探针端下拉；源库/快照状态下拉一律不携带（不跨字段污染）', async () => {
    const wrapper = await mountBar()
    await openSelect(wrapper, 1)
    expect(sourcePopper().querySelectorAll('[data-dss-client-id]')).toHaveLength(0)
    await openSelect(wrapper, 2)
    expect(popperByClass('dss-status-popper').querySelectorAll('[data-dss-client-id]')).toHaveLength(0)
    wrapper.unmount()
  })
})
