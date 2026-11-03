/**
 * CLIENT-CONFIG-AC022-CONTROLLED-MULTIROW-ACCEPTANCE-001
 *
 * Controlled multi-row observation for CCFG-AC-022 on /config/client.
 * One original authorized test object (report alias T02 / OWNER_TEST_B, resolved
 * from the repo-external readiness mapping) is enabled through the real page menu and
 * secondary confirmation exactly once, observed at 1440x900 and 1920x1080,
 * then disabled through the real page exactly once, and finally re-read via GET.
 *
 * Safety:
 *  - The exact clientId is read from /root/cdc-controlled-toggle-readiness-001/
 *    candidate-map.json (mapping.alias === 'T02'). No other identity source.
 *  - A context-level **\/api\/** gate is installed before the first navigation on
 *    every context. GET/HEAD/OPTIONS pass. The only allowed non-GET requests are
 *    the exact encoded T02 PUT enable/disable paths, in their named phases, and
 *    every allowed attempt is charged to the shared synchronous ledger first.
 *  - Write budget: enable 1, disable 1, recovery-disable 1, total 3. No retry.
 *  - Normal toggles are driven by the real page menu -> secondary confirm with a
 *    single click. No direct-API masquerading.
 *  - Recovery delegates to the reviewed recovery coordinator and fail-closed
 *    page-state adapter (imported, not re-implemented).
 *  - Real ID / pre-image / raw rows stay outside the repository (mode 600). The
 *    committed JSON is sanitized: the ID becomes {T02}, other rows become {ROW}.
 */
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  createWriteLedger,
  createRecoveryCoordinator,
} from '../CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001/recovery-coordinator.mjs'
import { readPageState } from '../CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001/page-state-adapter.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const MAP = '/root/cdc-controlled-toggle-readiness-001/candidate-map.json'
const PRE = '/root/cdc-controlled-toggle-readiness-001/pre-image-T02.json'
const WORK = '/root/cdc-ac022-multirow-001'
const OUT_JSON = join(HERE, 'AC022-multirow-results.json')
const RAW_OUT = join(WORK, 'probe-raw.json')
const ENV_OUT = join(WORK, 'b0-preimage-T02.json')

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

const ledger = createWriteLedger({ enable: 1, disable: 1, recoveryDisable: 1, total: 3 })

const run = {
  task_code: 'CLIENT-CONFIG-AC022-CONTROLLED-MULTIROW-ACCEPTANCE-001',
  startedAt: new Date().toISOString(),
  alias: 'T02',
  id_length: ID.length,
  phase: 'B0',
  write_attempts: [],
  blocked_non_get: [],
  api_responses: [],
  request_failures: [],
  steps: {},
  gates: [],
  fatal: null,
  enable_committed: false,
  disable_committed: false,
  disable_outstanding: false,
  recovery_used: 0,
}

function setPhase(p) { run.phase = p }

function templatePath(pathname) {
  return pathname.replace(`/api/clients/${ENC}`, '/api/clients/{T02}')
}

// ---------------------------------------------------------------- read-only GET
async function getList() {
  const r = await fetch(API + '/api/clients?status=ALL', { signal: AbortSignal.timeout(30000) })
  if (r.status !== 200) throw new Error('STOP: list HTTP ' + r.status)
  const j = await r.json()
  if (j.code !== 200) throw new Error('STOP: list code ' + j.code)
  return j.data
}

async function captureCurrent() {
  const d = await getList()
  const items = d.items || []
  const m = items.filter((x) => x.clientId === ID)
  if (m.length !== 1) throw new Error(`STOP: exact match count=${m.length}`)
  return { http: 200, code: 200, row: m[0], total: items.length }
}

const BUSINESS = ['clientDesc', 'rawDataSourceIds', 'possibleCommaDataSourceIds', 'dataSourceCount', 'rowAnomalies', 'dataSources']
const STATE_ALLOWED = ['fgActive', 'status']
function compareRows(pre, cur) {
  const forbidden = BUSINESS.filter((f) => JSON.stringify(pre[f] ?? null) !== JSON.stringify(cur[f] ?? null))
  const changed = [...BUSINESS, ...STATE_ALLOWED].filter((f) => JSON.stringify(pre[f] ?? null) !== JSON.stringify(cur[f] ?? null))
  return { diff_fields: changed, allowed: changed.filter((f) => STATE_ALLOWED.includes(f)), forbidden }
}

