const { openPage, rowOf, API } = require('./lib.cjs');
const fs = require('fs');

function cp(s) { return Array.from(s); }
function bytes(s) { return Buffer.byteLength(s, 'utf8'); }

(async () => {
  const { browser, page, requests } = await openPage({ width: 1440, height: 900 });
  const out = {};
  try {
    const apiDesc = async () => {
      const d = await (await fetch(API + '/api/clients?status=ALL')).json();
      const r = d.data.items.find((x) => x.clientId === 'S2AC-PLONG');
      return r ? r.clientDesc : null;
    };
    const before = await apiDesc();
    const prefix = cp(before).slice(0, 256).join('');

    await rowOf(page, 'S2AC-PLONG').locator('.cc-id').dblclick();
    await page.locator('.cc-dialog').waitFor({ state: 'visible' });
    await page.waitForTimeout(800);
    const echo = await page.locator('.cc-desc-row textarea').inputValue();
    out.reopenEcho = { codePoints: cp(echo).length, bytes: bytes(echo), isPrefix256: echo === prefix };

    const marker = requests.length;
    const respP = page.waitForResponse((r) => r.url().includes('/api/clients/S2AC-PLONG') && r.request().method() === 'PUT', { timeout: 15000 });
    await page.locator('.cc-dialog-submit').click();
    const resp = await respP;
    const respJson = await resp.json();
    await page.waitForTimeout(1000);
    out.save = {
      httpStatus: resp.status(),
      response: respJson,
      requests: requests.slice(marker),
      dialogVisibleAfter: await page.locator('.cc-dialog').isVisible().catch(() => null),
    };
    const after = await apiDesc();
    out.persisted = {
      codePoints: cp(after).length,
      bytes: bytes(after),
      equalsPrefix256: after === prefix,
      tail: cp(after).slice(-12).join(''),
    };
    out.listAfterSave = { codePoints: cp(await rowOf(page, 'S2AC-PLONG').locator('.cc-desc').textContent()).length };
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    fs.writeFileSync('/root/ccfg-s2-evidence/group-e2-results.json', JSON.stringify(out, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify(out, null, 2));
})();
