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
 * 本轮（第二轮）按 DESIGN §22.2-22.4 / UI §16.2-16.4：列弹性模型、探针端/源库展示简化、删除黄色
 * 图标、源库列 Tooltip 只显示完整原始 DATA_SOURCE_ID。
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

function rowCells(wrapper: VueWrapper, rowIndex: number): DOMWrapper<Element>[] {
  return wrapper.findAll('.el-table__body .el-table__row')[rowIndex].findAll('.dss-cell')
}

describe('DataSourceSnapshotTable 七列顺序与列弹性宽度契约（UI §16.2，DSS-REQ-072，AC-073）', () => {
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

  it('列宽字面量契约（R5 §2）：固定列 width=70/140（序号/快照状态），弹性列 min-width=170/285/170/170/170（探针端/源库/三时间列），最小总宽 70+170+285+140+170×3=1175', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotTable.vue'), 'utf8')
    const widths = [...src.matchAll(/(?<!min-)width="(\d+)"/g)].map((m) => m[1])
    expect(widths).toEqual(['70', '140'])
    const minWidths = [...src.matchAll(/min-width="(\d+)"/g)].map((m) => m[1])
    expect(minWidths).toEqual(['170', '285', '170', '170', '170'])
    // 最小总宽 = 70+170+285+140+170×3 = 1175
    expect(70 + Number(minWidths[0]) + Number(minWidths[1]) + 140 + 170 * 3).toBe(1175)
    // 源库弹性起点明显高于探针端（源库始终明显更宽）
    expect(Number(minWidths[1])).toBeGreaterThan(Number(minWidths[0]))
  })

  it('行高零改动契约（R2 §7）：单元格垂直 padding 保持 12px 0，无新增 px line-height / min-height 覆盖', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotTable.vue'), 'utf8')
    const css = src.split('<style scoped>')[1] ?? ''
    const tdBlock = css.match(/td\.el-table__cell\)\s*\{[^}]*\}/)?.[0] ?? ''
    expect(tdBlock).toContain('padding: 12px 0')
    expect(css).not.toMatch(/min-height\s*:\s*[0-9]+px/)
    expect(css).not.toMatch(/line-height\s*:\s*[0-9]+px/)
  })

  it('时间列内容区宽契约（R5 §2）：三个时间列（第 5/6/7 列）单元格水平内边距 12→8px，仅水平、垂直 padding 与行高不变', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotTable.vue'), 'utf8')
    const css = src.split('<style scoped>')[1] ?? ''
    // 规则精确限定到时间列（nth-child(n + 5)），不波及其它列的水平内边距
    const rule = css.match(/\.dss-table :deep\([^)]*nth-child\(n \+ 5\) \.cell\)[\s\S]*?\{[^}]*\}/)?.[0] ?? ''
    expect(rule).not.toBe('')
    expect(rule).toMatch(/padding-left:\s*8px/)
    expect(rule).toMatch(/padding-right:\s*8px/)
    // 只收紧水平内边距，不引入垂直 padding / 行高改动
    expect(rule).not.toMatch(/padding-top|padding-bottom/)
    expect(rule).not.toMatch(/padding:\s*[^;]*\d+px\s+\d+px/)
    // 表头与 body 单元格同步，保持列内文本与表头对齐
    expect(rule).toMatch(/th\.el-table__cell/)
    expect(rule).toMatch(/td\.el-table__cell/)
    // 既有行高契约（td 垂直 padding 12px 0）不受影响
    expect(css).toMatch(/td\.el-table__cell\)\s*\{[^}]*padding:\s*12px 0/)
  })

  it('时间完整契约（R2 §6）：时间仍经 formatTimeOrDash，单元格主内容完整到秒、无换行结构', async () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotTable.vue'), 'utf8')
    expect(src).toMatch(/formatTimeOrDash/)
    const wrapper = await mountTable([item({ snapshotLastSeenAt: '2026-09-06 11:02:00' })])
    const timeCells = wrapper.findAll('.dss-time')
    expect(timeCells[0].text()).toBe('2026-09-06 11:02:00')
    expect(wrapper.findAll('br')).toHaveLength(0)
    wrapper.unmount()
  })

  it('表格铺满：取消固定 width:1175px，仅保留最小总宽 min-width:1175px 与 width:100%', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotTable.vue'), 'utf8')
    expect(src).not.toMatch(/(?<!min-)width\s*:\s*1175px/)
    expect(src).toMatch(/min-width\s*:\s*1175px/)
    expect(src).toMatch(/(?<!min-)width\s*:\s*100%/)
  })

  it('表格根类 .dss-table + 外层容器承载窄屏横向滚动（不换行压时间列）', async () => {
    const wrapper = await mountTable([item()])
    expect(wrapper.element.classList.contains('dss-table-wrap')).toBe(true)
    expect(wrapper.find('.dss-table').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotTable 探针端/源库展示简化（UI §16.3/§16.4，DSS-REQ-073/074，AC-074/075）', () => {
  it('探针端启用行只显示 CLIENT_ID，不内联/次行展示 CLIENT_DESC', async () => {
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

  it('源库 ORG 空/配置缺失(NOT_FOUND)回退显示原始 DATA_SOURCE_ID（不空白）', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'NF', sourceRef: { state: 'NOT_FOUND' as RefState, org: null, category: null, sourceRole: false } }),
      item({ clientId: 'ORGN', sourceRef: { state: 'ACTIVE' as RefState, org: '', category: 'SOURCE', sourceRole: true } }),
      item({ clientId: 'ORGN2', sourceRef: { state: 'ACTIVE' as RefState, org: null, category: 'SOURCE', sourceRole: true } }),
    ])
    const sourceTexts = wrapper.findAll('.el-table__body .el-table__row').map((row) => row.findAll('.dss-cell')[1].text())
    expect(sourceTexts).toEqual(['112-source', '112-source', '112-source'])
    wrapper.unmount()
  })

  it('长文本单行省略结构：主文本为单 span(.dss-cell-main)，无原生 title（浏览器验证省略像素）', async () => {
    const wrapper = await mountTable([item()])
    const mains = wrapper.findAll('.dss-cell-main')
    expect(mains.length).toBeGreaterThan(0)
    const cell = wrapper.find('.dss-cell')
    expect(cell.find('br').exists()).toBe(false)
    expect(wrapper.findAll('[title]')).toHaveLength(0)
    expect(document.querySelector('[title]')).toBeNull()
    wrapper.unmount()
  })

  it('探针端非启用(INACTIVE)追加单个浅红微型"停用"Badge（R3 §9.2），与 CLIENT_ID 同格并列', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'IN', clientRef: { state: 'INACTIVE' as RefState, desc: null } }),
    ])
    const marks = wrapper.findAll('.dss-inactive-mark')
    expect(marks).toHaveLength(1)
    expect(marks[0].text()).toBe('停用')
    // Badge 为本地 <span>（非 el-tag / el-badge / 图标 / 可操作标签）；不承载 Tooltip。
    // 注：同一行快照状态格内的 DataSourceSnapshotStatusTag 本身是 el-tag，故只断言 Badge 自身不是 el-tag。
    expect(marks[0].element.tagName).toBe('SPAN')
    expect(marks[0].classes().includes('el-tag')).toBe(false)
    expect(wrapper.findAll('.el-badge')).toHaveLength(0)
    expect(marks[0].classes().some((c) => c === 'el-icon')).toBe(false)
    expect(marks[0].find('[data-tt-kind]').exists()).toBe(false)
    // 与 CLIENT_ID 同单元格并列
    expect(rowCells(wrapper, 0)[0].text()).toContain('IN')
    expect(rowCells(wrapper, 0)[0].text()).toContain('停用')
    wrapper.unmount()
  })

  it('探针端启用/缺失(NOT_FOUND)行不出现红字“停用”，不出现任何黄色异常图标', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'A' }),
      item({ clientId: 'NF', clientRef: { state: 'NOT_FOUND' as RefState, desc: null } }),
    ])
    expect(wrapper.findAll('.dss-inactive-mark')).toHaveLength(0)
    expect(wrapper.findAll('.dss-hint-icon')).toHaveLength(0)
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('NF')
    wrapper.unmount()
  })

  it('源库停用/类别非 SOURCE/配置缺失：保留行按 ORG 或回退 ID 展示，不出现红字“停用”与黄色图标', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'SI', sourceRef: { state: 'INACTIVE' as RefState, org: '停用源库ORG', category: 'SOURCE', sourceRole: true } }),
      item({ clientId: 'SC', sourceRef: { state: 'ACTIVE' as RefState, org: null, category: 'OTHER', sourceRole: false } }),
      item({ clientId: 'SN', sourceRef: { state: 'NOT_FOUND' as RefState, org: null, category: null, sourceRole: false } }),
    ])
    const texts = wrapper.findAll('.el-table__body .el-table__row').map((row) => row.findAll('.dss-cell')[1].text())
    expect(texts).toEqual(['停用源库ORG', '112-source', '112-source'])
    expect(wrapper.findAll('.dss-inactive-mark')).toHaveLength(0)
    expect(wrapper.findAll('.dss-hint-icon')).toHaveLength(0)
    wrapper.unmount()
  })
})

