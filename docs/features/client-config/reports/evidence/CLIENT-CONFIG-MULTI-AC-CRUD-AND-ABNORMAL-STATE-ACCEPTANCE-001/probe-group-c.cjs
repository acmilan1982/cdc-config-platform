/**
 * Group C probe: AC-058 (pre-write backend conflict), AC-061 (partial conflict -> whole failure,
 * no partial write), AC-062 (conflict message content), AC-121 (field-level vs global feedback,
 * success close+refresh).
 * Real backend API for conflict cases. Two browser injections are used and labelled:
 *  - request-body mutation to reach the real backend 40102 description limit from the dialog;
 *  - network abort for the global (non-field) error path.
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
const OUT = path.join(__dirname, 'group-c-results.json')
const EMOJI257 = '😀'.repeat(257)

const result = {
  task: 'CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001',
  group: 'C', frontend: FRONT, browser: { engine: 'chromium', executable: EXE, headless: true },
  ledger: [], injections: [], ac058: {}, ac061: {}, ac062: {}, ac121: {}, errors: [],
}
function ledgerAdd(method, url, body, extra) {
  let p = url; try { p = new URL(url).pathname } catch (e) {}
  result.ledger.push({ method, path: p, body: body ?? null, ...(extra || {}) })
}
async function fetchRow(id) {
  const j = await (await fetch(`${BACK}/api/clients?status=ALL`)).json()
  return (j.data.items || []).find((x) => x.clientId === id) || null
}
async function optionsSelectable(dsId) {
  const j = await (await fetch(`${BACK}/api/clients/data-source-options`)).json()
  const o = (j.data || []).find((x) => x.dataSourceId === dsId)
  return o ? { selectable: o.selectable, reason: o.notSelectableReason, occupiedBy: o.occupiedByClientIds } : null
}
async function directCreate(clientId, desc, dsIds) {
  const r = await fetch(`${BACK}/api/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, clientDesc: desc, dataSourceIds: dsIds }) })
  const j = await r.json()
  ledgerAdd('POST', `${BACK}/api/clients`, { clientId, dataSourceIds: dsIds }, { businessCode: j.code, directBackend: true })
  return { http: r.status, code: j.code, message: j.message }
}
async function rowIndex(page, id) {
  const ids = await page.$$eval('.cc-table tr.el-table__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim()))
  return ids.indexOf(id)
}
async function openEdit(page, id) {
  const idx = await rowIndex(page, id)
  if (idx < 0) throw new Error('row not found ' + id)
  const row = page.locator('.cc-table tr.el-table__row').nth(idx)
  await row.scrollIntoViewIfNeeded()
  await row.dblclick()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
}
async function setDesc(page, t) { await page.locator('.el-dialog.cc-dialog .cc-desc-row textarea').fill(t) }
async function descFieldError(page) {
  const p = page.locator('.el-dialog.cc-dialog .cc-form-control.cc-field').nth(1).locator('.ced-field-error')
  return (await p.count()) ? (await p.first().innerText()).trim() : null
}
async function anyFieldErrors(page) {
  return page.locator('.el-dialog.cc-dialog .ced-field-error').count()
}
async function globalMessage(page) {
  const m = page.locator('.el-message')
  await m.first().waitFor({ state: 'visible', timeout: 6000 }).catch(() => {})
  return (await m.count()) ? (await m.first().innerText()).trim() : null
}
async function cancelDialog(page) {
  await page.locator('.el-dialog.cc-dialog .el-dialog__footer .el-button', { hasText: '取消' }).click()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden' }).catch(() => {})
  await page.waitForTimeout(250)
}

;(async () => {
  // ---------- AC-058 / AC-062: single-source conflict via real backend ----------
  result.ac058.createAttempt = await directCreate('MULTIAC-CONFB', 'MULTIAC synthetic conflict target (single source)', ['CCFG-AC-R1-DS08'])
  result.ac058.rowCreated = !!(await fetchRow('MULTIAC-CONFB'))
  result.ac058.sourceStillOwned = await optionsSelectable('CCFG-AC-R1-DS08')
  result.ac062.message = result.ac058.createAttempt.message
  result.ac062.containsOrg = /CCFG-AC-R1-人工验收机构08/.test(result.ac058.createAttempt.message || '')
  result.ac062.containsSourceId = /CCFG-AC-R1-DS08/.test(result.ac058.createAttempt.message || '')
  result.ac062.containsConflictProbeId = /MULTIAC-CONFA/.test(result.ac058.createAttempt.message || '')

  // ---------- AC-061: multi-source with only a partial conflict -> whole failure, no partial write ----------
  result.ac061.ds06Before = await optionsSelectable('CCFG-AC-R1-DS06')
  result.ac061.createAttempt = await directCreate('MULTIAC-CONFC', 'MULTIAC synthetic conflict target (partial)', ['CCFG-AC-R1-DS06', 'CCFG-AC-R1-DS08'])
  result.ac061.rowCreated = !!(await fetchRow('MULTIAC-CONFC'))
  result.ac061.ds06After = await optionsSelectable('CCFG-AC-R1-DS06')
  result.ac061.noPartialWrite = !result.ac061.rowCreated && !!result.ac061.ds06After && result.ac061.ds06After.selectable === true

  // ---------- browser: AC-121 desc field error via real backend 40102 ----------
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  let mode = 'none'
  await ctx.route('**/api/clients/MULTIAC-DESC', async (route) => {
    const req = route.request()
    if (req.method() !== 'PUT' || mode === 'none') return route.continue()
    if (mode === 'mutate-desc') {
      const data = req.postDataJSON()
      data.clientDesc = EMOJI257
      result.injections.push({ kind: 'request-body-mutation', target: 'PUT /api/clients/MULTIAC-DESC', field: 'clientDesc', utf8Bytes: Buffer.byteLength(EMOJI257, 'utf8') })
      mode = 'none'
      return route.continue({ postData: JSON.stringify(data) })
    }
    if (mode === 'abort') {
      result.injections.push({ kind: 'network-abort', target: 'PUT /api/clients/MULTIAC-DESC', reachedBackend: false })
      mode = 'none'
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
    let body = null; try { body = req.postDataJSON() } catch (e) {}
    ledgerAdd(m, u, body)
  })
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table tr.el-table__row')
    await page.waitForTimeout(700)

    // desc over-limit: real backend 40102, field-level feedback below the description
    await openEdit(page, 'MULTIAC-DESC')
    await setDesc(page, 'MULTIAC temporary desc before body mutation')
    mode = 'mutate-desc'
    const rp = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-DESC') && r.request().method() === 'PUT', { timeout: 15000 })
    await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click()
    const resp = await rp
    let payload = null; try { payload = await resp.json() } catch (e) {}
    await page.waitForTimeout(400)
    result.ac121.descOverLimit = {
      http: resp.status, code: payload ? payload.code : null, message: payload ? payload.message : null,
      fieldError: await descFieldError(page), dialogStillOpen: await page.locator('.el-dialog.cc-dialog').first().isVisible(),
    }
    await cancelDialog(page)

    // network abort: global error, no field error, no DB change
    await openEdit(page, 'MULTIAC-DESC')
    await setDesc(page, 'MULTIAC description that must not persist after network abort')
    mode = 'abort'
    const beforeAbort = await fetchRow('MULTIAC-DESC')
    await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click()
    const msg = await globalMessage(page)
    await page.waitForTimeout(400)
    const afterAbort = await fetchRow('MULTIAC-DESC')
    result.ac121.networkAbort = {
      globalMessage: msg,
      fieldErrorCount: await anyFieldErrors(page),
      dialogStillOpen: await page.locator('.el-dialog.cc-dialog').first().isVisible(),
      dbUnchanged: !!beforeAbort && !!afterAbort && beforeAbort.clientDesc === afterAbort.clientDesc,
    }
    await page.waitForTimeout(2600) // let the global message auto-dismiss before the next message
    await cancelDialog(page)

    // successful save: closes dialog and reloads the list
    await openEdit(page, 'MULTIAC-DESC')
    const successDesc = 'MULTIAC successful save sample after feedback checks'
    await setDesc(page, successDesc)
    const successRp = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-DESC') && r.request().method() === 'PUT', { timeout: 15000 })
    const listRp = page.waitForResponse((r) => r.url().includes('/api/clients?') && r.request().method() === 'GET', { timeout: 15000 })
    await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click()
    const sresp = await successRp
    let spayload = null; try { spayload = await sresp.json() } catch (e) {}
    const listGot = await listRp.catch(() => null)
    await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 10000 })
    await page.waitForTimeout(500)
    const successRow = await fetchRow('MULTIAC-DESC')
    result.ac121.success = {
      code: spayload ? spayload.code : null,
      dialogClosed: !(await page.locator('.el-dialog.cc-dialog').first().isVisible()),
      listReloaded: !!listGot,
      descPersisted: !!successRow && successRow.clientDesc === successDesc,
    }

    // preserve the same-batch evidence keys for the other two field errors
    result.ac121.reusedFieldErrorEvidence = {
      idConflict: 'group-b-results.json ac039.step2/step4 fieldError shown under the probe-ID field',
      sourceConflict: 'group-b-results.json ac040.sourceFieldError shown under the collection-source field',
      conditionsPreserved: 'empty desc / ID uniqueness / source allocation / 1024-byte limit exercised in groups A and B',
    }
  } catch (e) { result.errors.push(String(e && e.stack ? e.stack : e)) } finally { await browser.close() }

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
  console.log('WROTE ' + OUT); console.log('errors=' + result.errors.length)
  if (result.errors.length) process.exitCode = 1
})()
