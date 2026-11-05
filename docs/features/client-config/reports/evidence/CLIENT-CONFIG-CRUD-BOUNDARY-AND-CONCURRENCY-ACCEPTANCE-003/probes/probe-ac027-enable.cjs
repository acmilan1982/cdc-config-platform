const fs = require('fs');
const L = require('./lib.cjs');

const ALLOW = [
  { id: 'S3AC-C027IC', anomaly: 'INACTIVE', src: 'S3AC-S027-INACT3' },
  { id: 'S3AC-C027NC', anomaly: 'NOT_FOUND', src: 'S3AC-S027-MISS3' },
  { id: 'S3AC-C027CC', anomaly: 'COMMA_IN_ID', src: 'S3AC27C,COM3' },
];
const REJECT = [{ id: 'S3AC-C027DC', anomaly: 'DUPLICATE', src: 'S3AC-S027-DUPP' }];
const OUT = process.argv[2] || '/tmp/s3ac/evidence/raw/ac027-enable.json';

async function doEnable(page, item) {
  const rec = { ...item, pre: null, box: null, response: null, post: null, message: null, error: null };
  try {
    const before = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    const preRow = before.data.items.find((r) => r.clientId === item.id) || null;
    rec.pre = preRow && { status: preRow.status, fgActive: preRow.fgActive, desc: preRow.clientDesc, raw: preRow.rawDataSourceIds };
    await L.openMenu(page, item.id);
    await L.clickMenu(page, '启用');
    rec.box = await L.messageBox(page);
    const respPromise = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/enable$/.test(r.url()), { timeout: 15000 });
    await L.clickBoxButton(page, '启用');
    const resp = await respPromise;
    let body = null; try { body = await resp.text(); } catch (e) {}
    rec.response = { status: resp.status(), body, url: resp.url() };
    await L.boxGone(page);
    await L.waitIdle(page, 900);
    rec.message = await page.locator('.el-message').last().innerText().catch(() => null);
    const after = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    const postRow = after.data.items.find((r) => r.clientId === item.id) || null;
    rec.post = postRow && { status: postRow.status, fgActive: postRow.fgActive, desc: postRow.clientDesc, raw: postRow.rawDataSourceIds };
  } catch (e) {
    rec.error = String(e && e.stack || e);
  }
  return rec;
}

(async () => {
  const result = { ac: 'CCFG-AC-027', allow: [], reject: [], calls: [], errors: [] };
  const { browser, page, calls } = await L.openPage();
  try {
    for (const item of ALLOW) result.allow.push(await doEnable(page, item));
    for (const item of REJECT) result.reject.push(await doEnable(page, item));
    result.calls = calls.map((c) => ({ method: c.method, url: c.url, status: c.status, body: c.body, respBody: c.respBody }));
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
  } finally {
    await browser.close();
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ out: OUT, errors: result.errors.length, allow: result.allow.map((r) => [r.id, r.response && r.response.body, r.post]), reject: result.reject.map((r) => [r.id, r.response && r.response.body, r.message, r.post]) }));
  }
})();
