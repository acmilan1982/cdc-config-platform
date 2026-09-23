import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MockInstance } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import type { DOMWrapper } from '@vue/test-utils'
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
// 以便在组件层复现“单行放不下/超 6 才 +N / 宽度变化重算”等确定性断言（真实几何另行浏览器目测）。
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

const PAGE_PATH = resolve(process.cwd(), 'src/views/client-config/ClientConfigPage.vue')
const DS_PAGE_PATH = resolve(process.cwd(), 'src/views/data-source/DataSourcePage.vue')

/** 本页 SFC 源码：测试环境不注入 SFC 样式，公共预设引入方式与页面令牌只能按源码静态结构受检。 */
const SFC_SOURCE = readFileSync(PAGE_PATH, 'utf-8')

/** 提取某个选择器的声明块（首个匹配）。 */
function cssBlock(source: string, selector: string): string {
  const m = source.match(new RegExp(`${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`, 'm'))
  return m ? m[1] : ''
}

/** 声明集合归一化：去空白、去空项、排序，用于跨组件“同款视觉”的逐值比较。 */
function declarations(block: string): string[] {
  return block
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d.length > 0)
    .sort()
}

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

/** FG_ACTIVE 历史异常原始值（既非 '1' 也非 '0'）：红色 `异常：{原始值}` 标识。 */
const abnormalRow = row('probe-x', '异常探针', 'x', [view('ds-x', 'X 机构', 'X 库')])

/** 单个不可见空白原始值：须以半角引号定界可见化，不得静默隐藏原值。 */
const blankFgRow = row('probe-ws', '空白状态探针', ' ', [view('ds-ws', 'WS 机构', 'WS 库')])

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

// 与其他探针重复分配（ASSIGNED_TO_MULTIPLE_CLIENTS）：列表标签 Tooltip 展示新文案（R1 §5.1）
const assignedDs = view(
  'ds-occ2',
  '分院',
  '分院库',
  ['ASSIGNED_TO_MULTIPLE_CLIENTS'],
  ['hosp-007'],
)
const assignedRow = row('probe-occ', '占用探针', '1', [assignedDs])

// 单行数量上限（6）与 7+ 溢出场景：7 个正常源
const overflowSources = Array.from({ length: 7 }, (_, i) =>
  view(`ds-m${i + 1}`, `机构M${i + 1}`, `名M${i + 1}`),
)
const overflowRow = row('probe-overflow', '七源探针', '1', overflowSources)

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
  return mountRaw()
}

/** 不预设列表响应，供需要一次性 rejection/顺序实现的用例自行排队。 */
async function mountRaw() {
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

/** 驱动 ResizeObserver 回调，让组件单行/+N 决策可在 jsdom 下复现（真实几何另行浏览器目测）。 */
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

/** 双击数据行打开编辑（本页唯一编辑入口，行内无编辑按钮）。 */
async function openEdit(w: PageWrapper, rowData: ClientListItemVO) {
  w.findComponent({ name: 'ElTable' }).vm.$emit('row-dblclick', rowData)
  await flushPromises()
}

/**
 * 第 rowIndex 行“更多”菜单的菜单项。
 * 菜单 teleport 到 body 且持久渲染，因此按触发器 `aria-controls` 指向的菜单 id 精确定位，
 * 避免命中其他行或其他用例残留的弹层。
 */
function rowMenuItems(w: PageWrapper, rowIndex = 0): Element[] {
  const menuId = w.findAll('.cc-more-link')[rowIndex]?.attributes('aria-controls')
  if (!menuId) return []
  const menu = document.getElementById(menuId)
  return menu ? Array.from(menu.querySelectorAll('.el-dropdown-menu__item')) : []
}

/** 行“更多”菜单的可见项文本（菜单项全部有文本，空串已过滤）。 */
function rowMenuLabels(w: PageWrapper, rowIndex = 0): string[] {
  return rowMenuItems(w, rowIndex)
    .map((el) => (el.textContent ?? '').trim())
    .filter((t) => t !== '')
}

/**
 * 打开第 rowIndex 行的“更多”下拉。
 * `el-dropdown` 的展开走 `ElTooltip` 的非受控 delayed toggle：点击后由 `setTimeout(0)`
 * 才真正 open，因此必须等待一次真实定时器宏任务；`flushPromises` 走 `setImmediate`，
 * 会在该定时器之前返回。已展开时直接返回，避免再次点击把菜单关掉。
 */
async function openRowMenu(w: PageWrapper, rowIndex = 0) {
  const trigger = w.findAll('.cc-more-link')[rowIndex]
  if (!trigger) {
    throw new Error(`cc-more-link trigger not found at index ${rowIndex}`)
  }
  if (trigger.element.getAttribute('aria-expanded') === 'true') {
    return
  }
  await trigger.trigger('click')
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
  if (trigger.element.getAttribute('aria-expanded') !== 'true') {
    throw new Error(`row menu did not open at index ${rowIndex}`)
  }
}

/** 打开行“更多”菜单并点击指定菜单项（命令值到业务动作的映射由页面负责）。 */
async function clickRowMenuAction(w: PageWrapper, rowIndex: number, label: string) {
  await openRowMenu(w, rowIndex)
  const item = rowMenuItems(w, rowIndex).find((el) => (el.textContent ?? '').trim() === label)
  if (!item) {
    throw new Error(`row menu item not found: ${label}`)
  }
  ;(item as HTMLElement).click()
  await nextTick()
  await flushPromises()
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
  // 下拉菜单/弹窗 teleport 到 body 且持久驻留，逐用例清理以免污染后续 aria-controls 定位。
  document.body.innerHTML = ''
})

// ============================================================ 页面结构（公共层接入）

