const fs = require('fs');
const L = require('./lib.cjs');

const OLD_ID = 'c-dssr1-0906-b';
const NEW_ID = 'S3AC-C038-RENAMED';
const SOURCE = 'S3AC-S038-1';
const OUT = process.argv[2] || '/tmp/s3ac/evidence/raw/ac038-rename.json';

(async () => {
  const result = { ac: 'CCFG-AC-038', oldId: OLD_ID, newId: NEW_ID, source: SOURCE, pre: {}, dialog: {}, response: null, post: {}, calls: [], errors: [] };
  const { browser, page, calls } = await L.openPage();
  try {
    const before = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    result.pre.apiRow = before.data.items.find((r) => r.clientId === OLD_ID) || null;
    result.pre.pageRowExists = await L.rowExists(page, OLD_ID);

    // open edit via real double-click on the ID cell
    await page.locator(`.cc-id-cell`).filter({ hasText: new RegExp('^' + OLD_ID.replace(/[-.]/g, '\\$&')) }).first().dblclick();
    await page.waitForSelector('.cc-dialog', { state: 'visible', timeout: 8000 });
    result.dialog.title = (await page.locator('.cc-dialog .el-dialog__title').innerText()).trim();
    result.dialog.lockedInitially = await page.locator('.cc-dialog [data-locked="true"]').count();

    // unlock ID and type new id (real keyboard)
    await page.locator('.cc-id-toggle').click();
    const idInput = page.locator('.cc-dialog .cc-id-control input').first();
    await idInput.click();
    await idInput.fill('');
    await page.keyboard.type(NEW_ID);
    result.dialog.idDraftValue = await idInput.inputValue();

    // choose the free source from the real candidate pane
    await page.locator('.cc-dialog .cc-search input').fill(SOURCE);
    await page.waitForTimeout(300);
    const opt = page.locator('.cc-dialog .cc-opt').filter({ hasText: SOURCE }).first();
    result.dialog.optionVisible = await opt.isVisible();
    result.dialog.optionDisabled = await opt.isDisabled().catch(() => null);
    await opt.click();
    await page.waitForTimeout(150);
    result.dialog.chosenText = await page.locator('.cc-dialog .cc-chosen-list').innerText();

    const respPromise = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/api\/clients\//.test(r.url()), { timeout: 15000 });
    await page.locator('.cc-dialog-submit').click();
    const resp = await respPromise;
    let body = null; try { body = await resp.text(); } catch (e) {}
    result.response = { status: resp.status(), body, url: resp.url() };
    await page.waitForSelector('.cc-dialog', { state: 'hidden', timeout: 8000 }).catch(() => {});
    await L.waitIdle(page, 1200);

    const after = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    result.post.oldRow = after.data.items.find((r) => r.clientId === OLD_ID) || null;
    result.post.newRow = after.data.items.find((r) => r.clientId === NEW_ID) || null;
    result.post.apiCount = after.data.items.length;
    result.post.newPageRowExists = await L.rowExists(page, NEW_ID);
    result.post.oldPageRowExists = await L.rowExists(page, OLD_ID);

    // run-state rows keyed by the old id, read directly (read-only)
    const rs = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    result.calls = calls.map((c) => ({ method: c.method, url: c.url, status: c.status, body: c.body, respBody: c.respBody }));
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
  } finally {
    await browser.close();
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ out: OUT, errors: result.errors.length, resp: result.response, old: !!result.post.oldRow, newId: result.post.newRow && result.post.newRow.clientId }));
  }
})();
