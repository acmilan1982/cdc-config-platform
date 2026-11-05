/**
 * 004 read-only live probe for /config/client.
 * Gate: /api/** GET/HEAD/OPTIONS only, installed before first navigation; non-GET aborted+counted.
 * Only /config/client is visited. No other feature page is opened.
 * Raw output stays in /tmp; committed evidence is desensitized separately.
 */
const fs = require('fs')
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core')
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = 'http://127.0.0.1:5173'
const OUT = '/tmp/004/readonly-raw.json'

const R = {
  task: 'CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004',
  mode: 'readonly-live',
  browser: { engine: 'chromium', version: '147.0.7727.15', executable: EXE, headless: true },
  frontend: FRONT,
  gate: { policy: '/api/** GET/HEAD/OPTIONS allow; others abort+count', nonGetAttempts: 0, attempts: [] },
  getLog: [],
  viewports: {},
  interactions: {},
  errors: [],
}

let listGetCount = 0
function installGate(ctx) {
  return ctx.route('**/api/**', async (route) => {
    const req = route.request()
    const m = req.method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') {
      const u = new URL(req.url())
      if (u.pathname === '/api/clients') listGetCount++
      R.getLog.push({ m, path: u.pathname })
      return route.continue()
    }
    R.gate.nonGetAttempts++
    R.gate.attempts.push({ m, url: req.url() })
    return route.abort('blockedbyclient')
  })
}

const q = (page, fn, arg) => page.evaluate(fn, arg)

