import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus'
import type { VueWrapper } from '@vue/test-utils'
import type { ApiResponse } from '@/types/monitor'
import type {
  SchemaListVO,
  SourceTableInput,
  SubscriptionCreateDTO,
  SubscriptionCreateVO,
  SubscriptionEditOpenVO,
  SubscriptionOptionsVO,
  SubscriptionUpdateDTO,
  TableListVO,
} from '@/types/subscription'

vi.mock('@/api/subscription', () => ({
  fetchSubscriptionEdit: vi.fn(),
  createSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  fetchSourceSchemas: vi.fn(),
  fetchSourceTables: vi.fn(),
  fetchSubscriptionList: vi.fn(),
  fetchSubscriptionOptions: vi.fn(),
  fetchSubscriptionDetail: vi.fn(),
  fetchSubscriptionDeletePreview: vi.fn(),
  deleteSubscription: vi.fn(),
}))

// 拖动模块打桩：验证弹窗打开时 enableDialogDrag 被调用（可拖行为由既有模块负责）。
vi.mock('@/views/data-source/draggableDialog', () => ({
  enableDialogDrag: vi.fn(() => ({ destroy: vi.fn() })),
}))

import {
  createSubscription,
  fetchSourceSchemas,
  fetchSourceTables,
  fetchSubscriptionEdit,
  updateSubscription,
} from '@/api/subscription'
import { enableDialogDrag } from '@/views/data-source/draggableDialog'
import SubscribeFormDialog from './SubscribeFormDialog.vue'

// R3 §4/§5：jsdom 不注入 SFC scoped 样式（vitest 默认 stub CSS），无法用 getComputedStyle 断言。
// 因此 R3 新增测试以“组件源码 scoped CSS 契约” + “稳定 class/DOM/交互” 双层验证；
// 具体视觉色值（白底、蓝边框、灰禁用）由真实浏览器复核补充。
const subscribeFormSource = readFileSync(join(process.cwd(), 'src/views/data-subscribe/components/SubscribeFormDialog.vue'), 'utf-8')
const scopedCss = subscribeFormSource.match(/<style scoped>([\s\S]*?)<\/style>/)?.[1] ?? ''

