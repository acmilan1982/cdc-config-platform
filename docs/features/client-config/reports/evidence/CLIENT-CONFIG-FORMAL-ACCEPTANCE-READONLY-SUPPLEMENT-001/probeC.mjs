// Probe C — list-page read-only cases: 098/099/100/102/106/117/012 (+ row-height ref).
// All /api/** writes intercepted before navigation; zero writes expected.
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = '/tmp/fa-ro-supplement-001';
const SHOTS = OUT + '/shots';
fs.mkdirSync(SHOTS, { recursive: true });

const writes = [];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route('**/api/**', async (route) => {
  const m = route.request().method().toUpperCase();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue();
  writes.push({ method: m, url: route.request().url() });
  return route.abort('blockedbyclient');
});
const page = await ctx.newPage();
await page.goto(BASE + '/config/client', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('.cc-table tbody tr', { timeout: 15000 });
await page.waitForTimeout(600);

const R = {};
const rowSel = (id) => `.cc-table tbody tr:has(.cc-src[data-client-id="${id}"])`;
const itemSel = '.cc-more-popper .el-dropdown-menu__item:visible';
const vis = (sel) => page.locator(sel + ':visible').count();
const menuVisible = () => vis('.cc-more-popper .el-dropdown-menu__item');

async function closeAnyMenu() {
  for (let i = 0; i < 3; i++) {
    if ((await menuVisible()) === 0) return true;
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    if ((await menuVisible()) === 0) return true;
    await page.locator(`${rowSel('hosp-012')} .cc-more-link`).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
  return (await menuVisible()) === 0;
}
async function openMenuFor(id) {
  await closeAnyMenu();
  await page.locator(`${rowSel(id)} .cc-more-link`).click();
  await page.waitForTimeout(350);
  try { await page.locator(itemSel).first().waitFor({ state: 'visible', timeout: 2500 }); await page.waitForTimeout(350); return true; } catch { return false; }
}
async function readMenuItems() {
  const items = page.locator(itemSel);
  const n = await items.count(); const out = [];
  for (let i = 0; i < n; i++) out.push((await items.nth(i).textContent()).trim());
  return out;
}

// ============ AC-100: entry form, accessible name, per-state menu items, 2 viewports ============
async function ac100(viewportTag) {
  const entry = await page.evaluate(() => [...document.querySelectorAll('.cc-table tbody tr')].map((tr) => {
    const link = tr.querySelector('.cc-more-link');
    const src = tr.querySelector('.cc-src');
    const id = src?.getAttribute('data-client-id') ?? tr.querySelector('.cc-id')?.textContent?.trim();
    const hasIcon = !!link?.querySelector('svg');
    const accName = link?.getAttribute('aria-label') ?? null;
    const txt = link?.textContent?.trim() ?? null;
    return { id, hasIcon, accName, text: txt, tabindex: link?.getAttribute('tabindex') };
  }));
  const states = { one: 'hosp-012', zero: 'hosp-001', abnormal: 'CCFG-AC-R1-ABN' };
  const menus = {};
  for (const [k, id] of Object.entries(states)) {
    const ok = await openMenuFor(id);
    menus[k] = { id, opened: ok, items: ok ? await readMenuItems() : null };
    await closeAnyMenu();
  }
  return { viewport: viewportTag, rowCount: entry.length, entryForms: entry, menus };
}

for (const [w, h] of [[1440, 900], [1920, 1080]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(500);
  R[`AC100_${w}x${h}`] = await ac100(`${w}x${h}`);
  await page.screenshot({ path: `${SHOTS}/ac100-${w}x${h}.png` });
}
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(400);

// ============ AC-098 / AC-010: tag counts + row heights across widths, per sample ============
async function measureSample(id) {
  return page.evaluate((cid) => {
    const src = document.querySelector(`.cc-src[data-client-id="${cid}"]`);
    if (!src) return { error: 'not found' };
    const tr = src.closest('tr');
    const tags = [...src.querySelectorAll('.cc-dstag')];
    const shownTags = tags.filter((t) => t.offsetParent !== null);
    const more = src.querySelector('.cc-more');
    const mRect = more ? more.getBoundingClientRect() : null;
    const sRect = src.getBoundingClientRect();
    return {
      clientId: cid, totalTags: tags.length, shown: shownTags.length,
      plus: more ? more.textContent.trim() : null,
      rowHeight: Math.round(tr.getBoundingClientRect().height),
      srcWidth: src.clientWidth, srcScrollWidth: src.scrollWidth,
      containerOverflowX: src.scrollWidth > src.clientWidth + 1,
      fitsInside: mRect ? mRect.right <= sRect.right + 1 : null,
      tagWidths: shownTags.map((t) => Math.round(t.getBoundingClientRect().width)),
      tagEllipsis: shownTags.map((t) => { const x = t.querySelector('.cc-txt'); return x ? x.scrollWidth > x.clientWidth + 1 : false; }),
    };
  }, id);
}
const sum = (a) => a.reduce((x, y) => x + (y || 0), 0);
R.AC098 = { note: 'no exactly-6 sample in DB; 5-source and 7-source measured', samples: {} };
for (const id of ['hosp-0061', 'CCFG-AC-R1-ON', 'hosp-001', 'hosp-012']) {
  R.AC098.samples[id] = [];
  for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 800]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(450);
    const m = await measureSample(id);
    m.viewport = `${w}x${h}`;
    m.consistency = m.shown + (m.plus ? Number(String(m.plus).replace('+', '')) : 0);
    R.AC098.samples[id].push(m);
  }
}
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(400);

// ============ AC-099 / AC-106: +N full list ============
async function fullList(id) {
  const ok = await (async () => {
    await closeAnyMenu();
    const el = page.locator(`${rowSel(id)} .cc-more`);
    if ((await el.count()) === 0) return false;
    await el.first().click(); await page.waitForTimeout(500);
    return (await vis('.cc-full-list')) > 0;
  })();
  let items = null;
  if (ok) items = await page.evaluate(() => {
    const host = [...document.querySelectorAll('.cc-full-list')].find((e) => e.offsetParent !== null || e.getClientRects().length);
    if (!host) return null;
    return [...host.querySelectorAll('li, .cc-full-item, .cc-fli')].map((e) => ({ text: e.textContent.replace(/\s+/g, ' ').trim(), cls: e.className })).slice(0, 20);
  });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  return { opened: ok, items };
}
R.AC099 = { sevenSource: await fullList('CCFG-AC-R1-ON') };
R.AC106 = { missingOrgRow: await fullList('CCFG-AC-R1-HIST-COM'), targetRawId: 'CCFG-AC-R1-COM' };

// ============ AC-117: delete item font-weight / colour / divider / hover focus ============
R.AC117 = await (async () => {
  const ok = await openMenuFor('hosp-001');
  if (!ok) return { opened: false };
  const before = await page.evaluate(() => {
    // Element Plus renders the `divided` separator as a SEPARATE <li role="separator">,
    // so collect all <li> children (not just .el-dropdown-menu__item).
    const host = [...document.querySelectorAll('.cc-more-popper')].find((e) => e.querySelector('.el-dropdown-menu__item') && getComputedStyle(e).display !== 'none');
    if (!host) return null;
    return [...host.querySelectorAll('li')].map((e) => {
      const cs = getComputedStyle(e);
      return { text: e.textContent.trim(), cls: e.className, role: e.getAttribute('role'), fontWeight: cs.fontWeight, color: cs.color, borderTop: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor };
    });
  });
  await page.locator(itemSel, { hasText: '删除' }).first().hover();
  await page.waitForTimeout(400);
  const afterHover = await page.evaluate(() => {
    const e = [...document.querySelectorAll('.cc-more-popper .el-dropdown-menu__item')].filter((x) => x.getClientRects().length).find((x) => x.textContent.trim() === '删除');
    if (!e) return null; const cs = getComputedStyle(e); return { color: cs.color, bg: cs.backgroundColor };
  });
  await page.screenshot({ path: `${SHOTS}/ac117-menu-hover-delete.png` });
  await closeAnyMenu();
  return { opened: true, items: before, deleteHover: afterHover };
})();

// ============ AC-102: keyboard operation of the menu ============
R.AC102 = await (async () => {
  await closeAnyMenu();
  const link = page.locator(`${rowSel('hosp-001')} .cc-more-link`);
  await link.focus();
  const focusRing = await link.evaluate((e) => { const cs = getComputedStyle(e); return { outline: cs.outlineWidth + ' ' + cs.outlineStyle, boxShadow: cs.boxShadow !== 'none' }; });
  await page.keyboard.press('Enter'); await page.waitForTimeout(450);
  const opened = (await menuVisible()) > 0;
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(250);
  const active1 = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? null);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(250);
  const active2 = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? null);
  await page.keyboard.press('Escape'); await page.waitForTimeout(350);
  const closed = (await menuVisible()) === 0;
  const disabledPresent = await page.evaluate(() => document.querySelectorAll('.cc-more-popper .el-dropdown-menu__item.is-disabled').length);
  return { focusRing, openedByEnter: opened, active1, active2, closedByEsc: closed, disabledItemsInDom: disabledPresent };
})();

