// FORMAL ACCEPTANCE collector for
// DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001.
//
// Drives the REAL Chromium (CDP, no npm dependency) against THIS worktree's Vite dev server on 5173 and the
// REAL Spring Boot backend on 8080. Every recorded state is produced through the page's OWN query controls
// (探针端 / 源库 / 快照状态 selects, 查询, 重置, 立即刷新) — no API is faked, no DB row is written, no CSS is
// forced and no DOM row is fabricated.
//
// The LONG state is the page's real default query (30 records, real vertical overflow). The SHORT state is
// produced by selecting the real client `hosp-012`, whose single row produces NO vertical overflow.
// Only the FAILURE path injects a response, and only at the browser network layer (Fetch.fulfillRequest),
// which is reversible and never reaches the backend or the database.
//
// After collecting, this script calls the SHARED judge (./judge.mjs) and exits non-zero if any assertion
// fails. The negative control (./negative-control.mjs) calls the very same judge.
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { CDP, sleep } from './cdp.mjs'
import { judge, REQUIRED_VIEWPORTS, REQUIRED_STATE_NAMES } from './judge.mjs'

const OUT = process.argv[2] ?? '/tmp/dss-fa-out'
const BASE = process.argv[3] ?? 'http://127.0.0.1:5173'
const LIST = '/api/monitor/data-source-run-state/list'
const OTHER_ROUTES = ['/config/data-source', '/config/client', '/monitor/cdc-node']
const SHORT_CLIENT = 'hosp-012'
const LONG_RECORDS = 30
const SHORT_RECORDS = 1

mkdirSync(OUT, { recursive: true })
mkdirSync(join(OUT, 'screenshots'), { recursive: true })
mkdirSync(join(OUT, 'rects'), { recursive: true })

const VIEWPORTS = REQUIRED_VIEWPORTS.map((v) => v.split('x').map(Number))
const failEnvelope = () => ({ code: 500, message: 'browser-layer-injected-failure', timestamp: '', data: null })

// ------------------------------------------------------------------ in-page measurement (raw, un-rounded)
const MEASURE = `(() => {
  const rc = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, right: b.right, bottom: b.bottom }; };
  const R = (sel) => { const el = document.querySelector(sel); return el ? rc(el) : null; };
  const btnStyle = (sel) => { const el = document.querySelector(sel); if (!el) return null; const s = getComputedStyle(el);
    return { width: s.width, minWidth: s.minWidth, maxWidth: s.maxWidth, flexBasis: s.flexBasis, flexGrow: s.flexGrow, flexShrink: s.flexShrink, boxSizing: s.boxSizing }; };
  const area = document.querySelector('.content-area');
  const realTh = (root) => [...root.querySelectorAll('th')].filter((th) => !th.classList.contains('gutter'));
  const hdrRoot = document.querySelector('.dss-table .el-table__header-wrapper');
  const headers = hdrRoot ? realTh(hdrRoot).map((th) => { const b = th.getBoundingClientRect();
      return { label: ((th.querySelector('.cell') || th).textContent || '').trim(), x: b.x, y: b.y, width: b.width, height: b.height, centerX: b.x + b.width / 2 }; }) : [];
  const firstRow = document.querySelector('.dss-table .el-table__body-wrapper tbody tr');
  const dataCols = firstRow ? [...firstRow.querySelectorAll('td')].filter((td) => !td.classList.contains('gutter'))
      .map((td) => { const b = td.getBoundingClientRect(); return { x: b.x, width: b.width }; }) : [];
  const docEl = document.documentElement;
  const acs = area ? getComputedStyle(area) : null;
  return {
    scroll: area ? { ...rc(area), clientWidth: area.clientWidth, offsetWidth: area.offsetWidth,
        scrollHeight: area.scrollHeight, clientHeight: area.clientHeight,
        scrollbarGutter: acs.scrollbarGutter, overflowY: acs.overflowY,
        hasGutterClass: area.classList.contains('dss-stable-gutter') } : null,
    rect: { pageRoot: R('.dss-page'), resultCard: R('.dss-result-card'), tableWrap: R('.dss-table-wrap'),
        table: R('.dss-table'), queryBar: R('.dss-query-bar'), queryGroup: R('.dss-q-actions'),
        queryBtn: R('.dss-query-btn'), resetBtn: R('.dss-reset-btn'), refreshBtn: R('.dss-refresh-btn') },
    btnStyles: { queryBtn: btnStyle('.dss-query-btn'), resetBtn: btnStyle('.dss-reset-btn'), refreshBtn: btnStyle('.dss-refresh-btn') },
    headers, dataCols,
    rowCount: document.querySelectorAll('.dss-table .el-table__body-wrapper tbody tr').length,
    summaryText: (document.querySelector('.dss-summary-count') || {}).textContent ? document.querySelector('.dss-summary-count').textContent.trim() : null,
    unknownBadgeVisible: !!document.querySelector('.dss-summary-unknown'),
    errorVisible: !!document.querySelector('.dss-result-error, .dss-error-card'),
    loadingMask: !!document.querySelector('.dss-table .el-loading-mask'),
    queryBusy: (document.querySelector('.dss-query-btn') || {}).getAttribute ? document.querySelector('.dss-query-btn').getAttribute('aria-busy') : null,
    doc: { scrollWidth: docEl.scrollWidth, clientWidth: docEl.clientWidth },
  };
})()`

