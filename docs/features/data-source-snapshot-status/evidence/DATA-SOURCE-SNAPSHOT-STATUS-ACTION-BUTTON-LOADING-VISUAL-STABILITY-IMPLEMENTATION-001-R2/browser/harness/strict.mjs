// R2 strict whole-rect matrix with MACHINE FAILING ASSERTIONS
// (DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R2).
//
// Measurement logic is reused from R1's strict.mjs on purpose (R1 measurement was confirmed correct by the
// remote review). What R2 adds is the closing of the loop "measured data -> machine-failable assertion ->
// real exit code": after writing strict-matrix.json this script calls the shared pure assertion module
// (./assertions.mjs, the same module the page-free negative self-test calls) and exits non-zero if ANY
// assertion fails. `exit=0` therefore now means "all hard assertions passed", not merely "the script ran".
//
// It runs the real Chromium against THIS worktree's Vite dev server, with the single GET endpoint intercepted
// at the browser layer. GET-only: no backend, no DB, no ZooKeeper, no writes.
import { writeFileSync, mkdirSync } from 'node:fs'
import { CDP, sleep } from './cdp.mjs'
import { evaluateStrictResult, REQUIRED_VIEWPORTS, REQUIRED_STATE_COUNT } from './assertions.mjs'

const OUT = process.argv[2] ?? '/tmp/abl-r2-out'
mkdirSync(OUT, { recursive: true })
const BASE = process.argv[3] ?? 'http://127.0.0.1:5174'
const LIST = '/api/monitor/data-source-run-state/list'

const VIEWPORTS = REQUIRED_VIEWPORTS.map((v) => v.split('x').map(Number))
// §8.2(1)-(7): '--' plus legal HH:mm:ss values including different-digit combinations.
const TIME_STATES = ['--', '00:00:00', '11:11:11', '14:11:09', '14:11:10', '14:11:11', '23:59:59']
// §8.2(12): countdown 60/59/10/9/0/--.
const COUNT_STATES = ['60', '59', '10', '9', '0', '--']
const COUNT_FIXED = '60'
const TIME_FIXED = '14:11:11'

const row = (clientId, category, raw, desc) => ({
  clientId,
  clientRef: { state: 'ACTIVE', desc },
  sourceId: 'src-1',
  sourceRef: { state: 'ACTIVE', org: '源库一', category: 'SOURCE', sourceRole: true },
  snapshotStatus: raw,
  statusCategory: category,
  snapshotLastSeenAt: '2026-08-17 17:28:46',
  snapshotCompletedAt: category === 'COMPLETED' ? '2026-08-17 17:30:00' : null,
  updatedAt: '2026-08-17 17:28:46',
})
const CANDIDATES = {
  clients: [
    { id: 'c1', desc: '端1', active: true },
    { id: 'c2', desc: '端2', active: true },
  ],
  sources: [{ id: 'src-1', org: '源库一', active: true }],
  statuses: ['RUNNING', 'COMPLETED'],
}
const ROWS = [
  row('c1', 'RUNNING', 'SNAPSHOT_RUNNING', '端1'),
  row('c2', 'COMPLETED', 'SNAPSHOT_COMPLETED', '端2'),
]
const okEnvelope = (records) => ({
  code: 200,
  message: 'success',
  timestamp: '2026-09-14T00:00:00Z',
  data: { records, candidates: CANDIDATES },
})
const failEnvelope = () => ({ code: 500, message: 'injected-failure', timestamp: '', data: null })

