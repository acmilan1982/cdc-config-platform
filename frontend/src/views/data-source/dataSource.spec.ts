import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MockInstance } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus'
import type { ApiResponse } from '@/types/monitor'
import type {
  DataSourceRow,
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

const srcRow: DataSourceRow = {
  dataSourceId: 'SRC001',
  dataSourceName: '源库A',
  dataSourceCategory: 'SOURCE',
  dataSourceType: 'ORACLE',
  host: '10.1.1.1',
  port: 1521,
  serviceName: 'orcl',
  userName: 'scott',
}

const tgtRow: DataSourceRow = {
  dataSourceId: 'TG001',
  dataSourceName: '目标库B',
  dataSourceCategory: 'TARGET',
  dataSourceType: 'MYSQL',
  host: '10.1.1.2',
  port: 3306,
  serviceName: 'mydb',
  userName: 'app',
}

function okList(data: DataSourceRow[]): ApiResponse<DataSourceRow[]> {
  return { code: 200, message: 'success', timestamp: '', data }
}

function failList(code: number, message: string): ApiResponse<DataSourceRow[]> {
  return { code, message, timestamp: '', data: [] }
}

function okString(value: string): ApiResponse<string> {
  return { code: 200, message: 'success', timestamp: '', data: value }
}

function okRow(row: DataSourceRow): ApiResponse<DataSourceRow> {
  return { code: 200, message: 'success', timestamp: '', data: row }
}

function okNull(): ApiResponse<null> {
  return { code: 200, message: 'success', timestamp: '', data: null }
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
  // 已关闭的下拉仍保留在 body，但其 popper 父级含 display:none；只选当前可见的下拉。
  const dropdown = Array.from(document.body.querySelectorAll('.el-select-dropdown'))
    .filter((d) => {
      const popper = d.parentElement
      return !!popper && !(popper.getAttribute('style') || '').includes('display: none')
    })
    .find((d) =>
      Array.from(d.querySelectorAll('.el-select-dropdown__item')).some((it) =>
        it.textContent?.includes(optionLabel),
      ),
    )
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

/** 设置查询区输入框。 */
async function setQueryInput(w: PageWrapper, label: string, value: string) {
  const qItems = w.findAll('.query-form .el-form-item')
  const item = qItems.find((i) => i.text().includes(label))
  if (!item) {
    throw new Error(`query form-item not found for label: ${label}`)
  }
  await item.find('input').setValue(value)
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
})

describe('列表加载与查询', () => {
  it('成功加载渲染两行、角色标签与操作按钮', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('SRC001')
    expect(wrapper.text()).toContain('TG001')
    expect(wrapper.text()).toContain('源库')
    expect(wrapper.text()).toContain('目标库')
    expect(wrapper.text()).toContain('目标库命名策略')
    expect(wrapper.text()).toContain('业务属性')
    // 每行编辑/删除 + 各自扩展按钮，共 6 个行操作按钮
    expect(wrapper.findAll('.data-table button').length).toBeGreaterThanOrEqual(6)
    wrapper.unmount()
  })

  it('查询 trim 后按 AND 传参；重置清空并重载', async () => {
    const wrapper = await mountPage()

    const qItems = wrapper.findAll('.query-form .el-form-item')
    const idItem = qItems.find((i) => i.text().includes('数据源ID'))!
    await idItem.find('input').setValue(' SRC ')
    const nameItem = qItems.find((i) => i.text().includes('名称'))!
    await nameItem.find('input').setValue(' 源 ')
    const hostItem = qItems.find((i) => i.text().includes('主机'))!
    await hostItem.find('input').setValue(' 10.1 ')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()

    expect(mockedList).toHaveBeenLastCalledWith({ id: 'SRC', name: '源', host: '10.1' })

    await buttonByText(wrapper, '重置')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({})
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
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()

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
    } as unknown as ApiResponse<DataSourceRow>)
    const wrapper = await mountPage()
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.form-error').text()).toContain('数据源不存在')
    // 列表行数据未被当作权威详情：名称仍为空
    expect(editorInput(wrapper, '数据源名称').element.value).toBe('')
    wrapper.unmount()
  })

  it('详情网络异常显示错误', async () => {
    mockedDetail.mockRejectedValueOnce(new Error('network down'))
    const wrapper = await mountPage()
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.form-error').text()).toContain('network down')
    wrapper.unmount()
  })

  it('快速切换记录时迟到的详情响应被代次隔离', async () => {
    let resolveFirst!: (v: ApiResponse<DataSourceRow>) => void
    mockedDetail
      .mockImplementationOnce(
        () => new Promise<ApiResponse<DataSourceRow>>((res) => (resolveFirst = res)),
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
    let resolveDetail!: (v: ApiResponse<DataSourceRow>) => void
    mockedDetail.mockImplementationOnce(
      () => new Promise<ApiResponse<DataSourceRow>>((res) => (resolveDetail = res)),
    )
    const wrapper = await mountPage()

    // 编辑 A：详情请求未决
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()

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
    let resolveDetailA!: (v: ApiResponse<DataSourceRow>) => void
    mockedDetail
      .mockImplementationOnce(
        () => new Promise<ApiResponse<DataSourceRow>>((res) => (resolveDetailA = res)),
      )
      .mockResolvedValueOnce(okRow(tgtRow))
    const wrapper = await mountPage()

    // 编辑 A：详情未决
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()

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
          new Promise<ApiResponse<DataSourceRow>>((_, rej) => (rejectDetailA = rej)),
      )
      .mockResolvedValueOnce(okRow(tgtRow))
    const wrapper = await mountPage()

    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()
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
    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mockedDelete).toHaveBeenCalledWith('SRC001')
    expect(elMessageSuccessSpy).toHaveBeenCalledWith('删除成功')
    expect(mockedList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('取消删除不调用接口', async () => {
    confirmSpy.mockRejectedValueOnce('cancel')
    const wrapper = await mountPage()
    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()

    expect(mockedDelete).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('删除进行中重复点击只发一个请求', async () => {
    let resolve!: (v: ApiResponse<null>) => void
    mockedDelete.mockReturnValueOnce(new Promise<ApiResponse<null>>((res) => (resolve = res)))
    const wrapper = await mountPage()

    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()
    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()

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

    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalledTimes(1)

    // 确认未决：再次触发不再弹第二个确认，也不发请求
    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mockedDelete).not.toHaveBeenCalled()

    // 取消确认 → 释放状态，允许重新尝试
    rejectConfirm('cancel')
    await flushPromises()
    expect(mockedDelete).not.toHaveBeenCalled()

    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalledTimes(2)
    expect(mockedDelete).toHaveBeenCalledWith('SRC001')
    wrapper.unmount()
  })
})

describe('编辑弹窗未保存确认', () => {
  it('主编辑弹窗脏数据关闭需确认', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '业务属性')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '业务属性')!.trigger('click')
    await flushPromises()

    await wrapper.find('.biz-attr-body textarea').setValue('changed')
    await nextTick()
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('无修改时直接关闭不弹确认', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '业务属性')!.trigger('click')
    await flushPromises()

    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    expect(confirmSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('目标库命名策略（仅源库）', () => {
  it('打开显示策略列表与目标候选；标题含源库ID与名称；表格列含数据库类型', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    expect(empty.text()).toContain('请调整查询条件后重试，或点击上方“重置”查看全部数据源')
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

  it('重置清空生效条件，列表为空时回退系统空状态', async () => {
    mockedList.mockResolvedValue(okList([]))
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', 'NOPE')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('未找到符合当前查询条件的数据源')

    await buttonByText(wrapper, '重置')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('暂无数据源')
    expect(wrapper.find('.empty-state').text()).not.toContain('未找到符合当前查询条件')
    wrapper.unmount()
  })

  it('加载中与加载失败时不误显示普通空状态', async () => {
    let resolve!: (v: ApiResponse<DataSourceRow[]>) => void
    mockedList.mockImplementationOnce(
      () => new Promise<ApiResponse<DataSourceRow[]>>((res) => (resolve = res)),
    )
    const wrapper = await mountPage()

    // 初始加载挂起：不得显示普通空状态
    expect(wrapper.find('.empty-state').exists()).toBe(false)

    resolve(okList([]))
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('暂无数据源')

    // 加载失败：展示错误，不得显示普通空状态
    mockedList.mockRejectedValueOnce(new Error('network down'))
    await buttonByText(wrapper, '重置')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.load-error').exists()).toBe(true)
    expect(wrapper.find('.empty-state').exists()).toBe(false)
    wrapper.unmount()
  })

  it('并发查询只有最终生效请求更新列表与空状态，旧响应不得覆盖', async () => {
    let resolveFirst!: (v: ApiResponse<DataSourceRow[]>) => void
    mockedList
      .mockImplementationOnce(
        () => new Promise<ApiResponse<DataSourceRow[]>>((res) => (resolveFirst = res)),
      )
      .mockResolvedValueOnce(okList([]))
      .mockResolvedValueOnce(okList([]))
    const wrapper = await mountPage()

    // 第一次查询（NOPE）挂起
    await setQueryInput(wrapper, '数据源ID', 'NOPE')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()

    // 重置（无条件）立即返回空 → 系统空状态
    await buttonByText(wrapper, '重置')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.empty-state').text()).toContain('暂无数据源')

    // 第一次查询迟到返回：代次失效，不得覆盖生效条件与空状态
    resolveFirst(okList([]))
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
    await buttonByText(wrapper, '编辑')!.trigger('click')
    await flushPromises()
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
    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()

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

  it('点击“重置”后生效条件为无条件，自动刷新使用无条件快照', async () => {
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', 'SRC')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({ id: 'SRC' })

    await buttonByText(wrapper, '重置')!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenLastCalledWith({})

    // 重置后的自动刷新（删除成功）仍使用无条件快照
    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()
    expect(mockedDelete).toHaveBeenCalledWith('SRC001')
    expect(mockedList).toHaveBeenLastCalledWith({})
    wrapper.unmount()
  })

  it('自动刷新并发：迟到旧代次响应不得覆盖最终生效请求', async () => {
    let resolveStale!: (v: ApiResponse<DataSourceRow[]>) => void
    mockedList
      .mockResolvedValueOnce(okList([srcRow, tgtRow])) // mount 无条件
      .mockResolvedValueOnce(okList([srcRow, tgtRow])) // 查询 SRC
      .mockImplementationOnce(
        () => new Promise<ApiResponse<DataSourceRow[]>>((res) => (resolveStale = res)),
      ) // 删除自动刷新挂起（旧代次）
      .mockResolvedValueOnce(okList([])) // 重置无条件立即返回空
    const wrapper = await mountPage()

    await setQueryInput(wrapper, '数据源ID', 'SRC')
    await buttonByText(wrapper, '查询')!.trigger('click')
    await flushPromises()

    // 删除成功触发自动刷新（用生效快照 SRC）→ 请求挂起
    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()
    expect(mockedDelete).toHaveBeenCalledWith('SRC001')

    // 随后重置：无条件请求立即返回空 → 系统空状态
    await buttonByText(wrapper, '重置')!.trigger('click')
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
    await buttonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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

describe('表单标签左对齐与固定列宽（DS-REQ-113）', () => {
  it('三个业务弹窗：标签左对齐、固定列宽、必填星号稳定', async () => {
    const wrapper = await mountPage()

    // 新增/编辑弹窗
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()
    const editorForm = wrapper.find('.editor-form')
    expect(editorForm.classes()).toContain('el-form--label-left')
    const editorLabel = editorForm.find('.el-form-item__label')
    expect(editorLabel.exists()).toBe(true)
    expect(editorLabel.attributes('style') ?? '').toContain('width: 120px')
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    // 命名策略弹窗
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()
    const namingForm = wrapper.find('.naming-form')
    expect(namingForm.classes()).toContain('el-form--label-left')
    const namingLabel = namingForm.find('.el-form-item__label')
    expect(namingLabel.attributes('style') ?? '').toContain('width: 110px')
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()

    // 业务属性弹窗存在（textarea 无表单标签），具备 biz-attr-dialog 类
    await buttonByText(wrapper, '业务属性')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.biz-attr-dialog').exists()).toBe(true)
    await buttonByText(wrapper, '取消')!.trigger('click')
    await flushPromises()
    wrapper.unmount()
  })
})

describe('命名策略弹窗布局（DS-REQ-114）', () => {
  it('桌面宽约1050px、七列、无分页、五行空间与 Tooltip', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
    await buttonByText(wrapper, '目标库命名策略')!.trigger('click')
    await flushPromises()

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
