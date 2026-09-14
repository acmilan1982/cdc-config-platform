// FORMAL ACCEPTANCE matrix + request-semantics runner
// (DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001).
//
// Drives the REAL Chromium against THIS worktree's Vite dev server (base commit 5195a71...).
// Per Prompt §7.5 the SUCCESS path is NOT synthesized: the single GET is held briefly at the browser
// layer (Fetch.requestPaused) and then `Fetch.continueRequest`-ed so it reaches the REAL backend on 8080.
// Only the FAILURE path injects a controlled response at the browser network layer, and only for the one
// target GET. No backend/DB/production code is modified; no non-GET request is ever produced.
//
// After collecting everything this script calls the pure judgement module ./assertions.mjs and exits
// non-zero if ANY hard assertion fails (Prompt §7.4: geometry max-difference strictly === 0).
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { CDP, sleep } from './cdp.mjs'
import { evaluateAcceptanceResult, REQUIRED_VIEWPORTS, REQUIRED_STATE_COUNT } from './assertions.mjs'

const OUT = process.argv[2] ?? '/tmp/dss-fa-out'
const BASE = process.argv[3] ?? 'http://192.168.174.70:5173'
const LIST = '/api/monitor/data-source-run-state/list'

mkdirSync(OUT, { recursive: true })
mkdirSync(join(OUT, 'screenshots'), { recursive: true })
mkdirSync(join(OUT, 'rects'), { recursive: true })

const VIEWPORTS = REQUIRED_VIEWPORTS.map((v) => v.split('x').map(Number))
const TIME_STATES = ['--', '00:00:00', '11:11:11', '14:11:09', '14:11:10', '14:11:11', '23:59:59']
const COUNT_STATES = ['60', '59', '10', '9', '0', '--']
const COUNT_FIXED = '60'
const TIME_FIXED = '14:11:11'

const failEnvelope = () => ({ code: 500, message: 'injected-failure', timestamp: '', data: null })

// ----------------------------------------------------------------------------- in-page measurement
// One evaluate performs the optional text substitutions AND the measurement, so no timer tick can
// interleave between the two halves (same discipline as R1/R2, whose measurement was confirmed correct).
function measureExpr(sub = {}) {
  const subs = []
  if (sub.time !== undefined) {
    subs.push(`document.querySelector('.dss-refresh-time-actual').textContent=${JSON.stringify(sub.time)};`)
  }
  if (sub.count !== undefined) {
    subs.push(`document.querySelector('.dss-countdown-seconds').textContent=${JSON.stringify(sub.count)};`)
  }
  return `(() => {
  const R = (sel) => { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el); return { x: b.x, y: b.y, w: b.width, h: b.height, vis: cs.visibility, op: cs.opacity, disp: cs.display }; };
  const BOX = (sel, size) => { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect();
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2; return { x: cx - size / 2, y: cy - size / 2, w: size, h: size }; };
  const T = (sel) => { const el = document.querySelector(sel); return el ? el.textContent : null; };
  const A = (sel, attr) => { const el = document.querySelector(sel); return el ? el.getAttribute(attr) : null; };
  ${subs.join('\n  ')}
  ${subs.length ? "void document.querySelector('.dss-refresh-group').offsetHeight;" : ''}
  const docEl = document.documentElement;
  return {
    group: R('.dss-refresh-group'),
    time: R('.dss-refresh-time'),
    timePrefix: R('.dss-refresh-time-prefix'),
    timeValue: R('.dss-refresh-time-value'),
    timeReserve: R('.dss-refresh-time-reserve'),
    timeActual: R('.dss-refresh-time-actual'),
    ring: R('.dss-countdown-ring'),
    countText: R('.dss-countdown-text'),
    secs: R('.dss-countdown-seconds'),
    refreshSep: R('.dss-refresh-sep'),
    refreshBtn: R('.dss-refresh-btn'),
    refreshLabel: R('.dss-refresh-btn .dss-action-label'),
    refreshSpinnerBox: BOX('.dss-refresh-btn .dss-btn-spinner', 12),
    queryBar: R('.dss-query-bar'),
    queryGroup: R('.dss-q-group'),
    queryActions: R('.dss-q-actions'),
    queryBtn: R('.dss-query-btn'),
    queryLabel: R('.dss-query-btn .dss-action-label'),
    querySpinnerBox: BOX('.dss-query-btn .dss-btn-spinner', 12),
    resetBtn: R('.dss-reset-btn'),
    texts: {
      timePrefix: T('.dss-refresh-time-prefix'),
      timeReserve: T('.dss-refresh-time-reserve'),
      timeActual: T('.dss-refresh-time-actual'),
      secs: T('.dss-countdown-seconds'),
      refreshLabel: T('.dss-refresh-btn .dss-action-label'),
      queryLabel: T('.dss-query-btn .dss-action-label'),
    },
    aria: {
      reserveHidden: A('.dss-refresh-time-reserve', 'aria-hidden'),
      refreshSpinnerHidden: A('.dss-refresh-btn .dss-btn-spinner', 'aria-hidden'),
      querySpinnerHidden: A('.dss-query-btn .dss-btn-spinner', 'aria-hidden'),
      refreshBusy: A('.dss-refresh-btn', 'aria-busy'),
      queryBusy: A('.dss-query-btn', 'aria-busy'),
      refreshDisabled: A('.dss-refresh-btn', 'aria-disabled'),
      queryDisabled: A('.dss-query-btn', 'aria-disabled'),
    },
    nativeDisabled: {
      refresh: document.querySelector('.dss-refresh-btn').disabled,
      query: document.querySelector('.dss-query-btn').disabled,
    },
    spinnerVisible: {
      refresh: document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible'),
      query: document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible'),
    },
    elementPlusLoadingIcon: document.querySelectorAll(
      '.dss-refresh-btn .el-icon.is-loading, .dss-query-btn .el-icon.is-loading, ' +
      '.dss-refresh-btn .el-loading-mask, .dss-query-btn .el-loading-mask',
    ).length,
    anim: {
      refreshSpinner: getComputedStyle(document.querySelector('.dss-refresh-btn .dss-btn-spinner')).animationName,
      querySpinner: getComputedStyle(document.querySelector('.dss-query-btn .dss-btn-spinner')).animationName,
      ringProgressTransition: getComputedStyle(document.querySelector('.dss-ring-progress')).transitionDuration,
    },
    nodeCounts: {
      reserve: document.querySelectorAll('.dss-refresh-time-reserve').length,
      actual: document.querySelectorAll('.dss-refresh-time-actual').length,
      refreshSpinner: document.querySelectorAll('.dss-refresh-btn .dss-btn-spinner').length,
      querySpinner: document.querySelectorAll('.dss-query-btn .dss-btn-spinner').length,
    },
    doc: { scrollWidth: docEl.scrollWidth, clientWidth: docEl.clientWidth },
    timeOuterText: (() => { const el = document.querySelector('.dss-refresh-time'); return el ? el.textContent : null; })(),
  };
})()`
}

