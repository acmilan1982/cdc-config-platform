import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/monitor'
import type {
  SubscriptionDetailVO,
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
  fetchSubscriptionDetail,
  fetchSubscriptionDeletePreview,
} from '@/api/subscription'
import DataSubscribePage from './DataSubscribePage.vue'
import SubscribeFormDialog from './components/SubscribeFormDialog.vue'

const mockedList = vi.mocked(fetchSubscriptionList)
const mockedOptions = vi.mocked(fetchSubscriptionOptions)
const mockedDetail = vi.mocked(fetchSubscriptionDetail)
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

function okOptions(data: SubscriptionOptionsVO = options): ApiResponse<SubscriptionOptionsVO> {
  return { code: 200, message: 'success', timestamp: '', data }
}

function okList(items: SubscriptionRowVO[], queryWarnings: unknown[] = []): ApiResponse<SubscriptionListVO> {
  return { code: 200, message: 'success', timestamp: '', data: { items, queryWarnings: queryWarnings as never[] } }
}

function okDetail(data: SubscriptionDetailVO): ApiResponse<SubscriptionDetailVO> {
  return { code: 200, message: 'success', timestamp: '', data }
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

/** 当前可见（未被 display:none 过滤）的 el-select 下拉。 */
function visibleDropdowns(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll('.el-select-dropdown'))
    .filter((d) => {
      const popper = d.parentElement
      return !!popper && !(popper.getAttribute('style') || '').includes('display: none')
    })
    .filter((d) => d.querySelectorAll('.el-select-dropdown__item').length > 0) as HTMLElement[]
}

/** 打开第 index 个查询下拉（源库=0，目标库=1），返回当前可见下拉元素。 */
async function openQueryDropdown(wrapper: ReturnType<typeof mount>, index: number): Promise<HTMLElement> {
  const selects = wrapper.findAll('.query-select')
  await selects[index].find('.el-select__wrapper').trigger('click')
  await nextTick()
  return visibleDropdowns()[0]
}

