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

    // 1. 页头语义区（公共外壳提供，本页只传 Feature 文案）
    const header = wrapper.find('.ql-page__header')
    expect(header.exists()).toBe(true)
    expect(header.find('h2.ql-page__title').text()).toBe('源库快照状态')
    expect(header.find('p.ql-page__description').text()).toContain('只读')

    // 2. 独立查询卡片（公共查询面板承载底座，本页只放字段组与操作区）
    const queryCard = wrapper.find('.ql-q-panel')
    expect(queryCard.exists()).toBe(true)
    expect(queryCard.find('.dss-q-label').exists()).toBe(true)
    expect(queryCard.text()).toContain('查询')
    expect(queryCard.text()).toContain('重置')

    // 3. 独立结果卡片（内部头部 + 表格主体）
    const resultCard = wrapper.find('.ql-result-panel')
    expect(resultCard.exists()).toBe(true)
    expect(resultCard.find('.el-table').exists()).toBe(true)

    // 公共外壳不生成包装层：页头 + 查询区 + 结果区逐一成为根的直接元素子节点
    const page = wrapper.find('.ql-page')
    const children = [...page.element.children] as HTMLElement[]
    expect(children.map((c) => c.classList.contains('ql-page__header'))).toEqual([true, false, false])
    expect(children.map((c) => c.classList.contains('ql-q-panel'))).toEqual([false, true, false])
    expect(children.map((c) => c.classList.contains('ql-result-panel'))).toEqual([false, false, true])
    for (const child of children) expect(child.parentElement).toBe(page.element)
    wrapper.unmount()
  })

  it('结果头部左=总数/未知计数，右=不可拆散刷新组（同一头部仅两个直接子组）', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()

    const header = wrapper.find('.ql-result-panel__header')
    const children = Array.from(header.element.children) as HTMLElement[]
    expect(children).toHaveLength(2)
    const summary = children.find((c) => c.classList.contains('ql-result-panel__summary'))!
    const toolbar = children.find((c) => c.classList.contains('ql-result-panel__toolbar'))!
    expect(summary).toBeTruthy()
    expect(toolbar).toBeTruthy()
    // 左组仅总数（该数据无未知）
    expect(summary.textContent).toContain('共 1 条')
    expect(summary.querySelector('.dss-summary-count')).not.toBeNull()
    // 右组为刷新组整体（不可拆散）：工具栏唯一子节点即公共刷新组
    expect(toolbar.children).toHaveLength(1)
    const rg = toolbar.firstElementChild as HTMLElement
    expect(rg.classList.contains('ql-refresh-group')).toBe(true)
    // R2 §9.1：真实自动刷新剩余秒数文案（首载完成后即同步重置为 60）
    expect(rg.textContent).toContain('60 秒后自动刷新')
    expect(rg.textContent).toContain('立即刷新')
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

  it('右侧刷新组结构未改（R3 §7/§12.3）：公共 Toolbar 承接倒计时与手动刷新并发出 refresh', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/DataSourceRunStatePage.vue'), 'utf8')
    expect(src).toMatch(/<QueryListRefreshToolbar/)
    expect(src).toMatch(/:countdown="countdown"/)
    expect(src).toMatch(/:last-refresh-text="lastRefreshText"/)
    expect(src).toMatch(/:manual-loading="manualLoading"/)
    expect(src).toMatch(/:busy="busy"/)
    expect(src).toMatch(/@refresh="onManualRefresh"/)
    // 倒计时仍由本页状态投影（seconds/progress 两值），公共组件不持有定时器
    expect(src).toMatch(/autoRefreshRemainingSeconds/)
    expect(src).toMatch(/autoRefreshProgress/)
  })
})

