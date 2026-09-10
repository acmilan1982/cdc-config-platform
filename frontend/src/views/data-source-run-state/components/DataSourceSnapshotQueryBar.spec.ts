import { describe, it, expect } from 'vitest'
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

async function mountBar(props: Record<string, unknown> = {}) {
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
