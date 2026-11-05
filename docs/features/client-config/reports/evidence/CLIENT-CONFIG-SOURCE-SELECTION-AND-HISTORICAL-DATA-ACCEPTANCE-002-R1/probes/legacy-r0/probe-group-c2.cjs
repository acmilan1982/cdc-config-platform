const { openPage } = require('../probe-lib.cjs');
const fs = require('fs');

(async () => {
  const { browser, page, requests } = await openPage({ width: 1440, height: 900 });
  const out = {};
  try {
    await page.locator('.cc-btn-add').click();
    await page.locator('.cc-dialog').waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
    await page.locator('.cc-desc-row textarea').fill('KEEP EMPTY S2AC');
    await page.waitForTimeout(400); // allow any prior message to clear; none expected on fresh page
    const before = requests.length;
    const chosen = await page.locator('.cc-chosen-list .el-tag').count();
    await page.locator('.cc-autogen').click();
    await page.waitForTimeout(900);
    out.noSourcesIsolated = {
      chosenCount: chosen,
      value: await page.locator('.cc-desc-row textarea').inputValue(),
      visibleMessages: await page.locator('.el-message').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).map((e) => e.textContent.trim())),
      requestDelta: requests.length - before,
      confirmBoxes: await page.locator('.el-message-box').count(),
    };
    out.noSourcesIsolated.unchanged = out.noSourcesIsolated.value === 'KEEP EMPTY S2AC';
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    fs.writeFileSync('/root/ccfg-s2-evidence/group-c2-results.json', JSON.stringify(out, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify(out, null, 2));
})();
