/*
 * §11.3 truncation semantics for values that do not exist in the dev DB.
 *
 * BI — browser request interception. The list API response is fulfilled from a
 * crafted local payload so that CLIENT_ID / DATA_SOURCE_ID longer than 20 code
 * points (19/20/21/22 cp, CJK, emoji surrogate pairs, null/empty/whitespace, and
 * two candidates whose truncated labels collide) can be exercised on the REAL
 * 5173 page. The feature's own front-end state machine runs for real; only the
 * backend response bytes are substituted. All BI-derived verdicts are labelled
 * "not real backend data". No write request is ever issued.
 */
const fs = require('fs');
const path = require('path');
const h = require('./harness.cjs');
const { lib, truncate } = h;

const A20 = 'A'.repeat(20);
const D20 = 'D'.repeat(20);
const CJK20 = '中'.repeat(20);
const EMOJI20 = '😀'.repeat(20);

function client(id, desc, active = true) { return { id, desc, active }; }
function source(id, org, active = true) { return { id, org, active }; }

/* Null / empty / pure-whitespace inputs are covered by the front-end unit tests
 * (utils/format.spec.ts); a production list API never emits a null CLIENT_ID, so
 * BI keeps to realistic long-value and identity scenarios. */
const CLIENTS = [
  client(A20.slice(0, 19), 'short19'),                 // 19 cp -> no truncation
  client(A20, 'exactly20'),                            // 20 cp -> no truncation
  client(A20 + 'X', D20 + 'X'),                        // 21 cp -> truncate; desc 21 cp -> tooltip
  client(A20 + 'Y', D20 + 'Y'),                        // 21 cp -> SAME truncated label as above, different full id/desc
  client(A20 + 'ZZ', 'desc22cp'),                      // 22 cp -> truncate
  client(CJK20 + '中', 'cjk21'),                       // CJK 21 cp -> truncate by code point
  client(EMOJI20 + '😀', 'emoji21'),                    // emoji surrogate pair 21 cp -> truncate, no split
];

const SOURCES = [
  source(A20.slice(0, 15), 'org-short'),
  source(A20 + 'S', 'SNAPSHOT-ORG-超过二十个字符的源库组织名称用于截断校验'),   // long id + long org
  source(A20, ''),
  source(CJK20 + '库', '   '),
  source(EMOJI20 + '😀', 'SNAPSHOT-ORG-emoji-long-value-beyond-twenty'),
];

const STATUSES = ['RUNNING', 'COMPLETED', 'UNKNOWN'];

function rec(c, s, rawStatus, cat, i) {
  return {
    clientId: c, sourceId: s, snapshotStatus: rawStatus, statusCategory: cat,
    clientRef: { state: 'ACTIVE', desc: (CLIENTS.find((x) => x.id === c) || {}).desc },
    sourceRef: { state: 'ACTIVE', org: (SOURCES.find((x) => x.id === s) || {}).org, category: 'SOURCE', sourceRole: true },
    snapshotLastSeenAt: '2026-09-12 12:00:0' + (i % 10), snapshotCompletedAt: null, updatedAt: '2026-09-12 12:00:0' + (i % 10),
  };
}

const PAYLOAD = {
  code: 200,
  message: 'ok',
  data: {
    records: [
      rec(A20 + 'X', A20 + 'S', 'SNAPSHOT_RUNNING', 'RUNNING', 1),
      rec(A20 + 'Y', A20.slice(0, 15), 'SNAPSHOT_COMPLETED', 'COMPLETED', 2),
      rec(CJK20 + '中', CJK20 + '库', 'SNAPSHOT_WEIRD_LONG_RAW_VALUE', 'UNKNOWN', 3),
      rec(EMOJI20 + '😀', EMOJI20 + '😀', 'SNAPSHOT_RUNNING', 'RUNNING', 4),
    ],
    candidates: { clients: CLIENTS, sources: SOURCES, statuses: STATUSES },
  },
};

const LBL = { opt: '.el-select-dropdown__item' };

