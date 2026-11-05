const fs = require('fs');
const L = require('./lib.cjs');

const EMOJI = '😀';
const OUT = process.argv[2] || '/tmp/s3ac/evidence/raw/ac033-desc.json';
const cp = (s) => Array.from(s).length;
const bytes = (s) => Buffer.byteLength(s, 'utf8');

async function post(body) {
  const r = await fetch(L.API + '/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch (e) {}
  return { httpStatus: r.status, body: json || text };
}

async function apiList() {
  return (await (await fetch(L.API + '/api/clients?status=ALL')).json()).data.items;
}

(async () => {
  const result = { ac: 'CCFG-AC-033', page: {}, api: [], post: {}, errors: [] };
  const { browser, page, calls } = await L.openPage();
  try {
    // ---------- page: trimmed-empty desc rejection ----------
    await L.openCreate(page);
    const idInput = page.locator('.cc-dialog .cc-id-control input').first();
    await idInput.fill('S3AC-C033-EMPTY');
    await L.chooseSource(page, 'S3AC-S033-1');
    const ta = page.locator('.cc-dialog textarea').first();
    await ta.fill('   ');
    let postCount = calls.filter((c) => c.method === 'POST').length;
    await L.clickSubmit(page);
    await L.waitIdle(page, 700);
    result.page.emptyDesc = {
      writtenValue: await ta.inputValue(),
      fieldErrors: await L.fieldErrors(page),
      postDelta: calls.filter((c) => c.method === 'POST').length - postCount,
      rowExistsLater: (await apiList()).some((r) => r.clientId === 'S3AC-C033-EMPTY'),
    };

    // ---------- page: 300 emoji typed, input-layer truncation to 256 cp ----------
    await idInput.fill('S3AC-C033-EMOJI');
    await ta.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText(EMOJI.repeat(300));
    await page.waitForTimeout(300);
    const typed = await ta.inputValue();
    result.page.emojiBoundary = {
      inputMethod: 'keyboard.insertText (real input events, not paste)',
      typedCodepoints: cp(typed),
      typedUtf8Bytes: bytes(typed),
      utf16Units: typed.length,
      surrogatePairIntact: typed.length === cp(typed) * 2,
    };
    postCount = calls.filter((c) => c.method === 'POST').length;
    const respPromise = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/clients$/.test(r.url()), { timeout: 15000 });
    await L.clickSubmit(page);
    const resp = await respPromise;
    let body = null; try { body = await resp.text(); } catch (e) {}
    result.page.emojiBoundary.response = { status: resp.status(), body };
    result.page.emojiBoundary.postDelta = calls.filter((c) => c.method === 'POST').length - postCount;
    await page.waitForSelector('.cc-dialog', { state: 'hidden', timeout: 8000 }).catch(() => {});
    await L.waitIdle(page, 800);

    // ---------- backend API supplements ----------
    const cases = [
      { name: 'ascii1024', clientId: 'S3AC-C033-A1024', desc: 'A'.repeat(1024), source: 'S3AC-S033-2', expect: 200 },
      { name: 'ascii1025', clientId: 'S3AC-C033-A1025', desc: 'A'.repeat(1025), source: 'S3AC-S033-F1', expect: 40102 },
      { name: 'mixed825cp1025b', clientId: 'S3AC-C033-MIX', desc: '中'.repeat(100) + 'A'.repeat(725), source: 'S3AC-S033-F2', expect: 40102 },
      { name: 'emoji256_1024b', clientId: 'S3AC-C033-EMOJIAPI', desc: EMOJI.repeat(256), source: 'S3AC-S033-F3', expect: 200 },
      { name: 'emoji257_1028b', clientId: 'S3AC-C033-EMOJI257', desc: EMOJI.repeat(257), source: 'S3AC-S033-F4', expect: 40102 },
      { name: 'rawSpaces', clientId: 'S3AC-C033-RAW', desc: '  S3AC raw  ', source: 'S3AC-S033-3', expect: 200 },
    ];
    for (const c of cases) {
      const before = await apiList();
      const r = await post({ clientId: c.clientId, clientDesc: c.desc, dataSourceIds: [c.source] });
      const after = await apiList();
      const row = after.find((x) => x.clientId === c.clientId) || null;
      result.api.push({
        name: c.name, clientId: c.clientId, codepoints: cp(c.desc), utf8Bytes: bytes(c.desc),
        expected: c.expect, httpStatus: r.httpStatus, responseCode: r.body && r.body.code,
        rowCreated: !!row, storedDescEqualsRequest: row ? row.clientDesc === c.desc : null,
        listCountBefore: before.length, listCountAfter: after.length,
      });
    }
    result.post.items = await apiList();
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
  } finally {
    await browser.close();
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ out: OUT, errors: result.errors.length, page: result.page, api: result.api.map((x) => [x.name, x.expected, x.responseCode, x.rowCreated]) }));
  }
})();
