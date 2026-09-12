/*
 * Close-out read-only pass (BR). Two purposes:
 *  1) geometry at the 1440x900 target viewport named by DSS-AC-080/081/090
 *     (the four §7.2 formal viewports are covered by fa-table.cjs / fa-popper.cjs);
 *  2) layout-push invariance across query-candidate length states (DSS-AC-097):
 *     content length must not move the trailing actions group or change the
 *     query-card height. Read-only: it only opens/closes the read-only query
 *     controls and clicks options.
 */
const fs = require('fs');
const path = require('path');
const h = require('./harness.cjs');
const { lib } = h;

const VP = { name: '1440x900', width: 1440, height: 900 };

const GEOM_FN = () => {
  const q = (s) => document.querySelector(s);
  const r = (el) => (el ? (() => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2), right: +b.right.toFixed(2) }; })() : null);
  const trs = Array.from(document.querySelectorAll('.dss-table .el-table__body tbody tr'));
  const heads = Array.from(document.querySelectorAll('.dss-table .el-table__header th')).map((th) => +th.getBoundingClientRect().width.toFixed(2));
  const wrap = q('.dss-table-wrap');
  const table = q('.dss-table');
  const body = q('.dss-result-card__body');
  const timeCells = trs[0] ? Array.from(trs[0].querySelectorAll('td')).slice(4) : [];
  return {
    headerWidths: heads,
    rowCount: trs.length,
    rowH: trs[0] ? +trs[0].getBoundingClientRect().height.toFixed(2) : null,
    tableMinW: table ? getComputedStyle(table).minWidth : null,
    tableW: table ? +table.getBoundingClientRect().width.toFixed(2) : null,
    resultCardBodyW: body ? +body.getBoundingClientRect().width.toFixed(2) : null,
    wrapOverflowX: wrap ? getComputedStyle(wrap).overflowX : null,
    wrapScroll: wrap ? { sw: wrap.scrollWidth, cw: wrap.clientWidth } : null,
    docScroll: { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth },
    timeCellPad: timeCells[0] ? (() => { const c = getComputedStyle(timeCells[0].querySelector('.cell') || timeCells[0]); return { pl: c.paddingLeft, pr: c.paddingRight, pt: c.paddingTop, pb: c.paddingBottom }; })() : null,
    timeTexts: timeCells.map((td) => td.innerText.trim()),
    timeOverflow: timeCells.map((td) => (td.querySelector('.cell') ? td.querySelector('.cell').scrollWidth - td.querySelector('.cell').clientWidth : 0)),
    refreshBtnW: (() => { const b = q('.dss-refresh-btn'); return b ? +b.getBoundingClientRect().width.toFixed(2) : null; })(),
    countdownText: q('.dss-countdown-text') ? q('.dss-countdown-text').innerText.trim() : null,
    ring: r(q('.dss-countdown-ring')),
    queryCardH: q('.dss-query-card') ? +q('.dss-query-card').getBoundingClientRect().height.toFixed(2) : null,
    labels: Array.from(document.querySelectorAll('.dss-q-label')).map((l) => l.innerText.trim()),
    triggerW: ['client', 'source', 'status'].map((d) => { const e = q('.dss-' + d + '-select'); return e ? +e.getBoundingClientRect().width.toFixed(2) : null; }),
    actions: r(q('.dss-q-actions')),
    qGroups: Array.from(document.querySelectorAll('.dss-q-group')).map((g) => r(g)),
    refreshGroupOriginX: r(q('.dss-refresh-group') && q('.dss-refresh-group').firstElementChild ? q('.dss-refresh-group').firstElementChild : q('.dss-refresh-group')),
  };
};

const LAYOUT_FN = () => {
  const q = (s) => document.querySelector(s);
  const r = (el) => (el ? (() => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(3), y: +b.y.toFixed(3), right: +b.right.toFixed(3) }; })() : null);
  const groups = Array.from(document.querySelectorAll('.dss-q-group'));
  return {
    queryCardH: q('.dss-query-card') ? +q('.dss-query-card').getBoundingClientRect().height.toFixed(3) : null,
    actions: r(q('.dss-q-actions')),
    groupXs: groups.map((g) => +g.getBoundingClientRect().x.toFixed(3)),
    triggerW: ['client', 'source', 'status'].map((d) => { const e = q('.dss-' + d + '-select'); return e ? +e.getBoundingClientRect().width.toFixed(3) : null; }),
    tags: Array.from(document.querySelectorAll('.dss-client-select .el-tag')).map((t) => t.innerText.trim()),
  };
};