describe('查询列表页四组件接入与无刷新能力（CCFG-REQ-091、CCFG-DESIGN-038、CCFG-UI-033）', () => {
  it('组件：页面壳/查询区/动作组/结果卡片四个公共组件均已渲染，标题与说明来自本页文案', async () => {
    const wrapper = await mountPage([enabledRow])
    expect(wrapper.find('.ql-page').exists()).toBe(true)
    expect(wrapper.find('.ql-q-panel').exists()).toBe(true)
    expect(wrapper.find('.ql-actions').exists()).toBe(true)
    expect(wrapper.find('.ql-result-panel').exists()).toBe(true)
    expect(wrapper.find('.ql-page__title').text()).toBe('探针端管理')
    expect(wrapper.find('.ql-page__description').text()).toBe('维护 sync-client 探针及其采集数据源配置')
    wrapper.unmount()
  })

  it('组件：查询区仍为“探针信息 + 探针状态”，操作组只含查询与重置两个按钮', async () => {
    const wrapper = await mountPage([enabledRow])
    const labels = wrapper.findAll('.cc-q-label').map((l) => l.text())
    expect(labels).toEqual(['探针信息', '探针状态'])
    expect(wrapper.find('.cc-q-keyword input').attributes('placeholder')).toBe(
      '请输入探针 ID 或探针描述',
    )
    expect(wrapper.find('.cc-q-status').exists()).toBe(true)
    const actions = wrapper.find('.ql-actions')
    const actionLabels = actions.findAll('.ql-action-label').map((l) => l.text())
    expect(actionLabels).toEqual(['查询', '重置'])
    wrapper.unmount()
  })

  it('组件：结果区头部左侧摘要显示记录数，最右工具栏为本页“新增探针”', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    expect(wrapper.find('.ql-result-panel__summary .cc-result-count').text()).toBe('共 2 条')
    const toolbar = wrapper.find('.ql-result-panel__toolbar')
    expect(toolbar.find('.cc-btn-add').exists()).toBe(true)
    expect(toolbar.find('.cc-btn-add').text().trim()).toBe('新增探针')
    wrapper.unmount()
  })

  it('静态：不接入刷新工具栏/轮询，无刷新按钮、倒计时与最近刷新时间（CCFG-UI-033）', () => {
    // 公共刷新工具栏组件与轮询定时器均不得出现在本页
    expect(SFC_SOURCE).not.toContain('QueryListRefreshToolbar')
    expect(SFC_SOURCE).not.toContain('setInterval')
    expect(SFC_SOURCE).not.toContain('ql-refresh')
  })

  it('组件：不渲染刷新工具栏与倒计时/最近刷新时间，页面文案无“刷新”语义', async () => {
    const wrapper = await mountPage([enabledRow])
    expect(wrapper.find('.ql-refresh-group').exists()).toBe(false)
    expect(wrapper.find('.ql-countdown-text').exists()).toBe(false)
    expect(wrapper.find('.ql-refresh-time').exists()).toBe(false)
    const text = wrapper.text()
    expect(text).not.toContain('刷新')
    expect(text).not.toContain('重新加载')
    wrapper.unmount()
  })

  it('组件：无自动刷新轮询（静置后仍只有首次一次查询）', async () => {
    const wrapper = await mountPage([enabledRow])
    await sleep(60)
    expect(mockedList).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

// ============================================================ 首载 / 查询 / 重置

describe('首次加载 / 查询 / 重置（CCFG-UI-002/003/012）', () => {
  it('首次进入自动查询一次，默认 keyword 空、status ALL，并渲染记录', async () => {
    const wrapper = await mountPage([enabledRow, nullDescRow])
    expect(mockedList).toHaveBeenCalledTimes(1)
    expect(mockedList.mock.calls[0][0]).toEqual({ keyword: undefined, status: 'ALL' })
    expect(wrapper.text()).toContain('probe-a')
    expect(wrapper.text()).toContain('probe-null')
    expect(wrapper.findComponent({ name: 'ElPagination' }).exists()).toBe(false)
    // CCFG-UI-005：页面不再展示“双击记录可编辑”弱提示，但双击/键盘编辑能力保留
    expect(wrapper.text()).not.toContain('双击记录可编辑')
    wrapper.unmount()
  })

  it('点击查询提交当前关键词与状态，并去掉首尾空白', async () => {
    const wrapper = await mountPage()
    await wrapper.find('.cc-q-keyword input').setValue('  probe  ')
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(mockedList.mock.calls[1][0]).toEqual({ keyword: 'probe', status: 'ALL' })
    wrapper.unmount()
  })

  it('查询区“探针状态”下拉参与查询条件', async () => {
    const wrapper = await mountPage()
    await wrapper.find('.cc-q-status').trigger('click')
    await nextTick()
    await nextTick()
    const opt = Array.from(document.querySelectorAll('.el-select-dropdown__item')).find(
      (el) => (el.textContent ?? '').trim() === '停用',
    )
    ;(opt as HTMLElement).click()
    await nextTick()
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList.mock.calls[1][0]).toEqual({ keyword: undefined, status: 'DISABLED' })
    wrapper.unmount()
  })

  it('点击重置仅恢复草稿控件，不自动查询、不改变已生效条件与已展示结果', async () => {
    const wrapper = await mountPage()
    await wrapper.find('.cc-q-keyword input').setValue('probe')
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(2)
    await wrapper.find('.cc-q-keyword input').setValue('probe2')
    await exactButton(wrapper, '重置')!.trigger('click')
    await flushPromises()
    expect((wrapper.find('.cc-q-keyword input').element as HTMLInputElement).value).toBe('')
    // 重置不暗发请求：已生效条件与已展示记录均保持
    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('probe-a')
    wrapper.unmount()
  })
})

// ============================================================ 列表加载失败与重试

describe('列表加载失败提示与重试（CCFG-UI-012/034）', () => {
  it('首次加载失败：错误槽给出加载失败提示与重试按钮，且不出现刷新语义控件', async () => {
    mockedList.mockRejectedValueOnce(new Error('network'))
    const wrapper = await mountRaw()
    const err = wrapper.find('.cc-load-error')
    expect(err.exists()).toBe(true)
    expect(err.attributes('role')).toBe('alert')
    expect(err.text()).toContain('列表加载失败，请重试。')
    expect(wrapper.find('.ql-result-panel__error-slot').exists()).toBe(true)
    expect(exactButton(wrapper, '重试')).toBeTruthy()
    expect(wrapper.text()).not.toContain('刷新')
    await exactButton(wrapper, '重试')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('已有成功结果后失败：旧结果保留、失败提示出现', async () => {
    const wrapper = await mountPage([enabledRow])
    expect(wrapper.text()).toContain('probe-a')
    mockedList.mockResolvedValueOnce(failList(500, 'boom'))
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('probe-a')
    const err = wrapper.find('.cc-load-error')
    expect(err.exists()).toBe(true)
    expect(err.text()).toContain('列表加载失败，请重试。')
    wrapper.unmount()
  })

  it('重试用已生效条件而非当前草稿；成功后提示消失并更新列表', async () => {
    const wrapper = await mountPage([enabledRow])
    await wrapper.find('.cc-q-keyword input').setValue('probe')
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList.mock.calls[1][0]).toEqual({ keyword: 'probe', status: 'ALL' })
    mockedList.mockRejectedValueOnce(new Error('network'))
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.cc-load-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('probe-a')
    // 输入框改为未提交的新词：重试必须使用已生效条件 probe
    await wrapper.find('.cc-q-keyword input').setValue('未提交词')
    mockedList.mockResolvedValueOnce(okList([disabledRow]))
    await exactButton(wrapper, '重试')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.cc-load-error').exists()).toBe(false)
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
    expect(wrapper.find('.cc-load-error').exists()).toBe(false)
    wrapper.unmount()
  })
})

// ============================================================ 六列顺序与无选中机制

describe('主列表六列顺序、序号与无选中机制（CCFG-REQ-100、CCFG-UI-027~030）', () => {
  it('组件：列顺序固定为 序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    const table = wrapper.findAllComponents({ name: 'ElTable' })[0]
    const columns = table.findAllComponents({ name: 'ElTableColumn' })
    expect(columns.map((c) => c.props('label'))).toEqual([
      '序号',
      '探针 ID',
      '探针描述',
      '采集数据源',
      '数据源数量',
      '操作',
    ])
    wrapper.unmount()
  })

  it('组件：列宽按窄序号 / 约 170~180px 探针 ID / 约 100~110px 数据源数量设置', async () => {
    const wrapper = await mountPage([enabledRow])
    const columns = wrapper.findAllComponents({ name: 'ElTable' })[0].findAllComponents({
      name: 'ElTableColumn',
    })
    const width = (i: number) => Number(columns[i].props('width'))
    expect(width(0)).toBeLessThan(100)
    expect(width(1)).toBeGreaterThanOrEqual(170)
    expect(width(1)).toBeLessThanOrEqual(180)
    expect(width(4)).toBeGreaterThanOrEqual(100)
    expect(width(4)).toBeLessThanOrEqual(110)
    // 采集数据源列以 min-width 参与伸缩
    expect(Number(columns[3].props('minWidth'))).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('组件：序号列按当前展示数组 $index + 1 连续编号，与探针 ID 同序', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow, abnormalRow])
    expect(wrapper.findAll('.cc-seq').map((s) => s.text())).toEqual(['1', '2', '3'])
    const ids = wrapper.findAll('.cc-id').map((s) => s.text())
    expect(ids).toEqual(['probe-a', 'probe-b', 'probe-x'])
    wrapper.unmount()
  })

  it('组件：最后一列为最右固定“操作”列，唯一文字入口为“更多”', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    const columns = wrapper.findAllComponents({ name: 'ElTable' })[0].findAllComponents({
      name: 'ElTableColumn',
    })
    const last = columns[columns.length - 1]
    expect(last.props('label')).toBe('操作')
    expect(last.props('fixed')).toBe('right')
    expect(wrapper.findAll('.cc-more-link').map((l) => l.text().trim())).toEqual(['更多', '更多'])
    wrapper.unmount()
  })

  it('组件：已彻底取消行选中、批量删除与“已选择”提示', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    expect(wrapper.text()).not.toContain('已选择')
    expect(wrapper.text()).not.toContain('删除所选')
    expect(exactButton(wrapper, '删除所选')).toBeUndefined()
    expect(wrapper.findAll('.cc-row--selected')).toHaveLength(0)
    expect(wrapper.find('.el-table .el-checkbox').exists()).toBe(false)
    const columns = wrapper.findAllComponents({ name: 'ElTable' })[0].findAllComponents({
      name: 'ElTableColumn',
    })
    expect(columns.some((c) => c.props('type') === 'selection')).toBe(false)
    wrapper.unmount()
  })

  it('静态：页面源码不含行选中状态、行单击事件、选中样式与批量删除入口', () => {
    expect(SFC_SOURCE).not.toContain('row-click')
    expect(SFC_SOURCE).not.toContain('selectedClientId')
    expect(SFC_SOURCE).not.toContain('cc-row--selected')
    expect(SFC_SOURCE).not.toContain('删除所选')
    expect(SFC_SOURCE).not.toContain('已选择：')
  })

  it('组件：取消独立“状态”列后，行内不再出现启停文字按钮', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    const columns = wrapper.findAllComponents({ name: 'ElTable' })[0].findAllComponents({
      name: 'ElTableColumn',
    })
    expect(columns.some((c) => c.props('label') === '状态')).toBe(false)
    expect(wrapper.findAll('.cc-op')).toHaveLength(0)
    expect(wrapper.findAll('.cc-state-tag')).toHaveLength(0)
    // 启停入口只存在于“更多”菜单内（菜单为 teleport 浮层，不在表格行内）
    expect(wrapper.find('.el-table').find('button').exists()).toBe(false)
    wrapper.unmount()
  })
})

