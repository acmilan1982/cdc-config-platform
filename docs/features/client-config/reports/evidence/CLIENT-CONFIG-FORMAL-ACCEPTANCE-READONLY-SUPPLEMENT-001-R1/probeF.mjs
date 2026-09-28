// Probe F — CCFG-AC-143 R1 supplement: PER-ACTION fixed-selection timeline.
// Two initial states (unfixed / fixed) for the primary target row; an independent snapshot is taken
// immediately after EVERY atomic action (trigger open/close, item click -> confirm open, cancel,
// +N open/close, tooltip show/leave, ID Enter/Space dialog open/close) — never once at the end.
// Menu items are selected BY INDEX (not by a hardcoded label) so the enable/disable branch and the
// delete branch are both exercised on whatever labels the row actually renders.
// A supplementary timeline on an enabled ('1') row exercises the 停用 branch.
// Read-only: no final confirm is ever clicked; /api/** non-GET blocked before navigation.
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = '/tmp/fa-ro-supplement-001-r1';
const SHOTS = OUT + '/shots';
const PRIMARY = 'CCFG-AC-R1-ON'; // renders 启用/删除 (FG_ACTIVE='0')
const SECONDARY = 'hosp-012'; // renders 停用/删除 (FG_ACTIVE='1') -> covers the 停用 branch
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

const rowSel = (id) => `.cc-table tbody tr:has(.cc-src[data-client-id="${id}"])`;
const itemSel = '.cc-more-popper .el-dropdown-menu__item:visible';
const vis = (sel) => page.locator(sel + ':visible').count();
const menuVisible = () => vis('.cc-more-popper .el-dropdown-menu__item');
const fixedId = () =>
  page.evaluate(() => {
    const tr = document.querySelector('.cc-table tbody tr.cc-row--selected');
    return tr ? tr.querySelector('.cc-id')?.textContent?.trim() ?? '?' : null;
  });
const nextFrame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

async function closeAnyMenu(id) {
  // Element Plus el-dropdown does NOT reliably close on Escape; close deterministically by toggling
  // the same trigger, falling back to Escape only if the toggle misses.
  for (let i = 0; i < 3; i++) {
    if ((await menuVisible()) === 0) return true;
    await page.locator(`${rowSel(id)} .cc-more-link`).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(320);
    if ((await menuVisible()) === 0) return true;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(320);
  }
  return (await menuVisible()) === 0;
}
async function openMenu(id) {
  await closeAnyMenu(id);
  await page.locator(`${rowSel(id)} .cc-more-link`).click();
  await page.waitForTimeout(350);
  try {
    await page.locator(itemSel).first().waitFor({ state: 'visible', timeout: 3000 });
    await page.waitForTimeout(400);
    return true;
  } catch {
    return false;
  }
}
async function menuItemTexts() {
  const items = page.locator(itemSel);
  const n = await items.count();
  const out = [];
  for (let i = 0; i < n; i++) out.push((await items.nth(i).textContent()).trim());
  return out;
}
const confirmOpen = () => vis('.el-message-box').then((n) => n > 0);
async function confirmTexts() {
  return page.evaluate(() => {
    const b = document.querySelector('.el-message-box');
    if (!b || b.offsetParent === null) return null;
    return {
      title: b.querySelector('.el-message-box__title')?.textContent?.trim() ?? null,
      btns: [...b.querySelectorAll('.el-message-box__btns button')].map((x) => x.textContent.trim()),
    };
  });
}
async function cancelConfirm() {
  await page.locator('.el-message-box:visible .el-message-box__btns button', { hasText: '取消' }).first().click();
  await page.waitForTimeout(380);
}
async function closeDialog() {
  const b = page.locator('.cc-dialog:visible .el-dialog__headerbtn');
  if (await b.count()) await b.first().click();
  else await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
}

const timeline = [];
let seq = 0;
async function snap(scope, action, extra = {}) {
  const s = {
    seq: ++seq,
    scope,
    action,
    fixedId: await fixedId(),
    confirmOpen: await confirmOpen(),
    menuOpen: (await menuVisible()) > 0,
    popoverOpen: (await vis('.cc-full-list')) > 0,
    tooltipOpen: (await vis('.cc-single-tip')) > 0,
    editDialogOpen: (await vis('.cc-dialog')) > 0,
    ...extra,
  };
  timeline.push(s);
  return s;
}