async function measureStructure(page) {
  return q(page, () => {
    const t = (sel) => (document.querySelector(sel)?.textContent || '').trim()
    return {
      shell: !!document.querySelector('.ql-page'),
      title: t('.ql-page__title'),
      description: t('.ql-page__description'),
      qPanel: !!document.querySelector('.ql-q-panel'),
      qLabels: [...document.querySelectorAll('.cc-q-label')].map((e) => e.textContent.trim()),
      actions: {
        query: !!document.querySelector('.ql-actions__query'),
        reset: !!document.querySelector('.ql-actions__reset'),
        queryText: t('.ql-actions__query .ql-action-label'),
        resetText: t('.ql-actions__reset .ql-action-label'),
      },
      resultPanel: !!document.querySelector('.ql-result-panel'),
      summary: t('.ql-result-panel__summary'),
      toolbar: t('.ql-result-panel__toolbar'),
      addBtnText: t('.cc-btn-add'),
      errorSlot: !!document.querySelector('.ql-result-panel__error-slot'),
      errorVisible: !!document.querySelector('.cc-load-error'),
      divider: !!document.querySelector('.ql-result-panel__divider'),
      body: !!document.querySelector('.ql-result-panel__body'),
      refreshGroup: !!document.querySelector('.ql-refresh-group'),
      refreshBtn: !!document.querySelector('.ql-refresh-btn'),
      countdown: !!document.querySelector('.ql-countdown-text'),
      lastRefresh: !!document.querySelector('.ql-refresh-time'),
      pagination: !!document.querySelector('.el-pagination'),
      checkboxCount: document.querySelectorAll('.cc-table input[type=checkbox]').length,
      batchButtons: [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter((x) => /批量|删除所选|全选/.test(x)),
      columns: [...document.querySelectorAll('.cc-table thead th')].map((th) => ({
        text: (th.textContent || '').trim(),
        hasOptIn: th.classList.contains('lt-row-action__cell'),
        fixedRight: getComputedStyle(th).position === 'sticky' && getComputedStyle(th).right === '0px',
        width: +th.getBoundingClientRect().width.toFixed(3),
      })),
    }
  })
}

async function measureAddButton(page) {
  return q(page, () => {
    const btn = document.querySelector('.cc-btn-add')
    const bar = document.querySelector('.ql-result-panel__toolbar')
    const head = document.querySelector('.ql-result-panel__header')
    if (!btn || !bar || !head) return { error: 'missing' }
    const bb = btn.getBoundingClientRect(), rb = bar.getBoundingClientRect(), hb = head.getBoundingClientRect()
    const kids = [...bar.children]
    const others = kids.filter((k) => k !== btn && k.getBoundingClientRect().width > 0)
    return {
      btnText: btn.textContent.trim(),
      btnLeft: +bb.left.toFixed(3), btnRight: +bb.right.toFixed(3), btnW: +bb.width.toFixed(3),
      toolbarRight: +rb.right.toFixed(3), headerRight: +hb.right.toFixed(3),
      rightGapInToolbar: +(rb.right - bb.right).toFixed(3),
      isToolbarLastChild: kids[kids.length - 1] === btn,
      otherToolbarChildren: others.length,
      leftOfSummaryHasAdd: (() => {
        const sum = document.querySelector('.ql-result-panel__summary')
        if (!sum) return false
        const sb = sum.getBoundingClientRect()
        return bb.left < sb.right
      })(),
      addBtnCount: document.querySelectorAll('.cc-btn-add').length,
      clonedInFilterArea: !!document.querySelector('.ql-q-panel .cc-btn-add'),
    }
  })
}

async function measureRows(page) {
  return q(page, () => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    const out = rows.map((tr, i) => {
      const idEl = tr.querySelector('.cc-id')
      const cell = tr.querySelector('.cc-id-cell')
      const tds = [...tr.children]
      const opTd = tds[tds.length - 1]
      const opCell = opTd ? opTd.querySelector('.cell') : null
      const link = tr.querySelector('.cc-more-link')
      const src = tr.querySelector('.cc-src')
      const tag = tr.querySelector('.cc-dstag')
      const rowbad = tr.querySelector('.cc-rowbad')
      const cs = (el) => (el ? getComputedStyle(el) : null)
      const idCs = cs(idEl), mark = tr.querySelector('.cc-inactive-mark, .cc-abnormal-mark')
      const markCs = cs(mark)
      const tagCs = cs(tag)
      const idBox = idEl ? idEl.getBoundingClientRect() : null
      const markBox = mark ? mark.getBoundingClientRect() : null
      const linkBox = link ? link.getBoundingClientRect() : null
      const rowBox = tr.getBoundingClientRect()
      const firstTd = tds[0], firstTdCs = cs(firstTd)
      return {
        idx: i + 1,
        clientId: idEl ? idEl.textContent.trim() : null,
        rowH: rowBox.height,
        rowTop: rowBox.top,
        tdCount: tds.length,
        firstTdPadTop: firstTdCs ? firstTdCs.paddingTop : null,
        firstTdPadBottom: firstTdCs ? firstTdCs.paddingBottom : null,
        opTdPadTop: opTd ? cs(opTd).paddingTop : null,
        opTdPadBottom: opTd ? cs(opTd).paddingBottom : null,
        opCellH: opCell ? opCell.getBoundingClientRect().height : null,
        linkW: linkBox ? linkBox.width : null,
        linkH: linkBox ? linkBox.height : null,
        linkTop: linkBox ? linkBox.top : null,
        linkBottom: linkBox ? linkBox.bottom : null,
        id: idEl ? {
          text: idEl.textContent.trim(),
          color: idCs.color, fontWeight: idCs.fontWeight, fontSize: idCs.fontSize,
          clientWidth: idEl.clientWidth, scrollWidth: idEl.scrollWidth,
          truncated: idEl.scrollWidth > idEl.clientWidth,
          boxW: idBox ? idBox.width : null, boxH: idBox ? idBox.height : null,
        } : null,
        marker: mark ? {
          cls: mark.className,
          text: mark.textContent.trim(),
          height: markBox.height, width: markBox.width,
          borderRadius: markCs.borderRadius, fontSize: markCs.fontSize, fontWeight: markCs.fontWeight,
          color: markCs.color, background: markCs.backgroundColor,
          padding: markCs.padding, display: markCs.display,
          boxTop: markBox.top, boxBottom: markBox.bottom,
        } : null,
        idCellGapToMark: idBox && markBox ? +(markBox.left - idBox.right).toFixed(3) : null,
        tag: tag ? {
          text: tag.textContent.trim(),
          cls: tag.className,
          height: tag.getBoundingClientRect().height,
          width: tag.getBoundingClientRect().width,
          borderRadius: tagCs.borderRadius, fontWeight: tagCs.fontWeight, fontSize: tagCs.fontSize,
          borderTopWidth: tagCs.borderTopWidth, borderStyle: tagCs.borderTopStyle,
          color: tagCs.color, background: tagCs.backgroundColor, padding: tagCs.padding,
        } : null,
        hasMore: !!tr.querySelector('.cc-more'),
        hasRowbad: !!rowbad,
        rowbadH: rowbad ? rowbad.getBoundingClientRect().height : null,
        desc: (() => {
          const d = tr.querySelector('.cc-desc')
          if (!d) return null
          const dcs = getComputedStyle(d)
          return {
            text: d.textContent.trim(),
            len: (d.textContent || '').trim().length,
            clientWidth: d.clientWidth, scrollWidth: d.scrollWidth,
            truncated: d.scrollWidth > d.clientWidth,
            whiteSpace: dcs.whiteSpace, overflow: dcs.overflow, textOverflow: dcs.textOverflow,
            tdWidth: d.closest('td') ? +d.closest('td').getBoundingClientRect().width.toFixed(3) : null,
          }
        })(),
        datasourceHiddenCount: (() => {
          const m = tr.querySelector('.cc-more')
          if (!m) return 0
          const n = parseInt((m.textContent || '').replace(/[^0-9]/g, ''), 10)
          return Number.isFinite(n) ? n : 0
        })(),
      }
    })
    return { count: out.length, rows: out }
  })
}

