/*
 * §11.2 data / status / anomaly / table tooltip, and §11.3 natural truncation
 * semantics observable on the REAL dev-DB data (BR, no interception).
 * Read-only: reads the list API and hovers table cells; never writes.
 *
 * CLIENT_ID / DATA_SOURCE_ID longer than 20 code points do not exist in the dev
 * DB (max 18 / 15), so their >20-code-point truncation is proven by the BI
 * script fa-bi.cjs instead. This script proves the rules for CLIENT_DESC and
 * DATA_SOURCE_ORG, which do have natural >20 values.
 */
const fs = require('fs');
const path = require('path');
const h = require('./harness.cjs');
const { lib, truncate } = h;

const DELAY = 320;

/** Snapshot every rendered row: cell texts, marks, status tag, classes. */
const ROWS_FN = () => {
  const rows = Array.from(document.querySelectorAll('.dss-table .el-table__body tbody tr'));
  return rows.map((tr, i) => {
    const txt = (s) => { const e = tr.querySelector(s); return e ? e.innerText.trim() : null; };
    const ttKind = (s) => { const e = tr.querySelector(s); return e ? e.getAttribute('data-tt-kind') : null; };
    const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.innerText.trim());
    return {
      index: i,
      rowClass: tr.className,
      isWarning: tr.classList.contains('dss-warning-row'),
      seq: txt('.dss-seq'),
      probeText: txt('.dss-probe-main'),
      probeTtKind: ttKind('.dss-probe-main'),
      inactiveMark: tr.querySelector('.dss-inactive-mark') ? tr.querySelector('.dss-inactive-mark').innerText.trim() : null,
      sourceText: (() => { const e = tr.querySelector('.dss-cell-main:not(.dss-probe-main)'); return e ? e.innerText.trim() : null; })(),
      sourceTtKind: (() => { const e = tr.querySelector('.dss-cell-main:not(.dss-probe-main)'); return e ? e.getAttribute('data-tt-kind') : null; })(),
      statusText: txt('.dss-status-trigger'),
      statusLabel: (() => { const t = tr.querySelector('.dss-status-trigger .el-tag'); return t ? t.innerText.replace(/\s+/g, '') : null; })(),
      statusSymbol: (() => { const s = tr.querySelector('.dss-status-symbol'); return s ? s.innerText.trim() : null; })(),
      statusTtKind: ttKind('.dss-status-trigger'),
      times: Array.from(tr.querySelectorAll('.dss-time')).map((e) => e.innerText.trim()),
      dashCount: tr.querySelectorAll('.dss-time-dash').length,
      cells,
      nativeTitle: tr.querySelector('[title]') ? tr.querySelector('[title]').getAttribute('title') : null,
      ttElCount: tr.querySelectorAll('.dss-tt').length,
    };
  });
};

const TOOLTIP_FN = () => {
  const el = document.querySelector('.dss-single-tooltip');
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    hostCount: document.querySelectorAll('.dss-single-tooltip').length,
    content: el.querySelector('.dss-single-tooltip__content').innerText,
    pointerEvents: cs.pointerEvents,
    position: cs.position,
    visibility: cs.visibility,
    maxWidth: cs.maxWidth,
    rect: { l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
    vw: window.innerWidth, vh: window.innerHeight,
    withinViewport: r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth + 0.5 && r.bottom <= window.innerHeight + 0.5,
    role: el.getAttribute('role'),
  };
};

const QTT_FN = () => {
  const el = document.querySelector('.dss-q-tt');
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { content: el.innerText, visibility: cs.visibility, pointerEvents: cs.pointerEvents, role: el.getAttribute('role'), count: document.querySelectorAll('.dss-q-tt').length, rect: { l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) }, withinViewport: r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth + 0.5 && r.bottom <= window.innerHeight + 0.5 };
};

/* data-tt-kind embeds rowKey with a NUL separator, so attribute selectors are
 * unreliable; hover by row index + in-row column selector instead. */
const COL = { probe: '.dss-probe-main', source: '.dss-cell-main:not(.dss-probe-main)', status: '.dss-status-trigger' };
async function hoverCell(page, rowIndex, col, ms = DELAY + 300) {
  // park the pointer first so a repeat hover re-fires mouseenter (same-cell re-hover otherwise no-ops)
  await page.mouse.move(4, 4);
  await page.waitForTimeout(120);
  const tr = page.locator('.dss-table .el-table__body tbody tr').nth(rowIndex);
  await tr.scrollIntoViewIfNeeded().catch(() => {});
  await tr.locator(COL[col]).first().hover({ timeout: 4000 });
  await page.waitForTimeout(ms);
}

