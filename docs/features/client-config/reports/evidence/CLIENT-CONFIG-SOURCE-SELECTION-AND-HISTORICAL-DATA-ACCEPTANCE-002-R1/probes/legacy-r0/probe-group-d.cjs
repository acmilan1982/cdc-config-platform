const { openPage, rowOf, API } = require('../probe-lib.cjs');
const fs = require('fs');

let page;
let reqLog;
async function openCreate() {
  await page.locator('.cc-btn-add').click();
  await page.locator('.cc-dialog').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
}
async function openEdit(clientId) {
  await rowOf(page, clientId).locator('.cc-id').dblclick();
  await page.locator('.cc-dialog').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
}
async function setFields(id, desc) {
  await page.locator('.cc-id-control input').fill(id);
  await page.locator('.cc-desc-row textarea').fill(desc);
}
async function choose(id) {
  await page.locator('.cc-search input').fill(id);
  await page.waitForTimeout(180);
  await page.locator('.cc-opt').filter({ hasText: id }).first().click();
  await page.waitForTimeout(120);
}
async function removeChip(text) {
  const tag = page.locator('.cc-chosen-list .el-tag').filter({ hasText: text }).first();
  await tag.locator('.el-tag__close').click();
  await page.waitForTimeout(120);
}
async function submitOnce() {
  const before = reqLog.length;
  await page.locator('.cc-dialog-submit').click();
  await page.waitForTimeout(700);
  return reqLog.slice(before);
}
async function dialogFeedback() {
  return await page.evaluate(() => {
    const dlg = document.querySelector('.cc-dialog');
    if (!dlg) return null;
    return Array.from(dlg.querySelectorAll('.ced-field-error, .cc-field-hint, .cc-state-mini')).map((e) => ({ text: e.textContent.trim(), cls: e.className, visible: e.getBoundingClientRect().width > 0 }));
  });
}
async function apiPost(body) {
  const res = await fetch(API + '/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: res.status, json: await res.json(), request: body };
}
async function apiPut(path, body) {
  const res = await fetch(API + '/api/clients' + path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: res.status, json: await res.json(), request: body };
}
function capIds() {
  const ids = [];
  for (let i = 1; i <= 30; i += 1) ids.push('S2AC-CAP-' + String(i).padStart(23, '0'));
  ids.push('S2AC-CAPX0');
  return ids;
}

(async () => {
  const { browser, context, page: p, requests } = await openPage({ width: 1440, height: 900 });
  page = p; reqLog = requests;
  const out = { cases: {}, capacity: {}, candidates: {}, occupancy: {}, editBlock: {}, layout: {} };
  try {
    // ---------------- AC-034 ----------------
    await openCreate();
    await setFields('S2AC-PNOSRC', 'S2AC no source probe');
    const noSrcReqs = await submitOnce();
    out.cases.noSourceUi = { requests: noSrcReqs, feedback: await dialogFeedback() };
    await page.locator('.cc-dialog').getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(300);
    out.cases.noSourceApi = await apiPost({ clientId: 'S2AC-PNOSRC', clientDesc: 'S2AC no source probe', dataSourceIds: [] });

    const overIds = [];
    for (let i = 1; i <= 31; i += 1) overIds.push('S2AC-OVR-' + String(i).padStart(23, '0'));
    out.capacity.over = await apiPost({ clientId: 'S2AC-POVER', clientDesc: 'S2AC over capacity probe', dataSourceIds: overIds });
    out.capacity.over.serializedBytes = Buffer.byteLength(overIds.join(','), 'utf8');

    const nearIds = [];
    for (let i = 1; i <= 30; i += 1) nearIds.push('S2AC-NEAR-' + String(i).padStart(22, '0'));
    out.capacity.near = await apiPost({ clientId: 'S2AC-PNEAR', clientDesc: 'S2AC near capacity probe', dataSourceIds: nearIds });
    out.capacity.near.serializedBytes = Buffer.byteLength(nearIds.join(','), 'utf8');

    const caps = capIds();
    out.capacity.exact = await apiPost({ clientId: 'S2AC-PCAP', clientDesc: 'S2AC exact capacity probe', dataSourceIds: caps });
    out.capacity.exact.serializedBytes = Buffer.byteLength(caps.join(','), 'utf8');

    // ---------------- AC-055 three candidate states ----------------
    await openCreate();
    const normalOpts = await page.locator('.cc-opt').count();
    await page.locator('.cc-search input').fill('ZZZ-S2AC-NO-RESULT');
    await page.waitForTimeout(350);
    out.candidates.searchNoResult = { text: await page.locator('.cc-state-mini').first().textContent().catch(() => null), feedback: await dialogFeedback(), normalOptionCountBeforeSearch: normalOpts };
    await page.locator('.cc-search input').fill('S2AC-O05');
    await page.waitForTimeout(350);
    out.candidates.occupiedOption = await page.locator('.cc-opt').first().evaluate((e) => ({ text: e.textContent.trim(), disabled: e.disabled, reason: (e.querySelector('.cc-opt-reason') || {}).textContent || null }));
    await page.locator('.cc-dialog').getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(300);

    // empty options (injected response, labeled)
    await page.route('**/api/clients/data-source-options**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success', data: [], timestamp: '2026-11-04T00:00:00' }) }));
    await openCreate();
    await page.waitForTimeout(500);
    out.candidates.emptyInjected = { injection: 'fulfill E2 data:[]', text: await page.locator('.cc-state-mini').first().textContent().catch(() => null), feedback: await dialogFeedback() };
    await page.locator('.cc-dialog').getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(300);
    await page.unroute('**/api/clients/data-source-options**');

    // load failure (injected abort, labeled)
    await page.route('**/api/clients/data-source-options**', (route) => route.abort('failed'));
    await openCreate();
    await page.waitForTimeout(500);
    out.candidates.failureInjected = { injection: 'abort E2', text: await page.locator('.cc-state-mini').first().textContent().catch(() => null), feedback: await dialogFeedback() };
    await page.locator('.cc-dialog').getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(300);
    await page.unroute('**/api/clients/data-source-options**');

    // ---------------- AC-056/057/059/063 occupancy ----------------
    out.occupancy.createMulti = await apiPost({ clientId: 'S2AC-POCCNEW', clientDesc: 'S2AC create multi conflict', dataSourceIds: ['S2AC-O05'] });
    out.occupancy.editAddMulti = await apiPut('/S2AC-PEDIT', { clientId: 'S2AC-PEDIT', clientDesc: 'S2AC edit free probe', dataSourceIds: ['S2AC-O02', 'S2AC-O05'] });
    out.occupancy.enableConflict = await apiPut('/S2AC-PDIS2/enable', {});
    out.occupancy.disabledHolderBlocks = await apiPost({ clientId: 'S2AC-PO7TRY', clientDesc: 'S2AC try disabled holder source', dataSourceIds: ['S2AC-O07'] });
    out.occupancy.abnormalHolderBlocks = await apiPost({ clientId: 'S2AC-PO4TRY', clientDesc: 'S2AC try abnormal holder source', dataSourceIds: ['S2AC-O04'] });

    // release via real UI edit of PDIS3: remove O07, keep D21
    await openEdit('S2AC-PDIS3');
    const chosenBefore = await page.locator('.cc-chosen-list .el-tag').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    await removeChip('OccupyOrg07');
    const chosenAfter = await page.locator('.cc-chosen-list .el-tag').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    const relReqs = await (async () => {
      const before = reqLog.length;
      const respP = page.waitForResponse((r) => r.url().includes('/api/clients/S2AC-PDIS3') && r.request().method() === 'PUT', { timeout: 15000 }).catch(() => null);
      await page.locator('.cc-dialog-submit').click();
      const resp = await respP;
      await page.waitForTimeout(700);
      return { requests: reqLog.slice(before), httpStatus: resp ? resp.status() : null, response: resp ? await resp.json().catch(() => null) : null };
    })();
    out.occupancy.releaseEdit = { chosenBefore, chosenAfter, ...relReqs };
    out.occupancy.afterRelease = await apiPost({ clientId: 'S2AC-P07', clientDesc: 'S2AC after release probe', dataSourceIds: ['S2AC-O07'] });

    // ---------------- AC-068 edit abnormal source blocked ----------------
    await openEdit('S2AC-P68');
    out.editBlock.chosen = await page.locator('.cc-chosen-list .el-tag').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    const blockReqs = await submitOnce();
    out.editBlock.firstSubmit = { requests: blockReqs, feedback: await dialogFeedback() };
    await removeChip('S2AC-X02');
    await choose('S2AC-N11');
    const fixReqs = await (async () => {
      const before = reqLog.length;
      const respP = page.waitForResponse((r) => r.url().includes('/api/clients/S2AC-P68') && r.request().method() === 'PUT', { timeout: 15000 }).catch(() => null);
      await page.locator('.cc-dialog-submit').click();
      const resp = await respP;
      await page.waitForTimeout(700);
      return { requests: reqLog.slice(before), httpStatus: resp ? resp.status() : null, response: resp ? await resp.json().catch(() => null) : null };
    })();
    out.editBlock.afterFix = { chosen: await page.locator('.cc-chosen-list .el-tag').evaluateAll((els) => els.map((e) => e.textContent.trim())), ...fixReqs };

    // ---------------- AC-112 dialog layout (desktop) ----------------
    await openCreate();
    await page.locator('.cc-search input').fill('S2AC-L01');
    await page.waitForTimeout(300);
    await choose('S2AC-L01');
    await page.locator('.cc-search input').fill('S2AC,C01');
    await page.waitForTimeout(300);
    const commaOption = await page.locator('.cc-opt').first().evaluate((e) => ({ text: e.textContent.trim(), disabled: e.disabled, reason: (e.querySelector('.cc-opt-reason') || {}).textContent || null }));
    await page.locator('.cc-search input').fill('S2AC-L01');
    await page.waitForTimeout(300);
    const longOption = await page.locator('.cc-opt').first().evaluate((e) => {
      const main = e.querySelector('.cc-opt-main');
      const sub = e.querySelector('.cc-opt-sub');
      return { text: e.textContent.trim(), mainTruncated: main ? main.scrollWidth > main.clientWidth + 1 : null, subTruncated: sub ? sub.scrollWidth > sub.clientWidth + 1 : null };
    });
    out.layout.desktop = await page.evaluate(() => {
      const pane = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100, clientHeight: e.clientHeight, scrollHeight: e.scrollHeight, overflowY: getComputedStyle(e).overflowY }; };
      return { optionsPane: pane('.cc-pane--options'), chosenPane: pane('.cc-pane--chosen'), optList: pane('.cc-opt-list'), chosenList: pane('.cc-chosen-list'), dialog: pane('.cc-dialog') };
    });
    out.layout.commaOption = commaOption;
    out.layout.longOption = longOption;
    await page.locator('.cc-dialog').getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(300);
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    out.requestLog = reqLog;
    fs.writeFileSync('/root/ccfg-s2-evidence/group-d-results.json', JSON.stringify(out, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify({ ok: !out.error, error: out.error || null, capacity: out.capacity, cases: Object.keys(out.cases) }, null, 2));
})();

