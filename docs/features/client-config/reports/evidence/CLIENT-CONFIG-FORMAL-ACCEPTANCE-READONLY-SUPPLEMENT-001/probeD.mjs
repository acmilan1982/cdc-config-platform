// Probe D — dialog (draft-only) read-only cases: 041 / 090 / 128 / 132(③) / 125 / 138.
// Only uncommitted drafts and client-side validation; never a valid submit.
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
  writes.push({ method: m, url: route.request().url(), postData: route.request().postData() ?? null });
  return route.abort('blockedbyclient');
});
const page = await ctx.newPage();
await page.goto(BASE + '/config/client', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('.cc-table tbody tr', { timeout: 15000 });
await page.waitForTimeout(600);

const R = {};
const DIA = '.cc-dialog:visible';
const vis = (sel) => page.locator(sel + ':visible').count();
const descInput = () => page.locator(`${DIA} .cc-desc-row textarea`);
const autogenBtn = () => page.locator(`${DIA} .cc-autogen`);
const idInput = () => page.locator(`${DIA} .cc-id-control .el-input__inner`);

async function openCreate() {
  await page.locator('.cc-btn-add').click();
  await page.waitForSelector(DIA, { timeout: 5000 });
  await page.waitForTimeout(500);
}
async function closeDialog() {
  await page.locator(`${DIA} .el-dialog__headerbtn`).first().click().catch(async () => { await page.keyboard.press('Escape'); });
  await page.waitForTimeout(500);
}
async function openEditById(id) {
  const idEl = page.locator(`.cc-table tbody tr:has(.cc-src[data-client-id="${id}"]) .cc-id`).first();
  await idEl.scrollIntoViewIfNeeded().catch(() => {});
  await idEl.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  return (await vis('.cc-dialog')) > 0;
}
async function autogenState() {
  return page.evaluate(() => {
    const dia = [...document.querySelectorAll('.cc-dialog')].find((e) => e.getClientRects().length && getComputedStyle(e).display !== 'none');
    if (!dia) return { error: 'no dialog' };
    const btn = dia.querySelector('.cc-autogen');
    const ta = dia.querySelector('.cc-desc-row textarea');
    const title = dia.querySelector('.el-dialog__title')?.textContent?.trim();
    if (!btn || !ta) return { error: 'no autogen/textarea' };
    const b = btn.getBoundingClientRect(); const t = ta.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    return { dialogTitle: title, btnVisible: b.width > 0 && b.height > 0, btnRect: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
      taRect: [Math.round(t.left), Math.round(t.top), Math.round(t.width), Math.round(t.height)],
      rightOfInput: b.left >= t.right - 2, verticallyAlignedWithInput: Math.abs((b.top + b.height / 2) - (t.top + t.height / 2)) < t.height,
      disabledAttr: btn.disabled === true, ariaDisabled: btn.getAttribute('aria-disabled'), classes: btn.className, pointerEvents: cs.pointerEvents, cursor: cs.cursor };
  });
}

// ===================== AC-041 =====================
R.AC041 = {};
await openCreate();
R.AC041.create_default = await autogenState();               // 未选数据源
await descInput().fill('自定义描述草稿');
await page.waitForTimeout(300);
R.AC041.create_customDesc = await autogenState();            // 填写自定义描述
await page.screenshot({ path: `${SHOTS}/ac041-create.png` });
await closeDialog();
for (const id of ['CCFG-AC-R1-ABN', 'CCFG-AC-R1-HIST-COM']) {
  if (await openEditById(id)) {
    R.AC041[`edit_${id}`] = await autogenState();            // 编辑含异常历史
    await page.screenshot({ path: `${SHOTS}/ac041-edit-${id}.png` });
    await closeDialog();
  } else R.AC041[`edit_${id}`] = { error: 'edit dialog did not open' };
}

// ===================== AC-090 =====================
const btnStyle = (sel) => page.evaluate((s) => {
  const e = document.querySelector(s); if (!e) return null;
  const cs = getComputedStyle(e);
  return { tag: e.tagName, text: e.textContent.trim(), bg: cs.backgroundColor, borderColor: cs.borderColor, borderWidth: cs.borderTopWidth,
    color: cs.color, radius: cs.borderRadius, fontWeight: cs.fontWeight, fontSize: cs.fontSize, boxShadow: cs.boxShadow,
    disabled: e.disabled === true || e.classList.contains('is-disabled'),
    rect: (() => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })() };
}, sel);
R.AC090 = { client: {}, ref: {} };
const addBtn = page.locator('.cc-btn-add');
R.AC090.client.default = await btnStyle('.cc-btn-add');
await addBtn.hover(); await page.waitForTimeout(350);
R.AC090.client.hover = await btnStyle('.cc-btn-add');
await page.mouse.move(5, 5); await page.waitForTimeout(250);
await addBtn.focus(); await page.waitForTimeout(250);
R.AC090.client.focus = await btnStyle('.cc-btn-add');
await page.screenshot({ path: `${SHOTS}/ac090-addbtn-focus.png` });
// query / reset buttons (public QueryListActions)
R.AC090.client.query = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('button')];
  const q = cands.find((b) => b.textContent.trim() === '查询');
  const r = cands.find((b) => b.textContent.trim() === '重置');
  const grab = (e) => e ? { text: e.textContent.trim(), bg: getComputedStyle(e).backgroundColor, borderColor: getComputedStyle(e).borderColor, color: getComputedStyle(e).color } : null;
  return { query: grab(q), reset: grab(r) };
});
// click opens dialog
await addBtn.click(); await page.waitForSelector(DIA, { timeout: 5000 }); await page.waitForTimeout(400);
R.AC090.clickOpensDialog = { dialogOpen: (await vis('.cc-dialog')) > 0, title: await page.locator(`${DIA} .el-dialog__title`).textContent() };
await closeDialog();
// reference page
await page.goto(BASE + '/config/data-source', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(900);
R.AC090.ref = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('button')];
  const add = cands.find((b) => /新增数据源/.test(b.textContent));
  if (!add) return { error: 'reference add button not found', buttons: cands.slice(0, 12).map((b) => b.textContent.trim()) };
  const cs = getComputedStyle(add);
  return { text: add.textContent.trim(), bg: cs.backgroundColor, borderColor: cs.borderColor, borderWidth: cs.borderTopWidth, color: cs.color, radius: cs.borderRadius, fontWeight: cs.fontWeight, fontSize: cs.fontSize, className: add.className };
});
await page.goto(BASE + '/config/client', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForSelector('.cc-table tbody tr', { timeout: 15000 });
await page.waitForTimeout(600);

// ===================== AC-128 / 132③ / 125 / 138 (create dialog) =====================
await openCreate();
const idSel = `${DIA} .cc-id-control .el-input__inner`;

// ① manual type >32 allowed chars
await page.locator(idSel).fill('');
await page.locator(idSel).focus();
await page.keyboard.type('a'.repeat(40), { delay: 4 });
R.AC128_manualTyped = { typed: 40, actual: (await page.locator(idSel).inputValue()).length };
// ② paste >32 (simulate paste via insertText on the focused input)
await page.locator(idSel).fill('');
await page.locator(idSel).focus();
await page.evaluate(() => { const el = document.querySelector('.cc-dialog .cc-id-control .el-input__inner'); if (el) el.focus(); });
await page.keyboard.insertText('b'.repeat(40));
R.AC128_pasted = { pasted: 40, actual: (await page.locator(idSel).inputValue()).length };
// ③ illegal chars + trigger local validation
await page.locator(idSel).fill('');
await page.locator(idSel).focus();
await page.keyboard.type('ab@ c-d', { delay: 5 });
const beforeVal3 = await page.locator(idSel).inputValue();
await descInput().fill('draft desc');
await page.locator(`${DIA} .cc-dialog-submit`).click();
await page.waitForTimeout(600);
R.AC128_illegal = {
  typedValue: beforeVal3,
  afterSubmitValue: await page.locator(idSel).inputValue(),
  silentlyRewritten: beforeVal3 !== (await page.locator(idSel).inputValue()),
  fieldErrors: await page.evaluate(() => [...document.querySelectorAll('.cc-dialog .cc-field-error')].map((e) => ({ text: e.textContent.trim(), cls: e.className }))),
};
await page.screenshot({ path: `${SHOTS}/ac128-illegal-error.png` });

// AC-132③: 自动生成 with nothing selected -> no-op
await page.locator(idSel).fill('probe-draft-001');
await descInput().fill('原始描述内容');
const descBefore = await descInput().inputValue();
await autogenBtn().click();
await page.waitForTimeout(600);
R.AC132_noSelection = { descBefore, descAfter: await descInput().inputValue(), unchanged: descBefore === (await descInput().inputValue()),
  messages: await page.evaluate(() => [...document.querySelectorAll('.el-message, .el-message__content')].map((e) => e.textContent.trim())) };

// AC-125/138: dialog geometry across state transitions (all drafts / invalid submit only)
async function geom(tag) {
  return page.evaluate((t) => {
    const dia = [...document.querySelectorAll('.cc-dialog')].find((e) => e.getClientRects().length && getComputedStyle(e).display !== 'none');
    if (!dia) return { tag: t, error: 'no dialog' };
    const box = dia.getBoundingClientRect();
    const footerBtns = [...dia.querySelectorAll('.el-dialog__footer button')].map((b) => { const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width) }; });
    const errs = [...dia.querySelectorAll('.cc-field-error')].map((e) => { const r = e.getBoundingClientRect(); return { text: e.textContent.trim(), lines: Math.round(r.height / parseFloat(getComputedStyle(e).lineHeight || 16)), h: Math.round(r.height), scrollH: e.scrollHeight, clipped: e.scrollHeight > r.height + 1 }; });
    return { tag: t, dialogTop: Math.round(box.top), dialogBottom: Math.round(box.bottom), dialogH: Math.round(box.height), dialogLeft: Math.round(box.left), dialogW: Math.round(box.width), footerBtns, errors: errs,
      pageOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1, scrollWidth: document.documentElement.scrollWidth, innerW: window.innerWidth };
  }, tag);
}
R.AC138 = { sequence: [] };
R.AC138.sequence.push(await geom('1-未选数据源'));
const opt = page.locator(`${DIA} .cc-opt:not(.cc-opt--disabled)`).first();
const optCount = await page.locator(`${DIA} .cc-opt:not(.cc-opt--disabled)`).count();
if (optCount > 0) { await opt.click(); await page.waitForTimeout(500); }
R.AC138.sequence.push(await geom('2-选中1个'));
if (optCount > 0) { await page.locator(`${DIA} .cc-chosen-list .el-tag .el-tag__close`).first().click(); await page.waitForTimeout(500); }
R.AC138.sequence.push(await geom('3-全部取消'));
// invalid submit: desc empty -> red error, no write
await descInput().fill('');
if (optCount === 0) { /* still invalid: no source */ }
await page.locator(`${DIA} .cc-dialog-submit`).click();
await page.waitForTimeout(700);
R.AC138.sequence.push(await geom('4-提交触发错误'));
await page.screenshot({ path: `${SHOTS}/ac138-error-state.png` });
await descInput().fill('修正后的描述');
await page.waitForTimeout(500);
R.AC138.sequence.push(await geom('5-修正消除'));

// narrow viewports
R.AC125 = { viewports: [] };
for (const [w, h] of [[1100, 800], [820, 760], [700, 720]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(500);
  const g = await geom(`${w}x${h}`);
  R.AC125.viewports.push(g);
  await page.screenshot({ path: `${SHOTS}/ac125-${w}x${h}.png` });
}
await page.setViewportSize({ width: 1440, height: 900 });
R.AC125.finalWrites = writes.length;
await closeDialog();

R.writesBlocked = writes;
fs.writeFileSync(OUT + '/probeD-result.json', JSON.stringify(R, null, 2));
console.log(JSON.stringify({ writesBlocked: writes.length, writes }, null, 2));
await browser.close();
