// Read-only real-browser verification: /config/client main list adopts the §13.3 public
// optional single-row highlight preset (two-level opt-in), read-only reference /config/data-source
// stays un-adopted.
//
// Data source: an independent READ-ONLY stub. GET /api/clients is fulfilled in-browser with
// synthetic desensitized rows; every non-GET /api/** request is aborted and counted. No real
// backend, database or ZooKeeper is contacted, and no write request is ever allowed through.
//
// Hover is exercised with real mouse moves (page.hover) on non-interactive cells. Element Plus
// applies a .25s background transition on rows, so every read happens after the transition settles.
//
// Run: NODE_PATH=<playwright> node verify-client-optin.mjs
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

// 本仓库未本地安装 playwright；以 CJS require 解析，便于用 NODE_PATH 指向只读安装目录。
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright')

const BASE = 'http://127.0.0.1:5173'
const OUT = path.dirname(new URL(import.meta.url).pathname)

const HOVER_BG = 'rgb(244, 244, 245)' // #f4f4f5
const FIXED_BG = 'rgb(225, 228, 232)' // #e1e4e8
const TRANSPARENT = 'rgba(0, 0, 0, 0)'
const ACCENT = 'rgb(24, 24, 27)' // #18181b
const ACCENT_SHADOW = `${ACCENT} 3px 0px 0px 0px inset`
const SETTLE = 450 // > .25s row background transition

/** 脱敏合成只读数据：4 行，覆盖启用/停用/历史异常与行级逗号歧义。 */
const SYNTHETIC_ITEMS = [
  {
    clientId: 'probe-a',
    clientDesc: '合成探针甲',
    status: 'ENABLED',
    fgActive: '1',
    dataSourceCount: 1,
    rawDataSourceIds: 'SRC-A',
    possibleCommaDataSourceIds: [],
    rowAnomalies: [],
    dataSources: [
      { dataSourceId: 'SRC-A', org: '机构甲', dataSourceName: '源甲', anomalies: [], conflictClientIds: [] },
    ],
  },
  {
    clientId: 'probe-b',
    clientDesc: '合成探针乙',
    status: 'ENABLED',
    fgActive: '1',
    dataSourceCount: 2,
    rawDataSourceIds: 'SRC-B,SRC-C',
    possibleCommaDataSourceIds: [],
    rowAnomalies: [],
    dataSources: [
      { dataSourceId: 'SRC-B', org: '机构乙', dataSourceName: '源乙', anomalies: [], conflictClientIds: [] },
      { dataSourceId: 'SRC-C', org: '机构丙', dataSourceName: '源丙', anomalies: [], conflictClientIds: [] },
    ],
  },
  {
    clientId: 'probe-c',
    clientDesc: '合成探针丙',
    status: 'DISABLED',
    fgActive: '0',
    dataSourceCount: 1,
    rawDataSourceIds: 'SRC-D',
    possibleCommaDataSourceIds: [],
    rowAnomalies: [],
    dataSources: [
      { dataSourceId: 'SRC-D', org: '机构丁', dataSourceName: '源丁', anomalies: [], conflictClientIds: [] },
    ],
  },
  {
    clientId: 'probe-d',
    clientDesc: '合成探针丁（行级逗号歧义）',
    status: 'ABNORMAL',
    fgActive: 'X9',
    dataSourceCount: 1,
    rawDataSourceIds: 'SRC-E,SRC-F',
    possibleCommaDataSourceIds: ['SRC-E', 'SRC-F'],
    rowAnomalies: ['COMMA_PROTOCOL_AMBIGUOUS'],
    dataSources: [
      { dataSourceId: 'SRC-E', org: '机构戊', dataSourceName: '源戊', anomalies: [], conflictClientIds: [] },
    ],
  },
]

const itemsPayload = JSON.stringify({
  code: 200,
  message: 'ok',
  data: { items: SYNTHETIC_ITEMS },
  timestamp: '2026-09-30T00:00:00',
})

