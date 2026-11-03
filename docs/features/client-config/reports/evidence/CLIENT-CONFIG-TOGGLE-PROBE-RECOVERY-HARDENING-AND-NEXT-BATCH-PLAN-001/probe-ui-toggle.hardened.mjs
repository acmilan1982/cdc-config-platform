/**
 * HARDENED COPY — CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001
 *
 * Derived from the original T02 probe in
 *   reports/evidence/CLIENT-CONFIG-T02-CONTROLLED-UI-TOGGLE-ACCEPTANCE-001/probe-ui-toggle.mjs
 * This copy did NOT produce the original T02 evidence JSON and must never be
 * treated as the script that collected it. The original directory is preserved
 * byte-identical for that historical evidence.
 *
 * Differences from the original (recovery/budget only; B0-B7 business steps
 * are otherwise unchanged):
 *  - All write attempts (browser gate + API recovery) share one synchronous
 *    ledger from ./recovery-coordinator.mjs; budget is charged before the
 *    request leaves, not after the response/parse.
 *  - The recovery branch delegates to createRecoveryCoordinator(): it re-reads
 *    identity / FG_ACTIVE / business pre-image / in-flight state, never sends
 *    an API disable after the page already allowed a write, and only claims
 *    recovery from a final GET.
 *
 * Integration points with the shared module:
 *  - `ledger.tryReserve(kind, meta)` in the context gate before route.continue()
 *  - `createRecoveryCoordinator({...}).recover()` in the top-level catch
 *  - `ledger.snapshot()` exported in the run summary
 *
 * CLIENT-CONFIG-T02-CONTROLLED-UI-TOGGLE-ACCEPTANCE-001
 * Real-page enable -> disable round-trip with a context-level network gate.
 *
 * Safety:
 *  - Gate is installed BEFORE the first navigation on every context.
 *  - GET/HEAD/OPTIONS pass. Only the exact encoded T02 PUT enable/disable path
 *    is allowed, phase-gated and counted. Every other non-GET /api/** is
 *    aborted and counted.
 *  - Real page + real backend; no mock, no fixture, no DOM/CSS injection.
 *    Only passive observation (read-only DOM/computed styles/observers).
 *  - Screenshots are not taken; raw identifiers stay outside the repository.
 */
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, chmodSync } from 'node:fs'
import {
  createWriteLedger,
  createRecoveryCoordinator,
  RECOVERY_ACTIONS,
} from './recovery-coordinator.mjs'
import { readPageState } from './page-state-adapter.mjs'

const MAP = '/root/cdc-controlled-toggle-readiness-001/candidate-map.json'
const PRE = '/root/cdc-controlled-toggle-readiness-001/pre-image-T02.json'
const RAW_OUT = '/root/cdc-controlled-toggle-readiness-001/ui-run-raw-T02.json'
const ENV_OUT = '/tmp/t02-ui-results.json'
const API = 'http://127.0.0.1:8080'
const FRONT = 'http://127.0.0.1:5173'

const map = JSON.parse(readFileSync(MAP, 'utf8'))
const t02 = (map.mapping || []).filter((x) => x.alias === 'T02')
if (t02.length !== 1) throw new Error('STOP: T02 alias not unique')
const ID = t02[0].clientId
if (!ID) throw new Error('STOP: empty T02 clientId')
const preimage = JSON.parse(readFileSync(PRE, 'utf8'))
if (preimage.clientId !== ID) throw new Error('STOP: pre-image/clientId mismatch')
const ENC = encodeURIComponent(ID)
const PATH_ENABLE = `/api/clients/${ENC}/enable`
const PATH_DISABLE = `/api/clients/${ENC}/disable`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- run state
// One shared ledger for every write channel. Imported from the offline-verified
// module so the real probe and the simulation cannot drift apart.
const ledger = createWriteLedger({ enable: 1, disable: 1, recoveryDisable: 1, total: 3 })

const run = {
  task_code: 'CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001',
  startedAt: new Date().toISOString(),
  alias: 'T02',
  id_length: ID.length,
  viewport_primary: '1440x900',
  viewport_regression: '1920x1080',
  phase: 'B0',
  write_attempts: [], // every allowed PUT attempt (mirror of the ledger)
  blocked_non_get: [], // every blocked non-GET /api/**
  api_responses: [],
  request_failures: [],
  steps: {},
  violations: [],
  fatal: null,
  enable_committed: false,
  disable_committed: false,
  // A normal disable request was allowed but has not yet returned; recovery must
  // not treat the row as safely idle while this is true.
  disable_outstanding: false,
  recovery_used: 0,
  gates: [],
}

function setPhase(p) { run.phase = p }

async function readApiSnapshot(path) {
  const r = await fetch(API + path)
  const j = await r.json()
  return { http: r.status, code: j.code, data: j.data }
}

async function captureCurrent() {
  const j = await readApiSnapshot('/api/clients?status=ALL')
  const items = j.data?.items || []
  const m = items.filter((x) => x.clientId === ID)
  if (m.length !== 1) throw new Error(`STOP: current exact match count=${m.length}`)
  return { http: j.http, code: j.code, row: m[0], total: items.length }
}

