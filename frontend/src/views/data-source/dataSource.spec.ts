import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MockInstance } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus'
import type { ApiResponse } from '@/types/monitor'
import type {
  DataSourceDetail,
  DataSourceListRow,
  DataSourceStatusResult,
  NamingStrategyVO,
  TestConnectionResult,
} from '@/types/dataSource'

vi.mock('@/api/dataSource', () => ({
  fetchDataSourceList: vi.fn(),
  fetchDataSourceDetail: vi.fn(),
  createDataSource: vi.fn(),
  updateDataSource: vi.fn(),
  deleteDataSource: vi.fn(),
  testDataSourceConnection: vi.fn(),
  fetchTargetOptions: vi.fn(),
  fetchBizAttr: vi.fn(),
  saveBizAttr: vi.fn(),
  fetchNamingStrategies: vi.fn(),
  createNamingStrategy: vi.fn(),
  updateNamingStrategy: vi.fn(),
  deleteNamingStrategy: vi.fn(),
  enableDataSource: vi.fn(),
  disableDataSource: vi.fn(),
}))

import {
  fetchDataSourceList,
  fetchDataSourceDetail,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSourceConnection,
  fetchTargetOptions,
  fetchBizAttr,
  saveBizAttr,
  fetchNamingStrategies,
  createNamingStrategy,
  updateNamingStrategy,
  deleteNamingStrategy,
  enableDataSource,
  disableDataSource,
} from '@/api/dataSource'
import DataSourcePage from '@/views/data-source/DataSourcePage.vue'

const mockedList = vi.mocked(fetchDataSourceList)
const mockedDetail = vi.mocked(fetchDataSourceDetail)
const mockedCreate = vi.mocked(createDataSource)
const mockedUpdate = vi.mocked(updateDataSource)
const mockedDelete = vi.mocked(deleteDataSource)
const mockedTest = vi.mocked(testDataSourceConnection)
const mockedTargetOptions = vi.mocked(fetchTargetOptions)
const mockedBizAttr = vi.mocked(fetchBizAttr)
const mockedSaveBizAttr = vi.mocked(saveBizAttr)
const mockedNaming = vi.mocked(fetchNamingStrategies)
const mockedCreateNaming = vi.mocked(createNamingStrategy)
const mockedUpdateNaming = vi.mocked(updateNamingStrategy)
const mockedDeleteNaming = vi.mocked(deleteNamingStrategy)
const mockedEnable = vi.mocked(enableDataSource)
const mockedDisable = vi.mocked(disableDataSource)

const srcRow: DataSourceListRow = {
  dataSourceId: 'SRC001',
  dataSourceName: '源库A',
  dataSourceCategory: 'SOURCE',
  dataSourceType: 'ORACLE',
  host: '10.1.1.1',
  port: 1521,
  serviceName: 'orcl',
  userName: 'scott',
  fgActive: '1',
}

const tgtRow: DataSourceListRow = {
  dataSourceId: 'TG001',
  dataSourceName: '目标库B',
  dataSourceCategory: 'TARGET',
  dataSourceType: 'MYSQL',
  host: '10.1.1.2',
  port: 3306,
  serviceName: 'mydb',
  userName: 'app',
  fgActive: '1',
}

function okList(data: DataSourceListRow[]): ApiResponse<DataSourceListRow[]> {
  return { code: 200, message: 'success', timestamp: '', data }
}

function failList(code: number, message: string): ApiResponse<DataSourceListRow[]> {
  return { code, message, timestamp: '', data: [] }
}

function okString(value: string): ApiResponse<string> {
  return { code: 200, message: 'success', timestamp: '', data: value }
}

function okRow(row: DataSourceDetail): ApiResponse<DataSourceDetail> {
  return { code: 200, message: 'success', timestamp: '', data: row }
}

function okNull(): ApiResponse<null> {
  return { code: 200, message: 'success', timestamp: '', data: null }
}

/** 启停成功结果（API.md §11.1）：data.success=true。 */
function okStatus(): ApiResponse<DataSourceStatusResult> {
  return { code: 200, message: 'success', timestamp: '', data: { success: true } }
}

/** 启停失败响应：后端错误路径返回 data=null（只有成功码才携带 data.success）。 */
function failStatus(code: number, message: string): ApiResponse<DataSourceStatusResult> {
  return { code, message, timestamp: '', data: null as unknown as DataSourceStatusResult }
}

function okTest(success: boolean, message: string): ApiResponse<TestConnectionResult> {
  return { code: 200, message: 'success', timestamp: '', data: { success, message } }
}

const strategyRow: NamingStrategyVO = {
  sourceDataSourceId: 'SRC001',
  targetDataSourceId: 'TG001',
  targetDataSourceName: '目标库B',
  targetDataSourceType: 'MYSQL',
  tableNamingStrategy: 'TABLE_MERGE',
  tableNamePrefix: '',
  tableNameSuffix: '',
}

async function mountPage() {
  // attachTo 使组件树挂载进 document，弹窗/查询等 document.querySelector 才能命中，
  // 也让 DataSourcePage 的弹窗拖动 watch（内部用 document.querySelector）真正生效。
  const wrapper = mount(DataSourcePage, {
    attachTo: document.body,
    global: { plugins: [ElementPlus] },
  })
  await flushPromises()
  return wrapper
}

type PageWrapper = Awaited<ReturnType<typeof mountPage>>

const buttonByText = (w: PageWrapper, text: string) =>
  w.findAll('button').find((b) => b.text().includes(text))

/** 按精确文本定位按钮，避免 `新增` 误匹配工具栏的 `新增数据源`。 */
const exactButton = (w: PageWrapper, text: string) =>
  w.findAll('button').find((b) => b.text().trim() === text)

/** 编辑器弹窗内按 label 定位的 input。 */
function editorInput(w: PageWrapper, label: string) {
  const items = w.findAll('.editor-form .el-form-item')
  const item = items.find((i) => i.text().includes(label))
  if (!item) {
    throw new Error(`editor form-item not found for label: ${label}`)
  }
  const input = item.find('input')
  if (!input.exists()) {
    throw new Error(`input not found for label: ${label}`)
  }
  return input
}

/** 命名策略表单内按 label 定位的 input。 */
function namingInput(w: PageWrapper, label: string) {
  const items = w.findAll('.naming-form .el-form-item')
  const item = items.find((i) => i.text().includes(label))
  if (!item) {
    throw new Error(`naming form-item not found for label: ${label}`)
  }
  const input = item.find('input')
  if (!input.exists()) {
    throw new Error(`input not found for label: ${label}`)
  }
  return input
}

/** 当前可见的下拉面板（`el-select` 面板 teleport 到 body；已关闭的 popper 父级含 display:none）。 */
function visibleSelectDropdown(optionLabel: string): Element | null {
  return (
    Array.from(document.body.querySelectorAll('.el-select-dropdown'))
      .filter((d) => {
        const popper = d.parentElement
        return !!popper && !(popper.getAttribute('style') || '').includes('display: none')
      })
      .find((d) =>
        Array.from(d.querySelectorAll('.el-select-dropdown__item')).some((it) =>
          it.textContent?.includes(optionLabel),
        ),
      ) ?? null
  )
}

/** 点击当前可见下拉中含指定文本的选项。 */
async function clickVisibleOption(optionLabel: string) {
  const dropdown = visibleSelectDropdown(optionLabel)
  if (!dropdown) {
    throw new Error(`dropdown not found for option: ${optionLabel}`)
  }
  const item = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item')).find((it) =>
    it.textContent?.includes(optionLabel),
  )
  if (!item) {
    throw new Error(`option not found: ${optionLabel}`)
  }
  ;(item as HTMLElement).click()
  await nextTick()
  await nextTick()
}

/** 真实点击 el-select 展开下拉，再点击当前可见下拉中含指定文本的选项（下拉 teleport 到 body）。 */
async function pickSelect(
  w: PageWrapper,
  container: string,
  selectIndex: number,
  optionLabel: string,
) {
  const selects = w.findAll(`${container} .el-select`)
  const select = selects[selectIndex]
  if (!select) {
    throw new Error(`select #${selectIndex} not found in ${container}`)
  }
  await select.find('.el-select__wrapper').trigger('click')
  await nextTick()
  await nextTick()
  await clickVisibleOption(optionLabel)
}

/** 真实点击命名策略单选卡片（DS-REQ-115 自绘卡片，非 el-radio）。 */
async function clickStrategyCard(w: PageWrapper, name: string) {
  const cards = w.findAll('.naming-form .strategy-card')
  const target = cards.find((c) => c.text().includes(name))
  if (!target) {
    throw new Error(`strategy card not found: ${name}`)
  }
  await target.trigger('click')
  await nextTick()
}

/** 查询区字段组（标签 + 控件，公共查询面板的直接 flex 子项）。 */
function queryGroup(w: PageWrapper, label: string) {
  const group = w.findAll('.ds-q-group').find((g) => g.find('.ds-q-label').text() === label)
  if (!group) {
    throw new Error(`query group not found for label: ${label}`)
  }
  return group
}

/** 设置查询区输入框。 */
async function setQueryInput(w: PageWrapper, label: string, value: string) {
  await queryGroup(w, label).find('input').setValue(value)
}

/** 查询区输入框当前值（原生 input 的 value）。 */
function queryInputValue(w: PageWrapper, label: string): string {
  return (queryGroup(w, label).find('input').element as HTMLInputElement).value
}

/** 选择查询区“角色”单选下拉框选项（teleport 到 body）。 */
async function pickQueryCategory(w: PageWrapper, optionLabel: string) {
  await queryGroup(w, '角色').find('.el-select__wrapper').trigger('click')
  await nextTick()
  await nextTick()
  await clickVisibleOption(optionLabel)
}

/** 双击数据行打开编辑：编辑入口唯一，可见“编辑”按钮已移除（DS-REQ-130）。 */
async function openEditRow(w: PageWrapper, row: DataSourceListRow) {
  w.findComponent({ name: 'ElTable' }).vm.$emit('row-dblclick', row)
  await flushPromises()
}

/**
 * 第 rowIndex 行“更多”菜单的菜单项。
 * 菜单 teleport 到 body 且持久渲染（组件未卸载即长期留在 document 中），
 * 因此按触发器 `aria-controls` 指向的菜单 id 精确定位，避免命中其他页面的残留弹层。
 */
function rowMenuItems(w: PageWrapper, rowIndex = 0): Element[] {
  const menuId = w.findAll('.row-more')[rowIndex]?.attributes('aria-controls')
  if (!menuId) return []
  const menu = document.getElementById(menuId)
  return menu ? Array.from(menu.querySelectorAll('.el-dropdown-menu__item')) : []
}

/** 行“更多”菜单的可见项文本（含分隔线项时为空字符串已过滤）。 */
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
  const trigger = w.findAll('.row-more')[rowIndex]
  if (!trigger) {
    throw new Error(`row-more trigger not found at index ${rowIndex}`)
  }
  if (trigger.element.getAttribute('aria-expanded') === 'true') {
    return
  }
  await trigger.trigger('click')
  // 等待一次真实定时器宏任务：`flushPromises` 走 `setImmediate`，会在 `setTimeout(0)`
  // 之前返回，因此不足以让 delayed toggle 真正展开。
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

/** fake timers 下冲刷微任务（flushPromises 依赖 setTimeout 会挂起）。 */
async function flushFake() {
  for (let i = 0; i < 5; i++) {
    await nextTick()
  }
}

let elMessageSuccessSpy: MockInstance
let elMessageErrorSpy: MockInstance
let confirmSpy: MockInstance

beforeEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  elMessageSuccessSpy = vi.spyOn(ElMessage, 'success').mockImplementation(() => undefined as never)
  elMessageErrorSpy = vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never)
  confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as never)
  mockedList.mockReset()
  mockedDetail.mockReset()
  mockedCreate.mockReset()
  mockedUpdate.mockReset()
  mockedDelete.mockReset()
  mockedEnable.mockReset()
  mockedDisable.mockReset()
  mockedTest.mockReset()
  mockedTargetOptions.mockReset()
  mockedBizAttr.mockReset()
  mockedSaveBizAttr.mockReset()
  mockedNaming.mockReset()
  mockedCreateNaming.mockReset()
  mockedUpdateNaming.mockReset()
  mockedDeleteNaming.mockReset()
  mockedList.mockResolvedValue(okList([srcRow, tgtRow]))
  mockedDetail.mockResolvedValue(okRow(srcRow))
  mockedCreate.mockResolvedValue(okString('TG002'))
  mockedUpdate.mockResolvedValue(okString('SRC001'))
  mockedDelete.mockResolvedValue(okNull())
  mockedEnable.mockResolvedValue(okStatus())
  mockedDisable.mockResolvedValue(okStatus())
  mockedTargetOptions.mockResolvedValue({
    code: 200,
    message: 'success',
    timestamp: '',
    data: [
      { dataSourceId: 'TG001', dataSourceName: '目标库B', dataSourceType: 'MYSQL' },
      { dataSourceId: 'TG002', dataSourceName: '目标库C', dataSourceType: 'DORIS' },
    ],
  })
  mockedBizAttr.mockResolvedValue({
    code: 200,
    message: 'success',
    timestamp: '',
    data: { dataSourceId: 'TG001', bizAttr: '{"a": 1}' },
  })
  mockedSaveBizAttr.mockResolvedValue(okNull())
  mockedNaming.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: [strategyRow] })
  mockedCreateNaming.mockResolvedValue(okNull())
  mockedUpdateNaming.mockResolvedValue(okNull())
  mockedDeleteNaming.mockResolvedValue(okNull())
  mockedTest.mockResolvedValue(okTest(true, '连接成功'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  // 组件以 attachTo: document.body 挂载，teleport 的弹层留在 body 中；
  // 清空 body 保证每个用例从干净 DOM 开始（否则残留弹层会干扰后续用例的弹层状态）。
  document.body.innerHTML = ''
})