// ============ AC-012: tag ellipsis, tooltip delay/single-instance/centering ============
R.AC012 = await (async () => {
  const info = await page.evaluate(() => {
    const src = document.querySelector('.cc-src[data-client-id="CCFG-AC-R1-ON"]');
    const tag = [...src.querySelectorAll('.cc-dstag')].find((t) => t.offsetParent !== null);
    if (!tag) return { error: 'no visible tag' };
    const txt = tag.querySelector('.cc-txt');
    const tr = tag.getBoundingClientRect(); const xr = txt.getBoundingClientRect();
    const cs = getComputedStyle(txt);
    return { tagWidth: Math.round(tr.width), text: txt.textContent.trim(), textLen: txt.textContent.trim().length,
      textEllipsis: txt.scrollWidth > txt.clientWidth + 1, textOverflow: cs.textOverflow,
      centerY: Math.round((xr.top + xr.height / 2) - (tr.top + tr.height / 2)),
      lineHeightPx: cs.lineHeight, padding: cs.padding };
  });
  // hover + measure tooltip delay and instance count
  const tag = page.locator(`${rowSel('CCFG-AC-R1-ON')} .cc-dstag:visible`).first();
  await tag.hover();
  const samples = [];
  const t0 = Date.now();
  let appearedAt = null;
  while (Date.now() - t0 < 900) {
    const n = await vis('.cc-single-tip');
    samples.push({ ms: Date.now() - t0, tipCount: n, boxCount: await page.locator('.cc-single-tip').count() });
    if (n > 0 && appearedAt === null) appearedAt = Date.now() - t0;
    await page.waitForTimeout(60);
  }
  const tipText = await page.evaluate(() => {
    const ts = [...document.querySelectorAll('.cc-single-tip')].filter((e) => e.getClientRects().length);
    return ts.map((e) => e.textContent.replace(/\s+/g, ' ').trim());
  });
  await page.screenshot({ path: `${SHOTS}/ac012-tooltip.png` });
  await page.mouse.move(5, 5); await page.waitForTimeout(500);
  const afterLeave = await vis('.cc-single-tip');
  return { tagInfo: info, tooltipAppearedAtMs: appearedAt, tooltipDelaySamples: samples.filter((s) => s.ms < 500 || s.tipCount > 0).slice(0, 14), visibleTips: tipText, afterLeave };
})();

