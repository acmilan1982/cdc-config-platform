/*
 * Browser geometry harness for
 * DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-IMPLEMENTATION-001
 *
 * Read-only: navigates the running 5173 frontend, opens/closes the three query
 * dropdowns, and records getBoundingClientRect + computed styles + inline styles
 * for the outer .el-popper, inner .el-select-dropdown, scroll wrap, list, trigger
 * root and trigger wrapper. It never mints data, never writes to any backend.
 *
 * Usage:
 *   node popper-harness.cjs before            -> root-cause facts @1280x800
 *   node popper-harness.cjs matrix            -> 4 viewports x state matrix x 5 reps
 *   node popper-harness.cjs narrow            -> thresholds 480 / 400 / 240
 *   node popper-harness.cjs regression        -> requests / console / other route
 *   node popper-harness.cjs singleflight      -> synchronous burst click concurrency
 *   node popper-harness.cjs timer             -> countdown / auto-refresh / visibility freeze
 *   node popper-harness.cjs shots             -> screenshots + manifest
 */
const path = require('path');
const fs = require('fs');
const {
  chromium,
} = require('/usr/lib/node_modules/openclaw/node_modules/playwright-core');

const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:5173';
const ROUTE = '/monitor/data-source-state';
const OUTDIR = path.resolve(__dirname, '..');
const DIMS = ['client', 'source', 'status'];

const TARGET = { client: 480, source: 400, status: 240 };

function pageMeasure() {
  // Runs inside the browser. Kept dependency-free so it can be re-injected.
  window.__dssMeasure = function (dim) {
    const q = (s) => document.querySelector(s);
    const pop = q('.el-popper.dss-' + dim + '-popper');
    const trig = q('.dss-' + dim + '-select');
    const inner = q('.el-select-dropdown.dss-' + dim + '-popper');
    const wrap = inner ? inner.querySelector('.el-select-dropdown__wrap') : null;
    const list = inner ? inner.querySelector('.el-select-dropdown__list') : null;
    const wrapper = trig ? trig.querySelector('.el-select__wrapper') : null;

    const describe = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        rect: {
          l: +r.left.toFixed(3),
          t: +r.top.toFixed(3),
          r: +r.right.toFixed(3),
          b: +r.bottom.toFixed(3),
          w: +r.width.toFixed(3),
          h: +r.height.toFixed(3),
        },
        offset: { ow: el.offsetWidth, oh: el.offsetHeight },
        client: { cw: el.clientWidth, ch: el.clientHeight },
        scroll: { sw: el.scrollWidth, sh: el.scrollHeight },
        css: {
          width: cs.width,
          minWidth: cs.minWidth,
          maxWidth: cs.maxWidth,
          boxSizing: cs.boxSizing,
          overflowX: cs.overflowX,
          overflowY: cs.overflowY,
          display: cs.display,
          position: cs.position,
          fontWeight: cs.fontWeight,
          borderLeftWidth: cs.borderLeftWidth,
          borderRightWidth: cs.borderRightWidth,
          paddingLeft: cs.paddingLeft,
          paddingRight: cs.paddingRight,
          visibility: cs.visibility,
        },
        inline: el.getAttribute('style') || '',
        visible: !!(r.width || r.height) && cs.visibility !== 'hidden',
      };
    };

    return {
      dim,
      now: Date.now(),
      hits: {
        outerByPrecise: document.querySelectorAll('.el-popper.dss-' + dim + '-popper').length,
        outerAny: document.querySelectorAll('.el-popper').length,
        bareClass: document.querySelectorAll('.dss-' + dim + '-popper').length,
        innerDropdown: document.querySelectorAll('.el-select-dropdown.dss-' + dim + '-popper').length,
      },
      outer: describe(pop),
      inner: describe(inner),
      wrap: describe(wrap),
      list: describe(list),
      trigger: describe(trig),
      triggerWrapper: describe(wrapper),
      selectedCount: (function () {
        const items = document.querySelectorAll(
          '.el-popper.dss-' + dim + '-popper .el-select-dropdown__item.is-selected',
        );
        return items.length;
      })(),
      hOverflow:
        wrap && inner
          ? +(wrap.scrollWidth - wrap.clientWidth) + (+(inner.scrollWidth - inner.clientWidth))
          : null,
      vScroll: wrap ? wrap.scrollHeight > wrap.clientHeight : null,
      vp: { w: window.innerWidth, h: window.innerHeight },
    };
  };
}

