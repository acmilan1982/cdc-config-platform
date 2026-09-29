/**
 * CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001
 * Read-only probe for the four targeted ACs (CCFG-AC-010 / 155 / 156 / 157).
 *
 * Safety: BEFORE navigating, every non-GET/HEAD/OPTIONS request to `/api/**`
 * is aborted at the network layer and counted. No form is submitted, no
 * enable/disable/delete confirmation is clicked, no fixture is created,
 * no database / ZooKeeper / Kafka is touched.
 *
 * Reuses the real, already-running dev services:
 *   - frontend Vite dev server  http://127.0.0.1:5173  (serves current HEAD source)
 *   - backend Spring Boot        http://127.0.0.1:8080  (only GET reads are issued)
 *
 * Output is desensitized: business-identifiable values (org names, raw probe
 * ids) are never captured; only presence/booleans/geometry are recorded.
 */
import { chromium } from 'playwright-core'
import { writeFileSync, mkdirSync } from 'node:fs'

const FRONT = process.env.R7_FRONT || 'http://127.0.0.1:5173'
const OUT = process.env.R7_OUT || '/tmp/r7-targeted-out'
mkdirSync(OUT, { recursive: true })

const writes = [] // captured non-GET /api/** attempts

async function installWriteBlocker(context) {
  await context.route('**/api/**', (route) => {
    const req = route.request()
    const m = req.method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    writes.push({ method: m, url: req.url() })
    return route.abort('blockedbyclient')
  })
}

const num = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)

async function measureClientPage(page) {
  await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.cc-table.lt-main-table .el-table__body tr.el-table__row', { timeout: 15000 })
  // scroll to top so the fixed right operation column is laid out normally
  await page.evaluate(() => window.scrollTo(0, 0))

  const data = await page.evaluate(() => {
    const root = document.querySelector('.cc-table.lt-main-table')
    const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
    const out = rows.map((tr, i) => {
      const rr = tr.getBoundingClientRect()
      const td = tr.querySelector('td.lt-row-action__cell')
      const entry = tr.querySelector('.lt-row-action__ellipsis')
      const er = entry ? entry.getBoundingClientRect() : null
      const tr2 = td ? td.getBoundingClientRect() : null
      const cs = entry ? getComputedStyle(entry) : null
      const tds = Array.from(tr.querySelectorAll('td.el-table__cell'))
      const dsCell = tds[3] // 采集数据源 column (seq, id, desc, sources, count, action)
      const tags = dsCell ? Array.from(dsCell.querySelectorAll('.cc-tag, .el-tag, [class*="tag"]')) : []
      const plus = dsCell ? dsCell.querySelector('[class*="plus"], .cc-plus') : null
      return {
        idx: i + 1,
        rowH: rr.height,
        opTdIsLast: td ? tr.lastElementChild === td : false,
        opTdHasOptIn: !!td,
        entryW: er ? er.width : null,
        entryH: er ? er.height : null,
        entryRadius: cs ? cs.borderRadius : null,
        entryColor: cs ? cs.color : null,
        entryCursor: cs ? cs.cursor : null,
        entryDisplay: cs ? cs.display : null,
        entryVisible: entry ? entry.offsetParent !== null : false,
        boxInsideCell: er && tr2 ? (er.left >= tr2.left - 0.5 && er.right <= tr2.right + 0.5) : null,
        boxInsideRow: er ? (er.top >= rr.top - 0.5 && er.bottom <= rr.bottom + 0.5) : null,
        vCentered: er ? Math.abs((er.top + er.bottom) / 2 - (rr.top + rr.bottom) / 2) <= 2 : null,
        tagCount: tags.length,
        plusText: plus ? plus.textContent.trim() : null,
      }
    })
    // shared CSS: exactly the two registered helper classes, scoped under .lt-main-table
    const styleText = Array.from(document.styleSheets)
      .flatMap((s) => { try { return Array.from(s.cssRules).map((r) => r.cssText) } catch { return [] } })
      .join('\n')
    const hasImportant = /!important/.test(styleText)
    const rootClassList = root ? root.className : null
    return {
      rowCount: rows.length,
      rows: out,
      rootClassList,
      classNameOnHeaderTh: !!document.querySelector('.cc-table th.lt-row-action__cell'),
      headerThPadTop: (() => { const th = document.querySelector('.cc-table th.lt-row-action__cell'); return th ? getComputedStyle(th).paddingTop : null })(),
      regularRowH: out.filter((r) => r.rowH !== undefined).reduce((acc, r) => { acc[r.rowH] = (acc[r.rowH] || 0) + 1; return acc }, {}),
      hasImportantInSheets: hasImportant,
    }
  })
  return data
}

