import { readFileSync } from 'node:fs'

const OUT = process.argv[2] ?? '/tmp/abl-cdp/out'
const rep = JSON.parse(readFileSync(`${OUT}/matrix.json`, 'utf8'))
const r2 = (n) => Math.round(n * 100) / 100
const spread = (ns) => r2(Math.max(...ns) - Math.min(...ns))
const rectKeys = ['x', 'y', 'w', 'h']

function delta(list, pick) {
  const out = {}
  for (const k of rectKeys) out[k] = spread(list.map((s) => pick(s)[k]))
  return out
}
function centerDelta(list, pick) {
  return { x: spread(list.map((s) => pick(s).x)), y: spread(list.map((s) => pick(s).y)) }
}
const maxOf = (o) => Math.max(...Object.values(o))

const summary = { viewports: {}, fails: [] }
const check = (cond, msg) => {
  if (!cond) summary.fails.push(msg)
  return cond
}

for (const [vp, data] of Object.entries(rep.viewports)) {
  const st = data.states
  const ok = st.every((s) => s.hasQueryBtn && s.hasRefreshBtn && s.queryBar)
  check(ok, `${vp}: missing buttons/query bar in some state`)
  const byLabel = Object.fromEntries(st.map((s) => [s.label, s]))
  const row = {
    states: st.map((s) => s.label),
    queryBtn: delta(st, (s) => s.queryBtn.rect),
    refreshBtn: delta(st, (s) => s.refreshBtn.rect),
    queryLabel: centerDelta(st, (s) => s.queryBtn.label.center),
    refreshLabel: centerDelta(st, (s) => s.refreshBtn.label.center),
    qActions: delta(st, (s) => s.qActions),
    queryBar: delta(st, (s) => s.queryBar),
    refreshGroupLeft: spread(st.map((s) => s.refreshGroup.x)),
    refreshGroupRight: spread(st.map((s) => s.refreshGroup.x + s.refreshGroup.w)),
    queryBarHeights: st.map((s) => s.queryBar.h),
    queryBarChildTops: st.map((s) => JSON.stringify(s.queryBarChildTops)),
    widths: { query: st.map((s) => s.queryBtn.rect.w), refresh: st.map((s) => s.refreshBtn.rect.w) },
    spinnerVisible: st.map((s) => `${s.label}:q=${s.queryBtn.spinner.visibility}/${s.queryBtn.spinner.animationName},r=${s.refreshBtn.spinner.visibility}/${s.refreshBtn.spinner.animationName}`),
    overlaps: st.map((s) => `${s.label}:q=${s.queryBtn.spinner.overlapsLabel},r=${s.refreshBtn.spinner.overlapsLabel}`),
    gaps: st.map((s) => `${s.label}:q=${s.queryBtn.spinner.gapToLabelPx},r=${s.refreshBtn.spinner.gapToLabelPx}`),
    ariaBusy: st.map((s) => `${s.label}:q=${s.queryBtn.ariaBusy},r=${s.refreshBtn.ariaBusy}`),
    ariaDisabled: st.map((s) => `${s.label}:q=${s.queryBtn.ariaDisabled},r=${s.refreshBtn.ariaDisabled}`),
    disabled: st.map((s) => `${s.label}:q=${s.queryBtn.disabled},r=${s.refreshBtn.disabled}`),
    labels: st.map((s) => `${s.label}:q="${s.queryBtn.label.text}",r="${s.refreshBtn.label.text}"`),
    ariaHidden: st.map((s) => `${s.label}:q=${s.queryBtn.spinner.ariaHidden},r=${s.refreshBtn.spinner.ariaHidden}`),
    spinnerCounts: st.map((s) => `${s.label}:q=${s.queryBtn.spinner.count},r=${s.refreshBtn.spinner.count}`),
    dssCounts: st.map((s) => `${s.label}:spinner=${s.dssSpinnerCount},label=${s.dssLabelCount}`),
    selects: { client: st[0].selects.client, source: st[0].selects.source, status: st[0].selects.status },
    summaryText: st.map((s) => `${s.label}:${s.summaryText}`),
    rows: st.map((s) => `${s.label}:${s.tableRowCount}`),
    refreshTime: st.map((s) => `${s.label}:${s.refreshTimeText}`),
    listCalls: data.listCalls.map((c) => `${c.method} ${c.action} ${c.url.replace(/^http:\/\/127\.0\.0\.1:5173/, '')}`),
  }
  // assertions
  check(st.every((s) => s.queryBtn.rect.w === 62), `${vp}: query width not exactly 62 in every state`)
  check(st.every((s) => s.refreshBtn.rect.w === 110), `${vp}: refresh width not exactly 110 in every state`)
  check(maxOf(row.queryBtn) === 0, `${vp}: query button geometry delta ${JSON.stringify(row.queryBtn)}`)
  check(maxOf(row.refreshBtn) === 0, `${vp}: refresh button geometry delta ${JSON.stringify(row.refreshBtn)}`)
  check(maxOf(row.queryLabel) === 0, `${vp}: query label center delta ${JSON.stringify(row.queryLabel)}`)
  check(maxOf(row.refreshLabel) === 0, `${vp}: refresh label center delta ${JSON.stringify(row.refreshLabel)}`)
  check(maxOf(row.qActions) === 0, `${vp}: query/reset group delta ${JSON.stringify(row.qActions)}`)
  check(spread(st.map((s) => s.queryBar.h)) === 0, `${vp}: query bar height delta`)
  check(new Set(st.map((s) => JSON.stringify(s.queryBarChildTops))).size === 1, `${vp}: query bar wrap changed`)
  check(row.refreshGroupRight === 0, `${vp}: refresh-info group anchor edge moved ${row.refreshGroupRight}px`)
  // The group's left edge is content-driven (the 最近成功刷新 HH:mm:ss glyph string). Assert the
  // weaker, state-relevant invariant: identical timestamp text => identical group geometry.
  const byTime = {}
  let sameTimeSameGeom = true
  st.forEach((s, i) => {
    const g = `${s.refreshGroup.x}|${s.refreshGroup.y}|${s.refreshGroup.w}`
    if (byTime[s.refreshTimeText] && byTime[s.refreshTimeText] !== g) sameTimeSameGeom = false
    byTime[s.refreshTimeText] = g
    void i
  })
  check(sameTimeSameGeom, `${vp}: refresh-info group geometry varies with identical timestamp text`)
  check(st.every((s) => s.queryBtn.spinner.count === 1 && s.refreshBtn.spinner.count === 1), `${vp}: indicator node not constant`)
  check(st.every((s) => s.queryBtn.spinner.overlapsLabel === false && s.refreshBtn.spinner.overlapsLabel === false), `${vp}: indicator overlaps label`)
  check(st.every((s) => s.queryBtn.spinner.ariaHidden === 'true' && s.refreshBtn.spinner.ariaHidden === 'true'), `${vp}: indicator not aria-hidden`)
  check(st.every((s) => s.queryBtn.label.text === '查询' && s.refreshBtn.label.text === '立即刷新'), `${vp}: label text varies by state`)
  check(byLabel.IDLE.queryBtn.spinner.visibility === 'hidden' && byLabel.IDLE.refreshBtn.spinner.visibility === 'hidden', `${vp}: indicator visible at idle`)
  check(byLabel.IDLE.queryBtn.ariaBusy === null && byLabel.IDLE.refreshBtn.ariaBusy === null, `${vp}: aria-busy present at idle`)
  check(byLabel.QUERY_LOADING.queryBtn.ariaBusy === 'true' && byLabel.QUERY_LOADING.refreshBtn.ariaBusy === null, `${vp}: query aria-busy wrong while query loading`)
  check(byLabel.QUERY_LOADING.queryBtn.spinner.visibility === 'visible' && byLabel.QUERY_LOADING.refreshBtn.spinner.visibility === 'hidden', `${vp}: query loading lit the wrong indicator`)
  check(byLabel.MANUAL_LOADING.refreshBtn.ariaBusy === 'true' && byLabel.MANUAL_LOADING.queryBtn.spinner.visibility === 'hidden', `${vp}: manual loading lit the wrong indicator`)
  check(byLabel.QUERY_SUCCESS.queryBtn.spinner.visibility === 'hidden' && byLabel.QUERY_SUCCESS.queryBtn.ariaBusy === null, `${vp}: query indicator not restored after success`)
  check(byLabel.MANUAL_FAILURE.refreshBtn.spinner.visibility === 'hidden', `${vp}: refresh indicator not restored after failure`)
  check(byLabel.MANUAL_LOADING_2.refreshBtn.spinner.visibility === 'visible', `${vp}: refresh Loading 2 not observable`)
  check(byLabel.QUERY_LOADING_2.queryBtn.spinner.visibility === 'visible', `${vp}: query Loading 2 not observable`)
  check(st.every((s) => s.queryBtn.disabled === false && s.refreshBtn.disabled === false), `${vp}: a button became natively disabled`)
  summary.viewports[vp] = row
}

