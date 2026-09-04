import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MockInstance } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus'
import type { ApiResponse } from '@/types/monitor'
import type { ClientListItemVO, ClientListVO, DataSourceOptionVO } from '@/types/clientConfig'

vi.mock('@/api/clientConfig', () => ({
  fetchClientList: vi.fn(),
  fetchDataSourceOptions: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
  enableClient: vi.fn(),
  disableClient: vi.fn(),
}))

import {
  createClient,
  deleteClient,
  disableClient,
  enableClient,
  fetchClientList,
  fetchDataSourceOptions,
  updateClient,
} from '@/api/clientConfig'
import ClientConfigPage from '@/views/client-config/ClientConfigPage.vue'

const mockedList = vi.mocked(fetchClientList)
const mockedOptions = vi.mocked(fetchDataSourceOptions)
const mockedCreate = vi.mocked(createClient)
const mockedUpdate = vi.mocked(updateClient)
const mockedDelete = vi.mocked(deleteClient)
const mockedEnable = vi.mocked(enableClient)
const mockedDisable = vi.mocked(disableClient)

// ------------------------------------------------------------------ fixtures

function view(
  dataSourceId: string,
  org: string | null,
  dataSourceName: string | null,
  anomalies: string[] = [],
  conflictClientIds: string[] = [],
) {
  return { dataSourceId, org, dataSourceName, anomalies, conflictClientIds }
}

function row(
  clientId: string,
  clientDesc: string | null,
  fgActive: string,
  dataSources: ReturnType<typeof view>[],
  extra?: Partial<ClientListItemVO>,
): ClientListItemVO {
  return {
    clientId,
    clientDesc,
    status: fgActive === '1' ? 'ENABLED' : fgActive === '0' ? 'DISABLED' : 'ABNORMAL',
    fgActive,
    dataSourceCount: dataSources.length,
    rawDataSourceIds: dataSources.map((d) => d.dataSourceId).join(','),
    possibleCommaDataSourceIds: [],
    rowAnomalies: [],
    dataSources,
    ...extra,
  }
}

const healthyDs = view('ds-ok1', '中心医院', 'HIS 主库')
const inactiveDs = view('ds-old', '停用机构', '旧库', ['INACTIVE'])
const enabledRow = row('probe-a', '中心探针', '1', [healthyDs, inactiveDs])

const disabledRow = row('probe-b', '停用探针', '0', [view('ds-b', 'B 机构', 'B 库')])
const nullDescRow = row('probe-null', null, '1', [])

const multiSources = [
  view('ds-n1', '机构N1', '名N1'),
  view('ds-n2', '机构N2', '名N2'),
  view('ds-ab', '机构Ab', '名Ab', ['NOT_FOUND']),
  view('ds-n3', '机构N3', '名N3'),
  view('ds-n4', '机构N4', '名N4'),
]
const multiRow = row('probe-multi', '多源探针', '1', multiSources)

const ambiguousRow = row(
  'probe-amb',
  '歧义探针',
  '1',
  [view('ds_a', null, null, ['NOT_FOUND']), view('legacy_b', null, null, ['NOT_FOUND'])],
  {
    possibleCommaDataSourceIds: ['ds_a,legacy_b'],
    rowAnomalies: ['COMMA_PROTOCOL_AMBIGUOUS'],
  },
)

const baseOptions: DataSourceOptionVO[] = [
  { dataSourceId: 'ds-ok1', org: '中心医院', dataSourceName: 'HIS 主库', selectable: true, notSelectableReason: null, occupiedByClientIds: [] },
  { dataSourceId: 'ds-new', org: '新建机构', dataSourceName: '新库', selectable: true, notSelectableReason: null, occupiedByClientIds: [] },
  { dataSourceId: 'ds,legacy', org: '含逗号机构', dataSourceName: '历史库', selectable: false, notSelectableReason: 'COMMA_IN_ID', occupiedByClientIds: [] },
  { dataSourceId: 'ds-occ', org: '分院', dataSourceName: '分院库', selectable: false, notSelectableReason: 'OCCUPIED', occupiedByClientIds: ['other-probe'] },
]

// ------------------------------------------------------------------ helpers

function okList(data: ClientListItemVO[]): ApiResponse<ClientListVO> {
  return { code: 200, message: 'success', timestamp: '', data: { items: data } }
}

function failList(code: number, message: string): ApiResponse<ClientListVO> {
  return { code, message, timestamp: '', data: { items: [] } }
}

function failOptions(code: number, message: string): ApiResponse<DataSourceOptionVO[]> {
  return { code, message, timestamp: '', data: [] }
}

function okOptions(data: DataSourceOptionVO[]): ApiResponse<DataSourceOptionVO[]> {
  return { code: 200, message: 'success', timestamp: '', data }
}

function okNull(): ApiResponse<null> {
  return { code: 200, message: 'success', timestamp: '', data: null }
}

async function mountPage(data: ClientListItemVO[] = [enabledRow, disabledRow]) {
  mockedList.mockResolvedValue(okList(data))
  const wrapper = mount(ClientConfigPage, {
    attachTo: document.body,
    global: { plugins: [ElementPlus] },
  })
  await flushPromises()
  return wrapper
}

