/**
 * Group E probe: AC-139 (disable confirm/cancel/success/failure), AC-140 (enable confirm/cancel/
 * success exactly-one-request/failure), AC-115 (submit button visual matrix, incomplete-form
 * clickable black button with field errors, in-flight loading state and no duplicate submit,
 * secondary buttons not black).
 * Real browser + real backend. The only injections are labelled network aborts / request delays
 * on the exact target URL (disable of MULTIAC-E139F; save of MULTIAC-DESC for loading observation).
 * AC-140 success request count is measured from the browser request ledger.
 */
const fs = require('fs')
const path = require('path')
const PW = ['/root/.hermes/hermes-agent/node_modules/playwright-core', '/usr/lib/node_modules/openclaw/node_modules/playwright-core', '/data/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core']
let chromium
for (const p of PW) { try { chromium = require(p).chromium; break } catch (e) {} }
if (!chromium) { console.error('no playwright-core'); process.exit(2) }
const EXE = process.env.PROBE_CHROME || '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = 'http://127.0.0.1:5173'
const BACK = 'http://127.0.0.1:8080'
const OUT = path.join(__dirname, 'group-e-results.json')
const result = {
  task: 'CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001',
  group: 'E', frontend: FRONT, browser: { engine: 'chromium', executable: EXE, headless: true },
  ledger: [], injections: [], ac139: {}, ac140: {}, ac115: {}, errors: [],
}
function ledgerAdd(method, url) {
  let p = url; try { p = new URL(url).pathname } catch (e) {}
  result.ledger.push({ method, path: p })
}
async function fetchRow(id) {
  const j = await (await fetch(`${BACK}/api/clients?status=ALL`)).json()
  return (j.data.items || []).find((x) => x.clientId === id) || null
}
async function rowIndex(page, id) {
  const ids = await page.$$eval('.cc-table tr.el-table__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim()))
  return ids.indexOf(id)
}
async function rowLocator(page, id) {
  const idx = await rowIndex(page, id)
  if (idx < 0) throw new Error('row not found ' + id)
  const row = page.locator('.cc-table tr.el-table__row').nth(idx)
  await row.scrollIntoViewIfNeeded()
  return row
}
async function visiblePoppers(page) {
  return page.locator('.cc-more-popper:visible').filter({ has: page.locator('.el-dropdown-menu__item') })
}
async function openMenu(page, id) {
  const row = await rowLocator(page, id)
  await page.locator('.cc-more-popper:visible').first().waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {})
  await row.locator('.cc-more-link').click()
  await page.waitForTimeout(450)
  const poppers = await visiblePoppers(page)
  if ((await poppers.count()) !== 1) throw new Error(`expected 1 visible popper for ${id}, got ${await poppers.count()}`)
  const items = (await poppers.first().locator('.el-dropdown-menu__item:visible').allInnerTexts()).map((s) => s.trim()).filter(Boolean)
  return { row, items, popper: poppers.first() }
}
async function clickMenu(page, text) {
  const poppers = await visiblePoppers(page)
  if ((await poppers.count()) !== 1) throw new Error('expected 1 visible popper before menu click')
  await poppers.first().locator('.el-dropdown-menu__item:visible', { hasText: text }).first().click()
}
async function closePopper(page) {
  await page.keyboard.press('Escape').catch(() => {})
  await page.locator('.cc-more-popper:visible').first().waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {})
}
async function captureConfirm(page, cls) {
  const box = page.locator(`.el-message-box.${cls}`)
  await box.waitFor({ state: 'visible', timeout: 6000 })
  return {
    title: (await box.locator('.el-message-box__title').innerText()).trim(),
    body: (await box.locator('.el-message-box__message').innerText()).trim(),
    buttons: (await box.locator('.el-message-box__btns button').allInnerTexts()).map((s) => s.trim()).filter(Boolean),
  }
}
async function confirmBox(page, cls, text) {
  await page.locator(`.el-message-box.${cls} .el-message-box__btns button`, { hasText: text }).click()
}
async function cancelBox(page, cls) {
  await page.locator(`.el-message-box.${cls} .el-message-box__btns button`, { hasText: '取消' }).click()
  await page.locator(`.el-message-box.${cls}`).waitFor({ state: 'hidden', timeout: 6000 }).catch(() => {})
}
async function selectRow(page, id) {
  const row = await rowLocator(page, id)
  const cls = (await row.getAttribute('class')) || ''
  if (!cls.includes('lt-row-highlight__row')) {
    await row.locator('.cc-seq').click()
    await page.waitForTimeout(200)
  }
  return page.locator(`.cc-table tr.el-table__row.lt-row-highlight__row .cc-id`).allInnerTexts().then((a) => a.map((s) => s.trim()))
}
async function selectedIds(page) {
  return (await page.locator('.cc-table tr.el-table__row.lt-row-highlight__row .cc-id').allInnerTexts()).map((s) => s.trim())
}
function countWrites(ledger, method, pathPart) {
  return ledger.filter((x) => x.method === method && x.path.includes(pathPart)).length
}
async function readSubmitStyle(page) {
  return page.locator('.el-dialog.cc-dialog .cc-dialog-submit').evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, color: cs.color,
      borderRadius: cs.borderRadius, fontWeight: cs.fontWeight, cursor: cs.cursor,
      classes: el.className,
      disabledAttr: el.hasAttribute('disabled'),
      text: (el.textContent || '').trim(),
      rect: el.getBoundingClientRect().toJSON(),
    }
  })
}
async function readSecondary(page) {
  const out = {}
  const footerBtns = page.locator('.el-dialog.cc-dialog .el-dialog__footer .el-button')
  out.footer = await footerBtns.evaluateAll((els) => els.map((el) => {
    const cs = getComputedStyle(el)
    return { text: (el.textContent || '').trim(), backgroundColor: cs.backgroundColor, color: cs.color, borderColor: cs.borderColor }
  }))
  const auto = page.locator('.el-dialog.cc-dialog .cc-autogen')
  if (await auto.count()) out.autoGenerate = await auto.first().evaluate((el) => {
    const cs = getComputedStyle(el); return { backgroundColor: cs.backgroundColor, color: cs.color, text: (el.textContent || '').trim() }
  })
  const toggle = page.locator('.el-dialog.cc-dialog .cc-id-toggle')
  if (await toggle.count()) out.idToggle = await toggle.first().evaluate((el) => {
    const cs = getComputedStyle(el); return { backgroundColor: cs.backgroundColor, color: cs.color, text: (el.textContent || '').trim() }
  })
  return out
}
async function waitListReload(page) {
  await page.waitForResponse((r) => r.url().includes('/api/clients?') && r.request().method() === 'GET', { timeout: 15000 }).catch(() => null)
  await page.waitForTimeout(500)
}
async function messages(page) {
  return (await page.locator('.el-message').allInnerTexts()).map((s) => s.trim()).filter(Boolean)
}

