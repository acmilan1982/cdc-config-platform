/*
 * Shared read-only browser helpers for
 * DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001.
 *
 * Drives the real 5173 Chromium page read-only: it only navigates, clicks the
 * read-only feature controls, hovers table cells and observes DOM / computed
 * style / network / console. It never issues a write request.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/usr/lib/node_modules/openclaw/node_modules/playwright-core');

const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:5173';
const ROUTE = '/monitor/data-source-state';
const OUT = path.resolve(__dirname, '..');
const LIST_API = '/api/monitor/data-source-run-state/list';

const VIEWPORTS = [
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1700x920', width: 1700, height: 920 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '2560x1440', width: 2560, height: 1440 },
];

async function launch(view = VIEWPORTS[2]) {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--force-device-scale-factor=1'] });
  const ctx = await browser.newContext({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const log = { requests: [], consoleErrors: [], pageErrors: [] };
  page.on('request', (r) => log.requests.push({ method: r.method(), url: r.url(), resourceType: r.resourceType() }));
  page.on('console', (m) => { if (m.type() === 'error') log.consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => log.pageErrors.push(String(e.message || e)));
  return { browser, ctx, page, log };
}

async function openPage(page) {
  await page.goto(BASE + ROUTE, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForSelector('.dss-page', { timeout: 20000 });
  await page.waitForTimeout(800);
}

/** In-page measurement helpers, injected once per page. */
async function installMeasure(page) {
  await page.addInitScript(() => {
    window.__fa = {
      rect: (el) => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(3), y: +r.y.toFixed(3), w: +r.width.toFixed(3), h: +r.height.toFixed(3), right: +r.right.toFixed(3), bottom: +r.bottom.toFixed(3) }; },
      cs: (el, props) => { const c = getComputedStyle(el); const o = {}; for (const p of props) o[p] = c.getPropertyValue(p); return o; },
    };
  });
}

/** DOM descriptor used for geometry snapshots. */
const DOM_SNAPSHOT_FN = () => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const desc = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return {
      rect: { x: +r.x.toFixed(3), y: +r.y.toFixed(3), w: +r.width.toFixed(3), h: +r.height.toFixed(3), right: +r.right.toFixed(3), bottom: +r.bottom.toFixed(3) },
      offsetW: el.offsetWidth, offsetH: el.offsetHeight, clientW: el.clientWidth, scrollW: el.scrollWidth,
      css: {
        width: c.width, minWidth: c.minWidth, maxWidth: c.maxWidth, height: c.height,
        padding: c.padding, paddingLeft: c.paddingLeft, paddingTop: c.paddingTop,
        background: c.backgroundColor, borderRadius: c.borderRadius, border: c.border || (c.borderTopWidth + ' ' + c.borderTopStyle + ' ' + c.borderTopColor),
        boxShadow: c.boxShadow, fontWeight: c.fontWeight, fontSize: c.fontSize, color: c.color,
        display: c.display, flexWrap: c.flexWrap, overflow: c.overflow, overflowX: c.overflowX,
        pointerEvents: c.pointerEvents, visibility: c.visibility, whiteSpace: c.whiteSpace, textOverflow: c.textOverflow,
      },
    };
  };
  const wrap = q('.dss-table-wrap');
  const table = q('.dss-table');
  const body = q('.dss-result-card__body');
  return {
    page: desc(q('.dss-page')),
    queryCard: desc(q('.dss-query-card')),
    resultCard: desc(q('.dss-result-card')),
    resultBody: desc(body),
    tableWrap: desc(wrap),
    table: desc(table),
    headers: qa('.dss-table .el-table__header th').map((th) => {
      const d = desc(th);
      return { text: th.innerText.trim(), w: d.rect.w, css: { textAlign: getComputedStyle(th).textAlign, padding: getComputedStyle(th).padding } };
    }),
    rowCount: qa('.dss-table .el-table__body tbody tr').length,
    rowHeight: (() => { const r = q('.dss-table .el-table__body tbody tr'); return r ? +r.getBoundingClientRect().height.toFixed(3) : null; })(),
    pagination: qa('.el-pagination').length,
    sortArrows: qa('.dss-table .caret-wrapper, .dss-table .sort-caret, .dss-table th.is-sortable').length,
    globalContainers: {
      body: desc(document.body),
      contentArea: desc(q('.content-area')),
      contentCard: desc(q('.content-card')),
    },
    summaryCount: q('.dss-summary-count') ? q('.dss-summary-count').innerText : null,
    summaryUnknown: q('.dss-summary-unknown') ? q('.dss-summary-unknown').innerText : null,
    refreshGroup: desc(q('.dss-refresh-group')),
    refreshGroupChildren: qa('.dss-refresh-group > *').map((el) => el.className || el.tagName),
    countdownRing: desc(q('.dss-countdown-ring')),
    countdownText: q('.dss-countdown-text') ? q('.dss-countdown-text').innerText : null,
    countdownSeconds: q('.dss-countdown-seconds') ? { text: q('.dss-countdown-seconds').innerText, ...desc(q('.dss-countdown-seconds')) } : null,
    refreshBtn: desc(q('.dss-refresh-btn')),
    queryBtn: desc(q('.dss-query-btn')),
    resetBtn: desc(q('.dss-reset-btn')),
    labels: qa('.dss-q-label').map((el) => ({ text: el.innerText, ...desc(el) })),
    queryBar: desc(q('.dss-query-bar')),
    queryActions: desc(q('.dss-q-actions')),
    selects: ['client', 'source', 'status'].reduce((a, k) => {
      const root = q('.dss-' + k + '-select');
      a[k] = { root: desc(root), wrapper: desc(root ? root.querySelector('.el-select__wrapper') : null) };
      return a;
    }, {}),
    selectRootX: ['client', 'source', 'status'].reduce((a, k) => { const el = q('.dss-' + k + '-select'); a[k] = el ? +el.getBoundingClientRect().x.toFixed(3) : null; return a; }, {}),
    titles: { h2: q('.dss-title') ? q('.dss-title').innerText : null, desc: q('.dss-desc') ? q('.dss-desc').innerText : null },
    route: location.pathname,
    bodyScroll: { docScrollW: document.documentElement.scrollWidth, docClientW: document.documentElement.clientWidth },
  };
};

