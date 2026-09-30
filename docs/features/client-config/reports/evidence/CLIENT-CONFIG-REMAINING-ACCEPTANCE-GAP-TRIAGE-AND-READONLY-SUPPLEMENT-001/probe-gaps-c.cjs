/**
 * ...SUPPLEMENT-001 (probe C): row state census + 更多 menu structure incl. the
 * EP divider (sibling li[role=separator]) on VISIBLE triggers only.
 */
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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await context.route('**/api/**', (route) => {
    const m = route.request().method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    writes.push({ method: m, url: route.request().url() }); return route.abort('blockedbyclient')
  })
  const page = await context.newPage()
  const result = { task: '...SUPPLEMENT-001', probe: 'C', mode: 'readonly-browser-probe', scope: '/config/client only',
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    writeInterception: { policy: 'non-GET /api/** abort+count', nonGetAttempts: null, attempts: [] } }
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table .el-table__body tr.el-table__row', { timeout: 15000 })
    await page.evaluate(() => window.scrollTo(0, 0))
    result.census = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
      return rows.map((tr, i) => ({
        idx: i + 1,
        inactiveMark: !!tr.querySelector('.cc-inactive-mark'),
        abnormalMark: !!tr.querySelector('.cc-abnormal-mark'),
        abnormalText: tr.querySelector('.cc-abnormal-mark')?.textContent.trim() || null,
        tagCount: tr.querySelectorAll('.cc-dstag').length,
        plus: tr.querySelector('.cc-more')?.textContent.trim() || null,
        ambiguous: !!tr.querySelector('.cc-rowbad'),
      }))
    })
    // count visible vs hidden ellipsis
    const vis = page.locator('.lt-row-action__ellipsis:visible')
    result.ellipsis = { total: await page.locator('.lt-row-action__ellipsis').count(), visible: await vis.count() }

    const MENU = () => {
      const p = Array.from(document.querySelectorAll('.cc-more-popper')).find((x) => x.offsetParent !== null)
      if (!p) return { open: false }
      const seps = Array.from(p.querySelectorAll('li[role="separator"]'))
      const items = Array.from(p.querySelectorAll('.el-dropdown-menu__item'))
      const menu = p.querySelector('.el-dropdown-menu')
      return {
        open: true,
        placement: p.getAttribute('data-popper-placement'),
        rect: (() => { const r = p.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) } })(),
        menuChildren: Array.from(menu?.children || []).map((c) => ({ tag: c.tagName, role: c.getAttribute('role'), text: (c.textContent || '').trim().slice(0, 6), borderTopWidth: getComputedStyle(c).borderTopWidth, borderTopStyle: getComputedStyle(c).borderTopStyle, height: Math.round(c.getBoundingClientRect().height), margin: getComputedStyle(c).margin })),
        separatorCount: seps.length,
        itemTexts: items.map((i) => i.textContent.trim()),
        itemColors: items.map((i) => ({ text: i.textContent.trim(), color: getComputedStyle(i).color, fontWeight: getComputedStyle(i).fontWeight })),
        borderRadius: getComputedStyle(p).borderRadius,
        boxShadow: getComputedStyle(p).boxShadow,
        menuPadding: menu ? getComputedStyle(menu).padding : null,
      }
    }
    // open on first visible trigger, then on the last visible trigger (clipping)
    const openBy = async (i) => { await vis.nth(i).scrollIntoViewIfNeeded().catch(() => {}); await vis.nth(i).click({ force: true }); await page.waitForTimeout(400) }
    const close = async () => { await page.keyboard.press('Escape').catch(() => {}); await page.mouse.click(4, 4).catch(() => {}); await page.waitForTimeout(250) }
    await openBy(0); result.menuRow1 = await page.evaluate(MENU); await close()
    await openBy(3); result.menuRow4 = await page.evaluate(MENU); await close()
    await openBy(12); result.menuRow13 = await page.evaluate(MENU); await close()
    const nv = await vis.count()
    await openBy(nv - 1); result.menuLastRow = await page.evaluate(MENU); await close()
    result.menuLastRow = { ...(result.menuLastRow || {}), vw: 1440, vh: 900, visibleTriggerIndex: nv - 1 }
  } finally {
    result.writeInterception.nonGetAttempts = writes.length
    result.writeInterception.attempts = writes
    fs.writeFileSync(`${OUT}/gap-readonly-results-c.json`, JSON.stringify(result, null, 1))
    await browser.close()
  }
  console.log('WROTE gap-readonly-results-c.json nonGetAttempts=', writes.length)
})().catch((e) => { console.error('PROBE C ERROR', e); process.exit(1) })