async function measureTagDetail(page, clientId) {
  return q(page, (id) => {
    const row = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
      .find((tr) => tr.querySelector('.cc-src')?.getAttribute('data-client-id') === id)
    if (!row) return { error: 'row-not-found' }
    const tag = row.querySelector('.cc-dstag')
    if (!tag) return { error: 'tag-not-found' }
    const allTags = [...row.querySelectorAll('.cc-dstag')].map((t) => ({ cls: t.className, text: t.textContent.trim() }))
    const cs = getComputedStyle(tag)
    const txt = tag.querySelector('.cc-txt')
    const tb = tag.getBoundingClientRect(), xb = txt ? txt.getBoundingClientRect() : null
    const tcs = getComputedStyle(tag)
    const padL = parseFloat(tcs.paddingLeft), padR = parseFloat(tcs.paddingRight)
    const padT = parseFloat(tcs.paddingTop), padB = parseFloat(tcs.paddingBottom)
    return {
      clientId: id,
      text: tag.textContent.trim(),
      cls: tag.className,
      allTags,
      height: tb.height, width: tb.width,
      borderRadius: cs.borderRadius, fontWeight: cs.fontWeight, fontSize: cs.fontSize,
      borderTopWidth: cs.borderTopWidth, borderStyle: cs.borderTopStyle,
      color: cs.color, background: cs.backgroundColor,
      padding: cs.padding, display: cs.display, alignItems: cs.alignItems,
      justifyContent: cs.justifyContent,
      textVerticalCenterDelta: xb ? +( (xb.top + xb.height / 2) - (tb.top + tb.height / 2) ).toFixed(3) : null,
      textHorizontalCenterDelta: xb ? +( (xb.left + xb.width / 2) - (tb.left + padL / 2 + (tb.width - padR) / 2) ).toFixed(3) : null,
      textBox: xb ? { w: +xb.width.toFixed(3), h: +xb.height.toFixed(3), left: +xb.left.toFixed(3), right: +xb.right.toFixed(3), top: +xb.top.toFixed(3), bottom: +xb.bottom.toFixed(3) } : null,
      tagBox: { left: +tb.left.toFixed(3), right: +tb.right.toFixed(3), top: +tb.top.toFixed(3), bottom: +tb.bottom.toFixed(3) },
      clippedByTag: xb ? xb.left + 0.5 < tb.left + padL || xb.right - 0.5 > tb.right - padR || xb.top + 0.5 < tb.top + padT || xb.bottom - 0.5 > tb.bottom - padB : null,
    }
  }, clientId)
}

