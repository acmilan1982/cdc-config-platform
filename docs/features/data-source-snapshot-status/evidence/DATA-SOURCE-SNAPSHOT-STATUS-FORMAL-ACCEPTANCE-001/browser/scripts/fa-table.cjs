/*
 * §11.5 table + refresh-group visuals, at all four formal viewports.
 * Read-only. Emits table-visual.json (+ screenshots) and table-visual.txt.
 */
const fs = require('fs');
const path = require('path');
const h = require('./harness.cjs');
const { lib } = h;

const TABLE_FN = () => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const r = (el) => { const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(2), t: +b.top.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2), r: +b.right.toFixed(2), b: +b.bottom.toFixed(2) }; };
  const table = q('.dss-table');
  const wrapEl = q('.dss-table-wrap');
  const resultBody = q('.dss-result-card__body');
  const ths = qa('.dss-table .el-table__header th');
  const firstRow = q('.dss-table .el-table__body tbody tr');
  const cells = firstRow ? Array.from(firstRow.querySelectorAll('td')) : [];
  const unknown = qa('.dss-table .el-table__body tr.dss-warning-row');
  const normal = qa('.dss-table .el-table__body tr:not(.dss-warning-row)');
  const times = firstRow ? Array.from(firstRow.querySelectorAll('.dss-time')) : [];
  const timeCellPadding = (() => { const c = firstRow ? firstRow.querySelectorAll('td .cell')[4] : null; if (!c) return null; const cs = getComputedStyle(c); return { pl: cs.paddingLeft, pr: cs.paddingRight, pt: cs.paddingTop, pb: cs.paddingBottom }; })();
  const ring = q('.dss-countdown-ring');
  const ringPath = q('.dss-ring-progress');
  const ringTrack = q('.dss-ring-track');

  return {
    table: { rect: table ? r(table) : null, minWidth: table ? getComputedStyle(table).minWidth : null, width: table ? getComputedStyle(table).width : null },
    tableWrap: { rect: wrapEl ? r(wrapEl) : null, overflowX: wrapEl ? getComputedStyle(wrapEl).overflowX : null, scrollW: wrapEl ? wrapEl.scrollWidth : null, clientW: wrapEl ? wrapEl.clientWidth : null },
    resultBody: resultBody ? r(resultBody) : null,
    headerWidths: ths.map((t) => +t.getBoundingClientRect().width.toFixed(2)),
    headerTexts: ths.map((t) => t.innerText.trim()),
    cellWidths: cells.map((c) => +c.getBoundingClientRect().width.toFixed(2)),
    rowHeight: firstRow ? +firstRow.getBoundingClientRect().height.toFixed(2) : null,
    timeTexts: times.map((t) => t.innerText.trim()),
    timeTextWidths: times.map((t) => +t.getBoundingClientRect().width.toFixed(2)),
    timeCellPadding,
    timeFontFamily: times[0] ? getComputedStyle(times[0]).fontFamily : null,
    timeScrollOverflow: times.map((t) => t.scrollWidth - t.clientWidth),
    unknownRowCount: unknown.length,
    normalRowCount: normal.length,
    unknownRowBg: unknown[0] ? getComputedStyle(unknown[0].querySelector('td')).backgroundColor : null,
    normalRowBg: normal[0] ? getComputedStyle(normal[0].querySelector('td')).backgroundColor : null,
    summaryCount: q('.dss-summary-count') ? { text: q('.dss-summary-count').innerText, ...r(q('.dss-summary-count')), css: { fontSize: getComputedStyle(q('.dss-summary-count')).fontSize, fontWeight: getComputedStyle(q('.dss-summary-count')).fontWeight } } : null,
    summaryUnknown: q('.dss-summary-unknown') ? { text: q('.dss-summary-unknown').innerText, ...r(q('.dss-summary-unknown')), css: { background: getComputedStyle(q('.dss-summary-unknown')).backgroundColor, color: getComputedStyle(q('.dss-summary-unknown')).color, radius: getComputedStyle(q('.dss-summary-unknown')).borderRadius, lineHeight: getComputedStyle(q('.dss-summary-unknown')).lineHeight } } : null,
    refreshGroup: q('.dss-refresh-group') ? r(q('.dss-refresh-group')) : null,
    refreshGroupChildren: qa('.dss-refresh-group > *').map((el) => ({ cls: (typeof el.className === 'string' ? el.className : el.getAttribute('class')) || el.tagName, tag: el.tagName, rect: r(el) })),
    hasDssRefreshSep: !!q('.dss-refresh-sep'),
    countdownRing: ring ? { rect: r(ring), viewBox: ring.getAttribute('viewBox'), srcW: ring.getAttribute('width'), srcH: ring.getAttribute('height') } : null,
    ringProgress: ringPath ? { stroke: getComputedStyle(ringPath).stroke, strokeWidth: getComputedStyle(ringPath).strokeWidth, dashArray: ringPath.getAttribute('stroke-dasharray'), transform: ringPath.getAttribute('transform') } : null,
    ringTrack: ringTrack ? { stroke: getComputedStyle(ringTrack).stroke, strokeWidth: getComputedStyle(ringTrack).strokeWidth } : null,
    countdownText: q('.dss-countdown-text') ? q('.dss-countdown-text').innerText : null,
    countdownSeconds: q('.dss-countdown-seconds') ? q('.dss-countdown-seconds').innerText : null,
    countdownUnit: q('.dss-countdown-unit') ? q('.dss-countdown-unit').innerText : null,
    refreshBtn: q('.dss-refresh-btn') ? { rect: r(q('.dss-refresh-btn')), text: q('.dss-refresh-btn').innerText.trim(), loading: q('.dss-refresh-btn').classList.contains('is-loading') } : null,
    refreshTime: q('.dss-refresh-time') ? { text: q('.dss-refresh-time').innerText, rect: r(q('.dss-refresh-time')) } : null,
    queryBtn: q('.dss-query-btn') ? { rect: r(q('.dss-query-btn')), text: q('.dss-query-btn').innerText.trim() } : null,
    resetBtn: q('.dss-reset-btn') ? { rect: r(q('.dss-reset-btn')), text: q('.dss-reset-btn').innerText.trim() } : null,
    labels: qa('.dss-q-label').map((el) => ({ text: el.innerText, x: +el.getBoundingClientRect().x.toFixed(2), y: +el.getBoundingClientRect().y.toFixed(2) })),
    queryBarH: q('.dss-query-bar') ? +q('.dss-query-bar').getBoundingClientRect().height.toFixed(2) : null,
    queryActionsY: q('.dss-q-actions') ? +q('.dss-q-actions').getBoundingClientRect().top.toFixed(2) : null,
    queryActionsX: q('.dss-q-actions') ? +q('.dss-q-actions').getBoundingClientRect().left.toFixed(2) : null,
    docScroll: { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth },
    hasImportant: (() => {
      let n = 0;
      for (const sh of Array.from(document.styleSheets)) { let rs; try { rs = sh.cssRules; } catch (e) { continue; } for (const rl of Array.from(rs || [])) { if (rl.cssText && /dss-/.test(rl.selectorText || '') && /!important/.test(rl.cssText)) n += 1; } }
      return n;
    })(),
    elPopperOverrideRules: (() => {
      let n = 0;
      for (const sh of Array.from(document.styleSheets)) { let rs; try { rs = sh.cssRules; } catch (e) { continue; } for (const rl of Array.from(rs || [])) { const sel = rl.selectorText || ''; if (/(^|\s)\.el-popper\b/.test(sel) && !/dss-/.test(sel) && !/\.el-popper\.el-select/.test(sel)) n += 1; } }
      return n;
    })(),
  };
};

