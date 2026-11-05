const fs = require('fs');
const http = require('http');

const OUT = process.argv[2] || '/tmp/s3ac/evidence/raw/concurrency.json';
const HOST = '127.0.0.1';
const PORT = 8080;

function row(source) { return { dataSourceIds: [source] }; }
function body(clientId, desc, source) { return { clientId, clientDesc: desc, dataSourceIds: [source] }; }

function fire(gate, method, path, jsonBody, label) {
  return new Promise((resolve, reject) => {
    const payload = jsonBody === null || jsonBody === undefined ? null : JSON.stringify(jsonBody);
    const headers = { 'Accept': 'application/json' };
    if (payload !== null) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(payload); }
    const tCreate = Date.now();
    const req = http.request({ host: HOST, port: PORT, path, method, headers, agent: false }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { data += d; });
      res.on('end', () => resolve({ label, method, path, tCreate, tSend: req.__tSend, tResp: Date.now(), status: res.statusCode, body: data }));
    });
    req.on('error', (e) => reject(Object.assign(e, { label, method, path })));
    req.__tSend = null;
    gate.then(() => {
      req.__tSend = Date.now();
      if (payload === null) req.end(); else req.end(payload);
    });
  });
}

async function pair(label, specs) {
  const gate = new Promise((r) => setImmediate(r));
  const results = await Promise.all(specs.map((s) => fire(gate, s.method, s.path, s.body, s.label)));
  await new Promise((r) => setTimeout(r, 500));
  const list = (await (await fetch('http://127.0.0.1:8080/api/clients?status=ALL')).json()).data.items;
  return { scenario: label, requests: results, listAfter: list };
}

function summarize(list, ids) {
  return ids.map((id) => list.find((r) => r.clientId === id) || null);
}

(async () => {
  const result = { ac: ['CCFG-AC-064', 'CCFG-AC-030'], method: 'two independent http.request sockets, body buffered, both .end() released from a single setImmediate gate; no server-side synchronization, no artificial locks', scenarios: {}, errors: [] };
  try {
    result.scenarios.insertInsert = await pair('insert×insert', [
      { label: 'A', method: 'POST', path: '/api/clients', body: body('S3AC-C064-II-A', 'S3AC AC-064 insert/insert A (synthetic)', 'S3AC-S064-II') },
      { label: 'B', method: 'POST', path: '/api/clients', body: body('S3AC-C064-II-B', 'S3AC AC-064 insert/insert B (synthetic)', 'S3AC-S064-II') },
    ]);
    result.scenarios.insertInsert.rows = summarize(result.scenarios.insertInsert.listAfter, ['S3AC-C064-II-A', 'S3AC-C064-II-B']);

    result.scenarios.editEdit = await pair('edit×edit', [
      { label: 'A', method: 'PUT', path: '/api/clients/S3AC-C064-EE-A', body: body('S3AC-C064-EE-A', 'S3AC AC-064 edit/edit A (synthetic)', 'S3AC-S064-EE-T') },
      { label: 'B', method: 'PUT', path: '/api/clients/S3AC-C064-EE-B', body: body('S3AC-C064-EE-B', 'S3AC AC-064 edit/edit B (synthetic)', 'S3AC-S064-EE-T') },
    ]);
    result.scenarios.editEdit.rows = summarize(result.scenarios.editEdit.listAfter, ['S3AC-C064-EE-A', 'S3AC-C064-EE-B']);

    result.scenarios.insertEdit = await pair('insert×edit', [
      { label: 'insert', method: 'POST', path: '/api/clients', body: body('S3AC-C064-IE-B', 'S3AC AC-064 insert/edit new B (synthetic)', 'S3AC-S064-IE-T') },
      { label: 'edit', method: 'PUT', path: '/api/clients/S3AC-C064-IE-A', body: body('S3AC-C064-IE-A', 'S3AC AC-064 insert/edit existing A (synthetic)', 'S3AC-S064-IE-T') },
    ]);
    result.scenarios.insertEdit.rows = summarize(result.scenarios.insertEdit.listAfter, ['S3AC-C064-IE-A', 'S3AC-C064-IE-B']);

    result.scenarios.raceIds = await pair('AC-030 race-001/RACE-001', [
      { label: 'lower', method: 'POST', path: '/api/clients', body: body('race-001', 'S3AC AC-030 concurrency lower-case (synthetic)', 'S3AC-S030R-1') },
      { label: 'upper', method: 'POST', path: '/api/clients', body: body('RACE-001', 'S3AC AC-030 concurrency upper-case (synthetic)', 'S3AC-S030R-2') },
    ]);
    result.scenarios.raceIds.rows = summarize(result.scenarios.raceIds.listAfter, ['race-001', 'RACE-001']);
    result.scenarios.raceIds.caseInsensitiveRows = result.scenarios.raceIds.listAfter.filter((r) => r.clientId.toUpperCase() === 'RACE-001').map((r) => r.clientId);

    // duplicate-allocation display check for any both-success source contention
    result.scenarios.duplicateDisplay = result.scenarios.insertInsert.listAfter
      .filter((r) => ['S3AC-C064-II-A', 'S3AC-C064-II-B'].includes(r.clientId))
      .map((r) => ({ clientId: r.clientId, raw: r.rawDataSourceIds, anomalies: r.dataSources.map((d) => ({ id: d.dataSourceId, anomalies: d.anomalies, conflicts: d.conflictClientIds })) }));
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
  } finally {
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    const brief = {};
    for (const [k, v] of Object.entries(result.scenarios)) {
      if (v && v.requests) brief[k] = v.requests.map((r) => ({ label: r.label, method: r.method, status: r.status, code: (() => { try { return JSON.parse(r.body).code; } catch (e) { return null; } })(), ms: r.tResp - r.tSend }));
    }
    console.log(JSON.stringify({ out: OUT, errors: result.errors.length, brief, raceIds: result.scenarios.raceIds && result.scenarios.raceIds.caseInsensitiveRows }));
  }
})();
