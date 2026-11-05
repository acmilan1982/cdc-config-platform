const { openPage, rowOf, hoverTip, tipState, API } = require('../probe-lib.cjs');
const fs = require('fs');

let page;
const out = {};

async function openCreate() {
  await page.locator('.cc-btn-add').click();
  await page.locator('.cc-dialog').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
}
async function cancel() {
  await page.locator('.cc-dialog').getByRole('button', { name: '取消' }).click();
  await page.waitForTimeout(350);
}
async function choose(id) {
  await page.locator('.cc-search input').fill(id);
  await page.waitForTimeout(200);
  const opt = page.locator('.cc-opt').filter({ hasText: id }).first();
  await opt.scrollIntoViewIfNeeded();
  await opt.click();
  await page.waitForTimeout(120);
}
async function removeAll() {
  const tags = page.locator('.cc-chosen-list .el-tag');
  let guard = 0;
  while ((await tags.count()) > 0 && guard < 40) {
    const close = tags.first().locator('.el-tag__close');
    if ((await close.count()) === 0) break;
    await close.click();
    await page.waitForTimeout(90);
    guard += 1;
  }
}
async function autoGen() {
  const before = reqLog.length;
  await page.locator('.cc-autogen').click();
  await page.waitForTimeout(450);
  return {
    value: await page.locator('.cc-desc-row textarea').inputValue(),
    warnings: await page.locator('.el-message').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).map((e) => e.textContent.trim())),
    requestDelta: reqLog.length - before,
  };
}
function cpSlice(s, n) { return Array.from(s).slice(0, n).join(''); }
function bytes(s) { return Buffer.byteLength(s, 'utf8'); }

async function tagMetrics(cid, idx) {
  return rowOf(page, cid).locator('.cc-dstag').nth(idx).evaluate((el) => {
    const txt = el.querySelector('.cc-txt');
    const cs = getComputedStyle(el);
    const tcs = txt ? getComputedStyle(txt) : null;
    const r = el.getBoundingClientRect();
    return {
      text: el.textContent.trim(), cls: el.className,
      width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100,
      maxWidth: cs.maxWidth, display: cs.display, alignItems: cs.alignItems, justifyContent: cs.justifyContent,
      overflow: cs.overflow, whiteSpace: cs.whiteSpace, padding: cs.padding, fontSize: tcs && tcs.fontSize,
      txtOverflow: tcs && tcs.overflow, txtTextOverflow: tcs && tcs.textOverflow,
      txtClientWidth: txt && txt.clientWidth, txtScrollWidth: txt && txt.scrollWidth,
      truncated: txt ? txt.scrollWidth > txt.clientWidth + 1 : null,
    };
  });
}
async function moreMetrics(cid) {
  return rowOf(page, cid).locator('.cc-more').evaluate((el) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { text: el.textContent.trim(), width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100, display: cs.display, alignItems: cs.alignItems, justifyContent: cs.justifyContent };
  });
}
async function rowHeight(cid) {
  return rowOf(page, cid).evaluate((tr) => Math.round(tr.getBoundingClientRect().height * 100) / 100);
}

let reqLog;

