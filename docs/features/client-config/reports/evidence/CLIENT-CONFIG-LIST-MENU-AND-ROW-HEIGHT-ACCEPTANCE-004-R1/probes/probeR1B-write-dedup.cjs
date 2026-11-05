/**
 * 004-R1 write probe: real edit + delete with a delayed first request and a real
 * mouse click on the busy element, to prove no duplicate write.
 * Whitelist only:
 *   PUT  /api/clients/CCFG004-NEW1   (delayed 5s, forwarded once)
 *   DELETE /api/clients/CCFG004-DEL2 (delayed 5s, forwarded once)
 * Everything else non-GET is aborted and counted. Only /config/client is visited.
 */
const fs = require('fs')
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core')
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = 'http://127.0.0.1:5173'
const BACK = 'http://127.0.0.1:8080'
const OUT = '/tmp/004r1/r1b-raw.json'

const EDIT_ID = 'CCFG004-NEW1'
const DEL_ID = 'CCFG004-DEL2'
const DELAY_MS = 5000
const NEW_DESC = 'CCFG004-R1 synthetic edit through the real UI during busy-window dedup check. Not a real runtime probe.'

const R = {
  task: 'CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004-R1',
  mode: 'write-gated-live-dedup',
  browser: { engine: 'chromium', version: '147.0.7727.15', headless: true },
  viewport: { width: 1440, height: 900 },
  dpr: 1,
  gate: {
    policy: 'GET/HEAD/OPTIONS allow; PUT /api/clients/CCFG004-NEW1 and DELETE /api/clients/CCFG004-DEL2 delayed+forwarded; others abort+count',
    attempts: [],
    forwarded: [],
    injected: [],
    blocked: [],
    nonGetAttempts: 0,
  },
  flows: {},
  errors: [],
  timing: {},
}

function installGate(ctx) {
  return ctx.route('**/api/**', async (route) => {
    const req = route.request()
    const m = req.method().toUpperCase()
    const path = new URL(req.url()).pathname
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    R.gate.nonGetAttempts++
    R.gate.attempts.push({ m, path, t: Date.now() })
    const isEdit = m === 'PUT' && path === '/api/clients/' + EDIT_ID
    const isDelete = m === 'DELETE' && path === '/api/clients/' + DEL_ID
    if (isEdit || isDelete) {
      const rec = { m, path, tStart: Date.now(), tForward: null, tComplete: null }
      R.gate.forwarded.push(rec)
      await new Promise((r) => setTimeout(r, DELAY_MS))
      rec.tForward = Date.now()
      try { await route.continue() } catch (e) { rec.continueError = String(e) }
      return
    }
    R.gate.blocked.push({ m, path, t: Date.now() })
    return route.abort('blockedbyclient')
  })
}

const q = (page, fn, arg) => page.evaluate(fn, arg)

async function rowByExactId(page, id) {
  const rows = page.locator('.cc-table tbody tr.el-table__row')
  const n = await rows.count()
  for (let i = 0; i < n; i++) {
    const t = (await rows.nth(i).locator('.cc-id').innerText().catch(() => '')).trim()
    if (t === id) return rows.nth(i)
  }
  throw new Error('row not found: ' + id)
}

const menuOpen = (page) => q(page, () => [...document.querySelectorAll('.cc-more-popper')].some((e) => e.getBoundingClientRect().height > 0))

async function openMenu(page, id) {
  const row = await rowByExactId(page, id)
  await page.locator('.cc-more-popper:visible').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {})
  await row.locator('.cc-more-link').click()
  await page.waitForTimeout(350)
  for (let i = 0; i < 20; i++) { if (await menuOpen(page)) break; await page.waitForTimeout(100) }
  return { row, info: await q(page, () => {
    const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.getBoundingClientRect().height > 0)
    if (!p) return { open: false, items: [] }
    return {
      open: true,
      items: [...p.querySelectorAll('.el-dropdown-menu__item')].map((e) => {
        const r = e.getBoundingClientRect()
        return {
          text: e.textContent.trim(), disabled: e.classList.contains('is-disabled'),
          ariaDisabled: e.getAttribute('aria-disabled'), cursor: getComputedStyle(e).cursor,
          rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        }
      }),
    }
  }) }
}

async function clickMenuText(page, text) {
  await page.locator('.cc-more-popper .el-dropdown-menu__item:visible', { hasText: text }).first().click()
}

