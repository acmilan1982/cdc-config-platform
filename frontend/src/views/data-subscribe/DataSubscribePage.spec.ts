import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/monitor'
import type {
  SubscriptionListVO,
  SubscriptionOptionsVO,
  SubscriptionRowVO,
} from '@/types/subscription'

vi.mock('@/api/subscription', () => ({
  fetchSubscriptionList: vi.fn(),
  fetchSubscriptionOptions: vi.fn(),
  fetchSubscriptionDetail: vi.fn(),
  fetchSubscriptionEdit: vi.fn(),
  createSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  fetchSubscriptionDeletePreview: vi.fn(),
  deleteSubscription: vi.fn(),
  fetchSourceSchemas: vi.fn(),
  fetchSourceTables: vi.fn(),
}))

import {
  fetchSubscriptionList,
  fetchSubscriptionOptions,
  fetchSubscriptionDeletePreview,
} from '@/api/subscription'
import DataSubscribePage from './DataSubscribePage.vue'
import SubscribeFormDialog from './components/SubscribeFormDialog.vue'

const mockedList = vi.mocked(fetchSubscriptionList)
const mockedOptions = vi.mocked(fetchSubscriptionOptions)
const mockedDeletePreview = vi.mocked(fetchSubscriptionDeletePreview)

const options: SubscriptionOptionsVO = {
  sources: [
    { dataSourceId: 'S01', dataSourceOrg: '机构A' },
    { dataSourceId: 'S02', dataSourceOrg: '机构B' },
  ],
  targets: [
    { dataSourceId: 'T01', dataSourceOrg: '机构B' },
    { dataSourceId: 'T02', dataSourceOrg: '机构C' },
  ],
}

function okOptions(): ApiResponse<SubscriptionOptionsVO> {
  return { code: 200, message: 'success', timestamp: '', data: options }
}

function okList(items: SubscriptionRowVO[], queryWarnings: unknown[] = []): ApiResponse<SubscriptionListVO> {
  return { code: 200, message: 'success', timestamp: '', data: { items, queryWarnings: queryWarnings as never[] } }
}