(async () => {
  const { browser, page: p, requests } = await openPage({ width: 1440, height: 900 });
  page = p; reqLog = requests;
  try {
    // ---------- AC-012 label geometry/state ----------
    out.labels = {
      ok: await tagMetrics('S2AC-P6', 0),
      bad: await tagMetrics('S2AC-P68', 0),
      rawId: await tagMetrics('S2AC-PNOORG', 0),
      longOrg: await tagMetrics('S2AC-PELL', 0),
      more: await moreMetrics('S2AC-P8'),
      rowHeights: {
        P6: await rowHeight('S2AC-P6'),
        P68: await rowHeight('S2AC-P68'),
        PNOORG: await rowHeight('S2AC-PNOORG'),
        PELL: await rowHeight('S2AC-PELL'),
        P8: await rowHeight('S2AC-P8'),
      },
    };
    await rowOf(page, 'S2AC-PELL').locator('.cc-dstag').first().scrollIntoViewIfNeeded();
    out.labels.longOrgTip = await hoverTip(page, rowOf(page, 'S2AC-PELL').locator('.cc-dstag').first());
    await page.mouse.move(2, 2); await page.waitForTimeout(120);

    // ---------- AC-013 not-found source shows raw id ----------
    const nf = rowOf(page, 'S2AC-PNOTFOUND');
    out.notFound = {
      tags: await nf.locator('.cc-dstag').evaluateAll((els) => els.map((e) => ({ text: e.textContent.trim(), cls: e.className }))),
      count: await nf.locator('.cc-count').textContent().catch(() => null),
    };
    const nfTag = nf.locator('.cc-dstag').filter({ hasText: 'S2AC-MISSING' }).first();
    await nfTag.scrollIntoViewIfNeeded();
    out.notFound.tip = await hoverTip(page, nfTag);
    await page.mouse.move(2, 2); await page.waitForTimeout(120);

    // ---------- AC-015 duplicate-in-row marked anomaly + tooltip ----------
    const ph1 = rowOf(page, 'S2AC-PH1');
    out.dupRow = {
      tags: await ph1.locator('.cc-dstag').evaluateAll((els) => els.map((e) => ({ text: e.textContent.trim(), cls: e.className }))),
      count: await ph1.locator('.cc-count').textContent(),
      note: await ph1.locator('.cc-count-note').count().then((c) => (c ? 'present' : null)),
    };
    const d15 = ph1.locator('.cc-dstag').first();
    await d15.scrollIntoViewIfNeeded();
    out.dupRow.tip = await hoverTip(page, d15);
    await page.mouse.move(2, 2); await page.waitForTimeout(120);

    // ---------- AC-034 no count cap: 40 short sources ----------
    const kIds = Array.from({ length: 40 }, (_, i) => 'S2AC-K' + String(i + 1).padStart(2, '0'));
    const kRes = await fetch(API + '/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: 'S2AC-PK40', clientDesc: 'S2AC forty source probe', dataSourceIds: kIds }) });
    out.countCap = { request: { count: kIds.length, serializedBytes: bytes(kIds.join(',')) }, status: kRes.status, json: await kRes.json() };

    // ---------- AC-132 reorder above 256 chars ----------
    const opts = await (await fetch(API + '/api/clients/data-source-options')).json();
    const orgById = {};
    for (const o of opts.data) orgById[o.dataSourceId] = o.org;
    const A = ['S2AC-L01', 'S2AC-L02', 'S2AC-L03', 'S2AC-L04', 'S2AC-L05'];
    const B = [...A].reverse();
    await openCreate();
    for (const id of A) await choose(id);
    const genA = await autoGen();
    const fullA = A.map((id) => String(orgById[id] ?? '').trim()).join(',');
    await removeAll();
    for (const id of B) await choose(id);
    const genB = await autoGen();
    const fullB = B.map((id) => String(orgById[id] ?? '').trim()).join(',');
    out.reorderLong = {
      orderA: A, fullAChars: Array.from(fullA).length, fullABytes: bytes(fullA), expectedA: cpSlice(fullA, 256), actualA: genA.value, matchA: genA.value === cpSlice(fullA, 256), warningsA: genA.warnings,
      orderB: B, fullBChars: Array.from(fullB).length, fullBBytes: bytes(fullB), expectedB: cpSlice(fullB, 256), actualB: genB.value, matchB: genB.value === cpSlice(fullB, 256), warningsB: genB.warnings,
      distinct: genA.value !== genB.value,
      actualAChars: Array.from(genA.value).length, actualABytes: bytes(genA.value), actualBChars: Array.from(genB.value).length, actualBBytes: bytes(genB.value),
      requestDeltaA: genA.requestDelta, requestDeltaB: genB.requestDelta,
    };
    await cancel();

    // ---------- AC-112 unfiltered dialog layout + long option ----------
    await openCreate();
    await page.waitForFunction(() => document.querySelectorAll('.cc-opt').length > 150, null, { timeout: 15000 });
    await page.waitForTimeout(400);
    out.dialogLayout = await page.evaluate(() => {
      const pane = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100, clientHeight: e.clientHeight, scrollHeight: e.scrollHeight, overflowY: getComputedStyle(e).overflowY, overflowX: getComputedStyle(e).overflowX }; };
      const list = document.querySelector('.cc-opt-list');
      const lr = list.getBoundingClientRect();
      const opts = Array.from(document.querySelectorAll('.cc-opt'));
      const fullyVisible = opts.filter((o) => { const r = o.getBoundingClientRect(); return r.top >= lr.top - 0.5 && r.bottom <= lr.bottom + 0.5; }).length;
      return {
        optionsPane: pane('.cc-pane--options'), chosenPane: pane('.cc-pane--chosen'),
        optList: pane('.cc-opt-list'), chosenList: pane('.cc-chosen-list'), dialog: pane('.cc-dialog'),
        totalOptions: opts.length, fullyVisibleOptions: fullyVisible,
        viewport: { w: innerWidth, h: innerHeight }, docScrollWidth: document.documentElement.scrollWidth,
        widthRelation: (() => { const o = document.querySelector('.cc-pane--options').getBoundingClientRect().width; const c = document.querySelector('.cc-pane--chosen').getBoundingClientRect().width; return { options: Math.round(o * 100) / 100, chosen: Math.round(c * 100) / 100, optionsWider: o > c }; })(),
      };
    });
    await page.locator('.cc-search input').fill('S2AC-CAP-00000000000000000000001');
    await page.waitForTimeout(350);
    out.dialogLayout.longIdOption = await page.locator('.cc-opt').first().evaluate((e) => {
      const main = e.querySelector('.cc-opt-main'); const sub = e.querySelector('.cc-opt-sub'); const title = e.getAttribute('title');
      const m = main.getBoundingClientRect(); const s = sub.getBoundingClientRect();
      return {
        text: e.textContent.trim(), title,
        main: { width: Math.round(m.width * 100) / 100, clientWidth: main.clientWidth, scrollWidth: main.scrollWidth, truncated: main.scrollWidth > main.clientWidth + 1, whiteSpace: getComputedStyle(main).whiteSpace, textOverflow: getComputedStyle(main).textOverflow },
        sub: { width: Math.round(s.width * 100) / 100, height: Math.round(s.height * 100) / 100, clientWidth: sub.clientWidth, scrollWidth: sub.scrollWidth, truncated: sub.scrollWidth > sub.clientWidth + 1, whiteSpace: getComputedStyle(sub).whiteSpace, textOverflow: getComputedStyle(sub).textOverflow, lineHeight: getComputedStyle(sub).lineHeight },
      };
    });
    await page.locator('.cc-search input').fill('S2AC-O05');
    await page.waitForTimeout(350);
    out.dialogLayout.occupiedOption = await page.locator('.cc-opt').first().evaluate((e) => {
      const reason = e.querySelector('.cc-opt-reason'); const r = reason ? reason.getBoundingClientRect() : null;
      return { text: e.textContent.trim(), disabled: e.disabled, reasonText: reason ? reason.textContent.trim() : null, reasonWidth: r ? Math.round(r.width * 100) / 100 : null, reasonHeight: r ? Math.round(r.height * 100) / 100 : null, reasonScrollWidth: reason ? reason.scrollWidth : null, reasonClientWidth: reason ? reason.clientWidth : null };
    });
    await cancel();
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    fs.writeFileSync('/root/ccfg-s2-evidence/group-supp-results.json', JSON.stringify(out, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify({ ok: !out.error, error: out.error || null, sections: Object.keys(out) }, null, 2));
})();
