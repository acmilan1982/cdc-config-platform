#!/usr/bin/env node
/**
 * §9.2 数据源管理主列表「接入前 / 接入后」真实浏览器逐值采样。
 *
 * 两个隔离环境（均为 0.0.0.0 监听 + 同一后端 127.0.0.1:8080 代理，同一浏览器、同一视口、100% 缩放）：
 *   baseline = ae6439b312bb6549f9ac7c31a3c7e5a8c524fec7 导出的干净工作副本（5174）
 *   impl     = 本任务实现工作树（5173）
 *
 * 只做只读页面读取：不调用写接口、不执行 SQL、不写数据库。弹窗表通过真实鼠标点击打开。
 *
 * 用法: node sample-equivalence.mjs --cdp-port 9222 --baseline <url> --impl <url> --out <dir>
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

import {
  CdpSession,
  openPage,
  evaluate,
  waitFor,
  clickSelector,
  waitPopperOpen,
} from './cdp-client.mjs'

const args = process.argv.slice(2)
const argOf = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}

const CDP_PORT = Number(argOf('cdp-port', '9222'))
const BASELINE = argOf('baseline', 'http://127.0.0.1:5174')
const IMPL = argOf('impl', 'http://127.0.0.1:5173')
const OUT = argOf('out', '.')

const PAGE_PATH = '/config/data-source'
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
]

/** 主列表表格采样：计算样式 + 几何 + 令牌读取。全部为规范化字符串/数字，便于严格逐值比较。 */
const MAIN_TABLE_PROBE = `(() => {
  const root = document.querySelector('.data-table')
  if (!root) return { error: 'main-table-root-missing' }
  const headerCell = root.querySelector('.el-table__header-wrapper th .cell')
  const th = root.querySelector('.el-table__header-wrapper th.el-table__cell')
  const td = root.querySelector('.el-table__body-wrapper td.el-table__cell')
  if (!headerCell || !th || !td) return { error: 'main-table-probe-incomplete' }
  const cs = getComputedStyle(root)
  const hcs = getComputedStyle(headerCell)
  const tcs = getComputedStyle(th)
  const dcs = getComputedStyle(td)
  const inner = root.querySelector('.el-table__inner-wrapper table') || root.querySelector('table')
  const headerWrapper = root.querySelector('.el-table__header-wrapper')
  const firstRow = root.querySelector('.el-table__body-wrapper tbody tr')
  const rect = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, left: r.left, right: r.right, bottom: r.bottom }
  }
  const tokens = ['--lt-table-width','--lt-border-color','--lt-header-bg-color','--lt-header-text-color','--lt-header-font-size','--lt-header-font-weight','--lt-header-letter-spacing','--lt-header-cell-padding','--lt-body-cell-padding']
  const lt = {}
  for (const t of tokens) lt[t] = cs.getPropertyValue(t).trim()
  const longCell = root.querySelector('.el-table__body-wrapper .el-tooltip')
  return {
    rootClassName: root.className,
    mainTableHasPublicClass: root.classList.contains('lt-main-table'),
    tableWidth: cs.width,
    tableViewportWidth: root.clientWidth,
    tableLayout: inner ? getComputedStyle(inner).tableLayout : null,
    elTableBorderColor: cs.getPropertyValue('--el-table-border-color').trim(),
    elTableHeaderTextColor: cs.getPropertyValue('--el-table-header-text-color').trim(),
    elTableHeaderBgColor: cs.getPropertyValue('--el-table-header-bg-color').trim(),
    headerFontSize: hcs.fontSize,
    headerFontWeight: hcs.fontWeight,
    headerColor: hcs.color,
    headerLetterSpacing: hcs.letterSpacing,
    thPadding: [tcs.paddingTop, tcs.paddingRight, tcs.paddingBottom, tcs.paddingLeft].join(' '),
    tdPadding: [dcs.paddingTop, dcs.paddingRight, dcs.paddingBottom, dcs.paddingLeft].join(' '),
    headerBackgroundColor: tcs.backgroundColor,
    rootRect: rect(root),
    headerWrapperRect: rect(headerWrapper),
    headerRowRect: rect(root.querySelector('.el-table__header-wrapper thead tr')),
    firstRowRect: rect(firstRow),
    firstCellRect: rect(firstRow ? firstRow.querySelector('td.el-table__cell') : null),
    bodyRowCount: root.querySelectorAll('.el-table__body-wrapper tbody tr').length,
    tooltipCellCount: root.querySelectorAll('.el-table__body-wrapper .el-tooltip').length,
    longTextOverflow: longCell ? getComputedStyle(longCell).textOverflow : null,
    ltTokens: lt,
  }
})()`

/** 命名策略弹窗表采样：同一探针语义，但作用域为 .naming-table（未启用负向页面之一）。
 *  开发库中该弹窗当前无策略数据，故正文 td 允许缺失（不可因此漏检表头与令牌）。 */
