const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core');
const fs = require('fs');

const URL = 'http://127.0.0.1:5173/config/client';
const OUT = '/tmp/004/readonly-c-raw.json';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: true,
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const result = { task: '004', mode: 'readonly-live-c', gate: { nonGetAttempts: 0, attempts: [] }, errors: [], getLog: [] };

  page.on('pageerror', (e) => result.errors.push(String(e)));
  page.on('request', (req) => {
    const m = req.method();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return;
    result.gate.nonGetAttempts += 1;
    result.gate.attempts.push({ method: m, url: req.url() });
  });

  let mode = 'normal';
  let delayed = false;
  let failNext = false;
  let listReq = 0;
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    if (req.method() !== 'GET' && req.method() !== 'HEAD' && req.method() !== 'OPTIONS') {
      await route.abort();
      return;
    }
    if (req.url().includes('/api/clients') && !req.url().includes('data-source-options')) {
      listReq += 1;
      const n = listReq;
      result.getLog.push({ n, url: req.url() });
      if (failNext) {
        failNext = false;
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'synthetic' }) });
        return;
      }
      if (delayed) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
    await route.continue();
  });

  async function snap(label) {
    return await page.evaluate((label) => {
      const q = (s) => document.querySelector(s);
      const mask = q('.el-loading-mask');
      const maskVisible = !!mask && getComputedStyle(mask).display !== 'none' && mask.getBoundingClientRect().height > 0;
      const queryBtn = q('.ql-actions__query');
      const spinner = q('.ql-actions__query .ql-btn-spinner');
      const err = q('.cc-load-error');
      const retry = err ? err.querySelector('button') : null;
      const rows = document.querySelectorAll('.lt-main-table .el-table__body tbody tr');
      const fixed = document.querySelectorAll('.lt-row-highlight__row');
      const header = q('.lt-main-table .el-table__header-wrapper');
      const headerCell = q('.lt-main-table .el-table__header th');
      const body = q('.lt-main-table .el-table__body-wrapper');
      return {
        label,
        maskVisible,
        queryBtnClass: queryBtn ? queryBtn.className : null,
        queryBtnDisabled: queryBtn ? queryBtn.disabled : null,
        spinnerVisible: !!spinner && getComputedStyle(spinner).display !== 'none' && spinner.getBoundingClientRect().width > 0,
        errorVisible: !!err && getComputedStyle(err).display !== 'none',
        errorText: err ? err.innerText.replace(/\s+/g, ' ').trim() : null,
        retryVisible: !!retry && retry.getBoundingClientRect().height > 0,
        rowCount: rows.length,
        fixedCount: fixed.length,
        fixedIds: Array.from(fixed).map((r) => (r.querySelector('.cc-id') || {}).textContent || '').slice(0, 3),
        headerTop: headerCell ? headerCell.getBoundingClientRect().top : null,
        bodyTop: body ? body.getBoundingClientRect().top : null,
        windowScrollY: window.scrollY,
        docScrollTop: document.scrollingElement ? document.scrollingElement.scrollTop : null,
        innerHeight: window.innerHeight,
      };
    }, label);
  }

  async function waitListReady() {
    await page.waitForFunction(() => document.querySelectorAll('.lt-main-table .el-table__body tbody tr').length > 0, null, { timeout: 15000 });
    await page.waitForTimeout(400);
  }

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await waitListReady();
  result.initial = await snap('initial');
  result.initialListGets = listReq;

  // ---- 1. controlled delay: loading stability + selection cleared at request start
  const firstFixed = 'CCFG004-ON';
  await page.evaluate((id) => {
    const rows = Array.from(document.querySelectorAll('.lt-main-table .el-table__body tbody tr'));
    const row = rows.find((r) => (r.querySelector('.cc-id') || {}).textContent === id);
    if (row) row.querySelector('td').click();
  }, firstFixed);
  await page.waitForTimeout(350);
  result.beforeDelay = await snap('before-delay');
  result.beforeDelay.fixedIds = await page.evaluate(() => Array.from(document.querySelectorAll('.lt-row-highlight__row')).map((r) => (r.querySelector('.cc-id') || {}).textContent));

  delayed = true;
  const query = page.locator('.ql-actions__query');
  await query.click();
  const samples = [];
  samples.push(await snap('delay+120ms'));
  await page.waitForTimeout(500);
  samples.push(await snap('delay+620ms'));
  await page.waitForTimeout(450);
  samples.push(await snap('delay+1070ms'));
  await page.waitForFunction(() => !document.querySelector('.el-loading-mask') || getComputedStyle(document.querySelector('.el-loading-mask')).display === 'none', null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
  samples.push(await snap('delay-done'));
  delayed = false;
  result.delay = { samples, listReq: listReq, rowCount: samples[samples.length - 1].rowCount };

  await page.waitForTimeout(300);

  // ---- 2. controlled failure: error slot + previous rows retained + selection cleared
  await page.evaluate((id) => {
    const rows = Array.from(document.querySelectorAll('.lt-main-table .el-table__body tbody tr'));
    const row = rows.find((r) => (r.querySelector('.cc-id') || {}).textContent === id);
    if (row) row.querySelector('td').click();
  }, firstFixed);
  await page.waitForTimeout(350);
  result.beforeFailure = await snap('before-failure');
  result.beforeFailure.fixedIds = await page.evaluate(() => Array.from(document.querySelectorAll('.lt-row-highlight__row')).map((r) => (r.querySelector('.cc-id') || {}).textContent));

  failNext = true;
  const beforeFailReq = listReq;
  await query.click();
  await page.waitForTimeout(1200);
  result.failure = await snap('after-failure');
  result.failure.listReqDelta = listReq - beforeFailReq;
  result.failure.rowsRetained = result.failure.rowCount;
  result.failure.errorText = await page.evaluate(() => {
    const e = document.querySelector('.cc-load-error');
    return e ? e.innerText.replace(/\s+/g, ' ').trim() : null;
  });

  // ---- 3. retry: one GET, loading, success, error gone, selection cleared
  const beforeRetryReq = listReq;
  const retryBtn = page.locator('.cc-load-error button');
  await retryBtn.click();
  await page.waitForTimeout(120);
  result.retryPending = await snap('retry+120ms');
  await page.waitForFunction(() => !document.querySelector('.cc-load-error') || getComputedStyle(document.querySelector('.cc-load-error')).display === 'none' || !document.querySelector('.cc-load-error'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(700);
  result.retryDone = await snap('retry-done');
  result.retryDone.listReqDelta = listReq - beforeRetryReq;
  result.retryDone.fixedIds = await page.evaluate(() => Array.from(document.querySelectorAll('.lt-row-highlight__row')).map((r) => (r.querySelector('.cc-id') || {}).textContent));

  // ---- 4. header/fixed column behavior on vertical window scroll
  const beforeScroll = await snap('before-scroll');
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(400);
  const afterScroll = await snap('after-scroll-900');
  const widths = await page.evaluate(() => {
    const wrap = document.querySelector('.lt-main-table .el-scrollbar__wrap') || document.querySelector('.lt-main-table .el-table__body-wrapper .el-scrollbar__wrap');
    const th = document.querySelectorAll('.lt-main-table .el-table__header th');
    const lastTh = th[th.length - 1];
    const last = document.querySelector('.lt-main-table .el-table__body tbody tr td.lt-row-action__cell');
    return {
      wrap: wrap ? { clientW: wrap.clientWidth, scrollW: wrap.scrollWidth, clientH: wrap.clientHeight, scrollH: wrap.scrollHeight } : null,
      lastThRight: lastTh ? lastTh.getBoundingClientRect().right : null,
      viewportW: window.innerWidth,
      lastTdRight: last ? last.getBoundingClientRect().right : null,
    };
  });
  result.scroll = { beforeScroll, afterScroll, widths };
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  result.finalListReq = listReq;
  result.gateFinal = result.gate;
  fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
  console.log('WROTE', OUT);
  console.log(JSON.stringify({ initial: result.initial, delay: result.delay.samples.map((s) => ({ label: s.label, mask: s.maskVisible, spinner: s.spinnerVisible, rows: s.rowCount, fixed: s.fixedCount })), failure: { err: result.failure.errorVisible, text: result.failure.errorText, rows: result.failure.rowsRetained, fixed: result.failure.fixedCount }, retryPending: { mask: result.retryPending.maskVisible, spinner: result.retryPending.spinnerVisible }, retryDone: { err: result.retryDone.errorVisible, rows: result.retryDone.rowCount, fixed: result.retryDone.fixedCount }, scroll: result.scroll, gate: result.gate, errors: result.errors, listReq }, null, 1));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