async function freshPage(browser, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const nonGet = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  page.on('request', (r) => {
    if (!['GET', 'HEAD'].includes(r.method())) nonGet.push(r.method() + ' ' + r.url());
  });
  await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
  await page.evaluate(pageMeasure);
  await page.waitForTimeout(200);
  return { ctx, page, consoleErrors, nonGet };
}

const popSel = (dim) => `.el-popper.dss-${dim}-popper`;
const itemSel = (dim) => `.el-popper.dss-${dim}-popper .el-select-dropdown__item`;

/* Below ~300px viewport the sidebar overlays the query bar, so a coordinate click
 * is intercepted. Fall back to a JS-dispatched click on the element itself. */
async function robustClick(page, selector, nth = 0) {
  const loc = page.locator(selector).nth(nth);
  try {
    await loc.click({ timeout: 2500 });
  } catch (e) {
    await page.evaluate(
      ({ s, n }) => {
        const el = document.querySelectorAll(s)[n];
        if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      },
      { s: selector, n: nth },
    );
  }
  await page.waitForTimeout(220);
}

async function openPanel(page, dim) {
  if (!(await page.locator(popSel(dim)).isVisible().catch(() => false))) {
    await robustClick(page, `.dss-${dim}-select`);
    await page.waitForTimeout(150);
    if (!(await page.locator(popSel(dim)).isVisible().catch(() => false))) {
      await page.evaluate((s) => {
        const el = document.querySelector(s);
        const wrap = el && (el.querySelector('.el-select__wrapper') || el);
        if (wrap) wrap.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      }, `.dss-${dim}-select`);
      await page.waitForTimeout(250);
    }
  }
}
async function closePanel(page, dim) {
  if (await page.locator(popSel(dim)).isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
  }
}
async function measure(page, dim) {
  return page.evaluate((d) => window.__dssMeasure(d), dim);
}

/* Enumerate options of an open panel: text, length, selected flag. */
async function options(page, dim) {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].map((li, idx) => ({
      idx,
      text: (li.textContent || '').trim(),
      len: [...(li.textContent || '').trim()].length,
      truncated: /\.\.\.$/.test((li.textContent || '').trim()),
      selected: li.classList.contains('is-selected'),
      ghost: li.classList.contains('dss-ghost'),
    }));
  }, itemSel(dim));
}

async function clickOption(page, dim, idx) {
  await robustClick(page, itemSel(dim), idx);
}

/* Pick shortest/longest/truncated non-ghost, non-__ALL__ candidate indices. */
function pick(opts) {
  const cands = opts.filter((o) => !o.ghost && o.text !== '全部');
  const sorted = [...cands].sort((a, b) => a.len - b.len);
  const shortest = sorted[0];
  const longest = sorted[sorted.length - 1];
  const trunc = cands.find((o) => o.truncated) || null;
  return { shortest, longest, trunc };
}

