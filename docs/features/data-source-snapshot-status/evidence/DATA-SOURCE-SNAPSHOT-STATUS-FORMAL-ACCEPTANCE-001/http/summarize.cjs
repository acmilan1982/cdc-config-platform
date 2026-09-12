// Summarize captured GET /list responses into stable, comparable lines.
// Read-only: parses JSON files only.
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
const rows = [];
for (const f of files) {
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { rows.push([f, 'PARSE_ERROR', '']); continue; }
  const d = j.data || {};
  const recs = d.records || [];
  const cands = d.candidates || {};
  const clients = cands.clients || [];
  const sources = cands.sources || [];
  const statuses = cands.statuses || [];
  const cat = recs.reduce((a, r) => { a[r.statusCategory] = (a[r.statusCategory] || 0) + 1; return a; }, {});
  const clientStates = recs.reduce((a, r) => { const s = (r.clientRef || {}).state; a[s] = (a[s] || 0) + 1; return a; }, {});
  const sourceStates = recs.reduce((a, r) => { const s = (r.sourceRef || {}).state; a[s] = (a[s] || 0) + 1; return a; }, {});
  const nullSeen = recs.filter((r) => r.snapshotLastSeenAt === null).length;
  const nullCompleted = recs.filter((r) => r.snapshotCompletedAt === null).length;
  rows.push([
    f.replace(/\.json$/, ''),
    `code=${j.code} msg=${JSON.stringify(j.message)} records=${recs.length}`,
    `cat=${JSON.stringify(cat)} clientState=${JSON.stringify(clientStates)} sourceState=${JSON.stringify(sourceStates)} nullSeen=${nullSeen} nullCompleted=${nullCompleted}`,
    `candClients=${clients.length} candSources=${sources.length} statuses=${JSON.stringify(statuses)}`,
  ]);
}
const out = rows.map((r) => r.join(' | ')).join('\n') + '\n';
fs.writeFileSync(path.join(dir, 'SUMMARY.txt'), out);
process.stdout.write(out);
