/**
 * CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001 (probe B)
 * Focused read-only follow-up on /config/client ONLY:
 *  - 更多 menu on an ENABLED row: item order, divider (EP renders a sibling
 *    li[role=separator].el-dropdown-menu__item--divided), colours, hover colours
 *  - keyboard open/traverse/close of the menu
 *  - menu clipping at the last row, measured on the VISIBLE popper
 *  - confirm dialog primary button in its NORMAL (non-hover) state, then CANCEL
 *  - edit-mode dialog: 修改探针 ID / 自动生成 / 取消 are NOT black; submit is black
 * Safety: non-GET /api/** aborted before navigation and counted. No submit, no
 * destructive confirm (only open + cancel / Esc-close).
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
  const result = {
    task: 'CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001',
    probe: 'B', mode: 'readonly-browser-probe', scope: '/config/client only',
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    writeInterception: { policy: 'non-GET /api/** abort+count', nonGetAttempts: null, attempts: [] },
  }
  const MENU_EVAL = () => {
    const poppers = Array.from(document.querySelectorAll('.cc-more-popper'))
    const popper = poppers.find((p) => p.offsetParent !== null) || poppers[poppers.length - 1]
    if (!popper) return null
    const seps = Array.from(popper.querySelectorAll('li[role="separator"]'))
    const items = Array.from(popper.querySelectorAll('.el-dropdown-menu__item'))
    const kids = Array.from(popper.querySelector('.el-dropdown-menu')?.children || []).map((c) => ({ tag: c.tagName, role: c.getAttribute('role'), cls: c.className }))
    return {
      popperVisible: popper.offsetParent !== null,
      popperClassName: popper.className,
      placement: popper.getAttribute('data-popper-placement'),
      rect: (() => { const r = popper.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) } })(),
      menuChildren: kids,
      separatorCount: seps.length,
      separators: seps.map((s) => { const cs = getComputedStyle(s); return { borderTopWidth: cs.borderTopWidth, borderTopStyle: cs.borderTopStyle, borderTopColor: cs.borderTopColor, height: Math.round(s.getBoundingClientRect().height), margin: cs.margin } }),
      itemTexts: items.map((i) => i.textContent.trim()),
      items: items.map((i) => { const cs = getComputedStyle(i); return { text: i.textContent.trim(), cls: i.className, color: cs.color, fontWeight: cs.fontWeight, isDisabled: i.classList.contains('is-disabled'), borderRadius: cs.borderRadius, padding: cs.padding } }),
    }
  }
  const openMenuAt = async (idx) => {
    const t = page.locator('.lt-row-action__ellipsis').nth(idx)
    await t.scrollIntoViewIfNeeded().catch(() => {})
    await t.click({ force: true })
    await page.waitForSelector('.cc-more-popper .el-dropdown-menu__item', { timeout: 5000 })
    await page.waitForTimeout(250)
  }
  const closeMenu = async () => { await page.keyboard.press('Escape').catch(() => {}); await page.mouse.click(4, 4).catch(() => {}); await page.waitForTimeout(250) }

  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table .el-table__body tr.el-table__row', { timeout: 15000 })
    await page.evaluate(() => window.scrollTo(0, 0))

    // find an ENABLED row (no 停用 mark, no abnormal mark) and a DISABLED row
    result.rowClassification = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
      let enabled = null, disabled = null, abnormal = null
      rows.forEach((tr, i) => {
        const off = !!tr.querySelector('.cc-inactive-mark')
        const abn = !!tr.querySelector('.cc-abnormal-mark')
        if (off && disabled === null) disabled = i
        else if (abn && abnormal === null) abnormal = i
        else if (!off && !abn && enabled === null) enabled = i
      })
      return { enabledIdx: enabled, disabledIdx: disabled, abnormalIdx: abnormal, rowCount: rows.length }
    })

    // ---- enabled-row menu + divider ----
    try {
      await openMenuAt(result.rowClassification.enabledIdx ?? 1)
      result.menuEnabled = await page.evaluate(MENU_EVAL)
    } catch (e) { result.menuEnabled = { error: String(e).slice(0, 200) } }
    // hover warning (停用) and danger (删除) on the enabled-row menu
    try {
      const out = {}
      const w = page.locator('.cc-more-popper:visible .el-dropdown-menu__item.cc-more-warning')
      if (await w.count()) { await w.first().hover(); await page.waitForTimeout(150); out.warningHoverColor = await w.first().evaluate((e) => getComputedStyle(e).color) }
      const d = page.locator('.cc-more-popper:visible .el-dropdown-menu__item.cc-more-danger')
      if (await d.count()) { await d.first().hover(); await page.waitForTimeout(150); out.dangerHoverColor = await d.first().evaluate((e) => getComputedStyle(e).color) }
      result.menuHoverEnabled = out
    } catch (e) { result.menuHoverEnabled = { error: String(e).slice(0, 200) } }

    // ---- keyboard open / traverse / close on the enabled row ----
    try {
      await closeMenu()
      await page.evaluate((i) => document.querySelectorAll('.lt-row-action__ellipsis')[i].focus(), result.rowClassification.enabledIdx ?? 1)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(400)
      const openedByEnter = await page.evaluate(() => !!document.querySelector('.cc-more-popper .el-dropdown-menu__item'))
      const traversal = []
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150)
        traversal.push(await page.evaluate(() => { const a = document.activeElement; return a ? { text: (a.textContent || '').trim().slice(0, 8), isMenuItem: a.classList.contains('el-dropdown-menu__item') } : null }))
      }
      const focusBeforeEsc = await page.evaluate(() => { const a = document.activeElement; return { cls: a ? a.className : null, isMenuItem: a ? a.classList.contains('el-dropdown-menu__item') : false } })
      await page.keyboard.press('Escape'); await page.waitForTimeout(400)
      const closedByEsc = await page.evaluate(() => !Array.from(document.querySelectorAll('.cc-more-popper')).some((p) => p.offsetParent !== null))
      result.menuKeyboardEnabled = { openedByEnter, traversal, focusBeforeEsc, closedByEsc }
    } catch (e) { result.menuKeyboardEnabled = { error: String(e).slice(0, 200) } }
    await closeMenu()

    // ---- clipping on LAST row (visible popper) ----
    try {
      const n = await page.locator('.lt-row-action__ellipsis').count()
      await openMenuAt(n - 1)
      result.menuClippingLast = await page.evaluate((vw, vh) => {
        const p = Array.from(document.querySelectorAll('.cc-more-popper')).find((x) => x.offsetParent !== null)
        if (!p) return { found: false }
        const r = p.getBoundingClientRect()
        return { found: true, left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), vw, vh, inViewport: r.left >= -1 && r.top >= -1 && r.right <= vw + 1 && r.bottom <= vh + 1, placement: p.getAttribute('data-popper-placement') }
      }, 1440, 900)
    } catch (e) { result.menuClippingLast = { error: String(e).slice(0, 200) } }
    await closeMenu()

    // ---- confirm dialog (open + cancel), primary button NORMAL state ----
    try {
      const wBefore = writes.length
      await openMenuAt(result.rowClassification.disabledIdx ?? 0)
      const items = page.locator('.cc-more-popper:visible .el-dropdown-menu__item')
      const cnt = await items.count()
      let kind = null
      for (let i = 0; i < cnt; i++) { const t = (await items.nth(i).textContent()).trim(); if (t === '启用' || t === '停用') { kind = t; await items.nth(i).click(); break } }
      await page.waitForSelector('.el-message-box', { timeout: 5000 }).catch(() => {})
      await page.mouse.move(5, 5)
      await page.waitForTimeout(300)
      result.confirmEnabled = await page.evaluate(() => {
        const box = document.querySelector('.el-message-box')
        if (!box) return null
        const primary = box.querySelector('.el-message-box__btns .el-button--primary')
        const cancel = Array.from(box.querySelectorAll('.el-message-box__btns .el-button')).find((b) => !b.classList.contains('el-button--primary'))
        return {
          customClass: box.className,
          title: box.querySelector('.el-message-box__title')?.textContent.trim(),
          bodyMatches: /确定(启用|停用)探针/.test(box.querySelector('.el-message-box__message')?.textContent || ''),
          btnTexts: Array.from(box.querySelectorAll('.el-message-box__btns .el-button')).map((b) => b.textContent.trim()),
          primaryNormal: primary ? { bg: getComputedStyle(primary).backgroundColor, color: getComputedStyle(primary).color, radius: getComputedStyle(primary).borderRadius, fontWeight: getComputedStyle(primary).fontWeight, isPrimary: true } : null,
          cancel: cancel ? { bg: getComputedStyle(cancel).backgroundColor, color: getComputedStyle(cancel).color } : null,
        }
      })
      result.confirmKind = kind
      await page.locator('.el-message-box__btns .el-button', { hasText: '取消' }).first().click().catch(() => {})
      await page.waitForTimeout(400)
      result.confirmCanceled = await page.evaluate(() => !document.querySelector('.el-message-box'))
      result.confirmWritesDelta = writes.length - wBefore
    } catch (e) { result.confirmEnabled = { error: String(e).slice(0, 200) } }
    await closeMenu()

    // ---- edit-mode dialog: cancel/autogen/toggle NOT black; submit black ----
    try {
      await page.locator('.cc-table .el-table__body tr.el-table__row').nth(result.rowClassification.enabledIdx ?? 1).locator('td').nth(2).dblclick()
      await page.waitForSelector('.cc-dialog .cc-desc-row textarea', { timeout: 5000 })
      await page.waitForTimeout(300)
      result.editDialog = await page.evaluate(() => {
        const g = (sel) => { const e = document.querySelector(sel); return e ? { bg: getComputedStyle(e).backgroundColor, color: getComputedStyle(e).color, text: e.textContent.trim().slice(0, 12) } : null }
        return {
          title: document.querySelector('.cc-dialog .el-dialog__title')?.textContent.trim() || null,
          submit: g('.cc-dialog .ced-submit'),
          cancel: g('.el-dialog__footer .el-button:not(.ced-submit)'),
          autogen: g('.cc-autogen'),
          idToggle: g('.cc-id-toggle'),
          idInputDisabled: !!document.querySelector('.cc-id-control input[data-locked="true"]'),
        }
      })
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(300)
    } catch (e) { result.editDialog = { error: String(e).slice(0, 200) } }
  } finally {
    result.writeInterception.nonGetAttempts = writes.length
    result.writeInterception.attempts = writes
    fs.writeFileSync(`${OUT}/gap-readonly-results-b.json`, JSON.stringify(result, null, 1))
    await browser.close()
  }
  console.log('WROTE gap-readonly-results-b.json nonGetAttempts=', writes.length)
})().catch((e) => { console.error('PROBE B ERROR', e); process.exit(1) })