// narrow viewport layout measured in a second pass
(async () => {
  try {
    const { browser, page: p2 } = await openPage({ width: 900, height: 800 });
    const res = {};
    await p2.locator('.cc-btn-add').click();
    await p2.locator('.cc-dialog').waitFor({ state: 'visible' });
    await p2.waitForTimeout(600);
    res.layout = await p2.evaluate(() => {
      const pane = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100, clientHeight: e.clientHeight, scrollHeight: e.scrollHeight, overflowY: getComputedStyle(e).overflowY, overflowX: getComputedStyle(e).overflowX }; };
      return { optionsPane: pane('.cc-pane--options'), chosenPane: pane('.cc-pane--chosen'), optList: pane('.cc-opt-list'), chosenList: pane('.cc-chosen-list'), dialog: pane('.cc-dialog'), viewport: { w: innerWidth, h: innerHeight }, docScrollWidth: document.documentElement.scrollWidth };
    });
    fs.writeFileSync('/root/ccfg-s2-evidence/group-d-layout-900.json', JSON.stringify(res, null, 2));
    await browser.close();
  } catch (e) {
    fs.writeFileSync('/root/ccfg-s2-evidence/group-d-layout-900.json', JSON.stringify({ error: String(e && e.stack ? e.stack : e) }, null, 2));
  }
})();