const NAMING_TABLE_PROBE = `(() => {
  const root = document.querySelector('.naming-table')
  if (!root) return { error: 'naming-table-root-missing' }
  const headerCell = root.querySelector('.el-table__header-wrapper th .cell')
  const th = root.querySelector('.el-table__header-wrapper th.el-table__cell')
  const td = root.querySelector('.el-table__body-wrapper td.el-table__cell')
  if (!headerCell || !th) return { error: 'naming-table-probe-incomplete' }
  const cs = getComputedStyle(root)
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, left: r.left, right: r.right, bottom: r.bottom } }
  const tokens = ['--lt-table-width','--lt-border-color','--lt-header-bg-color','--lt-header-text-color','--lt-header-font-size','--lt-header-font-weight','--lt-header-letter-spacing','--lt-header-cell-padding','--lt-body-cell-padding']
  const lt = {}
  for (const t of tokens) lt[t] = cs.getPropertyValue(t).trim()
  return {
    rootClassName: root.className,
    namingTableHasPublicClass: root.classList.contains('lt-main-table'),
    elTableBorderColor: cs.getPropertyValue('--el-table-border-color').trim(),
    elTableHeaderTextColor: cs.getPropertyValue('--el-table-header-text-color').trim(),
    elTableHeaderBgColor: cs.getPropertyValue('--el-table-header-bg-color').trim(),
    headerFontSize: getComputedStyle(headerCell).fontSize,
    headerFontWeight: getComputedStyle(headerCell).fontWeight,
    headerColor: getComputedStyle(headerCell).color,
    headerLetterSpacing: getComputedStyle(headerCell).letterSpacing,
    thPadding: getComputedStyle(th).padding,
    tdPadding: td ? getComputedStyle(td).padding : null,
    bodyRowCount: root.querySelectorAll('.el-table__body-wrapper tbody tr').length,
    headerCellCount: root.querySelectorAll('.el-table__header-wrapper th').length,
    rootRect: rect(root),
    headerRowRect: rect(root.querySelector('.el-table__header-wrapper thead tr')),
    firstRowRect: rect(root.querySelector('.el-table__body-wrapper tbody tr')),
    ltTokens: lt,
  }
})()`

/** 公共规则的实际匹配统计（用真实选择器引擎，非文本判断）：
 *  count = 命中数；outsideRoot = 命中的元素中「不在公共根类节点内」的数量（泄漏即 > 0）。 */
const PUBLIC_RULE_MATCH_PROBE = `(() => {
  const sels = [
    '.lt-main-table',
    '.lt-main-table .el-table__header th .cell',
    '.lt-main-table td.el-table__cell',
    '.lt-main-table th.el-table__cell',
  ]
  const out = {}
  for (const s of sels) {
    const els = [...document.querySelectorAll(s)]
    out[s] = {
      count: els.length,
      outsideRoot: els.filter((el) => !el.closest('.lt-main-table')).length,
      distinctElTableRoots: [...new Set(els.map((el) => el.closest('.el-table')).filter(Boolean))].length,
    }
  }
  return out
})()`

/** 在当前可见的 popper 内按文案定位下拉项，标记后真实鼠标点击（Element Plus 关闭后残留实例尺寸为 0）。 */
async function clickPopperItemByText(cdp, sessionId, popperClass, text, label) {
  const resolveExpr = `(() => {
    const pops = [...document.querySelectorAll('.' + ${JSON.stringify(popperClass)})]
      .filter((el) => { const cs = getComputedStyle(el); const b = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && b.height > 0 })
    const pop = pops[pops.length - 1]
    if (!pop) return false
    const item = [...pop.querySelectorAll('.el-dropdown-menu__item')].find((el) => (el.textContent || '').includes(${JSON.stringify(text)}))
    if (!item) return false
    item.setAttribute('data-ltvt-click', '1')
    return true
  })()`
  const deadline = Date.now() + 8000
  let ok = false
  while (Date.now() < deadline) {
    ok = await evaluate(cdp, sessionId, resolveExpr)
    if (ok) break
    await delay(80)
  }
  if (!ok) throw new Error(`no visible .${popperClass} item containing "${text}" (${label})`)
  await clickSelector(cdp, sessionId, '[data-ltvt-click="1"]')
  await evaluate(
    cdp,
    sessionId,
    `(() => { const el = document.querySelector('[data-ltvt-click="1"]'); if (el) el.removeAttribute('data-ltvt-click'); return true })()`,
  )
}

/**
 * 等待页面内表达式连续多次返回同一结果。
 * 弹窗有进入过渡（transform/opacity），在过渡中采样会读到插值位置——那是采样时机噪声，
 * 不是「接入引入的视觉差异」，必须先等布局稳定。
 */