// cross-viewport request/state-machine evidence
summary.special = {
  reducedMotion: {
    idle: pick(rep.special.reducedMotion.idle),
    loading: pick(rep.special.reducedMotion.loading),
    after: pick(rep.special.reducedMotion.after),
    reduceMatches: rep.special.reducedMotion.loading.reducedMotion,
  },
  keyboard: rep.special.keyboard,
  busy: {
    extraRequestsDuringBusyClicks: rep.special.busy.extraRequestsDuringBusyClicks,
    listCalls: rep.special.busy.listCallsWhileBusy,
    queryDisabled: rep.special.busy.state.queryBtn.disabled,
    refreshAriaBusy: rep.special.busy.state.refreshBtn.ariaBusy,
  },
  autoRefresh: {
    waitedMs: rep.special.autoRefresh.waitedMs,
    loadingQueryVisible: rep.special.autoRefresh.state.queryBtn.spinner.visibility,
    loadingRefreshVisible: rep.special.autoRefresh.state.refreshBtn.spinner.visibility,
    loadingQueryAriaBusy: rep.special.autoRefresh.state.queryBtn.ariaBusy,
    loadingRefreshAriaBusy: rep.special.autoRefresh.state.refreshBtn.ariaBusy,
  },
  otherRoute: rep.special.otherRoute,
  requestSummary: rep.requestSummary,
  consoleErrors: rep.consoleErrors,
  injectedFailures: rep.injectedFailures,
  listCallSummary: rep.listCalls.reduce((a, c) => {
    a[c.action] = (a[c.action] ?? 0) + 1
    return a
  }, {}),
}

