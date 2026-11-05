const fs = require('fs');
const L = require('./lib.cjs');

const OUT = process.argv[2] || '/tmp/s3ac/evidence/raw/ac030-sequential.json';
const BASE_ID = 'probe-001';
const VARIANTS = ['probe-001', 'Probe-001', 'PROBE-001'];

async function apiList() {
  return (await (await fetch(L.API + '/api/clients?status=ALL')).json()).data.items;
}
async function post(body) {
  const r = await fetch(L.API + '/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch (e) {}
  return { httpStatus: r.status, body: json || text };
}

(async () => {
  const result = { ac: 'CCFG-AC-030', sequential: {}, concurrent: { note: 'see probe-ac030-concurrent.cjs' }, calls: [], errors: [] };
  const { browser, page, calls } = await L.openPage();
  try {
    result.sequential.preExisting = (await apiList()).filter((r) => r.clientId.toUpperCase() === BASE_ID.toUpperCase()).map((r) => r.clientId);

    // real business creation of probe-001 through the page
    await L.openCreate(page);
    await page.locator('.cc-dialog .cc-id-control input').first().fill(BASE_ID);
    await page.locator('.cc-dialog textarea').first().fill('S3AC AC-030 sequential base probe-001 (synthetic)');
    result.sequential.baseSource = await L.chooseSource(page, 'S3AC-S030-1');
    let p = L.waitPost(page);
    await L.clickSubmit(page);
    result.sequential.createResponse = await p;
    await page.waitForSelector('.cc-dialog', { state: 'hidden', timeout: 8000 }).catch(() => {});
    await L.waitIdle(page, 800);

    // page attempts for three case variants
    result.sequential.pageAttempts = [];
    for (let i = 0; i < VARIANTS.length; i += 1) {
      const id = VARIANTS[i];
      await L.openCreate(page);
      await page.locator('.cc-dialog .cc-id-control input').first().fill(id);
      await page.locator('.cc-dialog textarea').first().fill('S3AC AC-030 duplicate ID attempt (synthetic)');
      const opt = await L.chooseSource(page, 'S3AC-S030-F' + (i + 1));
      p = L.waitPost(page);
      await L.clickSubmit(page);
      const resp = await p;
      await L.waitIdle(page, 500);
      const errs = await L.fieldErrors(page);
      result.sequential.pageAttempts.push({ id, response: resp, fieldErrors: errs, sourceOption: opt });
      await L.closeDialog(page);
      await L.waitIdle(page, 250);
    }

    // bypass frontend once with a case-only-different id
    result.sequential.bypass = await post({ clientId: 'Probe-001', clientDesc: 'S3AC AC-030 bypass duplicate attempt (synthetic)', dataSourceIds: ['S3AC-S030-F4'] });

    // conflict-free mixed-case id, real page save, read back exact case
    await L.openCreate(page);
    await page.locator('.cc-dialog .cc-id-control input').first().fill('S3AC-C030-MiXeD');
    await page.locator('.cc-dialog textarea').first().fill('S3AC AC-030 mixed-case preservation (synthetic)');
    result.sequential.mixedSource = await L.chooseSource(page, 'S3AC-S030-2');
    p = L.waitPost(page);
    await L.clickSubmit(page);
    result.sequential.mixedCreateResponse = await p;
    await page.waitForSelector('.cc-dialog', { state: 'hidden', timeout: 8000 }).catch(() => {});
    await L.waitIdle(page, 800);

    const after = await apiList();
    result.sequential.after = {
      baseRow: after.find((r) => r.clientId === BASE_ID) || null,
      mixedRow: after.find((r) => r.clientId === 'S3AC-C030-MiXeD') || null,
      caseInsensitiveCount: after.filter((r) => r.clientId.toUpperCase() === BASE_ID.toUpperCase()).length,
    };
    result.calls = calls.map((c) => ({ method: c.method, url: c.url, status: c.status, body: c.body, respBody: c.respBody }));
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
  } finally {
    await browser.close();
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ out: OUT, errors: result.errors.length, create: result.sequential.createResponse, attempts: result.sequential.pageAttempts.map((a) => [a.id, a.response.body && JSON.parse(a.response.body).code, a.fieldErrors]), bypass: result.sequential.bypass, mixed: result.sequential.mixedCreateResponse }));
  }
})();