// AC-012 extension: non-truncated sample, cross-tag single instance, centering per tag state
async function hoverTagAt(id, idx) {
  const tags = page.locator(`${rowSel(id)} .cc-dstag:visible`);
  const n = await tags.count();
  if (idx >= n) return { error: `no tag idx=${idx} in ${id} (n=${n})` };
  await tags.nth(idx).hover();
  await page.waitForTimeout(520);
  return page.evaluate((rid) => {
    const tips = [...document.querySelectorAll('.cc-single-tip')].filter((e) => e.getClientRects().length);
    return { tipCount: tips.length, tips: tips.map((e) => e.textContent.replace(/\s+/g, ' ').trim()) };
  }, id);
}
R.AC012.shortTag = await hoverTagAt('hosp-001', 0);
R.AC012.stillOneAfterMove = await (async () => {
  const a = await hoverTagAt('CCFG-AC-R1-ON', 0);
  const b = await hoverTagAt('CCFG-AC-R1-ON', 1);
  const c = await hoverTagAt('hosp-0061', 0);
  return { first: a, second: b, crossRow: c };
})();
R.AC012.tagStates = await page.evaluate(() => {
  const out = {};
  for (const tr of document.querySelectorAll('.cc-table tbody tr')) {
    const id = tr.querySelector('.cc-src')?.getAttribute('data-client-id');
    const src = tr.querySelector('.cc-src');
    if (!src) continue;
    out[id] = [...src.querySelectorAll('.cc-dstag')].filter((t) => t.offsetParent !== null).map((t) => {
      const tr2 = t.getBoundingClientRect();
      const txt = t.querySelector('.cc-txt');
      const xr = txt.getBoundingClientRect();
      return { text: txt.textContent.trim(), cls: t.className,
        ellipsis: txt.scrollWidth > txt.clientWidth + 1,
        centerOffsetY: Math.round((xr.top + xr.height / 2) - (tr2.top + tr2.height / 2)) };
    });
  }
  return out;
});
await page.mouse.move(5, 5); await page.waitForTimeout(400);

// ============ reference row height for AC-129/010 comparison ============
try {
  await page.goto(BASE + '/config/data-source', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(800);
  R.referenceRowHeight = await page.evaluate(() => {
    const tr = document.querySelector('.el-table__body tbody tr');
    return tr ? Math.round(tr.getBoundingClientRect().height) : null;
  });
  await page.screenshot({ path: `${SHOTS}/reference-data-source.png` });
} catch (e) { R.referenceRowHeight = 'ERR:' + String(e).split('\n')[0]; }

R.writesBlocked = writes;
fs.writeFileSync(OUT + '/probeC-result.json', JSON.stringify(R, null, 2));
console.log(JSON.stringify({ writesBlocked: writes.length, keys: Object.keys(R) }, null, 2));
await browser.close();
