const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core');
const CHROME = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:5173';
const API = 'http://127.0.0.1:8080';

async function openPage(opts = {}) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: opts.width || 1440, height: opts.height || 900 } });
  const page = await context.newPage();
  const requests = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/clients')) requests.push({ method: r.method(), url: r.url(), body: r.postData() });
  });
  await page.goto(BASE + '/config/client', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.cc-table', { timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('.cc-src[data-client-id]').length > 10, null, { timeout: 20000 });
  await page.waitForFunction(() => {
    const el = document.querySelector('.cc-src[data-client-id="S2AC-P8"]');
    return !!el && el.scrollWidth <= el.clientWidth + 1 && !!el.querySelector('.cc-more');
  }, null, { timeout: 20000 });
  await page.waitForTimeout(400);
  return { browser, context, page, requests };
}

function rowOf(page, clientId) {
  return page.locator(`.cc-src[data-client-id="${clientId}"]`).locator('xpath=ancestor::tr');
}

async function visibleCount(page) {
  return await page.locator('.cc-single-tip').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).length);
}

async function tipState(page) {
  return await page.locator('.cc-single-tip').evaluateAll((els) => els.map((e) => ({
    visible: getComputedStyle(e).display !== 'none',
    lines: Array.from(e.querySelectorAll('.cc-single-line')).map((p) => ({ text: p.textContent, cls: p.className })),
    rect: (() => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })(),
  })).filter((t) => t.visible));
}

async function hoverTip(page, locator) {
  const t0 = Date.now();
  await locator.hover();
  let t = null;
  for (let i = 0; i < 60; i += 1) {
    const v = await visibleCount(page);
    if (v > 0) { t = Date.now() - t0; break; }
    await page.waitForTimeout(10);
  }
  await page.waitForTimeout(80);
  return { delayMs: t, tips: await tipState(page) };
}

async function selectedIds(page) {
  return await page.locator('tr.lt-row-highlight__row .cc-id').evaluateAll((els) => els.map((e) => e.textContent.trim()));
}

module.exports = { openPage, rowOf, visibleCount, tipState, hoverTip, selectedIds, API, BASE };