function pick(s) {
  return {
    reducedMotion: s.reducedMotion,
    querySpinner: s.queryBtn.spinner,
    refreshSpinner: s.refreshBtn.spinner,
    queryAriaBusy: s.queryBtn.ariaBusy,
    queryBtn: s.queryBtn.rect,
    refreshBtn: s.refreshBtn.rect,
    queryLabel: s.queryBtn.label.center,
    refreshLabel: s.refreshBtn.label.center,
    label: s.label,
  }
}

check(summary.special.reducedMotion.reduceMatches === true, 'reduced motion media emulation not active')
check(summary.special.reducedMotion.loading.querySpinner.animationName === 'none', 'reduced motion: animation still running')
check(summary.special.reducedMotion.loading.querySpinner.visibility === 'visible', 'reduced motion: indicator not statically visible')
check(
  JSON.stringify(summary.special.reducedMotion.idle.queryBtn) === JSON.stringify(summary.special.reducedMotion.loading.queryBtn) &&
    JSON.stringify(summary.special.reducedMotion.idle.queryLabel) === JSON.stringify(summary.special.reducedMotion.loading.queryLabel),
  'reduced motion: geometry delta not 0',
)
// The 1 baseline request is the intentional single refresh click that opened the busy window.
check(summary.special.busy.extraRequestsDuringBusyClicks === 1, `busy: expected exactly 1 request (the opening refresh), got ${summary.special.busy.extraRequestsDuringBusyClicks}`)
check(summary.special.autoRefresh.loadingRefreshVisible === 'hidden', 'auto refresh lit the manual indicator')
check(summary.special.autoRefresh.loadingQueryVisible === 'hidden', 'auto refresh lit the query indicator')
check(rep.requestSummary.nonGet === 0, `non-GET requests observed: ${rep.requestSummary.nonGet}`)
check(rep.consoleErrors.length === 0, `console errors: ${JSON.stringify(rep.consoleErrors)}`)
check(summary.special.otherRoute.dssSpinnerCount === 0 && summary.special.otherRoute.dssLabelCount === 0, 'dss-* style leak on another route')

console.log(JSON.stringify(summary, null, 2))
console.log('\n=== FAILS ===')
console.log(summary.fails.length ? summary.fails.join('\n') : 'NONE')