async function main() {
  const cdp = await CDP.attach()
  let mode = 'ok'
  let armed = false
  let gateWaiter = null
  const gates = []
  const pushGate = (id) => { if (gateWaiter) { const w = gateWaiter; gateWaiter = null; w(id) } else gates.push(id) }
  const waitGate = (ms = 10000) => {
    if (gates.length) return Promise.resolve(gates.shift())
    return new Promise((res, rej) => {
      const t = setTimeout(() => { gateWaiter = null; rej(new Error('timed out waiting for intercepted request')) }, ms)
      gateWaiter = (id) => { clearTimeout(t); res(id) }
    })
  }
  const drainGates = () => { gates.length = 0; gateWaiter = null }
  const arm = () => { drainGates(); armed = true }
  const requests = []
  const consoleErrors = []
  const consoleErrorsInjected = []
  let injectionsServed = 0
  const fulfilled = new Set()
  const realResponses = []

  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Network.enable')
  await cdp.send('Log.enable')
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/monitor/*', requestStage: 'Request' }] })

  cdp.on('Network.requestWillBeSent', (p) => requests.push({ method: p.request.method, url: p.request.url, type: p.type }))
  cdp.on('Network.responseReceived', async (p) => {
    if (fulfilled.has(p.requestId)) return
    if (!p.response.url.includes(LIST)) return
    let records = null
    try {
      const body = await cdp.send('Network.getResponseBody', { requestId: p.requestId })
      const txt = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body
      records = (JSON.parse(txt)?.data?.records ?? []).length
    } catch { /* body may be evicted; DOM row count covers it */ }
    realResponses.push({ status: p.response.status, url: p.response.url, records })
  })
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error' || p.type === 'assert') consoleErrors.push(`console.${p.type}: ${p.args.map((a) => a.value ?? a.description ?? a.type).join(' ')}`)
  })
  cdp.on('Runtime.exceptionThrown', (p) => consoleErrors.push(`exception: ${p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text ?? ''}`))
  // Network-level Log entries carry the failing URL, so a "Failed to load resource ... 500" raised by OUR OWN
  // deliberate browser-layer injection can be attributed precisely instead of silently ignored. It is only
  // attributable when that URL is the list endpoint AND an injection has actually been served; the real list
  // responses are separately asserted to be all-200, so a genuine list 500 could never be excused this way.
  cdp.on('Log.entryAdded', (p) => {
    if (p.entry?.level !== 'error') return
    const url = p.entry.url || ''
    const text = `log.${p.entry.source}: ${p.entry.text}${url ? ` @ ${url}` : ''}`
    if (url.includes(LIST) && injectionsServed > 0) consoleErrorsInjected.push(text)
    else consoleErrors.push(text)
  })

  const cont = async (requestId) => {
    try { await cdp.send('Fetch.continueRequest', { requestId }) }
    catch (e) { if (!/Invalid InterceptionId/.test(String(e && e.message))) throw e }
  }
  const fulfill = async (paused, obj) => {
    // A request-stage interception issues its OWN interception id; the Network events for the same request
    // carry `networkId`. Mark both, otherwise the injected 500 gets counted as a real backend response.
    fulfilled.add(paused.requestId)
    if (paused.networkId) fulfilled.add(paused.networkId)
    injectionsServed += 1
    await cdp.send('Fetch.fulfillRequest', {
      requestId: paused.requestId, responseCode: 500,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
      body: Buffer.from(JSON.stringify(obj), 'utf8').toString('base64'),
    })
  }
  cdp.on('Fetch.requestPaused', async (p) => {
    if (!p.request.url.includes(LIST)) { await cont(p.requestId); return }
    if (armed && mode === 'delay') { pushGate(p.requestId); return }
    if (armed && mode === 'fail') { await fulfill(p, failEnvelope()); return }
    await cont(p.requestId)
  })

  const evalJs = (expr) => cdp.evaluate(expr)
  const waitFor = async (expr, ms = 8000, label = expr) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) { if (await evalJs(expr)) return true; await sleep(60) }
    throw new Error(`waitFor timeout: ${label}`)
  }
  const listGets = () => requests.filter((r) => r.url.includes(LIST) && r.method === 'GET').length
  const click = (sel) => evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) throw new Error('missing ${sel}'); b.click(); return true; })()`)
  const waitRows = async (n, ms = 15000) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) {
      const r = await evalJs(`(() => ({ rows: document.querySelectorAll('.dss-table .el-table__body-wrapper tbody tr').length, busy: (document.querySelector('.dss-query-btn')||{}).getAttribute ? document.querySelector('.dss-query-btn').getAttribute('aria-busy') : null }))()`)
      if (r.rows === n && r.busy === null) return true
      await sleep(80)
    }
    throw new Error(`waitRows timeout for ${n}`)
  }
  const shot = async (name) => {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(OUT, 'screenshots', `${name}.png`), Buffer.from(r.data, 'base64'))
  }
  const selectClient = async (id) => {
    await evalJs(`(() => { const w = document.querySelector('.dss-client-select'); const t = w.querySelector('.el-select__wrapper') || w;
      t.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); t.click(); return true; })()`)
    await sleep(350)
    const picked = await evalJs(`(() => {
      const items = [...document.querySelectorAll('.dss-client-popper .el-select-dropdown__item')].filter((e) => e.offsetParent !== null);
      const el = items.find((e) => e.getAttribute('data-dss-client-id') === ${JSON.stringify(id)});
      if (!el) return false; el.click(); return true; })()`)
    if (!picked) throw new Error(`client option not found: ${id}`)
    await evalJs(`(() => { document.body.click(); return true; })()`)
    await sleep(250)
  }

  const version = await cdp.send('Browser.getVersion').catch(() => ({ product: 'unknown' }))
  const matrix = {}

  // ============================================================ PHASE 1: 4 viewports x real long/short/long
  for (const [w, h] of VIEWPORTS) {
    const vp = `${w}x${h}`
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
    const loaded = cdp.once('Page.loadEventFired')
    await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source-state` })
    await loaded
    await waitRows(LONG_RECORDS)
    await sleep(250)

    const states = []
    const measure = async (name) => {
      const m = await evalJs(MEASURE)
      if (!m || !m.scroll) throw new Error(`measurement failed in state ${name}`)
      states.push({ name, scroll: m.scroll, rect: m.rect, btnStyles: m.btnStyles, headers: m.headers, dataCols: m.dataCols,
        rowCount: m.rowCount, summaryText: m.summaryText, unknownBadgeVisible: m.unknownBadgeVisible, doc: m.doc })
      writeFileSync(join(OUT, 'rects', `${vp}-${name}.json`), JSON.stringify(m, null, 2))
      return m
    }

    await measure('LONG_IDLE')
    await shot(`${vp}-LONG_IDLE`)

    // ---- QUERY_LOADING (held at the browser layer, then continued to the REAL backend) ----
    const getsBeforeHeld = listGets()
    arm(); mode = 'delay'
    await click('.dss-query-btn')
    const held = await waitGate()
    await waitFor(`document.querySelector('.dss-query-btn').getAttribute('aria-busy') === 'true'`, 6000, 'query loading')
    await measure('QUERY_LOADING')
    await shot(`${vp}-QUERY_LOADING`)
    // duplicate click while in flight must NOT produce a second GET (single flight)
    await click('.dss-query-btn')
    await sleep(400)
    const duplicateClickGets = listGets() - getsBeforeHeld
    armed = false
    await cont(held)
    await waitRows(LONG_RECORDS)
    await sleep(250)
    await measure('QUERY_SUCCESS')

    // ---- SHORT_IDLE through the real 探针端 control ----
    await selectClient(SHORT_CLIENT)
    await click('.dss-query-btn')
    await waitRows(SHORT_RECORDS)
    await sleep(300)
    await measure('SHORT_IDLE')
    await shot(`${vp}-SHORT_IDLE`)

    // ---- RESTORE_LONG_IDLE: 重置 then 查询 (重置 itself does not query, by design) ----
    await click('.dss-reset-btn')
    await sleep(200)
    await click('.dss-query-btn')
    await waitRows(LONG_RECORDS)
    await sleep(300)
    await measure('RESTORE_LONG_IDLE')
    await shot(`${vp}-RESTORE_LONG_IDLE`)

    // ---- QUERY_FAILURE: old results must be preserved; failure injected at the browser layer ONLY ----
    const rowsBeforeFailure = states[states.length - 1].rowCount
    arm(); mode = 'fail'
    await click('.dss-query-btn')
    await sleep(600)
    await waitRows(LONG_RECORDS)
    await sleep(300)
    const failState = await measure('QUERY_FAILURE')
    await shot(`${vp}-QUERY_FAILURE`)
    mode = 'ok'; armed = false
    const successPreservedOldApplied = failState.rowCount === rowsBeforeFailure && failState.rowCount === LONG_RECORDS

    matrix[vp] = { viewport: vp, width: w, height: h, states, duplicateClickGets, successPreservedOldApplied,
      conditions: { long_client: 'ALL', long_sources: 'ALL', long_statuses: 'ALL', short_client: SHORT_CLIENT } }
    console.log(`[viewport ${vp}] states=${states.length} longRows=${states[0].rowCount} shortRows=${states[3].rowCount} dupGets=${duplicateClickGets}`)
  }

  // ============================================================ PHASE 2: other-route leak check
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
  let leakRoutes = 0, leakClass = 0, leakStable = 0, leakNodes = 0
  const otherRouteDetail = []
  for (const r of OTHER_ROUTES) {
    const loaded = cdp.once('Page.loadEventFired')
    await cdp.send('Page.navigate', { url: `${BASE}${r}` })
    await loaded
    await sleep(500)
    const res = await evalJs(`(() => { const area = document.querySelector('.content-area');
      const cs = area ? getComputedStyle(area).scrollbarGutter : null;
      return { route: ${JSON.stringify(r)}, areaPresent: !!area, gutterClass: area ? area.classList.contains('dss-stable-gutter') : null,
        computedScrollbarGutter: cs, featureNodes: document.querySelectorAll('[class*="dss-"]').length }; })()`)
    leakRoutes += 1
    if (res.gutterClass) leakClass += 1
    if (res.computedScrollbarGutter === 'stable') leakStable += 1
    leakNodes += res.featureNodes
    otherRouteDetail.push(res)
    console.log(`[route ${r}] area=${res.areaPresent} gutterClass=${res.gutterClass} gutter=${res.computedScrollbarGutter} dssNodes=${res.featureNodes}`)
  }

  // ============================================================ assemble + judge
  const nonGet = requests.filter((r) => r.method !== 'GET').length
  const apiNonGet = requests.filter((r) => r.method !== 'GET' && r.url.includes('/api/')).length
  const realBackend = realResponses.filter((r) => r.status === 200 && r.records !== null)
  const allDup = Object.values(matrix).map((m) => m.duplicateClickGets)
  const allPreserved = Object.values(matrix).map((m) => m.successPreservedOldApplied)

  const result = {
    meta: {
      task_code: 'DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001',
      base_url: BASE, page: `${BASE}/monitor/data-source-state`, captured_at: new Date().toISOString(),
      chromium: version.product, state_order: REQUIRED_STATE_NAMES,
      long_source: 'real backend default query', short_source: `real 探针端=${SHORT_CLIENT} control`,
      failure_injection: 'CDP Fetch.fulfillRequest at browser network layer only (reversible)',
      jsdom_used: false, screenshots: true,
    },
    matrix,
    requests: {
      total: requests.length, nonGet, apiNonGet, listGets: listGets(),
      byMethod: requests.reduce((a, r) => { a[r.method] = (a[r.method] || 0) + 1; return a }, {}),
      duplicateClickGets: allDup.every((d) => d === 1) ? 1 : Math.max(...allDup),
      successPreservedOldApplied: allPreserved.every(Boolean),
    },
    consoleErrors,
    consoleErrorsInjected,
    injectionsServed,
    otherRouteLeak: { routesChecked: leakRoutes, gutterClassPresent: leakClass, stableGutterComputed: leakStable, dssFeatureNodes: leakNodes, detail: otherRouteDetail },
    successPath: {
      realBackend200: realBackend.length >= 1,
      realBackendRecordCount: realBackend.length ? Math.max(...realBackend.map((r) => r.records)) : 0,
      realBackendResponses: realResponses.length,
      // every list response observed from the REAL backend was 200 — this is what makes the console-error
      // attribution above sound: a list 500 could only have come from our own injection.
      listStatusesAll200: realResponses.length > 0 && realResponses.every((r) => r.status === 200),
      failureInjectedAtBrowserLayerOnly: true,
    },
    realResponses,
    officialFileHasNegativeControlMarker: false,
  }

  writeFileSync(join(OUT, 'official-result.json'), JSON.stringify(result, null, 2))

  const verdict = judge(result)
  writeFileSync(join(OUT, 'official-judgement.json'), JSON.stringify(verdict, null, 2))

  console.log('')
  console.log(`strict_assertion_status=${verdict.passed ? 'PASS' : 'FAIL'}`)
  console.log(`strict_assertion_check_count=${verdict.check_count}`)
  console.log(`strict_assertion_failure_count=${verdict.failure_count}`)
  if (!verdict.passed) {
    console.log('--- FAILURES (un-rounded) ---')
    for (const f of verdict.failures) console.log(`  ${f.field} @ ${f.where}: actual=${f.actual} expected=${f.expected}`)
  }
  cdp.close()
  process.exit(verdict.passed ? 0 : 1)
}

main().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2) })
