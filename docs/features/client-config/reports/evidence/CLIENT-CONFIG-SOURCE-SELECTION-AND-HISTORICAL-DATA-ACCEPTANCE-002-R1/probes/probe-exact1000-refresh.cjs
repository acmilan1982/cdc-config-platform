// R1 AC-034 success leg refresh: re-save the persisted exactly-1000-byte payload through the real edit API.
const fs = require('fs');
const API = 'http://127.0.0.1:8080';
const out = { task: 'CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1', ac: 'CCFG-AC-034', leg: 'exact1000-refresh', executedAt: new Date().toISOString() };

(async () => {
  try {
    const list = await (await fetch(API + '/api/clients?status=ALL')).json();
    const row = (list.data.items || []).find((r) => r.clientId === 'S2AC-PCAP');
    out.before = row ? { clientId: row.clientId, fgActive: row.fgActive, rawDataSourceIdsBytes: Buffer.byteLength(row.rawDataSourceIds, 'utf8'), dataSourceCount: row.dataSourceCount } : null;
    if (!row) throw new Error('S2AC-PCAP row missing');
    const ids = row.rawDataSourceIds.split(',');
    out.request = { clientId: 'S2AC-PCAP', clientDesc: row.clientDesc, dataSourceIds: ids, serializedBytes: Buffer.byteLength(ids.join(','), 'utf8') };
    const res = await fetch(API + '/api/clients/S2AC-PCAP', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: 'S2AC-PCAP', clientDesc: row.clientDesc, dataSourceIds: ids }) });
    out.response = { httpStatus: res.status, json: await res.json().catch(() => null) };
    const list2 = await (await fetch(API + '/api/clients?status=ALL')).json();
    const row2 = (list2.data.items || []).find((r) => r.clientId === 'S2AC-PCAP');
    out.after = row2 ? { fgActive: row2.fgActive, rawDataSourceIdsBytes: Buffer.byteLength(row2.rawDataSourceIds, 'utf8'), dataSourceCount: row2.dataSourceCount, samePayload: row2.rawDataSourceIds === row.rawDataSourceIds } : null;
  } catch (e) {
    out.error = String(e && e.stack ? e.stack : e);
  } finally {
    fs.writeFileSync(__dirname + '/../results/ac034-exact1000-refresh.json', JSON.stringify(out, null, 2));
  }
  console.log(JSON.stringify(out, null, 2));
})();
