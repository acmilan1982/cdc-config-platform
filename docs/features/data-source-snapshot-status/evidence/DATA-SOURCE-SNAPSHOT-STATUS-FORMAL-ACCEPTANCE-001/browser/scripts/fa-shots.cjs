/*
 * Screenshot manifest for the formal acceptance browser matrix (§11.1/§11.4/§11.5).
 * Read-only. Emits screenshots/*.png plus a manifest with sha256 + dimensions.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const h = require('./harness.cjs');
const { lib } = h;

const SHOTDIR = path.join(lib.OUT, 'screenshots');

async function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

async function main() {
  fs.mkdirSync(SHOTDIR, { recursive: true });
  const manifest = { mode: 'screenshots', route: lib.BASE + lib.ROUTE, entries: [] };

  for (const vp of lib.VIEWPORTS) {
    const { browser, page, ctx } = await lib.launch(vp);
    await lib.openPage(page);
    const idle = path.join(SHOTDIR, `page-idle-${vp.name}.png`);
    await page.screenshot({ path: idle });
    manifest.entries.push({ viewport: vp.name, name: path.basename(idle), kind: 'page-idle', ...pngSize(idle), sha256: await sha256(idle) });

    for (const dim of h.DIMS) {
      await h.openPanel(page, dim);
      await page.waitForTimeout(300);
      const f = path.join(SHOTDIR, `popper-${dim}-${vp.name}.png`);
      const pop = page.locator(h.popSel(dim));
      try { await pop.screenshot({ path: f }); } catch (e) { await page.screenshot({ path: f }); }
      manifest.entries.push({ viewport: vp.name, name: path.basename(f), kind: `popper-${dim}`, target: h.TARGET[dim], ...pngSize(f), sha256: await sha256(f) });
      await h.closePanel(page, dim);
    }

    await page.route('**/api/monitor/data-source-run-state/list**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.locator('.dss-refresh-btn').click();
    await page.waitForTimeout(450);
    const loading = path.join(SHOTDIR, `refresh-loading-${vp.name}.png`);
    await page.screenshot({ path: loading });
    manifest.entries.push({ viewport: vp.name, name: path.basename(loading), kind: 'refresh-loading', ...pngSize(loading), sha256: await sha256(loading) });
    await page.waitForTimeout(1600);

    // tooltip open on an UNKNOWN status cell (warning row)
    const unk = await page.locator('.dss-table .el-table__body tr.dss-warning-row').first().count();
    if (unk > 0) {
      await page.locator('.dss-table .el-table__body tr.dss-warning-row').first().locator('.dss-status-trigger').hover({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(500);
      const tt = path.join(SHOTDIR, `tooltip-unknown-status-${vp.name}.png`);
      await page.screenshot({ path: tt });
      manifest.entries.push({ viewport: vp.name, name: path.basename(tt), kind: 'tooltip-unknown-status', ...pngSize(tt), sha256: await sha256(tt) });
    }
    await ctx.close();
    await browser.close();
  }

  fs.writeFileSync(path.join(lib.OUT, 'screenshots-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('screenshots=' + manifest.entries.length);
  for (const e of manifest.entries) console.log(`  ${e.viewport} ${e.kind} ${e.width}x${e.height} ${e.sha256.slice(0, 12)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
