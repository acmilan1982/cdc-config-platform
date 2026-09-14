// Diagnostic only: explain the 0.95px refresh-group left-edge variance seen at 1280x800.
import { CDP, sleep } from './cdp.mjs'

const cdp = await CDP.attach()
await cdp.send('Runtime.enable')
await cdp.send('Fetch.enable', {
  patterns: [{ urlPattern: '*/api/monitor/data-source-run-state/list*', requestStage: 'Request' }],
})
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
await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/monitor/data-source-state' })
await sleep(2500)

const out = await cdp.evaluate(`(() => {
  const g = document.querySelector('.dss-refresh-group');
  const time = document.querySelector('.dss-refresh-time');
  const secs = document.querySelector('.dss-countdown-seconds');
  const w = (el) => (el ? Math.round(el.getBoundingClientRect().width * 1000) / 1000 : null);
  const origTime = time.textContent;
  const origSecs = secs.textContent;
  const timeW = {};
  for (const t of ['最近成功刷新：14:11:09', '最近成功刷新：14:11:10', '最近成功刷新：14:11:11', '最近成功刷新：--']) {
    time.textContent = t;
    timeW[t] = w(time);
  }
  time.textContent = origTime;
  const secsW = {};
  for (const s of ['60', '59', '09', '9', '--']) {
    secs.textContent = s;
    secsW[s] = w(secs);
  }
  secs.textContent = origSecs;
  const kids = [...g.children].map((c) => ({
    cls: c.className || c.tagName,
    w: w(c),
    text: (c.textContent || '').slice(0, 24),
  }));
  return { groupW: w(g), timeW, secsW, kids, nowTime: origTime, nowSecs: origSecs };
})()`)
console.log(JSON.stringify(out, null, 2))
cdp.close()