async function stateMatrix(page, dim) {
  const rec = {};
  // deterministic entry: page-level reset restores the three draft dims to 全部
  await robustClick(page, '.dss-reset-btn');
  await openPanel(page, dim);
  let opts = await options(page, dim);
  const { shortest, longest, trunc } = pick(opts);
  rec.optionStats = opts.map((o) => ({ text: o.text, len: o.len, truncated: o.truncated }));

  rec.A_INIT = await measure(page, dim);

  await clickOption(page, dim, shortest.idx);
  rec.B_SHORT = await measure(page, dim);

  await clickOption(page, dim, longest.idx);
  rec.C_LONG = await measure(page, dim);

  if (trunc && trunc.idx !== longest.idx) {
    await clickOption(page, dim, trunc.idx);
    rec.D_TRUNC = await measure(page, dim);
  } else if (trunc) {
    rec.D_TRUNC = rec.C_LONG;
  }

  // long -> short (switch back)
  await clickOption(page, dim, shortest.idx);
  rec.F_LONG2SHORT = await measure(page, dim);

  // short -> long again
  await clickOption(page, dim, longest.idx);
  rec.E_SHORT2LONG = await measure(page, dim);

  // multi-select / collapse-tags: add two more concrete candidates
  const others = opts
    .filter((o) => !o.ghost && o.text !== '全部')
    .filter((o) => ![shortest.idx, longest.idx, trunc && trunc.idx].includes(o.idx));
  for (const o of others.slice(0, 2)) await clickOption(page, dim, o.idx);
  rec.G_MULTI_COLLAPSE = await measure(page, dim);

  // cancel the longest candidate
  await clickOption(page, dim, longest.idx);
  rec.H_CANCEL_LONG = await measure(page, dim);

  if (dim === 'client') {
    // hover a truncated option to raise the CLIENT_DESC tooltip, then leave it
    const hoverTarget = page.locator(itemSel(dim)).nth(trunc ? trunc.idx : longest.idx);
    await hoverTarget.hover({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
    rec.K1_TOOLTIP_SHOWN = await measure(page, dim);
    rec.tooltipShown = await page.evaluate(
      () => !!document.querySelector('.dss-q-tt') &&
        getComputedStyle(document.querySelector('.dss-q-tt')).visibility !== 'hidden',
    );
    await page.mouse.move(5, 5);
    await page.waitForTimeout(300);
    rec.K2_TOOLTIP_HIDDEN = await measure(page, dim);
    rec.tooltipShownAfterHide = await page.evaluate(() => !!document.querySelector('.dss-q-tt'));
  }

  // vertical scrollbar present (panel currently tall) -> also capture scroll facts
  rec.L_SCROLL_NOW = await measure(page, dim);

  // clear via the clear icon (multiple select)
  const clear = page.locator(`.dss-${dim}-select .el-select__clear, .dss-${dim}-select .el-select__clear-icon`);
  if (await clear.count()) {
    await clear.first().click({ force: true });
    await page.waitForTimeout(250);
    await openPanel(page, dim);
    rec.I_CLEAR = await measure(page, dim);
  }

  // reset button (page-level) then reopen
  await closePanel(page, dim);
  await robustClick(page, '.dss-reset-btn');
  await openPanel(page, dim);
  await page.waitForTimeout(150);
  rec.J_RESET = await measure(page, dim);

  // close / reopen stability
  const beforeClose = await measure(page, dim);
  await closePanel(page, dim);
  rec.M_CLOSE_STATE = {
    outerExists: await page.locator(popSel(dim)).count(),
    outerVisible: await page.locator(popSel(dim)).isVisible().catch(() => false),
  };
  await openPanel(page, dim);
  rec.M_REOPEN = await measure(page, dim);
  rec.openCloseReopen = {
    beforeCloseW: beforeClose.outer ? beforeClose.outer.rect.w : null,
    hiddenAfterClose: !rec.M_CLOSE_STATE.outerVisible,
    afterReopenW: rec.M_REOPEN.outer ? rec.M_REOPEN.outer.rect.w : null,
  };

  await closePanel(page, dim);
  // leave the draft clean for the next repetition
  await robustClick(page, '.dss-reset-btn');
  return rec;
}

/* ------------------------------------------------------------------ modes */

async function modeBefore(browser) {
  const { page, ctx, consoleErrors, nonGet } = await freshPage(browser, { width: 1280, height: 800 });
  const out = { mode: 'before', route: BASE + ROUTE, viewport: '1280x800', dims: {} };
  for (const dim of DIMS) {
    const rec = {};
    await openPanel(page, dim);
    const opts = await options(page, dim);
    const { shortest, longest, trunc } = pick(opts);
    rec.optionStats = opts.map((o) => ({ text: o.text, len: o.len, truncated: o.truncated }));
    rec.A_INIT = await measure(page, dim);
    await clickOption(page, dim, longest.idx);
    rec.C_LONG = await measure(page, dim);
    await clickOption(page, dim, longest.idx); // cancel longest
    rec.H_CANCEL_LONG = await measure(page, dim);
    await closePanel(page, dim);
    out.dims[dim] = rec;
  }
  out.consoleErrors = consoleErrors;
  out.nonGetRequests = nonGet;
  await ctx.close();
  return out;
}

async function modeMatrix(browser) {
  const viewports = [
    { width: 1280, height: 800 },
    { width: 1700, height: 920 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
  ];
  const reps = 5;
  const out = { mode: 'matrix', route: BASE + ROUTE, reps, viewports: [], global: { consoleErrors: [], nonGet: [] } };
  for (const vp of viewports) {
    const { page, ctx, consoleErrors, nonGet } = await freshPage(browser, vp);
    const entry = { viewport: `${vp.width}x${vp.height}`, dims: {} };
    for (const dim of DIMS) {
      const runs = [];
      for (let i = 0; i < reps; i += 1) {
        const r = await stateMatrix(page, dim);
        runs.push(r);
      }
      entry.dims[dim] = runs;
    }
    await ctx.close();
    out.global.consoleErrors.push(...consoleErrors);
    out.global.nonGet.push(...nonGet);
    out.viewports.push(entry);
  }
  return out;
}

async function modeNarrow(browser) {
  // One viewport just below each threshold; measure ALL three dims at each.
  const cases = [
    { label: 'client_lt_496', w: 480, h: 800, expectActive: { client: 464, source: 400, status: 240 } },
    { label: 'source_lt_416', w: 400, h: 800, expectActive: { client: 384, source: 384, status: 240 } },
    { label: 'status_lt_256', w: 240, h: 800, expectActive: { client: 224, source: 224, status: 224 } },
  ];
  const out = { mode: 'narrow', route: BASE + ROUTE, cases: [], global: { consoleErrors: [], nonGet: [] } };
  for (const c of cases) {
    const { page, ctx, consoleErrors, nonGet } = await freshPage(browser, { width: c.w, height: c.h });
    const entry = { label: c.label, viewportW: c.w, expect: c.expectActive, dims: {} };
    for (const dim of DIMS) {
      entry.sidebarOverlay = await page.evaluate((d) => {
        const el = document.querySelector('.dss-' + d + '-select .el-select__wrapper');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(
          Math.min(Math.round(r.left + r.width / 2), window.innerWidth - 1),
          Math.min(Math.round(r.top + r.height / 2), window.innerHeight - 1),
        );
        return { covered: !el.contains(top), topClass: top ? top.className : null };
      }, 'client');
      await openPanel(page, dim);
      const rec = {};
      rec.A_INIT = await measure(page, dim);
      const opts = await options(page, dim);
      const { longest } = pick(opts);
      await clickOption(page, dim, longest.idx);
      rec.C_LONG = await measure(page, dim);
      await closePanel(page, dim);
      const a = rec.A_INIT;
      const expect = Math.min(TARGET[dim], c.w - 16);
      rec.formula = { target: TARGET[dim], viewportW: c.w, expect, unit: 'px' };
      rec.outerW = a.outer ? a.outer.rect.w : null;
      rec.outerL = a.outer ? a.outer.rect.l : null;
      rec.outerR = a.outer ? a.outer.rect.r : null;
      rec.outOfViewport = a.outer ? a.outer.rect.l < 0 || a.outer.rect.r > c.w : null;
      rec.innerW = a.inner ? a.inner.rect.w : null;
      rec.innerMinWidthCss = a.inner ? a.inner.css.minWidth : null;
      rec.innerInline = a.inner ? a.inner.inline : null;
      rec.wrapHOverflow =
        a.wrap && a.inner
          ? a.wrap.scrollWidth - a.wrap.clientWidth
          : null;
      rec.innerOverflowsOuter = a.outer && a.inner ? +(a.inner.rect.r - a.outer.rect.r).toFixed(3) : null;
      rec.vScroll = a.vScroll;
      entry.dims[dim] = rec;
    }
    await ctx.close();
    entry.consoleErrors = consoleErrors;
    entry.nonGet = nonGet;
    out.global.consoleErrors.push(...consoleErrors);
    out.global.nonGet.push(...nonGet);
    out.cases.push(entry);
  }
  return out;
}

async function modeRegression(browser) {
  const { page, ctx, consoleErrors, nonGet } = await freshPage(browser, { width: 1700, height: 920 });
  const apiCalls = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/')) apiCalls.push({ m: r.method(), u: r.url(), t: Date.now() });
  });
  const out = { mode: 'regression', route: BASE + ROUTE };
  const cnt = () => apiCalls.filter((c) => c.u.includes('data-source-run-state/list')).length;

  await page.waitForTimeout(400);
  const afterLoad = cnt();

  // open/close all three selects
  for (const dim of DIMS) {
    await openPanel(page, dim);
    await closePanel(page, dim);
  }
  out.delta_openClose = cnt() - afterLoad;

  // select / cancel / clear on client
  await openPanel(page, 'client');
  const opts = await options(page, 'client');
  const { longest, shortest } = pick(opts);
  await clickOption(page, 'client', longest.idx);
  await clickOption(page, 'client', shortest.idx);
  const afterSelect = cnt();
  out.delta_select = afterSelect - (afterLoad + out.delta_openClose);

  const clear = page.locator('.dss-client-select .el-select__clear, .dss-client-select .el-select__clear-icon');
  if (await clear.count()) {
    await clear.first().click({ force: true });
    await page.waitForTimeout(200);
  }
  out.delta_clear = cnt() - afterSelect;

  await closePanel(page, 'client');
  const beforeReset = cnt();
  await page.locator('.dss-reset-btn').click();
  await page.waitForTimeout(200);
  out.delta_reset = cnt() - beforeReset;

  // tooltip hover
  await openPanel(page, 'client');
  const o2 = await options(page, 'client');
  const t2 = pick(o2);
  await page.locator(itemSel('client')).nth(t2.trunc ? t2.trunc.idx : t2.longest.idx).hover();
  await page.waitForTimeout(300);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(200);
  out.delta_tooltip = cnt() - beforeReset - out.delta_reset;
  await closePanel(page, 'client');

  // select a concrete client then query
  await openPanel(page, 'client');
  const o3 = await options(page, 'client');
  const t3 = pick(o3);
  await clickOption(page, 'client', t3.longest.idx);
  const selectedValue = await page.evaluate(() => {
    const t = document.querySelector('.dss-client-select .el-select__tags-text') ||
      document.querySelector('.dss-client-select .el-tag');
    return t ? t.textContent.trim() : null;
  });
  await closePanel(page, 'client');
  const beforeQuery = cnt();
  await page.locator('.dss-query-btn').click();
  await page.waitForTimeout(1200);
  out.delta_query = cnt() - beforeQuery;
  out.selectedVisibleLabel = selectedValue;

  // single-flight: rapid double click while in flight
  const beforeSingle = cnt();
  await page.locator('.dss-query-btn').click({ force: true });
  await page.locator('.dss-query-btn').click({ force: true });
  await page.waitForTimeout(1500);
  out.delta_singleFlight = cnt() - beforeSingle;

  // other route: ensure no dss-* popper style leaks
  await page.goto(BASE + '/config/data-source', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  out.otherRoute = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'el-popper dss-client-popper';
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const r = { width: cs.width, minWidth: cs.minWidth, maxWidth: cs.maxWidth, position: cs.position };
    el.remove();
    return r;
  });
  out.consoleErrors = consoleErrors;
  out.nonGetRequests = nonGet;
  out.apiCallDetails = apiCalls.map((c) => `${c.m} ${c.u}`);
  await ctx.close();
  return out;
}

