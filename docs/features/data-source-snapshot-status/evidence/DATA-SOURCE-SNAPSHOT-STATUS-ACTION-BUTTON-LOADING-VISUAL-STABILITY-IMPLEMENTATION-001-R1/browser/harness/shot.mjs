// R1 visual capture: idle + manual-loading + a substituted time string, at 1920x1080.
// Used to eyeball that the hidden constant reserve does not become visible and that the real
// time value sits on the same line as its prefix. GET-only interception, no writes.
import { writeFileSync, mkdirSync } from 'node:fs'
import { CDP, sleep } from './cdp.mjs'

const OUT = process.argv[2] ?? '/tmp/abl-r1-out'
mkdirSync(OUT, { recursive: true })
const BASE = 'http://127.0.0.1:5173'
const LIST = '/api/monitor/data-source-run-state/list'

const row = (clientId, category, raw, desc) => ({
  clientId,
  clientRef: { state: 'ACTIVE', desc },
  sourceId: 'src-1',
  sourceRef: { state: 'ACTIVE', org: '源库一', category: 'SOURCE', sourceRole: true },
  snapshotStatus: raw,
  statusCategory: category,
  snapshotLastSeenAt: '2026-08-17 17:28:46',
  snapshotCompletedAt: null,
  updatedAt: '2026-08-17 17:28:46',
})
const okEnvelope = (records) => ({
  code: 200,
  message: 'success',
  timestamp: '2026-09-14T00:00:00Z',
  data: {
    records,
    candidates: { clients: [{ id: 'c1', desc: '端1', active: true }], sources: [{ id: 'src-1', org: '源库一', active: true }], statuses: ['RUNNING'] },
  },
})

async function main() {
  const cdp = await CDP.attach()
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/monitor/data-source-run-state/list*', requestStage: 'Request' }] })

  let held = []
  let mode = 'ok'
  cdp.on('Fetch.requestPaused', async (p) => {
    if (!p.request.url.includes(LIST)) {
      await cdp.send('Fetch.continueRequest', { requestId: p.requestId })
      return
    }
    if (mode === 'delay') {
      held.push(p.requestId)
      return
    }
    await cdp.send('Fetch.fulfillRequest', {
      requestId: p.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
      body: Buffer.from(JSON.stringify(okEnvelope([row('c1', 'RUNNING', 'SNAPSHOT_RUNNING', '端1')])), 'utf8').toString('base64'),
    })
  })

  const loaded = cdp.once('Page.loadEventFired')
  await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source-state` })
  await loaded
  await sleep(1200)

  const clip = async (name, sel, pad = 8) => {
    const box = await cdp.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
      const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; })()`)
    if (!box) throw new Error('no ' + sel)
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2, scale: 3 },
    })
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(shot.data, 'base64'))
  }

  // idle, real time text
  await clip('shot-idle-group-1920x1080', '.dss-refresh-group')
  // real time substituted to a different-digit value: proves reserve does not show and nothing overlaps
  for (const t of ['14:11:11', '--']) {
    await cdp.evaluate(`(() => { document.querySelector('.dss-refresh-time-actual').textContent = ${JSON.stringify(t)}; })()`)
    await sleep(120)
    await clip(`shot-time-${t === '--' ? 'dash' : t.replace(/:/g, '')}-1920x1080`, '.dss-refresh-group')
  }
  // manual loading (indicator lit)
  mode = 'delay'
  await cdp.evaluate(`(() => { const b=[...document.querySelectorAll('button')].find((x)=>x.textContent.replace(/\\s+/g,' ').trim()==='立即刷新'); b.click(); return true; })()`)
  for (let i = 0; i < 60 && (!held.length || !(await cdp.evaluate(`document.querySelector('.dss-refresh-btn .dss-btn-spinner').classList.contains('is-visible')`))); i += 1) {
    await sleep(80)
  }
  await clip('shot-manual-loading-1920x1080', '.dss-refresh-group')
  const full = await cdp.send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${OUT}/shot-manual-loading-full-1920x1080.png`, Buffer.from(full.data, 'base64'))
  mode = 'ok'
  for (const id of held) {
    await cdp.send('Fetch.fulfillRequest', {
      requestId: id,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
      body: Buffer.from(JSON.stringify(okEnvelope([row('c1', 'RUNNING', 'SNAPSHOT_RUNNING', '端1')])), 'utf8').toString('base64'),
    })
  }
  await sleep(300)
  cdp.close()
  process.stdout.write('shots written to ' + OUT + '\n')
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
