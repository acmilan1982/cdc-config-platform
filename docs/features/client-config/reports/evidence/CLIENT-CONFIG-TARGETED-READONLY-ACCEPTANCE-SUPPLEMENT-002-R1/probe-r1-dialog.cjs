/**
 * CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002-R1
 * Read-only browser probe focused on two items only:
 *   R1-01  CCFG-AC-124  EDIT mode full sequence:
 *          清空既有已选项(未选 0) → 选中 1 → 全部取消 → 本地校验错误 → 修正消除
 *          at 1440x900 / 1920x1080 / 900x800. Create-mode S0..S4 is reused from
 *          the R0 evidence and is NOT re-run.
 *   R1-02  CCFG-AC-130  REAL clipboard paste (Control+V) at 1440x900, with an
 *          in-page read-only event observer (paste / beforeinput / input).
 *
 * Safety: BEFORE the first navigation, every non-GET/HEAD/OPTIONS request to
 * `/api/**` is aborted at the network layer and counted. The edit dialog is
 * opened and CANCELLED only. The single submit click happens on a form that
 * fails LOCAL validation (no data source), which returns before any request is
 * issued. After correcting, the form is NEVER submitted again. No fixture is
 * created; no database / ZooKeeper / Kafka is touched; no other page is loaded.
 *
 * Clipboard: a one-off browser context is granted `clipboard-read` /
 * `clipboard-write`; synthetic text is written through the browser Clipboard API
 * (`navigator.clipboard.writeText`) and pasted with a REAL Control+V shortcut.
 * `dispatchEvent(new ClipboardEvent)` / direct value assignment / page.fill()
 * are NOT used to produce the paste. Only draft text is entered, never saved.
 *
 * Desensitization: business-identifiable values (org names, raw probe ids, raw
 * data-source ids) are never captured; only presence/booleans/geometry/counts,
 * event metadata and static UI copy are recorded.
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
const OUT = process.env.S2_OUT || '/tmp/s2-r1-out'
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

/* ------------------------- in-browser readers ------------------------- */

const DIALOG_SNAP = () => {
  const round = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)
  const dlg = document.querySelector('.el-dialog.cc-dialog')
  if (!dlg) return null
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height), right: round(r.right), bottom: round(r.bottom) } }
  const footer = dlg.querySelector('.el-dialog__footer')
  const btns = footer ? Array.from(footer.querySelectorAll('button.el-button')) : []
  const chips = Array.from(dlg.querySelectorAll('.cc-chip'))
  const fb = dlg.querySelector('.cc-source-field .cc-field-feedback__text')
  const fbEl = fb ? { text: fb.textContent.trim(), tone: fb.classList.contains('ced-field-error') ? 'error' : 'hint', role: fb.getAttribute('role') } : null
  return {
    dialog: rect(dlg),
    title: (dlg.querySelector('.el-dialog__title')?.textContent || '').trim(),
    footer: footer ? rect(footer) : null,
    footerButtons: btns.map((b) => ({ text: b.textContent.trim(), ...rect(b) })),
    chosenCount: chips.length,
    badChipCount: chips.filter((c) => c.classList.contains('cc-chip--bad')).length,
    sourceFeedback: fbEl,
    errCount: dlg.querySelectorAll('.ced-field-error').length,
    idErrorTexts: Array.from(dlg.querySelectorAll('.ced-field-error')).map((e) => e.textContent.trim()),
  }
}

// Description textarea limits for AC-130
const DESC_META = () => {
  const ta = document.querySelector('.el-dialog.cc-dialog .cc-desc-row textarea')
  if (!ta) return null
  const v = ta.value
  const cps = Array.from(v)
  const last = cps[cps.length - 1]
  const lastCode = last ? last.codePointAt(0) : null
  return {
    placeholder: ta.getAttribute('placeholder'),
    maxlengthAttr: ta.getAttribute('maxlength'),
    valueCodePoints: cps.length,
    valueUtf16Units: v.length,
    utf8Bytes: new TextEncoder().encode(v).length,
    lastCodePoint: lastCode,
    lastIsLoneSurrogate: lastCode !== null && lastCode >= 0xd800 && lastCode <= 0xdfff,
    hasLoneSurrogateAnywhere: cps.some((c) => { const n = c.codePointAt(0); return n >= 0xd800 && n <= 0xdfff }),
  }
}

/* --------------------------- page helpers --------------------------- */

async function waitDialog(page) {
  await page.waitForSelector('.el-dialog.cc-dialog:visible .cc-form', { timeout: 6000 })
  await page.waitForTimeout(350)
}