/** Widths of the three poppers when open (outer .el-popper carrying the Feature class). */
const POPPER_SNAPSHOT_FN = () => {
  const out = {};
  for (const k of ['client', 'source', 'status']) {
    const pop = document.querySelector('.el-popper.dss-' + k + '-popper');
    const inner = pop ? pop.querySelector('.el-select-dropdown') : null;
    const wrap = inner ? inner.querySelector('.el-select-dropdown__wrap') : null;
    const d = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const c = getComputedStyle(el);
      return {
        rect: { x: +r.x.toFixed(3), y: +r.y.toFixed(3), w: +r.width.toFixed(3), h: +r.height.toFixed(3), right: +r.right.toFixed(3), bottom: +r.bottom.toFixed(3) },
        offsetW: el.offsetWidth, clientW: el.clientWidth, scrollW: el.scrollWidth, scrollH: el.scrollHeight, clientH: el.clientHeight,
        inline: { width: el.style.width, minWidth: el.style.minWidth, maxWidth: el.style.maxWidth },
        css: { width: c.width, minWidth: c.minWidth, maxWidth: c.maxWidth, border: c.borderTopWidth + ' ' + c.borderTopStyle + ' ' + c.borderTopColor, padding: c.padding, boxSizing: c.boxSizing, overflowX: c.overflowX },
      };
    };
    out[k] = { visible: !!(pop && pop.offsetParent !== null && getComputedStyle(pop).display !== 'none'), popper: d(pop), inner: d(inner), wrap: d(wrap), selectedItemFontWeight: (() => { const it = pop ? pop.querySelector('.el-select-dropdown__item.is-selected') : null; return it ? getComputedStyle(it).fontWeight : null; })() };
  }
  out.__bodyTooltipCount = document.querySelectorAll('.dss-single-tooltip').length;
  out.__qBarTooltipCount = document.querySelectorAll('.dss-q-tt').length;
  return out;
};

function writeJson(name, data) {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2) + '\n');
}
function writeTxt(name, text) {
  fs.writeFileSync(path.join(OUT, name), text + '\n');
}

module.exports = { EXE, BASE, ROUTE, OUT, LIST_API, VIEWPORTS, launch, openPage, installMeasure, DOM_SNAPSHOT_FN, POPPER_SNAPSHOT_FN, writeJson, writeTxt };
