/**
 * CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002
 * Read-only probe for CCFG-AC-151 (enable/disable confirm box main button).
 *
 * Opens the 启用 confirm on a FG_ACTIVE='0' row and the 停用 confirm on a
 * FG_ACTIVE='1' row, reads the box title/body/button labels and the primary
 * button's normal / hover / pressed / keyboard-focus visuals, then CANCELS.
 * The final confirm is NEVER clicked, so no write request is issued.
 *
 * Safety: BEFORE the first navigation every non-GET/HEAD/OPTIONS `/api/**`
 * request is aborted at the network layer and counted.
 */
const PW = ['/usr/lib/node_modules/openclaw/node_modules/playwright-core',
  '/data/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core',
  '/root/.hermes/hermes-agent/node_modules/playwright-core']
let chromium
for (const p of PW) { try { chromium = require(p).chromium; break } catch (e) {} }
if (!chromium) { console.error('no playwright-core'); process.exit(2) }
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'

const FRONT = process.env.S2_FRONT || 'http://127.0.0.1:5173'
const API = process.env.S2_API || 'http://127.0.0.1:8080'
const OUT = process.env.S2_OUT || '/tmp/s2-out'
const fs = require('node:fs')
fs.mkdirSync(OUT, { recursive: true })

const writes = []
const installWriteBlocker = async (context) => {
  await context.route('**/api/**', (route) => {
    const m = route.request().method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    writes.push({ method: m, url: route.request().url() })
    return route.abort('blockedbyclient')
  })
}

const BOX = () => {
  const box = Array.from(document.querySelectorAll('.el-message-box')).find((b) => b.offsetParent !== null)
  if (!box) return null
  const root = box.closest('.el-overlay-message-box') || document.body
  const cls = Array.from(document.querySelectorAll('.cc-confirm--enable, .cc-confirm--disable')).filter((e) => e.offsetParent !== null).map((e) => String(e.className))
  const btns = Array.from(box.querySelectorAll('.el-message-box__btns button.el-button'))
  const maskId = (s) => s.replace(/[A-Za-z][\w.-]*\d[\w.-]*/g, '<ID>')
  return {
    title: (box.querySelector('.el-message-box__title')?.textContent || '').trim(),
    bodyMasked: maskId((box.querySelector('.el-message-box__message')?.textContent || '').trim()),
    buttons: btns.map((b) => b.textContent.trim()),
    confirmClassNamesPresent: cls,
    bodyNoProbeId: !/[A-Za-z][\w.-]*\d[\w.-]*/.test((box.querySelector('.el-message-box__message')?.textContent || '').trim()),
  }
}

const BTN = (sel) => {
  const el = Array.from(document.querySelectorAll(sel)).find((e) => e.offsetParent !== null)
  if (!el) return null
  const cs = getComputedStyle(el)
  return { exists: true, disabled: el.disabled === true || el.classList.contains('is-disabled'), loading: el.classList.contains('is-loading'), bg: cs.backgroundColor, color: cs.color, borderRadius: cs.borderRadius, fontWeight: cs.fontWeight, borderColor: cs.borderTopColor, outline: cs.outlineWidth + ' ' + cs.outlineColor, isActiveEl: document.activeElement === el }
}

const CONFIRM_SEL = '.el-message-box__btns .el-button--primary'
const CONFIRM_PW = '.el-message-box__btns .el-button--primary:visible'

async function openMenuOn(page, rowIdx) {
  await page.locator('.cc-table .el-table__body tr.el-table__row').nth(rowIdx - 1).locator('.cc-more-link').click()
  await page.waitForSelector('.cc-more-popper:visible .el-dropdown-menu__item', { timeout: 5000 })
  await page.waitForTimeout(200)
}

async function clickMenuItem(page, text) {
  const item = page.locator('.cc-more-popper:visible .el-dropdown-menu__item', { hasText: new RegExp(`^${text}$`) }).first()
  await item.click()
  await page.waitForSelector('.el-message-box', { timeout: 5000 })
  await page.waitForTimeout(300)
}

async function cancelBox(page) {
  const cancel = page.locator('.el-message-box:visible .el-message-box__btns button.el-button', { hasText: '取消' }).first()
  await cancel.click()
  await page.waitForTimeout(300)
}