async function measureIdDetail(page, clientId) {
  return q(page, (id) => {
    const row = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
      .find((tr) => tr.querySelector('.cc-id')?.textContent.trim() === id)
    if (!row) return { error: 'row-not-found' }
    const idEl = row.querySelector('.cc-id')
    const cell = row.querySelector('.cc-id-cell')
    const mark = row.querySelector('.cc-inactive-mark, .cc-abnormal-mark')
    const ics = getComputedStyle(idEl)
    const css = getComputedStyle(cell)
    const mcs = mark ? getComputedStyle(mark) : null
    const mb = mark ? mark.getBoundingClientRect() : null
    const ib = idEl.getBoundingClientRect()
    return {
      clientId: id,
      id: {
        visibleText: idEl.textContent.trim(), color: ics.color, fontWeight: ics.fontWeight, fontSize: ics.fontSize,
        clientWidth: idEl.clientWidth, scrollWidth: idEl.scrollWidth, truncated: idEl.scrollWidth > idEl.clientWidth,
        whiteSpace: ics.whiteSpace, overflow: ics.overflow, textOverflow: ics.textOverflow,
        tabIndex: idEl.tabIndex, role: idEl.getAttribute('role'), ariaLabel: idEl.getAttribute('aria-label'),
      },
      cell: {
        width: cell.getBoundingClientRect().width, display: css.display, flexWrap: css.flexWrap,
        alignItems: css.alignItems, gap: css.gap, overflow: css.overflow,
      },
      marker: mark ? {
        cls: mark.className, text: mark.textContent.trim(),
        height: mb.height, width: mb.width, borderRadius: mcs.borderRadius,
        fontSize: mcs.fontSize, fontWeight: mcs.fontWeight, color: mcs.color,
        background: mcs.backgroundColor, padding: mcs.padding, lineHeight: mcs.lineHeight,
        top: mb.top, bottom: mb.bottom,
      } : null,
      markerInsideCell: mb ? mb.right <= cell.getBoundingClientRect().right + 0.5 && mb.left >= cell.getBoundingClientRect().left - 0.5 : null,
      markerVerticalCenterDelta: mb ? +(((mb.top + mb.height / 2)) - (cell.getBoundingClientRect().top + cell.getBoundingClientRect().height / 2)).toFixed(3) : null,
    }
  }, clientId)
}

async function measureTableChrome(page) {
  return q(page, () => {
    const wrap = document.querySelector('.cc-table .el-scrollbar__wrap')
    const head = document.querySelector('.cc-table thead')
    const lastTh = [...document.querySelectorAll('.cc-table thead th')].pop()
    const firstRow = document.querySelector('.cc-table tbody tr.el-table__row')
    const lastTd = firstRow ? [...firstRow.children].pop() : null
    const opTd = firstRow ? [...firstRow.children].pop() : null
    return {
      hasScrollWrap: !!wrap,
      wrapClientH: wrap ? wrap.clientHeight : null,
      wrapScrollH: wrap ? wrap.scrollHeight : null,
      wrapScrollTop: wrap ? wrap.scrollTop : null,
      headerTop: head ? head.getBoundingClientRect().top : null,
      lastThText: lastTh ? lastTh.textContent.trim() : null,
      lastThRight: lastTh ? lastTh.getBoundingClientRect().right : null,
      viewportW: window.innerWidth,
      lastTdRight: lastTd ? lastTd.getBoundingClientRect().right : null,
      opTdClass: opTd ? opTd.className : null,
      scrollingClass: document.querySelector('.cc-table')?.className,
    }
  })
}

const R2 = {}

