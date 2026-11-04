/**
 * Group A probe: AC-131 (description save boundary) + AC-031 (create, no status field, FG_ACTIVE=1).
 * Real browser UI saves plus one direct-backend bypass request. Synthetic MULTIAC-* fixtures only.
 * Raw responses stay outside the repo; the emitted JSON is limited to synthetic IDs/counters/flags.
 */
const fs = require('fs')
const path = require('path')

const PW = [
  '/root/.hermes/hermes-agent/node_modules/playwright-core',
  '/usr/lib/node_modules/openclaw/node_modules/playwright-core',
  '/data/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core',
]
let chromium
for (const p of PW) { try { chromium = require(p).chromium; break } catch (e) {} }
if (!chromium) { console.error('no playwright-core'); process.exit(2) }

const EXE = process.env.PROBE_CHROME || '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = 'http://127.0.0.1:5173'
const BACK = 'http://127.0.0.1:8080'
const OUT = path.join(__dirname, 'group-a-results.json')
const HAN256 = '测'.repeat(256)
const EMOJI256 = '😀'.repeat(256)
const EMOJI257 = '😀'.repeat(257)
const HAN300 = '测'.repeat(300)

const result = {
  task: 'CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001',
  group: 'A',
  frontend: FRONT,
  browser: { engine: 'chromium', executable: EXE, headless: true },
  ledger: [],
  ac031: {},
  ac131: {},
  errors: [],
}

function ledgerAdd(method, url, body, extra) {
  const rec = { method, path: (() => { try { return new URL(url).pathname } catch (e) { return url } })(), body: body ?? null, ...(extra || {}) }
  result.ledger.push(rec)
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
  await page.waitForTimeout(400)
}
async function unlockId(page) {
  const btn = page.locator('.el-dialog.cc-dialog .cc-id-toggle')
  if ((await btn.count()) > 0 && (await btn.first().isVisible()) && ((await btn.first().innerText()).includes('修改探针 ID'))) {
    await btn.first().click()
  }
}
async function setId(page, id) {
  await unlockId(page)
  await page.locator('.el-dialog.cc-dialog .cc-id-control input').fill(id)
}
async function setDesc(page, text) {
  await page.locator('.el-dialog.cc-dialog .cc-desc-row textarea').fill(text)
}
async function descValue(page) {
  return page.locator('.el-dialog.cc-dialog .cc-desc-row textarea').inputValue()
}
async function chooseSource(page, dsId) {
  const opt = page.locator('.cc-opt').filter({ hasText: dsId }).first()
  await opt.waitFor({ state: 'visible', timeout: 8000 })
  await opt.click()
}
async function chosenCount(page) {
  return page.locator('.el-dialog.cc-dialog .cc-chosen-list .el-tag').count()
}
async function submit(page, method, urlPart, expectedCode) {
  const respP = page.waitForResponse((r) => r.url().includes(urlPart) && r.request().method() === method, { timeout: 15000 })
  await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click()
  const resp = await respP
  let payload = null
  try { payload = await resp.json() } catch (e) {}
  if (expectedCode != null && payload && payload.code !== expectedCode) {
    result.errors.push(`unexpected business code ${payload.code} for ${method} ${urlPart}, expected ${expectedCode}`)
  }
  return { http: resp.status(), code: payload ? payload.code : null, message: payload ? payload.message : null }
}
async function dialogVisible(page) {
  const d = page.locator('.el-dialog.cc-dialog')
  return (await d.count()) > 0 && (await d.first().isVisible())
}
async function fetchRow(id) {
  const r = await fetch(`${BACK}/api/clients?status=ALL`)
  const j = await r.json()
  return (j.data.items || []).find((x) => x.clientId === id) || null
}