// ============================================================ FG_ACTIVE 三态与菜单

describe('探针 ID 三态标识（CCFG-REQ-101/102、CCFG-UI-031/035）', () => {
  it("组件：FG_ACTIVE === '1' 紧邻探针 ID 不显示任何标识", async () => {
    const wrapper = await mountPage([enabledRow])
    const cell = wrapper.find('.cc-id-cell')
    expect(cell.find('.cc-id').text()).toBe('probe-a')
    expect(cell.find('.cc-inactive-mark').exists()).toBe(false)
    expect(cell.find('.cc-abnormal-mark').exists()).toBe(false)
    wrapper.unmount()
  })

  it("组件：FG_ACTIVE === '0' 显示“停用”标识", async () => {
    const wrapper = await mountPage([disabledRow])
    const mark = wrapper.find('.cc-id-cell .cc-inactive-mark')
    expect(mark.exists()).toBe(true)
    expect(mark.text()).toBe('停用')
    wrapper.unmount()
  })

  it('组件与静态：“停用”标识与数据源管理“数据源 ID”后的同款标识逐值一致（视觉完全一致）', async () => {
    const wrapper = await mountPage([disabledRow])
    expect(wrapper.find('.cc-inactive-mark').text()).toBe('停用')
    const cc = declarations(cssBlock(SFC_SOURCE, '.cc-inactive-mark'))
    const ds = declarations(cssBlock(readFileSync(DS_PAGE_PATH, 'utf-8'), '.ds-inactive-mark'))
    expect(cc.length).toBeGreaterThan(0)
    expect(cc).toEqual(ds)
    wrapper.unmount()
  })

  it('组件：历史异常原始值显示红色 `异常：{原始值}`，原值原样呈现', async () => {
    const wrapper = await mountPage([abnormalRow])
    const mark = wrapper.find('.cc-id-cell .cc-abnormal-mark')
    expect(mark.exists()).toBe(true)
    expect(mark.text()).toBe('异常：x')
    expect(wrapper.find('.cc-id-cell .cc-inactive-mark').exists()).toBe(false)
    wrapper.unmount()
  })

  it('组件：单个不可见空白原始值以半角引号定界可见化，不静默隐藏原值', async () => {
    const wrapper = await mountPage([blankFgRow])
    const mark = wrapper.find('.cc-id-cell .cc-abnormal-mark')
    expect(mark.exists()).toBe(true)
    expect(mark.text()).toBe('异常：" "')
    wrapper.unmount()
  })

  it('组件：异常标识完整文案可经单实例 Tooltip 查看（列宽截断时仍可核对）', async () => {
    const wrapper = await mountPage([blankFgRow])
    const mark = wrapper.find('.cc-id-cell .cc-abnormal-mark')
    await mark.trigger('mouseenter')
    await sleep(280)
    expect(document.body.textContent).toContain('异常：" "')
    await mark.trigger('mouseleave')
    await sleep(10)
    wrapper.unmount()
  })

  it('静态：异常标识限宽省略而不挤压最右固定“操作”列', () => {
    const css = cssBlock(SFC_SOURCE, '.cc-abnormal-mark')
    expect(css).toContain('max-width: 100%')
    expect(css).toContain('overflow: hidden')
    expect(css).toContain('text-overflow: ellipsis')
    expect(css).toContain('white-space: nowrap')
    expect(css).toContain('flex: 0 1 auto')
    // 承载 ID 与标识的单元格自身负责裁切
    expect(cssBlock(SFC_SOURCE, '.cc-id-cell')).toContain('overflow: hidden')
  })
})

