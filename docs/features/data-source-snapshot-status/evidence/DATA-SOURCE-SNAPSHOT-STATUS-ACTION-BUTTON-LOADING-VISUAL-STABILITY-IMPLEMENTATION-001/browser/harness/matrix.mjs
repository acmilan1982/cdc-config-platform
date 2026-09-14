// Real-Chromium CDP self-test for the action-button loading visual stability task.
// Drives the Vite dev server on 5173 (served from the result worktree) and intercepts
// GET /api/monitor/data-source-run-state/list at the browser layer to create observable
// Loading / success / failure states without touching production code.
import { writeFileSync, mkdirSync } from 'node:fs'
import { CDP, sleep } from './cdp.mjs'

const OUT = process.argv[2] ?? '/tmp/abl-cdp/out'
const BASE = 'http://127.0.0.1:5173'
const LIST = '/api/monitor/data-source-run-state/list'
const LONG_DESC = '长'.repeat(25)
mkdirSync(OUT, { recursive: true })

const row = (clientId, category, raw) => ({
  clientId,
  clientRef: { state: 'ACTIVE', desc: clientId === 'c3' ? LONG_DESC : `${clientId} 描述` },
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
    { id: 'c3', desc: LONG_DESC, active: true },
  ],
  sources: [
    { id: 'src-1', org: '源库一', active: true },
    { id: 'src-2', org: null, active: true },
  ],
  statuses: ['RUNNING', 'COMPLETED'],
}
const R2 = [row('c1', 'RUNNING', 'SNAPSHOT_RUNNING'), row('c2', 'COMPLETED', 'SNAPSHOT_COMPLETED')]
const R3 = [...R2, row('c3', 'COMPLETED', 'SNAPSHOT_COMPLETED')]

const okEnvelope = (records) => ({
  code: 200,
  message: 'success',
  timestamp: '2026-09-14T00:00:00Z',
  data: { records, candidates: CANDIDATES },
})
// Failure is injected through the response envelope (HTTP 200 + code!=200) so the app takes
// its real failure path while the browser console stays free of resource-load errors.
const failEnvelope = () => ({ code: 500, message: 'injected-failure', timestamp: '', data: null })

const MEASURE = `(() => {
  const r2 = (n) => Math.round(n * 100) / 100;
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const R = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: r2(b.x), y: r2(b.y), w: r2(b.width), h: r2(b.height) }; };
  const C = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: r2(b.x + b.width / 2), y: r2(b.y + b.height / 2) }; };
  const btns = [...document.querySelectorAll('button')];
  const q = btns.find((b) => norm(b.textContent) === '查询');
  const r = btns.find((b) => norm(b.textContent) === '立即刷新');
  const spin = (btn) => {
    if (!btn) return null;
    const s = btn.querySelector('.dss-btn-spinner');
    if (!s) return null;
    const cs = getComputedStyle(s);
    const l = btn.querySelector('.dss-action-label');
    const a = s.getBoundingClientRect();
    const c = l ? l.getBoundingClientRect() : null;
    // The spinner spins, so its axis-aligned bounding box is up to sqrt(2) larger than the
    // element. Rotate about the centre, so the untransformed box is centre +/- 6px.
    const cx = a.x + a.width / 2;
    const cy = a.y + a.height / 2;
    const box = { left: r2(cx - 6), right: r2(cx + 6), top: r2(cy - 6), bottom: r2(cy + 6) };
    return {
      count: btn.querySelectorAll('.dss-btn-spinner').length,
      rect: R(s), untransformedBox: box,
      visibility: cs.visibility, opacity: cs.opacity, animationName: cs.animationName,
      ariaHidden: s.getAttribute('aria-hidden'),
      overlapsLabel: c ? (box.right > c.left && c.right > box.left && box.bottom > c.top && c.bottom > box.top) : null,
      gapToLabelPx: c ? r2(c.left - box.right) : null,
    };
  };
  const lab = (btn) => { if (!btn) return null; const l = btn.querySelector('.dss-action-label'); return l ? { count: btn.querySelectorAll('.dss-action-label').length, text: l.textContent, center: C(l), rect: R(l) } : null; };
  const bar = document.querySelector('.dss-query-bar');
  const qa = document.querySelector('.dss-q-actions');
  const rg = document.querySelector('.dss-refresh-group');
  const sel = (cls) => R(document.querySelector('.' + cls));
  return {
    path: location.pathname,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    hasQueryBtn: !!q, hasRefreshBtn: !!r, hasQueryBar: !!bar,
    queryBtn: q ? { rect: R(q), text: norm(q.textContent), ariaBusy: q.getAttribute('aria-busy'), ariaDisabled: q.getAttribute('aria-disabled'), disabled: q.disabled, classes: q.className, label: lab(q), spinner: spin(q) } : null,
    refreshBtn: r ? { rect: R(r), text: norm(r.textContent), ariaBusy: r.getAttribute('aria-busy'), ariaDisabled: r.getAttribute('aria-disabled'), disabled: r.disabled, classes: r.className, label: lab(r), spinner: spin(r) } : null,
    qActions: R(qa), refreshGroup: R(rg), queryBar: R(bar),
    queryBarChildTops: bar ? [...bar.children].map((c) => r2(c.getBoundingClientRect().top)) : [],
    queryBarChildCount: bar ? bar.children.length : 0,
    selects: { client: sel('dss-client-select'), source: sel('dss-source-select'), status: sel('dss-status-select') },
    dssSpinnerCount: document.querySelectorAll('.dss-btn-spinner').length,
    dssLabelCount: document.querySelectorAll('.dss-action-label').length,
    dssClassNodeCount: document.querySelectorAll('[class*="dss-"]').length,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    summaryText: (document.querySelector('.dss-summary-count') || {}).textContent ?? null,
    tableRowCount: document.querySelectorAll('.el-table__body-wrapper tbody tr').length,
    refreshTimeText: (document.querySelector('.dss-refresh-time') || {}).textContent ?? null,
  };
})()`