// ----- atomic actions (each yields several immediately-taken snapshots) -----
async function actTrigger(scope, id) {
  await snap(scope, 'trigger:before');
  const opened = await openMenu(id);
  await snap(scope, 'trigger:opened', { menuOpened: opened, menuItems: opened ? await menuItemTexts() : null });
  await closeAnyMenu(id);
  await snap(scope, 'trigger:closed');
}
async function actMenuItem(scope, id, idx, kind) {
  const opened = await openMenu(id);
  if (!opened) {
    await snap(scope, `item-${kind}:menu-open-failed`);
    return;
  }
  const items = await menuItemTexts();
  if (idx >= items.length) {
    await snap(scope, `item-${kind}:absent`, { menuItems: items });
    return;
  }
  const label = items[idx];
  await snap(scope, `item-${kind}:menu-opened`, { itemIndex: idx, itemLabel: label, menuItems: items });
  await page.locator(itemSel).nth(idx).click({ timeout: 5000 });
  await page.waitForTimeout(450);
  const o = await confirmOpen();
  const t = await confirmTexts();
  await page.screenshot({ path: `${SHOTS}/${scope}-item-${kind}-${label}-confirm.png` });
  await snap(scope, `item-${kind}:confirm-opened`, { itemLabel: label, confirmOpened: o, confirm: t, editDialogOpened: (await vis('.cc-dialog')) > 0 });
  if (o) await cancelConfirm();
  else await closeAnyMenu(id);
  await snap(scope, `item-${kind}:cancelled`, { itemLabel: label });
}
async function actPlusN(scope, id) {
  await snap(scope, 'plusN:before');
  const el = page.locator(`${rowSel(id)} .cc-more`);
  if ((await el.count()) === 0) {
    await snap(scope, 'plusN:absent');
    return;
  }
  const plusText = (await el.first().textContent()).trim();
  await el.first().click();
  await page.waitForTimeout(450);
  await nextFrame();
  const opened = (await vis('.cc-full-list')) > 0;
  const listCount = await page.evaluate(() => {
    const host = [...document.querySelectorAll('.cc-full-list')].find((e) => e.getClientRects().length);
    return host ? host.querySelectorAll('li').length : 0;
  });
  await page.screenshot({ path: `${SHOTS}/${scope}-plusN-opened.png` });
  await snap(scope, 'plusN:opened', { plusText, popoverOpened: opened, fullListItems: listCount });
  await el.first().click();
  await page.waitForTimeout(420);
  await nextFrame();
  await snap(scope, 'plusN:closed');
}
async function actTooltip(scope, id) {
  const t = page.locator(`${rowSel(id)} .cc-dstag`).first();
  if ((await t.count()) === 0) {
    await snap(scope, 'tooltip:absent');
    return;
  }
  const tagText = (await t.textContent()).trim();
  await t.hover();
  await page.waitForTimeout(520);
  await page.screenshot({ path: `${SHOTS}/${scope}-tooltip-shown.png` });
  await snap(scope, 'tooltip:shown', { tagText, tipVisible: (await vis('.cc-single-tip')) > 0 });
  await page.mouse.move(5, 5);
  await page.waitForTimeout(520);
  await snap(scope, 'tooltip:left');
}
async function actIdKey(scope, id, key, tag) {
  await page.locator(`${rowSel(id)} .cc-id`).first().focus();
  await page.waitForTimeout(120);
  await snap(scope, `id-${tag}:before`, { focusedAria: await page.evaluate(() => document.activeElement?.getAttribute?.('aria-label') ?? null) });
  await page.keyboard.press(key);
  await page.waitForTimeout(520);
  const o = (await vis('.cc-dialog')) > 0;
  if (o) await page.screenshot({ path: `${SHOTS}/${scope}-id-${tag}-dialog-opened.png` });
  await snap(scope, `id-${tag}:dialog-opened`, { dialogOpened: o });
  if (o) await closeDialog();
  await page.waitForTimeout(300);
  await snap(scope, `id-${tag}:closed`);
}

async function fixRow(id) {
  await page.locator(`${rowSel(id)} .cc-seq`).first().click();
  await page.waitForTimeout(450);
}
async function unfixAll() {
  const cur = await fixedId();
  if (cur) {
    await page.locator(`${rowSel(cur)} .cc-seq`).first().click();
    await page.waitForTimeout(450);
  }
  return await fixedId();
}
async function runAll(scope, id) {
  await actTrigger(scope, id);
  await actMenuItem(scope, id, 0, 'enable-or-disable');
  await actMenuItem(scope, id, 1, 'delete');
  await actPlusN(scope, id);
  await actTooltip(scope, id);
  await actIdKey(scope, id, 'Enter', 'Enter');
  await actIdKey(scope, id, ' ', 'Space');
}
// focused supplement: only the 启用/停用 item -> confirm -> cancel, under both initial states
async function runToggleOnly(scope, id) {
  await actTrigger(scope, id);
  await actMenuItem(scope, id, 0, 'enable-or-disable');
}

// ---------- primary target (renders 启用/删除) ----------
await page.locator(rowSel(PRIMARY)).first().scrollIntoViewIfNeeded().catch(() => {});
await unfixAll();
await snap('unfixed', 'baseline');
await runAll('unfixed', PRIMARY);
await fixRow(PRIMARY);
await snap('fixed', 'fix-target');
await runAll('fixed', PRIMARY);
await snap('fixed', 'baseline-end');

// ---------- secondary target (renders 停用/删除): covers the 停用 branch ----------
await page.locator(rowSel(SECONDARY)).first().scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(300);
const clearedForSecondary = await unfixAll();
await snap('secondary-unfixed', 'baseline', { clearedForUnfixed: clearedForSecondary });
await runToggleOnly('secondary-unfixed', SECONDARY);
await fixRow(SECONDARY);
await snap('secondary-fixed', 'fix-target');
await runToggleOnly('secondary-fixed', SECONDARY);
await unfixAll();

const res = { primary: PRIMARY, secondary: SECONDARY, writesBlocked: writes, timeline };
fs.writeFileSync(OUT + '/probeF-result.json', JSON.stringify(res, null, 2));
console.log(JSON.stringify({ writesBlocked: writes.length, steps: timeline.length, scopes: [...new Set(timeline.map((s) => s.scope))] }, null, 2));
await browser.close();
