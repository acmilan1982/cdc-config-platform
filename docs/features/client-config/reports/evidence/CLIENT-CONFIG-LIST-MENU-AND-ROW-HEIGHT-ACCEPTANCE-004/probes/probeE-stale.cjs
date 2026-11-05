/**
 * 004 AC-156 stale list-response interleaving probe.
 * Scenario: ordinary query reload (A, started earlier) vs toggle-success reload (B).
 * A's real response is stashed and delivered strictly after B has been rendered.
 * Only synthetic CCFG004-HOLDER is toggled; enable/disable writes are gated.
 */
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core');
const fs = require('fs');

const FRONT = 'http://127.0.0.1:5173';
const PAGE_URL = FRONT + '/config/client';
const OUT = '/tmp/004/stale-raw.json';
const t0 = Date.now();
const stamp = () => Date.now() - t0;

const R = {
  task: 'CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004',
  mode: 'stale-get-interleaving',
  gate: { nonGetAttempts: 0, blocked: [], forwarded: [] },
  listRequests: [],
  events: [],
  flows: {},
  errors: [],
};

function pathOf(u) { try { return new globalThis.URL(u).pathname; } catch (e) { return u; } }

(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => R.errors.push(String(e)));

  let holdMode = false;
  let held = null;
  let releaseScheduled = false;
  let listSeq = 0;

  function scheduledRelease() {
    if (releaseScheduled || !held) return;
    releaseScheduled = true;
    setTimeout(async () => {
      const h = held;
      held = null;
      R.events.push({ t: stamp(), ev: 'release-held-A', idx: h.idx });
      try {
        await h.route.fulfill({ status: h.status, headers: { 'content-type': 'application/json' }, body: h.body });
      } catch (e) { R.events.push({ t: stamp(), ev: 'release-error', msg: String(e) }); }
    }, 300);
  }

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    const path = pathOf(req.url());
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      if (path === '/api/clients') {
        const idx = ++listSeq;
        const rec = { idx, startedAt: stamp(), url: req.url(), held: false };
        R.listRequests.push(rec);
        R.events.push({ t: stamp(), ev: 'list-request', idx });
        if (holdMode && !held && !releaseScheduled) {
          rec.held = true;
          const resp = await route.fetch();
          const body = await resp.body();
          held = { idx, route, status: resp.status(), body };
          R.events.push({ t: stamp(), ev: 'held-response-stashed', idx, status: resp.status(), bytes: body.length });
          return;
        }
      }
      await route.continue();
      return;
    }
    R.gate.nonGetAttempts += 1;
    const rec = { method, path };
    const allowed = method === 'PUT' && (path === '/api/clients/CCFG004-HOLDER/disable' || path === '/api/clients/CCFG004-HOLDER/enable');
    if (!allowed) { R.gate.blocked.push(rec); await route.abort('blockedbyclient'); return; }
    R.gate.forwarded.push(rec);
    R.events.push({ t: stamp(), ev: 'write-start', method, path });
    if (path.endsWith('/disable')) await new Promise((r) => setTimeout(r, 3200));
    await route.continue();
  });

  page.on('response', (r) => {
    if (r.request().method() === 'GET' && pathOf(r.url()) === '/api/clients') {
      const active = R.listRequests.filter((x) => !x.respondedAt).pop();
      if (active) { active.respondedAt = stamp(); }
      R.events.push({ t: stamp(), ev: 'list-response', idx: active ? active.idx : null, status: r.status() });
      if (active && !active.held && held) scheduledRelease();
    }
  });

  async function row(id) {
    const rows = page.locator('.lt-main-table tbody tr.el-table__row');
    const n = await rows.count();
    for (let i = 0; i < n; i++) { const t = (await rows.nth(i).locator('.cc-id').innerText().catch(() => '')).trim(); if (t === id) { await rows.nth(i).scrollIntoViewIfNeeded(); return rows.nth(i); } }
    throw new Error('no row ' + id);
  }
  async function rowState(id) {
    return await page.evaluate((id) => {
      const rows = Array.from(document.querySelectorAll('.lt-main-table tbody tr.el-table__row'));
      const x = rows.find((r) => ((r.querySelector('.cc-id') || {}).textContent || '').trim() === id);
      return x ? { present: true, mark: ((x.querySelector('.cc-inactive-mark') || {}).textContent || '').trim(), hl: x.className.includes('lt-row-highlight__row') } : { present: false };
    }, id);
  }
  async function listInfo() {
    return await page.evaluate(() => ({
      rows: document.querySelectorAll('.lt-main-table tbody tr.el-table__row').length,
      fixed: Array.from(document.querySelectorAll('.lt-main-table tbody tr.el-table__row.lt-row-highlight__row .cc-id')).map((e) => (e.textContent || '').trim()),
      mask: (() => { const m = document.querySelector('.el-loading-mask'); return !!m && getComputedStyle(m).display !== 'none'; })(),
    }));
  }

  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.lt-main-table tbody tr.el-table__row').length > 0, null, { timeout: 20000 });
  await page.waitForTimeout(700);
  R.flows.baseline = await listInfo();
  R.baseListRequests = listSeq;

  // select HOLDER (currently enabled)
  const rH = await row('CCFG004-HOLDER');
  if (!((await rH.getAttribute('class')) || '').includes('lt-row-highlight__row')) {
    await rH.locator('td').first().click();
    await page.waitForTimeout(320);
  }
  R.flows.selected = await listInfo();

  // open menu -> 停用 -> confirm
  await rH.locator('.cc-more-link').click();
  await page.waitForTimeout(250);
  await page.locator('.cc-more-popper:visible .el-dropdown-menu__item:visible', { hasText: '停用' }).first().click();
  await page.locator('.el-message-box.cc-confirm--disable').waitFor({ state: 'visible' });
  R.flows.confirm = {
    title: (await page.locator('.el-message-box.cc-confirm--disable .el-message-box__title').innerText()).trim(),
    body: (await page.locator('.el-message-box.cc-confirm--disable .el-message-box__message').innerText()).trim(),
  };

  holdMode = true; // next list GET will be held
  const confirmedAt = stamp();
  await page.locator('.el-message-box.cc-confirm--disable .el-message-box__btns button', { hasText: '停用' }).click();

  // ordinary query reload A while PUT is still in flight
  await page.waitForTimeout(800);
  R.events.push({ t: stamp(), ev: 'click-query' });
  const queryBtn = page.locator('.ql-actions__query');
  const queryDisabled = await queryBtn.isDisabled().catch(() => null);
  await queryBtn.click();
  R.flows.queryClick = { at: stamp(), disabled: queryDisabled };
  await page.waitForTimeout(400);
  R.flows.afterQueryStart = await listInfo();

  // wait for PUT response + toggle-success reload B + rendering
  await page.waitForFunction(() => {
    const rows = Array.from(document.querySelectorAll('.lt-main-table tbody tr.el-table__row'));
    const x = rows.find((r) => ((r.querySelector('.cc-id') || {}).textContent || '').trim() === 'CCFG004-HOLDER');
    return !!x && !!x.querySelector('.cc-inactive-mark');
  }, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(300);
  R.flows.afterB = { at: stamp(), ...(await listInfo()), holder: await rowState('CCFG004-HOLDER') };

  // wait until held A has been released and delivered
  await page.waitForFunction(() => true, null, { timeout: 1000 }).catch(() => {});
  const deadline = Date.now() + 8000;
  while (held && Date.now() < deadline) await page.waitForTimeout(100);
  await page.waitForTimeout(1200);
  R.flows.afterLateA = { at: stamp(), ...(await listInfo()), holder: await rowState('CCFG004-HOLDER') };
  holdMode = false;

  // order summary
  const A = R.listRequests.find((x) => x.held);
  const B = R.listRequests.slice().reverse().find((x) => !x.held && x.idx > (A ? A.idx : 0));
  R.flows.order = A && B ? {
    A_idx: A.idx, B_idx: B.idx,
    A_startedAt: A.startedAt, B_startedAt: B.startedAt,
    A_respondedAt: A.respondedAt, B_respondedAt: B.respondedAt,
    A_held: true,
    A_startedBeforeB: A.startedAt < B.startedAt,
    A_deliveredAfterB: (A.respondedAt || 0) > (B.respondedAt || 0),
    confirmedAt,
  } : null;

  R.flows.toast = (await page.$$eval('.el-message', (els) => els.map((e) => (e.textContent || '').trim()))).filter(Boolean);

  // restore HOLDER to enabled
  {
    const rr = await row('CCFG004-HOLDER');
    await rr.locator('.cc-more-link').click();
    await page.waitForTimeout(250);
    await page.locator('.cc-more-popper:visible .el-dropdown-menu__item:visible', { hasText: '启用' }).first().click();
    await page.locator('.el-message-box.cc-confirm--enable').waitFor({ state: 'visible' });
    await page.locator('.el-message-box.cc-confirm--enable .el-message-box__btns button', { hasText: '启用' }).click();
    await page.waitForTimeout(2600);
    R.flows.restored = await rowState('CCFG004-HOLDER');
  }

  R.final = { ...(await listInfo()), counts: R.gate };
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
  console.log(JSON.stringify({ flows: R.flows, listRequests: R.listRequests, events: R.events, gate: R.gate, errors: R.errors }, null, 1));
  await browser.close();
})().catch((e) => { R.errors.push(String(e && e.stack || e)); try { fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); } catch (x) {} console.error('FATAL', e); process.exit(1); });
