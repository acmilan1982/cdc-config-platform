/** ...SUPPLEMENT-001 (probe D): pagination absence, warning-item hover, menu item keyboard focus, ID-input paste/illegal-char read-only checks. */
const PW = ['/usr/lib/node_modules/openclaw/node_modules/playwright-core',
  '/data/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core',
  '/root/.hermes/hermes-agent/node_modules/playwright-core']
let chromium
for (const p of PW) { try { chromium = require(p).chromium; break } catch (e) {} }
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = process.env.GAP_FRONT || 'http://127.0.0.1:5173'
const OUT = process.env.GAP_OUT || '/tmp/gap-probe-out'
const fs = require('node:fs')
fs.mkdirSync(OUT, { recursive: true })
const writes = []
;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  await context.route('**/api/**', (route) => {
    const m = route.request().method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    writes.push({ method: m, url: route.request().url() }); return route.abort('blockedbyclient')
  })
  const page = await context.newPage()
  const result = { task: '...SUPPLEMENT-001', probe: 'D', mode: 'readonly-browser-probe', scope: '/config/client only',
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    writeInterception: { policy: 'non-GET /api/** abort+count', nonGetAttempts: null, attempts: [] } }
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table .el-table__body tr.el-table__row', { timeout: 15000 })
    await page.evaluate(() => window.scrollTo(0, 0))
    result.pagination = await page.evaluate(() => ({
      elPaginationCount: document.querySelectorAll('.el-pagination, .cc-pager, [class*="pagination"]').length,
      pageSizeSelect: !!document.querySelector('.el-select.cc-page-size, .el-pagination__sizes'),
      totalTexts: (document.body.innerText.match(/共\s*\d+\s*条/g) || []),
    }))
    // 更多 menu on the last visible trigger (warning item present) -> hover warning + item keyboard focus style
    const vis = page.locator('.lt-row-action__ellipsis:visible')
    const nv = await vis.count()
    await vis.nth(nv - 1).scrollIntoViewIfNeeded().catch(() => {})
    await vis.nth(nv - 1).click({ force: true })
    await page.waitForTimeout(400)
    result.menuHoverAndFocus = await (async () => {
      const out = {}
      try {
        const w = page.locator('.cc-more-popper:visible .el-dropdown-menu__item.cc-more-warning')
        if (await w.count()) { const before = await w.first().evaluate((e) => getComputedStyle(e).color); await w.first().hover(); await page.waitForTimeout(150); out.warningNormal = before; out.warningHover = await w.first().evaluate((e) => getComputedStyle(e).color) }
      } catch (e) { out.warningError = String(e).slice(0, 120) }
      try {
        await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150)
        out.itemFocus = await page.evaluate(() => { const a = document.activeElement; if (!a) return null; const cs = getComputedStyle(a); return { isMenuItem: a.classList.contains('el-dropdown-menu__item'), bg: cs.backgroundColor, color: cs.color, outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor } })
      } catch (e) { out.focusError = String(e).slice(0, 120) }
      return out
    })()
    await page.keyboard.press('Escape').catch(() => {})
    await page.mouse.click(4, 4).catch(() => {})
    await page.waitForTimeout(250)
    // ID input paste (via insertText) and illegal char, read-only (no submit)
    await page.locator('.cc-btn-add').click()
    await page.waitForSelector('.cc-dialog .cc-id-control input', { timeout: 5000 })
    await page.waitForTimeout(250)
    const idIn = page.locator('.cc-id-control input')
    await idIn.click()
    await idIn.evaluate((el) => el.focus())
    await page.keyboard.insertText('x'.repeat(40))
    await page.waitForTimeout(200)
    result.idInserted = await page.evaluate(() => ({ requested: 40, actual: document.querySelector('.cc-id-control input').value.length }))
    await idIn.fill('')
    await page.keyboard.insertText('ab cd@中文')
    await page.waitForTimeout(200)
    result.idIllegalTyped = await page.evaluate(() => {
      const el = document.querySelector('.cc-id-control input')
      return { value: el.value, hasSpace: el.value.includes(' '), hasAt: el.value.includes('@'), hasCJK: /[一-龥]/.test(el.value) }
    })
    // click submit with illegal id -> client-side field error (no network write)
    await page.locator('.ced-submit').click()
    await page.waitForTimeout(500)
    result.idIllegalSubmit = await page.evaluate(() => {
      const errs = Array.from(document.querySelectorAll('.cc-dialog .ced-field-error')).map((e) => (e.textContent || '').trim())
      return { fieldErrors: errs, inputValueNow: document.querySelector('.cc-id-control input').value }
    })
    result.writesAfterProbeD = writes.length
    await page.keyboard.press('Escape').catch(() => {})
  } finally {
    result.writeInterception.nonGetAttempts = writes.length
    result.writeInterception.attempts = writes
    fs.writeFileSync(`${OUT}/gap-readonly-results-d.json`, JSON.stringify(result, null, 1))
    await browser.close()
  }
  console.log('WROTE gap-readonly-results-d.json nonGetAttempts=', writes.length)
})().catch((e) => { console.error('PROBE D ERROR', e); process.exit(1) })
