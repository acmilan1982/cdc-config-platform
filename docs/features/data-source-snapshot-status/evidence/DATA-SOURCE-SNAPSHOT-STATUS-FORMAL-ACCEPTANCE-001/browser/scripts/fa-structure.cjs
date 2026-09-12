/*
 * §11.1 page / menu / structure + §11.7 route isolation.
 * Read-only. Emits structure.json and leak.json (+ screenshots for §11.1).
 */
const { lib, DIMS, TARGET, itemSel, robustClick, openPanel, closePanel, measurePopper, options } = require('./harness.cjs');
const { launch, openPage, installMeasure, DOM_SNAPSHOT_FN, VIEWPORTS, ROUTE, writeJson } = lib;

const STRUCT_FN = () => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const txt = (s) => (q(s) ? q(s).innerText.trim() : null);
  const menuItems = qa('.el-menu .el-menu-item, .el-menu .el-sub-menu__title').map((el) => el.innerText.trim());
  const activeMenu = q('.el-menu .el-menu-item.is-active') ? q('.el-menu .el-menu-item.is-active').innerText.trim() : null;
  const breadcrumb = qa('.breadcrumb .el-breadcrumb__item').map((el) => el.innerText.trim());
  return {
    route: location.pathname,
    title: document.title,
    dssTitle: txt('.dss-title'),
    dssDesc: q('.dss-desc') ? q('.dss-desc').innerText.trim() : null,
    menuItems,
    activeMenu,
    breadcrumb,
    // read-only: no create/edit/delete/operation affordances anywhere on the page
    readOnlyProbe: {
      buttons: qa('button, .el-button').map((b) => (b.innerText || '').trim()).filter(Boolean),
      hasActionColumn: !!q('.dss-table th') && qa('.dss-table th').some((th) => /操作|操作栏|Action/i.test(th.innerText)),
      editableInputsOutsideQuery: qa('.dss-page input:not([readonly]):not([disabled])').filter((i) => !i.closest('.dss-query-bar')).length,
      dssCardCount: qa('.dss-card').length,
      queryCard: !!q('.dss-query-card'),
      resultCard: !!q('.dss-result-card'),
      errorCard: !!q('.dss-error-card'),
      dssPagePresent: !!q('.dss-page'),
    },
    table: {
      exists: !!q('.dss-table'),
      headers: qa('.dss-table .el-table__header th').map((th) => th.innerText.trim()),
      headerCount: qa('.dss-table .el-table__header th').length,
      bodyRowCount: qa('.dss-table .el-table__body tbody tr').length,
      pagination: qa('.el-pagination').length,
      sortableHeaders: qa('.dss-table th.is-sortable, .dss-table .sort-caret, .dss-table .caret-wrapper').length,
      columns: qa('.dss-table col').map((c) => c.getAttribute('width') || c.style.width || null),
    },
    // route uniqueness is asserted later from router source; here record path + page identity
    pageIdentity: q('.dss-page') ? q('.dss-page').className : null,
    counts: { menuItems: menuItems.length, breadcrumb: breadcrumb.length },
  };
};

async function structureShots() {
  const out = { viewports: [], global: { consoleErrors: [], nonGet: [] } };
  for (const vp of VIEWPORTS) {
    const { browser, page, ctx, log } = await lib.launch(vp);
    await installMeasure(page);
    await openPage(page);
    const struct = await page.evaluate(STRUCT_FN);
    const dom = await page.evaluate(DOM_SNAPSHOT_FN);
    out.viewports.push({ viewport: vp.name, struct, dom: { table: dom.table, rowHeight: dom.rowHeight, headers: dom.headers, rowCount: dom.rowCount, pagination: dom.pagination, sortArrows: dom.sortArrows, titles: dom.titles, route: dom.route, bodyScroll: dom.bodyScroll, globalContainers: dom.globalContainers, summaryCount: dom.summaryCount, summaryUnknown: dom.summaryUnknown } });
    require('fs').mkdirSync(require('path').join(lib.OUT, 'screenshots'), { recursive: true });
    await page.screenshot({ path: require('path').join(lib.OUT, `screenshots/structure-${vp.name}.png`), fullPage: false });
    out.global.consoleErrors.push(...log.consoleErrors);
    out.global.nonGet.push(...log.requests.filter((r) => !['GET', 'HEAD'].includes(r.method)).map((r) => `${r.method} ${r.url}`));
    await ctx.close();
    await browser.close();
  }
  return out;
}

