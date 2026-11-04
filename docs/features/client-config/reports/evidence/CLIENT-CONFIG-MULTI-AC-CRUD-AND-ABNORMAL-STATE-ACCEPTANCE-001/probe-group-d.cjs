/**
 * Group D probe: AC-082 (simultaneous '1'/'0'/abnormal three-state menus, fixed right action
 * column, event isolation at 1440x900 and 1920x1080) and AC-026 (abnormal row supports only
 * disable/delete; real UI disable -> '0'; real UI delete).
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
const OUT = path.join(__dirname, 'group-d-results.json')
const result = {
  task: 'CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001',
  group: 'D', frontend: FRONT, browser: { engine: 'chromium', executable: EXE, headless: true },
  ledger: [], viewports: {}, ac082: {}, ac026: {}, errors: [],
}
function ledgerAdd(method, url, body, extra) {
  let p = url; try { p = new URL(url).pathname } catch (e) {}
  result.ledger.push({ method, path: p, body: body ?? null, ...(extra || {}) })
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
  // Ensure all previous poppers have finished their fade-out before opening the next one.
  await page.locator('.cc-more-popper:visible').first().waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {})
  await row.locator('.cc-more-link').click()
  await page.waitForTimeout(450)
  const poppers = await visiblePoppers(page)
  const count = await poppers.count()
  if (count !== 1) throw new Error(`expected exactly 1 visible popper for ${id}, got ${count}`)
  const items = (await poppers.first().locator('.el-dropdown-menu__item:visible').allInnerTexts()).map((s) => s.trim()).filter(Boolean)
  const editOpen = await page.locator('.el-dialog.cc-dialog').count() > 0 && await page.locator('.el-dialog.cc-dialog').first().isVisible()
  const selected = await page.locator('.cc-table tr.lt-row-highlight__row').count()
  return { items, editOpen, selectedRows: selected }
}
async function closePopper(page) {
  await page.keyboard.press('Escape').catch(() => {})
  await page.locator('.cc-more-popper:visible').first().waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {})
}
async function clickMenu(page, text) {
  const poppers = await visiblePoppers(page)
  if ((await poppers.count()) !== 1) throw new Error('expected exactly 1 visible popper before click')
  await poppers.first().locator('.el-dropdown-menu__item:visible', { hasText: text }).first().click()
}
async function captureBox(page, cls) {
  const box = page.locator(`.el-message-box.${cls}`)
  await box.waitFor({ state: 'visible', timeout: 5000 })
  return {
    title: (await box.locator('.el-message-box__title').innerText()).trim(),
    body: (await box.locator('.el-message-box__message').innerText()).trim(),
    buttons: (await box.locator('.el-message-box__btns button').allInnerTexts()).map((s) => s.trim()).filter(Boolean),
  }
}

async function staticViewport(browser, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await ctx.newPage()
  page.on('request', (req) => {
    if (!req.url().includes('/api/')) return
    const m = req.method(); if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return
    let b = null; try { b = req.postDataJSON() } catch (e) {}
    ledgerAdd(m, req.url(), b)
  })
  const out = {}
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table tr.el-table__row')
    await page.waitForTimeout(600)
    out.structure = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.cc-table thead th.el-table__cell .cell')).map((e) => (e.textContent || '').trim())
      const th = document.querySelector('.cc-table th.lt-row-action__cell')
      const tds = Array.from(document.querySelectorAll('.cc-table td.lt-row-action__cell'))
      const wrap = document.querySelector('.cc-table .el-scrollbar__wrap') || document.querySelector('.cc-table .el-table__body-wrapper')
      const cs = th ? getComputedStyle(th) : null
      return {
        headers,
        rightmostHeader: headers.length ? headers[headers.length - 1] : null,
        actionClassPresent: !!th && tds.length > 0,
        actionThPosition: cs ? cs.position : null,
        actionThRight: cs ? cs.right : null,
        actionTdPosition: tds[0] ? getComputedStyle(tds[0]).position : null,
        viewportWidth: window.innerWidth,
        horizontal: wrap ? { scrollWidth: wrap.scrollWidth, clientWidth: wrap.clientWidth } : null,
      }
    })
    out.menus = {}
    for (const [key, id] of [['enabled', 'MULTIAC-NEW1'], ['disabled', 'MULTIAC-OFF1'], ['abnormal', 'MULTIAC-ABN1']]) {
      const m = await openMenu(page, id)
      out.menus[key] = {
        id,
        items: m.items,
        containsDelete: m.items.includes('删除'),
        containsEnable: m.items.includes('启用'),
        containsDisable: m.items.includes('停用'),
        editDialogOpened: m.editOpen,
        selectedRows: m.selectedRows,
      }
      await closePopper(page)
    }
  } catch (e) { result.errors.push(`${vp.name}: ${String(e && e.stack ? e.stack : e)}`) } finally { await ctx.close() }
  result.viewports[vp.name] = out
}

async function abnormalOperations(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on('request', (req) => {
    if (!req.url().includes('/api/')) return
    const m = req.method(); if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return
    let b = null; try { b = req.postDataJSON() } catch (e) {}
    ledgerAdd(m, req.url(), b)
  })
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table tr.el-table__row')
    await page.waitForTimeout(600)

    // disable MULTIAC-ABN2 via the real UI
    const beforeMenu = await openMenu(page, 'MULTIAC-ABN2')
    await clickMenu(page, '停用')
    const box = await captureBox(page, 'cc-confirm--disable')
    const putP = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-ABN2/disable') && r.request().method() === 'PUT', { timeout: 15000 })
    await page.locator('.el-message-box.cc-confirm--disable .el-message-box__btns button', { hasText: '停用' }).click()
    const putResp = await putP
    let putJson = null; try { putJson = await putResp.json() } catch (e) {}
    await page.waitForTimeout(900)
    const afterRow = await fetchRow('MULTIAC-ABN2')
    const afterMenu = await openMenu(page, 'MULTIAC-ABN2')
    result.ac026.disable = {
      menuBefore: beforeMenu.items,
      confirm: box,
      response: { http: putResp.status, code: putJson ? putJson.code : null },
      fgActiveAfter: afterRow ? afterRow.fgActive : null,
      menuAfter: afterMenu.items,
    }
    await closePopper(page)

    // delete MULTIAC-ABN3 via the real UI
    const delBefore = await openMenu(page, 'MULTIAC-ABN3')
    await clickMenu(page, '删除')
    const delBox = await captureBox(page, 'el-message-box')
    const delP = page.waitForResponse((r) => r.url().includes('/api/clients/MULTIAC-ABN3') && r.request().method() === 'DELETE', { timeout: 15000 })
    await page.locator('.el-message-box .el-message-box__btns button', { hasText: '删除' }).click()
    const delResp = await delP
    let delJson = null; try { delJson = await delResp.json() } catch (e) {}
    await page.waitForTimeout(900)
    result.ac026.delete = {
      menuBefore: delBefore.items,
      confirm: delBox,
      response: { http: delResp.status, code: delJson ? delJson.code : null },
      rowStillPresent: !!(await fetchRow('MULTIAC-ABN3')),
      siblingAbn1StillPresent: !!(await fetchRow('MULTIAC-ABN1')),
    }
  } catch (e) { result.errors.push(String(e && e.stack ? e.stack : e)) } finally { await ctx.close() }
}

;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  try {
    const initial = {
      new1: await fetchRow('MULTIAC-NEW1'), off1: await fetchRow('MULTIAC-OFF1'), abn1: await fetchRow('MULTIAC-ABN1'),
      abn2: await fetchRow('MULTIAC-ABN2'), abn3: await fetchRow('MULTIAC-ABN3'),
    }
    result.ac082.snapshotBefore = {
      new1Fg: initial.new1 ? initial.new1.fgActive : null,
      off1Fg: initial.off1 ? initial.off1.fgActive : null,
      abn1Fg: initial.abn1 ? initial.abn1.fgActive : null,
      abn2Fg: initial.abn2 ? initial.abn2.fgActive : null,
      abn3Fg: initial.abn3 ? initial.abn3.fgActive : null,
      simultaneousThreeStates: !!initial.new1 && initial.new1.fgActive === '1' && !!initial.off1 && initial.off1.fgActive === '0' && !!initial.abn1 && !['0', '1'].includes(initial.abn1.fgActive),
    }
    for (const vp of [{ name: '1440x900', width: 1440, height: 900 }, { name: '1920x1080', width: 1920, height: 1080 }]) {
      await staticViewport(browser, vp)
    }
    await abnormalOperations(browser)
  } finally { await browser.close() }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
  console.log('WROTE ' + OUT); console.log('errors=' + result.errors.length)
  if (result.errors.length) process.exitCode = 1
})()