// ----------------------------------------------------------------------------- in-page measurement
// One single evaluate call performs the optional text substitutions AND the measurement, so no timer
// tick can interleave between the two halves.
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
    refreshBtn: R('.dss-refresh-btn'),
    refreshLabel: R('.dss-refresh-btn .dss-action-label'),
    refreshSpinnerBox: BOX('.dss-refresh-btn .dss-btn-spinner', 12),
    queryBar: R('.dss-query-bar'),
    queryActions: R('.dss-q-actions'),
    queryBtn: R('.dss-query-btn'),
    queryLabel: R('.dss-query-btn .dss-action-label'),
    querySpinnerBox: BOX('.dss-query-btn .dss-btn-spinner', 12),
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
    timeOuterText: (() => { const el = document.querySelector('.dss-refresh-time'); return el ? el.textContent : null; })(),
  };
})()`
}

// ----------------------------------------------------------------------------- math helpers
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
    if (gateWaiter) {
      const w = gateWaiter
      gateWaiter = null
      w(id)
    } else gates.push(id)
  }
  const waitGate = (ms = 8000) => {
    if (gates.length) return Promise.resolve(gates.shift())
    return new Promise((res, rej) => {
      const t = setTimeout(() => {
        gateWaiter = null
        rej(new Error('timed out waiting for an intercepted request'))
      }, ms)
      gateWaiter = (id) => {
        clearTimeout(t)
        res(id)
      }
    })
  }
  const requests = []
  const consoleErrors = []

  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Network.enable')
  await cdp.send('Log.enable')
  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: '*/api/monitor/data-source-run-state/list*', requestStage: 'Request' }],
  })

  cdp.on('Network.requestWillBeSent', (p) => requests.push({ method: p.request.method, url: p.request.url }))
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error' || p.type === 'assert') {
      consoleErrors.push(`console.${p.type}: ${p.args.map((a) => a.value ?? a.description ?? a.type).join(' ')}`)
    }
  })
  cdp.on('Runtime.exceptionThrown', (p) =>
    consoleErrors.push(`exception: ${p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text ?? ''}`),
  )
  cdp.on('Log.entryAdded', (p) => {
    if (p.entry?.level === 'error') consoleErrors.push(`log.${p.entry.source}: ${p.entry.text}`)
  })

  const fulfill = async (requestId, obj) => {
    await cdp.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
      body: Buffer.from(JSON.stringify(obj), 'utf8').toString('base64'),
    })
  }

  cdp.on('Fetch.requestPaused', async (p) => {
    if (!p.request.url.includes(LIST)) {
      await cdp.send('Fetch.continueRequest', { requestId: p.requestId })
      return
    }
    if (mode === 'delay' && armed) {
      pushGate(p.requestId)
      return
    }
    if (mode === 'fail') {
      await fulfill(p.requestId, failEnvelope())
      return
    }
    await fulfill(p.requestId, okEnvelope(ROWS))
  })

  const evalJs = (expr) => cdp.evaluate(expr)
  const waitFor = async (expr, ms = 6000, label = expr) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) {
      if (await evalJs(expr)) return true
      await sleep(50)
    }
    throw new Error(`waitFor timeout: ${label}`)
  }
  const clickByText = (text) =>
    evalJs(`(() => {
      const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
      const b = [...document.querySelectorAll('button')].find((x) => norm(x.textContent) === ${JSON.stringify(text)});
      if (!b) throw new Error('button not found: ' + ${JSON.stringify(text)});
      b.click(); return true;
    })()`)

  const matrix = { viewports: {}, notes: [] }

  for (const [w, h] of VIEWPORTS) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
    const loaded = cdp.once('Page.loadEventFired')
    await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source-state` })
    await loaded
    await waitFor(`!!document.querySelector('.dss-refresh-group')`, 8000, 'refresh group present')
    await waitFor(`!document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`, 8000, 'idle')
    await sleep(250)

    const states = []
    const measure = async (name, sub = {}) => {
      let rect
      for (let i = 0; i < 3; i += 1) {
        rect = await evalJs(measureExpr(sub))
        if (rect && rect.group) break
        await sleep(120)
      }
      if (!rect || !rect.group) throw new Error(`measurement failed in state ${name}`)
      states.push({ name, substituted: sub, rect })
      return rect
    }

    // ---- 1-7: time value states (countdown pinned to a constant so only the time text varies)
    for (const t of TIME_STATES) await measure(`TIME_${t}`, { time: t, count: COUNT_FIXED })
    // ---- 8-13: countdown states (time pinned to a constant)
    for (const c of COUNT_STATES) await measure(`COUNT_${c}`, { time: TIME_FIXED, count: c })
    // ---- 14: IDLE (real values, nothing substituted)
    await measure('IDLE')

    // ---- 15: MANUAL_LOADING
    mode = 'delay'
    armed = true
    await clickByText('立即刷新')
    const held = await waitGate()
    armed = false
    await waitFor(
      `document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`,
      5000,
      'manual loading on',
    )
    await measure('MANUAL_LOADING')

    // ---- 16: MANUAL_SUCCESS (real time update lands here)
    await fulfill(held, okEnvelope(ROWS))
    await waitFor(
      `!document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`,
      6000,
      'manual loading off',
    )
    await sleep(200)
    await measure('MANUAL_SUCCESS')

    // ---- 17: MANUAL_FAILURE (hold the request so the loading state is observable, then fail it)
    mode = 'delay'
    armed = true
    await clickByText('立即刷新')
    const mfail = await waitGate()
    armed = false
    await waitFor(
      `document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`,
      5000,
      'manual failure loading on',
    )
    await fulfill(mfail, failEnvelope())
    await waitFor(
      `!document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`,
      6000,
      'manual failure loading off',
    )
    await sleep(250)
    await measure('MANUAL_FAILURE')
    mode = 'ok'

    // ---- 18: QUERY_LOADING
    mode = 'delay'
    armed = true
    await clickByText('查询')
    const qheld = await waitGate()
    armed = false
    await waitFor(
      `document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible')`,
      5000,
      'query loading on',
    )
    await measure('QUERY_LOADING')

    // ---- 19: QUERY_SUCCESS
    await fulfill(qheld, okEnvelope(ROWS))
    await waitFor(
      `!document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible')`,
      6000,
      'query loading off',
    )
    await sleep(200)
    await measure('QUERY_SUCCESS')

    // ---- 20: QUERY_FAILURE
    mode = 'delay'
    armed = true
    await clickByText('查询')
    const qfail = await waitGate()
    armed = false
    await waitFor(
      `document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible')`,
      5000,
      'query failure loading on',
    )
    await fulfill(qfail, failEnvelope())
    await waitFor(
      `!document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible')`,
      6000,
      'query failure loading off',
    )
    await sleep(250)
    await measure('QUERY_FAILURE')
    mode = 'ok'

    // ---- strict whole-rect deltas (§8.3)
    const d = {
      refresh_group_rect_delta: {
        x: delta(states, 'group.x').delta,
        y: delta(states, 'group.y').delta,
        width: delta(states, 'group.w').delta,
        height: delta(states, 'group.h').delta,
      },
      refresh_time_rect_delta: { width: delta(states, 'time.w').delta },
      refresh_time_value_rect_delta: { width: delta(states, 'timeValue.w').delta },
      refresh_time_prefix_rect_delta: { width: delta(states, 'timePrefix.w').delta },
      countdown_seconds_slot_rect_delta: { width: delta(states, 'secs.w').delta },
      refresh_btn_rect_delta: {
        x: delta(states, 'refreshBtn.x').delta,
        y: delta(states, 'refreshBtn.y').delta,
        width: delta(states, 'refreshBtn.w').delta,
        height: delta(states, 'refreshBtn.h').delta,
      },
      refresh_label_center_delta: {
        x: delta(
          states.map((s) => ({ rect: { x: s.rect.refreshLabel.x + s.rect.refreshLabel.w / 2 } })),
          'x',
        ).delta,
      },
      query_btn_rect_delta: {
        x: delta(states, 'queryBtn.x').delta,
        y: delta(states, 'queryBtn.y').delta,
        width: delta(states, 'queryBtn.w').delta,
        height: delta(states, 'queryBtn.h').delta,
      },
      query_label_center_delta: {
        x: delta(states.map((s) => ({ rect: { x: s.rect.queryLabel.x + s.rect.queryLabel.w / 2 } })), 'x').delta,
      },
      query_actions_rect_delta: {
        x: delta(states, 'queryActions.x').delta,
        y: delta(states, 'queryActions.y').delta,
        width: delta(states, 'queryActions.w').delta,
        height: delta(states, 'queryActions.h').delta,
      },
      query_bar_rect_delta: {
        x: delta(states, 'queryBar.x').delta,
        y: delta(states, 'queryBar.y').delta,
        width: delta(states, 'queryBar.w').delta,
        height: delta(states, 'queryBar.h').delta,
      },
    }

    const widths = {
      queryButton: delta(states, 'queryBtn.w'),
      refreshButton: delta(states, 'refreshBtn.w'),
      refreshTimeSlot: delta(states, 'timeValue.w'),
      countdownSlot: delta(states, 'secs.w'),
    }

    const invariants = {
      reserveTextConstant:
        new Set(states.map((s) => s.rect.texts.timeReserve)).size === 1 &&
        states.every((s) => s.rect.texts.timeReserve === '88:88:88'),
      reserveAriaHiddenAlways: states.every((s) => s.rect.aria.reserveHidden === 'true'),
      prefixConstant: states.every((s) => s.rect.texts.timePrefix === '最近成功刷新：'),
      nodeCountsStable:
        new Set(states.map((s) => JSON.stringify(s.rect.nodeCounts))).size === 1 &&
        states.every((s) => s.rect.nodeCounts.reserve === 1 && s.rect.nodeCounts.actual === 1),
      labelsConstant:
        states.every((s) => s.rect.texts.refreshLabel === '立即刷新') &&
        states.every((s) => s.rect.texts.queryLabel === '查询'),
      spinnersAriaHiddenAlways:
        states.every((s) => s.rect.aria.refreshSpinnerHidden === 'true' && s.rect.aria.querySpinnerHidden === 'true'),
      buttonsNeverNativelyDisabled: states.every(
        (s) => s.rect.nativeDisabled.refresh === false && s.rect.nativeDisabled.query === false,
      ),
      refreshSpinnerLitOnlyWhenManual: states.every((s) =>
        s.name === 'MANUAL_LOADING' ? s.rect.spinnerVisible.refresh === true : s.rect.spinnerVisible.refresh === false,
      ),
      querySpinnerLitOnlyWhenQuery: states.every((s) =>
        s.name === 'QUERY_LOADING' ? s.rect.spinnerVisible.query === true : s.rect.spinnerVisible.query === false,
      ),
      busyOnlyOnManualLoading: states.every((s) =>
        s.name === 'MANUAL_LOADING' ? s.rect.aria.refreshBusy === 'true' : s.rect.aria.refreshBusy === null,
      ),
    }

    matrix.viewports[`${w}x${h}`] = {
      states: states.map((s) => ({
        name: s.name,
        substituted: s.substituted,
        group: s.rect.group,
        time: s.rect.time,
        timePrefix: s.rect.timePrefix,
        timeValue: s.rect.timeValue,
        timeReserve: s.rect.timeReserve,
        timeActual: s.rect.timeActual,
        secs: s.rect.secs,
        refreshBtn: s.rect.refreshBtn,
        refreshLabel: s.rect.refreshLabel,
        refreshSpinnerBox: s.rect.refreshSpinnerBox,
        queryBtn: s.rect.queryBtn,
        queryLabel: s.rect.queryLabel,
        querySpinnerBox: s.rect.querySpinnerBox,
        queryBar: s.rect.queryBar,
        queryActions: s.rect.queryActions,
        texts: s.rect.texts,
        aria: s.rect.aria,
        nativeDisabled: s.rect.nativeDisabled,
        spinnerVisible: s.rect.spinnerVisible,
        anim: s.rect.anim,
        nodeCounts: s.rect.nodeCounts,
        timeOuterText: s.rect.timeOuterText,
      })),
      deltas: d,
      widths,
      invariants,
      state_count: states.length,
    }
    process.stdout.write(`viewport ${w}x${h}: state_count=${states.length} group_delta=${JSON.stringify(d.refresh_group_rect_delta)}\n`)
  }

  const nonGet = requests.filter((r) => r.method !== 'GET')
  const apiRequests = requests.filter((r) => r.url.includes('/api/'))
  const apiNonGet = apiRequests.filter((r) => r.method !== 'GET')

  // ---- reduced motion (§8.4): same 1920x1080 page, idle vs manual-loading geometry, animation off
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
  const loadedRM = cdp.once('Page.loadEventFired')
  await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source-state` })
  await loadedRM
  await waitFor(`!!document.querySelector('.dss-refresh-group')`, 8000, 'refresh group present (rm)')
  await sleep(400)
  const rmNormalIdle = await evalJs(measureExpr())
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await sleep(300)
  const rmReducedIdle = await evalJs(measureExpr())
  mode = 'delay'
  armed = true
  await clickByText('立即刷新')
  const rmHeld = await waitGate()
  armed = false
  await waitFor(
    `document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`,
    5000,
    'manual loading on (rm)',
  )
  const rmReducedLoading = await evalJs(measureExpr())
  await fulfill(rmHeld, okEnvelope(ROWS))
  await sleep(300)
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
  }

  // ---- other-route style leak
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

  const result = {
    task: 'DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R2',
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
  }

  writeFileSync(`${OUT}/strict-matrix.json`, JSON.stringify(result, null, 2))
  process.stdout.write(
    `requests total=${requests.length} nonGET=${nonGet.length} apiNonGET=${apiNonGet.length}; console errors=${consoleErrors.length}\n`,
  )
  process.stdout.write(`reduced-motion: ${JSON.stringify(rm)}\n`)
  process.stdout.write(`other-route leak: ${JSON.stringify(leak)}\n`)
  cdp.close()

  // ---- MACHINE FAILING ASSERTIONS (R2 §4): same module as the page-free negative self-test
  const verdict = evaluateStrictResult(result)
  const lines = []
  lines.push('R2 STRICT ASSERTION ANALYSIS (machine-generated; this file is a judgement, not a narrative)')
  lines.push(`task=${result.task}`)
  lines.push(`strict-matrix.json=${OUT}/strict-matrix.json`)
  lines.push(`required_viewports=${REQUIRED_VIEWPORTS.join(',')}`)
  lines.push(`required_state_count_per_viewport=${REQUIRED_STATE_COUNT}`)
  lines.push(`checks_passed=${verdict.check_count}`)
  lines.push(`assertion_failure_count=${verdict.failure_count}`)
  lines.push(`strict_harness_exit_code=${verdict.passed ? 0 : 1}`)
  lines.push('')
  lines.push('per-viewport deltas (raw, recomputed from recorded states; all required to be exactly 0):')
  for (const vp of REQUIRED_VIEWPORTS) {
    const m = result.matrix[vp] || {}
    const d = m.deltas || {}
    lines.push(`  ${vp}: ${JSON.stringify(d)}`)
    lines.push(`  ${vp}: query_button_width_set=${JSON.stringify(m.widths?.queryButton?.values ? [...new Set(m.widths.queryButton.values)] : null)} refresh_button_width_set=${JSON.stringify(m.widths?.refreshButton?.values ? [...new Set(m.widths.refreshButton.values)] : null)}`)
    lines.push(`  ${vp}: invariants=${JSON.stringify(m.invariants)}`)
  }
  lines.push('')
  if (verdict.passed) {
    lines.push('RESULT=ALL_HARD_ASSERTIONS_PASSED')
  } else {
    lines.push('RESULT=ASSERTION_FAILURES')
    lines.push('failures (field | viewport | actual | expected):')
    for (const f of verdict.failures) {
      lines.push(`  FAIL ${f.field} | ${f.viewport} | actual=${JSON.stringify(f.actual)} | expected=${JSON.stringify(f.expected)}`)
    }
  }
  writeFileSync(`${OUT}/strict-assertion-analysis.txt`, lines.join('\n') + '\n')
  process.stdout.write(lines.join('\n') + '\n')

  if (!verdict.passed) {
    console.error(`STRICT ASSERTIONS FAILED: ${verdict.failure_count} failure(s)`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
