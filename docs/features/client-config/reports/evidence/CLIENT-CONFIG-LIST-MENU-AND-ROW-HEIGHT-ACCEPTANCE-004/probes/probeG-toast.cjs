const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core');
const fs = require('fs');
const PATH = '/api/clients/CCFG004-HOLDER/disable';
const OUT = '/tmp/004/toast-raw.json';
const t0 = Date.now();
const stamp = () => Date.now() - t0;
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const out = { events: [], samples: [], counts: {}, errors: [] };
  page.on('pageerror', (e) => out.errors.push(String(e)));
  await page.route('**/api/**', async (route) => {
    const r = route.request();
    const m = r.method();
    if (m === 'GET' || m === 'OPTIONS') { await route.continue(); return; }
    const allowed = m === 'PUT' && (r.url().endsWith(PATH) || r.url().endsWith('/api/clients/CCFG004-HOLDER/enable'));
    if (!allowed) { out.events.push({ t: stamp(), ev: 'blocked', m, u: r.url() }); await route.abort(); return; }
    out.counts.write = (out.counts.write || 0) + 1;
    out.events.push({ t: stamp(), ev: 'request-start', u: r.url() });
    if (!r.url().endsWith(PATH)) { await route.continue(); return; }
    await new Promise((res) => setTimeout(res, 2000));
    out.events.push({ t: stamp(), ev: 'forwarding' });
    await route.continue();
  });
  page.on('response', (r) => { if (r.request().method() !== 'GET') out.events.push({ t: stamp(), ev: 'response', s: r.status(), u: r.url() }); });
  await page.goto('http://127.0.0.1:5173/config/client', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.lt-main-table tbody tr.el-table__row').length > 0, null, { timeout: 20000 });
  await page.waitForTimeout(600);
  async function row(id) {
    const rows = page.locator('.lt-main-table tbody tr.el-table__row');
    const n = await rows.count();
    for (let i = 0; i < n; i++) { const t = (await rows.nth(i).locator('.cc-id').innerText().catch(() => '')).trim(); if (t === id) return rows.nth(i); }
    throw new Error('no row ' + id);
  }
  const r = await row('CCFG004-HOLDER');
  await r.locator('td').first().click();
  await page.waitForTimeout(300);
  await r.locator('.cc-more-link').click();
  await page.waitForTimeout(300);
  await page.locator('.cc-more-popper:visible .el-dropdown-menu__item:visible', { hasText: '停用' }).first().click();
  await page.locator('.el-message-box.cc-confirm--disable').waitFor({ state: 'visible' });
  await page.locator('.el-message-box.cc-confirm--disable .el-message-box__btns button', { hasText: '停用' }).click();
  out.events.push({ t: stamp(), ev: 'confirm-clicked' });
  const end = Date.now() + 7000;
  while (Date.now() < end) {
    const m = await page.$$eval('.el-message', (els) => els.map((e) => ({ text: (e.textContent || '').trim(), cls: e.className, disp: getComputedStyle(e).display, op: getComputedStyle(e).opacity, h: e.getBoundingClientRect().height })));
    out.samples.push({ t: stamp(), m });
    await page.waitForTimeout(200);
  }
  const rowState = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.lt-main-table tbody tr.el-table__row'));
    const r = rows.find((x) => ((x.querySelector('.cc-id') || {}).textContent || '').trim() === 'CCFG004-HOLDER');
    return { present: !!r, mark: r ? ((r.querySelector('.cc-inactive-mark') || {}).textContent || '').trim() : null, hl: r ? r.className.includes('lt-row-highlight__row') : null };
  });
  out.rowState = rowState;
  // restore: enable back
  await r.locator('.cc-more-link').click();
  await page.waitForTimeout(250);
  await page.locator('.cc-more-popper:visible .el-dropdown-menu__item:visible', { hasText: '启用' }).first().click();
  await page.locator('.el-message-box.cc-confirm--enable').waitFor({ state: 'visible' });
  await page.locator('.el-message-box.cc-confirm--enable .el-message-box__btns button', { hasText: '启用' }).click();
  await page.waitForTimeout(2500);
  out.restore = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.lt-main-table tbody tr.el-table__row'));
    const r = rows.find((x) => ((x.querySelector('.cc-id') || {}).textContent || '').trim() === 'CCFG004-HOLDER');
    return { present: !!r, mark: r ? ((r.querySelector('.cc-inactive-mark') || {}).textContent || '').trim() : null };
  });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
