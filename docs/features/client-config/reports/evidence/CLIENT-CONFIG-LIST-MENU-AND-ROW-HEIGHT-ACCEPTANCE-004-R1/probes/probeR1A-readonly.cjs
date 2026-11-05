/**
 * 004-R1 read-only probe: explain menu-isolation conflict (delete-item dblclick),
 * replicate probeA's exact sequence, and verify delete-item keyboard focus.
 * Only /config/client is visited. Gate before first navigation.
 */
const fs = require('fs')
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core')
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = 'http://127.0.0.1:5173'
const OUT = '/tmp/004r1/r1a-raw.json'

const R = {
  task: 'CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004-R1',
  mode: 'readonly-live',
  browser: { engine: 'chromium', version: '147.0.7727.15', headless: true },
  viewport: { width: 1440, height: 900 },
  dpr: 1,
  gate: { policy: '/api/** GET/HEAD/OPTIONS allow; others abort+count', nonGetAttempts: 0, attempts: [] },
  dialogDoubleClick: {},
  focus: {},
  errors: [],
}

function installGate(ctx) {
  return ctx.route('**/api/**', async (route) => {
    const req = route.request()
    const m = req.method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    R.gate.nonGetAttempts++
    R.gate.attempts.push({ m, path: new URL(req.url()).pathname })
    return route.abort('blockedbyclient')
  })
}

const q = (page, fn, arg) => page.evaluate(fn, arg)

const stateFn = () => {
  const dialogs = [...document.querySelectorAll('.cc-dialog')].map((d) => {
    const ov = d.closest('.el-overlay')
    return {
      display: getComputedStyle(d).display,
      h: +d.getBoundingClientRect().height.toFixed(2),
      title: (d.querySelector('.el-dialog__title')?.textContent || '').trim(),
      overlayDisplay: ov ? getComputedStyle(ov).display : null,
      overlayPointer: ov ? getComputedStyle(ov).pointerEvents : null,
      overlayH: ov ? +ov.getBoundingClientRect().height.toFixed(1) : null,
    }
  })
  const visible = dialogs.filter((d) => d.display !== 'none' && d.h > 0)
  const mb = document.querySelector('.el-message-box')
  return {
    dialogCount: dialogs.length,
    visibleDialogCount: visible.length,
    dialogs,
    aStyleFirstDialog: (() => { const d = document.querySelector('.cc-dialog'); return d ? { display: getComputedStyle(d).display, h: +d.getBoundingClientRect().height.toFixed(2) } : null })(),
    messageBox: mb ? {
      title: (mb.querySelector('.el-message-box__title')?.textContent || '').trim(),
      body: (mb.querySelector('.el-message-box__message')?.textContent || '').trim(),
      buttons: [...mb.querySelectorAll('button')].map((b) => b.textContent.trim()),
    } : null,
    messageBoxCount: document.querySelectorAll('.el-message-box').length,
    fixed: [...document.querySelectorAll('.lt-row-highlight__row')].map((r) => (r.querySelector('.cc-id')?.textContent || '').trim()).filter(Boolean),
  }
}

async function closeEverything(page) {
  if (await page.locator('.el-message-box').count().catch(() => 0)) { await page.keyboard.press('Escape'); await page.waitForTimeout(350) }
  const vis = await page.locator('.cc-dialog .el-dialog__headerbtn').first().isVisible().catch(() => false)
  if (vis) { await page.locator('.cc-dialog .el-dialog__headerbtn').first().click().catch(() => {}); await page.waitForTimeout(400) }
}

async function rowByExactId(page, id) {
  const rows = page.locator('.cc-table tbody tr.el-table__row')
  const n = await rows.count()
  for (let i = 0; i < n; i++) {
    const t = (await rows.nth(i).locator('.cc-id').innerText().catch(() => '')).trim()
    if (t === id) return { row: rows.nth(i), index: i }
  }
  throw new Error('row not found: ' + id)
}