async function main() {
  const out = { mode: 'closeout-1440', route: lib.BASE + lib.ROUTE, viewport: VP, geometry: null, layoutStates: {}, assertions: [], global: {} };
  const A = (name, ok, detail) => out.assertions.push({ name, ok, detail: detail === undefined ? '' : detail });

  const { browser, page, ctx, log } = await lib.launch(VP);
  await lib.installMeasure(page);
  await lib.openPage(page);

  const g = await page.evaluate(GEOM_FN);
  out.geometry = g;
  await page.screenshot({ path: path.join(lib.OUT, 'screenshots/table-1440x900.png') });
  await page.screenshot({ path: path.join(lib.OUT, 'screenshots/page-idle-1440x900.png') });

  A('tableFillsOrScrollsAt1440', g.tableW !== null && (g.tableW === g.resultCardBodyW || g.wrapScroll.sw > g.wrapScroll.cw), JSON.stringify({ tableW: g.tableW, bodyW: g.resultCardBodyW, wrap: g.wrapScroll }));
  A('fixedColsAtOrAboveMinModel', g.headerWidths[0] === 70 && g.headerWidths[3] === 140 && g.headerWidths[1] >= 170 && g.headerWidths[2] >= 285 && g.headerWidths[1] < g.headerWidths[2], JSON.stringify(g.headerWidths));
  A('timesEqualWidth', g.headerWidths[4] === g.headerWidths[5] && g.headerWidths[5] === g.headerWidths[6], JSON.stringify(g.headerWidths.slice(4)));
  A('timeNoEllipsis', g.timeOverflow.every((v) => v === 0), JSON.stringify(g.timeOverflow));
  A('timeCellPadding8', !!g.timeCellPad && g.timeCellPad.pl === '8px' && g.timeCellPad.pr === '8px', JSON.stringify(g.timeCellPad));
  A('rowH49', g.rowH === 49, String(g.rowH));
  A('refreshBtn110', g.refreshBtnW === 110, String(g.refreshBtnW));
  A('ring16', !!g.ring && g.ring.w === 16 && g.ring.h === 16, JSON.stringify(g.ring));

  // ---- DSS-AC-097: content-length changes must not push the actions group ----
  const measureState = async (label) => { const m = await page.evaluate(LAYOUT_FN); out.layoutStates[label] = m; return m; };

  const s0 = await measureState('S0_INIT_ALL');
  await h.openPanel(page, 'client');
  await h.clickOption(page, 'client', 1);
  await h.closePanel(page, 'client');
  const s1 = await measureState('S1_SHORTEST');
  const optCount = await page.evaluate(() => document.querySelectorAll('.el-popper.dss-client-popper .el-select-dropdown__item').length);
  await h.openPanel(page, 'client');
  await h.clickOption(page, 'client', optCount - 1);
  await h.closePanel(page, 'client');
  const s2 = await measureState('S2_LONGEST');
  await h.openPanel(page, 'client');
  await h.clickOption(page, 'client', 2);
  await h.closePanel(page, 'client');
  await h.openPanel(page, 'client');
  await h.clickOption(page, 'client', 3);
  await h.closePanel(page, 'client');
  await h.openPanel(page, 'client');
  await h.clickOption(page, 'client', 4);
  await h.closePanel(page, 'client');
  const s3 = await measureState('S3_MULTI_COLLAPSE');
  await page.locator('.dss-reset-btn').click();
  await page.waitForTimeout(500);
  const s4 = await measureState('S4_AFTER_RESET');

  const ax = [s0, s1, s2, s3, s4].map((s) => s.actions && s.actions.x);
  const ay = [s0, s1, s2, s3, s4].map((s) => s.actions && s.actions.y);
  const hs = [s0, s1, s2, s3, s4].map((s) => s.queryCardH);
  A('actionsXInvariantAcrossStates', new Set(ax).size === 1, JSON.stringify(ax));
  A('actionsYInvariantAcrossStates', new Set(ay).size === 1, JSON.stringify(ay));
  A('queryCardHeightInvariant', new Set(hs).size === 1, JSON.stringify(hs));
  A('triggerWidthsInvariant', [0, 1, 2, 3, 4].every((i) => JSON.stringify([s0, s1, s2, s3, s4][i].triggerW) === JSON.stringify([240, 300, 200])), JSON.stringify([s0, s1, s2, s3, s4].map((s) => s.triggerW)));
  A('multiSelectProducedCollapsedTags', s3.tags.length >= 1, JSON.stringify(s3.tags));

  out.global = { consoleErrors: log.consoleErrors, nonGet: log.requests.filter((x) => !['GET', 'HEAD'].includes(x.method)).map((x) => `${x.method} ${x.url}`) };
  A('consoleErrorsZero', log.consoleErrors.length === 0, JSON.stringify(log.consoleErrors.slice(0, 3)));
  A('nonGetZero', out.global.nonGet.length === 0, JSON.stringify(out.global.nonGet.slice(0, 3)));

  fs.writeFileSync(path.join(lib.OUT, 'closeout-1440.json'), JSON.stringify(out, null, 2) + '\n');
  const fails = out.assertions.filter((a) => !a.ok);
  console.log(`closeout-1440.json assertions=${out.assertions.length} failed=${fails.length}`);
  console.log('geometry=' + JSON.stringify(out.geometry));
  console.log('layoutStates=' + JSON.stringify(out.layoutStates));
  if (fails.length) console.log(fails.map((f) => `FAIL ${f.name}: ${f.detail}`).join('\n'));
  await ctx.close();
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
