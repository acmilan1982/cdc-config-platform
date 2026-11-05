const fs = require('fs');
const L = require('./lib.cjs');

const ID = 'c-dssr1-0906-a';
const OUT = process.argv[2] || '/tmp/s3ac/evidence/raw/ac021-delete.json';

(async () => {
  const result = { ac: 'CCFG-AC-021', target: ID, steps: [], pre: {}, cancel: {}, confirm: {}, post: {}, calls: [], errors: [] };
  const { browser, page, calls } = await L.openPage();
  try {
    result.pre.pageRowExists = await L.rowExists(page, ID);
    result.pre.pageVisibleIdCount = await page.locator(`.cc-id-cell .cc-id`).filter({ hasText: new RegExp('^' + ID + '$') }).count();
    const before = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    result.pre.apiRow = before.data.items.find((r) => r.clientId === ID) || null;
    result.pre.apiCount = before.data.items.length;

    // select the row so fixed-selection behavior can be observed
    await L.selectRow(page, ID);
    result.pre.selectedAfterClick = await L.selectedIds(page);
    result.steps.push({ step: 'select-row', selected: result.pre.selectedAfterClick });

    // ---- cancel branch ----
    await L.openMenu(page, ID);
    await L.clickMenu(page, '删除', '.cc-more-danger');
    result.cancel.box = await L.messageBox(page);
    const cancelWriteBefore = calls.length;
    await L.clickBoxButton(page, '取消');
    await L.boxGone(page);
    await L.waitIdle(page, 700);
    result.cancel.newCalls = calls.slice(cancelWriteBefore).map((c) => ({ method: c.method, url: c.url }));
    result.cancel.deleteRequests = L.writes(calls, 'DELETE', '/api/clients/').length;
    result.cancel.rowStillExists = await L.rowExists(page, ID);
    result.cancel.selectedAfterCancel = await L.selectedIds(page);
    result.steps.push({ step: 'cancel', boxTitle: result.cancel.box.title, content: result.cancel.box.content, buttons: result.cancel.box.buttons, deleteRequests: result.cancel.deleteRequests, rowStillExists: result.cancel.rowStillExists, selected: result.cancel.selectedAfterCancel });

    // ---- confirm branch ----
    await L.openMenu(page, ID);
    await L.clickMenu(page, '删除', '.cc-more-danger');
    result.confirm.box = await L.messageBox(page);
    const idx = calls.length;
    const respPromise = page.waitForResponse((r) => r.request().method() === 'DELETE' && r.url().includes('/api/clients/'), { timeout: 15000 });
    await L.clickBoxButton(page, '删除');
    const delResp = await respPromise;
    let delBody = null; try { delBody = await delResp.text(); } catch (e) {}
    await L.boxGone(page);
    await L.waitIdle(page, 1200);
    result.confirm.deleteResponse = { status: delResp.status(), body: delBody, url: delResp.url() };
    result.confirm.newCalls = calls.slice(idx).map((c) => ({ method: c.method, url: c.url, status: c.status, body: c.body, respBody: c.respBody }));
    result.confirm.rowGone = !(await L.rowExists(page, ID));
    result.confirm.selectedAfterDelete = await L.selectedIds(page);
    result.confirm.highlightRowCount = await page.locator('tr.lt-row-highlight__row').count();

    const after = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    result.post.apiRow = after.data.items.find((r) => r.clientId === ID) || null;
    result.post.apiCount = after.data.items.length;
    result.post.listReloaded = result.post.apiCount === result.pre.apiCount - 1;
    result.calls = calls.map((c) => ({ method: c.method, url: c.url, status: c.status, body: c.body, respBody: c.respBody }));
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
  } finally {
    await browser.close();
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ out: OUT, errors: result.errors.length, cancelDelete: result.cancel.deleteRequests, rowGone: result.confirm.rowGone, selectedAfterDelete: result.confirm.selectedAfterDelete }));
  }
})();