async function main() {
  const out = { mode: 'table-visual', route: lib.BASE + lib.ROUTE, viewports: [], loadingDisplacement: null, errorDisplacement: null, hoverDisplacement: null, global: { consoleErrors: [], nonGet: [] } };
  for (const vp of lib.VIEWPORTS) {
    const { browser, page, ctx, log } = await lib.launch(vp);
    await lib.openPage(page);
    const base = await page.evaluate(TABLE_FN);
    // idle -> loading -> idle displacement (refresh button + group origin)
    const before = await page.evaluate(() => { const b = document.querySelector('.dss-refresh-btn'); const g = document.querySelector('.dss-refresh-group'); const q = document.querySelector('.dss-q-actions'); return { btnW: b ? +b.getBoundingClientRect().width.toFixed(2) : null, groupX: g ? +g.getBoundingClientRect().left.toFixed(2) : null, groupY: g ? +g.getBoundingClientRect().top.toFixed(2) : null, actionsY: q ? +q.getBoundingClientRect().top.toFixed(2) : null, actionsX: q ? +q.getBoundingClientRect().left.toFixed(2) : null }; });
    // unknown-row hover background
    const unk = await page.locator('.dss-table .el-table__body tr.dss-warning-row').first().count();
    let hoverInfo = null;
    if (unk > 0) {
      await page.locator('.dss-table .el-table__body tr.dss-warning-row').first().hover({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(200);
      hoverInfo = await page.evaluate(() => { const tr = document.querySelector('.dss-table .el-table__body tr.dss-warning-row'); return tr ? getComputedStyle(tr.querySelector('td')).backgroundColor : null; });
    }
    // force the manual-refresh loading state via a slow intercepted response
    await page.route('**/api/monitor/data-source-run-state/list**', async (route) => {
      await new Promise((res) => setTimeout(res, 1400));
      await route.continue();
    });
    await page.locator('.dss-refresh-btn').click();
    await page.waitForTimeout(400);
    const loading = await page.evaluate(() => ({ btnW: +document.querySelector('.dss-refresh-btn').getBoundingClientRect().width.toFixed(2), btnLoading: document.querySelector('.dss-refresh-btn').classList.contains('is-loading'), groupX: +document.querySelector('.dss-refresh-group').getBoundingClientRect().left.toFixed(2), groupY: +document.querySelector('.dss-refresh-group').getBoundingClientRect().top.toFixed(2), actionsY: +document.querySelector('.dss-q-actions').getBoundingClientRect().top.toFixed(2), actionsX: +document.querySelector('.dss-q-actions').getBoundingClientRect().left.toFixed(2) }));
    await page.waitForTimeout(1600);
    const after = await page.evaluate(() => ({ btnW: +document.querySelector('.dss-refresh-btn').getBoundingClientRect().width.toFixed(2), groupX: +document.querySelector('.dss-refresh-group').getBoundingClientRect().left.toFixed(2), groupY: +document.querySelector('.dss-refresh-group').getBoundingClientRect().top.toFixed(2), actionsY: +document.querySelector('.dss-q-actions').getBoundingClientRect().top.toFixed(2), actionsX: +document.querySelector('.dss-q-actions').getBoundingClientRect().left.toFixed(2) }));
    // tooltip-open displacement
    await page.locator('.dss-table .el-table__body tr').first().locator('.dss-status-trigger').hover({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(500);
    const withTt = await page.evaluate(() => { const g = document.querySelector('.dss-refresh-group'); const q = document.querySelector('.dss-q-actions'); const t = document.querySelector('.dss-table .el-table__body tr'); return { groupX: +g.getBoundingClientRect().left.toFixed(2), groupY: +g.getBoundingClientRect().top.toFixed(2), actionsY: +q.getBoundingClientRect().top.toFixed(2), actionsX: +q.getBoundingClientRect().left.toFixed(2), rowH: t ? +t.getBoundingClientRect().height.toFixed(2) : null }; });
    out.viewports.push({ viewport: vp.name, base, before, hoverUnknownBg: hoverInfo, loading, after, withTooltip: withTt });
    fs.mkdirSync(path.join(lib.OUT, 'screenshots'), { recursive: true });
    await page.screenshot({ path: path.join(lib.OUT, `screenshots/table-${vp.name}.png`) });
    out.global.consoleErrors.push(...log.consoleErrors.map((c) => `${vp.name}: ${c}`));
    out.global.nonGet.push(...log.requests.filter((r) => !['GET', 'HEAD'].includes(r.method)).map((r) => `${vp.name}: ${r.method} ${r.url}`));
    await ctx.close();
    await browser.close();
  }

  // displacement assertions (all viewports)
  const disps = out.viewports.map((v) => ({
    viewport: v.viewport,
    refreshBtnW: { idle: v.base.refreshBtn && v.base.refreshBtn.rect.w, loading: v.loading.btnW, after: v.after.btnW },
    groupOrigin: { idleX: v.before.groupX, loadingX: v.loading.groupX, afterX: v.after.groupX, withTtX: v.withTooltip.groupX },
    actionsOrigin: { loadingY: v.loading.actionsY, afterY: v.after.actionsY, withTtY: v.withTooltip.actionsY, loadingX: v.loading.actionsX, afterX: v.after.actionsX, withTtX: v.withTooltip.actionsX },
  }));
  out.displacements = disps;

  const lines = [];
  for (const v of out.viewports) {
    const b = v.base;
    lines.push(`== ${v.viewport} docScroll=${b.docScroll.sw}/${b.docScroll.cw}`);
    lines.push(`  headerWidths=${JSON.stringify(b.headerWidths)}`);
    lines.push(`  cellWidths=${JSON.stringify(b.cellWidths)}`);
    lines.push(`  rowHeight=${b.rowHeight} timeTexts=${JSON.stringify(b.timeTexts)} timeCellPad=${JSON.stringify(b.timeCellPadding)} timeOverflow=${JSON.stringify(b.timeScrollOverflow)}`);
    lines.push(`  table minWidth=${b.table.minWidth} width=${b.table.width} wrapOverflowX=${b.tableWrap.overflowX} wrapScroll=${b.tableWrap.scrollW}/${b.tableWrap.clientW}`);
    lines.push(`  summaryCount=${JSON.stringify(b.summaryCount && b.summaryCount.text)} summaryUnknown=${JSON.stringify(b.summaryUnknown && b.summaryUnknown.text)} unknownBg=${b.summaryUnknown && b.summaryUnknown.css.background}`);
    lines.push(`  unknownRow=${b.unknownRowCount} normalRow=${b.normalRowCount} unknownBg=${b.unknownRowBg} normalBg=${b.normalRowBg} hoverBg=${v.hoverUnknownBg}`);
    lines.push(`  refreshGroupChildren=${JSON.stringify(b.refreshGroupChildren.map((c) => c.cls))}`);
    lines.push(`  countdownRing=${JSON.stringify(b.countdownRing)} progress=${JSON.stringify(b.ringProgress)} track=${JSON.stringify(b.ringTrack)}`);
    lines.push(`  countdownText=${JSON.stringify(b.countdownText)} seconds=${JSON.stringify(b.countdownSeconds)} unit=${JSON.stringify(b.countdownUnit)}`);
    lines.push(`  refreshBtn idle=${JSON.stringify(b.refreshBtn && b.refreshBtn.rect.w)} loading=${v.loading.btnW} is-loading=${v.loading.btnLoading} after=${v.after.btnW}`);
    lines.push(`  refreshTime=${JSON.stringify(b.refreshTime && b.refreshTime.text)}`);
    lines.push(`  labels=${JSON.stringify(b.labels)} queryBarH=${b.queryBarH} queryActions=(${b.queryActionsX},${b.queryActionsY})`);
    lines.push(`  !important dss rules=${b.hasImportant} bare .el-popper override rules=${b.elPopperOverrideRules}`);
  }
  lines.push(`GLOBAL consoleErrors=${out.global.consoleErrors.length} nonGet=${out.global.nonGet.length}`);
  fs.writeFileSync(path.join(lib.OUT, 'table-visual.json'), JSON.stringify(out, null, 2) + '\n');
  fs.writeFileSync(path.join(lib.OUT, 'table-visual.txt'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}
main().catch((e) => { console.error(e); process.exit(1); });
