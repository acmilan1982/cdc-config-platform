// R1 closure of the R0 0.95px finding: reproduce R0's measurement method at 1280x800.
// R0 measured .dss-refresh-group LEFT edge 812.25px -> 813.20px (delta 0.95px) while substituting
// the time text, and reported the RIGHT (anchor) edge delta as 0.0px. R1 re-measures BOTH edges and
// the group rect, on the R1 build, with the same 1280x800 tier and the same time strings.
import { CDP, sleep } from './cdp.mjs'

const cdp = await CDP.attach()
await cdp.send('Page.enable')
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/monitor/data-source-run-state/list*', requestStage: 'Request' }] })
const row = (clientId, desc) => ({
  clientId,
  clientRef: { state: 'ACTIVE', desc },
  sourceId: 'src-1',
  sourceRef: { state: 'ACTIVE', org: '源库一', category: 'SOURCE', sourceRole: true },
  snapshotStatus: 'SNAPSHOT_RUNNING',
  statusCategory: 'RUNNING',
  snapshotLastSeenAt: '2026-08-17 17:28:46',
  snapshotCompletedAt: null,
  updatedAt: '2026-08-17 17:28:46',
})
const body = Buffer.from(
  JSON.stringify({
    code: 200,
    message: 'success',
    timestamp: '2026-09-14T00:00:00Z',
    data: {
      records: [row('c1', '端1')],
      candidates: { clients: [{ id: 'c1', desc: '端1', active: true }], sources: [], statuses: ['RUNNING'] },
    },
  }),
  'utf8',
).toString('base64')
cdp.on('Fetch.requestPaused', async (p) => {
  if (!p.request.url.includes('/api/monitor/data-source-run-state/list')) {
    await cdp.send('Fetch.continueRequest', { requestId: p.requestId })
    return
  }
  await cdp.send('Fetch.fulfillRequest', {
    requestId: p.requestId,
    responseCode: 200,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
    body,
  })
})
const loaded = cdp.once('Page.loadEventFired')
await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/monitor/data-source-state' })
await loaded
await sleep(1500)

const out = await cdp.evaluate(`(() => {
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const g = document.querySelector('.dss-refresh-group');
  const time = document.querySelector('.dss-refresh-time');
  const actual = document.querySelector('.dss-refresh-time-actual');
  const reserve = document.querySelector('.dss-refresh-time-reserve');
  const secs = document.querySelector('.dss-countdown-seconds');
  const rect = (el) => { const b = el.getBoundingClientRect(); return { x: r3(b.x), right: r3(b.x + b.width), w: r3(b.width) }; };
  const origActual = actual.textContent;
  const origSecs = secs.textContent;
  const per = {};
  for (const t of ['--', '00:00:00', '11:11:11', '14:11:09', '14:11:10', '14:11:11', '23:59:59']) {
    actual.textContent = t;
    void g.offsetHeight;
    per[t] = { groupLeft: rect(g).x, groupRight: rect(g).right, groupW: rect(g).w, timeW: rect(time).w, slotW: rect(document.querySelector('.dss-refresh-time-value')).w };
  }
  actual.textContent = origActual;
  const secsPer = {};
  for (const s of ['60', '59', '10', '09', '9', '0', '--']) {
    secs.textContent = s;
    void g.offsetHeight;
    secsPer[s] = { secsW: rect(secs).w, groupLeft: rect(g).x, groupW: rect(g).w };
  }
  secs.textContent = origSecs;
  const spread = (k, o) => { const vals = Object.values(o).map((v) => v[k]); return { min: r3(Math.min(...vals)), max: r3(Math.max(...vals)), delta: r3(Math.max(...vals) - Math.min(...vals)) }; };
  return {
    tier: '1280x800',
    states: per,
    countdown: secsPer,
    deltas: {
      groupLeft: spread('groupLeft', per),
      groupRight: spread('groupRight', per),
      groupW: spread('groupW', per),
      timeW: spread('timeW', per),
      timeSlotW: spread('slotW', per),
      countdownGroupLeft: spread('groupLeft', secsPer),
      countdownSecsW: spread('secsW', secsPer),
    },
    reserve: { text: reserve.textContent, visibility: getComputedStyle(reserve).visibility, w: rect(reserve).w },
  };
})()`)

console.log('# R1 closure of the R0 refresh-group left-edge finding (1280x800 tier)')
console.log(JSON.stringify(out, null, 2))
console.log('-- conclusion --')
console.log('R0: group LEFT edge spread was 0.953px (812.25 -> 813.20) while the right anchor stayed put; R0 reported only the right edge.')
console.log('R1: groupLeft delta = ' + out.deltas.groupLeft.delta + 'px, groupRight delta = ' + out.deltas.groupRight.delta + 'px, groupW delta = ' + out.deltas.groupW.delta + 'px.')
console.log('R1: time text width delta = ' + out.deltas.timeW.delta + 'px (R0 saw 140.641 vs 139.688 = 0.953px here).')
console.log('R1: countdown seconds width delta = ' + out.deltas.countdownSecsW.delta + 'px.')
cdp.close()
