/**
 * CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001 (probe D)
 * Read-only: careful single-click fixed-selection toggle (click / re-click cancel /
 * switch to another row) with explicit settle waits, plus hover/fixed colour values.
 * Safety: non-GET `/api/**` aborted before navigation.
 */
import { chromium } from 'playwright-core'
import { writeFileSync, mkdirSync } from 'node:fs'

const FRONT = process.env.R7_FRONT || 'http://127.0.0.1:5173'
const OUT = process.env.R7_OUT || '/tmp/r7-targeted-out'
mkdirSync(OUT, { recursive: true })
const writes = []

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await context.route('**/api/**', (route) => {
  const m = route.request().method().toUpperCase()
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
  writes.push({ method: m, url: route.request().url() })
  return route.abort('blockedbyclient')
})
const page = await context.newPage()
const res = { task: 'CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001', mode: 'readonly-browser-probe-D', writeInterception: {}, steps: [] }

const snap = async (label) => {
  const s = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
    return trs.map((tr, i) => ({
      idx: i + 1,
      selected: tr.className.includes('cc-row--selected'),
      bg: getComputedStyle(tr.querySelector('td.el-table__cell')).backgroundColor,
    })).filter((r) => r.selected || r.idx <= 2)
  })
  res.steps.push({ label, rows: s })
  return s
}

try {
  await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.cc-table.lt-main-table .el-table__body tr.el-table__row', { timeout: 15000 })
  const cell = (i) => page.locator('.cc-table .el-table__body tr.el-table__row').nth(i).locator('td').nth(2) // 探针描述 cell

  await snap('initial')
  await cell(0).click(); await page.waitForTimeout(600); await snap('click row1')
  await cell(0).click(); await page.waitForTimeout(600); await snap('re-click row1 (expect cancel)')
  await cell(0).click(); await page.waitForTimeout(600); await snap('click row1 again (expect fixed)')
  await cell(1).click(); await page.waitForTimeout(600); await snap('click row2 (expect row1 off, row2 fixed)')
  // hover only (no click) -> transient highlight, not fixed
  await cell(2).hover(); await page.waitForTimeout(400); await snap('hover row3 (expect no fixed change)')
} finally {
  res.writeInterception = { policy: 'non-GET /api/** aborted', nonGetAttempts: writes.length }
  writeFileSync(`${OUT}/round7-targeted-results-d.json`, JSON.stringify(res, null, 1))
  await browser.close()
}
console.log('WROTE round7-targeted-results-d.json writeAttempts=', writes.length)
