/**
 * CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002
 * Read-only browser probe for DIALOG-level ACs on /config/client ONLY:
 *   CCFG-AC-092 / 112 / 115 / 124 / 130 / 136
 *
 * Safety: BEFORE the first navigation, every non-GET/HEAD/OPTIONS request to
 * `/api/**` is aborted at the network layer and counted. The create/edit dialog
 * is opened and CANCELLED only. No submit that would write is performed: the
 * only submit clicks happen on a form that fails LOCAL validation (empty id /
 * empty desc / no data source), which returns before any request is issued.
 * Pressed-state sampling uses a real pointer-down followed by moving off the
 * button before pointer-up, so no click event is generated. No fixture is
 * created, no database / ZooKeeper / Kafka is touched. No other page is loaded.
 *
 * Output is desensitized: business-identifiable values (org names, raw probe
 * ids, raw data-source ids) are never captured; only presence/booleans/geometry
 * /counts and static UI copy are recorded.
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

/* ------------------------- in-browser readers ------------------------- */

// Geometry + footer + feedback snapshot (AC-124 stability, AC-136 dialog width)
const DIALOG_SNAP = () => {
  const round = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)
  const dlg = document.querySelector('.el-dialog.cc-dialog')
  if (!dlg) return null
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height), right: round(r.right), bottom: round(r.bottom) } }
  const footer = dlg.querySelector('.el-dialog__footer')
  const btns = footer ? Array.from(footer.querySelectorAll('button.el-button')) : []
  const cs = getComputedStyle(dlg)
  const chips = Array.from(dlg.querySelectorAll('.cc-chip'))
  const fb = dlg.querySelector('.cc-source-field .cc-field-feedback__text')
  const fbEl = fb ? { text: fb.textContent.trim(), tone: fb.classList.contains('ced-field-error') ? 'error' : 'hint', role: fb.getAttribute('role') } : null
  return {
    dialog: rect(dlg),
    dialogMaxWidth: cs.maxWidth,
    labelColumnWidthToken: cs.getPropertyValue('--ced-label-column-width').trim(),
    labelGapToken: cs.getPropertyValue('--ced-label-gap').trim(),
    safetyInsetToken: cs.getPropertyValue('--ced-dialog-safety-inset').trim(),
    title: (dlg.querySelector('.el-dialog__title')?.textContent || '').trim(),
    footer: footer ? rect(footer) : null,
    footerButtons: btns.map((b) => ({ text: b.textContent.trim(), ...rect(b) })),
    chosenCount: chips.length,
    badChipCount: chips.filter((c) => c.classList.contains('cc-chip--bad')).length,
    sourceFeedback: fbEl,
    idFieldError: !!dlg.querySelector('.cc-field--error'),
    idErrorText: (dlg.querySelectorAll('.ced-field-error')[0]?.textContent || '').trim(),
    errCount: dlg.querySelectorAll('.ced-field-error').length,
  }
}

// Label / control geometry + typography for AC-136 (3 rows)
const LABEL_ROWS = () => {
  const round = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height), right: round(r.right) } }
  const dlg = document.querySelector('.el-dialog.cc-dialog')
  if (!dlg) return null
  return Array.from(dlg.querySelectorAll('.cc-form-item.ced-label-row')).map((row) => {
    const label = row.querySelector('.cc-form-label')
    const control = row.querySelector('.cc-form-control')
    const lcs = label ? getComputedStyle(label) : null
    const before = label ? getComputedStyle(label, '::before') : null
    const lr = label ? rect(label) : null
    const cr = control ? rect(control) : null
    const input = control ? control.querySelector('input, textarea') : null
    const inputWrap = control ? control.querySelector('.el-input, .el-textarea') : null
    return {
      label: label ? label.textContent.trim() : null,
      labelFontSize: lcs ? lcs.fontSize : null,
      labelFontWeight: lcs ? lcs.fontWeight : null,
      labelColor: lcs ? lcs.color : null,
      labelTextAlign: lcs ? lcs.textAlign : null,
      labelStarContent: before ? before.content : null,
      labelStarColor: before ? before.color : null,
      labelRect: lr,
      controlRect: cr,
      gapLabelRightToControlLeft: lr && cr ? round(cr.x - lr.right) : null,
      inputInlineStyleWidth: inputWrap ? (inputWrap.getAttribute('style') || '') : null,
      hasRequiredMarkClass: label ? label.classList.contains('ced-required-mark') : null,
    }
  })
}