// ---------------------------------------------------------------- gate
function decide(method, pathname) {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return { allow: true, reason: 'read-only' }
  if (!pathname.startsWith('/api/')) return { allow: true, reason: 'non-api' }
  if (method === 'PUT' && pathname === PATH_ENABLE && run.phase === 'ENABLE_CONFIRM') return { allow: true, kind: 'enable' }
  if (method === 'PUT' && pathname === PATH_DISABLE && run.phase === 'DISABLE_CONFIRM') return { allow: true, kind: 'disable' }
  if (method === 'PUT' && pathname === PATH_DISABLE && run.phase === 'RECOVERY') return { allow: true, kind: 'recovery-disable' }
  return { allow: false, reason: 'phase-or-method' }
}

async function installGate(context, label) {
  const gate = { label, installedAt: new Date().toISOString(), requests: [] }
  run.gates.push(gate)
  await context.route('**/api/**', async (route) => {
    const req = route.request()
    const method = req.method().toUpperCase()
    const path = new URL(req.url()).pathname
    const d = decide(method, path)
    if (d.allow) {
      if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && path.startsWith('/api/')) {
        const reservation = ledger.tryReserve(d.kind, {
          phase: run.phase, method, path_template: templatePath(path), source: 'browser-gate', label,
        })
        if (!reservation.ok) {
          const blocked = { phase: run.phase, method, path_template: templatePath(path), reason: `ledger:${reservation.reason}`, kind: d.kind, at_iso: new Date().toISOString() }
          gate.requests.push(blocked)
          run.blocked_non_get.push(blocked)
          return route.abort('blockedbyclient')
        }
        if (d.kind === 'disable') run.disable_outstanding = true
        const rec = {
          phase: run.phase, method, path_template: templatePath(path), kind: d.kind,
          at: Date.now(), at_iso: new Date().toISOString(),
          ledger_seq: reservation.seq, ledger_kind: reservation.kind,
          ledger_outcome_at_gate: 'reserved', gate: label,
        }
        gate.requests.push(rec)
        run.write_attempts.push(rec)
      }
      return route.continue()
    }
    const rec = { phase: run.phase, method, path_template: templatePath(path), reason: d.reason, at_iso: new Date().toISOString(), gate: label }
    gate.requests.push(rec)
    run.blocked_non_get.push(rec)
    return route.abort('blockedbyclient')
  })
}

// ---------------------------------------------------------------- UI helpers
const ROW = '.cc-table .el-table__body tr.el-table__row'
function rowsL(page) { return page.locator(ROW) }
async function rowIdAt(page, i) { return (await rowsL(page).nth(i).locator('.cc-id').innerText().catch(() => '')).trim() }
async function findIndexById(page, id) {
  const n = await rowsL(page).count()
  const hits = []
  for (let i = 0; i < n; i++) if ((await rowIdAt(page, i)) === id) hits.push(i)
  if (hits.length !== 1) throw new Error(`STOP: row match count=${hits.length}`)
  return hits[0]
}
async function markerAt(page, i) { return (await rowsL(page).nth(i).locator('.cc-inactive-mark').count()) > 0 }
async function waitMarker(page, i, want, timeout = 15000) {
  const t0 = Date.now()
  let last = null
  while (Date.now() - t0 < timeout) {
    try { last = await markerAt(page, i); if (last === want) return last } catch (e) { last = 'ERR:' + (e.message || e) }
    await page.waitForTimeout(150)
  }
  throw new Error(`STOP: marker wait timeout want=${want} last=${last}`)
}

