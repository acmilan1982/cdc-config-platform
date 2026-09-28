// Probe E — CCFG-AC-100 R1 supplement: REAL keyboard Tab focus on the 操作 column entry.
// Read-only: menus are only opened/read/closed; no final confirm; /api/** non-GET blocked before navigation.
// Viewports: 1440x900 and 1920x1080.
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = '/tmp/fa-ro-supplement-001-r1';
const SHOTS = OUT + '/shots';
fs.mkdirSync(SHOTS, { recursive: true });

const TARGETS = { one: 'hosp-012', zero: 'hosp-001', abnormal: 'CCFG-AC-R1-ABN' };

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

const rowSel = (id) => `.cc-table tbody tr:has(.cc-src[data-client-id="${id}"])`;
const itemSel = '.cc-more-popper .el-dropdown-menu__item:visible';
const vis = (sel) => page.locator(sel + ':visible').count();
const menuVisible = () => vis('.cc-more-popper .el-dropdown-menu__item');

async function closeAnyMenu() {
  for (let i = 0; i < 3; i++) {
    if ((await menuVisible()) === 0) return true;
    await page.locator(`${rowSel('hosp-012')} .cc-more-link`).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(320);
    if ((await menuVisible()) === 0) return true;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(320);
  }
  return (await menuVisible()) === 0;
}
async function openMenuFor(id) {
  await closeAnyMenu();
  await page.locator(`${rowSel(id)} .cc-more-link`).click();
  await page.waitForTimeout(350);
  try {
    await page.locator(itemSel).first().waitFor({ state: 'visible', timeout: 2500 });
    await page.waitForTimeout(400);
    return true;
  } catch {
    return false;
  }
}
async function readMenuItems() {
  const items = page.locator(itemSel);
  const n = await items.count();
  const out = [];
  for (let i = 0; i < n; i++) out.push((await items.nth(i).textContent()).trim());
  return out;
}

// Active-element descriptor: identity, whether it is the row's 3-dot entry, name, focus-visible.
const activeDesc = () =>
  page.evaluate(() => {
    const a = document.activeElement;
    if (!a) return null;
    const tr = a.closest ? a.closest('tr') : null;
    const cs = getComputedStyle(a);
    let fv = null;
    try {
      fv = a.matches(':focus-visible');
    } catch {
      fv = null;
    }
    return {
      tag: a.tagName,
      cls: (a.className && a.className.toString ? a.className.toString() : String(a.className || '')).trim(),
      aria: a.getAttribute ? a.getAttribute('aria-label') : null,
      role: a.getAttribute ? a.getAttribute('role') : null,
      tabindex: a.getAttribute ? a.getAttribute('tabindex') : null,
      text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      inRowClientId: tr ? (tr.querySelector('.cc-src') ? tr.querySelector('.cc-src').getAttribute('data-client-id') : null) : null,
      isMoreLink: !!(a.classList && a.classList.contains('cc-more-link')),
      isId: !!(a.classList && a.classList.contains('cc-id')),
      focusVisible: fv,
      outline: cs.outlineWidth + ' ' + cs.outlineStyle + ' ' + cs.outlineColor,
      boxShadow: cs.boxShadow,
      bg: cs.backgroundColor,
    };
  });

// ---- 1) per-row entry catalogue (form + accessible name + state) ----
async function catalog() {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr')];
    return rows.map((tr, i) => {
      const link = tr.querySelector('.cc-more-link');
      const src = tr.querySelector('.cc-src');
      const id = src ? src.getAttribute('data-client-id') : null;
      const icon = link ? link.querySelector('svg') : null;
      const state = tr.querySelector('.cc-inactive-mark')
        ? '0'
        : tr.querySelector('.cc-abnormal-mark')
          ? 'abnormal'
          : '1';
      const abn = tr.querySelector('.cc-abnormal-mark');
      return {
        idx: i + 1,
        clientId: id,
        hasThreeDotIcon: !!icon,
        linkTextEmpty: link ? link.textContent.trim() === '' : null,
        containsMoreWord: link ? /更多/.test(link.textContent) : null,
        tabindex: link ? link.getAttribute('tabindex') : null,
        role: link ? link.getAttribute('role') : null,
        ariaLabel: link ? link.getAttribute('aria-label') : null,
        stateGuess: state,
        abnormalBadge: abn ? abn.textContent.trim() : null,
      };
    });
  });
}

