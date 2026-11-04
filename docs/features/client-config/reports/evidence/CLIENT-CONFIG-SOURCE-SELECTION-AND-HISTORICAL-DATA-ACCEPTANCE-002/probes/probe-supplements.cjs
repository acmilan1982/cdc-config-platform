const { openPage, rowOf, API } = require('./probe-lib.cjs');
const fs = require('fs');

(async () => {
  const out = {};

  // Normalized duplicate request: padded / empty / duplicate entries must normalize
  // to the same occupied ID and be rejected with every holder listed.
  const normRes = await fetch(API + '/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: 'S2AC-PNORM',
      clientDesc: 'S2AC normalized duplicate probe',
      dataSourceIds: [' S2AC-O05 ', '', 'S2AC-O05', ' S2AC-O05 '],
    }),
  });
  out.normalizedDuplicate = { status: normRes.status, json: await normRes.json() };

  // 1920x1080 ambiguity rows: item-level red + peer neutral + row-level badge visible.
  const wide = await openPage({ width: 1920, height: 1080 });
  try {
    for (const id of ['S2AC-PAMB1', 'S2AC-PAMB2']) {
      const row = rowOf(wide.page, id);
      out[id] = {
        count: await row.locator('.cc-count').textContent(),
        rowbad: await row.locator('.cc-rowbad').evaluateAll((els) => els.map((e) => ({
          text: e.textContent.trim(),
          visible: getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0,
        }))),
        countNote: await row.locator('.cc-count-note').textContent().catch(() => null),
        tags: await row.locator('.cc-dstag').evaluateAll((els) => els.map((e) => ({
          text: e.textContent.trim(),
          cls: e.className,
          width: Math.round(e.getBoundingClientRect().width * 100) / 100,
        }))),
        srcScroll: await row.locator('.cc-src').evaluate((el) => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth })),
      };
    }
  } finally { await wide.browser.close(); }

  // Trim-empty generation branch: DATA_SOURCE_ORG contains only a control character.
  // Backend normalizeNullable (Java trim) turns it into null, so the missing-org
  // guard is the branch that actually fires; this is recorded as such.
  const page = await openPage({ width: 1440, height: 900 });
  try {
    await page.page.locator('.cc-btn-add').click();
    await page.page.locator('.cc-dialog').waitFor({ state: 'visible' });
    await page.page.locator('.cc-desc-row textarea').fill('KEEP TRIMEMPTY S2AC');
    await page.page.locator('.cc-search input').fill('S2AC-TE01');
    await page.page.waitForTimeout(250);
    const opt = page.page.locator('.cc-opt').filter({ hasText: 'S2AC-TE01' }).first();
    out.trimEmptyOption = { found: (await opt.count()) > 0, text: await opt.textContent().catch(() => null) };
    if (await opt.count()) {
      await opt.click();
      await page.page.waitForTimeout(150);
      const before = page.requests.length;
      await page.page.locator('.cc-autogen').click();
      await page.page.waitForTimeout(450);
      out.trimEmpty = {
        value: await page.page.locator('.cc-desc-row textarea').inputValue(),
        messages: await page.page.locator('.el-message').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).map((e) => e.textContent.trim())),
        requestDelta: page.requests.length - before,
      };
    }
  } catch (e) { out.trimEmptyError = String(e && e.stack ? e.stack : e); }
  finally { await page.browser.close(); }

  fs.writeFileSync('/root/ccfg-s2-evidence/group-supp3-supplements.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})();