describe('列表加载与查询', () => {
  it('成功加载渲染两行、角色标签与公共组件三段结构', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('SRC001')
    expect(wrapper.text()).toContain('TG001')
    expect(wrapper.text()).toContain('源库')
    expect(wrapper.text()).toContain('目标库')

    // 选择性接入的四个公共组件（DS-REQ-117）
    expect(wrapper.find('.ql-page').exists()).toBe(true)
    expect(wrapper.find('.ql-page__title').text()).toBe('数据源管理')
    expect(wrapper.find('.ql-q-panel').exists()).toBe(true)
    expect(wrapper.find('.ql-actions').exists()).toBe(true)
    expect(wrapper.find('.ql-result-panel').exists()).toBe(true)
    // 结果区固定结构：头部 → 固定错误槽 → 固定分隔线 → body（DS-REQ-123/136）
    expect(wrapper.find('.ql-result-panel__header').exists()).toBe(true)
    expect(wrapper.find('.ql-result-panel__error-slot').exists()).toBe(true)
    expect(wrapper.find('.ql-result-panel__divider').exists()).toBe(true)
    expect(wrapper.find('.ql-result-panel__body .data-table').exists()).toBe(true)
    // 不接入刷新工具栏、无分页（DS-REQ-119/136）
    expect(wrapper.find('.ql-refresh-group').exists()).toBe(false)
    expect(wrapper.find('.el-pagination').exists()).toBe(false)
    wrapper.unmount()
  })

  it('查询 trim 后按 AND 传参；重置只清空控件且不发请求', async () => {
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', ' SRC ')
    await setQueryInput(wrapper, '名称', ' 源 ')
    await setQueryInput(wrapper, '主机', ' 10.1 ')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'SRC', name: '源', host: '10.1' })

    // 角色 = 源库：只提交规范化代码 SOURCE，绝不提交中文展示值（DS-REQ-126）
    await pickQueryCategory(wrapper, '源库')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({
      id: 'SRC',
      name: '源',
      host: '10.1',
      category: 'SOURCE',
    })
    expect(JSON.stringify(mockedList.mock.calls.at(-1))).not.toContain('源库')

    // 重置：只清空三个文本条件 + 角色回到“全部”，重置自身发起 0 个请求（DS-REQ-139/141）
    const callsBeforeReset = mockedList.mock.calls.length
    await buttonByText(wrapper, '重置')!.trigger('click')
    await flushPromises()
    expect(mockedList.mock.calls.length).toBe(callsBeforeReset)
    // 绑定值为空串时 el-select 以占位符呈现当前值，两份文案都固定为“全部”
    expect(queryGroup(wrapper, '角色').find('.el-select__placeholder').text()).toBe('全部')
    expect(queryInputValue(wrapper, '数据源ID')).toBe('')
    wrapper.unmount()
  })

  it('业务失败 code!=200 展示错误', async () => {
    mockedList.mockResolvedValueOnce(failList(50000, '数据源列表加载失败'))
    const wrapper = await mountPage()
    expect(wrapper.find('.load-error').text()).toContain('数据源列表加载失败')
    wrapper.unmount()
  })

  it('网络异常展示错误', async () => {
    mockedList.mockRejectedValueOnce(new Error('network down'))
    const wrapper = await mountPage()
    expect(wrapper.find('.load-error').text()).toContain('network down')
    wrapper.unmount()
  })
})

