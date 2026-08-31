import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
  const input = item!.find('input[type="checkbox"]')
  ;(input.element as HTMLInputElement).checked = !(input.element as HTMLInputElement).checked
  await input.trigger('change')
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
    await buttonByText(wrapper, '保存')!.trigger('click')
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

    await wrapper.find('textarea').setValue('新建订阅描述')
    await pickSource(wrapper, 'SRC-01')
    await clickTargetCard(wrapper, 'T01')
    await clickSchema(wrapper, 'SCHEMA_A')
    await clickTable(wrapper, 'T1')
    expect(wrapper.text()).toContain('已选择：1 个源库 · 1 个 Schema · 1 个表 · 1 个目标库')

    await buttonByText(wrapper, '保存')!.trigger('click')
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
    await wrapper.find('textarea').setValue('描述')
    await pickSource(wrapper, 'SRC-01')
    await clickTargetCard(wrapper, 'T01')
    await clickSchema(wrapper, 'SCHEMA_A')
    await clickTable(wrapper, 'T1')

    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('存在 1 个校验失败项')
    expect(wrapper.text()).toContain('后端：描述格式不正确')
    expect(wrapper.emitted('saved')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('SubscribeFormDialog 源库搜索与目标卡片', () => {
  it('源库搜索：四级命中过滤、关键字高亮、无结果提示', async () => {
    const wrapper = await mountForm('create')
    await wrapper.find('.sf-source-select .el-select__wrapper').trigger('click')
    await nextTick()
    // 未过滤：全部候选展示
    const allItems = () =>
      Array.from(document.body.querySelectorAll('.el-select-dropdown'))
        .flatMap((d) => Array.from(d.querySelectorAll('.el-select-dropdown__item')))
    expect(allItems().some((i) => i.textContent?.includes('SRC-01'))).toBe(true)
    expect(allItems().some((i) => i.textContent?.includes('BAD,SRC'))).toBe(true)

    // 过滤 src：命中 ID 前缀（SRC-01/src2 同类，但此处只有 SRC-01）
    await wrapper.find('.sf-source-select input').setValue('SRC-01')
    await nextTick()
    const filtered = allItems().filter((i) => i.className.includes('el-select-dropdown__item') && i.textContent)
    const visibleFiltered = filtered.filter((i) => i.getAttribute('style') !== 'display: none')
    expect(visibleFiltered.some((i) => i.textContent?.includes('SRC-01'))).toBe(true)
    expect(visibleFiltered.some((i) => i.textContent?.includes('BAD,SRC'))).toBe(false)
    // 高亮片段渲染在下拉 teleport 到 body 的选项中
    expect(document.body.querySelectorAll('.sf-hl').length).toBeGreaterThan(0)

    // 无结果
    await wrapper.find('.sf-source-select input').setValue('zzz不存在')
    await nextTick()
    expect(wrapper.text()).toContain('未找到匹配的源库')
    wrapper.unmount()
  })

  it('维护候选保留字符禁用并说明原因', async () => {
    const wrapper = await mountForm('create')
    await wrapper.find('.sf-source-select .el-select__wrapper').trigger('click')
    await nextTick()
    const item = Array.from(document.body.querySelectorAll('.el-select-dropdown__item')).find((i) =>
      i.textContent?.includes('BAD,SRC'),
    ) as HTMLElement
    expect(item.className).toContain('is-disabled')
    expect(item.textContent).toContain('名称含协议保留字符，不能用于订阅配置')
    // 点击禁用项不选中
    item.click()
    await nextTick()
    expect(wrapper.text()).toContain('已选择：0 个源库')
    wrapper.unmount()
  })

  it('目标卡片选中反馈与保留字符禁用', async () => {
    const wrapper = await mountForm('create')
    const cards = wrapper.findAll('.sf-target-card')
    expect(cards.length).toBe(3)

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

describe('SubscribeFormDialog 编辑回显与限制编辑', () => {
  it('编辑完整回显：描述/源库/目标库回填、多 Schema 预加载、已选表勾选', async () => {
    mockedEdit.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: editEcho() })
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A', 'SCHEMA_B']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', ['T1', 'T2']))
    const wrapper = await mountForm('edit', 'id1')

    expect(mockedEdit).toHaveBeenCalledWith('id1')
    // 描述在 textarea 的 value 中（textContent 不含 textarea 值）
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('机构A到机构B全量订阅')
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
    mockedUpdate.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: null })
    const wrapper = await mountForm('edit', 'id1')

    expect(wrapper.text()).toContain('当前使用已保存源表配置，未完成源库实时校验')
    const sourceSelect = wrapper.find('.sf-source-select')
    expect((sourceSelect.find('input').element as HTMLInputElement).disabled).toBe(true)
    expect(wrapper.find('.source-table-selector').classes()).toContain('disabled')

    // 仅改描述后保存 → PRESERVE，不带 sourceTables
    await wrapper.find('textarea').setValue('仅改描述')
    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()
    const payload = mockedUpdate.mock.calls[0][1] as SubscriptionUpdateDTO
    expect(payload.sourceSelectionMode).toBe('PRESERVE')
    expect(payload.sourceTables).toBeUndefined()
    expect(payload.dataSubDesc).toBe('仅改描述')
    wrapper.unmount()
  })

  it('异常数据源/目标库提示更换；异常已选表不丢失', async () => {
    mockedEdit.mockResolvedValue({
      code: 200,
      message: 'success',
      timestamp: '',
      data: editEcho({
        source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'INACTIVE' },
        invalidTables: ['GONE_TABLE'],
      }),
    })
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A', 'SCHEMA_B']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', ['T1', 'T2']))
    const wrapper = await mountForm('edit', 'id1')

    expect(wrapper.text()).toContain('以下数据源已停用或不存在，保存前请更换：')
    // describeRef 对 INACTIVE 返回机构名
    expect(wrapper.text()).toContain('源库 机构A（已停用）')
    // 已不存在的已选源表被列出提示，但回显勾选不丢失
    expect(wrapper.text()).toContain('GONE_TABLE')
    const selected = wrapper.findAll('.st-table-item.selected')
    expect(selected.length).toBe(2)
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

    // 取消切换：保留原源库与已选表
    const confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockRejectedValue('cancel' as never)
    await pickSource(wrapper, 'S01')
    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper.text()).toContain('SRC-01')
    expect(wrapper.text()).toContain('已选择：1 个源库 · 1 个 Schema · 1 个表')

    // 确认切换：清空已选表并换源
    confirmSpy.mockResolvedValue('confirm' as never)
    await pickSource(wrapper, 'S01')
    await flushPromises()
    // 已确认切换到 S01：旧 Schema 清空、源表清空，源库计数为 1
    expect(wrapper.text()).not.toContain('SCHEMA_A')
    expect(wrapper.text()).toContain('已选择：1 个源库 · 0 个 Schema · 0 个表 · 0 个目标库')
    wrapper.unmount()
  })

  it('未选表时切换源库直接切换不弹确认', async () => {
    const wrapper = await mountForm('create')
    const confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as never)
    await pickSource(wrapper, 'SRC-01')
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('SRC-01')
    wrapper.unmount()
  })

  it('脏表单关闭需二次确认；无修改直接关闭', async () => {
    const wrapper = await mountForm('create')
    const confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as never)

    // 无修改：直接关闭不弹确认
    await buttonByText(wrapper, '取消')!.trigger('click')
    await nextTick()
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')![wrapper.emitted('update:modelValue')!.length - 1]).toEqual([false])

    // 有修改：二次确认；确认后关闭，取消后保持打开
    const wrapper2 = await mountForm('create')
    await wrapper2.find('textarea').setValue('改动')
    confirmSpy.mockResolvedValue('confirm' as never)
    await buttonByText(wrapper2, '取消')!.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper2.emitted('update:modelValue')![wrapper2.emitted('update:modelValue')!.length - 1]).toEqual([false])

    const wrapper3 = await mountForm('create')
    await wrapper3.find('textarea').setValue('改动')
    confirmSpy.mockRejectedValue('cancel' as never)
    await buttonByText(wrapper3, '取消')!.trigger('click')
    await flushPromises()
    expect(wrapper3.emitted('update:modelValue')).toBeUndefined()
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
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', ['T1']))
    await buttonByText(wrapper, '重试')!.trigger('click')
    await flushPromises()
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('机构A到机构B全量订阅')
    wrapper.unmount()
  })
})
