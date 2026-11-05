const { openPage, rowOf, API } = require('../probe-lib.cjs');
const fs = require('fs');

let page;
let reqLog;

async function openCreate() {
  await page.locator('.cc-btn-add').click();
  await page.locator('.cc-dialog').waitFor({ state: 'visible' });
  await page.waitForTimeout(450);
}
async function openEdit(clientId) {
  await rowOf(page, clientId).locator('.cc-id').dblclick();
  await page.locator('.cc-dialog').waitFor({ state: 'visible' });
  await page.waitForTimeout(450);
}
async function setFields(id, desc) {
  await page.locator('.cc-id-control input').fill(id);
  await page.locator('.cc-desc-row textarea').fill(desc);
}
async function choose(id) {
  await page.locator('.cc-search input').fill(id);
  await page.waitForTimeout(180);
  const opt = page.locator('.cc-opt').filter({ hasText: id }).first();
  await opt.scrollIntoViewIfNeeded();
  await opt.click();
  await page.waitForTimeout(120);
}
async function chosenTexts() {
  return await page.locator('.cc-chosen-list .el-tag').evaluateAll((els) => els.map((e) => e.textContent.trim()));
}
async function removeAll() {
  const tags = page.locator('.cc-chosen-list .el-tag');
  let guard = 0;
  while ((await tags.count()) > 0 && guard < 40) {
    const close = tags.first().locator('.el-tag__close');
    if ((await close.count()) === 0) break;
    await close.click();
    await page.waitForTimeout(90);
    guard += 1;
  }
}
async function removeOne(text) {
  const tag = page.locator('.cc-chosen-list .el-tag').filter({ hasText: text }).first();
  await tag.locator('.el-tag__close').click();
  await page.waitForTimeout(100);
}
async function autoGen() {
  const before = reqLog.length;
  await page.locator('.cc-autogen').click();
  await page.waitForTimeout(420);
  return {
    value: await page.locator('.cc-desc-row textarea').inputValue(),
    warnings: await page.locator('.el-message').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.textContent.trim())),
    confirmBoxes: await page.locator('.el-message-box').count(),
    requestDelta: reqLog.length - before,
  };
}
async function cancel() {
  await page.locator('.cc-dialog').getByRole('button', { name: '取消' }).click();
  await page.waitForTimeout(400);
}
function cpSlice(s, n) { return Array.from(s).slice(0, n).join(''); }
function bytes(s) { return Buffer.byteLength(s, 'utf8'); }