describe('查询列表公共组件选择性接入（DS-REQ-116~138）', () => {
  it('查询区角色为单选下拉框，选项顺序与展示文案固定，默认全部', async () => {
    const wrapper = await mountPage()
    const group = queryGroup(wrapper, '角色')

    // 单选下拉框而非 Radio（DS-REQ-125）；140px 宽度由 scoped 样式冻结（视觉检查复核）
    expect(group.find('.el-select').exists()).toBe(true)
    expect(group.find('.el-radio-group').exists()).toBe(false)
    expect(group.find('.ds-q-category').exists()).toBe(true)
    // 默认“全部”
    expect(group.find('.el-select__placeholder').text()).toBe('全部')

    // 选项顺序与展示文案固定：全部 / 源库 / 目标库
    await group.find('.el-select__wrapper').trigger('click')
    await nextTick()
    await nextTick()
    const dropdown = visibleSelectDropdown('全部')
    expect(dropdown).not.toBeNull()
    expect(
      Array.from(dropdown!.querySelectorAll('.el-select-dropdown__item')).map((item) =>
        (item.textContent ?? '').trim(),
      ),
    ).toEqual(['全部', '源库', '目标库'])
    wrapper.unmount()
  })

  it('角色=目标库提交 TARGET；角色=全部不提交 category（不发中文值、无分页参数）', async () => {
    const wrapper = await mountPage()

    await pickQueryCategory(wrapper, '目标库')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({ category: 'TARGET' })
    expect(JSON.stringify(mockedList.mock.calls.at(-1))).not.toContain('目标库')

    // 选回“全部”后条件整体缺席，且无任何分页参数
    await pickQueryCategory(wrapper, '全部')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({})
    expect(Object.keys(mockedList.mock.calls.at(-1)![0] ?? {})).not.toContain('page')
    wrapper.unmount()
  })

  it('结果区头部只显示“共 n 条”、工具栏仅新增数据源；加载失败信息落在固定错误槽内', async () => {
    const wrapper = await mountPage()
    // 左上角只显示“共 n 条”，“数据源列表”文字已删除（DS-REQ-141）
    expect(wrapper.find('.ql-result-panel__summary').text()).toBe('共 2 条')
    expect(wrapper.find('.ql-result-panel__summary').text()).not.toContain('数据源列表')
    expect(wrapper.find('.ql-result-panel__toolbar').findAll('button').map((b) => b.text())).toEqual([
      '新增数据源',
    ])
    // 无失败时错误槽内无告警，但固定结构仍在
    expect(wrapper.find('.ql-result-panel__error-slot').exists()).toBe(true)
    expect(wrapper.find('.ql-result-panel__error-slot .load-error').exists()).toBe(false)
    wrapper.unmount()

    mockedList.mockResolvedValueOnce(failList(50000, '数据源列表加载失败'))
    const failed = await mountPage()
    expect(failed.find('.ql-result-panel__error-slot .load-error').exists()).toBe(true)
    expect(failed.find('.ql-result-panel__body .data-table').exists()).toBe(true)
    failed.unmount()
  })

  it('加载期间固定结构不塌陷：错误槽、分隔线与主体槽仍在，且无分页', async () => {
    mockedList.mockReturnValueOnce(new Promise<ApiResponse<DataSourceListRow[]>>(() => {}))
    const wrapper = await mountPage()

    expect(wrapper.find('.ql-result-panel__error-slot').exists()).toBe(true)
    expect(wrapper.find('.ql-result-panel__divider').exists()).toBe(true)
    expect(wrapper.find('.ql-result-panel__body').exists()).toBe(true)
    expect(wrapper.find('.el-pagination').exists()).toBe(false)
    expect(wrapper.find('.ql-refresh-group').exists()).toBe(false)
    wrapper.unmount()
  })

  it('操作列只有带文字的“更多”入口：无编辑按钮、菜单不含编辑，启用行菜单含停用与危险色删除正确', async () => {
    const wrapper = await mountPage()

    // 无行内编辑按钮；操作列唯一入口是“更多”（DS-REQ-130/131）
    expect(wrapper.findAll('.data-table button').map((b) => b.text())).toEqual([])
    expect(wrapper.findAll('.row-more').map((el) => el.text().trim())).toEqual(['更多', '更多'])

    // 启用源库行：目标库命名策略 / 分隔线 / 停用 / 删除（DS-REQ-132/167）
    await openRowMenu(wrapper, 0)
    expect(rowMenuLabels(wrapper, 0)).toEqual(['目标库命名策略', '停用', '删除'])
    expect(rowMenuLabels(wrapper, 0)).not.toContain('编辑')
    // 启用目标库行：业务属性 / 分隔线 / 停用 / 删除（DS-REQ-133/167）
    await openRowMenu(wrapper, 1)
    expect(rowMenuLabels(wrapper, 1)).toEqual(['业务属性', '停用', '删除'])

    const menuId = wrapper.findAll('.row-more')[0].attributes('aria-controls')!
    const menu = document.getElementById(menuId)!
    // 分隔线独立渲染且恰好一条：位于业务入口与启用/停用之间（DS-REQ-167 / R1 §3.3）
    expect(menu.querySelectorAll('.el-dropdown-menu__item--divided')).toHaveLength(1)
    expect(menu.querySelectorAll('.el-dropdown-menu__item')).toHaveLength(3)
    // 删除项为危险色样式且为最后一项，其前不得产生第二条分隔线（R1 §3.3）
    const deleteItem = rowMenuItems(wrapper, 0).find((el) => (el.textContent ?? '').trim() === '删除')!
    expect(deleteItem.className).toContain('ds-more-danger')
    expect(deleteItem.className).not.toContain('el-dropdown-menu__item--divided')
    // 停用为警示色，与红色删除可区分
    const disableItem = rowMenuItems(wrapper, 0).find((el) => (el.textContent ?? '').trim() === '停用')!
    expect(disableItem.className).toContain('ds-more-warning')
    // 唯一分隔线紧邻停用项之前（Element Plus 将 divided 渲染为独立 separator 元素）
    const separator = menu.querySelector('.el-dropdown-menu__item--divided')!
    expect(separator.nextElementSibling!.textContent!.trim()).toBe('停用')
    expect(separator.previousElementSibling!.textContent!.trim()).toBe('目标库命名策略')
    expect(rowMenuLabels(wrapper, 0).at(-1)).toBe('删除')
    wrapper.unmount()
  })

  it('菜单交互不触发行编辑：触发器双击与删除命令都不打开编辑弹窗', async () => {
    const wrapper = await mountPage()

    // 直接双击“更多”触发器：不冒泡到行双击，编辑弹窗不出现（DS-REQ-134）
    await wrapper.findAll('.row-more')[0].trigger('dblclick')
    await flushPromises()
    expect(wrapper.find('.editor-dialog').exists()).toBe(false)

    confirmSpy.mockRejectedValueOnce('cancel')
    await clickRowMenuAction(wrapper, 0, '删除')
    expect(wrapper.find('.editor-dialog').exists()).toBe(false)

    // 行双击仍是唯一编辑入口：在行内普通单元格上双击确实会进入编辑，
    // 说明上面的否定结论来自“更多”入口阻断冒泡，而非双击事件分发失效
    await wrapper.findAll('.data-table .el-table__body .cell')[0].trigger('dblclick')
    await flushPromises()
    expect(wrapper.find('.editor-dialog').exists()).toBe(true)
    wrapper.unmount()
  })

  it('长文本列保留 show-overflow-tooltip，且无行内编辑提示文案、无分页与刷新工具栏', async () => {
    const wrapper = await mountPage()

    expect(
      document.querySelectorAll('.data-table .el-table__body .el-tooltip').length,
    ).toBeGreaterThanOrEqual(1)
    expect(wrapper.text()).not.toContain('双击数据行可编辑')
    expect(wrapper.find('.el-pagination').exists()).toBe(false)
    expect(wrapper.find('.ql-refresh-group').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('行状态标识与逐行启用/停用（DS-REQ-160~173）', () => {
  const disabledRow: DataSourceListRow = { ...srcRow, fgActive: '0' }
  const abnormalRow: DataSourceListRow = {
    ...srcRow,
    dataSourceId: 'SRC003',
    dataSourceName: '源库C',
    fgActive: 'X',
  }
  const abnormalNullRow: DataSourceListRow = {
    ...srcRow,
    dataSourceId: 'SRC004',
    dataSourceName: '源库D',
    fgActive: null,
  }

  it('列表按原始 fgActive 渲染状态标识：启用无标识、停用显示“停用”、异常显示真实原值', async () => {
    mockedList.mockResolvedValue(
      okList([srcRow, disabledRow, abnormalRow, abnormalNullRow]),
    )
    const wrapper = await mountPage()

    const idCells = wrapper.findAll('.ds-id-cell')
    expect(idCells).toHaveLength(4)

    // 启用行（'1'）：无任何状态标识
    expect(idCells[0].find('.ds-inactive-mark').exists()).toBe(false)
    expect(idCells[0].find('.ds-abnormal-mark').exists()).toBe(false)
    // 停用行（'0'）
    expect(idCells[1].find('.ds-inactive-mark').text()).toBe('停用')
    // 异常行：显示真实原值，不做归一化
    expect(idCells[2].find('.ds-abnormal-mark').text()).toBe('异常（原始值=X）')
    // 原值为 NULL 时明确显示 NULL，而非空串（UI §11.4）
    expect(idCells[3].find('.ds-abnormal-mark').text()).toBe('异常（原始值=NULL）')
    wrapper.unmount()
  })

  it('响应缺失 fgActive 字段时显示契约异常提示，绝不显示 undefined（R1 §3.6）', async () => {
    const missingRow = { ...srcRow, dataSourceId: 'SRC005', dataSourceName: '源库E' } as DataSourceListRow
    delete (missingRow as { fgActive?: unknown }).fgActive
    mockedList.mockResolvedValue(okList([missingRow]))
    const wrapper = await mountPage()

    const cell = wrapper.find('.ds-id-cell')
    expect(cell.find('.ds-abnormal-mark').text()).toBe('异常（FG_ACTIVE 未返回）')
    // 缺字段行仍按异常安全边界处理，不显示“停用”标识
    expect(cell.find('.ds-inactive-mark').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('undefined')
    wrapper.unmount()
  })

  it('五种 fgActive 取值渲染均不含 undefined 文本（R1 §3.6）', async () => {
    const missingRow = { ...srcRow, dataSourceId: 'SRC005', dataSourceName: '源库E' } as DataSourceListRow
    delete (missingRow as { fgActive?: unknown }).fgActive
    mockedList.mockResolvedValue(
      okList([srcRow, disabledRow, abnormalNullRow, abnormalRow, missingRow]),
    )
    const wrapper = await mountPage()

    const idCells = wrapper.findAll('.ds-id-cell')
    expect(idCells).toHaveLength(5)
    expect(idCells[0].text()).toContain('SRC001')
    expect(idCells[1].find('.ds-inactive-mark').text()).toBe('停用')
    expect(idCells[2].find('.ds-abnormal-mark').text()).toBe('异常（原始值=NULL）')
    expect(idCells[3].find('.ds-abnormal-mark').text()).toBe('异常（原始值=X）')
    expect(idCells[4].find('.ds-abnormal-mark').text()).toBe('异常（FG_ACTIVE 未返回）')
    expect(wrapper.text()).not.toContain('undefined')
    wrapper.unmount()
  })

  it('启用行菜单为业务入口 + 停用 + 删除；停用行改为“启用”且不再出现“停用”', async () => {
    mockedList.mockResolvedValue(okList([srcRow, disabledRow]))
    const wrapper = await mountPage()

    await openRowMenu(wrapper, 0)
    expect(rowMenuLabels(wrapper, 0)).toEqual(['目标库命名策略', '停用', '删除'])

    await openRowMenu(wrapper, 1)
    expect(rowMenuLabels(wrapper, 1)).toEqual(['目标库命名策略', '启用', '删除'])
    expect(rowMenuLabels(wrapper, 1)).not.toContain('停用')
    // 停用行同结构：恰好一条分隔线、删除项不带分隔线（R1 §3.3）
    const menuId = wrapper.findAll('.row-more')[1].attributes('aria-controls')!
    const menu = document.getElementById(menuId)!
    expect(menu.querySelectorAll('.el-dropdown-menu__item--divided')).toHaveLength(1)
    expect(menu.querySelectorAll('.el-dropdown-menu__item')).toHaveLength(3)
    const enableItem = rowMenuItems(wrapper, 1).find((el) => (el.textContent ?? '').trim() === '启用')!
    expect(enableItem.className).not.toContain('el-dropdown-menu__item--divided')
    expect(menu.querySelector('.el-dropdown-menu__item--divided')!.nextElementSibling!.textContent!.trim()).toBe('启用')
    const deleteItem = rowMenuItems(wrapper, 1).find((el) => (el.textContent ?? '').trim() === '删除')!
    expect(deleteItem.className).not.toContain('el-dropdown-menu__item--divided')
    wrapper.unmount()
  })

  it('异常行菜单收敛为仅“停用”：隐藏业务写入口与删除', async () => {
    mockedList.mockResolvedValue(okList([abnormalRow]))
    const wrapper = await mountPage()

    await openRowMenu(wrapper, 0)
    expect(rowMenuLabels(wrapper, 0)).toEqual(['停用'])
    expect(rowMenuLabels(wrapper, 0)).not.toContain('删除')
    expect(rowMenuLabels(wrapper, 0)).not.toContain('目标库命名策略')
    wrapper.unmount()
  })

  it('异常行“停用”使用页面警示色（R1 §3.3）', async () => {
    mockedList.mockResolvedValue(okList([abnormalRow]))
    const wrapper = await mountPage()

    await openRowMenu(wrapper, 0)
    const disableItem = rowMenuItems(wrapper, 0).find(
      (el) => (el.textContent ?? '').trim() === '停用',
    )!
    expect(disableItem.className).toContain('ds-more-warning')
    expect(disableItem.className).not.toContain('ds-more-danger')
    // 异常行唯一允许的写操作，不含删除入口
    expect(rowMenuLabels(wrapper, 0)).toEqual(['停用'])
    wrapper.unmount()
  })

  it('异常行双击不打开编辑，提示先停用归一化', async () => {
    mockedList.mockResolvedValue(okList([abnormalRow]))
    const wrapper = await mountPage()

    await openEditRow(wrapper, abnormalRow)
    expect(wrapper.find('.editor-dialog').exists()).toBe(false)
    expect(mockedDetail).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('逐行停用：二次确认 → 调用 disable → 成功提示并按已生效条件刷新', async () => {
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', 'SRC')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()

    await clickRowMenuAction(wrapper, 0, '停用')

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mockedDisable).toHaveBeenCalledWith('SRC001')
    expect(mockedEnable).not.toHaveBeenCalled()
    expect(elMessageSuccessSpy).toHaveBeenCalledWith('数据源状态已更新')
    // 刷新仍使用已生效条件，而非未点击的草稿或无条件
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'SRC' })
    wrapper.unmount()
  })

  it('停用行逐行启用：调用 enable 接口并刷新', async () => {
    mockedList.mockResolvedValue(okList([disabledRow]))
    const wrapper = await mountPage()

    await clickRowMenuAction(wrapper, 0, '启用')

    expect(mockedEnable).toHaveBeenCalledWith('SRC001')
    expect(mockedDisable).not.toHaveBeenCalled()
    expect(elMessageSuccessSpy).toHaveBeenCalledWith('数据源状态已更新')
    expect(mockedList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('取消启停二次确认不调用接口、不刷新', async () => {
    const wrapper = await mountPage()
    confirmSpy.mockRejectedValueOnce('cancel')

    await clickRowMenuAction(wrapper, 0, '停用')

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mockedDisable).not.toHaveBeenCalled()
    expect(mockedList).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('启停失败保留表格/总数/已生效条件且不自动重查', async () => {
    mockedDisable.mockResolvedValueOnce(failStatus(50002, '状态更新失败，请重试'))
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', 'SRC')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    const callsBeforeToggle = mockedList.mock.calls.length

    await clickRowMenuAction(wrapper, 0, '停用')

    // 失败不刷新：无新增列表请求
    expect(mockedList.mock.calls.length).toBe(callsBeforeToggle)
    // 表格、总数与已应用条件保持不变（DS-REQ-172）
    expect(wrapper.findAll('.ds-id-cell')).toHaveLength(2)
    expect(wrapper.find('.ql-result-panel__summary').text()).toBe('共 2 条')
    expect(elMessageSuccessSpy).not.toHaveBeenCalled()
    expect(elMessageErrorSpy).toHaveBeenCalledWith('操作失败，请重试')
    wrapper.unmount()
  })

  it('启停失败按冻结错误码分支提示：40250 归一化提示、40400 后端消息', async () => {
    mockedList.mockResolvedValue(okList([srcRow, tgtRow]))
    const wrapper = await mountPage()

    // 40250：异常状态不可启用，提示先停用
    mockedDisable.mockResolvedValueOnce(
      failStatus(40250, '数据源状态异常，不可启用，请先停用以归一化状态'),
    )
    await clickRowMenuAction(wrapper, 0, '停用')
    expect(elMessageErrorSpy).toHaveBeenLastCalledWith('数据源状态异常，不可启用，请先停用以归一化状态')

    // 40400：记录已不存在，展示后端消息
    mockedDisable.mockResolvedValueOnce(failStatus(40400, '数据源不存在: SRC001'))
    await clickRowMenuAction(wrapper, 0, '停用')
    expect(elMessageErrorSpy).toHaveBeenLastCalledWith('数据源不存在: SRC001')
    wrapper.unmount()
  })

  it('启停进行中重复触发只发一个请求（行级 busy）', async () => {
    let resolveDisable!: (v: ApiResponse<DataSourceStatusResult>) => void
    mockedDisable.mockReturnValueOnce(
      new Promise<ApiResponse<DataSourceStatusResult>>((res) => (resolveDisable = res)),
    )
    const wrapper = await mountPage()

    await clickRowMenuAction(wrapper, 0, '停用')
    await clickRowMenuAction(wrapper, 0, '停用')

    expect(mockedDisable).toHaveBeenCalledTimes(1)
    resolveDisable(okStatus())
    await flushPromises()
    wrapper.unmount()
  })

  it('启停确认未决时重复触发不再弹第二个确认；取消释放状态后可重试', async () => {
    let rejectConfirm!: (e: unknown) => void
    confirmSpy.mockReturnValueOnce(new Promise<never>((_, rej) => (rejectConfirm = rej)))
    const wrapper = await mountPage()

    await clickRowMenuAction(wrapper, 0, '停用')
    expect(confirmSpy).toHaveBeenCalledTimes(1)

    await clickRowMenuAction(wrapper, 0, '停用')
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mockedDisable).not.toHaveBeenCalled()

    rejectConfirm('cancel')
    await flushPromises()

    await clickRowMenuAction(wrapper, 0, '停用')
    expect(confirmSpy).toHaveBeenCalledTimes(2)
    expect(mockedDisable).toHaveBeenCalledWith('SRC001')
    wrapper.unmount()
  })

  it('状态更新期间删除入口不可用：只发出启停请求', async () => {
    let resolveDisable!: (v: ApiResponse<DataSourceStatusResult>) => void
    mockedDisable.mockReturnValueOnce(
      new Promise<ApiResponse<DataSourceStatusResult>>((res) => (resolveDisable = res)),
    )
    const wrapper = await mountPage()

    await clickRowMenuAction(wrapper, 0, '停用')
    expect(mockedDisable).toHaveBeenCalledTimes(1)

    // 该行删除项在 busy 期间禁用（DOM 上带 is-disabled），业务请求只有启停一次
    const deleteItem = rowMenuItems(wrapper, 0).find(
      (el) => (el.textContent ?? '').trim() === '删除',
    )
    expect(deleteItem?.className).toContain('is-disabled')
    expect(mockedDelete).not.toHaveBeenCalled()

    resolveDisable(okStatus())
    await flushPromises()
    wrapper.unmount()
  })
})

describe('列表视觉调整：序号列、主机列宽与黑色主按钮（UI §11.1~11.6）', () => {
  it('第一列为前端序号并按行序 1..n 渲染，列顺序固定', async () => {
    const wrapper = await mountPage()

    const headers = wrapper
      .findAll('.data-table .el-table__header-wrapper th')
      .map((h) => h.text().trim())
    expect(headers).toEqual([
      '序号',
      '数据源ID',
      '数据源名称',
      '角色',
      '类型',
      '主机',
      '端口',
      'Service Name/数据库名',
      '用户名',
      '操作',
    ])
    expect(wrapper.findAll('.ds-seq').map((el) => el.text())).toEqual(['1', '2'])
    wrapper.unmount()
  })

  it('新增数据源为黑色实心主按钮并保留加号图标', async () => {
    const wrapper = await mountPage()

    const addButton = wrapper.find('.ql-result-panel__toolbar .ds-add-button')
    expect(addButton.exists()).toBe(true)
    expect(addButton.text()).toContain('新增数据源')
    expect(addButton.find('.ds-add-icon').exists()).toBe(true)
    expect(addButton.find('.ds-add-icon svg').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('新增/编辑主弹窗表单与按钮视觉调整（DS-REQ-184~188）', () => {
  /** 该 SFC 的 `<style scoped>` 块正文；测试环境不注入 SFC 样式，故按源码静态校验声明。 */
  function scopedStyleBlock(): string {
    const source = readFileSync(
      resolve(process.cwd(), 'src/views/data-source/DataSourcePage.vue'),
      'utf-8',
    )
    const matched = source.match(/<style scoped>([\s\S]*?)<\/style>/)
    if (!matched) {
      throw new Error('scoped style block not found')
    }
    return matched[1]
  }

  /** 断言某条声明只出现在 `.editor-dialog` 限定范围内，不存在全局泄漏。 */
  function expectDialogScopedRule(style: string, selector: string) {
    const ruleIndex = style.indexOf(selector)
    expect(ruleIndex, `selector not found: ${selector}`).toBeGreaterThan(-1)
    // 规则起始位置必须带 `:deep(.editor-dialog`
    const ruleStart = style.lastIndexOf('}', ruleIndex) + 1
    const ruleHead = style.slice(ruleStart, ruleIndex + selector.length)
    expect(ruleHead).toContain(':deep(.editor-dialog')
  }

  it('新增弹窗标签宽度 120px 且右对齐（DS-REQ-184 / DS-AC-192）', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const form = wrapper.find('.editor-form')
    expect(form.classes()).toContain('el-form--label-right')
    expect(form.classes()).not.toContain('el-form--label-left')

    const labels = wrapper.findAll('.editor-form .el-form-item__label')
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      expect((label.element as HTMLElement).style.width).toBe('120px')
    }
    wrapper.unmount()
  })

  it('编辑弹窗沿用同一表单：标签仍右对齐 120px，测试连接条不随模式偏移（DS-AC-193）', async () => {
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)

    const form = wrapper.find('.editor-form')
    expect(form.classes()).toContain('el-form--label-right')
    const labels = wrapper.findAll('.editor-form .el-form-item__label')
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      expect((label.element as HTMLElement).style.width).toBe('120px')
    }
    // 测试连接按钮位于表单之外、输入区下方，标签对齐调整不影响其定位结构
    expect(wrapper.find('.editor-dialog .test-bar button').exists()).toBe(true)
    wrapper.unmount()
  })

  it('标签样式为 14px/500/#3f3f46、默认无衬线字体且限定在 .editor-dialog（DS-REQ-185 / DS-AC-194）', () => {
    const style = scopedStyleBlock()
    expectDialogScopedRule(style, '.el-form-item__label')

    const ruleStart = style.lastIndexOf('}', style.indexOf('.el-form-item__label')) + 1
    const rule = style.slice(ruleStart, style.indexOf('}', style.indexOf('.el-form-item__label')) + 1)
    expect(rule).toContain('font-size: 14px')
    expect(rule).toContain('font-weight: 500')
    expect(rule).toContain('color: #3f3f46')
    // 不套用列表 ID 的等宽字体，也不复制其 600 字重与 #09090b 强色
    expect(rule).not.toContain('font-family')
    expect(rule).not.toContain('monospace')
    expect(rule).not.toContain('#09090b')
  })

  it('新增模式密码星号来自专用视觉 class，不带 required 属性与 is-required 状态类（DS-REQ-186 / DS-AC-195~196）', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const createItem = editorInput(wrapper, '密码').element.closest('.el-form-item')!
    // 星号必须靠专用视觉 class 实现
    expect(createItem.className).toContain('editor-password-required-mark')
    // 不得退回 Element Plus 的 required 能力：password 绑定的是独立状态 passwordInput，
    // 而非 editorForm.password，required 会生成读取 editorForm.password 的隐式规则，
    // 导致“已填密码仍报 password is required”。
    expect(createItem.className).not.toContain('is-required')
    expect(createItem.hasAttribute('required')).toBe(false)
    // 星号是 CSS ::before，不是标签里的纯文本
    expect(createItem.querySelector('.el-form-item__label')!.textContent ?? '').not.toContain('*')
    wrapper.unmount()

    const editWrapper = await mountPage()
    await openEditRow(editWrapper, srcRow)
    const editItem = editorInput(editWrapper, '密码').element.closest('.el-form-item')!
    expect(editItem.className).not.toContain('editor-password-required-mark')
    expect(editItem.className).not.toContain('is-required')
    editWrapper.unmount()
  })

  it('专用视觉 class 的星号规则存在于 scoped 样式且不引入校验（DS-REQ-186）', () => {
    const style = scopedStyleBlock()
    const ruleIndex = style.indexOf('.editor-password-required-mark')
    expect(ruleIndex).toBeGreaterThan(-1)
    const ruleEnd = style.indexOf('}', ruleIndex)
    const rule = style.slice(ruleIndex, ruleEnd + 1)
    expect(rule).toContain('::before')
    expect(rule).toContain('content: "*"')
    expect(rule).toContain('var(--el-color-danger)')
    // 纯视觉：不触发表单项校验状态
    expect(rule).not.toContain('is-required')
  })

  it('新增模式空密码被既有校验阻断（DS-AC-195）', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    // 除密码外全部必填项填齐，使“被阻断”可归因于密码为空
    await pickSelect(wrapper, '.editor-form', 0, '源库（SOURCE）')
    await pickSelect(wrapper, '.editor-form', 1, 'ORACLE')
    await editorInput(wrapper, '数据源ID').setValue('SRC003')
    await editorInput(wrapper, '数据源名称').setValue('源库C')
    await editorInput(wrapper, '主机').setValue('10.4.4.4')
    await editorInput(wrapper, '用户名').setValue('scott')
    await editorInput(wrapper, 'Service Name').setValue('orcl3')
    await nextTick()

    await buttonByText(wrapper, '创建')!.trigger('click')
    await flushPromises()

    expect(mockedCreate).not.toHaveBeenCalled()
    expect(wrapper.find('.form-error').text()).toContain('请输入密码')
    // 阻止空密码的必须是项目既有中文校验，而不是 required 产生的框架英文默认提示
    expect(wrapper.text()).not.toContain('password is required')
    wrapper.unmount()
  })

  it('新增模式填写密码后创建：不再出现 password is required，密码按 trim 提交（DS-AC-195 回归）', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    await pickSelect(wrapper, '.editor-form', 0, '源库（SOURCE）')
    await pickSelect(wrapper, '.editor-form', 1, 'ORACLE')
    await editorInput(wrapper, '数据源ID').setValue('SRC004')
    await editorInput(wrapper, '数据源名称').setValue('源库D')
    await editorInput(wrapper, '主机').setValue('10.5.5.5')
    await editorInput(wrapper, '用户名').setValue('scott')
    await editorInput(wrapper, 'Service Name').setValue('orcl4')
    // 已填写密码，且带首尾空白用于验证 trim
    await editorInput(wrapper, '密码').setValue('  secret  ')
    await nextTick()

    await buttonByText(wrapper, '创建')!.trigger('click')
    await flushPromises()

    // 缺陷复现点：密码已填仍被 required 隐式规则拦截并显示英文提示
    expect(wrapper.text()).not.toContain('password is required')
    expect(wrapper.find('.form-error').exists()).toBe(false)
    expect(mockedCreate).toHaveBeenCalledTimes(1)
    const request = mockedCreate.mock.calls[0][0] as unknown as Record<string, unknown>
    expect(request.password).toBe('secret')
    wrapper.unmount()
  })

  it('编辑模式不显示必填标识且未修改密码可保存、请求不含 password（DS-AC-196）', async () => {
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)

    const editItem = editorInput(wrapper, '密码').element.closest('.el-form-item')!
    expect(editItem.className).not.toContain('is-required')
    expect(editorInput(wrapper, '密码').element.value).toBe('*********')

    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()

    expect(mockedUpdate).toHaveBeenCalledTimes(1)
    expect(mockedUpdate.mock.calls[0][1]).not.toHaveProperty('password')
    wrapper.unmount()
  })

  it('创建/保存按钮使用专用局部 class，取消与测试连接按钮不受影响（DS-REQ-187~188 / DS-AC-197~199）', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const createButton = exactButton(wrapper, '创建')!
    expect(createButton.classes()).toContain('editor-submit-button')
    expect(exactButton(wrapper, '取消')!.classes()).not.toContain('editor-submit-button')
    expect(exactButton(wrapper, '测试连接')!.classes()).not.toContain('editor-submit-button')
    wrapper.unmount()

    const editWrapper = await mountPage()
    await openEditRow(editWrapper, srcRow)
    const saveButton = exactButton(editWrapper, '保存')!
    expect(saveButton.classes()).toContain('editor-submit-button')
    editWrapper.unmount()
  })

  it('提交按钮四态黑色视觉限定在 .editor-dialog 且仅覆盖非禁用态（DS-REQ-187~188）', () => {
    const style = scopedStyleBlock()
    expectDialogScopedRule(style, '.editor-submit-button:not(.is-disabled)')

    expect(style).toContain('background: #09090b')
    expect(style).toContain('background: #27272a')
    expect(style).toContain('background: #18181b')
    expect(style).toContain('color: #ffffff')
    expect(style).toContain('border-radius: 6px')
    expect(style).toContain('font-weight: 500')
    // 禁用态不换色，沿用 Element Plus 既有禁用视觉
    expect(style).toContain(':not(.is-disabled)')
    expect(style).not.toContain('.editor-submit-button.is-disabled {')
  })

  it('业务属性弹窗提交按钮不复用主弹窗专用 class（无样式泄漏，DS-AC-199）', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 1, '业务属性')

    const bizButtons = wrapper.findAll('.biz-attr-dialog button')
    expect(bizButtons.length).toBeGreaterThan(0)
    for (const button of bizButtons) {
      expect(button.classes()).not.toContain('editor-submit-button')
    }
    wrapper.unmount()
  })
})

describe('新增数据源', () => {
  it('填写目标库表单提交创建请求（password 必填、trim、类型联动文案）', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    // 角色→目标库，类型→MYSQL（类型文案变为“数据库名”）
    await pickSelect(wrapper, '.editor-form', 0, '目标库（TARGET）')
    await pickSelect(wrapper, '.editor-form', 1, 'MYSQL')

    await editorInput(wrapper, '数据源ID').setValue('TG002')
    await editorInput(wrapper, '数据源名称').setValue(' 新目标库 ')
    await editorInput(wrapper, '主机').setValue('10.2.2.2')
    await editorInput(wrapper, '用户名').setValue('app')
    await editorInput(wrapper, '密码').setValue('secret')
    await editorInput(wrapper, '数据库名').setValue('newdb')
    await nextTick()

    await buttonByText(wrapper, '创建')!.trigger('click')
    await flushPromises()

    expect(mockedCreate).toHaveBeenCalledTimes(1)
    expect(mockedCreate.mock.calls[0][0]).toEqual({
      dataSourceId: 'TG002',
      dataSourceName: '新目标库',
      dataSourceCategory: 'TARGET',
      dataSourceType: 'MYSQL',
      host: '10.2.2.2',
      port: 1521,
      userName: 'app',
      password: 'secret',
      serviceName: 'newdb',
    })
    // 创建成功关闭弹窗并刷新列表
    expect(elMessageSuccessSpy).toHaveBeenCalledWith('新增成功')
    expect(mockedList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('源库仅 ORACLE：切回源库后非法 MYSQL 类型被清空（创建被类型校验阻断）', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    await pickSelect(wrapper, '.editor-form', 0, '目标库（TARGET）')
    await pickSelect(wrapper, '.editor-form', 1, 'MYSQL')
    // 切回源库 → MYSQL 非法被清空，创建校验必须失败
    await pickSelect(wrapper, '.editor-form', 0, '源库（SOURCE）')
    await nextTick()

    await editorInput(wrapper, '数据源ID').setValue('SRC002')
    await editorInput(wrapper, '数据源名称').setValue('源库B')
    await editorInput(wrapper, '主机').setValue('10.3.3.3')
    await editorInput(wrapper, '用户名').setValue('scott')
    await editorInput(wrapper, '密码').setValue('pass')
    await editorInput(wrapper, '数据库名').setValue('orcl2')
    await nextTick()

    await buttonByText(wrapper, '创建')!.trigger('click')
    await flushPromises()

    expect(mockedCreate).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('请选择类型')
    wrapper.unmount()
  })

  it('缺少必填字段阻止创建', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    await buttonByText(wrapper, '创建')!.trigger('click')
    await flushPromises()

    expect(mockedCreate).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('编辑数据源', () => {
  it('打开编辑通过详情接口加载并显示密码掩码；未改密码保存请求不含 password，路径用原 ID', async () => {
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)

    expect(mockedDetail).toHaveBeenCalledWith('SRC001')
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('源库A')
    expect(editorInput(wrapper, '密码').element.value).toBe('*********')

    await editorInput(wrapper, '数据源名称').setValue('源库A改')
    await nextTick()
    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()

    expect(mockedUpdate).toHaveBeenCalledTimes(1)
    expect(mockedUpdate.mock.calls[0][0]).toBe('SRC001')
    const request = mockedUpdate.mock.calls[0][1] as unknown as Record<string, unknown>
    expect(request.dataSourceName).toBe('源库A改')
    expect(request).not.toHaveProperty('password')
    wrapper.unmount()
  })

  it('编辑修改密码：请求携带 trim 后新密码，数据源ID 可修改但路径仍用原 ID', async () => {
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)

    await editorInput(wrapper, '数据源ID').setValue('SRC999')
    await editorInput(wrapper, '密码').setValue(' newpass ')
    await nextTick()
    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()

    expect(mockedUpdate.mock.calls[0][0]).toBe('SRC001')
    const request = mockedUpdate.mock.calls[0][1] as unknown as Record<string, unknown>
    expect(request.dataSourceId).toBe('SRC999')
    expect(request.password).toBe('newpass')
    wrapper.unmount()
  })

  it('编辑模式主动修改密码后清空：仍提示 请输入新密码，且不提交（DS-AC-196）', async () => {
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)
    const passwordField = editorInput(wrapper, '密码')

    // 主动改动密码 → 触发“已修改”语义，再清空
    await passwordField.setValue('temp')
    await passwordField.setValue('')
    await nextTick()
    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()

    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('请输入新密码')
    // 空密码在校验阶段被阻断，不会以空串或掩码提交
    expect(wrapper.text()).not.toContain('password is required')
    wrapper.unmount()
  })

  it('双击行打开编辑弹窗并通过详情接口加载', async () => {
    const wrapper = await mountPage()
    wrapper.findComponent({ name: 'ElTable' }).vm.$emit('row-dblclick', srcRow)
    await flushPromises()

    expect(mockedDetail).toHaveBeenCalledWith('SRC001')
    expect(wrapper.find('.editor-form').exists()).toBe(true)
    expect(editorInput(wrapper, '密码').element.value).toBe('*********')
    wrapper.unmount()
  })

  it('详情业务失败可见且不静默使用列表数据', async () => {
    mockedDetail.mockResolvedValueOnce({
      code: 40400,
      message: '数据源不存在: SRC001',
      timestamp: '',
      data: null,
    } as unknown as ApiResponse<DataSourceDetail>)
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)

    expect(wrapper.find('.form-error').text()).toContain('数据源不存在')
    // 列表行数据未被当作权威详情：名称仍为空
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('')
    wrapper.unmount()
  })

  it('详情网络异常显示错误', async () => {
    mockedDetail.mockRejectedValueOnce(new Error('network down'))
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)

    expect(wrapper.find('.form-error').text()).toContain('network down')
    wrapper.unmount()
  })

  it('快速切换记录时迟到的详情响应被代次隔离', async () => {
    let resolveFirst!: (v: ApiResponse<DataSourceDetail>) => void
    mockedDetail
      .mockImplementationOnce(
        () => new Promise<ApiResponse<DataSourceDetail>>((res) => (resolveFirst = res)),
      )
      .mockResolvedValueOnce(okRow(tgtRow))
    const wrapper = await mountPage()

    wrapper.findComponent({ name: 'ElTable' }).vm.$emit('row-dblclick', srcRow)
    await nextTick()
    wrapper.findComponent({ name: 'ElTable' }).vm.$emit('row-dblclick', tgtRow)
    await flushPromises()

    // TG001 详情先返回，表单显示目标库；SRC001 迟到详情被忽略
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('目标库B')
    resolveFirst(okRow(srcRow))
    await flushPromises()
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('目标库B')

    // 保存路径使用后一次编辑的 originalDataSourceId
    await editorInput(wrapper, '数据源名称').setValue('目标库B改')
    await nextTick()
    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()
    expect(mockedUpdate.mock.calls[0][0]).toBe('TG001')
    wrapper.unmount()
  })

  it('编辑详情未决→关闭→新增：迟到的编辑详情不覆盖新增表单', async () => {
    let resolveDetail!: (v: ApiResponse<DataSourceDetail>) => void
    mockedDetail.mockImplementationOnce(
      () => new Promise<ApiResponse<DataSourceDetail>>((res) => (resolveDetail = res)),
    )
    const wrapper = await mountPage()

    // 编辑 A：详情请求未决
    await openEditRow(wrapper, srcRow)

    // 关闭编辑弹窗（详情未加载完成，快照为空，无需确认）
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    // 打开新增并填写内容
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()
    await editorInput(wrapper, '数据源ID').setValue('TG002')
    await editorInput(wrapper, '数据源名称').setValue('新库X')
    await editorInput(wrapper, '主机').setValue('10.9.9.9')
    await nextTick()

    // A 的详情迟到返回：必须被忽略，不得覆盖新增表单与快照
    resolveDetail(okRow(srcRow))
    await flushPromises()
    expect(editorInput(wrapper, '数据源ID').element.value).toBe('TG002')
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('新库X')
    expect(editorInput(wrapper, '主机').element.value).toBe('10.9.9.9')
    // 新增模式密码为空而非编辑掩码
    expect(editorInput(wrapper, '密码').element.value).toBe('')
    wrapper.unmount()
  })

  it('编辑 A 详情未决→关闭→编辑 B：A 迟到成功不覆盖 B 详情与 originalDataSourceId', async () => {
    let resolveDetailA!: (v: ApiResponse<DataSourceDetail>) => void
    mockedDetail
      .mockImplementationOnce(
        () => new Promise<ApiResponse<DataSourceDetail>>((res) => (resolveDetailA = res)),
      )
      .mockResolvedValueOnce(okRow(tgtRow))
    const wrapper = await mountPage()

    // 编辑 A：详情未决
    await openEditRow(wrapper, srcRow)

    // 关闭 A（快照为空，无需确认）
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    // 打开编辑 B：详情返回目标库
    wrapper.findComponent({ name: 'ElTable' }).vm.$emit('row-dblclick', tgtRow)
    await flushPromises()
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('目标库B')

    // A 迟到成功响应被忽略，B 详情保持不变
    resolveDetailA(okRow(srcRow))
    await flushPromises()
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('目标库B')

    // 保存路径使用 B 的 originalDataSourceId
    await editorInput(wrapper, '数据源名称').setValue('目标库B改')
    await nextTick()
    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()
    expect(mockedUpdate.mock.calls[0][0]).toBe('TG001')
    wrapper.unmount()
  })

  it('编辑 A 详情未决→关闭→编辑 B：A 迟到失败不覆盖 B 详情与错误', async () => {
    let rejectDetailA!: (e: Error) => void
    mockedDetail
      .mockImplementationOnce(
        () =>
          new Promise<ApiResponse<DataSourceDetail>>((_, rej) => (rejectDetailA = rej)),
      )
      .mockResolvedValueOnce(okRow(tgtRow))
    const wrapper = await mountPage()

    await openEditRow(wrapper, srcRow)
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    wrapper.findComponent({ name: 'ElTable' }).vm.$emit('row-dblclick', tgtRow)
    await flushPromises()
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('目标库B')
    expect(wrapper.find('.form-error').exists()).toBe(false)

    // A 迟到失败被忽略，B 的错误区仍为空、详情不变
    rejectDetailA(new Error('A 的网络失败'))
    await flushPromises()
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('目标库B')
    expect(wrapper.find('.form-error').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('测试连接', () => {
  it('发起请求立即显示测试中并逐秒倒计时；提前响应停止计时并显示结果', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    let resolve!: (v: ApiResponse<TestConnectionResult>) => void
    mockedTest.mockReturnValueOnce(
      new Promise<ApiResponse<TestConnectionResult>>((res) => (resolve = res)),
    )

    vi.useFakeTimers()
    await buttonByText(wrapper, '测试连接')!.trigger('click')
    await flushFake()

    expect(wrapper.text()).toContain('测试连接中，剩余 10 秒')
    expect(wrapper.find('.test-bar button').attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toContain('测试连接中，剩余 9 秒')
    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.text()).toContain('测试连接中，剩余 7 秒')

    // 后端提前返回 → 停止倒计时、显示结果、无重试冷却
    resolve(okTest(true, '连接成功'))
    await flushFake()
    expect(wrapper.text()).toContain('连接成功')
    expect(wrapper.text()).not.toContain('测试连接中')
    expect(wrapper.text()).not.toContain('重试（')
    wrapper.unmount()
  })

  it('倒计时逐秒 10→0：展示 9、1、0 秒与超时，按钮恢复，迟到成功被忽略', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    let resolve!: (v: ApiResponse<TestConnectionResult>) => void
    mockedTest.mockReturnValueOnce(
      new Promise<ApiResponse<TestConnectionResult>>((res) => (resolve = res)),
    )

    vi.useFakeTimers()
    await buttonByText(wrapper, '测试连接')!.trigger('click')
    await flushFake()
    expect(wrapper.text()).toContain('测试连接中，剩余 10 秒')

    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toContain('测试连接中，剩余 9 秒')

    await vi.advanceTimersByTimeAsync(8000)
    expect(wrapper.text()).toContain('测试连接中，剩余 1 秒')

    // 到 0：结果文案稳定展示“剩余 0 秒 / 连接超时”，不延长总期限
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toContain('剩余 0 秒 / 连接超时')
    expect(wrapper.text()).toContain('连接超时')
    expect(wrapper.text()).not.toContain('测试连接中')

    // 到 0 后测试按钮恢复可用
    expect(wrapper.find('.test-bar button').attributes('disabled')).toBeUndefined()

    // 迟到响应不得覆盖超时结果
    resolve(okTest(true, '连接成功'))
    await flushFake()
    expect(wrapper.text()).toContain('连接超时')
    expect(wrapper.text()).not.toContain('连接成功')
    wrapper.unmount()
  })

  it('测试中重复点击不会重复发请求', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    let resolve!: (v: ApiResponse<TestConnectionResult>) => void
    mockedTest.mockReturnValueOnce(
      new Promise<ApiResponse<TestConnectionResult>>((res) => (resolve = res)),
    )

    await buttonByText(wrapper, '测试连接')!.trigger('click')
    await flushPromises()
    await buttonByText(wrapper, '测试连接')!.trigger('click')
    await flushPromises()

    expect(mockedTest).toHaveBeenCalledTimes(1)
    resolve(okTest(true, '连接成功'))
    await flushPromises()
    wrapper.unmount()
  })

  it('失败直接展示后端完整脱敏消息，恰好一次且无重复前缀', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()
    // API 基线示例的真实失败消息
    mockedTest.mockResolvedValue(okTest(false, '连接失败：认证失败'))

    await buttonByText(wrapper, '测试连接')!.trigger('click')
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('连接失败：认证失败')
    // 恰好显示一次该完整消息
    expect(text.split('连接失败：认证失败').length - 1).toBe(1)
    // 不重复拼接前缀
    expect(text).not.toContain('连接失败：连接失败：认证失败')
    expect(text).not.toContain('重试（')
    wrapper.unmount()
  })

  it('请求期间修改字段使旧请求失效并清理计时器', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    let resolve!: (v: ApiResponse<TestConnectionResult>) => void
    mockedTest.mockReturnValueOnce(
      new Promise<ApiResponse<TestConnectionResult>>((res) => (resolve = res)),
    )

    vi.useFakeTimers()
    await buttonByText(wrapper, '测试连接')!.trigger('click')
    await flushFake()
    expect(wrapper.text()).toContain('测试连接中，剩余 10 秒')

    await editorInput(wrapper, '主机').setValue('10.9.9.9')
    await nextTick()
    expect(wrapper.text()).not.toContain('测试连接中')
    expect(wrapper.find('.test-bar button').attributes('disabled')).toBeUndefined()

    resolve(okTest(true, '连接成功'))
    await flushFake()
    expect(wrapper.text()).not.toContain('连接成功')
    wrapper.unmount()
  })
})

describe('删除数据源', () => {
  it('确认后调用删除并刷新列表', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '删除')

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mockedDelete).toHaveBeenCalledWith('SRC001')
    expect(elMessageSuccessSpy).toHaveBeenCalledWith('删除成功')
    expect(mockedList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('取消删除不调用接口', async () => {
    confirmSpy.mockRejectedValueOnce('cancel')
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '删除')

    expect(mockedDelete).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('删除进行中重复点击只发一个请求', async () => {
    let resolve!: (v: ApiResponse<null>) => void
    mockedDelete.mockReturnValueOnce(new Promise<ApiResponse<null>>((res) => (resolve = res)))
    const wrapper = await mountPage()

    await clickRowMenuAction(wrapper, 0, '删除')
    await clickRowMenuAction(wrapper, 0, '删除')

    expect(mockedDelete).toHaveBeenCalledTimes(1)
    resolve(okNull())
    await flushPromises()
    wrapper.unmount()
  })

  it('删除确认未决时重复触发不再弹第二个确认；取消释放状态后可重试', async () => {
    let rejectConfirm!: (e: unknown) => void
    confirmSpy.mockReturnValueOnce(
      new Promise<never>((_, rej) => (rejectConfirm = rej)),
    )
    const wrapper = await mountPage()

    await clickRowMenuAction(wrapper, 0, '删除')
    expect(confirmSpy).toHaveBeenCalledTimes(1)

    // 确认未决：再次触发不再弹第二个确认，也不发请求
    await clickRowMenuAction(wrapper, 0, '删除')
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mockedDelete).not.toHaveBeenCalled()

    // 取消确认 → 释放状态，允许重新尝试
    rejectConfirm('cancel')
    await flushPromises()
    expect(mockedDelete).not.toHaveBeenCalled()

    await clickRowMenuAction(wrapper, 0, '删除')
    expect(confirmSpy).toHaveBeenCalledTimes(2)
    expect(mockedDelete).toHaveBeenCalledWith('SRC001')
    wrapper.unmount()
  })
})

describe('编辑弹窗未保存确认', () => {
  it('主编辑弹窗脏数据关闭需确认', async () => {
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)

    await editorInput(wrapper, '数据源名称').setValue('源库A改')
    await nextTick()
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('拒绝确认保持弹窗与表单', async () => {
    confirmSpy.mockRejectedValueOnce('cancel')
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)

    await editorInput(wrapper, '数据源名称').setValue('源库A改')
    await nextTick()
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.editor-form').exists()).toBe(true)
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('源库A改')
    wrapper.unmount()
  })

  it('无修改直接关闭不弹确认', async () => {
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)

    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    expect(confirmSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('保存成功直接关闭，不弹二次确认', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    await editorInput(wrapper, '数据源ID').setValue('TG002')
    await editorInput(wrapper, '数据源名称').setValue('新库')
    await editorInput(wrapper, '主机').setValue('10.2.2.2')
    await editorInput(wrapper, '用户名').setValue('app')
    await editorInput(wrapper, '密码').setValue('secret')
    await editorInput(wrapper, 'Service Name').setValue('db')
    await nextTick()
    await buttonByText(wrapper, '创建')!.trigger('click')
    await flushPromises()

    expect(mockedCreate).toHaveBeenCalledTimes(1)
    expect(confirmSpy).not.toHaveBeenCalled()
    // 弹窗已关闭：内容可能残留于 DOM（等待 leave 过渡），但整体不可见
    expect(wrapper.find('.editor-form').isVisible()).toBe(false)
    wrapper.unmount()
  })

  it('密码聚焦失焦不误标已修改，星号恢复', async () => {
    const wrapper = await mountPage()
    await openEditRow(wrapper, srcRow)

    const pwd = editorInput(wrapper, '密码')
    expect(pwd.element.value).toBe('*********')
    await pwd.trigger('focus')
    expect(editorInput(wrapper, '密码').element.value).toBe('')
    await pwd.trigger('blur')
    expect(editorInput(wrapper, '密码').element.value).toBe('*********')

    // 未修改密码：直接关闭不弹确认
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()
    expect(confirmSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('业务属性（仅目标库）', () => {
  it('打开显示原内容，保存时原样提交（不 trim 不校验）', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 1, '业务属性')

    const textarea = wrapper.find('.biz-attr-body textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('{"a": 1}')

    await textarea.setValue('  {"b": 2}  ')
    await nextTick()
    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()

    expect(mockedSaveBizAttr).toHaveBeenCalledTimes(1)
    expect(mockedSaveBizAttr.mock.calls[0]).toEqual(['TG001', { bizAttr: '  {"b": 2}  ' }])
    expect(elMessageSuccessSpy).toHaveBeenCalledWith('保存成功')
    wrapper.unmount()
  })

  it('有未保存修改时关闭需二次确认', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 1, '业务属性')

    await wrapper.find('.biz-attr-body textarea').setValue('changed')
    await nextTick()
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('无修改时直接关闭不弹确认', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 1, '业务属性')

    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    expect(confirmSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('目标库命名策略（仅源库）', () => {
  it('打开显示策略列表与目标候选；标题含源库ID与名称；表格列含数据库类型', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    expect(mockedNaming).toHaveBeenCalledWith('SRC001')
    const title = wrapper
      .findAll('.el-dialog__title')
      .map((t) => t.text())
      .join('')
    expect(title).toContain('SRC001')
    expect(title).toContain('源库A')

    const headers = wrapper
      .findAll('.naming-table .el-table__header-wrapper th')
      .map((h) => h.text().trim())
    expect(headers).toEqual(['目标库ID', '目标库名称', '数据库类型', '命名策略', '前缀', '后缀', '操作'])

    const bodyText = wrapper.find('.naming-table .el-table__body-wrapper').text()
    expect(bodyText).toContain('MYSQL')
    expect(mockedTargetOptions).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('TABLE_MERGE 提交清空前缀后缀；CUSTOM 必填前后缀', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    // 默认 TABLE_MERGE：选择目标库后直接新增
    await pickSelect(wrapper, '.naming-form', 0, 'TG002（目标库C）')
    await exactButton(wrapper, '新增')!.trigger('click')
    await flushPromises()

    expect(mockedCreateNaming).toHaveBeenCalledTimes(1)
    expect(mockedCreateNaming.mock.calls[0][0]).toBe('SRC001')
    expect(mockedCreateNaming.mock.calls[0][1]).toEqual({
      targetDataSourceId: 'TG002',
      tableNamingStrategy: 'TABLE_MERGE',
      tableNamePrefix: '',
      tableNameSuffix: '',
    })

    // 切换到 CUSTOM：前缀后缀必填，空提交被阻止
    // 新增成功后表单已重置，需重新选择目标库
    await clickStrategyCard(wrapper, '自定义前后缀')
    await pickSelect(wrapper, '.naming-form', 0, 'TG002（目标库C）')
    await exactButton(wrapper, '新增')!.trigger('click')
    await flushPromises()
    expect(mockedCreateNaming).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('请输入表名前缀')

    // 填写前后缀后提交
    await namingInput(wrapper, '表名前缀').setValue(' pre_ ')
    await namingInput(wrapper, '表名后缀').setValue('_suf ')
    await nextTick()
    await exactButton(wrapper, '新增')!.trigger('click')
    await flushPromises()
    expect(mockedCreateNaming).toHaveBeenCalledTimes(2)
    expect(mockedCreateNaming.mock.calls[1][1]).toEqual({
      targetDataSourceId: 'TG002',
      tableNamingStrategy: 'CUSTOM_PREFIX_SUFFIX',
      tableNamePrefix: 'pre_',
      tableNameSuffix: '_suf',
    })
    wrapper.unmount()
  })

  it('切回 TABLE_MERGE 自动清空前缀后缀', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    await clickStrategyCard(wrapper, '自定义前后缀')
    await namingInput(wrapper, '表名前缀').setValue('pre')
    await namingInput(wrapper, '表名后缀').setValue('suf')
    await nextTick()

    await clickStrategyCard(wrapper, '表合并')
    await nextTick()

    expect(namingInput(wrapper, '表名前缀').element.value).toBe('')
    expect(namingInput(wrapper, '表名后缀').element.value).toBe('')
    wrapper.unmount()
  })

  it('编辑用原目标库 ID 定位路径，请求体可携带新目标库', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    const editBtn = wrapper
      .findAll('.naming-table button')
      .find((b) => b.text().includes('编辑'))!
    await editBtn.trigger('click')
    await nextTick()

    await pickSelect(wrapper, '.naming-form', 0, 'TG002（目标库C）')
    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()

    expect(mockedUpdateNaming).toHaveBeenCalledTimes(1)
    expect(mockedUpdateNaming.mock.calls[0][0]).toBe('SRC001')
    expect(mockedUpdateNaming.mock.calls[0][1]).toBe('TG001')
    expect(mockedUpdateNaming.mock.calls[0][2]).toMatchObject({ targetDataSourceId: 'TG002' })
    // 成功后刷新策略列表
    expect(mockedNaming).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('删除命名策略确认后按 targetId 路径调用并刷新', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    const delBtn = wrapper
      .findAll('.naming-table button')
      .find((b) => b.text().includes('删除'))!
    await delBtn.trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mockedDeleteNaming).toHaveBeenCalledWith('SRC001', 'TG001')
    expect(elMessageSuccessSpy).toHaveBeenCalledWith('删除成功')
    expect(mockedNaming).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('命名策略删除进行中重复点击只发一个请求', async () => {
    let resolve!: (v: ApiResponse<null>) => void
    mockedDeleteNaming.mockReturnValueOnce(new Promise<ApiResponse<null>>((res) => (resolve = res)))
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    const delBtn = wrapper
      .findAll('.naming-table button')
      .find((b) => b.text().includes('删除'))!
    await delBtn.trigger('click')
    await flushPromises()
    await delBtn.trigger('click')
    await flushPromises()

    expect(mockedDeleteNaming).toHaveBeenCalledTimes(1)
    resolve(okNull())
    await flushPromises()
    wrapper.unmount()
  })

  it('命名策略删除确认未决时重复触发不再弹第二个确认；取消释放状态可重试', async () => {
    let rejectConfirm!: (e: unknown) => void
    confirmSpy.mockReturnValueOnce(
      new Promise<never>((_, rej) => (rejectConfirm = rej)),
    )
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    const delBtn = wrapper
      .findAll('.naming-table button')
      .find((b) => b.text().includes('删除'))!
    await delBtn.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalledTimes(1)

    // 确认未决：重复触发不再弹第二个确认，也不发请求
    await delBtn.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mockedDeleteNaming).not.toHaveBeenCalled()

    // 取消确认 → 释放状态，允许重新尝试
    rejectConfirm('cancel')
    await flushPromises()
    await delBtn.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalledTimes(2)
    expect(mockedDeleteNaming).toHaveBeenCalledWith('SRC001', 'TG001')
    wrapper.unmount()
  })

  it('命名策略保存期间冻结表单控件；保存失败后恢复编辑', async () => {
    let rejectCreate!: (e: Error) => void
    mockedCreateNaming.mockReturnValueOnce(
      new Promise<ApiResponse<null>>((_, rej) => (rejectCreate = rej)),
    )
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    // CUSTOM 策略下前后缀在非保存期可编辑
    await clickStrategyCard(wrapper, '自定义前后缀')
    await namingInput(wrapper, '表名前缀').setValue('pre')
    await namingInput(wrapper, '表名后缀').setValue('suf')
    await nextTick()
    await pickSelect(wrapper, '.naming-form', 0, 'TG002（目标库C）')
    await exactButton(wrapper, '新增')!.trigger('click')
    await flushPromises()

    // 保存中：目标库选择、策略卡片、前缀/后缀输入全部禁用
    expect(wrapper.find('.naming-form .el-select__wrapper').classes()).toContain('is-disabled')
    const cards = wrapper.findAll('.naming-form .strategy-card')
    expect(cards.length).toBe(2)
    for (const c of cards) {
      expect(c.attributes('aria-disabled')).toBe('true')
      expect(c.classes()).toContain('is-disabled')
    }
    // 保存中点击卡片不改变策略（保持当前已选的自定义前后缀）
    await clickStrategyCard(wrapper, '表合并')
    expect(wrapper.find('.naming-form .strategy-card.is-selected').text()).toContain('自定义前后缀')
    expect(namingInput(wrapper, '表名前缀').element.disabled).toBe(true)
    expect(namingInput(wrapper, '表名后缀').element.disabled).toBe(true)

    // 保存失败 → 恢复编辑，表单保留 CUSTOM 值
    rejectCreate(new Error('network down'))
    await flushPromises()
    expect(wrapper.find('.naming-form .el-select__wrapper').classes()).not.toContain('is-disabled')
    expect(namingInput(wrapper, '表名前缀').element.disabled).toBe(false)
    expect(namingInput(wrapper, '表名后缀').element.disabled).toBe(false)
    wrapper.unmount()
  })

  it('命名策略保存期间删除不发出冲突请求', async () => {
    let resolveCreate!: (v: ApiResponse<null>) => void
    mockedCreateNaming.mockReturnValueOnce(
      new Promise<ApiResponse<null>>((res) => (resolveCreate = res)),
    )
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    await pickSelect(wrapper, '.naming-form', 0, 'TG002（目标库C）')
    await exactButton(wrapper, '新增')!.trigger('click')
    await flushPromises()

    // 保存中，删除被阻断
    const delBtn = wrapper
      .findAll('.naming-table button')
      .find((b) => b.text().includes('删除'))!
    await delBtn.trigger('click')
    await flushPromises()
    expect(mockedDeleteNaming).not.toHaveBeenCalled()

    resolveCreate(okNull())
    await flushPromises()
    wrapper.unmount()
  })

  it('命名策略脏数据关闭需确认；拒绝保持弹窗', async () => {
    confirmSpy.mockRejectedValueOnce('cancel')
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    await pickSelect(wrapper, '.naming-form', 0, 'TG002（目标库C）')
    await nextTick()
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.naming-form').exists()).toBe(true)
    wrapper.unmount()
  })

  it('命名策略脏数据关闭确认后关闭', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    await pickSelect(wrapper, '.naming-form', 0, 'TG002（目标库C）')
    await nextTick()
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    // 弹窗已关闭：内容可能残留于 DOM（等待 leave 过渡），但整体不可见
    expect(wrapper.find('.naming-form').isVisible()).toBe(false)
    wrapper.unmount()
  })

  it('编辑切换时脏数据需确认，拒绝后保持当前表单', async () => {
    confirmSpy.mockRejectedValueOnce('cancel')
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    const editBtn = wrapper
      .findAll('.naming-table button')
      .find((b) => b.text().includes('编辑'))!
    await editBtn.trigger('click')
    await nextTick()
    await clickStrategyCard(wrapper, '自定义前后缀')
    await namingInput(wrapper, '表名前缀').setValue('p_')
    await nextTick()

    // 再次点击编辑（切换策略）时脏数据需确认
    await editBtn.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(namingInput(wrapper, '表名前缀').element.value).toBe('p_')
    wrapper.unmount()
  })
})

describe('列表空状态（DS-REQ-110/111）', () => {
  it('有生效查询条件且零结果显示两级文案，无额外重置按钮或链接', async () => {
    mockedList.mockResolvedValue(okList([]))
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', 'NOPE')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()

    const empty = wrapper.find('.empty-state')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain('未找到符合当前查询条件的数据源')
    // 空结果提示必须准确表达“重置后还要再点查询”，不得暗示重置会自动查询（R1 §3.4）
    expect(empty.text()).toContain('请调整查询条件后重试，或点击上方“重置”后再点击“查询”查看全部数据源')
    expect(empty.text()).not.toContain('点击上方“重置”查看全部数据源')
    expect(empty.text()).not.toContain('暂无数据源')
    expect(empty.find('button').exists()).toBe(false)
    expect(empty.find('a').exists()).toBe(false)
    wrapper.unmount()
  })

  it('查询后只编辑表单不查询，空状态仍依据最后生效条件', async () => {
    mockedList.mockResolvedValue(okList([]))
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', 'NOPE')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('未找到符合当前查询条件的数据源')

    // 打开新增弹窗修改表单再关闭，不触发查询：生效条件与空状态不变
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()
    await editorInput(wrapper, '数据源名称').setValue('改')
    await nextTick()
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.empty-state').text()).toContain('未找到符合当前查询条件的数据源')
    wrapper.unmount()
  })

  it('无生效查询条件且零结果显示系统空状态与新增引导', async () => {
    mockedList.mockResolvedValue(okList([]))
    const wrapper = await mountPage()

    const empty = wrapper.find('.empty-state')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain('暂无数据源')
    expect(empty.text()).toContain('点击右上角“新增数据源”创建第一条数据源')
    expect(empty.find('button').exists()).toBe(false)
    expect(empty.find('a').exists()).toBe(false)
    wrapper.unmount()
  })

  it('重置只清空控件，不改表格/总数/已应用条件且零请求；再查询才回退系统空状态', async () => {
    mockedList.mockResolvedValue(okList([]))
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', 'NOPE')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'NOPE' })
    expect(wrapper.find('.empty-state').text()).toContain('未找到符合当前查询条件的数据源')

    // 重置：控件清空，但已应用条件与空状态不变，重置自身发起 0 个请求（DS-REQ-139/141）
    const callsBeforeReset = mockedList.mock.calls.length
    await buttonByText(wrapper, '重置')!.trigger('click')
    await flushPromises()
    expect(mockedList.mock.calls.length).toBe(callsBeforeReset)
    expect(queryInputValue(wrapper, '数据源ID')).toBe('')
    expect(wrapper.find('.empty-state').text()).toContain('未找到符合当前查询条件的数据源')

    // 随后点击“查询”才按缺省条件查询全部并回退系统空状态（DS-REQ-140）
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({})
    expect(wrapper.find('.empty-state').text()).toContain('暂无数据源')
    expect(wrapper.find('.empty-state').text()).not.toContain('未找到符合当前查询条件')
    wrapper.unmount()
  })

  it('加载中与加载失败时不误显示普通空状态', async () => {
    let resolve!: (v: ApiResponse<DataSourceListRow[]>) => void
    mockedList.mockImplementationOnce(
      () => new Promise<ApiResponse<DataSourceListRow[]>>((res) => (resolve = res)),
    )
    const wrapper = await mountPage()

    // 初始加载挂起：不得显示普通空状态
    expect(wrapper.find('.empty-state').exists()).toBe(false)

    resolve(okList([]))
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('暂无数据源')

    // 加载失败：展示错误，不得显示普通空状态
    mockedList.mockRejectedValueOnce(new Error('network down'))
    await setQueryInput(wrapper, '数据源ID', 'NOPE')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.load-error').exists()).toBe(true)
    expect(wrapper.find('.empty-state').exists()).toBe(false)
    wrapper.unmount()
  })

  it('并发查询只有最终生效请求更新列表与空状态，旧响应不得覆盖', async () => {
    let resolveStale!: (v: ApiResponse<DataSourceListRow[]>) => void
    mockedList
      .mockResolvedValueOnce(okList([srcRow, tgtRow])) // mount 初始加载
      .mockImplementationOnce(
        () => new Promise<ApiResponse<DataSourceListRow[]>>((res) => (resolveStale = res)),
      ) // 查询 NOPE 挂起
      .mockResolvedValueOnce(okList([])) // 撤空条件再查询立即返回空
    const wrapper = await mountPage()

    // 第一次查询（NOPE）挂起
    await setQueryInput(wrapper, '数据源ID', 'NOPE')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()

    // 清空控件后再次查询（无条件）立即返回空 → 系统空状态
    await setQueryInput(wrapper, '数据源ID', '')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('暂无数据源')

    // 第一次查询迟到返回：代次失效，不得覆盖生效条件与空状态
    resolveStale(okList([srcRow, tgtRow]))
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('暂无数据源')
    expect(wrapper.find('.empty-state').text()).not.toContain('未找到符合当前查询条件')
    wrapper.unmount()
  })
})

describe('生效查询快照与自动刷新（R1）', () => {
  it('新增成功自动刷新用生效快照而非未点击的草稿：初始无条件、草稿 NOPE、空状态系统空', async () => {
    mockedList.mockResolvedValue(okList([]))
    const wrapper = await mountPage()

    // 用户在查询框输入 NOPE，但不点击“查询”
    await setQueryInput(wrapper, '数据源ID', 'NOPE')

    // 新增一条目标库成功
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()
    await pickSelect(wrapper, '.editor-form', 0, '目标库（TARGET）')
    await pickSelect(wrapper, '.editor-form', 1, 'MYSQL')
    await editorInput(wrapper, '数据源ID').setValue('TG002')
    await editorInput(wrapper, '数据源名称').setValue('新目标库')
    await editorInput(wrapper, '主机').setValue('10.2.2.2')
    await editorInput(wrapper, '用户名').setValue('app')
    await editorInput(wrapper, '密码').setValue('secret')
    await editorInput(wrapper, '数据库名').setValue('newdb')
    await nextTick()
    await buttonByText(wrapper, '创建')!.trigger('click')
    await flushPromises()

    expect(mockedCreate).toHaveBeenCalledTimes(1)
    // 自动刷新仍为无条件快照，而非草稿 NOPE
    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(mockedList).toHaveBeenLastCalledWith({})
    // 空状态为系统空状态，而非查询零结果状态
    expect(wrapper.find('.empty-state').text()).toContain('暂无数据源')
    expect(wrapper.find('.empty-state').text()).not.toContain('未找到符合当前查询条件')
    wrapper.unmount()
  })

  it('编辑成功自动刷新用已生效快照 A，而非改后的草稿 B', async () => {
    const wrapper = await mountPage()

    // 生效条件 A = 数据源ID=SRC
    await setQueryInput(wrapper, '数据源ID', 'SRC')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'SRC' })

    // 只把查询框改为 B = NOPE，不点击查询
    await setQueryInput(wrapper, '数据源ID', 'NOPE')

    // 编辑成功后的自动刷新仍使用 A
    await openEditRow(wrapper, srcRow)
    await editorInput(wrapper, '数据源名称').setValue('源库A改')
    await nextTick()
    await buttonByText(wrapper, '保存')!.trigger('click')
    await flushPromises()

    expect(mockedUpdate).toHaveBeenCalledTimes(1)
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'SRC' })
    expect(mockedList).not.toHaveBeenLastCalledWith({ id: 'NOPE' })
    wrapper.unmount()
  })

  it('删除成功自动刷新用已生效快照 A，而非改后的草稿 B', async () => {
    const wrapper = await mountPage()

    // 生效条件 A = 数据源ID=SRC
    await setQueryInput(wrapper, '数据源ID', 'SRC')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'SRC' })

    // 只把查询框改为 B = NOPE，不点击查询
    await setQueryInput(wrapper, '数据源ID', 'NOPE')

    // 删除成功后的自动刷新仍使用 A
    await clickRowMenuAction(wrapper, 0, '删除')

    expect(mockedDelete).toHaveBeenCalledWith('SRC001')
    expect(elMessageSuccessSpy).toHaveBeenCalledWith('删除成功')
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'SRC' })
    expect(mockedList).not.toHaveBeenLastCalledWith({ id: 'NOPE' })
    wrapper.unmount()
  })

  it('点击“查询”使用 trim 后独立快照；继续编辑表单不改变该快照', async () => {
    mockedList.mockResolvedValue(okList([]))
    const wrapper = await mountPage()

    // 带空格输入并点击查询：trim 为独立快照
    await setQueryInput(wrapper, '数据源ID', ' NOPE ')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'NOPE' })
    expect(wrapper.find('.empty-state').text()).toContain('未找到符合当前查询条件的数据源')

    // 继续编辑表单（不点击查询）：不新增请求，生效快照不被反向修改
    const callsBefore = mockedList.mock.calls.length
    await setQueryInput(wrapper, '数据源ID', 'OTHER')
    await nextTick()
    expect(mockedList).toHaveBeenCalledTimes(callsBefore)
    expect(wrapper.find('.empty-state').text()).toContain('未找到符合当前查询条件的数据源')
    wrapper.unmount()
  })

  it('重置只清空控件、不改变已生效条件；自动刷新仍用原生效快照', async () => {
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', 'SRC')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'SRC' })

    // 重置：控件清空且零请求，已生效条件仍为 SRC（DS-REQ-139/141）
    const callsBeforeReset = mockedList.mock.calls.length
    await buttonByText(wrapper, '重置')!.trigger('click')
    await flushPromises()
    expect(mockedList.mock.calls.length).toBe(callsBeforeReset)
    expect(queryInputValue(wrapper, '数据源ID')).toBe('')

    // 重置后的自动刷新（删除成功）仍使用原生效快照 SRC，而非无条件
    await clickRowMenuAction(wrapper, 0, '删除')
    expect(mockedDelete).toHaveBeenCalledWith('SRC001')
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'SRC' })
    expect(mockedList).not.toHaveBeenLastCalledWith({})
    wrapper.unmount()
  })

  it('自动刷新并发：迟到旧代次响应不得覆盖最终生效请求', async () => {
    let resolveStale!: (v: ApiResponse<DataSourceListRow[]>) => void
    mockedList
      .mockResolvedValueOnce(okList([srcRow, tgtRow])) // mount 无条件
      .mockResolvedValueOnce(okList([srcRow, tgtRow])) // 查询 SRC
      .mockImplementationOnce(
        () => new Promise<ApiResponse<DataSourceListRow[]>>((res) => (resolveStale = res)),
      ) // 删除自动刷新挂起（旧代次）
      .mockResolvedValueOnce(okList([])) // 撤空条件再查询立即返回空（新代次）
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', 'SRC')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()

    // 删除成功触发自动刷新（用生效快照 SRC）→ 请求挂起
    await clickRowMenuAction(wrapper, 0, '删除')
    expect(mockedDelete).toHaveBeenCalledWith('SRC001')

    // 随后清空控件再查询：无条件请求立即返回空 → 系统空状态
    await setQueryInput(wrapper, '数据源ID', '')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('暂无数据源')

    // 迟到的自动刷新响应：代次失效，不得覆盖最终生效请求的空状态
    resolveStale(okList([]))
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('暂无数据源')
    expect(wrapper.find('.empty-state').text()).not.toContain('未找到符合当前查询条件')
    wrapper.unmount()
  })
})

