/** AC-121 network-error supplement: capture every global message shown on an aborted save. */
const fs = require('fs')
const path = require('path')
const PW = ['/root/.hermes/hermes-agent/node_modules/playwright-core', '/usr/lib/node_modules/openclaw/node_modules/playwright-core', '/data/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core']
let chromium
for (const p of PW) { try { chromium = require(p).chromium; break } catch (e) {} }
if (!chromium) { console.error('no playwright-core'); process.exit(2) }
const EXE = process.env.PROBE_CHROME || '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = 'http://127.0.0.1:5173'
const OUT = path.join(__dirname, 'ac121-network-supplement-results.json')
const result = { task: 'CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001', check: 'AC-121 network global feedback', injections: [], errors: [] }
;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  let abort = false
  await ctx.route('**/api/clients/MULTIAC-DESC', (route) => {
    const req = route.request()
    if (req.method() === 'PUT' && abort) {
      abort = false
      result.injections.push({ kind: 'network-abort', target: 'PUT /api/clients/MULTIAC-DESC', reachedBackend: false })
      return route.abort('failed')
    }
    return route.continue()
  })
  const page = await ctx.newPage()
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table tr.el-table__row')
    await page.waitForTimeout(600)
    const ids = await page.$$eval('.cc-table tr.el-table__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim()))
    const row = page.locator('.cc-table tr.el-table__row').nth(ids.indexOf('MULTIAC-DESC'))
    await row.scrollIntoViewIfNeeded()
    await row.dblclick()
    await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible' })
    await page.waitForTimeout(400)
    await page.locator('.el-dialog.cc-dialog .cc-desc-row textarea').fill('MULTIAC desc for network abort supplement')
    abort = true
    await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click()
    await page.waitForTimeout(1200)
    result.messages = (await page.locator('.el-message').allInnerTexts()).map((s) => s.trim())
    result.fieldErrorCount = await page.locator('.el-dialog.cc-dialog .ced-field-error').count()
    result.dialogStillOpen = await page.locator('.el-dialog.cc-dialog').first().isVisible()
    result.globalFeedbackPresent = result.messages.length > 0
    await page.locator('.el-dialog.cc-dialog .el-dialog__footer .el-button', { hasText: '取消' }).click()
    await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden' })
  } catch (e) { result.errors.push(String(e && e.stack ? e.stack : e)) } finally { await browser.close() }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
  console.log('WROTE ' + OUT); console.log('errors=' + result.errors.length)
  if (result.errors.length) process.exitCode = 1
})()