async function openMenu(page, i) {
  await rowsL(page).nth(i).locator('.cc-more-link').click()
  const menu = page.locator('.cc-more-popper:visible, .el-dropdown-menu:visible').first()
  await menu.waitFor({ state: 'visible', timeout: 8000 })
  await page.waitForTimeout(150)
  const items = (await menu.locator('.el-dropdown-menu__item').allInnerTexts()).map((x) => x.trim())
  return { menu, items }
}
async function closeMenu(page) {
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(180)
}

async function waitDialog(page, cls, timeout = 8000) {
  const dlg = page.locator(`.el-message-box.${cls}`)
  await dlg.waitFor({ state: 'visible', timeout })
  await page.waitForTimeout(120)
  return dlg
}
async function dialogInfo(dlg) {
  const title = (await dlg.locator('.el-message-box__title').innerText().catch(() => '')).trim()
  const message = (await dlg.locator('.el-message-box__message').innerText().catch(() => '')).trim()
  const btns = dlg.locator('.el-message-box__btns .el-button')
  const texts = (await btns.allInnerTexts()).map((x) => x.trim())
  const primary = dlg.locator('.el-message-box__btns .el-button--primary')
  return {
    title,
    message_contains_exact_id: message.includes(ID),
    message_id_occurrences: ID ? message.split(ID).length - 1 : 0,
    button_texts: texts,
    primary_text: (await primary.innerText().catch(() => '')).trim(),
    primary_count: await primary.count(),
  }
}

// Open menu -> click action item -> confirm dialog -> cancel. Must produce 0 write.
async function observeCancel(page, i, actionText, cls) {
  const before = run.write_attempts.length
  const menu = await openMenu(page, i)
  if (!menu.items.includes(actionText)) throw new Error(`STOP: menu lacks ${actionText}: ${menu.items.join(',')}`)
  await menu.menu.locator('.el-dropdown-menu__item', { hasText: actionText }).first().click()
  const dlg = await waitDialog(page, cls)
  const info = await dialogInfo(dlg)
  await dlg.locator('.el-message-box__btns .el-button:not(.el-button--primary)').first().click()
  await dlg.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(220)
  return {
    row_index: i,
    menu_items: menu.items,
    dialog: info,
    writes_delta: run.write_attempts.length - before,
    dialog_hidden: !(await dlg.isVisible().catch(() => false)),
  }
}

// Open menu -> click action -> confirm dialog -> single primary click -> wait PUT + reload.
async function confirmToggle(page, i, actionText, cls, putPath, wantMarker) {
  const menu = await openMenu(page, i)
  if (!menu.items.includes(actionText)) throw new Error(`STOP: menu lacks ${actionText}: ${menu.items.join(',')}`)
  await menu.menu.locator('.el-dropdown-menu__item', { hasText: actionText }).first().click()
  const dlg = await waitDialog(page, cls)
  const info = await dialogInfo(dlg)
  const putP = page.waitForResponse((r) => r.request().method() === 'PUT' && new URL(r.url()).pathname === putPath, { timeout: 20000 })
  const reloadP = page.waitForResponse((r) => {
    if (r.request().method() !== 'GET') return false
    const u = new URL(r.url())
    return u.pathname === '/api/clients' && u.searchParams.get('status') === 'ALL'
  }, { timeout: 20000 })
  await dlg.locator('.el-message-box__btns .el-button--primary').click()
  const putResp = await putP
  const reloadResp = await reloadP
  await page.waitForTimeout(300)
  // The list can re-order after reload; re-anchor on the exact clientId.
  const idx2 = await findIndexById(page, ID)
  const marker = await waitMarker(page, idx2, wantMarker)
  return {
    row_index: idx2,
    menu_items: menu.items,
    dialog: info,
    put_status: putResp.status(),
    reload_status: reloadResp.status(),
    marker_after: marker,
  }
}

async function inventory(page) {
  const rows = rowsL(page)
  const n = await rows.count()
  const ids = []
  const markers = []
  for (let i = 0; i < n; i++) { ids.push(await rowIdAt(page, i)); markers.push(await markerAt(page, i)) }
  return { total: n, ids, markers }
}

