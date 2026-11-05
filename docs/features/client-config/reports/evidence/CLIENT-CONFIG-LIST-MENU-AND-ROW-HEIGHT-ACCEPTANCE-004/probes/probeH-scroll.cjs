const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core');
const fs = require('fs');
const OUT = '/tmp/004/scroll-raw.json';
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome', headless: true });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const R = { task: '004', mode: 'readonly-scroll-dialog', gate: { nonGetAttempts: 0, attempts: [] }, flows: {}, errors: [] };
  p.on('pageerror', (e) => R.errors.push(String(e)));
  p.on('request', (r) => { const m = r.method(); if (m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS') { R.gate.nonGetAttempts += 1; R.gate.attempts.push({ m, u: r.url() }); } });

  async function measure() {
    return await p.evaluate(() => {
      const ca = document.querySelector('.content-area');
      const ths = Array.from(document.querySelectorAll('.lt-main-table .el-table__header th'));
      const headWrap = document.querySelector('.lt-main-table .el-table__header-wrapper');
      const bodyWrap = document.querySelector('.lt-main-table .el-table__body-wrapper');
      const wrap = document.querySelector('.lt-main-table .el-scrollbar__wrap');
      const rows = Array.from(document.querySelectorAll('.lt-main-table tbody tr.el-table__row'));
      const lastTh = ths[ths.length - 1];
      const lastTd = rows[0] ? rows[0].querySelector('td:last-child') : null;
      const firstTd = rows[0] ? rows[0].querySelector('td:first-child') : null;
      const opTd = rows[0] ? rows[0].querySelector('td.lt-row-action__cell') : null;
      const rect = (el) => (el ? { l: el.getBoundingClientRect().left, r: el.getBoundingClientRect().right, t: el.getBoundingClientRect().top, b: el.getBoundingClientRect().bottom, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height } : null);
      return {
        contentArea: ca ? { scrollTop: ca.scrollTop, scrollLeft: ca.scrollLeft, clientH: ca.clientHeight, scrollH: ca.scrollHeight, clientW: ca.clientWidth, scrollW: ca.scrollWidth } : null,
        wrap: wrap ? { scrollTop: wrap.scrollTop, scrollLeft: wrap.scrollLeft, clientH: wrap.clientHeight, scrollH: wrap.scrollHeight, clientW: wrap.clientWidth, scrollW: wrap.scrollWidth, rect: rect(wrap) } : null,
        headWrap: rect(headWrap),
        bodyWrap: rect(bodyWrap),
        lastTh: rect(lastTh),
        lastTd: rect(lastTd),
        firstTd: rect(firstTd),
        opTd: rect(opTd),
        thCount: ths.length,
        headerCells: ths.map((t) => ({ text: (t.textContent || '').trim(), left: t.getBoundingClientRect().left, right: t.getBoundingClientRect().right })),
        rowCount: rows.length,
        rowTop: rows[0] ? rows[0].getBoundingClientRect().top : null,
        vh: window.innerHeight, vw: window.innerWidth,
        docScroll: { html: document.documentElement.scrollTop, body: document.body.scrollTop, h: document.documentElement.scrollHeight },
      };
    });
  }
  async function dialogMeasure() {
    return await p.evaluate(() => {
      const dlg = document.querySelector('.el-dialog.cc-dialog');
      if (!dlg) return null;
      const tables = Array.from(dlg.querySelectorAll('.el-table'));
      const rows = Array.from(dlg.querySelectorAll('tr'));
      return {
        open: (() => { const ov = document.querySelector('.el-overlay'); return !!ov && getComputedStyle(ov).display !== 'none'; })(),
        tableCount: tables.length,
        rowHeights: rows.slice(0, 12).map((r) => ({ cls: r.className, h: r.getBoundingClientRect().height })),
        mainTableInside: !!dlg.querySelector('.lt-main-table'),
      };
    });
  }

  await p.goto('http://127.0.0.1:5173/config/client', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelectorAll('.lt-main-table tbody tr.el-table__row').length > 0, null, { timeout: 20000 });
  await p.waitForTimeout(700);
  R.flows.baseline = await measure();

  // vertical scroll of actual container
  await p.evaluate(() => { const ca = document.querySelector('.content-area'); if (ca) ca.scrollTop = 1500; });
  await p.waitForTimeout(400);
  R.flows.vscroll1500 = await measure();
  await p.evaluate(() => { const ca = document.querySelector('.content-area'); if (ca) ca.scrollTop = 0; });
  await p.waitForTimeout(300);

  // narrow viewport for horizontal overflow and fixed right column
  await p.setViewportSize({ width: 1024, height: 900 });
  await p.waitForTimeout(500);
  R.flows.narrow1024 = await measure();
  const hor = await p.evaluate(() => {
    const wrap = document.querySelector('.lt-main-table .el-scrollbar__wrap');
    if (!wrap) return null;
    const before = wrap.scrollLeft;
    wrap.scrollLeft = 99999;
    return { before, after: wrap.scrollLeft, clientW: wrap.clientWidth, scrollW: wrap.scrollWidth };
  });
  await p.waitForTimeout(300);
  R.flows.narrow1024.hscroll = hor;
  R.flows.narrow1024.hscrollState = await measure();
  await p.evaluate(() => { const w = document.querySelector('.lt-main-table .el-scrollbar__wrap'); if (w) w.scrollLeft = 0; });
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.waitForTimeout(500);

  // dialog table isolation
  await p.getByRole('button', { name: '新增探针' }).click();
  await p.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible', timeout: 8000 });
  await p.waitForTimeout(600);
  R.flows.dialog = await dialogMeasure();
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  R.flows.mainAfterDialog = await measure();

  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1).slice(0, 7000));
  await b.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
