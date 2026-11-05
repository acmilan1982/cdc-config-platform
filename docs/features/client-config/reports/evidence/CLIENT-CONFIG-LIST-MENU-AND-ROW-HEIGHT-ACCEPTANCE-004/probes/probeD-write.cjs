/**
 * 004 write-gated probe: Group B (071/072/083/084/102/103/117) + Group C highlight branches (153).
 * Real UI on synthetic CCFG004-* objects only. Gate counts every non-GET attempt.
 * Raw output stays outside the repo; committed extracts are desensitized.
 */
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core');
const fs = require('fs');

const FRONT = 'http://127.0.0.1:5173';
const BACK = 'http://127.0.0.1:8080';
const PAGE_URL = FRONT + "/config/client";
const OUT = '/tmp/004/write-raw.json';

const R = {
  task: 'CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004',
  mode: 'write-gated-live',
  gate: { nonGetAttempts: 0, blocked: [], forwarded: [], injected: [] },
  counts: {},
  direct: [],
  flows: {},
  errors: [],
};

function pathOf(u) { try { return new globalThis.URL(u).pathname; } catch (e) { return u; } }
function bump(k) { R.counts[k] = (R.counts[k] || 0) + 1; }

(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => R.errors.push(String(e)));

  // Delay / injection policy keyed by method + path + optional clientId.
  const delays = [
    { method: 'POST', path: '/api/clients', clientId: 'CCFG004-NEW1', ms: 1500 },
    { method: 'PUT', path: '/api/clients/CCFG004-NEW1', ms: 1200 },
    { method: 'PUT', path: '/api/clients/CCFG004-ON/disable', ms: 1500 },
    { method: 'PUT', path: '/api/clients/CCFG004-OFF/enable', ms: 1500 },
    { method: 'DELETE', path: '/api/clients/CCFG004-DEL', ms: 1500 },
    { method: 'DELETE', path: '/api/clients/CCFG004-NEW1', ms: 1000 },
  ];
  const aborts = [
    { method: 'DELETE', path: '/api/clients/CCFG004-DEL2', ms: 900 },
    { method: 'PUT', path: '/api/clients/CCFG004-OFF2/enable', ms: 900 },
  ];

  function planned(method, path, body) {
    if (method === 'POST' && path === '/api/clients') return !!body && /^CCFG004-/.test(String(body.clientId || ''));
    if (method === 'PUT' && /^\/api\/clients\/CCFG004-[^/]+(\/enable|\/disable)?$/.test(path)) return true;
    if (method === 'DELETE' && /^\/api\/clients\/CCFG004-[^/]+$/.test(path)) return true;
    return false;
  }

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') { await route.continue(); return; }
    R.gate.nonGetAttempts += 1;
    const path = pathOf(req.url());
    let body = null;
    try { body = req.postDataJSON(); } catch (e) {}
    const clientId = body && body.clientId ? body.clientId : (path.match(/^\/api\/clients\/([^/]+)/) || [])[1] || null;
    const rec = { method, path, clientId };
    if (!planned(method, path, body)) {
      R.gate.blocked.push(rec); bump('pageBlocked'); await route.abort('blockedbyclient'); return;
    }
    const injection = aborts.find((a) => a.method === method && a.path === path);
    if (injection) {
      R.gate.injected.push(rec); bump('injected:' + method + ' ' + path);
      await new Promise((r) => setTimeout(r, injection.ms));
      await route.abort('failed');
      return;
    }
    const delay = delays.find((d) => d.method === method && d.path === path && (!d.clientId || d.clientId === clientId));
    R.gate.forwarded.push(rec); bump('forwarded:' + method + ' ' + path);
    if (delay) await new Promise((r) => setTimeout(r, delay.ms));
    await route.continue();
  });

  // ---------------- UI helpers ----------------
  async function listIds() {
    return (await page.$$eval('.lt-main-table tbody tr.el-table__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim())));
  }
  async function rowHandle(id) {
    const rows = page.locator('.lt-main-table tbody tr.el-table__row');
    const n = await rows.count();
    for (let i = 0; i < n; i++) {
      const t = (await rows.nth(i).locator('.cc-id').innerText().catch(() => '')).trim();
      if (t === id) { await rows.nth(i).scrollIntoViewIfNeeded(); return rows.nth(i); }
    }
    throw new Error('row not found: ' + id);
  }
  async function fixedIds() {
    return (await page.$$eval('.lt-main-table tbody tr.el-table__row.lt-row-highlight__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim())));
  }
  async function selectRow(id) {
    const row = await rowHandle(id);
    const cls = (await row.getAttribute('class')) || '';
    if (!cls.includes('lt-row-highlight__row')) { await row.locator('td').first().click(); await page.waitForTimeout(320); }
    return fixedIds();
  }
  async function openMenu(id) {
    await page.locator('.cc-more-popper:visible').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    const row = await rowHandle(id);
    await row.locator('.cc-more-link').click();
    const poppers = page.locator('.cc-more-popper:visible').filter({ has: page.locator('.el-dropdown-menu__item') });
    await poppers.first().waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(300);
    return poppers.first();
  }
  async function menuInfo(popper) {
    return await popper.locator('li').evaluateAll((lis) => lis.map((li) => ({
      role: li.getAttribute('role'),
      cls: li.className,
      text: (li.textContent || '').trim(),
      ariaDisabled: li.getAttribute('aria-disabled'),
      tabIndex: li.tabIndex,
      fontWeight: getComputedStyle(li).fontWeight,
      color: getComputedStyle(li).color,
      cursor: getComputedStyle(li).cursor,
      opacity: getComputedStyle(li).opacity,
    })));
  }
  async function clickMenu(text) {
    const popper = page.locator('.cc-more-popper:visible').filter({ has: page.locator('.el-dropdown-menu__item') }).first();
    await popper.locator('.el-dropdown-menu__item:visible', { hasText: text }).first().click();
  }
  async function closePopper() {
    await page.keyboard.press('Escape').catch(() => {});
    await page.locator('.cc-more-popper:visible').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }
  function boxSel(cls) { return cls ? '.el-message-box.' + cls : '.el-message-box'; }
  async function confirmBox(cls) {
    const box = page.locator(boxSel(cls));
    await box.waitFor({ state: 'visible', timeout: 6000 });
    return {
      title: (await box.locator('.el-message-box__title').innerText()).trim(),
      body: (await box.locator('.el-message-box__message').innerText()).trim(),
      buttons: (await box.locator('.el-message-box__btns button').allInnerTexts()).map((s) => s.trim()).filter(Boolean),
    };
  }
  async function confirmClick(cls, text) {
    const btn = page.locator(boxSel(cls) + ' .el-message-box__btns button', { hasText: text });
    await btn.click();
    await btn.click({ timeout: 800 }).catch(() => {});
    await page.evaluate((arg) => {
      const sel = arg.cls ? '.el-message-box.' + arg.cls : '.el-message-box';
      const b = Array.from(document.querySelectorAll(sel + ' .el-message-box__btns button')).find((e) => (e.textContent || '').includes(arg.text));
      if (b) b.click();
    }, { cls, text }).catch(() => {});
  }
  async function cancelBox(cls) {
    await page.locator(boxSel(cls) + ' .el-message-box__btns button', { hasText: '取消' }).click();
    await page.locator(boxSel(cls)).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  async function messages() {
    return (await page.$$eval('.el-message', (els) => els.map((e) => (e.textContent || '').trim()))).filter(Boolean);
  }
  async function waitListReload() {
    await page.waitForFunction(() => {
      const m = document.querySelector('.el-loading-mask');
      return !m || getComputedStyle(m).display === 'none';
    }, null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);
    try { await page.waitForFunction(() => document.querySelectorAll('.lt-main-table tbody tr.el-table__row').length > 0, null, { timeout: 10000 }); } catch (e) {}
  }
  async function dialogOpen() {
    return await page.evaluate(() => {
      const ov = document.querySelector('.el-overlay');
      return !!ov && getComputedStyle(ov).display !== 'none' && ov.getBoundingClientRect().height > 0;
    });
  }
  async function openCreate() {
    await page.getByRole('button', { name: '新增探针' }).click();
    await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForTimeout(500);
  }
  async function setId(id) {
    const toggle = page.locator('.el-dialog.cc-dialog .cc-id-toggle');
    if ((await toggle.count()) > 0 && (await toggle.first().isVisible()) && (await toggle.first().innerText()).includes('修改探针 ID')) await toggle.first().click();
    await page.locator('.el-dialog.cc-dialog .cc-id-control input').fill(id);
  }
  async function setDesc(text) { await page.locator('.el-dialog.cc-dialog .cc-desc-row textarea').fill(text); }
  async function chooseSource(dsId) {
    const opt = page.locator('.cc-opt').filter({ hasText: dsId }).first();
    await opt.waitFor({ state: 'visible', timeout: 8000 });
    await opt.scrollIntoViewIfNeeded().catch(() => {});
    await opt.click();
    await page.waitForTimeout(200);
  }
  async function submitButtonState() {
    return await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').evaluate((el) => ({
      disabled: el.disabled,
      cls: el.className,
      text: (el.textContent || '').trim(),
      spinnerCount: el.querySelectorAll('.el-icon.is-loading, .is-loading, .el-loading-spinner').length,
    }));
  }
  async function dispatchSubmitAgain() {
    await page.evaluate(() => {
      const b = document.querySelector('.el-dialog.cc-dialog .cc-dialog-submit');
      if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  }
  async function cancelDialog() {
    await page.locator('.el-dialog.cc-dialog .el-dialog__footer button', { hasText: '取消' }).click();
    await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
  async function fetchRow(id) {
    const r = await fetch(BACK + '/api/clients?status=ALL');
    const j = await r.json();
    return (j.data.items || []).find((x) => x.clientId === id) || null;
  }
  async function pageWaitWrite(method, path) {
    return page.waitForResponse((r) => r.request().method() === method && pathOf(r.url()) === path, { timeout: 20000 }).catch(() => null);
  }

  // ---------------- start ----------------
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.lt-main-table tbody tr.el-table__row').length > 0, null, { timeout: 20000 });
  await page.waitForTimeout(700);
  R.flows.baseline = { rows: (await listIds()).length, fixed: await fixedIds() };

  // ===== 072a: real 40940 via UI create duplicate ID =====
  await openCreate();
  await setId('CCFG004-ON');
  await setDesc('CCFG004 synthetic duplicate-id conflict attempt. Not a real runtime probe.');
  await chooseSource('CCFG004-DS-B');
  const p40940 = pageWaitWrite('POST', '/api/clients');
  await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click();
  const r40940 = await p40940;
  let j40940 = null; try { j40940 = await r40940.json(); } catch (e) {}
  await page.waitForTimeout(600);
  R.flows.ac072_40940 = {
    http: r40940 ? r40940.status() : null,
    code: j40940 ? j40940.code : null,
    message: j40940 ? j40940.message : null,
    dialogStillOpen: await page.locator('.el-dialog.cc-dialog').isVisible().catch(() => false),
    fieldErrors: await page.$$eval('.el-dialog.cc-dialog .ced-field-error, .el-dialog.cc-dialog .cc-field-error', (els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean)),
    backendRowCount: (await (await fetch(BACK + '/api/clients?status=ALL')).json()).data.items.length,
    baselineRowCount: R.flows.baseline.rows,
  };
  await cancelDialog();

  // ===== 072b: real 40941 via UI race (holder created after options loaded) =====
  await openCreate();
  await setId('CCFG004-VICTIM');
  await setDesc('CCFG004 synthetic source-duplicate conflict attempt. Not a real runtime probe.');
  await chooseSource('CCFG004-DS-A');
  const holderResp = await fetch(BACK + '/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: 'CCFG004-HOLDER', clientDesc: 'CCFG004 synthetic 40941 holder fixture. Not a real runtime probe.', dataSourceIds: ['CCFG004-DS-A'] }),
  });
  const holderJson = await holderResp.json();
  R.direct.push({ method: 'POST', path: '/api/clients', clientId: 'CCFG004-HOLDER', dataSourceIds: ['CCFG004-DS-A'], http: holderResp.status, code: holderJson.code });
  const p40941 = pageWaitWrite('POST', '/api/clients');
  await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click();
  const r40941 = await p40941;
  let j40941 = null; try { j40941 = await r40941.json(); } catch (e) {}
  await page.waitForTimeout(700);
  R.flows.ac072_40941 = {
    http: r40941 ? r40941.status() : null,
    code: j40941 ? j40941.code : null,
    message: j40941 ? j40941.message : null,
    containsOrg: !!(j40941 && j40941.message && j40941.message.includes('CCFG004 Synthetic Org A')),
    containsSourceId: !!(j40941 && j40941.message && j40941.message.includes('CCFG004-DS-A')),
    containsHolderId: !!(j40941 && j40941.message && j40941.message.includes('CCFG004-HOLDER')),
    fieldErrors: await page.$$eval('.el-dialog.cc-dialog .ced-field-error, .el-dialog.cc-dialog .cc-field-error', (els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean)),
    toast: await messages(),
    victimCreated: !!(await fetchRow('CCFG004-VICTIM')),
  };
  await cancelDialog();

  // ===== 071 create: slow + duplicate click + success =====
  console.log('STEP create');
  await openCreate();
  await setId('CCFG004-NEW1');
  await setDesc('CCFG004 synthetic create-success sample through the real UI. Not a real runtime probe.');
  await chooseSource('CCFG004-DS-B');
  const chosenCount = await page.locator('.el-dialog.cc-dialog .cc-chosen-list .el-tag').count();
  const pCreate = pageWaitWrite('POST', '/api/clients');
  await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click();
  await page.waitForTimeout(250);
  const createPending = await submitButtonState();
  await dispatchSubmitAgain();
  const rCreate = await pCreate;
  if (!rCreate) {
    R.flows.ac071_create_noResponse = {
      chosenCount,
      dialogVisible: await page.locator('.el-dialog.cc-dialog').isVisible().catch(() => false),
      fieldErrors: await page.$$eval('.el-dialog.cc-dialog .ced-field-error, .el-dialog.cc-dialog .cc-field-error', (els) => els.map((e) => (e.textContent || '').trim())),
      idValue: await page.locator('.el-dialog.cc-dialog .cc-id-control input').inputValue().catch(() => null),
    };
  }
  let jCreate = null; try { jCreate = await rCreate.json(); } catch (e) {}
  await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 12000 }).catch(() => {});
  await waitListReload();
  const createdRow = await fetchRow('CCFG004-NEW1');
  R.flows.ac071_create = {
    pendingButton: createPending,
    duplicateSubmitDispatched: true,
    writeCountForNew1: R.gate.forwarded.filter((x) => x.method === 'POST' && x.path === '/api/clients' && x.clientId === 'CCFG004-NEW1').length,
    http: rCreate ? rCreate.status() : null,
    code: jCreate ? jCreate.code : null,
    toast: await messages(),
    dialogClosed: !(await page.locator('.el-dialog.cc-dialog').isVisible().catch(() => false)),
    row: createdRow ? { present: true, fgActive: createdRow.fgActive, sources: (createdRow.dataSources || []).map((d) => d.dataSourceId) } : { present: false },
  };

  // ===== 071 edit: slow + duplicate click + success =====
  const newDesc = 'CCFG004 synthetic edit-success sample through the real UI (updated). Not a real runtime probe.';
  {
    const row = await rowHandle('CCFG004-NEW1');
    await row.dblclick();
    await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForTimeout(400);
    await setDesc(newDesc);
    const pEdit = pageWaitWrite('PUT', '/api/clients/CCFG004-NEW1');
    await page.locator('.el-dialog.cc-dialog .cc-dialog-submit').click();
    await page.waitForTimeout(200);
    const editPending = await submitButtonState();
    await dispatchSubmitAgain();
    const rEdit = await pEdit;
    let jEdit = null; try { jEdit = await rEdit.json(); } catch (e) {}
    await page.locator('.el-dialog.cc-dialog').waitFor({ state: 'hidden', timeout: 12000 }).catch(() => {});
    await waitListReload();
    const edited = await fetchRow('CCFG004-NEW1');
    R.flows.ac071_edit = {
      pendingButton: editPending,
      writeCount: R.counts['forwarded:PUT /api/clients/CCFG004-NEW1'] || 0,
      http: rEdit ? rEdit.status() : null,
      code: jEdit ? jEdit.code : null,
      toast: await messages(),
      descPersisted: !!edited && edited.clientDesc === newDesc,
    };
  }

  // ===== 071/084/102/153 disable: cancel, slow confirm, busy menu, success, reselect =====
  await selectRow('CCFG004-ON');
  const onSelBefore = await fixedIds();
  {
    await openMenu('CCFG004-ON');
    const items = await menuInfo(page.locator('.cc-more-popper:visible').filter({ has: page.locator('.el-dropdown-menu__item') }).first());
    await clickMenu('停用');
    const box = await confirmBox('cc-confirm--disable');
    const beforeCancel = R.counts['forwarded:PUT /api/clients/CCFG004-ON/disable'] || 0;
    await cancelBox('cc-confirm--disable');
    await page.waitForTimeout(400);
    const onAfterCancel = await fetchRow('CCFG004-ON');
    R.flows.ac084_disable_cancel = {
      menuItems: items.filter((i) => i.role === 'menuitem').map((i) => i.text),
      confirm: box,
      writesDelta: (R.counts['forwarded:PUT /api/clients/CCFG004-ON/disable'] || 0) - beforeCancel,
      fgAfter: onAfterCancel ? onAfterCancel.fgActive : null,
      selectionAfter: await fixedIds(),
    };
  }
  {
    await openMenu('CCFG004-ON');
    await clickMenu('停用');
    await confirmBox('cc-confirm--disable');
    const pDisable = pageWaitWrite('PUT', '/api/clients/CCFG004-ON/disable');
    await confirmClick('cc-confirm--disable', '停用');
    await page.waitForTimeout(350);
    const busyMenuSame = await menuInfo(await openMenu('CCFG004-ON'));
    await closePopper();
    const busyMenuOther = await menuInfo(await openMenu('CCFG004-DEL2'));
    await closePopper();
    const rDisable = await pDisable;
    let jDisable = null; try { jDisable = await rDisable.json(); } catch (e) {}
    await waitListReload();
    const onRow = await fetchRow('CCFG004-ON');
    const onHandle = await rowHandle('CCFG004-ON');
    R.flows.ac071_disable = {
      http: rDisable ? rDisable.status() : null,
      code: jDisable ? jDisable.code : null,
      writeCount: R.counts['forwarded:PUT /api/clients/CCFG004-ON/disable'] || 0,
      busyMenuSameRow: busyMenuSame,
      busyMenuOtherRow: busyMenuOther,
      toast: await messages(),
      fgAfter: onRow ? onRow.fgActive : null,
      inactiveMark: (await onHandle.locator('.cc-inactive-mark').innerText().catch(() => '')).trim() || null,
      selectionBefore: onSelBefore,
      selectionAfter: await fixedIds(),
      dialogOpenedByMenu: await dialogOpen(),
    };
  }

  // ===== 071 enable: slow + duplicate + success + reselect =====
  await selectRow('CCFG004-OFF');
  {
    await openMenu('CCFG004-OFF');
    const items = await menuInfo(page.locator('.cc-more-popper:visible').filter({ has: page.locator('.el-dropdown-menu__item') }).first());
    await clickMenu('启用');
    const box = await confirmBox('cc-confirm--enable');
    const pEnable = pageWaitWrite('PUT', '/api/clients/CCFG004-OFF/enable');
    await confirmClick('cc-confirm--enable', '启用');
    await page.waitForTimeout(300);
    const busyMenu = await menuInfo(await openMenu('CCFG004-OFF'));
    await closePopper();
    const rEnable = await pEnable;
    let jEnable = null; try { jEnable = await rEnable.json(); } catch (e) {}
    await waitListReload();
    const offRow = await fetchRow('CCFG004-OFF');
    const offHandle = await rowHandle('CCFG004-OFF');
    R.flows.ac071_enable = {
      menuItems: items.filter((i) => i.role === 'menuitem').map((i) => i.text),
      confirm: box,
      http: rEnable ? rEnable.status() : null,
      code: jEnable ? jEnable.code : null,
      writeCount: R.counts['forwarded:PUT /api/clients/CCFG004-OFF/enable'] || 0,
      busyMenuSameRow: busyMenu,
      toast: await messages(),
      fgAfter: offRow ? offRow.fgActive : null,
      inactiveMarkCount: await offHandle.locator('.cc-inactive-mark').count(),
      selectionAfter: await fixedIds(),
    };
  }

  // ===== 071/117 delete: cancel, slow confirm+duplicate, success, clear =====
  await selectRow('CCFG004-DEL');
  {
    await openMenu('CCFG004-DEL');
    await clickMenu('删除');
    const box = await confirmBox('');
    const beforeCancel = R.counts['forwarded:DELETE /api/clients/CCFG004-DEL'] || 0;
    await cancelBox('');
    await page.waitForTimeout(400);
    R.flows.ac071_delete_cancel = {
      confirm: box,
      writesDelta: (R.counts['forwarded:DELETE /api/clients/CCFG004-DEL'] || 0) - beforeCancel,
      rowPresent: !!(await fetchRow('CCFG004-DEL')),
      selectionAfter: await fixedIds(),
    };
    await openMenu('CCFG004-DEL');
    await clickMenu('删除');
    await confirmBox('');
    const pDel = pageWaitWrite('DELETE', '/api/clients/CCFG004-DEL');
    await confirmClick('', '删除');
    const rDel = await pDel;
    let jDel = null; try { jDel = await rDel.json(); } catch (e) {}
    await waitListReload();
    R.flows.ac071_delete = {
      http: rDel ? rDel.status() : null,
      code: jDel ? jDel.code : null,
      writeCount: R.counts['forwarded:DELETE /api/clients/CCFG004-DEL'] || 0,
      toast: await messages(),
      rowPresent: !!(await fetchRow('CCFG004-DEL')),
      selectionAfter: await fixedIds(),
    };
  }

  // ===== 084/153 delete failure: busy reset, failure feedback, selection retained =====
  await selectRow('CCFG004-DEL2');
  {
    await openMenu('CCFG004-DEL2');
    await clickMenu('删除');
    await confirmBox('');
    const pFail = pageWaitWrite('DELETE', '/api/clients/CCFG004-DEL2');
    await confirmClick('', '删除');
    await page.waitForTimeout(250);
    const busyMenu = await menuInfo(await openMenu('CCFG004-DEL2'));
    await closePopper();
    await pFail;
    await waitListReload();
    const del2 = await fetchRow('CCFG004-DEL2');
    await page.waitForTimeout(300);
    const resetMenu = await menuInfo(await openMenu('CCFG004-DEL2'));
    await closePopper();
    R.flows.ac084_delete_failure = {
      injected: true,
      toast: await messages(),
      rowPresent: !!del2,
      fgAfter: del2 ? del2.fgActive : null,
      selectionAfter: await fixedIds(),
      busyMenu: busyMenu,
      menuAfterBusy: resetMenu,
      otherRowsUnaffected: (await listIds()).length,
    };
  }

  // ===== 084/153 enable failure (network) =====
  await selectRow('CCFG004-OFF2');
  {
    await openMenu('CCFG004-OFF2');
    await clickMenu('启用');
    await confirmBox('cc-confirm--enable');
    const pFail = pageWaitWrite('PUT', '/api/clients/CCFG004-OFF2/enable');
    await confirmClick('cc-confirm--enable', '启用');
    await pFail;
    await waitListReload();
    const off2 = await fetchRow('CCFG004-OFF2');
    await page.waitForTimeout(400);
    const resetMenu = await menuInfo(await openMenu('CCFG004-OFF2'));
    await closePopper();
    R.flows.ac084_enable_failure = {
      injected: true,
      toast: await messages(),
      fgAfter: off2 ? off2.fgActive : null,
      selectionAfter: await fixedIds(),
      menuAfterBusy: resetMenu,
    };
  }

  // ===== 083 abnormal row: menu only 停用/删除, real disable -> FG 0 =====
  {
    const popper = await openMenu('CCFG004-ABN');
    const items = await menuInfo(popper);
    const menuTexts = items.filter((i) => i.role === 'menuitem').map((i) => i.text);
    await clickMenu('停用');
    const box = await confirmBox('cc-confirm--disable');
    const pDis = pageWaitWrite('PUT', '/api/clients/CCFG004-ABN/disable');
    await page.locator('.el-message-box.cc-confirm--disable .el-message-box__btns button', { hasText: '停用' }).click();
    const rDis = await pDis;
    let jDis = null; try { jDis = await rDis.json(); } catch (e) {}
    await waitListReload();
    const abn = await fetchRow('CCFG004-ABN');
    const abnHandle = await rowHandle('CCFG004-ABN');
    R.flows.ac083 = {
      menuItems: menuTexts,
      hasEnable: menuTexts.includes('启用'),
      confirm: box,
      disableHttp: rDis ? rDis.status() : null,
      disableCode: jDis ? jDis.code : null,
      fgAfter: abn ? abn.fgActive : null,
      inactiveMark: (await abnHandle.locator('.cc-inactive-mark').innerText().catch(() => '')).trim() || null,
      toast: await messages(),
    };
  }

  // ===== 153 toggle-success filtered-out: disable NEW1 under status=ENABLED -> clear =====
  {
    await page.selectOption('.cc-q-status select', { label: '启用' }).catch(async () => {
      await page.click('.cc-q-status');
      await page.waitForTimeout(250);
      await page.locator('.el-select-dropdown__item', { hasText: '启用' }).first().click();
    });
    await page.click('.ql-actions__query');
    await waitListReload();
    const visible = await listIds();
    await selectRow('CCFG004-NEW1');
    const selBefore = await fixedIds();
    await openMenu('CCFG004-NEW1');
    await clickMenu('停用');
    await confirmBox('cc-confirm--disable');
    const pDis = pageWaitWrite('PUT', '/api/clients/CCFG004-NEW1/disable');
    await page.locator('.el-message-box.cc-confirm--disable .el-message-box__btns button', { hasText: '停用' }).click();
    const rDis = await pDis;
    let jDis = null; try { jDis = await rDis.json(); } catch (e) {}
    await waitListReload();
    R.flows.ac153_filteredOut = {
      filteredVisibleBefore: visible.includes('CCFG004-NEW1'),
      selectionBefore: selBefore,
      disableHttp: rDis ? rDis.status() : null,
      disableCode: jDis ? jDis.code : null,
      new1VisibleAfter: (await listIds()).includes('CCFG004-NEW1'),
      selectionAfter: await fixedIds(),
      toast: await messages(),
    };
    // restore ALL
    await page.selectOption('.cc-q-status select', { label: '全部' }).catch(async () => {
      await page.click('.cc-q-status');
      await page.waitForTimeout(250);
      await page.locator('.el-select-dropdown__item', { hasText: '全部' }).first().click();
    });
    await page.click('.ql-actions__query');
    await waitListReload();
  }

  // ===== 103 trigger isolation (re-check on live write page) =====
  {
    const before = await fixedIds();
    const row = await rowHandle('CCFG004-DEL2');
    await row.locator('.cc-more-link').click();
    await page.waitForTimeout(300);
    const dlgAfterSingle = await page.locator('.el-dialog.cc-dialog').isVisible().catch(() => false);
    await closePopper();
    const row2 = await rowHandle('CCFG004-DEL2');
    await row2.locator('.cc-more-link').dblclick();
    await page.waitForTimeout(350);
    const dlgAfterDbl = await page.locator('.el-dialog.cc-dialog').isVisible().catch(() => false);
    await closePopper();
    R.flows.ac103_isolation = { dialogAfterSingleTrigger: dlgAfterSingle, dialogAfterDblTrigger: dlgAfterDbl, selectionBefore: before, selectionAfter: await fixedIds() };
  }

  R.final = {
    rows: (await listIds()).length,
    fixed: await fixedIds(),
    counts: R.counts,
    gate: R.gate,
    direct: R.direct,
  };
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
  console.log('WROTE', OUT);
  console.log(JSON.stringify({ flows: R.flows, counts: R.counts, gate: R.gate, direct: R.direct, errors: R.errors }, null, 1));
  await browser.close();
})().catch((e) => {
  console.error('FATAL', e);
  try { fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); console.error('PARTIAL', OUT); } catch (e2) { console.error('PARTIAL WRITE FAILED', e2); }
  process.exit(1);
});