const writes = []
const readCalls = []

const browser = await chromium.launch({ args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
// 只拦挂载在站点根 `/api/**` 的后端接口；不得命中 `/src/api/*.ts` 这类源模块请求。
const isBackendApi = (url) => new URL(url).pathname.startsWith('/api/')
await ctx.route(isBackendApi, async (route) => {
  const req = route.request()
  const method = req.method().toUpperCase()
  const url = req.url()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    readCalls.push({ method, url })
    if (/\/api\/clients(\?|$)/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: itemsPayload,
      })
    }
    // 其他 GET（如候选数据源）一律返回空集合，保持只读且不触网。
    return route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ code: 200, message: 'ok', data: [], timestamp: '2026-09-30T00:00:00' }),
    })
  }
  writes.push({ method, url })
  return route.abort('blockedbyclient')
})

const page = await ctx.newPage()

const rowSel = (n) => `.cc-table tbody tr:nth-child(${n})`
const tdSel = (n, c) => `${rowSel(n)} > td:nth-child(${c})`

/** 读一行的 td 底色/文字色/左缘描边/类名等；含最右固定列的 td 类名。 */
const readRow = (n) =>
  page.evaluate((n) => {
    const tr = document.querySelector(`.cc-table tbody tr:nth-child(${n})`)
    if (!tr) return null
    const tds = [...tr.children]
    const first = tds[0]
    const last = tds[tds.length - 1]
    const cs = (el) => (el ? getComputedStyle(el) : null)
    const idSpan = tr.querySelector('.cc-id')
    const ellipsis = tr.querySelector('.lt-row-action__ellipsis')
    return {
      className: tr.className,
      hasFixedOptIn: tr.classList.contains('lt-row-highlight__row'),
      hasCurrentRow: tr.classList.contains('current-row'),
      rowH: +tr.getBoundingClientRect().height.toFixed(3),
      firstTdBg: first ? cs(first).backgroundColor : null,
      firstTdShadow: first ? cs(first).boxShadow : null,
      secondTdShadow: tds[1] ? cs(tds[1]).boxShadow : null,
      lastTdBg: last ? cs(last).backgroundColor : null,
      lastTdFixedRight: last ? /el-table-fixed-column--right/.test(last.className) : null,
      textColor: idSpan ? cs(idSpan).color : null,
      descColor: tr.querySelector('.cc-desc') ? cs(tr.querySelector('.cc-desc')).color : null,
      ellipsisColor: ellipsis ? cs(ellipsis).color : null,
      tdCount: tds.length,
    }
  }, n)

const tableRoot = () =>
  page.evaluate(() => {
    const t = document.querySelector('.cc-table')
    if (!t) return null
    return {
      className: t.className,
      hasLtMainTable: t.classList.contains('lt-main-table'),
      hasLtRowHighlight: t.classList.contains('lt-row-highlight'),
      optInRowCount: t.querySelectorAll('.lt-row-highlight__row').length,
    }
  })

const R = {}
const checks = []

