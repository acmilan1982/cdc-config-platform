/*
 * §11.6 request state machine, observed on the REAL 5173 page.
 * BR for the integration-observable parts (initial 1 GET, countdown 0 GET,
 * single-flight burst, click-instant query snapshot, reset 0 GET, hidden freeze,
 * non-GET 0, console 0). BI (response substitution, clearly labelled) only for
 * the failure / empty / slow cases the live backend cannot produce on demand.
 */
const fs = require('fs');
const path = require('path');
const h = require('./harness.cjs');
const { lib } = h;

const X = 'hosp-012';
const Y = 'c-dssr1-0906-a';
const Z = 'c-dssr1-0906-d';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pickClient(page, id) {
  await h.openPanel(page, 'client');
  const idx = await page.evaluate((v) => Array.from(document.querySelectorAll('.dss-client-popper .el-select-dropdown__item')).findIndex((li) => li.getAttribute('data-dss-client-id') === v), id);
  if (idx < 0) throw new Error('client option not found: ' + id);
  await h.clickOption(page, 'client', idx);
  await h.closePanel(page, 'client');
}

async function clearClients(page) {
  await h.openPanel(page, 'client');
  await page.locator('.dss-client-popper .el-select-dropdown__item').nth(0).click({ force: true });
  await page.waitForTimeout(200);
  await h.closePanel(page, 'client');
}

const appliedTags = () => Array.from(document.querySelectorAll('.dss-client-select .el-tag')).map((t) => t.innerText.trim());