describe('DataSourceSnapshotTable R4 源码契约：探针 ID 字重与停用 Badge 外观（§8/§11.1，jsdom 不计算样式）', () => {
  it('探针 ID 600 字重 / #09090B；ID 等宽字体栈保持（R3 §9.1 不变）', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotTable.vue'), 'utf8')
    const probeBlock = src.match(/\.dss-probe-main\s*\{[^}]*\}/)?.[0] ?? ''
    expect(probeBlock).toMatch(/font-weight:\s*600/)
    expect(probeBlock).toMatch(/color:\s*var\(--dss-text-strong,\s*#09090b\)/)
    // ID 主 span 仍挂等宽字体类（字体栈保持）：dss-mono 类在模板上仍与 dss-probe-main 同现
    expect(src).toMatch(/class="dss-cell-main dss-probe-main dss-tt dss-mono"/)
  })

  it('停用 Badge 外观字面量契约（R4 §8）：浅红底 #fee2e2 / 深红字 #991b1b / 11px / 700 / radius 4 / 高 20px / 高 20 / padding 0 6 / inline-flex / 不可压缩 / UI 无衬线首选字体 / 无边框', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/components/DataSourceSnapshotTable.vue'), 'utf8')
    const css = src.split('<style scoped>')[1] ?? ''
    const badge = css.match(/\.dss-inactive-mark\s*\{[^}]*\}/)?.[0] ?? ''
    expect(badge).toMatch(/background:\s*#fee2e2/)
    expect(badge).toMatch(/color:\s*#991b1b/)
    expect(badge).toMatch(/font-size:\s*11px/)
    expect(badge).toMatch(/font-weight:\s*700/)
    expect(badge).toMatch(/border-radius:\s*4px/)
    expect(badge).toMatch(/height:\s*20px/)
    expect(badge).toMatch(/padding:\s*0 6px/)
    expect(badge).toMatch(/display:\s*inline-flex/)
    expect(badge).toMatch(/flex:\s*0 0 auto/)
    expect(badge).toMatch(/align-items:\s*center/)
    expect(badge).toMatch(/justify-content:\s*center/)
    expect(badge).toMatch(/line-height:\s*1\s*;/)
    expect(badge).toMatch(/letter-spacing:\s*0/)
    expect(badge).not.toMatch(/border\s*:/)
    // UI 无衬线首选字体：以 --el-font-family + 系统无衬线回退为首选，不把等宽字体放首选
    expect(badge).toMatch(/font-family:\s*var\(\s*--el-font-family/)
    expect(badge).not.toMatch(/SF Mono/)
    expect(badge).not.toMatch(/JetBrains Mono/)
    expect(badge).not.toMatch(/monospace/)
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

describe('DataSourceSnapshotTable 页面级单实例 Tooltip 集成（第二轮现行，DSS-REQ-070，AC-076/077）', () => {
  it('各触发类型进入同一 Host；探针端=完整 CLIENT_DESC、源库=完整原始 DATA_SOURCE_ID、状态=原始值；reveal 后 Host 恒为 1', async () => {
    const wrapper = await mountTable([item()])
    vi.useFakeTimers()

    // 探针端完整 CLIENT_DESC
    await reveal(triggerByKind(wrapper, 'client-desc-'))
    expect(hostCountInBody()).toBe(1)
    expect(hostInBody()!.textContent).toBe('HIS 探针示例')

    // 源库列 Tooltip 只显示完整原始 DATA_SOURCE_ID（正常 ORG 行也不显示 ORG）
    await reveal(triggerByKind(wrapper, 'source-main-'))
    expect(hostCountInBody()).toBe(1)
    expect(hostInBody()!.textContent).toBe('112-source')
    expect(hostInBody()!.textContent).not.toContain('示例医院源库')

    // 未知/原始状态值
    await reveal(triggerByKind(wrapper, 'status-'))
    expect(hostCountInBody()).toBe(1)
    expect(hostInBody()!.textContent).toBe('原始状态：SNAPSHOT_RUNNING')
    wrapper.unmount()
  })

  it('源库回退行（NOT_FOUND/ORG 空/INACTIVE/类别非 SOURCE）Tooltip 均为完整原始 DATA_SOURCE_ID，无异常说明', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'NF', sourceRef: { state: 'NOT_FOUND' as RefState, org: null, category: null, sourceRole: false } }),
      item({ clientId: 'SI', sourceRef: { state: 'INACTIVE' as RefState, org: null, category: 'SOURCE', sourceRole: true } }),
      item({ clientId: 'SC', sourceRef: { state: 'ACTIVE' as RefState, org: null, category: 'OTHER', sourceRole: false } }),
    ])
    vi.useFakeTimers()
    const sourceTriggers = wrapper.findAll('[data-tt-kind^="source-main-"]')
    expect(sourceTriggers).toHaveLength(3)
    for (const t of sourceTriggers) {
      await reveal(t)
      expect(hostInBody()!.textContent).toBe('112-source')
      expect(hostInBody()!.textContent).not.toContain('缺失')
      expect(hostInBody()!.textContent).not.toContain('停用')
      expect(hostInBody()!.textContent).not.toContain('类别非')
    }
    wrapper.unmount()
  })

  it('表格中不存在探针端/源库异常提示触发器（无黄色图标触发 Tooltip）', async () => {
    const wrapper = await mountTable([item()])
    expect(wrapper.findAll('[data-tt-kind^="client-hint-"]')).toHaveLength(0)
    expect(wrapper.findAll('[data-tt-kind^="source-hint-"]')).toHaveLength(0)
    wrapper.unmount()
  })

  it('探针端描述为空不弹空 Tooltip（host 不出现）', async () => {
    const wrapper = await mountTable([item({ clientRef: { state: 'ACTIVE' as RefState, desc: null } })])
    vi.useFakeTimers()
    await triggerByKind(wrapper, 'client-desc-').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(SNAPSHOT_TOOLTIP_DELAY_MS)
    await ticks()
    expect(hostCountInBody()).toBe(0)
    wrapper.unmount()
  })

  it('快速横向扫过多个触发点：同一 Host 仅承载最后一个，数量恒 1（先关旧项再延迟显示）', async () => {
    const wrapper = await mountTable([
      item({ clientId: 'A', snapshotStatus: 'SNAPSHOT_RUNNING', statusCategory: 'RUNNING' as StatusToken }),
      item({ clientId: 'B', snapshotStatus: 'SNAPSHOT_COMPLETED', statusCategory: 'COMPLETED' as StatusToken }),
    ])
    vi.useFakeTimers()
    await reveal(triggerByKind(wrapper, 'status-'))
    expect(hostCountInBody()).toBe(1)

    await triggerByKind(wrapper, 'client-desc-').trigger('mouseenter')
    await ticks()
    expect(hostCountInBody()).toBe(0)
    await vi.advanceTimersByTimeAsync(SNAPSHOT_TOOLTIP_DELAY_MS)
    await ticks()
    await ticks()
    expect(hostCountInBody()).toBe(1)
    expect(hostInBody()!.textContent).toBe('HIS 探针示例')
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
