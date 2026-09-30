/**
 * CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001
 * Read-only probe for newly-constructible read-only gaps on /config/client ONLY.
 *
 * Safety: BEFORE navigating, every non-GET/HEAD/OPTIONS request to `/api/**`
 * is aborted at the network layer and counted. No form is submitted, no
 * enable/disable/delete confirmation is confirmed, no fixture is created,
 * no database / ZooKeeper / Kafka is touched. The only "dialog" interactions
 * are: open the create dialog and type un-submitted drafts, click submit on a
 * deliberately-empty form (client-side validation only), and open a
 * disable/enable confirm then CANCEL it.
 *
 * Scoped to /config/client only: no other feature page is loaded.
 *
 * Output is desensitized: business-identifiable values (org names, raw probe
 * ids, raw data-source ids) are never captured; only presence/booleans/geometry
 * and static UI copy are recorded.
 */
const PW = ['/usr/lib/node_modules/openclaw/node_modules/playwright-core',
  '/data/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core',
  '/root/.hermes/hermes-agent/node_modules/playwright-core']
let chromium
for (const p of PW) { try { chromium = require(p).chromium; break } catch (e) {} }
if (!chromium) { console.error('no playwright-core'); process.exit(2) }
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'

const FRONT = process.env.GAP_FRONT || 'http://127.0.0.1:5173'
const OUT = process.env.GAP_OUT || '/tmp/gap-probe-out'
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

const LIST_EVAL = () => {
  const tbl = document.querySelector('.cc-table.lt-main-table')
  const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
  const headerCells = Array.from(document.querySelectorAll('.cc-table .el-table__header-wrapper th.el-table__cell'))
  const headers = headerCells.map((th) => (th.querySelector('.cell')?.textContent || '').trim())
  const seq = rows.map((tr) => {
    const s = tr.querySelector('.cc-seq')
    return s ? s.textContent.trim() : null
  })
  const heights = rows.map((tr) => tr.getBoundingClientRect().height)
  // wrap / overlong detection: any cell whose .cell scrollHeight exceeds clientHeight
  const wrapped = []
  rows.forEach((tr, i) => {
    const bad = Array.from(tr.querySelectorAll('td.el-table__cell .cell')).some((c) => {
      const st = getComputedStyle(c)
      const multiline = st.whiteSpace !== 'nowrap' && st.whiteSpace !== 'pre' && c.scrollHeight > c.clientHeight + 1
      return multiline
    })
    if (bad) wrapped.push(i + 1)
  })
  const dsCell = (tr) => Array.from(tr.querySelectorAll('td.el-table__cell'))[3]
  const tagStats = rows.map((tr, i) => {
    const c = dsCell(tr)
    if (!c) return { idx: i + 1, tagCount: 0, plusText: null }
    const tags = c.querySelectorAll('.cc-dstag')
    const plus = c.querySelector('.cc-more')
    return { idx: i + 1, tagCount: tags.length, plusText: plus ? plus.textContent.trim() : null }
  })
  // toolbar / add button position
  const toolbar = document.querySelector('.ql-result-panel__toolbar')
  const addBtn = document.querySelector('.cc-btn-add')
  let addBtnRightmost = null
  if (toolbar && addBtn) {
    const kids = Array.from(toolbar.querySelectorAll('*')).filter((e) => {
      const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0
    })
    const br = addBtn.getBoundingClientRect()
    addBtnRightmost = kids.every((e) => e === addBtn || e.contains(addBtn) || e.getBoundingClientRect().right <= br.right + 0.5)
  }
  const summaryEl = document.querySelector('.ql-result-panel__summary')
  const toolbarRect = toolbar ? toolbar.getBoundingClientRect() : null
  const summaryRight = summaryEl ? summaryEl.getBoundingClientRect().right : null
  // batch / selection absence
  const bodyText = document.body.innerText
  const hasCheckboxColumn = !!document.querySelector('.cc-table .el-table-column--selection, .cc-table th.el-table__cell .el-checkbox')
  const hasRowCheckbox = !!document.querySelector('.cc-table .el-table__body .el-checkbox')
  const optionSearch = !!document.querySelector('.cc-search')
  return {
    rootClassList: tbl ? tbl.className : null,
    headers,
    hasStatusColumn: headers.some((h) => h.includes('状态')),
    seqHeader: headers[0],
    seqValues: seq,
    seqContinuousFrom1: (() => {
      const nums = seq.map((s) => Number(s))
      if (nums.length === 0) return null
      return nums.every((n, i) => n === i + 1)
    })(),
    rowCount: rows.length,
    heightHistogram: heights.reduce((a, h) => { const k = Math.round(h); a[k] = (a[k] || 0) + 1; return a }, {}),
    wrappedRows: wrapped,
    tagStats,
    addBtn: addBtn ? {
      text: addBtn.textContent.trim(),
      rightmostInToolbar: addBtnRightmost,
      right: Math.round((addBtn.getBoundingClientRect().right) * 100) / 100,
      toolbarRight: toolbarRect ? Math.round(toolbarRect.right * 100) / 100 : null,
      summaryRight: summaryRight ? Math.round(summaryRight * 100) / 100 : null,
    } : null,
    batchAbsence: {
      hasCheckboxColumn,
      hasRowCheckbox,
      hasDeleteSelectedText: bodyText.includes('删除所选'),
      hasBatchWord: bodyText.includes('批量'),
      hasSelectedHint: /已选择|已选\s*[:：]/.test(bodyText),
    },
    hasOptionSearch: optionSearch,
    queryPanel: {
      hasKeyword: !!document.querySelector('.cc-q-keyword'),
      hasStatusSelect: !!document.querySelector('.cc-q-status'),
      hasRefresh: /刷新|倒计时|最近刷新/.test(bodyText),
      hasQueryBtn: !!document.querySelector('.ql-actions__query'),
      hasResetBtn: !!document.querySelector('.ql-actions__reset'),
    },
  }
}

