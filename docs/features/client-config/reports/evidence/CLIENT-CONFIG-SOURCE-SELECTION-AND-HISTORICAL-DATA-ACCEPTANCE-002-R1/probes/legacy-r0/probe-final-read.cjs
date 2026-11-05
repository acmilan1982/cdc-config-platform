const { openPage, rowOf, API } = require('../probe-lib.cjs');
const fs = require('fs');

(async () => {
  const out = {};
  for (const [label, width, height] of [['1440', 1440, 900], ['1920', 1920, 1080]]) {
    const { browser, page } = await openPage({ width, height });
    try {
      const row = (id) => rowOf(page, id);
      const tags = async (id) => row(id).locator('.cc-dstag').evaluateAll((els) => els.map((e) => ({ text: e.textContent.trim(), cls: e.className, display: getComputedStyle(e).display, width: Math.round(e.getBoundingClientRect().width * 100) / 100 })));
      const rowbad = async (id) => row(id).locator('.cc-rowbad').evaluateAll((els) => els.map((e) => ({ text: e.textContent.trim(), visible: getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0, width: Math.round(e.getBoundingClientRect().width * 100) / 100 })));
      out[label] = {
        P14: { count: await row('S2AC-P14').locator('.cc-count').textContent(), tags: await tags('S2AC-P14') },
        PH1: { count: await row('S2AC-PH1').locator('.cc-count').textContent(), tags: await tags('S2AC-PH1'), rowbad: await rowbad('S2AC-PH1') },
        PAMB1: { count: await row('S2AC-PAMB1').locator('.cc-count').textContent(), countNote: await row('S2AC-PAMB1').locator('.cc-count-note').textContent().catch(() => null), rowbad: await rowbad('S2AC-PAMB1'), tags: await tags('S2AC-PAMB1') },
        PAMB2: { count: await row('S2AC-PAMB2').locator('.cc-count').textContent(), countNote: await row('S2AC-PAMB2').locator('.cc-count-note').textContent().catch(() => null), rowbad: await rowbad('S2AC-PAMB2'), tags: await tags('S2AC-PAMB2') },
      };
    } catch (e) { out[label].error = String(e && e.stack ? e.stack : e); }
    await browser.close();
  }
  const resp = await (await fetch(API + '/api/clients?status=ALL')).json();
  const p14 = resp.data.items.find((x) => x.clientId === 'S2AC-P14');
  out.apiP14 = { dataSourceIds: p14 ? p14.dataSourceIds : null, clientDesc: p14 ? p14.clientDesc : null };
  fs.writeFileSync('/root/ccfg-s2-evidence/final-read-results.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})();
