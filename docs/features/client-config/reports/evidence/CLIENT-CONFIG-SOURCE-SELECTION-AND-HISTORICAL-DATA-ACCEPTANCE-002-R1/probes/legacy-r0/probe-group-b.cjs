const { openPage, rowOf, visibleCount, tipState } = require('../probe-lib.cjs');
const fs = require('fs');

async function geometry(page, id) {
  const row = rowOf(page, id);
  return await row.evaluate((tr) => {
    const src = tr.querySelector('.cc-src');
    const srect = src.getBoundingClientRect();
    const tags = Array.from(tr.querySelectorAll('.cc-dstag'));
    const chipWidths = tags.map((t) => {
      const c = t.cloneNode(true);
      c.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;display:inline-flex;';
      document.body.appendChild(c);
      const w = c.getBoundingClientRect().width;
      c.remove();
      return { text: t.textContent.trim(), width: Math.round(w * 100) / 100 };
    });
    const vis = tags.filter((t) => getComputedStyle(t).display !== 'none').map((t) => {
      const r = t.getBoundingClientRect();
      return { text: t.textContent.trim(), left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10, width: Math.round(r.width * 100) / 100, cls: t.className };
    });
    const more = tr.querySelector('.cc-more');
    let moreInfo = null;
    if (more) {
      const r = more.getBoundingClientRect();
      const c = more.cloneNode(true);
      c.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;display:inline-flex;';
      document.body.appendChild(c);
      const mw = c.getBoundingClientRect().width;
      c.remove();
      moreInfo = { text: more.textContent.trim(), left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10, width: Math.round(mw * 100) / 100 };
    }
    const rb = tr.querySelector('.cc-rowbad');
    let rowbad = null;
    if (rb) {
      const r = rb.getBoundingClientRect();
      rowbad = { text: rb.textContent.trim(), width: Math.round(r.width * 100) / 100 };
    }
    return {
      clientId: src.getAttribute('data-client-id'),
      countText: (tr.querySelector('.cc-count') || {}).textContent || null,
      container: { width: Math.round(srect.width * 100) / 100, clientWidth: src.clientWidth, scrollWidth: src.scrollWidth },
      totalTags: tags.length,
      visibleCount: vis.length,
      visible: vis,
      chipWidths,
      more: moreInfo,
      rowbad,
      gaps: vis.slice(1).map((v, i) => Math.round((v.left - vis[i].right) * 100) / 100),
    };
  });
}

function expectedPack(g) {
  const total = g.totalTags;
  const cap = 6;
  let avail = g.container.width;
  if (g.rowbad) avail -= g.rowbad.width + 8;
  const widths = g.chipWidths.map((c) => c.width);
  const moreW = g.more ? g.more.width : 0;
  const place = (capW, capCount) => {
    let used = 0;
    let n = 0;
    for (let i = 0; i < total; i += 1) {
      if (n >= capCount) break;
      const need = n === 0 ? widths[i] : used + 8 + widths[i];
      if (need > capW) break;
      used = need;
      n += 1;
    }
    return n;
  };
  let shown;
  if (total <= cap && place(avail, total) === total) shown = total;
  else shown = place(Math.max(0, avail - (moreW + 8)), cap);
  return { expectedShown: shown, expectedHidden: total - shown, avail: Math.round(avail * 100) / 100 };
}

function evaluateGeometry(g) {
  const exp = expectedPack(g);
  const rightmost = g.visible.length ? g.visible[g.visible.length - 1].right : null;
  const noOverlap = g.visible.every((v, i) => i === 0 || v.left >= g.visible[i - 1].right - 0.5);
  const moreInside = !g.more || g.more.right <= g.container.width + 0.5 + (g.container.left || 0) || true; // relative widths only
  const lastToMore = g.more && rightmost !== null ? Math.round((g.more.left - rightmost) * 100) / 100 : null;
  return {
    ...exp,
    actualShown: g.visibleCount,
    matches: exp.expectedShown === g.visibleCount,
    noOverlap,
    gapOk: g.gaps.every((x) => Math.abs(x - 8) < 1.5),
    lastToMore,
    visibleMaxOk: g.visibleCount <= 6,
  };
}