// ---------- /config/client ----------
await page.goto(`${BASE}/config/client`, { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForSelector('.cc-table tbody tr', { timeout: 20000 })
await page.waitForTimeout(SETTLE)

R.client_1440x900 = {}
R.client_1440x900.root = await tableRoot()
R.client_1440x900.initial = { r1: await readRow(1), r2: await readRow(2), r4: await readRow(4) }
R.client_1440x900.rowCount = await page.evaluate(() => document.querySelectorAll('.cc-table tbody tr').length)

// S1 普通行 hover → #f4f4f5
await page.hover(tdSel(1, 1))
await page.waitForTimeout(SETTLE)
R.client_1440x900.hoverRow1 = await readRow(1)

// S2 单击固定第 2 行
await page.click(tdSel(2, 3))
await page.waitForTimeout(SETTLE)
R.client_1440x900.fixedRow2 = { r2: await readRow(2), r1: await readRow(1), root: await tableRoot() }

// S3 固定行自 hover 仍为固定底
await page.hover(tdSel(2, 1))
await page.waitForTimeout(SETTLE)
R.client_1440x900.fixedRow2HoverSelf = { r2: await readRow(2) }

// S4 hover 其他（未固定）行：该行 hover 灰，固定行保持固定底
await page.hover(tdSel(1, 2))
await page.waitForTimeout(SETTLE)
R.client_1440x900.fixedRow2HoverOther = { r1: await readRow(1), r2: await readRow(2) }

// S5 再次单击同一行取消固定（>260ms 判定窗口）
await page.mouse.move(0, 0)
await page.waitForTimeout(SETTLE)
await page.click(tdSel(2, 3))
await page.waitForTimeout(SETTLE)
// 取消此刻鼠标仍停在该行：应回落为普通 hover 灰而非固定底（固定底确已撤销）。
R.client_1440x900.cancelledUnderHover = { r2: await readRow(2) }
// 移开鼠标后读取真正的“取消后”净态。
await page.mouse.move(0, 0)
await page.waitForTimeout(SETTLE)
R.client_1440x900.cancelled = { r2: await readRow(2), root: await tableRoot() }

// S6 窄视口重复关键读数（固定列更贴近水平滚动场景）
await page.setViewportSize({ width: 1024, height: 768 })
await page.waitForTimeout(SETTLE)
await page.click(tdSel(3, 3))
await page.waitForTimeout(SETTLE)
R.client_narrow = { root: await tableRoot(), fixedRow3: await readRow(3), otherRow1: await readRow(1) }
R.client_narrow.rowCount = await page.evaluate(() => document.querySelectorAll('.cc-table tbody tr').length)

// 取消固定，恢复干净态
await page.click(tdSel(3, 3))
await page.waitForTimeout(SETTLE)

// ---------- /config/data-source 只读对照 ----------
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto(`${BASE}/config/data-source`, { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForSelector('.lt-main-table', { timeout: 20000 }).catch(() => {})
await page.waitForTimeout(SETTLE)
R.datasource = await page.evaluate(() => {
  const t = document.querySelector('.lt-main-table')
  return {
    found: !!t,
    className: t ? t.className : null,
    hasLtRowHighlight: t ? t.classList.contains('lt-row-highlight') : null,
    optInTableClassInDoc: document.querySelectorAll('.lt-row-highlight').length,
    optInRowClassInDoc: document.querySelectorAll('.lt-row-highlight__row').length,
  }
})

R.writes = writes
R.writeCount = writes.length
R.readCalls = readCalls

// ---------- 断言 ----------
const eq = (label, got, want) => checks.push({ label, got, want, ok: got === want })
const ne = (label, got, notWant) => checks.push({ label, got, notWant, ok: got !== notWant })

const c = R.client_1440x900
eq('主列表表根并列挂 lt-main-table', c.root.hasLtMainTable, true)
eq('主列表表根并列挂 lt-row-highlight（表级 opt-in）', c.root.hasLtRowHighlight, true)
eq('初始无固定行（行级类计数 0）', c.root.optInRowCount, 0)
eq('渲染行数 = 合成 4 行', c.rowCount, 4)

eq('未 hover / 未固定时行底透明', c.initial.r1.firstTdBg, TRANSPARENT)
ne('未 opt-in 行不得出现固定底', c.initial.r1.firstTdBg, FIXED_BG)

eq('普通行 hover 底为 #f4f4f5', c.hoverRow1.firstTdBg, HOVER_BG)

eq('单击固定：第 2 行挂 lt-row-highlight__row', c.fixedRow2.r2.hasFixedOptIn, true)
eq('固定行首格底为 #e1e4e8', c.fixedRow2.r2.firstTdBg, FIXED_BG)
eq('固定行最右固定列 td 同为 #e1e4e8（整行同色）', c.fixedRow2.r2.lastTdBg, FIXED_BG)
eq('固定行最右列确为 EP 固定右列', c.fixedRow2.r2.lastTdFixedRight, true)
eq('固定行左缘强调仅在首格', c.fixedRow2.r2.firstTdShadow, ACCENT_SHADOW)
eq('固定行次格无左缘强调', c.fixedRow2.r2.secondTdShadow, 'none')
eq('同一时刻最多一行固定', c.fixedRow2.root.optInRowCount, 1)
eq('未固定行不受固定态影响（仍透明）', c.fixedRow2.r1.firstTdBg, TRANSPARENT)

eq('固定行自 hover 仍保持固定底', c.fixedRow2HoverSelf.r2.firstTdBg, FIXED_BG)

eq('hover 其他行：该行为 hover 灰', c.fixedRow2HoverOther.r1.firstTdBg, HOVER_BG)
eq('hover 其他行：固定行保持固定底', c.fixedRow2HoverOther.r2.firstTdBg, FIXED_BG)

ne('取消后（鼠标仍在该行）不再显示固定底', c.cancelledUnderHover.r2.firstTdBg, FIXED_BG)
eq('取消后不再挂行级类', c.cancelled.r2.hasFixedOptIn, false)
eq('取消后不残留固定底', c.cancelled.r2.firstTdBg, TRANSPARENT)
eq('取消后无残留 current-row 蓝底', c.cancelled.r2.hasCurrentRow, false)
eq('取消后左缘强调消失', c.cancelled.r2.firstTdShadow, 'none')
eq('取消后行级类计数归零', c.cancelled.root.optInRowCount, 0)

eq('固定行文字色不被灰化（与未固定行一致）', c.fixedRow2.r2.textColor, c.fixedRow2.r1.textColor)
eq('固定行描述色与未固定行一致', c.fixedRow2.r2.descColor, c.fixedRow2.r1.descColor)
eq('三点触发器色不被灰化（固定行 = 未固定行）', c.fixedRow2.r2.ellipsisColor, c.fixedRow2.r1.ellipsisColor)

const n = R.client_narrow
eq('窄视口表根仍并列挂 lt-row-highlight', n.root.hasLtRowHighlight, true)
eq('窄视口单击仍只固定一行', n.root.optInRowCount, 1)
eq('窄视口固定行底为 #e1e4e8', n.fixedRow3.firstTdBg, FIXED_BG)
eq('窄视口固定行首格左缘强调', n.fixedRow3.firstTdShadow, ACCENT_SHADOW)
eq('窄视口未固定行为透明', n.otherRow1.firstTdBg, TRANSPARENT)

eq('参考页 /config/data-source 仍挂 lt-main-table（仅根类）', /lt-main-table/.test(R.datasource.className ?? ''), true)
eq('参考页表根未挂 lt-row-highlight', R.datasource.hasLtRowHighlight, false)
eq('参考页未挂表级 lt-row-highlight（零泄漏）', R.datasource.optInTableClassInDoc, 0)
eq('参考页无任何行级 lt-row-highlight__row（零泄漏）', R.datasource.optInRowClassInDoc, 0)

eq('写请求计数为零', R.writeCount, 0)

const problems = checks.filter((x) => !x.ok)
const out = {
  ok: problems.length === 0,
  env: { base: BASE, viewports: ['1440x900', '1024x768'], dataSource: 'READ_ONLY_SYNTHETIC_STUB' },
  writeCount: R.writeCount,
  writes,
  readCallCount: readCalls.length,
  checks,
  problems,
  raw: R,
}
fs.writeFileSync(path.join(OUT, 'client-optin-results.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify({ ok: out.ok, checks: checks.length, problems: problems.length, writeCount: R.writeCount, problemsList: problems }, null, 2))
await browser.close()
process.exit(problems.length === 0 ? 0 : 1)