async function measureFocusRing(page) {
  // real keyboard Tab until the ellipsis entry takes focus; read :focus-visible outline
  await page.evaluate(() => { document.body.focus() })
  let reached = false
  let steps = 0
  let info = null
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab')
    steps++
    info = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return null
      const cls = el.className || ''
      const cs = getComputedStyle(el)
      return {
        tag: el.tagName,
        isEllipsis: String(cls).includes('lt-row-action__ellipsis'),
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        outlineOffset: cs.outlineOffset,
        ariaLabel: el.getAttribute('aria-label'),
      }
    })
    if (info && info.isEllipsis) { reached = true; break }
  }
  return { tabReached: reached, steps, focused: info }
}

async function measureDataSourcePage(page) {
  await page.goto(`${FRONT}/config/data-source`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.el-table__body tr.el-table__row', { timeout: 15000 })
  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.el-table__body tr.el-table__row'))
    const heights = rows.map((tr) => tr.getBoundingClientRect().height)
    const body = document.body
    const moreEls = Array.from(body.querySelectorAll('.row-more, [class*="row-more"]'))
    const textHasMore = body.innerText.includes('更多')
    const firstRow = rows[0]
    const tds = firstRow ? Array.from(firstRow.querySelectorAll('td.el-table__cell')) : []
    const lastTd = tds[tds.length - 1]
    return {
      rowCount: rows.length,
      heightHistogram: heights.reduce((a, h) => { a[h] = (a[h] || 0) + 1; return a }, {}),
      maxHeight: heights.length ? Math.max(...heights) : null,
      optInCellCount: document.querySelectorAll('.lt-row-action__cell').length,
      optInEllipsisCount: document.querySelectorAll('.lt-row-action__ellipsis').length,
      rowMoreCount: moreEls.length,
      hasMoreText: textHasMore,
      lastTdPadTop: lastTd ? getComputedStyle(lastTd).paddingTop : null,
      lastTdPadBottom: lastTd ? getComputedStyle(lastTd).paddingBottom : null,
      lastCellH: (() => { const c = lastTd ? lastTd.querySelector('.cell') : null; return c ? c.getBoundingClientRect().height : null })(),
      lastCellOverflow: (() => { const c = lastTd ? lastTd.querySelector('.cell') : null; return c ? getComputedStyle(c).overflow : null })(),
    }
  })
  return data
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await installWriteBlocker(context)
const page = await context.newPage()

const result = {
  task: 'CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001',
  mode: 'readonly-browser-probe',
  browser: { engine: 'chromium', version: browser.version(), headless: true },
  viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  frontend: FRONT,
  writeInterception: {
    policy: '/api/** GET/HEAD/OPTIONS allow; POST/PUT/PATCH/DELETE abort and count',
    nonGetAttempts: null, // filled below
  },
  client: null,
  clientFocus: null,
  dataSource: null,
}

try {
  result.client = await measureClientPage(page)
  result.clientFocus = await measureFocusRing(page)
  result.dataSource = await measureDataSourcePage(page)
} finally {
  result.writeInterception.nonGetAttempts = writes.length
  result.writeInterception.attempts = writes
  writeFileSync(`${OUT}/round7-targeted-results.json`, JSON.stringify(result, null, 1))
  await browser.close()
}

console.log('WROTE', `${OUT}/round7-targeted-results.json`)
console.log('writeAttempts=', writes.length)