(async () => {
  const { browser, page: p, requests } = await openPage({ width: 1440, height: 900 });
  page = p;
  reqLog = requests;
  const out = { cases: {}, expected: {}, write: {} };
  try {
    const opts = await (await fetch(API + '/api/clients/data-source-options')).json();
    const orgById = {};
    for (const o of opts.data) orgById[o.dataSourceId] = o.org;
    out.expected.optionCount = opts.data.length;

    // ---- C1: generate, manual edits after generation, order, same-org, padded, comma org ----
    await openCreate();
    await setFields('S2AC-PAUTO', 'ORIGINAL S2AC');
    const order1 = ['S2AC-N04', 'S2AC-N14', 'S2AC-N06', 'S2AC-N05', 'S2AC-N10'];
    for (const id of order1) await choose(id);
    const chosen1 = await chosenTexts();
    const gen1 = await autoGen();
    const exp1 = order1.map((id) => String(orgById[id] ?? '').trim()).join(',');
    out.cases.gen1 = { chosen: chosen1, generated: gen1, expected: exp1, match: gen1.value === exp1, expectedBytes: bytes(exp1) };

    await choose('S2AC-N08');
    const afterAdd = await page.locator('.cc-desc-row textarea').inputValue();
    await removeOne('LongOrgS2AC-ABCDEFGHIJKLMNOPQRST');
    const afterRemove = await page.locator('.cc-desc-row textarea').inputValue();
    out.cases.noAutoUpdate = { afterAdd, afterRemove, unchangedAfterAdd: afterAdd === gen1.value, unchangedAfterRemove: afterRemove === gen1.value };

    // order change: regenerate in selection order
    await removeAll();
    for (const id of ['S2AC-N06', 'S2AC-N07']) await choose(id);
    const genOrderA = await autoGen();
    await removeAll();
    for (const id of ['S2AC-N07', 'S2AC-N06']) await choose(id);
    const genOrderB = await autoGen();
    out.cases.order = { orderA: genOrderA.value, orderB: genOrderB.value, distinct: genOrderA.value !== genOrderB.value };

    // restore final selection and regenerate, then save real
    await removeAll();
    for (const id of order1) await choose(id);
    const genFinal = await autoGen();
    const beforeSaveReqs = reqLog.length;
    const respP = page.waitForResponse((r) => r.url().includes('/api/clients') && r.request().method() === 'POST', { timeout: 15000 });
    await page.locator('.cc-dialog-submit').click();
    const resp = await respP;
    const respJson = await resp.json();
    await page.waitForTimeout(700);
    out.write.saveAuto = {
      requestBodies: reqLog.slice(beforeSaveReqs),
      httpStatus: resp.status(),
      response: respJson,
      dialogVisibleAfter: await page.locator('.cc-dialog').isVisible().catch(() => null),
      generatedValue: genFinal.value,
    };

    // ---- C2: edit mode same button, overwrite; cancel ----
    await openEdit('S2AC-PAUTO');
    const editTitle = await page.locator('.cc-dialog .el-dialog__title').textContent().catch(() => null);
    const editDesc = await page.locator('.cc-desc-row textarea').inputValue();
    const hasAuto = await page.locator('.cc-autogen').count();
    await choose('S2AC-N08');
    const genEdit = await autoGen();
    out.cases.editAuto = { title: editTitle, descEcho: editDesc, autoButtonCount: hasAuto, generated: genEdit.value, changed: genEdit.value !== editDesc };
    await cancel();

    // ---- C3: long orgs, exact-1024 and over-1024 full string ----
    await openCreate();
    const L16 = Array.from({ length: 16 }, (_, i) => `S2AC-L${String(i + 1).padStart(2, '0')}`);
    for (const id of L16) await choose(id);
    const genL16 = await autoGen();
    const fullL16 = L16.map((id) => String(orgById[id] ?? '').trim()).join(',');
    out.cases.longExact = {
      chosenCount: L16.length,
      fullCodePoints: Array.from(fullL16).length,
      fullBytes: bytes(fullL16),
      expectedFirst256: cpSlice(fullL16, 256),
      actualValue: genL16.value,
      actualCodePoints: Array.from(genL16.value).length,
      actualBytes: bytes(genL16.value),
      isPrefix: genL16.value === cpSlice(fullL16, 256),
      warnings: genL16.warnings,
      confirmBoxes: genL16.confirmBoxes,
    };

    await removeAll();
    const L17 = ['S2AC-L01','S2AC-L02','S2AC-L03','S2AC-L04','S2AC-L05','S2AC-L06','S2AC-L07','S2AC-L08','S2AC-L09','S2AC-L10','S2AC-L11','S2AC-L12','S2AC-L13','S2AC-L14','S2AC-L15','S2AC-L17'];
    for (const id of L17) await choose(id);
    const genL17 = await autoGen();
    const fullL17 = L17.map((id) => String(orgById[id] ?? '').trim()).join(',');
    out.cases.longOver = {
      chosenCount: L17.length,
      fullCodePoints: Array.from(fullL17).length,
      fullBytes: bytes(fullL17),
      actualValue: genL17.value,
      actualCodePoints: Array.from(genL17.value).length,
      actualBytes: bytes(genL17.value),
      isPrefix: genL17.value === cpSlice(fullL17, 256),
      warnings: genL17.warnings,
      confirmBoxes: genL17.confirmBoxes,
    };
    await cancel();

    // ---- C4: emoji straddling code point 256 ----
    await openCreate();
    const E = ['S2AC-E02', 'S2AC-E03', 'S2AC-E04', 'S2AC-E01', 'S2AC-E05'];
    for (const id of E) await choose(id);
    const genE = await autoGen();
    const fullE = E.map((id) => String(orgById[id] ?? '').trim()).join(',');
    const charsE = Array.from(genE.value);
    out.cases.emoji = {
      fullCodePoints: Array.from(fullE).length,
      fullBytes: bytes(fullE),
      valueCodePoints: charsE.length,
      valueBytes: bytes(genE.value),
      lastCodePoint: charsE.length ? charsE[charsE.length - 1].codePointAt(0).toString(16) : null,
      hasLoneSurrogate: /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(genE.value),
      isPrefix: genE.value === cpSlice(fullE, 256),
      warnings: genE.warnings,
      confirmBoxes: genE.confirmBoxes,
    };
    await cancel();

    // ---- C5: missing org keeps original desc, names the ID ----
    await openCreate();
    await setFields('S2AC-PAUTONO', 'KEEP ORIGINAL S2AC');
    await choose('S2AC-N15');
    const genNo = await autoGen();
    out.cases.missingOrg = { generated: genNo, kept: genNo.value === 'KEEP ORIGINAL S2AC', mentionsId: genNo.warnings.some((w) => w.includes('S2AC-N15')) };

    // ---- C6: no sources -> no action ----
    await removeAll();
    await page.locator('.cc-desc-row textarea').fill('KEEP EMPTY S2AC');
    const genEmpty = await autoGen();
    out.cases.noSources = { generated: genEmpty, unchanged: genEmpty.value === 'KEEP EMPTY S2AC', warnings: genEmpty.warnings, requestDelta: genEmpty.requestDelta };
    await cancel();
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    out.requestLog = reqLog;
    fs.writeFileSync('/root/ccfg-s2-evidence/group-c-results.json', JSON.stringify(out, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify({ ok: !out.error, error: out.error || null, write: out.write, cases: Object.keys(out.cases) }, null, 2));
})();