async function cancelDialog(page) {
  const btn = page.locator('.el-dialog.cc-dialog:visible .el-dialog__footer button.el-button', { hasText: '取消' }).first()
  await btn.click()
  await page.waitForSelector('.el-dialog.cc-dialog:visible', { state: 'detached', timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(250)
}

async function openEdit(page, clientId) {
  const idx = await page.evaluate((id) => {
    const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
    return rows.findIndex((tr) => tr.querySelector('.cc-src')?.getAttribute('data-client-id') === id)
  }, clientId)
  if (idx < 0) throw new Error('edit row not found')
  await page.locator('.cc-table .el-table__body tr.el-table__row').nth(idx).locator('td.el-table__cell').nth(2).dblclick()
  await waitDialog(page)
}

async function clearAllChips(page) {
  let guard = 0
  while ((await page.locator('.el-dialog.cc-dialog:visible .cc-chip').count()) > 0 && guard++ < 40) {
    await page.locator('.el-dialog.cc-dialog:visible .cc-chip .el-tag__close').first().click()
    await page.waitForTimeout(120)
  }
}

/* --------------------------- AC-124 edit --------------------------- */

// Full EDIT sequence: existing -> cleared(0) -> 1 -> cleared(0) -> submit(local
// error) -> correct(1). Each atomic action is snapshotted independently.
async function runEditSequence(page) {
  const seq = []
  const snap = async (state) => { seq.push({ state, ...(await page.evaluate(DIALOG_SNAP)) }) }

  // 1) clear the pre-existing selection; record the "未选" initial state
  await clearAllChips(page)
  await snap('E0-unselected-after-clear')
  // 2) select exactly one
  await page.locator('.el-dialog.cc-dialog:visible .cc-opt:not(:disabled)').first().click()
  await page.waitForTimeout(200)
  await snap('E1-one-selected')
  // 3) remove all again
  await clearAllChips(page)
  await snap('E2-all-cleared')
  // 4) submit -> local validation error (no source). Must not reach network.
  await page.locator('.el-dialog.cc-dialog:visible .cc-dialog-submit').click()
  await page.waitForTimeout(350)
  await snap('E3-submit-local-error')
  // 5) correct by selecting one; error clears. DO NOT submit again.
  await page.locator('.el-dialog.cc-dialog:visible .cc-opt:not(:disabled)').first().click()
  await page.waitForTimeout(250)
  await snap('E4-corrected')
  return seq
}

/* --------------------------- AC-130 paste --------------------------- */

const PASTE_OBSERVER = () => {
  // NOTE: ':visible' is a Playwright locator pseudo-class and is INVALID inside
  // document.querySelector; use the plain selector in-page.
  const ta = document.querySelector('.el-dialog.cc-dialog .cc-desc-row textarea')
  if (!ta) return false
  window.__pasteLog = []
  if (window.__pasteInstalled) return true
  window.__pasteInstalled = true
  const cpLen = (s) => (typeof s === 'string' ? Array.from(s).length : null)
  const rec = (e) => {
    const item = {
      type: e.type,
      isTrusted: e.isTrusted,
      inputType: e.inputType || null,
      dataCp: cpLen(e.data),
    }
    if (e.type === 'paste' && e.clipboardData) {
      const t = e.clipboardData.getData('text') || ''
      item.clipboardTypes = Array.from(e.clipboardData.types)
      item.clipboardTextCp = Array.from(t).length
      item.clipboardTextUtf16 = t.length
    }
    if (e.type === 'beforeinput' || e.type === 'input') {
      item.valueCpAfterEvent = e.target ? Array.from(e.target.value).length : null
      item.valueUtf16AfterEvent = e.target ? e.target.value.length : null
    }
    window.__pasteLog.push(item)
  }
  ;['paste', 'beforeinput', 'input'].forEach((t) => ta.addEventListener(t, rec, true))
  return true
}

async function pasteCase(page, label, text) {
  const ta = page.locator('.el-dialog.cc-dialog:visible .cc-desc-row textarea')
  await ta.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Delete')
  await page.waitForTimeout(120)
  await page.evaluate(() => { window.__pasteLog = [] })
  // put synthetic text on the REAL browser clipboard via Clipboard API
  const write = await page.evaluate(async (t) => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) return { ok: false, reason: 'no navigator.clipboard.writeText' }
      await navigator.clipboard.writeText(t)
      return { ok: true }
    } catch (e) { return { ok: false, reason: String(e && e.message || e) } }
  }, text)
  // focus the textarea and paste with a REAL shortcut
  await ta.focus()
  await page.keyboard.press('Control+V')
  await page.waitForTimeout(260)
  const log = await page.evaluate(() => window.__pasteLog || [])
  const meta = await page.evaluate(DESC_META)
  return {
    label,
    sourceCodePoints: Array.from(text).length,
    sourceUtf16Units: text.length,
    clipboardWrite: write,
    eventSequence: log.map((x) => x.type),
    events: log,
    final: meta,
  }
}

