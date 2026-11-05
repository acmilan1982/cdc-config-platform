/**
 * 004 read-only probe B: corrected menu/dialog visibility, divider, hover,
 * long tooltip, mouse edit entrance, long/multi-source rows, edge flip at page bottom,
 * narrow viewport horizontal scroll, fresh-reload persistence.
 */
const fs = require('fs')
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core')
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = 'http://127.0.0.1:5173'
const OUT = '/tmp/004/readonly-b-raw.json'
const R = { task: '004', mode: 'readonly-live-b', gate: { nonGetAttempts: 0, attempts: [] }, errors: [] }

function installGate(ctx) {
  return ctx.route('**/api/**', async (route) => {
    const m = route.request().method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    R.gate.nonGetAttempts++
    R.gate.attempts.push({ m, url: route.request().url() })
    return route.abort('blockedbyclient')
  })
}
const q = (page, fn, arg) => page.evaluate(fn, arg)

const isDialogOpen = (page) => q(page, () => {
  const d = document.querySelector('.cc-dialog')
  if (!d) return { open: false }
  const overlay = d.closest('.el-overlay')
  const ovCs = overlay ? getComputedStyle(overlay) : null
  return {
    open: !!overlay && ovCs.display !== 'none' && overlay.getBoundingClientRect().height > 0,
    title: d.querySelector('.el-dialog__title')?.textContent.trim(),
    overlayDisplay: ovCs?.display,
  }
})

const visiblePopper = () => {
  const list = [...document.querySelectorAll('.cc-more-popper')]
  const p = list.find((e) => e.getBoundingClientRect().height > 0 && getComputedStyle(e).display !== 'none')
  if (!p) return null
  return {
    rect: p.getBoundingClientRect(),
    placement: p.getAttribute('data-popper-placement'),
    items: [...p.querySelectorAll('li')].map((li) => {
      const cs = getComputedStyle(li)
      return {
        role: li.getAttribute('role'), cls: li.className, text: li.textContent.trim(),
        tabIndex: li.tabIndex, disabled: li.classList.contains('is-disabled'),
        fontWeight: cs.fontWeight, color: cs.color, background: cs.backgroundColor,
        borderTopWidth: cs.borderTopWidth, borderTopColor: cs.borderTopColor, borderTopStyle: cs.borderTopStyle,
        marginTop: cs.marginTop, height: li.getBoundingClientRect().height,
      }
    }),
  }
}

async function closeAll(page) {
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(250)
  await page.mouse.click(4, 4).catch(() => {})
  await page.waitForTimeout(250)
}

