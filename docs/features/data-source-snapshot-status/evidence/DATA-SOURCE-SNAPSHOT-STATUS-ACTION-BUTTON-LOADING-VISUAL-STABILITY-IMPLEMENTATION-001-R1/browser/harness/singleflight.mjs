// R1 single-flight / duplicate-request defence check (§8.4), 1920x1080, real Chromium.
// While a manual refresh is in flight the "立即刷新" button must stay functionally blocked
// (aria-disabled, never natively disabled) and repeated clicks / Enter presses must not
// produce additional list GETs. Same for the query button while a query is in flight.
import { writeFileSync, mkdirSync } from 'node:fs'
import { CDP, sleep } from './cdp.mjs'

const OUT = process.argv[2] ?? '/tmp/abl-r1-out'
mkdirSync(OUT, { recursive: true })
const BASE = 'http://127.0.0.1:5173'
const LIST = '/api/monitor/data-source-run-state/list'

const CANDIDATES = {
  clients: [{ id: 'c1', desc: '端1', active: true }],
  sources: [{ id: 'src-1', org: '源库一', active: true }],
  statuses: ['RUNNING'],
}
const row = () => ({
  clientId: 'c1',
  clientRef: { state: 'ACTIVE', desc: '端1' },
  sourceId: 'src-1',
  sourceRef: { state: 'ACTIVE', org: '源库一', category: 'SOURCE', sourceRole: true },
  snapshotStatus: 'SNAPSHOT_RUNNING',
  statusCategory: 'RUNNING',
  snapshotLastSeenAt: '2026-08-17 17:28:46',
  snapshotCompletedAt: null,
  updatedAt: '2026-08-17 17:28:46',
})
const okEnvelope = () => ({
  code: 200,
  message: 'success',
  timestamp: '2026-09-14T00:00:00Z',
  data: { records: [row()], candidates: CANDIDATES },
})

