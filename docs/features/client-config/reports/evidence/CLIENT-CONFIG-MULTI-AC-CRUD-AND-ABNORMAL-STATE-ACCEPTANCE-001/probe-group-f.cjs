/**
 * Group F probe: AC-020 (delete via menu + second confirm, physical delete without relying on
 * row selection, verified by GET; SQL cross-check is produced separately) and AC-145 (six fixed-
 * selection branches: toggle-success reselect, filter-driven disappearance clear, cancel keep,
 * toggle-failure keep, delete-success clear, delete-cancel/failure keep).
 * Real browser + real backend. One injection: network abort on DELETE of MULTIAC-F145D only.
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
const OUT = path.join(__dirname, 'group-f-results.json')
const result = {
  task: 'CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001',
  group: 'F', frontend: FRONT, browser: { engine: 'chromium', executable: EXE, headless: true },
  ledger: [], injections: [], ac020: {}, ac145: {}, errors: [],
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
  return { row, items }
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
async function visibleBox(page) {
  const boxes = page.locator('.el-message-box:visible')
  await boxes.first().waitFor({ state: 'visible', timeout: 6000 })
  return boxes.last()
}
async function captureBox(box) {
  return {
    title: (await box.locator('.el-message-box__title').innerText()).trim(),
    body: (await box.locator('.el-message-box__message').innerText()).trim(),
    buttons: (await box.locator('.el-message-box__btns button').allInnerTexts()).map((s) => s.trim()).filter(Boolean),
  }
}
async function selectRow(page, id) {
  const row = await rowLocator(page, id)
  const cls = (await row.getAttribute('class')) || ''
  if (!cls.includes('lt-row-highlight__row')) {
    await row.locator('.cc-seq').click()
    await page.waitForTimeout(250)
  }
  return selectedIds(page)
}
async function selectedIds(page) {
  return (await page.locator('.cc-table tr.el-table__row.lt-row-highlight__row .cc-id').allInnerTexts()).map((s) => s.trim())
}
async function messages(page) {
  return (await page.locator('.el-message').allInnerTexts()).map((s) => s.trim()).filter(Boolean)
}
async function waitList(page) {
  return page.waitForResponse((r) => r.url().includes('/api/clients?') && r.request().method() === 'GET', { timeout: 15000 })
}
async function setStatus(page, label) {
  await page.locator('.cc-q-status').click()
  await page.waitForTimeout(350)
  await page.locator('.el-select-dropdown__item:visible', { hasText: label }).last().click()
  await page.waitForTimeout(300)
}
async function query(page) {
  const lp = waitList(page)
  await page.locator('.ql-actions__query').click()
  const resp = await lp
  await page.waitForTimeout(500)
  return resp.url()
}

;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.route('**/api/clients/MULTIAC-F145D', (route) => {
    const req = route.request()
    if (req.method() === 'DELETE') {
      result.injections.push({ kind: 'network-abort', target: 'DELETE /api/clients/MULTIAC-F145D', reachedBackend: false })
      return route.abort('failed')
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

    // ---------------- AC-020: delete without relying on row selection ----------------
    result.ac020.before = {
      rowPresent: !!(await fetchRow('MULTIAC-DEL1')),
      rowFg: (await fetchRow('MULTIAC-DEL1'))?.fgActive ?? null,
      selectedBefore: await selectedIds(page),
    }
    const m = await openMenu(page, 'MULTIAC-DEL1')
    result.ac020.menuItems = m.items
    await clickMenu(page, '删除')
    const box = await visibleBox(page)
    result.ac020.confirm = await captureBox(box)
    const dp = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-DEL1') && r.request().method() === 'DELETE', { timeout: 15000 })
    const lp = waitList(page)
    await box.locator('.el-message-box__btns button', { hasText: '删除' }).click()
    const dresp = await dp
    let djson = null; try { djson = await dresp.json() } catch (e) {}
    await lp.catch(() => null)
    await page.waitForTimeout(700)
    result.ac020.after = {
      http: dresp.status(), code: djson ? djson.code : null,
      rowPresent: !!(await fetchRow('MULTIAC-DEL1')),
      messages: await messages(page),
    }
    await page.waitForTimeout(2600)

    // ---------------- AC-145 branch 1: toggle success reselects target ----------------
    result.ac145.b1 = { selectionStartedAt: await selectRow(page, 'MULTIAC-DEL3') }
    const b1menu = await openMenu(page, 'MULTIAC-F145A')
    await clickMenu(page, '停用')
    const b1box = await visibleBox(page)
    result.ac145.b1.confirm = await captureBox(b1box)
    const b1p = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-F145A/disable') && r.request().method() === 'PUT', { timeout: 15000 })
    const b1l = waitList(page)
    await b1box.locator('.el-message-box__btns button', { hasText: '停用' }).click()
    const b1resp = await b1p; let b1json = null; try { b1json = await b1resp.json() } catch (e) {}
    await b1l.catch(() => null)
    await page.waitForTimeout(700)
    result.ac145.b1.result = {
      menuItems: b1menu.items, code: b1json ? b1json.code : null,
      targetFg: (await fetchRow('MULTIAC-F145A'))?.fgActive ?? null,
      selectionAfter: await selectedIds(page),
    }
    await page.waitForTimeout(2600)

    // ---------------- AC-145 branch 2: status-filter disappearance clears selection ----------------
    await setStatus(page, '启用')
    const b2url = await query(page)
    result.ac145.b2 = { queryUrl: b2url, off1VisibleUnderEnabled: (await rowIndex(page, 'MULTIAC-OFF1')) >= 0 }
    result.ac145.b2.selectionBefore = await selectRow(page, 'MULTIAC-OFF1')
    await openMenu(page, 'MULTIAC-OFF1')
    await clickMenu(page, '停用')
    const b2box = await visibleBox(page)
    const b2p = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-OFF1/disable') && r.request().method() === 'PUT', { timeout: 15000 })
    const b2l = page.waitForResponse((r) => r.url().includes('/api/clients?') && r.request().method() === 'GET', { timeout: 15000 })
    await b2box.locator('.el-message-box__btns button', { hasText: '停用' }).click()
    const b2resp = await b2p; let b2json = null; try { b2json = await b2resp.json() } catch (e) {}
    const b2list = await b2l.catch(() => null)
    await page.waitForTimeout(700)
    result.ac145.b2.result = {
      code: b2json ? b2json.code : null,
      reloadUrl: b2list ? b2list.url() : null,
      off1VisibleAfter: (await rowIndex(page, 'MULTIAC-OFF1')) >= 0,
      selectionAfter: await selectedIds(page),
    }
    await page.waitForTimeout(2600)

    // ---------------- AC-145 branch 3: cancel keeps selection ----------------
    await setStatus(page, '全部')
    await query(page)
    result.ac145.b3 = { selectionBefore: await selectRow(page, 'MULTIAC-E139A') }
    await openMenu(page, 'MULTIAC-E139A')
    await clickMenu(page, '启用')
    const b3box = await visibleBox(page)
    const writesBefore = result.ledger.filter((x) => x.method === 'PUT' && x.path.includes('/enable')).length
    await b3box.locator('.el-message-box__btns button', { hasText: '取消' }).click()
    await b3box.waitFor({ state: 'hidden', timeout: 6000 }).catch(() => {})
    await page.waitForTimeout(600)
    result.ac145.b3.result = {
      enableWritesDelta: result.ledger.filter((x) => x.method === 'PUT' && x.path.includes('/enable')).length - writesBefore,
      targetFg: (await fetchRow('MULTIAC-E139A'))?.fgActive ?? null,
      selectionAfter: await selectedIds(page),
    }
    await page.waitForTimeout(2600)

    // ---------------- AC-145 branch 4: toggle failure keeps selection ----------------
    result.ac145.b4 = { selectionBefore: await selectRow(page, 'MULTIAC-ENC') }
    await openMenu(page, 'MULTIAC-ENC')
    await clickMenu(page, '启用')
    const b4box = await visibleBox(page)
    const b4p = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-ENC/enable') && r.request().method() === 'PUT', { timeout: 15000 })
    await b4box.locator('.el-message-box__btns button', { hasText: '启用' }).click()
    const b4resp = await b4p; let b4json = null; try { b4json = await b4resp.json() } catch (e) {}
    await page.waitForTimeout(800)
    result.ac145.b4.result = {
      code: b4json ? b4json.code : null, message: b4json ? b4json.message : null,
      targetFg: (await fetchRow('MULTIAC-ENC'))?.fgActive ?? null,
      selectionAfter: await selectedIds(page),
      messages: await messages(page),
    }
    await page.waitForTimeout(2600)

    // ---------------- AC-145 branch 5: delete success clears selection ----------------
    result.ac145.b5 = { selectionBefore: await selectRow(page, 'MULTIAC-DEL2') }
    await openMenu(page, 'MULTIAC-DEL2')
    await clickMenu(page, '删除')
    const b5box = await visibleBox(page)
    const b5p = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-DEL2') && r.request().method() === 'DELETE', { timeout: 15000 })
    const b5l = waitList(page)
    await b5box.locator('.el-message-box__btns button', { hasText: '删除' }).click()
    const b5resp = await b5p; let b5json = null; try { b5json = await b5resp.json() } catch (e) {}
    await b5l.catch(() => null)
    await page.waitForTimeout(700)
    result.ac145.b5.result = {
      code: b5json ? b5json.code : null,
      rowPresent: !!(await fetchRow('MULTIAC-DEL2')),
      selectionAfter: await selectedIds(page),
    }
    await page.waitForTimeout(2600)

    // ---------------- AC-145 branch 6: delete cancel keeps, delete failure keeps ----------------
    result.ac145.b6 = { cancelSelectionBefore: await selectRow(page, 'MULTIAC-DEL3') }
    await openMenu(page, 'MULTIAC-DEL3')
    await clickMenu(page, '删除')
    const b6box = await visibleBox(page)
    await b6box.locator('.el-message-box__btns button', { hasText: '取消' }).click()
    await b6box.waitFor({ state: 'hidden', timeout: 6000 }).catch(() => {})
    await page.waitForTimeout(600)
    result.ac145.b6.cancelResult = {
      rowPresent: !!(await fetchRow('MULTIAC-DEL3')),
      selectionAfter: await selectedIds(page),
    }
    result.ac145.b6.failureSelectionBefore = await selectRow(page, 'MULTIAC-F145D')
    await openMenu(page, 'MULTIAC-F145D')
    await clickMenu(page, '删除')
    const b6fbox = await visibleBox(page)
    await b6fbox.locator('.el-message-box__btns button', { hasText: '删除' }).click()
    await page.waitForTimeout(1600)
    result.ac145.b6.failureResult = {
      rowPresent: !!(await fetchRow('MULTIAC-F145D')),
      selectionAfter: await selectedIds(page),
      messages: await messages(page),
    }
  } catch (e) { result.errors.push(String(e && e.stack ? e.stack : e)) } finally { await browser.close() }

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
  console.log('WROTE ' + OUT); console.log('errors=' + result.errors.length)
  if (result.errors.length) process.exitCode = 1
})()