async function main() {
  const out = { mode: 'request-state-machine', route: lib.BASE + lib.ROUTE, biLabel: 'BI phases substitute the list response; labelled per phase', phases: {}, assertions: [], global: { consoleErrors: [], nonGet: [] } };
  const A = (name, ok, detail) => out.assertions.push({ name, ok, detail: detail === undefined ? '' : detail });

  const { browser, page, ctx, log } = await lib.launch(lib.VIEWPORTS[2]);
  await lib.installMeasure(page);

  const gets = [];
  let mode = 'ok';
  const payload = { ok: null, fail: null, empty: null };
  const listRe = /\/api\/monitor\/data-source-run-state\/list/;

  page.on('request', (r) => { if (listRe.test(r.url())) gets.push({ method: r.method(), url: r.url(), t: Date.now() }); });

  // Route only the failure/empty/slow scenarios; 'ok' continues to the real backend.
  await page.route('**/api/monitor/data-source-run-state/list**', async (route) => {
    if (mode === 'fail') return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'injected failure' }) });
    if (mode === 'empty') {
      if (!payload.empty) { const real = await route.fetch(); payload.empty = await real.json(); }
      const body = JSON.parse(JSON.stringify(payload.empty));
      body.data.records = [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    }
    if (mode === 'slow') { await sleep(1800); return route.continue(); }
    return route.continue();
  });

  // ---------------- 1. initial: exactly one GET
  gets.length = 0;
  await lib.openPage(page);
  await sleep(3500);
  const initialGets = gets.filter((g) => g.method === 'GET' && listRe.test(g.url));
  out.phases.initial = { getCount: initialGets.length, urls: initialGets.map((g) => g.url) };
  A('initialExactlyOneGet', initialGets.length === 1, String(initialGets.length));
  A('initialUsesAllCriteria', initialGets.length === 1 && !/[?&](clientId|sourceId|status)=/.test(initialGets[0].url), initialGets[0] && initialGets[0].url);

  // ---------------- 2. countdown ticking produces 0 requests
  {
    const before = gets.length;
    await sleep(10000);
    const during = gets.filter((g) => g.method === 'GET').length - before;
    const cd = await page.evaluate(() => document.querySelector('.dss-countdown-seconds') ? document.querySelector('.dss-countdown-seconds').innerText : null);
    out.phases.countdown = { requestsDuringTick: during, countdownSeconds: cd };
    A('countdownTickZeroRequests', during === 0, String(during));
  }

  // ---------------- 3. query uses the click-instant condition snapshot
  {
    await pickClient(page, X);
    gets.length = 0;
    await page.locator('.dss-query-btn').click();
    await sleep(900);
    const g = gets.find((x) => x.method === 'GET');
    out.phases.query = { url: g && g.url };
    A('queryUsesClickedSelection', !!g && new URL(g.url).searchParams.getAll('clientId').includes(X), g && g.url);
  }

  // ---------------- 4. reset resets UI only, issues 0 requests
  {
    const tagsBefore = await page.evaluate(appliedTags);
    gets.length = 0;
    await page.locator('.dss-reset-btn').click();
    await sleep(1200);
    const tagsAfterReset = await page.evaluate(appliedTags);
    out.phases.reset = { requestsAfterReset: gets.length, tagsBefore, tagsAfterReset };
    A('resetZeroRequests', gets.length === 0, String(gets.length));
    // reset restores the three dims to the "全部" sentinel (not an empty select)
    A('resetRestoresAllSentinel', tagsAfterReset.length === 1 && tagsAfterReset[0] === '全部', JSON.stringify(tagsAfterReset));
    // applied conditions unchanged: manual refresh still uses X
    gets.length = 0;
    await page.locator('.dss-refresh-btn').click();
    await sleep(900);
    const g = gets.find((x) => x.method === 'GET');
    A('resetKeepsAppliedCriteria', !!g && new URL(g.url).searchParams.getAll('clientId').includes(X), g && g.url);
  }

  // ---------------- 5. single-flight: >=40 triggers during one in-flight request -> 1 GET
  {
    mode = 'slow';
    gets.length = 0;
    await page.locator('.dss-refresh-btn').click();
    await sleep(250); // request now in flight
    const burst = await page.evaluate(async () => {
      const btn = document.querySelector('.dss-refresh-btn');
      const q = document.querySelector('.dss-query-btn');
      let n = 0;
      for (let i = 0; i < 40; i += 1) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        q.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        btn.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
        n += 4;
        await new Promise((r) => setTimeout(r, 20));
      }
      return n;
    });
    await sleep(2400);
    mode = 'ok';
    const inWindow = gets.filter((g) => g.method === 'GET');
    out.phases.singleFlight = { burstEvents: burst, getCount: inWindow.length, urls: inWindow.map((g) => g.url) };
    A('singleFlightBurstAtLeast40', burst >= 40, String(burst));
    A('singleFlightExactlyOneGet', inWindow.length === 1, JSON.stringify(inWindow.map((g) => g.url)));
  }

  // ---------------- 6. failure keeps old results / applied criteria; UI selection retained
  // Console-error baseline is taken BEFORE any injected failure: phase 6 deliberately
  // injects a 500, which the browser reports as a console error by design.
  const consoleErrorsBeforeInjection = log.consoleErrors.length;
  {
    await pickClient(page, X);
    await page.locator('.dss-query-btn').click();
    await sleep(900);
    const rowsBefore = await page.evaluate(() => document.querySelectorAll('.dss-table .el-table__body tbody tr').length);
    const summaryBefore = await page.evaluate(() => document.querySelector('.dss-summary-count').innerText);
    const refreshTimeBefore = await page.evaluate(() => document.querySelector('.dss-refresh-time').innerText);
    // change UI selection to Y, then fail the query
    await pickClient(page, Y);
    mode = 'fail';
    await page.locator('.dss-query-btn').click();
    await sleep(1200);
    const rowsAfter = await page.evaluate(() => document.querySelectorAll('.dss-table .el-table__body tbody tr').length);
    const summaryAfter = await page.evaluate(() => document.querySelector('.dss-summary-count').innerText);
    const refreshTimeAfter = await page.evaluate(() => document.querySelector('.dss-refresh-time').innerText);
    const uiAfter = await page.evaluate(appliedTags);
    const errSlot = await page.evaluate(() => { const e = document.querySelector('.dss-result-error-slot'); return e ? e.innerText.trim() : null; });
    out.phases.failure = { rowsBefore, rowsAfter, summaryBefore, summaryAfter, refreshTimeBefore, refreshTimeAfter, uiAfter, errSlot };
    A('failureKeepsRows', rowsBefore === rowsAfter && rowsBefore > 0, `${rowsBefore}->${rowsAfter}`);
    A('failureKeepsSummary', summaryBefore === summaryAfter, `${summaryBefore}->${summaryAfter}`);
    A('failureKeepsLastSuccessTime', refreshTimeBefore === refreshTimeAfter, `${refreshTimeBefore}->${refreshTimeAfter}`);
    // UI keeps BOTH concrete selections (the 2nd is collapsed into the "+1" tag, so count tags)
    A('failureRetainsUiSelection', uiAfter.length === 2 && uiAfter[0].includes(X) && uiAfter.some((t) => t.includes('+')), JSON.stringify(uiAfter));
    A('failureShowsInlineNotice', !!errSlot && errSlot.length > 0, JSON.stringify(errSlot));
    // applied criteria still X
    mode = 'ok';
    gets.length = 0;
    await page.locator('.dss-refresh-btn').click();
    await sleep(900);
    const g = gets.find((x) => x.method === 'GET');
    A('failureKeepsAppliedCriteria', !!g && new URL(g.url).searchParams.getAll('clientId').includes(X) && !new URL(g.url).searchParams.getAll('clientId').includes(Y), g && g.url);
  }

  // ---------------- 7. zero-row success is still success and upgrades applied criteria
  {
    await clearClients(page);
    await pickClient(page, Z);
    mode = 'empty';
    await page.locator('.dss-query-btn').click();
    await sleep(1200);
    const summary = await page.evaluate(() => document.querySelector('.dss-summary-count').innerText);
    const rows = await page.evaluate(() => document.querySelectorAll('.dss-table .el-table__body tbody tr').length);
    const errSlot = await page.evaluate(() => { const e = document.querySelector('.dss-result-error-slot'); return e ? e.innerText.trim() : null; });
    out.phases.emptySuccess = { summary, rows, errSlot };
    A('emptySuccessShowsZero', /共\s*0\s*条/.test(summary), summary);
    A('emptySuccessNoRows', rows === 0, String(rows));
    mode = 'ok';
    gets.length = 0;
    await page.locator('.dss-refresh-btn').click();
    await sleep(900);
    const g = gets.find((x) => x.method === 'GET');
    A('emptySuccessUpgradesAppliedCriteria', !!g && new URL(g.url).searchParams.getAll('clientId').includes(Z), g && g.url);
  }

  // ---------------- 8. hidden freezes; visible restores at most one
  {
    gets.length = 0;
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(6000);
    const duringHidden = gets.filter((g) => g.method === 'GET').length;
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(3000);
    const afterVisible = gets.filter((g) => g.method === 'GET').length;
    out.phases.hidden = { duringHidden, afterVisible };
    A('hiddenFreezesRequests', duringHidden === 0, String(duringHidden));
    A('visibleTriggersAtMostOne', afterVisible <= 1 && afterVisible >= 1, String(afterVisible));
  }

  out.global.consoleErrors = log.consoleErrors;
  out.global.consoleErrorsBeforeInjection = consoleErrorsBeforeInjection;
  out.global.consoleErrorsInjectedFailure = log.consoleErrors.slice(consoleErrorsBeforeInjection);
  out.global.nonGet = log.requests.filter((r) => !['GET', 'HEAD'].includes(r.method)).map((r) => `${r.method} ${r.url}`);
  A('consoleErrorsZeroOutsideInjectedFailure', consoleErrorsBeforeInjection === 0, JSON.stringify(log.consoleErrors.slice(0, consoleErrorsBeforeInjection)));
  A('nonGetZero', out.global.nonGet.length === 0, JSON.stringify(out.global.nonGet.slice(0, 3)));

  const fails = out.assertions.filter((a) => !a.ok);
  out.summary = { assertions: out.assertions.length, failed: fails.length };
  fs.writeFileSync(path.join(lib.OUT, 'requests.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`requests.json assertions=${out.assertions.length} failed=${fails.length}`);
  if (fails.length) console.log(fails.map((f) => `FAIL ${f.name}: ${f.detail}`).join('\n'));
  await ctx.close();
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