async function main() {
  const cdp = await CDP.attach()
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Network.enable')
  await cdp.send('Log.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/monitor/data-source-run-state/list*', requestStage: 'Request' }] })

  const listCalls = []
  const consoleErrors = []
  let mode = 'ok'
  let delayMs = 1500
  const fulfill = (requestId) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
      body: Buffer.from(JSON.stringify(okEnvelope()), 'utf8').toString('base64'),
    })
  cdp.on('Network.requestWillBeSent', (p) => {
    if (p.request.url.includes(LIST)) listCalls.push({ method: p.request.method, url: p.request.url })
  })
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error') consoleErrors.push(p.args.map((a) => a.value ?? a.description).join(' '))
  })
  cdp.on('Runtime.exceptionThrown', (p) => consoleErrors.push(p.exceptionDetails?.exception?.description ?? 'exception'))
  cdp.on('Log.entryAdded', (p) => {
    if (p.entry?.level === 'error') consoleErrors.push(p.entry.text)
  })
  cdp.on('Fetch.requestPaused', async (p) => {
    if (!p.request.url.includes(LIST)) {
      await cdp.send('Fetch.continueRequest', { requestId: p.requestId })
      return
    }
    // The delay mode fulfils on our own timer, so the interception id can never go stale
    // while we poke the UI; the app stays in its loading state for the whole window.
    if (mode === 'delay') {
      setTimeout(() => {
        fulfill(p.requestId).catch((e) => consoleErrors.push(`fulfill: ${e.message}`))
      }, delayMs)
      return
    }
    await fulfill(p.requestId)
  })

  const evalJs = (e) => cdp.evaluate(e)
  const waitFor = async (expr, ms = 6000) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) {
      if (await evalJs(expr)) return true
      await sleep(50)
    }
    throw new Error('timeout: ' + expr)
  }
  const click = (sel) => evalJs(`(() => { const b=document.querySelector(${JSON.stringify(sel)}); b.click(); return true; })()`)
  const pressEnter = () =>
    evalJs(`(() => { const e=new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}); document.dispatchEvent(e); document.body.dispatchEvent(e); return true; })()`)

  const loaded = cdp.once('Page.loadEventFired')
  await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source-state` })
  await loaded
  await waitFor(`!!document.querySelector('.dss-refresh-btn')`)
  await sleep(600)

  const checks = []
  const results = {}

  // -------- manual refresh in flight: repeated clicks must not add requests
  const before = listCalls.length
  mode = 'delay'
  await click('.dss-refresh-btn')
  await waitFor(`document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`)
  for (let i = 0; i < 3; i += 1) {
    await click('.dss-refresh-btn')
    await click('.dss-query-btn')
  }
  await pressEnter()
  await pressEnter()
  await sleep(400)
  const state = await evalJs(`(() => ({
    refreshBusy: document.querySelector('.dss-refresh-btn').getAttribute('aria-busy'),
    refreshDisabled: document.querySelector('.dss-refresh-btn').getAttribute('aria-disabled'),
    queryDisabled: document.querySelector('.dss-query-btn').getAttribute('aria-disabled'),
    refreshNativeDisabled: document.querySelector('.dss-refresh-btn').disabled,
    queryNativeDisabled: document.querySelector('.dss-query-btn').disabled,
    refreshSpinnerLit: document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible'),
    querySpinnerLit: document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible'),
  }))()`)
  results.whileManualLoading = { state, listCallsDuringWindow: listCalls.length - before }
  checks.push(['manual in-flight: exactly 1 list GET despite 3x refresh + 3x query + 2x Enter', results.whileManualLoading.listCallsDuringWindow === 1, results.whileManualLoading])
  checks.push(['manual in-flight: refresh aria-busy=true, query aria-disabled=true', state.refreshBusy === 'true' && state.queryDisabled === 'true', state])
  checks.push(['manual in-flight: neither button natively disabled', state.refreshNativeDisabled === false && state.queryNativeDisabled === false, state])
  checks.push(['manual in-flight: refresh indicator lit, query indicator unlit', state.refreshSpinnerLit === true && state.querySpinnerLit === false, state])
  mode = 'ok'
  await waitFor(`!document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`)
  await sleep(300)

  // -------- query in flight: repeated query clicks must not add requests
  const before2 = listCalls.length
  mode = 'delay'
  await click('.dss-query-btn')
  await waitFor(`document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible')`)
  for (let i = 0; i < 3; i += 1) {
    await click('.dss-query-btn')
    await click('.dss-refresh-btn')
  }
  await pressEnter()
  await sleep(400)
  const state2 = await evalJs(`(() => ({
    refreshDisabled: document.querySelector('.dss-refresh-btn').getAttribute('aria-disabled'),
    queryDisabled: document.querySelector('.dss-query-btn').getAttribute('aria-disabled'),
    refreshSpinnerLit: document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible'),
    querySpinnerLit: document.querySelector('.dss-query-btn .dss-btn-spinner').classList.contains('is-visible'),
    refreshNativeDisabled: document.querySelector('.dss-refresh-btn').disabled,
    queryNativeDisabled: document.querySelector('.dss-query-btn').disabled,
  }))()`)
  results.whileQueryLoading = { state: state2, listCallsDuringWindow: listCalls.length - before2 }
  checks.push(['query in-flight: exactly 1 list GET despite 3x query + 3x refresh + 1x Enter', results.whileQueryLoading.listCallsDuringWindow === 1, results.whileQueryLoading])
  checks.push(['query in-flight: query aria-disabled=true, refresh aria-disabled=true', state2.queryDisabled === 'true' && state2.refreshDisabled === 'true', state2])
  checks.push(['query in-flight: query indicator lit, refresh indicator unlit', state2.querySpinnerLit === true && state2.refreshSpinnerLit === false, state2])
  checks.push(['query in-flight: neither button natively disabled', state2.refreshNativeDisabled === false && state2.queryNativeDisabled === false, state2])
  mode = 'ok'
  await sleep(delayMs + 600)

  const nonGet = listCalls.filter((c) => c.method !== 'GET')
  results.methods = { total: listCalls.length, nonGet: nonGet.length, nonGetSamples: nonGet.slice(0, 5) }
  results.consoleErrors = consoleErrors
  checks.push(['all intercepted calls are GET', nonGet.length === 0, results.methods])
  checks.push(['browser console errors = 0', consoleErrors.length === 0, consoleErrors])

  const failed = checks.filter(([, pass]) => !pass)
  writeFileSync(`${OUT}/singleflight.json`, JSON.stringify({ results, checks: checks.map(([name, pass, detail]) => ({ name, pass, detail })) }, null, 2))
  for (const [name, pass, detail] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail)}\n`)
  process.stdout.write(`FAILED: ${failed.length ? failed.map((f) => f[0]).join(' | ') : 'NONE'}\n`)
  cdp.close()
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
