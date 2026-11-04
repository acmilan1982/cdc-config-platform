/**
 * AC-054 supplement: the current record's own source must not be disabled because of an
 * "occupied/assigned" reason after the draft probe ID is changed but unsaved.
 * Removes the chosen chip and re-checks: the option becomes clickable when it is not chosen,
 * which distinguishes "disabled because already chosen" from "disabled because assigned elsewhere".
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
const OUT = path.join(__dirname, 'ac054-supplement-results.json')
const result = { task: 'CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001', check: 'AC-054', optionsRequests: [], observations: {}, errors: [] }

async function run(page) {
  const ids = await page.$$eval('.cc-table tr.el-table__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim()))
  const row = page.locator('.cc-table tr.el-table__row').nth(ids.indexOf('MULTIAC-ID1X'))
  await row.scrollIntoViewIfNeeded()
  await row.dblclick()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible' })
  await page.waitForTimeout(600)
  const originalId = 'MULTIAC-ID1X'
  const optReq = result.optionsRequests[result.optionsRequests.length - 1] || null
  const btn = page.locator('.el-dialog.cc-dialog .cc-id-toggle')
  if ((await btn.count()) && (await btn.first().isVisible())) await btn.first().click()
  await page.locator('.el-dialog.cc-dialog .cc-id-control input').fill('MULTIAC-ID1R')
  await page.waitForTimeout(200)
  const opt = page.locator('.cc-opt').filter({ hasText: 'CCFG-AC-R1-DS07' }).first()
  const reason = page.locator('.cc-opt').filter({ hasText: 'CCFG-AC-R1-DS07' }).first().locator('.cc-opt-reason')
  const apiOpt = await (async () => {
    const j = await (await fetch(`${BACK}/api/clients/data-source-options?excludeClientId=${encodeURIComponent(originalId)}`)).json()
    return (j.data || []).find((x) => x.dataSourceId === 'CCFG-AC-R1-DS07') || null
  })()
  const before = {
    disabledWhileChosen: await opt.isDisabled(),
    disabledClass: ((await opt.getAttribute('class')) || '').includes('cc-opt--disabled'),
    reasonText: (await reason.count()) ? (await reason.first().innerText()).trim() : null,
    apiSelectable: apiOpt ? apiOpt.selectable : null,
    apiOccupiedBy: apiOpt ? apiOpt.occupiedByClientIds : null,
    apiReason: apiOpt ? apiOpt.notSelectableReason : null,
  }
  // Remove the chip: an own, unoccupied source must become selectable again.
  await page.locator('.el-dialog.cc-dialog .cc-chosen-list .el-tag').first().locator('.el-tag__close').click()
  await page.waitForTimeout(250)
  const afterRemove = {
    disabledAfterChipRemoved: await opt.isDisabled(),
    disabledClassAfterChipRemoved: ((await opt.getAttribute('class')) || '').includes('cc-opt--disabled'),
    reasonTextAfterChipRemoved: (await reason.count()) ? (await reason.first().innerText()).trim() : null,
  }
  // Re-add and cancel without saving.
  await opt.click()
  await page.waitForTimeout(150)
  result.observations = {
    originalId,
    draftIdChangedUnsavedTo: 'MULTIAC-ID1R',
    optionsRequestUrl: optReq,
    optionsExcludeEqualsOriginalId: !!optReq && optReq.includes(`excludeClientId=${originalId}`),
    whileChosen: before,
    afterChipRemoved: afterRemove,
    ownSourceSelectableAfterDeselect: !afterRemove.disabledAfterChipRemoved && !afterRemove.disabledClassAfterChipRemoved,
    noOccupiedReasonShown: before.reasonText === null,
    chosenCountAfterReAdd: await page.locator('.el-dialog.cc-dialog .cc-chosen-list .el-tag').count(),
  }
  await page.locator('.el-dialog.cc-dialog .el-dialog__footer .el-button', { hasText: '取消' }).click()
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden' })
}

;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on('request', (req) => {
    if (req.url().includes('/api/clients/data-source-options')) result.optionsRequests.push(req.url())
  })
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table tr.el-table__row')
    await page.waitForTimeout(600)
    await run(page)
  } catch (e) { result.errors.push(String(e && e.stack ? e.stack : e)) } finally { await browser.close() }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
  console.log('WROTE ' + OUT); console.log('errors=' + result.errors.length)
  if (result.errors.length) process.exitCode = 1
})()
