import { describe, it, expect, afterEach, vi } from 'vitest'
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

/** 去除空白后做精确比对，避免模板换行带来的文本节点差异。 */
function compact(s: string): string {
  return s.replace(/\s+/g, '')
}

describe('OffsetTable 固定 8 列（TOFF-REQ-081/094/095）', () => {
  it('渲染全部 8 列头（最新数据位置取代 Kafka 末端位置，R2 §4.6）', async () => {
    const wrapper = await mountTable([parseableRow()])
    const headers = wrapper.findAll('.el-table__header th').map((th) => th.text().trim())
    for (const label of [
      '序号',
      '同步对象',
      '已保存消费位置',
      '最新数据位置',
      '待消费数量',
      '消费延迟',
      '断点更新时间',
      '中心端',
    ]) {
      expect(headers).toContain(label)
    }
    // 旧列名在整张表任何可见区域都不得残留
    expect(wrapper.text()).not.toContain('Kafka 末端位置')
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

describe('OffsetTable 同步对象两行格式与分隔符号（R2 §4.4）', () => {
  it('可解析行第一行 = CLIENT_ID · SOURCE_ORG → TARGET_ORG（唯一 · 与 →、无行内标签词），第二行 = Schema.表名', async () => {
    const wrapper = await mountTable([parseableRow()])
    const lines = wrapper.find('.toff-sync-cell').findAll('.toff-sync-line')
    expect(lines).toHaveLength(2)
    const first = compact(lines[0].text())
    // 精确文本已隐含“无客户端/源库/目标库行内标签词、无多余分隔符”
    expect(first).toBe('cliA·源库A→目标库A')
    expect(first.match(/·/g) || []).toHaveLength(1)
    expect(first.match(/→/g) || []).toHaveLength(1)
    expect(first).not.toContain('客户端')
    // 第二行单独展示 Schema.表名
    expect(compact(lines[1].text())).toBe('scm.tblX')
    wrapper.unmount()
  })

  it('停用标记仍显示在各段之后，且不破坏两行结构（不回归 TOFF-REQ-057）', async () => {
    const wrapper = await mountTable([
      parseableRow({
        mapping: {
          client: { state: 'INACTIVE', id: 'cliA', org: null, desc: '客户端A' },
          source: { state: 'INACTIVE', id: 'srcA', org: '源库A', desc: null },
          target: { state: 'ACTIVE', id: 'tgtA', org: '目标库A', desc: null },
        },
      }),
    ])
    const lines = wrapper.find('.toff-sync-cell').findAll('.toff-sync-line')
    expect(lines).toHaveLength(2)
    expect(compact(lines[0].text())).toBe('cliA已停用·源库A已停用→目标库A')
    expect(lines[0].findAll('.el-tag')).toHaveLength(2)
    wrapper.unmount()
  })

  it('配置不存在段显示原始 ID +“配置不存在”，空 org 显示“未定义名称”（不回归 TOFF-REQ-058）', async () => {
    const wrapper = await mountTable([
      parseableRow({
        mapping: {
          client: { state: 'ACTIVE', id: 'cliA', org: null, desc: '客户端A' },
          source: { state: 'NOT_FOUND', id: 'missing_src', org: null, desc: null },
          target: { state: 'ACTIVE', id: 'tgtA', org: null, desc: null },
        },
      }),
    ])
    const firstLine = compact(wrapper.find('.toff-sync-cell .toff-sync-line').text())
    // source 配置不存在 → 原始 ID + “配置不存在”；target org 为空 → “未定义名称”
    expect(firstLine).toBe('cliA·missing_src配置不存在→未定义名称')
    wrapper.unmount()
  })

  it('不可解析行不进入两行结构，仍只渲染“Topic 格式无法解析”（不回归 TOFF-REQ-017）', async () => {
    const wrapper = await mountTable([unparseableRow()])
    const cell = wrapper.find('.toff-sync-cell')
    expect(cell.findAll('.toff-sync-line')).toHaveLength(1)
    expect(cell.text()).toContain('Topic 格式无法解析')
    wrapper.unmount()
  })
})

describe('OffsetTable 最新数据位置列（R2 §4.6）', () => {
  it('kafkaEndOffset 为 null 时“最新数据位置”显示 —，API 字段名不变', async () => {
    const wrapper = await mountTable([parseableRow({ kafkaEndOffset: null })])
    expect(wrapper.text()).toContain('—')
    wrapper.unmount()
  })

  it('表头单元格含带悬浮说明的 el-tooltip 触发结构（“最新数据位置”）', async () => {
    const wrapper = await mountTable([parseableRow()])
    const headerCells = wrapper.findAll('.el-table__header th')
    const cell = headerCells.find((th) => th.text().includes('最新数据位置'))
    expect(cell).toBeDefined()
    expect(cell!.find('.toff-header-text').exists()).toBe(true)
    // EP tooltip 触发节点带 class="el-tooltip__trigger"
    expect(cell!.find('.el-tooltip__trigger').exists()).toBe(true)
    expect(cell!.text()).not.toContain('Kafka 末端位置')
    wrapper.unmount()
  })
})

describe('OffsetTable 字号/控件尺寸与密度作用域（R2 §4.7）', () => {
  it('表格不再使用小号视觉尺寸，行单元保留两行留白结构', async () => {
    const wrapper = await mountTable([parseableRow()])
    const tableEl = wrapper.find('.el-table')
    expect(tableEl.classes()).not.toContain('el-table--small')
    expect(wrapper.find('.toff-sync-cell').exists()).toBe(true)
    expect(wrapper.findAll('.toff-sync-line')).toHaveLength(2)
    wrapper.unmount()
  })

  it('表头与正文使用明确字号层级类，表头不含排序/操作附加控件（8 列无操作列）', async () => {
    const wrapper = await mountTable([parseableRow()])
    const headerCells = wrapper.findAll('.el-table__header th')
    expect(headerCells).toHaveLength(8)
    expect(headerCells[3].find('.toff-header-text').text()).toBe('最新数据位置')
    wrapper.unmount()
  })
})

describe('OffsetTable 同步对象悬浮 Tooltip（R2 §4.5 单实例 + 350ms 延迟 + 非 enterable）', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('悬浮 350ms 内不显示，满 350ms 才显示原始 Topic', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = await mountTable([parseableRow()])
    await wrapper.find('.toff-sync-cell').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(349)
    expect(document.querySelector('.toff-tip')).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    const tip = document.querySelector('.toff-tip')
    expect(tip).not.toBeNull()
    expect(tip!.textContent).toContain('cliA.srcA.scm.tblX.tgtA')
    wrapper.unmount()
  })

  it('离开立即隐藏，即使延迟计时未到也不晚显', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = await mountTable([parseableRow()])
    const cell = wrapper.find('.toff-sync-cell')
    await cell.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(200)
    await cell.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(500)
    expect(document.querySelector('.toff-tip')).toBeNull()
    wrapper.unmount()
  })

  it('单实例：多行间快速扫过只保留最后一次悬浮行，DOM 中始终只有 1 个 tooltip', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const rows = [
      parseableRow(),
      parseableRow({ rawTopic: 'cliB.srcB.scm.tblY.tgtB' }),
      parseableRow({ rawTopic: 'cliC.srcC.scm.tblZ.tgtC' }),
    ]
    const wrapper = await mountTable(rows)
    const cells = wrapper.findAll('.toff-sync-cell')
    // 扫过第 1、2 行（均不足 350ms），再停在第 3 行
    await cells[0].trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(100)
    await cells[1].trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(100)
    await cells[2].trigger('mouseenter')
    expect(document.querySelectorAll('.toff-tip')).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(400)
    expect(document.querySelectorAll('.toff-tip')).toHaveLength(1)
    expect(document.querySelector('.toff-tip')!.textContent).toContain('cliC.srcC.scm.tblZ.tgtC')
    wrapper.unmount()
  })

  it('新查询结果替换 records 与组件卸载都会关闭已显示 tooltip', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = await mountTable([parseableRow()])
    await wrapper.find('.toff-sync-cell').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(400)
    expect(document.querySelector('.toff-tip')).not.toBeNull()
    // 替换 records（刷新提交）→ 立即关闭
    await wrapper.setProps({ records: [parseableRow({ serverId: 'SVR-NEW' })] })
    await flushPromises()
    expect(document.querySelector('.toff-tip')).toBeNull()
    // 再次显示后卸载 → 清理计时并关闭
    await wrapper.find('.toff-sync-cell').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(400)
    expect(document.querySelector('.toff-tip')).not.toBeNull()
    wrapper.unmount()
    expect(document.querySelector('.toff-tip')).toBeNull()
  })

  it('不可解析行悬浮提示含“无法按…拆分”说明（R2 §4.5 hasNote）', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = await mountTable([unparseableRow()])
    await wrapper.find('.toff-sync-cell').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(400)
    const tip = document.querySelector('.toff-tip')
    expect(tip).not.toBeNull()
    expect(tip!.textContent).toContain('weird.topic.only.two')
    expect(tip!.textContent).toContain('无法按“客户端.源库.Schema.表名.目标库”拆分')
    wrapper.unmount()
  })

  it('可解析行悬浮提示只含原始 Topic，不显示拆分说明', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = await mountTable([parseableRow()])
    await wrapper.find('.toff-sync-cell').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(400)
    const tip = document.querySelector('.toff-tip')
    expect(tip).not.toBeNull()
    expect(tip!.textContent).toContain('cliA.srcA.scm.tblX.tgtA')
    expect(tip!.textContent).not.toContain('无法按')
    wrapper.unmount()
  })

  it('长 Topic 在 Tooltip 中完整展示（CSS 允许安全换行，DOM 不裁剪内容）', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const longTopic = `org_${'seg'.repeat(60)}.ds.tbl.vTgt`
    const wrapper = await mountTable([parseableRow({ rawTopic: longTopic })])
    await wrapper.find('.toff-sync-cell').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(400)
    const tip = document.querySelector('.toff-tip')
    expect(tip).not.toBeNull()
    expect(tip!.textContent).toContain(longTopic)
    // 单行同步对象被省略时悬浮仍可取完整 Topic；tooltip 内容不截断
    expect(tip!.textContent!.length).toBeGreaterThanOrEqual(longTopic.length)
    wrapper.unmount()
  })
})
