import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { nextTick } from 'vue'
import ElementPlus from 'element-plus'
import DataSourceSnapshotTable from './DataSourceSnapshotTable.vue'
import { SNAPSHOT_TOOLTIP_DELAY_MS } from '../tooltip/useSnapshotTooltip'
import type { SnapshotStatusItem, StatusToken } from '@/types/dataSourceSnapshot'

/**
 * 测试环境限制说明：vitest 使用 jsdom 且未注入 scoped css，无法计算真实像素宽度、单行省略与换行，
 * 这些以（a）源码宽度字面量契约测试 +（b）结构与类断言表达，真实像素与省略/边缘避让由浏览器开发
 * 验证测量并归档。Tooltip 延迟用假定时器驱动；Host 经 Teleport 到 body，故经 document 查询断言。
 */

type RefState = 'ACTIVE' | 'INACTIVE' | 'NOT_FOUND'

function item(overrides: Partial<SnapshotStatusItem> = {}): SnapshotStatusItem {
  return {
    clientId: 'hosp-012',
    clientRef: { state: 'ACTIVE' as RefState, desc: 'HIS 探针示例' },
    sourceId: '112-source',
    sourceRef: { state: 'ACTIVE' as RefState, org: '示例医院源库', category: 'SOURCE', sourceRole: true },
    snapshotStatus: 'SNAPSHOT_RUNNING',
    statusCategory: 'RUNNING' as StatusToken,
    snapshotLastSeenAt: '2026-08-17 17:28:46',
    snapshotCompletedAt: null,
    updatedAt: '2026-08-17 17:28:46',
    ...overrides,
  }
}

const mounts: VueWrapper[] = []

async function mountTable(records: SnapshotStatusItem[], loading = false) {
  const wrapper = mount(DataSourceSnapshotTable, {
    props: { records, loading },
    global: { plugins: [ElementPlus] },
  })
  mounts.push(wrapper)
  await flushPromises()
  return wrapper
}

afterEach(() => {
  for (const w of mounts.splice(0)) {
    if (w.exists()) w.unmount()
  }
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.clearAllMocks()
})

function hostInBody(): HTMLElement | null {
  return document.querySelector('.dss-single-tooltip[data-tt-host="1"]')
}

function hostCountInBody(): number {
  return document.querySelectorAll('.dss-single-tooltip[data-tt-host="1"]').length
}

const tick = (): Promise<void> => nextTick()

/** Host 渲染/移除依赖 watch(post-flush) + Teleport 补丁：稳定冲刷多次 nextTick。 */
async function ticks(count = 2): Promise<void> {
  for (let i = 0; i < count; i++) await tick()
}

async function reveal(trigger: DOMWrapper<Element>): Promise<void> {
  await trigger.trigger('mouseenter')
  await vi.advanceTimersByTimeAsync(SNAPSHOT_TOOLTIP_DELAY_MS)
  await ticks()
}

function triggerByKind(wrapper: VueWrapper, prefix: string): DOMWrapper<Element> {
  const found = wrapper.find(`[data-tt-kind^="${prefix}"]`)
  if (!found.exists()) throw new Error(`未找到 data-tt-kind^="${prefix}" 触发器`)
  return found
}