async function ac139(page) {
  // ---- cancel branch on MULTIAC-E139A (fg=1) ----
  let m = await openMenu(page, 'MULTIAC-E139A')
  result.ac139.menuBefore = m.items
  await clickMenu(page, '停用')
  const box = await captureConfirm(page, 'cc-confirm--disable')
  const before = result.ledger.filter((x) => x.method !== 'GET').length
  await cancelBox(page, 'cc-confirm--disable')
  await page.waitForTimeout(700)
  const after = result.ledger.filter((x) => x.method !== 'GET').length
  const row1 = await fetchRow('MULTIAC-E139A')
  result.ac139.cancel = {
    confirm: box, writeDelta: after - before, fgAfterCancel: row1 ? row1.fgActive : null,
  }

  // ---- success branch ----
  m = await openMenu(page, 'MULTIAC-E139A')
  await clickMenu(page, '停用')
  await captureConfirm(page, 'cc-confirm--disable')
  const rp = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-E139A/disable') && r.request().method() === 'PUT', { timeout: 15000 })
  const listP = page.waitForResponse((r) => r.url().includes('/api/clients?') && r.request().method() === 'GET', { timeout: 15000 })
  await confirmBox(page, 'cc-confirm--disable', '停用')
  const resp = await rp
  let json = null; try { json = await resp.json() } catch (e) {}
  await listP.catch(() => null)
  await page.waitForTimeout(700)
  const row2 = await fetchRow('MULTIAC-E139A')
  const rowEl = await rowLocator(page, 'MULTIAC-E139A')
  const markCount = await rowEl.locator('.cc-inactive-mark').count()
  result.ac139.success = {
    http: resp.status(), code: json ? json.code : null,
    fgAfter: row2 ? row2.fgActive : null,
    inactiveMark: markCount ? (await rowEl.locator('.cc-inactive-mark').first().innerText()).trim() : null,
    messages: await messages(page),
  }
  await page.waitForTimeout(2600)

  // ---- failure branch (network abort on the exact disable URL) ----
  await openMenu(page, 'MULTIAC-E139F')
  await clickMenu(page, '停用')
  await captureConfirm(page, 'cc-confirm--disable')
  await confirmBox(page, 'cc-confirm--disable', '停用')
  await page.waitForTimeout(1600)
  const row3 = await fetchRow('MULTIAC-E139F')
  async function rowMark(id) {
    const idx = await rowIndex(page, id)
    return idx < 0 ? null : (await page.locator('.cc-table tr.el-table__row').nth(idx).locator('.cc-inactive-mark').count()) > 0
  }
  result.ac139.failure = {
    fgAfter: row3 ? row3.fgActive : null,
    inactiveMarkPresent: await rowMark('MULTIAC-E139F'),
    messages: await messages(page),
  }
  await page.waitForTimeout(2600)
}