/* ------------------------------- run ------------------------------- */

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true })
  const result = {
    task: 'CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002-R1',
    probe: 'R1-01 AC-124 edit full sequence; R1-02 AC-130 real clipboard paste',
    mode: 'readonly-browser-probe',
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    frontend: FRONT,
    writeInterception: { policy: '/api/** GET/HEAD/OPTIONS allow; POST/PUT/PATCH/DELETE abort+count', nonGetAttempts: null, attempts: [] },
    viewports: {},
    clipboard: {},
  }

  const apiClients = await (await fetch(`${API}/api/clients`)).json()
  const clients = (apiClients && apiClients.data && apiClients.data.items) || []
  const cleanRows = clients
    .filter((c) => (c.rowAnomalies || []).length === 0 && (c.dataSources || []).length >= 1 && (c.dataSources || []).every((d) => (d.anomalies || []).length === 0))
    .sort((a, b) => (b.dataSources || []).length - (a.dataSources || []).length)
  const editClientId = cleanRows.length ? cleanRows[0].clientId : null
  result.sampleFacts = {
    clientCount: clients.length,
    editTargetResolved: editClientId !== null,
    editTargetSourceCount: cleanRows.length ? (cleanRows[0].dataSources || []).length : 0,
  }

  const VIEWPORTS = [
    { name: '1440x900', width: 1440, height: 900 },
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '900x800', width: 900, height: 800 },
  ]

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      permissions: ['clipboard-read', 'clipboard-write'],
    })
    try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: FRONT }) } catch (e) {}
    await installWriteBlocker(ctx)
    const page = await ctx.newPage()
    const out = {}
    try {
      await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
      await page.waitForSelector('.cc-table .el-table__body tr.el-table__row')
      if (!editClientId) throw new Error('no clean edit target resolved')

      await openEdit(page, editClientId)
      out.ac124_edit = await runEditSequence(page)

      // ---- AC-130 real clipboard paste (only at 1440x900) ----
      if (vp.name === '1440x900') {
        const HAN = '中'
        const EMOJI = '😀' // U+1F600, 1 code point / 2 UTF-16 units
        const pasteAvailable = await page.evaluate(() => ({
          isSecureContext: window.isSecureContext,
          hasClipboard: !!navigator.clipboard,
          hasWriteText: !!(navigator.clipboard && navigator.clipboard.writeText),
          hasReadText: !!(navigator.clipboard && navigator.clipboard.readText),
        }))
        result.clipboard.availability = pasteAvailable
        result.clipboard.observerInstalled = await page.evaluate(PASTE_OBSERVER)
        result.clipboard.cases = {}
        // A: >256 汉字 (300 codepoints, 1 UTF-16 unit each)
        result.clipboard.cases.han300 = await pasteCase(page, 'han300', HAN.repeat(300))
        // B: mixed 200 汉字 + 100 emoji (300 codepoints, 400 UTF-16 units)
        result.clipboard.cases.mixed = await pasteCase(page, 'mixed', HAN.repeat(200) + EMOJI.repeat(100))
        // C: exactly crossing the 256 boundary with a surrogate pair
        //    255 汉字 + 1 emoji = 256 codepoints / 257 UTF-16 units
        result.clipboard.cases.boundary = await pasteCase(page, 'boundary', HAN.repeat(255) + EMOJI)
      }

      await cancelDialog(page)
    } catch (e) {
      out.error = String(e && e.message || e)
    }
    result.viewports[vp.name] = out
    await ctx.close()
  }

  result.writeInterception.nonGetAttempts = writes.length
  result.writeInterception.attempts = writes.slice(0, 20)
  await browser.close()
  fs.writeFileSync(`${OUT}/r1-dialog-results.json`, JSON.stringify(result, null, 2))
  console.log('WROTE', `${OUT}/r1-dialog-results.json`, 'writeAttempts=', writes.length)
}
run().catch((e) => { console.error(e); process.exit(1) })