async function openMenu(page, id) {
  const { row, index } = await rowByExactId(page, id)
  await row.locator('.cc-more-link').click()
  await page.waitForTimeout(350)
  const info = await q(page, () => {
    const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.getBoundingClientRect().height > 0)
    if (!p) return { open: false, items: [] }
    return {
      open: true,
      items: [...p.querySelectorAll('.el-dropdown-menu__item')].map((e) => {
        const r = e.getBoundingClientRect()
        return {
          text: e.textContent.trim(), role: e.getAttribute('role'), cls: e.className,
          disabled: e.classList.contains('is-disabled'), ariaDisabled: e.getAttribute('aria-disabled'),
          fontWeight: getComputedStyle(e).fontWeight, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor,
          rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        }
      }),
    }
  })
  return { row, index, info }
}

const MENU_OPEN = () => [...document.querySelectorAll('.cc-more-popper')].some((e) => e.getBoundingClientRect().height > 0)

; (async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] })
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    await installGate(ctx)
    const page = await ctx.newPage()
    page.on('pageerror', (e) => R.errors.push(String(e)))
    await page.goto(FRONT + '/config/client', { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator('.cc-table tbody tr.el-table__row').first().waitFor({ timeout: 15000 })
    await page.waitForTimeout(600)

    R.initial = await q(page, stateFn)

    // ---- control: single click delete -> confirm appears; cancel only ----
    {
      const { info } = await openMenu(page, 'CCFG004-DEL2')
      const del = info.items.find((i) => i.text === '删除')
      await page.locator('.cc-more-popper .el-dropdown-menu__item:visible', { hasText: '删除' }).first().click()
      await page.waitForTimeout(500)
      const after = await q(page, stateFn)
      await closeEverything(page)
      R.singleClickControl = { rowId: 'CCFG004-DEL2', menuItems: info.items.map((i) => i.text), deleteItem: del, after, afterClose: await q(page, stateFn) }
    }

    // ---- R1-01: real double click on visible delete item from clean state ----
    async function dblClickDelete(id, label) {
      const pre = await q(page, stateFn)
      const { index, info } = await openMenu(page, id)
      const del = info.items.find((i) => i.text === '删除')
      await q(page, () => {
        window.__evt = []
        if (window.__r1Bound) return
        window.__r1Bound = true
        ;['click', 'dblclick'].forEach((t) => document.addEventListener(t, (e) => {
          const el = e.target
          const tr = el && el.closest ? el.closest('tr') : null
          window.__evt.push({
            t, tag: el && el.tagName,
            cls: typeof (el && el.className) === 'string' ? el.className : null,
            text: ((el && el.textContent) || '').trim().slice(0, 24),
            inMenu: !!(el && el.closest && el.closest('.cc-more-popper')),
            inRow: !!tr, rowId: tr ? ((tr.querySelector('.cc-id') || {}).textContent || '').trim() : null,
          })
        }, true))
      })
      const box = await page.locator('.cc-more-popper .el-dropdown-menu__item:visible', { hasText: '删除' }).first().boundingBox()
      const target = box ? { x: +(box.x + box.width / 2).toFixed(1), y: +(box.y + box.height / 2).toFixed(1) } : null
      const hitBefore = await q(page, (pt) => {
        const el = document.elementFromPoint(pt.x, pt.y)
        return el ? { tag: el.tagName, cls: typeof el.className === 'string' ? el.className : null, text: (el.textContent || '').trim().slice(0, 24) } : null
      }, target)
      await page.mouse.dblclick(target.x, target.y, { delay: 60 })
      await page.waitForTimeout(700)
      const after = await q(page, stateFn)
      const events = await q(page, () => (window.__evt || []).slice(-12))
      await closeEverything(page)
      const afterCleanup = await q(page, stateFn)
      R.dialogDoubleClick[label] = { rowId: id, rowIndex: index, pre, menuItems: info.items.map((i) => i.text), deleteItem: del, target, hitBefore, after, events, afterCleanup }
      await page.waitForTimeout(300)
    }

    await dblClickDelete('CCFG004-DEL2', 'trial1_del2')
    await dblClickDelete('CCFG004-OFF', 'trial2_off')

    // ---- Replicate probeA's exact sequence to explain dlgAfterMenu=true ----
    {
      const seq = {}
      seq.step0_initial = await q(page, stateFn)
      // A: dblclick edit entrance on 6th row via .cc-seq
      const seqRow1 = page.locator('.cc-table tbody tr.el-table__row').nth(5)
      const id1 = (await seqRow1.locator('.cc-id').innerText().catch(() => '')).trim()
      await seqRow1.locator('.cc-seq').dblclick()
      await page.waitForTimeout(700)
      seq.step1_afterDblEdit = { rowId: id1, state: await q(page, stateFn) }
      let close1 = 'ok'
      try { await page.click('.cc-dialog .el-dialog__headerbtn', { timeout: 5000 }) } catch (e) { close1 = String(e).slice(0, 240) }
      await page.waitForTimeout(500)
      seq.step2_afterClose1 = { closeResult: close1, state: await q(page, stateFn) }
      // A: keyboard edit on 7th row via .cc-id
      const seqRow2 = page.locator('.cc-table tbody tr.el-table__row').nth(6)
      const id2 = (await seqRow2.locator('.cc-id').innerText().catch(() => '')).trim()
      await seqRow2.locator('.cc-id').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(700)
      seq.step3_afterKbEdit = { rowId: id2, state: await q(page, stateFn) }
      let close2 = 'ok'
      try { await page.click('.cc-dialog .el-dialog__headerbtn', { timeout: 5000 }) } catch (e) { close2 = String(e).slice(0, 240) }
      await page.waitForTimeout(500)
      seq.step4_afterClose2 = { closeResult: close2, state: await q(page, stateFn) }
      // A: open menu on 8th row and dblclick delete item
      const menuRow = page.locator('.cc-table tbody tr.el-table__row').nth(7)
      const id3 = (await menuRow.locator('.cc-id').innerText().catch(() => '')).trim()
      let menuClick = 'ok'
      try { await menuRow.locator('.cc-more-link').click({ timeout: 5000 }) } catch (e) { menuClick = String(e).slice(0, 240) }
      await page.waitForTimeout(400)
      seq.step5_menu = { rowId: id3, clickResult: menuClick, menuOpen: await q(page, MENU_OPEN), state: await q(page, stateFn) }
      const items = await q(page, () => {
        const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.getBoundingClientRect().height > 0)
        return p ? [...p.querySelectorAll('.el-dropdown-menu__item')].map((e) => e.textContent.trim()) : []
      })
      let dblResult = 'ok'
      try { await page.locator('.cc-more-popper .el-dropdown-menu__item', { hasText: '删除' }).first().dblclick({ timeout: 5000 }) } catch (e) { dblResult = String(e).slice(0, 240) }
      await page.waitForTimeout(400)
      seq.step6_afterDeleteDbl = { items, dblResult, state: await q(page, stateFn) }
      await closeEverything(page)
      seq.step7_cancelled = await q(page, stateFn)
      R.aSequenceReplication = seq
    }

    // ---- R1-03: focus delete item via keyboard ----
    {
      const { row } = await rowByExactId(page, 'CCFG004-ON')
      const trig = row.locator('.cc-more-link')
      await trig.focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(400)
      const active = () => q(page, () => {
        const el = document.activeElement
        if (!el) return null
        const cs = getComputedStyle(el)
        return { tag: el.tagName, role: el.getAttribute('role'), cls: typeof el.className === 'string' ? el.className : null, text: (el.textContent || '').trim().slice(0, 30), tabIndex: el.tabIndex, bg: cs.backgroundColor, color: cs.color, outline: cs.outline }
      })
      const steps = [{ step: 'afterEnter', active: await active(), menuOpen: await q(page, MENU_OPEN) }]
      await page.mouse.move(600, 60)
      for (let i = 1; i <= 4; i++) {
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(180)
        steps.push({ step: 'ArrowDown<' + i + '>', active: await active(), menuOpen: await q(page, MENU_OPEN) })
      }
      await page.keyboard.press('Tab')
      await page.waitForTimeout(180)
      steps.push({ step: 'Tab', active: await active(), menuOpen: await q(page, MENU_OPEN) })
      await page.keyboard.press('Shift+Tab')
      await page.waitForTimeout(180)
      steps.push({ step: 'Shift+Tab', active: await active(), menuOpen: await q(page, MENU_OPEN) })

      // reopen if keyboard traversal closed the popper
      if (!(await q(page, MENU_OPEN))) {
        await trig.focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(350)
        steps.push({ step: 'reopened', active: await active(), menuOpen: await q(page, MENU_OPEN) })
      }
      let fallback = null
      const deleteIsActive = await q(page, () => ((document.activeElement && document.activeElement.textContent) || '').trim() === '删除')
      if (!deleteIsActive) {
        fallback = await q(page, () => {
          const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.getBoundingClientRect().height > 0)
          const del = p ? [...p.querySelectorAll('.el-dropdown-menu__item')].find((e) => e.textContent.trim() === '删除') : null
          if (!del) return { applied: false }
          del.focus()
          const cs = getComputedStyle(del)
          const el = document.activeElement
          return { applied: true, tag: el.tagName, role: el.getAttribute('role'), cls: el.className, text: el.textContent.trim(), tabIndex: el.tabIndex, bg: cs.backgroundColor, color: cs.color, outline: cs.outline }
        })
        await page.mouse.move(600, 60)
        await page.waitForTimeout(200)
        steps.push({ step: 'domFocusDelete(mouseAway)', active: await active(), menuOpen: await q(page, MENU_OPEN) })
      }
      const styles = await q(page, () => {
        const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.getBoundingClientRect().height > 0)
        if (!p) return null
        return {
          items: [...p.querySelectorAll('li')].map((e) => {
            const cs = getComputedStyle(e); const r = e.getBoundingClientRect()
            return {
              text: e.textContent.trim(), role: e.getAttribute('role'), cls: e.className, tabIndex: e.tabIndex,
              fontWeight: cs.fontWeight, color: cs.color, bg: cs.backgroundColor, outline: cs.outline,
              borderTopWidth: cs.borderTopWidth, borderTopStyle: cs.borderTopStyle, borderTopColor: cs.borderTopColor,
              marginTop: cs.marginTop, h: +r.height.toFixed(2),
            }
          }),
        }
      })
      let hover = null
      if (await q(page, MENU_OPEN)) {
        const delBox = await page.locator('.cc-more-popper .el-dropdown-menu__item:visible', { hasText: '删除' }).first().boundingBox()
        if (delBox) {
          await page.mouse.move(delBox.x + delBox.width / 2, delBox.y + delBox.height / 2)
          await page.waitForTimeout(250)
          hover = await q(page, () => {
            const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.getBoundingClientRect().height > 0)
            const del = p ? [...p.querySelectorAll('.el-dropdown-menu__item')].find((e) => e.textContent.trim() === '删除') : null
            if (!del) return null
            const cs = getComputedStyle(del)
            return { bg: cs.backgroundColor, color: cs.color }
          })
          await page.mouse.move(600, 60)
          await page.waitForTimeout(250)
        }
      }
      const afterMouseAway = await active()
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
      R.focus = { rowId: 'CCFG004-ON', steps, deleteIsActiveByKeyboard: deleteIsActive, domFocusFallback: fallback, menuStyles: styles, deleteHover: hover, afterMouseAway, nonGetAttempts: R.gate.nonGetAttempts }
    }

    R.finalState = await q(page, stateFn)
    R.nonGetAttemptsFinal = R.gate.nonGetAttempts
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
