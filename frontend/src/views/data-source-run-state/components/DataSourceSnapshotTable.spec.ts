import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DataSourceSnapshotTable from './DataSourceSnapshotTable.vue'
import type { SnapshotStatusItem, StatusToken } from '@/types/dataSourceSnapshot'

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

async function mountTable(records: SnapshotStatusItem[], loading = false) {
  const wrapper = mount(DataSourceSnapshotTable, {
    props: { records, loading },
    global: { plugins: [ElementPlus] },
  })
  await flushPromises()
  return wrapper
}

describe('DataSourceSnapshotTable 固定 7 列（UI §4，DESIGN §10 表格列）', () => {
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

  it('序号从 1 连续递增', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'A', sourceId: 's1' }),
      item({ clientId: 'B', sourceId: 's2' }),
    ])
    const seq = wrapper.findAll('.el-table__body .dss-seq').map((el) => el.text())
    expect(seq).toEqual(['1', '2'])
    wrapper.unmount()
  })

  it('空结果显示空态文案“暂无数据”（默认 empty-text）', async () => {
    const wrapper = await mountTable([])
    expect(wrapper.text()).toContain('暂无数据')
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotTable 探针端/源库展示与提示图标（DSS-REQ-026/027/028，AC-031~035）', () => {
  it('探针端主文本为 clientId，有描述时次行展示描述', async () => {
    const wrapper = await mountTable([item()])
    const text = wrapper.text()
    expect(text).toContain('hosp-012')
    expect(text).toContain('HIS 探针示例')
    wrapper.unmount()
  })

  it('源库有 org 时展示 org 并悬浮完整 sourceId，无 org 时直接展示 sourceId', async () => {
    const wrapper = await mountTable([item()])
    expect(wrapper.text()).toContain('示例医院源库')
    wrapper.unmount()

    const noOrg = await mountTable([item({ sourceRef: { state: 'ACTIVE' as RefState, org: null, category: 'SOURCE', sourceRole: true } })])
    expect(noOrg.text()).toContain('112-source')
    noOrg.unmount()
  })

  it('探针端配置缺失(NOT_FOUND)提示“探针端配置缺失”；配置停用(INACTIVE)提示“配置已停用”', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'NF', clientRef: { state: 'NOT_FOUND' as RefState, desc: null } }),
      item({ clientId: 'IN', clientRef: { state: 'INACTIVE' as RefState, desc: null } }),
    ])
    expect(wrapper.find('.dss-hint-icon[aria-label="探针端配置缺失"]').exists()).toBe(true)
    expect(wrapper.find('.dss-hint-icon[aria-label="配置已停用"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('源库缺失提示“源库配置缺失”；停用且非 SOURCE 类别额外提示“类别非 SOURCE”', async () => {
    const wrapper = await mountTable([
      item({ sourceId: 'missing', sourceRef: { state: 'NOT_FOUND' as RefState, org: null, category: null, sourceRole: false } }),
      item({
        sourceId: 'ds-2',
        sourceRef: { state: 'INACTIVE' as RefState, org: null, category: 'OTHER', sourceRole: false },
      }),
    ])
    expect(wrapper.find('.dss-hint-icon[aria-label="源库配置缺失"]').exists()).toBe(true)
    expect(wrapper.find('.dss-hint-icon[aria-label="类别非 SOURCE"]').exists()).toBe(true)
    // NOT_FOUND 行不再叠加“类别非 SOURCE”
    wrapper.unmount()
  })

  it('配置正常(ACTIVE 且 sourceRole=true)的行不渲染任何提示图标', async () => {
    const wrapper = await mountTable([item()])
    expect(wrapper.findAll('.dss-hint-icon')).toHaveLength(0)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotTable 时间空值与状态标签（DSS-REQ-029/030/031，AC-028/029/030）', () => {
  it('null 时间渲染 -- 并带弱化类，不出现 "null" 字符串', async () => {
    const wrapper = await mountTable([item()])
    const text = wrapper.text()
    expect(text).not.toContain('null')
    // 快照完成时间为 null → --；启动/更新有值原样透传
    expect(wrapper.findAll('.dss-time-dash')).toHaveLength(1)
    expect(wrapper.findAll('.dss-time').map((el) => el.text())).toEqual([
      '2026-08-17 17:28:46',
      '--',
      '2026-08-17 17:28:46',
    ])
    wrapper.unmount()
  })

  it('快照状态归一标签：RUNNING→快照进行中、COMPLETED→快照已完成、UNKNOWN→未知状态，原始状态悬浮可读', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'A', sourceId: 'a', snapshotStatus: 'SNAPSHOT_RUNNING', statusCategory: 'RUNNING' as StatusToken }),
      item({ clientId: 'B', sourceId: 'b', snapshotStatus: 'SNAPSHOT_COMPLETED', statusCategory: 'COMPLETED' as StatusToken }),
      item({ clientId: 'C', sourceId: 'c', snapshotStatus: 'WEIRD_VALUE', statusCategory: 'UNKNOWN' as StatusToken }),
    ])
    const text = wrapper.text()
    expect(text).toContain('快照进行中')
    expect(text).toContain('快照已完成')
    expect(text).toContain('未知状态')
    expect(wrapper.findAll('.el-tag')).toHaveLength(3)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotTable loading 整表遮罩（UI §7.1）', () => {
  it('loading=true 出现整表 loading 遮罩', async () => {
    const wrapper = await mountTable([item()], true)
    expect(wrapper.find('.el-loading-mask').exists()).toBe(true)
    wrapper.unmount()
  })

  it('loading=false（轻量刷新期）不遮罩表格，旧记录照常渲染', async () => {
    const wrapper = await mountTable([item()])
    expect(wrapper.find('.el-loading-mask').exists()).toBe(false)
    expect(wrapper.text()).toContain('hosp-012')
    wrapper.unmount()
  })
})
