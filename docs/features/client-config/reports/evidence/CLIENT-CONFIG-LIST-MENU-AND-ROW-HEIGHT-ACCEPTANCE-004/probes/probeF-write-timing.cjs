/**
 * 004 timing-corrected write probe: row-busy disabled items + success/failure toast feedback.
 * Synthetic CCFG004-* objects only. Every non-GET attempt is gated and counted.
 * Raw output stays outside the repo.
 */
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core');
const fs = require('fs');

const FRONT = 'http://127.0.0.1:5173';
const PAGE_URL = FRONT + '/config/client';
const OUT = '/tmp/004/write-timing-raw.json';

const R = {
  task: 'CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004',
  mode: 'write-gated-live-timing',
  gate: { nonGetAttempts: 0, blocked: [], forwarded: [], injected: [] },
  counts: {},
  flows: {},
  errors: [],
};

function pathOf(u) { try { return new globalThis.URL(u).pathname; } catch (e) { return u; } }
function bump(k) { R.counts[k] = (R.counts[k] || 0) + 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => R.errors.push(String(e)));

  const delays = [
    { method: 'PUT', path: '/api/clients/CCFG004-HOLDER/disable', ms: 3000 },
    { method: 'PUT', path: '/api/clients/CCFG004-HOLDER/enable', ms: 3000 },
  ];
  const aborts = [
    { method: 'PUT', path: '/api/clients/CCFG004-OFF/disable', ms: 2500 },
    { method: 'DELETE', path: '/api/clients/CCFG004-DEL2', ms: 2500 },
    { method: 'PUT', path: '/api/clients/CCFG004-OFF2/enable', ms: 2500 },
  ];

  function planned(method, path, body) {
    if (method === 'POST' && path === '/api/clients') return !!body && /^CCFG004-/.test(String(body.clientId || ''));
    if (method === 'PUT' && /^\/api\/clients\/CCFG004-[^/]+(\/enable|\/disable)?$/.test(path)) return true;
    if (method === 'DELETE' && /^\/api\/clients\/CCFG004-[^/]+$/.test(path)) return true;
    return false;
  }

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') { await route.continue(); return; }
    R.gate.nonGetAttempts += 1;
    const path = pathOf(req.url());
    let body = null;
    try { body = req.postDataJSON(); } catch (e) {}
    const clientId = body && body.clientId ? body.clientId : (path.match(/^\/api\/clients\/([^/]+)/) || [])[1] || null;
    const rec = { method, path, clientId };
    if (!planned(method, path, body)) { R.gate.blocked.push(rec); bump('pageBlocked'); await route.abort('blockedbyclient'); return; }
    const injection = aborts.find((a) => a.method === method && a.path === path);
    if (injection) {
      R.gate.injected.push(rec); bump('injected:' + method + ' ' + path);
      await new Promise((r) => setTimeout(r, injection.ms));
      await route.abort('failed');
      return;
    }
    const delay = delays.find((d) => d.method === method && d.path === path && (!d.clientId || d.clientId === clientId));
    R.gate.forwarded.push(rec); bump('forwarded:' + method + ' ' + path);
    if (delay) await new Promise((r) => setTimeout(r, delay.ms));
    await route.continue();
  });

  // ---------------- helpers ----------------
  async function listIds() {
    return (await page.$$eval('.lt-main-table tbody tr.el-table__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim())));
  }
  async function rowHandle(id) {
    const rows = page.locator('.lt-main-table tbody tr.el-table__row');
    const n = await rows.count();
    for (let i = 0; i < n; i++) {
      const t = (await rows.nth(i).locator('.cc-id').innerText().catch(() => '')).trim();
      if (t === id) { await rows.nth(i).scrollIntoViewIfNeeded(); return rows.nth(i); }
    }
    throw new Error('row not found: ' + id);
  }
  async function fixedIds() {
    return (await page.$$eval('.lt-main-table tbody tr.el-table__row.lt-row-highlight__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim())));
  }
  async function selectRow(id) {
    const row = await rowHandle(id);
    const cls = (await row.getAttribute('class')) || '';
    if (!cls.includes('lt-row-highlight__row')) { await row.locator('td').first().click(); await page.waitForTimeout(320); }
    return fixedIds();
  }
  async function fetchRow(id) {
    return await page.evaluate((id) => {
      const rows = Array.from(document.querySelectorAll('.lt-main-table tbody tr.el-table__row'));
      const row = rows.find((r) => ((r.querySelector('.cc-id') || {}).textContent || '').trim() === id);
      return row ? { highlighted: row.className.includes('lt-row-highlight__row') } : null;
    }, id);
  }
  async function openMenu(id) {
    await page.locator('.cc-more-popper:visible').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    const row = await rowHandle(id);
    await row.locator('.cc-more-link').click();
    const poppers = page.locator('.cc-more-popper:visible').filter({ has: page.locator('.el-dropdown-menu__item') });
    await poppers.first().waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(120);
    return poppers.first();
  }
  async function menuInfo(popper) {
    return await popper.locator('li').evaluateAll((lis) => lis.map((li) => ({
      role: li.getAttribute('role'),
      cls: li.className,
      text: (li.textContent || '').trim(),
      ariaDisabled: li.getAttribute('aria-disabled'),
      tabIndex: li.tabIndex,
      cursor: getComputedStyle(li).cursor,
      opacity: getComputedStyle(li).opacity,
    })));
  }
  async function triggerInfo(id) {
    return await page.evaluate((id) => {
      const rows = Array.from(document.querySelectorAll('.lt-main-table tbody tr.el-table__row'));
      const row = rows.find((r) => ((r.querySelector('.cc-id') || {}).textContent || '').trim() === id);
      const link = row ? row.querySelector('.cc-more-link') : null;
      if (!link) return null;
      const cs = getComputedStyle(link);
      return { cls: link.className, ariaDisabled: link.getAttribute('aria-disabled'), tabIndex: link.tabIndex, pointerEvents: cs.pointerEvents, cursor: cs.cursor, opacity: cs.opacity };
    }, id);
  }
  async function clickMenu(text) {
    const popper = page.locator('.cc-more-popper:visible').filter({ has: page.locator('.el-dropdown-menu__item') }).first();
    await popper.locator('.el-dropdown-menu__item:visible', { hasText: text }).first().click();
  }
  async function forceClickMenu(text) {
    return await page.evaluate((t) => {
      const poppers = Array.from(document.querySelectorAll('.cc-more-popper')).filter((p) => p.getBoundingClientRect().width > 0);
      const p = poppers[0];
      if (!p) return { clicked: false, reason: 'no-visible-popper' };
      const li = Array.from(p.querySelectorAll('li.el-dropdown-menu__item')).find((e) => (e.textContent || '').trim() === t);
      if (!li) return { clicked: false, reason: 'no-item' };
      li.click();
      return { clicked: true, cls: li.className, ariaDisabled: li.getAttribute('aria-disabled') };
    }, text);
  }
  async function closePopper() {
    await page.keyboard.press('Escape').catch(() => {});
    await page.locator('.cc-more-popper:visible').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }
  async function confirmBox(cls) {
    const box = page.locator(cls ? '.el-message-box.' + cls : '.el-message-box');
    await box.waitFor({ state: 'visible', timeout: 6000 });
    return {
      title: (await box.locator('.el-message-box__title').innerText()).trim(),
      body: (await box.locator('.el-message-box__message').innerText()).trim(),
      buttons: (await box.locator('.el-message-box__btns button').allInnerTexts()).map((s) => s.trim()).filter(Boolean),
    };
  }
  async function messages() {
    return (await page.$$eval('.el-message', (els) => els.map((e) => (e.textContent || '').trim()))).filter(Boolean);
  }
  async function waitListReload() {
    await page.waitForFunction(() => {
      const m = document.querySelector('.el-loading-mask');
      return !m || getComputedStyle(m).display === 'none';
    }, null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  function waitResponse(method, path) {
    return page.waitForResponse((r) => r.request().method() === method && pathOf(r.url()) === path, { timeout: 25000 }).catch(() => null);
  }
  function waitRequestFailed(method, path) {
    return page.waitForEvent('requestfailed', { timeout: 25000, predicate: (r) => r.method() === method && pathOf(r.url()) === path }).catch(() => null);
  }
  async function readRowState(id) {
    return await page.evaluate((id) => {
      const rows = Array.from(document.querySelectorAll('.lt-main-table tbody tr.el-table__row'));
      const row = rows.find((r) => ((r.querySelector('.cc-id') || {}).textContent || '').trim() === id);
      if (!row) return { present: false };
      const mark = row.querySelector('.cc-inactive-mark');
      const abn = row.querySelector('.cc-abnormal-mark');
      return {
        present: true,
        highlighted: row.className.includes('lt-row-highlight__row'),
        inactiveMark: mark ? (mark.textContent || '').trim() : null,
        abnormalMark: abn ? (abn.textContent || '').trim() : null,
      };
    }, id);
  }

  // ---------------- start ----------------
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.lt-main-table tbody tr.el-table__row').length > 0, null, { timeout: 20000 });
  await page.waitForTimeout(700);
  R.flows.baseline = { rows: (await listIds()).length, fixed: await fixedIds() };

  // ===== 103/071: disable with slow success; busy items disabled; duplicate attempt blocked; toast =====
  await selectRow('CCFG004-HOLDER');
  {
    await openMenu('CCFG004-HOLDER');
    await clickMenu('停用');
    const box = await confirmBox('cc-confirm--disable');
    const pResp = waitResponse('PUT', '/api/clients/CCFG004-HOLDER/disable');
    const pReq = page.waitForRequest((r) => r.method() === 'PUT' && pathOf(r.url()) === '/api/clients/CCFG004-HOLDER/disable', { timeout: 10000 });
    await page.locator('.el-message-box.cc-confirm--disable .el-message-box__btns button', { hasText: '停用' }).click();
    await pReq.catch(() => {});
    await page.waitForTimeout(250);
    const busyMenu = await menuInfo(await openMenu('CCFG004-HOLDER'));
    const triggerDuringBusy = await triggerInfo('CCFG004-HOLDER');
    const beforeDup = R.counts['forwarded:PUT /api/clients/CCFG004-HOLDER/disable'] || 0;
    const dupAttempt = await forceClickMenu('停用');
    await page.waitForTimeout(500);
    const dupDelta = (R.counts['forwarded:PUT /api/clients/CCFG004-HOLDER/disable'] || 0) - beforeDup;
    await closePopper();
    const otherMenu = await menuInfo(await openMenu('CCFG004-DEL2'));
    await closePopper();
    const r = await pResp;
    await page.waitForTimeout(200);
    const toastAtResponse = await messages();
    await waitListReload();
    R.flows.disable_slow = {
      confirm: box,
      busyMenu,
      triggerDuringBusy,
      duplicateAttempt: { ...dupAttempt, writesDelta: dupDelta },
      otherRowMenu: otherMenu.filter((i) => i.role === 'menuitem').map((i) => ({ text: i.text, ariaDisabled: i.ariaDisabled, cls: i.cls })),
      http: r ? r.status() : null,
      toastAtResponse,
      rowAfter: await readRowState('CCFG004-HOLDER'),
      fixedAfter: await fixedIds(),
      writeCount: R.counts['forwarded:PUT /api/clients/CCFG004-HOLDER/disable'] || 0,
    };
  }

  // ===== 103/071: enable with slow success; busy; toast; reselect =====
  await selectRow('CCFG004-HOLDER');
  {
    await openMenu('CCFG004-HOLDER');
    await clickMenu('启用');
    const box = await confirmBox('cc-confirm--enable');
    const pResp = waitResponse('PUT', '/api/clients/CCFG004-HOLDER/enable');
    const pReq = page.waitForRequest((r) => r.method() === 'PUT' && pathOf(r.url()) === '/api/clients/CCFG004-HOLDER/enable', { timeout: 10000 });
    await page.locator('.el-message-box.cc-confirm--enable .el-message-box__btns button', { hasText: '启用' }).click();
    await pReq.catch(() => {});
    await page.waitForTimeout(250);
    const busyMenu = await menuInfo(await openMenu('CCFG004-HOLDER'));
    const beforeDup = R.counts['forwarded:PUT /api/clients/CCFG004-HOLDER/enable'] || 0;
    const dupAttempt = await forceClickMenu('启用');
    await page.waitForTimeout(500);
    const dupDelta = (R.counts['forwarded:PUT /api/clients/CCFG004-HOLDER/enable'] || 0) - beforeDup;
    await closePopper();
    const r = await pResp;
    await page.waitForTimeout(200);
    const toastAtResponse = await messages();
    await waitListReload();
    R.flows.enable_slow = {
      confirm: box,
      busyMenu,
      duplicateAttempt: { ...dupAttempt, writesDelta: dupDelta },
      http: r ? r.status() : null,
      toastAtResponse,
      rowAfter: await readRowState('CCFG004-HOLDER'),
      fixedAfter: await fixedIds(),
      writeCount: R.counts['forwarded:PUT /api/clients/CCFG004-HOLDER/enable'] || 0,
    };
  }

  // ===== 084/103: disable failure (network) - toast, busy reset, selection retained =====
  await selectRow('CCFG004-OFF');
  {
    await openMenu('CCFG004-OFF');
    await clickMenu('停用');
    const box = await confirmBox('cc-confirm--disable');
    const pFail = waitRequestFailed('PUT', '/api/clients/CCFG004-OFF/disable');
    await page.locator('.el-message-box.cc-confirm--disable .el-message-box__btns button', { hasText: '停用' }).click();
    await page.waitForTimeout(250);
    const busyMenu = await menuInfo(await openMenu('CCFG004-OFF'));
    await closePopper();
    const failed = await pFail;
    await page.waitForTimeout(400);
    const toast = await messages();
    const menuAfterReset = await menuInfo(await openMenu('CCFG004-OFF'));
    await closePopper();
    R.flows.disable_failure = {
      confirm: box,
      requestFailed: !!failed,
      busyMenu,
      toast,
      rowAfter: await readRowState('CCFG004-OFF'),
      fixedAfter: await fixedIds(),
      menuAfterReset: menuAfterReset.filter((i) => i.role === 'menuitem').map((i) => ({ text: i.text, ariaDisabled: i.ariaDisabled, cls: i.cls })),
      writeCount: R.counts['injected:PUT /api/clients/CCFG004-OFF/disable'] || 0,
    };
  }

  // ===== 084/103: delete failure (network) =====
  await selectRow('CCFG004-DEL2');
  {
    await openMenu('CCFG004-DEL2');
    await clickMenu('删除');
    const box = await confirmBox('');
    const pFail = waitRequestFailed('DELETE', '/api/clients/CCFG004-DEL2');
    await page.locator('.el-message-box .el-message-box__btns button', { hasText: '删除' }).click();
    await page.waitForTimeout(250);
    const busyMenu = await menuInfo(await openMenu('CCFG004-DEL2'));
    await closePopper();
    const failed = await pFail;
    await page.waitForTimeout(400);
    const toast = await messages();
    const menuAfterReset = await menuInfo(await openMenu('CCFG004-DEL2'));
    await closePopper();
    R.flows.delete_failure = {
      confirm: box,
      requestFailed: !!failed,
      busyMenu,
      toast,
      rowAfter: await readRowState('CCFG004-DEL2'),
      fixedAfter: await fixedIds(),
      menuAfterReset: menuAfterReset.filter((i) => i.role === 'menuitem').map((i) => ({ text: i.text, ariaDisabled: i.ariaDisabled, cls: i.cls })),
      writeCount: R.counts['injected:DELETE /api/clients/CCFG004-DEL2'] || 0,
    };
  }

  // ===== 084/103: enable failure (network) =====
  await selectRow('CCFG004-OFF2');
  {
    await openMenu('CCFG004-OFF2');
    await clickMenu('启用');
    const box = await confirmBox('cc-confirm--enable');
    const pFail = waitRequestFailed('PUT', '/api/clients/CCFG004-OFF2/enable');
    await page.locator('.el-message-box.cc-confirm--enable .el-message-box__btns button', { hasText: '启用' }).click();
    await page.waitForTimeout(250);
    const busyMenu = await menuInfo(await openMenu('CCFG004-OFF2'));
    await closePopper();
    const failed = await pFail;
    await page.waitForTimeout(400);
    const toast = await messages();
    const menuAfterReset = await menuInfo(await openMenu('CCFG004-OFF2'));
    await closePopper();
    R.flows.enable_failure = {
      confirm: box,
      requestFailed: !!failed,
      busyMenu,
      toast,
      rowAfter: await readRowState('CCFG004-OFF2'),
      fixedAfter: await fixedIds(),
      menuAfterReset: menuAfterReset.filter((i) => i.role === 'menuitem').map((i) => ({ text: i.text, ariaDisabled: i.ariaDisabled, cls: i.cls })),
      writeCount: R.counts['injected:PUT /api/clients/CCFG004-OFF2/enable'] || 0,
    };
  }

  R.final = { rows: (await listIds()).length, fixed: await fixedIds(), counts: R.counts, gate: R.gate };
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
  console.log(JSON.stringify({
    flows: Object.fromEntries(Object.entries(R.flows).map(([k, v]) => [k, {
      toast: v.toastAtResponse || v.toast || null,
      busy: (v.busyMenu || []).filter((i) => i.role === 'menuitem').map((i) => ({ t: i.text, d: i.ariaDisabled, c: i.cls })),
      dup: v.duplicateAttempt || null,
      rowAfter: v.rowAfter || null,
      fixed: v.fixedAfter || null,
      http: v.http ?? null,
      failed: v.requestFailed ?? null,
      writes: v.writeCount ?? null,
    }])),
    final: R.final, errors: R.errors,
  }, null, 1));
  await browser.close();
})().catch((e) => { R.errors.push(String(e && e.stack || e)); try { fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); } catch (x) {} console.error('FATAL', e); process.exit(1); });