async function tableFacts(page) {
  const headers = (await page.locator('.cc-table .el-table__header th').allInnerTexts()).map((x) => x.trim())
  const hasStatusColumn = headers.some((h) => h === '状态' || h.includes('状态'))
  const lastHeader = headers[headers.length - 1]
  const actionStyle = await page.locator('.cc-table td.lt-row-action__cell').first().evaluate((el) => {
    const c = getComputedStyle(el)
    return { position: c.position, right: c.right }
  }).catch(() => null)
  const wrap = page.locator('.cc-table .el-table__body-wrapper').first()
  const overflow = await wrap.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth })).catch(() => null)
  // inline toggle text: any action cell whose visible text (excluding icon) names 启用/停用
  const inlineTexts = []
  const rows = rowsL(page)
  const n = await rows.count()
  for (let i = 0; i < n; i++) {
    const t = (await rows.nth(i).locator('.lt-row-action__cell').innerText().catch(() => '')).trim()
    inlineTexts.push(t)
  }
  return {
    headers,
    has_status_column: hasStatusColumn,
    rightmost_header: lastHeader || null,
    action_cell_style: actionStyle,
    horizontal_overflow: overflow,
    inline_action_texts_nonempty: inlineTexts.filter((t) => t.length > 0).length,
    inline_toggle_count: inlineTexts.filter((t) => t === '启用' || t === '停用').length,
  }
}