describe('DataSourceRunStatePage 页面级底座由公共层承载（R7 §4/§7，jsdom 不计算样式）', () => {
  const pageSrc = (): string =>
    readFileSync(resolve(process.cwd(), 'src/views/data-source-run-state/DataSourceRunStatePage.vue'), 'utf8')

  const sharedSrc = (file: string): string =>
    readFileSync(resolve(process.cwd(), 'src/components/query-list', file), 'utf8')

  const sharedRule = (file: string, selector: string): string => {
    const css = sharedSrc(file).replace(/\/\*[\s\S]*?\*\//g, '')
    return css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
  }

  it('页面根容器背景仍为 transparent，不再有第二重近白/浅灰页面底色（#fafafa 消失）', () => {
    const body = sharedRule('QueryListPageShell.vue', '.ql-page')
    expect(body).not.toBe('')
    expect(body).toMatch(/background:\s*var\(--ql-page-background,\s*transparent\)/)
    // 本页不得覆写该令牌，也不得重新引入页面底色
    const css = pageSrc().split('<style scoped>')[1] ?? ''
    expect(css).not.toMatch(/--ql-page-background/)
    expect(css).not.toMatch(/#fafafa/)
    expect(css).not.toMatch(/\.dss-page\b/)
  })

  it('页面根容器盒模型零改动：gap/padding/radius 仍是参考事实值，本页不新增 margin/定位/尺寸补偿', () => {
    const body = sharedRule('QueryListPageShell.vue', '.ql-page')
    expect(body).toMatch(/(^|;)\s*display:\s*flex\s*(;|$)/)
    expect(body).toMatch(/(^|;)\s*flex-direction:\s*column\s*(;|$)/)
    expect(body).toMatch(/gap:\s*var\(--ql-page-gap,\s*12px\)/)
    expect(body).toMatch(/padding:\s*var\(--ql-page-padding,\s*14px 16px\)/)
    expect(body).toMatch(/border-radius:\s*var\(--ql-page-radius,\s*10px\)/)
    const css = pageSrc().split('<style scoped>')[1] ?? ''
    // 本页不得为几何改动覆写外壳令牌
    for (const token of ['--ql-page-gap', '--ql-page-padding', '--ql-page-radius']) {
      expect(css, `${token} 不应在本页覆写`).not.toMatch(new RegExp(token))
    }
    expect(css).not.toMatch(/--ql-title-|--ql-desc-/)
  })

  it('查询栏浅灰底未被波及：公共查询面板仍为 #f4f4f5 / 8px 圆角 / 10px 16px 内边距 / 无阴影（R7 §5.1）', () => {
    const body = sharedRule('QueryListQueryPanel.vue', '.ql-q-panel')
    expect(body).not.toBe('')
    expect(body).toMatch(/background:\s*var\(--ql-q-panel-bg,\s*#f4f4f5\)/)
    expect(body).not.toMatch(/transparent/)
    expect(body).toMatch(/border-radius:\s*var\(--ql-q-panel-radius,\s*8px\)/)
    expect(body).toMatch(/padding:\s*var\(--ql-q-panel-padding,\s*10px 16px\)/)
    // 无阴影（线性面板：去阴影保持 R6）
    expect(body).not.toMatch(/box-shadow/)
    const css = pageSrc().split('<style scoped>')[1] ?? ''
    expect(css).not.toMatch(/--ql-q-panel-/)
  })

  it('结果区域底座未被波及：公共结果面板仍为白底 + 10px 圆角 + 极弱阴影、无硬边框（R7 §5.3）', () => {
    const body = sharedRule('QueryListResultPanel.vue', '.ql-result-panel')
    expect(body).not.toBe('')
    expect(body).toMatch(/background:\s*var\(--ql-result-panel-bg,\s*#ffffff\)/)
    expect(body).not.toMatch(/transparent/)
    expect(body).not.toMatch(/(^|;)\s*border\s*:/)
    expect(body).toMatch(/border-radius:\s*var\(--ql-result-panel-radius,\s*10px\)/)
    expect(body).toMatch(
      /box-shadow:\s*var\(--ql-result-panel-shadow,\s*0 1px 2px rgba\(9,\s*9,\s*11,\s*0\.04\),\s*0 1px 3px rgba\(9,\s*9,\s*11,\s*0\.03\)\)/,
    )
    const css = pageSrc().split('<style scoped>')[1] ?? ''
    expect(css).not.toMatch(/--ql-result-panel-/)
  })

  it('DOM 结构未为视觉调整而重构：根仍直接包裹页头 + 查询区 + 结果区（R7 §4 禁止改 DOM）', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()
    const page = wrapper.find('.ql-page')
    expect(page.exists()).toBe(true)
    const childClasses = Array.from(page.element.children).map((c) => c.className)
    expect(childClasses.some((c) => c.includes('ql-page__header'))).toBe(true)
    expect(childClasses.some((c) => c.includes('ql-q-panel'))).toBe(true)
    expect(childClasses.some((c) => c.includes('ql-result-panel'))).toBe(true)
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
    // Feature 命名空间仍是 .dss-*，公共层命名空间仍是 .ql-*
    expect(css).not.toMatch(/^\s*\.ql-[a-z-]+\s*(,|\{|$)/m)
  })
})

describe('DataSourceRunStatePage 六类请求页面级视觉（DSS-REQ-071）', () => {
  it('query 在途：仅“查询”按钮点亮私有指示器，表格不遮罩、立即刷新不点亮', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()

    const gate = deferred()
    mockedFetch.mockImplementationOnce(() => gate.promise)
    await findButton(wrapper, '查询').trigger('click')
    await settle()

    // 表格不被整表遮罩：仅 initial 首载点亮整表 loading，query 在途表格 loading 为 false（query 不遮罩表格，DSS-REQ-071③）
    expect(tableLoading(wrapper)).toBe(false)
    // 查询按钮点亮 Feature 私有常驻指示器；不再使用 Element Plus 默认 loading（DSS-REQ-088）
    const q = findButton(wrapper, '查询')
    expect(q.classes()).not.toContain('is-loading')
    expect(q.find('.ql-btn-spinner').classes()).toContain('is-visible')
    expect(q.find('.ql-action-label').text()).toBe('查询')
    expect(q.attributes('aria-busy')).toBe('true')
    // 立即刷新不点亮：query 与 manual 指示器互相独立
    const r = findButton(wrapper, '立即刷新')
    expect(r.find('.ql-btn-spinner').classes()).not.toContain('is-visible')

    gate.release(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING'), row('B', 'COMPLETED', 'SNAPSHOT_COMPLETED')]))
    await settle()
    expect(wrapper.find('.dss-summary-count').text()).toBe('共 2 条')
    const qAfter = findButton(wrapper, '查询')
    expect(qAfter.find('.ql-btn-spinner').classes()).not.toContain('is-visible')
    expect(qAfter.attributes('aria-busy')).toBeUndefined()
    wrapper.unmount()
  })

  it('manual 在途：仅“立即刷新”按钮点亮私有指示器；查询按钮外观稳定（不闪动/不变灰）；表格不遮罩', async () => {
    mockedFetch.mockResolvedValue(okRes([row('A', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    const wrapper = await mountPage()

    const gate = deferred()
    mockedFetch.mockImplementationOnce(() => gate.promise)
    await findButton(wrapper, '立即刷新').trigger('click')
    await settle()

    const r = findButton(wrapper, '立即刷新')
    expect(r.classes()).not.toContain('is-loading')
    expect(r.find('.ql-btn-spinner').classes()).toContain('is-visible')
    expect(r.find('.ql-action-label').text()).toBe('立即刷新')
    expect(r.attributes('aria-busy')).toBe('true')
    const q = findButton(wrapper, '查询')
    expect(q.find('.ql-btn-spinner').classes()).not.toContain('is-visible')
    expect(q.attributes('aria-busy')).toBeUndefined()
    expect((q.element as HTMLButtonElement).disabled).toBe(false)
    expect(q.attributes('aria-disabled')).toBe('true')
    // 表格不遮罩：manual 在途表格 loading 为 false（仅 initial 点亮整表 loading）
    expect(tableLoading(wrapper)).toBe(false)

    gate.release(okRes([row('A2', 'RUNNING', 'SNAPSHOT_RUNNING')]))
    await settle()
    expect(findButton(wrapper, '立即刷新').find('.ql-btn-spinner').classes()).not.toContain('is-visible')
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

    const headerBefore = wrapper.find('.ql-result-panel__header').element.children.length
    mockedFetch.mockRejectedValue(new Error('network'))
    await findButton(wrapper, '立即刷新').trigger('click')
    await settle()

    // 槽位常驻（min-height 预留行），失败时渲染 role=status 收敛提示
    const slot = wrapper.find('.ql-result-panel__error-slot')
    expect(slot.exists()).toBe(true)
    const err = wrapper.find('.dss-result-error')
    expect(err.exists()).toBe(true)
    expect(err.attributes('role')).toBe('status')
    expect(err.text()).toBe(REFRESH_FAIL_MESSAGE)
    // 失败保留上一次成功记录（不清表）
    expect(wrapper.find('.dss-summary-count').text()).toBe('共 1 条')
    // 结果头部仍只有左右两个直接子组（几何稳定）
    expect(wrapper.find('.ql-result-panel__header').element.children.length).toBe(headerBefore)
    wrapper.unmount()
  })
})