async function run(page) {
  // ---------- AC-031: create via real UI ----------
  await page.getByRole('button', { name: '新增探针' }).click()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible' })
  await page.waitForTimeout(400)
  const formTexts = await page.locator('.el-dialog.cc-dialog .cc-form-label').allInnerTexts()
  const statusControlCount = await page.locator('.el-dialog.cc-dialog .cc-form-label', { hasText: '状态' }).count()
  result.ac031.form = {
    labels: formTexts.map((s) => s.trim()),
    hasStatusLabel: statusControlCount > 0,
    hasStatusSelect: (await page.locator('.el-dialog.cc-dialog .el-select').count()) > 0,
  }
  await setId(page, 'MULTIAC-NEW1')
  await setDesc(page, 'MULTIAC synthetic create sample created through the real UI. Not a real runtime probe.')
  await chooseSource(page, 'CCFG-AC-R1-DS01')
  result.ac031.chosenCount = await chosenCount(page)
  result.ac031.createResponse = await submit(page, 'POST', '/api/clients', 200)
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 10000 })
  await page.waitForTimeout(800)
  const created = await fetchRow('MULTIAC-NEW1')
  result.ac031.createdRow = created ? {
    present: true,
    clientId: created.clientId,
    fgActive: created.fgActive,
    status: created.status,
    dataSourceIds: (created.dataSources || []).map((d) => d.dataSourceId),
    descByteLength: Buffer.byteLength(created.clientDesc || '', 'utf8'),
  } : { present: false }
  result.ac031.fgActiveIsOne = !!created && created.fgActive === '1'

  // ---------- AC-131 step 1: 256 hanzi ----------
  await openEdit(page, 'MULTIAC-DESC')
  await setDesc(page, HAN256)
  result.ac131.s1 = { inputCodePoints: Array.from(await descValue(page)).length }
  result.ac131.s1.save = await submit(page, 'PUT', '/api/clients/MULTIAC-DESC', 200)
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 10000 })
  await page.waitForTimeout(700)
  const row1 = await fetchRow('MULTIAC-DESC')
  result.ac131.s1.persisted = row1 ? {
    codePoints: Array.from(row1.clientDesc || '').length,
    utf8Bytes: Buffer.byteLength(row1.clientDesc || '', 'utf8'),
    exactMatch: row1.clientDesc === HAN256,
  } : null

  // ---------- AC-131 step 2: 256 four-byte code points = exactly 1024 bytes ----------
  await openEdit(page, 'MULTIAC-DESC')
  await setDesc(page, EMOJI256)
  result.ac131.s2 = { inputCodePoints: Array.from(await descValue(page)).length }
  result.ac131.s2.save = await submit(page, 'PUT', '/api/clients/MULTIAC-DESC', 200)
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 10000 })
  await page.waitForTimeout(700)
  const row2 = await fetchRow('MULTIAC-DESC')
  result.ac131.s2.persisted = row2 ? {
    codePoints: Array.from(row2.clientDesc || '').length,
    utf8Bytes: Buffer.byteLength(row2.clientDesc || '', 'utf8'),
    exactMatch: row2.clientDesc === EMOJI256,
  } : null

  // ---------- AC-131 step 3 (direct backend bypass): 257 emoji = 1028 bytes -> reject ----------
  const directResp = await fetch(`${BACK}/api/clients/MULTIAC-DESC`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: 'MULTIAC-DESC', clientDesc: EMOJI257, dataSourceIds: ['77711'] }),
  })
  const directJson = await directResp.json()
  ledgerAdd('PUT', `${BACK}/api/clients/MULTIAC-DESC`, { clientDescBytes: Buffer.byteLength(EMOJI257, 'utf8'), codePoints: Array.from(EMOJI257).length }, { businessCode: directJson.code, injected: 'none (direct backend call)' })
  result.ac131.s3 = {
    requestUtf8Bytes: Buffer.byteLength(EMOJI257, 'utf8'),
    http: directResp.status,
    code: directJson.code,
    message: directJson.message,
  }
  await page.waitForTimeout(500)
  const row3 = await fetchRow('MULTIAC-DESC')
  result.ac131.s3.noPartialWrite = !!row3 && row3.clientDesc === EMOJI256

  // ---------- AC-131 step 4: leading/trailing whitespace saved verbatim ----------
  result.ac131.s4 = {}
  const padded = '  MULTIAC padded description  '
  await openEdit(page, 'MULTIAC-DESC')
  await setDesc(page, padded)
  result.ac131.s4.save = await submit(page, 'PUT', '/api/clients/MULTIAC-DESC', 200)
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 10000 })
  await page.waitForTimeout(700)
  const row4 = await fetchRow('MULTIAC-DESC')
  result.ac131.s4.persisted = row4 ? {
    exactMatch: row4.clientDesc === padded,
    leadingSpaces: /^  /.test(row4.clientDesc || ''),
    trailingSpaces: /  $/.test(row4.clientDesc || ''),
    utf8Bytes: Buffer.byteLength(row4.clientDesc || '', 'utf8'),
  } : null

  // ---------- AC-131 step 5: UI 257th-codepoint cap (live) ----------
  await openEdit(page, 'MULTIAC-DESC')
  await setDesc(page, HAN300)
  const afterHan = await descValue(page)
  await setDesc(page, '😀'.repeat(300))
  const afterEmoji = await descValue(page)
  result.ac131.s5 = {
    liveInput: {
      hanziInputCodePoints: 300,
      hanziFinalCodePoints: Array.from(afterHan).length,
      emojiInputCodePoints: 300,
      emojiFinalCodePoints: Array.from(afterEmoji).length,
      emojiLoneSurrogate: /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(afterEmoji),
    },
    reviewedEvidenceReuse: 'CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002-R1 r1-dialog-results.json clipboard.cases.han300/mixed (keys verified before reuse)',
  }
  // Close without saving the probe input.
  await page.locator('.el-dialog.cc-dialog .el-dialog__footer .el-button', { hasText: '取消' }).click()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 8000 })
}

;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on('request', (req) => {
    const u = req.url()
    if (!u.includes('/api/')) return
    const m = req.method()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return
    let body = null
    try { body = req.postDataJSON() } catch (e) {}
    ledgerAdd(m, u, body)
  })
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table tr.el-table__row')
    await page.waitForTimeout(800)
    await run(page)
  } catch (e) {
    result.errors.push(String(e && e.stack ? e.stack : e))
    try { result.dialogVisibleAtFailure = await dialogVisible(page) } catch (e2) {}
  } finally {
    await browser.close()
  }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
  console.log('WROTE ' + OUT)
  console.log('errors=' + result.errors.length)
  if (result.errors.length) process.exitCode = 1
})()