// ---------------------------------------------------------------- gate
// Phase/method/path decision only. Budget is NOT checked here: the shared
// ledger performs a synchronous check+reserve before the request is allowed.
function decide(method, pathname) {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return { allow: true, reason: 'read-only' }
  if (!pathname.startsWith('/api/')) return { allow: true, reason: 'non-api' }
  if (method === 'PUT' && pathname === PATH_ENABLE && run.phase === 'B3-enable-confirm') {
    return { allow: true, kind: 'enable', budget: 'enable' }
  }
  if (method === 'PUT' && pathname === PATH_DISABLE && run.phase === 'B6-disable-confirm') {
    return { allow: true, kind: 'disable', budget: 'disable' }
  }
  if (method === 'PUT' && pathname === PATH_DISABLE && run.phase === 'RECOVERY') {
    return { allow: true, kind: 'recovery-disable', budget: 'recovery' }
  }
  return { allow: false, reason: 'phase-or-budget' }
}

function templatePath(pathname) {
  return pathname.replace(`/api/clients/${ENC}`, '/api/clients/{T02}')
}

async function installGate(context, label) {
  const gate = { label, installedAt: new Date().toISOString(), requests: [] }
  run.gates.push(gate)
  await context.route('**/api/**', async (route) => {
    const req = route.request()
    const method = req.method().toUpperCase()
    const u = new URL(req.url())
    const path = u.pathname
    const d = decide(method, path)
    if (d.allow) {
      if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && path.startsWith('/api/')) {
        // Charge the shared budget synchronously before the request is allowed
        // to leave. A failed reservation is treated exactly like a phase block.
        const reservation = ledger.tryReserve(d.kind, {
          phase: run.phase,
          method,
          path_template: templatePath(path),
          source: 'browser-gate',
        })
        if (!reservation.ok) {
          const blocked = {
            phase: run.phase,
            method,
            path_template: templatePath(path),
            reason: `ledger:${reservation.reason}`,
            kind: d.kind,
            at: Date.now(),
            at_iso: new Date().toISOString(),
          }
          gate.requests.push(blocked)
          run.blocked_non_get.push(blocked)
          return route.abort('blockedbyclient')
        }
        if (d.kind === 'disable') run.disable_outstanding = true
        let stateAtRequest = null
        try {
          const page = req.frame().page()
          stateAtRequest = await page.evaluate(() => {
            const mb = document.querySelector('.el-message-box')
            const overlay = mb ? mb.closest('.el-overlay') : document.querySelector('.el-overlay')
            const ms = mb ? getComputedStyle(mb) : null
            const os = overlay ? getComputedStyle(overlay) : null
            return {
              at: Date.now(),
              messageBoxExists: !!mb,
              messageBoxDisplay: ms ? ms.display : null,
              messageBoxVisibility: ms ? ms.visibility : null,
              overlayExists: !!overlay,
              overlayDisplay: os ? os.display : null,
              overlayVisibility: os ? os.visibility : null,
              active: document.activeElement ? { tag: document.activeElement.tagName, cls: String(document.activeElement.className || ''), text: (document.activeElement.textContent || '').trim().slice(0, 20) } : null,
            }
          }).catch((e) => ({ error: String(e.message || e) }))
        } catch (e) { stateAtRequest = { error: String(e.message || e) } }
        const rec = {
          phase: run.phase,
          method,
          path_template: templatePath(path),
          kind: d.kind,
          at: Date.now(),
          at_iso: new Date().toISOString(),
          state_at_request: stateAtRequest,
          decision: d,
          ledger_seq: reservation.seq,
          ledger_kind: reservation.kind,
          // The gate forwards the request without inspecting its response, so
          // the ledger keeps this attempt as allowed / result-unknown.
          ledger_outcome_at_gate: 'reserved',
        }
        gate.requests.push(rec)
        run.write_attempts.push(rec)
      }
      return route.continue()
    }
    const rec = {
      phase: run.phase,
      method,
      path_template: templatePath(path),
      reason: d.reason,
      at: Date.now(),
      at_iso: new Date().toISOString(),
    }
    gate.requests.push(rec)
    run.blocked_non_get.push(rec)
    return route.abort('blockedbyclient')
  })
}

// ---------------------------------------------------------------- helpers
async function findRowIndex(page) {
  const rows = page.locator('.cc-table .el-table__body tr.el-table__row')
  const n = await rows.count()
  const matches = []
  for (let i = 0; i < n; i++) {
    const t = (await rows.nth(i).locator('.cc-id').innerText().catch(() => '')).trim()
    if (t === ID) matches.push(i)
  }
  if (matches.length !== 1) throw new Error(`STOP: row match count=${matches.length}`)
  return matches[0]
}

function rowL(page) {
  return page.locator('.cc-table .el-table__body tr.el-table__row').filter({
    has: page.locator('.cc-id', { hasText: ID }),
  })
}

