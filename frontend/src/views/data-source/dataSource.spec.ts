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
  const wrapper = mount(DataSourcePage, {
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

/** 真实勾选 el-radio（label 点击在 jsdom 不会转发到原生 input，需直接勾选 input）。 */
async function clickRadio(w: PageWrapper, container: string, label: string) {
  const radios = w.findAll(`${container} .el-radio`)
  const target = radios.find((r) => r.text().includes(label))
  if (!target) {
    throw new Error(`radio not found: ${label}`)
  }
  await target.find('input').setValue(true)
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

  it('未决请求到 0 变为连接超时，迟到成功响应被忽略', async () => {
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

    await vi.advanceTimersByTimeAsync(10000)
    expect(wrapper.text()).toContain('连接超时')
    expect(wrapper.text()).not.toContain('测试连接中')

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

  it('失败直接展示脱敏消息，不重复拼接“连接失败：”前缀', async () => {
    const wrapper = await mountPage()
    await buttonByText(wrapper, '新增数据源')!.trigger('click')
    await flushPromises()
    mockedTest.mockResolvedValue(okTest(false, '认证失败'))

    await buttonByText(wrapper, '测试连接')!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('认证失败')
    expect(wrapper.text()).not.toContain('连接失败：认证失败')
    expect(wrapper.text()).not.toContain('重试（')
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
    await clickRadio(wrapper, '.naming-form', '自定义前后缀')
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

    await clickRadio(wrapper, '.naming-form', '自定义前后缀')
    await namingInput(wrapper, '表名前缀').setValue('pre')
    await namingInput(wrapper, '表名后缀').setValue('suf')
    await nextTick()

    await clickRadio(wrapper, '.naming-form', '表合并')
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
    await clickRadio(wrapper, '.naming-form', '自定义前后缀')
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