/* Single-flight 必须用“同一 JS 任务内的同步连击”来测：
 * Playwright 的 locator.click() 会顺序等待可交互性，两次坐标点击之间本地后端往往已经返回，
 * 于是产生的是两次合法的独立请求，而不是同一在途请求被击穿。
 * 这里用 dispatchEvent 在同一同步任务内连点，并用请求时间区间计算最大并发数。 */
async function modeSingleFlight(browser) {
  const { page, ctx, consoleErrors, nonGet } = await freshPage(browser, { width: 1700, height: 920 });
  const reqs = [];
  const pending = new Map();
  page.on('request', (r) => {
    if (r.url().includes('data-source-run-state/list')) pending.set(r, { start: Date.now() });
  });
  const settle = (r) => {
    const p = pending.get(r);
    if (p) { p.end = Date.now(); reqs.push(p); pending.delete(r); }
  };
  page.on('requestfinished', settle);
  page.on('requestfailed', settle);

  const listCount = () => reqs.length + pending.size;

  const syncClick = (n) =>
    page.evaluate((k) => {
      const btn = document.querySelector('.dss-query-btn');
      for (let i = 0; i < k; i++) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      }
    }, n);

  // 第一次点击后，在页面自身时钟上等待 delayMs 再连点 then 次；
  // 避免 page.evaluate 往返延迟（可能 > 飞行时长）导致第二次点击落到请求已结束之后。
  const timedClick = (first, delayMs, then) =>
    page.evaluate(
      ({ first, delayMs, then }) => {
        const btn = document.querySelector('.dss-query-btn');
        const fire = (k) => {
          for (let i = 0; i < k; i++) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        };
        fire(first);
        return new Promise((r) => setTimeout(() => { fire(then); r(null); }, delayMs));
      },
      { first, delayMs, then }
    );

  const maxConcurrent = () => {
    const all = [...reqs.map((r) => [r.start, r.end || Date.now()])];
    let m = 0;
    for (const [s] of all) m = Math.max(m, all.filter(([a, b]) => a <= s && s < b).length);
    return m;
  };
  const burstStats = (from, to) => {
    const slice = reqs.slice(from, to);
    const all = slice.map((r) => [r.start, r.end || Date.now()]);
    let m = 0;
    for (const [s] of all) m = Math.max(m, all.filter(([a, b]) => a <= s && s < b).length);
    return {
      requests: slice.length,
      maxConcurrent: m,
      durationsMs: slice.map((r) => (r.end || Date.now()) - r.start),
      anyOverlap: slice.some((r, i) => slice.some((q, j) => i < j && r.start < (q.end || Date.now()) && q.start < (r.end || Date.now()))),
    };
  };

  const out = { mode: 'singleflight', route: BASE + ROUTE, viewport: '1700x920', cases: [] };

  await page.waitForTimeout(500);

  // 1) idle -> 3 synchronous clicks in one task
  let from = reqs.length;
  await syncClick(3);
  await page.waitForTimeout(2500);
  out.cases.push({ name: 'idle-sync-triple-click', clicks: 3, expectedRequests: 1, ...burstStats(from, reqs.length) });

  // 2) idle -> 5 synchronous clicks in one task
  from = reqs.length;
  await syncClick(5);
  await page.waitForTimeout(2500);
  out.cases.push({ name: 'idle-sync-five-click', clicks: 5, expectedRequests: 1, ...burstStats(from, reqs.length) });

  // 3) 同一页面时钟内：点击 1 次后在 10ms 再连点 2 次，二者都落在首个在途请求内 -> 仍应为 1 次请求
  from = reqs.length;
  await timedClick(1, 10, 2);
  await page.waitForTimeout(2500);
  out.cases.push({ name: 'click-then-two-more-inflight-10ms', clicks: 3, expectedRequests: 1, ...burstStats(from, reqs.length) });

  // 4) after everything settles, one more click must still be a legitimate new flight (guard released)
  from = reqs.length;
  await page.waitForTimeout(300);
  await syncClick(1);
  await page.waitForTimeout(2500);
  out.cases.push({ name: 'post-settle-single-click', clicks: 1, expectedRequests: 1, ...burstStats(from, reqs.length) });

  out.totalRequests = listCount();
  out.maxConcurrentOverall = Math.max(...out.cases.map((c) => c.maxConcurrent || 0));
  out.consoleErrors = consoleErrors;
  out.nonGetRequests = nonGet;
  await ctx.close();
  return out;
}

