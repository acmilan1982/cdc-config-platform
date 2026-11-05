const { openPage, rowOf, visibleCount, tipState, hoverTip, selectedIds, API } = require('../probe-lib.cjs');
const fs = require('fs');

async function snapshot(page, id) {
  const row = rowOf(page, id);
  return await row.evaluate((tr) => {
    const src = tr.querySelector('.cc-src');
    const tags = Array.from(tr.querySelectorAll('.cc-dstag'));
    return {
      clientId: src ? src.getAttribute('data-client-id') : null,
      countText: (tr.querySelector('.cc-count') || {}).textContent || null,
      countNote: (tr.querySelector('.cc-count-note') || {}).textContent || null,
      rowBadge: (tr.querySelector('.cc-rowbad') || {}).textContent || null,
      moreText: (tr.querySelector('.cc-more') || {}).textContent || null,
      tags: tags.map((t) => {
        const txt = t.querySelector('.cc-txt');
        const cs = getComputedStyle(t);
        const ts = txt ? getComputedStyle(txt) : null;
        return {
          text: txt ? txt.textContent : t.textContent,
          cls: t.className,
          color: cs.color,
          background: cs.backgroundColor,
          display: cs.display,
          alignItems: cs.alignItems,
          justifyContent: cs.justifyContent,
          maxWidth: cs.maxWidth,
          textOverflow: ts ? ts.textOverflow : null,
          overflow: ts ? ts.overflow : null,
          txtClientWidth: txt ? txt.clientWidth : null,
          txtScrollWidth: txt ? txt.scrollWidth : null,
          truncated: !!(txt && txt.scrollWidth > txt.clientWidth + 1),
        };
      }),
    };
  });
}

(async () => {
  const { browser, page, requests } = await openPage({ width: 1440, height: 900 });
  const out = { viewport: '1440x900', snapshots: {}, tooltips: {}, selection: {}, writeLeg: {}, requestLog: [] };
  try {
    for (const id of ['S2AC-P6', 'S2AC-P8', 'S2AC-PAMB1', 'S2AC-PAMB2', 'S2AC-P68', 'S2AC-PNOORG', 'S2AC-PH1', 'S2AC-POCCV']) {
      out.snapshots[id] = await snapshot(page, id);
    }

    const selectedBefore = await selectedIds(page);
    // --- single-instance tooltip on ambiguity+anomaly row (ordered: X01 bad first) ---
    const ambRow = rowOf(page, 'S2AC-PAMB2');
    const tags = ambRow.locator('.cc-dstag');
    out.tooltips.ambTagOrder = await tags.evaluateAll((els) => els.map((e) => e.textContent.trim()));
    out.tooltips.ambFirst = await hoverTip(page, tags.nth(0));
    out.tooltips.ambShownTagCount = await ambRow.locator('.cc-dstag:visible').count();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(80);

    // --- single-instance switching on a row with two visible labels (P68) ---
    const sw = rowOf(page, 'S2AC-P68').locator('.cc-dstag');
    out.tooltips.switchVisibleTags = await rowOf(page, 'S2AC-P68').locator('.cc-dstag:visible').count();
    out.tooltips.switchFirst = await hoverTip(page, sw.nth(0));
    out.tooltips.switchSecondDelayMs = await (async () => {
      const t0 = Date.now();
      await sw.nth(1).hover();
      let t = null;
      for (let i = 0; i < 60; i += 1) {
        const tips = await tipState(page);
        if (tips.length && tips[0].lines.some((l) => l.text.includes('D17 Org'))) { t = Date.now() - t0; break; }
        await page.waitForTimeout(10);
      }
      return { delayMs: t, tips: await tipState(page), visible: await visibleCount(page) };
    })();
    // rapid switch before delay elapses
    await page.mouse.move(5, 5);
    await page.waitForTimeout(80);
    await sw.nth(0).hover();
    await page.waitForTimeout(100);
    await sw.nth(1).hover();
    await page.waitForTimeout(350);
    out.tooltips.rapidSwitch = { tips: await tipState(page), visible: await visibleCount(page) };
    await page.mouse.move(5, 5);
    await page.waitForTimeout(120);
    out.tooltips.afterLeave = { tips: await tipState(page), visible: await visibleCount(page) };

    // --- conflict tooltip (POCCV) ---
    const occRow = rowOf(page, 'S2AC-POCCV');
    out.tooltips.conflict = await hoverTip(page, occRow.locator('.cc-dstag').nth(0));
    out.tooltips.conflictText = out.tooltips.conflict.tips.flatMap((t) => t.lines.map((l) => l.text)).join(' | ');
    await page.mouse.move(5, 5);
    await page.waitForTimeout(80);

    // --- missing org fallback tooltip (PNOORG, N09 is second ordered; no anomalies so original order) ---
    const noOrgRow = rowOf(page, 'S2AC-PNOORG');
    out.tooltips.missingOrgTagTexts = await noOrgRow.locator('.cc-dstag').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    out.tooltips.missingOrg = await hoverTip(page, noOrgRow.locator('.cc-dstag').filter({ hasText: 'S2AC-N09' }));
    await page.mouse.move(5, 5);
    await page.waitForTimeout(80);

    // --- ellipsis + full-org tooltip on long org (P8 D08) ---
    const ellRow = rowOf(page, 'S2AC-PELL');
    out.tooltips.longOrg = await hoverTip(page, ellRow.locator('.cc-dstag').first());
    await page.mouse.move(5, 5);
    await page.waitForTimeout(80);

    // --- neutral vs green vs red computed colors from PAMB1/P8/P68 ---
    out.colorStates = {
      neutral: await rowOf(page, 'S2AC-PAMB1').locator('.cc-dstag').first().evaluate((e) => ({ cls: e.className, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor })),
      ok: await rowOf(page, 'S2AC-P6').locator('.cc-dstag').first().evaluate((e) => ({ cls: e.className, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor })),
      bad: await rowOf(page, 'S2AC-P68').locator('.cc-dstag').first().evaluate((e) => ({ cls: e.className, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor })),
    };

    // --- selection stability: hover + click a tag must not toggle fixed row selection ---
    await rowOf(page, 'S2AC-P6').locator('.cc-id').click();
    await page.waitForTimeout(200);
    const selectedAfterIdClick = await selectedIds(page);
    await rowOf(page, 'S2AC-PAMB2').locator('.cc-dstag:visible').first().click();
    await page.waitForTimeout(200);
    const selectedAfterTagClick = await selectedIds(page);
    out.selection = { selectedBefore, selectedAfterIdClick, selectedAfterTagClick };

    // --- AC-014 write leg via real API: trim/ignore-empty/dedupe/order ---
    const body = { clientId: 'S2AC-P14', clientDesc: 'S2AC serialization probe', dataSourceIds: [' S2AC-N02 ', '', 'S2AC-N02', 'S2AC-N03'] };
    const res = await fetch(API + '/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    out.writeLeg = { request: body, httpStatus: res.status, response: json };
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    out.requestLog = requests;
    fs.writeFileSync('/root/ccfg-s2-evidence/group-a-results.json', JSON.stringify(out, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify({ ok: !out.error, error: out.error || null, writeLeg: out.writeLeg }, null, 2));
})();