async function main() {
  const cdp = await CDP.attach()
  const report = {
    startedAt: new Date().toISOString(),
    base: BASE,
    mode: 'browser-layer Fetch interception of the single GET endpoint',
    requests: [],
    consoleErrors: [],
    injectedFailures: 0,
    viewports: {},
    special: {},
    screenshots: [],
  }

  let mode = 'ok'
  const gates = []
  let gateWaiter = null
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
  const fulfill = async (requestId, obj) => {
    await cdp.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
      body: Buffer.from(JSON.stringify(obj), 'utf8').toString('base64'),
    })
  }

  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Network.enable')
  await cdp.send('Log.enable')
  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: '*/api/monitor/data-source-run-state/list*', requestStage: 'Request' }],
  })

  cdp.on('Network.requestWillBeSent', (p) => {
    report.requests.push({ url: p.request.url, method: p.request.method })
  })
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error' || p.type === 'assert') {
      report.consoleErrors.push({ kind: `console.${p.type}`, text: p.args.map((a) => a.value ?? a.description ?? a.type).join(' ') })
    }
  })
  cdp.on('Runtime.exceptionThrown', (p) => {
    report.consoleErrors.push({ kind: 'exception', text: p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text ?? '' })
  })
  cdp.on('Log.entryAdded', (p) => {
    if (p.entry?.level === 'error') report.consoleErrors.push({ kind: `log.${p.entry.source}`, text: p.entry.text })
  })

  const requestLog = (report.listCalls = [])

  cdp.on('Fetch.requestPaused', async (p) => {
    const isList = p.request.url.includes(LIST)
    if (!isList) {
      // Anything else on this path must pass through untouched (never rewrite a module).
      await cdp.send('Fetch.continueRequest', { requestId: p.requestId })
      return
    }
    if (mode === 'delay') {
      requestLog.push({ url: p.request.url, method: p.request.method, action: 'delayed' })
      pushGate(p.requestId)
      return
    }
    requestLog.push({ url: p.request.url, method: p.request.method, action: mode })
    await fulfill(p.requestId, mode === 'fail' ? failEnvelope() : okEnvelope(R2))
  })

  const measure = () => cdp.evaluate(MEASURE)
  const shot = async (name) => {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' })
    const file = `${OUT}/shot-${name}.png`
    writeFileSync(file, Buffer.from(r.data, 'base64'))
    report.screenshots.push(file)
  }
  const setViewport = async (w, h) => {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
  }
  const navigate = async () => {
    const loaded = cdp.once('Page.loadEventFired')
    await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source-state` })
    await loaded
    for (let i = 0; i < 60; i++) {
      const ok = await measure()
      if (ok.hasQueryBtn && ok.hasRefreshBtn && ok.queryBar) return ok
      await sleep(150)
    }
    throw new Error('page never rendered the query bar')
  }
  const settle = () => sleep(450)
  const click = async (which) => {
    await cdp.evaluate(`(() => {
      const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
      const b = [...document.querySelectorAll('button')].find((x) => norm(x.textContent) === ${JSON.stringify(which)});
      if (!b) throw new Error('button not found: ${which}');
      b.click();
      return true;
    })()`)
  }
  const state = async (label) => {
    const m = await measure()
    m.label = label
    m.mode = mode
    return m
  }

  const VIEWPORTS = [
    [1280, 800],
    [1700, 920],
    [1920, 1080],
    [2560, 1440],
  ]

  for (const [w, h] of VIEWPORTS) {
    const key = `${w}x${h}`
    const seq = []
    await setViewport(w, h)
    mode = 'ok'
    requestLog.length = 0
    await navigate()
    await settle()
    seq.push(await state('IDLE'))
    if (w === 1920) await shot('idle-1920x1080')

    // ---- query path: Loading -> success
    mode = 'delay'
    await click('查询')
    const queryGate = await waitGate()
    await settle()
    seq.push(await state('QUERY_LOADING'))
    if (w === 1920) await shot('query-loading-1920x1080')
    await fulfill(queryGate, okEnvelope(R3))
    await settle()
    seq.push(await state('QUERY_SUCCESS'))
    if (w === 1920) await shot('query-success-1920x1080')

    // ---- manual path: Loading -> success
    mode = 'delay'
    await click('立即刷新')
    const manualGate = await waitGate()
    await settle()
    seq.push(await state('MANUAL_LOADING'))
    if (w === 1920) await shot('manual-loading-1920x1080')
    await fulfill(manualGate, okEnvelope(R3))
    await settle()
    seq.push(await state('MANUAL_SUCCESS'))

    // ---- manual path: Loading -> failure
    mode = 'delay'
    await click('立即刷新')
    const manualGate2 = await waitGate()
    await settle()
    seq.push(await state('MANUAL_LOADING_2'))
    await fulfill(manualGate2, failEnvelope())
    report.injectedFailures += 1
    await settle()
    seq.push(await state('MANUAL_FAILURE'))
    if (w === 1920) await shot('manual-failure-1920x1080')

    // ---- query path: Loading -> failure (old results must be retained)
    mode = 'delay'
    await click('查询')
    const queryGate2 = await waitGate()
    await settle()
    seq.push(await state('QUERY_LOADING_2'))
    await fulfill(queryGate2, failEnvelope())
    report.injectedFailures += 1
    await settle()
    seq.push(await state('QUERY_FAILURE'))
    if (w === 1920) await shot('query-failure-1920x1080')

    report.viewports[key] = { states: seq, listCalls: [...requestLog] }
  }

  // ------------------------------------------------------------------ special checks
  await setViewport(1920, 1080)

  // reduced motion: Loading must still be statically visible with zero geometry delta
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  mode = 'ok'
  requestLog.length = 0
  await navigate()
  await settle()
  const rmIdle = await state('RM_IDLE')
  mode = 'delay'
  await click('查询')
  const rmGate = await waitGate()
  await settle()
  const rmLoading = await state('RM_QUERY_LOADING')
  await fulfill(rmGate, okEnvelope(R3))
  await settle()
  report.special.reducedMotion = { idle: rmIdle, loading: rmLoading, after: await state('RM_QUERY_SUCCESS') }
  await cdp.send('Emulation.setEmulatedMedia', { features: [] })

  // keyboard trigger + busy duplicate defence
  mode = 'ok'
  requestLog.length = 0
  await navigate()
  await settle()
  const before = report.requests.length
  await click('查询')
  await settle()
  report.special.keyboard = { requestsAfterPlainClick: report.requests.length - before }
  // busy: hold a request open, then fire click + Enter repeatedly, then count
  requestLog.length = 0
  const reqBeforeBusy = report.requests.length
  mode = 'delay'
  await click('立即刷新')
  const busyGate = await waitGate()
  await settle()
  const busyState = await state('BUSY_MANUAL_LOADING')
  for (let i = 0; i < 3; i++) {
    await click('立即刷新')
    await click('查询')
  }
  await cdp.evaluate(`(() => {
    const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
    const b = [...document.querySelectorAll('button')].find((x) => norm(x.textContent) === '立即刷新');
    b.focus();
    return document.activeElement === b;
  })()`)
  for (let i = 0; i < 2; i++) {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
  }
  await sleep(300)
  const duringBusyRequests = report.requests.length - reqBeforeBusy
  await fulfill(busyGate, okEnvelope(R3))
  await settle()
  report.special.busy = { state: busyState, extraRequestsDuringBusyClicks: duringBusyRequests, listCallsWhileBusy: [...requestLog] }

  // auto refresh must NOT light the manual indicator
  mode = 'delay'
  requestLog.length = 0
  const autoStart = Date.now()
  const autoGate = await waitGate(75000)
  const autoWaitMs = Date.now() - autoStart
  await settle()
  const autoState = await state('AUTO_REFRESH_LOADING')
  await fulfill(autoGate, okEnvelope(R3))
  await settle()
  report.special.autoRefresh = { waitedMs: autoWaitMs, state: autoState, after: await state('AUTO_REFRESH_DONE') }

  // other route: no dss-* leak
  mode = 'ok'
  const otherLoaded = cdp.once('Page.loadEventFired')
  await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source` })
  await otherLoaded
  await sleep(1200)
  report.special.otherRoute = await cdp.evaluate(`(() => ({
    path: location.pathname,
    dssClassNodeCount: document.querySelectorAll('[class*="dss-"]').length,
    dssSpinnerCount: document.querySelectorAll('.dss-btn-spinner').length,
    dssLabelCount: document.querySelectorAll('.dss-action-label').length,
    buttonCount: document.querySelectorAll('button').length,
  }))()`)

  report.finishedAt = new Date().toISOString()
  report.requestSummary = {
    total: report.requests.length,
    nonGet: report.requests.filter((r) => r.method !== 'GET').length,
    apiNonGet: report.requests.filter((r) => r.url.includes('/api/') && r.method !== 'GET').length,
    listGets: report.requests.filter((r) => r.url.includes(LIST) && r.method === 'GET').length,
  }
  writeFileSync(`${OUT}/matrix.json`, JSON.stringify(report, null, 2))
  cdp.close()
  console.log(`WROTE ${OUT}/matrix.json  requests=${report.requests.length} consoleErrors=${report.consoleErrors.length}`)
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