const r3 = (v) => Math.round(v * 1000) / 1000
function delta(states, path) {
  const pick = (o, p) => p.reduce((a, k) => (a == null ? a : a[k]), o)
  const vals = states.map((s) => pick(s.rect, path.split('.')))
  const nums = vals.filter((v) => typeof v === 'number')
  if (nums.length !== states.length) return { values: vals, delta: null, min: null, max: null }
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return { values: nums.map(r3), delta: r3(max - min), min: r3(min), max: r3(max) }
}

async function main() {
  const cdp = await CDP.attach()
  let mode = 'ok'
  let armed = false
  let gateWaiter = null
  const gates = []
  const pushGate = (id) => {
    if (gateWaiter) { const w = gateWaiter; gateWaiter = null; w(id) } else gates.push(id)
  }
  const waitGate = (ms = 8000) => {
    if (gates.length) return Promise.resolve(gates.shift())
    return new Promise((res, rej) => {
      const t = setTimeout(() => { gateWaiter = null; rej(new Error('timed out waiting for an intercepted request')) }, ms)
      gateWaiter = (id) => { clearTimeout(t); res(id) }
    })
  }
  const drainGates = () => { gates.length = 0; gateWaiter = null }
  const arm = () => { drainGates(); mode = 'delay'; armed = true }
  const requests = []
  const consoleErrors = []
  const handled = new Map()
  const fulfilledIds = new Set()
  const pausedUrls = new Map()
  const realResponses = []

  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Network.enable')
  await cdp.send('Log.enable')
  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: '*/api/monitor/data-source-run-state/list*', requestStage: 'Request' }],
  })

  cdp.on('Network.requestWillBeSent', (p) => requests.push({ method: p.request.method, url: p.request.url }))
  cdp.on('Network.responseReceived', async (p) => {
    if (fulfilledIds.has(p.requestId)) return
    if (!p.response.url.includes(LIST)) return
    let records = null
    try {
      const body = await cdp.send('Network.getResponseBody', { requestId: p.requestId })
      const txt = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body
      const json = JSON.parse(txt)
      records = Array.isArray(json?.data?.records) ? json.data.records.length : null
    } catch { /* body may be evicted; DOM fallback covers the count */ }
    realResponses.push({ status: p.response.status, url: p.response.url, records })
  })
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error' || p.type === 'assert') {
      consoleErrors.push(`console.${p.type}: ${p.args.map((a) => a.value ?? a.description ?? a.type).join(' ')}`)
    }
  })
  cdp.on('Runtime.exceptionThrown', (p) =>
    consoleErrors.push(`exception: ${p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text ?? ''}`),
  )
  cdp.on('Log.entryAdded', (p) => { if (p.entry?.level === 'error') consoleErrors.push(`log.${p.entry.source}: ${p.entry.text}`) })

  const fulfill = async (requestId, obj) => {
    handled.set(requestId, 'fulfill')
    fulfilledIds.add(requestId)
    await cdp.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
      body: Buffer.from(JSON.stringify(obj), 'utf8').toString('base64'),
    })
  }
  const cont = async (requestId) => {
    handled.set(requestId, 'continue')
    try {
      await cdp.send('Fetch.continueRequest', { requestId })
    } catch (e) {
      // A paused intercept can expire when the page navigates or the browser resolves it first.
      // That is harmless for this acceptance run: requestWillBeSent (our GET counter) already fired.
      if (!/Invalid InterceptionId/.test(String(e && e.message))) throw e
    }
  }

  cdp.on('Fetch.requestPaused', async (p) => {
    pausedUrls.set(p.requestId, p.request.url)
    if (!p.request.url.includes(LIST)) { await cont(p.requestId); return }
    if (mode === 'delay' && armed) { pushGate(p.requestId); return }
    if (mode === 'fail') { await fulfill(p.requestId, failEnvelope()); return }
    await cont(p.requestId)
  })

  const evalJs = (expr) => cdp.evaluate(expr)
  const waitFor = async (expr, ms = 6000, label = expr) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) { if (await evalJs(expr)) return true; await sleep(50) }
    throw new Error(`waitFor timeout: ${label}`)
  }
  const clickByText = (text) =>
    evalJs(`(() => {
      const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
      const b = [...document.querySelectorAll('button')].find((x) => norm(x.textContent) === ${JSON.stringify(text)});
      if (!b) throw new Error('button not found: ' + ${JSON.stringify(text)});
      b.click(); return true;
    })()`)

  const listGets = () => requests.filter((r) => r.url.includes(LIST) && r.method === 'GET').length
  const waitIdle = () =>
    waitFor(
      `(() => { const q=document.querySelector('.dss-query-btn'); const r=document.querySelector('.dss-refresh-btn');
        if (!q || !r) return false;
        return q.getAttribute('aria-disabled')===null && r.getAttribute('aria-disabled')===null
          && !q.querySelector('.dss-btn-spinner')?.classList.contains('is-visible')
          && !r.querySelector('.dss-btn-spinner')?.classList.contains('is-visible'); })()`,
      9000,
      'idle',
    )
  const shot = async (name) => {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(OUT, 'screenshots', `${name}.png`), Buffer.from(r.data, 'base64'))
  }

  const matrix = { viewports: {}, notes: [] }

  // ============================================================ PHASE 1: 4 viewports x 20 states
  for (const [w, h] of VIEWPORTS) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
    const loaded = cdp.once('Page.loadEventFired')
    await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source-state` })
    await loaded
    await waitFor(`!!document.querySelector('.dss-refresh-group')`, 8000, 'refresh group present')
    await waitIdle()
    await waitFor(`/^\\d{2}:\\d{2}:\\d{2}$/.test(document.querySelector('.dss-refresh-time-actual').textContent)`, 8000, 'initial real success')
    await sleep(150)

    const states = []
    const measure = async (name, sub = {}) => {
      let rect
      for (let i = 0; i < 3; i += 1) { rect = await evalJs(measureExpr(sub)); if (rect && rect.group) break; await sleep(120) }
      if (!rect || !rect.group) throw new Error(`measurement failed in state ${name}`)
      states.push({ name, substituted: sub, rect })
      return rect
    }
    const vp = `${w}x${h}`

    for (const t of TIME_STATES) await measure(`TIME_${t}`, { time: t, count: COUNT_FIXED })
    for (const c of COUNT_STATES) await measure(`COUNT_${c}`, { time: TIME_FIXED, count: c })
    await measure('IDLE')
    await shot(`${vp}-IDLE`)

    // 15: MANUAL_LOADING  (held, then continueRequest to the REAL backend)
    arm()
    await clickByText('立即刷新')
    const held = await waitGate(); armed = false
    await waitFor(`document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`, 5000, 'manual loading on')
    await measure('MANUAL_LOADING')
    await shot(`${vp}-MANUAL_LOADING`)
    await cont(held)
    await waitIdle(); await sleep(200)
    await measure('MANUAL_SUCCESS')

    // 17: MANUAL_FAILURE (held then failed at the browser network layer)
    arm()
    await clickByText('立即刷新')
    const mfail = await waitGate(); armed = false
    await waitFor(`document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`, 5000, 'manual failure loading on')
    await fulfill(mfail, failEnvelope())
    await waitIdle(); await sleep(250)
    await measure('MANUAL_FAILURE')
    mode = 'ok'

    // 18: QUERY_LOADING
    arm()
    await clickByText('查询')
    const qheld = await waitGate(); armed = false
    await waitFor(`document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible')`, 5000, 'query loading on')
    await measure('QUERY_LOADING')
    await shot(`${vp}-QUERY_LOADING`)
    await cont(qheld)
    await waitIdle(); await sleep(200)
    await measure('QUERY_SUCCESS')

    // 20: QUERY_FAILURE
    arm()
    await clickByText('查询')
    const qfail = await waitGate(); armed = false
    await waitFor(`document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible')`, 5000, 'query failure loading on')
    await fulfill(qfail, failEnvelope())
    await waitIdle(); await sleep(250)
    await measure('QUERY_FAILURE')
    mode = 'ok'

    const d = {
      refresh_group_rect_delta: { x: delta(states, 'group.x').delta, y: delta(states, 'group.y').delta, width: delta(states, 'group.w').delta, height: delta(states, 'group.h').delta },
      refresh_time_rect_delta: { width: delta(states, 'time.w').delta },
      refresh_time_value_rect_delta: { width: delta(states, 'timeValue.w').delta },
      refresh_time_prefix_rect_delta: { width: delta(states, 'timePrefix.w').delta },
      countdown_seconds_slot_rect_delta: { width: delta(states, 'secs.w').delta },
      refresh_btn_rect_delta: { x: delta(states, 'refreshBtn.x').delta, y: delta(states, 'refreshBtn.y').delta, width: delta(states, 'refreshBtn.w').delta, height: delta(states, 'refreshBtn.h').delta },
      refresh_label_center_delta: { x: delta(states.map((s) => ({ rect: { x: s.rect.refreshLabel.x + s.rect.refreshLabel.w / 2 } })), 'x').delta, y: delta(states.map((s) => ({ rect: { x: s.rect.refreshLabel.y + s.rect.refreshLabel.h / 2 } })), 'x').delta },
      query_btn_rect_delta: { x: delta(states, 'queryBtn.x').delta, y: delta(states, 'queryBtn.y').delta, width: delta(states, 'queryBtn.w').delta, height: delta(states, 'queryBtn.h').delta },
      query_label_center_delta: { x: delta(states.map((s) => ({ rect: { x: s.rect.queryLabel.x + s.rect.queryLabel.w / 2 } })), 'x').delta, y: delta(states.map((s) => ({ rect: { x: s.rect.queryLabel.y + s.rect.queryLabel.h / 2 } })), 'x').delta },
      query_actions_rect_delta: { x: delta(states, 'queryActions.x').delta, y: delta(states, 'queryActions.y').delta, width: delta(states, 'queryActions.w').delta, height: delta(states, 'queryActions.h').delta },
      query_bar_rect_delta: { x: delta(states, 'queryBar.x').delta, y: delta(states, 'queryBar.y').delta, width: delta(states, 'queryBar.w').delta, height: delta(states, 'queryBar.h').delta },
      reset_btn_rect_delta: { x: delta(states, 'resetBtn.x').delta, y: delta(states, 'resetBtn.y').delta, width: delta(states, 'resetBtn.w').delta, height: delta(states, 'resetBtn.h').delta },
      query_group_rect_delta: { x: delta(states, 'queryGroup.x').delta, y: delta(states, 'queryGroup.y').delta, width: delta(states, 'queryGroup.w').delta, height: delta(states, 'queryGroup.h').delta },
      refresh_sep_rect_delta: { x: delta(states, 'refreshSep.x').delta, y: delta(states, 'refreshSep.y').delta, width: delta(states, 'refreshSep.w').delta, height: delta(states, 'refreshSep.h').delta },
    }
    const widths = {
      queryButton: delta(states, 'queryBtn.w'),
      refreshButton: delta(states, 'refreshBtn.w'),
      refreshTimeSlot: delta(states, 'timeValue.w'),
      countdownSlot: delta(states, 'secs.w'),
    }
    const invariants = {
      reserveTextConstant: new Set(states.map((s) => s.rect.texts.timeReserve)).size === 1 && states.every((s) => s.rect.texts.timeReserve === '88:88:88'),
      reserveAriaHiddenAlways: states.every((s) => s.rect.aria.reserveHidden === 'true'),
      prefixConstant: states.every((s) => s.rect.texts.timePrefix === '最近成功刷新：'),
      nodeCountsStable: new Set(states.map((s) => JSON.stringify(s.rect.nodeCounts))).size === 1 && states.every((s) => s.rect.nodeCounts.reserve === 1 && s.rect.nodeCounts.actual === 1),
      labelsConstant: states.every((s) => s.rect.texts.refreshLabel === '立即刷新') && states.every((s) => s.rect.texts.queryLabel === '查询'),
      spinnersAriaHiddenAlways: states.every((s) => s.rect.aria.refreshSpinnerHidden === 'true' && s.rect.aria.querySpinnerHidden === 'true'),
      buttonsNeverNativelyDisabled: states.every((s) => s.rect.nativeDisabled.refresh === false && s.rect.nativeDisabled.query === false),
      refreshSpinnerLitOnlyWhenManual: states.every((s) => (s.name === 'MANUAL_LOADING' ? s.rect.spinnerVisible.refresh === true : s.rect.spinnerVisible.refresh === false)),
      querySpinnerLitOnlyWhenQuery: states.every((s) => (s.name === 'QUERY_LOADING' ? s.rect.spinnerVisible.query === true : s.rect.spinnerVisible.query === false)),
      busyOnlyOnManualLoading: states.every((s) => (s.name === 'MANUAL_LOADING' ? s.rect.aria.refreshBusy === 'true' : s.rect.aria.refreshBusy === null)),
    }

    const statesOut = states.map((s) => ({
      name: s.name, substituted: s.substituted,
      group: s.rect.group, time: s.rect.time, timePrefix: s.rect.timePrefix, timeValue: s.rect.timeValue,
      timeReserve: s.rect.timeReserve, timeActual: s.rect.timeActual, secs: s.rect.secs, refreshSep: s.rect.refreshSep,
      refreshBtn: s.rect.refreshBtn, refreshLabel: s.rect.refreshLabel, refreshSpinnerBox: s.rect.refreshSpinnerBox,
      queryBtn: s.rect.queryBtn, queryLabel: s.rect.queryLabel, querySpinnerBox: s.rect.querySpinnerBox,
      queryBar: s.rect.queryBar, queryActions: s.rect.queryActions, queryGroup: s.rect.queryGroup, resetBtn: s.rect.resetBtn,
      texts: s.rect.texts, aria: s.rect.aria, nativeDisabled: s.rect.nativeDisabled, spinnerVisible: s.rect.spinnerVisible,
      elementPlusLoadingIcon: s.rect.elementPlusLoadingIcon, anim: s.rect.anim, nodeCounts: s.rect.nodeCounts,
      doc: s.rect.doc, timeOuterText: s.rect.timeOuterText,
    }))
    matrix.viewports[vp] = { states: statesOut, deltas: d, widths, invariants, state_count: states.length }
    writeFileSync(join(OUT, 'rects', `${vp}.json`), JSON.stringify({ viewport: vp, states: statesOut, deltas: d, widths, invariants }, null, 2))
    process.stdout.write(`viewport ${vp}: state_count=${states.length} group_delta=${JSON.stringify(d.refresh_group_rect_delta)} qbtn_w=${JSON.stringify([...new Set(widths.queryButton.values)])} rbtn_w=${JSON.stringify([...new Set(widths.refreshButton.values)])}\n`)
  }

  const nonGet = requests.filter((r) => r.method !== 'GET')
  const apiRequests = requests.filter((r) => r.url.includes('/api/'))
  const apiNonGet = apiRequests.filter((r) => r.method !== 'GET')

  // ============================================================ PHASE 2: reduced motion
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
  const loadedRM = cdp.once('Page.loadEventFired')
  await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source-state` })
  await loadedRM
  await waitFor(`!!document.querySelector('.dss-refresh-group')`, 8000, 'refresh group present (rm)')
  await waitIdle()
  await sleep(300)
  const rmNormalIdle = await evalJs(measureExpr())
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await sleep(300)
  const rmReducedIdle = await evalJs(measureExpr())
  arm()
  await clickByText('立即刷新')
  const rmHeld = await waitGate(); armed = false
  await waitFor(`document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`, 5000, 'manual loading on (rm)')
  const rmReducedLoading = await evalJs(measureExpr())
  await shot('reduced-motion-MANUAL_LOADING')
  await cont(rmHeld)
  await waitIdle()
  // query indicator must also stay statically visible with rotation off under reduced motion
  arm()
  await clickByText('查询')
  const rmQ = await waitGate(); armed = false
  await waitFor(`document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible')`, 5000, 'query loading on (rm)')
  const rmQueryLoading = await evalJs(measureExpr())
  await cont(rmQ)
  await waitIdle()
  await cdp.send('Emulation.setEmulatedMedia', { features: [] })
  mode = 'ok'
  const rm = {
    normalMediaAnimation: rmNormalIdle.anim,
    reducedMediaAnimation: rmReducedIdle.anim,
    reducedLoadingAnimation: rmReducedLoading.anim,
    reducedLoadingSpinnerVisible: rmReducedLoading.spinnerVisible,
    reducedLoadingSpinnerBox: rmReducedLoading.refreshSpinnerBox,
    idleVsReducedIdleSameRect: JSON.stringify(rmNormalIdle.group) === JSON.stringify(rmReducedIdle.group),
    reducedIdleVsReducedLoadingSameRect: JSON.stringify(rmReducedIdle.group) === JSON.stringify(rmReducedLoading.group),
    reducedIdleGroup: rmReducedIdle.group,
    reducedLoadingGroup: rmReducedLoading.group,
    queryIndicatorAlsoStillInReducedMotion:
      rmQueryLoading.spinnerVisible.query === true &&
      rmQueryLoading.querySpinnerBox !== null &&
      rmQueryLoading.anim.querySpinner === 'none',
  }

  // ============================================================ PHASE 3: other-route style leak
  const loaded2 = cdp.once('Page.loadEventFired')
  await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source` })
  await loaded2
  await sleep(900)
  const leak = await evalJs(`(() => ({
    dssNodes: document.querySelectorAll('[class*="dss-"]').length,
    refreshGroup: document.querySelectorAll('.dss-refresh-group').length,
    spinner: document.querySelectorAll('.dss-btn-spinner').length,
    actionLabel: document.querySelectorAll('.dss-action-label').length,
  }))()`)
  await shot('other-route-data-source')

  // ============================================================ PHASE 4: request semantics (DSS-AC-112)
  // Fresh page. All success requests go to the REAL backend via continueRequest.
  async function freshPage() {
    const l = cdp.once('Page.loadEventFired')
    await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source-state` })
    await l
    await waitFor(`!!document.querySelector('.dss-refresh-group')`, 8000, 'refresh group present (sem)')
    await waitIdle()
    await waitFor(`/^\\d{2}:\\d{2}:\\d{2}$/.test(document.querySelector('.dss-refresh-time-actual').textContent)`, 8000, 'initial real success (sem)')
  }
  const summaryCount = () => evalJs(`(() => { const el = document.querySelector('.dss-summary-count'); if(!el) return null; const m = el.textContent.match(/(\\d+)/); return m ? Number(m[1]) : null; })()`)
  const lastRefresh = () => evalJs(`document.querySelector('.dss-refresh-time-actual').textContent`)
  const errorText = () => evalJs(`(() => { const el = document.querySelector('.dss-result-error'); return el ? el.textContent : ''; })()`)
  const countdownText = () => evalJs(`document.querySelector('.dss-countdown-seconds').textContent`)

  // single-flight probes: hold the trigger's own GET, perturb, ensure exactly 1 GET in the window
  async function singleFlightProbe(triggerText, perturb) {
    await waitIdle()
    const before = listGets()
    arm()
    await clickByText(triggerText)
    const held = await waitGate(); armed = false
    const btn = triggerText === '查询' ? 'query' : 'refresh'
    await waitFor(`document.querySelector('.dss-${btn}-btn .dss-btn-spinner').classList.contains('is-visible')`, 5000, `${btn} loading on`)
    await perturb()
    await sleep(450)
    const after = listGets()
    await cont(held)
    await waitIdle()
    return after - before
  }

  await freshPage() // PHASE 4 starts on the Feature route (PHASE 3 left the browser on another route)
  const duplicateClickGets = await singleFlightProbe('立即刷新', async () => {
    await clickByText('立即刷新')
    await clickByText('立即刷新')
  })
  const crossButtonGets = await singleFlightProbe('立即刷新', async () => {
    await clickByText('查询')
  })
  const enterGets = await singleFlightProbe('立即刷新', async () => {
    await evalJs(`document.querySelector('.dss-query-btn').focus()`)
    for (const type of ['rawKeyDown', 'keyUp']) {
      await cdp.send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
    }
  })
  const singleClickGets = await singleFlightProbe('查询', async () => {})

  // success updates data + last-refresh time (real backend)
  await freshPage()
  const realMarkBefore = realResponses.length
  const rowsBeforeSuccess = await summaryCount()
  const timeBeforeSuccess = await lastRefresh()
  await sleep(1100)
  await waitIdle()
  arm()
  await clickByText('立即刷新')
  const succHeld = await waitGate(); armed = false
  await waitFor(`document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`, 5000, 'success loading on')
  await cont(succHeld)
  await waitIdle(); await sleep(250)
  const rowsAfterSuccess = await summaryCount()
  const timeAfterSuccess = await lastRefresh()
  const realAfter = realResponses.slice(realMarkBefore)
  const successUpdatedData = rowsAfterSuccess !== null && rowsAfterSuccess >= 1
  const successUpdatedLastRefreshTime =
    /^\d{2}:\d{2}:\d{2}$/.test(String(timeAfterSuccess)) && timeAfterSuccess !== timeBeforeSuccess

  // establish a NON-default applied criteria so "preserve old applied conditions" is observable in the URL
  const mouseAt = async (x, y) => {
    for (const type of ['mousePressed', 'mouseReleased']) {
      await cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
    }
  }
  async function selectFirstStatusAndQuery() {
    try {
      const wbox = await evalJs(`(() => { const w=document.querySelector('.dss-status-select .el-select__wrapper'); if(!w) return null; const b=w.getBoundingClientRect(); return { x: b.x+b.width/2, y: b.y+b.height/2 }; })()`)
      if (!wbox) return false
      await mouseAt(wbox.x, wbox.y)
      await sleep(600)
      const box = await evalJs(`(() => { const it=[...document.querySelectorAll('.dss-status-popper .el-select-dropdown__item')].find((e)=>{ const b=e.getBoundingClientRect(); return b.width>0 && b.height>0 && !/全部/.test(e.textContent); }); if(!it) return null; const b=it.getBoundingClientRect(); return { x: b.x+b.width/2, y: b.y+b.height/2, text: it.textContent.trim() }; })()`)
      if (!box) return false
      await mouseAt(box.x, box.y)
      await sleep(300)
      for (const type of ['rawKeyDown', 'keyUp']) {
        await cdp.send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
      }
      await sleep(200)
      await clickByText('查询')
      await waitIdle()
      return box.text
    } catch { return false }
  }
  const statusSelectionPerformed = await selectFirstStatusAndQuery()

  // failure preserves old results / conditions / time and shows the converged error
  const urlParamsOf = (u) => { try { return new URL(u).search } catch { return '' } }
  const lastListUrl = () => { const l = requests.filter((r) => r.url.includes(LIST)); return l.length ? l[l.length - 1].url : '' }
  const urlBeforeFailure = lastListUrl()
  const paramsBeforeFailure = urlParamsOf(urlBeforeFailure)
  const rowsBeforeFailure = await summaryCount()
  const timeBeforeFailure = await lastRefresh()
  await waitIdle()
  arm()
  await clickByText('立即刷新')
  const failHeld = await waitGate(); armed = false
  await waitFor(`document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`, 5000, 'failure loading on')
  const failParams = urlParamsOf(pausedUrls.get(failHeld) || '')
  await fulfill(failHeld, failEnvelope())
  await waitIdle(); await sleep(300)
  const rowsAfterFailure = await summaryCount()
  const timeAfterFailure = await lastRefresh()
  const errAfterFailure = await errorText()
  // prove applied conditions unchanged: a later successful refresh must use the SAME query params
  arm()
  await clickByText('立即刷新')
  const reconfHeld = await waitGate(); armed = false
  const reconfParams = urlParamsOf(pausedUrls.get(reconfHeld) || '')
  await cont(reconfHeld)
  await waitIdle()
  mode = 'ok'
  const failurePreservedOldApplied =
    rowsAfterFailure === rowsBeforeFailure && timeAfterFailure === timeBeforeFailure && paramsBeforeFailure === reconfParams
  const failureShowedConvergedError = errAfterFailure === '刷新失败，将在约 60 秒后自动重试'

  // hidden freezes the countdown and resume issues exactly one recovery GET without lighting a manual indicator
  const beforeHiddenScenario = listGets()
  await freshPage() // + exactly one initial real GET
  const afterInitialGets = listGets()
  const cdA = await countdownText()
  await evalJs(`Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}); document.dispatchEvent(new Event('visibilitychange')); true`)
  await sleep(1600)
  const cdB = await countdownText()
  const getsWhileHidden = listGets() - afterInitialGets
  arm()
  await evalJs(`Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}); document.dispatchEvent(new Event('visibilitychange')); true`)
  const resumeHeld = await waitGate(); armed = false
  const resumeLitNoManualIndicator = await evalJs(
    `!document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible') && !document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible')`,
  )
  await cont(resumeHeld)
  await waitIdle(); await sleep(200)
  const initialGets = afterInitialGets - beforeHiddenScenario
  const resumeGets = listGets() - afterInitialGets
  const hiddenResumeGets = listGets() - beforeHiddenScenario
  const hiddenFreezeOk = cdA === cdB && getsWhileHidden === 0

  const requestSemantics = {
    singleClickGets,
    duplicateClickGets,
    crossButtonGets,
    enterGets,
    hiddenResumeGets,
    hiddenCountdownFrozen: hiddenFreezeOk,
    resumeLitNoManualIndicator,
    failurePreservedOldApplied,
    failureShowedConvergedError,
    successUpdatedData,
    successUpdatedLastRefreshTime,
    writeRequests: nonGet.length,
    detail: {
      rowsBeforeSuccess, rowsAfterSuccess, timeBeforeSuccess, timeAfterSuccess,
      rowsBeforeFailure, rowsAfterFailure, timeBeforeFailure, timeAfterFailure,
      errAfterFailure, paramsBeforeFailure, failParams, reconfParams,
      urlBeforeFailure, failUrl: pausedUrls.get(failHeld) || '', reconfUrl: pausedUrls.get(reconfHeld) || '',
      statusSelectionPerformed,
      countdownBeforeHidden: cdA, countdownAfterHidden: cdB, getsWhileHidden, initialGets, resumeGets,
      realSuccessResponses: realAfter,
    },
  }

  const successReal = realAfter.filter((r) => r.status === 200)
  const successPath = {
    realBackend200: successReal.length > 0 || realResponses.some((r) => r.status === 200),
    realBackendRecordCount: Math.max(rowsAfterSuccess ?? 0, ...successReal.map((r) => r.records ?? 0), 0),
    successProbeResponses: realAfter,
    allRealResponses: realResponses,
  }

  const result = {
    task: 'DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001',
    startedAt: new Date().toISOString(),
    base: BASE,
    viewports: VIEWPORTS.map(([w, h]) => `${w}x${h}`),
    timeStates: TIME_STATES,
    countStates: COUNT_STATES,
    matrix: matrix.viewports,
    notes: matrix.notes,
    requests: { total: requests.length, nonGet: nonGet.length, api: apiRequests.length, apiNonGet: apiNonGet.length },
    consoleErrors,
    reducedMotion: rm,
    otherRouteLeak: leak,
    requestSemantics,
    successPath,
  }

  writeFileSync(join(OUT, 'acceptance-matrix.json'), JSON.stringify(result, null, 2))
  writeFileSync(join(OUT, 'acceptance-requests.json'), JSON.stringify({ requests, realResponses }, null, 2))
  writeFileSync(join(OUT, 'acceptance-console.json'), JSON.stringify({ consoleErrors }, null, 2))
  process.stdout.write(`requests total=${requests.length} nonGET=${nonGet.length} apiNonGET=${apiNonGet.length}; console errors=${consoleErrors.length}\n`)
  process.stdout.write(`reduced-motion: ${JSON.stringify(rm)}\n`)
  process.stdout.write(`other-route leak: ${JSON.stringify(leak)}\n`)
  process.stdout.write(`requestSemantics: ${JSON.stringify(requestSemantics)}\n`)
  process.stdout.write(`successPath: ${JSON.stringify({ realBackend200: successPath.realBackend200, realBackendRecordCount: successPath.realBackendRecordCount, successProbeResponses: successPath.successProbeResponses.length, allRealResponses: successPath.allRealResponses.length })}\n`)
  cdp.close()

  const verdict = evaluateAcceptanceResult(result)
  const lines = []
  lines.push('FORMAL ACCEPTANCE ASSERTION ANALYSIS (machine-generated; this file is a judgement, not a narrative)')
  lines.push(`task=${result.task}`)
  lines.push(`acceptance-matrix.json=${join(OUT, 'acceptance-matrix.json')}`)
  lines.push(`required_viewports=${REQUIRED_VIEWPORTS.join(',')}`)
  lines.push(`required_state_count_per_viewport=${REQUIRED_STATE_COUNT}`)
  lines.push(`checks_passed=${verdict.check_count}`)
  lines.push(`assertion_failure_count=${verdict.failure_count}`)
  lines.push(`strict_harness_exit_code=${verdict.passed ? 0 : 1}`)
  lines.push('')
  lines.push('per-viewport deltas (raw, recomputed from recorded states; all required to be exactly 0):')
  for (const vp of REQUIRED_VIEWPORTS) {
    const m = result.matrix[vp] || {}
    lines.push(`  ${vp}: ${JSON.stringify(m.deltas || {})}`)
    lines.push(`  ${vp}: query_button_width_set=${JSON.stringify([...new Set((m.widths?.queryButton?.values) || [])])} refresh_button_width_set=${JSON.stringify([...new Set((m.widths?.refreshButton?.values) || [])])}`)
    lines.push(`  ${vp}: invariants=${JSON.stringify(m.invariants || {})}`)
  }
  lines.push('')
  if (verdict.passed) {
    lines.push('RESULT=ALL_HARD_ASSERTIONS_PASSED')
  } else {
    lines.push('RESULT=ASSERTION_FAILURES')
    lines.push('failures (field | viewport | actual | expected):')
    for (const f of verdict.failures) lines.push(`  FAIL ${f.field} | ${f.where} | actual=${JSON.stringify(f.actual)} | expected=${JSON.stringify(f.expected)}`)
  }
  writeFileSync(join(OUT, 'acceptance-assertion-analysis.txt'), lines.join('\n') + '\n')
  process.stdout.write(lines.join('\n') + '\n')

  if (!verdict.passed) {
    console.error(`ACCEPTANCE ASSERTIONS FAILED: ${verdict.failure_count} failure(s)`)
    process.exit(1)
  }
}

main().catch((e) => { console.error('FATAL', e); process.exit(1) })