;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await installWriteBlocker(context)
  const page = await context.newPage()

  const result = {
    task: 'CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001',
    mode: 'readonly-browser-probe',
    scope: '/config/client only',
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    frontend: FRONT,
    writeInterception: { policy: '/api/** GET/HEAD/OPTIONS allow; POST/PUT/PATCH/DELETE abort and count', nonGetAttempts: null, attempts: [] },
  }

  try {
    // ---------- Phase 1: list @1440x900 ----------
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table .el-table__body tr.el-table__row', { timeout: 15000 })
    await page.evaluate(() => window.scrollTo(0, 0))
    result.list1440 = await page.evaluate(LIST_EVAL)

    // ---------- Phase 2: query + reset renumber ----------
    const keyword = page.locator('.cc-q-keyword input')
    await keyword.fill('zzz-no-such-probe-zzz')
    await page.locator('.ql-actions__query').click()
    await page.waitForTimeout(900)
    const afterQuery = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
      return {
        rowCount: rows.length,
        seqValues: rows.map((tr) => (tr.querySelector('.cc-seq')?.textContent || '').trim()),
      }
    })
    await page.locator('.ql-actions__reset').click()
    await page.waitForTimeout(400)
    const afterResetNoQuery = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
      return { rowCount: rows.length, keywordValue: document.querySelector('.cc-q-keyword input')?.value ?? null }
    })
    // 重置不自动查询 → 需再点“查询”才重新加载
    await page.locator('.ql-actions__query').click()
    await page.waitForTimeout(900)
    const afterResetThenQuery = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
      const seq = rows.map((tr) => (tr.querySelector('.cc-seq')?.textContent || '').trim())
      const nums = seq.map((s) => Number(s))
      return { rowCount: rows.length, seqValues: seq, continuousFrom1: nums.length > 0 && nums.every((n, i) => n === i + 1) }
    })
    result.resetRenumber = { afterQuery, afterResetNoQuery, afterResetThenQuery }

    // ---------- Phase 3: 更多 dropdown menu (read-only) ----------
    const openMenu = async (rowSelectorIndex) => {
      const triggers = page.locator('.lt-row-action__ellipsis')
      const t = triggers.nth(rowSelectorIndex)
      await t.scrollIntoViewIfNeeded().catch(() => {})
      await t.click({ force: true })
      await page.waitForSelector('.cc-more-popper .el-dropdown-menu__item', { timeout: 5000 })
      await page.waitForTimeout(250)
    }
    await openMenu(0)
    result.menu = await page.evaluate(() => {
      const popper = document.querySelector('.cc-more-popper')
      const menu = popper?.querySelector('.el-dropdown-menu')
      const items = Array.from(popper?.querySelectorAll('.el-dropdown-menu__item') || [])
      const ps = popper ? getComputedStyle(popper) : null
      const ms = menu ? getComputedStyle(menu) : null
      return {
        visible: !!popper,
        popperRadius: ps ? ps.borderRadius : null,
        popperShadow: ps ? ps.boxShadow : null,
        menuRadius: ms ? ms.borderRadius : null,
        menuPadding: ms ? ms.padding : null,
        itemTexts: items.map((it) => it.textContent.trim()),
        items: items.map((it) => {
          const cs = getComputedStyle(it)
          return {
            text: it.textContent.trim(),
            className: it.className,
            fontWeight: cs.fontWeight,
            color: cs.color,
            isDisabled: it.classList.contains('is-disabled'),
            divided: it.classList.contains('el-dropdown-menu__item--divided'),
            borderTopWidth: cs.borderTopWidth,
            borderTopStyle: cs.borderTopStyle,
            borderTopColor: cs.borderTopColor,
            marginTop: cs.marginTop,
            borderRadius: cs.borderRadius,
            padding: cs.padding,
          }
        }),
        disabledCount: items.filter((it) => it.classList.contains('is-disabled')).length,
      }
    })
    // hover feedback on danger vs warning (visible popper only; best-effort)
    result.menuHover = await (async () => {
      const out = { error: null }
      try {
        const danger = page.locator('.cc-more-popper:visible .el-dropdown-menu__item.cc-more-danger')
        if (await danger.count()) { await danger.first().hover(); await page.waitForTimeout(150); out.dangerColor = await danger.first().evaluate((e) => getComputedStyle(e).color) }
        const warn = page.locator('.cc-more-popper:visible .cc-more-warning')
        if (await warn.count()) { await warn.first().hover(); await page.waitForTimeout(150); out.warningColor = await warn.first().evaluate((e) => getComputedStyle(e).color) }
      } catch (e) { out.error = String(e).slice(0, 200) }
      return out
    })()
    // keyboard traversal inside the open menu
    result.menuKeyboard = await (async () => {
      try {
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(200)
      // focus the ellipsis trigger then open with Enter
      await page.evaluate(() => {
        const t = document.querySelector('.cc-table .el-table__body .lt-row-action__ellipsis')
        t && t.focus()
      })
      await page.keyboard.press('Enter')
      await page.waitForTimeout(400)
      const openedByEnter = await page.evaluate(() => !!document.querySelector('.cc-more-popper .el-dropdown-menu__item'))
      const traversal = []
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(150)
        traversal.push(await page.evaluate(() => {
          const a = document.activeElement
          if (!a) return null
          return { text: (a.textContent || '').trim().slice(0, 8), isMenuItem: a.classList.contains('el-dropdown-menu__item'), isDisabled: a.classList.contains('is-disabled') }
        }))
      }
      await page.keyboard.press('Escape')
      await page.waitForTimeout(350)
      const closedByEsc = await page.evaluate(() => !document.querySelector('.cc-more-popper .el-dropdown-menu__item'))
      return { openedByEnter, traversal, closedByEsc }
      } catch (e) { return { error: String(e).slice(0, 300) } }
    })()
    // close any open menu
    await page.keyboard.press('Escape').catch(() => {})
    await page.mouse.click(5, 5).catch(() => {})
    await page.waitForTimeout(200)

    // ---------- Phase 4: last-row menu clipping ----------
    result.menuClipping = await (async () => {
      try {
      const triggers = page.locator('.lt-row-action__ellipsis')
      const n = await triggers.count()
      const last = triggers.nth(n - 1)
      await last.scrollIntoViewIfNeeded().catch(() => {})
      await last.click({ force: true })
      await page.waitForSelector('.cc-more-popper', { timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(300)
      const r = await page.evaluate(() => {
        const p = document.querySelector('.cc-more-popper')
        if (!p) return null
        const rect = p.getBoundingClientRect()
        return {
          inViewport: rect.top >= -1 && rect.left >= -1 && rect.right <= window.innerWidth + 1 && rect.bottom <= window.innerHeight + 1,
          right: Math.round(rect.right * 100) / 100,
          viewportW: window.innerWidth,
          viewportH: window.innerHeight,
          placement: p.getAttribute('data-popper-placement'),
        }
      })
      await page.keyboard.press('Escape').catch(() => {})
      await page.mouse.click(5, 5).catch(() => {})
      await page.waitForTimeout(200)
      return { lastRowCount: n, popper: r }
      } catch (e) { return { error: String(e).slice(0, 300) } }
    })()

    // ---------- Phase 5: dialog read-only ----------
    try {
    await page.locator('.cc-btn-add').click()
    await page.waitForSelector('.cc-dialog .cc-id-control input', { timeout: 5000 })
    await page.waitForTimeout(300)
    result.dialog = await page.evaluate(() => {
      const dlg = document.querySelector('.cc-dialog')
      const dr = dlg?.getBoundingClientRect()
      const items = Array.from(document.querySelectorAll('.cc-dialog .cc-form-item'))
      const gaps = items.map((it) => {
        const label = it.querySelector('.ced-form-label, .cc-form-label')
        const ctrl = it.querySelector('.cc-form-control')
        if (!label || !ctrl) return null
        return { label: (label.textContent || '').trim(), gapPx: Math.round((ctrl.getBoundingClientRect().left - label.getBoundingClientRect().right) * 100) / 100, ctrlLeft: Math.round(ctrl.getBoundingClientRect().left * 100) / 100, labelRight: Math.round(label.getBoundingClientRect().right * 100) / 100 }
      }).filter(Boolean)
      const idInput = document.querySelector('.cc-id-control input')
      const desc = document.querySelector('.cc-desc-row textarea')
      const submit = document.querySelector('.ced-submit')
      const cancel = Array.from(document.querySelectorAll('.el-dialog__footer .el-button')).find((b) => !b.classList.contains('ced-submit'))
      const toggle = document.querySelector('.cc-id-toggle')
      const optPane = document.querySelector('.cc-pane--options')
      const chosenPane = document.querySelector('.cc-pane--chosen')
      const cs = (el) => (el ? getComputedStyle(el) : null)
      const sc = cs(submit)
      return {
        dialogWidth: dr ? Math.round(dr.width * 100) / 100 : null,
        labelGaps: gaps,
        idInput: { maxlengthAttr: idInput ? idInput.getAttribute('maxlength') : null },
        desc: { placeholder: desc ? desc.getAttribute('placeholder') : null },
        submit: submit ? { text: submit.textContent.trim(), bg: sc.backgroundColor, color: sc.color, radius: sc.borderRadius, fontWeight: sc.fontWeight, hasIsDisabled: submit.classList.contains('is-disabled') } : null,
        cancelBtn: cancel ? { text: cancel.textContent.trim(), bg: cs(cancel).backgroundColor } : null,
        toggleBtn: toggle ? { text: toggle.textContent.trim(), bg: cs(toggle).backgroundColor } : null,
        paneWidths: { options: optPane ? Math.round(optPane.getBoundingClientRect().width) : null, chosen: chosenPane ? Math.round(chosenPane.getBoundingClientRect().width) : null },
        paneHeights: { options: optPane ? Math.round(optPane.getBoundingClientRect().height) : null, chosen: chosenPane ? Math.round(chosenPane.getBoundingClientRect().height) : null },
      }
    })
    // type beyond limits (real keystrokes) — unsubmitted draft
    await page.locator('.cc-id-control input').click()
    await page.locator('.cc-id-control input').pressSequentially('a'.repeat(40), { delay: 1 })
    result.idTyped = await page.evaluate(() => {
      const el = document.querySelector('.cc-id-control input')
      return { typedRequested: 40, actualLength: el ? el.value.length : null }
    })
    await page.locator('.cc-id-control input').fill('')
    const descBox = page.locator('.cc-desc-row textarea')
    await descBox.click()
    await descBox.pressSequentially('汉'.repeat(300), { delay: 0 })
    result.descTyped = await page.evaluate(() => {
      const el = document.querySelector('.cc-desc-row textarea')
      const v = el ? el.value : ''
      return { typedRequested: 300, actualLength: v.length, allHan: /^[一-龥]*$/.test(v) }
    })
    await descBox.fill('')
    // empty submit → client-side field errors (no network write)
    const before = await page.evaluate(() => document.querySelector('.cc-dialog').getBoundingClientRect().bottom)
    await page.locator('.ced-submit').click()
    await page.waitForTimeout(600)
    const after = await page.evaluate(() => document.querySelector('.cc-dialog').getBoundingClientRect().bottom)
    result.emptySubmit = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('.cc-dialog .ced-field-error, .cc-dialog .cc-field-feedback__text')).map((e) => ({ text: (e.textContent || '').trim(), h: Math.round(e.getBoundingClientRect().height), role: e.getAttribute('role') }))
      return {
        errors: texts,
        errorCount: texts.length,
        sourceFeedback: !!document.querySelector('.cc-dialog .cc-split--error'),
      }
    })
    result.emptySubmit.dialogBottomDeltaPx = Math.round((after - before) * 100) / 100
    result.writesAfterEmptySubmit = writes.length
    // cancel the dialog (no write)
    await page.locator('.el-dialog__footer .el-button', { hasText: '取消' }).first().click()
    await page.waitForTimeout(400)
    } catch (e) { result.dialogPhaseError = String(e).slice(0, 300) }

    // ---------- Phase 6: disable/enable confirm dialog (open + CANCEL only) ----------
    try {
    const writesBeforeConfirm = writes.length
    await openMenu(0)
    const menuItems = page.locator('.cc-more-popper .el-dropdown-menu__item')
    const itemCount = await menuItems.count()
    let confirmKind = null
    for (let i = 0; i < itemCount; i++) {
      const txt = (await menuItems.nth(i).textContent()).trim()
      if (txt === '停用' || txt === '启用') { confirmKind = txt; await menuItems.nth(i).click(); break }
    }
    await page.waitForSelector('.el-message-box', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(400)
    result.confirm = await page.evaluate(() => {
      const box = document.querySelector('.el-message-box')
      if (!box) return null
      const title = box.querySelector('.el-message-box__title')?.textContent.trim() || null
      const body = box.querySelector('.el-message-box__message')?.textContent.trim() || null
      const btns = Array.from(box.querySelectorAll('.el-message-box__btns .el-button'))
      const primary = box.querySelector('.el-message-box__btns .el-button--primary')
      const pcs = primary ? getComputedStyle(primary) : null
      return {
        customClass: box.className,
        title,
        bodyHasProbePhrase: /确定(启用|停用)探针/.test(body || ''),
        buttons: btns.map((b) => ({ text: b.textContent.trim(), primary: b.classList.contains('el-button--primary'), bg: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color })),
        primary: pcs ? { bg: pcs.backgroundColor, color: pcs.color, radius: pcs.borderRadius, hasIsDisabled: primary.classList.contains('is-disabled') } : null,
      }
    })
    result.confirmKind = confirmKind
    // cancel
    const cancelBtn = page.locator('.el-message-box__btns .el-button', { hasText: '取消' }).first()
    await cancelBtn.click().catch(() => {})
    await page.waitForTimeout(500)
    result.confirmCanceled = await page.evaluate(() => !document.querySelector('.el-message-box'))
    result.writesAfterConfirmCancel = writes.length
    result.confirmWritesDelta = writes.length - writesBeforeConfirm
    } catch (e) { result.confirmPhaseError = String(e).slice(0, 300) }

    // ---------- Phase 7: list @1920x1080 ----------
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(700)
    await page.evaluate(() => window.scrollTo(0, 0))
    result.list1920 = await page.evaluate(LIST_EVAL)
  } finally {
    result.writeInterception.nonGetAttempts = writes.length
    result.writeInterception.attempts = writes
    fs.writeFileSync(`${OUT}/gap-readonly-results.json`, JSON.stringify(result, null, 1))
    await browser.close()
  }
  console.log('WROTE', `${OUT}/gap-readonly-results.json`)
  console.log('nonGetAttempts=', writes.length)
})().catch((e) => { console.error('PROBE ERROR', e); process.exit(1) })
