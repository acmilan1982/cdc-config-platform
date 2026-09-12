/*
 * §11.4 trigger + dropdown popper geometry stability.
 * 4 viewports x 3 dims x states, each visible state repeated >=5 times.
 * Records outer popper width spread and adjacent deltas (must be 0), inner
 * dropdown adaptivity, trigger size constancy, closed/reopen equality,
 * horizontal overflow and doc-level horizontal scroll.
 * Read-only: opens/closes the read-only query dropdowns and clicks options.
 */
const path = require('path');
const fs = require('fs');
const h = require('./harness.cjs');
const { lib, DIMS, TARGET, popSel, itemSel, trigSel, robustClick, openPanel, closePanel, measurePopper, options, clickOption } = h;

const REPS = 5;

function pick(opts) {
  const cands = opts.filter((o) => !o.ghost && o.text !== '全部');
  const sorted = [...cands].sort((a, b) => a.len - b.len);
  const shortest = sorted[0];
  const longest = sorted[sorted.length - 1];
  const trunc = cands.find((o) => o.truncated) || null;
  return { shortest, longest, trunc };
}

const isVisible = (page, dim) => page.locator(popSel(dim)).isVisible().catch(() => false);

/** Capture one (state, rep) measurement triple: outer/inner/trigger widths. */
async function snap(page, dim) {
  const m = await measurePopper(page, dim);
  return {
    outerW: m.outer ? +m.outer.rect.w.toFixed(3) : null,
    innerW: m.inner ? +m.inner.rect.w.toFixed(3) : null,
    wrapCW: m.wrap ? m.wrap.cw : null,
    wrapSW: m.wrap ? m.wrap.sw : null,
    triggerW: m.trigger ? +m.trigger.rect.w.toFixed(3) : null,
    triggerH: m.trigger ? +m.trigger.rect.h.toFixed(3) : null,
    wrapperW: m.triggerWrapper ? +m.triggerWrapper.rect.w.toFixed(3) : null,
    wrapperH: m.triggerWrapper ? +m.triggerWrapper.rect.h.toFixed(3) : null,
    selectedCount: m.selectedCount,
    hOverflow: m.hOverflow,
    vScroll: m.vScroll,
    docScrollW: m.docScroll.sw,
    docClientW: m.docScroll.cw,
    outerCssWidth: m.outer ? m.outer.css.width : null,
    innerCssWidth: m.inner ? m.inner.css.width : null,
    wrapOverflowX: m.wrap ? m.wrap.css.overflowX : null,
    fontWeight: m.outer ? m.outer.css.fontWeight : null,
    existsOuter: m.existsOuter,
  };
}

async function stats(page, dim, label, reps) {
  const runs = [];
  for (let i = 0; i < reps; i += 1) runs.push(await snap(page, dim));
  const ws = runs.map((r) => r.outerW).filter((w) => w != null);
  const deltas = [];
  for (let i = 1; i < ws.length; i += 1) deltas.push(+(ws[i] - ws[i - 1]).toFixed(3));
  const trigW = [...new Set(runs.map((r) => r.triggerW))];
  return { label, runs, outerWidth: { values: ws, spread: +(Math.max(...ws) - Math.min(...ws)).toFixed(3), maxAbsDelta: deltas.length ? Math.max(...deltas.map(Math.abs)) : 0 }, triggerWidths: trigW, triggerHeights: [...new Set(runs.map((r) => r.triggerH))], innerWidths: [...new Set(runs.map((r) => r.innerW))], hOverflow: [...new Set(runs.map((r) => r.hOverflow))], vScroll: runs.map((r) => r.vScroll), selectedCounts: runs.map((r) => r.selectedCount), docScrollW: runs[0].docScrollW, docClientW: runs[0].docClientW };
}

