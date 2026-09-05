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

// listLayout 的离屏测量依赖真实布局，jsdom 返回 0；按标签文本注入测量宽度，
// 以便在组件层复现“两行放不下才 +N / 宽度变化重算”等确定性断言（真实几何另行浏览器目测）。
const { chipWidthRegistry } = vi.hoisted(() => ({ chipWidthRegistry: new Map<string, number>() }))
vi.mock('@/views/client-config/listLayout', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/views/client-config/listLayout')>()
  return { ...actual, measureChipWidth: (text: string) => chipWidthRegistry.get(text) ?? 0 }
})

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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** 驱动 ResizeObserver 回调，让组件两行/+N 决策可在 jsdom 下复现（真实几何另行浏览器目测）。 */
let lastFakeRO: { emit: (width: number) => void } | null = null
class FakeResizeObserver {
  private readonly cb: (entries: unknown[], observer: unknown) => void
  private readonly els = new Set<Element>()
  constructor(cb: (entries: unknown[], observer: unknown) => void) {
    this.cb = cb
  }
  observe(el: Element): void {
    this.els.add(el)
    // 仅列表“采集数据源”单元格（带 data-client-id）视为组件布局目标；
    // 避免把 EP 内部其他 ResizeObserver 实例误当作可注入实例。
    if (el instanceof HTMLElement && el.hasAttribute('data-client-id')) {
      lastFakeRO = this
    }
  }
  unobserve(el: Element): void {
    this.els.delete(el)
  }
  disconnect(): void {
    this.els.clear()
  }
  emit(width: number): void {
    const entries = [...this.els].map((target) => ({ target, contentRect: { width } }))
    if (entries.length) this.cb(entries, this)
  }
}

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
    expect(wrapper.text()).toContain('维护 sync-client 探针及其采集数据源配置')
    expect(wrapper.text()).toContain('probe-a')
    expect(wrapper.text()).toContain('probe-null')
    expect(wrapper.findComponent({ name: 'ElPagination' }).exists()).toBe(false)
    // CCFG-UI-005：页面不再展示“双击记录可编辑”弱提示，但双击/键盘编辑能力保留（R1-06 覆盖）
    expect(wrapper.text()).not.toContain('双击记录可编辑')
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