// Source selection panes for AC-112
const SOURCE_PANES = () => {
  const round = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height), right: round(r.right), bottom: round(r.bottom) } }
  const dlg = document.querySelector('.el-dialog.cc-dialog')
  if (!dlg) return null
  const split = dlg.querySelector('.cc-split')
  const optPane = dlg.querySelector('.cc-pane--options')
  const chosenPane = dlg.querySelector('.cc-pane--chosen')
  const optList = dlg.querySelector('.cc-opt-list')
  const scs = split ? getComputedStyle(split) : null
  const ocs = optList ? getComputedStyle(optList) : null
  const btn = dlg.querySelector('.cc-opt')
  const sub = dlg.querySelector('.cc-opt-sub')
  const reason = dlg.querySelector('.cc-opt-reason')
  const main = dlg.querySelector('.cc-opt-main')
  const srect = split ? rect(split) : null
  const orect = optPane ? rect(optPane) : null
  const crect = chosenPane ? rect(chosenPane) : null
  const drect = rect(dlg)
  return {
    splitRect: srect,
    splitDisplay: scs ? scs.display : null,
    splitFlexDirection: scs ? scs.flexDirection : null,
    splitGap: scs ? scs.gap : null,
    splitHeight: srect ? srect.h : null,
    optionsPaneRect: orect,
    chosenPaneRect: crect,
    optionsWiderThanChosen: orect && crect ? orect.w > crect.w : null,
    optionsMinusChosenPx: orect && crect ? round(orect.w - crect.w) : null,
    paneGapPx: orect && crect ? round(crect.x - orect.right) : null,
    optList: optList ? {
      scrollHeight: optList.scrollHeight,
      clientHeight: optList.clientHeight,
      overflowY: ocs ? ocs.overflowY : null,
      scrollable: optList.scrollHeight > optList.clientHeight + 1,
    } : null,
    optCount: dlg.querySelectorAll('.cc-opt').length,
    disabledOptCount: dlg.querySelectorAll('.cc-opt:disabled').length,
    reasonTexts: Array.from(dlg.querySelectorAll('.cc-opt-reason')).slice(0, 2).map((r) => r.textContent.trim()),
    fontMain: main ? getComputedStyle(main).fontSize : null,
    fontSub: sub ? getComputedStyle(sub).fontSize : null,
    fontSubColor: sub ? getComputedStyle(sub).color : null,
    fontReason: reason ? getComputedStyle(reason).fontSize : null,
    fontReasonColor: reason ? getComputedStyle(reason).color : null,
    optRowHeight: btn ? round(btn.getBoundingClientRect().height) : null,
    dialogRect: drect,
    overflowsDialog: orect && crect ? (orect.right > drect.right + 0.5 || crect.right > drect.right + 0.5) : null,
  }
}

// Submit / secondary button style reader (AC-115).
// `document.querySelector` has no Playwright `:visible` pseudo-class, so we pick
// the first VISIBLE match among all candidates (a closed el-dialog stays in DOM).
const BTN_STYLE = (sel) => {
  const cands = Array.from(document.querySelectorAll(sel))
  const el = cands.find((e) => e.offsetParent !== null) || null
  if (!el) return null
  const cs = getComputedStyle(el)
  const active = document.activeElement
  return {
    exists: true,
    disabled: el.disabled === true || el.classList.contains('is-disabled'),
    bg: cs.backgroundColor,
    color: cs.color,
    borderRadius: cs.borderRadius,
    fontWeight: cs.fontWeight,
    borderColor: cs.borderTopColor,
    outline: cs.outlineWidth + ' ' + cs.outlineColor,
    isActiveEl: active === el,
    activeElClass: active ? String(active.className).slice(0, 60) : null,
  }
}

