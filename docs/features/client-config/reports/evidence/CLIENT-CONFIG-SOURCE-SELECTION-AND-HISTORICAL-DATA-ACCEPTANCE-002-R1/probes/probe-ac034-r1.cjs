// R1 AC-034 probe. Uses the R0 probe library copied to this directory.
const { openPage, API } = require('./probe-lib.cjs');
const fs = require('fs');

const OVER_IDS = [];
for (let i = 1; i <= 32; i += 1) OVER_IDS.push('S2AC-R1O-' + String(i).padStart(23, '0'));

const out = { task: 'CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1', ac: 'CCFG-AC-034', executedAt: new Date().toISOString(), ids: OVER_IDS };
let browser;
let page;
let reqLog;

function bytes(ids) { return Buffer.byteLength(ids.join(','), 'utf8'); }

async function dialogFeedback() {
  return await page.evaluate(() => {
    const dlg = document.querySelector('.cc-dialog');
    if (!dlg) return null;
    return Array.from(dlg.querySelectorAll('.ced-field-error, .cc-field-hint, .cc-state-mini'))
      .map((e) => ({ text: e.textContent.trim(), cls: e.className, visible: e.getBoundingClientRect().width > 0 }));
  });
}
async function choose(id) {
  await page.locator('.cc-search input').fill(id);
  await page.waitForTimeout(160);
  await page.locator('.cc-opt').filter({ hasText: id }).first().click();
  await page.waitForTimeout(90);
}
async function api(path, opts) {
  return await page.evaluate(async ({ path, opts }) => {
    const res = await fetch('http://127.0.0.1:8080' + path, opts || {});
    let json = null;
    try { json = await res.json(); } catch (e) { json = null; }
    return { status: res.status, json };
  }, { path, opts });
}

(async () => {
  try {
    const opened = await openPage({ width: 1440, height: 900 });
    browser = opened.browser; page = opened.page; reqLog = opened.requests;

    // 1. Precondition: sources exist, are selectable candidates and unoccupied.
    const opts = await page.evaluate(async (ids) => {
      const res = await fetch('http://127.0.0.1:8080/api/clients/data-source-options');
      const json = await res.json();
      const want = new Set(ids);
      return (json.data || []).filter((o) => want.has(o.dataSourceId)).map((o) => ({
        dataSourceId: o.dataSourceId, selectable: o.selectable,
        notSelectableReason: o.notSelectableReason || null, occupiedByClientIds: o.occupiedByClientIds || [],
      }));
    }, OVER_IDS.concat(['S2AC-R1S1', 'S2AC-R1R1']));
    out.precondition = {
      requestedCount: OVER_IDS.length + 2,
      returned: opts.length,
      allSelectable: opts.every((o) => o.selectable === true && !o.notSelectableReason),
      optionFields: opts,
      serializedBytes: bytes(OVER_IDS),
      serializedFormula: '32 ids x 32 chars + 31 commas = ' + bytes(OVER_IDS),
    };

    // 2. Real create page: select all 32 sources, submit.
    await page.locator('.cc-btn-add').click();
    await page.locator('.cc-dialog').waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
    await page.locator('.cc-id-control input').fill('S2AC-R1OVER');
    await page.locator('.cc-desc-row textarea').fill('S2AC R1 over capacity probe');
    for (const id of OVER_IDS) await choose(id);
    const chosen = await page.locator('.cc-chosen-list .el-tag').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    const searchable = await page.locator('.cc-opt').count();
    const before = reqLog.length;
    let respInfo = null;
    const respP = page.waitForResponse((r) => r.url().includes('/api/clients') && r.request().method() === 'POST', { timeout: 6000 }).catch(() => null);
    await page.locator('.cc-dialog-submit').click();
    const resp = await respP;
    if (resp) {
      respInfo = { httpStatus: resp.status(), responseJson: await resp.json().catch(() => null) };
    }
    await page.waitForTimeout(700);
    out.uiOver = {
      chosenCount: chosen.length,
      chosenTextsSample: chosen.slice(0, 2),
      optionCountAfterFinalSearch: searchable,
      requests: reqLog.slice(before),
      feedback: await dialogFeedback(),
      response: respInfo,
    };
    await page.locator('.cc-dialog').getByRole('button', { name: '取消' }).click().catch(() => {});
    await page.waitForTimeout(300);

    // 3. Real API with the same verified set.
    out.apiOver = await api('/api/clients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: 'S2AC-R1OVER', clientDesc: 'S2AC R1 over capacity probe', dataSourceIds: OVER_IDS }),
    });
    out.apiOver.serializedBytes = bytes(OVER_IDS);

    // 4. Independent read-back: over-capacity request must not create/partially update.
    const list = await api('/api/clients?status=ALL');
    const items = (list.json && list.json.data && list.json.data.items) || [];
    const overRow = items.find((r) => r.clientId === 'S2AC-R1OVER') || null;
    out.noPersistence = {
      listStatus: list.status,
      listShape: 'data.items[]',
      rowPresent: !!overRow,
      row: overRow,
      totalRows: items.length,
    };

    // 5. Reuse the R0 1000-byte success leg if the persisted row has not drifted.
    const capRow = items.find((r) => r.clientId === 'S2AC-PCAP') || null;
    out.exact1000Reuse = {
      source: 'R0 results/group-d-results.json -> capacity.exact',
      rowPresent: !!capRow,
      fgActive: capRow ? capRow.fgActive : null,
      rawDataSourceIdsBytes: capRow && capRow.rawDataSourceIds ? Buffer.byteLength(capRow.rawDataSourceIds, 'utf8') : null,
      dataSourceCount: capRow ? capRow.dataSourceCount : null,
    };
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    out.requestLog = reqLog;
    fs.writeFileSync(__dirname + '/../results/ac034-r1-results.json', JSON.stringify(out, null, 2));
    if (browser) await browser.close();
  }
  console.log(JSON.stringify({ ok: !out.error, error: out.error || null, precondition: out.precondition && { returned: out.precondition.returned, allSelectable: out.precondition.allSelectable, serializedBytes: out.precondition.serializedBytes }, uiOver: out.uiOver && { chosenCount: out.uiOver.chosenCount, requestCount: out.uiOver.requests.length, feedback: out.uiOver.feedback, response: out.uiOver.response }, apiOver: out.apiOver, noPersistence: out.noPersistence, exact1000Reuse: out.exact1000Reuse }, null, 2));
})();