/* §11.7: visit another Feature route, assert no dss-* leak and no global override.
 * NOTE: the raw HTML always contains the substring "dss-" via the worktree path
 * /agent/dss-formal-acceptance-001 in script src URLs, so class-level and
 * CSS-rule-level checks are used instead of a naive substring test. */
const LEAK_FN = () => {
  const dssEls = Array.from(document.querySelectorAll('[class*=" dss-"], [class^="dss-"]'))
    .map((el) => el.className)
    .filter((c) => /(^|\s)dss-/.test(c))
    .slice(0, 40);
  const dssStyleRules = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; }
    if (!rules) continue;
    for (const r of Array.from(rules)) {
      if (r.selectorText && /(^|[\s,>+~])\.dss-/.test(r.selectorText)) dssStyleRules.push(r.selectorText);
      // also scan grouping rules' inner selectors
      if (r.cssRules) for (const ir of Array.from(r.cssRules)) { if (ir.selectorText && /(^|[\s,>+~])\.dss-/.test(ir.selectorText)) dssStyleRules.push(ir.selectorText); }
    }
  }
  const classAttrs = Array.from(document.querySelectorAll('[class]')).map((e) => e.getAttribute('class')).join(' ');
  const globalPopper = document.querySelectorAll('.el-popper').length;
  return {
    route: location.pathname,
    hasDssElement: dssEls.length > 0,
    dssElementClasses: [...new Set(dssEls)],
    dssClassAttrMention: /(^|\s)dss-/.test(classAttrs),
    dssStyleRuleCount: dssStyleRules.length,
    dssStyleRulesSample: [...new Set(dssStyleRules)].slice(0, 20),
    elPopperCount: globalPopper,
    hasDssPage: !!document.querySelector('.dss-page'),
    hasDssTable: !!document.querySelector('.dss-table'),
    dssVarDefined: Array.from(document.styleSheets).some((s) => { try { return Array.from(s.cssRules || []).some((r) => r.cssText && r.cssText.includes('--dss-')); } catch (e) { return false; } }),
  };
};

async function leakScan(routes) {
  const out = { routes: [], global: { consoleErrors: [], nonGet: [] } };
  for (const r of routes) {
    const { browser, page, ctx, log } = await lib.launch(VIEWPORTS[2]);
    await page.goto(lib.BASE + r, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(900);
    out.routes.push(await page.evaluate(LEAK_FN));
    out.global.consoleErrors.push(...log.consoleErrors.map((c) => `${r}: ${c}`));
    out.global.nonGet.push(...log.requests.filter((q) => !['GET', 'HEAD'].includes(q.method)).map((q) => `${r}: ${q.method} ${q.url}`));
    await ctx.close();
    await browser.close();
  }
  return out;
}

async function main() {
  const shots = await structureShots();
  writeJson('structure.json', shots);
  console.log('structure.json viewports=' + shots.viewports.length + ' consoleErrors=' + shots.global.consoleErrors.length + ' nonGet=' + shots.global.nonGet.length);

  const leak = await leakScan(['/large-screen', '/config/data-source', '/monitor/cdc-node', '/config/client']);
  writeJson('leak.json', leak);
  console.log('leak.json routes=' + leak.routes.length + ' leaked=' + leak.routes.filter((x) => x.hasDssElement || x.dssStyleRuleCount > 0 || x.dssClassAttrMention).map((x) => x.route).join(',') + ' consoleErrors=' + leak.global.consoleErrors.length);

}
main().catch((e) => { console.error(e); process.exit(1); });