describe('三个业务弹窗标题栏拖动（DS-REQ-112）', () => {
  it('新增/编辑弹窗：仅标题栏拖动改变位置', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const el = document.querySelector('.editor-dialog') as HTMLElement
    const header = document.querySelector('.editor-dialog .el-dialog__header') as HTMLElement
    expect(header).toBeTruthy()

    header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 180, clientY: 160 }))
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    expect(el.style.transform).toContain('translate(80px, 60px)')
    wrapper.unmount()
  })

  it('关闭按钮不触发拖动', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const el = document.querySelector('.editor-dialog') as HTMLElement
    const closeBtn = document.querySelector('.editor-dialog .el-dialog__headerbtn') as HTMLElement
    expect(closeBtn).toBeTruthy()
    closeBtn.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
    expect(el.style.transform).toBe('translate(0px, 0px)')
    wrapper.unmount()
  })

  it('内容区输入控件不触发拖动', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const el = document.querySelector('.editor-dialog') as HTMLElement
    const input = document.querySelector('.editor-dialog .editor-form input') as HTMLElement
    expect(input).toBeTruthy()
    input.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
    expect(el.style.transform).toBe('translate(0px, 0px)')
    wrapper.unmount()
  })

  it('拖动受 viewport 边界约束，标题栏不被拖出', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const el = document.querySelector('.editor-dialog') as HTMLElement
    const header = document.querySelector('.editor-dialog .el-dialog__header') as HTMLElement
    header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    // 向左/上大幅拖动：clamp 到非负
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: -400, clientY: -400 }))
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    const m = el.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/)
    expect(m).toBeTruthy()
    expect(Number(m![1])).toBeGreaterThanOrEqual(0)
    expect(Number(m![2])).toBeGreaterThanOrEqual(0)
    wrapper.unmount()
  })

  it('浏览器尺寸变化后自动修正回可操作范围', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const el = document.querySelector('.editor-dialog') as HTMLElement
    const header = document.querySelector('.editor-dialog .el-dialog__header') as HTMLElement
    // 模拟弹窗被拖到左/上越界
    el.getBoundingClientRect = () =>
      ({
        left: -100,
        top: -60,
        right: 520,
        bottom: 370,
        width: 620,
        height: 430,
        x: -100,
        y: -60,
        toJSON: () => ({}),
      }) as DOMRect
    header.getBoundingClientRect = () =>
      ({
        left: -100,
        top: -60,
        right: 520,
        bottom: 4,
        width: 620,
        height: 64,
        x: -100,
        y: -60,
        toJSON: () => ({}),
      }) as DOMRect
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(el.style.transform).toContain('translate(100px, 60px)')
    wrapper.unmount()
  })

  it('关闭再打开恢复默认居中；组件卸载清理拖动监听', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const header = document.querySelector('.editor-dialog .el-dialog__header') as HTMLElement
    header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 180 }))
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    expect((document.querySelector('.editor-dialog') as HTMLElement).style.transform).not.toBe('')

    // 关闭（无脏数据不弹确认）→ 重开：transform 复位为默认居中
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()
    const el2 = document.querySelector('.editor-dialog') as HTMLElement
    // 重开即复位到默认居中位置
    expect(el2.style.transform).toBe('translate(0px, 0px)')

    // 重开后重新绑定，拖动仍生效
    const header2 = document.querySelector('.editor-dialog .el-dialog__header') as HTMLElement
    header2.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, clientY: 50 }))
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    expect(el2.style.transform).toContain('translate(50px, 40px)')

    // 卸载：弹窗 DOM 移除，且清理过程不抛错
    expect(() => wrapper.unmount()).not.toThrow()
    expect(document.querySelector('.editor-dialog')).toBeNull()
  })

  it('删除确认框固定居中，不具备业务弹窗拖动能力', async () => {
    const wrapper = await mountPage()
    confirmSpy.mockRestore()
    await clickRowMenuAction(wrapper, 0, '删除')

    const box = document.querySelector('.el-message-box') as HTMLElement
    expect(box).toBeTruthy()
    const boxHeader = box.querySelector('.el-message-box__header') as HTMLElement
    boxHeader.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 220, clientY: 200 }))
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    expect(box.style.transform).toBe('')

    // 关闭确认框，避免遗留弹层
    const cancelBtn = Array.from(box.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('取消'),
    ) as HTMLElement
    cancelBtn.click()
    await flushPromises()
    wrapper.unmount()
  })
})

