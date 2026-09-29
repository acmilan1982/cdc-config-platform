/**
 * CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001 (probe C)
 * Read-only: CCFG-AC-156 regression items that ARE observable read-only —
 *   single-click fixed selection / re-click cancel / double-click edit /
 *   keyboard reach + menu event isolation / 6th-round hover & fixed colouring.
 * Write-path legs (启用/停用 reselection, reload race) are NOT exercised here.
 * Safety: non-GET `/api/**` aborted before navigation; no form submitted.
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
const res = { task: 'CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001', mode: 'readonly-browser-probe-C', writeInterception: { policy: 'non-GET /api/** aborted', nonGetAttempts: null } }

try {
  await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.cc-table.lt-main-table .el-table__body tr.el-table__row', { timeout: 15000 })

  const rowBg = (i) => page.evaluate((n) => {
    const tr = document.querySelectorAll('.cc-table .el-table__body tr.el-table__row')[n]
    const td = tr.querySelector('td.el-table__cell')
    return { bg: getComputedStyle(td).backgroundColor, cls: tr.className }
  }, i)

  res.idleRow1 = await rowBg(0)

  // hover row 1
  await page.locator('.cc-table .el-table__body tr.el-table__row').nth(0).locator('td').nth(1).hover()
  res.hoverRow1 = await rowBg(0)

  // click row 1 (fixed selection)
  await page.locator('.cc-table .el-table__body tr.el-table__row').nth(0).locator('td').nth(1).click()
  res.afterClickRow1 = await rowBg(0)
  res.afterClickRow1_selectedClass = (res.afterClickRow1.cls || '').includes('cc-row--selected')

  // hover the fixed row again -> background must NOT jump
  await page.locator('.cc-table .el-table__body tr.el-table__row').nth(0).locator('td').nth(2).hover()
  res.hoverFixedRow1 = await rowBg(0)

  // hover a different row while row1 fixed -> row1 unchanged
  await page.locator('.cc-table .el-table__body tr.el-table__row').nth(1).locator('td').nth(1).hover()
  res.afterHoverOtherRow_row1 = await rowBg(0)

  // click row 1 again -> cancel selection
  await page.locator('.cc-table .el-table__body tr.el-table__row').nth(0).locator('td').nth(1).click()
  res.afterReClickRow1 = await rowBg(0)
  res.afterReClickRow1_selectedClass = (res.afterReClickRow1.cls || '').includes('cc-row--selected')

  // menu event isolation: click ellipsis -> dropdown opens, edit dialog must NOT open
  await page.locator('.lt-row-action__ellipsis').nth(0).click()
  await page.waitForTimeout(300)
  res.afterEllipsisClick = await page.evaluate(() => ({
    dropdownVisible: Array.from(document.querySelectorAll('.el-dropdown-menu')).some((e) => e.offsetParent !== null),
    menuItems: Array.from(document.querySelectorAll('.el-dropdown-menu .el-dropdown-menu__item')).filter((e) => e.offsetParent !== null).map((e) => e.textContent.trim()),
    editDialogOpen: Array.from(document.querySelectorAll('.el-dialog')).some((e) => e.offsetParent !== null),
    fixedSelectedRows: document.querySelectorAll('.cc-table .el-table__body tr.cc-row--selected').length,
  }))
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  // double-click row 1 content -> edit dialog opens (read-only open, then close, NOT submitted)
  await page.locator('.cc-table .el-table__body tr.el-table__row').nth(0).locator('td').nth(2).dblclick()
  await page.waitForTimeout(400)
  res.afterDblClick = await page.evaluate(() => ({
    editDialogOpen: Array.from(document.querySelectorAll('.el-dialog')).some((e) => e.offsetParent !== null),
    fixedSelectedRows: document.querySelectorAll('.cc-table .el-table__body tr.cc-row--selected').length,
  }))
  // close dialog without submitting
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  res.dialogClosedNoSubmit = await page.evaluate(() => !Array.from(document.querySelectorAll('.el-dialog')).some((e) => e.offsetParent !== null))

  // keyboard reach of the ellipsis (real Tab)
  await page.evaluate(() => document.body.focus())
  let reached = false
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab')
    const ok = await page.evaluate(() => String(document.activeElement && document.activeElement.className).includes('lt-row-action__ellipsis'))
    if (ok) { reached = true; break }
  }
  res.tabReachesEllipsis = reached
} finally {
  res.writeInterception.nonGetAttempts = writes.length
  writeFileSync(`${OUT}/round7-targeted-results-c.json`, JSON.stringify(res, null, 1))
  await browser.close()
}
console.log('WROTE round7-targeted-results-c.json writeAttempts=', writes.length)
