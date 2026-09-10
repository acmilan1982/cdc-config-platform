import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DataSourceRunStatePage from './DataSourceRunStatePage.vue'
import DataSourceSnapshotTable from './components/DataSourceSnapshotTable.vue'
import { REFRESH_FAIL_MESSAGE } from './composables/useDataSourceSnapshot'
import type { ApiResponse } from '@/types/monitor'
import type {
  CandidateGroup,
  SnapshotStatusItem,
  SnapshotStatusListResult,
  StatusToken,
} from '@/types/dataSourceSnapshot'

/**
 * 页面级结构/交互测试（UI §13，DESIGN §20）：真实组装三个功能区块，
 * 断言三块分区、结果头部左右布局、总数与未知计数、错误稳定槽位，以及六类请求中
 * query 不遮罩表格、manual 才点亮立即刷新、点击刷新只新增一次刷新请求等页面级视觉事实。
 * Tooltip 延迟与像素几何由专测与浏览器验证覆盖。
 */

vi.mock('@/api/dataSourceSnapshot', () => ({
  fetchSnapshotStatusList: vi.fn(),
}))

import { fetchSnapshotStatusList } from '@/api/dataSourceSnapshot'

const mockedFetch = vi.mocked(fetchSnapshotStatusList)

type RefState = 'ACTIVE' | 'INACTIVE' | 'NOT_FOUND'

function row(clientId: string, category: StatusToken, raw: string): SnapshotStatusItem {
  return {
    clientId,
    clientRef: { state: 'ACTIVE' as RefState, desc: `${clientId} 探针描述` },
    sourceId: 'src-1',
    sourceRef: { state: 'ACTIVE' as RefState, org: '源库一', category: 'SOURCE', sourceRole: true },
    snapshotStatus: raw,
    statusCategory: category,
    snapshotLastSeenAt: '2026-08-17 17:28:46',
    snapshotCompletedAt: category === 'COMPLETED' ? '2026-08-17 17:30:00' : null,
    updatedAt: '2026-08-17 17:28:46',
  }
}

function cand(): CandidateGroup {
  return {
    clients: [{ id: 'c1', desc: '端1', active: true }],
    sources: [{ id: 'src-1', org: '源库一', active: true }],
    statuses: ['RUNNING', 'COMPLETED'],
  }
}

function okRes(records: SnapshotStatusItem[]): ApiResponse<SnapshotStatusListResult> {
  const data: SnapshotStatusListResult = { records, candidates: cand() }
  return { code: 200, message: 'success', timestamp: '', data }
}

function deferred() {
  let release!: (v: ApiResponse<SnapshotStatusListResult>) => void
  const promise = new Promise<ApiResponse<SnapshotStatusListResult>>((resolve) => {
    release = resolve
  })
  return { promise, release }
}

async function settle(): Promise<void> {
  for (let i = 0; i < 16; i++) await Promise.resolve()
}

/**
 * EP v-loading 关闭走 leave 过渡，jsdom 无真实 transitionend/rAF，需放行真实宏任务
 * 让关闭后清理（否则初始加载的 .el-loading-mask 节点残留，干扰“query/manual 不遮罩表格”DOM 断言）。
 */
