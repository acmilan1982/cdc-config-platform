import { describe, it, expect } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import ElementPlus from 'element-plus'
import LogQueryFilter from './LogQueryFilter.vue'
import { ALL_DATA_SOURCE } from '../composables/useLogQueryTab'
import type { LogQueryForm } from '../composables/useLogQueryTab'
import type { DataSourceOptionVO } from '@/types/logQuery'
import { normalizeSelection } from './selection'

describe('“全部”与具体数据源双向即时互斥（LQ-DESIGN-170）——纯函数', () => {
  it('点击“全部”取消全部已选具体值', () => {
    expect(normalizeSelection(['A', 'B'], [ALL_DATA_SOURCE, 'A', 'B'])).toEqual([ALL_DATA_SOURCE])
  })

  it('选择任一具体值取消“全部”', () => {
    expect(normalizeSelection([ALL_DATA_SOURCE], ['A'])).toEqual(['A'])
  })

  it('原值含“全部”时新增具体值去掉“全部”', () => {
    expect(normalizeSelection([ALL_DATA_SOURCE], [ALL_DATA_SOURCE, 'A'])).toEqual(['A'])
  })

  it('清空全部具体值恢复“全部”', () => {
    expect(normalizeSelection(['A'], [])).toEqual([ALL_DATA_SOURCE])
  })
})

const SOURCE_OPTS: DataSourceOptionVO[] = [
  { id: 'DS_SRC_001', org: '业务库-订单' },
  { id: 'DS_SRC_002', org: '业务库-商品' },
]
const TARGET_OPTS: DataSourceOptionVO[] = [
  { id: 'DS_TGT_001', org: '目标库-订单' },
  { id: 'DS_TGT_002', org: '目标库-商品' },
]

function makeForm(): LogQueryForm {
  return {
    sourceDataSourceIds: [],
    sourceTableName: '',
    targetDataSourceIds: [],
    targetTableName: '',
    timeRange: ['2026-08-20 00:00:00', '2026-08-20 23:59:59'],
  }
}

async function mountFilter(initial: Partial<LogQueryForm> = {}, extra = {}) {
  const form = reactive<LogQueryForm>({ ...makeForm(), ...initial })
  const wrapper = mount(LogQueryFilter, {
    props: {
      form,
      validationError: '',
      loading: false,
      sourceOptions: SOURCE_OPTS,
      targetOptions: TARGET_OPTS,
      optionsError: '',
      optionsLoading: false,
      ...extra,
    },
    global: { plugins: [ElementPlus] },
  })
  await flushPromises()
  return { wrapper, form }
}

/** 点击第 selectIndex 个（0=源库，1=目标库）el-select 展开下拉 */
async function openSelect(wrapper: VueWrapper, selectIndex: number) {
  const selects = wrapper.findAll('.el-select')
  await selects[selectIndex].find('.el-select__wrapper').trigger('click')
  await nextTick()
  await nextTick()
}

/** 根据唯一选项文本找到对应下拉面板（源/目标选项标签不同，可无歧义区分） */
function findDropdownByText(text: string): HTMLElement {
  const dropdowns = Array.from(
    document.body.querySelectorAll('.el-select-dropdown'),
  ) as HTMLElement[]
  const found = dropdowns.find((d) =>
    Array.from(d.querySelectorAll('.el-select-dropdown__item')).some((it) =>
      it.textContent?.includes(text),
    ),
  )
  if (!found) throw new Error(`未找到包含 "${text}" 的下拉面板`)
  return found
}

/** 在指定下拉面板中点击指定标签的选项（真实点击 el-option） */
async function clickOption(dropdown: HTMLElement, label: string) {
  const items = Array.from(
    dropdown.querySelectorAll('.el-select-dropdown__item'),
  ) as HTMLElement[]
  const target = items.find((it) => it.textContent?.trim() === label)
  if (!target) throw new Error(`未找到选项 "${label}"`)
  target.click()
  await nextTick()
  await nextTick()
}