async function stateAt(page) {
  return q(page, () => {
    const dlg = document.querySelector('.el-dialog.cc-dialog')
    const btn = document.querySelector('.el-dialog.cc-dialog .cc-dialog-submit')
    const b = btn ? btn.getBoundingClientRect() : null
    const mb = document.querySelector('.el-message-box')
    return {
      dialogVisible: !!(dlg && dlg.closest('.el-overlay') && getComputedStyle(dlg.closest('.el-overlay')).display !== 'none' && dlg.getBoundingClientRect().height > 0),
      submit: btn ? {
        disabled: btn.disabled, cls: btn.className, text: (btn.textContent || '').trim(),
        rect: b ? { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) } : null,
      } : null,
      messageBox: mb ? {
        title: (mb.querySelector('.el-message-box__title')?.textContent || '').trim(),
        body: (mb.querySelector('.el-message-box__message')?.textContent || '').trim(),
        buttons: [...mb.querySelectorAll('button')].map((x) => x.textContent.trim()),
      } : null,
      fixed: [...document.querySelectorAll('.lt-row-highlight__row')].map((r) => (r.querySelector('.cc-id')?.textContent || '').trim()).filter(Boolean),
    }
  })
}

async function toastTexts(page) {
  return q(page, () => [...document.querySelectorAll('.el-message')].map((e) => (e.textContent || '').trim()))
}

async function readRow(id) {
  const r = await fetch(BACK + '/api/clients?status=ALL')
  const j = await r.json()
  const items = j.data.items || []
  const row = items.find((x) => x.clientId === id) || null
  return {
    total: items.length,
    present: !!row,
    fgActive: row ? row.fgActive : null,
    desc: row ? row.clientDesc : null,
    sources: row ? (row.dataSources || []).map((d) => d.dataSourceId) : [],
  }
}

