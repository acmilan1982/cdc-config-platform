/**
 * ...SUPPLEMENT-001 (probe E): read-only follow-ups not covered by probes A-D:
 *  - row dblclick -> edit dialog opens (title/lock state)
 *  - 自动生成 on a real selection: confirm-dialog absence, desc overwrite, comma join
 *  - desc non-linkage after chip add/remove; second click overwrites
 *  - 修改探针 ID toggle enables the ID input (no save)
 *  - abnormal-row 更多 menu items at 1920x1080
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
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  await context.route('**/api/**', (route) => {
    const m = route.request().method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    writes.push({ method: m, url: route.request().url() })
    return route.abort('blockedbyclient')
  })
  const page = await context.newPage()
  const result = { task: '...SUPPLEMENT-001', probe: 'E', mode: 'readonly-browser-probe', scope: '/config/client only',
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    writeInterception: { policy: 'non-GET /api/** abort+count', nonGetAttempts: null, attempts: [] } }
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table .el-table__body tr.el-table__row', { timeout: 15000 })
    await page.evaluate(() => window.scrollTo(0, 0))

    // ---- row dblclick -> edit dialog ----
    const firstIdText = await page.locator('.cc-table .el-table__body tr.el-table__row').first().locator('.cc-id').textContent()
    await page.locator('.cc-table .el-table__body tr.el-table__row').first().locator('td').nth(1).dblclick()
    await page.waitForSelector('.cc-dialog .cc-desc-row textarea', { timeout: 5000 })
    await page.waitForTimeout(300)
    result.editFromRow = await page.evaluate(() => ({
      title: document.querySelector('.cc-dialog .el-dialog__title')?.textContent.trim() || null,
      idInputLocked: !!document.querySelector('.cc-id-control input[data-locked="true"]'),
      idValue: document.querySelector('.cc-id-control input')?.value || null,
      toggleText: document.querySelector('.cc-id-toggle')?.textContent.trim() || null,
    }))
    result.editOpenedIdMatchesRow = (result.editFromRow.idValue || '').trim() === (firstIdText || '').trim()

    // ---- 修改探针 ID toggle enables the input (still edit mode, no save) ----
    result.idToggle = await (async () => {
      const before = await page.evaluate(() => ({ locked: !!document.querySelector('.cc-id-control input[data-locked="true"]'), disabled: document.querySelector('.cc-id-control input')?.disabled }))
      if (await page.locator('.cc-dialog .cc-id-toggle').count()) {
        await page.locator('.cc-dialog .cc-id-toggle').click()
        await page.waitForTimeout(200)
      }
      const after = await page.evaluate(() => ({ locked: !!document.querySelector('.cc-id-control input[data-locked="true"]'), disabled: document.querySelector('.cc-id-control input')?.disabled, value: document.querySelector('.cc-id-control input')?.value, toggleText: document.querySelector('.cc-id-toggle')?.textContent.trim() }))
      if (await page.locator('.cc-dialog .cc-id-toggle').count()) { await page.locator('.cc-dialog .cc-id-toggle').click(); await page.waitForTimeout(150) }
      return { before, after }
    })()

    // ---- 自动生成 on a real selection (read-only) ----
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(200)
    await page.locator('.cc-btn-add').click()
    await page.waitForSelector('.cc-dialog .cc-pane--options button.cc-opt', { timeout: 5000 })
    await page.waitForTimeout(300)
    result.optionPool = await page.evaluate(() => {
      const opts = Array.from(document.querySelectorAll('.cc-dialog .cc-pane--options button.cc-opt'))
      return { total: opts.length, selectable: opts.filter((o) => !o.disabled).length, disabled: opts.filter((o) => o.disabled).length,
        reasons: Array.from(new Set(opts.filter((o) => o.disabled).map((o) => (o.querySelector('.cc-opt-reason')?.textContent || '').trim().slice(0, 24)))) }
    })
    // select first 3 selectable options
    const sel = page.locator('.cc-dialog .cc-pane--options button.cc-opt:not([disabled])')
    const nsel = Math.min(3, await sel.count())
    const pickedOrgs = []
    for (let i = 0; i < nsel; i++) {
      const main = (await sel.nth(i).locator('.cc-opt-main').textContent() || '').trim()
      pickedOrgs.push(main)
      await sel.nth(i).click({ force: true })
      await page.waitForTimeout(120)
    }
    // prefill desc with junk
    const ta = page.locator('.cc-dialog .cc-desc-row textarea')
    await ta.click(); await ta.fill('PRE-EXISTING-JUNK')
    const chosenBefore = await page.evaluate(() => Array.from(document.querySelectorAll('.cc-dialog .cc-chip')).map((c) => c.textContent.trim()))
    await page.locator('.cc-dialog .cc-autogen').click()
    await page.waitForTimeout(300)
    result.autoGenerate = await page.evaluate(() => ({
      confirmDialogShown: !!document.querySelector('.el-message-box'),
      desc: document.querySelector('.cc-dialog .cc-desc-row textarea')?.value || '',
      chosenCount: document.querySelectorAll('.cc-dialog .cc-chip').length,
    }))
    result.autoGenerate.pickedOrgs = pickedOrgs
    result.autoGenerate.chosenBefore = chosenBefore
    result.autoGenerate.descHasSpaceAfterComma = /,\s/.test(result.autoGenerate.desc)
    result.autoGenerate.descHasDoubleComma = /,,/.test(result.autoGenerate.desc)
    result.autoGenerate.fragmentCount = result.autoGenerate.desc ? result.autoGenerate.desc.split(',').length : 0

    // ---- desc non-linkage: remove a chip, desc should NOT change until re-click ----
    result.nonLinkage = await (async () => {
      const before = await page.evaluate(() => document.querySelector('.cc-dialog .cc-desc-row textarea')?.value || '')
      const closable = page.locator('.cc-dialog .cc-chip .el-tag__close')
      if (await closable.count()) { await closable.first().click({ force: true }); await page.waitForTimeout(250) }
      const afterRemove = await page.evaluate(() => ({ desc: document.querySelector('.cc-dialog .cc-desc-row textarea')?.value || '', chips: document.querySelectorAll('.cc-dialog .cc-chip').length }))
      await page.locator('.cc-dialog .cc-autogen').click(); await page.waitForTimeout(250)
      const afterReclick = await page.evaluate(() => ({ desc: document.querySelector('.cc-dialog .cc-desc-row textarea')?.value || '', chips: document.querySelectorAll('.cc-dialog .cc-chip').length }))
      return { descBefore: before, descChangedAfterRemove: afterRemove.desc !== before, afterRemove, afterReclick }
    })()

    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(250)

    // ---- abnormal-row menu items (1920x1080) ----
    result.abnormalRow = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
      const i = rows.findIndex((tr) => !!tr.querySelector('.cc-abnormal-mark'))
      return { idx: i, markText: i >= 0 ? rows[i].querySelector('.cc-abnormal-mark')?.textContent.trim() : null,
        idText: i >= 0 ? rows[i].querySelector('.cc-id')?.textContent.trim() : null }
    })
    if (result.abnormalRow.idx >= 0) {
      const vis = page.locator('.lt-row-action__ellipsis:visible')
      await vis.nth(result.abnormalRow.idx).scrollIntoViewIfNeeded().catch(() => {})
      await vis.nth(result.abnormalRow.idx).click({ force: true })
      await page.waitForTimeout(400)
      result.abnormalRow.menu = await page.evaluate(() => {
        const p = Array.from(document.querySelectorAll('.cc-more-popper')).find((x) => x.offsetParent !== null)
        if (!p) return { open: false }
        return { open: true, itemTexts: Array.from(p.querySelectorAll('.el-dropdown-menu__item')).map((i) => i.textContent.trim()) }
      })
      await page.keyboard.press('Escape').catch(() => {})
    }
    result.writesAfterProbeE = writes.length
  } finally {
    result.writeInterception.nonGetAttempts = writes.length
    result.writeInterception.attempts = writes
    fs.writeFileSync(`${OUT}/gap-readonly-results-e.json`, JSON.stringify(result, null, 1))
    await browser.close()
  }
  console.log('WROTE gap-readonly-results-e.json nonGetAttempts=', writes.length)
})().catch((e) => { console.error('PROBE E ERROR', e); process.exit(1) })
