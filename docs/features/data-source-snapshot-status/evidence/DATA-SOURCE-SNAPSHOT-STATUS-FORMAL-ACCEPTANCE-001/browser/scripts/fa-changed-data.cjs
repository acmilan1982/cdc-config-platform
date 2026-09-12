/*
 * DSS-AC-059 — "数据被另一写进程改变" (BR for the page behaviour, BI for the Change).
 *
 * The dev DB is static, so no other writer can mutate RUN_STATE on demand. We therefore
 * simulate an external write by substituting successive list responses (BI): the same
 * page re-reads and must reflect the newest values, while issuing no write of its own.
 * BI — backend list response substituted; NOT real backend data.
 */
const fs = require('fs');
const path = require('path');
const h = require('./harness.cjs');
const { lib } = h;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function firstTimeText(page) {
  return page.evaluate(() => {
    const tr = document.querySelector('.dss-table .el-table__body tbody tr');
    if (!tr) return null;
    const cells = tr.querySelectorAll('td');
    return { probe: tr.querySelector('.dss-probe-main') ? tr.querySelector('.dss-probe-main').innerText.trim() : null, times: Array.from(cells).slice(4).map((td) => td.innerText.trim()) };
  });
}

async function main() {
  const out = { mode: 'changed-data', label: 'BI — backend list response substituted between refreshes; NOT real backend data', route: lib.BASE + lib.ROUTE, assertions: [], phases: {} };
  const A = (name, ok, detail) => out.assertions.push({ name, ok, detail: detail === undefined ? '' : detail });

  const { browser, page, ctx, log } = await lib.launch(lib.VIEWPORTS[2]);
  await lib.installMeasure(page);

  let base = null;
  let phase = 1;
  const nonGet = [];
  page.on('request', (r) => { if (!['GET', 'HEAD'].includes(r.method())) nonGet.push(`${r.method} ${r.url()}`); });

  await page.route('**/api/monitor/data-source-run-state/list**', async (route) => {
    if (!base) { const real = await route.fetch(); base = await real.json(); }
    const body = JSON.parse(JSON.stringify(base));
    const stamp = phase === 1 ? '2026-09-12 08:00:01' : '2026-09-12 09:30:47';
    if (body.data && Array.isArray(body.data.records) && body.data.records[0]) {
      body.data.records[0].snapshotLastSeenAt = stamp;
      body.data.records[0].updatedAt = stamp;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await lib.openPage(page);
  await sleep(2500);
  const before = await firstTimeText(page);
  out.phases.before = before;

  phase = 2; // simulate an external writer changing the row before the next refresh
  await page.locator('.dss-refresh-btn').click();
  await sleep(1200);
  const after = await firstTimeText(page);
  out.phases.after = after;

  A('refreshReflectsNewestValue', !!before && !!after && before.times.join('|') !== after.times.join('|') && after.times.some((t) => t.includes('09:30:47')), `${JSON.stringify(before && before.times)} -> ${JSON.stringify(after && after.times)}`);
  A('noWriteRequestFromPage', nonGet.length === 0, JSON.stringify(nonGet.slice(0, 3)));
  A('refreshWasGet', log.requests.filter((r) => r.method === 'GET').length >= 1, String(log.requests.filter((r) => r.method === 'GET').length));

  out.global = { consoleErrors: log.consoleErrors, nonGet };
  const fails = out.assertions.filter((a) => !a.ok);
  out.summary = { assertions: out.assertions.length, failed: fails.length };
  fs.writeFileSync(path.join(lib.OUT, 'changed-data.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`changed-data.json assertions=${out.assertions.length} failed=${fails.length}`);
  console.log(JSON.stringify(out.phases));
  if (fails.length) console.log(fails.map((f) => `FAIL ${f.name}: ${f.detail}`).join('\n'));
  await ctx.close();
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