async function flushMacro(): Promise<void> {
  for (let i = 0; i < 3; i++) await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

const mounts: VueWrapper[] = []

async function mountPage() {
  const wrapper = mount(DataSourceRunStatePage, { global: { plugins: [ElementPlus] } })
  mounts.push(wrapper)
  await flushPromises()
  await settle()
  await flushMacro()
  return wrapper
}

function findButton(wrapper: VueWrapper, text: string) {
  const btn = wrapper.findAll('button').find((b) => b.text().trim() === text)
  if (!btn) throw new Error(`未找到按钮“${text}”`)
  return btn
}

/**
 * 表格“是否整表遮罩”经 loading 属性断言：jsdom 下 EP v-loading 关闭走 leave 过渡，
 * 无真实 transitionend/rAF 会残留 .el-loading-mask 节点，DOM 存在性不可信；fresh-mount 的
 * loading→mask/无 mask 视觉由 DataSourceSnapshotTable.spec 覆盖。
 */
function tableLoading(wrapper: VueWrapper): boolean {
  const t = wrapper.findComponent(DataSourceSnapshotTable)
  if (!t.exists()) throw new Error('未找到 DataSourceSnapshotTable')
  return t.props('loading') as boolean
}

beforeEach(() => {
  mockedFetch.mockReset()
})

afterEach(() => {
  for (const w of mounts.splice(0)) {
    if (w.exists()) w.unmount()
  }
  vi.clearAllMocks()
})

describe('DataSourceRunStatePage 三块清晰分区（UI §13.1，DSS-REQ-066，AC-069）', () => {
  it('自上而下渲染：页头语义区 + 独立查询卡片 + 独立结果卡片', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()

    // 1. 页头语义区
    const header = wrapper.find('.dss-page-header')
    expect(header.exists()).toBe(true)
    expect(header.find('h2').text()).toBe('源库快照状态')
    expect(header.find('.dss-desc').text()).toContain('只读')

    // 2. 独立查询卡片
    const queryCard = wrapper.find('.dss-query-card')
    expect(queryCard.exists()).toBe(true)
    expect(queryCard.find('.dss-q-label').exists()).toBe(true)
    expect(queryCard.text()).toContain('查询')
    expect(queryCard.text()).toContain('重置')

    // 3. 独立结果卡片（内部头部 + 表格主体，卡片间有上下间距容器）
    const resultCard = wrapper.find('.dss-result-card')
    expect(resultCard.exists()).toBe(true)
    expect(resultCard.find('.el-table').exists()).toBe(true)
    expect(wrapper.find('.dss-page').element.children.length).toBeGreaterThanOrEqual(3)
    wrapper.unmount()
  })

  it('结果头部左=总数/未知计数，右=不可拆散刷新组（同一头部仅两个直接子组）', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()

    const header = wrapper.find('.dss-result-card__header')
    const children = Array.from(header.element.children) as HTMLElement[]
    const groups = children.filter((c) => c.classList.contains('dss-result-summary') || c.classList.contains('dss-refresh-group'))
    expect(groups).toHaveLength(2)
    // 左组仅总数（该数据无未知）；右组为刷新组整体（含“立即刷新”）
    expect(children.find((c) => c.classList.contains('dss-result-summary'))?.textContent).toContain('共 1 条')
    const rg = children.find((c) => c.classList.contains('dss-refresh-group'))
    // R2 §9.1：真实自动刷新剩余秒数文案（首载完成后即同步重置为 60）
    expect(rg?.textContent).toContain('60 秒后自动刷新')
    expect(rg?.textContent).toContain('立即刷新')
    wrapper.unmount()
  })
})

