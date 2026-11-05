const fs = require('fs');
const L = require('./lib.cjs');

const DISABLE = [
  { id: 'S3AC-C027IA', anomaly: 'INACTIVE', src: 'S3AC-S027-INACT' },
  { id: 'S3AC-C027NA', anomaly: 'NOT_FOUND', src: 'S3AC-S027-MISS1' },
  { id: 'S3AC-C027CA', anomaly: 'COMMA_IN_ID', src: 'S3AC27A,COM1' },
  { id: 'S3AC-C027DA', anomaly: 'DUPLICATE', src: 'S3AC-S027-DUPP' },
];
const DELETE = [
  { id: 'S3AC-C027IB', anomaly: 'INACTIVE', src: 'S3AC-S027-INACT2' },
  { id: 'S3AC-C027NB', anomaly: 'NOT_FOUND', src: 'S3AC-S027-MISS2' },
  { id: 'S3AC-C027CB', anomaly: 'COMMA_IN_ID', src: 'S3AC27B,COM2' },
  { id: 'S3AC-C027DB', anomaly: 'DUPLICATE', src: 'S3AC-S027-DUPP' },
];
const OUT = process.argv[2] || '/tmp/s3ac/evidence/raw/ac027-disable-delete.json';

async function doAction(page, calls, item, kind) {
  const rec = { kind, ...item, pre: null, box: null, response: null, post: null, error: null };
  try {
    const before = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    const preRow = before.data.items.find((r) => r.clientId === item.id) || null;
    rec.pre = preRow && { status: preRow.status, fgActive: preRow.fgActive };
    if (!preRow) throw new Error('pre row missing');
    await L.openMenu(page, item.id);
    await L.clickMenu(page, kind === 'disable' ? '停用' : '删除', kind === 'disable' ? '.cc-more-warning' : '.cc-more-danger');
    rec.box = await L.messageBox(page);
    const pattern = kind === 'disable' ? /\/disable$/ : /\/api\/clients\/[^/]+$/;
    const respPromise = page.waitForResponse((r) => {
      if (kind === 'disable') return r.request().method() === 'PUT' && /\/disable$/.test(r.url());
      return r.request().method() === 'DELETE' && /\/api\/clients\/[^/]+$/.test(r.url());
    }, { timeout: 15000 });
    await L.clickBoxButton(page, kind === 'disable' ? '停用' : '删除');
    const resp = await respPromise;
    let body = null; try { body = await resp.text(); } catch (e) {}
    rec.response = { status: resp.status(), body, url: resp.url() };
    await L.boxGone(page);
    await L.waitIdle(page, 900);
    const after = await (await fetch(L.API + '/api/clients?status=ALL')).json();
    const postRow = after.data.items.find((r) => r.clientId === item.id) || null;
    rec.post = kind === 'delete' ? { exists: !!postRow } : (postRow && { status: postRow.status, fgActive: postRow.fgActive });
    rec.message = await page.locator('.el-message').last().innerText().catch(() => null);
  } catch (e) {
    rec.error = String(e && e.stack || e);
  }
  return rec;
}

(async () => {
  const result = { ac: 'CCFG-AC-027', disable: [], delete: [], calls: [], errors: [] };
  const { browser, page, calls } = await L.openPage();
  try {
    for (const item of DISABLE) result.disable.push(await doAction(page, calls, item, 'disable'));
    for (const item of DELETE) result.delete.push(await doAction(page, calls, item, 'delete'));
    result.calls = calls.map((c) => ({ method: c.method, url: c.url, status: c.status, body: c.body, respBody: c.respBody }));
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
  } finally {
    await browser.close();
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ out: OUT, errors: result.errors.length, disable: result.disable.map((r) => [r.id, r.response && r.response.body, r.post]), delete: result.delete.map((r) => [r.id, r.response && r.response.body, r.post]) }));
  }
})();
