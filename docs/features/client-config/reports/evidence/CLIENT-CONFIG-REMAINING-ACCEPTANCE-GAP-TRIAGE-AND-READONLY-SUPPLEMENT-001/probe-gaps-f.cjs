/**
 * ...SUPPLEMENT-001 (probe F): read-only legs still open after A-E:
 *  - menu item hover BACKGROUND fill (EP default) on 停用 / 删除, plus keyboard-focus fill
 *  - 操作 column fixed (position/sticky) at 1440 with horizontal scroll
 *  - abnormal row at 1440: red mark computed style + geometry vs probe ID cell + menu items
 *  - API fgActive raw value for the abnormal record (GET only) matched by ID
 * Safety: non-GET /api/** aborted before navigation and counted. No save/submit.
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
  const result = { task: '...SUPPLEMENT-001', probe: 'F', mode: 'readonly-browser-probe', scope: '/config/client only',
    browser: { engine: 'chromium', version: browser.version(), headless: true, viewport: '1440x900' },
    writeInterception: { policy: 'non-GET /api/** abort+count', nonGetAttempts: null, attempts: [] } }
  const menuOf = () => Array.from(document.querySelectorAll('.cc-more-popper')).find((x) => x.offsetParent !== null)
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table .el-table__body tr.el-table__row', { timeout: 15000 })
    await page.evaluate(() => window.scrollTo(0, 0))

    // ---- 操作 column fixed check ----
    result.opColumn = await page.evaluate(() => {
      const cell = document.querySelector('.lt-row-action__cell')
      const th = Array.from(document.querySelectorAll('.cc-table .el-table__header th')).pop()
      const g = (e) => { if (!e) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { position: cs.position, right: cs.right, left: cs.left, overflow: cs.overflow, cls: e.className, rectRight: Math.round(r.right) } }
      return { cell: g(cell), lastTh: g(th), fixedClassPresent: !!(cell && /el-table-fixed-column/.test(cell.className) || cell && cell.classList.contains('lt-row-action__cell')) }
    })
    result.opColumnScroll = await page.evaluate(() => {
      const wrap = document.querySelector('.cc-table .el-table__body-wrapper') || document.querySelector('.cc-table .el-scrollbar__wrap')
      if (!wrap) return { bodyWrapperFound: false }
      const before = wrap.scrollLeft; wrap.scrollLeft = 9999; const after = wrap.scrollLeft
      const cell = document.querySelector('.lt-row-action__cell'); const r = cell ? cell.getBoundingClientRect() : null
      const vw = window.innerWidth
      return { maxScrollLeft: after, movedRight: r ? Math.round(vw - r.right) : null, stillInViewport: r ? (r.right <= vw + 0.5 && r.left >= -0.5) : null }
    })

    // ---- abnormal row geometry/style at 1440 ----
    result.abnormal1440 = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
      const i = rows.findIndex((tr) => !!tr.querySelector('.cc-abnormal-mark'))
      if (i < 0) return { idx: -1 }
      const tr = rows[i]; const mark = tr.querySelector('.cc-abnormal-mark'); const id = tr.querySelector('.cc-id')
      const cs = getComputedStyle(mark); const mr = mark.getBoundingClientRect(); const ir = id.getBoundingClientRect()
      return { idx: i, markText: mark.textContent.trim(), markColor: cs.color, markBg: cs.backgroundColor, markRadius: cs.borderRadius,
        markFontSize: cs.fontSize, markFontWeight: cs.fontWeight, markHeight: Math.round(mr.height), markWidth: Math.round(mr.width),
        gapIdToMark: Math.round(mr.left - ir.right), sameRowTop: Math.abs(mr.top - ir.top) < 6, idText: id.textContent.trim() }
    })

    // ---- menu hover/focus BACKGROUND fill ----
    const vis = page.locator('.lt-row-action__ellipsis:visible')
    await vis.nth(result.abnormal1440.idx >= 0 ? result.abnormal1440.idx : 0).scrollIntoViewIfNeeded().catch(() => {})
    await vis.nth(result.abnormal1440.idx >= 0 ? result.abnormal1440.idx : 0).click({ force: true })
    await page.waitForSelector('.cc-more-popper:visible .el-dropdown-menu__item', { timeout: 5000 })
    await page.mouse.move(5, 5); await page.waitForTimeout(200)
    result.menuFill = {
      itemTexts: await page.evaluate(() => { const p = Array.from(document.querySelectorAll('.cc-more-popper')).find((x) => x.offsetParent !== null); return p ? Array.from(p.querySelectorAll('.el-dropdown-menu__item')).map((i) => i.textContent.trim()) : [] }),
    }
    const items = page.locator('.cc-more-popper:visible .el-dropdown-menu__item')
    // normal bg of each item
    result.menuFill.normal = await page.evaluate(() => { const p = Array.from(document.querySelectorAll('.cc-more-popper')).find((x) => x.offsetParent !== null); return Array.from(p.querySelectorAll('.el-dropdown-menu__item')).map((i) => ({ t: i.textContent.trim(), bg: getComputedStyle(i).backgroundColor, color: getComputedStyle(i).color })) })
    // hover the danger (删除) item
    const danger = page.locator('.cc-more-popper:visible .el-dropdown-menu__item.cc-more-danger')
    if (await danger.count()) { await danger.first().hover(); await page.waitForTimeout(180)
      result.menuFill.dangerHover = await danger.first().evaluate((e) => { const cs = getComputedStyle(e); return { bg: cs.backgroundColor, color: cs.color } }) }
    // hover the warning (停用) item
    const warn = page.locator('.cc-more-popper:visible .el-dropdown-menu__item.cc-more-warning')
    if (await warn.count()) { await warn.first().hover(); await page.waitForTimeout(180)
      result.menuFill.warningHover = await warn.first().evaluate((e) => { const cs = getComputedStyle(e); return { bg: cs.backgroundColor, color: cs.color } }) }
    // keyboard focus fill (move mouse away, ArrowDown)
    await page.mouse.move(5, 5); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(180)
    result.menuFill.focus = await page.evaluate(() => { const a = document.activeElement; if (!a) return null; const cs = getComputedStyle(a); return { t: (a.textContent || '').trim(), isItem: a.classList.contains('el-dropdown-menu__item'), bg: cs.backgroundColor, color: cs.color } })
    await page.keyboard.press('Escape').catch(() => {})

    // ---- API fgActive raw value for the abnormal record (GET only) ----
    result.apiFgActive = await page.evaluate(async () => {
      try {
        const r = await fetch('/api/clients', { method: 'GET' }); const j = await r.json()
        const list = Array.isArray(j) ? j : (j.data || j.rows || j.list || j.result || [])
        const arr = Array.isArray(list) ? list : []
        return { status: r.status, count: arr.length, sample: arr.slice(0, 2).map((x) => ({ id: x.clientId ?? x.CLIENT_ID, fgActive: x.fgActive ?? x.FG_ACTIVE })) }
      } catch (e) { return { error: String(e).slice(0, 140) } }
    })
    result.writesAfterProbeF = writes.length
  } finally {
    result.writeInterception.nonGetAttempts = writes.length
    result.writeInterception.attempts = writes
    fs.writeFileSync(`${OUT}/gap-readonly-results-f.json`, JSON.stringify(result, null, 1))
    await browser.close()
  }
  console.log('WROTE gap-readonly-results-f.json nonGetAttempts=', writes.length)
})().catch((e) => { console.error('PROBE F ERROR', e); process.exit(1) })
