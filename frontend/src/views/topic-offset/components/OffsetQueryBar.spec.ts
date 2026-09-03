import { describe, it, expect } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ElementPlus from 'element-plus'
import OffsetQueryBar from './OffsetQueryBar.vue'
import { ALL_OPTION } from '@/views/topic-offset/utils/selection'
import type { AppliedCriteria, ClientCandidate, DataSourceCandidate } from '@/types/topicOffset'

const CLIENTS: ClientCandidate[] = [
  { id: 'CL1', desc: '客户端一', active: true },
  { id: 'CL2', desc: null, active: false },
]
const SOURCES: DataSourceCandidate[] = [{ id: 'DS1', org: '源库A', active: true }]
const TARGETS: DataSourceCandidate[] = [{ id: 'DS2', org: '目标库A', active: true }]

async function mountBar(initial: AppliedCriteria | null = null) {
  const wrapper = mount(OffsetQueryBar, {
    props: {
      clients: CLIENTS,
      sources: SOURCES,
      targets: TARGETS,
      initial,
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

describe('OffsetQueryBar 查询区“全部”互斥与查询/重置（TOFF-REQ-024/025/034/035/036/037）', () => {
  it('默认（无已生效条件）三个维度均为“全部”，点击查询发出 __ALL__ 哨兵草稿', async () => {
    const wrapper = await mountBar()
    await queryButton(wrapper).trigger('click')

    const emitted = wrapper.emitted('query')!
    expect(emitted).toHaveLength(1)
    expect(emitted[0][0]).toEqual({
      clients: [ALL_OPTION],
      sources: [ALL_OPTION],
      targets: [ALL_OPTION],
      tableName: '',
    })
    wrapper.unmount()
  })

  it('“全部”固定为每个维度下拉第一项', async () => {
    const wrapper = await mountBar()
    await openSelect(wrapper, 0)
    const dropdown = dropdownByText('CL1（客户端一）')
    const items = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item'))
    expect(items[0]?.textContent?.trim()).toBe('全部')
    wrapper.unmount()
  })

  it('选择具体客户端自动取消“全部”，查询草稿只含具体 ID', async () => {
    const wrapper = await mountBar()
    await openSelect(wrapper, 0)
    const dropdown = dropdownByText('CL1（客户端一）')
    await clickOption(dropdown, 'CL1（客户端一）')

    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect(emitted[0][0]).toEqual({
      clients: ['CL1'],
      sources: [ALL_OPTION],
      targets: [ALL_OPTION],
      tableName: '',
    })
    wrapper.unmount()
  })

  it('表名原样进入草稿（去空格在提交阶段完成，不在本组件）', async () => {
    const wrapper = await mountBar()
    const input = wrapper.find('input[placeholder="请输入表名"]')
    await input.setValue('  orders ')
    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect((emitted[0][0] as { tableName: string }).tableName).toBe('  orders ')
    wrapper.unmount()
  })

  it('重置只把草稿恢复默认、不查询（TOFF-REQ-037）', async () => {
    const wrapper = await mountBar()
    await openSelect(wrapper, 0)
    await clickOption(dropdownByText('CL1（客户端一）'), 'CL1（客户端一）')
    expect(wrapper.emitted('query')).toBeUndefined()

    await resetButton(wrapper).trigger('click')
    expect(wrapper.emitted('query')).toBeUndefined()

    // 重置后再查询 → 恢复为三“全部”草稿
    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect(emitted[0][0]).toEqual({
      clients: [ALL_OPTION],
      sources: [ALL_OPTION],
      targets: [ALL_OPTION],
      tableName: '',
    })
    wrapper.unmount()
  })

  it('恢复：已有生效条件回填为具体 ID 而非“全部”（TOFF-REQ-099/100）', async () => {
    const wrapper = await mountBar({
      clientIds: ['CL1', 'CL2'],
      sourceIds: ['DS1'],
      targetIds: [],
      tableName: 'orders',
    })
    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    expect(emitted[0][0]).toEqual({
      clients: ['CL1', 'CL2'],
      sources: ['DS1'],
      targets: [ALL_OPTION],
      tableName: 'orders',
    })
    wrapper.unmount()
  })
})

describe('OffsetQueryBar 查询区固定名称始终可见（R2 §4.1）', () => {
  it('渲染 客户端/源库/目标库/表名 四个固定名称，不以 placeholder/选中值代替', async () => {
    const wrapper = await mountBar()
    const labels = wrapper.findAll('.toff-q-label').map((el) => el.text().trim())
    expect(labels).toEqual(['客户端', '源库', '目标库', '表名'])
    // 表名输入框 placeholder 为“请输入表名”，名称由独立标签承担
    expect(wrapper.find('input[placeholder="请输入表名"]').exists()).toBe(true)
    // 名称与四个查询控件一一对应、始终可见，不存在“全部”代替字段名的情形
    expect(wrapper.findAll('.toff-q-label')).toHaveLength(4)
    expect(wrapper.findAll('.el-select')).toHaveLength(3)
    wrapper.unmount()
  })

  it('固定名称与默认“全部”同时存在，互不混淆', async () => {
    const wrapper = await mountBar()
    const text = wrapper.text()
    expect(text).toContain('客户端')
    expect(text).toContain('源库')
    expect(text).toContain('目标库')
    expect(text).toContain('表名')
    // 未选择时每个下拉 placeholder 仍为“全部”（查询语义不变）
    await queryButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('query')!
    const payload = emitted[0][0] as { clients: string[]; sources: string[]; targets: string[] }
    expect(payload.clients).toEqual([ALL_OPTION])
    expect(payload.sources).toEqual([ALL_OPTION])
    expect(payload.targets).toEqual([ALL_OPTION])
    wrapper.unmount()
  })
})

describe('OffsetQueryBar 客户端候选省略与悬浮完整内容（TOFF-REQ-041/047，R1 §4.5）', () => {
  const LONG = `客户端描述-${'很长很长很长'.repeat(40)}`

  it('长描述候选项省略且悬浮 title 携带完整标签', async () => {
    const wrapper = mount(OffsetQueryBar, {
      props: { clients: [{ id: 'CLX', desc: LONG, active: true }], sources: [], targets: [], initial: null },
      global: { plugins: [ElementPlus] },
    })
    await flushPromises()
    await openSelect(wrapper, 0)
    const dropdown = dropdownByText('CLX')
    const item = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item')).find((it) =>
      it.textContent?.includes('CLX'),
    )!
    expect(item).toBeTruthy()
    const opt = item.querySelector('.toff-opt')
    expect(opt?.getAttribute('title')).toBe(`CLX（${LONG}）`)
    // DOM 文本仍为完整标签（省略仅视觉），悬浮可查看完整客户端描述
    expect(item.textContent).toContain(LONG)
    wrapper.unmount()
  })

  it('空描述候选只显示 ID、停用仍带标记、空括号不回归', async () => {
    const wrapper = mount(OffsetQueryBar, {
      props: {
        clients: [
          { id: 'ND', desc: null, active: true },
          { id: 'OFF', desc: null, active: false },
        ],
        sources: [],
        targets: [],
        initial: null,
      },
      global: { plugins: [ElementPlus] },
    })
    await flushPromises()
    await openSelect(wrapper, 0)
    const dropdown = dropdownByText('ND')
    const items = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item')) as HTMLElement[]
    const nd = items.find((it) => it.textContent?.trim() === 'ND')
    expect(nd).toBeTruthy()
    expect(nd!.querySelector('.toff-opt')?.getAttribute('title')).toBe('ND')
    const off = items.find((it) => it.textContent?.trim() === 'OFF（已停用）')
    expect(off).toBeTruthy()
    // 不应出现空括号占位（如 ID（））
    expect(items.some((it) => it.textContent?.includes('（）'))).toBe(false)
    wrapper.unmount()
  })

  it('配置不存在临时项保留并悬浮完整', async () => {
    const wrapper = mount(OffsetQueryBar, {
      props: {
        clients: [{ id: 'CL1', desc: '客户端一', active: true }],
        sources: [],
        targets: [],
        initial: { clientIds: ['gone'], sourceIds: [], targetIds: [], tableName: '' },
      },
      global: { plugins: [ElementPlus] },
    })
    await flushPromises()
    await openSelect(wrapper, 0)
    const dropdown = dropdownByText('gone（配置不存在）')
    const item = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item')).find((it) =>
      it.textContent?.includes('gone（配置不存在）'),
    )!
    expect(item.querySelector('.toff-opt')?.getAttribute('title')).toBe('gone（配置不存在）')
    wrapper.unmount()
  })
})
