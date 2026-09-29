// Read-only baseline: row heights + operation-cell box metrics on /config/client (target)
// and /config/data-source (read-only reference). Non-GET /api/** blocked before navigation.
import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://127.0.0.1:5173'
const OUT = '/tmp/rh-evidence'
fs.mkdirSync(OUT, { recursive: true })

const writes = []
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.route('**/api/**', async (route) => {
  const m = route.request().method().toUpperCase()
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
  writes.push({ method: m, url: route.request().url() })
  return route.abort('blockedbyclient')
})
const page = await ctx.newPage()

const measureClient = () =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr')]
    const out = rows.map((tr, i) => {
      const src = tr.querySelector('.cc-src')
      const tds = [...tr.children]
      const opTd = tds[tds.length - 1]
      const cell = opTd ? opTd.querySelector('.cell') : null
      const link = tr.querySelector('.cc-more-link')
      const cs = opTd ? getComputedStyle(opTd) : null
      const linkBox = link ? link.getBoundingClientRect() : null
      return {
        idx: i + 1,
        clientId: src ? src.getAttribute('data-client-id') : null,
        rowH: +tr.getBoundingClientRect().height.toFixed(3),
        ambiguous: !!tr.querySelector('.cc-rowbad') || !!tr.querySelector('.cc-count-note'),
        opTdClass: opTd ? opTd.className : null,
        opTdH: opTd ? +opTd.getBoundingClientRect().height.toFixed(3) : null,
        opTdPadTop: cs ? cs.paddingTop : null,
        opTdPadBottom: cs ? cs.paddingBottom : null,
        opTdHeightCss: cs ? cs.height : null,
        opTdAlign: cs ? cs.verticalAlign : null,
        cellH: cell ? +cell.getBoundingClientRect().height.toFixed(3) : null,
        cellLineH: cell ? getComputedStyle(cell).lineHeight : null,
        cellOverflow: cell ? getComputedStyle(cell).overflow : null,
        linkW: linkBox ? +linkBox.width.toFixed(3) : null,
        linkH: linkBox ? +linkBox.height.toFixed(3) : null,
        linkDisplay: link ? getComputedStyle(link).display : null,
        linkText: link ? link.textContent.trim().slice(0, 12) : null,
      }
    })
    // whole table row height stats
    return { rowCount: rows.length, rows: out }
  })

const measureDs = () =>
  page.evaluate(() => {
    const tables = [...document.querySelectorAll('.lt-main-table')]
    if (!tables.length) return { error: 'no lt-main-table' }
    const table = tables[0]
    const rows = [...table.querySelectorAll('tbody tr')]
    const out = rows.map((tr, i) => {
      const tds = [...tr.children]
      const opTd = tds[tds.length - 1]
      const cell = opTd ? opTd.querySelector('.cell') : null
      const more = tr.querySelector('.row-more')
      const cs = opTd ? getComputedStyle(opTd) : null
      const mb = more ? more.getBoundingClientRect() : null
      return {
        idx: i + 1,
        rowH: +tr.getBoundingClientRect().height.toFixed(3),
        opTdH: opTd ? +opTd.getBoundingClientRect().height.toFixed(3) : null,
        opTdPadTop: cs ? cs.paddingTop : null,
        opTdPadBottom: cs ? cs.paddingBottom : null,
        cellH: cell ? +cell.getBoundingClientRect().height.toFixed(3) : null,
        cellLineH: cell ? getComputedStyle(cell).lineHeight : null,
        cellOverflow: cell ? getComputedStyle(cell).overflow : null,
        moreW: mb ? +mb.width.toFixed(3) : null,
        moreH: mb ? +mb.height.toFixed(3) : null,
        moreDisplay: more ? getComputedStyle(more).display : null,
      }
    })
    return { rowCount: rows.length, rows: out }
  })

const R = {}
await page.goto(BASE + '/config/client', { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForSelector('.cc-table tbody tr', { timeout: 15000 })
await page.waitForTimeout(600)
for (const [w, h] of [[1440, 900], [1920, 1080]]) {
  await page.setViewportSize({ width: w, height: h })
  await page.waitForTimeout(500)
  R[`client_${w}x${h}`] = await measureClient()
}

await page.goto(BASE + '/config/data-source', { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForSelector('.lt-main-table tbody tr', { timeout: 15000 }).catch(() => {})
await page.waitForTimeout(600)
for (const [w, h] of [[1440, 900], [1920, 1080]]) {
  await page.setViewportSize({ width: w, height: h })
  await page.waitForTimeout(500)
  R[`datasource_${w}x${h}`] = await measureDs()
}

R.writesBlocked = writes
fs.writeFileSync(OUT + '/baseline.json', JSON.stringify(R, null, 2))
const hs = (k) => (R[k].rows ? R[k].rows.map((r) => r.rowH) : [])
console.log(JSON.stringify({
  writesBlocked: writes.length,
  client_1440: hs('client_1440x900').slice(0, 8),
  client_1920: hs('client_1920x1080').slice(0, 8),
  ds_1440: hs('datasource_1440x900').slice(0, 8),
  ds_1920: hs('datasource_1920x1080').slice(0, 8),
  clientSample: R.client_1440x900.rows[0],
  dsSample: R.datasource_1440x900 && R.datasource_1440x900.rows ? R.datasource_1440x900.rows[0] : null,
}, null, 2))
await browser.close()