type PageWrapper = Awaited<ReturnType<typeof mountPage>>

const exactButton = (w: PageWrapper, text: string) =>
  w.findAll('button').find((b) => b.text().trim() === text)

const optionByText = (w: PageWrapper, text: string) =>
  w.findAll('.cc-opt').find((o) => !o.attributes('disabled') && o.text().includes(text))

async function openCreate(w: PageWrapper) {
  await exactButton(w, '新增探针')!.trigger('click')
  await flushPromises()
}

async function openEdit(w: PageWrapper, rowData: ClientListItemVO) {
  w.findComponent({ name: 'ElTable' }).vm.$emit('row-dblclick', rowData)
  await flushPromises()
}

async function selectRow(w: PageWrapper, rowData: ClientListItemVO) {
  w.findComponent({ name: 'ElTable' }).vm.$emit('row-click', rowData)
  await nextTick()
}

let messageSpy: Record<string, MockInstance>
let confirmSpy: MockInstance

beforeEach(() => {
  vi.restoreAllMocks()
  messageSpy = {
    success: vi.spyOn(ElMessage, 'success').mockImplementation(() => undefined as never),
    warning: vi.spyOn(ElMessage, 'warning').mockImplementation(() => undefined as never),
    error: vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never),
  }
  confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as never)
  mockedList.mockResolvedValue(okList([enabledRow, disabledRow]))
  mockedOptions.mockResolvedValue(okOptions(baseOptions))
  mockedCreate.mockResolvedValue(okNull())
  mockedUpdate.mockResolvedValue(okNull())
  mockedDelete.mockResolvedValue(okNull())
  mockedEnable.mockResolvedValue(okNull())
  mockedDisable.mockResolvedValue(okNull())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('首次加载 / 查询 / 重置（CCFG-UI-002/003/012）', () => {
  it('首次进入自动查询一次，默认 keyword 空、status ALL，并渲染记录与提示', async () => {
    const wrapper = await mountPage([enabledRow, nullDescRow])
    expect(mockedList).toHaveBeenCalledTimes(1)
    expect(mockedList.mock.calls[0][0]).toEqual({ keyword: undefined, status: 'ALL' })
    expect(wrapper.text()).toContain('探针端管理')
    expect(wrapper.text()).toContain('probe-a')
    expect(wrapper.text()).toContain('probe-null')
    expect(wrapper.findComponent({ name: 'ElPagination' }).exists()).toBe(false)
    expect(wrapper.text()).toContain('双击记录可编辑')
    wrapper.unmount()
  })

  it('列表加载失败且从未成功时显示失败态与重试', async () => {
    mockedList.mockRejectedValueOnce(new Error('network'))
    const wrapper = mount(ClientConfigPage, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('列表加载失败')
    await exactButton(wrapper, '重新加载')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('点击查询提交当前关键词与状态并触发刷新', async () => {
    const wrapper = await mountPage()
    await wrapper.find('.cc-query-keyword input').setValue('  probe  ')
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(mockedList.mock.calls[1][0]).toEqual({ keyword: 'probe', status: 'ALL' })
    wrapper.unmount()
  })

  it('点击重置仅恢复默认表单条件，不触发查询', async () => {
    const wrapper = await mountPage()
    await wrapper.find('.cc-query-keyword input').setValue('probe')
    await exactButton(wrapper, '重置')!.trigger('click')
    await flushPromises()
    expect((wrapper.find('.cc-query-keyword input').element as HTMLInputElement).value).toBe('')
    expect(mockedList).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('无自动刷新轮询', async () => {
    const wrapper = await mountPage()
    await new Promise((r) => setTimeout(r, 60))
    expect(mockedList).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('行选择与删除（CCFG-UI-004/005/019）', () => {
  it('单击行单选并显示“已选择：探针ID”；删除按钮从禁用变为可用', async () => {
    const wrapper = await mountPage()
    expect(exactButton(wrapper, '删除所选')!.attributes('disabled')).toBeDefined()
    await selectRow(wrapper, enabledRow)
    expect(wrapper.text()).toContain('已选择：probe-a')
    expect(exactButton(wrapper, '删除所选')!.attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('删除所选：二次确认正文含探针 ID，成功后提示并清空选中', async () => {
    const wrapper = await mountPage()
    await selectRow(wrapper, enabledRow)
    await exactButton(wrapper, '删除所选')!.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy.mock.calls[0][0]).toContain('确定删除探针 probe-a 吗？该操作不可恢复。')
    expect(mockedDelete).toHaveBeenCalledWith('probe-a')
    expect(messageSpy.success).toHaveBeenCalledWith('删除成功')
    wrapper.unmount()
  })

  it('取消删除确认则不发请求', async () => {
    confirmSpy.mockRejectedValueOnce('cancel')
    const wrapper = await mountPage()
    await selectRow(wrapper, enabledRow)
    await exactButton(wrapper, '删除所选')!.trigger('click')
    await flushPromises()
    expect(mockedDelete).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('列表行内不提供编辑/删除按钮，仅表格外单一删除入口', async () => {
    const wrapper = await mountPage()
    const deleteButtons = wrapper.findAll('button').filter((b) => b.text().includes('删除'))
    expect(deleteButtons).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('启用/停用（CCFG-UI-006/018）', () => {
  it('停用状态行点击启用：无确认、直调 E6、成功提示“启用成功”', async () => {
    const wrapper = await mountPage([disabledRow])
    const op = wrapper.findAll('.cc-op').find((b) => b.text().includes('启用'))
    await op!.trigger('click')
    await flushPromises()
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(mockedEnable).toHaveBeenCalledWith('probe-b')
    expect(messageSpy.success).toHaveBeenCalledWith('启用成功')
    wrapper.unmount()
  })

  it('启用状态行点击停用：先二次确认再调 E7', async () => {
    const wrapper = await mountPage([enabledRow])
    const op = wrapper.findAll('.cc-op').find((b) => b.text().includes('停用'))
    await op!.trigger('click')
    await flushPromises()
    expect(confirmSpy.mock.calls[0][0]).toContain('确定停用探针 probe-a 吗？停用后该探针不再按启用状态命中。')
    expect(mockedDisable).toHaveBeenCalledWith('probe-a')
    expect(messageSpy.success).toHaveBeenCalledWith('停用成功')
    wrapper.unmount()
  })

  it('异常状态行不提供“启用”，仅提供“停用”', async () => {
    const abnormalRow = row('probe-x', '异常', 'x', [view('ds-x', 'X 机构', 'X 库')])
    const wrapper = await mountPage([abnormalRow])
    expect(wrapper.text()).toContain('异常（原始值=x）')
    expect(wrapper.findAll('.cc-op').some((b) => b.text().includes('启用'))).toBe(false)
    expect(wrapper.findAll('.cc-op').some((b) => b.text().includes('停用'))).toBe(true)
    wrapper.unmount()
  })
})

describe('新增弹窗与候选（CCFG-UI-013/016）', () => {
  it('新增弹窗字段固定三项、探针 ID 可编辑、标题“新增探针”', async () => {
    const wrapper = await mountPage()
    await openCreate(wrapper)
    expect(wrapper.find('.cc-dialog').text()).toContain('新增探针')
    expect(mockedOptions).toHaveBeenCalledWith(undefined)
    expect(wrapper.findAll('.cc-form-item')).toHaveLength(3)
    wrapper.unmount()
  })

  it('含英文逗号与已占用候选置灰并展示原因；选中健康候选进入已选区', async () => {
    const wrapper = await mountPage()
    await openCreate(wrapper)
    expect(wrapper.text()).toContain('ID 含英文逗号，不可选择')
    expect(wrapper.text()).toContain('已分配给：other-probe')
    const occ = wrapper.findAll('.cc-opt').find((o) => o.text().includes('已分配给：other-probe'))
    expect(occ!.attributes('disabled')).toBeDefined()

    await optionByText(wrapper, '中心医院')!.trigger('click')
    await nextTick()
    expect(wrapper.find('.cc-pane--chosen').text()).toContain('中心医院')
    expect(wrapper.text()).toContain('已选（1）')
    wrapper.unmount()
  })

  it('编辑弹窗以原探针 ID 作为 excludeClientId 拉取候选', async () => {
    const wrapper = await mountPage()
    await openEdit(wrapper, enabledRow)
    expect(mockedOptions).toHaveBeenCalledWith('probe-a')
    wrapper.unmount()
  })

  it('空数据源候选显示“无可选数据源”；候选加载失败显示失败提示', async () => {
    mockedOptions.mockResolvedValue(okOptions([]))
    const w1 = await mountPage()
    await openCreate(w1)
    expect(w1.text()).toContain('无可选数据源')
    w1.unmount()

    mockedOptions.mockResolvedValue(failOptions(500, '数据源候选加载失败'))
    const w2 = await mountPage()
    await openCreate(w2)
    expect(w2.text()).toContain('数据源候选加载失败，请稍后重试')
    w2.unmount()
  })
})

describe('自动生成（CCFG-UI-015）', () => {
  it('无已选数据源时点击自动生成严格无动作：不改描述、不提示', async () => {
    const wrapper = await mountPage()
    await openCreate(wrapper)
    const ta = wrapper.find('.cc-desc-row textarea')
    await ta.setValue('手工描述')
    await exactButton(wrapper, '自动生成')!.trigger('click')
    await nextTick()
    expect((ta.element as HTMLTextAreaElement).value).toBe('手工描述')
    expect(messageSpy.warning).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('有已选时按选择顺序用机构名称单逗号覆盖描述', async () => {
    const wrapper = await mountPage()
    await openCreate(wrapper)
    await optionByText(wrapper, '中心医院')!.trigger('click')
    await optionByText(wrapper, '新建机构')!.trigger('click')
    await exactButton(wrapper, '自动生成')!.trigger('click')
    await nextTick()
    const ta = wrapper.find('.cc-desc-row textarea')
    expect((ta.element as HTMLTextAreaElement).value).toBe('中心医院,新建机构')
    wrapper.unmount()
  })

  it('无机构名称时自动生成失败并保持原描述', async () => {
    const noOrgOptions: DataSourceOptionVO[] = [
      { dataSourceId: 'ds-noorg', org: '  ', dataSourceName: '无机构库', selectable: true, notSelectableReason: null, occupiedByClientIds: [] },
    ]
    mockedOptions.mockResolvedValue(okOptions(noOrgOptions))
    const wrapper = await mountPage()
    await openCreate(wrapper)
    const ta = wrapper.find('.cc-desc-row textarea')
    await ta.setValue('旧描述')
    await wrapper.findAll('.cc-opt').find((o) => o.text().includes('ds-noorg'))!.trigger('click')
    await nextTick()
    await exactButton(wrapper, '自动生成')!.trigger('click')
    await nextTick()
    expect((ta.element as HTMLTextAreaElement).value).toBe('旧描述')
    expect(messageSpy.warning).toHaveBeenCalledWith('数据源（ds-noorg）无机构名称，自动生成失败。')
    wrapper.unmount()
  })
})

describe('编辑弹窗与历史异常回显（CCFG-UI-014/017/025）', () => {
  it('双击行打开编辑：探针 ID 默认锁定，显式解锁后可改，取消修改恢复', async () => {
    const wrapper = await mountPage()
    await openEdit(wrapper, enabledRow)
    expect(wrapper.find('.cc-dialog').text()).toContain('编辑探针')
    const lockedInput = wrapper.find('.cc-id-control input[data-locked]')
    expect(lockedInput.exists()).toBe(true)
    await exactButton(wrapper, '修改探针 ID')!.trigger('click')
    await nextTick()
    const editable = wrapper.find('.cc-id-control input:not([data-locked])')
    expect(editable.exists()).toBe(true)
    await editable.setValue('PROBE-A2')
    await exactButton(wrapper, '取消修改')!.trigger('click')
    await nextTick()
    const after = wrapper.find('.cc-id-control input')
    expect((after.element as HTMLInputElement).value).toBe('probe-a')
    expect(after.attributes('data-locked')).toBeDefined()
    wrapper.unmount()
  })

  it('编辑回显历史异常数据源为红色并保留原 ID 与原因；移除异常项后恢复保存', async () => {
    const wrapper = await mountPage()
    await openEdit(wrapper, enabledRow)
    const chosen = wrapper.find('.cc-pane--chosen')
    expect(chosen.text()).toContain('ds-old（已停用）')
    const badChip = wrapper.findAll('.cc-chip--bad').find((c) => c.text().includes('ds-old'))
    expect(badChip).toBeTruthy()
    const saveBtn = exactButton(wrapper, '保存')!
    expect(saveBtn.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('存在异常数据源')

    // 移除异常项：点该 chip 的关闭图标
    await badChip!.find('.el-tag__close').trigger('click')
    await nextTick()
    expect(wrapper.find('.cc-pane--chosen').text()).not.toContain('ds-old')
    expect(exactButton(wrapper, '保存')!.attributes('disabled')).toBeUndefined()

    await exactButton(wrapper, '保存')!.trigger('click')
    await flushPromises()
    expect(mockedUpdate).toHaveBeenCalledWith('probe-a', {
      clientId: 'probe-a',
      clientDesc: '中心探针',
      dataSourceIds: ['ds-ok1'],
    })
    expect(messageSpy.success).toHaveBeenCalledWith('编辑成功')
    wrapper.unmount()
  })

  it('保存被阻断时不提交；编辑请求含仅三字段无状态/密码', async () => {
    const wrapper = await mountPage()
    await openEdit(wrapper, enabledRow)
    await exactButton(wrapper, '保存')!.trigger('click')
    await flushPromises()
    expect(mockedUpdate).not.toHaveBeenCalled()
    const body = {
      clientId: 'probe-a',
      clientDesc: '中心探针',
      dataSourceIds: ['ds-ok1', 'ds-old'],
    }
    expect(JSON.stringify(body)).not.toContain('fgActive')
    expect(JSON.stringify(body)).not.toContain('password')
    wrapper.unmount()
  })

  it('历史 NULL 描述：列表显示占位符 “—”，编辑弹窗回显为空输入框', async () => {
    const wrapper = await mountPage([nullDescRow])
    expect(wrapper.text()).toContain('—')
    await openEdit(wrapper, nullDescRow)
    const ta = wrapper.find('.cc-desc-row textarea')
    expect((ta.element as HTMLTextAreaElement).value).toBe('')
    wrapper.unmount()
  })
})

describe('数据源紧凑列投影与 +N（CCFG-UI-007~010）', () => {
  it('异常项优先投影前三项、其余 +N；完整清单按接口原顺序回显', async () => {
    const wrapper = await mountPage([multiRow])
    const tags = wrapper.findAll('.cc-dstag')
    expect(tags).toHaveLength(3)
    expect(tags[0].classes()).toContain('cc-dstag--bad')
    expect(wrapper.findAll('.cc-more')).toHaveLength(1)
    expect(wrapper.find('.cc-more').text()).toBe('+2')

    // 编辑回显：按接口原顺序（非异常优先投影）
    await openEdit(wrapper, multiRow)
    const chips = wrapper.findAll('.cc-chip')
    // 异常项 chip 文案为“数据源ID（原因）”，正常项为机构名；顺序保持接口原顺序
    const expectedChipTexts = ['机构N1', '机构N2', 'ds-ab（不存在）', '机构N3', '机构N4']
    expect(chips.map((c) => c.text())).toEqual(expectedChipTexts)
    wrapper.unmount()
  })
})

describe('行级含逗号歧义（CCFG-UI-026）', () => {
  it('歧义行显示红色歧义标识与原因，编辑保存被阻断直至清除歧义并选择合法候选', async () => {
    const wrapper = await mountPage([ambiguousRow])
    expect(wrapper.findAll('.cc-rowbad').some((t) => t.text().includes('含逗号歧义'))).toBe(true)
    expect(wrapper.text()).toContain('（展示）')

    await openEdit(wrapper, ambiguousRow)
    expect(exactButton(wrapper, '保存')!.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('原配置含英文逗号歧义')

    // 清除全部歧义展示项（每次移除后重新查询 chip），再选择合法候选
    while (wrapper.findAll('.cc-chip').length) {
      await wrapper.find('.cc-chip .el-tag__close').trigger('click')
      await nextTick()
    }
    await optionByText(wrapper, '中心医院')!.trigger('click')
    await nextTick()
    expect(exactButton(wrapper, '保存')!.attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('写操作防重复与状态提示（CCFG-UI-023）', () => {
  it('删除成功后刷新列表并清空选中', async () => {
    let call = 0
    mockedList.mockImplementation(async () => {
      call += 1
      if (call === 1) return okList([enabledRow])
      return okList([])
    })
    const wrapper = await mountPage()
    await selectRow(wrapper, enabledRow)
    await exactButton(wrapper, '删除所选')!.trigger('click')
    await flushPromises()
    expect(mockedDelete).toHaveBeenCalledTimes(1)
    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('已选择：')
    wrapper.unmount()
  })

  it('新增成功提示“新增成功”并调用 E3（body 无状态/无密码）', async () => {
    const wrapper = await mountPage()
    await openCreate(wrapper)
    await wrapper.find('.cc-id-control input').setValue('probe-new')
    await wrapper.find('.cc-desc-row textarea').setValue('新探针')
    await optionByText(wrapper, '中心医院')!.trigger('click')
    await nextTick()
    await exactButton(wrapper, '创建')!.trigger('click')
    await flushPromises()
    expect(mockedCreate).toHaveBeenCalledWith({
      clientId: 'probe-new',
      clientDesc: '新探针',
      dataSourceIds: ['ds-ok1'],
    })
    expect(messageSpy.success).toHaveBeenCalledWith('新增成功')
    wrapper.unmount()
  })
})

describe('写操作网络异常反馈与安全复位（R1-02）', () => {
  it('新增：网络异常时弹窗保持打开、输入/已选/描述保留、submitting 复位并提示', async () => {
    const wrapper = await mountPage()
    await openCreate(wrapper)
    await wrapper.find('.cc-id-control input').setValue('probe-new')
    await wrapper.find('.cc-desc-row textarea').setValue('新探针')
    await optionByText(wrapper, '中心医院')!.trigger('click')
    await nextTick()
    mockedCreate.mockRejectedValueOnce(new Error('network down'))
    await exactButton(wrapper, '创建')!.trigger('click')
    await flushPromises()
    expect(messageSpy.error).toHaveBeenCalledWith('新增失败，请检查网络后重试。')
    expect(messageSpy.success).not.toHaveBeenCalledWith('新增成功')
    expect(wrapper.find('.cc-dialog').text()).toContain('新增探针')
    expect((wrapper.find('.cc-id-control input').element as HTMLInputElement).value).toBe('probe-new')
    expect((wrapper.find('.cc-desc-row textarea').element as HTMLTextAreaElement).value).toBe('新探针')
    expect(wrapper.find('.cc-pane--chosen').text()).toContain('中心医院')
    expect(exactButton(wrapper, '创建')!.attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('编辑：网络异常时弹窗保持打开、原描述/已选保留、submitting 复位并提示', async () => {
    const wrapper = await mountPage([disabledRow])
    await openEdit(wrapper, disabledRow)
    expect(exactButton(wrapper, '保存')!.attributes('disabled')).toBeUndefined()
    mockedUpdate.mockRejectedValueOnce(new Error('network down'))
    await exactButton(wrapper, '保存')!.trigger('click')
    await flushPromises()
    expect(messageSpy.error).toHaveBeenCalledWith('编辑失败，请检查网络后重试。')
    expect(messageSpy.success).not.toHaveBeenCalledWith('编辑成功')
    expect(wrapper.find('.cc-dialog').text()).toContain('编辑探针')
    expect((wrapper.find('.cc-desc-row textarea').element as HTMLTextAreaElement).value).toBe('停用探针')
    expect(wrapper.find('.cc-pane--chosen').text()).toContain('B 机构')
    expect(exactButton(wrapper, '保存')!.attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('删除：网络异常时提示、当前选中行保持不变、busy 复位且不刷新', async () => {
    const wrapper = await mountPage()
    await selectRow(wrapper, enabledRow)
    mockedDelete.mockRejectedValueOnce(new Error('network down'))
    await exactButton(wrapper, '删除所选')!.trigger('click')
    await flushPromises()
    expect(messageSpy.error).toHaveBeenCalledWith('删除失败，请检查网络后重试。')
    expect(messageSpy.success).not.toHaveBeenCalledWith('删除成功')
    expect(wrapper.text()).toContain('已选择：probe-a')
    expect(mockedList).toHaveBeenCalledTimes(1)
    expect(exactButton(wrapper, '删除所选')!.attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('启用：网络异常时提示、busy 复位、保留当前列表', async () => {
    const wrapper = await mountPage([disabledRow])
    mockedEnable.mockRejectedValueOnce(new Error('network down'))
    const op = wrapper.findAll('.cc-op').find((b) => b.text().includes('启用'))!
    await op.trigger('click')
    await flushPromises()
    expect(messageSpy.error).toHaveBeenCalledWith('启用失败，请检查网络后重试。')
    expect(messageSpy.success).not.toHaveBeenCalledWith('启用成功')
    expect(mockedList).toHaveBeenCalledTimes(1)
    const opAfter = wrapper.findAll('.cc-op').find((b) => b.text().includes('启用'))!
    expect(opAfter.attributes('disabled')).toBeUndefined()
    expect(opAfter.text()).toBe('启用')
    wrapper.unmount()
  })

  it('停用：二次确认后网络异常时提示、busy 复位、保留当前列表', async () => {
    const wrapper = await mountPage([enabledRow])
    mockedDisable.mockRejectedValueOnce(new Error('network down'))
    const op = wrapper.findAll('.cc-op').find((b) => b.text().includes('停用'))!
    await op.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(messageSpy.error).toHaveBeenCalledWith('停用失败，请检查网络后重试。')
    expect(messageSpy.success).not.toHaveBeenCalledWith('停用成功')
    expect(mockedList).toHaveBeenCalledTimes(1)
    const opAfter = wrapper.findAll('.cc-op').find((b) => b.text().includes('停用'))!
    expect(opAfter.attributes('disabled')).toBeUndefined()
    expect(opAfter.text()).toBe('停用')
    wrapper.unmount()
  })
})

describe('自动生成在提交挂起期间始终可点击（R1-03）', () => {
  it('提交 Promise 挂起期间“自动生成”无 disabled/aria-disabled，点击仍执行且不二次保存', async () => {
    const wrapper = await mountPage()
    await openCreate(wrapper)
    await wrapper.find('.cc-id-control input').setValue('probe-x')
    await wrapper.find('.cc-desc-row textarea').setValue('旧描述')
    await optionByText(wrapper, '中心医院')!.trigger('click')
    await nextTick()
    mockedCreate.mockReturnValue(new Promise<ApiResponse<null>>(() => {}))
    await exactButton(wrapper, '创建')!.trigger('click')
    await nextTick()
    // 前提确认：提交确实处于挂起（创建按钮被 loading/disabled）
    expect(exactButton(wrapper, '创建')!.attributes('disabled')).toBeDefined()
    const gen = exactButton(wrapper, '自动生成')!
    expect(gen.attributes('disabled')).toBeUndefined()
    expect(gen.attributes('aria-disabled')).toBe('false')
    await gen.trigger('click')
    await nextTick()
    expect((wrapper.find('.cc-desc-row textarea').element as HTMLTextAreaElement).value).toBe('中心医院')
    expect(mockedCreate).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('提交挂起期间移除全部已选（无选择）时点击自动生成严格无动作', async () => {
    const wrapper = await mountPage()
    await openCreate(wrapper)
    await wrapper.find('.cc-id-control input').setValue('probe-x')
    await wrapper.find('.cc-desc-row textarea').setValue('旧描述')
    await optionByText(wrapper, '中心医院')!.trigger('click')
    await nextTick()
    mockedCreate.mockReturnValue(new Promise<ApiResponse<null>>(() => {}))
    await exactButton(wrapper, '创建')!.trigger('click')
    await nextTick()
    await wrapper.find('.cc-pane--chosen .cc-chip .el-tag__close').trigger('click')
    await nextTick()
    const gen = exactButton(wrapper, '自动生成')!
    expect(gen.attributes('disabled')).toBeUndefined()
    await gen.trigger('click')
    await nextTick()
    expect((wrapper.find('.cc-desc-row textarea').element as HTMLTextAreaElement).value).toBe('旧描述')
    expect(messageSpy.warning).not.toHaveBeenCalled()
    expect(mockedCreate).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('状态列与页面错误区 CSS 类名分离（R1-04）', () => {
  const SFC_SOURCE = readFileSync(
    resolve(process.cwd(), 'src/views/client-config/ClientConfigPage.vue'),
    'utf-8',
  )

  function cssBlock(selector: string): string {
    const m = SFC_SOURCE.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'm'))
    return m ? m[1] : ''
  }

  it('静态：页面错误容器与状态单元格类名不同，模板不再存在裸 .cc-state 元素', () => {
    expect(SFC_SOURCE).toContain('cc-page-state cc-page-state--error')
    expect(SFC_SOURCE).toContain('<span class="cc-status-cell">')
    expect(SFC_SOURCE).not.toMatch(/class="cc-state[\s"]/)
    expect(SFC_SOURCE).not.toMatch(/\.cc-state\s*\{/)
  })

  it('静态：cc-page-state 保留纵向布局与内边距；cc-status-cell 不再命中 column/padding 规则', () => {
    const pageCss = cssBlock('.cc-page-state')
    expect(pageCss).toContain('flex-direction: column')
    expect(pageCss).toContain('padding: 40px 0')
    const statusCss = cssBlock('.cc-status-cell')
    expect(statusCss).toContain('inline-flex')
    expect(statusCss).not.toContain('flex-direction')
    expect(statusCss).not.toContain('padding')
  })

  it('组件：正常列表状态单元格使用 cc-status-cell，紧凑单行并保留启停操作', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    const cells = wrapper.findAll('.cc-status-cell')
    expect(cells).toHaveLength(2)
    for (const c of cells) {
      expect(c.classes()).not.toContain('cc-page-state')
      expect(c.classes()).not.toContain('cc-state')
    }
    expect(wrapper.findAll('.cc-state')).toHaveLength(0)
    expect(wrapper.find('.cc-status-cell').text()).toContain('启用')
    expect(wrapper.findAll('.cc-op').some((b) => b.text().includes('停用'))).toBe(true)
    expect(wrapper.findAll('.cc-op').some((b) => b.text().includes('启用'))).toBe(true)
    wrapper.unmount()
  })

  it('组件：首次加载失败整区使用 cc-page-state 错误态，不命中状态单元格类', async () => {
    mockedList.mockRejectedValueOnce(new Error('network'))
    const wrapper = mount(ClientConfigPage, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    })
    await flushPromises()
    const err = wrapper.find('.cc-page-state')
    expect(err.exists()).toBe(true)
    expect(err.attributes('role')).toBe('alert')
    expect(err.classes()).toContain('cc-page-state--error')
    expect(err.classes()).not.toContain('cc-status-cell')
    expect(err.text()).toContain('重新加载')
    wrapper.unmount()
  })
})

describe('首次成功后的刷新失败提示与重试（R1-05）', () => {
  it('首次成功后的下一次业务失败：旧列表保留、非遮挡提示出现', async () => {
    const wrapper = await mountPage([enabledRow])
    expect(wrapper.text()).toContain('probe-a')
    mockedList.mockResolvedValueOnce(failList(500, 'boom'))
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('probe-a')
    const warn = wrapper.find('.cc-refresh-warn')
    expect(warn.exists()).toBe(true)
    expect(warn.text()).toContain('刷新失败')
    expect(warn.text()).toContain('上一次成功结果')
    expect(exactButton(wrapper, '重试')).toBeTruthy()
    wrapper.unmount()
  })

  it('首次成功后的 Promise rejection：提示出现；重试用已生效条件，成功后提示消失并更新列表', async () => {
    const wrapper = await mountPage([enabledRow])
    await wrapper.find('.cc-query-keyword input').setValue('probe')
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList.mock.calls[1][0]).toEqual({ keyword: 'probe', status: 'ALL' })
    mockedList.mockRejectedValueOnce(new Error('network'))
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('probe-a')
    expect(wrapper.find('.cc-refresh-warn').exists()).toBe(true)
    // 输入框改为未提交的新词：重试必须使用已生效条件 probe，而不是当前输入
    await wrapper.find('.cc-query-keyword input').setValue('未提交词')
    mockedList.mockResolvedValueOnce(okList([disabledRow]))
    await exactButton(wrapper, '重试')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.cc-refresh-warn').exists()).toBe(false)
    expect(wrapper.text()).toContain('probe-b')
    expect(wrapper.text()).not.toContain('probe-a')
    const lastCall = mockedList.mock.calls[mockedList.mock.calls.length - 1][0]
    expect(lastCall).toEqual({ keyword: 'probe', status: 'ALL' })
    wrapper.unmount()
  })

  it('迟到旧失败不覆盖更新请求的成功结果（listSeq 守卫）', async () => {
    const wrapper = await mountPage([enabledRow])
    let rejectLate!: (e: Error) => void
    mockedList.mockImplementationOnce(
      () =>
        new Promise<ApiResponse<ClientListVO>>((_resolve, reject) => {
          rejectLate = reject
        }),
    )
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    mockedList.mockResolvedValueOnce(okList([disabledRow]))
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('probe-b')
    rejectLate!(new Error('network'))
    await flushPromises()
    expect(wrapper.text()).toContain('probe-b')
    expect(wrapper.text()).not.toContain('probe-a')
    expect(wrapper.find('.cc-refresh-warn').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('空描述 Tooltip、滚动边界与键盘编辑入口（R1-06）', () => {
  const SFC_SOURCE = readFileSync(
    resolve(process.cwd(), 'src/views/client-config/ClientConfigPage.vue'),
    'utf-8',
  )
  const blankDescRow = row('probe-blank', '   ', '1', [])

  function cssBlock(selector: string): string {
    const m = SFC_SOURCE.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'm'))
    return m ? m[1] : ''
  }

  // ---- 9.1 空描述 Tooltip ----
  it('静态：空描述占位符“—”被 Tooltip 包裹且文案固定为“未填写探针描述”', () => {
    expect(SFC_SOURCE).toContain('content="未填写探针描述"')
    expect(SFC_SOURCE).toContain('<span class="cc-desc cc-desc--empty">—</span>')
    const emptySpan = SFC_SOURCE.indexOf('<span class="cc-desc cc-desc--empty">—</span>')
    const contentPos = SFC_SOURCE.indexOf('content="未填写探针描述"')
    expect(contentPos).toBeGreaterThan(-1)
    expect(emptySpan).toBeGreaterThan(contentPos)
  })

  it('组件：NULL 描述与仅空白描述都渲染可悬停的“未填写探针描述” Tooltip', async () => {
    const wrapper = await mountPage([nullDescRow, blankDescRow])
    const empties = wrapper.findAll('.cc-desc--empty')
    expect(empties).toHaveLength(2)
    for (const e of empties) expect(e.text()).toBe('—')
    // 真实悬停：Tooltip 内容以 popper 形式出现
    await empties[0].trigger('mouseenter')
    await new Promise((r) => setTimeout(r, 30))
    expect(document.body.textContent).toContain('未填写探针描述')
    await empties[0].trigger('mouseleave')
    await new Promise((r) => setTimeout(r, 30))
    wrapper.unmount()
  })

  // ---- 9.2 滚动边界 ----
  it('静态：弹窗内容区与 +N 完整清单设置视口安全最大高度与内部纵向滚动', () => {
    const formCss = cssBlock('.cc-form')
    expect(formCss).toContain('overflow-y: auto')
    expect(formCss).toMatch(/max-height:\s*calc\(100vh/)
    const fullListCss = cssBlock('.cc-full-list')
    expect(fullListCss).toContain('max-height: 320px')
    expect(fullListCss).toContain('overflow-y: auto')
  })

  it('组件：+N Popover 打开后完整清单保留全部项且异常标记不隐藏', async () => {
    const wrapper = await mountPage([multiRow])
    await wrapper.find('.cc-more').trigger('click')
    await flushPromises()
    await new Promise((r) => setTimeout(r, 30))
    const items = Array.from(document.querySelectorAll('.cc-full-item'))
    expect(items.length).toBe(multiSources.length)
    expect(document.body.textContent).toContain('ds-ab（不存在）')
    wrapper.unmount()
  })

  // ---- 9.3 键盘编辑入口 ----
  it('组件：探针 ID 单元格具备 tabindex/role；单击选中、双击编辑不受破坏', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    const idCell = wrapper.findAll('.cc-id').find((s) => s.text() === 'probe-a')!
    expect(idCell.attributes('tabindex')).toBe('0')
    expect(idCell.attributes('role')).toBe('button')
    expect(idCell.attributes('aria-label')).toBe('编辑探针 probe-a')
    // 双击行仍打开编辑
    wrapper.findComponent({ name: 'ElTable' }).vm.$emit('row-dblclick', enabledRow)
    await flushPromises()
    expect(wrapper.find('.cc-dialog').text()).toContain('编辑探针')
    await exactButton(wrapper, '取消')!.trigger('click')
    await flushPromises()
    // 单击行选择仍有效
    await selectRow(wrapper, enabledRow)
    expect(wrapper.text()).toContain('已选择：probe-a')
    wrapper.unmount()
  })

  it('组件：Enter 真实键盘事件打开编辑弹窗', async () => {
    const wrapper = await mountPage([enabledRow])
    const idCell = wrapper.findAll('.cc-id').find((s) => s.text() === 'probe-a')!
    await idCell.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.find('.cc-dialog').text()).toContain('编辑探针')
    expect(mockedOptions).toHaveBeenCalledWith('probe-a')
    wrapper.unmount()
  })

  it('组件：Space 真实键盘事件打开编辑弹窗且不触发提交', async () => {
    const wrapper = await mountPage([enabledRow])
    const idCell = wrapper.findAll('.cc-id').find((s) => s.text() === 'probe-a')!
    await idCell.trigger('keydown', { key: ' ', code: 'Space' })
    await flushPromises()
    expect(wrapper.find('.cc-dialog').text()).toContain('编辑探针')
    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(mockedCreate).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('组件：非编辑键（箭头键）不打开编辑、不产生副作用', async () => {
    const wrapper = await mountPage([enabledRow])
    const idCell = wrapper.findAll('.cc-id').find((s) => s.text() === 'probe-a')!
    await idCell.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(wrapper.find('.cc-dialog').exists()).toBe(false)
    expect(mockedOptions).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
