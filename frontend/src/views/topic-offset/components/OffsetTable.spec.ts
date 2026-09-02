import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import OffsetTable from './OffsetTable.vue'
import type { TopicOffsetItem } from '@/types/topicOffset'

function parseableRow(overrides: Partial<TopicOffsetItem> = {}): TopicOffsetItem {
  return {
    serverId: 'SVR-A',
    rawTopic: 'cliA.srcA.scm.tblX.tgtA',
    nextOffset: '9007199254740993',
    updatedAt: '2026-09-02 10:11:12',
    kafkaEndOffset: null,
    pendingCount: null,
    consumeLag: null,
    parseable: true,
    parsed: { clientId: 'cliA', sourceId: 'srcA', schema: 'scm', table: 'tblX', targetId: 'tgtA' },
    mapping: {
      client: { state: 'ACTIVE', id: 'cliA', org: null, desc: '客户端A' },
      source: { state: 'ACTIVE', id: 'srcA', org: '源库A', desc: null },
      target: { state: 'ACTIVE', id: 'tgtA', org: '目标库A', desc: null },
    },
    ...overrides,
  }
}

function unparseableRow(overrides: Partial<TopicOffsetItem> = {}): TopicOffsetItem {
  return {
    serverId: 'SVR-B',
    rawTopic: 'weird.topic.only.two',
    nextOffset: '5',
    updatedAt: null,
    kafkaEndOffset: null,
    pendingCount: null,
    consumeLag: null,
    parseable: false,
    parsed: null,
    mapping: null,
    ...overrides,
  }
}

async function mountTable(records: TopicOffsetItem[], startIndex = 1) {
  const wrapper = mount(OffsetTable, {
    props: {
      records,
      loading: false,
      startIndex,
    },
    global: { plugins: [ElementPlus] },
  })
  await flushPromises()
  return wrapper
}

describe('OffsetTable 固定 8 列（TOFF-REQ-081/094/095）', () => {
  it('渲染全部 8 列头', async () => {
    const wrapper = await mountTable([parseableRow()])
    const headers = wrapper.findAll('.el-table__header th').map((th) => th.text().trim())
    for (const label of [
      '序号',
      '同步对象',
      '已保存消费位置',
      'Kafka 末端位置',
      '待消费数量',
      '消费延迟',
      '断点更新时间',
      '中心端',
    ]) {
      expect(headers).toContain(label)
    }
    wrapper.unmount()
  })

  it('序号跨页连续（第 2 页从 151 起，TOFF-REQ-082）', async () => {
    const wrapper = await mountTable([parseableRow(), unparseableRow()], 151)
    const firstRowText = wrapper.find('.el-table__body tr').text()
    expect(firstRowText).toContain('151')
    wrapper.unmount()
  })

  it('可解析行：两行同步对象（第一行客户端/源库/目标库 + 第二行 Schema.表名），Kafka 三列显示 —', async () => {
    const wrapper = await mountTable([parseableRow()])
    const text = wrapper.text()
    expect(text).toContain('cliA')
    expect(text).toContain('源库A')
    expect(text).toContain('目标库A')
    expect(text).toContain('scm.tblX')
    // Offset 字符串透传、不做数值改写
    expect(text).toContain('9007199254740993')
    // Kafka 三列 null → “—”，绝不转 0 或字符串 "null"（TOFF-REQ-066）
    expect(text).not.toContain('"null"')
    expect(text.split('—').length - 1).toBeGreaterThanOrEqual(3)
    wrapper.unmount()
  })

  it('无法解析行：同步对象第一行显示“Topic 格式无法解析”，Offset/时间/中心端照常展示（TOFF-REQ-017/016）', async () => {
    const wrapper = await mountTable([unparseableRow()])
    const text = wrapper.text()
    expect(text).toContain('Topic 格式无法解析')
    expect(text).toContain('5')
    expect(text).toContain('SVR-B')
    expect(text).toContain('—')
    wrapper.unmount()
  })

  it('配置存在但停用：名称/ID 后带“已停用”标记（TOFF-REQ-057）', async () => {
    const wrapper = await mountTable([
      parseableRow({
        mapping: {
          client: { state: 'INACTIVE', id: 'cliA', org: null, desc: '客户端A' },
          source: { state: 'INACTIVE', id: 'srcA', org: '源库A', desc: null },
          target: { state: 'ACTIVE', id: 'tgtA', org: '目标库A', desc: null },
        },
      }),
    ])
    const text = wrapper.text()
    expect(text).toContain('已停用')
    wrapper.unmount()
  })

  it('配置不存在：显示原始 ID +“配置不存在”标记（TOFF-REQ-058）', async () => {
    const wrapper = await mountTable([
      parseableRow({
        mapping: {
          client: { state: 'ACTIVE', id: 'cliA', org: null, desc: '客户端A' },
          source: { state: 'NOT_FOUND', id: 'missing_src', org: null, desc: null },
          target: { state: 'ACTIVE', id: 'tgtA', org: '目标库A', desc: null },
        },
      }),
    ])
    const text = wrapper.text()
    expect(text).toContain('missing_src')
    expect(text).toContain('配置不存在')
    wrapper.unmount()
  })

  it('空结果显示空态文案“暂无符合条件的数据”（TOFF-REQ-116）', async () => {
    const wrapper = await mountTable([])
    expect(wrapper.text()).toContain('暂无符合条件的数据')
    wrapper.unmount()
  })
})

describe('OffsetTable 稳定行唯一键多行渲染（TOPIC-OFFSET-R1 §4.1）', () => {
  it('不同 serverId 相同 Topic、相同 serverId 不同 Topic 各行均渲染，行 key 无 undefined/重复丢行', async () => {
    const rows = [
      parseableRow({ serverId: 'SVR-A' }), // topic cliA.srcA.scm.tblX.tgtA
      parseableRow({ serverId: 'SVR-B' }), // 同 topic、不同 serverId
      parseableRow({ serverId: 'SVR-A', rawTopic: 'cliA.srcA.scm.tblY.tgtA' }), // 同 serverId、不同 topic
    ]
    const wrapper = await mountTable(rows)
    const text = wrapper.text()
    // 3 行全部渲染且无丢行：中心端列应同时含 SVR-A 与 SVR-B（不同行键未互相覆盖）
    expect(text).toContain('SVR-A')
    expect(text).toContain('SVR-B')
    expect(wrapper.findAll('.el-table__body tr')).toHaveLength(3)
    wrapper.unmount()
  })
})

describe('OffsetTable loading 只表达大态，轻量刷新不遮罩表格（TOPIC-OFFSET-R1 §4.2）', () => {
  it('loading=true 时表格出现整表 loading 遮罩', async () => {
    const wrapper = mount(OffsetTable, {
      props: { records: [parseableRow()], loading: true, startIndex: 1 },
      global: { plugins: [ElementPlus] },
    })
    await flushPromises()
    expect(wrapper.find('.el-loading-mask').exists()).toBe(true)
    wrapper.unmount()
  })

  it('loading=false（轻量刷新期）表格不出现 loading 遮罩，旧 records 照常渲染', async () => {
    const wrapper = mount(OffsetTable, {
      props: { records: [parseableRow()], loading: false, startIndex: 1 },
      global: { plugins: [ElementPlus] },
    })
    await flushPromises()
    expect(wrapper.find('.el-loading-mask').exists()).toBe(false)
    // 刷新期间不清表：旧数据仍在渲染
    expect(wrapper.text()).toContain('cliA')
    expect(wrapper.text()).toContain('9007199254740993')
    wrapper.unmount()
  })
})
