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
    const input = wrapper.find('input[placeholder="表名"]')
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