describe('拖动监听生命周期清理（R1）', () => {
  it('拖动未结束即卸载组件：window 级监听被清理，卸载后 mousemove 不再移动旧弹窗且不抛异常', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const el = document.querySelector('.editor-dialog') as HTMLElement
    const header = document.querySelector('.editor-dialog .el-dialog__header') as HTMLElement
    header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 180 }))
    expect(el.style.transform).toContain('translate(100px, 80px)')

    // 拖动未松开就卸载组件
    wrapper.unmount()
    // 卸载后向 window 发 mousemove：不得抛异常，旧弹窗位置不得继续变化
    expect(() =>
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 280 })),
    ).not.toThrow()
    expect(el.style.transform).toContain('translate(100px, 80px)')
  })

  it('拖动未结束即关闭弹窗：重新打开后拖动正常且不重复绑定', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    // 开始拖动但不松开
    const header = document.querySelector('.editor-dialog .el-dialog__header') as HTMLElement
    header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 180 }))

    // 关闭弹窗（无脏数据直接关闭），销毁未结束的拖动
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    // 重新打开：默认居中
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()
    const el2 = document.querySelector('.editor-dialog') as HTMLElement
    expect(el2.style.transform).toBe('translate(0px, 0px)')

    // 重新拖动：位移精确等于拖动差值，证明无重复绑定
    const header2 = document.querySelector('.editor-dialog .el-dialog__header') as HTMLElement
    header2.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, clientY: 50 }))
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    expect(el2.style.transform).toContain('translate(50px, 40px)')
    wrapper.unmount()
  })

  it('正常 mouseup 后继续 mousemove 不再改变位置', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const el = document.querySelector('.editor-dialog') as HTMLElement
    const header = document.querySelector('.editor-dialog .el-dialog__header') as HTMLElement
    header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 180 }))
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    expect(el.style.transform).toContain('translate(100px, 80px)')

    // mouseup 后继续移动：位置不再变化
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 280 }))
    expect(el.style.transform).toContain('translate(100px, 80px)')
    wrapper.unmount()
  })

  it('非主键 mousedown 不发起拖动', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()

    const el = document.querySelector('.editor-dialog') as HTMLElement
    const header = document.querySelector('.editor-dialog .el-dialog__header') as HTMLElement
    header.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true, button: 2 }),
    )
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
    expect(el.style.transform).toBe('translate(0px, 0px)')
    wrapper.unmount()
  })

  it('命名策略弹窗标题栏同样可拖动（三个业务弹窗全覆盖）', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    const el = document.querySelector('.naming-dialog') as HTMLElement
    const header = document.querySelector('.naming-dialog .el-dialog__header') as HTMLElement
    expect(header).toBeTruthy()
    header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 180, clientY: 160 }))
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    expect(el.style.transform).toContain('translate(80px, 60px)')
    wrapper.unmount()
  })
})

