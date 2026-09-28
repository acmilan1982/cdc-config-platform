// Probe B — CCFG-AC-143: row-inline control isolation across BOTH initial fix states.
// Read-only: opens menus/confirm dialogs and cancels; never clicks the final confirm; no writes.
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = '/tmp/fa-ro-supplement-001';
const SHOTS = OUT + '/shots';
const TARGET = 'CCFG-AC-R1-ON';
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
await page.waitForTimeout(500);

const fixedId = () => page.evaluate(() => {
  const tr = document.querySelector('.cc-table tbody tr.cc-row--selected');
  return tr ? (tr.querySelector('.cc-id')?.textContent?.trim() ?? '?') : null;
});
const vis = (sel) => page.locator(sel + ':visible').count();
const esc = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(220); };
const rowSel = `.cc-table tbody tr:has(.cc-src[data-client-id="${TARGET}"])`;
const itemSel = '.cc-more-popper .el-dropdown-menu__item:visible';
const nextFrame = async () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

const anyMenuItemVisible = () => vis('.cc-more-popper .el-dropdown-menu__item');
// Element Plus dropdown does NOT reliably close on Escape; close it deterministically by
// toggling the same trigger (verified), falling back to Escape only if the toggle misses.
async function closeAnyMenu() {
  for (let i = 0; i < 3; i++) {
    if ((await anyMenuItemVisible()) === 0) return true;
    await page.locator(`${rowSel} .cc-more-link`).click();
    await page.waitForTimeout(320);
    if ((await anyMenuItemVisible()) === 0) return true;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(320);
  }
  return (await anyMenuItemVisible()) === 0;
}
async function openMenu() {
  await closeAnyMenu();
  await page.locator(`${rowSel} .cc-more-link`).click();
  await page.waitForTimeout(350);
  try {
    await page.locator(itemSel).first().waitFor({ state: 'visible', timeout: 3000 });
    await page.waitForTimeout(400); // settle the el-zoom-in-top transition so the box is stable
    return true;
  } catch { return false; }
}
async function menuItemTexts() {
  const items = page.locator(itemSel);
  const n = await items.count();
  const out = [];
  for (let i = 0; i < n; i++) out.push((await items.nth(i).textContent()).trim());
  return out;
}
async function confirmOpen() { return (await vis('.el-message-box')) > 0; }
async function confirmTexts() {
  return page.evaluate(() => {
    const b = document.querySelector('.el-message-box');
    if (!b || b.offsetParent === null) return null;
    return { title: b.querySelector('.el-message-box__title')?.textContent?.trim(), btns: [...b.querySelectorAll('.el-message-box__btns button')].map((x) => x.textContent.trim()) };
  });
}
async function cancelConfirm() { await page.locator('.el-message-box:visible .el-message-box__btns button', { hasText: '取消' }).first().click(); await page.waitForTimeout(350); }

// ① trigger; and ② every visible menu entry -> confirm window -> cancel (no final confirm).
async function exerciseMenu(stateTag) {
  const opened = await openMenu();
  const items = opened ? await menuItemTexts() : [];
  const triggerOpenedEditDialog = (await vis('.cc-dialog')) > 0; // 触发器本身不得触发行双击编辑
  const per = [];
  for (const label of items) {
    await closeAnyMenu();
    if (!(await openMenu())) { per.push({ label, menuOpened: false }); continue; }
    const idx = (await menuItemTexts()).indexOf(label);
    await page.locator(itemSel).nth(idx).click({ timeout: 5000 });
    await page.waitForTimeout(450);
    const o = await confirmOpen();
    const t = await confirmTexts();
    await page.screenshot({ path: `${SHOTS}/ac143-${stateTag}-item-${idx}-confirm.png` });
    if (o) await cancelConfirm();
    else await closeAnyMenu();
    per.push({ label, menuOpened: true, confirmOpened: o, confirm: t,
      editDialogOpened: (await vis('.cc-dialog')) > 0 });
  }
  return { menuOpened: opened, triggerOpenedEditDialog, items, per };
}
async function clickPlusN() {
  const el = page.locator(`${rowSel} .cc-more`);
  if ((await el.count()) === 0) return { clicked: false, plusText: null };
  const plusText = (await el.first().textContent()).trim();
  await el.first().click(); await page.waitForTimeout(450);
  await nextFrame();
  return { clicked: true, plusText, popoverOpened: await vis('.cc-full-list') > 0 };
}
async function hoverTag() {
  const t = page.locator(`${rowSel} .cc-dstag`).first();
  if ((await t.count()) === 0) return { hovered: false };
  const tagText = (await t.textContent()).trim();
  await t.hover(); await page.waitForTimeout(500);
  return { hovered: true, tagText, tipVisible: await vis('.cc-single-tip') > 0 };
}
async function idKeyEdit(key) {
  const id = page.locator(`${rowSel} .cc-id`).first();
  await id.focus(); await page.keyboard.press(key); await page.waitForTimeout(500);
  const o = await vis('.cc-dialog') > 0;
  if (o) { const b = page.locator('.cc-dialog:visible .el-dialog__headerbtn'); if (await b.count()) await b.first().click(); else await page.keyboard.press('Escape'); await page.waitForTimeout(450); }
  return { key, dialogOpened: o };
}

const timeline = [];
async function step(state, name, fn) {
  const before = await fixedId();
  let info = {};
  try { info = (await fn()) || {}; } catch (e) { info = { error: String(e).replace(/\x1b\[[0-9;]*m/g, '').split('\n')[0] }; }
  const after = await fixedId();
  timeline.push({ state, step: name, fixedBefore: before, fixedAfter: after, ...info });
  await esc();
}

await page.locator(rowSel).first().scrollIntoViewIfNeeded().catch(() => {});
timeline.push({ state: 'unfixed', step: 'baseline', fixedAfter: await fixedId() });

await step('unfixed', '①②more-trigger+menu-items→confirm-cancel', async () => exerciseMenu('unfixed'));
await step('unfixed', '③plusN', async () => clickPlusN());
await step('unfixed', '④tag-tooltip', async () => hoverTag());
await step('unfixed', '⑤id-enter-edit', async () => idKeyEdit('Enter'));
await step('unfixed', '⑤id-space-edit', async () => idKeyEdit(' '));

// Fix the target row by clicking a neutral cell, then repeat
await page.locator(`${rowSel} .cc-seq`).first().click();
await page.waitForTimeout(450);
timeline.push({ state: 'fixed', step: 'fix-target', fixedAfter: await fixedId() });

await step('fixed', '①②more-trigger+menu-items→confirm-cancel', async () => exerciseMenu('fixed'));
await step('fixed', '③plusN', async () => clickPlusN());
await step('fixed', '④tag-tooltip', async () => hoverTag());
await step('fixed', '⑤id-enter-edit', async () => idKeyEdit('Enter'));
await step('fixed', '⑤id-space-edit', async () => idKeyEdit(' '));

const res = { target: TARGET, writesBlocked: writes, timeline };
fs.writeFileSync(OUT + '/probeB-result.json', JSON.stringify(res, null, 2));
console.log(JSON.stringify({ writesBlocked: writes.length, timeline }, null, 2));
await browser.close();
