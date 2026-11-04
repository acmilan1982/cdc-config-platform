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
    const initial = await apiDesc();
    out.initial = { codePoints: cp(initial).length, bytes: bytes(initial), tail: cp(initial).slice(-12).join(''), hashLike: null };
    out.initial.listText = await rowOf(page, 'S2AC-PLONG').locator('.cc-desc').textContent();
    out.initial.listCodePoints = cp(out.initial.listText).length;

    const beforeOpen = requests.length;
    await rowOf(page, 'S2AC-PLONG').locator('.cc-id').dblclick();
    await page.locator('.cc-dialog').waitFor({ state: 'visible' });
    await page.waitForTimeout(1200);
    const echo = await page.locator('.cc-desc-row textarea').inputValue();
    out.openEdit = {
      echoCodePoints: cp(echo).length,
      echoBytes: bytes(echo),
      isPrefix256: echo === cp(initial).slice(0, 256).join(''),
      echoTail: cp(echo).slice(-12).join(''),
      requestDelta: requests.slice(beforeOpen),
      writeRequests: requests.slice(beforeOpen).filter((r) => ['POST', 'PUT', 'DELETE'].includes(r.method)),
    };

    await page.locator('.cc-dialog').getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(500);
    out.afterCancel = { dialogVisible: await page.locator('.cc-dialog').isVisible().catch(() => null) };

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.cc-table', { timeout: 20000 });
    await page.waitForFunction(() => !!document.querySelector('.cc-src[data-client-id="S2AC-PLONG"]'), null, { timeout: 20000 });
    await page.waitForTimeout(600);
    const listAfter = await rowOf(page, 'S2AC-PLONG').locator('.cc-desc').textContent();
    const apiAfter = await apiDesc();
    out.afterCloseReload = {
      listCodePoints: cp(listAfter).length,
      listEqualsInitial: listAfter === initial,
      apiCodePoints: cp(apiAfter).length,
      apiBytes: bytes(apiAfter),
      apiEqualsInitial: apiAfter === initial,
      tail: cp(apiAfter).slice(-12).join(''),
    };
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    fs.writeFileSync('/root/ccfg-s2-evidence/group-e-results.json', JSON.stringify(out, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify(out, null, 2));
})();