; (async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] })
  try {
    const baseline = { edit: await readRow(EDIT_ID), del: await readRow(DEL_ID) }
    R.baseline = baseline
    if (!baseline.edit.present || baseline.edit.fgActive !== '0') throw new Error('edit target precondition failed')
    if (!baseline.del.present || baseline.del.sources.length) throw new Error('delete target precondition failed')

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    await installGate(ctx)
    const page = await ctx.newPage()
    page.on('pageerror', (e) => R.errors.push(String(e)))
    page.on('response', async (resp) => {
      const req = resp.request()
      const m = req.method()
      const path = new URL(resp.url()).pathname
      if ((m === 'PUT' && path === '/api/clients/' + EDIT_ID) || (m === 'DELETE' && path === '/api/clients/' + DEL_ID)) {
        const rec = R.gate.forwarded.find((x) => x.m === m && x.path === path && !x.tComplete)
        if (rec) rec.tComplete = Date.now()
        let body = null
        try { body = await resp.json() } catch (e) {}
        R.timing[m + ' ' + path] = { status: resp.status(), code: body ? body.code : null, t: Date.now() }
      }
    })
    await page.goto(FRONT + '/config/client', { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator('.cc-table tbody tr.el-table__row').first().waitFor({ timeout: 15000 })
    await page.waitForTimeout(500)

    // ===== edit: delayed PUT, real mouse click on disabled save while busy =====
    {
      const row = await rowByExactId(page, EDIT_ID)
      await row.dblclick()
      await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible', timeout: 8000 })
      await page.waitForTimeout(400)
      await page.locator('.el-dialog.cc-dialog .cc-desc-row textarea').fill(NEW_DESC)
      const before = R.gate.attempts.length
      await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click()
      await page.waitForTimeout(700)
      const busy = await stateAt(page)
      const rect = busy.submit.rect
      const tClick = Date.now()
      const hit = await q(page, (pt) => {
        const el = document.elementFromPoint(pt.x, pt.y)
        return el ? { tag: el.tagName, cls: typeof el.className === 'string' ? el.className : null, text: (el.textContent || '').trim().slice(0, 20) } : null
      }, { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 })
      await page.mouse.click(rect.x + rect.w / 2, rect.y + rect.h / 2)
      await page.waitForTimeout(250)
      const afterDup = await stateAt(page)
      const attemptsDuringBusy = R.gate.attempts.slice(before)
      // wait for completion
      for (let i = 0; i < 80; i++) {
        const done = R.gate.forwarded.some((x) => x.m === 'PUT' && x.path === '/api/clients/' + EDIT_ID && x.tComplete)
        if (done) break
        await page.waitForTimeout(200)
      }
      await page.waitForTimeout(600)
      R.flows.edit = {
        targetId: EDIT_ID,
        descBefore: baseline.edit.desc,
        busyState: busy,
        duplicateAction: { t: tClick, hit, buttonState: afterDup.submit, deltaAttempts: attemptsDuringBusy },
        putCount: R.gate.forwarded.filter((x) => x.m === 'PUT').length,
        response: R.timing['PUT /api/clients/' + EDIT_ID] || null,
        dialogClosed: !(await stateAt(page)).dialogVisible,
        toast: await toastTexts(page),
        readback: await readRow(EDIT_ID),
        descExpected: NEW_DESC,
      }
      // wait out any list reload
      await page.waitForTimeout(800)
    }

    // ===== delete: delayed DELETE, real mouse click on disabled menu item while busy =====
    {
      const { row, info } = await openMenu(page, DEL_ID)
      const itemsBefore = info.items
      await clickMenuText(page, '删除')
      await page.locator('.el-message-box').waitFor({ state: 'visible', timeout: 6000 })
      const box = await q(page, () => {
        const mb = document.querySelector('.el-message-box')
        return { title: (mb.querySelector('.el-message-box__title')?.textContent || '').trim(), body: (mb.querySelector('.el-message-box__message')?.textContent || '').trim(), buttons: [...mb.querySelectorAll('button')].map((x) => x.textContent.trim()) }
      })
      const before = R.gate.attempts.length
      await page.locator('.el-message-box .el-message-box__btns button', { hasText: '删除' }).click()
      await page.waitForTimeout(600)
      const busyMenu = await openMenu(page, DEL_ID)
      const delItem = busyMenu.info.items.find((i) => i.text === '删除')
      let duplicate = { performed: false }
      if (delItem) {
        const cx = delItem.rect.x + delItem.rect.w / 2
        const cy = delItem.rect.y + delItem.rect.h / 2
        const hit = await q(page, (pt) => {
          const el = document.elementFromPoint(pt.x, pt.y)
          return el ? { tag: el.tagName, cls: typeof el.className === 'string' ? el.className : null, text: (el.textContent || '').trim().slice(0, 20) } : null
        }, { x: cx, y: cy })
        const tClick = Date.now()
        await page.mouse.click(cx, cy)
        await page.waitForTimeout(250)
        duplicate = { performed: true, t: tClick, hit, deltaAttempts: R.gate.attempts.slice(before), menuStillOpen: await menuOpen(page) }
      }
      await page.keyboard.press('Escape').catch(() => {})
      for (let i = 0; i < 80; i++) {
        const done = R.gate.forwarded.some((x) => x.m === 'DELETE' && x.path === '/api/clients/' + DEL_ID && x.tComplete)
        if (done) break
        await page.waitForTimeout(200)
      }
      await page.waitForTimeout(900)
      const readback = await readRow(DEL_ID)
      const rowStill = await page.locator('.cc-table tbody tr.el-table__row').filter({ hasText: DEL_ID }).count().catch(() => -1)
      R.flows.delete = {
        targetId: DEL_ID,
        menuItemsBefore: itemsBefore.map((i) => i.text),
        confirmBox: box,
        busyMenuItems: busyMenu.info.items.map((i) => ({ text: i.text, disabled: i.disabled, ariaDisabled: i.ariaDisabled, cursor: i.cursor })),
        duplicateAction: duplicate,
        deleteCount: R.gate.forwarded.filter((x) => x.m === 'DELETE').length,
        response: R.timing['DELETE /api/clients/' + DEL_ID] || null,
        toast: await toastTexts(page),
        rowPresentInUi: rowStill > 0,
        fixed: (await stateAt(page)).fixed,
        readback,
      }
    }

    R.final = { edit: await readRow(EDIT_ID), del: await readRow(DEL_ID) }
    R.gateSummary = { nonGetAttempts: R.gate.nonGetAttempts, forwarded: R.gate.forwarded, injected: R.gate.injected, blocked: R.gate.blocked }
    fs.writeFileSync(OUT, JSON.stringify(R, null, 2))
    console.log('RAW_WRITTEN', OUT, 'nonGetAttempts=', R.gate.nonGetAttempts)
  } catch (e) {
    R.errors.push(String(e && e.stack || e))
    fs.writeFileSync(OUT, JSON.stringify(R, null, 2))
    console.log('ERROR_WRITTEN', String(e))
    process.exitCode = 1
  } finally {
    await browser.close()
  }
})()