async function main() {
  const out = { mode: 'real-data', route: lib.BASE + lib.ROUTE, delayMs: DELAY, assertions: [], rows: [], tooltipProbes: [], naturalTruncation: [], queryBarTooltip: [], apiDump: null };
  const A = (name, ok, detail) => out.assertions.push({ name, ok, detail });

  const { browser, page, ctx, log } = await lib.launch(lib.VIEWPORTS[2]);
  await lib.installMeasure(page);
  await lib.openPage(page);

  const api = await page.evaluate(async (u) => (await fetch(u)).json(), lib.LIST_API);
  out.apiDump = { code: api.code, records: api.data.records.length, candidateClients: api.data.candidates.clients.length, candidateSources: api.data.candidates.sources.length, statuses: api.data.candidates.statuses };
  const recs = api.data.records;

  const rows = await page.evaluate(ROWS_FN);
  out.rows = rows;
  A('rowCountMatchesApi', rows.length === recs.length, `${rows.length} vs ${recs.length}`);

  // --- §11.2 status tag + raw value tooltip for each category present
  const cats = [...new Set(recs.map((r) => r.statusCategory))];
  A('statusCategoriesPresent', cats.length >= 1, JSON.stringify(cats));
  const statusExpect = { RUNNING: '●快照进行中', COMPLETED: '✓快照已完成', UNKNOWN: '?未知状态' };
  for (let i = 0; i < recs.length; i += 1) {
    const r = recs[i];
    const expTag = statusExpect[r.statusCategory];
    if (rows[i].statusLabel !== expTag) A(`statusTag[${i}]`, false, `dom=${rows[i].statusLabel} api=${r.statusCategory} exp=${expTag}`);
    if (r.statusCategory === 'UNKNOWN' && !rows[i].isWarning) A(`unknownRowWarning[${i}]`, false, rows[i].rowClass);
    if (r.statusCategory !== 'UNKNOWN' && rows[i].isWarning) A(`nonUnknownRowWarning[${i}]`, false, rows[i].rowClass);
  }
  // status tooltip raw DB value (sample the first of each category)
  for (const cat of cats) {
    const i = recs.findIndex((r) => r.statusCategory === cat);
    if (i < 0) continue;
    await hoverCell(page, i, "status");
    const t = await page.evaluate(TOOLTIP_FN);
    out.tooltipProbes.push({ kind: 'status', index: i, category: cat, rawDbValue: recs[i].snapshotStatus, tooltip: t });
    A(`statusTooltipRaw[${cat}]`, !!t && t.content === `原始状态：${recs[i].snapshotStatus}`, t ? t.content : 'null');
    A(`statusTooltipSingle[${cat}]`, !!t && t.hostCount === 1, t ? String(t.hostCount) : 'null');
  }

  // --- §11.2 probe inactive mark + probe tooltip = trimmed CLIENT_DESC only
  let inactiveSeen = 0, inactiveMismatch = 0, descLongProbed = 0, descShortProbed = 0, descEmptyProbed = 0;
  for (let i = 0; i < recs.length; i += 1) {
    const r = recs[i];
    const isInactive = r.clientRef.state === 'INACTIVE';
    if (isInactive) { inactiveSeen += 1; if (rows[i].inactiveMark !== '停用') inactiveMismatch += 1; }
    else if (rows[i].inactiveMark !== null) inactiveMismatch += 1;
    if (rows[i].probeText !== r.clientId) A(`probeIdRaw[${i}]`, false, `dom=${rows[i].probeText} api=${r.clientId}`);
    const desc = (r.clientRef.desc == null ? '' : String(r.clientRef.desc)).trim();
    const cpLen = Array.from(desc).length;
    const wantProbe = cpLen > 0 && (descLongProbed < 1 || cpLen <= 20 && descShortProbed < 1);
    if (cpLen > 20 && descLongProbed < 1) {
      descLongProbed += 1;
      await hoverCell(page, i, "probe");
      const t = await page.evaluate(TOOLTIP_FN);
      out.tooltipProbes.push({ kind: 'probe', index: i, cpLen, desc, tooltip: t });
      A(`probeTooltipEqualsTrimmedDesc[${i}]`, !!t && t.content === desc, t ? JSON.stringify(t.content.slice(0, 40)) : 'null');
    } else if (cpLen > 0 && cpLen <= 20 && descShortProbed < 1) {
      descShortProbed += 1;
      await hoverCell(page, i, "probe");
      const t1 = await page.evaluate(TOOLTIP_FN);
      await page.mouse.move(4, 4);
      await page.waitForTimeout(150);
      const t2 = await page.evaluate(TOOLTIP_FN);
      out.tooltipProbes.push({ kind: 'probe-short', index: i, cpLen, desc, shown: !!t1 && t1.visibility !== 'hidden', afterLeave: t2 });
      // short desc still produces a tooltip containing the full (short) desc — rule is "only full CLIENT_DESC"
      A(`probeTooltipShortShowsDesc[${i}]`, !!t1 && t1.content === desc, t1 ? JSON.stringify(t1.content) : 'null');
      A(`probeTooltipClosedOnLeave[${i}]`, !t2, t2 ? 'still present' : 'gone');
    } else if (desc.length === 0 && descEmptyProbed < 1) {
      descEmptyProbed += 1;
      await hoverCell(page, i, "probe");
      const t = await page.evaluate(TOOLTIP_FN);
      out.tooltipProbes.push({ kind: 'probe-empty', index: i, desc, tooltip: t });
      A(`probeTooltipNoEmpty[${i}]`, !t, t ? t.content : 'none');
    }
  }
  A('inactiveMarkSeen', inactiveSeen > 0, `seen=${inactiveSeen} mismatch=${inactiveMismatch}`);
  A('inactiveMarkCorrect', inactiveMismatch === 0, `mismatch=${inactiveMismatch}`);
  A('probeDescVariantsCovered', descLongProbed > 0 && descEmptyProbed > 0, `long=${descLongProbed} short=${descShortProbed} empty=${descEmptyProbed}`);

  // --- §11.2 source column: ORG when non-empty, fallback to raw DATA_SOURCE_ID; tooltip ALWAYS raw DATA_SOURCE_ID
  let orgSeen = 0, fallbackSeen = 0, sourceTooltipMismatch = 0;
  let orgProbed = false, fbProbed = false;
  for (let i = 0; i < recs.length; i += 1) {
    const r = recs[i];
    const org = (r.sourceRef.org == null ? '' : String(r.sourceRef.org)).trim();
    const expMain = org.length > 0 ? org : r.sourceId;
    if (rows[i].sourceText !== expMain) A(`sourceMain[${i}]`, false, `dom=${rows[i].sourceText} exp=${expMain}`);
    if (org.length > 0) orgSeen += 1; else fallbackSeen += 1;
    // probe tooltip for both variants (once each)
    if ((org.length > 0 && !orgProbed) || (org.length === 0 && !fbProbed)) {
      if (org.length > 0) orgProbed = true; else fbProbed = true;
      await hoverCell(page, i, "source");
      const t = await page.evaluate(TOOLTIP_FN);
      out.tooltipProbes.push({ kind: org.length > 0 ? 'source-org' : 'source-fallback', index: i, org, sourceId: r.sourceId, tooltip: t });
      const ok = !!t && t.content === r.sourceId;
      if (!ok) sourceTooltipMismatch += 1;
      A(`sourceTooltipRawId[${org.length > 0 ? 'org' : 'fallback'}][${i}]`, ok, t ? t.content : 'null');
      A(`sourceTooltipNotOrg[${org.length > 0 ? 'org' : 'fallback'}][${i}]`, !t || t.content !== org, t ? 'equals org!' : 'n/a');
    }
  }
  A('sourceOrgAndFallbackCovered', orgSeen > 0 && fallbackSeen > 0, `org=${orgSeen} fallback=${fallbackSeen}`);
  A('sourceTooltipAlwaysRawId', sourceTooltipMismatch === 0, `mismatch=${sourceTooltipMismatch}`);

  // --- §11.2 tooltip discipline: single instance / no native title / non-enterable / boundary
  const multiTooltipCheck = await page.evaluate(() => {
    // raise a tooltip then count hosts
    return document.querySelectorAll('.dss-single-tooltip').length <= 1;
  });
  A('tooltipHostAtMostOne', multiTooltipCheck, String(multiTooltipCheck));
  const nativeTitles = rows.filter((r) => r.nativeTitle !== null).length;
  A('noNativeTitle', nativeTitles === 0, `rowsWithTitle=${nativeTitles}`);
  // non-enterable
  let pointerNone = null;
  {
    const i = recs.findIndex((r) => r.statusCategory === 'UNKNOWN');
    if (i >= 0) {
      await hoverCell(page, i, "status");
      const t = await page.evaluate(TOOLTIP_FN);
      pointerNone = t ? t.pointerEvents : null;
      A('tooltipNonEnterable', t && t.pointerEvents === 'none', String(pointerNone));
      A('tooltipWithinViewport', t && t.withinViewport, t ? JSON.stringify(t.rect) : 'null');
      A('tooltipFixedPosition', t && t.position === 'fixed', t ? t.position : 'null');
    }
  }
  // global close on scroll
  {
    const i = recs.findIndex((r) => r.statusCategory === 'UNKNOWN');
    await hoverCell(page, i, "status");
    const before = await page.evaluate(TOOLTIP_FN);
    await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
    await page.waitForTimeout(200);
    const after = await page.evaluate(TOOLTIP_FN);
    A('tooltipClosesOnScroll', !!before && !after, `before=${!!before} after=${!!after}`);
  }
  // global close on visibilitychange
  {
    const i = recs.findIndex((r) => r.statusCategory === 'UNKNOWN');
    await hoverCell(page, i, "status");
    const before = await page.evaluate(TOOLTIP_FN);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForTimeout(200);
    const after = await page.evaluate(TOOLTIP_FN);
    A('tooltipClosesOnVisibilityChange', !!before && !after, `before=${!!before} after=${!!after}`);
  }
  // boundary avoidance: hover the right-most source cell and confirm tooltip stays in viewport
  {
    const i = 0;
    await hoverCell(page, i, "source");
    const t = await page.evaluate(TOOLTIP_FN);
    A('tooltipBoundaryAvoidance', !!t && t.withinViewport && !!t.content, t ? JSON.stringify(t.rect) : 'null');
  }

  // --- §11.3 natural truncation on real data: CLIENT_DESC and DATA_SOURCE_ORG
  const e = h.truncate;
  for (const r of recs) {
    const desc = (r.clientRef.desc == null ? '' : String(r.clientRef.desc)).trim();
    const org = (r.sourceRef.org == null ? '' : String(r.sourceRef.org)).trim();
    if (Array.from(desc).length > 20) {
      out.naturalTruncation.push({ field: 'CLIENT_DESC', raw: desc, cp: Array.from(desc).length, expectedDisplay: e(desc), rule: 'first 20 code points + ASCII ...' });
    }
    if (Array.from(org).length > 20) {
      out.naturalTruncation.push({ field: 'DATA_SOURCE_ORG', raw: org, cp: Array.from(org).length, expectedDisplay: e(org), rule: 'first 20 code points + ASCII ...' });
    }
  }
  out.naturalTruncation = out.naturalTruncation.filter((v, i, a) => a.findIndex((x) => x.field === v.field && x.raw === v.raw) === i);
  A('naturalTruncationCasesPresent', out.naturalTruncation.length > 0, `count=${out.naturalTruncation.length}`);

  // verify ORG truncation against the rendered query-bar option label
  {
    await h.openPanel(page, 'source');
    const opts = await h.options(page, 'source');
    out.sourceOptionStats = opts.map((o) => ({ text: o.text, len: o.len, truncated: o.truncated }));
    const orgCases = out.naturalTruncation.filter((x) => x.field === 'DATA_SOURCE_ORG');
    for (const c of orgCases) {
      const want = `${c.expectedDisplay}（${h.truncate(recs.find((r) => { const o = (r.sourceRef.org == null ? '' : String(r.sourceRef.org)).trim(); return o === c.raw; }).sourceId)}）`;
      const hit = opts.find((o) => o.text === want);
      A(`orgTruncatedOptionLabel[${c.raw.slice(0, 12)}]`, !!hit, hit ? 'found' : `want=${want}`);
    }
    // and a <=20 ORG (9 cp) must NOT be truncated
    const shortOrg = opts.find((o) => o.text.includes('孝感市第一人民医院'));
    A('shortOrgNotTruncated', !!shortOrg && !shortOrg.text.includes('...'), shortOrg ? shortOrg.text : 'none');
    // empty ORG falls back to ID (no empty parens)
    const noParens = opts.every((o) => o.text !== 's-dssr1-0906-m1' || !o.text.includes('（）'));
    A('emptyOrgNoEmptyParens', noParens, JSON.stringify(opts.filter((o) => !o.text.includes('（')).map((o) => o.text)));
    await h.closePanel(page, 'source');
  }

  // --- §11.3 query-bar CLIENT_DESC tooltip rules
  {
    await h.openPanel(page, 'client');
    const opts = await h.options(page, 'client');
    out.clientOptionStats = opts.map((o) => ({ text: o.text, len: o.len, truncated: o.truncated, ghost: o.ghost }));
    // hover the option whose client has desc >20 cp
    const longDescClient = recs.find((r) => { const d = (r.clientRef.desc == null ? '' : String(r.clientRef.desc)).trim(); return Array.from(d).length > 20; });
    if (longDescClient) {
      const desc = String(longDescClient.clientRef.desc).trim();
      const optIdx = opts.findIndex((o) => o.text.startsWith(h.truncate(longDescClient.clientId)) && o.text.includes(h.truncate(desc).slice(0, 8)));
      const target = optIdx >= 0 ? optIdx : 0;
      await page.locator('.dss-client-popper .el-select-dropdown__item').nth(target).hover({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(DELAY + 120);
      const t = await page.evaluate(QTT_FN);
      out.queryBarTooltip.push({ kind: 'client-desc-long', clientId: longDescClient.clientId, descCp: Array.from(desc).length, tooltip: t });
      A('qbarTooltipShowsFullTrimmedDesc', !!t && t.visibility !== 'hidden' && t.content === desc, t ? JSON.stringify(t.content.slice(0, 40)) : 'null');
    }
    // hover a short-desc option -> no tooltip
    const shortDesc = recs.find((r) => { const d = (r.clientRef.desc == null ? '' : String(r.clientRef.desc)).trim(); const n = Array.from(d).length; return n > 0 && n <= 20; });
    if (shortDesc) {
      const idx = opts.findIndex((o) => o.text.startsWith(h.truncate(shortDesc.clientId)));
      if (idx >= 0) {
        await page.mouse.move(4, 4); await page.waitForTimeout(200);
        await page.locator('.dss-client-popper .el-select-dropdown__item').nth(idx).hover({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(DELAY + 120);
        const t = await page.evaluate(QTT_FN);
        out.queryBarTooltip.push({ kind: 'client-desc-short', clientId: shortDesc.clientId, descCp: Array.from(String(shortDesc.clientRef.desc).trim()).length, tooltip: t });
        A('qbarTooltipAbsentForShortDesc', !t || t.visibility === 'hidden', t ? t.content : 'none');
      }
    }
    // hover the "全部" option -> no tooltip
    await page.mouse.move(4, 4); await page.waitForTimeout(200);
    await page.locator('.dss-client-popper .el-select-dropdown__item').nth(0).hover({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(DELAY + 120);
    const tAll = await page.evaluate(QTT_FN);
    A('qbarTooltipAbsentForAll', !tAll || tAll.visibility === 'hidden', tAll ? tAll.content : 'none');
    // hover an empty-desc client (miss1/miss2) -> no tooltip
    const emptyIdx = opts.findIndex((o) => o.text === h.truncate('c-dssr1-0906-miss1'));
    if (emptyIdx >= 0) {
      await page.mouse.move(4, 4); await page.waitForTimeout(200);
      await page.locator('.dss-client-popper .el-select-dropdown__item').nth(emptyIdx).hover({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(DELAY + 120);
      const t = await page.evaluate(QTT_FN);
      A('qbarTooltipAbsentForEmptyDesc', !t || t.visibility === 'hidden', t ? t.content : 'none');
    }
    // query-bar tooltip non-enterable + single instance
    const tany = await page.evaluate(QTT_FN);
    if (tany) {
      A('qbarTooltipNonEnterable', tany.pointerEvents === 'none', String(tany.pointerEvents));
      A('qbarTooltipSingle', tany.count <= 1, String(tany.count));
    }
    await page.mouse.move(4, 4); await page.waitForTimeout(200);
    await h.closePanel(page, 'client');
  }

  out.consoleErrors = log.consoleErrors;
  out.nonGet = log.requests.filter((r) => !['GET', 'HEAD'].includes(r.method)).map((r) => `${r.method} ${r.url}`);
  const fails = out.assertions.filter((a) => !a.ok);
  out.summary = { assertions: out.assertions.length, failed: fails.length };
  fs.writeFileSync(path.join(lib.OUT, 'data.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`data.json assertions=${out.assertions.length} failed=${fails.length} rows=${rows.length}`);
  if (fails.length) console.log(fails.slice(0, 25).map((f) => `FAIL ${f.name}: ${f.detail}`).join('\n'));
  await ctx.close();
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