const normalRow: SubscriptionRowVO = {
  dataSubId: 'id1',
  dataSubDesc: '机构A到机构B全量订阅',
  anomalyMultiSource: false,
  source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' },
  sourceTableCount: 2,
  tablesBySchema: [{ schema: 'SCHEMA_A', tables: ['T1', 'T2'] }],
  rawUnparseableTables: ['FRAG1'],
  targets: [
    { dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' },
    { dataSourceId: 'T02', dataSourceOrg: '机构C', status: 'NORMAL' },
    { dataSourceId: 'T03', dataSourceOrg: '机构D', status: 'INACTIVE' },
  ],
  updateTime: '2026-08-02T11:00:00',
  insertTime: '2026-08-01T10:00:00',
}

const createFallbackRow: SubscriptionRowVO = {
  ...normalRow,
  dataSubId: 'id2',
  updateTime: null,
  insertTime: '2026-08-01T09:00:00',
}

const anomalyRow: SubscriptionRowVO = {
  ...normalRow,
  dataSubId: 'id3',
  dataSubDesc: '多源异常记录',
  anomalyMultiSource: true,
  targets: [],
}

function bodyText(): string {
  return document.body.textContent ?? ''
}

/** 真实点击第 index 个查询下拉（源库=0，目标库=1），选中含指定文本的选项。 */
async function pickQueryOption(wrapper: ReturnType<typeof mount>, index: number, optionLabel: string) {
  const selects = wrapper.findAll('.query-select')
  await selects[index].find('.el-select__wrapper').trigger('click')
  await nextTick()
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
  const item = Array.from(dropdown!.querySelectorAll('.el-select-dropdown__item')).find((it) =>
    it.textContent?.includes(optionLabel),
  ) as HTMLElement
  item.click()
  await nextTick()
}

async function mountPage() {
  const wrapper = mount(DataSubscribePage, { global: { plugins: [ElementPlus] } })
  await flushPromises()
  return wrapper
}

/**
 * el-table 的 hidden-columns 会额外渲染一份隐藏列（含动作按钮），且该处无行数据；
 * 查找真实表格行（.el-table__row）内的按钮，避免误点隐藏副本。
 */
function rowButtonByText(wrapper: ReturnType<typeof mount>, text: string) {
  return (
    wrapper.findAll('.el-table__row .el-button').find((b) => b.text().includes(text)) ?? null
  )
}

beforeEach(() => {
  mockedList.mockReset()
  mockedOptions.mockReset()
  mockedDeletePreview.mockReset()
  mockedOptions.mockResolvedValue(okOptions())
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('DataSubscribePage 首查与查询/重置语义', () => {
  it('挂载自动查询空条件；列表渲染列、源表 Tooltip 分区、目标折叠与更新时间', async () => {
    mockedList.mockResolvedValue(okList([normalRow], [{ type: 'AMBIGUOUS_COMMA_ID', field: 'sourceIds', message: '源库名含逗号，已按模糊匹配' }]))
    const wrapper = await mountPage()

    // 首次自动查询空条件
    expect(mockedList).toHaveBeenCalledWith({})

    // 列表列
    expect(wrapper.text()).toContain('机构A到机构B全量订阅')
    expect(wrapper.text()).toContain('机构A')
    expect(wrapper.text()).toContain('S01')
    expect(wrapper.text()).toContain('共 2 张')
    // 不可解析分区
    expect(wrapper.text()).toContain('以下片段无法解析：')
    expect(wrapper.text()).toContain('FRAG1')
    // 目标库折叠：>2 个只展示前 2 个 +N，T03（已停用）被折叠
    expect(wrapper.text()).toContain('机构B')
    expect(wrapper.text()).toContain('机构C')
    expect(wrapper.text()).toContain('+1')
    expect(wrapper.text()).not.toContain('机构D')
    // 更新时间
    expect(wrapper.text()).toContain('2026-08-02T11:00:00')
    // 查询警告 banner
    expect(wrapper.text()).toContain('源库名含逗号，已按模糊匹配')
    wrapper.unmount()
  })

  it('点击目标折叠 +N 展开全部目标', async () => {
    mockedList.mockResolvedValue(okList([normalRow]))
    const wrapper = await mountPage()
    expect(wrapper.text()).not.toContain('机构D')

    // 测试环境下 transition 被 stub 成 <transition-stub>，.fold-tag 落在外层 stub；
    // 点击内部 .el-tag__content 才能触发绑在 el-tag 根上的 @click。
    const foldTag = wrapper.find('.fold-tag .el-tag__content')
    expect(foldTag.text()).toContain('+1')
    await foldTag.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('机构D')
    wrapper.unmount()
  })

  it('查询需点击按钮触发；携带已选项参数（重复 sourceIds）', async () => {
    mockedList.mockResolvedValue(okList([normalRow]))
    const wrapper = await mountPage()
    expect(mockedList).toHaveBeenCalledTimes(1)

    await pickQueryOption(wrapper, 0, '机构A')
    await wrapper.findAll('button').find((b) => b.text().includes('查询'))!.trigger('click')
    await flushPromises()
    expect(mockedList).toHaveBeenCalledTimes(2)
    expect(mockedList.mock.calls[1][0]).toEqual({ sourceIds: ['S01'] })
    wrapper.unmount()
  })

  it('重置仅清空表单，不发起请求且保留列表与警告', async () => {
    mockedList.mockResolvedValue(okList([normalRow], [{ type: 'AMBIGUOUS_COMMA_ID', field: 'targetIds', message: '警告保留' }]))
    const wrapper = await mountPage()
    await pickQueryOption(wrapper, 0, '机构A')
    expect(wrapper.findAll('.query-select')[0].text()).toContain('机构A') // 已选中

    await wrapper.findAll('button').find((b) => b.text().includes('重置'))!.trigger('click')
    await nextTick()
    expect(mockedList).toHaveBeenCalledTimes(1) // 不发起新请求
    expect(wrapper.findAll('.query-select')[0].text()).not.toContain('机构A') // 表单已清空
    expect(wrapper.text()).toContain('机构A到机构B全量订阅') // 列表保留
    expect(wrapper.text()).toContain('警告保留') // 警告保留
    wrapper.unmount()
  })

  it('空列表显示空状态文案', async () => {
    mockedList.mockResolvedValue(okList([]))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('暂无符合条件的订阅记录')
    wrapper.unmount()
  })

  it('列表加载失败显示错误并可重试', async () => {
    mockedList.mockRejectedValueOnce(new Error('查询超时'))
    mockedList.mockResolvedValue(okList([normalRow]))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('查询超时')

    await wrapper.findAll('button').find((b) => b.text().includes('重试'))!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('机构A到机构B全量订阅')
    wrapper.unmount()
  })

  it('更新时间缺失时回退 insertTime 并标记创建时间', async () => {
    mockedList.mockResolvedValue(okList([createFallbackRow]))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('2026-08-01T09:00:00')
    expect(wrapper.text()).toContain('创建时间')
    wrapper.unmount()
  })

  it('多源异常记录仅提示维护数据库且不提供操作', async () => {
    mockedList.mockResolvedValue(okList([anomalyRow]))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('配置异常：该记录包含多个源库，请直接维护数据库')
    // 隐藏列副本不属于真实行；真实行内不得有任何操作按钮
    expect(wrapper.findAll('.el-table__row .el-button').length).toBe(0)
    wrapper.unmount()
  })
})

describe('DataSubscribePage 弹窗入口与保存/删除反馈', () => {
  it('新增订阅打开表单弹窗', async () => {
    mockedList.mockResolvedValue(okList([]))
    const wrapper = await mountPage()
    await wrapper.findAll('button').find((b) => b.text().includes('新增订阅'))!.trigger('click')
    await nextTick()
    // 表单弹窗非 append-to-body，标题在组件内而非 document.body
    expect(wrapper.text()).toContain('新增订阅')
    wrapper.unmount()
  })

  it('删除入口打开删除确认弹窗并加载预览', async () => {
    mockedList.mockResolvedValue(okList([normalRow]))
    mockedDeletePreview.mockResolvedValue({
      code: 200,
      message: 'success',
      timestamp: '',
      data: {
        dataSubId: 'id1',
        dataSubDesc: '机构A到机构B全量订阅',
        source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' },
        schemaCount: 1,
        tableCount: 2,
        targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' }],
        warnings: [],
      },
    })
    const wrapper = await mountPage()
    await rowButtonByText(wrapper, '删除')!.trigger('click')
    await flushPromises()
    expect(bodyText()).toContain('删除确认')
    expect(bodyText()).toContain('数据库记录物理删除且无法恢复')
    wrapper.unmount()
  })

  it('表单保存成功：提示生效消息并刷新列表', async () => {
    const successSpy = vi.spyOn(ElMessage, 'success').mockImplementation(() => undefined as never)
    mockedList.mockResolvedValue(okList([normalRow]))
    const wrapper = await mountPage()

    wrapper.findComponent(SubscribeFormDialog).vm.$emit('saved', true)
    await nextTick()

    expect(successSpy).toHaveBeenCalledWith('操作成功。配置将在相关 sync-client 重启后生效。')
    expect(mockedList).toHaveBeenCalledTimes(2) // 初始 + 刷新
    wrapper.unmount()
  })
})
