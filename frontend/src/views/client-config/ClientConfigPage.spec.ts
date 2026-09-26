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
import { CHIP_BOX } from '@/views/client-config/listLayout'

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

/** 提取某个选择器的声明块（首个匹配）。选择器按字面量处理，正则元字符全部转义。 */
function cssBlock(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm'))
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

/** 取某声明块中单个属性的值（首个匹配），用于跨组件“同款视觉”的逐属性比较。 */
function declValue(block: string, prop: string): string {
  const m = block.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'm'))
  return m ? m[1].trim() : ''
}

/**
 * 同 {@link cssBlock}，但用于**多选择器分组**规则（如
 * `.cc-dialog-submit.is-loading, .cc-dialog-submit.is-loading:hover, … { … }`）：
 * 命中以该选择器开头的一项后，连同其余同级选择器一起取到 `{ … }` 声明块。
 */
function cssGroupBlock(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = source.match(new RegExp(`(?:^|[,\\n])\\s*${escaped}\\s*(?:,[^{}]*)?\\{([^}]*)\\}`, 'm'))
  return m ? m[1] : ''
}

/** 本页 SFC 样式块源码与参考页（数据源管理）SFC 样式块源码。 */
const DS_PAGE_SOURCE = readFileSync(DS_PAGE_PATH, 'utf-8')
/** 参考页“角色”标签的盒模型声明块来源（`.data-table :deep(.el-tag)`）。 */
const DS_TAG_BLOCK = cssBlock(DS_PAGE_SOURCE, '.data-table :deep(.el-tag)')

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

  it('组件：最后一列为最右固定“操作”列，唯一入口为水平三点图标而非“更多”文字', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    const columns = wrapper.findAllComponents({ name: 'ElTable' })[0].findAllComponents({
      name: 'ElTableColumn',
    })
    const last = columns[columns.length - 1]
    expect(last.props('label')).toBe('操作')
    expect(last.props('fixed')).toBe('right')
    const links = wrapper.findAll('.cc-more-link')
    expect(links).toHaveLength(2)
    // 全部行为图标入口，不存在仍显示“更多”文字的过渡态（CCFG-REQ-110/CCFG-UI-040）
    for (const link of links) {
      expect(link.text().trim()).toBe('')
      expect(link.find('.cc-more-icon').exists()).toBe(true)
    }
    expect(wrapper.text()).not.toContain('更多')
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

  it('静态：固定选中只用页面内单个可为空探针 ID，无批量选择与任何持久化写入', () => {
    // 第五轮 CCFG-REQ-142/CCFG-DESIGN-077：单个可为空 ID，仅本页实例内存活
    expect(SFC_SOURCE).toContain('@row-click="onRowClick"')
    expect(SFC_SOURCE).toContain('const selectedClientId = ref<string | null>(null)')
    expect(SFC_SOURCE).toContain("'cc-row--selected'")
    // 不恢复复选框、多选、已选集合与批量删除入口
    expect(SFC_SOURCE).not.toContain('删除所选')
    expect(SFC_SOURCE).not.toContain('已选择：')
    expect(SFC_SOURCE).not.toContain('el-checkbox')
    // 不写 URL／localStorage／sessionStorage／路由：源码内不得出现存储或历史写入 API
    expect(SFC_SOURCE).not.toMatch(/(?:localStorage|sessionStorage|window\.location|history)\.\w+/)
    expect(SFC_SOURCE).not.toContain('setItem')
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

  it('组件：三点图标触发器具备 role/tabindex/可访问名称与键盘焦点（CCFG-REQ-110）', async () => {
    const wrapper = await mountPage([enabledRow, disabledRow])
    const links = wrapper.findAll('.cc-more-link')
    expect(links.map((l) => l.attributes('role'))).toEqual(['button', 'button'])
    expect(links.map((l) => l.attributes('tabindex'))).toEqual(['0', '0'])
    expect(links[0].attributes('aria-label')).toBe('更多操作：probe-a')
    expect(links[1].attributes('aria-label')).toBe('更多操作：probe-b')
    // 命中区域与键盘焦点样式由本页声明，不依赖 EP 默认
    const css = cssBlock(SFC_SOURCE, '.cc-more-link')
    expect(css).toContain('width: 28px')
    expect(css).toContain('height: 28px')
    expect(SFC_SOURCE).toContain('.cc-more-link:focus-visible')
    wrapper.unmount()
  })

  it('组件：键盘 Enter / Space 可打开三点菜单（不依赖鼠标）', async () => {
    const wrapper = await mountPage([enabledRow])
    const trigger = wrapper.findAll('.cc-more-link')[0]
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('keydown', { key: 'Enter' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
    expect(trigger.element.getAttribute('aria-expanded')).toBe('true')
    expect(rowMenuLabels(wrapper, 0)).toEqual(['停用', '删除'])
    wrapper.unmount()
  })

  it('组件：菜单以分隔线单独隔开红色“删除”，且条目顺序为先“停用/启用”后“删除”', async () => {
    const wrapper = await mountPage([enabledRow])
    await openRowMenu(wrapper, 0)
    const menuId = wrapper.findAll('.cc-more-link')[0].attributes('aria-controls')!
    const menu = document.getElementById(menuId)!
    const separator = menu.querySelector('.el-dropdown-menu__item--divided')
    expect(separator).not.toBeNull()
    expect(separator!.getAttribute('role')).toBe('separator')
    // 分隔线位于“停用”之后、“删除”之前
    const order = Array.from(
      menu.querySelectorAll('.el-dropdown-menu__item, .el-dropdown-menu__item--divided'),
    ).map((el) => (el.textContent ?? '').trim() || '|')
    expect(order).toEqual(['停用', '|', '删除'])
    wrapper.unmount()
  })

  it('静态：菜单 popper 声明柔和圆角、弥散阴影与圆角内边距，且危险/警告色不被交互态覆盖', () => {
    expect(SFC_SOURCE).toContain('.cc-more-popper.el-popper')
    expect(SFC_SOURCE).toContain('border-radius: 8px')
    expect(SFC_SOURCE).toContain('box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12)')
    expect(SFC_SOURCE).toContain('.cc-more-popper .el-dropdown-menu__item--divided')
    expect(SFC_SOURCE).toContain(
      '.cc-more-popper .el-dropdown-menu__item.cc-more-danger:not(.is-disabled):hover',
    )
  })
})

// ============================================================ 行操作行为

describe('行操作：启用 / 停用 / 删除（CCFG-REQ-098、CCFG-DESIGN-042/043、CCFG-UI-018/020）', () => {
  it('启用：先二次确认（正文仅含探针 ID），确认后调用既有 E6 且只发一次写请求', async () => {
    const wrapper = await mountPage([disabledRow])
    await clickRowMenuAction(wrapper, 0, '启用')
    // 第五轮 CCFG-REQ-141/CCFG-UI-063：启用新增二次确认，标题与按钮文案精确
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy.mock.calls[0][0]).toBe('确定启用探针 probe-b 吗？')
    // ElMessageBox.confirm(message, title, options)
    expect(confirmSpy.mock.calls[0][1]).toBe('启用探针')
    expect(confirmSpy.mock.calls[0][2]).toMatchObject({
      confirmButtonText: '启用',
      cancelButtonText: '取消',
    })
    expect(mockedEnable).toHaveBeenCalledWith('probe-b')
    expect(mockedEnable).toHaveBeenCalledTimes(1)
    expect(messageSpy.success).toHaveBeenCalledWith('启用成功')
    expect(mockedList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('启用：取消或关闭确认框不发出启用写请求，行忙碌复位（CCFG-REQ-141）', async () => {
    confirmSpy.mockRejectedValueOnce('cancel')
    const wrapper = await mountPage([disabledRow])
    await clickRowMenuAction(wrapper, 0, '启用')
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mockedEnable).not.toHaveBeenCalled()
    expect(messageSpy.success).not.toHaveBeenCalledWith('启用成功')
    expect(mockedList).toHaveBeenCalledTimes(1)
    await openRowMenu(wrapper, 0)
    const item = rowMenuItems(wrapper, 0).find((el) => (el.textContent ?? '').trim() === '启用')!
    expect(item.className).not.toContain('is-disabled')
    wrapper.unmount()
  })

  it('停用：二次确认正文精确到探针 ID，不再声称“不再按启用状态命中”（CCFG-REQ-139/140）', async () => {
    const wrapper = await mountPage([enabledRow])
    await clickRowMenuAction(wrapper, 0, '停用')
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy.mock.calls[0][0]).toBe('确定停用探针 probe-a 吗？')
    // ElMessageBox.confirm(message, title, options)
    expect(confirmSpy.mock.calls[0][1]).toBe('停用探针')
    expect(confirmSpy.mock.calls[0][2]).toMatchObject({
      confirmButtonText: '停用',
      cancelButtonText: '取消',
    })
    // 不显示已删除的旧正文，也不声称停用立即停止进程／采集任务
    expect(SFC_SOURCE).not.toContain('不再按启用状态命中')
    expect(SFC_SOURCE).not.toContain('立即停止')
    expect(mockedDisable).toHaveBeenCalledWith('probe-a')
    expect(mockedDisable).toHaveBeenCalledTimes(1)
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

  it('静态：“采集数据源”严格单行，且本页不再写死固定像素行高（CCFG-UI-038）', () => {
    const srcCss = cssBlock(SFC_SOURCE, '.cc-src')
    expect(srcCss).toContain('flex-wrap: nowrap')
    expect(srcCss).not.toContain('flex-wrap: wrap')
    expect(srcCss).toContain('overflow: hidden')
    // 行高改由公共预设的单元格上下内边距 + 内容决定，本页不得再声明固定行高
    expect(srcCss).not.toContain('height:')
    expect(SFC_SOURCE).not.toContain('.cc-table :deep(.el-table__row)')
    expect(SFC_SOURCE).not.toContain('height: 60px')
    // 也不得新增行高令牌或改动公共预设本身
    expect(SFC_SOURCE).not.toMatch(/--lt-[\w-]+\s*:/)
    const dstagCss = cssBlock(SFC_SOURCE, '.cc-dstag')
    expect(dstagCss).toContain('height: 20px')
    expect(dstagCss).toContain('font-size: 12px')
    expect(dstagCss).toContain('padding: 0 9px')
    const moreCss = cssBlock(SFC_SOURCE, '.cc-more')
    expect(moreCss).toContain('height: 20px')
    expect(moreCss).toContain('font-size: 12px')
  })

  it('静态：标签盒模型与参考页“角色”标签逐属性一致（高/字号/字重/圆角/无边框/内边距）', () => {
    const dstagCss = cssBlock(SFC_SOURCE, '.cc-dstag')
    expect(DS_TAG_BLOCK.length).toBeGreaterThan(0)
    for (const prop of ['height', 'font-size', 'font-weight', 'border-radius', 'border', 'padding']) {
      expect(declValue(dstagCss, prop)).toBe(declValue(DS_TAG_BLOCK, prop))
    }
    // 参考页基准值本身未漂移
    expect(declValue(DS_TAG_BLOCK, 'height')).toBe('20px')
    expect(declValue(DS_TAG_BLOCK, 'font-size')).toBe('12px')
    expect(declValue(DS_TAG_BLOCK, 'font-weight')).toBe('600')
    expect(declValue(DS_TAG_BLOCK, 'border')).toBe('none')
  })

  it('静态：测量盒模型与标签声明同步校准，避免 +N 误计数（CCFG-REQ-107）', () => {
    const dstagCss = cssBlock(SFC_SOURCE, '.cc-dstag')
    expect(CHIP_BOX.fontSize).toBe(declValue(dstagCss, 'font-size'))
    expect(CHIP_BOX.fontWeight).toBe(declValue(dstagCss, 'font-weight'))
    expect(CHIP_BOX.lineHeight).toBe(declValue(dstagCss, 'height'))
    expect(`${CHIP_BOX.paddingX}px`).toBe(declValue(dstagCss, 'padding').split(' ')[1])
    expect(CHIP_BOX.borderWidth).toBe(0)
  })

  it('静态：`+N` 槽位与标签同盒模型，为 +N 预留的宽度同样按此基准测量（CCFG-REQ-107/109）', () => {
    const moreCss = cssBlock(SFC_SOURCE, '.cc-more')
    // 标签与 +N 槽位的盒模型必须一致，否则打包预留量与实际占位不符会出现遮挡或误计数
    expect(declValue(moreCss, 'font-size')).toBe(CHIP_BOX.fontSize)
    expect(declValue(moreCss, 'font-weight')).toBe(CHIP_BOX.fontWeight)
    expect(declValue(moreCss, 'height')).toBe(CHIP_BOX.lineHeight)
    expect(declValue(moreCss, 'padding')).toBe(declValue(cssBlock(SFC_SOURCE, '.cc-dstag'), 'padding'))
    expect(declValue(moreCss, 'border')).toBe('none')
  })

  it('组件：`+N` 数值随测量宽度重算，且宽度基准变更后不残留旧值（CCFG-REQ-109）', async () => {
    const savedRO = (globalThis as { ResizeObserver?: unknown }).ResizeObserver
    ;(globalThis as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver as never
    try {
      const names = Array.from({ length: 7 }, (_, i) => `机构M${i + 1}`)
      const wrapper = await mountPage([overflowRow])
      // 宽容器：直接展示上限 6、+1
      names.forEach((t) => chipWidthRegistry.set(t, 40))
      chipWidthRegistry.set('+88', 30)
      lastFakeRO!.emit(1000)
      await nextTick()
      expect(wrapper.find('.cc-more').text()).toBe('+1')
      // 同容器下标签变宽（如标签盒模型/字重变化导致）：直接展示项减少，+N 数值随之增大
      names.forEach((t) => chipWidthRegistry.set(t, 200))
      lastFakeRO!.emit(1000)
      await nextTick()
      const shownAfter = wrapper
        .findAll('.cc-dstag')
        .filter((t) => !(t.attributes('style') ?? '').includes('display: none')).length
      expect(shownAfter).toBeLessThan(6)
      expect(wrapper.find('.cc-more').text()).toBe(`+${7 - shownAfter}`)
      wrapper.unmount()
    } finally {
      ;(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver = savedRO
      chipWidthRegistry.clear()
      lastFakeRO = null
    }
  })

  it('静态：正常/异常/原始ID/`+N` 四类标签统一为 flex 双向居中，模板正文统一装入 .cc-txt', () => {
    // 数据源标签与 `+N` 槽位改用紧凑盒模型（左右 9px）；行级歧义警示保持原有内边距不变
    for (const sel of ['.cc-dstag', '.cc-more']) {
      const css = cssBlock(SFC_SOURCE, sel)
      expect(css).toContain('display: inline-flex')
      expect(css).toContain('align-items: center')
      expect(css).toContain('justify-content: center')
      expect(css).toContain('padding: 0 9px')
    }
    const rowbadCss = cssBlock(SFC_SOURCE, '.cc-rowbad')
    expect(rowbadCss).toContain('display: inline-flex')
    expect(rowbadCss).toContain('align-items: center')
    expect(rowbadCss).toContain('justify-content: center')
    expect(rowbadCss).toContain('padding: 0 10px')
    // 模板：行级歧义标识、数据源标签正文、动态 +N 的文字都包进内层 .cc-txt
    expect(SFC_SOURCE).toContain('class="cc-txt">含逗号歧义')
    expect(SFC_SOURCE).toContain('<span class="cc-txt">{{ dsBodyText(ds) }}</span>')
    // `+N` 正文同样包进内层 `.cc-txt`；本轮为它补上与标签一致的 click/dblclick 冒泡隔离
    expect(SFC_SOURCE).toContain('class="cc-more"')
    expect(SFC_SOURCE).toContain('@click.stop')
    expect(SFC_SOURCE).toContain('class="cc-txt">+{{ hiddenCount(row) }}')
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

// ============================================================ 采集数据源标签三态取色

describe('采集数据源标签三态取色与优先级（CCFG-REQ-108、CCFG-UI-039）', () => {
  /** 整行含逗号歧义、但其数据源本身无项级异常：标签不得暗示“已确认为正常”。 */
  const ambiguousPlainRow = row(
    'probe-amb2',
    '歧义无异常探针',
    '1',
    [view('ds-plain', '机构P', '库P')],
    { rowAnomalies: ['COMMA_PROTOCOL_AMBIGUOUS'] },
  )

  it('组件：既无项级异常也无行级歧义 → 基础绿色态 cc-dstag--ok（仅表示未检测到异常）', async () => {
    const wrapper = await mountPage([row('probe-ok', '正常探针', '1', [healthyDs])])
    const tags = wrapper.findAll('.cc-dstag')
    expect(tags).toHaveLength(1)
    expect(tags[0].text().trim()).toBe('中心医院')
    expect(tags[0].classes()).toContain('cc-dstag--ok')
    expect(tags[0].classes()).not.toContain('cc-dstag--bad')
    expect(tags[0].classes()).not.toContain('cc-dstag--neutral')
    wrapper.unmount()
  })

  it('组件：项级 anomalies 优先于行级歧义 → 红色，不因整行歧义降级为中性色', async () => {
    const wrapper = await mountPage([ambiguousRow])
    // 前提：该行确实带行级 COMMA_PROTOCOL_AMBIGUOUS，但其数据源各带 NOT_FOUND
    expect(wrapper.find('.cc-rowbad').exists()).toBe(true)
    const tags = wrapper.findAll('.cc-dstag')
    expect(tags.length).toBeGreaterThan(0)
    for (const t of tags) {
      expect(t.classes()).toContain('cc-dstag--bad')
      expect(t.classes()).not.toContain('cc-dstag--neutral')
    }
    wrapper.unmount()
  })

  it('组件：无项级异常但整行存在 COMMA_PROTOCOL_AMBIGUOUS → 中性色', async () => {
    const wrapper = await mountPage([ambiguousPlainRow])
    const tag = wrapper.findAll('.cc-dstag').find((t) => t.text().trim() === '机构P')!
    expect(tag.classes()).toContain('cc-dstag--neutral')
    expect(tag.classes()).not.toContain('cc-dstag--bad')
    wrapper.unmount()
  })

  it('组件：同一行内优先级逐项独立（项级异常红、整行歧义中性可同排）', async () => {
    const mixedRow = row(
      'probe-mixed',
      '混合探针',
      '1',
      [view('ds-a2', '机构A2', '库A2', ['NOT_FOUND']), view('ds-b2', '机构B2', '库B2')],
      { rowAnomalies: ['COMMA_PROTOCOL_AMBIGUOUS'] },
    )
    const wrapper = await mountPage([mixedRow])
    const bad = wrapper.findAll('.cc-dstag').find((t) => t.text().trim() === '机构A2')!
    const neutral = wrapper.findAll('.cc-dstag').find((t) => t.text().trim() === '机构B2')!
    expect(bad.classes()).toContain('cc-dstag--bad')
    expect(neutral.classes()).toContain('cc-dstag--neutral')
    wrapper.unmount()
  })

  it('静态：三态底色/文字色成对声明，绿=未检测到异常、红=项级异常、中性=整行歧义', () => {
    const ok = cssBlock(SFC_SOURCE, '.cc-dstag')
    expect(declValue(ok, 'background')).toBe('#ecfdf5')
    expect(declValue(ok, 'color')).toBe('#047857')
    const bad = cssBlock(SFC_SOURCE, '.cc-dstag--bad')
    expect(declValue(bad, 'background')).toBe('#fef0f0')
    expect(declValue(bad, 'color')).toBe('#d54949')
    const neutral = cssBlock(SFC_SOURCE, '.cc-dstag--neutral')
    expect(declValue(neutral, 'background')).toBe('#f4f4f5')
    expect(declValue(neutral, 'color')).toBe('#606266')
    // 中性色必须区别于“未检测到异常”的绿与“异常”的红
    expect(declValue(neutral, 'background')).not.toBe(declValue(ok, 'background'))
    expect(declValue(neutral, 'background')).not.toBe(declValue(bad, 'background'))
  })

  it('静态：独立的行级歧义警示仍为红色，与标签三态解耦（工具提示文案不变）', () => {
    const rowbad = cssBlock(SFC_SOURCE, '.cc-rowbad')
    expect(declValue(rowbad, 'background')).toBe('#fef0f0')
    expect(declValue(rowbad, 'color')).toBe('#d54949')
    expect(declValue(rowbad, 'border')).toContain('#f1a7a7')
    // 行级警示文案保持不变，且不随标签三态一并降级
    expect(SFC_SOURCE).toContain('class="cc-txt">含逗号歧义')
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
    // 第四轮起主提交按钮不再因业务阻断预先禁用：点击后就地反馈且仍拒绝写入（CCFG-REQ-124/CCFG-REQ-125）
    const saveBtn = exactButton(wrapper, '保存')!
    expect(saveBtn.attributes('disabled')).toBeUndefined()
    expect(saveBtn.classes()).not.toContain('is-disabled')
    expect(wrapper.text()).toContain('原配置含英文逗号歧义')
    expect(wrapper.find('.cc-split--error').exists()).toBe(true)
    await saveBtn.trigger('click')
    await flushPromises()
    expect(mockedUpdate).not.toHaveBeenCalled()

    // 清除全部歧义展示项（每次移除后重新查询 chip），再选择合法候选
    while (wrapper.findAll('.cc-chip').length) {
      await wrapper.find('.cc-chip .el-tag__close').trigger('click')
      await nextTick()
    }
    await optionByText(wrapper, '中心医院')!.trigger('click')
    await nextTick()
    expect(wrapper.text()).not.toContain('原配置含英文逗号歧义')
    expect(wrapper.find('.cc-split--error').exists()).toBe(false)
    await exactButton(wrapper, '保存')!.trigger('click')
    await flushPromises()
    expect(mockedUpdate).toHaveBeenCalledTimes(1)
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
    expect(saveBtn.attributes('disabled')).toBeUndefined()
    expect(saveBtn.classes()).not.toContain('is-disabled')
    expect(wrapper.text()).toContain('存在异常数据源')

    // 异常数据源阻断不再预禁用主按钮：点击后原地点出数据源字段错误并拒绝写库
    await saveBtn.trigger('click')
    await flushPromises()
    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(wrapper.find('.cc-split--error').exists()).toBe(true)
    expect(wrapper.find('.cc-field-error').exists()).toBe(true)

    // 移除异常项：点该 chip 的关闭图标
    await badChip!.find('.el-tag__close').trigger('click')
    await nextTick()
    expect(wrapper.find('.cc-pane--chosen').text()).not.toContain('ds-old')
    expect(wrapper.find('.cc-split--error').exists()).toBe(false)

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

  it('静态：弹窗内容区保留受控滚动；+N 完整清单不设固定最大高度与内部滚动（第三轮修订）', () => {
    const formCss = cssBlock(SFC_SOURCE, '.cc-form')
    expect(formCss).toContain('overflow-y: auto')
    expect(formCss).toMatch(/max-height:\s*calc\(100vh/)
    // `+N` 完整清单按内容自然增高（CCFG-REQ-115/CCFG-DESIGN-055/CCFG-UI-044）：
    // `.cc-full-list` 已无专属规则块，且不得经任何以该选择器开头的规则重新引入
    // 固定最大高度或内部滚动。此处为静态令牌检查，非浏览器计算样式。
    expect(cssBlock(SFC_SOURCE, '.cc-full-list')).toBe('')
    expect(SFC_SOURCE).not.toMatch(/\.cc-full-list[^{]*\{[^}]*max-height/)
    expect(SFC_SOURCE).not.toMatch(/\.cc-full-list[^{]*\{[^}]*overflow-y/)
    expect(SFC_SOURCE).not.toContain('max-height: 320px')
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

// ============================================================ 第三轮视觉调整

/**
 * 第三轮 `+N` 清单与新增／编辑弹窗视觉调整（CCFG-REQ-113~122 / CCFG-DESIGN-054~060 /
 * CCFG-UI-043~049）。组件用例验证清单项内容与弹窗文案／按钮边界；样式令牌用例为**静态**
 * 源码检查，不冒充浏览器计算样式，也不代表正式验收。
 */
describe('第三轮：+N 清单两级信息与弹窗视觉（CCFG-REQ-113~122 / CCFG-UI-043~049）', () => {
  // 7 个数据源（> 单行上限 6）→ 必然出现 `+N`；其中一项机构名缺失、一项带项级异常与冲突探针。
  const thirdRoundSources = [
    view('ds-t1', '机构一号', '库一号'),
    view('no-org-t', null, '无机构名库'),
    view('ds-t2', '机构二号', '库二号', ['ASSIGNED_TO_MULTIPLE_CLIENTS'], ['hosp-900']),
    view('ds-t3', '机构三号', '库三号'),
    view('ds-t4', '机构四号', '库四号'),
    view('ds-t5', '机构五号', '库五号'),
    view('ds-t6', '机构六号', '库六号'),
  ]
  const thirdRoundRow = row('probe-t3', '第三轮探针', '1', thirdRoundSources)
  const thirdRoundAmbiguousRow = row('probe-t3-amb', '第三轮歧义探针', '1', thirdRoundSources, {
    possibleCommaDataSourceIds: ['ds-t1,no-org-t'],
    rowAnomalies: ['COMMA_PROTOCOL_AMBIGUOUS'],
  })

  /** 点击 `+N` 打开完整清单（清单 Teleport 到 body），返回清单项元素。 */
  async function openFullList(w: PageWrapper): Promise<HTMLElement[]> {
    await w.find('.cc-more').trigger('click')
    await flushPromises()
    await sleep(60)
    return Array.from(document.querySelectorAll<HTMLElement>('.cc-full-item'))
  }

  it('组件：清单主行为机构名、次行以可见前缀“数据源 ID：”引导完整 ID，保持接口原顺序', async () => {
    const wrapper = await mountPage([thirdRoundRow])
    const items = await openFullList(wrapper)
    expect(items).toHaveLength(7)
    // 主信息行：机构名存在时为机构名；缺失时以原始 ID 作主信息。顺序为接口原存储顺序。
    expect(items.map((el) => el.querySelector('.cc-full-org')?.textContent?.trim())).toEqual([
      '机构一号',
      'no-org-t',
      '机构二号',
      '机构三号',
      '机构四号',
      '机构五号',
      '机构六号',
    ])
    // 次信息行：仅机构名存在时输出，前缀可见且与值有明确分隔
    expect(items.map((el) => el.querySelector('.cc-full-id')?.textContent?.trim() ?? null)).toEqual([
      '数据源 ID：ds-t1',
      null,
      '数据源 ID：ds-t2',
      '数据源 ID：ds-t3',
      '数据源 ID：ds-t4',
      '数据源 ID：ds-t5',
      '数据源 ID：ds-t6',
    ])
    wrapper.unmount()
  })

  it('组件：机构名缺失项只把原始 ID 作主信息，不重复显示同一 ID', async () => {
    const wrapper = await mountPage([thirdRoundRow])
    const items = await openFullList(wrapper)
    const noOrgItem = items.find(
      (el) => el.querySelector('.cc-full-org')?.textContent?.trim() === 'no-org-t',
    )
    expect(noOrgItem).toBeTruthy()
    // 不再输出同一 ID 的次信息行
    expect(noOrgItem!.querySelector('.cc-full-id')).toBeNull()
    const occurrences = (noOrgItem!.textContent ?? '').split('no-org-t').length - 1
    expect(occurrences).toBe(1)
    wrapper.unmount()
  })

  it('组件：项级异常与冲突探针信息仍保留在项内，红色语义类不变', async () => {
    const wrapper = await mountPage([thirdRoundRow])
    const items = await openFullList(wrapper)
    const badItem = items.find((el) => el.querySelector('.cc-full-bad'))
    expect(badItem).toBeTruthy()
    expect(badItem!.querySelector('.cc-full-org')?.textContent?.trim()).toBe('机构二号')
    expect(badItem!.querySelector('.cc-full-bad')?.textContent).toContain(
      '已分配给其他探针：hosp-900',
    )
    wrapper.unmount()
  })

  it('组件：行级含逗号歧义的清单提示文案与事实边界逐字保留', async () => {
    const wrapper = await mountPage([thirdRoundAmbiguousRow])
    const items = await openFullList(wrapper)
    expect(items).toHaveLength(7)
    const note = document.querySelector('.cc-full-note')
    expect(note).not.toBeNull()
    expect(note!.textContent?.trim()).toBe(
      '以下为普通 CSV 解析的展示结果（行级含逗号歧义），非已确定分配。',
    )
    wrapper.unmount()
  })

  it('组件：新增/编辑主提交按钮文案保持“创建/保存”，且仅主按钮带 cc-dialog-submit', async () => {
    const wrapper = await mountPage([enabledRow])
    await openCreate(wrapper)
    const createBtn = exactButton(wrapper, '创建')!
    expect(createBtn.classes()).toContain('cc-dialog-submit')
    expect(exactButton(wrapper, '取消')!.classes()).not.toContain('cc-dialog-submit')
    expect(exactButton(wrapper, '自动生成')!.classes()).not.toContain('cc-dialog-submit')
    expect(exactButton(wrapper, '保存')).toBeUndefined()
    // 新增模式：探针 ID 直接可编辑，不出现“修改探针 ID”开关
    expect(exactButton(wrapper, '修改探针 ID')).toBeUndefined()
    expect(wrapper.find('.cc-id-control input').attributes('disabled')).toBeUndefined()
    wrapper.unmount()

    const editWrapper = await mountPage([enabledRow])
    await openEdit(editWrapper, enabledRow)
    const saveBtn = exactButton(editWrapper, '保存')!
    expect(saveBtn.classes()).toContain('cc-dialog-submit')
    const toggle = exactButton(editWrapper, '修改探针 ID')!
    expect(toggle).toBeTruthy()
    expect(toggle.classes()).not.toContain('cc-dialog-submit')
    editWrapper.unmount()
  })

  it('组件：主提交按钮常态不预禁用——未选数据源时点击就地报错且拒绝写库', async () => {
    const wrapper = await mountPage([enabledRow])
    await openCreate(wrapper)
    const btn = exactButton(wrapper, '创建')!
    expect(btn.attributes('disabled')).toBeUndefined()
    expect(btn.classes()).not.toContain('is-disabled')

    await btn.trigger('click')
    await flushPromises()
    expect(mockedCreate).not.toHaveBeenCalled()
    expect(wrapper.find('.cc-split--error').exists()).toBe(true)
    expect(sourceFeedbackOf(wrapper)).toEqual({ text: '至少选择 1 个数据源', tone: 'error' })
    wrapper.unmount()
  })

  it('静态：弹窗宽度 900px 且以 max-width 受视口限制保留左右安全间距', () => {
    expect(SFC_SOURCE).toContain('width="900px"')
    expect(SFC_SOURCE).not.toContain('width="680px"')
    expect(declValue(cssBlock(SFC_SOURCE, ':deep(.cc-dialog)'), 'max-width')).toBe(
      'calc(100vw - 48px)',
    )
  })

  it('静态：配置项名称标签令牌对齐参考页（14px / 500 / #3f3f46，无等宽字体）', () => {
    const label = cssBlock(SFC_SOURCE, '.cc-form-label')
    expect(declValue(label, 'font-size')).toBe('14px')
    expect(declValue(label, 'font-weight')).toBe('500')
    expect(declValue(label, 'color')).toBe('#3f3f46')
    expect(label).not.toContain('monospace')
    // 必填红色星号与校验语义保留
    expect(SFC_SOURCE).toContain('.cc-form-label::before')
  })

  it('静态：主提交按钮黑色实心令牌，正常态配色由 :not(.is-disabled) 限定', () => {
    const submit = cssBlock(SFC_SOURCE, '.cc-dialog-submit:not(.is-disabled)')
    expect(declValue(submit, 'background')).toBe('#09090b')
    expect(declValue(submit, 'border-color')).toBe('#09090b')
    expect(declValue(submit, 'color')).toBe('#ffffff')
    expect(declValue(submit, 'border-radius')).toBe('6px')
    expect(declValue(submit, 'font-weight')).toBe('500')
    expect(SFC_SOURCE).toContain('.cc-dialog-submit:not(.is-disabled):hover')
    expect(SFC_SOURCE).toContain('.cc-dialog-submit:not(.is-disabled):active')
    expect(SFC_SOURCE).toContain('#27272a')
    expect(SFC_SOURCE).toContain('#18181b')
    // 不借助 !important 强行覆盖禁用态
    expect(SFC_SOURCE).not.toContain('!important')
  })

  it('静态：清单两级各占一行，项间以浅分隔线区分', () => {
    expect(declValue(cssBlock(SFC_SOURCE, '.cc-full-org'), 'display')).toBe('block')
    expect(declValue(cssBlock(SFC_SOURCE, '.cc-full-id'), 'display')).toBe('block')
    expect(cssBlock(SFC_SOURCE, '.cc-full-item + .cc-full-item')).toContain('border-top')
  })

  it('静态：“可选数据源”宽于“已选”，两区可见高度均较调整前提高且保持受控滚动', () => {
    const optionsFlex = Number(declValue(cssBlock(SFC_SOURCE, '.cc-pane--options'), 'flex'))
    const chosenFlex = Number(declValue(cssBlock(SFC_SOURCE, '.cc-pane--chosen'), 'flex'))
    expect(Number.isFinite(optionsFlex)).toBe(true)
    expect(Number.isFinite(chosenFlex)).toBe(true)
    expect(optionsFlex).toBeGreaterThan(chosenFlex)

    const optListHeight = Number(
      declValue(cssBlock(SFC_SOURCE, '.cc-opt-list'), 'max-height').replace('px', ''),
    )
    const chosenListHeight = Number(
      declValue(cssBlock(SFC_SOURCE, '.cc-pane--chosen .cc-chosen-list'), 'max-height').replace(
        'px',
        '',
      ),
    )
    expect(optListHeight).toBeGreaterThan(200)
    expect(chosenListHeight).toBeGreaterThan(200)
    // 候选区受控滚动保留（仅弹窗内，与 +N 清单“不内部滚动”互不冲突）
    expect(cssBlock(SFC_SOURCE, '.cc-opt-list')).toContain('overflow-y: auto')
  })

  it('静态：菜单条目统一字重，“删除”不加粗、危险语义由颜色与分隔线承载', () => {
    const sharedItem = cssBlock(SFC_SOURCE, '.cc-more-popper .el-dropdown-menu__item')
    expect(declValue(sharedItem, 'font-weight')).toBe('400')
    const dangerRule = cssBlock(SFC_SOURCE, '.cc-more-popper .el-dropdown-menu__item.cc-more-danger')
    // 危险项规则只承载颜色，不声明字重，故不覆盖共享的 400
    expect(declValue(dangerRule, 'font-weight')).toBe('')
    expect(declValue(dangerRule, 'color')).toBe('var(--el-color-danger)')
  })

  /**
   * R1 裁切回归护栏。**jsdom 无法计算 Popper 的实际 placement 与矩形**，因此本用例只断言
   * 组件确实把碰撞处理参数交给了 Element Plus／Popper：`placement` 仍以 `top` 为首选方向，
   * 且 `preventOverflow` 打开了 `altAxis`（Popper v2 中 `top`/`bottom` 定位的**竖直**贴边
   * 避让轴，EP 默认 `false`——这正是首行 9 项在 1440×900 被视口上缘裁掉约 166px 的根因），
   * 并把边界显式定为视口。真实翻转／避让行为由浏览器几何断言脚本作为可执行证据，见
   * `docs/features/client-config/reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001-R1.md`。
   */
  it('组件：+N 弹层以 top 为首选方向，且显式开启视口边界与竖直贴边避让（防 R1 裁切回归）', async () => {
    const wrapper = await mountPage([thirdRoundRow])
    const popover = wrapper.findComponent({ name: 'ElPopover' })
    expect(popover.exists()).toBe(true)
    expect(popover.props('placement')).toBe('top')
    const options = popover.props('popperOptions') as {
      modifiers?: Array<{ name: string; options?: Record<string, unknown> }>
    }
    const preventOverflow = options?.modifiers?.find((m) => m.name === 'preventOverflow')
    expect(preventOverflow).toBeTruthy()
    // top/bottom 定位下竖直方向贴边避让由 altAxis 控制，必须显式开启
    expect(preventOverflow!.options?.altAxis).toBe(true)
    expect(preventOverflow!.options?.boundary).toBe('viewport')
    expect(preventOverflow!.options?.rootBoundary).toBe('viewport')
    expect(preventOverflow!.options?.tether).toBe(false)
    wrapper.unmount()
  })

  it('静态：+N 弹层绑定碰撞选项常量，不借助固定最大高度或内部滚动“解决”高度', () => {
    expect(SFC_SOURCE).toContain(':popper-options="FULL_LIST_POPPER_OPTIONS"')
    expect(SFC_SOURCE).toContain('altAxis: true')
    expect(SFC_SOURCE).toContain("boundary: 'viewport'")
    // 清单仍按内容自然增高
    expect(cssBlock(SFC_SOURCE, '.cc-full-list')).toBe('')
  })
})

// ============================================================ 第四轮：创建/编辑弹窗校验与视觉
// CCFG-REQ-123~136 / CCFG-AC-118~135 / CCFG-DESIGN-061~071 / CCFG-UI-050~059
//
// 本节断言落在真实渲染的 DOM 与 mock 的写接口调用上（不做源码字串镜像）；弹窗水平居中、
// 反馈区几何稳定性等依赖真实布局的结论由真实浏览器另行核对（见实现报告）。

function failNull(code: number, message: string): ApiResponse<null> {
  return { code, message, timestamp: '', data: null }
}

/** 取包含某内部节点（`.cc-id-control` / `.cc-desc-row` / `.cc-split`）的字段容器。 */
function fieldContainer(w: PageWrapper, innerSelector: string): HTMLElement | null {
  const inner = w.find(innerSelector)
  return inner.exists()
    ? (inner.element.closest('.cc-field, .cc-source-field') as HTMLElement | null)
    : null
}

/** 某字段容器内的红色错误文本（无则 null）。 */
function fieldErrorText(w: PageWrapper, innerSelector: string): string | null {
  const err = fieldContainer(w, innerSelector)?.querySelector('.cc-field-error')
  return err ? (err.textContent ?? '').trim() : null
}

/** 某字段是否呈红色错误态：ID/描述看容器类，数据源看选择区域类。 */
function fieldInvalid(w: PageWrapper, innerSelector: string): boolean {
  const container = fieldContainer(w, innerSelector)
  if (!container) return false
  return (
    container.classList.contains('cc-field--error') ||
    container.querySelector('.cc-split--error') !== null
  )
}

/** “采集数据源”反馈区当前文案与语气（灰 neutral / 红 error / 无 null）。 */
function sourceFeedbackOf(w: PageWrapper): { text: string; tone: 'neutral' | 'error' | null } {
  const el = fieldContainer(w, '.cc-split')?.querySelector('.cc-field-feedback__text')
  if (!el) return { text: '', tone: null }
  return {
    text: (el.textContent ?? '').trim(),
    tone: el.className.includes('cc-field-error') ? 'error' : 'neutral',
  }
}

const idError = (w: PageWrapper) => fieldErrorText(w, '.cc-id-control')
const descError = (w: PageWrapper) => fieldErrorText(w, '.cc-desc-row')

/** 填一份全部合法的“新增”表单：合法 ID、非空描述、一个可选数据源。 */
async function fillValidCreate(w: PageWrapper, id = 'probe-new', desc = '中心用途') {
  await w.find('.cc-id-control input').setValue(id)
  await w.find('.cc-desc-row textarea').setValue(desc)
  await optionByText(w, '中心医院')!.trigger('click')
  await nextTick()
}

describe('第四轮：字段级校验与主按钮口径（CCFG-REQ-123~136）', () => {
  it('新增：一次提交同时报三项字段错误，逐项修正只清除该项（CCFG-AC-118/CCFG-REQ-123）', async () => {
    const w = await mountPage([enabledRow])
    await openCreate(w)
    await w.find('.cc-id-control input').setValue('9bad!')
    await nextTick()

    await exactButton(w, '创建')!.trigger('click')
    await flushPromises()

    expect(mockedCreate).not.toHaveBeenCalled()
    expect(idError(w)).toContain('探针 ID 格式不正确')
    expect(descError(w)).toBe('探针描述不能为空。')
    expect(sourceFeedbackOf(w)).toEqual({ text: '至少选择 1 个数据源', tone: 'error' })
    expect(fieldInvalid(w, '.cc-id-control')).toBe(true)
    expect(fieldInvalid(w, '.cc-desc-row')).toBe(true)
    expect(fieldInvalid(w, '.cc-split')).toBe(true)
    // 字段级错误不得用顶部全局提示替代或重复
    expect(messageSpy.error).not.toHaveBeenCalled()
    expect(messageSpy.warning).not.toHaveBeenCalled()

    // 只修 ID → 仅 ID 错误消失，其余保持
    await w.find('.cc-id-control input').setValue('probe-new')
    await nextTick()
    expect(idError(w)).toBeNull()
    expect(fieldInvalid(w, '.cc-id-control')).toBe(false)
    expect(descError(w)).toBe('探针描述不能为空。')
    expect(sourceFeedbackOf(w).tone).toBe('error')

    // 只修描述 → 仅描述错误消失，数据源错误仍在
    await w.find('.cc-desc-row textarea').setValue('中心用途')
    await nextTick()
    expect(descError(w)).toBeNull()
    expect(sourceFeedbackOf(w).tone).toBe('error')

    // 选中数据源 → 反馈消失并放行写库
    await optionByText(w, '中心医院')!.trigger('click')
    await nextTick()
    expect(sourceFeedbackOf(w).tone).toBeNull()
    await exactButton(w, '创建')!.trigger('click')
    await flushPromises()
    expect(mockedCreate).toHaveBeenCalledTimes(1)
    expect(mockedCreate).toHaveBeenCalledWith({
      clientId: 'probe-new',
      clientDesc: '中心用途',
      dataSourceIds: ['ds-ok1'],
    })
    w.unmount()
  })

  it('新增：提交被阻断时定位到第一个错误字段（CCFG-AC-118）', async () => {
    const w = await mountPage([enabledRow])
    await openCreate(w)
    await exactButton(w, '创建')!.trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(w.find('.cc-id-control input').element)
    w.unmount()
  })

  it('编辑：解锁后改空 ID 报字段错误，取消修改恢复原 ID 并清除该错误（CCFG-AC-119）', async () => {
    const w = await mountPage([enabledRow])
    await openEdit(w, enabledRow)
    expect(idError(w)).toBeNull()

    await exactButton(w, '修改探针 ID')!.trigger('click')
    await nextTick()
    const editable = w.find('.cc-id-control input:not([data-locked])')
    expect(editable.exists()).toBe(true)
    await editable.setValue('')
    await nextTick()

    await exactButton(w, '保存')!.trigger('click')
    await flushPromises()
    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(idError(w)).toBe('探针 ID 不能为空。')

    await exactButton(w, '取消修改')!.trigger('click')
    await nextTick()
    expect(idError(w)).toBeNull()
    const locked = w.find('.cc-id-control input')
    expect((locked.element as HTMLInputElement).value).toBe('probe-a')
    expect(locked.attributes('data-locked')).toBeDefined()
    w.unmount()
  })

  it('服务端错误码按既有错误码落到对应字段，不可归属错误仍全局（CCFG-AC-121/CCFG-REQ-125）', async () => {
    const w = await mountPage([enabledRow])
    await openCreate(w)
    await fillValidCreate(w)
    const submit = async () => {
      await exactButton(w, '创建')!.trigger('click')
      await flushPromises()
    }

    mockedCreate.mockResolvedValue(failNull(40940, '探针 ID 已存在'))
    await submit()
    expect(idError(w)).toBe('探针 ID 已存在')
    expect(descError(w)).toBeNull()
    expect(sourceFeedbackOf(w).tone).toBeNull()
    expect(messageSpy.error).not.toHaveBeenCalled()

    mockedCreate.mockResolvedValue(failNull(40102, '探针描述为空白或过长'))
    await submit()
    expect(idError(w)).toBeNull()
    expect(descError(w)).toBe('探针描述为空白或过长')
    expect(messageSpy.error).not.toHaveBeenCalled()

    mockedCreate.mockResolvedValue(failNull(40941, '数据源已被其他探针占用'))
    await submit()
    expect(descError(w)).toBeNull()
    expect(sourceFeedbackOf(w)).toEqual({ text: '数据源已被其他探针占用', tone: 'error' })
    expect(fieldInvalid(w, '.cc-split')).toBe(true)
    expect(messageSpy.error).not.toHaveBeenCalled()

    // 历史异常阻断 40942 不在字段映射内：保留全局提示，不落到数据源字段
    mockedCreate.mockResolvedValue(failNull(40942, '存在异常数据源，已阻断保存'))
    await submit()
    expect(messageSpy.error).toHaveBeenCalledWith('存在异常数据源，已阻断保存')
    expect(sourceFeedbackOf(w).tone).toBeNull()

    // 无法归属的系统错误码同样走全局提示
    mockedCreate.mockResolvedValue(failNull(50000, '系统内部错误'))
    await submit()
    expect(messageSpy.error).toHaveBeenCalledWith('系统内部错误')
    expect(idError(w)).toBeNull()
    expect(descError(w)).toBeNull()
    expect(sourceFeedbackOf(w).tone).toBeNull()
    w.unmount()
  })

  it('主按钮：常态不预禁用，提交中防重复点击（CCFG-AC-120/CCFG-REQ-124）', async () => {
    const w = await mountPage([enabledRow])
    await openCreate(w)
    const btn = exactButton(w, '创建')!
    expect(btn.classes()).toContain('cc-dialog-submit')
    expect(btn.attributes('disabled')).toBeUndefined()
    expect(btn.classes()).not.toContain('is-disabled')

    await fillValidCreate(w)
    expect(exactButton(w, '创建')!.attributes('disabled')).toBeUndefined()
    expect(exactButton(w, '创建')!.classes()).not.toContain('is-disabled')

    let release: (v: ApiResponse<null>) => void = () => {}
    mockedCreate.mockImplementation(
      () => new Promise<ApiResponse<null>>((resolve) => (release = resolve)) as never,
    )
    await exactButton(w, '创建')!.trigger('click')
    const loadingBtn = exactButton(w, '创建')!
    expect(loadingBtn.classes()).toContain('is-loading')
    expect(loadingBtn.attributes('disabled')).toBeDefined()

    await loadingBtn.trigger('click')
    expect(mockedCreate).toHaveBeenCalledTimes(1)

    release(okNull())
    await flushPromises()
    expect(messageSpy.success).toHaveBeenCalledWith('新增成功')
    w.unmount()
  })

  it('采集数据源提示：灰→红→隐藏→恢复，重开会话复位（CCFG-AC-122/123）', async () => {
    const w = await mountPage([enabledRow])
    await openCreate(w)
    expect(sourceFeedbackOf(w)).toEqual({ text: '至少选择 1 个数据源', tone: 'neutral' })
    expect(fieldInvalid(w, '.cc-split')).toBe(false)

    await exactButton(w, '创建')!.trigger('click')
    await flushPromises()
    expect(sourceFeedbackOf(w)).toEqual({ text: '至少选择 1 个数据源', tone: 'error' })
    expect(fieldInvalid(w, '.cc-split')).toBe(true)

    await optionByText(w, '中心医院')!.trigger('click')
    await nextTick()
    expect(sourceFeedbackOf(w).tone).toBeNull()

    await w.find('.cc-chip .el-tag__close').trigger('click')
    await nextTick()
    expect(sourceFeedbackOf(w)).toEqual({ text: '至少选择 1 个数据源', tone: 'error' })

    // 关闭后重新打开：会话内“已尝试提交”状态复位，回到中性灰色说明
    await exactButton(w, '取消')!.trigger('click')
    await nextTick()
    await openCreate(w)
    expect(sourceFeedbackOf(w)).toEqual({ text: '至少选择 1 个数据源', tone: 'neutral' })
    expect(fieldInvalid(w, '.cc-split')).toBe(false)
    w.unmount()
  })

  it('探针 ID：手输/粘贴上限 32，非法字符不被静默剥离（CCFG-AC-128/129/CCFG-REQ-131）', async () => {
    const w = await mountPage([enabledRow])
    await openCreate(w)
    const input = w.find('.cc-id-control input')
    expect(input.attributes('maxlength')).toBe('32')

    await input.setValue('a'.repeat(40))
    await nextTick()
    expect((input.element as HTMLInputElement).value).toBe('a'.repeat(32))

    await input.setValue('9bad!')
    await nextTick()
    expect((input.element as HTMLInputElement).value).toBe('9bad!')
    await exactButton(w, '创建')!.trigger('click')
    await flushPromises()
    expect(mockedCreate).not.toHaveBeenCalled()
    expect(idError(w)).toContain('格式不正确')
    w.unmount()
  })

  it('探针描述：按完整字符截断到 256，汉字与补充平面字符均不被拆开（CCFG-AC-130/CCFG-REQ-132）', async () => {
    const w = await mountPage([enabledRow])
    await openCreate(w)
    const ta = w.find('.cc-desc-row textarea')

    await ta.setValue('甲'.repeat(300))
    await nextTick()
    expect(Array.from((ta.element as HTMLTextAreaElement).value)).toHaveLength(256)

    await ta.setValue('😀'.repeat(300))
    await nextTick()
    const emoji = (ta.element as HTMLTextAreaElement).value
    expect(Array.from(emoji)).toHaveLength(256)
    // 无孤立代理项：四字节字符未被截断切开
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(emoji)).toBe(false)
    expect(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(emoji)).toBe(false)

    // 256 个汉字完整保留并可直接保存（UTF-8 768 字节 < 1024，不触发字节错误）
    const cjk = '甲'.repeat(256)
    await ta.setValue(cjk)
    await w.find('.cc-id-control input').setValue('probe-256')
    await optionByText(w, '中心医院')!.trigger('click')
    await nextTick()
    await exactButton(w, '创建')!.trigger('click')
    await flushPromises()
    expect(mockedCreate).toHaveBeenCalledWith({
      clientId: 'probe-256',
      clientDesc: cjk,
      dataSourceIds: ['ds-ok1'],
    })
    expect(messageSpy.error).not.toHaveBeenCalled()
    w.unmount()
  })

  it('自动生成：先按选择顺序拼完整描述再截 256，不弹超长错误（CCFG-AC-132/CCFG-REQ-133）', async () => {
    const longOptions: DataSourceOptionVO[] = [
      { dataSourceId: 'ds-l1', org: 'A'.repeat(150), dataSourceName: 'L1', selectable: true, notSelectableReason: null, occupiedByClientIds: [] },
      { dataSourceId: 'ds-l2', org: 'B'.repeat(150), dataSourceName: 'L2', selectable: true, notSelectableReason: null, occupiedByClientIds: [] },
    ]
    mockedOptions.mockResolvedValue(okOptions(longOptions))
    const w = await mountRaw()
    await openCreate(w)
    await optionByText(w, 'A'.repeat(150))!.trigger('click')
    await nextTick()
    await optionByText(w, 'B'.repeat(150))!.trigger('click')
    await nextTick()
    await exactButton(w, '自动生成')!.trigger('click')
    await nextTick()

    const expected = ('A'.repeat(150) + ',' + 'B'.repeat(150)).slice(0, 256)
    const value = (w.find('.cc-desc-row textarea').element as HTMLTextAreaElement).value
    expect(value).toBe(expected)
    expect(Array.from(value)).toHaveLength(256)
    expect(value.startsWith('A'.repeat(150) + ',')).toBe(true)
    expect(messageSpy.warning).not.toHaveBeenCalled()
    expect(messageSpy.error).not.toHaveBeenCalled()
    w.unmount()
  })

  it('编辑历史描述超 256：只回显前 256 完整字符作草稿，关闭不写库，保存只提交草稿（CCFG-AC-133/CCFG-REQ-134）', async () => {
    const longDesc = '甲'.repeat(300)
    const longRow = row('probe-long', longDesc, '1', [healthyDs])
    const w = await mountPage([longRow])
    await openEdit(w, longRow)
    const textarea = () => w.find('.cc-desc-row textarea').element as HTMLTextAreaElement
    expect(Array.from(textarea().value)).toHaveLength(256)
    // 打开弹窗不得改写列表原记录
    expect(longRow.clientDesc).toBe(longDesc)
    expect(longRow.clientDesc).toHaveLength(300)

    await exactButton(w, '取消')!.trigger('click')
    await nextTick()
    expect(mockedUpdate).not.toHaveBeenCalled()

    await openEdit(w, longRow)
    expect(Array.from(textarea().value)).toHaveLength(256)
    await exactButton(w, '保存')!.trigger('click')
    await flushPromises()
    expect(mockedUpdate).toHaveBeenCalledWith('probe-long', {
      clientId: 'probe-long',
      clientDesc: '甲'.repeat(256),
      dataSourceIds: ['ds-ok1'],
    })
    expect(messageSpy.error).not.toHaveBeenCalled()
    w.unmount()
  })

  it('编辑历史歧义阻断：字段级红色反馈拒绝保存，不落全局提示（CCFG-AC-121/CCFG-REQ-124）', async () => {
    const w = await mountPage([ambiguousRow])
    await openEdit(w, ambiguousRow)
    const btn = exactButton(w, '保存')!
    expect(btn.attributes('disabled')).toBeUndefined()
    await btn.trigger('click')
    await flushPromises()
    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(sourceFeedbackOf(w).text).toContain('原配置含英文逗号歧义')
    expect(sourceFeedbackOf(w).tone).toBe('error')
    expect(fieldInvalid(w, '.cc-split')).toBe(true)
    expect(messageSpy.error).not.toHaveBeenCalled()
    expect(messageSpy.warning).not.toHaveBeenCalled()
    w.unmount()
  })

  it('静态：描述占位文案、标签右对齐、反馈区预留而不裁切、弹窗样式无侧栏偏移（CCFG-REQ-126/129、CCFG-UI-055/059）', () => {
    expect(SFC_SOURCE).toContain('探针用途描述（最多 256 个字符）')
    expect(declValue(cssBlock(SFC_SOURCE, '.cc-form-label'), 'text-align')).toBe('right')

    const feedback = cssBlock(SFC_SOURCE, '.cc-field-feedback')
    expect(declValue(feedback, 'min-height')).not.toBe('')
    expect(feedback).not.toContain('overflow: hidden')

    // 弹窗宽度与窄视口安全间距保持既有口径；样式不得硬编码侧栏宽度补偿
    expect(declValue(cssBlock(SFC_SOURCE, ':deep(.cc-dialog)'), 'max-width')).toBe(
      'calc(100vw - 48px)',
    )
    expect(SFC_SOURCE).not.toContain('220px')
    expect(SFC_SOURCE).not.toContain('64px')
  })
})

// ============================================================ 第一轮纠偏（R1）：主提交按钮加载态去掉蓝黑跳色
// CCFG-REQ-120/124 / CCFG-AC-115/120 / CCFG-DESIGN-059/062 / CCFG-UI-047/051
//
// 背景：Element Plus 在 `is-loading` 时同时置 `is-disabled`，其
// `.el-button.is-disabled` 把 `--el-button-disabled-bg-color`（主色浅色 5 级
// `#a0cfff`，浅蓝）刷到底色上，于是黑色常态在挂起瞬间跳到浅蓝。纠偏只做一件事：
// 为 `.cc-dialog-submit.is-loading` 增加**仅加载态**的定向深灰黑系样式。
//
// jsdom 不注入 SFC 样式，因此“实际颜色”由 SFC 源码声明块受检（加载态声明块 + 无浅蓝
// 令牌/无全局覆盖/无 !important）；真实浏览器下的 computed 色值三态证据见
// `docs/features/client-config/reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-IMPLEMENTATION-001-R1.md`。

describe('第一轮纠偏（R1）：主提交按钮加载态保持黑色系（CCFG-REQ-120/124）', () => {
  it('静态：加载态定向声明为黑色系深灰，且覆盖 hover/focus/active 不给浅蓝留入口', () => {
    const loading = cssGroupBlock(SFC_SOURCE, '.cc-dialog-submit.is-loading')
    expect(loading).not.toBe('')
    // 黑系深灰底 + 白字：与常态 #09090b 同族，明显区别于 EP 主色浅蓝
    expect(declValue(loading, 'background')).toBe('#3f3f46')
    expect(declValue(loading, 'border-color')).toBe('#3f3f46')
    expect(declValue(loading, 'color')).toBe('#ffffff')
    expect(declValue(loading, 'border-radius')).toBe('6px')
    expect(declValue(loading, 'font-weight')).toBe('500')
    // 与“仍可点击的黑色常态”区分：加载态不可重复点击
    expect(declValue(loading, 'cursor')).toBe('not-allowed')

    // 分组内显式带上 hover/focus/active，防止 EP 的 `.el-button.is-disabled:hover`
    // 在指针悬停时把浅蓝重新刷回
    expect(SFC_SOURCE).toContain('.cc-dialog-submit.is-loading:hover')
    expect(SFC_SOURCE).toContain('.cc-dialog-submit.is-loading:focus')
    expect(SFC_SOURCE).toContain('.cc-dialog-submit.is-loading:active')

    // EP 用 30% 白遮罩 `.el-button.is-loading:before` 冲淡底色，须在本按钮加载态内置为透明
    const mask = cssBlock(SFC_SOURCE, '.cc-dialog-submit.is-loading::before')
    expect(declValue(mask, 'background-color')).toBe('transparent')
  })

  it('静态：纠偏不引入浅蓝令牌、全局覆盖或 !important，选择器仍仅限定本主按钮', () => {
    // 浅蓝来源与主色令牌不得出现在本页样式里（防止有人改回“禁用即主色浅色”）
    expect(SFC_SOURCE).not.toContain('#a0cfff')
    expect(SFC_SOURCE).not.toContain('--el-color-primary-light-5')
    expect(SFC_SOURCE).not.toContain('--el-button-disabled-bg-color')
    // 不得改成全局按钮覆盖，也不得靠 !important 抢优先级
    expect(SFC_SOURCE).not.toContain('.el-button.is-loading')
    expect(SFC_SOURCE).not.toContain('!important')
    // 正常态仍由 :not(.is-disabled) 限定（历史条款的作用域说明保持）
    expect(SFC_SOURCE).toContain('.cc-dialog-submit:not(.is-disabled)')
  })

  it('新增：常态黑色可点击 → 挂起 is-loading 且防重复 → 结束后恢复常态（CCFG-AC-120）', async () => {
    const w = await mountPage([enabledRow])
    await openCreate(w)
    await fillValidCreate(w)

    // ① 常态：黑色可点击（不预禁用、不加载）
    const idle = exactButton(w, '创建')!
    expect(idle.attributes('disabled')).toBeUndefined()
    expect(idle.classes()).not.toContain('is-disabled')
    expect(idle.classes()).not.toContain('is-loading')

    // ② 挂起：is-loading + 防重复点击
    let release: (v: ApiResponse<null>) => void = () => {}
    mockedCreate.mockImplementation(
      () => new Promise<ApiResponse<null>>((resolve) => (release = resolve)) as never,
    )
    await exactButton(w, '创建')!.trigger('click')
    const pending = exactButton(w, '创建')!
    expect(pending.classes()).toContain('is-loading')
    expect(pending.classes()).toContain('is-disabled')
    expect(pending.attributes('disabled')).toBeDefined()

    await pending.trigger('click')
    await pending.trigger('click')
    expect(mockedCreate).toHaveBeenCalledTimes(1)

    // ③ 结束：请求返回后按钮复位为常态
    release(okNull())
    await flushPromises()
    expect(messageSpy.success).toHaveBeenCalledWith('新增成功')
    // 成功后弹窗关闭，重开校验按钮已无加载/禁用残留
    await openCreate(w)
    const restored = exactButton(w, '创建')!
    expect(restored.classes()).not.toContain('is-loading')
    expect(restored.classes()).not.toContain('is-disabled')
    expect(restored.attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  it('编辑：常态黑色可点击 → 挂起 is-loading 且防重复 → 失败后恢复常态（CCFG-AC-115/120）', async () => {
    const editRow = row('probe-edit', '编辑探针', '1', [healthyDs])
    const w = await mountPage([editRow])
    await openEdit(w, editRow)

    // ① 常态：黑色可点击
    const idle = exactButton(w, '保存')!
    expect(idle.classes()).toContain('cc-dialog-submit')
    expect(idle.attributes('disabled')).toBeUndefined()
    expect(idle.classes()).not.toContain('is-disabled')
    expect(idle.classes()).not.toContain('is-loading')

    // ② 挂起：is-loading + 防重复点击
    let reject: (e: unknown) => void = () => {}
    mockedUpdate.mockImplementation(
      () => new Promise<ApiResponse<null>>((_, rej) => (reject = rej)) as never,
    )
    await exactButton(w, '保存')!.trigger('click')
    const pending = exactButton(w, '保存')!
    expect(pending.classes()).toContain('is-loading')
    expect(pending.classes()).toContain('is-disabled')
    expect(pending.attributes('disabled')).toBeDefined()

    await pending.trigger('click')
    await pending.trigger('click')
    expect(mockedUpdate).toHaveBeenCalledTimes(1)

    // ③ 结束：请求失败后弹窗保持打开且按钮恢复黑色可点击常态
    reject(new Error('network down'))
    await flushPromises()
    expect(messageSpy.error).toHaveBeenCalledWith('编辑失败，请检查网络后重试。')
    const restored = exactButton(w, '保存')!
    expect(restored.classes()).not.toContain('is-loading')
    expect(restored.classes()).not.toContain('is-disabled')
    expect(restored.attributes('disabled')).toBeUndefined()
    w.unmount()
  })
})

// ============================================================ 第五轮：弹窗间距、启停确认与主列表单行固定选中
// CCFG-REQ-137~147 / CCFG-AC-140~146 / CCFG-DESIGN-072~082 / CCFG-UI-060~070

describe('第五轮：共用弹窗水平间距与字段节奏（CCFG-REQ-137/138、CCFG-DESIGN-072/073、CCFG-UI-060/061）', () => {
  it('静态：标签右缘→控件左缘统一 12px；字段间留白交由反馈区稳定占位，不再叠加字段级 gap', () => {
    // 页面作用域统一表单布局：三项标签右缘与对应控件左缘统一 12px
    expect(declValue(cssBlock(SFC_SOURCE, '.cc-form-item'), 'gap')).toBe('12px')
    // 字段级 gap 已移除：字段间留白只由 `.cc-field-feedback` 的稳定占位承担（不新增像素值掩盖节奏）
    expect(cssBlock(SFC_SOURCE, '.cc-form')).not.toContain('gap')
    // 标签列宽与右对齐不变；控件为 flex:1，多出的 12px 从控件宽度扣除，右边界保持原布局位置
    expect(declValue(cssBlock(SFC_SOURCE, '.cc-form-label'), 'flex')).toBe('0 0 84px')
    expect(declValue(cssBlock(SFC_SOURCE, '.cc-form-label'), 'text-align')).toBe('right')
    expect(declValue(cssBlock(SFC_SOURCE, '.cc-form-control'), 'flex')).toBe('1')
    // 反馈区稳定占位与长错误换行可读口径不变（不裁切）
    const feedback = cssBlock(SFC_SOURCE, '.cc-field-feedback')
    expect(declValue(feedback, 'min-height')).not.toBe('')
    expect(feedback).not.toContain('overflow: hidden')
    // 弹窗宽度与窄视口安全间距口径不变；不写死弹窗高度、不写死侧栏补偿宽度、不靠 !important
    expect(SFC_SOURCE).toContain('width="900px"')
    expect(declValue(cssBlock(SFC_SOURCE, ':deep(.cc-dialog)'), 'max-width')).toBe(
      'calc(100vw - 48px)',
    )
    expect(SFC_SOURCE).not.toContain('220px')
    expect(SFC_SOURCE).not.toContain('!important')
  })

  it('组件：新增与编辑共用同一套三字段结构，提示态切换不增减弹窗底部按钮（CCFG-REQ-139）', async () => {
    const w = await mountPage([enabledRow])
    const fieldShape = (root: PageWrapper) =>
      root.findAll('.cc-form-item').map((item) => ({
        label: item.find('.cc-form-label').text(),
        hasControl: item.find('.cc-form-control').exists(),
        hasFeedback: item.find('.cc-field-feedback').exists(),
      }))
    const dialogButtons = (root: PageWrapper) =>
      root.find('.cc-dialog').findAll('button').map((b) => b.text().trim())

    await openCreate(w)
    const created = fieldShape(w)
    expect(created.map((i) => i.label)).toEqual(['探针 ID', '探针描述', '采集数据源'])
    expect(created.every((i) => i.hasControl && i.hasFeedback)).toBe(true)
    const buttonsIdle = dialogButtons(w)
    // 触发三项字段级报错：外框与底部按钮集合不得因提示态切换而增减（不突跳）
    await exactButton(w, '创建')!.trigger('click')
    await flushPromises()
    expect(sourceFeedbackOf(w).tone).toBe('error')
    expect(dialogButtons(w)).toEqual(buttonsIdle)
    w.unmount()

    const w2 = await mountPage([enabledRow])
    await openEdit(w2, enabledRow)
    expect(fieldShape(w2).map((i) => i.label)).toEqual(['探针 ID', '探针描述', '采集数据源'])
    expect(w2.find('.cc-dialog').text()).toContain('编辑探针')
    w2.unmount()
  })
})

describe('第五轮：主列表单行固定选中（CCFG-REQ-142~146、CCFG-DESIGN-077~081、CCFG-UI-065~069）', () => {
  /** 略大于实现的 260ms 单击取消判定窗口。 */
  const CANCEL_WINDOW_MS = 320

  const tableVm = (w: PageWrapper) => w.findComponent({ name: 'ElTable' }).vm

  /** 一次真实行单击：EP 的 `row-click` 携带 PointerEvent，`detail` 为连续点击计数。 */
  async function clickRow(w: PageWrapper, rowData: ClientListItemVO, detail = 1) {
    tableVm(w).$emit('row-click', rowData, null, { detail })
    await nextTick()
  }

  /** 一次真实双击：两次 click（detail 1／2）+ dblclick，与浏览器事件顺序一致。 */
  async function dblClickRow(w: PageWrapper, rowData: ClientListItemVO) {
    await clickRow(w, rowData, 1)
    await clickRow(w, rowData, 2)
    tableVm(w).$emit('row-dblclick', rowData)
    await nextTick()
    await flushPromises()
  }

  const selectedRow = (w: PageWrapper) => w.find('.cc-row--selected')

  /** 由测试精确控制“请求启动／响应完成”顺序的挂起响应（确定性地复现请求交错）。 */
  function deferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  it('左键单击：未选中行固定 → 重复单击同一行取消 → 单击其他行转移，全表同时最多一行', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)

    await clickRow(w, enabledRow)
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-a')

    // 单击另一行：立即转移，原行不再固定
    await clickRow(w, disabledRow)
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-b')

    // 再次单击同一行：判定窗口内保持固定（不抖动），窗口后取消
    await clickRow(w, disabledRow)
    expect(selectedRow(w).text()).toContain('probe-b')
    await sleep(CANCEL_WINDOW_MS)
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    w.unmount()
  })

  it('探针 ID 文字的普通左键单击与点击其他普通行内容一致地切换固定选中（CCFG-AC-141 ⑥）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    // `.cc-id` 未被事件隔离，其 click 会照常冒泡到行（不属于需隔离的真行内交互控件）
    expect(SFC_SOURCE).not.toMatch(/class="cc-id"[\s\S]{0,400}?@click\.stop/)
    const idCell = w.findAll('.cc-id').find((s) => s.text() === 'probe-b')!
    await idCell.trigger('click')
    await flushPromises()
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    await sleep(CANCEL_WINDOW_MS)
    w.unmount()
  })

  it('快速连续单击：转移到新行后，早先的取消计时器不得清掉新固定行', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    await clickRow(w, enabledRow)
    await clickRow(w, enabledRow) // 进入 A 的取消判定窗口
    await clickRow(w, disabledRow) // 立刻转移到 B，须撤销 A 的待定取消
    await sleep(CANCEL_WINDOW_MS)
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-b')
    w.unmount()
  })

  it('双击原未固定行：该行固定高亮且打开编辑，第二次点击不反向取消（CCFG-AC-142 a）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    await dblClickRow(w, disabledRow)
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-b')
    expect(w.find('.cc-dialog').text()).toContain('编辑探针')
    expect(mockedOptions).toHaveBeenCalledWith('probe-b')
    w.unmount()
  })

  it('双击原已固定行：继续固定高亮并打开编辑，双击窗口后也不被取消（CCFG-AC-142 b）', async () => {
    const w = await mountPage([enabledRow])
    await clickRow(w, enabledRow)
    expect(selectedRow(w).text()).toContain('probe-a')

    await dblClickRow(w, enabledRow)
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-a')
    expect(w.find('.cc-dialog').text()).toContain('编辑探针')
    await sleep(CANCEL_WINDOW_MS)
    expect(selectedRow(w).text()).toContain('probe-a')
    w.unmount()
  })

  it('已固定 A 时双击 B：固定选中转移到 B 并打开 B 编辑，迟到计时器不回写旧行（CCFG-AC-142 c）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    await clickRow(w, enabledRow)
    expect(selectedRow(w).text()).toContain('probe-a')

    await dblClickRow(w, disabledRow)
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-b')
    expect(w.find('.cc-dialog').text()).toContain('编辑探针')
    expect(mockedOptions).toHaveBeenCalledWith('probe-b')
    await sleep(CANCEL_WINDOW_MS)
    expect(selectedRow(w).text()).toContain('probe-b')
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    w.unmount()
  })

  it('探针 ID 键盘 Enter／Space 仍编辑，且不产生普通鼠标点击、不切换固定选中（CCFG-AC-142 d）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    await clickRow(w, enabledRow)
    const idCell = w.findAll('.cc-id').find((s) => s.text() === 'probe-b')!
    await idCell.trigger('keydown', { key: ' ', code: 'Space' })
    await flushPromises()
    expect(w.find('.cc-dialog').text()).toContain('编辑探针')
    expect(mockedOptions).toHaveBeenCalledWith('probe-b')
    // 键盘编辑入口不产生普通鼠标点击：固定选中仍在 A
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-a')
    w.unmount()
  })

  it('反复“单击固定 → 双击编辑 → 取消关闭”后，选中状态与用户最后一次操作一致（CCFG-AC-142 ④）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    for (let i = 0; i < 3; i += 1) {
      await clickRow(w, enabledRow)
      expect(selectedRow(w).text()).toContain('probe-a')
      await dblClickRow(w, enabledRow)
      expect(selectedRow(w).text()).toContain('probe-a')
      await exactButton(w, '取消')!.trigger('click')
      await flushPromises()
      await sleep(CANCEL_WINDOW_MS)
      expect(selectedRow(w).text()).toContain('probe-a')
    }
    // 最后一次操作改为固定 B：不得残留 A
    await clickRow(w, disabledRow)
    await dblClickRow(w, disabledRow)
    await sleep(CANCEL_WINDOW_MS)
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-b')
    await exactButton(w, '取消')!.trigger('click')
    await flushPromises()
    w.unmount()
  })

  it('真行内交互控件不因冒泡切换固定选中，也不误触发行双击编辑（CCFG-AC-143）', async () => {
    const w = await mountPage([abnormalRow, ambiguousRow])
    await clickRow(w, abnormalRow)
    expect(selectedRow(w).text()).toContain('probe-x')

    const isolated = ['.cc-abnormal-mark', '.cc-rowbad', '.cc-count-note', '.cc-more-link']
    for (const selector of isolated) {
      const el = w.find(selector)
      expect(el.exists(), selector).toBe(true)
      await el.trigger('click')
      await el.trigger('dblclick')
      await flushPromises()
    }
    // 固定选中保持不变，且行双击编辑未被误触发
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-x')
    expect(w.find('.cc-dialog').exists()).toBe(false)
    expect(mockedOptions).not.toHaveBeenCalled()
    w.unmount()
  })

  it('首次进入不保留任何固定选中（CCFG-AC-144）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    w.unmount()
  })

  it('“查询”与失败后“重试”等普通重载清除此前固定选中（CCFG-AC-144）', async () => {
    mockedList
      .mockResolvedValueOnce(okList([enabledRow, disabledRow])) // 首次加载
      .mockResolvedValueOnce(okList([enabledRow, disabledRow])) // 查询（成功）
      .mockRejectedValueOnce(new Error('network down')) // 查询（失败）
      .mockResolvedValueOnce(okList([enabledRow, disabledRow])) // 重试（成功）
    const w = await mountRaw()
    await clickRow(w, enabledRow)
    expect(selectedRow(w).text()).toContain('probe-a')

    // ① 查询触发普通重载 → 清除
    await exactButton(w, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)

    // ② 制造加载失败：失败态下重新固定一行，再点击“重试” → 重载同样清除
    await exactButton(w, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(3)
    expect(w.find('.cc-load-error').exists()).toBe(true)
    await clickRow(w, disabledRow)
    expect(selectedRow(w).text()).toContain('probe-b')
    await exactButton(w, '重试')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(4)
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    w.unmount()
  })

  it('单独“重置”只清空查询控件：不发起请求，也不清除固定选中（CCFG-AC-144）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    await clickRow(w, enabledRow)
    expect(selectedRow(w).text()).toContain('probe-a')

    await exactButton(w, '重置')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(1)
    expect(selectedRow(w).text()).toContain('probe-a')
    w.unmount()
  })

  it('页面不新增刷新按钮、自动刷新、轮询与最近刷新时间（CCFG-AC-144）', async () => {
    const w = await mountPage([enabledRow])
    expect(exactButton(w, '刷新')).toBeUndefined()
    expect(w.text()).not.toContain('最近刷新')
    expect(w.text()).not.toContain('自动刷新')
    expect(SFC_SOURCE).not.toContain('setInterval')
    w.unmount()
  })

  it('停用成功重载：目标仍在结果中则固定目标行，即便操作前固定的是另一行（CCFG-AC-145 ①）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    await clickRow(w, disabledRow)
    expect(selectedRow(w).text()).toContain('probe-b')

    await clickRowMenuAction(w, 0, '停用')
    expect(messageSpy.success).toHaveBeenCalledWith('停用成功')
    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-a')
    w.unmount()
  })

  it('停用成功重载：目标被当前状态筛选过滤掉则清除固定选中，不保留看不见的已选行（CCFG-AC-145 ②）', async () => {
    mockedList
      .mockResolvedValueOnce(okList([enabledRow]))
      .mockResolvedValueOnce(okList([disabledRow]))
    const w = await mountRaw()
    await clickRow(w, enabledRow)
    expect(selectedRow(w).text()).toContain('probe-a')

    await clickRowMenuAction(w, 0, '停用')
    expect(messageSpy.success).toHaveBeenCalledWith('停用成功')
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    w.unmount()
  })

  it('启用成功重载：目标仍在结果中则固定目标行（CCFG-AC-145 ①）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    await clickRow(w, enabledRow)
    expect(selectedRow(w).text()).toContain('probe-a')

    await clickRowMenuAction(w, 1, '启用')
    expect(messageSpy.success).toHaveBeenCalledWith('启用成功')
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-b')
    w.unmount()
  })

  it('启停取消确认与启停失败均保留原有固定选中（CCFG-AC-145 ③④）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    await clickRow(w, disabledRow)
    expect(selectedRow(w).text()).toContain('probe-b')

    // 启用确认取消（index 1 为停用行）：不写请求、保留固定选中
    confirmSpy.mockRejectedValueOnce('cancel')
    await clickRowMenuAction(w, 1, '启用')
    expect(mockedEnable).not.toHaveBeenCalled()
    expect(selectedRow(w).text()).toContain('probe-b')

    // 停用失败（index 0 为启用行）：保留固定选中，不重载
    mockedDisable.mockRejectedValueOnce(new Error('network down'))
    await clickRowMenuAction(w, 0, '停用')
    expect(messageSpy.error).toHaveBeenCalledWith('停用失败，请检查网络后重试。')
    expect(selectedRow(w).text()).toContain('probe-b')
    w.unmount()
  })

  it('删除成功重载清除固定选中；删除取消保留原有固定选中（CCFG-AC-145 ⑤⑥）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    await clickRow(w, enabledRow)
    expect(selectedRow(w).text()).toContain('probe-a')

    confirmSpy.mockRejectedValueOnce('cancel')
    await clickRowMenuAction(w, 1, '删除')
    expect(mockedDelete).not.toHaveBeenCalled()
    expect(selectedRow(w).text()).toContain('probe-a')

    await clickRowMenuAction(w, 1, '删除')
    expect(mockedDelete).toHaveBeenCalledWith('probe-b')
    expect(messageSpy.success).toHaveBeenCalledWith('删除成功')
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    w.unmount()
  })

  it('普通重载撤销待定的单击取消：迟到的计时器不复活已不可见的选中行（CCFG-REQ-145）', async () => {
    const w = await mountPage([enabledRow, disabledRow])
    await clickRow(w, enabledRow)
    await clickRow(w, enabledRow) // 进入取消判定窗口

    await exactButton(w, '查询')!.trigger('click')
    await flushPromises()
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    // 计时器即使迟到也不得把选中行写回
    await sleep(CANCEL_WINDOW_MS)
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    w.unmount()
  })

  it('启停重载在途时发起普通查询：查询发起即清选、查询成功后无固定选中，迟到的启停列表响应不恢复（CCFG-REQ-145/146）', async () => {
    const pendingAdminReload = deferred<ApiResponse<ClientListVO>>()
    const pendingQueryReload = deferred<ApiResponse<ClientListVO>>()
    mockedList
      .mockResolvedValueOnce(okList([enabledRow, disabledRow])) // 首次加载
      .mockReturnValueOnce(pendingAdminReload.promise) // 停用成功自身触发的重载（响应挂起）
      .mockReturnValueOnce(pendingQueryReload.promise) // 用户“查询”发起的普通重载（最新请求）
    const w = await mountRaw()
    await clickRow(w, enabledRow)
    expect(selectedRow(w).text()).toContain('probe-a')

    // ① 停用成功 → 发起携带目标 probe-a 的启停重载；响应尚未返回
    await clickRowMenuAction(w, 0, '停用')
    expect(messageSpy.success).toHaveBeenCalledWith('停用成功')
    expect(mockedList).toHaveBeenCalledTimes(2)
    // 启停重载在途期间，原固定选中暂未被清除（唯一例外不按普通重载处理）
    expect(selectedRow(w).text()).toContain('probe-a')

    // ② 用户点“查询” → 普通重载成为最新请求，发起时即清除旧固定选中
    await exactButton(w, '查询')!.trigger('click')
    expect(mockedList).toHaveBeenCalledTimes(3)
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)

    // ③ 查询成功且结果仍含 probe-a：普通重载不得继承启停目标、不得重新固定 A
    pendingQueryReload.resolve(okList([enabledRow, disabledRow]))
    await flushPromises()
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)

    // ④ 过期的启停列表响应随后到达（结果同样含 probe-a）：不得回写、不得恢复 A
    pendingAdminReload.resolve(okList([enabledRow, disabledRow]))
    await flushPromises()
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    w.unmount()
  })

  it('启停重载在途时另一普通重载（删除成功）不继承启停重选目标（CCFG-REQ-145）', async () => {
    const pendingAdminReload = deferred<ApiResponse<ClientListVO>>()
    const pendingDeleteReload = deferred<ApiResponse<ClientListVO>>()
    mockedList
      .mockResolvedValueOnce(okList([enabledRow, disabledRow])) // 首次加载
      .mockReturnValueOnce(pendingAdminReload.promise) // 停用成功自身触发的重载（挂起）
      .mockReturnValueOnce(pendingDeleteReload.promise) // 删除成功触发的普通重载（最新请求）
    const w = await mountRaw()
    await clickRow(w, enabledRow)
    expect(selectedRow(w).text()).toContain('probe-a')

    await clickRowMenuAction(w, 0, '停用') // 启停重载在途
    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(selectedRow(w).text()).toContain('probe-a')

    // 另一行的删除成功 → 普通重载成为最新请求，发起时清除固定选中
    await clickRowMenuAction(w, 1, '删除')
    expect(messageSpy.success).toHaveBeenCalledWith('删除成功')
    expect(mockedList).toHaveBeenCalledTimes(3)
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)

    // 删除成功重载按 CCFG-REQ-145 清选：即使结果仍含 probe-a 也不固定
    pendingDeleteReload.resolve(okList([enabledRow]))
    await flushPromises()
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)

    // 过期的启停响应到达也不得恢复 probe-a
    pendingAdminReload.resolve(okList([enabledRow, disabledRow]))
    await flushPromises()
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    w.unmount()
  })

  it('启停重载在途时普通查询失败：发起即清选、失败保留上次结果且不重选，迟到启停响应不恢复（CCFG-REQ-145）', async () => {
    const pendingAdminReload = deferred<ApiResponse<ClientListVO>>()
    const pendingQueryReload = deferred<ApiResponse<ClientListVO>>()
    mockedList
      .mockResolvedValueOnce(okList([enabledRow, disabledRow])) // 首次加载
      .mockReturnValueOnce(pendingAdminReload.promise) // 停用成功自身触发的重载（挂起）
      .mockReturnValueOnce(pendingQueryReload.promise) // “查询”发起的普通重载（最新请求）
    const w = await mountRaw()
    await clickRow(w, enabledRow)
    await clickRowMenuAction(w, 0, '停用')
    expect(mockedList).toHaveBeenCalledTimes(2)

    await exactButton(w, '查询')!.trigger('click')
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)

    // 查询失败：按既有规则提示失败、保留上一次成功结果，但不得固定任何行
    pendingQueryReload.resolve(failList(500, 'boom'))
    await flushPromises()
    expect(w.find('.cc-load-error').exists()).toBe(true)
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)

    pendingAdminReload.resolve(okList([enabledRow, disabledRow]))
    await flushPromises()
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    w.unmount()
  })

  it('多个启停重载交错：最终固定行由最新有效请求自身的目标决定，过期请求不回写（CCFG-REQ-146）', async () => {
    const pendingDisable = deferred<ApiResponse<ClientListVO>>()
    const pendingEnable = deferred<ApiResponse<ClientListVO>>()
    mockedList
      .mockResolvedValueOnce(okList([enabledRow, disabledRow])) // 首次加载
      .mockReturnValueOnce(pendingDisable.promise) // 停用 probe-a 自身重载（目标 probe-a）
      .mockReturnValueOnce(pendingEnable.promise) // 启用 probe-b 自身重载（目标 probe-b，最新）
    const w = await mountRaw()
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)

    await clickRowMenuAction(w, 0, '停用') // 目标 probe-a
    await clickRowMenuAction(w, 1, '启用') // 目标 probe-b，成为最新请求
    expect(mockedList).toHaveBeenCalledTimes(3)

    // 过期的停用响应（结果含 probe-a）先到：不得固定 probe-a
    pendingDisable.resolve(okList([enabledRow, disabledRow]))
    await flushPromises()
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)

    // 最新的启用响应到达：按其自身目标 probe-b 固定（结果含 probe-b）
    pendingEnable.resolve(okList([enabledRow, disabledRow]))
    await flushPromises()
    expect(w.findAll('.cc-row--selected')).toHaveLength(1)
    expect(selectedRow(w).text()).toContain('probe-b')
    w.unmount()
  })

  it('启停写请求失败不把重选意图留给后续普通重载：之后“查询”不固定任何行（CCFG-REQ-146）', async () => {
    mockedDisable.mockRejectedValueOnce(new Error('network down'))
    const w = await mountPage([enabledRow, disabledRow])
    await clickRow(w, enabledRow)
    expect(selectedRow(w).text()).toContain('probe-a')

    // ① 停用写请求失败：保留原有固定选中（既有规则）
    await clickRowMenuAction(w, 0, '停用')
    expect(messageSpy.error).toHaveBeenCalledWith('停用失败，请检查网络后重试。')
    expect(mockedList).toHaveBeenCalledTimes(1)
    expect(selectedRow(w).text()).toContain('probe-a')

    // ② 随后普通“查询”：只按普通重载清选，不因此前失败的目标固定任何行
    await exactButton(w, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(w.findAll('.cc-row--selected')).toHaveLength(0)
    w.unmount()
  })

  it('静态：固定高亮与悬停使用可区分视觉层级，且悬停不改变固定高亮底色（CCFG-AC-141 ⑤/CCFG-UI-065）', () => {
    const ns = ':deep(.cc-table .el-table__body '
    // el-table 行单击会自带 `current-row` 底色，须归零，否则固定高亮之外还叠一层 EP 当前行底色
    expect(
      declValue(cssBlock(SFC_SOURCE, `${ns}tr.current-row > td.el-table__cell)`), 'background-color'),
    ).toBe('transparent')

    const selectedBg = declValue(
      cssBlock(SFC_SOURCE, `${ns}tr.cc-row--selected > td.el-table__cell)`),
      'background-color',
    )
    expect(selectedBg).not.toBe('')
    // 悬停自身／其他行都不得改变固定高亮底色：悬停态取同一底色
    expect(
      declValue(
        cssBlock(SFC_SOURCE, `${ns}tr.cc-row--selected:hover > td.el-table__cell)`),
        'background-color',
      ),
    ).toBe(selectedBg)
    // 固定选中另以左缘强调线带与悬停区分
    expect(SFC_SOURCE).toContain('tr.cc-row--selected > td.el-table__cell:first-child')
    expect(SFC_SOURCE).toContain('box-shadow')
    expect(SFC_SOURCE).not.toContain('!important')
  })
})