/* 计时器 / 可见性回归（§10.4）：
 *  - 倒计时走秒（本地 1s 投影）不得产生任何请求；
 *  - 自动刷新真实周期（AUTO_REFRESH_INTERVAL_MS=60000）到期恰好 +1 GET；
 *  - 页面 hidden：停表、倒计时冻结、不补发；恢复可见：空闲态立即补发恰好 +1 GET。 */
async function modeTimer(browser) {
  const { page, ctx, consoleErrors, nonGet } = await freshPage(browser, { width: 1700, height: 920 });
  const reqs = [];
  page.on('request', (r) => {
    if (r.url().includes('data-source-run-state/list')) reqs.push({ t: Date.now(), url: r.url() });
  });
  const countdownText = () =>
    page.evaluate(() => {
      const el = document.querySelector('.dss-countdown-seconds');
      return el ? el.textContent.trim() : null;
    });
  const setHidden = (v) =>
    page.evaluate((hidden) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
      document.dispatchEvent(new Event('visibilitychange'));
    }, v);

  const out = { mode: 'timer', route: BASE + ROUTE, viewport: '1700x920', intervalMs: 60000 };

  // 等待首屏 initial 请求与首轮 60s 周期安排完成
  await page.waitForTimeout(2500);
  const baseReqs = reqs.length;
  out.initialRequests = baseReqs;

  // 1) 倒计时走秒 8s：不应新增请求，且秒数文本在推进（真的在走，不是被冻结）
  const cdStart = await countdownText();
  const c0 = reqs.length;
  await page.waitForTimeout(8000);
  const cdEnd = await countdownText();
  out.countdownTicks = {
    windowMs: 8000,
    secondsStart: cdStart,
    secondsEnd: cdEnd,
    requestsAdded: reqs.length - c0,
    expectedRequestsAdded: 0,
    countdownAdvanced: cdStart !== cdEnd
  };

  // 2) 自动刷新：再等到距首屏约 65s，真实周期应恰好到期一次
  const t0 = Date.now();
  await page.waitForTimeout(55000);
  const c1 = reqs.length;
  out.autoRefresh = {
    elapsedMsSinceWindowStart: Date.now() - t0 + 8000,
    requestsAdded: c1 - c0,
    expectedRequestsAdded: 1,
    urls: reqs.slice(c0).map((r) => r.url)
  };

  // 3) hidden 冻结：隐藏后不再安排周期；等待 8s 不得新增请求；倒计时文本冻结
  const cdBeforeHide = await countdownText();
  const c2 = reqs.length;
  await setHidden(true);
  await page.waitForTimeout(500);
  const cdHidden0 = await countdownText();
  await page.waitForTimeout(8000);
  const cdHidden1 = await countdownText();
  out.hiddenFreeze = {
    windowMs: 8000,
    requestsAdded: reqs.length - c2,
    expectedRequestsAdded: 0,
    secondsBeforeHide: cdBeforeHide,
    secondsAtHideStart: cdHidden0,
    secondsAtHideEnd: cdHidden1,
    countdownFrozen: cdHidden0 === cdHidden1
  };

  // 4) 恢复可见：空闲态立即补发恰好 +1 GET
  const c3 = reqs.length;
  await setHidden(false);
  await page.waitForTimeout(2000);
  out.visibilityRestore = {
    requestsAdded: reqs.length - c3,
    expectedRequestsAdded: 1,
    urls: reqs.slice(c3).map((r) => r.url)
  };

  out.totalRequests = reqs.length;
  out.consoleErrors = consoleErrors;
  out.nonGetRequests = nonGet;
  await ctx.close();
  return out;
}

