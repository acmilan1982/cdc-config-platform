const { openPage, rowOf } = require('./lib.cjs');
const fs = require('fs');

(async () => {
  const { browser, page } = await openPage({ width: 1440, height: 900 });
  const out = {};
  try {
    async function tagMetrics(cid, idx) {
      return rowOf(page, cid).locator('.cc-dstag').nth(idx).evaluate((el) => {
        const txt = el.querySelector('.cc-txt'); const cs = getComputedStyle(el); const tcs = txt ? getComputedStyle(txt) : null;
        const r = el.getBoundingClientRect();
        return { text: el.textContent.trim(), cls: el.className, color: cs.color, bg: cs.backgroundColor, width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100, display: cs.display, alignItems: cs.alignItems, justifyContent: cs.justifyContent, truncated: txt ? txt.scrollWidth > txt.clientWidth + 1 : null };
      });
    }
    out.bad = { P8A_X01: await tagMetrics('S2AC-P8A', 0), PAMB2_X01: await tagMetrics('S2AC-PAMB2', 0) };
    out.neutral = { PAMB2_second: await tagMetrics('S2AC-PAMB2', 1), PAMB1_first: await tagMetrics('S2AC-PAMB1', 0) };
    // dialog option heights
    await page.locator('.cc-btn-add').click();
    await page.locator('.cc-dialog').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelectorAll('.cc-opt').length > 150, null, { timeout: 15000 });
    await page.waitForTimeout(400);
    out.options = await page.evaluate(() => {
      const list = document.querySelector('.cc-opt-list'); const lr = list.getBoundingClientRect();
      const items = Array.from(document.querySelectorAll('.cc-opt')).map((e) => { const r = e.getBoundingClientRect(); return { text: e.textContent.trim().slice(0, 24), height: Math.round(r.height * 100) / 100, top: r.top, bottom: r.bottom, fully: r.top >= lr.top - 0.5 && r.bottom <= lr.bottom + 0.5 }; });
      return { listHeight: list.clientHeight, count: items.length, firstTenHeights: items.slice(0, 10).map((i) => i.height), fullyVisible: items.filter((i) => i.fully).length, visibleOrPartial: items.filter((i) => i.top < lr.bottom && i.bottom > lr.top).length };
    });
    await page.locator('.cc-dialog').getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(300);
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    fs.writeFileSync('/root/ccfg-s2-evidence/group-supp2-results.json', JSON.stringify(out, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify(out, null, 2));
})();
