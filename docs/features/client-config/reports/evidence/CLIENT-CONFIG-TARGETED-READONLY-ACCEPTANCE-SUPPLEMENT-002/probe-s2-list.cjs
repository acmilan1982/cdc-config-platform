/**
 * CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002
 * Read-only browser probe for LIST-level ACs on /config/client ONLY:
 *   CCFG-AC-009 / 017 / 088 / 101 / 103
 *
 * Safety: BEFORE the first navigation, every non-GET/HEAD/OPTIONS request to
 * `/api/**` is aborted at the network layer and counted. No form is submitted,
 * no enable/disable/delete confirmation is confirmed, no fixture is created,
 * no database / ZooKeeper / Kafka is touched. Menu/confirm dialogs are opened
 * and then CANCELLED. No other feature page is loaded.
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

const FRONT = process.env.S2_FRONT || 'http://127.0.0.1:5173'
const API = process.env.S2_API || 'http://127.0.0.1:8080'
const OUT = process.env.S2_OUT || '/tmp/s2-out'
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

const round = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)

// relative-luminance contrast of a css rgb()/rgba() color string vs a background
const contrastHelper = (fg, bg) => {
  const parse = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map((x) => parseFloat(x))
    return p.slice(0, 3)
  }
  const lum = (c) => {
    const a = c.map((v) => {
      const x = v / 255
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
  }
  const f = parse(fg), b = parse(bg)
  if (!f || !b) return null
  const L1 = lum(f), L2 = lum(b)
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2)
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
}

// NOTE: functions below run INSIDE the browser page; Node helpers are not
// visible there, so any helper they need is inlined.
const LIST = () => {
  const round = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)
  const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
  const headerCells = Array.from(document.querySelectorAll('.cc-table .el-table__header-wrapper th.el-table__cell'))
  const headers = headerCells.map((th) => (th.querySelector('.cell')?.textContent || '').trim())
  const highlightRows = rows
    .map((tr, i) => (tr.classList.contains('lt-row-highlight__row') ? i + 1 : null))
    .filter((x) => x !== null)
  const heights = rows.map((tr) => Math.round(tr.getBoundingClientRect().height))
  return {
    headers,
    hasStatusColumn: headers.some((h) => h.includes('状态')),
    rowCount: rows.length,
    rowHeightHistogram: heights.reduce((a, h) => { a[h] = (a[h] || 0) + 1; return a }, {}),
    highlightRows,
    addBtn: (() => {
      const b = document.querySelector('.cc-btn-add')
      if (!b) return null
      const r = b.getBoundingClientRect()
      const toolbar = document.querySelector('.ql-result-panel__toolbar')
      const tb = toolbar ? toolbar.getBoundingClientRect() : null
      return { text: b.textContent.trim(), right: round(r.right), toolbarRight: tb ? round(tb.right) : null }
    })(),
    batchAbsence: (() => {
      const bodyText = document.body.innerText
      return {
        hasSelectionColumn: !!document.querySelector('.cc-table .el-table-column--selection, .cc-table th .el-checkbox'),
        hasRowCheckbox: !!document.querySelector('.cc-table .el-table__body .el-checkbox'),
        hasDeleteSelected: bodyText.includes('删除所选'),
        hasBatchWord: bodyText.includes('批量'),
        hasSelectedHint: /已选择|已选\s*[:：]/.test(bodyText),
      }
    })(),
    headersRightmost: headers[headerCells.length - 1],
  }
}

// Read 采集数据源 column of each row: tag main text + plus text (NO raw text emitted)
const DS_COLUMN = () => {
  const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
  return rows.map((tr, i) => {
    const tds = Array.from(tr.querySelectorAll('td.el-table__cell'))
    const cell = tds[3]
    if (!cell) return { idx: i + 1, present: false }
    const dstag = Array.from(cell.querySelectorAll('.cc-dstag'))
    const visibleDstag = dstag.filter((t) => getComputedStyle(t).display !== 'none')
    const tags = visibleDstag.map((t) => (t.querySelector('.cc-txt')?.textContent || '').trim())
    const plus = cell.querySelector('.cc-more')
    const rowbad = cell.querySelector('.cc-rowbad')
    return {
      idx: i + 1,
      present: true,
      tagCount: tags.length,
      tagTotalInDom: dstag.length,
      plusText: plus ? plus.textContent.trim() : null,
      rowAmbiguousMarker: rowbad ? rowbad.textContent.trim() : null,
      // main texts are compared to API org/id outside; store them only in a
      // transient map for the correlation step, never in the emitted JSON
      __tags: tags,
      __clientId: tr.querySelector('.cc-src')?.getAttribute('data-client-id') || null,
    }
  })
}

const ID_MARKERS = () => {
  const round = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)
  const contrastHelper = (fg, bg) => {
    const parse = (s) => {
      const m = String(s).match(/rgba?\(([^)]+)\)/)
      if (!m) return null
      const p = m[1].split(',').map((x) => parseFloat(x))
      return p.slice(0, 3)
    }
    const lum = (c) => {
      const a = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) })
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
    }
    const f = parse(fg), b = parse(bg)
    if (!f || !b) return null
    const L1 = lum(f), L2 = lum(b)
    const hi = Math.max(L1, L2), lo = Math.min(L1, L2)
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
  }
  const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
  return rows.map((tr, i) => {
    const abn = tr.querySelector('.cc-abnormal-mark')
    const off = tr.querySelector('.cc-inactive-mark')
    const idEl = tr.querySelector('.cc-id')
    let abnInfo = null
    if (abn) {
      const cs = getComputedStyle(abn)
      const r = abn.getBoundingClientRect()
      const idRect = idEl ? idEl.getBoundingClientRect() : null
      const rowRect = tr.getBoundingClientRect()
      const opTd = tr.querySelector('td.lt-row-action__cell')
      const opRect = opTd ? opTd.getBoundingClientRect() : null
      abnInfo = {
        textPrefix: abn.textContent.trim().slice(0, 3), // static prefix 异常：
        textLength: abn.textContent.trim().length,
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        bg: cs.backgroundColor,
        contrastVsWhite: contrastHelper(cs.color, 'rgb(255,255,255)'),
        marginLeft: cs.marginLeft,
        gapFromIdRight: idRect ? round(r.left - idRect.right) : null,
        insideRow: r.top >= rowRect.top - 0.5 && r.bottom <= rowRect.bottom + 0.5,
        overlapsActionCell: opRect ? r.right > opRect.left + 0.5 : null,
        offsetParentVisible: abn.offsetParent !== null,
      }
    }
    return {
      idx: i + 1,
      hasInactiveMark: !!off,
      inactiveText: off ? off.textContent.trim() : null,
      abnormal: abnInfo,
    }
  })
}

async function openFirstMenu(page, rowIdx) {
  const triggers = page.locator('.cc-table .el-table__body tr.el-table__row .cc-more-link')
  await triggers.nth(rowIdx - 1).click()
  await page.waitForSelector('.cc-more-popper:visible .el-dropdown-menu', { timeout: 5000 })
  await page.waitForTimeout(200)
}

async function readMenu(page) {
  return page.evaluate(() => {
    const popper = Array.from(document.querySelectorAll('.cc-more-popper')).find((p) => p.offsetParent !== null && getComputedStyle(p).display !== 'none')
    if (!popper) return null
    const menu = popper.querySelector('.el-dropdown-menu')
    const items = Array.from(popper.querySelectorAll('.el-dropdown-menu__item'))
    const separators = Array.from(popper.querySelectorAll('li[role=separator], .el-dropdown-menu__item--divided'))
    const cs = menu ? getComputedStyle(menu) : null
    const first = items[0]
    const fcs = first ? getComputedStyle(first) : null
    return {
      itemTexts: items.map((it) => it.textContent.trim()),
      itemCount: items.length,
      separatorCount: separators.length,
      menuBorderRadius: cs ? cs.borderRadius : null,
      menuBoxShadow: cs ? cs.boxShadow : null,
      popperBoxShadow: getComputedStyle(popper).boxShadow,
      popperBorderRadius: getComputedStyle(popper).borderRadius,
      menuPadding: cs ? cs.padding : null,
      separatorMarkup: (() => { const s = popper.querySelector('li[role=separator]'); return s ? { cls: s.className, borderTop: getComputedStyle(s).borderTop, height: s.getBoundingClientRect().height } : null })(),
      itemPadding: fcs ? fcs.padding : null,
      itemFontWeight: fcs ? fcs.fontWeight : null,
      dangerColor: (() => {
        const d = items.find((it) => it.textContent.trim() === '删除')
        return d ? getComputedStyle(d).color : null
      })(),
      dangerIsDivided: (() => {
        const d = items.find((it) => it.textContent.trim() === '删除')
        return d ? d.classList.contains('el-dropdown-menu__item--divided') : null
      })(),
    }
  })
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true })
  const result = {
    task: 'CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002',
    probe: 'list-level (AC-009/017/088/101/103)',
    mode: 'readonly-browser-probe',
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    frontend: FRONT,
    writeInterception: { policy: '/api/** GET/HEAD/OPTIONS allow; POST/PUT/PATCH/DELETE abort+count', nonGetAttempts: null, attempts: [] },
    viewports: {},
  }

  const apiClients = await (await fetch(`${API}/api/clients`)).json()
  const items = apiClients.data.items
  const apiById = new Map(items.map((it) => [it.clientId, it]))

  for (const vp of [{ w: 1440, h: 900 }, { w: 1920, h: 1080 }]) {
    const key = `${vp.w}x${vp.h}`
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 })
    await installWriteBlocker(context)
    const page = await context.newPage()
    const out = {}

    try {
      await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
      await page.waitForSelector('.cc-table .el-table__body tr.el-table__row', { timeout: 15000 })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(300)

      // ---- AC-009 / AC-017 base structure ----
      out.structure = await page.evaluate(LIST)

      // ---- AC-009: tag main text = org where org present ----
      const rawCol = await page.evaluate(DS_COLUMN)
      out.dataSourceColumn = rawCol.map((r) => {
        if (!r.present) return { idx: r.idx, present: false }
        const it = r.__clientId ? apiById.get(r.__clientId) : null
        const apiOrgs = it ? it.dataSources.map((d) => ((d.org ?? '').trim().length ? d.org.trim() : null)) : null
        const apiIds = it ? it.dataSources.map((d) => d.dataSourceId) : null
        let matchesOrg = null, matchesId = null, orgMissingSamples = null
        if (apiOrgs) {
          matchesOrg = r.__tags.filter((t) => apiOrgs.includes(t)).length
          matchesId = r.__tags.filter((t) => apiIds.includes(t)).length
          orgMissingSamples = r.__tags.filter((t, i) => !apiOrgs[i] && t === apiIds[i]).length
        }
        return {
          idx: r.idx, present: true, visibleTagCount: r.tagCount, tagTotalInDom: r.tagTotalInDom, plusText: r.plusText,
          rowAmbiguousMarker: r.rowAmbiguousMarker,
          apiOrgPresent: apiOrgs ? apiOrgs.filter(Boolean).length : null,
          visibleTagsMatchingOrg: matchesOrg,
          visibleTagsMatchingRawId: matchesId,
          tagsMatchingRawIdWhenOrgMissing: orgMissingSamples,
          allVisibleTagsAreOrgNames: matchesOrg !== null && matchesOrg === r.__tags.length && r.__tags.length > 0,
        }
      })

      // ---- AC-088: abnormal FG_ACTIVE row markers ----
      out.idMarkers = await page.evaluate(ID_MARKERS)
      out.abnormalRowCount = out.idMarkers.filter((m) => m.abnormal).length
      // menu items of the abnormal row (must be 停用+删除, no 启用)
      const abnRowIdx = out.idMarkers.findIndex((m) => m.abnormal)
      if (abnRowIdx >= 0) {
        await openFirstMenu(page, abnRowIdx + 1)
        out.abnormalRowMenu = await readMenu(page)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
      }

      // ---- AC-017: click row -> unique fixed selection; re-click cancel; transfer ----
      const rowCells = page.locator('.cc-table .el-table__body tr.el-table__row td.cc-col-id .cc-id')
      await page.locator('.cc-table .el-table__body tr.el-table__row').nth(0).locator('td .cell').nth(2).click()
      await page.waitForTimeout(150)
      const afterClickA = await page.evaluate(LIST)
      await page.locator('.cc-table .el-table__body tr.el-table__row').nth(0).locator('td .cell').nth(2).click()
      await page.waitForTimeout(450) // > 260ms delayed cancel
      const afterReclickA = await page.evaluate(LIST)
      await page.locator('.cc-table .el-table__body tr.el-table__row').nth(2).locator('td .cell').nth(2).click()
      await page.waitForTimeout(150)
      const afterClickC = await page.evaluate(LIST)
      out.rowClick = {
        afterFirstClick: { highlightRows: afterClickA.highlightRows, addBtnIsRightmostInToolbar: afterClickA.addBtn && afterClickA.addBtn.toolbarRight != null ? afterClickA.addBtn.right <= afterClickA.addBtn.toolbarRight + 0.5 && afterClickA.addBtn.right >= afterClickA.addBtn.toolbarRight - 2 : null },
        afterSecondClickSame: { highlightRows: afterReclickA.highlightRows },
        afterClickOtherRow: { highlightRows: afterClickC.highlightRows },
      }
      // clear selection for next steps
      await page.locator('.cc-table .el-table__body tr.el-table__row').nth(2).locator('td .cell').nth(2).click()
      await page.waitForTimeout(400)

      // ---- AC-101: menu visuals + hover on non-danger + keyboard traversal of non-danger items ----
      await openFirstMenu(page, 1)
      out.menu = await readMenu(page)
      // hover the non-danger item ( 停用 or 启用 ) and read its hover fill
      out.menuHoverNonDanger = await page.evaluate(() => {
        const visPoppers = Array.from(document.querySelectorAll('.cc-more-popper')).filter((p) => p.offsetParent !== null && getComputedStyle(p).display !== 'none')
        const items = visPoppers.flatMap((p) => Array.from(p.querySelectorAll('.el-dropdown-menu__item')))
        const it = items.find((x) => ['停用', '启用'].includes(x.textContent.trim()))
        if (!it) return null
        const cs = getComputedStyle(it)
        return { text: it.textContent.trim(), bg: cs.backgroundColor, color: cs.color, fontWeight: cs.fontWeight }
      })
      const nonDangerItem = page.locator('.cc-more-popper:visible .el-dropdown-menu__item', { hasText: /^(停用|启用)$/ }).first()
      if ((await nonDangerItem.count()) > 0) {
        await nonDangerItem.hover()
        await page.waitForTimeout(150)
        out.menuHoverNonDanger = await nonDangerItem.evaluate((e) => { const cs = getComputedStyle(e); return { text: e.textContent.trim(), bg: cs.backgroundColor, color: cs.color, fontWeight: cs.fontWeight } })
      }
      await page.keyboard.press('Escape')
      await page.waitForTimeout(250)

      // keyboard traversal of menu items (incl. the non-danger item):
      // open the menu, hover an item, then ArrowDown to move real keyboard focus.
      const trigger = page.locator('.cc-table .el-table__body tr.el-table__row .cc-more-link').first()
      await trigger.focus()
      const focusTrigger = await page.evaluate(() => {
        const el = document.activeElement
        const cs = el ? getComputedStyle(el) : null
        return el ? { isEllipsisTrigger: String(el.className).includes('lt-row-action__ellipsis'), outline: cs ? `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` : null } : null
      })
      await openFirstMenu(page, 1)
      const dangerItem = page.locator('.cc-more-popper:visible .el-dropdown-menu__item.cc-more-danger').first()
      await dangerItem.hover()
      await page.waitForTimeout(150)
      const kbSteps = []
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(160)
        const s = await page.evaluate(() => {
          const el = document.activeElement
          if (!el) return null
          const cs = getComputedStyle(el)
          return {
            isMenuItem: el.classList.contains('el-dropdown-menu__item'),
            text: (el.textContent || '').trim(),
            bg: cs.backgroundColor, color: cs.color,
            outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
          }
        })
        kbSteps.push(s)
        if (s && s.text === '删除' && i > 0) break
      }
      out.keyboardMenu = { focusTrigger, steps: kbSteps, note: 'open menu -> hover an item -> ArrowDown moves real keyboard focus (EP roving focus group, loop)' }
      await page.keyboard.press('Escape')
      await page.waitForTimeout(250)

      // keyboard focus on 停用 (only present on the abnormal row's menu)
      if (abnRowIdx >= 0) {
        await openFirstMenu(page, abnRowIdx + 1)
        const abnDanger = page.locator('.cc-more-popper:visible .el-dropdown-menu__item.cc-more-danger').first()
        await abnDanger.hover()
        await page.waitForTimeout(150)
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(180)
        out.keyboardMenuAbnormal = await page.evaluate(() => {
          const el = document.activeElement
          if (!el) return null
          const cs = getComputedStyle(el)
          return { isMenuItem: el.classList.contains('el-dropdown-menu__item'), text: (el.textContent || '').trim(), bg: cs.backgroundColor, color: cs.color, outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` }
        })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(250)
      }

      // ---- AC-103: single/double click trigger must NOT open edit dialog ----
      const editDlgVisible = () => page.evaluate(() => {
        const dlg = document.querySelector('.cc-dialog')
        if (!dlg) return { visible: false, title: null }
        const cs = getComputedStyle(dlg)
        const title = dlg.querySelector('.el-dialog__title')?.textContent?.trim() || null
        return { visible: cs.display !== 'none' && dlg.offsetParent !== null, title }
      })
      const seq = []
      // single click (opens menu, not edit)
      await page.locator('.cc-table .el-table__body tr.el-table__row').nth(1).locator('.cc-more-link').click()
      await page.waitForTimeout(250)
      seq.push({ action: 'singleClickTrigger', editDialog: await editDlgVisible() })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(250)
      // double click
      await page.locator('.cc-table .el-table__body tr.el-table__row').nth(1).locator('.cc-more-link').dblclick()
      await page.waitForTimeout(350)
      seq.push({ action: 'doubleClickTrigger', editDialog: await editDlgVisible() })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(250)
      // click inside an open menu on a non-danger item area: open menu then dblclick the 停用 item region
      await openFirstMenu(page, 2)
      const warn2 = page.locator('.cc-more-popper:visible .el-dropdown-menu__item', { hasText: '停用' }).first()
      if ((await warn2.count()) > 0) {
        const box = await warn2.boundingBox()
        if (box) { await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2) }
      }
      await page.waitForTimeout(400)
      seq.push({ action: 'doubleClickMenuItem', editDialog: await editDlgVisible() })
      // cancel any confirm dialog that appeared
      const confirmCancel = page.locator('.el-message-box__btns button', { hasText: '取消' }).first()
      if ((await confirmCancel.count()) > 0) { await confirmCancel.click(); await page.waitForTimeout(250) }
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      out.rowEventIsolation = { editDialogOpened: seq.some((s) => s.editDialog.visible), sequence: seq }
    } catch (e) {
      out.error = String(e && e.stack ? e.stack : e)
    } finally {
      await context.close()
    }
    result.viewports[key] = out
  }

  result.writeInterception.nonGetAttempts = writes.length
  result.writeInterception.attempts = writes
  fs.writeFileSync(`${OUT}/s2-list-results.json`, JSON.stringify(result, null, 1))
  await browser.close()
  console.log('WROTE', `${OUT}/s2-list-results.json`)
  console.log('writeAttempts=', writes.length)
}

run().catch((e) => { console.error(e); process.exit(1) })
