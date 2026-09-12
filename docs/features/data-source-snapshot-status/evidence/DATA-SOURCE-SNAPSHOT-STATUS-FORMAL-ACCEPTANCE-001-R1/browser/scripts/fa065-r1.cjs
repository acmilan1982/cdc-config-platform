/*
 * DSS-AC-065 R1 — real-browser supplement for the 7 approved temporary RUN_STATE rows.
 *
 * Read-only: it only navigates the real 5173 formal page, drives the read-only
 * query controls, reads rendered DOM / computed text and observes network + console.
 * It issues no write of its own and asserts that the page issues none either.
 *
 * The 7 rows under test (composite PK = CLIENT_ID + DATA_SOURCE_ID):
 *   S1 hosp-007 / 112-source-19c            SNAPSHOT_COMPLETED            -> COMPLETED  "快照已完成"
 *   S2 hosp-002 / 112-source-19c            SNAPSHOT_FA065_UNKNOWN        -> UNKNOWN    "未知状态"
 *   S3 dss-fa065-r1-client-orphan / 112-source-19c   SNAPSHOT_RUNNING    -> RUNNING, client NOT_FOUND fallback
 *   S4 hosp-0061 / dss-fa065-r1-source-orphan        SNAPSHOT_COMPLETED  -> COMPLETED, source NOT_FOUND fallback
 *   S5 CCFG-AC-R1-OFF / 112-source-19c      SNAPSHOT_RUNNING              -> RUNNING, disabled client (停用)
 *   S6 CCFG-AC-R1-ON  / 199-source          SNAPSHOT_RUNNING              -> RUNNING, disabled source config
 *   S7 hosp-012 / company-target-doris-v4   SNAPSHOT_RUNNING              -> RUNNING, non-SOURCE category
 */
const fs = require('fs');
const path = require('path');
const h = require('./harness.cjs');
const { lib } = h;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROWS_FN = () => Array.from(document.querySelectorAll('.dss-table .el-table__body tbody tr')).map((tr, i) => {
  const td = Array.from(tr.querySelectorAll('td'));
  const g = (sel, el) => { const x = (el || tr).querySelector(sel); return x ? x.innerText.trim() : null; };
  const tag = td[3] ? td[3].querySelector('.el-tag') : null;
  const tt = (el) => el && el.getAttribute('data-tt-kind');
  const probeEl = td[1] ? td[1].querySelector('.dss-probe-main') : null;
  const srcEl = td[2] ? td[2].querySelector('.dss-cell-main') : null;
  return {
    i,
    seq: g('.dss-seq'),
    warnRow: tr.classList.contains('dss-warning-row'),
    probe: g('.dss-probe-main', td[1]),
    probeTt: tt(probeEl),
    probeInactive: !!(td[1] && td[1].querySelector('.dss-inactive-mark')),
    probeInactiveText: g('.dss-inactive-mark', td[1]),
    probeDash: !!(td[1] && td[1].querySelector('.dss-cell-dash')),
    src: g('.dss-cell-main', td[2]),
    srcTt: tt(srcEl),
    srcInactive: !!(td[2] && td[2].querySelector('.dss-inactive-mark')),
    srcDash: !!(td[2] && td[2].querySelector('.dss-cell-dash')),
    status: td[3] ? td[3].innerText.replace(/\s+/g, ' ').trim() : null,
    tagClass: tag ? tag.className : null,
    statusTt: tt(td[3] && td[3].querySelector('.dss-status-trigger')),
    lastSeen: g('.dss-time', td[4]),
    completed: g('.dss-time', td[5]),
    updated: g('.dss-time', td[6]),
  };
});

/* Option text -> exact candidate id. The option renders "id（desc）", or a bare id,
 * or an id truncated to 20 code points followed by "..." (ghost / long-id rows). */
const findOptIdx = (opts, exact) => opts.findIndex((o) => {
  const t = o.text;
  if (t === exact) return true;
  if (t.startsWith(exact + '（') || t.startsWith(exact)) return true;
  if (t.endsWith('...')) {
    const head = t.slice(0, -3);
    return exact.startsWith(head) && head.length > 0;
  }
  return false;
});

