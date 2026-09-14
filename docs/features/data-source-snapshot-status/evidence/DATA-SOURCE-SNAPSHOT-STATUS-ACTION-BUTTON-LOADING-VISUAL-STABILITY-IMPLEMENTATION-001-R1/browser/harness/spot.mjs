// §9.5 regression spot-check, RE-RUN for R1 (DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R1)
// against the R1 result worktree build. Unchanged from R0 except this header.
// Runs at 1920x1080 against the Vite dev server of THIS result worktree, with the single GET
// endpoint intercepted at the browser layer. Covers the items the 4-viewport matrix does not:
// dropdown popper widths, 20-code-point truncation, CLIENT_DESC tooltips, full repeated query
// params, failure-retains-old-results, and hidden freeze/resume. GET-only, no writes.
import { writeFileSync, mkdirSync } from 'node:fs'
import { CDP, sleep } from './cdp.mjs'

const OUT = process.argv[2] ?? '/tmp/abl-cdp/out'
mkdirSync(OUT, { recursive: true })
const BASE = 'http://127.0.0.1:5173'
const LIST = '/api/monitor/data-source-run-state/list'
const LONG_DESC = '长'.repeat(25)
const TRUNCATED = `${'长'.repeat(20)}...`

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
    { id: 'c3', desc: LONG_DESC, active: true },
  ],
  sources: [
    { id: 'src-1', org: '源库一', active: true },
    { id: 'src-2', org: null, active: true },
  ],
  statuses: ['RUNNING', 'COMPLETED'],
}
const R2 = [
  row('c1', 'RUNNING', 'SNAPSHOT_RUNNING', '端1'),
  row('c3', 'COMPLETED', 'SNAPSHOT_COMPLETED', LONG_DESC),
]
const okEnvelope = (records) => ({
  code: 200,
  message: 'success',
  timestamp: '2026-09-14T00:00:00Z',
  data: { records, candidates: CANDIDATES },
})
const failEnvelope = () => ({ code: 500, message: 'injected-failure', timestamp: '', data: null })

const results = { checks: [], listCalls: [], startedAt: new Date().toISOString() }
const check = (name, pass, detail) => results.checks.push({ name, pass, detail })