async function ac140(page) {
  // ---- cancel branch on MULTIAC-OFF1 (fg=0), selection must survive ----
  const selBefore = await selectRow(page, 'MULTIAC-OFF1')
  let m = await openMenu(page, 'MULTIAC-OFF1')
  result.ac140.menuBefore = m.items
  await clickMenu(page, '启用')
  const box = await captureConfirm(page, 'cc-confirm--enable')
  const before = countWrites(result.ledger, 'PUT', '/enable')
  await cancelBox(page, 'cc-confirm--enable')
  await page.waitForTimeout(700)
  const after = countWrites(result.ledger, 'PUT', '/enable')
  const row1 = await fetchRow('MULTIAC-OFF1')
  result.ac140.cancel = {
    confirm: box, enableWrites: after - before,
    fgAfterCancel: row1 ? row1.fgActive : null,
    selectionBefore: selBefore, selectionAfter: await selectedIds(page),
  }

  // ---- success branch: exactly one enable request, loading-safe double click ----
  await openMenu(page, 'MULTIAC-OFF1')
  await clickMenu(page, '启用')
  await captureConfirm(page, 'cc-confirm--enable')
  const beforeSuccess = countWrites(result.ledger, 'PUT', '/enable')
  const rp = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-OFF1/enable') && r.request().method() === 'PUT', { timeout: 15000 })
  const listP = page.waitForResponse((r) => r.url().includes('/api/clients?') && r.request().method() === 'GET', { timeout: 15000 })
  const btn = page.locator('.el-message-box.cc-confirm--enable .el-message-box__btns button', { hasText: '启用' })
  await btn.click()
  await btn.click({ timeout: 1000 }).catch(() => {})
  // second click through the DOM as well (simulates rapid repeated activation)
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.el-message-box.cc-confirm--enable .el-message-box__btns button'))
    const b = els.find((e) => (e.textContent || '').includes('启用'))
    if (b) b.click()
  }).catch(() => {})
  const resp = await rp
  let json = null; try { json = await resp.json() } catch (e) {}
  await listP.catch(() => null)
  await page.waitForTimeout(1200)
  const afterSuccess = countWrites(result.ledger, 'PUT', '/enable')
  const row2 = await fetchRow('MULTIAC-OFF1')
  const idx = await rowIndex(page, 'MULTIAC-OFF1')
  const markCount = idx < 0 ? -1 : await page.locator('.cc-table tr.el-table__row').nth(idx).locator('.cc-inactive-mark').count()
  result.ac140.success = {
    http: resp.status(), code: json ? json.code : null,
    enableWritesDelta: afterSuccess - beforeSuccess,
    fgAfter: row2 ? row2.fgActive : null,
    inactiveMarkCount: markCount,
    selectionAfter: await selectedIds(page),
    messages: await messages(page),
  }
  await page.waitForTimeout(2600)

  // ---- failure branch: real backend conflict (MULTIAC-ENC shares DS08 with MULTIAC-CONFA) ----
  await openMenu(page, 'MULTIAC-ENC')
  await clickMenu(page, '启用')
  await captureConfirm(page, 'cc-confirm--enable')
  const fp = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-ENC/enable') && r.request().method() === 'PUT', { timeout: 15000 })
  await confirmBox(page, 'cc-confirm--enable', '启用')
  const fresp = await fp
  let fjson = null; try { fjson = await fresp.json() } catch (e) {}
  await page.waitForTimeout(800)
  const row3 = await fetchRow('MULTIAC-ENC')
  result.ac140.failure = {
    http: fresp.status(), code: fjson ? fjson.code : null, message: fjson ? fjson.message : null,
    fgAfter: row3 ? row3.fgActive : null,
    messages: await messages(page),
  }
  await page.waitForTimeout(2600)
}