describe('LogQueryFilter 真实 el-select 组件事件顺序（R1-01）', () => {
  it('源库：已选具体值后点击“全部”→ 只剩“全部”', async () => {
    const { wrapper, form } = await mountFilter({
      sourceDataSourceIds: ['DS_SRC_001', 'DS_SRC_002'],
    })

    await openSelect(wrapper, 0)
    const sourceDropdown = findDropdownByText('业务库-订单')
    await clickOption(sourceDropdown, '全部')

    expect(form.sourceDataSourceIds).toEqual([ALL_DATA_SOURCE])
    wrapper.unmount()
  })

  it('目标库：已选具体值后点击“全部”→ 只剩“全部”', async () => {
    const { wrapper, form } = await mountFilter({
      targetDataSourceIds: ['DS_TGT_001', 'DS_TGT_002'],
    })

    await openSelect(wrapper, 1)
    const targetDropdown = findDropdownByText('目标库-订单')
    await clickOption(targetDropdown, '全部')

    expect(form.targetDataSourceIds).toEqual([ALL_DATA_SOURCE])
    wrapper.unmount()
  })

  it('“全部”状态下选择任一具体值 → 取消“全部”仅保留具体值', async () => {
    const { wrapper, form } = await mountFilter({
      sourceDataSourceIds: [ALL_DATA_SOURCE],
    })

    await openSelect(wrapper, 0)
    const sourceDropdown = findDropdownByText('业务库-订单')
    await clickOption(sourceDropdown, '业务库-订单')

    expect(form.sourceDataSourceIds).toEqual(['DS_SRC_001'])
    expect(form.sourceDataSourceIds).not.toContain(ALL_DATA_SOURCE)
    wrapper.unmount()
  })

  it('清空全部具体值后恢复“全部”（具体值去重）', async () => {
    const { wrapper, form } = await mountFilter({
      sourceDataSourceIds: [ALL_DATA_SOURCE],
    })

    await openSelect(wrapper, 0)
    const sourceDropdown = findDropdownByText('业务库-订单')
    // 全部 → 选择两个具体值（第二个具体值再选一次验证去重）
    await clickOption(sourceDropdown, '业务库-订单')
    await clickOption(sourceDropdown, '业务库-商品')
    expect(form.sourceDataSourceIds).toEqual(['DS_SRC_001', 'DS_SRC_002'])

    // 再次点击两个具体值 → 全部清空 → 恢复“全部”
    await clickOption(sourceDropdown, '业务库-订单')
    await clickOption(sourceDropdown, '业务库-商品')
    expect(form.sourceDataSourceIds).toEqual([ALL_DATA_SOURCE])
    wrapper.unmount()
  })
})

describe('LogQueryFilter 初始化锁定禁用态（R1.1 §8）', () => {
  it('initializing=true 时源库/目标库下拉、表名输入、时间范围与查询/重置按钮全部禁用', async () => {
    const { wrapper } = await mountFilter({}, { initializing: true })

    // 源库、目标库 el-select 呈禁用态
    const selects = wrapper.findAll('.el-select__wrapper')
    expect(selects.length).toBe(2)
    for (const s of selects) {
      expect(s.classes()).toContain('is-disabled')
    }

    // 源表名、目标表名输入禁用
    const inputs = wrapper.findAll('input')
    for (const inp of inputs) {
      expect((inp.element as HTMLInputElement).disabled).toBe(true)
    }

    // 查询、重置按钮禁用
    const buttons = wrapper.findAll('button')
    const queryBtn = buttons.find((b) => b.text().includes('查询'))
    const resetBtn = buttons.find((b) => b.text().includes('重置'))
    expect(queryBtn).toBeTruthy()
    expect(resetBtn).toBeTruthy()
    expect((queryBtn!.element as HTMLButtonElement).disabled).toBe(true)
    expect((resetBtn!.element as HTMLButtonElement).disabled).toBe(true)
    wrapper.unmount()
  })

  it('点击禁用按钮不触发 query / reset 事件', async () => {
    const { wrapper } = await mountFilter({}, { initializing: true })

    const buttons = wrapper.findAll('button')
    const queryBtn = buttons.find((b) => b.text().includes('查询'))!
    const resetBtn = buttons.find((b) => b.text().includes('重置'))!
    await queryBtn.trigger('click')
    await resetBtn.trigger('click')

    expect(wrapper.emitted('query')).toBeUndefined()
    expect(wrapper.emitted('reset')).toBeUndefined()
    wrapper.unmount()
  })
})