/** 提取指定选择器（例如 sf-target-card 或 sf-target-card.selected）在 scoped 样式中的声明块文本。 */
function scopedRule(selector: string): string {
  const re = new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`, 'g')
  const blocks: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(scopedCss)) !== null) blocks.push(m[1])
  return blocks.join('\n')
}

const mockedEdit = vi.mocked(fetchSubscriptionEdit)
const mockedCreate = vi.mocked(createSubscription)
const mockedUpdate = vi.mocked(updateSubscription)
const mockedSchemas = vi.mocked(fetchSourceSchemas)
const mockedTables = vi.mocked(fetchSourceTables)

const options: SubscriptionOptionsVO = {
  sources: [
    { dataSourceId: 'SRC-01', dataSourceOrg: '机构A' },
    { dataSourceId: 'S01', dataSourceOrg: '机构A' },
    { dataSourceId: 'BAD,SRC', dataSourceOrg: '机构X' },
  ],
  targets: [
    { dataSourceId: 'T01', dataSourceOrg: '机构B' },
    { dataSourceId: 'T02', dataSourceOrg: '机构C' },
    { dataSourceId: 'BAD.TGT', dataSourceOrg: '机构Y' },
  ],
}

function okSchemas(sourceId: string, schemas: string[]): ApiResponse<SchemaListVO> {
  return { code: 200, message: 'success', timestamp: '', data: { dataSourceId: sourceId, filterMode: 'ORACLE_MAINTAINED', schemas } }
}

function okTables(sourceId: string, schema: string, tables: string[]): ApiResponse<TableListVO> {
  return { code: 200, message: 'success', timestamp: '', data: { dataSourceId: sourceId, schema, tables } }
}

function editEcho(overrides: Partial<SubscriptionEditOpenVO> = {}): SubscriptionEditOpenVO {
  return {
    dataSubId: 'id1',
    dataSubDesc: '机构A到机构B全量订阅',
    source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' },
    targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' }],
    tablesBySchema: [
      { schema: 'SCHEMA_A', tables: ['T1', 'T2'] },
      { schema: 'SCHEMA_B', tables: ['T3'] },
    ],
    rawUnparseableTables: [],
    sourceReachable: true,
    sourceTableCheck: 'CHECKED',
    invalidTables: [],
    ...overrides,
  }
}

function buttonByText(w: VueWrapper, text: string) {
  return w.findAll('button').find((b) => b.text().includes(text)) ?? null
}

/** 弹窗底部操作按钮：取消/保存固定于 footer，避免误命中工具区“取消当前筛选”等按钮。 */
function footerButtonByText(w: VueWrapper, text: string) {
  return w
    .find('.el-dialog__footer')
    .findAll('button')
    .find((b) => b.text().includes(text)) ?? null
}

async function mountForm(mode: 'create' | 'edit', dataSubId: string | null = null) {
  const wrapper = mount(SubscribeFormDialog, {
    props: { modelValue: false, mode, dataSubId, options },
    attachTo: document.body,
    global: { plugins: [ElementPlus] },
  })
  // 真实用法：父组件 false→true 触发打开 watcher
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

/** 打开源库下拉；若给 filterText 则在过滤输入框中输入关键字。 */
async function pickSource(w: VueWrapper, optionText: string, filterText?: string) {
  await w.find('.sf-source-select .el-select__wrapper').trigger('click')
  await nextTick()
  if (filterText !== undefined) {
    await w.find('.sf-source-select input').setValue(filterText)
    await nextTick()
  }
  const visibleDropdowns = Array.from(document.body.querySelectorAll('.el-select-dropdown')).filter(
    (d) => !((d.parentElement?.getAttribute('style') || '').includes('display: none')),
  )
  const item = visibleDropdowns
    .flatMap((d) => Array.from(d.querySelectorAll('.el-select-dropdown__item')))
    .find((i) => i.textContent?.includes(optionText))
  await (item as HTMLElement).click()
  // 等待选中触发源库变更 → SourceTableSelector 加载 Schema/表全部完成
  await flushPromises()
}

async function clickSchema(w: VueWrapper, name: string) {
  const item = w.findAll('.st-schema-item').find((i) => i.text().includes(name))
  expect(item).toBeTruthy()
  await item!.trigger('click')
  await flushPromises()
}

async function clickTable(w: VueWrapper, tableName: string) {
  const item = w.findAll('.st-table-item').find((i) => i.text().includes(tableName))
  expect(item).toBeTruthy()
  // R2 §6：表行点击统一处理，复选框为受控展示。
  await item!.trigger('click')
  await nextTick()
}

async function clickTargetCard(w: VueWrapper, id: string) {
  const card = w.findAll('.sf-target-card').find((c) => c.text().includes(id))
  expect(card).toBeTruthy()
  const input = card!.find('input[type="checkbox"]')
  ;(input.element as HTMLInputElement).checked = !(input.element as HTMLInputElement).checked
  await input.trigger('change')
  await nextTick()
}

/** 编辑回显默认表格桩：SCHEMA_A/B 都返回各自表，便于多 Schema 预加载回显。 */
function stubEditTables() {
  mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A', 'SCHEMA_B']))
  mockedTables.mockImplementation((sourceId: string, schema: string) => {
    if (sourceId === 'S01' && schema === 'SCHEMA_A') return Promise.resolve(okTables('S01', 'SCHEMA_A', ['T1', 'T2']))
    if (sourceId === 'S01' && schema === 'SCHEMA_B') return Promise.resolve(okTables('S01', 'SCHEMA_B', ['T3']))
    return Promise.resolve(okTables(sourceId, schema, []))
  })
}

beforeEach(() => {
  mockedEdit.mockReset()
  mockedCreate.mockReset()
  mockedUpdate.mockReset()
  mockedSchemas.mockReset()
  mockedTables.mockReset()
  vi.mocked(enableDialogDrag).mockClear()
  mockedTables.mockResolvedValue(okTables('SRC-01', 'SCHEMA_A', []))
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('SubscribeFormDialog 新增表单', () => {
  it('弹窗结构：顶部表单、中间汇总、左侧 Schema、右侧表，无最右侧已选源表面板', async () => {
    const wrapper = await mountForm('create')
    expect(wrapper.text()).toContain('新增订阅')
    expect(wrapper.text()).toContain('订阅描述')
    expect(wrapper.text()).toContain('已选择：0 个源库 · 0 个 Schema · 0 个表 · 0 个目标库')
    // 源表选择器为左 Schema / 右表结构
    expect(wrapper.findAll('.st-schemas-pane').length).toBe(1)
    expect(wrapper.findAll('.st-tables-pane').length).toBe(1)
    // 不得存在最右侧独立“已选源表”面板（汇总仅一行）
    expect(wrapper.findAll('.sf-selected-panel, .sf-right-panel').length).toBe(0)
    wrapper.unmount()
  })

  it('新增必填校验：空表单保存不请求并逐项列出错误', async () => {
    const wrapper = await mountForm('create')
    await footerButtonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()
    expect(mockedCreate).not.toHaveBeenCalled()
    const text = wrapper.text()
    expect(text).toContain('订阅描述不能为空')
    expect(text).toContain('必须且只能选择一个源库')
    expect(text).toContain('必须至少选择一个目标库')
    expect(text).toContain('必须至少选择一张源表')
    wrapper.unmount()
  })

  it('新增填写完整保存成功：REPLACE、结构化源表、无并发令牌字段、发射 saved(true) 并关闭', async () => {
    mockedSchemas.mockResolvedValue(okSchemas('SRC-01', ['SCHEMA_A']))
    mockedTables.mockResolvedValue(okTables('SRC-01', 'SCHEMA_A', ['T1', 'T2']))
    mockedCreate.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: { dataSubId: 'new1' } })
    const successSpy = vi.spyOn(ElMessage, 'success').mockImplementation(() => undefined as never)
    const wrapper = await mountForm('create')

    await wrapper.find('.sf-desc-input input').setValue('新建订阅描述')
    await pickSource(wrapper, 'SRC-01')
    await clickTargetCard(wrapper, 'T01')
    await clickSchema(wrapper, 'SCHEMA_A')
    await clickTable(wrapper, 'T1')
    expect(wrapper.text()).toContain('已选择：1 个源库 · 1 个 Schema · 1 个表 · 1 个目标库')

    await footerButtonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()

    expect(mockedCreate).toHaveBeenCalledTimes(1)
    const payload = mockedCreate.mock.calls[0][0] as SubscriptionCreateDTO
    expect(payload.sourceSelectionMode).toBe('REPLACE')
    expect(payload.sourceTables).toEqual([{ schemaName: 'SCHEMA_A', tableName: 'T1' }])
    expect(payload.dataFromSourceId).toBe('SRC-01')
    expect(payload.dataToSourceIds).toEqual(['T01'])
    expect(payload.dataSubDesc).toBe('新建订阅描述')
    // 不存在并发令牌/指纹/行版本字段
    const keys = Object.keys(payload)
    expect(keys).not.toEqual(expect.arrayContaining(['versionToken', 'fingerprint', 'rowVersion', 'snapshotVersion']))
    expect(wrapper.emitted('saved')).toEqual([[true]])
    expect(wrapper.emitted('update:modelValue')![wrapper.emitted('update:modelValue')!.length - 1]).toEqual([false])
    wrapper.unmount()
  })

  it('保存失败（40300）逐项展示后端校验错误', async () => {
    mockedSchemas.mockResolvedValue(okSchemas('SRC-01', ['SCHEMA_A']))
    mockedTables.mockResolvedValue(okTables('SRC-01', 'SCHEMA_A', ['T1']))
    mockedCreate.mockResolvedValue({
      code: 40300,
      message: '校验失败',
      timestamp: '',
      data: {
        validationErrors: [{ errorCode: '40310', field: 'dataSubDesc', name: 'dataSubDesc', message: '后端：描述格式不正确' }],
      } as unknown as SubscriptionCreateVO,
    })
    const wrapper = await mountForm('create')
    await wrapper.find('.sf-desc-input input').setValue('描述')
    await pickSource(wrapper, 'SRC-01')
    await clickTargetCard(wrapper, 'T01')
    await clickSchema(wrapper, 'SCHEMA_A')
    await clickTable(wrapper, 'T1')

    await footerButtonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('存在 1 个校验失败项')
    expect(wrapper.text()).toContain('后端：描述格式不正确')
    expect(wrapper.emitted('saved')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('SubscribeFormDialog 源库搜索与目标卡片', () => {
  it('源库搜索：四级命中过滤、ID 与机构均高亮、无结果提示', async () => {
    const wrapper = await mountForm('create')
    await wrapper.find('.sf-source-select .el-select__wrapper').trigger('click')
    await nextTick()
    // 未过滤：全部候选展示
    const allItems = () =>
      Array.from(document.body.querySelectorAll('.el-select-dropdown'))
        .flatMap((d) => Array.from(d.querySelectorAll('.el-select-dropdown__item')))
    expect(allItems().some((i) => i.textContent?.includes('SRC-01'))).toBe(true)
    expect(allItems().some((i) => i.textContent?.includes('BAD,SRC'))).toBe(true)

    // 过滤 机构A：机构名命中（机构模糊），候选出现且高亮
    await wrapper.find('.sf-source-select input').setValue('机构A')
    await nextTick()
    expect(document.body.querySelectorAll('.sf-hl').length).toBeGreaterThan(0)

    // 过滤 SRC-01：命中 ID 前缀
    await wrapper.find('.sf-source-select input').setValue('SRC-01')
    await nextTick()
    const filtered = allItems().filter((i) => i.className.includes('el-select-dropdown__item') && i.textContent)
    const visibleFiltered = filtered.filter((i) => i.getAttribute('style') !== 'display: none')
    expect(visibleFiltered.some((i) => i.textContent?.includes('SRC-01'))).toBe(true)
    expect(visibleFiltered.some((i) => i.textContent?.includes('BAD,SRC'))).toBe(false)

    // 无结果
    await wrapper.find('.sf-source-select input').setValue('zzz不存在')
    await nextTick()
    expect(wrapper.text()).toContain('未找到匹配的源库')
    wrapper.unmount()
  })

  it('维护候选保留字符禁用并说明原因；正常候选项含 ID 与机构辅助文字', async () => {
    const wrapper = await mountForm('create')
    await wrapper.find('.sf-source-select .el-select__wrapper').trigger('click')
    await nextTick()
    const item = Array.from(document.body.querySelectorAll('.el-select-dropdown__item')).find((i) =>
      i.textContent?.includes('BAD,SRC'),
    ) as HTMLElement
    expect(item.className).toContain('is-disabled')
    expect(item.textContent).toContain('名称含协议保留字符，不能用于订阅配置')
    // 正常候选同时展示机构主文字与 ID 辅助文字
    const normal = Array.from(document.body.querySelectorAll('.el-select-dropdown__item')).find((i) =>
      i.textContent?.includes('SRC-01'),
    ) as HTMLElement
    expect(normal.textContent).toContain('机构A')
    expect(normal.querySelector('.sf-source-org')).toBeTruthy()
    expect(normal.querySelector('.sf-source-id')).toBeTruthy()
    // 点击禁用项不选中
    item.click()
    await nextTick()
    expect(wrapper.text()).toContain('已选择：0 个源库')
    wrapper.unmount()
  })

  it('目标卡片选中反馈与保留字符禁用；无重复右侧勾选图标', async () => {
    const wrapper = await mountForm('create')
    const cards = wrapper.findAll('.sf-target-card')
    expect(cards.length).toBe(3)
    // 每个卡片唯一的勾选控件为左侧复选框，不得存在右侧重复勾选图标
    expect(wrapper.findAll('.sf-target-check').length).toBe(0)

    await clickTargetCard(wrapper, 'T01')
    expect(wrapper.findAll('.sf-target-card.selected').length).toBe(1)
    expect(wrapper.text()).toContain('已选择：0 个源库 · 0 个 Schema · 0 个表 · 1 个目标库')
    await clickTargetCard(wrapper, 'T01')
    expect(wrapper.findAll('.sf-target-card.selected').length).toBe(0)

    const reserved = wrapper.findAll('.sf-target-card').find((c) => c.text().includes('BAD.TGT'))!
    expect(reserved.classes()).toContain('disabled')
    expect(reserved.attributes('title')).toContain('名称含协议保留字符')
    // 触发 change 也不选中
    const rInput = reserved.find('input[type="checkbox"]')
    ;(rInput.element as HTMLInputElement).checked = true
    await rInput.trigger('change')
    await nextTick()
    expect(wrapper.text()).toContain('已选择：0 个源库 · 0 个 Schema · 0 个表 · 0 个目标库')
    wrapper.unmount()
  })
})

describe('SubscribeFormDialog 布局（产品负责人批准）', () => {
  it('描述为单行输入框，不存在 textarea', async () => {
    const wrapper = await mountForm('create')
    expect(wrapper.findAll('textarea').length).toBe(0)
    const input = wrapper.find('.sf-desc-input input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('maxlength')).toBe('255')
    wrapper.unmount()
  })

  it('源库与目标库放在同一行（sf-top-row 内源库在前、目标库在后）', async () => {
    const wrapper = await mountForm('create')
    expect(wrapper.find('.sf-top-row').exists()).toBe(true)
    expect(wrapper.find('.sf-top-row .sf-source-item').exists()).toBe(true)
    expect(wrapper.find('.sf-top-row .sf-target-item').exists()).toBe(true)
    const topRow = wrapper.find('.sf-top-row')
    const sourceItem = topRow.find('.sf-source-item')
    const targetItem = topRow.find('.sf-target-item')
    expect(sourceItem.element.compareDocumentPosition(targetItem.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    wrapper.unmount()
  })

  it('弹窗固定头尾、中间内容区与源表区域为主要空间的关键结构', async () => {
    const wrapper = await mountForm('create')
    const dialog = wrapper.find('.subscribe-form-dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.find('.el-dialog__header').exists()).toBe(true)
    expect(dialog.find('.el-dialog__body').exists()).toBe(true)
    expect(dialog.find('.el-dialog__footer').exists()).toBe(true)
    // 中间区为纵向弹性布局，源表选择区占用主要剩余空间
    expect(wrapper.find('.sf-body').exists()).toBe(true)
    expect(wrapper.find('.sf-form').exists()).toBe(true)
    expect(wrapper.find('.sf-tables-item').exists()).toBe(true)
    expect(wrapper.find('.sf-tables-wrap').exists()).toBe(true)
    expect(wrapper.find('.sf-source-table-selector').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('SubscribeFormDialog 目标库两行紧凑卡片（R2 §5）', () => {
  it('目标卡片：机构名称与数据源 ID 各占一行（org 在 id 之前、各自独立元素），ID 悬停 title 可查看完整值', async () => {
    const wrapper = await mountForm('create')
    const cards = wrapper.findAll('.sf-target-card')
    expect(cards.length).toBe(3)
    for (const card of cards) {
      const org = card.find('.sf-target-org')
      const id = card.find('.sf-target-id')
      expect(org.exists()).toBe(true)
      expect(id.exists()).toBe(true)
      // 两行结构：org 元素在 id 元素之前（DOM 顺序）
      expect(org.element.compareDocumentPosition(id.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
    // 数据源 ID 过长可悬停查看完整值
    const first = options.targets[0]
    expect(cards[0].find('.sf-target-org').text()).toBe(first.dataSourceOrg)
    expect(cards[0].find('.sf-target-id').attributes('title')).toBe(first.dataSourceId)
    wrapper.unmount()
  })

  it('三张目标卡片在目标网格中作为同一批直接子级展示（同排布局结构不回退）', async () => {
    const wrapper = await mountForm('create')
    const grid = wrapper.find('.sf-target-grid')
    expect(grid.exists()).toBe(true)
    const cards = grid.findAll(':scope > .sf-target-card')
    expect(cards.length).toBe(3)
    // 不增加“查看更多”折叠控件，也不出现右侧重复勾选图标
    expect(wrapper.text()).not.toContain('查看更多')
    expect(wrapper.findAll('.sf-target-check, .sf-right-check').length).toBe(0)
    wrapper.unmount()
  })

  it('目标卡片选中态：仅左侧复选框为勾选控件，选中 class 保持', async () => {
    const wrapper = await mountForm('create')
    await clickTargetCard(wrapper, 'T01')
    expect(wrapper.findAll('.sf-target-card.selected').length).toBe(1)
    const selected = wrapper.findAll('.sf-target-card.selected')[0]
    expect(selected.findAll('input[type="checkbox"]').length).toBe(1)
    await clickTargetCard(wrapper, 'T01')
    expect(wrapper.findAll('.sf-target-card.selected').length).toBe(0)
    wrapper.unmount()
  })

  it('禁用候选仍灰显不可选择，且源库/目标库同行结构保持（R2 §5 不破坏 R1）', async () => {
    const wrapper = await mountForm('create')
    const reserved = wrapper.findAll('.sf-target-card').find((c) => c.text().includes('BAD.TGT'))!
    expect(reserved.classes()).toContain('disabled')
    const rInput = reserved.find('input[type="checkbox"]')
    ;(rInput.element as HTMLInputElement).checked = true
    await rInput.trigger('change')
    await nextTick()
    expect(wrapper.text()).toContain('已选择：0 个源库 · 0 个 Schema · 0 个表 · 0 个目标库')
    // 源库/目标库仍为同行结构
    expect(wrapper.find('.sf-top-row .sf-source-item').exists()).toBe(true)
    expect(wrapper.find('.sf-top-row .sf-target-item').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('SubscribeFormDialog 公共控制行对齐与目标卡片中性白色主体（R3 §4 §5）', () => {
  it('公共控制行采用 flex 垂直居中语义，不依赖负 margin/绝对定位（R3 §4）', () => {
    for (const sel of ['sf-top-row', 'sf-source-item', 'sf-target-item']) {
      const rule = scopedRule(sel)
      expect(rule).toMatch(/align-items:\s*center/)
      expect(rule).not.toMatch(/position:\s*absolute/)
      expect(rule).not.toMatch(/margin[^:]*:\s*-/)
    }
  })

  it('源库下拉框保持紧凑高度，未被强行拉高到目标库卡片高度（R3 §4）', () => {
    const srcRule = scopedRule('sf-source-select')
    expect(srcRule).toContain('width: 100%')
    expect(srcRule).not.toContain('height')
    // 目标库卡片自身高度仍为 48px，而源库选择框无对应强制高度
    expect(scopedRule('sf-target-card')).toContain('height: 48px')
  })

  it('未选中卡片主体为中性白色、浅灰边框（R3 §5）', () => {
    const rule = scopedRule('sf-target-card')
    expect(rule).toContain('background: #fff')
    expect(rule).toMatch(/border:\s*1px solid #dcdfe6/)
  })

  it('悬停态保持白色主体，仅边框转浅主题蓝（R3 §5）', () => {
    const hoverRule = scopedRule('sf-target-card:hover')
    expect(hoverRule).not.toContain('background')
    expect(hoverRule).toContain('border-color: var(--el-color-primary-light-5)')
  })

  it('选中态由主题边框与复选框表达，不存在大面积浅蓝整块背景（R3 §5）', async () => {
    const selRule = scopedRule('sf-target-card.selected')
    expect(selRule).toContain('background: #fff')
    expect(selRule).toContain('border-color: var(--el-color-primary)')
    expect(selRule).not.toContain('primary-light-9')
    expect(selRule).not.toContain('primary-light-8')
    // DOM：选中卡片内唯一勾选控件仍为左侧复选框
    const wrapper = await mountForm('create')
    await clickTargetCard(wrapper, 'T01')
    const selected = wrapper.findAll('.sf-target-card.selected')
    expect(selected.length).toBe(1)
    expect(selected[0].findAll('input[type="checkbox"]').length).toBe(1)
    wrapper.unmount()
  })

  it('禁用卡片浅灰主体、not-allowed，且不可选择（R3 §5）', async () => {
    const disRule = scopedRule('sf-target-card.disabled')
    expect(disRule).toContain('background: #f7f8fa')
    expect(disRule).toContain('cursor: not-allowed')
    const wrapper = await mountForm('create')
    const reserved = wrapper.findAll('.sf-target-card').find((c) => c.text().includes('BAD.TGT'))!
    expect(reserved.classes()).toContain('disabled')
    expect((reserved.find('input[type="checkbox"]').element as HTMLInputElement).disabled).toBe(true)
    // 强制 change 也不选中
    const rInput = reserved.find('input[type="checkbox"]')
    ;(rInput.element as HTMLInputElement).checked = true
    await rInput.trigger('change')
    await nextTick()
    expect(wrapper.text()).toContain('已选择：0 个源库 · 0 个 Schema · 0 个表 · 0 个目标库')
    wrapper.unmount()
  })
})

describe('SubscribeFormDialog 编辑回显与限制编辑', () => {
  it('编辑完整回显：描述/源库/目标库回填、多 Schema 预加载、已选表勾选', async () => {
    mockedEdit.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: editEcho() })
    stubEditTables()
    const wrapper = await mountForm('edit', 'id1')

    expect(mockedEdit).toHaveBeenCalledWith('id1')
    // 描述在单行 input 的 value 中
    expect((wrapper.find('.sf-desc-input input').element as HTMLInputElement).value).toBe('机构A到机构B全量订阅')
    // 已选表在源表选择器中勾选（预加载 SCHEMA_A 并回显）
    const selected = wrapper.findAll('.st-table-item.selected')
    expect(selected.length).toBe(2)
    expect(wrapper.text()).toContain('共 2 张，已选 2 张')
    expect(wrapper.text()).toContain('已选择：1 个源库 · 2 个 Schema · 3 个表 · 1 个目标库')
    wrapper.unmount()
  })

  it('源库断连有限编辑：提示 banner、源库与源表禁用、保存为 PRESERVE 不带源表', async () => {
    mockedEdit.mockResolvedValue({
      code: 200,
      message: 'success',
      timestamp: '',
      data: editEcho({ sourceReachable: false, sourceTableCheck: 'UNREACHABLE' }),
    })
    stubEditTables()
    mockedUpdate.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: null })
    const wrapper = await mountForm('edit', 'id1')

    expect(wrapper.text()).toContain('当前使用已保存源表配置，源库暂不可连接')
    const sourceSelect = wrapper.find('.sf-source-select')
    expect((sourceSelect.find('input').element as HTMLInputElement).disabled).toBe(true)
    expect(wrapper.find('.source-table-selector').classes()).toContain('disabled')

    // 仅改描述后保存 → PRESERVE，不带 sourceTables
    await wrapper.find('.sf-desc-input input').setValue('仅改描述')
    await footerButtonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()
    const payload = mockedUpdate.mock.calls[0][1] as SubscriptionUpdateDTO
    expect(payload.sourceSelectionMode).toBe('PRESERVE')
    expect(payload.sourceTables).toBeUndefined()
    expect(payload.dataSubDesc).toBe('仅改描述')
    wrapper.unmount()
  })

  it('有限编辑允许修改正常目标库（新增目标后仍可保存）', async () => {
    mockedEdit.mockResolvedValue({
      code: 200,
      message: 'success',
      timestamp: '',
      data: editEcho({ sourceReachable: false, sourceTableCheck: 'UNREACHABLE' }),
    })
    stubEditTables()
    mockedUpdate.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: null })
    const wrapper = await mountForm('edit', 'id1')

    await clickTargetCard(wrapper, 'T02')
    await footerButtonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()
    const payload = mockedUpdate.mock.calls[0][1] as SubscriptionUpdateDTO
    expect(payload.dataToSourceIds).toEqual(['T01', 'T02'])
    expect(payload.sourceSelectionMode).toBe('PRESERVE')
    wrapper.unmount()
  })

  it('异常源库禁止保存且不进入有限编辑；更换为正常源库后解除阻断', async () => {
    mockedEdit.mockResolvedValue({
      code: 200,
      message: 'success',
      timestamp: '',
      data: editEcho({
        source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'INACTIVE' },
        sourceReachable: false,
        sourceTableCheck: 'UNREACHABLE',
      }),
    })
    stubEditTables()
    mockedSchemas.mockResolvedValue(okSchemas('SRC-01', ['SRC_SCHEMA']))
    const wrapper = await mountForm('edit', 'id1')

    // 源库引用异常时不得进入有限编辑（源库下拉保持可换）
    expect(wrapper.text()).not.toContain('当前使用已保存源表配置')
    expect((wrapper.find('.sf-source-select input').element as HTMLInputElement).disabled).toBe(false)
    // 保存阻断并给出可操作提示
    expect(wrapper.text()).toContain('源库 机构A 已停用，请更换源库后保存')
    expect(footerButtonByText(wrapper, '保存')!.classes()).toContain('is-disabled')

    // 更换为正常源库后阻断解除，保存可用
    const confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as never)
    await pickSource(wrapper, 'SRC-01')
    await flushPromises()
    expect(wrapper.text()).not.toContain('请更换源库后保存')
    expect(footerButtonByText(wrapper, '保存')!.classes()).not.toContain('is-disabled')
    wrapper.unmount()
  })

  it('异常目标库即使不在启用候选列表也显式回显，并提供移除路径；移除后保存解除阻断', async () => {
    mockedEdit.mockResolvedValue({
      code: 200,
      message: 'success',
      timestamp: '',
      data: editEcho({
        targets: [
          { dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' },
          { dataSourceId: 'T99', dataSourceOrg: null, status: 'NOT_FOUND' },
        ],
      }),
    })
    stubEditTables()
    const wrapper = await mountForm('edit', 'id1')

    // 异常目标卡片显式回显（含“不存在”状态与“移除”按钮）
    expect(wrapper.text()).toContain('T99')
    expect(wrapper.text()).toContain('不存在')
    expect(wrapper.text()).toContain('存在异常目标库：目标库 T99（不存在），请移除后保存')
    expect(footerButtonByText(wrapper, '保存')!.classes()).toContain('is-disabled')

    // 点击移除后：T99 从目标集合移除，阻断解除
    const removeBtn = wrapper.findAll('button').find((b) => b.text().includes('移除'))!
    await removeBtn.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('已选择：1 个源库 · 2 个 Schema · 3 个表 · 1 个目标库')
    expect(wrapper.text()).not.toContain('请移除后保存')
    expect(footerButtonByText(wrapper, '保存')!.classes()).not.toContain('is-disabled')
    wrapper.unmount()
  })

  it('失效源表（invalidTables）阻断保存；移除异常已选表后解除并以 REPLACE 保存', async () => {
    mockedEdit.mockResolvedValue({
      code: 200,
      message: 'success',
      timestamp: '',
      data: editEcho({
        tablesBySchema: [{ schema: 'SCHEMA_A', tables: ['T1', 'T2', 'GONE'] }],
        invalidTables: ['SCHEMA_A.GONE'],
      }),
    })
    stubEditTables()
    mockedUpdate.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: null })
    const wrapper = await mountForm('edit', 'id1')

    expect(wrapper.text()).toContain('以下已选源表在当前源库中已不存在或不可访问')
    expect(wrapper.text()).toContain('SCHEMA_A.GONE')
    expect(footerButtonByText(wrapper, '保存')!.classes()).toContain('is-disabled')

    // 移除异常已选表：失效表从选中集合剔除，阻断解除
    await buttonByText(wrapper, '移除异常已选表')!.trigger('click')
    await nextTick()
    expect(wrapper.text()).not.toContain('已失效的已选源表')
    expect(wrapper.text()).toContain('已选择：1 个源库 · 1 个 Schema · 2 个表 · 1 个目标库')

    // 调整源表后以 REPLACE 保存
    await footerButtonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()
    const payload = mockedUpdate.mock.calls[0][1] as SubscriptionUpdateDTO
    expect(payload.sourceSelectionMode).toBe('REPLACE')
    expect(payload.sourceTables).toEqual([
      { schemaName: 'SCHEMA_A', tableName: 'T1' },
      { schemaName: 'SCHEMA_A', tableName: 'T2' },
    ])
    wrapper.unmount()
  })

  it('无法解析的源表片段阻断保存且无页面修复按钮（提示直接维护数据库）', async () => {
    mockedEdit.mockResolvedValue({
      code: 200,
      message: 'success',
      timestamp: '',
      data: editEcho({ rawUnparseableTables: ['LEGACY_FRAG'] }),
    })
    stubEditTables()
    mockedUpdate.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: null })
    const wrapper = await mountForm('edit', 'id1')

    expect(wrapper.text()).toContain('存在无法解析的源表片段')
    expect(wrapper.text()).toContain('直接维护数据库')
    // 无“移除/修复”按钮（不能静默丢弃），保存按钮禁用
    expect(wrapper.findAll('button').some((b) => b.text().includes('移除异常'))).toBe(false)
    expect(footerButtonByText(wrapper, '保存')!.classes()).toContain('is-disabled')
    wrapper.unmount()
  })
})

describe('SubscribeFormDialog 源库切换与脏关闭', () => {
  it('已选表时切换源库需确认：确认后清空表；取消保留原选择', async () => {
    // 按源库返回不同 Schema：切换后旧源库 Schema 不得残留
    mockedSchemas.mockImplementation((sourceId: string) => {
      if (sourceId === 'SRC-01') return Promise.resolve(okSchemas('SRC-01', ['SCHEMA_A']))
      if (sourceId === 'S01') return Promise.resolve(okSchemas('S01', ['S01_SCHEMA']))
      return Promise.resolve(okSchemas(sourceId, []))
    })
    mockedTables.mockResolvedValue(okTables('SRC-01', 'SCHEMA_A', ['T1']))
    const wrapper = await mountForm('create')
    await pickSource(wrapper, 'SRC-01')
    await clickSchema(wrapper, 'SCHEMA_A')
    await clickTable(wrapper, 'T1')
    expect(wrapper.text()).toContain('已选择：1 个源库 · 1 个 Schema · 1 个表 · 0 个目标库')

    // 取消切换：保留原源库与已选表（源库下拉折叠展示机构名，用计数与 Schema 断言）
    const confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockRejectedValue('cancel' as never)
    await pickSource(wrapper, 'S01')
    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper.text()).toContain('已选择：1 个源库 · 1 个 Schema · 1 个表')
    expect(wrapper.text()).toContain('SCHEMA_A')
    expect(wrapper.text()).not.toContain('S01_SCHEMA')

    // 确认切换：清空已选表并换源
    confirmSpy.mockResolvedValue('confirm' as never)
    await pickSource(wrapper, 'S01')
    await flushPromises()
    // 已确认切换到 S01：旧 Schema 清空、源表清空，源库计数为 1
    expect(wrapper.text()).not.toContain('SCHEMA_A')
    expect(wrapper.text()).toContain('S01_SCHEMA')
    expect(wrapper.text()).toContain('已选择：1 个源库 · 0 个 Schema · 0 个表 · 0 个目标库')
    wrapper.unmount()
  })

  it('未选表时切换源库直接切换不弹确认', async () => {
    const wrapper = await mountForm('create')
    const confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as never)
    await pickSource(wrapper, 'SRC-01')
    expect(confirmSpy).not.toHaveBeenCalled()
    // 源库下拉折叠展示机构名；用源库计数证明已选中
    expect(wrapper.text()).toContain('已选择：1 个源库 · 0 个 Schema · 0 个表 · 0 个目标库')
    wrapper.unmount()
  })

  it('脏表单关闭需二次确认；无修改直接关闭', async () => {
    const wrapper = await mountForm('create')
    const confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as never)

    // 无修改：直接关闭不弹确认
    await footerButtonByText(wrapper, '取消')!.trigger('click')
    await nextTick()
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')![wrapper.emitted('update:modelValue')!.length - 1]).toEqual([false])

    // 有修改：二次确认；确认后关闭，取消后保持打开
    const wrapper2 = await mountForm('create')
    await wrapper2.find('.sf-desc-input input').setValue('改动')
    confirmSpy.mockResolvedValue('confirm' as never)
    await buttonByText(wrapper2, '取消')!.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper2.emitted('update:modelValue')![wrapper2.emitted('update:modelValue')!.length - 1]).toEqual([false])

    const wrapper3 = await mountForm('create')
    await wrapper3.find('.sf-desc-input input').setValue('改动')
    confirmSpy.mockRejectedValue('cancel' as never)
    await buttonByText(wrapper3, '取消')!.trigger('click')
    await flushPromises()
    expect(wrapper3.emitted('update:modelValue')).toBeUndefined()
  })

  it('编辑仅修改目标库时关闭需未保存确认（R1 §3.1 弹窗集成）', async () => {
    mockedEdit.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: editEcho() })
    stubEditTables()
    const wrapper = await mountForm('edit', 'id1')
    const confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as never)

    // 只添加一个目标库，其余字段不动
    await clickTargetCard(wrapper, 'T02')
    await footerButtonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('SubscribeFormDialog 拖动与加载失败', () => {
  it('打开时绑定标题栏拖动（enableDialogDrag 被调用）', async () => {
    const wrapper = await mountForm('create')
    expect(vi.mocked(enableDialogDrag)).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(enableDialogDrag).mock.calls[0][0]
    expect(arg.classList.contains('subscribe-form-dialog')).toBe(true)
    wrapper.unmount()
  })

  it('编辑回显加载失败显示错误并可重试', async () => {
    mockedEdit.mockRejectedValueOnce(new Error('回显加载失败'))
    const wrapper = await mountForm('edit', 'id1')
    expect(wrapper.text()).toContain('回显加载失败')

    mockedEdit.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: editEcho() })
    stubEditTables()
    await buttonByText(wrapper, '重试')!.trigger('click')
    await flushPromises()
    expect((wrapper.find('.sf-desc-input input').element as HTMLInputElement).value).toBe('机构A到机构B全量订阅')
    wrapper.unmount()
  })
})