describe('表单标签对齐与固定列宽（DS-REQ-113，主弹窗按 DS-REQ-184 调整为右对齐）', () => {
  it('三个业务弹窗：主弹窗右对齐、其余左对齐，固定列宽与必填标识稳定', async () => {
    const wrapper = await mountPage()

    // 新增/编辑主弹窗：按已批准调整改为标签右对齐（DS-REQ-184），列宽与业务属性/命名策略弹窗互不影响
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()
    const editorForm = wrapper.find('.editor-form')
    expect(editorForm.classes()).toContain('el-form--label-right')
    const editorLabel = editorForm.find('.el-form-item__label')
    expect(editorLabel.exists()).toBe(true)
    expect(editorLabel.attributes('style') ?? '').toContain('width: 120px')
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    // 命名策略弹窗
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')
    const namingForm = wrapper.find('.naming-form')
    expect(namingForm.classes()).toContain('el-form--label-left')
    const namingLabel = namingForm.find('.el-form-item__label')
    expect(namingLabel.attributes('style') ?? '').toContain('width: 110px')
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    // 业务属性弹窗存在（textarea 无表单标签），具备 biz-attr-dialog 类
    await clickRowMenuAction(wrapper, 1, '业务属性')
    expect(wrapper.find('.biz-attr-dialog').exists()).toBe(true)
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()
    wrapper.unmount()
  })
})

