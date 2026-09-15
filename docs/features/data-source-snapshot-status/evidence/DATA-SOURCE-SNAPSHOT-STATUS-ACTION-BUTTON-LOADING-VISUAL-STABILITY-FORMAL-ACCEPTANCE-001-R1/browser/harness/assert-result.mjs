#!/usr/bin/env node
// R1 page-free strict acceptance-result CLI
// (DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001-R1).
//
// Purpose: make the PASS/FAIL verdict falsifiable by a REAL child-process exit code, with no browser,
// page or service running. It reuses the SAME evaluator as R0
// (browser/harness/assertions.mjs -> evaluateAcceptanceResult) by importing it from the R0 evidence
// directory; no judgement logic is copied here, so the two cannot drift.
//
// Contract:
//   - argv[2] is a path to an acceptance result JSON file.
//   - evaluateAcceptanceResult(result).passed === true   -> print a summary to stdout, exit 0.
//   - evaluateAcceptanceResult(result).passed === false  -> print every failure to stderr, exit 1.
//   - any usage/runtime error (no file, unreadable, invalid JSON) -> exit 2.
//
// Usage: node assert-result.mjs <acceptance-result.json>

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

// The R0 evidence directory sits one level up (sibling of this R1 directory). Resolve the evaluator
// relative to THIS file so the CLI works from any working directory.
const R0_HARNESS = resolve(
  HERE,
  '..', '..', '..',
  'DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001',
  'browser', 'harness', 'assertions.mjs',
)

const input = process.argv[2]
if (!input) {
  process.stderr.write('usage: node assert-result.mjs <acceptance-result.json>\n')
  process.exit(2)
}

let evaluatorSha256
let evaluateAcceptanceResult
try {
  const evaluatorSource = readFileSync(R0_HARNESS)
  evaluatorSha256 = createHash('sha256').update(evaluatorSource).digest('hex')
  ;({ evaluateAcceptanceResult } = await import(pathToFileURL(R0_HARNESS).href))
} catch (err) {
  process.stderr.write(`cannot load R0 evaluator ${R0_HARNESS}: ${err && err.message}\n`)
  process.exit(2)
}

let result
let inputSha256
try {
  const raw = readFileSync(input)
  inputSha256 = createHash('sha256').update(raw).digest('hex')
  result = JSON.parse(raw.toString('utf8'))
} catch (err) {
  process.stderr.write(`cannot read/parse input ${input}: ${err && err.message}\n`)
  process.exit(2)
}

const verdict = evaluateAcceptanceResult(result)

const header = [
  'R1 PAGE-FREE STRICT ACCEPTANCE-RESULT CLI',
  `input=${input}`,
  `input_sha256=${inputSha256}`,
  `evaluator=${R0_HARNESS}`,
  `evaluator_sha256=${evaluatorSha256}`,
  `passed=${verdict.passed}`,
  `failure_count=${verdict.failure_count}`,
  `check_count=${verdict.check_count}`,
]

if (verdict.passed === true) {
  process.stdout.write(header.join('\n') + '\n')
  process.stdout.write('RESULT=PASS (all hard assertions hold; no drift detected)\n')
  process.exit(0)
}

process.stderr.write(header.join('\n') + '\n')
process.stderr.write(`detected failures: ${verdict.failure_count}\n`)
for (const f of verdict.failures) {
  process.stderr.write(
    `  field=${f.field} | where=${f.where} | actual=${JSON.stringify(f.actual)} | expected=${JSON.stringify(f.expected)}\n`,
  )
}
process.stderr.write('RESULT=FAIL (falsified; see the failing fields above)\n')
process.exit(1)
