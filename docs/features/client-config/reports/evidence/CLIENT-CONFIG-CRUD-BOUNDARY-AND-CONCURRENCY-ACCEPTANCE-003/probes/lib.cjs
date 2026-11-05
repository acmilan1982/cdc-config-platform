const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core');
const CHROME = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:5173';
const API = 'http://127.0.0.1:8080';

async function openPage(opts = {}) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: opts.width || 1440, height: opts.height || 900 } });
  const page = await context.newPage();
  const calls = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/clients')) {
      const rec = { method: r.method(), url: r.url(), body: r.postData() && r.postData(), t0: Date.now(), resp: null };
      calls.push(rec);
      r.__rec = rec;
    }
  });
  page.on('response', async (r) => {
    const rec = r.request().__rec;
    if (!rec) return;
    rec.status = r.status();
    rec.t1 = Date.now();
    try { rec.respBody = await r.text(); } catch (e) { rec.respBody = null; }
  });
  await page.goto(BASE + '/config/client', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.cc-table', { timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('.cc-src[data-client-id]').length > 20, null, { timeout: 20000 });
  await page.waitForTimeout(500);
  return { browser, context, page, calls };
}

function rowOf(page, clientId) {
  return page.locator(`.cc-src[data-client-id="${clientId}"]`).locator('xpath=ancestor::tr');
}

async function rowExists(page, clientId) {
  return (await page.locator(`.cc-src[data-client-id="${clientId}"]`).count()) > 0;
}

async function selectRow(page, clientId) {
  await page.locator(`.cc-id-cell .cc-id`).filter({ hasText: new RegExp('^' + clientId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click();
  await page.waitForTimeout(150);
}

async function selectedIds(page) {
  return await page.locator('tr.lt-row-highlight__row .cc-id').evaluateAll((els) => els.map((e) => e.textContent.trim()));
}

async function openMenu(page, clientId) {
  await page.locator(`.cc-more-link[aria-label="更多操作：${clientId}"]`).click();
  await page.waitForSelector('.cc-more-popper:visible .el-dropdown-menu__item', { state: 'visible', timeout: 5000 });
}

async function clickMenu(page, text, cls) {
  const sel = cls ? `.cc-more-popper:visible ${cls}` : '.cc-more-popper:visible .el-dropdown-menu__item';
  const item = page.locator(sel).filter({ hasText: new RegExp('^' + text + '$') }).first();
  await item.click();
  await page.waitForTimeout(200);
}

async function messageBox(page) {
  await page.waitForSelector('.el-message-box', { state: 'visible', timeout: 5000 });
  const box = page.locator('.el-message-box').first();
  return {
    title: (await box.locator('.el-message-box__title').innerText()).trim(),
    content: (await box.locator('.el-message-box__message').innerText()).trim(),
    buttons: await box.locator('.el-message-box__btns button').evaluateAll((els) => els.map((e) => e.textContent.trim())),
    customClass: await box.evaluate((e) => e.className),
    visible: true,
  };
}

async function clickBoxButton(page, text) {
  await page.locator('.el-message-box__btns button').filter({ hasText: new RegExp('^' + text + '$') }).first().click();
}

async function boxGone(page) {
  await page.waitForSelector('.el-message-box', { state: 'hidden', timeout: 8000 });
}

function writes(calls, method, pattern) {
  return calls.filter((c) => c.method === method && new RegExp(pattern).test(c.url));
}

async function waitIdle(page, ms = 600) { await page.waitForTimeout(ms); }

async function openCreate(page) {
  await page.locator('.cc-btn-add').click();
  await page.waitForSelector('.cc-dialog', { state: 'visible', timeout: 8000 });
  await page.waitForFunction(() => document.querySelectorAll('.cc-dialog .cc-opt').length > 0, null, { timeout: 20000 });
}

async function chooseSource(page, id) {
  const search = page.locator('.cc-dialog .cc-search input');
  await search.fill(id);
  await page.waitForTimeout(300);
  const opt = page.locator('.cc-dialog .cc-opt').filter({ hasText: id }).first();
  const info = { visible: await opt.isVisible().catch(() => false), disabled: await opt.isDisabled().catch(() => null), text: await opt.innerText().catch(() => null) };
  await opt.click();
  await page.waitForTimeout(150);
  return info;
}

async function fieldErrors(page) {
  return await page.locator('.cc-dialog .ced-field-error').evaluateAll((els) => els.map((e) => e.textContent.trim()).filter(Boolean));
}

async function closeDialog(page) {
  await page.locator('.cc-dialog .el-dialog__footer button').filter({ hasText: /^取消$/ }).click();
  await page.waitForSelector('.cc-dialog', { state: 'hidden', timeout: 8000 });
}

async function clickSubmit(page) {
  await page.locator('.cc-dialog-submit').click();
}

async function waitPost(page) {
  const p = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/clients$/.test(r.url()), { timeout: 15000 });
  const resp = await p;
  let body = null; try { body = await resp.text(); } catch (e) {}
  return { status: resp.status(), body, url: resp.url() };
}

module.exports = { chromium, BASE, API, openPage, rowOf, rowExists, selectRow, selectedIds, openMenu, clickMenu, messageBox, clickBoxButton, boxGone, writes, waitIdle, openCreate, chooseSource, fieldErrors, closeDialog, clickSubmit, waitPost };
