// R1 AC-057 probe: disable an occupying client, prove it still occupies, then release by edit.
const { openPage } = require('./probe-lib.cjs');
const fs = require('fs');

const A = 'S2AC-R1A';
const B = 'S2AC-R1B';
const S = 'S2AC-R1S1';
const R = 'S2AC-R1R1';
const out = { task: 'CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1', ac: 'CCFG-AC-057', executedAt: new Date().toISOString(), ids: { A, B, S, R } };
let browser;
let page;

async function api(path, opts) {
  return await page.evaluate(async ({ path, opts }) => {
    const res = await fetch('http://127.0.0.1:8080' + path, opts || {});
    let json = null;
    try { json = await res.json(); } catch (e) { json = null; }
    return { status: res.status, json };
  }, { path, opts });
}
function jsonBody(body) { return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }
function putBody(body) { return { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }
async function clientRow(id) {
  const list = await api('/api/clients?status=ALL');
  const items = (list.json && list.json.data && list.json.data.items) || [];
  return { status: list.status, row: items.find((r) => r.clientId === id) || null };
}
async function candidateState(id) {
  return await page.evaluate(async (id) => {
    const res = await fetch('http://127.0.0.1:8080/api/clients/data-source-options');
    const json = await res.json();
    const o = (json.data || []).find((x) => x.dataSourceId === id) || null;
    return o ? { dataSourceId: o.dataSourceId, selectable: o.selectable, notSelectableReason: o.notSelectableReason || null, occupiedByClientIds: o.occupiedByClientIds || [] } : null;
  }, id);
}

(async () => {
  try {
    const opened = await openPage({ width: 1440, height: 900 });
    browser = opened.browser; page = opened.page;

    out.precondition = {
      s: await candidateState(S),
      r: await candidateState(R),
      aRowBefore: await clientRow(A),
      bRowBefore: await clientRow(B),
    };

    // 1. Create A through the real create API; it starts FG_ACTIVE='1' and holds S+R.
    out.createA = await api('/api/clients', jsonBody({ clientId: A, clientDesc: 'S2AC R1 AC-057 holder A', dataSourceIds: [S, R] }));
    out.aAfterCreate = await clientRow(A);

    // 2. Disable A through the real disable business API.
    out.disableA = await api('/api/clients/' + A + '/disable', { method: 'PUT' });
    out.aAfterDisable = await clientRow(A);
    out.sCandidateWhileDisabled = await candidateState(S);

    // 3. New client B tries to take S while disabled A still holds it.
    out.createBBlocked = await api('/api/clients', jsonBody({ clientId: B, clientDesc: 'S2AC R1 AC-057 probe B', dataSourceIds: [S] }));
    out.bAfterBlocked = await clientRow(B);

    // 4. Real edit path: remove S from A, keep R.
    out.editARemoveS = await api('/api/clients/' + A, putBody({ clientId: A, clientDesc: 'S2AC R1 AC-057 holder A', dataSourceIds: [R] }));
    out.aAfterEdit = await clientRow(A);

    // 5. B now takes S.
    out.createB = await api('/api/clients', jsonBody({ clientId: B, clientDesc: 'S2AC R1 AC-057 probe B', dataSourceIds: [S] }));
    out.bAfterCreate = await clientRow(B);
    out.aFinal = await clientRow(A);
    out.sCandidateFinal = await candidateState(S);
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    fs.writeFileSync(__dirname + '/../results/ac057-r1-results.json', JSON.stringify(out, null, 2));
    if (browser) await browser.close();
  }
  console.log(JSON.stringify({
    ok: !out.error, error: out.error || null,
    precondition: out.precondition,
    createA: out.createA,
    aAfterCreate: out.aAfterCreate && out.aAfterCreate.row,
    disableA: out.disableA,
    aAfterDisable: out.aAfterDisable && out.aAfterDisable.row,
    sCandidateWhileDisabled: out.sCandidateWhileDisabled,
    createBBlocked: out.createBBlocked,
    bAfterBlocked: out.bAfterBlocked && out.bAfterBlocked.row,
    editARemoveS: out.editARemoveS,
    aAfterEdit: out.aAfterEdit && out.aAfterEdit.row,
    createB: out.createB,
    bAfterCreate: out.bAfterCreate && out.bAfterCreate.row,
    aFinal: out.aFinal && out.aFinal.row,
    sCandidateFinal: out.sCandidateFinal,
  }, null, 2));
})();
