import { describe, it, expect } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
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

  it('busy（任一实际请求在途）时“查询”按钮禁用', async () => {
    const wrapper = await mountBar({ busy: true })
    const btn = queryButton(wrapper)
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
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