describe('数据源两行自适应与动态 +N（CCFG-UI-004/007~010）', () => {
  // 这些用例以注入测量宽度 + 模拟 ResizeObserver 驱动“真实”两行打包；真实几何另行浏览器目测。
  const savedRO = (globalThis as { ResizeObserver?: unknown }).ResizeObserver
  beforeEach(() => {
    ;(globalThis as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver as never
    chipWidthRegistry.clear()
  })
  afterEach(() => {
    ;(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver = savedRO
    chipWidthRegistry.clear()
    lastFakeRO = null
  })

  function setTagWidths(width: number, moreWidth = 30): void {
    const tags = ['机构Ab', '机构N1', '机构N2', '机构N3', '机构N4']
    tags.forEach((t) => chipWidthRegistry.set(t, width))
    chipWidthRegistry.set('+88', moreWidth)
  }

  const visibleTags = (w: PageWrapper) =>
    w.findAll('.cc-dstag').filter((t) => !(t.attributes('style') ?? '').includes('display: none'))

  it('两行能容纳时不显示 +N，全部直接展示', async () => {
    setTagWidths(40)
    const wrapper = await mountPage([multiRow])
    lastFakeRO!.emit(260)
    await nextTick()
    expect(wrapper.find('.cc-more').exists()).toBe(false)
    expect(visibleTags(wrapper).map((t) => t.text())).toEqual([
      '机构Ab',
      '机构N1',
      '机构N2',
      '机构N3',
      '机构N4',
    ])
    wrapper.unmount()
  })

  it('两行放不下时显示精确 +N；标签正文仅机构名；完整清单按接口原顺序', async () => {
    setTagWidths(40)
    const wrapper = await mountPage([multiRow])
    lastFakeRO!.emit(120)
    await nextTick()
    const visible = visibleTags(wrapper)
    // 异常优先展示顺序：[机构Ab(异常), 机构N1, 机构N2] 可见，+2 隐藏
    expect(visible.map((t) => t.text())).toEqual(['机构Ab', '机构N1', '机构N2'])
    expect(visible[0].classes()).toContain('cc-dstag--bad')
    expect(wrapper.find('.cc-more').text()).toBe('+2')
    const hidden = wrapper
      .findAll('.cc-dstag')
      .filter((t) => (t.attributes('style') ?? '').includes('display: none'))
    expect(hidden.map((t) => t.text())).toEqual(['机构N3', '机构N4'])
    // 标签正文不得拼接数据源名称或 ID（见 Tooltip describe 的文档断言，此处再校验无名称）
    expect(wrapper.find('.cc-src').text()).not.toContain('名N')

    // 点击 +N：完整清单保留全部项且保持接口原顺序
    await wrapper.find('.cc-more').trigger('click')
    await flushPromises()
    await sleep(60)
    const items = Array.from(document.querySelectorAll('.cc-full-item'))
    expect(items).toHaveLength(5)
    const orgSeq = items.map((el) => el.querySelector('.cc-full-org')?.textContent ?? '')
    expect(orgSeq).toEqual(['机构N1', '机构N2', '机构Ab', '机构N3', '机构N4'])
    wrapper.unmount()
  })

  it('异常项优先进入可见两行：异常项在接口第 3 位仍最先可见', async () => {
    setTagWidths(40)
    const wrapper = await mountPage([multiRow])
    lastFakeRO!.emit(46)
    await nextTick()
    const visible = visibleTags(wrapper)
    expect(visible.map((t) => t.text())).toEqual(['机构Ab'])
    expect(visible[0].classes()).toContain('cc-dstag--bad')
    expect(wrapper.find('.cc-more').text()).toBe('+4')
    wrapper.unmount()
  })

  it('列宽变化触发重算：由可容纳变为溢出后 +N 出现并更新', async () => {
    setTagWidths(40)
    const wrapper = await mountPage([multiRow])
    lastFakeRO!.emit(260)
    await nextTick()
    expect(wrapper.find('.cc-more').exists()).toBe(false)
    lastFakeRO!.emit(120)
    await nextTick()
    expect(wrapper.find('.cc-more').exists()).toBe(true)
    expect(wrapper.find('.cc-more').text()).toBe('+2')
    expect(visibleTags(wrapper)).toHaveLength(3)
    lastFakeRO!.emit(260)
    await nextTick()
    expect(wrapper.find('.cc-more').exists()).toBe(false)
    wrapper.unmount()
  })

  it('编辑弹窗回显仍按接口原顺序（列表两行投影不改变弹窗选择集）', async () => {
    const wrapper = await mountPage([multiRow])
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
  it('静态：不再使用 Element Tooltip；空描述占位与悬停统一交给单实例 Tooltip 管理器', () => {
    expect(SFC_SOURCE).not.toContain('el-tooltip')
    expect(SFC_SOURCE).not.toContain('content="未填写探针描述"')
    expect(SFC_SOURCE).toContain(`isBlankDesc(row) ? '—' : row.clientDesc`)
    expect(SFC_SOURCE).toContain('cc-single-tip')
    expect(SFC_SOURCE).toContain('onDescEnter')
  })

  it('组件：NULL 描述与仅空白描述渲染“—”占位；悬停（约 240ms 延迟）显示固定文案、离开立即隐藏', async () => {
    const wrapper = await mountPage([nullDescRow, blankDescRow])
    const empties = wrapper.findAll('.cc-desc--empty')
    expect(empties).toHaveLength(2)
    for (const e of empties) expect(e.text()).toBe('—')
    // 悬停延迟未到：不得出现（避免快速扫过连续弹出）
    await empties[0].trigger('mouseenter')
    await sleep(60)
    expect(document.body.textContent).not.toContain('未填写探针描述')
    await sleep(220)
    expect(document.body.textContent).toContain('未填写探针描述')
    // 鼠标离开立即隐藏
    await empties[0].trigger('mouseleave')
    await sleep(10)
    expect(document.body.textContent).not.toContain('未填写探针描述')
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

  // +N 点击完整清单的数量与顺序在“数据源两行自适应与动态 +N” describe 中覆盖（需注入测量宽度）。
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

describe('列表页面层级、查询区与工具栏（CCFG-UI-001~005）', () => {
  const SFC_SOURCE = readFileSync(
    resolve(process.cwd(), 'src/views/client-config/ClientConfigPage.vue'),
    'utf-8',
  )

  it('组件：页面标题/说明、查询区外部标签与占位、查询项一致结构', async () => {
    const wrapper = await mountPage([enabledRow])
    expect(wrapper.find('.cc-title').text()).toBe('探针端管理')
    expect(wrapper.find('.cc-subtitle').text()).toBe('维护 sync-client 探针及其采集数据源配置')
    expect(wrapper.findAll('.cc-query-label').map((l) => l.text())).toEqual(['探针信息', '探针状态'])
    expect(wrapper.find('.cc-query-keyword input').attributes('placeholder')).toBe(
      '请输入探针 ID 或探针描述',
    )
    // 两个查询项结构一致：外部标签 + 控件位于同一 .cc-query-item
    const items = wrapper.findAll('.cc-query-item')
    expect(items).toHaveLength(2)
    for (const item of items) expect(item.find('.cc-query-label').exists()).toBe(true)
    wrapper.unmount()
  })

  it('静态：查询输入框无搜索图标；新增/删除按钮带 Plus/Delete 图标且图标后紧跟可读文字', () => {
    expect(SFC_SOURCE).not.toMatch(/\bSearch\b/)
    expect(SFC_SOURCE).toContain('<Plus />')
    expect(SFC_SOURCE).toContain('<Delete />')
    // 图标元素闭合后同一行紧跟按钮文字：保留可识别文字，非纯图标按钮
    expect(SFC_SOURCE).toContain('</el-icon>新增探针')
    expect(SFC_SOURCE).toContain('</el-icon>删除所选')
  })

  it('组件：新增/删除按钮均含图标；删除未选中禁用、选中后启用且显示选中提示', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('.cc-btn-add .cc-btn-icon').exists()).toBe(true)
    expect(wrapper.find('.cc-btn-delete .cc-btn-icon').exists()).toBe(true)
    expect(exactButton(wrapper, '删除所选')!.attributes('disabled')).toBeDefined()
    await selectRow(wrapper, enabledRow)
    expect(exactButton(wrapper, '删除所选')!.attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('已选择：probe-a')
    wrapper.unmount()
  })

  it('静态：删除危险态为红描边而非大面积红填充；未选中态保持默认灰', () => {
    const m = SFC_SOURCE.match(/\.cc-btn-delete--armed\s*\{([^}]*)\}/)
    expect(m).toBeTruthy()
    expect(m![1]).toContain('color: #f56c6c')
    expect(m![1]).toContain('border-color: #f56c6c')
    expect(m![1]).toContain('background: #fff')
    // 表格卡片独立于查询区存在（查询区不再与工具栏/表格同卡）
    expect(SFC_SOURCE).toContain('class="cc-table-card"')
  })
})

describe('状态胶囊与启停操作视觉分离（CCFG-UI-006/011）', () => {
  it('组件：状态为不可点击胶囊（span），启停为文字按钮；两类元素与类名分离', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    const pills = wrapper.findAll('.cc-state-tag')
    expect(pills).toHaveLength(2)
    for (const p of pills) expect(p.element.tagName).toBe('SPAN')
    const ops = wrapper.findAll('.cc-op')
    expect(ops.some((b) => b.text().includes('停用'))).toBe(true)
    expect(ops.some((b) => b.text().includes('启用'))).toBe(true)
    for (const o of ops) expect(o.element.tagName).toBe('BUTTON')
    expect(wrapper.findAll('.cc-state-tag').some((p) => p.classes().includes('cc-op'))).toBe(false)
    wrapper.unmount()
  })
})

describe('数据源与描述 Tooltip：单实例与内容（CCFG-UI-005/008/009）', () => {
  const clearHosts = () => {
    document.querySelectorAll('.cc-single-tip').forEach((n) => n.remove())
  }
  beforeEach(clearHosts)
  afterEach(clearHosts)

  const hoverChip = async (w: PageWrapper, text: string) => {
    const chip = w.findAll('.cc-dstag').find((t) => t.text() === text)!
    await chip.trigger('mouseenter')
  }

  it('组件：标签正文仅机构名；悬停 Tooltip 含完整机构名 + 数据源 ID + 异常，不含数据源名称', async () => {
    const wrapper = await mountPage([enabledRow])
    const tags = wrapper.findAll('.cc-dstag')
    // 异常项优先：inactiveDs(停用机构) 在前，健康项(中心医院) 在后；正文均为机构名，无 ID/名称拼接
    expect(tags.map((t) => t.text())).toEqual(['停用机构', '中心医院'])
    expect(wrapper.find('.cc-src').text()).not.toContain('HIS 主库')

    await hoverChip(wrapper, '中心医院')
    await sleep(280)
    let body = document.body.textContent ?? ''
    expect(body).toContain('数据源 ID：ds-ok1')
    expect(body).not.toContain('HIS 主库')
    const healthy = wrapper.findAll('.cc-dstag').find((t) => t.text() === '中心医院')!
    await healthy.trigger('mouseleave')
    await sleep(10)

    await hoverChip(wrapper, '停用机构')
    await sleep(280)
    body = document.body.textContent ?? ''
    expect(body).toContain('数据源 ID：ds-old')
    expect(body).toContain('异常原因：已停用')
    expect(body).not.toContain('旧库')
    wrapper.unmount()
  })

  it('组件：进入新目标立即关闭上一个，稳定悬停后仅新目标内容（任意时刻最多一个）', async () => {
    const wrapper = await mountPage([enabledRow])
    await hoverChip(wrapper, '中心医院')
    await sleep(280)
    expect(document.body.textContent).toContain('数据源 ID：ds-ok1')
    // 进入新目标：上一个 Tooltip 立即关闭（延迟未到，两个都不出现）
    await hoverChip(wrapper, '停用机构')
    await sleep(10)
    expect(document.body.textContent).not.toContain('数据源 ID：ds-ok1')
    expect(document.body.textContent).not.toContain('数据源 ID：ds-old')
    await sleep(280)
    expect(document.body.textContent).toContain('数据源 ID：ds-old')
    expect(document.body.textContent).not.toContain('数据源 ID：ds-ok1')
    wrapper.unmount()
  })

  it('组件：描述仅在文本被截断时显示 Tooltip，离开立即隐藏', async () => {
    const wrapper = await mountPage([enabledRow])
    const desc = wrapper.findAll('.cc-desc').find((s) => s.text() === '中心探针')!
    // jsdom 无布局：注入截断尺寸以驱动“确实被截断”分支
    Object.defineProperty(desc.element, 'clientWidth', { configurable: true, value: 90 })
    Object.defineProperty(desc.element, 'scrollWidth', { configurable: true, value: 200 })
    await desc.trigger('mouseenter')
    await sleep(280)
    const host = document.querySelector('.cc-single-tip') as HTMLElement | null
    expect(host).toBeTruthy()
    expect(host!.textContent).toContain('中心探针')
    await desc.trigger('mouseleave')
    await sleep(10)
    expect(host!.textContent ?? '').toBe('')
    wrapper.unmount()
  })

  it('组件：未截断描述悬停不弹 Tooltip（单实例宿主保持为空）', async () => {
    const wrapper = await mountPage([enabledRow])
    const desc = wrapper.findAll('.cc-desc').find((s) => s.text() === '中心探针')!
    // 不注入尺寸：jsdom clientWidth === scrollWidth（0）→ 视为未截断
    await desc.trigger('mouseenter')
    await sleep(280)
    const host = document.querySelector('.cc-single-tip') as HTMLElement | null
    expect(host).toBeTruthy()
    expect(host!.textContent ?? '').toBe('')
    wrapper.unmount()
  })

  it('组件：行级歧义标签与（展示）计数备注悬停给出行级说明（单实例内容）', async () => {
    const wrapper = await mountPage([ambiguousRow])
    const rowbad = wrapper.findAll('.cc-rowbad').find((t) => t.text().includes('含逗号歧义'))!
    await rowbad.trigger('mouseenter')
    await sleep(280)
    const body = document.body.textContent ?? ''
    expect(body).toContain('英文逗号歧义')
    expect(body).toContain('普通 CSV 解析')
    await rowbad.trigger('mouseleave')
    await sleep(10)
    wrapper.unmount()
  })
})