async function ac115(page) {
  // ---- create dialog: normal / hover / focus / active / incomplete submit ----
  await page.locator('.cc-btn-add').click()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  const submit = page.locator('.el-dialog.cc-dialog .cc-dialog-submit')
  result.ac115.normal = await readSubmitStyle(page)
  result.ac115.secondaryCreate = await readSecondary(page)

  const box = await submit.boundingBox()
  if (!box) throw new Error('submit button has no bounding box')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(400)
  result.ac115.hover = { backgroundColor: await submit.evaluate((el) => getComputedStyle(el).backgroundColor) }

  await submit.focus()
  await page.waitForTimeout(350)
  result.ac115.focus = { backgroundColor: await submit.evaluate((el) => getComputedStyle(el).backgroundColor) }

  const beforeActive = result.ledger.filter((x) => x.method !== 'GET').length
  await page.mouse.down()
  await page.waitForTimeout(250)
  result.ac115.active = { backgroundColor: await submit.evaluate((el) => getComputedStyle(el).backgroundColor) }
  await page.mouse.up()
  await page.waitForTimeout(700)
  const afterActive = result.ledger.filter((x) => x.method !== 'GET').length
  result.ac115.incompleteForm = {
    writeDelta: afterActive - beforeActive,
    fieldErrorCount: await page.locator('.el-dialog.cc-dialog .ced-field-error').count(),
    fieldErrors: (await page.locator('.el-dialog.cc-dialog .ced-field-error').allInnerTexts()).map((s) => s.trim()).filter(Boolean),
    submitStillBlackAndClickable: await readSubmitStyle(page),
  }
  await page.locator('.el-dialog.cc-dialog .el-dialog__footer .el-button', { hasText: '取消' }).click()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden' })
  await page.waitForTimeout(300)

  // ---- edit dialog: id-toggle secondary button + in-flight loading / no duplicate ----
  const ids = await page.$$eval('.cc-table tr.el-table__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim()))
  const row = page.locator('.cc-table tr.el-table__row').nth(ids.indexOf('MULTIAC-DESC'))
  await row.scrollIntoViewIfNeeded()
  await row.dblclick()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  result.ac115.secondaryEdit = await readSecondary(page)
  result.ac115.editDialogSubmitNormal = await readSubmitStyle(page)
  const newDesc = 'MULTIAC AC-115 loading observation description'
  await page.locator('.el-dialog.cc-dialog .cc-desc-row textarea').fill(newDesc)
  const beforeSave = countWrites(result.ledger, 'PUT', '/api/clients/MULTIAC-DESC')
  const rp = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-DESC') && r.request().method() === 'PUT', { timeout: 20000 })
  await submit.click()
  await page.waitForTimeout(500)
  const inFlight = {
    style: await readSubmitStyle(page),
    loadingVisible: await submit.locator('.is-loading, .el-icon.is-loading').count().catch(() => 0),
    textWhileLoading: (await submit.innerText()).trim(),
  }
  // attempt a duplicate activation while the request is delayed in flight
  await submit.evaluate((el) => el.click()).catch(() => {})
  await submit.click({ timeout: 800 }).catch(() => {})
  const lp = page.waitForResponse((r) => r.url().includes('/api/clients?') && r.request().method() === 'GET', { timeout: 20000 })
  const resp = await rp
  let json = null; try { json = await resp.json() } catch (e) {}
  await lp.catch(() => null)
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(800)
  const afterSave = countWrites(result.ledger, 'PUT', '/api/clients/MULTIAC-DESC')
  const rowAfter = await fetchRow('MULTIAC-DESC')
  result.ac115.submitting = {
    inFlight,
    http: resp.status(), code: json ? json.code : null,
    saveWritesDelta: afterSave - beforeSave,
    dialogClosed: !(await page.locator('.el-dialog.cc-dialog').first().isVisible().catch(() => false)),
    descPersisted: !!rowAfter && rowAfter.clientDesc === newDesc,
    messages: await messages(page),
  }
}

;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  // injection 1: abort disable for MULTIAC-E139F only
  await ctx.route('**/api/clients/MULTIAC-E139F/disable', (route) => {
    const req = route.request()
    if (req.method() === 'PUT') {
      result.injections.push({ kind: 'network-abort', target: 'PUT /api/clients/MULTIAC-E139F/disable', reachedBackend: false })
      return route.abort('failed')
    }
    return route.continue()
  })
  // injection 2: delay the real save of MULTIAC-DESC so the in-flight loading state is observable
  await ctx.route('**/api/clients/MULTIAC-DESC', async (route) => {
    const req = route.request()
    if (req.method() === 'PUT' && req.url().endsWith('/api/clients/MULTIAC-DESC')) {
      result.injections.push({ kind: 'request-delay', target: 'PUT /api/clients/MULTIAC-DESC', delayMs: 1800, reachedBackend: true })
      await new Promise((r) => setTimeout(r, 1800))
    }
    return route.continue()
  })
  const page = await ctx.newPage()
  page.on('request', (req) => {
    const u = req.url()
    if (!u.includes('/api/')) return
    const m = req.method()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return
    ledgerAdd(m, u)
  })
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table tr.el-table__row')
    await page.waitForTimeout(700)
    await ac139(page)
    await ac140(page)
    await ac115(page)
  } catch (e) { result.errors.push(String(e && e.stack ? e.stack : e)) } finally { await browser.close() }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
  console.log('WROTE ' + OUT); console.log('errors=' + result.errors.length)
  if (result.errors.length) process.exitCode = 1
})()