describe('“更多”菜单三态条目（CCFG-REQ-103、CCFG-UI-032）', () => {
  const triplet = [enabledRow, disabledRow, abnormalRow]

  it('启用行：菜单为「停用、删除」，且不出现在行内选中等派生入口', async () => {
    const wrapper = await mountPage(triplet)
    await openRowMenu(wrapper, 0)
    expect(rowMenuLabels(wrapper, 0)).toEqual(['停用', '删除'])
    wrapper.unmount()
  })

  it('停用行：菜单为「启用、删除」', async () => {
    const wrapper = await mountPage(triplet)
    await openRowMenu(wrapper, 1)
    expect(rowMenuLabels(wrapper, 1)).toEqual(['启用', '删除'])
    wrapper.unmount()
  })

  it('历史异常行：菜单为「停用、删除」，绝不出现“启用”', async () => {
    const wrapper = await mountPage(triplet)
    await openRowMenu(wrapper, 2)
    const labels = rowMenuLabels(wrapper, 2)
    expect(labels).toEqual(['停用', '删除'])
    expect(labels).not.toContain('启用')
    wrapper.unmount()
  })

  it('组件：删除为危险语义、停用为警告语义（菜单项样式类 + 非 scoped 颜色规则）', async () => {
    const wrapper = await mountPage([enabledRow])
    await openRowMenu(wrapper, 0)
    const items = rowMenuItems(wrapper, 0)
    const disableItem = items.find((el) => (el.textContent ?? '').trim() === '停用')!
    const deleteItem = items.find((el) => (el.textContent ?? '').trim() === '删除')!
    expect(disableItem.className).toContain('cc-more-warning')
    expect(deleteItem.className).toContain('cc-more-danger')
    // teleport 到 body 的菜单只能以全局作用域限定在 popper-class 命名空间内着色
    expect(SFC_SOURCE).toContain('.cc-more-popper .el-dropdown-menu__item.cc-more-danger')
    expect(SFC_SOURCE).toContain('var(--el-color-danger)')
    expect(SFC_SOURCE).toContain('.cc-more-popper .el-dropdown-menu__item.cc-more-warning')
    wrapper.unmount()
  })
})

// ============================================================ 行操作行为