async function dimMatrix(page, dim) {
  const rec = { states: {} };
  // deterministic entry: page reset restores all three draft dims to 全部
  await robustClick(page, '.dss-reset-btn');
  await openPanel(page, dim);
  const opts = await options(page, dim);
  rec.optionStats = opts.map((o) => ({ text: o.text, len: o.len, truncated: o.truncated, ghost: o.ghost }));
  const { shortest, longest, trunc } = pick(opts);
  if (!shortest || !longest) { rec.error = 'no options'; return rec; }

  rec.states.A_INIT_ALL = await stats(page, dim, 'A_INIT_ALL', REPS);

  // shortest
  await clickOption(page, dim, shortest.idx);
  rec.states.B_SHORTEST = await stats(page, dim, 'B_SHORTEST', REPS);

  // longest (short -> long switch)
  await clickOption(page, dim, longest.idx);
  rec.states.C_LONGEST = await stats(page, dim, 'C_LONGEST', REPS);

  // truncated option, if distinct from longest
  if (trunc && trunc.idx !== longest.idx) {
    await clickOption(page, dim, trunc.idx);
    rec.states.D_TRUNCATED = await stats(page, dim, 'D_TRUNCATED', REPS);
  } else { rec.states.D_TRUNCATED = rec.states.C_LONGEST; rec.notes = 'longest is already truncated'; }

  // long -> short
  await clickOption(page, dim, shortest.idx);
  rec.states.E_LONG2SHORT = await stats(page, dim, 'E_LONG2SHORT', REPS);

  // short -> long
  await clickOption(page, dim, longest.idx);
  rec.states.C2_SHORT2LONG = await stats(page, dim, 'C2_SHORT2LONG', REPS);

  // multi-select + collapse-tags (add two further candidates)
  const others = opts.filter((o) => !o.ghost && o.text !== '全部').filter((o) => ![shortest.idx, longest.idx, trunc && trunc.idx].includes(o.idx));
  for (const o of others.slice(0, 2)) await clickOption(page, dim, o.idx);
  rec.states.F_MULTI_COLLAPSE = await stats(page, dim, 'F_MULTI_COLLAPSE', REPS);

  // cancel the longest candidate
  await clickOption(page, dim, longest.idx);
  rec.states.G_CANCEL_LONGEST = await stats(page, dim, 'G_CANCEL_LONGEST', REPS);

  // selected item font-weight (must be 700)
  rec.selectedItemFontWeight = await page.evaluate((sel) => {
    const it = document.querySelector(sel + ' .is-selected');
    return it ? getComputedStyle(it).fontWeight : null;
  }, popSel(dim));

  // scrollbar appearance / disappearance while panel grows and shrinks
  rec.states.L_SCROLL_NOW = await stats(page, dim, 'L_SCROLL_NOW', 1);

  // clear icon
  const beforeClose = await snap(page, dim);
  const clear = page.locator(`.dss-${dim}-select .el-select__clear, .dss-${dim}-select .el-select__clear-icon`);
  if (await clear.count()) {
    await clear.first().click({ force: true });
    await page.waitForTimeout(250);
    await openPanel(page, dim);
    rec.states.H_CLEAR = await stats(page, dim, 'H_CLEAR', REPS);
  }

  // page-level reset then reopen
  await closePanel(page, dim);
  await robustClick(page, '.dss-reset-btn');
  await openPanel(page, dim);
  await page.waitForTimeout(150);
  rec.states.J_AFTER_RESET = await stats(page, dim, 'J_AFTER_RESET', REPS);

  // close -> confirm hidden -> reopen and compare
  const reopenBase = await snap(page, dim);
  await closePanel(page, dim);
  const closed = {
    stillMounted: await page.locator(popSel(dim)).count(),
    visuallyClosed: await h.isPanelClosed(page, dim),
    display: await page.evaluate((s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'ABSENT'; }, popSel(dim)),
    ariaHidden: await page.evaluate((s) => { const e = document.querySelector(s); return e ? e.getAttribute('aria-hidden') : null; }, popSel(dim)),
    width: await page.evaluate((s) => { const e = document.querySelector(s); return e ? +e.getBoundingClientRect().width.toFixed(3) : null; }, popSel(dim)),
  };
  await openPanel(page, dim);
  const reopen = await snap(page, dim);
  rec.openCloseReopen = { beforeCloseW: beforeClose.outerW, reopenBaseW: reopenBase.outerW, closed, afterReopenW: reopen.outerW, equal: reopenBase.outerW === reopen.outerW && reopen.outerW === beforeClose.outerW };

  await closePanel(page, dim);
  await robustClick(page, '.dss-reset-btn');
  return rec;
}

async function main() {
  const out = { mode: 'popper-matrix', route: lib.BASE + lib.ROUTE, target: TARGET, reps: REPS, viewports: [], global: { consoleErrors: [], nonGet: [] } };
  for (const vp of lib.VIEWPORTS) {
    const { browser, page, ctx, log } = await lib.launch(vp);
    await lib.installMeasure(page);
    await lib.openPage(page);
    const entry = { viewport: vp.name, dims: {}, viewportDoc: null };
    entry.viewportDoc = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, innerW: window.innerWidth }));
    for (const dim of DIMS) entry.dims[dim] = await dimMatrix(page, dim);
    out.global.consoleErrors.push(...log.consoleErrors.map((c) => `${vp.name}: ${c}`));
    out.global.nonGet.push(...log.requests.filter((r) => !['GET', 'HEAD'].includes(r.method)).map((r) => `${vp.name}: ${r.method} ${r.url}`));
    out.viewports.push(entry);
    await ctx.close();
    await browser.close();
  }
  fs.writeFileSync(path.join(lib.OUT, 'popper-matrix.json'), JSON.stringify(out, null, 2) + '\n');

  // compact summary
  const lines = [];
  for (const v of out.viewports) {
    for (const dim of DIMS) {
      const d = v.dims[dim];
      for (const [k, st] of Object.entries(d.states || {})) {
        lines.push(`${v.viewport} ${dim} ${k} target=${TARGET[dim]} outerW=${JSON.stringify(st.outerWidth.values)} spread=${st.outerWidth.spread} maxDelta=${st.outerWidth.maxAbsDelta} triggerW=${JSON.stringify(st.triggerWidths)} triggerH=${JSON.stringify(st.triggerHeights)} innerW=${JSON.stringify(st.innerWidths)} hOverflow=${JSON.stringify(st.hOverflow)} vScroll=${JSON.stringify(st.vScroll)}`);
      }
      if (d.openCloseReopen) lines.push(`${v.viewport} ${dim} CLOSE_REOPEN closed=${JSON.stringify(d.openCloseReopen.closed)} equal=${d.openCloseReopen.equal} before=${d.openCloseReopen.beforeCloseW} reopen=${d.openCloseReopen.afterReopenW} fontW=${d.selectedItemFontWeight}`);
    }
    lines.push(`${v.viewport} DOC sw=${v.viewportDoc.sw} cw=${v.viewportDoc.cw} innerW=${v.viewportDoc.innerW} -> hScroll=${v.viewportDoc.sw > v.viewportDoc.cw}`);
  }
  lines.push(`GLOBAL consoleErrors=${out.global.consoleErrors.length} nonGet=${out.global.nonGet.length}`);
  fs.writeFileSync(path.join(lib.OUT, 'popper-matrix.txt'), lines.join('\n') + '\n');
  process.stdout.write(lines.slice(-6).join('\n') + '\n');
  console.log('popper-matrix.json written');
}
main().catch((e) => { console.error(e); process.exit(1); });
