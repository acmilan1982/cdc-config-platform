const fs = require('fs');
const L = require('./lib.cjs');

const ID = 'S3AC-C024-OFF';
const OUT = process.argv[2] || '/tmp/s3ac/evidence/raw/ac024-enable.json';

(async () => {
  const result = { ac: 'CCFG-AC-024', target: ID, pre: {}, cancel: {}, confirm: {}, post: {}, calls: [], errors: [] };
  const { browser, page, calls } = await L.openPage();
  try {
    const before = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    result.pre.apiRow = before.data.items.find((r) => r.clientId === ID) || null;
    result.pre.pageRowExists = await L.rowExists(page, ID);

    // ---- cancel branch ----
    await L.openMenu(page, ID);
    await L.clickMenu(page, '启用');
    result.cancel.box = await L.messageBox(page);
    const i0 = calls.length;
    await L.clickBoxButton(page, '取消');
    await L.boxGone(page);
    await L.waitIdle(page, 700);
    result.cancel.newCalls = calls.slice(i0).map((c) => ({ method: c.method, url: c.url }));
    result.cancel.putRequests = calls.filter((c) => c.method === 'PUT' && /\/enable$/.test(c.url)).length;
    result.cancel.rowStillDisabled = (await (await fetch(L.API + '/api/clients?status=ALL')).json()).data.items.find((r) => r.clientId === ID)?.status === 'DISABLED';

    // ---- confirm branch ----
    await L.openMenu(page, ID);
    await L.clickMenu(page, '启用');
    result.confirm.box = await L.messageBox(page);
    const i1 = calls.length;
    const respPromise = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/enable$/.test(r.url()), { timeout: 15000 });
    await L.clickBoxButton(page, '启用');
    const resp = await respPromise;
    let body = null; try { body = await resp.text(); } catch (e) {}
    await L.boxGone(page);
    await L.waitIdle(page, 1200);
    result.confirm.enableResponse = { status: resp.status(), body, url: resp.url() };
    result.confirm.newCalls = calls.slice(i1).map((c) => ({ method: c.method, url: c.url, status: c.status, body: c.body, respBody: c.respBody }));
    result.confirm.selectedAfterReload = await L.selectedIds(page);
    result.confirm.rowShowsEnabled = !(await L.rowOf(page, ID).locator('.cc-inactive-mark').count());

    const after = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    result.post.apiRow = after.data.items.find((r) => r.clientId === ID) || null;
    result.calls = calls.map((c) => ({ method: c.method, url: c.url, status: c.status, body: c.body, respBody: c.respBody }));
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
  } finally {
    await browser.close();
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ out: OUT, errors: result.errors.length, cancelPut: result.cancel.putRequests, enabled: result.post.apiRow && result.post.apiRow.status }));
  }
})();