describe('命名策略弹窗布局（DS-REQ-114）', () => {
  it('桌面宽约1050px、七列、无分页、五行空间与 Tooltip', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    const dialog = wrapper.find('.naming-dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('style') ?? '').toContain('--el-dialog-width: 1050px')
    // viewport 约束通过 scoped 样式 max-width 生效（视觉检查复核）

    // 七列固定
    const headers = wrapper.findAll('.naming-table .el-table__header-wrapper th')
    expect(headers.map((h) => h.text().trim())).toEqual([
      '目标库ID',
      '目标库名称',
      '数据库类型',
      '命名策略',
      '前缀',
      '后缀',
      '操作',
    ])
    // 无分页
    expect(wrapper.find('.naming-table .el-pagination').exists()).toBe(false)
    // 五行空间：max-height 约束 → el-table--fluid-height
    expect(wrapper.find('.naming-table').classes()).toContain('el-table--fluid-height')
    // Tooltip：show-overflow-tooltip 列渲染 el-tooltip
    expect(
      document.querySelectorAll('.naming-table .el-table__body .el-tooltip').length,
    ).toBeGreaterThanOrEqual(1)
    wrapper.unmount()
  })
})

describe('命名策略单选卡片（DS-REQ-115）', () => {
  it('两张卡片固定文案、整卡点击选中态与键盘操作', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    const cards = wrapper.findAll('.naming-form .strategy-card')
    expect(cards.length).toBe(2)
    const mergeCard = cards.find((c) => c.text().includes('表合并'))!
    const customCard = cards.find((c) => c.text().includes('自定义前后缀'))!

    expect(mergeCard.text()).toContain('按表合并规则生成目标表名，无需填写前缀和后缀。')
    expect(customCard.text()).toContain('在源表名基础上添加指定前缀和后缀，生成目标表名。')

    // 默认 TABLE_MERGE 选中
    expect(mergeCard.classes()).toContain('is-selected')
    expect(mergeCard.attributes('aria-checked')).toBe('true')

    // 整卡点击选中自定义
    await customCard.trigger('click')
    await nextTick()
    expect(customCard.classes()).toContain('is-selected')
    expect(customCard.attributes('aria-checked')).toBe('true')
    expect(mergeCard.classes()).not.toContain('is-selected')

    // 键盘 Enter 选中回表合并
    await mergeCard.trigger('keydown.enter')
    await nextTick()
    expect(mergeCard.attributes('aria-checked')).toBe('true')
    wrapper.unmount()
  })

  it('策略切换时前后缀联动：表合并清空并禁用前后缀', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    await clickStrategyCard(wrapper, '自定义前后缀')
    await namingInput(wrapper, '表名前缀').setValue('pre')
    await namingInput(wrapper, '表名后缀').setValue('suf')
    await nextTick()
    expect(namingInput(wrapper, '表名前缀').element.disabled).toBe(false)

    await clickStrategyCard(wrapper, '表合并')
    await nextTick()
    expect(namingInput(wrapper, '表名前缀').element.value).toBe('')
    expect(namingInput(wrapper, '表名后缀').element.value).toBe('')
    expect(namingInput(wrapper, '表名前缀').element.disabled).toBe(true)
    expect(namingInput(wrapper, '表名后缀').element.disabled).toBe(true)
    wrapper.unmount()
  })
})