/** 真实点击第 index 个查询下拉，选中含指定文本的选项。 */
async function pickQueryOption(wrapper: ReturnType<typeof mount>, index: number, optionLabel: string) {
  await openQueryDropdown(wrapper, index)
  const dropdown = visibleDropdowns().find((d) =>
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

/** 递归提取 VNode 树的纯文本（el-tooltip #content 插槽在 jsdom 不 teleport，需走 $slots）。 */
function vnodeText(vnodes: unknown): string {
  let out = ''
  const arr = Array.isArray(vnodes) ? vnodes : [vnodes]
  for (const v of arr) {
    if (v == null) continue
    if (typeof v === 'string') out += v
    else if (Array.isArray((v as { children?: unknown }).children)) out += vnodeText((v as { children: unknown[] }).children)
    else if ((v as { children?: unknown }).children != null) out += String((v as { children: unknown }).children)
  }
  return out
}

/** 查找 #content 插槽文本包含 matcher 的 el-tooltip 的插槽全文。 */
function tooltipSlotText(wrapper: ReturnType<typeof mount>, matcher: string): string {
  for (const tip of wrapper.findAllComponents({ name: 'ElTooltip' })) {
    const vm = tip.vm as unknown as { $slots?: Record<string, (() => unknown) | undefined> }
    const content = vm.$slots?.content?.()
    if (!content) continue
    const text = vnodeText(content)
    if (text.includes(matcher)) return text
  }
  return ''
}

beforeEach(() => {
  mockedList.mockReset()
  mockedOptions.mockReset()
  mockedDetail.mockReset()
  mockedDeletePreview.mockReset()
  mockedOptions.mockResolvedValue(okOptions())
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('DataSubscribePage 首查与查询/重置语义', () => {
  it('挂载自动查询空条件；列表列、源表悬停分区、目标 +N 悬停与更新时间', async () => {
    mockedList.mockResolvedValue(okList([normalRow], [{ type: 'AMBIGUOUS_COMMA_ID', field: 'sourceIds', message: '源库名含逗号，已按模糊匹配' }]))
    const wrapper = await mountPage()

    // 首次自动查询空条件
    expect(mockedList).toHaveBeenCalledWith({})

    // 订阅描述单行省略（title 承载完整内容，R1 §5.2.1）；限定真实行避免 hidden-columns 影子副本
    const desc = wrapper.find('.el-table__row .desc-cell')
    expect(desc.exists()).toBe(true)
    expect(desc.attributes('title')).toBe('机构A到机构B全量订阅')
    expect(wrapper.text()).toContain('机构A到机构B全量订阅')

    // 源库：正常只显示机构名，数据源 ID 仅通过悬停 title 查看（R1 §5.2.2/5.2.3）
    const sourceMain = wrapper.find('.el-table__row .ref-main')
    expect(sourceMain.text()).toBe('机构A')
    expect(sourceMain.attributes('title')).toBe('S01')
    expect(wrapper.find('.ref-id').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('S01')

    // 源表单元格主体只能显示“共 N 张”（R1 §5.2.4）
    const sourceCell = wrapper.find('.el-table__row .cell-source-tables')
    expect(sourceCell.text()).toBe('共 2 张')
    expect(sourceCell.find('.unparseable-zone').exists()).toBe(false)
    expect(sourceCell.text()).not.toContain('FRAG1')
    // 无法解析 token 在同一悬停层内以警示分区展示（R1 §5.2.5/5.2.6）
    const tableTip = tooltipSlotText(wrapper, 'FRAG1')
    expect(tableTip).toContain('SCHEMA_A')
    expect(tableTip).toContain('T1')
    expect(tableTip).toContain('T2')
    expect(tableTip).toContain('以下片段无法解析，可能存在历史格式异常')
    expect(tableTip).toContain('FRAG1')

    // 目标库 +N 悬停展示全部（R1 §5.2.7/5.2.8）：可见前 2 个，+1 悬停含 T03（已停用）
    expect(wrapper.text()).toContain('机构B')
    expect(wrapper.text()).toContain('机构C')
    expect(wrapper.find('.more-tag').text()).toBe('+1')
    expect(wrapper.text()).not.toContain('机构D')
    const moreTip = tooltipSlotText(wrapper, '机构D')
    expect(moreTip).toContain('机构D')
    expect(moreTip).toContain('已停用')
    expect(wrapper.findAll('.fold-tag').length).toBe(0)

    // 更新时间
    expect(wrapper.text()).toContain('2026-08-02T11:00:00')
    // 查询警告 banner
    expect(wrapper.text()).toContain('源库名含逗号，已按模糊匹配')
    wrapper.unmount()
  })

  it('目标 +N 悬停查看全部，不提供行内展开/收起（点击不改变展示）', async () => {
    mockedList.mockResolvedValue(okList([normalRow]))
    const wrapper = await mountPage()
    expect(wrapper.text()).not.toContain('机构D')
    expect(tooltipSlotText(wrapper, '机构D')).toContain('机构D')

    // 点击 +N 不得展开行内目标（R1 §5.2.7）
    await wrapper.find('.more-tag').trigger('click')
    await nextTick()
    expect(wrapper.text()).not.toContain('机构D')
    expect(wrapper.findAll('.target-tags').length).toBeGreaterThanOrEqual(1)
    wrapper.unmount()
  })

  it('查询候选以机构为主文字、ID 为辅助文字；含逗号候选仍可选但显示歧义警告（R1 §5.1）', async () => {
    mockedOptions.mockResolvedValue(
      okOptions({
        sources: [
          { dataSourceId: 'S,01', dataSourceOrg: '机构A' },
          { dataSourceId: 'DOT.01', dataSourceOrg: '机构B' },
        ],
        targets: options.targets,
      }),
    )
    mockedList.mockResolvedValue(okList([]))
    const wrapper = await mountPage()

    const dropdown = await openQueryDropdown(wrapper, 0)
    const items = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item'))
    const commaItem = items.find((it) => it.textContent?.includes('S,01')) as HTMLElement
    const dotItem = items.find((it) => it.textContent?.includes('DOT.01')) as HTMLElement
    // 机构名为主文字、ID 为辅助文字
    expect(commaItem.querySelector('.q-opt-main')?.textContent).toBe('机构A')
    expect(commaItem.querySelector('.q-opt-sub')?.textContent).toBe('S,01')
    // 含逗号候选显示歧义警告
    expect(commaItem.textContent).toContain('含逗号，历史兼容查询可能存在歧义')
    // 仅含句点候选为普通候选，无警告
    expect(dotItem.textContent).not.toContain('含逗号')
    // 含逗号候选仍可选择
    commaItem.click()
    await nextTick()
    expect(wrapper.findAll('.query-select')[0].text()).toContain('机构A')
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

  it('操作文字为“查看”，点击打开详情弹窗并加载（R1 §5.2.9）', async () => {
    mockedList.mockResolvedValue(okList([normalRow]))
    mockedDetail.mockResolvedValue(
      okDetail({
        dataSubId: 'id1',
        dataSubDesc: '机构A到机构B全量订阅',
        source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' },
        tablesBySchema: [{ schema: 'SCHEMA_A', tables: ['T1', 'T2'] }],
        rawUnparseableTables: ['FRAG1'],
        targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' }],
        insertTime: '2026-08-01T10:00:00',
        updateTime: '2026-08-02T11:00:00',
        warnings: [],
      }),
    )
    const wrapper = await mountPage()
    expect(rowButtonByText(wrapper, '详情')).toBeNull() // 不得使用“详情”
    await rowButtonByText(wrapper, '查看')!.trigger('click')
    await flushPromises()
    expect(bodyText()).toContain('订阅详情')
    expect(mockedDetail).toHaveBeenCalledWith('id1')
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
