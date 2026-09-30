/**
 * ...SUPPLEMENT-001 (probe G): hover/focus fill of the 启用 toggle item (present only on
 * FG_ACTIVE='0' rows), to complete the menu-interaction visual set (AC-101/117).
 * Safety: non-GET /api/** aborted before navigation and counted. No action click.
 */
const PW = ['/usr/lib/node_modules/openclaw/node_modules/playwright-core',
  '/data/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core',
  '/root/.hermes/hermes-agent/node_modules/playwright-core']
let chromium
for (const p of PW) { try { chromium = require(p).chromium; break } catch (e) {} }
if (!chromium) { console.error('no playwright-core'); process.exit(2) }
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = process.env.GAP_FRONT || 'http://127.0.0.1:5173'
const OUT = process.env.GAP_OUT || '/tmp/gap-probe-out'
const fs = require('node:fs')
fs.mkdirSync(OUT, { recursive: true })
const writes = []
;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await context.route('**/api/**', (route) => {
    const m = route.request().method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    writes.push({ method: m, url: route.request().url() })
    return route.abort('blockedbyclient')
  })
  const page = await context.newPage()
  const result = { task: '...SUPPLEMENT-001', probe: 'G', mode: 'readonly-browser-probe', scope: '/config/client only',
    browser: { engine: 'chromium', version: browser.version(), headless: true, viewport: '1440x900' },
    writeInterception: { policy: 'non-GET /api/** abort+count', nonGetAttempts: null, attempts: [] } }
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table .el-table__body tr.el-table__row', { timeout: 15000 })
    await page.evaluate(() => window.scrollTo(0, 0))
    result.offRowIdx = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
      return rows.findIndex((tr) => tr.querySelector('.cc-inactive-mark') && !tr.querySelector('.cc-abnormal-mark'))
    })
    const vis = page.locator('.lt-row-action__ellipsis:visible')
    await vis.nth(result.offRowIdx >= 0 ? result.offRowIdx : 0).scrollIntoViewIfNeeded().catch(() => {})
    await vis.nth(result.offRowIdx >= 0 ? result.offRowIdx : 0).click({ force: true })
    await page.waitForSelector('.cc-more-popper:visible .el-dropdown-menu__item', { timeout: 5000 })
    await page.mouse.move(5, 5); await page.waitForTimeout(200)
    result.items = await page.evaluate(() => { const p = Array.from(document.querySelectorAll('.cc-more-popper')).find((x) => x.offsetParent !== null); return p ? Array.from(p.querySelectorAll('.el-dropdown-menu__item')).map((i) => ({ t: i.textContent.trim(), cls: i.className, bg: getComputedStyle(i).backgroundColor, color: getComputedStyle(i).color, fw: getComputedStyle(i).fontWeight })) : [] })
    const enable = page.locator('.cc-more-popper:visible .el-dropdown-menu__item', { hasText: '启用' }).first()
    if (await enable.count()) { await enable.hover(); await page.waitForTimeout(180)
      result.enableHover = await enable.evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, color: getComputedStyle(e).color })) }
    await page.mouse.move(5, 5); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(180)
    result.focus = await page.evaluate(() => { const a = document.activeElement; if (!a) return null; const cs = getComputedStyle(a); return { t: (a.textContent || '').trim(), isItem: a.classList.contains('el-dropdown-menu__item'), bg: cs.backgroundColor, color: cs.color } })
    await page.keyboard.press('Escape').catch(() => {})
    result.writesAfterProbeG = writes.length
  } finally {
    result.writeInterception.nonGetAttempts = writes.length
    result.writeInterception.attempts = writes
    fs.writeFileSync(`${OUT}/gap-readonly-results-g.json`, JSON.stringify(result, null, 1))
    await browser.close()
  }
  console.log('WROTE gap-readonly-results-g.json nonGetAttempts=', writes.length)
})().catch((e) => { console.error('PROBE G ERROR', e); process.exit(1) })
