const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core');
const fs = require('fs');
const OUT = '/tmp/004/edit-fail-raw.json';
const pathOf = (u) => { try { return new globalThis.URL(u).pathname; } catch (e) { return u; } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome', headless: true });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const R = { task: '004', mode: 'write-gated-live-edit-failure', gate: { nonGetAttempts: 0, blocked: [], injected: [] }, flows: {}, errors: [] };
  p.on('pageerror', (e) => R.errors.push(String(e)));
  await p.route('**/api/**', async (route) => {
    const r = route.request();
    const m = r.method();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') { await route.continue(); return; }
    R.gate.nonGetAttempts += 1;
    const path = pathOf(r.url());
    if (m === 'PUT' && path === '/api/clients/CCFG004-NEW1') {
      R.gate.injected.push({ m, path });
      await new Promise((x) => setTimeout(x, 1200));
      await route.abort('failed');
      return;
    }
    R.gate.blocked.push({ m, path });
    await route.abort('blockedbyclient');
  });
  async function row(id) {
    const rows = p.locator('.lt-main-table tbody tr.el-table__row');
    const n = await rows.count();
    for (let i = 0; i < n; i++) { const t = (await rows.nth(i).locator('.cc-id').innerText().catch(() => '')).trim(); if (t === id) { await rows.nth(i).scrollIntoViewIfNeeded(); return rows.nth(i); } }
    throw new Error('no row ' + id);
  }
  await p.goto('http://127.0.0.1:5173/config/client', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelectorAll('.lt-main-table tbody tr.el-table__row').length > 0, null, { timeout: 20000 });
  await p.waitForTimeout(700);
  const r = await row('CCFG004-NEW1');
  await r.locator('td').first().dblclick();
  await p.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible', timeout: 8000 });
  await p.waitForTimeout(500);
  const desc = 'CCFG004 edit failure probe synthetic desc. Not a real runtime probe.';
  await p.locator('.el-dialog.cc-dialog .cc-desc-row textarea').fill(desc);
  const beforeBtn = await p.locator('.el-dialog.cc-dialog .cc-dialog-submit').evaluate((el) => ({ cls: el.className, disabled: el.disabled, text: (el.textContent || '').trim() }));
  const pFail = p.waitForEvent('requestfailed', { timeout: 15000, predicate: (x) => x.method() === 'PUT' && pathOf(x.url()) === '/api/clients/CCFG004-NEW1' }).catch(() => null);
  const pReq = p.waitForRequest((x) => x.method() === 'PUT' && pathOf(x.url()) === '/api/clients/CCFG004-NEW1', { timeout: 10000 }).catch(() => null);
  await p.locator('.el-dialog.cc-dialog .cc-dialog-submit').click();
  await pReq;
  await p.waitForTimeout(250);
  const pendingBtn = await p.locator('.el-dialog.cc-dialog .cc-dialog-submit').evaluate((el) => ({ cls: el.className, disabled: el.disabled, text: (el.textContent || '').trim() }));
  const failed = await pFail;
  await p.waitForTimeout(500);
  const dialogOpen = await p.evaluate(() => { const ov = document.querySelector('.el-overlay'); return !!ov && getComputedStyle(ov).display !== 'none'; });
  const messages = (await p.$$eval('.el-message', (els) => els.map((e) => (e.textContent || '').trim()))).filter(Boolean);
  const fieldErrors = await p.$$eval('.el-dialog.cc-dialog .ced-field-error, .el-dialog.cc-dialog .cc-field-error', (els) => els.map((e) => (e.textContent || '').trim()));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  const rowAfter = await p.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.lt-main-table tbody tr.el-table__row'));
    const x = rows.find((z) => ((z.querySelector('.cc-id') || {}).textContent || '').trim() === 'CCFG004-NEW1');
    return x ? { present: true, desc: (x.querySelector('.cc-desc') || {}).textContent || null } : { present: false };
  });
  R.flows.editFailure = { beforeBtn, pendingBtn, requestFailed: !!failed, dialogOpen, messages, fieldErrors, rowAfter };
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1));
  await b.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