// ---- 2) REAL Tab traversal from tab-order start: record every landing ----
async function tabTraversal(viewportTag, targets, maxTabs = 140) {
  // Start at the true beginning of the tab order: blur any focus, then press Tab for real.
  await page.evaluate(() => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  });
  await page.waitForTimeout(120);
  const startDesc = await activeDesc();
  const seq = [];
  const arrivals = {};
  const idToState = Object.fromEntries(Object.entries(targets).map(([k, v]) => [v, k]));
  const wanted = new Set(Object.keys(targets));
  for (let i = 1; i <= maxTabs; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(45);
    const d = await activeDesc();
    const rec = { i, tag: d?.tag ?? null, cls: d?.cls ?? null, aria: d?.aria ?? null, inRow: d?.inRowClientId ?? null, isMoreLink: d?.isMoreLink ?? false, isId: d?.isId ?? false, focusVisible: d?.focusVisible ?? null };
    seq.push(rec);
    if (d && d.isMoreLink && d.inRowClientId && idToState[d.inRowClientId] && !arrivals[idToState[d.inRowClientId]]) {
      const key = idToState[d.inRowClientId];
      arrivals[key] = { reachedAtTab: i, aria: d.aria, role: d.role, tabindex: d.tabindex, focusVisible: d.focusVisible, outline: d.outline, boxShadow: d.boxShadow, bg: d.bg };
      // capture the element immediately BEFORE it in the traversal (the row's .cc-id expected)
      const prevEl = seq.length >= 2 ? seq[seq.length - 2] : null;
      arrivals[key].previousLanding = prevEl ? { cls: prevEl.cls, inRow: prevEl.inRow, isId: prevEl.isId } : null;
      await page.screenshot({ path: `${SHOTS}/ac100-r1-${viewportTag}-${key}-tabfocus.png` });
      wanted.delete(key);
      if (wanted.size === 0) break;
    }
  }
  return { viewport: viewportTag, startActiveElement: startDesc, totalTabsPressed: seq.length, arrivals, reachedAll: wanted.size === 0, traversal: seq };
}

const R = {};
for (const [w, h] of [
  [1440, 900],
  [1920, 1080],
]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(500);
  const tag = `${w}x${h}`;
  const cat = await catalog();
  // mouse-click menu read for the three states (definition: 依次单击入口并读取菜单条目)
  const menus = {};
  for (const [k, id] of Object.entries(TARGETS)) {
    const ok = await openMenuFor(id);
    menus[k] = { id, opened: ok, items: ok ? await readMenuItems() : null };
    await closeAnyMenu();
  }
  const tab = await tabTraversal(tag, TARGETS);
  R[`AC100_${tag}`] = {
    rowCount: cat.length,
    allEntriesThreeDotIcon: cat.every((r) => r.hasThreeDotIcon === true),
    anyRowShowsMoreWord: cat.some((r) => r.containsMoreWord === true || r.linkTextEmpty === false),
    distinctStates: [...new Set(cat.map((r) => r.stateGuess))],
    entries: cat,
    menus,
    tabTraversal: tab,
  };
  // reset scroll/focus between viewports
  await page.evaluate(() => window.scrollTo(0, 0));
}

R.writesBlocked = writes;
fs.writeFileSync(OUT + '/probeE-result.json', JSON.stringify(R, null, 2));
console.log(JSON.stringify({
  writesBlocked: writes.length,
  viewports: Object.keys(R).filter((k) => k.startsWith('AC100_')),
  perViewport: Object.fromEntries(
    Object.entries(R)
      .filter(([k]) => k.startsWith('AC100_'))
      .map(([k, v]) => [k, {
        rowCount: v.rowCount,
        allThreeDot: v.allEntriesThreeDotIcon,
        anyMoreWord: v.anyRowShowsMoreWord,
        states: v.distinctStates,
        menus: Object.fromEntries(Object.entries(v.menus).map(([s, m]) => [s, { opened: m.opened, items: m.items }])),
        arrivals: Object.fromEntries(Object.entries(v.tabTraversal.arrivals).map(([s, a]) => [s, { reachedAtTab: a.reachedAtTab, aria: a.aria, focusVisible: a.focusVisible, outline: a.outline, outlineColorAndShadow: a.boxShadow, bg: a.bg, previousLanding: a.previousLanding }])),
        reachedAll: v.tabTraversal.reachedAll,
        totalTabsPressed: v.tabTraversal.totalTabsPressed,
      }]),
  ),
}, null, 2));
await browser.close();
