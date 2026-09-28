// Probe A — CCFG-AC-010 (width change on the 7-source sample) + CCFG-AC-098 legs.
// Read-only. All /api/** writes intercepted BEFORE navigation.
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = '/tmp/fa-ro-supplement-001';
const SAMPLE = process.env.SAMPLE || 'CCFG-AC-R1-ON'; // 7 sources
const SHOTS = OUT + '/shots';
fs.mkdirSync(SHOTS, { recursive: true });

const writes = [];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route('**/api/**', async (route) => {
  const m = route.request().method().toUpperCase();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue();
  writes.push({ method: m, url: route.request().url() });
  return route.abort('blockedbyclient');
});

const page = await ctx.newPage();
await page.goto(BASE + '/config/client', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('.cc-table tbody tr', { timeout: 15000 });

async function measure(tag) {
  await page.waitForTimeout(350);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const m = await page.evaluate((sample) => {
    const src = document.querySelector(`.cc-src[data-client-id="${sample}"]`);
    if (!src) return { error: 'sample row not found' };
    const tr = src.closest('tr');
    const tags = [...src.querySelectorAll('.cc-dstag')];
    const vis = tags.filter((t) => t.offsetParent !== null);
    const rect = src.getBoundingClientRect();
    const cw = src.clientWidth;
    const more = src.querySelector('.cc-more .cc-txt, .cc-more');
    const rowbad = src.querySelector('.cc-rowbad');
    const lastVisible = vis.length ? vis[vis.length - 1].getBoundingClientRect() : null;
    const moreRect = more ? more.getBoundingClientRect() : null;
    return {
      viewport: [window.innerWidth, window.innerHeight],
      srcContainerWidth: cw,
      srcScrollWidth: src.scrollWidth,
      containerOverflowX: src.scrollWidth > cw + 1,
      totalSourcesTags: tags.length,
      directShown: vis.length,
      plusNText: more ? more.textContent.trim() : null,
      rowHeight: Math.round(tr.getBoundingClientRect().height),
      rowbadWidth: rowbad ? Math.round(rowbad.getBoundingClientRect().width) : 0,
      tagWidths: vis.map((t) => Math.round(t.getBoundingClientRect().width)),
      tagClippedByEllipsis: vis.map((t) => {
        const txt = t.querySelector('.cc-txt');
        return txt ? txt.scrollWidth > txt.clientWidth + 1 : false;
      }),
      lastTagRight: lastVisible ? Math.round(lastVisible.right) : null,
      moreRight: moreRect ? Math.round(moreRect.right) : null,
      containerRight: Math.round(rect.right),
      fitsInside: moreRect ? moreRect.right <= rect.right + 1 : (lastVisible ? lastVisible.right <= rect.right + 1 : null),
      pageHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      htmlScrollWidth: document.documentElement.scrollWidth,
    };
  }, SAMPLE);
  m.tag = tag;
  return m;
}

const results = [];
for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 800], [1100, 900], [900, 800]]) {
  await page.setViewportSize({ width: w, height: h });
  const m = await measure(`${w}x${h}`);
  results.push(m);
  await page.screenshot({ path: `${SHOTS}/ac010-${w}x${h}.png`, fullPage: false });
}

// AC-098: does an exactly-6-source probe exist on the page?
const counts = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.cc-table tbody tr').forEach((tr) => {
    const src = tr.querySelector('.cc-src');
    const id = src?.getAttribute('data-client-id');
    const tags = tr.querySelectorAll('.cc-dstag').length;
    const vis = [...tr.querySelectorAll('.cc-dstag')].filter((t) => t.offsetParent !== null).length;
    const more = tr.querySelector('.cc-more');
    out.push({ id, total: tags, shown: vis, plus: more ? more.textContent.trim() : null });
  });
  return out;
});

const res = { sample: SAMPLE, writesBlocked: writes, widthLegs: results, rowCountsAt900: counts };
fs.writeFileSync(OUT + '/probeA-result.json', JSON.stringify(res, null, 2));
console.log(JSON.stringify({ writesBlocked: writes.length, legs: results.map((r) => ({ tag: r.tag, cw: r.srcContainerWidth, shown: r.directShown, plus: r.plusNText, rowH: r.rowHeight, ovf: r.containerOverflowX, fits: r.fitsInside })) }, null, 2));
await browser.close();