/* 失败保留回归（§10.4 / DSS-REQ-050~054）：已成功现场后，一次查询失败必须
 *  - 不清空表格（行数/汇总不变）；
 *  - 不回写已应用条件（查询栏仍显示上一次成功的条件，而非失败草稿）；
 *  - 展示刷新失败内联提示。 */
async function modeFailure(browser) {
  const { page, ctx, consoleErrors, nonGet } = await freshPage(browser, { width: 1700, height: 920 });
  const reqs = [];
  page.on('request', (r) => {
    if (r.url().includes('data-source-run-state/list')) reqs.push(r.url());
  });
  const snapshot = () =>
    page.evaluate(() => {
      const readSel = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const picked = Array.from(el.querySelectorAll('.el-select__tags-text, .el-tag__content, .el-select__selected-item'))
          .map((t) => t.textContent.replace(/\s+/g, ' ').trim())
          .filter(Boolean);
        return picked.length ? picked.join('|') : null;
      };
      const q = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
      };
      return {
        rows: document.querySelectorAll('.el-table__body-wrapper tbody tr').length,
        summaryCount: q('.dss-summary-count'),
        resultError: q('.dss-result-error'),
        draftDisplay: { client: readSel('.dss-client-select'), source: readSel('.dss-source-select'), status: readSel('.dss-status-select') }
      };
    });

  const out = { mode: 'failure', route: BASE + ROUTE, viewport: '1700x920' };
  await page.waitForTimeout(600);

  // 1) 先做一次成功查询，建立“已应用条件 = 探针端最长候选 + 已成功现场”
  await openPanel(page, 'client');
  const opts = await options(page, 'client');
  const p = pick(opts);
  await clickOption(page, 'client', p.longest.idx);
  await closePanel(page, 'client');
  await page.locator('.dss-query-btn').click();
  await page.waitForTimeout(1500);
  const s1 = await snapshot();
  out.afterSuccess = s1;
  const appliedUrl = reqs[reqs.length - 1];
  out.appliedQueryUrl = appliedUrl;

  // 2) 改草稿（切换到另一个候选）后强制下一次查询失败
  await page.route('**/data-source-run-state/list*', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'forced failure (harness)' }) })
  );
  const beforeFail = reqs.length;
  await openPanel(page, 'client');
  const opts2 = await options(page, 'client');
  const other = opts2.find((o) => !o.ghost && o.text !== '全部' && o.idx !== p.longest.idx) || opts2[0];
  await clickOption(page, 'client', other.idx);
  await closePanel(page, 'client');
  await page.locator('.dss-query-btn').click();
  await page.waitForTimeout(1500);
  const s2 = await snapshot();
  out.failedQueryRequests = reqs.length - beforeFail;
  out.afterFailure = s2;
  await page.unroute('**/data-source-run-state/list*');

  // 3) 失败后“立即刷新”必须仍按“旧已应用条件”取数（而非失败草稿）
  const beforeManual = reqs.length;
  await page.locator('.dss-manual-refresh-btn, .dss-refresh-btn').first().click();
  await page.waitForTimeout(1200);
  const manualUrl = reqs[reqs.length - 1];
  out.manualRefreshRequests = reqs.length - beforeManual;
  out.manualRefreshUrl = manualUrl;

  out.assertions = {
    rowsRetained: s2.rows === s1.rows && s1.rows > 0,
    summaryRetained: s2.summaryCount === s1.summaryCount,
    failureSurfaced: typeof s2.resultError === 'string' && s2.resultError.length > 0,
    exactlyOneFailedRequest: out.failedQueryRequests === 1,
    manualRefreshUsesPreviousAppliedCriteria: manualUrl === appliedUrl
  };

  out.consoleErrors = consoleErrors;
  out.consoleErrorsNote = 'forced 500 from harness route interception is expected';
  out.nonGetRequests = nonGet;
  await ctx.close();
  return out;
}