// Description textarea limits for AC-130
const DESC_META = () => {
  const ta = document.querySelector('.el-dialog.cc-dialog .cc-desc-row textarea')
  if (!ta) return null
  const v = ta.value
  const cps = Array.from(v)
  const last = cps[cps.length - 1]
  const lastCode = last ? last.codePointAt(0) : null
  return {
    placeholder: ta.getAttribute('placeholder'),
    maxlengthAttr: ta.getAttribute('maxlength'),
    valueCodePoints: cps.length,
    valueUtf16Units: v.length,
    utf8Bytes: new TextEncoder().encode(v).length,
    lastCodePoint: lastCode,
    lastIsLoneSurrogate: lastCode !== null && lastCode >= 0xd800 && lastCode <= 0xdfff,
    hasLoneSurrogateAnywhere: cps.some((c) => { const n = c.codePointAt(0); return n >= 0xd800 && n <= 0xdfff }),
  }
}

/* --------------------------- page helpers --------------------------- */

async function waitDialog(page) {
  await page.waitForSelector('.el-dialog.cc-dialog:visible .cc-form', { timeout: 6000 })
  await page.waitForTimeout(350)
}

async function cancelDialog(page) {
  const btn = page.locator('.el-dialog.cc-dialog:visible .el-dialog__footer button.el-button', { hasText: '取消' }).first()
  await btn.click()
  await page.waitForSelector('.el-dialog.cc-dialog:visible', { state: 'detached', timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(250)
}

// open create dialog
async function openCreate(page) {
  await page.locator('.cc-btn-add').click()
  await waitDialog(page)
}

// open edit dialog on a row whose clientId equals `clientId` (transient, never emitted)
async function openEdit(page, clientId) {
  const idx = await page.evaluate((id) => {
    const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
    return rows.findIndex((tr) => tr.querySelector('.cc-src')?.getAttribute('data-client-id') === id)
  }, clientId)
  if (idx < 0) throw new Error('edit row not found')
  // dblclick the 探针描述 cell (column index 2): it has no interactive children,
  // unlike the 采集数据源 cell whose tags/popover stop dblclick propagation.
  await page.locator('.cc-table .el-table__body tr.el-table__row').nth(idx).locator('td.el-table__cell').nth(2).dblclick()
  await waitDialog(page)
}

// AC-130: feed a string through the desc textarea and read back the model-view value
async function descSet(page, value) {
  await page.fill('.el-dialog.cc-dialog:visible .cc-desc-row textarea', value)
  await page.waitForTimeout(120)
  return page.evaluate(DESC_META)
}

async function runBtnStates(page, pwSel, plainSel) {
  await page.mouse.move(4, 4)
  await page.waitForTimeout(150)
  const loc = page.locator(pwSel)
  await loc.scrollIntoViewIfNeeded()
  const box = await loc.boundingBox()
  await page.mouse.move(4, 4)
  await page.waitForTimeout(150)
  const normal = await page.evaluate(BTN_STYLE, plainSel)
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  // hover
  await page.mouse.move(cx, cy)
  await page.waitForTimeout(220)
  const hover = await page.evaluate(BTN_STYLE, plainSel)
  // pressed: real pointer-down, sample, then move off before up (no click)
  await page.mouse.down()
  await page.waitForTimeout(140)
  const pressed = await page.evaluate(BTN_STYLE, plainSel)
  await page.mouse.move(4, 4)
  await page.waitForTimeout(60)
  await page.mouse.up()
  await page.waitForTimeout(160)
  // keyboard focus via real Tab (focus the previous sibling button, then Tab)
  const tab = await page.evaluate((s) => {
    const el = Array.from(document.querySelectorAll(s)).find((e) => e.offsetParent !== null)
    if (!el) return { prevText: null }
    const footer = el.closest('.el-dialog__footer')
    const btns = footer ? Array.from(footer.querySelectorAll('button.el-button')) : []
    const i = btns.indexOf(el)
    const prev = btns[i - 1] || el
    prev.focus()
    return { prevText: prev.textContent.trim() }
  }, plainSel)
  await page.keyboard.press('Tab')
  await page.waitForTimeout(200)
  const focusTab = await page.evaluate(BTN_STYLE, plainSel)
  // keyboard focus via JS focus (covers programmatic focus state)
  await page.locator(pwSel).evaluate((el) => el.focus())
  await page.waitForTimeout(150)
  const focusJs = await page.evaluate(BTN_STYLE, plainSel)
  await page.mouse.move(4, 4)
  await page.waitForTimeout(80)
  return { normal, hover, pressed, focusTab, focusJs, tabFrom: tab.prevText }
}

/* ------------------------------- run ------------------------------- */

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true })
  const result = {
    task: 'CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002',
    probe: 'dialog-level (AC-092/112/115/124/130/136)',
    mode: 'readonly-browser-probe',
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    frontend: FRONT,
    writeInterception: { policy: '/api/** GET/HEAD/OPTIONS allow; POST/PUT/PATCH/DELETE abort+count', nonGetAttempts: null, attempts: [] },
    viewports: {},
  }

  const apiClients = await (await fetch(`${API}/api/clients`)).json()
  const clients = (apiClients && apiClients.data && apiClients.data.items) || []

  // transient edit-target selection: a NORMAL row (no row anomaly, all sources clean,
  // >=1 source), preferring the one with the most sources.
  const cleanRows = clients
    .filter((c) => (c.rowAnomalies || []).length === 0 && (c.dataSources || []).length >= 1 && (c.dataSources || []).every((d) => (d.anomalies || []).length === 0))
    .sort((a, b) => (b.dataSources || []).length - (a.dataSources || []).length)
  const editClientId = cleanRows.length ? cleanRows[0].clientId : null
  const sampleFacts = { multiSourceClean: !!(cleanRows[0] && cleanRows[0].dataSources.length >= 2) }
  sampleFacts.anomalousRows = clients.filter((c) => (c.dataSources || []).some((d) => (d.anomalies || []).length > 0)).length
  sampleFacts.ambiguousRows = clients.filter((c) => (c.rowAnomalies || []).includes('COMMA_PROTOCOL_AMBIGUOUS')).length
  sampleFacts.maxDescLen = Math.max(0, ...clients.map((c) => (c.clientDesc || '').length))
  sampleFacts.maxClientIdLen = Math.max(0, ...clients.map((c) => (c.clientId || '').length))
  sampleFacts.maxDsIdLen = Math.max(0, ...clients.flatMap((c) => (c.dataSources || []).map((d) => (d.dataSourceId || '').length)))
  sampleFacts.maxOrgLen = Math.max(0, ...clients.flatMap((c) => (c.dataSources || []).map((d) => (d.org || '').length)))
  sampleFacts.counts = clients.map((c) => (c.dataSources || []).length)
  sampleFacts.multiSourceWithAnomaly = clients.some((c) => (c.dataSources || []).length >= 2 && (c.dataSources || []).some((d) => (d.anomalies || []).length > 0))
  result.sampleFacts = sampleFacts
  result.editTargetResolved = editClientId !== null

  const VIEWPORTS = [
    { name: '1440x900', width: 1440, height: 900 },
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '900x800', width: 900, height: 800 },
  ]

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 })
    await installWriteBlocker(ctx)
    const page = await ctx.newPage()
    const out = {}
    try {
      await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
      await page.waitForSelector('.cc-table .el-table__body tr.el-table__row')

      // ---------- AC-092 baseline: dialog has no inner table; list row heights ----------
      out.ac092 = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
        const heights = rows.map((tr) => Math.round(tr.getBoundingClientRect().height))
        const hist = heights.reduce((a, h) => { a[h] = (a[h] || 0) + 1; return a }, {})
        const actionTh = document.querySelector('.cc-table th.lt-row-action__cell')
        const actionTd = document.querySelector('.cc-table td.lt-row-action__cell')
        const fr = actionTd ? getComputedStyle(actionTd) : null
        return {
          listRowHeightHistogram: hist,
          hasRowHeightTokenInCss: null,
          fixedCol: actionTh ? { position: actionTh ? getComputedStyle(actionTh).position : null, stickyRight: actionTh ? getComputedStyle(actionTh).right : null, tdPosition: fr ? fr.position : null, tdRight: fr ? fr.right : null } : null,
          ellipsisCellCount: document.querySelectorAll('.cc-table .cell.el-tooltip').length,
        }
      })

      // ---------- CREATE dialog ----------
      await openCreate(page)
      out.create = {}
      out.create.snapOpen = await page.evaluate(DIALOG_SNAP)
      out.create.labels = await page.evaluate(LABEL_ROWS)
      out.create.sourcePanes = await page.evaluate(SOURCE_PANES)
      out.create.submitStates = await runBtnStates(page, '.el-dialog.cc-dialog:visible .cc-dialog-submit', '.cc-dialog-submit')
      out.create.secondary = {
        cancel: await page.evaluate(BTN_STYLE, '.el-dialog__footer button.el-button'),
        autogen: await page.evaluate(BTN_STYLE, '.cc-autogen'),
      }
      out.create.dialogHasInnerTable = await page.evaluate(() => !!document.querySelector('.el-dialog.cc-dialog .el-table'))

      // ---- AC-130 description limits ----
      const HAN = '中'
      const EMOJI = '😀' // U+1F600, 1 code point / 2 UTF-16 units
      const a300 = HAN.repeat(300)
      const a256 = HAN.repeat(256)
      const mixed = HAN.repeat(200) + EMOJI.repeat(100) // 300 cp / 400 utf16
      const boundary = HAN.repeat(255) + EMOJI // 256 cp / 257 utf16; naive utf16-slice would split emoji
      out.ac130 = {
        placeholderAndLimits: await page.evaluate(DESC_META),
        t_300han: await descSet(page, a300),
        t_256han: await descSet(page, a256),
        t_mixed: await descSet(page, mixed),
        t_boundary: await descSet(page, boundary),
        t_handType: null,
      }
      // real keyboard entry (手输) of 258 chars, then read back
      await page.fill('.el-dialog.cc-dialog:visible .cc-desc-row textarea', '')
      await page.locator('.el-dialog.cc-dialog:visible .cc-desc-row textarea').focus()
      await page.keyboard.type(HAN.repeat(258))
      await page.waitForTimeout(150)
      out.ac130.t_handType = await page.evaluate(DESC_META)

      // ---- AC-124 create sequence ----
      const seq = []
      seq.push({ state: 'S0-unselected', ...(await page.evaluate(DIALOG_SNAP)) })
      // select 1
      await page.locator('.el-dialog.cc-dialog:visible .cc-opt:not(:disabled)').first().click()
      await page.waitForTimeout(200)
      seq.push({ state: 'S1-one-selected', ...(await page.evaluate(DIALOG_SNAP)) })
      // remove all
      let guard = 0
      while ((await page.locator('.el-dialog.cc-dialog:visible .cc-chip').count()) > 0 && guard++ < 30) {
        await page.locator('.el-dialog.cc-dialog:visible .cc-chip .el-tag__close').first().click()
        await page.waitForTimeout(120)
      }
      seq.push({ state: 'S2-all-cleared', ...(await page.evaluate(DIALOG_SNAP)) })
      // submit -> local validation error (no network)
      await page.locator('.el-dialog.cc-dialog:visible .cc-dialog-submit').click()
      await page.waitForTimeout(300)
      seq.push({ state: 'S3-submit-error', ...(await page.evaluate(DIALOG_SNAP)) })
      // correct: select 1 again + fill id/desc -> error clears (do NOT submit again)
      await page.locator('.el-dialog.cc-dialog:visible .cc-opt:not(:disabled)').first().click()
      await page.waitForTimeout(150)
      await page.fill('.el-dialog.cc-dialog:visible .cc-id-control input', 'probe-draft-1')
      await page.fill('.el-dialog.cc-dialog:visible .cc-desc-row textarea', 'draft only, not submitted')
      await page.waitForTimeout(200)
      seq.push({ state: 'S4-corrected', ...(await page.evaluate(DIALOG_SNAP)) })
      out.ac124_create = seq
      await cancelDialog(page)

      // ---------- EDIT dialog ----------
      if (editClientId) {
        await openEdit(page, editClientId)
        out.edit = {}
        out.edit.snapOpen = await page.evaluate(DIALOG_SNAP)
        out.edit.labels = await page.evaluate(LABEL_ROWS)
        out.edit.sourcePanes = await page.evaluate(SOURCE_PANES)
        // AC-092 keyboard edit of ID
        out.edit.idKeyboard = await page.evaluate(() => {
          const dlg = document.querySelector('.el-dialog.cc-dialog')
          const inp = dlg.querySelector('.cc-id-control input')
          const toggle = dlg.querySelector('.cc-id-toggle')
          return { inputDisabledBefore: inp ? inp.disabled : null, toggleText: toggle ? toggle.textContent.trim() : null, hasLockHint: !!dlg.querySelector('.cc-lock-hint') }
        })
        await page.locator('.el-dialog.cc-dialog:visible .cc-id-toggle').click()
        await page.waitForTimeout(200)
        out.edit.idKeyboardAfterToggle = await page.evaluate(() => {
          const dlg = document.querySelector('.el-dialog.cc-dialog')
          const inp = dlg.querySelector('.cc-id-control input')
          return { inputDisabled: inp ? inp.disabled : null, toggleText: dlg.querySelector('.cc-id-toggle')?.textContent.trim(), hasLockHint: !!dlg.querySelector('.cc-lock-hint') }
        })
        await page.locator('.el-dialog.cc-dialog:visible .cc-id-control input').focus()
        await page.keyboard.press('End')
        await page.keyboard.type('x')
        await page.waitForTimeout(150)
        out.edit.idKeyboardAfterType = await page.evaluate(() => {
          const ta = document.querySelector('.el-dialog.cc-dialog .cc-id-control input')
          return { focused: document.activeElement === ta, valueLen: ta ? ta.value.length : null, caretAtEnd: ta ? ta.selectionStart === ta.value.length : null }
        })
        out.edit.submitStates = await runBtnStates(page, '.el-dialog.cc-dialog:visible .cc-dialog-submit', '.cc-dialog-submit')
        out.edit.idToggleStyle = await page.evaluate(BTN_STYLE, '.cc-id-toggle')
        out.edit.secondary = { cancel: await page.evaluate(BTN_STYLE, '.el-dialog__footer button.el-button') }

        // AC-124 edit sequence
        const eseq = []
        eseq.push({ state: 'E0-edit-open', ...(await page.evaluate(DIALOG_SNAP)) })
        let g2 = 0
        while ((await page.locator('.el-dialog.cc-dialog:visible .cc-chip').count()) > 0 && g2++ < 30) {
          await page.locator('.el-dialog.cc-dialog:visible .cc-chip .el-tag__close').first().click()
          await page.waitForTimeout(120)
        }
        eseq.push({ state: 'E1-all-cleared', ...(await page.evaluate(DIALOG_SNAP)) })
        await page.locator('.el-dialog.cc-dialog:visible .cc-dialog-submit').click()
        await page.waitForTimeout(300)
        eseq.push({ state: 'E2-submit-error', ...(await page.evaluate(DIALOG_SNAP)) })
        await page.locator('.el-dialog.cc-dialog:visible .cc-opt:not(:disabled)').first().click()
        await page.waitForTimeout(200)
        eseq.push({ state: 'E3-corrected', ...(await page.evaluate(DIALOG_SNAP)) })
        out.ac124_edit = eseq
        await cancelDialog(page)
      }
    } catch (e) {
      out.error = String(e && e.message || e)
    }
    result.viewports[vp.name] = out
    await ctx.close()
  }

  result.writeInterception.nonGetAttempts = writes.length
  result.writeInterception.attempts = writes.slice(0, 20)
  await browser.close()
  fs.writeFileSync(`${OUT}/s2-dialog-results.json`, JSON.stringify(result, null, 2))
  console.log('WROTE', `${OUT}/s2-dialog-results.json`, 'writeAttempts=', writes.length)
}
run().catch((e) => { console.error(e); process.exit(1) })