;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await installGate(ctx)
  const page = await ctx.newPage()
  page.on('pageerror', (e) => R.errors.push('pageerror:' + e.message))
  await page.goto(FRONT + '/config/client', { waitUntil: 'networkidle', timeout: 40000 })
  await page.waitForSelector('.cc-table tbody tr.el-table__row', { timeout: 20000 })
  await page.waitForTimeout(800)
  R.initialListGets = listGetCount

  for (const [w, h] of [[1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width: w, height: h })
    await page.waitForTimeout(500)
    const key = `${w}x${h}`
    R.viewports[key] = {
      devicePixelRatio: await q(page, () => window.devicePixelRatio),
      innerWidth: await q(page, () => window.innerWidth),
      structure: await measureStructure(page),
      addButton: await measureAddButton(page),
      tableChrome: await measureTableChrome(page),
      rows: await measureRows(page),
      tagGreen: await measureTagDetail(page, 'S2AC-P07'),
      tagRed: await measureTagDetail(page, 'S2AC-PNOTFOUND'),
      tagNeutral: await measureTagDetail(page, 'S2AC-PAMB1'),
      idOn: await measureIdDetail(page, 'CCFG004-ON'),
      idOff: await measureIdDetail(page, 'CCFG004-OFF'),
      idAbn: await measureIdDetail(page, 'CCFG004-ABN'),
      idLong: await measureIdDetail(page, 'CCFG004-LONGID-0123456789ABCDEFG'),
    }
  }

  // ---------- list default order / no pagination ----------
  R.interactions.defaultOrder = await q(page, () => {
    const ids = [...document.querySelectorAll('.cc-table .cc-id')].map((e) => e.textContent.trim())
    const sorted = [...ids].sort().reverse()
    return { count: ids.length, descending: JSON.stringify(ids) === JSON.stringify(sorted), first3: ids.slice(0, 3), last3: ids.slice(-3) }
  })

  // ---------- keyword + status query, reset no request ----------
  const beforeQueryGets = listGetCount
  await page.fill('.cc-q-keyword input', 'CCFG004')
  await page.click('.ql-actions__query')
  await page.waitForTimeout(900)
  R.interactions.keyword = {
    gets: listGetCount - beforeQueryGets,
    rows: await q(page, () => [...document.querySelectorAll('.cc-table .cc-id')].map((e) => e.textContent.trim())),
  }
  const beforeStatusGets = listGetCount
  await page.selectOption('.cc-q-status select', { label: '停用' }).catch(async () => {
    await page.click('.cc-q-status')
    await page.waitForTimeout(200)
    await page.locator('.el-select-dropdown__item', { hasText: '停用' }).first().click()
  })
  await page.click('.ql-actions__query')
  await page.waitForTimeout(900)
  R.interactions.statusFilter = {
    gets: listGetCount - beforeStatusGets,
    ids: await q(page, () => [...document.querySelectorAll('.cc-table .cc-id')].map((e) => e.textContent.trim())),
    markers: await q(page, () => [...document.querySelectorAll('.cc-table tbody tr.el-table__row')].map((tr) => ({
      id: tr.querySelector('.cc-id')?.textContent.trim(),
      marker: tr.querySelector('.cc-inactive-mark')?.textContent.trim() || null,
    }))),
  }
  const beforeResetGets = listGetCount
  await page.click('.ql-actions__reset')
  await page.waitForTimeout(600)
  R.interactions.reset = {
    gets: listGetCount - beforeResetGets,
    keywordValue: await page.inputValue('.cc-q-keyword input'),
    rowsStillFiltered: await q(page, () => document.querySelectorAll('.cc-table .cc-id').length),
  }
  // restore full list
  await page.fill('.cc-q-keyword input', '')
  await page.click('.ql-actions__query')
  await page.waitForTimeout(900)

  // ---------- highlight read-only branches ----------
  const rowIndex = 2
  const rowLoc = page.locator('.cc-table tbody tr.el-table__row').nth(rowIndex)
  const seqLoc = rowLoc.locator('.cc-seq')
  await seqLoc.click()
  await page.waitForTimeout(650)
  const fixedAfter1 = await q(page, () => [...document.querySelectorAll('.cc-table tbody tr')].map((tr) => tr.classList.contains('lt-row-highlight__row')))
  await seqLoc.click()
  await page.waitForTimeout(650)
  const fixedAfter2 = await q(page, () => [...document.querySelectorAll('.cc-table tbody tr')].map((tr) => tr.classList.contains('lt-row-highlight__row')))
  const rowA = await q(page, () => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    return rows[2]?.querySelector('.cc-id')?.textContent.trim()
  })
  await page.locator('.cc-table tbody tr.el-table__row').nth(4).locator('.cc-seq').click()
  await page.waitForTimeout(200)
  const rowB = await q(page, () => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    return rows[4]?.querySelector('.cc-id')?.textContent.trim()
  })
  const fixedAfterTransfer = await q(page, () => [...document.querySelectorAll('.cc-table tbody tr')].map((tr, i) => tr.classList.contains('lt-row-highlight__row') ? i : -1).filter((i) => i >= 0))
  R.interactions.highlight = {
    rowA, rowB,
    afterFirstClick: fixedAfter1.filter(Boolean).length,
    afterSecondClick: fixedAfter2.filter(Boolean).length,
    afterTransfer: fixedAfterTransfer,
    storage: await q(page, () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), url: location.href })),
  }

  // ---------- ordinary query clears fixed selection; reset alone does not ----------
  await page.locator('.cc-table tbody tr.el-table__row').nth(3).locator('.cc-seq').click()
  await page.waitForTimeout(150)
  const fixedBeforeReset = await q(page, () => document.querySelectorAll('.lt-row-highlight__row').length)
  await page.click('.ql-actions__reset')
  await page.waitForTimeout(500)
  const fixedAfterReset = await q(page, () => document.querySelectorAll('.lt-row-highlight__row').length)
  await page.click('.ql-actions__query')
  await page.waitForTimeout(900)
  const fixedAfterQuery = await q(page, () => document.querySelectorAll('.lt-row-highlight__row').length)
  R.interactions.clearOnQuery = { fixedBeforeReset, fixedAfterReset, fixedAfterQuery }

  // ---------- dblclick edit and keyboard edit independent of fixed selection ----------
  const dblRow = page.locator('.cc-table tbody tr.el-table__row').nth(5)
  await dblRow.locator('.cc-seq').dblclick()
  await page.waitForTimeout(700)
  const dlg1 = await q(page, () => {
    const d = document.querySelector('.cc-dialog')
    return { open: !!d && getComputedStyle(d).display !== 'none', title: d ? d.querySelector('.el-dialog__title')?.textContent.trim() : null }
  })
  await page.click('.cc-dialog .el-dialog__headerbtn').catch(() => {})
  await page.waitForTimeout(500)
  const idBtn = page.locator('.cc-table tbody tr.el-table__row').nth(6).locator('.cc-id')
  await idBtn.focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(700)
  const dlg2 = await q(page, () => {
    const d = document.querySelector('.cc-dialog')
    return { open: !!d && getComputedStyle(d).display !== 'none', title: d ? d.querySelector('.el-dialog__title')?.textContent.trim() : null }
  })
  await page.click('.cc-dialog .el-dialog__headerbtn').catch(() => {})
  await page.waitForTimeout(500)
  R.interactions.editEntrances = { dblclickDialog: dlg1, keyboardDialog: dlg2 }

  // ---------- menu: single/dblclick trigger and item area must not open edit ----------
  const menuRow = page.locator('.cc-table tbody tr.el-table__row').nth(7)
  await menuRow.locator('.cc-more-link').click()
  await page.waitForTimeout(400)
  const menuOpen = await q(page, () => {
    const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.offsetParent !== null)
    return { open: !!p, items: p ? [...p.querySelectorAll('.el-dropdown-menu__item')].map((e) => ({ text: e.textContent.trim(), disabled: e.classList.contains('is-disabled'), fontWeight: getComputedStyle(e).fontWeight, color: getComputedStyle(e).color })) : [] }
  })
  const fixedBeforeMenu = await q(page, () => document.querySelectorAll('.lt-row-highlight__row').length)
  await page.locator('.cc-more-popper .el-dropdown-menu__item', { hasText: '删除' }).first().dblclick().catch(() => {})
  await page.waitForTimeout(400)
  const dlgAfterMenu = await q(page, () => {
    const d = document.querySelector('.cc-dialog')
    return !!d && getComputedStyle(d).display !== 'none'
  })
  // cancel any confirm that may have opened
  const confirmOpened = await q(page, () => !!document.querySelector('.el-message-box'))
  if (confirmOpened) { await page.keyboard.press('Escape'); await page.waitForTimeout(400) }
  const fixedAfterMenu = await q(page, () => document.querySelectorAll('.lt-row-highlight__row').length)
  R.interactions.menuIsolation = { menuOpen, dlgAfterMenu, confirmOpened, fixedBeforeMenu, fixedAfterMenu, nonGetAttempts: R.gate.nonGetAttempts }

  // ---------- 117 weights + divider + hover/focus ----------
  const row117 = page.locator('.cc-table tbody tr.el-table__row').nth(8)
  await row117.locator('.cc-more-link').click()
  await page.waitForTimeout(400)
  R.interactions.menuVisual = await q(page, () => {
    const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.offsetParent !== null)
    if (!p) return { open: false }
    const items = [...p.querySelectorAll('.el-dropdown-menu__item')]
    const data = items.map((e) => {
      const cs = getComputedStyle(e)
      return {
        text: e.textContent.trim(), disabled: e.classList.contains('is-disabled'),
        fontWeight: cs.fontWeight, color: cs.color, backgroundColor: cs.backgroundColor,
        borderTopWidth: cs.borderTopWidth, borderTopColor: cs.borderTopColor,
        marginTop: cs.marginTop, paddingTop: cs.paddingTop,
      }
    })
    const del = items.find((e) => e.textContent.trim() === '删除')
    const delCs = del ? getComputedStyle(del) : null
    return {
      open: true, items: data,
      deleteNotBold: delCs ? delCs.fontWeight === '400' : null,
      deleteIsRed: delCs ? delCs.color : null,
      deleteDivided: delCs ? { borderTopWidth: delCs.borderTopWidth, marginTop: delCs.marginTop } : null,
    }
  })
  // hover delete
  const delItem = page.locator('.cc-more-popper .el-dropdown-menu__item', { hasText: '删除' }).first()
  await delItem.hover().catch(() => {})
  await page.waitForTimeout(250)
  R.interactions.menuVisual.deleteHoverBg = await q(page, () => {
    const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.offsetParent !== null)
    const del = p ? [...p.querySelectorAll('.el-dropdown-menu__item')].find((e) => e.textContent.trim() === '删除') : null
    return del ? getComputedStyle(del).backgroundColor : null
  })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // ---------- 102 keyboard open/traverse/Esc ----------
  const kbRow = page.locator('.cc-table tbody tr.el-table__row').nth(9)
  const trigger = kbRow.locator('.cc-more-link')
  await trigger.focus()
  const focusOnTrigger = await q(page, () => {
    const el = document.activeElement
    const cs = el ? getComputedStyle(el) : null
    return { isTrigger: !!el && el.classList.contains('cc-more-link'), outlineStyle: cs?.outlineStyle, outlineWidth: cs?.outlineWidth, outlineColor: cs?.outlineColor, outlineOffset: cs?.outlineOffset }
  })
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  const kbOpen = await q(page, () => {
    const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.offsetParent !== null)
    return {
      open: !!p,
      activeTag: document.activeElement?.tagName, activeCls: document.activeElement?.className,
      activeText: document.activeElement?.textContent?.trim(),
      items: p ? [...p.querySelectorAll('.el-dropdown-menu__item')].map((e) => ({ text: e.textContent.trim(), tabIndex: e.tabIndex, disabled: e.classList.contains('is-disabled') })) : [],
    }
  })
  const kbSeq = []
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(150)
    kbSeq.push(await q(page, () => ({ tag: document.activeElement?.tagName, cls: document.activeElement?.className, text: document.activeElement?.textContent?.trim() })))
  }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  const kbClosed = await q(page, () => ![...document.querySelectorAll('.cc-more-popper')].some((e) => e.offsetParent !== null))
  R.interactions.keyboardMenu = { focusOnTrigger, enteredOpen: kbOpen, arrowSeq: kbSeq, escClosed: kbClosed, nonGetAttempts: R.gate.nonGetAttempts }

  // ---------- 156 hit area + vertical centering + no overlap ----------
  R.interactions.hitArea = await q(page, () => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    const r = rows[10]
    const link = r.querySelector('.cc-more-link')
    const lb = link.getBoundingClientRect(), rb = r.getBoundingClientRect()
    const cell = link.closest('.cell')
    const cb = cell.getBoundingClientRect()
    const next = rows[11]?.getBoundingClientRect()
    return {
      w: lb.width, h: lb.height,
      rowH: rb.height,
      centerDelta: +(((lb.top + lb.height / 2) - (rb.top + rb.height / 2))).toFixed(3),
      withinRow: lb.top >= rb.top - 0.5 && lb.bottom <= rb.bottom + 0.5,
      withinCell: lb.top >= cb.top - 0.5 && lb.bottom <= cb.bottom + 0.5,
      overlapsNextRow: next ? lb.bottom > next.top + 0.5 : null,
      cellOverflow: getComputedStyle(cell).overflow,
      borderRadius: getComputedStyle(link).borderRadius,
    }
  })

  // ---------- 102 edge flip: scroll body to bottom, open last visible row menu ----------
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(300)
  await q(page, () => {
    const wrap = document.querySelector('.cc-table .el-scrollbar__wrap')
    if (wrap) wrap.scrollTop = wrap.scrollHeight
  })
  await page.waitForTimeout(600)
  const edgeInfo = await q(page, () => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    const wrap = document.querySelector('.cc-table .el-scrollbar__wrap')
    const wrapBox = wrap.getBoundingClientRect()
    const visible = rows.filter((tr) => {
      const b = tr.getBoundingClientRect()
      return b.top >= wrapBox.top && b.bottom <= wrapBox.bottom
    })
    return { total: rows.length, visibleCount: visible.length, lastVisibleId: visible.length ? visible[visible.length - 1].querySelector('.cc-src')?.getAttribute('data-client-id') : null, wrapBottom: wrapBox.bottom }
  })
  R.interactions.edgeFlip = { ...edgeInfo }
  if (edgeInfo.lastVisibleId) {
    const lastRow = page.locator('.cc-table tbody tr.el-table__row').filter({ has: page.locator(`.cc-src[data-client-id="${edgeInfo.lastVisibleId}"]`) }).first()
    await lastRow.locator('.cc-more-link').scrollIntoViewIfNeeded().catch(() => {})
    await lastRow.locator('.cc-more-link').click()
    await page.waitForTimeout(500)
    R.interactions.edgeFlip.popper = await q(page, () => {
      const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.offsetParent !== null)
      if (!p) return { open: false }
      const b = p.getBoundingClientRect()
      const mid = document.elementFromPoint(Math.min(innerWidth - 2, b.right - 4), Math.max(2, Math.min(innerHeight - 2, b.bottom - 4)))
      return {
        open: true, top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height,
        withinViewport: b.top >= 0 && b.left >= 0 && b.right <= innerWidth + 0.5 && b.bottom <= innerHeight + 0.5,
        bottomElementIsPopper: !!mid && (mid === p || p.contains(mid)),
        placement: p.getAttribute('data-popper-placement'),
      }
    })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }

  // ---------- 092 dialog isolation ----------
  await page.click('.cc-btn-add')
  await page.waitForTimeout(700)
  R.interactions.dialogIsolation = await q(page, () => {
    const d = document.querySelector('.cc-dialog')
    return {
      open: !!d && getComputedStyle(d).display !== 'none',
      title: d ? d.querySelector('.el-dialog__title')?.textContent.trim() : null,
      hasMainTable: !!d?.querySelector('.lt-main-table'),
      hasElTable: !!d?.querySelector('.el-table'),
      hasRowActionCell: !!d?.querySelector('.lt-row-action__cell'),
      sourceOptionsRendered: d ? d.querySelectorAll('.cc-opt').length : 0,
    }
  })
  await page.click('.cc-dialog .el-dialog__headerbtn').catch(() => {})
  await page.waitForTimeout(500)

  // ---------- 155 row heights: reference had 48 at both viewports ----------
  R.interactions.rowHeightSummary = {}
  for (const key of ['1440x900', '1920x1080']) {
    const rows = R.viewports[key].rows.rows
    const normal = rows.filter((r) => !r.hasRowbad && r.rowbadH === null)
    R.interactions.rowHeightSummary[key] = {
      referenceRowHeight: 48,
      sampleCount: rows.length,
      heights: [...new Set(rows.map((r) => +r.rowH.toFixed(3)))].sort((a, b) => a - b),
      normalMaxAbsDiff: normal.length ? Math.max(...normal.map((r) => Math.abs(r.rowH - 48))) : null,
      normalOverOnePx: normal.filter((r) => Math.abs(r.rowH - 48) > 1).map((r) => ({ id: r.clientId, rowH: r.rowH })),
      adaptiveRows: rows.filter((r) => r.hasRowbad).map((r) => ({ id: r.clientId, rowH: r.rowH, rowbadH: r.rowbadH })),
    }
  }

  R.listGetTotal = listGetCount
  fs.writeFileSync(OUT, JSON.stringify(R, null, 2))
  console.log(JSON.stringify({
    ok: true,
    nonGetAttempts: R.gate.nonGetAttempts,
    listGets: listGetCount,
    defaultOrder: R.interactions.defaultOrder,
    keyword: R.interactions.keyword.rows.length,
    status: R.interactions.statusFilter.ids.length,
    resetGets: R.interactions.reset.gets,
    highlight: R.interactions.highlight,
    editEntrances: R.interactions.editEntrances,
    menuVisual: R.interactions.menuVisual,
    keyboardMenu: R.interactions.keyboardMenu,
    hitArea: R.interactions.hitArea,
    edgeFlip: R.interactions.edgeFlip,
    dialogIsolation: R.interactions.dialogIsolation,
    rowHeight: R.interactions.rowHeightSummary,
    pageErrors: R.errors,
  }, null, 2))
  await browser.close()
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