describe('DataSourceRunStatePage 结果头部总数与未知计数（DSS-REQ-067，AC-070）', () => {
  it('显示“共 N 条”；UNKNOWN>0 时显示橙色“其中 N 条未知状态”', async () => {
    mockedFetch.mockResolvedValue(
      okRes([
        row('A', 'RUNNING', 'SNAPSHOT_RUNNING'),
        row('B', 'COMPLETED', 'SNAPSHOT_COMPLETED'),
        row('C', 'UNKNOWN', 'WEIRD_VALUE'),
      ]),
    )
    const wrapper = await mountPage()
    expect(wrapper.find('.dss-summary-count').text()).toBe('共 3 条')
    expect(wrapper.find('.dss-summary-unknown').exists()).toBe(true)
    expect(wrapper.find('.dss-summary-unknown').text()).toBe('其中 1 条未知状态')
    wrapper.unmount()
  })

  it('UNKNOWN=0 时不显示未知状态提示，只保留总数', async () => {
    mockedFetch.mockResolvedValue(
      okRes([
        row('A', 'RUNNING', 'SNAPSHOT_RUNNING'),
        row('B', 'COMPLETED', 'SNAPSHOT_COMPLETED'),
      ]),
    )
    const wrapper = await mountPage()
    expect(wrapper.find('.dss-summary-count').text()).toBe('共 2 条')
    expect(wrapper.find('.dss-summary-unknown').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('DataSourceRunStatePage R5 汇总栏样式字面量契约（§3，jsdom 不计算样式）', () => {
  it("'共 N 条'为16px/700/#09090B；未知状态胶囊=12px/700、浅黄 #fef3c7 底/暖橙字/999 圆角/总高≈22px（line-height 22px）/水平 padding≈8px/无边框；层级 16px > 12px", () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/DataSourceRunStatePage.vue'), 'utf8')
    const css = src.split('<style scoped>')[1] ?? ''
    const count = css.match(/\.dss-summary-count\s*\{[^}]*\}/)?.[0] ?? ''
    expect(count).toMatch(/font-size:\s*16px/)
    expect(count).toMatch(/font-weight:\s*700/)
    expect(count).toMatch(/color:\s*var\(--dss-text,\s*#09090b\)/)
    const capsule = css.match(/\.dss-summary-unknown\s*\{[^}]*\}/)?.[0] ?? ''
    expect(capsule).toMatch(/font-size:\s*12px/)
    expect(capsule).toMatch(/font-weight:\s*700/)
    expect(capsule).toMatch(/line-height:\s*22px/)
    expect(capsule).toMatch(/padding:\s*0 8px/)
    expect(capsule).toMatch(/background:\s*#fef3c7/)
    expect(capsule).toMatch(/color:\s*var\(--dss-warning,\s*#b45309\)/)
    expect(capsule).toMatch(/border-radius:\s*999px/)
    expect(capsule).not.toMatch(/border\s*:/)
    // 主计数 16px 严格大于胶囊 12px（视觉层级 共 N 条 > 未知状态胶囊）
    const countFs = Number(count.match(/font-size:\s*(\d+)px/)?.[1])
    const capsuleFs = Number(capsule.match(/font-size:\s*(\d+)px/)?.[1])
    expect(countFs).toBeGreaterThan(capsuleFs)
  })

  it('汇总栏两段仍在 .dss-result-summary 内（flex 垂直居中）；条件渲染逻辑与文案不变（R3 §7）', async () => {
    mockedFetch.mockResolvedValue(
      okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING'), row('B', 'UNKNOWN', 'WEIRD_VALUE')]),
    )
    const wrapper = await mountPage()
    const summary = wrapper.find('.dss-result-summary')
    expect(summary.exists()).toBe(true)
    expect(summary.find('.dss-summary-count').text()).toBe('共 2 条')
    expect(summary.find('.dss-summary-unknown').text()).toBe('其中 1 条未知状态')
    // 未放大为整栏 Banner：仍只是头部左侧的两个小节点，非 h1/h2 标题语义
    expect(summary.element.children.length).toBe(2)
    expect(summary.find('h1,h2').exists()).toBe(false)
    wrapper.unmount()
  })

  it('右侧刷新组结构与 props/事件管道零改动（R3 §7/§12.3）：Toolbar 承接倒计时与手动刷新并发出 refresh', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/DataSourceRunStatePage.vue'), 'utf8')
    expect(src).toMatch(/<DataSourceSnapshotToolbar/)
    expect(src).toMatch(/:last-refresh-text=/)
    expect(src).toMatch(/:countdown-seconds=/)
    expect(src).toMatch(/:countdown-progress=/)
    expect(src).toMatch(/:manual-loading=/)
    expect(src).toMatch(/:busy=/)
    expect(src).toMatch(/@refresh=/)
  })
})

describe('DataSourceRunStatePage R7 页面级中间背景透明化（R7 §4/§7，jsdom 不计算样式）', () => {
  const pageSrc = (): string =>
    readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/DataSourceRunStatePage.vue'), 'utf8')

  it('页面根容器背景已改为 transparent，不再有第二重近白/浅灰页面底色（#fafafa 消失）', () => {
    const src = pageSrc()
    const css = src.split('<style scoped>')[1] ?? ''
    // 只取 .dss-page 规则块（.dss-page-header 以 -header 紧随，不会误匹配）
    const page = css.match(/\.dss-page\s*\{[^}]*\}/)?.[0] ?? ''
    expect(page).not.toBe('')
    expect(page).toMatch(/background:\s*transparent/)
    // 既不回到 #fafafa，也不复用卡片白底令牌（背景必须完全透明）
    expect(page).not.toMatch(/#fafafa/)
    expect(page).not.toMatch(/background:\s*var\(--dss-surface/)
    expect(page).not.toMatch(/background-color\s*:/)
  })

  it('页面根容器盒模型零改动：仍在 .dss-page 之外只改 background；display/flex-direction/gap/padding/radius/margin 保持 R6', () => {
    const src = pageSrc()
    const css = src.split('<style scoped>')[1] ?? ''
    const page = css.match(/\.dss-page\s*\{[^}]*\}/)?.[0] ?? ''
    expect(page).toMatch(/display:\s*flex/)
    expect(page).toMatch(/flex-direction:\s*column/)
    expect(page).toMatch(/gap:\s*12px/)
    expect(page).toMatch(/padding:\s*14px 16px/)
    expect(page).toMatch(/border-radius:\s*10px/)
    // 透明化不得通过新增 margin / 定位 / 尺寸来抵消
    expect(page).not.toMatch(/margin\s*:/)
    expect(page).not.toMatch(/position\s*:/)
    expect(page).not.toMatch(/(?<!min-)width\s*:/)
    expect(page).not.toMatch(/(?<!min-)height\s*:/)
    // 局部令牌未因本轮被改写
    expect(page).toMatch(/--dss-surface:\s*#ffffff/)
    expect(page).toMatch(/--dss-embedded:\s*#f4f4f5/)
  })

  it('查询栏浅灰底未被波及：.dss-query-card 仍为 var(--dss-embedded, #f4f4f5)，尺寸与去阴影保持 R6（R7 §5.1）', () => {
    const src = pageSrc()
    const css = src.split('<style scoped>')[1] ?? ''
    const queryCard = css.match(/\.dss-query-card\s*\{[^}]*\}/)?.[0] ?? ''
    expect(queryCard).not.toBe('')
    expect(queryCard).toMatch(/background:\s*var\(--dss-embedded,\s*#f4f4f5\)/)
    expect(queryCard).not.toMatch(/transparent/)
    expect(queryCard).toMatch(/border-radius:\s*8px/)
    expect(queryCard).toMatch(/padding:\s*10px 16px/)
    expect(queryCard).toMatch(/box-shadow:\s*none/)
  })

  it('结果区域底座未被波及：.dss-card 仍为 var(--dss-surface, #ffffff)，无硬边框 + 10px 圆角 + 极弱阴影（R7 §5.3）', () => {
    const src = pageSrc()
    const css = src.split('<style scoped>')[1] ?? ''
    const card = css.match(/\.dss-card\s*\{[^}]*\}/)?.[0] ?? ''
    expect(card).not.toBe('')
    expect(card).toMatch(/background:\s*var\(--dss-surface,\s*#ffffff\)/)
    expect(card).not.toMatch(/transparent/)
    expect(card).toMatch(/border:\s*none/)
    expect(card).toMatch(/border-radius:\s*10px/)
    expect(card).toMatch(/box-shadow:\s*0 1px 2px rgba\(9,\s*9,\s*11,\s*0\.04\),\s*0 1px 3px rgba\(9,\s*9,\s*11,\s*0\.03\)/)
    // 结果卡片仍是白底而不是承接页面底色
    expect(css.match(/\.dss-result-card\s*\{[^}]*\}/)?.[0] ?? '').not.toMatch(/background\s*:/)
  })

  it('DOM 结构未为透明化而重构：.dss-page 仍直接包裹页头 + 查询卡片 + 结果卡片（R7 §4 禁止改 DOM）', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()
    const page = wrapper.find('.dss-page')
    expect(page.exists()).toBe(true)
    const childClasses = Array.from(page.element.children).map((c) => c.className)
    expect(childClasses).toContain('dss-page-header')
    expect(childClasses).toContain('dss-card dss-query-card')
    expect(childClasses).toContain('dss-card dss-result-card')
    // 中间没有插入额外的占位/包装层
    expect(page.element.children.length).toBe(3)
    wrapper.unmount()
  })

  it('样式作用域未放宽：仍为 <style scoped>，无 :root / --el-* 覆写，不产生跨路由页面样式泄漏（R7 §5.4/§7.9）', () => {
    const src = pageSrc()
    expect(src).toMatch(/<style scoped>/)
    // 去掉注释后再断言选择器，避免块首说明文字里的 ":root / --el-*" 字样造成假失败
    const css = (src.split('<style scoped>')[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/:root\s*[{,]/)
    expect(css).not.toMatch(/--el-[a-z-]+\s*:/)
    expect(css).not.toMatch(/^\s*(body|html)\s*[,{]/m)
    expect(css).not.toMatch(/^\s*\.el-[a-z-]+\s*(,|\{)/m)
  })
})

describe('DataSourceRunStatePage 六类请求页面级视觉（DSS-REQ-071）', () => {
  it('query 在途：仅“查询”按钮 loading，表格不遮罩、立即刷新不 loading', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()

    const gate = deferred()
    mockedFetch.mockImplementationOnce(() => gate.promise)
    await findButton(wrapper, '查询').trigger('click')
    await settle()

    // 表格不被整表遮罩：仅 initial 首载点亮整表 loading，query 在途表格 loading 为 false（query 不遮罩表格，DSS-REQ-071③）
    expect(tableLoading(wrapper)).toBe(false)
    // 仅查询按钮显示 loading；立即刷新不 loading
    const q = findButton(wrapper, '查询')
    expect(q.classes()).toContain('is-loading')
    const r = findButton(wrapper, '立即刷新')
    expect(r.classes()).not.toContain('is-loading')

    gate.release(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING'), row('B', 'COMPLETED', 'SNAPSHOT_COMPLETED')]))
    await settle()
    expect(wrapper.find('.dss-summary-count').text()).toBe('共 2 条')
    expect(findButton(wrapper, '查询').classes()).not.toContain('is-loading')
    wrapper.unmount()
  })

  it('manual 在途：仅“立即刷新”按钮 loading；查询按钮外观稳定（不闪动/不变灰）；表格不遮罩', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()

    const gate = deferred()
    mockedFetch.mockImplementationOnce(() => gate.promise)
    await findButton(wrapper, '立即刷新').trigger('click')
    await settle()

    expect(findButton(wrapper, '立即刷新').classes()).toContain('is-loading')
    const q = findButton(wrapper, '查询')
    expect(q.classes()).not.toContain('is-loading')
    expect((q.element as HTMLButtonElement).disabled).toBe(false)
    expect(q.attributes('aria-disabled')).toBe('true')
    // 表格不遮罩：manual 在途表格 loading 为 false（仅 initial 点亮整表 loading）
    expect(tableLoading(wrapper)).toBe(false)

    gate.release(okRes([row('A2', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    await settle()
    expect(findButton(wrapper, '立即刷新').classes()).not.toContain('is-loading')
    wrapper.unmount()
  })

  it('点击“立即刷新”只新增一次刷新请求，不触发额外查询', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()
    expect(mockedFetch).toHaveBeenCalledTimes(1)

    mockedFetch.mockResolvedValue(okRes([row('A2', 'COMPLETED', 'SNAPSHOT_COMPLETED')]))
    await findButton(wrapper, '立即刷新').trigger('click')
    await settle()

    // 恰好 +1 次（manual 一次），无第二个查询请求
    expect(mockedFetch).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })
})

describe('DataSourceRunStatePage 重置不发请求 + 失败稳定槽位（DESIGN §8 E7，DSS-REQ-068，AC-072）', () => {
  it('“重置”只恢复三项“全部”且不发请求；随后点“查询”才查询（发 1 次）', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()
    expect(mockedFetch).toHaveBeenCalledTimes(1)

    await findButton(wrapper, '重置').trigger('click')
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(1) // 重置不发请求

    await findButton(wrapper, '查询').trigger('click')
    await settle()
    expect(mockedFetch).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('失败提示出现在稳定槽位，出现/消失不改变结果头部刷新组关键元素', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()

    const headerBefore = wrapper.find('.dss-result-card__header').element.children.length
    mockedFetch.mockRejectedValue(new Error('network'))
    await findButton(wrapper, '立即刷新').trigger('click')
    await settle()

    // 槽位常驻（min-height 预留行），失败时渲染 role=status 收敛提示
    const slot = wrapper.find('.dss-result-error-slot')
    expect(slot.exists()).toBe(true)
    const err = wrapper.find('.dss-result-error')
    expect(err.exists()).toBe(true)
    expect(err.attributes('role')).toBe('status')
    expect(err.text()).toBe(REFRESH_FAIL_MESSAGE)
    // 失败保留上一次成功记录（不清表）
    expect(wrapper.find('.dss-summary-count').text()).toBe('共 1 条')
    // 结果头部仍只有左右两个直接子组（几何稳定）
    expect(wrapper.find('.dss-result-card__header').element.children.length).toBe(headerBefore)
    wrapper.unmount()
  })
})