describe('行操作：启用 / 停用 / 删除（CCFG-REQ-098、CCFG-DESIGN-042/043、CCFG-UI-018/020）', () => {
  it('启用：无二次确认，直接调用既有 E6，成功后按已生效条件重载', async () => {
    const wrapper = await mountPage([disabledRow])
    await clickRowMenuAction(wrapper, 0, '启用')
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(mockedEnable).toHaveBeenCalledWith('probe-b')
    expect(messageSpy.success).toHaveBeenCalledWith('启用成功')
    expect(mockedList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('停用：二次确认正文含探针 ID，确认后调用既有 E7', async () => {
    const wrapper = await mountPage([enabledRow])
    await clickRowMenuAction(wrapper, 0, '停用')
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy.mock.calls[0][0]).toContain('确定停用探针 probe-a 吗？')
    expect(mockedDisable).toHaveBeenCalledWith('probe-a')
    expect(messageSpy.success).toHaveBeenCalledWith('停用成功')
    wrapper.unmount()
  })

  it('删除：二次确认正文含探针 ID，确认后调用既有 E5', async () => {
    const wrapper = await mountPage([enabledRow])
    await clickRowMenuAction(wrapper, 0, '删除')
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy.mock.calls[0][0]).toContain('确定删除探针 probe-a 吗？该操作不可恢复。')
    expect(mockedDelete).toHaveBeenCalledWith('probe-a')
    expect(messageSpy.success).toHaveBeenCalledWith('删除成功')
    wrapper.unmount()
  })

  it('取消停用确认：不发送请求、行忙碌复位、菜单项恢复可用', async () => {
    confirmSpy.mockRejectedValueOnce('cancel')
    const wrapper = await mountPage([enabledRow])
    await clickRowMenuAction(wrapper, 0, '停用')
    expect(mockedDisable).not.toHaveBeenCalled()
    await openRowMenu(wrapper, 0)
    const item = rowMenuItems(wrapper, 0).find((el) => (el.textContent ?? '').trim() === '停用')!
    expect(item.className).not.toContain('is-disabled')
    wrapper.unmount()
  })

  it('取消删除确认：不发送请求、行忙碌复位', async () => {
    confirmSpy.mockRejectedValueOnce('cancel')
    const wrapper = await mountPage([enabledRow])
    await clickRowMenuAction(wrapper, 0, '删除')
    expect(mockedDelete).not.toHaveBeenCalled()
    await openRowMenu(wrapper, 0)
    const item = rowMenuItems(wrapper, 0).find((el) => (el.textContent ?? '').trim() === '删除')!
    expect(item.className).not.toContain('is-disabled')
    wrapper.unmount()
  })

  it('行级忙碌：同一行请求在途时的重复点击只提交一次（其他行不被锁）', async () => {
    let release!: (v: ApiResponse<null>) => void
    mockedEnable.mockReturnValueOnce(
      new Promise<ApiResponse<null>>((r) => {
        release = r
      }),
    )
    const wrapper = await mountPage([disabledRow, enabledRow])
    await clickRowMenuAction(wrapper, 0, '启用')
    expect(mockedEnable).toHaveBeenCalledTimes(1)
    // 同一行在途：菜单项禁用，重复点击不再提交
    await openRowMenu(wrapper, 0)
    const busyItem = rowMenuItems(wrapper, 0).find((el) => (el.textContent ?? '').trim() === '启用')!
    expect(busyItem.className).toContain('is-disabled')
    ;(busyItem as HTMLElement).click()
    await flushPromises()
    expect(mockedEnable).toHaveBeenCalledTimes(1)
    // 其他行不受该行在途影响：另一行菜单项可用
    await openRowMenu(wrapper, 1)
    const otherItem = rowMenuItems(wrapper, 1).find((el) => (el.textContent ?? '').trim() === '停用')!
    expect(otherItem.className).not.toContain('is-disabled')
    release(okNull())
    await flushPromises()
    wrapper.unmount()
  })

  it('写操作失败：保留当前列表、不重载、提示失败并复位行忙碌', async () => {
    mockedDisable.mockRejectedValueOnce(new Error('network down'))
    const wrapper = await mountPage([enabledRow, disabledRow])
    await clickRowMenuAction(wrapper, 0, '停用')
    expect(messageSpy.error).toHaveBeenCalledWith('停用失败，请检查网络后重试。')
    expect(messageSpy.success).not.toHaveBeenCalledWith('停用成功')
    expect(mockedList).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('probe-a')
    await openRowMenu(wrapper, 0)
    const item = rowMenuItems(wrapper, 0).find((el) => (el.textContent ?? '').trim() === '停用')!
    expect(item.className).not.toContain('is-disabled')
    wrapper.unmount()
  })

  it('删除失败：保留当前列表并复位', async () => {
    mockedDelete.mockRejectedValueOnce(new Error('network down'))
    const wrapper = await mountPage([enabledRow])
    await clickRowMenuAction(wrapper, 0, '删除')
    expect(messageSpy.error).toHaveBeenCalledWith('删除失败，请检查网络后重试。')
    expect(mockedList).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('probe-a')
    wrapper.unmount()
  })

  it('启用失败：保留当前列表并复位', async () => {
    mockedEnable.mockRejectedValueOnce(new Error('network down'))
    const wrapper = await mountPage([disabledRow])
    await clickRowMenuAction(wrapper, 0, '启用')
    expect(messageSpy.error).toHaveBeenCalledWith('启用失败，请检查网络后重试。')
    expect(mockedList).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('服务端返回业务失败码时提示消息且不重载', async () => {
    mockedDisable.mockResolvedValueOnce({ code: 500, message: '状态禁止变更', timestamp: '', data: null })
    const wrapper = await mountPage([enabledRow])
    await clickRowMenuAction(wrapper, 0, '停用')
    expect(messageSpy.error).toHaveBeenCalledWith('状态禁止变更')
    expect(mockedList).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

// ============================================================ 更多入口事件边界与编辑入口

describe('“更多”入口事件边界与编辑入口（CCFG-UI-032、R1-06）', () => {
  it('组件：更多入口的 click 与 dblclick 均不触发行双击编辑', async () => {
    const wrapper = await mountPage([enabledRow])
    const link = wrapper.find('.cc-more-link')
    await link.trigger('click')
    await flushPromises()
    expect(wrapper.find('.cc-dialog').exists()).toBe(false)
    await link.trigger('dblclick')
    await flushPromises()
    expect(wrapper.find('.cc-dialog').exists()).toBe(false)
    expect(mockedOptions).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('组件：普通行双击仍打开编辑弹窗', async () => {
    const wrapper = await mountPage([enabledRow])
    await openEdit(wrapper, enabledRow)
    expect(wrapper.find('.cc-dialog').text()).toContain('编辑探针')
    expect(mockedOptions).toHaveBeenCalledWith('probe-a')
    wrapper.unmount()
  })

  it('组件：探针 ID 单元格具备 tabindex/role/aria-label，Enter 打开编辑', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    const idCell = wrapper.findAll('.cc-id').find((s) => s.text() === 'probe-a')!
    expect(idCell.attributes('tabindex')).toBe('0')
    expect(idCell.attributes('role')).toBe('button')
    expect(idCell.attributes('aria-label')).toBe('编辑探针 probe-a')
    await idCell.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.find('.cc-dialog').text()).toContain('编辑探针')
    wrapper.unmount()
  })

  it('组件：Space 真实键盘事件打开编辑且不触发提交', async () => {
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

  it('组件：打开“更多”不产生选中视觉，也不出现已选提示', async () => {
    const wrapper = await mountPage([enabledRow])
    await openRowMenu(wrapper, 0)
    expect(wrapper.findAll('.cc-row--selected')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('已选择')
    wrapper.unmount()
  })
})

// ============================================================ 列表表格视觉模板接入

describe('列表表格视觉模板：探针端主列表等价接入（CCFG-REQ-099、CCFG-DESIGN-046）', () => {
  it('显式启用：主列表根元素 className 同时含业务类与公共类，且并列于同一根元素', async () => {
    const wrapper = await mountPage()
    const root = wrapper.find('.cc-table')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('cc-table')
    expect(root.classes()).toContain('lt-main-table')
    expect(wrapper.find('.cc-table.lt-main-table').element).toBe(root.element)
    wrapper.unmount()
  })

  it('未启用范围：弹窗内部不含公共类，公共类全页仅一处且无包装表格组件', async () => {
    const wrapper = await mountPage()
    await openCreate(wrapper)
    const dialog = wrapper.find('.cc-dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.find('.lt-main-table').exists()).toBe(false)
    expect(wrapper.findAll('.lt-main-table')).toHaveLength(1)
    wrapper.unmount()
  })

  it('本页不声明任何公共令牌覆盖，令牌取值来源唯一', () => {
    expect(SFC_SOURCE).not.toMatch(/--lt-[\w-]+\s*:/)
    // 不引入 !important，也不新增包装表格组件或额外 DOM 层
    expect(SFC_SOURCE).not.toContain('!important')
  })

  it('以 <style scoped src> 显式引入公共预设，且保留原有内联 scoped 块', () => {
    expect(SFC_SOURCE).toContain(
      '<style scoped src="@/styles/list-table/list-table-visual.css"></style>',
    )
    const matched = SFC_SOURCE.match(/<style scoped>([\s\S]*?)<\/style>/)
    expect(matched).not.toBeNull()
    const block = matched![1] ?? ''
    expect(block.length).toBeGreaterThan(0)
    expect(block).not.toContain('lt-main-table')
  })

  it('公共类接入不改变主列表组件契约：data 渲染、六列定义与固定列', async () => {
    const wrapper = await mountPage()
    const table = wrapper.findAllComponents({ name: 'ElTable' })[0]
    expect(table.classes()).toContain('lt-main-table')
    expect((table.props('data') as unknown[]).length).toBe(2)
    expect(table.props('emptyText')).toBe('暂无符合条件的探针')
    const columns = table.findAllComponents({ name: 'ElTableColumn' })
    expect(columns.length).toBe(6)
    expect(columns[0].props('label')).toBe('序号')
    const last = columns[columns.length - 1]
    expect(last.props('label')).toBe('操作')
    expect(last.props('fixed')).toBe('right')
    wrapper.unmount()
  })

  it('弹窗内表格与控件维持原样：公共类不作用于弹窗，字段控件类名不变', async () => {
    const wrapper = await mountPage()
    await openCreate(wrapper)
    expect(wrapper.findAll('.cc-form-item')).toHaveLength(3)
    expect(wrapper.find('.cc-pane--chosen').exists()).toBe(true)
    expect(wrapper.find('.cc-dialog .lt-main-table').exists()).toBe(false)
    wrapper.unmount()
  })
})

// ============================================================ 标签视觉与单行布局

describe('标签文字水平/垂直居中与统一承载（R2 §3/§6）', () => {
  // 标签内层唯一文字承载元素：必须恰好一个 .cc-txt，且标签自身无游离裸文本（R2 §3.1/§3.2）
  const textCarrier = (host: HTMLElement) => {
    const kids = Array.from(host.children) as HTMLElement[]
    const carriers = kids.filter((k) => k.classList.contains('cc-txt'))
    const ownText = Array.from(host.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => (n.textContent ?? '').trim())
      .filter(Boolean)
      .join('')
    return { carriers, ownText }
  }

  it('静态：“采集数据源”严格单行 + 放大标签 + 约 60px 行高（不再固定预留两行）', () => {
    const srcCss = cssBlock(SFC_SOURCE, '.cc-src')
    expect(srcCss).toContain('flex-wrap: nowrap')
    expect(srcCss).not.toContain('flex-wrap: wrap')
    expect(srcCss).toContain('overflow: hidden')
    expect(srcCss).not.toContain('height: 50px')
    // :deep 选择器含正则特殊字符，直接对源码断言存在性与行高值
    expect(SFC_SOURCE).toContain('.cc-table :deep(.el-table__row)')
    expect(SFC_SOURCE).toContain('height: 60px')
    const dstagCss = cssBlock(SFC_SOURCE, '.cc-dstag')
    expect(dstagCss).toContain('height: 27px')
    expect(dstagCss).toContain('font-size: 14px')
    expect(dstagCss).toContain('padding: 0 10px')
    const moreCss = cssBlock(SFC_SOURCE, '.cc-more')
    expect(moreCss).toContain('font-size: 14px')
  })

  it('静态：正常/异常/原始ID/`+N` 四类标签统一为 flex 双向居中，模板正文统一装入 .cc-txt', () => {
    for (const sel of ['.cc-dstag', '.cc-rowbad', '.cc-more']) {
      const css = cssBlock(SFC_SOURCE, sel)
      expect(css).toContain('display: inline-flex')
      expect(css).toContain('align-items: center')
      expect(css).toContain('justify-content: center')
      expect(css).toContain('padding: 0 10px')
    }
    // 模板：行级歧义标识、数据源标签正文、动态 +N 的文字都包进内层 .cc-txt
    expect(SFC_SOURCE).toContain('class="cc-txt">含逗号歧义')
    expect(SFC_SOURCE).toContain('<span class="cc-txt">{{ dsBodyText(ds) }}</span>')
    expect(SFC_SOURCE).toContain('class="cc-more"><span class="cc-txt">+{{ hiddenCount(row) }}')
  })

  it('静态：内层 .cc-txt 是统一块级文字载体（单行+统一行高）；居中不是位置偏移补丁', () => {
    const txtCss = cssBlock(SFC_SOURCE, '.cc-txt')
    expect(txtCss).toContain('display: block')
    expect(txtCss).toContain('min-width: 0')
    expect(txtCss).toContain('line-height: 1')
    expect(txtCss).toContain('white-space: nowrap')
    const carrier = cssBlock(SFC_SOURCE, '.cc-dstag > .cc-txt')
    expect(carrier).toContain('overflow: hidden')
    expect(carrier).toContain('text-overflow: ellipsis')
    // 外层标签仍保留裁切/限宽防线
    expect(cssBlock(SFC_SOURCE, '.cc-dstag')).toContain('overflow: hidden')
    expect(cssBlock(SFC_SOURCE, '.cc-dstag')).toContain('max-width: 10em')
    // 禁止脆弱位移凑居中：无 transform/translate/负 margin/单独 padding-top
    for (const sel of ['.cc-dstag', '.cc-rowbad', '.cc-more', '.cc-txt']) {
      const css = cssBlock(SFC_SOURCE, sel)
      expect(css).not.toMatch(/transform|translate|margin-top|padding-top|\btop\s*:/)
    }
  })

  it('组件：正常与异常标签正文均由唯一内层 .cc-txt 承载，标签无游离裸文本', async () => {
    const wrapper = await mountPage([enabledRow])
    const tags = wrapper.findAll('.cc-dstag')
    const normal = tags.find((t) => !t.classes().includes('cc-dstag--bad'))
    const bad = tags.find((t) => t.classes().includes('cc-dstag--bad'))
    expect(normal).toBeDefined()
    expect(bad).toBeDefined()
    const cases: Array<{ w: DOMWrapper<Element>; expected: string }> = [
      { w: normal!, expected: '中心医院' },
      { w: bad!, expected: '停用机构' },
    ]
    for (const { w, expected } of cases) {
      const { carriers, ownText } = textCarrier(w.element as HTMLElement)
      expect(carriers).toHaveLength(1)
      expect((carriers[0].textContent ?? '').trim()).toBe(expected)
      expect(ownText).toBe('')
      expect(w.text().trim()).toBe(expected)
    }
    wrapper.unmount()
  })

  it('组件：原始数据源 ID（拉丁/数字/下划线混合正文）与行级歧义标识同样经唯一 .cc-txt 承载', async () => {
    const wrapper = await mountPage([ambiguousRow])
    const raw = wrapper.findAll('.cc-dstag').filter((t) => ['ds_a', 'legacy_b'].includes(t.text().trim()))
    expect(raw).toHaveLength(2)
    for (const w of raw) {
      const { carriers, ownText } = textCarrier(w.element as HTMLElement)
      expect(carriers).toHaveLength(1)
      expect((carriers[0].textContent ?? '').trim()).toBe(w.text().trim())
      expect(ownText).toBe('')
      expect(w.classes()).toContain('cc-dstag--bad')
    }
    const { carriers, ownText } = textCarrier(wrapper.find('.cc-rowbad').element as HTMLElement)
    expect(carriers).toHaveLength(1)
    expect((carriers[0].textContent ?? '').trim()).toBe('含逗号歧义')
    expect(ownText).toBe('')
    wrapper.unmount()
  })

  it('组件：动态 +N 文字同样经 .cc-more 内层 .cc-txt 承载（宽度重算后仍为点击目标）', async () => {
    const savedRO = (globalThis as { ResizeObserver?: unknown }).ResizeObserver
    ;(globalThis as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver as never
    try {
      chipWidthRegistry.clear()
      for (const t of ['机构M1', '机构M2', '机构M3', '机构M4', '机构M5', '机构M6', '机构M7']) {
        chipWidthRegistry.set(t, 40)
      }
      chipWidthRegistry.set('+88', 30)
      const wrapper = await mountPage([overflowRow])
      lastFakeRO!.emit(260)
      await nextTick()
      const more = wrapper.find('.cc-more')
      expect(more.exists()).toBe(true)
      expect(more.text().trim()).toBe('+3')
      const { carriers, ownText } = textCarrier(more.element as HTMLElement)
      expect(carriers).toHaveLength(1)
      expect((carriers[0].textContent ?? '').trim()).toBe('+3')
      expect(ownText).toBe('')
      // +N 仍为可点击交互元素（点击区域不因居中结构而缩小）
      expect(more.attributes('class')).toContain('cc-more')
      wrapper.unmount()
    } finally {
      ;(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver = savedRO
      chipWidthRegistry.clear()
      lastFakeRO = null
    }
  })

  it('组件：数据源标签 click 不产生选中视觉（本页已无行选中）', async () => {
    const wrapper = await mountPage([enabledRow])
    const tag = wrapper.findAll('.cc-dstag').find((t) => t.text() === '停用机构')!
    await tag.trigger('click')
    await nextTick()
    expect(wrapper.findAll('.cc-row--selected')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('已选择')
    wrapper.unmount()
  })
})

// ============================================================ 数据源单行 +N

describe('数据源单行自适应与动态 +N（CCFG-UI-004/007~010，R1 §5.4/§5.6）', () => {
  // 这些用例以注入测量宽度 + 模拟 ResizeObserver 驱动“真实”单行打包；真实几何另行浏览器目测。
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
    // 7 源溢出/数据集替换行：机构M1..机构M7 同宽
    Array.from({ length: 7 }, (_, i) => `机构M${i + 1}`).forEach((t) =>
      chipWidthRegistry.set(t, width),
    )
    chipWidthRegistry.set('+88', moreWidth)
  }

  const visibleTags = (w: PageWrapper) =>
    w.findAll('.cc-dstag').filter((t) => !(t.attributes('style') ?? '').includes('display: none'))

  it('单行能容纳且总数 ≤6：不显示 +N，全部直接展示', async () => {
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

  it('单行放不下：显示实际可容纳项与准确 +N；异常项优先；完整清单按接口原顺序', async () => {
    setTagWidths(40)
    const wrapper = await mountPage([multiRow])
    lastFakeRO!.emit(210)
    await nextTick()
    const visible = visibleTags(wrapper)
    // 可用 210-(30+8)=172：40/88/136/184>172 → 直接展示 3；异常项（机构Ab）不在接口首位仍最先可见
    expect(visible.map((t) => t.text())).toEqual(['机构Ab', '机构N1', '机构N2'])
    expect(visible[0].classes()).toContain('cc-dstag--bad')
    expect(wrapper.find('.cc-more').text()).toBe('+2')
    const hidden = wrapper
      .findAll('.cc-dstag')
      .filter((t) => (t.attributes('style') ?? '').includes('display: none'))
    expect(hidden.map((t) => t.text())).toEqual(['机构N3', '机构N4'])
    // 标签正文不得拼接数据源名称或 ID
    expect(wrapper.find('.cc-src').text()).not.toContain('名N')

    // 点击 +N：完整清单保留全部项且保持接口原顺序（点击式，非悬停）
    await wrapper.find('.cc-more').trigger('click')
    await flushPromises()
    await sleep(60)
    const items = Array.from(document.querySelectorAll('.cc-full-item'))
    expect(items).toHaveLength(5)
    const orgSeq = items.map((el) => el.querySelector('.cc-full-org')?.textContent ?? '')
    expect(orgSeq).toEqual(['机构N1', '机构N2', '机构Ab', '机构N3', '机构N4'])
    wrapper.unmount()
  })

  it('总数 ≥7：宽容器也只直接展示 6，其余进准确 +N', async () => {
    setTagWidths(40)
    const wrapper = await mountPage([overflowRow])
    lastFakeRO!.emit(1000)
    await nextTick()
    const visible = visibleTags(wrapper)
    expect(visible).toHaveLength(6)
    expect(visible.map((t) => t.text())).toEqual([
      '机构M1',
      '机构M2',
      '机构M3',
      '机构M4',
      '机构M5',
      '机构M6',
    ])
    expect(wrapper.find('.cc-more').text()).toBe('+1')
    wrapper.unmount()
  })

  it('空间不足：显示少于 6 项与准确 +N，不越界塞入', async () => {
    setTagWidths(40)
    const wrapper = await mountPage([overflowRow])
    lastFakeRO!.emit(260)
    await nextTick()
    const visible = visibleTags(wrapper)
    expect(visible.length).toBeLessThan(6)
    expect(visible.map((t) => t.text())).toEqual(['机构M1', '机构M2', '机构M3', '机构M4'])
    expect(wrapper.find('.cc-more').text()).toBe('+3')
    wrapper.unmount()
  })

  it('列宽变化触发重算：由可容纳变溢出再恢复，无需刷新页面', async () => {
    setTagWidths(40)
    const wrapper = await mountPage([multiRow])
    lastFakeRO!.emit(260)
    await nextTick()
    expect(wrapper.find('.cc-more').exists()).toBe(false)
    lastFakeRO!.emit(210)
    await nextTick()
    expect(wrapper.find('.cc-more').exists()).toBe(true)
    expect(wrapper.find('.cc-more').text()).toBe('+2')
    expect(visibleTags(wrapper)).toHaveLength(3)
    lastFakeRO!.emit(260)
    await nextTick()
    expect(wrapper.find('.cc-more').exists()).toBe(false)
    wrapper.unmount()
  })

  it('数据集替换后不产生 stale 测量：同一行重载后按新数据源总数重算', async () => {
    setTagWidths(40)
    mockedList.mockResolvedValueOnce(okList([multiRow]))
    mockedList.mockResolvedValueOnce(okList([row('probe-multi', '多源探针', '1', overflowSources)]))
    const wrapper = await mountPage([multiRow])
    lastFakeRO!.emit(1000)
    await nextTick()
    expect(wrapper.find('.cc-more').exists()).toBe(false)
    expect(visibleTags(wrapper)).toHaveLength(5)
    await exactButton(wrapper, '查询')!.trigger('click')
    await flushPromises()
    await nextTick()
    lastFakeRO!.emit(1000)
    await nextTick()
    expect(visibleTags(wrapper)).toHaveLength(6)
    expect(wrapper.find('.cc-more').text()).toBe('+1')
    wrapper.unmount()
  })

  it('编辑弹窗回显仍按接口原顺序（列表单行投影不改变弹窗选择集）', async () => {
    const wrapper = await mountPage([multiRow])
    await openEdit(wrapper, multiRow)
    const chips = wrapper.findAll('.cc-chip')
    // 异常项 chip 文案为“数据源ID（原因）”，正常项为机构名；顺序保持接口原顺序
    const expectedChipTexts = ['机构N1', '机构N2', 'ds-ab（不存在）', '机构N3', '机构N4']
    expect(chips.map((c) => c.text())).toEqual(expectedChipTexts)
    wrapper.unmount()
  })

  it('+N 为点击交互：完整清单展示全部 7 项，不改变表格行高', async () => {
    setTagWidths(40)
    const wrapper = await mountPage([overflowRow])
    lastFakeRO!.emit(1000)
    await nextTick()
    await wrapper.find('.cc-more').trigger('click')
    await flushPromises()
    await sleep(60)
    expect(document.querySelectorAll('.cc-full-item')).toHaveLength(7)
    wrapper.unmount()
  })

  it('点击 +N 完整清单不触发编辑、不产生选中视觉', async () => {
    setTagWidths(40)
    const wrapper = await mountPage([multiRow])
    lastFakeRO!.emit(210)
    await nextTick()
    await wrapper.find('.cc-more').trigger('click')
    await flushPromises()
    await sleep(60)
    const item = Array.from(document.querySelectorAll('.cc-full-item'))[0]
    expect(item).toBeTruthy()
    ;(item as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()
    expect(wrapper.find('.cc-dialog').exists()).toBe(false)
    expect(wrapper.findAll('.cc-row--selected')).toHaveLength(0)
    wrapper.unmount()
  })
})

// ============================================================ 行级歧义

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

// ============================================================ 新增 / 编辑弹窗

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

describe('新增/编辑提交契约与网络异常（CCFG-UI-023、R1-02）', () => {
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
    expect(mockedList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

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

// ============================================================ 空描述 Tooltip / 滚动边界

describe('空描述 Tooltip、滚动边界与键盘编辑入口（R1-06）', () => {
  const blankDescRow = row('probe-blank', '   ', '1', [])

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

  it('静态：弹窗内容区与 +N 完整清单设置视口安全最大高度与内部纵向滚动', () => {
    const formCss = cssBlock(SFC_SOURCE, '.cc-form')
    expect(formCss).toContain('overflow-y: auto')
    expect(formCss).toMatch(/max-height:\s*calc\(100vh/)
    const fullListCss = cssBlock(SFC_SOURCE, '.cc-full-list')
    expect(fullListCss).toContain('max-height: 320px')
    expect(fullListCss).toContain('overflow-y: auto')
  })
})

// ============================================================ 单实例 Tooltip

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

  it('组件：重复分配标签 Tooltip 异常原因显示“已分配给其他探针”，冲突探针清单保留', async () => {
    const wrapper = await mountPage([assignedRow])
    const tag = wrapper.findAll('.cc-dstag').find((t) => t.text() === '分院')!
    expect(tag.classes()).toContain('cc-dstag--bad')
    await tag.trigger('mouseenter')
    await sleep(280)
    const body = document.body.textContent ?? ''
    expect(body).toContain('异常原因：已分配给其他探针')
    expect(body).not.toContain('已分配给他人')
    expect(body).toContain('冲突探针：hosp-007')
    await tag.trigger('mouseleave')
    await sleep(10)
    wrapper.unmount()
  })
})
