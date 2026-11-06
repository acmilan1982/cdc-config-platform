#!/usr/bin/env node
/*
 * CLIENT-CONFIG-DIALOG-ACCEPTANCE-005 — Probe C (fixed Git-range audit for AC-134).
 *
 * Read-only. Defines a fixed range from the parent of the first client-config
 * implementation commit through the task baseline, attributes every commit whose
 * subject belongs to the client-config feature, and records which files fall
 * outside the feature-owned paths.
 *
 * No network and no writes outside results/ac134-git-audit.json.
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const REPO = '/agent/cdc-config-platform'
const BASE_REF = '3d4cec1^'
const HEAD_REF = '9b1bf9f'
const OUT = path.resolve(__dirname, '..', 'results', 'ac134-git-audit.json')

const OWNED = [
  'docs/features/client-config/',
  'frontend/src/views/client-config/',
  'backend/src/main/java/com/bsoft/cdcconfig/clientconfig/',
  'backend/src/test/java/com/bsoft/cdcconfig/clientconfig/',
  'frontend/src/api/clientConfig.ts',
  'frontend/src/api/clientConfig.spec.ts',
  'frontend/src/types/clientConfig.ts',
  'frontend/src/config/menu.ts',
  'frontend/src/config/menu.spec.ts',
  'frontend/src/router/index.ts',
]

const CATEGORY = [
  { re: /^docs\/baseline\/create-edit-dialog-visual-template\//, label: 'create-edit-dialog-template-doc (approved first-adoption round)' },
  { re: /^docs\/baseline\/README\.md$/, label: 'baseline-index (approved first-adoption round)' },
  { re: /^frontend\/src\/styles\/dialog\/create-edit-dialog-visual\.spec\.ts$/, label: 'dialog-preset-spec (approved first-adoption round)' },
  { re: /^docs\/baseline\/list-table-visual-template\//, label: 'list-table-template-doc (template-side rounds)' },
  { re: /^frontend\/src\/styles\/list-table\/list-table-visual\.(css|spec\.ts)$/, label: 'list-table-preset-optin (approved template-side round)' },
  { re: /^docs\/baseline\/query-list-page-template\/MIGRATION\.md$/, label: 'query-list-template-migration-doc (page migration status only)' },
]

function git(args) {
  return execSync(`git ${args}`, { cwd: REPO, encoding: 'utf8' })
}

const base = git(`rev-parse ${BASE_REF}`).trim()
const head = git(`rev-parse ${HEAD_REF}`).trim()
const isOwned = (f) => OWNED.some((p) => f === p || f.startsWith(p))
const isClientConfigCommit = (subject) => /client-config|CLIENT-CONFIG/i.test(subject)
const isDbDefinition = (f) => /\.(sql|ddl)$/i.test(f) || /(^|\/)db\//.test(f)

const log = git(`log --format=%H%x09%s ${base}..${head}`).trim().split('\n').filter(Boolean)
const commits = []
for (const line of log) {
  const [sha, ...rest] = line.split('\t')
  const subject = rest.join('\t')
  if (!isClientConfigCommit(subject)) continue
  const files = git(`show --name-only --format= ${sha}`).trim().split('\n').filter(Boolean)
  const outside = files.filter((f) => !isOwned(f))
  commits.push({
    sha: sha.slice(0, 7),
    subject: subject.slice(0, 120),
    fileCount: files.length,
    outsideOwned: outside.map((f) => {
      const cat = CATEGORY.find((c) => c.re.test(f))
      return { file: f, category: cat ? cat.label : 'UNCLASSIFIED' }
    }),
  })
}

const unclassified = commits.flatMap((c) => c.outsideOwned.filter((f) => f.category === 'UNCLASSIFIED').map((f) => ({ commit: c.sha, file: f.file })))
const allOutside = commits.flatMap((c) => c.outsideOwned.map((f) => ({ commit: c.sha, ...f })))

const result = {
  meta: {
    probe: 'probeC-git-audit',
    purpose: 'AC-134 fixed-range audit: reference page / other features / global components / backend / DB definitions / two templates',
    repo: REPO,
    startedAt: new Date().toISOString(),
  },
  range: { baseRef: BASE_REF, baseCommit: base, headRef: HEAD_REF, headCommit: head },
  ownedPaths: OWNED,
  clientConfigCommitCount: commits.length,
  clientConfigCommits: commits,
  outsideOwnedFiles: allOutside,
  unclassifiedOutsideFiles: unclassified,
  checks: {
    referencePageTouchedByClientConfig: allOutside.filter((f) => /data-source/i.test(f.file)),
    otherFeatureTouchedByClientConfig: allOutside.filter((f) => /^docs\/features\//.test(f.file) && !f.file.startsWith('docs/features/client-config/')),
    globalComponentsTouchedByClientConfig: allOutside.filter((f) => /^frontend\/src\/components\//.test(f.file)),
    backendOutsideClientConfigTouchedByClientConfig: allOutside.filter((f) => /^backend\//.test(f.file)),
    dbDefinitionTouchedByClientConfig: allOutside.filter((f) => isDbDefinition(f.file)),
    productWorktreeDiffSinceBaseline: git(`diff --stat ${head} -- backend frontend`).trim(),
  },
  note: 'Client-config commits that touch shared-template paths are limited to (a) the approved create-edit-dialog first-adoption documentation/spec round and (b) the approved list-table opt-in round whose CSS diff adds only .lt-main-table-scoped opt-in classes without new --lt-* tokens, global overrides or !important.',
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(result, null, 2))
console.log(JSON.stringify({ commits: result.clientConfigCommitCount, outsideOwned: allOutside.length, unclassified: unclassified.length, checks: result.checks }, null, 2))