describe('列表表格视觉模板：数据源管理参考页等价接入（SHARED_COMPONENT_DESIGN §7.2）', () => {
  /**
   * 该 SFC 源码全文。测试环境不注入 SFC 样式，故公共预设引入方式与「无令牌覆盖」
   * 只能按源码静态结构受检；消费属性的实际计算值不在本块断言（§2.5 归真实浏览器）。
   */
  function pageSource(): string {
    return readFileSync(
      resolve(process.cwd(), 'src/views/data-source/DataSourcePage.vue'),
      'utf-8',
    )
  }

  it('显式启用：主列表根元素 className 同时含业务类与公共类（§7.2 断言 1）', async () => {
    const wrapper = await mountPage()

    const root = wrapper.find('.data-table')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('data-table')
    expect(root.classes()).toContain('lt-main-table')
    // 公共类并列追加在同一根元素上，而非新增 DOM 层
    expect(wrapper.find('.data-table.lt-main-table').element).toBe(root.element)

    wrapper.unmount()
  })

  it('未启用表格：命名策略弹窗表根元素不含公共类，且公共类全页仅一处（§7.2 断言 2/3）', async () => {
    const wrapper = await mountPage()
    await clickRowMenuAction(wrapper, 0, '目标库命名策略')

    const naming = wrapper.find('.naming-table')
    expect(naming.exists()).toBe(true)
    expect(naming.classes()).toContain('naming-table')
    expect(naming.classes()).not.toContain('lt-main-table')
    expect(wrapper.find('.naming-table.lt-main-table').exists()).toBe(false)
    // 命名表与主列表是两个独立根元素
    expect(wrapper.find('.data-table').element).not.toBe(naming.element)
    // 公共类未对其他表格节点重复声明
    expect(wrapper.findAll('.lt-main-table').length).toBe(1)

    wrapper.unmount()
  })

  it('本页不声明任何公共令牌覆盖，令牌取值来源唯一（§7.2 断言 2/3）', () => {
    const source = pageSource()
    expect(source).not.toMatch(/--lt-[\w-]+\s*:/)
  })

  it('以 <style scoped src> 显式引入公共预设，且保留原有内联 scoped 块（§7.1）', () => {
    const source = pageSource()
    expect(source).toContain(
      '<style scoped src="@/styles/list-table/list-table-visual.css"></style>',
    )
    expect(source).toMatch(/<style scoped>/)
  })

  it('被公共层逐值等价替代的四组局部基础规则已不再重复声明（单一发布者，§7.1 第 5 条）', () => {
    const source = pageSource()
    // 表格宽度、EP 表令牌、表头排版、表头/正文单元格内边距不得在本页留同义副本
    expect(source).not.toContain('--el-table-')
    expect(source).not.toContain('.el-table__header th .cell')
    expect(source).not.toContain('td.el-table__cell')
    expect(source).not.toContain('th.el-table__cell')
  })

  it('公共类接入不改变主列表组件契约：data 渲染、列定义与固定列（§7.2 断言 4）', async () => {
    const wrapper = await mountPage()

    const table = wrapper
      .findAllComponents({ name: 'ElTable' })
      .find((c) => c.classes().includes('data-table'))
    expect(table).toBeTruthy()

    // data prop 渲染未受影响
    expect((table!.props('data') as unknown[]).length).toBe(2)

    // 列定义、顺序与固定列保持
    const columns = table!.findAllComponents({ name: 'ElTableColumn' })
    expect(columns.length).toBe(10)
    expect(columns[0].props('label')).toBe('序号')
    const last = columns[columns.length - 1]
    expect(last.props('label')).toBe('操作')
    expect(last.props('fixed')).toBe('right')

    // show-overflow-tooltip 列定义保持（实际 tooltip 渲染由既有测试覆盖）
    const tooltipColumns = columns.filter((c) => c.props('showOverflowTooltip') === true)
    expect(tooltipColumns.length).toBeGreaterThan(0)

    wrapper.unmount()
  })

  it('scopedStyleBlock() 仍能提取到原内联 scoped 块（§7.2 断言 6）', () => {
    const source = pageSource()
    const matched = source.match(/<style scoped>([\s\S]*?)<\/style>/)
    expect(matched).not.toBeNull()

    const block = matched![1] ?? ''
    expect(block.length).toBeGreaterThan(0)
    // 提取到的仍是页面专属样式的内联块，而非外部公共预设
    expect(block).toContain('.editor-form')
    expect(block).not.toContain('lt-main-table')
  })
})