async function rowState(page) {
  const idx = await findRowIndex(page)
  const rows = page.locator('.cc-table .el-table__body tr.el-table__row')
  const row = rows.nth(idx)
  return {
    index: idx,
    marker_present: (await row.locator('.cc-inactive-mark').count()) > 0,
    selected: await row.evaluate((el) => el.classList.contains('lt-row-highlight__row')),
    menu_trigger_present: (await row.locator('.cc-more-link').count()) > 0,
    id_exact: (await row.locator('.cc-id').innerText()).trim() === ID,
  }
}

async function waitForRowState(page, pred, timeout = 12000) {
  const t0 = Date.now()
  let last = null
  while (Date.now() - t0 < timeout) {
    try {
      last = await rowState(page)
      if (pred(last)) return last
    } catch (e) { last = { error: String(e.message || e) } }
    await page.waitForTimeout(150)
  }
  throw new Error('STOP: row state wait timeout last=' + JSON.stringify(last))
}

async function styleInfo(locator) {
  return locator.evaluate((el) => {
    const c = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      bg: c.backgroundColor,
      color: c.color,
      borderColor: c.borderColor,
      outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`,
      boxShadow: c.boxShadow,
      classes: String(el.className || ''),
      disabled: el.disabled === true,
      text: (el.textContent || '').trim(),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    }
  })
}

function isBlackFamily(s) {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s || '')
  if (!m) return null
  const [r, g, b] = m.slice(1).map(Number)
  const isBlue = b > 120 && b > r + 40 && b > g + 20
  return { r, g, b, isBlackish: Math.max(r, g, b) <= 90, isBlue }
}

async function openMenuAndClick(page, expectItemText) {
  const row = rowL(page)
  await row.locator('.cc-more-link').click()
  const menu = page.locator('.cc-more-popper:visible, .el-dropdown-menu:visible').first()
  await menu.waitFor({ state: 'visible', timeout: 8000 })
  await page.waitForTimeout(150)
  const items = await menu.locator('.el-dropdown-menu__item').allInnerTexts()
  const cleaned = items.map((x) => x.trim())
  const target = menu.locator('.el-dropdown-menu__item', { hasText: expectItemText }).first()
  await target.click()
  return { menu_items: cleaned, clicked: expectItemText }
}

async function waitDialog(page, cls, timeout = 8000) {
  const dlg = page.locator(`.el-message-box.${cls}`)
  await dlg.waitFor({ state: 'visible', timeout })
  await page.waitForTimeout(120)
  return dlg
}

async function dialogInfo(page, dlg) {
  const title = (await dlg.locator('.el-message-box__title').innerText().catch(() => '')).trim()
  const message = (await dlg.locator('.el-message-box__message').innerText().catch(() => '')).trim()
  const btns = dlg.locator('.el-message-box__btns .el-button')
  const btnTexts = (await btns.allInnerTexts()).map((x) => x.trim())
  const primary = dlg.locator('.el-message-box__btns .el-button--primary')
  const nonPrimary = dlg.locator('.el-message-box__btns .el-button:not(.el-button--primary)')
  return {
    title,
    message,
    message_contains_exact_id: message.includes(ID),
    message_id_occurrences: message.split(ID).length - 1,
    button_texts: btnTexts,
    primary_text: (await primary.innerText().catch(() => '')).trim(),
    primary_count: await primary.count(),
    non_primary_text: (await nonPrimary.first().innerText().catch(() => '')).trim(),
    primary_classes: await primary.getAttribute('class'),
    cancel_classes: await nonPrimary.first().getAttribute('class'),
  }
}

async function installCloseObserver(page) {
  await page.evaluate(() => {
    const visible = () => {
      const mb = document.querySelector('.el-message-box')
      if (!mb) return false
      const ov = mb.closest('.el-overlay')
      const ms = getComputedStyle(mb)
      const os = ov ? getComputedStyle(ov) : null
      if (ms.display === 'none' || ms.visibility === 'hidden') return false
      if (os && (os.display === 'none' || os.visibility === 'hidden')) return false
      return mb.getBoundingClientRect().width > 0
    }
    const rec = { installedAt: Date.now(), installedPerf: performance.now(), firstHiddenAt: null, firstHiddenPerf: null, events: [] }
    window.__t02obs = rec
    const obs = new MutationObserver(() => {
      const v = visible()
      rec.events.push({ t: Date.now(), p: performance.now(), visible: v, mb: !!document.querySelector('.el-message-box') })
      if (!v && rec.firstHiddenAt === null) {
        rec.firstHiddenAt = Date.now()
        rec.firstHiddenPerf = performance.now()
      }
    })
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] })
    rec.disconnect = () => obs.disconnect()
    rec.initialVisible = visible()
  })
}

async function readCloseObserver(page) {
  return page.evaluate(() => {
    const r = window.__t02obs
    if (!r) return null
    try { r.disconnect && r.disconnect() } catch (e) {}
    return {
      installedAt: r.installedAt,
      installedPerf: r.installedPerf,
      initialVisible: r.initialVisible,
      firstHiddenAt: r.firstHiddenAt,
      firstHiddenPerf: r.firstHiddenPerf,
      event_count: r.events.length,
      last_events: r.events.slice(-6),
    }
  })
}

async function observePrimaryStates(page, dlg, cls) {
  const primary = dlg.locator('.el-message-box__btns .el-button--primary')
  const cancel = dlg.locator('.el-message-box__btns .el-button:not(.el-button--primary)').first()
  // MessageBox autofocuses the primary button; move focus off it so the
  // "normal" capture is not the keyboard-focus style.
  await page.keyboard.press('Shift+Tab')
  await page.waitForTimeout(80)
  await page.mouse.move(2, 2)
  await page.waitForTimeout(120)
  const normal = await styleInfo(primary)
  const normalCancel = await styleInfo(cancel)

  await primary.hover()
  await page.waitForTimeout(260)
  const hover = await styleInfo(primary)

  await page.mouse.move(2, 2)
  await page.waitForTimeout(120)
  const box = await primary.boundingBox()
  if (!box) throw new Error('STOP: primary button has no box')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(90)
  const pressed = await styleInfo(primary)
  // release outside the button so no click is produced
  await page.mouse.move(2, 2)
  await page.waitForTimeout(60)
  await page.mouse.up()
  await page.waitForTimeout(150)

  const stillVisible = await dlg.isVisible().catch(() => false)
  const writesBeforeFocus = run.write_attempts.length

  // real keyboard Tab focus: move away, then Shift+Tab followed by Tab loop
  await page.mouse.move(2, 2)
  await page.waitForTimeout(80)
  const focusSeq = []
  const readActive = () => page.evaluate((sel) => {
    const el = document.querySelector(sel)
    const a = document.activeElement
    return {
      isPrimary: !!el && a === el,
      tag: a ? a.tagName : null,
      cls: a ? String(a.className || '') : null,
      text: a ? (a.textContent || '').trim().slice(0, 20) : null,
    }
  }, `.el-message-box.${cls} .el-message-box__btns .el-button--primary`)
  focusSeq.push(await readActive())
  await page.keyboard.press('Shift+Tab')
  await page.waitForTimeout(60)
  focusSeq.push(await readActive())
  let reached = focusSeq[focusSeq.length - 1].isPrimary
  for (let i = 0; i < 6 && !reached; i++) {
    await page.keyboard.press('Tab')
    await page.waitForTimeout(60)
    const a = await readActive()
    focusSeq.push(a)
    reached = a.isPrimary
  }
  const focusStyle = reached ? await styleInfo(primary) : null

  return {
    normal,
    hover,
    pressed,
    focus_via_keyboard_reached: reached,
    focus_sequence: focusSeq,
    focus_style: focusStyle,
    cancel_style: normalCancel,
    dialog_still_visible_after_pressed_release: stillVisible,
    writes_during_observation: run.write_attempts.length - writesBeforeFocus,
    bg_family: {
      normal: isBlackFamily(normal.bg),
      hover: isBlackFamily(hover.bg),
      pressed: isBlackFamily(pressed.bg),
      focus: focusStyle ? isBlackFamily(focusStyle.bg) : null,
    },
    color_white: {
      normal: normal.color,
      hover: hover.color,
      pressed: pressed.color,
      focus: focusStyle ? focusStyle.color : null,
    },
  }
}

// ---------------------------------------------------------------- main
const main = async () => {
  const browser = await chromium.launch({ headless: true })
  run.browser = { engine: 'chromium', version: browser.version(), headless: true }

  // ---- 1920x1080 read-only regression (no menu, no dialog, no write)
  try {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
    await installGate(ctx, 'expanded-1920x1080-readonly')
    const page = await ctx.newPage()
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator('.cc-table .el-table__body tr.el-table__row').first().waitFor({ timeout: 15000 })
    const rs = await rowState(page)
    run.steps.B0_1920 = {
      viewport: '1920x1080',
      rows: await page.locator('.cc-table .el-table__body tr.el-table__row').count(),
      summary: (await page.locator('.cc-result-count').innerText().catch(() => '')).trim(),
      t02_visible: true,
      marker_present: rs.marker_present,
      selected: rs.selected,
      menu_trigger_present: rs.menu_trigger_present,
      id_exact: rs.id_exact,
      writes: run.write_attempts.length,
      blocked_non_get: run.blocked_non_get.length,
    }
    await ctx.close()
  } catch (e) {
    run.steps.B0_1920 = { error: String(e.message || e) }
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await installGate(context, 'primary-1440x900')
  const page = await context.newPage()

  const recordResp = async (resp) => {
    const req = resp.request()
    const u = new URL(resp.url())
    if (!u.pathname.startsWith('/api/')) return
    let body = null
    try {
      if (resp.request().method() !== 'GET') body = await resp.json()
      else { const t = await resp.text(); body = t.slice(0, 200) }
    } catch (e) { body = null }
    run.api_responses.push({
      method: req.method(),
      path_template: templatePath(u.pathname),
      status: resp.status(),
      at: Date.now(),
      at_iso: new Date().toISOString(),
      code: body && typeof body === 'object' ? body.code : null,
      message_len: body && typeof body === 'object' && typeof body.message === 'string' ? body.message.length : null,
    })
  }
  page.on('response', (r) => void recordResp(r))
  page.on('requestfailed', (r) => {
    const u = new URL(r.url())
    if (!u.pathname.startsWith('/api/')) return
    run.request_failures.push({ method: r.method(), path_template: templatePath(u.pathname), at: Date.now(), reason: r.failure()?.errorText || null })
  })

  try {
    // B0
    setPhase('B0')
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator('.cc-table .el-table__body tr.el-table__row').first().waitFor({ timeout: 15000 })
    const filterStatus = await page.locator('.cc-q-status input').inputValue().catch(() => null)
    const filterKeyword = await page.locator('.cc-q-keyword input').inputValue().catch(() => null)
    let rs0 = await rowState(page)
    run.steps.B0 = {
      viewport: '1440x900',
      filter_status_control_value: filterStatus,
      filter_keyword_control_value: filterKeyword,
      rows_initial: await page.locator('.cc-table .el-table__body tr.el-table__row').count(),
      summary_text: (await page.locator('.cc-result-count').innerText().catch(() => '')).trim(),
      t02: rs0,
      initial_selected_count: await page.locator('.lt-row-highlight__row').count(),
      writes: run.write_attempts.length,
      blocked_non_get: run.blocked_non_get.length,
    }
    // establish one fixed selection (local page state only)
    await rowL(page).locator('.cc-seq').click()
    await page.waitForTimeout(320)
    rs0 = await rowState(page)
    run.steps.B0.after_row_click = {
      t02_selected: rs0.selected,
      total_selected: await page.locator('.lt-row-highlight__row').count(),
    }

    // B1 observe enable confirm
    setPhase('B1-enable-observe')
    const menu1 = await openMenuAndClick(page, '启用')
    const dlg1 = await waitDialog(page, 'cc-confirm--enable')
    const info1 = await dialogInfo(page, dlg1)
    const states1 = await observePrimaryStates(page, dlg1, 'cc-confirm--enable')
    run.steps.B1 = {
      menu: menu1,
      dialog: info1,
      states: states1,
      selected_after_observe: (await rowState(page)).selected,
      writes: run.write_attempts.length,
      blocked_non_get: run.blocked_non_get.length,
    }

    // B2 cancel -> zero write
    setPhase('B2-enable-cancel')
    const beforeCancelWrites = run.write_attempts.length
    const beforeCancelState = await rowState(page)
    await dlg1.locator('.el-message-box__btns .el-button:not(.el-button--primary)').first().click()
    await dlg1.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(250)
    const afterCancelState = await rowState(page)
    run.steps.B2 = {
      cancel_clicked: true,
      writes_delta: run.write_attempts.length - beforeCancelWrites,
      blocked_delta: 0,
      state_before: beforeCancelState,
      state_after: afterCancelState,
      marker_still_present: afterCancelState.marker_present,
      selection_unchanged: beforeCancelState.selected === afterCancelState.selected,
      dialog_hidden: !(await dlg1.isVisible().catch(() => false)),
    }

    // B3 confirm enable exactly once
    setPhase('B3-enable-confirm')
    await openMenuAndClick(page, '启用')
    const dlg2 = await waitDialog(page, 'cc-confirm--enable')
    const info2 = await dialogInfo(page, dlg2)
    await installCloseObserver(page)
    const respEnableP = page.waitForResponse((r) => r.request().method() === 'PUT' && new URL(r.url()).pathname === PATH_ENABLE, { timeout: 20000 })
    const reloadP = page.waitForResponse((r) => {
      if (r.request().method() !== 'GET') return false
      const u = new URL(r.url())
      return u.pathname === '/api/clients' && u.searchParams.get('status') === 'ALL'
    }, { timeout: 20000 })
    await dlg2.locator('.el-message-box__btns .el-button--primary').click()
    const clickAt = Date.now()
    const respEnable = await respEnableP
    if (respEnable.status() === 200) run.enable_committed = true
    const reloadResp = await reloadP
    await page.waitForTimeout(300)
    const closeObs = await readCloseObserver(page)
    const st3 = await waitForRowState(page, (s) => s.id_exact && s.marker_present === false)
    const writesAfter3 = run.write_attempts.filter((w) => w.phase === 'B3-enable-confirm')
    const enableStateAtReq = writesAfter3[0]?.state_at_request || null
    run.steps.B3 = {
      dialog_before_confirm: info2,
      click_at: clickAt,
      confirm_response_status: respEnable.status(),
      reload_response_status: reloadResp.status(),
      close_observer: closeObs,
      close_before_request: closeObs && closeObs.firstHiddenAt !== null && closeObs.firstHiddenAt <= (writesAfter3[0]?.at ?? Infinity),
      dialog_state_at_request: enableStateAtReq,
      enable_write_attempts_in_phase: writesAfter3.length,
      enable_write_attempts_total: run.write_attempts.filter((w) => w.kind === 'enable').length,
      t02_after_reload: st3,
      busy_menu_observable: false,
      busy_menu_manufactured: false,
      writes: run.write_attempts.length,
      blocked_non_get: run.blocked_non_get.length,
    }
    if (!(st3.marker_present === false && st3.id_exact)) throw new Error('STOP: T02 not in enabled display state after reload')

    // B4 GET compare to pre-image (only fgActive/status-derived may change)
    setPhase('B4-verify-enabled')
    const cur4 = await captureCurrent()
    writeFileSync('/root/cdc-controlled-toggle-readiness-001/post-enable-T02.json', JSON.stringify(cur4, null, 2))
    chmodSync('/root/cdc-controlled-toggle-readiness-001/post-enable-T02.json', 0o600)
    const diff4 = compareRows(preimage, cur4.row)
    run.steps.B4 = { http: cur4.http, code: cur4.code, diff_fields: diff4.diff_fields, allowed_diff: diff4.allowed, forbidden_diff: diff4.forbidden, fg_active: cur4.row.fgActive, status: cur4.row.status }

    // B5 disable: observe + cancel
    setPhase('B5-disable-observe-cancel')
    let st5 = await rowState(page)
    if (!st5.selected) { await rowL(page).locator('.cc-seq').click(); await page.waitForTimeout(320); st5 = await rowState(page) }
    const menu5 = await openMenuAndClick(page, '停用')
    const dlg5 = await waitDialog(page, 'cc-confirm--disable')
    const info5 = await dialogInfo(page, dlg5)
    const states5 = await observePrimaryStates(page, dlg5, 'cc-confirm--disable')
    const beforeCancel5 = await rowState(page)
    const writesBeforeCancel5 = run.write_attempts.length
    await dlg5.locator('.el-message-box__btns .el-button:not(.el-button--primary)').first().click()
    await dlg5.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(250)
    const afterCancel5 = await rowState(page)
    run.steps.B5 = {
      menu: menu5,
      dialog: info5,
      states: states5,
      cancel: {
        writes_delta: run.write_attempts.length - writesBeforeCancel5,
        state_before: beforeCancel5,
        state_after: afterCancel5,
        marker_still_absent: afterCancel5.marker_present === false,
        selection_unchanged: beforeCancel5.selected === afterCancel5.selected,
        dialog_hidden: !(await dlg5.isVisible().catch(() => false)),
      },
      writes: run.write_attempts.length,
      blocked_non_get: run.blocked_non_get.length,
    }

    // B6 disable confirm exactly once
    setPhase('B6-disable-confirm')
    await openMenuAndClick(page, '停用')
    const dlg6 = await waitDialog(page, 'cc-confirm--disable')
    const info6 = await dialogInfo(page, dlg6)
    await installCloseObserver(page)
    const respDisableP = page.waitForResponse((r) => r.request().method() === 'PUT' && new URL(r.url()).pathname === PATH_DISABLE, { timeout: 20000 })
    const reloadP6 = page.waitForResponse((r) => {
      if (r.request().method() !== 'GET') return false
      const u = new URL(r.url())
      return u.pathname === '/api/clients' && u.searchParams.get('status') === 'ALL'
    }, { timeout: 20000 })
    await dlg6.locator('.el-message-box__btns .el-button--primary').click()
    const clickAt6 = Date.now()
    const respDisable = await respDisableP
    // The normal disable request has returned, so it is no longer in flight
    // regardless of status (a non-200 still means the request completed).
    run.disable_outstanding = false
    if (respDisable.status() === 200) run.disable_committed = true
    const reloadResp6 = await reloadP6
    await page.waitForTimeout(300)
    const closeObs6 = await readCloseObserver(page)
    const st6 = await waitForRowState(page, (s) => s.id_exact && s.marker_present === true)
    const writesAfter6 = run.write_attempts.filter((w) => w.phase === 'B6-disable-confirm')
    run.steps.B6 = {
      dialog_before_confirm: info6,
      click_at: clickAt6,
      confirm_response_status: respDisable.status(),
      reload_response_status: reloadResp6.status(),
      close_observer: closeObs6,
      close_before_request: closeObs6 && closeObs6.firstHiddenAt !== null && closeObs6.firstHiddenAt <= (writesAfter6[0]?.at ?? Infinity),
      dialog_state_at_request: writesAfter6[0]?.state_at_request || null,
      disable_write_attempts_in_phase: writesAfter6.length,
      disable_write_attempts_total: run.write_attempts.filter((w) => w.kind === 'disable' || w.kind === 'recovery-disable').length,
      t02_after_reload: st6,
      writes: run.write_attempts.length,
      blocked_non_get: run.blocked_non_get.length,
    }
    if (!(st6.marker_present === true && st6.id_exact)) throw new Error('STOP: T02 not in disabled display state after reload')

    // B7 final GET compare to initial pre-image
    setPhase('B7-final-verify')
    const cur7 = await captureCurrent()
    writeFileSync('/root/cdc-controlled-toggle-readiness-001/post-disable-T02.json', JSON.stringify(cur7, null, 2))
    chmodSync('/root/cdc-controlled-toggle-readiness-001/post-disable-T02.json', 0o600)
    const diff7 = compareRows(preimage, cur7.row)
    run.steps.B7 = { http: cur7.http, code: cur7.code, diff_fields: diff7.diff_fields, business_fields_identical: diff7.forbidden.length === 0, fg_active: cur7.row.fgActive, status: cur7.row.status }
  } catch (e) {
    run.fatal = String(e.message || e)
    // Bounded recovery driven by the shared, offline-verified coordinator.
    // Outer guard mirrors the original intent: only when enable was attempted,
    // no disable committed, and fewer than two disable attempts exist.
    try {
      const snap0 = ledger.snapshot()
      const enableAttempted = snap0.counts.enable > 0
      const disableAttempts = snap0.counts.disable + snap0.counts['recovery-disable']
      if (!run.disable_committed && enableAttempted && disableAttempts < 2) {
        const coordinator = createRecoveryCoordinator({
          ledger,
          readSnapshot: async () => {
            let cur
            try {
              cur = await captureCurrent()
            } catch (eR) {
              return { identityOk: false, exact: false, fgActive: null, businessDrift: [], error: String(eR.message || eR) }
            }
            const d = compareRows(preimage, cur.row)
            return { identityOk: true, exact: true, fgActive: cur.row.fgActive, businessDrift: d.forbidden, raw: cur }
          },
          getPageState: () => readPageState({
            // The page read is the ONLY source of pendingConfirm. If the page or
            // context is gone, evaluate throws and the adapter returns unknown
            // (never false), so recovery stops instead of treating it as safe.
            evaluate: () => page.evaluate(() => {
              const mb = document.querySelector('.el-message-box')
              if (!mb) return false
              const ov = mb.closest('.el-overlay')
              if (!ov) return mb.offsetParent !== null
              const cs = getComputedStyle(ov)
              return cs.display !== 'none' && cs.visibility !== 'hidden'
            }),
            // writeAllowed/inFlight come from the shared ledger and the real
            // request lifecycle, not a fixed literal.
            lifecycle: () => {
              const snap = ledger.snapshot()
              const recoveryReserved = snap.entries.some(
                (e) => e.kind === 'recovery-disable' && e.outcome === 'reserved',
              )
              return {
                // A page-gate recovery write was allowed; the gate forwards it
                // without inspecting the response, so its result is unknown.
                writeAllowed: snap.counts['recovery-disable'] > 0,
                // A normal disable allowed but not returned, or a recovery write
                // whose result is still unknown, is genuinely in flight.
                inFlight: run.disable_outstanding === true || recoveryReserved,
              }
            },
          }),
          pageAttempt: async () => {
            setPhase('RECOVERY')
            const before = ledger.snapshot().counts['recovery-disable']
            try {
              await openMenuAndClick(page, '停用')
              const dlgR = await waitDialog(page, 'cc-confirm--disable')
              await dlgR.locator('.el-message-box__btns .el-button--primary').click()
              await page.waitForTimeout(1200)
            } catch (eUi) {
              run.recovery_ui_error = String(eUi.message || eUi)
            }
            const after = ledger.snapshot().counts['recovery-disable']
            // sent means the browser gate actually allowed a recovery write for
            // this attempt, regardless of any later UI error.
            return { sent: after > before, ui_error: run.recovery_ui_error || null }
          },
          apiWrite: async () => {
            const ac = new AbortController()
            const timer = setTimeout(() => ac.abort(), 15000)
            // Record the attempt BEFORE the request leaves, so a timeout,
            // disconnect or parse failure still appears in write_attempts and
            // the summary never under-reports a write as zero.
            const attempt = {
              phase: 'RECOVERY',
              method: 'PUT',
              path_template: '/api/clients/{T02}/disable',
              kind: 'recovery-disable',
              at: Date.now(),
              at_iso: new Date().toISOString(),
              out_of_browser: true,
              status: null,
              code: null,
              outcome: 'pending',
            }
            run.write_attempts.push(attempt)
            let r
            try {
              r = await fetch(API + PATH_DISABLE, { method: 'PUT', signal: ac.signal })
            } catch (eF) {
              attempt.outcome = eF.name === 'AbortError' ? 'timeout' : 'disconnect'
              const err = new Error(String(eF.message || eF))
              err.code = attempt.outcome
              throw err
            } finally {
              clearTimeout(timer)
            }
            attempt.status = r.status
            let j = null
            let parsed = true
            try { j = await r.json() } catch (_) { parsed = false }
            attempt.code = j?.code ?? null
            if (!parsed) {
              attempt.outcome = 'parse-error'
              return { outcome: 'parse-error', status: r.status }
            }
            attempt.outcome = r.ok ? 'success' : 'http-error'
            return { outcome: attempt.outcome, status: r.status, code: j?.code ?? null }
          },
        })

        const rec = await coordinator.recover()
        // Any page-gate recovery write forwarded without response inspection is
        // recorded as unknown, never silently treated as "not written".
        for (const entry of ledger.snapshot().entries) {
          if (entry.kind === 'recovery-disable' && entry.outcome === 'reserved') {
            try {
              ledger.settle({ ok: true, seq: entry.seq }, 'unknown', 'page gate allowed write; outcome inferred from final GET')
            } catch (_) {}
          }
        }
        const snapEnd = ledger.snapshot()
        run.recovery_used = snapEnd.counts['recovery-disable'] > 0 ? 1 : 0
        run.recovery_via = rec.apiSend ? 'api' : (snapEnd.counts['recovery-disable'] > 0 ? 'ui' : null)
        run.steps.recovery_check = {
          action: rec.action,
          reason: rec.reason,
          api_send: rec.apiSend,
          disable_attempts_so_far: disableAttempts,
          disable_outstanding: run.disable_outstanding === true,
          page_state: rec.pageState || null,
          page_attempt: rec.pageAttempt || null,
        }
        run.steps.recovery_result = {
          used: run.recovery_used === 1,
          action: rec.action,
          reason: rec.reason,
          recovered: rec.recovered,
          via: run.recovery_via,
          api_send: rec.apiSend,
          http_outcome: rec.httpOutcome ?? null,
          fg_active_after: rec.final ? rec.final.fgActive : null,
          forbidden_diff_after: rec.final ? rec.final.businessDrift : null,
          limitation: rec.limitation ?? null,
          ledger: rec.ledger || snapEnd,
        }
      }
    } catch (e2) {
      run.recovery_error = String(e2.message || e2)
    }
  } finally {
    try { await context.close() } catch (e) {}
    try { await browser.close() } catch (e) {}
  }
}

function compareRows(pre, cur) {
  const business = ['clientDesc', 'rawDataSourceIds', 'possibleCommaDataSourceIds', 'dataSourceCount', 'rowAnomalies', 'dataSources']
  const stateAllowed = ['fgActive', 'status']
  const forbidden = []
  for (const f of business) {
    if (JSON.stringify(pre[f] ?? null) !== JSON.stringify(cur[f] ?? null)) forbidden.push(f)
  }
  const changed = []
  for (const f of [...business, ...stateAllowed]) {
    if (JSON.stringify(pre[f] ?? null) !== JSON.stringify(cur[f] ?? null)) changed.push(f)
  }
  return {
    diff_fields: changed,
    allowed: changed.filter((f) => stateAllowed.includes(f)),
    forbidden,
  }
}

await main()

// ---- summary / desensitized evidence
run.finishedAt = new Date().toISOString()
const allowByBudget = {
  enable: run.write_attempts.filter((w) => w.kind === 'enable').length,
  disable: run.write_attempts.filter((w) => w.kind === 'disable').length,
  recovery: run.write_attempts.filter((w) => w.kind === 'recovery-disable').length,
}
const summary = {
  task_code: run.task_code,
  started_at: run.startedAt,
  finished_at: run.finishedAt,
  alias: 'T02',
  id_length: run.id_length,
  browser: run.browser || null,
  viewports: { primary: run.viewport_primary, regression: run.viewport_regression },
  gate: {
    contexts: run.gates.map((g) => ({ label: g.label, installed_at: g.installedAt, request_count: g.requests.length })),
    blocked_non_get_count: run.blocked_non_get.length,
    blocked_non_get: run.blocked_non_get,
    write_attempts_count: run.write_attempts.length,
    write_attempts: run.write_attempts.map((w) => ({ phase: w.phase, method: w.method, path_template: w.path_template, kind: w.kind, at_iso: w.at_iso, out_of_browser: !!w.out_of_browser, state_at_request: w.state_at_request })),
    allowed_by_budget: allowByBudget,
    write_ledger: ledger.snapshot(),
    violations: run.violations,
  },
  steps: run.steps,
  fatal: run.fatal,
  recovery: { used: run.recovery_used, via: run.recovery_via || null, ui_error: run.recovery_ui_error || null, result: run.steps.recovery_result || null },
  flags: {
    enable_committed: run.enable_committed,
    disable_committed: run.disable_committed,
    final_fg_active: run.steps.B7?.fg_active ?? run.steps.recovery_result?.fg_active_after ?? null,
  },
}
function sanitize(v) {
  if (typeof v === 'string') return v.split(ENC).join('{T02}').split(ID).join('{T02}')
  if (Array.isArray(v)) return v.map(sanitize)
  if (v && typeof v === 'object') {
    const o = {}
    for (const k of Object.keys(v)) o[k] = sanitize(v[k])
    return o
  }
  return v
}
writeFileSync(ENV_OUT, JSON.stringify(sanitize(summary), null, 2))
writeFileSync(RAW_OUT, JSON.stringify({ summary, raw_id: ID, raw_requests: run.write_attempts, raw_blocked: run.blocked_non_get }, null, 2))
chmodSync(RAW_OUT, 0o600)
console.log(JSON.stringify({
  ok: !run.fatal && run.enable_committed && run.disable_committed,
  fatal: run.fatal,
  write_attempts: run.write_attempts.length,
  allowed_by_budget: allowByBudget,
  blocked_non_get: run.blocked_non_get.length,
  enable_committed: run.enable_committed,
  disable_committed: run.disable_committed,
  final_fg_active: summary.flags.final_fg_active,
  results: ENV_OUT,
}, null, 2))
if (run.fatal) process.exit(3)