async function rowByClientId(page, id) {
  const idx = await page.evaluate((cid) => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    return rows.findIndex((r) => r.querySelector('.cc-src')?.getAttribute('data-client-id') === cid)
  }, id)
  if (idx < 0) throw new Error('row not found: ' + id)
  return page.locator('.cc-table tbody tr.el-table__row').nth(idx)
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await installGate(ctx)
  const page = await ctx.newPage()
  page.on('pageerror', (e) => R.errors.push(e.message))
  await page.goto(FRONT + '/config/client', { waitUntil: 'networkidle', timeout: 40000 })
  await page.waitForSelector('.cc-table tbody tr.el-table__row', { timeout: 20000 })
  await page.waitForTimeout(800)

  // ---------- menu structure: separator + hover + focus ----------
  const row = page.locator('.cc-table tbody tr.el-table__row').nth(8)
  await row.locator('.cc-more-link').click()
  await page.waitForTimeout(400)
  R.menuStructure = await q(page, () => {
    const list = [...document.querySelectorAll('.cc-more-popper')]
    const p = list.find((e) => e.getBoundingClientRect().height > 0)
    if (!p) return { open: false }
    const lis = [...p.querySelectorAll('li')]
    return {
      open: true,
      html: p.innerHTML.slice(0, 900),
      lis: lis.map((li) => {
        const cs = getComputedStyle(li)
        return {
          role: li.getAttribute('role'), cls: li.className, text: li.textContent.trim(),
          tabIndex: li.tabIndex, disabled: li.classList.contains('is-disabled'),
          fontWeight: cs.fontWeight, color: cs.color,
          borderTopWidth: cs.borderTopWidth, borderTopStyle: cs.borderTopStyle, borderTopColor: cs.borderTopColor,
          marginTop: cs.marginTop, height: li.getBoundingClientRect().height,
        }
      }),
    }
  })
  // hover 删除
  const delItem = page.locator('.cc-more-popper .el-dropdown-menu__item:visible', { hasText: '删除' }).first()
  await delItem.hover()
  await page.waitForTimeout(300)
  R.menuStructure.deleteHover = await q(page, () => {
    const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.getBoundingClientRect().height > 0)
    const del = p ? [...p.querySelectorAll('.el-dropdown-menu__item')].find((e) => e.textContent.trim() === '删除') : null
    return del ? { bg: getComputedStyle(del).backgroundColor, color: getComputedStyle(del).color } : null
  })
  // keyboard focus 删除 (arrow down from item 1)
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(200)
  R.menuStructure.focusState = await q(page, () => {
    const el = document.activeElement
    return el ? { tag: el.tagName, cls: el.className, text: el.textContent.trim(), bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color } : null
  })
  await closeAll(page)

  // ---------- menu event isolation with correct visibility ----------
  const fixedBefore = await q(page, () => document.querySelectorAll('.lt-row-highlight__row').length)
  const isolateRow = page.locator('.cc-table tbody tr.el-table__row').nth(9)
  const dialogStates = {}
  // single click trigger
  await isolateRow.locator('.cc-more-link').click()
  await page.waitForTimeout(350)
  dialogStates.afterSingleTrigger = await isDialogOpen(page)
  const popperOpen = await q(page, () => [...document.querySelectorAll('.cc-more-popper')].some((e) => e.getBoundingClientRect().height > 0))
  // double click trigger (menu may toggle)
  await isolateRow.locator('.cc-more-link').dblclick().catch(() => {})
  await page.waitForTimeout(350)
  dialogStates.afterDblTrigger = await isDialogOpen(page)
  await closeAll(page)
  // click item area (enable/disable on this row opens confirm; cancel it)
  await isolateRow.locator('.cc-more-link').click()
  await page.waitForTimeout(300)
  const firstItem = page.locator('.cc-more-popper .el-dropdown-menu__item:visible').first()
  const firstText = (await firstItem.textContent()).trim()
  await firstItem.click()
  await page.waitForTimeout(500)
  const confirmOpen = await q(page, () => !!document.querySelector('.el-message-box'))
  const confirmText = await q(page, () => {
    const b = document.querySelector('.el-message-box')
    return b ? { title: b.querySelector('.el-message-box__title')?.textContent.trim(), content: b.querySelector('.el-message-box__message')?.textContent.trim(), buttons: [...b.querySelectorAll('button')].map((x) => x.textContent.trim()) } : null
  })
  dialogStates.afterItemClick = await isDialogOpen(page)
  dialogStates.confirm = { open: confirmOpen, text: confirmText }
  if (confirmOpen) { await page.keyboard.press('Escape'); await page.waitForTimeout(400) }
  await closeAll(page)
  // dblclick item area
  await isolateRow.locator('.cc-more-link').click()
  await page.waitForTimeout(300)
  await page.locator('.cc-more-popper .el-dropdown-menu__item:visible').first().dblclick().catch(() => {})
  await page.waitForTimeout(500)
  dialogStates.afterItemDblClick = await isDialogOpen(page)
  const confirmOpen2 = await q(page, () => !!document.querySelector('.el-message-box'))
  if (confirmOpen2) { await page.keyboard.press('Escape'); await page.waitForTimeout(400) }
  await closeAll(page)
  R.eventIsolation = {
    firstItemText: firstText,
    popperOpenedOnSingleTrigger: popperOpen,
    ...dialogStates,
    fixedBefore,
    fixedAfter: await q(page, () => document.querySelectorAll('.lt-row-highlight__row').length),
    nonGetAttempts: R.gate.nonGetAttempts,
  }

  // ---------- keyboard open -> Enter activates item -> confirm -> cancel ----------
  const kbRow = page.locator('.cc-table tbody tr.el-table__row').nth(10)
  await kbRow.locator('.cc-more-link').focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)
  const kbOpened = await q(page, () => [...document.querySelectorAll('.cc-more-popper')].some((e) => e.getBoundingClientRect().height > 0))
  const beforeEnterItem = R.gate.nonGetAttempts
  await page.keyboard.press('Enter')
  await page.waitForTimeout(600)
  R.keyboardActivate = {
    opened: kbOpened,
    confirmOpen: await q(page, () => !!document.querySelector('.el-message-box')),
    confirmTitle: await q(page, () => document.querySelector('.el-message-box__title')?.textContent.trim() || null),
    activeElementAfter: await q(page, () => ({ tag: document.activeElement?.tagName, cls: document.activeElement?.className, text: document.activeElement?.textContent?.trim() })),
    nonGetDeltaBeforeConfirm: R.gate.nonGetAttempts - beforeEnterItem,
  }
  // cancel confirm
  const cancelBtn = page.locator('.el-message-box button', { hasText: '取消' }).first()
  if (await cancelBtn.count()) await cancelBtn.click()
  await page.waitForTimeout(500)
  R.keyboardActivate.afterCancel = {
    confirmGone: await q(page, () => !document.querySelector('.el-message-box')),
    nonGetAttempts: R.gate.nonGetAttempts,
    fixedRows: await q(page, () => document.querySelectorAll('.lt-row-highlight__row').length),
  }
  await closeAll(page)

  // ---------- dialog visibility sanity (from clean state) ----------
  R.dialogClosedBeforeOpen = await isDialogOpen(page)

  // ---------- long ID tooltip + long desc tooltip + mouse edit ----------
  const longIdRow = await rowByClientId(page, 'CCFG004-LONGID-0123456789ABCDEFG')
  await longIdRow.locator('.cc-id').hover()
  await page.waitForTimeout(600)
  R.longIdTooltip = await q(page, () => {
    const tip = document.querySelector('.cc-single-tip')
    return {
      visible: !!tip && getComputedStyle(tip).display !== 'none' && getComputedStyle(tip).visibility !== 'hidden',
      text: tip ? tip.textContent.trim() : null,
    }
  })
  // dblclick ID opens edit (mouse edit entrance)
  await longIdRow.locator('.cc-id').dblclick()
  await page.waitForTimeout(700)
  R.longIdTooltip.dblclickDialog = await isDialogOpen(page)
  if (R.longIdTooltip.dblclickDialog.open) {
    await page.click('.cc-dialog .el-dialog__headerbtn').catch(() => {})
    await page.waitForTimeout(500)
  }
  const longDescRow = await rowByClientId(page, 'S3AC-C033-A1024')
  await longDescRow.locator('.cc-desc').hover()
  await page.waitForTimeout(600)
  R.longDescTooltip = await q(page, () => {
    const tip = document.querySelector('.cc-single-tip')
    const d = document.querySelector('.cc-src') // placeholder
    return {
      visible: !!tip && getComputedStyle(tip).display !== 'none' && getComputedStyle(tip).visibility !== 'hidden',
      textLen: tip ? tip.textContent.trim().length : null,
    }
  })

  // ---------- 104 long desc cell ----------
  R.longDescCell = await q(page, () => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    const row = rows.find((tr) => tr.querySelector('.cc-src')?.getAttribute('data-client-id') === 'S3AC-C033-A1024')
    if (!row) return { error: 'not-found' }
    const d = row.querySelector('.cc-desc')
    const cs = getComputedStyle(d)
    const td = d.closest('td')
    return {
      clientId: 'S3AC-C033-A1024',
      descLen: d.textContent.trim().length,
      clientWidth: d.clientWidth, scrollWidth: d.scrollWidth, truncated: d.scrollWidth > d.clientWidth,
      whiteSpace: cs.whiteSpace, overflow: cs.overflow, textOverflow: cs.textOverflow,
      tdWidth: td.getBoundingClientRect().width,
      rowH: row.getBoundingClientRect().height,
      wrappedLines: Math.round(d.getBoundingClientRect().height / (parseFloat(cs.lineHeight) || 20)),
    }
  })

  // ---------- 092 multi-source / long content / abnormal source rows ----------
  const sampleIds = ['S2AC-PK40', 'S2AC-P8A', 'S3AC-C033-A1024', 'hosp-001', 'S3AC-C027CC', 'CCFG004-LONGID-0123456789ABCDEFG']
  R.contentRows = await q(page, (ids) => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    return ids.map((id) => {
      const tr = rows.find((r) => r.querySelector('.cc-src')?.getAttribute('data-client-id') === id)
      if (!tr) return { id, error: 'not-found' }
      const src = tr.querySelector('.cc-src')
      const tags = [...tr.querySelectorAll('.cc-dstag')]
      const more = tr.querySelector('.cc-more')
      const rowbad = tr.querySelector('.cc-rowbad')
      const tds = [...tr.children]
      const lastTd = tds[tds.length - 1]
      const srcBox = src.getBoundingClientRect()
      const lastBox = lastTd.getBoundingClientRect()
      return {
        id,
        rowH: tr.getBoundingClientRect().height,
        tagCount: tags.length,
        hiddenText: more ? more.textContent.trim() : null,
        rowbad: !!rowbad, rowbadH: rowbad ? rowbad.getBoundingClientRect().height : null,
        srcOverflow: getComputedStyle(src).overflow,
        srcScrollW: src.scrollWidth, srcClientW: src.clientWidth,
        tagsOutOfCell: tags.filter((t) => t.getBoundingClientRect().right > srcBox.right + 0.5 || t.getBoundingClientRect().bottom > srcBox.bottom + 0.5).length,
        lastTdRight: lastBox.right,
        lastTdTop: lastBox.top,
        lastTdBottom: lastBox.bottom,
        rowTop: tr.getBoundingClientRect().top,
        rowBottom: tr.getBoundingClientRect().bottom,
      }
    })
  }, sampleIds)

  // ---------- 155 comparable classification for all rows (types) ----------
  R.rowTypes = await q(page, () => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    const out = []
    for (const tr of rows) {
      const id = tr.querySelector('.cc-src')?.getAttribute('data-client-id')
      const tags = [...tr.querySelectorAll('.cc-dstag')].map((t) => (t.className.match(/cc-dstag--(\w+)/) || [])[1])
      const rowbad = !!tr.querySelector('.cc-rowbad')
      const more = tr.querySelector('.cc-more')
      const lastTd = [...tr.children].pop()
      const link = tr.querySelector('.cc-more-link')
      const linkBox = link.getBoundingClientRect()
      const rowBox = tr.getBoundingClientRect()
      out.push({
        id,
        rowH: rowBox.height,
        tones: tags,
        hasBad: tags.includes('bad'),
        hasOk: tags.includes('ok'),
        hasNeutral: tags.includes('neutral'),
        rowbad,
        plusN: more ? more.textContent.trim() : null,
        lastTdRight: lastTd.getBoundingClientRect().right,
        linkW: linkBox.width, linkH: linkBox.height,
        linkCenterDelta: +(((linkBox.top + linkBox.height / 2) - (rowBox.top + rowBox.height / 2))).toFixed(3),
      })
    }
    return out
  })

  // ---------- edge flip at page bottom, right edge ----------
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(300)
  await q(page, () => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(600)
  const bottom = await q(page, () => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    const vh = window.innerHeight
    const visible = rows.filter((tr) => {
      const b = tr.getBoundingClientRect()
      return b.bottom > 0 && b.top < vh
    })
    const last = visible[visible.length - 1]
    return { scrollY: window.scrollY, visibleCount: visible.length, lastId: last?.querySelector('.cc-src')?.getAttribute('data-client-id'), lastRect: last ? { top: last.getBoundingClientRect().top, bottom: last.getBoundingClientRect().bottom } : null }
  })
  R.edgeFlip = { bottom }
  if (bottom.lastId) {
    const lr = await rowByClientId(page, bottom.lastId)
    await lr.locator('.cc-more-link').click()
    await page.waitForTimeout(500)
    R.edgeFlip.popper = await q(page, () => {
      const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.getBoundingClientRect().height > 0)
      if (!p) return { open: false }
      const b = p.getBoundingClientRect()
      const mid = document.elementFromPoint(Math.min(innerWidth - 2, b.right - 4), Math.max(2, Math.min(innerHeight - 2, b.bottom - 4)))
      return {
        open: true, top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height,
        withinViewport: b.top >= 0 && b.left >= 0 && b.right <= innerWidth + 0.5 && b.bottom <= innerHeight + 0.5,
        bottomElementIsPopper: !!mid && (mid === p || p.contains(mid)),
        placement: p.getAttribute('data-popper-placement'),
        rowH: null,
      }
    })
    await closeAll(page)
  }

  // ---------- narrow viewport + horizontal scroll ----------
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.waitForTimeout(500)
  R.narrow = await q(page, () => {
    const table = document.querySelector('.cc-table')
    const wrap = table?.querySelector('.el-scrollbar__wrap')
    return {
      innerWidth: innerWidth,
      bodyScrollW: document.body.scrollWidth,
      wrapClientW: wrap?.clientWidth, wrapScrollW: wrap?.scrollWidth, wrapScrollLeft: wrap?.scrollLeft,
      lastThRight: [...document.querySelectorAll('.cc-table thead th')].pop()?.getBoundingClientRect().right,
      fixedRightZero: getComputedStyle([...document.querySelectorAll('.cc-table thead th')].pop()).right,
    }
  })
  // scroll horizontally to right end
  await q(page, () => {
    const wrap = document.querySelector('.cc-table .el-scrollbar__wrap')
    if (wrap) wrap.scrollLeft = wrap.scrollWidth
  })
  await page.waitForTimeout(400)
  R.narrow.afterScroll = await q(page, () => {
    const wrap = document.querySelector('.cc-table .el-scrollbar__wrap')
    return { scrollLeft: wrap?.scrollLeft, maxScrollLeft: wrap ? wrap.scrollWidth - wrap.clientWidth : null }
  })
  // open menu on a visible row at right edge
  await q(page, () => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(400)
  const narrowLast = await q(page, () => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr.el-table__row')]
    const vh = window.innerHeight
    const visible = rows.filter((tr) => { const b = tr.getBoundingClientRect(); return b.bottom > 0 && b.top < vh })
    return visible.length ? visible[visible.length - 1].querySelector('.cc-src')?.getAttribute('data-client-id') : null
  })
  if (narrowLast) {
    const lr = await rowByClientId(page, narrowLast)
    await lr.locator('.cc-more-link').click()
    await page.waitForTimeout(500)
    R.narrow.popper = await q(page, () => {
      const p = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.getBoundingClientRect().height > 0)
      if (!p) return { open: false }
      const b = p.getBoundingClientRect()
      return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, withinViewport: b.top >= 0 && b.left >= 0 && b.right <= innerWidth + 0.5 && b.bottom <= innerHeight + 0.5, placement: p.getAttribute('data-popper-placement') }
    })
    await closeAll(page)
  }

  // ---------- fresh reload clears fixed + no persistence ----------
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.cc-table tbody tr.el-table__row', { timeout: 20000 })
  await page.waitForTimeout(800)
  R.freshReload = {
    fixedRows: await q(page, () => document.querySelectorAll('.lt-row-highlight__row').length),
    storage: await q(page, () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), url: location.href })),
  }

  // ---------- Tab reaches trigger; focus ring ----------
  await q(page, () => document.body.focus())
  const seq = []
  let reached = null
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    const info = await q(page, () => {
      const el = document.activeElement
      return el ? { tag: el.tagName, cls: el.className?.toString(), isLink: el.classList?.contains('cc-more-link'), isId: el.classList?.contains('cc-id'), text: el.textContent?.trim().slice(0, 30) } : null
    })
    seq.push(info)
    if (info?.isLink) { reached = { step: i + 1, info }; break }
  }
  R.tabFocus = { reached, steps: seq.length }
  if (reached) {
    R.tabFocus.computed = await q(page, () => {
      const el = document.activeElement
      const cs = getComputedStyle(el)
      const box = el.getBoundingClientRect()
      const cell = el.closest('.cell')
      return {
        outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, outlineOffset: cs.outlineOffset,
        w: box.width, h: box.height,
        cellOverflow: cell ? getComputedStyle(cell).overflow : null,
        insideCell: cell ? box.top >= cell.getBoundingClientRect().top - 0.5 && box.bottom <= cell.getBoundingClientRect().bottom + 0.5 : null,
      }
    })
  }

  fs.writeFileSync(OUT, JSON.stringify(R, null, 2))
  console.log(JSON.stringify({
    ok: true, nonGet: R.gate.nonGetAttempts, errors: R.errors,
    menuStructure: R.menuStructure,
    eventIsolation: R.eventIsolation,
    keyboardActivate: R.keyboardActivate,
    dialogClosedBeforeOpen: R.dialogClosedBeforeOpen,
    longIdTooltip: R.longIdTooltip,
    longDescTooltip: R.longDescTooltip,
    longDescCell: R.longDescCell,
    contentRows: R.contentRows,
    edgeFlip: R.edgeFlip,
    narrow: R.narrow,
    freshReload: R.freshReload,
    tabFocus: R.tabFocus,
    rowH48Count: R.rowTypes.filter((r) => r.rowH === 48 && !r.rowbad).length,
    rowHOther: R.rowTypes.filter((r) => r.rowH !== 48).map((r) => ({ id: r.id, rowH: r.rowH, rowbad: r.rowbad })),
  }, null, 2))
  await browser.close()
}
main().catch((e) => { console.error('FATAL', e); process.exit(1) })