async function popoverState(page) {
  return await page.evaluate(() => {
    const lists = Array.from(document.querySelectorAll('.cc-full-list'));
    const visible = lists.filter((el) => {
      const p = el.closest('.el-popper');
      return p && getComputedStyle(p).display !== 'none' && p.getBoundingClientRect().width > 0;
    });
    return visible.map((el) => ({
      note: (el.querySelector('.cc-full-note') || {}).textContent || null,
      items: Array.from(el.querySelectorAll('.cc-full-item')).map((li) => ({
        org: (li.querySelector('.cc-full-org') || {}).textContent || null,
        id: (li.querySelector('.cc-full-id') || {}).textContent || null,
        bad: (li.querySelector('.cc-full-bad') || {}).textContent || null,
        hasSecondLine: !!li.querySelector('.cc-full-id'),
      })),
    }));
  });
}

async function fullListTest(page, id) {
  const row = rowOf(page, id);
  const more = row.locator('.cc-more');
  const before = { visibleLists: (await popoverState(page)).length };
  await more.hover();
  await page.waitForTimeout(500);
  const afterHover = { visibleLists: (await popoverState(page)).length };
  await more.click();
  await page.waitForTimeout(500);
  const afterClick = await popoverState(page);
  const selected = await page.locator('tr.lt-row-highlight__row .cc-id').evaluateAll((els) => els.map((e) => e.textContent.trim()));
  await page.keyboard.press('Escape');
  await page.mouse.click(5, 5);
  await page.waitForTimeout(400);
  const afterClose = (await popoverState(page)).length;
  return { before, afterHover, afterClick, selectedAfterClick: selected, afterClose };
}

(async () => {
  const out = { viewports: {} };
  try {
    for (const vp of [{ w: 1440, h: 900 }, { w: 1920, h: 1080 }, { w: 900, h: 800 }]) {
      const key = `${vp.w}x${vp.h}`;
      const { browser, page } = await openPage({ width: vp.w, height: vp.h });
      const vres = { probes: {}, colorStates: {} };
      try {
        for (const id of ['S2AC-P6', 'S2AC-P8', 'S2AC-P8A', 'S2AC-PNOORG8', 'S2AC-PAMB1', 'S2AC-PAMB2', 'S2AC-P68']) {
          const g = await geometry(page, id);
          vres.probes[id] = { geometry: g, check: evaluateGeometry(g) };
        }
        vres.colorStates = {
          ok: await rowOf(page, 'S2AC-P6').locator('.cc-dstag').first().evaluate((e) => ({ cls: e.className, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor })),
          neutral: await rowOf(page, 'S2AC-PAMB1').locator('.cc-dstag').first().evaluate((e) => ({ cls: e.className, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor })),
          badAmb: await rowOf(page, 'S2AC-PAMB2').locator('.cc-dstag').first().evaluate((e) => ({ cls: e.className, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor })),
        };
        vres.fullList = {
          P8: await fullListTest(page, 'S2AC-P8'),
          P8A: await fullListTest(page, 'S2AC-P8A'),
          PNOORG8: await fullListTest(page, 'S2AC-PNOORG8'),
        };
        // missing-org label/tooltip
        const no8 = rowOf(page, 'S2AC-PNOORG8');
        vres.missingOrgLabelTexts = await no8.locator('.cc-dstag').evaluateAll((els) => els.map((e) => e.textContent.trim()));
        await no8.locator('.cc-dstag').first().scrollIntoViewIfNeeded();
        await no8.locator('.cc-dstag').first().hover();
        await page.waitForTimeout(400);
        vres.missingOrgTip = await tipState(page);
        await page.mouse.move(5, 5);
        await page.waitForTimeout(100);
      } catch (e) {
        vres.error = String(e && e.stack ? e.stack : e);
      } finally {
        out.viewports[key] = vres;
        await browser.close();
      }
    }
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    fs.writeFileSync('/root/ccfg-s2-evidence/group-b-results.json', JSON.stringify(out, null, 2));
  }
  console.log(JSON.stringify({ ok: !out.error, keys: Object.keys(out.viewports) }, null, 2));
})();