async function main() {
  const out = { mode: 'BI-interception', label: 'BI — backend list response substituted; NOT real backend data', route: lib.BASE + lib.ROUTE, assertions: [], clientLabels: [], sourceLabels: [], identityCheck: null, requestParams: [], rawStatusTooltip: null };
  const A = (name, ok, detail) => out.assertions.push({ name, ok, detail });

  const { browser, page, ctx, log } = await lib.launch(lib.VIEWPORTS[2]);
  await lib.installMeasure(page);

  const captured = [];
  await page.route('**/api/monitor/data-source-run-state/list**', async (route) => {
    captured.push({ method: route.request().method(), url: route.request().url() });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PAYLOAD) });
  });

  await lib.openPage(page);
  await page.waitForTimeout(500);

  const expect = (v) => truncate(v);
  const rawOf = (t) => t.replace(/（.*$/, '');
  const idPartTruncated = (t) => rawOf(t).endsWith('...');

  // ---------- client panel labels
  await h.openPanel(page, 'client');
  let opts = await h.options(page, 'client');
  out.clientLabels = opts.map((o) => ({ text: o.text, len: o.len, truncated: o.truncated, ghost: o.ghost }));
  const labelOf = (id) => opts.find((o) => rawOf(o.text) === expect(id));
  for (const c of CLIENTS) {
    const wantRaw = expect(c.id);
    const hit = opts.find((o) => rawOf(o.text) === wantRaw);
    const ok = !!hit;
    A(`clientLabel[${JSON.stringify(String(c.id).slice(0, 26))}]`, ok, ok ? JSON.stringify(hit.text.slice(0, 40)) : `want raw=${JSON.stringify(wantRaw)}`);
  }
  // cp-20 boundary on the CLIENT_ID field of the composite label
  A('client19NotTruncated', labelOf(A20.slice(0, 19)) && !idPartTruncated(labelOf(A20.slice(0, 19)).text), JSON.stringify((labelOf(A20.slice(0, 19)) || {}).text));
  A('client20NotTruncated', labelOf(A20) && !idPartTruncated(labelOf(A20).text), JSON.stringify((labelOf(A20) || {}).text));
  A('client21Truncated', !!labelOf(A20 + 'X') && idPartTruncated(labelOf(A20 + 'X').text) && rawOf(labelOf(A20 + 'X').text) === A20 + '...', JSON.stringify((labelOf(A20 + 'X') || {}).text));
  A('client22Truncated', !!labelOf(A20 + 'ZZ') && idPartTruncated(labelOf(A20 + 'ZZ').text), JSON.stringify((labelOf(A20 + 'ZZ') || {}).text));
  A('clientCjk21TruncatedByCodePoint', !!labelOf(CJK20 + '中') && rawOf(labelOf(CJK20 + '中').text) === CJK20 + '...', JSON.stringify((labelOf(CJK20 + '中') || {}).text));
  A('clientEmoji21NoSurrogateSplit', (() => { const t = (labelOf(EMOJI20 + '😀') || {}).text || ''; const raw = rawOf(t); return raw === EMOJI20 + '...' && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(raw); })(), JSON.stringify((labelOf(EMOJI20 + '😀') || {}).text));
  A('fieldsTruncatedBeforeAssembly', (() => { const t = (labelOf(A20 + 'X') || {}).text || ''; const m = t.match(/^([^（]+)（([^）]+)）$/); return !!m && m[1] === A20 + '...' && m[2] === D20 + '...'; })(), JSON.stringify((labelOf(A20 + 'X') || {}).text));
  A('allCandidateClientsRendered', opts.length === CLIENTS.length + 1, `options=${opts.length} expected=${CLIENTS.length + 1}`);

  // ---------- identity: two candidates with identical truncated labels.
  // Locate them by the private data-dss-client-id attribute (the stable raw id),
  // NOT by the collided visible label — that collision is the point of the test.
  {
    const a = A20 + 'X', b = A20 + 'Y';
    const sameLabel = expect(a) === expect(b) && truncate(D20 + 'X') === truncate(D20 + 'Y');
    A('collidingTruncatedLabelsConstructed', sameLabel, `${expect(a)} vs ${expect(b)}`);
    const idxByAttr = async (id) => page.evaluate((v) => Array.from(document.querySelectorAll('.dss-client-popper .el-select-dropdown__item')).findIndex((li) => li.getAttribute('data-dss-client-id') === v), id);
    const ia = await idxByAttr(a), ib = await idxByAttr(b);
    const probe = async (idx) => {
      await page.mouse.move(4, 4); await page.waitForTimeout(150);
      await page.locator(`.dss-client-popper ${LBL.opt}`).nth(idx).hover({ timeout: 4000 });
      await page.waitForTimeout(420);
      const t = await page.evaluate(() => { const e = document.querySelector('.dss-q-tt'); return e ? { content: e.innerText, vis: getComputedStyle(e).visibility } : null; });
      const holder = await page.evaluate((n) => { const li = document.querySelectorAll('.dss-client-popper .el-select-dropdown__item')[n]; return li ? { id: li.getAttribute('data-dss-client-id'), text: li.innerText.trim() } : null; }, idx);
      await page.mouse.move(4, 4); await page.waitForTimeout(150);
      return { t, holder };
    };
    const pa = ia >= 0 ? await probe(ia) : null;
    const pb = ib >= 0 ? await probe(ib) : null;
    out.identityCheck = { a: { id: a, desc: D20 + 'X', idx: ia, probe: pa }, b: { id: b, desc: D20 + 'Y', idx: ib, probe: pb }, sameVisibleLabel: pa && pb ? pa.holder.text === pb.holder.text : null };
    A('identityCandidatesDistinct', ia >= 0 && ib >= 0 && ia !== ib, `ia=${ia} ib=${ib}`);
    A('identityAnchorByRawClientId', !!pa && !!pb && pa.holder.id === a && pb.holder.id === b, `holderA=${pa && pa.holder.id} holderB=${pb && pb.holder.id}`);
    A('identityTooltipNoCrossAttribution', !!pa && !!pb && pa.t && pb.t && pa.t.content === D20 + 'X' && pb.t.content === D20 + 'Y', `A=${pa && pa.t && JSON.stringify(pa.t.content)} B=${pb && pb.t && JSON.stringify(pb.t.content)}`);
  }

  // ---------- display truncation must not leak into the request parameter
  {
    const idxByAttr = async (id) => page.evaluate((v) => Array.from(document.querySelectorAll('.dss-client-popper .el-select-dropdown__item')).findIndex((li) => li.getAttribute('data-dss-client-id') === v), id);
    const ia = await idxByAttr(A20 + 'X');
    await h.clickOption(page, 'client', ia);
    await h.closePanel(page, 'client');
    captured.length = 0;
    await page.locator('.dss-query-btn').click();
    await page.waitForTimeout(900);
    const get = captured.find((c) => c.method === 'GET');
    out.requestParams.push({ url: get ? get.url : null });
    let q = null;
    if (get) { try { q = new URL(get.url).searchParams.getAll('clientId'); } catch (e) { q = null; } }
    A('requestCarriesFullRawId', !!q && q.includes(A20 + 'X'), JSON.stringify(q));
    A('requestDoesNotCarryEllipsis', !!q && q.every((v) => !v.includes('...')), JSON.stringify(q));
  }

  // ---------- source panel labels
  await h.openPanel(page, 'source');
  const sopts = await h.options(page, 'source');
  out.sourceLabels = sopts.map((o) => ({ text: o.text, len: o.len, truncated: o.truncated }));
  A('sourceLongIdTruncated', sopts.some((o) => o.truncated && o.text.includes('...')), JSON.stringify(sopts.filter((o) => o.truncated).map((o) => o.text.slice(0, 30))));
  A('sourceLongOrgTruncated', sopts.some((o) => o.text.includes('SNAPSHOT-ORG-超过二') && o.text.includes('...')), JSON.stringify(sopts.map((o) => o.text.slice(0, 30))));
  await h.closePanel(page, 'source');

  // ---------- unknown raw status tooltip on an intercepted row
  {
    const rows = page.locator('.dss-table .el-table__body tbody tr');
    const n = await rows.count();
    let found = null;
    for (let i = 0; i < n; i += 1) {
      const txt = await rows.nth(i).locator('.dss-status-trigger').innerText();
      if (txt.includes('未知')) { found = i; break; }
    }
    if (found != null) {
      await page.mouse.move(4, 4); await page.waitForTimeout(120);
      await rows.nth(found).locator('.dss-status-trigger').hover({ timeout: 4000 });
      await page.waitForTimeout(420);
      const t = await page.evaluate(() => { const e = document.querySelector('.dss-single-tooltip'); return e ? e.querySelector('.dss-single-tooltip__content').innerText : null; });
      out.rawStatusTooltip = { rowIndex: found, content: t };
      A('unknownRawStatusTooltip', t === '原始状态：SNAPSHOT_WEIRD_LONG_RAW_VALUE', JSON.stringify(t));
    } else { A('unknownRawStatusTooltip', false, 'no unknown row rendered'); }
  }

  out.interceptedRequests = captured.map((c) => `${c.method} ${c.url}`);
  out.consoleErrors = log.consoleErrors;
  out.nonGet = log.requests.filter((r) => !['GET', 'HEAD'].includes(r.method)).map((r) => `${r.method} ${r.url}`);
  const fails = out.assertions.filter((a) => !a.ok);
  out.summary = { assertions: out.assertions.length, failed: fails.length };
  fs.writeFileSync(path.join(lib.OUT, 'bi.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`bi.json assertions=${out.assertions.length} failed=${fails.length}`);
  if (fails.length) console.log(fails.map((f) => `FAIL ${f.name}: ${f.detail}`).join('\n'));
  await ctx.close();
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