// ---------------------------------------------------------------- main
const main = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'],
  })
  run.browser = { engine: 'chromium', version: browser.version(), headless: true }

  // B0 pre-image (read-only GET), saved outside the repository, mode 600.
  const b0 = await captureCurrent()
  writeFileSync(ENV_OUT, JSON.stringify(b0, null, 2))
  chmodSync(ENV_OUT, 0o600)
  const b0List = await getList()
  const hist0 = { exact_0: 0, exact_1: 0, other: 0 }
  for (const it of b0List.items || []) {
    if (it.fgActive === '0') hist0.exact_0++
    else if (it.fgActive === '1') hist0.exact_1++
    else hist0.other++
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await installGate(context, 'primary-1440x900')
  const page = await context.newPage()
  page.on('response', async (resp) => {
    const u = new URL(resp.url())
    if (!u.pathname.startsWith('/api/')) return
    if (resp.request().method() === 'GET') return
    let code = null
    try { const j = await resp.json(); code = j && typeof j === 'object' ? j.code : null } catch (e) {}
    run.api_responses.push({ method: resp.request().method(), path_template: templatePath(u.pathname), status: resp.status(), code, at_iso: new Date().toISOString() })
  })
  page.on('requestfailed', (r) => {
    const u = new URL(r.url())
    if (!u.pathname.startsWith('/api/')) return
    run.request_failures.push({ method: r.method(), path_template: templatePath(u.pathname), reason: (r.failure() && r.failure().errorText) || null })
  })

  try {
    // ---- B0: load at 1440x900
    setPhase('B0')
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator(ROW).first().waitFor({ timeout: 15000 })
    let t02Index = await findIndexById(page, ID)
    const inv0 = await inventory(page)
    run.steps.B0 = {
      viewport: '1440x900',
      get_total: b0.total,
      get_fg_histogram: hist0,
      t02: { row_index: t02Index, marker_present: inv0.markers[t02Index], fg_active: b0.row.fgActive, status: b0.row.status, data_source_count: b0.row.dataSourceCount },
      ui_row_count: inv0.total,
      ui_disabled_marked: inv0.markers.filter(Boolean).length,
      ui_enabled_unmarked: inv0.markers.filter((m) => !m).length,
      table: await tableFacts(page),
      writes: run.write_attempts.length,
      blocked_non_get: run.blocked_non_get.length,
    }

    // ---- B1: pre-enable multi-disabled menu + confirm-cancel (0 write)
    setPhase('B1')
    const disabledIdx = []
    for (let i = 0; i < inv0.markers.length && disabledIdx.length < 3; i++) if (inv0.markers[i]) disabledIdx.push(i)
    if (disabledIdx.length < 2) throw new Error('STOP: fewer than 2 disabled rows pre-enable')
    const b1 = []
    for (const idx of disabledIdx.slice(0, 2)) b1.push(await observeCancel(page, idx, '启用', 'cc-confirm--enable'))
    run.steps.B1_pre_enable_cancel = { observations: b1, writes_total: run.write_attempts.length }

    // ---- B2: enable T02 exactly once through the real page
    setPhase('ENABLE_CONFIRM')
    const enableRes = await confirmToggle(page, t02Index, '启用', 'cc-confirm--enable', PATH_ENABLE, false)
    if (enableRes.put_status === 200) run.enable_committed = true
    t02Index = enableRes.row_index
    if (!(enableRes.marker_after === false)) throw new Error('STOP: T02 marker still present after enable reload')
    const enableWrites = run.write_attempts.filter((w) => w.phase === 'ENABLE_CONFIRM')
    run.steps.B2_enable = { ...enableRes, phase_write_attempts: enableWrites.length }

    // ---- B3: post-enable multi-row observation at 1440x900
    setPhase('POST_ENABLE_1440')
    const listPost = await getList()
    const fgMap = new Map((listPost.items || []).map((x) => [x.clientId, String(x.fgActive)]))
    const inv1 = await inventory(page)
    let mismatch = 0
    const enabledIdx = []
    const disabledIdxPost = []
    for (let i = 0; i < inv1.total; i++) {
      const expectedDisabled = fgMap.get(inv1.ids[i]) === '0'
      if (inv1.markers[i] !== expectedDisabled) mismatch++
      if (inv1.markers[i]) disabledIdxPost.push(i); else enabledIdx.push(i)
    }
    const hist1 = { exact_0: 0, exact_1: 0, other: 0 }
    for (const it of listPost.items || []) {
      if (it.fgActive === '0') hist1.exact_0++
      else if (it.fgActive === '1') hist1.exact_1++
      else hist1.other++
    }
    // menu sampling: multiple enabled + multiple disabled
    const menuEnabled = []
    for (const idx of enabledIdx.slice(0, 2)) {
      const m = await openMenu(page, idx)
      menuEnabled.push({ row_index: idx, items: m.items, is_t02: inv1.ids[idx] === ID })
      await closeMenu(page)
    }
    const menuDisabled = []
    for (const idx of disabledIdxPost.slice(0, 2)) {
      const m = await openMenu(page, idx)
      menuDisabled.push({ row_index: idx, items: m.items })
      await closeMenu(page)
    }
    // confirm+cancel on multiple disabled rows post-enable (0 write)
    const cancels = []
    for (const idx of disabledIdxPost.slice(0, 2)) cancels.push(await observeCancel(page, idx, '启用', 'cc-confirm--enable'))
    // also verify enabled row's 停用 confirm cancel (0 write) on T02
    const cancelEnabled = await observeCancel(page, t02Index, '停用', 'cc-confirm--disable')
    // verified re-read: T02 still enabled after those cancels
    const stillEnabled = !(await markerAt(page, t02Index))
    run.steps.B3_post_enable_1440 = {
      viewport: '1440x900',
      get_total: listPost.total,
      get_fg_histogram: hist1,
      ui_enabled_rows: enabledIdx.length,
      ui_disabled_rows: disabledIdxPost.length,
      marker_vs_get_mismatches: mismatch,
      t02_row_index: t02Index,
      t02_is_enabled: stillEnabled,
      enabled_aliases_sample: enabledIdx.slice(0, 3).map((i) => `row#${i}`),
      disabled_aliases_sample: disabledIdxPost.slice(0, 3).map((i) => `row#${i}`),
      table: await tableFacts(page),
      menus_enabled: menuEnabled,
      menus_disabled: menuDisabled,
      disabled_cancel_cycles: cancels,
      enabled_disable_cancel: cancelEnabled,
      writes_total: run.write_attempts.length,
      blocked_non_get: run.blocked_non_get.length,
    }

    // ---- B4: GET business fields still identical to pre-image (only state changed)
    setPhase('POST_ENABLE_GET')
    const cur4 = await captureCurrent()
    const diff4 = compareRows(preimage, cur4.row)
    run.steps.B4_post_enable_diff = {
      http: cur4.http, code: cur4.code, total: cur4.total,
      fg_active: cur4.row.fgActive, status: cur4.row.status,
      diff_fields: diff4.diff_fields, allowed: diff4.allowed, forbidden: diff4.forbidden,
      business_identical: diff4.forbidden.length === 0,
    }

    // ---- B5: 1920x1080 read-only multi-row check (gate blocks any write here)
    setPhase('READONLY_1920')
    const ctx1920 = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
    await installGate(ctx1920, 'expanded-1920x1080-readonly')
    const p1920 = await ctx1920.newPage()
    try {
      await p1920.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle', timeout: 30000 })
      await p1920.locator(ROW).first().waitFor({ timeout: 15000 })
      const inv2 = await inventory(p1920)
      let mismatch2 = 0
      const en2 = []
      const dis2 = []
      for (let i = 0; i < inv2.total; i++) {
        const expectedDisabled = fgMap.get(inv2.ids[i]) === '0'
        if (inv2.markers[i] !== expectedDisabled) mismatch2++
        if (inv2.markers[i]) dis2.push(i); else en2.push(i)
      }
      const t02i2 = await findIndexById(p1920, ID)
      const mEn = []
      for (const idx of en2.slice(0, 2)) { const m = await openMenu(p1920, idx); mEn.push({ row_index: idx, items: m.items, is_t02: inv2.ids[idx] === ID }); await closeMenu(p1920) }
      const mDis = []
      for (const idx of dis2.slice(0, 2)) { const m = await openMenu(p1920, idx); mDis.push({ row_index: idx, items: m.items }); await closeMenu(p1920) }
      const cancel1920 = await observeCancel(p1920, dis2[0], '启用', 'cc-confirm--enable')
      run.steps.B5_readonly_1920 = {
        viewport: '1920x1080',
        ui_enabled_rows: en2.length,
        ui_disabled_rows: dis2.length,
        marker_vs_get_mismatches: mismatch2,
        t02_row_index: t02i2,
        t02_is_enabled: !inv2.markers[t02i2],
        enabled_aliases_sample: en2.slice(0, 3).map((i) => `row#${i}`),
        disabled_aliases_sample: dis2.slice(0, 3).map((i) => `row#${i}`),
        table: await tableFacts(p1920),
        menus_enabled: mEn,
        menus_disabled: mDis,
        disabled_cancel_cycle: cancel1920,
        writes_total: run.write_attempts.length,
      }
    } finally {
      await ctx1920.close().catch(() => {})
    }

    // ---- B6: disable T02 exactly once through the real page
    setPhase('DISABLE_CONFIRM')
    const idxB6 = await findIndexById(page, ID)
    if (await markerAt(page, idxB6)) throw new Error('STOP: T02 already disabled before B6')
    const disableRes = await confirmToggle(page, idxB6, '停用', 'cc-confirm--disable', PATH_DISABLE, true)
    run.disable_outstanding = false
    if (disableRes.put_status === 200) run.disable_committed = true
    if (!(disableRes.marker_after === true)) throw new Error('STOP: T02 marker not restored after disable')
    const disableWrites = run.write_attempts.filter((w) => w.phase === 'DISABLE_CONFIRM')
    run.steps.B6_disable = { ...disableRes, phase_write_attempts: disableWrites.length }

    // ---- B7: final GET restore verification
    setPhase('FINAL_GET')
    const cur7 = await captureCurrent()
    const diff7 = compareRows(preimage, cur7.row)
    run.steps.B7_final = {
      http: cur7.http, code: cur7.code, total: cur7.total,
      fg_active: cur7.row.fgActive, status: cur7.row.status,
      diff_fields: diff7.diff_fields, allowed: diff7.allowed, forbidden: diff7.forbidden,
      business_identical: diff7.forbidden.length === 0,
      restored: cur7.row.fgActive === '0' && diff7.forbidden.length === 0,
    }
    const finalIdx = await findIndexById(page, ID)
    const finalInv = await inventory(page)
    run.steps.B7_final.ui_marker_restored = finalInv.markers[finalIdx]
  } catch (e) {
    run.fatal = String((e && e.message) || e)
    // Bounded recovery via the reviewed coordinator + fail-closed adapter.
    try {
      const snap0 = ledger.snapshot()
      const enableAttempted = snap0.counts.enable > 0
      const disableAttempts = snap0.counts.disable + snap0.counts['recovery-disable']
      if (!run.disable_committed && enableAttempted && disableAttempts < 2) {
        const coordinator = createRecoveryCoordinator({
          ledger,
          readSnapshot: async () => {
            let cur
            try { cur = await captureCurrent() } catch (eR) {
              return { identityOk: false, exact: false, fgActive: null, businessDrift: [], error: String(eR.message || eR) }
            }
            const d = compareRows(preimage, cur.row)
            return { identityOk: true, exact: true, fgActive: cur.row.fgActive, businessDrift: d.forbidden, raw: cur }
          },
          getPageState: () => readPageState({
            evaluate: () => page.evaluate(() => {
              const mb = document.querySelector('.el-message-box')
              if (!mb) return false
              const ov = mb.closest('.el-overlay')
              if (!ov) return mb.offsetParent !== null
              const cs = getComputedStyle(ov)
              return cs.display !== 'none' && cs.visibility !== 'hidden'
            }),
            lifecycle: () => {
              const snap = ledger.snapshot()
              const recoveryReserved = snap.entries.some((e) => e.kind === 'recovery-disable' && e.outcome === 'reserved')
              return {
                writeAllowed: snap.counts['recovery-disable'] > 0,
                inFlight: run.disable_outstanding === true || recoveryReserved,
              }
            },
          }),
          pageAttempt: async () => {
            setPhase('RECOVERY')
            const before = ledger.snapshot().counts['recovery-disable']
            try {
              const idx = await findIndexById(page, ID)
              const menu = await openMenu(page, idx)
              if (menu.items.includes('停用')) {
                await menu.menu.locator('.el-dropdown-menu__item', { hasText: '停用' }).first().click()
                const dlgR = await waitDialog(page, 'cc-confirm--disable')
                await dlgR.locator('.el-message-box__btns .el-button--primary').click()
                await page.waitForTimeout(1200)
              }
            } catch (eUi) {
              run.recovery_ui_error = String(eUi.message || eUi)
            }
            const after = ledger.snapshot().counts['recovery-disable']
            return { sent: after > before, ui_error: run.recovery_ui_error || null }
          },
          apiWrite: async () => {
            const ac = new AbortController()
            const timer = setTimeout(() => ac.abort(), 15000)
            const attempt = { phase: 'RECOVERY', method: 'PUT', path_template: '/api/clients/{T02}/disable', kind: 'recovery-disable', at_iso: new Date().toISOString(), out_of_browser: true, status: null, code: null, outcome: 'pending' }
            run.write_attempts.push(attempt)
            let r
            try { r = await fetch(API + PATH_DISABLE, { method: 'PUT', signal: ac.signal }) } catch (eF) {
              attempt.outcome = eF.name === 'AbortError' ? 'timeout' : 'disconnect'
              const err = new Error(String(eF.message || eF)); err.code = attempt.outcome; throw err
            } finally { clearTimeout(timer) }
            attempt.status = r.status
            let j = null, parsed = true
            try { j = await r.json() } catch (_) { parsed = false }
            attempt.code = j?.code ?? null
            if (!parsed) { attempt.outcome = 'parse-error'; return { outcome: 'parse-error', status: r.status } }
            attempt.outcome = r.ok ? 'success' : 'http-error'
            return { outcome: attempt.outcome, status: r.status, code: j?.code ?? null }
          },
        })
        const rec = await coordinator.recover()
        for (const entry of ledger.snapshot().entries) {
          if (entry.kind === 'recovery-disable' && entry.outcome === 'reserved') {
            try { ledger.settle({ ok: true, seq: entry.seq }, 'unknown', 'page gate allowed write; outcome inferred from final GET') } catch (_) {}
          }
        }
        const snapEnd = ledger.snapshot()
        run.recovery_used = snapEnd.counts['recovery-disable'] > 0 ? 1 : 0
        run.steps.recovery = {
          action: rec.action, reason: rec.reason, recovered: rec.recovered, api_send: rec.apiSend,
          via: rec.apiSend ? 'api' : (snapEnd.counts['recovery-disable'] > 0 ? 'ui' : null),
          http_outcome: rec.httpOutcome ?? null,
          fg_active_after: rec.final ? rec.final.fgActive : null,
          business_drift_after: rec.final ? rec.final.businessDrift : null,
          limitation: rec.limitation ?? null,
          ledger: rec.ledger || snapEnd,
        }
      }
    } catch (e2) {
      run.recovery_error = String(e2 && e2.message || e2)
    }
  } finally {
    try { await context.close() } catch (e) {}
    try { await browser.close() } catch (e) {}
  }
}

