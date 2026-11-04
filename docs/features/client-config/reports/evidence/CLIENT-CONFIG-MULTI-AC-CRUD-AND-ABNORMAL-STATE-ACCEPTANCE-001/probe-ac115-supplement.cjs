/** AC-115 supplement: after an incomplete-form click, move the pointer away and re-read the
 *  submit button so the non-hover (base) black state is recorded explicitly. No writes expected. */
const fs = require('fs')
const path = require('path')
const PW = ['/root/.hermes/hermes-agent/node_modules/playwright-core', '/usr/lib/node_modules/openclaw/node_modules/playwright-core', '/data/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core']
let chromium
for (const p of PW) { try { chromium = require(p).chromium; break } catch (e) {} }
if (!chromium) { console.error('no playwright-core'); process.exit(2) }
const EXE = process.env.PROBE_CHROME || '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = 'http://127.0.0.1:5173'
const OUT = path.join(__dirname, 'ac115-supplement-results.json')
const result = { task: 'CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001', check: 'AC-115 pointer-away base state', writes: [], errors: [] }
async function style(page) {
  return page.locator('.el-dialog.cc-dialog .cc-dialog-submit').evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, color: cs.color,
      borderRadius: cs.borderRadius, fontWeight: cs.fontWeight, cursor: cs.cursor,
      classes: el.className, disabledAttr: el.hasAttribute('disabled'), text: (el.textContent || '').trim(),
    }
  })
}
;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on('request', (req) => {
    const u = req.url(); const m = req.method()
    if (!u.includes('/api/') || ['GET', 'HEAD', 'OPTIONS'].includes(m)) return
    let p = u; try { p = new URL(u).pathname } catch (e) {}
    result.writes.push({ method: m, path: p })
  })
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table tr.el-table__row')
    await page.waitForTimeout(600)
    await page.locator('.cc-btn-add').click()
    await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible' })
    await page.waitForTimeout(500)
    result.baseBeforeClick = await style(page)
    await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click()
    await page.waitForTimeout(600)
    result.fieldErrorCount = await page.locator('.el-dialog.cc-dialog .ced-field-error').count()
    result.fieldErrors = (await page.locator('.el-dialog.cc-dialog .ced-field-error').allInnerTexts()).map((s) => s.trim()).filter(Boolean)
    await page.mouse.move(5, 5)
    await page.waitForTimeout(500)
    result.baseAfterPointerAway = await style(page)
    await page.locator('.el-dialog.cc-dialog .el-dialog__footer .el-button', { hasText: '取消' }).click()
    await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden' })
    result.writeCount = result.writes.length
  } catch (e) { result.errors.push(String(e && e.stack ? e.stack : e)) } finally { await browser.close() }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
  console.log('WROTE ' + OUT); console.log('errors=' + result.errors.length)
  if (result.errors.length) process.exitCode = 1
})()
