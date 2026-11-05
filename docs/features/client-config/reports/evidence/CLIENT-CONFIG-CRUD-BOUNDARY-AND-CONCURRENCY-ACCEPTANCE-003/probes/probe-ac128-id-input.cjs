const fs = require('fs');
const L = require('./lib.cjs');

const OUT = process.argv[2] || '/tmp/s3ac/evidence/raw/ac128-id-input.json';
const cp = (s) => Array.from(s).length;
const ILLEGAL = [
  { id: 'ab cd', label: 'space-inside' },
  { id: '中文ABC', label: 'chinese' },
  { id: 'ab@cd', label: 'at-sign' },
  { id: 'ab,cd', label: 'english-comma' },
  { id: '-abc', label: 'illegal-first-char' },
  { id: '   ', label: 'blank-only' },
  { id: '', label: 'empty' },
];
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
  const result = { ac: 'CCFG-AC-128', page: {}, illegalPage: [], apiBypass: [], conflictEvidence: { file: 'ac030-sequential.json', keys: ['sequential.pageAttempts', 'sequential.bypass'], codes: [40940, 40940, 40940, 40940] }, errors: [] };
  const { browser, context, page, calls } = await L.openPage();
  try {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: L.BASE }).catch(() => {});
    await L.openCreate(page);
    const idInput = page.locator('.cc-dialog .cc-id-control input').first();

    // real typing of 40 legal chars
    await idInput.click();
    await page.keyboard.type('A'.repeat(40));
    await page.waitForTimeout(200);
    const typed = await idInput.inputValue();
    result.page.typed = { method: 'keyboard.type (real key events)', inputUtf16Units: typed.length, codepoints: cp(typed), finalValue: typed, truncatedTo32: typed === 'A'.repeat(32) };

    // real paste of 40 legal chars via clipboard
    await idInput.click();
    await idInput.fill('');
    let pasteSupported = true;
    try {
      await page.evaluate((t) => navigator.clipboard.writeText(t), 'B'.repeat(40));
      await idInput.click();
      await page.keyboard.press('Control+V');
      await page.waitForTimeout(300);
    } catch (e) { pasteSupported = false; }
    const pasted = await idInput.inputValue();
    result.page.paste = { method: pasteSupported ? 'clipboard write + Control+V (real paste event)' : 'clipboard paste unsupported in this environment', supported: pasteSupported, inputUtf16Units: pasted.length, codepoints: cp(pasted), finalValue: pasted, truncatedTo32: pasted === 'B'.repeat(32) };

    // illegal inputs via real typing (script assignment only for clearing)
    await L.chooseSource(page, 'S3AC-S128-FREE');
    result.page.chosenSource = await page.locator('.cc-dialog .cc-chosen-list').innerText();
    for (const c of ILLEGAL) {
      const postBefore = calls.filter((x) => x.method === 'POST').length;
      await idInput.click();
      await idInput.fill('');
      if (c.id) await page.keyboard.type(c.id); else await idInput.fill('');
      await page.locator('.cc-dialog textarea').first().fill('S3AC AC-128 ID validation attempt (synthetic)');
      await L.clickSubmit(page);
      await L.waitIdle(page, 400);
      const errors = await L.fieldErrors(page);
      result.illegalPage.push({ ...c, inputMethod: c.id ? 'keyboard.type (real key events; clear via script fill)' : 'script assignment empty', finalValue: await idInput.inputValue(), fieldErrors: errors, postDelta: calls.filter((x) => x.method === 'POST').length - postBefore });
    }
    await L.closeDialog(page);
    await L.waitIdle(page, 300);

    // backend bypass with each illegal id
    for (const c of [...ILLEGAL, { id: 'C'.repeat(33), label: '33-chars' }]) {
      const before = (await apiList()).length;
      const r = await post({ clientId: c.id, clientDesc: 'S3AC AC-128 backend validation attempt (synthetic)', dataSourceIds: ['S3AC-S128-FREE'] });
      const after = (await apiList()).length;
      result.apiBypass.push({ ...c, httpStatus: r.httpStatus, responseCode: r.body && r.body.code, responseMessage: r.body && r.body.message, listDelta: after - before });
    }
    result.post = { probe001: (await apiList()).filter((r) => r.clientId.toUpperCase() === 'PROBE-001').map((r) => r.clientId) };
    result.calls = calls.map((c) => ({ method: c.method, url: c.url, status: c.status, body: c.body, respBody: c.respBody }));
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
  } finally {
    await browser.close();
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ out: OUT, errors: result.errors.length, typed: result.page.typed, paste: result.page.paste, illegal: result.illegalPage.map((x) => [x.label, x.finalValue, x.postDelta, x.fieldErrors]), api: result.apiBypass.map((x) => [x.label, x.responseCode]) }));
  }
})();