async function samplePrimary(page) {
  await page.mouse.move(4, 4)
  await page.waitForTimeout(120)
  // ElMessageBox autofocuses the primary button, so the resting state is `:focus`;
  // sample it both autofocused and after an explicit blur (true resting/normal).
  const autoFocusResting = await page.evaluate(BTN, CONFIRM_SEL)
  await page.evaluate((s) => {
    const el = Array.from(document.querySelectorAll(s)).find((e) => e.offsetParent !== null)
    if (el) el.blur()
  }, CONFIRM_SEL)
  await page.waitForTimeout(140)
  const normal = await page.evaluate(BTN, CONFIRM_SEL)
  const loc = page.locator(CONFIRM_PW)
  const box = await loc.boundingBox()
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.waitForTimeout(220)
  const hover = await page.evaluate(BTN, CONFIRM_SEL)
  await page.mouse.down()
  await page.waitForTimeout(140)
  const pressed = await page.evaluate(BTN, CONFIRM_SEL)
  await page.mouse.move(4, 4)
  await page.waitForTimeout(60)
  await page.mouse.up()
  await page.waitForTimeout(160)
  // real Tab focus: focus the 取消 button then Tab
  await page.evaluate(() => {
    const box = Array.from(document.querySelectorAll('.el-message-box')).find((b) => b.offsetParent !== null)
    const btns = Array.from(box.querySelectorAll('.el-message-box__btns button.el-button'))
    const cancel = btns.find((b) => b.textContent.trim() === '取消')
    if (cancel) cancel.focus()
  })
  await page.keyboard.press('Tab')
  await page.waitForTimeout(200)
  const focusTab = await page.evaluate(BTN, CONFIRM_SEL)
  await page.mouse.move(4, 4)
  await page.waitForTimeout(80)
  return { normal, autoFocusResting, hover, pressed, focusTab }
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true })
  const apiClients = await (await fetch(`${API}/api/clients`)).json()
  const clients = (apiClients && apiClients.data && apiClients.data.items) || []
  const offIdx = clients.findIndex((c) => c.fgActive === '0') + 1
  // 停用 confirm: prefer an enabled ('1') row; this stock env has no '1' row, so
  // fall back to a non-'0' row whose menu also offers 停用 (abnormal state).
  const onIdx = (clients.findIndex((c) => c.fgActive === '1') + 1) || (clients.findIndex((c) => c.fgActive !== '0') + 1)

  const result = {
    task: 'CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002',
    probe: 'AC-151 enable/disable confirm primary button',
    mode: 'readonly-browser-probe',
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    frontend: FRONT,
    targets: { offRowIdx: offIdx || null, onRowIdx: onIdx || null },
    writeInterception: { policy: '/api/** GET/HEAD/OPTIONS allow; POST/PUT/PATCH/DELETE abort+count', nonGetAttempts: null, attempts: [] },
    viewports: {},
  }

  for (const vp of [{ name: '1440x900', width: 1440, height: 900 }, { name: '1920x1080', width: 1920, height: 1080 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 })
    await installWriteBlocker(ctx)
    const page = await ctx.newPage()
    const out = {}
    try {
      await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
      await page.waitForSelector('.cc-table .el-table__body tr.el-table__row')
      // enable confirm (on an 'off' row, menu shows 启用)
      if (offIdx) {
        await openMenuOn(page, offIdx)
        out.enableMenuItems = await page.evaluate(() => Array.from(document.querySelectorAll('.cc-more-popper')).filter((p) => p.offsetParent !== null).flatMap((p) => Array.from(p.querySelectorAll('.el-dropdown-menu__item')).map((i) => i.textContent.trim())))
        await clickMenuItem(page, '启用')
        out.enableBox = await page.evaluate(BOX)
        out.enablePrimary = await samplePrimary(page)
        await cancelBox(page)
      }
      // disable confirm (on an 'on' row, menu shows 停用)
      if (onIdx) {
        await openMenuOn(page, onIdx)
        await clickMenuItem(page, '停用')
        out.disableBox = await page.evaluate(BOX)
        out.disablePrimary = await samplePrimary(page)
        await cancelBox(page)
      }
    } catch (e) {
      out.error = String((e && e.message) || e)
    }
    result.viewports[vp.name] = out
    await ctx.close()
  }

  result.writeInterception.nonGetAttempts = writes.length
  result.writeInterception.attempts = writes.slice(0, 20)
  await browser.close()
  fs.writeFileSync(`${OUT}/s2-confirm-results.json`, JSON.stringify(result, null, 2))
  console.log('WROTE', `${OUT}/s2-confirm-results.json`, 'writeAttempts=', writes.length)
}
run().catch((e) => { console.error(e); process.exit(1) })
