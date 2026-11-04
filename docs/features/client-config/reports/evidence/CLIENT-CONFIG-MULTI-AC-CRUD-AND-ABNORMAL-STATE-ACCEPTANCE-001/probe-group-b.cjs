/**
 * Group B probe: AC-039 (probe-ID edit rules), AC-054 (self-exclusion in candidate list),
 * AC-060 (edit exclusion key = originalClientId), AC-040 (atomic all-or-nothing edit).
 * Real browser UI; one real backend API create is used to occupy a source while the edit
 * dialog is open, so the later save is a genuine backend 40941 conflict (not a DOM mock).
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
const OUT = path.join(__dirname, 'group-b-results.json')

const result = {
  task: 'CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001',
  group: 'B', frontend: FRONT, browser: { engine: 'chromium', executable: EXE, headless: true },
  ledger: [], optionsRequests: [], ac039: {}, ac054: {}, ac060: {}, ac040: {}, errors: [],
}
function ledgerAdd(method, url, body, extra) {
  let p = url; try { p = new URL(url).pathname } catch (e) {}
  result.ledger.push({ method, path: p, body: body ?? null, ...(extra || {}) })
}
async function rowIndex(page, id) {
  const ids = await page.$$eval('.cc-table tr.el-table__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim()))
  return ids.indexOf(id)
}
async function rowLocator(page, id) {
  const idx = await rowIndex(page, id)
  if (idx < 0) throw new Error('row not found: ' + id)
  const row = page.locator('.cc-table tr.el-table__row').nth(idx)
  await row.scrollIntoViewIfNeeded()
  return row
}
async function openEdit(page, id) {
  const row = await rowLocator(page, id)
  await row.dblclick()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible', timeout: 8000 })
  await page.waitForTimeout(500)
}
async function unlockId(page) {
  const btn = page.locator('.el-dialog.cc-dialog .cc-id-toggle')
  if ((await btn.count()) > 0 && (await btn.first().isVisible()) && ((await btn.first().innerText()).includes('修改探针 ID'))) await btn.first().click()
}
async function setId(page, id) { await unlockId(page); await page.locator('.el-dialog.cc-dialog .cc-id-control input').fill(id) }
async function setDesc(page, text) { await page.locator('.el-dialog.cc-dialog .cc-desc-row textarea').fill(text) }
async function idError(page) {
  const p = page.locator('.el-dialog.cc-dialog .cc-form-control.cc-field').first().locator('.ced-field-error')
  return (await p.count()) ? (await p.first().innerText()).trim() : null
}
async function sourceError(page) {
  const p = page.locator('.el-dialog.cc-dialog .cc-field-feedback__text.ced-field-error')
  return (await p.count()) ? (await p.first().innerText()).trim() : null
}
async function clickSubmit(page) { await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click() }
async function saveAndWait(page, method, urlPart, expectedCode) {
  const rp = page.waitForResponse((r) => r.url().includes(urlPart) && r.request().method() === method, { timeout: 15000 })
  await clickSubmit(page)
  const resp = await rp
  let payload = null; try { payload = await resp.json() } catch (e) {}
  if (expectedCode != null && payload && payload.code !== expectedCode) result.errors.push(`expected ${expectedCode}, got ${payload.code} for ${method} ${urlPart}`)
  return { http: resp.status(), code: payload ? payload.code : null, message: payload ? payload.message : null }
}
async function fetchRow(id) {
  const j = await (await fetch(`${BACK}/api/clients?status=ALL`)).json()
  return (j.data.items || []).find((x) => x.clientId === id) || null
}
async function cancelDialog(page) {
  await page.locator('.el-dialog.cc-dialog .el-dialog__footer .el-button', { hasText: '取消' }).click()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 8000 })
  await page.waitForTimeout(300)
}
async function submitWithoutNetwork(page) {
  const before = result.ledger.filter((x) => x.method !== 'GET').length
  await clickSubmit(page)
  await page.waitForTimeout(500)
  const after = result.ledger.filter((x) => x.method !== 'GET').length
  return { nonGetDelta: after - before, idError: await idError(page) }
}

async function run(page) {
  // ---------- AC-054: own source stays selectable after changing draft ID (unsaved) ----------
  await openEdit(page, 'MULTIAC-ID1')
  const optReq = result.optionsRequests[result.optionsRequests.length - 1] || null
  await unlockId(page)
  await page.locator('.el-dialog.cc-dialog .cc-id-control input').fill('MULTIAC-ID1R')
  await page.waitForTimeout(200)
  const opt = page.locator('.cc-opt').filter({ hasText: 'CCFG-AC-R1-DS07' }).first()
  const optClass = await opt.getAttribute('class')
  const optText = (await opt.innerText()).trim()
  result.ac054 = {
    optionsRequestUrl: optReq,
    optionsExcludeEqualsOriginalId: !!optReq && optReq.includes('excludeClientId=MULTIAC-ID1'),
    draftIdChangedUnsavedTo: 'MULTIAC-ID1R',
    ownSourceDs07Present: (await opt.count()) > 0,
    ownSourceDs07Disabled: (optClass || '').includes('cc-opt--disabled') || (await opt.isDisabled()),
    ownSourceDs07ReasonNotEmpty: /已分配|不可选择/.test(optText),
    chosenChipCount: await page.locator('.el-dialog.cc-dialog .cc-chosen-list .el-tag').count(),
  }
  await cancelDialog(page)

  // ---------- AC-039 step 1: case-only rename allowed ----------
  await openEdit(page, 'MULTIAC-ID1')
  await setId(page, 'MULTIAC-id1')
  result.ac039.step1 = { save: await saveAndWait(page, 'PUT', '/api/clients/MULTIAC-ID1', 200) }
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 10000 })
  await page.waitForTimeout(600)
  result.ac039.step1.oldIdPresent = !!(await fetchRow('MULTIAC-ID1'))
  const caseRow = await fetchRow('MULTIAC-id1')
  result.ac039.step1.newIdPersisted = !!caseRow
  result.ac039.step1.persistedSources = caseRow ? (caseRow.dataSources || []).map((d) => d.dataSourceId) : null

  // ---------- AC-039 step 2: case-only conflict with MULTIAC-ID2 ----------
  await openEdit(page, 'MULTIAC-id1')
  await setId(page, 'multiAC-ID2')
  result.ac039.step2 = { save: await saveAndWait(page, 'PUT', '/api/clients/MULTIAC-id1', 40940), fieldError: await idError(page) }
  await cancelDialog(page)
  result.ac039.step2.originalUnchanged = !!(await fetchRow('MULTIAC-id1'))

  // ---------- AC-039 step 3: illegal format (client-side) + backend direct check ----------
  await openEdit(page, 'MULTIAC-id1')
  await setId(page, '-MULTIAC-BAD')
  result.ac039.step3 = await submitWithoutNetwork(page)
  await cancelDialog(page)
  const badResp = await fetch(`${BACK}/api/clients/MULTIAC-id1`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: '-MULTIAC-BAD', clientDesc: 'MULTIAC illegal-id backend sample', dataSourceIds: ['CCFG-AC-R1-DS07'] }),
  })
  const badJson = await badResp.json()
  ledgerAdd('PUT', `${BACK}/api/clients/MULTIAC-id1`, { clientId: '-MULTIAC-BAD' }, { businessCode: badJson.code, directBackend: true })
  result.ac039.step3.backendDirect = { http: badResp.status, code: badJson.code, message: badJson.message }
  result.ac039.step3.originalUnchanged = !!(await fetchRow('MULTIAC-id1'))

  // ---------- AC-039 step 4: exact conflict with MULTIAC-ID2 ----------
  await openEdit(page, 'MULTIAC-id1')
  await setId(page, 'MULTIAC-ID2')
  result.ac039.step4 = { save: await saveAndWait(page, 'PUT', '/api/clients/MULTIAC-id1', 40940), fieldError: await idError(page) }
  await cancelDialog(page)
  result.ac039.step4.originalUnchanged = !!(await fetchRow('MULTIAC-id1'))

  // ---------- AC-060 + AC-039 step 5: rename while keeping own source -> success ----------
  await openEdit(page, 'MULTIAC-id1')
  await setId(page, 'MULTIAC-ID1X')
  result.ac060 = { save: await saveAndWait(page, 'PUT', '/api/clients/MULTIAC-id1', 200) }
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 10000 })
  await page.waitForTimeout(600)
  const renamed = await fetchRow('MULTIAC-ID1X')
  result.ac060.newIdPersisted = !!renamed
  result.ac060.sources = renamed ? (renamed.dataSources || []).map((d) => d.dataSourceId) : null
  result.ac060.oldIdAbsent = !(await fetchRow('MULTIAC-id1'))
  result.ac039.step5 = { save: result.ac060.save, newIdPersisted: result.ac060.newIdPersisted, oldIdAbsent: result.ac060.oldIdAbsent }

  // ---------- AC-040 + AC-121 source field error: stale candidate becomes occupied ----------
  await openEdit(page, 'MULTIAC-ID1X')
  const ds06 = page.locator('.cc-opt').filter({ hasText: 'CCFG-AC-R1-DS06' }).first()
  const ds06InitiallyEnabled = !((await ds06.getAttribute('class')) || '').includes('cc-opt--disabled') && !(await ds06.isDisabled())
  // Occupy DS06 with a real backend create while the dialog's candidate list is stale.
  const occResp = await fetch(`${BACK}/api/clients`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: 'MULTIAC-OCC', clientDesc: 'MULTIAC synthetic probe occupying a source to force a real backend conflict', dataSourceIds: ['CCFG-AC-R1-DS06'] }),
  })
  const occJson = await occResp.json()
  ledgerAdd('POST', `${BACK}/api/clients`, { clientId: 'MULTIAC-OCC', dataSourceIds: ['CCFG-AC-R1-DS06'] }, { businessCode: occJson.code, directBackend: true })
  await ds06.click().catch(() => {})
  await setId(page, 'MULTIAC-ID1Y')
  await setDesc(page, 'MULTIAC edited description that must NOT persist after a rejected atomic save')
  result.ac040 = {
    occupyingCreate: { http: occResp.status, code: occJson.code },
    ds06SelectableInStaleList: ds06InitiallyEnabled,
    chosenBeforeSave: await page.locator('.el-dialog.cc-dialog .cc-chosen-list .el-tag').allInnerTexts(),
    save: await saveAndWait(page, 'PUT', '/api/clients/MULTIAC-ID1X', 40941),
    sourceFieldError: await sourceError(page),
  }
  await cancelDialog(page)
  const rowAfter = await fetchRow('MULTIAC-ID1X')
  result.ac040.afterRejectedSave = {
    idStillOriginal: !!rowAfter,
    newIdAbsent: !(await fetchRow('MULTIAC-ID1Y')),
    descExactUnchanged: !!rowAfter && rowAfter.clientDesc === 'MULTIAC synthetic fixture: probe-ID edit sample. Not a real runtime probe.',
    sourcesUnchanged: rowAfter ? (rowAfter.dataSources || []).map((d) => d.dataSourceId) : null,
  }
  result.ac040.originalUnchanged = result.ac040.afterRejectedSave
}

;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on('request', (req) => {
    const u = req.url()
    if (!u.includes('/api/')) return
    const m = req.method()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') {
      if (u.includes('/api/clients/data-source-options')) result.optionsRequests.push(u)
      return
    }
    let body = null; try { body = req.postDataJSON() } catch (e) {}
    ledgerAdd(m, u, body)
  })
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table tr.el-table__row')
    await page.waitForTimeout(700)
    await run(page)
  } catch (e) {
    result.errors.push(String(e && e.stack ? e.stack : e))
  } finally { await browser.close() }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
  console.log('WROTE ' + OUT)
  console.log('errors=' + result.errors.length)
  if (result.errors.length) process.exitCode = 1
})()