async function main() {
  const cdp = await CDP.attach()
  let mode = 'ok'
  // Only hold a request while we are actively waiting for one. The 60s auto-refresh timer can
  // fire at any moment; a request it produces must be fulfilled inline, never queued into a gate
  // we later mismatch (which would leave a paused request to be cancelled -> Invalid InterceptionId).
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
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: '*/api/monitor/data-source-run-state/list*', requestStage: 'Request' }],
  })

  const consoleErrors = []
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error' || p.type === 'assert') consoleErrors.push(`console.${p.type}: ${p.args.map((a) => a.value ?? a.description ?? a.type).join(' ')}`)
  })
  cdp.on('Runtime.exceptionThrown', (p) => consoleErrors.push(`exception: ${p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text ?? ''}`))
  cdp.on('Log.entryAdded', (p) => {
    if (p.entry?.level === 'error') consoleErrors.push(`log.${p.entry.source}: ${p.entry.text}`)
  })

  cdp.on('Fetch.requestPaused', async (p) => {
    if (!p.request.url.includes(LIST)) {
      await cdp.send('Fetch.continueRequest', { requestId: p.requestId })
      return
    }
    if (mode === 'delay' && armed) {
      results.listCalls.push({ method: p.request.method, url: p.request.url, action: 'held' })
      pushGate(p.requestId)
      return
    }
    results.listCalls.push({ method: p.request.method, url: p.request.url, action: mode === 'delay' ? 'auto-ok' : 'ok' })
    await fulfill(p.requestId, okEnvelope(R2))
  })

  const evalJs = (expr) => cdp.evaluate(expr)
  const move = async (x, y) => {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' })
  }
  const clickAt = async (x, y) => {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' })
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  }
  const escape = async () => {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
  }
  const clickButton = async (text) => {
    await evalJs(`(() => {
      const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
      const b = [...document.querySelectorAll('button')].find((x) => norm(x.textContent) === ${JSON.stringify(text)});
      if (!b) throw new Error('button not found');
      b.click(); return true;
    })()`)
  }
  const centerOf = (sel) =>
    evalJs(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2), w: b.width, h: b.height };
    })()`)

  const loaded = cdp.once('Page.loadEventFired')
  await cdp.send('Page.navigate', { url: `${BASE}/monitor/data-source-state` })
  await loaded
  await sleep(1200)

  // ---------------------------------------------------------------- A. dropdown popper widths
  const POPPERS = [
    ['dss-client-select', 'dss-client-popper', 480],
    ['dss-source-select', 'dss-source-popper', 400],
    ['dss-status-select', 'dss-status-popper', 240],
  ]
  for (const [trigger, popper, expected] of POPPERS) {
    const c = await centerOf(`.${trigger} .el-select__wrapper`)
    await clickAt(c.x, c.y)
    await sleep(500)
    const m = await evalJs(`(() => {
      const p = document.querySelector('.el-popper.${popper}');
      if (!p) return null;
      const b = p.getBoundingClientRect();
      const cs = getComputedStyle(p);
      return { w: Math.round(b.width * 100) / 100, minW: cs.minWidth, maxW: cs.maxWidth, visible: cs.display !== 'none' && cs.visibility !== 'hidden' };
    })()`)
    check(`popper ${popper} width = ${expected}px`, !!m && m.visible && m.w === expected, m)
    await escape()
    await sleep(350)
  }

  // ---------------------------------------------------------------- B/C. option truncation + CLIENT_DESC tooltip
  const cc = await centerOf('.dss-client-select .el-select__wrapper')
  await clickAt(cc.x, cc.y)
  await sleep(500)
  const optRect = (id) => centerOf(`.dss-client-popper .el-select-dropdown__item[data-dss-client-id="${id}"]`)
  const options = await evalJs(`(() => {
    return [...document.querySelectorAll('.dss-client-popper .el-select-dropdown__item')].map((li) => ({
      id: li.getAttribute('data-dss-client-id'),
      text: li.textContent.trim(),
      codepoints: Array.from(li.textContent.trim()).length,
    }));
  })()`)
  const c3opt = options.find((o) => o.id === 'c3')
  // Option label is the composition CLIENT_ID（CLIENT_DESC）; only the desc field is truncated.
  check('c3 option desc truncated to 20 code points + "..."', !!c3opt && c3opt.text === `c3（${TRUNCATED}）`, c3opt)
  const c1opt = options.find((o) => o.id === 'c1')
  check('short option desc not truncated, no ellipsis', !!c1opt && c1opt.text === 'c1（端1）', c1opt)

  // hover the truncated option -> query-bar private tooltip must show the full raw desc
  const c3c = await optRect('c3')
  await move(600, 400)
  await sleep(120)
  await move(c3c.x, c3c.y)
  await sleep(700)
  const tt = await evalJs(`(() => {
    const el = document.querySelector('.dss-q-tt');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      text: el.textContent.trim(),
      codepoints: Array.from(el.textContent.trim()).length,
      parentIsBody: el.parentElement === document.body,
      position: cs.position,
      visible: cs.visibility !== 'hidden' && cs.display !== 'none',
      belowTrigger: false,
    };
  })()`)
  check('truncated option hover shows .dss-q-tt with full 25-cp desc', !!tt && tt.visible && tt.text === LONG_DESC && tt.codepoints === 25 && tt.parentIsBody && tt.position === 'fixed', tt)

  // hover a NON-truncated option -> tooltip must not appear
  const c1c = await optRect('c1')
  await move(600, 400)
  await sleep(150)
  const ttBefore = await evalJs(`!!document.querySelector('.dss-q-tt')`)
  await move(c1c.x, c1c.y)
  await sleep(600)
  const ttAfter = await evalJs(`(() => { const e = document.querySelector('.dss-q-tt'); if (!e) return null; const c = getComputedStyle(e); return { visible: c.visibility !== 'hidden' && c.display !== 'none', text: e.textContent.trim() }; })()`)
  // v-if removes the node entirely when hidden, so "absent" is the expected no-tooltip outcome.
  check('non-truncated option shows no tooltip', ttBefore === false && (ttAfter === null || ttAfter.visible === false), { ttBefore, ttAfter })

  // ---------------------------------------------------------------- D. multi-select -> full repeated query params
  await clickAt(c1c.x, c1c.y)
  await sleep(250)
  const c2c = await optRect('c2')
  await clickAt(c2c.x, c2c.y)
  await sleep(250)
  await escape()
  await sleep(400)
  const tagState = await evalJs(`(() => {
    const tags = [...document.querySelectorAll('.dss-client-select .el-tag')].map((t) => ({
      text: t.textContent.trim(), closable: t.classList.contains('is-closable'),
      id: t.querySelector('[data-dss-client-id]')?.getAttribute('data-dss-client-id') ?? null,
    }));
    return { tags };
  })()`)
  results.selectedTags = tagState
  mode = 'delay'
  armed = true
  await clickButton('查询')
  const q1 = await waitGate()
  armed = false
  const q1url = results.listCalls.filter((c) => c.action === 'held').at(-1).url
  check(
    'multi-select query serializes repeated clientId params',
    /[?&]clientId=c1&clientId=c2(&|$)/.test(q1url) && !/clientId\[\]/.test(q1url) && !/__ALL__/.test(q1url),
    q1url.replace(BASE, ''),
  )
  await fulfill(q1, okEnvelope(R2))
  mode = 'ok'
  await sleep(500)

  // deselect c1/c2, select c3 -> collapsed tag carries the truncated label + identity attr
  const cc2 = await centerOf('.dss-client-select .el-select__wrapper')
  await clickAt(cc2.x, cc2.y)
  await sleep(450)
  await clickAt((await optRect('c1')).x, (await optRect('c1')).y)
  await sleep(200)
  await clickAt((await optRect('c2')).x, (await optRect('c2')).y)
  await sleep(200)
  await clickAt((await optRect('c3')).x, (await optRect('c3')).y)
  await sleep(250)
  await escape()
  await sleep(400)
  const tag = await evalJs(`(() => {
    const t = document.querySelector('.dss-client-select .el-tag.is-closable');
    if (!t) return null;
    return { text: t.textContent.trim().replace(/\\s+/g, ''), id: t.querySelector('[data-dss-client-id]')?.getAttribute('data-dss-client-id') ?? null };
  })()`)
  check('selected tag shows 20-cp truncated label but keeps raw identity', !!tag && tag.text === `c3（${TRUNCATED}）` && tag.id === 'c3', tag)

  // hover the selected tag -> tooltip with full desc
  const tgc = await centerOf('.dss-client-select .el-tag.is-closable')
  await move(600, 400)
  await sleep(150)
  await move(tgc.x, tgc.y)
  await sleep(700)
  const ttTag = await evalJs(`(() => { const e = document.querySelector('.dss-q-tt'); if (!e) return null; const c = getComputedStyle(e); return { visible: c.visibility !== 'hidden' && c.display !== 'none', text: e.textContent.trim() }; })()`)
  check('selected-tag hover shows full-desc tooltip', !!ttTag && ttTag.visible && ttTag.text === LONG_DESC, ttTag)

  mode = 'delay'
  armed = true
  await clickButton('查询')
  const q2 = await waitGate()
  armed = false
  const q2url = results.listCalls.filter((c) => c.action === 'held').at(-1).url
  check('single selection serializes exactly one clientId', /[?&]clientId=c3(&|$)/.test(q2url) && (q2url.match(/clientId=/g) ?? []).length === 1, q2url.replace(BASE, ''))
  await fulfill(q2, okEnvelope(R2))
  mode = 'ok'
  await sleep(500)

  // ---------------------------------------------------------------- E. page-level table tooltip (regression)
  // The 探针端 cell renders CLIENT_ID; its tooltip carries the full CLIENT_DESC. Target the c3 row
  // (R2 row order: c1 端1, c3 长×25) to prove the page-level tooltip still shows the untruncated desc.
  const probeCenter = await evalJs(`(() => {
    const el = [...document.querySelectorAll('.dss-probe-main')].find((e) => (e.textContent || '').trim() === 'c3');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) };
  })()`)
  await move(600, 400)
  await sleep(150)
  await move(probeCenter.x, probeCenter.y)
  await sleep(800)
  const tableTt = await evalJs(`(() => { const e = document.querySelector('.dss-single-tooltip .dss-single-tooltip__content'); if (!e) return null; return { text: e.textContent.trim(), codepoints: Array.from(e.textContent.trim()).length }; })()`)
  check('table CLIENT_DESC tooltip unchanged (full raw desc)', !!tableTt && tableTt.text === LONG_DESC, tableTt)
  await move(600, 400)
  await sleep(300)

  // ---------------------------------------------------------------- F. failure retains old results
  const rowsBefore = await evalJs(`document.querySelectorAll('.el-table__body-wrapper tbody tr').length`)
  const timeBefore = await evalJs(`(document.querySelector('.dss-refresh-time') || {}).textContent ?? null`)
  mode = 'delay'
  armed = true
  await clickButton('立即刷新')
  const fgate = await waitGate()
  armed = false
  await fulfill(fgate, failEnvelope())
  mode = 'ok'
  await sleep(600)
  const afterFail = await evalJs(`(() => ({
    rows: document.querySelectorAll('.el-table__body-wrapper tbody tr').length,
    refreshTime: (document.querySelector('.dss-refresh-time') || {}).textContent ?? null,
    error: (document.querySelector('.dss-result-error') || {}).textContent ?? null,
    firstLoadErr: !!document.querySelector('.dss-first-load-error'),
  }))()`)
  results.failure = { rowsBefore, timeBefore, afterFail }
  check('failure keeps previous result rows', afterFail.rows === rowsBefore && rowsBefore > 1, { before: rowsBefore, after: afterFail.rows })
  check('failure keeps 最近成功刷新 and shows收敛 warning', afterFail.refreshTime === timeBefore && !!afterFail.error, afterFail)

  // ---------------------------------------------------------------- G. hidden freeze / resume
  const secs1 = await evalJs(`(document.querySelector('.dss-countdown-seconds') || {}).textContent ?? null`)
  await evalJs(`(() => {
    window.__dssHidden = true;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__dssHidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__dssHidden ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
    return true;
  })()`)
  await sleep(300)
  const secsHiddenStart = await evalJs(`(document.querySelector('.dss-countdown-seconds') || {}).textContent ?? null`)
  await sleep(2600)
  const secsHiddenLater = await evalJs(`(document.querySelector('.dss-countdown-seconds') || {}).textContent ?? null`)
  results.hidden = { secs1, secsHiddenStart, secsHiddenLater }
  check('countdown freezes while page hidden (no 假走)', secsHiddenStart !== null && secsHiddenStart === secsHiddenLater, results.hidden)

  // resume: idle restore must refetch, and must NOT light either action indicator
  mode = 'delay'
  const heldBefore = results.listCalls.filter((c) => c.action === 'held').length
  armed = true
  await evalJs(`(() => { window.__dssHidden = false; document.dispatchEvent(new Event('visibilitychange')); return true; })()`)
  const rgate = await waitGate(10000)
  armed = false
  await sleep(450)
  const resumeState = await evalJs(`(() => {
    const spin = (t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.replace(/\\s+/g,'').trim() === t); const s = b && b.querySelector('.dss-btn-spinner'); return s ? getComputedStyle(s).visibility : null; };
    return { query: spin('查询'), refresh: spin('立即刷新'),
      queryBusy: [...document.querySelectorAll('button')].find((x) => x.textContent.replace(/\\s+/g,'').trim() === '查询')?.getAttribute('aria-busy') ?? null,
      refreshBusy: [...document.querySelectorAll('button')].find((x) => x.textContent.replace(/\\s+/g,'').trim() === '立即刷新')?.getAttribute('aria-busy') ?? null,
      refreshActive: !!document.querySelector('.dss-countdown-text') };
  })()`)
  results.resume = { heldBefore, resumeState, url: results.listCalls.filter((c) => c.action === 'held').at(-1)?.url?.replace(BASE, '') }
  check('resume-visible triggers exactly 1 restore GET', results.listCalls.filter((c) => c.action === 'held').length === heldBefore + 1, results.resume.url)
  check('restore must not light either action indicator', resumeState.query === 'hidden' && resumeState.refresh === 'hidden' && resumeState.queryBusy === null && resumeState.refreshBusy === null, resumeState)
  await fulfill(rgate, okEnvelope(R2))
  mode = 'ok'
  await sleep(700)
  const afterResume = await evalJs(`(() => ({ secs: (document.querySelector('.dss-countdown-seconds') || {}).textContent ?? null, rows: document.querySelectorAll('.el-table__body-wrapper tbody tr').length }))()`)
  results.afterResume = afterResume
  check('countdown restarts after resume', afterResume.secs !== null && afterResume.secs !== '--', afterResume)

  results.consoleErrors = consoleErrors
  results.finishedAt = new Date().toISOString()
  results.methodsAllGet = results.listCalls.every((c) => c.method === 'GET')
  results.failed = results.checks.filter((c) => !c.pass).map((c) => c.name)
  writeFileSync(`${OUT}/spot.json`, JSON.stringify(results, null, 2))
  cdp.close()
  console.log(`WROTE ${OUT}/spot.json checks=${results.checks.length} failed=${results.failed.length} listCalls=${results.listCalls.length} consoleErrors=${consoleErrors.length}`)
  console.log('FAILED: ' + (results.failed.join(' | ') || 'NONE'))
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
