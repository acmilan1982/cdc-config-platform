const { openPage, rowOf } = require('../probe-lib.cjs');
const fs = require('fs');

async function measure(page, locator, label) {
  await locator.scrollIntoViewIfNeeded();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(350);
  await locator.evaluate((el) => {
    const tip = document.querySelector('.cc-single-tip');
    window.__tm = { enter: null, show: null, hide: null };
    el.addEventListener('mouseenter', () => { window.__tm.enter = performance.now(); }, { once: true });
    if (window.__tipObs) window.__tipObs.disconnect();
    window.__tipObs = new MutationObserver(() => {
      const vis = tip && getComputedStyle(tip).display !== 'none';
      if (vis && window.__tm.enter !== null && window.__tm.show === null) window.__tm.show = performance.now();
    });
    window.__tipObs.observe(tip, { attributes: true, attributeFilter: ['style'] });
  });
  await locator.hover();
  await page.waitForTimeout(650);
  const tm = await locator.evaluate(() => window.__tm);
  const lines = await page.locator('.cc-single-tip').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').map((e) => Array.from(e.querySelectorAll('.cc-single-line')).map((p) => p.textContent)));
  await page.mouse.move(2, 2);
  await page.waitForTimeout(150);
  return { label, enterToShowMs: tm.enter !== null && tm.show !== null ? Math.round(tm.show - tm.enter) : null, raw: tm, visibleTips: lines.length, lines };
}

(async () => {
  const { browser, page } = await openPage({ width: 1440, height: 900 });
  const out = {};
  try {
    out.x01 = await measure(page, rowOf(page, 'S2AC-PAMB2').locator('.cc-dstag').first(), 'PAMB2/X01 anomaly+ambiguity');
    out.d17 = await measure(page, rowOf(page, 'S2AC-P68').locator('.cc-dstag').nth(1), 'P68/D17 normal');
    out.occ = await measure(page, rowOf(page, 'S2AC-POCCV').locator('.cc-dstag').first(), 'POCCV/conflict');
    out.rowbad = await measure(page, rowOf(page, 'S2AC-PAMB1').locator('.cc-rowbad'), 'PAMB1/row-ambiguity badge');
    out.countNote = await measure(page, rowOf(page, 'S2AC-PAMB1').locator('.cc-count-note'), 'PAMB1/count note');
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    fs.writeFileSync('/root/ccfg-s2-evidence/group-a-delay-results.json', JSON.stringify(out, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify(out, null, 2));
})();