async function modeShots(browser) {
  const vps = [
    { w: 1280, h: 800 },
    { w: 1700, h: 920 },
    { w: 1920, h: 1080 },
    { w: 2560, h: 1440 },
    { w: 480, h: 800, narrow: true },
    { w: 400, h: 800, narrow: true },
    { w: 240, h: 800, narrow: true },
  ];
  const dir = path.join(OUTDIR, 'screenshots');
  fs.mkdirSync(dir, { recursive: true });
  const shots = [];
  const shoot = async (page, name, dim) => {
    const file = path.join(dir, `${name}.png`);
    if (dim) {
      const clip = await page.evaluate((d) => {
        const t = document.querySelector(`.dss-${d}-select`).getBoundingClientRect();
        const p = document.querySelector(`.el-popper.dss-${d}-popper`).getBoundingClientRect();
        const l = Math.max(0, Math.min(t.left, p.left) - 24);
        const tp = Math.max(0, t.top - 24);
        const r = Math.min(window.innerWidth, Math.max(t.right, p.right) + 24);
        const b = Math.min(window.innerHeight, Math.max(t.bottom, p.bottom) + 24);
        return { x: Math.round(l), y: Math.round(tp), width: Math.round(r - l), height: Math.round(b - tp) };
      }, dim);
      await page.screenshot({ path: file, clip });
    } else {
      await page.screenshot({ path: file, fullPage: false });
    }
    shots.push(path.basename(file));
  };
  for (const vp of vps) {
    const { page, ctx } = await freshPage(browser, { width: vp.w, height: vp.h });
    const tag = `${vp.w}x${vp.h}`;
    await shoot(page, `${tag}--00-querybar-init`);
    for (const dim of DIMS) {
      await robustClick(page, '.dss-reset-btn');
      await openPanel(page, dim);
      const opts = await options(page, dim);
      const { longest } = pick(opts);
      await shoot(page, `${tag}--${dim}-1-open`, dim);
      await clickOption(page, dim, longest.idx);
      await shoot(page, `${tag}--${dim}-2-selected-longest`, dim);
      await clickOption(page, dim, longest.idx); // cancel
      await shoot(page, `${tag}--${dim}-3-cancelled`, dim);
      await closePanel(page, dim);
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUTDIR, 'screenshots-manifest.json'), JSON.stringify({ count: shots.length, shots }, null, 2));
  return { mode: 'shots', count: shots.length, shots };
}

(async () => {
  const mode = process.argv[2] || 'before';
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  let result;
  if (mode === 'before') result = await modeBefore(browser);
  else if (mode === 'matrix') result = await modeMatrix(browser);
  else if (mode === 'narrow') result = await modeNarrow(browser);
  else if (mode === 'regression') result = await modeRegression(browser);
  else if (mode === 'singleflight') result = await modeSingleFlight(browser);
  else if (mode === 'timer') result = await modeTimer(browser);
  else if (mode === 'failure') result = await modeFailure(browser);
  else if (mode === 'shots') result = await modeShots(browser);
  else throw new Error('unknown mode ' + mode);
  await browser.close();
  const file = path.join(OUTDIR, `${mode}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2));
  console.log('wrote', file);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