describe('DataSourceSnapshotTable 固定 7 列顺序与宽度契约（UI §4/§13.2，DSS-REQ-069，AC-073）', () => {
  it('按序渲染 序号/探针端/源库/快照状态/快照启动时间/快照完成时间/记录更新时间', async () => {
    const wrapper = await mountTable([item()])
    const headers = wrapper.findAll('.el-table__header th').map((th) => th.text().trim())
    expect(headers).toEqual([
      '序号',
      '探针端',
      '源库',
      '快照状态',
      '快照启动时间',
      '快照完成时间',
      '记录更新时间',
    ])
    wrapper.unmount()
  })

  it('宽度字面量契约 = 70/170/280/130/165/165/165（源码按列序唯一来源）', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotTable.vue'), 'utf8')
    const widths = [...src.matchAll(/width="(\d+)"/g)].map((m) => m[1]).slice(0, 7)
    expect(widths).toEqual(['70', '170', '280', '130', '165', '165', '165'])
  })

  it('表格根采用固定总宽类 .dss-table，外层容器承载横向滚动（宽不足滚动、不换行压时间）', async () => {
    const wrapper = await mountTable([item()])
    expect(wrapper.element.classList.contains('dss-table-wrap')).toBe(true)
    expect(wrapper.find('.dss-table').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotTable 探针端/源库展示规则（DSS-REQ-069⑤⑥，AC-074/075）', () => {
  it('探针端只显示 CLIENT_ID，不内联/次行展示 CLIENT_DESC', async () => {
    const wrapper = await mountTable([item()])
    expect(wrapper.text()).toContain('hosp-012')
    expect(wrapper.text()).not.toContain('HIS 探针示例')
    expect(wrapper.find('.dss-cell-sub').exists()).toBe(false)
    wrapper.unmount()
  })

  it('源库正常行只显示 ORG，不显示 DATA_SOURCE_ID', async () => {
    const wrapper = await mountTable([item()])
    expect(wrapper.text()).toContain('示例医院源库')
    expect(wrapper.text()).not.toContain('112-source')
    wrapper.unmount()
  })

  it('源库配置缺失(NOT_FOUND)或 ORG 为 null/空串时回退显示原始 DATA_SOURCE_ID（不空白）', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'NF', sourceRef: { state: 'NOT_FOUND' as RefState, org: null, category: null, sourceRole: false } }),
      item({ clientId: 'ORGN', sourceRef: { state: 'ACTIVE' as RefState, org: '', category: 'SOURCE', sourceRole: true } }),
      item({ clientId: 'ORGN2', sourceRef: { state: 'ACTIVE' as RefState, org: null, category: 'SOURCE', sourceRole: true } }),
    ])
    // 每行含两个 .dss-cell：[0]=探针端、[1]=源库；源库单元格主文本回退为原始 DATA_SOURCE_ID
    const sourceTexts = wrapper.findAll('.el-table__body .el-table__row').map((row) => row.findAll('.dss-cell')[1].text())
    expect(sourceTexts).toEqual(['112-source', '112-source', '112-source'])
    wrapper.unmount()
  })

  it('长文本单行省略结构：主文本为单 span(.dss-cell-main)，无原生 title（浏览器验证省略像素）', async () => {
    const wrapper = await mountTable([item()])
    const mains = wrapper.findAll('.dss-cell-main')
    expect(mains.length).toBeGreaterThan(0)
    // 单元格内主文本与提示图标为 flex 并列，主文本未换成独立行块（无 br/块级子 div）
    const cell = wrapper.find('.dss-cell')
    expect(cell.find('br').exists()).toBe(false)
    // 全程无原生 title
    expect(wrapper.findAll('[title]')).toHaveLength(0)
    expect(document.querySelector('[title]')).toBeNull()
    wrapper.unmount()
  })

  it('探针端缺失提示“探针端配置缺失”；停用提示“配置已停用”；源库缺失/类别非 SOURCE 提示保留', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'NF', clientRef: { state: 'NOT_FOUND' as RefState, desc: null } }),
      item({ clientId: 'IN', clientRef: { state: 'INACTIVE' as RefState, desc: null } }),
      item({ sourceId: 'missing', sourceRef: { state: 'NOT_FOUND' as RefState, org: null, category: null, sourceRole: false } }),
      item({
        clientId: 'DS2',
        sourceId: 'ds-2',
        sourceRef: { state: 'ACTIVE' as RefState, org: null, category: 'OTHER', sourceRole: false },
      }),
    ])
    expect(wrapper.find('.dss-hint-icon[aria-label="探针端配置缺失"]').exists()).toBe(true)
    expect(wrapper.find('.dss-hint-icon[aria-label="配置已停用"]').exists()).toBe(true)
    expect(wrapper.find('.dss-hint-icon[aria-label="源库配置缺失"]').exists()).toBe(true)
    expect(wrapper.find('.dss-hint-icon[aria-label="类别非 SOURCE"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('配置正常(ACTIVE 且 sourceRole=true)的行不渲染任何提示图标', async () => {
    const wrapper = await mountTable([item()])
    expect(wrapper.findAll('.dss-hint-icon')).toHaveLength(0)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotTable 时间空值与状态标签（DSS-REQ-031/032/033，AC-029/030）', () => {
  it('null 时间渲染 -- 并带弱化类，不出现 "null" 字符串', async () => {
    const wrapper = await mountTable([item()])
    const text = wrapper.text()
    expect(text).not.toContain('null')
    expect(wrapper.findAll('.dss-time-dash')).toHaveLength(1)
    expect(wrapper.findAll('.dss-time').map((el) => el.text())).toEqual([
      '2026-08-17 17:28:46',
      '--',
      '2026-08-17 17:28:46',
    ])
    wrapper.unmount()
  })

  it('快照状态归一标签：RUNNING→快照进行中、COMPLETED→快照已完成、UNKNOWN→未知状态', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'A', snapshotStatus: 'SNAPSHOT_RUNNING', statusCategory: 'RUNNING' as StatusToken }),
      item({ clientId: 'B', snapshotStatus: 'SNAPSHOT_COMPLETED', statusCategory: 'COMPLETED' as StatusToken }),
      item({ clientId: 'C', snapshotStatus: 'WEIRD_VALUE', statusCategory: 'UNKNOWN' as StatusToken }),
    ])
    const text = wrapper.text()
    expect(text).toContain('快照进行中')
    expect(text).toContain('快照已完成')
    expect(text).toContain('未知状态')
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotTable loading 整表遮罩（DSS-REQ-071①）', () => {
  it('loading=true 出现整表 loading 遮罩', async () => {
    const wrapper = await mountTable([item()], true)
    expect(wrapper.find('.el-loading-mask').exists()).toBe(true)
    wrapper.unmount()
  })

  it('loading=false 不遮罩表格，记录照常渲染（轻量刷新/查询不遮罩）', async () => {
    const wrapper = await mountTable([item()])
    expect(wrapper.find('.el-loading-mask').exists()).toBe(false)
    expect(wrapper.text()).toContain('hosp-012')
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotTable 页面级单实例 Tooltip 集成（DSS-REQ-070，AC-076/077）', () => {
  it('所有提示类型都进入同一 Host；reveal 后 body 中 Host 恒为 1', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'NF', clientRef: { state: 'NOT_FOUND' as RefState, desc: '缺失端完整描述' } }),
    ])
    vi.useFakeTimers()

    // 探针端完整 CLIENT_DESC
    await reveal(triggerByKind(wrapper, 'client-desc-'))
    expect(hostCountInBody()).toBe(1)
    expect(hostInBody()!.textContent).toBe('缺失端完整描述')

    // 源库完整 ORG（正常行不显示 ID）
    await reveal(triggerByKind(wrapper, 'source-main-'))
    expect(hostCountInBody()).toBe(1)
    expect(hostInBody()!.textContent).toBe('示例医院源库')
    expect(hostInBody()!.textContent).not.toContain('112-source')

    // 未知/原始状态值
    await reveal(triggerByKind(wrapper, 'status-'))
    expect(hostCountInBody()).toBe(1)
    expect(hostInBody()!.textContent).toBe('原始状态：SNAPSHOT_RUNNING')

    // 缺失提示图标
    await reveal(triggerByKind(wrapper, 'client-hint-'))
    expect(hostCountInBody()).toBe(1)
    expect(hostInBody()!.textContent).toBe('探针端配置缺失')
    wrapper.unmount()
  })

  it('源库回退行 Tooltip 展示完整原始 ID 与异常说明', async () => {
    const wrapper = await mountTable([
      item({ sourceRef: { state: 'NOT_FOUND' as RefState, org: null, category: null, sourceRole: false } }),
    ])
    vi.useFakeTimers()
    await reveal(triggerByKind(wrapper, 'source-main-'))
    expect(hostInBody()!.textContent).toContain('112-source')
    expect(hostInBody()!.textContent).toContain('源库配置缺失')
    wrapper.unmount()
  })

  it('描述为空不弹空 Tooltip（host 不出现）', async () => {
    const wrapper = await mountTable([
      item({ clientRef: { state: 'ACTIVE' as RefState, desc: null } }),
    ])
    vi.useFakeTimers()
    await triggerByKind(wrapper, 'client-desc-').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(SNAPSHOT_TOOLTIP_DELAY_MS)
    await ticks()
    expect(hostCountInBody()).toBe(0)
    wrapper.unmount()
  })

  it('快速横向扫过多个触发点：同一 Host 仅承载最后一个，数量恒 1（先关旧项再延迟显示）', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'NF', clientRef: { state: 'NOT_FOUND' as RefState, desc: '端描述' } }),
      item({ clientId: 'B', snapshotStatus: 'SNAPSHOT_COMPLETED', statusCategory: 'COMPLETED' as StatusToken }),
    ])
    vi.useFakeTimers()
    await reveal(triggerByKind(wrapper, 'status-'))
    expect(hostCountInBody()).toBe(1)

    // 展示中直接切新 key（扫到下一单元格）：旧项先即时关闭（Host 消失），随后只显示新项
    await triggerByKind(wrapper, 'client-desc-').trigger('mouseenter')
    await ticks()
    expect(hostCountInBody()).toBe(0)
    await vi.advanceTimersByTimeAsync(SNAPSHOT_TOOLTIP_DELAY_MS)
    await ticks()
    await ticks()
    expect(hostCountInBody()).toBe(1)
    expect(hostInBody()!.textContent).toBe('端描述')
    wrapper.unmount()
  })

  it('records 替换关闭 Tooltip（数据刷新不残留旧悬浮）', async () => {
    const wrapper = await mountTable([item()])
    vi.useFakeTimers()
    await reveal(triggerByKind(wrapper, 'status-'))
    expect(hostCountInBody()).toBe(1)
    await wrapper.setProps({ records: [item({ clientId: 'NEW' })] })
    await ticks()
    expect(hostCountInBody()).toBe(0)
    wrapper.unmount()
  })

  it('window scroll/resize 与页面隐藏均关闭 Tooltip 并清除延迟', async () => {
    const wrapper = await mountTable([item()])
    vi.useFakeTimers()

    await reveal(triggerByKind(wrapper, 'status-'))
    expect(hostCountInBody()).toBe(1)
    window.dispatchEvent(new Event('scroll'))
    await ticks()
    expect(hostCountInBody()).toBe(0)

    await reveal(triggerByKind(wrapper, 'status-'))
    window.dispatchEvent(new Event('resize'))
    await ticks()
    expect(hostCountInBody()).toBe(0)

    await reveal(triggerByKind(wrapper, 'status-'))
    document.dispatchEvent(new Event('visibilitychange'))
    await ticks()
    expect(hostCountInBody()).toBe(0)

    // 延迟窗内事件也取消延迟：不再 reveal
    await triggerByKind(wrapper, 'status-').trigger('mouseenter')
    window.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(SNAPSHOT_TOOLTIP_DELAY_MS)
    await ticks()
    expect(hostCountInBody()).toBe(0)
    wrapper.unmount()
  })

  it('卸载后 Host 移除且无残留延迟状态', async () => {
    const wrapper = await mountTable([item()])
    vi.useFakeTimers()
    await reveal(triggerByKind(wrapper, 'status-'))
    expect(hostCountInBody()).toBe(1)
    wrapper.unmount()
    await ticks()
    expect(hostCountInBody()).toBe(0)
  })

  it('状态标签本身不创建独立 Tooltip：无独立 popper，原始值经同一 Host', async () => {
    const wrapper = await mountTable([item({ snapshotStatus: 'SNAPSHOT_RUNNING', statusCategory: 'RUNNING' as StatusToken })])
    expect(wrapper.findAll('.el-popper')).toHaveLength(0)
    vi.useFakeTimers()
    await reveal(triggerByKind(wrapper, 'status-'))
    expect(hostCountInBody()).toBe(1)
    expect(hostInBody()!.textContent).toBe('原始状态：SNAPSHOT_RUNNING')
    wrapper.unmount()
  })
})