await main()

run.finishedAt = new Date().toISOString()
const byKind = {
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
  viewports: { primary: '1440x900', regression: '1920x1080' },
  gates: run.gates.map((g) => ({ label: g.label, installed_at: g.installedAt, request_count: g.requests.length })),
  write_attempts_count: run.write_attempts.length,
  write_attempts_by_kind: byKind,
  write_attempts: run.write_attempts.map((w) => ({ phase: w.phase, method: w.method, path_template: w.path_template, kind: w.kind, at_iso: w.at_iso, out_of_browser: !!w.out_of_browser })),
  blocked_non_get_count: run.blocked_non_get.length,
  blocked_non_get: run.blocked_non_get,
  api_responses: run.api_responses,
  request_failures: run.request_failures,
  write_ledger: ledger.snapshot(),
  steps: run.steps,
  fatal: run.fatal,
  recovery_error: run.recovery_error || null,
  recovery_used: run.recovery_used,
  flags: {
    enable_committed: run.enable_committed,
    disable_committed: run.disable_committed,
    final_fg_active: run.steps.B7_final?.fg_active ?? run.steps.recovery?.fg_active_after ?? null,
    restored: run.steps.B7_final?.restored ?? null,
  },
}

// ---- sanitize: no real IDs / descriptions / tokens leave the repo
const allClientIds = new Set([ID])
try {
  const l = await getList()
  for (const it of l.items || []) allClientIds.add(it.clientId)
} catch (e) {}
const allTokens = new Set()
try {
  const l = await getList()
  for (const it of l.items || []) for (const ds of it.dataSources || []) if (ds.dataSourceId) allTokens.add(ds.dataSourceId)
} catch (e) {}
function sanitize(v) {
  if (typeof v === 'string') {
    let s = v.split(ENC).join('{T02}').split(ID).join('{T02}')
    // Only real-length identifiers are replaced; short tokens (e.g. a literal
    // 2-char token) must not corrupt ordinary UI text such as "探针 ID".
    for (const cid of allClientIds) if (cid && cid !== ID && cid.length >= 8) s = s.split(cid).join('{ROW}')
    for (const tk of allTokens) if (tk && tk.length >= 8) s = s.split(tk).join('{DS}')
    if (preimage.clientDesc) s = s.split(preimage.clientDesc).join('{DESC}')
    return s
  }
  if (Array.isArray(v)) return v.map(sanitize)
  if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = sanitize(v[k]); return o }
  return v
}
const safe = sanitize(summary)
writeFileSync(OUT_JSON, JSON.stringify(safe, null, 2) + '\n')
writeFileSync(RAW_OUT, JSON.stringify({ summary, raw_id: ID }, null, 2))
chmodSync(RAW_OUT, 0o600)
console.log(JSON.stringify({
  ok: !run.fatal && run.enable_committed && run.disable_committed && !!(run.steps.B7_final && run.steps.B7_final.restored),
  fatal: run.fatal,
  write_attempts: run.write_attempts.length,
  write_attempts_by_kind: byKind,
  blocked_non_get: run.blocked_non_get.length,
  enable_committed: run.enable_committed,
  disable_committed: run.disable_committed,
  final_fg_active: summary.flags.final_fg_active,
  restored: summary.flags.restored,
  results: OUT_JSON,
}, null, 2))
if (run.fatal) process.exit(3)
