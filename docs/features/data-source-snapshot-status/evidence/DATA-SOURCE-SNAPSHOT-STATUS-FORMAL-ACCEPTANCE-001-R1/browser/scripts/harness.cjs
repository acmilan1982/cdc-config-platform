/*
 * Read-only interaction helpers for the formal acceptance browser matrix.
 * Builds on lib.cjs. Never writes to any backend: it only opens/closes the
 * read-only query controls, clicks options, hovers cells and observes DOM.
 */
const lib = require('./lib.cjs');

const DIMS = ['client', 'source', 'status'];
const TARGET = { client: 480, source: 400, status: 240 };

const popSel = (d) => `.el-popper.dss-${d}-popper`;
const itemSel = (d) => `.el-popper.dss-${d}-popper .el-select-dropdown__item`;
const trigSel = (d) => `.dss-${d}-select`;

/* Near-zero-width viewports overlay the sidebar onto the query bar, so a
 * coordinate click can be intercepted. Fall back to a JS-dispatched click. */
async function robustClick(page, selector, nth = 0) {
  const loc = page.locator(selector).nth(nth);
  try {
    await loc.click({ timeout: 2500 });
  } catch (e) {
    await page.evaluate(({ s, n }) => {
      const el = document.querySelectorAll(s)[n];
      if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }, { s: selector, n: nth });
  }
  await page.waitForTimeout(220);
}

async function openPanel(page, dim) {
  const vis = () => page.locator(popSel(dim)).isVisible().catch(() => false);
  if (!(await vis())) {
    await robustClick(page, trigSel(dim));
    await page.waitForTimeout(150);
    if (!(await vis())) {
      await page.evaluate((s) => {
        const el = document.querySelector(s);
        const w = el && (el.querySelector('.el-select__wrapper') || el);
        if (w) w.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      }, trigSel(dim));
      await page.waitForTimeout(250);
    }
  }
}

/** Closed = not painted: display:none / aria-hidden=true / zero width. */
async function isPanelClosed(page, dim) {
  return page.evaluate((s) => {
    const p = document.querySelector(s);
    if (!p) return true;
    const cs = getComputedStyle(p);
    return cs.display === 'none' || p.getAttribute('aria-hidden') === 'true' || p.getBoundingClientRect().width === 0;
  }, popSel(dim));
}

async function closePanel(page, dim) {
  if (await isPanelClosed(page, dim)) return;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(420);
  if (await isPanelClosed(page, dim)) return;
  // fallback: blur by clicking outside the popper
  await page.mouse.click(8, 8);
  await page.waitForTimeout(420);
}

/** Measure the outer popper / inner dropdown / wrap / trigger for a dim. */
async function measurePopper(page, dim) {
  return page.evaluate((d) => {
    const q = (s) => document.querySelector(s);
    const pop = q('.el-popper.dss-' + d + '-popper');
    const trig = q('.dss-' + d + '-select');
    const inner = q('.el-select-dropdown.dss-' + d + '-popper');
    const wrap = inner ? inner.querySelector('.el-select-dropdown__wrap') : null;
    const wrapper = trig ? trig.querySelector('.el-select__wrapper') : null;
    const desc = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        rect: { l: +r.left.toFixed(3), t: +r.top.toFixed(3), r: +r.right.toFixed(3), b: +r.bottom.toFixed(3), w: +r.width.toFixed(3), h: +r.height.toFixed(3) },
        ow: el.offsetWidth, oh: el.offsetHeight, cw: el.clientWidth, sw: el.scrollWidth, sh: el.scrollHeight, ch: el.clientHeight,
        css: { width: cs.width, minWidth: cs.minWidth, maxWidth: cs.maxWidth, boxSizing: cs.boxSizing, overflowX: cs.overflowX, overflowY: cs.overflowY, display: cs.display, visibility: cs.visibility, fontWeight: cs.fontWeight },
        inline: el.getAttribute('style') || '',
      };
    };
    return {
      dim: d,
      existsOuter: document.querySelectorAll('.el-popper.dss-' + d + '-popper').length,
      outer: desc(pop), inner: desc(inner), wrap: desc(wrap), trigger: desc(trig), triggerWrapper: desc(wrapper),
      selectedCount: document.querySelectorAll('.el-popper.dss-' + d + '-popper .el-select-dropdown__item.is-selected').length,
      hOverflow: wrap && inner ? +((wrap.scrollWidth - wrap.clientWidth) + (inner.scrollWidth - inner.clientWidth)) : null,
      vScroll: wrap ? wrap.scrollHeight > wrap.clientHeight : null,
      docScroll: { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth },
    };
  }, dim);
}

/** Option list facts for an open panel. */
async function options(page, dim) {
  return page.evaluate((sel) => [...document.querySelectorAll(sel)].map((li, idx) => ({
    idx,
    text: (li.textContent || '').trim(),
    len: [...(li.textContent || '').trim()].length,
    truncated: /\.\.\.$/.test((li.textContent || '').trim()),
    selected: li.classList.contains('is-selected'),
    ghost: li.classList.contains('dss-ghost'),
  })), itemSel(dim));
}

async function clickOption(page, dim, idx) { await robustClick(page, itemSel(dim), idx); }

/** Trim and truncate using Unicode code points, mirroring the Feature rule. */
function truncate(s, max = 20) {
  const cps = Array.from(String(s == null ? '' : s).trim());
  return cps.length > max ? cps.slice(0, max).join('') + '...' : cps.join('');
}

module.exports = { lib, DIMS, TARGET, popSel, itemSel, trigSel, robustClick, openPanel, closePanel, isPanelClosed, measurePopper, options, clickOption, truncate };