async function waitStable(cdp, sessionId, expression, { polls = 4, intervalMs = 150, timeoutMs = 15000, label = expression } = {}) {
  const deadline = Date.now() + timeoutMs
  let last
  let stable = 0
  while (Date.now() < deadline) {
    const v = await evaluate(cdp, sessionId, expression)
    if (v !== null && v === last) {
      stable += 1
      if (stable >= polls - 1) return v
    } else {
      stable = 0
    }
    last = v
    await delay(intervalMs)
  }
  throw new Error(`waitStable timeout after ${timeoutMs}ms: ${label}`)
}

async function sampleOrigin(cdp, origin, viewport, label) {
  const url = `${origin}${PAGE_PATH}`
  const { targetId, sessionId } = await openPage(cdp, 'about:blank')
  await cdp.send(
    'Emulation.setDeviceMetricsOverride',
    { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: false },
    sessionId,
  )
  await cdp.send('Page.navigate', { url }, sessionId)
  // 列表数据为空则说明后端未返回，必须失败而不是把空表当成通过
  await waitFor(
    cdp,
    sessionId,
    `document.querySelectorAll('.data-table .el-table__body-wrapper tbody tr').length > 1`,
    { timeoutMs: 40000, label: `${label} rows loaded` },
  )

  const viewportResult = await evaluate(
    cdp,
    sessionId,
    `(() => { const lm = document.documentElement; return { innerWidth: window.innerWidth, innerHeight: window.innerHeight, devicePixelRatio: window.devicePixelRatio, visualViewportScale: window.visualViewport ? window.visualViewport.scale : null, clientWidth: lm.clientWidth, clientHeight: lm.clientHeight } })()`,
  )

  // 主列表也可能在首帧布局中：等其外接矩形稳定后再采样
  await waitStable(
    cdp,
    sessionId,
    `(() => { const r = document.querySelector('.data-table').getBoundingClientRect(); return r.x + ':' + r.y + ':' + r.width + ':' + r.height })()`,
    { label: `${label} main table stable` },
  )
  const main = await evaluate(cdp, sessionId, MAIN_TABLE_PROBE)
  const publicMatches = await evaluate(cdp, sessionId, PUBLIC_RULE_MATCH_PROBE)

  // 打开命名策略弹窗（真实鼠标路径：行内“更多” → 下拉项）
  await clickSelector(cdp, sessionId, '.data-table .el-table__body-wrapper tbody tr .row-more', { index: 0 })
  await waitPopperOpen(cdp, sessionId, '.ds-more-popper')
  await clickPopperItemByText(cdp, sessionId, 'ds-more-popper', '目标库命名策略', label)
  await waitFor(
    cdp,
    sessionId,
    `(() => { const n = document.querySelector('.naming-table'); if (!n) return false; return !!n.querySelector('.el-table__header-wrapper thead tr') && n.querySelectorAll('.el-table__header-wrapper th').length > 0 })()`,
    { timeoutMs: 20000, label: `${label} naming table rendered` },
  )
  // 弹窗进入过渡结束后再采样，避免把过渡插值误判为视觉差异
  await waitStable(
    cdp,
    sessionId,
    `(() => { const r = document.querySelector('.naming-table').getBoundingClientRect(); return r.x + ':' + r.y + ':' + r.width + ':' + r.height })()`,
    { label: `${label} naming table stable` },
  )
  const naming = await evaluate(cdp, sessionId, NAMING_TABLE_PROBE)

  await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
  return { url, viewport: viewportResult, main, naming, publicRuleMatches: publicMatches }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const wsUrl = await CdpSession.discover(CDP_PORT)
  const cdp = await CdpSession.connect(wsUrl)

  const raw = { generatedAt: new Date().toISOString(), pagePath: PAGE_PATH, baseline: BASELINE, impl: IMPL, viewports: {} }

  for (const vp of VIEWPORTS) {
    const entry = {}
    // baselineA / baselineB 为同一基准环境的两次独立加载：用于量化浏览器自身的
    // 布局抖动（噪声地板），避免把纯噪声误记为「接入引入的真实视觉差异」。
    for (const [label, origin] of [
      ['baselineA', BASELINE],
      ['baselineB', BASELINE],
      ['impl', IMPL],
    ]) {
      entry[label] = await sampleOrigin(cdp, origin, vp, `${vp.name}/${label}`)
      process.stdout.write(`sampled ${vp.name}/${label}\n`)
      await delay(200)
    }
    raw.viewports[vp.name] = entry
    process.stdout.write(`sampled ${vp.name}\n`)
    await delay(200)
  }

  writeFileSync(join(OUT, 'raw-equivalence.json'), JSON.stringify(raw, null, 2))
  console.log('WROTE', join(OUT, 'raw-equivalence.json'))
  cdp.close()
}

main().catch((e) => {
  console.error('SAMPLER_FAILED:', e.message)
  process.exit(1)
})
