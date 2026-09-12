/*
 * §11.5 / §4.20 visual-token capture (BR). Read-only: opens the real 5173 page and
 * reads computed styles for the approved design tokens. No state is mutated.
 * Backs DSS-AC-087/088/089/091/092/093 (colors, radii, fonts, control geometry, badges).
 */
const fs = require('fs');
const path = require('path');
const h = require('./harness.cjs');
const { lib } = h;

const TOKENS_FN = () => {
  const q = (s) => document.querySelector(s);
  const cs = (s, ...props) => {
    const el = q(s);
    if (!el) return null;
    const c = getComputedStyle(el);
    const out = {};
    for (const p of props) out[p] = c[p];
    return out;
  };
  const box = (s) => {
    const el = q(s);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return { w: +b.width.toFixed(2), h: +b.height.toFixed(2), clipped: el.scrollWidth - el.clientWidth };
  };
  const statusTags = () => {
    const out = {};
    for (const tr of Array.from(document.querySelectorAll('.dss-table .el-table__body tbody tr'))) {
      const tag = tr.querySelector('.dss-status-tag .el-tag');
      if (!tag) continue;
      const c = getComputedStyle(tag);
      const sym = tr.querySelector('.dss-status-symbol');
      const key = tr.classList.contains('dss-warning-row') ? 'UNKNOWN' : (tr.querySelector('.dss-status-symbol--dot') ? 'RUNNING' : 'COMPLETED');
      if (out[key]) continue;
      out[key] = {
        bg: c.backgroundColor, color: c.color, fontWeight: c.fontWeight, fontSize: c.fontSize,
        radius: c.borderRadius, height: c.height, padding: c.padding,
        symbol: sym ? sym.textContent : null,
        text: tag.innerText.replace(/\s+/g, ''),
      };
    }
    return out;
  };
  const inactive = (() => {
    const el = q('.dss-inactive-mark');
    if (!el) return { present: false };
    const c = getComputedStyle(el);
    return { present: true, text: el.innerText, bg: c.backgroundColor, color: c.color, fontSize: c.fontSize, fontWeight: c.fontWeight, radius: c.borderRadius, height: c.height, padding: c.padding, clipped: el.scrollWidth - el.clientWidth, w: +el.getBoundingClientRect().width.toFixed(2) };
  })();
  const labelGap = (() => {
    const l = q('.dss-q-label');
    const g = q('.dss-q-group');
    if (!l || !g) return null;
    const ctrl = g.querySelector('.dss-select, .el-select');
    if (!ctrl) return null;
    // label sits inline before the control: gap is the horizontal distance between them
    return { labelRight: +l.getBoundingClientRect().right.toFixed(2), ctrlLeft: +ctrl.getBoundingClientRect().left.toFixed(2), gap: +(ctrl.getBoundingClientRect().left - l.getBoundingClientRect().right).toFixed(2) };
  })();

  return {
    layers: {
      body: cs('body', 'backgroundColor'),
      contentArea: cs('.content-area', 'backgroundColor'),
      contentCard: cs('.content-card', 'backgroundColor'),
      dssPage: cs('.dss-page', 'backgroundColor', 'borderRadius', 'padding', 'gap'),
      queryCard: cs('.dss-query-card', 'backgroundColor', 'borderRadius', 'boxShadow', 'borderWidth'),
      resultCard: cs('.dss-result-card', 'backgroundColor', 'borderRadius', 'boxShadow', 'borderWidth', 'borderTopWidth'),
    },
    queryBar: {
      label: cs('.dss-q-label', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderTopWidth', 'whiteSpace'),
      labelGapAfter: labelGap,
      queryBtn: { ...cs('.dss-query-btn', 'backgroundColor', 'color', 'fontWeight', 'borderRadius', 'height'), ...box('.dss-query-btn') },
      resetBtn: { ...cs('.dss-reset-btn', 'backgroundColor', 'color', 'fontWeight', 'borderRadius', 'height'), ...box('.dss-reset-btn') },
    },
    resultHeader: {
      summaryCount: { ...cs('.dss-summary-count', 'fontSize', 'fontWeight', 'color'), text: q('.dss-summary-count') ? q('.dss-summary-count').innerText : null },
      summaryUnknown: q('.dss-summary-unknown') ? { ...cs('.dss-summary-unknown', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderRadius', 'height', 'padding'), text: q('.dss-summary-unknown').innerText } : null,
      refreshBtn: { ...cs('.dss-refresh-btn', 'backgroundColor', 'color', 'borderTopWidth', 'borderTopColor', 'borderRadius'), ...box('.dss-refresh-btn') },
      refreshGroupChildren: Array.from(document.querySelectorAll('.dss-refresh-group > *')).map((el) => (typeof el.className === 'string' ? el.className : el.getAttribute('class')) || el.tagName),
    },
    countdown: {
      ring: cs('.dss-countdown-ring', 'width', 'height'),
      ringProgress: cs('.dss-ring-progress', 'stroke', 'strokeWidth'),
      ringTrack: cs('.dss-ring-track', 'stroke', 'strokeWidth'),
      text: cs('.dss-countdown-text', 'fontSize', 'color'),
      seconds: cs('.dss-countdown-seconds', 'minWidth', 'fontVariantNumeric', 'textAlign'),
      unit: cs('.dss-countdown-unit', 'fontSize', 'color'),
    },
    statusTags: statusTags(),
    unknownRowBg: (() => { const tr = q('.dss-table .el-table__body tr.dss-warning-row'); return tr ? getComputedStyle(tr.querySelector('td')).backgroundColor : null; })(),
    probeMain: cs('.dss-probe-main', 'fontWeight'),
    sourceMain: cs('.dss-cell-main:not(.dss-probe-main)', 'fontWeight'),
    inactiveMark: inactive,
    timeCell: (() => {
      const tr = q('.dss-table .el-table__body tbody tr');
      const cell = tr ? tr.querySelectorAll('td')[4] : null;
      if (!cell) return null;
      const inner = cell.querySelector('.cell');
      const c = getComputedStyle(inner || cell);
      return { padding: c.padding, paddingLeft: c.paddingLeft, paddingTop: c.paddingTop };
    })(),
    tooltipMaxWidth: (() => { const el = q('.dss-single-tooltip'); return el ? getComputedStyle(el).maxWidth : null; })(),
    triggerBoxes: {
      client: box('.dss-client-select'),
      source: box('.dss-source-select'),
      status: box('.dss-status-select'),
    },
  };
};

async function main() {
  const out = { mode: 'visual-tokens', route: lib.BASE + lib.ROUTE, viewports: [], global: { consoleErrors: [], nonGet: [] } };
  for (const vp of lib.VIEWPORTS) {
    const { browser, page, ctx, log } = await lib.launch(vp);
    await lib.openPage(page);
    const tokens = await page.evaluate(TOKENS_FN);
    out.viewports.push({ viewport: vp.name, tokens });
    out.global.consoleErrors.push(...log.consoleErrors.map((c) => `${vp.name}: ${c}`));
    out.global.nonGet.push(...log.requests.filter((r) => !['GET', 'HEAD'].includes(r.method)).map((r) => `${vp.name}: ${r.method} ${r.url}`));
    await page.screenshot({ path: path.join(lib.OUT, `screenshots/tokens-${vp.name}.png`) });
    if (vp.name === '1920x1080') {
      const idle = await page.evaluate(() => { const b = document.querySelector('.dss-refresh-btn'); return b ? +b.getBoundingClientRect().width.toFixed(2) : null; });
      await page.route('**/api/monitor/data-source-run-state/list**', async (route) => { await new Promise((r) => setTimeout(r, 1400)); await route.continue(); });
      await page.locator('.dss-refresh-btn').click();
      await page.waitForTimeout(400);
      const loading = await page.evaluate(() => { const b = document.querySelector('.dss-refresh-btn'); return { w: +b.getBoundingClientRect().width.toFixed(2), isLoading: b.classList.contains('is-loading') }; });
      out.refreshBtnIdleVsLoading = { idle, loading };
      await page.waitForTimeout(1600);
    }
    await ctx.close();
    await browser.close();
  }
  fs.writeFileSync(path.join(lib.OUT, 'tokens.json'), JSON.stringify(out, null, 2) + '\n');
  const t = out.viewports.find((v) => v.viewport === '1920x1080').tokens;
  console.log('layers=' + JSON.stringify(t.layers));
  console.log('queryBar=' + JSON.stringify(t.queryBar));
  console.log('resultHeader=' + JSON.stringify(t.resultHeader));
  console.log('countdown=' + JSON.stringify(t.countdown));
  console.log('statusTags=' + JSON.stringify(t.statusTags));
  console.log('inactiveMark=' + JSON.stringify(t.inactiveMark));
  console.log('probeMain=' + JSON.stringify(t.probeMain) + ' sourceMain=' + JSON.stringify(t.sourceMain));
  console.log('triggerBoxes=' + JSON.stringify(t.triggerBoxes));
  console.log('unknownRowBg=' + JSON.stringify(t.unknownRowBg) + ' timeCell=' + JSON.stringify(t.timeCell) + ' tooltipMaxWidth=' + JSON.stringify(t.tooltipMaxWidth));
  console.log('refreshBtnIdleVsLoading=' + JSON.stringify(out.refreshBtnIdleVsLoading));
  console.log('GLOBAL consoleErrors=' + out.global.consoleErrors.length + ' nonGet=' + out.global.nonGet.length);
}
main().catch((e) => { console.error(e); process.exit(1); });