/* Select an option in the draft layer, then apply it through the real 查询 button. */
async function applyFilter(page, dim, exactId) {
  await h.openPanel(page, dim);
  const opts = await h.options(page, dim);
  const idx = findOptIdx(opts, exactId);
  if (idx < 0) { await h.closePanel(page, dim); return { ok: false, opts, idx }; }
  await h.clickOption(page, dim, idx);
  await sleep(400);
  await h.closePanel(page, dim);
  await runQuery(page);
  return { ok: true, opts, idx, selectedText: opts[idx].text };
}

async function runQuery(page) {
  const p = page.waitForResponse((r) => r.url().includes('/api/monitor/data-source-run-state/list') && r.status() === 200, { timeout: 15000 }).catch(() => null);
  await h.robustClick(page, '.dss-query-btn');
  await p;
  await page.waitForTimeout(700);
}

async function reset(page) {
  await h.robustClick(page, '.dss-reset-btn');
  await sleep(400);
  await runQuery(page);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(lib.OUT, 'screenshots', name), fullPage: true });
}

async function main() {
  const out = {
    mode: 'fa065-r1',
    label: 'REAL backend + REAL 5173 page; 7 approved temporary RUN_STATE rows present in dev DB',
    route: lib.BASE + lib.ROUTE,
    assertions: [],
    phases: {},
    cases: {},
  };
  const A = (name, ok, detail) => out.assertions.push({ name, ok: !!ok, detail: detail === undefined ? '' : detail });

  const { browser, page, ctx, log } = await lib.launch(lib.VIEWPORTS[2]);
  await lib.installMeasure(page);

  const nonGet = [];
  page.on('request', (r) => { if (!['GET', 'HEAD'].includes(r.method())) nonGet.push(`${r.method} ${r.url()}`); });

  await lib.openPage(page);
  await sleep(1500);

  // ---- Full table (all rows retained) -------------------------------------
  const all = await page.evaluate(ROWS_FN);
  out.phases.full = { count: all.length, rows: all };
  const dist = {};
  all.forEach((r) => { dist[r.status] = (dist[r.status] || 0) + 1; });
  const warnRows = all.filter((r) => r.warnRow).length;
  out.phases.distribution = { byStatus: dist, total: all.length, warnRows };
  await shot(page, '01-full-page.png');

  A('pageLoadsFormalRoute', all.length > 0, `rows=${all.length}`);
  A('runStateRowsAllRetained', all.length === 37, `rendered=${all.length}, expected=37 (30 baseline + 7 temp)`);
  A('statusDistribution17_7_13', dist['● 快照进行中'] === 17 && dist['? 未知状态'] === 7 && dist['✓ 快照已完成'] === 13, JSON.stringify(dist));
  A('warningRows7', warnRows === 7, String(warnRows));

  const byPk = (p, s) => all.find((r) => r.probe === p && (s === undefined || (r.src === s || r.srcTt === `source-main-${p}${s}`)));

  // ---- The 7 approved temp rows -------------------------------------------
  const T = {};
  T.S1 = all.find((r) => r.probe === 'hosp-007' && r.lastSeen === '2026-09-12 20:58:00');
  T.S2 = all.find((r) => r.probe === 'hosp-002' && r.lastSeen === '2026-09-12 20:57:00');
  T.S3 = all.find((r) => r.probe === 'dss-fa065-r1-client-orphan' && r.src === '孝感市第一人民医院');
  T.S4 = all.find((r) => r.probe === 'hosp-0061' && r.src === 'dss-fa065-r1-source-orphan');
  T.S5 = all.find((r) => r.probe === 'CCFG-AC-R1-OFF' && r.lastSeen === '2026-09-12 20:54:00');
  T.S6 = all.find((r) => r.probe === 'CCFG-AC-R1-ON' && r.src === '业务库');
  T.S7 = all.find((r) => r.probe === 'hosp-012' && r.src === 'doirs库');
  out.cases.rows = T;
  const found = Object.entries(T).filter(([, v]) => v).map(([k]) => k);
  A('sevenTempRowsAllPresent', found.length === 7, `found=${found.join(',')}`);

  A('S1_completedRow', T.S1 && T.S1.status === '✓ 快照已完成' && /el-tag--success/.test(T.S1.tagClass) && !T.S1.warnRow
    && T.S1.lastSeen === '2026-09-12 20:58:00' && T.S1.completed === '2026-09-12 20:58:30' && T.S1.updated === '2026-09-12 20:58:30',
    T.S1 ? JSON.stringify({ s: T.S1.status, ls: T.S1.lastSeen, cp: T.S1.completed, up: T.S1.updated }) : 'row not found');

  A('S2_unknownRow', T.S2 && T.S2.status === '? 未知状态' && /el-tag--warning/.test(T.S2.tagClass) && T.S2.warnRow
    && T.S2.lastSeen === '2026-09-12 20:57:00' && T.S2.completed === '--',
    T.S2 ? JSON.stringify({ s: T.S2.status, w: T.S2.warnRow, ls: T.S2.lastSeen, cp: T.S2.completed }) : 'row not found');

  A('S3_orphanProbeFallback', T.S3 && T.S3.probe === 'dss-fa065-r1-client-orphan' && T.S3.probeInactive === false
    && T.S3.probeDash === false && T.S3.status === '● 快照进行中' && T.S3.src === '孝感市第一人民医院',
    T.S3 ? JSON.stringify({ p: T.S3.probe, pi: T.S3.probeInactive, pd: T.S3.probeDash, s: T.S3.status, src: T.S3.src }) : 'row not found');

  A('S4_orphanSourceFallback', T.S4 && T.S4.src === 'dss-fa065-r1-source-orphan' && T.S4.srcInactive === false
    && T.S4.srcDash === false && T.S4.status === '✓ 快照已完成' && T.S4.lastSeen === '2026-09-12 20:55:00' && T.S4.completed === '2026-09-12 20:55:30',
    T.S4 ? JSON.stringify({ src: T.S4.src, si: T.S4.srcInactive, sd: T.S4.srcDash, s: T.S4.status, cp: T.S4.completed }) : 'row not found');

  A('S5_disabledProbeMark', T.S5 && T.S5.probeInactive === true && T.S5.probeInactiveText === '停用' && T.S5.status === '● 快照进行中',
    T.S5 ? JSON.stringify({ pi: T.S5.probeInactive, pit: T.S5.probeInactiveText, s: T.S5.status }) : 'row not found');

  A('S6_disabledSourceConfig', T.S6 && T.S6.src === '业务库' && T.S6.status === '● 快照进行中' && T.S6.lastSeen === '2026-09-12 20:53:00',
    T.S6 ? JSON.stringify({ src: T.S6.src, s: T.S6.status, ls: T.S6.lastSeen }) : 'row not found');

  A('S7_nonSourceCategory', T.S7 && T.S7.src === 'doirs库' && T.S7.srcDash === false && T.S7.lastSeen === '--' && T.S7.status === '● 快照进行中',
    T.S7 ? JSON.stringify({ src: T.S7.src, sd: T.S7.srcDash, ls: T.S7.lastSeen, s: T.S7.status }) : 'row not found');

  // ---- Sort: status group RUNNING < UNKNOWN < COMPLETED, UPDATED_AT desc within group
  const top4 = all.slice(0, 4).map((r) => `${r.probe}|${r.src}|${r.updated}`);
  A('sortRunningGroupHead', top4.join(' ; ') === [
    'dss-fa065-r1-client-orphan|孝感市第一人民医院|2026-09-12 20:56:00',
    'CCFG-AC-R1-OFF|孝感市第一人民医院|2026-09-12 20:54:00',
    'CCFG-AC-R1-ON|业务库|2026-09-12 20:53:00',
    'hosp-012|doirs库|2026-09-12 20:52:00',
  ].join(' ; '), top4.join(' ; '));

  const iUnknown = all.findIndex((r) => r.warnRow);
  const iCompleted = all.findIndex((r) => r.status === '✓ 快照已完成');
  A('sortGroupBoundaries', iUnknown === 17 && iCompleted === 24, `firstUnknownIdx=${iUnknown}, firstCompletedIdx=${iCompleted}`);
  A('sortUnknownGroupHead', all[iUnknown] && all[iUnknown].probe === 'hosp-002' && all[iUnknown].updated === '2026-09-12 20:57:00',
    all[iUnknown] ? `${all[iUnknown].probe}|${all[iUnknown].updated}` : 'n/a');
  A('sortCompletedGroupHead', all[iCompleted] && all[iCompleted + 1]
    && all[iCompleted].probe === 'hosp-007' && all[iCompleted].completed === '2026-09-12 20:58:30'
    && all[iCompleted + 1].probe === 'hosp-0061' && all[iCompleted + 1].completed === '2026-09-12 20:55:30',
    all[iCompleted] ? `${all[iCompleted].probe}|${all[iCompleted].completed} ; ${all[iCompleted + 1] && all[iCompleted + 1].probe}|${all[iCompleted + 1] && all[iCompleted + 1].completed}` : 'n/a');

  // ---- Drive the REAL read-only query controls ----------------------------
  await reset(page); await sleep(800);
  let f = await applyFilter(page, 'client', 'hosp-007');
  let rows = await page.evaluate(ROWS_FN);
  out.phases.filterHosp007 = { selectedText: f.selectedText, count: rows.length, rows };
  A('uiFilter_client_hosp007', f.ok && rows.length === 1 && rows[0].probe === 'hosp-007' && rows[0].status === '✓ 快照已完成',
    JSON.stringify({ sel: f.selectedText, n: rows.length, p: rows[0] && rows[0].probe }));
  await shot(page, '03-filter-client-hosp007.png');

  await reset(page); await sleep(800);
  f = await applyFilter(page, 'client', 'dss-fa065-r1-client-orphan');
  rows = await page.evaluate(ROWS_FN);
  out.phases.filterOrphanProbe = { selectedText: f.selectedText, count: rows.length, rows };
  A('uiFilter_client_orphanProbe', f.ok && rows.length === 1 && rows[0].probe === 'dss-fa065-r1-client-orphan' && rows[0].probeDash === false,
    JSON.stringify({ sel: f.selectedText, n: rows.length, p: rows[0] && rows[0].probe }));
  await shot(page, '04-filter-client-orphan.png');

  await reset(page); await sleep(800);
  f = await applyFilter(page, 'client', 'hosp-002');
  rows = await page.evaluate(ROWS_FN);
  out.phases.filterHosp002 = { selectedText: f.selectedText, count: rows.length, rows };
  A('uiFilter_client_hosp002_unknown', f.ok && rows.length === 1 && rows[0].probe === 'hosp-002' && rows[0].status === '? 未知状态' && rows[0].warnRow,
    JSON.stringify({ sel: f.selectedText, n: rows.length, p: rows[0] && rows[0].probe, s: rows[0] && rows[0].status }));
  await shot(page, '05-filter-client-hosp002.png');

  await reset(page); await sleep(800);
  f = await applyFilter(page, 'status', '未知状态');
  rows = await page.evaluate(ROWS_FN);
  out.phases.filterUnknown = { selectedText: f.selectedText, count: rows.length, rows };
  A('uiFilter_status_unknown', f.ok && rows.length === 7 && rows.every((r) => r.warnRow),
    JSON.stringify({ sel: f.selectedText, n: rows.length, warn: rows.filter((r) => r.warnRow).length }));
  await shot(page, '06-filter-status-unknown.png');

  await reset(page); await sleep(800);
  f = await applyFilter(page, 'status', '快照已完成');
  rows = await page.evaluate(ROWS_FN);
  out.phases.filterCompleted = { selectedText: f.selectedText, count: rows.length, rows: rows.slice(0, 3) };
  A('uiFilter_status_completed', f.ok && rows.length === 13 && rows[0].probe === 'hosp-007' && rows[1].src === 'dss-fa065-r1-source-orphan',
    JSON.stringify({ sel: f.selectedText, n: rows.length, r0: rows[0] && rows[0].probe, r1: rows[1] && rows[1].src }));
  await shot(page, '07-filter-status-completed.png');

  await reset(page); await sleep(800);
  f = await applyFilter(page, 'source', 'dss-fa065-r1-source-orphan');
  rows = await page.evaluate(ROWS_FN);
  out.phases.filterOrphanSource = { selectedText: f.selectedText, count: rows.length, rows };
  A('uiFilter_source_orphanSource', f.ok && rows.length === 1 && rows[0].src === 'dss-fa065-r1-source-orphan',
    JSON.stringify({ sel: f.selectedText, n: rows.length, src: rows[0] && rows[0].src }));
  await shot(page, '08-filter-source-orphan.png');

  await reset(page); await sleep(1000);
  rows = await page.evaluate(ROWS_FN);
  A('resetRestoresAllRows', rows.length === 37, `rows after reset=${rows.length}`);
  out.phases.afterReset = { count: rows.length };
  await shot(page, '09-after-reset.png');

  // ---- Network / console --------------------------------------------------
  const nonListApi = log.requests.filter((r) => r.url.includes('/api/monitor/') && !r.url.includes('/api/monitor/data-source-run-state/list'));
  out.network = {
    total: log.requests.length,
    nonGet,
    listApiGets: log.requests.filter((r) => r.url.includes('/api/monitor/data-source-run-state/list')).length,
    otherApi: nonListApi.map((r) => `${r.method} ${r.url}`),
    consoleErrors: log.consoleErrors,
    pageErrors: log.pageErrors,
  };
  A('noWriteRequestFromPage', nonGet.length === 0, JSON.stringify(nonGet.slice(0, 5)));
  A('onlyListApiUsed', nonListApi.length === 0, JSON.stringify(nonListApi.slice(0, 5).map((r) => r.url)));
  A('noConsoleOrPageErrors', log.consoleErrors.length === 0 && log.pageErrors.length === 0,
    JSON.stringify({ console: log.consoleErrors.slice(0, 3), page: log.pageErrors.slice(0, 3) }));

  const fails = out.assertions.filter((a) => !a.ok);
  out.summary = { assertions: out.assertions.length, passed: out.assertions.length - fails.length, failed: fails.length, failedNames: fails.map((f2) => f2.name) };

  fs.writeFileSync(path.join(lib.OUT, 'rows.json'), JSON.stringify({ count: all.length, distribution: out.phases.distribution, rows: all }, null, 2) + '\n');
  fs.writeFileSync(path.join(lib.OUT, 'fa065-cases.json'), JSON.stringify(out, null, 2) + '\n');

  const lines = [];
  lines.push('DSS-AC-065 R1 real-browser supplement (REAL backend + REAL 5173 page)');
  lines.push(`route=${lib.BASE + lib.ROUTE} viewport=${lib.VIEWPORTS[2].width}x${lib.VIEWPORTS[2].height}`);
  lines.push(`rows=${all.length} distribution=${JSON.stringify(dist)} warnRows=${warnRows}`);
  lines.push('');
  for (const a of out.assertions) lines.push(`${a.ok ? 'PASS' : 'FAIL'} ${a.name} ${a.detail}`);
  lines.push('');
  lines.push(`summary assertions=${out.assertions.length} passed=${out.summary.passed} failed=${out.summary.failed}`);
  lines.push(`nonGetRequests=${nonGet.length} listApiGets=${out.network.listApiGets} otherApi=${out.network.otherApi.length} consoleErrors=${log.consoleErrors.length} pageErrors=${log.pageErrors.length}`);
  fs.writeFileSync(path.join(lib.OUT, 'SUMMARY.txt'), lines.join('\n') + '\n');

  console.log(lines.join('\n'));
  await ctx.close();
  await browser.close();
  if (fails.length) process.exit(2);
}
main().catch((e) => { console.error(e); process.exit(1); });
